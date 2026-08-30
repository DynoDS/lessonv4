# Output Template

This file is the canonical shape and allowed-value reference for the authoritative lesson hand-off. Until the pedagogical decisions are complete, all rules that govern *what* belongs in the lesson live in the main agent and the matching teaching-sequence reference file.

On the normal initial make-lesson route, `[PLUGIN_ROOT]/scripts/lesson-design-scaffold.py` generates the mechanical IDs, ordinals, repeated source-unit envelopes and required top-level keys after the decisions are settled. Use the generated files as the starting point. Read only the section of this file needed when an exact allowed value or nested field shape is not already clear; do not reread the whole file merely to reconstruct keys the scaffold already generated.

When no scaffold command is supplied, this file remains the full fallback contract: read it once all lesson-design decisions are complete and serialise the hand-off manually through a real JSON serializer.

The lesson-designer produces three required canonical files:

1. **`design-decisions.md`** - the compact decisions record written before the final hand-off.
2. **`lesson-design.json`** - the authoritative pedagogical contract consumed downstream.
3. **`photo-requirements.json`** - the structured set of required photographs.

The normal initial scaffold route also leaves `lesson-design-scaffold-request.initial.json` in the working directory as non-authoritative build provenance. No downstream agent reads that request.

There is no default Lesson Analysis output. `Teacher orientation` remains part of `lesson-design.json` because it is used in the finished deck.

Write every completed JSON file with a real JSON serializer. Do not hand-build JSON strings or manually escape teacher scripts. Parse the authoritative JSON files, then run the lesson-design validator required by the lesson-designer agent before returning. The validator rejects every unresolved `__LESSON_DESIGN_FILL__` scaffold placeholder.

---

## `lesson-design.json`

Use exactly these top-level fields:

```json
{
  "schemaVersion": 1,
  "lesson": {
    "structure": "Skill-based",
    "yearGroup": 4,
    "subject": "Maths",
    "lo": "To ...",
    "displayedLo": "To ...",
    "durationMinutes": 45,
    "scope": "Complete lesson",
    "deferredLearning": null,
    "lesson2Direction": null,
    "stickingPoint": "..."
  },
  "teacherOrientation": "Teacher orientation: ...",
  "starter": {},
  "vocabulary": [],
  "trimmedVocabulary": [],
  "representations": [],
  "successCriteria": [],
  "stickyKnowledge": [],
  "misconceptions": [],
  "concepts": [],
  "teachingSequence": [],
  "ending": {},
  "worksheet": {},
  "slideDesignNotes": [],
  "flagsForTeacher": []
}
```

`structure` is exactly one of:

- `Skill-based`
- `Content-based`
- `Discovery`
- `Dialogic`
- `Task-Centred`

`scope` is exactly `Complete lesson` or `Lesson 1 of 2`.

For `Complete lesson`, both `deferredLearning` and `lesson2Direction` are `null`.

For `Lesson 1 of 2`, both are non-empty strings.

`stickingPoint` is the concise pedagogical sticking point the lesson was designed around. It replaces the final-report dependency that previously relied on Lesson Analysis.

### Stable IDs

Reusable decisions are defined once and referred to by ID:

- vocabulary: `vocab-001`, `vocab-002`, ...
- representations: `rep-001`, `rep-002`, ...
- success criteria: `sc-001`, `sc-002`, ...
- sticky knowledge: `sk-001`, `sk-002`, ...
- misconceptions: `mc-001`, `mc-002`, ...
- skill-based concepts: `concept-001`, `concept-002`, ...
- initial lesson photos: `photo-001`, `photo-002`, ...

Instructional source-unit IDs are separate from display labels and never contain label text. Use exactly:

- starter: `lesson-section/starter/unit-001`
- vocabulary entries: `lesson-section/vocabulary/unit-001`, `unit-002`, ...
- teaching sequence: `lesson-section/teaching-sequence/unit-001`, `unit-002`, ... in document order
- Apply: `lesson-section/apply/unit-001`
- Reflect: `lesson-section/reflect/unit-001`

The section plus ordinal is the stable identity for the current authored structure. `label` carries the human-readable name and may be corrected without changing the ID.

`sourceUnitId` stability means stability across label/text correction, **not** persistence across structural editing. Inserting, deleting or reordering an instructional source unit intentionally renumbers that section from the structural change onward. Treat that as an authoritative source change and let the existing source-snapshot/checkpoint invalidation rebuild affected work. Do not preserve stale ordinals across a purposeful redesign.

### Teacher orientation

`teacherOrientation` is the existing one-paragraph prep summary. It must begin exactly:

```text
Teacher orientation:
```

It is written last after the design is complete. It is not a Lesson Analysis and does not justify the design.

### Vocabulary

Each vocabulary entry is:

