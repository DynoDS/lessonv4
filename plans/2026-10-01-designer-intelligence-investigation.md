# Lesson Designer intelligence investigation (1 Oct 2026)

Daniel's brief: does the designer genuinely reason like an expert teacher, or produce plausible lessons through heuristics? Investigate, stress-test, find root causes, then propose and design an evaluation. Also "design decisions" (slide/sheet choices) and "many lessons, not just today and yesterday". Investigation only: no plugin file edited.

Status (1 Oct 2026, evening): DONE. Diagnosis, six stress tests and independent marking complete. Report published: https://claude.ai/artifact/KDhurbmAwM1yRac1bMLBDM . Nothing in the plugin changed. Next decision for Daniel: whether to build and test change 1 (the child who learned nothing, written by the designer and attempted by the reviewer).

## Change 1 tested the same night (evaluations/change1-2026-10-01/): NO IMPROVEMENT

Daniel: "just do the first change and tests then turn my pc off". Candidate = snapshot plus record/change1.diff (designer step 4, diagnostic evidence bullet, new walk-through line per check, decisions evidence line, completion pass; reviewer first probe plus a `Missed-the-teaching attempts` report line). 11 runs: 6 stress briefs and leisure with the change, leisure without, old vs new reviewer on stress S5, one blind marker (blind/marking.md; key in record/).
- Checks a child who missed the teaching passes: baseline 20/24, candidate 21/24. Clear wins 1 each (Nightingale baseline, earthquakes candidate). Marker would rather teach baseline in 5 of 7, mostly narrowly.
- Designers' "can't be passed" claims still mostly false in both arms (about 6 of 20 hold). Writing the attempt down did not make self-marking honest.
- Reviewer: old and new both caught the S5 tone-sortable sort (new fixed two cards locally and wrote its attempts; old returned REDESIGN). No detection difference on n=1.
- Revised cause: answers leak through house supports on every board: model of the same question before the final; success criteria that are the rule as steps; headings/instructions stating the test; leading prompts; checks answerable from earlier lessons; a picture that is the answer. Checks that held showed the question but not the idea.
- Repair round deliberately not used (would only strengthen failed wording). Proposed next change, needs his ruling: one bare check per lesson (question and case only, no criteria/star fact/model/defining headings), ideally a slide type the validator can see. PSHE "know how to respond" may have no pass/fail check at all.
- Candidate NOT applied to the working plugin. Report updated (version 2).

## Stress test results (evaluations/stress-2026-10-01/)

Six designer-only runs on a frozen snapshot of the working plugin (HEAD 2f225caa plus 72 uncommitted files), general-purpose Opus agents reading the dev role file (default effort, not xhigh). Keys written first (scratchpad k7q/stress-keys.md, md5 e96c44fab6619feb9ec242bc7528f83c, unchanged after). Independent marker: `marking.md`.
- Grades: shadows strong, fractions competent, Nightingale strong, earthquakes strong (closest to exceptional), peer pressure competent, doubles strong.
- Always: rejects the plan's showpiece for a real reason (6/6); names the right misconception (5/6); plants near misses; commit before reveal.
- Never: bounds a rule (fractions 2/5 vs 4/5); centres the teacher's named equipment (torches, strips became prepared-day options, from the board-version-first ruling); non-writing final route for EAL/SLCN (5/6 finals written); weighs two final tasks (only Nightingale, the best final).
- 5/6 designs claim their evidence can't be passed from the board or common sense; marker showed it can. Strong/weak launch modelling the same task (Daniel's 1 Oct ruling) is part of it; designs label it supported, so the unaided evidence falls on earlier checks, which leak.
- Finesse in single choices (1906 fence, every place on a plate, ladybird middle spot, Ines's correct order, Florence's first job); every lesson still carries the full kit (8 to 11 beats).
- Keys too textbook: the model knows classic moves; discriminating tests need Daniel's own subtle misses.
- Side findings: validator caps beats at 50 min even for 60-min lessons; do-beats-in-a-row miscounts in skill routes; marker brief sat in the case folder ~3 min after launch (no key content).

Final ranked changes in the report: 1 child-who-learned-nothing written + reviewer attempt (replaces "plausible misunderstanding"); 2 three spines then choose (replaces stock route comparison); 3 one stronger-idea line in review (his call); 4 diagnose the child's head before the retelling; 5 brief's equipment/class change the main route (his call); 6 slim-rulebook ablation before any slimming; 7 Codex effort low vs medium.

