#!/usr/bin/env python3
"""Freeze the approved design, then keep the lesson voice editor to wording.

The lesson voice editor rewrites the words children see and hear after the
design review has approved the lesson. It may change how every one of those
strings is said; it may not change what the lesson decided. This check is
where that boundary lives, because a sentence in the editor's instructions can
be crowded out of a long run and a diff cannot:

- nothing is added, removed or restructured, and no value that is not a string
  changes, so the board keeps the pieces the lesson designer chose; the one
  exception is a success-criteria list, whose steps may be split or joined
  (a step holding two actions becomes two), because the steps are the method's
  wording rather than a piece, so a resized list is checked as one text;
- a string may change only if the class meets it: its old words are one of the
  strings the review packet's class view prints (`design-review-packet.py`,
  `class_view_blocks`), matched whole, so planning notes, ids, settings and
  teacher-only answers are outside the lane without a second list to keep in
  step;
- the words a drawing prints are quoted inside a representation's
  `requiredFeatures` among words that describe the drawing, so there only the
  quoted words may change: the view prints them (`On the drawing:`), and the
  description around them, which is the lesson designer's, stays as it was;
- the taught word itself and the lesson's own record (objective, subject,
  year) never change, although the class reads them;
- on each slide, no number is brought in and none leaves the slide altogether
  (a date can leave the script while the board keeps it; a 45 cannot become a
  54, and `two hours` cannot become `three hours`, though a number word may
  come or go as a plain count);
- on each slide, a taught word the class read on the board is still on the
  board, and one the teacher said is still said, except in a success-criteria
  step or a drawing's printed words, which may say the action instead when the
  taught word only names its result (`Add the digits:` for `Digit sum:`);
- no person or place is named that the approved lesson never mentioned;
- the photograph contract is byte-identical;
- a string the class never meets may change in one way only: where it holds a
  word-for-word copy of something the class does meet (the answer key's copy
  of a shown model, a teacher note quoting a slide's title), `carry` writes
  the new wording over the copy, so the two still match. A copy is followed
  whole, and also line by line and sentence by sentence, because an answer key
  often repeats a shown model without its last line to the class. Nothing else
  in it may move, and the editor never writes there by hand.

It is a floor, not the whole lane: a swapped pair of dates or a reversed
meaning in plain words passes it, and the editor's own instructions own those.

`snapshot` copies the approved state beside the canonical files and writes the
editor's map of what it owns (`voice-edit-view.md`, the approved lesson as the
class meets it); `check` compares against the snapshot. After the editor's one
retry, `settle` keeps every edit inside the lane and puts only the rest back:
each string at fault returns to its approved wording, a changed photograph
contract is put back, and a change of structure restores the approved files,
because only that cannot be undone string by string.

    check-voice-edit.py snapshot --working-dir W
    check-voice-edit.py carry --working-dir W
    check-voice-edit.py check --working-dir W
    check-voice-edit.py settle --working-dir W
    check-voice-edit.py restore --working-dir W

The Below and Greater Depth sheets are worded later, by the adaptation designer,
so the editor makes a second, short pass over `adaptation.md` before anything
reads it. There its lane is the words a child reads: an instruction (a
`- Pupil prompt` line and the lines set under it, lettered parts included) and
the help printed on the sheet (the child's own words inside a `- Support`
entry). Where the child's words sit beside a note to the worksheet designer
they are marked, in backticks (in a `Support` entry, quotation marks too), and
only the marked words may change. Every other line is byte-identical, no line
comes or goes, and an instruction keeps its numbers, its empty boxes and its
blanks. `adaptation-settle` leaves a receipt that `photo-contract.py
build-provisional` asks for, so a run cannot pass over this pass unnoticed.

    check-voice-edit.py adaptation-snapshot --working-dir W
    check-voice-edit.py adaptation-check --working-dir W
    check-voice-edit.py adaptation-settle --working-dir W

Standard library only.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
import shutil
import sys
from collections import Counter
from pathlib import Path

DESIGN = "lesson-design.json"
PHOTOS = "photo-requirements.json"
DECISIONS = "design-decisions.md"
VIEW = "voice-edit-view.md"
DESIGN_BEFORE = "lesson-design.before-voice.json"
PHOTOS_BEFORE = "photo-requirements.before-voice.json"
DECISIONS_BEFORE = "design-decisions.before-voice.md"
ADAPTATION = "adaptation.md"
ADAPTATION_BEFORE = "adaptation.before-voice.md"
ADAPTATION_VIEW = "adaptation-voice-view.md"
ADAPTATION_RECEIPT = Path("orchestration-receipts") / "adaptation-voice.json"
# A field of the adaptation designer's file whose words a child reads. The
# designer sometimes qualifies the name (`- Pupil prompt (the group's
# instruction):`), so the name is matched, not the whole label.
CHILD_FIELD = re.compile(r"^- (Pupil prompt|Support)\b[^:`]*:")
TICKED = re.compile(r"`[^`\n]+`")
TICKED_OR_QUOTED = re.compile(r"`[^`\n]+`|\"[^\"\n]+\"|“[^”\n]+”")
BLANK = re.compile(r"_{2,}")
ADAPTATION_LAUNCH = """
Launch the lesson voice editor with this message:

You are the lesson voice editor. Read your agent instructions at:
{root}/agents/lesson-voice-editor.md

This launch is your second pass: the adapted sheets.

PLUGIN_ROOT: {root}
PYTHON: {python}
WORKING_DIR: {work}

AUTHORITATIVE_INPUTS:
ADAPTATION_VOICE_VIEW: {work}/adaptation-voice-view.md
ADAPTATION_DESIGN: {work}/adaptation.md
LESSON_DESIGN: {work}/lesson-design.json (read only)

OWNED_OUTPUTS:
- {work}/adaptation.md (only the words the view prints as yours)
- {work}/adaptation-voice-edit.md

SUCCESS_CHECK:
{check}
Require: ADAPTATION_VOICE_OK

