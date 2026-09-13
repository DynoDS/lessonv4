#!/usr/bin/env python3
"""Fetch a photograph from a page on the open web and record where it came from.

This is the last rung of the picture ladder and the only one that leaves the
indexed libraries. It exists because the evidence a history or geography lesson
needs is often held by exactly one institution and published on exactly one of
its own pages: a county record office's blog, a museum's collection entry, a
university department's field photographs. A Year 4 lesson on children's lives
(3 September 2026) lost its slides, its worksheet and its answer key that way -
the photographs it needed were found, on the open web, by an agent that had no
way to hand them to anything downstream.

It is deliberately not a search engine. The scout finds the page with its own
web search and judges the picture with its own eyes; this script's whole job is
to fetch what the scout chose, refuse the hosts that must never be taken from,
and write down the provenance a teacher could check.

**On what basis these are used.** Where the page publishes a licence, that
licence is recorded and governs. Where it does not, the use recorded is the UK
education exception: fair dealing for illustration for instruction, in a
non-commercial classroom, with the source acknowledged (Copyright, Designs and
Patents Act 1988, section 32). That is why a publisher and a credit are
required rather than optional, and why the stock agencies below are refused
outright: their whole business is licensing the image, so no fair-dealing
reading of taking one survives contact with daylight.
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
import python_extras  # noqa: F401,E402 - the plugin's own installed libraries

USER_AGENT = "lesson-resources-image-scout/2.0 (https://github.com/DynoDS/lessonv4; educational lesson-generation tool)"
DEFAULT_OUTPUT = os.path.expanduser("~/Pictures/web-fetch")
SOURCE = "web"
NETWORK_TIMEOUT_SECONDS = 25
MAX_BYTES = 20 * 1024 * 1024

EDUCATION_EXCEPTION_NAME = "UK education exception (CDPA 1988 s.32), credited"
EDUCATION_EXCEPTION_URL = "https://www.legislation.gov.uk/ukpga/1988/48/section/32"

# Two kinds of host are refused, for two different reasons.
#
# A picture library sells the licence. Taking the watermarked preview is not
# fair dealing under any reading, and a lesson that ships one has taken
# somebody's stock rather than used somebody's evidence.
#
# An aggregator or a social feed is not the rights holder and usually cannot
# say who is. A photograph taken from there has provenance pointing at a
# re-poster, which is worse than no provenance because it looks like some.
BLOCKED_HOSTS = {
    "picture library": (
        "gettyimages", "alamy", "shutterstock", "istockphoto", "istock",
        "stock.adobe", "adobestock", "dreamstime", "123rf", "depositphotos",
        "agefotostock", "superstock", "bridgemanimages", "magnumphotos",
        "shutterstock", "canstockphoto", "fotolia", "photoshelter",
        "reuters", "apimages", "afp.com", "epa-images", "sciencephoto",
    ),
    "aggregator or social feed": (
        "pinterest", "facebook", "fbcdn", "instagram", "cdninstagram",
        "twitter", "twimg", "x.com", "tiktok", "reddit", "redd.it",
        "tumblr", "weheartit", "imgur", "google.com/imgres",
        "bing.com/images", "images.google", "quora", "medium.com",
        "wordpress.com/wp-content/uploads/pinterest",
    ),
}

REQUIRED_CANDIDATE_FIELDS = ("page_url", "image_url", "publisher", "terms_note")


class SourceFailure(Exception):
    def __init__(self, message, failure_kind="transport"):
        super().__init__(message)
        self.failure_kind = failure_kind


class CandidateRefused(Exception):
    pass


def host_of(url: str) -> str:
    return (urllib.parse.urlparse(url or "").hostname or "").casefold()


def blocked_reason(url: str) -> str | None:
    """Name the kind of host refused, or None when the URL may be fetched."""
    lowered = (url or "").casefold()
    host = host_of(url)
    for kind, needles in BLOCKED_HOSTS.items():
        for needle in needles:
            if needle in host or needle in lowered:
                return f"{kind} ({needle})"
    return None


def check_candidate(candidate: dict, index: int) -> None:
    if not isinstance(candidate, dict):
        raise CandidateRefused(f"candidate {index} is not an object")
    for field in REQUIRED_CANDIDATE_FIELDS:
        value = candidate.get(field)
        if not isinstance(value, str) or not value.strip():
            raise CandidateRefused(
                f"candidate {index} has no {field}. The open-web route records who "
                "published the picture, the page it sits on, and what that page says "
                "about reuse. A fetch with any of those missing produces provenance "
                "nobody can check, which is the one thing this route must not do."
            )
    for field in ("page_url", "image_url"):
        url = candidate[field]
        if not urllib.parse.urlparse(url).scheme in {"http", "https"}:
            raise CandidateRefused(f"candidate {index} {field} is not an http(s) URL")
        reason = blocked_reason(url)
        if reason is not None:
            raise CandidateRefused(
                f"candidate {index} {field} is a {reason}. Take the picture from the "
                "institution that holds it, not from a library that sells it or a feed "
                "that reposted it."
            )
    licence_name = candidate.get("licence_name")
    licence_url = candidate.get("licence_url")
    if (licence_name and not licence_url) or (licence_url and not licence_name):
        raise CandidateRefused(
            f"candidate {index} names half a licence. Give the licence the page "
            "publishes with its address, or give neither and let the credited "
            "education exception be recorded instead."
        )


def resolved_licence(candidate: dict) -> tuple[str, str]:
    """The licence the page publishes, or the credited education exception.

    A licence is never invented here. When the page states one, that statement
    governs and is recorded verbatim with its own address. When it states none -
    which is the ordinary case for an archive blog or a museum collection entry -
    what is recorded is the basis the picture is actually used on, which is fair
    dealing for illustration for instruction with the source acknowledged. That
    is an honest record of a real thing, not a licence nobody granted.
    """
    name = (candidate.get("licence_name") or "").strip()
    url = (candidate.get("licence_url") or "").strip()
    if name and url:
        return name, url
    return EDUCATION_EXCEPTION_NAME, EDUCATION_EXCEPTION_URL


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
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "image/*"})
    try:
        with urllib.request.urlopen(request, timeout=NETWORK_TIMEOUT_SECONDS) as response:
            data = response.read(MAX_BYTES + 1)
    except urllib.error.HTTPError as exc:
        kind = "auth" if exc.code in (401, 403) else "rate_limit" if exc.code == 429 else "transport"
        raise SourceFailure(f"{url} returned {exc.code}: {exc.reason}", kind) from exc
    except urllib.error.URLError as exc:
        raise SourceFailure(f"could not reach {url}: {exc.reason}", "transport") from exc
    if len(data) > MAX_BYTES:
        raise SourceFailure(f"{url} is larger than the {MAX_BYTES // (1024 * 1024)} MB ceiling")
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


def candidate_metadata(path: Path, candidate: dict, index: int) -> dict:
    width, height, decoded = decode_info(path)
    raw = path.read_bytes()
    name, url = resolved_licence(candidate)
    publisher = candidate["publisher"].strip()
    return {
        "candidate_id": f"web-{index}-{host_of(candidate['page_url']) or 'unknown'}",
        "sha256": hashlib.sha256(raw).hexdigest(),
        "byte_count": len(raw),
        "width": width,
        "height": height,
        "decoded_format": decoded,
        "source": SOURCE,
        "source_page_url": candidate["page_url"],
        "creator": publisher,
        "licence_name": name,
        "licence_url": url,
        "description": (candidate.get("description") or candidate["terms_note"]).strip()[:500],
        "path": str(path),
    }


def summary_path_for(output_dir, round_number):
    return os.path.join(output_dir, f"_search-summary-{SOURCE}-r{round_number}.json")


def read_candidates(path: str) -> list[dict]:
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise SourceFailure(f"could not read the candidates file: {exc}")
    if isinstance(data, dict):
        data = data.get("candidates")
    if not isinstance(data, list) or not data:
        raise SourceFailure("the candidates file must hold a non-empty array of candidate objects")
    return data


def main():
    parser = argparse.ArgumentParser(
        description="Fetch scout-chosen photographs from their own publishers on the open web"
    )
    parser.add_argument("query", help="the picture's subject, for the record and the filenames")
    parser.add_argument(
        "--candidates",
        required=True,
        help=(
            "JSON array of {page_url, image_url, publisher, terms_note} objects, "
            "optionally with licence_name + licence_url and description"
        ),
    )
    parser.add_argument(
        "--count",
        type=int,
        default=0,
        help=(
            "the compiled step's candidate_count. The step summary is checked against "
            "the schedule that produced it, so this has to be the compiled number even "
            "when the scout chose fewer candidates than that."
        ),
    )
    parser.add_argument("--round", type=int, default=1, choices=(1, 2))
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    os.makedirs(args.output, exist_ok=True)
    summary_path = summary_path_for(args.output, args.round)

    try:
        candidates = read_candidates(args.candidates)
    except SourceFailure as exc:
        _atomic_write(summary_path, {
            "query": args.query, "queries_run": [args.query], "source": SOURCE, "round": args.round,
            "complete": False, "requested_count": max(args.count, 0), "returned_candidate_count": 0,
            "download_failure_count": 0, "failure_kind": exc.failure_kind, "error": str(exc),
            "results": [], "considered": [],
        }, "w")
        print(f"ERROR: {exc}")
        raise SystemExit(1)

    requested = args.count if args.count > 0 else len(candidates)
    downloaded = []
    failures = 0
    refusals = []
    considered = []
    slug = sanitize_filename(args.query)

    for index, candidate in enumerate(candidates, 1):
        entry = {
            "candidate_id": f"web-{index}",
            "page_url": candidate.get("page_url") if isinstance(candidate, dict) else None,
            "creator": candidate.get("publisher") if isinstance(candidate, dict) else None,
            "licence_name": None,
            "description": (candidate.get("terms_note") if isinstance(candidate, dict) else "") or "",
            "downloaded": False,
        }
        try:
            check_candidate(candidate, index)
        except CandidateRefused as exc:
            refusals.append(str(exc))
            entry["refused"] = str(exc)
            considered.append(entry)
            continue
        name, _ = resolved_licence(candidate)
        entry["licence_name"] = name
        suffix = Path(urllib.parse.urlparse(candidate["image_url"]).path).suffix or ".jpg"
        if suffix.lower() not in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".tif", ".tiff"}:
            suffix = ".jpg"
        dest = Path(args.output) / f"{slug}_{index}_{sanitize_filename(candidate['publisher'])}{suffix}"
        try:
            download_image(candidate["image_url"], dest)
            row = candidate_metadata(dest, candidate, index)
            downloaded.append(row)
            entry["candidate_id"] = row["candidate_id"]
            entry["downloaded"] = True
        except Exception as exc:
            failures += 1
            entry["refused"] = f"download failed: {exc}"
            try:
                dest.unlink()
            except OSError:
                pass
        considered.append(entry)

    # This rung is a fetch of what the scout already chose, not a search that
    # can be asked for more. So the step is complete once every candidate has
    # been answered - an empty result is valid completed evidence, exactly as it
    # is on the search rungs, and a refusal is a semantic answer rather than an
    # incomplete call. Only a transport failure leaves the step unfinished, and
    # only that earns the one retry.
    complete = failures == 0
    error = None
    if refusals:
        error = "; ".join(refusals)
    elif not complete:
        error = "one or more candidate downloads failed"
    _atomic_write(summary_path, {
        "query": args.query, "queries_run": [args.query], "source": SOURCE, "round": args.round,
        "complete": complete, "requested_count": requested,
        "returned_candidate_count": len(downloaded), "download_failure_count": failures,
        "failure_kind": None if complete else "transport",
        "error": error, "results": downloaded, "considered": considered,
    }, "w")
    print(f"Summary saved to: {summary_path}")
    for refusal in refusals:
        print(f"REFUSED: {refusal}")
    if not complete:
        raise SystemExit(1)
    if not downloaded:
        print("No candidate was usable; the summary records why.")


if __name__ == "__main__":
    main()
