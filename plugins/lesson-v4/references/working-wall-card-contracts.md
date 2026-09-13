# Working Wall Card Contracts

This file is the one owner of what a wall card may be: each card family's fields, an example, the wall-worthy criteria it must pass, its default orientation, and the visual primitives the builder draws. It is written for `scripts/working-wall-packet.py`, which copies into the Working Wall Designer's reference packet only the families and primitives a lesson can use, so the designer reads the contract for a worked example when the lesson models a method and never reads the contract for a mnemonic poster on a lesson that has none. Sections are cut by exact heading: keep one `### ` heading per card family under `## Card families` and one per primitive under `## Visual primitives`, named exactly as the builder's registry names them, because a family the registry renders and this file does not describe is a card nobody can specify, and the tests refuse that.

The judgement about which card earns a place, and how a card is combined, oriented and worded, lives in `agents/working-wall-designer.md` and the two wall reference files. This file carries the contract, not the judgement.

## The wall-worthy test

A card earns its place only when it passes all of its family's criteria below, and every card of every family also passes two general tests. The self-contained test: a child who missed the lesson can use the card alone, without the teacher, the slides or the worksheet. The visual gate: the card carries something a child recognises by sight, a legitimate P1 diagram, a legitimate P1 photo, or a genuine card-level P2 picture on a family that supports one, with the single exception of a step-by-step success-criteria card.

The wall is finite. The normal output is one coherent overview of the lesson's main learning; a second teaching card is exceptional and must do a genuinely different, repeatedly consulted job that the first cannot absorb. Never more than two teaching cards. Wall furniture (a banner, section headings) is produced only on an explicit request from the teacher or the spawn prompt and counts as physical output.

## Every card

An exact reference table carried over from a rendered teaching table is also a visual reference: its row/column relationships do the lookup job. It need not gain an unrelated picture. This applies only when the headers and rows match the slide table; putting arbitrary prose in cells does not meet the visual gate.

Fields that every card shares, whatever its family.