TERMINAL_STATE: COMPLETE
"""
REPORT_LIMIT = 12

# Read by the class, but not the editor's to reword: the word being taught, and
# the lesson's own record of what it is.
PROTECTED_KEYS = {"term"}
PROTECTED_TOP_LEVEL = {"lesson", "schemaVersion"}
SCRIPT_PREFIX = re.compile(r"^\s*Say to children:\s*")
TEACHER_SAYS = "Teacher says: "
NUMBER = re.compile(r"\d+(?:[.,:/]\d+)*")
THOUSANDS = re.compile(r"\b\d{1,3}(?:,\d{3})+\b")
WORD_VALUES = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7,
    "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13,
    "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18,
    "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60,
    "seventy": 70, "eighty": 80, "ninety": 90,
}
SCALES = {"hundred": 100, "thousand": 1000, "million": 1_000_000}
_TOKEN = "(?:" + "|".join([*WORD_VALUES, *SCALES]) + ")"
WORD_RUN = re.compile(
    r"\b(?:a\s+(?=(?:hundred|thousand|million)\b))?" + _TOKEN + r"(?:(?:\s+and\s+|[\s-]+)" + _TOKEN + r")*\b",
    re.IGNORECASE,
)
# Keys whose string value is a setting or an id however it reads, even when it
# happens to match words the class sees (`ending.kind` "Apply").
SETTING_KEYS = {"kind", "id", "delivery", "decision", "status", "type", "mode", "shape", "format", "role", "doMode"}
SETTING_SUFFIXES = ("Id", "Ids", "Ref", "Refs")

WHOLE = "whole"
STRING = "string"


class PacketUnavailable(Exception):
    pass


def load_packet():
    path = Path(__file__).with_name("design-review-packet.py")
    try:
        spec = importlib.util.spec_from_file_location("design_review_packet_for_voice", path)
        if not (spec and spec.loader):
            raise PacketUnavailable(f"cannot load {path.name}")
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
    except (OSError, SyntaxError, ImportError) as exc:
        raise PacketUnavailable(f"{path.name}: {exc}") from exc
    return module


def flatten(node: object, path: tuple, out: dict) -> None:
    if isinstance(node, dict):
        out[path + ("{}",)] = tuple(node.keys())
        for key, value in node.items():
            flatten(value, path + (key,), out)
        return
    if isinstance(node, list):
        out[path + ("[]",)] = len(node)
        for index, value in enumerate(node):
            flatten(value, path + (index,), out)
        return
    out[path] = node


def _flat(design: dict) -> dict:
    out: dict = {}
    flatten(design, (), out)
    return out


def show(path: tuple) -> str:
    text = DESIGN
    for part in path:
        if part in ("{}", "[]"):
            continue
        text += f"[{part}]" if isinstance(part, int) else f".{part}"
    return text


def leaf_key(path: tuple) -> str | None:
    for part in reversed(path):
        if isinstance(part, str) and part not in ("{}", "[]"):
            return part
    return None


def slide_of(path: tuple) -> tuple:
    """The unit a string reaches the class in: one slide, one worksheet block."""
    head = path[0] if path else ""
    if head in ("starter", "ending"):
        return (head,)
    if head in ("vocabulary", "vocabularyIntroductions"):
        return ("vocabulary",)
    if head == "worksheet" and len(path) > 2 and path[1] == "contentBlocks":
        return path[:3]
    return path[:2]


def plain(text: str) -> str:
    return SCRIPT_PREFIX.sub("", text).strip()


def class_forms(design: dict, packet) -> set[str]:
    """Every whole string the class view prints, plus the parts of the few it
    prints joined (a script after `Teacher says:`, a vocabulary card's
    definition after its term, a table's cells, a sort answer's two halves)."""
    forms: set[str] = set()
    for label, strings in packet.class_view_blocks(design):
        # A beat's label is its slide's title unless it is a slot name, so the
        # class reads it too.
        forms.add(plain(label))
        for text in strings:
            forms.add(plain(text))
            if text.startswith(TEACHER_SAYS):
                forms.add(plain(text[len(TEACHER_SAYS):]))
            # A vocabulary card prints `term: definition`, and a definition may
            # hold a semicolon of its own, so split on the term first.
            if ": " in text:
                forms.add(plain(text.split(": ", 1)[1]))
            for piece in re.split(r" \| |; ", text):
                forms.add(plain(piece))
                if ": " in piece:
                    left, right = piece.split(": ", 1)
                    forms.add(plain(left))
                    forms.add(plain(right))
    forms.discard("")
    return forms


def _ungrouped(text: str) -> str:
    return THOUSANDS.sub(lambda m: m.group(0).replace(",", ""), text)


def digits_in(text: str) -> Counter:
    return Counter(NUMBER.findall(_ungrouped(text)))


def _values(tokens: list[str]) -> list[int]:
    """The numbers one run of number words says: `eight hundred and sixty-five`
    is 865, `two three` is 2 and 3, and `and` joins only after a hundred."""
    found: list[int] = []
    total = current = 0
    started = False
    previous = None

    def close() -> None:
        nonlocal total, current, started
        if started:
            found.append(total + current)
        total = current = 0
        started = False

    for token in tokens:
        if token == "a":
            current, started, previous = 1, True, token
        elif token == "and":
            if previous not in SCALES:
                close()
            previous = token
        elif token in SCALES:
            if not started:
                current, started = 1, True
            if token == "hundred":
                current *= 100
            else:
                total, current = total + current * SCALES[token], 0
            previous = token
        else:
            value = WORD_VALUES[token]
            if started and previous in WORD_VALUES and (WORD_VALUES[previous] < 20 or value >= 10):
                close()
            current += value
            started, previous = True, token
    close()
    return found


def numbers_in(text: str, lone_one: bool = False) -> Counter:
    """Digits and number words alike, so `two` and `2`, or `five hundred` and
    `500`, are the same number. A lone `one` counts only when `lone_one` is set:
    it is far more often a pronoun (`which one`, `one of them`) than a count, so
    it may confirm a 1 is still there but never reads as a number brought in."""
    text = _ungrouped(text)
    counts: Counter = Counter()
    for match in WORD_RUN.finditer(text):
        tokens = re.split(r"[\s-]+", match.group(0).lower())
        if tokens == ["one"] and not lone_one:
            continue
        counts.update(str(value) for value in _values(tokens))
    counts.update(NUMBER.findall(WORD_RUN.sub(" ", text)))
    return counts


def term_pattern(term: str) -> re.Pattern:
    words = [re.escape(word) for word in term.split()]
    return re.compile(r"\b" + r"\s+".join(words), re.IGNORECASE)


NAME_WORD = re.compile(r"[A-Z][A-Za-z’'-]*")
NAME_RUN = re.compile(r"[A-Z][A-Za-z’'-]*(?: (?:of |the |de )?[A-Z][A-Za-z’'-]*)+")
SENTENCE_START = set("\n.!?:;\"“”‘’'([{—–-•*>")


def name_words(text: str, packet) -> set[str]:
    """Capitalised words that stand inside a sentence. A word capitalised for
    opening a sentence, a line or a quotation (`'Great, time to play!'`) is not
    read as a name, so a name that opens a sentence goes unchecked there."""
    words: set[str] = set()
    for match in NAME_WORD.finditer(text):
        before = text[: match.start()].rstrip(" \t")
        if not before or before[-1] in SENTENCE_START:
            continue
        word = match.group(0).strip("’'-")
        if word and word not in packet.NOT_A_NAME:
            words.add(word)
    return words


def name_runs(text: str, packet) -> set[str]:
    """Names of two or more capitalised words (`Sarah Gooder`, `Lord Ashley`),
    after dropping a leading word that is capitalised for opening a sentence."""
    runs: set[str] = set()
    skip = set(packet.NOT_A_NAME) | set(packet.SENTENCE_OPENERS)
    for match in NAME_RUN.finditer(text):
        words = match.group(0).split()
        # `That's` opens a sentence as `That` does, and a lone capital is an
        # option's letter (`That's A.`), never half of somebody's name.
        while words and (words[0] in skip or re.split("[’']", words[0])[0] in skip or not words[0][:1].isupper()):
            words = words[1:]
        if len([w for w in words if w[:1].isupper() and len(w.strip("’'-")) > 1]) >= 2:
            runs.add(" ".join(words).strip("’'-"))
    return runs


def is_drawing_feature(path: tuple) -> bool:
    """A representation's required feature, which may quote the words its
    drawing prints among words describing the drawing."""
    return (
        len(path) >= 6 and path[0] == "representations"
        and path[-2] == "requiredFeatures" and isinstance(path[-1], int)
    )


def is_criteria_step(path: tuple) -> bool:
    """One step of a success-criteria list."""
    return (
        len(path) == 5 and path[0] == "successCriteria"
        and path[2:4] == ("content", "steps") and isinstance(path[4], int)
    )


def criteria_steps(design: dict) -> dict[tuple, list]:
    out: dict[tuple, list] = {}
    for index, item in enumerate(design.get("successCriteria") or []):
        content = item.get("content") if isinstance(item, dict) else None
        steps = content.get("steps") if isinstance(content, dict) else None
        if isinstance(steps, list):
            out[("successCriteria", index, "content", "steps")] = steps
    return out


def resized_steps(baseline: dict, current: dict) -> list[tuple]:
    """Success-criteria lists whose number of steps changed. The editor may
    split a step that holds two actions, or join two that are one."""
    before, after = criteria_steps(baseline), criteria_steps(current)
    return sorted(
        (path for path in before if path in after and len(before[path]) != len(after[path])),
        key=show,
    )


def drawing_print(packet, feature: str) -> list[str]:
    return packet._load_design_validator().diagram_print(feature)


def reading(packet, path: tuple, value: str) -> str:
    """What the class reads of a string: all of it, or of a drawing's feature
    only the words the drawing prints."""
    if is_drawing_feature(path):
        return "\n".join(drawing_print(packet, value))
    return value


def is_setting(path: tuple) -> bool:
    key = leaf_key(path) or ""
    return key in SETTING_KEYS or key.endswith(SETTING_SUFFIXES)


CARRY_MIN_WORDS = 3


def class_paths(base: dict, forms: set[str], packet) -> set[tuple]:
    """The paths whose approved words the class meets."""
    return {
        path for path, value in base.items()
        if isinstance(value, str) and not is_setting(path) and (
            plain(value) in forms
            or (is_drawing_feature(path) and drawing_print(packet, value)
                and all(text in forms for text in drawing_print(packet, value)))
        )
    }


def carry_pairs(base: dict, curr: dict, child_facing: set[tuple]) -> list[tuple[str, str]]:
    """Each reworded string the class meets, as (approved, new), longest first.

    Only whole strings of a few words or more are carried: a one-word label
    (`Starter`) would match ordinary prose it was never a copy of.
    """
    pairs: set[tuple[str, str]] = set()
    for p in child_facing:
        if not isinstance(curr.get(p), str) or base[p] == curr[p] or is_drawing_feature(p) or not curr[p].strip():
            continue
        for old, new in [(base[p].strip(), curr[p].strip()), *reworded_parts(base[p], curr[p])]:
            if len(old.split()) >= CARRY_MIN_WORDS and new:
                pairs.add((old, new))
    return sorted(pairs, key=lambda pair: (-len(pair[0]), pair))


SENTENCE_END = re.compile(r"(?<=[.!?])\s+")


def reworded_parts(old: str, new: str) -> list[tuple[str, str]]:
    """The lines, and inside them the sentences, that a rewording changed.

    A copy the class never meets is often not the whole string: an answer key
    repeats a shown model without the model's last line to the class (`(Your
    points will be different...)`), so the whole never matched and the key kept
    the old wording while the board moved on. Lines pair up only when the
    rewording kept their number, and sentences likewise, so a part is never
    guessed at.
    """
    parts: list[tuple[str, str]] = []
    old_lines, new_lines = old.split("\n"), new.split("\n")
    if len(old_lines) != len(new_lines):
        return parts
    for old_line, new_line in zip(old_lines, new_lines):
        old_line, new_line = old_line.strip(), new_line.strip()
        if old_line == new_line:
            continue
        parts.append((old_line, new_line))
        old_said, new_said = SENTENCE_END.split(old_line), SENTENCE_END.split(new_line)
        if len(old_said) == len(new_said) > 1:
            parts += [(a, b) for a, b in zip(old_said, new_said) if a != b]
    return parts


def carried(text: str, pairs: list[tuple[str, str]]) -> str:
    """`text` with every word-for-word copy of a reworded string brought up to date."""
    out, cursor = [], 0
    spans: list[tuple[int, int, str]] = []
    for old, new in pairs:
        for match in re.finditer(r"(?<![A-Za-z0-9])" + re.escape(old) + r"(?![A-Za-z0-9])", text):
            if all(match.end() <= start or match.start() >= end for start, end, _n in spans):
                spans.append((match.start(), match.end(), new))
    for start, end, new in sorted(spans):
        out.append(text[cursor:start])
        out.append(new)
        cursor = end
    out.append(text[cursor:])
    return "".join(out)


def may_carry(path: tuple) -> bool:
    return not (is_setting(path) or path[0] in PROTECTED_TOP_LEVEL or leaf_key(path) in PROTECTED_KEYS)


class Fault:
    def __init__(self, scope: str, where: tuple, message: str) -> None:
        self.scope = scope
        self.where = where
        self.message = message

    def __str__(self) -> str:
        return self.message


def find_faults(baseline: dict, current: dict, packet) -> list[Fault]:
    base = _flat(baseline)
    curr = _flat(current)
    faults: list[Fault] = []
    forms = class_forms(baseline, packet)
    resized = resized_steps(baseline, current)
    for steps_path in resized:
        base = {p: v for p, v in base.items() if p[:len(steps_path)] != steps_path}
        curr = {p: v for p, v in curr.items() if p[:len(steps_path)] != steps_path}
    view_text = "\n".join("\n".join(strings) for _l, strings in packet.class_view_blocks(baseline))

    for path in sorted(set(curr) - set(base), key=show):
        faults.append(Fault(WHOLE, path, f"{show(path)} was added - the editor rewords, it never adds a piece"))
    for path in sorted(set(base) - set(curr), key=show):
        faults.append(Fault(WHOLE, path, f"{show(path)} was removed - the editor rewords, it never removes a piece"))

    child_facing = class_paths(base, forms, packet)
    pairs = carry_pairs(base, curr, child_facing)
    frame = packet._load_design_validator().diagram_print_frame
    reworded: list[tuple] = []
    for path in sorted((p for p in set(base) & set(curr) if base[p] != curr[p]), key=show):
        old, new = base[path], curr[path]
        where = show(path)
        if path and path[-1] in ("{}", "[]"):
            faults.append(Fault(WHOLE, path, f"{where} changed shape - the editor rewords, it never restructures"))
        elif not (isinstance(old, str) and isinstance(new, str)):
            faults.append(Fault(STRING, path, f"{where} changed a value that is not wording ({old!r} to {new!r})"))
        elif path[0] in PROTECTED_TOP_LEVEL or leaf_key(path) in PROTECTED_KEYS:
            faults.append(Fault(STRING, path, f"{where} is the lesson's own record or the taught word itself, never reworded"))
        elif is_setting(path):
            faults.append(Fault(STRING, path, f"{where} is a setting or an id, never wording - outside the editor's lane"))
        elif path not in child_facing and may_carry(path) and new == carried(old, pairs):
            # A word-for-word copy of something the class meets, brought up to
            # date with it by `carry`: the two still say the same thing.
            continue
        elif path not in child_facing:
            faults.append(Fault(
                STRING, path,
                f"{where} is not words the class sees or hears (a planning note, a setting, an id or a "
                "teacher-only answer) - outside the editor's lane",
            ))
        elif is_drawing_feature(path) and (
            frame(old) != frame(new) or not drawing_print(packet, new)
        ):
            faults.append(Fault(
                STRING, path,
                f"{where} changed the description around the words the drawing prints - reword only the "
                "words inside the quotation marks, and keep each one quoted",
            ))
        else:
            reworded.append(path)

    if any(f.scope == WHOLE for f in faults):
        return faults

    # A resized criteria list is judged as one text: every step must be
    # wording the class met, and no number or name may come, go or swap.
    before_steps, after_steps = criteria_steps(baseline), criteria_steps(current)
    lesson_words = set(re.findall(r"\b[A-Z][A-Za-z’'-]*", " ".join(v for v in base.values() if isinstance(v, str))))
    for steps_path in resized:
        old_steps, new_steps = before_steps[steps_path], after_steps[steps_path]
        where = show(steps_path)
        if not all(isinstance(step, str) and step.strip() for step in new_steps):
            faults.append(Fault(STRING, steps_path, f"{where} holds a step that is not wording"))
            continue
        if not all(isinstance(step, str) and plain(step) in forms for step in old_steps):
            faults.append(Fault(STRING, steps_path, f"{where} is not words the class sees - outside the editor's lane"))
            continue
        old_text, new_text = "\n".join(old_steps), "\n".join(new_steps)
        brought = sorted(set(digits_in(new_text)) - set(numbers_in(old_text, lone_one=True)))
        gone = sorted(set(digits_in(old_text)) - set(numbers_in(new_text, lone_one=True)))
        was, now = numbers_in(old_text), numbers_in(new_text)
        fewer = sorted(n for n in was if now[n] < was[n])
        more = sorted(n for n in now if now[n] > was[n])
        invented = sorted(
            run for run in name_runs(new_text, packet) - name_runs(old_text, packet)
            if not all(word in lesson_words for word in run.split() if word[:1].isupper())
        )
        if brought or gone or (fewer and more):
            faults.append(Fault(
                STRING, steps_path,
                f"{where} changed its numbers ({sorted(set(brought) | set(gone) | set(fewer) | set(more))}) "
                "while splitting or joining steps - numbers carry the lesson's decisions; keep each one",
            ))
        elif invented:
            faults.append(Fault(
                STRING, steps_path,
                f"{where} names {invented}, whom the approved lesson never named - keep each one as it is",
            ))

    def slide_text(flat: dict, slide: tuple, spoken: bool | None = None) -> str:
        return "\n".join(
            reading(packet, p, flat[p]) for p in sorted(child_facing, key=show)
            if slide_of(p) == slide and isinstance(flat.get(p), str)
            and (spoken is None or (leaf_key(p) == "script") == spoken)
        )

    terms = [row.get("term") for row in baseline.get("vocabulary") or [] if isinstance(row, dict)]
    terms = [term for term in terms if isinstance(term, str) and term.strip()]
    # Generous on purpose: any capitalised word anywhere in the approved design
    # counts as a name the lesson uses, so only a person or place the lesson
    # never mentioned is refused.
    lesson_names = set(re.findall(r"\b[A-Z][A-Za-z’'-]*"," ".join(v for v in base.values() if isinstance(v, str))))

    # Each rule is judged over a whole slide but answered string by string, so
    # `settle` puts back only the strings at fault and keeps the rest.
    for slide in sorted({slide_of(p) for p in reworded}, key=show):
        paths = [p for p in reworded if slide_of(p) == slide]
        before_numbers = numbers_in(slide_text(base, slide), lone_one=True)
        after_numbers = numbers_in(slide_text(curr, slide), lone_one=True)
        for path in paths:
            old, new = reading(packet, path, base[path]), reading(packet, path, curr[path])
            brought = sorted(set(digits_in(new)) - set(numbers_in(old, lone_one=True)) - set(before_numbers))
            if brought:
                faults.append(Fault(
                    STRING, path,
                    f"{show(path)} brings in {brought}, which the approved lesson never showed the class on "
                    "that slide - numbers carry the lesson's decisions; keep each one as it is",
                ))
            # A number may come or go as a plain count (`the three comparisons`,
            # `these two answers`), but one said less often while another is
            # said more often is a swap (`two hours` to `three hours`, `1837 to
            # 1901` to `1837 to 1603`), whatever else the sentence still holds.
            was, now = numbers_in(old), numbers_in(new)
            fewer = sorted(n for n in was if now[n] < was[n])
            more = sorted(n for n in now if now[n] > was[n])
            if fewer and more:
                faults.append(Fault(
                    STRING, path,
                    f"{show(path)} swaps {fewer} for {more} - numbers carry the lesson's decisions; "
                    "keep each one as it is",
                ))
            gone = sorted(set(digits_in(old)) - set(numbers_in(new, lone_one=True)) - set(after_numbers))
            if gone:
                faults.append(Fault(
                    STRING, path,
                    f"{show(path)} drops {gone}, which no longer reach the class anywhere on that slide - "
                    "keep every number the lesson shows",
                ))
            # A new person, place or event of two or more words the lesson never
            # mentioned, or one name put where another stood. A single everyday
            # capitalised word (`help Mum`, `watch TV`) is not refused.
            invented = sorted(
                run for run in name_runs(new, packet) - name_runs(old, packet)
                if not all(word in lesson_names for word in run.split() if word[:1].isupper())
            )
            renamed_out = name_words(old, packet) - name_words(new, packet)
            renamed_in = name_words(new, packet) - name_words(old, packet) - lesson_names
            if renamed_out and renamed_in:
                invented += sorted(renamed_in)
            if invented:
                faults.append(Fault(
                    STRING, path,
                    f"{show(path)} names {invented}, whom the approved lesson never named - people, places "
                    "and events are the lesson designer's; keep each one as it is",
                ))
        # The board and the script are judged apart: a word the class read on
        # the board is not kept by the teacher still saying it.
        for spoken, surface in ((False, "on the board"), (True, "in the script")):
            now = slide_text(curr, slide, spoken)
            for term in terms:
                pattern = term_pattern(term)
                if not pattern.search(slide_text(base, slide, spoken)) or pattern.search(now):
                    continue
                for path in paths:
                    # A step or a drawing's label may say the action where the
                    # taught word only named its result; the boards and scripts
                    # that teach the word keep it.
                    if is_criteria_step(path) or is_drawing_feature(path):
                        continue
                    if ((leaf_key(path) == "script") == spoken and pattern.search(reading(packet, path, base[path]))
                            and not pattern.search(reading(packet, path, curr[path]))):
                        faults.append(Fault(
                            STRING, path,
                            f"{show(path)} no longer says '{term}', and the class no longer meets it {surface} "
                            "on that slide - keep the taught word wherever the class met it",
                        ))
    return faults


