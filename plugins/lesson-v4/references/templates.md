# Slide Template Layer

This is the reference the slide-designer reads to choose templates and fill their zones. It defines every template, every content object, and the rules that govern how they fit together.

**How Slide Designer reads this catalogue.** At run start, read sections 1.1, 1.3 and 1.4. Scan the section 1.2 capability index so you know which content objects exist. Scan the names, Purpose, Shape, Use for and Slots lines in sections 2 and 3 so you know which template families exist. Do not load every example or field contract at startup. When one template becomes a real candidate, read that template's complete entry before selecting it. When one content object becomes a real candidate, read that object's complete section 4 entry before its first use in the run. A later use reopens the entry only when it depends on a different mode, field or minimum-size rule. Section 5 is enforced by the real layout preflight and is lookup evidence for a compatibility failure, not routine startup context. Read section 6 at run start. Helper Builder and Template Editor continue to read section 4 in full because they maintain the catalogue.

---

### Optional slide decorations

A non-vocabulary slide may carry top-level `decorations` from
`context-pictures.md`. A vocabulary surface is `template: "key-vocabulary"` or
any slide containing a `type: "vocab"` object; P3 is forbidden there. Decorations
use full-slide coordinates, create no zone and do not enter layout preflight.

## 1. Concepts

### 1.1 Two families of templates

**Fixed templates** are pedagogically opinionated. Their geometry and typography are tuned to a specific teaching moment — a My Turn slide, a vocabulary reveal, a success-criteria reference. When the slide's job matches a fixed template's design, that template is the right choice because its visual rhythm is already dialled in. Examples: `maths-turn-sc`, `key-vocabulary`, `teach-compare`.

**Free templates** are geometric. They define zone shapes without assuming what content fills them. You pick a layout whose shape matches the slide's needs, then pour content objects into the zones. Examples: `split-h-60-40`, `grid-4`, `central-callouts-4`.

The slide-designer's rule: **fixed first when pedagogy matches; free whenever no fixed template fits.** If two templates are pedagogically equivalent, prefer the fixed one for visual consistency across the deck.

### 1.2 Content objects (helpers)

Every piece of slide content is one of a fixed set of content-object types. The same objects work across every template.

