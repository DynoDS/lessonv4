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
#
# 1.2em was itself cautious. Measured against PowerPoint on 8 October 2026
# (TextRange.BoundHeight over 349 boxes in four finished decks), the height
# worked out here ran 8% over what PowerPoint drew, almost box for box, so
# text stopped a size short of what fitted: a Year 6 advice card sat at 19pt,
# 77% full, when 20pt fitted at 96%, and the teacher saw the gap ("text for
# both boxes could be bigger"). At 1.145em the estimate still runs about 3%
# over. Eight finished decks rebuilt both ways and measured the same way: 249
# of 1,107 boxes a size or two bigger, none smaller, none past its box, the
# fullest at 99%. He chose it from the rebuilt slides. Before lowering it
# again, measure again: the 3% left is what keeps a card from spilling.
MEASUREMENT_LINE_HEIGHT_EM = 1.145


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

# A fraction is written top and bottom, on the board as on paper.
#
# Slide text is typed, so "1/2" was drawn with a slash on the same slide as a
# fraction wall of stacked fractions (stress test, 7 October 2026; the teacher,
# 9 October 2026: "fractions should always be top and bottom"). Paper stacks a
# typed fraction in its page (shared/text/stacked-fractions.js, whose pattern
# this one copies). A PowerPoint text box cannot be styled that way, but it can
# hold PowerPoint's own fraction inside a line of words: an equation of one
# fraction, set upright in the run's own typeface, colour and size. That is
# what `stack_fractions` writes, once every box has its size, with the slash
# kept as the fallback another program shows.
#
# A line holding one is taller, and the fit has to know before it chooses a
# size or the fraction is cut off at the foot of its card. Measured in
# PowerPoint (TextRange.BoundHeight, 9 October 2026): a line with a stacked
# fraction is 2.06 to 2.09 of its type size where an ordinary line is 1.2, at
# 27pt and at 40pt alike. `fraction_extra_em` is that difference with a little
# headroom.
FRACTION_RE = re.compile(
    '(^|[^\\d/.,])(\\d{1,3}|\\?|[\u25A1\u25A2\u2610\u25FB\u25AB])/'
    '(\\d{1,3}|\\?|[\u25A1\u25A2\u2610\u25FB\u25AB])(?![\\d/]|[.,]\\d)'
)
# How big the fraction is. A stacked fraction at the size of its words makes
# its line nearly twice as tall, and a card planned for plain lines can only
# hold that by shrinking every word on it (a Teach slide's three cards went
# from 27pt to about 14pt). So each box takes the biggest of these sizes that
# leaves its words the size they would have been with no fraction in them, and
# the smallest when none does. The teacher's choice from the real slides,
# 9 October 2026 ("biggest fraction that doesn't shrink the words").
#
# The smallest is the size at which the pair stands inside an ordinary line
# with a little room over: no card changes size for it and no words shrink.
FRACTION_SCALES = (1.0, 0.75, 0.55)
# Two fractions one under the other never overlap (PowerPoint gives a line the
# height of the tallest thing on it), but once the fraction is what sets the
# line's height, the denominator above and the numerator below all but touch
# (the teacher, from the trial slides: "would they be touching?"). So a box
# whose fractions are bigger than the smallest size has every paragraph that
# holds one set this much looser (of a line), which reads as a clear gap. At
# the smallest size the line already has that room.
FRACTION_AIR = 0.15


def fraction_needs_air(scale):
    return bool(scale) and scale > FRACTION_SCALES[-1]


def fraction_extra_em(scale):
    """How much taller than an ordinary line a line holding a fraction is."""
    if not scale:
        return 0.0
    return max(0.0, 2.09 * scale - 1.2) + (0.04 if fraction_needs_air(scale) else 0.0)


# The size the box being measured would give its fractions (0 measures the
# words alone), and the size each fitted box settled on, by its XML element.
_measuring_scale = FRACTION_SCALES[-1]
_shape_scales = {}
_M_NS = "http://schemas.openxmlformats.org/officeDocument/2006/math"
_A14_NS = "http://schemas.microsoft.com/office/drawing/2010/main"
_MC_NS = "http://schemas.openxmlformats.org/markup-compatibility/2006"
_A_URI = "http://schemas.openxmlformats.org/drawingml/2006/main"


