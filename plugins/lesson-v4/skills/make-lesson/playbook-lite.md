# Make Lesson — Lightweight runtime playbook

This is the active runtime playbook. It deliberately avoids a generic job
controller. The host launches named workers directly, waits through the host's
normal worker lifecycle, and runs deterministic checks at meaningful file
boundaries. Do not create orchestration job specs, completion events, worker
snapshots, transition receipts, scheduler audits or latency reports. The one
timing record a run keeps is the `WORKER_TIMELINE:` block that
`worker-launch.py audit` prints from the host's own log: it costs the
orchestrator nothing to produce, it is copied once into the run report, and
it is what says whether a change made runs faster.

## Lightweight execution protocol

For a named model worker:

1. give it only its role file, authoritative input paths, owned output paths,
   required check and terminal marker;
2. launch it directly with clean context, at the model, effort and task name
   `worker-launch.py spec` prints for its role;
3. wait for it through the host's ordinary worker-wait mechanism;
4. require its owned files and exact terminal marker;
5. run the named deterministic validator immediately.

Independent workers may run in parallel. Never launch two workers that own the
same file. A downstream worker starts only after its authoritative input has
passed its deterministic check.

Retry once only for an infrastructure failure: a launch that never starts, a
terminated tool session, or a worker that has genuinely stopped working.
Use a fresh clean-context worker with the same saved inputs. Do not retry a
completed semantic result merely because it is inconvenient. Use the explicit
redesign or focused-repair route instead. After the one infrastructure retry,
preserve clean outputs from unrelated branches and report the affected output
as incomplete.

**Judge a worker by its whole working directory, never by its owned outputs.**
Several roles write their owned file exactly once, at the end, after their
checks pass: the Slide Designer builds its candidate in
`lesson.json.tmp.[ATTEMPT_ID]` and only then replaces `lesson.json`. An
untouched owned output is therefore what a healthy run looks like for most of
its length, and watching one tells you nothing until the moment it tells you
everything. A worker is making progress when anything in `[WORKING_DIR]` has
changed recently, including a temporary or attempt-suffixed file; it has
stopped when nothing there has moved and the host reports no activity. Kill a
long worker only on that second reading.

That evidence rule is not confined to workers. Read the newest artefact a stage
actually produced before declaring the stage failed.

Canonical validated files are the checkpoints. On an interrupted run, resume
from the latest checkpoint whose validator still passes and whose upstream
teacher input belongs to this working directory. Do not manufacture a second
queue or receipt system.

Run deterministic commands directly. Require their exit status, exact success
marker, and structured summary when the command defines one. A failed build may
receive its one documented focused repair; do not wrap ordinary commands in
model workers.

The picture stage is the sole evidence-heavy exception. Keep its immutable
schema-2 assignments, staged worker results, per-filename terminal receipts and
final provenance because they protect external-source licensing, generated-
image history and partial publication. These picture records do not require or
authorise the generic orchestration controller.

---

## Before Each Run: Know What Exists

Check the named agents under `[PLUGIN_ROOT]/agents/`. `lesson-designer` is
required. Missing optional agents skip only their resource or review:

- no `design-reviewer`: use the validated design and report review skipped;
- no `adaptation-designer`: build only the expected-range worksheet;
- no `slide-designer`, `worksheet-designer`, stick-in or wall role: omit only
  that output and exclude it as NOT DELIVERED naming the missing role;
- no image scout: omit unresolved pictures under the normal degradation rule.

Check fixed builders only when their resource is earned. Never spawn a model to
imitate a missing fixed builder.

### Gather and preserve the brief

Require a Year 1–6 and learning objective. Infer only what is explicit or fixed
by the routing rules; ask only when year or subject is genuinely ambiguous.

Create `[OUTPUT_DIR]/working/[lesson-slug]` after deriving the slug with
`scripts/slugify.js`. Archive an existing non-empty working folder to the lowest
unused ` (N)` sibling before starting a fresh run. Create its `unsplash/`
subfolder.

Write the teacher's original message verbatim to
`[WORKING_DIR]/teacher-brief.txt`, read it back once, and require an exact match.
On a mismatch, rewrite and read back once more; a second mismatch means the
working directory is not holding files, so stop and report that infrastructure
fault, because nothing later in the run can persist its outputs either.
Store clarification replies separately as
`teacher-clarifications/001.txt`, `002.txt`, and so on. Put genuinely useful
host inference in `orchestrator-context.md`; it never overrides teacher text.

A separately supplied lesson plan remains `LESSON_PLAN_INPUT`; a supplied
worksheet remains `TEACHER_WORKSHEET_INPUT`. Do not paste either into the brief.
Only Lesson Designer, Design Reviewer and Adaptation Designer may read raw
teacher-authored files.

**A brief that names a document is a pointer, not the lesson.** The brief file
keeps its exact words, but a designer handed only the pointer has to find and
interpret the file itself, and on an unattended run a path that does not resolve
becomes a lesson designed from a filename. Check the path exists, pass it as
`LESSON_PLAN_INPUT`, and put in `orchestrator-context.md` which lesson in it this
run is for and that the surrounding lessons are context, not a script. Never
summarise the plan into either file. If the path does not resolve, say so and
stop, unless the message also carries a usable year and objective - then design
from that and flag the file.

### Say where the lesson will be filed, while the designer works

In the same step that launches the Lesson Designer, not before it, run:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/resolve-filing.py" "[PLUGIN_ROOT]/Knowledge/term/Term.md" "[YEAR]" "[SUBJECT]" > "[WORKING_DIR]/filing.txt"
```

It reads the term dates and the teacher's drive: a daily subject goes to the
first free day after the week's filled ones, a weekly subject to this week's
subject folder. Take year and subject from the teacher's words; name an
inferred subject aloud. In that same message tell the teacher one plain line,
e.g. "Monday already has maths, so filing to Autumn 1 > Week 2 > Maths >
Tuesday. Tell me if you'd like it somewhere else." Don't wait; a day or week
they name wins: rewrite `filing.txt`. `OPENING_WEEK=yes`
means a short week before Week 1: ask which week. `DRIVE_CHECKED=no`: say
the day is unchecked. On any other error, plan
local-only delivery: filing never gates the lesson.

For direct fixed slides, worksheets and stick-in sheets, let
`run-fixed-resource.py` own output-family collision archiving. The retained wall
builder owns its wall-family archive.

---

## Phase 1 — Run the Lesson Designer (Sequential, Blocking)

Launch `lesson-designer` directly, using the launch fields printed by
`worker-launch.py spec` for this role. Do not read its settings out of the role
file yourself.

```text
You are the lesson designer. Read your agent instructions at:
[PLUGIN_ROOT]/agents/lesson-designer.md

PLUGIN_ROOT: [PLUGIN_ROOT]
PYTHON: [PYTHON]
WORKING_DIR: [WORKING_DIR]
OUTPUT_DIR: [OUTPUT_DIR]

AUTHORITATIVE_INPUTS:
TEACHER_BRIEF_FILE: [WORKING_DIR]/teacher-brief.txt
[TEACHER_CLARIFICATION_FILES when present]
[ORCHESTRATOR_CONTEXT_FILE when present]
[LESSON_PLAN_INPUT when supplied]
[TEACHER_WORKSHEET_INPUT when supplied]

OWNED_OUTPUTS:
- [WORKING_DIR]/design-decisions.md
- [WORKING_DIR]/lesson-design.json
- [WORKING_DIR]/photo-requirements.json
- [WORKING_DIR]/lesson-design-scaffold-request.initial.json

BUILD_SCAFFOLD_ONCE — run this before you fill anything, and never again:
"[PYTHON]" "[PLUGIN_ROOT]/scripts/lesson-design-scaffold.py" \
  --request "[WORKING_DIR]/lesson-design-scaffold-request.initial.json" \
  --lesson-design "[WORKING_DIR]/lesson-design.json" \
  --photo-requirements "[WORKING_DIR]/photo-requirements.json"
Require LESSON_DESIGN_SCAFFOLD_OK as the last line; the CHARACTER_NAMES line
above it holds the names for any child who speaks in this lesson.
This command writes the empty scaffold over both files. It is a builder, not a
check. Once any field is filled, running it again would discard the design.

SUCCESS_CHECK:
"[PYTHON]" "[PLUGIN_ROOT]/scripts/validate-lesson-design.py" \
  --initial-photo-namespace \
  "[WORKING_DIR]/lesson-design.json" \
  "[WORKING_DIR]/photo-requirements.json"
Require exactly: LESSON_DESIGN_OK