| Field | Notes |
|---|---|
| `topic` | Topic of the lesson — drives the output filename. |
| `yearGroup` | Year group — passed through for any year-aware styling. |
| `lessonSlug` | Slug used elsewhere in the pipeline; included for symmetry. |
| `rationaleNote` | One or two sentences explaining why these cards earn a place. Never printed; included on the orchestrator's final report so the teacher sees the reasoning. |
| `cards` | Array of 0–2 teaching cards. Empty when nothing is wall-worthy. One is the default; a second requires a distinct, durable job that cannot be combined without harming five-second readability. |
| `cards[].type` | One of `photoMapOverview`, `heroCallouts`, `causeCards`, `referenceTable`, `workedExample`, `stickyKnowledge`, `sentenceStem`, `misconception`, `vocabDefinition`, `vocabChips`, `equivalenceGrid`, `mnemonicPoster`, `labelledDiagram`, `sectionHeading`, `banner`. |
| `cards[].page.size` | Always `A3`. Every wall card prints at this size; write it on every card. |
| `cards[].page.orientation` | One of `landscape`, `portrait`. |
| `cards[].title` | Title bar text — short, child-facing. **5 words or fewer, 30 characters or fewer.** Long titles eat the body's space. For `vocabDefinition`, the title IS the term being defined (e.g. "Acute angle", "Denominator"). |
| `cards[].photo` | Optional on the panel families (`stickyKnowledge`, `workedExample`, `misconception`, `vocabChips`), where a missing file falls back to text with no grey placeholder. **Required, and checked before the build renders anything, on the overview families**: every `photoMapOverview` tile and its map, the `heroCallouts` hero, and each `causeCards` person. There the picture is the content, so the build refuses the whole wall and names each empty or unreadable slot. Path relative to `[WORKING_DIR]`. |
| `cards[].picture` | Optional P2 context picture from `context-pictures.md`, supported only on `stickyKnowledge`, `workedExample`, and `misconception`, whose existing photo/visual area is the safe home. In final `working-wall.json` it is either a resolved Educational SVG object with the publisher-returned `educationalSvgId`, `educationalSvgSlug` and `imagePath`, or a complete emoji object `{ "kind": "emoji", "value": "...", "alt": "..." }`. Never leave an unresolved Educational SVG request in the final file and never alter protected lesson wording to insert an emoji. |
| `cards[].decorations` | Optional P3 Educational SVG overlay, supported only on the exact six ordinary card types above. It never changes body fit or earns visual credit. |
| `cards[].visual` | Optional. A drawn diagram the builder generates from primitives - no Unsplash, no AI image. Supported primitives are listed under "Visual primitives" below: `clock`, `fractionCircle`, `fractionBar`, `numberLine`, `angleFan`, `turn-diagram`, `angle`, `line-pair`, `triangle`, `comparisonSymbol`, `triangle-square`, `venn`, `carroll`, `geoboard`, `reflection-grid`, `coordinate-grid`, `translation-shape`, `tally-chart`, `pictogram`, `bar-chart`, `line-graph`, `bar-model`, `grid-map`, `rainforest-layers`, `balanced-pattern-plate`, `place-value-chart`, `circuit-diagram`, `parachute-forces`. A tall or square primitive sits to the right of the panel; a wide one (roughly wider than it is tall) is placed full width beneath a full-width panel instead, where it prints as a short strip; the optional `label` field renders as a caption beneath the diagram (omit it and the renderer uses a sensible default - the time, the fraction, the degree value). The geometry primitives (`angle`, `line-pair`, `triangle`, `geoboard`, `reflection-grid`, `coordinate-grid`, `translation-shape`, `grid-map`, `rainforest-layers`, `balanced-pattern-plate`, `place-value-chart`, `circuit-diagram`, `parachute-forces`) are the same drawings the slides use, so the wall matches the board. Use a visual whenever the lesson's slide anchor is a drawn diagram and the primitive is supported (see "Diagrammatic LOs"). A `visual` may also carry a `callouts` array (see below) to turn it into a labelled anatomy poster - used by the `labelledDiagram` card. |
| `cards[].visual.callouts` | Optional array on a `visual`, the anatomy-poster annotations. Each entry points a leader line and arrow at a part of the diagram and prints its name in answer-green: `{ "part": "key", "label": "The key: what one symbol is worth" }`. Name the part one of two ways - `part` is a named anchor the primitive exposes (the `pictogram` offers `title`, `key`, `half`, and each category label, e.g. `"Monday"`), which is the robust choice because the geometry resolves the exact spot; or `anchor: [x, y]` is a raw percentage of the diagram for any primitive without named anchors yet. `label` is the printed name; optional `label_at: [x, y]` overrides placement; labels print (not blank) by default. Labels wrap to short lines and stack down the two side margins, so 3–4 callouts read cleanly. A callout naming a part the primitive doesn't expose fails the build outright, so a mistyped part surfaces loudly rather than vanishing; name only parts the primitive exposes. |
| `cards[].visualScale` | Optional. `"panel"` (default) or `"dominant"`. Default `panel` gives the panel ~60% of the card width and the visual ~40%, unless the visual is a wide one, in which case the panel runs full width and the visual is stacked beneath it as a strip - either way the right balance when the steps or body text are the main teaching surface and the diagram supports them. `dominant` flips the balance - the panel shrinks to ~32% and the visual fills the rest of the card. Reach for `dominant` when the diagram itself is the teaching surface and the panel content is more caption than instruction (a colour-coded clock-anatomy poster, a labelled fraction-circle reference, an angle-comparison chart). The Twinkl angle-poster pattern. Don't use `dominant` when the panel carries multi-step instructions children re-read while working - the steps will end up cramped. |

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


### referenceTable

**Wall-worthy criteria, all of which must pass:** Lesson uses a genuine reference table to support children during the work; Children repeatedly scan across shared fields and down records; Each row teaches itself with its example; Same columns as the slides/worksheets used; A diagram, flow, map or callout composition would not express the relationship more directly