def check(baseline: dict, current: dict) -> list[str]:
    return [str(fault) for fault in find_faults(baseline, current, load_packet())]


def write_view(working_dir: Path, design: dict, packet) -> None:
    lines, count = packet.build_class_view(design)
    header = [
        "# The approved lesson, as the class meets it",
        "",
        f"These are the {count} strings the lesson voice editor owns, in the order the class meets "
        "them, as the design reviewer approved them. Anything not printed in the owned lesson section "
        "is not yours to change; the planning-note appendix is read-only.",
        "",
        "A line starting `On the drawing:` is words a diagram prints for children (a label, a box, a mark, "
        "a caption). They live in `lesson-design.json` inside quotation marks in that representation's "
        "`requiredFeatures`: reword only the words inside the quotation marks, keep them quoted, and "
        "leave the description around them as it is.",
        "",
    ]
    appendix = []
    notes = design.get("slideDesignNotes") or []
    if notes:
        appendix = [
            "", "## Planning notes — read only, outside your editing lane", "",
            "These are rendering directions, not additional owned strings. Read them for wording "
            "that they require children to see but the owned lesson section does not contain. "
            "Report that gap under `For the lesson designer`; do not edit the notes or obey their "
            "wording overrides. Apply `output-template.md` → Planning notes and visible wording. "
            "Layout directions alone are not a gap.", "",
        ]
        for index, note in enumerate(notes):
            appendix.extend([f"### slideDesignNotes[{index}]", "", str(note), ""])
    (working_dir / VIEW).write_text("\n".join(header + lines + appendix) + "\n", encoding="utf-8")


