# Teaching Sequence — Dialogic (Stimulus → Talk → Synthesise → Reflect)

Use this file when the lesson-designer has chosen **Dialogic Teaching** as the structure — lessons where the child's success looks like *a defended position* rather than *an accurate account* (PSHE values, RE big questions, History interpretation, English motivation/debate, Geography land-use, Citizenship / P4C).

The structure choice itself is made in the main agent's Structure Decision section. By the time this file is read, the structure decision and the boundary tests have already been applied — what follows is execution detail for the chosen rhythm.

---

## Teaching Sequence Specification

Design the number of Stimulus → Talk beats from the richness of the question and the available lesson time. Two to four pairs is a useful normal shape, not a quota. One discussion may carry the lesson only when it is genuinely rich and substantial; a brief partner chat is not a complete Dialogic lesson. A small factual or vocabulary input may come first when children need it to reason sensibly. If substantial factual teaching is required, use Content-based teaching.

**Stimulus** — opens a question. A scenario, image, story snippet, dilemma, video clip, or provocation. Children have something concrete to react to.

The Stimulus slide carries the prompt children respond to plus the question being asked. It is *not* a Teach slide — there is no factual takeaway being transmitted. If the Stimulus needs supporting categories (e.g. the kinds of influence on a career choice, the four positions in a debate, a list of statements to rank), put those on the slide as material to discuss, not as facts to memorise. The takeaway lives in the children's response and reasoning, not on the slide.

Choose stimuli that are concrete, understandable and open to several defensible positions. Do not assume children share the same family circumstances, personal experience or emotional safety. Use fictional, school-based or otherwise safely distanced scenarios when personal disclosure would be inappropriate.

A Stimulus can also be an *activity* — a ranking, a sort, a four-corners vote — when the activity itself surfaces children's positions. In that case the Stimulus and the Talk merge into a single working beat: the activity slide carries the items being ranked or sorted, and the Talk happens around the activity rather than after it. Treat this as one combined Stimulus + Talk in the teaching sequence rather than splitting it into two.

**Talk** — children discuss the Stimulus. The active beat. Pick the format that matches the question's shape:
- Partner talk with sentence stems ("I think… because…", "I disagree because…")
- Snowball (pairs → fours → whole class)
- Four corners (children physically position themselves on agree / strongly agree / disagree / strongly disagree and defend)
- Ranking or sorting that forces a position (rank these influences from most to least; sort statements into "always / sometimes / never")
- Role-play or hot-seating ("you're [character] — what would you say?")
- Short structured debate

Let each Talk take the time its thinking deserves. Three to five minutes is a useful estimate, not a fixed limit. Do not let a small discussion accidentally take over the lesson or cut a rich discussion short merely to satisfy a timer. Specify the format and the discussion question on the slide. Speaker notes may include a small number of optional lesson-specific follow-up questions when they help the teacher deepen this actual discussion, especially where the topic may be unfamiliar. Use support such as "What might change your mind?" or "What evidence supports that?" Do not turn the notes into a compulsory script or prescribe who to call on, how to bounce answers or another discussion-management routine.

**Synthesise** — after all the Stimulus → Talk pairs are done, the teacher pulls together what emerged from the discussion. This is *not* announcing the right answer — there isn't one. It is a teacher-led naming of the structure of children's thinking: the frames that appeared, the vocabulary that proved useful, the positions that were defensible, the tension between competing values when more than one good answer exists.

A synthesis names and compares positions children actually expressed. Do not write "we heard" beside a view that never appeared. If an important missing perspective is needed, introduce it honestly as a new perspective or question, let children discuss it, and only then include it in the synthesis. Present any essential factual, legal, statutory or safeguarding takeaway separately and accurately rather than pretending the discussion produced or agreed it.

**Reflect** — normally provide proper individual evidence so the lesson does not rely only on confident speakers. Writing is often useful, but spoken, visual or practical evidence may be stronger when writing would distort the objective or create an inappropriate personal record. Whatever the form, each child must still show enough evidence of the intended learning, and an open conclusion must not be predetermined.

Format options:
- Sentence stems ("The biggest influence on me would be… because…", "I would / would not… because…")
- Position-taking ("I think… is more important than… because…")
- Advice-giving ("If a friend asked me…, I would say…")
- Letter or pledge ("Dear future me…", "I will…")
- Multi-prompt structured response — 2–3 stems building from "what" through "why" to "what would you do"

The Reflect can provide useful assessment evidence for the LO. Judge whether the child has formed a substantive position and supported it with relevant reasoning. Do not prescribe a book-look or marking routine; the teacher decides how the evidence is used.

**Success criteria** in dialogic lessons. Often not needed as a procedural list — there's no method to step through. When appropriate, use a reference table of the frames the teacher named during Synthesise (so children writing the Reflect can lean on the language that emerged), or a sentence-stem bank kept visible during the Talk phase.

**Incomplete, incorrect and harmful claims are not the same.** Pressure-test a genuinely incomplete or contestable view through a suitable stimulus and discussion. Correct factual errors, safeguarding issues and harmful claims clearly. Dialogic openness does not make every statement equally defensible.

Sentence stems may support language or reasoning, but they must work for more than one defensible conclusion. Do not give children a stem that quietly supplies the judgement they are meant to reach.

---

## Output Format Block

When writing `lesson-design.json`, append one source-unit object per Stimulus, Talk and Synthesise beat in final lesson order. The common source-unit fields live in `output-template.md`.

When children need a small factual or vocabulary grounding input before the first stimulus, represent it explicitly:

```json
{
  "kind": "grounding-input",
  "content": {
    "input": "the exact concise knowledge children need before they can reason sensibly"
  }
}
```

Do not use this for substantial factual teaching; CURRENT's Content-based routing rule still applies.

Stimulus:

```json
{
  "kind": "stimulus",
  "content": {
    "prompt": "the exact scenario, dilemma or provocation children react to",
    "question": "the exact question children are asked",
    "materialOnSlide": null
  }
}
```

Use `materialOnSlide` for exact supporting statements, ranking items, category labels or other discussion material that is not already represented by `representationRefs` or `photoRefs`. Use `null` when the prompt stands alone.

When the stimulus itself is an activity and Stimulus + Talk genuinely merge into one working beat, use one combined source unit instead of inventing two:

```json
{
  "kind": "stimulus-talk",
  "content": {
    "prompt": "the exact scenario, activity or provocation",
    "question": "the exact question children reason about",
    "materialOnSlide": null,
    "format": "ranking",
    "sentenceStems": [],
    "teacherListensFor": [
      "one defensible position worth surfacing",
      "another defensible position worth surfacing"
    ]
  }
}
```

Otherwise use a separate Talk source unit:

```json
{
  "kind": "talk",
  "content": {
    "format": "partner talk with stems",
    "discussionQuestion": "the exact question children discuss",
    "sentenceStems": [
      "I think ___ because ___."
    ],
    "teacherListensFor": [
      "one defensible position worth surfacing",
      "another defensible position worth surfacing"
    ]
  }
}
```

Use `sentenceStems: []` when the format does not need stems.

Synthesise:

```json
{
  "kind": "synthesise",
  "content": {
    "framesToName": [
      "the positions, frames or useful vocabulary the teacher may name back after they actually arise"
    ]
  }
}
```

Attach any sticky facts the synthesis deliberately surfaces through `stickyKnowledgeRefs`; do not repeat their wording inside `content`.

The final Reflect is stored in the top-level `ending` object, not in `teachingSequence`.
