#!/usr/bin/env python3
"""Search Wikimedia Commons once and write licensed image evidence."""
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
import python_extras  # noqa: F401,E402 - the plugin's own installed libraries

USER_AGENT = "lesson-resources-image-scout/2.0 (https://github.com/DynoDS/teaching-plugins; educational lesson-generation tool)"
DEFAULT_OUTPUT = os.path.expanduser("~/Pictures/wikimedia-fetch")
SOURCE = "wikimedia"
RESERVE_MULTIPLIER = 3
MAX_SEARCH_LIMIT = 50
NETWORK_TIMEOUT_SECONDS = 20


class SourceFailure(Exception):
    def __init__(self, message, failure_kind="transport"):
        super().__init__(message)
        self.failure_kind = failure_kind


def _normalise_licence(value: str) -> str:
    # The character class needs a real backslash-s, not an escaped backslash:
    # with the backslash doubled the class matched the LETTER s, so
    # "CC BY-SA 4.0" normalised to "cc by a 4.0" and "ShareAlike" to
    # "harealike". Restrictive licences still happened to be caught, but no
    # licence name could be looked up by its normalised form.
    return re.sub(r"[\s_-]+", " ", (value or "").strip().casefold())


# Commons does not publish a LicenseUrl for every licence it names. Public-domain
# marks in particular usually carry a name and no URL, and every stage downstream
# requires a URL - so a scout that found a perfectly usable public-domain image
# had to supply one from somewhere, which means typing a licence URL that was not
# in the metadata. Inventing provenance to satisfy a provenance check is the one
# thing this pipeline must not do, so the canonical URL each of these licences
# publishes for itself is recorded here and filled in when Commons omits it. The
# licence still comes from Commons; only its address is supplied.
CANONICAL_LICENCE_URLS = {
    "public domain": "https://creativecommons.org/publicdomain/mark/1.0/",
    "public domain mark": "https://creativecommons.org/publicdomain/mark/1.0/",
    "pd": "https://creativecommons.org/publicdomain/mark/1.0/",
    "pdm": "https://creativecommons.org/publicdomain/mark/1.0/",
    "cc0": "https://creativecommons.org/publicdomain/zero/1.0/",
    "cc 0": "https://creativecommons.org/publicdomain/zero/1.0/",
    "cc by 2.0": "https://creativecommons.org/licenses/by/2.0/",
    "cc by 2.5": "https://creativecommons.org/licenses/by/2.5/",
    "cc by 3.0": "https://creativecommons.org/licenses/by/3.0/",
    "cc by 4.0": "https://creativecommons.org/licenses/by/4.0/",
    "cc by sa 2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
    "cc by sa 2.5": "https://creativecommons.org/licenses/by-sa/2.5/",
    "cc by sa 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
    "cc by sa 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
}


def canonical_licence_url(licence_name):
    """The URL a named licence publishes for itself, or '' when there isn't one."""
    normal = _normalise_licence(licence_name)
    if normal in CANONICAL_LICENCE_URLS:
        return CANONICAL_LICENCE_URLS[normal]
    # "Public Domain (PD-old-100)" and friends: a public-domain designation with
    # a qualifier after it, which the mark's own URL still describes.
    if normal.startswith("public domain") or normal.startswith("pd ") or normal.startswith("pdm "):
        return CANONICAL_LICENCE_URLS["public domain"]
    return ""


def is_allowed_licence(licence_name):
    """Allow only PD/CC0/attribution/ShareAlike; reject restrictive tokens first."""
    normal = _normalise_licence(licence_name)
    if not normal:
        return False
    restrictive = ("nc", "nd", "noncommercial", "non commercial", "no derivatives", "no derivative", "noderivatives", "noderivative")
    tokens = set(normal.split())
    if any(token in tokens for token in restrictive) or any(token in normal for token in restrictive[2:]):
        return False
    allowed = (normal.startswith("public domain") or normal == "pd" or normal.startswith("pd ")
               or normal == "pdm" or normal.startswith("pdm ")
               or normal.startswith(("cc0", "cc 0", "cc by", "cc attribution", "creative commons attribution", "attribution")))
    if not allowed:
        return False
    return True