```json
{
  "id": "vocab-001",
  "sourceUnitId": "lesson-section/vocabulary/unit-001",
  "term": "equivalent",
  "definition": "Two amounts that are worth the same.",
  "visual": {
    "kind": "none"
  }
}
```

`visual.kind` is one of:

- `none`
- `emoji`
- `photo`
- `representation`
- `built-in`
- `description`

Use these exact shapes:

```json
{ "kind": "none" }
{ "kind": "emoji", "value": "🦴" }
{ "kind": "photo", "photoRef": "photo-001" }
{ "kind": "representation", "representationRef": "rep-001", "configuration": "vocabulary" }
{ "kind": "built-in", "value": "money: £1" }
{ "kind": "description", "value": "simple labelled comparison of the two terms" }
```

`trimmedVocabulary` contains only items actually removed from the brief:

```json
[
  {
    "term": "word removed from the brief",
    "reason": "why it does not earn a place in this lesson"
  }
]
```

Use `[]` when nothing was trimmed.

### Representations

Use `"representations": []` when no pedagogical representation is required. Never emit a prose sentinel such as `"Plain text only."`.

Every representation has a stable `rep-###` ID, a `name`, a `purpose` and one or more named configurations. Put `loadBearing` and `requiredFeatures` on each configuration, never on the representation root.

Define each pedagogically meaningful visual or representational family once, then put capability-critical state on the **configuration that actually uses it**:

```json
{
  "id": "rep-001",
  "name": "Part-whole model with coin reference",
  "purpose": "Connect each money amount to the partition used in the method.",
  "configurations": [
    {
      "id": "model",
      "description": "Whole value and coins visible; part circles blank for live completion.",
      "loadBearing": true,
      "requiredFeatures": [
        "one whole linked to two parts",
        "money amount remains visible",
        "the part being found stays blank or constructable"
      ]
    },
    {
      "id": "prepared",
      "description": "Completed worked example visible from the start.",
      "loadBearing": true,
      "requiredFeatures": [
        "one whole linked to two completed parts",
        "completed values visible from the start"
      ]
    },
    {
      "id": "vocabulary",
      "description": "Small labelled reminder.",
      "loadBearing": false,
      "requiredFeatures": []
    }
  ]
}
```

A symbol counts as a representation whenever the learning depends on its exact form. A UK three-pin plug and socket, a pound coin, a specific road sign or a named piece of apparatus is a representation with that form as a `requiredFeature`, however small it renders, because a child reads the form and not the caption. Declaring it here is what puts it in front of the helper check before any renderer starts; leaving it as a bare label sends the designer looking for the nearest emoji, and the emoji is drawn by the device rather than by the lesson. A general picture children recognise at a glance, where any reasonable drawing would do, is not a representation.

Declaring it is not the same as choosing where it comes from, and the second decision is yours too. A representation is drawn by an engine helper, and a helper is worth having when the visual is built from the lesson's own data - change the numbers, the labels, the categories or the child's marks and the picture changes with them. A fixed depiction of one real thing is the opposite: the same drawing every time, nothing computed from the lesson, and no second lesson wanting it with different data. Ask for that visual as a picture instead, `controlled-ai` with a complete generation prompt, because a staged image to a written prompt is exactly the thing the picture stage already produces and it arrives faithful without an engine learning to draw one unchanging object. The plug and socket, the road sign, the named apparatus all belong on the picture side. This is the one case where a source-based image is right even though a representation could name the visual.

`loadBearing` belongs to a named configuration because the same representation family may have a load-bearing live-complete state, a different load-bearing prepared state, and a non-load-bearing reminder state. A configuration with `loadBearing: true` must contain at least one non-empty `requiredFeatures` entry; a non-load-bearing configuration uses `requiredFeatures: []`. Do not copy one configuration's capability requirements onto every use of the representation.

A representation use is always an explicit object:

```json
{
  "ref": "rep-001",
  "configuration": "model",
  "interaction": "teacher-completes"
}
```

`interaction` is exactly one of:

- `view`
- `teacher-completes`
- `pupil-uses`
- `pupil-writes-on`

The representation registry owns the family meaning; each configuration owns its exact capability-critical state and required features. The source unit owns which configuration is used and how children interact with it. The resource designer owns physical placement and rendering mechanics.

### Success criteria

Define each success-criteria object once.

How-to steps:

```json
{
  "id": "sc-001",
  "type": "steps",
  "drawLive": false,
  "content": {
    "steps": [
      "Read the question.",
      "Choose the correct operation.",
      "Work it out.",
      "Check the answer."
    ]
  }
}
```

Reference table:

```json
{
  "id": "sc-002",
  "type": "reference-table",
  "drawLive": false,
  "content": {
    "columns": ["Question says", "Operation"],
    "rows": [
      ["altogether", "add"],
      ["difference", "subtract"]
    ]
  }
}
```

Labelled reference:

