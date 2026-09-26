"""The design reviewer release, step 3: decision 7 (his 2, "2. yes"). Three of
the reviewer's checks point at a `preferences.md` section for a case the
routing card never listed, so the card, which is the reviewer's whole reading
assignment, never opened them: a name arriving with its context (Slide
Philosophy), a made-up person present in a beat (Lesson Designer visual-need
boundary) and a made-up case standing for a group (Source and Scenario
Integrity). Each trigger gains its case, beside its section.

Each new trigger is written to fire on something the reviewer can see in the
lesson before judging it, because the comment above
`ALWAYS_READ_REVIEW_SECTIONS` says a trigger that needs the defect noticed first
never fires: a real person, place, organisation or event the view's `Names on
the board` lists, a made-up person whose words or name are in the beat, a
made-up case in a lesson whose objective is about a group. Each keeps the limit
its section brings (a made-up person or a label is not the name case; a person
only referred back to is not present; a case whose person is the subject, or a
maths or English scenario, needs no group sentence), and no line the earlier
topics pinned is changed: each trigger's last line keeps its words and the new
sentence follows it. Each names the paragraph it is for, as the Vocabulary note
does, and the name case opens only the subsection that holds its paragraph
(`Lesson Designer content boundaries`, about 18 KB), not all three of Slide
Philosophy's Lesson Designer parts (about 34 KB).

The name case first fired on any listed name. The first independent check
(`rv-release-check.md`, its item 1) found that it then fired on 43 of the 53
saved designs, 20 of them for nothing: made-up children in maths or PSHE
questions, labels such as `Chart A` or `Day A`, and words the list catches that
are no name at all (`LESSON`, `PSHE`). The paragraph it opens is about real
people, places, organisations and events, which is now what fires it, in the
paragraph's own words; `rv_17_name_trigger_table.py` shows each saved design
before and after."""
from _patch import PACKET, assert_present, replace_once

replace_once(
    PACKET,
    '        "in its script, or when a substantial task arrives with "\n'
    '        "instructions only.",\n',
    '        "in its script, or when a substantial task arrives with "\n'
    '        "instructions only."\n'
    '        " Read its `Lesson Designer content boundaries` too whenever the "\n'
    '        "view\'s `Names on the board` lists a real person, place, "\n'
    '        "organisation or event, for `A name, or a thing the class has "\n'
    '        "never met, arrives with its context`; a made-up person or a label "\n'
    '        "such as `Chart A` is not this case.",\n',
)

replace_once(
    PACKET,
    '        "units genuinely name no such thing is right to have none.",\n',
    '        "units genuinely name no such thing is right to have none."\n'
    '        " Read it too whenever a beat quotes, voices or names a made-up "\n'
    '        "person who is present in it, for `A person the lesson invents "\n'
    '        "counts as something in the world`; one only referred back to is "\n'
    '        "not this case.",\n',
)

replace_once(
    PACKET,
    '        "teaches, and any beat that invites children\'s own experience.",\n',
    '        "teaches, and any beat that invites children\'s own experience."\n'
    '        " Read it too when a made-up person or story stands for a group "\n'
    '        "the objective is about (`An invented case is evidence about the "\n'
    '        "group`).",\n',
)

for words in (
    "Read its `Lesson Designer content boundaries` too whenever the",
    "Read it too whenever a beat quotes, voices or names a made-up",
    "Read it too when a made-up person or story stands for a group",
):
    assert_present(PACKET, words)
print("card done")
