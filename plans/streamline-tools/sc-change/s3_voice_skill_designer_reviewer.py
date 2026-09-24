"""Success criteria (4.2.288): the voice guide, the skill route, the designer's
own section and the reviewer, for decisions 2, 5, 6, 9, 10, 14, 15 and 16."""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")


def patch(rel: str, pairs) -> None:
    path = ROOT / rel
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", rel)


# ------------------------------------------------------------------ voice guide
patch("references/teacher-voice.md", [
    # Decisions 9 and 15.
    ("Both halves bind. A step is one imperative sentence, written for a child using it alone once the teaching has moved on,",
     "Both halves bind. A step is normally one imperative sentence, or a short question that tells the child what to do next, written for a child using it alone once the teaching has moved on,"),
    ("The user's own approved steps are each a single sentence, most of them four to ten words and none longer than about fourteen; that is a calibration of what clear-and-short looks like, not a target to reach. A step that needs a second sentence is usually two steps, or is carrying an explanation the teaching already gave.",
     "The user's own approved steps are almost all a single sentence, most of them four to ten words and none longer than about fourteen; that is a calibration of what clear-and-short looks like, not a target to reach. A step that needs a second sentence is usually two steps, or is carrying an explanation the teaching already gave; a second sentence that only names what the step has just produced goes, because the panel has little enough room."),
    # Decision 9: his rounding rewrite without the sentences that name the result.
    ("> Change the ones digit to 0. That's the ten below. / Add 10. That's the ten above. / Mark halfway and your number. / Round to the nearer ten. If it is halfway, round up.",
     "> Change the ones digit to 0. / Add 10. / Mark halfway and your number. / Round to the nearer ten. If it is halfway, round up."),
    # Decision 15.
    ("- **Write a condition as a sentence, not a slogan.** `If they are the same, compare the hundreds.` is barely longer than `Same? Move right.` and needs no unpacking.",
     "- **Write a condition so the child knows what to do next.** A short question that does is a good step (`Same? Move right.`), and so is an `If...` sentence (`If they are the same, compare the hundreds.`); what fails is a fragment that leaves the child to work out what it means."),
    # The standing ruling on dates.
    ("and the teacher had found the longer version too wordy for what the class actually did (17 September 2026).",
     "and the teacher had found the longer version too wordy for what the class actually did."),
    # Decision 9, and the date.
    ("and a Year 4 class stuck on 346 had nothing to act on (17 September 2026). `Change the ones digit to 0. That's the ten below.` then `Add 10. That's the ten above.` says how, in words they own.",
     "and a Year 4 class stuck on 346 had nothing to act on. `Change the ones digit to 0.` then `Add 10.` says how, in words they own."),
    # Decision 2, in his words: extra knowledge is not a step.
    ("a case that comes up occasionally is taught where it comes up, in the model and the script, and left out of the steps.",
     "a case that comes up occasionally is extra knowledge, the kind sticky knowledge or the teaching carries, so it is taught where it comes up, in the model and the script, and left out of the steps."),
    # Decision 15: the short question is not a thing to avoid.
    ("- `Same digits? Move right.` as a success-criteria step - compressed shorthand the child has to unpack (§10).\n", ""),
])

# ------------------------------------------------------------------ skill route
patch("references/teaching-sequence-skill-based.md", [
    # Decision 6: every form, sentence stems among them.
    ("Choosing the *form* of the success criteria (how-to steps, a reference table, or a labelled set the child matches an instance against) is governed by",
     "Choosing the *form* of the success criteria (how-to steps, a reference table, a labelled set the child matches an instance against, a worked example or sentence stems) is governed by"),
    # Decision 15.
    ("The step names a stage and leaves the child to supply the method: `Read the step size.`, `Find their difference.`, `Same? Move right.`, `Count on and check.` The repair adds the missing meaning: what to look at, what to calculate, what decides a choice, what to count on by. `Work out what each jump is worth.`, `Larger number - smaller number.`, `If they are the same, compare the hundreds.`, `Count on using the answer to check.`",
     "The step names a stage and leaves the child to supply the method: `Read the step size.`, `Find their difference.`, `Count on and check.` The repair adds the missing meaning: what to look at, what to calculate, what decides a choice, what to count on by. `Work out what each jump is worth.`, `Larger number - smaller number.`, `Count on using the answer to check.` A short question that tells the child what to do next is not this fault (`Same? Move right.`)."),
    # Decision 9.
    ("The step carries teaching the child has already had, and the usual sign is a second sentence inside one step.",
     "The step carries teaching the child has already had, and a common sign is a second sentence inside one step that explains or restates it. A second sentence is not a fault in itself: one that gives a condition the step always meets can stay (`If it is halfway, round up.`), and one that only names what the step produced goes."),
    # Decision 2.
    ("When children must choose between several cases, move them to a lookup table or other runnable guide; an occasional case goes under the steps as a note. A condition the method always meets stays in the steps as a sentence: `If you have ten ones, exchange them for one ten.`",
     "When children must choose between several cases, move them to a lookup table or other runnable guide; an occasional case is extra knowledge, taught where it comes up through sticky knowledge or the teaching, not written under the steps. A condition that is part of a step stays in it, as a sentence or a short question: `If you have ten ones, exchange them for one ten.`"),
    # Decision 16.
    ("**Name a familiar or just-taught action only when children genuinely know how to carry it out.**",
     "**Name a familiar action only when children genuinely know how to carry it out from earlier lessons.**"),
    # Decision 10: "short" without "clear first".
    ("its SC is the procedure as a numbered list — short verb-first imperatives, one action per step;",
     "its SC is the procedure as a numbered list — clear verb-first steps, one action per step;"),
    # Decision 14.
    ("**When Concept 2 wraps around Concept 1's procedure, fold the key decision cues into Concept 2's SC.**",
     "**When Concept 2 wraps around Concept 1's procedure, carry the steps it needs into Concept 2's SC in Concept 1's own words.**"),
    ("Fix: embed the key decision cues from Concept 1 into the relevant Concept 2 step. Not the full SC verbatim, but enough to trigger the right procedure: \"Convert to the same unit → find the units → pick your fact (60, 12 or 7) → × for smaller, ÷ for larger\". This keeps the SC as one self-sufficient list children can work from without needing to look anywhere else.",
     "Fix: carry the Concept 1 steps the Concept 2 problem needs into Concept 2's SC, at the point they are used, word for word as the class used them. A shortened or reworded version reads to a child as a new rule. For a lesson that converts and then compares, Concept 2's list starts with Concept 1's converting steps exactly as they were, then adds the comparing steps. This keeps the SC as one self-sufficient list children can work from without needing to look anywhere else."),
])

