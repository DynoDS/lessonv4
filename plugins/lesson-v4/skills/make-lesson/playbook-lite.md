# Make Lesson — Lightweight runtime playbook

This is the active runtime playbook. It deliberately avoids a generic job
controller. The host launches named workers directly, waits through the host's
normal worker lifecycle, and runs deterministic checks at meaningful file
boundaries. Do not create orchestration job specs, completion events, worker
snapshots, transition receipts, scheduler audits or latency reports.

## Lightweight execution protocol

For a named model worker:

1. give it only its role file, authoritative input paths, owned output paths,
   required check and terminal marker;
2. launch it directly with clean context;
3. wait for it through the host's ordinary worker-wait mechanism;
4. require its owned files and exact terminal marker;
5. run the named deterministic validator immediately.

Independent workers may run in parallel. Never launch two workers that own the
same file. A downstream worker starts only after its authoritative input has
passed its deterministic check.

Retry once only for an infrastructure failure: a launch that never starts, a
terminated tool session, or a worker that stalls without writing usable output.
Use a fresh clean-context worker with the same saved inputs. Do not retry a
completed semantic result merely because it is inconvenient. Use the explicit
redesign or focused-repair route instead. After the one infrastructure retry,
preserve clean outputs from unrelated branches and report the affected output
as incomplete.

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
  that output;
- no visual reviewer: keep the build but report its review as `UNVERIFIED`;
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

Resolve the filing destination with `scripts/resolve-filing.py` using the first
explicit year and subject in teacher-authored input, then the fixed LO-to-subject
lookup in the main skill. Tell the teacher the destination before generation.
If the resolver prints an `ERROR:` line or exits non-zero, continue the run and
plan local-only delivery: the destination is a filing convenience, never a gate
on making the lesson.

For direct fixed slides, worksheets and stick-in sheets, let
`run-fixed-resource.py` own output-family collision archiving. The retained wall
builder owns its wall-family archive.

---

## Phase 1 — Run the Lesson Designer (Sequential, Blocking)

Launch `lesson-designer` directly. Respect the model and effort declared in its
frontmatter.

```text
You are the lesson designer. Read your agent instructions at:
[PLUGIN_ROOT]/agents/lesson-designer.md

PLUGIN_ROOT: [PLUGIN_ROOT]
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
python3 "[PLUGIN_ROOT]/scripts/lesson-design-scaffold.py" \
  --request "[WORKING_DIR]/lesson-design-scaffold-request.initial.json" \
  --lesson-design "[WORKING_DIR]/lesson-design.json" \
  --photo-requirements "[WORKING_DIR]/photo-requirements.json"
Require exactly: LESSON_DESIGN_SCAFFOLD_OK
This command writes the empty scaffold over both files. It is a builder, not a
check. Once any field is filled, running it again would discard the design.

SUCCESS_CHECK:
python3 "[PLUGIN_ROOT]/scripts/validate-lesson-design.py" \
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
python3 "[PLUGIN_ROOT]/scripts/check-photo-cap.py" \
  "[WORKING_DIR]/photo-requirements.json"
```

If the picture cap exceeds 16, run one focused Lesson Designer revision against
the current three canonical design files. Preserve learning-critical picture
jobs, edit only the picture prioritisation and genuinely consequential content,
do not add `adaptation-photo-###`, and do not rewrite the initial scaffold
request. Re-run the design validator and photo-cap check. The 16-picture cap is
also enforced inside the design validator, so a contract still over the cap
after that one revision cannot validate either: treat it as a failed success
check and use the same one fresh-attempt recovery, not further revision passes.

Carry every `flagsForTeacher` entry into the final report.

---

## Phase 1.25 — Review the Design (Sequential, Blocking)

Skip only when `design-reviewer` is absent. Otherwise prepare its compact view
directly—no job or successor manifest:

```text
python3 "[PLUGIN_ROOT]/scripts/design-review-packet.py" prepare \
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
review. Re-run `validate-lesson-design.py --initial-photo-namespace` yourself:
when it passes, continue on the exact `Result` in `design-review.md` and record
the packet failure in the run report; when it fails, the review pass has
corrupted the canonical files, so route the validator's failures through the
Phase 1 fresh-attempt recovery.

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

---

## Phase 1.5 — Helper Check (Before Spawning Any Renderer)

Run `collect-helper-uses.py` against approved `lesson-design.json`. Compare only
the representations it names with the existing helper catalogues. If every
required helper exists, continue.

If a genuinely required helper is missing and the helper-builder/source route
is available, build and test only that helper before renderers launch. Otherwise
record the exact `SLIDE_HELPER_GAP` or `WORKSHEET_HELPER_GAP`; do not silently
replace it with an unfaithful picture or generic decoration.

---

## Phase 2 — Spawn Parallel Rendering Branches

Freeze the approved initial photo contract once:

```text
python3 "[PLUGIN_ROOT]/scripts/photo-contract.py" freeze-initial \
  --canonical "[WORKING_DIR]/photo-requirements.json" \
  --snapshot "[WORKING_DIR]/phase2-initial-photo-requirements.json" \
  --receipt "[WORKING_DIR]/phase2-initial-photo-requirements.receipt.json"
```

The freeze receipt is the phase boundary; do not create worker snapshots or
generic receipts.

### Resolve the picture stage before launching any designer

Compilation reads only the frozen contract, is deterministic, and finishes in
seconds. A designer that reads a photo contract spends far more than that. So
settle whether the promised photographs will be attempted at all before those
workers start, and hand every one of them the answer.

If the frozen contract's `photos` array is empty, the state is
`PICTURE_STAGE: none required` and there is nothing to compile.

Compile assignments directly:

```text
python3 "[PLUGIN_ROOT]/scripts/compile-picture-assignments.py" compile \
  --requirements "[WORKING_DIR]/phase2-initial-photo-requirements.json" \
  --expected-prefix p \
  --output-dir "[WORKING_DIR]/picture-assignments/p" \
  --working-dir "[WORKING_DIR]" \
  --summary-output "[WORKING_DIR]/picture-assignments/p-summary.json"
```

Require `PICTURE_ASSIGNMENTS_OK`, then validate the emitted `manifest.json` with
`validate-image-scout.py manifest` and require `PICTURE_MANIFEST_OK`. Together
these two markers give the state `PICTURE_STAGE: attempting [N] pictures`.

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

Run printable Chrome preflight once before worksheet, wall or stick-in builds.
Pass its resulting `ready` or `unavailable` state to fixed builders rather than
repeating browser recovery for every resource.

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
WORKING_DIR: [WORKING_DIR]
OUTPUT_DIR: [OUTPUT_DIR]

AUTHORITATIVE_INPUTS:
LESSON_DESIGN: [WORKING_DIR]/lesson-design.json
PHOTO_REQUIREMENTS_PATH: [WORKING_DIR]/phase2-initial-photo-requirements.json
PICTURE_STAGE: [the resolved Phase 2 state line, verbatim]

OWNED_OUTPUTS:
- [WORKING_DIR]/lesson.json

This worker creates JSON only. Do not load or use the global `Presentations`
skill. The fixed slide builder creates the PowerPoint after this worker
completes.

SUCCESS_CHECK:
node "[PLUGIN_ROOT]/builder/scripts/check-slide-design.js" \
  "[WORKING_DIR]/lesson.json"

Require: Slide design check: SLIDE_DESIGN_CHECK_OK: [N] slides
TERMINAL_STATE: COMPLETE
```

Wait for `lesson.json` and require the slide-design marker. Preserve every
`BUILD_DIAGNOSTIC:` line for a focused Slide Designer repair.

---

**The picture stage** - only when Phase 2 resolved `PICTURE_STAGE: attempting`:

The assignments and their validated `manifest.json` already exist: Phase 2
compiled and checked them before any designer launched. Do not compile again.

Launch one unified `image-scout` per assignment in the manifest, up to four at
once and no more than two direct-AI batches at once. Use role `image-scout`, its
frontmatter model/effort, the exact assignment path, its assignment `work_root`,
and one unique result path:

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

Picture provenance is completed after visual review, not here.

---

**Track A trigger:**

Wait until Slide Designer and all picture filenames referenced by `lesson.json`
are terminal. When the resolved state is `PICTURE_STAGE: unavailable` or
`none required`, no terminal receipt is coming and there is nothing to wait
for: build the slides from the specification the designer already wrote.

If the lesson uses a labelled diagram over a photo, launch Diagram Anchor
against the final published image and update only anchor coordinates.

Build slides directly:

```text
python3 "[PLUGIN_ROOT]/scripts/run-fixed-resource.py" slides \
  --plugin-root "[PLUGIN_ROOT]" \
  --working-dir "[WORKING_DIR]" \
  --output-dir "[OUTPUT_DIR]" \
  --lesson-name "[TOPIC]" \
  --summary-output "[WORKING_DIR]/build-results/slides.json"
```

Require `ok: true` and the exact output paths in the summary. On a semantic
build diagnostic, run one focused Slide Designer repair and rebuild once.

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
`adaptation.md`, `adaptation.json`, and a provisional adaptation photo contract.

Run `photo-contract.py build-provisional` and the lesson-design validator against
the provisional contract. Use exactly:

```text
python3 "[PLUGIN_ROOT]/scripts/photo-contract.py" build-provisional \
  --initial "[WORKING_DIR]/phase2-initial-photo-requirements.json" \
  --adaptation "[WORKING_DIR]/adaptation.json" \
  --output "[WORKING_DIR]/adaptation-photo-provisional.json" \
  --lesson-design "[WORKING_DIR]/lesson-design.json" \
  --receipt "[WORKING_DIR]/orchestration-receipts/adaptation-photo-provisional.json"
```

Adaptation may add only `adaptation-photo-###` entries; it may not mutate the
frozen initial entries.

If adaptation fails deterministically, preserve the expected worksheet route and
report adaptation omitted. Do not rerun unrelated branches.

---

**Worksheet Designer** — if `worksheet-designer` exists AND either:

- the approved lesson requires a generated worksheet or shared frame; or
- accepted adaptation requires generated Below/Greater Depth sheets around a
  teacher-provided expected worksheet.

Before every attempt, obtain the exact worksheet photo-contract path through
`photo-contract.py select-worksheet`. Launch Worksheet Designer directly:

```text
You are the worksheet designer. Read your agent instructions at:
[PLUGIN_ROOT]/agents/worksheet-designer.md

PLUGIN_ROOT: [PLUGIN_ROOT]
WORKING_DIR: [WORKING_DIR]
OUTPUT_DIR: [OUTPUT_DIR]

AUTHORITATIVE_INPUTS:
LESSON_DESIGN: [WORKING_DIR]/lesson-design.json
PHOTO_REQUIREMENTS_PATH: [selected contract path]
PICTURE_STAGE: [the resolved Phase 2 state line, verbatim]
[ADAPTATION_DESIGN when accepted]
[TEACHER_WORKSHEET_INPUT when supplied]

OWNED_OUTPUTS:
- [WORKING_DIR]/worksheet.json

SUCCESS_CHECK:
Run the worksheet specification validator named by your role.
TERMINAL_STATE: COMPLETE
```

After the spec passes, promote only adaptation photos actually referenced by the
accepted worksheet through `photo-contract.py promote-used`. Compile any new
supplemental `w` picture assignments through the same direct picture route.

Number each wave from 1, and keep the receipt name and the snapshot name on the
same number, because the next `select-worksheet` reads the highest-numbered
receipt and the immutable snapshot that receipt names:

```text
python3 "[PLUGIN_ROOT]/scripts/photo-contract.py" promote-used \
  --initial "[WORKING_DIR]/phase2-initial-photo-requirements.json" \
  --provisional "[WORKING_DIR]/adaptation-photo-provisional.json" \
  --adaptation "[WORKING_DIR]/adaptation.json" \
  --worksheet "[WORKING_DIR]/worksheet.json" \
  --canonical "[WORKING_DIR]/photo-requirements.json" \
  --lesson-design "[WORKING_DIR]/lesson-design.json" \
  --requirements-snapshot "[WORKING_DIR]/photo-requirements-w-[N].json" \
  --receipt "[WORKING_DIR]/orchestration-receipts/photo-requirements-w-[N].json"
```

Require `PHOTO_CONTRACT_PROMOTED`, and compile the supplemental wave from that
immutable snapshot rather than from the canonical contract, which a later wave
rewrites.

Build worksheets directly:

```text
python3 "[PLUGIN_ROOT]/scripts/run-fixed-resource.py" worksheets \
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

### Track D — Working Wall (working-wall-designer → working-wall-builder, runs after slide-designer; in parallel with Tracks B and the rest of A)

If the approved lesson earns a wall, launch Working Wall Designer directly with
approved `lesson-design.json`, `lesson.json` and the applicable photo contract.
It owns only `working-wall.json`. After its deterministic check, launch the
retained Working Wall Builder, which runs the fixed wall script and returns its
short Output Report. One wall diagnostic permits one focused wall-owner repair
and rebuild. Preserve its exact returned output path.

### Track E — Stick-in Spec (stick-in-sheets-designer, runs after slide-designer; in parallel with Tracks B, D and the rest of A)

If the approved design earns stick-in sheets, launch the designer directly with
approved `lesson-design.json`, `lesson.json` and applicable picture contract. It
owns only `stick-in-sheets.json`. Require its role validator.

### Track F — Stick-in Sheets (fixed build, runs after stick-in-sheets-designer)

```text
python3 "[PLUGIN_ROOT]/scripts/run-fixed-resource.py" stick-in \
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

## Phase 3 — Wait for All Branches

Wait through the host's ordinary multi-worker wait once for all active branches.
Do not poll each worker serially and do not create scheduler state. As each
worker completes, run its deterministic check and release only its genuine
dependants. A failed branch does not invalidate a clean independent branch.

Before visual review, every earned resource must be either built with an
accepted summary or excluded with a reason. A resource that is neither by this
point is excluded now, with its exact failing marker as the reason: exclusion
is the honest record of a branch that ended, not a fault to repair here.

---

## Phase 3.5 — Visual Check and Repair (after all builders, before the report and sync)

Render every delivered surface through the established `render-pages.py` route.
**Start each artefact's visual reviewer here, after its final build is present.**
Launch one Visual Reviewer per resource concurrently. Each receives only
approved `lesson-design.json`, that resource's own specification, its final
render manifest/pages, and its artefact-specific review module. It writes one
`findings-[resource].md` file.

Stable finding IDs persist through repairs. Reviewer-local tiny fixes are
allowed only where the role permits them; rebuild and confirm the exact affected
pages. A material content/layout fault routes once to the resource's existing
owner using the focused-repair entrypoint. Do not reopen passing content.

When two or more comparable resources exist, build the deterministic consistency
overview and launch Visual Consistency Reviewer once. Missing or stale evidence
causes rerender of only the named resource, not a full pipeline replay.

Use `PASS`, `BLOCKED` or `UNVERIFIED` exactly. Never relabel unavailable review
as pass.

---

### The focused owner-repair round

Use the compact focused-repair role for the named owner when present, otherwise
its full creation role. Give it the finding ID, exact artefact/location,
required change, protected passing content, potential cross-resource impact and
existing build diagnostic.

- `slide-designer`: use `[PLUGIN_ROOT]/agents/slide-designer-focused-repair.md`;
  if that file is missing or unreadable, use `[PLUGIN_ROOT]/agents/slide-designer.md`.
- `worksheet-designer`: use `[PLUGIN_ROOT]/agents/worksheet-designer-focused-repair.md`;
  if that file is missing or unreadable, use `[PLUGIN_ROOT]/agents/worksheet-designer.md`.
- `working-wall-designer`: use `[PLUGIN_ROOT]/agents/working-wall-designer-focused-repair.md`;
  if that file is missing or unreadable, use `[PLUGIN_ROOT]/agents/working-wall-designer.md`.
- `stick-in-sheets-designer`: use `[PLUGIN_ROOT]/agents/stick-in-sheets-designer-focused-repair.md`;
  if that file is missing or unreadable, use `[PLUGIN_ROOT]/agents/stick-in-sheets-designer.md`.

Launch the selected role directly; do not create a repair job spec.

Return these exact repair-impact fields with the normal terminal marker:

```text
Changed: [exact changed content]
Unchanged: [exact protected content]
Potential cross-resource impact: [specific relationships or None]
```

Rebuild only that resource, rerun its deterministic check, rerender changed
pages and confirm the same finding ID. Run a consistency confirmation only when
the repair declares a real cross-resource impact. There is no third general
repair round.

For a picture finding, use the one-filename repair slice and prior picture
receipt, finalise with `--replace yes`, then rebuild/review only affected
resources.

---

### Deterministic final merge

Run `merge-visual-reviews.py` with only findings and confirmations that exist,
writing `[WORKING_DIR]/visual-review.md`.
Use `--consistency-required` only when two or more comparable resources required
the specialist comparison. Read `## Verdict` exactly.

