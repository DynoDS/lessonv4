#!/usr/bin/env python3
"""Validate the authoritative lesson-design.json hand-off and its photo references."""
from __future__ import annotations

import json
import math
import re
import sys
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

TOP_LEVEL_FIELDS = {
    "schemaVersion",
    "lesson",
    "teacherOrientation",
    "starter",
    "vocabulary",
    "trimmedVocabulary",
    "representations",
    "successCriteria",
    "stickyKnowledge",
    "misconceptions",
    "concepts",
    "teachingSequence",
    "ending",
    "worksheet",
    "slideDesignNotes",
    "flagsForTeacher",
}

# Fields a design may carry without every saved design and fixture having to
# grow them at once. Present, they are validated as strictly as the rest.
OPTIONAL_TOP_LEVEL_FIELDS = {"resourceOpportunities", "vocabularyPlacement", "vocabularyIntroductions"}

# WHEN each key word is introduced.
#
# `vocabularyIntroductions` is an ordered list of introductions. Each names the
# words it introduces and the unit it follows, so a lesson can teach one word
# where it is needed and a related pair somewhere else. It replaces
# `vocabularyPlacement`, which could only move ONE slide holding ALL the words
# and so could not express "prerequisite word before the instruction that uses
# it, and the two contrast words after the noticing that gives them meaning".
#
# Grouping is a teaching choice, not a quota: one word, two, or a genuinely
# useful larger set. The rule the validator holds is only that every retained
# word is introduced exactly once and that the anchor exists.
# `script` is the words the teacher says while the vocabulary slide is up. It
# is required rather than optional because the slide is a teaching moment and
# the schema used not to have anywhere for its words: a Year 4 RE deck put two
# vocabulary slides in front of a class with empty speaker notes on both, and
# the teacher stood in front of `belief` and `nativity` with nothing to say
# (11 September 2026).
VOCABULARY_INTRODUCTION_FIELDS = {"vocabularyRefs", "after", "script"}

# The superseded field, still read so saved designs keep their original
# meaning: `null` or absent puts every word after the starter, and
# `{"after": "<teachingSequence sourceUnitId>"}` puts them all after that unit.
# A design that carries both schedules is refused rather than guessed at.
VOCABULARY_PLACEMENT_FIELDS = {"after"}

# The one thing an ordering task must not do is print its items already in
# answer order. A history starter listed Stone Age, Roman, Anglo-Saxon,
# today and asked "put these in order"; the Do beat's chips read 1862, 1897,
# 2026 under "what came first?" (4 September 2026). Both the designer's rule
# and the reviewer's check said not to, and neither is a check. So: when the
# wording asks for an order and three or more items carry a date the script
# can read, the printed order must not already be the answer.
ORDERING_CUE_RE = re.compile(
    r"\b(order|earliest|latest|oldest|newest|sequence|chronolog\w*|timeline|"
    r"first,? next|first,? then|came first)\b",
    re.I,
)
# British periods a primary chronology runs through, earliest first. A label
# naming one is datable by its place in this list; a year or "N years ago"
# is datable directly; today is the end of every timeline.
PERIOD_ORDER = (
    ("stone age", -3000000),
    ("bronze age", -2500),
    ("iron age", -800),
    ("roman", 43),
    ("anglo-saxon", 410),
    ("anglo saxon", 410),
    ("saxon", 410),
    ("viking", 793),
    ("norman", 1066),
    ("medieval", 1150),
    ("middle ages", 1150),
    ("tudor", 1485),
    ("stuart", 1603),
    ("georgian", 1714),
    ("victorian", 1837),
    ("edwardian", 1901),
    ("first world war", 1914),
    ("second world war", 1939),
)
YEAR_RE = re.compile(r"\b(1\d{3}|20\d{2})\b")
YEARS_AGO_RE = re.compile(r"([\d,]+)\s*(million\s+)?years?\s+ago", re.I)
TODAY_RE = re.compile(r"\b(today|now|present day|the present|nowadays)\b", re.I)

STRUCTURES = {
    "Skill-based",
    "Content-based",
    "Discovery",
    "Dialogic",
    "Task-Centred",
}
MODELLING_STATES = {
    "Prepared example",
    "Live-complete helper",
    "Question and reference",
    "Physical-demonstration support",
}
INTERACTIONS = {"view", "teacher-completes", "pupil-uses", "pupil-writes-on"}
# The decision a lesson records about each printed extra it might earn. A
# resource designer is launched on `candidate` and `uncertain` (and when the
# block is absent altogether); only a validated `none` lets the run skip it.
RESOURCE_DECISIONS = {"candidate", "none", "uncertain"}
ANSWER_KINDS = {"exact", "model", "standard", "none"}
ANSWER_DELIVERIES = {"teacher-only", "answer-slide", "visible-in-unit", "none"}
MAIN_ANSWER_SLIDE_KINDS = {
    "starter",
    "your-turn",
    "practise",
    "use-learning",
    "do-task",
    "apply",
    "reflect",
}
TASK_STRUCTURE_KINDS = {"option-bank", "sort", "evidence-classification"}
TASK_GROUP_ID_RE = re.compile(r"^group-\d{3}$")
TASK_FIELD_ID_RE = re.compile(r"^field-\d{3}$")
TASK_ITEM_ID_RE = re.compile(r"^item-\d{3}$")
SC_TYPES = {"steps", "reference-table", "labelled-reference"}
WORKSHEET_STATUSES = {"generated", "provided-by-teacher"}
WORKSHEET_RESOURCE_MODES = {"per-child", "shared-frame"}
WORKSHEET_USES = {"separate-fresh-worksheet", "required-task-resource"}
WORKSHEET_SHAPES = {"question-set", "frame", "stimulus-set", "child-generated", "mixed"}
WORKSHEET_BLOCK_KINDS = {"question", "question-group", "frame", "stimulus-set", "child-generated"}

# What the child DOES to answer, chosen when the question is written.
#
# Eleven sheets built between 5 and 12 September 2026 were counted by what they
# actually draw. Ruled writing lines and a plain instruction were the two most
# used things on every one of them; label-a-diagram, match, sort, sequence and
# correct-an-example were used zero times between them. The cause was not the
# page engine, which draws all of those: `response` was free text, so a designer
# who wrote "two handwriting lines" had made the decision, and the worksheet
# designer is forbidden to change a settled response. Naming the form makes it a
# choice from a vocabulary rather than the first thing that fits any answer.
#
# `written-explanation` is the one that carries a reason, because it is the
# default this list exists to interrupt, not because it is second best.
WORKSHEET_RESPONSE_FORMS = {
    "label-the-visual",
    "mark-on-a-visual",
    "match-or-join",
    "sort-into-groups",
    "put-in-order",
    "choose-from-options",
    "complete-the-table",
    "complete-the-model",
    "correct-the-example",
    "draw-or-construct",
    "complete-the-sentence",
    "short-answer",
    "written-explanation",
}
REASONED_RESPONSE_FORM = "written-explanation"

ID_PATTERNS = {
    "vocabulary": re.compile(r"^vocab-\d{3}$"),
    "representation": re.compile(r"^rep-\d{3}$"),
    "successCriteria": re.compile(r"^sc-\d{3}$"),
    "stickyKnowledge": re.compile(r"^sk-\d{3}$"),
    "misconception": re.compile(r"^mc-\d{3}$"),
    "concept": re.compile(r"^concept-\d{3}$"),
    "photo": re.compile(r"^(?:photo|adaptation-photo)-\d{3}$"),
}

SOURCE_UNIT_RE = re.compile(
    r"^lesson-section/"
    r"(starter|vocabulary|teaching-sequence|apply|reflect)/"
    r"unit-(\d{3})$"
)

ROUTE_KINDS = {
    # `teach` and `practise` are shared with the Content-based route, and a
    # skill lesson reaches for them where its own pedagogy asks: knowledge the
    # method needs but does not perform, and the reasoning or problem solving
    # the objective earns. The cycle kinds carry the method itself.
    "Skill-based": {"prepare", "my-turn", "our-turn", "your-turn", "teach", "practise"},
    "Content-based": {"observe", "teach", "do", "practise"},
    "Discovery": {"question", "explore", "make-sense", "teach-why", "use-learning", "finish"},
    "Dialogic": {"grounding-input", "stimulus", "talk", "stimulus-talk", "synthesise"},
    "Task-Centred": {"set-task", "teach-needed", "plan-checkpoint", "do-task", "share-conclude"},
}

SCRIPT_REQUIRED_KINDS = {
    "my-turn",
    "our-turn",
    "teach",
    # A substantial task is launched, not only instructed, and the launch takes
    # its own slide: a Year 4 RE deck's `Get ready to explain` reached the class
    # with empty speaker notes, so the teacher set the lesson's main task with
    # nothing to say (11 September 2026).
    "practise",
    "do-task",
    "stimulus",
    "stimulus-talk",
    "synthesise",
    "set-task",
    "teach-needed",
    "share-conclude",
    "apply",
    "reflect",
}

UNIT_FIELDS = {
    "sourceUnitId",
    "label",
    "kind",
    "conceptRef",
    "unlocks",
    "thinking",
    "content",
    "pupilInstruction",
    "modellingState",
    "representationRefs",
    "successCriteriaRefs",
    "stickyKnowledgeRefs",
    "misconceptionRefs",
    "photoRefs",
    "speakerNotes",
    "answer",
}
# `minutes` is optional in the schema and compulsory in practice: the scaffold
# writes it as a placeholder, and an unresolved placeholder is refused, so a
# design built the normal way cannot reach the pipeline without it. Leaving it
# optional here keeps a hand-written or older design valid rather than making
# every saved lesson unreadable for a field added on 18 September 2026.
UNIT_OPTIONAL_FIELDS = {"taskStructure", "minutes"}

# The clock. A lesson aims for about 45 minutes and lives between 30 and 50
# (the teacher, 18 September 2026: "don't make it strictly 45, do 30-50 mins, 45
# the aim"). A short lesson is a real lesson, and the slot itself moves: an
# assembly eats ten minutes, a wet break gives them back.
#
# The budget exists as a number because it was true as prose and never applied.
# A Year 4 history lesson reached the teacher with a starter, three Teach beats,
# three Do beats including a card sort at tables, a worksheet and a closing
# question, and nobody had added it up: "because we had a big task already, then
# we've also got to do worksheet, it won't fit the 45 min." Each beat had earned
# its place separately, which is exactly the failure a budget exists to push
# back on.
LESSON_MINUTES_AIM = 45
LESSON_MINUTES_MAX = 50
LESSON_MINUTES_MIN = 30
BEAT_MINUTES_MAX = 25


UNLOCKS_MAX_CHARS = 200
THINKING_MAX_CHARS = 200

# The launch's `difference` is the one line that names what makes the strong
# instance strong. It is a line a class reads in a glance under two cards, not
# the paragraph that replaced it on a Year 4 science board on 18 September 2026:
# forty-six words explaining, in prose, a contrast the two cards above were
# already showing. The cap is on this one field, not on the slide.
LAUNCH_DIFFERENCE_MAX_CHARS = 140

# Beats where the teacher acts and children watch or listen. `thinking` may be
# null there. Everywhere else the thought the beat requires is written down
# before the activity is chosen, so that a thought which is really "find the
# words on the slide" can be seen for what it is.
#
# A Teach beat is not on this list. It was, until 14 September 2026, on the
# reasoning that the teacher acts and children watch, and every Teach beat in
# 28 saved designs wrote null: the one beat with no thought in it was the
# teaching, and the boards came out as facts, a question and a star line. The
# thought on a Teach is what the class is working out while the teacher
# teaches, usually what the key question makes them look for on the board
# (`Why would she carry sticks if nobody pays her?`), and writing it is what
# turns telling into teaching (preferences.md, Slide Philosophy, "The fact is
# the destination").
NO_PUPIL_ACTION_KINDS = {
    "prepare",
    "my-turn",
    "grounding-input",
    "stimulus",
    "set-task",
}

# Beats where the teacher presents and no child produces anything. An idea
# met only on these is told, not used, whatever thought the class had while
# listening; the Teach kinds belong here even though each now carries a
# thinking line.
TEACHER_PRESENTS_KINDS = NO_PUPIL_ACTION_KINDS | {"teach", "teach-why", "teach-needed"}

SCAFFOLD_PLACEHOLDER = "__LESSON_DESIGN_FILL__"
PLACEHOLDER_REPORT_LIMIT = 10


class ContractError(ValueError):
    pass


class FaultLog:
    """Every independent check runs, and every fault comes back together.

    This check used to stop at the first thing it found. The Lesson Designer
    repairs what it is told and runs the check again, three times, so three runs
    bought three fixes - and a rule that sits late in the order could only be
    reached once everything before it was already clean, which is exactly when
    the passes were spent. A Year 4 rounding lesson (19 September 2026) met the
    vocabulary placement rule that way: reported on the last look and abandoned
    in the same breath, never once repaired. The slide check had the same fault
    and the same repair (`One slide check reports every fault, not the first
    layer`, 4.2.214).

    Shape still stops the run. A sequence that is not a list leaves the checks
    after it nothing to read, and a cascade thrown by checks reading a broken
    shape buries the one fault worth having. So a fault that escapes a section
    ends the pass, and everything found before it is still reported with it.
    """

    def __init__(self) -> None:
        self.faults: list[str] = []

    @contextmanager
    def section(self) -> Iterator[None]:
        """Run one independent check; record a fault instead of ending the pass."""
        try:
            yield
        except ContractError as exc:
            self.add(str(exc))

    def add(self, fault: str) -> None:
        if fault not in self.faults:
            self.faults.append(fault)

    def raise_if_any(self) -> None:
        if not self.faults:
            return
        if len(self.faults) == 1:
            raise ContractError(self.faults[0])
        body = "\n".join(f"  {n}. {fault}" for n, fault in enumerate(self.faults, 1))
        raise ContractError(
            f"{len(self.faults)} faults, every one of them below. Repair them all, "
            f"then run this check once more.\n{body}"
        )


class RaiseAtOnce:
    """What a check uses when it is called on its own.

    The design pass collects, because a designer repairing one fault at a time
    runs out of passes. A test or a caller that runs one check by itself wants
    the fault the moment it happens, and that is what this gives them.
    """

    @contextmanager
    def section(self) -> Iterator[None]:
        yield

    def add(self, fault: str) -> None:
        raise ContractError(fault)


def collect_unresolved_scaffold_placeholders(
    node: Any,
    path: str,
    found: list[str],
) -> None:
    if isinstance(node, str):
        if node == SCAFFOLD_PLACEHOLDER:
            found.append(path)
        return

    if isinstance(node, dict):
        for key, value in node.items():
            collect_unresolved_scaffold_placeholders(value, f"{path}.{key}", found)
        return

    if isinstance(node, list):
        for index, value in enumerate(node):
            collect_unresolved_scaffold_placeholders(value, f"{path}[{index}]", found)


def reject_unresolved_scaffold_placeholders(node: Any, path: str) -> None:
    """Report every unresolved placeholder, not only the first one found.

    One reported path reads like a single missed field. When the file is still
    the generated scaffold, that understates the fault badly enough to send a
    repair down the wrong route, so the count and the leading paths are part of
    the diagnosis.
    """
    found: list[str] = []
    collect_unresolved_scaffold_placeholders(node, path, found)

    if not found:
        return

    if len(found) == 1:
        raise ContractError(f"unresolved scaffold placeholder at {found[0]}")

    shown = found[:PLACEHOLDER_REPORT_LIMIT]
    remainder = len(found) - len(shown)
    tail = f", and {remainder} more" if remainder else ""

    raise ContractError(
        f"unresolved scaffold placeholder at {found[0]}: {len(found)} "
        f"placeholders are still unresolved, so this file is the generated "
        f"scaffold rather than a filled design and needs filling throughout, "
        f"not a single-field repair. Unresolved: {', '.join(shown)}{tail}"
    )


LONG_DASHES = ("\u2014", "\u2013")


SIX_SEVEN_SKIPPED_STRING_KEYS = re.compile(
    r"(^id$|Id$|Ids$|Ref$|Refs$|path|Path|url|Url|^src$|^href$|sha|Sha|[Ff]ile|[Cc]olou?r|^fill$|[Ss]lug|^layout$|^template$|^kind$)"
)
SIX_SEVEN_SKIPPED_NUMBER_KEYS = re.compile(
    r"^(fontSize|headingFontSize|weight|rotation|transparency|x|y|w|h|width|height|maxRows|blankChars|classSize|dpi|radius|lineW|pad|gap|minFont|maxFont|version|schemaVersion|ordinal|lon|lat|longitude|latitude)$"
)
SIX_SEVEN_TOKEN = re.compile(r"(?<![^\W\d_])(?<![\d_/\\.#-])(\d{1,3}(?:,\d{3})+|\d+)(?![\d_/\\]|\.\d|-\d|,\d{3})")


def reject_six_seven_numbers(node: Any, path: str) -> None:
    """No number a class reads may contain a 6 followed by a 7.

    The "6-7" playground meme sets a class off whenever the two digits sit
    together: 67, 670, 6,742 and 267 all do it (the teacher, 17 September
    2026). The designer chooses numbers, so it is refused here, where
    choosing another costs nothing, and every builder refuses it again.
    Commas are ignored; decimals, identifiers, file names and a four-digit
    year from 1000 to 2099 written without a comma are not checked, because
    a real date is a fact the lesson cannot change. Nor is a number sitting in a
    counting run with both neighbours (a hundred square's rows), which cannot
    skip it. `shared/text/no-six-seven.js`
    is the builders' copy of the same rule.
    """
    found: list[str] = []

    def offends(token: str) -> bool:
        digits = token.replace(",", "")
        if "67" not in digits:
            return False
        if "," not in token and len(digits) == 4 and 1000 <= int(digits) <= 2099:
            return False
        return True

    def counting_run(values: list[Any]) -> set[int]:
        run: set[int] = set()

        def add(item: Any) -> None:
            if isinstance(item, int) and not isinstance(item, bool):
                run.add(item)
            elif isinstance(item, str) and re.fullmatch(r"\d{1,3}(,\d{3})+|\d+", item.strip()):
                run.add(int(item.strip().replace(",", "")))

        for item in values:
            if isinstance(item, list):
                for inner in item:
                    add(inner)
            else:
                add(item)
        return run

    def in_run(number: int, run: set[int] | None) -> bool:
        return bool(run) and (number - 1) in run and (number + 1) in run

    def walk(value: Any, key: str | None, run: set[int] | None) -> None:
        if isinstance(value, bool):
            return
        if isinstance(value, str):
            if key and SIX_SEVEN_SKIPPED_STRING_KEYS.search(key):
                return
            for match in SIX_SEVEN_TOKEN.finditer(value):
                token = match.group(1)
                if offends(token) and not in_run(int(token.replace(",", "")), run) and token not in found:
                    found.append(token)
        elif isinstance(value, int):
            if key and SIX_SEVEN_SKIPPED_NUMBER_KEYS.search(key):
                return
            if "67" in str(abs(value)) and not in_run(value, run) and str(value) not in found:
                found.append(str(value))
        elif isinstance(value, dict):
            for item_key, item in value.items():
                walk(item, item_key, None)
        elif isinstance(value, list):
            merged = (run or set()) | counting_run(value)
            for item in value:
                walk(item, key, merged)

    walk(node, None, None)
    expect(
        not found,
        f"{path} contains {', '.join(found)}: the class has a playground meme about "
        "6 and 7, and any number with a 6 followed by a 7 sets it off, commas or not. "
        "Choose a different number that does the same mathematical job (the same number "
        "of digits, and the same case, such as exactly halfway or crossing a hundred), "
        "and change it everywhere it appears: the question, the answer, the script and "
        "any representation built from it.",
    )


def reject_long_dashes(node: Any, path: str) -> None:
    """The em and en dash are not in the teacher's voice anywhere.

    Every string here reaches the slides, the worksheets, the notes or the
    teacher, and nobody downstream may reword it. Left to review, a run's
    beat titles reached the reviewer carrying six of them, so the file that
    carries them does not pass.
    """
    found: list[str] = []

    def walk(value: Any, where: str) -> None:
        if isinstance(value, str):
            if any(dash in value for dash in LONG_DASHES):
                found.append(where)
        elif isinstance(value, dict):
            for key, item in value.items():
                walk(item, f"{where}.{key}")
        elif isinstance(value, list):
            for index, item in enumerate(value):
                walk(item, f"{where}[{index}]")

    walk(node, path)
    if not found:
        return
    shown = found[:PLACEHOLDER_REPORT_LIMIT]
    remainder = len(found) - len(shown)
    tail = f", and {remainder} more" if remainder else ""
    raise ContractError(
        f"{len(found)} string(s) contain an em dash or en dash, which is not part of the "
        "teacher's written voice: rewrite each with a colon, a comma, brackets, a full stop "
        "or a spaced hyphen ( - ), choosing whichever the sentence needs, and write a number "
        f"range with 'to' or a hyphen. At: {', '.join(shown)}{tail}"
    )


# The colour marks a success criterion may carry (shared/text/criteria-marks.js
# draws them): ((a picture part)) in that part's own colour, {{a taught word}}
# in green, <<the part to look at or decide>> in orange, **bold**. A picture
# mark must name a part the engine colours, which today is a place-value column.
PICTURE_PART_WORDS = {
    "million", "millions", "hundred thousand", "hundred thousands", "ten thousand",
    "ten thousands", "thousand", "thousands", "hundred", "hundreds", "ten", "tens",
    "one", "ones", "unit", "units", "tenth", "tenths", "hundredth", "hundredths",
    "thousandth", "thousandths",
}
PICTURE_PART_KEYS = {"M", "HTh", "TTh", "Th", "H", "T", "O", "t", "h", "th"}
CRITERIA_MARK = re.compile(r"\(\(([\s\S]+?)\)\)|\{\{([\s\S]+?)\}\}|<<([\s\S]+?)>>|\*\*([\s\S]+?)\*\*")


def picture_part(words: str) -> bool:
    raw = words.strip()
    if raw in PICTURE_PART_KEYS:
        return True
    folded = re.sub(r" (?:column|place)$", "", " ".join(raw.lower().split()))
    return folded in PICTURE_PART_WORDS


def reject_bad_criteria_marks(node: Any, path: str) -> None:
    if isinstance(node, dict):
        for key, value in node.items():
            reject_bad_criteria_marks(value, f"{path}.{key}")
        return
    if isinstance(node, list):
        for index, value in enumerate(node):
            reject_bad_criteria_marks(value, f"{path}[{index}]")
        return
    if not isinstance(node, str):
        return
    for match in CRITERIA_MARK.finditer(node):
        if match.group(1) is not None and not picture_part(match.group(1)):
            raise ContractError(
                f"{path}: (({match.group(1)})) names no coloured part of a picture; "
                "a picture mark names a place-value column (thousands, hundreds, tens, "
                "ones, tenths, or Th, H, T, O, t). Use {{...}} for a taught word or "
                "<<...>> for the part to look at or decide"
            )
    leftover = CRITERIA_MARK.sub("", node)
    for opener in ("((", "))", "{{", "}}", "<<", ">>", "**"):
        if opener in leftover:
            raise ContractError(f"{path}: a colour mark is left open or stray ({opener!r})")


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
# The least a list the lesson designer marked too long is drawn at, and where:
# the practice panel at its widest and the half-width side, the two shapes a
# criteria panel draws a marked list smaller in (builder/src/marked-criteria.js).
MARKED_FLOOR_PT = 16
SMALLER_PANELS = NAMED_PANELS[2:]
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


