"""Release 7A (4.2.293), step 6: the Apply, one home, and leaving it out of a
lesson that named an idea.

SA decision 9 (his "yes"): the ready-made reason ("Your Turn and answers is
sufficient AFL here - no distinct synthesis task is needed") stays for a lesson
whose learning is a fact or a method; a lesson that named an idea says in its
reason where the idea met a case it was not taught on (usually the Practise), or
earns an Apply that takes it there; the reviewer opens the Apply rules when a
lesson named an idea, has no Apply, and its reason does not say where that
happened. Its behaviour case forbidding a demand for an extra Apply slide
(`cumulative-scale-learning`) stays.

The fold (J07, J11): `preferences.md` -> The Apply Slide is the home of why an
ending is earned and what it is judged against; it takes the designer's J11
(keep rehearsal within practice, omit the ending when practice already draws on
the intended learning, the three repairs in order) and names the intended
learning as the read-back sentence that closes the walk-through and the sticky
knowledge (the stale "quality-lock sentence" goes, settled item 12). Its
"which is the only place that decides it" goes; the designer's section holds
what an Apply has to be, its shapes and its recording, and keeps J08, J09 and
J10 (QC-S27 pinned), J17 and J48 word for word.

Settled item 11 (his "yes"): in maths, reasoning and problem solving are
`practise` beats placed as `subject-maths.md` says, and the last is the Apply
only when it closes the lesson and asks more than the Your Turns did.
Settled item 12 (his "yes"): K02's `ending.kind` is "Reflect" with a capital R,
as the program wants, and the retired "APPLY SLIDE" prose line goes."""
from _patch import LD, PACKET, PREF, replace_once

# --- the home ------------------------------------------------------------------------

replace_once(PREF,
             "A lesson that doesn't earn one says so and says why, so the teacher can see it was decided rather than forgotten.\n",
             "A lesson that doesn't earn one says so and says why, so the teacher can see it was decided rather than forgotten. One whose learning is a fact or a method may say its Your Turn and answers were enough; one that named an idea says where the idea met a case it was not taught on (usually its Practise, on evidence children had not seen), or earns an Apply that takes it there.\n")
replace_once(PREF,
             "Judge the synthesis against the learning the lesson named, not only the performance the objective names. A Your Turn that shows the performance while a sticky fact or a taught understanding sits outside it has not synthesised the lesson. The first repair is to reshape the final task so it draws on that learning, because the ending exists to draw together what was built; a separate check is the fallback for learning a personal or product task honestly cannot carry (`What a Lesson Is For`).",
             "Judge the synthesis against the learning the lesson named, not only the performance the objective names; the lesson names it in the read-back sentence that closes the walk-through and in its sticky knowledge. Keep useful rehearsal within practice, and omit the ending when practice already draws on the intended learning. A Your Turn that shows the performance while a sticky fact or a taught understanding sits outside it has not synthesised the lesson. The repairs, in order: reshape the final task so it draws on that learning, because the ending exists to draw together what was built; earn an ending as the check for learning a personal or product task honestly cannot carry; drop the learning from the lesson's claims only when it was never today's (`What a Lesson Is For`).")
replace_once(PREF,
             "The rest of it, including what an Apply has to be to earn its place and the shapes it can take, lives in the Apply Slide section of the lesson-designer agent, which is the only place that decides it.",
             "The rest of it, what an Apply has to be to earn its place, the shapes it can take and how it is recorded, lives in the Apply Slide section of the lesson-designer agent.")

# --- the lesson designer's Apply Slide -------------------------------------------------

replace_once(LD,
             "Populate top-level `ending` object (`ending.kind` = \"reflect\" for Reflect, `ending.beat` carrying source unit); don't fill retired \"APPLY SLIDE\" prose - structured ending contract authoritative.",
             "Populate top-level `ending` object (`ending.kind` = \"Reflect\" for Reflect, `ending.beat` carrying source unit) - structured ending contract authoritative.")
replace_once(LD,
             "A fresh case can earn it when children must select or connect evidence anew. Keep useful rehearsal within practice; omit the ending when practice already draws on the intended learning. Intended learning means what the quality-lock sentence and the sticky knowledge name, not only the performance the objective names: a practice that shows the performance while a taught fact or understanding sits outside it has not synthesised the lesson. Prefer reshaping the practice so it draws on that learning, because the final task exists to draw together what was built; earn an ending as the check for learning a personal or product task honestly cannot carry; drop the learning from the lesson's claims only when it was never today's (`preferences.md` → What a Lesson Is For).",
             "A fresh case can earn it when children must select or connect evidence anew. `preferences.md` → The Apply Slide owns when practice already draws on the intended learning, what that learning is, and the repairs in order.")
replace_once(LD,
             "- Maths: Apply mixes day's skill with problem-solving - one extended question or small set mixed-context where children decide which method applies.",
             "- Maths: reasoning and problem solving are `practise` beats placed as `subject-maths.md` says; the last is the Apply only when it closes the lesson and asks more than the Your Turns did. Then Apply mixes day's skill with problem-solving - one extended question or small set mixed-context where children decide which method applies.")
replace_once(LD,
             "When not included, say explicitly why. \"Your Turn and answers is sufficient AFL here - no distinct synthesis task is needed\" is complete justification.",
             "When not included, say explicitly why. For a lesson whose learning is a fact or a method, \"Your Turn and answers is sufficient AFL here - no distinct synthesis task is needed\" is complete justification. A lesson that named an idea in `concepts` says where the idea met a case it was not taught on (usually its Practise, on evidence children had not seen), or earns an Apply that takes it there (`preferences.md` → The Apply Slide).")

# --- the reviewer's routing card --------------------------------------------------------

replace_once(PACKET, '''        "The Apply Slide",
        "Read when Apply may be unearned or repeat Your Turn.",''', '''        "The Apply Slide",
        "Read when Apply may be unearned or repeat Your Turn, and when a lesson "
        "that named an idea has no Apply and its reason does not say where the "
        "idea met a case it was not taught on.",''')
print("the Apply written once")
