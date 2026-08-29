#!/usr/bin/env python3
"""Render a finished PPTX, DOCX or PDF to one PNG per slide/page.

The orchestrator probes established render routes once, then every reviewer uses
that same ordered route file. Render evidence is written to a SHA-256 manifest so
later confirmation and consistency passes can reuse evidence that is still valid.

Conversion and rasterising happen in a short scratch directory and the finished
evidence is copied into <out-dir>, so the length of the caller's own working
directory never reaches PowerPoint or pdftoppm - neither of which can open a
path over 255 characters, whatever the operating system permits.

Usage:
    python3 render-pages.py --probe-route <route-file>
    python3 render-pages.py <source> <out-dir> --route-file <route-file> \
        --manifest <manifest-file> [--dpi 110]
    python3 render-pages.py --verify-manifest <manifest-file>

Exit codes:
    0  success
    1  malformed input/manifest or another non-route error
    2  no established visual-verification route succeeded for the resource
"""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROUTE_VERSION = 1
MANIFEST_VERSION = 1
POWERPOINT_PROBE_TIMEOUT_SECONDS = 30
POWERPOINT_CONVERT_TIMEOUT_SECONDS = 180

# PowerPoint COM refuses a filename over 255 characters outright, and poppler's
# pdftoppm cannot open one either, whatever the operating system allows. A
# working directory nested a few folders deep passes that mark easily, so every
# converter below is handed a file inside a short scratch directory instead of
# the caller's own path, and this limit is asserted where each tool is invoked.
LEGACY_TOOL_PATH_LIMIT = 255


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def is_windows():
    return os.name == "nt"


def find_soffice():
    hit = shutil.which("soffice")
    if hit:
        return hit
    candidates = [
        os.environ.get("SOFFICE_PATH", ""),
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        "/usr/bin/soffice",
        "/usr/local/bin/soffice",
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return candidate
    return None


def powerpoint_helper():
    return Path(__file__).resolve().parent / "powerpoint-to-pdf.py"


def probe_powerpoint():
    if not is_windows():
        return False
    try:
        completed = subprocess.run(
            [sys.executable, str(powerpoint_helper()), "--probe"],
            capture_output=True,
            text=True,
            timeout=POWERPOINT_PROBE_TIMEOUT_SECONDS,
        )
    except (OSError, subprocess.TimeoutExpired):
        return False
    return completed.returncode == 0 and "POWERPOINT_PROBE_OK" in completed.stdout


def probe_pymupdf():
    try:
        import fitz  # noqa: F401
        return True
    except ImportError:
        return False


def write_json(path, payload):
    path = Path(path).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def require_short_path(path, tool):
    """Refuse to hand a legacy converter a path it cannot open.

    Staging keeps this from firing inside `render`; it fires for a direct
    caller, and it names the real fault instead of the tool's own opaque
    complaint ("Invalid request", "Couldn't open file").
    """
    text = str(path)
    if len(text) > LEGACY_TOOL_PATH_LIMIT:
        raise RuntimeError(
            f"{tool} cannot use a path of {len(text)} characters "
            f"(limit {LEGACY_TOOL_PATH_LIMIT}): {text}"
        )


def stage_source(src, tmp_dir):
    """Copy the source into the short scratch directory the converters use."""
    staged = Path(tmp_dir, "staged-source" + src.suffix.lower())
    shutil.copyfile(src, staged)
    return staged


def probe_routes(route_file):
    pptx = []
    if probe_powerpoint():
        pptx.append("powerpoint")
    if find_soffice():
        pptx.append("libreoffice")
    docx = ["libreoffice"] if find_soffice() else []
    pdf = []
    if shutil.which("pdftoppm"):
        pdf.append("pdftoppm")
    if probe_pymupdf():
        pdf.append("pymupdf")
    write_json(route_file, {
        "version": ROUTE_VERSION,
        "pptxRoutes": pptx,
        "docxRoutes": docx,
        "pdfRoutes": pdf,
    })
    return 0


def load_route_file(path):
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"Cannot read route file {path}: {exc}") from exc
    if data.get("version") != ROUTE_VERSION:
        raise ValueError(f"Unsupported route-file version: {data.get('version')!r}")
    for key in ("pptxRoutes", "docxRoutes", "pdfRoutes"):
        if not isinstance(data.get(key), list):
            raise ValueError(f"Route file is missing list {key}")
    return data


def powerpoint_to_pdf(src, out_pdf):
    if not is_windows():
        raise RuntimeError("PowerPoint COM is not available off Windows")
    require_short_path(src, "PowerPoint")
    require_short_path(out_pdf, "PowerPoint")
    command = [
        sys.executable,
        str(powerpoint_helper()),
        "--source",
        str(src),
        "--output",
        str(out_pdf),
    ]
    try:
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=POWERPOINT_CONVERT_TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(
            f"PowerPoint conversion exceeded {POWERPOINT_CONVERT_TIMEOUT_SECONDS} seconds"
        ) from exc
    except OSError as exc:
        raise RuntimeError(f"PowerPoint conversion could not start: {exc}") from exc
    if completed.returncode != 0 or not out_pdf.is_file():
        detail = completed.stderr.strip() or completed.stdout.strip()
        raise RuntimeError(
            f"PowerPoint conversion failed ({completed.returncode}): {detail}"
        )


