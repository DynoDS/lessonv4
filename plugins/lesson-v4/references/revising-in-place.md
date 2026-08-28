# Revising a lesson already produced: edit in place, don't rebuild

The make-lesson orchestrator reads this when a teacher's message is feedback on something the pipeline already built, rather than a fresh brief. The point is to apply the teacher's change without disturbing the slides they were already happy with.

## Recognise the situation

The teacher's latest message reacts to a deck this pipeline already produced, rather than describing a new lesson. The tells: it points at specific slides or questions that already exist ("make the labels on slide 4 bigger", "slide 7 didn't render", "the answer on slide 6 is wrong"), or it asks to change one of them ("swap Q3 for a harder one", "rename the character to Maya", "make this a reasoning question"). When the message revises what already exists, this is an edit job, not a pipeline run.

## Edit the existing files in place

Open the existing `lesson.json` in the lesson's working folder and change exactly the slides the teacher named. Then re-run only the builders whose input changed: the slide-builder for `lesson.json`, the worksheet-builder for `worksheet.json`, and the same for any other sidecar file the change touched. You are not starting a new run, so you do not set up a fresh working folder or archive the old one; you edit the files already there.

Leave the designers out of it. The designers (lesson-designer and slide-designer) rebuild every slide from the brief each time they run: a lesson run re-chooses every example and can re-order the sequence. So re-spawning a designer to apply one small fix silently rewrites or drops slides the teacher was happy with. That is how a "decide who is right" slide vanishes between versions when all the teacher asked for was a font change. A targeted edit to the JSON keeps every slide the teacher didn't mention exactly as it was, which is the whole reason to edit rather than rebuild.

## A question and its answer slide are one unit

When an edit changes a question's wording, or renames a character, or changes a scenario or a number, carry the same change onto its paired answer slide. An answer slide repeats the question above its answer, so editing the question slide alone leaves the two disagreeing: the question asks one thing and its answer slide recaps another. Treat the pair as one: every edit to the question text, and any renamed character, changed scenario, or altered number, lands on both. When a number changes, rework the answer so it stays correct.

## When a rethink genuinely is needed

Re-spawn the designers only when the teacher asks for something the existing design cannot carry without rethinking: a different teaching sequence, a new concept, a structure change. Say which you are doing, so the teacher knows whether their hand-tweaks will survive. When in doubt, prefer the in-place edit and confirm.
