# Lesson Designer quality: implementation report, 15 September 2026

One report for the branch `lesson-designer-quality-2026-09-15` in `DynoDS/lessonv4`, written for the teacher and for an independent review. Every claim carries its evidence level: **mechanically checked**, **fresh outputs compared (Claude-run)**, **teacher-read**, or **classroom-tested**. Only the first two were reachable in this task; nothing here is teacher-read or classroom-tested.

## 1. Revisions, branch, commits

| | |
|---|---|
| Base revision | `38c6a07cdd800cbb6e81785e065ad06a25f17a4c` (4.2.212), the plan's verified baseline; the working copy was at exactly this commit when work began |
| Local branch | `lesson-designer-quality-2026-09-15`, in the worktree `C:\Users\Daniel\Projects\lessonv4-designer-quality` (the main checkout at `C:\Users\Daniel\Projects\lessonv4` was not touched; its untracked output folders are preserved) |
| Head revision | see the last line of `git log` below (the evaluation commit is the last) |
| Version | unchanged at 4.2.212; nothing is released, installed or published, and the branch has not been pushed |

Commits, oldest first, each one purpose:

1. `23046181` A content lesson's main work sits where the class is ready for it (7A: validator, scaffold, route file, reviewer route check, tests).
2. `3a96b51c` The Tudor sorts are approved wording, not evidence of historical thinking (5B: history file, preferences key, build-review-log correction, structured-sort acceptance condition, slide-designer notes, tests).
3. `2d0c5620` One working order for the teaching decision, and two probes in the review (5A, 5C, 6, 7B: designer working order and completion pass, contrasts reference and its routing, reviewer probes, fixture cases, tests).
4. `113dab9b` A sort done with cards at tables arrives as a printed kit, or the run says so (7C: handling field, card-set renderer, kit check, run-report rule, delivery, docs, tests).
5. `0e117037` A whole content design with a card sort runs through the real validator (7C end-to-end fixture test).
6. `5affc7ff` Tighten the designer's working order and kit decision.
7. (final) The evaluation folder: cases, protocol, results, this report and the bundle manifest.

Changed files: 31 in the plugin (`git diff --stat 38c6a07c..5affc7ff`: 1,901 insertions, 71 deletions) plus the evaluation folder.

## 2. What changed, and what was replaced or retired

**Teaching decisions (Lesson Designer).** The opening section `Settle the classroom experience before collecting content` is now one working order: settle what children need to understand, choose what establishes it, choose what children do with it, check what their responses would show. It replaces the earlier rehearsal paragraph (same obligations, kept verbatim where tests pin them) and folds in four things the plan asked for that had no home: the pivotal teaching supplies the connection a child would otherwise have to invent (a fact, a picture and a question are not enough; a short explanation may be); research answers a real uncertainty from a source a historian or scientist would accept, never a habitual pedagogy search; an alternative is compared as the actual explanation and pupil work, not route names, and only when the choice matters; and the main task is worked twice, once as a child who understood and once holding a plausible misunderstanding. The `compare with a simpler route` sentence later in the file now points at that step instead of restating it. The completion pass's `Classroom sequence` check budgets actions rather than slides (listening, reading, whiteboard drawing, arranging cards, moving to tables, checking answers), says a split Teach slide is one episode, requires the orientation to say what to prepare and where the main work sits, and states that no universal carpet-time limit or movement interval is wanted. The orientation shape gains an optional preparation clause. *Retired:* nothing else; the file grew by about 6 KB (section 7), which is the honest cost of the four additions.

**Examples.** `subject-history.md` → `A why lesson is not only explaining` no longer holds the rebuilt Tudor sorts up as the model of historical thinking. It keeps them as the calibration for both halves: the job match that worked, and the two sorts that were approved for wording and plain headings and taught shallow, with the test a hands-on beat has to pass (could a child place every card without the history just taught?) and three shapes where the period is needed to decide. `preferences.md` → the rhythm section drops the exclusive key on `knowing when bread is baked just right` and names the three honest repairs (a cleaner card; the second placement recorded in `acceptanceCondition`; a task where the overlap is the point). The build review log carries a dated correction at the top and the 4.2.202 and 4.2.205 entries stand as history. The other four subject Do-beat lists were reviewed (geography, science, RE, PSHE) and left alone: each already conditions its ideas on fresh cases and the taught rule, and none certifies an activity as evidence. A new `references/task-contrasts.md` (six contrasts, one per subject family, each with a weak task, a stronger task for the same purpose, what each requires, and where the simpler task is right) is read once by the designer at the task decision and always by the reviewer. *Retired:* the "did its thinking with its hands" endorsement and the exclusive key.

