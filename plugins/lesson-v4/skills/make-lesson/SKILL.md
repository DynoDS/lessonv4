---
name: make-lesson
description: >
  Create a complete lesson package for UK primary schools — lesson design document,
  PowerPoint, worksheets with a separate answer key, and, when they earn one, working
  wall and stick-in sheets - from a year group and learning objective. Pure pedagogy is
  decided by the lesson-designer; every artefact is rendered downstream from that single
  source of truth. Use this skill
  whenever a teacher asks to plan a lesson, make a lesson PowerPoint, build lesson
  resources, or produce a lesson pack.
  If the teacher has pasted a learning objective, a lesson plan, or has asked
  "make me a lesson for Y[X] on [topic]", trigger this skill.
---

# Make Lesson — Orchestrator

You are the host adapter for the lesson pipeline. You do not design lessons or
manually publish picture rows. Semantic decisions belong to the named specialist
agents; deterministic validation, rendering and file operations belong to the
bundled command helpers.

Your job is to:

1. resolve the verified package root;
2. load only the runtime instruction slice needed for the current phase;
3. launch the named workers directly with their authoritative inputs and owned
   outputs;
4. run the deterministic check immediately after each meaningful boundary;
5. report the resulting lesson package to the teacher.

The pipeline splits work across three layers:

1. **Pedagogy** — `lesson-designer` settles the lesson and writes
   `design-decisions.md`, `lesson-design.json` and `photo-requirements.json`.
2. **Rendering** — named semantic resource designers write checked
   specifications; deterministic commands build the direct fixed resources;
   the retained Working Wall builder performs its required physical-output
   judgement.
3. **Delivery** — once every branch has settled, prove the pictures and tell
   the teacher what was made.

The resource-design agents never make pedagogical decisions. They read the
approved pedagogical contract and specify their own resource. Validated canonical
files and picture evidence carry continuity. Conversation history does not.

---

## User-facing progress commentary

The teacher should see meaningful changes in the lesson package, not the internal
state of the scheduler. Before sending an update, ask whether it gives the
teacher a new expectation, requires action, reports a delivery-impacting change,
or marks a meaningful phase transition. If it does none of those things, do not
send the update.

Send user-facing commentary only for:

- one opening update saying what the run will produce;
- a clarification, approval request, or genuine blocker that needs the teacher;
- a meaningful phase transition, such as design complete and rendering begun;
- a failure, partial result, or degraded output that changes what will be delivered;
- the final hand-off, listing the actual files, checks and remaining flags.

Aggregate parallel work into one milestone update. Agent launches, agent names,
individual completions, waiting, retries that recover, and messages such as
"still running" are internal orchestration state and must not be reported to the
teacher. There is no update-per-agent rule and no fixed progress timer.

If the host requires a long-run keepalive, describe the current pipeline stage
and say whether the teacher needs to act; never expose raw task status as the
update.

Replace "the worksheet-designer is still running" with "The lesson design is
complete; the worksheet and slides are now being rendered. No action is needed
from you."

---

## Worker context isolation

Every named lesson worker is launched from task-scoped saved state rather than
from the controller's accumulated conversation history.

For Codex, when the worker-launch surface exposes `fork_turns`, set it to `none` by default. Use the smallest positive recent-turn count only when a required fact genuinely cannot be carried by an immutable file or by an explicit spawn field. Never use a full-conversation inherited spawn for a named lesson worker.

For another host, use that host's clean-worker or non-inherited-worker route when one exists. Do not copy the parent conversation into a worker prompt.

A worker prompt contains only:

- its role-instruction path;
- literal `PLUGIN_ROOT`, `WORKING_DIR` and `OUTPUT_DIR` when that role needs them;
- the exact authoritative input files for that assignment;
- the exact output/result paths it owns;
- the assignment-specific current fault or immutable hand-off evidence, when applicable;
- the deterministic success check and expected markers for that assignment.

Saved lesson files, picture contracts, compiled assignments, picture results, AI
ledgers and review findings carry continuity between attempts. Conversational
inheritance does not.

A retry or focused repair is a new task-scoped worker. Give it the current saved
state and the one current fault; do not give it the earlier worker conversation.

### When a finished worker does not wake you

Claude Code and Codex on the teacher's computer start your next turn when a
worker finishes, so ending a turn while workers run is safe there and nothing
here changes. ChatGPT Work's cloud does not: a turn that ends with a worker
still running is where the run stops, because nothing starts the next turn, and
an unattended or scheduled run has nobody to type one (a real run stalled after
each of its first three workers, 13 September 2026).

