"""Every reference the Lesson Designer points at is reachable.

The role's "Reference Files - precedence and decision-point loading" section is
the one owner of what the designer reads and when. The 2 Sept 2026 context
audit moved several rules out of the always-loaded role to the reference that
already owned them, routed by a pointer of the form `file.md` → Heading. A
pointer whose file the loading section never names, or whose heading does not
exist, is a rule that has silently become unreachable: the designer would
follow the pointer, find nothing, and design without the rule. This guard
fails on either, so a move can only ever be a move and never a deletion.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REFERENCES = ROOT / "references"
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"

LOADING_HEADING = "## Reference Files - precedence and decision-point loading"

# Families the loading section names by glob rather than by file.
FAMILIES = {
    "subject-": "subject-*.md",
    "teaching-sequence-": "teaching-sequence-*.md",
}

# Files the role names that are not references: designer-owned outputs and
# other agents. They are not loaded, so the loading section need not route them.
NOT_REFERENCES = {"design-decisions.md", "design-reviewer.md"}


def role_text() -> str:
    return LESSON_DESIGNER.read_text(encoding="utf-8")


def loading_section(text: str) -> str:
    start = text.index(LOADING_HEADING)
    return text[start:]


def headings_of(path: Path) -> list[str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    return [
        line.lstrip("#").strip().strip("*").strip()
        for line in lines
        if line.startswith("#")
    ]


def named_reference_files(text: str) -> set[str]:
    names = set(re.findall(r"`([a-z0-9-]+\.md)`", text))
    return {
        name
        for name in names
        if name not in NOT_REFERENCES and (REFERENCES / name).is_file()
    }


def loading_names(section: str, name: str) -> bool:
    if f"`{name}`" in section:
        return True
    for prefix, glob in FAMILIES.items():
        if name.startswith(prefix) and f"`{glob}`" in section:
            return True
    return False


class ReferenceFilesAreRouted(unittest.TestCase):
    def test_every_reference_the_role_points_at_is_named_by_the_loading_section(self) -> None:
        text = role_text()
        section = loading_section(text)
        unrouted = sorted(
            name for name in named_reference_files(text) if not loading_names(section, name)
        )
        self.assertEqual(
            unrouted,
            [],
            "the role points at reference files its loading section never routes: "
            + ", ".join(unrouted),
        )

    def test_every_family_glob_the_loading_section_uses_matches_real_files(self) -> None:
        section = loading_section(role_text())
        for glob in FAMILIES.values():
            if f"`{glob}`" in section:
                self.assertTrue(
                    list(REFERENCES.glob(glob)), f"no file matches {glob}"
                )


class PointedHeadingsExist(unittest.TestCase):
    """A `file.md` → Heading pointer must name a heading that file has."""

    POINTER = re.compile(r"`([a-z0-9-]+\.md)` → ([^\n`]{2,120})")
    SECTION_NUMBER = re.compile(r"`([a-z0-9-]+\.md)` §§?(\d+)")

    @staticmethod
    def prefixes(phrase: str) -> list[str]:
        cleaned = re.split(r"[.,;:()]| - ", phrase, maxsplit=1)[0].strip()
        words = cleaned.split()
        return [" ".join(words[:n]) for n in range(min(len(words), 8), 0, -1)]

    def test_arrow_pointers_resolve_to_a_heading(self) -> None:
        text = role_text()
        unresolved = []
        for name, phrase in self.POINTER.findall(text):
            path = REFERENCES / name
            if not path.is_file():
                continue
            heads = headings_of(path)
            if not any(
                any(prefix in head for head in heads) for prefix in self.prefixes(phrase)
            ):
                unresolved.append(f"`{name}` → {phrase.strip()[:60]}")
        self.assertEqual(
            unresolved,
            [],
            "pointers naming a heading the file does not have: " + "; ".join(unresolved),
        )

    def test_section_number_pointers_resolve_to_a_numbered_heading(self) -> None:
        text = role_text()
        unresolved = []
        for name, number in self.SECTION_NUMBER.findall(text):
            path = REFERENCES / name
            if not path.is_file():
                continue
            heads = headings_of(path)
            if not any(re.match(rf"{number}\.\s", head) for head in heads):
                unresolved.append(f"`{name}` §{number}")
        self.assertEqual(unresolved, [], "; ".join(unresolved))

    def test_the_moved_rules_are_where_their_pointers_say(self) -> None:
        """The specific moves of the 2 Sept 2026 audit, so a later edit to a
        destination file cannot orphan a pointer that still reads well."""
        maths = (REFERENCES / "subject-maths.md").read_text(encoding="utf-8")
        self.assertIn("## Real-world hooks", maths)
        self.assertIn("no hook is better than one that has to be forced", maths)
        formats = (REFERENCES / "modelling-formats.md").read_text(encoding="utf-8")
        for state in (
            "### Prepared example",
            "### Live-complete helper",
            "### Question and reference",
            "### Physical-demonstration support",
        ):
            self.assertIn(state, formats)
        template = (REFERENCES / "output-template.md").read_text(encoding="utf-8")
        self.assertIn("### Source-unit contract", template)
        self.assertIn("## Additional Output: Photo Requirements", template)
        for kind in ('"kind": "option-bank"', '"kind": "sort"', '"kind": "evidence-classification"'):
            self.assertIn(kind, template)
        preferences = (REFERENCES / "preferences.md").read_text(encoding="utf-8")
        self.assertIn("## Question Labelling", preferences)
        self.assertIn("the builder's question list drops the label itself", preferences)


if __name__ == "__main__":
    unittest.main()
