# Catching a resource up after the lesson was revised

Read this when your `FOCUSED REPAIR` block's finding is `The lesson was revised
after this was written`.

## What happened

Your resource was designed while the picture search was still running, because
no designer is held for pictures. A picture the lesson could not do without
was then lost, and the Lesson Designer found another route to the same
learning: a different picture, a reworded task, sometimes a redesigned beat.
That revision has been validated and reviewed. `lesson-design.json` and the
photo contract in your prompt are the lesson now. The pages named in your
block were made from the lesson as it was.

Nothing is wrong with how those pages were designed. They are sound pages for
a lesson that has since moved on, so this is neither a repair of your
composition nor a new design pass.

## The job

For each page the block names, read its reason, then read that unit in the
current `lesson-design.json`, and make the page say and show what the lesson
now says and shows.

- **`built from [unit], changed in: [parts]`.** Compare the page with those
  parts of the unit. Where they differ, the lesson wins: copy its words
  exactly, as you would on a first pass. A part that changed may not reach
  your resource at all (a note for the teacher only, a field another resource
  draws). When the page already matches the unit, leave it and say so.
- **`names the retired picture [filename]`.** That picture left the lesson.
  Use the picture the unit names now, from the current photo contract.
- **`still says "[sentence]"`.** The lesson no longer says this anywhere. Put
  what the unit says now in its place, or take the line out when the unit says
  nothing in its place.

A changed unit can need more or fewer pages than it had: a task that lost a
source may no longer need its second slide, and a new beat may need one. Add
or remove pages inside that unit only, and keep the order of the units.

## What stays exactly as it is

Every page the block does not name. The revision did not reach those, and they
are finished work: leave their words, layout, pictures and order alone, even
where you would now compose one differently. On a named page, change what the
revision changed and keep the rest of your composition where it still holds
the content. This is the edit-in-place rule in
`[PLUGIN_ROOT]/references/revising-in-place.md`, and it matters more here than
usual, because a catch-up that redesigns the whole resource costs the run the
time that carrying on was meant to save.

## How it differs from an ordinary focused repair

An ordinary repair may not change a word a child reads, and
`check-repair-scope.py` holds it to that. On the named pages this job changes
words on purpose, to the lesson's own, so that check does not apply and you
return no `Repair scope:` line. You still author no wording of your own: every
word that arrives comes from the current lesson.

## Done

The resource's ordinary check passes, and then:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/design-revision-catch-up.py" check --working-dir "[WORKING_DIR]" --spec "[WORKING_DIR]/[your specification]"
```

prints `REVISION_CARRIED_OK`. A `REVISION_NOT_CARRIED:` line names a page that
still shows the earlier lesson and what it shows. That check finds only what
was left behind, so before you return, read each named page once more against
its unit for anything new that has not arrived.

Return the terminal marker your assignment names, with `Changed:` listing each
page you changed and what changed on it, and `Unchanged:` listing the named
pages that already matched.
