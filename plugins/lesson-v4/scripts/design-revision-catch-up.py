#!/usr/bin/env python3
"""Say what a design revision changed, and prove no resource still carries the old lesson.

The slide and sheet designers are launched the moment the lesson's wording is
settled and are never held for the picture search. That search reports a few
minutes later, and when a picture the lesson cannot do without is lost, the
Lesson Designer revises the lesson. On 7 October 2026 two of twenty runs met
this and each stopped its working designers until the revision and its review
had finished: 39 minutes in which only the rework ran, for a revision that
touched 7 of 26 slides.

So the designers carry on, and each resource is brought up to the revised
lesson afterwards. That needs two things nothing gave: the list of what the
revision changed, and a check that a slide or sheet written from the lesson as
it was does not go out unchanged.

    design-revision-catch-up.py mark    --working-dir DIR
    design-revision-catch-up.py changes --working-dir DIR [--spec PATH ...]
    design-revision-catch-up.py check   --working-dir DIR --spec PATH

`mark` keeps the lesson and its picture list as they stand, before a revision
is launched. The picture finaliser runs it itself the moment it announces a
lost essential picture, so no run has to remember to. It keeps the first copy
only, so a second revision in one run is still compared with the lesson the
earliest designer read.

`changes` names the units the revision changed and the pictures it retired
and, for each specification given, the pages that revision reaches: a page
built from a changed unit, one naming a retired picture, or one still showing
a sentence the revised lesson no longer says.

`check` passes a specification when no retired picture and no such sentence is
left on it. It finds what was left behind. It cannot find a new sentence that
was never brought across: that stays with each resource's own checks.

A sentence counts as gone only when it appears nowhere in the revised lesson,
so words that moved from one unit to another are not a fault, and it is
compared by its words alone, so a line break does not hide it.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

BASELINE_DIR = "revision-baseline"
DESIGN = "lesson-design.json"
PHOTOS = "photo-requirements.json"
# A shorter run of words ("Tell your partner.") is furniture any page may
# carry for its own reasons.
MIN_WORDS = 4

_SENTENCE_END = re.compile(r"(?<=[.!?])\s+|\n+")
_NOT_WORD = re.compile(r"[^a-z0-9]+")


class CatchUpError(Exception):
    pass


def read_json(path: Path, label: str) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise CatchUpError(f"{label} not found: {path}")
    except json.JSONDecodeError as exc:
        raise CatchUpError(f"{label} is not valid JSON ({path}): {exc}")


def plain(text: str) -> str:
    return _NOT_WORD.sub(" ", text.lower()).strip()


def strings_of(node: object) -> list[str]:
    if isinstance(node, str):
        return [node]
    if isinstance(node, dict):
        return [s for value in node.values() for s in strings_of(value)]
    if isinstance(node, list):
        return [s for value in node for s in strings_of(value)]
    return []


def sentences_of(node: object) -> set[str]:
    found = set()
    for text in strings_of(node):
        for part in _SENTENCE_END.split(text):
            sentence = plain(part)
            if len(sentence.split()) >= MIN_WORDS:
                found.add(sentence)
    return found


def units_of(design: object) -> dict[str, object]:
    units: dict[str, object] = {}

    def visit(node: object) -> None:
        if isinstance(node, dict):
            unit_id = node.get("sourceUnitId")
            if isinstance(unit_id, str):
                units[unit_id] = node
            for value in node.values():
                visit(value)
        elif isinstance(node, list):
            for value in node:
                visit(value)

    visit(design)
    return units


def pictures_of(contract: object) -> dict[str, str]:
    photos = contract.get("photos") if isinstance(contract, dict) else None
    return {
        photo["filename"]: photo.get("id", "")
        for photo in (photos if isinstance(photos, list) else [])
        if isinstance(photo, dict) and isinstance(photo.get("filename"), str)
    }


class Revision:
    def __init__(self, working_dir: Path) -> None:
        baseline = working_dir / BASELINE_DIR
        if not (baseline / DESIGN).exists():
            raise CatchUpError(
                f"REVISION_BASELINE_MISSING: no {BASELINE_DIR}/{DESIGN} in {working_dir}. "
                "`mark` was not run before the revision, so there is no record of the lesson "
                "the designers read. Relaunch each affected designer on the revised lesson."
            )
        try:
            before = read_json(baseline / DESIGN, "the lesson before the revision")
        except CatchUpError as exc:
            raise CatchUpError(f"REVISION_BASELINE_MISSING: {exc}. Relaunch each affected "
                               "designer on the revised lesson.")
        after = read_json(working_dir / DESIGN, "the revised lesson")

        before_units, after_units = units_of(before), units_of(after)
        # Each changed unit with the parts of it that differ, so a designer is
        # sent to the task or the script, not to the whole unit.
        self.changed_units: dict[str, str] = {}
        for unit_id in sorted(set(before_units) | set(after_units)):
            was, now = before_units.get(unit_id), after_units.get(unit_id)
            if was == now:
                continue
            if was is None or now is None:
                self.changed_units[unit_id] = "new unit" if was is None else "unit removed"
                continue
            self.changed_units[unit_id] = ", ".join(
                key for key in sorted(set(was) | set(now)) if was.get(key) != now.get(key)
            )

        said_now = " \n ".join(plain(text) for text in strings_of(after))
        self.gone_sentences = sorted(
            sentence for sentence in sentences_of(before) if sentence not in said_now
        )

        self.retired: dict[str, str] = {}
        if (baseline / PHOTOS).exists() and (working_dir / PHOTOS).exists():
            was = pictures_of(read_json(baseline / PHOTOS, "the picture list before the revision"))
            now = pictures_of(read_json(working_dir / PHOTOS, "the current picture list"))
            now_ids = set(now.values())
            self.retired = {
                name: (photo_id if photo_id not in now_ids else "")
                for name, photo_id in was.items()
                if name not in now
            }

    def left_behind(self, page: object) -> list[str]:
        """What a page still carries of the lesson as it was."""
        texts = strings_of(page)
        found = []
        for name, photo_id in sorted(self.retired.items()):
            if any(name in text or (photo_id and text == photo_id) for text in texts):
                found.append(f"names the retired picture {name}")
        shown = [plain(text) for text in texts]
        for sentence in self.gone_sentences:
            if any(sentence in text for text in shown):
                found.append(f'still says "{sentence}"')
        return found

    def reaches(self, page: object) -> list[str]:
        reasons = self.left_behind(page)
        if isinstance(page, dict):
            ids = [page.get("designUnitId"), page.get("sourceUnitId")]
            ids += page.get("designUnitIds") if isinstance(page.get("designUnitIds"), list) else []
            for unit_id in ids:
                if isinstance(unit_id, str) and unit_id in self.changed_units:
                    reasons.insert(
                        0, f"built from {unit_id}, changed in: {self.changed_units[unit_id]}"
                    )
        return reasons


def pages_of(spec: object) -> list[tuple[str, object]]:
    """A specification as the pages a designer would be sent back to."""
    if not isinstance(spec, dict):
        return [("the whole file", spec)]
    pages: list[tuple[str, object]] = []
    for key, value in spec.items():
        if key == "meta":
            continue
        if isinstance(value, list) and value and all(isinstance(item, dict) for item in value):
            singular = key[:-1] if key.endswith("s") else key
            for number, item in enumerate(value, 1):
                title = item.get("title") or item.get("label")
                label = f"{singular} {number}"
                pages.append((f'{label} ("{title}")' if isinstance(title, str) else label, item))
        elif isinstance(value, dict):
            pages.extend((f"{key}: {name}", item) for name, item in value.items())
        else:
            pages.append((key, value))
    return pages


def mark(working_dir: Path) -> int:
    if not (working_dir / DESIGN).exists():
        raise CatchUpError(f"no {DESIGN} in {working_dir}")
    baseline = working_dir / BASELINE_DIR
    if (baseline / DESIGN).exists():
        print(f"REVISION_BASELINE_OK: already kept in {baseline} (the first copy stands)")
        return 0
    baseline.mkdir(parents=True, exist_ok=True)
    if (working_dir / PHOTOS).exists():
        shutil.copyfile(working_dir / PHOTOS, baseline / PHOTOS)
    shutil.copyfile(working_dir / DESIGN, baseline / DESIGN)
    print(f"REVISION_BASELINE_OK: {baseline}")
    return 0


def changes(working_dir: Path, specs: list[Path]) -> int:
    revision = Revision(working_dir)
    print(f"REVISION_CHANGED_UNITS: {len(revision.changed_units)}")
    for unit_id, parts in revision.changed_units.items():
        print(f"  {unit_id}: {parts}")
    print("REVISION_RETIRED_PICTURES: " + (", ".join(sorted(revision.retired)) or "none"))
    for path in specs:
        if not path.exists():
            print(f"REVISION_SPEC_NOT_WRITTEN {path.name}: its designer has not finished; "
                  "run this again when it has")
            continue
        reached = [
            (label, reasons)
            for label, page in pages_of(read_json(path, path.name))
            if (reasons := revision.reaches(page))
        ]
        if not reached:
            print(f"REVISION_TOUCHES_NOTHING {path.name}: build it as it stands")
            continue
        print(f"REVISION_TOUCHES {path.name}: {len(reached)} to bring up to the revised lesson")
        for label, reasons in reached:
            print(f"  {label}: " + "; ".join(reasons))
    return 0


def check(working_dir: Path, spec_path: Path) -> int:
    revision = Revision(working_dir)
    failures = [
        (label, reasons)
        for label, page in pages_of(read_json(spec_path, spec_path.name))
        if (reasons := revision.left_behind(page))
    ]
    if not failures:
        print(f"REVISION_CARRIED_OK: {spec_path.name}")
        return 0
    for label, reasons in failures:
        for reason in reasons:
            print(f"REVISION_NOT_CARRIED: {spec_path.name}, {label}: {reason}")
    print(
        "The lesson was revised after this was written and these pages still show it as it "
        "was. Bring each one up to the current lesson-design.json; leave every other page alone."
    )
    return 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ("mark", "changes", "check"):
        command = commands.add_parser(name)
        command.add_argument("--working-dir", required=True, type=Path)
        if name == "changes":
            command.add_argument("--spec", action="append", default=[], type=Path)
        if name == "check":
            command.add_argument("--spec", required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        if args.command == "mark":
            return mark(args.working_dir)
        if args.command == "changes":
            return changes(args.working_dir, args.spec)
        return check(args.working_dir, args.spec)
    except CatchUpError as exc:
        print(str(exc))
        return 2


if __name__ == "__main__":
    sys.exit(main())