**Default orientation:** **Landscape**: needs room for the column grid plus the example column without cramping

| Field | Notes |
|---|---|
| `cards[].columns` | Used by `referenceTable` only. Array of column header strings (typically 2 or 3). |
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

**Default orientation:** **Landscape**: needs room for steps without cramping

| Field | Notes |
|---|---|
| `cards[].items` | Used by `workedExample`, `stickyKnowledge`, `sentenceStem`, `misconception`, `mnemonicPoster`. One or more entries. For `mnemonicPoster`, each item is `{ "letter": "R", "phrase": "Read carefully", "colour": "9333EA" }` — `colour` optional (palette default). For all other types, `label` optional, `text` required. **For `sentenceStem`, items optionally carry `filled` — the fully-modelled version of the same stem with the blank completed.** Populate `filled` when the lesson-design models the completion (the My Turn slide shows the worked sentence, the SC carries the modelled version). The card prints the gappy text on top in black and the `filled` text directly beneath in the green panel accent so children read the pair as one card. Leave `filled` out when children are meant to invent their own completion; see `working-wall-preferences.md` for the full rule. |

Example:

```json
{
  "type": "workedExample",
  "page": {
    "size": "A3",
    "orientation": "landscape"
  },
  "title": "How to add fractions",
  "items": [
    {
      "label": "Step 1",
      "text": "Check the bottom numbers (denominators) match."
    },
    {
      "label": "Step 2",
      "text": "Add only the top numbers (numerators). Keep the bottom number."
    },
    {
      "label": "Worked example",
      "text": "2/5 + 1/5 = 3/5"
    }
  ],
  "photo": null
}
```

### labelledDiagram

**Wall-worthy criteria, all of which must pass:** Lesson's job is learning to *read* a diagram (a pictogram, clock, grid map, chart) — recognising its parts and what they mean, not calculating with it; The diagram is a supported primitive whose parts you can call out; The parts a child must recognise (and the one most often misread) are worth naming on the picture; Reach for this as the hero on "how to read a …" lessons, paired with a worked-example "how to find a value" card when the lesson also drills a method (see `working-wall-visual-language.md`, "The anatomy poster")

**Default orientation:** **Landscape**: the annotated diagram fills a wide card, labels stacked down the two side margins

| Field | Notes |
|---|---|
| `cards[].caption` | Optional. Used by `labelledDiagram` — one short line under the annotated diagram (e.g. "Read the key, count the symbols, then multiply"). |

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
| `cards[].definition` | Used by `vocabDefinition` only. One concise child-readable definition. It may use more than one short sentence when forcing it into one would damage accuracy. The visual is what shows what the term looks like; the definition is what it means. |
| `cards[].chips` | Used by `vocabChips` only. An array of 4–12 chip objects: `{ "word": "ten pence", "photo": "money/10p.png" }`. `word` is required and should be a short noun or noun-phrase (≤ 2 words, ≤ 12 characters reads cleanly). `photo` is optional — when present and the file exists, the renderer draws an image cue to the right of the word inside the pill, sized from the room the grid leaves: a four-chip card sits in two rows and its cues are inches across, a twelve-chip card sits in six and they are small. The word keeps the larger share of the pill either way. Photo filenames must already be listed in `photo-requirements.json`; missing files fall back gracefully (text-only pill). Use chip cards when the lesson introduces a *set* of related vocabulary children will use across the unit and the words don't each warrant a `vocabDefinition` card; see `working-wall-preferences.md` for the depth-vs-breadth rule. |


### vocabChips

**Wall-worthy criteria, all of which must pass:** Lesson introduces a *set* of 4+ related vocabulary words children will use across the unit (money words, body parts, weather words, science apparatus); Each word is concrete enough children can use it without a definition (already half-known, or meaning obvious in context); The words don't each warrant their own `vocabDefinition` card — central tier-3 concepts go on definition cards instead; Optional `photo` per chip pairs an image cue with the word; mix paired and plain chips rather than image-padding the whole grid

