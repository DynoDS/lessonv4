# Lesson quality changes, September 2026

The package now distinguishes lesson-design judgement from final-resource
usability. Design review records separate pedagogy and teacher-fit verdicts,
includes observation prompts in the pupil-facing reading view and checks whether
the teaching prepares children for a meaningful response to the objective.

Composition guidance preserves necessary evidence and support across transitions,
chooses context and detail views for the relationship being taught, routes title
selection to the teacher's heading guidance and reserves space for the actual
responses children and the teacher need to produce. Working walls must retain
the planned learning relationship rather than only its labels.

Final resource review runs after pictures and builds have settled. Existing
resource owners inspect current rendered outputs in review-only mode. They check
readability, task-time access to sources and references, and response space.
Findings use the existing focused repair route, with pedagogical changes returned
upstream. Rebuilt outputs require fresh review evidence. COMPLETE requires a PASS
receipt whose source, PDF and page hashes match each delivered visual resource.
Unavailable rendering is reported as UNVERIFIED. These checks establish review
coverage and freshness, not the quality of the reviewer's judgement.

Renderer changes include purple question labels, text-sized field areas on
evidence cards, preserved worksheet line breaks, configurable completion blanks,
and omission of absent multiple-choice stems. Projected tables share header/body
fitting and enforce a 20 pt minimum. Tables that cannot meet it need a different
arrangement; the engine does not silently shrink them to 10 pt.

Validation includes the saved history failure, which now stops at slide 17's
insufficient table height; a readable table with different subject content,
rendered through PowerPoint; regressions for stale or incomplete final reviews;
and the existing pipeline, builder and worksheet suites. No new lesson-generation
trial was required for this release. Consistency of future agent judgement remains
an empirical question and is not established by passing deterministic tests.

No classroom outputs, private chat evidence or temporary render files are part
of this change set. Existing role model settings are retained; their stale test
expectations have been aligned with the configured roles. Both plugin manifests
share the release version.
