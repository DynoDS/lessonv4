#!/usr/bin/env python3
"""Re-render one region of one page at high DPI, so a reviewer can read detail
that is too small to judge on the whole-page image.

render-pages.py renders each page at 110 DPI to keep the full-page image a
sensible size. That is enough to read most of a page but not enough to settle a
close call: do two labels actually collide or just sit tight, does the drawn
clock say 3:40 or 3:45, is that chart key legible or a grey smudge. This script
answers those by re-rendering just the suspect region from the PDF - the vector
source behind the render - at a high DPI. The detail was always in the PDF; the
page PNG simply threw it away. Magnifying the PNG instead would enlarge blur and
tell you nothing new, which is why the crop comes from the PDF, not the image.

The region is given as fractions of the page (0 = left/top edge, 1 = right/bottom
edge), because that is what an eye reading the page image can estimate without
knowing its pixel size: "the cramped key sits bottom-left, about x 0.05 to 0.35,
y 0.72 to 0.96". Fractions also survive any DPI or page-size change.

Usage:
    python3 zoom-region.py <source.pdf|.pptx|.docx> <page> <out.png> \
        --box L,T,R,B [--dpi 300]

    <page>   1-based page number, matching the page-NN in the render manifest.
    --box    left,top,right,bottom as fractions 0-1 of the page.
    --dpi    render resolution for the crop (default 300; raise for tiny text).

Prefer passing the "pdf" path from the render manifest: it needs no conversion
and is instant. A .pptx/.docx works too but is reconverted first, which is slow.

Prints a JSON line on success:
    {"out": "<out.png>", "page": 7, "box": [0.05,0.72,0.35,0.96], "dpi": 300}

Exit codes:
    0  cropped fine
    1  real failure (bad input, page out of range, bad box) - message on stderr
    2  environment lacks tooling (no LibreOffice for a .pptx/.docx, or no
       PyMuPDF) - message on stderr, same meaning as render-pages.py.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def find_soffice():
    """Locate the LibreOffice binary on PATH or in the standard install spots."""
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
    for c in candidates:
        if c and Path(c).is_file():
            return c
    return None


def parse_box(text):
    """Turn 'L,T,R,B' into four fractions, checking they make a real region."""
    parts = [p.strip() for p in text.split(",")]
    if len(parts) != 4:
        raise ValueError("box needs four comma-separated numbers: L,T,R,B")
    l, t, r, b = (float(p) for p in parts)
    for name, v in (("left", l), ("top", t), ("right", r), ("bottom", b)):
        if not 0.0 <= v <= 1.0:
            raise ValueError(f"{name}={v} is outside 0-1 (fractions of the page)")
    if r <= l or b <= t:
        raise ValueError("right must exceed left and bottom must exceed top")
    return l, t, r, b


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source", help="the PDF from the render manifest, or a .pptx/.docx")
    ap.add_argument("page", type=int, help="1-based page number")
    ap.add_argument("out", help="path to write the cropped PNG")
    ap.add_argument("--box", required=True,
                    help="left,top,right,bottom as fractions 0-1 of the page")
    ap.add_argument("--dpi", type=int, default=300,
                    help="render resolution for the crop (default 300)")
    args = ap.parse_args()

    src = Path(args.source).resolve()
    if not src.is_file():
        print(f"Not found: {src}", file=sys.stderr)
        sys.exit(1)
    if src.suffix.lower() not in (".pdf", ".pptx", ".docx"):
        print(f"Unsupported file type: {src.suffix} (expected .pdf, .pptx or .docx)",
              file=sys.stderr)
        sys.exit(1)

    try:
        l, t, r, b = parse_box(args.box)
    except ValueError as e:
        print(f"Bad --box: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("PyMuPDF is not installed. Install it with: pip install pymupdf",
              file=sys.stderr)
        sys.exit(2)
    try:
        fitz.TOOLS.mupdf_display_errors(False)
    except Exception:
        pass

    # A PDF is used directly; a .pptx/.docx is converted first, exactly as
    # render-pages.py does. Passing the manifest's "pdf" path avoids this.
    tmp = None
    if src.suffix.lower() == ".pdf":
        pdf_path = src
    else:
        soffice = find_soffice()
        if not soffice:
            print("LibreOffice (soffice) was not found, so a .pptx/.docx cannot be "
                  "converted. Pass the PDF from the render manifest instead, or set "
                  "SOFFICE_PATH.", file=sys.stderr)
            sys.exit(2)
        tmp = tempfile.mkdtemp(prefix="zoom-region-")
        profile = Path(tmp, "lo-profile").as_uri()
        cmd = [soffice, "--headless", f"-env:UserInstallation={profile}",
               "--convert-to", "pdf", "--outdir", tmp, str(src)]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        pdf_path = Path(tmp, src.stem + ".pdf")
        if not pdf_path.is_file():
            print(f"LibreOffice could not convert {src.name} to PDF.\n"
                  f"{result.stdout}\n{result.stderr}", file=sys.stderr)
            sys.exit(1)

    doc = fitz.open(str(pdf_path))
    try:
        if not 1 <= args.page <= doc.page_count:
            print(f"Page {args.page} is out of range (the file has "
                  f"{doc.page_count}).", file=sys.stderr)
            sys.exit(1)
        page = doc[args.page - 1]
        rect = page.rect
        clip = fitz.Rect(
            rect.x0 + l * rect.width,
            rect.y0 + t * rect.height,
            rect.x0 + r * rect.width,
            rect.y0 + b * rect.height,
        )
        pix = page.get_pixmap(dpi=args.dpi, clip=clip)
        out_path = Path(args.out).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        pix.save(str(out_path))
    finally:
        doc.close()
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)

    print(json.dumps({"out": str(out_path), "page": args.page,
                      "box": [l, t, r, b], "dpi": args.dpi}))


if __name__ == "__main__":
    main()
