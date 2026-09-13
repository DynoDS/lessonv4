# Working Wall — Visual Language

This file is read by `working-wall-designer` at the start of every run, alongside `working-wall-preferences.md`. The two files do different jobs:

- **`working-wall-preferences.md`** — *content* style. What the words on a card say, how long, how punctuated, how child-facing.
- **`working-wall-visual-language.md`** (this file) — *visual* style. How the wall is supposed to look from across the room, and what your card-level choices need to do to serve that look.

You don't pick colours, fonts, or panel weights — the renderer does. Page size is fixed too: every card prints at A3. But you do pick what kind of card, whether to attach a visual, and what to leave off. Those choices are what land or break the visual language. This file tells you what the language is, so your choices support it.

---

## Consistent identity, varied learning shapes

Keep the outer visual identity stable—title treatment, typeface, palette and generous scale—but let the centre of each sheet take the shape of the learning. Consistency comes from the house style, not from repeating a grid.

- Categories + location → photo tiles with an accurate map.
- Parts of one whole → one dominant labelled diagram.
- One real context + grouped facts → hero photograph with callouts.
- Repeated causes → separate causal cards with visible arrows.
- Genuine lookup → reference table.
- Ordered action → worked-example sequence.

Do not use a reference table as the default container for any content that happens to repeat. A table is for scanning shared fields. If each example is a small story, keep its actor, action and result together; if one photograph explains the context, make that photograph the visual anchor.

---

## The load-bearing principle: this is classroom signage, not a worksheet

Children read a working wall the way they read a road sign — colour first, shape second, words third. By the time a Year 4 has finished decoding the title, they've already walked back to their seat. The card has either landed or it hasn't.

The visual reference for the wall is the classroom display poster — Twinkl-style fractions mats, RUCSAC posters, "acute / right / obtuse / reflex" angle posters. Not a knowledge organiser, not a worksheet, not a mini-lesson on paper.

Apply this test to every card before finalising it:

> A child glances at this card from four metres away for two seconds. What do they take in?
>
> - the title, in one read
> - one or two visual anchors that mean something
> - a single body sentence or step list
>
> If the answer is "they need to walk over and study it", the card has too much, or the visual is missing, or the title is competing with the body. Cut, or attach a visual, or simplify.

The wall earns its space by being usable from a desk without leaving the desk. Every card-level choice you make is in service of that.

---

## Choose visuals for the card's learning

A card earns space by offering a readable, useful reference to the lesson's learning. Keep the defining diagram, source or worked relationship when children need it to understand or use the card. A concise text-led reminder, sentence frame or lookup table may stand without a picture when it remains useful and clear. A picture existing elsewhere in the lesson does not make it relevant to this card.

Prefer the lesson's own representation where it carries the learning. Use a photograph or genuine P2 cue when it improves recognition or understanding. P3 decoration does not replace teaching content, and an unrelated image does not make a weak card useful. If a necessary visual cannot be provided, report the gap or omit the affected card rather than presenting incomplete teaching.

Judge readability at the intended wall size. The deterministic packet check cannot establish whether a picture is pedagogically necessary; the wall designer owns that judgement.


## The six design moves the wall is built on

The renderer handles four of these automatically. Two of them are yours to make happen. They're listed together so you understand the whole picture, not just your bit.

### 1. A loud title bar (renderer's job)

A saturated, full-width title strip — white type on a strong colour — sits at the top of every card. This is what carries the card from across the room. The renderer does this for you on every card type.

**Your job:** keep titles short and noun-led. The title bar is a glance-target, not a sentence. If the renderer has to shrink the title to fit, the bar stops looking like a title bar and starts looking like a paragraph in a hat. Five words, thirty characters — already in the preferences file.

### 2. Friendly chunky font (renderer's job)

Comic Sans MS body, applied across title and body. It looks like a primary school resource because it is one. You don't choose the font.

**Your job:** none. Mentioned for completeness so you know what the wall reads like.

### 3. Visual carries the meaning *(your job)*

