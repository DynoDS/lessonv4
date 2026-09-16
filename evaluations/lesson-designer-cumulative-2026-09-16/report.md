# Follow-on report: bounded knowledge, a developing lesson, cumulative Do beats

16 September 2026. Extends the Phase 1 report (`evaluations/lesson-designer-quality-2026-09-15/report.md` on branch `lesson-designer-quality-2026-09-15`) rather than repeating it. Evidence levels as there: **mechanically checked**, **fresh outputs compared (Claude-run)**, **teacher-read**, **classroom-tested**. Only the first two were reachable; nothing here is teacher-read or classroom-tested.

## 1. Revisions and the reviewable diff

| | |
|---|---|
| Phase 1 completion | branch `lesson-designer-quality-2026-09-15` at `21b7c508` (last code change `5affc7ff`), local only |
| Follow-on base | `21b7c508` |
| Follow-on branch | `lesson-designer-cumulative-2026-09-16`, worktree `C:\Users\Daniel\Projects\lessonv4-cumulative` |
| Follow-on head | named in `bundle/manifest.md` (the evaluation commit is last) |
| Reviewable diff | `git diff 21b7c508..lesson-designer-cumulative-2026-09-16` |
| Version | unchanged at 4.2.212; nothing released, installed, pushed, scheduled or delivered |

The Phase 1 branch and worktree were not changed; they served as the baseline arm for the trials.

Commits, oldest first:

1. `d7ed3757` Tasks work from what children can use, with material and thinking chosen together (`preferences.md`, `do-beats.md`, `lesson-designer.md`).
2. `424c1aa0` The Tudor example puts the thinking in the consequence, and a sequence contrast joins (`task-contrasts.md`, `subject-history.md`, build review log, Phase 1 test count).
3. `0b084af5` The review checks inflation, real links and the correctness handover in its existing pass (`design-reviewer.md`, new wiring test).
4. `f3882707` Freeze the follow-on case pack and trial protocol before any trial runs.
5. `afc419d0` The evaluation record (this folder): development record, trials, review, rendered excerpt, report, manifest.

## 2. Retained, replaced and newly changed

The item-by-item account, with evidence, is `development-record.md`. In short:

**Retained from Phase 1 unchanged:** the working order in the designer; the reviewer's two probes; the early main-work route; the card kit; the sort acceptance condition; action budgeting in the completion pass. None needed rewriting; each gained at most a pointer.

**Replaced (superseded wording):**
- `task-contrasts.md`, history: the "stronger" task asked why Will's family was unhappy (answerable by naming the missing training the case states) and offered a card task with one tidy keyed answer (`Which two would a Tudor family have minded losing most?`). Now the thinking is the consequence (what Will would miss out on when he grew up), with the changed family explicitly not implying food and a bed were worthless.
- `subject-history.md`: the same two example shapes, and the tidy placement question, replaced by the consequence, the changed family done honestly, an organise-then-use sequence, a warning against untaught rules, and the need to teach hardship when the objective includes it.
- `design-reviewer.md` probe example: "a shoemaker who fed Will and never taught him does not [pass]" now requires the question to ask for the consequence.

**Newly changed (all in existing owners, no new fields, no new files in the plugin):**
- `preferences.md` → What a Lesson Is For: `Work from what children can use at that point` (the local knowledge boundary; new evidence allowed; untaught mechanisms not smuggled in).
- `preferences.md` → The Teach → Do Rhythm: `Choose the material and the thinking together, then how children respond` (with the seven subject-material examples as examples, not routes); two sentences added to `A link carries learning` (repeated props are not evidence; the deletion question); `Read a link as four things in the actual content` with the correctness handover; `Claim what the work can show, and no more` (a six-row table and the "no discovery required after every Do" limit).
- `do-beats.md`: `Operations to think with (optional)`, an eleven-row table read only when a task looks thin, with a pointer from How to pick.
- `task-contrasts.md`: one short-sequence contrast (varied-looking, inflated, a science sequence that builds, and its boundary).
- `lesson-designer.md`: pointers from working-order steps 3 and 4, a correctness-handover and honest-claim line in the completion pass, and the conditional loading line for the operations table.
- `design-reviewer.md`: the weak-understanding probe also run in reverse (inflation by untaught content); the sequence check reads the link in the expected response and later prompt, not the `unlocks` line, and checks the handover; the variety check also reads where the substantial work starts and what reaching it costs.

