# Designer split project

One piece of work, tracked here so it survives new sessions: splitting the
Lesson v4 lesson designer into a stage that decides the lesson and a
fresh-context stage that writes the final words. This file lives at the
repository root, outside `plugins/lesson-v4/`, so it is never shipped inside
the installed plugin.

**Any session resuming this project reads this file first, then continues
from the first open decision below.** Settled decisions stay settled: reopen
one only when Daniel asks, or when implementation uncovers evidence it cannot
work, and then by putting that evidence to Daniel in plain English, never by
changing course silently. Decisions are made with Daniel one question per
message, in plain English with no code jargon, using his preferred shape:
what happens now, what I think, what I suggest, then one clear question.
Mark progress ("that's 2 of 5") so he can see where the project is.

## The problem being solved

- The lesson designer's instruction file grew from 66KB to 90KB in three days
  (28 to 31 Aug 2026): every escaped failure added guidance, and new variants
  kept escaping past rules that were already active.
- The designer writes every final child-facing and spoken string at the end of
  one long run, and its own instructions admit the voice drifts furthest there.
- The semantic review runs only after all the wording is written, so a wrong
  early decision costs up to two full redesigns of everything.

The full investigation and verdict are in the session that opened this
project (31 Aug 2026, versions 4.2.45 to 4.2.46). The verdict corrected an
external AI's advice on three points worth remembering: most of its
"move to code" list was already done; `design-decisions.md` is written first
as a thinking anchor and must not become a generated summary; and a separate
blueprint file format was rejected for the reason under Settled below.

## Settled decisions

1. **Split, in this shape.** One agent decides the lesson; a review happens
   while the design is still compact; a fresh-context agent then writes the
   final wording once, with the voice guides loaded and no authority to
   change decisions. Reason: the wording is written last and drifts most, and
   a fresh context is the only real reset; a compact review catches a wrong
   route before it is expensive.
2. **Same contract, two passes, no new blueprint format.** The existing
   `lesson-design.json` is filled in two passes: the decider fills decisions
   and leaves child-facing strings as marked placeholders; the words-writer
   fills only those strings. Reason: meaning and wording live inside the same
   fields (a worked example is both the exact numbers and the child-facing
   sentence), so a separate blueprint would need a second schema, a second
   validator and a translation layer, the exact machinery recent work has
   been deleting.
3. **A words-writer that cannot express a decision reports the gap.** It
   names precisely what blocks it and hands back; it never redesigns
   silently. Reason: silent redesign is the drift the split exists to remove.
4. **Growth freeze on the designer's instructions.** LIFTED at the
   switch-over (settled 12), replaced by a placement rule: a wording failure
   is answered in `lesson-author.md` or `worksheet-content-designer.md`, a
   deciding failure in `lesson-designer.md` (the architect's base craft
   file), and enforcement in code stays preferred over guidance everywhere.
   Reason the freeze existed: every failure used to land in one 90KB file;
   with the jobs split, each rule can live in the small file whose reader
   uses it.
5. **Daniel's pipeline keeps working throughout.** He teaches with it daily
   and installs from main. Whatever the rollout route (settled 8), no
   state may be published where a normal lesson run is broken.
6. **The words-writer takes all the words from day one** - slides, spoken
   script and worksheet questions alike (Daniel, 31 Aug 2026). Reason: one
   writer means one voice and one owner, and the worksheet is where tired
   end-of-run wording has hurt most. Accepted cost: a bigger first version,
   so the first test lesson carries more weight.
7. **Two reviews, each with its own job** (Daniel, 31 Aug 2026). The early
   review reads the settled decisions while they are still compact and owns
   every purposeful lesson judgement, including sending the design back. The
   after-wording review checks only that the wording says what was decided
   and sounds like the teacher, repairing wording in place. Reason: the
   expensive redesign loop exists today only because the sole review happens
   after all the writing; moving that authority earlier is the main speed win.
   **The escape hatch, and its limit:** the wording review may still raise a
   genuine lesson defect that only became visible once the words existed - a
   scenario that falls apart when written out, an answer that reveals its own
   question. It raises the alarm rather than staying quiet or fixing it
   itself, and it does not re-argue decisions the early review approved. If
   the test lessons show that hatch opening often, the early review is
   reading the wrong things and that is the thing to fix, not the hatch.
8. **The new route is built alongside the old one, on main, switched off**
   (technical call, 31 Aug 2026). The new roles and their checks are added
   without touching the route a normal run takes, so every published version
   keeps working (settled 5) and Daniel can install any of them safely. The
   orchestrator gains one switch, defaulting to the old route; test runs turn
   it on explicitly. Reason: a long-lived branch would drift behind a
   repository that changes several times a day, and Daniel installs from main.
   The switch is removed, and the old route with it, only once a test run has
   met the bar in open decision 1.
9. **The words-writer runs at the same maximum effort as the designer, at
   first** (technical call, 31 Aug 2026). Reason: two things change at once
   otherwise, and a weaker first test tells us nothing about the architecture.
   Trying the lower setting is a separate experiment once the split is proven,
   and the run report already records what each worker ran at.

