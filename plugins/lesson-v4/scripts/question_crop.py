#!/usr/bin/env python3
"""Render a PDF's pages to PNGs and crop rectangular regions out of them.

Four subcommands, all deterministic and mechanical (no judgement):

  pages <pdf>
      Print the PDF's page count as JSON, without rendering any images. Cheap
      enough to call before deciding whether a paper is worth splitting into
      several extractors working different page ranges in parallel.

  render <pdf> <out_dir> [--dpi 300]
      Render every page to <out_dir>/page_<n>.png at the given DPI and print a
      JSON summary listing each page's path and true pixel width/height, so the
      caller knows the coordinate space its crop boxes must use.

  crop <page_png> <x0> <y0> <x1> <y1> <out_png>
      Crop the rectangle (x0,y0)-(x1,y1), in the page PNG's own pixel
      coordinates, and save it as an optimised PNG.

  join <in_png> <in_png> [<in_png> ...] <out_png>
      Stack two or more PNGs vertically, top to bottom in the order given, and
      save the result as an optimised PNG. For when one question's content
      runs across a page break: crop each page's portion separately with
      `crop`, then join the pieces into a single picture with this.

Coordinates are page pixels, not PDF points. The caller estimates a box on the
page image it is viewing, maps it to true pixels, and passes those pixels here.
"""
import argparse, json, os, sys


def cmd_pages(args):
    from pdf2image.pdf2image import pdfinfo_from_path
    info = pdfinfo_from_path(args.pdf)
    print(json.dumps({"pages": int(info["Pages"])}))


def cmd_render(args):
    from pdf2image import convert_from_path
    os.makedirs(args.out_dir, exist_ok=True)
    pages = convert_from_path(args.pdf, dpi=args.dpi)
    out = {"dpi": args.dpi, "pages": []}
    for i, page in enumerate(pages, start=1):
        path = os.path.join(args.out_dir, f"page_{i}.png")
        page.save(path, "PNG")
        out["pages"].append({"index": i, "path": path,
                             "width": page.width, "height": page.height})
    print(json.dumps(out))


def cmd_crop(args):
    from PIL import Image
    im = Image.open(args.page_png)
    box = (args.x0, args.y0, args.x1, args.y1)
    if not (0 <= args.x0 < args.x1 <= im.width and 0 <= args.y0 < args.y1 <= im.height):
        print(f"error: box {box} is outside page {im.size}", file=sys.stderr)
        sys.exit(1)
    crop = im.crop(box)
    os.makedirs(os.path.dirname(os.path.abspath(args.out_png)), exist_ok=True)
    crop.save(args.out_png, "PNG", optimize=True)
    print(json.dumps({"path": args.out_png, "width": crop.width, "height": crop.height}))


def cmd_join(args):
    from PIL import Image
    *in_paths, out_png = args.pngs
    if len(in_paths) < 2:
        print("error: join needs at least two input images before the output path", file=sys.stderr)
        sys.exit(1)
    images = [Image.open(p) for p in in_paths]
    width = max(im.width for im in images)
    height = sum(im.height for im in images)
    out = Image.new("RGB", (width, height), "white")
    y = 0
    for im in images:
        x = (width - im.width) // 2
        out.paste(im, (x, y))
        y += im.height
    os.makedirs(os.path.dirname(os.path.abspath(out_png)), exist_ok=True)
    out.save(out_png, "PNG", optimize=True)
    print(json.dumps({"path": out_png, "width": out.width, "height": out.height}))


def main():
    p = argparse.ArgumentParser(description="Render and crop PDF question images.")
    sub = p.add_subparsers(dest="cmd", required=True)

    pg = sub.add_parser("pages")
    pg.add_argument("pdf")
    pg.set_defaults(func=cmd_pages)

    r = sub.add_parser("render")
    r.add_argument("pdf")
    r.add_argument("out_dir")
    r.add_argument("--dpi", type=int, default=300)
    r.set_defaults(func=cmd_render)

    c = sub.add_parser("crop")
    c.add_argument("page_png")
    c.add_argument("x0", type=int)
    c.add_argument("y0", type=int)
    c.add_argument("x1", type=int)
    c.add_argument("y1", type=int)
    c.add_argument("out_png")
    c.set_defaults(func=cmd_crop)

    j = sub.add_parser("join")
    j.add_argument("pngs", nargs="+", help="two or more input PNGs followed by the output PNG path")
    j.set_defaults(func=cmd_join)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