TERMINAL_STATE: COMPLETE
```

After return, require the four outputs and run the success check yourself. Do
not re-run the scaffold builder: it writes the empty scaffold and would discard
the finished design.

A designer that cannot reach `LESSON_DESIGN_OK` within its bounded repair
passes returns `LESSON_DESIGN_CHECK_FAILED` with the validator's failure lines.
Treat that, or a failed orchestrator success check, as one recoverable fault:
launch one fresh clean-context Lesson Designer attempt with the current saved
files and the exact validator failures. If that attempt also fails the
validator, nothing downstream can build from an invalid design: go to Phase 4,
report `BLOCKED` with the exact failures, and deliver `design-decisions.md`
and the diagnosis, so an unattended run ends with evidence the teacher can act
on rather than silence.

Then run:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/check-photo-cap.py" \
  "[WORKING_DIR]/photo-requirements.json"
```

If the picture cap exceeds 16, run one focused Lesson Designer revision against
the current three canonical design files. Preserve learning-critical picture
jobs, edit only the picture prioritisation and genuinely consequential content,
do not add `adaptation-photo-###`, and do not rewrite the initial scaffold
request. Re-run the design validator and photo-cap check. A design still over
its budget after that one revision cannot validate either: treat it as a failed
success check and use the same one fresh-attempt recovery, not further revision
passes.

16 is the **design** budget, not the run's ceiling. A stage after the design
that genuinely needs a picture the designer could not foresee - a helper's
`controlled-ai` visual, a repair, an adaptation - checks against the run
ceiling of 24 instead (`check-photo-cap.py --stage run`, which the photo
contract already passes). Do not send a real late need back to be cut to
protect a number that was only ever there to bound the initial design.

Carry every `flagsForTeacher` entry into the final report.

---

## Phase 1.25 — Review the Design (Sequential, Blocking)

Skip only when `design-reviewer` is absent. Otherwise prepare its compact view
directly:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/design-review-packet.py" prepare \
  --plugin-root "[PLUGIN_ROOT]" \
  --working-dir "[WORKING_DIR]" \
  --teacher-brief "[WORKING_DIR]/teacher-brief.txt" \
  [one --teacher-clarification per file] \
  [--orchestrator-context ...] \
  [--lesson-plan-input ...] \
  [--teacher-worksheet-input ...] \
  --preflight-output "[WORKING_DIR]/design-review-preflight.json" \
  --reference-output "[WORKING_DIR]/design-review-reference.md" \
  --view-output "[WORKING_DIR]/design-review-view.md"
```

Require `DESIGN_REVIEW_PREFLIGHT_OK`, then launch the reviewer directly:

```text
You are the design reviewer. Read your agent instructions at:
[PLUGIN_ROOT]/agents/design-reviewer.md

PLUGIN_ROOT: [PLUGIN_ROOT]
PYTHON: [PYTHON]
WORKING_DIR: [WORKING_DIR]
OUTPUT_DIR: [OUTPUT_DIR]

AUTHORITATIVE_INPUTS:
LESSON_DESIGN: [WORKING_DIR]/lesson-design.json
DESIGN_DECISIONS: [WORKING_DIR]/design-decisions.md
PHOTO_REQUIREMENTS: [WORKING_DIR]/photo-requirements.json
DESIGN_REVIEW_REFERENCE: [WORKING_DIR]/design-review-reference.md
DESIGN_REVIEW_VIEW: [WORKING_DIR]/design-review-view.md
TEACHER_BRIEF_FILE: [WORKING_DIR]/teacher-brief.txt
[the same optional teacher inputs supplied to Lesson Designer]

OWNED_OUTPUTS:
- [WORKING_DIR]/lesson-design.json
- [WORKING_DIR]/design-decisions.md
- [WORKING_DIR]/photo-requirements.json
- [WORKING_DIR]/design-review.md

SUCCESS_CHECK - run this yourself before returning, unless you corrected nothing:
"[PYTHON]" "[PLUGIN_ROOT]/scripts/validate-lesson-design.py" \
  --initial-photo-namespace \
  "[WORKING_DIR]/lesson-design.json" \
  "[WORKING_DIR]/photo-requirements.json"
Require exactly: LESSON_DESIGN_OK
The design handed to you already passed this check, so any failure is a
correction you wrote. Repair your own wording, or restore what you found and
decide the defect again. Do not return a design that fails it.

ORCHESTRATOR_CHECK_AFTER_RETURN:
Write the four owned outputs and return the exact Result value from
design-review.md. Do not run design-review-packet.py verify. The orchestrator owns that check.

ALLOWED_TERMINAL_STATES:
- APPROVED
- REDESIGN REQUIRED
```

After return, run `design-review-packet.py verify` with the prepared preflight,
reference, view and review, writing `design-review-postflight.json`. Require
`DESIGN_REVIEW_POSTFLIGHT_OK` and use its exact `reviewResult`.

If the packet helper is absent, or `prepare` fails deterministically after its
one infrastructure retry, run the same reviewer directly against the three
canonical design files, require `APPROVED` or `REDESIGN REQUIRED` in
`design-review.md`, and run `validate-lesson-design.py
--initial-photo-namespace` afterwards.

If `verify` fails after a completed review, do not discard or re-run the
review. Re-run the prepared `validator.command` yourself:
when it passes, continue on the exact `Result` in `design-review.md` and record
the packet failure in the run report.

For an owner repair after the verified Phase 2 freeze, prepare a fresh review
packet. Its validator checks live references without the initial-only rule
that every frozen picture must still be cited. Preserve exhausted pictures and
their receipts as history; never add a false use or restart their call budget.
In the direct-review fallback for this later phase, omit
`--initial-photo-namespace` and pass that exact command to the reviewer.

When it fails, the fault is in the review pass's own corrections, because the
design validated before the reviewer opened it. Send it back to the pass that
wrote it. Launch one focused clean-context `design-reviewer` job carrying the
current canonical files, the exact validator failure lines and the in-place
editing rule from Phase 3.5, and tell it to repair only the fields the validator
names, keep the meaning of its own correction, and leave the `Result` in
`design-review.md` as it stands. Then re-run `design-review-packet.py verify`.
Only when that repair also fails has the review pass genuinely corrupted the
design, and only then does the Phase 1 fresh-attempt recovery apply.

The reviewer owns this repair because it is the only party holding what the
corrected wording had to mean, and because a `lookFor` six words over its limit
is a minute's work for the pass that wrote it against a whole fresh design
attempt for a Lesson Designer that never saw the string. Record the round in the
run's friction file like any other repair.

For `APPROVED`, continue. For `REDESIGN REQUIRED`, give Lesson Designer the
current canonical files plus the complete diagnosis. Preserve named passing
content, edit the same paths, do not rewrite the initial scaffold request, and
re-run design validation, photo cap and independent review. Permit at most two
semantic redesign passes; infrastructure retries do not consume this semantic
budget.

If the review after the final permitted redesign still requires redesign, the
review loop ends there: two complete diagnoses have been spent, and a third
pass re-argues the same judgement at token cost instead of improving the
lesson. Continue the pipeline from the current canonical files, which still
pass deterministic validation, and carry the reviewer's unresolved findings
verbatim into the run report's blocking faults and the teacher flags. This
route can never end `COMPLETE`, and the teacher report must lead with the
unresolved findings: a run that builds the lesson and names the dispute gives
the teacher something to judge in the morning, where stopping delivers
nothing.

Append genuine corrections and remaining teacher choices to the shared build
review log when `PLUGIN_SOURCE_ROOT` is available. Read routing values directly
from the approved `lesson-design.json`, never from prose.

With the design approved, run
`"[PYTHON]" "[PLUGIN_ROOT]/scripts/worker-launch.py" audit --host codex` and read
the result. A design or review worker that ran below its declared setting is
worth redoing here, where one worker repeats; after Phase 2 the same fault costs
the whole package. Continue either way and carry the marker to the run report.

---

## Phase 1.5 — Helper Check (Before Spawning Any Renderer)

A renderer cannot supply a visual the engine has no helper for; it degrades
around the hole and nothing errors. So this is the only place the gap is
catchable, and the outcome must be written down: a decision nobody records is a
decision the run walks past.

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/check-helper-coverage.py" inventory   --lesson-design "[WORKING_DIR]/lesson-design.json"
```

Live keys come from the renderers themselves, so the list is what the engine
draws today, not what a catalogue claims.

**Ask whether the engine can draw this lesson's figure the way this lesson uses
it**, not whether a helper of roughly the right name exists. A translation
lesson's picture is two whole shapes on one numbered grid; `translation-grid`
draws one start-and-end marker and `coordinate-grid` joins one set of points, so
both exist and neither draws it. A helper that cannot draw the designed figure
leaves renderers the same nothing a missing one does, so treat them alike; open
the candidate's own file when its name does not settle it. **The bar is the
central teaching visual**, not a nicety a renderer can approximate without
pedagogical loss.