**Review.** `design-reviewer.md` → `3. Thinking, practice and evidence` opens with two probes on the worked answer the reviewer already produces: can weak understanding still pass (a named misunderstanding, the bypass, the answer it permits) and can good understanding be marked wrong (a defensible alternative against the key), with their limits (retrieval starter, quick check, repeated calculation, supplied source, personal reflection) and the shape of a material finding (task, bypass, learning untested, smallest repair) mapped onto the existing ownership boundary. The reviewer's compatibility route and the packet's always-read list include the contrasts file. Five cases join the behaviour fixture. *Retired:* nothing.

**Lesson route.** The Content-based route pinned its Practise to the last unit in both the validator and the scaffold (a hard rejection, `Content-based Practise must occur exactly once and last`, reproduced before editing). A Practise may now follow any complete Teach → Do pair, once or more, with teaching the work earned continuing as ordinary pairs after it; a Practise before any teaching, a Teach without its Do, a bare Do, an Observe not before a Teach, and a sequence with no Practise are all still refused. The route file states the readiness judgement and its limit; the reviewer's route check judges an early Practise by readiness, not position. The slide layer needed no change (answer delivery and launch slides key off unit kind, not position). The other four routes were read and left alone: Skill-based already allows free `practise` placement; Task-Centred, Dialogic and Discovery have their own settled shapes. *Retired:* the position rule.

**Printable handling materials.** No route printed items to move (the worksheet prints in place with no cut guides; the stick-in pack had a closed registry of write-on figures and read-from sources). The canonical home is the stick-in pack, which already had cut guides, per-set tiling, identity tags and delivery-report tracking. A sort's `taskStructure` may carry `handling` (`cards`; per child, pair or group with a stated group count; a one-line teacher `where`); saved designs without it keep their meaning. The pack gains a `card-set` moment copied from the unit itself, printed once per set with cut guides, shuffled away from the key, tagged, with the key, acceptance note and preparation line in a separate teacher file (`<lesson> - Stick-in Sheets - Answers.txt`, which delivery already carries by suffix). A `stick-in-kits` check refuses a missing or drifting kit before the build; the build refuses a kit it cannot print faithfully and never reports a short pack as success; the run report cannot close COMPLETE while a required kit is undelivered, and cannot leave it unmentioned. No new agent was added: the stick-in designer copies the kit from the unit, and the worksheet is not made to stand in for it. *Retired:* nothing; the playbook's whole-file byte alarm was raised by 1 KiB for the gate text (the per-slice budget a worker pays is unchanged).

**Structured sorts.** A structured sort answer may now carry an `acceptanceCondition`, composed into the speaker notes as `Also accept:` by the slide designer, so a defensible second placement reaches the teacher. Previously the contract forbade it.

## 3. Protected preferences and the evidence they survived

Recorded here as owners and checks, not as copied text.

| Protected | Owner | Evidence it survived |
|---|---|---|
| Teacher's voice conventions (questions, definitions, criteria, model answers, notes) | `teacher-voice.md`, `preferences.md` → Written Voice | Neither file's voice sections edited; `test_teacher_voice_reach`, `test_voice_reaches_every_string`, `test_child_facing_wording_reach` pass |
| The Tudor Teach boards and the amount calibration | `preferences.md` → Pride Lessons | Untouched; `test_the_board_carries_the_route` and `test_fit_is_judged_against_the_pride_lessons` pass |
| Plain sort headings, fresh cases, one card left over | `preferences.md` → rhythm section | Kept verbatim; `test_do_beats_look_like_the_subject` passes with its assertions retargeted to the narrowing |
| Objective never widened, displayed LO rule, answer protection, picture budget | `lesson-designer.md` Date + LO, Protect answer, Worksheet | Untouched; `test_displayed_lo_has_no_prefix`, `test_learning_is_named_before_the_task` pass |
| Answer delivery legality, structured-answer completeness, photo identity | `validate-lesson-design.py` | Only the sort acceptance-condition rule and the optional `handling` block changed; `test_lesson_design_contract` (all), `test_a_sort_key_can_accept_a_second_home` pass |
| Calm classroom, no compulsory movement | `do-beats.md`, `preferences.md` → Classroom Norms | Untouched; the kit guidance says a move to tables is the calm move the teacher asked for, never a routine |
| Useful simple practice and quick checks | `preferences.md` → rhythm, `task-contrasts.md` boundary cases, reviewer probe limits | Cases H2, M1, E2, P2 judged PASS by both reviews (section 5) |
| Worker settings, liveness, completion discipline | `skills/make-lesson/*`, `worker-launch.py` | Model and effort settings untouched; `test_worker_launch`, `test_worker_lifecycle_orchestration` pass; the playbook grew by the kit gate only |
| Saved designs load and build | validator, scaffold | `handling` and `acceptanceCondition` optional; `test_a_card_kit_reaches_the_table` validates the saved-style content contract with and without the block; the 18 saved designs are not in this tree and were not re-run |