```json
{
  "id": "sc-003",
  "type": "labelled-reference",
  "drawLive": true,
  "content": {
    "items": [
      {
        "label": "Overlap",
        "text": "Matches both rules",
        "representationRef": "rep-002",
        "configuration": "reference"
      },
      {
        "label": "Outside",
        "text": "Matches neither rule",
        "representationRef": null,
        "configuration": null
      }
    ]
  }
}
```

`drawLive` preserves the existing optional draw-live decision. It does not prescribe where the teacher writes.

For a Skill-based concept, define the concept once:

```json
{
  "id": "concept-001",
  "name": "Read a value from the scale",
  "successCriteriaRefs": ["sc-001"]
}
```

Every My Turn, Our Turn and Your Turn for that concept uses exactly the same `successCriteriaRefs` array.

For non-Skill-based lessons, write:

```json
"concepts": []
```

### Sticky knowledge

Define each fact once:

```json
{
  "id": "sk-001",
  "text": "A half symbol is worth half of the key."
}
```

Do not store `during teaching`, `during practice` or `both`.

Instead, the lesson-designer decides exact availability by putting the ID in each source unit's `stickyKnowledgeRefs`. If a fact should be available in Teach 2 and Your Turn 1, those two units reference `sk-001`; units that should not expose it do not.

This is a pedagogical availability decision. Downstream designers may choose where the referenced fact physically sits, but they must not add or remove a sticky-knowledge reference.

When a Teach takeaway is exactly a sticky-knowledge fact, reference it instead of repeating the sentence:

```json
{
  "kind": "sticky",
  "ref": "sk-001"
}
```

A non-sticky takeaway uses:

```json
{
  "kind": "text",
  "text": "..."
}
```

### Misconceptions

Define each misconception once:

```json
{
  "id": "mc-001",
  "belief": "The bottom numbers should be added as well.",
  "correctiveFact": "The denominator names the size of the parts and stays the same here.",
  "strategy": "two-character disagreement",
  "reason": "The wrong rule is common and children should distinguish why it fails."
}
```

`correctiveFact` may be `null` when there is no single corrective sentence.

Attach `mc-001` to the exact source unit that surfaces or handles it through that unit's `misconceptionRefs`.

When the handling needs actual child-facing dialogue, questions or examples, those exact words belong in that source unit's `content` and/or `pupilInstruction`. The misconception registry is the trace, not a substitute for the actual task.

### Source-unit contract

The starter, every teaching-sequence beat and an included Apply/Reflect use exactly this common envelope:

```json
{
  "sourceUnitId": "lesson-section/teaching-sequence/unit-001",
  "label": "My Turn",
  "kind": "my-turn",
  "conceptRef": "concept-001",
  "content": {},
  "pupilInstruction": null,
  "taskStructure": null,
  "modellingState": "Live-complete helper",
  "representationRefs": [],
  "successCriteriaRefs": [],
  "stickyKnowledgeRefs": [],
  "misconceptionRefs": [],
  "photoRefs": [],
  "speakerNotes": {
    "script": "Say to children: ...",
    "teacherInfo": null,
    "lookFor": null
  },
  "answer": {
    "kind": "exact",
    "content": "37",
    "acceptanceCondition": null,
    "delivery": "teacher-only"
  }
}
```

`conceptRef` is required for Skill-based `my-turn`, `our-turn` and `your-turn`; otherwise use `null`.

`pupilInstruction` is the exact short child-facing instruction when this unit needs one. Use `null` when no separate instruction is needed. A downstream designer may choose its physical slot but must render non-null wording exactly once and must not paraphrase it.

`taskStructure` is `null` for an ordinary prompt. Use it when an option bank, sort or photograph-based evidence classification contains parts that must remain separate on the board. It stores pedagogical parts and their identity links, not slide layout. The Slide Designer still chooses the template, zones, card treatment and number of physical slides.

For a discrete option bank, use this exact shape:

```json
{
  "kind": "option-bank",
  "items": [
    { "id": "item-001", "label": "cell" },
    { "id": "item-002", "label": "wire" },
    { "id": "item-003", "label": "lamp" },
    { "id": "item-004", "label": "switch" }
  ]
}
```

Each item `id` is local to the source unit and uses `item-###`. `items` contains 2 to 12 entries. Each `label` is the exact child-facing option text. Preserve item order. Do not repeat these labels in `pupilInstruction`; the instruction names what to do with the bank. An option bank uses the ordinary `answer.content` route and never supplies `answer.structure`.

For a sort, use this exact shape:

```json
{
  "kind": "sort",
  "groups": [
    { "id": "group-001", "label": "Uses electricity" },
    { "id": "group-002", "label": "Does not use electricity" }
  ],
  "items": [
    { "id": "item-001", "label": "Kettle", "detail": null, "photoRef": null },
    { "id": "item-002", "label": "Television", "detail": null, "photoRef": null },
    { "id": "item-003", "label": "Bicycle", "detail": null, "photoRef": null },
    { "id": "item-004", "label": "Football", "detail": null, "photoRef": null },
    { "id": "item-005", "label": "Lamp", "detail": null, "photoRef": null },
    { "id": "item-006", "label": "Book", "detail": null, "photoRef": null }
  ]
}
```