**A visual of a real place or object is decided differently.** A Venn is right
when it matches the lesson's data; a coastline is right only when it matches the
world, and a helper drawing one from chosen coordinates renders cleanly and
teaches a world that is not there. So ask which shipped asset or live helper
already holds the real thing - `map` carries eight real world and continent maps
and takes marks on top of them - and when one nearly does it, record `build`
naming that helper to be **grown**. A second helper for a place an existing one
already holds is how a package ends up with two maps of one continent that
disagree.

Record one decision per required use in `[WORKING_DIR]/helper-check.json` as
`{"schemaVersion": 1, "decisions": [...]}`, each carrying `representationId`,
`configuration`, `requiredSurface`, `decision` and the fields below:

- `covered` - a live helper draws the required figure and features on this
  surface, not merely a lookalike. Name its `helperKey`. Read
  `references/helper-route.md` → Capability and delivery contract before
  recording the required `featureChecks` and per-use binding.

- `build` - nothing draws it, or the closest helper cannot draw it as designed.
  Give `helperKey` and a `reason` naming what it cannot draw, then take the
  helper route. When a helper already holds the real source for this subject,
  the route is to grow that one, not to add a second helper beside it. The
  helper is built for a later lesson, so this visual still takes the picture
  route.
- `substitute` - no helper should draw it: a fixed depiction of one real thing
  this lesson alone needs. Give the `reason`, take the picture route, and name
  in `picture` the exact contract filename that route produced.
- `gap` - neither route can supply it. Give the `reason`. This is the recorded
  dead end, and it is the only decision that leaves a required visual with
  nothing behind it.

**"No published picture exists" is not yet a `gap`.** The shipped maps take
shaded regions, a key and latitude lines in real degrees, so a world rainforest
distribution is `covered` by the real map with the belts shaded on it. Write
`gap` only when the land, the source or the exact depiction is what is needed.

**`substitute` is a promise about the photo contract, not a note about
helpers.** It says the picture route supplies this visual, so it is finished
only when a filename for it reaches the contract, and `picture` is where that
filename goes. A reason claiming the contract already covers it is a different
claim and nothing can check it: a geography run wrote exactly that for two maps,
froze a contract holding neither, and the deck filled both holes with the
nearest live map helper - coastlines drawn from chosen coordinates, on a lesson
about where a real forest is. When the picture route cannot run, the honest
answer is `gap`, not a substitute whose picture nobody will source.

### The helper route

When any decision is `build`, read
`[PLUGIN_ROOT]/references/helper-route.md` and follow it: it launches
`helper-builder` to write the helper into `[WORKING_DIR]/pending-helper/` for a
person to install later, and closes the decision as `substitute`, because a
helper built here is live for nobody in this run. The check must print
`HELPER_COVERAGE_OK` before any Phase 2 designer, but nothing in Phase 2 waits
on the build itself: it changes no catalogue a designer reads. Read the route
only when a `build` decision exists.

### The picture route

Open here and closed after Phase 2, because the contract is not frozen yet and a
picture added now is sourced in the same wave as the rest. It reopens exactly
once more for a content gap a designer finds later: the content-gap picture
wave in Phase 3. Take it with one
focused Lesson Designer revision over the three canonical design files: add the
visual as a picture, its acquisition mode the designer's own rule, drop the
representation use that has no helper, change nothing else, and stay within the
run ceiling of 24 rather than the 16 design budget, because this picture is
exactly the late need that ceiling exists to allow. Re-run the design
validator, the photo-cap check and the helper check. A UK three-pin plug and socket is this route's shape: one real object, the
same every time, that no renderer should own.

Record the decision as `gap` only when neither route can run, and carry the
matching `SLIDE_HELPER_GAP` or `WORKSHEET_HELPER_GAP` into the run report. Do
not silently replace a missing visual with an unfaithful picture, an approximate
emoji or generic decoration.

### Close the check

Run this after both routes have finished, on every run:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/check-helper-coverage.py" verdict \
  --lesson-design "[WORKING_DIR]/lesson-design.json" \
  --verdict "[WORKING_DIR]/helper-check.json" \
  --photo-requirements "[WORKING_DIR]/photo-requirements.json"
```

Require `HELPER_COVERAGE_OK`, and carry any `HELPER_GAP:` line to the report.

Here is the last point at which a missing picture costs one design revision
rather than a lesson: afterwards the contract is frozen, the sourcing wave has
sailed, and a designer meeting the hole can only compose around it.

Run it whatever the decisions say. The command used to sit only in the helper
route, which is read only on a `build`, so the ordinary run - all `covered` and
`substitute` - never ran it, and the requirement stated here held nothing.

---

## Phase 2 — Spawn Parallel Rendering Branches

**After the slides and the worksheets build, confirm the promised visuals
arrived**, with `--spec` `lesson.json`/`--surface slides` and `worksheet.json`/
`--surface worksheets`:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/check-helper-coverage.py" delivery   --verdict "[WORKING_DIR]/helper-check.json"   --spec "[WORKING_DIR]/[spec].json" --surface [surface]
```

Require `HELPER_DELIVERY_OK`. A failure means a use recorded as drawn by a helper
is drawn by it nowhere in the specification: the silent substitution this check
exists to catch. Each designer now runs this same check at its own gate, so a
failure here is a designer that skipped it; repair through that surface's focused
designer repair, rebuild, re-check.

Freeze the approved initial photo contract once:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/photo-contract.py" freeze-initial \
  --canonical "[WORKING_DIR]/photo-requirements.json" \
  --snapshot "[WORKING_DIR]/phase2-initial-photo-requirements.json" \
  --receipt "[WORKING_DIR]/phase2-initial-photo-requirements.receipt.json"
```

The freeze receipt is the phase boundary.

### Resolve the picture stage before launching any designer

Compilation reads only the frozen contract, is deterministic, and finishes in
seconds. A designer that reads a photo contract spends far more than that. So
settle whether the promised photographs will be attempted at all before those
workers start, and hand every one of them the answer.

If the frozen contract's `photos` array is empty, the state is
`PICTURE_STAGE: none required` and there is nothing to compile.

Compile assignments directly:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/compile-picture-assignments.py" compile \
  --requirements "[WORKING_DIR]/phase2-initial-photo-requirements.json" \
  --expected-prefix p \
  --output-dir "[WORKING_DIR]/picture-assignments/p" \
  --working-dir "[WORKING_DIR]" \
  --summary-output "[WORKING_DIR]/picture-assignments/p-summary.json"
```

Require `PICTURE_ASSIGNMENTS_OK`, then validate the emitted `manifest.json` with
`validate-image-scout.py manifest` and require `PICTURE_MANIFEST_OK`. Together
these two markers give the state `PICTURE_STAGE: attempting [N] pictures`, where
`[N]` is the marker's **pictures** count, never its assignments count: pictures
that must look alike pack into one assignment, so the two differ.

If either command fails, no photograph in the contract will arrive. That is a
degradation, not a stop: the state becomes `PICTURE_STAGE: unavailable - [the
exact failing marker and message]`, the picture stage is skipped for this run,
and every other branch proceeds. Give it the one infrastructure retry only when
the command never ran; a command that ran and rejected the contract has given a
result, and repeating it wastes the run.

Put the resolved `PICTURE_STAGE:` line, verbatim, into the prompt of every
worker whose authoritative inputs name a photo contract - Slide Designer,
Worksheet Designer, Working Wall Designer and the stick-in designer. Knowing the
state at launch is what lets each one design the right resource on its first
pass instead of composing around a picture that never comes and being redesigned
afterwards. An unavailable picture stage never excuses a missing specification:
each designer still writes and validates its owned file.

Carry the same line into the run report's picture results.

### Launch the branches

Launch independent first-pass designers concurrently when host slots permit:
Slide Designer and worksheet adaptation/routing work. Working Wall and stick-in
design wait for `lesson.json` only when their prompts require it. Each worker
owns only its named canonical specification.

**The tracks below are reference for whichever branch has landed, not a running
order.** Each is written end to end because its own steps are ordered; reading
one to its end while a sibling's finished work waits serialises branches you
opened in parallel. When any worker returns, run its check and release its
dependants before going back to what you were reading.

Releasing is normally seconds of deterministic work - finalise the returned
picture batch, build adaptation's provisional contract, launch the next
designer - and each one frees a whole branch. A geography run left five sourced
photographs unpublished for fourteen minutes and adaptation's contract unbuilt
for twelve, then ran both in seconds once an unrelated Slide Designer returned.
The worksheet branch waits on that contract and finished last, so the package
landed twelve minutes late on a fifty-seven minute run.