**Default orientation:** **Landscape**: a 2-column grid of short pills, sized for 4–12 chips per page

| Field | Notes |
|---|---|
| `cards[].chips` | Used by `vocabChips` only. An array of 4–12 chip objects: `{ "word": "ten pence", "photo": "money/10p.png" }`. `word` is required and should be a short noun or noun-phrase (≤ 2 words, ≤ 12 characters reads cleanly). `photo` is optional — when present and the file exists, the renderer draws an image cue to the right of the word inside the pill, sized from the room the grid leaves: a four-chip card sits in two rows and its cues are inches across, a twelve-chip card sits in six and they are small. The word keeps the larger share of the pill either way. Photo filenames must already be listed in `photo-requirements.json`; missing files fall back gracefully (text-only pill). Use chip cards when the lesson introduces a *set* of related vocabulary children will use across the unit and the words don't each warrant a `vocabDefinition` card; see `working-wall-preferences.md` for the depth-vs-breadth rule. |

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

### clock

Spec: `{ "type": "clock", "time": "8:50", "label": "10 to 9" }`

`time` as `H:MM` string. Omit `time` and pass `"hands": false` for an annotation-only blank face. Optional `label` renders as caption. Default caption is the time string. **Two extension flags for clock-reading lessons:** `"colourCoded": true` renders the hour hand in red and the minute hand in blue, with a matching colour-coded digital readout embedded below the face (red hour digit, blue minute digit). The colour mapping lets a child glance at the wall and see which hand maps to which half of the digital time. The text caption is suppressed automatically because the digital is already in the picture. `"minuteRing": true` adds an outer ring outside the 1–12 numerals carrying `:00 :05 :10 … :55` labels in blue, so children can read the minute value off the ring without multiplying by 5. Use both together on Year 2/3 clock-reading lessons; use `colourCoded` alone on Year 4+ lessons where children can multiply by 5 in their head but still benefit from the hand–digit mapping.

### fractionCircle

Spec: `{ "type": "fractionCircle", "numerator": 1, "denominator": 4 }`

A circle divided into `denominator` equal slices, the first `numerator` filled. Slices start at 12 o'clock. Optional `colour` as 6-char hex (default `EF4444` red). Default caption is `"1/4"`.

### fractionBar

Spec: `{ "type": "fractionBar", "numerator": 3, "denominator": 5 }`

A horizontal bar (Singapore-style bar model) divided into `denominator` equal vertical strips, the first `numerator` filled. Use for fraction-of-a-length lessons, comparing fractions, or anywhere the lesson teaches fractions on a bar rather than a circle. Optional `colour` (default red). Default caption is `"3/5"`.

### numberLine

The same number line the board draws, from the same fields: copy the slide's `numberline` object and change only `type`.

Spec: `{ "type": "numberLine", "start": 1200, "end": 2000, "interval": 200, "labels": "all", "answer": { "at": 1800, "text": "A = 1,800" } }`

`labels` is `"ends"`, `"all"` or a list of values; `answer` (one or a list) is a green dot on the line with its words above, the worked value a card shows; `arrow` points at a place; `jumps: [{ "from": 1200, "to": 1400, "label": "+200" }]` draws the blue hop along a space and `highlight: { "from": 1200, "to": 1400 }` shades one space. Both ends of a jump or highlight sit on marks, and a line carries jumps or points, not both. Use for ordering, rounding, reading a scale, fractions on a line, time intervals.

Cards written with the wall's older spelling (`from`, `to`, `step`, `marks: [{ "at": 7, "label": "7" }]`) still draw: every tick is labelled and each mark becomes an answer dot.

### angleFan

Spec: `{ "type": "angleFan", "degrees": 65 }`

Two rays meeting at a vertex with the angle between them filled and labelled with the degree value. `degrees` 1–359. Optional `colour` (default amber `FBBF24`). Default caption is `"65°"`. Use when the lesson shows the *measured* size; use `angle` (below) when the lesson asks children to *name* the angle.

### angle

Spec: `{ "type": "angle", "degrees": 40 }`

