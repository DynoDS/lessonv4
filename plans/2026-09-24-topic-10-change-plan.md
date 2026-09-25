# The make-lesson playbook: the change plan (24 September 2026)

Step 5 onward of `streamline-plan.md` for topic 10, drafted from the ledger
(`2026-09-23-playbook-ledger.md`, 452 rows) and his answers of 24 September
(afternoon), recorded there word for word:

> 1. y 2. y 3. no 4. i dont read 5. y 6.y 7. y  yes for small ones

Decisions 1, 2, 5, 6 and 7 take the suggestions as written; decision 3 is no
(nothing added about watching agents); decision 4 is yes (one log step, at the
end, engine faults only; the reviewer's corrections stay in each lesson's
review file); the settled items a to m are yes. His words are the standard.

Planning only: nothing in the plugin was changed to write this. Scratch work is
`streamline-tools/scratch/pbplan_*`: the slice measurer (`pbplan_measure.py`),
two pin finders (`pbplan_pins.py` with `pbplan_anchors.json`, and
`pbplan_literals.py`; reports `pbplan_pins.txt`, `pbplan_literals_filtered.txt`),
and the room simulation (`pbplan_simulate.py`, which applies every draft below
to a scratch copy of the playbook and measures it the way the size tests do;
its outputs are `pbplan_playbook_10A.md` and `pbplan_playbook_10C.md`).

Paths below are inside `plugins/lesson-v4/`. Short names: PB
`skills/make-lesson/playbook-lite.md`; SK `skills/make-lesson/SKILL.md`; RT
`scripts/make-lesson-runtime.py`; RTT `scripts/tests/test_make_lesson_runtime.py`;
VRR `scripts/validate-run-report.py`; RFR `scripts/run-fixed-resource.py`; DF
`scripts/deliver_files.py`; RIP `references/revising-in-place.md`; GAP
`references/brief-gap-protocol.md`; HR `references/helper-route.md`; CD
`references/cloud-delivery.md`; CS `references/computer-setup.md`; ET
`commands/edit-templates.md`; LOG `references/build-review-log.md`. Row IDs are
the ledger's (`PB-` dropped). Line numbers are the working tree of 24 September
(4.2.288 committed, 4.2.289 uncommitted, which touches none of these files);
scripts find text by its words, never by these numbers.

---

## In one screen

- **Three releases.**
  - **10A, the playbook tidy and his decisions 1, 2, 4 and 6 with the settled
    items a to m.** Words, the runtime program's cut points and successor lines,
    and two changes to the report check. This is the release that makes the
    room, and Part D of the six-run plan (decision 1) goes in it.
  - **10B, the four run faults (decision 7)**, as he asked, each with its test
    and a build-log line.
  - **10C, decision 5: the wall and the stick-in pack ship with a failed card or
    piece left off and flagged.** The ledger's own honest note said the builds
    cannot do this yet and each would be built as its own change, as the sheets'
    was; it is engine work, so it gets its own release and its own checks. Until
    it ships, a wall or pack its one repair round could not clear is still
    excluded, exactly as today, and 10A says nothing that promises otherwise.
- **The room, measured on a scratch copy** (section 3). The playbook is 78,839
  bytes against a cap of 78,848. 10A takes out 3,520 bytes and writes in 1,718
  (decision 1, the settled corrections, the flags list), ending at 77,037:
  1,811 spare. 10B adds 585 (77,622) and 10C 435 (78,057): 791 spare at the end.
  No raise of the cap. Every slice stays under 7 KiB; two end tight (the
  stick-in and wall slice 88 spare after 10B, the report slice 73).
- **Versions.** Each release takes the next free patch number when it starts.
  10A must start after the worksheets release (planned 4.2.290) and topic 7's
  release 7A (planned 4.2.291) are committed, because both edit lines in these
  files (section 8). It does not wait for topic 8: the lines it shares with the
  reviewer list are assigned to 10A here, as topic 8's plan (`2026-09-24-topic-8-change-plan.md`, section 8) agrees. 10B follows
  10A; 10C follows 10B. Nothing is committed or pushed until he says so.
- **Change scripts** go in `streamline-tools/pb-change/` (10A),
  `pb-faults/` (10B) and `pb-flagged/` (10C).

---

## 0. Before anything changes

- **Wait for the releases that share lines** (section 8): the worksheets release
  edits PB's Track B reconcile line and one edge-case line; 7A edits the second
  sentence of PB's Report format paragraph. Re-read those lines after they land.
- **Re-check the ledger against the committed tree** with
  `streamline-tools/check-ledger-quotes.py`; record every row whose line moved.
  A quote not found stops the work until it is explained (the worksheets and 7A
  changes will move several on purpose).
- **Baseline:** `run-all-suites.sh pb-before`; `validate-saved-designs.py` to
  `pb-before-designs.json` (nothing here touches the design validator, so no
  saved design should change); `pbplan_measure.py` over PB to
  `pb-before-slices.txt`, the slice census every later step is compared with.

---

## 1. Release 10A: his decisions

Each item: his answer, what changes (file, section, the old words), the new
words as drafted (a draft; the change script may tighten it but may not add a
permission, example or condition not named here), the rows, and the tests.

### Decision 1: a repair that changes what children read (Part D)

His answer: "y". The suggestion: when the change is to what children read, the
full designer does the repair; it edits its file in place like every repair and
says what it changed and what it kept, but is not asked for the "no new words"
check; rebuilding the resource and running its own check confirm it.

1. **PB › Phase 3.5, the routing sentence (Q02).** «Use the compact
   focused-repair role for the named owner when present, otherwise its full
   creation role.» becomes Part D's sentence, as written in the six-run plan:
   *Use the compact focused-repair role for the named owner, and its full
   creation role when the change is to what children read: the compact roles may
   not author or drop it.* The rest of the paragraph («Give it the exact
   artefact/location, ...») stays. The "when present, otherwise" fallback is not
   lost: each line of the owner list (Q03) keeps «if that file is missing or
   unreadable, use» the full role, word for word (a test pins every line).