def has_fraction(text):
    return bool(text) and '/' in text and FRACTION_RE.search(text) is not None


def fraction_lines(runs, width_emu, pt):
    """How many of the lines this run of words wraps onto hold a fraction.

    Wrapped a word at a time, each in its own run's font, as wrap_runs does for
    mixed runs. A sentence of three lines with one fraction has one taller
    line, not three.
    """
    if not any(has_fraction(text) for text, _ in runs):
        return 0
    space_w, _ = _rendered_size(" ", pt, FONT_REGULAR)
    held = 0
    cur = 0
    line_has = False
    for text, ff in runs:
        use = ff or FONT_REGULAR
        for w in breakable_words(text):
            ww, _ = _rendered_size(w, pt, use)
            add = ww if cur == 0 else space_w + ww
            if cur and cur + add > width_emu:
                held += 1 if line_has else 0
                cur, line_has = ww, False
            else:
                cur += add
            if has_fraction(w):
                line_has = True
    return held + (1 if line_has else 0)


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

    # The height the text really takes at `pt`, or None when a word is too wide
    # to break. Separated from `fits` so the caller can also learn how much of
    # the box the chosen size actually uses: a box the text fits inside easily
    # and a box the text nearly fills are both "fits", and only one of them is
    # a slide worth looking at.
    def used_height(pt):
        base_line_h = _real_line_height_emu(font_file, pt)
        fraction_extra = int(pt * fraction_extra_em(_measuring_scale) / 72.0 * 914400)
        total_h = 0
        for lines, ls, spacing_pt in paragraphs_info:
            n = 0
            taller = 0
            for runs in lines:
                if widest_unbroken_word(runs, pt) > usable_w:
                    return None
                n += wrap_runs(runs, usable_w, pt)
                taller += fraction_lines(runs, usable_w, pt)
            n = max(n, 1)
            # A paragraph holding a bigger fraction is drawn looser, every line of it.
            if taller and fraction_needs_air(_measuring_scale):
                ls = ls + FRACTION_AIR
                para_h = int(base_line_h * (1 + FRACTION_AIR)) + (n - 1) * int(base_line_h * ls) + taller * fraction_extra
            else:
                para_h = base_line_h + (n - 1) * int(base_line_h * ls) + taller * fraction_extra
            total_h += int(para_h * LINE_HEIGHT_SAFETY) + points_to_emu(spacing_pt)
        return total_h

    def fits(pt):
        total_h = used_height(pt)
        return total_h is not None and total_h <= usable_h

    lo, hi, best = int(floor_pt), int(max_pt), None
    while lo <= hi:
        mid = (lo + hi) // 2
        if fits(mid):
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    if best is None:
        return floor_pt, True, 1.0
    taken = used_height(best)
    fill = (taken / usable_h) if (taken and usable_h > 0) else 1.0
    return best, False, fill


def points_to_emu(pt):
    return int(float(pt) / 72.0 * 914400)


# A line PowerPoint has to start whatever the width allows: an <a:br/> element,
# or a newline character sitting inside a run's own text. Both reach a slide the
# same way and both are invisible to word-splitting.
def _fraction_xml(rpr_xml, top, bottom):
    def part(text):
        return '<m:r><m:rPr><m:nor/></m:rPr>%s<m:t>%s</m:t></m:r>' % (rpr_xml, text)
    return (
        '<mc:AlternateContent xmlns:mc="%s" xmlns:a="%s" xmlns:a14="%s" xmlns:m="%s">'
        '<mc:Choice Requires="a14"><a14:m><m:oMath><m:f><m:fPr><m:ctrlPr>%s</m:ctrlPr></m:fPr>'
        '<m:num>%s</m:num><m:den>%s</m:den></m:f></m:oMath></a14:m></mc:Choice>'
        '<mc:Fallback><a:r>%s<a:t>%s/%s</a:t></a:r></mc:Fallback></mc:AlternateContent>'
        % (_MC_NS, _A_URI, _A14_NS, _M_NS, rpr_xml, part(top), part(bottom), rpr_xml, top, bottom)
    )