| Type | What it is |
|---|---|
| `text` | A block of prose or a single sentence |
| `bullets` | A bulleted list |
| `steps` | A numbered step list |
| `vocab` | Word + definition pairs |
| `image` | Photograph or diagram (with optional caption) |
| `map` | A real map of a real place, drawn from a map image this package ships, with the lesson's own places, regions and rivers marked on top of it |
| `table` | Header row + body rows |
| `mult-grid` | A multiplication-facts grid (the SATs "missing numbers in this multiplication grid" shape): `×` corner, headers across and down, product cells. Big numbers, blank cells, green `||` answers. Use for a times-tables grid, not the generic `table` |
| `matching` | A "draw a line to match" layout: two columns of boxes joined by connector lines. One example line on the question, every line green on the answer slide. Use for any match-these-to-those starter or task |
| `numberline` | Number line with ticks, question arrow, answer dot |
| `place-value-chart` | Coloured column grid for digits, with optional row labels, column-aligned place-value counters, and a ring round the digit that changed. A `pair` field instead draws ONE before-and-after comparison and can add counter populations plus explicit ten-for-one exchange cues; omitting counters gives the original compact digit-only chart |
| `fraction-wall` | Stacked rows of equal-width fraction pieces |
| `part-whole-model` | One whole circle (left) branching to 2–3 part circles (right), with text labels in each |
| `triangle-square` | The "two triangles add up to the square" part-whole puzzle in SATs-paper notation: two stacked triangles (left) with arrows pointing into a square (right). Leave one shape blank for the unknown. Use when the lesson recreates this exact paper question type — not the circle-and-line `part-whole-model` |
| `coordinate-grid` | A numbered first-quadrant grid with plotted, lettered points; optionally joins the points into a closed shape. Use for reading/plotting coordinates and "what shape do these coordinates make?" |
| `polygon` | One or more named 2D shapes side by side (square, rectangle, triangle, isosceles/scalene triangle, kite, hexagon…), drawn from true geometry. Use for naming shapes and counting right angles / parallel sides; also draws lines of symmetry — the full set for an answer slide, or a single candidate line to TEST (pass/fail + fold preview) for a teaching slide |
| `translation-grid` | A numbered grid showing one marker translated from a start (orange) to an end (blue) position, with a dashed arrow between. Use for "how far has the shape moved?" translation work |
| `translation-shape` | A numbered coordinate grid showing a WHOLE shape and, with `showImage: true`, its translated image (the same shape slid by the translation) in lighter dashed blue, with a dashed arrow between matching vertices. Use for "translate this shape" — the signature translation picture. Leave `showImage` off for the task (original only, child plots the image); set it on for the worked answer. Distinct from `translation-grid` (single markers, not a whole shape) |
| `shaded-fraction` | A shape (bar / grid / circle) split into equal parts with some shaded green. Use for "shade one quarter" and "what fraction is shaded?" — set `shaded: 0` for a blank shape children shade in |
| `dial-scale` | An analogue round scale (kitchen/weighing dial): 0 at the top, a full turn = `max`, numbered ticks and a needle on `value`. Use for reading a measuring dial |
| `line-graph` | A line graph with numbered, titled axes and plotted points joined in order. Use for reading a value off a graph or an interval between two values |
| `tally-chart` | A tally chart: a group-label column, a tally column whose counts are drawn as bundles of five (four verticals struck through by a fifth diagonal) and remainder strokes, and an optional Total column. Pass `tally` as a NUMBER per row — the marks are drawn for you. Set `blank: true` for empty tally boxes (sized to the expected marks) children fill in as they collect data. A `total` with the green `||` marker (`"||12"`) reveals that frequency as a worked answer — for the modelled rows on a My Turn and the whole column on an answer slide. Use for reading or making a tally chart in statistics — the marks, not raw numbers, are the point |
| `pictogram` | A pictogram: each row is a category label followed by a series of house-blue symbols, with a key below stating how many units one symbol stands for. A left half-circle stands for HALF the key value (`per` 10, value 45 → four-and-a-half circles). Pass `categories`, `values` and `key: { per, label }`. Use for reading or making a pictogram in statistics — the half-symbol = half-the-key is the Year 4 teaching point |
| `bar-chart` | A bar chart with labelled axes and a numbered y-axis scale: the canonical statistics visual. Pass `categories` and `values`; set `y_interval` explicitly so the scale steps in non-unit jumps (it never defaults to 1, because reading a non-unit scale is the Year 4 teaching point). Optional `title`, `y_max`, `y_label`, `x_label`. Use for reading or making a bar chart in data-handling, where the scale you read against (not the bar) is the question |
| `label-diagram` | A photo or drawing with a labelled-part overlay: each callout is a dot on the part joined by a leader line to its name. Pass `imagePath` and `callouts` (each `{ anchor:[x%,y%], label, given?, label_at? }`); `given:true` prints the label (the completed/answer diagram), omitting it draws a blank write-on line (the question form). Use for labelling the specific parts of a real diagram (parts of a plant, features of a river, angles on a shape): the leader line is what lets a child map each name to its part, which a corner-callout slide cannot do |
| `bar-model` | A general bar model. `shape: "part-whole"` is one long rectangle (the whole) divided into 2+ labelled parts; `shape: "comparison"` is two stacked bars of different lengths with the shorter bar's shortfall shown as a labelled difference gap. Segment lengths go proportional to part/bar `value`s when given, even otherwise. Any region whose label is empty or ends in `?` becomes a white answer box. Use for money (change, totals), comparison ("how much more?") and multi-step reasoning — the White Rose bar children meet from Year 4. Distinct from `part-whole-model` (circles) and `triangle-square` (SATs puzzle) |
| `method-frame` | A taught mental strategy printed as a fill-in method: an ordered list of labelled lines (the strategy's own words - "First, add:", "Then, adjust:") inside a green "method" panel, each line a stem in which `___` or `□` becomes a write-in box available for live completion during modelling. Caller sets how many blanks each line carries, so the same frame is shown fully worked, with one blank, or all blank - fade it across a set. The board twin of the worksheet's `method-frame`; for a SINGLE-LINE equation frame use a worksheet `inequality-with-boxes` instead |
| `blank-surface` | A DRAW-YOUR-OWN working surface the child constructs on, not a pre-drawn fill-in. `surface: "number-line"` is a single faint baseline with a tall empty band above for the child's own jumps (no ticks, no numbers; optional `start`/`end` labels at the ends); `surface: "bar"` is one empty rectangle outline to partition (`bars: 2` for a comparison pair). Use when deciding WHERE the jump goes or HOW to partition is the skill. The slide's blank surface shows the class the surface they will draw their own version of. Distinct from `numberline`/`bar-model` (which draw the finished picture with blanks) |
| `numbered-questions` | Stacked question cards with auto blue `(1) (2) (3)` labels, for Apply / independent work |
| `question-cards` | The same question set laid out as separate white cards instead of a list: one card per question, a blue number badge on each card's corner, each card at a degree or two of tilt. The cards pack across the zone and the type grows until the set fills the space. A second way to present a question set, not a replacement; see the entry in §4 for which of the two a set belongs in |
| `pyramid` | Ranking pyramid: rows of cells stacked from a single cell at the top to wider rows beneath. Used in dialogic lessons for ranking activities (e.g. influences from most to least important) |
| `clock` | Analogue clock face, with or without hands. Use for time-telling lessons — My Turn slides show a preset time; Your Turn slides leave the face blank for children to draw on |
| `number-network` | Circles joined by lines where every connected pair must add to a fixed target; blank circles show a faint `?` for the child to fill. Use for "each line adds to 100, find the missing numbers" addition-network reasoning |
| `area-grid` | A squared grid with one or more labelled rectangular patches drawn on it, every square countable. Use for "each square = 1m², find the area of each patch" area-by-counting work — the multi-patch case a single `shaded-fraction` bar can't show |
| `reflection-grid` | A dot grid with a mirror line and a shape on one side; set `showReflection` to add the reflected shape in green on the answer slide. The mirror runs vertical, horizontal, or on either 45° **diagonal** (`diagonal-up`/`diagonal-down`). Use for "reflect this shape in the mirror line" symmetry work, where the unnumbered dots and equal-distance reflection are the point |
| `grid-map` | A schematic river-town map on a **numbered four-figure grid** — eastings along the bottom, northings up the side, the numbers sitting ON the grid lines at the corners (read along the bottom, then up the side). A blue river winds through with a meander, features sit inside their squares, and an optional ring marks one square's bottom-left corner. Use for "read the human/physical features and four-figure grid references off the map" geography/maths work; the `highlightSquare` ring models reading a reference on the Teach slide |
| `world-geography-map` | A north-up seven-continent world map in three deliberate configurations: blank continent retrieval, four-biome examples with an exact key, or tropical-rainforest distribution with the Equator and both Tropics. Use when the geography itself must stay accurate and consistent between the board and a child's write-on map |
| `geographical-description-frame` | A blank three-part writing frame headed Biome, Location, and Features from evidence. It prompts for a biome meaning and example, a continent and more than one country, and two features linked to map or photograph evidence |
| `rainforest-layers` | A cross section of a tropical rainforest — four stacked bands, top to bottom: emergent (a few very tall widely spaced trees), canopy (an unbroken roof of overlapping treetops), understorey (thin trunks and large leaves), forest floor (dark ground, leaf litter and roots). The **band tint is the light gradient**, brightest at the top and near dark at the floor, so the diagram teaches the light idea just by looking right. Toggle `labels`, `heights` and `light` (sun, arrows thinning band by band, "about 2 rays in every 100"); `notes` prints a short phrase under a layer's name, which is where what a layer is *like* belongs rather than in a text panel beside the picture; `highlight` takes a pair of layer names and dims the other two, so the same diagram carries a whole lesson slide by slide; `blank` gives the write-on form. Use for any "describe the layers of a rainforest" geography work |
| `balanced-pattern-plate` | A neutral broad proportional food-group plate: larger fruit-and-vegetable and starchy-carbohydrate areas, smaller protein and dairy-or-alternative areas, and a very small oils-and-spreads area. The five proportions are the fixed thing the picture teaches and no field changes them; everything you set is words. Each group takes its own label and up to four short examples, and the drawing measures them, so a longer label wraps, shrinks, and moves out to a labelled card beside the plate rather than being clipped. `mode: "practice"` keeps the identical sectors and turns whichever groups you name into pupil-decision spaces. Water sits beside it; foods high in fat, salt or sugar have a separate "less often / small amounts" cue. Never use calorie, weight-loss, moral, or bad-food labels. |
| `geoboard` | A grid of evenly spaced pegs (dotty paper) with zero, one, or many straight-line shapes drawn on by their vertices. A general workspace: blank dotty paper to draw on, a single shape to name, a square turned 45° on diagonal pegs ("it's not a diamond"), or several shapes to sort. Not limited to four sides — triangles, pentagons, irregular and open paths all work. Use for shape, area, perimeter, symmetry and "how many shapes can you make?" investigations. Unnumbered (unlike `coordinate-grid`); a free drawing surface, not a reflection task (unlike `reflection-grid`) |
| `measuring-jug` | A jug with a vertical graduated scale: 0 at the bottom up to `max`, numbered ticks, and an optional coloured liquid level. Use for "read the level" / "mark 250ml" capacity work — the vertical scale the round `dial-scale` can't represent |
| `turn-diagram` | An "angle as a turn" picture: two black rays from a vertex (the start ray points up) with a red curved arrow showing the rotation. Set `quarters` (1/2/3/4) and `direction` (clockwise/anticlockwise); optional `countMarks` numbers the quarter steps along the arc. Use for identifying or matching turns — the White Rose "match the turns to the labels" shape. This is the turn *measure* between two rays, not the distance along a line |
| `angle` | A *static* angle: two black arms from a vertex with a blue arc marking the opening, or a blue right-angle square at 90°. No rotation arrow — this is the angle that exists *after* a turn, for children to classify as acute / obtuse / right. Set `degrees` (1–179, never shown — only sets how open it's drawn) and optional `rotation` so a set isn't all the same way up. The classify-the-angle companion to `turn-diagram` |
| `triangle` | A triangle to classify **by its sides** — a filled blue polygon with tick-mark dashes showing equal sides (same number of dashes = equal). Set `kind` (`scalene`/`isosceles`/`equilateral`/`right`) and the dashes and right-angle square are chosen to match; optional `rotation`, `angleArcs`, custom `sides`/`ticks`. The classify-the-triangle primitive |
| `triangle-nonexample` | A shape that is *not* a triangle, for the concept-attainment sort (`shape`: `open`/`curved`/`quad`). Use alongside `triangle` to ask "which are triangles and which aren't?" |
| `line-pair` | A pair of straight black lines arranged to show one relationship — parallel, perpendicular, or neither — for children to judge and mark. Set `relationship` and `form` (the arrangement: horizontal/vertical/diagonal parallel; cross/L/T/detached perpendicular; converging/slant non-examples), optional `notation` (`arrows` for chevron parallel marks, `right-angle` for the blue square, default `none` bare lines), and `rotation` so a set isn't all the same way up. The identify-parallel-and-perpendicular primitive |
| `circuit-diagram` | A large standard-symbol series circuit with one path and no branches. Set cells or a battery, lamps, buzzers, switch state and whether the path is complete or has a deliberate gap. Use for reading, comparing and reasoning about primary circuit diagrams, not as a realistic equipment picture |
| `circuit-symbol-bank` | A stable row of individually identifiable standard circuit symbols with labels. Use when children need the component-symbol reference itself: cell, lamp, wire, open switch and closed switch remain separate visual items rather than being extracted from one complete circuit |
| `chip-bank` | A set of short labels drawn as distinct rounded pills (chips) that wrap across the zone and centre — a word bank, a property-label set, an option set, sorting categories. Set `chips` (the labels), an optional `title`, and a colour `variant` (`blue`/`yellow`/`green`). Use whenever the slide shows a *bank to pick from*; reads as a bank of options where a middot-joined string reads as one flat line of fake bullets |
| `venn` | A Venn sorting diagram: two overlapping labelled circles inside a rectangular box (the "universe"), with shapes placed in four regions — left circle only, right circle only, the overlap (fits BOTH), or outside both circles but inside the box (fits NEITHER). Set `label1`/`label2` (the circle criteria). Omit `shapes` for a BLANK labelled frame the teacher/children place into live (faint "both"/"neither" hints show the regions); pass `shapes` to show named tokens already sorted. Use for sort-by-two-criteria work — the overlap and the outside region are the point |
| `carroll` | A Carroll sorting diagram: a 2×2 grid with a paired row criterion down the side (is / is NOT) and a paired column criterion across the top (is / is NOT), so every shape lands in one of four cells. Set `rowLabel`/`rowNotLabel` and `colLabel`/`colNotLabel`. Omit `shapes` for a BLANK labelled grid; pass `shapes` (each `{ cell, label }`, cell = topLeft/topRight/bottomLeft/bottomRight) to show tokens already sorted. The grid companion to `venn` — every cell means its row label AND its column label together |
| `money` | UK coins and notes drawn from plugin-shipped assets - a pile, a row, or two groups split by a `|` sentinel |
| `stack` | A container placing its items one above another inside a zone |
| `row` | A container placing its items side by side inside a zone |
| `diamond-nine` | The ranking diamond: nine cells in the 1-2-3-2-1 shape, most important at the top |
| `continuum-line` | An agree/disagree (or any two-pole) line with marks a class positions ideas along |
| `fishbone` | A cause-and-effect fishbone: a spine to the effect, angled ribs carrying causes |
| `concept-map` | A radial concept map: a centre idea with spokes to connected ideas |
| `callout` | A small coloured box holding one short line of text, with an arrow leaving any side of it to point at the thing the line is about — the chart above it, the number line beside it, a part of a photograph. Set `points` (up/down/left/right) and `at` (how far along that edge the arrow tip lands). Key words in the line carry colour with the ordinary inline markers. Use whenever a slide needs to point at its own content and say one thing about it, instead of leaving that sentence to a text panel or the speaker notes |
| `sc-panel` | Wraps a success criteria in its green "✓ Success Criteria" box, so the criteria reads as the standard wherever it sits — use when the success criteria has to go somewhere the `maths-*-sc` panel can't reach (a wide visual reference in a full-width strip, a free-template zone). Inside a `*-sc` template's own criteria slot the box is already drawn, so there pass the bare criteria, not this. Carries an optional `flipchart: true` for a draw-live criteria — same corner pencil as the `*-sc` panels; set it on the `sc-panel` object itself here |

Any zone in any template accepts a content object. Whether a particular content object fits a particular zone depends on the zone's class — see §5.

### 1.3 Zones and zone classes

A zone is a rectangle in a template where content sits. Every zone is assigned a class based on its size. The zone classes are:

| Class | What it means | Example |
|---|---|---|
| A | Big, wide, full-body | The whole body below the header on a one-zone slide |
| B | Wide but short — a strip | A banner above a body zone |
| C | Half-column | Either side of a 50/50 split |
| D | Third-column | One of three equal columns |
| E-wide | Major side of an asymmetric split (≥60%) | Left side of 60/40, 70/30, 75/25 |
| E-narrow | Minor side of an asymmetric split (≤40%) | Right side of 60/40, 70/30, 75/25 |
| F | Thin instruction bar | A one-line label strip |
| G | Small card | A callout, a grid cell, a scaffold box |

The class determines what content types fit (see §5).

### 1.4 Header modes

### Header `instruction` is a secondary cue

The header `instruction` is a small secondary cue, not the principal pupil-task surface.

A main source-authored task belongs in the body at task-reading size. Use the header `instruction` only when the body already makes the main task clear and the header adds a short secondary cue.

Do not duplicate the same task wording in both places.

If a fixed template would force an essential multi-action pupil task into the header instruction, use a free template whose body can carry the task visibly.

Every non-cover template has a header area above the body. Two modes:

| Mode | Contains | Height | Use |
|---|---|---|---|
| `title` | Title + optional instruction on one row | ~0.6" | Default for all non-starter slides |
| `starter` | Date placeholder + LO + heading bar | ~2.3" | Use when this slide is the starter |

The lesson's opening Date + LO are not a third scenario: they are carried by the starter (slide 1) using the `starter` header mode above. Children copy the date and LO from the starter header into their books as they begin — there is no separate cover slide before the starter, because a slide whose only job is the date and LO spends a teaching beat on something the starter header already does (see `preferences.md`).

---

## 2. Fixed templates

Pedagogically opinionated. Use when the slide's teaching moment matches the template's design.

### 2.1 Opening Date + LO — the starter header, not a cover slide

The lesson opens on the starter (slide 1). Its Date and LO sit in the `starter` header mode (§1.4) — children copy both into their books as they begin the starter. There is no separate "Copy the date and LO" cover slide: a slide whose only content is the date and LO spends a whole teaching beat on something the starter header already carries, which is why `preferences.md` rules it out.

(A `lesson-cover` template still exists in the builder for historical reasons and is exercised only by build-test fixtures. Leave it out of real lessons, and don't reintroduce it to this catalogue as a recommended choice.)

### 2.2 Maths MT/OT/YT family

My Turn / Our Turn / Your Turn is a teaching move, not a maths-only feature, so it also runs in grammar, punctuation, spelling and comprehension — but there the modelled answer is a word, a choice or a mark with no working to write out. Those non-numerical turns belong on `body-full` (or another free template), where the question and its options, sentence, `table` or `matching` fill the body. The maths templates here expose no body zone and size their cards for short sums, so non-numerical content placed in them comes out cramped or unrendered. The slide-designer's skill-based mapping covers which to choose.

**No template in this family ever carries a blank column for the teacher to write a calculation into.** Follow the upstream `Modelling resource state`. When a move uses Question and reference, the written working itself does not claim a slide zone; `writing-turn-ref-sc`, below, is one template that supports that state. The templates that follow can carry diagrams used as helpers or references — reading a clock, filling a grid's blank cells, tracing a coordinate grid — and each one that can carry a diagram needs telling to give it the full width; do not infer the resource state merely from the presence of a diagram.

#### `writing-turn-ref-sc`

**Purpose:** My Turn or Our Turn slide for **Question and reference** modelling — the written working happens away from the helper, so the slide never carries a working column at all. Question strip on top, a reference panel taking the room a working column would otherwise have claimed, full-height SC panel on the right. Use it when the upstream resource state is Question and reference and the slide needs the question, success criteria and any useful reference visible while the written working happens elsewhere.

**Slots:** `title`, `questions`, `criteria`, `criteriaLabel`, `flipchart` (see `maths-turn-sc`'s entry below for what it renders), plus:
- `reference` (optional) — a content object holding whatever the teacher and class need visible during modelling: a fraction wall or number line shown for context, a price list, a results table, or leave it out entirely for a plain calculation with nothing else to show.
- `referenceLabel` (optional) — short label rendered at the top-left of the reference panel. Omit for unlabelled references.
- `questionNumbering` (optional) — omit or use `"none"` for My Turn and ordinary non-Maths Our Turn. Use `"teacher-led"` only for a Maths Our Turn containing two or more discrete questions; it renders `(a)`, `(b)`, `(c)` and restarts on that turn.

There's no `workingSpace` flag to set here: this template never draws a working column, so there's nothing to switch off.

#### `maths-turn-sc`

**Purpose:** My Turn or Our Turn slide with a full-height SC panel on the right, and a diagram or visual helper as part of the question.

**Slots:** `title`, `questions`, plus:
- `criteria` (required) — a content object (typically `type: "steps"` or `type: "table"`)
- `criteriaLabel` (optional) — panel label, defaults to "✓ Success Criteria"
- `questionNumbering` (optional) — omit or use `"none"` for My Turn and ordinary non-Maths Our Turn. Use `"teacher-led"` only for a Maths Our Turn containing two or more discrete questions; it renders `(a)`, `(b)`, `(c)` and restarts on that turn.
- `flipchart` (optional) — set `true` when the lesson-designer marked this criteria with the optional *draw-live (flipchart → working wall)* suggestion. Renders a small pencil in the panel's top-right corner suggesting that possibility to the teacher; nothing else on the slide changes. Applies across the `*-sc` family (`maths-turn-sc`, `maths-turn-ref-sc`, `maths-your-turn-sc`, `writing-turn-ref-sc`) — set it at the slide level beside `criteria`. Reserved for recognition/labelled references that carry forward, not procedural step lists.
- `questionVisual` (required) — a content object (clock, diagram, image, etc.) — the diagram the question is *about* (e.g. "What time is shown on this clock?", "What fraction is shaded?").
- `workingSpace` — **always pass `false`.** The template's blank annotation column defaults on; setting it off is what hands `questionVisual` the full width instead of halving it with a column nothing is ever written into. If there's no `questionVisual` either, this isn't the right template for the slide — choose the template that fits the upstream resource state; `writing-turn-ref-sc` is the Question-and-reference option.

#### `maths-turn-ref-sc`

**Purpose:** As `maths-turn-sc` but with a small **reference panel** sitting between the question and the diagram — for any modelling slide that needs a piece of given information visible while the teacher works from the diagram. Use whenever the lesson presents a fixed dataset the question stems refer back to: a price list, a results table, a recipe, a timetable, a speeds table, a survey result, a formula reference, etc.

**Slots:** `title`, `questions`, `criteria`, `criteriaLabel`, plus:
- `reference` (required) — a content object holding the given information. Typically `type: "table"` for tabular data, but accepts any class-B-compatible content (`text`, `steps`, `bullets`, `image`, `money`).
- `referenceLabel` (optional) — short label rendered at the top-left of the reference panel ("Price list", "Speeds (mph)", "Ingredients"). Omit for unlabelled references.
- `questionNumbering` (optional) — omit or use `"none"` for My Turn and ordinary non-Maths Our Turn. Use `"teacher-led"` only for a Maths Our Turn containing two or more discrete questions; it renders `(a)`, `(b)`, `(c)` and restarts on that turn.
- `questionVisual` (optional) — the diagram the question is about, same as `maths-turn-sc`.
- `hideWorkingSpace` — **always pass `true`.** Note the different key and polarity from `maths-turn-sc`'s `workingSpace: false`: this template's own flag hides the space and, doing so, expands the reference panel to fill the freed height, so the given information reads at a larger size rather than leaving a gap.

**When to choose this over `maths-turn-sc`:** if the question can stand on its own without the reference visible, use `maths-turn-sc` and embed the values in the question stem. If the question is *about* a separate dataset that children read repeatedly while solving — most SATs-style "use the price list / table to answer" problems — use `maths-turn-ref-sc`.

#### `maths-your-turn`

**Purpose:** Your Turn slide with stacked full-width question cards and no on-slide working space.

**Slots:**
- `title` (optional, defaults to "Your Turn")
- `questions` (required) - 2–4 entries. Plain strings stack as full-width cards dividing the body height equally; content objects (a clock per question) switch the whole set to a grid, one visual per cell.
- `startAt` (optional) — the number the first card is labelled with. Omit it and the cards run `(1) (2) (3)`.

#### `maths-your-turn-sc`

**Purpose:** As `maths-your-turn` but cards narrower with a full-height SC panel on the right.

**Slots:** `title`, `questions`, `criteria`, `criteriaLabel`, `questionVisual` (optional).

- `questionVisual` (optional) — a content object shown across the top of the left area, with the question cards beneath it and the SC panel down the right. Use it when the Your Turn places items onto a diagram the child must read — a Venn or Carroll, a coordinate grid, a dial — so the diagram and its labels sit on the slide where the child works, not described in words inside the success criteria. To show the shapes being placed *as pictures*, make the `questionVisual` a `stack` whose first item is a `row` of `geoboard`/`triangle` visuals (each labelled, lettered `(a) (b) (c)`) and whose second item is the `venn`/`carroll`; give the diagram the larger stack `weight`. With no `questionVisual`, the cards keep the whole left area as before.

> **Plain `maths-your-turn` (without `-sc`) has no `questionVisual` slot.** A `questionVisual` on it is silently dropped, leaving children asked to read something that isn't on the slide ("write the coordinates of point A" with no grid). Its `questions` entries can carry a visual each (the grid path above), but there is nowhere for one shared visual the whole set reads. When a Your Turn depends on a shared visual the child must read, use `maths-your-turn-sc` (above), a `body-full` carrying the visual(s) plus the questions, or a split template - not plain `maths-your-turn`.

#### `maths-turn`, `maths-mtotyt`, `maths-mtotyt-sc` — retired, do not pick these

These three always draw a blank working column with no flag to turn it off. `maths-turn` will draw a `questionVisual`, but only at half width beside the column; `maths-mtotyt` and `maths-mtotyt-sc` drop one entirely. They predate the no-working-column rule above, and there's no lesson this rule now lets them render correctly, so leave them out of every new build. For a single-stage My Turn or Our Turn, reach for `maths-turn-sc` (a full-width question visual/helper) or `writing-turn-ref-sc` (`Question and reference`) instead of plain `maths-turn`. For a combined MT+OT+YT slide, build the three turns as separate slides - there's no combined `Question and reference` equivalent to `maths-mtotyt`/`maths-mtotyt-sc`.

### 2.3 Teach family

Opinionated templates for specific teaching moves. Each shape carries meaning — use them when the shape matches what the slide is doing.

#### `teach-compare`

**Purpose:** Compare/contrast teaching move. Two labelled white cards sit side by side, with a blue border on the left and an orange border on the right. The category borders help children track which is which at a glance without turning the whole card into a coloured block.

**Slots:** `title`, `instruction`, `leftHeading`, `rightHeading`, `leftContent`, `rightContent`.

The default pairing is blue on `leftContent` and orange on `rightContent`. To carry a different established category pairing, set `categoryColor` on either content object to `blue`, `orange`, or `purple`; the heading and outer border follow it. Green is rejected because it is reserved for answers and vocabulary.

**Use for:** simile vs metaphor, right vs wrong, active vs passive, stepped vs smooth pyramids.

#### `teach-compare-with-row`

**Purpose:** Same two-card contrast as `teach-compare`, but with a row of smaller supporting items along the bottom. Use when the main teaching move is a comparison between two things (left-vs-right) *and* the slide also needs to show additional supporting examples or artefacts at reduced size.

**Example use:** Mayan stepped pyramid vs Egyptian pyramid on top (the pedagogical contrast); row of a Mayan glyph panel and a Mayan calendar fragment underneath (supporting artefacts children see but don't compare).

**Slots:**
- `title`, `instruction` (shared)
- `leftHeading`, `rightHeading` — labels above the two cards
- `leftContent`, `rightContent` — content objects inside the cards (image, text, etc.)
- `supports` — a `row` content object containing the smaller supporting items below

The two cards occupy roughly the upper 60% of the body; the `supports` row occupies the lower 40%. The left card uses a blue border and the right card uses an orange border, matching `teach-compare` so children track which is which. A `categoryColor` on either content object overrides that side in the same way.

#### `teach-annotated`

**Purpose:** Make a few free-standing observations around one central sentence or object. Up to four coloured callout cards sit in the four corners of the body, each carrying one short annotation, with the thing being discussed in the centre.

**Slots:** `title`, `instruction`, `centralContent`, `annotations` (array of up to 4 short labels).

**Use for:** deconstructing a sentence (each card names a feature: a fronted adverbial, an expanded noun phrase), poetic analysis, or a handful of points to notice about a single image. The cards read as standalone comments: they sit in the corners and do not draw a line to a particular spot, so use them where the annotation works as commentary rather than as a pointer to one exact part.

**For labelling the specific parts of a diagram** (where a child maps each name to the precise part it belongs to), use the `label-diagram` content helper (§4) instead. It draws the dot-on-the-part and the leader line out to its label, which is what makes the mapping readable and which this corner-card layout does not have.

#### `teach-sequence`

**Purpose:** A process shown as a horizontal chain of boxes with arrows between them.

**Slots:** `title`, `instruction`, `stages` (array of 2–5 short strings).

**Use for:** water cycle, digestion, story arcs, cause-and-effect chains.

#### `teach-steps`

**Purpose:** A numbered procedure (non-maths). Autofits each row independently.

**Slots:** `title`, `instruction`, `steps` (array of 3–6 strings).

**Use for:** science method, writing recipe, PE skill, DT technique.

### 2.4 Vocabulary

#### `key-vocabulary`

**Purpose:** Vocabulary reveal. 2–5 words on light-green cards, each with an optional compact visual. Card heights and font sizes scale with the word count.

**Slots:** `title` (defaults to "Key Vocabulary"), `instruction`, `words` (array of `{ word, definition, visual? }`).

**`visual` field:** An optional content object rendered in a fixed 2.2 inch column to the right of the word+definition text. Supported types are `text`, `image`, `money`, `turn-diagram`, `angle`, `triangle`, `triangle-nonexample`, `line-pair`, `geoboard`, `polygon`, `venn`, `carroll`, `rainforest-layers`, and `place-value-mini`. This is a deliberate subset of the full helper catalogue: the card panel is only 2.2 inches wide, so a full-size `clock`, `fraction-wall`, `numberline`, or `place-value-chart` is not automatically accepted. If any word in the list has a drawable `visual`, all rows get a visual column; words without one simply leave that cell empty. **Prefer built-in drawings over `image` when they carry the meaning - they require no picture sourcing and cannot become a missing-file placeholder.**

Examples:
- `{ "word": "pounds", "definition": "...", "visual": { "type": "money", "items": ["£1"] } }`
- `{ "word": "pence", "definition": "...", "visual": { "type": "money", "items": ["1p"] } }`
- `{ "word": "angle", "definition": "...", "visual": { "type": "angle", "degrees": 55 } }`
- `{ "word": "right angle", "definition": "...", "visual": { "type": "angle", "degrees": 90 } }`
- `{ "word": "digit", "definition": "...", "visual": { "type": "place-value-mini", "mode": "digit-value", "digit": 6, "value": 600 } }`
- `{ "word": "hundreds column", "definition": "...", "visual": { "type": "place-value-mini", "mode": "column", "column": "H" } }`
- `{ "word": "exchange", "definition": "...", "visual": { "type": "place-value-mini", "mode": "exchange" } }`
- `{ "word": "placeholder", "definition": "...", "visual": { "type": "place-value-mini", "mode": "placeholder", "number": "4050" } }`

`place-value-mini` is purpose-built for the small vocabulary panel. `digit-value` shows one digit mapping to its value; `column` shows Th/H/T/O and highlights the named column; `exchange` shows ten small tens counters becoming one hundreds counter; `placeholder` highlights zero cells in a short numeral. Use the full `place-value-chart` on teaching and practice slides, not inside a vocabulary card.
- `{ "word": "scalene", "definition": "...", "visual": { "type": "triangle", "kind": "scalene" } }`
- `{ "word": "equilateral", "definition": "...", "visual": { "type": "triangle", "kind": "equilateral" } }`
- `{ "word": "trapezium", "definition": "...", "visual": { "type": "geoboard", "cols": 4, "rows": 2, "shape": [[0,0],[4,0],[3,2],[1,2]] } }`
- `{ "word": "regular polygon", "definition": "...", "visual": { "type": "polygon", "shapes": [ { "name": "hexagon" } ] } }`
- `{ "word": "convert", "definition": "..." }` — no visual needed, cell stays empty

### 2.5 Success Criteria (standalone)

#### `success-criteria`

**Purpose:** Full-slide success-criteria reference. The entire body below the title is a criteria zone. Use when the criteria needs space — a large table, a detailed step list, a classification chart.

**Slots:** `title` (defaults to "Success Criteria"), `criteria` (a content object: `steps`, `table`, `bullets`, `vocab`, or `image`).

### 2.6 Specialised grids

These two templates exist because their geometry is unique and frequently needed. They're opinionated about cell size and arrangement.

#### `grid-calc`

**Purpose:** 4×3 grid of calculation cells. Each cell is a contained working space.

**Slots:** `title` (defaults to "Independent Tasks"), `instruction`, `calculations` (array, max 12 strings), `startAt` (optional — the number the first cell is labelled with; omit it and the cells run from `(1)`).

**Use for:** arithmetic practice, times tables, column-method fluency.

#### `number-sets`

**Purpose:** Row of equal boxes for ordering / sorting / comparing numbers. Box width auto-scales with count (2–8 boxes).

**Slots:** `title`, `instruction`, `numbers` (array of 2–8 strings), `prompt` (optional italic follow-up).

**Use for:** "Order from smallest to largest", sorting tasks, comparing decimals.

### 2.7 Dialogue (speech bubbles)

Three recurring class characters voice the content: **Mr Sear** (boy), **Miss Brooker** (girl), and **Bailey** (the class dog). Each speaker is a white speech bubble with a tail pointing down to a line-drawn figure and their name. These are fixed templates because the character-and-bubble arrangement carries the pedagogical move - modelling talk, sharing predictions, voicing a misconception - rather than just holding free content.

Reach for these when the slide's job is to *put words in a character's mouth*: showing how two children might reason differently, prompting partner talk, or letting Bailey ask the "silly" question a child might be afraid to ask. For plain information or a single statement, an ordinary text template reads better — the bubbles earn their place only when someone is speaking.

**Choose the variant by how many voices the lesson actually has.** One child voicing a claim, prediction, or misconception the class then tests is `speech-bubbles-1`; two contrasting views are `speech-bubbles-2`; three contributors are `speech-bubbles-3`. Render only the voices the design gives — when it has one speaker, don't add a second bubble and invent a line to fill it (a teacher asking "is she right?", a manufactured "correct view"), because the fabricated voice dilutes the one real claim children are meant to weigh. Keep every speaker a named character (Mr Sear, Miss Brooker, Bailey) or the design's named child via `name`; a bubble labelled "You" addresses the reader instead of voicing a character.

**Shared slots:** `statement` (a string, or a `text` content object — the one lead text box under the header), `speakers` (array). Each speaker takes `speech` (what they say), `name` (optional — defaults to the character's own name), and `child` (optional — `"mr-sear"`, `"miss-brooker"`, or `"bailey"`; speakers that omit it fill in the order Mr Sear → Miss Brooker → Bailey).

#### `speech-bubbles-1`

**Purpose:** A single character speaking, set beside the thing they are speaking about — the statement or shape on the left, the one speaker (bubble above figure) on the right. This is the home for a lesson that gives *one* voice, so it doesn't have to be forced into a two-bubble template with an invented second speaker.

**Use for:** one child voicing a claim, prediction, or misconception the class then tests ("Priya says this parallelogram has two lines of symmetry, so what advice would you give her?"); Bailey asking the question a child is afraid to ask; a single thought worked aloud to the class.

**Slots:** `title`, `instruction`, `statement`, `speakers` (a single-entry array), plus optional `statementRatio` (0.3–0.7 — the share the left statement takes, default 0.55). The statement reads at size on the left, so when it is a shape children judge (a geoboard parallelogram) they can actually see what is being claimed. With no `statement`, the lone speaker centres in the body.

#### `speech-bubbles-2`

**Purpose:** Two characters side by side, each with a bubble and figure. Naturally frames a contrast — two methods, two predictions, two points of view.

**Use for:** "Whose method do you agree with?", paired predictions, a right-and-wrong worked reasoning compare.

**Slots:** `title`, `instruction`, `statement`, `speakers`, plus optional `statementRatio` (0.15–0.6). The `statement` sits under the header above the two characters. A plain text statement takes a slim band; a *visual* statement (a Venn or Carroll the child must read to decide who is right) is detected automatically and given a taller band so it reads at size rather than as a thumbnail. When the contested item is a specific shape, make the `statement` a `row` of the shape beside the diagram so the child sees what is being placed, and raise `statementRatio` (e.g. `0.5`) if it needs still more room; the portraits and bubbles shrink to suit.

#### `speech-bubbles-3`

**Purpose:** Three characters across the slide, same arrangement.

**Use for:** three ideas to discuss, a think-pair-share with Bailey adding a playful prompt, gathering prior knowledge from the class.

### 2.8 Test-question starter, tall crop — `starter-question-tall`

**Purpose:** A starter built around one tall test-question image (a portrait crop from the question bank, `[PLUGIN_ROOT]/builder/assets/test-questions/`). The standard full-width starter header leaves only the body height (~4.7") below it, which shrinks a tall question past the point a child at the back can read it. This template stacks the date, LO, and heading down the left column and gives the question the slide's full height on the right, so a portrait crop renders at or above the size it appears on the real paper.

**Shape:** Left column carries the starter furniture (Date placeholder, LO, "Starter" heading) plus an optional content zone below the heading. Right side is one full-height zone for the question image.

**Slots:**
- `lo` — the learning objective text (the builder prepends "LO: ").
- `heading` — defaults to "Starter".
- `question` — the content object for the right zone, normally `{ "type": "image", "imagePath": "test-questions/<file>.png" }`. Zone class A.
- `left` — optional content object under the heading. On the question slide a short `text` prompt that states the learning action without choosing a recording surface or routine response method (for example, "Answer the question.") or nothing; on the answer slide the answer in green via the `||` marker (e.g. `{ "type": "text", "text": "||350 millilitres" }`). Zone class E-narrow.

There is no `headerStyle` on this template — it draws its own starter header in the left column. Use it only for slide 1 (and its answer twin): the shape exists to carry the lesson-opening furniture beside a tall question.

**Wide crops don't need it.** A landscape question fits under the normal starter header on `body-full` (image as `body`, `headerStyle: "starter"`) — pick by the crop's shape: clearly wider than tall → `body-full`; taller than wide, or near-square → `starter-question-tall`.

---

## 3. Free templates

Geometric. Zones are polymorphic — each accepts any content object whose class fits the zone's size.

Every free template supports `headerStyle`, `title`, `instruction`, `lo`, `heading` (the latter two used when `headerStyle` is `"starter"`).

### 3.0 Single-zone layout

#### `body-full`

**Shape:** Header + one full-width body zone.

**Zones:** `body` (class A).

**Use for:** any slide whose body is a single block of content — a long text extract, one large image, a single paragraph of teaching, a numbered list as the whole body, or a non-numerical My Turn / Your Turn (grammar, punctuation, spelling, comprehension) whose question and options, sentence, `table` or `matching` should fill the slide.

### 3.1 Two-zone splits

One template per ratio × orientation. `primarySide` picks which zone holds the larger share.

Zone names: `primary` (the larger) and `secondary` (the smaller). Each takes a content object.

| Template | Ratio | Orientation | Zones | `primarySide` options | Primary class | Secondary class |
|---|---|---|---|---|---|---|
| `split-h-50-50` | 50/50 | Horizontal | `primary`, `secondary` | `left`, `right` | C | C |
| `split-h-60-40` | 60/40 | Horizontal | `primary`, `secondary` | `left`, `right` | E-wide | E-narrow |
| `split-h-70-30` | 70/30 | Horizontal | `primary`, `secondary` | `left`, `right` | E-wide | E-narrow |
| `split-h-75-25` | 75/25 | Horizontal | `primary`, `secondary` | `left`, `right` | E-wide | G |
| `split-h-80-20` | 80/20 | Horizontal | `primary`, `secondary` | `left`, `right` | A | E-narrow |
| `split-h-90-10` | 90/10 | Horizontal | `primary`, `secondary` | `left`, `right` | A | F |
| `split-v-50-50` | 50/50 | Vertical | `primary`, `secondary` | `top`, `bottom` | C | C |
| `split-v-60-40` | 60/40 | Vertical | `primary`, `secondary` | `top`, `bottom` | E-wide | E-narrow |
| `split-v-70-30` | 70/30 | Vertical | `primary`, `secondary` | `top`, `bottom` | E-wide | E-narrow |
| `split-v-75-25` | 75/25 | Vertical | `primary`, `secondary` | `top`, `bottom` | E-wide | B |
| `split-v-80-20` | 80/20 | Vertical | `primary`, `secondary` | `top`, `bottom` | A | B |
| `split-v-90-10` | 90/10 | Vertical | `primary`, `secondary` | `top`, `bottom` | A | F |

12 templates total.

**`split-h-75-25` is the quick-check rail.** Questions in `primary`, one small reference in `secondary` — a bare `place-value-chart` heading strip, a `chip-bank` of the category words, a short `text` criteria line. See the `numbered-questions` entry in §4 for what the rail may and may not carry.

### 3.2 Three- and four-zone layouts

| Template | Shape | Zones | Classes |
|---|---|---|---|
| `thirds-h` | Three equal horizontal columns | `left`, `middle`, `right` | all D |
| `thirds-v` | Three equal vertical rows | `top`, `middle`, `bottom` | all B |
| `centre-big-h` | 25/50/25 horizontal | `left`, `centre`, `right` | G / E-wide / G |
| `centre-big-v` | 22/50/25 vertical | `top`, `centre`, `bottom` | B / A / B |
| `quad-v` | 10/45/15/30 vertical four-strip | `top`, `centre`, `lower`, `bottom` | B / A / B / B |
| `side-big-h` | 50/25/25 horizontal (`primarySide` picks which side is big) | `primary`, `secondary1`, `secondary2` | C / G / G |
| `side-big-v` | 50/25/25 vertical (`primarySide` picks top/bottom) | `primary`, `secondary1`, `secondary2` | A / B / B |
| `sandwich-v` | Thin top strip + tall middle + thin bottom strip | `top`, `middle`, `bottom` | F / A / F |

**`quad-v` use case:** designed for maths modelling slides (My Turn / Our Turn) that need four pieces stacked: question, abstract diagram (e.g. two part-whole models in a `row`), concrete reference (e.g. coin row), and success-criteria steps. The bottom strip is sized for ~5 step rows at intended typography. Centre is class A so it accepts large visual tools.

### 3.3 Grid layouts

| Template | Shape | Zones | Classes |
|---|---|---|---|
| `grid-4` | 2×2 equal cells | `cells` (array of 4) | all G |
| `grid-6` | 3×2 equal cells | `cells` (array of 6) | all G |
| `banner-grid-6` | Banner on top + 3×2 grid below | `banner`, `cells` (array of 6) | B / 6×G |

### 3.4 Composition layouts

Distinct arrangements that don't reduce to a ratio.

#### `central-callouts-4`

**Shape:** Central zone with up to 4 callout boxes arranged around it (top-left, top-right, bottom-left, bottom-right).

**Zones:** `centre` (E-wide), `callouts` (array of up to 4, class G each; pass `null` for a gap position).

#### `task-scaffold`

**Shape:** One big task zone on top + two smaller scaffold zones below side-by-side.

**Zones:** `task` (A), `scaffoldLeft` (G), `scaffoldRight` (G).

**Use for:** an activity with a vocabulary support box and a sentence-starter box alongside.

#### `body-sidebar`

**Shape:** Left side has a short banner + big body; right side is a full-height sidebar.

**Zones:** `banner` (B), `body` (E-wide), `sidebar` (E-narrow).

**Use for:** reading passage + questions + vocabulary reference (three things, all needed, sidebar is reference-only).

#### `flanked-split`

**Shape:** Full-height left column + middle column split top/bottom + full-height right column.

**Zones:** `left` (E-narrow), `middleTop` (G), `middleBottom` (G), `right` (E-narrow).

**Use for:** a compare-and-contrast where each side needs both a reference and an example.

#### `cards-and-bars`

**Shape:** Three tall cards on top + three short bars below (6 zones).

**Zones:** `cards` (array of 3, C each), `bars` (array of 3, F each).

**Use for:** three options / methods / examples with a short caption or instruction under each.

---

## 4. Content object catalogue

Details on how to fill each content-object type. These are the ingredients that go in every template's zones.

**Optional context pictures:** `text`, `numbered-questions`, and
`question-cards` accept the `picture` request shape in
`context-pictures.md`. The builder uses a completed local Educational SVG PNG when one
exists, otherwise a suitable emoji fallback, otherwise no picture on that item.
The helper keeps the chosen question font and drops only the pictures that would
make their words smaller or the complete set cramped. A picture may shorten its
own text column and add a line when the full set still fits at that same font.

**Optional `categoryColor` on a category container:** use `blue`, `orange`, or `purple` only when parallel categories are the teaching structure. The builder draws that colour as the border of the ordinary white card. A `row` or `stack` with this field becomes one category container instead of passing separate cards to its children. Repeat the same value when the category returns elsewhere on the slide, including a hint bar. Green and unknown values fail validation. Do not put the field on `question-cards`, `numbered-questions`, `steps`, `chip-bank`, `callout`, or another helper that draws its own surface; wrap a genuine category block in a `row` or `stack` instead. Ordinary lists remain plain.

**Presentation-only text roles:** `colorRole` and `emphasis` change presentation only. They never change, remove, reorder or paraphrase source wording.

`colorRole` is one of:

- `default` - existing base colour;
- `focus-blue` - one focal thinking question in house blue;
- `peer-blue` - house blue for one item in a compact equal-status peer set;
- `peer-purple` - house purple for one item in a compact equal-status peer set.

Use `peer-blue` / `peer-purple` only to separate a compact set of equal-status peer prompts.

`emphasis` is an array of exact substring-role pairs:

```json
{
  "type": "text",
  "value": "Build a circuit with one cell. If it does not work, repair it.",
  "emphasis": [
    { "text": "Build a circuit", "role": "core-action" },
    { "text": "one cell", "role": "required-material" },
    { "text": "If it does not work", "role": "problem-state" }
  ]
}
```

Supported roles are:

- `core-action` - bold house blue for the survival phrase;
- `task-action` - bold house blue for an existing action verb or short action phrase inside a multi-phase task;
- `required-material` - bold single underline;
- `response-demand` - bold single underline;
- `reasoning-demand` - bold single underline;
- `problem-state` - bold problem red for a failed/wrong state;
- `safety-warning` - bold problem red for exact source-authored safety wording;
- `vocabulary` - bold vocabulary green.

Every `emphasis[].text` must occur exactly once in the visible source string and emphasis ranges must not overlap. Do not combine `emphasis` with the legacy `||`, `**`, `[[ ]]`, `{{ }}` or `<< >>` markers in the same string.

These fields are supported on `text`, on object entries inside `bullets`, `numbered-questions` and `question-cards`, and on object entries inside fixed-template `questions` arrays.

### `text`

`heightMode` is optional:

- omit it or use `"hug"` for the normal content-hugging text card;
- use `"fill"` when a short answer/reference is deliberately paired with a taller neighbouring visual and should occupy the full height of its assigned zone.

`fill` is an alignment treatment, not a way to create empty cards around ordinary prose. Use it only when the larger shared span improves a real paired relationship.

Short `text` in an `E-narrow` zone may now grow to a 28pt ceiling and shrink only when the wording needs less.

```json
{ "type": "text", "value": "A fronted adverbial goes at the start of a sentence." }
```

A short text block with comfortable spare width may carry one relevant picture:

```json
{ "type": "text",
  "value": "A candle is lit during the baptism.",
  "picture": {
    "kind": "educational-svg",
    "concept": "lit candle",
    "context": "A plain candle lit during a baptism",
    "avoid": ["birthday cake", "scented jar"],
    "fallbackEmoji": "🕯️"
  } }
```

The picture is omitted automatically when reserving its slot would add a line
of text. It is not a way to place free decoration on an empty part of a slide.

**Paragraph breaks:** a double newline (`\n\n`) inside `value` is a paragraph break and must render with a visible paragraph-sized vertical space between the parts. A single newline (`\n`) is a soft line break with no extra spacing. This matters when a single text block carries multiple discrete items (e.g. two sentence stems, a label followed by a stem) — children should see them as separated, not crammed together.

When two items are genuinely separate pieces of content (especially different types, e.g. a text label above a table), prefer a `stack` of content objects instead. `stack` items always render with visible vertical spacing between them; `\n\n` is for within-one-text-block paragraph breaks.

**Optional `color`:** pass a hex colour (no `#`) to tint the text when the text has a deck role such as the blue question/focus or orange supplied material. Category identity belongs on the container through `categoryColor`, not on the words. Defaults to body black when omitted.

Green answer text is not an ordinary emphasis option. Do not set text `color` to `00B050` and do not use `||`, `{{green}}` or `{{answer-green}}` on a teaching slide. Prepared examples and `visible-in-unit` models remain body black. Use answer green only on an answer/reveal slide. Vocabulary and success criteria keep their established green treatments.

```json
{ "type": "text", "value": "What we see.", "color": "0070C0" }
```

**Optional `align`:** `"left"` is the unchanged default. Use `"center"` or `"right"` only when the text's role and surrounding geometry require it.

**Optional `widthMode`:** omit it for the unchanged full-width text card. Use `"content"` for a short statement whose card should hug its written width.

**Optional `placement`:** used with `widthMode: "content"`. Choose `"left"`, `"center"` or `"right"`. The default is `"left"`.

```json
{ "type": "text",
  "value": "Some appliances do more than one.",
  "fontSize": 28,
  "widthMode": "content",
  "placement": "center",
  "align": "center" }
```

### `bullets`
```json
{ "type": "bullets", "items": ["Point 1", "Point 2", "Point 3"] }
```

**Markers:** items get native PowerPoint disc bullets. When an item already begins with its own marker, the helper suppresses the disc for that item so it doesn't read as two markers — this covers a leading emoji/pictograph *and* a typed enumerator (`A) …`, `(a) …`, `1. …`), so a tick-one option list renders as `A) …` rather than `• A) …`. Mixed lists (some prefixed, some not) render the plain ones with discs, which gives a visually inconsistent column; keep lists internally consistent.

**Sizing:** bullets size dynamically to fill the zone — the font is chosen from the available per-row height and clamped between 14pt and 36pt, so a short list in a tall zone reads at a comfortable size rather than clustering at the top with whitespace below. Long lists in shallow zones still trigger shrink-to-fit as a safety net.

**When to reach for `text` instead:** if the items are full sentences carrying reasoning, narrative, or contrast, use a `text` block (or a `stack` of `text` items) with paragraph breaks. Bullets are for short, parallel labels children scan; sentences belong in flowing prose.

**Minimum useful size:** ~0.35″ per row at the floor size (14pt). 6 short bullets render comfortably in any zone of ~2″+ height; below that the floor kicks in and longer items wrap.

### `steps`
```json
{ "type": "steps", "steps": ["Read the question.", "Underline the key information.", "Solve."] }
```

A step is normally a string. A success-criteria step that names a visible notation mark may use `{ "text": "...", "helper": "<catalogue-key>" }` so the engine draws a **Success Criteria Helper** beside the unchanged wording. Existing JSON using `figure` remains valid, but new lessons use `helper`. The shared catalogue, size support (`full-size`, `SC-inline`, or `both`), and strict boundary live in `slide-success-criteria.md`; do not invent keys or use this object form for decorative pictures.

**Optional `heading`** — a short label rendered directly above the first step, hugging the list rather than floating above it. Use it to title a step list inside a free-template zone — e.g. `"heading": "✓ Success Criteria"` over a criteria panel — so the label reads as part of the list. `headingColor` (hex, e.g. `"0070C0"`) and `headingFontSize` are optional. Prefer this over a `stack` of `[ text-label, steps ]`: a two-item stack splits the zone into equal halves and centres each, which strands a one-line label in the middle of its half, far from the steps it names.

**Minimum useful size:** ~0.4–0.5″ per row at intended typography (each row carries a numbered badge plus 18pt bold text). 5 steps needs ~2.0–2.5″ of zone height. The bottom strip of `centre-big-v` (~1.66″) cannot hold 5 steps at full size — for SC of 4+ steps, use a template with a dedicated SC panel (`maths-turn-sc`).

### `vocab`
```json
{ "type": "vocab", "words": [
  { "word": "evaporation", "definition": "water turning into vapour" },
  { "word": "condensation", "definition": "vapour turning back into water" }
] }
```

### `image`
```json
{ "type": "image", "imagePath": "C:/path/to/photo.jpg", "caption": "Optional italic caption" }
```

With an optional inset — a smaller second image overlaid in one corner. Use for the "big photo with small photo tucked in the corner" pattern.

```json
{ "type": "image",
  "imagePath": "unsplash/slide-5-tikal.jpg",
  "caption": "The Mayan city of Tikal",
  "inset": {
    "imagePath": "unsplash/slide-5-maya-family.jpg",
    "caption": "A present-day Maya family in Guatemala",
    "position": "bottom-right"
  } }
```

The inset is drawn at roughly 25% of the big image's width, with a thin white border for contrast. `position` accepts `"top-left"`, `"top-right"`, `"bottom-left"`, `"bottom-right"`. Each image (main and inset) needs its own photo brief and its own expected filename.

**Fit (default `contain`):** images preserve their natural aspect ratio inside the zone, centred, with the slide background showing through any letterbox bands. Use this when the full photograph or visible evidence must survive. To fill the zone, pass `"fit": "cover"`. Cover preserves natural proportions and removes equal overflow from opposite sides with a centred crop. It never stretches. Use cover only when that crop cannot remove required evidence. Insets use the same true cover crop regardless of the parent. If a real image cannot be measured, the build stops with `IMAGE_DIMENSIONS_UNAVAILABLE` instead of stretching it.

### `table`
```json
{ "type": "table",
  "headers": ["Group", "Body covering", "Babies"],
  "rows": [
    ["Mammals", "Fur / hair", "Born live; fed milk"],
    ["Birds",   "Feathers",   "Hatched from eggs"]
  ] }
```

**Minimum useful size:** 5.5″ wide for a table with sentence-length cells (empirically tested) — below this, multi-word cells either wrap awkwardly or drop below readable font size. For digit-only or short-keyword cells the floor is closer to 3.0″ wide. Row height needs ~0.4″ per row. A 3-column × 3-row sentence-cell table only fits cleanly in E-wide or wider zones.

**Shared maximum fit:** headers share one maximum safe size. Each body column has its own shared maximum safe size because cells in one column have one visual role. The builder tests every whole-point size up to the column ceiling, selects the largest size that fits every cell in that column, and applies it to all of them. It does not enlarge cells, split one word across lines or use a different size for each row.

**Inline emphasis in cells.** Body cells accept the inline markers (`**bold**`, `[[focus-blue]]`, `{{answer-green}}`, `<<supplied-orange>>`) and `\n` line breaks — see the slide-designer's answer-format guidance for each. The common use is `[[ ]]` on the deciding word of a branch/lookup table (the word that changes row to row), so a child's eye lands on it rather than reading every word at equal weight. `<<x>>` tints a supplied/given value orange — a figure the question hands the child to work from, as distinct from the answer (`||`/`{{ }}`, green). Green answer markers are allowed only on answer/reveal slides. A completed prepared example or `visible-in-unit` model uses ordinary black text.

### `mult-grid`

The multiplication-facts grid — the SATs "write the missing numbers in this multiplication grid" shape. An operator corner box, column headers along the top, row headers down the left, product cells in the body, drawn as large square cells so the numbers read from the back of the room. Reach for this whenever the lesson shows a times-tables grid; the generic `table` makes the numbers small and hides the `×` in a styled strip, so it reads as a data table rather than the puzzle children meet on the paper.

```json
{ "type": "mult-grid",
  "corner": "×",
  "colHeaders": ["9", "6", ""],
  "rowHeaders": ["3", "8", "6"],
  "cells": [
    ["",   "18", "21"],
    ["72", "",   "56"],
    ["54", "36", "42"]
  ] }
```

- `colHeaders` — values across the top, left-to-right (the corner is added automatically). `""` leaves an empty header box; a missing header is the harder, inverse-reasoning variant (the child divides a known product to find it).
- `rowHeaders` — values down the left side, top-to-bottom.
- `cells` — products row-major: `cells[r][c]` sits at row `r`, column `c`. `""` is an empty box — a gap to find.
- `corner` — optional, defaults to `"×"`.
- **Answers reveal in the grid, in green.** On the answer slide, fill the previously-empty cells (and any missing header) with the `||` marker — `"||21"`, `"||7"` — and they render green right inside the grid while the givens stay black. No separate answer list is needed; the completed grid *is* the reveal.
- **Match the paper's scale.** If the question being recreated is a 3×3 grid, build a 3×3 grid — shrinking it to 2×2 changes the task. The grid sizes its own cells; give it a class-A, class-C, or E-wide zone and set `workingSpace: false` on the template so it gets the full width (see the working-space note under `maths-turn-sc`).

### `matching`

A "draw a line to match" layout — two columns of boxes joined by straight connector lines. The classic starter where children match each item on the left to its partner on the right (numbers to their rounding, words to definitions, sums to answers). On the question slide one example pair is joined to show what to do; the rest are left blank for children to draw. On the answer slide every pair is joined, in green.

```json
{ "type": "matching",
  "left":  ["47", "62", "28", "81", "34", "76"],
  "right": ["30", "50", "80", "60", "40", "70"],
  "connections": [[0, 1]] }
```

- `left` / `right` — the box labels in each column, top-to-bottom. The two columns can hold different counts, and `right` may carry distractors that match nothing (here `40` and `70`), so children round each number rather than pairing by elimination.
- `connections` — pairs of `[leftIndex, rightIndex]` (0-based) to join with a line. On the question slide pass just the worked example; on the answer slide pass every correct pair and add `"answer": true` to draw the lines in green.
- `answer` — optional; `true` colours the connector lines green for the reveal.
- Fits a class-A body comfortably (the starter's whole body). Give it room — six pairs need most of a full-width body to keep the boxes and lines clear.

### `numberline`
```json
{ "type": "numberline",
  "start": 0, "end": 20, "interval": 2, "labels": [0, 2, 18, 20],
  "arrow":  { "at": 8, "label": "?" },
  "answer": { "at": 8, "text": "8" } }
```

Multiple stacked lines, each with its own scale:
```json
{ "type": "numberline",
  "lines": [
    { "start": 0, "end": 50,  "interval": 5,  "labels": [0, 5, 45, 50], "arrow": { "at": 35, "label": "?" } },
    { "start": 0, "end": 100, "interval": 10, "labels": [0, 10, 90, 100], "arrow": { "at": 70, "label": "?" } }
  ] }
```

**`labels` — choose which tick values are printed, because on a scale-reading task the labels are part of what the child works out.** Three forms: an explicit array like `[0, 2, 18, 20]` prints only those values; `"ends"` (the default) prints just the start and end; `"all"` prints every tick. When reading the scale is the skill (a starter retrieving "check what each step is worth", an arrow to read off), give a few anchor values so the interval can be deduced and leave the ticks between them bare, so the child counts on rather than reading a printed number off the tick. Reach for `"all"` only when the tick numbers are not themselves what's being worked out and showing them all genuinely helps: a deliberately easy first line, or a line used only to point at a position whose value is already given. This is the "Cognitive Load Triage on Scaffolds" principle in `preferences.md` applied to a scale: the scale is the part the child operates on, so it stays partly blank.

**Minimum useful size:** 3.5″ wide × ~1.2″ tall per single line (empirically tested). Below 3.5″ the tick labels overlap and intervals stop reading clearly. Stacked lines add ~1.0″ per extra line, so a starter reading is clearest at around three lines rather than five: past that the zone scales every line down and the numbers crowd.

### `place-value-chart`
```json
{ "type": "place-value-chart",
  "columns": ["Th", "H", "T", "O", ".", "t", "h"],
  "rows": [
    ["3", "4", "5", "6", null, "7", "8"],
    ["",  "",  "",  "",  null, "",  ""]
  ] }
```

Supported columns: `M`, `HTh`, `TTh`, `Th`, `H`, `T`, `O`, `.`, `t`, `h`, `th`.

**A bare heading strip — `"rows": []`.** An explicitly empty `rows` array draws the headings on their own, with no cells beneath: the `Th | H | T | O` strip a quick check puts in its side rail so children have the column names to answer with. It sits at the top of its zone rather than centred, because a reference belongs where the eye lands first.

```json
{ "type": "place-value-chart", "columns": ["Th", "H", "T", "O"], "rows": [] }
```

Leaving `rows` out altogether is a different thing and is unchanged: it draws the headings plus one blank row, a blank helper available for live completion. Choose by whether a blank row is genuinely part of the selected resource state — in a reference rail, a blank row reads as answer space and invites children to write in it.

**A row can be an object instead of a bare array, and then it can say what it is and which digit matters.** Both forms mix freely in one chart, and a chart written the old way draws exactly as it always did.

```json
{ "type": "place-value-chart",
  "columns": ["Th", "H", "T", "O"],
  "rows": [
    { "label": "3,462",    "cells": ["3", "4", "6", "2"] },
    { "label": "10 more",  "cells": ["3", "4", "7", "2"], "highlight": ["T"] },
    { "label": "100 more", "cells": ["3", "5", "6", "2"], "highlight": ["H"] }
  ] }
```

- `label` — a short caption in a column at the left of the row, naming what the row is. Three rows of digits with nothing saying how they relate is a picture a child cannot read; "3,462", "10 more", "100 more" makes it one.
- `highlight` — which cell(s) of that row to pick out, named by their column (`["T"]`, or several: `["H", "T"]`). A position works too (`[2]`), but the column name is what a designer means. The cell keeps its column colour and gains a thick green ring with the digit in green, so "which column changed" reads from the back of the room while the column coding still holds.
- `counters` — optional populations keyed by column, for example `{ "Th": 3, "H": 4, "T": 6, "O": 2 }`. The helper draws that many equal place-value counters inside each named column and keeps the written `cells` as a separate digit row underneath. A zero counter population is empty but a `"0"` in `cells` remains visibly written, so the placeholder stays aligned. Omit `counters` to fade to the original compact digit-only chart.

**Reach for `highlight` whenever the lesson is about which column changes** — 10/100/1000 more and less, exchanging, rounding, multiplying and dividing by 10. In those lessons the changed digit IS the learning, and a chart that only shows two numbers side by side leaves the child to spot it. Leave `highlight` off when the chart is a blank helper for live completion, or when the whole number is what's being read.

**Before and after — the `pair` field.** Stacked rows show two end states; what they never show is the change itself, so on a teach or modelling slide all the movement ends up in the teacher's voice and finger. `pair` draws the movement instead: the starting chart, a bold arrow carrying the operation, and the result chart with the changed digit in green, each unchanged column saying "same" beneath it in that column's own colour, all under a title bar stating the operation and its result.

```json
{ "type": "place-value-chart",
  "columns": ["Th", "H", "T", "O"],
  "pair": {
    "from": ["0", "8", "9", "0"],
    "to":   ["0", "9", "0", "0"],
    "operation": "+ 10",
    "counters": {
      "from": { "Th": 0, "H": 8, "T": 9, "O": 0 },
      "to":   { "Th": 0, "H": 9, "T": 0, "O": 0 }
    },
    "exchanges": [
      { "from": "T", "to": "H", "count": 10,
        "label": "10 tens = 1 hundred" }
    ]
  } }
```

- `from` / `to` — the two numbers, one cell per column, same shape as a `rows` entry's `cells`. **Which column changed is worked out by comparing them**, so the green digit can never mark a column that did not move, and an exchange that shifts two columns (3,497 → 3,507) marks both without being told to.
- `operation` — the words that go on the arrow, in the lesson's own language: `"10 more"`, `"+ 10"`, `"100 less"`, `"× 10"`.
- `title` — optional. Left out, the title bar reads `operation: result` with the result read straight off the `to` cells ("10 more: 3,472"), so the bar and the chart cannot disagree. Give a string to write it yourself ("24,306 + 10,000 = 34,306"); give `""` for no title bar.
- `counters` — optional `{ "from": { ... }, "to": { ... } }` populations, using the same column-keyed shape as row counters. The before and after charts each show their own counters, so 100-more is always calculated from its stated starting number rather than from another comparison.
- `exchanges` — optional array of movement cues. Each cue has `from` and `to` column names, optional `count` (default `10`), and optional `label` (derived when left out). The cue visibly draws ten equal source counters exchanging into one counter in the next column; reverse the column names to show partitioning one larger counter into ten smaller counters. Use an array because a cascade such as 1,990 → 2,000 needs two cues: `[{ "from": "T", "to": "H" }, { "from": "H", "to": "Th" }]`. A single object may be supplied as `exchange` for the one-cue case.

`pair` replaces `rows` — a chart with both draws the pair. Everything else about the chart is unchanged, decimal columns included: the `.` column carries the point and never says "same", because it is not a digit.

For a compact digit-only boundary question, omit `counters`, give `to` one empty string per column, and use `"title": ""` if the question already supplies its own heading. Empty unknown cells are not ringed; written zeroes in completed answers are.

**One pair is one comparison, always.** Two comparisons that share a starting number (10 more *and* 100 more of 3,462) are **two separate pairs**, never a chain of three charts: a chain of arrows says the third state grew out of the second, which did not happen and which a class will faithfully learn. Put the two pairs in the two zones of a `split-v-50-50`, or on two slides. Sequence gets a chain; comparison gets pairs. This helper only ever draws a pair — composing them is yours.

**Minimum useful size:** the stacked-row chart is very tolerant — a 4-column chart reads clearly down to ~2.0″ wide (empirically tested). A digit-only `pair` needs roughly twice the width for the same cell size, so give it ~5″ × ~2.5″ or more; below about 4″ wide the two charts and the arrow between them start to crowd. A counter pair with an exchange cue needs roughly 7″ × 3.5″; use a full-width body zone where possible. The helper auto-scales column widths and font size to fit. Wider columns are still preferable for sentence-length headers; the floor is for digit-only cell content.

### `fraction-wall`
```json
{ "type": "fraction-wall", "fractions": [1, 2, 3, 4, 6, 8] }
```

**Minimum useful size:** ~5″ wide × ~2″ tall for a 6-row wall. Each extra fraction row adds ~0.3″ of height. Below ~4″ wide, the smaller fractions become unreadable.

### `part-whole-model`

One whole circle on the left, connected by lines to 2 or 3 part circles stacked on the right. The builder draws the circles and lines from the data — no photo brief needed. Supports a vertical orientation (whole on top, parts spread below) via `"orientation": "vertical"`.

Lines touch each circle at their own separate edge point so they never converge at a single anchor on the whole.

Two parts (standard):
```json
{ "type": "part-whole-model",
  "whole": "45",
  "parts": ["27", "18"] }
```

With an unknown:
```json
{ "type": "part-whole-model",
  "whole": "?",
  "parts": ["27", "18"] }
```

Three parts, vertical orientation:
```json
{ "type": "part-whole-model",
  "orientation": "vertical",
  "whole": "60",
  "parts": ["20", "?", "15"] }
```

Words and labels work in any circle — the builder renders whatever string is supplied.

**Blank for live completion.** On modelling slides (My Turn, Our Turn) where the partition is modelled live — leave the circles **blank** by passing empty strings:

```json
{ "type": "part-whole-model",
  "orientation": "vertical",
  "whole": "",
  "parts": ["", ""] }
```

The builder draws empty circles connected by lines — a ready-to-fill diagram, not a finished answer. Children see the partition constructed during the model rather than reading a reveal. Use `?` (the unknown marker) only when the lesson genuinely has an unknown to be solved (a part-whole problem); use `""` for the modelling case.

**Minimum useful size:** 1.4″ × 1.4″ per single model (empirically tested). Smaller than this and the part-circle labels stop reading clearly. When two models sit side-by-side as a `row`, each gets half the zone width — so the parent zone needs ~3.0″ wide × 1.4″ tall minimum to host a pair. Stacking two PWMs vertically halves the height available to each, which crushes the circles — use a `row` instead.

### `triangle-square`

The "two triangles add up to the number in the square" part-whole puzzle, drawn in the exact notation children meet on their paper: two upward-pointing triangles stacked on the left, each holding a number low in its body, with a line from each running right to an arrowhead that points into a square holding the whole. Use this — not `part-whole-model` — whenever the lesson recreates that paper question type. (`part-whole-model`'s circle-and-line diagram is for teaching the part/whole *concept*, e.g. the vocabulary cards; `triangle-square` is for practising the paper's question format.)

Two triangles given, square is the unknown (an **add** puzzle — add the two triangles to find the whole):
```json
{ "type": "triangle-square",
  "triangles": ["2453", "1372"],
  "square": "" }
```

Square and one triangle given, the other triangle is the unknown (a **subtract** puzzle — subtract the known triangle from the square):
```json
{ "type": "triangle-square",
  "triangles": ["1640", ""],
  "square": "4200" }
```

Leave **exactly one** of the three shapes as `""` — that is the shape the child fills in. For a fully blank diagram intended for live completion during modelling, pass `"triangles": ["", ""]` and `"square": ""`. Numbers of any length render; the label shrinks to fit.

Zone class compatibility: fits A, B, C, D, E-wide, E-narrow.

**Minimum useful size:** ~2.0″ × 2.0″ for a single diagram so the two triangles and square all read clearly. When several sit side by side on a Your Turn, host them in a `row` of `D`/`B` zones, or use one diagram per zone in a grid.

### `numbered-questions`

A vertical stack of question cards, each with a blue `(1) (2) (3)` label down the left. Use only on starter and main independent work slides — typically dropped into a `body-full` zone. Takes an optional `startAt` (the number the first card is labelled with); omit it and the cards run from `(1)`.

```json
{ "type": "numbered-questions",
  "questions": [
    "What is half of 24?",
    "What is half of 36?",
    "Find half of 48 and explain how you know."
  ] }
```

Question text is plain — never prepend `(1)`, `(a)` or any other label. The card adds the number itself. If a label slips in, the renderer strips it.

For a contextual picture beside an item, replace that string with
`{ "text": "...", "picture": { ... } }`. Follow `context-pictures.md`. Items
without a request keep the ordinary text layout with no empty picture slot.
The picture sits between the number and the words so the child meets the
context before reading when an answer box occupies the far right. The number
is aligned against the picture so their visible gap stays small rather than
being set by an invisible label box. Without an answer
box, the builder puts the picture at the right-hand end of that row instead, so
the number and wording start together. Longer wording may wrap beside the
picture, but the builder keeps the chosen font and accepts the picture only
when the complete stack still fits comfortably.

Set `"answerBoxes": true` when each row needs one fixed answer cue at the right.
On the question slide, write only the prompt. On its answer slide, keep the same
prompt and add the normal `||` reveal value. The box stays in the same place: it
is a generous rounded square with a white fill, green outline and soft shadow
before the reveal. The answer slide keeps that same white box and prints the
answer in green, so the task structure stays quiet while the answer remains
easy to spot. Its size follows the row height, and it sits close to the card's
right edge, so it reads as a real answer space rather than a thin label.

```json
{ "type": "numbered-questions",
  "answerBoxes": true,
  "questions": [
    { "text": "A robin ate 3 of 8 worms.",
      "picture": { "kind": "emoji", "value": "🐦", "alt": "robin" } },
    { "text": "A television costs £240." ,
      "picture": { "kind": "emoji", "value": "📺", "alt": "television" } }
  ] }
```

**The cards are sized by the questions, not by the zone.** Each card's height comes from how many lines its own question wraps onto, the cards share one width (the widest question's), and the type grows until the stack fills the height it has been given. So three short questions on a full body zone come out large, in three tight boxes, with the leftover room reading as margin — you do not need to pick a smaller zone to stop them stretching, and you should not add filler to make them look full. **The empty space beside a short question is not answer space**: nothing is meant to be written on the slide, and a box widened to suggest otherwise is the fault this sizing exists to prevent.

**The quick-check rail — questions with a small reference beside them.** When a check asks children to *produce or name* something (write the column that changes, name the shape family), the words they answer with have to be somewhere on screen, or the task tests recall of the vocabulary rather than the thing being checked. Use `split-h-75-25`: the questions in `primary`, one small reference in `secondary`.

```json
{ "template": "split-h-75-25",
  "title": "Which column changes?",
  "instruction": "Write only the name of the column that changes",
  "primary": { "type": "stack",
    "items": [
      { "type": "text", "value": "10 more than 3,462" },
      { "type": "text", "value": "100 more than 3,462" },
      { "type": "text", "value": "10 more than 3,497" }
    ] },
  "secondary": { "type": "place-value-chart", "columns": ["Th", "H", "T", "O"], "rows": [] } }
```

For a smaller check between teaching steps, make `primary` an unnumbered `stack` or `row` and omit `questionNumbering`. Use `numbered-questions` in this rail only when it belongs to a starter or main independent task.

What the rail may hold: a bare `place-value-chart` heading strip (`rows: []`), a `chip-bank` of the category or vocabulary words, a short `text` criteria line. One reference, not a panel of them.

**The rail carries the words a child answers WITH, never the answer.** A heading strip, the category names, a criteria line — those give a child the language and leave the thinking to them. A worked example or a filled-in chart does the thinking, and the check stops checking. That boundary is the whole reason the rail is narrow: it is not a second content zone, and anything that needs more room than a strip is not rail material.

Zone class compatibility: fits A, B, C, D, E-wide, E-narrow. Too compact for F or G.

**Minimum useful size:** ~0.6″ per question card tall × any reasonable width. 5 questions needs ~3.0″ of zone height. There is no upper limit to worry about — a set given more room than it needs grows into it rather than stretching.

For a set of SHORT questions, `question-cards` below is the other way to present the same set — read that entry before choosing.

### `question-cards`

**A second way to present a question set, beside `numbered-questions`.** The same questions, but each on its own plain white card with the shared soft shadow. Each carries a blue number badge on its corner and sits at a degree or two of tilt so the set reads as placed rather than gridded. The cards pack across the zone and wrap, and the type grows until the set fills the height it is given. The cards do not take category colours because an ordinary question list is not a set of categories.

Use `question-cards` only for a starter or main independent question set. Do not use it for a Do beat, quick check or another smaller task between teaching steps because every card carries a number badge.

```json
{ "type": "question-cards",
  "questions": ["6 × 7", "9 × 4", "8 × 8", "7 × 3", "5 × 6"] }
```

Fields:
- `questions` - the questions, in order, as plain strings, or as
  `{ "text": "...", "picture": { ... } }` objects for individual questions
  with optional context pictures. Never prepend `(1)` or `(a)`; the card draws its
  own badge, and a typed label is stripped.
- `answerBoxes` - optional boolean. When true, each card carries one fixed
  answer box. Use `||answer` on the answer slide to fill it green without moving
  it.

Answer reveals work exactly as they do in a list: `"6 × 7 = ||42"` prints the answer in green, so a question slide and its answer slide can use the same helper. The inline colour markers (`**bold**`, `[[blue]]`, `{{green}}`, `<<orange>>`) all work inside a card too, but `{{green}}` is reserved for an answer/reveal slide. Prepared teaching models stay black.

**Which of the two a set belongs in.** Both helpers are restricted to a starter or the lesson's main independent work. Within those permitted stages, use `numbered-questions` as the default. Use `question-cards` only when the set has about five or fewer short questions and the placed-card treatment makes those short prompts use the available space more clearly. A sentence-length or multi-sentence question belongs in `numbered-questions`. A Do beat, quick check, discussion question, My Turn or other smaller task uses an unnumbered composition instead of either numbered helper.

Zone class compatibility: fits A, B, C, D, E-wide, E-narrow. Too compact for F or G.

**Minimum useful size:** ~2.0″ wide × ~1.2″ tall for a couple of cards; a five-card set reads best given ~4″ × ~2.5″ or more, where it wraps into two rows and the type grows.

### `clock`

An analogue clock face rendered at high resolution. The builder pre-renders the SVG into a PNG before the slide loop, so the draw step is fast and synchronous.

Clock with hands — use on My Turn and Our Turn slides to show a specific time:
```json
{ "type": "clock", "time": "3:20" }
```

Blank face — use on Your Turn and Apply slides where children draw the hands themselves:
```json
{ "type": "clock", "hands": false }
```

With a label below — adds a short caption beneath the clock (useful on answer slides):
```json
{ "type": "clock", "time": "8:50", "label": "10 to 9 (8:50)" }
```

Multiple clocks in a row — the standard pattern for a Your Turn slide with several times to read:
```json
{ "type": "row", "items": [
  { "type": "clock", "time": "2:15" },
  { "type": "clock", "time": "7:40" },
  { "type": "clock", "time": "11:55" }
] }
```

**`hands` field (default `true`):** `true` draws hour and minute hands at the given time. `false` draws a blank face with numbers and tick marks only — no hands. Use `false` whenever children are expected to draw or write the time rather than read it.

**`time` field:** Required when `hands: true`. Format `"H:MM"` (no leading zero on the hour). The builder calculates hand angles correctly, including the hour hand's fractional position as it moves between hours — e.g., at 3:30 the hour hand sits halfway between 3 and 4.

**`label` field (optional):** A short string rendered below the clock in body typography. Good for answer-slide reveals where you want the clock face and the written time on the same slide.

Zone class compatibility: fits A, B, C, D, E-wide, E-narrow, G. The clock renders as a square — it centres inside whatever rectangle it is given and scales to fit the smaller dimension.

**Minimum useful size:** 2.0″ × 2.0″ for the clock face to be readable from across the classroom (empirically tested). Below 2″ the hour numerals start to drop below readable size. In a `row` of 3 clocks each column needs ~2.0″ width minimum — so the parent zone needs ~6.0″+ wide. A `row` of 4 needs ~8.0″+, a `row` of 6 needs ~12.0″+.

### `turn-diagram`

An "angle as a turn" diagram: two black rays meeting at a vertex with a red curved arrow sweeping from the start ray to the end ray. The start ray always points straight up; the end ray is the start rotated by the turn. Like the clock, the builder pre-renders the SVG into a PNG before the slide loop, so the draw step is fast and synchronous.

Use this for the part of an angles-as-turns lesson where children read or identify a turn from a picture — "what turn is this?", "match each turn to its label", and the My Turn / Your Turn rounds that show a turn and ask children to name it. It draws the *measure of turn between two rays*, which is exactly the distinction a child needs against the common misconception that an angle is the distance along a line.

A quarter turn clockwise:
```json
{ "type": "turn-diagram", "quarters": 1, "direction": "clockwise" }
```

A three-quarter turn anticlockwise, labelled (for an answer slide the label carries the reveal):
```json
{ "type": "turn-diagram", "quarters": 3, "direction": "anticlockwise", "label": "(c) ||three-quarter turn anticlockwise" }
```

Several turns in a row — the standard "match the turns to the labels" layout. Each diagram is one item; give each a letter label so children can refer to it:
```json
{ "type": "row", "items": [
  { "type": "turn-diagram", "quarters": 1, "direction": "clockwise",     "label": "(a)" },
  { "type": "turn-diagram", "quarters": 2, "direction": "clockwise",     "label": "(b)" },
  { "type": "turn-diagram", "quarters": 1, "direction": "anticlockwise", "label": "(c)" },
  { "type": "turn-diagram", "quarters": 3, "direction": "clockwise",     "label": "(d)" }
] }
```

**`quarters` field (default `1`):** the size of the turn in quarter-turns — `1` quarter, `2` half, `3` three-quarter, `4` full. A full turn is drawn just short of all the way round so its arrowhead still shows the direction.

**`amount` field (alternative to `quarters`):** the same thing as a word — `"quarter"`, `"half"`, `"three-quarter"`, `"full"`. Use whichever reads more naturally; `quarters` wins if both are given.

**`direction` field (default `"clockwise"`):** `"clockwise"` or `"anticlockwise"`. The red arrow curves in this direction, so it carries the clockwise/anticlockwise idea visually as well as in the label.

**`countMarks` field (optional, default off):** when `true`, a small numbered disc (1, 2, 3…) is drawn at each quarter-turn boundary along the arc, so a three-quarter turn visibly reads as three quarter turns. Reach for it where the slide is *teaching* that a turn is built from quarter turns — a Teach slide, or a size reference children check against — and leave it off a plain "name this turn" question, where the numbers would let a child count the marks instead of reading the turn.

**Labels read from the board.** The turn name under each diagram is sized to the same readability standard as other slide text (it is not a small worksheet caption), and the build's shrink-to-fit pass scales it down only where a crowded row forces it. Keep labels short — `"quarter turn"`, `"clockwise"` — so they stay large; a long combined label like `"three-quarter turn clockwise"` is forced smaller in a row of several.

**`label` field (optional):** a short caption below the diagram in body typography, supporting the `||` answer reveal exactly like the clock — `"(a) ||quarter turn clockwise"` shows the identifier on the question slide and the green answer on the reveal.

Zone class compatibility: fits A, B, C, D, E-wide, E-narrow, G. The diagram renders as a square — it centres inside whatever rectangle it is given and scales to the smaller dimension. In a `row` each diagram needs ~1.8″ of width to stay readable from the back of the room.

### `angle`

A *static* angle: two black arms meeting at a vertex, with a small blue arc marking the opening between them — or a blue right-angle square when the angle is a right angle. It is the companion to `turn-diagram`: the turn diagram shows an angle being *made* by a rotation (a red turn arrow), while `angle` shows the angle that now *exists*, with no arrow. That difference matters pedagogically. Once a turn has happened, the question becomes "what kind of angle is this?", and a child classifying acute / obtuse / right should be looking at a settled angle, not a rotation — the red arrow would pull their attention back to the movement. Reach for `angle` for the part of the lesson that identifies and classifies angles; reach for `turn-diagram` for the part that makes them from turns.

A clear acute angle:
```json
{ "type": "angle", "degrees": 35 }
```

A right angle (the square marker appears automatically at 90°):
```json
{ "type": "angle", "degrees": 90, "label": "right angle" }
```

A row of angles to compare and sort — the standard "which are acute, which are obtuse?" layout. Vary `rotation` so they aren't all the same way up; recognising an angle should not depend on its orientation:
```json
{ "type": "row", "items": [
  { "type": "angle", "degrees": 30,  "rotation": 0,   "label": "(a)" },
  { "type": "angle", "degrees": 85,  "rotation": 25,  "label": "(b)" },
  { "type": "angle", "degrees": 90,  "rotation": 0,   "label": "(c)" },
  { "type": "angle", "degrees": 130, "rotation": 55,  "label": "(d) ||obtuse" }
] }
```

**`degrees` field (default `45`):** how open the angle is drawn, from `1` to `179`. The number is never shown to the child — Year 4 does not measure angles in degrees, so this field only controls the picture. Use it to pitch the example precisely: a clear acute angle is around `35`, an obtuse angle around `130`, and the "largest acute angle, only just less than a right angle" the lesson wants to model is around `85`. Drawing a near-right acute angle this way is exactly what counters the misconception that anything close to a corner must already be a right angle.

**`rotation` field (default `0`):** turns the whole angle so a set of examples isn't all opening straight up. Identifying an angle as acute or obtuse shouldn't depend on which way it faces, and a row where every angle points up quietly teaches the opposite, so give the examples different rotations.

**`rightAngle` field (optional):** the right-angle square shows automatically when `degrees` is `90`. Set `true` to force the square on, or `false` to keep a plain arc at 90° (useful when you want children to judge a right angle without the marker giving it away).

**`arc` field (default `true`):** set `false` for a bare pair of arms with no marking, e.g. when the slide asks children to spot where the angle is before it's marked.

**`label` field (optional):** a short caption below the angle in body typography, supporting the `||` answer reveal exactly like the clock and turn diagram — `"(a) ||acute"` shows the identifier on the question slide and the green answer on the reveal. Keep labels short (`"acute"`, `"obtuse"`, `"right angle"`) so they stay large on the board.

Zone class compatibility: fits A, B, C, D, E-wide, E-narrow, G. The angle renders as a square — it centres inside whatever rectangle it is given and scales to the smaller dimension. In a `row` each angle needs ~1.8″ of width to stay readable from the back of the room.

### `triangle`

A triangle the child classifies **by its sides** — scalene, isosceles, equilateral or right-angled — drawn as a filled blue polygon with **tick marks** (dashes) on the sides. Sides with the same number of dashes are equal; this is the standard maths notation a child reads to decide the type, so the dashes are the point of the helper, not decoration. The `kind` sets both the shape *and* the default dashes (scalene 1/2/3 all different, isosceles one dash on each of the two equal sides, equilateral one dash on every side, right-angled marked by a square not dashes), so most of the time you only set `kind`.

A named triangle (dashes chosen automatically to match the type):
```json
{ "type": "triangle", "kind": "isosceles", "label": "Isosceles" }
```

A right-angled triangle (the blue right-angle square appears automatically):
```json
{ "type": "triangle", "kind": "right", "label": "Right-angled" }
```

The three types side by side — the standard Teach / classify layout. Vary `rotation` so they aren't all the same way up; recognising a type should not depend on orientation:
```json
{ "type": "row", "items": [
  { "type": "triangle", "kind": "scalene",     "rotation": 0,   "label": "(a)" },
  { "type": "triangle", "kind": "isosceles",   "rotation": 30,  "label": "(b)" },
  { "type": "triangle", "kind": "equilateral", "rotation": 0,   "label": "(c)" },
  { "type": "triangle", "kind": "right",       "rotation": 0,   "label": "(d) ||right-angled" }
] }
```

**`kind` field (default `scalene`):** `scalene` | `isosceles` | `equilateral` | `right`. Sets the shape and the default dashes. This is usually the only field you need.

**`sides` field (optional):** `[a, b, c]` side-length ratios to draw *any* custom triangle (e.g. `[3, 4, 5]`), overriding `kind`'s shape. Dashes are then derived automatically — equal-length sides get matching dashes — or set `ticks` to control them.

**`ticks` field (optional):** `[t0, t1, t2]`, the number of dashes on each side (`0` = none, `1`/`2`/`3` = that many), overriding the kind's default. Use it to mark specific sides; sides you mark with the same number must genuinely be equal.

**`angleArcs` field (default `false`):** set `true` to draw a small blue arc inside each corner — use when the lesson is marking *the three angles* (Concept 1's "every triangle has three sides and three angles"), not on a plain classify-by-side question.

**`rotation` field (default `0`):** turns the whole triangle so a set isn't all the same way up. The dashes and the right-angle square rotate with it, so the notation stays correct whichever way the triangle faces.

**`rightAngle` field (optional):** the square shows automatically for `kind: "right"`. Set `true` to force it on, or `false` to suppress it (e.g. so children judge the right angle without the marker giving it away).

**`symmetryLines` field (default `false`):** set `true` to overlay the triangle's lines of symmetry as dashed lines on top of the shape (the shape and its dashes are unchanged). The lines are derived from `kind`: `equilateral` draws 3 (each vertex to the midpoint of the opposite side), `isosceles` draws 1 (the apex to the base midpoint), `scalene` and `right` draw 0, which is correct and intended (a scalene triangle has no line of symmetry). The axes rotate with the triangle, so they stay correct under `rotation`. **`symmetryLinesAnswer` field (default `false`):** when `symmetryLines` is on, set `true` to draw the lines in answer-reveal green (the same green the `||` reveal uses) for an answer slide; leave it off and they draw in a neutral dark colour for a question slide.

**`label` field (optional):** a short caption below the triangle, supporting the `||` answer reveal exactly like `angle` — `"(a) ||scalene"` shows the identifier on the question slide and the green answer on the reveal. Keep labels short (`"Scalene"`, `"Isosceles"`) so they stay large on the board.

Also usable as a **vocab-card visual** — `{ "type": "triangle", "kind": "scalene" }` beside the word "scalene" shows the triangle with its dashes as the word's icon.

Zone class compatibility: fits A, B, C, D, E-wide, E-narrow, G. The triangle is cropped tight to its own outline (no deadspace) and placed by its true proportions, so a tall isosceles and a wide scalene each fill their slot. In a `row` each triangle needs ~1.8″ of width to stay readable from the back of the room.

### `triangle-nonexample`

A shape that is **not** a triangle, for the concept-attainment sort in Concept 1 ("which of these are triangles, and which are not — why?"). Drawn deliberately triangle-like so "why isn't this a triangle?" is a real question.

```json
{ "type": "triangle-nonexample", "shape": "open", "label": "(a)" }
```

**`shape` field (default `open`):** `open` (three lines with a visible gap — not closed), `curved` (two straight sides and one curved side), or `quad` (a four-sided shape). **`rotation`** and **`label`** behave exactly as on `triangle`, and a row may freely mix `triangle` and `triangle-nonexample` items — they reserve the same caption band so the row stays even.

Zone class compatibility: same as `triangle`.

### `line-pair`

A pair of two straight black lines arranged to show **one relationship** — parallel, perpendicular, or neither — drawn so a child reading from the back of the room can judge it. It is the core primitive of a Year 4 "identify parallel and perpendicular lines" lesson: a whole deck is pairs of lines a child judges and marks. It is the classify-the-lines companion to `angle` (classify the opening) and `turn-diagram` (read the turn).

By default the lines are **bare** — no marks — because most question slides want the marking to remain for completion during modelling or by children. The `notation` field adds the British schoolbook marks on the answer slide or when teaching: chevron `›` arrows on a parallel pair, or the blue right-angle square at a perpendicular corner.

A bare parallel pair (a question slide — the child decides):
```json
{ "type": "line-pair", "relationship": "parallel", "form": "horizontal" }
```

A parallel pair marked with chevron arrows (the answer / teaching version):
```json
{ "type": "line-pair", "relationship": "parallel", "form": "diagonal", "notation": "arrows", "label": "parallel" }
```

A perpendicular cross marked with the right-angle square:
```json
{ "type": "line-pair", "relationship": "perpendicular", "form": "cross", "notation": "right-angle", "label": "perpendicular" }
```

The standard "which pairs are parallel?" sorting layout — a row of four bare pairs, varied in `form` and `rotation` so the judgement isn't given away by orientation, with the answer revealed under each:
```json
{ "type": "row", "items": [
  { "type": "line-pair", "relationship": "parallel",      "form": "horizontal", "rotation": 0,  "label": "(a) ||parallel" },
  { "type": "line-pair", "relationship": "neither",       "form": "converging", "rotation": 0,  "label": "(b) ||not parallel" },
  { "type": "line-pair", "relationship": "parallel",      "form": "diagonal",   "rotation": 0,  "label": "(c) ||parallel" },
  { "type": "line-pair", "relationship": "perpendicular", "form": "cross",      "rotation": 20, "label": "(d) ||not parallel" }
] }
```

**`relationship` field (default `parallel`):** the truth the child is judging — `parallel`, `perpendicular`, or `neither`. `neither` draws the non-examples: a pair that *looks* like it might be parallel or perpendicular but isn't.

**`form` field:** the arrangement *within* the relationship. The value depends on `relationship`:
- **parallel** → `horizontal` (default), `vertical`, `diagonal`. All three keep a constant gap and never meet; they differ only in which way the pair leans, so a set isn't all the same orientation.
- **perpendicular** → `cross` (default — a `+`, the two lines crossing at their midpoints), `L` (the lines meet at a shared endpoint, forming a corner), `T` (one line meets another at its midpoint), `detached` (the two lines do **not** touch, but if extended would meet at a right angle — the "perpendicular lines must actually cross" misconception non-example; faint dashed hints show the implied meeting point).
- **neither** → `converging` (two lines whose gap clearly changes and that would meet if extended — the NOT-parallel non-example), `slant` (two lines that cross at a clearly non-right angle — the NOT-perpendicular non-example).

**`unequal` field (parallel only, default `false`):** set `true` to make the two parallel lines clearly **different lengths** while the gap between them stays constant and they never meet. This is the "parallel lines must be the same length" misconception non-example — the lines *are* parallel despite the unequal length, which is exactly the point.

**`notation` field (default `none`):** the marks drawn on the lines.
- `none` — bare lines. **What question slides use** — the child judges and marks them.
- `arrows` — a chevron `›` mid-line on **each** of the two parallel lines, pointing along the line. The standard British mark that two lines are parallel. Only meaningful when `relationship` is `parallel`.
- `right-angle` — the small blue right-angle square at the corner (for `cross` / `L` / `T`) or at the **implied** corner (for `detached`). Marks the lines as perpendicular.

**`arrows` field (`1` or `2`, default `1`):** number of chevrons per line when `notation` is `arrows`. Use `2` (double chevron `››`) only when a slide shows two *different* parallel sets that must be told apart; a single set uses `1`.

**`rotation` field (default `0`):** turns the whole pair so a set of examples isn't all the same way up. Parallel and perpendicular hold at any rotation, so rotating an example never changes the answer — use it to stop a row quietly teaching "parallel means horizontal".

**`label` field (optional):** a short caption below the picture in body typography, supporting the `||` answer reveal exactly like `angle` / clock / turn diagram — `"(a) ||parallel"` shows the identifier on the question slide and the green answer on the reveal. Keep labels short (`"parallel"`, `"perpendicular"`, `"neither"`, `"not parallel"`) so they stay large on the board.

Zone class compatibility: fits A, B, C, D, E-wide, E-narrow, G. The figure is cropped tight to the two lines and placed by its true proportions (a horizontal pair is wide, a vertical pair tall), so it fills the slot it is given with no deadspace. **Minimum useful size** ~1.8″ in a `row` so the constant gap and the right-angle square read from the back; ~2.0″–2.5″ for a single teaching figure.

### `circuit-diagram`

A large, readable **series circuit** drawn with standard primary circuit symbols. Every circuit has one path and no branches, so a child can trace from one source terminal through each component and back to the other terminal. Lamps are circles with crosses; buzzers use the standard semicircular symbol; cells and batteries use long and short plates; switches have clear open and closed positions. This is a schematic, not a realistic equipment picture.

One complete circuit:

```json
{
  "type": "circuit-diagram",
  "cells": 1,
  "lamps": 1,
  "switch": "closed",
  "path": "complete",
  "label": "Complete circuit"
}
```

A battery, lamp and buzzer with an open switch:

```json
{
  "type": "circuit-diagram",
  "cells": 2,
  "components": ["lamp", "buzzer"],
  "switch": "open",
  "path": "complete",
  "label": "Switch open"
}
```

A comparison row:

```json
{
  "type": "circuit-diagram",
  "circuits": [
    { "cells": 1, "lamps": 1, "switch": "closed", "path": "complete", "label": "A" },
    { "cells": 1, "lamps": 1, "switch": "closed", "path": "gap", "label": "B" }
  ]
}
```

**`cells`** is the number of cells, from 0 to 6; two or more cells form a battery. **`lamps`** and **`buzzers`** set component counts. Use **`components`** when their order matters. **`switch`** is `"open"`, `"closed"` or `"none"`. **`path`** is `"complete"` or `"gap"`. **`circuits`** lays several complete diagrams in one row for comparison. **`label`** is a short identifier below one circuit. Legacy `state` values `complete`, `gap`, `no-cell` and `switch-open` remain accepted.

**The circuit drawn is exactly the circuit stated, or the build stops.** This is one shared drawing used by the slides, the worksheets and the working wall, so the circuit on the board and the circuit on the sheet are the same picture — and it will not quietly adjust the science to make one:

- a count that is fractional, negative or past what the diagram draws is `CIRCUIT_COUNT_UNSUPPORTED`. It is not rounded and not clamped: 3.5 lamps rounded to 4 is a circuit nobody described.
- a component the diagram has no symbol for is `CIRCUIT_COMPONENT_UNSUPPORTED`, naming the value supplied. It is not dropped from the row.
- a `switch` or `path` value that is not one of the listed ones is `CIRCUIT_STATE_INVALID`. A mistyped `"opne"` is not repaired to `"closed"` — that would shut a switch the lesson opened and teach the opposite of what the slide meant.
- a non-legacy circuit that supplies no cell source, no component specification, no switch state or no path state is `CIRCUIT_FIELD_MISSING`. Those are scientifically meaningful choices, so none is assumed.
- a `label` too wide for its circuit is `CIRCUIT_LABEL_DOES_NOT_FIT`. It is not truncated: a caption cut mid-phrase still looks finished.
- only genuinely identical aliases normalise — `bulb` and `light-bulb` mean `lamp`, `beeper` means `buzzer`, `cellCount` means `cells`.

If the drawing itself cannot be produced, the build stops with `CIRCUIT_RENDER_FAILED` rather than substituting the generic figure placeholder. On a slide about an open switch, a grey box captioned "circuit diagram" is not a smaller version of the teaching; it is the teaching missing.

Keep the helper for a single series path. It does not invent parallel branches, junctions or realistic apparatus pictures. When the lesson needs a more complex circuit structure, treat that as an exact missing-helper need rather than forcing it into this helper.

Zone class compatibility: fits A, B, C, D, E-wide, E-narrow, G. A single circuit reads best in a generous wide or near-square zone; a comparison row needs enough width for every circuit to remain traceable.

### `chip-bank`

A set of short labels drawn as **distinct rounded pills (chips)** that wrap across the zone and centre. Use it whenever a slide shows a *bank to pick from* — a word bank ("square · rectangle · rhombus · parallelogram · trapezium"), a set of property labels a child chooses from ("4 sides · polygon · 4 equal sides · 4 right angles"), a set of options, or the category names for a sort. It exists because the alternative — one flat string with middot separators — reads as fake bullets on a tabbed line, all one colour; the chips read instantly as "here is the set", which is what the White Rose originals these lessons rebuild show. General across subjects: the chips carry whatever short labels you supply, not just shapes.

A plain bank (no title, the default blue variant):
```json
{ "type": "chip-bank", "chips": ["4 sides", "polygon", "4 equal sides", "4 right angles", "2 pairs parallel"] }
```

A titled word bank in the warm variant (the White Rose word-bank look):
```json
{ "type": "chip-bank", "title": "Word bank", "variant": "yellow",
  "chips": ["square", "rectangle", "rhombus", "parallelogram", "trapezium"] }
```

A longer bank that wraps to several rows, in the green (support) variant:
```json
{ "type": "chip-bank", "variant": "green",
  "chips": ["acute", "obtuse", "reflex", "right angle", "straight line", "full turn",
            "parallel", "perpendicular", "horizontal", "vertical"] }
```

**`chips` field (required):** an array of short label strings. Each renders as its own rounded pill, auto-sized to its text, wrapping to as many rows as the zone needs. Keep each label short (a word or a few words) so the pills stay large and legible from across the room.

**`maxRows` field (optional):** a positive whole number that limits the bank to that many rows. The helper reduces the complete bank through one shared font size until it meets the limit. If it cannot meet the limit at the readable floor, the build stops with `CHIP_BANK_ROW_CAPACITY`. Use `"maxRows": 1` for a short full-width bank that should stay on one line.

**`title` field (optional):** a heading printed above the bank (e.g. "Word bank"), in the variant's colour. Omit it when the bank needs no heading.

**`variant` field (optional, default `blue`):** the colour identity, picked from the house palette so a bank reads as part of the set.
- `blue` — neutral default (sticky-blue fill, blue outline + text). Use for a property-label set or a general option set.
- `yellow` — the warm word-bank look (pale yellow fill, orange outline, black text), matching the White Rose word banks. Use for a vocabulary / word bank.
- `green` — the scaffold/support identity (the same green children meet on every scaffold), for a bank offered as help.

The bank fills the zone: chips grow with the space available and the rows centre as a block, with a uniform pill height and even spacing. Every chip in one bank shares the largest safe whole-point size up to 54 points. One longer chip reduces the whole bank together. The pill text respects the autofit floor, so even a long wrapping bank stays readable.

Zone class compatibility: fits A, B, C, D, E-wide, E-narrow, G.

### `sort-board`

A completed structured sort with 2 to 6 category panels. Use it for `answer.structure.kind: "sort"`, not for the unsorted pupil bank. Each group is `{ "label", "items" }`. All item labels across every category share one maximum safe size, so a short category cannot become larger than a category with a longer label. The panels use the full zone instead of leaving large empty category areas around small chips.

```json
{ "type": "sort-board",
  "groups": [
    { "label": "Uses electricity", "items": ["Kettle", "Torch"] },
    { "label": "Does not use electricity", "items": ["Book", "Wooden spoon"] }
  ] }
```

Use no more than 6 groups and 12 total items. When the board reports `SORT_BOARD_ITEM_CAPACITY`, split by complete groups or give it a larger zone. Do not shorten labels.

Zone class compatibility: fits A, B, C and E-wide.

### `evidence-cards`

A set of 1 to 4 photograph cards. Use it when each photograph is one item and its question or answer must stay attached to it. A pupil card contains only `imagePath`, optional `fit` and optional `essential`. An answer card adds `fields`, each with the exact source `label` and exact answer `value`. The answer appears directly below its photograph inside the same card. All answer cards share one maximum safe text size.

```json
{ "type": "evidence-cards",
  "items": [
    {
      "imagePath": "unsplash/hairdryer.jpg",
      "fit": "contain",
      "fields": [
        { "label": "Object name", "value": "Hairdryer" },
        { "label": "Electrical appliance?", "value": "Electrical appliance" },
        { "label": "Power source", "value": "Mains electricity" },
        { "label": "Evidence", "value": "Plug and lead" }
      ]
    }
  ] }
```

Four cards fit as a 2 by 2 grid. Two cards fit side by side. More than four cards reports `EVIDENCE_CARDS_CAPACITY`; make consecutive slides with the same `designUnitId` and split only between complete cards.

Zone class compatibility: fits A, B, C and E-wide.

### `venn`

A **Venn sorting diagram** — two overlapping labelled circles inside a rectangular box (the "universe"), the tool a child uses to sort shapes by **two criteria at once**. Each circle carries one property; a shape that fits BOTH goes in the **overlap** where the circles cross, and a shape that fits NEITHER goes **outside both circles but inside the box** — the two ideas this helper exists to make visible. The left circle and its label are house blue, the right circle and its label house orange, so the overlap reads as the two colours stacked and "which circle is which" is never in doubt.

It draws the **frame and places named shape tokens** in the right region — it does not redraw shape geometry. A placed shape shows as a small green-outlined chip carrying its name (e.g. "Square"), which makes the region unambiguous from the back of the room. The shapes being sorted are named in chips because the *placement* is the learning, not the drawing.

A **blank** Venn (omit `shapes`) — the labelled frame the teacher or children place into live. Faint "both" / "neither" hints sit in the overlap and the outside region so a child sees that "neither" is a real place:
```json
{ "type": "venn", "label1": "has a right angle", "label2": "has 4 equal sides" }
```

A **placed** Venn — the same frame with shapes already sorted into named regions (the modelled or completed diagram):
```json
{ "type": "venn", "label1": "has a right angle", "label2": "has 4 equal sides",
  "shapes": [
    { "region": "leftOnly",  "label": "Rectangle" },
    { "region": "rightOnly", "label": "Rhombus" },
    { "region": "overlap",   "label": "Square" },
    { "region": "outside",   "label": "Trapezium" }
  ] }
```

**`label1` / `label2` fields (required):** the property criteria for the left and right circles (e.g. `"has a right angle"`, `"has 4 equal sides"`). A long criterion ("has at least one pair of parallel sides") now wraps to two lines and stays inside the box automatically, so it never clips — a concise label still prints largest, but length is safe.

**`shapes` field (optional):** an array of placed tokens; omit it (or pass `[]`) for a blank diagram. Each token is `{ "region": …, "label": … }` where `region` is one of `"leftOnly"` | `"rightOnly"` | `"overlap"` | `"outside"`, and `label` is the shape's name shown in the chip. Several tokens may share a region — they stack neatly.

**`showRegionHints` field (default `true`):** the faint "both" / "neither" words on a blank diagram. They appear only when no shape is placed (once chips are present the regions are obvious); set `false` to suppress them on a blank frame too.

**`label` field (optional):** a short caption below the whole diagram, supporting the `||` answer reveal like the other figures.

The diagram is cropped tight to the box (no deadspace) and placed by its true ~1.4:1 proportions, so it fills a wide slot. It is the hero of its slide — give it the template's largest zone and let a one-line takeaway sit in the margin its width leaves over, rather than handing a fat zone to a sentence and squeezing the diagram (slide-designer "central visual is the hero").

**Showing the shapes to sort as pictures.** The chips above are for *placed* shapes, where the placement is the learning. For the My / Our / Your Turn where children still have the shapes *to* sort, show those as actual drawn shapes rather than a list of names in the instruction line: build the `questionVisual` as a `stack` whose first item is a `row` of `geoboard`/`triangle` visuals — each carrying its name as a `label` (lettered `(a) (b) (c)` on the Your Turn) — and whose second item is the blank `venn`, giving the diagram the larger stack `weight`. The child then meets the rhombus they are about to place drawn with its notation, sitting above the diagram it goes onto. Zone class compatibility: fits A, B, C, D, E-wide.

### `carroll`

A **Carroll sorting diagram** — a 2×2 grid that sorts shapes by two criteria, the grid companion to `venn`. One property runs **down the side** as a pair (is / is NOT), another runs **across the top** as a pair (is / is NOT), so every shape lands in exactly one of four cells. The teaching point the helper is built around: **every cell means its row label AND its column label together** — the top-left cell is "row-is AND column-is", the bottom-right is "row-isNOT AND column-isNOT". The same green-outlined name chips as `venn` are placed in the cells, so the Venn overlap and the Carroll "is / is" cell read as the same set of shapes shown two ways.

A **blank** Carroll (omit `shapes`) — the labelled grid children place into live:
```json
{ "type": "carroll",
  "rowLabel": "is a quadrilateral", "rowNotLabel": "is NOT a quadrilateral",
  "colLabel": "has a right angle",  "colNotLabel": "has NO right angle" }
```

A **placed** Carroll — shapes already sorted into named cells:
```json
{ "type": "carroll",
  "rowLabel": "is a quadrilateral", "rowNotLabel": "is NOT a quadrilateral",
  "colLabel": "has a right angle",  "colNotLabel": "has NO right angle",
  "shapes": [
    { "cell": "topLeft",    "label": "Square" },
    { "cell": "topRight",   "label": "Trapezium" },
    { "cell": "bottomLeft", "label": "Right-angled triangle" }
  ] }
```

**`rowLabel` / `rowNotLabel` fields (required):** the side criterion, top row then bottom row (e.g. `"is a quadrilateral"` / `"is NOT a quadrilateral"`). They print to the LEFT of the grid, rotated to run up the side.

**`colLabel` / `colNotLabel` fields (required):** the top criterion, left column then right column (e.g. `"has a right angle"` / `"has NO right angle"`). They print ABOVE the grid.

**`shapes` field (optional):** an array of placed tokens; omit it for a blank grid. Each is `{ "cell": …, "label": … }` where `cell` is one of `"topLeft"` | `"topRight"` | `"bottomLeft"` | `"bottomRight"` (topLeft = row-is AND col-is; bottomRight = row-isNOT AND col-isNOT), and `label` is the shape's name. Several tokens may share a cell — they stack.

**`label` field (optional):** a short caption below the grid, supporting the `||` answer reveal.

The grid is cropped tight (no deadspace) and placed by its true proportions, with room reserved for the side and top labels — a long criterion shrinks to fit and never clips. Give it a generous zone as the hero of its slide. To show the shapes still to be sorted as pictures, use the same `stack` of a `row` of `geoboard`/`triangle` visuals above the grid described under `venn`. Zone class compatibility: fits A, B, C, D, E-wide.

### `circuit-symbol-bank`

A board reference containing individually identifiable standard circuit symbols. Use it when the lesson teaches or repeatedly consults the component-symbol map rather than the topology of one complete circuit.

```json
{
  "type": "circuit-symbol-bank",
  "items": [
    { "symbol": "lamp", "label": "lamp" },
    { "symbol": "switch-open", "label": "open switch" },
    { "symbol": "cell", "label": "cell" },
    { "symbol": "wire", "label": "wire" },
    { "symbol": "switch-closed", "label": "closed switch" }
  ]
}
```

`items` contains 2 to 6 entries. `symbol` is exactly one of `cell`, `lamp`, `wire`, `switch-open`, `switch-closed`. `label` is the exact short child-facing name printed below that symbol.

The items keep the supplied order. Every symbol is drawn independently from the shared circuit geometry and receives comparable visual space.

Use `circuit-diagram` instead when the complete loop, connections, component count or switch state of one circuit is the thing children inspect.

**Minimum useful size:** for the full five-symbol primary reference, 6.5″ × 1.5″. Give it more width when the labels are doing active reference work.

### `sc-panel`

A success-criteria panel as a content object: the green rounded box with its "✓ Success Criteria" label, wrapped around whatever criteria you put inside. It exists so the success criteria reads *as* the standard — the same green identity children know from every practice slide — even when it can't sit in the fixed right-hand panel of the `maths-*-sc` family.

Use it when the criteria has to go somewhere those templates' panel can't reach: a wide labelled reference (a `row` of diagrams) that needs a full-width strip, a Reflect slide, any free-template zone. A success criteria dropped bare into a `split-v` secondary or a plain body zone has no green box and reads to a child as just another list — `sc-panel` restores the identity.

```json
{ "type": "sc-panel", "content": {
  "type": "row",
  "items": [
    { "type": "turn-diagram", "quarters": 1, "label": "quarter turn" },
    { "type": "turn-diagram", "quarters": 2, "label": "half turn" },
    { "type": "turn-diagram", "quarters": 3, "label": "three-quarter turn" },
    { "type": "turn-diagram", "quarters": 4, "label": "full turn" }
  ] } }
```

**`label` field (optional):** the panel heading, default `"✓ Success Criteria"`.

**`content` field:** any content object — `steps`, a labelled `row` or `stack` of diagrams, a `table`. It renders inside the box beneath the label, taking the zone's class. The same object may instead be placed under the key `criteria`: that is the key the `*-sc` templates and the `success-criteria` template use for the identical thing, and both keys fill the panel here, so either reads correctly. Put the criteria under one of them — a panel that carries neither renders an empty green box, and the build now warns when that happens. When the content is procedural `steps`, the steps use the same compact white cards and green number badges as the fixed `*-sc` templates; the route to the panel does not change the criteria's visual identity.

Do **not** wrap criteria in `sc-panel` when it already sits in a `maths-*-sc` template's `criteria` slot — that slot draws the green box itself, so wrapping would double it. `sc-panel` is for criteria placed *outside* those panels.

### `callout`

One short line of text in a small coloured box, with an arrow that leaves the box and points at the thing the line is about. The slide's way of pointing at its own content: a note under a place value chart with an arrow up to the column that changed, a note beside a number line pointing at a jump, a note beside a photograph pointing at the feature it names.

```json
{ "type": "callout",
  "text": "The [[tens]] column changes.",
  "points": "up",
  "at": 0.55 }
```

Fields:
- `text` — the one line. Keep it short: a callout is a sentence a child reads in a glance while looking at something else, not a paragraph.
- `points` — which way the arrow goes: `"up"`, `"down"`, `"left"`, `"right"`, or `"none"` for a plain note box with no arrow. (`"top"`/`"bottom"` are accepted as the same thing as up/down.) Default `"up"`. **Always state it** — the arrow's direction is the whole content of the pointing, and the default is only right for the commonest case, a note sitting under the thing it describes.
- `at` — how far along the pointed-at edge the arrow tip lands, `0` to `1` (default `0.5`, the middle). This is what lets the arrow reach the tens column rather than the middle of the chart. For `left`/`right` it runs top-to-bottom instead.
- `reach` — inches the tip is carried *past* the edge of the callout's own zone, `0` to `1.6` (default `0`). See "how to place one" below; a callout that needs a big reach usually wants a different split instead.
- `placement` - used only when `points` is `"none"`. Choose `"left"`, `"center"` or `"right"` to anchor the plain box inside its zone. The unchanged default is `"right"`.
- `variant` — the box's colour, and what it says about the line: `"green"` (default) an observation about what happened or what is true, `"blue"` the thing being decided on, `"orange"` information the question supplies, `"purple"` the objective.

**Working out `at`.** It is a fraction of the callout's *own zone*, not of the figure — so read it off the figure's position within the shared width. Two things move it, and both catch people out:

- **A figure narrower than its zone is centred in it**, so its parts are not where a naive "column 3 of 4" sum puts them.
- **Fields that add a column shift everything after them.** A `place-value-chart` carrying row `label`s gives that caption its own column at the left, which pushes every digit column right: the same four-column chart puts its tens centre near `0.62` bare and near `0.72` labelled.

So do not copy a number out of this catalogue. Build the slide, look at it, and adjust — `at` is a one-decimal nudge, and the arrow landing between two columns is the only way to find out it was wrong.

**Key words carry colour with the ordinary inline markers** — there is no separate colouring field. `[[tens]]` is focus blue, `{{sum}}` answer green, `<<367>>` supplied orange, `**not**` plain bold stress. So "The [[tens]] column changes." colours *tens* in exactly the blue the rest of the deck uses for the word being decided on.

**How to place one.** The callout's arrow tip lands on the edge of its own zone, so put the callout in the zone next to what it annotates and point it that way: a diagram on the left of a `split-h-70-30` and the callout on the right with `points: "left"`; a chart above and the callout below with `points: "up"`. A callout in a zone that does not touch the thing it points at draws an arrow into empty slide.

**Give the figure a zone close to its own size, or the arrow stops short.** A figure narrower or shorter than its zone centres itself inside it, so it sits back from the edge the callout is aiming at, and the arrow ends in empty background - which reads as a broken slide however correct the geometry is. A two-row `place-value-chart` wants roughly a third of the body's height, so it belongs in the small side of a `split-v-60-40` with `"primarySide": "bottom"`, or a `split-v-50-50`, not the 75% side of a `split-v-75-25` where it floats in the middle of its own zone with an inch of slack beneath it. Choosing the split by what the figure actually needs fixes this properly, and is the first thing to reach for.

`reach` is the patch for what is left over. It carries the tip past the callout's zone edge by the inches you give it, up to 1.6. Use it when the figure genuinely cannot fill its zone — it shares the zone with something else, or the template's shape is fixed by other content — and set it by looking at the built slide, since nothing in the spec can tell you how far the arrow fell short. A callout wanting more than about half an inch of reach is nearly always telling you the split is wrong.

**One callout says one thing.** Two or three callouts round one diagram is the anatomy-poster shape, and `label-diagram` already draws that properly with leader lines into the picture — use it instead. Reach for `callout` when a slide needs a single sentence attached to one place.

Zone class compatibility: fits A, B, C, D, E-wide, E-narrow, G. Not F — a one-line instruction bar leaves no room for the arrow, which is the only reason to use a callout rather than a `text` line.

**Minimum useful size:** ~1.6″ × ~0.8″. Below about 0.5″ in the pointing direction there is no room for an arrow and the box draws on its own.

### `pyramid`

A ranking-pyramid scaffold for dialogic lessons. Rows of empty cells stacked from a single cell at the top (most important) to wider rows beneath (less important). Children rank cards onto a paper version while the slide carries the frame as a live reference. Cells render empty by default; supply `items` per row only when you want a worked example or completed pyramid shown on screen.

```json
{ "type": "pyramid",
  "rows": [
    { "label": "Most important", "cells": 1 },
    { "label": "Also important", "cells": 2 },
    { "label": "Least important", "cells": 3 }
  ] }
```

With items pre-filled (rare — usually for a Synthesise slide showing how one pair ranked):

```json
{ "type": "pyramid",
  "rows": [
    { "cells": 1, "items": ["Personal interests"] },
    { "cells": 2, "items": ["Skills you have", "Helping others"] },
    { "cells": 3, "items": ["Money", "Family expectations", "Where you live"] }
  ] }
```

Row labels are optional. When present, they render to the left of each row in small bold text, right-aligned. If no row has a `label`, no label column is reserved and the cells fill the zone width.

**Also the addition / number pyramid.** The same object draws the maths "each brick is the sum of the two below it" puzzle — pass the bricks as `items` (apex row first), leaving `""` for any brick the child must find. Givens stay black; on the answer slide, fill the missing bricks with the `||` marker (`"||28"`) and they reveal green inside the pyramid, so the completed pyramid is its own answer reveal with no separate list. As with the grid, set `workingSpace: false` so the pyramid claims the full width.

Zone class compatibility: fits A, B, C, E-wide. Needs horizontal room — the bottom row's cells share the available width, so narrow zones squeeze them below readable size.

**Minimum useful size (empirically tested):** depends on whether cells carry text.
- **Empty cells (children rank cards onto paper):** 2.0″ × 2.0″ for a 1-2-3 pyramid.
- **Cells containing text/items:** 2.8″ × 2.8″ — the inner text needs more room to stay readable.

Add ~1.2″ of width if row labels are included. Wider is better — the bottom-row cells are the limiting factor.

### `diamond-nine`

A diamond-nine ranking scaffold for foundation lessons (PSHE, RE, history significance). Five rows of cells in a 1-2-3-2-1 formation; "Most important" sits above the top cell, "Least important" below the bottom. Cells render empty by default for child ranking; supply `items` to pre-fill cells for a model-answer reveal or an exemplar slide.

Empty diamond:

```json
{ "type": "diamond-nine" }
```

With items pre-filled (typically a model answer):

```json
{ "type": "diamond-nine",
  "items": [
    "Honesty",
    "Kindness", "Respect",
    "Hard work", "Helping others", "Listening",
    "Tidiness", "Quietness",
    "Following rules"
  ] }
```

Custom anchor labels (when "most/least important" doesn't fit the lesson):

```json
{ "type": "diamond-nine",
  "topLabel": "Most responsible",
  "bottomLabel": "Least responsible",
  "items": ["…"] }
```

`showLabels: false` removes both anchor labels entirely (rare — only when the slide title already supplies the ranking criterion).

Zone class compatibility: fits A, C, E-wide. Needs roughly square aspect ratio because the middle row is three cells wide while the diamond is five rows tall — narrow vertical zones squeeze the cells below readable size.

**Minimum useful size (empirically tested):**
- **Empty cells (child-completed ranking):** 3.2″ × 3.5″.
- **Cells containing text/items:** 4.0″ × 4.2″ — short labels (1–2 words) fit; sentence-length items need more.

The middle row is the width limiter, the five-row height is the height limiter; size up both together rather than just one.

### `continuum-line`

A horizontal continuum line for committing to a position on a gradient — agree↔disagree, most↔least, never↔always. Bold horizontal line with end caps at each end, anchor labels below, optional middle label, optional evenly-spaced tick marks. Use as a thinking scaffold for PSHE, RE, and history-significance Do beats — the teacher chooses how children show or record their position.

```json
{ "type": "continuum-line",
  "left": "Strongly disagree",
  "right": "Strongly agree" }
```

With a middle label and tick marks for finer-grained positions:

```json
{ "type": "continuum-line",
  "left": "Never fair",
  "right": "Always fair",
  "middle": "Sometimes fair",
  "marks": 4 }
```

With a sub-prompt sitting above the line:

```json
{ "type": "continuum-line",
  "question": "Was it fair to invade Britain?",
  "left": "Completely unfair",
  "right": "Completely fair",
  "marks": 6 }
```

`marks` is the number of evenly-spaced ticks between the two ends (capped at 11). Default is `0` — just the line and end caps. Use small numbers (3–5) for primary; more ticks invite false precision.

Zone class compatibility: fits A, B, C, E-wide. The line wants width; height can be modest because the labels sit close to the line. B (wide strip) is the natural fit when the line is one element on a larger task slide.

**Minimum useful size (empirically tested):** 4.0″ × 1.4″. Below 4″ wide the end labels start truncating; below 1.4″ tall the labels collide with the line.

### `fishbone`

An Ishikawa fishbone cause-and-effect scaffold. A horizontal spine arrow points right at an "effect" box on the right; ribs angle off the spine alternately top and bottom, each ending in a "cause" box. Use for *why did X happen?* chunks in history, geography (e.g., causes of flooding), and science (e.g., factors affecting plant growth).

```json
{ "type": "fishbone",
  "effect": "The Romans invaded Britain",
  "causes": [
    "Britain had tin and gold",
    "Caesar wanted military glory",
    "Britain was helping the Gauls",
    "Rome wanted to expand"
  ] }
```

Causes are capped at 6 — beyond that the ribs crowd each other below readable size. 3–5 causes is the sweet spot for primary. Ribs alternate top/bottom starting from the top.

Zone class compatibility: fits A, C, E-wide. Needs horizontal room for the spine plus ribs angling out; narrow zones crush the ribs.

**Minimum useful size (empirically tested):**
- **3–4 causes:** 5.0″ × 3.0″.
- **5–6 causes:** 6.0″ × 3.5″ — extra causes need more spine length to spread.

The effect box is fixed-size on the right; the spine length scales with the remaining width.

### `concept-map`

A radial concept map: one central node with 2–6 spoke nodes around it on a circle, each connected to the centre by a line. Each spoke can carry an optional `relationship` label that sits on its connecting line, naming how the spoke relates to the centre. Use for chunks where children need to see how one central concept connects out to several others — *cacao → money / religion / power / afterlife*, *photosynthesis → light / water / CO₂ / chlorophyll*, *democracy → voting / freedom / accountability / law*.

Centre with four spokes:

```json
{ "type": "concept-map",
  "centre": "Cacao",
  "spokes": [
    { "label": "Money",     "relationship": "used as" },
    { "label": "Religion",  "relationship": "used in" },
    { "label": "Power",     "relationship": "controlled by rulers" },
    { "label": "Afterlife", "relationship": "buried with" }
  ] }
```

Spokes without relationship labels (when the link is implied by the slide context):

```json
{ "type": "concept-map",
  "centre": "Democracy",
  "spokes": [
    { "label": "Voting" },
    { "label": "Freedom" },
    { "label": "Accountability" },
    { "label": "Law" }
  ] }
```

Spokes are distributed evenly around the centre starting from the top (-90°) and going clockwise. The centre node is fill-blue, spokes are white with an orange border — same colour grammar as the Teach family templates.

Zone class compatibility: fits A, C, E-wide. Needs roughly square aspect ratio because spokes radiate in every direction; very wide-short or very tall-narrow zones leave half the spokes overflowing.

**Minimum useful size (empirically tested):**
- **2–4 spokes:** 4.0″ × 4.0″.
- **5–6 spokes:** 5.0″ × 5.0″ — more spokes need more radius to avoid the spoke boxes touching.

Relationship labels work best when they're 2–4 words. Longer phrases overflow the line.

### `source-pathway`

A fan-in pathway for two to six distinct sources that converge on one named intermediate state and then one outcome. Use it when the shared intermediate state is part of the learning and must not disappear inside a text chain.

```json
{ "type": "source-pathway",
  "sources": [
    "Mains socket",
    "Battery / cell",
    "Solar cell",
    "Turn handle\nDynamo"
  ],
  "middle": "Electricity",
  "outcome": "Appliance" }
```

`sources`: two to six short labels. Every source is drawn as a separate top node. All source labels share one largest safe text size. `middle`: the state every source leads into. `outcome`: the final object or state reached from `middle`.

The helper draws each source into one joining route, one arrow into `middle`, and one arrow from `middle` to `outcome`. It does not use typed arrow characters or flatten the nodes into one sentence.

Zone class compatibility: fits A, C and E-wide.

### `money`

A row of UK coins and/or notes, drawn from real-currency image assets stored in the plugin. Use on any slide where children need to read, count, identify, or make change from an amount — the imagery is recognisable because it's the actual Royal Mint designs, not a drawn approximation.

```json
{ "type": "money", "items": ["20p", "20p", "5p", "1p", "1p", "1p"] }
```

With notes and mixed items:
```json
{ "type": "money", "items": ["£5", "£1", "50p", "20p"] }
```

Showing the reverse face of a coin (for coins that have a distinct back image):
```json
{ "type": "money", "items": ["20p_back", "5p", "£1"] }
```

Each item is a string matching a filename (without `.png`) in `builder/assets/money/`.

**Available values:**
- Coins (front): `1p`, `2p`, `5p`, `10p`, `20p`, `50p`, `£1`, `£2`
- Coins (back): `5p_back`, `20p_back`, `50p_back`, `£1_back`, `£2_back`
- Notes: `£5`, `£10`, `£20`, `£50`
- `|` — visible split between coin groups (no coin rendered, just a wider gap). Use when one row carries two amounts and children need to see *which coins make which amount*. Example: `["£2", "£1", "20p", "20p", "|", "£2", "£2", "50p", "20p", "10p"]` shows £3.40 and £4.80 with a clear break between them.

Coins and notes render at **proportional relative sizes** — notes visibly larger than coins — so children see real-world scale. Items lay out left to right; the builder wraps to a new line if the zone is too narrow.

Zone class compatibility: fits A, B, C, E-wide, E-narrow, G (any zone wide enough to hold at least two coins side by side).

**Minimum useful size (empirically tested):** depends on whether the slide shows a single coin or a strip.
- **Single coin** (e.g. "what coin is this?"): 1.0″ × 1.0″ minimum. Single coins are NOT capped by the helper's strip-mode height ceiling — they fill the zone they're given, so size up freely when the coin is the focus of the slide.
- **Mixed strip** of 6–8 coins: 6.0″ wide minimum. Below this the smaller coins (1p, 5p) drop below the size where children can identify them. A row of 9 coins comfortably needs ~7.0″+.

If the zone is narrower than required, the row wraps to a second line — usually undesirable on a teaching slide; either narrow the coin set or put the money in a wider zone.

### `map`

A real map of a real place, drawn from a map image this package ships, the same way `money` draws from real coin photos. Use it whenever a lesson has to say where something is. The base is never drawn: a coastline or a border comes from the real image, and everything the lesson adds sits on top of it as an annotation.

```json
{ "type": "map", "map": "world" }
```

With a caption:
```json
{ "type": "map", "map": "world", "caption": "World map" }
```

**Available values:** `world`, `europe`, `africa`, `asia`, `south-america`, `north-america`, `oceania`, `uk` - present-day political outlines, real country borders, no labels, no shading.

#### Marking places on the map

`annotations` is how a lesson names a city, outlines a region, or traces a river on any of those maps. Each entry is one mark, positioned in **fractions of the map image**: `[x, y]` with `[0, 0]` at the top-left corner and `[1, 1]` at the bottom-right. Fractions, not pixels, so the same mark lands in the same place on the board and on a printed sheet.

```json
{
  "type": "map",
  "map": "south-america",
  "annotations": [
    { "kind": "point", "at": [0.62, 0.34], "label": "Manaus", "colour": "blue" },
    { "kind": "line", "points": [[0.30, 0.29], [0.45, 0.30], [0.62, 0.315], [0.80, 0.325]], "label": "Amazon River", "colour": "blue" },
    { "kind": "area", "points": [[0.26, 0.20], [0.60, 0.22], [0.72, 0.34], [0.52, 0.45], [0.28, 0.40]], "label": "Amazon rainforest", "colour": "green" }
  ]
}
```

- `kind` is exactly `point` (a dot on a place), `line` (a river, a route, a border you are tracing), or `area` (a dashed outline round a region, closed for you).
- `point` takes `at`; `line` and `area` take `points` (at least two, and at least three for an area).
- `label` is optional. Labels are laid out against each other, so two marks near the same place do not print on top of one another; a label that has to move away from its mark gets a leader line back to it. A region's label sits just clear of the region rather than across it.
- `labelAt` optionally places a label yourself, in the same fractions.
- `colour` is exactly `orange`, `blue`, `green` or `black`. Omit it for orange.
- At most **8** annotations. Past that a map stops being readable from the back of the room; if a lesson wants more, it wants two maps.

Anything wrong is refused by name rather than drawn wrongly: `MAP_ANNOTATION_UNSUPPORTED` for a kind that does not exist, `MAP_ANNOTATION_INVALID` for a coordinate outside the map, too few points, an unknown colour, or more marks than the map can carry.

**Place a mark by looking at the real map, and check it by looking at the render.** A dot a few millimetres out is visible and fixable; there is deliberately no way to draw the land itself, because a coastline drawn by eye looks exactly as confident as a real one and is wrong by hundreds of miles.

#### The two built-in overlays

South America carries two ready-made overlays that predate annotations and stay supported:

```json
{
  "type": "map",
  "map": "south-america",
  "selectedCountry": "Brazil",
  "basin": "Amazon basin",
  "labels": { "country": "Brazil", "basin": "Amazon basin" },
  "caption": "South America"
}
```

`selectedCountry` accepts `Brazil` on the South America map. It fills Brazil while keeping its printed border, and it is **board only** - the fill works on the image itself, so on a worksheet name the country with a `point` annotation instead. `basin` accepts `Amazon basin` and draws an orange dashed boundary with a white halo on either surface, so the region cannot be mistaken for a solid national border.

**A requested overlay either appears or the build stops.** Ask for a country or basin the map has no region for and the build fails with `MAP_OVERLAY_UNSUPPORTED`, naming the exact value supplied; if the shading was supported but could not be prepared, it fails with `MAP_OVERLAY_RENDER_FAILED`. Neither quietly falls back to the plain map: a slide that was meant to show where something is happening, printed without the shading and with nothing saying so, is the one failure this content object exists to prevent.

**`labels` prints only words somebody wrote.** Omitted, the map carries no printed names. Pass `{ "country": "...", "basin": "..." }` to print short labels, or `false` to be explicit that there are none. Naming a country in `selectedCountry` asks for it to be SHADED and does not ask for its name to be printed across it - a map for "which country is this?" must not answer its own question.

Harmless spellings of a map name still resolve to the same map: `south america`, `south_america` and `South-America` are one place typed three ways.

The image keeps its true aspect ratio inside the zone. It is never stretched, since a distorted map draws countries the wrong shape.

Zone class compatibility: fits A, B, C, D, E-wide, E-narrow (not F, not G - a map needs enough room for its borders to stay legible, the same floor as `image`).

### `stack`

`stack` keeps its old full-height top-aligned behaviour when the fields below are omitted.

Optional alignment fields:

```json
{
  "type": "stack",
  "heightRatio": 0.58,
  "verticalAlign": "center",
  "items": [
    { "type": "text", "value": "Open switch" },
    { "type": "text", "value": "Closed switch" }
  ]
}
```

- `heightRatio` is a JSON number from 0.35 to 1. It is the share of the stack's available non-gap height assigned to its children. Omit it for 1.
- `verticalAlign` is exactly `"top"`, `"center"` or `"bottom"`. Omit it for `"top"`.
- use a ratio below 1 only when the content group is genuinely shorter than the peer it is being composed against;
- use `"center"` when the shorter group should share the taller peer's visual centre;
- do not use these fields merely to move content by eye when ordinary top alignment already expresses the relationship.

`groupAccent` is optional on both stack and row. It is exactly `blue`, `orange` or `purple` and draws one thin accent across the top edge of the complete group while preserving the normal treatment of its children. Use `groupAccent` when parallel groups must remain visibly separate. Do not apply several different group discriminators to the same pair unless the lesson already gives them separate semantic identities.

A container that holds two or more other content objects and renders them **vertically** within a single zone. Use when a zone needs to carry more than one piece of content stacked top-to-bottom — e.g. a Your Turn side panel showing success-criteria steps on top and a fraction wall below as a live reference.

```json
{ "type": "stack",
  "items": [
    { "type": "steps",
      "steps": [
        "Shade the first fraction on the fraction wall.",
        "Shade the second fraction on the fraction wall.",
        "If both shadings cover the same amount, the fractions are equivalent."
      ] },
    { "type": "fraction-wall",
      "fractions": [2, 4, 8] }
  ] }
```

Items render in the order given. Each item keeps its own styling; the stack just splits the zone vertically. Zone class compatibility for `stack` depends on its items — the zone must accept every item's content type.

**Optional per-item `weight`** (default 1) sets each item's share of the zone height. Without it, every item claims an equal slice — which strands a short label or context line in the middle of an over-large band, away from the content it belongs with. Give a one-line label or context line a small weight (e.g. `"weight": 0.5`) and the main content a larger one (e.g. `"weight": 2`) so the slim item sits close to what it introduces. (For the common "label above a step list" case, a `steps` object with a `heading` is simpler than a weighted two-item stack.)

### `row`

The horizontal twin of `stack`. Holds two or more content objects and renders them **side-by-side** within a single zone. Use when a zone needs to carry a row of items — e.g. four civilisation photographs along the top of a starter, two pyramid images above a pair of sentence stems.

```json
{ "type": "row",
  "items": [
    { "type": "image", "imagePath": "unsplash/starter-giza.jpg",       "caption": "Egyptians" },
    { "type": "image", "imagePath": "unsplash/starter-colosseum.jpg",  "caption": "Romans" },
    { "type": "image", "imagePath": "unsplash/starter-stonehenge.jpg", "caption": "Ancient Britons" },
    { "type": "image", "imagePath": "unsplash/starter-chichen.jpg",    "caption": "A civilisation we are learning about today" }
  ] }
```

Items render left-to-right, equal width by default. Content types don't have to match — a `row` can hold a mix (e.g. an image next to a text block). Zone class compatibility depends on its items — the zone must accept every item's content type.

**Numbering a row's items.** Add `questionNumbering` only when the row belongs to a numbered starter, a numbered main independent task or a multi-question Maths Our Turn. The two modes have fixed roles:

```json
{ "type": "row", "questionNumbering": "teacher-led", "items": [] }
```

letters the items `(a)`, `(b)`, `(c)` — the separate questions in a multi-question Maths Our Turn.

```json
{ "type": "row", "questionNumbering": "independent", "startAt": 3, "items": [] }
```

numbers them `(1)`, `(2)`, `(3)` — a starter or main independent question set. A starter and the main independent sequence each begin at (1). `startAt` continues only the same starter or main independent sequence across another row; omitted, it starts at 1. Teacher-led lettering takes no `startAt`, because lettering restarts for the turn it belongs to.

Omit `questionNumbering` and a row behaves exactly as it always has: nothing is added to any item.

**Equal text cards.** Set `equaliseTextCards: true` only when every row item is `text` and every item has the same visual role. The cards then share one height and one largest safe text size. Set the same `align` value on every item.

A generated label is only ever ADDED to what an item already says. `"Shape A"` keeps its name and becomes `"(1) Shape A"` — a descriptive name is not a question number. If an item already opens with the same bracketed label the row would generate, it prints once rather than twice. If it opens with a DIFFERENT question-like label — the row expects `(1)` and the item says `(2)` — the build stops with `QUESTION_LABEL_CONFLICT`, because renumbering a question the designer labelled could contradict a plan a teacher is reading from.

---

### `coordinate-grid`

A first-quadrant coordinate grid drawn on squared paper from the origin (0,0), numbered across the bottom and up the left, with plotted points marked by a red dot and a letter. Cells are always square so the grid reads true. Use for reading coordinates, plotting points, and (with `join`) identifying the shape a set of coordinates makes.

Plot one or more points to read off:
```json
{ "type": "coordinate-grid", "max": 10, "points": [ { "x": 3, "y": 5, "label": "P" } ] }
```

Join the points into a closed shape ("what shape do these coordinates make?"):
```json
{ "type": "coordinate-grid", "max": 8, "join": true,
  "points": [ { "x": 2, "y": 1 }, { "x": 6, "y": 1 }, { "x": 6, "y": 4 }, { "x": 2, "y": 4 } ] }
```

**`max` (default 10):** the range on both axes (0…max). Use `xMax` / `yMax` to set the across and up ranges separately. **`points`:** each is `{ x, y, label }`; `label` is the letter shown beside the dot (omit for an unlabelled point). **`join` (default false):** joins the points in the order given into a filled, outlined shape — leave `false` to show loose points. Keep `max` small (≤ 10) so the numbers stay readable.

### `polygon`

One or more named 2D shapes drawn side by side, each with a caption below, from true PowerPoint preset geometry — so right angles are genuinely square and regular shapes genuinely regular. Use for "name the shape" and "count the right angles / pairs of parallel sides".

```json
{ "type": "polygon", "shapes": [
  { "name": "rectangle", "label": "Shape P" },
  { "name": "triangle",  "label": "Shape Q" }
] }
```

**`shapes`:** each is `{ name, label }`. **`name`** is one of: `square`, `rectangle`, `triangle` (equilateral), `isosceles-triangle`, `scalene-triangle`, `right-triangle`, `pentagon`, `hexagon`, `rhombus`, `parallelogram`, `trapezium`, `kite`. **`label`** is an optional caption (e.g. "Shape P"). Two or three shapes fit comfortably side by side; pair with a `table` in the other zone for children to record properties. (`isosceles-triangle`, `scalene-triangle` and `kite` are drawn from true vertices — the isosceles is a tall symmetric triangle, the scalene genuinely unequal, the kite a true kite with one vertical axis.)

**Lines of symmetry overlay (answer slides).** Set **`symmetryLines: true`** (on the `polygon` object, applying to every shape in `shapes`) to draw each shape's FULL set of lines of symmetry as dashed lines on top of the shape — the shape itself is unchanged. The correct lines are auto-drawn for the named shape: `square` 4 (2 diagonals plus vertical and horizontal mid-lines), `rectangle` 2 (mid-lines only, not the diagonals), `rhombus`/`diamond` 2 (the diagonals), `triangle` (equilateral) 3 (each vertex to the opposite-side midpoint), `isosceles-triangle` 1, `kite` 1, `pentagon` 5, `hexagon` 6; `parallelogram`, `trapezium`, `scalene-triangle` and `right-triangle` draw 0 lines, which is correct and intended (a parallelogram has none). Add **`symmetryLinesAnswer: true`** to draw the lines in answer-reveal green (the same green the `||` reveal uses) on an answer slide; omit it (the default) and the lines draw in a neutral dark colour for a question slide. Use this for the answer slide of a "how many lines of symmetry?" lesson.

```json
{ "type": "polygon", "symmetryLines": true, "symmetryLinesAnswer": true,
  "shapes": [ { "name": "square", "label": "4 lines" }, { "name": "pentagon", "label": "5 lines" } ] }
```

**Testing ONE candidate line at a time (teaching slides).** For a re-teach where children can't yet picture "the two halves match", do not reveal the whole correct set. Instead test a SINGLE line, which may be right or wrong, with three optional per-shape fields:

- **`candidate`** — draw one dashed candidate line of symmetry to test, by position: `"vertical"` (down the middle), `"horizontal"` (across the middle), `"diagonal-tlbr"` (top-left corner to bottom-right), or `"diagonal-trbl"` (top-right corner to bottom-left). The line may be a WRONG line on purpose — that is the point, so the class can watch one fail (e.g. a `vertical` on a `parallelogram`, or a `diagonal-tlbr` on a `rectangle`).
- **`verdict`** — `"pass"` draws a large green tick beside the shape, `"fail"` a large red cross. Use it to show whether the candidate line worked.
- **`fold`** — `true` reflects the shape across the `candidate` line and draws the result as a translucent pink ghost: when the line IS a line of symmetry the ghost lands exactly on the shape (no pink shows — "the halves match"); when it is NOT, the ghost overhangs / leaves a gap (the visible mismatch). Requires `candidate`.

Drive a lesson with a sequence of these: the square shown four times, each with a different passing `candidate` and a green tick; then a wrong line on a parallelogram or rectangle with `fold: true` and a red cross so the class sees the overhang. The shape shrinks automatically to keep the ghost on the slide.

```json
{ "type": "polygon", "shapes": [
  { "name": "square",        "candidate": "diagonal-tlbr", "verdict": "pass" }
] }
{ "type": "polygon", "shapes": [
  { "name": "parallelogram", "candidate": "vertical", "verdict": "fail", "fold": true,
    "label": "Fold down the middle: it does not match" }
] }
```

### `translation-grid`

A numbered squared grid showing one marker translated from a start position to an end position, with a dashed arrow between them. The start marker is orange (the given position the child reads from) and the end blue, so the slide-and-no-turn of a translation is visible. Use for "how far has the shape moved — left/right and up/down?".

```json
{ "type": "translation-grid", "max": 10,
  "from": { "x": 8, "y": 3 }, "to": { "x": 5, "y": 7 },
  "fromLabel": "A", "toLabel": "B" }
```

**`max` (default 10):** range on both axes (use `xMax` / `yMax` to differ). **`from` / `to`:** `{ x, y }` grid positions of the two markers. **`fromLabel` / `toLabel`:** letters on the markers (default "A" / "B"). The arrow runs centre to centre, so the move reads straight off the grid squares. **`showArrow` (default true):** set `false` to show the two markers only, with no line joining them, so children work out the direction of the move for themselves (independent practice) while the modelling slide keeps the arrow. The grid, numbers, marker positions and centring are identical either way — removing the arrow does not reflow or resize anything.

### `shaded-fraction`

A single shape divided into equal parts with some shaded green and the rest white — the "shade one quarter of this shape" diagram. Every part is the same size, so the fraction reads as shaded ÷ total. Use for finding a fraction of a shape; set `shaded: 0` for a blank shape children shade in themselves.

Bar (equal columns), grid (rows × columns), and circle (equal sectors):
```json
{ "type": "shaded-fraction", "parts": 8,  "shaded": 2, "shape": "bar",    "label": "8 ÷ 4 = 2 shaded" }
{ "type": "shaded-fraction", "parts": 12, "shaded": 3, "shape": "grid" }
{ "type": "shaded-fraction", "parts": 4,  "shaded": 1, "shape": "circle", "label": "one quarter" }
```

**`parts` (required):** total equal parts. **`shaded` (default 0):** how many to fill green. **`shape` (default `bar`):** `bar`, `grid`, or `circle`. **`rows`** (grid only): force the number of rows; otherwise the split is chosen to keep cells near-square. **`label`:** optional caption below the shape.

### `dial-scale`

An analogue round scale — the kitchen/weighing dial a child reads a value off. 0 sits at the top and a full clockwise revolution is `max`, with numbered major ticks, small ticks between, and a red needle on `value`. Use for "the scales show ___, how much more to reach ___?".

```json
{ "type": "dial-scale", "max": 1000, "value": 200, "unit": "g", "label": "The scales show 200g" }
```

**`max` (default 1000):** the value at a full turn. **`value` (default 0):** where the needle points. **`unit`:** shown near the centre (e.g. "g", "ml"). **`majorEvery`** (default `max ÷ 10`) and **`minorEvery`** (default `majorEvery ÷ 5`): tick spacing. **`label`:** optional caption below the dial. Give it a roughly square zone so the face stays circular.

### `line-graph`

A line graph with numbered, titled axes and plotted points joined in order — the kind a child reads a value off ("how tall after 3 hours?") or reads an interval from ("how long to fall from 16cm to 3cm?"). Gridlines sit behind the line so points stay readable.

```json
{ "type": "line-graph", "xLabel": "Time (hours)", "yLabel": "Height (cm)",
  "points": [ { "x": 0, "y": 20 }, { "x": 1, "y": 16 }, { "x": 2, "y": 12 }, { "x": 3, "y": 7 }, { "x": 4, "y": 3 } ] }
```

**`points`:** `{ x, y }` data points, joined in the order given. **`xLabel` / `yLabel`:** axis titles (the y-title is rotated up the left edge). **`xMax` / `yMax`:** axis ranges (default: rounded up from the data). **`xStep` (default 1) / `yStep`** (default a "nice" step giving ~5 ticks): tick spacing. Prefers a wide zone (works well at full working-area width with `workingSpace: false`).

### `tally-chart`

A tally chart — the core statistics visual. A group-label column, a tally column, and an optional Total column. Each row's `tally` is a **number**; the renderer draws it as bundles of five — four vertical strokes with a fifth diagonal struck across all four — then the remainder as plain verticals (7 → IIII⁄ II, 11 → IIII⁄ IIII⁄ I). Children read the picture, never the raw number, so the diagonal-as-fifth-mark is the teaching point.

```json
{ "type": "tally-chart",
  "title": "Pets in Class 4",
  "headers": ["Pet", "Tally", "Total"],
  "rows": [
    { "label": "Dog",  "tally": 7,  "total": 7  },
    { "label": "Cat",  "tally": 11, "total": 11 },
    { "label": "Fish", "tally": 3,  "total": 3  }
  ],
  "showTotals": true }
```

**`title`:** optional heading above the chart. **`headers`:** column headers; the third is used only when totals show. **`rows`:** `{ label, tally, total }` — `total` is optional (defaults to the tally count). **`showTotals`:** whether to draw the Total column (defaults to true when a third header is present). **`blank`:** set `true` to draw the tally (and total) cells as **empty boxes**, each the width the expected marks would need, for a data-collection activity where children tally as they count — give the rows their expected `tally` numbers so the boxes are sized correctly, and the chart prints with the marks left blank.

**Frequencies reveal green with the `||` marker, exactly like the mult-grid.** A `total` carrying the marker — `"total": "||12"` — renders that frequency in answer-green while the tally marks beside it (the question) stay black; a plain `total` stays black as a given. This serves the two moments where a frequency is a worked answer rather than data the child is handed. On a **My Turn** for reading a chart, keep every completed frequency the teacher models in ordinary black teaching text (plain numbers with no `||` marker) so the completed chart is the visible worked example the class watches the teacher produce, rather than a blank chart identical to the practice that follows; model the My Turn chart in full, since the Our Turn takes its own fresh chart (the lesson-designer briefs a different chart per turn). On an **answer slide**, mark every frequency (`"||5"`, `"||7"`, …) so the completed column reads as the reveal. A question chart children read and fill themselves — the Our Turn and Your Turn charts — leaves `total` empty (`""`): black, blank, theirs to complete.

### `pictogram`

A pictogram — each row is a category label followed by a series of house-blue symbols (filled circles), with a key below stating how many units one symbol represents. A symbol drawn as a **left half-circle** stands for **half the key value**, so a value of 45 against a key of 10 draws four-and-a-half circles. Reading the half-symbol as "half of ten", not "one", is the central Year 4 teaching point this picture makes visible. The same drawing the slides, worksheets and working wall use.

```json
{ "type": "pictogram",
  "title": "Library books borrowed this week",
  "categories": ["Monday", "Tuesday", "Wednesday", "Thursday"],
  "values": [30, 45, 25, 60],
  "key": { "per": 10, "label": "books" } }
```

**`title`:** optional heading above the chart. **`categories`:** the row-label strings. **`values`:** one number per category (same length as `categories`). **`key.per`:** how many units one full symbol stands for. **`key.label`:** the unit word shown in the key (e.g. `books` → `= 10 books`). Only a remainder of exactly half draws a half-symbol; other fractional values draw whole symbols only, matching what a Year 4 pictogram shows.

### `bar-chart`

A bar chart with labelled axes and a clearly numbered y-axis scale: the canonical data-handling visual from Year 3 up. The y-axis interval is always taken from the spec and never defaults to 1, because reading a non-unit scale (each gridline worth 2, 5 or 10) is the whole point of a primary bar-chart lesson, so set `y_interval` to match the data. The same renderer the slides use; bars are school blue.

```json
{ "type": "bar-chart",
  "title": "Favourite fruits in Class 3",
  "categories": ["Apple", "Banana", "Cherry", "Grape"],
  "values": [12, 8, 6, 14],
  "y_interval": 2,
  "y_label": "Number of children",
  "x_label": "Fruit" }
```

**`categories`:** the x-axis label strings. **`values`:** one number per category (same length as `categories`). **`y_interval`:** the spacing between y-axis gridlines, set explicitly so the scale steps in 2s, 5s or 10s as the lesson needs; if omitted, a "nice" step is derived from the data, never a forced 1. **`y_max`:** top of the y-axis (default: rounded up from the largest value to the next interval). **`title`:** optional heading above the plot. **`y_label` / `x_label`:** optional axis titles (the y-title is rotated up the left edge). The read task is the real question, so pair the chart with the question the child actually answers (how many more, the total of two bars), not a bare "read the chart".

### `label-diagram`

A photo or drawing with a **labelled-part overlay**: each callout is a small dot on the part, joined by a leader line out to the part's name. Reach for it whenever the teaching move is naming the specific parts of a real diagram: the parts of a plant, the features of a river, the angles on a shape. The leader line is the point: it is what lets a child map each name back to the part it belongs to, so a corner-callout layout (the older `teach-annotated`) cannot stand in for it. The same figure the worksheet and the stick-in pack draw, so the board, the sheet and any glued-in piece show one diagram.

Set `given: true` on a callout to print its label: use this for the completed/answer diagram (My Turn), or for a part the lesson hands the child. Omit `given` to draw a blank write-on line instead, which is the question form available for live completion or for child completion (Your Turn). Anchors are percentages of the image, so the same callouts fit the picture at any displayed size; a callout auto-routes its label to the nearest margin, or you can place it with `label_at`.

```json
{ "type": "label-diagram",
  "imagePath": "river.jpg",
  "caption": "Label the features of the river",
  "callouts": [
    { "anchor": [22, 18], "label": "source", "given": true },
    { "anchor": [60, 55], "label": "meander" },
    { "anchor": [85, 80], "label": "mouth", "label_at": [95, 80] }
  ] }
```

**`imagePath`:** the base image, resolved like every other slide image (relative to the lesson folder). **`callouts`:** one per part. `anchor` is `[x%, y%]` of the image (the point the label is about); `label` is the part's name; `given: true` prints it, otherwise a blank line is drawn; optional `label_at` is `[x%, y%]` for where the label sits when the auto-route is not what you want. **`caption`:** optional line under the diagram (the task, e.g. "Label the features of the river").

**Placing the labels so they stay readable — the photo case.** Where the names should sit depends on what the base image is, because the labels print in dark ink. On a **line drawing on a white background** (a plant diagram, a river map) a name reads fine sitting on the image itself, so the default auto-route, or an exact `label_at`, is right there. On a **photograph** (a real church interior, a real flower) the background is unpredictable and often dark, and `label_at` measures from inside the picture — so a name placed on the photo can disappear into it. Give a photo the poster layout, `"layout": "sides"`: it stacks the names out in the white margins to the left and right of the picture, each joined to its part by a leader line, so every name reads on clear white however busy or dark the photo is. This is the same poster the working wall draws for a "parts of a…" card. So the rule of thumb is: reach for `"layout": "sides"` whenever the base image is a photo, and keep `label_at` for placing a label on a white-background drawing. Two optional companions to `sides`: `labelMaxChars` wraps a long name onto two tidy lines (it already defaults to a sensible width), and `arrow: true` swaps each anchor dot for an arrowhead pointing at the part.

**Photo poster example** — the same helper with `layout: "sides"`, the form to reach for on a photograph so the names sit off the picture (note there is no `label_at`: the names auto-stack in the side margins):

```json
{ "type": "label-diagram",
  "imagePath": "church-interior.jpg",
  "layout": "sides",
  "labelMaxChars": 16,
  "caption": "The parts of a church",
  "callouts": [
    { "anchor": [50, 20], "label": "cross", "given": true },
    { "anchor": [82, 28], "label": "stained glass windows", "given": true },
    { "anchor": [26, 42], "label": "pulpit", "given": true },
    { "anchor": [50, 50], "label": "altar", "given": true }
  ] }
```

### `bar-model`

A general **bar model** — the White Rose / Singapore picture behind money, comparison and multi-step reasoning from Year 4 up. Two shapes, set with `shape`. The same drawing the slides, worksheets and working wall use.

**`shape: "part-whole"`** — one long rectangle (the **whole**) divided into 2+ **parts** along its length. The `whole` label sits above the bar in a span bracket (or to the side with `wholeLabelPosition: "side"`); each part's label sits inside its segment. Segment lengths are **proportional** to the parts' `value`s when **every** part has one, and **even** otherwise.

```json
{ "type": "bar-model", "shape": "part-whole",
  "whole": { "label": "£5" },
  "parts": [
    { "label": "biscuit 30p" },
    { "label": "drink 50p" },
    { "label": "change ?" }
  ] }
```

**`shape: "comparison"`** — two stacked `bars` of different lengths (from their `value`s), with the shorter bar's shortfall drawn as a labelled **`difference`** gap aligned to the longer bar's right end. Each bar may carry an optional left-side `name`.

```json
{ "type": "bar-model", "shape": "comparison",
  "bars": [
    { "name": "Blue", "label": "£27.40", "value": 27.40 },
    { "name": "Red",  "label": "£12.75", "value": 12.75 }
  ],
  "difference": { "label": "?" } }
```

**The unknown is any region whose label is empty or ends in `?`:** it draws white with a blue dashed outline (the child's write-in space), where a known region draws pale-house-blue with a solid outline. So `"change ?"` and `"Left ?"` become answer boxes that still show their text, `{ "label": "?" }` is a bare write-in box, and an empty `{}` part is a blank box. On a My Turn slide use real labels; on a Your Turn slide leave the unknown empty/`?`. **`wholeLabelPosition`** (part-whole): `"above"` (default) or `"side"`. Omit the `whole` key for no bracket. Give it a roughly wide zone — a bar model is much wider than it is tall.

### `blank-surface`

A **draw-your-own working surface** - the child constructs the representation rather than filling a pre-drawn one. Use it when *deciding* the representation is the skill: where the jump on a number line goes, or how to partition a bar. The slide's job is to show the bare surface itself, so the class sees exactly the surface they will draw their own version of. It draws only the bare surface and nothing else; for a finished picture with blanks to fill, use `numberline` or `bar-model` instead.

**`surface: "number-line"`** (default) — a single faint horizontal baseline with a generous empty band above it for the child's jumps and working. No ticks, no pre-drawn jumps, no numbers along it. Optionally label the two ends with `start` / `end` (plain strings); leave them off for a bare line.

```json
{ "type": "blank-surface", "surface": "number-line", "start": "0", "end": "100" }
```

**`surface: "bar"`** — a single empty rectangle outline with no internal divisions; the child draws the partitions. Set `bars: 2` for a comparison task (two stacked empty outlines).

```json
{ "type": "blank-surface", "surface": "bar" }
```

```json
{ "type": "blank-surface", "surface": "bar", "bars": 2 }
```

**`surface`:** `"number-line"` (default) or `"bar"`. **`start` / `end`** (number-line): optional plain-string labels at the left and right ends — omit for a bare line. **`bars`** (bar): how many stacked blank bars, `1` (single, default) or `2` (a comparison pair). Keep the prompt in a separate text zone (the surface stays bare). Give it a roughly wide zone for a number line or single bar; a comparison pair is closer to square.

### `method-frame`

A **taught mental strategy printed as a fill-in method** available for live completion during modelling. An ordered list of labelled lines inside a green "method" panel: each line is a short method label - the strategy's own words, blue - and a line of content in which a run of 2+ underscores (`___`) or a `□` becomes a bordered write-in box. The number and position of blanks is yours to set, so the same frame is given fully worked, with one blank, or all blank - fade it across a My Turn / Your Turn pair, or across a teach sequence (worked example → partially given → all blank). The board twin of the worksheet's `method-frame`, so the child meets one picture on the board and on paper.

```json
{ "type": "method-frame", "title": "Adjusting strategy", "lines": [
  { "label": "First, add:",   "content": "___ + ___ = ___" },
  { "label": "Then, adjust:", "content": "___ - ___ = ___" }
] }
```

Fully worked (an answer slide, or a worked example to copy):

```json
{ "type": "method-frame", "title": "Adjusting strategy", "lines": [
  { "label": "First, add:",   "content": "63 + 30 = 93" },
  { "label": "Then, adjust:", "content": "93 - 1 = 92" }
] }
```

- `title` — optional green heading above the lines ("Adjusting strategy", "Round and compensate").
- `frame` — draw the green panel behind the lines. Default `true`; set `false` for the bare lines (e.g. a small reference zone where the panel would crowd).
- `lines` — `[{ label, content }]`. `label` is optional (the method language); `content` is a string where `___` or `□` becomes a write-in box and everything else is bold text. Content need not be an equation — `"Take ___ from ___ to make ___"` works too.

**Sizing:** the font fills the zone (rows large for reading from across the room) and shrinks only if the widest line would overflow, so it reads at full-body and half-column widths alike. For a SINGLE-LINE equation frame, the worksheet's `inequality-with-boxes` already covers that pattern; `method-frame` is for the multi-line, labelled case. A FILLED method (no blanks) on the working wall is the `workedExample` card, not this — a wall card is a reference, never a fill-in.

### `number-network`

Circles joined by lines where every directly-connected pair must add up to a fixed target — the "each line adds to 100, find the missing circles" addition network. The child reads the given circles and works out the blanks; a blank circle shows a faint `?`. Reveal answers on the answer slide by filling the value and tinting it green.

Question (two blank circles to find):
```json
{ "type": "number-network", "target": 60,
  "nodes": [ { "x": 1, "y": 0, "value": 25 }, { "x": 1, "y": 1, "value": 35 },
             { "x": 0, "y": 2, "value": null }, { "x": 2, "y": 2, "value": null } ],
  "edges": [ [0, 1], [1, 2], [1, 3] ] }
```
Answer (blanks filled, green):
```json
{ "type": "number-network", "target": 60,
  "nodes": [ { "x": 1, "y": 0, "value": 25 }, { "x": 1, "y": 1, "value": 35 },
             { "x": 0, "y": 2, "value": 25, "color": "00B050" }, { "x": 2, "y": 2, "value": 25, "color": "00B050" } ],
  "edges": [ [0, 1], [1, 2], [1, 3] ] }
```

**`target`:** the sum every connected pair must reach (shown as a caption — override the caption with `label`). **`nodes`:** each is `{ x, y, value, color }` — `x` across and `y` **down** (so `y:0` is the top row, matching top/middle/bottom), positioned on an integer layout grid that the helper scales to fill the zone; `value` is the number (use `null` for a blank circle); `color` tints the number (use green `00B050` to reveal an answer). **`edges`:** `[i, j]` index pairs into `nodes`, each drawn as a joining line. Space nodes about one unit apart; the circles size themselves to the spacing.

### `area-grid`

A squared grid with one or more labelled rectangular patches drawn on it, every unit square left countable — the "each square = 1m², find the area of each patch" diagram. Use this for the multi-patch layout a single `shaded-fraction` bar can't show; patches are drawn under the gridlines so children can still count squares inside each one.

```json
{ "type": "area-grid", "cols": 10, "rows": 6, "unitLabel": "Each square = 1m²",
  "rects": [ { "x": 0, "y": 0, "w": 4, "h": 3, "label": "A" },
             { "x": 5, "y": 1, "w": 3, "h": 4, "label": "B" } ] }
```

**`cols` / `rows` (default 10 × 6):** grid size in unit squares (cells are always square). **`unitLabel`:** caption under the grid stating what one square is worth. **`rects`:** each is `{ x, y, w, h, label, color }` — `x, y` is the patch's **top-left** corner in grid squares (`x` across, `y` down), `w, h` its size in squares, `label` the text inside it, `color` an optional hex fill (otherwise a pale palette cycles). Keep patches inside the grid bounds.

### `reflection-grid`

A dot grid with a mirror line and a shape on one side, for "reflect this shape in the mirror line" symmetry work. The dots are deliberately unnumbered (unlike `coordinate-grid`), because reading equal distances by counting dots is the skill. The question slide shows the shape; the answer slide adds the reflected shape in green — the same object renders both, so set `showReflection: true` for the answer.

Question:
```json
{ "type": "reflection-grid", "cols": 10, "rows": 8,
  "mirror": { "orientation": "vertical", "at": 5 },
  "shape": [ [2, 2], [2, 6], [4, 6], [4, 4], [3, 4], [3, 2] ] }
```
Answer (adds the reflection in green):
```json
{ "type": "reflection-grid", "cols": 10, "rows": 8,
  "mirror": { "orientation": "vertical", "at": 5 },
  "shape": [ [2, 2], [2, 6], [4, 6], [4, 4], [3, 4], [3, 2] ], "showReflection": true }
```
Diagonal mirror (slope +1, line `y = x`), answer in green:
```json
{ "type": "reflection-grid", "cols": 8, "rows": 8,
  "mirror": { "orientation": "diagonal-up", "at": 0 },
  "shape": [ [1, 3], [1, 6], [3, 6], [3, 5], [2, 5], [2, 3] ], "showReflection": true }
```

**`cols` / `rows` (default 10 × 8):** grid size in squares, with dots at every whole position. **`mirror`:** `{ orientation, at }` — `orientation` is one of `"vertical"` (a line straight up the grid), `"horizontal"` (straight across), `"diagonal-up"` (bottom-left → top-right, slope +1) or `"diagonal-down"` (top-left → bottom-right, slope −1); `at` is its position in squares. For the diagonals `at` is the line's **intercept**: `diagonal-up` is the line `y = x + at` and `diagonal-down` is `y = −x + at`, so `diagonal-up` `at: 0` is the line `y = x` through the bottom-left corner, and `diagonal-down` `at` equal to `rows` runs corner to corner. Keep `at` a whole number so the reflected shape lands exactly on dots. **`shape`:** `[[x, y], …]` vertices joined in order, with `x` across (0 = left) and `y` **up** (0 = bottom), the way a child plots on dotted paper. **`showReflection` (default false):** set `true` on the answer slide to draw the reflected shape in green. Place the starting shape fully on one side of the mirror — for a diagonal, clearly above-left or below-right of the slanted line — so the reflection has room and doesn't overlap the original.

### `translation-shape`

A **numbered coordinate grid** carrying a **whole shape** and, optionally, its **translated image** — the signature picture of a translation lesson. The original is a solid house-blue filled polygon; with `showImage: true` the image (every vertex slid by the same `translate`) is added in a lighter **dashed** blue and a dashed arrow runs from one original vertex to its match, so the slide — and that every corner moves the same way — is visible. It is plainly the same size and shape, just moved. The grid, axes and numbers are drawn exactly as `coordinate-grid` draws them, so children read a grid they already know. This draws the two-full-polygons picture neither `translation-grid` (single start/end markers) nor `coordinate-grid` (one shape) can.

Two modes, one object. The **task** the child works on shows the original only, on the clear numbered grid (the child plots and joins the image themselves); the **worked answer** sets `showImage: true` to add the image and the arrow:

Task (original only):
```json
{ "type": "translation-shape", "cols": 10, "rows": 8,
  "points": [ [1, 1], [1, 4], [3, 4], [3, 3], [2, 3], [2, 1] ],
  "translate": { "dx": 5, "dy": 3 },
  "label": "Translate the shape 5 right and 3 up" }
```
Worked answer (adds the image + arrow):
```json
{ "type": "translation-shape", "cols": 10, "rows": 8,
  "points": [ [1, 1], [1, 4], [3, 4], [3, 3], [2, 3], [2, 1] ],
  "translate": { "dx": 5, "dy": 3 }, "showImage": true,
  "label": "5 right, 3 up ||every corner moves the same way" }
```

**`cols` (default 10) / `rows` (default `cols`):** grid size in squares, numbered `0..cols` across and `0..rows` up, origin at (0,0). **`points`:** the original shape's vertices, joined in order into a closed polygon — either `[[x, y], …]` (terse) or `[{ "x", "y" }, …]` (object form), with `x` across (0 = left) and `y` **up** (0 = bottom). **`translate`:** `{ "dx", "dy" }` the slide in squares — positive `dx` moves right, positive `dy` moves up; negative moves left / down. Every vertex shifts by the same amount (a true translation — no rotation, reflection or resize). **`showImage` (default false):** set `true` to draw the translated image and the arrow (the answer/worked-example form); leave off for the task the child completes. **`arrowFrom` (default 0):** index of the original vertex the arrow springs from. **`label` (optional):** caption below the grid, supporting the `||` answer reveal. Size the grid so both the original and its image sit comfortably inside `0..cols`/`0..rows` — the translated image must land fully on the grid.

### `grid-map`

A schematic river-town map drawn on a **numbered four-figure grid**, the kind a Year 4 child reads human/physical features and four-figure grid references off. **This is the whole point of the lesson, so the drawing gets the method exactly right:** a four-figure grid reference names the **bottom-left corner** of a square, read **along the bottom first, then up the side**. The grid numbers therefore label the grid **lines at the corners** (not floating in the middle of a square): the easting `32` sits on its vertical line, the northing `51` on its horizontal line, and the square `32 51` is the cell sitting **up-and-to-the-right** of where those two lines cross. The optional `highlightSquare` ring lands on that exact bottom-left corner, so the Teach slide can point to it while saying "along the corridor, then up the stairs". A blue river winds through with a meander; features sit inside their squares in one neutral ink, so a child still has to **decide** human vs physical rather than reading it off a colour.

A teaching map with a ring on the first reference modelled:
```json
{ "type": "grid-map",
  "eastings": [47, 48, 49, 50, 51, 52], "northings": [83, 84, 85, 86, 87],
  "river": [ [47.3, 86.7], [48.4, 85.2], [49, 84.55], [50.2, 83.4], [51.8, 83.2] ],
  "roads": [ [ [47.05, 83.6], [50, 83.55], [51.95, 83.5] ] ],
  "features": [
    { "name": "hill", "square": [47, 86], "type": "physical" },
    { "name": "woodland", "square": [48, 85], "type": "physical" },
    { "name": "church", "square": [48, 83], "type": "human" },
    { "name": "bridge", "square": [50, 83], "type": "human" },
    { "name": "houses", "square": [51, 84], "type": "human" }
  ],
  "highlightSquare": [48, 83],
  "label": "Read along the bottom, then up the side" }
```

**This example is one map, not the map.** You author each lesson's map, so invent
it from the lesson: pick fresh two-digit ranges for the grid numbers (an OS grid
puts a class anywhere, and there is nothing special about any pair), draw the
river or coast the lesson's story needs, and name features from its context - a
harbour town, a hill village, a castle on a headland. What must stay the same is
the method the drawing teaches, never the geography. Reusing one map across a
unit is deliberate continuity; meeting the same river in unrelated lessons tells
children the map was never real. There is no default map: a spec without its
`eastings` and `northings` is refused at build time rather than quietly drawn
with someone else's numbers.

**`eastings`:** the numbers along the **bottom**, one per vertical grid line, left → right — consecutive whole numbers; N numbers make N−1 columns of squares. **`northings`:** the numbers up the **side**, one per horizontal grid line, bottom → top. **`river`:** `[[easting, northing], …]` points (fractions allowed, e.g. `[31.3, 54.7]`) drawn as a smooth blue river; start near the top-left and run down and off a bottom edge, threading a point or two through one square to make a visible meander. **`roads` (optional):** a list of paths, each `[[easting, northing], …]`, drawn as a solid grey road. **`features`:** `[{ name, square: [easting, northing], type, icon? }]`; each feature is drawn inside the cell whose **bottom-left corner** is its `square`, with `type` `"physical"` or `"human"` (the answer the child decides — never coloured in) and an optional `icon` glyph above the name (omit it for a neutral dot). **`highlightSquare` (optional):** `[easting, northing]` — rings that square's bottom-left corner for modelling a reference. **`label` (optional):** a caption beneath the map. The map fills its zone by its true aspect (no deadspace); give it a wide slot so the numbers and labels read from the back of the room.

### `world-geography-map`

A configurable, conventional **north-up world map** with recognisable outlines for North America, South America, Europe, Africa, Asia, Oceania and Antarctica. It has three configurations, each with one clear classroom job:

```json
{ "type": "world-geography-map", "configuration": "continent-retrieval" }
```

`continent-retrieval` draws seven empty, ruled label spaces and no pre-filled continent names. Use it on the board for retrieval or print it as a stick-in map for children to label and circle South America themselves. A teaching slide may set `"highlightSouthAmerica": true` to add an orange dashed ring; the blank spaces still stay blank.

```json
{ "type": "world-geography-map", "configuration": "biome-examples", "labels": true }
```

`biome-examples` shades geographically placed examples across continents and prints an exact matching four-part key: **Tropical forest, Desert, Savannah, Tundra**. Colour and pattern both distinguish the four, so the key survives greyscale printing. These are example regions, not claims that a whole continent has one biome.

```json
{ "type": "world-geography-map", "configuration": "rainforest-pattern",
  "labels": true, "showLatitudeLines": true }
```

`rainforest-pattern` marks tropical-rainforest areas in Central America, the Amazon basin, west/central Africa, South and South-East Asia, Indonesia/New Guinea and north-east Australia. The Equator, Tropic of Cancer and Tropic of Capricorn are shown by default. The map deliberately leaves much land inside the Tropics unshaded, making clear that **not all tropical land is rainforest**.

**`labels` (default off):** adds continent names only in the two reference configurations; it is ignored in `continent-retrieval`, which never answers its own task. **`showLatitudeLines`:** defaults on in `rainforest-pattern` and may be turned off; set it explicitly in another configuration only when the latitude lines are part of that slide's teaching. **`highlightSouthAmerica`:** adds the teaching ring without changing any label. **`label`:** optional caption beneath the map. The map is cropped to its ocean frame and legend and placed by its true aspect, so it fills a wide slide zone without distortion.

Zone class compatibility: fits A, B, C, D, E-wide, E-narrow and G. It is a wide map, so A, C or E-wide keeps the key and latitude labels most readable.

### `geographical-description-frame`

A reusable three-part writing frame for turning geographical evidence into a precise description. The task form is always blank and keeps these three visible sections: **Biome**, **Location**, and **Features from evidence**.

```json
{
  "type": "geographical-description-frame",
  "responseLines": { "biome": 2, "location": 2, "features": 3 }
}
```

The default prompts enforce the geographical structure: Biome asks what the word means and for one example; Location asks for the continent and more than one country; Features asks for two features, each linked to map or photograph evidence. Override wording with `headings` or `prompts`, keyed by `biome`, `location`, and `features`. Set each section's writing room with `responseLines` (1–6) or `responseHeights` (SVG units, 92–270); the same fields may instead sit inside `biome`, `location`, or `features` objects.

Optional `answers` or `reveals` may hold one answer string per section. They remain hidden unless the slide explicitly sets `mode: "answer"` or `showAnswers: true`; the stick-in renderer always forces task mode, so pupil copies stay blank even if an answer spec is copied accidentally.

Zone class compatibility: fits A, C and E-wide. The helper deliberately refuses strips, third-columns, narrow splits and small cards because shrinking all three prompts below the back-row reading floor would defeat the scaffold.

### `rainforest-layers`

A cross section of a tropical rainforest: four stacked horizontal bands, top to bottom — **emergent** (a few very tall, widely spaced trees with small crowns rising clear above everything else against pale sky), **canopy** (a continuous dense band of overlapping treetops forming an unbroken roof), **understorey** (thinner trunks and large leaves in dimmer green), **forest floor** (dark brown ground with leaf litter and roots, and almost nothing growing).

**The band tint is the lesson, not decoration.** The four bands step down in brightness — pale sky, bright green, dim green, dark brown — so a child sees the light thinning before anyone says it, and the picture still makes that point from the back of the room, on a working-wall print, and at small stick-in size. Every option below sits on top of that gradient; none of them replaces it.

Because the options compose, **one diagram carries a whole lesson**: the same figure appears slide after slide with a different option on, and children read it as one thing they are getting to know rather than five different pictures. The bare figure (no options) is the "what do you notice?" opener; `light` is the explanation; `highlight` narrows to half the diagram; `blank` is what the child draws and labels.

The full teaching version:
```json
{ "type": "rainforest-layers",
  "labels": true, "heights": true, "light": true,
  "label": "Light thins as it goes down" }
```

Two layers under discussion, the other two dimmed back:
```json
{ "type": "rainforest-layers", "labels": true, "highlight": ["understorey", "forest floor"] }
```

The write-on form:
```json
{ "type": "rainforest-layers", "blank": true }
```

**`labels` (default off):** prints the four layer names in a gutter beside their bands, each joined to its band by a short leader. UK spelling **"understorey"** is baked into the drawing, so no slide can ship the American "understory" whatever the spec says. **`heights` (default off):** prints each layer's height under its name - about 60 m, 30 to 45 m, 5 to 30 m, ground level - and turns the label gutter on by itself. **`light` (default off):** adds the sun above the canopy with arrows coming down that thin band by band (five reach the canopy, two get through it, one reaches the ground) plus the note "about 2 rays in every 100" printed on the forest floor; use it on the slide that explains *why* the lower layers are dark and sparse. **`notes` (optional):** a map of layer name to a short phrase, printed in house blue under that layer's name and joined to the band by the same leader: `"notes": { "canopy": "catches nearly all the light", "forest floor": "nearly dark, even at midday" }`. This is where a layer's *meaning* goes. The name says what a band is called; the note says what it is like, which is the part of the lesson children actually have to learn, so putting it on the figure keeps the explanation attached to the thing it explains and keeps it on the board for a teacher who never opens the speaker notes. It also removes the reason a Teach slide reaches for a paragraph in a side panel, which restates the labels and teaches nothing. Keep each note to a handful of words: it wraps to two short lines and shrinks to fit its band, so a long note renders but a second slide would carry it better. Layer names are as forgiving as `highlight`, and the gutter grows only as wide as the longest line so the picture stays tight. **`highlight` (optional):** a pair of layer names, e.g. `["emergent", "canopy"]` - those two stay full strength and the other two dim back, so a slide about half the forest points the eye at the half it is about. Layer names are forgiving (`"forest floor"`, `"forest-floor"` and `"floor"` all resolve). **`blank` (default off):** the **write-on** form - the same bands and trees with no names, and an empty ruled line beside each band; this is what the stick-in pack prints and what a "draw and label your own" slide should show. **`label` (optional):** a caption beneath the diagram, supporting the `||` answer reveal.

The diagram fills its zone by its true aspect (no deadspace). Unlabelled it is taller than it is wide, so it suits a narrow zone; with labels or heights on it is wider than tall, so give it a wide slot and the small print stays readable from the back of the room. It also works as a **key-vocabulary card visual**: put `{ "type": "rainforest-layers", "highlight": ["canopy"] }` beside the word "canopy" and the child sees where in the forest the word lives, not just a patch of green.

### `balanced-pattern-plate`

A broad proportional food-group pattern. The two largest areas are fruit and vegetables and starchy carbohydrates; protein and dairy or alternatives are smaller; oils and spreads is visibly very small. Water is shown beside the plate. Foods high in fat, salt or sugar sit in a clearly separate cue labelled **less often / small amounts**, never as a moral category. The default caption is **"Aim for this balance across a day or over time, not every meal."**

**The five proportions are the content, so nothing sets them.** What a lesson sets is the words in each space, and every space has a stated capacity, so you never have to guess how much will fit:

| Space | What goes in it | How much fits |
| --- | --- | --- |
| Each of the five groups | one label, plus up to four short example foods | measured and fitted: the label wraps to at most three lines and shrinks to a readable floor; a group whose share is too small to hold its words at that size moves to a labelled card beside the plate, joined to its own sector by a leader line |
| Each group, in practice mode | a dashed decision space instead of the label and examples | one blank per group, wherever that group's own words would have gone |
| The separate cue | one heading over the fixed "less often / small amounts" wording | wraps to three lines |
| The caption | one line under the whole picture | wraps to one line; set `""` to remove it |

Nothing is ever clipped and no label sits over a neighbouring sector: the drawing rearranges around the words it is given.

Teaching form:

```json
{ "type": "balanced-pattern-plate", "mode": "teaching" }
```

Partly-filled practice form:

```json
{ "type": "balanced-pattern-plate", "mode": "practice",
  "givenGroups": ["fruit-vegetables", "starchy-carbohydrates"] }
```

**`mode`:** `"teaching"` (default) labels every area and prints varied unbranded examples; `"practice"` preserves the exact same sector proportions and replaces the groups you leave out with dashed decision spaces. **`givenGroups`:** the groups that arrive already labelled; everything else is blank. **`blankGroups`:** the inverse, when it is shorter to name the blanks. Give one or the other, from `fruit-vegetables`, `starchy-carbohydrates`, `protein`, `dairy-alternatives`, `oils-spreads`. A practice plate with neither is blank throughout: which groups a lesson leaves out is a teaching decision, so the helper never picks it for you. **`groupLabels`:** optional map from group key to a short teaching label. **`examples`:** optional map from group key to up to four unbranded foods; an empty array removes that group's examples. Defaults include apple, carrot, peas, berries, potato, rice, pasta, bread, beans, eggs, fish, lentils, milk, yoghurt and soya drink. **`water`:** set `false` only when water is taught elsewhere on the same slide. **`caption`:** overrides the across-a-day wording; an empty string hides it. **`instruction`:** overrides the line above a practice plate. **`lessOftenLabel`:** overrides the descriptive heading on the separate less-often cue.

Use neutral, inclusive language. Do not add calorie counts, weight-loss aims, "good/bad" foods, or moral judgements. The helper fills a wide slot by its true aspect and is intended for the board and worksheets.

Zone class compatibility: fits A, B, C, D, E-wide, E-narrow, G. The plate is cropped tight to its own drawing and placed by its true proportions, so it fills the slot it is given; it is a wide figure, so a generous wide or near-square zone reads best.

### `geoboard`

A grid of evenly spaced pegs — dotty paper — with zero, one, or many straight-line shapes drawn on it by their vertices. A general-purpose maths workspace, not tied to one topic: blank dotty paper for children to draw on, a single shape to name, a square turned 45° so it sits on diagonal pegs (the "it's not a diamond — it's still a square" picture), or several shapes side by side to sort. Not limited to quadrilaterals — triangles, pentagons, irregular polygons and open line paths all work. Use for shape, area, perimeter, symmetry, coordinates-free plotting, and "how many different shapes can you make?" investigations. The pegs are deliberately unnumbered (unlike `coordinate-grid`); it is a free drawing surface, not a reflection task (unlike `reflection-grid`).

Pegs sit at every whole position, so a `cols`×`rows` board has `(cols+1)`×`(rows+1)` pegs. Coordinates run `x` across (0 = left) and `y` **up** (0 = bottom), the way a child plots on dotty paper.

Blank board (children draw their own shapes):
```json
{ "type": "geoboard", "cols": 5, "rows": 5, "label": "Draw two different quadrilaterals" }
```

A single shape to name (the bare `shape` shorthand is a closed, blue-outlined polygon):
```json
{ "type": "geoboard", "cols": 5, "rows": 5, "shape": [ [1,1], [4,1], [4,3], [1,3] ], "label": "Name this shape" }
```

A square rotated 45° on diagonal pegs ("it's not a diamond"):
```json
{ "type": "geoboard", "cols": 4, "rows": 4, "shape": [ [2,0], [4,2], [2,4], [0,2] ], "label": "Still a square!" }
```

Two shapes on one board, the second styled as a green answer:
```json
{ "type": "geoboard", "cols": 8, "rows": 5,
  "shapes": [
    { "points": [ [1,1], [3,1], [3,4], [1,4] ] },
    { "points": [ [5,1], [7,1], [6,4] ], "outline": "00B050", "fill": "D5F5E3" }
  ] }
```

A shape carrying property-notation marks — a parallelogram with two parallel pairs (single + double chevrons) and two equal-length pairs (single + double ticks):
```json
{ "type": "geoboard", "cols": 6, "rows": 4,
  "shape": {
    "points": [ [0,0], [4,0], [6,4], [2,4] ],
    "notation": {
      "arrows": { "0": 1, "2": 1, "1": 2, "3": 2 },
      "ticks":  { "0": 1, "2": 1, "1": 2, "3": 2 }
    }
  },
  "label": "Opposite sides parallel and equal" }
```

A square (or rotated square) marked as all-equal-sides with four right angles:
```json
{ "type": "geoboard", "cols": 4, "rows": 4,
  "shape": {
    "points": [ [2,0], [4,2], [2,4], [0,2] ],
    "notation": { "ticks": { "0": 1, "1": 1, "2": 1, "3": 1 }, "rightAngles": [0,1,2,3] }
  },
  "label": "Still a square" }
```

A shape with its lines of symmetry drawn on it — a kite with one vertical axis, revealed as an answer (green):
```json
{ "type": "geoboard", "cols": 4, "rows": 4,
  "shape": [ [2,0], [3,2], [2,4], [1,2] ],
  "symmetryLines": [ [[2,0], [2,4]] ],
  "symmetryLinesAnswer": true,
  "label": "One line of symmetry" }
```

**`cols` / `rows` (default 5 × 5):** grid size in squares, with a peg at every whole position. **`shape`:** convenience for a single shape — either the bare `[[x, y], …]` shorthand (a closed blue polygon) or one shape object (see below). **`shapes`:** an array of shape objects when you want more than one shape, or per-shape styling. Each shape object is `{ points, closed, outline, fill, width }` — **`points`** the `[[x, y], …]` vertices joined in order; **`closed`** (default `true`) a closed polygon, set `false` for an open path; **`outline`** the stroke colour (hex, no `#`, default house blue `0070C0`); **`fill`** an optional pale fill (hex, default none — use `D5F5E3` with outline `00B050` for a green answer shape); **`width`** a stroke-width multiplier (default 1); **`notation`** the standard British property marks that tell a child HOW a shape is classified (see next). **`notation` (per shape, optional):** an object with up to three keys. **`ticks`** — `{ "<edge>": count }`, equal-side dashes across an edge midpoint; edges sharing a count are equal in length (one dash on the first equal group, two on the second, etc.), drawn in black. **`arrows`** — `{ "<edge>": count }`, parallel-pair chevrons (›) mid-edge pointing along the edge; edges sharing a count are parallel (single chevron = first pair, double = second pair), in house blue. **`rightAngles`** — `[v, …]`, vertex indices that carry the small right-angle square (90°) tucked into the corner, in house blue. **Edge index `i`** is the edge from point `i` to point `i`+1 (the last wraps back to point 0); **vertex index `i`** is point `i`. When an edge carries both a tick group and an arrow group they are offset either side of the midpoint so both stay readable. The `shape` object form and every entry of `shapes` accept `notation` (the bare `[[x,y],…]` array shorthand can't — use the object form when a shape needs marks). **`emphasiseVertices` (default false):** draws a bolder peg under each shape vertex, so the pegs a shape sits on stand out. **`symmetryLines` (optional):** an explicit list of lines of symmetry to overlay as dashed lines, each a `[[x1,y1],[x2,y2]]` segment in the same peg coordinates the shapes use (`x` across from the left, `y` up from the bottom). A geoboard shape is arbitrary, so its axes can't be auto-derived — you supply them; an empty or absent list draws nothing (a shape with no line of symmetry is correct and simply shows none). **`symmetryLinesAnswer` (default false):** set `true` to draw those lines in answer-reveal green (the same green the `||` reveal uses) for an answer slide; leave it off and they draw in a neutral dark colour for a question slide. **`label`:** optional caption below the grid (supports the `||` answer reveal). Omit `shape`/`shapes` entirely for a blank board. Give it a roughly square zone (or a wider one for a wide board); the picture sizes itself to fill the slot by its true proportions.

### `measuring-jug`

A measuring jug with a vertical graduated scale — the "read the level" / "mark 250ml" capacity diagram the round `dial-scale` can't represent. 0 sits at the bottom and the scale climbs to `max`, with numbered major ticks and smaller ticks between. Leave `value` off for an empty jug the child marks; set it on the answer slide to reveal the level in colour, so one object renders question and answer.

Question (blank jug to mark):
```json
{ "type": "measuring-jug", "max": 400, "majorEvery": 100, "minorEvery": 50, "unit": "ml", "label": "Mark 250ml" }
```
Answer (level revealed in green):
```json
{ "type": "measuring-jug", "max": 400, "majorEvery": 100, "minorEvery": 50,
  "value": 250, "unit": "ml", "levelColor": "00B050", "label": "250ml" }
```

**`max` (default 400):** the value at the top of the scale. **`majorEvery` (default max ÷ 4):** spacing of numbered ticks. **`minorEvery` (default majorEvery ÷ 2):** spacing of the small ticks between them. **`value`:** the liquid level to draw — omit for an empty jug. **`unit`:** shown at the top of the scale (e.g. "ml"). **`fillColor` / `levelColor`:** the liquid colour and the level-line/tag colour (default pale blue and blue; use green `00B050` to reveal a marked answer). **`label`:** caption under the jug. Give it a roughly upright zone so the jug stays taller than it is wide.

## 5. Zone class compatibility

Which content types fit which zone class.

| Content type | A | B | C | D | E-wide | E-narrow | F | G |
|---|---|---|---|---|---|---|---|---|
| `text`              | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `bullets`           | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `steps`             | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `vocab`             | ✓ | ✓ | ✓ |   | ✓ | ✓ |   |   |
| `image`             | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `map`               | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `table`             | ✓ | ✓ | ✓ |   | ✓ |   |   |   |
| `mult-grid`         | ✓ | ✓ | ✓ |   | ✓ |   |   |   |
| `matching`          | ✓ | ✓ | ✓ |   | ✓ |   |   |   |
| `numberline`        | ✓ | ✓ | ✓ |   | ✓ | ✓ |   |   |
| `place-value-chart` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `fraction-wall`     | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `part-whole-model`  | ✓ | ✓ | ✓ |   | ✓ | ✓ |   |   |
| `bar-model`         | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `blank-surface`     | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `method-frame`      | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `money`             | ✓ | ✓ | ✓ |   | ✓ | ✓ |   | ✓ |
| `numbered-questions`| ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `question-cards`    | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `callout`           | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `chip-bank`         | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `sort-board`        | ✓ | ✓ | ✓ |   | ✓ |   |   |   |
| `evidence-cards`    | ✓ | ✓ | ✓ |   | ✓ |   |   |   |
| `pyramid`           | ✓ | ✓ | ✓ |   | ✓ |   |   |   |
| `clock`             | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `diamond-nine`      | ✓ |   | ✓ |   | ✓ |   |   |   |
| `continuum-line`    | ✓ | ✓ | ✓ |   | ✓ |   |   |   |
| `fishbone`          | ✓ |   | ✓ |   | ✓ |   |   |   |
| `concept-map`       | ✓ |   | ✓ |   | ✓ |   |   |   |
| `source-pathway`    | ✓ |   | ✓ |   | ✓ |   |   |   |
| `coordinate-grid`   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `polygon`           | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `translation-grid`  | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `translation-shape` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `shaded-fraction`   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `dial-scale`        | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `line-graph`        | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `number-network`    | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `area-grid`         | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `reflection-grid`   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `grid-map`          | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `rainforest-layers` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `geographical-description-frame` | ✓ |   | ✓ |   | ✓ |   |   |   |
| `geoboard`          | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `measuring-jug`     | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `tally-chart`       | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `bar-chart`         | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `pictogram`         | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `circuit-diagram`   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `circuit-symbol-bank` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ |
| `sc-panel`          | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |
| `label-diagram`     | ✓ | ✓ | ✓ | ✓ | ✓ |   |   | ✓ |

If the slide-designer assigns a content type to an incompatible zone, the builder refuses the pairing with `CONTENT_ZONE_INCOMPATIBLE` rather than replacing the requested content with text. The slide-designer should validate class fit before emitting the spec. One trap worth naming: `label-diagram` is the only figure that refuses E-narrow, so a labelled diagram in the narrow side of a split is refused rather than rendered as the literal text "[label-diagram]".

**Read this table before authoring, not after building.** The builder now draws every slide once into a presentation nobody opens, before it writes anything, and reports what it found:

- a pairing this table rejects is `CONTENT_ZONE_INCOMPATIBLE`, naming the slide. The content is never removed or moved to make it fit — an unexpected pairing is either a fault in this table or a fault in the authoring, and which one it is decides who fixes it.
- a slide that cannot be drawn at all is `LAYOUT_PREFLIGHT_FAILED`, or the helper's own named signal where it has one (`STEP_TEXT_OVERLOAD` and the rest keep their names, because they go to different owners).

Nothing is published while either is outstanding, so a slide that would have shipped blank is found before a file exists rather than after.

**Two capacity checks preserve every word and item.** `FIXED_CAPTION_CAPACITY` and `SUCCESS_CRITERIA_CAPACITY` never shorten, remove or rewrite content. The ordinary builder reports them as warnings. The Slide Designer's final `check-slide-design.js` gate treats them as blocking composition diagnostics because a candidate may not be promoted while either fixed surface is below its readable capacity. The Slide Designer must change layout, allocate more space or split faithfully. It must not edit source-authored wording or remove referenced criteria.

---

## 6. Template-layer settings

How to *choose* a template is the slide-designer's Step 3, and it lives in the agent file so the choice is made once, in one place. This section carries only the two settings the template layer itself owns.

### 6.1 Header mode choice

- If the slide is the starter (slide 1) — which carries the lesson's opening Date + LO in its header — use `headerStyle: "starter"` on whatever body template fits. There is no separate cover slide for the Date + LO; the starter header is where they live (see §2.1).
- Otherwise use `headerStyle: "title"` (default).

### 6.2 Stylistic-only choices

Some layouts are geometrically distinct but pedagogically indistinguishable (e.g. which corner a callout sits in, whether the hero zone is on the left or right). Flags like `primarySide` collapse these where possible. When genuinely arbitrary, the slide-designer picks for visual rhythm across the deck, not on principle.

---

## 7. Open questions / flags for review

- **Arrangement gaps.** Are there shapes the teacher uses in practice that aren't in §3? If yes, add them here.
- **Zone class refinement.** If content types have gained or lost zone compatibility in §5 in practice, correct the table.
- **Answer slides.** No dedicated "answer slide" template exists in this layer — the slide-designer reuses the originating template (or one of its family) with the answers filled in. Confirm this matches how you've taught and corrected.

---
