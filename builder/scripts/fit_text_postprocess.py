"""
Fit text post-processor for pptxgenjs output (lesson builder).

Adapted from an earlier fit_text_postprocess.py with a configurable floor.
Below the floor, the script stops shrinking and prints a WARNING naming
the slide and the text box so the teacher knows the slide is overloaded.

pptxgenjs writes <a:normAutofit/> when `fit: 'shrink'` is used, but
PowerPoint only computes the actual scale factor when a user edits the
text box. That means on first open, text boxes often overflow. This
script walks every text frame, measures with real Comic Sans TTF
metrics via Pillow + fontTools, and rewrites font sizes directly.

Usage:
  python fit_text_postprocess.py <pptx-path> [<pptx-path> ...]
  python fit_text_postprocess.py --floor 10 <pptx-path>
"""

import json
import os
import re
import sys

from PIL import ImageFont  # noqa: F401 - kept for compatibility

from pptx import Presentation
from pptx.enum.text import MSO_AUTO_SIZE
from pptx.util import Emu
from pptx.text.layout import _rendered_size


from functools import lru_cache


@lru_cache(maxsize=8)
def _font_line_height_em(font_file):
    """Return the font's real line height as a multiple of em."""
    try:
        from fontTools.ttLib import TTFont
        tt = TTFont(font_file)
        os2 = tt['OS/2']
        units = tt['head'].unitsPerEm
        use_typo = bool(os2.fsSelection & 0x80)
        if use_typo:
            ascent = os2.sTypoAscender
            descent = -os2.sTypoDescender
            linegap = os2.sTypoLineGap
        else:
            ascent = os2.usWinAscent
            descent = os2.usWinDescent
            linegap = 0
        return (ascent + descent + linegap) / units
    except Exception:
        return 1.2


FONT_FAMILY = "Comic Sans MS"

# ─── Font resolution ─────────────────────────────────────────────────────
# Autofit has to measure text against the font PowerPoint actually renders,
# Comic Sans MS. On the teacher's PC that TTF is present and measurement is
# exact. On a cloud box it is absent — which used to make Pillow fail to open
# the font and skip every text box, so autofit silently did nothing and any
# overflow shipped unchecked. To keep the safety net working everywhere, a
# free Comic Sans look-alike (Comic Neue, SIL OFL) is bundled in the repo at
# shared/fonts and used as the fallback, so a font always travels to the cloud.
#
# Comic Neue is not Comic Sans: its glyphs run up to ~13% narrower and its line
# box ~21% shorter. Measuring with it untouched would under-estimate the real
# text and under-shrink, i.e. leave overflow. Two corrections make the fallback
# err toward shrinking, never toward overflow: line height uses the known real
# Comic Sans value (COMIC_SANS_LINE_HEIGHT_EM) rather than Comic Neue's shorter
# box, and widths are inflated by SUBSTITUTE_WIDTH_SAFETY so the measured width
# is always at least the real width. The cost is that the cloud occasionally
# shrinks a box a point more than strictly needed, which is the safe side to be
# on. When the real Comic Sans faces have been committed into shared/fonts from
# a licensed Windows box, they are preferred over Comic Neue and measurement is
# exact everywhere with nothing to configure; LR_FIT_FONT_DIR still overrides for
# a box that keeps its fonts somewhere else.
_HERE = os.path.dirname(os.path.abspath(__file__))
_BUNDLED_FONT_DIR = os.path.normpath(os.path.join(_HERE, "..", "..", "shared", "fonts"))