A single static angle to **classify** — two black arms with a blue arc marking the opening, or a blue right-angle square when `degrees` is 90. The acute / right / obtuse "types of angle" picture. `degrees` 1–179 only sets how open it is drawn (the number is never shown) — pitch it: clear acute ~35, near-right ~85, obtuse ~130. Optional `rotation` so a set isn't all one way up. Crops tight and fills its slot.

### line-pair

Spec: `{ "type": "line-pair", "relationship": "parallel", "form": "horizontal", "notation": "arrows" }`

A pair of straight lines to classify as **parallel / perpendicular / neither**. `form` — parallel: `horizontal`/`vertical`/`diagonal`; perpendicular: `cross`/`L`/`T`/`detached`; neither: `converging`/`slant`. `notation`: `"arrows"` (blue chevrons on a parallel pair) or `"right-angle"` (blue square at a perpendicular corner). Optional `unequal: true` (parallel, clearly different lengths), `rotation`. The identify-parallel-and-perpendicular picture. A wide pair fills the column.

### comparisonSymbol

Spec: `{ "type": "comparisonSymbol", "symbol": ">", "left": "5", "right": "3" }`

A bold `>`, `<`, or `=` symbol, optionally flanked by left and right values (renders as `5 > 3`). Omit `left`/`right` for the symbol alone, full canvas. Optional `colour` (default deep blue `1F4E79`). No default caption — the symbol is the visual.

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

A rotation diagram: an arrow sweeping a quarter, half, three-quarter or full turn about a centre, the "amount of turn" picture for shape and position lessons. Set `quarters` (1 to 4) or `amount` (`quarter` / `half` / `three-quarter` / `full`), and `direction` (`clockwise` / `anticlockwise`). The same drawing the slides and worksheets use, so the wall matches the board. Default caption names the turn (e.g. "quarter turn clockwise"). Crops tight and fills its slot.

### triangle-square

Spec: `{ "type": "triangle-square", "triangles": ["7", "5"], "square": "12" }`

The SATs part-whole puzzle: two stacked triangles (the `triangles` array) with arrows pointing into a `square` that holds their total. Leave exactly one of the three values as an empty string for the unknown a child works out. Use when the lesson recreates this exact paper question type, distinct from the circle-and-line `part-whole-model`. No default caption: the labelled diagram is the whole content. Crops tight and fills its slot.

### grid-map

Spec: `{ "type": "grid-map", "eastings": [47,48,49,50,51,52], "northings": [83,84,85,86,87], "river": [[47.3,86.7],[49,84.55],[51.8,83.2]], "features": [{ "name": "church", "square": [48,83], "type": "human" }], "highlightSquare": [48,83] }`

A schematic **river-town map on a numbered four-figure grid** - the anchor map a class reads human/physical features and four-figure grid references off across a geography/maths unit. The numbers sit **on the grid lines at the corners** (read along the bottom, then up the side), so the square named by `48 83` is the cell up-and-right of where those lines cross. `eastings`/`northings` are the line numbers (consecutive whole numbers); `river` is a list of `[easting, northing]` points (fractions allowed) drawn as a smooth blue river; optional `roads` is a list of such paths drawn grey; each `features` entry sits inside the cell whose bottom-left corner is its `square`, every marker and label in one neutral ink so the human/physical answer is never coloured in; optional `highlightSquare` rings one square's bottom-left corner for a "how to read a reference" reference card. The same drawing the slides and worksheets use, so the wall matches the board. A **wide** figure - reads biggest with `"visualScale": "dominant"` and a short panel. No default caption: the map carries its own numbers. Crops tight and fills its slot.

### rainforest-layers

Spec: `{ "type": "rainforest-layers", "labels": true, "heights": true, "light": true }`