2. **PB › Phase 3.5, after the return-fields block (Q06).** The block stays
   exactly (a test pins «Return these exact repair-impact fields»). One
   paragraph follows it: *A full creation role's repair returns the first three
   fields and no scope line: the scope check refuses new words for children by
   design, so its rebuild and its own check are its confirmation.* The next
   paragraph (Q07, «that rerun is the repair's confirmation») already says the
   rebuild confirms every repair.
3. **Unchanged, and why it is enough to route:** the in-place line goes to
   "every repair prompt, whichever owner it goes to" (Q04), so the full role gets
   it; `Already passed - leave unchanged` (Q05) protects the passing content;
   the pipeline footer (C25) lets a role return any field its assignment
   requires, so the full role can return `Changed:`, `Unchanged:` and
   `Potential cross-resource impact:` although its own file never names them.
   The four compact roles and their descriptions are not touched (Part D tried
   that and the slide role's 8,000-byte cap broke).
4. **When "the change is to what children read" arises**, for the checkers: the
   resume after a redesign (P02's "resume only the affected resource", P07's
   "relaunch the blocked designer") and a declared cross-resource impact that
   changes mirrored wording (Q11). A build diagnostic and a terminally
   unavailable picture stay with the compact roles (the picture re-point is
   explicitly "not a scope breach").

Rows: Q02, Q06 (and X26, the code fact behind it). Tests: RTT keeps its
owner-list and «Return these exact repair-impact fields» assertions; new
assertions in RTT: the focused-repair slice names the full creation role
«when the change is to what children read», says a full role returns no scope
line, and no longer carries «when present, otherwise its full creation role».
Retired, barred everywhere: «Use the compact focused-repair role for the named
owner when present, otherwise».

### Decision 2: the template editor shows the rebuilt demo and pushes on his yes

His answer: "y" ("should it stop and ask before pushing?").

1. **ET › Finish every run (W39, W40, W41).** Rewritten as three steps, in this
   order:
   1. *Bump the plugin version*: both `plugin.json` files to the same next
      **patch** version (example `4.2.288` to `4.2.289`, replacing «next minor
      version (e.g. `2.1.0` → `2.2.0`)»); «The architect reads the plugin» becomes
      "The slide designer reads the plugin"; the reason stays; one clause added
      that the ledger's out-of-date table named: on Codex the teacher then
      refreshes the install (`codex plugin add lesson-v4@lessonv4`).
   2. *Show the teacher, then stop*: tell them in plain English what changed and
      why it matters (W41's words, «what moved where, not raw coordinates»; for a
      brand-new template, that it is registered and in the catalogue "so the
      slide designer can use it"); point them to the rebuilt demo (Phase 2 Step 5,
      or Phase 1 Step 3 for a new template that was not dragged) and ask them to
      open it and look. **Do not commit and do not push until the teacher says
      yes.** The reason, from the helper installer's own step (W13): a push puts
      this layout in front of every lesson built from the marketplace copy.
   3. *Commit and push on their yes*: W40's words («The checkout above the package
      is its own git repo and deploys to the marketplace from `main`. Commit the
      changed files and push, so the marketplace copy syncs.»).
   The Notes section stays. The rewritten paragraphs lose their em dashes;
   untouched paragraphs of ET are not re-punctuated.
2. **The same file's other stale lines (settled item a):** W15 «`lesson-resources`
   plugin» to `lesson-v4`; W18 «The architect's catalogue» to "The slide
   designer's catalogue"; W42 «the slot names the architect will fill» to "the
   slot names the slide designer will fill"; W27 «it carries the two rendering
   engines (slides *and* worksheets)» to "it carries every surface a helper draws
   on (the slides, worksheets, working wall and stick-in pack)"; W28 «**Worksheets
   are a separate engine.** A helper children also meet on a printed sheet has to
   be built into `worksheet-html/` as well» to "**Each printed surface is a
   separate engine.** A helper children also meet on a worksheet, the working
   wall or a stick-in piece has to be built into that surface's engine
   (`worksheet-html/`, `working-wall-html/`, `stick-in-sheets-html/`) as well",
   and its Step 1 question «on the board, on a worksheet, or both» to "on the
   board, a worksheet, the wall or a stick-in piece". W29 (pinned by VOC-Q05) is
   not touched.

Rows: W13 (reference), W15, W18, W27, W28, W39, W40, W41, W42. Tests: none pins
ET's finish today (`test_run_never_publishes.py` reads only the files a run
reads). New test in that file, beside the installer's own: the template editor's
finish says «Do not commit and do not push until the teacher says yes» and its
commit step comes after it. Retired, barred in ET: «next minor version», «The
architect», «the architect will fill», «so the architect can use it», «two
rendering engines», «Worksheets are a separate engine».

### Decision 3: no

Nothing is added. His own settings file still says "The skill's own instructions
already specify in-process mode"; they do not, and that note is his to change
(named in the report, section 12). C12 and E03 stay as they are.

### Decision 4: one log step, at the end, for engine faults only