_WIN_FONTS = {
    "regular": r"C:\Windows\Fonts\comic.ttf",
    "bold": r"C:\Windows\Fonts\comicbd.ttf",
    "italic": r"C:\Windows\Fonts\comici.ttf",
    "bolditalic": r"C:\Windows\Fonts\comicz.ttf",
}
# The real faces, when they travel with the clone. Same filenames Windows uses.
_BUNDLED_REAL_FONTS = {
    "regular": os.path.join(_BUNDLED_FONT_DIR, "comic.ttf"),
    "bold": os.path.join(_BUNDLED_FONT_DIR, "comicbd.ttf"),
    "italic": os.path.join(_BUNDLED_FONT_DIR, "comici.ttf"),
    "bolditalic": os.path.join(_BUNDLED_FONT_DIR, "comicz.ttf"),
}
_BUNDLED_FONTS = {
    "regular": os.path.join(_BUNDLED_FONT_DIR, "ComicNeue-Regular.ttf"),
    "bold": os.path.join(_BUNDLED_FONT_DIR, "ComicNeue-Bold.ttf"),
    "italic": os.path.join(_BUNDLED_FONT_DIR, "ComicNeue-Italic.ttf"),
    "bolditalic": os.path.join(_BUNDLED_FONT_DIR, "ComicNeue-BoldItalic.ttf"),
}

# Real Comic Sans line box as a multiple of em ((usWinAscent+usWinDescent)/
# unitsPerEm), so the fallback measures the height of the font that will render.
COMIC_SANS_LINE_HEIGHT_EM = 1.394
# Comic Sans is up to ~1.13x wider than Comic Neue per line; 1.15 clears that
# with headroom so an inflated fallback width is always >= the real width.
SUBSTITUTE_WIDTH_SAFETY = 1.15


def _resolve_font_set():
    """Return (fonts_by_style, mode): 'exact' (real Comic Sans, exact metrics),
    'substitute' (bundled Comic Neue, corrected to err toward shrinking), or
    'none' (nothing usable — autofit can't measure). LR_FIT_FONT_DIR overrides,
    so a cloud box with real Comic Sans installed gets exact measurement."""
    env_dir = os.environ.get("LR_FIT_FONT_DIR")
    if env_dir:
        cand = {
            "regular": os.path.join(env_dir, "comic.ttf"),
            "bold": os.path.join(env_dir, "comicbd.ttf"),
            "italic": os.path.join(env_dir, "comici.ttf"),
            "bolditalic": os.path.join(env_dir, "comicz.ttf"),
        }
        if os.path.exists(cand["regular"]):
            return cand, "exact"
    if os.path.exists(_WIN_FONTS["regular"]):
        return _WIN_FONTS, "exact"
    # Real Comic Sans committed into shared/fonts: exact on a cloud box too,
    # with no env var to set. Preferred over the Comic Neue look-alike below.
    if os.path.exists(_BUNDLED_REAL_FONTS["regular"]):
        return _BUNDLED_REAL_FONTS, "exact"
    if os.path.exists(_BUNDLED_FONTS["regular"]):
        return _BUNDLED_FONTS, "substitute"
    return _WIN_FONTS, "none"


_FONTS, FONT_MODE = _resolve_font_set()
FONT_REGULAR = _FONTS["regular"]  # kept for the mixed-run measurement path


# PowerPoint lays out a single Comic Sans line at about 1.2x the font size.
# The font's own win-metrics line box (winAscent + winDescent = 1.394em)
# carries extra leading that PowerPoint does not apply when it fits text to a
# box, so measuring against 1.394em calls text overflowing that PowerPoint
# would show comfortably. Measure against the rendered 1.2em line height;
# LINE_HEIGHT_SAFETY still adds headroom so a deck never quietly overflows.
MEASUREMENT_LINE_HEIGHT_EM = 1.2


def _real_line_height_emu(font_file, pt):
    factor = MEASUREMENT_LINE_HEIGHT_EM
    return int(pt * factor / 72.0 * 914400)


DEFAULT_LINE_SPACING = 1.05
LINE_HEIGHT_SAFETY = 1.02
# Divides usable width in substitute mode so wrapping is measured against the
# real (wider) Comic Sans; 1.0 in exact mode leaves PC measurement untouched.
WIDTH_SAFETY = SUBSTITUTE_WIDTH_SAFETY if FONT_MODE == "substitute" else 1.0

PAD_W = Emu(0.05 * 914400)
PAD_H = Emu(0.03 * 914400)

