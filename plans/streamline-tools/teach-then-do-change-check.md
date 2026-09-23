# Independent check: the Teach then Do fold (4.2.285, uncommitted, against 3de9c956)

What I did: read the brief, the ledger (all 309 rows, the decisions, both rounds of Daniel's replies and the proposals they answered), the mapping and the change plan; read every hunk of the diff and the old text of each changed section from git; ran a sentence-by-sentence comparison of every edited instruction file against its old text; checked all 66 changed rows by hand against their ledger quotes; confirmed every "unchanged" row pins all of its ledger quotes and that each still sits under its old heading; read the neighbours of every moved paragraph; searched the whole plugin for wording the change now contradicts; ran the Python suite (2,100 passed, 1 skipped), the builder and top-level JavaScript suites (709 and 46 passed, none failed) and the voice harness (21 passed); built a review view for a two-finding discovery design; and ran 26 break-the-rule experiments on a scratch copy of the whole plugin, each against the pin test and the whole Python suite. I changed nothing in the repository except writing this file.

Findings are ordered most serious first inside each heading. Anything I checked and found sound is listed in one line at the end of its heading.

---

## 1. Row by row (the 66 changed rows)

**1a. TD-I01 / TD-I03 (decision 3): the scene's own slide has no way to happen "when that makes sense".**
- Daniel: "It doesn't have to be its own slide. It could if it makes sense."
- New, `preferences.md` rhythm: «In a knowledge lesson the scene is the opening of the first Teach beat, on a slide of its own when that makes sense (the Slide Designer splits the beat there), and never a beat of its own with a made-up task after it.»
- The Slide Designer's own rule (unchanged, `slide-composition-playbook.md` › 6): «When it will not fit one board at the ceiling, cut it at the turn: the scene set on the first slide...». It splits a Teach only when the board will not fit. The Lesson Designer has no field to ask for the split.
- So the parenthesis states a behaviour the Slide Designer does not have, and "when that makes sense" can in practice only mean "when the board overflows". A scene the designer judges worth its own slide, on a board that fits, stays on one slide.
- The content route's new pointer keeps the narrower, older condition: «on a slide of its own when that avoids overloading the first teaching board». The two copies of decision 3 now say different things, and the one the knowledge-lesson designer reads last is the narrower one.
- Fix: either say plainly that the scene gets its own slide when the first board would be too full (and check that with Daniel), or give the Lesson Designer a way to ask for the split and tell the Slide Designer to honour it.

**1b. TD-A11 (decisions 1 and 11): the practical-lesson paragraph can be read as ruling out investigate-first lessons. Unsure how a designer will read it.**
- New: «It opens on the challenge itself, before any teaching, only under the Skill-based route's conditions for a bounded first attempt ... Otherwise the brief teaching comes first and the challenge follows it.»
- Decision 11 was about a first *attempt at the target* ("Can you make the bulb light?"). The new paragraph never says that "challenge" means that, and it applies to every "practical lesson".
- Three unchanged rules allow a practical or exploration before teaching under different conditions:
  - `subject-science.md`: «The practical may come before, during or after explanation. Investigate first when seeing the result creates something useful to explain.»
  - The Discovery route (explore before Teach why).
  - The content route's bounded observation (TD-J49).
- An investigation's goal is rarely "self-evident" and its success is not "visible to the child without the teacher judging it", so read literally the new paragraph sends these lessons to "teaching first".
- Related widening: «a maths lesson opens with the model (`subject-maths.md`)». The file it cites says «**A maths skill lesson opens with the model.**» and rules out only the bounded attempt. The skill route (unchanged) still allows «A short pattern investigation or method comparison may come before direct modelling».
- Fix: one clause saying the challenge here is an attempt at the target itself, and that an investigation or observation first follows the Discovery route, the content route's `observe` and the subject file; and "a maths skill lesson".

**1c. TD-A04: an extra condition the ledger flagged was dropped.**
- Old, designer: «Short explanation + model completing same manageable idea may be one coherent teaching block.»
- New, designer: «It holds an explanation and the model of one idea as one block»; the home (A03): «An explanation and its model may form one coherent teaching block when they develop the same idea.»
- The ledger listed A04 as a near-duplicate "plus: ... and says «Short explanation»". Decision 1 said the home carries "every extra condition the other copies hold". "Short" and "manageable" are now in neither file, and the mapping does not mention them.
- Effect is small, because B01 («the shortest, clearest route») and the five-minute guide (A09) still limit teacher talk.

**1d. TD-J03 folded into J01 without "Explore before Teach why".**
- Old, designer: «Discovery: Explore before Teach why, Use learning after.»
- New, home: «and Discovery as the use of each finding after its Teach why.»
- The change plan said J01 would carry "Discovery (explore, teach why, use each finding)". The exploration-first half is now only in the Discovery route and the code. Low, because both still enforce it.

**1e. TD-J14: the rule lost its only worked case, where J17 and J18 kept theirs.**
- Old: «...leaves the first move a single demonstration away from independent work, and a Year 4 rounding lesson did exactly that: 43 and 45 were modelled, guided once on 48, and then not written by a child until a mixed set twenty minutes and two more moves later.»
- New: «...leaves the first move a single demonstration away from independent work.»
- It is undated and the story is in the log (L2011 to L2017), so the standing ruling allows it. But J17 and J18, in the same section, turned their dated stories into plain examples («a class that can round 43 may not be able to find those two tens»), and the same could have been done here. Low.

**1f. TD-C19 (decision 5): hot-seating's commitment is looser than the decision.**
- Decision 5: keep hot-seating "only when every child first commits (writes a position or picks a side)".
- New: «only when every child first commits to what their character would say, in writing or to a partner, before anyone performs».
- The home's own list of ways every child commits (C01) is «a decision each child writes down, talk partners then a line each, a vote with a reason». Telling a partner, with nothing written, is not on it. Low. The debate line («picks a side and writes one reason») is if anything stricter than the decision.

**1g. TD-D12: one leftover phrase.** The recall format's best use is now «the starter of lesson 2+ in a sequence», but its description still says «Bakes spacing into the Do beat itself.» Very low.

Checked and sound: A03 (decision 2, his words kept whole, "Splitting an overloaded Teach across two slides fixes the presentation" carries B09's point), A12, A13, B06 and B10 (the sufficiency clause moved; B10's "keep that teaching connected to substantive content" is B06's «It must build knowledge of the topic»), B07, B11, B12, B16 (the pointer resolves to the bold label in the designer's Structure Decision), C01, C03 (the verb list and field names both survive), C04, C08, C18, D03 (its portrait example is D02, word for word), E04, E05, F01 and F05 (access now in F01), F03 and F04 (his words kept without the date), F13, G11, H01, H02 (all three homes carried; the task route's pointer names a paragraph that holds them), H03, H04 (decision 10 in his words, both examples), H05, I02 (every clipped sentence carried as whole sentences, and all three limits, I09 to I11, in their own words), J01 (apart from 1d), J02, J12, J13, J15, J16, J19, J20, J29 (moved word for word; I compared each sentence), J17 and J18 (plain examples kept, stories in the new log entry), J21 (now "any two", which matches the code at validator L2700), J32, J39, J40, J48, J59, J61, J73 (now matches the code at validator L2879 to L2891), J76, L07, L10, L15, L17, L18, L23, L24, M04 and M06 (stories in the log). Every pointer name the new text cites (`A practical lesson keeps the teaching short and lets the doing lead`, `Orientation is not automatically a Teach chunk`, `Each major beat changes the state of the lesson`, `Questioning is not doing`) resolves to a bold label in the rhythm section.

---

## 2. Decisions applied faithfully

- **Decision 3 (and his second-round reply): the words follow him; the mechanism does not.**
  - Sound: the purpose in his words («Children need to see things. They need to know things. They need to know the purpose of things.»); the widening beyond "abstract" that his second reply asked for («before anything abstract, unfamiliar or unexplained»); the random-slide test, with going back one or two slides, in his words; "never a beat of its own with a made-up task after it". The proposal's framing ("scene-setting that needs its own slide") was correctly replaced by his.
  - Not sound: "its own slide if it makes sense" (finding 1a).
  - Not carried, which is a choice rather than a fault: his Elizabeth I order example (no word on who she was, what an order is or why governments make them). It is the clearest picture of what the test catches, and it is only in the ledger.
- **Decision 4: follows his words, not the proposal, but goes wider than "two".**
  - Sound: the knowledge-lesson proposal is not used; both of his shapes are there («When one exploration reveals both...», «When the second finding builds on the first, run a second exploration...»); the route check reads «follows each finding»; the code changed in both programs with tests.
  - Wider: the heading says «When the lesson discovers two things», but the text says «more than one thing», and both programs accept any number of findings (the new test's "three findings" shape passes). His decision and the read-back he agreed say "two things". The rhythm holds for any number, so I see no harm, but he agreed to two and should know it is open-ended.
- **Decision 11: done as proposed, but its reach is unclear** (finding 1b).
- **Decision 6: done, but on a premise that did not hold.** The proposal he agreed was "After the fold makes it shorter, put the rhythm section on the always-read list." The fold made it longer: 26,994 characters before, 32,244 after (4,728 words to 5,650). The reviewer now reads it every review; it was already two pages of the reader and is still two. This follows his "Agree", but the thing he was told would happen first did not, and the log's size paragraph does not mention the reviewer's extra reading.
- **Decision 2: faithful.** The home, the second tell, the reviewer's defect, the task route (H05) and J01 all count ideas, not slides, and each says two teacher slides carrying one idea are fine. His words are quoted whole. One note: A03 lists the fine cases after a colon («a heavy slide broken in two, or a scene set on one slide and looked at on the next»), where his words included "other situations where it may be best decision"; "when they carry one idea" is the rule, so I read the list as examples.
- **Decision 1: faithful, apart from 1c and 1d.** The contents line names everything the section holds; "cut" moved only with its three limits; the designer keeps `unlocks`, `minutes`, `thinking`, the launch sentence and the three-decisions paragraph; each route points back; the subject files keep their Do-beat lists.
- **Decisions 5, 7, 8, 9, 10 and 12: each does what his words say, no more and no less** (5 apart from 1f).
  - 5: think-aloud now carries the same "teacher-owned routine" line as the other three; thought tracking and human sequencing were correctly left alone, as the proposal said.
  - 7: all eight items and both code-description fixes are done; "CURRENT" is gone from all three route files.
  - 8: the home, the content route's Do and the reviewer agree; Classroom Norms needed no change.
  - 9: both the content route's count and the reviewer's all-one-channel read now read the task and instruction.
  - 12: the evidence line is now «End with an honest synthesis».

---

## 3. Unchanged rows really unchanged

- **Pins.** All 243 "unchanged" rows pin every one of their ledger quotes (I compared each quote with the pin file: none missing), and every pin passes under the heading the ledger recorded.
- **The skill route's moved block.** Every sentence of the old L213 to L235 is in `## Cycles, and the beats around them`, word for word, apart from the four licensed edits (J14, J17, J18, J21). Cross-references still point the right way: «under the rule below» (J12 to J21), «the structure section below governs which» (J41, above), «the omission test in the Our Turn section». The new section opens straight on «For each concept, use zero or more preparation units» before the prepare unit's JSON is shown, which reads fine because the section itself introduces `prepare`.
- **The task route's staged-task rule (J76).** Now sits after the launch paragraph, above the line; its `launch.steps` reference still reads correctly. The `planWithinTask` sentence left behind in the Output Format Block now stands without its lead-in, but reads on its own.
- **Paragraphs edited around unchanged rows.** I read B09, C05, C10, C11, D04 and E18 (order pin holds), J31, J33 and J44 (the J32 story came out of their paragraph; «The judgement is readiness, not position.» still leads the next sentence), G12, G13, L04 to L06, L08, M05 and Z19, and each still means what it did.
- **Two places that now read slightly against the new wording (unchanged rows, low):**
  - `preferences.md` › Starters (TD-I07): «Both belong to their own beat», «usually right after the question is properly posed on a Set the Task slide». In a knowledge lesson the new rule says the scene is never "a beat of its own". The Starters rule is about keeping orientation out of the starter, so the clash is in wording, not intent.
  - Found in passing, not new: J21's second half says «the slide check refuses two consecutive My Turn slides (`MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`), which is the same board reached by splitting one unit whose examples cannot share a visual». The slide check refuses only consecutive My Turn slides from *different* units (N07, and `slide-design-check.test.js` "one My Turn unit divided across two slides is one move, not two"). This change edited the first half of the same sentence for decision 7 and left the second half describing the check more broadly than it works.

---

## 4. Collateral, and what elsewhere now contradicts the change

- **`README.md` still says the opposite of decision 2.** Its «Design principles (shared across all agents)» list says «**Teach → Do → Teach → Do.** Children process information before the next piece arrives. Never two teach beats back-to-back.» It is for maintainers (only the helper-builder files mention the README), so this is low, but the heading claims it speaks for every agent.
- **A sentence removed with no ledger row.** From the task route's Output Format Block: «Use a separate `plan-checkpoint` source unit only when planning produces a genuinely distinct artefact/beat before the doing.» It is a true duplicate of J76's «Reach for a separate `plan-checkpoint` unit only when planning produces a distinct artefact before the doing begins» and of the Do-the-task paragraph's «Split the plan into its own beat only when...», so nothing is lost. The mapping does not record it.
- **One new instruction.** The designer is now told to read the rhythm section «whole at the start and again before you sequence the lesson». That is two reads of 32 KB rather than one. Decision 1 covers sending the designer there; "again" is new.
- **Two test functions were deleted, not moved** (see section 5).
- Everything else in the diff maps to a row or a decision: both `plugin.json` files are bumped to 4.2.285; the vocabulary pins that named the skill route's `## Output Format Block` now name the new section, which is where those sentences went; the vocabulary contents-line pin follows the new rhythm entry.

---

## 5. Code

**Validator and scaffold (decision 4).**
- Both programs hold the same function word for word, and the new test holds them to the same answer on ten shapes.
- What they accept: the old one-finding shape; then any run of `teach-why, use-learning` or `explore, make-sense, teach-why, use-learning` before `finish`.
- Every accepted shape keeps the rhythm: each Teach why is followed at once by its Use the learning. Two explanations before either is used, an exploration never explained, an explanation before the result is made visible, a missing finish and a missing question are all refused.
- No upper limit on findings (section 2, decision 4).
- Nothing else in the code assumes one explanation per discovery lesson: the only other uses of the kind names are sets. A review view built for a two-exploration design lists all ten beats in order with no error.
- The 54 saved designs give the same results before and after (`td-before-designs.json` and `td-after-designs.json` are identical). The only saved Discovery design in the repo is the one-finding shape.

**Review packet (decision 6).**
- The rhythm is on the always-read list, with the three-Teach procedure kept as what to do once it is open; the two find-it-first triggers are gone; the Slide Philosophy trigger lost its question-to-the-room clause.
- The always-read note names what to look for, and one old trigger is not in it: «when a beat carries a second job that has no beat of its own». The section is read whole, so the rule is seen, but it is the one old way in the note no longer points to. Low.
- The retirement of the Slide Philosophy clause is not protected: the test that pinned it (`test_teaching_reaches_the_board.py`) now only drops its `assertIn`, adding no `assertNotIn`, and the ledger's "retired phrase" pins do not look in code files (section 6).

**Tests: moved, apart from two that were deleted.**
- Moved correctly: the designer's folded copies now pinned in the home plus the pointer; the old triggers now pinned in the always-read note; the H01 test now pins the new wording and asserts the old words are gone; the My Turn message; the discovery message.
- Deleted outright:
  - `test_the_trigger_is_visible_before_the_judgement_is_made` (`test_an_explanation_gets_used_not_restated.py`)
  - `test_the_self_diagnosed_route_is_kept_beside_the_countable_one` (`test_design_review_packet.py`)
- Both tested a trigger that no longer exists, so deleting them is reasonable. The principle the first one guarded ("a trigger must be visible before the judgement") now lives only in code comments, and no test applies it to the triggers that remain.

**Suites.** Python 2,100 passed, 1 skipped. Builder 709 passed, top-level 46 passed, none failed. Voice harness 21 passed. The author's own logs show worksheet, stick-in, working-wall and shared suites green at 08:30, after the last instruction file changed (08:24).

---

## 6. The pin test

**Coverage.**
- `teach_then_do_ledger_pins.json` holds all 309 ledger ids, none missing and none extra, plus three decision rows and the two homes.
- Every "unchanged" row pins all of its ledger quotes, each under the heading it had at 3de9c956.
- Every changed row pins its whole new paragraph. The two exceptions are sound: J02's home is the build log, and DEC-01 is inside the designer's home, which is pinned exactly.
  - This closes the vocabulary check's worst gap, where changed rows were pinned only in fragments.
- The two homes are pinned paragraph by paragraph, in order.
- 40 retired phrases are pinned, all marked "everywhere".

**The experiments.** All 26 ran to completion on a scratch copy of the whole plugin, each against the pin test and then the whole Python suite. None is outstanding. The scratch copy's suite has two failures of its own (`test_helper_coverage.py`, which looks for the real checkout); I discounted those.

| # | What I did | Pin test | Whole suite |
|---|---|---|---|
| E01 | Deleted «Neither half wins merely because it was written first.» from the rhythm home | caught | caught |
| E13 | Added «Two teacher slides in a row are always a fault.» to the rhythm home | caught | caught |
| E16 | Added «A question to the room is always an acceptable Do.» to the designer's rhythm section | caught | caught |
| E21 | Moved the practical-lesson paragraph out of the rhythm section | caught | caught |
| E06 | Moved J76's staged-task paragraph back below the task route's `## Output Format Block` | caught | caught |
| E07 | Dropped «, with how they commit written into the task» from the content route's Do (C04) | caught | caught |
| E17 | Deleted J17's «Find these steps by working the hardest case...» sentence | caught | caught |
| E22 | Reworded I03's pointer to allow «a beat of its own with a short Do after it» | caught | caught |
| E23 | Softened L07's «is a purposeful design defect, not polish» to «is worth a note» | caught | caught |
| E10 | Put «a run of slides that are all the teacher talking» back, in `do-beats.md` | caught | caught |
| E14 | Added a bullet to the reviewer's check list: «any two teacher-presented slides in a row are a purposeful design defect» | caught | caught |
| E11 | Put the retired question-to-the-room clause back into the Slide Philosophy trigger | caught | caught |
| E18 | Code: let the validator accept two explanations before either is used | not caught | caught (the two new discovery tests) |
| E19 | Code: took the rhythm off the reviewer's always-read list | not caught | caught (seven tests) |
| E02 | Deleted the skill route's bounded-attempt conditions («Use it only when the attempt is safe, cheap and quick to reset...») | not caught | **not caught** |
| E03 | Deleted «Do not use it where a wrong attempt looks fine to the child or quietly rehearses an error...» | not caught | **not caught** |
| E24 | Deleted K18's reason («The attempt earns its place only where failure is visible to the child...») from `subject-maths.md` | not caught | **not caught** |
| E08 | Softened J74's «never a second and third task» to «rarely» | not caught | **not caught** |
| E09 | Deleted «A synthesis names and compares positions children actually expressed.» (dialogic route) | not caught | **not caught** |
| E04 | Moved the whole `### When the lesson discovers two things` subsection below the discovery route's `## Output Format Block` | not caught | **not caught** |
| E05 | Moved the whole `## Cycles, and the beats around them` section below the skill route's `## Output Format Block` | not caught | **not caught** |
| E14b | Added a new paragraph at the end of the reviewer's file: «Any two teacher-presented slides in a row are a purposeful design defect, whatever they carry.» | not caught | **not caught** |
| E15 | Added «A discussion question answered by hands up is a Do beat.» to `preferences.md` › Classroom Norms | not caught | **not caught** |
| E11b | Put the retired clause «in its script, when a Do beat is a question to the room rather...» back into the review packet as a comment, touching no pinned line | not caught | **not caught** |
| E12 | Put the slide-count trigger back into the always-read note in new words («treat any two teacher-presented beats that run with no pupil action between them as a defect») | not caught | **not caught** |
| E20 | Put «CURRENT allows a bounded observation» back into the content route | not caught | **not caught** |

Two of the catches were luckier than they look:
- E11 was caught only because my edit rewrote a line the pins hold. E11b, the same retired words added without touching a pinned line, was not.
- E14 was caught only because the reviewer's whole check list is one paragraph, and that paragraph is pinned as L07's home. A new paragraph anywhere else in the reviewer's file (E14b) was not caught.

**Gap 1: a whole section can move below the line the reviewer stops at (E04, E05).** This is the exact failure decision 6 repaired. A pin names its section by heading, so when the heading moves, the pins move with it and still pass. J76 was caught (E06) only because it is a paragraph inside a section that stayed put. Fix: a test that `## Cycles, and the beats around them`, `### When the lesson discovers two things` and J76's paragraph each come before their file's `## Output Format Block`, or more generally that no pin whose section sat above the line now sits below it.

**Gap 2: unchanged rows are pinned only by their ledger quotes, so the sentences around a quote can be deleted or softened (E02, E03, E08, E09, E24).**
- E02 and E03 matter most. The bounded-attempt conditions in the skill route are what the new practical-lesson paragraph points at («only under the Skill-based route's conditions»), and nothing holds them there.
- The home's own restatement of the conditions is pinned exactly, so the designer still meets them there.
- Across the files outside the homes, I count 389 sentences sitting unpinned inside paragraphs that hold a pin. Many are not rhythm rules, so this is a measure of exposure, not of risk.

**Gap 3: exactness stops at the two homes (E14b, E15).** A new paragraph that negates a rule is caught inside the rhythm section or the designer's rhythm section, and nowhere else, including the reviewer's file and the rest of `preferences.md`.

**Gap 4: a retired phrase in code, a reworded return, and retired wording with no pin (E11b, E12, E20).** The retired-phrase check read only instruction files, never the program a code phrase left (E11b). A reworded return (E12) is beyond any phrase pin. "CURRENT allows" has no retired-phrase pin at all (E20).

**What the lead's "own file" repair closes.** After this check, `ledger_pin_checks.py` was changed so that an "everywhere" retired phrase is also looked for in its own file. I read the new code (lines 107 to 117) and it does that.
- It closes E11b: the retired clause is looked for in `design-review-packet.py` now.
- It does not close:
  - E12, whose words differ from the pinned phrase.
  - E20, which has no retired-phrase pin.
  - Gap 1 (E04, E05), Gap 2 (E02, E03, E08, E09, E24) and Gap 3 (E14b, E15).
- The lead's added `assertNotIn` on the Slide Philosophy trigger covers the clause coming back inside that trigger (E11). The own-file fix covers it coming back anywhere else in the packet (E11b).
- I have not re-run the experiments against the repaired files; the results above are for the files as they stood when I copied them.

---

## 7. Plain honesty checks

- **The four stories are in the log.** J17's repair (`528`, `5,996`, a Your Turn on four more, about four minutes), J18's `43 children came to the fair` slide, J32's placement reason, and M06's words (18 September 2026) are all in the new 4.2.285 entry, in the files' old words. The other retired stories were already in the log: E04 (L2336), F04 (L1233), J14 (L2011 to L2017), G11 (L2234), M04's count (L1255, "28 of 28 saved Teach beats"). J02's maintainer bracket is in the entry too.
- **The size paragraph is accurate.** Instruction files +4,412 bytes; designer's file -2,242; designer's rhythm section 9,960 to 7,556 bytes; rhythm section about 32 KB.
- **One claim is not quite true.** «**Tests moved, not removed.** Seven tests pinned ... each now pins the rule where it lives». Thirteen test functions across seven files changed, and two were removed rather than moved (section 5).
- **Not yet in the entry:** a "not done yet" line, as the vocabulary entry had. Behaviour has not been tried on a real run, and the three later-topic items (four corners, the quick-check paragraphs, the time numbers) are waiting.
- **Dashes.** No new sentence anywhere in the plugin or the new test files uses an em dash or en dash. Two edited lines keep an em dash that was already there: the contents line's separator after the rhythm's name (the file's convention for every entry) and the one inside hot-seating's quoted question ("you're [character], what would you say?", with a dash where I have put the comma).

---

## What I would fix before release

The lead reports that, after this check, findings 1a to 1g, the README line, J21's slide-check clause, the always-read note (second job added), the Slide Philosophy test and the retired-phrase check (own file) were repaired. I have not re-checked those repairs; items 1, 2, 4 and part of 6 below should be read against them.

1. The scene's own slide (1a): make the two copies agree, and either say it happens when the first board would be too full or give the designer a way to ask for it. Put the choice to Daniel.
2. The practical-lesson paragraph's reach (1b): say "challenge" means an attempt at the target, that investigating or observing first follows its own route, and "a maths skill lesson".
3. The pin gaps the repairs leave open (section 6):
   - Pin that the sections the reviewer must read stay above `## Output Format Block` (E04, E05). This is the one that undoes decision 6 silently.
   - Pin the skill route's bounded-attempt conditions whole (E02, E03), since the new practical-lesson paragraph depends on them.
   - Add a retired-phrase pin for "CURRENT allows" (E20).
4. Put "short" and "manageable" back into A03 or the designer's pointer (1c), and "explore before Teach why" into J01 (1d).
5. Tell Daniel that discovery now allows any number of findings, not two, and that the always-read rhythm section grew rather than shrank.
6. Small wording: README's "Never two teach beats back-to-back"; the build log's "moved, not removed" and a "not done yet" line; D12's "into the Do beat itself"; J21's slide-check clause.
