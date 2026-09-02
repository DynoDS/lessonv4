# Teaching Sequence — Discovery

Use this file when the lesson-designer has chosen **Discovery** because observing or investigating a safe, dependable phenomenon is the best main route to the objective.

Discovery is a genuine lesson route. A smaller bounded exploration may also sit inside Skill-based or Content-based teaching, but that does not remove this full route.

## Route conditions

Use Discovery only when all three conditions hold:

1. Children have enough prerequisite knowledge to investigate productively.
2. The phenomenon is safe, dependable and capable of revealing something worth noticing.
3. Explicit teacher explanation will follow and secure why the result or pattern occurred.

Judge those conditions from the actual objective, children’s prerequisites and phenomenon. If productive Discovery still looks doubtful after that judgement, teach the learning directly.

## Teaching sequence

### Orient to the question

Make the focused question, phenomenon and relevant prior knowledge clear. Give children enough information to know what they are observing, comparing or changing without revealing the finding they are meant to reach.

### Explore

Give children a bounded investigation, observation, pattern or comparison.

State the limits, available material and any safety conditions children need. Do not leave the exploration as “see what you can find out” with no dependable focus.

### Make the result visible

Bring together or inspect the observations, outcomes or pattern before the explicit `Teach why` beat. Use a table, diagram, shared result, comparison or another suitable form when it helps children see what happened. The teacher chooses routine response and recording methods.

### Teach why

Give the accurate explicit explanation of why the result or pattern occurred. This is the load-bearing teaching beat. Connect the explanation to what children observed, correct unsupported theories and preserve important distinctions rather than accepting any explanation because it followed an investigation.

The board carries it, not only the script. `takeaway` is the one line children keep (the sticky fact when it is one); `accurateExplanation` is the explanation as the child reads it, two or three short lines on the evidence they just saw: what happened, why, what it looks like. A takeaway on the board with the why only in the notes is a slogan, and a paragraph of the script on the board is the other failure (`preferences.md` → Slide Philosophy, `A heading, a fact or a rule on the board is not the teaching of it`).

### Use the learning

Give children an opportunity to explain, apply, compare or test the secured idea. Choose the form and amount from the objective. The practice must not depend on discovering another untaught idea.

### Finish purposefully

End with the conclusion, explanation, application or evidence that best completes the investigation. A separate exit ticket is optional and appears only when it adds useful evidence.

## Procedure boundary

A pattern investigation or method comparison may precede direct teaching of a procedure when it genuinely helps children notice the structure. The procedure is then clearly explained, modelled and secured through Skill-based teaching. Do not leave primary novices to invent the complete procedure through unguided trial and error.

## Output Format Block

When writing `lesson-design.json`, append these source-unit kinds to `teachingSequence` in the lesson's final order. The common source-unit fields live in `output-template.md`.

Question:

```json
{
  "kind": "question",
  "content": {
    "focus": "the exact phenomenon or pattern children investigate",
    "prerequisites": "what children already need to know",
    "discoveryFocus": "what children will observe, investigate or compare"
  }
}
```

Explore:

```json
{
  "kind": "explore",
  "content": {
    "activity": "the bounded observation, investigation, pattern or comparison",
    "conditionsAndSafety": "only what children need",
    "evidenceProduced": "the observation, result, table, diagram or other useful record"
  }
}
```

Make sense:

```json
{
  "kind": "make-sense",
  "content": {
    "resultOrPattern": "what children should be able to see in the evidence",
    "prompt": "the worthwhile question children answer from that evidence"
  }
}
```

Teach why:

```json
{
  "kind": "teach-why",
  "content": {
    "takeaway": {
      "kind": "text",
      "text": "the one line children keep, or {\"kind\": \"sticky\", \"ref\": \"sk-001\"} when it is a sticky fact"
    },
    "accurateExplanation": "the explicit explanation as the child reads it: two or three short lines on the evidence, what happened, why, what it looks like",
    "unsupportedExplanationToCorrect": null
  }
}
```

Use a non-null `unsupportedExplanationToCorrect` only when a genuine unsupported explanation is predictable.

Use the learning:

```json
{
  "kind": "use-learning",
  "content": {
    "activity": "the exact explanation, application, comparison or test of the secured idea"
  }
}
```

Finish:

```json
{
  "kind": "finish",
  "content": {
    "purposefulEnding": "the conclusion, explanation, application or other useful evidence that completes the investigation"
  }
}
```

Attach required visuals through `representationRefs` and `photoRefs`, not by re-describing their identity inside `content`. Put answers/models/standards only in `answer` and teacher wording only in `speakerNotes`.
