# Review the resources children will actually see

This is a final-output mode for the existing resource owner. Read this reference
when assigned `FINAL RESOURCE REVIEW`; do not restart the creation workflow.
Review the delivered file after all required and optional pictures are present.
The earlier preview and successful build are useful preparation, not this review.

The orchestrator supplies exact output paths, their render manifests, the approved
lesson design and the corresponding resource specification. Use `render-pages.py`
with the run's established render route. Verify each manifest before reusing it.
Inspect every page in order. Use overviews for continuity, then individual pages
where task wording, small evidence, a table or writing space cannot be judged
at overview size. Read relevant speaker notes as well as slides. If rendering
is unavailable, return UNVERIFIED with the reason; never report a visual pass
from JSON, extracted text or the build exit code alone.

Judge the resource as a child using it and as the teacher delivering it:

- **Readability:** the smallest necessary text and picture detail are usable at
  projection or print size. Headings, criteria and reminders support the current
  work without forcing that work into small type. Empty area earns its place
  through writing, attention or purposeful pacing, not a page-fill quota.
- **Task access:** identify every object and source children must use. At the
  first encounter an unfamiliar object has sufficient visible identity and
  context. Follow each comparison, pronoun and reference through transitions.
  “Both” needs both objects available; a source label needs a recognisable source.
  Children should not depend on a missing previous slide or an adult's unplanned
  explanation. Retain required support unless this task intentionally checks
  unaided understanding. A printed reference counts only if the plan actually
  provides it and children can read it while working.
- **Response space:** mentally complete every required action. Check the actual
  marks, phrases, labels, calculations and explanations against their allocated
  space. A drawing area and a written explanation can both be necessary. Space
  for one is not evidence of space for the other. An oral task needs no invented
  writing lines; a teacher's live model needs space for the marks being modelled.
- **Subject representation** (sheets): say specifically how the printed
  diagram, source, table or working surface expresses the relationship the task
  is about, and what it leaves the child to decide. Check the two failures a
  specification check cannot see. One is a relationship flattened into a prompt
  and a blank because that was the shortest route to a correct page. The other
  is a page that has quietly answered part of its own question - a zero already
  printed where the child was to write one, a tint or a tick that marks the
  correct case, a heading that classifies a source, a record with exactly as
  many rows as there are solutions. Where a scaffold like that was deliberate
  the design says so; where it is not in the design, it is a fault.
- **Visual finish** (sheets): say specifically what the hierarchy, alignment,
  proportional allocation, repeated components and print-scale quality actually
  do on the delivered page. Given values and blank targets must be visibly
  different states. Repeated items must be drawn the same way. Blank area must
  belong to the child rather than sit under a short block. "Looks premium" is
  not an observation; name what you saw.

  Four of these are worth naming, because three worksheet packs shipped
  carrying them while every mechanical check passed, and each has a near
  neighbour that is perfectly fine. What separates them is always the same
  question: **is this room the child's, or is it the page's arithmetic showing
  through?**

  - **A box bigger than the answer it holds.** A blank rectangle taking a third
    of a page under a heading; a 30mm row waiting for one four-digit number.
    The fine neighbour is a genuinely open drawing or design task, where the
    surface IS the work. Tell them apart by what the child puts in it: four
    foods drawn, labelled and annotated wants the room, and one number does
    not.
  - **A page composed around a photograph's file** rather than around the
    object children are asked to look at - one source printing twice the height
    of the one beside it because the photographer stood further back, or a
    subject left small inside a canvas of empty studio white. The fine
    neighbour is a comparison where the difference in size is the evidence, and
    the design will say so.
  - **A heading against the physical edge of the paper**, outside the margin
    the rest of the page is aligned to.
  - **Furniture standing in for a task**: two drawn figures and two speech
    bubbles where the work is one claim and an explanation, a second speaker
    called "You", a sorting table's tinted heading band around what should be
    paper.

  None of these is repaired by changing the questions, and none is a reason to
  cut work. Report them with the page and what you saw; composition goes to the
  resource designer.

Judge a sheet at its printed size with the production font loaded, and check it
in greyscale as well: nothing a child has to do may depend on telling two
colours apart. A cosmetic finding never authorises changing content, reducing
response capacity or invoking a fit-priority cut; a bounded attempt that cannot
improve a usable page keeps that page and reports the unresolved finish issue
rather than declaring it fine or discarding the sheet.

For slides, apply `teacher-slide-visual-profile.md` and the applicable composition
rules. For sheets, apply `worksheet-visual-profile.md` and the response
requirements in `worksheet-designer.md`.
For walls, retain the Working Wall builder's existing physical page check and
also judge whether the intended relationship can be retrieved from the wall.
For stick-ins, judge at their intended printed size rather than enlarged on screen.

Record material faults with file, page, visible evidence, impact and responsible
owner. Group related faults into one focused repair request. Composition goes
to the resource designer; a wrong published picture uses the existing picture
repair route; missing teaching, misleading content or a changed learning demand
goes to Lesson Designer and the existing design review. Do not rewrite approved
wording or invent teaching during a visual repair. A supplied source identity may
be surfaced visibly without inventing a new interpretation of the source.

After repair, rebuild and render the affected resources. Review the changed pages
and their dependent neighbours; inspect the entire sequence again if its order
or slide count changed. Record coverage for the current manifest only. Unchanged
pages may reuse previous inspection only when their page hashes match. A changed
picture or specification does not inherit a pass for an earlier output.

Write the assigned review JSON with one entry per delivered resource:

```json
{
  "schemaVersion": 1,
  "resources": [{
    "path": "[absolute delivered file path]",
    "owner": "slide-designer",
    "manifest": "[absolute render-manifest.json path]",
    "reviewedPages": [1, 2],
    "status": "PASS",
    "advisories": [],
    "evidence": {
      "readability": "Specific observation about necessary text and visuals.",
      "taskAccess": "Specific observation about evidence and references at the task.",
      "responseSpace": "Specific observation about the required responses, or why none is needed.",
      "subjectRepresentation": "Sheets only. Specific observation about how the printed surface expresses the relationship and what it leaves the child to decide.",
      "visualFinish": "Sheets only. Specific observation about hierarchy, alignment, allocation, repeated components and print-scale quality."
    },
    "findings": []
  }]
}
```

`subjectRepresentation` and `visualFinish` are required on a worksheet review
and are not asked for on a deck. The validator enforces that, so a sheet review
that leaves either one out fails the gate rather than passing quietly.

Allowed statuses are PASS, REVISE and UNVERIFIED. PASS has no unresolved findings.
REVISE findings name the fault and owner; UNVERIFIED names the missing evidence.

**`findings` blocks; `advisories` records.** A bounded finish problem on a page
that is genuinely usable - a composition no rearrangement improved, a figure
plainer than the reference - is an observation, not a fault, and it belongs in
`advisories` with the same specificity a finding would carry. A PASS may hold
advisories. This exists so that the honest answer and the passing answer are the
same answer: a reviewer whose only choices are a clean pass and a blocked run
will write the clean pass, and the observation reaches nobody. What must never
go in advisories is a material access or correctness fault; that is a finding,
and it blocks.
Use the actual owner: slide-designer, worksheet-designer, working-wall-builder
or stick-in-sheets-designer. Do not write placeholder evidence or infer a pass
from the fact that every page was opened. Counts and hashes establish coverage
and freshness; your judgement establishes usability.