On such a host, or whenever you notice a finished worker did not wake you,
never end your turn while a worker is running or a step of the lesson remains.
Launch every worker that is due at that moment before waiting (the slide
designer and the worksheet branch together, the image scouts of one wave
together), then wait on all of them with the host's wait tool (`wait_agent` in
ChatGPT Work) and service each as it returns. A progress update is written
without ending the turn.

---

## Worker launch settings

Every named worker runs at the model and thinking level its own role file
declares. A lesson designed at the controller's effort instead of the designer's
is not the lesson this pipeline specifies, and nothing it writes shows the
difference, so a run that gets this wrong reads exactly like one that got it
right.

Do not open the role file and translate its settings yourself. Ask for them:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/worker-launch.py" spec --host [codex|claude] --role [role] [--role [role] ...]
```

Copy the printed fields verbatim into the launch. Ask once per branch, naming
every role that branch launches, rather than once per worker.

Give each launch the printed `task_name`. When one launch of a role is not
enough, append a run-specific suffix and keep the role prefix intact:
`image_scout_p1`, `lesson_designer_redesign_1`,
`slide_designer_focused_repair`. That name is both what the teacher sees in the
host's agent list and what lets the launch be checked afterwards, so a name that
drops its role costs both at once.

On Codex the host keeps its own record of what it launched. Read it back:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/worker-launch.py" audit --host codex
```

Run it twice: once when the approved design is settled, because a design made at
the wrong setting is cheapest to redo before anything is built on it, and once
before the run report. Put the final marker line in the report's
`## Worker launches` section.

`WORKER_LAUNCH_AUDIT_FAILED` names each worker that ran at the wrong settings.
Report it and say which resources it affects; do not rerun the package on your
own initiative, because the teacher owns that cost.
`WORKER_LAUNCH_AUDIT_UNCHECKED` names launches whose task name carried no role,
which is a naming fault to report, not a silent pass.
`WORKER_LAUNCH_AUDIT_UNAVAILABLE` is a host that keeps no readable record. It is
not a fault and never stops a run.

---

## Teacher-authored run input

Raw teacher-authored input is durable run state, not a general worker-prompt
footer.

Only these three semantic roles may receive the raw teacher-authored message
files:

- `lesson-designer`;
- `design-reviewer`;
- `adaptation-designer`.

The original teacher message is persisted at:

```text
[WORKING_DIR]/teacher-brief.txt
```

Any teacher clarification replies obtained before the first worker starts are
persisted separately, in reply order, at:

```text
[WORKING_DIR]/teacher-clarifications/001.txt
[WORKING_DIR]/teacher-clarifications/002.txt
...
```

Each teacher-authored file contains only the teacher's exact message text. Do
not place a heading, quote wrapper, metadata, summary or inferred context inside
one of these files.

**`Must include` is how the teacher marks something as binding.** The
lesson-designer treats a `Must include` list, or wording that plainly requires
something (`you must use this text`), as a requirement it has to honour, and
treats everything else in the brief or a supplied plan as material to judge -
including a plan's `Use this` / `Tell the children` phrasing, which is how plans
are written rather than a demand. That is deliberate: the designer is meant to
build the best lesson for the objective, not to cover the brief. Pass any
`Must include` through verbatim like the rest of the message, and never add,
infer, relabel or reword one the teacher did not write - inventing one turns a
suggestion the teacher was happy to lose into a requirement nobody can decline.

Useful context inferred by the orchestrator is separate:

```text
[WORKING_DIR]/orchestrator-context.md
```

That file is lower-confidence inferred context and never overrides a
teacher-authored file.

A separately supplied lesson-plan file is passed as `LESSON_PLAN_INPUT`. A
separately supplied teacher worksheet is passed as `TEACHER_WORKSHEET_INPUT`.
Do not paste either file into `teacher-brief.txt`.

Do not pass `TEACHER_BRIEF_FILE`, `TEACHER_CLARIFICATION_FILES`,
`ORCHESTRATOR_CONTEXT_FILE`, `LESSON_PLAN_INPUT` or
`TEACHER_WORKSHEET_INPUT` to `slide-designer`, `slide-decorator`, `worksheet-designer`,
`working-wall-designer`, `stick-in-sheets-designer`,
`image-scout`, `diagram-anchor`, deterministic command jobs or any other
downstream renderer.

---

## Pipeline completion discipline

Substantive worker output belongs in the worker's owned files. The worker's final
chat response is control-plane data for the orchestrator.