## Evidence read

- `agents/lesson-designer.md` whole (171 KB, 28.5k words), `agents/design-reviewer.md` (first 210 lines + outline), `skills/make-lesson/playbook-lite.md` Phase 1 and 1.25, `references/task-contrasts.md` (opening), preferences.md section sizes.
- Real lessons in full: maths L21 subtract (1 Oct), history L5 leisure (1 Oct), science digestion explain (30 Sept). Headings and thinking lines: RE Nativity, PSHE sensible choices, history L4 Shaftesbury. Adaptation for leisure and maths L21.
- Reviews: leisure review-1 and final; maths L21; tally of 98 reviews since 20 Sept.
- Pattern greps across 155 design records since 27 Sept (includes trial runs and duplicates).
- Prior evaluations: teaching-judgement-2026-09-06, lesson-designer-quality-2026-09-15, cumulative-2026-09-16, eight-lens 30 Sept. Memories on split project, consolidation, less-is-more over-correction, told-first.

## Measurements

- Designer file size: 64 KB (28 Aug) -> 102 KB (3 Sept) -> 130 KB (13 Sept) -> 171 KB (1 Oct). 123 commits touch it; 133 commits since 1 Sept touch designer/preferences/reviewer.
- Startup reading for a history lesson, estimated: designer 171 KB + preferences start sections ~107 KB + voice/evidence intros ~25 KB + subject file ~50 KB + teaching-sequence file ~46 KB = ~400 KB; decision-point reads add ~100-120 KB. Roughly 80,000 words of instruction against a ~25 KB walk-through.
- Hard words (never/must/always): 139 in designer, 191 in preferences. Dated incident references: 16 in designer, 54 in preferences.
- Codex settings: designer and reviewer `codex_effort: low` since 4.2.239 (19 Sept), at Daniel's request; the log entry said at the time this was the setting most likely to bring back thin lessons. Claude: opus xhigh.
- Reviews since 20 Sept: 98; 70 APPROVED, 28 REDESIGN REQUIRED. Every sampled redesign finding is defect-shaped ("Defect: ..."): copying, restating, too much, missing model, institutional summary. None says a stronger option existed. The reviewer is told: "A different sound design choice is not a defect", "Do not produce minor improvement suggestions", "Acceptable variation: leave it alone and do not report it."
- Alternatives in design records: the only recurring comparison is the route ("Dialogic was the nearest alternative and was rejected: the question is not contested and children need the knowledge first", near-identical in about 15 records). Essentially no record compares two Do beats, two example sets, two ways to stage the sticking point, or two final tasks, although step 3 of the designer's working order asks for it when the task matters.
- Named-child judged claims: "Is X right/correct?" in 37 of 155 recent records; a `Name says: "..."` claim in 49.

## Findings by question (draft)

