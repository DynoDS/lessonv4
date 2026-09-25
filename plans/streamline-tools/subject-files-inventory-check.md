# Subject files list: independent check (streamline topic 8, `SJ-`)

Checked: `plans/2026-09-23-subject-files-ledger.md` (469 rows, 7 decisions), against the plugin working tree of 24 September 2026 (4.2.287 with 4.2.288 uncommitted; the six subject files, the authoring guide and the skill are unchanged since the ledger was built). Brief: `inventory-check-brief.md`, plus the team lead's addition to heading 4. Nothing was changed except this report. Scratch work is in `scratch/sjchk/`, my files prefixed `c2_` (the earlier agent's files there were reused only after re-running them).

Method, briefly: every sentence of the eight topic files was matched against the quotes of every ledger in `plans/` (`c2_allcover.py`); every line in `agents`, `references`, `skills` and `commands` that mentions a subject, a subject file, or a distinctive idea from one (circuits, diet, safety, depiction, timelines, past tense and so on) was matched against every ledger (`hitcover.py` over `c2_hits_*.txt`); the two programs were read for everything they do with a subject file; every test string of three or more words was matched against the topic files (`c2_testpins.py`); the build log was searched for each story (`c2_logcheck.py`).

## Most important, in order

1. **Maths's Classroom Secrets examples and several maths rules are in no ledger at all.** The ledger marks the maths sheet sections "shared with worksheets", saying the worksheets list holds them sentence by sentence. It does not: eleven passages of `subject-maths.md` are quoted by no ledger, including the worked examples of the question shapes (Aria, Kenneth, Hans's clues, Jen, the number-line specification) and four rules (heading 1a). These are his calibrating examples; with no row, a fold can drop them unseen.
2. **The route tables lose their routes.** Rows E50 to E54 and G14, G15, G19 quote the first and third columns of history's and geography's "which move routes to which structure" tables but not the Structure column (Content-based, Dialogic, Skill-based, Task-Centred). No ledger quotes it. The mapping itself, the point of the table, is unrecorded.
3. **A real pull the list missed: circuit symbols.** The science file says symbols are Year 6 and a Year 4 lesson uses a labelled picture of the loop; the worksheet science guidance says the symbol helper «covers the whole electricity unit», the board's helper catalogue gives no year limit, and no helper draws a pictorial circuit.
4. **Decision 6 rests on two wrong facts.** The handling safety check is already in the reviewer, which reads every lesson in every subject (RV-M02); and parts of three of the four diet boundaries already reach science lessons through general files (the portion rule in preferences whole; balance over time and no good or bad foods through the plate helper and the reviewer's example). The pull that remains is narrower.
5. **Two of the "free" folds would change his rulings.** Maths's fluency-first copies differ in strength ("strong default" against "strong option"), and D66 and D67 are two of the "three" positions his ruling names (D64); folding them into D23 and D05/D07 breaks that section.
6. **The code check behind the "idea on more than one case" rule is missing**, several claimed test pins do not exist, and the "never use 67" description overstates what the check refuses.

## 1. Missed rules

### 1a. Sentences in the subject files that no ledger quotes

Found by matching every ledger's quotes against the file text (`c2_allcover.txt`). Everything else in the six subject files is quoted somewhere.

| File · line | Exact words | Group it belongs in |
|---|---|---|
| `subject-maths.md` · L95 | «One or two short sentences: `Aria has £20. She wants to buy a ball that costs half of her money.` or `Kenneth is thinking of a number.` Use an everyday situation only where the maths genuinely lives in it (money, measures, sharing out, time); a claim about bare numbers needs only the child.» | D43 (rule plus his Classroom Secrets examples); WS-G10 quotes only «One or two short sentences» |
| `subject-maths.md` · L96 | «Clues and conditions go in the same place, one short sentence each: `My number is odd. It is less than 30. It is a multiple of 3.`» | D43 (a rule: clues are said by the child too) |
| `subject-maths.md` · L101 | «`2,949`, never `the whole number just before your smallest number`. When printing the number would give away an earlier answer, take one concrete step from the child's own work: `Take 1 away from your smallest number. Does it still round to 3,000? Explain your answer.`» | D44 (the exception to "write the number") |
| `subject-maths.md` · L102 | «Visual requirements talk about `matching pairs of marks`, `endpoints` and `aligned ticks`; the child sees two number lines with numbers on them, so the question says `the number under it on line B` or `the numbers at each end`.» | D44 (example) |
| `subject-maths.md` · L103 | «`Draw another number line with 4,000 at its midpoint. ... Label the endpoints and midpoint.` reads like a specification; `Draw your own number line with 4,000 exactly halfway. It can't start and end at the same numbers as line A or line B.` is the same task.» (middle of the first example elided here only) | D44 (example) |
| `subject-maths.md` · L104 | «`Jen says: "The numbers on line B are always the same amount bigger than the numbers above them on line A."` then `Is she correct? Explain your answer.` leaves the finding with the child.» | D44 (example) |
| `subject-maths.md` · L108 | «Working out every boundary case and every answer the key must refuse is right, and it is what makes the key trustworthy, but each of them does not earn a clause in the question.» | D45 (the reason and its permission) |
| `subject-maths.md` · L121 to L129 | «Decide which mathematical feature stays invariant, which feature changes next, and where a boundary or misconception should surface.» «This does not make a table the default: separate questions are better when each item needs its own method, working or choice and adjacent answers would cue the move.» | D49 (a rule and its limit; D49 quotes only the paragraph's first and last sentences) |
| `subject-maths.md` · L134 | «A frame or representation may remain constant, change or disappear according to whether it enables the target thinking or supplies it. Greater Depth may retain purposeful support when it enables deeper reasoning.» | D51 |
| `subject-maths.md` · L135 | «Using the Below resource does not by itself decide the configuration.» | D52 (a limit) |
| `subject-maths.md` · L77, L83, L91 | «A child still assembling the method has nothing spare for reading an unfamiliar layout.» (reason, D38); «That data table was a good idea badly placed, not a bad idea.» (D40, his framing of his own lesson); «Generated Greater Depth sheets had drifted the other way, and children struggled with questions whose maths was sound: ...» (a story, D42; it is in the build log at L1035) | D38, D40, D42 |
| `subject-history.md` · L76 to L80 | the Structure cells «Content-based» (four rows), «Dialogic», «Task-Centred» | E50 to E54 (see "most important" 2) |
| `subject-geography.md` · L39 to L44 | the Structure cells «Content-based» (three rows), «Skill-based», «Dialogic» | G14, G15, G16, G17, G19 (G18's cell is quoted) |
| `subject-history.md` · L221 to L226 | the weak column of the question table: «What were toys like long ago?», «Who was Florence Nightingale?», «What was life like in the Stone Age?», «Were the Romans good for Britain?», «Were the Vikings brutal?»; and the strong «Why do we remember Florence Nightingale and not the other nurses?» | F49 (it quotes only four strong entries; the weak ones are the examples of F02's failure) |
| `skills/make-subject-file/SKILL.md` · L263 | «Read the reverse direction too, because it is real evidence and easy to skip: where the drafted file's version is the better lesson, the cut worked, and where the existing file contributed that strength, it has earned keeping.» | C51 (a Stage 9 instruction with no row) |
| `skills/make-subject-file/SKILL.md` · L219, L223 | «Three tests, and the first is the one that matters most:» «This is the test that keeps the file doing its job, because a subject file fails far more often by being interesting than by being wrong.» | C40 (a ranking and its reason) |
| `skills/make-subject-file/SKILL.md` · L203 | «Usually a few lines rather than a section of its own.» | C37 (the scope of question 5) |
| `skills/make-subject-file/SKILL.md` · L81, L153, L161, L261 | «A document written for a human reader carries lines that are true, that he means, and that no designer can act on.» «He is the one who has to approve these lessons, so he approves what they are built from.» and two reasons in Stages 5 and 9 | C15, C26, C28, C50 (maintainer reasons) |

The rest of the skill's unquoted text is headings, the question table's cells and the start-up boilerplate (C03, C04).

### 1b. Rules elsewhere about subject files, with no row in any ledger

| File · line | Exact words | Group |
|---|---|---|
| `scripts/design-review-packet.py` · L650, L661 | «- Subject reference: `{subject_path}` - read the complete file, every page:» and «- Subject reference: `{subject_path}` - read every section except {skipped}, which is written for another agent and describes resources made after this review. Read it with:» | A (these are the words the reviewer actually reads; A51 and A52 quote only the list and the "no file" line) |
| `references/output-template.md` › Flags for the teacher · L1133 | «- a subject/reference clash that cannot be silently settled;» | A (the field contract's copy of A06's fallback) |
| `references/reasoning-prompts.md` › Cross-subject use · L86 | «- History, Geography and RE may weigh claims, sources, significance, evidence or perspectives using their subject guidance.» | A (a pointer into the subject files, beside A30) |
| `references/reasoning-prompts.md` › Cross-subject use · L81 | «Until a subject-English file exists, keep the detailed reading, writing and grammar guidance below active.» | A and C54: held as RT-L20, but it is wiring a new subject file changes, which the skill's "no wiring" line (C54) does not know (see decision 1 below) |
| `references/computer-setup.md` › Developer mode · L199 | «lets the developer commands (installing a helper, editing templates, writing a subject file) change the plugin.» | C (copy of C04) |

### 1c. Copies of subject-file rules in general files that the rows do not link

These are held by other ledgers, so nothing is lost, but each changes a finding in this list.

- **H36 (safety before handling)** has a copy the reviewer runs on every lesson: `agents/design-reviewer.md` › 6. Source, scenario and visual meaning · L271, «For a practical or demonstration involving equipment, check that the design gives the teacher the short equipment-specific safety precaution before handling begins. A generic safety reminder is not enough; do not turn the precaution into a second lesson.» (RV-M02, PF-O32). See decision 6.
- **J25 and J28 (diet)** have copies on the plate helper every surface draws: `references/templates.md` · L2831, «Foods high in fat, salt or sugar sit in a clearly separate cue labelled **less often / small amounts**, never as a moral category. The default caption is **"Aim for this balance across a day or over time, not every meal."**» and L2859, «Do not add calorie counts, weight-loss aims, "good/bad" foods, or moral judgements.» The reviewer carries J25's case as its example (`agents/design-reviewer.md` · L320: «a `teacherInfo` saying `a single lunch cannot prove a whole diet is balanced; keep the wording about patterns over time` beside a task saying `explain why the whole lunch is balanced` is a defect»). J26 is general already (`preferences.md` · L461, SC-G01).
- **H07 (circuit symbols)** is the example in the designer's general rule: `agents/lesson-designer.md` · L168, «A curriculum boundary - formal circuit symbols are later learning - is teacher information» (AK-B22, PF-D69).
- **D31 (block, then mix)**: `teaching-sequence-skill-based.md` · L116, «**Block while it is brand new; mix once it has a rival.**» (RT-C19).
- **D57 (five Greater Depth moves)** and **F35 (the route in, not the destination)** have general copies in `adaptive-adaptation.md` L56 to L58 and L133 and `adaptation-designer.md` L106 and L190, in no ledger yet (adaptation is topic 9); note them for that list.
- **J07 (safe distance)**: `teaching-sequence-dialogic.md` · L17 (AK-I03, RT-G04).

## 2. Duplicates that are not duplicates

| Rows | What the "copy" carries that the other lacks |
|---|---|
| D05, D07, D67 (fluency-first, "folds to one") | Different strengths: D05 «children normally need reasonable execution», D07 «fluency-first remains a strong default», D67 «fluency-first remains a strong option». Different limits: only D05 has «once they are secure, staying is the failure»; only D07 has «a legitimate fluency lesson may end with sustained accurate execution»; only D67 has «often in blocks» and «There is research that pushes mixing question types early, and it was read and weighed.» D67 is one of the three positions his ruling D64 announces. D06's «remains a strong available option» is a fourth near-copy the table does not list. Not a free fold. |
| D23, D66 ("grouping", fold keeping both halves) | D66 is the second of D64's «three» positions. Moving it into D23 leaves D64 counting positions that are no longer there. D23 adds «response surfaces, pace»; D66 adds «Some schools keep every child on the same task and differentiate only by depth.» |
| F03 against F02 | F03 widens the scope: «it is worth applying to the LO itself as much as to the closing question». |
| A28 against A23 | A28 says who decides: «the catalogue supplies a possible thinking structure, while the subject and objective determine whether that structure is genuinely deep here». |
| B08, B09 against C45 | Timing differs: B08 «Stop and take it to the teacher with a proposed rescoping.» against C45 «So collect them as you go, and bring them out at the end as their own decision.» C45 adds a condition on the rescoping: «a proposed rescoping that leaves maths behaving exactly as it does today». |
| B17 against C40 | C40 ranks the tests and gives the reason (the two sentences in 1a), and adds «Would this be true in a maths lesson too?» |
| B18 against C23, C24 | B18 names «the DfE» and «the research literature»; C24 names «The National Curriculum's own disciplinary strand» and «Check for a newer one rather than assuming the review is the latest word.» B18's "Copies: C22" is the wrong row (C22 is about following up a thin answer). |
| B05 against C39 (listed as copies) | C39's cut list is longer: «pace, slide design, modelling, worksheets, his voice, or how much fits in a lesson» against B05's «its structure, its pacing, the slide conventions, the house style». The extra items are exactly what decision 3 is about. |
| C09 against B05, B06 | C09 adds «pass every general rule» and ties the cut to Stage 7. |
| F52, F55 (second), F56, F57 marked duplicates of E03, E40, E44, E43 | They are items of the misconception list the designer picks from, not repeats; F52 adds «The commonest by far», F57 adds «one Victorian childhood stands in for all of them». Their home is already SUBJ, so only the label is wrong. |
| E37, G05 | The summary lists them among the folds; the "same rule" table says «not a fold». The ledger contradicts itself. |
| H02, J02 | The summary and the table say they «fold into the route menu»; both rows propose SUBJ. They also carry subject signals the general menu lacks (PSHE «a practical action they must perform»; science «a repeatable scientific technique»). |
| E01, G01 into A04 | The fold must carry «because the routing below is part of that choice», which A04 lacks. |

One general point the "same rule in several subject files" table misses: a lesson reads exactly one subject file (A05: «one file per lesson, subject's own»), so a rule written once in each subject file costs each lesson one read. Folding cross-file copies (E37 and G05, F50 and G55, the five Do-beat lead-ins) saves no reading in any lesson, and moving them to a file every lesson reads adds reading. The only gain is maintenance.

## 3. Strength and scope

About sixty rows were checked against the file text. These were right: A01, A04, A18, A22, A24, A29, A50, A53, A54, D10, D17, D31, D32, D46, D48, D56, D59, D65, E05, E24, E28, E29, E47, E48, E55, E62, E63, E66, F20, F24, F27, F28, F35, F46, F47, G08, G13, G22, G25, G31, H09, H15, H16, H17, H19, H20, H23, H34, H35, H36, H38, I06, I19, I21, J06, J08, J09, J24, J25. Faults:

| Row | Ledger says | The text says |
|---|---|---|
| D50 | may | Its last sentence is a prohibition: «Do not make generation the default.» may; must not. |
| D52 | when: «a number line or partition the child could build» | Two exceptions the column drops: «unless the adaptation specifically decides that a pre-drawn structure is needed for access» and «Keep a pre-drawn representation when reading or interpreting it is the target.» (and the unquoted L135 limit). |
| D57 | may (the moves) | «increase authentic mathematical demand through one or more of these moves» is a closed list: must, one or more. |
| E59 | may; must (the limit) | «Children can speculate from their own world at the start of a lesson, and they should.» default, not may. |
| F06 | may; must not (a ranking by default) | «ranking importance is not required for every sort» is a permission not to rank, not a prohibition. |
| G03 | may (the limit on G02) | Its last clause is a must: «an explanation objective needs more than naming facts». |
| G21 | when: «map and atlas work» | The must holds only on four verbs: «When the LO's verb is *use*, *locate using*, *measure*, or *plot*, run it skill-based». |
| I08 | when: «as I07» (asking for a picture in an RE lesson) | «no lesson may request a picture of him or of any prophet» covers every lesson. See heading 4. |
| H18 | when: «equipment children test a rule with» | Drops the exception in its own quote: «where a fussier component genuinely earns a place ... its failure mode goes in `teacherInfo`». Minor. |
| E42, E44, G23, H11, I03, J05 | must | must (code): the validator refuses these (heading 5); `conceptRef` belongs in the code names. |
| H05 | "Curriculum boundary" line at `lesson-designer.md` L117; reviewer L151 | The lines are L115 and L150. |
| Decision 5, G45, G46, G48, G53, and the tables | E93, E94, E102, E104, E105, E108 | No such rows: E ends at E66. They should be F27, F28, F36, F38, F39, F42. Decision 5 therefore cites a row that does not exist. |

## 4. Disagreements, and which decisions are real pulls

The teacher asked for "no overcomplications", so each decision is sorted: a **real pull** (two places disagree, a rule looks wrong, or a fold would change a meaning) or **settled** (his own words or a fold with no change of meaning already decide it). None of the seven decisions touches the sketch's steps, the Tudor lesson, the rounding cases or the Classroom Secrets endings. Two things come close, listed at the end.

1. **The reviewer can miss a subject's file. Real pull, but narrower than written.** All 118 saved designs in the project spell the subject one of the six ways the reviewer's program knows, so the misspelling case has never happened. The real gap is a new subject file: the skill's «a new file is picked up with no wiring» is wrong twice, because the reviewer's list needs the new name, and a new English file would also switch off the English guidance in the reasoning prompts («Until a subject-English file exists, keep the detailed reading, writing and grammar guidance below active.»). The simpler fix is to have the skill's last step name the places to wire. Matching any spelling in code is optional.
2. **Two sets of writing instructions. Settled in its only live part.** The one contradiction (B02 «Copy its shape» against B12 «There is no template» in the same guide, and C10) is settled by the guide's own next section, so correcting B02 changes no meaning. Removing the repeats is not a free fold (heading 2: B08 against C45, C39's longer cut list, C40's ranking), and no lesson reads either file. Suggest: fix B02's line only, and leave the rest alone.
3. **The steps would cut rules he placed on purpose. Real pull.** The cut list (C39) names pace, worksheets, his voice and how much fits, and history and maths hold his rulings on exactly those (past tense, captions, the input share, the maths sheet sections including Classroom Secrets). The suggestion protects his examples rather than touching them. Keep.
4. **Does every history lesson teach through sources? Real pull, with evidence.** The leisure lesson, the benchmark failure, spent a Year 4 class on a 1590 government order (F29), which is the drift E09 read as universal invites. **It touches his calibration:** E09 is the paragraph immediately before «The shape that produces this, in the order a child meets it, is the user's own sketch». The sketch's steps do not change, but its lead-in does, so show him the new sentence.
5. **Decorations on death and suffering. Real pull, and older than it looks.** The history rule (F28, not "E94") came with the plugin's first packaging on 28 August. The decorator's «the sensitivity of the subject - is not competition and never zeroes the layer» is from 29 August, and on 19 September his own ruling made P3 pure decoration: «p3 is decoration which I want too. not just 1 per slide, many!» (`context-pictures.md` L42). So the decision sets his newer ruling against an older rule he may never have seen. The slide-by-slide suggestion fits both, because the decorator only forbids a deck-level zero. Say that in the decision.
6. **Rules one subject holds that another needs. Diet is a real pull but smaller; safety is settled.** Safety: the reviewer already checks every lesson in every subject for the equipment-specific precaution (RV-M02), so the design and technology lesson in the example is caught at review. Drop that half, or tell him it is already covered. Diet: the per-meal quota rule is general (preferences L461); the plate helper prints «Aim for this balance across a day or over time, not every meal» and bans good and bad foods; the reviewer's own example is the single lunch. What only PSHE lessons meet at design time is J25 as a design rule, J27 (body jobs are a scaffold) and J28's «no judging any child's real food» and processed foods. Also, the suggestion "a science diet lesson also reads the PSHE food section" breaks the designer's «one file per lesson» (A05). Copying the four boundaries into the science file is simpler.
7. **Out-of-date text. Settled.** F26 is decided by his 8 September timeline ruling; E39 is a slip; C10, C43 and C54 go with decisions 1 and 2. One correction: H04's note about old route names is not wholly stale. The content route still opens «Use this file when the lesson-designer has chosen **Explicit Teaching (Content-based)**», so the note still explains a label the designer meets. Retire both together (the routes list owns that line) or leave H04.

**Real pulls the list missed:**

- **Circuit symbols (new, real).** `subject-science.md` · L19: «Recognised circuit symbols belong to Year 6. A Year 4 build-and-draw lesson therefore uses a labelled picture of the loop unless the teacher has directly supplied a different approved progression.» Against `worksheet-helpers/science.md` · L11 to L13: «`circuit-diagram` draws one series circuit or a row of them in the standard schematic symbols. Each circuit carries its own state, so one helper covers the whole electricity unit», and `templates.md` · L82, whose `circuit-diagram` is «a large standard-symbol series circuit» for «primary circuit diagrams», with no year limit. L1511 says it draws no «realistic apparatus pictures», and no other helper draws a pictorial circuit. Classroom case: in Year 4 electricity (the only primary year with a circuits unit before Year 6), the designer asks for a labelled picture, while the sheet and slide guidance offers only symbols. No ledger raises it; the worksheets and slides lists own the other side.
- **Maths's three positions (a fold that changes a ruling).** See heading 2: D64 says «this file takes the teacher's side on three», and the proposed folds of D66 and D67 dismantle that section and blur "strong default" against "strong option". Simplest: do not fold any of the maths copies (they sit in one file one lesson type reads). No question needed if nothing moves.
- **RE's depiction limit reaches only RE lessons (same kind as decision 6, low frequency).** I08 says «no lesson may request a picture of him or of any prophet», but only RE lessons read it. A Key Stage 2 history lesson on early Islamic civilisation reads the history file; the only other net is the image scout's «cultural care» check (`image-scout.md` · L77). If decision 6 stays, add it as one line there rather than as a new decision.
- **B08 against C45** (stop at once, or collect and bring at the end): maintainer only, and it goes with decision 2 if that decision is kept at all.

**Close to his calibrating examples, not raised as decisions:**

- **The dates beside his examples.** The E11 row says «only its date is a question»; the summary says «no new question». His answer to the quick-checks list's decision 10 (the Tudor calibration kept «without its date», agreed 23 September) settles it the same way for E11, E21, D12 and D42. Correct the E11 row and name the precedent in one line so he sees it.
- **The Classroom Secrets examples** (heading 1a) are in no ledger, so nothing can pin them when maths is folded. Add rows before any change.

Not real pulls, correctly left unraised: A01 against B07 (A06 reconciles them), A04 "whole" against D54's stop note (the file's own note and the reviewer's code agree), G18 against the designer's summary A10 (the subject file ranks above the designer's own rules, A01), D65 against the skill route (the route hands maths the choice), D43 against the voice guide (both name the exception).

## 5. Code and tests

**What the code enforces that the ledger omits or states wrongly:**

- **The validator refuses an idea met on one case.** `validate-lesson-design.py` › `validate_idea_instances` · L2570: «concepts {id} ({name}) is an idea, and an idea is met on more than one instance; ... Mark the beats that meet this idea on different evidence, or, if today's learning is a fact about one case, do not name a concept», and it also refuses an idea «met only where the teacher acts». This enforces E42, E44, G23, H11, I03 and J05. The ledger says «Everything else in these files is judgement» and lists no `conceptRef`.
- **The review card's own words** (heading 1b), and the packet stops the whole review if a listed subject file is missing (`require_file(subject_path, "selected subject reference")`, L2420). Renaming a subject file breaks every review of that subject rather than just missing it.
- **The packet's "Names on the board" cue flags source labels** (`SOURCE_LABEL`, L1365: «modern summary|reconstruct\w*|adapted from|\bsummary\b»), the code side of E31. The assumed-knowledge ledger names it; this list's code section does not.
- **"Never use 67" is narrower in code than the ledger says.** The ledger says the validator refuses «any number a class reads that has a 6 followed by a 7». Run against the real function (`c2_six_seven.py`), `0.67`, `6.7`, `£6.70`, `60-67` and `67-70` all pass: decimals and numbers joined by a hyphen are not checked. The docstring says decimals are exempt; the hyphen range exemption is undocumented. His ruling was "anywhere". Unsure whether he counts decimals or ranges, so this is a question for whoever owns the check, not for this list.

**Test pins the ledger claims that do not exist** (none of these tests reads the file):

- `test_design_review_packet.py` for E12, E17, E19: it builds fixture designs from the sketch's words («This classroom is from 1897.», «Has school completely changed since Victorian times?») but never reads `subject-history.md`. Changing the sketch would not fail it. It does read `subject-science.md`, only to hash it.
- `test_planning_consolidation.py` for G03 and H05: it reads only `lesson-designer.md` and `teacher-voice.md`.
- `test_reading_order_on_the_page.py` for B10: it reads preferences, templates, the speech file, the worksheet designer and one builder file.
- `test_names_on_the_board_are_read_as_the_class_reads_them.py` for E46: it uses Shaftesbury in fixtures and never reads the history file.

**Pins the ledger misses:**

- `test_lesson_designer_loading_guard.py` · L150 to L152: «## Real-world hooks» and «no hook is better than one that has to be forced» in `subject-maths.md` (D62). It also routes the `subject-*.md` family in the designer's loading section (A04).
- `test_do_beats_look_like_the_subject.py` · L35 to L40: «the subject file's `What a Do beat looks like`» in `preferences.md`, `do-beats.md` and `teaching-sequence-content-based.md` (A38, A36, A37).
- `test_adaptation_architecture_contract.py` · L283: «## Greater Depth in maths» (D55's heading).
- `test_plugin_root_contract.py` · L32: exactly one `${CLAUDE_PLUGIN_ROOT}` token in the skill (C03).

Confirmed correct: the packet's six exact names and the maths skip (A50 to A52), the validator's maths spelling (A54) and its message naming D31 (A53), the answer-order check (F43), the stale `doc-claims.test.js` note about `blank-surface`, and the timeline builders refusing "not to scale" (`shared/visuals/timeline-svg.js` L89).

## 6. Stories

All 18 of the ledger's "in the log?" answers hold when the log is searched case-insensitively. H18's "no" is right even though the log has the word "buzzer": that mention (L2432) is about criteria step length, not the polarity story. Missed:

- **Maths L91's story** («Generated Greater Depth sheets had drifted the other way ...») has no row in any ledger. It is in the log (L1035).
- **"One pair of toy plates for a whole lesson teaches the plates."** (E42) is a real incident told only in the validator's comment (L2578: «A history lesson on continuity and change once held one pair of toy plates for nine slides»). It is not in the build log. As written in E42 it reads as a plain undated example, which the plan allows to stay, but the E42 row should say so.
- Under "no overcomplications": H18 (the buzzer) and H39 (the photographs-only and shadows lessons) are undated examples that make their rules clear. The plan lets such a case stay as a plain example, so the summary's «each must be copied there before it can leave» applies to I23 and C43/C50 only if those are to leave at all.