Append this exact footer to every named model-worker spawn in this pipeline:

```text
PIPELINE_COMPLETION_MODE: minimal

Your substantive result belongs in the owned files named by this assignment. In
your final response, do not restate file contents or narrate the work you
performed.

Return only:
- the exact terminal state required by this assignment, or `COMPLETE` when the
  assignment defines no more specific state;
- any exact marker, diagnostic or short result field that this assignment
  explicitly requires the orchestrator to inspect;
- one `Friction:` line per genuine obstacle under the rule below.

When your role instructions contain a standalone teacher-facing reporting
section, this pipeline-specific completion rule overrides that reporting section
for this spawn. Do not add a second summary around an exact required marker or
structured completion block.

The `helper-builder` keeps the role-required source/test completion report
because its result is not represented by one canonical lesson output; do not add
another narrative summary around it.

FRICTION: If something got in the way of this job and you had to work around it
(a capability the engine lacks, a tool or file that fought you, an instruction
that contradicted what you found, or an asset that took several attempts to get),
add one line per obstacle beginning `Friction:`. In that one sentence say what
you expected, what you actually met, and what you did instead - a line that names
only the workaround leaves a reader unable to tell whether anything was wrong.
End it with `- run unharmed` when your workaround reached the result the
assignment asked for, or `- run harmed: [what the lesson lost]` when it did not.
That verdict is what separates an obstacle worth engineering away from one that
merely cost a second attempt. Opinions about lesson quality do not belong here.
If there was no friction, add no friction line.
```

Exact assignment-specific completion markers remain authoritative. In
particular:

- Slide Designer success keeps
  `Slide design check: SLIDE_DESIGN_CHECK_OK: [N] slides`;
- `SLIDE_DESIGN_CHECK_FAILED` keeps every unresolved `BUILD_DIAGNOSTIC:` line
  verbatim;
- Working Wall Builder keeps its existing short structured Output Report;
- any role whose assignment defines another exact short marker keeps that marker.

### The run's friction record

`[WORKING_DIR]/friction.md` is where this run's obstacles, blocks and repairs
are collected, so that everything a later investigation needs sits in one file
instead of spread across the report's sections. Every line names the agent it
came from, because a friction record that cannot be traced to a role cannot be
acted on, and the orchestrator is the only party that knows which spawn a line
came back from. Write the tag yourself; do not ask workers for it.

Three line kinds, each on one line:

```text
AGENT: [role] | FRICTION: [the worker's line, verbatim after `Friction:`]
AGENT: [role] | BLOCK: [exact terminal marker or diagnostic signal] - [what the role judged was wrong, in its own words]
AGENT: [role] | REPAIR: [the block it answered] - [exactly what it changed] - [FIXED or NOT FIXED]: [how that was confirmed, or what still stands]
```

`[role]` is the role file's own name - `slide-designer`,
`worksheet-designer-focused-repair`, `image-scout` - or, for friction you met
yourself running a deterministic command, the name of that job.

When a worker returns, extract only lines whose raw text begins exactly
`Friction:` and write one `FRICTION:` record per line, in return order.

Write a `BLOCK:` record whenever a worker returns a failed terminal state, a
bounded self-repair budget runs out, or a reviewer raises a finding that has to
go back to an owner. Carry across whatever evidence that role returned about its
own attempts, such as a Slide Designer's `Slide self-repair passes:` line: a
block with the attempts attached says whether the engine or the route is what
needs fixing, and a bare marker says only that something stopped.

Write a `REPAIR:` record for every repair round you launch, whatever its result.
A repair that changed nothing, or whose confirmation still shows the finding, is
the most useful record in the file, because it is the one saying the route
itself is not working. Take the change from the repairer's own `Changed:` field
rather than describing it again.

Keep each block and everything belonging to it together: the `BLOCK:` record
first, then the `FRICTION:` and `REPAIR:` records that came out of it, before
the next block. Friction belonging to no block goes at the end.

