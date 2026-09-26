"""Release 7A (4.2.293), step 4: sticky knowledge.

A4, one home (the fold, and SA settled item 5, his "yes"): `preferences.md` ->
Sticky Knowledge is the home. It takes, word for word where it can, G09's
"trace each one forward to the stage that needs it", G12 (a sticky fact is not
where an idea goes, the pewter plates as its plain example), H05 (a fact that
would reveal the thinking a later task requires is left off that task unless the task
genuinely needs it as a reference), H08 (phrasing consistency) with SA decision
7 (his "Yes": the wall uses the lesson's own words, shortened only when they
genuinely cannot fit, and then still a whole sentence a teacher would say), and
H02 corrected (the reference on each unit, placement being the slide
designer's). The designer's copy of G02 and G03 (G08) goes; the home keeps G03's
"and", where the copy read as four alternatives. The designer's section keeps a
pointer, the two examples beside the "could a child have said it" test (G10),
G11 (pinned QC-S05), the recording (H03, and H05's last sentence), H06 (pinned
SC-F20) and H07 (pinned SC-F19) word for word, and H09 as corrected below.
Settled item 5: "Teacher may provide - use it" becomes judge a listed sticky fact
like anything else in the plan, and keep one the teacher marks as required.

A5, where a sticky fact sits on the slide that teaches it (SA settled item 6,
turned round: "I dont think this needs to be a clear rule like 'sticky knowledge
statement always at top' ... That doesn't mean every slide I wanted was this
structure"; corrected read-back: the because or so explains the one key point;
routes 7h and 7k, "usually at the top, as you usually explain, not a fixed
rule"). Words only: the validator already takes either placement (the headline,
or the star line through `takeaway`, never both). The content route's lead says
"usually"; its story went to the log in a1 and its reason stays as a clause, the
top line never a caption of the picture; the withheld-fact paragraph becomes
the shape for a beat that withholds its fact, and a choice where the fact reads
better last; the skill route, the contract, the designer and the slide guide
follow. Not teaching tool goes from the designer's section (a sticky fact may be
the sentence a Teach lands). The slide guide's pointer to "the lesson-designer's
'phrasing consistency' rule" follows the rule to its home."""
from _patch import CONTENT, LD, OT, PREF, SKILL, SSC, replace_once

# --- A4: preferences.md -> Sticky Knowledge ------------------------------------------

replace_once(PREF,
             "In a knowledge subject it is too narrow, because the facts are the learning and a task-shaped objective can be met without them: an RE lesson named",
             "In a knowledge subject it is too narrow, because the facts are the learning and a task-shaped objective can be met without them, so trace each one forward to the stage that needs it: an RE lesson named")
replace_once(PREF, '''Zero separate sticky facts is acceptable when nothing distinct earns the role because the objective, representation or success criteria already carries the necessary idea.

Short, clear, child-readable. Appears contextually — at the point in the lesson where children need it. Some facts appear during teaching; some during independent practice as a reference; some at both points.

Document when each fact appears — not where on the slide (that's the PPT designer's decision), just which part of the lesson it belongs to.
''', '''Zero separate sticky facts is acceptable when nothing distinct earns the role because the objective, representation or success criteria already carries the necessary idea.

A sticky fact is not where an idea goes: `tiny pewter plates were made for play` was a lesson on continuity and change filed as a fact, and the idea then had nowhere to live; `concepts` is where it lives, in every route.

Short, clear, child-readable. Appears contextually — at the point in the lesson where children need it. Some facts appear during teaching; some during independent practice as a reference; some at both points.

Record when each fact appears through the reference on each unit (`stickyKnowledgeRefs`): which part of the lesson it belongs to, not where on the slide, which is the slide designer's decision. A fact that would reveal the thinking a later task requires is left off that task, unless the task genuinely needs it as a reference.

**Phrasing consistency.** When a sticky fact corresponds to a Teach slide's key sentence, use the same wording in both places: children encode the phrase during teaching, and meeting the same phrase again as a reference strengthens the trace. If it is the same idea, write it identically. The repetition is across slides: the phrase on the Teach matches the later Practise reference, the worksheet, the Apply and the working wall, where it is shortened only when it genuinely cannot fit, and then is still a whole sentence a teacher would say. It does not mean the sentence appears twice on one slide.
''')

# --- A4 and A5: the lesson designer's Sticky Knowledge --------------------------------

replace_once(LD, '''Up to 3 facts/rules children carry away and still hold next week. Naming one claims it as today's learning, so the lesson makes good on it: taught, needed by a later stage, drawn on by the final task, or checked by an earned ending where the final task honestly cannot carry it (`preferences.md` → Sticky Knowledge owns the why and the RE case). In a skill lesson the test is still: for children to succeed at LO, they need this. In a knowledge subject the facts are the learning and a task-shaped objective can be met without them, so trace each one forward to the stage that needs it. Then ask of each one:''', '''`preferences.md` → Sticky Knowledge is the home: read it before naming a sticky fact. This section adds the test's two examples, how you record the facts, and three rules for the slides that carry them. Then ask of each one:''')
replace_once(LD, ''' And a sticky fact is not where an idea goes: `tiny pewter plates were made for play` was a lesson on continuity and change filed as a fact, and the idea then had nowhere to live; `concepts` is where it lives, in every route. Teacher may provide - use it. Else decide core rule/definition/fact everything hangs on. Short, child-readable. Not teaching tool - reference/retention anchor.

Appears contextually at exact point needed. Define each once in top-level `stickyKnowledge` array stable `sk-###` ID. Attach ID to every exact source unit where should be available via `stickyKnowledgeRefs`. No broad during teaching/both marker. If fact would reveal thinking later task requires, leave ID off that task. If genuinely needed as reference, include. Availability pedagogical belongs here; downstream decides only physical treatment.''', ''' When the teacher's plan lists sticky facts, judge them like anything else it offers, and keep one the teacher marks as required. Else decide core rule/definition/fact everything hangs on. Short, child-readable. Reference/retention anchor.

Appears contextually at exact point needed. Define each once in top-level `stickyKnowledge` array stable `sk-###` ID. Attach ID to every exact source unit where should be available via `stickyKnowledgeRefs`. No broad during teaching/both marker. Availability pedagogical belongs here; downstream decides only physical treatment.''')
replace_once(LD, '''**Phrasing consistency:** When sticky corresponds to Teach slide key sentence/fact, use same wording both places. Children encode phrase during teaching; same phrase as reference later strengthens trace. If same idea, write identically. Cross-slide repetition - phrase on Teach matches Practise reference later, worksheet, Apply. Does not mean appears twice on same slide. When Teach carries sticky and key sentence same idea, that's one entry on that slide, not two. Write once (typically sticky fact). Don't restate as separate key sentence.''', '''When Teach carries sticky and key sentence same idea, that's one entry on that slide, not two: write it once, as the headline or as the star line, never both (`teaching-sequence-content-based.md` → `The landed sentence usually leads the board`). Don't restate as separate key sentence.''')

