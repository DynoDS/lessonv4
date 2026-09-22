"""Every vocabulary rule the teacher's ledger recorded is still where it lives.

The vocabulary instructions were written in about 285 places across 40 files,
with the same rule in several words and several strengths. The streamline of
22 September 2026 listed every one of them (plans/2026-09-22-vocabulary-ledger.md),
the teacher decided each disagreement, and the rules were folded into one home,
`preferences.md` -> Vocabulary. Earlier tidy-ups had rewritten rules and
reported that nothing changed; nothing pinned the rules, so the next pass could
not tell what it had lost.

`vocabulary_ledger_pins.json` holds each ledger row's words in its current home,
and each phrase the teacher retired by name. A change that drops or rewords a
pinned rule fails here, and the fix is to update the ledger and the pins on
purpose, with the teacher's say-so, not to delete the pin.
"""

from __future__ import annotations

import importlib.util
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PINS = Path(__file__).resolve().with_name("vocabulary_ledger_pins.json")


def flat(text: str) -> str:
    return " ".join(text.split())


def section(path: Path, heading: str) -> str:
    """The text under one `## heading`, up to the next heading at that level."""
    lines = path.read_text(encoding="utf-8").splitlines()
    start = lines.index(heading)
    level = heading.split(" ")[0]
    end = next(
        (i for i in range(start + 1, len(lines))
         if lines[i].startswith(level + " ") and not lines[i].startswith(level + "#")),
        len(lines),
    )
    return flat("\n".join(lines[start:end]))


HEADING = re.compile(r"^(#{1,6}) ")


def section_by_heading(path: Path, heading: str, occurrence: int, intro: bool = False) -> str:
    """The flattened text under the given heading (its `occurrence`-th copy),
    up to the next heading at the same or a higher level, skipping headings
    inside code fences. A pin names its section so a rule moved somewhere its
    reader will not look fails as surely as a rule deleted. `intro` means the
    part under a file's title before its first subheading."""
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


LEDGER = ROOT.parents[1] / "plans" / "2026-09-22-vocabulary-ledger.md"
RUNTIME = [path for folder in ("agents", "references", "skills", "commands")
           for path in (ROOT / folder).rglob("*.md") if path.name != "build-review-log.md"]
LEDGER_ROW = re.compile(r"^\| (VOC-[A-Z]\d{2}) \|.*`(?:agents|references|skills|commands|scripts|builder)/", re.MULTILINE)


class EveryLedgerRowIsStillInItsHome(unittest.TestCase):
    def setUp(self) -> None:
        data = json.loads(PINS.read_text(encoding="utf-8"))
        self.pins = data["rows"]
        self.ledger_ids = data["ledgerIds"]
        self.texts: dict[str, str] = {}

    def text(self, rel: str) -> str:
        if rel not in self.texts:
            self.texts[rel] = flat((ROOT / rel).read_text(encoding="utf-8"))
        return self.texts[rel]

    def test_every_ledger_row_is_pinned(self) -> None:
        ids = [row["id"] for row in self.pins]
        self.assertEqual(len(ids), len(set(ids)), "a row is pinned twice")
        self.assertEqual(len(self.ledger_ids), 285)
        pinned = {row["id"]: row for row in self.pins}
        for rid in self.ledger_ids:
            with self.subTest(row=rid):
                self.assertIn(rid, pinned, "a ledger row has no pin")
                row = pinned[rid]
                retired = row["outcome"].startswith(("retired", "story retired"))
                # A rule that was kept must still be pinned where it lives; only
                # a phrase the teacher retired by name may be pinned as gone alone.
                self.assertTrue(row["absent"] if retired else row["present"], row["outcome"])

    @unittest.skipUnless(LEDGER.exists(), "the ledger lives in the development checkout's plans folder")
    def test_the_pins_match_the_ledger_itself(self) -> None:
        ledger_ids = LEDGER_ROW.findall(LEDGER.read_text(encoding="utf-8"))
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
                files = RUNTIME if pin.get("everywhere") else [ROOT / pin["file"]]
                for path in files:
                    with self.subTest(row=row["id"], file=str(path.relative_to(ROOT))):
                        self.assertNotIn(pin["text"], flat(path.read_text(encoding="utf-8")))

    def test_the_vocabulary_homes_hold_exactly_their_paragraphs(self) -> None:
        # Nothing added round a rule to negate it, nothing reordered so that
        # `the selection test above` loses what it points at, nothing fenced
        # off as code: the home reads exactly as the teacher approved it.
        for home in json.loads(PINS.read_text(encoding="utf-8"))["homes"]:
            lines = (ROOT / home["file"]).read_text(encoding="utf-8").splitlines()
            start = lines.index(home["heading"])
            level = len(home["heading"].split(" ")[0])
            end = next(i for i in range(start + 1, len(lines))
                       if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= level)
            body = "\n".join(lines[start + 1:end]).split("\n\n")
            paragraphs = [flat(x) for x in body if flat(x) and flat(x) != "---"]
            with self.subTest(home=home["file"]):
                self.assertEqual(paragraphs, home["paragraphs"])