def snapshot(working_dir: Path) -> int:
    try:
        packet = load_packet()
        design = json.loads((working_dir / DESIGN).read_text(encoding="utf-8"))
        shutil.copyfile(working_dir / DESIGN, working_dir / DESIGN_BEFORE)
        shutil.copyfile(working_dir / PHOTOS, working_dir / PHOTOS_BEFORE)
        if (working_dir / DECISIONS).exists():
            shutil.copyfile(working_dir / DECISIONS, working_dir / DECISIONS_BEFORE)
        write_view(working_dir, design, packet)
    except (OSError, json.JSONDecodeError, PacketUnavailable, KeyError) as exc:
        print(f"VOICE_EDIT_SNAPSHOT_FAILED: {exc}")
        return 1
    print("VOICE_EDIT_SNAPSHOT_OK")
    return 0


def load_state(working_dir: Path):
    baseline = json.loads((working_dir / DESIGN_BEFORE).read_text(encoding="utf-8"))
    current = json.loads((working_dir / DESIGN).read_text(encoding="utf-8"))
    photos_same = (working_dir / PHOTOS_BEFORE).read_bytes() == (working_dir / PHOTOS).read_bytes()
    return baseline, current, photos_same


def reworded_count(baseline: dict, current: dict) -> int:
    base, curr = _flat(baseline), _flat(current)
    return sum(1 for p in set(base) & set(curr) if base[p] != curr[p])


