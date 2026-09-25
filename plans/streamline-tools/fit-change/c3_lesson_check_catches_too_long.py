"""Point 3 of the fit release (4.2.289): a list none of the criteria panels the
guidance names can hold is caught by the lesson check, before any slides are
made.

The teacher agreed on 23 September 2026 that a list too long even for the
widest box goes back to the lesson designer, who owns the words, so the
half-slide limit stays unbroken. `validate-lesson-design.py` now measures every
`steps` success criterion the way the builder does: the step fitter's
arithmetic at the 18pt floor, with the builder's own table of Comic Sans widths
read from `shared/text/comic-glyph-width.js`, in exactly the shapes
`slide-success-criteria.md` sends the slide designer to: the practice panel at
each of its three widths, and the half-width side (`split-h-50-50`, 0.15 inches
taller than the widest practice panel). A list any of them holds passes; a
list none holds is refused, naming the lines each step takes and what the
roomiest of them, the half-width side, holds. The check and the guidance name
the same shapes, so a list the check passes is one the slide designer can
place. (The first check's finding 4: the check had measured only the widest
practice panel, and refused lists the half-width side can hold. A wider band or
a callout centre can hold a list of a few very long steps that neither holds,
but the guidance never sends a list there, so the check does not count them:
the teacher agreed that a list too long for the box is caught here and
tightened, not delivered flagged.)

The message speaks to the lesson designer, where the words are written, and
asks it to tighten the wording, keeping what each step tells a stuck child to
do. It never tells anyone downstream to shorten or drop a criterion:
decisions 3, 12 and 13 of the success-criteria topic stand.

Decision 11 of that topic stands too, in his words: "There is not a time where
I want the PowerPoint slide deck to never be produced because of an error." A
design the validator refuses after the designer's repair passes ends the run
blocked with no deck, so the check must never be the thing that does that. The
refusal therefore says what to do when tightening has failed: keep the words,
mark the list itself `"tooLongForPanels": true`, and say why in `flagsForTeacher`
as for any other departure, in plain words that name the list. The check reads
only the mark, never the words of a flag (the fourth check found that matching
a flag's words let a flag written for something else through, and covered
lists it did not name). A marked list passes the check; the slide builder then
refuses every slide that shows it, and the deck is delivered with each of those
slides as a blank page for the teacher to check, as it already is for a list no
shape holds. The refusal says that cost plainly, so the designer weighs it and
tightens first; nothing in the playbook changes (the second check's finding 4).
A mark on a list the check does not find too long is not refused:
`criteria_marker_notes` names it as a note after the pass, and the review page
shows it.

The rule is exact for a list with at most one sticky line; with two, the
builder can be the stricter of the two, so this check can only ever let a list
through that the builder then flags, never refuse one it draws. The parity
test (`test_a_criteria_list_fits_within_half_the_slide.py`) holds that, and
holds the panels' sizes to the builder's.

    python -X utf8 plans/streamline-tools/fit-change/c3_lesson_check_catches_too_long.py
"""
from _patch import replace_once

VALIDATOR = "scripts/validate-lesson-design.py"

replace_once(VALIDATOR, """import json
import re
import sys
""", """import json
import math
import re
import sys
""")

