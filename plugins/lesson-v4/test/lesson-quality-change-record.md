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

## Designer judgement follow-up, 6 September 2026

Two unreviewed designs exposed a gap between stated intentions and actual pupil
work. The maths rationale claimed independent reverse-exchange coverage that
the questions did not provide. Its original criteria also applied an exchange
without conditioning it on subtraction. History used authentic sources but an
insufficiently controlled clothing comparison, while standing subject guidance
favoured a paragraph outcome. These are semantic decisions, not schema faults.

Replaced the designer's earlier one-direction coverage reminder with a single
completion pass that executes criteria, checks preparation and demonstrated
learning in both directions, follows spoken and visible support together, and
checks transitions and optional-resource substitutions. The reviewer checks
the same evidence independently. The existing support owner now distinguishes
a blank response space from a separate worked reference. History guidance now
selects response formats by the understanding they demonstrate and checks what
a source comparison permits children to conclude. The reasoning catalogue's
preference for named-character claims was removed. No new runtime file, agent,
schema field, validator, or activity quota was added.

Manual sufficiency and boundary review of the revised instructions:

| Case | Required judgement |
|---|---|
| Essential reverse exchange taught but absent from independent evidence | Locate a real pupil response that demonstrates it; the coverage claim alone cannot pass. |
| An incidental optional extension is demonstrated once | No automatic extra independent question or extension of the objective. |
| A conditional procedure tells a child to exchange when adding to an empty thousands column | Execute both applicable and inapplicable branches; repair the condition. |
| A different skill teaches clockwise and anticlockwise turns but checks only clockwise | The same coverage check applies without depending on arithmetic keywords. |
| Formal royal clothing versus ordinary modern clothing supports a general historical-change claim | Supply suitable context/evidence or limit the inference; source authenticity and a generalisation warning are insufficient. |
| The same images are used to compare those two specific outfits | Permit the bounded observation; perfectly matched sources are not mandatory. |
| A diagnostic script gives the conclusion after a reference has been hidden | Judge the complete child experience; retain as supported rehearsal or repair the assessment. |
| A worked example uses different values and the child still executes the method | Retain enabling support; a blank answer space does not imply a blank reference. |
| An optional worksheet replaces an equivalent practice allocation | Permit it without inventing extra lesson minutes; make the substitution clear. |
| A connected historical argument is the intended learning | A prepared paragraph remains valid, as does a useful character claim in reasoning. |

These are manual checks of the control's sufficiency, not fresh model-generation
results. Existing reviewer authority, hand-back, review-packet and manifest
version tests passed (62 tests), as did plugin validation and whitespace checks.
Future consistency still requires observing generated lessons; instruction
changes and deterministic checks cannot establish that agents will always make
the intended judgement. The pasted classroom designs were not edited.


## Active-guidance consolidation, 6 September 2026

Resolved competing opening, scaffold, geography, history-frame and practice
instructions in their existing owners. Vocabulary and observation are chosen
at point of need; prepared models remain available; guided example counts
follow readiness rather than symmetry; component rehearsal can prepare an
integrated task. Geography response forms and source breadth follow the
objective rather than fixed variety. History no longer dictates image overlay
or compulsory original/adapted duplication. Short answers and quick sorts need
no artificial explanation-length requirement. Consolidated the humour loading
trigger and removed obsolete worksheet fullness commentary.

Working-wall guidance now judges each card's learning and readability. It
preserves defining diagrams and evidence while allowing useful text-led
references. Removed the lesson-wide picture-availability gate from the packet
check; it cannot determine pedagogical necessity. Preserved the source-table
handoff check and empty-wall rejection. Updated packet routing, fallback
guidance and the old visual-policy tests together. The designer and final
rendered review still own whether a card loses necessary visual teaching.

Manual boundary checks include direct vocabulary teaching, observation when
useful, complete worked references beside unanswered tasks, locate-only
geography, a prepared source frame, extra guided practice, and a necessary
diagram that cannot be replaced with text. Automated wall/review-packet tests
passed (67). No fresh lesson generation or classroom render was needed for
this instruction and packet-policy change; those results do not prove future
judgement consistency. Adaptation working-level defaults remain unchanged
pending confirmation of the teacher's intended default. No classroom artefacts
were modified.