Run printable Chrome preflight once before worksheet, wall or stick-in builds:
`node "[PLUGIN_ROOT]/worksheet-html/scripts/ensure-chrome.js"`. Its last line
decides the state: `CHROME: <path>` is `ready`, `ENSURE_CHROME_FAILED:` is
`unavailable`, nothing else counts - a Chrome binary alone is not `ready`
while the PDF packages are missing, and a guessed `ready` buys a failed
build. Pass the state to fixed builders; do not repeat browser recovery per
resource.

Direct fixed builds write summaries under `[WORKING_DIR]/build-results/`.
Require schema version 1, `ok: true`, the builder's success marker and every
reported output path. A content/build diagnostic goes to the owning designer's
single focused repair, then the command runs once more. A host/tool outage gets
one infrastructure retry. Preserve successful sibling resources.

---

### Track A — Slides (slide-designer + the picture stage → fixed slide build)

Launch Slide Designer directly:

```text
You are the slide designer. Read your agent instructions at:
[PLUGIN_ROOT]/agents/slide-designer.md

PLUGIN_ROOT: [PLUGIN_ROOT]
PYTHON: [PYTHON]
WORKING_DIR: [WORKING_DIR]
OUTPUT_DIR: [OUTPUT_DIR]

AUTHORITATIVE_INPUTS:
LESSON_DESIGN: [WORKING_DIR]/lesson-design.json
HELPER_CHECK: [WORKING_DIR]/helper-check.json
PHOTO_REQUIREMENTS_PATH: [WORKING_DIR]/phase2-initial-photo-requirements.json
PICTURE_STAGE: [the resolved Phase 2 state line, verbatim]

OWNED_OUTPUTS:
- [WORKING_DIR]/lesson.json
- [WORKING_DIR]/slide-room.json

This worker creates JSON only. Do not load or use the global `Presentations`
skill. The fixed slide builder creates the PowerPoint after this worker
completes.

SUCCESS_CHECK:
node "[PLUGIN_ROOT]/builder/scripts/check-slide-design.js" \
  "[WORKING_DIR]/lesson.json"

Require: Slide design check: SLIDE_DESIGN_CHECK_OK: [N] slides

"[PYTHON]" "[PLUGIN_ROOT]/scripts/check-helper-coverage.py" delivery \
  --verdict "[WORKING_DIR]/helper-check.json" \
  --spec "[WORKING_DIR]/lesson.json" --surface slides

Require: HELPER_DELIVERY_OK

"[PYTHON]" "[PLUGIN_ROOT]/scripts/check-drawlive-handoff.py" \
  --lesson-design "[WORKING_DIR]/lesson-design.json" \
  --spec "[WORKING_DIR]/lesson.json"

Require: DRAWLIVE_HANDOFF_OK
TERMINAL_STATE: COMPLETE
```

Wait for both files and require both markers. `slide-room.json` is absent
only when this machine had no render route; treat that as a quieter run, not a
fault. It is not a licence to skip the measurement: the Slide Decorator renders
the deck again for its own pass, so where this file is missing it measures those
pages itself before answering whether any slide has room. Preserve every `BUILD_DIAGNOSTIC:` line for a focused Slide Designer
repair.

**The moment `lesson.json` passes, three workers start together:** the Slide
Decorator below, the Working Wall Designer (Track D) and the stick-in route
(Track E). The wall and stick-in designers copy text and figures that are
settled now, before any drawing is placed, so holding them for the decoration
pass held them for nothing they use.

**The decoration pass.** Launch the Slide Decorator directly:

```text
You are the slide decorator. Read your agent instructions at:
[PLUGIN_ROOT]/agents/slide-decorator.md

PLUGIN_ROOT: [PLUGIN_ROOT]
PYTHON: [PYTHON]
WORKING_DIR: [WORKING_DIR]
OUTPUT_DIR: [OUTPUT_DIR]

AUTHORITATIVE_INPUTS:
LESSON_JSON: [WORKING_DIR]/lesson.json
SLIDE_ROOM: [WORKING_DIR]/slide-room.json  (absent when nothing could render)
PHOTO_REQUIREMENTS_PATH: [WORKING_DIR]/phase2-initial-photo-requirements.json
PICTURE_STAGE: [the resolved Phase 2 state line, verbatim]

OWNED_OUTPUTS:
- [WORKING_DIR]/lesson.json  (picture and decoration fields only)
- [WORKING_DIR]/optional-picture-pass.json

This worker creates JSON only. Do not load or use the global `Presentations`
skill. Composition is closed: change nothing but picture and decoration fields.

SUCCESS_CHECK:
node "[PLUGIN_ROOT]/builder/scripts/check-slide-design.js" \
  "[WORKING_DIR]/lesson.json"

Require: SLIDE_DESIGN_CHECK_OK: [N] slides

"[PYTHON]" "[PLUGIN_ROOT]/scripts/check-optional-pictures.py" \
  --pass-record "[WORKING_DIR]/optional-picture-pass.json" \
  --lesson "[WORKING_DIR]/lesson.json" \
  --room "[WORKING_DIR]/slide-room.json" \
  --library-root "[EDUCATIONAL_SVG_ROOT]"

[EDUCATIONAL_SVG_ROOT] is the root your own resolver prints during the
pass; drop the flag when it printed EDUCATIONAL_SVG_UNAVAILABLE. The check
re-resolves for itself either way. Drop --room only when no measurement
exists.

Require: OPTIONAL_PICTURE_PASS_OK
TERMINAL_STATE: Slide decoration check: SLIDE_DECORATION_OK: [N] slides
```

After return, require the record and the marker, and run the slide-design
check yourself. Run the optional-picture check yourself too, with no
`--library-root` and with `--room "[WORKING_DIR]/slide-room.json"` when that
file exists. It runs the Educational SVG resolver itself, so the library is
"unavailable" only when the resolver says so, never because this launch had
no root value to pass, and it settles `full` and `competes` against the
rendered pages rather than against the record's own word. Between them those
are what separate a pass weighed slide by slide from one thought about the
whole deck, so the decorator cannot close on its own word for either. Carry
its `OPTIONAL_PICTURE_LIBRARY`, `OPTIONAL_PICTURE_ROOM`,
`OPTIONAL_PICTURE_SHAPE` and `OPTIONAL_PICTURE_TOTALS` lines into the run
report.

**A decorator that fails, stalls or never returns degrades, never blocks.**
The layer carries no teaching. After its one infrastructure retry, build the
settled `lesson.json` the designer promoted, exactly as it stands, write one
`FRICTION:` line naming what the decorator returned, and put
`SLIDE_DECORATION_OMITTED: [reason]` under the run report's accepted minor
issues in place of the optional-picture lines. Do not spend a focused repair
on it and do not hold the slide build for a second attempt.

---

**The picture stage** - only when Phase 2 resolved `PICTURE_STAGE: attempting`:

The assignments and their validated `manifest.json` already exist: Phase 2
compiled and checked them before any designer launched. Do not compile again.

Launch one unified `image-scout` per assignment in the manifest, up to four at
once and no more than two direct-AI batches at once. Use role `image-scout`, the launch fields printed by
`worker-launch.py spec --role image-scout`, the exact assignment path, its
assignment `work_root`, and one unique result path:

```text
[WORKING_DIR]/picture-results/[batch-id]/result.json
```

The worker may write only its work root, authorised AI ledger paths and result.
After return, run `validate-image-scout.py result` against the exact assignment,
result, work root and batch ID. Require `PICTURE_RESULT_OK`.

Finalise each valid batch immediately with
`finalize-picture-assignment.py assignment --replace no`. The finaliser
independently validates the whole result before publishing, derives source or AI
provenance, and writes one terminal receipt per filename under
`[WORKING_DIR]/orchestration-receipts/picture-terminal/`. This retained folder
contains picture evidence only. A failed batch gets one fresh infrastructure
retry only when the worker did not produce a completed semantic result.

For a known-wrong published picture, remove only that canonical file, build one
focused repair slice from its assignment, finding file and prior terminal
receipt, launch one fresh image scout, and finalise with `--replace yes`. Never
reopen a passing sibling.

Picture provenance is completed at the deterministic finalisation, not here.

---

**`unsatisfied` and `omitted` are terminal, and terminal means never coming.**
That filename's ledger is spent, so the one-filename repair above has nothing
left to run for it, and any specification still naming it loses its whole build.
Each track reconciles its own specification against these receipts before
building.

---

**Track A trigger:**

Wait until Slide Designer, the Slide Decorator (or its degrade) and all
picture filenames referenced by `lesson.json` are terminal. When the resolved state is `PICTURE_STAGE: unavailable` or
`none required`, no terminal receipt is coming and there is nothing to wait
for: build the slides from the specification the designer already wrote.

