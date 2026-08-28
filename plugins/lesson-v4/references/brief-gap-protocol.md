# Brief-Gap Protocol

A standing instruction for every downstream specialist in the pipeline - slide-designer, slide-builder, worksheet-designer, working-wall-designer, stick-in-sheets-designer, image-scout, adaptation-designer, and any future agent that reads a lesson-designer brief and produces a structural artefact.

---

## The principle

When the lesson-designer's brief asks for something the artefact cannot immediately deliver as described, try to resolve the exact need faithfully before falling back. Check the artefact's documented helpers, assets and supported configurations; consider a faithful composition of existing parts, the appropriate required-image or diagram route, or an exact new-helper request. Do not jump straight to refusing the lesson, and do not quietly substitute a representation that changes or lowers the intended teaching.

If the exact need still cannot be produced in the current run, render every faithful part that can stand without changing the lesson, flag the exact remaining gap in the artefact's `notes` field, and continue the package wherever possible. Failure is a last resort and one missing helper does not by itself cancel the whole lesson.

Do not invent pedagogical content to bridge the gap. No parenthetical stage directions slipped into question text, no paraphrased questions that "almost mean the same thing", no substitute photo subjects that approximate the named one, no rewritten success criteria that fit a smaller slot, no prose description of a visual standing in for a picture the artefact cannot draw. The lesson-designer owns those decisions, even when their brief and your artefact disagree.

## Slide Designer route

The generic continue-and-note route below does not govern Slide Designer. Slide Designer uses the current three-state contract because an unfinished or unfaithful slide specification must not look final.

### When helpers are available

Check the exact helper contract, built-in assets, faithful compositions, required-picture route and required-diagram route before declaring a gap. If one existing route preserves the source content, representation and interaction, use it. Do not improvise a weaker lesson.

Use one of the named outcomes required by the orchestrator:

- `SLIDE_HELPER_GAP` when a load-bearing representation or physical treatment is not supported by the current helper or template system and a new helper is the honest fix;
- the relevant design or content gap when the problem belongs upstream rather than to rendering.

For a helper gap, name:

- the source unit;
- the exact required capability;
- the representation or configuration it must preserve;
- why existing helpers cannot faithfully realise it;
- any slides already completed and safe to preserve.

Follow the exact checkpoint and resume contract in this section. Do not create your own checkpoint format.

### When the prompt contains `HELPERS_UNAVAILABLE`

Use the same faithful composition ladder. For a branching decision map, use a sequence of question cards followed by result cards. Keep every branch, result and reading order unchanged. Do not return `SLIDE_HELPER_GAP` only because source editing is unavailable.

If no existing composition preserves the settled learning, return the ordinary named design or content gap. Do not write a private helper checkpoint because there is no helper build to resume.

### When the prompt contains `HELPERS_IN_PROGRESS`

Use this route only when the spawn prompt contains `HELPERS_IN_PROGRESS` for a helper-builder that is already queued or running. A missing helper blocks only the slide or slides whose settled representation requires one of its unresolved helper IDs.

Complete every source unit that does not depend on an unresolved helper. Do not wait while holding the worker. Do not substitute a weaker representation.

Write `[WORKING_DIR]/lesson.partial.json`. Do not create or update canonical `[WORKING_DIR]/lesson.json`.

The partial file uses the normal lesson root fields and contains completed slides plus one placeholder for each blocked source unit. Add this root object:

```json
{
  "checkpoint": {
    "schemaVersion": 1,
    "status": "SLIDE_HELPER_GAP",
    "attemptId": "[ATTEMPT_ID]",
    "sourceSnapshot": "[absolute SOURCE_SNAPSHOT path]",
    "sourceSnapshotSha256": "[lowercase raw-byte SHA-256]",
    "requiredHelpers": [
      "helper:[name]:[capability]"
    ],
    "blockedUnitIds": [
      "lesson-section/teaching-sequence/unit-001"
    ]
  }
}
```

Each blocked unit appears exactly once as:

```json
{
  "title": "",
  "elements": [],
  "checkpointBlocked": true,
  "designUnitId": "lesson-section/teaching-sequence/unit-001",
  "requiredHelpers": [
    "helper:[name]:[capability]"
  ]
}
```