1. Deliberation: one ritual comparison (route), stock reasons. The told-first design writes one story and cuts every part from it ("never rewrite the lines to fit the telling"), so the first plausible story becomes the lesson. Genuine decision points: route, amount (retelling count). Not: task, example set, misconception staging, ending.
2. Diagnosis: strong on load for this class (new-things count, hand-up words, prior lessons). Weak on what is genuinely hard and what children currently think. Sticking points are often chosen to fit the lesson (leisure: "Victorian children never played"; PSHE: knowing the norm, when the real difficulty of a sensible choice at 9 is acting on it under excitement or friends).
3. Whole lesson: coherence is engineered (journey, unlocks, retelling, final task read backwards). Leverage is not: nothing asks whether one task can do two jobs. When double duty appears (digestion: Hazel Class's cracker model missing the small intestine sets up the next Teach; maths: 68 - 25 undoes yesterday's 43 + 25) it comes from the model's own knowledge, not the system.
4. Finesse: occasional, not encouraged. Blocked by single draft, defect-only checks, house defaults (takeaway first, named child's claim, "say the wrong version and put it right"), rule load.
5. Self-criticism: catches real defects. Confirmatory where it self-tests: the leisure designer tested its sort against a misunderstanding the sort catches ("marbles under today only") rather than a child who learned nothing (who sorts all six from common sense). The reviewer's two probes leave no written attempt; leisure review-1 noticed the worksheet repeats the Amara check and called it acceptable.
6. Premature satisfaction: yes, structurally. Nothing in designer or reviewer searches above "sound". Strongest single finding.
7. Trade-offs: house rules are mostly written as balances (good). Trade-offs are resolved by rule precedence, rarely weighed per lesson; records rarely say "gave up X for Y", except amount.
8. Adaptation: downstream adaptation designer is thoughtful (leisure GD: Freya poor and Henry rich in the same year, Jamal after 1880). That GD item is the discriminating check the class lesson's Amara check lacked: capability exists, routed to "depth" instead of the core check. Class lesson for SEND/EAL is one blanket policy ("talk to the child who understands least"). Below tier not examined in depth.
9. Research knowledge: arrives mainly as house rules derived from Daniel's feedback; catalogues (do-beats 80 KB, evidence-synthesis 40 KB) exist but records rarely show research changing a choice. Eight-lens research (30 Sept) found refutation weaker for young children; the house default still says the wrong version and puts it right.
10. Simplicity: strong guards (retelling count, read-aloud floor, Pride Lessons, one idea per Teach). Lessons are pitched simply. Complexity lives in the instructions, not the lesson; but every lesson carries the full furniture (starter, card, Teach, Do, Teach, check, launch with model, practise, sheet), so "one rich task done well" is rarely chosen.
11. Ceiling: (a) rule load and incident accretion; oscillations show rule-chasing (judged claims: every lone claim wrong -> every lone claim half right -> "make it right outright"; less-is-more over-correction 27 Sept); (b) single draft; (c) defect-only review; (d) author self-checks are confirmatory; (e) Codex low effort on the two thinking roles; (f) evaluations mostly one run per cell, same-model judges, measure defects or overall preference, not whether the expert move was noticed.

Real-output examples of "competent, not the strongest":
- Leisure sort (Victorian / both / today): six cards common sense sorts; the electricity rule is printed on the Teach before it. Stronger: cards where the rule must be used (clockwork toy, torch, board game, comics, a bike).
- Leisure Amara check: timeline prints "1842: Sarah worked in the mine"; picking Amara needs no law. Stronger: a 12-year-old in 1890 (the law only covered 5 to 10), or two children in the same year, one rich and one poor (the GD sheet's own move).
- Maths L21: practice includes 75 - 39 and 92 - 48 while compensation is deferred; three wrong answers told in the My Turn rather than drawn from children's own attempt at 63 - 25 first; no "is the answer sensible?" estimate routine.
- PSHE sensible choices: every case has an obvious right answer; teaches the norm, not the decision.
- Nativity: True/False sort of the story just told; "Mary and Joseph lived in Bethlehem" marked false is contestable (Matthew); pick-the-statement wise men Do.
- Digestion: strong (grape claim, banana and tights, sweetcorn, grandad), but the tights demonstration is observed after the headline, where a prediction before the squeeze would make children commit (conflicts with Daniel's takeaway-first ruling: his call).

## What should not change (draft)

Told-first telling and retelling (coherence and amount, Daniel-validated); read-aloud floor; one idea per Teach and Teach-Do rhythm; his voice work; the validator for mechanics; the reviewer's defect role; previous-lesson continuity; "fix the thought" principle; task-contrasts.md format.

## Proposals (draft, untested)

1. Real alternatives at two or three decision points only (sticking-point move, final task, example set), judged on the thought forced, the written answer of a child who learned nothing, cost, and double duty; runner-up recorded. Replaces the stock route comparison.
2. Self-test against "a child who learned nothing today, with everyday sense", written out for counted Dos and the final task; reviewer's probes written in the review for load-bearing tasks.
3. One "strongest missed move" slot (suggestion, not defect, no redesign loop); challenges his one-reviewer/sound-choice ruling, so his call.
4. Ablation before any rule diet: same briefs, full designer vs compact core; blind judged by Daniel.
5. Codex effort low vs medium on one brief.

## Stress-test plan (awaiting his go)

Designer-only runs (Phase 1, no pictures or build), Claude, on briefs where the obvious move is not the best, each with an expert key written before running: what an exceptional teacher would notice, and the tempting weaker moves. Score which appear. Candidate briefs: Y3 science shadows (exciting torch play vs thinking), Y5 fractions compare (bigger denominator misconception changes the route), Y2 history with heavy EAL/SEND (writing would hide the learning), Y6 earthquakes (building earthquake-proof houses thinks about the wrong thing), Y4 PSHE peer pressure (knowing vs doing), Y1 doubles in 30 minutes with significant SEND (doing less).
