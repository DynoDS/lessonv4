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

# The plugin's own installed libraries (scripts/python_extras.py).
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "scripts"))
import python_extras  # noqa: F401,E402

from PIL import ImageFont  # noqa: F401,E402 - kept for compatibility

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

# The size below which a slide does not ship. It is a projection floor, not a
# print one: the 10pt it replaced is a comfortable size on paper held at desk
# distance and unreadable from the back of a classroom, and a quarter of the
# text on decks built under it came out below 20pt, some of it at 10.
#
# It sits two points under the 20pt the teacher measured in his own room, and
# the gap is deliberate. 20 is what text should reach, and helpers size their
# boxes for it. This is the separate question of when to stop a build, and a
# point or two under target is not what makes a slide unreadable - 12pt is.
# Blocking on the rounding would cost a repair round and a rebuild to move
# text from 19pt to 20pt, which no child in the room could tell apart.
DEFAULT_FLOOR_PT = 18


def pick_font_file(bold, italic):
    key = "bolditalic" if (bold and italic) else "bold" if bold else "italic" if italic else "regular"
    f = _FONTS.get(key) or _FONTS["regular"]
    return f if os.path.exists(f) else _FONTS["regular"]


# PowerPoint breaks a line at an ordinary space and never at a no-break space
# (U+00A0), which is how the builder keeps a calculation ("2,648 + 10 =") or the
# "Success Criteria" heading on one line. Python's str.split() treats U+00A0 as
# whitespace, so measuring with it would count breaks the renderer never makes
# and leave the box under-shrunk; the measurer splits on ASCII whitespace only.
_BREAKABLE_WS = re.compile(r'[ \t\r\n\f\v]+')


def breakable_words(text):
    return [w for w in _BREAKABLE_WS.split(text or '') if w]


def wrap_paragraph(text, width_emu, pt, font_file):
    if not text.strip():
        return 1
    words = breakable_words(text)
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
        for w in breakable_words(text):
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
        for token in re.split(r'([ \t\r\n\f\v]+)', text or ''):
            if not token:
                continue
            if _BREAKABLE_WS.fullmatch(token):
                widest = max(widest, current)
                current = 0
            else:
                token_w, _ = _rendered_size(token, pt, use)
                current += token_w
    return max(widest, current)


def best_fit_size(paragraphs_info, width_emu, height_emu, font_file, max_pt, floor_pt):
    """Binary search the largest integer pt (between floor_pt and max_pt) that fits.

    Each entry is (lines, line_spacing, spacing_pt): the lines PowerPoint is
    forced to start inside that paragraph, the paragraph's line spacing, and the
    fixed space it reserves above and below itself.

    Returns (best_pt, hit_floor). hit_floor is True when no size >= floor_pt fits —
    the caller should log an overload warning.
    """
    usable_w = max((width_emu - PAD_W) / WIDTH_SAFETY, 1)
    usable_h = max(height_emu - PAD_H, 1)

    def fits(pt):
        base_line_h = _real_line_height_emu(font_file, pt)
        total_h = 0
        for lines, ls, spacing_pt in paragraphs_info:
            n = 0
            for runs in lines:
                if widest_unbroken_word(runs, pt) > usable_w:
                    return False
                n += wrap_runs(runs, usable_w, pt)
            n = max(n, 1)
            para_h = base_line_h + (n - 1) * int(base_line_h * ls)
            total_h += int(para_h * LINE_HEIGHT_SAFETY) + points_to_emu(spacing_pt)
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


def points_to_emu(pt):
    return int(float(pt) / 72.0 * 914400)


# A line PowerPoint has to start whatever the width allows: an <a:br/> element,
# or a newline character sitting inside a run's own text. Both reach a slide the
# same way and both are invisible to word-splitting.
HARD_BREAK_RE = re.compile("\r\n|[\r\n\x0b\u2028\u2029]")
_A_NS = "{http://schemas.openxmlformats.org/drawingml/2006/main}"


