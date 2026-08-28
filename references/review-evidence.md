# Review evidence

This reference owns visual finding identity, repair-scope fields and explicit
closure. It does not replace builder diagnostics and it does not decide who owns
a mechanical fault.

## Finding IDs

Assign an ID the first time a visual finding is recorded.

Use these prefixes:

- deck: `DECK-001`, `DECK-002`, ...
- worksheets: `WORKSHEETS-001`, `WORKSHEETS-002`, ...
- stick-in sheets: `STICK-IN-001`, `STICK-IN-002`, ...
- working wall: `WORKING-WALL-001`, `WORKING-WALL-002`, ...
- cross-resource consistency: `CONSISTENCY-001`, `CONSISTENCY-002`, ...

Allocate IDs in the order the first-pass reviewer records the findings. Never
reuse an ID for a different problem.

A new fault exposed by a repair receives a new ID. Do not change the old
finding's identity to describe the new problem.

## Required finding block

Every visual finding that is repaired, blocks approval, requires designer
repair or is accepted as minor uses this shape:

### [FINDING-ID]
- Classification: [BLOCKING / DESIGNER REPAIR REQUIRED / MINOR]
- Location: [resource and exact page/slide/sheet/spec location]
- Finding: [what the rendered output actually shows]
- Required change: [smallest required outcome, or `None - accepted minor`]
- Already passed: [specific content already checked and not to be reopened]
- Existing BUILD_DIAGNOSTIC: [verbatim diagnostic, or `None - visual-only finding`]
- Changed: [what this repair changed, or `None - no repair yet`]
- Unchanged: [what the repair explicitly left alone, or `Not applicable yet`]
- Potential cross-resource impact: [specific relationship(s), or `None`]
- Outcome: [OPEN / FIXED / ACCEPTED MINOR / DESIGNER REPAIR REQUIRED]
- Verification evidence: [render-manifest path plus page number and page SHA-256,
  or `None - not yet verified`]

`Outcome: FIXED` is valid only after the changed rendered output has been
looked at.

`Outcome: ACCEPTED MINOR` is valid only when teaching and usability are
unaffected.

`Outcome: DESIGNER REPAIR REQUIRED` remains unresolved until a later explicit
outcome for the same ID says `FIXED` or, after a valid redesign removes the
original requirement entirely, records that exact authorised removal and its
checked result.

## Confirmation

A confirmation file never erases the first finding. It contains:

## Repair outcomes

### [FINDING-ID]
- Outcome: [FIXED / OPEN / DESIGNER REPAIR REQUIRED / ACCEPTED MINOR]
- Changed: [exact changed part]
- Unchanged: [exact untouched part]
- Potential cross-resource impact: [specific relationship(s), or `None`]
- Verification evidence: [new manifest, page and page SHA-256]
- Observed result: [what the rebuilt output now visibly shows]

Every supplied repair ID must appear under `Repair outcomes`.

Silence is not closure. If an earlier `OPEN` or `DESIGNER REPAIR REQUIRED`
finding has no explicit later outcome, it remains unresolved.

## New findings during confirmation

A genuinely new fault receives the next unused ID for that resource and is
recorded in the ordinary finding sections. Never reuse the repaired finding's
ID merely because the new fault appeared after that repair.

## Build diagnostics

When a visual finding corresponds to a Wave 5 `BUILD_DIAGNOSTIC`, copy that
diagnostic verbatim into `Existing BUILD_DIAGNOSTIC`.

Do not create a new diagnostic signal, fault class or ownership table here.
Wave 5 mechanical diagnostics and the existing make-lesson routing remain
authoritative.
