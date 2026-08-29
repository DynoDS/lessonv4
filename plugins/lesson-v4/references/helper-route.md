# The helper route

Read this when the helper check records a `build` decision: a visual the lesson
turns on that no live helper draws, or that the closest helper cannot draw as
designed. Most runs never reach it, which is why it is not in the runtime.

Resolve a writable checkout of the package:

```bash
python3 "[PLUGIN_ROOT]/scripts/verify-plugin-root.py" --find-source "[PLUGIN_ROOT]"
```

The command tries an explicit environment value, the running package root, then
the conventional checkout location, and verifies each the same way, so an
incomplete or read-only tree is refused rather than half-used.

## When a checkout is available

**One `helper-builder` covers every unresolved decision in the run, not one spawn
per helper.** Every helper build edits the same shared files - the slide
dispatcher, the worksheet registry, the parity manifest, the two catalogues - so
two builders running at once collide in them, and running them one after the
other repeats the whole read-the-reference, wire-four-surfaces, render, guard
cycle for each. One spawn reads the guide once, wires them together and runs
`npm run check` once over the finished set.

Launch `helper-builder` with its bundled role file and exactly:

```text
PLUGIN_ROOT: [literal verified PLUGIN_ROOT]
PLUGIN_SOURCE_ROOT: [literal verified PLUGIN_SOURCE_ROOT]
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

When it returns, pass `[PLUGIN_SOURCE_ROOT]` as `PLUGIN_ROOT` to every Phase 2
designer and builder, so this lesson uses the helper now rather than waiting for
the installed copy to catch up.

## What may run while it builds

The build changes the package, not the lesson. So the work that has to wait is
the work that reads a package catalogue, and every designer and builder does
read one: the slide catalogue, the worksheet catalogue, the wall's two primitive
lists, the stick-in supported-visuals list. One of those is about to gain a
helper that was not there a minute ago, and a designer that read the old copy
designs around a hole that no longer exists. Hold all of them until the build
returns.

The picture stage reads none of them. It reads the frozen photo contract and
writes into `WORKING_DIR`, and on a picture-carrying lesson it is the longest
stage in the run, so start it beside the helper build rather than after it: load
the `phase2-core` slice now, freeze the photo contract and compile the picture
assignments exactly as that slice sets out, and launch the picture work. The
helper build and the picture work touch nothing in common, so neither can spoil
the other.

Two things keep this honest. If this run also recorded a `substitute`, take that
picture route revision **first**: it changes the photo contract you are about to
freeze, and a contract frozen mid-revision is the wrong one for the whole of
Phase 2. And if the lesson promises no photographs at all, there is nothing to
overlap and the helper build simply runs on its own, which is the ordinary case
for maths.

## When no checkout is available

Launch `helper-builder` with `WORKING_DIR` and no source root. It writes the
helper into `[WORKING_DIR]/pending-helper/` as a drop-in the teacher can copy in
later, rather than editing an installed copy, and this lesson takes the picture
route so no slide is left empty or carrying a poor stand-in.

Never ask the teacher to choose between these. Name the pending helper in the run
report's Helper gaps section and in the hand-off, so the next lesson of this type
is not the same lesson again.

## Close the decision

Re-record the use as `covered` with its live `helperKey`, or as `substitute` with
its reason, then re-run the check from the copy the helper actually landed in so
a just-built helper reads as live:

```bash
python3 "[PLUGIN_SOURCE_ROOT or PLUGIN_ROOT]/scripts/check-helper-coverage.py"   verdict --lesson-design "[WORKING_DIR]/lesson-design.json"   --verdict "[WORKING_DIR]/helper-check.json"
```

Require `HELPER_COVERAGE_OK`. A `build` still standing fails by design: by this
point it is `covered` or it is `substitute`.