Contract migration: none forced. Two optional fields were introduced (`taskStructure.handling` on a sort; a non-null `acceptanceCondition` on a structured sort). A route rule was relaxed, not tightened, so every previously valid Content-based design remains valid.

## 4. Tests and results

Commands run from `plugins/lesson-v4` with Python 3.13.5 and pytest 9.0.3, exactly as the repository's tests are laid out (there is no test runner script; the conftest in `scripts/` supplies fixtures).

```
python -m pytest scripts/tests scripts/test-validate-lesson-design.py scripts/test_question_crop.py -q -p no:cacheprovider
```

| Run | Result | Exit |
|---|---|---|
| Baseline (38c6a07c, this machine) | 11 failed, 1832 passed, 1 skipped, 1934 subtests passed | 1 |
| Head (5affc7ff) | 11 failed, 1879 passed, 1 skipped, 1972 subtests passed | 1 |

The eleven failures are identical before and after and are all pre-existing on this Windows checkout (`core.autocrlf=true` writes CRLF working files, and five reference-view subtests plus one compact-entrypoint subtest compare against LF text; the other five are string assertions about worker instructions that already failed at baseline). They are listed in `baseline-failures.md`. No new failure; 47 new tests pass.

```
cd stick-in-sheets-html && node --test            # 57 pass, 0 fail (50 at baseline)
cd test && node --test <each *.test.js>            # 33 pass, 1 fail (the same working-wall P3 assertion fails at baseline, CRLF)
```

New test files (wiring tests are labelled as such in their docstrings; none is a teaching-quality test):

- `test_the_main_work_sits_where_the_lesson_earns_it.py`: conventional route, early main work, eight malformed shapes, validator/scaffold parity, route wording.
- `test_a_sort_key_can_accept_a_second_home.py`: acceptance condition on a structured sort, key completeness, notes routing, preferences repairs.
- `test_the_task_is_chosen_from_what_it_requires.py`: the working order and its owners, research and comparison rules, action budgeting, contrasts routing to both agents, reviewer probes and limits, fixture case ids.
- `test_a_card_kit_reaches_the_table.py`: `handling` validation, kit faults (missing kit, six kinds of drift, kit for a board sort), the command's OK and fault lines, build outputs, run-report refusal of COMPLETE and of silence, a PARTIAL report that names the kit, delivered kit closes normally, end-to-end validator on a saved-style design.
- `stick-in-sheets-html/test/card-kit.test.js`: cards and headings once per set with cut guides, key never on a pupil page, stable non-key order, answers file contents, nine refusals by name, a refused kit is not a success, mixed pack.

Unrun: the 18 saved designs of the production drive (not in this repository); any run of the make-lesson pipeline end to end; the production runner.

## 5. Trials: the fixed cases and the fresh designs

**Fixed judgement cases** (`judgement-cases.md`, `fixed-cases/`): fourteen paired cases across seven subjects, held out from the runtime references, batched blind to a Claude subagent following the candidate reviewer's guidance and to one following the baseline's. Both returned fourteen of fourteen expected verdicts with reasons that match the predefined ones, and both found the planted second answers. `fixed-cases/result.md` says what that does and does not show: the candidate reviewer's judgement is shown on fixed cases, but the batch does not demonstrate that the probes improved the reviewer, because the assignment format itself asked both reviewers for the bypass and the second answer. A neutral-prompt discrimination run is the first thing to do next; it was not run because the plan's two-assignment cap was spent.