# ------------------------------------------------------------------ the designer
patch("agents/lesson-designer.md", [
    # Decision 10: the copy paragraph becomes a pointer that keeps the self-check.
    ("**Criteria say what the child does or what good work shows; a table of facts the task uses is a representation.** The nutrient table children read while planning a lunch is `rep-00x`; the criteria are what the plan must do. Recognition (name this tooth, this turn) is the one case where the labelled set is the criteria. Use as few words as possible without making the child work out what you mean: each step is one sentence that tells a stuck child what to do next, not which stage they are at, a step already clear is left alone, and there is no word or step target. Before keeping the steps,",
     "**Criteria are what a child who gets stuck looks at and uses; `preferences.md` → Success Criteria owns what they are, their form (a table of facts is a representation; recognition is the one case where a labelled set is the criteria; sentence stems count), and how many words a step takes.** Before keeping the steps,"),
    ("A condition the method always meets stays in the steps as an `If...` sentence; a lookup earns its place when it makes several cases easier to follow. `teacher-voice.md` → Success criteria carries the user's own rewrites of short-but-vague steps. `preferences.md` → Success Criteria owns these judgements and `teaching-sequence-skill-based.md` → Writing the Success Criteria the mechanics.",
     "`teacher-voice.md` → Success criteria carries the user's own rewrites of short-but-vague steps, and `teaching-sequence-skill-based.md` → Writing the Success Criteria the mechanics."),
    # Decision 5.
    ("is worth building live and leaving on the wall; the slide then carries the flipchart cue and the working wall reproduces it.",
     "is worth building live and leaving on the wall; the slide then carries the flipchart cue and the criteria are offered to the working wall, which puts up the exact same steps if it takes them."),
    # Decision 14.
    ("keeping steps identical across My/Our/Your Turn, folding Concept 1 cues into wrap-around Concept 2)",
     "keeping steps identical across My/Our/Your Turn, carrying Concept 1's steps in their own words into a wrap-around Concept 2)"),
])

# ------------------------------------------------------------------ the reviewer
patch("agents/design-reviewer.md", [
    # Decision 6.
    ("- success criteria are usable actions, decisions or recognition categories that match the taught performance, rather than a list of facts or a lesson outline.",
     "- success criteria are what a child who gets stuck can use (actions, decisions, recognition categories, or sentence stems in a lesson where children explain or write) and match the taught performance, rather than a list of facts or a lesson outline."),
    # Decision 9.
    ("The opposite miss is real too: a step of two sentences, or one that explains a word or suggests content, is carrying teaching, and a step a stuck child can already act on is left as it is.",
     "The opposite miss is real too: a step that explains a word or suggests content is carrying teaching, and so is a second sentence that restates the step or only names what it produced (a second sentence is not a fault in itself), and a step a stuck child can already act on is left as it is."),
    # Decisions 10 (stays, not may stay), 2 and 15.
    ("A condition the method always meets may stay in the steps as an `If...` sentence; use a lookup where it makes multiple cases easier to follow.",
     "A condition that is part of a step stays in it, as an `If...` sentence or a short question that tells the child what to do next (`Same? Move right.`), and extra knowledge belongs to sticky knowledge or the teaching; use a lookup where it makes multiple cases easier to follow."),
])
