"""Record Daniel's answers of 23 September 2026 in the three topic ledgers,
word for word, before anything changes. Each block goes in front of the
ledger's "## Decisions for Daniel" heading."""
from pathlib import Path

PLANS = Path(__file__).resolve().parents[1]

AK = '''## Decisions taken (23 September 2026)

Daniel answered all eleven in one message. His words first, then what each
means for the change.

1. "Speaker notes and board should never be combined or seen as one. You have
   the board, which has the teaching, activities, helpers and pictures to point
   to. The speaker notes are seperate and used by cover, tired teachers, new
   inexperienced teachers, to guide them on how to speak, share and present
   that information on the board in a conversational way." The board holds the
   teaching, the activities, the helpers and the pictures to point to. The
   script is a separate guide for a cover, tired or new teacher on how to say
   and present what is on the board, conversationally; it never counts as
   having taught something the board lacks. Anything a later beat relies on is
   on the board first. The designer's final check ("spoken preparation") and
   the reviewer's "without forcing every spoken reason into a panel" are
   reworded to match, and history's "on the board or in the script" becomes
   "on the board". The rule that a script which gives an answer away still
   counts stays.
2. "The plugin can sometimes be shown medium term plans which is a sequence of
   lessons. This gives it context to know what was taught beforehand
   (roughly). Its as simple as that." The suggested proof rule (the brief says
   so, or the saved slides show it) is not adopted. A plan's sequence is the
   rough context for what came before: the lessons before this one in the plan
   are taken as taught by the time this one is taught. Consistent with that,
   the "previous lesson" handed to the designer is the one before this lesson
   in the plan, not simply the last one built (a code fix with its test).
   This reading was stated back to him.
3. "Agree."
4. "Agree."
5. "Agree"
6. "Agree"
7. "Agree, but also, not always needed." Where a source came from is said once,
   in children's words, when it matters to the lesson; not every source needs
   a line about where it came from.
8. "I don't get this one. I wasn't saying those words were bad, I'm saying
   they were just thrown on the board with no previous context, and assumed
   they know what these things are. If I just go on a random slide and see
   those slides I saw, it's just too much cognitive overload." Not decided:
   re-explained and asked again. His principle stands for the whole topic:
   words and names thrown on the board with no context overload the class.
9. "Agree"
10. "Agree"
11. "Agree."

'''

TD = '''## Decisions taken (23 September 2026)

Daniel answered all twelve in one message. His words first, then what each
means for the change.

1. "Agree."
2. "We shouldnt outright ban 2 teach slides one after the other, especially
   when the slide designer is told to break heavy slides into more than one
   and other situations where it may be best decision. What it cannot do
   though is teach them something, then teach them something different,
   because You can then forget that first thing. The whole point is you teach
   children something and they do something immediately with that information
   before you teach them more things. It's cognitive overload, 101." The
   suggestion is taken, with his reason: the fault is a second new idea taught
   before children have done something with the first. Two teacher slides in
   a row carrying one idea (a heavy slide split, or another case where it is
   the best decision) are fine.
3. "It should never be a beat with a made up task after it, of course. The
   whole point of scene setting is just to make it familiar to the children.
   Rather than jumping straight into something abstract or something
   unfamiliar or something that makes no sense. What's the purpose of it?
   Children need to see things. They need to know things. They need to know
   the purpose of things. It doesn't have to be its own slide. It could if it
   makes sense. I just don't want to jump into something completely random
   where any human thinks, whoa, where did this come from?" Scene-setting
   exists to make the topic familiar and show children what it is and what it
   is for before anything abstract or unfamiliar. It may be its own slide or
   the opening of the first Teach, as the designer judges; it is never a beat
   with a made-up task after it. His reason goes into the rule.
4. "really understand this one. If we want them to discover two things, then
   isn't the whole point of a discovery lesson giving them a task to discover
   that thing? Whether that's a task that gets them to discover both at the
   same time, or whether the lesson designer thinks it's better to discover
   one thing in one task and then something else in a different task and it
   builds on." The suggestion (turn it into a knowledge lesson) is not taken.
   A discovery lesson may discover two things: one task that reveals both, or
   two discovery tasks in sequence, the second building on the first, as the
   designer judges. The validator's discovery shape changes to allow a second
   explore-then-explain cycle, with its tests. This reading was stated back to
   him.
5. "Agree."
6. "Agree,"
7. "Agree,"
8. "Agree,"
9. "Agree,"
10. "I think so." The suggestion is taken.
11. "Agree."
12. "Agree."

'''

QC = '''## Decisions taken (23 September 2026)

Daniel answered all ten in one message: "Q1. Agree. Q2. Agree. Q3. Agree. Q4.
Agree. Q5. Agree. Q6. Agree. Q7. Agree. Q8. Agree. Q9. Agree, Q10. Agree."
Every suggestion is taken as written below.

'''

for name, block in (("assumed-knowledge", AK), ("teach-then-do", TD), ("quick-checks", QC)):
    path = PLANS / f"2026-09-22-{name}-ledger.md"
    text = path.read_text(encoding="utf-8")
    assert "## Decisions taken (23 September 2026)" not in text, name
    assert text.count("## Decisions for Daniel\n") == 1, name
    text = text.replace("## Decisions for Daniel\n", block + "## Decisions for Daniel\n", 1)
    path.write_text(text, encoding="utf-8")
    print("recorded", name)
