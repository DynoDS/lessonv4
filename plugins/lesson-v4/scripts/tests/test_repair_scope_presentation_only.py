"""How a page is drawn may change in a repair. What it says, and what is green, may not.

Each allowed change here was refused on a real lesson (three Codex runs, 10
October 2026), and each sits beside the nearest change that must stay refused.
"""
from __future__ import annotations

import copy
import json
import subprocess
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "check-repair-scope.py"

QUESTION = "Five hundreds + four hundreds + one exchanged hundred ="
FACTS = [
    "Caterpillars eat oak leaves.",
    "Blue tits catch and eat caterpillars.",
    "Sparrowhawks catch and eat blue tits.",
]
STORY = "Tariq usually enjoys drawing at lunch.\n\nThis week Tariq puts the drawing away."
PLAN = "Which clue makes Noah think Tariq may need support?\n\nWhich trusted adult could Noah ask?"
WRITE = "Write Noah's first message to that adult."
STARTER = "You can begin: I'm worried about ___."
CHART = {"type": "place-value-chart", "columns": ["H", "T", "O"], "rows": [{"counters": {"H": 5}}]}


def text(value: str, **extra) -> dict:
    return {"type": "text", "value": value, **extra}


def deck(*slides: dict) -> dict:
    return {"slides": list(slides)}


def task_slide() -> dict:
    return {
        "title": "Help Noah get support for Tariq",
        "template": "body-full",
        "body": {"type": "stack", "items": [
            text("Use the questions below to plan Noah's message."),
            {"type": "row", "items": [
                text(STORY, color="ED7D31"),
                {"type": "stack", "items": [
                    text(PLAN, colorRole="focus-blue"),
                    text(WRITE, colorRole="task-blue"),
                    text(STARTER),
                ]},
            ]},
        ]},
    }


def other_slide(title: str) -> dict:
    return {"title": title, "template": "body-full", "body": text(f"{title} is taught here.")}


class Scope(unittest.TestCase):
    def run_check(self, before: dict, after: dict) -> subprocess.CompletedProcess:
        with TemporaryDirectory() as tmp:
            before_path = Path(tmp) / "before.json"
            after_path = Path(tmp) / "after.json"
            before_path.write_text(json.dumps(before), encoding="utf-8")
            after_path.write_text(json.dumps(after), encoding="utf-8")
            return subprocess.run(
                [sys.executable, "-S", str(SCRIPT),
                 "--before", str(before_path), "--after", str(after_path)],
                capture_output=True, text=True,
            )

    def allowed(self, before: dict, after: dict) -> None:
        result = self.run_check(before, after)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("REPAIR_SCOPE_OK", result.stdout)

    def refused(self, before: dict, after: dict, saying: str = "") -> None:
        result = self.run_check(before, after)
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("REPAIR_SCOPE_FAILED", result.stdout)
        if saying:
            self.assertIn(saying, result.stdout)