def _slide_text_paragraphs(prs):
    """Every paragraph of words on a slide: a text box's, and a table cell's.

    A table cell is not one of the boxes the fit sizes, so it has no size of
    its own on record and takes the smallest fraction, the one that stands
    inside an ordinary line and so leaves the row the height it was.
    """
    bodies = (
        "{http://schemas.openxmlformats.org/presentationml/2006/main}txBody",
        _A_NS + "txBody",
    )
    for slide in prs.slides:
        for paragraph in slide._element.iter(_A_NS + "p"):
            if paragraph.getparent().tag in bodies:
                yield paragraph


def give_fractions_air(prs):
    """Loosen the line spacing of a paragraph whose fractions set its line height.

    Done once every box has its size and just before the fractions are stacked:
    the fit has already counted this spacing for the size it chose. A paragraph
    whose fractions are already stacked (a deck fitted twice) has no typed
    fraction left and is not loosened again.
    """
    from lxml import etree
    for paragraph in _slide_text_paragraphs(prs):
        texts = [t.text for r in paragraph.findall(_A_NS + "r") for t in r.findall(_A_NS + "t")]
        if not any(has_fraction(text) for text in texts):
            continue
        if not fraction_needs_air(_shape_scales.get(paragraph.getparent().getparent(), FRACTION_SCALES[-1])):
            continue
        ppr = paragraph.find(_A_NS + "pPr")
        if ppr is None:
            ppr = etree.SubElement(paragraph, _A_NS + "pPr")
            paragraph.remove(ppr)
            paragraph.insert(0, ppr)
        spacing = ppr.find(_A_NS + "lnSpc")
        if spacing is None:
            spacing = etree.Element(_A_NS + "lnSpc")
            ppr.insert(0, spacing)
        pct = spacing.find(_A_NS + "spcPct")
        if pct is None:
            if len(spacing):
                continue  # spaced in points: left as the template set it
            pct = etree.SubElement(spacing, _A_NS + "spcPct")
            pct.set("val", str(int(DEFAULT_LINE_SPACING * 100000)))
        pct.set("val", str(int(pct.get("val")) + int(FRACTION_AIR * 100000)))


def stack_fractions(prs):
    """Rewrite every typed fraction in a slide's text boxes as a stacked one.

    The text of shapes and of table cells. The teacher's notes keep the typed
    form: they are read by one adult, not taught from. A run is split around each fraction
    and every piece keeps the run's own properties, so colour, weight and size
    carry through. Returns how many were stacked.
    """
    from copy import deepcopy
    from lxml import etree
    done = 0
    t_tag, r_tag, rpr_tag = _A_NS + "t", _A_NS + "r", _A_NS + "rPr"
    for paragraph in list(_slide_text_paragraphs(prs)):
        for run in list(paragraph):
            if run.tag != r_tag:
                continue
            t = run.find(t_tag)
            text = t.text if t is not None else None
            if not has_fraction(text):
                continue
            rpr = run.find(rpr_tag)
            rpr_xml = etree.tostring(rpr, encoding="unicode") if rpr is not None else ""
            scale = _shape_scales.get(paragraph.getparent().getparent(), FRACTION_SCALES[-1])
            if scale != 1 and rpr is not None and rpr.get('sz'):
                small = deepcopy(rpr)
                small.set('sz', str(int(int(rpr.get('sz')) * scale)))
                frac_rpr_xml = etree.tostring(small, encoding="unicode")
            else:
                frac_rpr_xml = rpr_xml
            pieces = []

            def plain(words):
                if not words:
                    return
                piece = deepcopy(run)
                piece.find(t_tag).text = words
                pieces.append(piece)

            at = 0
            for m in FRACTION_RE.finditer(text):
                plain(text[at:m.start()] + m.group(1))
                pieces.append(etree.fromstring(_fraction_xml(frac_rpr_xml, m.group(2), m.group(3))))
                done += 1
                at = m.end()
            plain(text[at:])
            parent = run.getparent()
            index = parent.index(run)
            parent.remove(run)
            for offset, piece in enumerate(pieces):
                parent.insert(index + offset, piece)
    return done


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
        if tag == "{%s}AlternateContent" % _MC_NS:
            # A fraction already stacked (a deck fitted twice): its fallback run
            # is the typed form, and that is what is measured.
            fallback = child.find("{%s}Fallback/%sr" % (_MC_NS, _A_NS))
            if fallback is None:
                continue
            child = fallback
            tag = child.tag
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
        # A stacked fraction's own runs sit inside its equation, where p.runs
        # does not reach.
        for rpr in p._p.iter(qn('a:rPr')):
            if rpr.get('sz') is not None:
                rpr.set('sz', sz_attr)
        end_rpr = p._p.find(qn('a:endParaRPr'))
        if end_rpr is not None:
            end_rpr.set('sz', sz_attr)