His answer: "i dont read" (the reviewer's corrections in the log).

1. **PB › Phase 1.25 (I14).** «Append genuine corrections and remaining teacher
   choices to the shared build review log when `PLUGIN_SOURCE_ROOT` is
   available.» goes. «Read routing values directly from the approved
   `lesson-design.json`, never from prose.» stays, as its own paragraph.
2. **PB › Phase 3.6 (R07).** After «two rules that disagreed.» one sentence: *The
   review's own corrections are not findings: they stay in `design-review.md`.*
   R06 («developer mode is off: write nothing», pinned) is untouched.
3. **SK B19** («Only the shared build review log reads this value ... resolve it
   at that step rather than up front») now has no contradiction and stays.

Rows: I14, R06, R07, B19 (unchanged). Shared with the reviewer list (RV-R14): 10A
carries it. Tests: new RTT assertions, the design-review slice has no
"build review log" line and the finalize slice says the corrections stay in
`design-review.md`. Retired, barred everywhere: «Append genuine corrections and
remaining teacher choices».

### Decision 6: feedback on a built lesson edits it in place

His answer: "y". The suggestion: the skill's description names feedback on a
lesson already made as well as new lessons; its opening says, when the message
is feedback on a built lesson, read the edit-in-place guidance and edit, do not
start again; the guidance gains one line: a change lands on every resource that
shows it, and nothing else changes. Example: "Rename the character to Maya": the
slides, the notes, the worksheet and the answer key all say Maya, and every other
slide stays exactly as it was.

1. **SK frontmatter `description` (A01).** After «or produce a lesson pack.» one
   sentence: *Also use it when the teacher gives feedback on a lesson it already
   made ("the answer on slide 6 is wrong", "rename the character to Maya"), to
   edit that lesson in place.* Measure the description after (keep it well under
   1,024 characters, the tightest limit a host is known to set).
2. **SK › the orchestrator's opening, a new paragraph after A02.** *When the
   teacher's message is feedback on a lesson this skill already built, not a new
   brief, do not start a new run: resolve the package root as below, then read
   `[PLUGIN_ROOT]/references/revising-in-place.md` and edit that lesson in
   place.* This is the route U06 has always claimed and nothing gave it.
3. **RIP, a new short section after "Edit the existing files in place"**, headed
   "A change lands on every resource that shows it": *A change the teacher asks
   for lands on every resource that shows it, and nothing else changes. Renaming
   the character to Maya changes the slides, the speaker notes, the worksheet and
   its answer key, and any wall card or stick-in piece that carries the name;
   every other slide stays exactly as it was.* The existing question-and-answer
   section (U11) stays word for word; it is the commonest case of the new line.
4. **RIP › Edit the existing files in place (U09), the mechanism the promise
   needs** (the lesson "a decision can promise something the system cannot do"):
   - settled item a's correction: «re-run only the builders whose input changed:
     the slide-builder for `lesson.json`, the worksheet-builder for
     `worksheet.json`, and the same for any other sidecar file» becomes "rebuild
     only the resources whose file changed, each with `run-fixed-resource.py` and
     the kind, folders and lesson name its build used (`slides`, `worksheets`,
     `wall`, `stick-in`)";
   - «Open the existing `lesson.json` in the lesson's working folder and change
     exactly the slides the teacher named» becomes: open the lesson's working
     folder (`[OUTPUT_DIR]/working/[lesson-slug]`, found by the lesson's title;
     ask which when more than one could be meant) and change exactly what the
     teacher named, in each file that shows it (`lesson.json`, `worksheet.json`,
     `working-wall.json`, `stick-in-sheets.json`). The lesson designer's own file
     already finds an earlier lesson "in `[OUTPUT_DIR]/working/`" the same way.
   - What happens to the lesson's design file and to the copy on his drive is
     not settled by his answer: questions 2 and 3 (section 12). Until he answers,
     the drafts leave both untouched.
5. **Kept as they are:** U08 (the tells), U10 (leave the designers out; its
   undated "decide who is right" slide stays as a plain example, copied to the
   log first), U12 to U14, U15 (a rethink only when the design cannot carry it;
   "When in doubt, prefer the in-place edit and confirm").

Rows: A01, U06, U08 to U11, U15, G05 (a fresh run's archive, which this route now
never reaches). Tests: new, in one file (`test_feedback_edits_in_place.py`): the
description names feedback on a built lesson; SK's opening routes it to RIP
before any slice; RIP carries the new line and no longer names «the slide-builder
for `lesson.json`» or «the worksheet-builder for `worksheet.json`»
(`test_reference_loading_routes.py` pins RIP's heading «## Changing a file you
already wrote: edit the lines, not the file», which is untouched).

---

## 2. Release 10A: the settled items a to m

His answer: "yes for small ones" (the settled items).

**a. Out-of-date text, corrected; none changes a rule.** Each with its new words:

| Row | Where | Old | New |
|---|---|---|---|
| A04 | SK, the three layers | «deterministic commands build the direct fixed resources; the retained Working Wall builder performs its required physical-output judgement.» | "deterministic commands build the resources from them." (shared: RV-R23, the reviewer list's settled 5; carried here) |
| A25 | RT, `other-resources` successor | «Track D ends when the wall builder returns its evidence result» | "Track D ends when the wall build is accepted" |
| A28 | RT, `finalize` and `delivery` successors | «the teacher report and sync.» / «The run ends with the teacher report.» | "the teacher report and saving the resources." / "The run ends with the teacher report and where the lesson was saved." |
| B02, B03 | SK, the package root | «`lesson-resources` package directory» (twice) | "`lesson-v4` package directory" (the settings folder keeps its old name in code; only these words change) |
| C16 | SK, launch settings | «in place of an audit marker» | "beside the `WORKER_LAUNCH_AUDIT_UNAVAILABLE` marker that `audit --host claude` prints" (VRR refuses the section without one) |
| C21 | SK, completion discipline | «- Working Wall Builder keeps its existing short structured Output Report;» | the line goes |
| G15 | PB, setup | «For direct fixed slides, worksheets and stick-in sheets, let `run-fixed-resource.py` own output-family collision archiving. The retained wall builder owns its wall-family archive.» | "`run-fixed-resource.py` owns output-family collision archiving for the slides, worksheets, working wall and stick-in sheets." |
| I15 | PB, Phase 1.25 | «audit --host codex` and read the result.» | "audit --host [codex\|claude] --working-dir "[WORKING_DIR]"` and read the result." (C13's own command) |
| J16 | PB, the picture route | «and carry the matching `SLIDE_HELPER_GAP` or `WORKSHEET_HELPER_GAP` into the run report.» | clause goes; "Close the check" (J17) already carries `HELPER_GAP:` to the report, so it is named once. Pinned «Record the decision as `gap`» and «only when neither» stay |
| J32 | HR, capability contract | «these as `HELPER_VISUAL_REVIEW` for the existing resource inspection;» | "these as `HELPER_VISUAL_REVIEW`;" (the inspection was retired; nothing is added to say who reads the line, which is named as still open) |
| K08 | PB, launch the branches | «wait for `lesson.json` only when their prompts require it» | "start the moment `lesson.json` passes (Track A)" (pinned opening words stay) |
| L03 | PB, Track A | «require both markers» | "require all four markers" |
| L07 | PB, Track A | «`OPTIONAL_PICTURE_SHAPE` and `OPTIONAL_PICTURE_TOTALS` lines» | "`OPTIONAL_PICTURE_SHAPE`, `OPTIONAL_PICTURE_TOTALS` and any `OPTIONAL_PICTURE_DECLINED:` lines" (the check prints it, VRR requires it) |
| N12 | PB, the worksheet designer's launch | «[TEACHER_WORKSHEET_INPUT when supplied]» | the line goes (settled b) |
| O01 | PB, Track C | the heading and «This branch remains unavailable while its agents are marked Planned. ...» | both go; the two cut points that named the Track C heading (the end of `worksheet-render`, the start of `other-resources`) move to the Track D heading in RT and RTT together, the same release (no other file names Track C) |
| O06 | PB, Track D | the check command printed as one line with literal `\n` | real line continuations (backslash, line break), as every other command block |
| O08 | PB, Track D | «, and `working-wall-designer` judges the finished sheet at FINAL RESOURCE REVIEW.» | ends "cards laid out." (shared: RV-A10, carried here) |
| P04, Q13 | PB, Phase 3 and 3.5 | «`SLIDE_CONTENT_GAP` or `WORKSHEET_CONTENT_GAP`» (no role prints the first) | P04: "`WORKSHEET_CONTENT_GAP`, or a slide repair that leaves a reference unrepaired and names the decision the Lesson Designer needs,"; Q13: "A repair returning `WORKSHEET_CONTENT_GAP`, or a slide repair naming the decision the Lesson Designer needs, because ..." (the slide repair role's own words; giving it a marker is topic 9's) |
| P05 | PB, content-gap wave | «keep the picture cap» | "within the run ceiling of 24" (a late need, as H07 and J14 say) |
| P07 | PB, content-gap wave | «naming already-terminal filenames so nothing finished reopens» (reversed: the compiler compiles exactly the names it is given) | "naming only the revision's new filenames so nothing finished reopens" |
| Q09, Q14 | PB, Track A launch and Phase 3.5 | «passing the build's `SLIDES_FLAGGED:` numbers as `--flagged-slides`» | one name, carried in the launch: the decorator's block gains "[FLAGGED_SLIDES: the numbers after `FIXED_RESOURCE_FLAGGED slides:`, on a flagged deck]"; Q09 says "passing the numbers the build's `FIXED_RESOURCE_FLAGGED slides:` line names as `FLAGGED_SLIDES:`, and as `--flagged-slides` to your own optional-picture check" (the run's own check refuses `slide-flagged` without it) |
| S02 | PB, Phase 4 | «from fixed build summaries or the wall builder» | "from the fixed build summaries" |
| S03 | PB, Phase 4 | «it goes wherever the deck goes;» | "it stays with the run report;" (settled c) |
| S08 | PB, Phase 4 | «both from `worker-launch.py audit` run immediately beforehand» | "both from `worker-launch.py audit --host [codex\|claude] --working-dir "[WORKING_DIR]"` run immediately beforehand" |
| S13 | PB, Phase 4 | «a wall the builder could not verify against its page contract, which reaches the report as `PAGE_FIT_UNVERIFIED`, is `UNVERIFIED`.» | "sheets printed with no browser to check their page fit, which reach the report as `PAGE_FIT_UNVERIFIED`, are `UNVERIFIED`." (only the worksheet build prints it) |
| U01 | PB, edge cases | «resolve Phase-0 routing» | "resolve the routing above", and the line moves (settled j) |
| U03 | PB, edge cases | «; an unexplained `not-needed` decision is a design fault» | carried by the worksheets release (its settled g); 10A then folds what is left (settled j) |
| U09 | RIP | the builder agents' names | under decision 6, item 4 |
| U16 | GAP, opening | «slide-designer, slide-builder, worksheet-designer, ...» | "slide-designer, slide-decorator, worksheet-designer, ..." (the pinned «never invent or reword content to bridge a gap» and «opens this protocol only when a real gap» stay) |
| W15, W18, W27, W28, W39, W41, W42 | ET | old name, "the architect", two engines, minor version | under decision 2 |
| X14 | VRR | still accepts `Status: QUEUED` with a pending-log path | `QUEUED` leaves the status pattern and its branch goes; nothing prints it (`record-build-review.py` prints only `BUILD_REVIEW_LOG_OK` or `_FAILED`) |
| X15 | VRR, message | «an unverified review cannot close as COMPLETE» | "unverified page fit cannot close as COMPLETE" |
| X19 | RTT | the 70,000-byte slice test | goes (the 7 KiB test says everything it says) |

Tests that move with a: RTT (bounds, successor wording, X19), `test_content_gap_picture_wave.py`
L37 (`SLIDE_CONTENT_GAP` pair, moves to the new words) and L121 (P07's phrase,
turned round: the new phrase present, the old barred), `test_run_report.py` (its
two QUEUED tests become one: `QUEUED` is refused), and the three tests that bar
«FINAL RESOURCE REVIEW» (RTT's finalize slice, `test_optional_picture_pass.py`,
`test_worker_lifecycle_orchestration.py`) read whitespace-flattened text and SK
too, which is the hardening the reviewer list's settled 5 asked for (the phrase
broke across a line and passed). Kept, with a warning to the change script, the
line-break-sensitive pins in paragraphs this release edits: «run the Slide\nDecorator
over that flagged deck» (`test_slide_decorator.py`), «Only the
deterministic\nfinalisation waits for every branch», «that rerun is the\nrepair's
confirmation» and «Record the round in the run's\nfriction file» (RTT). Each
replacement re-wraps only its own sentence.

**b. Your own worksheet is not handed to the sheet designer.** N12's line goes
(above). F02, F09 and G08 stay. Test: the worksheet-render slice has no
`TEACHER_WORKSHEET_INPUT` line (the lesson designer's launch keeps its own, so
the bar is scoped to that slice, not global).

**c. The walk-through stays with the run report.** S03 (above); T01 already says
so and DF already skips it. Test: the delivery slice has no «wherever the deck
goes».

**d. Stories leave for the build log.** Section 7.

**e. Notes for whoever edits the plugin leave.** A11 (SK): «The order of work
belongs to those blocks rather than to a list here, because a list here can only
key each slice to an event (...) that you cannot recognise until you are holding
the slice that names it. Two failures come from exactly that gap, so treat both as
things NEXT tells you and a linear read of the playbook will not:» becomes *The
order of work belongs to those blocks, not to a list here. Two failures come from
reading the slices as a list, so treat both as things NEXT tells you and a linear
read of the playbook will not:* (the two bullets, A12 and A13, stay). J19 keeps
«Run it whatever the decisions say.» only. J26 loses «If a lesson is holding a
helper open for any of those reasons, that is the old route and it no longer
applies.» J30 keeps its rule and turns its history into the reason: "Do not run a
second copy from here: this route is read only on a `build`, and a check written
where only some runs can see it goes unrun on the rest." K01 loses «now». L14
keeps its first sentence (three tests read «earlier optional-picture stage») and
its last («It looks at nothing after the build and judges no photograph.»); the
middle history goes. M12 loses «, exactly as before this wave existed». N07's
«can no longer be» becomes "is never" (the pinned «not the adaptation document»
stays). O04 loses «That is what replaced two complete reference files and a hunt
through the lesson.» The size test's own comment (about 100 lines of dated
raises) is maintainer text in a test and stays; it gains one sentence saying the
file was consolidated here rather than raised.

**f. A sheet left out of a short pack is flagged and the lesson is partial.**
- Words: Q10 ends "...and list the pack as delivered; like a flagged deck, it is
  `PARTIAL`." S13's first clause becomes *A package missing an earned output, or
  delivering flagged slides or a pack short a sheet, is `PARTIAL`: under
  `## Outcome` a `Slides to check:` line names the slides, and each
  `SHEET_OMITTED:` line is copied.* This also writes, for the first time where
  the run reads it, the `Slides to check:` line the check has always required
  (X11).
- **Code (VRR):** read `build-results/worksheets.json`; when `omittedSheets` is
  non-empty, require each omitted sheet named under `## Outcome`, require the
  pack under Delivered resources (never excluded), and refuse `COMPLETE`, the
  same shape as the flagged-deck block beside it.
- Tests (`test_run_report.py`), mirroring the four flagged-deck tests: a short
  pack names its sheet and is partial; an omitted sheet left off Outcome is
  refused; a short pack cannot be complete; a short pack is never reported as
  withheld.

**g. The review step's "When it fails" follows the check it means.** I09 (the
paragraph on a review after the Phase 2 freeze) moves from before I10 to after
I11, so I10's «When it fails» reads straight after I08's validator run. No word
changes (the move is measured at 0 bytes). Test: in the design-review slice,
«Re-run the prepared `validator.command` yourself» comes before «When it fails»
with no paragraph between them. The eight phrases
`test_reviewer_hands_back_a_valid_design.py` pins in I10 are unaffected.

