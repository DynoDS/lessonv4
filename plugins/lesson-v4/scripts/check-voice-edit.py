#!/usr/bin/env python3
"""Freeze the approved design, then keep the lesson voice editor to wording.

The lesson voice editor rewrites the words children see and hear after the
design review has approved the lesson. It may change how every one of those
strings is said; it may not change what the lesson decided. This check is
where that boundary lives, because a sentence in the editor's instructions can
be crowded out of a long run and a diff cannot:

- nothing is added, removed or restructured, and no value that is not a string
  changes, so the board keeps the pieces the lesson designer chose;
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
  board, and one the teacher said is still said;
- no person or place is named that the approved lesson never mentioned;
- the photograph contract is byte-identical.

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
    check-voice-edit.py check --working-dir W
    check-voice-edit.py settle --working-dir W
    check-voice-edit.py restore --working-dir W

Standard library only.
"""
from __future__ import annotations

import argparse
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
SETTING_KEYS = {"kind", "id", "delivery", "decision", "status", "type", "mode", "shape", "format", "role"}
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
        while words and (words[0] in skip or not words[0][:1].isupper()):
            words = words[1:]
        if len([w for w in words if w[:1].isupper()]) >= 2:
            runs.add(" ".join(words).strip("’'-"))
    return runs


def is_drawing_feature(path: tuple) -> bool:
    """A representation's required feature, which may quote the words its
    drawing prints among words describing the drawing."""
    return (
        len(path) >= 6 and path[0] == "representations"
        and path[-2] == "requiredFeatures" and isinstance(path[-1], int)
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
    view_text = "\n".join("\n".join(strings) for _l, strings in packet.class_view_blocks(baseline))

    for path in sorted(set(curr) - set(base), key=show):
        faults.append(Fault(WHOLE, path, f"{show(path)} was added - the editor rewords, it never adds a piece"))
    for path in sorted(set(base) - set(curr), key=show):
        faults.append(Fault(WHOLE, path, f"{show(path)} was removed - the editor rewords, it never removes a piece"))

    child_facing = {
        path for path, value in base.items()
        if isinstance(value, str) and not is_setting(path) and (
            plain(value) in forms
            or (is_drawing_feature(path) and drawing_print(packet, value)
                and all(text in forms for text in drawing_print(packet, value)))
        )
    }
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
        "them, as the design reviewer approved them. Anything not printed here is not yours to change.",
        "",
        "A line starting `On the drawing:` is words a diagram prints for children (a label, a box, a mark, "
        "a caption). They live in `lesson-design.json` inside quotation marks in that representation's "
        "`requiredFeatures`: reword only the words inside the quotation marks, keep them quoted, and "
        "leave the description around them as it is.",
        "",
    ]
    (working_dir / VIEW).write_text("\n".join(header + lines) + "\n", encoding="utf-8")


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


def set_at(node: object, path: tuple, value: object) -> None:
    for part in path[:-1]:
        node = node[part]  # type: ignore[index]
    node[path[-1]] = value  # type: ignore[index]


def with_twins(put_back: list[tuple], base: dict, curr: dict) -> list[tuple]:
    """Strings the design wrote identically stay identical: a question put back
    on the board takes its reworded copy in the check back with it."""
    changed = [p for p in base if p in curr and base[p] != curr[p] and isinstance(base[p], str)]
    twins = [q for p in put_back for q in changed if q != p and base[q] == base[p]]
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
    put_back = with_twins(put_back, base, curr)
    for path in sorted(set(put_back), key=show):
        set_at(current, path, base[path])
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


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("snapshot", "check", "settle", "restore"))
    parser.add_argument("--working-dir", type=Path, required=True)
    args = parser.parse_args(argv)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
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
    return run_check(args.working_dir)


if __name__ == "__main__":
    raise SystemExit(main())
