# Bringing the run's records up to date after a design revision

Read this when `lesson-design.json` is revised once Phase 2 has begun: the
content-gap picture wave, a bounded decision the Lesson Designer settled as an
owner repair, or a redesign a re-review returned. A run with no such revision
never needs it.

## Why

Three records are written from the lesson as it stood at the start of Phase 2,
and later steps read them as though they still described it. The revision
rewrites the lesson and leaves all three as they were. On 7 October 2026 three
of twenty runs met one of them: a correct sheet refused in two lessons because
the helper record still described the old one, and in a third the Below and
Greater Depth sheets nearly lost because their pictures were merged onto a
picture list the revised lesson had moved on from. None of the three is a
fault in the resource, so no designer repair answers them. Bring the records
up to date before any designer is relaunched.

## The three records

**`helper-check.json`.** Run the Phase 1.5 `verdict` command again over the
revised design and the current `photo-requirements.json`. Each failure line
names a use the revision added, dropped or changed. Record those decisions
again and leave the rest:

- a lost visual a picture now supplies is `substitute` naming the published
  filename in `picture`, or `gap` with its reason;
- a use the design dropped loses its decision;
- a figure the revision changed (four clocks in a row now three) gets
  `featureChecks` written for the figure as it is now.

Require `HELPER_COVERAGE_OK`.

A `HELPER_RECORD_STALE:` line printed by a delivery check is this same job
arriving late. The delivery check reads the `lesson-design.json` beside the
record, skips a use the lesson no longer requires, and holds a changed use only
to its helper being present, so it does not refuse a correct resource; but the
changed figure's features went unchecked. Refresh the record as above, then run
that delivery check again.

**The photo contract.** From here on, every launch that names a photo contract
names the current `photo-requirements.json` (for the Worksheet Designer, the
path `select-worksheet` gives). The frozen Phase 2 file still lists the pictures
the lesson dropped and lacks the ones that replaced them. `build-provisional`
already merges adaptation pictures onto the current file, through `--canonical`.

**`adaptation.md`,** when it is already written and the revision changed what
the Expected sheet asks: its questions, how many there are, their numbers or
their pictures. Below and Greater Depth were planned as easier and harder than
a sheet that no longer exists, and nothing else looks at them again; a Below
sheet can end up no easier than the Expected sheet beside it. Relaunch the
Adaptation Designer once, on the revised design and its own `adaptation.md`,
to confirm each sheet is still easier or harder in the way it intended and to
change only what the revision broke. Then repeat the adaptation steps of Track
B from the voice editor's second pass, taking the next `a` number, before the
Worksheet Designer is launched again.

A revision that leaves the Expected sheet as it was skips this third step: the
adaptation still stands, and a second look would cost minutes for nothing.

## When adaptation cannot be built at all

A failed adaptation costs the children who most need a different sheet, which
is why the playbook gives it one fresh attempt on its exact failing line before
omitting it. When it is omitted, the Expected sheet is still delivered, and the
teacher report opens with one plain line above the files: there is no easier or
harder sheet this time, and why. A missing sheet named only among the flags is
found after thirty copies of the middle sheet have been printed.