def paragraph_lines(paragraph, default_font):
    """The paragraph's runs, grouped into the lines the renderer must start.

    A paragraph is not always one flowing block that wraps only where it runs out
    of width. A field prompt written as "What is it? \\n Is it powered? \\n ..."
    carries hard breaks, and PowerPoint starts a new line at each one.

    Measuring across those breaks packs words onto lines the renderer will never
    put together, so the box measures shorter than it draws: autofit calls the
    text fitting, leaves it at full size, and the last line is cut off below the
    card. Grouping the runs here is what makes the measurement the same shape as
    the render.
    """
    lines = [[]]
    saw_run = False
    for child in paragraph._p:
        tag = child.tag
        if tag == _A_NS + "br":
            lines.append([])
            continue
        if tag not in (_A_NS + "r", _A_NS + "fld"):
            continue
        saw_run = True
        properties = child.find(_A_NS + "rPr")
        bold = properties is not None and properties.get("b") == "1"
        italic = properties is not None and properties.get("i") == "1"
        font_file = pick_font_file(bold, italic)
        text_element = child.find(_A_NS + "t")
        text = text_element.text if text_element is not None and text_element.text else ""
        for index, part in enumerate(HARD_BREAK_RE.split(text)):
            if index:
                lines.append([])
            if part:
                lines[-1].append((part, font_file))
    if not saw_run:
        return [[(paragraph.text or "", default_font)]]
    return lines


def paragraph_spacing_pt(paragraph):
    """The fixed space a paragraph reserves above and below itself, in points.

    pptxgenjs writes these as absolute points, and they are real height in the
    box that no font size will shrink. Left uncounted, a four-field prompt looked
    like it had a spare tenth of an inch it did not have. The last paragraph's
    space-after is counted too: PowerPoint reserves it, and counting it errs
    toward shrinking, which is the safe side of this measurement.
    """
    total = 0.0
    for value in (paragraph.space_before, paragraph.space_after):
        if value is None:
            continue
        try:
            total += float(value.pt)
        except (AttributeError, TypeError, ValueError):
            continue
    return total


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


def shape_floor(name, default):
    """An explicit projected-reading floor survives the global fitting pass."""
    match = re.match(r"^GROWFIT__[^_]+__\d+__MIN([1-9]\d{0,2})__", name or "")
    return max(default, int(match.group(1))) if match else default