CHECK = r'''

# A criteria list the panels the guidance names can hold.
#
# A practice slide's success-criteria panel widens itself only as far as its
# list needs to read at 18pt, the teacher's floor, and no further than 6.35in;
# when even that refuses, slide-success-criteria.md sends the slide designer to
# the half-width split, whose side is 0.15in taller. Nobody after the lesson
# designer may reword, shorten or drop a criterion, so a list neither can hold
# could only ever reach the board as a slide the teacher is told to check. It
# is caught here, where the words are written (his decision of 23 September
# 2026: a list too long even for the widest box is caught before any slides are
# made, and the lesson designer tightens it).
#
# The measure is the builder's own: the step fitter's arithmetic at the floor
# (builder/src/content/steps.js), with the builder's table of Comic Sans widths
# read from the file the builder reads, in exactly the shapes the guidance
# names, so the check and the guidance cannot part company. A list any of them
# holds passes. For a list with at most one sticky line this is the builder's
# verdict exactly; with two, the builder can be the stricter, so this never
# refuses a list the builder would draw in them.
# test_a_criteria_list_fits_within_half_the_slide.py holds the two together,
# and holds these sizes to the builder's.
NAMED_PANELS = (
    # (name, width, height), in inches, as the builder draws them.
    ("the practice panel at 4.60in", 4.6, 6.5),        # maths-turn-sc.js SC_WIDTHS, SC_H
    ("the practice panel at 5.50in", 5.5, 6.5),
    ("the practice panel at 6.35in", 6.35, 6.5),
    ("the half-width side", 6.346500000000001, 6.65),  # split-h-50-50
)
ROOMIEST_PANEL = "the half-width side"
PANEL_PAD, PANEL_LABEL_H = 0.15, 0.55      # success-criteria-panel.js
STEPS_PAD, STEPS_PAD_LEFT = 0.15, 0.05     # steps.js
BADGE_W, BADGE_MARGIN_MAX, BADGE_GAP = 0.55, 0.08, 0.10
CARD_PAD, CARD_GAP = 0.05, 0.07            # styles.js CARD_COMPACT
FIT_PAD_W, FIT_PAD_H = 0.05, 0.03          # steps.js, the final fit's inset
FLOOR_ROUNDING = 1e-6                      # steps.js
LINE_HEIGHT = 1.28
FLOOR_PT, CARD_SIZE_PT = 18, 36
SHORT_LIST_ROWS = 4
GLYPH_WIDTHS = Path(__file__).resolve().parents[1] / "shared" / "text" / "comic-glyph-width.js"
ANSWER_MARK = re.compile(r"\*\*([\s\S]+?)\*\*|\[\[([\s\S]+?)\]\]|\{\{([\s\S]+?)\}\}|<<([\s\S]+?)>>|\(\(([\s\S]+?)\)\)")
_glyphs: tuple[dict[str, float], float, float] | None = None


def comic_bold_widths() -> tuple[dict[str, float], float, float]:
    """The builder's advance widths for bold Comic Sans, its price for a
    character the font has no glyph for, and its render allowance."""
    global _glyphs
    if _glyphs is None:
        source = GLYPH_WIDTHS.read_text(encoding="utf-8")
        table = re.search(r"const BOLD = (\{.*?\});", source, re.S)
        unknown = re.search(r"const UNKNOWN_EM = ([\d.]+);", source)
        safety = re.search(r"const RENDER_SAFETY = ([\d.]+);", source)
        if not (table and unknown and safety):
            raise ContractError(f"cannot read the builder's letter widths from {GLYPH_WIDTHS}")
        _glyphs = (json.loads(table.group(1)), float(unknown.group(1)), float(safety.group(1)))
    return _glyphs


def line_width_in(text: str, pt: float) -> float:
    """How wide a line of bold text is, in inches, as the step fitter measures it."""
    table, unknown, safety = comic_bold_widths()
    em = 0.0
    for ch in text:
        em += table.get(ch, unknown)
    return (em * safety) / safety * pt / 72


def reveal_plain(value: str) -> str:
    lines = []
    for line in value.split("\n"):
        at = line.find("||")
        if at != -1:
            head, tail = line[:at], line[at + 2:]
            spaced = head != "" and not re.search(r"\s$", head) and not re.match(r"\s", tail)
            line = head + (" " + tail if spaced and tail else tail)
        lines.append(line)
    return "\n".join(lines)


def shown_criterion(text: str) -> str:
    """The words a criterion shows on the board, its colour marks drawn as colour
    rather than printed (builder/src/answer-text.js)."""
    if text.startswith("||") and "||" not in text[2:]:
        text = text[2:].lstrip()
    shown, last = [], 0
    for match in ANSWER_MARK.finditer(text):
        shown.append(reveal_plain(text[last:match.start()]))
        if match.group(5) is not None and not picture_part(match.group(5)):
            shown.append(reveal_plain(match.group(0)))
        else:
            shown.append(next(group for group in match.groups() if group is not None))
        last = match.end()
    shown.append(reveal_plain(text[last:]))
    return "".join(shown)


def wrapped_lines(text: str, width_in: float, pt: float) -> float:
    """The lines a criterion wraps to, breaking only between words; a word wider
    than the card cannot wrap at all."""
    count = 0
    for line in shown_criterion(text).split("\n"):
        lines, current = 1, ""
        for word in (w for w in re.split(r"[ \t\r\f\v]+", line) if w):
            if line_width_in(word, pt) > width_in + 1e-6:
                return math.inf
            candidate = f"{current} {word}" if current else word
            if line_width_in(candidate, pt) <= width_in + 1e-6:
                current = candidate
            else:
                lines, current = lines + 1, word
        count += lines
    return max(1, count)


def panel_fit(steps: list[str], panel_w: float, panel_h: float) -> dict[str, Any]:
    """Whether a criteria list fits one panel at 18pt, with the lines each step
    takes there and the lines the panel holds for that many steps."""
    n = len(steps)
    inner_w = (panel_w - 2 * PANEL_PAD) - STEPS_PAD_LEFT - STEPS_PAD
    full_h = (panel_h - 2 * PANEL_PAD - PANEL_LABEL_H) - 2 * STEPS_PAD
    longest = max(len(step.encode("utf-16-le")) // 2 for step in steps)

    def at(height: float) -> tuple[list[float], list[float], float, float]:
        row_h = height / n
        badge_w = min(BADGE_W, row_h - min(BADGE_MARGIN_MAX, row_h * 0.1) * 2)
        gutter = badge_w + BADGE_GAP
        card_w = min(inner_w, max(inner_w * 0.5, longest * (CARD_SIZE_PT * 0.52 / 72) + gutter))
        gap = min(CARD_GAP, row_h * 0.18)
        usable = max(0.1, max(0.3, card_w - gutter - 2 * CARD_PAD) - FIT_PAD_W)
        lines = [wrapped_lines(step, usable, FLOOR_PT) for step in steps]
        needs = [count * (FLOOR_PT / 72) * LINE_HEIGHT + FIT_PAD_H + gap for count in lines]
        return lines, needs, gap, usable

    def added(needs: list[float]) -> float:
        total = 0.0
        for need in needs:
            total += need
        return total

    # A short list keeps its share of four rows unless it needs more, and then
    # takes what its lines need at the floor, measured again at the height it
    # is given until the need settles, up to the whole panel.
    height = full_h
    if n < SHORT_LIST_ROWS:
        height = full_h * n / SHORT_LIST_ROWS
        for _ in range(8):
            if height >= full_h:
                break
            total = added(at(height)[1])
            if total <= height + 1e-9:
                break
            height = min(full_h, total + FLOOR_ROUNDING)
    lines, needs, gap, usable = at(height)
    line_h = (FLOOR_PT / 72) * LINE_HEIGHT
    shown = " ".join(" ".join(shown_criterion(step).split()) for step in steps)
    per_char = line_width_in(shown, FLOOR_PT) / len(shown) if shown else 0
    return {
        "fits": added(needs) <= height + 1e-9,
        "lines": lines,
        "holds": max(0, math.floor((full_h - n * (FIT_PAD_H + gap) + 1e-9) / line_h)),
        "chars": math.floor(usable / per_char) if per_char else 0,
    }


def criteria_fit(steps: list[str]) -> dict[str, Any]:
    """Which of the panels the guidance names hold a criteria list, with the
    roomiest one's measure for a refusal to quote."""
    fits = {name: panel_fit(steps, w, h) for name, w, h in NAMED_PANELS}
    return {
        "fits": any(fit["fits"] for fit in fits.values()),
        "holders": [name for name, fit in fits.items() if fit["fits"]],
        "roomiest": fits[ROOMIEST_PANEL],
    }


# Decision 11 in his words: "There is not a time where I want the PowerPoint
# slide deck to never be produced because of an error." A design the validator
# still refuses after the designer's repair passes ends the run with no deck,
# so a list the lesson designer has tightened and still cannot fit is marked on
# the list itself, `tooLongForPanels: true`, and passes. The check reads only
# that mark, never the words of a flag; the designer's reason reaches the
# teacher in `flagsForTeacher`, like any other departure. The slide builder
# reads the same mark (builder/src/marked-criteria.js), so every slide that
# shows the list is delivered as a page for the teacher to check, and the slide
# designer is told to leave it.
MARKED_TOO_LONG = "tooLongForPanels"


def first_step(steps: list[str]) -> str:
    return next((step for step in steps if not step.lstrip().startswith("\u2728")), steps[0])


def list_opening(steps: list[str], count: int = 6) -> str:
    """How the teacher would recognise a list: the first words of its first step."""
    words = shown_criterion(first_step(steps)).split()
    return " ".join(words[:count]) + ("..." if len(words) > count else "")


def criteria_fit_status(sc_items: Any) -> dict[str, Any]:
    """Which steps lists no named panel holds, which of those the lesson
    designer has marked too long, and marks on lists the check does not find
    too long."""
    too_long, stale = [], []
    for index, sc in enumerate(sc_items if isinstance(sc_items, list) else []):
        if not isinstance(sc, dict):
            continue
        content = sc.get("content")
        steps = content.get("steps") if isinstance(content, dict) and sc.get("type") == "steps" else None
        measured = isinstance(steps, list) and bool(steps) and all(isinstance(step, str) for step in steps)
        entry = {
            "index": index,
            "sc": sc,
            "steps": steps if measured else None,
            "marked": sc.get(MARKED_TOO_LONG) is True,
            "fit": criteria_fit(steps) if measured else None,
        }
        if measured and not entry["fit"]["fits"]:
            too_long.append(entry)
        elif entry["marked"]:
            stale.append(entry)
    return {
        "too_long": too_long,
        "unmarked": [entry for entry in too_long if not entry["marked"]],
        "marked": [entry for entry in too_long if entry["marked"]],
        "stale": stale,
    }


def criteria_marker_notes(design: Any) -> list[str]:
    """A list marked too long that the check does not find too long: a note,
    never a fault, so the mark and the flag that explains it can come out
    before the teacher reads it."""
    if not isinstance(design, dict):
        return []
    notes = []
    for entry in criteria_fit_status(design.get("successCriteria"))["stale"]:
        name = f"successCriteria[{entry['index']}] ({entry['sc'].get('id')})"
        if entry["steps"]:
            name += f", the list that begins \"{list_opening(entry['steps'])}\","
            why = "it fits the criteria panels now"
        else:
            why = "only a steps list is measured against the criteria panels"
        notes.append(
            f"{name} is marked `{MARKED_TOO_LONG}`, but {why}: take the mark out, and the "
            "line in `flagsForTeacher` that explains it, so the teacher is not told something "
            "untrue. This is a note; the check passed."
        )
    return notes


def validate_criteria_fit_a_named_panel(sc_items: list[Any]) -> None:
    """Refuse a steps list none of the panels the guidance names can hold,
    unless the lesson designer, having tried to tighten it, has marked it too
    long: the teacher's decision 11 is that an error never costs the deck, and
    a design the validator refuses at the end of its repair passes ends the run
    with none. Every slide that shows a marked list is then delivered as a
    blank page for the teacher to check."""
    unmarked = criteria_fit_status(sc_items)["unmarked"]
    if not unmarked:
        return
    too_long = []
    for entry in unmarked:
        steps, sc, roomiest = entry["steps"], entry["sc"], entry["fit"]["roomiest"]
        if any(math.isinf(count) for count in roomiest["lines"]):
            takes = "one of its words is wider than a criteria card, so it cannot wrap"
        else:
            takes = (
                f"its {len(steps)} steps take {int(sum(roomiest['lines']))} lines "
                f"(step by step: {', '.join(str(int(count)) for count in roomiest['lines'])})"
            )
        too_long.append(
            f"successCriteria[{entry['index']}] ({sc.get('id')}), the list that begins "
            f"\"{list_opening(steps)}\", is too long for the criteria panels slides are built "
            f"with: at 18pt, the smallest the board allows, {takes} in the roomiest of them, "
            f"the half-width side (6.35in wide and 6.65in tall), which holds {roomiest['holds']} "
            f"lines of about {roomiest['chars']} characters for {len(steps)} steps, and the "
            f"practice panel holds it at none of its three widths."
        )
    raise ContractError(
        " ".join(too_long)
        + " Tighten the wording here, where it is written, keeping what each step tells "
        "a stuck child to do, until the whole list fits: the slide designer has no roomier "
        "panel to give it, and nobody after you may reword a criterion. Only if you have "
        "tightened it and no step can lose a word without losing what it tells a stuck "
        "child to do, keep the words, mark "
        + ("each list" if len(unmarked) > 1 else "the list")
        + f" `\"{MARKED_TOO_LONG}\": true`, and say why in `flagsForTeacher`, in plain words "
        "for the teacher that name the list by its words. The check reads only the mark. It "
        "then lets the list through, but it costs every slide that shows the list: each "
        "reaches the teacher as a blank page that says to check it before teaching, with its "
        "question, working space and criteria not drawn. So tighten it if any word can go."
    )
'''