10a. **The worksheet has its own content designer on the split route**
    (Daniel, 31 Aug 2026: "lets make worksheets seperate too", choosing to
    build ahead of test evidence). The architect decides the sheet's brief -
    role, shape, evidence goal, demand, protected content, visual evidence -
    and writes its blocks as specced stand-ins; the early review approves
    that brief; the author writes the lesson's words and proves it left
    specs only inside the worksheet (the checker's scoped stage mode); then
    the worksheet content designer, in its own fresh context, decides the
    instances and writes the sheet's words against the finished board
    wording, under the strict gate. Reason: freshness is judged against
    what the board actually says, so the sheet is written after the words
    and by a brain that has done nothing else that run. Accepted cost: the
    first test now measures more changes at once, which Daniel accepted by
    ordering the build.

10. **Balanced diet is the first test, four-digit plus or minus three-digit
    is the safety check** (Daniel, 31 Aug 2026). Balanced diet first because
    its failures were all wording written at the tired end of a long run, so
    it measures exactly what the split claims to fix; the maths lesson second
    because it is the least wordy subject and would catch a split that only
    suits wordy ones. Same briefs as the original runs. The bar: the lesson
    teaches the same or better, the words sound like Daniel without hand
    rewriting, and nothing already approved gets re-argued. Speed is a bonus,
    not the test. Daniel judges the voice; checks judge everything else.

12. **The chain is the pipeline** (Daniel, 31 Aug 2026: "im not testing.
    dont worrt lets just keep going. retiring the old route by slimminh next
    and then do whatever is after that too. ive got backups if all goes
    wrong"). Daniel explicitly reopened the test gate (settled 8 and 10) and
    ordered the switch-over without the test runs, accepting the risk with
    backups in hand. Done in 4.2.50: the old Phase 1/1.25 launches are
    retired and the five-step chain is Phases 1, 1.25 and 1.3; the wording
    craft (script register tells, the four voice tells, the read-back and
    pre-flight, the teacher-voice loading routes) moved from the designer
    file into `lesson-author.md`; `lesson-designer.md` remains as the
    architect's base craft file, decisions only, and is no longer launched;
    later-phase focused revisions belong to the architect, which may write
    small finished wording in place there; the reviewer hand-back principle
    (a broken correction goes back to the reviewer that wrote it) carried
    into both reviews. Settled 10's bar still stands as the judgement for
    the first real runs - it just no longer gates the code.

## Open decisions, in order

None. Every decision is settled; what remains is implementation, the two
test runs, and then the switch-over judgement against settled 10.

## What remains

The construction is finished (settled 12): the chain is the pipeline, the
old route is retired, the wording craft moved to the writers, the freeze is
lifted. Still open, none of it buildable at a desk:

1. **Run real lessons.** The chain has never run end to end. Daniel's first
   runs are now the live proof, with rollback being a reinstall of the
   previous version (the tracking log and git history name every step).
   The five test lessons remain the best regression set: balanced diet,
   four-digit plus or minus three-digit, circuit symbols, electrical
   appliances, rainforest.
2. **Try the author at a lower effort** (settled 9 deferred this) once a
   few real runs give a baseline to compare against.
3. **Optional later tidies, evidence first:** fold `lesson-architect.md` and
   its base `lesson-designer.md` into one file once the chain has survived
   real runs; move the base file's `### Worksheet` instance craft into a
   reference owned by the worksheet content designer. Both are churn with no
   behaviour change, so they wait for a quiet moment, not a patch night.

## Test lessons for before and after

Lessons that each exposed a distinct real failure, to be re-run on the same
briefs once the split exists: circuit symbols (expanded into the wrong
learning), electrical appliances, balanced diet, rainforest, four-digit plus
or minus three-digit numbers. Do not change voice rules at the same time as
the architecture, or the comparison shows nothing.

## Status log

- **31 Aug 2026.** Project opened. Investigation and verdict done; external
  advice verified against the repository (its evidence held; its blueprint
  format and generated decisions record were rejected). The one enforcement
  fix shipped separately as 4.2.46. Daniel said yes to the project and asked
  for this tracking file. Decision made the same day: the words-writer takes
  all the words from day one (settled 6), and the review splits in two with a
  bounded escape hatch (settled 7). The two technical calls were then taken:
  build alongside the old route behind a switch (settled 8) and keep the
  words-writer at full effort for the first test (settled 9). Daniel then
  chose balanced diet first with the four-digit maths lesson as the safety
  check (settled 10).
- **31 Aug 2026, later.** The route is built and shipped as 4.2.47, old
  route untouched, all tests green. What exists: the design checker gained a
  stage mode that accepts `__LESSON_WORDING_FILL__:` wording specs and a
  strict mode that refuses any survivor, so a half-written lesson can never
  build; four new roles (`lesson-architect`, `lesson-author`,
  `decision-reviewer`, `wording-reviewer`, the first and last two riding on
  the existing designer and reviewer files); a `design-split` playbook slice
  holding the four-step route, triggered only by the teacher explicitly
  asking (for example `use the split route` in the brief) and rejoining the
  normal pipeline at the helper check.
- **31 Aug 2026, wiring audit (4.2.48).** Daniel asked whether the
  orchestrator actually knows how to run the new roles. Tracing it found
  three real gaps, all now fixed and pinned by tests: the always-loaded
  `SKILL.md` named exactly three roles that may receive the teacher's brief,
  which outranks any slice and would have denied it to the split route's own
  decider; a brief asking for the route on an install missing any of the
  four roles had no fallback (it now runs the normal route and says which
  role was missing); and both split reviews wrote `design-review.md`, so the
  early review's record was erased by the later one (the early one now
  writes `design-review-decisions.md`, and both reach the run report).
  **The lesson for the rest of this project:** a new route is not wired
  until every always-loaded rule that names roles by name has been re-read
  against it.
- **31 Aug 2026, worksheet stage (4.2.49).** Daniel ordered the worksheet
  content split built now (settled 10a). The route is now five steps across
  two lazily loaded slices; the checker gained a scoped stage mode
  (`--wording-scope worksheet`) so the author proves it left specs only in
  the worksheet; the orchestrator holds a closing strict gate whatever path
  the route took. Not done, and why: retiring the old route and slimming the
  90KB designer file both wait for the test runs, because the old route
  still serves every normal lesson and slimming the file it reads would
  change both routes at once. Next: Daniel runs the balanced diet brief in
  Codex with `use the split route` added, then the four-digit maths brief
  the same way, and judges both against settled 10.
- **31 Aug 2026, switch-over (4.2.50).** Daniel ordered the whole remaining
  plan done without the test runs (settled 12). The chain is now the only
  pipeline: Phase 1 launches the architect, Phase 1.25 the decision review,
  Phase 1.3 the author, worksheet content designer and wording reviewer,
  with the orchestrator's strict gate closing the chain. The wording craft
  moved out of the old designer file into the author; the old designer file
  stays as the architect's base craft file and is never launched; the review
  packet is retired from the chain; the growth freeze is lifted in favour of
  the placement rule in settled 4. Rollback if a run misbehaves: reinstall
  the previous version from the marketplace after reverting main, and the
  4.2.49 commit is the last two-route state. Next: Daniel's first real run
  is the live proof; judge it against settled 10's bar.
- **31 Aug 2026, hardening (4.2.51).** Daniel brought a second external AI
  review of the switched-over chain. Verified against the code: its four
  serious findings were all real, and all are now closed deterministically.
  (1) The approved specs were destroyed by in-place writing - the chain now
  freezes `approved-lesson-spec.json` after the decision review, the wording
  reviewer checks the finished words against it, and every writer retry
  restores its baseline first instead of retrying over a half-edited file.
  (2) The written worksheet had no semantic reviewer - the wording reviewer
  gained a bounded worksheet implementation check (freshness from the final
  board, medium kept, support not answer-giving, answers demonstrating the
  rationale). (3) A half-specced design passed stage validation - the
  ownership map now lives in the validator itself: every child-facing field
  must be a spec at the decider's stage, and a spec in planning metadata is
  refused. (4) Writer lanes were prompts, not checks - a new ownership
  checker diffs each writer's output against its baseline and refuses
  changes outside its lane, including any touch of the photo contract.
  Also done: the architect's late-wording carve-out replaced (it specs, a
  focused author pass words); the worksheet content designer made required
  and the contradictory author fallback removed; photo-backed worksheet
  instances ruled as architect-chosen; a small deterministic review-report
  check replacing the retired packet's useful part. Deferred with reasons in
  What remains: slimming the architect's loaded context, lower writer
  effort, and speed measurement - all need real runs first. The chain has
  still never run end to end.