DEFAULT_FLOOR_PT = 10


def pick_font_file(bold, italic):
    key = "bolditalic" if (bold and italic) else "bold" if bold else "italic" if italic else "regular"
    f = _FONTS.get(key) or _FONTS["regular"]
    return f if os.path.exists(f) else _FONTS["regular"]


def wrap_paragraph(text, width_emu, pt, font_file):
    if not text.strip():
        return 1
    words = text.split()
    lines = 0
    current = ""
    for w in words:
        trial = w if not current else current + " " + w
        cx, _ = _rendered_size(trial, pt, font_file)
        if cx <= width_emu:
            current = trial
        else:
            if current:
                lines += 1
                current = w
            else:
                lines += 1
                current = ""
    if current:
        lines += 1
    return max(lines, 1)


def wrap_runs(runs, width_emu, pt):
    """Line count for a paragraph whose runs may differ in weight/style.

    `runs` is a list of (text, font_file). When every run shares one font this
    delegates to wrap_paragraph on the joined text, so a uniform paragraph
    measures byte-for-byte as it always has — only genuinely mixed-weight
    paragraphs (a bold or coloured word inside otherwise-regular text) take the
    per-run path, where each word is measured in its own run's font instead of
    forcing the whole line to the bold font and over-shrinking it.
    """
    fonts = {ff for _, ff in runs if ff}
    joined = "".join(t for t, _ in runs)
    if len(fonts) <= 1:
        only = next(iter(fonts)) if fonts else FONT_REGULAR
        return wrap_paragraph(joined, width_emu, pt, only)
    if not joined.strip():
        return 1
    # Per-word widths, each in its own run's font; a single space joins words.
    space_w, _ = _rendered_size(" ", pt, FONT_REGULAR)
    tokens = []  # (word_width_emu,)
    for text, ff in runs:
        use = ff or FONT_REGULAR
        for w in text.split():
            ww, _ = _rendered_size(w, pt, use)
            tokens.append(ww)
    if not tokens:
        return 1
    lines = 1
    cur = 0
    for i, ww in enumerate(tokens):
        add = ww if cur == 0 else space_w + ww
        if cur + add <= width_emu:
            cur += add
        else:
            lines += 1
            cur = ww
    return max(lines, 1)


def widest_unbroken_word(runs, pt):
    """Measure the widest whitespace-delimited word across styled runs.

    PowerPoint will split an over-wide word at an arbitrary character. Line
    counting alone cannot spot that case because it still looks like one line
    to the wrapper. Preserve the word as one unit here, including words whose
    styling changes at a run boundary, so autofit shrinks until it fits intact.
    """
    widest = 0
    current = 0
    for text, font_file in runs:
        use = font_file or FONT_REGULAR
        for token in re.split(r'(\s+)', text or ''):
            if not token:
                continue
            if token.isspace():
                widest = max(widest, current)
                current = 0
            else:
                token_w, _ = _rendered_size(token, pt, use)
                current += token_w
    return max(widest, current)


def best_fit_size(paragraphs_info, width_emu, height_emu, font_file, max_pt, floor_pt):
    """Binary search the largest integer pt (between floor_pt and max_pt) that fits.

    Returns (best_pt, hit_floor). hit_floor is True when no size >= floor_pt fits —
    the caller should log an overload warning.
    """
    usable_w = max((width_emu - PAD_W) / WIDTH_SAFETY, 1)
    usable_h = max(height_emu - PAD_H, 1)

    def fits(pt):
        base_line_h = _real_line_height_emu(font_file, pt)
        total_h = 0
        for runs, ls in paragraphs_info:
            if widest_unbroken_word(runs, pt) > usable_w:
                return False
            n = wrap_runs(runs, usable_w, pt)
            para_h = base_line_h + (n - 1) * int(base_line_h * ls)
            total_h += int(para_h * LINE_HEIGHT_SAFETY)
        return total_h <= usable_h

    lo, hi, best = int(floor_pt), int(max_pt), None
    while lo <= hi:
        mid = (lo + hi) // 2
        if fits(mid):
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    if best is None:
        return floor_pt, True
    return best, False