GROW_FIT_RE = re.compile(
    r"^GROWFIT__(?P<group>[A-Za-z0-9-]+)__(?P<ceiling>[1-9]\d{0,2})__(?P<label>.+)$"
)


# A paired card that also sits in a group on its own slide says so in its name
# ("paired-text-WITH-<group>"). The pair settles across two slides and the
# group within one, and a card in both ties them into one size.
PAIRED_WITH = "paired-text-WITH-"


def paired_slide_group(name):
    match = GROW_FIT_RE.fullmatch(name or "")
    if not match or not match.group("label").startswith(PAIRED_WITH):
        return None
    return match.group("label")[len(PAIRED_WITH):] or None


def grow_fit_directive(name):
    match = GROW_FIT_RE.fullmatch(name or "")
    if not match:
        return None
    return match.group("group"), int(match.group("ceiling"))


# A success-criteria list the lesson designer marked too long for every panel
# is drawn smaller rather than not at all, down to this, on a slide flagged for
# the teacher (his ruling of 24 September 2026: 20pt the smallest his whole
# class read, 16pt "really close to that limit"). The builder names that list's
# lines `marked-`; every other box keeps the projection floor, which its own
# explicit floor can only raise.
MARKED_LIST_FLOOR_PT = 16


def shape_floor(name, default):
    """An explicit projected-reading floor survives the global fitting pass.
    Only a marked list's step line may carry one under the default (a sticky
    line beside it keeps 18pt), and never under MARKED_LIST_FLOOR_PT."""
    match = re.match(r"^GROWFIT__[^_]+__\d+__MIN([1-9]\d{0,2})__(.*)$", name or "")
    if not match:
        return default
    explicit = int(match.group(1))
    if explicit < default and match.group(2).startswith("marked-step-text-"):
        return max(explicit, MARKED_LIST_FLOOR_PT)
    return max(default, explicit)


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
    global _measuring_scale

    def at(scale):
        global _measuring_scale
        _measuring_scale = scale
        try:
            return best_fit_size(paragraphs_info, shape.width, shape.height, font_file, ceiling, floor_pt)
        finally:
            _measuring_scale = FRACTION_SCALES[-1]

    holds_fraction = any(
        has_fraction(text) for lines, _, _ in paragraphs_info for runs in lines for text, _ in runs
    )
    if not holds_fraction:
        best, hit_floor, fill = at(0)
    else:
        # What the words alone would be given, then the biggest fraction that
        # leaves them that.
        words_alone, _, _ = at(0)
        chosen = FRACTION_SCALES[-1]
        for scale in FRACTION_SCALES:
            best, hit_floor, fill = at(scale)
            if not hit_floor and best >= words_alone:
                chosen = scale
                break
        else:
            best, hit_floor, fill = at(chosen)
        _shape_scales[shape._element] = chosen
    return {
        "best": best,
        "hit_floor": hit_floor,
        "current": int(round(max_size)),
        "fill": fill,
    }


# Text aims for 20pt and may go as low as 18 when the words will not fit at 20
# (`styles.js`, the projection floor). Both are legal, and nothing said which
# had happened, so a Teach slide whose three cards all shrank to 18 read as a
# deliberate size rather than as three cards with too many words in them. The
# teacher read it straight off the board (18 September 2026): "they're all 18
# font size when 20 is minimum unless it has to be lower. I don't think these
# have to be lower." The repair for one of these is always the words, so the
# run says which boxes gave way.
TARGET_PT = 20


