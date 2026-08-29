# The helper route

Read this when the helper check records a `build` decision: a visual the lesson
turns on that no live helper draws, or that the closest helper cannot draw as
designed. Most runs never reach it, which is why it is not in the runtime.

The route has two halves, and this lesson only ever runs the first.

**This lesson gets its picture from the picture route.** A helper built now has
been rendered by nobody and read by nobody, so it does not go into the package
and it does not draw anything in this deck. Take the `substitute` route for the
visual itself, exactly as the runtime sets out, so no slide is left empty or
carrying a poor stand-in.

**The helper is built anyway, and waits.** The lesson that needed it is where the
requirement is actually understood, and if nobody builds it here then the next
lesson of this type is this lesson again. So `helper-builder` writes it into
`[WORKING_DIR]/pending-helper/<name>/` as a complete drop-in, and a person
installs it later with `/install-helper`, when the pictures can be looked at.

## Launch the builder

**One `helper-builder` covers every unresolved decision in the run, not one spawn
per helper.** Every helper build wires the same shared files - the slide
dispatcher, the worksheet registry, the parity manifest, the two catalogues - so
building them together is one read of the guide and one wiring sweep instead of
several, and the drop-ins do not describe conflicting edits to the same lines.

Launch `helper-builder` with its bundled role file and exactly:

```text
PLUGIN_ROOT: [literal verified PLUGIN_ROOT]
WORKING_DIR: [WORKING_DIR]

HELPERS: [count]

HELPER 1: [the helperKey recorded in the decision]
BUILD OR GROW: [build a new helper | grow the named existing helper]
DEPICTS: [data | the real asset or projection this visual must be built on]
WHAT IT DRAWS: [plain English, the data fields it takes, and any rendering rule
the teaching depends on]
SURFACES: [which of slides, worksheets, wall, stick-in this visual reaches]
CANNOT CURRENTLY DRAW: [for a grow, exactly what the existing helper falls short of]

[repeat the block, numbered, for each further decision]
```

`DEPICTS` is the line that stops the failure this route exists to avoid. Write
`data` when the drawing is right by matching the lesson's own numbers, labels or
an agreed convention. When the visual shows a real place or a real object, name
what it must be built on instead - the shipped asset folder, or a stated
projection of real coordinates - because a coastline or a border drawn from
chosen coordinates renders cleanly and is wrong about the world.

There is no writable checkout to resolve, nothing to version, and nothing to
commit or push. If a lesson is holding a helper open for any of those reasons,
that is the old route and it no longer applies.

## What may run while it builds

Everything. The build writes into the run's own working folder and changes no
package catalogue, so no designer can read a stale one and nothing has to wait
for it. Launch the helper build and carry straight on with Phase 2 as the
runtime sets out - the picture stage, the designers, all of it.

Take this run's `substitute` picture revision **before** the photo contract is
frozen, as the runtime already requires: it changes the contract, and a contract
frozen mid-revision is the wrong one for the whole of Phase 2.

## Close the decision

Re-record the use as `substitute`, with a reason naming the helper now waiting,
then re-run the check:

```bash
python3 "[PLUGIN_ROOT]/scripts/check-helper-coverage.py" \
  verdict --lesson-design "[WORKING_DIR]/lesson-design.json" \
  --verdict "[WORKING_DIR]/helper-check.json"
```

Require `HELPER_COVERAGE_OK`. A `build` still standing fails by design: by this
point it is `substitute`, because no helper built in this run is live in this
run.

## Say it in the report

Name every waiting helper in the run report's Helper gaps section and in the
hand-off: what it draws, the exact folder it is waiting in, and that
`/install-helper` over that folder is what makes it real. That sentence is the
whole point of building it here, and a helper nobody is told about is a helper
nobody installs.