def libreoffice_to_pdf(src, out_pdf, tmp_dir):
    soffice = find_soffice()
    if not soffice:
        raise RuntimeError("LibreOffice (soffice) is unavailable")
    require_short_path(src, "LibreOffice")
    require_short_path(out_pdf, "LibreOffice")
    profile = Path(tmp_dir, "lo-profile").as_uri()
    cmd = [soffice, "--headless", f"-env:UserInstallation={profile}",
           "--convert-to", "pdf", "--outdir", str(tmp_dir), str(src)]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    generated = Path(tmp_dir, src.stem + ".pdf")
    if result.returncode != 0 or not generated.is_file():
        raise RuntimeError(
            f"LibreOffice conversion failed ({result.returncode}). "
            f"{result.stdout}\n{result.stderr}".strip()
        )
    if generated != out_pdf:
        shutil.copyfile(generated, out_pdf)


def convert_office(src, routes, tmp_dir):
    errors = []
    out_pdf = Path(tmp_dir, src.stem + "-office.pdf")
    for route in routes:
        try:
            if route == "powerpoint":
                powerpoint_to_pdf(src, out_pdf)
            elif route == "libreoffice":
                libreoffice_to_pdf(src, out_pdf, tmp_dir)
            else:
                errors.append(f"{route}: unrecognised recorded Office route")
                continue
            if out_pdf.is_file():
                return out_pdf, route
            errors.append(f"{route}: no PDF produced")
        except Exception as exc:
            errors.append(f"{route}: {exc}")
            try:
                out_pdf.unlink()
            except FileNotFoundError:
                pass
    raise RuntimeError("; ".join(errors) if errors else "no recorded Office route")


def render_pdftoppm(pdf_path, out_dir, stem, dpi):
    binary = shutil.which("pdftoppm")
    if not binary:
        raise RuntimeError("pdftoppm is unavailable")
    require_short_path(pdf_path, "pdftoppm")
    require_short_path(out_dir, "pdftoppm")
    prefix = out_dir / f".{stem}-pdftoppm"
    cmd = [binary, "-png", "-r", str(dpi), str(pdf_path), str(prefix)]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    if result.returncode != 0:
        raise RuntimeError(f"pdftoppm failed ({result.returncode}): {result.stderr}")
    generated = sorted(
        out_dir.glob(f"{prefix.name}-*.png"),
        key=lambda p: int(p.stem.rsplit("-", 1)[-1]),
    )
    if not generated:
        raise RuntimeError("pdftoppm produced no page images")
    files = []
    for number, old_path in enumerate(generated, start=1):
        new_path = out_dir / f"{stem}-page-{number:02d}.png"
        if new_path.exists():
            new_path.unlink()
        old_path.replace(new_path)
        files.append(new_path)
    return files


def render_pymupdf(pdf_path, out_dir, stem, dpi):
    try:
        import fitz
    except ImportError as exc:
        raise RuntimeError("PyMuPDF is unavailable") from exc
    try:
        fitz.TOOLS.mupdf_display_errors(False)
    except Exception:
        pass
    doc = fitz.open(str(pdf_path))
    files = []
    try:
        for number, page in enumerate(doc, start=1):
            pix = page.get_pixmap(dpi=dpi)
            out_path = out_dir / f"{stem}-page-{number:02d}.png"
            pix.save(str(out_path))
            files.append(out_path)
    finally:
        doc.close()
    if not files:
        raise RuntimeError("PyMuPDF produced no page images")
    return files


def render_pdf_pages(pdf_path, routes, out_dir, stem, dpi):
    errors = []
    for route in routes:
        for stale in out_dir.glob(f"{stem}-page-*.png"):
            stale.unlink()
        try:
            if route == "pdftoppm":
                return render_pdftoppm(pdf_path, out_dir, stem, dpi), route
            if route == "pymupdf":
                return render_pymupdf(pdf_path, out_dir, stem, dpi), route
            errors.append(f"{route}: unrecognised recorded PDF route")
        except Exception as exc:
            errors.append(f"{route}: {exc}")
    raise RuntimeError("; ".join(errors) if errors else "no recorded PDF route")