A **cross section of a tropical rainforest** — four stacked bands, top to bottom: emergent (a few very tall widely spaced trees), canopy (an unbroken roof of overlapping treetops), understorey (thin trunks and large leaves), forest floor (dark ground, leaf litter and roots). The **band tint is the light gradient**, brightest at the top to near dark at the floor, which is exactly what makes it wall material: a child glancing up from their desk any day of the unit sees the light thinning without reading a word. On a **wall card set `labels: true`** (and `heights`/`light` when the unit turns on them) so the card is the finished anchor, not a blank. Never set `blank` on a wall card — the write-on form belongs in the child's book, and a wall of empty lines answers nothing. `highlight` (a pair of layer names) is for a slide narrowing to half the diagram, so leave it off a wall card, which should show the whole forest. UK spelling "understorey" is built into the drawing. The same drawing the slides, worksheets and stick-in pack use, so the wall matches the board. A **wide** figure once labelled — reads biggest with `"visualScale": "dominant"` and a short panel. No default caption: the diagram carries its own names. Crops tight and fills its slot.

### balanced-pattern-plate

Spec: `{ "type": "balanced-pattern-plate", "mode": "teaching" }`

The shared **balanced pattern plate** used on slides and worksheets, now available as a durable working-wall overview without changing its geometry or wording. Its five fixed sector shares preserve the intended broad pattern: fruit and vegetables and starchy carbohydrates are larger; protein and dairy or alternatives are smaller; oils and spreads are very small. The same measured labels and unbranded examples either fit inside their sector or move to the external gutter, so the wall never replaces the plate with a prose table. The water cue, separate foods-high-in-fat-salt-or-sugar cue, and default "across a day or over time" caption remain part of the teaching form. Use `mode: "teaching"` on the wall; practice blanks belong on the worksheet. Optional `groupLabels`, `examples`, `water`, `caption` and `lessOftenLabel` are the same fields documented for the slide helper. Use `visualScale: "dominant"` so the full plate and its measured labels remain readable across the room.

### parachute-forces

Spec: `{ "type": "parachute-forces", "canopyShape": "billowed-sheet", "largeCanopyWidthRatio": 3, "cordLengthRatio": 1, "loadSizeRatio": 1, "showEqualityTicks": true, "labels": { "largeCanopy": "More air to push out of the way", "smallCanopy": "Less air to push out of the way", "largeUpForce": "More air resistance", "smallUpForce": "Less air resistance", "downForce": "Gravity pulls down", "cords": "Same cord length", "loads": "Same load" } }`

A wide, front-view **model-parachute force comparison** for a unit anchor. The large billowed sheet is exactly three times the small one's width; corresponding cords are calculated to equal Euclidean length and carry matching ticks; both load blocks and both downward gravity arrows are equal. The longer upward arrow on the large canopy and shorter one on the small canopy show the qualitative difference in air resistance. Labels live outside the objects and point back with leaders. Use it as the finished explanation after practical results are pooled. This is a schematic model, not a photograph, and it deliberately contains no wind streaks, parafoils, people or aircraft. Keep every fixed ratio at the documented value: the renderer refuses a different canopy shape, unequal cords or unequal loads. Use `visualScale: "dominant"` so its labels stay readable across the room.

### circuit-diagram

Spec: `{ "type": "circuit-diagram", "cells": 1, "lamps": 1, "switch": "closed", "path": "complete", "label": "Complete circuit" }`

A **series circuit** in the standard primary symbols — cells as long and short plates, lamps as circles with crosses, buzzers as semicircles, switches clearly open or closed. Wall material for an electricity unit: the anchor a child checks their own circuit against all term. Use `circuits` (an array) for a comparison card — "this one lights, this one does not" — and keep each label short so it fits under its own circuit. The same strict drawing the slides and worksheets use, so the wall cannot disagree with the board about what an open switch looks like: state the cells, the components, the switch and the path explicitly, because the drawing refuses to invent, round or drop any of them. A **wide** figure once several circuits share a row. Crops tight and fills its slot.

### translation-shape

Spec: `{ "type": "translation-shape", "cols": 10, "rows": 8, "points": [[1,1],[1,4],[3,4],[3,3],[2,3],[2,1]], "translate": { "dx": 5, "dy": 3 }, "showImage": true }`