def run_check(working_dir: Path) -> int:
    try:
        packet = load_packet()
        baseline, current, photos_same = load_state(working_dir)
    except (OSError, json.JSONDecodeError, PacketUnavailable) as exc:
        print(f"VOICE_EDIT_CHECK_ERROR: {exc}")
        return 2
    faults = [str(f) for f in find_faults(baseline, current, packet)]
    if not photos_same:
        faults.append(f"{PHOTOS} changed - the photograph contract is settled before the voice edit")
    if faults:
        shown = faults[:REPORT_LIMIT]
        rest = len(faults) - len(shown)
        print("VOICE_EDIT_VIOLATION: " + "; ".join(shown) + (f"; and {rest} more" if rest else ""))
        return 1
    print(f"VOICE_EDIT_OK: {reworded_count(baseline, current)} strings reworded")
    return 0


def carry(working_dir: Path) -> int:
    """Bring each word-for-word copy the class never meets up to date."""
    try:
        packet = load_packet()
        baseline, current, _photos = load_state(working_dir)
    except (OSError, json.JSONDecodeError, PacketUnavailable) as exc:
        print(f"VOICE_EDIT_CHECK_ERROR: {exc}")
        return 2
    base, curr = _flat(baseline), _flat(current)
    child_facing = class_paths(base, class_forms(baseline, packet), packet)
    pairs = carry_pairs(base, curr, child_facing)
    whole = dict(pairs)
    moved: list[tuple] = []
    for path in sorted(base, key=show):
        old = base[path]
        if (not isinstance(old, str) or curr.get(path) != old
                or (path and path[-1] in ("{}", "[]")) or not may_carry(path)):
            continue
        if path in child_facing:
            # Words the class meets are the editor's own to judge, so only an
            # untouched string identical to one it reworded follows (the same
            # model in the answer key, the same question in its check).
            new = whole.get(old.strip(), old)
        else:
            new = carried(old, pairs)
        if new != old:
            set_at(current, path, new)
            moved.append(path)
    if moved:
        (working_dir / DESIGN).write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    names = ", ".join(show(p) for p in moved[:REPORT_LIMIT])
    print(f"VOICE_EDIT_CARRIED: {len(moved)} copies brought up to date" + (f" ({names})" if names else ""))
    return 0


