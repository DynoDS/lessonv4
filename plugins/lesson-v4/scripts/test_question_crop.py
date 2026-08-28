#!/usr/bin/env python3
"""Self-contained tests for question_crop.py. Run: python test_question_crop.py
Exits 0 if all pass, 1 on the first failure. Uses only Pillow + poppler (via
pdf2image), both already needed by the render step, so there is no extra dev
dependency."""
import json, os, subprocess, sys, tempfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "question_crop.py")

def run(*args):
    return subprocess.run([sys.executable, SCRIPT, *map(str, args)],
                          capture_output=True, text=True)

def test_crop_dimensions_and_png(tmp):
    src = os.path.join(tmp, "page.png")
    Image.new("RGB", (1000, 800), "white").save(src)
    out = os.path.join(tmp, "crop.png")
    r = run("crop", src, 100, 100, 400, 300, out)
    assert r.returncode == 0, r.stderr
    assert os.path.exists(out)
    with Image.open(out) as im:
        assert im.size == (300, 200), im.size
        assert im.format == "PNG", im.format
    print("PASS crop_dimensions_and_png")

def test_crop_rejects_out_of_bounds(tmp):
    src = os.path.join(tmp, "page.png")
    Image.new("RGB", (500, 500), "white").save(src)
    out = os.path.join(tmp, "bad.png")
    r = run("crop", src, 0, 0, 600, 100, out)   # x1 beyond width
    assert r.returncode != 0, "expected non-zero exit for an out-of-bounds box"
    assert not os.path.exists(out)
    print("PASS crop_rejects_out_of_bounds")

def test_render_reports_pages(tmp):
    p1 = Image.new("RGB", (850, 1100), "white")
    p2 = Image.new("RGB", (850, 1100), "white")
    pdf = os.path.join(tmp, "two.pdf")
    p1.save(pdf, save_all=True, append_images=[p2])   # Pillow writes a 2-page PDF
    outdir = os.path.join(tmp, "pages")
    r = run("render", pdf, outdir, "--dpi", 100)
    assert r.returncode == 0, r.stderr
    data = json.loads(r.stdout)
    assert len(data["pages"]) == 2, data
    for pg in data["pages"]:
        assert os.path.exists(pg["path"])
        assert pg["width"] > 0 and pg["height"] > 0
    print("PASS render_reports_pages")

def main():
    with tempfile.TemporaryDirectory() as tmp:
        test_crop_dimensions_and_png(tmp)
        test_crop_rejects_out_of_bounds(tmp)
        test_render_reports_pages(tmp)
    print("ALL PASS")

if __name__ == "__main__":
    try:
        main()
    except AssertionError as e:
        print(f"FAIL: {e}"); sys.exit(1)