**Fresh-design comparison** (`trial-protocol.md`, `trials/`): see section 5A below, filled in when the six runs returned.

**Rendered check**: `bundle/kit-preview/` holds the card kit built from the fixture `stick-in-sheets-html/test/fixtures/card-kit.json` (the now/later apprentice sort as a table kit, one set between two, class of 30): the HTML pack, the teacher answers file and a screenshot of page 1. Chrome's PDF step is not installed on this machine (`puppeteer-core` absent), so the pack is the `.html` fallback the builder writes with `PDF_SKIPPED`, which is the same file the PDF is printed from. Five pages for fifteen sets; four columns; headings thick-bordered; cards in a stable non-key order; the tag `Deal` stamped on every card; no key on any page. No slide was rendered: the slide layer was traced and needed no change, and rendering a deck needs a full slide-designer run, which is outside the cap.

## 5A. Fresh designs: the comparison did not show an improvement

Six designs, three briefs, baseline and candidate, all six validating `LESSON_DESIGN_OK` (re-checked independently against each arm's own validator). Both arms are Claude-run from the configured instructions; neither is the production designer. The three pairs were blinded (A/B randomised per pair, labels stripped, the key held back) and judged by a further Claude subagent against the four frozen questions. Its full reasoning is `../pair-comparison.md`; the key is `blind/key.json`.

| Pair | Learning | Teacher use | Pupil experience | Materials | Would rather teach |
|---|---|---|---|---|---|
| T1 Vikings | baseline | baseline | baseline | baseline | baseline |
| T2 Sound | **candidate** | baseline | **candidate** | **candidate** | candidate |
| T3 Partitioning | baseline | **candidate** | baseline | **candidate** | baseline |
| Totals | 1 of 3 | 1 of 3 | 1 of 3 | 2 of 3 | 1 of 3 |

Seven of twelve preferences went to the baseline. **On this evidence the candidate designs are not better, and the honest reading is no demonstrated improvement at this sample size.** One caveat on the maths row before the rest: a usage limit stopped five of the six first attempts, and the session's model changed at the reset, so the maths baseline is the one design written by Claude Fable 5.1 while every other design here is Claude Opus 5. That pair is therefore confounded and its two baseline preferences should not be read as evidence about the guidance. The Vikings and sound pairs are clean, and they split one each. Two things sharpen the picture.

**The new affordances were never exercised.** No candidate design placed its Practise early (all three ran the conventional shape), and none chose a card kit; the candidate Vikings design used fewer structured tasks than the baseline's, not more. So the route change and the kit route carry no fresh-design evidence at all in either direction: they were available and unused. Three briefs is too few to say whether that is right restraint (none of these lessons obviously needed either) or guidance that does not reach the decision.

**The judge's reasons cut across the arms.** The faults it named are the faults the candidate guidance is about, and the candidate committed two of them. In T1 it preferred the baseline because the candidate's main task could be answered from its own board, which is exactly the probe's bypass test failing on the design that was supposed to have absorbed it. In T3 it preferred the baseline on learning because the candidate never modelled a tens product as large as the ones its practice set demanded, and on pupil experience because the candidate's last beat widened past the objective. Against that, in T2 it preferred the candidate precisely on the new ground: the baseline printed a model answer to its own main task one slide earlier, about the same guitar and the same two children, and the candidate modelled a different case and asked about a new one.

So the guidance demonstrably did not prevent the failure it targets. What it did not do either is make anything worse in a way the judge named: the candidate designs kept the objective, the voice, the calm classroom and the picture discipline in all three pairs, and the two questions where candidates led (materials twice, teacher use once) are about faithfulness and board readability.

**What would settle it.** A larger, cheaper comparison on the one question that matters (can the main task be done from the board?), scored mechanically on a dozen briefs rather than richly on three; and the production runner, since the instructions are written for gpt-6-astra and were exercised here by a different model. Neither was possible inside this task's cap.

## 6. Representative output and printable kit

`bundle/kit-preview/Why did Tudor children work - Stick-in Sheets.html`, `... - Answers.txt`, `kit-page-1.png`. The slide side of the same activity is the existing sort slide (the taught deck's slide 10 shape, template unchanged) with the instruction `Put each card under a heading` and the teacher note `At tables, one set between two`; no new slide template was needed.

## 7. Usage, context and cost

- Subagent launches in this task: 3 read-only traces; 6 design trials, of which 5 had to be relaunched because a usage limit stopped the first attempt before it produced a design (those 5 attempts are counted here and their partial files kept, but they are not trials); 2 case reviews; 1 blind pair comparison. Claude Fable 5.1 for the traces, the first attempts and the case reviews; Claude Opus 5 for the five relaunched designs and the comparison, because the session's model changed at the usage reset. The Vikings and sound pairs are clean (both arms relaunched, so both are Opus 5); the maths pair is not, because its baseline survived from the first round under Fable 5.1 while its candidate was written by Opus 5, so that pair's two baseline preferences may be a model difference rather than a guidance one. No production (gpt-6-astra) launch, no image generation, no cloud job.
- Model-facing context, in source bytes (LF), before → after: `lesson-designer.md` 131,990 → 138,337 (+6.3 KB); `design-reviewer.md` 61,658 → 64,802 (+3.1 KB); `preferences.md` +0.6 KB; `subject-history.md` +1.5 KB; `teaching-sequence-content-based.md` +1.1 KB; `stick-in-sheets-pedagogy.md` +3.5 KB; `stick-in-sheets-designer.md` +1.0 KB; `playbook-lite.md` +0.6 KB; new `task-contrasts.md` 7.9 KB, of which the reader loads 7.0 KB, once per designer run and once per review. These are source sizes, not subscription costs, and the designer file's growth is against the plan's wish for a smaller account; what was folded (the rehearsal section) was smaller than what the four new steps needed. Nothing was moved behind conditional loading except the contrasts file, which is conditional for the designer and always-read for the reviewer.
- New recurring stage cost: one extra script call per run (`stick-in-kits`, sub-second) and, only when a lesson chooses a card kit, the kit pages and answers file in the existing stick-in build.

## 8. Uncertainties and the optional experiment

- **No production-generation evidence.** The configured runner is Codex (gpt-6-astra). Every trial here is Claude-run from the configured instructions. Whether the same instructions move gpt-6-astra at medium effort is untested.
- **No teacher-read or classroom evidence.** The narrowed history guidance, the working order, the probes and the kit have not been read by the teacher or used in a room. A brief later check on one selected trial lesson (which beat the class was ready for, whether the kit was used and how long the sort took) is suggested; no results are invented here.
- **The reviewer probes are not shown to add value** on the fixed cases (section 5); the leak in the assignment is the likely reason, and a neutral-prompt rerun is cheap.
- **The kit has been built and looked at, not printed.** Grayscale legibility is by construction (ink only, no fills); actual cut and handling by a class is untested.
- **Staging experiment (section 8 of the plan): not run.** It needs an already available runner and the core checks to pass first; the runner is unavailable, so it is recorded as unproven and the simpler core-improved route stands.
- **A model-effort comparison** was not run and no setting was changed.

## 9. How to revert each logical change

Each commit is self-contained and reverts cleanly with `git revert <sha>`; the order below avoids conflicts.

| Change | Revert |
|---|---|
| Card kit route (7C) | `git revert 0e117037 5affc7ff 113dab9b` (the tightening commit touches the kit paragraph, so it goes with it); this also restores the playbook's 73 KiB alarm |
| Working order, contrasts, reviewer probes, action budgeting (5A, 5C, 6, 7B) | `git revert 2d0c5620` (after the above) |
| Tudor narrowing and sort acceptance condition (5B) | `git revert 3a96b51c` |
| Lesson route (7A) | `git revert 23046181` |
| Evaluation folder only | `git revert` the final commit, or delete `evaluations/lesson-designer-quality-2026-09-15/` |

Reverting any one leaves the others working: the kit does not depend on the route change (a kit can sit on a Do beat or a Practise wherever it is), and the contrasts file's routing is inside the 5A commit.

## 10. Sharing this work

The branch exists only on this computer. To let an independent reviewer see it: push the branch to GitHub (`git push -u origin lesson-designer-quality-2026-09-15`, which needs the teacher's say-so) and open a pull request, or export `git format-patch 38c6a07c..HEAD` and share the patch files with the `bundle/` folder. The bundle manifest (`bundle/manifest.md`) links every file to the base and head revisions and the trial it belongs to. No credentials, no conversation history and no private pupil data are in the bundle; the teacher's taught deck is referenced by path, not copied.