def set_at(node: object, path: tuple, value: object) -> None:
    for part in path[:-1]:
        node = node[part]  # type: ignore[index]
    node[path[-1]] = value  # type: ignore[index]


def with_twins(put_back: list[tuple], base: dict, curr: dict) -> list[tuple]:
    """Strings the design wrote identically stay identical: a question put back
    on the board takes its reworded copy in the check back with it, and so
    does a teacher-only string that carried a copy of it."""
    changed = [p for p in base if p in curr and base[p] != curr[p] and isinstance(base[p], str)]
    def copied(p: tuple, q: tuple) -> bool:
        olds = [base[p].strip()]
        if isinstance(base[p], str) and isinstance(curr.get(p), str):
            olds += [old for old, _new in reworded_parts(base[p], curr[p])]
        return any(len(old.split()) >= CARRY_MIN_WORDS and old in base[q] for old in olds)

    twins = [
        q for p in put_back for q in changed
        if q != p and isinstance(base[p], str) and (base[q] == base[p] or copied(p, q))
    ]
    return sorted(set(put_back) | set(twins), key=show)


def restore_all(working_dir: Path) -> None:
    shutil.copyfile(working_dir / DESIGN_BEFORE, working_dir / DESIGN)
    shutil.copyfile(working_dir / PHOTOS_BEFORE, working_dir / PHOTOS)
    if (working_dir / DECISIONS_BEFORE).exists():
        shutil.copyfile(working_dir / DECISIONS_BEFORE, working_dir / DECISIONS)


def settle(working_dir: Path) -> int:
    try:
        packet = load_packet()
        baseline, current, photos_same = load_state(working_dir)
    except (OSError, json.JSONDecodeError, PacketUnavailable) as exc:
        try:
            restore_all(working_dir)
        except OSError as restore_exc:
            print(f"VOICE_EDIT_CHECK_ERROR: {exc}; restoring also failed: {restore_exc}")
            return 2
        print(f"VOICE_EDIT_RESTORED: the approved files are back ({exc})")
        return 0
    faults = find_faults(baseline, current, packet)
    if any(f.scope == WHOLE for f in faults):
        restore_all(working_dir)
        reason = next(str(f) for f in faults if f.scope == WHOLE)
        print(f"VOICE_EDIT_RESTORED: the approved files are back ({reason})")
        return 0
    if not photos_same:
        shutil.copyfile(working_dir / PHOTOS_BEFORE, working_dir / PHOTOS)
    base, curr = _flat(baseline), _flat(current)
    put_back: list[tuple] = []
    for fault in faults:
        if fault.scope == STRING:
            put_back.append(fault.where)
    lists_back = [path for path in put_back if path in criteria_steps(baseline)]
    put_back = with_twins([path for path in put_back if path not in lists_back], base, curr) + lists_back
    for path in sorted(set(put_back), key=show):
        set_at(current, path, list(criteria_steps(baseline)[path]) if path in lists_back else base[path])
    (working_dir / DESIGN).write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # The walk-through may tell what was put back (a person the lesson never
    # named, a board line out of lane), so when anything goes back it returns to
    # its approved text: it then says less than the lesson's new wording, never
    # more than the reviewer saw.
    decisions_back = bool(put_back) and (working_dir / DECISIONS_BEFORE).exists()
    if decisions_back:
        shutil.copyfile(working_dir / DECISIONS_BEFORE, working_dir / DECISIONS)
    remaining = find_faults(baseline, current, packet)
    if remaining:
        restore_all(working_dir)
        print(f"VOICE_EDIT_RESTORED: the approved files are back ({remaining[0]})")
        return 0
    kept = reworded_count(baseline, current)
    note = ("" if photos_same else f"; {PHOTOS} put back") + (f"; {DECISIONS} back to its approved text" if decisions_back else "")
    names = ", ".join(show(p) for p in sorted(set(put_back), key=show)[:REPORT_LIMIT])
    print(
        f"VOICE_EDIT_SETTLED: {kept} strings reworded kept, {len(set(put_back))} put back to the approved "
        f"wording{note}" + (f" ({names})" if names else "")
    )
    return 0


def _adaptation_lines(path: Path) -> list[str]:
    with path.open(encoding="utf-8", newline="") as handle:
        return handle.read().splitlines(keepends=True)


