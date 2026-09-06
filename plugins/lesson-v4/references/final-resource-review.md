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

For slides, apply `teacher-slide-visual-profile.md` and the applicable composition
rules. For sheets, apply the response requirements in `worksheet-designer.md`.
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
    "evidence": {
      "readability": "Specific observation about necessary text and visuals.",
      "taskAccess": "Specific observation about evidence and references at the task.",
      "responseSpace": "Specific observation about the required responses, or why none is needed."
    },
    "findings": []
  }]
}
```

Allowed statuses are PASS, REVISE and UNVERIFIED. PASS has no unresolved findings.
REVISE findings name the fault and owner; UNVERIFIED names the missing evidence.
Use the actual owner: slide-designer, worksheet-designer, working-wall-builder
or stick-in-sheets-designer. Do not write placeholder evidence or infer a pass
from the fact that every page was opened. Counts and hashes establish coverage
and freshness; your judgement establishes usability.