`sourceUnitId` is authored by Lesson Designer in `lesson-design.json` and is never constructed here. Copy that value byte-for-byte into checkpoint `designUnitId`. Every ID in `blockedUnitIds` must occur exactly once in a slide object with `checkpointBlocked: true` and the same `designUnitId`. Every helper ID used by a blocked placeholder must occur exactly once in root `requiredHelpers`.

Parse the partial file. Do not run the final slide check or build it. Return:

```text
SLIDE_HELPER_GAP
Attempt: [ATTEMPT_ID]
Checkpoint: [WORKING_DIR]/lesson.partial.json
Required helpers: [comma-separated helper IDs]
Blocked source units: [comma-separated source-unit IDs]
Completed slides: [count]
```

### When the prompt contains `RESUME_CHECKPOINT`

Read the current lesson design, the current frozen or merged photo contract named by the prompt, the checkpoint, the checkpoint's immutable source snapshot, and the new attempt snapshot. Recompute raw-byte hashes.

Reuse a completed slide only when no changed source can affect it. Rebuild every completed slide that a changed source can affect. When no narrower safe boundary exists, rebuild that slide. Complete every blocked unit after all of its required helper IDs have passed.

Remove the root checkpoint and every blocked placeholder. Write the candidate to `[WORKING_DIR]/lesson.json.tmp.[ATTEMPT_ID]`, run the complete Slide Designer check and visual self-read, and atomically replace canonical `lesson.json` only after the check passes. List `Reused slides:` and `Rebuilt slides:` in the completion result. Delete `lesson.partial.json` only after canonical `lesson.json` has been replaced by the checked candidate and the completion report carries the exact successful check line.

On a failed final check, retain the checkpoint and the temporary candidate. Return `SLIDE_DESIGN_CHECK_FAILED` with the unresolved diagnostics.

### Null pupil instruction

The Slide Designer's narrow presentation-furniture exception remains valid. When `pupilInstruction` is null on a pupil-action unit, it may author one narrow child-facing title or instruction that only names the already-settled action. That furniture does not add a task, concept, phase or pedagogical choice, and it may not add or change content, method, medium, condition, response count, recording requirement, success standard or answer.

### Precedence

For Slide Designer, this section overrides any generic instruction below that says to place a load-bearing gap only in `notes` and continue to a final specification.

## Why this exists

Every downstream specialist sits between a pedagogical brief (what the lesson means) and a structural artefact (a slide, a worksheet, a wall card, a photograph). Sometimes the two appear to contradict:

- The brief asks for the modelled answer to "appear on screen" but the chosen template has no pre-fill slot.
- The brief names a representation the helper catalogue can't render at the size needed.
- The brief asks for a picture subject the picture stage can't realistically obtain.
- The brief specifies a worksheet question shape no helper supports.

When that happens, the easy move is to invent pedagogical content to honour the brief — a parenthetical telling the teacher what to do, a question reworded to fit a helper, a different photo subject that approximates the original. The slide-designer that wrote *"(The teacher will write the digital time below the clock.)"* into a child-facing question text was doing exactly this: improvising pedagogy because it read the brief as an unfillable demand it had to meet.

The cost of this move is that pedagogical decisions get made by an agent that doesn't know the lesson's full context. The lesson-designer chose the words, the question, the visual, the misconception — those choices live in a wider plan the downstream agent only sees fragments of. Inventing to bridge a gap silently rewrites the lesson, and the teacher never sees the rewrite happened.

The cost of flagging instead is one extra `notes` line in the output. The orchestrator surfaces flags to the teacher, the teacher decides whether to re-run with a clearer brief, and the lesson stays consistent across slides, worksheet, wall, and resources.

## How to apply

1. **Name the gap to yourself, then confirm it is real before you act on it.** The brief asks for X; your artefact's rules / templates / helpers / scout capacity don't provide a route to X. Be specific: what's the brief's wording, what's the constraint, what's the mismatch.

   Then check the constraint against the catalogue rather than against your memory of it. A gap you declare is treated downstream as settled fact: it justifies a thinner artefact, it reaches the teacher as an authoritative "this could not be done", and nobody revisits it. So it is worth one look at the shipped assets and your artefact's own helper list — `templates.md` §4 for slides, `references/worksheet-helpers/catalogue.md` for worksheets — before concluding the engine cannot do this. The case that taught this: a lesson wanted a blank world map for children to draw the lines of latitude onto, the designer knew the only *sourced* latitude image had the names already printed on it, and it dropped the picture and rendered a text list instead. A blank world map ships with the plugin and the `map` object draws it. The class lost the visual for the rest of the lesson, and the flag recorded a limitation that did not exist.
   
   Keep the resolution bounded but real: check where the capability would live, check whether existing parts can compose it faithfully, and check the appropriate required-image or new-helper route. Stop once those honest routes are exhausted; do not wander into unrelated redesign. An imagined gap costs the lesson a visual, while an endless search delays the whole package.