Reconcile first: for any picture filename `lesson.json` names whose terminal
receipt reads `unsatisfied` or `omitted`, run one focused Slide Designer repair
before the build, telling it the filename is terminally unavailable and that
re-pointing that one reference is the repair, not a scope breach.

If the lesson uses a labelled diagram over a photo, launch Diagram Anchor
against the final published image and update only anchor coordinates.

Build slides directly:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/run-fixed-resource.py" slides \
  --plugin-root "[PLUGIN_ROOT]" \
  --working-dir "[WORKING_DIR]" \
  --output-dir "[OUTPUT_DIR]" \
  --lesson-name "[TOPIC]" \
  --summary-output "[WORKING_DIR]/build-results/slides.json"
```

Require `ok: true` and the exact output paths in the summary. On a semantic
build diagnostic, run one focused Slide Designer repair and rebuild once.

The finished deck receives the final resource review in Phase 3.6, after its
pictures arrive. Physical picture-size checks do not establish that an object
is recognisable, its detail serves the question, or references remain available
through a slide transition. The review uses the compact review-mode reference
and the saved outputs, without restarting the full creation workflow.

The Slide Decorator remains the earlier optional-picture stage. It runs the optional drawing pass the
Slide Designer used to run last, at the same point and over the same private
preview, in a worker of its own so the wall and stick-in branches need not
wait for it. It looks at nothing after the build and judges no photograph.

---

### Track B — Worksheets (adaptation-designer → merge gate → worksheet-designer → fixed worksheet build)

Read `worksheet.resourceMode` from approved `lesson-design.json`.

- `shared-frame`: skip Adaptation Designer;
- teacher-provided expected worksheet: consider adaptation but do not generate a
  second expected sheet;
- other per-child generated worksheet: run Adaptation Designer when available.

Never infer this route from old Markdown status text.

---

**Adaptation Designer** — if `adaptation-designer` exists AND the worksheet is a per-child sheet (not a shared frame, per the check just above):

Launch directly with approved lesson design, teacher worksheet when supplied,
teacher brief/clarifications, and the frozen initial photo contract. It owns
`adaptation.md` and, through it, a provisional adaptation photo contract.

`adaptation.md` is the only adaptation file, and its `Photos for the sheets`
block is the only place adaptation pictures are written. Every command below
reads that path. There is no `adaptation.json`.

Run `photo-contract.py build-provisional`. Use exactly:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/photo-contract.py" build-provisional \
  --initial "[WORKING_DIR]/phase2-initial-photo-requirements.json" \
  --adaptation "[WORKING_DIR]/adaptation.md" \
  --output "[WORKING_DIR]/adaptation-photo-provisional.json" \
  --lesson-design "[WORKING_DIR]/lesson-design.json" \
  --requirements-snapshot "[WORKING_DIR]/photo-requirements-a-[N].json" \
  --receipt "[WORKING_DIR]/orchestration-receipts/adaptation-photo-provisional.json"
```

Number the snapshot from 1 like the `w` waves; an adaptation run again after a
redesign takes the next number, because the snapshot is immutable and the
command refuses to overwrite one with different bytes.

Adaptation may add only `adaptation-photo-###` entries; it may not mutate the
frozen initial entries.

With `--lesson-design` supplied this runs the photo cap and the lesson-design
validator itself and fails if either does. **Do not run the validator again by
hand.** `--initial-photo-namespace` belongs to the Phase 1 contract alone, and on
a contract carrying adaptation photos it rejects valid ids and stalls the
worksheet behind a needless diagnosis.

`PHOTO_CONTRACT_PROVISIONAL_OK 0` means this adaptation asked for no pictures.
The command refuses a file that is not the adaptation document, so a zero can no
longer be a wiring mistake wearing the face of a lesson that needed none.

If adaptation fails deterministically, preserve the expected worksheet route and
report adaptation omitted. Do not rerun unrelated branches.

**The early adaptation picture wave** - whenever `PHOTO_CONTRACT_PROVISIONAL_OK`
reports one or more, and the Phase 2 picture stage is `attempting`:

Launch the Worksheet Designer first, then start this wave beside it. The
adaptation has just named every picture its sheets could want, and the sheet
that decides which of them it keeps takes ten minutes or more to design. Waiting
for that answer before searching put a four to nine minute picture search on
the end of the worksheet chain, where it was the last thing the run did; sourcing
now, in parallel, takes it off the end. The price is a picture the sheet then
drops: fetched, kept as evidence, never used. That cost is reported, never hidden.

Compile from the immutable snapshot build-provisional just wrote, naming only
the adaptation filenames from its receipt (`adaptationFilenames`), so the
frozen initial pictures Phase 2 already finished are not reopened:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/compile-picture-assignments.py" compile \
  --requirements "[WORKING_DIR]/photo-requirements-a-[N].json" \
  --expected-prefix a \
  [one --expected-filename per adaptationFilenames entry in the provisional receipt] \
  --output-dir "[WORKING_DIR]/picture-assignments/a-[N]" \
  --working-dir "[WORKING_DIR]" \
  --summary-output "[WORKING_DIR]/picture-assignments/a-[N]-summary.json"
```

Require `PICTURE_ASSIGNMENTS_OK`, validate the manifest with the same filename
list and `--expected-prefix a`, require `PICTURE_MANIFEST_OK`, then run the
Phase 2 picture stage unchanged over this manifest: one `image-scout` per
assignment under the same limits (four at once, no more than two direct-AI
batches), `PICTURE_RESULT_OK` on each result, and `finalize-picture-assignment.py
assignment --replace no` on each valid batch as it returns. Its terminal
receipts join the same provenance run at the merge, where an early picture the
sheet did not take is accounted for and its published file removed.

A compile or manifest failure degrades this wave only: the pictures wait for the
supplemental wave below, which then sources whatever the sheet promotes, exactly
as before this wave existed.

---

**Worksheet Designer** — launch whenever the role exists, reading
`worksheet.status` in the approved design rather than judging the need:

- `generated`: design the sheet, per-child or shared frame alike;
- `provided-by-teacher`: the teacher's sheet stands, so design only the Below
  and Greater Depth sheets accepted adaptation asked for. Only an adaptation
  that produced none ends this track.

The schema offers no third state, so asking whether the lesson "needs" a
worksheet invites a no it never offered.

**Launch the Worksheet Designer the moment adaptation's provisional contract is
built (or adaptation is skipped); never hold it for picture work.** The
dependency runs the other way: `promote-used` reads `worksheet.json` to settle
which pictures the sheet keeps, so a sheet parked behind picture work is a
sheet nothing can finish.

Before every attempt, obtain the exact worksheet photo-contract path through
`photo-contract.py select-worksheet`. Launch Worksheet Designer directly:

```text
You are the worksheet designer. Read your agent instructions at:
[PLUGIN_ROOT]/agents/worksheet-designer.md

PLUGIN_ROOT: [PLUGIN_ROOT]
PYTHON: [PYTHON]
WORKING_DIR: [WORKING_DIR]
OUTPUT_DIR: [OUTPUT_DIR]

AUTHORITATIVE_INPUTS:
LESSON_DESIGN: [WORKING_DIR]/lesson-design.json
HELPER_CHECK: [WORKING_DIR]/helper-check.json
PHOTO_REQUIREMENTS_PATH: [selected contract path]
PICTURE_STAGE: [the resolved Phase 2 state line, verbatim]
[ADAPTATION_DESIGN when accepted]
[TEACHER_WORKSHEET_INPUT when supplied]

OWNED_OUTPUTS:
- [WORKING_DIR]/worksheet.json

SUCCESS_CHECK:
Run the worksheet specification validator and the helper-delivery check
named by your role. Require WORKSHEET_PREFLIGHT_OK and HELPER_DELIVERY_OK.
TERMINAL_STATE: COMPLETE
```

After the spec passes, promote only adaptation photos actually referenced by the
accepted worksheet through `photo-contract.py promote-used`.

Number each wave from 1, and keep the receipt name and the snapshot name on the
same number, because the next `select-worksheet` reads the highest-numbered
receipt and the immutable snapshot that receipt names:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/photo-contract.py" promote-used \
  --initial "[WORKING_DIR]/phase2-initial-photo-requirements.json" \
  --provisional "[WORKING_DIR]/adaptation-photo-provisional.json" \
  --adaptation "[WORKING_DIR]/adaptation.md" \
  --worksheet "[WORKING_DIR]/worksheet.json" \
  --canonical "[WORKING_DIR]/photo-requirements.json" \
  --lesson-design "[WORKING_DIR]/lesson-design.json" \
  --requirements-snapshot "[WORKING_DIR]/photo-requirements-w-[N].json" \
  --receipt "[WORKING_DIR]/orchestration-receipts/photo-requirements-w-[N].json"
```

