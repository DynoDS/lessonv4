# The lesson's representation on slides

The Slide Designer reads this reference whenever any source unit has `representationRefs` or a non-null `modellingState`, and before composing the modelling and practice slides of that lesson. The constant is the structured hand-off: honour the representation registry, exact configuration, `requiredFeatures`, interaction and modelling state on every slide where they apply. This reference holds the presentation mechanics for Prepared example, Live-complete helper, Question and reference, and Physical-demonstration support, plus fill-in diagrams, practice sorts, optional before/change/after treatments, callouts, and faithful missing-helper resolution.

## The modelling resource state sets what the slide must provide

**Prepared example** presents the exact completed example selected upstream when studying the finished form is the useful teaching experience. Choose the smallest template that gives the example and any necessary success criteria or reference enough room to be read. Do not replace it with a blank helper merely because live completion is common elsewhere.

**Live-complete helper** presents the exact starting example in the useful blank or partly blank configuration selected upstream. The helper itself gets the room: use `maths-turn-sc` or `maths-turn-ref-sc` when their slots fit, with the generic working column disabled (`"workingSpace": false` or `"hideWorkingSpace": true`), or another compatible template when it fits better. Leave only the part being learned blank or constructable and pre-fill supporting parts. The teacher chooses how and where to complete or annotate it; the slide does not instruct direct writing on the screen or name another surface.

**Question and reference** shows the exact question, useful criteria and reference while the teacher produces separate working. Follow the upstream hand-off about what will be written. If the model needs on-slide writing, use `maths-turn-ref-sc` with `hideWorkingSpace: false`, `maths-turn-sc` with `workingSpace: true`, or a free layout with enough clear space for that working. `writing-turn-ref-sc` remains suitable when no separate on-slide working is planned. Keep the dataset in `reference` and the criteria in `criteria` when using those template slots; do not let the reference or explanation occupy the promised writing area.

**Physical-demonstration support** shows only the useful support selected upstream: nothing extra, equipment identification, setup or safety information, a diagram, photograph, steps children will later follow, or a reference they will use afterwards. Give it a readable place without competing with the real action. A performative title is optional and is used only when it genuinely helps direct attention to the teacher.

When the task lands on a **word, a choice, or a mark** with nothing to write out (circling a preposition, ticking the right option, naming a word class, matching prefixes to roots), use `body-full` or another free template so the sentence, options, `table` or `matching` fill the body and read from the back. These tasks do not need a separate annotation column unless the specified model includes additional written working. (`maths-turn`, `maths-mtotyt` and `maths-mtotyt-sc` predate the removable working column - see `templates.md` §2.2 - so leave them out of new builds.)

## A live-complete helper's blank slots are the useful starting state

A `maths-turn-sc` or `maths-turn-ref-sc`, built with its working-space flag turned off and a `questionVisual` carrying an unfilled diagram — a part-whole model with empty circles, a multiplication grid with blank cells, a pyramid with blank bricks — may be the complete slide specification for a Live-complete helper. The slide carries the exact question, the blank or partly blank configuration and the SC. Leave the part being learned constructable and pre-fill only supporting parts. The teacher decides how and where to complete it. Do not label a generic working space or assume direct annotation of the slide.

## Working space follows the planned action

Disable generic working space when annotation happens inside the helper or no separate working is planned: `workingSpace: false` on `maths-turn-sc`, `hideWorkingSpace: true` on `maths-turn-ref-sc`. Enable it when the upstream model needs separate on-slide working. Judge the actual writing, reference readability and question together, not the presence of a helper alone. Do not apply one layout reflexively across different modelled moves.

## A read-off model still owes the class a visible example

A read-off move has no line-by-line working, so the modelling resource must still make the selected example and its outcome clear. Follow the upstream resource state. A Prepared example may show the completed pairing from the start when studying it is useful. A Live-complete helper may leave the target value absent so it can be produced during modelling. A Question-and-reference state shows the exact question and readable figure while the teacher decides how to make the result visible. Do not choose the state here or require one live-writing mechanism.

The green answer-reveal the helpers carry (a tally frequency marked `"total": "||12"`, a clock or angle `label` with `||`) remains the answer-reveal treatment on an answer slide. Where a helper has no suitable answer-reveal, name the exact capability need in `notes` and follow the missing-helper process below.

## The diagram takes the available visual space

On-slide maths visuals do their own work — a blank panel beside one would only halve the width of the one thing children are looking at, so none is ever added (the working-space flag turned off throughout, per above). Two families fall here. Some carry empty slots available for live completion: a `mult-grid`'s blank cells, a `pyramid`'s blank bricks, a `part-whole-model`'s empty bubbles. Others are read and traced across rather than filled in: a `coordinate-grid` or `translation-grid` where the class finds the points and counts the squares between them, a `numberline` the class counts along. Either way the diagram claims the full available width so the coordinates and gridlines read from across the room, and any helper that may be annotated remains large enough to use. The teacher decides how and where to complete or annotate it. Resolve the referenced representation and named configuration first. Only when the authoritative configuration description leaves a purely rendering-level field open may the slide designer apply its normal cognitive-load/template rules. Never change the interaction or pedagogical state. Follow the upstream `modellingState`; when written working happens away from the helper, use the Question and reference treatment rather than adding a generic working area. On the answer slide, reveal answers inside the diagram with the `||` marker (green in the cell/brick) where the helper carries one, not as a separate list alongside: the completed diagram is the reveal, following the answer-in-the-form-asked rule in `slide-composition-playbook.md`.

