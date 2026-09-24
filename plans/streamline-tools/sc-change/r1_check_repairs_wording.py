"""Success criteria (4.2.288): repairs from the first check
(`success-criteria-change-check.md`) that are wording, and the wrong-pointing
messages the long-list investigation found (`2026-09-23-long-criteria-fit-
investigation.md` section 5, agreed by the teacher)."""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")


def patch(rel: str, pairs) -> None:
    path = ROOT / rel
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", rel, len(t.encode("utf-8")))


# 2a: decision 6 in the routes.
patch("references/teaching-sequence-task-centred.md", [
    ("The success criteria here is the standard for the task itself — what makes a good fair-test plan, a strong bridge, a clear opening paragraph — and it stays visible while children work, because it is the thing they are aiming at, not a recap of what was taught.",
     "The success criteria here are what a child who gets stuck looks at and uses to do the task itself (the steps of a fair-test plan, what a strong bridge needs, the stems for a clear opening paragraph), and they stay visible while children work, because they are what the child uses, not a recap of what was taught."),
    ("**Success criteria** is the standard for the task, kept visible throughout. Use how-to steps when the task turns on a clear move (the fair-test sort); a feature checklist when it's a product or a piece of writing.",
     "**Success criteria** are what a child who gets stuck uses to do the task, kept visible throughout. Use how-to steps when the task turns on a clear move (the fair-test sort); the steps or sentence stems a child can use when it's a product or a piece of writing."),
    ("Define that standard once as success criteria and attach it through `successCriteriaRefs`.",
     "Write what a stuck child uses once, as success criteria, and attach it through `successCriteriaRefs`."),
])
patch("references/teaching-sequence-content-based.md", [
    ("When children need one, show the features or decisions that distinguish a successful performance and keep it visible during Practise.",
     "When children need one, show what a child who gets stuck can use (the decisions to make, the steps, or sentence stems) and keep it visible during Practise."),
])

# 2b: decision 8 is about success criteria, not every list of steps.
patch("agents/worksheet-designer.md", [
    ("always empty, and nothing on the page reprints the criteria or a method's\n    steps, as a panel or as a list.",
     "always empty, and nothing on the page reprints them, as a panel or as a\n    list."),
    ("- Confirm no success criteria or method steps are printed, as a panel or as an\n  instruction carrying a list.",
     "- Confirm no success criteria are printed, as a panel or as an instruction\n  carrying a list."),
])

# 1a: the board's criteria still have to fit the sheet's own task.
patch("references/lesson-designer-components.md", [
    ("Apply `preferences.md` → Support, Checking and Release to the worksheet's other support,",
     "Check the board's criteria against the worksheet's own evidence and response, not only the board task they were written for, because a child working the sheet looks up at them. Apply `preferences.md` → Support, Checking and Release to the worksheet's other support,"),
])

patch("references/preferences.md", [
    # 2d: the kept story no longer shows the steps on the sheet as the answer.
    ("the same page with the columns the other way round gives the task its full run and still keeps the steps in view.",
     "the same page with the columns the other way round gives the task its full run."),
    # 1b: the example of a picture mark says which case it is.
    ("`Compare the ((thousands)) first. If they match, move right and <<stop at the first digit that is different>>.`",
     "`Compare the ((thousands)) first. If they match, move right and <<stop at the first digit that is different>>.` (where `thousands` is not one of the lesson's vocabulary cards)"),
    # 1e: a labelled set is a reference, not steps.
    ("criteria that go up are the exact same steps the class used, never a different version.",
     "criteria that go up are the exact same steps or reference the class used, never a different version."),
])
patch("agents/lesson-designer.md", [
    ("which puts up the exact same steps if it takes them.", "which puts up the exact same steps or reference if it takes them."),
])
patch("references/output-template.md", [
    ("which puts up the exact same steps if it takes them.", "which puts up the exact same steps or reference if it takes them."),
])

patch("references/teacher-voice.md", [
    # 1c: the condition bullet says what did change in the pair above it.
    ("what fails is a fragment that leaves the child to work out what it means.",
     "what fails is a fragment that leaves the child to work out what it means. In the pair above the question was not the fault: `compare the hundreds` names what to compare."),
    # 1g: the voice guide says a second sentence is not a fault in itself.
    ("A step that needs a second sentence is usually two steps, or is carrying an explanation the teaching already gave; a second sentence that only names what the step has just produced goes,",
     "A second sentence is not a fault in itself (`If it is halfway, round up.` gives a condition the step always meets), but a step that needs one is usually two steps, or is carrying an explanation the teaching already gave, and a second sentence that only names what the step has just produced goes,"),
])

# 1f: the wall's two cards need room, and a diagram the steps refer to stays.
patch("agents/working-wall-designer.md", [
    ("take the card's picture off (about 106 characters a step instead of 62), drop non-SC extras, or carry the list in order over two cards of the same type and title;",
     "take the card's picture off unless the steps refer to it (about 106 characters a step instead of 62), drop non-SC extras, or carry the list in order over two cards of the same type and title when the wall has room for both;"),
])
# The wall's other repair rules name the exception too.
patch("references/working-wall-preferences.md", [
    ("If autofit reaches the floor and a warning fires, the build has failed: shorten faithful display text, simplify the layout, or remove the card,",
     "If autofit reaches the floor and a warning fires, the build has failed: shorten faithful display text (never a success-criteria step, which is copied word for word), simplify the layout, or remove the card,"),
])
patch("references/adaptive-adaptation.md", [
    ("Greater Depth may remain the same central task with richer input, sharper success criteria, a more demanding reference or a higher standard for the outcome.",
     "Greater Depth may remain the same central task with richer input, sharper success criteria (written into the task, never printed on the sheet as a criteria panel), a more demanding reference or a higher standard for the outcome."),
])

