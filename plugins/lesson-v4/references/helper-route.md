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

Launch `helper-builder` with its bundled role file and exactly:

```text
PLUGIN_ROOT: [literal verified PLUGIN_ROOT]
PLUGIN_SOURCE_ROOT: [literal verified PLUGIN_SOURCE_ROOT]
WORKING_DIR: [WORKING_DIR]
HELPER: [the helperKey recorded in the decision]
BUILD OR GROW: [build a new helper | grow the named existing helper]
WHAT IT DRAWS: [plain English, the data fields it takes, and any rendering rule
the teaching depends on]
SURFACES: [which of slides, worksheets, wall, stick-in this visual reaches]
CANNOT CURRENTLY DRAW: [for a grow, exactly what the existing helper falls short of]
```

Wait for it. Then pass `[PLUGIN_SOURCE_ROOT]` as `PLUGIN_ROOT` to every Phase 2
designer and builder, so this lesson uses the helper now rather than waiting for
the installed copy to catch up.

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