# Text that fits easily inside a box far bigger than it needs.
#
# The other size check on this page asks "is this text under 20pt". That is the
# wrong question on its own, and a whole deck proved it: on Round to 10, 100 or
# 1,000 (19 September 2026) it produced 37 complaints, every one of them about
# the five success criteria at 18pt, which the teacher then said "looked fine".
# It said nothing at all about the eight things he DID change by hand, because
# all of them were comfortably over 20pt: 22pt questions sitting in 2.07in cards,
# 27pt cards in 1.49in boxes, a 27pt speech bubble in a 2.75in card. The check
# fired six times on the one thing he approved and zero times on the eight he
# rejected. A number on its own cannot see an empty box.
#
# So this asks the other question: how much of its box is the text actually
# using. 22pt in a 2.07in card uses a fifth of it, which is a card that should
# have been smaller or type that should have been bigger, and either way a slide
# with a hole in it.
#
# Three exclusions, each because it is a box that is SUPPOSED to be loose:
#   a short label   "(1)", "(a)" - a question number is given the card's full
#                   height so it centres beside the words, and its own text will
#                   never fill that. Judging it would report every card twice.
#   a fill box      `fill-text` asks for a box the size of the zone on purpose,
#                   so the answer reveal lands in the middle of the slide.
#   a NOFIT box     a badge or marker whose size is set deliberately and which
#                   this pass is not allowed to resize anyway.
#
# MIN_UNDERFILL_H keeps it off small furniture: half an inch of slack in a
# six-inch card is the fault, the same proportion in a one-inch strip is not
# worth a teacher's attention.
UNDERFILL_RATIO = 0.45
MIN_UNDERFILL_H = Emu(1.2 * 914400)
LABEL_TEXT = re.compile(r"^[\(\[]?\s*[0-9a-zA-Z]{1,3}\s*[\)\].:]?$")


def note_underfilled(collected, slide_number, shape, result):
    try:
        fill = float(result.get("fill"))
    except (TypeError, ValueError):
        return
    if fill >= UNDERFILL_RATIO:
        return
    if shape.height is None or shape.height < MIN_UNDERFILL_H:
        return
    name = shape.name or "<unnamed>"
    if "fill-text" in name or name.startswith("NOFIT"):
        return
    text = " ".join(shape.text_frame.text.split())
    if not text or LABEL_TEXT.match(text):
        return
    collected.append((
        slide_number,
        name,
        round(fill * 100),
        round(Emu(shape.height).inches, 2),
        text[:60],
    ))


def note_below_target(collected, slide_number, shape, final_pt):
    try:
        final = float(final_pt)
    except (TypeError, ValueError):
        return
    if final >= TARGET_PT:
        return
    name = shape.name or "<unnamed>"
    preview = " ".join(shape.text_frame.text.split())[:60]
    collected.append((slide_number, name, round(final, 1), preview))


# A card's sign (the pencil, speech bubble or magnifier of content/text.js) is
# drawn at the card's left edge, halfway down, before anyone knows how large
# the words will be or where they will wrap. On a tall centred card that put a
# pencil beside the third line of a task, a long way from `Write`. The teacher
# chose from three positions (8 October 2026): tucked beside the first word.
# Only this script knows the final size, so it moves the sign: level with the
# first line, its right edge one gap from where that line starts, and no
# taller than the line. A sign whose words cannot be measured stays where the
# builder drew it.
CARD_SIGN_NAME = "CardSign"
CARD_SIGN_GAP = Emu(int(0.10 * 914400))
CARD_SIGN_TUCK = Emu(int(0.16 * 914400))
CARD_SIGN_SPANS = 0.7
CARD_SIGN_REACH =Emu(int(0.06 * 914400))


def first_line_width(runs, width_emu, pt):
    """Width of the first line these runs wrap to, each word in its own font."""
    cur = 0
    for text, font_file in runs:
        use = font_file or FONT_REGULAR
        space_w, _ = _rendered_size(" ", pt, use)
        for word in breakable_words(text):
            word_w, _ = _rendered_size(word, pt, use)
            add = word_w if cur == 0 else space_w + word_w
            if cur and cur + add > width_emu:
                return cur
            cur += add
    return cur