## When prose and modelling state appear to disagree

The structured `modellingState` is authoritative. Follow Prepared example, Live-complete helper, Question and reference, or Physical-demonstration support exactly as named. Do not reinterpret end-state prose as a different modelling state.

If the source prose and structured state cannot both be true, return a named content hand-off fault. Do not add a parenthetical stage direction, paraphrase the question, invent a slot, or place the conflict only in final slide notes.

## Practice sorts: the diagram, its labels, and the items live on the practice slide

When the practice is placing items onto a diagram (sorting shapes onto a Venn or Carroll), show that diagram, with its labels, on the practice slide itself. The `maths-turn-sc` My/Our Turn carries it in the `questionVisual` slot, and the `maths-your-turn-sc` Your Turn takes a `questionVisual` too. Putting the diagram on the slide keeps its labels where the child reads them, on the diagram, so the success criteria stays the pure method and reads identically across My Turn, Our Turn and Your Turn, instead of the labels migrating into the Your Turn's criteria text because the diagram had nowhere else to live.

Those criteria labels are the lesson-designer's content, set per moment and copied exactly, the same way speaker notes and success-criteria steps are. Unlike the SC method, which is the constant thread across the concept, the sort criteria are meant to change between moments: the Your Turn usually sorts by different properties from the taught examples, so a child chooses against fresh criteria rather than echoing the demonstration. So take each diagram's labels from its own moment in the design, the Your Turn's from the Your Turn block (which states them once on its first question, then says "same Venn" / "same Carroll" after). Build the Your Turn diagram from that block rather than reconstructing its labels from the My Turn and Our Turn diagrams already on your slides: lifting one circle from each taught example produces a Venn no moment in the lesson specified.

This reaches past the screen. The child does this same Your Turn again on a printed stick-in sheet that the stick-in-sheets-designer specs from the same design, so the slide and the sheet are one activity in two places. When their criteria match, the slide and the sheet present one consistent task; when they drift, the board and the sheet give different answers for the same shape, and the activity breaks.

Choose the form of the items being sorted from the learning. When appearance, geometry or visual recognition is part of the decision, show the actual shapes, objects or pictures rather than only their names: a `row` or grid of `geoboard`/`triangle`/`polygon` visuals above the Venn or Carroll may be the right form. When the task genuinely works from words, claims or labels, use readable text or chips instead of forcing pictures. Do not default to bare names merely because they are easier to fit, and do not force a visual where it adds no teaching value. In either form the sort diagram is the hero: give it the larger share and keep the item bank compact enough for both to remain readable.

## Use before/change/after when the lesson design says seeing the transformation is worthwhile

When the lesson designer has chosen a clear transformation treatment — 10 more, rounding, an exchange, time passing, change given from a pound — render the starting state, the change or operation and the resulting state so the relationship is visible. A pair joined by a labelled arrow, with the changed part marked and relevant unchanged parts kept clear, is one useful form; the `place-value-chart` before-and-after mode draws it directly. Do not force every transformation into this presentation. The lesson designer may choose another modelling experience or resource state when that better serves the move.

Arrows assert a journey, so chain states only when that journey genuinely happened. Two comparisons sharing a starting point (10 more of 3,462 *and* 100 more of 3,462) are two separate pairs, or two slides — never one chain of three charts, because a chain says the third state grew out of the second. Sequence gets a chain; comparison gets pairs.

When a selected before/change/after treatment needs a helper mode that does not exist, follow the missing-helper process below rather than silently falling back to unrelated end states.

## A slide can point at its own picture

A figure often needs one sentence said about it — *the tens column changes*, *each jump is 10*, *this is where the river starts*. Put that sentence in a text panel beside the picture and nothing connects the words to the part they describe; put it in the speaker notes and the class never sees it; leave it out and the teacher's finger carries it, which is the same voice-dependence the before-and-after rule exists to remove. The `callout` content object is the piece for this: one short line in a small coloured box with an arrow that lands on the part it is about (`points` for the direction, `at` for how far along that edge, and the ordinary inline markers to colour the key word — `templates.md` §4 has the fields).

Two limits keep it honest. **One callout says one thing**: three notes round a diagram is the anatomy-poster shape, and `label-diagram` draws that properly with leader lines into the picture. And **the arrow lands on the edge of the callout's own zone**, so the callout has to sit in a zone touching what it annotates — chart above, callout below pointing up; diagram left, callout right pointing left. Placed in a zone that does not touch its subject, it draws an arrow into empty slide.

## When no template immediately supports what the design names

Check the documented helper catalogue, built-in assets, supported map and circuit configurations, faithful compositions, required photographs, required diagrams, and the existing helper request route. Do not substitute a different visual language or rewrite the task.

If an existing route preserves the exact content, representation, configuration and interaction, use it. If none does, follow the Slide Designer route in `brief-gap-protocol.md`. Do not turn a load-bearing missing visual into prose and do not promote an unfinished slide specification.