class ColourMarkTests(Scope):
    def setUp(self) -> None:
        self.before = deck({
            "title": "Our Turn", "template": "maths-turn-sc",
            "questions": [QUESTION], "questionVisual": CHART,
        })

    def roomier(self, line: str) -> dict:
        return deck({
            "title": "Our Turn", "template": "split-h-70-30",
            "primary": {"type": "stack", "items": [text(line), CHART]},
        })

    def test_a_question_kept_blue_on_a_template_that_does_not_colour_it(self):
        self.allowed(self.before, self.roomier(f"[[{QUESTION}]]"))

    def test_bold_and_orange_marks_may_come_and_go(self):
        self.allowed(self.before, self.roomier("**Five hundreds** + <<four hundreds>> + one exchanged hundred ="))
        self.allowed(self.roomier(f"[[{QUESTION}]]"), self.roomier(QUESTION))

    def test_a_mark_does_not_hide_a_changed_word(self):
        self.refused(self.before, self.roomier("[[Five hundreds + four hundreds + one exchanged ten =]]"))

    def test_green_may_not_be_added(self):
        self.refused(self.before, self.roomier("Five hundreds + {{four hundreds}} + one exchanged hundred ="))

    def test_an_answer_reveal_mark_may_not_be_added(self):
        self.refused(self.before, self.roomier(f"||{QUESTION}"))

    def test_green_may_not_be_taken_off(self):
        green = self.roomier("Five hundreds + {{four hundreds}} + one exchanged hundred =")
        self.refused(green, self.roomier(QUESTION))

    def test_a_house_colour_may_change_but_not_to_green(self):
        before = deck({"title": "Read", "body": text("Tariq smiles.", color="ED7D31", colorRole="default")})
        self.allowed(before, deck({"title": "Read", "body": text("Tariq smiles.", color="0070C0", colorRole="focus-blue")}))
        self.allowed(before, deck({"title": "Read", "body": text("Tariq smiles.")}))
        self.refused(before, deck({"title": "Read", "body": text("Tariq smiles.", color="00B050")}), "green")

    def test_regular_weight_is_presentation_only_but_changed_words_still_fail(self):
        before = deck({"title": "Read", "body": text("Tariq smiles.")})
        self.allowed(before, deck({"title": "Read", "body": text("Tariq smiles.", textWeight="regular")}))
        self.refused(before, deck({"title": "Read", "body": text("Tariq cries.", textWeight="regular")}))

    def test_darker_green_keeps_the_existing_protected_identity(self):
        before = deck({"title": "Read", "body": text("Tariq smiles.")})
        old = deck({"title": "Read", "body": text("Tariq smiles.", color="00B050")})
        new = deck({"title": "Read", "body": text("Tariq smiles.", color="007A3D")})
        self.allowed(old, new)
        self.refused(before, new, "green")
        self.refused(new, before, "green")
        self.refused(before, deck({"title": "Read", "body": text("Tariq smiles.", colour="#007a3d")}), "green")

    def test_the_orange_line_may_be_marked_but_a_taught_word_may_not_turn_green(self):
        before = deck({"title": "Read", "body": text(" ".join(FACTS))})
        orange = text(" ".join(FACTS), emphasis=[{"text": FACTS[1], "role": "key-line"}])
        self.allowed(before, deck({"title": "Read", "body": orange}))
        green = text(" ".join(FACTS), emphasis=[{"text": "caterpillars", "role": "vocabulary"}])
        self.refused(before, deck({"title": "Read", "body": green}), "green")
        self.refused(deck({"title": "Read", "body": green}), before)


class LineBreakTests(Scope):
    def setUp(self) -> None:
        self.before = deck({"title": "Garden food chain", "body": {"type": "stack", "items": [
            text("Read the facts."), text("\n\n".join(FACTS)),
        ]}})

    def with_facts(self, *items: dict) -> dict:
        return deck({"title": "Garden food chain", "body": {"type": "stack", "items": [
            text("Read the facts."), *items,
        ]}})

    def test_blank_lines_may_close_up(self):
        self.allowed(self.before, self.with_facts(text("\n".join(FACTS))))

    def test_a_block_may_be_given_a_line_for_each_sentence(self):
        after = self.with_facts(
            text(FACTS[0]), text(FACTS[1], emphasis=[{"text": FACTS[1], "role": "key-line"}]), text(FACTS[2]),
        )
        self.allowed(self.before, after)

    def test_sentences_may_be_joined_back_into_one_block(self):
        self.allowed(self.with_facts(*(text(fact) for fact in FACTS)), self.before)

    def test_a_line_may_break_inside_a_sentence(self):
        self.allowed(self.before, self.with_facts(text(" ".join(FACTS).replace("catch and", "catch\nand"))))

    def test_a_break_does_not_hide_a_changed_word(self):
        self.refused(self.before, self.with_facts(text("\n".join(FACTS).replace("oak leaves", "leaves"))))

    def test_a_block_broken_up_keeps_every_sentence(self):
        self.refused(self.before, self.with_facts(text(FACTS[0]), text(FACTS[2])))

    def test_a_block_broken_up_gains_no_sentence(self):
        after = self.with_facts(*(text(fact) for fact in FACTS), text("So the sparrowhawk is last."))
        self.refused(self.before, after, "new")

    def test_the_sentences_keep_their_words_when_recut(self):
        swapped = [FACTS[0], "Blue tits catch and eat blue tits.", "Sparrowhawks catch and eat caterpillars."]
        self.refused(self.before, self.with_facts(*(text(fact) for fact in swapped)))