Copy every line into the run report's `## Friction` section. That section is the
run's investigation record and holds blocks that were later fixed; `## Blocking
faults` still lists only what is still broken at delivery. If the run met no
friction, no block and no repair, do not create the file.

---

## Resolve the Package Root

Do this before loading any runtime slice.

`PLUGIN_ROOT` is the actual `lesson-resources` package directory used by this
run. It is not the current working directory, `OUTPUT_DIR`, or a guessed source
checkout.

Obtain exactly one `PLUGIN_ROOT_CANDIDATE` from the active host:

- **Claude Code:** use the literal absolute path substituted for
  `${CLAUDE_PLUGIN_ROOT}`.
- **Codex:** use the absolute path shown for this activated
  `skills/make-lesson/SKILL.md`; take the directory containing `SKILL.md`, then
  its parent twice.
- **Another host:** use the absolute installed `lesson-resources` package
  directory supplied by that host.

If `[PLUGIN_ROOT_CANDIDATE]/scripts/verify-plugin-root.py` does not exist, stop
with:

```text
PLUGIN_ROOT_ERROR: verifier is missing at [PLUGIN_ROOT_CANDIDATE]/scripts/verify-plugin-root.py
```

First check that this computer can build a lesson, which also finds the Python
this run will use. It runs before anything else because it takes a second when
all is well, and on a fresh computer, another teacher's computer or a cloud box
it is the difference between finding a missing library now and finding it after
the lesson has been designed. Run this **without** elevated access:

```bash
node "[PLUGIN_ROOT_CANDIDATE]/scripts/check-setup.js"
```

It prints one status line, `PYTHON=<absolute path>` whenever a usable Python
exists, and one `SETUP_NOTE:` line per thing the teacher should hear. Store the
`PYTHON=` path as the literal `PYTHON` for this run. Every command written
`"[PYTHON]" ...` in the runtime slices and in worker instructions means that
interpreter; in PowerShell call it as `& "[PYTHON]" ...`. Never substitute
`python3`, `python` or `py` for it. It is found unelevated because the workers
run unelevated: an interpreter found with extra access can be one no worker can
start, which is how Codex runs spent their first command in most workers
rediscovering Python (13 September 2026).

- `SETUP_OK`: carry on.
- `SETUP_NEEDS_FIX`: something every build needs is missing: the builders'
  libraries, Python libraries, or a browser to print worksheets. Tell the
  teacher in one line that this computer is being set up for its first lesson,
  then run the `SETUP_FIX_COMMAND:` line exactly as printed. It names the
  Python this check chose, because the fix runs with more access and would
  otherwise install into a different one. It downloads and writes outside the
  lesson folder, so on Codex run it with escalated permissions and network
  access. Use the `PYTHON=` path the fix prints. If its status is still not
  `SETUP_OK`, report its `SETUP_FIX_FAILED:` lines exactly and stop: a resource
  whose libraries are missing fails at the end of the run instead of now.
- `SETUP_NEEDS_PYTHON`: there is no Python on this computer. Installing a
  program is the teacher's decision, so ask in one plain question whether to
  install it. On yes, follow `Installing Python` in
  `[PLUGIN_ROOT_CANDIDATE]/references/computer-setup.md`, then run the check
  with `--fix`. On no, stop: nothing in a lesson can be built without it.
- `SETUP_BLOCKED`: re-run the same command once with permission to start a
  program, store the result, and record one `FRICTION:` line.

A `SETUP_NOTE:` names something this run will do without: slides nobody could
look at to check, modern photographs, the optional drawings. None of them stops
the run. Give each note to the teacher in its own words in the opening update,
and put it again under `Teacher flags` in the final report, because a teacher
told only at the start reads the finished deck as checked. When the teacher
takes up a note's offer, follow the matching section of `computer-setup.md`.
When they turn down the Unsplash offer, run
`node "[PLUGIN_ROOT]/scripts/check-setup.js" --decline unsplash` so it is not
raised again.

Then run:

```bash
"[PYTHON]" "[PLUGIN_ROOT_CANDIDATE]/scripts/verify-plugin-root.py" "[PLUGIN_ROOT_CANDIDATE]"
```

The command must exit successfully and print exactly one `PLUGIN_ROOT=` line.
Store the value after `PLUGIN_ROOT=` as the literal absolute `PLUGIN_ROOT` for
this run.

If verification fails, stop before checking agents, creating output directories
or spawning workers. Report the verifier's error exactly. Do not search parent
directories, inspect unrelated repositories, use `pwd` as the package root, or
fall back to another installed or source copy.

### When the verified root disappears mid-run

The installed package is versioned by folder, so an update published while a
run is working replaces the verified `PLUGIN_ROOT` directory with a sibling
under the new version number. That is a routine update arriving, not damage to
the run: every artefact that already passed its deterministic check was
checked, and a patch release does not un-check it.

When a command fails because `PLUGIN_ROOT` no longer resolves:

1. Re-obtain one `PLUGIN_ROOT_CANDIDATE` exactly as at start-up and re-verify
   it with its own `verify-plugin-root.py`. On success, adopt the new verified
   value for every remaining step and worker.
2. Every artefact that passed its deterministic check stands. Re-run a check
   under the new root only where the check had not yet passed when the root
   changed.
3. A worker that fails because its prompt carried the old path is an
   infrastructure failure: use its one infrastructure retry, with the new root.
4. Record one `FRICTION:` line naming both versions.

Stopping branches to avoid "mixing versions" is the failure, not the caution: a
real run lost its working wall, stick-in sheets and filing to a patch release
that changed none of them. Stop only when the re-verification itself fails, and
report that exactly as a start-up verification failure.

`PLUGIN_SOURCE_ROOT` is separate. It means a writable git checkout of this
package, the copy a source-writing step may edit. **A lesson run never writes
to it.** Nothing a run produces - a helper included - goes into the package or
out to the marketplace on the run's own judgement, because nobody has read it
yet. Only the shared build review log reads this value, and only to append to a
log, so resolve it at that step rather than up front:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/verify-plugin-root.py" --find-source "[PLUGIN_ROOT]"
```