This is where Twinkl-style posters separate from worksheets. On the FDP poster, the pie chart on the left of each row carries as much meaning as the fraction symbol next to it. On the angles poster, the drawn 65° angle is what teaches the word "acute". On the RUCSAC poster, the rucksack with R on it is the memory hook — the sentence beneath it is the caption.

A working-wall card that is pure text is a working-wall card that has given up on this design move.

**Your job:** choose the representation that makes this card useful. Prefer a familiar teaching diagram when it carries the learning; use a relevant photo or cue when it helps. A readable text-led reference may stand alone.

**The strongest case is a classification lesson** — one whose whole job is telling categories apart *by how they look*: types of line (parallel / perpendicular), types of angle (acute / right / obtuse), types of triangle, types of quadrilateral. Here the diagram isn't decoration beside the words — it *is* the definition. A child finds "acute" on the wall by recognising the small opening, not by reading a sentence. The natural shape for these is the Twinkl "Types of …" poster: one row (or panel) per category, each carrying the very diagram that defines it, with a short caption beside it. A reference table delivers exactly this when each row carries its defining diagram in a picture column (see the `referenceTable` notes below) — so a classification lesson's reference table earns a diagram per row, not a column of words describing pictures the child can't see.

Once the picture is in the row, let it carry the meaning. The row wants the category name and the diagram, plus at most a few words the picture cannot show — a column that only narrates what the diagram already makes plain ("all sides different" beside a triangle whose dashes show it, "small opening" beside a drawn acute angle) adds reading without adding meaning and tips the poster back into a wall of words. Name-plus-picture is usually the strongest, most glanceable row; keep a short meaning only when it tells the child something the picture doesn't.

### 4. Saturated panels and rounded shapes (renderer's job)

The body sits on a bold-bordered, strong-coloured panel. Each card type has its own panel identity — green for worked examples, blue for sticky knowledge, red/green pair for misconceptions, and so on. This is how children learn "the green cards are how-to-do-it cards" without anyone telling them.

**Your job:** don't fight the type system. If the lesson teaches a procedure, that is a `workedExample` card; it goes on a green panel, with the green identity. Don't try to use a `stickyKnowledge` card to carry a procedure because the wording feels easier — children read the colour as the type, and a procedure on a blue panel reads as a fact, not a method.

### 5. One concept per page *(your job)*

A poster is read in one glance. A page that crams two ideas onto one card breaks the glance. You already have the combining rule in the preferences file — apply it strictly when the visual language is at stake. When in doubt, make two cards (or drop one), not a denser single card.

**Your job:** default to one coherent representation per sheet. Combine natural pairs or tightly related visual parts when they form a faster lesson overview; do not combine unrelated items to evade the one-sheet default and two-sheet hard cap.

### 6. Colour-coded categories (renderer's job)

Card type drives colour: worked example green, sticky blue, misconception red+green, sentence stem green, reference table dark-blue header. Within reference tables, future renderer work will likely add per-row colouring for equivalence-style content (FDP rows, fraction mats). For now, the renderer applies one identity per card.

**Your job:** none yet. When equivalence rendering arrives, the agent's choices around row order will start mattering — that section will be added when the capability lands.

---

## What this means for your decisions

For each of the design moves your choices land:

| Move | Your decision | What goes wrong if you forget |
|---|---|---|
| Visual carries meaning | Attach a `visual` whenever the lesson's anchor is a drawable diagram | The card becomes a wall of text and the wall stops looking like a wall |
| One concept per page | Default to one item per card; combine only on a natural pair | Two ideas on one card halves the glance-readability of both |
| Don't fight the type system | Pick the card type whose panel identity matches the content | A procedure on a blue panel reads as a fact; children stop trusting the colour grammar |

If you only remember one of these, remember the first. Visuals are the single biggest difference between a wall that looks like classroom signage and a wall that looks like printed lesson notes.

---

## When to attach a `visual`

