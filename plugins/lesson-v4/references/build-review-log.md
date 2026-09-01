# Build review log

## 2026-09-01 - Year 4 Geography Lesson 1 (deck review)

- Slides 1, 2, 6, 7, 8 and the practice slides drew a schematic world map instead of a real one, and it looked good enough that nobody questioned it until the finished deck was read.
  *Addressed 1 Sep 2026, and the fault was not the routing. `world-geography-map`
  drew its continents from longitude/latitude pairs typed to look about right,
  which is the one thing `map-annotations.js` says the package will never do. It
  shipped anyway because the parity guard accepted `projection:<name>` as a
  source and the helper declared `projection:equirectangular-lonlat` - a
  genuinely real projection over invented coordinates. No allowlist of
  projection names could have caught that: the name was already correct. A
  projection is how coordinates are transformed, never where they came from, so
  the prefix is now refused outright and the only sources are `data` and
  `asset:<folder>` - something on disk. The helper is deleted from every
  registry. Its three configurations go to the routes that can be right about
  the world: continent retrieval to the real write-on world map (now also the
  stick-in piece, so the map in a child's book is the one on the board), the
  Equator and both Tropics to `seven-continent-world` where they are computed
  from the asset's own equirectangular geometry, and biome or rainforest
  distribution to the picture route as a real thematic map, which the
  `substitute` check added earlier the same day now holds to a contract
  filename. Regression tests in `map-annotations.test.js`,
  `map-slide-world.test.js` and `render-visual.test.js`.*
- Slide 15's South America map was unreadable: ten label pills printed on top of one another across the map they were naming.
  *Addressed 1 Sep 2026. The marks were fine and a lower ceiling would have been
  the wrong fix - eight countries plus two overlays is a reasonable thing to
  want. The map simply had half a body row, so South America's proportions fitted
  it about 2.4in wide, and a board label pill is 0.82 to 1.62in because it has to
  read from the back of the room. The layout searched for clear positions,
  failed, and fell back to the preferred spot for every one it could not place -
  silently. It now marks what it could not place and the renderer refuses with
  `MAP_LABELS_DO_NOT_FIT`, naming the labels and the three ways out. The same
  spec given the whole body still draws, which is the point: the fault was the
  room, so the check is about the room.*
- The picture route was confirmed working as Daniel wants it and was left alone: a real source is preferred, `ordinary-real` falls back to generation, and a failed picture stage degrades to `PICTURE_STAGE: unavailable` and designs the deck without it rather than stopping the lesson.
  *No change, 1 Sep 2026.*

## 2026-09-01 - Year 4 Geography Lesson 1

- The installed package changed from 4.2.56 to 4.2.57 during the run; canonical outputs survived and the newer verified package completed the deterministic checks.
  *No engine fault, 1 Sep 2026: the package was reinstalled by hand mid-run. The run's own recovery was correct.*
- A promised substitute map route was recorded in helper coverage but no corresponding map filenames appeared in the photo contract, so slides fell back to the nearest live map compositions.
  *Addressed 1 Sep 2026, and the cause was two faults in one place. The verdict
  check that would have caught it lived only in `references/helper-route.md`,
  which is read only when a decision says `build`; this run's decisions were all
  `covered` and `substitute`, so the check never ran. And even when it did run,
  `substitute` needed only a reason, so a reason asserting "the approved picture
  contract supplies the exact teaching map" passed while the contract held
  nothing. The check's closing step now sits on the path every run takes
  (playbook Phase 1.5, "Close the check"), `substitute` names its contract
  filename in `picture` and the check resolves it against
  `photo-requirements.json`, and a new `gap` decision gives the genuine dead end
  somewhere to go that does not promise a picture nobody will source. Replaying
  this run's own `helper-check.json` against its contract now fails on both map
  decisions, before the freeze. Regression tests in `test_helper_coverage.py`.*
- One authentic worksheet riverfront photograph remained unsatisfied; focused repair successfully converted only that evidence card to text while preserving the confirmed aerial photograph and the intended reasoning task.
  *No change, 1 Sep 2026: working as designed. A documented Manaus riverfront is
  exactly the picture that must not be generated, `fallback_action: unsatisfied`
  said so, and the reconciliation route re-authored the one question. The route
  cost one focused repair and kept the sheet.*
- The Below worksheet exposed a 13-pixel rendered overflow not caught by JSON preflight; merging two adjacent instruction helpers fixed it without changing pupil-facing content.
  *No change, 1 Sep 2026: preflight measures the modelled page and the build
  measures the browser-rendered one, and 13 px of real-render overflow is only
  visible to the second. Moving a Chrome render into preflight would charge every
  design attempt for a fault one focused repair closed. Revisit if rendered
  overflow becomes a repeat finding rather than a single 13 px miss.*
- The run opened its branches in parallel and then serviced them one at a time. Five sourced photographs sat unpublished for 14 minutes and adaptation's provisional contract unbuilt for 12, both then running in seconds the moment an unrelated Slide Designer returned.
  *Addressed 1 Sep 2026, and the dependency graph was never the problem. The
  runtime's `phase3` slice - the one carrying "service each branch as it lands"
  - was named by no NEXT block, and `finalize` sits only behind it, so by the
  routing's own rule (a branch no NEXT block names has ended) the run ended when
  its last track did. A host with a large context inferred the tail and finished
  anyway, which is why this read as a slow run rather than a missing report. The
  three track-end slices now name `phase3`, and the servicing rule has moved
  forward into `phase2-core`, where it arrives before the first track opens
  rather than after the last one closes. Regression tests
  `test_no_slice_is_stranded_behind_a_door_nothing_opens` and
  `test_the_tracks_are_serviced_as_they_land_not_read_end_to_end`. Worth
  measuring on the next run: the worksheet branch is the run's longest pole and
  was held about 12 minutes of a 57 minute run.*
- The run report's picture stage read `attempting 2 pictures` for a contract of five.
  *Addressed 1 Sep 2026: `PICTURE_ASSIGNMENTS_OK` printed only the assignment
  count, and coherent pictures pack into one assignment, so the only number in
  front of the orchestrator was the wrong one - and that line goes verbatim into
  four designers' prompts. The marker now prints both counts and the playbook
  names which one the state line takes.*

Lesson runs append genuine engine findings here when a writable source
checkout resolves; the improvement pass reads them, fixes the engine, and
records what became of each entry. A run that cannot reach this file writes a
`pending-build-review-log.md` beside its run report instead, and the next
improvement pass folds those in.

## 2026-08-30 — Year 4 Maths: 4-digit ± 3-digit numbers

- Worksheet `column-method-grid` ignores both `showHeadings: true` and explicit
  `columns` arrays in rendered output; place-value headings remain absent
  although the spec requests them.
  *Addressed 30 Aug 2026: `showHeadings` is now rendered and measured
  (`worksheet-html/src/helpers/forms.js`), with the letters derived from the
  numbers' own width; regression test `column-method-headings.test.js`.*
- Working-wall no-photo cards retain the photo-column width, producing a
  substantial blank right-side band; the retained builder has no output-only
  override.
  *Investigated 30 Aug 2026: does not reproduce - the renderer reserves no
  photo column on a no-photo card, and the rebuilt page uses the full panel
  width. The band was the ragged right edge of left-set steps; the reviewer's
  dead-space standard now names that rag as not-a-fault
  (`agents/visual-reviewer.md`).*
- Working-wall ordinary spaces can collapse at particular line joins;
  non-breaking spaces restored canonical visible wording.
  *Investigated 30 Aug 2026: does not reproduce - the same spec with ordinary
  spaces renders correct spacing, and NBSP has the same printed width as a
  space, so the "fix" could not have changed the page. The likelier fault was
  pixel transcription at review DPI; wording-drift findings now require
  text-layer or 300 DPI confirmation (`agents/visual-consistency-reviewer.md`).*

## 2026-08-30 — Pending helpers from the batch

- The `map` growth (seven-continent world with Antarctica, globe-to-flat,
  continents-and-oceans worksheet form) was installed and proven on
  30 Aug 2026: the shipped `world.png` genuinely omits Antarctica, which had
  blocked the whole continents lesson.
- The `column-method-grid` drop-in was reviewed and NOT installed: its
  worksheet half hard-codes four Th/H/T/O columns, which would regress the
  2-digit grids the engine's own helper (now with `showHeadings`) derives
  correctly, and its slide half needs the same width-derivation before it is
  safe. Rework the drop-in before installing.
- The `water-cycle-diagram` drop-in remains waiting in its run folder; the
  substitute-picture route delivered that lesson, so installation stays a
  deliberate choice via `/install-helper`.

## 2026-08-30 — Year 4 PSHE: The importance of boundaries in friendships

(Folded in from the run's pending log entry.)

- Deck slide 6 still had overlapping pathway outcome boxes after the permitted
  owner repair and confirmation round (`DECK-001`).
- Printable Chrome packages were unavailable, so differentiated worksheet HTML
  and the answer key were delivered without a PDF or page-fit verification.
  *Addressed 30 Aug 2026: the preflight was passed as `ready` on a guess; the
  playbook now names the exact preflight command and output-to-state mapping
  (`skills/make-lesson/playbook-lite.md`).*

## 2026-08-31 — Year 4 PSHE: What is a balanced diet and why does having one matter?

- The working-wall nutrient reference table could not fit its required body-job wording within the builder's fixed two-line A3 table-cell cap. The permitted focused repair found no in-scope JSON change; the wall was excluded while the deck and differentiated worksheets passed review.
  *Addressed 1 Sep 2026 with the 1 Sep working-wall entry below: this is the
  same fault in the table renderer. The refusal now names the offending cell,
  its length and its column's character budget, so a repair aims at a number
  instead of guessing (`working-wall-html/src/layout.js`).*
- The Below worksheet's first build overflowed two zones; changing only that sheet to a landscape four-quarter layout resolved the clipping. Visual review then replaced one short response rule with a full-width handwriting line and confirmed all three pupil sheets and the separate answer key.
  *No engine change 1 Sep 2026: the run's own repair budget resolved this and
  the sheets shipped. Nothing to fix upstream.*
- Deck slide 6 initially merged setup and pupil-task colour semantics; a focused repair separated black setup text from the house-blue task, and confirmation found no regression.
  *No engine change 1 Sep 2026: repaired in-run and confirmed.*

## 2026-09-01 — Year 4 PSHE: What is a balanced diet and why does having one matter?

- Compiling an adaptation-only supplemental picture manifest from the merged requirements snapshot succeeded, but `validate-image-scout.py manifest` rejected it because it compares against the full deterministic partition and has no expected-filename filter. The Below sheet was therefore omitted; the Expected worksheet and answer key still built.
  *Addressed 1 Sep 2026: this was not a one-lesson accident. The compile side
  could narrow a snapshot to the filenames a wave owns and the validator could
  not, so every supplemental wave was unvalidatable and every adaptation
  picture in every lesson was promised to a worksheet and never sourced. Both
  sides now share one selector (`select_expected` in
  `scripts/compile-picture-assignments.py`), the manifest subcommand takes the
  same `--expected-filename` list, and the playbook spells out the command
  rather than leaving its arguments to be guessed. Regression:
  `scripts/tests/test_supplemental_wave_manifest.py`.*
- A subsequent zero-photo `promote-used` receipt did not remove the now-unused adaptation photos from the canonical contract. Provenance succeeded against the immutable initial contract, which exactly matched the four published pictures.
  *Investigated 1 Sep 2026: not a fault, and it was downstream of the entry
  above. Retention is the safe rule: a promoted filename can already have been
  published, and dropping it from canonical would orphan a picture's
  provenance. The worksheet only stopped referencing those two photographs
  because the wave that should have sourced them could not run.*
- The working-wall A3 layout again failed its 36pt/two-line cap after the single permitted focused repair, so no wall PDF was delivered.
  *Addressed 1 Sep 2026: the refusal said only that something at the floor size
  was too long. It named no card, no item and no target, so the one permitted
  repair was a guess, and it guessed wrong twice. Reproduced from the run's own
  `working-wall.json`: the sticky card was three characters over budget. The
  autofit refusal now names the card, the item, its length and the exact
  character budget, and the designer is given the budgets up front
  (62 characters on a card with a picture, 106 without) rather than only the
  36pt floor. `working-wall-html/src/layout.js`, `agents/working-wall-designer.md`,
  `references/working-wall-preferences.md`; the numbers are pinned to the
  renderer by `working-wall-html/test/doc-claims.test.js`.*
- Stick-in support could not reproduce the photograph-plus-three-response lunch-review frame and was omitted rather than weakened.
  *Open 1 Sep 2026: confirmed genuine - the stick-in renderer carries a
  photograph only inside a `labelDiagram`, so a photograph above plain response
  lines has no piece to be. The designer's refusal to weaken the task was the
  right call. Adding that piece is a helper-builder job, not a repair, and is
  left as a deliberate choice rather than folded into this pass.*

## 2026-09-01 — Year 4 Maths: the helper-gap picture route was closed to maths

- A maths run stopped at the design gate with `LESSON_DESIGN_INVALID: Maths
  lesson-design may not define initial photo-### requirements`. The helper check
  had found a visual the engine could not draw; its documented rescue is the
  picture route, which adds a `controlled-ai` picture and re-runs the design
  validator. The validator refused it and pointed at "the helper check's
  substitute route" as the alternative - which is that same picture route. The
  lesson could neither add the picture nor pass the gate, and every maths lesson
  meeting a drawing gap would have stopped identically.
  *Addressed 1 Sep 2026: the ban is removed from `validate-lesson-design.py` and
  `lesson-design-scaffold.py`, and from the two references that stated it as
  fact. The teacher settled the question: maths can have photographs. What the
  ban was protecting is real and is kept, moved to where it can actually be
  seen: no subject photographs a tool the engine draws, stated in
  `lesson-designer.md` with the two legitimate maths cases named (a real-world
  referent, and a picture the rescue route produced), and checked in
  `design-reviewer.md`. The subject-name rule ("Maths", not "Mathematics")
  stays on its own account, for filing and routing. Regression:
  `scripts/tests/test_maths_helper_gap_has_an_exit.py`.*

## 2026-09-01 — Year 4 PSHE balanced diet: teacher review of the finished outputs

- Three `speech-bubbles-1` slides put the judging question in the left column
  with the claim it asks about in the bubble on the right, so a child met the
  question before its own subject.
  *Addressed 1 Sep 2026: the template hard-coded the statement to the left and
  offered no side at all, so no designer could have fixed it. `statementSide`
  (`left` default, `right` available) now exists on the whole speech-bubble
  family; `slide-speech-and-characters.md` says which shape takes which side,
  and `preferences.md` carries the general reading-order preference, stated as a
  preference rather than a rule because the teacher named cases where the other
  order is right. Regressions: `builder/test/statement-side.test.js` and
  `scripts/tests/test_reading_order_left_to_right.py`.*
  *Corrected same day, twice. The first wording said "the thing they read first
  goes left, and the question about it goes right", which the teacher rejected on
  reading it back: he did not want every question pushed right on every slide.
  The second wording fixed the mandate but still anchored the rule to columns.
  He then gave the principle himself: the rhythm is claim or teaching first,
  question second, and that "doesnt neccessarily mean left and right. It could
  be top then bottom" - the left-right habit is downstream of children accessing
  a slide from the top left, which is also why he puts success criteria on the
  right. The preference now names the scan path, says the order is what matters
  rather than the sides, and derives the success-criteria habit from it instead
  of stating it as a second convention.*
- The Expected worksheet put its three steps in a 30% left column, pushing the
  photograph and all three questions into the 70% beside them and leaving a tall
  empty band under four short lines.
  *Addressed 1 Sep 2026: `side-70-30` already existed, so this was guidance, not
  mechanism. The settled column rules said where a stimulus goes and what the
  other column is for, and never covered support material. `preferences.md`
  (Worksheets) and the worksheet designer now place steps, success criteria,
  word banks and reminders after the work in the reading order, with the
  discriminating exception for a step list a child works through before
  answering. First written as "the right-hand column, never the left"; softened
  at the teacher's request into the split that actually matches the evidence -
  the side is latitude (right, or a band below), while the top-left corner
  belonging to whatever the questions read from is not, because taking that
  corner is what broke the sheet.*
- `rep-001/body-jobs` was recorded as covered by `concept-map` and the deck
  shipped a hand-built lookalike; only the orchestrator's post-build delivery
  check caught it, costing a repair worker and a rebuild.
  *Addressed 1 Sep 2026: the check reads the specification only and never needed
  the build. `helper-check.json` is now an authoritative input to both the slide
  and worksheet designers, each runs the delivery check at its own gate, and each
  is told that a hand-built lookalike is not delivery and that a promised helper
  takes its layout before the rest of the slide. The orchestrator's check stays
  as the independent backstop. Regression:
  `scripts/tests/test_helper_delivery_at_the_designer_gate.py`.*