- **1 Sep 2026, first real run and its verdict.** The chain ran end to end
  on the Y4 circuits brief (about 90 minutes, all snapshots and gates
  working; artefacts in lesson-output/working/ in Daniel's checkout). An
  external review of the lesson found real faults and located each one
  cleanly by owner, which is the split doing its diagnostic job: architect
  or decision-reviewer misses (starter and vocabulary gave away the bounded
  attempt's answer; connection order taught as the invariant instead of the
  complete loop; the buzzer overloading the lesson; `series` never taught;
  battery both deferred and taught) and author or wording-review misses
  (12-14 word success-criteria steps; `output component` reaching child
  text; a prohibition about untaught circuit symbols). Notably, the OLD
  route's earlier run of the same brief did better on the steps and the
  deferrals, so this run cost the switch its evidence and Daniel reverted
  to main. Seven durable repairs went to MAIN as 4.2.52 (bounded-attempt
  spoiler audit; steps-encode-the-invariant with a 12-word validator cap;
  the objective's own term must be taught; trimmedVocabulary consistency
  sweep; science equipment must not falsify the taught rule; positive-form
  instructions; category-abstraction voice tell). **At merge time:** most
  arrive automatically (route file, science file, design-reviewer base);
  the validator's step cap needs a hand-merge into this branch's staged
  validator; the four-tells example belongs in `lesson-author.md` here, not
  the slimmed base file. Settled 9 superseded on this evidence: the author
  and worksheet content designer now declare `effort: high` - they express
  settled decisions, the run was slow, and both reviewers stay at xhigh.