For a photograph-based evidence classification, use this exact shape:

```json
{
  "kind": "evidence-classification",
  "fields": [
    { "id": "field-001", "label": "Object name" },
    { "id": "field-002", "label": "Electrical appliance?" },
    { "id": "field-003", "label": "Power source" },
    { "id": "field-004", "label": "Evidence" }
  ],
  "items": [
    { "id": "item-001", "photoRef": "photo-008" },
    { "id": "item-002", "photoRef": "photo-009" },
    { "id": "item-003", "photoRef": "photo-010" },
    { "id": "item-004", "photoRef": "photo-011" }
  ]
}
```

Each field `id` is local to the source unit and uses `field-###`. Each item `id` is local to the source unit and uses `item-###`. Every `photoRef` is required and already appears in the source unit's `photoRefs`. The item keeps the photograph's identity stable from the task to the answer. Do not put the object name in the task item when naming the object is part of the pupil task.

Keep `pupilInstruction` short and non-null when `taskStructure` is present. It names only the action. Do not repeat group labels, item labels or item details inside `pupilInstruction` or `content.task`.

Each group `id` is local to the source unit and uses `group-###`. Each item `id` is local to the source unit and uses `item-###`. `label` and non-null `detail` are exact child-facing strings. `photoRef` is `null` or one ID already present in the source unit's `photoRefs`.

`modellingState` is one of the four existing canonical states when the unit models something, otherwise `null`:

- `Prepared example`
- `Live-complete helper`
- `Question and reference`
- `Physical-demonstration support`

`speakerNotes.script` is either `null` or the exact read-aloud script beginning `Say to children:`.

`speakerNotes.teacherInfo` is either `null` or the existing short teacher-only information.

`speakerNotes.lookFor` is either `null` or one optional sentence beginning `Look for:`.

Do not put an answer line inside any speaker-note field. The answer object is the one source of truth.

`answer.kind` is exactly one of:

- `exact`
- `model`
- `standard`
- `none`

`answer.delivery` is exactly one of:

- `teacher-only`
- `answer-slide`
- `visible-in-unit`
- `none`

Keep these delivery meanings exact:

- `teacher-only` stores the answer, model or standard for speaker-note use and creates no visible answer slide.
- `answer-slide` stores the answer, model or standard for speaker-note use and also authorises a separate visible answer/reveal slide.
- `visible-in-unit` stores a completed prepared model that is visible as ordinary black teaching content in its source unit. It is not an answer reveal.
- `none` carries no answer, model or standard.

`answer-slide` is valid for `starter`, `your-turn`, `practise`, `use-learning`, `do-task`, `apply` and `reflect`. On any other source-unit kind, `answer-slide` is valid only when `answer.kind` is `model` or `standard`. An exact answer on a Do beat, Our Turn or another smaller check uses `teacher-only`.

Use:

```json
{
  "kind": "none",
  "content": null,
  "acceptanceCondition": null,
  "delivery": "none"
}
```

when no answer/model/standard is needed.

For a teacher-only answer:

```json
{
  "kind": "exact",
  "content": "37",
  "acceptanceCondition": null,
  "delivery": "teacher-only"
}
```

For an open model revealed after pupil work:

```json
{
  "kind": "model",
  "content": "A concise model response.",
  "acceptanceCondition": "Accept another response that uses the taught evidence accurately.",
  "delivery": "answer-slide"
}
```

For an exact answer to a structured sort, use:

```json
{
  "kind": "exact",
  "content": null,
  "structure": {
    "kind": "sort",
    "placements": [
      { "itemRef": "item-001", "groupRef": "group-001" },
      { "itemRef": "item-002", "groupRef": "group-001" },
      { "itemRef": "item-003", "groupRef": "group-002" },
      { "itemRef": "item-004", "groupRef": "group-002" },
      { "itemRef": "item-005", "groupRef": "group-001" },
      { "itemRef": "item-006", "groupRef": "group-002" }
    ]
  },
  "acceptanceCondition": null,
  "delivery": "answer-slide"
}
```

Every item appears exactly once. Each `itemRef` and `groupRef` resolves inside the same source unit's `taskStructure`. `answer.structure` is the sole answer source for this sort, so `answer.content` stays `null` and the same answer is not authored twice.

A structured answer does not change how `delivery` is chosen. The delivery rule above still decides it, and the structured answer reaches the speaker notes under every delivery. The example shows `answer-slide` because a starter earns a separate reveal; the same structured sort on a Do beat, an Our Turn or another smaller check uses `teacher-only` and stays in the notes. Never weaken a sort into prose, an option bank or a looser task shape because a beat cannot carry a separate answer slide.

