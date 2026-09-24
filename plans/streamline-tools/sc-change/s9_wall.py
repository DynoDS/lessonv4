"""Success criteria (4.2.288): the working wall, for decisions 5, 7, 11 and 12.
The teacher: "I don't think it should be reworded. I'm sure it can figure out
how to put it on." and "If it goes on the working wall, it should be the exact
same steps ... there's still the rules about it looks at previous lessons and
lessons after to decide if a wall should be built." """
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


WALL = "agents/working-wall-designer.md"
patch(WALL, [
    # Decisions 12 and 11 (the orphaned "exception above").
    ("The 2-line cap exception above does NOT extend to SC steps; if the full SC won't fit at the wall's fixed A3 size, remove non-SC extras from that card; if it still will not fit, omit the card, but never reword the steps.",
     "SC steps are never shortened, split or reworded to meet the two-line limit or the character budget. If the full SC won't fit at the wall's fixed A3 size, make room: take the card's picture off (a step then has about 106 characters rather than 62), remove non-SC extras, or carry the list, in order, over two cards of the same type and title; if it still will not fit, omit the card, but never reword the steps."),
    # Decision 5.
    ("Success Criteria (whose draw-live marking is what sends a reference to your wall)",
     "Success Criteria (whose draw-live marking offers a reference to your wall; the wall-worthy test still decides)"),
    # Decision 12, where the budget is taught.
    ("read from the back of the room. Write it short first, and let the build's refusal\n"
     "message, which names the card, the item and the exact overage, aim the repair.",
     "read from the back of the room. Write it short first, and let the build's refusal\n"
     "message, which names the card, the item and the exact overage, aim the repair.\n"
     "A success-criteria step is the one item you never write short: it is copied word\n"
     "for word, and the card makes room for it instead (Rules That Never Change)."),
    ("Choose the supported text budget for the actual card configuration. Preserve readable learning and response examples rather than adding or removing a picture to gain a character allowance.",
     "Choose the supported text budget for the actual card configuration. Preserve readable learning and response examples rather than adding or removing a picture to gain a character allowance; the one exception is a success-criteria step, where taking the card's picture off is how the whole step fits."),
])

patch("references/working-wall-preferences.md", [
    ("| Worked-example step | ≤ 60 characters — \"Read the conjunction — what job does it do?\" fits; longer steps need splitting. |",
     "| Worked-example step | ≤ 60 characters beside a picture — \"Read the conjunction — what job does it do?\" fits; a longer step you write needs splitting, but a success-criteria step is copied word for word and the card makes room instead (no picture, or the list over two cards). |"),
])

patch("agents/working-wall-designer-focused-repair.md", [
    ("An item over its own character budget is different: it fits only reworded, and rewording is not this round's to do, so leave that finding unrepaired and say it needs the wall designer's wording.",
     "An item over its own character budget is different: it fits only reworded, and rewording is not this round's to do, so leave that finding unrepaired and say it needs the wall designer's wording. A success-criteria step is never reworded by anyone, so for one of those say instead that its card needs room (its picture off, or its list over two cards)."),
])

STEPS_OLD = '["Find the neighbouring multiples.", "Find halfway.", "Choose the closest."]'
STEPS_NEW = '["Change the ones digit to 0.", "Add 10.", "Mark halfway and your number.", "Round to the nearer ten. If it is halfway, round up."]'
patch("references/working-wall-card-contracts.md", [
    # Decision 7, and the word-for-word rule the part lacked.
    (f"| `cards[].parts[].steps` | Optional numbered method, when this part *is* the strategy: `{STEPS_OLD}`. Each step numbers itself in the part's colour. |",
     f"| `cards[].parts[].steps` | Optional numbered method, when this part *is* the strategy: `{STEPS_NEW}`. When the steps are the lesson's success criteria they are copied word for word, the same number of steps and the same colour marks, as on a worked-example card. Each step numbers itself in the part's colour. |"),
    (f'      "steps": {STEPS_OLD}\n', f'      "steps": {STEPS_NEW}\n'),
])

patch("references/working-wall-visual-language.md", [
    # Decision 11: the old visual gate's exception is gone.
    ("When none of these gives an honest visual and the card does not qualify for the success-criteria exception, it stays on the slides rather than going up as text.",
     "When none of these gives an honest visual and the card does not pass the wall-worthy test as a text-led reference (`working-wall-card-contracts.md`), it stays on the slides rather than going up as text."),
    ("Carry a visual (diagram, photo, or emoji cue), or leave the content on the slides. The one exception is a step-by-step success-criteria card. |",
     "Carry a visual (diagram, photo, or emoji cue), or leave the content on the slides, unless it passes the wall-worthy test as a text-led reference (`working-wall-card-contracts.md`), as the lesson's step-by-step success criteria often do. |"),
])

# Decision 5 in the contract and the drawLive check's own note.
patch("references/output-template.md", [
    ("The slide carries the flipchart cue for it and the working wall reproduces it. It does not prescribe where the teacher writes.",
     "The slide carries the flipchart cue for it and it is offered to the working wall, which puts up the exact same steps if it takes them. It does not prescribe where the teacher writes."),
])
patch("scripts/check-drawlive-handoff.py", [
    ("`flipchart: true`, and the working wall already reproduces a flagged reference.",
     "`flipchart: true`, and the working wall is offered a flagged reference."),
])