**h. Repeats fold where both copies are read at the same moment.**
- G07 (PB setup) folds into SK's F03 and F07, which carry more («obtained before
  the first worker starts», «in reply order»); SK is read immediately before the
  setup slice. G06 stays whole.
- U02 folds into N09 («`provided-by-teacher`: the teacher's sheet stands, so
  design only the Below and Greater Depth sheets accepted adaptation asked for»).
- **M16 is not folded,** against the ledger's byte table: the supplemental wave
  also runs under `PICTURE_STAGE: none required`, when the run never loaded the
  `pictures` slice, so a bare pointer to "the Phase 2 picture stage" would point
  at text that run never read. M16's summary is its mechanics; it stays.
- G08 stays (the reviewer list's R20 keeps it at the moment the brief is
  gathered).

**i. The playbook's opening paragraphs, which no run reads, leave** (D01, D02:
642 bytes). The title stays. D01's «Do not create orchestration job specs,
completion events, worker snapshots, transition receipts, scheduler audits or
latency reports.» moves, word for word, to the end of D08 in the execution
slice. D02's timeline is S08's.

**j. The saving step's edge cases move to the phases they govern.** U01 to a
paragraph of its own after F10 (setup slice), with «Phase-0 routing» corrected;
U02 folds into N09; U03's remainder (after the worksheets release) folds into N09,
which already says a generated sheet is expected unless the teacher supplied one;
U04 («Ambiguous or incomplete Lesson Designer output is not silently repaired by
the host.») joins the end of A02's paragraph in SK; A06 folds into A05 keeping
both its clauses: *They read the approved pedagogical contract, the lesson
design, which remains the single pedagogical source of truth, and specify their
own resource. Validated canonical files and picture evidence carry continuity;
conversation history and scheduler state do not.* The "Edge cases" heading goes.
Honest note: A06 and U04 were read at the end of the run and are now read at its
start, with the skill.

**k. A Below or Greater Depth sheet's problem goes back to the adaptation
designer.** P02: «Send that bounded decision to its existing owner, validate and
re-review the changed pedagogy, then resume only the affected resource.» becomes
*Send that bounded decision to its existing owner (an Expected sheet's to the
Lesson Designer, a Below or Greater Depth sheet's to the Adaptation Designer, its
author), validate, re-review a changed lesson design, then resume only the
affected resource.* "Re-review a changed lesson design" narrows «re-review the
changed pedagogy», because the reviewer never sees `adaptation.md` (his 10
September "Once it's downstream, it's being made"; the reviewer list's settled
9: no second reader for those sheets). The worksheets release's decision 5
(`WORKSHEET_CONTENT_GAP` back to its author) relies on this line. Tests: the two
phrases `test_worker_lifecycle_orchestration.py` pins in P02 and P03 stay, and
RTT's line-break pin at the paragraph's end is kept.

**l. For his own supplied worksheet, the adaptation designer still runs.** N01:
«teacher-provided expected worksheet: consider adaptation but do not generate a
second expected sheet;» becomes *teacher-provided expected worksheet: run
Adaptation Designer when available; it may find no Below or Greater Depth sheet is
needed, and never makes a second expected sheet;* (the lesson designer's own
words: "Below and Greater Depth adaptation still run"). Test:
`test_adaptation_architecture_contract.py` L149 moves to the new words; the old
«consider adaptation» is barred.

**m. Every flag reaches the flags list.** S14's list becomes: *each flagged slide
and its fault, each sheet left out of the pack, the design reviewer's unresolved
findings, every `flagsForTeacher` entry, any declared cross-resource impact from
a repair, every picture a designer was uneasy about, each
`PICTURE_LOW_RESOLUTION:` picture, why the wall is empty (its `rationaleNote`),
each stick-in moment left off for want of a visual, and every `SETUP_NOTE:` the
start-up check printed.* The copies that send a flag here stay as pointers with
their conditions (H08, R03, Q10, Q11, B12, I13). **The stick-in moment needs a
channel**: the stick-in designer's own file says to name it "in your final
report", which the pipeline footer overrides (C18). So O11's launch gains:
*and returns each moment it left off for want of a visual on a `Left off:` line*
(the footer lets a role return any field its assignment asks for). The wall's
reason already travels in `working-wall.json`. The wall designer's "primitive you
wished for" notes (S24) are not in his five and are left for topic 9. Test: RTT
asserts the Report format list names all five and O11 names `Left off:`.