replace_once(VALIDATOR, """    for opener in ("((", "))", "{{", "}}", "<<", ">>", "**"):
        if opener in leftover:
            raise ContractError(f"{path}: a colour mark is left open or stray ({opener!r})")
""", """    for opener in ("((", "))", "{{", "}}", "<<", ">>", "**"):
        if opener in leftover:
            raise ContractError(f"{path}: a colour mark is left open or stray ({opener!r})")
""" + CHECK)

replace_once(VALIDATOR, """        fields = {"id", "type", "drawLive", "content"}
        expect_exact_keys(sc, fields, fields, path)
        sc_type = expect_string(sc["type"], f"{path}.type")
        expect(sc_type in SC_TYPES, f"{path}.type invalid: {sc_type}")
        expect_bool(sc["drawLive"], f"{path}.drawLive")
""", """        fields = {"id", "type", "drawLive", "content"}
        expect_exact_keys(sc, fields | {MARKED_TOO_LONG}, fields, path)
        sc_type = expect_string(sc["type"], f"{path}.type")
        expect(sc_type in SC_TYPES, f"{path}.type invalid: {sc_type}")
        expect_bool(sc["drawLive"], f"{path}.drawLive")
        if MARKED_TOO_LONG in sc:
            expect_bool(sc[MARKED_TOO_LONG], f"{path}.{MARKED_TOO_LONG}")
""")

replace_once(VALIDATOR, """    for index, item in enumerate(sc_items):
        reject_bad_criteria_marks(item.get("content"), f"successCriteria[{index}].content")
""", """    for index, item in enumerate(sc_items):
        reject_bad_criteria_marks(item.get("content"), f"successCriteria[{index}].content")

    with faults.section():
        validate_criteria_fit_a_named_panel(sc_items)
""")

# A list marked too long that fits is named after a pass, as a note on
# stderr: the check has passed, and LESSON_DESIGN_OK stays the only thing on
# stdout, which the review packet reads exactly.
replace_once(VALIDATOR, """    except (OSError, json.JSONDecodeError, ContractError) as exc:
        print(f"LESSON_DESIGN_INVALID: {exc}", file=sys.stderr)
        return 1

    print("LESSON_DESIGN_OK")""", """    except (OSError, json.JSONDecodeError, ContractError) as exc:
        print(f"LESSON_DESIGN_INVALID: {exc}", file=sys.stderr)
        return 1

    for note in criteria_marker_notes(design):
        print(f"LESSON_DESIGN_NOTE: {note}", file=sys.stderr)
    print("LESSON_DESIGN_OK")""")

print("c3: the lesson check catches a list none of the named panels can hold")