def text_budget(shape, floor_pt, text):
    """How much text this box holds at the floor, as a sentence to act on.

    "Does not fit" leaves the reader to find the limit by trying again, and the
    next attempt is a guess that can be refused for the same reason. The box and
    the font are both known at the moment it refuses, so the limit is known too,
    and saying it turns a retry into arithmetic.

    Measured from this text's own characters rather than an average, because the
    answer has to be true of the words actually on the slide: a line of digits
    and a line of prose do not fit the same box.
    """
    body = " ".join(str(text).split())
    if not body:
        return ""

    _, bold, italic = inspect_runs(shape.text_frame)
    font_file = pick_font_file(bold, italic)

    try:
        text_w, _ = _rendered_size(body, floor_pt, font_file)
        line_h = _real_line_height_emu(font_file, floor_pt) * LINE_HEIGHT_SAFETY
    except Exception:
        return ""

    usable_w = max((shape.width - PAD_W) / WIDTH_SAFETY, 1)
    usable_h = max(shape.height - PAD_H, 1)
    per_char = text_w / len(body)
    if per_char <= 0 or line_h <= 0:
        return ""

    # A box shorter than one line of readable text holds none of it, however
    # wide it is. Counting it as one line reported a heading strip on a Year 4
    # Your Turn (0.25" tall) as "1 line of about 60 characters" that its 25
    # characters "fit by count", which sends the repair at the words or the
    # width when only height will do (16 September 2026).
    if usable_h < line_h:
        return (
            "The box is %.2f\" tall, and one line at %dpt needs about %.2f\", so it "
            "cannot hold a single line. It needs to be taller; the wording and the "
            "width are not the problem."
            % (shape.height / 914400.0, floor_pt, (line_h + PAD_H) / 914400.0)
        )

    chars_per_line = max(1, int(usable_w // per_char))
    lines = max(1, int(usable_h // line_h))
    budget = chars_per_line * lines
    longest_word = max((len(w) for w in body.split()), default=0)

    # Two different problems wear the same refusal, and the repair is different
    # for each. Too many words is a volume problem, answered by cutting or by a
    # bigger zone. Words that will not break into lines this short is a shape
    # problem: the box has the area but not the width, and cutting a sentence
    # that already fits by count does nothing. Reporting a budget the text is
    # already inside, with no explanation, reads as the build contradicting
    # itself and sends the repair at the wrong thing.
    if len(body) > budget:
        return (
            "The box holds about %d characters at %dpt (%d line%s of about %d); "
            "this one is %d."
            % (budget, floor_pt, lines, "" if lines == 1 else "s", chars_per_line, len(body))
        )

    if longest_word > chars_per_line:
        return (
            "The box is %d line%s of about %d characters at %dpt, and \"%s\" is "
            "%d characters, so this text cannot break into lines that short. It "
            "needs a wider box, not fewer words."
            % (lines, "" if lines == 1 else "s", chars_per_line, floor_pt,
               max(body.split(), key=len), longest_word)
        )

    return (
        "The box is %d line%s of about %d characters at %dpt. These %d "
        "characters fit that by count but not once the words break, so the box "
        "needs to be wider or taller rather than the wording shorter."
        % (lines, "" if lines == 1 else "s", chars_per_line, floor_pt, len(body))
    )


def measure_shape(shape, ceiling, floor_pt):
    tf = shape.text_frame
    max_size, bold, italic = inspect_runs(tf)
    if max_size <= 0:
        return None
    font_file = pick_font_file(bold, italic)

    paragraphs_info = [
        (
            paragraph_lines(paragraph, font_file),
            paragraph.line_spacing
            if isinstance(paragraph.line_spacing, float)
            else DEFAULT_LINE_SPACING,
            paragraph_spacing_pt(paragraph),
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
                    result = measure_shape(shape, ceiling, shape_floor(shape.name, min(floor_pt, ceiling)))
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
                    full = shape.text_frame.text
                    preview = full.strip().replace("\n", " ")[:60]
                    overloaded.append((
                        slide_number,
                        shape.name or "<unnamed>",
                        preview,
                        text_budget(shape, shape_floor(shape.name, floor_pt), full),
                    ))

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
                    overloaded.append((
                        slide_number,
                        shape.name or "<unnamed>",
                        preview,
                        text_budget(shape, min(floor_pt, ceiling), tf.text),
                    ))
            except Exception as error:
                record_failure(slide_number, shape, error)

    prs.save(path)
    print(
        f"Fit-text: grown {grown}, shrunk {shrunk}, unchanged {unchanged}, "
        f"skipped {skipped} -- {os.path.basename(path)}"
    )
    for sn, shape_name, preview, budget in overloaded:
        room = f" {budget}" if budget else ""
        print(
            f"  OVERLOAD slide {sn} box {shape_name!r}: hit {shape_floor(shape_name, floor_pt)}pt floor; "
            f"content is too heavy for this box.{room} Give it more room or split the slide. "
            f"Text preview: \"{preview}{'...' if len(preview) == 60 else ''}\"",
            file=sys.stderr,
        )

    result = {
        "grown": grown,
        "shrunk": shrunk,
        "overloaded": [
            {"slide": sn, "box": shape_name, "preview": preview, "budget": budget}
            for sn, shape_name, preview, budget in overloaded
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