def panel_fit(steps: list[str], panel_w: float, panel_h: float, floor_pt: int = FLOOR_PT) -> dict[str, Any]:
    """Whether a criteria list fits one panel at its floor, 18pt unless the
    list is marked too long, with the lines each step takes there and the lines
    the panel holds for that many steps."""
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
        # A sticky line keeps 18pt beside a list drawn smaller, as the builder
        # keeps it; only the list's own steps take the lower floor.
        floors = [FLOOR_PT if step.lstrip().startswith("\u2728") else floor_pt for step in steps]
        lines = [wrapped_lines(step, usable, pt) for step, pt in zip(steps, floors)]
        needs = [count * (pt / 72) * LINE_HEIGHT + FIT_PAD_H + gap for count, pt in zip(lines, floors)]
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
    line_h = (floor_pt / 72) * LINE_HEIGHT
    shown = " ".join(" ".join(shown_criterion(step).split()) for step in steps)
    per_char = line_width_in(shown, floor_pt) / len(shown) if shown else 0
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


def criteria_fit_smaller(steps: list[str]) -> dict[str, Any]:
    """Whether a list no named panel holds at 18pt fits once it is drawn
    smaller, as a list marked too long is: the largest floor from 17pt down to
    16pt at which the practice panel at its widest or the half-width side holds
    it, as the builder tries them, with the roomiest one's measure at 16pt for
    a refusal to quote."""
    for floor_pt in range(FLOOR_PT - 1, MARKED_FLOOR_PT - 1, -1):
        for name, w, h in SMALLER_PANELS:
            if panel_fit(steps, w, h, floor_pt)["fits"]:
                return {"fits": True, "pt": floor_pt, "holder": name}
    roomiest = next((w, h) for name, w, h in NAMED_PANELS if name == ROOMIEST_PANEL)
    return {"fits": False, "roomiest": panel_fit(steps, *roomiest, MARKED_FLOOR_PT)}


# Decision 11 in his words: "There is not a time where I want the PowerPoint
# slide deck to never be produced because of an error." A design the validator
# still refuses after the designer's repair passes ends the run with no deck,
# so a list the lesson designer has tightened and still cannot fit is marked on
# the list itself, `tooLongForPanels: true`, and passes if it fits at 16pt in
# the practice panel at its widest or the half-width side. The check reads only
# that mark, never the words of a flag; the designer's reason reaches the
# teacher in `flagsForTeacher`, like any other departure. The slide builder
# reads the same mark (builder/src/marked-criteria.js) and draws the list at the
# largest size that fits, down to 16pt, on a finished slide flagged for the
# teacher to check: his ruling of 24 September 2026, who wants a finished slide
# rather than a blank page ("it should still try to fix it try to repair it").
# A marked list too long even at 16pt could not be drawn at all, and it passes
# too, with a plain note, because the deck is always made: the review page asks
# the reviewer to send it back to be tightened, and if it still reaches the
# build, every slide that shows it is a page for the teacher to check, the
# rarest case. Only an unmarked list too long for every panel is refused.
MARKED_TOO_LONG = "tooLongForPanels"


def first_step(steps: list[str]) -> str:
    return next((step for step in steps if not step.lstrip().startswith("\u2728")), steps[0])


def list_opening(steps: list[str], count: int = 6) -> str:
    """How the teacher would recognise a list: the first words of its first step."""
    words = shown_criterion(first_step(steps)).split()
    return " ".join(words[:count]) + ("..." if len(words) > count else "")


def criteria_fit_status(sc_items: Any) -> dict[str, Any]:
    """Which steps lists no named panel holds at 18pt; of those, which are
    unmarked, which the lesson designer has marked too long and fit once drawn
    smaller, and which are marked but too long even at 16pt; and marks on lists
    the check does not find too long."""
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
            entry["smaller"] = criteria_fit_smaller(steps)
            too_long.append(entry)
        elif entry["marked"]:
            stale.append(entry)
    return {
        "too_long": too_long,
        "unmarked": [entry for entry in too_long if not entry["marked"]],
        "marked": [entry for entry in too_long if entry["marked"] and entry["smaller"]["fits"]],
        "beyond_smaller": [entry for entry in too_long if entry["marked"] and not entry["smaller"]["fits"]],
        "stale": stale,
    }


def criteria_marker_notes(design: Any) -> list[str]:
    """Notes on marked lists, never faults. First, a marked list too long even
    at 16pt: it passes, because the deck is always made, but every slide that
    shows it will be a page for the teacher to check, so it is named first and
    plainly. Then a list marked too long that the check does not find too long,
    so the mark and the flag that explains it can come out before the teacher
    reads it."""
    if not isinstance(design, dict):
        return []
    notes = []
    status = criteria_fit_status(design.get("successCriteria"))
    for entry in status["beyond_smaller"]:
        steps, roomiest = entry["steps"], entry["smaller"]["roomiest"]
        notes.append(
            f"successCriteria[{entry['index']}] ({entry['sc'].get('id')}), the list that begins "
            f"\"{list_opening(steps)}\", is marked `{MARKED_TOO_LONG}`, but it is too long even at "
            f"{MARKED_FLOOR_PT}pt, the least a marked list is drawn at: {takes_lines(steps, roomiest)} in "
            f"the roomiest criteria panel, the half-width side, which holds {roomiest['holds']} lines "
            f"of about {roomiest['chars']} characters at {MARKED_FLOOR_PT}pt for {len(steps)} steps. Every "
            "slide that shows it will reach the teacher as a page to check before teaching, with its "
            "question, working space and criteria not drawn. Tighten it here, keeping what each step "
            f"tells a stuck child to do, at least until it fits at {MARKED_FLOOR_PT}pt, and better until "
            "it fits at 18pt and needs no mark; the design reviewer is asked to send it back to you. "
            "This is a note; the check passed, because the deck is always made."
        )
    for entry in status["stale"]:
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


def takes_lines(steps: list[str], measure: dict[str, Any]) -> str:
    """The lines a list takes in a panel, step by step, as a refusal says it."""
    if any(math.isinf(count) for count in measure["lines"]):
        return "one of its words is wider than a criteria card, so it cannot wrap"
    return (
        f"its {len(steps)} steps take {int(sum(measure['lines']))} lines "
        f"(step by step: {', '.join(str(int(count)) for count in measure['lines'])})"
    )


def validate_criteria_fit_a_named_panel(sc_items: list[Any]) -> None:
    """Refuse a steps list none of the panels the guidance names can hold,
    unless the lesson designer, having tried to tighten it, has marked it too
    long: the teacher's decision 11 is that an error never costs the deck, and
    a design the validator refuses at the end of its repair passes ends the run
    with none. Every slide that shows a marked list then draws it smaller, down
    to 16pt, flagged for the teacher to check; a marked list too long even at
    16pt passes with a note (criteria_marker_notes), and every slide that
    shows it is a page to check."""
    unmarked = criteria_fit_status(sc_items)["unmarked"]
    if not unmarked:
        return
    said = []
    for entry in unmarked:
        steps, sc, roomiest = entry["steps"], entry["sc"], entry["fit"]["roomiest"]
        said.append(
            f"successCriteria[{entry['index']}] ({sc.get('id')}), the list that begins "
            f"\"{list_opening(steps)}\", is too long for the criteria panels slides are built "
            f"with: at 18pt, the smallest the board allows, {takes_lines(steps, roomiest)} in the "
            f"roomiest of them, the half-width side (6.35in wide and 6.65in tall), which holds "
            f"{roomiest['holds']} lines of about {roomiest['chars']} characters for {len(steps)} "
            f"steps, and the practice panel holds it at none of its three widths."
            + ("" if entry["smaller"]["fits"] else
               f" Even at {MARKED_FLOOR_PT}pt it does not fit: marked, it would pass with a note, but "
               "every slide that shows it would reach the teacher as a page to check with nothing "
               f"drawn on it, so tighten it at least until it fits at {MARKED_FLOOR_PT}pt.")
        )
    if unmarked:
        said.append(
            "Tighten the wording here, where it is written, keeping what each step tells "
            "a stuck child to do, until the whole list fits: the slide designer has no roomier "
            "panel to give it, and nobody after you may reword a criterion. Only if you have "
            "tightened it and no step can lose a word without losing what it tells a stuck "
            "child to do, keep the words, mark "
            + ("each list" if len(unmarked) > 1 else "the list")
            + f" `\"{MARKED_TOO_LONG}\": true`, and say why in `flagsForTeacher`, in plain words "
            "for the teacher that name the list by its words. The check reads only the mark. It "
            "then lets the list through, and it costs every slide that shows the list: each draws "
            f"it smaller than the 18pt the board allows everything else, down to {MARKED_FLOOR_PT}pt, "
            "close to the smallest a class can read from the back of the room, and is flagged for "
            f"the teacher to check before teaching; a list too long even at {MARKED_FLOOR_PT}pt "
            "cannot be drawn at all, and each of its slides reaches the teacher as a page to check "
            "with nothing drawn on it. So tighten it if any word can go."
        )
    raise ContractError(" ".join(said))


def expect(condition: bool, message: str) -> None:
    if not condition:
        raise ContractError(message)


# Where a board objective may stop short of the full one: the tail after any of
# these is enumerated detail, a route or a condition, never the learning itself.
DISPLAYED_LO_CUT_POINTS = (
    ":", ",", "(", " - ", " – ", " — ",
    " using ", " by ", " with ", " including ", " through ",
)


def _normalise_objective(text: str) -> str:
    flat = " ".join(text.split()).strip().rstrip(".").strip().lower()
    return flat[3:] if flat.startswith("to ") else flat


def displayed_lo_is_the_objective_or_its_opening(lo: str, displayed: str) -> bool:
    """True when the board objective is the full objective word for word, or
    its opening words with a tacked-on tail cut off at a natural join."""
    full = _normalise_objective(lo)
    shown = _normalise_objective(displayed)
    if not shown:
        return False
    if shown == full:
        return True
    if not full.startswith(shown):
        return False
    tail = full[len(shown):]
    return any(tail.startswith(cut.rstrip()) for cut in DISPLAYED_LO_CUT_POINTS)


def expect_dict(value: Any, path: str) -> dict[str, Any]:
    expect(isinstance(value, dict), f"{path} must be an object")
    return value


def expect_list(value: Any, path: str) -> list[Any]:
    expect(isinstance(value, list), f"{path} must be an array")
    return value


def expect_string(value: Any, path: str, *, allow_empty: bool = False) -> str:
    expect(isinstance(value, str), f"{path} must be a string")
    if not allow_empty:
        expect(bool(value.strip()), f"{path} must not be empty")
    return value


def expect_nullable_string(value: Any, path: str) -> None:
    expect(value is None or isinstance(value, str), f"{path} must be a string or null")
    if isinstance(value, str):
        expect(bool(value.strip()), f"{path} must be null or a non-empty string")


def expect_bool(value: Any, path: str) -> bool:
    expect(type(value) is bool, f"{path} must be boolean")
    return value


def expect_positive_int(value: Any, path: str) -> int:
    expect(type(value) is int and value > 0, f"{path} must be a positive integer")
    return value


def expect_exact_keys(
    obj: dict[str, Any],
    allowed: set[str],
    required: set[str],
    path: str,
) -> None:
    missing = required - set(obj)
    extra = set(obj) - allowed
    expect(not missing, f"{path} missing fields: {', '.join(sorted(missing))}")
    expect(not extra, f"{path} has unknown fields: {', '.join(sorted(extra))}")