---

## 3. The room, measured

`pbplan_simulate.py` applies every draft in sections 1, 2, 4 and 5 to a scratch
copy and measures with the tests' own counting (line endings as LF, each slice
with its NEXT trailer, the successor-line corrections included).

| Stage | Whole file (cap 78,848) | Spare |
|---|---|---|
| Today | 78,839 | 9 |
| After 10A | 77,037 | 1,811 |
| After 10B | 77,622 | 1,226 |
| After 10C | 78,057 | 791 |

10A in detail: out 3,520 bytes (the opening paragraphs 642, the edge-case block
619, stories 846, maintainer notes 532, the G07 repeat 197, decision 4's sentence
128, stale words and the scaffold track 556); in 1,718 (decision 1 261, settled m 292, settled f 190, P02 118, the
flagged-deck name and lines 179, the audit host lines 93, U01 121 moved, D08 134
moved, the rest small). Net 1,802 smaller. The ledger's "about 2.8 KB carries
nothing a run needs" is the gross figure; his decisions and the corrections spend
about 1.7 KB of it, and M16 stays (settled h).

| Slice (budget 7,168) | Today | After 10A | After 10B | After 10C |
|---|---|---|---|---|
| execution | 3,274 | 3,408 | 3,408 | 3,408 |
| setup | 4,730 | 4,599 | 4,599 | 4,599 |
| design-review | 7,037 | 6,948 | 6,948 | 6,948 |
| helpers | 7,079 | 6,718 | 6,718 | 6,718 |
| phase2-core | 6,299 | 5,958 | 5,958 | 5,958 |
| slides-design | 5,862 | 5,988 | 5,988 | 5,988 |
| worksheet-render | 7,146 | 7,106 | 7,106 | 7,106 |
| other-resources | 7,012 | 6,648 | 7,080 | 7,080 |
| focused-repair | 5,236 | 5,471 | 5,471 | 5,906 |
| finalize | 4,420 | 4,516 | 4,539 | 4,539 |
| delivery | 7,163 | 6,965 | 7,095 | 7,095 |

(The other six slices get smaller or grow by at most 112 bytes, and stay far
under.) Three
end tight: `worksheet-render` (62 spare, untouched by 10B and 10C), `other-resources`
(88 after 10B) and `delivery` (73). The worksheets release makes
`worksheet-render` 3 bytes smaller and 7A makes `delivery` about 7 larger; the
change scripts re-measure after each file. The three picture waves (about
7.4 KB read on every run) could later move to references read only when a wave
runs; that saves reading, not this cap, and is not in these releases.

---

## 4. Release 10B: the four run faults (decision 7)

His answer: "y". Each fault with its fix, its words, its code and its test, and
one build-log line each.

**Fault 1. A labelled photo on the stick-in pack is never corrected** (L15, L05,
O14). The stick-in designer copies the slide's dots the moment `lesson.json`
passes, before the slides' anchor pass (L12) moves them, and nothing anchors the
pack. The anchor role already takes `stick-in-sheets.json` (its image field is
`image` there) and reuses the slides' reading through the `<photo>.anchors.json`
sidecar, so the dots come out the same as the board's.
- Words, Track F (O14): after «an empty list ends the track.» *Wait until every
  picture it names is terminal, as Track A does. If it holds a labelled diagram
  over a photo, launch Diagram Anchor against it first, passing the stick-in spec
  as the file to anchor: its designer copied the dots before the slides' anchor
  pass moved them.*
- The wait is part of the fix, not an addition: the anchor needs the published
  picture, and a stick-in piece whose picture has not published is dropped by the
  build (`[stick-in] ... image not found`), which today refuses the whole pack.
- Test: RTT asserts the other-resources slice names Diagram Anchor for the
  stick-in spec and the terminal wait before the Track F build. Log line.

**Fault 2. With no browser, the printed resources never reach his drive** (X20,
X21, T01). The worksheet, wall and stick-in builds write web pages and say
`FIXED_RESOURCE_DEGRADED`; DF copies only `.pptx`, `.pdf`, `.docx`, `.xlsx` and
answer keys, so the drive gets the deck and the keys and nothing says why. The
fix keeps his 13 September ruling (teaching resources only): a web-page sheet is
the sheet.
- Code: `run-fixed-resource.py deliver` reads `build-results/*.json` in the working
  folder and passes, for each summary with `ok: true` and `degraded: true`, its
  `.html` outputs as `--web-page NAME`; DF treats a name given by `--web-page` as a
  teaching resource. An `.html` not so named (a preview beside a PDF) is still
  skipped as build HTML, as DF's comment says it must be.
- Words, Phase 5 (T01): *A build that printed `FIXED_RESOURCE_DEGRADED` wrote web
  pages for want of a browser: pass them, and say so in the teacher flags.*