Today the renderer can draw these primitives — clock face, fraction circle, fraction bar, number line, angle fan, classified angle (acute / right / obtuse — `angle`), line pair (parallel / perpendicular — `line-pair`), classified triangle (scalene / isosceles / equilateral / right-angled, with the tick marks children read — `triangle`), comparison symbol and the comparison ring a child writes the symbol into (`comparison-slot`), triangle-square (the "two triangles add up to the number in the square" part-whole puzzle), 2D shapes with their lines of symmetry or measurements (`polygon`), a marker moved on a numbered grid (`translation-grid`), a squared grid of labelled patches to count for area (`area-grid`), Venn sorting diagram (`venn`), Carroll sorting grid (`carroll`), geoboard / dotty paper with shapes drawn on it (`geoboard`), reflection grid — a dot lattice with a mirror line and a shape, the reflection shown in green for a worked reference card (`reflection-grid`, mirror line vertical / horizontal / diagonal), and tally chart — a label/tally/total table whose counts are drawn as bundles of five, four verticals struck through by a fifth diagonal (`tally-chart`), and pictogram — rows of house-blue symbols against category labels with a key below, a left half-circle standing for half the key value (`pictogram`), and bar chart — a numbered y-axis scale with gridlines and house-blue bars, the natural anatomy-poster anchor for a read-a-bar-chart lesson (`bar-chart`), and line graph — points plotted at their readings and joined by a red line against numbered, labelled axes, the anatomy-poster anchor for a read-a-line-graph lesson (`line-graph`), and bar model — the White Rose part-whole bar (one rectangle divided into labelled parts) or comparison pair (two bars of different lengths with a labelled difference gap), the backbone of money and multi-step reasoning (`bar-model`), and grid-map — a schematic river-town map on a numbered four-figure grid, the numbers sitting on the lines at the corners, the anchor map a class reads human/physical features and four-figure grid references off (`grid-map`), and coordinate grid — a numbered first-quadrant grid (0,0 origin, axes numbered across and up) carrying a plotted point or a joined shape, the worked-example anchor for a plot-coordinates lesson (`coordinate-grid`; supply `points` and, for a shape, `join: true` — a blank grid is live practice, not wall material), and rainforest layers — a cross section of a tropical rainforest in four stacked bands (emergent, canopy, understorey, forest floor) whose tint carries the light gradient, brightest at the top to near dark at the floor, the anchor a class reads the layers off all unit (`rainforest-layers`; set `labels: true`, and `heights`/`light` where the unit turns on them — never `blank`, since the write-on form belongs in the child's book), and circuit diagram — a series circuit in the standard primary symbols (cells as long and short plates, lamps as crossed circles, buzzers as semicircles, the switch clearly open or closed), the anchor a class checks its own circuits against all term (`circuit-diagram`; state the cells, the components and the switch explicitly, and use `circuits` for a "this one lights, this one does not" comparison card), and parachute forces — two billowed-sheet model parachutes comparing exact 3:1 canopy widths, equal calculated cord lengths, identical loads, equal gravity arrows and qualitatively different air-resistance arrows (`parachute-forces`; use after pooled practical results with `visualScale: "dominant"`, never as a photograph or with a wind cue). The geometry primitives (`angle`, `line-pair`, `triangle`, `geoboard`, `reflection-grid`, `coordinate-grid`, `tally-chart`, `pictogram`, `bar-model`, `grid-map`, `rainforest-layers`, `place-value-chart`, `circuit-diagram`, `parachute-forces`) are drawn from the same shared source the slides use, so a wall diagram is identical to the one children saw on the board. and place value chart, colour-coded place-value columns drawn either as a row per number, each captioned at the left with the changed digit ringed in green, or as a before-and-after PAIR: start chart, bold arrow carrying the operation, result chart with the moved digit ringed and "same" under every column that held still (`place-value-chart`; give every row its digits and use `highlight` on the stacked form, or give `pair` a `from` and a `to` and the moved column is derived for you). The stacked form anchors a unit; the pair is the same picture the board draws, so a child looking up from the board meets what they recognise rather than a second dialect of it. More may be added later (hundred squares). The decision rule below is written so it stays correct as new primitives arrive — the principle is "match the lesson's visual anchor", not "use a specific primitive".

The supported shared-geometry list also includes `balanced-pattern-plate`: the same fixed broad food-group proportions, measured labels, water cue, separate less-often cue and across-a-day/over-time caption used on the slides. Use its teaching mode with `visualScale: "dominant"` for a balanced-over-time or balanced-over-a-week overview; do not replace the visual relationship with a prose table.

Choose a visual when it serves the card, as described above. A drawn primitive is the first choice - it is the same shape children saw on the board - so reach for one when these all hold:

1. **The lesson's success-criteria slide visual is a drawn diagram.** Children have looked at it during teaching. The wall card needs the same diagram or the support evaporates between desk and wall.
2. **The diagram primitive is one the renderer can draw today.** Currently: clock, fractionCircle, fractionBar, numberLine, angleFan, `turn-diagram`, `angle`, `line-pair`, `triangle`, comparisonSymbol, `comparison-slot`, triangle-square, `polygon`, `translation-grid`, `area-grid`, `venn`, `carroll`, `geoboard`, `reflection-grid`, `coordinate-grid`, `translation-shape`, `tally-chart`, `pictogram`, `bar-chart`, `line-graph`, `bar-model`, `grid-map`, `rainforest-layers`, `place-value-chart`, `circuit-diagram`, `parachute-forces`. Match the lesson's diagram to the closest primitive - a "name the angle" lesson uses `angle` (the arc / right-angle square), an "angle as a turn" lesson uses `turn-diagram`, an identify-parallel-lines lesson uses `line-pair`, a "types of triangle" lesson uses `triangle` (the tick-marked scalene / isosceles / equilateral shapes), a sort-by-two-criteria lesson uses `venn` or `carroll` (the labelled sorting diagram, shapes placed in their region/cell), a "show the shape as a picture" lesson uses `geoboard` (a shape drawn on pegs), and a "reflect a shape in a mirror line" lesson uses `reflection-grid` (set `showReflection: true` so the wall card shows the completed reflection in green), and a "plot coordinates" lesson uses `coordinate-grid` (supply `points`, and `join: true` for a shape, so the wall card shows the worked plotted example, not a blank grid), and a "describe the layers of a rainforest" lesson uses `rainforest-layers` (set `labels: true` so the card names the four layers, add `heights`/`light` when the unit leans on them, and add `notes` - a short phrase per layer, e.g. `{ "canopy": "catches nearly all the light" }` - when the card is meant to hold what each layer is *like*, which is what children come back to the wall for rather than the four names they already know). A "find 10 and 100 more" or "multiply by 10" lesson uses `place-value-chart`, in whichever of its two forms matches the card's job: `rows` to anchor the unit (the starting number, then each transformation, every row labelled and its changed digit ringed with `highlight`), or `pair` to teach one change as a movement (`from` and `to`, and the ring and the "same" markers follow from the comparison). The pair is what the board shows, so use it when the card is standing in for the teaching rather than summarising it. A parachute investigation uses `parachute-forces` for the post-investigation explanation: exact 3:1 billowed-sheet widths, equal ticked cords, identical loads and labelled force arrows, with no wind cue.

   `balanced-pattern-plate` is available for the balanced-over-time or balanced-over-a-week relationship. Copy the teaching spec from the slide so the fixed proportions and measured labels remain the visual anchor.

   **When the lesson's defining picture has no primitive yet, the picture still matters most — say so rather than quietly shipping text.** Distinguish two kinds of visual. A *supporting* visual sits beside text that already carries the point (a pizza photo next to a fractions fact); if its primitive is missing, skipping it loses little, so leave `visual` unset. A *defining* visual is the one children recognise the category by — the angle's opening, the parallel arrows; here a text-only card has dropped the actual content, so the right move is to flag clearly (in the card's place and your final report) that this lesson needs that primitive built, so the gap gets closed rather than hidden. Geometry-classification lessons almost always fall in the second kind.

The `triangle-square` primitive renders a SATs-style part-whole puzzle: two upward-pointing triangles stacked on the left, connector lines meeting an arrow that points into a square on the right. The rule is *the two triangles add up to the number in the square*. Exactly one of the three shapes is left `""` (blank) — the unknown. Schema: `{ "type": "triangle-square", "triangles": ["2453", "1372"], "square": "" }` for an addition (square blank), or `{ "type": "triangle-square", "triangles": ["1640", ""], "square": "4200" }` for a subtraction (a triangle blank). It carries no caption — the labelled diagram is the whole content.

The `triangle` and `geoboard` primitives can show **lines of symmetry** drawn on the shape, for a "lines of symmetry" reference card. On `triangle`, set `"symmetryLines": true` and the axes are auto-drawn from `kind` (equilateral 3, isosceles 1, scalene 0). On `geoboard`, give `"symmetryLines": [[[x1,y1],[x2,y2]], …]` — the explicit axis segments in peg coordinates (a geoboard shape's axes can't be auto-derived). Add `"symmetryLinesAnswer": true` so the lines render in answer green; a wall reference card showing the finished answer usually wants that on. Schema: `{ "type": "triangle", "kind": "equilateral", "symmetryLines": true, "symmetryLinesAnswer": true }`.
3. **The card benefits from the diagram.** Worked examples and sticky knowledge often need drawn relationships; sentence stems may work through their words alone. Use P2 only on a family that supports that field, and preserve any defining P1 visual. A family lacking P2 support does not require a substitute picture.

When a drawn primitive isn't the right fit, the card still carries a visual - just a different kind:

- **The lesson is text-driven** (English, vocabulary, conjunctions, geography features). A drawn maths shape would be decoration here, so the visual is a photo the lesson already fetched, or a genuine P2 card-level `picture` - a ⛪ for *church*, a 🪙 for *cost*, a coastline photo on a "physical features" card. That P2 picture is a card-level field on `stickyKnowledge`, `workedExample` or `misconception`; it is never typed into protected lesson wording, and a family without that picture area cannot carry one. The picture still leads; the words still caption it.
- **The defining diagram has no primitive yet.** When the picture children recognise the category by can't be drawn (the angle's opening, the parallel arrows), a text-only card has dropped the actual content - so flag it in your final report so the primitive gets built, and in the meantime reach for a genuine card-level P2 `picture` where that card family supports one, or a fitting photo the lesson already fetched, rather than shipping bare words. If neither is available, omit the ordinary card. Never approximate with the wrong primitive.
- **The card works as a concise text-led reference.** Apply the card-level judgement above.

When none of these gives an honest visual and the card does not qualify for the success-criteria exception, it stays on the slides rather than going up as text. Note that choice in `rationaleNote`, and note any primitive you wished for in your final report - that's how the next renderer build knows what to add next.

### Reach for primitive variants when the lesson is teaching the diagram itself

Some primitives carry optional flags that make them more pedagogically loud — colour-coded, labelled, annotated — at the cost of reading slightly busier. Default to plain when the diagram is a familiar reference children already know how to read; reach for the loud variant when the lesson is teaching children *how to read the diagram*.

For the clock primitive specifically: when the LO is "tell the time" / "read a clock" / "write digital from analogue" — i.e. children are still learning the mapping between hands and digits — pass `"colourCoded": true` so the hour hand and minute hand carry different colours and the digital readout below them mirrors those colours. This turns the clock card from a labelled diagram into an *anatomy* diagram: the child sees that the long blue hand is the minute hand and points at the blue minute digits, the short red hand is the hour hand and points to the red hour digit. On Year 2/3 lessons or any lesson teaching the × 5 minute count, also pass `"minuteRing": true` so the outer ring carries `:00 :05 :10 …` labels — children can read the minute value off the ring without multiplying. Drop both flags once children have internalised the mapping (Year 5+, or revisit lessons where the rule is already secure) — at that point the loud variant adds visual noise without earning it.

The general principle: a wall card visual is at its strongest when its colours, labels and annotations *teach the diagram*, not just *show it*. If the lesson's success-criteria slide carries a labelled or colour-coded version of the diagram, the wall version should match. If the slide carries a plain reference, the wall stays plain.

### The anatomy poster — when the lesson is learning to *read* a diagram (`labelledDiagram`)

Some lessons are not about calculating *with* a diagram but about understanding the diagram itself: what its parts mean and how to get information out of it. "Read a pictogram", "tell the time from a clock", "read a four-figure grid reference", "read a bar chart", "read a line graph" — the learning is recognising the parts (the key, the half-symbol, the axis, the gridline) and knowing what each one is for. For these, the strongest wall anchor is the diagram itself with its parts called out and named: an **anatomy poster**. A child returns to the wall and learns "the key is the bit that tells me what one symbol is worth" by seeing it pointed out *on the very picture they read in class*, not by reading a sentence about it. This is the principle above taken to its conclusion — the annotations don't sit beside the diagram, they label it.

The `labelledDiagram` card carries this. It takes a `visual` (any drawn primitive — a pictogram, a clock, a grid map) plus a `callouts` array, and the builder draws the diagram, then points a green leader-and-arrow at each named part and prints its name. The card is the picture: a title bar, the annotated diagram filling the page, and an optional one-line caption. The callouts and field shapes live in the designer's field reference; the judgement is what belongs here.

Choose what to call out the way a teacher would point at the board: the parts a child must recognise to read this diagram, and the one that is most often misread (on a pictogram, the half-symbol; on a clock, which hand is which). Three or four callouts is the comfortable poster; more turns the anatomy into a crowd. A worked read-off is a callout too — pointing "Monday = 30" at Monday's row shows the reading happening, not just the parts.

**Pair the anatomy poster with the step-by-step method when the lesson also drills a procedure.** The two cards do different jobs and the wall wants both: the anatomy poster *names the parts*, a `workedExample` "How to find a value" card *sequences the actions*. Lead with the poster — it is the thing a child looks up first, because you can't follow the steps until you can read the diagram — and let the steps card sit alongside as the method. When the lesson is purely "what does this diagram show" with no procedure to drill, the poster stands alone.

### When the diagram should fill the card — `visualScale: "dominant"`

The default card layout puts the panel content (steps, sticky-knowledge sentence, misconception pair) on the left and the diagram on the right at roughly a 60/40 split. That's the right balance for most cards — children read the steps and glance at the matching diagram alongside.

When the diagram itself is the teaching surface — a colour-coded clock anatomy showing how analogue and digital map to each other, a labelled fraction-circle reference, an angle-comparison chart in the Twinkl-poster style — flip the layout by setting `"visualScale": "dominant"` on the card. The panel shrinks to a slim left strip carrying just the title and a short caption; the diagram fills the rest. Children glance at the wall, see the picture from across the room, and the picture is doing the teaching.

Apply `visualScale: "dominant"` when:
- The diagram is itself richly labelled / colour-coded — its annotations carry the meaning, not the panel text alongside it.
- The panel content can compress to a one-line caption or a single short sentence without losing the teaching point. If the steps need their full size to be readable, stay with `panel`.
- The lesson's slide anchor is a single dominant visual (a full-width clock with labels, a large angle fan with the degrees called out, an annotated diagram).

Stay with the default `panel` when the panel carries multi-step instructions children re-read while working, when the diagram is a familiar reference (a small clock face, a fraction-circle reference table), or when the card combines a procedure with a worked example. Cramming a procedure into the slim left strip of a `dominant` layout is worse than carrying both at the default 60/40 balance.

---

## How the card types serve the visual language

A short note on the visual personality each card type is shooting for. Not rules — just what the renderer is trying to achieve, so your choices align.

| Card type | Visual identity it's chasing |
|---|---|
| **Worked example** | The lesson's success-criteria slide, made big and pinned up. Steps as numbered badges down the left, worked example sentence at the bottom. When a `visual` is attached, the diagram sits to the right and the steps to the left, so children read step-then-shape just like on the slide. |
| **Labelled diagram** | The anatomy poster — the diagram children read in class, made the whole card, with its parts called out and named in answer-green. The Twinkl "parts of a …" reference. The picture teaches by recognition, so a title bar sits above and an optional one-line caption below, and the labels do the rest. Pairs with a worked-example "how to" card when the lesson also drills a method (see "The anatomy poster" above). |
| **Sticky knowledge** | A "Remember" poster — one sentence, big, with optional anchor image. Lives somewhere between the FDP poster's body and a single mnemonic page. Photograph or visual anchor on one side when it adds meaning; nothing if it doesn't. |
| **Sentence stem** | A "How to talk about it" prompt — typically a stem with a blank, or a small menu of stems. No image. The stem itself is the visual — the underline-blank where children's eye lands. When the lesson models the completion, the stem is paired on the card: gappy version on top in black, modelled version directly beneath in the green panel accent. The colour split between the two lines is the teaching — a supported child copies the green; an independent child uses the black. Matches the Twinkl two-card swap (supported → independent) on a single card. |
| **Misconception** | The "Don't/Do" twin-panel poster. Wrong on the left in red, right on the right in green. The colour split is the teaching. |
| **Reference table** | A look-up grid — the same shape children saw on the slides and worksheets, made glanceable. Header bar bold and contrasting; rows light. For a *word* lookup (conjunctions, units) the table is the visual and needs no extra image. For a *classification* lookup (types of line / angle / triangle / shape) a row can carry its defining diagram in a picture column — a cell becomes `{ "visual": { … } }` instead of text, and the row pairs the category name with its picture (plus only words the picture can't show), the Twinkl "Types of …" poster. This is how the wall stops being a wall of words on the lessons that most need pictures. |
| **Vocab definition** | A subject-vocabulary card, identifiable by its teal title bar. The term in the bar, the child-language definition in the panel, the drawn example to the right. Children learn "teal cards = vocabulary" through repetition across the unit. |
| **Vocab chips** | The lightweight half of the vocabulary identity, sharing the teal title bar. A grid of 4–12 short word chips on one A3 landscape page - each chip a teal-outlined box on white with the word bold-teal in the centre, optionally paired with a small image cue. Reads as the Twinkl "Vocabulary Cards" sheet - many related words, one printable page, scanned at a glance. Lives under the same `Vocabulary` zoner as `vocabDefinition` and is designed to coexist with it: definition cards carry the lesson's central terms in depth; chip cards carry the breadth of supporting vocab around them. |
| **Equivalence grid** | The Twinkl FDP poster pattern — coloured-row equivalence chart. Each row is a saturated full-width strip in its own colour, drawn primitive on the left, equivalent forms on the right. Children find what they want by hue first, value second. |
| **Mnemonic poster** | The Twinkl RUCSAC pattern — a multi-page poster. Page 1 is the summary row of all letters. Pages 2..N+1 are per-letter, each with a giant coloured letter centred and a single phrase below. Wall-dominating; reach for it only when the lesson genuinely teaches a named mnemonic children will use across the unit. |
| **Section heading** | A wall *zoner*, not a teaching card. One bordered box across the top of an A3 landscape page - saturated outline, the heading word(s) centred inside it in the renderer's loudest type, the rest of the page left white, no body, no visual. Lives at the boundary between zones (above the vocabulary cards, above the stem cards). The colour of the outline tells the child which zone they're standing in front of, so adjacent headings cycle through the rainbow palette rather than repeating a hue. |
| **Banner** | The display title strip pinned across the very top of the wall - Twinkl's `English Working Wall` printed across three A3 landscape pages, one massive word per page. Each page carries a wide saturated rainbow-palette band across the printable width, the word centred on it in huge bold white type with a white margin around the band; adjacent pages cycle the palette so the strip reads as a colour-coded title. Banners label *the wall itself* (what unit or subject it's for) where section headings label *zones inside it*. |

When the lesson asks for something none of these covers naturally, note it in your final report. Future renderer work will add new card types based on the patterns that recur.

**The vocabulary family — depth and breadth on one zone.** `vocabDefinition` and `vocabChips` share a single visual identity. Same teal title bar, same teal accents, both pinned beneath the same `Vocabulary` zoner. The difference is weight: a definition card is one word made large, with a child-language definition and a drawn primitive — heavy lifting per card, used when the lesson teaches a tier-3 term as a concept. A chip card is many words made glanceable — a grid of 4–12 short pills, optionally paired with image cues — used when the lesson introduces a set of supporting vocabulary children will use across the unit. Children learn the teal family by repetition: the saturated title bar tells them this zone is words; the card weight tells them whether to read for meaning or to scan for the word they want.

---

## Section heading cards — zoners, not teaching cards

Every card type above carries teaching content. Section heading cards do something different — they label regions of the wall. "Vocabulary" pinned above the vocabulary zone. "Sentence Stems" above the stems. "Modelled Strategies" above the worked-example pile. They're the same furniture Twinkl ships as cut-out pills, sized up to one bold zoner per A3 page so the labels read from across the room.

A `sectionHeading` card is a structural artefact, not a teaching one. That distinction matters for two reasons:

- **They're opt-in wall furniture.** Only an explicit teacher request creates zoners. They sit outside the teaching-sheet cap, but their physical pages still count against paper and wall space and must be reported. Use the minimum requested set, normally 2–4.
- **They typically appear once per unit, not once per lesson.** Headings persist across the unit — once "Vocabulary" is pinned, it stays. Reissuing the same set every lesson just fills the printer. Produce them only when the lesson-design signals the wall is being newly set up; on any other lesson, skip them. Wording rules and the canonical heading list live in `working-wall-preferences.md`.

The colour of a zoner is doing work. When you produce multiple headings, cycle through the renderer's rainbow palette so adjacent zoners differ. Children read a wall built this way as a colour-coded layout — *the red region is vocab, the green region is stems* — and find what they want by hue first, words second. Repeating a hue across adjacent zones collapses the layout back into a wash.

---

## Banner cards — the wall's own title strip

A banner is the closest visual relative of the section heading — same rainbow-palette colour cycling and structural job. It is produced only when explicitly requested, and its physical page cost is reported separately from the teaching-sheet cap.

A section heading is an outlined pill in the middle of the wall, labelling the zone *underneath* it. A banner is a saturated full-bleed strip across the *top* of the wall, labelling the wall itself — what unit or subject it's for. Where a heading whispers "vocabulary lives below me", a banner shouts "this whole wall is English". Section headings are outlined so the wall's white space reads through them; banners are filled so they dominate the line of sight from the back of the room.

The renderer prints each banner word on its own A3 landscape page, centred in huge bold white type on a different rainbow-palette colour. The teacher pins the pages end-to-end above the wall and the room reads `English Working Wall` in rainbow letters from anywhere in the classroom. The agent doesn't pick the colours — the renderer cycles them automatically so adjacent pages differ.

One banner per setup. The subject-banner vs unit-banner choice and the 1–6 word, 15-character-per-word rules live in `working-wall-preferences.md`; this file just notes that the banner is the wall's furniture, distinct from the zoners that sit inside it.

---

## Anti-patterns — what breaks the visual language

These show up most often when the lesson is content-rich and the temptation is to "fit it all in". Don't.

| Anti-pattern | Why it hurts |
|---|---|
| Long titles that wrap | The title bar is a glance-target. A wrapped title turns the bar into a paragraph and the card stops looking like a poster. |
| Three or four items on one card | One concept per page is the whole game. Three items on a card means three half-cards, none of them readable from a desk. |
| All-text cards (any subject) | A card a child can only read word-by-word can't be read from across the room, so it isn't wall furniture - it's slide content. Carry a visual (diagram, photo, or emoji cue), or leave the content on the slides. The one exception is a step-by-step success-criteria card. |
| A procedure on a sticky-knowledge panel | The blue panel says "fact". A procedure on it reads as a fact, not a method. Children stop trusting the colour grammar across the unit. |
| Filler cards to hit a count | An empty wall is fine. A wall full of weak cards is worse than a wall with one strong card and two empty hooks. The rationaleNote is where you explain skipping. |
| Reference tables as bullet lists | When the lesson used a grid, the wall uses a grid. Reformatting to a list throws away the shape recognition children navigate by. |

---

## What this file does not cover

- **Wording, length, punctuation, child-language** — those live in `working-wall-preferences.md`. Read that file too.
- **Colour values, font weights, panel border thickness** — those live in `working-wall-html/style.json` and aren't your concern.
- **New card types and new visual primitives** — when these are added, this file will gain sections describing the choices around them. Until then, work with the card types and primitives the agent can render today.