def text_block(shape):
    """(height of the whole text, width of its first line, one line's height)."""
    tf = shape.text_frame
    pt, bold, italic = inspect_runs(tf)
    if pt <= 0:
        return None
    font_file = pick_font_file(bold, italic)
    usable_w = max((shape.width - PAD_W) / WIDTH_SAFETY, 1)
    line_h = _real_line_height_emu(font_file, pt)
    total_h = 0
    first_w = None
    for paragraph in tf.paragraphs:
        spacing = paragraph.line_spacing if isinstance(paragraph.line_spacing, float) else DEFAULT_LINE_SPACING
        n = 0
        for runs in paragraph_lines(paragraph, font_file):
            if first_w is None and "".join(t for t, _ in runs).strip():
                first_w = first_line_width(runs, usable_w, pt)
            n += wrap_runs(runs, usable_w, pt)
        n = max(n, 1)
        total_h += line_h + (n - 1) * int(line_h * spacing) + points_to_emu(paragraph_spacing_pt(paragraph))
    if not first_w:
        return None
    return total_h, first_w, line_h


def sign_text_shape(slide, sign):
    """The text box a card's sign was drawn for: it starts one gap to the sign's right."""
    wanted_left = sign.left + sign.width + CARD_SIGN_GAP
    middle = sign.top + sign.height // 2
    best = None
    for shape in slide.shapes:
        if not shape.has_text_frame or not shape.text_frame.text.strip():
            continue
        if abs(shape.left - wanted_left) > CARD_SIGN_REACH:
            continue
        if not (shape.top <= middle <= shape.top + shape.height):
            continue
        if best is None or abs(shape.left - wanted_left) < abs(best.left - wanted_left):
            best = shape
    return best


