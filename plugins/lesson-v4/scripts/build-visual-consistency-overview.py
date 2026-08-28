#!/usr/bin/env python3
"""Build and verify labelled overview sheets from final render manifests.

The overview is a navigation aid for cross-resource consistency review. It uses
the already-verified page PNGs and never replaces the original full-size render
evidence.

Usage:
    python3 build-visual-consistency-overview.py build \
      --output-dir <directory> \
      --output-manifest <overview.json> \
      --manifest "Deck=<render-manifest.json>" \
      --manifest "Worksheets=<render-manifest.json>"

    python3 build-visual-consistency-overview.py verify \
      --manifest <overview.json>

Exit codes:
    0  success
    1  malformed or stale evidence
    2  the overview could not be generated for a technical reason, for
       example PyMuPDF being unavailable
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any

SCHEMA_VERSION = 1
RENDER_MANIFEST_VERSION = 1
PAGE_WIDTH = 1600
PAGE_HEIGHT = 1100
PAGE_MARGIN = 40
HEADER_HEIGHT = 50
GRID_COLUMNS = 4
GRID_ROWS = 3
GRID_GAP = 20
THUMBNAILS_PER_SHEET = GRID_COLUMNS * GRID_ROWS


class OverviewError(Exception):
    """Raised when supplied render or overview evidence is malformed or stale."""


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def require_absolute_file(raw_path: Any, label: str) -> Path:
    if not isinstance(raw_path, str) or not raw_path:
        raise OverviewError(f"{label} path is missing or invalid")
    path = Path(raw_path)
    if not path.is_absolute():
        raise OverviewError(f"{label} path must be absolute: {raw_path}")
    path = path.resolve()
    if not path.is_file():
        raise OverviewError(f"{label} file does not exist: {path}")
    return path


def require_sha256(raw_sha: Any, label: str) -> str:
    if not isinstance(raw_sha, str) or not re.fullmatch(r"[0-9a-f]{64}", raw_sha):
        raise OverviewError(f"{label} SHA-256 is missing or invalid")
    return raw_sha


def verify_recorded_file(raw_path: Any, raw_sha: Any, label: str) -> Path:
    path = require_absolute_file(raw_path, label)
    expected = require_sha256(raw_sha, label)
    actual = sha256_file(path)
    if actual != expected:
        raise OverviewError(
            f"{label} SHA-256 changed: {path}; expected {expected}, found {actual}"
        )
    return path


def read_json(path: Path, label: str) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise OverviewError(f"Cannot read {label} {path}: {exc}") from exc
    if not isinstance(data, dict):
        raise OverviewError(f"{label} must contain a JSON object: {path}")
    return data


def write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    path = path.resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def slugify_label(label: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
    if not slug:
        raise OverviewError(f"Resource label cannot produce a filename: {label!r}")
    return slug


def parse_manifest_assignment(value: str) -> tuple[str, Path]:
    if "=" not in value:
        raise OverviewError(f"--manifest must use Label=absolute-path: {value}")
    label, raw_path = value.split("=", 1)
    label = label.strip()
    raw_path = raw_path.strip()
    if not label or not raw_path:
        raise OverviewError(f"--manifest must use non-empty Label=absolute-path: {value}")
    return label, require_absolute_file(raw_path, f"{label} render manifest")


def load_render_manifest(label: str, manifest_path: Path) -> dict[str, Any]:
    data = read_json(manifest_path, f"{label} render manifest")
    if data.get("version") != RENDER_MANIFEST_VERSION:
        raise OverviewError(
            f"{label} render manifest has unsupported version "
            f"{data.get('version')!r}: {manifest_path}"
        )

    source_path = verify_recorded_file(
        data.get("source"),
        data.get("sourceSha256"),
        f"{label} source",
    )

    pdf_record = data.get("pdf")
    if not isinstance(pdf_record, dict):
        raise OverviewError(f"{label} render manifest has no valid pdf record")
    verify_recorded_file(
        pdf_record.get("path"),
        pdf_record.get("sha256"),
        f"{label} rendered PDF",
    )

    raw_pages = data.get("pages")
    if not isinstance(raw_pages, list) or not raw_pages:
        raise OverviewError(f"{label} render manifest has no page records")

    pages: list[dict[str, Any]] = []
    for expected_number, raw_page in enumerate(raw_pages, start=1):
        if not isinstance(raw_page, dict):
            raise OverviewError(
                f"{label} render manifest page {expected_number} is not an object"
            )
        number = raw_page.get("number")
        if number != expected_number:
            raise OverviewError(
                f"{label} render manifest page sequence expected "
                f"{expected_number}, found {number!r}"
            )
        page_path = verify_recorded_file(
            raw_page.get("path"),
            raw_page.get("sha256"),
            f"{label} page {number}",
        )
        pages.append(
            {
                "number": number,
                "path": page_path,
                "sha256": raw_page["sha256"],
            }
        )

    return {
        "label": label,
        "manifestPath": manifest_path.resolve(),
        "manifestSha256": sha256_file(manifest_path),
        "source": source_path,
        "sourceSha256": data["sourceSha256"],
        "pages": pages,
    }


def fit_image_rect(
    image_width: float,
    image_height: float,
    left: float,
    top: float,
    right: float,
    bottom: float,
) -> tuple[float, float, float, float]:
    available_width = right - left
    available_height = bottom - top
    scale = min(available_width / image_width, available_height / image_height)
    rendered_width = image_width * scale
    rendered_height = image_height * scale
    x0 = left + (available_width - rendered_width) / 2
    y0 = top + (available_height - rendered_height) / 2
    return x0, y0, x0 + rendered_width, y0 + rendered_height


def build_resource_overviews(
    fitz: Any,
    resource: dict[str, Any],
    output_dir: Path,
) -> list[dict[str, Any]]:
    label = resource["label"]
    slug = slugify_label(label)

    for stale in output_dir.glob(f"{slug}-overview-*.png"):
        stale.unlink()

    page_chunks = [
        resource["pages"][index : index + THUMBNAILS_PER_SHEET]
        for index in range(0, len(resource["pages"]), THUMBNAILS_PER_SHEET)
    ]

    document = fitz.open()
    try:
        usable_width = (
            PAGE_WIDTH
            - 2 * PAGE_MARGIN
            - (GRID_COLUMNS - 1) * GRID_GAP
        )
        usable_height = (
            PAGE_HEIGHT
            - 2 * PAGE_MARGIN
            - HEADER_HEIGHT
            - (GRID_ROWS - 1) * GRID_GAP
        )
        cell_width = usable_width / GRID_COLUMNS
        cell_height = usable_height / GRID_ROWS

        for sheet_number, page_chunk in enumerate(page_chunks, start=1):
            page = document.new_page(width=PAGE_WIDTH, height=PAGE_HEIGHT)
            page.insert_text(
                (PAGE_MARGIN, PAGE_MARGIN - 8),
                f"{label} overview {sheet_number} of {len(page_chunks)}",
                fontsize=24,
            )

            for cell_index, source_page in enumerate(page_chunk):
                row = cell_index // GRID_COLUMNS
                column = cell_index % GRID_COLUMNS
                x0 = PAGE_MARGIN + column * (cell_width + GRID_GAP)
                y0 = PAGE_MARGIN + HEADER_HEIGHT + row * (cell_height + GRID_GAP)
                x1 = x0 + cell_width
                y1 = y0 + cell_height

                cell_rect = fitz.Rect(x0, y0, x1, y1)
                page.draw_rect(cell_rect, color=(0.65, 0.65, 0.65), width=1)
                page.insert_text(
                    (x0 + 8, y0 + 19),
                    f"{label} - page {source_page['number']}",
                    fontsize=12,
                )

                source_pixmap = fitz.Pixmap(str(source_page["path"]))
                try:
                    image_rect_values = fit_image_rect(
                        source_pixmap.width,
                        source_pixmap.height,
                        x0 + 8,
                        y0 + 28,
                        x1 - 8,
                        y1 - 8,
                    )
                finally:
                    source_pixmap = None

                page.insert_image(
                    fitz.Rect(*image_rect_values),
                    filename=str(source_page["path"]),
                    keep_proportion=True,
                )

        overview_records: list[dict[str, Any]] = []
        for sheet_number, page_chunk in enumerate(page_chunks, start=1):
            output_path = (
                output_dir
                / f"{slug}-overview-{sheet_number:02d}.png"
            ).resolve()
            pixmap = document[sheet_number - 1].get_pixmap(dpi=72, alpha=False)
            pixmap.save(str(output_path))
            overview_records.append(
                {
                    "path": str(output_path),
                    "sha256": sha256_file(output_path),
                    "sourcePages": [
                        source_page["number"] for source_page in page_chunk
                    ],
                }
            )
        return overview_records
    finally:
        document.close()


def build_overview(args: argparse.Namespace) -> int:
    try:
        import fitz
    except ImportError:
        print(
            "VISUAL_CONSISTENCY_OVERVIEW_UNAVAILABLE: "
            "PyMuPDF is not installed",
            file=sys.stderr,
        )
        return 2

    assignments: list[tuple[str, Path]] = []
    seen_labels: set[str] = set()
    seen_slugs: set[str] = set()

    for raw_assignment in args.render_manifests:
        label, manifest_path = parse_manifest_assignment(raw_assignment)
        if label in seen_labels:
            raise OverviewError(f"duplicate resource label: {label}")
        slug = slugify_label(label)
        if slug in seen_slugs:
            raise OverviewError(
                f"resource labels produce the same overview filename: {label}"
            )
        seen_labels.add(label)
        seen_slugs.add(slug)
        assignments.append((label, manifest_path))

    if not assignments:
        raise OverviewError("at least one --manifest assignment is required")

    # Verify every supplied render manifest before creating any overview, so
    # stale or malformed evidence is reported as such (exit 1) instead of
    # being mistaken for a technical failure to create the optional overview.
    verified: list[dict[str, Any]] = []
    for label, manifest_path in assignments:
        verified.append(load_render_manifest(label, manifest_path))

    try:
        output_dir = Path(args.output_dir).resolve()
        output_dir.mkdir(parents=True, exist_ok=True)
        output_manifest = Path(args.output_manifest).resolve()

        resources: list[dict[str, Any]] = []
        for resource in verified:
            overview_pages = build_resource_overviews(fitz, resource, output_dir)
            resources.append(
                {
                    "label": resource["label"],
                    "renderManifest": str(resource["manifestPath"]),
                    "renderManifestSha256": resource["manifestSha256"],
                    "source": str(resource["source"]),
                    "sourceSha256": resource["sourceSha256"],
                    "overviewPages": overview_pages,
                }
            )

        payload = {
            "schemaVersion": SCHEMA_VERSION,
            "layout": {
                "columns": GRID_COLUMNS,
                "rows": GRID_ROWS,
                "thumbnailsPerSheet": THUMBNAILS_PER_SHEET,
            },
            "resources": resources,
        }
        write_json_atomic(output_manifest, payload)
    except OverviewError:
        raise
    except Exception as exc:
        print(
            "VISUAL_CONSISTENCY_OVERVIEW_UNAVAILABLE: "
            f"overview could not be generated: {exc}",
            file=sys.stderr,
        )
        return 2

    print(f"VISUAL_CONSISTENCY_OVERVIEW_OK {output_manifest}")
    return 0


def verify_overview(args: argparse.Namespace) -> int:
    manifest_path = require_absolute_file(
        args.manifest,
        "visual consistency overview manifest",
    )
    data = read_json(manifest_path, "visual consistency overview manifest")
    if data.get("schemaVersion") != SCHEMA_VERSION:
        raise OverviewError(
            "visual consistency overview manifest has unsupported "
            f"schemaVersion {data.get('schemaVersion')!r}"
        )

    resources = data.get("resources")
    if not isinstance(resources, list) or not resources:
        raise OverviewError(
            "visual consistency overview manifest has no resources"
        )

    seen_labels: set[str] = set()
    for raw_resource in resources:
        if not isinstance(raw_resource, dict):
            raise OverviewError("overview resource record is not an object")
        label = raw_resource.get("label")
        if not isinstance(label, str) or not label:
            raise OverviewError("overview resource label is missing")
        if label in seen_labels:
            raise OverviewError(f"duplicate resource label: {label}")
        seen_labels.add(label)

        render_manifest_path = verify_recorded_file(
            raw_resource.get("renderManifest"),
            raw_resource.get("renderManifestSha256"),
            f"{label} render manifest",
        )
        render_resource = load_render_manifest(label, render_manifest_path)

        if raw_resource.get("source") != str(render_resource["source"]):
            raise OverviewError(f"{label} overview source path changed")
        if raw_resource.get("sourceSha256") != render_resource["sourceSha256"]:
            raise OverviewError(f"{label} overview source SHA-256 changed")

        raw_overview_pages = raw_resource.get("overviewPages")
        if not isinstance(raw_overview_pages, list) or not raw_overview_pages:
            raise OverviewError(f"{label} has no overview page records")

        covered_pages: list[int] = []
        for overview_number, overview_page in enumerate(
            raw_overview_pages,
            start=1,
        ):
            if not isinstance(overview_page, dict):
                raise OverviewError(
                    f"{label} overview page {overview_number} is not an object"
                )
            verify_recorded_file(
                overview_page.get("path"),
                overview_page.get("sha256"),
                f"{label} overview page {overview_number}",
            )
            source_pages = overview_page.get("sourcePages")
            if (
                not isinstance(source_pages, list)
                or not source_pages
                or not all(isinstance(number, int) for number in source_pages)
            ):
                raise OverviewError(
                    f"{label} overview page {overview_number} "
                    "has invalid sourcePages"
                )
            covered_pages.extend(source_pages)

        expected_pages = [
            page["number"] for page in render_resource["pages"]
        ]
        if covered_pages != expected_pages:
            raise OverviewError(
                f"{label} overview page coverage is {covered_pages}; "
                f"expected {expected_pages}"
            )

    print(
        f"VISUAL_CONSISTENCY_OVERVIEW_VERIFIED {manifest_path}"
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)

    build_parser = subparsers.add_parser("build")
    build_parser.add_argument("--output-dir", required=True)
    build_parser.add_argument("--output-manifest", required=True)
    build_parser.add_argument(
        "--manifest",
        dest="render_manifests",
        action="append",
        default=[],
    )

    verify_parser = subparsers.add_parser("verify")
    verify_parser.add_argument("--manifest", required=True)

    args = parser.parse_args()

    try:
        if args.command == "build":
            return build_overview(args)
        return verify_overview(args)
    except OverviewError as exc:
        print(
            f"VISUAL_CONSISTENCY_OVERVIEW_ERROR: {exc}",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    sys.exit(main())