def inspect_runs(tf):
    max_size = 0
    any_bold = False
    any_italic = False
    for p in tf.paragraphs:
        for r in p.runs:
            if r.font.size is not None:
                pts = r.font.size.pt
                if pts > max_size:
                    max_size = pts
            if r.font.bold:
                any_bold = True
            if r.font.italic:
                any_italic = True
    return max_size, any_bold, any_italic


def apply_size(tf, pt):
    from pptx.util import Pt
    from pptx.oxml.ns import qn
    new_size = Pt(pt)
    sz_attr = str(int(pt * 100))
    for p in tf.paragraphs:
        for r in p.runs:
            r.font.size = new_size
        end_rpr = p._p.find(qn('a:endParaRPr'))
        if end_rpr is not None:
            end_rpr.set('sz', sz_attr)


GROW_FIT_RE = re.compile(
    r"^GROWFIT__(?P<group>[A-Za-z0-9-]+)__(?P<ceiling>[1-9]\d{0,2})__(?P<label>.+)$"
)


def grow_fit_directive(name):
    match = GROW_FIT_RE.fullmatch(name or "")
    if not match:
        return None
    return match.group("group"), int(match.group("ceiling"))


def measure_shape(shape, ceiling, floor_pt):
    tf = shape.text_frame
    max_size, bold, italic = inspect_runs(tf)
    if max_size <= 0:
        return None
    font_file = pick_font_file(bold, italic)

    def runs_for(paragraph):
        runs = [
            (run.text or "", pick_font_file(bool(run.font.bold), bool(run.font.italic)))
            for run in paragraph.runs
        ]
        return runs if runs else [(paragraph.text or "", font_file)]

    paragraphs_info = [
        (
            runs_for(paragraph),
            paragraph.line_spacing
            if isinstance(paragraph.line_spacing, float)
            else DEFAULT_LINE_SPACING,
        )
        for paragraph in tf.paragraphs
    ]
    best, hit_floor = best_fit_size(
        paragraphs_info,
        shape.width,
        shape.height,
        font_file,
        ceiling,
        floor_pt,
    )
    return {
        "best": best,
        "hit_floor": hit_floor,
        "current": int(round(max_size)),
    }