class TheVocabularyHasOneHome(unittest.TestCase):
    PREFERENCES = ROOT / "references" / "preferences.md"

    def test_the_answer_arrow_preference_left_the_vocabulary_section(self) -> None:
        # Decision 11: it is about answer slides, and sits with that rule now.
        vocabulary = section(self.PREFERENCES, "## Vocabulary")
        checking = section(self.PREFERENCES, "## Support, Checking and Release")
        self.assertNotIn("A PREFERENCE, not a rule", vocabulary)
        self.assertIn("**A PREFERENCE, not a rule: an answer slide that looks like its question slide", checking)
        self.assertIn("It's just the preference I have.", checking)

    def test_the_designer_keeps_no_second_copy_of_the_teaching_rules(self) -> None:
        designer = section(ROOT / "agents" / "lesson-designer.md", "### Vocabulary")
        for gone in ("Two things decide that point", "Combining pairs", "Use words in lesson, not only card",
                     "Group words that are needed together", "Every card carries one coherent visual"):
            with self.subTest(gone=gone):
                self.assertNotIn(gone, designer)
        self.assertIn("Governed by `preferences.md` → Vocabulary", designer)


class TheReviewerHearsTheVocabularyScript(unittest.TestCase):
    """The teacher, 22 September 2026: "The reviewer should definitely be able
    to see what the teacher says on a vocab slide." The class view printed a
    vocabulary slide as its words and definitions only, so the voice sweep
    never reached the words the teacher says in front of it."""

    def test_the_class_view_prints_the_vocabulary_slide_script(self) -> None:
        spec = importlib.util.spec_from_file_location("packet_vocab_script", ROOT / "scripts" / "design-review-packet.py")
        packet = importlib.util.module_from_spec(spec)
        assert spec.loader
        spec.loader.exec_module(packet)
        design = {
            "lesson": {"yearGroup": 4},
            "vocabulary": [{"id": "vocab-001", "term": "opaque", "definition": "Light can't get through something opaque."}],
            "vocabularyIntroductions": [{"vocabularyRefs": ["vocab-001"], "after": "u1",
                                         "script": "Say to children: Cardboard: opaque or not? Hands up."}],
            "starter": {"sourceUnitId": "u0", "label": "Starter", "kind": "starter", "content": {}},
            "teachingSequence": [{"sourceUnitId": "u1", "label": "Shadows", "kind": "teach", "content": {"headline": "Look."}}],
        }
        lines, _count = packet.build_class_view(design)
        text = "\n".join(lines)
        self.assertIn("opaque: Light can't get through something opaque.", text)
        self.assertIn("Teacher says: Cardboard: opaque or not? Hands up.", text)
        self.assertNotIn("Say to children:", text)


if __name__ == "__main__":
    unittest.main()