A **numbered coordinate grid** carrying a whole shape and its **translated image** — the signature translation picture. On a **wall reference card set `showImage: true`** so the card shows the worked translation: the original (solid house-blue), the image (lighter, dashed) slid by `translate`, and a dashed arrow between matching vertices making the slide visible. `points` are the original vertices (`[[x,y],…]` or `[{x,y},…]`), `translate` the `{ dx, dy }` slide in squares (positive right/up). Leaving `showImage` off draws the original only (a blank task, not wall material) — so a wall card should carry the image-shown form. Coordinates run x across (0 = left), y up (0 = bottom). The same drawing the slides, worksheets and stick-in pack use, so the wall matches the board. No default caption. Crops tight and fills its slot.

### coordinate-grid

Spec: `{ "type": "coordinate-grid", "cols": 6, "rows": 6, "points": [{ "x": 1, "y": 1, "label": "A" }, { "x": 5, "y": 1, "label": "B" }, { "x": 5, "y": 4, "label": "C" }, { "x": 1, "y": 4, "label": "D" }], "join": true }`

A **numbered first-quadrant coordinate grid** — squared paper numbered `0..cols` across and `0..rows` up, origin at (0,0). On a **wall reference card supply `points` (and `join: true` where the moment is a shape)** so the card shows a **worked example** — a plotted point (the "how to plot (3, 2)" anchor) or a shape joined on a numbered grid — not a blank practice grid. Each `points` entry is `{ x, y, label }` (the label is the letter or coordinate shown beside the red dot); `join: true` joins them in order into a closed pale-blue shape. Leaving `points` off draws a blank grid, which is a live practice surface, not wall material — so a wall card should always carry the plotted/joined form. Coordinates run x across (0 = left), y up (0 = bottom). The same drawing the slides and the stick-in pack use, so the wall matches the board. No default caption. Crops tight and fills its slot.

### place-value-chart

Spec: `{ "type": "place-value-chart", "columns": ["Th", "H", "T", "O"], "rows": [{ "label": "3,462", "cells": ["3","4","6","2"] }, { "label": "10 more", "cells": ["3","4","7","2"], "highlight": ["T"] }, { "label": "100 more", "cells": ["3","5","6","2"], "highlight": ["H"] }] }`

A **place value chart**: colour-coded columns across the top (the same colours the board uses), one row per number, each row captioned at the left by `label` with what it IS. `highlight` names the column whose digit changed and rings that cell in green. That ring is what makes this wall material rather than a grid: in the place-value units a class returns to all term (10 and 100 more or less, exchanging, rounding, multiplying and dividing by 10), the question is always WHICH column changes and which stay the same, and a card showing the starting number above the same number ten more and a hundred more, with the changed digit ringed, answers it at a glance from anywhere in the room. Write a chart the child can read off, not one to fill in: give every row its digits, since a wall of empty cells anchors nothing. The same drawing the slides use, so the wall matches the board. A **wide** figure, which reads biggest with `"visualScale": "dominant"`. No default caption: the row labels name the rows. Crops tight and fills its slot. **It draws two forms, and they do different jobs.** The `rows` form above is the ANCHOR: several numbers stacked, each captioned, compact enough that a card can hold a whole unit's worth and a class can read it all term. The `pair` form is the one that TEACHES one change, and it is the same picture the board draws: `"pair": { "operation": "10 more", "from": ["3","4","6","2"], "to": ["3","4","7","2"] }` gives a start chart, a bold arrow carrying the operation, and a result chart with the moved digit ringed in green and "same" under every column that held still, under a title bar reading the result off the cells. Give it only `from` and `to`: the moved column is worked out by comparing them, so a card can never ring a column that did not move, and an exchange (3,497 to 3,507) rings both without you having to notice. `title` overrides the title bar and `"title": ""` removes it. Reach for `pair` when the card's job is to show a change happening, and for `rows` when it is to anchor several numbers side by side; one pair is one comparison, so 10 more AND 100 more of the same number is two cards or one `rows` chart, never a chain of three charts.
