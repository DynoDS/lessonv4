#!/usr/bin/env python3
"""Search Openverse once and write licensed image evidence.

Openverse (openverse.org, run by the WordPress Foundation, formerly Creative
Commons Search) indexes around 800 million openly-licensed images across about
a hundred sources at once: Flickr Commons, where museums, city archives and
record offices publish their photograph collections, the Science Museum Group,
the Smithsonian, Europeana, university and library collections, NASA, and
Wikimedia itself.

It is here because Unsplash and Wikimedia together are a narrow shelf, and the
thing they are narrowest on is exactly what a history or geography lesson needs:
a real photograph of a real place at a real date. A Year 4 lesson on children's
lives (3 September 2026) lost its slides, its worksheet and its answer key
because no classroom photograph from around 1900 could be found on those two
sources. Openverse answers that query with school photographs from the Black
Country Living Museum and a 1900 science lesson from a city archive.

Every result arrives with its licence, its creator and a link to the page it
came from, so this route needs no licence judgement from anybody. The API is
free and takes no key; an anonymous caller gets 20 searches a minute and 200 a
day, which is far more than a run consumes.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

USER_AGENT = "lesson-resources-image-scout/2.0 (https://github.com/DynoDS/lessonv4; educational lesson-generation tool)"
DEFAULT_OUTPUT = os.path.expanduser("~/Pictures/openverse-fetch")
API = "https://api.openverse.org/v1/images/"
SOURCE = "openverse"
RESERVE_MULTIPLIER = 3
MAX_PAGE_SIZE = 40
NETWORK_TIMEOUT_SECONDS = 25


class SourceFailure(Exception):
    def __init__(self, message, failure_kind="transport"):
        super().__init__(message)
        self.failure_kind = failure_kind


# Openverse names a licence in its own short codes rather than in prose: `by`,
# `by-sa`, `cc0`, `pdm`, and the restricted `by-nc`, `by-nd`, `by-nc-sa`,
# `by-nc-nd`. The set allowed here is the same set Wikimedia's route allows -
# public domain, CC0, attribution and share-alike - so one rule covers every
# real source and a picture cannot become more restricted by arriving through a
# different door.
ALLOWED_LICENCE_CODES = {"cc0", "pdm", "by", "by-sa"}
CANONICAL_LICENCE_URLS = {
    "cc0": "https://creativecommons.org/publicdomain/zero/1.0/",
    "pdm": "https://creativecommons.org/publicdomain/mark/1.0/",
}


def is_allowed_licence(code: str) -> bool:
    normal = re.sub(r"[\s_]+", "-", (code or "").strip().casefold())
    if not normal:
        return False
    parts = set(normal.split("-"))
    if "nc" in parts or "nd" in parts:
        return False
    return normal in ALLOWED_LICENCE_CODES


def licence_name(code: str, version: str) -> str:
    """The licence as a person would write it, from what Openverse returned."""
    normal = (code or "").strip().casefold()
    if normal == "cc0":
        return f"CC0 {version}".strip()
    if normal == "pdm":
        return "Public Domain Mark 1.0" if not version else f"Public Domain Mark {version}"
    return f"CC {normal.upper()} {version}".strip()


def licence_url(code: str, version: str, given: str) -> str:
    """Openverse publishes a licence URL for nearly every result. When it omits
    one, use the address the named licence publishes for itself - the licence
    still comes from Openverse and only its address is supplied, exactly as the
    Wikimedia route does. A licence URL is never guessed from memory."""
    if given:
        return given
    normal = (code or "").strip().casefold()
    if normal in CANONICAL_LICENCE_URLS:
        return CANONICAL_LICENCE_URLS[normal]
    if normal and version:
        return f"https://creativecommons.org/licenses/{normal}/{version}/"
    return ""


# Openverse ranks on relevance across every word, so a long descriptive query
# narrows hard in the same way Commons does. These are the words that say how a
# picture should look rather than what it is of, and they are the first to go.
DESCRIPTOR_WORDS = {
    "a", "an", "and", "at", "in", "into", "of", "on", "the", "with",
    "aerial", "background", "big", "broad", "close", "closeup", "colour", "color",
    "detail", "distant", "far", "front", "ground", "high", "image", "large",
    "level", "look", "looking", "near", "open", "panorama", "panoramic",
    "photo", "photograph", "picture", "scene", "scenery", "shot", "showing",
    "side", "standing", "typical", "view", "viewed", "wide", "wider",
}


def relax(query):
    """Shorter forms of a query, most specific first, for a search that found
    too little. Only words are removed; nothing is added or reworded."""
    words = [word for word in str(query).split() if word]
    forms = []
    without_descriptors = [w for w in words if w.lower().strip(",.") not in DESCRIPTOR_WORDS]
    if without_descriptors and without_descriptors != words:
        forms.append(" ".join(without_descriptors))
    base = without_descriptors or words
    proper = []
    for word in base:
        if word[:1].isupper() and word.lower() not in {p.lower() for p in proper}:
            proper.append(word)
    if proper and proper != base:
        forms.append(" ".join(proper))
    if len(base) > 2:
        forms.append(" ".join(base[:2]))
    ordered = []
    for form in forms:
        if form and form != query and form not in ordered:
            ordered.append(form)
    return ordered


def search_openverse(query, reserve):
    """Search Openverse, relaxing a query that found too little, and return
    (results, queries_run) so a thin round is visibly a query problem rather
    than an absent subject."""
    queries = [query] + relax(query)
    run = []
    results = []
    for attempt in queries:
        run.append(attempt)
        results = search_openverse_once(attempt, reserve)
        if len(results) >= max(reserve, 6):
            break
    return results, run


def search_openverse_once(query, reserve):
    params = {
        "q": query,
        "page_size": str(min(max(reserve * 2, 20), MAX_PAGE_SIZE)),
        # Ask the API for the licences this route accepts rather than filtering
        # a page of mostly-rejected results afterwards: a page of NC-only hits
        # would otherwise read as "the subject does not exist".
        "license": ",".join(sorted(ALLOWED_LICENCE_CODES)),
        "mature": "false",
    }
    request = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=NETWORK_TIMEOUT_SECONDS) as response:
            data = json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        kind = "auth" if exc.code in (401, 403) else "rate_limit" if exc.code == 429 else "transport"
        raise SourceFailure(f"Openverse API returned {exc.code}: {exc.reason}", kind) from exc
    except urllib.error.URLError as exc:
        raise SourceFailure(f"could not reach Openverse: {exc.reason}", "transport") from exc
    except ValueError as exc:
        raise SourceFailure(f"Openverse returned unreadable JSON: {exc}", "transport") from exc

    output = []
    for item in data.get("results", []) or []:
        if not isinstance(item, dict):
            continue
        code = item.get("license", "")
        if not is_allowed_licence(code):
            continue
        image_url = item.get("url") or item.get("thumbnail")
        if not image_url:
            continue
        version = str(item.get("license_version") or "")
        output.append({
            "identifier": item.get("id", ""),
            "title": item.get("title", "") or "",
            "image_url": image_url,
            "page_url": item.get("foreign_landing_url", "") or "",
            "creator": (item.get("creator") or "").strip() or "Unknown",
            "provider": item.get("source") or item.get("provider") or "",
            "description": ((item.get("title") or "") + " - " + (item.get("source") or ""))[:500],
            "licence": licence_name(code, version),
            "licence_url": licence_url(code, version, item.get("license_url") or ""),
            "width": item.get("width"),
            "height": item.get("height"),
        })
    return output


def sanitize_filename(text):
    return "".join(c if c.isalnum() or c in " -_" else "_" for c in text)[:60].strip()


def _atomic_write(path, value, mode="wb"):
    path = os.path.abspath(path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    encoding = "utf-8" if "b" not in mode else None
    handle = tempfile.NamedTemporaryFile(mode, dir=os.path.dirname(path), delete=False, suffix=".part", encoding=encoding)
    try:
        if mode == "wb":
            handle.write(value)
        else:
            json.dump(value, handle, indent=2, ensure_ascii=False)
            handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
        handle.close()
        os.replace(handle.name, path)
    except BaseException:
        handle.close()
        if os.path.exists(handle.name):
            os.unlink(handle.name)
        raise


def download_image(url, dest_path):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=NETWORK_TIMEOUT_SECONDS) as response:
        data = response.read()
    _atomic_write(dest_path, data)


def decode_info(path):
    try:
        from PIL import Image
    except ImportError as exc:
        raise ValueError(f"Pillow is required to decode downloaded candidates: {exc}") from exc
    try:
        with Image.open(path) as probe:
            decoded_format = str(probe.format or "").upper()
            probe.verify()
        with Image.open(path) as image:
            image.load()
            width, height = image.size
    except Exception as exc:
        raise ValueError(f"download did not decode as a complete raster image: {exc}") from exc
    if width <= 0 or height <= 0 or not decoded_format:
        raise ValueError("download has invalid decoded image metadata")
    return width, height, decoded_format


def candidate_metadata(path: Path, item: dict, index: int) -> dict:
    width, height, decoded = decode_info(path)
    raw = path.read_bytes()
    candidate_id = item.get("identifier") or item.get("title") or f"candidate-{index}"
    return {
        "candidate_id": candidate_id,
        "sha256": hashlib.sha256(raw).hexdigest(),
        "byte_count": len(raw),
        "width": width,
        "height": height,
        "decoded_format": decoded,
        "source": SOURCE,
        "source_page_url": item.get("page_url", ""),
        "creator": item.get("creator", "Unknown"),
        "licence_name": item.get("licence", ""),
        "licence_url": item.get("licence_url", ""),
        "description": item.get("description", ""),
        "path": str(path),
    }


def summary_path_for(output_dir, round_number):
    return os.path.join(output_dir, f"_search-summary-{SOURCE}-r{round_number}.json")


def main():
    parser = argparse.ArgumentParser(description="Fetch openly licensed images from Openverse")
    parser.add_argument("query")
    parser.add_argument("--count", type=int, default=3)
    parser.add_argument("--round", type=int, default=1, choices=(1, 2))
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    os.makedirs(args.output, exist_ok=True)
    requested = max(args.count, 1)
    summary_path = summary_path_for(args.output, args.round)
    queries_run = [args.query]

    try:
        results, queries_run = search_openverse(args.query, requested * RESERVE_MULTIPLIER)
    except SourceFailure as exc:
        _atomic_write(summary_path, {
            "query": args.query, "queries_run": queries_run, "source": SOURCE, "round": args.round,
            "complete": False, "requested_count": requested, "returned_candidate_count": 0,
            "download_failure_count": 0, "failure_kind": exc.failure_kind, "error": str(exc),
            "results": [], "considered": [],
        }, "w")
        print(f"ERROR: {exc}")
        raise SystemExit(1)

    downloaded = []
    failures = 0
    slug = sanitize_filename(args.query)
    for index, item in enumerate(results, 1):
        if len(downloaded) >= requested:
            break
        suffix = Path(urllib.parse.urlparse(item["image_url"]).path).suffix or ".jpg"
        if suffix.lower() not in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".tif", ".tiff"}:
            suffix = ".jpg"
        dest = Path(args.output) / f"{slug}_{index}_{sanitize_filename(item.get('title', 'candidate'))}{suffix}"
        try:
            download_image(item["image_url"], dest)
            downloaded.append(candidate_metadata(dest, item, index))
        except Exception:
            failures += 1
            try:
                dest.unlink()
            except OSError:
                pass

    # Every candidate the search returned, downloaded or not, so a scout that
    # finds the top three unusable can see there was a fourth and search for it
    # by name instead of reporting the subject as unavailable.
    considered = [
        {
            "candidate_id": item.get("identifier") or item.get("title"),
            "page_url": item.get("page_url"),
            "creator": item.get("creator"),
            "licence_name": item.get("licence"),
            "description": (item.get("description") or "")[:220],
            "downloaded": any(row.get("candidate_id") == (item.get("identifier") or item.get("title")) for row in downloaded),
        }
        for item in results
    ]
    complete = len(downloaded) >= requested or len(downloaded) == len(results)
    _atomic_write(summary_path, {
        "query": args.query, "queries_run": queries_run, "source": SOURCE, "round": args.round,
        "complete": bool(complete), "requested_count": requested,
        "returned_candidate_count": len(results), "download_failure_count": failures,
        "failure_kind": None if complete else "transport",
        "error": None if complete else "one or more candidate downloads failed",
        "results": downloaded, "considered": considered,
    }, "w")
    print(f"Summary saved to: {summary_path}")
    if not complete:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