For a model answer to a photograph-based evidence classification, use:

```json
{
  "kind": "model",
  "content": null,
  "structure": {
    "kind": "evidence-classification",
    "results": [
      {
        "itemRef": "item-001",
        "values": [
          { "fieldRef": "field-001", "value": "Hairdryer" },
          { "fieldRef": "field-002", "value": "Electrical appliance" },
          { "fieldRef": "field-003", "value": "Mains electricity" },
          { "fieldRef": "field-004", "value": "Plug and lead" }
        ]
      },
      {
        "itemRef": "item-002",
        "values": [
          { "fieldRef": "field-001", "value": "Manual can opener" },
          { "fieldRef": "field-002", "value": "Not an electrical appliance" },
          { "fieldRef": "field-003", "value": "No electrical power source" },
          { "fieldRef": "field-004", "value": "Designed to work by hand" }
        ]
      }
    ]
  },
  "acceptanceCondition": "Accept equivalent evidence that is visible in the photograph.",
  "delivery": "answer-slide"
}
```

Every item appears exactly once. Every result contains every field exactly once. Each `itemRef` and `fieldRef` resolves inside the same source unit's `taskStructure`. `answer.structure` is the sole visible answer source, so `answer.content` stays `null`. The identity link between each photograph and its result must survive every downstream slide split.

For a completed `Prepared example` that children are intentionally meant to see from the start, keep the completed outcome in the structured `answer` object and use:

```json
{
  "kind": "model",
  "content": "The completed model visible from the start.",
  "acceptanceCondition": null,
  "delivery": "visible-in-unit"
}
```

`visible-in-unit` is valid only with `modellingState: "Prepared example"`. It is not an answer reveal and does not create a following answer slide. The resource designer renders the structured completed outcome as ordinary black teaching content inside that source unit's prepared model. Do not use the `||` answer marker, answer-green text, an answer-green outline or another answer-reveal treatment on `visible-in-unit` content.

A My Turn never uses `answer-slide`. A My Turn whose answer is not pupil-visible from the start normally uses `teacher-only`; a prepared completed model uses `visible-in-unit`.

For every answer whose `kind` is not `none`, the slide-designer composes the structured answer into the source unit's question or task slide speaker notes. Use `Answer to question(s) on this slide:` for `kind: exact` and `Answer/model for this slide:` for `kind: model` or `kind: standard`. For My Turn include the exact question/example plus answer after the marker; for other cases include the answer/model/standard only. `teacher-only` creates notes only. `answer-slide` creates the same speaker-note entry and a separate visible answer slide. `visible-in-unit` creates the same speaker-note entry and shows the prepared model in ordinary black teaching text. Do not mechanically append punctuation to `answer.content`. The lesson-designer does not duplicate the answer/model/standard in `speakerNotes` or in another route-specific content field. `content.modelledExemplar` remains the separate teacher-facing writing exemplar for the existing Question-and-reference writing rule; it is not a second copy of the unit's answer.

### Starter

The starter is one source unit:

```json
{
  "sourceUnitId": "lesson-section/starter/unit-001",
  "label": "Starter",
  "kind": "starter",
  "conceptRef": null,
  "content": {
    "activity": "...",
    "connection": "...",
    "format": "...",
    "testQuestionPath": null
  },
  "pupilInstruction": "...",
  "taskStructure": null,
  "modellingState": null,
  "representationRefs": [],
  "successCriteriaRefs": [],
  "stickyKnowledgeRefs": [],
  "misconceptionRefs": [],
  "photoRefs": [],
  "speakerNotes": {
    "script": "Say to children: ...",
    "teacherInfo": null,
    "lookFor": null
  },
  "answer": {
    "kind": "exact",
    "content": "...",
    "acceptanceCondition": null,
    "delivery": "answer-slide"
  }
}
```

When the starter uses a real bank question image, put its exact path in `testQuestionPath`. Otherwise use `null`.

### Teaching sequence

`teachingSequence` contains one source-unit object per leaf instructional beat in final lesson order. Do not number physical slides. The route reference for the selected lesson structure defines the allowed `kind` values and the exact `content` shape for each.

A source unit may later become one or more physical slides. That is the slide-designer's rendering judgement. Its stable source identity remains the one `sourceUnitId`.

### Ending

Use:

```json
{
  "included": true,
  "kind": "Apply",
  "reason": "...",
  "beat": {
    "sourceUnitId": "lesson-section/apply/unit-001",
    "label": "Apply",
    "kind": "apply",
    "conceptRef": null,
    "content": {
      "activity": "..."
    },
    "pupilInstruction": "...",
    "taskStructure": null,
    "modellingState": null,
    "representationRefs": [],
    "successCriteriaRefs": [],
    "stickyKnowledgeRefs": [],
    "misconceptionRefs": [],
    "photoRefs": [],
    "speakerNotes": {
      "script": "Say to children: ...",
      "teacherInfo": null,
      "lookFor": null
    },
    "answer": {
      "kind": "model",
      "content": "...",
      "acceptanceCondition": "...",
      "delivery": "answer-slide"
    }
  }
}
```

