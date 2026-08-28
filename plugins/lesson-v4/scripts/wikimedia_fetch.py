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
    return re.sub(r"[\\s-]+", " ", (value or "").strip().casefold())


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


def search_commons(query, reserve, thumb_width=800):
    params = {"action": "query", "generator": "search", "gsrsearch": f"{query} filetype:bitmap|drawing", "gsrnamespace": "6", "gsrlimit": str(min(max(reserve, 10), MAX_SEARCH_LIMIT)), "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": str(thumb_width), "format": "json"}
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
            "licence_url": _strip_html(meta.get("LicenseUrl", {}).get("value", "")),
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
    try: results = search_commons(args.query, requested * RESERVE_MULTIPLIER)
    except SourceFailure as exc:
        _atomic_write(summary_path, {"query": args.query, "source": SOURCE, "round": args.round, "complete": False, "requested_count": requested, "returned_candidate_count": 0, "download_failure_count": 0, "failure_kind": exc.failure_kind, "error": str(exc), "results": []}, "w")
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
    complete = len(downloaded) >= requested or len(downloaded) == len(results)
    _atomic_write(summary_path, {"query": args.query, "source": SOURCE, "round": args.round, "complete": bool(complete), "requested_count": requested, "returned_candidate_count": len(results), "download_failure_count": failures, "failure_kind": None if complete else "transport", "error": None if complete else "one or more candidate downloads failed", "results": downloaded}, "w")
    print(f"Summary saved to: {summary_path}")
    if not complete: raise SystemExit(1)


if __name__ == "__main__": main()