# Fit investigation section 5: the template lines that overstate the strips.
patch("references/templates.md", [
    (" The bottom strip is sized for ~5 step rows at intended typography.",
     " The bottom strip holds no criteria list at 18pt: put steps in a practice template's panel or the half-width side (`slide-success-criteria.md`)."),
    ("5 steps needs ~2.0–2.5″ of zone height.",
     "Five one-line steps need about 3.25″ inside a criteria panel."),
])

# Fit investigation section 4, the meanwhile guidance for decision 13.
patch("references/slide-success-criteria.md", [
    ("When a composition does not hold the whole list, try a roomier one (the full height of one side, the question and the working space arranged around the panel); the criteria are not reported back as unfittable, and never reshaped or cut to fit.",
     "When a composition does not hold the whole list, try a roomier one (the full height of one side, the question and the working space arranged around the panel); the criteria are not reported back as unfittable, and never reshaped or cut to fit. What holds a list today: the practice templates' panel takes about 14 lines at 18pt, about 26 characters a line; when it refuses, use the half-width split (`split-h-50-50`) with the criteria in an `sc-panel` down one whole side, about 14 lines at about 39 characters. Never put a method's steps in a 30% column (`split-h-70-30`, `body-sidebar`), a thirds column, the bottom bands and strips (`split-v-60-40`, `split-v-70-30`, `quad-v`, `centre-big-v`), or a panel sharing its column with other items. A criteria table goes in the practice panel or the half side, never the 40% side."),
])

# Fit investigation section 5: the build's messages.
patch("builder/src/content/steps.js", [
    ("  // not a layout fault to repair downstream: the panel is as wide as the\n"
     "  // template makes it, and the lever is the wording, which only the designer\n"
     "  // owns.",
     "  // not a fault in itself: 18pt is legal. The words are the lesson designer's\n"
     "  // and stay (the teacher's decisions of 23 September 2026), so the lever\n"
     "  // downstream is a roomier composition."),
    ("      `is read at from a table. The longest step is \"${textOf(longest)}\". Shorten a step ` +\n"
     "      `without losing what it tells a stuck child to do, or split one step into two ` +\n"
     "      `shorter ones; the panel's width is fixed by the template.`",
     "      `is read at from a table. The longest step is \"${textOf(longest)}\". The words ` +\n"
     "      `are the lesson designer's and stay as they are; for more room use a roomier ` +\n"
     "      `composition, such as the half-width split with the criteria down one whole side.`"),
])
patch("builder/build.js", [
    ("        `${slidesHit.join(', ')} fitted under 20pt. Shorter words read better than smaller ones.`",
     "        `${slidesHit.join(', ')} fitted under 20pt. Shorter words read better than smaller ones, ` +\n"
     "        `except in a criteria panel, whose words stay and whose lever is a roomier composition.`"),
    # A fitting six-step panel is not a fault to flag before teaching.
    ("  'FIXED_CAPTION_CAPACITY',\n  'SUCCESS_CRITERIA_CAPACITY',\n]);",
     "  'FIXED_CAPTION_CAPACITY',\n"
     "  // SUCCESS_CRITERIA_CAPACITY is a cue to look, not a fault (the teacher's\n"
     "  // rulings of 10 and 23 September 2026), so a panel that fits is not listed.\n"
     "]);"),
])
patch("builder/src/success-criteria-panel.js", [
    ("`\\`success-criteria\\` slide is only for criteria being taught or built. ` +",
     "`\\`success-criteria\\` slide is only for criteria being taught, compared or built. ` +"),
])

# 4d: comments that described criteria on paper.
patch("worksheet-html/src/slips.js", [
    ("  // really don't think it's needed at all\". The sheet keeps it, Below included.\n",
     "  // really don't think it's needed at all\". Since 23 September 2026 the sheet\n"
     "  // refuses it too (render.js, CRITERIA_NOT_ON_SHEETS); this stays for older specs.\n"),
])
patch("shared/text/criteria-marks.js", [
    ("// sentence. The teacher's scheme (15 September 2026) gives three kinds of word\n"
     "// their own colour, in this order of priority when one word could be two:\n",
     "// sentence. The teacher's scheme (15 September 2026) gives three kinds of word\n"
     "// their own colour. A taught word is green every time, even when it also names\n"
     "// a coloured part of the picture (his decision of 23 September 2026):\n"),
    ("// words, so a verbatim copy onto the worksheet or the working wall carries the\n"
     "// colour with it and the three surfaces cannot drift apart.",
     "// words, so a verbatim copy onto the working wall carries the colour with it\n"
     "// and the surfaces cannot drift apart (criteria no longer go on a worksheet)."),
])