2. **Render the closest faithful version that respects your artefact's rules.** This usually means rendering what the artefact *can* do, not what the brief asked for. Examples:
   - *Slide-designer:* the brief and its Modelling resource state ask for a prepared example, live-complete helper, question/reference support or physical-demonstration support that the first template choice cannot carry. Check the catalogue for another compatible template or faithful composition before declaring a gap. For a Live-complete helper, preserve the exact blank or partly blank starting state; for Question and reference, show the exact question and useful references with no generic working box; for Prepared example, preserve the completed example. The teacher chooses how and where to model. Do not recast one resource state as another merely because its first template was inconvenient.
   - *Slide-designer:* the brief names a diagram or visual no content object or photo can draw — a built-up river cross-section, a labelled apparatus diagram, a custom map. Render the real photograph the lesson already provides for that subject (the source stream, the aerial meander), and where the slide's job is to hold a reference children label in their own books, render the renderable reference it has — the contrasting photos, the success-criteria checklist, the sentence frame. Put the absent diagram in `notes`. A sentence describing a picture is not the picture: dropped into a child-facing slot it reads as noise from the back of the room, and on a labelling slide it leaves nothing to label. The teacher (or the next iteration, once a diagram primitive exists) picks the description up from `notes`.
   - *Worksheet-designer:* the brief specifies a question shape no helper supports. Your own rule 9 carries the ladder: compose from existing helpers, then keep the question's words and change how it is asked rather than whether, and flag in `notes` only a question that cannot be asked honestly at all. Never bend a helper into a shape it does not draw.
   - *Image-scout:* the brief names a photo subject too specific to source. Pick the closest reasonable photograph.
   - *Working-wall-designer:* the brief implies a card type the renderer doesn't yet support. Render text-only and note the missing primitive.

3. **Flag the gap in `notes` (or your agent's equivalent flag channel).** Name what the brief asked for, what you rendered instead, and what would resolve the gap upstream. Keep it short — one or two lines.

4. **Continue.** Do not stall, do not refuse to produce output, do not request a re-run. The pipeline runs to completion with the closest faithful version; the teacher decides whether to re-run with adjustments.

## The line that separates legitimate work from invention

Downstream specialists still make legitimate decisions inside their own artefact domain: picking templates, choosing valid helper geometry, placing exact upstream content into slots, fitting response targets onto a worksheet, deciding which wall support earns scarce space, and choosing photograph composition. They do not author replacement pedagogy, paraphrase a non-null `pupilInstruction`, or compose a new teacher script when the source unit already supplies `speakerNotes`.

When a source unit has `pupilInstruction: null`, most downstream specialists do not invent an instruction merely to fill a slot. Slide Designer has one explicit exception in the Slide Designer route above: one short piece of presentation furniture may name the already-settled action. No specialist invents a teacher script when `speakerNotes.script` is null.

The line is crossed when the specialist starts making decisions in the *lesson-designer's* domain — what the question says, what the modelled answer looks like, whether the teacher should write something live, what the misconception is, what the success criteria say. Those decisions are upstream. When the brief and the artefact contradict, the answer is never to make those decisions yourself.

The simplest test: *if I render this, will it teach the lesson the lesson-designer designed, or will it teach something I decided?* If the latter, you've crossed the line — flag instead.

## What this protocol does not change

- **Template choice, helper choice, layout, photo composition, exact upstream wording placement** — all of this is still your domain. Render confidently. The protocol applies only when an apparent contradiction would otherwise force you to invent pedagogical content.
- **Existing flag patterns** — every specialist already has a `notes` field or an equivalent (like `rationaleNote`). The protocol uses these existing channels; it doesn't add a new one.
- **Verbatim-copying rules** — every specialist already has rules requiring verbatim copying of upstream content (questions, success criteria, speaker notes). The protocol reinforces those rules; it doesn't override them.