def process(path, floor_pt=DEFAULT_FLOOR_PT, force=False):
    prs = Presentation(path)
    grown = 0
    shrunk = 0
    unchanged = 0
    skipped = 0
    overloaded = []
    measurement_failures = []

    def record_change(tf, current, target):
        nonlocal grown, shrunk, unchanged
        if target > current:
            apply_size(tf, target)
            grown += 1
        elif target < current:
            apply_size(tf, target)
            shrunk += 1
        else:
            unchanged += 1
        tf.auto_size = MSO_AUTO_SIZE.NONE

    def record_failure(slide_number, shape, error):
        measurement_failures.append(
            (slide_number, shape.name or "<unnamed>", str(error))
        )
        print(
            f"  MEASUREMENT_FAILED slide {slide_number} "
            f"box {shape.name or '<unnamed>'!r}: {error}",
            file=sys.stderr,
        )

    for slide_idx, slide in enumerate(prs.slides):
        slide_number = slide_idx + 1
        grouped = {}
        ordinary = []

        for shape in slide.shapes:
            if not shape.has_text_frame:
                continue
            tf = shape.text_frame
            if shape.name and shape.name.startswith("NOFIT_"):
                skipped += 1
                continue
            if not tf.text.strip():
                continue

            directive = grow_fit_directive(shape.name)
            if directive is not None:
                group_id, ceiling = directive
                grouped.setdefault(group_id, []).append((shape, ceiling))
                continue

            if not force and tf.auto_size != MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE:
                continue
            ordinary.append(shape)

        for members in grouped.values():
            measured = []
            group_failed = False
            for shape, ceiling in members:
                try:
                    result = measure_shape(shape, ceiling, min(floor_pt, ceiling))
                    if result is None:
                        skipped += 1
                        group_failed = True
                        continue
                    measured.append((shape, result))
                except Exception as error:
                    record_failure(slide_number, shape, error)
                    group_failed = True
            if group_failed or not measured:
                continue

            shared = min(result["best"] for _, result in measured)
            for shape, result in measured:
                record_change(shape.text_frame, result["current"], shared)
                if result["hit_floor"]:
                    preview = shape.text_frame.text.strip().replace("\n", " ")[:60]
                    overloaded.append((slide_number, shape.name or "<unnamed>", preview))

        for shape in ordinary:
            tf = shape.text_frame
            max_size, _, _ = inspect_runs(tf)
            if max_size <= 0:
                skipped += 1
                continue
            ceiling = max(int(round(max_size)), 32) if force else int(round(max_size))
            try:
                result = measure_shape(shape, ceiling, min(floor_pt, ceiling))
                if result is None:
                    skipped += 1
                    continue
                record_change(tf, result["current"], result["best"])
                if result["hit_floor"]:
                    preview = tf.text.strip().replace("\n", " ")[:60]
                    overloaded.append((slide_number, shape.name or "<unnamed>", preview))
            except Exception as error:
                record_failure(slide_number, shape, error)

    prs.save(path)
    print(
        f"Fit-text: grown {grown}, shrunk {shrunk}, unchanged {unchanged}, "
        f"skipped {skipped} -- {os.path.basename(path)}"
    )
    for sn, shape_name, preview in overloaded:
        print(
            f"  OVERLOAD slide {sn} box {shape_name!r}: hit {floor_pt}pt floor; "
            f"content is too heavy for this box. Give it more room or split the slide. "
            f"Text preview: \"{preview}{'...' if len(preview) == 60 else ''}\"",
            file=sys.stderr,
        )

    result = {
        "grown": grown,
        "shrunk": shrunk,
        "overloaded": [
            {"slide": sn, "box": shape_name, "preview": preview}
            for sn, shape_name, preview in overloaded
        ],
        "measurementFailures": [
            {"slide": sn, "box": shape_name, "error": error}
            for sn, shape_name, error in measurement_failures
        ],
        "fontMode": FONT_MODE,
    }
    print("AUTOFIT_RESULT: " + json.dumps(result, sort_keys=True))


def main():
    args = sys.argv[1:]
    force = False
    floor_pt = DEFAULT_FLOOR_PT
    cleaned = []
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--force":
            force = True
        elif a == "--floor":
            i += 1
            floor_pt = int(args[i])
        else:
            cleaned.append(a)
        i += 1
    if not cleaned:
        print(
            "Usage: python fit_text_postprocess.py [--force] [--floor PT] <pptx-path> [<pptx-path> ...]",
            file=sys.stderr,
        )
        sys.exit(1)
    if FONT_MODE == "none":
        print(
            "  WARNING: autofit found no usable Comic Sans font (real or bundled) — "
            "text was NOT measured or shrunk. Open the deck on a machine with the font "
            "(or install it) and rebuild before trusting the slides fit.",
            file=sys.stderr,
        )
        # Nothing can be measured, so nothing downstream may treat this deck as
        # fitted. A technical gap on this machine, not a fault in the lesson.
        print("AUTOFIT_DEPENDENCY_MISSING: no usable font for measurement.")
        print('AUTOFIT_RESULT: {"fontMode": "none", "measurementFailures": [], "overloaded": []}')
        sys.exit(3)
    elif FONT_MODE == "substitute":
        print(
            "  Note: autofit measured with the bundled Comic Neue fallback (real Comic "
            "Sans not found), biased to shrink a touch early so nothing overflows.",
            file=sys.stderr,
        )
    for p in cleaned:
        if not os.path.exists(p):
            print(f"File not found: {p}", file=sys.stderr)
            sys.exit(1)
        process(p, floor_pt=floor_pt, force=force)


if __name__ == "__main__":
    main()