def place_card_signs(prs):
    from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
    moved = 0
    for slide in prs.slides:
        for sign in [s for s in slide.shapes if (s.name or "").startswith(CARD_SIGN_NAME)]:
            try:
                shape = sign_text_shape(slide, sign)
                block = text_block(shape) if shape is not None else None
                if block is None:
                    continue
                total_h, first_w, line_h = block
                edge = sign.left
                tf = shape.text_frame
                # A sign about as tall as all its words already sits beside
                # them: one or two lines of small type with a pencil the height
                # of both. It keeps its size and its place halfway down (the
                # teacher, 8 October 2026, of a Year 6 slide where the first
                # version shrank it to one small line: "bigger and better
                # placed" before). Only words much taller than the sign leave
                # it stranded, and there it rises to the first line.
                if sign.height < total_h * CARD_SIGN_SPANS:
                    if sign.height > line_h:
                        sign.width = Emu(int(sign.width * line_h / sign.height))
                        sign.height = Emu(int(line_h))
                    top = shape.top
                    if tf.vertical_anchor != MSO_ANCHOR.TOP:
                        top = shape.top + max(0, (shape.height - total_h) // 2)
                    sign.top = Emu(int(max(shape.top, min(top + (line_h - sign.height) // 2,
                                                           shape.top + shape.height - sign.height))))
                first = next((p for p in tf.paragraphs if p.text.strip()), tf.paragraphs[0])
                if first.alignment == PP_ALIGN.CENTER:
                    start = shape.left + (shape.width - first_w) // 2
                    sign.left = Emu(int(max(edge, start - CARD_SIGN_TUCK - sign.width)))
                elif first.alignment in (None, PP_ALIGN.LEFT):
                    sign.left = Emu(int(shape.left - CARD_SIGN_GAP - sign.width))
                moved += 1
            except Exception as error:  # a sign left where it was drawn is still a sign
                print(f"  CARD_SIGN_NOT_MOVED: {error}", file=sys.stderr)
    return moved


def process(path, floor_pt=DEFAULT_FLOOR_PT, force=False):
    prs = Presentation(path)
    _shape_scales.clear()
    grown = 0
    shrunk = 0
    unchanged = 0
    skipped = 0
    overloaded = []
    below_target = []
    underfilled = []
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

    def settle_group(members):
        measured = []
        group_failed = False
        for slide_number, shape, ceiling in members:
            try:
                result = measure_shape(shape, ceiling, shape_floor(shape.name, min(floor_pt, ceiling)))
                if result is None:
                    group_failed = True
                    continue
                measured.append((slide_number, shape, result))
            except Exception as error:
                record_failure(slide_number, shape, error)
                group_failed = True
        if group_failed or not measured:
            return

        shared = min(result["best"] for _, _, result in measured)
        for slide_number, shape, result in measured:
            record_change(shape.text_frame, result["current"], shared)
            note_below_target(below_target, slide_number, shape, shared)
            note_underfilled(underfilled, slide_number, shape, result)
            if result["hit_floor"]:
                full = shape.text_frame.text
                preview = full.strip().replace("\n", " ")[:60]
                overloaded.append((
                    slide_number,
                    shape.name or "<unnamed>",
                    preview,
                    text_budget(shape, shape_floor(shape.name, floor_pt), full),
                ))

    paired_grouped = {}
    # (slide, group on that slide) -> the pair groups a card ties it to, and the
    # slide groups held back to be settled with those pairs.
    tied = {}
    held = {}
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
                target = paired_grouped if group_id.startswith("revealpair-") else grouped
                target.setdefault(group_id, []).append((slide_number, shape, ceiling))
                own = paired_slide_group(shape.name) if target is paired_grouped else None
                if own:
                    tied.setdefault((slide_number, own), set()).add(group_id)
                continue

            if not force and tf.auto_size != MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE:
                continue
            ordinary.append(shape)

        for group_id, members in grouped.items():
            if (slide_number, group_id) in tied:
                held[(slide_number, group_id)] = members
            else:
                settle_group(members)

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
                note_below_target(below_target, slide_number, shape, result["best"])
                note_underfilled(underfilled, slide_number, shape, result)
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

    # Only explicitly paired reveal groups share a final fitted size across
    # slides. Legacy groups still settle independently within each slide.
    # A pair tied to a group on its slide settles with that whole group, and
    # with every other pair the group holds, so a row of cards is one size on
    # the question slide and on the answers slide alike.
    parent = {}

    def find(key):
        parent.setdefault(key, key)
        while parent[key] != key:
            parent[key] = parent[parent[key]]
            key = parent[key]
        return key

    for slide_key, pair_ids in tied.items():
        for pair_id in pair_ids:
            parent[find(("pair", pair_id))] = find(("slide", slide_key))
    merged = {}
    for pair_id, members in paired_grouped.items():
        merged.setdefault(find(("pair", pair_id)), []).extend(members)
    for slide_key, members in held.items():
        merged.setdefault(find(("slide", slide_key)), []).extend(members)
    for members in merged.values():
        settle_group(members)

    place_card_signs(prs)
    # Last, once every box has its size: the fit measured each fraction as a
    # taller line, and the runs it sized are the ones split here.
    give_fractions_air(prs)
    stacked = stack_fractions(prs)
    if stacked:
        print(f"Fit-text: {stacked} fraction(s) stacked top and bottom")

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

    for sn, shape_name, pt, preview in below_target:
        print(
            f"  BELOW_TARGET slide {sn} box {shape_name!r}: fitted at {pt}pt, under the 20pt "
            f"target. Shorter words here read better than smaller ones. "
            f"Text preview: \"{preview}{'...' if len(preview) == 60 else ''}\"",
            file=sys.stderr,
        )

    for sn, shape_name, pct, box_h, preview in underfilled:
        print(
            f"  UNDERFILLED slide {sn} box {shape_name!r}: the text uses {pct}% of a "
            f"{box_h}in box. Either the box is bigger than its content needs or the "
            f"type should have grown into it. "
            f"Text preview: \"{preview}{'...' if len(preview) == 60 else ''}\"",
            file=sys.stderr,
        )

    result = {
        "grown": grown,
        "shrunk": shrunk,
        "underfilled": [
            {"slide": sn, "box": shape_name, "fillPct": pct, "boxH": box_h, "preview": preview}
            for sn, shape_name, pct, box_h, preview in underfilled
        ],
        "belowTarget": [
            {"slide": sn, "box": shape_name, "pt": pt, "preview": preview}
            for sn, shape_name, pt, preview in below_target
        ],
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
