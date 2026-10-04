# Revising something already produced: edit in place, don't rebuild

Two audiences, one principle: a change to something that already exists is a change to the part that is wrong, and everything else stays exactly as it is.

The make-lesson orchestrator reads this when a teacher's message is feedback on something the pipeline already built, rather than a fresh brief. The point there is to apply the teacher's change without disturbing the slides they were already happy with.

Any worker changing a file it has already written reads "Changing a file you already wrote" below. The point there is the same one a level down: alter the lines the job names, rather than replacing the document that holds them.

## Recognise the situation

The teacher's latest message reacts to a deck this pipeline already produced, rather than describing a new lesson. The tells: it points at specific slides or questions that already exist ("make the labels on slide 4 bigger", "slide 7 didn't render", "the answer on slide 6 is wrong"), or it asks to change one of them ("swap Q3 for a harder one", "rename the character to Maya", "make this a reasoning question"). When the message revises what already exists, this is an edit job, not a pipeline run.

## Edit the existing files in place

Open the lesson's working folder (`[OUTPUT_DIR]/working/[lesson-slug]`, found by the lesson's title; ask which when more than one could be meant) and change exactly what the teacher named, in each file that shows it (`lesson.json`, `worksheet.json`, `working-wall.json`, `stick-in-sheets.json`). Then rebuild only the resources whose file changed, each with `run-fixed-resource.py` and the kind, folders and lesson name its build used (`slides`, `worksheets`, `wall`, `stick-in`; its summary in `build-results/` holds them). You are not starting a new run, so you do not set up a fresh working folder or archive the old one; you edit the files already there.

Leave the designers out of it. The designers (lesson-designer and slide-designer) rebuild every slide from the brief each time they run: a lesson run re-chooses every example and can re-order the sequence. So re-spawning a designer to apply one small fix silently rewrites or drops slides the teacher was happy with. That is how a "decide who is right" slide vanishes between versions when all the teacher asked for was a font change. A targeted edit to the JSON keeps every slide the teacher didn't mention exactly as it was, which is the whole reason to edit rather than rebuild.

## A change lands on every resource that shows it

A change the teacher asks for lands on every resource that shows it, and nothing else changes. Renaming the character to Maya changes the slides, the speaker notes, the worksheet and its answer key, and any wall card or stick-in piece that carries the name; every other slide stays exactly as it was.

A change to words children see is made in `lesson-design.json` too, because the next lesson reads it for the exact words children saw; nothing is redesigned. Re-run its check, `"[PYTHON]" "[PLUGIN_ROOT]/scripts/validate-lesson-design.py" "[WORKING_DIR]/lesson-design.json" "[WORKING_DIR]/photo-requirements.json"`, and require `LESSON_DESIGN_OK`.

When `filing.txt` in the working folder says `DELIVERY=folder` or `DELIVERY=sorted`, save the rebuilt files again with the `run-fixed-resource.py deliver` step the lesson's save used (`build-results/delivery.json` holds the command it ran), adding `--revision`. Each fixed file replaces the one this lesson saved there, except a file on the drive that is no longer the one it saved: that one is held back on a `DELIVERY_HELD_BACK:` line. Ask the teacher before saving over it, and on their yes save it again without `--revision`.

## A question and its answer slide are one unit

When an edit changes a question's wording, or renames a character, or changes a scenario or a number, carry the same change onto its paired answer slide. An answer slide repeats the question above its answer, so editing the question slide alone leaves the two disagreeing: the question asks one thing and its answer slide recaps another. Treat the pair as one: every edit to the question text, and any renamed character, changed scenario, or altered number, lands on both. When a number changes, rework the answer so it stays correct.

## Changing a file you already wrote: edit the lines, not the file

This holds for every worker in the pipeline, not only the orchestrator, whenever the file already exists and the job is a change to part of it: a repair round, a validator failure, a resolved picture path, a correction found in a self-check.

Change the values the job names and leave every other byte where it is. Do not delete the file and write a fresh one, and do not re-emit the whole document from what you remember of it in order to alter one field.

Three things go wrong when a file is re-emitted whole. Everything not being repaired is silently re-decided, so a question, a note or an answer the teacher was happy with can come back subtly different or not at all, and nothing in the run says it changed. The diff stops being readable, so neither a reviewer nor the next repair round can see what the pass actually did. And the teacher watching the activity feed sees their lesson deleted and rebuilt for a one-word fix, which reads as a wipe.

Writing atomically is a different thing and still right: build the updated content, write it through a temporary file, then move it into place, so a crash never leaves half a file behind. Atomic means nobody sees a partial file; it does not mean the content has to be retyped.

The first authoring pass is the exception, because there is nothing yet to edit.

## When a rethink genuinely is needed

Re-spawn the designers only when the teacher asks for something the existing design cannot carry without rethinking: a different teaching sequence, a new concept, a structure change. Say which you are doing, so the teacher knows whether their hand-tweaks will survive. When in doubt, prefer the in-place edit and confirm.
