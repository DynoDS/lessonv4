# Working Wall Card Contracts

This file is the one owner of what a wall card may be: each card family's fields, an example, the wall-worthy criteria it must pass, its default orientation, and the visual primitives the builder draws. It is written for `scripts/working-wall-packet.py`, which copies into the Working Wall Designer's reference packet only the families and primitives a lesson can use, so the designer reads the contract for a worked example when the lesson models a method and never reads the contract for a mnemonic poster on a lesson that has none. Sections are cut by exact heading: keep one `### ` heading per card family under `## Card families` and one per primitive under `## Visual primitives`, named exactly as the builder's registry names them, because a family the registry renders and this file does not describe is a card nobody can specify, and the tests refuse that.

The judgement about which card earns a place, and how a card is combined, oriented and worded, lives in `agents/working-wall-designer.md` and the two wall reference files. This file carries the contract, not the judgement.

## The wall-worthy test

A card earns its place only when it passes all of its family's criteria below, and every card of every family also passes two general tests.

**The point-at test.** Name the later lesson in this unit where the teacher would stand at this card and say "remember when". If you cannot name one, the card does not go up, however good it is: it belongs on the board for today and comes down with the lesson. This is the test that decides most runs, and for most lessons it fails, which is why `cards: []` is the commonest correct answer and passes every check. What survives it is not today's technique. In maths it is the representation or the one structure that repeats at several scales; in history it is the chronology, the disciplinary move and the evidence the enquiry keeps returning to.

Why this replaced the older test, which asked whether a child who missed the lesson could use the card alone: that test aims at the wrong reader. A card written for a child who was not there has to explain itself from scratch, so it comes out general and lifeless, and across 45 built lessons the teacher put up two of the 56 sheets it produced. The two he kept were the two he could point at a week later. The card still has to be usable by the child standing in front of it, with enough context, an example or a picture to help without the teacher explaining its layout; it does not have to reteach a missed lesson.

**The visual a card carries.** Choose the visual the card's learning needs, following `working-wall-visual-language.md` → Choose visuals for the card's learning. Preserve a defining representation: the diagram, source or photograph a child recognises the learning by. Every card carries a picture of its learning, never only words: the packet check refuses a teaching card without one, and the answer to a card with no honest picture is to leave it off. An unrelated picture does not make a weak card useful, and a decoration is never what earns a card its place.

This is not the older visual gate: on 6 September 2026 the point-at test replaced the older gate, which asked whether a picture existed in the lesson, excused a step-by-step success-criteria card, and waved through a weak card that happened to carry a picture. The teacher's rule of 29 September 2026 asks whether each sheet carries a picture that shows its learning, success criteria included: a method goes up as its worked example drawn large with the steps pinned to it. A picture still does not earn a card its place; the point-at test above does, and whether the child in front of it can use it.