- Tests: `test_deliver_files.py` (a named web page is copied; an unnamed one is
  skipped); `test_run_fixed_resource.py` (a degraded worksheet summary's pages are
  passed; a normal build's HTML is not). Log line.

**Fault 3. If the slide designer never returns, the wall and stick-ins never
start** (O15, O02, O10). The wall packet builds its view with no `lesson.json`
(it says «No slide spec was available», tested) and the stick-in designer falls
back to the design's figures (its own file), but both tracks start only "the
moment `lesson.json` passes".
- Words, Track D (O02): after «(beside the Slide Decorator, never after it),» add
  *or once the slide branch has ended without one,* and before the colon *(the
  packet then builds the view from `lesson-design.json` alone)*. Track E (O10):
  after «beside the Slide Decorator and Track D» add *, or once the slide branch
  has ended without one*. The pinned «Launch Working Wall Designer on every run»,
  «beside the Slide Decorator, never after it» and «beside the Slide Decorator
  and Track D» stay.
- Test: RTT asserts both tracks name the start when the slide branch ends with no
  deck. Log line.

**Fault 4. Picture provenance is skipped when the lesson began with no
pictures** (R05, M13). Under `PICTURE_STAGE: none required` the supplemental
wave (and the content-gap wave) can still publish pictures.
- Words (R05): «so it runs only when the picture stage attempted them. Under
  `PICTURE_STAGE: unavailable` or `none required` nothing was published and there
  is nothing to prove:» becomes *so it runs whenever any wave wrote a terminal
  receipt, including a later wave on a run that began `none required`. With no
  receipt, nothing was published and there is nothing to prove:* The rest stays.
- Test (`test_finalize_picture_assignment.py`): provenance over a final contract
  holding only promoted sheet pictures, from an empty initial contract, passes
  (the ledger marked this untested; read at planning, the code should pass it,
  and the test proves it). RTT asserts the finalize slice's new condition. Log
  line.

**Found while planning, carried only on his yes (question 4):** Track D has the
same gap as fault 1's wait: a wall card whose photograph is its content
(`photoMapOverview`, `heroCallouts`, `causeCards`) refuses the whole wall when
built before that photograph publishes, and nothing makes Track D wait. And R03
tells the run to copy each `PICTURE_LOW_RESOLUTION:` line into `friction.md`
untagged, which VRR refuses ("is not a tagged record"). Each would be one
sentence and one test.

---

## 5. Release 10C: the wall and the stick-in pack ship flagged (decision 5)

His answer: "y". The suggestion: the card kit stays as it is; the wall and the
stick-in pack ship like the deck: the card or piece that failed is left off and
named in his flags. Example: a stick-in pack of four pieces where one number line
cannot be drawn: today none of the four; with this, three and a flag naming the
fourth.

**Words (PB, Phase 3.5, after Q10, in the focused-repair slice where the repair
round's outcomes live):** *A wall or stick-in pack the round did not clear still
ships too. Rebuild it with `--omit-failing`: the wall leaves off each card that
still fails, the pack each write-on piece that cannot be drawn, each named on a
`WALL_CARD_OMITTED:` or `STICK_IN_PIECE_OMITTED:` line. Carry each into the
teacher flags; the package is `PARTIAL`. The last teaching card is never left off,
and a card kit never: its fault still excludes the pack.* O09, O12 and O14 stay
as they are (one round each; O12's kit rule unchanged).

**Code, the stick-in build (`stick-in-sheets-html/build.js`).** It already builds
the pack without the pieces it cannot draw and names them, then exits 1 because
"this pack looks complete and is not". Under `--omit-failing` only: exit 0, print
one `STICK_IN_PIECE_OMITTED: <label> - <why>` line per dropped write-on or
source piece, and still exit 1 when a card-set is dropped or nothing at all could
be drawn. Without the flag, nothing changes. The comment's reason is kept: the
pack is named short, never silently complete-looking.

**Code, the wall build (`working-wall-html/build.js`).** Today a layout warning
anywhere refuses the whole wall. Under `--omit-failing` only: attribute each
layout warning and each unreadable required photograph to its card (warnings are
collected per render call, so the card index is known), leave those cards off,
render the rest, and print `WALL_CARD_OMITTED: <title> - <first fault>` per card.
Still refused whole: a fault that is not one card's (a number containing six
seven, the topic, more than two teaching cards, an unknown type or page), a
physical page mismatch after printing (it cannot be traced to a card), and a wall
whose every teaching card failed.

**Code, the wrapper and the report check.** RFR: `--omit-failing` for the `wall`
and `stick-in` kinds (the worksheets keep `--omit-unfittable`), summary fields
`omittedCards` and `omittedPieces`, and `FIXED_RESOURCE_FLAGGED wall:` /
`stick-in:` as the worksheets print it. VRR: a summary with omitted cards or
pieces cannot close `COMPLETE`, must be listed as delivered, and each omitted name
appears under `## Outcome` (the same shape as settled f).

**Tests.** Engine: a wall with one card over its budget ships the other card and
names the first; a wall whose only teaching card fails is still refused; a
stick-in pack with one undrawable number line ships three pieces and names the
fourth; a dropped card-set still refuses. Wrapper and report: the summary fields,
the flagged marker, the report's Outcome and status. RTT: the focused-repair
slice carries the paragraph.

---

## 6. The homes, afterwards

| What | Its one home | Copies that stay as pointers, keeping their conditions |
|---|---|---|
| How a run advances; what a branch waits for | SK › Lazy runtime loading, and RT's successor lines | PB's "tracks are reference" (K09), P03 |
| Launch, isolation, completion, friction | SK | PB's protocol step (C05, C08), C24 at the designer's launch |
| The teacher's own words and who reads them | SK › Teacher-authored run input (F02 to F09, now carrying G07) | PB's G08, the setup slice's F10 |
| Who repairs what (decision 1) | PB › Phase 3.5 (Q02, Q06) | H04, I10 (the design's own two routes) |
| What ships flagged: deck, pack (and, with 10C, wall and stick-ins) | PB › Phase 3.5 (Q09, Q10, 10C's paragraph); the code in RFR and VRR | L13 at the slide build |
| The report's shape, status and the Outcome lines | PB › Phase 4 (S01 to S13); VRR | none |
| The teacher flags | PB › Report format (S14) | H08, R03, Q10, Q11, B12, I13 |
| The build log (decision 4) | PB › Phase 3.6 (R06, R07) | SK B19 (when to resolve the root) |
| Feedback on a built lesson (decision 6) | RIP | SK's description and opening line |
| The template editor's publishing (decision 2) | ET › Finish every run | the installer's own stop (W13), read on its own |
| What reaches the drive | PB › Phase 5 (T01); DF | CS › Choosing where lessons are saved (V03) |
| A sheet's gap and who owns it (settled k) | PB › Phase 3 (P02) | the worksheet designer's own routing (P10, topic 9 file) |

---

## 7. Stories

His standing rules: stories leave, reasons stay; a case that makes a rule clear
may stay as a plain example; his rulings keep his words without their dates.
Copied to the log first (script `c1_stories_first.py`, one "Stories kept here"
block in 10A's entry, checked by script before anything leaves), then removed:

| Row | Story | In the log? | What happens | What reason stays |
|---|---|---|---|---|
| B07 (SK) | Codex runs rediscovering Python, 13 September | yes | the "which is how ..." clause goes | "an interpreter found with extra access can be one no worker can start" |
| B18 (SK) | a run lost its wall, stick-ins and filing to a patch release | **no**: copy from commit `fc698ee4`'s message | the colon clause goes | B16: an update arriving is not damage; a patch release does not un-check anything |
| C13 (SK) | a history report printed a maths lesson's timings, 22 September | **no**: copy from the six-run plan's Part G | the clause goes | "without it the newest record wins" |
| E05 (SK) | a Work run stalled after its first three workers, 13 September | yes (4.2.192) | the bracket goes | "nothing starts the next turn, and an unattended or scheduled run has nobody to type one" |
| J12 (PB) | the geography run's two substitute maps | yes | turned into its reason | "a contract frozen without the picture leaves the deck to fill the hole with the nearest live helper, drawn from chosen coordinates rather than the real place" |
| K10 (PB) | geography photographs held fourteen minutes | yes | goes | "Releasing is normally seconds of deterministic work ... and each one frees a whole branch." |
| M08 (PB) | twelve of sixteen slides bare, 21 September | yes | goes | the sentence before it: each reconcile would otherwise close the hole silently |
| M09 (PB) | the four to nine minute search | **no**: copy from commit `1744b996`'s message (that release has no log entry at all) | the measurement goes | "Waiting for that answer before searching puts the picture search on the end of the worksheet chain; sourcing now, in parallel, takes it off the end." |
| P06 (PB) | the history deck he refused, 4 September | yes | the clause goes | "a revision that removes a source, rewrites the model beat and re-points the Do beats is a new lesson" |
| Q08 (PB) | Maths 15 lost its pack, 22 September | yes | goes | the rule's own sentence |
| T09 (CD) | the RE deck as "474280 bytes omitted" (13 September) and the wasted blob (14 September) | yes | dates and the deck go | "Reading it whole truncates silently, and a cut-off read can look complete", with a plain present-tense example (a middle that comes back as the words "bytes omitted" is decoded, posted and will not open) |
| V12 (CS) | the three OpenAI hosts, proved 13 September | yes | the date goes | the three hosts and what each can do |
| V17 (CS) | 404 without a token, checked 20 September | yes | the checked sentence goes | "every fetch comes back 404 ... and the run builds each lesson with no drawings" |
| U10 (RIP) | the "decide who is right" slide that vanished | **no** | copied; stays as a plain undated example | it makes "leave the designers out" concrete |
| U24 (GAP) | the stage direction written into a clock question | **no** (PF-B53; topic 7B leaves this file alone) | copied; stays as a plain example | it is the protocol's only concrete invention |
| U25 (GAP) | the blank world map dropped for a gap that did not exist | **no** | copied; stays as a plain example | why a gap is checked against the catalogue |
| W33, W34 (ET) | template edits lost by skimming a truncated parse | **no** | copied; stays as the reason | the reason for the audit table, undated |
| W24 (ET) | "Why (hard-earned)" | **no** | copied; the paragraph is not otherwise edited and stays | its reason is already in the paragraph |
| X07, X02, X08 | code comments with dates and his words | yes | stay (code, not read by a run) | |
| Q09 (PB) | his ruling, 16 September | yes | the date goes | "(the teacher's ruling: "flag the slides and deliver it")" |

The retired phrases barred everywhere except the log: «twelve of sixteen slides
bare», «fifty-seven minute run», «Maths 15 (22 September 2026)», «the one this
pipeline delivered without a second review», «a geography run wrote exactly
that», «four to nine minute», «history report printed a maths lesson's timings»,
«a real run lost its working wall», «474280 bytes omitted», «Checked against the
real private library», «rediscovering Python (13 September 2026)», «stalled
after each of its first three workers».

---

## 8. Which release carries each shared line

| Line | Owner of the rule | Carried by | Note |
|---|---|---|---|
| PB-N16, Track B reconcile («re-authoring that one question against what exists») | worksheets (WS-P32) | worksheets release (planned 4.2.290) | 10A re-reads it; it makes `worksheet-render` 3 bytes smaller |
| PB-U03, the `not-needed` edge case | worksheets (WS-A12) | worksheets release corrects it; 10A folds what is left (settled j) | if 10A ran first it would cut the whole line and the worksheets script would skip its edit |
| PB-P02 routing for Below and Greater Depth | settled k here; the worksheets release's decision 5 relies on it | 10A | |
| GAP (the brief-gap protocol): its new Worksheet Designer route and the worksheet example | worksheets | worksheets release | 10A touches only U16's name list in the same file |
| PB-S14's second sentence (the Lesson 2 scope) | topic 7A (PF decision 20) | 7A (planned 4.2.291) | 10A edits the first sentence of the same paragraph |
| ET's font-size paragraph (W25) | topic 7B (PF decision 19) | 7B | 10A edits other ET paragraphs |
| RV settled 5: PB-O08 and SK-A04, and hardening the three tests | reviewer list | 10A | agreed with topic 8's plan (its section 8) |
| RV "for later topics": PB-I09 and I10 order | reviewer list | 10A (settled g) | agreed with topic 8's plan (its section 8) |
| RV-R14 = PB-I14 (the review's log sentence) | this list's decision 4 | 10A | agreed with topic 8's plan (its section 8) |
| PB-B21, the make-subject-file skill's test run | subject files | topic 8's subject release, with the skill | agreed with topic 8's plan (its section 8) |
| CS L200 (V20): "writing a subject file" among the developer commands | subject files | topic 8's subject release | also the plugin read-me L141 |
| `test_run_never_publishes.py` docstring (/make-subject-file) and `test_plugin_root_contract.py`'s token count for that skill | subject files | topic 8 | 10A adds decision 2's test to the same test file; whichever lands second re-reads it |
| The slide repairer's missing gap marker (P04, U21) | topic 9 | topic 9 | 10A names what the repair says instead |
| How the stick-in designer hands over a left-off moment | topic 9 | 10A adds the launch's return line; topic 9 may move it into the spec | |
| The rescue wave's reach for Below and Greater Depth pictures (P10) | topic 9 | topic 9 | |
| The picture budget of 16 against "no caps" (H06) | topic 9 | topic 9 | |

No other topic's pin file holds a phrase 10A changes (checked by both pin
finders: AK-F09's two phrases, SC-L15's draw-live paragraph, SC-I10, I19 and I20
in GAP, and VOC-Q05 in ET all sit in text 10A leaves as it is). The suites prove
it.

---

## 9. Order of work, and the scripts

Every scripted replacement asserts its old text appears exactly once, keeps the
Windows line endings (Python text mode), and is written with the Write tool,
never a heredoc. A paragraph a script rewrites loses its em and en dashes; moved
or untouched paragraphs are not re-punctuated. The size tests are run after
every file.

**10A (`pb-change/`)**
1. `c0_baseline.py`: the ledger re-check, the suites, the saved designs and the
   slice census (section 0).
2. `c1_stories_first.py`: the eight uncopied stories and the kept examples into
   10A's log entry draft; checked by script (`scratch/pb_logcheck.py` exists from
   the inventory) before step 3.
3. `c2_runtime.py`: RT's cut points and three successor lines; RTT's bounds, the
   X19 removal, the size comment's new sentence. Run RTT: every slice must still
   match the playbook bytes (it will fail until step 4 removes Track C, so steps 3
   and 4 run together and are tested together).
4. `c3_playbook.py`: every PB edit of sections 1 and 2, in file order, seeded
   from `scratch/pbplan_simulate.py`'s list; then `pbplan_measure.py`: the whole
   file must be 77,037 bytes, give or take the worksheets and 7A lines.
5. `c4_skill.py`: SK (decision 6, A01, A02+U04, A04, A05+A06, A11, B02, B03, B07,
   B18, C13, C16, C21, E05).
6. `c5_references.py`: RIP (decision 6), GAP (U16), HR (J26, J30, J32), CD (T09),
   CS (V12, V17).
7. `c6_template_editor.py`: ET (decision 2 and its stale lines).
8. `c7_report_check.py`: VRR (settled f, X14, X15) with its tests.
9. `c8_tests.py`: the moved and new tests (sections 1 and 2), each with a
   docstring naming the decision that moved it, including the three hardened
   FINAL RESOURCE REVIEW bars.
10. `build_pb_mapping.py` on `ledger_mapping.py`, writing
    `plans/2026-09-24-playbook-mapping.md`, `scripts/tests/playbook_ledger_pins.json`
    and `scripts/tests/test_playbook_ledger_is_kept.py`. The tool's path pattern
    already reads `agents`, `references`, `skills`, `commands` and `scripts`, so
    it needs no change (the worksheets release widens it for `worksheet-html`
    first). Row E07 is outside the plugin (his own settings) and is mapped as
    "not in the plugin, decision 3: no". Pins: every row in its section; whole
    paragraphs for every changed row; homes in exact paragraph order (PB › Phase
    3.5, PB › Phase 4 with Report format, RIP whole, ET › Finish every run, SK's
    opening section); the retired phrases of sections 1, 2 and 7 barred
    everywhere except the log, and the scoped ones (`TEACHER_WORKSHEET_INPUT` in
    the worksheet-render slice; "the architect" in ET) by their own assertion.
11. `c9_log_entry.py`: 10A's build-log entry, true to what shipped, with its
    "Not done yet, and named" (section 12); both `plugin.json`.
12. `run-all-suites.sh pb-after`; saved designs compared (none should change);
    the slice census compared. Two independent checks: one row by row against the
    ledger and his words, attacking the pins on a complete scratch copy of the
    plugin (tests run on the untouched copy first); a second on the repairs.

**10B (`pb-faults/`)**: `f1_stick_in_anchor.py`, `f2_web_pages.py` (RFR, DF and
T01, with tests), `f3_no_deck.py`, `f4_provenance.py`, each with its test and log
line; then the pins for the changed rows (the 10A pin file is extended, not a
new file), the log entry, both `plugin.json`, the suites, and one independent
check (the SC and worksheets releases showed code changes want a second: add one
if f2's code check finds anything).

**10C (`pb-flagged/`)**: `g1_stick_in_build.py` and its engine tests, `g2_wall_build.py`
and its engine tests, `g3_wrapper_and_report.py`, `g4_playbook.py`, pins, log,
both `plugin.json`; every saved wall and stick-in spec in the repository run
through both builds before and after (signals only, the worksheets release's
census pattern): nothing may change without the flag. Two independent checks and
a narrow third on the engine code, as the success-criteria release needed once
its engine changed.

---

## 10. Risks

1. **The full designer's repair runs with no check on what it lost** (decision 1).
   The scope check is one command; it refuses new words and lost content alike,
   so "not asked for the new-words check" means not asked for any of it. The
   rebuild catches a slide that will not build, not one that quietly lost its
   table: the very fault the check was written for. The prompt's
   `Already passed` and in-place line are the only guard. Question 1.
2. **Who judges "the change is to what children read".** The orchestrator, from
   the fault in front of it. Sending an ordinary layout fault to the full role costs
   time only; sending new wording to a quick role costs the round, as today. Nothing
   here lets a round that a quick role handed back be re-sent (that would be a new
   rule; not proposed).
3. **Folds read at a different moment** (settled h and j). G07 relies on SK read
   just before; A06 and U04 move from the end of the run to its start. The words
   are all kept.
4. **M16 is kept against the ledger's proposal** (settled h): the fold would have
   pointed a `none required` run at a slice it never loaded. The ledger's byte
   table counted it; the measured room above does not.
5. **Line-break-sensitive pins** sit in three paragraphs this release edits
   (section 2, a). A script that re-wraps a whole paragraph fails them.
6. **Tight slices after 10B**: other-resources 88 spare, delivery 73. Question
   4's wall wait (about 50 bytes in other-resources) fits; anything more there
   needs the Track D and E launch prose tightened first.
7. **Decision 6 needs mechanism the promise did not name**: finding the lesson's
   folder in a new conversation, and rebuilding through the wrapper. Both are
   written in (section 1). Two further consequences are his to decide: the design
   file the next lesson copies from, and the copy on his drive (questions 2, 3).
8. **Settled m's stick-in channel** is a return line the stick-in designer's own
   file does not name; it works because the footer lets any assignment ask for a
   field. Topic 9 may fold it into the spec.
9. **Settled k narrows a shared sentence** («re-review the changed pedagogy» to
   "re-review a changed lesson design"). It agrees with his "no second reader"
   ruling; a checker should read it against that, not against the old words.
10. **Removing `QUEUED`** (X14): a log write that fails has only `UPDATED` or
    `NOT REQUIRED` to report. Nothing prints `QUEUED`, so no run is lost; the
    failure stays a friction line, as R07 already implies.
11. **10C changes what the engines refuse.** Without the flag nothing changes,
    and the census over every saved spec proves it; with it, a wall card whose
    failure cannot be traced (a page mismatch after printing) still refuses the
    wall. Until 10C ships, his decision 5 is not yet true, and the 10A and 10B
    logs say so.
12. **Three corrections add words** under settled a, each named in the ledger's
    out-of-date table: the Codex refresh after a version bump (W39), the run's own
    `--flagged-slides` on a flagged deck (Q09), and the `Slides to check:` line
    (S13). A checker should confirm each against that table, not treat it as new
    guidance.
13. **Shared lines** (section 8): whichever release lands second re-reads them;
    topic 8's plan agrees which lines 10A carries.

---

## 11. Before-and-after lessons

10A changes no teaching, so its live check is a run's shape: the next ordinary
Codex lesson after it (copy the delivered deck first, and ask him before
installing, since `codex plugin add` switches all his Codex lessons). 10B's and
10C's faults are rare by nature; their proof is the tests and fixtures, and a
live run is only evidence if the fault happens to occur.

---

## 12. What his answers leave open

**Question 1. The full designer's repair: checked for what it lost?**
- **What it says now.** Your yes sends a repair that needs new words for children
  to the full designer. The quick repairs run a check that refuses new words and
  also refuses lost content: a question, a table row, a place to write. The full
  designer cannot pass the first half, so it runs with no check at all.
- **What I think.** The rebuild catches a slide that will not build, not one that
  quietly lost something. That check exists because a repair once returned a
  "compare the objects" slide with the comparison gone, and every other check
  passed.
- **What I suggest.** Give the check a second mode for the full designer that
  lets reworded text through but still refuses anything lost. A small program
  change with its tests, in 10A; the quick repairs keep the whole check. Honest
  note: a reworded question counts as a lost string today, so the new mode has to
  compare questions, rows and writing room, not words.
- **Question:** yes?

**Question 2. Fixing a lesson that is already on your drive.**
- **What it says now.** An edit to a built lesson rebuilds it in the lesson's own
  folder. Nothing says whether the fixed files go to your drive, and the saving
  step, if run again, copies over whatever is there.
- **What I think.** A fix that never reaches the drive is a fix you do not see in
  class. But if you had changed the deck on the drive yourself, saving over it
  would lose your changes.
- **What I suggest.** The fixed files replace the old ones on your drive, except a
  file that is no longer the one the run saved last time (it can tell, because it
  keeps each file's fingerprint as built); for that one it asks you first.
- **Question:** yes?

**Question 3. Fixing the lesson's design too.**
- **What it says now.** Tomorrow's lesson reads today's design to reuse the exact
  words children saw (the steps, the definitions, the key fact). An edit changes
  the slides and sheets, not the design.
- **What I think.** You change step 2 from "Look at the tens" to "Look at the tens
  digit"; tomorrow's lesson copies the old step back.
- **What I suggest.** An edit to words children see is also made in the lesson's
  design file, with its check re-run. Nothing is redesigned.
- **Question:** yes?

**Question 4. Two more small faults, found while planning.**
- **What it says now.** The wall can be built before a photograph it needs has
  arrived, and then the whole wall is refused (the stick-in pack had the same gap,
  which fault 1's fix closes). And the step that copies a low-resolution picture's
  warning into the run's problem record writes it in a shape the report check
  refuses.
- **What I think.** Both are the same kind as your four: one step not meeting the
  next, rare and silent.
- **What I suggest.** Add both to the same small release (10B), one sentence and
  one test each.
- **Question:** yes?

**His answers (24 September, evening), put to him as 3 to 6 beside topic 8's two:** "number one who's Prophet Muhammad and why are pictures not allowed number two Yes. Number three. Yes. Number four. Yes. Number five. Yes, number six. Yes." Questions 1 to 4 here: yes, each suggestion as written.

**Named for the report, not questions:** decision 3 adds nothing, and his own
settings file's line saying the skill asks for watched agents is his to change;
decision 5 is not true until 10C ships; M16 stays (risk 4); the report's title
and heading order are still written only in the check; `HELPER_VISUAL_REVIEW`
lines now reach nobody (J32), and nothing checks a recorded helper `gap` reaches
the report (X25); the term-dates file sits in the plugin's own folder, which an
update replaces (V06); the three picture waves could later move out to be read
only when they run.

---

## 13. Size, honestly

- **Rows.** 10A changes about 87 of the 452 (50 in PB, 13 in SK, 6 in the
  programs and tests, about 10 in the references, 8 in ET); 10B about 10; 10C about
  5 plus its engine code. The other rows are pinned where they stand.
- **Files.** 10A: PB, SK, RIP, GAP, HR, CD, CS, ET, RT, VRR, and about eight test
  files, plus the new pin file and test, the log and both `plugin.json`. 10B: PB,
  RFR, DF and four test files. 10C: PB, the two engines, RFR, VRR and about six
  test files.
- **Bytes.** The playbook 1,802 bytes smaller after 10A (measured), 782 after
  all three. SK about the same size (decision 6's two sentences in, the stories
  and maintainer text out); RIP about 0.6 KB larger; ET about 0.3 KB larger
  (decision 2's stop); CD, CS and HR about 0.5 KB smaller together. VRR about 1 KB
  larger after 10A (settled f in, `QUEUED` out) and 1 KB more in 10C; RFR and DF
  about 1 KB in 10B; the two engines about 3 to 5 KB in 10C. The pin file and its
  test about 100 to 150 KB, like the earlier topics'. The log about 10 KB.
- **Effort.** 10A is about the size of the success-criteria release in rows, with
  less code; plan for two independent checks. 10B is small. 10C is a real engine
  change on two builders; plan for two checks and a narrow third.

## Carried from the worksheets release (4.2.290, 25 September)

The worksheets release built the engine side of his answers and named three things
only the playbook can say (see `streamline-tools/ws-release-report.md`): send each
returned Below or Greater Depth sheet to the adaptation designer to redesign; rebuild
with the redesigned sheet; and carry each `SHEET_STANDS_IN` line into his report as a
flag naming the tier and why. Until 10A writes them, packs are delivered with the
Expected sheet standing in and flagged, but no redesign is asked for. 10A carries them.
It also named a fourth: the playbook's "A pack the round did not clear still ships
too" paragraph must say that a Below or Greater Depth sheet the page cannot hold now
arrives as a `SHEET_STANDS_IN` line (the Expected sheet in its place), not
`SHEET_OMITTED`; an Expected sheet the page cannot hold is still omitted and flagged.