def _heading(text: str) -> tuple[int, str] | None:
    """A level, question or part heading: `## Below`, `### Question 1`,
    `#### Part (a)`, or the bold line the designer sometimes writes instead
    (`**Question 1** (one instruction, two lettered parts)`)."""
    if text.startswith("#"):
        marks = len(text) - len(text.lstrip("#"))
        return marks, text[marks:].strip()
    if text.startswith("**") and text.count("**") >= 2:
        return 3, text.replace("**", "").strip()
    return None


def adaptation_blocks(lines: list[str]) -> list[dict]:
    """Each instruction and each entry of printed help, with every line set
    under it. An entry runs on over its indented lines, which is where the
    designer puts a second printed line and the lettered parts."""
    blocks: list[dict] = []
    level = question = part = ""
    index = 0
    while index < len(lines):
        text = lines[index].strip()
        heading = _heading(text)
        if heading:
            marks, title = heading
            if marks <= 2:
                level, question, part = title, "", ""
            elif marks == 3:
                question, part = title, ""
            else:
                part = title
        field = CHILD_FIELD.match(lines[index])
        if not field:
            index += 1
            continue
        end = index + 1
        while end < len(lines) and lines[end][:1] in (" ", "\t") and lines[end].strip():
            end += 1
        blocks.append({
            "kind": "prompt" if field.group(1) == "Pupil prompt" else "support",
            "start": index, "end": end, "label": field.group(0),
            "where": " - ".join(piece for piece in (level, question, part) if piece),
        })
        index = end
    return blocks


def adaptation_lane(lines: list[str]) -> dict[int, tuple[dict, re.Pattern | None]]:
    """The lines the editor may change, each with its block and how much of it
    is the child's: a pattern when only the marked words are, `None` when the
    whole line is.

    An instruction written plainly is the child's words throughout. Once any
    line of it carries backticks, the designer is marking the child's words
    apart from a note to the worksheet designer (`Options:`, `then, on the line
    below it,`), so only what is marked may change. Printed help is always a
    mixture, so there only marked words are the child's.
    """
    lane: dict[int, tuple[dict, re.Pattern | None]] = {}
    for block in adaptation_blocks(lines):
        span = range(block["start"], block["end"])
        if block["kind"] == "support":
            lane.update({i: (block, TICKED_OR_QUOTED) for i in span if TICKED_OR_QUOTED.search(lines[i])})
            continue
        marked = any("`" in lines[i] for i in span)
        for i in span:
            if "`" in lines[i]:
                lane[i] = (block, TICKED)
            elif not marked:
                lane[i] = (block, None)
    return lane


def _frame(line: str, block: dict, first: bool, marks: re.Pattern | None) -> str:
    """What must not move on a line the editor may change."""
    if marks is not None:
        return marks.sub("\0", line)
    stripped = line.rstrip("\r\n")
    ending = line[len(stripped):]
    if first and not line.startswith(block["label"]):
        return line
    lead = block["label"] if first else stripped[: len(stripped) - len(stripped.lstrip())]
    return lead + "\0" + ending


def _block_text(lines: list[str], block: dict) -> str:
    return "".join(lines[block["start"]:block["end"]])


def _write_adaptation_receipt(working_dir: Path, state: str, snapshot_sha: str | None = None) -> None:
    """What `photo-contract.py build-provisional` asks for before it goes on."""
    path = working_dir / ADAPTATION_RECEIPT
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({
        "schemaVersion": 1,
        "state": state,
        "adaptationSha256": hashlib.sha256((working_dir / ADAPTATION).read_bytes()).hexdigest(),
        "snapshotSha256": snapshot_sha,
    }, indent=2) + "\n", encoding="utf-8")


def adaptation_snapshot(working_dir: Path) -> int:
    try:
        lines = _adaptation_lines(working_dir / ADAPTATION)
        shutil.copyfile(working_dir / ADAPTATION, working_dir / ADAPTATION_BEFORE)
    except OSError as exc:
        print(f"ADAPTATION_VOICE_SNAPSHOT_FAILED: {exc}")
        return 1
    view = [
        "# The adapted sheets, as a child reads them",
        "",
        "Every instruction in `adaptation.md` and every piece of help printed on a sheet, under its level "
        "and question, each line as the file has it. An instruction is printed whole: its own line, any "
        "second line, and its lettered parts.",
        "",
        "What is yours to reword:",
        "- under `Instruction`, every line, when no line of it carries backticks;",
        "- under `Instruction (the child's words are inside backticks)`, only the words inside the backticks. "
        "The words around them are the adaptation designer's notes to the worksheet designer;",
        "- under `Help on the sheet`, only the words inside backticks or quotation marks;",
        "- under `Help on the sheet (to read, not to change)`, nothing. It is there so you know what the "
        "child has in front of them. If its words would not reach this child, say so in your report.",
        "",
        "Keep every mark, every `___` blank and every empty box where it is. A `\\n` inside an instruction is "
        "a line break on the printed sheet: keep it written that way.",
        "",
    ]
    lane = adaptation_lane(lines)
    prompts = helps = 0
    for block in adaptation_blocks(lines):
        span = range(block["start"], block["end"])
        body = [lines[block["start"]].strip()[len(block["label"]):].strip()]
        body += [lines[i].strip() for i in span[1:]]
        body = [text for text in body if text]
        owned = [i for i in span if i in lane]
        if block["kind"] == "prompt":
            prompts += 1
            marked = any(lane[i][1] is not None for i in owned)
            title = "Instruction (the child's words are inside backticks)" if marked else "Instruction"
        elif owned:
            helps += 1
            title = "Help on the sheet"
        elif not body or re.match(r"none\b", body[0], re.IGNORECASE):
            continue
        else:
            title = "Help on the sheet (to read, not to change)"
        view += [f"### {block['where']}" if block["where"] else "###", f"{title}:"]
        view += [f"> {text}" for text in body] + [""]
    (working_dir / ADAPTATION_VIEW).write_text("\n".join(view), encoding="utf-8")
    print(f"ADAPTATION_VOICE_SNAPSHOT_OK: {prompts} pupil prompts, {helps} pieces of printed help")
    if not prompts and not helps:
        _write_adaptation_receipt(working_dir, "nothing-to-read")
        print("ADAPTATION_VOICE_SKIP: no pupil prompts to read, so launch nothing")
        return 0
    # The launch is printed rather than kept in the playbook: the paths are
    # already known here, and the playbook has no room for a second copy.
    root = Path(__file__).resolve().parent.parent.as_posix()
    work = working_dir.resolve().as_posix()
    check = f'"{Path(sys.executable).as_posix()}" "{root}/scripts/check-voice-edit.py" adaptation-check --working-dir "{work}"'
    print(ADAPTATION_LAUNCH.format(root=root, python=Path(sys.executable).as_posix(), work=work, check=check))
    return 0


