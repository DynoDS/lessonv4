# The temporary-fix route

Read this when a resource owner's focused repair returns `PLUGIN_GAP:`: the
specification is right and the plugin's own code will not draw or build it.

Before this route a build like that lost its resource. On 20 October 2026 the
stick-in pack could not print a world map naming the lesson's own places with
nothing shaded, and could only turn it into a "label the continents" task; with
nobody watching, the whole pack, sort cards included, would have gone. The
teacher's ruling (21 October 2026): fix it for this lesson in a copy, tell him,
and leave the plugin to him, because he may not want the change for every
lesson.

## Make the copy

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/temporary-fix.py" make --plugin-root "[PLUGIN_ROOT]" --working-dir "[WORKING_DIR]" --gap "[the PLUGIN_GAP line]"
```

Require `TEMPORARY_FIX_COPY=`. The copy is the plugin without its installed
libraries, which builds from it still find where they are.

## Launch the fix

Launch `temporary-fix-builder` with the launch fields `worker-launch.py spec`
prints for it and these lines: `PLUGIN_ROOT`, `PYTHON`, `WORKING_DIR`,
`OUTPUT_DIR`, `SCRATCH_DIR`, `FIX_COPY` (the printed copy), `GAP` (the owner's
`PLUGIN_GAP:` line and the build's diagnostic, verbatim) and `RESOURCE` (the
kind, its specification file, and this resource's exact `run-fixed-resource.py`
command). It changes only the copy, proves the change with the plugin's own
tests and by looking at the rebuilt page, writes a note for the teacher, and
records the fix.

## Take the result

On `TEMPORARY_FIX_READY`, require the resource's build summary with `ok: true`
and `temporaryFix: true`: that summary is the delivered resource. Any later
rebuild of that resource in this run uses the copy as its `--plugin-root`.

On `TEMPORARY_FIX_FAILED`, the resource takes the route it would have taken
without this one (the deck ships flagged, a sheet that does not fit is omitted
and named, a piece the pack cannot draw is excluded with its reason), so a fix
that did not work costs the lesson nothing it already had. One attempt per gap.

Record the round in the friction file like any repair, with the `Changed:` line
the fix returned.

## At finalisation

Once every build is finished, remove the copy; the record and the note stay,
and they are what the teacher keeps or leaves:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/temporary-fix.py" tidy --working-dir "[WORKING_DIR]"
```

## In the report

Under `## Helper gaps`: what `temporary-fix/note.md` says, in a sentence or
two; the folder `[WORKING_DIR]/temporary-fix`; that `/install-helper` over it
keeps the fix and doing nothing leaves the plugin as it was. Put the page it
affects under `Teacher flags`, because only the run has looked at it. The
report check refuses a report that leaves the folder out.