For Dialogic lessons, `kind` is `Reflect`, the source unit is `lesson-section/reflect/unit-001`, and the beat `kind` is `reflect`.

When no ending is earned:

```json
{
  "included": false,
  "kind": "Apply",
  "reason": "...",
  "beat": null
}
```

Use `Reflect` instead of `Apply` for Dialogic lessons even when `included` is false.

### Worksheet

Use exactly:

```json
{
  "status": "generated",
  "resourceMode": "per-child",
  "use": "separate-fresh-worksheet",
  "activityArchitecture": {
    "coreActionAndEvidence": "...",
    "amount": "...",
    "variationAndBoundaryPlan": "...",
    "organisation": "..."
  },
  "sheetShape": {
    "kind": "question-set",
    "reason": "..."
  },
  "demand": "...",
  "successCriteriaRefs": [],
  "stickyKnowledgeRefs": [],
  "fitPriority": {
    "protected": ["..."],
    "preAuthorisedRemoval": []
  },
  "centralWriteOnVisualException": null,
  "contentBlocks": [],
  "answerKeyMode": "required",
  "providedWorksheet": null
}
```

`status` is exactly:

- `generated`
- `provided-by-teacher`

`resourceMode` is exactly:

- `per-child`
- `shared-frame`

`use` is exactly:

- `separate-fresh-worksheet`
- `required-task-resource`

A `shared-frame` must be `generated`, must use `required-task-resource`, must use `sheetShape.kind: "frame"`, must contain exactly one top-level `frame` content block, and must use empty worksheet-level `successCriteriaRefs` and `stickyKnowledgeRefs`. The one content block is the actual modelled frame children use; it is not an ordinary question/stimulus sheet relabelled as a shared frame. This replaces the old magic status string `Generated (shared frame, one sheet, no adaptation)`.

`sheetShape.kind` is exactly one of:

- `question-set`
- `frame`
- `stimulus-set`
- `child-generated`
- `mixed`

`successCriteriaRefs` names the exact success-criteria objects printed on the generated Expected sheet.

`stickyKnowledgeRefs` names the exact sticky facts deliberately available on that sheet. Downstream designers do not add or remove them.

`fitPriority.protected` lists content or relationships that must survive fitting.

`fitPriority.preAuthorisedRemoval` lists only lower-priority items the lesson-designer explicitly authorises the worksheet-designer to remove first. Use `[]` when nothing may be removed.

When the two-page central-write-on-visual exception is earned:

```json
{
  "visual": "the substantial visual children directly plot on, measure, draw on, label or annotate",
  "reason": "why it cannot remain usable on one page"
}
```

Otherwise use `null`.

`answerKeyMode` is `required` whenever any generated Expected item has an exact answer, model or standard. Use `not-applicable` only when every generated Expected item has `answer.kind: "none"`.

#### Worksheet question

```json
{
  "id": "ws-q-001",
  "kind": "question",
  "pupilPrompt": "Exact words the child sees.",
  "response": "Printed action and usable response target.",
  "support": "",
  "visualRequirements": "",
  "representationRefs": [],
  "stickyKnowledgeRefs": [],
  "photoRefs": [],
  "answer": {
    "kind": "exact",
    "content": "...",
    "acceptanceCondition": null,
    "delivery": "teacher-only"
  }
}
```

`pupilPrompt` is verbatim child-facing wording. `support` and `visualRequirements` may be empty strings.

#### Worksheet question group

```json
{
  "id": "ws-qg-001",
  "kind": "question-group",
  "groupPrompt": null,
  "representationRefs": [],
  "stickyKnowledgeRefs": [],
  "photoRefs": [],
  "parts": [
    {
      "id": "ws-qg-001-part-01",
      "pupilPrompt": "...",
      "response": "...",
      "support": "",
      "visualRequirements": "",
      "representationRefs": [],
      "stickyKnowledgeRefs": [],
      "photoRefs": [],
      "answer": {
        "kind": "exact",
        "content": "...",
        "acceptanceCondition": null,
        "delivery": "teacher-only"
      }
    }
  ]
}
```

Use multipart structure only for one connected pupil job, under the existing pedagogical rule. Part IDs are sequential inside the group.

#### Worksheet frame

```json
{
  "id": "ws-frame-001",
  "kind": "frame",
  "representationRefs": [],
  "stickyKnowledgeRefs": [],
  "photoRefs": [],
  "sections": [
    {
      "heading": "...",
      "whatGoesHere": "...",
      "noteSpace": "..."
    }
  ],
  "answer": {
    "kind": "none",
    "content": null,
    "acceptanceCondition": null,
    "delivery": "none"
  }
}
```

