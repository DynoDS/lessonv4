#!/usr/bin/env python3
"""Search Unsplash once and write isolated, mechanically checked evidence."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import tempfile
import urllib.error
import urllib.parse
import urllib.request

ENV_FILE = os.path.expanduser("~/.env.unsplash")
DEFAULT_OUTPUT = os.path.expanduser("~/Pictures/unsplash-fetch")
SOURCE = "unsplash"
RESERVE_MULTIPLIER = 3
MAX_PER_PAGE = 30
NETWORK_TIMEOUT_SECONDS = 20
LICENSE_NAME = "Unsplash License"
LICENSE_URL = "https://unsplash.com/license"


class SourceFailure(Exception):
    def __init__(self, message, failure_kind="transport"):
        super().__init__(message)
        self.failure_kind = failure_kind


def load_api_key():
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, encoding="utf-8") as handle:
            for line in handle:
                if line.strip().startswith("UNSPLASH_ACCESS_KEY="):
                    value = line.split("=", 1)[1].strip()
                    if value and value != "your_access_key_here":
                        return value
    value = os.environ.get("UNSPLASH_ACCESS_KEY", "")
    if value:
        return value
    raise SourceFailure(f"No Unsplash access key found. Add it to {ENV_FILE}.", "auth")


def search_unsplash(query, access_key, reserve, orientation=None):
    params = {"query": query, "per_page": min(max(reserve, 1), MAX_PER_PAGE), "order_by": "relevant"}
    if orientation in {"landscape", "portrait", "squarish"}:
        params["orientation"] = orientation
    url = "https://api.unsplash.com/search/photos?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"Authorization": f"Client-ID {access_key}", "Accept-Version": "v1"})
    try:
        with urllib.request.urlopen(request, timeout=NETWORK_TIMEOUT_SECONDS) as response:
            data = json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        kind = "auth" if exc.code in (401, 403) else "rate_limit" if exc.code == 429 else "transport"
        raise SourceFailure(f"Unsplash API returned {exc.code}: {exc.reason}", kind) from exc
    except urllib.error.URLError as exc:
        raise SourceFailure(f"could not reach Unsplash: {exc.reason}", "transport") from exc
    except ValueError as exc:
        raise SourceFailure(f"Unsplash returned unreadable JSON: {exc}", "transport") from exc
    # A socket timeout is NOT a URLError.
    #
    # `urllib` wraps a failure to CONNECT in URLError, but a gateway that
    # accepts the connection and then does not answer raises a bare
    # `TimeoutError` (which `socket.timeout` is an alias for) straight out of
    # the read. It is an OSError, never a URLError, so it fell past all three
    # handlers below and killed the process with a traceback - and a fetcher
    # that dies writes no summary at all.
    #
    # That is worse than a recorded failure. The picture validator proves
    # `real_source_unavailable` from a recorded incomplete step; with no
    # summary the step is invisible rather than failed, and NO terminal row
    # validates, so a lesson loses every picture including the ones a later
    # rung already found. A Year 4 history deck lost all four that way while
    # Openverse returned 504s at about 60 seconds against this 25-second
    # timeout (5 September 2026).
    #
    # OSError is last because both HTTPError and URLError are subclasses of it.
    except OSError as exc:
        raise SourceFailure(f"could not reach Unsplash: {exc}", "transport") from exc
    return data.get("results", [])


def trigger_download(photo_id, access_key):
    request = urllib.request.Request(f"https://api.unsplash.com/photos/{photo_id}/download", headers={"Authorization": f"Client-ID {access_key}", "Accept-Version": "v1"})
    try:
        urllib.request.urlopen(request, timeout=NETWORK_TIMEOUT_SECONDS).close()
    except Exception:
        pass


def _atomic_write(path, data, mode="wb"):
    path = os.path.abspath(path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    encoding = "utf-8" if "b" not in mode else None
    handle = tempfile.NamedTemporaryFile(mode, dir=os.path.dirname(path), delete=False, suffix=".part", encoding=encoding)
    try:
        if mode == "wb":
            handle.write(data)
        else:
            json.dump(data, handle, indent=2, ensure_ascii=False)
            handle.write("\n")
        handle.flush(); os.fsync(handle.fileno()); handle.close(); os.replace(handle.name, path)
    except BaseException:
        handle.close();
        if os.path.exists(handle.name): os.unlink(handle.name)
        raise


def download_image(url, dest_path):
    request = urllib.request.Request(url, headers={"User-Agent": "lesson-resources-image-scout/2.0"})
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


def candidate_metadata(path, photo, index):
    width, height, decoded = decode_info(path)
    raw = path.read_bytes()
    photo_id = str(photo.get("id") or f"candidate-{index}")
    source_page = photo.get("links", {}).get("html", "")
    creator = photo.get("user", {}).get("name", "Unknown") or "Unknown"
    description = photo.get("alt_description") or photo.get("description") or "no description"
    return {
        "candidate_id": photo_id,
        "sha256": hashlib.sha256(raw).hexdigest(),
        "byte_count": len(raw),
        "width": width,
        "height": height,
        "decoded_format": decoded,
        "source": SOURCE,
        "source_page_url": source_page,
        "creator": creator,
        "licence_name": LICENSE_NAME,
        "licence_url": LICENSE_URL,
        "description": description[:500],
        "path": str(path),
    }


def sanitize_filename(text):
    return "".join(c if c.isalnum() or c in " -_" else "_" for c in text)[:60].strip()


def summary_path_for(output_dir, round_number):
    return os.path.join(output_dir, f"_search-summary-{SOURCE}-r{round_number}.json")


def main():
    parser = argparse.ArgumentParser(description="Fetch images from Unsplash")
    parser.add_argument("query")
    parser.add_argument("--count", type=int, default=1)
    parser.add_argument("--round", type=int, default=1, choices=(1, 2))
    parser.add_argument("--orientation", choices=("landscape", "portrait", "squarish"))
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    os.makedirs(args.output, exist_ok=True)
    requested = max(args.count, 1)
    summary_path = summary_path_for(args.output, args.round)
    try:
        key = load_api_key()
        results = search_unsplash(args.query, key, min(requested * RESERVE_MULTIPLIER, MAX_PER_PAGE), args.orientation)
    except SourceFailure as exc:
        payload = {"query": args.query, "source": SOURCE, "round": args.round, "complete": False, "requested_count": requested, "returned_candidate_count": 0, "download_failure_count": 0, "failure_kind": exc.failure_kind, "error": str(exc), "results": []}
        _atomic_write(summary_path, payload, "w")
        print(f"ERROR: {exc}")
        raise SystemExit(1)

    downloaded = []; failures = 0; slug = sanitize_filename(args.query)
    for index, photo in enumerate(results, 1):
        if len(downloaded) >= requested: break
        image_url = photo.get("urls", {}).get("regular")
        if not image_url:
            failures += 1; continue
        dest = os.path.join(args.output, f"{slug}_{index}_{photo.get('id', 'candidate')}.jpg")
        try:
            download_image(image_url, dest)
            item = candidate_metadata(PathLike(dest), photo, index)
            trigger_download(photo.get("id", ""), key)
        except Exception:
            failures += 1
            try: os.unlink(dest)
            except OSError: pass
            continue
        downloaded.append(item)

    complete = len(downloaded) >= requested or len(downloaded) == len(results)
    payload = {"query": args.query, "source": SOURCE, "round": args.round, "complete": bool(complete), "requested_count": requested, "returned_candidate_count": len(results), "download_failure_count": failures, "failure_kind": None if complete else "transport", "error": None if complete else "one or more candidate downloads failed", "results": downloaded}
    _atomic_write(summary_path, payload, "w")
    print(f"Summary saved to: {summary_path}")
    if not complete: raise SystemExit(1)


# A tiny adapter keeps candidate_metadata easy to exercise with pathlib and
# avoids exposing any alternate path format in summaries.
def PathLike(value):
    from pathlib import Path
    return Path(value)


if __name__ == "__main__":
    main()