The command finds a checkout only on a computer in developer mode: the one the
plugin is developed on, which has named its checkout once in the plugin's
settings (or, on a cloud box, in the `LESSON_RESOURCES_SOURCE_ROOT` environment
value). It never guesses from the running package or a folder name, because on
another teacher's computer a run that edits its own plugin turns it into a
private variant the next update overwrites. On success, store the value after
`PLUGIN_SOURCE_ROOT=`. On `PLUGIN_SOURCE_ROOT_UNAVAILABLE`, developer mode is
off: leave it unavailable and follow that step's own unavailable-source rule. Do
not search for a checkout yourself, and never write to an installed package
copy.

The active host owns the worker-launch mechanism. Claude Code may launch its
bundled named agent. Codex or another host may launch a normal worker. In either
case, every worker prompt must name the bundled role file and contain exactly one
of each of these lines:

```text
PLUGIN_ROOT: [literal verified PLUGIN_ROOT]
PYTHON: [literal PYTHON found at start-up]
```

In every runtime prompt template, `[PLUGIN_ROOT]` and `[PYTHON]` mean those
literal values. Replace the placeholders before launching the worker. Do not pass
the brackets or a host-specific plugin-root variable to the worker or its shell.
A worker whose prompt carries no `PYTHON:` line runs
`node "[PLUGIN_ROOT]/scripts/find-python.js"` once and uses its answer.

---

## Lazy runtime loading

The detailed orchestration playbook is stored at:

```text
[PLUGIN_ROOT]/skills/make-lesson/playbook-lite.md
```

Do not open, read or load `playbook-lite.md` directly.

The only allowed access to that file during a lesson run is:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/make-lesson-runtime.py" --slice "[SLICE]"
```

The command prints exactly one bounded, authoritative runtime slice. Read and
follow that returned slice. Do not ask the script for arbitrary headings or
ranges.

Load these two slices in this order, immediately after `PLUGIN_ROOT`
verification and before any run-specific work:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/make-lesson-runtime.py" --slice "execution"
"[PYTHON]" "[PLUGIN_ROOT]/scripts/make-lesson-runtime.py" --slice "setup"
```

**From there, every slice ends with a `## NEXT` block naming what it hands you,
and that block is how the run advances.** Work the slice you are holding, then
do what its NEXT block names - load the slice it points at and carry on. The
pipeline branches, so a NEXT block often names more than one step: unless a step
carries a condition this run does not meet, every step it names is due, and
starting one branch never finishes the others.

The order of work belongs to those blocks rather than to a list here, because a
list here can only key each slice to an event ("before the first Worksheet
Designer job", "before the first repair round") that you cannot recognise until
you are holding the slice that names it. Two failures come from exactly that
gap, so treat both as things NEXT tells you and a linear read of the playbook
will not:

- **A branch that has built and checked its resource is finished.** It does not
  wait for a sibling, and no later stage compares one resource against another.
  Only the deterministic finalisation waits for everything.
- **A designer that produces an intermediate file has not produced its
  resource.** Adaptation writes `adaptation.md`; the sheet still has to be
  designed and built after it.

Do not preload a later slice merely because the branch might eventually need
it, and do not reload unrelated slices. If a later repair returns to an earlier
route, reload only that route's named slice.

A runtime-reader failure is a pipeline configuration error. Stop and report its
exact `MAKE_LESSON_RUNTIME_ERROR:` line. Do not work around a missing or
malformed slice by opening `playbook-lite.md` directly or reconstructing the omitted
instructions from conversation history.