# Commons ANDs every word of a search, so each extra word is another filter. A
# scout asking for "Manaus Rio Negro riverfront" got zero results while "Manaus
# Rio Negro" has thousands; "Iquitos Peru Amazon river port boats buildings" got
# zero while "Iquitos port" has 2,394. These are the words that describe how a
# picture should look rather than what it is of, so they are the first to go
# when a query finds nothing.
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
    nothing. Only words are removed; nothing is added or reworded."""
    words = [word for word in str(query).split() if word]
    forms = []
    without_descriptors = [w for w in words if w.lower().strip(",.") not in DESCRIPTOR_WORDS]
    if without_descriptors and without_descriptors != words:
        forms.append(" ".join(without_descriptors))
    base = without_descriptors or words
    # The proper nouns are what the picture is OF: a place, a river, a people.
    proper = []
    for w in base:
        if w[:1].isupper() and w.lower() not in {p.lower() for p in proper}:
            proper.append(w)
    if proper and proper != base:
        forms.append(" ".join(proper))
    # Last resort: the two most specific words, which for a place query is the
    # place and the thing.
    if len(base) > 2:
        forms.append(" ".join(base[:2]))
    ordered = []
    for form in forms:
        if form and form != query and form not in ordered:
            ordered.append(form)
    return ordered


def search_commons(query, reserve, thumb_width=800):
    """Search Commons, and when a query finds too little, search again with the
    same words minus the ones that only describe how the picture should look.

    Returns (results, queries_run). The caller records every query it ran, so a
    zero-result round is visibly a query problem rather than an absent subject.
    """
    queries = [query] + relax(query)
    run = []
    results = []
    for attempt in queries:
        run.append(attempt)
        results = search_commons_once(attempt, reserve, thumb_width)
        # Enough to choose from. A handful of hits on a long query is usually
        # the wrong handful, so a thin result is relaxed like an empty one.
        if len(results) >= max(reserve, 6):
            break
    return results, run


def search_commons_once(query, reserve, thumb_width=800):
    # Ask for far more than will be downloaded. Commons ranks a long, richly
    # described NASA or ESA file above an ordinary ground photograph, so the top
    # three for "Sahara Desert wide landscape" were all satellite imagery while
    # a usable Algerian Sahara photo sat at rank eight, unseen.
    params = {"action": "query", "generator": "search", "gsrsearch": f"{query} filetype:bitmap|drawing", "gsrnamespace": "6", "gsrlimit": str(min(max(reserve * 2, 30), MAX_SEARCH_LIMIT)), "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": str(thumb_width), "format": "json"}
    request = urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params), headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=NETWORK_TIMEOUT_SECONDS) as response:
            data = json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        kind = "auth" if exc.code in (401, 403) else "rate_limit" if exc.code == 429 else "transport"
        raise SourceFailure(f"Wikimedia Commons API returned {exc.code}: {exc.reason}", kind) from exc
    except urllib.error.URLError as exc:
        raise SourceFailure(f"could not reach Wikimedia Commons: {exc.reason}", "transport") from exc
    except ValueError as exc:
        raise SourceFailure(f"Wikimedia Commons returned unreadable JSON: {exc}", "transport") from exc
    # A socket timeout is NOT a URLError.
    #
    # `urllib` wraps a failure to CONNECT in URLError, but a gateway that
    # accepts the connection and then does not answer raises a bare
    # `TimeoutError` (which `socket.timeout` is an alias for) straight out of
    # the read. It is an OSError, never a URLError, so it fell past all three
    # handlers above and killed the process with a traceback - and a fetcher
    # that dies writes no summary at all.
    #
    # That is worse than a recorded failure. The picture validator proves
    # `real_source_unavailable` from a recorded incomplete step; with no
    # summary the step is invisible rather than failed, and NO terminal row
    # validates, so a lesson loses every picture including the ones a later
    # rung already found. A Year 4 history deck lost all four that way while
    # Openverse returned 504s at about 60 seconds against a 25-second timeout
    # (5 September 2026).
    #
    # OSError is last because both HTTPError and URLError are subclasses of it.
    except OSError as exc:
        raise SourceFailure(f"could not reach Wikimedia Commons: {exc}", "transport") from exc
    pages = data.get("query", {}).get("pages", {})
    output = []
    for page in pages.values() if isinstance(pages, dict) else pages:
        info_list = page.get("imageinfo") or []
        if not info_list: continue
        info = info_list[0]; meta = info.get("extmetadata", {})
        licence = meta.get("LicenseShortName", {}).get("value", "")
        if not is_allowed_licence(licence): continue
        title = page.get("title", "")
        output.append({
            "title": title,
            "thumb_url": info.get("thumburl") or info.get("url"),
            "page_url": info.get("descriptionurl", ""),
            "artist": _strip_html(meta.get("Artist", {}).get("value", "")) or "Unknown",
            "description": (_strip_html(meta.get("ImageDescription", {}).get("value", "")) or title.replace("File:", ""))[:500],
            "licence": licence,
            "licence_url": _strip_html(meta.get("LicenseUrl", {}).get("value", "")) or canonical_licence_url(licence),
            "width": info.get("width"), "height": info.get("height"),
        })
    return output


def _strip_html(text):
    return re.sub(r"<[^>]+>", "", text or "").strip()


def sanitize_filename(text):
    return "".join(c if c.isalnum() or c in " -_" else "_" for c in text)[:60].strip()


def _atomic_write(path, value, mode="wb"):
    path = os.path.abspath(path); os.makedirs(os.path.dirname(path), exist_ok=True)
    encoding = "utf-8" if "b" not in mode else None
    handle = tempfile.NamedTemporaryFile(mode, dir=os.path.dirname(path), delete=False, suffix=".part", encoding=encoding)
    try:
        if mode == "wb": handle.write(value)
        else: json.dump(value, handle, indent=2, ensure_ascii=False); handle.write("\n")
        handle.flush(); os.fsync(handle.fileno()); handle.close(); os.replace(handle.name, path)
    except BaseException:
        handle.close();
        if os.path.exists(handle.name): os.unlink(handle.name)
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
    candidate_id = item.get("title", f"candidate-{index}")
    return {"candidate_id": candidate_id, "sha256": hashlib.sha256(raw).hexdigest(), "byte_count": len(raw), "width": width, "height": height, "decoded_format": decoded, "source": SOURCE, "source_page_url": item.get("page_url", ""), "creator": item.get("artist", "Unknown"), "licence_name": item.get("licence", ""), "licence_url": item.get("licence_url", ""), "description": item.get("description", ""), "path": str(path)}


def summary_path_for(output_dir, round_number):
    return os.path.join(output_dir, f"_search-summary-{SOURCE}-r{round_number}.json")


def main():
    parser = argparse.ArgumentParser(description="Fetch licensed images from Wikimedia Commons")
    parser.add_argument("query"); parser.add_argument("--count", type=int, default=3); parser.add_argument("--round", type=int, default=1, choices=(1, 2)); parser.add_argument("--output", default=DEFAULT_OUTPUT)
    args = parser.parse_args(); os.makedirs(args.output, exist_ok=True); requested = max(args.count, 1); summary_path = summary_path_for(args.output, args.round)
    queries_run = [args.query]
    try: results, queries_run = search_commons(args.query, requested * RESERVE_MULTIPLIER)
    except SourceFailure as exc:
        _atomic_write(summary_path, {"query": args.query, "queries_run": queries_run, "source": SOURCE, "round": args.round, "complete": False, "requested_count": requested, "returned_candidate_count": 0, "download_failure_count": 0, "failure_kind": exc.failure_kind, "error": str(exc), "results": [], "considered": []}, "w")
        print(f"ERROR: {exc}"); raise SystemExit(1)
    downloaded = []; failures = 0; slug = sanitize_filename(args.query)
    for index, item in enumerate(results, 1):
        if len(downloaded) >= requested: break
        if not item.get("thumb_url"): failures += 1; continue
        suffix = Path(urllib.parse.urlparse(item["thumb_url"]).path).suffix or ".jpg"
        dest = Path(args.output) / f"{slug}_{index}_{sanitize_filename(item.get('title', 'candidate'))}{suffix}"
        try: download_image(item["thumb_url"], dest); downloaded.append(candidate_metadata(dest, item, index))
        except Exception:
            failures += 1
            try: dest.unlink()
            except OSError: pass
    # Every candidate the search returned, downloaded or not, so a scout that
    # finds the top three unusable can see there was a fourth and search for
    # it by name instead of reporting the subject as unavailable.
    considered = [
        {
            "candidate_id": item.get("title"),
            "page_url": item.get("page_url"),
            "creator": item.get("artist"),
            "licence_name": item.get("licence"),
            "description": (item.get("description") or "")[:220],
            "downloaded": any(row.get("candidate_id") == item.get("title") for row in downloaded),
        }
        for item in results
    ]
    complete = len(downloaded) >= requested or len(downloaded) == len(results)
    _atomic_write(summary_path, {"query": args.query, "queries_run": queries_run, "source": SOURCE, "round": args.round, "complete": bool(complete), "requested_count": requested, "returned_candidate_count": len(results), "download_failure_count": failures, "failure_kind": None if complete else "transport", "error": None if complete else "one or more candidate downloads failed", "results": downloaded, "considered": considered}, "w")
    print(f"Summary saved to: {summary_path}")
    if not complete: raise SystemExit(1)


if __name__ == "__main__": main()
