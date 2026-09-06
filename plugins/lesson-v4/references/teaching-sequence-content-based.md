# Teaching Sequence — Content-Based (Teach → Do → Teach → Do)

Use this file when the lesson-designer has chosen **Explicit Teaching (Content-based)** as the structure — children learning a body of knowledge they need to understand, recall, and explain (e.g. who were the Mayans, how the digestive system works, the water cycle, religious festivals in Judaism).

The structure choice itself is made in the main agent's Structure Decision section. By the time this file is read, the structure decision and the boundary tests have already been applied — what follows is execution detail for the chosen rhythm.

A bounded observation, pattern or short exploration may sit inside this route when seeing it first gives children something useful to explain. Follow it with the accurate teaching that secures the meaning. This does not replace Discovery as a full route when the investigation itself is the best main lesson shape.

When this bounded pre-teach experience is used, serialise it as an `observe` source unit immediately before the Teach it exists to set up. It is not the Do paired with the preceding Teach and it must be followed immediately by the accurate Teach that secures its meaning.

---

## Teaching Sequence Specification

For each knowledge chunk being taught, design a Teach slide paired immediately with a Do beat. Multiple Teach→Do pairs in sequence. After all the teaching is done, a main Practise section applies the whole body of knowledge; an Apply slide follows if earned.

**Teach** — the teacher delivers a specific piece of knowledge with a clear teaching anchor.

Each Teach beat covers one manageable knowledge chunk. Closely connected facts or ideas may stay together only when they genuinely form one simple, easy-to-understand chunk. Do not use "closely connected" as permission to place too much explanation or several concepts into one teacher-led block. Children use or process that chunk before the lesson introduces the next distinct idea.

A content chunk teaches knowledge about the topic. Teach a new thinking move through the material it helps children understand, with enough explanation and guided use for the later task. A brief cue may suffice for a familiar comparison; an unfamiliar evidence decision may need focused teaching of its own. Keep that teaching connected to substantive content rather than replacing the lesson with generic rules about thinking.

**Choose the opening that makes the first learning accessible.** Begin with observation when the material is intelligible enough for children to notice something useful for the explanation that follows. Teach a necessary term, context or idea first when that will help them understand or attend to the material. Direct teaching does not need an exception justified by observation being impossible. Introduce vocabulary at its point of need; neither observation-first nor an opening glossary is compulsory.

**The first Teach poses the lesson's problem; orientation folds into it.** What a subject is, why we are here, or a fact that only sets the scene is not a chunk children use, so it earns no Teach slide and no Do beat of its own: it is one or two lines on the first real Teach that pose the problem in the objective's own terms, and the first taught idea arrives as the first answer to it (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `Orientation is not a Teach chunk`).

Teach slides carry the thing being explained or the representation that best teaches it: an image, map, labelled diagram, object, source, quotation, passage, marked text or another suitable form. Text can be the anchor when text is the object of study. Use a useful picture or diagram when it improves the teaching, but do not force one where it adds nothing. The slide also carries enough concise, accurate visible information for children and a teacher who does not use the notes to understand the core idea. What's not acceptable is the teacher's full script on the slide; the speaker notes carry fuller spoken explanation and backup. When children need actual source or evidence text, show the substantive text at readable pupil-facing size in a content zone. A caption may identify the source briefly; it must not be the only place where learning-critical evidence appears. The test: can a child glance at this slide and see the core idea? Can the teacher glance at it and know what to talk about?

**The slide must carry the takeaway, not only the prompt.** When a Teach slide's title poses a question ("Why does it matter?", "Where did the Mayans live?", "What does monitoring mean?"), the answer that emerges must appear visibly on the slide as well as being spoken: a short key sentence in a banner or strip, a labelled outcome below the visual, or a headline that names the answer all work (`preferences.md` → Slide Philosophy, "The slide carries the takeaway", owns the why). When you write the Teach block in your output, store the takeaway in that Teach source unit's content.takeaway object, even when the title already poses the question.