**Added recurring cost (source bytes, line endings excluded):**

| Reader | Section | Before | After |
|---|---|---|---|
| Designer, every run | `preferences.md` → What a Lesson Is For | 10.7 KB | 12.5 KB |
| Designer, every run | `preferences.md` → Rhythm | 21.4 KB | 25.8 KB |
| Designer, every run | `lesson-designer.md` | 138.3 KB | 139.4 KB |
| Designer, at the task decision | `task-contrasts.md` → The contrasts | 7.0 KB | 8.9 KB |
| Designer, only when a task looks thin | `do-beats.md` → Operations to think with | none | 4.6 KB |
| Reviewer, every run | What a Lesson Is For and The contrasts (always-read) | 17.7 KB | 21.4 KB |
| Reviewer, every run | `design-reviewer.md` | 64.8 KB | 66.4 KB |

About 7 KB more for the designer and about 5 KB more for the reviewer on a normal run. These are source sizes, not subscription savings or costs. No new worker, stage, script call or file per lesson.

## 3. Protected preferences and owners

| Protected | Evidence it survived |
|---|---|
| No device named in the rhythm section (the teacher's calm-classroom preference) | First draft named a whiteboard; `test_teaching_reaches_the_board` refused it; wording changed, not the test |
| Voice guide, teacher boards, Pride Lessons, success criteria, colour, answer delivery | Not edited; their tests pass |
| No em or en dashes added | Counted per changed file before and after: identical |
| Useful simple checks, fluent practice, meaningful discussion | Stated in the new rhythm paragraph, the claims table, the operations table and the sequence boundary; fixed cases C07, C10, C16 judged PASS |
| No new contract fields, no depth validator | Wiring test asserts `knowledgeBoundary`, `knowledgeOperation`, `learningGain` absent from validator and template; no validator change |
| Subject files add, never override | Only the history file changed, and only its own Tudor example; the shared statements live in preferences |
| Saved designs keep their meaning | No contract or code change in the follow-on |

## 4. Tests

Commands from `plugins/lesson-v4` (Python 3.13.5, pytest 9.0.3, Node on Windows with `core.autocrlf=true`):

```
python -m pytest scripts/tests scripts/test-validate-lesson-design.py scripts/test_question_crop.py -q -p no:cacheprovider
cd stick-in-sheets-html && node --test
```

| Run | Python | Stick-in node |
|---|---|---|
| Follow-on base `21b7c508` | 11 failed, 1881 passed, 1 skipped, 1972 subtests passed | 57 passed |
| Follow-on head | 11 failed, 1895 passed, 1 skipped, 1972 subtests passed (the identical eleven failure ids) | 57 passed |

The eleven failures at the base are the same pre-existing Windows line-ending and string failures recorded in Phase 1 (`evaluations/lesson-designer-quality-2026-09-15/baseline-failures.md`). New: `test_the_lesson_builds_on_what_children_can_use.py` (wiring only, 14 tests), which accounts for the 14 extra passes. Changed: the Phase 1 wiring test now counts seven contrasts. No code path changed, so no behavioural code test was needed. The slide builder has no `npm test` script, so its own tests were not run; its locked dependencies were installed with `npm ci` in the follow-on worktree (git-ignored) only to build the rendered excerpt.

## 5. Cases, trials and blind judgements

**Frozen before any trial ran** (`f3882707`): `cases.md` (sixteen cases, predefined reasons, provenance), `blind-cases.md`, `trial-protocol.md` (two held-out briefs, arms, budget, neutral questions). The cases were written after the runtime guidance was first drafted, but no case, trial or review had run and nothing was tuned against them afterwards.

**Authoring (four assignments, the plan's ceiling).** Baseline arm: Phase 1 head. Candidate arm: follow-on head. Both Claude Opus 5 subagents in one session, same brief, same instruction, first attempt kept, no web. Episodes only (walk-through with pupil wording and expected answers; no scaffold or JSON). All four returned. These are Claude-run illustrative designs from the configured instructions, not runs of the production designer (gpt-6-astra, medium).

| Brief | Baseline | Candidate |
|---|---|---|
| B1 Science: temperature and evaporation | 9 slides | 11 slides |
| B2 English: inverted commas | 8 slides | 7 slides |

**Review (one batched assignment, the plan's ceiling).** One Claude Opus 5 subagent. Part A judged the sixteen blind cases under the follow-on reviewer's guidance with a neutral prompt (verdict and reason only, never a bypass or second-answer line, the Phase 1 leak). Part B compared the two anonymised episode pairs against the frozen neutral questions. Full text: `review.md`; key: `bundle/episode-key.json`.

**Part A: sixteen of sixteen verdicts matched**, and each reason matches the predefined reason (for example C01 names the printed `training ✗` and the missing consequence; C03 names untaught statute and guild content; C06 accepts supplied results as evidence to interpret; C13 notes the tracing is confirmed before it is built on). On C05 the reviewer went slightly further than the predefined reason, arguing an acceptance condition alone would empty the sort, which is a sound refinement rather than a disagreement.

**Part B, unblinded:**

| Pair | Learning | Development | Teacher use and voice | Pupil experience and preservation | Would rather teach |
|---|---|---|---|---|---|
| Science | candidate | candidate | no difference | candidate | candidate |
| English | candidate | baseline (slight) | no difference | no difference | candidate |

Four preferences to the candidate, one to the baseline, three no difference; the candidate episode preferred to teach from in both pairs. The reasons, in the reviewer's words: in science the candidate children "decide from their own numbers", the teacher checks the amounts before the next slide ("A class that carries 35 ml and 48 ml forward will reach the opposite conclusion"), and the end task requires the results, while the baseline told the relationship and its board said boiling is fast evaporation, which is inaccurate. In English the candidate made the end-mark decision impossible to bypass from the reporting verb (two sentences with `said` needing different marks), while the baseline's practice paired each verb with its matching mark and taught "! for a shout"; the baseline was slightly better on development because its end task worked on the bubbles themselves.

**What this does and does not show.**
- It is a small screen, two briefs, and the first comparison in this project where the candidate was preferred. It is not proof that future lessons will be better.
- Same-model review. Worse, Part A loaded the candidate guidance into the same reviewer before it judged the episodes in Part B, which could tilt it toward the candidate's standard. The plan's single-assignment cap made that trade; a separate neutral reviewer for the episodes is the obvious next check.
- The fixed cases show the candidate reviewer's judgement. They do not show the follow-on improved on the Phase 1 reviewer, because the Phase 1 guidance was not run on these cases (cap).
- The comparison is against Phase 1, which itself showed no improvement over the original baseline. So the claim reachable here is "follow-on preferred over Phase 1 on two briefs", not "better than the plugin before September".
- Neither episode chose a card kit or an early main task, so those Phase 1 routes remain unexercised by any trial.

## 6. Rendered excerpt

`bundle/render/`: five slides built with the real slide builder from the candidate science episode (its slides 5, 6, 7, 8 and 10: working out the water that evaporated, deciding which sentence the results show, turning amount into speed, Leo's towel claim, and the check), rendered through PowerPoint to page images and a contact sheet.

Every child-facing string and script is copied from the episode; the layout was chosen by hand in `make_lesson.py` because an episode has no slide-designer pass, and that is a limitation of this check. The builder refused three first attempts (a table in a narrow zone; table headers longer than one line at the readable floor; a table band too shallow) and nothing unreadable was written. To fit, the table headers were shortened (`Where it was`, `At the start`, `Left after two days`, `Evaporated`), which is a presentation change the slide designer normally makes. After looking at the first render, two slides were fixed: the three sentences to judge were too small as a bullet list and became separate lines, and the towel story box was given more height so its text matches its neighbours. The towel photograph on slide 4 is omitted (no image generation); the task does not depend on it. The key sentence on slide 3 has no star treatment because free layouts do not draw one. No kit, because the episode chose none.

## 7. Unrun checks and uncertainties

- **Production run:** none. The production designer and reviewer (gpt-6-astra) were unavailable; every design and review is Claude-run.
- **Neutral episode reviewer and Phase 1 reviewer on the cases:** not run (cap). Both are cheap next checks.
- **Teacher reading and classroom use:** none. A useful later check for one trial lesson: whether the class needed the teacher's check of the evaporation amounts before slide 6, and whether any child still said the water "disappeared" at the end.
- **Historical verification:** the Tudor wording in the runtime examples is the teacher's approved content and the plan's cases; no new historical claims were added, and the plan's unverified statute and guild material appears only as a counterexample.
- **Optional Phase 1 staging experiment:** still off; not run, reversed or changed.
- **Whether the operations table is ever consulted:** conditional by design; no trial shows it being read.

## 8. Rollback

Each change is its own commit and reverts cleanly with `git revert`, newest first:

| Change | Revert |
|---|---|
| Evaluation record | revert the evaluation commit, or delete this folder |
| Frozen cases and protocol | `git revert f3882707` |
| Reviewer checks and the wiring test | `git revert 0b084af5` (the test also covers the other two commits, so revert it before them) |
| Tudor example and sequence contrast | `git revert 424c1aa0` |
| Shared guidance and designer pointers | `git revert d7ed3757` |

The Phase 1 branch is untouched, so dropping the whole follow-on is simply not using this branch.

## 9. Sharing for review

Both branches exist only on this computer. To let an independent reviewer see them, push both (`git push -u origin lesson-designer-quality-2026-09-15 lesson-designer-cumulative-2026-09-16`) with the teacher's say-so, or export patches (`git format-patch 38c6a07c..lesson-designer-quality-2026-09-15` and `git format-patch 21b7c508..lesson-designer-cumulative-2026-09-16`) and share them with both evaluation folders. The teacher's deck is referenced by path, not copied; no credentials, pupil data or conversation history are included.

## 10. Corrections after the review of the pushed branch (16 September 2026)

An independent review of the pushed branch found claims in this report that were wrong or went further than the evidence. The sections above are left as written; this section corrects them. The repairs themselves are recorded in `evaluations/lesson-designer-repairs-2026-09-16/report.md`.

**The slide builder does have a test command.** Section 4 said it had none. It has `npm run check` (its catalogue, parity, paragraph, render-failure, picture and vocabulary checks, then `node --test "test/*.test.js"`); what it lacks is an `npm test` alias. Run from `plugins/lesson-v4/builder`: 643 of 643 passed at this report's head (`88f53347`), and 643 of 643 after the repairs.

**The evaporation results do not isolate temperature.** Both science episodes used the brief's three saucers: a sunny windowsill, a classroom shelf and a fridge. Moving a saucer changes more than its temperature: sunshine falls on the windowsill, the air in a fridge is still and may be drier or damper, and a classroom has draughts. So these results illustrate the taught relationship; they do not show on their own that temperature caused the difference. The candidate episode's teacher note said another factor "doesn't change today's conclusion", which is too strong, and a child who raises a fair-test concern about this table is right. The fault starts in the shared brief (`trial-protocol.md`, B1), so it is not a difference between the two arms, and the Part B preference for the candidate stands only as a judgement of how the episodes used the results, not as a claim that the results were a fair test.

**The rendered excerpt left out its own correction.** Section 6's excerpt took the candidate episode's slides 5, 6, 7, 8 and 10. The episode's slide 9 (`Is Leo right about the water?`) and slide 11 (its check, correcting the idea that water disappears) were left out, so the excerpt ends by agreeing with the rate half of Leo's claim without the correction of the other half. The full episode does contain that correction. The excerpt is therefore not a self-contained classroom segment.

**The excerpt's table headings were reworded by hand.** Section 6 said every child-facing string was copied from the episode. The headings were not: the episode's `Where the saucer was`, `Water at the start`, `Water left after two days` and `Water that evaporated` became `Where it was`, `At the start`, `Left after two days` and `Evaporated` so the table fitted. Those are the episode's own board words, not presentation labels, and shortening them by hand is rewording, not layout. The excerpt is a readable illustration, not evidence of faithful automatic rendering. The repairs replace it as the connected example with the Tudor card sort, whose strings are copied by script and checked (`evaluations/lesson-designer-repairs-2026-09-16/example/`).

**Sixteen of sixteen was not a blind result.** The case headings in `blind-cases.md` named the diagnosis (`a printed cross recorded as understanding`, `made deeper with rules nobody taught`, `the same question twice, called deeper`), so the reviewer read the criticism before judging, and several expected reasons claimed more than the case supported (C02, C07, C09, C13, C14). Nine of the sixteen cases were history. The result stands only as a developmental check. A corrected pack with neutral ids and a rebalanced subject mix is in `cases-corrected.md` and `blind-cases-corrected.md`, and its re-review is `review-corrected-neutral.md`.

**A partner's report is not proof every child understood.** C07's expected reason said "every child committing to a reason". A partner reporting a reason is one pair's evidence and a chance for every child to form one; it does not establish every child's understanding.
