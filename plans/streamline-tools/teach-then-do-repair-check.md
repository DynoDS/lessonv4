# Second check of the repairs (Teach then Do fold, 4.2.285, uncommitted, against 3de9c956)

What I did: read the brief, the first report (`teach-then-do-change-check.md`), Daniel's decisions and his second-round replies, the repair script (`td-change/r1_repairs.py`), the pin tooling as it now stands (`ledger_pin_checks.py`, `test_teach_then_do_ledger_is_kept.py`, `ledger_mapping.py`, `build_td_mapping.py`) and the 4.2.285 build-log entry; read every sentence each repair touched with its neighbours, and checked each against the files the brief named (`subject-science.md`, the Discovery route, the content route's `observe`, the slide playbook's split rule, `check-slide-design.js` and its three My Turn tests, the designer's `Reference Files` section and the `preferences.md` contents note); read the mapping entries for the repaired rows; compared the seven changed test files with their old text function by function; checked every added line in the plugin for em and en dashes. Suites on the real checkout: Python 2,102 passed, 1 skipped; builder 709 passed, none failed. Pins: 38 attempts on a scratch copy of the whole plugin (the first report's twelve misses, one fair re-run of E12, and 25 new), each against the pin test and, when it missed, the whole Python suite; the scratch copy has two failures of its own (`test_helper_coverage.py`, which looks for the real checkout), discounted. The attack scripts are in the session scratchpad, not the repository. `git status` is the same as at the start: I changed nothing in the repository except writing this file.

---

## 1. Real problems, most serious first

**1.1 The reviewer's own copy of its reading line can move and nothing fails (new attempt N21).**
- Decision 6 rests on the reviewer reading each route file down to `## Output Format Block`. The line is written twice: in the card the packet prints («the file start to, but not including, `## Output Format Block`,», pinned as TD-L19), and in the reviewer's own step 7 («Read the selected teaching-route reference from the start to, but not including, `## Output Format Block`, with the paged command the card prints.»), which nothing pins.
- I changed step 7 to stop at `## Teaching Sequence Specification`. The pin test passed, and so did the whole suite. The reviewer would then hold two instructions that disagree, and the one in its own file stops before every cycle rule decision 6 moved up.
- This is the damage E04 and E05 did (both now caught) reached through the other copy of the line.

**1.2 Decision 3's "its own slide if it makes sense" now reads "when the first board would otherwise be too full", and the question that makes that honest is recorded only in the build log (earlier finding 1a).**
- New, `preferences.md`: «on a slide of its own when the first board would otherwise be too full (the Slide Designer splits the beat there)». New, content route: «on a slide of its own when the first board would otherwise be too full». The two copies now agree with each other and with the playbook's split rule («When it will not fit one board at the ceiling, cut it at the turn: the scene set on the first slide...»). That part is repaired, and the text no longer promises a behaviour the Slide Designer does not have.
- But his settled words are "It doesn't have to be its own slide. It could if it makes sense", and the second-round read-back kept "its own slide if that makes sense". Until he answers, the rule is narrower than his decision.
- The log says «whether the designer should be able to ask for the split is put to the teacher». Nothing else records the question: not the streamline plan's topic 3 row, not the ledger, and the mapping's I01 and I03 entries do not mention the narrowing. "Is put" reads as done. Choosing to say what the system can do and ask him the wider question is honest; it becomes honest in fact only when the question is on his list.

**1.3 The scaffold can lose decision 4 and nothing fails (new attempt N17; a gap in the original change's tests, not in the repairs).**
- The validator's gate is pinned exactly (TD-J48: «expect(discovery_shape_is_valid(kinds), f"Discovery sequence must be: {DISCOVERY_SHAPE}")»), and reverting it is caught (N17b).
- The scaffold's gate is not protected. Its pin holds only the message line; the parity test calls each program's `discovery_shape_is_valid` helper directly rather than the gate; and the scaffold's own test sends only a shape that should be refused.
- So replacing the scaffold's `discovery_shape_is_valid(kinds),` with the old one-finding list passes the pin test and the whole suite, while a designer on the normal scaffold route would be refused both of decision 4's shapes, by a message that still describes them as allowed.

**1.4 The pins, attacked again: the repairs closed what they aimed at; thirteen attempts still pass.**

| # | What I did | Pin test | Whole suite |
|---|---|---|---|
| E02 | Deleted the skill route's bounded-attempt conditions | caught (TD-KEEP-01, and the new line check) | |
| E03 | Deleted «Do not use it where a wrong attempt looks fine to the child or quietly rehearses an error...» | caught (TD-KEEP-01) | |
| E04 | Moved `### When the lesson discovers two things` below the discovery route's line | caught (line check; named-marker test) | |
| E05 | Moved `## Cycles, and the beats around them` below the skill route's line | caught (line check; named-marker test) | |
| E08 | «never a second and third task» to «rarely» | caught (TD-KEEP-01) | |
| E09 | Deleted «A synthesis names and compares positions children actually expressed.» | caught (TD-KEEP-01) | |
| E11b | The retired Slide Philosophy clause back into the packet as a comment | caught (retired phrase, own file) | |
| E12 | The slide-count trigger back into the always-read note, inserted inside a pinned line | caught, but only because the insertion broke TD-L18's pinned line | |
| E12b | The same words as a new line of the note, every pinned line left whole | not caught | **not caught** |
| E14b | New last paragraph in the reviewer's file: «Any two teacher-presented slides in a row are a purposeful design defect, whatever they carry.» | not caught | **not caught** |
| E15 | «A discussion question answered by hands up is a Do beat.» added to Classroom Norms | not caught | **not caught** |
| E20 | «CURRENT allows a bounded observation» back in the content route | caught (retired phrase; TD-J59) | |
| E24 | Deleted K18's reason from `subject-maths.md` | caught (TD-KEEP-01) | |
| N01 | Moved J21's paragraph to the top of its own section, above the paragraph that sends the reader to «the rule below» | not caught | **not caught** |
| N02a | Split the whole-pinned bounded-attempt paragraph in two | not caught | not caught (harmless: same words, same order) |
| N02b | Split the rhythm home's practical-lesson paragraph in two | caught (homes) | |
| N03 | Moved the skill route's `## Output Format Block` heading up above `## Cycles` | caught (line check) | |
| N03b | Moved the discovery route's heading up above `### Finish purposefully` | caught, by DEC-04's section check rather than the line check | |
| N03c | Moved the discovery route's `### Finish purposefully` and `## Procedure boundary` below its line | not caught | **not caught** (neither is a rhythm row) |
| N04 | A second `## Output Format Block` heading above J76 in the task route | caught (line check; section check) | |
| N05 | Fenced the skill route's bounded-attempt paragraph as code | not caught | **not caught** |
| N06 | Fenced the rhythm home's practical-lesson paragraph as code | caught (homes) | |
| N07 | Appended «Where the class is keen, a quick first attempt is fine even when these conditions do not all hold.» inside the whole-pinned bounded-attempt paragraph | not caught | **not caught** |
| N08 | Put «**Retired, do not follow:**» in front of the whole-pinned maths paragraph | not caught | **not caught** |
| N09 | Added a harmless cross-reference, «The JSON for each beat is under `## Output Format Block` below.», to the skill route's opening | caught, falsely (see below) | |
| N10 | Removed the repaired «a beat that carries a second job» from the always-read note | not caught | **not caught** |
| N11 | Put README's «Never two teach beats back-to-back.» back | not caught | **not caught** |
| N12 | Put D12's «Bakes spacing into the Do beat itself.» back | caught | |
| N13 | Put J01's pre-repair Discovery clause back | caught (homes) | |
| N14 | Put the content route's «when that makes sense» back | caught | |
| N15 | Dropped the three-Teach procedure from the always-read note | caught (TD-L17) | |
| N16 | Moved J76's staged-task paragraph back below the task route's line | caught (line check) | |
| N17 | The scaffold's discovery gate back to the one-finding list | not caught | **not caught** (1.3) |
| N17b | The same in the validator's gate | caught (TD-J48) | |
| N18 | Hot-seating back to «in writing or to a partner» | caught | |
| N19 | J21's slide-check clause back to the broader description | caught | |
| N20 | Deleted the discovery route's second shape (a second exploration) | caught | |
| N21 | The reviewer's step 7 stops at `## Teaching Sequence Specification` | not caught | **not caught** (1.1) |

25 caught by the pin test, none caught only by another test, 13 caught by nothing.

What the results mean:
- **The repairs did what they said.** Gap 1 is closed for this ledger's rows: E04 and E05 are caught, and so are three attacks on the line itself (N03, N04, N16). The four paragraphs the new rules point at are pinned whole (E02, E03, E08, E09, E24). A retired phrase is looked for in its own program (E11b), and `CURRENT allows` is pinned (E20). Every repaired sentence sits in a home pinned exactly or a paragraph pinned whole, apart from the two below, and each one I put back was caught (N12 to N14, N18, N19).
- **Two repairs have no pin.** The always-read note's «a beat that carries a second job» (N10: the note's pinned lines are TD-L17's and TD-L18's, and this one is neither) and the README line (N11: README is outside the pinned files). The first report found the same pattern for the Slide Philosophy clause. Low: the section is read whole, and README is for maintainers.
- **The stated limit is honest about what it names and narrower than what passes.** The log: «What no phrase pin can catch, a new contradicting paragraph outside the rhythm's homes or a retired rule back in new words, is left to review.» E14b, E15 and E12b are exactly those, so gap 3 and E12 are honestly stated. But "pinned whole" means present word for word, not "exactly this paragraph": words added inside a pinned paragraph (N07), a label in front of it (N08), a code fence round it (N05) and a reorder within its section that strands «the rule below» (N01) all pass outside the homes. The line check protects this ledger's rows only (N03c), which is fair for this topic but not what «Pins now record which route rules sit above that line» suggests on a first read.
- **The line check reads the words, not the heading (N09).** It looks for the first `## Output Format Block` anywhere in the flattened file, so a harmless cross-reference near the top of the skill route fails 53 pins, and a heading demoted to `### Output Format Block` would pass because it contains the words. Very low.

**1.5 The build-log entry: mostly true, four places to adjust.**
- **No "not done yet" line** (first report section 7; not repaired). The vocabulary entry has «**Not done yet, and named.**». Here nothing says that behaviour is untried on a real run, that the three later-topic items (four corners, the quick-check paragraphs, the time numbers) wait, or that the scene question (1.2) is open.
- **«is put to the teacher»** reads as done (1.2).
- **«a practical lesson opens on the challenge only under the bounded-attempt conditions, and never in maths».** The rule's own words are now «a maths skill lesson opens with the model» (see 1.6). `subject-maths.md` says «maths does not use it», so the log matches the subject file rather than the rhythm.
- **«Thirteen test functions in seven files ... Eleven now pin the rule where it lives ...; two ... went with it.»** Function by function I count fifteen touched in those seven files (eight changed in place, five renamed, two removed), plus three new discovery tests; two of the fifteen (the H01 wording and the content route's question-Do) may fall outside the three kinds the sentence names. Immaterial. In the mapping, J21's entry does not mention the slide-check correction and I01/I03's do not mention the narrowing. Very low.

**1.6 Three readings the repairs introduced (low; unsure how a designer will read them).**
- **J01 (earlier 1d).** «and Discovery as an exploration before each Teach why and the use of that finding straight after it». Decision 4's first shape has one exploration before two Teach whys («When one exploration reveals both, make both visible, then teach why for the first ... then teach why for the second»), and the code accepts `teach-why, use-learning` with no second exploration. Read as "each Teach why has its own exploration", the home now says less than the decision. Read as "some exploration comes before each", it is right.
- **The maths exception (earlier 1b).** Fixing «a maths lesson» to «a maths skill lesson» removed the widening the first report found (the Discovery route and the skill route's pattern investigation are no longer ruled out). It also means the rhythm now states the exception to the challenge only for skill lessons, where decision 11 said "maths never uses one". The bounded attempt exists only in the skill route (`prepare`, `bounded-attempt`), and `subject-maths.md` («maths does not use it») is pinned whole, so nothing is lost in practice.
- **The investigation list (earlier 1b).** «An investigation or observation before the teaching is not this challenge and follows its own rules: the Discovery route, the content route's `observe`, and the subject file.» It leaves out the skill route's own «A short pattern investigation or method comparison may come before direct modelling», which is where a maths or skill lesson's investigation-first lives. Nothing forbids it and the skill route still says it.

---

## 2. The earlier findings, one by one

| Finding | Status | Old words (at the first check) | Current words |
|---|---|---|---|
| 1a scene's own slide "when that makes sense" | **Repaired in the text; the question for Daniel not yet queued** (1.2) | «on a slide of its own when that makes sense (the Slide Designer splits the beat there)»; content route «when that avoids overloading the first teaching board» | both «on a slide of its own when the first board would otherwise be too full» |
| 1b practical paragraph ruled out investigate-first; "a maths lesson" | **Repaired**, two small readings (1.6) | «It opens on the challenge itself, before any teaching ... and a maths lesson opens with the model» | «It opens on the challenge itself, an attempt at the target before any teaching ... and a maths skill lesson opens with the model (`subject-maths.md`). ... An investigation or observation before the teaching is not this challenge and follows its own rules: the Discovery route, the content route's `observe`, and the subject file.» |
| 1c "short" and "manageable" dropped | **Repaired** | «An explanation and its model may form one coherent teaching block when they develop the same idea.» | «A short explanation and its model may form one coherent teaching block when they develop the same manageable idea.»; designer «a short explanation and the model of one manageable idea» |
| 1d "explore before Teach why" dropped | **Repaired**, one reading (1.6) | «and Discovery as the use of each finding after its Teach why» | «and Discovery as an exploration before each Teach why and the use of that finding straight after it» |
| 1e J14 lost its example | **Repaired** | «...leaves the first move a single demonstration away from independent work.» | «...away from independent work: 43 and 45 modelled and guided once, then not written by a child until a mixed set twenty minutes and two more moves later.» («guided once on 48» became «guided once»; the point stands) |
| 1f hot-seating looser than decision 5 | **Repaired**, to the decision's own words | «commits to what their character would say, in writing or to a partner» | «only when every child first writes what their character would say, or picks a side, before anyone performs» |
| 1g recall format "into the Do beat itself" | **Repaired** | «Bakes spacing into the Do beat itself.» | «Bakes spacing into the starter itself.» |
| 2, decision 4 goes wider than two | **Stated in the log** | | «(any number, each taught and used before the next; the teacher asked for two)» |
| 2, decision 6's premise did not hold | **Stated in the log** | | «taken on the promise that the fold would shorten the section first, which it did not» |
| 3, J21's slide-check clause | **Repaired**, and it matches the code | «the slide check refuses two consecutive My Turn slides ..., which is the same board reached by splitting one unit» | «the slide check refuses two consecutive My Turn slides from different units (`MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`); two slides that split one unit whose examples cannot share a visual are one move and pass.» |
| 3, Starters (TD-I07) wording against "never a beat of its own" | Not addressed, not claimed (low, as before) | | unchanged |
| 4, README | **Repaired**, unpinned (N11) | «Never two teach beats back-to-back.» | «Never a second new idea taught before children have used the first.» |
| 4, plan-checkpoint sentence unmapped | **Repaired** | | J76's mapping names it; pinned as gone |
| 4, the designer's new "again" | **Repaired** | «read it whole at the start and again before you sequence the lesson» | «read it whole at the start, and go back to the part a decision needs when you make it» |
| 5, always-read note lacked the second-job way in | **Repaired**, unpinned (N10) | | «the pairing test; a beat that carries a second job; a Do whose expected answer...» |
| 5, Slide Philosophy retirement unprotected | **Repaired** | | `assertNotIn("question to the room", trigger)`, and the retired phrase is looked for in the packet itself (E11b caught) |
| 5, two tests deleted | **Stated honestly** in the log («two retired with what they tested») | «Tests moved, not removed» | the trigger-visible principle still lives only in a code comment |
| 6, gap 1 (a section moved below the line) | **Repaired** for this ledger's rows | | E04, E05, N03, N04, N16 caught |
| 6, gap 2 (sentences round a quote) | **Repaired** for the four paragraphs the new rules point at | | E02, E03, E08, E09, E24 caught |
| 6, gap 3 (additions outside the homes) | **Stated as a limit**, honestly, but narrower than what passes (1.4) | | E14b, E15 still pass; so do N01, N05, N07, N08 |
| 6, gap 4 | **E11b and E20 repaired; E12 stated as a limit**, honestly | | E12b passes |
| 7, "moved, not removed" | **Repaired** | | «Tests moved, and two retired with what they tested» |
| 7, no "not done yet" line | **Not repaired** (1.5) | | |

---

## 3. Did the repairs break anything?

- **The practical paragraph against the science file, the Discovery route and `observe`.** No clash. The science file («Investigate first when seeing the result creates something useful to explain»), the content route's `observe` («when seeing it first gives children something useful to explain») and the Discovery route's conditions are each named as the rules an investigation-first follows, and each is pinned whole (K21, J49 and the discovery rows). The code agrees: the attempt at the target exists only as the skill route's `prepare` mode `bounded-attempt`, and the content route's only pre-teach unit is `observe`. The omissions are in 1.6.
- **The scene sentence against the content route and the playbook.** The two copies now say the same thing, and both match the playbook's split rule and the Tudor calibration («a beat splits once, where its teaching turns»). The home's own «a scene set on one slide and looked at on the next» (A03) still reads as an example of one idea on two slides. The only tension left is with Daniel's words (1.2).
- **J21 against the slide check's tests.** The new clause matches `consecutiveModellingWarnings` (same `designUnitId` passes; different units are refused) and its tests («one My Turn unit divided across two slides is one move», «two My Turn units in a row are still two moves and still refused»). The code also refuses two My Turn slides that name no unit at all; the sentence does not mention that case, and nothing a designer should do turns on it.
- **The designer's pointer against `Reference Files`.** «read it whole at the start, and go back to the part a decision needs when you make it» agrees with `Reference Files` («At the start: ... `The Teach → Do → Teach → Do Rhythm`»; «A direction to read a section means consult its guidance at that decision, not fetch the same text for every field») and with the `preferences.md` contents note («It returns to the relevant section before making the decision that section governs»). The "two reads of 32 KB" problem is gone.
- **The other repaired sentences and their neighbours.** A03's new «short» and «manageable» sit before «The required child processing comes before...», which still follows. The hot-seating line keeps its neighbour, the debate line («picks a side and writes one reason»); «or picks a side» alone is looser than C01's «a vote with a reason», but it is the decision's own wording. D12's «into the starter itself» now agrees with its «Best for». The always-read note's added clause sits inside the list and names the rule the section holds. No repair touched a line another test pins in a way that now fails.
- **The pin tooling.** Pins whose section is a file's title now carry `intro`, so the vocabulary check's "title spans the whole file" gap does not recur here (no TD pin has a title section without it). No `aboveReviewLine` pin's words occur twice in its file, so the line check's first-occurrence rule has nothing to miss today.

---

## 4. Checked and found sound

- **Suites.** Python 2,102 passed, 1 skipped; builder 709 passed, none failed, on the real checkout.
- **Dashes.** No new em or en dash in any plugin file or new test. The dashes on changed lines were already there: the contents list's separators and the one inside hot-seating's quoted question.
- **Line endings.** The files the repair script rewrote match the rest of the working tree; nothing is mixed.
- **Build-log claims that the files bear out.** The size paragraph and its new sentence on the reviewer's extra reading; «any number ... the teacher asked for two»; the seven softenings and the 26 attempts with 12 caught by nothing; «Pins now record which route rules sit above that line» (for this ledger's rows, 135 pins across the five routes); the four paragraphs pinned whole; the own-file retired phrase; `CURRENT allows`; the stories and the maintainer bracket.
- **Pins that the first report found missing.** 42 retired phrases, all marked "everywhere" and now also looked for in their own file; every repaired sentence pinned except README and the note's second-job clause.
- **Decisions 4, 8, 9, 10 and 12.** No repair touched their wording, which stands as the first check found it.

---

## What I would fix before release

1. Pin the reviewer's step 7 reading line, or add a test that the agent file and the packet's card name the same heading (1.1, N21).
2. Put the scene-slide question on Daniel's list (the plan's topic 3 row or the release report), and word the log as "is to be put"; until he answers, the rule is narrower than his decision (1.2).
3. Test the scaffold's discovery gate on the shapes it must accept, not only one it must refuse (1.3, N17).
4. Pin the always-read note's second-job clause (N10); README is optional.
5. In the build log: add a "Not done yet" line (no real run, the three later-topic items, the scene question); widen the stated limit to name additions inside a paragraph pinned whole, labels, code fences, reorders within a section, and rules outside this ledger crossing the reviewer's line.
6. Optional wording, each a judgement for the author: J01's «an exploration before each Teach why»; naming the skill route's own investigation-first in the practical paragraph's list; whether the rhythm should say that maths never opens on this challenge, as `subject-maths.md` and the log do.