Run picture provenance once from the final schema-2 requirements and
`[WORKING_DIR]/orchestration-receipts/picture-terminal/`:

```text
python3 "[PLUGIN_ROOT]/scripts/finalize-picture-assignment.py" provenance \
  --requirements "[WORKING_DIR]/photo-requirements.json" \
  --terminal-receipts-dir "[WORKING_DIR]/orchestration-receipts/picture-terminal" \
  --working-dir "[WORKING_DIR]" \
  --output "[WORKING_DIR]/picture-provenance.json" \
  --summary-output "[WORKING_DIR]/picture-provenance-summary.json"
```

Require `PICTURE_PROVENANCE_OK` before removing transient picture work. Keep
requirements snapshots, assignments, terminal receipts and provenance. Delete
only transient worker results, work roots and orphan prompt/search scratch.

Provenance proves the licence and history of pictures the run published, so it
runs only when the picture stage attempted them. Under `PICTURE_STAGE:
unavailable` or `none required` nothing was published and there is nothing to
prove: skip it, and do not treat its absence as a blocking fault. The teacher
still learns what the lesson does without from the run report's picture
results, which name every promised picture the run did not publish.

Append genuine findings to the shared build review log when source access is
available. Otherwise write the pending log entry in the working directory.

No generic controller audit or latency report is part of completion.

---

## Phase 4 — Final Assembly and Report

Write `[WORKING_DIR]/run-report.md` with:

- outcome: `COMPLETE`, `PARTIAL`, `BLOCKED` or `UNVERIFIED`;
- delivered resources with exact paths from fixed build summaries or the wall
  builder;
- excluded earned resources and exact reasons;
- blocking faults, accepted minor findings and failed build attempts;
- picture outcomes and helper gaps;
- worker friction lines;
- shared investigation-log status.

Do not include scheduler contracts, receipts or counts. Picture terminal
receipts are evidence for picture provenance, not generic completion records.

Run `validate-run-report.py` and require `RUN_REPORT_OK`. On failure, repair
the report from the validator's printed failure list and re-run the check; it
reports every failure at once, so one repair pass is normally enough. Report
validation keeps the record honest, it never withholds the record: if the check
still fails after two repair passes, send the teacher report anyway and include
the exact `RUN_REPORT_FAILED` output. Then send a short
teacher-facing report naming the topic, year, subject, objective, lesson scope,
exact files, pedagogical highlights, design-review result, visual verdict and
every teacher flag.

Use actual summary output paths, never guessed filenames. A package missing an
earned output is `PARTIAL`; an unresolved blocking fault is `BLOCKED`; missing
required visual verification is `UNVERIFIED`. `BLOCKED` labels the record, not
the delivery: a blocked package still hands over every resource that built and
passed its own checks, with the unresolved faults named first.

### Report format

Keep the teacher report concise. Always include a `Reviewer flags` section,
using `None` when empty. Worksheet pupil sheets and answer key remain separate.
State when a two-lesson scope covers Lesson 1 only and name deferred learning.

---

## Phase 5 — SharePoint Sync

After review and repair settle, build the explicit sync list from exact delivered
paths. Run `run-fixed-resource.py sharepoint` directly with the resolved term,
year, week, subject/day and one `--file` per exact basename. Require schema 1
`ok: true`, `DESTINATION=` and `STATUS=COPIED`.

Do not create a command job or rerun a scheduler audit. Sync the delivered
files whatever the package outcome: the run report, not the sync, is where
faults are told. If the mapped drive is unavailable or the filing destination
never resolved, retain local outputs and report the exact local folder and
resolver error.

### Edge cases

- A lesson-plan-only request still preserves that file separately after reading
  only enough to resolve Phase-0 routing.
- A teacher worksheet is the Expected/base sheet; generate only genuinely
  needed adaptations around it.
- Missing pictures use the approved fallback or omission and are reported. A
  picture the contract promised and the run did not publish is a missing
  picture whether one scout failed or the whole stage never started, so it is
  named in the run report and the package is not `COMPLETE`.
- A generated worksheet is expected unless the teacher supplied one; an
  unexplained `not-needed` decision is a design fault.
- Ambiguous or incomplete Lesson Designer output is not silently repaired by
  the host.

The lesson design remains the single pedagogical source of truth. Downstream
roles coordinate through validated files, not conversations or scheduler state.