#### Worksheet stimulus set

```json
{
  "id": "ws-stimulus-001",
  "kind": "stimulus-set",
  "stimulus": "...",
  "relationship": "...",
  "pupilAction": "...",
  "representationRefs": [],
  "stickyKnowledgeRefs": [],
  "photoRefs": [],
  "prompts": [
    {
      "id": "ws-stimulus-001-prompt-01",
      "pupilPrompt": "...",
      "response": "...",
      "support": "",
      "visualRequirements": "",
      "representationRefs": [],
      "stickyKnowledgeRefs": [],
      "photoRefs": [],
      "answer": {
        "kind": "model",
        "content": "...",
        "acceptanceCondition": "...",
        "delivery": "teacher-only"
      }
    }
  ]
}
```

`stimulus` is child-facing. When it holds several parallel cases (four object
clues, three claims to test), author one case per paragraph, separated by
blank lines, each opening with its own subject: the worksheet-designer renders
one visual unit per case, and cases fused into a single paragraph reach the
child as one block of prose. `pupilAction` states the block's one action once;
do not restate it inside each prompt's `pupilPrompt`, because overlapping
instruction fields become overlapping printed lines.

#### Child-generated worksheet

`generator` is the task a child reads, printed verbatim. Written Voice applies
to it at full strength: it names, in the child's own words, the category they
are generating from, because a child cannot supply an example of a category
they have to infer from the task's grammar.

`recordingSurface` describes the shape of the answer space for the worksheet
designer; it is NOT printed. So any label it implies has to be authored by
someone, and a description such as "space for a name" becomes the printed word
"Name:" unless this field says what the child should read. State the labels you
want in the child's own words - a label is the question a child would ask
themselves - or accept that the designer will write them.

`firstRowWorked` is one complete worked example of the thing being generated,
printed above the child's own attempt. Fill it whenever the category could be
read more than one way, which is most generative tasks: it is the difference
between a child inventing the right KIND of answer and a child inventing a
different kind entirely. Use `null` only when the lesson has just modelled a
worked example on the board that the sheet does not need to repeat.

```json
{
  "id": "ws-generated-001",
  "kind": "child-generated",
  "generator": "...",
  "recordingSurface": "...",
  "firstRowWorked": null,
  "representationRefs": [],
  "stickyKnowledgeRefs": [],
  "photoRefs": [],
  "answer": {
    "kind": "none",
    "content": null,
    "acceptanceCondition": null,
    "delivery": "none"
  }
}
```

For a provided worksheet, do not manufacture generated Expected content. Use:

```json
{
  "status": "provided-by-teacher",
  "resourceMode": "per-child",
  "use": "separate-fresh-worksheet",
  "activityArchitecture": null,
  "sheetShape": null,
  "demand": null,
  "successCriteriaRefs": [],
  "stickyKnowledgeRefs": [],
  "fitPriority": null,
  "centralWriteOnVisualException": null,
  "contentBlocks": [],
  "answerKeyMode": "not-applicable",
  "providedWorksheet": {
    "source": "...",
    "skillMatch": "Aligned with LO",
    "duplicateCheck": "...",
    "notes": ""
  }
}
```

`use` may still be `required-task-resource` when that is what the teacher-supplied sheet actually is.

### Slide design notes

`slideDesignNotes` is only for a genuine cross-slide rendering constraint that cannot be expressed through source-unit content or refs.

Do not repeat:

- representation descriptions already defined in `representations`;
- sticky availability already expressed in `stickyKnowledgeRefs`;
- success-criteria availability already expressed in `successCriteriaRefs`;
- photo identity already expressed in `photoRefs`;
- exact speaker notes already stored in `speakerNotes`;
- exact pupil instructions already stored in `pupilInstruction`;
- sort groups, items, item evidence and item photo identity already stored in `taskStructure`.

Use `[]` when nothing exceptional remains.

### Flags for the teacher

`flagsForTeacher` is the only teacher-facing flag channel in the authoritative hand-off.

Put a concise string here only for:

- something the brief asked for that the lesson deliberately does not carry, with the reason;
- a contradiction or gap in the brief that the designer had to route around;
- a subject/reference clash that cannot be silently settled;
- a prior-lesson continuity limitation such as the authoritative earlier file being unavailable;
- a genuine teacher-owned judgement between more than one sound option.

Do not put ordinary design rationale here; `design-decisions.md` owns the decisions and their concise reasons.

Do not put instructions to a downstream designer here.

Do not put a fault here when the lesson-designer can simply fix it.

Use:

```json
"flagsForTeacher": []
```

for the normal case.

## Additional Output: Photo Requirements

Alongside the lesson design document write `[same directory as lesson design]/photo-requirements.json`. This is the complete, frozen picture contract. There is no later picture-contract authoring session.

Use this schema for the root and every picture object:

```json
{
  "schema_version": 2,
  "lesson_name": "Electrical safety",
  "photos": [
    {
      "id": "photo-001",
      "subject": "A generic electric kettle with its full UK mains lead and plug visible",
      "pedagogical_constraint": "The kettle is unplugged and the full three-pin UK plug remains visible.",
      "teaching_requirement": "Recognise that an appliance can be made safer before inspection by unplugging it.",
      "load_bearing_evidence": [
        "one complete electric kettle",
        "the full mains lead",
        "a visible three-pin UK plug",
        "the plug is not connected to a socket"
      ],
      "use": "both",
      "essential": true,
      "filename": "unsplash/unplugged-kettle-uk-plug.jpg",
      "acquisition_mode": "controlled-ai",
      "source_profile": "none",
      "fallback_action": "unsatisfied",
      "fallback_note": null,
      "generation_prompt": {
        "physical_state": "The kettle is unplugged, with the full lead and separate UK plug visible.",
        "must_avoid": ["plug connected to a socket", "non-UK plug", "another appliance"],
        "text_rule": "no readable text, labels, logos or branding",
        "composition": "Show the whole kettle, lead and plug in one clear landscape frame."
      },
      "coherent_group": null,
      "coherent_mode": "none",
      "coherent_visual_invariants": []
    }
  ]
}
```

Allowed `use` values are `slide`, `worksheet`, and `both`. `essential: true` means the learning is poorer without the image; `false` means it may be omitted without a gap. The full object is required now: settle the exact visible evidence, teaching purpose, use surface, authenticity, source fitness, fallback meaning, and generation controls here.

Allowed `acquisition_mode` values:

- `authentic-real`: a generated image would be a lie about a real thing, so the real origin is itself part of what the image teaches. It requires a real source profile, a null generation prompt, a non-empty `fallback_note` naming what that lie would be, and never permits AI fallback. "Must be a genuine photograph" is a style requirement, not an authenticity one, and does not reach this mode on its own.
- `ordinary-real`: a real photograph is preferred, but a faithful generated one teaches the same thing. It requires a real source profile. An essential picture requires `fallback_action: ai` with a complete generation prompt, so the lesson gets its picture either way; a non-essential one may instead use `omit` with a null prompt. `unsatisfied` is not available here.
- `controlled-ai`: the evidence needed is a staged combination stock libraries do not hold, such as a particular physical state, several evidence items in one frame, a matched set, or no branding and no readable text. It requires `source_profile: none`, a complete generation prompt, and cannot use `fallback_action: ai` because AI is already primary.

Allowed source profiles are `unsplash-only`, `wikimedia-only`, `unsplash-then-wikimedia`, `wikimedia-then-unsplash`, and `none`. Allowed fallback actions are `ai`, `omit`, and `unsatisfied`. `fallback_action` says what happens when the primary route cannot deliver: choose `ai` for any real-route picture whose realness is not load-bearing, `omit` only where the lesson is genuinely no poorer without that picture, and `unsatisfied` only where neither is true. An essential picture with no route to an image leaves the teacher a hole in the lesson. `pedagogical_constraint` may be empty, but `load_bearing_evidence` is a non-empty list of non-empty strings. A fallback note is null or a concise string, and non-empty wherever a route can end with no image and no authorised substitute.

A named person, place, event, primary source, historical source, field observation, or exact scientific observation cannot be `controlled-ai`. A direct comparison set must be all real or all generated. Use `coherent_group: null`, `coherent_mode: none`, and `coherent_visual_invariants: []` for an ungrouped image. Group members must have one identical mode and invariant list. `all-real` rejects controlled AI and AI fallback, so it cannot hold an essential `ordinary-real` member; an essential comparison set of ordinary objects is `all-generated`, which also guarantees the matched framing and lighting a comparison needs. `all-generated` requires controlled AI for every member. A group cannot contain more than four objects.

The initial Lesson Designer assigns `photo-001`, `photo-002`, and so on in order. Adaptation-owned pictures use `adaptation-photo-001`, `adaptation-photo-002`, and so on in that adaptation file. Keep count at or below 16. IDs and filenames are the image lifecycle identities. Give each distinct visual job its own object; reuse one object only when the same approved image remains truthful for every use. A source-based image belongs here only when a built-in representation cannot do the job. Do not use generated lettering as the only copy of required teaching text.

Preserve misconception, time, place, and typicality constraints. Judge every image at its actual use size; a word-bank thumbnail around 10 mm needs one instantly recognisable object, a quiet background, a near-square usable crop, and no detail that disappears in print. Maths always has an empty `photos` list because its visual tools are rendered directly. Optional context pictures, Educational SVG drawings, emojis, and built-in visuals do not consume these places.

Once a filename appears in an immutable compiled assignment manifest, that complete photo object is append-only for the rest of the automated run. A later replacement gets a new ID and filename.