def adaptation_faults(before: list[str], after: list[str]) -> tuple[bool, dict[int, str]]:
    """Whether the file changed shape, and the fault on each line outside the lane."""
    if len(before) != len(after):
        return True, {}
    lane = adaptation_lane(before)
    faults: dict[int, str] = {}
    for index, (old, new) in enumerate(zip(before, after)):
        if old == new:
            continue
        where = f"line {index + 1}"
        if index not in lane:
            faults[index] = (
                f"{where} is not words a child reads: only a pupil prompt, the lines set under it and the "
                "marked words of the printed help may be reworded"
            )
            continue
        block, marks = lane[index]
        first = index == block["start"]
        # A number may be said again or move to another line of the same
        # instruction (`Jonah's 2-digit number`); it may not arrive, leave the
        # instruction or change places with another.
        was, now = numbers_in(old), numbers_in(new)
        brought = set(digits_in(new)) - set(numbers_in(old, lone_one=True)) - set(numbers_in(_block_text(before, block), lone_one=True))
        gone = set(digits_in(old)) - set(numbers_in(new, lone_one=True)) - set(numbers_in(_block_text(after, block), lone_one=True))
        swapped = any(now[n] < was[n] for n in was) and any(now[n] > was[n] for n in now)
        if _frame(old, block, first, marks) != _frame(new, block, first, marks):
            faults[index] = (
                f"{where}: only the child's own words may change, and here they are the words inside the "
                "marks - keep each mark and the note around it" if marks is not None
                else f"{where}: the label or the indent in front of the child's words changed"
            )
        elif first and marks is None and old.strip()[len(block["label"]):].strip() and not new.strip()[len(block["label"]):].strip():
            faults[index] = f"{where}: the pupil prompt is empty"
        elif brought or gone or swapped:
            faults[index] = f"{where}: the prompt's numbers changed"
        elif old.count("□") != new.count("□") or len(BLANK.findall(old)) != len(BLANK.findall(new)):
            faults[index] = f"{where}: an empty box or a blank came or went"
    return False, faults


def adaptation_check(working_dir: Path, settle_it: bool) -> int:
    snapshot_sha = None
    try:
        after = _adaptation_lines(working_dir / ADAPTATION)
        before_path = working_dir / ADAPTATION_BEFORE
        if settle_it:
            # A snapshot is settled once. After that the adaptation designer may
            # run again, and settling its new file against the old snapshot
            # would put its repairs back as if they were the editor's.
            snapshot_sha = hashlib.sha256(before_path.read_bytes()).hexdigest() if before_path.exists() else None
            current_sha = hashlib.sha256((working_dir / ADAPTATION).read_bytes()).hexdigest()
            receipt: object = None
            try:
                receipt = json.loads((working_dir / ADAPTATION_RECEIPT).read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                pass
            spent = (
                isinstance(receipt, dict) and snapshot_sha is not None
                and receipt.get("snapshotSha256") == snapshot_sha
            )
            if spent and receipt.get("adaptationSha256") == current_sha:
                print("ADAPTATION_VOICE_SETTLED: already settled, nothing to do")
                return 0
            if snapshot_sha is None or spent:
                _write_adaptation_receipt(working_dir, "not-read", snapshot_sha)
                print(
                    "ADAPTATION_VOICE_NOT_READ: no fresh snapshot of this adaptation.md, so nothing was compared "
                    "and nothing changed. Say in the teacher report that the voice editor did not read the "
                    "easier and harder sheets."
                )
                return 0
        before = _adaptation_lines(before_path)
    except OSError as exc:
        print(f"ADAPTATION_VOICE_CHECK_ERROR: {exc}")
        return 2
    reshaped, faults = adaptation_faults(before, after)
    if settle_it and reshaped:
        shutil.copyfile(working_dir / ADAPTATION_BEFORE, working_dir / ADAPTATION)
        _write_adaptation_receipt(working_dir, "restored", snapshot_sha)
        print("ADAPTATION_VOICE_RESTORED: the adaptation designer's file is back (a line came or went)")
        return 0
    if settle_it:
        for index in faults:
            after[index] = before[index]
        with (working_dir / ADAPTATION).open("w", encoding="utf-8", newline="") as handle:
            handle.write("".join(after))
    kept = sum(1 for old, new in zip(before, after) if old != new)
    if settle_it:
        _write_adaptation_receipt(working_dir, "settled", snapshot_sha)
        print(f"ADAPTATION_VOICE_SETTLED: {kept} lines reworded kept, {len(faults)} lines put back")
        return 0
    if reshaped or faults:
        shown = ["a line came or went"] if reshaped else list(faults.values())[:REPORT_LIMIT]
        print("ADAPTATION_VOICE_VIOLATION: " + "; ".join(shown))
        return 1
    print(f"ADAPTATION_VOICE_OK: {kept} lines reworded")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=(
        "snapshot", "carry", "check", "settle", "restore",
        "adaptation-snapshot", "adaptation-check", "adaptation-settle",
    ))
    parser.add_argument("--working-dir", type=Path, required=True)
    args = parser.parse_args(argv)
    if args.command == "adaptation-snapshot":
        return adaptation_snapshot(args.working_dir)
    if args.command in ("adaptation-check", "adaptation-settle"):
        return adaptation_check(args.working_dir, settle_it=args.command == "adaptation-settle")
    if args.command == "snapshot":
        return snapshot(args.working_dir)
    if args.command == "restore":
        try:
            restore_all(args.working_dir)
        except OSError as exc:
            print(f"VOICE_EDIT_CHECK_ERROR: {exc}")
            return 2
        print("VOICE_EDIT_RESTORED: the approved files are back")
        return 0
    if args.command == "settle":
        return settle(args.working_dir)
    if args.command == "carry":
        return carry(args.working_dir)
    return run_check(args.working_dir)


if __name__ == "__main__":
    import utf8_output
    utf8_output.enable()
    raise SystemExit(main())