def collect_registry(
    items: Any,
    path: str,
    id_field: str,
    pattern: re.Pattern[str],
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    arr = expect_list(items, path)
    by_id: dict[str, dict[str, Any]] = {}
    for index, raw in enumerate(arr):
        item_path = f"{path}[{index}]"
        item = expect_dict(raw, item_path)
        item_id = expect_string(item.get(id_field), f"{item_path}.{id_field}")
        expect(pattern.fullmatch(item_id) is not None, f"{item_path}.{id_field} has invalid format: {item_id}")
        expect(item_id not in by_id, f"duplicate {id_field}: {item_id}")
        by_id[item_id] = item
    return arr, by_id


def validate_ref_list(raw: Any, path: str, valid_ids: set[str]) -> list[str]:
    values = expect_list(raw, path)
    seen: set[str] = set()
    result: list[str] = []
    for index, value in enumerate(values):
        item = expect_string(value, f"{path}[{index}]")
        expect(item in valid_ids, f"{path}[{index}] points to unknown id: {item}")
        expect(item not in seen, f"{path} contains duplicate id: {item}")
        seen.add(item)
        result.append(item)
    return result


def validate_source_unit_id(value: Any, path: str, section: str, ordinal: int) -> str:
    source_id = expect_string(value, path)
    expect(SOURCE_UNIT_RE.fullmatch(source_id) is not None, f"{path} has invalid sourceUnitId: {source_id}")
    expected = f"lesson-section/{section}/unit-{ordinal:03d}"
    expect(source_id == expected, f"{path} must be exactly {expected}")
    return source_id


def datable_value(label: str) -> int | None:
    """A sortable year for a label the script can date, else None."""
    text = label.strip()
    lowered = text.lower()
    ago = YEARS_AGO_RE.search(text)
    if ago:
        try:
            number = int(ago.group(1).replace(",", ""))
        except ValueError:
            number = None
        if number is not None:
            if ago.group(2):
                number *= 1_000_000
            return 2026 - number
    year = YEAR_RE.search(text)
    if year:
        return int(year.group(1))
    if TODAY_RE.search(text):
        return 3000
    for name, value in PERIOD_ORDER:
        if name in lowered:
            return value
    return None


def has_ordering_cue(*texts: Any) -> bool:
    return any(
        isinstance(text, str) and ORDERING_CUE_RE.search(text) is not None
        for text in texts
    )


def check_not_printed_in_answer_order(
    labels: list[str],
    path: str,
    *,
    what: str,
) -> None:
    """Refuse an ordering task whose datable items already stand in order."""
    dated = [(label, datable_value(label)) for label in labels]
    values = [value for _, value in dated if value is not None]
    if len(values) < 3:
        return
    ascending = all(a < b for a, b in zip(values, values[1:]))
    descending = all(a > b for a, b in zip(values, values[1:]))
    if not (ascending or descending):
        return
    shown = ", ".join(label for label, value in dated if value is not None)
    raise ContractError(
        f"{path} asks children to put items in order, but the {what} prints "
        f"them already in answer order ({shown}): a child reads the answer off "
        f"the page instead of deciding it. Shuffle the {what} so the printed "
        "order is not the chronological one."
    )


def bullet_items(text: str) -> list[str]:
    """The `- ` bullet lines of a prose activity, as printed."""
    items: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("- ") or stripped.startswith("* "):
            items.append(stripped[2:].strip())
    return items


SORT_HANDLING_KINDS = {"cards"}
SORT_HANDLING_PER = {"child", "pair", "group"}


def validate_sort_handling(raw: Any, path: str) -> None:
    """How a sort is done in the room, when it is not done on the board.

    Absent (or null) means the sort is shown on the board and children record
    their placements: the shape every saved design has. `cards` means children
    move printed cards under printed headings at tables, so a kit has to be
    printed for them; the stick-in track prints it, and the run cannot close
    COMPLETE without it. `per` says who shares a set, and a group count is
    stated rather than guessed, because the plugin does not know the class.
    `where` is the teacher's one-line preparation note.
    """
    if raw is None:
        return
    handling = expect_dict(raw, path)
    expect_exact_keys(
        handling,
        {"kind", "per", "groupCount", "where"},
        {"kind", "per", "groupCount", "where"},
        path,
    )
    kind = expect_string(handling["kind"], f"{path}.kind")
    expect(kind in SORT_HANDLING_KINDS, f"{path}.kind invalid: {kind}")
    per = expect_string(handling["per"], f"{path}.per")
    expect(per in SORT_HANDLING_PER, f"{path}.per invalid: {per}")
    count = handling["groupCount"]
    if per == "group":
        expect(
            isinstance(count, int) and not isinstance(count, bool) and count >= 1,
            f"{path}.groupCount must be a positive integer when per is group",
        )
    else:
        expect(count is None, f"{path}.groupCount must be null unless per is group")
    where = expect_string(handling["where"], f"{path}.where")
    expect(bool(where.strip()), f"{path}.where must say where the activity happens")


def sort_handled_as_cards(unit: dict[str, Any]) -> dict[str, Any] | None:
    """The unit's `handling` block when its sort is done with printed cards."""
    task = unit.get("taskStructure")
    if not isinstance(task, dict) or task.get("kind") != "sort":
        return None
    handling = task.get("handling")
    if isinstance(handling, dict) and handling.get("kind") == "cards":
        return handling
    return None


def validate_task_structure(
    raw: Any,
    path: str,
    *,
    unit_photo_refs: set[str],
) -> dict[str, Any] | None:
    if raw is None:
        return None

    structure = expect_dict(raw, path)
    kind = expect_string(structure.get("kind"), f"{path}.kind")
    expect(kind in TASK_STRUCTURE_KINDS, f"{path}.kind invalid: {kind}")

    if kind == "option-bank":
        expect_exact_keys(
            structure,
            {"kind", "items"},
            {"kind", "items"},
            path,
        )
        items = expect_list(structure["items"], f"{path}.items")
        expect(2 <= len(items) <= 12, f"{path}.items must contain 2 to 12 items")
        item_ids: set[str] = set()
        for index, raw_item in enumerate(items):
            item_path = f"{path}.items[{index}]"
            item = expect_dict(raw_item, item_path)
            expect_exact_keys(
                item,
                {"id", "label"},
                {"id", "label"},
                item_path,
            )
            item_id = expect_string(item["id"], f"{item_path}.id")
            expect(
                TASK_ITEM_ID_RE.fullmatch(item_id) is not None,
                f"{item_path}.id must match item-###",
            )
            expect(
                item_id not in item_ids,
                f"{path}.items contains duplicate id: {item_id}",
            )
            item_ids.add(item_id)
            expect_string(item["label"], f"{item_path}.label")
        return structure

    if kind == "sort":
        expect_exact_keys(
            structure,
            {"kind", "groups", "items", "handling"},
            {"kind", "groups", "items"},
            path,
        )
        validate_sort_handling(structure.get("handling"), f"{path}.handling")
        groups = expect_list(structure["groups"], f"{path}.groups")
        expect(2 <= len(groups) <= 6, f"{path}.groups must contain 2 to 6 groups")
        group_ids: set[str] = set()
        for index, raw_group in enumerate(groups):
            group_path = f"{path}.groups[{index}]"
            group = expect_dict(raw_group, group_path)
            expect_exact_keys(group, {"id", "label"}, {"id", "label"}, group_path)
            group_id = expect_string(group["id"], f"{group_path}.id")
            expect(TASK_GROUP_ID_RE.fullmatch(group_id) is not None, f"{group_path}.id must match group-###")
            expect(group_id not in group_ids, f"{path}.groups contains duplicate id: {group_id}")
            group_ids.add(group_id)
            expect_string(group["label"], f"{group_path}.label")

        items = expect_list(structure["items"], f"{path}.items")
        expect(2 <= len(items) <= 12, f"{path}.items must contain 2 to 12 items")
        item_ids: set[str] = set()
        for index, raw_item in enumerate(items):
            item_path = f"{path}.items[{index}]"
            item = expect_dict(raw_item, item_path)
            expect_exact_keys(
                item,
                {"id", "label", "detail", "photoRef"},
                {"id", "label", "detail", "photoRef"},
                item_path,
            )
            item_id = expect_string(item["id"], f"{item_path}.id")
            expect(TASK_ITEM_ID_RE.fullmatch(item_id) is not None, f"{item_path}.id must match item-###")
            expect(item_id not in item_ids, f"{path}.items contains duplicate id: {item_id}")
            item_ids.add(item_id)
            expect_string(item["label"], f"{item_path}.label")
            expect_nullable_string(item["detail"], f"{item_path}.detail")
            expect_nullable_string(item["photoRef"], f"{item_path}.photoRef")
            if item["photoRef"] is not None:
                expect(
                    item["photoRef"] in unit_photo_refs,
                    f"{item_path}.photoRef must also appear in the source unit photoRefs",
                )
                # A printed card kit carries words only. A card whose picture
                # is part of what children decide from would print without it
                # and the kit would still look complete, so refuse it here,
                # where the designer can still choose.
                expect(
                    not (isinstance(structure.get("handling"), dict)
                         and structure["handling"].get("kind") == "cards"),
                    f"{item_path}.photoRef: a sort handled as printed cards prints words only, "
                    "so this card's picture would be lost from the kit; handle this sort on the "
                    "board, or put what the picture shows into the card's detail",
                )
        return structure

    expect_exact_keys(
        structure,
        {"kind", "fields", "items"},
        {"kind", "fields", "items"},
        path,
    )
    fields = expect_list(structure["fields"], f"{path}.fields")
    expect(2 <= len(fields) <= 6, f"{path}.fields must contain 2 to 6 fields")
    field_ids: set[str] = set()
    for index, raw_field in enumerate(fields):
        field_path = f"{path}.fields[{index}]"
        field = expect_dict(raw_field, field_path)
        expect_exact_keys(field, {"id", "label"}, {"id", "label"}, field_path)
        field_id = expect_string(field["id"], f"{field_path}.id")
        expect(TASK_FIELD_ID_RE.fullmatch(field_id) is not None, f"{field_path}.id must match field-###")
        expect(field_id not in field_ids, f"{path}.fields contains duplicate id: {field_id}")
        field_ids.add(field_id)
        expect_string(field["label"], f"{field_path}.label")

    items = expect_list(structure["items"], f"{path}.items")
    expect(2 <= len(items) <= 12, f"{path}.items must contain 2 to 12 items")
    item_ids: set[str] = set()
    for index, raw_item in enumerate(items):
        item_path = f"{path}.items[{index}]"
        item = expect_dict(raw_item, item_path)
        expect_exact_keys(item, {"id", "photoRef"}, {"id", "photoRef"}, item_path)
        item_id = expect_string(item["id"], f"{item_path}.id")
        expect(TASK_ITEM_ID_RE.fullmatch(item_id) is not None, f"{item_path}.id must match item-###")
        expect(item_id not in item_ids, f"{path}.items contains duplicate id: {item_id}")
        item_ids.add(item_id)
        photo_ref = expect_string(item["photoRef"], f"{item_path}.photoRef")
        expect(
            photo_ref in unit_photo_refs,
            f"{item_path}.photoRef must also appear in the source unit photoRefs",
        )

    return structure


def validate_answer_structure(
    raw: Any,
    path: str,
    *,
    task_structure: dict[str, Any] | None,
) -> None:
    expect(task_structure is not None, f"{path} requires a source-unit taskStructure")
    structure = expect_dict(raw, path)
    kind = expect_string(structure.get("kind"), f"{path}.kind")
    expect(kind == task_structure["kind"], f"{path}.kind must match taskStructure.kind")

    item_ids = {item["id"] for item in task_structure["items"]}
    if kind == "option-bank":
        raise ContractError(
            f"{path} is not allowed for taskStructure.kind option-bank; "
            "option-bank answers use answer.content"
        )
    if kind == "sort":
        expect_exact_keys(
            structure,
            {"kind", "placements"},
            {"kind", "placements"},
            path,
        )
        group_ids = {group["id"] for group in task_structure["groups"]}
        placements = expect_list(structure["placements"], f"{path}.placements")
        placed_items: set[str] = set()
        for index, raw_placement in enumerate(placements):
            placement_path = f"{path}.placements[{index}]"
            placement = expect_dict(raw_placement, placement_path)
            expect_exact_keys(
                placement,
                {"itemRef", "groupRef"},
                {"itemRef", "groupRef"},
                placement_path,
            )
            item_ref = expect_string(placement["itemRef"], f"{placement_path}.itemRef")
            group_ref = expect_string(placement["groupRef"], f"{placement_path}.groupRef")
            expect(item_ref in item_ids, f"{placement_path}.itemRef points to unknown item: {item_ref}")
            expect(group_ref in group_ids, f"{placement_path}.groupRef points to unknown group: {group_ref}")
            expect(item_ref not in placed_items, f"{path}.placements contains duplicate itemRef: {item_ref}")
            placed_items.add(item_ref)
        missing = item_ids - placed_items
        expect(not missing, f"{path}.placements missing items: {', '.join(sorted(missing))}")
        return

    expect_exact_keys(
        structure,
        {"kind", "results"},
        {"kind", "results"},
        path,
    )
    field_ids = {field["id"] for field in task_structure["fields"]}
    results = expect_list(structure["results"], f"{path}.results")
    answered_items: set[str] = set()
    for index, raw_result in enumerate(results):
        result_path = f"{path}.results[{index}]"
        result = expect_dict(raw_result, result_path)
        expect_exact_keys(result, {"itemRef", "values"}, {"itemRef", "values"}, result_path)
        item_ref = expect_string(result["itemRef"], f"{result_path}.itemRef")
        expect(item_ref in item_ids, f"{result_path}.itemRef points to unknown item: {item_ref}")
        expect(item_ref not in answered_items, f"{path}.results contains duplicate itemRef: {item_ref}")
        answered_items.add(item_ref)

        values = expect_list(result["values"], f"{result_path}.values")
        answered_fields: set[str] = set()
        for value_index, raw_value in enumerate(values):
            value_path = f"{result_path}.values[{value_index}]"
            value = expect_dict(raw_value, value_path)
            expect_exact_keys(value, {"fieldRef", "value"}, {"fieldRef", "value"}, value_path)
            field_ref = expect_string(value["fieldRef"], f"{value_path}.fieldRef")
            expect(field_ref in field_ids, f"{value_path}.fieldRef points to unknown field: {field_ref}")
            expect(field_ref not in answered_fields, f"{result_path}.values contains duplicate fieldRef: {field_ref}")
            answered_fields.add(field_ref)
            expect_string(value["value"], f"{value_path}.value")
        missing_fields = field_ids - answered_fields
        expect(not missing_fields, f"{result_path}.values missing fields: {', '.join(sorted(missing_fields))}")

    missing_items = item_ids - answered_items
    expect(not missing_items, f"{path}.results missing items: {', '.join(sorted(missing_items))}")


def validate_answer(
    raw: Any,
    path: str,
    *,
    allowed_deliveries: set[str] | None = None,
    task_structure: dict[str, Any] | None = None,
) -> None:
    answer = expect_dict(raw, path)
    expect_exact_keys(
        answer,
        {"kind", "content", "acceptanceCondition", "delivery", "structure"},
        {"kind", "content", "acceptanceCondition", "delivery"},
        path,
    )
    kind = expect_string(answer["kind"], f"{path}.kind")
    delivery = expect_string(answer["delivery"], f"{path}.delivery")
    expect(kind in ANSWER_KINDS, f"{path}.kind invalid: {kind}")
    expect(delivery in ANSWER_DELIVERIES, f"{path}.delivery invalid: {delivery}")
    if allowed_deliveries is not None:
        expect(
            delivery in allowed_deliveries,
            f"{path}.delivery {delivery} is not allowed here",
        )
    expect_nullable_string(answer["content"], f"{path}.content")
    expect_nullable_string(answer["acceptanceCondition"], f"{path}.acceptanceCondition")
    structure = answer.get("structure")

    if kind == "none":
        expect(answer["content"] is None, f"{path}.content must be null when kind is none")
        expect(answer["acceptanceCondition"] is None, f"{path}.acceptanceCondition must be null when kind is none")
        expect(delivery == "none", f"{path}.delivery must be none when kind is none")
        expect(structure is None, f"{path}.structure must be null or absent when kind is none")
    else:
        expect(delivery != "none", f"{path}.delivery must not be none when kind is {kind}")
        if structure is None:
            expect(
                isinstance(answer["content"], str) and answer["content"].strip(),
                f"{path}.content must be a non-empty string when kind is {kind}",
            )
        else:
            expect(answer["content"] is None, f"{path}.content must be null when structure is present")
            expect(task_structure is not None, f"{path}.structure requires a source-unit taskStructure")
            if task_structure["kind"] == "option-bank":
                raise ContractError(
                    f"{path}.structure is not allowed when taskStructure.kind is option-bank; "
                    "use answer.content"
                )
            if task_structure["kind"] == "sort":
                expect(kind == "exact", f"{path}.structure for sort is allowed only when kind is exact")
                # A sort's placements are one key, and a card can honestly
                # belong in two groups (`knowing when bread is baked just
                # right`: learned now, earns a living later). The teacher-only
                # acceptance condition is where that second placement and its
                # reason live, so a child who defends it is not marked wrong.
            else:
                expect(kind == "model", f"{path}.structure for evidence-classification is allowed only when kind is model")
            validate_answer_structure(structure, f"{path}.structure", task_structure=task_structure)


def validate_speaker_notes(raw: Any, path: str) -> None:
    notes = expect_dict(raw, path)
    expect_exact_keys(
        notes,
        {"script", "teacherInfo", "lookFor", "onTheBoard"},
        {"script", "teacherInfo", "lookFor"},
        path,
    )
    forbidden_answer_markers = (
        "Answer to question(s) on this slide:",
        "Answer/model for this slide:",
    )
    # `onTheBoard` is optional, so it is read with a default rather than written
    # into the design. A validator that fills a key in passing hands the caller
    # back something it did not write, and the design is what gets saved.
    for key in ("script", "teacherInfo", "lookFor", "onTheBoard"):
        value = notes.get(key)
        expect_nullable_string(value, f"{path}.{key}")
        if isinstance(value, str):
            expect(
                not any(marker in value for marker in forbidden_answer_markers),
                f"{path}.{key} must not duplicate the structured answer marker",
            )
    if notes["script"] is not None:
        prefix = "Say to children:"
        expect(notes["script"].startswith(prefix), f"{path}.script must begin with 'Say to children:'")
        expect(notes["script"][len(prefix):].strip(), f"{path}.script must contain words after 'Say to children:'")
    on_the_board = notes.get("onTheBoard")
    if on_the_board is not None:
        prefix = "On the board:"
        expect(on_the_board.startswith(prefix), f"{path}.onTheBoard must begin with 'On the board:'")
        expect(on_the_board[len(prefix):].strip(), f"{path}.onTheBoard must say what to write or draw after 'On the board:'")
    if notes["lookFor"] is not None:
        prefix = "Look for:"
        expect(notes["lookFor"].startswith(prefix), f"{path}.lookFor must begin with 'Look for:'")
        after = notes["lookFor"][len(prefix):].strip()
        expect(after, f"{path}.lookFor must contain guidance after 'Look for:'")
        words = after.split()
        expect(len(words) <= 25, f"{path}.lookFor must be at most 25 words after 'Look for:' (found {len(words)})")


def validate_representation_ref(
    raw: Any,
    path: str,
    rep_by_id: dict[str, dict[str, Any]],
) -> None:
    ref = expect_dict(raw, path)
    expect_exact_keys(
        ref,
        {"ref", "configuration", "interaction"},
        {"ref", "configuration", "interaction"},
        path,
    )
    rep_id = expect_string(ref["ref"], f"{path}.ref")
    expect(rep_id in rep_by_id, f"{path}.ref points to unknown representation: {rep_id}")
    config = expect_string(ref["configuration"], f"{path}.configuration")
    configs = {item["id"] for item in rep_by_id[rep_id]["configurations"]}
    expect(config in configs, f"{path}.configuration unknown for {rep_id}: {config}")
    interaction = expect_string(ref["interaction"], f"{path}.interaction")
    expect(interaction in INTERACTIONS, f"{path}.interaction invalid: {interaction}")


def resolve_representation_configuration(
    ref: dict[str, Any],
    path: str,
    rep_by_id: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    rep = rep_by_id[ref["ref"]]
    for config in rep["configurations"]:
        if config["id"] == ref["configuration"]:
            return config
    raise ContractError(
        f"{path}.configuration points to unknown configuration "
        f"{ref['configuration']} on {ref['ref']}"
    )


def validate_representation_refs(
    raw: Any,
    path: str,
    rep_by_id: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    refs = expect_list(raw, path)
    seen: set[tuple[str, str, str]] = set()
    for index, ref in enumerate(refs):
        ref_path = f"{path}[{index}]"
        validate_representation_ref(ref, ref_path, rep_by_id)
        key = (ref["ref"], ref["configuration"], ref["interaction"])
        expect(key not in seen, f"{path} contains duplicate representation use: {key}")
        seen.add(key)
    return refs


def validate_takeaway(raw: Any, path: str, sticky_ids: set[str]) -> None:
    # Null is the usual Teach case: the headline is the landed sentence, and a
    # slide lands its sentence once (`validate_teach_says_it_once`).
    if raw is None:
        return
    takeaway = expect_dict(raw, path)
    kind = expect_string(takeaway.get("kind"), f"{path}.kind")
    expect(kind in {"text", "sticky"}, f"{path}.kind must be text or sticky")
    if kind == "text":
        expect_exact_keys(takeaway, {"kind", "text"}, {"kind", "text"}, path)
        expect_string(takeaway["text"], f"{path}.text")
    else:
        expect_exact_keys(takeaway, {"kind", "ref"}, {"kind", "ref"}, path)
        ref = expect_string(takeaway["ref"], f"{path}.ref")
        expect(ref in sticky_ids, f"{path}.ref points to unknown sticky knowledge: {ref}")


_ONCE_STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "to", "is", "are", "was", "were", "it",
    "its", "in", "on", "at", "for", "with", "they", "them", "their", "this",
    "that", "so", "we", "you", "your", "our", "as", "be", "can", "he", "she",
    "his", "her", "also", "too", "not",
}


def _content_words(text: str) -> list[str]:
    words = [word.strip("'") for word in re.findall(r"[a-z0-9']+", text.lower())]
    return [word for word in words if word and word not in _ONCE_STOPWORDS]


def _says_the_same(first: str, second: str) -> bool:
    """Two lines say the same thing when nearly every content word of the
    shorter is in the longer. Four content words is the floor, so a three-word
    line beside a fuller one is not a repeat; a line that adds a detail to the
    other is not either, because its own words are then mostly new."""
    words_a, words_b = _content_words(first), _content_words(second)
    shorter, longer = (words_a, words_b) if len(words_a) <= len(words_b) else (words_b, words_a)
    if len(shorter) < 4:
        return False
    longer_set = set(longer)
    overlap = sum(1 for word in shorter if word in longer_set)
    return overlap / len(shorter) >= 0.8


def _sentences(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+|\n+", text) if part.strip()]


def validate_teach_says_it_once(sequence: list[dict[str, Any]], sticky_by_id: dict[str, Any]) -> None:
    """A Teach slide lands its sentence once. A teeth slide printed `Incisors
    cut; canines help tear.` as its headline and `Incisors cut food and
    canines help tear food.` as its star line, and a child met one fact twice
    and looked at the teeth for neither. The landed sentence is the headline,
    or the sticky fact the takeaway references, never both; the explanation is
    what the board cannot show on its own, not the sentence again."""
    for index, unit in enumerate(sequence):
        if unit.get("kind") != "teach":
            continue
        path = f"teachingSequence[{index}].content"
        content = unit["content"]
        lines: list[tuple[str, str]] = [("headline", content["headline"])]
        takeaway = content.get("takeaway")
        if isinstance(takeaway, dict):
            if takeaway.get("kind") == "text":
                lines.append(("takeaway", takeaway["text"]))
            elif takeaway.get("kind") == "sticky":
                sticky = sticky_by_id.get(takeaway.get("ref")) or {}
                if isinstance(sticky.get("text"), str):
                    lines.append(("takeaway (sticky fact)", sticky["text"]))
        takeaway_ref = takeaway.get("ref") if isinstance(takeaway, dict) else None
        for ref in unit.get("stickyKnowledgeRefs") or []:
            if ref == takeaway_ref:
                continue
            sticky = sticky_by_id.get(ref) or {}
            if isinstance(sticky.get("text"), str):
                lines.append(("sticky fact (stickyKnowledgeRefs)", sticky["text"]))
        if isinstance(content.get("explanation"), str):
            for sentence in _sentences(content["explanation"]):
                lines.append(("explanation", sentence))
        for first_index in range(len(lines)):
            for second_index in range(first_index + 1, len(lines)):
                (name_a, text_a), (name_b, text_b) = lines[first_index], lines[second_index]
                expect(
                    not _says_the_same(text_a, text_b),
                    f"{path}: a Teach slide lands its sentence once, and these say the same "
                    f"thing: {name_a} `{text_a}` and {name_b} `{text_b}`. The landed sentence "
                    "is the headline, or the sticky fact the takeaway references, never both; "
                    "the explanation is only what the board cannot show on its own",
                )


_EXPLAINS = re.compile(r"explain|explanation|compar|paragraph|justif", re.IGNORECASE)

# The beats that ask each child for the lesson's substantial written work, in
# every route: a content or skill lesson's Practise, a task lesson's Do the task.
_SUBSTANTIAL_TASKS = {"practise": "Practise", "do-task": "Do the task"}


def _asks_for_an_explanation(unit: dict[str, Any]) -> bool:
    """An explanation task carries the fields `explanation-tasks.md` owns
    (`reasoningWords`, `rehearsal`), and a Practise also names its form in
    `format`. A Do the task's `activity` is not searched for the word: an
    enquiry that compares two materials is not a written comparison."""
    content = unit.get("content") or {}
    if content.get("reasoningWords") or content.get("rehearsal"):
        return True
    return unit.get("kind") == "practise" and bool(_EXPLAINS.search(content.get("format") or ""))


def _shows_the_class_a_model(unit: dict[str, Any]) -> bool:
    """Whether this beat puts a good finished instance in front of the class:
    a model answer revealed to them, or a launch's pair.

    A My Turn or an Our Turn counts only when it shows the kind of thing
    children then write: its own question asks for an explanation, and its good
    one is on the board (its model answer revealed, or a My Turn's modelled
    exemplar written live). A maths turn that models the rounding has shown the
    rounding, not what a good explanation of it looks like, and the teacher's
    answer of 24 September 2026 was that such a turn does not count.
    """
    kind = unit.get("kind")
    content = unit.get("content") or {}
    answer = unit.get("answer") or {}
    revealed = (
        answer.get("kind") in {"model", "standard"}
        and answer.get("delivery") in {"answer-slide", "visible-in-unit"}
    )
    if kind in {"my-turn", "our-turn"}:
        if not _EXPLAINS.search(content.get("example") or ""):
            return False
        written_live = kind == "my-turn" and bool((content.get("modelledExemplar") or "").strip())
        return revealed or written_live
    if revealed:
        return True
    launch = content.get("launch")
    return isinstance(launch, dict) and launch.get("goodLooksLike") is not None


def validate_explanation_task_is_modelled(structure: str, sequence: list[dict[str, Any]]) -> None:
    """A written explanation or comparison is shown before it is asked for, in
    every route.

    On 22 September 2026 a Year 4 history lesson ended on `Explain how these
    examples show change and continuity` with `launch: null`: the only earlier
    explanation was a Do whose model answer stayed in the teacher's notes, so no
    child had seen what a good explanation of it looked like, and the teacher
    who taught it said so ("You haven't given the tools to explain"). The
    exemption the launch rule allowed, `a form they have made before`, was the
    door, because nothing could check it. The teacher's answer of 24 September
    2026 was one rule everywhere: a skill lesson's Practise and a task lesson's
    Do the task are checked too, and a My Turn or Our Turn counts only when it
    shows the kind of thing children then write.

    His preferences decision 13b lets criteria that already show a good one
    stand in for the good instance ("a writing task whose criteria already show
    a good paragraph skips a second model"), but only an actual good one, never
    a list of what a good one includes. No criteria shape (steps, a reference
    table, labelled references) holds a written model, so nothing here can see
    one, and a written explanation still needs its good instance: a launch pair,
    or an earlier beat that showed one. The words keep 13b for the designer and
    the reviewer. The first build of this check passed any launch whose beat
    carried criteria, and three maths lessons whose rounding steps were attached
    as criteria went through with a one-line launch and no explanation shown.
    """
    for index, unit in enumerate(sequence):
        beat = _SUBSTANTIAL_TASKS.get(unit.get("kind"))
        if beat is None or not _asks_for_an_explanation(unit):
            continue
        content = unit.get("content") or {}
        # Its own answer slide comes after the writing, so only its launch counts.
        launch = content.get("launch")
        if isinstance(launch, dict) and launch.get("goodLooksLike") is not None:
            continue
        if any(_shows_the_class_a_model(earlier) for earlier in sequence[:index]):
            continue
        expect(
            False,
            f"teachingSequence[{index}].content.launch: this {beat} asks each child to write an "
            "explanation or comparison, and nothing earlier in the lesson has shown the class a good "
            "one: the launch has no good instance beside a weak one, and no earlier beat reveals its "
            "model answer (a My Turn or Our Turn counts only when its own question asks for an "
            "explanation and its good one is on the board; success criteria that list what a good one "
            "includes are not a good one shown). A child meeting the form for the first "
            "time in the task has to invent how the explanation goes and use the new learning at "
            "once, and the teacher has nothing on the board to point at. Give `launch.goodLooksLike` "
            "a strong instance beside a weak one on a parallel case (the lesson's own taught case "
            "works), or reveal the model answer of an earlier explanation beat to the class "
            "(`answer.delivery: answer-slide`) so they have seen a good one before they write their own",
        )


def _unit_board_words(unit: dict[str, Any]) -> str:
    """Everything a beat puts in front of the class, lower-cased: its content,
    instruction and task, without the teacher's script."""
    parts: list[str] = []

    def walk(value: Any) -> None:
        if isinstance(value, str):
            parts.append(value)
        elif isinstance(value, list):
            for item in value:
                walk(item)
        elif isinstance(value, dict):
            for item in value.values():
                walk(item)

    walk(unit.get("content"))
    walk(unit.get("pupilInstruction"))
    walk(unit.get("taskStructure"))
    return " ".join(parts).lower()


def _unit_words(unit: dict[str, Any]) -> str:
    """Everything a beat puts in front of the class or says to it, lower-cased."""
    script = (unit.get("speakerNotes") or {}).get("script")
    spoken = script.lower() if isinstance(script, str) else ""
    return f"{_unit_board_words(unit)} {spoken}".strip()


def _word_patterns(term: str) -> list[str]:
    """Patterns for the plain forms a sentence uses a taught term in. A paired
    card (`greater than / less than`, `continuity and change`) is used when
    either of its words is; a plural or a hyphen (`place-value`) still counts."""
    patterns = []
    for part in re.split(r"\s*/\s*|\s+and\s+", term.strip().lower()):
        part = part.strip()
        if not part:
            continue
        # `equal to` is used when a sentence says `equal`; the joining word is
        # not the term.
        part = re.sub(r"\s+(?:to|than|of)$", "", part)
        stem = part[:-1] if part.endswith("s") else part
        if not stem.split():
            continue
        *first, last = stem.split()
        words = [re.escape(w) for w in first] + [_word_forms(last)]
        patterns.append(r"\b" + r"[\s-]+".join(words) + r"\b")
    return patterns


def _word_forms(word: str) -> str:
    """The plain forms a sentence uses a word in: `continuity` as
    `continuities`, `valley` as `valleys`, `change` as `changed` or
    `changing`, `round` as `rounding`. A board says the natural form, and a
    check that heard only the card's own spelling would refuse a word that is
    plainly there. No `-er` form: `rule` is not `ruler`, nor `count` `counter`."""
    if len(word) > 2 and word.endswith("y") and word[-2] not in "aeiou":
        return f"(?:{re.escape(word)}(?:ing)?|{re.escape(word[:-1])}(?:ies|ied))"
    if word.endswith("e"):
        return f"(?:{re.escape(word)}(?:s|d)?|{re.escape(word[:-1])}ing)"
    return f"{re.escape(word)}(?:s|es|ed|ing)?"


def validate_vocabulary_is_used(
    introductions: list[Any],
    vocab_items: list[dict[str, Any]],
    sequence: list[dict[str, Any]],
    faults: FaultLog | RaiseAtOnce | None = None,
    sc_by_id: dict[str, dict[str, Any]] | None = None,
    sticky_by_id: dict[str, dict[str, Any]] | None = None,
    rep_by_id: dict[str, dict[str, Any]] | None = None,
) -> None:
    """A vocabulary slide is there because the beats after it need the word.
    A Year 4 history lesson (14 September 2026) introduced `working conditions`
    on its own slide and then never said it again, on the board, in a question
    or in a script, so the class met a definition that nothing asked them to
    use. The designer's rule that every card has a landing was written down and
    unchecked. The word, or a plain form of it, appears in a later beat.

    Every word is judged on its own, so a card set with two badly placed words
    names both. Judging them one at a time and stopping at the first sends the
    designer back for the same card twice.
    """
    log = faults if faults is not None else RaiseAtOnce()
    order = {unit["sourceUnitId"]: index for index, unit in enumerate(sequence)}
    words = {item["id"]: item.get("term") for item in vocab_items}
    for index, raw in enumerate(introductions):
        if not isinstance(raw, dict):
            continue
        after = raw.get("after")
        start = order.get(after, -1) + 1
        beats_after_the_card = sequence[start:]
        for ref in raw.get("vocabularyRefs") or []:
            word = words.get(ref)
            if not isinstance(word, str) or not word.strip():
                continue
            with log.section():
                validate_one_word_lands(
                    word, index, beats_after_the_card, sc_by_id or {}, sticky_by_id or {}, rep_by_id or {}
                )


# The words a picture prints, read out of its required features the ways
# designers write them: `Visible caption: Each interval is worth 10.`,
# `labels reading 'ear canal' and 'eardrum'`, `columns labelled Thousands,
# Hundreds, Tens and Ones`, `a blank circle captioned thousands`, `the
# eardrum labelled`, `halfway written under the middle tick`. A feature that
# describes the picture without giving its words prints none of them:
# `every integer labelled, with correct negative signs` shows minus signs,
# not the word `negative`, and `No caption: children work it out` prints
# nothing at all.
PRINT_MARKER = re.compile(r"\b(?:captions?|captioned|labels?|labell?ed|headings?|titles?|written|printed)\b", re.IGNORECASE)
PRINT_NEGATED = re.compile(
    r"\b(?:no|without)\s+(?:captions?|labels?|headings?|titles?)\b|\bnot\s+(?:labell?ed|captioned|written|printed)\b|\bunlabell?ed\b",
    re.IGNORECASE,
)
PRINTED_QUOTED = re.compile(r"['‘\"“]([^'’\"”]+)['’\"”]")
PRINTED_AFTER_COLON = re.compile(
    r"\b(?:captions?|captioned|labels?|labell?ed|headings?|titles?|reading|reads|saying|says)\b[^:.;]{0,20}:\s*([^.;]+)",
    re.IGNORECASE,
)
PRINTED_AFTER = re.compile(
    r"\b(?:labell?ed|captioned|reading|reads|saying|says)\s+([^.;:,]+(?:,\s*[^.;:,]+){0,5})",
    re.IGNORECASE,
)
PRINTED_BEFORE = re.compile(r"((?:[^\s,.;:]+\s+){1,3})(?:labell?ed|written|printed)\b", re.IGNORECASE)


def _printed_words(feature: str) -> str:
    """The words a picture's required feature says it prints, lower-cased,
    or nothing when the feature only describes the picture."""
    if not PRINT_MARKER.search(feature) or PRINT_NEGATED.search(feature):
        return ""
    found = [m.group(1) for m in PRINTED_QUOTED.finditer(feature)]
    found += [m.group(1) for m in PRINTED_AFTER_COLON.finditer(feature)]
    found += [" ".join(m.group(1).split()[:8]) for m in PRINTED_AFTER.finditer(feature)]
    found += [m.group(1) for m in PRINTED_BEFORE.finditer(feature)]
    return " ".join(found).lower()


def _shown_beside(
    unit: dict[str, Any],
    sc_by_id: dict[str, dict[str, Any]],
    sticky_by_id: dict[str, dict[str, Any]],
    rep_by_id: dict[str, dict[str, Any]] | None = None,
) -> str:
    """What a beat puts on its slide by reference, lower-cased: the criteria
    and sticky facts it names, and the words its pictures print
    (`_printed_words`); a feature that only describes what the picture shows
    is not a word on the board."""
    shown = [_unit_board_words({"content": (sc_by_id.get(ref) or {}).get("content")})
             for ref in unit.get("successCriteriaRefs") or []]
    shown += [_unit_board_words({"content": (sticky_by_id.get(ref) or {}).get("text")})
              for ref in unit.get("stickyKnowledgeRefs") or []]
    for ref in unit.get("representationRefs") or []:
        if not isinstance(ref, dict):
            continue
        rep = (rep_by_id or {}).get(ref.get("ref")) or {}
        for config in rep.get("configurations") or []:
            if isinstance(config, dict) and config.get("id") == ref.get("configuration"):
                shown += [_printed_words(feature) for feature in config.get("requiredFeatures") or []
                          if isinstance(feature, str)]
    return " ".join(shown)


def validate_one_word_lands(
    word: str,
    index: int,
    beats_after_the_card: list[dict[str, Any]],
    sc_by_id: dict[str, dict[str, Any]] | None = None,
    sticky_by_id: dict[str, dict[str, Any]] | None = None,
    rep_by_id: dict[str, dict[str, Any]] | None = None,
) -> None:
    """Where one carded word has to land: somewhere after the card, and in the
    very next beat. Every question reads the same slide: a beat's own words,
    what it shows by reference and what its pictures print, and its script."""
    shown = {id(unit): _shown_beside(unit, sc_by_id or {}, sticky_by_id or {}, rep_by_id or {})
             for unit in beats_after_the_card}

    def everything(unit: dict[str, Any]) -> str:
        return f"{_unit_words(unit)} {shown[id(unit)]}"

    later = " ".join(everything(unit) for unit in beats_after_the_card)
    expect(
        any(re.search(pattern, later) for pattern in _word_patterns(word)),
        f"vocabularyIntroductions[{index}]: `{word}` is introduced and then never used. "
        "A word earns its vocabulary slide because the beats after it need it: write it into "
        "the next beat's board, its question or task, and its script, so children use the word "
        "rather than only meet its definition. If nothing after the card needs the word, it is "
        "not this lesson's vocabulary",
    )
    # And it earns it *here*: a card is shown because the class is about to
    # meet, use or need that word in the beat that follows it. A Year 4 science
    # lesson (18 September 2026) introduced decay, plaque and acid together
    # after the starter; plaque and acid were used in the next beat and decay
    # was not needed for another four, so the class met a definition, did two
    # beats of other work, and met the thing it named later. The teacher: "the
    # vocab slide is used when they are about to meet, use or need that word
    # for the next slide."
    first_use = None
    for offset, unit in enumerate(beats_after_the_card):
        if any(re.search(pattern, everything(unit)) for pattern in _word_patterns(word)):
            first_use = (offset, unit)
            break
    if first_use and first_use[0] > 0:
        gap, unit = first_use
        label = unit.get("label") or unit.get("sourceUnitId")
        expect(
            False,
            f"vocabularyIntroductions[{index}]: `{word}` is introduced here and first needed "
            f"{gap} beat{'s' if gap != 1 else ''} later, at `{label}`. A card is shown because "
            "the class is about to meet, use or need that word in the beat straight after it, "
            "so move this word to its own introduction there. The alternative, where the word "
            "belongs earlier than the check can see, is that an earlier beat should be saying "
            "it and is not: then the repair is the beat's own words, not the card's place",
        )
    # And it reaches the board there, not only the teacher's script. The
    # teacher, 22 September 2026: "it should be on the board, not just the
    # script." A word the class only hears is one nobody asked them to read,
    # say or use.
    if first_use and first_use[0] == 0:
        unit = first_use[1]
        label = unit.get("label") or unit.get("sourceUnitId")
        board = f"{_unit_board_words(unit)} {shown[id(unit)]}"
        expect(
            any(re.search(pattern, board) for pattern in _word_patterns(word)),
            f"vocabularyIntroductions[{index}]: `{word}` is in the teacher's script for `{label}`, "
            "the beat straight after its card, but not on its board. A word the class only hears "
            "has not reached the board: write it into what that beat shows the class (its board, "
            "its question or its task) as well as its script",
        )


def validate_launch_instance(raw: Any, path: str) -> dict[str, Any]:
    """One side of the good-beside-weak pair.

    A side is the instance itself, and the instance is whatever the product
    actually is. `words` carries it when the product is written; `show` names a
    picture, diagram or helper this beat already has when the product is drawn,
    built, sorted or labelled. Both together are a written instance beside the
    thing it describes. The field used to be one prose string for the whole
    pair, so a launch for a labelled diagram could only print a sentence about
    what a good label says.
    """
    instance = expect_dict(raw, path)
    keys = {"words", "show"}
    expect_exact_keys(instance, keys, keys, path)
    expect_nullable_string(instance["words"], f"{path}.words")
    expect_nullable_string(instance["show"], f"{path}.show")
    expect(
        instance["words"] is not None or instance["show"] is not None,
        f"{path} must carry the instance: `words` when the product is written, "
        "`show` naming one of this beat's own photoRefs or representationRefs "
        "when it is drawn, built, sorted or labelled, or both",
    )
    return instance


def validate_good_looks_like(raw: Any, path: str) -> None:
    """A good instance of the product beside a weak one, and the one line that
    names the difference.

    These are three separate things and they are stored separately, because
    every downstream reader lays out what it can see. While the whole pair was
    one prose string, three Year 4 decks each invented their own arrangement of
    two plain white boxes with `Strong:` and `Weak:` typed inside the sentences,
    and in two of them the weak instance landed on a different side.
    """
    if raw is None:
        return
    pair = expect_dict(raw, path)
    keys = {"strong", "weak", "difference"}
    expect_exact_keys(pair, keys, keys, path)
    validate_launch_instance(pair["strong"], f"{path}.strong")
    validate_launch_instance(pair["weak"], f"{path}.weak")
    difference = expect_string(pair["difference"], f"{path}.difference")
    expect(
        len(difference) <= LAUNCH_DIFFERENCE_MAX_CHARS,
        f"{path}.difference must be at most {LAUNCH_DIFFERENCE_MAX_CHARS} "
        "characters: the one line naming what makes the strong instance strong, "
        "read in a glance under the two cards. A paragraph here is the board "
        "explaining a contrast it is already showing",
    )


def validate_launch(raw: Any, path: str) -> None:
    """The launch of a substantial task: what the lesson has established, a
    good instance beside a weak one, and the steps. Null when children can
    begin from the question alone."""
    if raw is None:
        return
    launch = expect_dict(raw, path)
    keys = {"established", "goodLooksLike", "steps"}
    expect_exact_keys(launch, keys, keys, path)
    # `established` is nullable. It was required, and on a launch whose strong
    # instance is the chain itself the two say the same thing one above the
    # other: a Year 4 science board listed sugar, germs, acid, enamel and the
    # hole, then showed the strong instance saying exactly that in sentences.
    # The instance is the better of the two, so the gathering line goes.
    expect_nullable_string(launch["established"], f"{path}.established")
    validate_good_looks_like(launch["goodLooksLike"], f"{path}.goodLooksLike")
    steps = expect_list(launch["steps"], f"{path}.steps")
    for index, step in enumerate(steps):
        expect_string(step, f"{path}.steps[{index}]")
    expect(
        launch["established"] is not None
        or launch["goodLooksLike"] is not None
        or steps,
        f"{path} must carry at least one of `established`, `goodLooksLike` or "
        "`steps`; a launch with none of them is null",
    )


def launch_show_refs(raw: Any) -> list[tuple[str, str]]:
    """Every `show` a launch names, with the path that named it."""
    if not isinstance(raw, dict):
        return []
    pair = raw.get("goodLooksLike")
    if not isinstance(pair, dict):
        return []
    found: list[tuple[str, str]] = []
    for side in ("strong", "weak"):
        instance = pair.get(side)
        if isinstance(instance, dict) and isinstance(instance.get("show"), str):
            found.append((instance["show"], f"goodLooksLike.{side}.show"))
    return found


def validate_content(kind: str, raw: Any, path: str, sticky_ids: set[str]) -> None:
    content = expect_dict(raw, path)

    def strings(keys: tuple[str, ...], *, nullable: set[str] | None = None) -> None:
        nullable = nullable or set()
        for key in keys:
            if key in nullable:
                expect_nullable_string(content[key], f"{path}.{key}")
            else:
                expect_string(content[key], f"{path}.{key}")

    if kind == "starter":
        keys = {"activity", "connection", "format"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity", "connection", "format"))
    elif kind == "prepare":
        keys = {"mode", "activity"}
        expect_exact_keys(content, keys, keys, path)
        mode = expect_string(content["mode"], f"{path}.mode")
        expect(
            mode in {
                "explanation",
                "pattern-investigation",
                "method-comparison",
                "establish-reference",
                "criteria-teaching",
                "bounded-attempt",
            },
            f"{path}.mode invalid: {mode}",
        )
        strings(("activity",))
    elif kind == "my-turn":
        keys = {"example", "modelledExemplar"}
        expect_exact_keys(content, keys, keys, path)
        strings(("example",))
        expect_nullable_string(content["modelledExemplar"], f"{path}.modelledExemplar")
    elif kind == "our-turn":
        # The questions the teacher guides with are spoken, not printed. They
        # used to sit in `content.guidedQuestions`, which the review packet
        # counted as child-facing, so every one of them reached the board
        # beside the example it was meant to draw out of the class. They live
        # in `speakerNotes.script` now, and the script check below keeps the
        # obligation that an Our Turn actually asks something.
        keys = {"example"}
        expect_exact_keys(content, keys, keys, path)
        strings(("example",))
    elif kind == "your-turn":
        keys = {"activityArchitecture", "task"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activityArchitecture", "task"))
    elif kind == "observe":
        keys = {"activity", "focus", "evidenceProduced"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity", "focus", "evidenceProduced"))
    elif kind == "teach":
        keys = {"headline", "explanation", "takeaway", "teachingText", "keyQuestions"}
        expect_exact_keys(content, keys, keys, path)
        strings(("headline",))
        # The teaching of the idea as the child reads it: the route that
        # follows the sentence the slide lands. Required. It
        # was nullable, "when the board already says it", and a Year 4 history
        # deck reached the teacher on 14 September 2026 as a picture, the label
        # `A Tudor farm household` and nothing to teach from; the route was in
        # the notes he was not reading. The board carries the route
        # (preferences.md, Slide Philosophy, "The fact is the destination").
        expect(
            isinstance(content["explanation"], str) and content["explanation"].strip(),
            f"{path}.explanation must carry the teaching as the child reads it: the route this teacher usually walks after the sentence the slide lands, the because or so that explains it, then an example on the board or what it does not mean, in whole sentences the teacher could say. A headline, a picture and a star fact is a label, and a teacher who does not know the topic cannot teach from it with the notes closed",
        )
        validate_takeaway(content["takeaway"], f"{path}.takeaway", sticky_ids)
        expect_nullable_string(content["teachingText"], f"{path}.teachingText")
        qs = expect_list(content["keyQuestions"], f"{path}.keyQuestions")
        for i, q in enumerate(qs):
            expect_string(q, f"{path}.keyQuestions[{i}]")
    elif kind == "do":
        keys = {"activity", "format", "task"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity", "task"))
        expect_nullable_string(content["format"], f"{path}.format")
    elif kind == "practise":
        # Both fields are required and both are usually null. A task that is
        # not a piece of reasoning writes null twice, the way every other
        # envelope here writes null for what it does not need. Optional was
        # tried and rejected: a field the designer never has to answer is a
        # field nobody answers, and going straight from the launch to the
        # writing with no talk in between is precisely what happened while
        # nothing asked.
        keys = {"activity", "format", "task", "launch"} | REASONING_FIELDS
        expect_exact_keys(content, keys, keys, path)
        strings(("activity", "format", "task"))
        validate_launch(content["launch"], f"{path}.launch")
        validate_reasoning_words(content["reasoningWords"], f"{path}.reasoningWords")
        validate_rehearsal(content["rehearsal"], f"{path}.rehearsal")
    elif kind == "question":
        keys = {"focus", "prerequisites", "discoveryFocus"}
        expect_exact_keys(content, keys, keys, path)
        strings(("focus", "prerequisites", "discoveryFocus"))
    elif kind == "explore":
        keys = {"activity", "conditionsAndSafety", "evidenceProduced"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity", "conditionsAndSafety", "evidenceProduced"))
    elif kind == "make-sense":
        keys = {"resultOrPattern", "prompt"}
        expect_exact_keys(content, keys, keys, path)
        strings(("resultOrPattern", "prompt"))
    elif kind == "teach-why":
        keys = {"takeaway", "accurateExplanation", "unsupportedExplanationToCorrect"}
        expect_exact_keys(content, keys, keys, path)
        # The one line children keep; the explanation is the board's short
        # lines that make it mean something.
        validate_takeaway(content["takeaway"], f"{path}.takeaway", sticky_ids)
        strings(("accurateExplanation",))
        expect_nullable_string(content["unsupportedExplanationToCorrect"], f"{path}.unsupportedExplanationToCorrect")
    elif kind == "use-learning":
        keys = {"activity"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity",))
    elif kind == "finish":
        keys = {"purposefulEnding"}
        expect_exact_keys(content, keys, keys, path)
        strings(("purposefulEnding",))
    elif kind == "grounding-input":
        keys = {"input"}
        expect_exact_keys(content, keys, keys, path)
        strings(("input",))
    elif kind == "stimulus":
        keys = {"prompt", "question", "materialOnSlide"}
        expect_exact_keys(content, keys, keys, path)
        strings(("prompt", "question"))
        expect_nullable_string(content["materialOnSlide"], f"{path}.materialOnSlide")
    elif kind == "talk":
        keys = {"format", "discussionQuestion", "sentenceStems", "durationMinutes", "teacherListensFor"}
        expect_exact_keys(content, keys, keys, path)
        strings(("format", "discussionQuestion"))
        stems = expect_list(content["sentenceStems"], f"{path}.sentenceStems")
        for i, stem in enumerate(stems):
            expect_string(stem, f"{path}.sentenceStems[{i}]")
        expect_positive_int(content["durationMinutes"], f"{path}.durationMinutes")
        listens = expect_list(content["teacherListensFor"], f"{path}.teacherListensFor")
        expect(bool(listens), f"{path}.teacherListensFor must not be empty")
        for i, item in enumerate(listens):
            expect_string(item, f"{path}.teacherListensFor[{i}]")
    elif kind == "stimulus-talk":
        keys = {
            "prompt", "question", "materialOnSlide", "format",
            "sentenceStems", "durationMinutes", "teacherListensFor",
        }
        expect_exact_keys(content, keys, keys, path)
        strings(("prompt", "question", "format"))
        expect_nullable_string(content["materialOnSlide"], f"{path}.materialOnSlide")
        stems = expect_list(content["sentenceStems"], f"{path}.sentenceStems")
        for i, stem in enumerate(stems):
            expect_string(stem, f"{path}.sentenceStems[{i}]")
        expect_positive_int(content["durationMinutes"], f"{path}.durationMinutes")
        listens = expect_list(content["teacherListensFor"], f"{path}.teacherListensFor")
        expect(bool(listens), f"{path}.teacherListensFor must not be empty")
        for i, item in enumerate(listens):
            expect_string(item, f"{path}.teacherListensFor[{i}]")
    elif kind == "synthesise":
        keys = {"framesToName"}
        expect_exact_keys(content, keys, keys, path)
        frames = expect_list(content["framesToName"], f"{path}.framesToName")
        expect(bool(frames), f"{path}.framesToName must not be empty")
        for i, item in enumerate(frames):
            expect_string(item, f"{path}.framesToName[{i}]")
    elif kind == "set-task":
        keys = {"question", "investigationBrief"}
        expect_exact_keys(content, keys, keys, path)
        strings(("question",))
        expect_nullable_string(content["investigationBrief"], f"{path}.investigationBrief")
    elif kind == "teach-needed":
        keys = {"enablingInput", "explanation", "modelledOn"}
        expect_exact_keys(content, keys, keys, path)
        strings(("enablingInput", "modelledOn"))
        # The teaching of the idea as the child reads it; null only when the
        # idea and its instance already carry the meaning.
        expect_nullable_string(content["explanation"], f"{path}.explanation")
    elif kind == "plan-checkpoint":
        keys = {"whatChildrenPlan", "checkpointQuestion"}
        expect_exact_keys(content, keys, keys, path)
        strings(("whatChildrenPlan", "checkpointQuestion"))
    elif kind == "do-task":
        keys = {"activity", "launch", "planWithinTask", "checkpointQuestion", "runsBeyondToday", "todayEndsAt"} | REASONING_FIELDS
        expect_exact_keys(content, keys, keys, path)
        strings(("activity",))
        validate_launch(content["launch"], f"{path}.launch")
        validate_reasoning_words(content["reasoningWords"], f"{path}.reasoningWords")
        validate_rehearsal(content["rehearsal"], f"{path}.rehearsal")
        expect_nullable_string(content["planWithinTask"], f"{path}.planWithinTask")
        expect_nullable_string(content["checkpointQuestion"], f"{path}.checkpointQuestion")
        expect(
            (content["planWithinTask"] is None) == (content["checkpointQuestion"] is None),
            f"{path}.planWithinTask and checkpointQuestion must both be null or both be non-null",
        )
        if content["planWithinTask"] is not None:
            expect_string(content["planWithinTask"], f"{path}.planWithinTask")
            expect_string(content["checkpointQuestion"], f"{path}.checkpointQuestion")
        expect_bool(content["runsBeyondToday"], f"{path}.runsBeyondToday")
        expect_nullable_string(content["todayEndsAt"], f"{path}.todayEndsAt")
        if content["runsBeyondToday"]:
            expect_string(content["todayEndsAt"], f"{path}.todayEndsAt")
        else:
            expect(content["todayEndsAt"] is None, f"{path}.todayEndsAt must be null when runsBeyondToday is false")
    elif kind == "share-conclude":
        keys = {"activity"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity",))
    elif kind in {"apply", "reflect"}:
        keys = {"activity"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity",))
    else:
        raise ContractError(f"{path} has unsupported source-unit kind: {kind}")


def validate_visual(
    raw: Any,
    path: str,
    rep_by_id: dict[str, dict[str, Any]],
    photo_ids: set[str],
) -> None:
    visual = expect_dict(raw, path)
    kind = expect_string(visual.get("kind"), f"{path}.kind")
    allowed = {"none", "emoji", "photo", "representation", "built-in", "description"}
    expect(kind in allowed, f"{path}.kind invalid: {kind}")
    expect_exact_keys(
        visual,
        {"kind", "value", "photoRef", "representationRef", "configuration"},
        {"kind"},
        path,
    )
    value = visual.get("value")
    photo_ref = visual.get("photoRef")
    rep_ref = visual.get("representationRef")
    configuration = visual.get("configuration")
    if kind == "none":
        expect(value is None and photo_ref is None and rep_ref is None and configuration is None,
               f"{path} kind none must not carry other values")
    elif kind in {"emoji", "built-in", "description"}:
        expect_string(value, f"{path}.value")
        expect(photo_ref is None and rep_ref is None and configuration is None,
               f"{path} kind {kind} may use only value")
    elif kind == "photo":
        ref = expect_string(photo_ref, f"{path}.photoRef")
        expect(ref in photo_ids, f"{path}.photoRef points to unknown initial photo: {ref}")
        expect(value is None and rep_ref is None and configuration is None,
               f"{path} kind photo may use only photoRef")
    else:
        ref = expect_string(rep_ref, f"{path}.representationRef")
        expect(ref in rep_by_id, f"{path}.representationRef points to unknown representation: {ref}")
        config = expect_string(configuration, f"{path}.configuration")
        valid_configs = {item["id"] for item in rep_by_id[ref]["configurations"]}
        expect(config in valid_configs, f"{path}.configuration unknown for {ref}: {config}")
        expect(value is None and photo_ref is None, f"{path} kind representation may use only representationRef/configuration")


REASONING_FIELDS = {"reasoningWords", "rehearsal"}
REASONING_WORDS_MAX = 6
REHEARSAL_MAX_CHARS = 200


def validate_reasoning_words(raw: Any, path: str) -> None:
    """The words that connect this task's knowledge, when the task is reasoning.

    A lesson's `vocabulary` is its subject words - decay, plaque, acid; monarchy,
    rebellion; numerator. Those supply the knowledge. They do not connect it, and
    a child holding all three and none of `because`, `so`, `causes` or `leads to`
    writes four true sentences in a row, which is the exact answer the tooth
    lesson set out to beat. Null when the task is not a piece of reasoning.

    Kept short on purpose. The evidence for sentence stems as an intervention is
    much weaker than for dialogue, vocabulary and modelling, and a laminated set
    that never changes teaches children to fill a gap rather than to decide what
    relationship their ideas actually have. A handful chosen for this task, and
    dropped once the class chooses for itself, is the form that survives that.
    """
    if raw is None:
        return
    words = expect_list(raw, path)
    expect(bool(words), f"{path} must be null rather than an empty list")
    expect(
        len(words) <= REASONING_WORDS_MAX,
        f"{path} must name at most {REASONING_WORDS_MAX} connecting words: the "
        "few this task's explanation actually needs, chosen for the year group, "
        "not a bank the class picks over",
    )
    seen: set[str] = set()
    for index, word in enumerate(words):
        value = expect_string(word, f"{path}[{index}]")
        lowered = value.strip().lower()
        expect(lowered not in seen, f"{path} repeats {value}")
        seen.add(lowered)


def validate_rehearsal(raw: Any, path: str) -> None:
    """Say it, be asked one question, then write it.

    The strongest single recommendation in the literacy evidence for a task of
    this kind is that children articulate the explanation aloud before writing
    it, because composition and transcription compete for the same attention and
    talking lets a child build the idea before spelling and handwriting take
    their share. `partnerAsks` is the second half and the part that does the
    work: the partner's one question is what turns a first attempt into a second,
    better one, so the written version is a re-explanation rather than a first
    draft. Null when the task is not extended writing, or when independent first
    formulation is the evidence the lesson wants.
    """
    if raw is None:
        return
    rehearsal = expect_dict(raw, path)
    keys = {"sayIt", "partnerAsks"}
    expect_exact_keys(rehearsal, keys, keys, path)
    for key in ("sayIt", "partnerAsks"):
        value = expect_string(rehearsal[key], f"{path}.{key}")
        expect(
            len(value) <= REHEARSAL_MAX_CHARS,
            f"{path}.{key} must be at most {REHEARSAL_MAX_CHARS} characters; it "
            "is what one child says to another, not a second set of criteria",
        )


TAUGHT_TERM_RE = re.compile(r"\{\{([^{}]+)\}\}")


def criteria_taught_terms(content: Any) -> list[str]:
    """Every `{{taught word}}` a success criterion marks, in order."""
    found: list[str] = []

    def walk(node: Any) -> None:
        if isinstance(node, str):
            found.extend(match.group(1).strip() for match in TAUGHT_TERM_RE.finditer(node))
        elif isinstance(node, list):
            for item in node:
                walk(item)
        elif isinstance(node, dict):
            for value in node.values():
                walk(value)

    walk(content)
    return [term for term in found if term]


def term_is_used(term: str, text: str) -> bool:
    """Whether the instance uses this taught word.

    Lenient about the shape of the word - `plaque` covers `plaque`, `germs`
    covers `germ` - because the launch writes a sentence, not a word list, and a
    check that argued about inflections would send designers back over wording
    that was already right.
    """
    stem = re.sub(r"(ies|es|s)$", "", term.strip().lower())
    if len(stem) < 3:
        stem = term.strip().lower()
    return bool(stem) and stem in text.lower()


def validate_launch_uses_the_taught_words(
    unit: dict[str, Any],
    path: str,
    sc_by_id: dict[str, dict[str, Any]],
) -> None:
    """The good instance is a piece of work that would meet this lesson's own
    standard, including the taught words that standard names.

    The tooth-decay launch of 18 September 2026 showed a model explanation that
    never said `plaque`, while the criteria a child was then marked against said
    `write what the germs in the {{plaque}} do with that sugar`. A class is shown
    what good looks like and then held to a standard the model itself would fail.

    The evidence Daniel brought back the same day puts it the other way round and
    more usefully: the test of whether a word has been taught is not whether a
    child can define it, but whether they decide for themselves that it is the
    word they need in order to explain. A model that leaves the word out is the
    one place the lesson could have shown that decision being made and did not.
    """
    content = unit.get("content")
    if not isinstance(content, dict):
        return
    launch = content.get("launch")
    if not isinstance(launch, dict):
        return
    pair = launch.get("goodLooksLike")
    if not isinstance(pair, dict):
        return
    strong = pair.get("strong")
    if not isinstance(strong, dict) or not isinstance(strong.get("words"), str):
        # A good instance the class looks at rather than reads - a diagram, a
        # sketch, a sorted set - carries its words on the picture, not here.
        return
    words = strong["words"]
    missing: list[str] = []
    for ref in unit.get("successCriteriaRefs") or []:
        criterion = sc_by_id.get(ref)
        if criterion is None:
            continue
        for term in criteria_taught_terms(criterion.get("content")):
            if not term_is_used(term, words) and term not in missing:
                missing.append(term)
    expect(
        not missing,
        f"{path}.content.launch.goodLooksLike.strong.words is the model of this "
        f"task and does not use {', '.join(missing)}, which this beat's success "
        "criteria name as taught words the work must use. Write the model as a "
        "child meeting the criteria would write it, using the word; a taught "
        "word stays in the criteria, and a class shown a model that would fail "
        "the standard is being marked against something it was never shown",
    )


def validate_source_unit(
    raw: Any,
    path: str,
    *,
    section: str,
    ordinal: int,
    allowed_kinds: set[str],
    rep_by_id: dict[str, dict[str, Any]],
    sc_ids: set[str],
    sticky_ids: set[str],
    misconception_ids: set[str],
    concept_ids: set[str],
    photo_ids: set[str],
) -> dict[str, Any]:
    unit = expect_dict(raw, path)
    expect_exact_keys(unit, UNIT_FIELDS | UNIT_OPTIONAL_FIELDS, UNIT_FIELDS, path)
    validate_source_unit_id(unit["sourceUnitId"], f"{path}.sourceUnitId", section, ordinal)
    expect_string(unit["label"], f"{path}.label")
    if "minutes" in unit:
        minutes = unit["minutes"]
        expect(
            isinstance(minutes, int) and not isinstance(minutes, bool)
            and 1 <= minutes <= BEAT_MINUTES_MAX,
            f"{path}.minutes must be a whole number of minutes between 1 and {BEAT_MINUTES_MAX}: "
            "how long this beat actually takes with this class, so the lesson can be added up "
            "against the slot before it is built",
        )
    kind = expect_string(unit["kind"], f"{path}.kind")
    expect(kind in allowed_kinds, f"{path}.kind invalid for this section/route: {kind}")

    skill_turn = kind in {"my-turn", "our-turn", "your-turn"}
    if skill_turn:
        concept_ref = expect_string(unit["conceptRef"], f"{path}.conceptRef")
        expect(concept_ref in concept_ids, f"{path}.conceptRef points to unknown concept: {concept_ref}")
    elif unit["conceptRef"] is not None:
        # In a knowledge lesson a concept is an idea children learn to see
        # (continuity and change, cause, a pattern, a fair test), and a unit
        # that names it is an instance of that idea on its own evidence. The
        # skill route's prepare beat and the starter stay null.
        expect(kind != "prepare", f"{path}.conceptRef must be null for prepare")
        concept_ref = expect_string(unit["conceptRef"], f"{path}.conceptRef")
        expect(concept_ref in concept_ids, f"{path}.conceptRef points to unknown concept: {concept_ref}")

    validate_content(kind, unit["content"], f"{path}.content", sticky_ids)
    unlocks = unit["unlocks"]
    if unlocks is not None:
        # expect_string already refuses an empty or whitespace-only value, so a
        # beat that has nothing to record uses null rather than a blank line.
        unlocks = expect_string(unlocks, f"{path}.unlocks")
        expect(
            len(unlocks) <= UNLOCKS_MAX_CHARS,
            f"{path}.unlocks must be at most {UNLOCKS_MAX_CHARS} characters; it names what children can now do, not how the beat went",
        )
    thinking = unit["thinking"]
    if thinking is not None:
        thinking = expect_string(thinking, f"{path}.thinking")
        expect(
            len(thinking) <= THINKING_MAX_CHARS,
            f"{path}.thinking must be at most {THINKING_MAX_CHARS} characters; it names the thought a child has to have to do this beat, not the activity",
        )
    else:
        expect(
            kind in NO_PUPIL_ACTION_KINDS,
            f"{path}.thinking must name the thought every child has to have during this beat; null is only for a beat where the teacher acts and children watch (a My Turn, a stimulus, the setting of a task), and {kind} is not one. On a Teach it is what the class works out while you teach, usually what the key question makes them look for on the board",
        )
    expect_nullable_string(unit["pupilInstruction"], f"{path}.pupilInstruction")
    modelling = unit["modellingState"]
    if modelling is not None:
        modelling = expect_string(modelling, f"{path}.modellingState")
        expect(
            modelling in MODELLING_STATES,
            f"{path}.modellingState must be null or a canonical modelling state",
        )
    if kind == "my-turn":
        expect(modelling is not None, f"{path}.modellingState is required for My Turn")

    representation_refs = validate_representation_refs(
        unit["representationRefs"],
        f"{path}.representationRefs",
        rep_by_id,
    )

    if kind == "my-turn" and unit["content"]["modelledExemplar"] is not None:
        expect(
            modelling == "Question and reference",
            f"{path}.content.modelledExemplar is valid only for Question and reference My Turn writing",
        )

    if modelling == "Live-complete helper":
        live_refs = [
            ref for ref in representation_refs
            if ref["interaction"] == "teacher-completes"
        ]
        expect(
            bool(live_refs),
            f"{path}.modellingState Live-complete helper requires a teacher-completes representation use",
        )
        expect(
            any(
                resolve_representation_configuration(
                    ref,
                    f"{path}.representationRefs",
                    rep_by_id,
                )["loadBearing"]
                for ref in live_refs
            ),
            f"{path}.modellingState Live-complete helper requires a load-bearing teacher-completes representation configuration",
        )

    validate_ref_list(unit["successCriteriaRefs"], f"{path}.successCriteriaRefs", sc_ids)
    sticky_refs = validate_ref_list(unit["stickyKnowledgeRefs"], f"{path}.stickyKnowledgeRefs", sticky_ids)
    unit_misconception_refs = validate_ref_list(
        unit["misconceptionRefs"], f"{path}.misconceptionRefs", misconception_ids
    )
    # A misconception the design names has to reach the teacher where it shows.
    # The design records what children get wrong, and nothing downstream turns
    # that into a note, so a Year 4 nearest-1,000 design named three wrong rules
    # and every teacher line in the lesson was empty (19 September 2026).
    if unit_misconception_refs:
        expect(
            unit["speakerNotes"]["teacherInfo"] is not None,
            f"{path}.speakerNotes.teacherInfo is required: this beat names a "
            "misconception, so the teacher needs what the wrong answer looks like "
            "here and the one move that answers it, at the moment it shows",
        )
    photo_refs = validate_ref_list(unit["photoRefs"], f"{path}.photoRefs", photo_ids)

    # A launch that shows a picture, diagram or helper names one this beat
    # already carries, so the slide designer resolves it the way it resolves
    # every other picture on the beat and never invents one to fill the card.
    unit_shows = {ref for ref in photo_refs}
    unit_shows |= {ref["ref"] for ref in representation_refs}
    for shown, where in launch_show_refs(unit["content"].get("launch")):
        expect(
            shown in unit_shows,
            f"{path}.content.launch.{where} names {shown}, which is not one of "
            f"this beat's photoRefs or representationRefs. The launch shows "
            "something the beat already has; add it to the beat first",
        )

    task_structure = validate_task_structure(
        unit.get("taskStructure"),
        f"{path}.taskStructure",
        unit_photo_refs=set(photo_refs),
    )
    if task_structure is not None:
        expect(
            unit["pupilInstruction"] is not None,
            f"{path}.pupilInstruction must be non-null when taskStructure is present",
        )
    # A Do beat that hands children something to work with is a task being set,
    # and a task nobody sets goes wrong in the thirty seconds before the
    # thinking starts. A Year 4 history record beat gave every child a printed
    # three-part record to complete and wrote no words to the children, while
    # the card sort beside it was fully prepared, because a sort carries a
    # taskStructure and a written task does not. The quick beat is untouched:
    # a question answered on whiteboards hands nothing out (`do-beats.md`,
    # Setting the task).
    if kind in {"do", "practise"} and unit["pupilInstruction"] is None:
        # Both pupil-facing interactions count. The first lesson built after this
        # rule shipped handed every child a printed chain strip to write the
        # missing steps into, recorded it as `pupil-writes-on`, and set no task
        # at all, because the rule only looked at `pupil-uses` (18 September
        # 2026). A child writing on a thing is at least as much a task being set
        # as a child using one.
        pupil_used = [
            ref for ref in representation_refs
            if ref.get("interaction") in {"pupil-uses", "pupil-writes-on"}
        ]
        if pupil_used:
            expect(
                False,
                f"{path}.pupilInstruction must be non-null: this beat hands children "
                f"{pupil_used[0]['ref']} to work with, so it sets a task, and the words that set "
                "it say what each child or pair has, what they do with it, and the one thing to "
                "hold in mind while they work (`do-beats.md`, Setting the task)",
            )
    content = unit["content"]
    ordering_texts = (
        unit["pupilInstruction"],
        content.get("task") if isinstance(content, dict) else None,
        content.get("activity") if isinstance(content, dict) else None,
    )
    if (
        task_structure is not None
        and task_structure["kind"] == "option-bank"
        and has_ordering_cue(*ordering_texts)
    ):
        check_not_printed_in_answer_order(
            [str(item["label"]) for item in task_structure["items"]],
            f"{path}.taskStructure",
            what="option bank",
        )
    if kind == "starter" and isinstance(content, dict):
        activity = content.get("activity")
        if isinstance(activity, str) and has_ordering_cue(activity):
            listed = bullet_items(activity)
            if len(listed) >= 3:
                check_not_printed_in_answer_order(
                    listed,
                    f"{path}.content.activity",
                    what="list",
                )
    validate_speaker_notes(unit["speakerNotes"], f"{path}.speakerNotes")
    if kind in SCRIPT_REQUIRED_KINDS:
        expect(
            unit["speakerNotes"]["script"] is not None,
            f"{path}.speakerNotes.script is required for {kind}",
        )
    # An Our Turn is the class thinking alongside the teacher, so the script is
    # where its guiding questions are asked. Without them the beat is a second
    # demonstration wearing an Our Turn label.
    if kind == "our-turn":
        script = unit["speakerNotes"]["script"] or ""
        expect(
            "?" in script,
            f"{path}.speakerNotes.script must ask the class at least one "
            f"question: an Our Turn's guiding questions are spoken, and this "
            f"script asks nothing",
        )

    # A model the teacher completes live on the board is shown finished on the
    # slide after it, and its notes say what to write while completing it. A
    # cover teacher met a Year 4 rounding deck (17 September 2026) whose every
    # My Turn and Our Turn was a blank number line with nothing saying what to
    # write on it and no finished line anywhere until the reasoning slide, and
    # abandoned the deck for her own whiteboard. The teacher who knows the
    # lesson skips the finished slide; the one who does not needs it.
    completes_live = kind in {"my-turn", "our-turn"} and (
        modelling == "Live-complete helper"
        or (
            kind == "our-turn"
            and any(ref["interaction"] == "teacher-completes" for ref in representation_refs)
        )
    )
    notes = unit["speakerNotes"]
    if completes_live:
        expect(
            notes.get("onTheBoard") is not None,
            f"{path}.speakerNotes.onTheBoard is required: this {kind} is completed live "
            "on its representation, so the notes say, in order, what to write or draw "
            "on it (`On the board: Write 40 and 50 on the ends. Write 45 under the "
            "middle mark. Draw an arrow at 43.`), for a teacher who has not planned it",
        )
    else:
        expect(
            notes.get("onTheBoard") is None,
            f"{path}.speakerNotes.onTheBoard is only for a My Turn or Our Turn the "
            "teacher completes live on a representation; set it to null here",
        )

    allowed_answer_deliveries = set(ANSWER_DELIVERIES)
    if kind == "my-turn" and not completes_live:
        allowed_answer_deliveries.discard("answer-slide")
    validate_answer(
        unit["answer"],
        f"{path}.answer",
        allowed_deliveries=allowed_answer_deliveries,
        task_structure=task_structure,
    )
    answer_kind = unit["answer"]["kind"]
    answer_delivery = unit["answer"]["delivery"]

    if completes_live and (answer_kind != "none" or kind == "our-turn"):
        expect(
            answer_kind != "none" and answer_delivery == "answer-slide",
            f"{path}.answer.delivery must be answer-slide: this {kind} is completed live "
            "on its representation, and the slide after it shows the finished "
            "representation so a class (and a teacher who did not draw it) can see the result",
        )

    if answer_delivery == "answer-slide":
        expect(
            kind in MAIN_ANSWER_SLIDE_KINDS
            or completes_live
            or answer_kind in {"model", "standard"},
            f"{path}.answer.delivery answer-slide is allowed only for a starter, "
            "main independent work, or a model/standard reveal",
        )

    if kind == "my-turn":
        expect(
            answer_kind != "none",
            f"{path}.answer must contain the My Turn answer/model/standard",
        )
        if modelling == "Prepared example":
            expect(
                answer_delivery == "visible-in-unit",
                f"{path}.answer.delivery must be visible-in-unit for Prepared example My Turn",
            )
        elif not completes_live:
            expect(
                answer_delivery == "teacher-only",
                f"{path}.answer.delivery must be teacher-only for a My Turn that is "
                "neither a Prepared example nor completed live on a representation",
            )

    if answer_delivery == "visible-in-unit":
        expect(
            kind in {"my-turn", "teach", "teach-needed"},
            f"{path}.answer.delivery visible-in-unit is allowed only on teacher-presented model units",
        )
        expect(
            modelling == "Prepared example",
            f"{path}.answer.delivery visible-in-unit requires modellingState Prepared example",
        )

    if kind == "teach":
        takeaway = unit["content"]["takeaway"]
        if takeaway is not None and takeaway["kind"] == "sticky":
            expect(
                takeaway["ref"] in sticky_refs,
                f"{path}.content.takeaway sticky ref must also appear in stickyKnowledgeRefs",
            )

    return unit


def validate_response_form(item: dict[str, Any], path: str) -> None:
    """The child's action, and the one form that has to say why.

    The vocabulary is enforced here rather than described, because a free-text
    response field is what let every sheet reach for ruled lines. The reason on
    `written-explanation` is not a tax on writing: it is the question "what do
    the words evidence that another form would not", asked at the one moment
    somebody can still answer it, which is while the question is being written.
    """
    form = expect_string(item.get("responseForm"), f"{path}.responseForm")
    expect(
        form in WORKSHEET_RESPONSE_FORMS,
        f"{path}.responseForm invalid: {form} "
        f"(expected one of {', '.join(sorted(WORKSHEET_RESPONSE_FORMS))})",
    )
    reason = item.get("responseFormReason")
    if form == REASONED_RESPONSE_FORM:
        expect_string(reason, f"{path}.responseFormReason")
        return
    expect(
        reason is None,
        f"{path}.responseFormReason must be null when responseForm is not "
        f"{REASONED_RESPONSE_FORM}; the form already says what the child does",
    )


def validate_worksheet_content_block(
    raw: Any,
    path: str,
    *,
    rep_by_id: dict[str, dict[str, Any]],
    sticky_ids: set[str],
    photo_ids: set[str],
) -> str:
    block = expect_dict(raw, path)
    kind = expect_string(block.get("kind"), f"{path}.kind")
    expect(kind in WORKSHEET_BLOCK_KINDS, f"{path}.kind invalid: {kind}")
    common = {"id", "kind", "representationRefs", "stickyKnowledgeRefs", "photoRefs"}

    if kind == "question":
        allowed = common | {
            "pupilPrompt", "response", "responseForm", "responseFormReason",
            "support", "visualRequirements", "answer",
        }
        expect_exact_keys(block, allowed, allowed, path)
        block_id = expect_string(block["id"], f"{path}.id")
        expect(re.fullmatch(r"^ws-q-\d{3}$", block_id) is not None, f"{path}.id must match ws-q-###")
        expect_string(block["pupilPrompt"], f"{path}.pupilPrompt")
        expect_string(block["response"], f"{path}.response")
        validate_response_form(block, path)
        expect_string(block["support"], f"{path}.support", allow_empty=True)
        expect_string(block["visualRequirements"], f"{path}.visualRequirements", allow_empty=True)
        validate_answer(block["answer"], f"{path}.answer", allowed_deliveries={"teacher-only", "none"})

    elif kind == "question-group":
        allowed = common | {"groupPrompt", "parts"}
        expect_exact_keys(block, allowed, allowed, path)
        block_id = expect_string(block["id"], f"{path}.id")
        expect(re.fullmatch(r"^ws-qg-\d{3}$", block_id) is not None, f"{path}.id must match ws-qg-###")
        expect_nullable_string(block["groupPrompt"], f"{path}.groupPrompt")
        parts = expect_list(block["parts"], f"{path}.parts")
        expect(len(parts) >= 2, f"{path}.parts must contain at least two parts")
        for index, raw_part in enumerate(parts, 1):
            part_path = f"{path}.parts[{index - 1}]"
            part = expect_dict(raw_part, part_path)
            fields = {
                "id", "pupilPrompt", "response", "responseForm", "responseFormReason",
                "support", "visualRequirements",
                "representationRefs", "stickyKnowledgeRefs", "photoRefs", "answer",
            }
            expect_exact_keys(part, fields, fields, part_path)
            expected_id = f"{block_id}-part-{index:02d}"
            expect(part["id"] == expected_id, f"{part_path}.id must be exactly {expected_id}")
            expect_string(part["pupilPrompt"], f"{part_path}.pupilPrompt")
            expect_string(part["response"], f"{part_path}.response")
            validate_response_form(part, part_path)
            expect_string(part["support"], f"{part_path}.support", allow_empty=True)
            expect_string(part["visualRequirements"], f"{part_path}.visualRequirements", allow_empty=True)
            validate_representation_refs(part["representationRefs"], f"{part_path}.representationRefs", rep_by_id)
            validate_ref_list(part["stickyKnowledgeRefs"], f"{part_path}.stickyKnowledgeRefs", sticky_ids)
            validate_ref_list(part["photoRefs"], f"{part_path}.photoRefs", photo_ids)
            validate_answer(part["answer"], f"{part_path}.answer", allowed_deliveries={"teacher-only", "none"})

    elif kind == "frame":
        allowed = common | {"sections", "answer"}
        expect_exact_keys(block, allowed, allowed, path)
        block_id = expect_string(block["id"], f"{path}.id")
        expect(re.fullmatch(r"^ws-frame-\d{3}$", block_id) is not None, f"{path}.id must match ws-frame-###")
        sections = expect_list(block["sections"], f"{path}.sections")
        expect(bool(sections), f"{path}.sections must not be empty")
        for index, raw_section in enumerate(sections):
            section_path = f"{path}.sections[{index}]"
            section = expect_dict(raw_section, section_path)
            expect_exact_keys(
                section,
                {"heading", "whatGoesHere", "noteSpace"},
                {"heading", "whatGoesHere", "noteSpace"},
                section_path,
            )
            expect_string(section["heading"], f"{section_path}.heading")
            expect_string(section["whatGoesHere"], f"{section_path}.whatGoesHere")
            expect_string(section["noteSpace"], f"{section_path}.noteSpace")
        validate_answer(block["answer"], f"{path}.answer", allowed_deliveries={"teacher-only", "none"})

    elif kind == "stimulus-set":
        allowed = common | {"stimulus", "relationship", "pupilAction", "prompts"}
        expect_exact_keys(block, allowed, allowed, path)
        block_id = expect_string(block["id"], f"{path}.id")
        expect(re.fullmatch(r"^ws-stimulus-\d{3}$", block_id) is not None, f"{path}.id must match ws-stimulus-###")
        for key in ("stimulus", "relationship", "pupilAction"):
            expect_string(block[key], f"{path}.{key}")
        prompts = expect_list(block["prompts"], f"{path}.prompts")
        expect(bool(prompts), f"{path}.prompts must not be empty")
        for index, raw_prompt in enumerate(prompts, 1):
            prompt_path = f"{path}.prompts[{index - 1}]"
            prompt = expect_dict(raw_prompt, prompt_path)
            fields = {
                "id", "pupilPrompt", "response", "responseForm", "responseFormReason",
                "support", "visualRequirements",
                "representationRefs", "stickyKnowledgeRefs", "photoRefs", "answer",
            }
            expect_exact_keys(prompt, fields, fields, prompt_path)
            expected_id = f"{block_id}-prompt-{index:02d}"
            expect(prompt["id"] == expected_id, f"{prompt_path}.id must be exactly {expected_id}")
            expect_string(prompt["pupilPrompt"], f"{prompt_path}.pupilPrompt")
            expect_string(prompt["response"], f"{prompt_path}.response")
            validate_response_form(prompt, prompt_path)
            expect_string(prompt["support"], f"{prompt_path}.support", allow_empty=True)
            expect_string(prompt["visualRequirements"], f"{prompt_path}.visualRequirements", allow_empty=True)
            validate_representation_refs(prompt["representationRefs"], f"{prompt_path}.representationRefs", rep_by_id)
            validate_ref_list(prompt["stickyKnowledgeRefs"], f"{prompt_path}.stickyKnowledgeRefs", sticky_ids)
            validate_ref_list(prompt["photoRefs"], f"{prompt_path}.photoRefs", photo_ids)
            validate_answer(prompt["answer"], f"{prompt_path}.answer", allowed_deliveries={"teacher-only", "none"})

    else:
        allowed = common | {"generator", "recordingSurface", "firstRowWorked", "answer"}
        expect_exact_keys(block, allowed, allowed, path)
        block_id = expect_string(block["id"], f"{path}.id")
        expect(re.fullmatch(r"^ws-generated-\d{3}$", block_id) is not None, f"{path}.id must match ws-generated-###")
        expect_string(block["generator"], f"{path}.generator")
        expect_string(block["recordingSurface"], f"{path}.recordingSurface")
        expect_nullable_string(block["firstRowWorked"], f"{path}.firstRowWorked")
        validate_answer(block["answer"], f"{path}.answer", allowed_deliveries={"teacher-only", "none"})

    validate_representation_refs(block["representationRefs"], f"{path}.representationRefs", rep_by_id)
    validate_ref_list(block["stickyKnowledgeRefs"], f"{path}.stickyKnowledgeRefs", sticky_ids)
    validate_ref_list(block["photoRefs"], f"{path}.photoRefs", photo_ids)
    return block_id


def idea_instances(root: dict[str, Any], sequence: list[dict[str, Any]], concept_id: str) -> list[dict[str, Any]]:
    """The units that are instances of an idea: sequence beats plus an
    included ending beat that carry its conceptRef."""
    units = list(sequence)
    ending = root.get("ending") or {}
    beat = ending.get("beat") if isinstance(ending, dict) and ending.get("included") else None
    if isinstance(beat, dict):
        units.append(beat)
    return [u for u in units if isinstance(u, dict) and u.get("conceptRef") == concept_id]


def validate_idea_instances(
    root: dict[str, Any],
    sequence: list[dict[str, Any]],
    concept_items: list[dict[str, Any]],
) -> None:
    # An idea is learned across instances: the question holds still and the
    # evidence changes. An idea shown on one case is a fact about that case, so
    # a named concept needs at least two beats that are instances of it, and at
    # least one of them has every child act on it. A history lesson on
    # continuity and change once held one pair of toy plates for nine slides;
    # the idea had no slot, so the plates became the learning.
    for concept in concept_items:
        concept_id = concept["id"]
        instances = idea_instances(root, sequence, concept_id)
        expect(
            len(instances) >= 2,
            f"concepts {concept_id} ({concept['name']}) is an idea, and an idea is met on more than one instance; "
            f"{len(instances)} unit(s) carry its conceptRef. Mark the beats that meet this idea on different evidence, "
            "or, if today's learning is a fact about one case, do not name a concept",
        )
        expect(
            any(u.get("kind") not in TEACHER_PRESENTS_KINDS for u in instances),
            f"concepts {concept_id} ({concept['name']}) is met only where the teacher acts; "
            "at least one instance must be a beat where every child uses the idea",
        )


# A discovery lesson may discover more than one thing (the teacher's decision,
# 23 September 2026): one exploration can reveal two findings, each taught and
# used in turn, or a second exploration can build on the first. Either way each
# finding is taught why and then used before the next is taught, which is the
# Teach then Do rhythm inside this route.
DISCOVERY_FIRST_FINDING = ["question", "explore", "make-sense", "teach-why", "use-learning"]
DISCOVERY_FINDING_FROM_THE_SAME_EXPLORATION = ["teach-why", "use-learning"]
DISCOVERY_FINDING_FROM_A_NEW_EXPLORATION = ["explore", "make-sense", "teach-why", "use-learning"]
DISCOVERY_SHAPE = (
    "question, explore, make-sense, teach-why, use-learning, then for each further "
    "finding either teach-why, use-learning (the same exploration showed it) or "
    "explore, make-sense, teach-why, use-learning (a second exploration), then finish"
)


def discovery_shape_is_valid(kinds: list[str]) -> bool:
    first = len(DISCOVERY_FIRST_FINDING)
    if kinds[:first] != DISCOVERY_FIRST_FINDING or len(kinds) <= first or kinds[-1] != "finish":
        return False
    rest = kinds[first:-1]
    index = 0
    while index < len(rest):
        if rest[index:index + 2] == DISCOVERY_FINDING_FROM_THE_SAME_EXPLORATION:
            index += 2
        elif rest[index:index + 4] == DISCOVERY_FINDING_FROM_A_NEW_EXPLORATION:
            index += 4
        else:
            return False
    return True


def validate_route_sequence(
    structure: str,
    sequence: list[dict[str, Any]],
    concept_items: list[dict[str, Any]],
) -> None:
    kinds = [unit["kind"] for unit in sequence]

    if structure == "Skill-based":
        # The class reads a deck by these three words, so a turn's label says
        # which turn it is and the slide title inherits it. A Codex design named
        # its turns by the move alone (`The thousands either side`, `Beyond
        # halfway`), the slide titles kept those names faithfully, and the deck
        # reached the teacher with no My Turn, Our Turn or Your Turn anywhere
        # (19 September 2026). `preferences.md` → Slide Headings already says
        # these labels are kept as-is in skill-based maths and English; nothing
        # made sure they were there to keep.
        turn_word = {"my-turn": "My Turn", "our-turn": "Our Turn", "your-turn": "Your Turn"}
        for index, unit in enumerate(sequence):
            word = turn_word.get(unit["kind"])
            if word is None:
                continue
            label = unit.get("label") or ""  # a missing label is caught by the unit checks
            if not label:
                continue  # a missing label is the unit checks' own fault to report
            if label == SCAFFOLD_PLACEHOLDER:
                # A scaffold's labels are placeholders by design, and the
                # placeholder scan reports an unfilled one. Reading this rule
                # against a skeleton refuses every scaffold ever built for a
                # skill lesson, for the one thing a skeleton cannot yet have.
                continue
            expect(
                label.lower().startswith(word.lower()),
                f"teachingSequence[{index}].label must begin with '{word}': children read a "
                "skill lesson by these three words, and the slide title is this label. In maths "
                f"the plain words are what the teacher wants ('{word}'); in other subjects name "
                f"the move after them ('{word} - Where does the comma go?')",
            )

        # A cycle is the unit of skill teaching: My Turn, an optional Our Turn,
        # then its own Your Turn, and it runs uninterrupted. The teacher: "The
        # your turns are good because they are a quick check of can we do this
        # before moving on to the next concept, even if its similar." A lesson
        # that models three times and practises once at the end leaves the
        # first move a demonstration away from independent work.
        #
        # Around the cycles the lesson belongs to the designer. Daniel, 12
        # September 2026: "i dont want to limit it to starter, answers, key
        # vocab, mtotyt cycles. If it thinks teach in a place do it, if it
        # thinks seperate key vocab do it. if it thinks apply now, or problem
        # solving now do it". So a preparation beat, a Teach beat for knowledge
        # the method needs but does not perform, and a Practise beat for the
        # reasoning or problem solving the objective earns may each sit between
        # cycles or after them, as many times as the lesson genuinely needs.
        free_kinds = {"prepare", "teach", "practise"}
        index = 0
        cycle_concepts: list[str] = []
        while index < len(sequence):
            kind = sequence[index]["kind"]
            if kind in free_kinds:
                index += 1
                continue
            expect(
                kind == "my-turn",
                (
                    f"Skill-based sequence has an out-of-place {kind} unit that no My Turn "
                    "opens. An Our Turn and a Your Turn belong to the cycle their My Turn "
                    "starts; independent work that stands on its own, a reasoning or problem "
                    "solving beat, is a practise unit "
                    "(teaching-sequence-skill-based.md, 'What else the sequence may hold')"
                ),
            )
            concept_id = sequence[index]["conceptRef"]
            index += 1
            expect(
                not (index < len(sequence) and sequence[index]["kind"] == "my-turn"),
                (
                    f"Skill-based concept {concept_id} has two My Turn units in a row. "
                    "Put every example of one modelled move inside that move's own My Turn "
                    "unit, and give a genuinely different move its own cycle with an Our Turn "
                    "and a Your Turn of its own, so each move is used before the next is "
                    "taught (teaching-sequence-skill-based.md, 'Several examples of one move "
                    "belong inside one My Turn unit')"
                ),
            )
            if index < len(sequence) and sequence[index]["kind"] == "our-turn":
                expect(
                    sequence[index]["conceptRef"] == concept_id,
                    f"Skill-based Our Turn must use {concept_id}",
                )
                index += 1
            # A second Our Turn used to fall through to the message below, which
            # told the designer there was no Your Turn when there was one straight
            # after it; four runs spent a retry on that (13 September 2026).
            expect(
                not (index < len(sequence) and sequence[index]["kind"] == "our-turn"),
                (
                    f"Skill-based concept {concept_id} has two Our Turn units in a row. "
                    "One Our Turn unit holds every guided example of the move, as many as "
                    "the concept's difficulty needs, so put them together in one unit "
                    "(teaching-sequence-skill-based.md, Our Turn: 'include several fresh "
                    "guided attempts rather than defaulting to one')"
                ),
            )
            expect(
                index < len(sequence) and sequence[index]["kind"] == "your-turn",
                (
                    f"Skill-based concept {concept_id} has a My Turn cycle with no Your Turn "
                    "after it. Every cycle runs uninterrupted and ends with its own "
                    "independent check before the next move is modelled, sized to that cycle: "
                    "a bridging cycle on small numbers earns two questions, not none. A Teach "
                    "or Practise beat goes between cycles rather than inside one "
                    "(teaching-sequence-skill-based.md, 'Every cycle ends with its own Your "
                    "Turn')"
                ),
            )
            expect(
                sequence[index]["conceptRef"] == concept_id,
                f"Skill-based Your Turn must use {concept_id}",
            )
            index += 1
            cycle_concepts.append(concept_id)

        # Every concept is taught, each one's cycles run together rather than
        # being returned to later, and they run in the order the design lists
        # them. A free beat between two of a concept's cycles does not break
        # the run: that is where the derived shortcut belongs.
        taught: list[str] = []
        for concept_id in cycle_concepts:
            if not taught or taught[-1] != concept_id:
                expect(
                    concept_id not in taught,
                    (
                        f"Skill-based sequence returns to {concept_id} after moving on to "
                        "another concept. Run a concept's cycles together, and use a practise "
                        "unit where the lesson comes back to mix concepts already taught "
                        "(subject-maths.md, 'Where one method runs across several cases')"
                    ),
                )
                taught.append(concept_id)
        declared = [concept["id"] for concept in concept_items]
        expect(
            taught == declared,
            (
                "Skill-based sequence must run at least one My Turn cycle for every concept, "
                f"in the order the design declares them. Declared: {declared}. "
                f"Taught in the sequence: {taught}"
            ),
        )
        return

    if structure == "Content-based":
        # The rhythm is fixed: every Teach is used at once, and an Observe
        # only ever sets up the Teach after it. Where the Practise sits is the
        # designer's: it used to be pinned to the very end, so a class that
        # was ready for its substantial work after two chunks (Year 4
        # history, 15 September 2026) sat through every remaining short beat
        # on the carpet first. A Practise may follow any complete pair, and
        # teaching the work earned continues as ordinary pairs after it.
        #
        # A Teach is used by the Do after it, or by the Practise after it.
        # The guidance says a sort or explanation that becomes substantial is
        # main practice in the same place, and requiring a separate Do first
        # made the designer add a token beat to satisfy the format. What is
        # kept on purpose is the preparation: before the first Practise the
        # class has used something it was taught in at least one short
        # Teach -> Do pair, so the main work is never the first time children
        # use the lesson's knowledge. Still refused: a lesson with no
        # Practise, a Practise before that first pair, and any beat outside a
        # pair.
        index = 0
        pairs_before_first_practise = 0
        practises = 0
        before_it = "Content-based Practise needs at least one Teach -> Do pair before it"
        while index < len(sequence):
            kind = sequence[index]["kind"]
            if kind == "practise":
                expect(pairs_before_first_practise >= 1, before_it)
                practises += 1
                index += 1
                continue
            if kind == "observe":
                index += 1
                expect(
                    index < len(sequence) and sequence[index]["kind"] == "teach",
                    "Content-based observe must be followed immediately by Teach",
                )
            expect(
                index < len(sequence) and sequence[index]["kind"] == "teach",
                "Content-based sequence must be built from Teach -> Do pairs",
            )
            index += 1
            expect(
                index < len(sequence) and sequence[index]["kind"] in {"do", "practise"},
                "Every Content-based Teach must be followed immediately by Do, "
                "or by the Practise that uses it",
            )
            if sequence[index]["kind"] == "practise":
                continue
            index += 1
            if practises == 0:
                pairs_before_first_practise += 1
        expect(
            pairs_before_first_practise >= 1,
            "Content-based sequence requires at least one Teach -> Do pair",
        )
        expect(
            practises >= 1,
            "Content-based sequence requires a Practise after at least one Teach -> Do pair",
        )
        return

    if structure == "Discovery":
        expect(discovery_shape_is_valid(kinds), f"Discovery sequence must be: {DISCOVERY_SHAPE}")
        return

    if structure == "Dialogic":
        index = 0
        if sequence and sequence[0]["kind"] == "grounding-input":
            index = 1
        cycles = 0
        while index < len(sequence) and sequence[index]["kind"] != "synthesise":
            if sequence[index]["kind"] == "stimulus-talk":
                index += 1
                cycles += 1
                continue
            expect(
                sequence[index]["kind"] == "stimulus",
                "Dialogic sequence requires Stimulus -> Talk pairs or a combined Stimulus + Talk beat",
            )
            stimulus_question = sequence[index]["content"]["question"]
            index += 1
            expect(
                index < len(sequence) and sequence[index]["kind"] == "talk",
                "Dialogic Stimulus must be followed immediately by Talk",
            )
            expect(
                sequence[index]["content"]["discussionQuestion"] == stimulus_question,
                "Dialogic Talk discussionQuestion must exactly match the preceding Stimulus question",
            )
            index += 1
            cycles += 1
        expect(cycles >= 1, "Dialogic sequence requires at least one discussion cycle")
        expect(
            index == len(sequence) - 1 and sequence[index]["kind"] == "synthesise",
            "Dialogic Synthesise must occur exactly once and last",
        )
        return

    if structure == "Task-Centred":
        index = 0
        expect(sequence[index]["kind"] == "set-task", "Task-Centred sequence must begin with Set the Task")
        index += 1
        while index < len(sequence) and sequence[index]["kind"] == "teach-needed":
            unit = sequence[index]
            index += 1
            if index < len(sequence) and sequence[index]["kind"] == "teach-needed":
                # Children use one enabling idea before the next distinct
                # idea arrives. The last teach-needed may be used by the
                # planning or the task itself; an earlier one carries its
                # own pupil use, or the two ideas are one block of telling.
                expect(
                    unit["pupilInstruction"] is not None,
                    f"teachingSequence[{index - 1}].pupilInstruction must be non-null: "
                    "children use this enabling idea before the next teach-needed unit arrives",
                )
        separate_plan = False
        if index < len(sequence) and sequence[index]["kind"] == "plan-checkpoint":
            separate_plan = True
            index += 1
        expect(
            index < len(sequence) and sequence[index]["kind"] == "do-task",
            "Task-Centred sequence requires Do the Task after any enabling input or separate plan checkpoint",
        )
        do_task = sequence[index]
        if separate_plan:
            expect(
                do_task["content"]["planWithinTask"] is None
                and do_task["content"]["checkpointQuestion"] is None,
                "Task-Centred separate plan-checkpoint cannot coexist with folded planWithinTask/checkpointQuestion",
            )
        index += 1
        if index < len(sequence) and sequence[index]["kind"] == "share-conclude":
            index += 1
        expect(index == len(sequence), "Task-Centred sequence has an extra or out-of-order unit")
        return

    raise ContractError(f"unsupported lesson structure: {structure}")


PHOTO_V2_FIELDS = {
    "id", "subject", "pedagogical_constraint", "teaching_requirement",
    "load_bearing_evidence", "use", "essential", "filename",
    "acquisition_mode", "source_profile", "fallback_action", "fallback_note",
    "generation_prompt", "coherent_group", "coherent_mode",
    "coherent_visual_invariants",
}
PHOTO_USES = {"slide", "worksheet", "both"}
PHOTO_ACQUISITION_MODES = {"authentic-real", "ordinary-real", "controlled-ai"}
PHOTO_SOURCE_PROFILES = {
    "unsplash-only", "wikimedia-only", "unsplash-then-wikimedia",
    "wikimedia-then-unsplash", "none",
}
PHOTO_FALLBACK_ACTIONS = {"ai", "omit", "unsatisfied"}
PHOTO_COHERENT_MODES = {"none", "all-real", "all-generated"}
PHOTO_PROMPT_FIELDS = {
    "physical_state", "must_avoid", "text_rule", "composition"
}


def _photo_nonempty(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _photo_filename_safe(value: Any) -> bool:
    if not _photo_nonempty(value) or "\\" in value or value.startswith("/"):
        return False
    parts = value.split("/")
    return all(part not in ("", ".", "..") for part in parts) and value == "/".join(parts)


def _photo_prompt_valid(prompt: Any) -> bool:
    if not isinstance(prompt, dict) or set(prompt) != PHOTO_PROMPT_FIELDS:
        return False
    return (
        _photo_nonempty(prompt.get("physical_state"))
        and isinstance(prompt.get("must_avoid"), list)
        and all(_photo_nonempty(value) for value in prompt["must_avoid"])
        and _photo_nonempty(prompt.get("text_rule"))
        and _photo_nonempty(prompt.get("composition"))
    )


def _photo_route(photo: dict[str, Any]) -> str:
    return "ai" if photo["acquisition_mode"] == "controlled-ai" else "real"


# The picture contract says what a picture must show. It has no field meaning
# "fetch this exact file", because fetching is the Image Scout's job and the
# scout searches by subject: Unsplash and Wikimedia, then Openverse, then - for
# a picture the lesson cannot do without - the holding institution's own page on
# the open web. A URL written into a picture object is therefore not an
# acquisition instruction. It is the reliable sign that the designer went
# hunting for image files instead of describing the evidence, which is both the
# slow way round and a promise nothing downstream can keep.
#
# A Year 4 history lesson (3 September 2026) did exactly that: it found five
# ideal archive photographs, could not express "fetch this file", wrote the
# source pages into `pedagogical_constraint` beside the sentence "the schema
# only permits Wikimedia/Unsplash routes", and shipped anyway. The teacher got a
# working wall and nothing else. Named as subjects rather than as links - "the
# Ford End School classroom around 1900, held by Essex Record Office" - the same
# five are now inside the scout's reach.
_PHOTO_URL_RE = re.compile(r"(?:\bhttps?://|\bwww\.\S)", re.IGNORECASE)

# Nothing in this package crops a delivered picture. A file arrives whole and
# every slide that names it shows all of it, so a contract that asks for several
# teaching moments in one file, gutters between them and a downstream reader to
# cut them apart is describing a stage that has never existed.
#
# A Year 4 place-value lesson (3 September 2026) asked for "three isolated
# landscape panels with generous crop-safe gutters" holding the My Turn's two
# numerals, the Our Turn's two and the Your Turn's four, and again for chart
# bodies "stacked vertically with a wide blank crop gutter ... so the slide
# designer can crop one panel without including either neighbour". The whole
# eight-chart sheet then landed on all four slides: a My Turn carrying eight
# questions including the ones the class had not reached, four consecutive
# slides rendering as one picture, and every chart a quarter of the size it
# would have had alone.
#
# The repair is one picture object per visual, which the schema already asks for
# and which costs no more image generations than the panels did. The word `crop`
# is not itself the fault - a coherent group holding two maps identical "in
# projection, crop, scale and palette" is naming the framing of the photograph,
# which is exactly right - so this matches the instruction to cut a file up, not
# the noun.
_PHOTO_CROP_RE = re.compile(
    r"crop[\s-]?(?:safe|ready)"
    r"|crop(?:ping)?[\s-](?:gutter|margin|line|guide)"
    r"|\b(?:can|to|then|must|should|may|will)\s+crop\b"
    r"|\bcrop\s+(?:one|each|every|apart|out)\b"
    r"|\bcut\s+(?:apart|out|into|along)\b",
    re.IGNORECASE,
)


def _photo_text_values(photo: dict[str, Any]):
    for field in ("subject", "pedagogical_constraint", "teaching_requirement", "fallback_note"):
        value = photo.get(field)
        if isinstance(value, str):
            yield field, value
    evidence = photo.get("load_bearing_evidence")
    if isinstance(evidence, list):
        for index, value in enumerate(evidence):
            if isinstance(value, str):
                yield f"load_bearing_evidence[{index}]", value
    prompt = photo.get("generation_prompt")
    if isinstance(prompt, dict):
        for key, value in prompt.items():
            if isinstance(value, str):
                yield f"generation_prompt.{key}", value
            elif isinstance(value, list):
                for index, item in enumerate(value):
                    if isinstance(item, str):
                        yield f"generation_prompt.{key}[{index}]", item


def validate_photo_contract_v2(
    photos: Any,
    *,
    initial_photo_namespace: bool = False,
    faults: FaultLog | RaiseAtOnce | None = None,
):
    """Validate the complete semantic picture contract, independently of routing."""
    log = faults if faults is not None else RaiseAtOnce()
    root = expect_dict(photos, "photo-requirements.json")
    expect_exact_keys(root, {"schema_version", "lesson_name", "photos"},
                      {"schema_version", "lesson_name", "photos"},
                      "photo-requirements.json")
    expect(type(root["schema_version"]) is int and root["schema_version"] == 2,
           "photo-requirements.json schema_version must be 2")
    expect_string(root["lesson_name"], "photo-requirements.json.lesson_name")
    items = root["photos"]
    expect(isinstance(items, list), "photo-requirements.json.photos must be a list")
    # 16 is the lesson designer's budget; the run may reach 24 once a helper,
    # a repair or an adaptation adds a picture the design could not foresee.
    # This validator also runs after those merges, so it enforces the run
    # ceiling and check-photo-cap.py holds the design budget at its own gate.
    if len(items) > 24:
        raise ContractError("photo-requirements.json may contain at most 24 photos")

    by_id: dict[str, dict] = {}
    by_filename: dict[str, dict] = {}
    groups: dict[str, list[dict]] = {}
    semantic_seen: dict[str, tuple[str, str]] = {}
    for index, photo in enumerate(items):
        path = f"photo-requirements.json.photos[{index}]"
        expect(isinstance(photo, dict), f"{path} must be an object")
        expect_exact_keys(photo, PHOTO_V2_FIELDS, PHOTO_V2_FIELDS, path)
        photo_id = photo["id"]
        expect(isinstance(photo_id, str) and re.fullmatch(r"(?:photo|adaptation-photo)-\d{3}", photo_id),
               f"{path}.id has invalid format")
        expect(photo_id not in by_id, f"duplicate photo id: {photo_id}")
        by_id[photo_id] = photo
        # Each brief is judged on its own. A designer writing a dozen pictures
        # can get two or three independently wrong, and naming one at a time
        # spends a repair pass per brief. The shape checks above stay outside
        # this: `by_id` is returned and every later check reads it, so a photo
        # whose id or keys are wrong still ends the pass where it happens.
        with log.section():
            expect(_photo_nonempty(photo["subject"]), f"{path}.subject must be non-empty")
            expect(isinstance(photo["pedagogical_constraint"], str), f"{path}.pedagogical_constraint must be a string")
            for field, value in _photo_text_values(photo):
                crop = _PHOTO_CROP_RE.search(value)
                if crop:
                    raise ContractError(
                        f"photo contract route error: {path}.{field} asks for the picture to be "
                        f"cropped or cut up ({crop.group(0)!r}). Nothing downstream crops a "
                        "delivered picture: the file arrives whole and every slide that names it "
                        "shows all of it, so panels drawn for three teaching moments put all three "
                        "on each of those slides - a later turn's questions on an earlier turn, its "
                        "answers in front of the class before they have worked, and every panel a "
                        "fraction of the size it would have had alone. Give each visual its own "
                        "photo object with its own filename, describing only what that one moment "
                        "shows. This costs the same number of images and each arrives at full size."
                    )
                if _PHOTO_URL_RE.search(value):
                    raise ContractError(
                        f"photo contract route error: {path}.{field} contains a web address. "
                        "Finding the file is the Image Scout's job and it searches by subject, so a "
                        "link here is a promise nothing downstream can keep. Say what the picture must "
                        "show instead, naming the institution that holds it where you know it - "
                        "\"the Ford End School classroom around 1900, held by Essex Record Office\" - "
                        "and the scout's ladder (Unsplash, Wikimedia, Openverse, then that institution's "
                        "own page) will reach it."
                    )
            expect(_photo_nonempty(photo["teaching_requirement"]), f"{path}.teaching_requirement must be non-empty")
            evidence = photo["load_bearing_evidence"]
            expect(isinstance(evidence, list) and evidence and all(_photo_nonempty(v) for v in evidence),
                   f"{path}.load_bearing_evidence must be a non-empty list of non-empty strings")
            expect(photo["use"] in PHOTO_USES, f"{path}.use must be one of {sorted(PHOTO_USES)}")
            expect(type(photo["essential"]) is bool, f"{path}.essential must be boolean")
            filename = photo["filename"]
            expect(_photo_filename_safe(filename), f"{path}.filename is unsafe")
            expect(filename not in by_filename, f"duplicate photo filename: {filename}")
            by_filename[filename] = photo
            acquisition = photo["acquisition_mode"]
            source = photo["source_profile"]
            fallback = photo["fallback_action"]
            coherent_mode = photo["coherent_mode"]
            expect(acquisition in PHOTO_ACQUISITION_MODES,
                   f"photo contract route error: {path}.acquisition_mode is invalid")
            expect(source in PHOTO_SOURCE_PROFILES,
                   f"photo contract route error: {path}.source_profile is invalid")
            expect(fallback in PHOTO_FALLBACK_ACTIONS,
                   f"photo contract route error: {path}.fallback_action is invalid")
            expect(coherent_mode in PHOTO_COHERENT_MODES,
                   f"photo contract coherence error: {path}.coherent_mode is invalid")
            note = photo["fallback_note"]
            expect(note is None or isinstance(note, str), f"{path}.fallback_note must be null or a string")
            prompt = photo["generation_prompt"]
            prompt_required = (acquisition == "controlled-ai" or fallback == "ai")
            if prompt_required:
                expect(_photo_prompt_valid(prompt),
                       f"photo contract route error: {path}.generation_prompt is incomplete")
            else:
                expect(prompt is None,
                       f"photo contract route error: {path}.generation_prompt must be null when AI is not authorised")
            group = photo["coherent_group"]
            invariants = photo["coherent_visual_invariants"]
            if group is None:
                expect(coherent_mode == "none" and invariants == [],
                       f"photo contract coherence error: {path} null group requires mode none and [] invariants")
            else:
                expect(_photo_nonempty(group), f"photo contract coherence error: {path}.coherent_group is invalid")
                expect(isinstance(invariants, list) and invariants and all(_photo_nonempty(v) for v in invariants),
                       f"photo contract coherence error: {path}.coherent_visual_invariants is invalid")
                groups.setdefault(group, []).append(photo)

            if acquisition == "authentic-real":
                expect(source != "none", f"photo contract route error: {path} authentic-real requires a real source profile")
                expect(fallback != "ai", f"photo contract route error: {path} authentic-real cannot fall back to AI")
                expect(prompt is None, f"photo contract route error: {path} authentic-real requires a null generation prompt")
                # authentic-real is the only route that can end a lesson with no
                # picture and no authorised substitute, so the reason has to be
                # written down rather than reached by default.
                expect(_photo_nonempty(note),
                       f"photo contract route error: {path} authentic-real requires a fallback_note saying why a "
                       f"faithful generated photograph would misteach; use ordinary-real when it would not")
            elif acquisition == "ordinary-real":
                expect(source != "none", f"photo contract route error: {path} ordinary-real requires a real source profile")
                if fallback == "ai":
                    expect(_photo_prompt_valid(prompt), f"photo contract route error: {path} ordinary-real AI fallback requires a complete generation prompt")
                else:
                    expect(prompt is None, f"photo contract route error: {path} ordinary-real without AI fallback requires a null generation prompt")
                # ordinary-real means authenticity is not load-bearing, so a
                # faithful generated photograph does the same teaching job.
                # Refusing that substitute is what leaves a picture undelivered.
                expect(fallback != "unsatisfied",
                       f"photo contract route error: {path} ordinary-real cannot use fallback_action unsatisfied; "
                       f"use ai, or omit when the picture is not essential")
                if photo["essential"] and fallback != "ai":
                    # An all-real set forbids the AI fallback this member needs, so
                    # the whole comparison can arrive empty. A matched generated set
                    # also gives the shared framing a comparison depends on.
                    expect(coherent_mode != "all-real",
                           f"photo contract coherence error: {path} an essential ordinary-real member of an all-real set "
                           f"has no way to be delivered; use all-generated with controlled-ai members, or authentic-real "
                           f"members when real origin is the evidence")
                    raise ContractError(
                        f"photo contract route error: {path} an essential ordinary-real picture requires fallback_action ai "
                        f"with a complete generation_prompt; use authentic-real only when a generated photograph would misteach")
            elif acquisition == "controlled-ai":
                expect(source == "none", f"photo contract route error: {path} controlled-ai requires source_profile none")
                expect(_photo_prompt_valid(prompt), f"photo contract route error: {path} controlled-ai requires a complete generation prompt")
                expect(fallback != "ai", f"photo contract route error: {path} controlled-ai cannot use fallback_action ai")

            semantic = {key: photo[key] for key in PHOTO_V2_FIELDS if key not in {"id", "filename"}}
            semantic_key = json.dumps(semantic, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            if semantic_key in semantic_seen:
                old_id, old_filename = semantic_seen[semantic_key]
                raise ContractError(f"duplicate exact photo contract: {old_id}/{old_filename} and {photo_id}/{filename}")
            semantic_seen[semantic_key] = (photo_id, filename)

    for group, members in groups.items():
        modes = {member["coherent_mode"] for member in members}
        invariant_values = {json.dumps(member["coherent_visual_invariants"], ensure_ascii=False) for member in members}
        expect(len(modes) == 1 and len(invariant_values) == 1,
               f"photo contract coherence error: group {group!r} members must have identical mode and invariants")
        mode = next(iter(modes))
        if mode == "all-real":
            expect(all(member["acquisition_mode"] != "controlled-ai" and member["fallback_action"] != "ai" for member in members),
                   f"photo contract coherence error: all-real group {group!r} cannot use controlled AI or AI fallback")
        if mode == "all-generated":
            expect(all(member["acquisition_mode"] == "controlled-ai" for member in members),
                   f"photo contract coherence error: all-generated group {group!r} requires controlled-ai members")
        expect(len(members) <= 4, f"photo contract coherence error: group {group!r} is larger than four")

    if initial_photo_namespace:
        # Adaptation ids under this flag are ambiguous from the file alone: either
        # a Phase 1 contract has been polluted, or a post-merge contract is being
        # validated with a flag that does not apply to it. Reporting the second as
        # "id must be exactly photo-001" reads as corrupt data and sends the caller
        # hunting a file that is perfectly correct, so name both readings and the
        # fact that separates them.
        merged = [photo["id"] for photo in items
                  if isinstance(photo.get("id"), str)
                  and photo["id"].startswith("adaptation-photo-")]
        if merged:
            raise ContractError(
                "photo-requirements.json carries adaptation photo ids "
                f"({', '.join(merged)}) while --initial-photo-namespace is set. "
                "One of two things is wrong. If this is the Phase 1 initial "
                "contract, those entries do not belong in it: adaptation photos "
                "are added later by photo-contract.py, from adaptation.md. If "
                "this is a provisional or promoted contract, the ids are right "
                "and the flag is not, because it applies only to the Phase 1 "
                "contract, where every id is photo-###."
            )
        for index, photo in enumerate(items, 1):
            expect(photo["id"] == f"photo-{index:03d}",
                   f"photo-requirements.json.photos[{index - 1}].id must be exactly photo-{index:03d}")

    return items, by_id


def write_on_evidence(unit: dict[str, Any]) -> str | None:
    """Why this source unit looks like a moment a child marks a figure on.

    None when nothing in the unit says so. The stick-in pedagogy's own test is
    whether the child writes onto a figure they could not redraw by hand; the
    two facts the contract records that point at it are a representation the
    pupil writes on and a sort children do with printed cards. A sort done from
    the board, placed on whiteboards or in books, prints nothing: treating it as
    evidence refused an honest `none` and launched a worker to find nothing
    (Year 4 history, 16 September 2026).
    """
    for ref in unit.get("representationRefs") or []:
        if isinstance(ref, dict) and ref.get("interaction") == "pupil-writes-on":
            return f"children write on {ref.get('ref')} (interaction pupil-writes-on)"
    if sort_handled_as_cards(unit):
        return "its sort is done with printed cards, which is a card kit"
    return None


def validate_resource_opportunities(
    raw: Any,
    units: list[dict[str, Any]],
) -> None:
    """The lesson's own record of which printed extras it might earn.

    The decision gates a whole model worker, so a `none` has to be one the
    lesson's own moments do not contradict: the validator refuses a stick-in
    `none` while any unit carries write-on evidence, and names the unit, so
    the skip can never be quieter than the lesson.
    """
    block = expect_dict(raw, "resourceOpportunities")
    expect_exact_keys(block, {"stickIn", "workingWall"}, {"stickIn", "workingWall"}, "resourceOpportunities")
    unit_ids = {unit["sourceUnitId"] for unit in units}
    for key in ("stickIn", "workingWall"):
        path = f"resourceOpportunities.{key}"
        entry = expect_dict(block[key], path)
        fields = {"decision", "sourceUnitIds", "reason"}
        expect_exact_keys(entry, fields, fields, path)
        decision = expect_string(entry["decision"], f"{path}.decision")
        expect(decision in RESOURCE_DECISIONS, f"{path}.decision invalid: {decision}")
        source_ids = validate_ref_list(entry["sourceUnitIds"], f"{path}.sourceUnitIds", unit_ids)
        reason = expect_string(entry["reason"], f"{path}.reason")
        if decision == "candidate":
            expect(bool(source_ids), f"{path}.decision candidate must name at least one sourceUnitId")
        elif decision == "none":
            expect(not source_ids, f"{path}.decision none must carry an empty sourceUnitIds list")
            expect(
                len(reason.split()) >= 4,
                f"{path}.reason must say in a sentence why the book alone carries this lesson",
            )
    stick_in = block["stickIn"]
    if stick_in["decision"] == "none":
        for unit in units:
            evidence = write_on_evidence(unit)
            expect(
                evidence is None,
                f"resourceOpportunities.stickIn.decision none is contradicted by "
                f"{unit['sourceUnitId']} ({unit['label']}): {evidence}; record candidate or uncertain",
            )


def validate_lesson_fits_the_slot(root: dict[str, Any]) -> None:
    """The beats have to add up to a lesson that fits the hour it is taught in.

    Each beat earns its place separately and nothing else pushes back, so an arc
    can be excellent beat by beat and still not fit. The teacher met exactly that
    on 18 September 2026, reading a finished Year 4 history deck: a card sort at
    tables after an already-big record task, with the worksheet still to come.

    The number is the designer's own, one per beat, because the point is the
    trade-off being made while the lesson is designed rather than discovered
    while it is taught. A lesson over the range is refused here, where cutting a
    beat is a paragraph, and not in the classroom, where it is the plenary.
    """
    # Only a complete time plan can be added up. A design carrying minutes on
    # some beats and not others is being written, or was written before the
    # field existed, and summing what is there would refuse a lesson for the
    # beats it has not timed yet.
    timed: list[tuple[str, int]] = []
    untimed = 0

    def take(label: str, unit: Any) -> None:
        nonlocal untimed
        minutes = unit.get("minutes") if isinstance(unit, dict) else None
        if isinstance(minutes, int) and not isinstance(minutes, bool):
            timed.append((unit.get("label") or label, minutes))
        else:
            untimed += 1

    starter = root.get("starter")
    if isinstance(starter, dict):
        take("the starter", starter)
    for unit in root.get("teachingSequence") or []:
        if isinstance(unit, dict):
            take(unit.get("sourceUnitId") or "a beat", unit)
    ending = root.get("ending") or {}
    beat = ending.get("beat") if isinstance(ending, dict) else None
    if isinstance(ending, dict) and ending.get("included") and isinstance(beat, dict):
        take("the ending", beat)
    if untimed or not timed:
        return
    beats = timed
    total = sum(minutes for _, minutes in beats)
    # Only the upper end is refused. A lesson runs from about 30 to 50 minutes
    # and aims at 45, and a short lesson is a real lesson: an assembly eats ten
    # minutes and the class still learns something. What cannot be taught is the
    # lesson that will not fit, so that is the end with teeth.
    if total <= LESSON_MINUTES_MAX:
        return
    longest = sorted(beats, key=lambda pair: pair[1], reverse=True)[:3]
    named = "; ".join(f"{label} {minutes}min" for label, minutes in longest)
    expect(
        False,
        f"the lesson's beats add up to {total} minutes, over the {LESSON_MINUTES_MAX} a lesson can "
        f"run to, and it aims at {LESSON_MINUTES_AIM}. The longest beats are: {named}. Cut a beat "
        "or take a cheaper form of one (a sort run as a class discussion rather than printed cards "
        "at tables); do not shave a minute off each, because the beats were honest and the lesson "
        "is too big",
    )


def validate_design(
    design: Any,
    photos: Any,
    *,
    initial_photo_namespace: bool = False,
) -> None:
    """Run every check, then report every fault the pass could reach.

    A fault inside a `faults.section()` is recorded and the pass carries on. A
    fault outside one ends the pass, because what follows it reads what it was
    checking - and it is still reported, alongside everything found before it.
    """
    faults = FaultLog()
    try:
        run_design_checks(
            design,
            photos,
            initial_photo_namespace=initial_photo_namespace,
            faults=faults,
        )
    except ContractError as exc:
        faults.add(str(exc))
    faults.raise_if_any()


def run_design_checks(
    design: Any,
    photos: Any,
    *,
    initial_photo_namespace: bool = False,
    faults: FaultLog,
) -> None:
    reject_unresolved_scaffold_placeholders(design, "lesson-design.json")
    reject_long_dashes(design, "lesson-design.json")
    reject_six_seven_numbers(design, "lesson-design.json")
    reject_unresolved_scaffold_placeholders(photos, "photo-requirements.json")

    root = expect_dict(design, "lesson-design.json")
    expect_exact_keys(
        root,
        TOP_LEVEL_FIELDS | OPTIONAL_TOP_LEVEL_FIELDS,
        TOP_LEVEL_FIELDS,
        "lesson-design.json",
    )
    expect(type(root["schemaVersion"]) is int and root["schemaVersion"] == 1, "schemaVersion must be integer 1")

    photo_items, photo_by_id = validate_photo_contract_v2(
        photos,
        initial_photo_namespace=initial_photo_namespace,
        faults=faults,
    )

    for prefix in ("photo-", "adaptation-photo-"):
        ordinals = sorted(
            int(photo_id[len(prefix):])
            for photo_id in photo_by_id
            if photo_id.startswith(prefix)
        )
        if ordinals:
            expect(
                ordinals == list(range(1, len(ordinals) + 1)),
                f"{prefix} IDs must be contiguous from 001 with no skipped or reused ordinal",
            )

    initial_photo_ids = {photo_id for photo_id in photo_by_id if photo_id.startswith("photo-")}

    lesson = expect_dict(root["lesson"], "lesson")
    lesson_fields = {
        "structure", "yearGroup", "subject", "lo", "displayedLo",
        "durationMinutes", "stickingPoint",
    }
    expect_exact_keys(lesson, lesson_fields, lesson_fields, "lesson")
    structure = expect_string(lesson["structure"], "lesson.structure")
    expect(structure in STRUCTURES, f"lesson.structure invalid: {structure}")
    expect(type(lesson["yearGroup"]) is int and 1 <= lesson["yearGroup"] <= 6,
           "lesson.yearGroup must be an integer from 1 to 6")
    for key in ("subject", "lo", "displayedLo", "stickingPoint"):
        expect_string(lesson[key], f"lesson.{key}")
    # The board objective is the teacher's objective in the teacher's words.
    # It may be cut short where enumerated detail, a method or a condition is
    # tacked on ("...: hours/minutes, minutes/seconds", "... using
    # partitioning"), and nothing else: a Year 4 geography deck once showed
    # `To describe and give examples of biomes, and locate and describe the
    # Amazon rainforest` for a plan that said `To describe and give examples
    # of a biome and find the location and some features of the Amazon
    # rainforest`. Every word had been re-chosen, and the class copied an
    # objective the school does not assess against.
    expect(
        displayed_lo_is_the_objective_or_its_opening(lesson["lo"], lesson["displayedLo"]),
        "lesson.displayedLo must be lesson.lo word for word, or its opening cut "
        "short at a colon, comma, bracket, dash or a trailing 'using / by / "
        "with / including / through' clause; it is never a rewording",
    )
    # Canonical subject naming, so every downstream label (filing folders,
    # subject-file routing) gets the teacher's own "Maths".
    #
    # This used to also refuse every photo-### requirement on a maths lesson.
    # The intent was right - a number line, bar model or place-value chart is
    # drawn by the engine, never photographed - but the rule was a subject-wide
    # ban on a whole mechanism, and it closed the one exit the run has when the
    # engine cannot draw something: the helper check's picture route ends in a
    # photo requirement, so a maths lesson that hit a drawing gap could neither
    # add the picture nor pass the gate. The teacher settled it on 1 September
    # 2026: maths can have photographs. What must not happen is photographing a
    # tool the engine draws, and that is not a subject rule and not something a
    # validator can see - it is the helper check's job, enforced for every
    # subject by the delivery check, and a judgement the designer and reviewer
    # hold.
    if lesson["subject"].casefold() in {"maths", "mathematics", "math"}:
        expect(
            lesson["subject"] == "Maths",
            f"lesson.subject must be exactly 'Maths', not '{lesson['subject']}' - "
            "synonyms route and validate differently and are not accepted",
        )
    expect_positive_int(lesson["durationMinutes"], "lesson.durationMinutes")

    orientation = expect_string(root["teacherOrientation"], "teacherOrientation")
    orientation_prefix = "Teacher orientation:"
    expect(orientation.startswith(orientation_prefix), "teacherOrientation must begin 'Teacher orientation:'")
    expect(
        orientation[len(orientation_prefix):].strip(),
        "teacherOrientation must contain orientation text after 'Teacher orientation:'",
    )

    rep_items, rep_by_id = collect_registry(
        root["representations"], "representations", "id", ID_PATTERNS["representation"]
    )
    for index, rep in enumerate(rep_items):
        path = f"representations[{index}]"
        fields = {"id", "name", "purpose", "configurations"}
        expect_exact_keys(rep, fields, fields, path)
        expect_string(rep["name"], f"{path}.name")
        expect_string(rep["purpose"], f"{path}.purpose")
        configs = expect_list(rep["configurations"], f"{path}.configurations")
        expect(bool(configs), f"{path}.configurations must not be empty")
        config_ids: set[str] = set()
        for i, raw_config in enumerate(configs):
            config_path = f"{path}.configurations[{i}]"
            config = expect_dict(raw_config, config_path)
            config_fields = {"id", "description", "loadBearing", "requiredFeatures"}
            expect_exact_keys(config, config_fields, config_fields, config_path)
            config_id = expect_string(config["id"], f"{config_path}.id")
            expect(re.fullmatch(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", config_id) is not None,
                   f"{config_path}.id must be lowercase kebab-case")
            expect(config_id not in config_ids, f"{path} duplicate configuration id: {config_id}")
            config_ids.add(config_id)
            expect_string(config["description"], f"{config_path}.description")
            load_bearing = expect_bool(config["loadBearing"], f"{config_path}.loadBearing")
            features = expect_list(config["requiredFeatures"], f"{config_path}.requiredFeatures")
            if load_bearing:
                expect(bool(features),
                       f"{config_path}.requiredFeatures must not be empty when loadBearing is true")
            # A supporting picture can still carry meaning in its form - the
            # highlighted space on an "interval" vocabulary line - and a
            # feature written only in the description reaches no check, so
            # supporting configurations may list features too.
            for feature_index, feature in enumerate(features):
                expect_string(feature, f"{config_path}.requiredFeatures[{feature_index}]")

    sc_items, sc_by_id = collect_registry(
        root["successCriteria"], "successCriteria", "id", ID_PATTERNS["successCriteria"]
    )
    for index, sc in enumerate(sc_items):
        path = f"successCriteria[{index}]"
        fields = {"id", "type", "drawLive", "content"}
        expect_exact_keys(sc, fields | {MARKED_TOO_LONG}, fields, path)
        sc_type = expect_string(sc["type"], f"{path}.type")
        expect(sc_type in SC_TYPES, f"{path}.type invalid: {sc_type}")
        expect_bool(sc["drawLive"], f"{path}.drawLive")
        if MARKED_TOO_LONG in sc:
            expect_bool(sc[MARKED_TOO_LONG], f"{path}.{MARKED_TOO_LONG}")
        content = expect_dict(sc["content"], f"{path}.content")
        if sc_type == "steps":
            expect_exact_keys(content, {"steps"}, {"steps"}, f"{path}.content")
            steps = expect_list(content["steps"], f"{path}.content.steps")
            expect(bool(steps), f"{path}.content.steps must not be empty")
            # Brevity is reviewed in the deterministic review packet. Word
            # and step counts cannot establish clarity or physical fit.
            for i, step in enumerate(steps):
                expect_string(step, f"{path}.content.steps[{i}]")
        elif sc_type == "reference-table":
            expect_exact_keys(content, {"columns", "rows"}, {"columns", "rows"}, f"{path}.content")
            columns = expect_list(content["columns"], f"{path}.content.columns")
            expect(bool(columns), f"{path}.content.columns must not be empty")
            for i, column in enumerate(columns):
                expect_string(column, f"{path}.content.columns[{i}]")
            rows = expect_list(content["rows"], f"{path}.content.rows")
            expect(bool(rows), f"{path}.content.rows must not be empty")
            for r_index, row in enumerate(rows):
                values = expect_list(row, f"{path}.content.rows[{r_index}]")
                expect(len(values) == len(columns), f"{path}.content.rows[{r_index}] must match column count")
                for c_index, value in enumerate(values):
                    expect_string(value, f"{path}.content.rows[{r_index}][{c_index}]")
        else:
            expect_exact_keys(content, {"items"}, {"items"}, f"{path}.content")
            items = expect_list(content["items"], f"{path}.content.items")
            expect(bool(items), f"{path}.content.items must not be empty")
            for i, raw_item in enumerate(items):
                item_path = f"{path}.content.items[{i}]"
                item = expect_dict(raw_item, item_path)
                fields = {"label", "text", "representationRef", "configuration"}
                expect_exact_keys(item, fields, fields, item_path)
                expect_string(item["label"], f"{item_path}.label")
                expect_string(item["text"], f"{item_path}.text")
                if item["representationRef"] is None:
                    expect(item["configuration"] is None, f"{item_path}.configuration must be null without representationRef")
                else:
                    rep_id = expect_string(item["representationRef"], f"{item_path}.representationRef")
                    expect(rep_id in rep_by_id, f"{item_path}.representationRef unknown: {rep_id}")
                    config = expect_string(item["configuration"], f"{item_path}.configuration")
                    expect(config in {c["id"] for c in rep_by_id[rep_id]["configurations"]},
                           f"{item_path}.configuration unknown for {rep_id}: {config}")

    for index, item in enumerate(sc_items):
        reject_bad_criteria_marks(item.get("content"), f"successCriteria[{index}].content")

    with faults.section():
        validate_criteria_fit_a_named_panel(sc_items)

    sticky_items, sticky_by_id = collect_registry(
        root["stickyKnowledge"], "stickyKnowledge", "id", ID_PATTERNS["stickyKnowledge"]
    )
    expect(len(sticky_items) <= 3, f"stickyKnowledge must contain at most 3 items (found {len(sticky_items)})")
    for index, item in enumerate(sticky_items):
        path = f"stickyKnowledge[{index}]"
        expect_exact_keys(item, {"id", "text"}, {"id", "text"}, path)
        expect_string(item["text"], f"{path}.text")

    misconception_items, misconception_by_id = collect_registry(
        root["misconceptions"], "misconceptions", "id", ID_PATTERNS["misconception"]
    )
    for index, item in enumerate(misconception_items):
        path = f"misconceptions[{index}]"
        fields = {"id", "belief", "correctiveFact", "strategy", "reason"}
        expect_exact_keys(item, fields, fields, path)
        expect_string(item["belief"], f"{path}.belief")
        expect_nullable_string(item["correctiveFact"], f"{path}.correctiveFact")
        expect_string(item["strategy"], f"{path}.strategy")
        expect_string(item["reason"], f"{path}.reason")

    concept_items, concept_by_id = collect_registry(
        root["concepts"], "concepts", "id", ID_PATTERNS["concept"]
    )
    for index, item in enumerate(concept_items):
        path = f"concepts[{index}]"
        fields = {"id", "name", "successCriteriaRefs"}
        expect_exact_keys(item, fields, fields, path)
        expect_string(item["name"], f"{path}.name")
        refs = validate_ref_list(
            item["successCriteriaRefs"], f"{path}.successCriteriaRefs", set(sc_by_id)
        )
        if structure == "Skill-based":
            expect(
                bool(refs),
                f"{path}.successCriteriaRefs must not be empty for a Skill-based concept",
            )
    if structure == "Skill-based":
        expect(bool(concept_items), "Skill-based lesson must define at least one concept")
    # Any other route may name the idea it teaches here. Whether it must is
    # the designer's and reviewer's judgement; what this file holds is that a
    # named idea is met on more than one instance (checked after the sequence).

    vocab_items, _ = collect_registry(
        root["vocabulary"], "vocabulary", "id", ID_PATTERNS["vocabulary"]
    )
    expect(len(vocab_items) <= 5, f"vocabulary must contain at most 5 items (found {len(vocab_items)})")
    for index, item in enumerate(vocab_items, 1):
        path = f"vocabulary[{index - 1}]"
        fields = {"id", "sourceUnitId", "term", "definition", "visual"}
        expect_exact_keys(item, fields, fields, path)
        validate_source_unit_id(item["sourceUnitId"], f"{path}.sourceUnitId", "vocabulary", index)
        expect_string(item["term"], f"{path}.term")
        expect_string(item["definition"], f"{path}.definition")
        validate_visual(item["visual"], f"{path}.visual", rep_by_id, initial_photo_ids)

    trimmed = expect_list(root["trimmedVocabulary"], "trimmedVocabulary")
    for index, raw_item in enumerate(trimmed):
        path = f"trimmedVocabulary[{index}]"
        item = expect_dict(raw_item, path)
        expect_exact_keys(item, {"term", "reason"}, {"term", "reason"}, path)
        expect_string(item["term"], f"{path}.term")
        expect_string(item["reason"], f"{path}.reason")

    starter = validate_source_unit(
        root["starter"],
        "starter",
        section="starter",
        ordinal=1,
        allowed_kinds={"starter"},
        rep_by_id=rep_by_id,
        sc_ids=set(sc_by_id),
        sticky_ids=set(sticky_by_id),
        misconception_ids=set(misconception_by_id),
        concept_ids=set(concept_by_id),
        photo_ids=initial_photo_ids,
    )
    expect(starter["conceptRef"] is None, "starter.conceptRef must be null")

    sequence = expect_list(root["teachingSequence"], "teachingSequence")
    expect(bool(sequence), "teachingSequence must not be empty")
    for index, raw_unit in enumerate(sequence, 1):
        path = f"teachingSequence[{index - 1}]"
        unit = validate_source_unit(
            raw_unit,
            path,
            section="teaching-sequence",
            ordinal=index,
            allowed_kinds=ROUTE_KINDS[structure],
            rep_by_id=rep_by_id,
            sc_ids=set(sc_by_id),
            sticky_ids=set(sticky_by_id),
            misconception_ids=set(misconception_by_id),
            concept_ids=set(concept_by_id),
            photo_ids=initial_photo_ids,
        )
        validate_launch_uses_the_taught_words(unit, path, sc_by_id)
        if structure == "Skill-based" and unit["kind"] in {"my-turn", "our-turn", "your-turn"}:
            concept_ref = unit["conceptRef"]
            expect(concept_ref is not None, f"{path}.conceptRef is required for {unit['kind']}")
            expected_sc = concept_by_id[concept_ref]["successCriteriaRefs"]
            expect(unit["successCriteriaRefs"] == expected_sc,
                   f"{path}.successCriteriaRefs must exactly match {concept_ref}.successCriteriaRefs")

    # A lesson whose every beat unlocks nothing has no spine. `null` is a real
    # answer for a beat that sits beside it (a vocabulary moment, a routine, a
    # safeguarding note, setup, the final performance), so the floor is one
    # beat, not a filled field everywhere. Whether the recorded links are any
    # good is the reviewer's judgement, not this file's.
    expect(
        any(unit["unlocks"] is not None for unit in sequence),
        "at least one teachingSequence unit must record what it unlocks; "
        "a sequence where every beat unlocks nothing has no dependency in it",
    )

    with faults.section():
        validate_route_sequence(structure, sequence, concept_items)
    with faults.section():
        validate_teach_says_it_once(sequence, sticky_by_id)
    with faults.section():
        validate_explanation_task_is_modelled(structure, sequence)
    with faults.section():
        validate_lesson_fits_the_slot(root)

    if structure != "Skill-based":
        with faults.section():
            validate_idea_instances(root, sequence, concept_items)

    starter_unit_id = (root.get("starter") or {}).get("sourceUnitId")
    sequence_ids = {unit["sourceUnitId"] for unit in sequence}
    anchor_ids = sequence_ids | ({starter_unit_id} if starter_unit_id else set())

    has_schedule = "vocabularyIntroductions" in root
    has_legacy = "vocabularyPlacement" in root and root["vocabularyPlacement"] is not None
    expect(
        not (has_schedule and has_legacy),
        "a design carries either vocabularyIntroductions or vocabularyPlacement, "
        "not both: they are two schedules for the same words and there is no "
        "safe way to guess which one you meant",
    )

    if has_schedule:
        introductions = expect_list(root["vocabularyIntroductions"], "vocabularyIntroductions")
        vocab_ids = [item["id"] for item in vocab_items]
        introduced: list[str] = []
        for index, raw in enumerate(introductions):
            path = f"vocabularyIntroductions[{index}]"
            entry = expect_dict(raw, path)
            expect_exact_keys(
                entry,
                VOCABULARY_INTRODUCTION_FIELDS,
                VOCABULARY_INTRODUCTION_FIELDS,
                path,
            )
            refs = expect_list(entry["vocabularyRefs"], f"{path}.vocabularyRefs")
            expect(
                bool(refs),
                f"{path}.vocabularyRefs must name at least one word: an introduction "
                "that introduces nothing is a slide with nothing on it",
            )
            for position, ref in enumerate(refs):
                ref = expect_string(ref, f"{path}.vocabularyRefs[{position}]")
                expect(
                    ref in vocab_ids,
                    f"{path}.vocabularyRefs[{position}] must name a vocabulary id: {ref}",
                )
                introduced.append(ref)
            after = expect_string(entry["after"], f"{path}.after")
            expect(
                after in anchor_ids,
                f"{path}.after must name the starter's or a teachingSequence "
                f"sourceUnitId: {after}",
            )
            script = expect_string(entry["script"], f"{path}.script")
            prefix = "Say to children:"
            expect(
                script.startswith(prefix),
                f"{path}.script must begin with 'Say to children:': the vocabulary "
                "slide is a teaching moment and the teacher needs the words for it",
            )
            expect(
                script[len(prefix):].strip(),
                f"{path}.script must contain words after 'Say to children:'",
            )

        duplicates = sorted({ref for ref in introduced if introduced.count(ref) > 1})
        expect(
            not duplicates,
            "each word is introduced once and then used; these are introduced "
            f"more than once: {', '.join(duplicates)}",
        )
        missing = [ref for ref in vocab_ids if ref not in introduced]
        expect(
            not missing,
            "every retained word needs a planned introduction, or it reaches the "
            f"class without ever being taught; these have none: {', '.join(missing)}",
        )
        # How many introductions a lesson has is the designer's decision: a word
        # met eight slides before it is used has stopped being a glance reference
        # by the time anyone glances, so a lesson may introduce words at several
        # moments (`preferences.md` -> Vocabulary). Nothing here caps the count.
        validate_vocabulary_is_used(
            introductions, vocab_items, sequence, faults, sc_by_id=sc_by_id, sticky_by_id=sticky_by_id, rep_by_id=rep_by_id,
        )

    if has_legacy:
        placement = expect_dict(root["vocabularyPlacement"], "vocabularyPlacement")
        expect_exact_keys(
            placement,
            VOCABULARY_PLACEMENT_FIELDS,
            VOCABULARY_PLACEMENT_FIELDS,
            "vocabularyPlacement",
        )
        after = expect_string(placement["after"], "vocabularyPlacement.after")
        expect(
            after in sequence_ids,
            f"vocabularyPlacement.after must name a teachingSequence sourceUnitId: {after}",
        )

    # `resourceOpportunities` below reads the ending, so both names are settled
    # before the section rather than inside it: a bad ending is a fault to
    # report, not a reason for the next check to throw on a missing name.
    ending = root.get("ending") if isinstance(root.get("ending"), dict) else {}
    included = bool(ending.get("included"))
    with faults.section():
        ending = expect_dict(root["ending"], "ending")
        expect_exact_keys(ending, {"included", "kind", "reason", "beat"}, {"included", "kind", "reason", "beat"}, "ending")
        included = expect_bool(ending["included"], "ending.included")
        expected_kind = "Reflect" if structure == "Dialogic" else "Apply"
        expect(ending["kind"] == expected_kind, f"ending.kind must be {expected_kind} for {structure}")
        expect_string(ending["reason"], "ending.reason")
        if included:
            validate_source_unit(
                ending["beat"],
                "ending.beat",
                section="reflect" if structure == "Dialogic" else "apply",
                ordinal=1,
                allowed_kinds={"reflect"} if structure == "Dialogic" else {"apply"},
                rep_by_id=rep_by_id,
                sc_ids=set(sc_by_id),
                sticky_ids=set(sticky_by_id),
                misconception_ids=set(misconception_by_id),
                concept_ids=set(concept_by_id),
                photo_ids=initial_photo_ids,
            )
        else:
            expect(ending["beat"] is None, "ending.beat must be null when ending.included is false")


    with faults.section():
        worksheet = expect_dict(root["worksheet"], "worksheet")
        worksheet_fields = {
            "status", "resourceMode", "use", "activityArchitecture", "sheetShape",
            "demand", "successCriteriaRefs", "stickyKnowledgeRefs", "fitPriority",
            "centralWriteOnVisualException", "contentBlocks", "answerKeyMode", "providedWorksheet",
        }
        expect_exact_keys(worksheet, worksheet_fields, worksheet_fields, "worksheet")
        status = expect_string(worksheet["status"], "worksheet.status")
        mode = expect_string(worksheet["resourceMode"], "worksheet.resourceMode")
        use = expect_string(worksheet["use"], "worksheet.use")
        answer_key_mode = expect_string(worksheet["answerKeyMode"], "worksheet.answerKeyMode")
        expect(status in WORKSHEET_STATUSES, f"worksheet.status invalid: {status}")
        expect(mode in WORKSHEET_RESOURCE_MODES, f"worksheet.resourceMode invalid: {mode}")
        expect(use in WORKSHEET_USES, f"worksheet.use invalid: {use}")
        expect(answer_key_mode in {"required", "not-applicable"}, f"worksheet.answerKeyMode invalid: {answer_key_mode}")
        validate_ref_list(worksheet["successCriteriaRefs"], "worksheet.successCriteriaRefs", set(sc_by_id))
        # The teacher, 23 September 2026: "I don't want any success criteria on
        # worksheets." They stay on the board, where children consult them.
        expect(worksheet["successCriteriaRefs"] == [],
               "worksheet.successCriteriaRefs must be []: success criteria stay on the "
               "board and are never printed on a worksheet")
        validate_ref_list(worksheet["stickyKnowledgeRefs"], "worksheet.stickyKnowledgeRefs", set(sticky_by_id))

        if status == "provided-by-teacher":
            expect(mode == "per-child", "provided-by-teacher worksheet must use resourceMode per-child")
            expect(worksheet["activityArchitecture"] is None, "provided-by-teacher worksheet must have activityArchitecture null")
            expect(worksheet["sheetShape"] is None, "provided-by-teacher worksheet must have sheetShape null")
            expect(worksheet["demand"] is None, "provided-by-teacher worksheet must have demand null")
            expect(worksheet["fitPriority"] is None, "provided-by-teacher worksheet must have fitPriority null")
            expect(worksheet["centralWriteOnVisualException"] is None,
                   "provided-by-teacher worksheet must have centralWriteOnVisualException null")
            expect(worksheet["contentBlocks"] == [], "provided-by-teacher worksheet must have contentBlocks []")
            expect(answer_key_mode == "not-applicable",
                   "provided-by-teacher worksheet must have answerKeyMode not-applicable")
            provided = expect_dict(worksheet["providedWorksheet"], "worksheet.providedWorksheet")
            fields = {"source", "skillMatch", "duplicateCheck", "notes"}
            expect_exact_keys(provided, fields, fields, "worksheet.providedWorksheet")
            expect_string(provided["source"], "worksheet.providedWorksheet.source")
            expect_string(provided["skillMatch"], "worksheet.providedWorksheet.skillMatch")
            expect_string(provided["duplicateCheck"], "worksheet.providedWorksheet.duplicateCheck")
            expect_string(provided["notes"], "worksheet.providedWorksheet.notes", allow_empty=True)
        else:
            if mode == "shared-frame":
                expect(use == "required-task-resource",
                       "worksheet.resourceMode shared-frame requires use required-task-resource")
                expect(worksheet["successCriteriaRefs"] == [],
                       "shared-frame worksheet.successCriteriaRefs must be []")
                expect(worksheet["stickyKnowledgeRefs"] == [],
                       "shared-frame worksheet.stickyKnowledgeRefs must be []")
            architecture = expect_dict(worksheet["activityArchitecture"], "worksheet.activityArchitecture")
            fields = {"coreActionAndEvidence", "amount", "variationAndBoundaryPlan", "organisation"}
            expect_exact_keys(architecture, fields, fields, "worksheet.activityArchitecture")
            for key in fields:
                expect_string(architecture[key], f"worksheet.activityArchitecture.{key}")
            shape = expect_dict(worksheet["sheetShape"], "worksheet.sheetShape")
            expect_exact_keys(shape, {"kind", "reason"}, {"kind", "reason"}, "worksheet.sheetShape")
            shape_kind = expect_string(shape["kind"], "worksheet.sheetShape.kind")
            expect(shape_kind in WORKSHEET_SHAPES, f"worksheet.sheetShape.kind invalid: {shape_kind}")
            expect_string(shape["reason"], "worksheet.sheetShape.reason")
            expect_string(worksheet["demand"], "worksheet.demand")
            fit = expect_dict(worksheet["fitPriority"], "worksheet.fitPriority")
            expect_exact_keys(fit, {"protected", "preAuthorisedRemoval"}, {"protected", "preAuthorisedRemoval"}, "worksheet.fitPriority")
            for key in ("protected", "preAuthorisedRemoval"):
                values = expect_list(fit[key], f"worksheet.fitPriority.{key}")
                for i, value in enumerate(values):
                    expect_string(value, f"worksheet.fitPriority.{key}[{i}]")
            exception = worksheet["centralWriteOnVisualException"]
            if exception is not None:
                exception = expect_dict(exception, "worksheet.centralWriteOnVisualException")
                expect_exact_keys(exception, {"visual", "reason"}, {"visual", "reason"}, "worksheet.centralWriteOnVisualException")
                expect_string(exception["visual"], "worksheet.centralWriteOnVisualException.visual")
                expect_string(exception["reason"], "worksheet.centralWriteOnVisualException.reason")
            expect(worksheet["providedWorksheet"] is None, "generated worksheet must have providedWorksheet null")
            blocks = expect_list(worksheet["contentBlocks"], "worksheet.contentBlocks")
            expect(bool(blocks), "generated worksheet must have at least one content block")
            block_ids: set[str] = set()
            has_answer = False
            for index, raw_block in enumerate(blocks):
                block_path = f"worksheet.contentBlocks[{index}]"
                block_id = validate_worksheet_content_block(
                    raw_block,
                    block_path,
                    rep_by_id=rep_by_id,
                    sticky_ids=set(sticky_by_id),
                    photo_ids=initial_photo_ids,
                )
                expect(block_id not in block_ids, f"duplicate worksheet content block id: {block_id}")
                block_ids.add(block_id)

                def scan_answers(node: Any) -> None:
                    nonlocal has_answer
                    if isinstance(node, dict):
                        if set(node) == {"kind", "content", "acceptanceCondition", "delivery"}:
                            if node["kind"] != "none":
                                has_answer = True
                        for value in node.values():
                            scan_answers(value)
                    elif isinstance(node, list):
                        for value in node:
                            scan_answers(value)
                scan_answers(raw_block)

            block_families = {
                "question-set" if raw_block["kind"] in {"question", "question-group"} else raw_block["kind"]
                for raw_block in blocks
            }
            if mode == "shared-frame":
                expect(shape_kind == "frame", "shared-frame worksheet.sheetShape.kind must be frame")
                expect(len(blocks) == 1, "shared-frame worksheet must contain exactly one top-level content block")
                expect(blocks[0]["kind"] == "frame", "shared-frame worksheet content block must be kind frame")
            elif shape_kind == "mixed":
                expect(len(block_families) >= 2,
                       "worksheet.sheetShape.kind mixed requires at least two content-block families; "
                       f"every content block here is {sorted(block_families)[0] if block_families else 'absent'}, "
                       "so set sheetShape.kind to that")
            else:
                expect(
                    block_families == {shape_kind},
                    f"worksheet.sheetShape.kind {shape_kind} does not match contentBlocks families {sorted(block_families)}",
                )

            if has_answer:
                expect(answer_key_mode == "required",
                       "worksheet.answerKeyMode must be required when any worksheet answer/model exists")
            elif answer_key_mode == "required":
                raise ContractError(
                    "worksheet.answerKeyMode is required but every worksheet answer kind is none"
                )

    with faults.section():
        if "resourceOpportunities" in root:
            validate_resource_opportunities(
                root["resourceOpportunities"],
                [starter, *sequence, *([ending["beat"]] if included else [])],
            )

    with faults.section():
        slide_notes = expect_list(root["slideDesignNotes"], "slideDesignNotes")
        for index, note in enumerate(slide_notes):
            expect_string(note, f"slideDesignNotes[{index}]")
        flags = expect_list(root["flagsForTeacher"], "flagsForTeacher")
        for index, flag in enumerate(flags):
            expect_string(flag, f"flagsForTeacher[{index}]")

        used_photo_ids: set[str] = set()

        def collect_photo_refs(node: Any) -> None:
            if isinstance(node, dict):
                if node.get("kind") == "photo" and isinstance(node.get("photoRef"), str):
                    used_photo_ids.add(node["photoRef"])
                if isinstance(node.get("photoRefs"), list):
                    for value in node["photoRefs"]:
                        if isinstance(value, str):
                            used_photo_ids.add(value)
                if node.get("kind") == "sticky" and isinstance(node.get("ref"), str):
                    pass
                for value in node.values():
                    collect_photo_refs(value)
            elif isinstance(node, list):
                for value in node:
                    collect_photo_refs(value)

        collect_photo_refs(root)
    with faults.section():
        if initial_photo_namespace:
            for photo_id in photo_by_id:
                if photo_id.startswith("photo-"):
                    expect(
                        photo_id in used_photo_ids,
                        f"initial photo requirement is not referenced by lesson-design.json: {photo_id}",
                    )


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    initial_photo_namespace = False
    if args and args[0] == "--initial-photo-namespace":
        initial_photo_namespace = True
        args = args[1:]

    if len(args) != 2:
        print(
            "Usage: python3 validate-lesson-design.py [--initial-photo-namespace] "
            "<lesson-design.json> <photo-requirements.json>",
            file=sys.stderr,
        )
        return 2

    try:
        design = json.loads(Path(args[0]).read_text(encoding="utf-8"))
        photos = json.loads(Path(args[1]).read_text(encoding="utf-8"))
        validate_design(
            design,
            photos,
            initial_photo_namespace=initial_photo_namespace,
        )
    except (OSError, json.JSONDecodeError, ContractError) as exc:
        print(f"LESSON_DESIGN_INVALID: {exc}", file=sys.stderr)
        return 1

    for note in criteria_marker_notes(design):
        print(f"LESSON_DESIGN_NOTE: {note}", file=sys.stderr)
    print("LESSON_DESIGN_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
