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
up to date before any designer is relaunched or caught up.

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

## The resources the designers were already making

A designer launched before the revision read the lesson as it was. It is not
stopped and not started again: most of what it is making the revision never
touched. Each resource is caught up once two things are true, in whichever
order they happen: its designer has returned, and the revision is validated
and reviewed. A resource whose designer finishes first waits for the revision
before anything is built from it or launched on it (the Slide Decorator, the
wall and stick-in designers that read `lesson.json`, the fixed build). A
designer launched after the revision reads the revised lesson and needs none
of this.

Ask what the revision reaches, naming every specification written so far:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/design-revision-catch-up.py" changes   --working-dir "[WORKING_DIR]" --spec "[WORKING_DIR]/lesson.json"   --spec "[WORKING_DIR]/worksheet.json" --spec "[WORKING_DIR]/working-wall.json"   --spec "[WORKING_DIR]/stick-in-sheets.json"
```

- `REVISION_TOUCHES_NOTHING [file]`: that resource goes on as it stands.
- `REVISION_TOUCHES [file]` with its pages: send that owner one catch-up job
  through the Phase 3.5 route, with this block. It is the job Phase 3.5
  describes as delivering another owner's approved revision. The repair roles
  bar a change of wording, and here the wording is what changes, so the block
  has to say so itself:

```text
FOCUSED REPAIR
Finding: The lesson was revised after this was written.
Location: [every page line the command printed for this file, with its reason]
What must change: Bring these pages up to the current lesson-design.json and
photo contract, words, pictures and tasks included. Read
[PLUGIN_ROOT]/references/catching-up-after-a-revision.md first: it governs
this job, and its check takes the place of the repair-scope check, so return
no `Repair scope:` line.
Already passed - leave unchanged: every page not listed above.
```

  Its success check is the resource's ordinary check and then:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/design-revision-catch-up.py" check   --working-dir "[WORKING_DIR]" --spec "[WORKING_DIR]/[spec].json"
```

Require `REVISION_CARRIED_OK`, and run it yourself after the job returns. On
`REVISION_NOT_CARRIED`, give the owner one more catch-up carrying those exact
lines. If a line survives that, build and deliver the resource and put each
surviving line in the teacher flags: the teacher can put one page right, and
cannot teach from a deck that was withheld.

- `REVISION_BASELINE_MISSING`: the lesson as the designers read it was not
  kept, so nothing can say which pages are old. Relaunch each designer that
  started before the revision, on the revised lesson. The copy is kept for you
  when a lost essential picture is announced (`REVISION_BASELINE_OK` beside
  `PICTURE_ESSENTIAL_LOST:`). Before any other revision, keep it yourself
  with the same script's `mark --working-dir "[WORKING_DIR]"`.

The check finds what was left behind: a retired picture, a sentence the lesson
no longer says. It cannot see a new sentence that was never brought across;
the owner reads each listed page against its unit for that, and its
`Unchanged:` line names the pages it found already matched.

## When adaptation cannot be built at all

A failed adaptation costs the children who most need a different sheet, which
is why the playbook gives it one fresh attempt on its exact failing line before
omitting it. When it is omitted, the Expected sheet is still delivered, and the
teacher report opens with one plain line above the files: there is no easier or
harder sheet this time, and why. A missing sheet named only among the flags is
found after thirty copies of the middle sheet have been printed.