# --- A5: the content route ------------------------------------------------------------

replace_once(CONTENT,
             "Once means once: the landed sentence is the `headline`, and it is there rather than at the foot of the slide because it is the first thing a child reads; never twice, and never again in the `explanation`. The one beat that keeps its sentence for the end, because children reach it themselves, is written with a `takeaway` instead, under `The landed sentence leads the board` below.",
             "Once means once: the landed sentence is usually the `headline`, and it is there rather than at the foot of the slide because it is the first thing a child reads; never twice, and never again in the `explanation`. A beat that lands its sentence last is written with a `takeaway` instead, under `The landed sentence usually leads the board` below.")
replace_once(CONTENT,
             "**The landed sentence leads the board.** It goes in the `headline`, because that is the first line a child reads and the largest line the builder draws, and a class that reads the destination first has something to hang the next four minutes on. When that sentence",
             "**The landed sentence usually leads the board.** It usually goes in the `headline`, because that is the first line a child reads and the largest line the builder draws, and a class that reads the destination first has something to hang the next four minutes on; that is how this teacher usually explains, not a rule for every slide. When that sentence")
replace_once(CONTENT,
             "This file used to offer a second shape, where `takeaway` carried the sticky fact and the headline named what was on the board. That shape spent the first line on a caption. A Year 4 history beat took it on 17 September 2026 and opened `A photograph of Victorian children who worked.`, with `Victorian children from poor families worked because their families needed the money` demoted to the star line at the bottom; the teacher rebuilt the slide by hand to put the sentence back at the top. A child can already see that the picture shows children working. What they cannot see is why, and that is what the top line is for.",
             "Whatever leads, the top line is never a caption of the picture: a child can already see what the picture shows. What they cannot see is why, and that is what the top line is for.")
replace_once(CONTENT,
             "Keep a `takeaway` referencing a sticky fact for the beat that deliberately withholds its fact until children have reached it: a discovery route, or a comparison whose point is that they see it themselves. There the headline is the move the class is making (`Two children, one pit, two different days`), never a description of the picture, and the fact lands at the end where it was earned.",
             "A `takeaway` referencing a sticky fact lands it last, as the star line. It is the shape for a beat that deliberately withholds its fact until children have reached it (a discovery route, or a comparison whose point is that they see it themselves), and a choice wherever the fact reads better last. The headline is then the move the class is making (`Two children, one pit, two different days`), never a description of the picture, and the fact lands at the end where it was earned.")

# --- A5: the skill route, the contract, the slide guide -------------------------------

replace_once(SKILL,
             "It is the knowledge route's Teach beat with the same fields, so it lands a `takeaway` and can ask a question that makes the class look while it runs.",
             "It is the knowledge route's Teach beat with the same fields, so it lands its sentence, usually as the `headline`, and can ask a question that makes the class look while it runs.")
replace_once(SKILL,
             "A Teach beat leaves something the child should still know at the end, which is why it has a takeaway.",
             "A Teach beat leaves something the child should still know at the end, which is why it lands a sentence.")

replace_once(OT,
             "A Teach slide lands its sentence once, at the top. `takeaway` is `null`",
             "A Teach slide lands its sentence once, usually at the top. `takeaway` is `null`")
replace_once(OT,
             "A `takeaway` referencing a sticky fact is for the beat that withholds its fact until children have reached it, where the headline names the move the class is making rather than the picture (`teaching-sequence-content-based.md`, Teach):",
             "A `takeaway` referencing a sticky fact lands it last, as the star line: the shape for a beat that withholds its fact until children have reached it, and a choice where the fact reads better last, and the headline then names the move the class is making rather than the picture (`teaching-sequence-content-based.md`, Teach):")

replace_once(SSC,
             "When a slide's sticky-knowledge fact is the same sentence as the slide's Teach key sentence, render the sentence once, with its sticky-knowledge visual treatment (the ✨ marker, or whatever the template provides), never twice.",
             "When a slide's sticky-knowledge fact is the same sentence as the slide's Teach key sentence, render the sentence once, never twice: as the headline when the unit's headline carries it, and with its sticky-knowledge treatment (the ✨ marker, or whatever the template provides) as the star line when the unit references it.")
replace_once(SSC,
             "The cross-slide repetition the lesson-designer's \"phrasing consistency\" rule asks for happens *between* slides",
             "The cross-slide repetition the \"phrasing consistency\" rule in `preferences.md` → Sticky Knowledge asks for happens *between* slides")
print("sticky knowledge written once")