class LayoutBoxTests(Scope):
    def test_a_row_may_be_unwrapped_and_an_empty_box_taken_out(self):
        before = deck({"title": "Look", "body": {"type": "stack", "items": [
            text("Read the facts."),
            {"type": "row", "items": [text(FACTS[0]), text(""), CHART]},
        ]}})
        after = deck({"title": "Look", "template": "split-h-50-50",
                      "primary": {"type": "stack", "items": [text("Read the facts."), text(FACTS[0])]},
                      "secondary": CHART})
        self.allowed(before, after)

    def test_what_a_box_held_may_not_go_with_it(self):
        before = deck({"title": "Look", "body": {"type": "row", "items": [text(FACTS[0]), CHART]}})
        self.refused(before, deck({"title": "Look", "body": text(FACTS[0])}), "place-value-chart")
        self.refused(before, deck({"title": "Look", "body": CHART}))


class SplitTaskTests(Scope):
    def setUp(self) -> None:
        self.before = deck(other_slide("Clues"), task_slide(), other_slide("Check"))

    def split(self, first: list[str], second: list[str], title: str | None = None,
              between: dict | None = None) -> dict:
        def page(cards: list[str], heading: str) -> dict:
            return {"title": heading, "template": "split-h-60-40",
                    "primary": {"type": "stack", "items": [text(STORY, color="ED7D31"),
                                                          *(text(card) for card in cards)]}}
        one = page(first, "Help Noah get support for Tariq")
        one["primary"]["items"].insert(0, text("Use the questions below to plan Noah's message."))
        two = page(second, title or "Help Noah get support for Tariq")
        middle = [between] if between else []
        return deck(other_slide("Clues"), one, *middle, two, other_slide("Check"))

    def test_plan_on_one_slide_and_write_on_the_next(self):
        self.allowed(self.before, self.split([PLAN], [WRITE, STARTER]))

    def test_the_second_slide_may_be_titled_from_its_own_task_line(self):
        self.allowed(self.before, self.split([PLAN], [WRITE, STARTER], title="Write Noah's first message"))

    def test_a_title_nobody_wrote_is_still_refused(self):
        self.refused(self.before, self.split([PLAN], [WRITE, STARTER], title="Now write it down"), "new")

    def test_a_title_is_a_run_of_the_words_not_a_pick_of_them(self):
        self.refused(self.before, self.split([PLAN], [WRITE, STARTER], title="Write Noah's message"), "new")

    def test_lifted_words_are_a_title_and_nothing_else(self):
        after = self.split([PLAN], [WRITE, STARTER])
        after["slides"][2]["primary"]["items"].append(text("Write Noah's first message"))
        self.refused(self.before, after, "new")

    def test_the_cards_keep_their_order(self):
        self.refused(self.before, self.split([WRITE], [PLAN, STARTER]), "stand together")

    def test_the_cards_stay_on_slides_next_to_each_other(self):
        after = self.split([PLAN], [WRITE, STARTER], between=copy.deepcopy(other_slide("Clues")))
        self.refused(self.before, after, "stand together")

    def test_no_card_is_dropped_in_the_split(self):
        self.refused(self.before, self.split([PLAN], [WRITE]))

    def test_the_group_may_move_whole_to_another_layout(self):
        after = copy.deepcopy(self.before)
        slide = after["slides"][1]
        cards = slide["body"]["items"][1]["items"][1]["items"]
        slide["template"] = "split-h-60-40"
        slide["primary"] = {"type": "stack", "items": [slide["body"]["items"][0],
                                                      slide["body"]["items"][1]["items"][0], *cards]}
        del slide["body"]
        self.allowed(self.before, after)


if __name__ == "__main__":
    unittest.main()
