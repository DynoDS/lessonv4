# Lesson Design Scaffold

Use this only on the normal initial Lesson Designer pass when the orchestrator supplies the scaffold command. It removes contract construction from the model; it does not make pedagogical decisions.

Do not use the scaffold route when the orchestrator supplies an existing `lesson-design.json` for a photo-cap revision or a Design Reviewer redesign. On those revision passes, edit the current authoritative files in place and run the normal validator.

## Order

1. Finish the lesson-design decisions.
2. Write `design-decisions.md`.
3. Write `[WORKING_DIR]/lesson-design-scaffold-request.initial.json` from those settled decisions.
4. Run the exact scaffold command supplied by the orchestrator.
5. Require exactly `LESSON_DESIGN_SCAFFOLD_OK`.
6. Fill the generated `lesson-design.json` and `photo-requirements.json` by editing them in place.
7. Replace every exact `__LESSON_DESIGN_FILL__` placeholder with the decided final value, including `null`, `[]`, an object or a scalar where the contract requires it.
8. Run the normal JSON parse checks and the supplied lesson-design validator. The validator rejects any unresolved scaffold placeholder.

The scaffold command is a builder, not a check. It writes the empty scaffold over both files every time it runs, so it belongs at step 4 only. Never run it again to confirm the work at step 8, and never re-run it once any field has been filled: it would discard the design. The builder itself now refuses to overwrite a file whose fields carry decided values, so a second run fails rather than destroying work.

Fill by editing the generated files in place, replacing each placeholder where it stands. The scaffold's IDs, ordinals, envelopes and keys are already final, so re-typing either document from scratch can only reintroduce the mechanical errors the scaffold exists to prevent, and a delete-and-recreate shows the teacher a confusing wipe in the activity feed. Never delete or rewrite a generated file to fill it; edit it.

The scaffold request is initial-build provenance only. It is not an authoritative lesson contract and no downstream agent reads it.

## Scaffold request

Use exactly these top-level fields:

```json
{
  "schemaVersion": 1,
  "structure": "Content-based",
  "yearGroup": 4,
  "subject": "Science",
  "scope": "Complete lesson",
  "vocabularyCount": 3,
  "trimmedVocabularyCount": 0,
  "representations": [
    {
      "configurations": [
        {
          "id": "teaching",
          "loadBearing": true
        }
      ]
    }
  ],
  "successCriteriaCount": 0,
  "stickyKnowledgeCount": 3,
  "misconceptionCount": 2,
  "concepts": [],
  "teachingSequence": [
    {
      "kind": "teach",
      "conceptIndex": null
    },
    {
      "kind": "do",
      "conceptIndex": null
    },
    {
      "kind": "practise",
      "conceptIndex": null
    }
  ],
  "endingIncluded": true,
  "worksheet": {
    "status": "generated",
    "resourceMode": "per-child",
    "use": "separate-fresh-worksheet",
    "sheetShape": "question-set"
  },
  "photoCount": 4
}
```

The values in the request are decisions already made by the Lesson Designer. The scaffold script only turns them into IDs, ordinals, repeated envelopes, required top-level keys and each source unit's route-specific `content` envelope.

## Counts

`vocabularyCount`, `trimmedVocabularyCount`, `successCriteriaCount`, `stickyKnowledgeCount`, `misconceptionCount` and `photoCount` are zero or positive integers. They are counts of decisions already made, not targets to fill.

Maths is usually 0, because its visual tools are drawn by the engine rather than
photographed, but it is not required to be: a maths lesson may ask for a
photograph the engine cannot draw. See the Photographs section of the
lesson-designer agent for when one earns its place.

## Representations

`representations` contains one object per representation family already chosen.

Each representation object contains only `configurations`.

Each configuration contains:

```json
{
  "id": "lowercase-kebab-case-id",
  "loadBearing": true
}
```

Use the final configuration ID here because source-unit representation uses refer to it later. `loadBearing` is also already a pedagogical decision. The scaffold generates `rep-001`, `rep-002`, and so on, plus the configuration envelopes. Fill `name`, `purpose`, `description` and load-bearing `requiredFeatures` in the generated lesson design.

## Success criteria and Skill-based concepts