**A method sheet is read by a child who has forgotten how.** Once a method has passed the point-at test, lay it out so that child can see where to start, what comes next and why each move is made, with each move drawn on the picture and not only named beside it (the teacher's test, 10 October 2026: could you hand the sheet to someone who was never taught this?). One finished example with a sentence under it fails that test; the steps in order, each on its own state of the picture, pass it. This is about how a method is laid out, never about which cards go up: a card is still not written for a child who missed the lesson.

The wall is finite. The normal output is one coherent overview of the lesson's main learning; a second teaching card must do a genuinely different, repeatedly consulted job that the first cannot absorb, and a model text the class writes from does (`annotated-text` below); the exception is a list or table too long for one card, carried in order over two cards of the same title, which is one job split for room (the wall build already offers it, and for success criteria it is how the card makes room, since their words never change). Never more than two teaching cards. Wall furniture (a banner, section headings) is produced only on an explicit request from the teacher or the spawn prompt and counts as physical output.

## Every card

An exact reference table carried over from a rendered teaching table is also a visual reference: its row/column relationships do the lookup job. It need not gain an unrelated picture. This applies only when the headers and rows match the slide table; arbitrary prose in cells is not a carried-over reference.

Fields that every card shares, whatever its family.

| Field | Notes |
|---|---|
| `topic` | Topic of the lesson — drives the output filename. |
| `yearGroup` | Year group — passed through for any year-aware styling. |
| `lessonSlug` | Slug used elsewhere in the pipeline; included for symmetry. |
| `rationaleNote` | One or two sentences explaining why these cards earn a place. Never printed; included on the orchestrator's final report so the teacher sees the reasoning. |
| `cards` | Array of 0–2 teaching cards. Empty when nothing is wall-worthy. One is the default; a second requires a distinct, durable job that cannot be combined without harming five-second readability. |
| `cards[].type` | One of `photoMapOverview`, `heroCallouts`, `causeCards`, `diagramSection`, `stepByStep`, `referenceTable`, `workedExample`, `stickyKnowledge`, `sentenceStem`, `misconception`, `vocabDefinition`, `vocabChips`, `equivalenceGrid`, `mnemonicPoster`, `labelledDiagram`, `sectionHeading`, `banner`. |
| `cards[].page.size` | Always `A3`. Every wall card prints at this size; write it on every card. |
| `cards[].page.orientation` | One of `landscape`, `portrait`. |
| `cards[].title` | Title bar text — short, child-facing. **5 words or fewer, 30 characters or fewer.** Long titles eat the body's space. For `vocabDefinition`, the title IS the term being defined (e.g. "Acute angle", "Denominator"). |
| `cards[].photo` | Optional on the panel families (`stickyKnowledge`, `workedExample`, `misconception`, `vocabChips`), where a missing file falls back to text with no grey placeholder. **Required, and checked before the build renders anything, on the overview families**: every `photoMapOverview` tile and its map, the `heroCallouts` hero, and each `causeCards` person. There the picture is the content, so the build refuses the whole wall and names each empty or unreadable slot. Path relative to `[WORKING_DIR]`. |
| `cards[].picture` | Optional P2 context picture from `context-pictures.md`, supported only on `stickyKnowledge`, `workedExample`, and `misconception`, whose existing photo/visual area is the safe home. In final `working-wall.json` it is either a resolved Educational SVG object with the publisher-returned `educationalSvgId`, `educationalSvgSlug` and `imagePath`, or a complete emoji object `{ "kind": "emoji", "value": "...", "alt": "..." }`. Never leave an unresolved Educational SVG request in the final file and never alter protected lesson wording to insert an emoji. |
| `cards[].decorations` | Optional P3 Educational SVG overlay, supported only on the exact six ordinary card types above. It never changes body fit or earns visual credit. |
| `cards[].visual` | Optional. A drawn diagram the builder generates from primitives - no Unsplash, no AI image. Supported primitives are listed under "Visual primitives" below: `clock`, `shaded-fraction`, `fraction-wall`, `money`, `fractionCircle`, `fractionBar`, `numberLine`, `angleFan`, `turn-diagram`, `angle`, `line-pair`, `triangle`, `comparisonSymbol`, `triangle-square`, `venn`, `carroll`, `geoboard`, `reflection-grid`, `coordinate-grid`, `translation-shape`, `tally-chart`, `pictogram`, `bar-chart`, `line-graph`, `bar-model`, `grid-map`, `rainforest-layers`, `balanced-pattern-plate`, `place-value-chart`, `circuit-diagram`, `parachute-forces`, `place-value-mini`, `base-ten-blocks`, `counter-group`, `part-whole-model`, `pyramid`, `mult-grid`, `digit-cards`, `comparison-slot`, `polygon`, `translation-grid`, `area-grid`, `dial-scale`, `measuring-jug`, `ruler`, `timeline`, `process-chain`, `classification-key`, `concept-map`, `fishbone`, `continuum-line`, `source-pathway`, `number-network`. A tall or square primitive sits to the right of the panel; a wide one (roughly wider than it is tall) is placed full width beneath a full-width panel instead, where it prints as a short strip; the optional `label` field renders as a caption beneath the diagram (omit it and the renderer uses a sensible default - the time, the fraction, the degree value). The geometry primitives (`shaded-fraction`, `fraction-wall`, `money`, `angle`, `line-pair`, `triangle`, `geoboard`, `reflection-grid`, `coordinate-grid`, `translation-shape`, `grid-map`, `rainforest-layers`, `balanced-pattern-plate`, `place-value-chart`, `circuit-diagram`, `parachute-forces`) are the same drawings the slides use, so the wall matches the board. Use a visual whenever the lesson's slide anchor is a drawn diagram and the primitive is supported (see "Diagrammatic LOs"). A `visual` may also carry a `callouts` array (see below) to turn it into a labelled anatomy poster - used by the `labelledDiagram` card. |
| `cards[].visual.callouts` | Optional array on a `visual`, the anatomy-poster annotations. Each entry points a leader line and arrow at a part of the diagram and prints its name in answer-green: `{ "part": "key", "label": "The key: what one symbol is worth" }`. Name the part one of two ways - `part` is a named anchor the primitive exposes (the `pictogram` offers `title`, `key`, `half`, and each category label, e.g. `"Monday"`), which is the robust choice because the geometry resolves the exact spot; or `anchor: [x, y]` is a raw percentage of the diagram for any primitive without named anchors yet. `label` is the printed name; optional `label_at: [x, y]` overrides placement; labels print (not blank) by default. Labels wrap to short lines and stack down the two side margins, so 3–4 callouts read cleanly. A callout naming a part the primitive doesn't expose fails the build outright, so a mistyped part surfaces loudly rather than vanishing; name only parts the primitive exposes. |
| `cards[].visualScale` | Optional. `"panel"` (default) or `"dominant"`. Default `panel` gives the panel ~60% of the card width and the visual ~40%, unless the visual is a wide one, in which case the panel runs full width and the visual is stacked beneath it as a strip - either way the right balance when the steps or body text are the main teaching surface and the diagram supports them. `dominant` flips the balance - the panel shrinks to ~32% and the visual fills the rest of the card. Reach for `dominant` when the diagram itself is the teaching surface and the panel content is more caption than instruction (a colour-coded clock-anatomy poster, a labelled fraction-circle reference, an angle-comparison chart). The Twinkl angle-poster pattern. Don't use `dominant` when the panel carries multi-step instructions children re-read while working - the steps will end up cramped. `"full"` goes further: the panel becomes a strip across the top holding its line or two, and the visual takes the whole sheet beneath it. It is for a picture that IS the card, above all a marked model text (`annotated-text`), which is wide and fills a strip-topped sheet where a side column leaves most of its space empty. |

**Colour marks carry over.** Words copied from the board keep its colour marks, and the renderer draws them in the board's colours: a taught word written `{{word}}` is green in a worked example's steps and lines, a sticky fact, a vocabulary definition, a misconception's two sides, a sentence stem, a reference-table cell, a section's notes and steps and a step-by-step sheet's headings and words (a step headed by the taught word is `{{source}}`), as it is on the board, and `((part))` and `<<decide>>` keep theirs. On a title, any other card's heading, a coloured strip or inside a figure (a labelled diagram's labels, a Venn's items) the word prints plain, and a taught word's braces never print on any card or in any figure. Every other colour on the wall is the renderer's, in the board's meanings.

If nothing earns a card, the file is still written with `cards: []`, the metadata fields and a `rationaleNote` saying why, so the run report can name the lesson.

## Card families

### photoMapOverview

**Wall-worthy criteria, all of which must pass:** Lesson compares 3–5 recognisable categories; Place or distribution is part of the learning; Each tile uses a defining lesson photograph; The map is accurate and comes from the final lesson; Categories and map combine into one five-second overview

**Default orientation:** **Landscape**: photograph tiles and callouts read wide, like every other picture-led card

| Field | Notes |
|---|---|
| `cards[].tiles`, `cards[].map`, `cards[].keySentence` | Used by `photoMapOverview`. Supply 3–5 `{ "title", "photo", "caption" }` tiles, a `map` object with `photo` and `caption`, and one short `keySentence`. Use for categories whose location matters, not as a decorative collage. |


### heroCallouts

**Wall-worthy criteria, all of which must pass:** One real place, person, object or scene anchors the learning; Exactly two related groups of facts explain that context; The photograph is defining rather than decorative; The callouts remain short enough to scan without becoming a fact table

**Default orientation:** **Landscape**: photograph tiles and callouts read wide, like every other picture-led card

| Field | Notes |
|---|---|
| `cards[].heroPhoto`, `cards[].heroCaption`, `cards[].groups` | Used by `heroCallouts`. Supply one defining lesson photograph and exactly two groups shaped `{ "title", "items": [...] }`. Use when one real context anchors two related sets of facts. |


### causeCards

**Wall-worthy criteria, all of which must pass:** Lesson compares exactly three actors, forces or choices; Every example follows the same visible action → reason or cause → effect chain; A defining photograph exists for each; Children benefit from reading each causal story as a whole rather than scanning table cells

**Default orientation:** **Landscape**: photograph tiles and callouts read wide, like every other picture-led card

| Field | Notes |
|---|---|
| `cards[].people` | Used by `causeCards`. Supply exactly three `{ "title", "photo", "action", "reason" }` objects. Use when the lesson compares three actors through the same causal chain: who → what they do → why. |


### diagramSection

One wall **section** rather than one lesson's sheet: two to four drawn parts side by side under a single section title, each with its own heading, its own figure and a line or two of the actual numbers underneath. The shape of a real maths working wall, where `NUMBER LINES` holds the line the class read and the line they found the midpoint on, and `ROUNDING` holds the marked line beside the three-step strategy.

This is the only family that puts several **drawn** figures on one sheet. `photoMapOverview`, `heroCallouts` and `causeCards` each require photographs, so before this family existed a lesson whose pictures were drawings could only produce a panel of words with one figure beside it. If the learning is carried by diagrams, reach for this before a `workedExample`.

**Wall-worthy criteria, all of which must pass:** Two to four drawn figures carry the learning, and each part shows a different case, step or scale of one idea rather than the same figure twice; the parts belong under one section title a child could point to from across the room; each part's words are the worked numbers or the finding themselves, not a description of the method to follow; you can name the later lesson in this unit where the teacher would point at this section and say "remember when".

**Do not use it when:** one figure carries the learning with nothing worked beside it (that is `stickyKnowledge` or `labelledDiagram`; one figure with its lines of working is a section of one part, below); the figures are photographs (`heroCallouts`, `photoMapOverview`, `causeCards` are shaped for those); or the parts have no honest shared section title, which means they are separate sheets and the wall has room for at most two.

**Default orientation:** **Landscape**: sections sit side by side on the wall, and a wide figure like a number line reads across. Portrait stacks the parts instead.

**A before and an after.** `"sequence": true` on the card says its parts are stages of one thing in order, most often a before and an after of the one move a lesson turns on (`Before`: 2 − 8 ringed; `After`: the 4 crossed out, 12 ones). Parts side by side are then joined by an arrow, and what each stage adds to its picture (a subtraction's `exchanges`, a `ring`, a number line's jumps) is drawn in that stage's colour, so leave those uncoloured. Use it for a single move; a whole method of three or more moves is a `stepByStep`.

**One part: one idea with the sheet to itself.** A section may also have a single part, so `parts` holds one to four: the drawing, the line or two of numbers under it and its answer strip, on a sheet of its own. Use it when two ideas would otherwise share a sheet and neither picture would be big enough to point at: the perimeter of an L-shape on one sheet and its area on another, each shape nearly twice the size it prints at when they share (the teacher's choice from pictures of both, 10 October 2026). Each one-part sheet in a wall takes the next part colour, title bar included, so two of them read as two different things; give each its own title. A squarish drawing with lines under it wants `portrait`; a wide one wants `landscape`. See principle 7 in `working-wall-preferences.md` for which ideas share a sheet.

| Field | Notes |
|---|---|
| `cards[].title` | The section name, as it would be read across the room: `Number lines`, `Rounding`, `Place value`. Same 5-word, 30-character cap as every card title. |
| `cards[].parts` | 2–4 part objects. Four parts lay out two-by-two; two or three sit in a row on landscape. |
| `cards[].parts[].heading` | Required. What this part shows, in the lesson's own words: `Rounding to the nearest 10`, `Estimating and finding the midpoint`. It shrinks to fit its own column, so keep it to one line where you can. |
| `cards[].parts[].visual` | The drawn figure, exactly as the board drew it: any primitive under "Visual primitives". At least one part must carry one, and a part that names a figure the builder cannot draw fails the build rather than printing its words alone. A part with no figure is for something like the three-step strategy beside the marked line. |
| `cards[].parts[].notes` | Short lines under the figure: the worked numbers (`start 1,200   end 1,600`), or the finding (`The midpoint between 2,000 and 3,000 is 2,500.`). Not instructions. |
| `cards[].parts[].steps` | Optional numbered method, when this part *is* the strategy: `["Change the ones digit to 0.", "Add 10.", "Mark halfway and your number.", "Round to the nearer ten. If it is halfway, round up."]`. When the steps are the lesson's success criteria they are copied word for word, the same number of steps and the same colour marks, as on a worked-example card. Each step prints its number in the same circle as its pin on the figure: within a part, the list and the drawing carry one mark per step (the teacher's rule, 3 October 2026; parts may differ from each other, and so may their box colours). Steps beside the part's own figure are the close-up reminder, as on a `pictureFirst` card, so they print down to 28pt and may wrap to three lines; notes alone keep the wall's 36pt. Pin the steps onto the figure with `visual.callouts[].step` the same way. So one sheet can carry two worked methods side by side (the checks for 11 and for 4, each its own example drawn as digit cards with its steps pinned to it), and a lesson with four short methods takes two such sheets. |
| `cards[].parts[].result` | Optional single answer line, printed on its own coloured strip so a child finds the result before the workings: `347 rounds to 350.` |
| `cards[].parts[].worked` | `true` when the part shows a worked example rather than the answer, a mistaken one always (`Sam wrote 340.`): its result strip is the worked-example purple, as on the board. Without it the strip is answer green, which tells a child the result is right. |

The layout gives the figure the room and the words what is left: a part's text is held to a share of its height so a long note can never push the drawing down to a strip. That is the rule, so write notes that fit beside a picture rather than replacing it. Notes print at the wall's 36pt and grow past it only where the drawing cannot use the height (a number line as wide as its part), and the same shape drawn in two parts of a row prints one size in both. A drawing's own numbers and labels print at wall size too: when a part gives its drawing too little room for that, the build refuses the card with `WALL_FIGURE_WORDS_TOO_SMALL`, and the answer is fewer parts or a sheet each.

**Complete example:**

```json
{
  "type": "diagramSection",
  "page": { "size": "A3", "orientation": "landscape" },
  "title": "Rounding",
  "parts": [
    {
      "heading": "Rounding to the nearest 10",
      "visual": { "type": "numberLine", "start": 340, "end": 350, "interval": 5, "labels": "all", "answer": { "at": 347, "text": "347" } },
      "notes": ["347 is closer to 350 than to 340."],
      "result": "347 rounds to 350."
    },
    {
      "heading": "Strategy",
      "steps": ["Change the ones digit to 0.", "Add 10.", "Mark halfway and your number.", "Round to the nearer ten. If it is halfway, round up."]
    }
  ]
}
```


### stepByStep

A method or a sequence told **stage by stage down the page**: each step a coloured card with a large number on its corner, and beside it the picture of that stage. The teacher's own choice of sheet for a method (5 October 2026): he took down a column addition wall that showed one finished sum with five step numbers scattered over it, and approved this one, where the sum is drawn again beside every step, one move further on each time, and the digit just written is picked out. He asked for it in any subject, so the stages can as well be the events of a story beside their photographs, the steps of an investigation, or a sentence being built up.

**Wall-worthy criteria, all of which must pass:** the learning is an order (a method children will repeat, or a sequence they must retell); each step changes something a picture can show, so the pictures differ from one step to the next; you can name the later lesson where the teacher would point at one step and say "remember when".

**Do not use it when:** the pictures would be the same picture repeated (steps that are decisions or reminders, with nothing new drawn, belong on a `pictureFirst` `workedExample`, one picture with the steps pinned to it); the parts are cases or scales of one idea with no order between them (`diagramSection`); or the parts have no picture of their own to stand beside.

**Orientation:** always **portrait**, because the page is read top to bottom in the order the method happens. The build refuses landscape.

| Field | Notes |
|---|---|
| `cards[].title` | The method or sequence, as it would be read across the room: `How to add in columns`. |
| `cards[].example` | Optional. The one example every step works on, printed in a strip under the title: `247 + 135`. Leave it out when the steps are not all about one example. |
| `cards[].steps` | 2-6 step objects, in order. |
| `cards[].steps[].heading` | Required. What this step does, in a few bold words: `Add the ones`. The words have three weights so the eye finds the step, then what it does, then how; put each thing in its own field and never fold all three into the heading. |
| `cards[].steps[].key` | Optional. The one line that matters most, printed bold in the step's colour: the sum (`7 + 5 = 12`), the date, the quoted words. Copy it from the lesson. |
| `cards[].steps[].text` | Optional. A short plain sentence, or a list of two: `Write the 2 in the ones.` When the steps are the lesson's success criteria, their wording comes from there. |
| `cards[].steps[].visual` | The picture of this stage, as the board drew it: any primitive under "Visual primitives", showing the example as it stands after this step. For a column sum, the same `calculation` with the `answer` and `carry` filled in only as far as this step has reached (`"answer": "82"` once the ones and tens are added). Or `photo`, a lesson photograph. On a number line, give each step the jumps made so far: the build draws each jump in the colour of the step that first shows it, so leave jumps uncoloured. On a column subtraction, give each step the `exchanges` made so far (`[{ "from": "T", "to": "O" }]`): the build crosses out the digit, writes the new one above it and adds the small 1, all in the colour of the step that made that exchange, so a step that says "cross out the 4" shows the 4 crossed out. `"ring": "O"` rings the column a step is looking at, in that step's colour. A step may go without a picture, and its card then runs the full width, but the sheet needs at least one. A lesson photograph goes in `photo`, below, and not here as a `label-diagram`. |
| `cards[].steps[].photo` | A lesson photograph as this step's picture, in place of `visual`. It fills its row, and what the step is about is labelled on the photograph itself: `note` is the label (`["tributary"]`), `point` is where it is, as `[x%, y%]` of the photograph. One label a photograph, for the thing this step names, so the eye goes from the card to one place. A `label-diagram` with one or two callouts is refused on a step: it keeps the photograph's own shape with its labels out in the margins, so six down a sheet printed at six sizes with blank strips round them (the river sheet, stress test of 7 October 2026). |
| `cards[].steps[].noteCorner` | Optional, on a `photo` step. The label stands in the corner of the photograph furthest from the place it points at. When that corner holds something worth seeing (the marker post at a river's source, a face), name another: `"top left"`, `"top right"`, `"bottom left"` or `"bottom right"`. Look at the photograph before choosing. `also` takes its own `corner` the same way. |
| `cards[].steps[].also` | Optional, on a `photo` step that has its own `note` and `point`: a second place on the same photograph, `{ "note": "confluence", "point": [x%, y%] }`. It prints as a second label with its own arrow, in the colour of the step whose heading is that word (`confluence` on the tributary's photograph is the colour of the confluence step), and plain white when no step names it; so write the word exactly as that step's heading has it. One label is the usual sheet, because two send the eye to two places. Add the second when this step's meaning is how the two places relate and the photograph shows both (a tributary is the smaller river that runs to the confluence, so the photograph of one river meeting another may name both); leave it out when the second thing merely happens to be in the shot. The two places must be close enough to stay in the photograph once it is trimmed to its row; the build says when they are not. |
| `cards[].steps[].focus` | Optional, for a step whose picture is a `photo`. A photograph fills the room beside its card, trimmed to that shape, so five photographs down a page are all one size and none stands small beside a blank strip (the teacher's choice from pictures of the Great Fire of London sheet, 10 October 2026). `focus` is the part to keep: `"top"`, `"bottom"`, `"left"`, `"right"`, `"centre"`, or `[x%, y%]` of the photograph. Look at the photograph and name where its subject is: a row five to a page keeps about the middle three fifths of an ordinary photograph's height, so a subject at the top or the foot is cut off unless you say. Left out, the trim keeps the place `point` names, or the middle. A photograph that would lose most of itself (a tall portrait) is shown whole instead, and a drawing is never trimmed. |
| `cards[].steps[].note` | Optional. A few words in a small box with a curly arrow to one place in the picture: `["10 ones", "for 1 ten"]`, the first line bold. A label, not a sentence; three short lines at most. On a photograph the box stands on the picture itself, in the corner furthest from the place it points at. |
| `cards[].steps[].point` | Where the note's arrow lands, and what is ringed. A place the picture names (a column sum names `sign` and each digit, `ones answer`, `tens carry`, `hundreds number 1`; a number line names `jump 1`, `jump 2`...), or `[x%, y%]` of a photograph. Point at what this step wrote or changed. A name the picture does not have stops the build and lists the names it does. |

**How many steps on a sheet.** Up to six steps go on one sheet, and a sequence of six or fewer is never split: the teacher chose six river features down one sheet over the same six as three and three (10 October 2026), because the order is what the sheet shows. Seven or more are too many rows for a picture to be read, so first ask whether two moves are really one step, and if not, split the sequence evenly over two `stepByStep` cards with the same `title`, one straight after the other (seven as four and three, eight as four and four, never six and two, so the rows are the same height on both). Write each card's steps as its own list: the build carries the count and the colours on, so the second sheet prints 5, 6, 7, 8. The same title is what tells the build they are one sequence; two different methods take two different titles and each starts at 1.

The cards share one text size across the sheet. Write each step's words as the lesson has them: when a sentence will not fit at the smallest size, the build widens every card a little and narrows the pictures before it refuses anything. A step it still refuses by name is too long for a card, so keep each step to a heading, one key line and one short sentence.

```json
{
  "type": "stepByStep",
  "page": { "size": "A3", "orientation": "portrait" },
  "title": "How to add in columns",
  "example": "247 + 135",
  "steps": [
    { "heading": "Line up the digits", "text": ["Ones under ones.", "Tens under tens."],
      "visual": { "type": "place-value-chart", "columns": ["Hundreds", "Tens", "Ones"], "calculation": { "operator": "+", "numbers": ["247", "135"] } } },
    { "heading": "Add the ones", "key": "7 + 5 = 12", "text": "Write the 2 in the ones.",
      "visual": { "type": "place-value-chart", "columns": ["Hundreds", "Tens", "Ones"], "calculation": { "operator": "+", "numbers": ["247", "135"], "answer": "2" } },
      "note": ["7 + 5 = 12", "Write 2 ones"], "point": "ones answer" },
    { "heading": "Exchange", "key": "12 ones = 1 ten and 2 ones", "text": "Write a small 1 under the tens.",
      "visual": { "type": "place-value-chart", "columns": ["Hundreds", "Tens", "Ones"], "calculation": { "operator": "+", "numbers": ["247", "135"], "answer": "2", "carry": { "Tens": "1" } } },
      "note": ["10 ones", "for 1 ten"], "point": "tens carry" }
  ]
}
```

### referenceTable

**Two things side by side.** When a three-column table compares two things (Athens beside Sparta, a row per question), the build gives the two value columns equal width and each its own heading colour, blue then orange. Write a few words a box (wording preferences, Reference table cards). Put a picture of each above its column as the first row, `["", { "photo": "…" }, { "photo": "…" }]`: a row of pictures alone takes whatever height the words leave, so the fewer and shorter the rows, the larger the pictures. Under the pictures, give each side's big idea as a key row (`"keyRows": [1]`, `["The big idea", "Citizens ran the city", "The army came first"]`): the one reason the rows below follow from, in a few words, taken from the lesson's own sticky facts. The teacher chose the sheet with this row over the same sheet with larger pictures and no row ("it has the big idea, and the picture's not that much smaller"), so keep it and shorten other boxes first when height is short. This is the sheet the teacher approved for a comparison (10 October 2026), in place of a separate photograph sheet for each side.

**Wall-worthy criteria, all of which must pass:** Lesson uses a genuine reference table to support children during the work; Children repeatedly scan across shared fields and down records; Each row teaches itself with its example; Same columns as the slides/worksheets used; A diagram, flow, map or callout composition would not express the relationship more directly

**Default orientation:** **Landscape**: needs room for the column grid plus the example column without cramping

| Field | Notes |
|---|---|
| `cards[].columns` | Used by `referenceTable` only. Array of column header strings (typically 2 or 3). |
| `cards[].keyRows` | Used by `referenceTable` only. Optional. The numbers of the rows (counting from 0) that say each column's main point, such as a unit's big idea for each of two places: `[1]`. A key row prints in its column's colour on that colour's tint. One is usual; a table of key rows has none. |
| `cards[].rows` | Used by `referenceTable` and `equivalenceGrid`. For `referenceTable`, an array of row arrays — each row is an array of cells, length matching `columns`. A cell is usually a string, but may instead be a diagram (`{ "visual": { "type": "line-pair", … } }`) or a verified lesson photograph (`{ "photo": "unsplash/..." }`). This is how a classification table carries a defining picture per row (name · picture · meaning), the Twinkl "Types of …" poster. Photo cells follow the same final-visual reuse rule as card-level photos. For `equivalenceGrid`, an array of `{ "visual": {...}, "values": ["1/2", "0.5", "50%"], "colour": "F97316" }` objects — `colour` optional (palette default). |

Example:

```json
{
  "type": "referenceTable",
  "page": {
    "size": "A3",
    "orientation": "landscape"
  },
  "title": "Conjunctions",
  "columns": [
    "Conjunction",
    "What it tells you",
    "Example"
  ],
  "rows": [
    [
      "when",
      "the time",
      "when she opened the door"
    ],
    [
      "if",
      "the condition",
      "if you find the key"
    ],
    [
      "because",
      "the reason",
      "because the door slammed"
    ],
    [
      "although",
      "the contrast",
      "although it was raining"
    ]
  ],
  "photo": null
}
```

### workedExample

**Wall-worthy criteria, all of which must pass:** Lesson teaches an explicit multi-step procedure children will repeat; Model is durable (still useful in 2 weeks); Worth glancing back at, not just doing once; Includes a finished worked example, not just steps

**The worked example works one case through to an answer, and finishes somewhere other than where it started.** A card covering more than one operation shows one example of each, never one example and its undo. A "10 and 100 more or less" wall card carried `2,950 + 100 = 3,050; 3,050 - 100 = 2,950`: it adds a hundred and takes it straight back off, so a child reading it sees the two operations cancel and learns nothing about finding either. The lesson itself had written the clean version, `100 more than 2,950 is 3,050`, and the card manufactured the return trip to make one example cover both halves of its title. Copy the lesson's example. If the card genuinely needs both directions, give both directions their own worked line from different starting numbers, or let the title cover only the direction the example shows.

**Default orientation:** **Landscape**: needs room for steps without cramping. A wide figure (a number line) over four or five steps reads better in **portrait**.

**Build it picture-first.** Set `layout: "pictureFirst"`: the question line across the top, the figure large beneath it, then each step beside its own line of working. The four ideas behind it are in `working-wall-visual-language.md` → Choose visuals for the card's learning. The older layout, steps down the left and the example as one line under them, still draws a card written without `layout`, but it is the shape the teacher took down.

| Field | Notes |
|---|---|
| `cards[].layout` | `"pictureFirst"` for the picture-led method sheet. It needs a `visual` (or a lesson `photo`) and at least one step; the build refuses it without either. The steps print at a lower floor than the rest of the wall (28pt), as the close-up support beside a large picture; the question and the working print larger. When the steps and working still cannot fit beside the picture, the build says so, and the card is left off: the picture never comes off. |
| `cards[].items[].working` | On a `pictureFirst` card, the line of working a step does, printed on one line in a white box beside the step: `"48 + 20 = 68"`. Copy it from the board's own method frame, line for line. A step the board gave no line of working (a yes/no decision) has none; do not invent a sentence to fill the box. Rejected on any other layout. |
| `cards[].visual.callouts[].step` | A whole number. Instead of a word label, the callout prints that step's number in a green circle ON the picture at the place the step happens, with no leader line. Name the place with `part` (a number line names `"jump 1"`, `"jump 2"`... in the order its `jumps` are listed, each spot just above that jump's label) or `anchor: [x%, y%]`. A step that names a place the drawing does not have stops the build. Pin only the steps the picture shows. A column sum (`place-value-chart` with `calculation`) is the exception to "on the picture": every cell holds a digit, so a circle laid on the grid covers one or lands on the line between two and points at nothing. There the circle stands outside the grid with an arrow to one exact place, and the build chooses the side and keeps the arrow off the other digits. Name the place with `part`: `sign`, or a column and a row, `ones number 1`, `ones number 2`, `ones answer`, `tens carry`, `hundreds heading`. Point each step at the digit it writes or reads in this example ("Start with the ones" at the top ones digit, the exchange at the carried 1); `anchor` numbers are refused on this drawing. |
| `cards[].visual.callouts[].note` | On any card's drawing: a few words in a small blue box beside the picture, a curly arrow from it, and a ring round the one place it is about. Use it when the card's words are about one particular part of its picture and nothing else in the picture picks that part out ("A zero holds an empty place" over a sum with a zero in it). `{ "part": "tens number 1", "note": ["The zero", "holds the", "tens place"] }`: `part` as for a step, or `anchor: [x%, y%]` on a drawing that names no places; up to three short lines, the first bold. A label, not a second sentence, and one or two a picture at most. A drawing carries notes or step circles, not both. |
| `cards[].items` | Used by `workedExample`, `stickyKnowledge`, `sentenceStem`, `misconception`, `mnemonicPoster`. One or more entries. For `mnemonicPoster`, each item is `{ "letter": "R", "phrase": "Read carefully", "colour": "9333EA" }` — `colour` optional (palette default). For all other types, `label` optional, `text` required. **For `sentenceStem`, items optionally carry `filled` — the fully-modelled version of the same stem with the blank completed.** Populate `filled` when the lesson-design models the completion (the My Turn slide shows the worked sentence, the SC carries the modelled version). The card prints the gappy text on top in black and the `filled` text directly beneath in the green panel accent so children read the pair as one card. Leave `filled` out when children are meant to invent their own completion; see `working-wall-preferences.md` for the full rule. |

**A colour a step.** On a `pictureFirst` sheet the build gives each step its own colour: its card and number in the list, its line of working, its circle on the picture, and what that step writes on the picture (the jump it is pinned to, or the exchange whose new digit it is pinned to, `"part": "tens exchange"`). So leave circles, jumps and exchanges uncoloured, and pin each step that writes something to the thing it writes. All in one green, nothing showed which step went with what (the teacher, 10 October 2026).

Example, the Year 4 wall this layout was built for. The board showed the tens jump and the bridging jumps on separate slides; the figure joins them into the one worked example's whole journey, 45 to 75 so the short jumps keep room for their labels. Step 3 is a decision with no line of working on the board, so it has none here and no pin on the line.

```json
{
  "type": "workedExample",
  "layout": "pictureFirst",
  "page": { "size": "A3", "orientation": "portrait" },
  "title": "Tens, then ones",
  "items": [
    { "label": "Worked example", "text": "48 + 25 = 73" },
    { "label": "Step 1", "text": "{{Partition}} the second number into tens and ones.", "working": "25 = 20 + 5" },
    { "label": "Step 2", "text": "Count on the <<tens>> from the first number.", "working": "48 + 20 = 68" },
    { "label": "Step 3", "text": "Will the ones go past the next ten? If not, add them." },
    { "label": "Step 4", "text": "If they will, add enough ones to <<reach the next ten>>.", "working": "68 + 2 = 70" },
    { "label": "Step 5", "text": "Add the ones that are left.", "working": "70 + 3 = 73" }
  ],
  "visual": {
    "type": "numberLine", "start": 45, "end": 75, "interval": 1, "labels": [48, 68, 70, 73],
    "jumps": [ { "from": 48, "to": 68, "label": "+20" }, { "from": 68, "to": 70, "label": "+2" }, { "from": 70, "to": 73, "label": "+3" } ],
    "callouts": [ { "part": "jump 1", "step": 2 }, { "part": "jump 2", "step": 4 }, { "part": "jump 3", "step": 5 } ]
  }
}
```

### labelledDiagram

**Wall-worthy criteria, all of which must pass:** Lesson's job is learning to *read* a diagram (a pictogram, clock, grid map, chart) — recognising its parts and what they mean, not calculating with it; The diagram is a supported primitive whose parts you can call out; The parts a child must recognise (and the one most often misread) are worth naming on the picture; Reach for this as the hero on "how to read a …" lessons, paired with a worked-example "how to find a value" card when the lesson also drills a method (see `working-wall-visual-language.md`, "The anatomy poster")

**Default orientation:** **Landscape**: the annotated diagram fills a wide card, labels stacked down the two side margins

| Field | Notes |
|---|---|
| `cards[].caption` | Optional. Used by `labelledDiagram` — one short line under the annotated diagram (e.g. "Read the key, count the symbols, then multiply"). It prints as large as one line across the sheet allows, 44pt at most, so about 50 characters keeps it big. |
| `cards[].visual` | The diagram with its `callouts`, or a `label-diagram` (a labelled photograph). It fills the sheet under the title, and its own numbers and labels print at wall size: this is the card for a chart or a labelled photograph that another card refused with `WALL_FIGURE_WORDS_TOO_SMALL`. |

Example:

```json
{
  "type": "labelledDiagram",
  "page": {
    "size": "A3",
    "orientation": "landscape"
  },
  "title": "Parts of a pictogram",
  "visual": {
    "type": "pictogram",
    "title": "Library books borrowed this week",
    "categories": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday"
    ],
    "values": [
      30,
      45,
      25,
      60
    ],
    "key": {
      "per": 10,
      "label": "books"
    },
    "callouts": [
      {
        "part": "title",
        "label": "What this pictogram is showing"
      },
      {
        "part": "key",
        "label": "The key: what one symbol is worth"
      },
      {
        "part": "half",
        "label": "Half a symbol means half the key"
      },
      {
        "part": "Monday",
        "label": "Monday = 30"
      }
    ]
  },
  "caption": "Read the key, count the symbols, then multiply."
}
```

### stickyKnowledge

**Wall-worthy criteria, all of which must pass:** The fact is concrete and durable; Specific to this LO (not generic); Glance-able — a child re-reads and gets the answer instantly; Self-contained (does not assume context the child has lost)

**Default orientation:** **Landscape**: one big bold fact reads better wide

| Field | Notes |
|---|---|
| `cards[].items` | Used by `workedExample`, `stickyKnowledge`, `sentenceStem`, `misconception`, `mnemonicPoster`. One or more entries. For `mnemonicPoster`, each item is `{ "letter": "R", "phrase": "Read carefully", "colour": "9333EA" }` — `colour` optional (palette default). For all other types, `label` optional, `text` required. **For `sentenceStem`, items optionally carry `filled` — the fully-modelled version of the same stem with the blank completed.** Populate `filled` when the lesson-design models the completion (the My Turn slide shows the worked sentence, the SC carries the modelled version). The card prints the gappy text on top in black and the `filled` text directly beneath in the green panel accent so children read the pair as one card. Leave `filled` out when children are meant to invent their own completion; see `working-wall-preferences.md` for the full rule. |

Example:

```json
{
  "type": "stickyKnowledge",
  "page": {
    "size": "A3",
    "orientation": "landscape"
  },
  "title": "Remember",
  "items": [
    {
      "text": "When the bottom numbers match, just add the top numbers."
    }
  ],
  "photo": "unsplash/pizza-slices.jpg"
}
```

### sentenceStem

**Wall-worthy criteria, all of which must pass:** Lesson introduces a *new* stem tied to this concept; Not a generic stem children already use elsewhere; Stem is a complete sentence with the blank in place; When the lesson-design models the completion (My Turn / SC shows the worked sentence), populate `filled` so the card carries the gappy and modelled versions together

**Default orientation:** **Landscape**: stems are typically wide phrases

| Field | Notes |
|---|---|
| `cards[].items` | Used by `workedExample`, `stickyKnowledge`, `sentenceStem`, `misconception`, `mnemonicPoster`. One or more entries. For `mnemonicPoster`, each item is `{ "letter": "R", "phrase": "Read carefully", "colour": "9333EA" }` — `colour` optional (palette default). For all other types, `label` optional, `text` required. **For `sentenceStem`, items optionally carry `filled` — the fully-modelled version of the same stem with the blank completed.** Populate `filled` when the lesson-design models the completion (the My Turn slide shows the worked sentence, the SC carries the modelled version). The card prints the gappy text on top in black and the `filled` text directly beneath in the green panel accent so children read the pair as one card. Leave `filled` out when children are meant to invent their own completion; see `working-wall-preferences.md` for the full rule. |

Example:

```json
{
  "type": "sentenceStem",
  "page": {
    "size": "A3",
    "orientation": "landscape"
  },
  "title": "How to explain it",
  "items": [
    {
      "text": "I added the numerators because ___.",
      "filled": "I added the numerators because the denominator was already the same."
    },
    {
      "text": "The denominator stays the same because ___."
    }
  ],
  "photo": null
}
```

### misconception

**Wall-worthy criteria, all of which must pass:** Specific and visualisable; Likely to recur across later lessons; Self-correctable by glancing at the card; Includes both wrong and corrective halves; Cannot be integrated as a small visual correction within the main overview; A generic `Look out for` page does not earn space by itself

**Default orientation:** **Landscape**: "wrong vs right" pair fits side-by-side

| Field | Notes |
|---|---|
| `cards[].items` | Used by `workedExample`, `stickyKnowledge`, `sentenceStem`, `misconception`, `mnemonicPoster`. One or more entries. For `mnemonicPoster`, each item is `{ "letter": "R", "phrase": "Read carefully", "colour": "9333EA" }` — `colour` optional (palette default). For all other types, `label` optional, `text` required. **For `sentenceStem`, items optionally carry `filled` — the fully-modelled version of the same stem with the blank completed.** Populate `filled` when the lesson-design models the completion (the My Turn slide shows the worked sentence, the SC carries the modelled version). The card prints the gappy text on top in black and the `filled` text directly beneath in the green panel accent so children read the pair as one card. Leave `filled` out when children are meant to invent their own completion; see `working-wall-preferences.md` for the full rule. |

Example:

```json
{
  "type": "misconception",
  "page": {
    "size": "A3",
    "orientation": "landscape"
  },
  "title": "Look out for",
  "items": [
    {
      "label": "Don't",
      "text": "2/5 + 1/5 = 3/10"
    },
    {
      "label": "Do",
      "text": "2/5 + 1/5 = 3/5  — the bottom number stays the same"
    }
  ],
  "photo": null
}
```

### vocabDefinition

**Wall-worthy criteria, all of which must pass:** Lesson teaches a piece of mathematical or subject-specific vocabulary children will use across the unit; The term has a child-language definition and a drawn example you can express with one of the supported visual primitives; Children will need to look it up again later (not a one-lesson word)

**Default orientation:** **Landscape**: one term + drawn example reads at the same scale as sticky knowledge

| Field | Notes |
|---|---|
| `cards[].definition` | Used by `vocabDefinition` only. The lesson's own child-readable definition, in the lesson's words; shortened only when it genuinely cannot fit, and then still a whole sentence a teacher would say. It may use more than one short sentence when forcing it into one would damage accuracy. The visual is what shows what the term looks like; the definition is what it means. |
| `cards[].chips` | Used by `vocabChips` only. An array of 4–12 chip objects: `{ "word": "ten pence", "photo": "money/10p.png" }`. `word` is required and should be a short noun or noun-phrase (≤ 2 words, ≤ 12 characters reads cleanly). `photo` is optional — when present and the file exists, the renderer draws the photograph to the right of the word inside the pill, at its own shape (a wide one spreads into the room beside the word, a tall one stands narrower), sized from the room the grid leaves: a four-chip card sits in two rows and its pictures are inches across, a twelve-chip card sits in six and they are small. The chips share the whole page and are all one size. A long word is never shrunk to make a photograph wider. Photo filenames must already be listed in `photo-requirements.json`; missing files fall back gracefully (text-only pill). Use chip cards when the lesson introduces a *set* of related vocabulary children will use across the unit and the words don't each warrant a `vocabDefinition` card; see `working-wall-preferences.md` for the depth-vs-breadth rule. |


### vocabChips

**Wall-worthy criteria, all of which must pass:** Lesson introduces a *set* of 4+ related vocabulary words children will use across the unit (money words, body parts, weather words, science apparatus); Each word is concrete enough children can use it without a definition (already half-known, or meaning obvious in context); The words don't each warrant their own `vocabDefinition` card — central tier-3 concepts go on definition cards instead; Optional `photo` per chip pairs an image cue with the word; mix paired and plain chips rather than image-padding the whole grid

**Default orientation:** **Landscape**: a 2-column grid of short pills, sized for 4–12 chips per page

| Field | Notes |
|---|---|
| `cards[].chips` | Used by `vocabChips` only. An array of 4–12 chip objects: `{ "word": "ten pence", "photo": "money/10p.png" }`. `word` is required and should be a short noun or noun-phrase (≤ 2 words, ≤ 12 characters reads cleanly). `photo` is optional — when present and the file exists, the renderer draws the photograph to the right of the word inside the pill, at its own shape (a wide one spreads into the room beside the word, a tall one stands narrower), sized from the room the grid leaves: a four-chip card sits in two rows and its pictures are inches across, a twelve-chip card sits in six and they are small. The chips share the whole page and are all one size. A long word is never shrunk to make a photograph wider. Photo filenames must already be listed in `photo-requirements.json`; missing files fall back gracefully (text-only pill). Use chip cards when the lesson introduces a *set* of related vocabulary children will use across the unit and the words don't each warrant a `vocabDefinition` card; see `working-wall-preferences.md` for the depth-vs-breadth rule. |

Example:

```json
{
  "type": "vocabChips",
  "page": {
    "size": "A3",
    "orientation": "landscape"
  },
  "title": "Money words",
  "chips": [
    {
      "word": "amount"
    },
    {
      "word": "cost"
    },
    {
      "word": "change"
    },
    {
      "word": "ten pence",
      "photo": "money/10p.png"
    },
    {
      "word": "pound",
      "photo": "money/1pound.png"
    },
    {
      "word": "spend"
    }
  ]
}
```

### equivalenceGrid

**Wall-worthy criteria, all of which must pass:** Lesson teaches multiple equivalent forms of the same value (fractions ↔ decimals ↔ percentages, common fractions and their bar/circle pictures, etc.); Children look across forms repeatedly and benefit from seeing them stacked; Each row pairs a drawn primitive with the equivalent values

**Default orientation:** **Portrait**: vertical stacking of equivalence rows wants the long axis

| Field | Notes |
|---|---|
| `cards[].rows` | Used by `referenceTable` and `equivalenceGrid`. For `referenceTable`, an array of row arrays — each row is an array of cells, length matching `columns`. A cell is usually a string, but may instead be a diagram (`{ "visual": { "type": "line-pair", … } }`) or a verified lesson photograph (`{ "photo": "unsplash/..." }`). This is how a classification table carries a defining picture per row (name · picture · meaning), the Twinkl "Types of …" poster. Photo cells follow the same final-visual reuse rule as card-level photos. For `equivalenceGrid`, an array of `{ "visual": {...}, "values": ["1/2", "0.5", "50%"], "colour": "F97316" }` objects — `colour` optional (palette default). |
| `cards[].colour` | Used by `sectionHeading` (required), `mnemonicPoster` and `equivalenceGrid` rows (optional). 6-char hex without the leading `#`. For section headings, supply a different rainbow-palette colour per heading so adjacent zoners cycle through hues — never repeat across two adjacent headings on the same wall. |


### mnemonicPoster

**Wall-worthy criteria, all of which must pass:** Lesson teaches a multi-letter mnemonic children will use as a procedure (RUCSAC, BIDMAS, BUS-STOP for division, KFC for fraction division); The mnemonic is durable (used across the unit, not just the lesson); Each letter has a clear, single-sentence expansion

**Default orientation:** **Landscape**: multi-page; per-letter pages need a wide canvas for the saturated letter box

| Field | Notes |
|---|---|
| `cards[].items` | Used by `workedExample`, `stickyKnowledge`, `sentenceStem`, `misconception`, `mnemonicPoster`. One or more entries. For `mnemonicPoster`, each item is `{ "letter": "R", "phrase": "Read carefully", "colour": "9333EA" }` — `colour` optional (palette default). For all other types, `label` optional, `text` required. **For `sentenceStem`, items optionally carry `filled` — the fully-modelled version of the same stem with the blank completed.** Populate `filled` when the lesson-design models the completion (the My Turn slide shows the worked sentence, the SC carries the modelled version). The card prints the gappy text on top in black and the `filled` text directly beneath in the green panel accent so children read the pair as one card. Leave `filled` out when children are meant to invent their own completion; see `working-wall-preferences.md` for the full rule. |
| `cards[].colour` | Used by `sectionHeading` (required), `mnemonicPoster` and `equivalenceGrid` rows (optional). 6-char hex without the leading `#`. For section headings, supply a different rainbow-palette colour per heading so adjacent zoners cycle through hues — never repeat across two adjacent headings on the same wall. |
| `cards[].subtitle` | Used by `mnemonicPoster` only. Optional secondary line on the summary page (e.g. "Remember to use" above RUCSAC). |


### sectionHeading

**Wall-worthy criteria, all of which must pass:** The teacher or spawn prompt explicitly requests wall-zone headings; The heading matches a zone the wall genuinely has; The heading is one of the canonical labels in `working-wall-preferences.md`; The physical page cost is reported

**Default orientation:** **Landscape**: one bordered box across the top of the page, heading word centred inside it in the renderer's loudest type, the rest of the page left white

| Field | Notes |
|---|---|
| `cards[].heading` | Used by `sectionHeading` only. The zone label — three words or fewer, twenty characters or fewer. Pick from the canonical list in `working-wall-preferences.md`. |
| `cards[].colour` | Used by `sectionHeading` (required), `mnemonicPoster` and `equivalenceGrid` rows (optional). 6-char hex without the leading `#`. For section headings, supply a different rainbow-palette colour per heading so adjacent zoners cycle through hues — never repeat across two adjacent headings on the same wall. |

Example:

```json
{
  "type": "sectionHeading",
  "page": {
    "size": "A3",
    "orientation": "landscape"
  },
  "heading": "Vocabulary",
  "colour": "DC2626"
}
```

### banner

**Wall-worthy criteria, all of which must pass:** The teacher or spawn prompt explicitly requests a banner; The banner content matches the wall's role — subject + `Working Wall` for a room-wide banner, or a unit name for a unit banner; Each word is ≤ 15 characters and the banner is 1–6 words total; Only one banner per setup; The physical page cost is reported

**Default orientation:** **Landscape**: one word per page on a wide colour band across the page, the word in giant white type. The teacher pins each page end-to-end above the wall

| Field | Notes |
|---|---|
| `cards[].words` | Used by `banner` only. An array of 1–6 short words — each one becomes its own A3 landscape page printed across the top of the wall (`["English", "Working", "Wall"]` becomes three rainbow-coloured pages spelling the title in giant letters). Each word should be ≤ 15 characters so the renderer can size it huge. Title-case (`English`, not `english` or `ENGLISH`). Colours cycle through the rainbow palette automatically per page — don't supply them. See `working-wall-preferences.md` for the subject-banner vs unit-banner choice and the one-banner-per-setup rule. |

Example:

```json
{
  "type": "banner",
  "page": {
    "size": "A3",
    "orientation": "landscape"
  },
  "words": [
    "English",
    "Working",
    "Wall"
  ]
}
```

## Visual primitives

A `visual` the builder draws from a spec, no picture sourcing needed. Each primitive sits to the right of the panel. The first ray on the angle fan points right; the second ray rotates counter-clockwise by `degrees`, so the angle opens upward visually.

Every primitive below is the same drawing the slides place, from the same fields. Where a primitive has a slide twin, copy the slide's object and change only `type` (`numberline` to `numberLine`); the wall's older spellings (`angleFan`, `comparisonSymbol`) still draw.

### clock

Spec: `{ "type": "clock", "time": "8:50", "label": "10 to 9" }`

`"pastTo": true` shades the right half of the face pale blue and the left half pale orange, for a wall about past and to; in a section whose first part is the "past" clock and second the "to" clock, the halves match the parts' own blue and orange headings. Put the short label under each clock as that part's note (`{{Minute hand}} on <<3>> = quarter past`): a note box beside a clock takes the width the clock needs.

A step's number never sits on a clock face, where it reads as one of the clock's own numbers (the teacher, 10 October 2026). Pin a step to the number a hand has reached, `{ "part": "number 3", "step": 1 }` (`number 1` to `number 12`; in a row of faces, `clock 2 number 9`), and its circle stands outside the face with an arrow to that number. A place given as percentages is refused on a clock.

The same clock face the board draws, from the same fields; a slide's `clock` object copies across unchanged.

`time` as `H:MM` string. Omit `time` and pass `"hands": false` for an annotation-only blank face. Optional `label` renders as caption. Default caption is the time string. **Two extension flags for clock-reading lessons:** `"colourCoded": true` renders the hour hand in red and the minute hand in blue, with a matching colour-coded digital readout embedded below the face (red hour digit, blue minute digit). The colour mapping lets a child glance at the wall and see which hand maps to which half of the digital time. The text caption is suppressed automatically because the digital is already in the picture. `"minuteRing": true` adds an outer ring outside the 1–12 numerals carrying `:00 :05 :10 … :55` labels in blue, so children can read the minute value off the ring without multiplying by 5. Use both together on Year 2/3 clock-reading lessons; use `colourCoded` alone on Year 4+ lessons where children can multiply by 5 in their head but still benefit from the hand–digit mapping.

### shaded-fraction

The same shaded fraction the board draws, from the same fields: copy the slide's `shaded-fraction` object and keep `type`.

Spec: `{ "type": "shaded-fraction", "parts": 4, "shaded": 1, "shape": "circle" }`

`parts` equal parts, `shaded` of them filled soft green (0 for a blank shape), `shape` `"bar"` (default), `"grid"` or `"circle"`; `rows` fixes a grid's rows; `bars: [{ "parts": 4, "shaded": 3, "label": "3/4" }, ...]` stacks bars to compare, each named under it. Optional `colour` (6-character hex) changes the shading. `label` prints as the card's caption under the picture. Use a circle for "a quarter of a whole", a bar for fractions of a length or comparing, a stack of bars for "which is bigger", a grid for a fraction of a set of squares.

Cards written with the older spellings still draw the same picture: `{ "type": "fractionCircle", "numerator": 1, "denominator": 4 }` is a circle and `{ "type": "fractionBar", "numerator": 3, "denominator": 5 }` a bar, each captioned with the fraction (`"1/4"`) unless `label` says otherwise.

### fractionCircle

The older spelling of a `shaded-fraction` circle, still drawn by the same picture: `{ "type": "fractionCircle", "numerator": 1, "denominator": 4 }`, optional `colour`, captioned `"1/4"` by default. Write new cards as `shaded-fraction` with `"shape": "circle"`.

### fractionBar

The older spelling of a `shaded-fraction` bar, still drawn by the same picture: `{ "type": "fractionBar", "numerator": 3, "denominator": 5 }`, optional `colour`, captioned `"3/5"` by default. Write new cards as `shaded-fraction`.

### fraction-wall

The same fraction wall the board draws: copy the slide's `fraction-wall` object.

Spec: `{ "type": "fraction-wall", "fractions": [1, 2, 4, 8] }`

One row per denominator, top to bottom, each cut into that many equal pieces and each piece named (`1` over `4`). Use for equivalent fractions and comparing unit fractions, where a child reads down to see that two quarters end where one half ends. Up to 12 rows; a wall whose smallest pieces cannot be named at the card's readable size is refused, so leave out the rows the lesson does not compare.

### money

The same real coins and notes the board shows: copy the slide's `money` object.

Spec: `{ "type": "money", "items": ["£2", "£1", "50p", "20p", "|", "10p", "5p"] }`

The real Royal Mint pictures, coins to scale with each other, left to right; `"|"` puts a wider gap between two groups. Values: `1p` `2p` `5p` `10p` `20p` `50p` `£1` `£2`, backs `5p_back` `20p_back` `50p_back` `£1_back` `£2_back`, notes `£5` `£10` `£20` `£50`. A long row wraps onto a second line rather than shrinking the coins until they cannot be told apart. Use for a "which coins make £3.50?" worked example or a coin-recognition reference.

### numberLine

The same number line the board draws, from the same fields: copy the slide's `numberline` object and change only `type`. The one exception is a method the board drew across several slides: there the wall's line may join them into the whole journey of the one worked example (`working-wall-visual-language.md` → Choose visuals for the card's learning), and that permission overrides copying the object as it stands.

Spec: `{ "type": "numberLine", "start": 1200, "end": 2000, "interval": 200, "labels": "all", "answer": { "at": 1800, "text": "A = 1,800" } }`

`labels` is `"ends"`, `"all"` or a list of values; `answer` (one or a list) is a green dot on the line with its words above, the worked value a card shows; `arrow` points at a place; `jumps: [{ "from": 1200, "to": 1400, "label": "+200" }]` draws the blue hop along a space and `highlight: { "from": 1200, "to": 1400 }` shades one space. Both ends of a jump or highlight sit on marks, and a line carries jumps or points, not both. Use for ordering, rounding, reading a scale, fractions on a line, time intervals.

Cards written with the wall's older spelling (`from`, `to`, `step`, `marks: [{ "at": 7, "label": "7" }]`) still draw: every tick is labelled and each mark becomes an answer dot.

### angleFan

Spec: `{ "type": "angleFan", "degrees": 65 }`

Two rays meeting at a vertex with the angle between them filled and labelled with the degree value. `degrees` 1 to 359. Optional `colour` (default amber `FBBF24`). Default caption is `"65°"`. Use when the lesson shows the *measured* size; use `angle` (below) when the lesson asks children to *name* the angle. It is the shared `angle` drawn with its opening filled and its size printed, the form the board and the sheet draw with `"sector": true, "showDegrees": true`.

### angle

Spec: `{ "type": "angle", "degrees": 40 }`

A single static angle to **classify** — two black arms with a blue arc marking the opening, or a blue right-angle square when `degrees` is 90. The acute / right / obtuse "types of angle" picture. `degrees` 1–179 only sets how open it is drawn (the number is never shown) — pitch it: clear acute ~35, near-right ~85, obtuse ~130. Optional `rotation` so a set isn't all one way up. Crops tight and fills its slot.

### line-pair

Spec: `{ "type": "line-pair", "relationship": "parallel", "form": "horizontal", "notation": "arrows" }`

A pair of straight lines to classify as **parallel / perpendicular / neither**. `form` — parallel: `horizontal`/`vertical`/`diagonal`; perpendicular: `cross`/`L`/`T`/`detached`; neither: `converging`/`slant`. `notation`: `"arrows"` (blue chevrons on a parallel pair) or `"right-angle"` (blue square at a perpendicular corner). Optional `unequal: true` (parallel, clearly different lengths), `rotation`. The identify-parallel-and-perpendicular picture. A wide pair fills the column.

### comparisonSymbol

Spec: `{ "type": "comparisonSymbol", "symbol": ">", "left": "5", "right": "3" }`

A bold `>`, `<`, or `=` symbol, optionally flanked by left and right values (renders as `5 > 3`). Omit `left`/`right` for the symbol alone. Optional `colour` (a hex; default the house blue). No default caption: the symbol is the visual. It is the same comparison picture as `comparison-slot` below, drawn without the ring.

### comparison-slot

Spec: `{ "type": "comparison-slot", "left": "4,321", "answer": ">", "right": "4,299" }`

The ring a child writes `<`, `>` or `=` into, the same ring the slides and the worksheet draw, with `answer` printed in answer green inside it and optional `left` and `right` values either side. A reference card shows the finished comparison, so give it the `answer`; `ring: false` prints the symbol without the ring. No default caption.

### triangle

Spec: `{ "type": "triangle", "kind": "scalene" }`

A single triangle to **classify by its sides**, drawn with the tick marks children read — sides carrying the same number of dashes are equal. `kind`: `scalene` (1/2/3 dashes, none equal), `isosceles` (a matching pair on the two equal sides, third side unmarked), `equilateral` (one dash on all three), `right` (a right-angle square in the corner). The "types of triangle" picture — the same drawing the slides and worksheets use, so the wall matches the board. Optional `rotation` so a set isn't all one way up; optional `sides: [3,4,5]` for a custom triangle with auto-derived dashes; optional `angleArcs: true` to mark the three corners. Optional `symmetryLines: true` overlays the triangle's lines of symmetry as dashed lines (equilateral 3, isosceles 1, scalene/right 0) for a "lines of symmetry" reference card; add `symmetryLinesAnswer: true` to draw them in answer green. No default caption — the marked diagram is the whole content. Crops tight and fills its slot.

### venn

Spec: `{ "type": "venn", "label1": "has a right angle", "label2": "has 4 equal sides", "shapes": [{ "region": "overlap", "label": "Square" }] }`

A two-circle **Venn sorting diagram** inside a box. `label1`/`label2` are the circle criteria; each `shapes` token names a shape and the region it lands in — `leftOnly`, `rightOnly`, `overlap` (fits both), or `outside` (fits neither, inside the box). Omit `shapes` for a blank labelled frame the teacher or children sort into live on the wall. The same drawing the slides use, so the sorted wall reference matches the board. The overlap and the outside region are the teaching point — a sort-by-two-criteria lesson is one a text card cannot carry. No default caption: the labelled diagram is the whole content. Crops tight and fills its slot.

### carroll

Spec: `{ "type": "carroll", "rowLabel": "is a quadrilateral", "rowNotLabel": "is NOT a quadrilateral", "colLabel": "has a right angle", "colNotLabel": "has NO right angle", "shapes": [{ "cell": "topLeft", "label": "Square" }] }`

A 2×2 **Carroll sorting grid** — the grid companion to `venn`. `rowLabel`/`rowNotLabel` run down the side (is / is NOT); `colLabel`/`colNotLabel` run across the top. Each `shapes` token names a shape and its `cell` — `topLeft` (row-is AND col-is), `topRight`, `bottomLeft`, `bottomRight`. Omit `shapes` for a blank labelled grid to sort into live. Every cell means its row label AND its column label together — the same shapes the Venn overlap holds appear in the "is / is" cell, so the two diagrams read as one idea shown two ways. No default caption. Crops tight and fills its slot.

### geoboard

Spec: `{ "type": "geoboard", "cols": 5, "rows": 5, "shape": [[1,1],[4,1],[4,3],[1,3]] }`

A grid of pegs (dotty paper) carrying shapes drawn by their vertices — coordinates run x across (0 = left) and y up (0 = bottom). Pass `shape` for one polygon or `shapes` for several; omit both for blank dotty paper. This is how a shape is shown **as a picture** rather than named in words — a square turned 45° to settle "still a square, not a diamond", or the shapes children are about to sort drawn above a Venn/Carroll. Optional per-shape `notation` (`ticks`, `arrows`, `rightAngles`) marks equal sides, parallel pairs and right angles the British way. Optional `symmetryLines: [[[x1,y1],[x2,y2]], …]` overlays explicit lines of symmetry as dashed lines in peg coordinates (a geoboard shape's axes can't be auto-derived, so you supply them); add `symmetryLinesAnswer: true` for answer green. The same drawing the slides use. No default caption. Crops tight and fills its slot.

### reflection-grid

Spec: `{ "type": "reflection-grid", "cols": 10, "rows": 8, "mirror": { "orientation": "vertical", "at": 5 }, "shape": [[2,2],[2,6],[4,6],[4,4],[3,4],[3,2]], "showReflection": true }`

A dot lattice with a dashed mirror line and a shape on one side, for "reflect this shape in the mirror line" symmetry work. `mirror.orientation` is `"vertical"`, `"horizontal"`, `"diagonal-up"` (slope +1) or `"diagonal-down"` (slope −1); `at` is its position/intercept in grid squares (keep it whole so the reflection lands on dots). Coordinates run x across (0 = left), y up (0 = bottom). On a **wall reference card set `showReflection: true`** so the card shows the completed reflection in green — the worked picture children look up, not a blank frame. The same drawing the slides and worksheets use, so the wall matches the board. No default caption. Crops tight and fills its slot.

### tally-chart

Spec: `{ "type": "tally-chart", "title": "Pets in Class 4", "headers": ["Pet", "Tally", "Total"], "rows": [{ "label": "Dog", "tally": 7 }, { "label": "Cat", "tally": 11 }], "showTotals": true }`

A **tally chart** — a label column, a tally column, and an optional Total column. Each row's `tally` is a number; the renderer draws the marks as bundles of five (four verticals struck through by a fifth diagonal), then the remainder as verticals. The "how to record a tally" anchor children look up in any statistics unit — the diagonal-as-fifth-mark is the very thing they forget. `showTotals` defaults to true when a third header is present. The same drawing the slides and worksheets use, so the wall matches the board. No default caption — the chart carries its own title. Crops tight and fills its slot.

### bar-chart

Spec: `{ "type": "bar-chart", "title": "Favourite playground game", "categories": ["Tag", "Football", "Skipping"], "values": [8, 14, 9], "y_interval": 2, "y_max": 16 }`

A **bar chart** — a numbered y-axis scale with gridlines and house-blue bars rising from a category x-axis, the same drawing the slides and worksheets use. `y_interval` sets what each scale line is worth (the value children most often misread); `y_max` is the top of the scale. The natural anatomy-poster anchor for a "read a bar chart" lesson. **Exposes named callout anchors** — `title`, `scale` (the numbered axis), `gridline`, and each category label — for a `labelledDiagram` card (see `cards[].visual.callouts`). No default caption — the chart carries its own title. Crops tight and fills its slot.

### line-graph

Spec: `{ "type": "line-graph", "title": "Temperature through the day", "xLabel": "Time (hours)", "yLabel": "Temperature (°C)", "points": [{ "x": 0, "y": 12 }, { "x": 1, "y": 15 }, { "x": 2, "y": 18 }, { "x": 3, "y": 20 }], "xStep": 1 }`

A **line graph** — points plotted at their readings and joined by a red line, against numbered, labelled x and y axes with gridlines, the same drawing the slides and worksheets use. `points` are `{ x, y }` readings (field names match the slide content object, so a graph met on the board is copied straight in); `xLabel`/`yLabel` title the axes; `xStep`/`yStep` set the tick spacing; `xMax`/`yMax` the ranges. The natural anatomy-poster anchor for a "read a line graph" lesson. **Exposes named callout anchors** — `title`, `yAxis` (the value scale), `xAxis` (the time axis), `line` (the trend), `point` (a plotted reading), and each plotted point's x value (a worked read-off) — for a `labelledDiagram` card (see `cards[].visual.callouts`). No default caption — the graph carries its own title. Crops tight and fills its slot.

### pictogram

Spec: `{ "type": "pictogram", "title": "Books borrowed", "categories": ["Mon", "Tue", "Wed"], "values": [30, 45, 25], "key": { "per": 10, "label": "books" } }`

A **pictogram** — each row is a category label followed by a series of house-blue symbols, with a KEY below stating how many units one symbol stands for. A **left half-circle** stands for HALF the key value (45 with a key of 10 draws four-and-a-half circles) — the "half a symbol = half the key" point children most often misread, so this is a strong sticky-knowledge / reference anchor for a statistics unit. `key.per` sets the symbol value; `key.label` is the unit word shown in the key. The same drawing the slides and worksheets use, so the wall matches the board. No default caption — the chart carries its own title. Crops tight and fills its slot. **Exposes named callout anchors** — `title`, `key`, `half`, and each category label — so a `labelledDiagram` card can point a callout at any part by name (see `cards[].visual.callouts`).

### bar-model

Spec: `{ "type": "bar-model", "shape": "part-whole", "whole": { "label": "£5" }, "parts": [{ "label": "biscuit 30p" }, { "label": "drink 50p" }, { "label": "change ?" }] }` or `{ "type": "bar-model", "shape": "comparison", "bars": [{ "name": "Blue", "label": "£27.40", "value": 27.40 }, { "name": "Red", "label": "£12.75", "value": 12.75 }], "difference": { "label": "?" } }`

A general **bar model** - the White Rose part-whole and comparison picture behind money, comparison and multi-step reasoning. `shape: "part-whole"` is one whole bar divided into labelled `parts` (the `whole` label sits above the bar in a span bracket, or to the side with `"wholeLabelPosition": "side"`); `shape: "comparison"` is two stacked `bars` of different lengths with the shorter bar's shortfall drawn as a labelled `difference` gap aligned to the right. Segment lengths are proportional to part/bar `value`s when given, even otherwise. ANY region whose label is empty or ends in "?" renders as a white write-in answer box - so a worked-example reference card should show the answers (real labels, no "?"). The same drawing the slides and worksheets use, so the wall matches the board. No default caption - the bar carries its own labels. A bar model is a **wide** figure, so it reads biggest with `"visualScale": "dominant"` and a short panel (one line or two short steps); the default stacks a wide bar beneath the panel and caps its height, so it prints about half the width `dominant` gives it. Crops tight and fills its slot.

### turn-diagram

Spec: `{ "type": "turn-diagram", "quarters": 1, "direction": "clockwise" }`

A rotation diagram: an arrow sweeping a quarter, half, three-quarter or full turn about a centre, the "amount of turn" picture for shape and position lessons. Set `quarters` (1 to 4) or `amount` (`quarter` / `half` / `three-quarter` / `full`), and `direction` (`clockwise` / `anticlockwise`). Optional `countMarks: true` numbers each quarter turn along the arc, for a card saying a three-quarter turn is three quarter turns. The same drawing the slides and worksheets use, so the wall matches the board. Default caption names the turn (e.g. "quarter turn clockwise"). Crops tight and fills its slot.

### triangle-square

Spec: `{ "type": "triangle-square", "triangles": ["7", "5"], "square": "12" }`

The SATs part-whole puzzle: two stacked triangles (the `triangles` array) with arrows pointing into a `square` that holds their total. Leave exactly one of the three values as an empty string for the unknown a child works out. Use when the lesson recreates this exact paper question type, distinct from the circle-and-line `part-whole-model`. The same drawing the slides and worksheets use. No default caption: the labelled diagram is the whole content. Crops tight and fills its slot.

### polygon

Spec: `{ "type": "polygon", "symmetryLines": true, "symmetryLinesAnswer": true, "shapes": [ { "name": "square", "label": "4 lines" }, { "name": "rectangle", "label": "2 lines" } ] }`

One or more named 2D shapes side by side, the same shapes the slides draw from the same fields: `name` (square, rectangle, triangle, isosceles-triangle, scalene-triangle, right-triangle, pentagon, hexagon, rhombus, kite, parallelogram, trapezium, or regular-polygon with `sides`), a `label` under each, `sideLabels` and `angleLabels` for measurements, and the symmetry teaching (`symmetryLines`, or one `candidate` line with its `verdict` and `fold`). A lines-of-symmetry reference card shows every line in answer green. No default caption. Crops tight and fills its slot.

### translation-grid

Spec: `{ "type": "translation-grid", "max": 8, "from": { "x": 1, "y": 2 }, "to": { "x": 5, "y": 6 } }`

One marker moved on a numbered grid, the start orange and the end blue with a dashed arrow between, the same drawing the slides use. For a whole shape moved, which is the stronger translation anchor, use `translation-shape`. No default caption.

### area-grid

Spec: `{ "type": "area-grid", "cols": 10, "rows": 6, "unitLabel": "Each square = 1m²", "rects": [ { "x": 0, "y": 0, "w": 4, "h": 3, "label": "A" } ] }`

A squared grid with labelled rectangular patches, every square countable, the same drawing the slides use: the "count the squares to find the area" anchor. `x`, `y` place a patch's top-left corner in squares from the top-left of the grid. No default caption. Crops tight and fills its slot.

### grid-map

Spec: `{ "type": "grid-map", "eastings": [47,48,49,50,51,52], "northings": [83,84,85,86,87], "river": [[47.3,86.7],[49,84.55],[51.8,83.2]], "features": [{ "name": "church", "square": [48,83], "type": "human" }], "highlightSquare": [48,83] }`

A schematic **river-town map on a numbered four-figure grid** - the anchor map a class reads human/physical features and four-figure grid references off across a geography/maths unit. The numbers sit **on the grid lines at the corners** (read along the bottom, then up the side), so the square named by `48 83` is the cell up-and-right of where those lines cross. `eastings`/`northings` are the line numbers (consecutive whole numbers); `river` is a list of `[easting, northing]` points (fractions allowed) drawn as a smooth blue river; optional `roads` is a list of such paths drawn grey; each `features` entry sits inside the cell whose bottom-left corner is its `square`, every marker and label in one neutral ink so the human/physical answer is never coloured in; optional `highlightSquare` rings one square's bottom-left corner for a "how to read a reference" reference card. The same drawing the slides and worksheets use, so the wall matches the board. A **wide** figure - reads biggest with `"visualScale": "dominant"` and a short panel. No default caption: the map carries its own numbers. Crops tight and fills its slot.

### map

The same real map the board draws, from the same fields: copy the slide's `map` object as it is (its `type` is already `map`).

Spec: `{ "type": "map", "map": "world-with-antarctica", "presentation": "seven-continent-world", "showTropics": true, "key": [{ "text": "Tropical rainforest", "colour": "green" }], "annotations": [{ "kind": "area", "shaded": true, "colour": "green", "label": "Amazon", "points": [{ "lon": -73, "lat": 1 }, { "lon": -61, "lat": 3 }, { "lon": -51, "lat": -2 }, { "lon": -67, "lat": -12 }] }] }`

A **real map of a real place** - the land is always one of the shipped world or continent images, never drawn - with the lesson's own marks on top: `annotations` (a dot on a place, a dashed or shaded area, a line with an arrow), a `key` naming what the shading means, the South America `selectedCountry: "Brazil"` fill and `basin: "Amazon basin"` outline, and a `caption`. `presentation: "seven-continent-world"` adds continent, ocean and sea names, clue markers, the Equator and Tropics and a sea `focus`; `presentation: "globe-to-flat"` is the staged projection explanation. South America's `presentation: "regional-layers"` names countries inside their own borders and shades the sourced Amazon rainforest with a key and the real Equator (see `references/map-regional-layers.md`); it is the wall map for "the Amazon crosses borders", with `"visualScale": "dominant"`. The same drawing the slides, worksheets and stick-in pack use, so the wall's map is the one children located the place on. Wall material when a unit keeps coming back to WHERE something is (the Amazon crossing borders, where the rainforests lie between the Tropics): carry the finished, labelled map, never the write-on `worksheetMode` form, which belongs in the child's book. Names on the map print at the wall's readable floor, so a map at card size carries fewer names than a full slide: when there is no room for a name the build refuses the map by name (`MAP_LABELS_DO_NOT_FIT`) rather than piling names up, and the repair is fewer names or `"visualScale": "dominant"`. A **wide** figure for a world map; South America is tall. No default caption. Crops tight and fills its slot.

### rainforest-layers

Spec: `{ "type": "rainforest-layers", "labels": true, "heights": true, "light": true }`

A **cross section of a tropical rainforest** — four stacked bands, top to bottom: emergent (a few very tall widely spaced trees), canopy (an unbroken roof of overlapping treetops), understorey (thin trunks and large leaves), forest floor (dark ground, leaf litter and roots). The **band tint is the light gradient**, brightest at the top to near dark at the floor, which is exactly what makes it wall material: a child glancing up from their desk any day of the unit sees the light thinning without reading a word. On a **wall card set `labels: true`** (and `heights`/`light` when the unit turns on them) so the card is the finished anchor, not a blank. Never set `blank` on a wall card — the write-on form belongs in the child's book, and a wall of empty lines answers nothing. `highlight` (a pair of layer names) is for a slide narrowing to half the diagram, so leave it off a wall card, which should show the whole forest. UK spelling "understorey" is built into the drawing. The same drawing the slides, worksheets and stick-in pack use, so the wall matches the board. A **wide** figure once labelled — reads biggest with `"visualScale": "dominant"` and a short panel. No default caption: the diagram carries its own names. Crops tight and fills its slot.

### balanced-pattern-plate

Spec: `{ "type": "balanced-pattern-plate", "mode": "teaching" }`

The shared **balanced pattern plate** used on slides and worksheets, now available as a durable working-wall overview without changing its geometry or wording. Its five fixed sector shares preserve the intended broad pattern: fruit and vegetables and starchy carbohydrates are larger; protein and dairy or alternatives are smaller; oils and spreads are very small. The same measured labels and unbranded examples either fit inside their sector or move to the external gutter, so the wall never replaces the plate with a prose table. The water cue, separate foods-high-in-fat-salt-or-sugar cue, and default "across a day or over time" caption remain part of the teaching form. Use `mode: "teaching"` on the wall; practice blanks belong on the worksheet. Optional `groupLabels`, `examples`, `water`, `caption` and `lessOftenLabel` are the same fields documented for the slide helper. Use `visualScale: "dominant"` so the full plate and its measured labels remain readable across the room.

### parachute-forces

Spec: `{ "type": "parachute-forces", "canopyShape": "billowed-sheet", "largeCanopyWidthRatio": 3, "cordLengthRatio": 1, "loadSizeRatio": 1, "showEqualityTicks": true, "labels": { "largeCanopy": "More air to push out of the way", "smallCanopy": "Less air to push out of the way", "largeUpForce": "More air resistance", "smallUpForce": "Less air resistance", "downForce": "Gravity pulls down", "cords": "Same cord length", "loads": "Same load" } }`

A wide, front-view **model-parachute force comparison** for a unit anchor. The large billowed sheet is exactly three times the small one's width; corresponding cords are calculated to equal Euclidean length and carry matching ticks; both load blocks and both downward gravity arrows are equal. The longer upward arrow on the large canopy and shorter one on the small canopy show the qualitative difference in air resistance. Labels live outside the objects and point back with leaders. Use it as the finished explanation after practical results are pooled. This is a schematic model, not a photograph, and it deliberately contains no wind streaks, parafoils, people or aircraft. Keep every fixed ratio at the documented value: the renderer refuses a different canopy shape, unequal cords or unequal loads. Use `visualScale: "dominant"` so its labels stay readable across the room.

### dial-scale

Spec: `{ "type": "dial-scale", "max": 1000, "value": 200, "unit": "g", "label": "The scales show 200g" }`

A round weighing **dial scale**: 0 at the top, numbered marks round the face and a red needle at `value`. The same drawing the board shows, from the same fields: copy the slide's object as it is. `majorEvery` and `minorEvery` set the marks; `label` prints as the card's caption under the dial. The reference card for reading a scale: what each small mark is worth, then where the needle points. A square figure.

### measuring-jug

Spec: `{ "type": "measuring-jug", "max": 400, "majorEvery": 100, "minorEvery": 50, "value": 250, "unit": "ml", "levelColor": "00B050", "label": "250ml" }`

A **measuring jug** with a scale up its side and, when `value` is given, the liquid and its level. The same drawing the board shows, from the same fields: copy the slide's object as it is. On a wall card give `value`, so the card shows a worked reading rather than an empty jug; `label` prints as the caption. An upright figure.

### ruler

Spec: `{ "type": "ruler", "end": 10, "majorInterval": 1, "minorInterval": 0.5, "unit": "cm", "object": { "from": 0, "to": 6, "label": "pencil" } }`

A **ruler** with numbered marks, an optional `object` bar to measure and an optional `arrow` at a point. The same drawing the board shows, from the same fields: copy the slide's object as it is. On the wall it is a picture of a scale (on paper it prints at true size). The anchor for "line the object up with 0, then read the end". A wide strip.

### timeline

Spec: `{ "type": "timeline", "eras": [ { "label": "Tudor", "from": 0.02, "to": 0.3 }, { "label": "Victorian", "from": 0.5, "to": 0.72 } ], "marks": [ { "label": "1485", "at": 0.02 }, { "label": "1837", "at": 0.5 }, { "label": "today", "at": 0.98 } ] }`

A **timeline**: named era bands on a bold line, dated ticks beneath. The same drawing the board shows, from the same fields: copy the slide's object as it is. Every position is a fraction of the line worked out from the real dates. Use for the unit's chronology anchor: the periods the class keeps placing things in. A wide strip.

### process-chain

Spec: `{ "type": "process-chain", "boxes": ["egg", "caterpillar", "chrysalis", "butterfly"] }`

A **process chain**: boxes joined by arrows, for a life cycle, a food chain or the order of a process. The same drawing the board shows, from the same fields: copy the slide's object as it is. On a wall card fill every box, since the card is the reference and not the task. A wide strip.

### classification-key

Spec: `{ "type": "classification-key", "tree": { "q": "Does it have wings?", "no": { "leaf": "ANT" }, "yes": { "leaf": "BEE" } } }`

A branching yes/no **classification key** down to named answers, each question over its two branches. The same drawing the board shows, from the same fields: copy the slide's object as it is. Use as the anchor a class checks an identification against. Wider than tall once it has four answers.

### concept-map

Spec: `{ "type": "concept-map", "centre": "Cacao", "spokes": [ { "label": "Money", "relationship": "used as" }, { "label": "Religion", "relationship": "used in" }, { "label": "Power" } ] }`

A **concept map**: one central idea joined to two to six others, each line optionally naming the relationship. The same drawing the board shows, from the same fields: copy the slide's object as it is. Use when the unit keeps returning to how one idea connects out to several. Use `visualScale: "dominant"` so its words stay readable across the room.

### annotated-text

Spec: `{ "type": "annotated-text", "lines": ["Puddles fill the street.", "", "I jump into the puddle"], "marks": [ { "find": "Puddles", "style": "circle", "colour": "blue" }, { "find": "puddle", "id": "puddle-2", "style": "circle", "colour": "blue", "note": "Layla picks it up" } ], "links": [ { "from": "Puddles", "to": "puddle-2" } ] }`

A **marked model text**: a poem (`lines`, `""` between stanzas) or prose (`passage`) in the middle, its words underlined, circled, boxed, highlighted or coloured, arrows joining one word to another, and short notes in the margins joined to their words. The same drawing the board shows, from the same fields: copy the slide's object as it is, with every note filled in (a `"note": ""` write-on line belongs in the child's book, not on the wall).

**The model a class writes from is its own sheet.** When children write their own piece of the same kind, in this lesson or later in the unit, the marked model is the thing they look up at while writing: the renga with the word each stanza picks up circled and joined, the paragraph with its fronted adverbials highlighted and labelled. That is a different job from the overview, which says what the form is, so it is the second sheet rule 1 allows, not an exception to argue for. Give it one card: `stickyKnowledge`, `title` naming what the marks show ("How each stanza links"), one short item saying it in words, and this primitive as its `visual` with `"visualScale": "full"`, which puts the item in a strip across the top and gives the passage the whole sheet beneath it. Use the board's own model text and marks rather than a new example, so the sheet is the one children watched being marked. Put the form's rules on it too, where the text shows them: `counts` beside the lines for a pattern a child checks line by line (a renga's syllables), and `brackets` beside the stanzas or paragraphs for each rule a child needs while writing (`3 lines: 5, 7, 5`, `Always ends on 2 lines`). Keep the people out of it: a wall sheet is about how the form works, so leave off who wrote each part, which matters only to the lesson's own story. The teacher chose this shape for a renga on 2 October 2026: the whole poem large, the syllable count in colour beside every line, a tip beside every stanza, and each picked-up word highlighted in the strip's orange with an arrow to where it is picked up. Carry the whole model text when it fits at the wall's size, since a child writing their own needs to see the form start to finish; a long text is cut to the part that shows the rules, never to a fragment. It does not apply when nothing later in the unit writes from the text, or when the marked lines are short enough to sit on the overview itself.

A passage drawn large: the words print at the wall's readable size, so a long passage refuses by name rather than shrinking; the repair is less of it.

**Step numbers and pointers name their words.** A callout on this drawing gives `part` the words it points at, as printed, or a mark's `id`: `{ "part": "bright", "step": 3 }` stands step 3's circle just above "bright", in room the drawing leaves for it, wherever the line lands. A punctuation mark is named the same way (`{ "part": ",", "step": 5 }` for "put a comma between the adjectives"), and can be marked on its own with `"find": ","`. A word that comes more than once takes `nth`, counting from 1 through the whole text, as a mark does (`{ "part": "dinner", "nth": 2, "step": 3 }`). Name the words, never `anchor` percentages: the passage is laid out when it is drawn, so a percentage chosen by eye lands on the words, and the build refuses a step placed on a marked text by numbers. The number is small, the size of its circle in the step list, and an arrow into the same words lands clear of it, so pin the steps and keep the arrow. A step about no particular words ("Cover everything up to the comma") gets no number on the text. Different notes are drawn in different colours (see `templates.md`, `annotated-text`), and a `circle` is a rounded loop that takes in the comma or full stop touching its last word.

### fishbone

Spec: `{ "type": "fishbone", "effect": "Flooding", "causes": ["Heavy rain", "Steep slopes", "Trees cut down"] }`

A cause-and-effect **fishbone**: causes on ribs off a spine that points at the effect. The same drawing the board shows, from the same fields: copy the slide's object as it is. Up to six causes. Use `visualScale: "dominant"` so the cause boxes stay readable across the room. A wide figure.

### continuum-line

Spec: `{ "type": "continuum-line", "left": "Never fair", "right": "Always fair", "middle": "Sometimes fair", "marks": 4 }`

A **continuum line** between two opposite ends, with optional ticks, a middle label and a question above. The same drawing the board shows, from the same fields: copy the slide's object as it is. Use when a unit asks children to place and re-place a judgement on a gradient. A wide strip.

### source-pathway

Spec: `{ "type": "source-pathway", "sources": ["Mains socket", "Battery", "Solar cell"], "middle": "Electricity", "outcome": "Appliance" }`

A **source pathway**: two to six separate sources joining one middle state, then one outcome. The same drawing the board shows, from the same fields: copy the slide's object as it is. Use when the shared middle state is what the unit keeps coming back to. Use `visualScale: "dominant"` so the source words stay readable.

### number-network

Spec: `{ "type": "number-network", "target": 60, "nodes": [ { "x": 1, "y": 0, "value": 25 }, { "x": 0, "y": 1, "value": 35 }, { "x": 2, "y": 1, "value": 35 } ], "edges": [ [0, 1], [0, 2] ] }`

A **number network**: circles joined by lines where each joined pair adds to `target`, printed under it. The same drawing the board shows, from the same fields: copy the slide's object as it is. On a wall card fill every circle, so the card shows the rule worked. A `label` replaces the target sentence as the card's caption.

### circuit-diagram

Spec: `{ "type": "circuit-diagram", "cells": 1, "lamps": 1, "switch": "closed", "path": "complete", "label": "Complete circuit" }`

A **series circuit** in the standard primary symbols — cells as long and short plates, lamps as circles with crosses, buzzers as semicircles, switches clearly open or closed. Wall material for an electricity unit: the anchor a child checks their own circuit against all term. Standard circuit symbols are Year 6 work (`subject-science.md`); a Year 4 lesson shows a labelled photograph of a real circuit instead (`label-diagram` on the photograph). Use `circuits` (an array) for a comparison card — "this one lights, this one does not" — and keep each label short so it fits under its own circuit. The same strict drawing the slides and worksheets use, so the wall cannot disagree with the board about what an open switch looks like: state the cells, the components, the switch and the path explicitly, because the drawing refuses to invent, round or drop any of them. A **wide** figure once several circuits share a row. Crops tight and fills its slot.

### circuit-symbol-bank

Spec: `{ "type": "circuit-symbol-bank", "items": [{ "symbol": "cell", "label": "cell" }, { "symbol": "lamp", "label": "lamp" }, { "symbol": "wire", "label": "wire" }, { "symbol": "switch-open", "label": "open switch" }, { "symbol": "switch-closed", "label": "closed switch" }] }`

The `circuit-symbol-bank` is the **key of standard circuit symbols**, each with its child-facing name underneath: the same bank the board teaches from, drawn with the same lines as `circuit-diagram` so the key and the circuit cannot disagree about a symbol. Wall material for an electricity unit, where children look up to check what a symbol means while they draw their own circuits. `items` holds 2 to 6 entries in the order given; `symbol` is exactly one of `cell`, `lamp`, `wire`, `switch-open`, `switch-closed`, and `label` is the short name printed under it (a name wider than its cell is refused, not cut). Copy the slide's object. A **wide** strip, which reads biggest with `"visualScale": "dominant"`. Crops tight and fills its slot.

### blank-surface

Spec: `{ "type": "blank-surface", "surface": "number-line", "start": 0, "end": 100 }`

The `blank-surface` is a **draw-your-own surface**: a faint empty number line (with optional end values) and room above it for jumps, or `"surface": "bar"` for one empty bar outline (`"bars": 2` for a comparison pair). The same surface the board and the sheet use when the skill is deciding where the jumps go or how to split the bar. On the wall it is an anchor for the METHOD rather than an answer: "start with an empty line like this", beside a worked example that fills one in. It draws nothing a child could read an answer from, so pair it with words or a worked card. Copy the slide's object. A **wide** figure. Crops tight and fills its slot.

### label-diagram

Spec: `{ "type": "label-diagram", "imagePath": "photos/sunflower.jpg", "layout": "sides", "callouts": [{ "anchor": [48, 20], "label": "flower head", "given": true }, { "anchor": [52, 70], "label": "stem", "given": true }] }`

The `label-diagram` is a **real photograph with its parts named**: a dot on each part, a leader line out to its name in the margin. The same picture, and the same poster rules, the slide uses, so a class sees on the wall the labelled flower or church they were taught from. `imagePath` is the photo the slide shows, relative to working-wall.json; the build refuses a card whose photo cannot be read. `anchor` is `[x%, y%]` of the photo. On a wall card every label is finished, so give each callout `"given": true` (a callout without it draws a blank line to write on, which is not wall material). Use `"layout": "sides"` for a photograph so the names stand on clear white beside it. This is different from `callouts` on a drawn primitive in a `labelledDiagram` card, which label a diagram the wall draws itself; use this one when the picture is a photograph. Crops tight and fills its slot. Its names print at wall size: 28pt where the photograph keeps over half the picture's width beside them, stepping down towards the wall's 20pt floor on a crowded card, and a card that leaves them smaller than that is refused (`WALL_FIGURE_WORDS_TOO_SMALL`). So a photograph with several names, or long ones, wants a sheet of its own (a `labelledDiagram` card, or a `diagramSection` of one part) rather than half of one. A photograph with no callouts prints as the photograph alone, with no white band round it.

### translation-shape

Spec: `{ "type": "translation-shape", "cols": 10, "rows": 8, "points": [[1,1],[1,4],[3,4],[3,3],[2,3],[2,1]], "translate": { "dx": 5, "dy": 3 }, "showImage": true }`

A **numbered coordinate grid** carrying a whole shape and its **translated image** — the signature translation picture. On a **wall reference card set `showImage: true`** so the card shows the worked translation: the original (solid house-blue), the image (lighter, dashed) slid by `translate`, and a dashed arrow between matching vertices making the slide visible. `points` are the original vertices (`[[x,y],…]` or `[{x,y},…]`), `translate` the `{ dx, dy }` slide in squares (positive right/up). Leaving `showImage` off draws the original only (a blank task, not wall material) — so a wall card should carry the image-shown form. Coordinates run x across (0 = left), y up (0 = bottom). The same drawing the slides, worksheets and stick-in pack use, so the wall matches the board. No default caption. Crops tight and fills its slot.

### coordinate-grid

Spec: `{ "type": "coordinate-grid", "cols": 6, "rows": 6, "points": [{ "x": 1, "y": 1, "label": "A" }, { "x": 5, "y": 1, "label": "B" }, { "x": 5, "y": 4, "label": "C" }, { "x": 1, "y": 4, "label": "D" }], "join": true }`

A **numbered first-quadrant coordinate grid** — squared paper numbered `0..cols` across and `0..rows` up, origin at (0,0). On a **wall reference card supply `points` (and `join: true` where the moment is a shape)** so the card shows a **worked example** — a plotted point (the "how to plot (3, 2)" anchor) or a shape joined on a numbered grid — not a blank practice grid. Each `points` entry is `{ x, y, label }` (the label is the letter or coordinate shown beside the red dot); `join: true` joins them in order into a closed pale-blue shape. Leaving `points` off draws a blank grid, which is a live practice surface, not wall material — so a wall card should always carry the plotted/joined form. Coordinates run x across (0 = left), y up (0 = bottom). The same drawing the slides and the stick-in pack use, so the wall matches the board. No default caption. Crops tight and fills its slot.

### place-value-chart

Spec: `{ "type": "place-value-chart", "columns": ["Th", "H", "T", "O"], "rows": [{ "label": "3,462", "cells": ["3","4","6","2"] }, { "label": "10 more", "cells": ["3","4","7","2"], "highlight": ["T"] }, { "label": "100 more", "cells": ["3","5","6","2"], "highlight": ["H"] }] }`

A **place value chart**: colour-coded columns across the top (the same colours the board uses), one row per number, each row captioned at the left by `label` with what it IS. `highlight` names the column whose digit changed and rings that cell in green. That ring is what makes this wall material rather than a grid: in the place-value units a class returns to all term (10 and 100 more or less, exchanging, rounding, multiplying and dividing by 10), the question is always WHICH column changes and which stay the same, and a card showing the starting number above the same number ten more and a hundred more, with the changed digit ringed, answers it at a glance from anywhere in the room. Write a chart the child can read off, not one to fill in: give every row its digits, since a wall of empty cells anchors nothing. The same drawing the slides use, so the wall matches the board. A **wide** figure, which reads biggest with `"visualScale": "dominant"`. No default caption: the row labels name the rows. Crops tight and fills its slot. **A written column calculation is the `calculation` form, never rows:** `{ "type": "place-value-chart", "columns": ["Hundreds", "Tens", "Ones"], "calculation": { "operator": "+", "numbers": ["247", "135"], "answer": "382", "carry": { "T": "1" } } }` draws the worked sum exactly as the board does (numbers, thick line, answer, thick line, the small carried digit in a shallow row under the answer); copy the slide's `calculation` so the card matches it, and note that `rows` with a `"+"` label is refused by name. **Beyond that it draws two forms, and they do different jobs.** The `rows` form above is the ANCHOR: several numbers stacked, each captioned, compact enough that a card can hold a whole unit's worth and a class can read it all term. The `pair` form is the one that TEACHES one change, and it is the same picture the board draws: `"pair": { "operation": "10 more", "from": ["3","4","6","2"], "to": ["3","4","7","2"] }` gives a start chart, a bold arrow carrying the operation, and a result chart with the moved digit ringed in green and "same" under every column that held still, under a title bar reading the result off the cells. Give it only `from` and `to`: the moved column is worked out by comparing them, so a card can never ring a column that did not move, and an exchange (3,497 to 3,507) rings both without you having to notice. `title` overrides the title bar and `"title": ""` removes it. Reach for `pair` when the card's job is to show a change happening, and for `rows` when it is to anchor several numbers side by side; one pair is one comparison, so 10 more AND 100 more of the same number is two cards or one `rows` chart, never a chain of three charts. **Counters draw in a row.** A row may carry `"counters": { "H": 3, "T": 13, "O": 6 }`, which draws that many place-value counters in each column, as the board does; give the row empty `cells` and `"digits": false` when the board showed the counters alone. **A counters model that changes (an exchange, a regrouping) has two homes on the wall, and they do different jobs.** *The board's `pair` with `counters`, copied as it is, on a landscape sheet of its own* (`stickyKnowledge`, `visualScale: "full"`): the two charts with the arrow between them and the ten-for-one cue above, the picture the class watched. Choose it when the exchange itself is what the teacher will point back to. It needs the whole sheet, because two charts of counters shrink together: on a sheet of its own thirteen counters in a column print about 7mm across, and in a section part or beside a step they could not be counted, so the build refuses the pair there by name. On the wall the arrow is drawn short and its words are left to the cue above it, so the columns have the width. The build also rings the ten counters that are exchanged and the one counter they become, in the green that marks a change, and it works them out from the two charts: give `counters` the true before and after of one exchange (ten fewer in one column, one more in the column to its left, or the reverse for subtraction, every other column unchanged), since a pair that differs any other way is drawn with no rings. The written method then goes on a second sheet, or stays on the board. *One chart per step on a `stepByStep` sheet*: the chart before the change, the chart after it, then the `calculation` with its small carried digit, each step's `key` carrying the words the board put on its arrow (`10 tens = 1 hundred`). Choose it when the point is matching the counters to the written column, since it is the only way to put both on one sheet, and each chart has a picture to itself, so its counters print larger still. The two charts are the two halves of the board's own picture, so this is the board's model and not a new one; what it gives up is the single joined picture with its arrow. A `pair` without counters (`from` and `to` filled in) is the form described above and sits on any card. It is the same drawing on the slides, the worksheet and the stick-in pack, in Comic Sans like the board, so a chart copied from a slide looks like the slide.

### place-value-mini

Spec: `{ "type": "place-value-mini", "mode": "exchange" }`

The **small place-value picture** built for a vocabulary card: `digit-value` (`{ "digit": 6, "value": 600 }`, a digit mapping to its value), `column` (`{ "column": "H" }`, Th | H | T | O with one column picked out), `exchange` (ten tens counters becoming one hundred) or `placeholder` (`{ "number": "4050" }`, the zeros picked out). The same drawing the slides' vocabulary cards use, so a `vocabDefinition` card shows the picture of the word the class saw. A wide figure; no default caption.

### base-ten-blocks

Spec: `{ "type": "base-ten-blocks", "counts": { "Th": 2, "H": 4, "T": 3, "O": 6 } }`

**Dienes blocks** in Thousands, Hundreds, Tens and Ones columns (headed in the place value chart's colours): thousand cubes, hundred flats, ten rods and unit cubes, 0 to 10 of each. Wall material when the unit reads numbers from the blocks all term. The same drawing the slides and the sheet use. A wide figure; no default caption.

### counter-group

Spec: `{ "type": "counter-group", "statement": "5,009 = 5,000 + 9", "joiner": "+", "groups": [{ "value": "1000", "count": 5 }, { "value": "1", "count": 9 }] }`

**Place-value counters on their own**, each carrying its value, in its column's colour, grouped with an operator between groups under the claim they are evidence for. Use it for a card that anchors what a partition means in counters; use `place-value-chart` with `counters` when the columns are the point. It draws exactly the counters given and never a total. The same drawing the slides and the sheet use.

### part-whole-model

Spec: `{ "type": "part-whole-model", "whole": "45", "parts": ["27", "18"] }`

The **part-whole model**: a whole circle joined by lines to its part circles, beside them (`"orientation": "horizontal"`, the default) or above them (`"vertical"`). A node may be an object: `{ "value": "5,382" }`, `{ "blank": true }`, `{ "caption": "Thousands" }` under the circle, or `{ "coins": ["£1", "20p"] }`; `joiner: "+"` prints the operator between parts. Give a wall card every value, since an empty circle anchors nothing. The same drawing the slides and the sheet use. No default caption.

### pyramid

Spec: `{ "type": "pyramid", "rows": [{ "cells": 1, "items": ["42"] }, { "cells": 2, "items": ["20", "22"] }, { "cells": 3, "items": ["8", "12", "10"] }] }`

A **number pyramid** (each brick the sum of the two below it) or a ranking pyramid with row `label`s. Rows are centred so each brick sits over the join of the two beneath it. Write a completed pyramid for a wall card: the empty ranking frame is a task, not a reference. The same drawing the slides and the sheet use. No default caption.

### mult-grid

Spec: `{ "type": "mult-grid", "corner": "×", "colHeaders": ["3", "4", "6"], "rowHeaders": ["2", "5"], "cells": [["6", "8", "12"], ["15", "20", "30"]] }`

The **multiplication-facts grid**: operator corner, headers across and down, products in square cells. Give every cell its product on a wall card. The same drawing the slides and the sheet use. No default caption.

### digit-cards

Spec: `{ "type": "digit-cards", "text": "Is 316 divisible by 4?", "value": "316", "marks": [ { "digits": 1, "style": "dim" }, { "id": "last two", "digits": "last 2", "style": "box", "colour": "blue", "label": "last two digits: 16" }, { "id": "even", "digits": 3, "style": "none", "note": "even ✓" } ], "working": [ { "text": "half of 16 is 8", "arrow": true }, { "text": "8 is even, so yes ✓", "colour": "green" } ], "callouts": [ { "part": "even", "step": 1 }, { "part": "last two", "step": 2 }, { "part": "working 1", "step": 3 }, { "part": "working 2", "step": 4 } ] }`

A **number drawn large as digit cards with its working marked on it**: the digits a step looks at boxed, ringed, outlined or coloured, the digits it ignores greyed (`dim`), a `bracket` under a run of cards, an `arc` from one card to another ("same!"), a `sum` putting + between the cards and joining them to one total, and `working` lines beneath, `arrow: true` drawing a down arrow into a line and `beside: true` setting two checks side by side. This is the picture for a method the board recorded only as written working on a number (a divisibility check, rounding's "look at the digit to the right", the digit that changed): draw that working onto the example's own digits, copying the slide's object as it is, in the board's colours (blue what to look at, orange the one digit being judged, green a yes, purple a taught word, grey what the step ignores).

**Pin each step where it happens.** On a `pictureFirst` `workedExample` or a `diagramSection` part, a callout with `step` and a `part` puts that step's number beside the part, and the drawing leaves the pin room so it never sits on a word: `card 1`, `card 2`... (counting digits from the left), a mark's `id` (default `mark 1`, `mark 2`...), `bracket`, `arc`, `sum`, `working 1`, `working 2`.... Use the board's own working, line for line; a step with no line of working on the board gets no pin.