Require `PHOTO_CONTRACT_PROMOTED`.

---

**The supplemental picture wave** - whenever `PHOTO_CONTRACT_PENDING_PICTURES`
reports one or more, and the Phase 2 picture stage is not `unavailable`:

The promotion receipt's `pendingFilenames` are the promoted pictures with no
terminal receipt yet. The early wave normally finishes every picture the sheet
keeps, so the list is usually empty; it holds only what that wave could not
attempt or never saw.

Compile from the immutable snapshot the promotion just wrote, never from
canonical `photo-requirements.json`, which a later wave rewrites, and name each
pending filename so no finished picture is reopened:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/compile-picture-assignments.py" compile \
  --requirements "[WORKING_DIR]/photo-requirements-w-[N].json" \
  --expected-prefix w \
  [one --expected-filename per pendingFilenames entry in the promotion receipt] \
  --output-dir "[WORKING_DIR]/picture-assignments/w-[N]" \
  --working-dir "[WORKING_DIR]" \
  --summary-output "[WORKING_DIR]/picture-assignments/w-[N]-summary.json"
```

Require `PICTURE_ASSIGNMENTS_OK`, then validate the manifest with the **same
filename list**. The snapshot also holds every picture Phase 2 finished, so
validating without the list rejects a correct manifest and loses the sheet:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/validate-image-scout.py" manifest \
  --requirements "[WORKING_DIR]/photo-requirements-w-[N].json" \
  --manifest "[WORKING_DIR]/picture-assignments/w-[N]/manifest.json" \
  --working-dir "[WORKING_DIR]" \
  --expected-prefix w \
  [the same --expected-filename lines the compile used]
```

Require `PICTURE_MANIFEST_OK`, then run the Phase 2 picture stage again,
unchanged, over this manifest: one `image-scout` per assignment,
`PICTURE_RESULT_OK` on each result, and `finalize-picture-assignment.py
assignment --replace no` on each valid batch. Its terminal receipts join the
same provenance run at the merge.

A compile or manifest failure degrades this wave as Phase 2 degrades: the
pictures are not attempted, each is named in the report as promised and
unpublished, and the branch continues to a built sheet.

**Track B trigger:** wait until every picture filename referenced by
`worksheet.json` is terminal before building. Under `PICTURE_STAGE: unavailable`
or `none required`, or a promotion that reported zero, nothing is coming.

**Terminal includes `unsatisfied` and `omitted`, and those never arrive.**
Reconcile before building: for each such filename `worksheet.json` names, run
one focused Worksheet Designer repair, telling it the filename is terminally
unavailable and that re-authoring that one question against what exists is the
repair, not a scope breach. The sheets are one document, so one unreconciled
reference loses all three and the answer key.

**If `worksheet.json` holds a labelled diagram over a photo, launch Diagram
Anchor against it before building**, passing the worksheet spec as the file to
anchor. The dots are percentages the designer wrote before the
picture existed, so unanchored they sit wherever they were guessed - and a
worksheet's dots are what a child draws their line to, so a sheet built without
this pass can print "label the parts" over a photograph carrying nothing to
label.

The build refuses an unanchored set (`EMPTY_SET`), but that costs the whole
sheet set: run the pass.

---

Build worksheets directly:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/run-fixed-resource.py" worksheets \
  --plugin-root "[PLUGIN_ROOT]" \
  --working-dir "[WORKING_DIR]" \
  --output-dir "[OUTPUT_DIR]" \
  --lesson-name "[TOPIC]" \
  --chrome-state "[ready|unavailable]" \
  --summary-output "[WORKING_DIR]/build-results/worksheets.json"
```

Require the complete answer key as a separate teacher output. One semantic
diagnostic permits one focused Worksheet Designer repair and one rebuild.


---

### Track C — Scaffold (scaffold-designer → scaffold-builder, runs in parallel with Track A and Track B)

This branch remains unavailable while its agents are marked Planned. Do not
invent it. Mention the omission only when the approved design requested one.

### Track D — Working Wall (working-wall-designer → fixed wall build, runs after slide-designer; in parallel with Tracks B and the rest of A)

Launch Working Wall Designer on every run, the moment the Slide Designer's
`lesson.json` passes its checks (beside the Slide Decorator, never after it),
after preparing its packet:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/working-wall-packet.py" prepare   --plugin-root "[PLUGIN_ROOT]" --working-dir "[WORKING_DIR]"   --lesson-design "[WORKING_DIR]/lesson-design.json"   --lesson "[WORKING_DIR]/lesson.json"   --photo-requirements "[applicable photo contract]"   --view-output "[WORKING_DIR]/working-wall-view.md"   --reference-output "[WORKING_DIR]/working-wall-reference.md"   --receipt-output "[WORKING_DIR]/working-wall-packet.receipt.json"
```

Require `WORKING_WALL_PACKET_OK`. The view holds every string and figure a
card can carry, byte for byte; the reference holds the rules and only the
card contracts this lesson triggers. That is what replaced two complete
reference files and a hunt through the lesson. Name the two packet files as
authoritative inputs beside `lesson-design.json`, `lesson.json` and the
photo contract. If prepare fails after its one infrastructure retry, launch
the designer on the full files anyway and write one `FRICTION:` line: a
missing packet costs reading, never the wall.

Wall-worthiness is the designer's judgement, never decided here: the
design's `workingWall` entry in `resourceOpportunities` is evidence being
gathered for a later gate and never skips this launch, and a designer that
finds nothing wall-worthy writes `cards: []` with its rationale for the run
report. It owns only `working-wall.json`. Its deterministic check is:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/working-wall-packet.py" check \n  --plugin-root "[PLUGIN_ROOT]" \n  --working-dir "[WORKING_DIR]" \n  --working-wall "[WORKING_DIR]/working-wall.json" \n  --lesson "[WORKING_DIR]/lesson.json"
```

Require exactly `WORKING_WALL_DESIGN_OK`. An exact reference table retained from
the slides is itself a recognised visual reference. Otherwise it refuses a wall whose cards carry
no picture while this lesson holds a published photograph or a drawn visual
its slides used, because a card that is only words is slide content rather
than wall furniture; a lesson with no picture at all still passes. Then
build the wall directly, only when `cards` is non-empty:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/run-fixed-resource.py" wall   --plugin-root "[PLUGIN_ROOT]"   --working-dir "[WORKING_DIR]"   --output-dir "[OUTPUT_DIR]"   --lesson-name "[TOPIC]"   --chrome-state "[ready|unavailable]"   --summary-output "[WORKING_DIR]/build-results/wall.json"
```

Same command as the slides, worksheets and stick-ins; no builder agent. The
build script refuses a wall whose printed sheets do not match the pages its
cards laid out, and `working-wall-designer` judges the finished sheet at FINAL
RESOURCE REVIEW.

One wall diagnostic permits one focused wall-owner repair and rebuild. Preserve
the exact output path from the build result.

### Track E — Stick-in Spec (stick-in-sheets-designer, runs after slide-designer; in parallel with Tracks B, D and the rest of A)

Start this track when the Slide Designer's `lesson.json` passes its checks,
beside the Slide Decorator and Track D. Read the approved design's own
decision first:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/resource-opportunities.py" stick-in \
  --lesson-design "[WORKING_DIR]/lesson-design.json"
```

On `STICK_IN_LAUNCH`, launch the stick-in designer directly with approved
`lesson-design.json`, `lesson.json` and applicable picture contract. The
write-on test is the designer's judgement, never decided here; a lesson with
no write-on moment gets an empty `items` list with a short rationale. It owns
only `stick-in-sheets.json`. Its check is `check-json.py` over that file:
no stick-in-specific validator exists, and "require its role validator"
named one that does not, so two runs improvised a check apiece. The build
in Track F is what refuses a spec the engine cannot draw.

On `STICK_IN_SKIP: [reason]`, the reviewed lesson recorded that no moment
earns a piece and the validator found no unit contradicting it, so no worker
is launched and Track F ends. Carry the reason verbatim into the run report
under Excluded resources as `- stick-in sheets: NOT DELIVERED - not needed:
[reason]`, and tell the teacher in one line. The command answers `LAUNCH`
for a `candidate`, an `uncertain`, a design without the field, or a `none`
the lesson's own moments contradict; the orchestrator never judges the
question itself.

### Track F — Stick-in Sheets (fixed build, runs after stick-in-sheets-designer)

Run this build only when `stick-in-sheets.json` has a non-empty `items` list;
an empty list ends the track.

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/run-fixed-resource.py" stick-in \
  --plugin-root "[PLUGIN_ROOT]" \
  --working-dir "[WORKING_DIR]" \
  --output-dir "[OUTPUT_DIR]" \
  --lesson-name "[TOPIC]" \
  --chrome-state "[ready|unavailable]" \
  --summary-output "[WORKING_DIR]/build-results/stick-in.json"
```