**Write the sentence that answers the question, not another fact about the topic.** This is where the rule is most often met in form and missed in substance, because a true, relevant sentence looks right in the field. A Teach headed "Why are rainforests in hot places?" whose key sentence names where they grow has stated a fact and withheld the reason, so the explanation children need lives only in your script, and a teacher delivering from the board alone cannot give it. Read your title and your key sentence back to back before you move on: if the second does not answer the first, write the because instead ("the sun shines most directly at the Equator, so it is hottest there"). Where the title is a plain label rather than a question, the field carries the idea children should take away. A sentence can also answer the question and still be empty, by answering it with what the slide already shows: "the top two layers are bright, windy and rainy", on a slide whose captioned photos have just said exactly that, only re-reads the board, and it merges two layers the slide spent its width distinguishing. What earns the field is the line still worth having once the slide is off screen: the reason behind what children have just seen, the thing they will repeat at home ("if you want to find animals in a rainforest, look up"), or the number that fixes the scale ("only about 2 rays in every 100 reach the forest floor"). Where the parts of a slide genuinely differ, close on what they taught, not on an average of them. The takeaway stays one line, and it is not the teaching on its own: the meaning, reason and example that make it intelligible go in the unit's `explanation`, two or three short child-facing lines beside the example, so a child who knew nothing before the slide is not left asking `what's pass?`. A takeaway on the board with the meaning only in the script is a slogan (`preferences.md` → Slide Philosophy, `A heading, a fact or a rule on the board is not the teaching of it`).

**Choose key questions for the understanding they reveal.** A Teach may include a question that helps children notice, explain or check the idea while it is live. Store its exact wording in `content.keyQuestions`. A short precise answer can reveal understanding; longer wording is not evidence of deeper thinking. Account for the Do that already follows before adding another response demand. Use `"keyQuestions": []` when no additional question earns the time. The teacher chooses how responses are gathered; the Do remains each child's opportunity to use the learning.

**Where the brief already lists key questions, start from those.** A long-term plan or a scheme that names the questions for a lesson is naming the thinking the teacher expects to happen, so a design that quietly drops all of them has thrown that away while looking complete. Weigh them as you weigh any other part of a brief: take the ones that fit the chunk they belong to, sharpen a vague one, and leave the ones that answer a different lesson's objective.

**When the chunk is where something is, anchor it to what children already located.** A place only means something once a child can put it inside somewhere they already hold, so teaching a location works outward from the known: the continent they can find, then the region, then the place itself. A map of the Amazon basin answers "where in South America" precisely and leaves "where in the world" untouched, so a child who could not place South America a moment ago learns a shape rather than a location. Where the starter or an earlier slide already had children name the continents, say so and use it, since the link back is what turns two separate facts into one picture. In practice this is usually one extra visual beat rather than a new chunk: the world map with the continent picked out, then the closer map. The same move serves any zoomed-in visual, a country inside a continent, a county inside a country, a site inside a city.

**Foundation subject Teach slides earn meaningful visual support.** When teaching categories, locations, comparisons or sequences in PSHE, RE, History, Geography or Science, actively choose the representation that teaches the content best rather than defaulting to a row of plain text columns. A labelled diagram, photograph, map, timeline, source, object, shape, icon or emoji may provide useful visual differentiation when it helps children understand the categories or relationships. It does not need to give every individual item its own picture. Text can be the teaching object when the text itself is being studied, and a separate visual should not be forced where it adds nothing. When you specify the Teach block, name the useful representation or visual treatment clearly enough for the slide-designer to render it faithfully.

**Do** — immediately after each Teach beat, children use or process the chunk before the next distinct idea. Every child uses it; a question to the room is a key question, not this beat (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `Questioning is not doing`). Settle the intended thinking first, then use `do-beats.md` only to find a response form that fits. There is no catalogue-reading quota.

One to three minutes is a useful normal estimate, not a hard limit. A spoken response, visible decision, movement, physical action, drawing or writing may all show the thinking; each Do does not need a permanent written artefact. If a worthwhile activity becomes substantial, treat it as main practice and protect the rest of the lesson rather than pretending it is still a tiny beat.

Consider variety when an equally suitable change of form would reduce monotony, fatigue or an access barrier, but do not require a number of registers or a compulsory non-writing activity. Repetition is appropriate when repeated performance is the learning.

Match the substance before the form: this Do practises the move this Teach just taught, not a neighbouring one the lesson happens to be about, and a beat where every child commits to real work still breaks the pair when the move it uses was never taught here (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `The Do uses the idea its own Teach just taught`). Then match the form to what was just taught: a fact suits recall or a sort, a process suits labelling, sketching or sequencing, a concept suits writing or generating a fresh example, a value suits ranking or talk. By the last Do before Practise, children should be working with or reasoning with the idea rather than retrieving it; that is the shape of the lesson, not a staircase, so do not force every beat to be harder than the last, and check that the finished lesson does not sit at recall throughout where the objective supports worthwhile thinking.

**Practise** — after the Teach→Do chunks, provide a larger opportunity to use the lesson's body of knowledge. Choose the form and amount that best shows the learning: questions, explanation, comparison, source or evidence work, classification, drawing or labelling a meaningful representation, structured writing, speaking, constructing, practical demonstration or another suitable performance. Writing is valuable when it serves the learning, but it is not compulsory. A substantial Practise is launched, not only instructed. Its `launch` carries, as the child reads them, what the lesson has established, a good instance of the product beside a weak one with the difference named, and the steps in the order children take them; the slide designer gives it a slide of its own before the task. Use `null` only when children can begin from the question alone, because the product is a form they have made before or the practice is a set of questions (`preferences.md` → Slide Philosophy, `Giving a task its instructions is not launching it`).

The practice must provide useful evidence and should combine relevant remembering with worthwhile use of the knowledge where the objective supports it. It does not have to climb from simple to hard in a fixed order. A main Practise with a definite answer uses `answer-slide`. A Do beat with an exact answer uses `teacher-only` and receives no separate answer slide. A Do beat may use `answer-slide` when its structured answer is a genuinely useful `model` or `standard`. Open or exemplifiable outcomes receive a model or comparison standard only when it genuinely helps.

**Success criteria** in content-based lessons. A procedure is not required for a useful reference. When children need one, show the features or decisions that distinguish a successful performance and keep it visible during Practise. Match the task's actual conditions: a comparison requiring two sources needs guidance on using both and comparing matching aspects, not only definitions of comparison terms. Keep the format appropriate to the work; a feature table is valid and numbered steps are not compulsory. Simple familiar tasks need no separate criteria. Apply `preferences.md` → Support, Checking and Release to independent and optional worksheet use too: plan where needed references and source material remain accessible without filling in the child's comparison.

---

## Output Format Block

When writing `lesson-design.json`, append one source-unit object to `teachingSequence` for every bounded Observe (when earned), Teach, Do and Practise beat in final lesson order. The common source-unit fields live in `output-template.md`.

CURRENT allows a bounded observation, pattern or short exploration before a Teach when seeing something first gives children something useful to explain. Represent that optional beat explicitly rather than forcing it into the paired Do:

```json
{
  "kind": "observe",
  "content": {
    "activity": "the exact bounded observation, pattern or short exploration",
    "focus": "what children are noticing before the explanation",
    "evidenceProduced": "the observation, pattern or brief evidence available to the Teach that follows"
  }
}
```

An `observe` unit may occur only immediately before the Teach it sets up. It is not a substitute for that Teach and is not the child-processing Do that follows the Teach.

Teach:

```json
{
  "kind": "teach",
  "content": {
    "headline": "the single child-facing idea this teaches",
    "explanation": "the teaching of that idea as the child reads it, in two or three short lines: what it means, why it matters, what it looks like; null only when the headline, takeaway and visible example already carry it",
    "takeaway": {
      "kind": "text",
      "text": "the short visible takeaway"
    },
    "teachingText": null,
    "keyQuestions": [
      "one worthwhile question children can answer from the teaching"
    ]
  }
}
```

When the takeaway is exactly one of the lesson's sticky facts, do not repeat its wording. Use:

```json
"takeaway": {
  "kind": "sticky",
  "ref": "sk-001"
}
```

`explanation` is the board's teaching of the idea, for a child who knew nothing before the slide: what it means, why it matters and what it looks like, as two or three short lines the slide designer keeps as lines. For the right to pass: `Sometimes you don't want to answer a question or share something personal. In PSHE, you can choose to pass.` / `You can say "I'd like to pass." You don't have to explain why.` / `You can still listen, think and take part in other ways.` The takeaway stays the one line children keep; the explanation is what makes it mean something. Use `null` only for a name, a convention or a fact that simply is so, where stating it beside its example is the teaching.

Use `teachingText` only when substantive text itself is the teaching object or evidence children must read, such as a source, quotation, passage or marked text. It is not the place for the explanation. Otherwise use `null`.

Use `keyQuestions: []` when this Teach chunk earns no key question.

The visual/teaching anchor is not restated in prose. Attach the exact required `representationRefs` and/or `photoRefs` to this source unit.

Do:

```json
{
  "kind": "do",
  "content": {
    "activity": "the small active beat",
    "format": null,
    "task": "the exact question or prompt"
  }
}
```

Use a non-null `format` only when the substantive response structure is genuinely part of the learning; otherwise use `null`.

Practise:

```json
{
  "kind": "practise",
  "content": {
    "activity": "the main application task after all Teach/Do pairs",
    "format": "the substantive form of the work",
    "task": "the exact questions, prompt or structured task",
    "launch": {
      "established": "one line naming what the lesson has established and the task now uses",
      "goodLooksLike": "a good instance of the product beside a weak one, with the difference named; null when the success criteria already show it",
      "steps": ["the steps in the order children take them"]
    }
  }
}
```

`launch` is `null` when children can begin from the question alone.

Put every answer/model/standard only in the source unit's structured `answer` object. Put the exact script or lesson-specific teacher information only in `speakerNotes`.
