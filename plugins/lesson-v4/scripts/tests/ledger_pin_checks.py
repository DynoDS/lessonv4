"""The checks every streamline topic's pin file runs (not a test module itself).

A topic's ledger lists every place the instructions say something about it; its
pin file holds each row's words where they now live, each changed rule's whole
paragraph, the topic's homes paragraph by paragraph, and each phrase the teacher
retired. `make_ledger_tests` builds the test case that fails when a pinned rule
is dropped, reworded, moved out of its section, or brought back. The fix is to
update the ledger and the pins on purpose, with the teacher's say-so, never to
delete the pin. The vocabulary topic's test carries the same checks inline.
"""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HEADING = re.compile(r"^(#{1,6}) ")
RUNTIME = [path for folder in ("agents", "references", "skills", "commands")
           for path in (ROOT / folder).rglob("*.md") if path.name != "build-review-log.md"]


def flat(text: str) -> str:
    return " ".join(text.split())


def section_by_heading(path: Path, heading: str, occurrence: int, intro: bool = False) -> str:
    """The flattened text under a heading (its `occurrence`-th copy), up to the
    next heading at the same or a higher level, skipping headings inside code
    fences. `intro` means the part under a file's title before its first
    subheading."""
    lines = path.read_text(encoding="utf-8").splitlines()
    heads = []
    fence = False
    for i, line in enumerate(lines):
        if line.lstrip().startswith("```"):
            fence = not fence
            continue
        match = HEADING.match(line)
        if match and not fence:
            heads.append((i, len(match.group(1)), line.rstrip()))
    found = [n for n, (_i, _level, line) in enumerate(heads) if line == heading]
    if len(found) <= occurrence:
        return ""
    n = found[occurrence]
    start, level, _line = heads[n]
    end = next((j for j, lv, _ in heads[n + 1:] if intro or lv <= level), len(lines))
    return flat("\n".join(lines[start:end]))


def make_ledger_tests(pins_path: Path, ledger_path: Path, prefix: str, expected_rows: int):
    ledger_row = re.compile(
        rf"^\| ({prefix}-[A-Z]\d{{2}}) \|.*`(?:agents|references|skills|commands|scripts|builder)/",
        re.MULTILINE,
    )

    class EveryLedgerRowIsStillInItsHome(unittest.TestCase):
        def setUp(self) -> None:
            data = json.loads(pins_path.read_text(encoding="utf-8"))
            self.pins = data["rows"]
            self.ledger_ids = data["ledgerIds"]
            self.homes = data["homes"]
            self.texts: dict[str, str] = {}

        def text(self, rel: str) -> str:
            if rel not in self.texts:
                self.texts[rel] = flat((ROOT / rel).read_text(encoding="utf-8"))
            return self.texts[rel]

        def test_every_ledger_row_is_pinned(self) -> None:
            ids = [row["id"] for row in self.pins]
            self.assertEqual(len(ids), len(set(ids)), "a row is pinned twice")
            self.assertEqual(len(self.ledger_ids), expected_rows)
            pinned = {row["id"]: row for row in self.pins}
            for rid in self.ledger_ids:
                with self.subTest(row=rid):
                    self.assertIn(rid, pinned, "a ledger row has no pin")
                    row = pinned[rid]
                    retired = row["outcome"].startswith(("retired", "story retired"))
                    # A rule that was kept must still be pinned where it lives;
                    # only a phrase the teacher retired may be pinned as gone alone.
                    self.assertTrue(row["absent"] if retired else row["present"], row["outcome"])

        @unittest.skipUnless(ledger_path.exists(), "the ledger lives in the development checkout's plans folder")
        def test_the_pins_match_the_ledger_itself(self) -> None:
            ledger_ids = ledger_row.findall(ledger_path.read_text(encoding="utf-8"))
            self.assertEqual(sorted(set(ledger_ids)), sorted(self.ledger_ids))

        def test_every_kept_rule_is_present_word_for_word(self) -> None:
            for row in self.pins:
                for pin in row["present"]:
                    with self.subTest(row=row["id"], file=pin["file"]):
                        self.assertIn(pin["text"], self.text(pin["file"]))

        def test_every_kept_rule_is_still_in_its_section(self) -> None:
            for row in self.pins:
                for pin in row["present"]:
                    if not pin.get("section"):
                        continue
                    with self.subTest(row=row["id"], file=pin["file"], section=pin["section"]["heading"]):
                        home = section_by_heading(ROOT / pin["file"], pin["section"]["heading"],
                                                  pin["section"]["occurrence"], pin["section"].get("intro", False))
                        self.assertIn(pin["text"], home)

        def test_every_retired_phrase_stays_gone(self) -> None:
            for row in self.pins:
                for pin in row["absent"]:
                    # "Everywhere" means every instruction file and the pin's
                    # own file too, which for a retired code phrase is the
                    # program it left.
                    own = ROOT / pin["file"]
                    files = sorted(set(RUNTIME) | {own}) if pin.get("everywhere") else [own]
                    for path in files:
                        with self.subTest(row=row["id"], file=str(path.relative_to(ROOT))):
                            self.assertNotIn(pin["text"], flat(path.read_text(encoding="utf-8")))

        def test_route_rules_stay_above_the_reviewers_line(self) -> None:
            # The reviewer reads each route file only down to `## Output Format
            # Block`. A pin names its section by heading, so a whole section
            # moved below that line would carry its pins with it; each pin
            # records whether it sat above the line, and must stay there.
            for row in self.pins:
                for pin in row["present"]:
                    if not pin.get("aboveReviewLine"):
                        continue
                    lines = (ROOT / pin["file"]).read_text(encoding="utf-8").splitlines()
                    with self.subTest(row=row["id"], file=pin["file"]):
                        # The heading itself, not the words: a cross-reference to
                        # the section higher up must not count as the line.
                        self.assertIn("## Output Format Block", lines)
                        above = flat(" ".join(lines[:lines.index("## Output Format Block")]))
                        self.assertIn(pin["text"], above)

        def test_a_paragraph_pinned_whole_is_still_exactly_that_paragraph(self) -> None:
            # Present word for word is not enough for a whole paragraph: a
            # sentence appended inside it, a label in front of it or a code
            # fence round it would leave every word present.
            for row in self.pins:
                for pin in row["present"]:
                    if not pin.get("paragraph"):
                        continue
                    raw = (ROOT / pin["file"]).read_text(encoding="utf-8").replace("\r\n", "\n")
                    paragraphs = {flat(x) for x in raw.split("\n\n")}
                    with self.subTest(row=row["id"], file=pin["file"]):
                        self.assertIn(pin["text"], paragraphs)

        def test_the_homes_hold_exactly_their_paragraphs(self) -> None:
            # Nothing added round a rule to negate it, nothing reordered so that
            # a pointer loses what it points at, nothing fenced off as code.
            for home in self.homes:
                lines = (ROOT / home["file"]).read_text(encoding="utf-8").splitlines()
                start = lines.index(home["heading"])
                level = len(home["heading"].split(" ")[0])
                end = next(i for i in range(start + 1, len(lines))
                           if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= level)
                body = "\n".join(lines[start + 1:end]).split("\n\n")
                paragraphs = [flat(x) for x in body if flat(x) and flat(x) != "---"]
                with self.subTest(home=home["file"], heading=home["heading"]):
                    self.assertEqual(paragraphs, home["paragraphs"])

    return EveryLedgerRowIsStillInItsHome