Require `ok: true` and its exact output paths. One semantic diagnostic permits
one focused stick-in designer repair and one rebuild.

---

## Phase 3 — Service Each Branch as It Lands

Wait through the host's ordinary multi-worker wait once for all active branches.
Do not poll each worker serially. Service whichever branch has landed, as Phase
2 sets out, and release only its genuine dependants. A failed branch does not
invalidate a clean independent branch.

**A branch that has built its resource, passed its check and resolved any
reported material content gap is finished.** Read the returned adaptation and
resource notes as well as the terminal marker. Missing support or a wrong
answer remains a content gap when recorded in notes; a note naming another
owner does not resolve it. Send that bounded decision to its existing owner,
validate and re-review the changed pedagogy, then resume only the affected
resource. Use the picture wave below only if the repair actually needs a new
picture. Preserve optional teacher choices and harmless observations as notes;
an unresolved material gap remains a blocking fault in the final report.
Nothing waits on an unrelated sibling: Track A's build lands while the
worksheet branch is still designing, and no stage after this one compares one
resource against another. Only the deterministic
finalisation waits for every branch.

**The content-gap picture wave.** `SLIDE_CONTENT_GAP` or
`WORKSHEET_CONTENT_GAP` does not end the resource. The picture ladder (real
search up through Unsplash, Wikimedia, Openverse and the open web, then
authorised controlled generation with its visual checks) is a rescue route, not
only a service for pictures the
design promised up front; a teacher finding a blocked lesson in the morning is
the worse outcome. The signal is the trigger, not the cause: a helper that
cannot draw a load-bearing visual takes the wave, and so does a load-bearing
picture the design promised that came back terminally `unsatisfied` - an
authorised photograph that never arrived is the same hole as a visual nobody
requested.

Run one focused Lesson Designer revision over the three canonical design files.
Its brief is to find another sound route to the same learning, not the smallest
deletion that makes the fault go away: another real source of the same kind
from a different holding, the same evidence as an adapted extract the designer
writes, a printed copy, or a redesigned beat that teaches the same thing from
what did arrive. Add or respecify the visual as a picture requirement,
real-first with an authorised fallback (a real place's geography publishes only
after its visual check confirms it), point the affected representation use at
that filename, keep the picture cap. A replacement for a spent filename takes a
new id and filename, and pitches the evidence at the level the teaching needs,
which is the designer's own rule. Every beat that leaned on the lost source is
re-judged, not trimmed around: a timeline that held three sources across two
periods is orientation once it holds two dates from one period, and an
ordering task whose only remaining items are printed in date order has no job
left. Only where even the open-web rung could not reach the one source the
lesson is genuinely about does the dependent task go, and then
`flagsForTeacher` says so; authenticity does not bend to fill the hole.

Re-run the design validator and photo-cap check, then run Phase 1.25 again over
the revised files: a revision that removes a source, rewrites the model beat
and re-points the Do beats is a new lesson, and the one this pipeline delivered
without a second review was the one the teacher refused to teach. The review
costs three minutes; a redesign it returns follows the Phase 1.25 rules.
Then snapshot the revision as the next wave number, run the supplemental-wave
mechanics over that snapshot, naming already-terminal filenames so nothing
finished reopens, and relaunch the blocked designer on the published picture. One wave per run; a gap that
survives it excludes as before, the pending helper still built for
`/install-helper`.

Re-record that use in `helper-check.json` as the wave leaves it: `substitute`
naming the published filename in `picture`, or `gap` with its reason. The
delivery check reads that file, so a use still recorded as drawn by a helper the
specification no longer uses fails a resource the wave repaired correctly.

Once the last branch settles, every earned resource must be either built with an
accepted summary or excluded with a reason. A resource that is neither by that
point is excluded now, with its exact failing marker as the reason: exclusion
is the honest record of a branch that ended, not a fault to repair here.

---

## Phase 3.5 — The Focused Owner-Repair Round

This is the one repair route the pipeline has, and every track above sends the
faults into it: a semantic build diagnostic, a picture reference the receipts
say will never be honoured, a helper-delivery failure, or a material finding
from the final resource review. Each identifies the resource, location and owner.

Use the compact focused-repair role for the named owner when present, otherwise
its full creation role. Give it the exact artefact/location, the required
change, the protected passing content and the existing build diagnostic.

- `slide-designer`: use `[PLUGIN_ROOT]/agents/slide-designer-focused-repair.md`;
  if that file is missing or unreadable, use `[PLUGIN_ROOT]/agents/slide-designer.md`.
- `worksheet-designer`: use `[PLUGIN_ROOT]/agents/worksheet-designer-focused-repair.md`;
  if that file is missing or unreadable, use `[PLUGIN_ROOT]/agents/worksheet-designer.md`.
- `working-wall-designer`: use `[PLUGIN_ROOT]/agents/working-wall-designer-focused-repair.md`;
  if that file is missing or unreadable, use `[PLUGIN_ROOT]/agents/working-wall-designer.md`.
- `stick-in-sheets-designer`: use `[PLUGIN_ROOT]/agents/stick-in-sheets-designer-focused-repair.md`;
  if that file is missing or unreadable, use `[PLUGIN_ROOT]/agents/stick-in-sheets-designer.md`.

Launch the selected role directly.

Add this line to every repair prompt, whichever owner it goes to:

```text
Edit the named file in place: change the values this repair names and leave
every other byte as it is. Do not delete and recreate it, and do not re-emit the
whole file to alter part of it. See [PLUGIN_ROOT]/references/revising-in-place.md.
```

`Already passed - leave unchanged` protects passing content from being redesigned
while the owner repairs the named fault.

Return these exact repair-impact fields with the normal terminal marker:

```text
Changed: [exact changed content]
Unchanged: [exact protected content]
Potential cross-resource impact: [specific relationships or None]
Repair scope: REPAIR_SCOPE_OK
```

Rebuild only that resource and rerun its deterministic check: that rerun is the
repair's confirmation, and a repair whose rebuild still fails has not worked.
There is no second round for the same fault. Record the round in the run's
friction file, whatever its result.

A repair that declares a real cross-resource impact has changed something
another resource mirrors. Supply both affected resources to the final review
and recheck that relationship after rebuilding. Carry any unresolved impact
into the run report as a teacher flag.

For a picture that published and is wrong, use the one-filename repair slice and
the prior picture receipt, finalise with `--replace yes`, then rebuild only the
resources naming that filename. A picture that never published at all is the
different fault the tracks reconcile before they build, where the resource owner
re-points that one reference and keeps the learning it was serving.

**When re-pointing cannot keep the learning, the owner is the wrong repairer.**
A repair returning `SLIDE_CONTENT_GAP` or `WORKSHEET_CONTENT_GAP` because the
missing picture *was* the task's evidence has named the one fault only the
Lesson Designer can fix: it goes to the content-gap picture wave whenever it
surfaces, never to exclusion.

---

## Phase 3.6 - Final Resource Review and Finalisation

Every branch has now either built its resource and passed that resource's check
or been excluded with a reason. Before delivery, review the actual outputs with
their final pictures. The early composition preview cannot settle their usability.

For each built resource, launch its existing owner with `FINAL RESOURCE REVIEW`
and `[PLUGIN_ROOT]/references/final-resource-review.md`: slide-designer for slides,
worksheet-designer for pupil sheets and answer PDFs, working-wall-designer for the
wall, and stick-in-sheets-designer for stick-ins. Every resource is reviewed on
the delivered file by the owner that designed it; none reuses an earlier
inspection. Supply exact
output paths from build results, the resource specification, approved design,
the run's render route and a separate owned review-result path. Use
`render-pages.py` to produce a manifest, a contact sheet and page PNGs for each
file. This is review mode, not another creation run or a pre-picture preview.

**Probe the render route once here**, with `render-pages.py --probe-route
"[WORKING_DIR]/render-routes.json"`, and give that one file to every reviewer.
`RENDER_PROBE_BLOCKED` means the probe was refused permission to start a child
process and learnt nothing: re-run it with access. Only an empty `pptxRoutes`
from a probe that RAN means this machine cannot render a deck; three lessons
shipped an unreviewed PowerPoint on that confusion (September 2026).

