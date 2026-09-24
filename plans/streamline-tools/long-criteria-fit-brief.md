# Brief: how a long success-criteria list fits on a slide (investigation, no changes)

Daniel, a primary teacher who owns this lesson plugin, decided on 23 September 2026 (success-criteria decisions 3, 4 and 13, in `plans/2026-09-23-success-criteria-ledger.md` → Decisions taken and Read back):

- a method's steps are shown all together or not at all, never only some of them;
- a slide that is only the criteria is for criteria being taught or built, never where criteria go because they did not fit;
- the slide designer never turns a criteria table into lines and never reports the criteria back as unfittable: "There should be a way to make it fit. We might need to do another investigation on how to actually make it fit, even if that means a new slide template."

His standing limits: the criteria panel takes at most half the slide beside the work (15 September: "I never want success criteria to take more than 50% though"); text is never below 18pt, the smallest a child reads from the back; the criteria's words are never shortened, merged or reworded downstream; and a deck is always produced ("There is not a time where I want the PowerPoint slide deck to never be produced because of an error. It should work to fix it."). His clearer steps are often longer than the old short cues (for example `Put < or > between the numbers, with the open side facing the greater number.`, 77 characters).

**Your job is the investigation he asked for.** Change nothing in the plugin. Find out, with measurements, when the whole list does not fit today and what would make it fit within his limits, then recommend.

## What to find out

1. **How the panel is laid out and measured today**: the criteria panel on the `maths-*-sc` templates, `sc-panel` in free layouts, the Teach layouts, `success-criteria-panel.js` (the half-slide refusal), `content/steps.js` (the 18pt card fit and its refusal), `content/capacity.js`, and the slide designer's placement guidance (`references/slide-success-criteria.md`, `references/templates.md`, `references/slide-composition-playbook.md` §9). The plugin is `C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4`; its working tree carries the uncommitted 4.2.288 change, which is what to read.
2. **Where real lists stop fitting.** Take real criteria from saved designs (`lesson-design.json` under `C:\Users\Daniel\Projects\lessonv4\working`, `output\working` and elsewhere in that folder, excluding `node_modules` and `plans\streamline-tools\scratch`) and from his approved rewrites in `references/teacher-voice.md` → 10. Success criteria. Build test slides with the plugin's own builder in a scratch folder and measure: how many steps of what length fit in each existing panel shape at 18pt, beside a question and working space. Find the breaking point for each shape, and whether any saved lesson's list would break today.
3. **What could make a long list fit**, within his limits: for example a taller or wider panel shape inside half the slide, the full height of one side, steps in two columns inside the panel, tighter card spacing, the question placed differently, a new slide template, or anything else you find. For each option, say what it costs (the working space, the picture, readability, how children find step 4), whether it needs a builder change, and measure it where you can.
4. **What the slide designer should do meanwhile**, when a list does not fit any shape it has.

## Limits

Change nothing in the plugin or the repository outside your scratch folder, `C:\Users\Daniel\Projects\lessonv4\plans\streamline-tools\scratch\fit\` (never clear or reuse any other folder there; another agent is working in that area). Build and render only there. Do not commit anything.

## Your report

Write `C:\Users\Daniel\Projects\lessonv4\plans\2026-09-23-long-criteria-fit-investigation.md`:

- a plain-English summary for Daniel at the top (no code or file names, no em or en dashes, short chunks): when lists stop fitting today, what you recommend, and what it would cost;
- then the evidence: the measurements, the breaking points per shape, the saved lessons that would break, and the options with their costs;
- a recommendation, and what it would take to build it, as a proposal only.

Reply with a summary of no more than fifteen lines.
