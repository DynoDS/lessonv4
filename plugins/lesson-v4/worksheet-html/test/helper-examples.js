"use strict";

// One realistic piece of content per helper, in one place, so the contract
// tests check every helper against something a lesson would actually carry
// rather than an empty object.
//
// Adding a helper without adding an example here makes the tests fail by name.
// That is deliberate: an untested helper should not slip in quietly.
//
// The subjects are mixed on purpose. A layout zone is geometry and knows
// nothing about what goes in it, and these examples are a standing reminder
// that a Venn sorts minibeasts as readily as quadrilaterals.

const PLANT = require("./fixtures-plant");

module.exports = {
  // ─── text ───
  instruction: {
    text: "Use the place value chart to help you.",
    blankWidthMm: 25,
  },
  questions: {
    // `text` is the instruction over the set. Numbering is `question: true`
    // and nothing else: the worksheet layer counts every marked question in
    // reading order and hands this helper its run of numbers. A designer never
    // writes a number - `startAt` exists but is the engine's own plumbing, and
    // showing it here would invite exactly the hand-numbered sheet the
    // numbering walk was built to end. `showNumbers` is plumbing too: the walk
    // turns it off for a lone helper item nested inside an outer numbered
    // question.
    question: true,
    text: "Answer these using the chart.",
    items: [
      "How many children chose football?",
      "Which material let the most water through?",
    ],
  },
  "written-answers": {
    // `phase` sets the ruled line height and is filled in from the year group
    // by the worksheet layer, so it is not shown here: a designer should not be
    // setting it, and showing it would invite them to. Numbering is
    // `question: true`, as with `questions` above.
    question: true,
    text: "Answer in full sentences.",
    items: [
      { text: "Explain how you know the answer is a multiple of four.", sentences: 2 },
    ],
  },
  steps: {
    // The title is the lesson's own wording for the panel. Left out it reads
    // "Success criteria", which is what the board calls it.
    title: "Use these steps to help you.",
    steps: [
      "Read the question: 10s or 100s?",
      "Find the 10s or 100s each side.",
      "Draw a number line. Mark your number.",
      "Find halfway. Before it or after it?",
    ],
  },
  "section-label": {
    text: "Fluency",
  },
  "source-text": {
    heading: "From the school log book",
    paragraphs: [
      "Attendance is poor this week. Many of the older boys are away at the harvest.",
    ],
    attribution: "Log book, October 1885",
  },

  // ─── tables ───
  "data-table": {
    caption: "What we know already",
    columns: ["Material", "Waterproof?"],
    rows: [
      ["Glass", "yes"],
      ["Cardboard", "no"],
    ],
    // All three are the designer's to ask for and the engine's never to
    // choose: a table is only compacted by someone who has looked at it.
    compact: true,
    compactCaption: true,
    note: "Results from our class test.",
  },
  "recording-table": {
    caption: "Test three more materials",
    columns: ["Material", "What happened", "Why"],
    // One entry per column, because these columns want different amounts:
    // the material is a word, what happened and why are sentences. A bare
    // string ("word", "tick", "sentence") still sizes every column alike.
    writing: ["word", "sentence", "sentence"],
    rows: [
      ["Foil", null, "It did not absorb water"],
      ["Cling film", null, null],
      ["Your choice", null, null],
    ],
    // Small print under the table, usually saying what to WRITE in a column.
    // A data table has always carried one; this table accepted the field and
    // printed nothing, so a lesson asking for a power source gave no clue what
    // one looks like. Same field, same place, same styling on both tables now.
    note: "Test each material the same way: same water, same time.",
  },

  // ─── drawn by the shared visual modules ───
  "bar-chart": {
    title: "Our favourite sports",
    categories: ["Football", "Swimming", "Tennis"],
    values: [12, 8, 6],
    yMax: 14,
    yInterval: 2,
  },
  venn: {
    label1: "waterproof",
    label2: "can be recycled",
    items: [{ region: "leftOnly", label: "Wax" }],
    showRegionHints: true,
  },
  angle: { degrees: 45, rotation: 0, arc: true },
  "bar-model": {
    shape: "part-whole",
    whole: { label: "24" },
    parts: [{ label: "8" }, { label: "16" }],
  },
  "blank-surface": { surface: "number-line", start: 0, end: 100 },
  carroll: {
    rowLabel: "has wings",
    rowNotLabel: "no wings",
    colLabel: "lays eggs",
    colNotLabel: "does not lay eggs",
    shapes: [],
  },
  "coordinate-grid": {
    cols: 10,
    rows: 10,
    points: [{ x: 3, y: 4, label: "A" }],
  },
  geoboard: { cols: 5, rows: 5, shapes: [] },
  "grid-map": {
    // The numbers label grid LINES, and a reference names the bottom-left
    // corner of a square, so a feature carries the square it sits in rather
    // than a pair of loose coordinates. Written the other way it drew an empty
    // grid and said nothing, which is how it reached a printed sheet.
    //
    // These particular numbers and places are ONE map, chosen for this example
    // and nothing else. Every reference document used to share a single worked
    // map (31-36 across, 51-55 up, a mill by a river), and lessons copied it so
    // faithfully that classes met the same river in every unit. A real lesson
    // invents its own: any plausible two-digit ranges, and a geography drawn
    // from the lesson's own context.
    eastings: [62, 63, 64, 65, 66],
    northings: [24, 25, 26, 27, 28],
    river: [
      [62, 27.4],
      [63.3, 26.7],
      [64.1, 26.2],
      [65.2, 25.3],
      [66, 24.5],
    ],
    features: [
      { name: "Harbour", square: [63, 25], type: "human" },
      { name: "Cliffs", square: [65, 27], type: "physical" },
    ],
  },
  "line-graph": {
    title: "Temperature through the day",
    points: [
      { x: 0, y: 4 },
      { x: 6, y: 11 },
      { x: 12, y: 17 },
    ],
    xLabel: "Hours",
    yLabel: "Degrees",
    xMax: 12,
    yMax: 20,
    xStep: 3,
    yStep: 5,
  },
  "line-pair": { relationship: "parallel", arrows: true },
  pictogram: {
    title: "Books read this term",
    categories: ["Blue", "Red", "Green"],
    values: [8, 6, 4],
    key: { per: 2 },
  },
  "rainforest-layers": {
    labels: true,
    heights: true,
    highlight: "canopy",
  },
  "balanced-pattern-plate": {
    mode: "practice",
    givenGroups: ["fruit-vegetables", "starchy-carbohydrates"],
    groupLabels: { protein: "Protein foods" },
    examples: { "fruit-vegetables": ["apple", "carrot", "peas", "berries"] },
    caption: "Aim for this balance across a day or over time, not every meal.",
  },
  "reflection-grid": {
    cols: 10,
    rows: 10,
    mirror: "vertical",
    shape: [
      { x: 2, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 5 },
    ],
  },
  "tally-chart": {
    title: "How we travel to school",
    headers: ["Way to travel", "Tally", "Total"],
    rows: [
      { label: "Walk", tally: 12 },
      { label: "Car", tally: 7 },
      { label: "Bus", tally: 4 },
    ],
    showTotals: true,
  },
  "translation-shape": {
    cols: 10,
    rows: 10,
    points: [
      { x: 1, y: 1 },
      { x: 3, y: 1 },
      { x: 3, y: 3 },
    ],
    translate: { x: 4, y: 2 },
    showImage: true,
  },
  triangle: { kind: "isosceles", ticks: true, angleArcs: true },
  "label-diagram": {
    text: "Label the parts of the plant.",
    imageHref: PLANT.href,
    imageWidth: PLANT.width,
    imageHeight: PLANT.height,
    // Anchors are percentages of the picture, so they travel with it whatever
    // size it prints at.
    //
    // Every callout says which of the two jobs it is doing, and the worksheet
    // check refuses a sheet where one does not. "given": false is a blank
    // line the child writes on; "given": true prints the word beside the
    // object as reading support. They mix freely, and this example mixes them:
    // "stem" is handed over so the child has a worked one to copy the shape
    // of, and the other four are the task. A callout with no "given" at all
    // silently becomes blank, which turned a Below sheet's promised food
    // names into two unanswered lines.
    labels: [
      { anchor: [37, 31], label: "petal", given: false },
      { anchor: [50, 31], label: "flower", given: false },
      { anchor: [40, 61], label: "leaf", given: false },
      { anchor: [50, 50], label: "stem", given: true },
      { anchor: [50, 90], label: "roots", given: false },
    ],
  },

  // ─── drawn here, as inline SVG ───
  "clock-row": {
    clocks: [
      { time: "3:45", hands: true },
      { time: "11:00", hands: true },
      { hands: false },
    ],
    letters: true,
  },
  "number-line": {
    start: 0,
    end: 100,
    interval: 10,
    labels: "ends",
    boxes: [30, 70],
  },
  "fraction-bar": {
    bars: [
      { numerator: 3, denominator: 4, label: "3/4" },
      { numerator: 2, denominator: 5, label: "2/5" },
    ],
  },

  // ─── things a child writes on or into ───
  "multiple-choice": {
    text: "Which of these is a multiple of four?",
    options: ["14", "16", "18", "22"],
    select: "one",
  },
  "drawing-space": {
    text: "Design a balanced lunchbox. Draw four foods, label each one, and add an arrow saying why you chose it.",
    // How much surface the work needs, said in the work's own terms. State
    // `heightMm` instead when you already know the surface you want, and
    // `areas: ["Uses electricity", "Works by hand"]` when it has named parts.
    draw: 4,
    annotate: true,
  },
  "sort-grid": {
    text: "Sort these into the right column.",
    columns: ["Waterproof", "Not waterproof"],
    rows: 4,
    // A bank entry is a bare word, or { word, imagePath } when the child
    // should SEE the thing as well as read it - the below sheet's access
    // route. Mixed banks are legal: a word with no true picture goes bare.
    wordBank: [
      { word: "foil", imagePath: "photos/foil.jpg" },
      "paper",
      "wax",
      "wool",
    ],
  },
  "column-method-grid": {
    operator: "+",
    top: 3456,
    bottom: 1278,
    showHeadings: true,
  },

  // ─── the formal written methods ───
  "short-multiplication-grid": {
    id: "3",
    top: 346,
    multiplier: 7,
  },
  "long-multiplication-grid": {
    id: "5",
    top: 428,
    bottom: 36,
  },
  "bus-stop-grid": {
    id: "7",
    divisor: 4,
    dividend: 936,
  },
  "long-division-grid": {
    id: "9",
    divisor: 23,
    dividend: 8142,
  },
  "method-frame": {
    id: "1",
    text: "Use the adjusting strategy to work out **148 + 99**.",
    title: "Adjusting strategy",
    // One line carrying a given value AND a blank, on purpose: a change that
    // stopped rendering either one would show up here.
    lines: [
      { label: "First, add:", content: "148 + 100 = ___" },
      { label: "Then, adjust:", content: "___ - 1 = ___" },
    ],
  },

  // ─── comparing and ordering ───
  "compare-row": { left: "2.3", right: "7.1" },
  "comparison-target": {},
  "inequality-with-boxes": {
    text: "Write digits that make this true.",
    expression: "5 . □ 2 < 5 . □ 8",
  },
  // Terms and operators, in the order the sentence reads. A string between two
  // terms is the operator. Each term states exactly one of `value` (handed to
  // the child), `text` (a word they read), `blank` (somewhere to write, sized
  // by `chars`) or `cells` (a digit frame, one cell per digit), and a term
  // stating two is refused. The summands stay in the order the question asked
  // them in; nothing here sorts, evaluates or fills anything.
  "number-sentence": {
    question: true,
    text: "Write the whole number for this addition.",
    terms: [
      { value: 9 },
      "+",
      { value: "4,000" },
      "+",
      { value: 50 },
      "+",
      { value: 200 },
      "=",
      { cells: 4 },
    ],
  },
  "order-numbers": {
    numbers: ["0.9", "0.34", "0.6", "0.07"],
    separator: "<",
    prompt: "Order from smallest to largest.",
  },
  "order-table": {
    text: "Order these decimals from smallest to largest.",
    numbers: ["0.6", "0.06", "0.60", "0.16"],
    topLabel: "Numbers",
    bottomLabel: "Smallest to largest",
  },
  "data-table-with-ordering": {
    text: "Four children jumped in PE.",
    rows: [
      { label: "Child", values: ["Kai", "Mia", "Leo", "Ava"] },
      { label: "Jump (m)", values: ["0.85", "0.7", "0.68", "0.9"] },
    ],
    ordering: { leftLabel: "Shortest", rightLabel: "Longest", blanks: 4, separator: "<" },
  },
  "circle-the-answer": {
    prompt: "Circle the larger decimal.",
    options: ["0.48", "0.6"],
  },

  // ─── place value and puzzle grids ───
  "place-value-counter-chart": {
    columns: ["ones", ".", "tenths"],
    counts: { ones: 3, tenths: 4 },
  },
  "base-ten-blocks": {
    counts: { thousands: 2, hundreds: 4, tens: 3, ones: 6 },
  },
  // The counters on their own, under the claim they are evidence for. Two of
  // these sit side by side where two charts could not. `statement` is the
  // claim exactly as the question words it; the groups depict one side of it,
  // and which side is a design decision made upstream, not by this helper.
  "counter-group": {
    statement: "5,009 = 5,000 + 9",
    joiner: "+",
    groups: [
      { value: "1000", count: 5 },
      { value: "1", count: 9 },
    ],
  },
  // The lesson shape this helper exists for: a number handed over, then the
  // same number ten more, with the digit that changed picked out, then a row
  // left empty for the child. `instances` (several identical EMPTY charts side
  // by side) is the other way to use it and is described in the fields.
  "place-value-chart": {
    columns: ["Th", "H", "T", "O"],
    rows: [
      { label: "3,462", cells: ["3", "4", "6", "2"] },
      { label: "10 more", cells: ["3", "4", "7", "2"], highlight: ["T"] },
      { label: "100 more", cells: [] },
    ],
  },
  "digit-cards": { digits: [0, 3, 4, 7] },
  "times-table-grid": {
    operator: "×",
    colHeaders: ["3", "4", "6", "8"],
    rowHeaders: ["2", "5", "7"],
    // A blank product is found by multiplying its two headers. A blank HEADER
    // is the harder, inverse variant, so this example carries one of each.
    cells: [
      ["6", "", "12", "16"],
      ["15", "20", "", "40"],
      ["21", "28", "42", ""],
    ],
  },
  "number-pyramid": {
    rows: [[""], ["14", "20"], ["", "8", "12"]],
  },

  // ─── fractions and money ───
  "stacked-fraction": {
    text: "Continue the sequence.",
    fractions: [{ num: 1, den: 4 }, { num: 2, den: 4 }, "?", { num: 4, den: 4 }],
    separator: ",",
  },
  "fraction-sequence": {
    fractions: [{ num: 1, den: 2 }, "?"],
    separator: "=",
  },
  "coin-strip": {
    text: "Sam has these coins. How much money does he have?",
    coins: ["£2", "£1", "20p", "20p", "10p"],
    answerLine: true,
  },
  "part-whole-money": {
    text: "£1.40 + £2.30",
    whole: {},
    parts: [{ label: "£1.40" }, { label: "£2.30" }],
  },
  "part-whole": {
    // Every node says which of the three it is, and the helper refuses one
    // that does not. `value` is handed over and prints in the given colour;
    // `blank: true` is the question and stays empty; `caption` names the node
    // from OUTSIDE the box, so it can never be read as an answer already
    // written in. `blankChars` sizes the box for what goes in it.
    whole: { value: "6,731" },
    joiner: "+",
    parts: [
      { blank: true, caption: "Thousands" },
      { blank: true, caption: "Hundreds" },
      { blank: true, caption: "Tens" },
      { blank: true, caption: "Ones" },
    ],
  },
  "chip-bank": {
    text: "Choose a word from the bank.",
    title: "Word bank",
    chips: ["square", "rectangle", "rhombus", "parallelogram", "trapezium"],
  },

  // ─── geometry and measures ───
  shape: {
    type: "rectangle",
    aspect: 2.5,
    labels: { top: "8 cm", right: "3 cm" },
  },
  "triangle-square": { triangles: ["55", "75"], square: "" },
  "turn-diagram": {
    turns: [
      { quarters: 1, direction: "clockwise" },
      { quarters: 2, direction: "clockwise" },
      { quarters: 1, direction: "anticlockwise" },
      { quarters: 3, direction: "clockwise" },
    ],
    letters: true,
  },
  // A ruler prints at TRUE SIZE and refuses a zone too narrow to hold it, so
  // this example is 10cm of real paper, not a drawing of 10cm.
  ruler: {
    end: 10,
    majorInterval: 1,
    minorInterval: 0.5,
    unit: "cm",
    object: { from: 0, to: 6 },
  },

  // ─── thinking diagrams ───
  "circuit-diagram": {
    text: "Look at each circuit. Will the lamp light?",
    // The states are MIXED on purpose. A row that is all gaps teaches a child
    // to spot a pattern rather than to check for a complete loop and a cell,
    // which is the opposite of what the question is for.
    circuits: [
      { label: "A", state: "complete" },
      { label: "B", state: "gap" },
      { label: "C", state: "no-cell" },
    ],
  },
  "classification-key": {
    text: "Use the key to name each minibeast.",
    tree: {
      q: "Does it have wings?",
      no: {
        q: "More than 6 legs?",
        no: { leaf: "ANT" },
        yes: { leaf: "SPIDER" },
      },
      yes: {
        q: "Spotted body?",
        no: { leaf: "BEE" },
        yes: { leaf: "LADYBIRD" },
      },
    },
  },
  "process-chain": {
    text: "Write the food chain in order. Use the word bank.",
    // A given first box and blanks after it: the "complete the sequence" shape.
    boxes: ["grass", null, null],
  },

  // ─── joining one thing to another ───
  "match-up": {
    text: "Draw a line from each material to the group it belongs in.",
    left: [
      // A literal symbol the designer wrote, printed as given. The engine
      // reserves the slot and never decides what a symbol means.
      { label: "chocolate", symbol: "●" },
      { label: "steam" },
      { label: "foil" },
      { label: "juice" },
      { label: "helium" },
    ],
    right: [{ label: "Solid" }, { label: "Liquid" }, { label: "Gas" }],
  },
  "card-row": {
    text: "Use an atlas to find where each plant grows.",
    blankWidthMm: 25,
    columns: 3,
    cards: [
      {
        title: "Cacao",
        caption: "Amazon River basin, southern Mexico",
        // One card carries a real picture, and a PORTRAIT one on purpose: a
        // card's image draws at the photo's own aspect (`height: auto`), so
        // the browser check must exercise an aspect well away from any flat
        // guess. A square Amazon photo measured with a 0.6 ratio shipped cut
        // in half at the bottom of its zone.
        imageHref: PLANT.href,
        imageWidth: PLANT.width,
        imageHeight: PLANT.height,
        // Fractions of the FILE that are not evidence, trimmed before the
        // picture is placed: studio white beside an object, a slab of sky, a
        // museum label. Authored after looking at the photograph; never a way
        // to keep part of a source out of the lesson.
        crop: { left: 0.05, right: 0.05 },
      },
      { title: "Coffee", caption: "Ethiopia, South America, Sudan" },
      { title: "Orchids", caption: "Central and South America" },
    ],
    // Every picture in a row is drawn to one height, so a child comparing them
    // compares the objects and not the framing. Two ways to say otherwise:
    // `imageHeightMm` states the height outright, and `imageFit: "canvas"` puts
    // every picture back at its full card width, for the comparison where the
    // difference in size is itself the evidence.
    imageHeightMm: 34,
    // Asked for once, repeated on every card: "write why beside each one" is
    // one instruction to a child, not three.
    writeLabel: "Because...",
    markLabel: "Tick if it grows in the rainforest",
  },
  timeline: {
    text: "Place each artefact in the correct era.",
    caption: "The Stone Age",
    eras: [
      { label: "Palaeolithic", from: 0.02, to: 0.42 },
      { label: "Mesolithic", from: 0.46, to: 0.72 },
      { label: "Neolithic", from: 0.76, to: 0.98 },
    ],
    marks: [
      { at: 0.02, label: "2,000,000 years ago" },
      { at: 0.44, label: "12,000 years ago" },
      { at: 0.74, label: "6,000 years ago" },
      { at: 0.98, label: "4,000 years ago" },
    ],
  },

  // ─── places a child writes into ───
  "speech-scene": {
    text: "Write a reply that says no firmly and with respect.",
    turns: [
      { speaker: "Jacob", says: "Can I share this photo of us online?" },
      { speaker: "Aisha", side: "right", lines: 3 },
    ],
  },
  // One person, one claim, and the child judging it - which is a different
  // shape from a conversation and used to be built as one. Wording the
  // instruction "tick or cross" is what asks for the box, exactly as it is in a
  // speech scene: two ways of saying it would be two ways to disagree.
  "named-claim": {
    text: "Tick or cross, then explain how you know.",
    speaker: "Ethan",
    says: "If I add 1,000 to 4,382, the hundreds digit changes.",
    lines: 3,
  },
  // Both forms of a field, so the contract tests exercise the scaffolded path
  // and the catalogue shows a designer that it exists. A bare string is the
  // expected sheet; the object form is what carries a below sheet.
  "fact-file": {
    title: "Country fact file",
    fields: [
      "Name of country",
      "Capital city",
      {
        name: "Population",
        hint: "About ... people live there.",
        wordBank: ["thousand", "million"],
      },
      "Official language(s)",
    ],
  },
  "writing-frame": {
    shape: "tag",
    text: "Write a label so your artefact can be displayed in a museum.",
    starters: [
      { text: "This is a …", lines: 1 },
      { text: "It is made from …", lines: 1 },
      { text: "It was used for …", lines: 2 },
    ],
  },
  storyboard: {
    text: "Draw and write to show the journey of a cocoa bean.",
    count: 6,
    columns: 2,
    lines: 2,
  },

  map: {
    // The base is a real shipped map asset; everything else is a mark placed
    // on it in fractions of that image. This worked example shows the
    // full-width landscape continents-and-oceans write-on form: the
    // world-with-antarctica asset, 7 numbered continent markers, 5 lettered
    // ocean markers with the Pacific repeated at both edges, 3 dashed
    // sea-initial spaces, and the Equator, compass and joined-edge cues.
    // The ordinary annotated form (map: "south-america", basin, labels,
    // annotations) still works exactly as before - omit worksheetMode.
    map: "world-with-antarctica",
    worksheetMode: "continents-and-oceans",
    heightMm: 138,
    continentMarkers: [
      { marker: "1", at: [0.208, 0.25] },
      { marker: "2", at: [0.333, 0.583] },
      { marker: "3", at: [0.556, 0.222] },
      { marker: "4", at: [0.556, 0.472] },
      { marker: "5", at: [0.75, 0.278] },
      { marker: "6", at: [0.875, 0.639] },
      { marker: "7", at: [0.5, 0.933] },
    ],
    oceanMarkers: [
      { marker: "A", at: [0.417, 0.444] },
      { marker: "B", at: [0.722, 0.611] },
      { marker: "C", at: [0.069, 0.5], repeatAt: [0.944, 0.5] },
      { marker: "D", at: [0.5, 0.833] },
      { marker: "E", at: [0.5, 0.083] },
    ],
    seaInitialSpaces: [[0.55, 0.305], [0.292, 0.41], [0.508, 0.19]],
    showEquator: true,
    showCompass: true,
    joinedEdges: true,
  },

  // ─── cause, effect and evidence ───
  "cause-path-grid": {
    instruction: "Choose the best cause and effect.",
    headings: ["Cause", "Action", "Change", "Effect"],
    rows: [
      {
        prompt: "Cattle farming spreads into the forest.",
        choices: ["Trees are cleared", "Trees are replanted"],
        symbol: "arrow",
      },
      {
        prompt: "Heavy rain falls on bare soil.",
        choices: ["Soil washes away", "Soil stays put"],
      },
    ],
  },
  "evidence-chain-frame": {
    instruction: "Use the evidence to decide where action should stop.",
    actions: ["Logging", "Cattle ranching", "Road building"],
    evidenceRows: [
      {
        evidence: "Satellite photographs show new roads through the basin.",
        stopNow: ["Road building"],
      },
      {
        evidence: "The soil is bare and washing into the river.",
        stopNow: ["Cattle ranching"],
      },
    ],
  },
};