def render(source, out_dir, route_file, manifest_file, dpi):
    src = Path(source).resolve()
    if not src.is_file():
        print(f"Not found: {src}", file=sys.stderr)
        return 1
    suffix = src.suffix.lower()
    if suffix not in (".pptx", ".docx", ".pdf"):
        print(f"Unsupported file type: {src.suffix} (expected .pptx, .docx or .pdf)",
              file=sys.stderr)
        return 1
    try:
        routes = load_route_file(route_file)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    out_dir = Path(out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    tmp_dir = Path(tempfile.mkdtemp(prefix="render-pages-"))
    office_route = None
    try:
        # Convert and rasterise inside the scratch directory, then place the
        # finished evidence in out_dir. The caller's own path never reaches a
        # converter, so a deeply nested working directory renders the same as a
        # shallow one instead of failing on a length nothing warned about.
        staged = stage_source(src, tmp_dir)
        if suffix == ".pdf":
            working_pdf = staged
        else:
            key = "pptxRoutes" if suffix == ".pptx" else "docxRoutes"
            try:
                working_pdf, office_route = convert_office(
                    staged, routes[key], tmp_dir)
            except RuntimeError as exc:
                print(
                    f"VISUAL_ROUTE_UNVERIFIED: {src.name}: no established visual "
                    f"verification route succeeded\n{exc}", file=sys.stderr)
                return 2

        try:
            rendered, pdf_route = render_pdf_pages(
                working_pdf, routes["pdfRoutes"], tmp_dir, "staged", dpi)
        except RuntimeError as exc:
            print(
                f"VISUAL_ROUTE_UNVERIFIED: {src.name}: no established visual "
                f"verification route succeeded\n{exc}", file=sys.stderr)
            return 2

        kept_pdf = out_dir / f"{src.stem}-source.pdf"
        shutil.copyfile(working_pdf, kept_pdf)
        for stale in out_dir.glob(f"{src.stem}-page-*.png"):
            stale.unlink()
        page_files = []
        for number, produced in enumerate(rendered, start=1):
            placed = out_dir / f"{src.stem}-page-{number:02d}.png"
            shutil.copyfile(produced, placed)
            page_files.append(placed)

        manifest = {
            "version": MANIFEST_VERSION,
            "source": str(src),
            "sourceSha256": sha256_file(src),
            "officeRoute": office_route,
            "pdfRoute": pdf_route,
            "dpi": dpi,
            "pdf": {"path": str(kept_pdf), "sha256": sha256_file(kept_pdf)},
            "pages": [
                {"number": number, "path": str(path), "sha256": sha256_file(path)}
                for number, path in enumerate(page_files, start=1)
            ],
        }
        write_json(manifest_file, manifest)
        print(json.dumps(manifest))
        return 0
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def verify_manifest(manifest_file):
    path = Path(manifest_file).resolve()
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Invalid render manifest {path}: {exc}", file=sys.stderr)
        return 1
    if manifest.get("version") != MANIFEST_VERSION:
        print(f"Unsupported render-manifest version: {manifest.get('version')!r}",
              file=sys.stderr)
        return 1
    checks = []
    try:
        checks.append((Path(manifest["source"]), manifest["sourceSha256"], "source"))
        checks.append((Path(manifest["pdf"]["path"]), manifest["pdf"]["sha256"], "pdf"))
        pages = manifest["pages"]
        if not isinstance(pages, list) or not pages:
            raise KeyError("pages")
        for page in pages:
            checks.append((Path(page["path"]), page["sha256"],
                           f"page {page['number']}"))
    except (KeyError, TypeError) as exc:
        print(f"Malformed render manifest {path}: missing/invalid {exc}", file=sys.stderr)
        return 1
    for evidence_path, expected, label in checks:
        if not evidence_path.is_file():
            print(f"Render manifest stale: {label} missing: {evidence_path}", file=sys.stderr)
            return 1
        if sha256_file(evidence_path) != expected:
            print(f"Render manifest stale: {label} SHA-256 changed: {evidence_path}",
                  file=sys.stderr)
            return 1
    print(f"RENDER_MANIFEST_OK {path}")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source", nargs="?", help="path to a .pptx, .docx or .pdf")
    ap.add_argument("out_dir", nargs="?", help="directory to write page evidence into")
    ap.add_argument("--route-file")
    ap.add_argument("--manifest")
    ap.add_argument("--dpi", type=int, default=110)
    ap.add_argument("--probe-route", metavar="ROUTE_FILE")
    ap.add_argument("--verify-manifest", metavar="MANIFEST_FILE")
    args = ap.parse_args()

    if args.probe_route:
        if args.source or args.out_dir or args.verify_manifest:
            ap.error("--probe-route cannot be combined with render/verify arguments")
        sys.exit(probe_routes(args.probe_route))
    if args.verify_manifest:
        if args.source or args.out_dir:
            ap.error("--verify-manifest cannot be combined with render arguments")
        sys.exit(verify_manifest(args.verify_manifest))
    if not args.source or not args.out_dir or not args.route_file or not args.manifest:
        ap.error("render mode requires source, out_dir, --route-file and --manifest")
    sys.exit(render(args.source, args.out_dir, args.route_file, args.manifest, args.dpi))


if __name__ == "__main__":
    main()