Merge the owners' entries into `[WORKING_DIR]/final-resource-reviews.json`,
keeping their findings. Route REVISE findings through Phase 3.5;
a final visual fault does not need to exhaust the pre-picture self-repair budget.
Missing teaching or changed learning demand returns to Lesson Designer and design
review. Rebuild affected resources and obtain a review of the current renders.
A repair has not passed merely because it builds. Rendering unavailable means UNVERIFIED.

**A finding that survives its repair round is flagged, never a reason to withhold
the resource.** A resource that built and passed its own check is delivered, the
finding named first in the report and in `Teacher flags`: page, fault, and the
change to make by hand. A teacher fixes one slide in a minute; a withheld deck
costs the lesson. Exclusion is for a resource that never built or failed its
own check.

Only a current PASS for every delivered visual resource supports COMPLETE.
`validate-run-report.py` checks delivered bytes, render evidence and page coverage
against the final review receipt. It cannot check judgement quality. Retain final
manifests and page images alongside the review records. Then prove picture
provenance, tidy transient work and write the record.

Run picture provenance once from the final schema-2 requirements and
`[WORKING_DIR]/orchestration-receipts/picture-terminal/`:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/finalize-picture-assignment.py" provenance \
  --requirements "[WORKING_DIR]/photo-requirements.json" \
  --terminal-receipts-dir "[WORKING_DIR]/orchestration-receipts/picture-terminal" \
  --working-dir "[WORKING_DIR]" \
  [--early-wave-snapshot "[WORKING_DIR]/photo-requirements-a-[N].json" when the early adaptation wave compiled] \
  --output "[WORKING_DIR]/picture-provenance.json" \
  --summary-output "[WORKING_DIR]/picture-provenance-summary.json"
```

Require `PICTURE_PROVENANCE_OK` before removing transient picture work. Keep
requirements snapshots, assignments, terminal receipts and provenance. Delete
only transient worker results, work roots and orphan prompt/search scratch.
Some approval policies refuse a recursive delete outright; that refusal is a
normal outcome, not friction and not an accepted minor issue.

Copy every `PICTURE_LOW_RESOLUTION:` line the finaliser printed into the run's
friction file and into the report's picture results as a teacher flag naming
the slide the picture is on: the picture was accepted because it still does its
job at that size, and the teacher decides whether to print it. Copy its
`PICTURE_SOURCES:` line into the report's picture results: an open-web
picture is credited under the education exception, not carrying a licence.

When the early adaptation wave compiled, pass its snapshot: that is what lets
provenance recognise a receipt for a picture the sheet never took as early work
rather than stray evidence. It keeps that picture's receipt, search summary and
AI ledger, removes only its published file (nothing references it), and prints
one `PICTURE_EARLY_WAVE: [N] sourced early, [M] used, [K] unused` line. Copy
that line verbatim into the run report's picture results; it is what the early
route cost, and the teacher who pays for pictures is the one who judges it.

Provenance proves the licence and history of pictures the run published, so it
runs only when the picture stage attempted them. Under `PICTURE_STAGE:
unavailable` or `none required` nothing was published and there is nothing to
prove: skip it, and do not treat its absence as a blocking fault. The picture
results in the run report still tell the teacher what the lesson does without.

Append genuine findings to the shared build review log:

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/record-build-review.py" \
  --lesson "[year, subject and objective in plain English]" \
  --plugin-root "[PLUGIN_ROOT]" \
  --finding "[one reusable engine finding]" \
  [--finding "..." for each further finding] \
  [--source-root "[PLUGIN_SOURCE_ROOT]" when one resolved]
```

The log lives on the teacher's Desktop, so it does not depend on where the run
started, and each entry carries the plugin version. Require
`BUILD_REVIEW_LOG_OK`. Pass `--source-root` only when the run already resolved
one; there is no pending-log branch and no checkout to go looking for. A finding
is one a future run would hit again: a check that refused a correct output, a
renderer that could not draw what the lesson needed, two rules that disagreed.

---

## Phase 4 — Final Assembly and Report

Write `[WORKING_DIR]/run-report.md` with:

- outcome: `COMPLETE`, `PARTIAL`, `BLOCKED` or `UNVERIFIED`;
- final resource review outcomes and unresolved findings. Use UNVERIFIED when an
  output could not be visually checked, otherwise as set out below;
- delivered resources with exact paths from fixed build summaries or the wall
  builder, each path in backticks;
- the lesson walk-through: copy `[WORKING_DIR]/design-decisions.md` to
  `[OUTPUT_DIR]/[lesson title] - walk-through.md`, listed with the delivered
  resources. It is the lesson as the designer would teach it, and what the
  teacher reads to see where the lesson is going; it goes wherever the deck goes;
- excluded earned resources and exact reasons;
- blocking faults, accepted minor issues and failed build attempts. A minor
  issue is one a check or designer raised and something judged harmless: a
  retained build warning, or a picture a designer flagged and left standing;
- picture outcomes. A picture the contract promised and the run did not publish
  is a missing picture whether one scout failed or the stage never started, so
  name it, and the package is then not `COMPLETE`. A picture retired by an
  approved owner revision remains named failure history, but does not block
  completion when the review matches the current design/contract and no owner
  or resource still uses it. The replacement teaching must be built and checked.
  When the early adaptation
  wave ran, carry its `PICTURE_EARLY_WAVE:` line from provenance verbatim: an
  early picture the sheet dropped is a cost, not a missing picture;
- every helper gap: each visual answered with a substitute, and every helper
  this run built and left waiting in `pending-helper/`. Say in plain English
  what each waiting helper draws, name its folder, and say `/install-helper`
  over that folder installs it. Nothing else surfaces it, so one the report
  omits is one nobody installs;
- the worker-launch audit marker and the `WORKER_TIMELINE:` block it prints
  under `## Worker launches`, both from `worker-launch.py audit` run
  immediately beforehand and copied verbatim;
- every line of `[WORKING_DIR]/friction.md`, the run's tagged record of
  obstacles, blocks and repairs. It keeps blocks a repair closed; `Blocking
  faults` above lists only what is still broken;
- shared investigation-log status.

Run `validate-run-report.py` and require `RUN_REPORT_OK`. On failure, repair
the report from its printed failure list and re-run the check; it reports every
failure at once, so one pass is normally enough. Validation keeps the record
honest, it never withholds it: if the check still fails after two repair passes,
send the teacher report anyway with the exact `RUN_REPORT_FAILED` output. Then
send a short
teacher-facing report naming the topic, year, subject, objective, lesson scope,
exact files, pedagogical highlights, design-review result and every teacher
flag.

A package missing an earned output, or delivering one with a flagged review
finding, is `PARTIAL`; a fault that stopped a resource building or passing its
own check is `BLOCKED`; a wall the builder could not verify against its page contract, which
reaches the report as `PAGE_FIT_UNVERIFIED`, is `UNVERIFIED`. Use exact summary
output paths, never guessed filenames. `BLOCKED` labels the record, not the
delivery: every resource that built and passed its own check is handed over,
faults named first.

### Report format

Keep the teacher report concise. Always include a `Teacher flags` section, using
`None` when empty. It carries the design reviewer's unresolved findings, any
declared cross-resource impact from a repair, and every picture a designer was
uneasy about. Worksheet pupil sheets and answer key remain separate. State when
a two-lesson scope covers Lesson 1 only and name deferred learning.

---

## Phase 5 — SharePoint Sync

Once every branch has settled, build the explicit sync list from the teaching
resources only: the deck, worksheets, answer key, working wall and stick-in
sheets. The run report and walk-through stay in `OUTPUT_DIR` for the teacher to
read there; the sync script skips them if passed. Run `run-fixed-resource.py sharepoint` directly with `--term-file`, and
the year, the term, week, subject and day from `[WORKING_DIR]/filing.txt`
(`--day` only when `IS_CORE=yes`) and one `--file` per exact basename. Require
schema 1 `ok: true`, `DESTINATION=` and `STATUS=COPIED`, then tell the teacher
where it was saved in one line.

Sync the delivered files whatever the package outcome: the run report, not the
sync, is where faults are told. If the mapped drive is unavailable or the filing
destination never resolved, retain local outputs and report the exact local
folder and resolver error.

### Edge cases

- A lesson-plan-only request still preserves that file separately after reading
  only enough to resolve Phase-0 routing.
- A teacher worksheet is the Expected/base sheet; generate only genuinely
  needed adaptations around it.
- A generated worksheet is expected unless the teacher supplied one; an
  unexplained `not-needed` decision is a design fault.
- Ambiguous or incomplete Lesson Designer output is not silently repaired by
  the host.

The lesson design remains the single pedagogical source of truth. Downstream
roles coordinate through validated files, not conversations or scheduler state.
