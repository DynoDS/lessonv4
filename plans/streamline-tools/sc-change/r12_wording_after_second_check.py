"""Success criteria (4.2.288): the second check's wording findings.

3. The 18 to 19pt warning pointed every legal panel at the half-width split;
   he chose to widen only as far as 18pt needs, so the warning now says 18pt is
   within the floor and asks for nothing (the refusal names a roomier shape
   when a list truly does not fit).
4. The wall's reference tables: a criteria table keeps every row and word
   (decisions 3, 5 and 12); it splits over two cards, never cut or shortened.
5. Slide Philosophy's copy points home, as Written Voice's does.
7. Decision 6's two remaining "standard" lines in the task-centred route.
9. The wall's picture condition: "unless the steps need it" (they refer to
   it, or it is the diagram the criteria need), carried to every copy; and the
   two-card split named as the exception to "a second teaching card is
   exceptional".
10. The halfway example's reason is decision 2's: part of the step.
11. Two template lines still said criteria fit the bottom strips.
"""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")


def patch(rel: str, pairs) -> None:
    path = ROOT / rel
    raw = path.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    t = raw.replace("\r\n", "\n")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, t.count(old), old[:100])
        t = t.replace(old, new)
    if crlf:
        t = t.replace("\n", "\r\n")
    path.write_bytes(t.encode("utf-8"))
    print("patched", rel)


# 3. The 18 to 19pt warning.
patch("builder/src/content/steps.js", [
    ("  // not a fault in itself: 18pt is legal. The words are the lesson designer's\n"
     "  // and stay (the teacher's decisions of 23 September 2026), so the lever\n"
     "  // downstream is a roomier composition. A Codex run recorded four panels at 18pt as an accepted minor issue\n"
     "  // and nothing told it which step was doing it (19 September 2026).\n",
     "  // not a fault in itself: 18pt is his floor, and he chose to widen a panel only\n"
     "  // as far as 18pt needs. The words are the lesson designer's and stay (the\n"
     "  // teacher's decisions of 23 September 2026), and a list that does not fit is\n"
     "  // refused with a roomier shape named, so this message asks for nothing. A\n"
     "  // Codex run recorded four panels at 18pt as an accepted minor issue and\n"
     "  // nothing told it which step was doing it (19 September 2026).\n"),
    ("      `success criteria set at ${sharedFont}pt, below the ${TEXT_FONT_TARGET}pt a panel ` +\n"
     "      `is read at from a table. The longest step is \"${textOf(longest)}\". The words ` +\n"
     "      `are the lesson designer's and stay as they are; for more room use a roomier ` +\n"
     "      `composition, such as the half-width split with the criteria down one whole side.`\n",
     "      `success criteria set at ${sharedFont}pt: within the 18pt floor, below the ` +\n"
     "      `${TEXT_FONT_TARGET}pt a panel reads best at from a table. The longest step is ` +\n"
     "      `\"${textOf(longest)}\". Nothing need change: the words are the lesson ` +\n"
     "      `designer's and stay as they are, and a list that does not fit is refused ` +\n"
     "      `with a roomier shape named.`\n"),
])