`successCriteriaCount` is the number of success-criteria objects already chosen.

For a non-Skill-based lesson, use:

```json
"concepts": []
```

For a Skill-based lesson, add one object per concept in final concept order:

```json
"concepts": [
  {
    "successCriteriaIndexes": [1]
  },
  {
    "successCriteriaIndexes": [2]
  }
]
```

The indexes are one-based positions in the generated `successCriteria` array. The scaffold generates `concept-###` IDs and binds each My Turn, Our Turn and Your Turn to the matching concept's success-criteria refs.

## Teaching sequence

`teachingSequence` contains one object per final source unit in lesson order:

```json
{
  "kind": "my-turn",
  "conceptIndex": 1
}
```

For Skill-based `my-turn`, `our-turn` and `your-turn`, `conceptIndex` is the one-based concept position.

For Skill-based `prepare`, and for every source unit in every non-Skill-based route, `conceptIndex` is `null`.

Use only kinds allowed by the selected route. The scaffold rejects an out-of-order route before writing the files.

Each generated source unit contains a `taskStructure` placeholder. Replace it with `null` for an ordinary prompt. Replace it with the complete `sort` or `evidence-classification` object from `output-template.md` when the settled task needs protected groups, items, fields or photograph-answer links.

## Ending

`endingIncluded` records the decision already made about Apply or Reflect.

The scaffold derives Apply for every non-Dialogic route and Reflect for Dialogic. When included, it generates the correct ending source-unit ID and common envelope.

## Worksheet

Use the final worksheet routing values already decided:

```json
"worksheet": {
  "status": "generated",
  "resourceMode": "per-child",
  "use": "separate-fresh-worksheet",
  "sheetShape": "mixed"
}
```

For a teacher-provided worksheet, `status` is `provided-by-teacher`, `resourceMode` is `per-child`, and `sheetShape` is `null`.

For a generated shared frame, `resourceMode` is `shared-frame`, `use` is `required-task-resource`, and `sheetShape` is `frame`.

The scaffold creates the worksheet top-level contract. Fill `activityArchitecture`, the final `contentBlocks`, refs, fit priority, answer-key decision and any central write-on visual exception in the generated JSON from the decisions already made.

## Filling the scaffold

The exact placeholder is:

```
__LESSON_DESIGN_FILL__
```

Do not leave it anywhere in either generated JSON file.

A placeholder inside an array means replace the whole placeholder entry with the final array contents. Use `[]` when the settled decision is that the array is empty.

A placeholder in a nullable field means replace it with either the decided string/object/value or `null`. Do not leave a placeholder merely because the final field is optional.

Each source unit's `content` arrives as the route-specific envelope with the exact fields for its kind already in place. Fill those fields; the matching teaching-sequence reference explains what each field means. A whole-value placeholder remains only where the final shape is itself a decision - a teach `takeaway`, a `taskStructure`, a vocabulary `visual` - and there you replace the placeholder with the complete final object, array or `null`.

A placeholder in a vocabulary `visual` means replace the whole value with the final structured visual object.

A placeholder in a generated worksheet's `activityArchitecture`, `fitPriority`, `centralWriteOnVisualException` or `contentBlocks` means replace the whole value with the final object, `null` or array required by the settled worksheet design.

If the generated scaffold does not support the structure you actually decided, fix the scaffold request and rerun the scaffold before filling it. Do not hand-edit mechanical IDs to force an invalid request through.

## Resource opportunities

The scaffold also generates the `resourceOpportunities` envelope, one entry for `stickIn` and one for `workingWall`, each with placeholder `decision`, `sourceUnitIds` and `reason`. Fill them from the decisions record like every other field: `sourceUnitIds` becomes `[]` or the exact IDs of the moments that earn the piece. The shape and the allowed decisions are in `output-template.md` under Resource opportunities.

## Output-template fallback

The generated scaffold owns mechanical shape on the normal initial make-lesson route.

Use `output-template.md` selectively when you need the exact allowed value or nested shape for a field you are filling. Do not reread it from top to bottom merely to reconstruct keys that the scaffold has already generated.

When no scaffold command is supplied, use the existing fallback: read `output-template.md` in full and serialise the three normal outputs manually through a real JSON serializer.
