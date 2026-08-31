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
4. **Growth freeze on the designer's instructions.** Until the split is
   tested, wording-drift failures in `agents/lesson-designer.md` are answered
   with enforcement (validator, code, tests) or left for this project, not
   with new guidance paragraphs. Reason: the file's growth is itself the
   failure being fixed. Limit: a failure that genuinely cannot wait and
   cannot be enforced in code may still add guidance, with a note here.
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

## Open decisions, in order

None. Every decision is settled; what remains is implementation, the two
test runs, and then the switch-over judgement against settled 10.

## What remains after a successful first test

A good result on the two test lessons proves the shape, not the finish. In
priority order, with the reason each still matters:

1. **Switch over and retire the old route.** Remove the trigger, make the
   split the only route, and stop shipping two ways of designing a lesson.
   Until then every failure has to be diagnosed against whichever route
   produced it.
2. **Actually slim the decider.** This is the win the first build does not
   yet deliver, and the honest gap in it. `lesson-architect.md` is 4KB but
   opens `lesson-designer.md` (90KB) in full, so the deciding worker still
   carries everything; only the words pass got a genuinely fresh, small
   context. Once the split is proven, the wording craft in the designer file
   - the register rules, the voice tells, the read-back, the child-facing
   examples written to teach tone - moves out to `lesson-author.md` where it
   is used, and the architect keeps the deciding half. Do this only after the
   route is proven, and as its own change, so a regression has one cause.
3. **Lift the growth freeze** (settled 4) once 1 and 2 are done, and let
   wording failures be answered in the author file, which is where they now
   belong and where a rule can be short because its file is short.
4. **Run the other three test lessons** - circuit symbols, electrical
   appliances, rainforest - as the wider regression check before retiring the
   old route for good.
5. **Try the author at a lower effort** (settled 9 deferred this), now that a
   proven baseline exists to compare against.
6. ~~Consider the worksheet content split~~ **Done, 4.2.49.** Daniel chose
   to build it ahead of test evidence rather than wait (31 Aug 2026), so the
   first test now measures the full architecture. See settled 11.

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