# 4. The wall's tables.
patch("working-wall-html/src/layout.js", [
    ("column ${name}, is ${String(cell.text || \"\").length} characters and that column holds ${budget} in ${maxLinesPerCell} lines at ${cell.atPt}pt. Cut it to ${budget} characters or fewer: \"",
     "column ${name}, is ${String(cell.text || \"\").length} characters and that column holds ${budget} in ${maxLinesPerCell} lines at ${cell.atPt}pt. Cut it to ${budget} characters or fewer, unless the table is the lesson's success criteria, which are copied word for word (the card makes room instead, or the table goes over two cards): \""),
    ("Remove a row, or shorten cells to their column budgets (${budgets}).`;",
     "Remove a row, or shorten cells to their column budgets (${budgets}); a success-criteria table keeps every row and word, so its card makes room instead, or the table goes over two cards.`;"),
    # 9. The picture condition in the build's message.
    ("so its card makes room instead (the picture off, or the list over two cards)\");",
     "so its card makes room instead (the picture off unless the steps need it, or the list over two cards)\");"),
])
patch("agents/working-wall-designer.md", [
    ("| Lesson's reference table has > 6 rows | Pick the highest-leverage rows for the wall card; note the cut in `rationaleNote`. Do not cram. |",
     "| Lesson's reference table has > 6 rows | Pick the highest-leverage rows for the wall card; note the cut in `rationaleNote`. Do not cram. A success-criteria table is never cut, only split over two cards. |"),
    # 9. Rule 8's picture condition, and two em dashes in the paragraph edited.
    ("take the card's picture off unless the steps refer to it (about 106 characters",
     "take the card's picture off unless the steps need it (about 106 characters"),
    ("must match the lesson's success criteria exactly — same number of steps,",
     "must match the lesson's success criteria exactly: same number of steps,"),
    ("copy that SC in full — do not blend",
     "copy that SC in full; do not blend"),
])
patch("references/working-wall-preferences.md", [
    ("if the lesson's table is longer, split into two cards or pick the highest-leverage rows and note the cut in `rationaleNote`.",
     "if the lesson's table is longer, split into two cards or pick the highest-leverage rows and note the cut in `rationaleNote`. A success-criteria table only splits: every row and word goes up, as the class used it."),
    ("but a success-criteria step is copied word for word and the card makes room instead (no picture, or the list over two cards).",
     "but a success-criteria step is copied word for word and the card makes room instead (no picture unless the steps need it, or the list over two cards)."),
])
patch("agents/working-wall-designer-focused-repair.md", [
    ("so for one of those say instead that its card needs room (its picture off, or its list over two cards).",
     "so for one of those say instead that its card needs room (its picture off unless its steps need it, or its list over two cards)."),
])
patch("references/working-wall-card-contracts.md", [
    ("a second teaching card is exceptional and must do a genuinely different, repeatedly consulted job that the first cannot absorb. Never more than two teaching cards.",
     "a second teaching card is exceptional and must do a genuinely different, repeatedly consulted job that the first cannot absorb; the one exception is a success-criteria list or table too long for one card, carried in order over two cards of the same title, which is one job split for room. Never more than two teaching cards."),
])

# 5. Slide Philosophy's copy points home.
patch("references/preferences.md", [
    ("**Simple must still be intelligible.** Success criteria are short runnable actions. ",
     "**Simple must still be intelligible.** Success criteria are short runnable actions (Success Criteria above). "),
])

# 7. The task-centred route's two remaining "standard" lines.
patch("references/teaching-sequence-task-centred.md", [
    ("Set the Task put the question and the standard on the board at the start,",
     "Set the Task put the question and the success criteria on the board at the start,"),
    ("attach the exact standard through `successCriteriaRefs`.",
     "attach the success criteria through `successCriteriaRefs`."),
])

# 10. The halfway example's reason.
patch("references/teacher-voice.md", [
    ("A second sentence is not a fault in itself (`If it is halfway, round up.` gives a condition the step always meets), but",
     "A second sentence is not a fault in itself (`If it is halfway, round up.` is part of the step: the rule that decides the choice), but"),
])
patch("references/teaching-sequence-skill-based.md", [
    ("A second sentence is not a fault in itself: one that gives a condition the step always meets can stay (`If it is halfway, round up.`), and one that only names what the step produced goes.",
     "A second sentence is not a fault in itself: one that is part of the step can stay (`If it is halfway, round up.` is the rule that decides the choice), and one that only names what the step produced goes."),
])
patch("scripts/design-review-packet.py", [
    ("    # teacher's decisions of 23 September 2026 keep a condition the step always\n"
     "    # meets and a question that tells the child what to do next.\n",
     "    # teacher's decisions of 23 September 2026 keep a condition that is part of\n"
     "    # the step and a question that tells the child what to do next.\n"),
    ("                \"goes), is it a second step, or is it a condition the step always \"\n"
     "                \"meets or a stem the child writes into (then it stays)?\"",
     "                \"goes), is it a second step, or is it a condition that is part of the \"\n"
     "                \"step or a stem the child writes into (then it stays)?\""),
])

# 11. The two template lines around the strips.
patch("references/templates.md", [
    ("that need four pieces stacked: question, abstract diagram (e.g. two part-whole models in a `row`), concrete reference (e.g. coin row), and success-criteria steps. The bottom strip holds no criteria list at 18pt:",
     "that need four pieces stacked: question, abstract diagram (e.g. two part-whole models in a `row`), concrete reference (e.g. coin row), and a short fourth piece in the bottom strip, which holds no criteria list at 18pt:"),
    ("The bottom strip of `centre-big-v` (~1.66″) cannot hold 5 steps at full size — for SC of 4+ steps, use a template with a dedicated SC panel (`maths-turn-sc`).",
     "The bottom strip of `centre-big-v` (~1.66″) holds no criteria list at 18pt: use a template with a dedicated SC panel (`maths-turn-sc`)."),
])
