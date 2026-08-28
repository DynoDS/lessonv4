#!/usr/bin/env python3
"""Deterministic publisher for a lesson's canonical picture files.

Picture workers stage assets; they never write the file a builder reads. This
script is the only thing that creates or removes a canonical final picture, so
the invariant downstream code relies on stays simple:

    a canonical final filename exists only while that picture is currently
    accepted.

Commands:

    publish --source STAGED --filename unsplash/x.jpg --working-dir DIR
            --replace yes|no
    remove  --filename unsplash/x.jpg --working-dir DIR

`publish` refuses any source outside `WORKING_DIR/unsplash/_staging/`, any
destination that escapes `WORKING_DIR`, symlinks, and a source that is really
the destination. It decodes the staged raster before publication, preserves the
bytes when the staged encoding already matches the destination extension, and
otherwise converts deterministically through Pillow. The write is a temp sibling
plus `os.replace`, so a reader sees the old file or the new one, never half of
either.

Exit 0 on success with one JSON object on stdout; non-zero with
`{"ok": false, "error": "..."}` on any refusal.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from pathlib import Path, PurePosixPath

STAGING_DIRNAME = "_staging"

JPEG_EXTS = {".jpg", ".jpeg"}
FORMAT_FOR_EXT = {
    ".jpg": "JPEG",
    ".jpeg": "JPEG",
    ".png": "PNG",
    ".gif": "GIF",
    ".webp": "WEBP",
}


class PublishError(Exception):
    """A refusal. No canonical file is created, replaced or removed."""


def check_filename(filename: str) -> str:
    if not filename or filename != filename.strip():
        raise PublishError("filename is empty or padded with whitespace")
    if "\\" in filename:
        raise PublishError(f"filename must use forward slashes: {filename!r}")
    if filename.startswith("/") or (len(filename) > 1 and filename[1] == ":"):
        raise PublishError(f"filename must be relative: {filename!r}")
    parts = PurePosixPath(filename).parts
    if not parts:
        raise PublishError(f"filename is not a path: {filename!r}")
    for part in parts:
        if part in ("", ".", ".."):
            raise PublishError(f"filename is not normalised: {filename!r}")
    if str(PurePosixPath(filename)) != filename:
        raise PublishError(f"filename is not normalised: {filename!r}")
    ext = os.path.splitext(filename)[1].lower()
    if not ext:
        raise PublishError(f"filename has no extension: {filename!r}")
    return filename


def resolved_working_dir(working_dir: str) -> Path:
    path = Path(working_dir).resolve()
    if not path.is_dir():
        raise PublishError(f"WORKING_DIR does not exist: {working_dir}")
    return path


def destination_for(working: Path, filename: str) -> Path:
    check_filename(filename)
    candidate = (working / filename).resolve()
    try:
        candidate.relative_to(working)
    except ValueError:
        raise PublishError(
            f"resolved destination escapes WORKING_DIR: {filename!r}"
        )
    return candidate


def check_source(working: Path, source: str) -> Path:
    raw = Path(source)
    if raw.is_symlink():
        raise PublishError(f"staged source is a symlink: {source}")
    resolved = raw.resolve()
    if not resolved.is_file():
        raise PublishError(f"staged source does not exist: {source}")
    staging_root = (working / "unsplash" / STAGING_DIRNAME).resolve()
    try:
        resolved.relative_to(staging_root)
    except ValueError:
        raise PublishError(
            f"staged source must live inside {staging_root}, got {resolved}"
        )
    return resolved


def load_pillow():
    try:
        from PIL import Image  # noqa: WPS433 (deliberate local import)
    except ImportError as exc:  # pragma: no cover - environment dependent
        raise PublishError(
            "Pillow is required to publish a picture safely (staged rasters are "
            f"decoded before publication): {exc}"
        )
    return Image


def atomic_write_bytes(destination: Path, data: bytes) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        "wb", dir=str(destination.parent), delete=False, suffix=".part"
    )
    try:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())
        handle.close()
        os.replace(handle.name, destination)
    except BaseException:
        handle.close()
        if os.path.exists(handle.name):
            os.remove(handle.name)
        raise


def atomic_write_image(destination: Path, image, target_format: str) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        "wb", dir=str(destination.parent), delete=False, suffix=".part"
    )
    try:
        if target_format == "JPEG":
            image.save(handle, format="JPEG", quality=92)
        else:
            image.save(handle, format=target_format)
        handle.flush()
        os.fsync(handle.fileno())
        handle.close()
        os.replace(handle.name, destination)
    except BaseException:
        handle.close()
        if os.path.exists(handle.name):
            os.remove(handle.name)
        raise


def flatten_for_jpeg(image, Image):
    """JPEG has no alpha, so transparency is composited onto neutral white."""
    if image.mode in ("RGBA", "LA") or (
        image.mode == "P" and "transparency" in image.info
    ):
        rgba = image.convert("RGBA")
        background = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        return Image.alpha_composite(background, rgba).convert("RGB")
    return image.convert("RGB")


def cmd_publish(args) -> dict:
    working = resolved_working_dir(args.working_dir)
    destination = destination_for(working, args.filename)
    source = check_source(working, args.source)

    if source == destination:
        raise PublishError("staged source and canonical destination are the same file")
    if destination.is_symlink():
        raise PublishError(f"canonical destination is a symlink: {destination}")
    replace = args.replace == "yes"
    if destination.exists() and not replace:
        raise PublishError(
            f"canonical destination already exists and --replace no was given: {destination}"
        )

    Image = load_pillow()
    try:
        with Image.open(source) as probe:
            probe.load()
            staged_format = (probe.format or "").upper()
            image = probe.copy()
    except PublishError:
        raise
    except Exception as exc:
        raise PublishError(f"staged source is not a readable image: {exc}")

    ext = os.path.splitext(destination.name)[1].lower()
    target_format = FORMAT_FOR_EXT.get(ext)
    if target_format is None:
        raise PublishError(f"unsupported destination extension: {ext!r}")

    if staged_format == target_format:
        atomic_write_bytes(destination, source.read_bytes())
        action = "copied"
    else:
        if target_format == "JPEG":
            image = flatten_for_jpeg(image, Image)
        elif image.mode == "P":
            image = image.convert("RGBA")
        atomic_write_image(destination, image, target_format)
        action = "converted"

    return {
        "action": action,
        "filename": args.filename,
        "source": str(source),
        "destination": str(destination),
        "staged_format": staged_format,
        "published_format": target_format,
        "replaced": replace,
    }


def cmd_remove(args) -> dict:
    working = resolved_working_dir(args.working_dir)
    destination = destination_for(working, args.filename)
    if destination.is_symlink():
        raise PublishError(f"canonical destination is a symlink: {destination}")
    if not destination.exists():
        return {"action": "absent", "filename": args.filename, "destination": str(destination)}
    if not destination.is_file():
        raise PublishError(f"canonical destination is not a file: {destination}")
    destination.unlink()
    return {"action": "removed", "filename": args.filename, "destination": str(destination)}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    subparsers = parser.add_subparsers(dest="command", required=True)

    publish = subparsers.add_parser("publish")
    publish.add_argument("--source", required=True)
    publish.add_argument("--filename", required=True)
    publish.add_argument("--working-dir", required=True)
    publish.add_argument("--replace", required=True, choices=["yes", "no"])

    remove = subparsers.add_parser("remove")
    remove.add_argument("--filename", required=True)
    remove.add_argument("--working-dir", required=True)

    return parser


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    handler = cmd_publish if args.command == "publish" else cmd_remove
    try:
        result = handler(args)
    except PublishError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, indent=2))
        return 1
    print(json.dumps({"ok": True, **result}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
