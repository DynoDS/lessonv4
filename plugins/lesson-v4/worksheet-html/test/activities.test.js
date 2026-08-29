"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { REGISTRY, renderHelper, measure, fits } = require("../src/helpers");
const { LAYOUTS } = require("../src/layouts");

// The helpers that JOIN things and the frames a child writes into.
//
// The shared contract tests in helpers.test.js already check that each of
// these renders, measures and states a minimum. What is tested here is the
// behaviour each one exists FOR, which a contract test cannot see: that a
// match-up has something to aim a line at, that a blank speech bubble is
// actually blank, that a storyboard's height follows its rows.

const COLUMN_MM = 87; // a half-width column on A4 portrait
const FULL_MM = 180; // the full printable width, portrait

// ─── match-up ────────────────────────────────────────────────────────────

test("a match-up gives every card a dot to aim the line at", () => {
  // Without these the sheet is two lists side by side and the child has
  // nothing to join. The dot IS the activity.
  const html = renderHelper({
    helper: "match-up",
    left: [{ label: "ice" }, { label: "steam" }],
    right: [{ label: "Solid" }, { label: "Gas" }],
  });
  const dots = html.match(/h-match-dot/g) || [];
  assert.equal(dots.length, 4, "every card needs its own dot");
});

test("a match-up is as tall as its LONGER column, not its shorter one", () => {
  // The two columns are almost never the same length: eight materials on the
  // left, three states of matter on the right. Measured from the shorter one,
  // the taller column runs off the bottom of the zone.
  const many = {
    helper: "match-up",
    left: Array.from({ length: 8 }, (unused, i) => ({ label: `item ${i}` })),
    right: [{ label: "Solid" }, { label: "Liquid" }, { label: "Gas" }],
  };
  const few = {
    helper: "match-up",
    left: [{ label: "item 0" }],
    right: [{ label: "Solid" }, { label: "Liquid" }, { label: "Gas" }],
  };
  assert.ok(measure(many, COLUMN_MM) > measure(few, COLUMN_MM));
});

test("a match-up leaves a real corridor to draw across, at any width", () => {
  // Daniel picked this out by eye on a printed sheet: at a fixed 14mm the two
  // columns all but touched, with the dots hanging into what little space was
  // left. The corridor is not a gap between two columns, it is the space the
  // activity happens in - eight lines have to cross it and still be told apart.
  const { css } = require("../src/helpers/matching");
  const gap = /\.h-match-cols \{[^}]*gap:\s*clamp\(([\d.]+)mm,\s*([\d.]+)%,\s*([\d.]+)mm\)/.exec(css);
  assert.ok(gap, "the corridor is not stated as a share of the width");

  const [, floor, share, ceiling] = gap.map(Number);
  assert.ok(floor >= 18, `a ${floor}mm corridor is too narrow to draw across`);
  assert.ok(share >= 15, `${share}% of the width is not a corridor`);
  assert.ok(ceiling > floor, "the ceiling must be above the floor");
});

test("a match-up fits a column, not only a full-width page", () => {
  // Daniel asked whether this fitted different zones and the honest answer was
  // no: a flat 100mm minimum refused every half-page column outright. A minimum
  // that follows the CONTENT lets a short-labelled sort share a page, while
  // long words still ask for the room they genuinely need.
  const short = {
    helper: "match-up",
    left: [{ label: "ice" }, { label: "steam" }],
    right: [{ label: "Solid" }, { label: "Gas" }],
  };
  const long = {
    helper: "match-up",
    left: [{ label: "photosynthesis" }, { label: "evaporation" }],
    right: [{ label: "Water cycle" }],
  };

  const HALF_PAGE_MM = 84;
  assert.ok(
    fits(short, HALF_PAGE_MM, 200).ok,
    "a short-labelled match-up must fit a half-page column"
  );
  assert.ok(
    REGISTRY["match-up"].needs(long).minWidthMm >
      REGISTRY["match-up"].needs(short).minWidthMm,
    "a long word must demand more width than a short one"
  );
});

test("a match-up with a long label allows for the line it wraps onto", () => {
  const short = { helper: "match-up", left: [{ label: "ice" }], right: [{ label: "Solid" }] };
  const long = {
    helper: "match-up",
    left: [
      {
        label:
          "water vapour rising from a kettle that has just been boiled on the hob",
      },
    ],
    right: [{ label: "Solid" }],
  };
  assert.ok(
    measure(long, COLUMN_MM) > measure(short, COLUMN_MM),
    "a label that wraps needs a taller card than one that does not"
  );
});

// ─── card-row ────────────────────────────────────────────────────────────

test("a row of cards needs more width the more cards share it", () => {
  // The mistake this guards against is the one a constant minimum always
  // makes: six cards across a page are not the same object as two.
  const two = { helper: "card-row", columns: 2, cards: [{ title: "a" }, { title: "b" }] };
  const six = {
    helper: "card-row",
    columns: 6,
    cards: Array.from({ length: 6 }, (unused, i) => ({ title: `c${i}` })),
  };
  assert.ok(
    REGISTRY["card-row"].needs(six).minWidthMm >
      REGISTRY["card-row"].needs(two).minWidthMm
  );
});

test("a row of cards is measured from its TALLEST card, not its average", () => {
  // Cards in a row sit on a shared baseline, so one card with a long caption
  // sets the height of every card beside it. Measured as an average, that card
  // runs past the bottom of the zone while the check reports no problem.
  const even = {
    helper: "card-row",
    columns: 2,
    cards: [{ title: "Cacao", caption: "Brazil" }, { title: "Coffee", caption: "Sudan" }],
  };
  const uneven = {
    helper: "card-row",
    columns: 2,
    cards: [
      { title: "Cacao", caption: "Brazil" },
      {
        title: "Coffee",
        caption:
          "Ethiopia, South America, Sudan, and the highlands of several other countries besides",
      },
    ],
  };
  assert.ok(measure(uneven, COLUMN_MM) > measure(even, COLUMN_MM));
});

test("a card's photo is measured at its own aspect, not a guessed one", () => {
  // The CSS draws a card's image at `width: 100%; height: auto` - the photo's
  // real proportions. The estimate used a flat 0.6 whatever the file held, so
  // a square or portrait photo drew far taller than it measured and the zone's
  // `overflow: hidden` cut the bottom off the card. A real lesson shipped with
  // Photo B sliced in half on every sheet that carried it.
  const base = { title: "Photo A", imageHref: "data:image/png;base64,x" };
  const landscape = {
    helper: "card-row",
    cards: [{ ...base, imageWidth: 1000, imageHeight: 600 }],
  };
  const square = {
    helper: "card-row",
    cards: [{ ...base, imageWidth: 800, imageHeight: 800 }],
  };
  const portrait = {
    helper: "card-row",
    cards: [{ ...base, imageWidth: 800, imageHeight: 1200 }],
  };
  const squareMm = measure(square, COLUMN_MM);
  assert.ok(
    squareMm > measure(landscape, COLUMN_MM),
    "a square photo is taller on the page than a landscape one, so it must measure taller"
  );
  assert.ok(
    measure(portrait, COLUMN_MM) > squareMm,
    "a portrait photo is taller again"
  );
  // The height a photo takes tracks its own height-over-width exactly - that
  // proportion IS the CSS's `height: auto`. Comparing differences between
  // three aspects cancels everything that is not the picture, so this pins the
  // estimate to the browser's arithmetic: (1.5 - 1.0) / (1.0 - 0.6) = 1.25.
  const portraitMm = measure(portrait, COLUMN_MM);
  const landscapeMm = measure(landscape, COLUMN_MM);
  const ratio = (portraitMm - squareMm) / (squareMm - landscapeMm);
  assert.ok(
    Math.abs(ratio - 1.25) < 0.01,
    `photo height must scale with the photo's own aspect; measured ${ratio.toFixed(2)}`
  );

  // A card whose natural size never arrived still measures something sane.
  const unknown = { helper: "card-row", cards: [{ ...base }] };
  const withoutImage = measure(
    { helper: "card-row", cards: [{ title: "Photo A" }] },
    COLUMN_MM
  );
  assert.ok(measure(unknown, COLUMN_MM) > withoutImage);
});

test("a card row can carry the dot that makes it half of a matching activity", () => {
  // Six plants along the foot of a page, each to be joined to a layer of the
  // diagram above. Without somewhere to aim, "draw a line from each plant" has
  // nothing to point at and the task quietly becomes a reading exercise.
  const withDot = renderHelper({
    helper: "card-row",
    dot: "top",
    cards: [{ title: "Coffee" }, { title: "Orchids" }],
  });
  assert.equal((withDot.match(/h-card-dot-top/g) || []).length, 2);

  // And a plain row of cards is still a plain row of cards.
  const plain = renderHelper({ helper: "card-row", cards: [{ title: "Coffee" }] });
  assert.ok(!plain.includes("h-card-dot"));

  // A side nobody defined must not silently place a dot in the wrong margin.
  const nonsense = renderHelper({
    helper: "card-row",
    dot: "sideways",
    cards: [{ title: "Coffee" }],
  });
  assert.ok(!nonsense.includes("h-card-dot"));
});

test("a reply bubble's tail points at the person saying it", () => {
  // With the figure moved to the right and the tail left where it was, every
  // reply pointed away from its own speaker and at the person who had just
  // finished, which reads to a child as the wrong person talking.
  const { css } = require("../src/helpers/frames");
  assert.match(
    css,
    /\.h-speech-right \.h-speech-bubble::before \{[^}]*right:/,
    "a right-hand speaker's tail must be pinned to the right"
  );
});

// ─── timeline ────────────────────────────────────────────────────────────

test("a timeline places its eras where the teacher put them", () => {
  // Positions are fractions the teacher supplies, NOT dates the helper works
  // out. A school timeline is almost never to scale, and one drawn to scale
  // from Stone Age dates would show the last two eras as hairlines.
  const html = renderHelper({
    helper: "timeline",
    eras: [{ label: "Neolithic", from: 0.75, to: 1 }],
    marks: [{ at: 0.5, label: "6,000 years ago" }],
  });
  assert.match(html, /left:75%/);
  assert.match(html, /width:25%/);
  assert.match(html, /left:50%/);
});

test("a timeline refuses to draw outside its own line", () => {
  // A fraction over 1 or under 0 would position a label off the edge of the
  // page, where it prints as a sliver or not at all.
  const html = renderHelper({
    helper: "timeline",
    eras: [{ label: "way past", from: -0.5, to: 4 }],
    marks: [],
  });
  assert.match(html, /left:0%/);
  assert.match(html, /width:100%/);
});

test("a date at either end of a timeline tucks inward instead of off the page", () => {
  // Found on a printed sheet, not by arithmetic. The first and last marks are
  // the two that matter most and they sit at the very ends of the line;
  // centred on their ticks like every other label, half of each hung off the
  // edge of the zone and was sliced away. The sheet opened with ",000 years
  // ago" and closed with "4,000 years" running into the margin.
  const html = renderHelper({
    helper: "timeline",
    eras: [],
    marks: [
      { at: 0, label: "2,000,000 years ago" },
      { at: 0.5, label: "12,000 years ago" },
      { at: 1, label: "4,000 years ago" },
    ],
  });
  const shifts = (html.match(/translateX\((-?\d+%?|0)\)/g) || []).map((s) =>
    s.replace(/translateX\(|\)/g, "")
  );
  assert.deepEqual(
    shifts,
    ["0", "-50%", "-100%"],
    "the first label must hang right, the last left, and the middle stay centred"
  );
});

test("a timeline carrying more dates needs more width to hold them apart", () => {
  const few = { helper: "timeline", eras: [], marks: [{ at: 0.5, label: "now" }] };
  const many = {
    helper: "timeline",
    eras: [],
    marks: Array.from({ length: 9 }, (unused, i) => ({ at: i / 9, label: `${i}` })),
  };
  assert.ok(
    REGISTRY.timeline.needs(many).minWidthMm >
      REGISTRY.timeline.needs(few).minWidthMm
  );
});

// ─── speech-scene ────────────────────────────────────────────────────────

test("a bubble the child fills is blank, and a printed one is not", () => {
  // The single thing this helper must never get wrong. A blank bubble that
  // arrives with the answer already in it is not an activity.
  const html = renderHelper({
    helper: "speech-scene",
    turns: [
      { speaker: "Jacob", says: "Can I share this photo?" },
      { speaker: "Aisha", lines: 3 },
    ],
  });
  assert.match(html, /h-speech-given/);
  assert.match(html, /h-speech-blank/);
  assert.equal((html.match(/h-speech-line/g) || []).length, 3);
});

test("a box holding given material hugs it; only a box the child fills takes the spare", () => {
  // One rule, two helpers, and it is not about looks. A large empty box on a
  // worksheet means "write in here", so a box grown past what it holds gives
  // the child the wrong instruction.
  //
  // The match-up card has kept this since Daniel picked it out: spare height
  // goes BETWEEN the cards, never inside them. The speech bubble was not
  // keeping it. Given a full-width zone it stretched to the whole page, so
  // "10 more than 72 is 73." was printed inside a bubble 174mm wide that read
  // as somewhere to write rather than as something Sam said.
  //
  // The exemption is the same in both: a blank bubble IS a writing space, and
  // every millimetre of it gets used.
  const matching = require("../src/helpers/matching").css;
  const frames = require("../src/helpers/frames").css;

  const card = /\.h-match-card\s*{[^}]*}/.exec(matching)[0];
  assert.match(card, /flex:\s*0 0 auto/, "a match-up card grows into the spare height");

  const given = /\.h-speech-given\s*{[^}]*}/.exec(frames)[0];
  assert.ok(!/flex:\s*1\b/.test(given), "a printed bubble still takes all the width offered");
  assert.match(given, /max-width:\s*[\d.]+mm/, "a printed bubble has no measure to stop at");

  // The behaviour, not only the styling: past its measure, more width changes
  // nothing about a printed bubble. If it did, the drawn bubble and the height
  // estimate would be measuring two different bubbles.
  const scene = {
    helper: "speech-scene",
    text: "Tick or cross.",
    turns: [{ speaker: "Sam", says: "10 more than 72 is 73." }],
  };
  assert.equal(
    measure(scene, FULL_MM),
    measure(scene, 260),
    "a printed bubble is still growing with the zone"
  );

  // And the estimate counts the lines the measure forces. A sentence too long
  // for the bubble wraps inside it, and a wrap nobody counted is a line drawn
  // outside the zone.
  const long = {
    ...scene,
    turns: [
      {
        speaker: "Sam",
        says:
          "When I find ten more than a number the tens digit always changes and the ones digit always stays exactly the same.",
      },
    ],
  };
  assert.ok(
    measure(long, 260) > measure(scene, 260),
    "a sentence that wraps inside the bubble is measured as one line"
  );
});

test("a scene that asks for a tick or a cross is given somewhere to put one", () => {
  // From a printed Below sheet. The question said "Tick or cross." and the
  // engine drew Sam's claim and a writing line, so the one thing the child was
  // asked to do had nowhere to happen. An instruction on a worksheet is a
  // promise about the paper.
  const asks = {
    helper: "speech-scene",
    text: "Tick or cross.",
    turns: [{ speaker: "Sam", says: "10 more than 72 is 73." }],
  };
  const doesNot = { ...asks, text: "Write a reply to Sam." };

  assert.match(renderHelper(asks), /h-speech-judge-box/);
  assert.ok(
    !renderHelper(doesNot).includes("h-speech-judge-box"),
    "a scene that asks for a written reply should not sprout an answer box"
  );

  // The box costs height, and the estimate has to say so or the zone clips it.
  // Checked against the CSS rather than against a number typed twice.
  const frames = require("../src/helpers/frames").css;
  const boxMm = Number(
    /\.h-speech-judge-box\s*{[^}]*height:\s*([\d.]+)mm/.exec(frames)[1]
  );
  const grewMm = measure(asks, COLUMN_MM) - measure(doesNot, COLUMN_MM);
  assert.ok(
    grewMm >= boxMm,
    `the box is ${boxMm}mm tall and the estimate allowed ${grewMm.toFixed(1)}mm for it`
  );
});

test("a taller phase gets taller writing lines in its bubble", () => {
  const lower = {
    helper: "speech-scene",
    phase: "lower",
    turns: [{ speaker: "A", lines: 3 }],
  };
  const upper = { ...lower, phase: "upper" };
  assert.ok(
    measure(lower, COLUMN_MM) > measure(upper, COLUMN_MM),
    "Years 1 to 3 write on taller lines than Years 4 to 6"
  );
});

// ─── fact-file ───────────────────────────────────────────────────────────

test("a fact file grows with the number of things it asks for", () => {
  const three = { helper: "fact-file", fields: ["a", "b", "c"] };
  const eight = {
    helper: "fact-file",
    fields: Array.from({ length: 8 }, (unused, i) => `field ${i}`),
  };
  assert.ok(measure(eight, COLUMN_MM) > measure(three, COLUMN_MM));
  assert.ok(
    REGISTRY["fact-file"].needs(eight).minHeightMm >
      REGISTRY["fact-file"].needs(three).minHeightMm
  );
});

test("a fact file's estimate counts every part of a field it draws", () => {
  // Found on a printed sheet, and the reason it is worth a test of its own:
  // the first estimate counted a line of text and the writing space, and left
  // out the padding and the rule between one field and the next. Two
  // millimetres a field sounds like nothing, and over five fields it sliced
  // the bottom off "Average rainfall" while the form still looked finished.
  const { css } = require("../src/helpers/frames");
  const declared = /\.h-ff-field \{[^}]*min-height:\s*([\d.]+)mm/.exec(css);
  assert.ok(declared, "a field declares no minimum height at all");

  const perField = Number(declared[1]);
  const one = measure({ helper: "fact-file", fields: ["a"] }, COLUMN_MM);
  const six = measure({ helper: "fact-file", fields: ["a", "b", "c", "d", "e", "f"] }, COLUMN_MM);

  assert.ok(
    Math.abs((six - one) / 5 - perField) < 0.01,
    `the estimate allows ${((six - one) / 5).toFixed(1)}mm a field but the CSS draws ${perField}mm`
  );
});

// ─── writing-frame ───────────────────────────────────────────────────────

test("a sentence starter carries no colour of its own", () => {
  // The settled colour system: blue is the question, orange is material handed
  // to the child, green is vocabulary. A scaffold is none of those, and is set
  // apart by weight and its own line instead.
  const { css } = require("../src/helpers/frames");
  const starterRule = /\.h-wf-text\s*\{[^}]*\}/.exec(css);
  assert.ok(starterRule, "the starter has no styling at all");
  assert.ok(
    !/colour-(question|given|vocab)/.test(starterRule[0]),
    `a starter must not be coloured: ${starterRule[0]}`
  );
  assert.match(starterRule[0], /font-weight:\s*bold/);
});

test("a tag-shaped frame keeps its text clear of the point", () => {
  // The shape is the teaching: a museum tag says "write like a label". But the
  // point eats into the right-hand edge, and text run under it is unreadable.
  const tag = {
    helper: "writing-frame",
    shape: "tag",
    starters: [{ text: "This is a …", lines: 1 }],
  };
  const plain = { ...tag, shape: "plain" };
  assert.ok(
    REGISTRY["writing-frame"].needs(tag).minWidthMm >
      REGISTRY["writing-frame"].needs(plain).minWidthMm,
    "a tag needs more width than a plain frame, because of its point"
  );
  assert.ok(measure(tag, COLUMN_MM) >= measure(plain, COLUMN_MM));
});

test("a tag keeps its writing lines clear of the point at EVERY width", () => {
  // Found on a printed sheet. The point is a share of the frame, because the
  // outline is one drawing stretched to whatever size the zone gives it. Held
  // clear with a fixed number of millimetres instead, the sums agreed at one
  // width only, and on a full-width tag the last two writing lines ran out
  // under the point and off the edge of the shape.
  const { css } = require("../src/helpers/frames");
  const padding = /\.h-wf-tag \.h-wf-inner \{[^}]*padding-right:\s*([\d.]+)(%|mm)/.exec(css);
  assert.ok(padding, "a tag reserves nothing at all for its point");
  assert.equal(
    padding[2],
    "%",
    "the room kept clear must be a share of the width, not a fixed size"
  );

  // And the estimate has to follow the same rule, or the two disagree again.
  const narrow = { helper: "writing-frame", shape: "tag", starters: ["This is a …"] };
  assert.ok(
    measure(narrow, 240) > 0 && measure(narrow, 100) > 0,
    "a tag must measure at both a narrow and a wide zone"
  );
});

test("a writing frame takes a bare string as a starter", () => {
  // The short form is what a designer will actually write for a one-line
  // starter, and it should not need the long one.
  const html = renderHelper({
    helper: "writing-frame",
    starters: ["This is a …", "It is made from …"],
  });
  assert.match(html, /This is a/);
  assert.equal((html.match(/h-wf-line/g) || []).length, 2);
});

// ─── storyboard ──────────────────────────────────────────────────────────

test("a storyboard numbers every box", () => {
  const html = renderHelper({ helper: "storyboard", count: 6, columns: 2 });
  assert.equal((html.match(/h-sb-box/g) || []).length, 6);
  assert.match(html, /<span class="h-sb-num">6<\/span>/);
});

test("a storyboard with writing lines needs a line long enough to write on", () => {
  // Daniel, on the check sheet, in one answer: "box is fine, smallest it should
  // be, but the children couldn't write on the lines." Both halves were true at
  // once, and they pull opposite ways.
  //
  // A drawing box stops working around 45mm. A writing line stops working much
  // later, and the old minimum only knew about the box: a 90mm two-column
  // storyboard gave each child a 43mm line to write a sentence on.
  const lined = { helper: "storyboard", count: 6, columns: 2, lines: 2 };
  const drawOnly = { helper: "storyboard", count: 6, columns: 2, lines: 0 };

  const linedMm = REGISTRY.storyboard.needs(lined).minWidthMm;
  const drawMm = REGISTRY.storyboard.needs(drawOnly).minWidthMm;

  assert.ok(
    linedMm > drawMm,
    "writing under the boxes must ask for more width than drawing alone"
  );

  // And the line that comes out of that minimum has to be usable. Sixty
  // millimetres is about ten words of a child's handwriting; 43mm was not.
  const lineMm = (linedMm - 4) / 2;
  assert.ok(
    lineMm >= 60,
    `each writing line would be ${Math.round(lineMm)}mm, which is too short to write a sentence on`
  );
});

test("a storyboard's height follows its ROWS, not its boxes", () => {
  // Eight boxes two across is four rows; eight boxes four across is two. A
  // count alone cannot tell you the height.
  const twoWide = { helper: "storyboard", count: 8, columns: 2 };
  const fourWide = { helper: "storyboard", count: 8, columns: 4 };
  assert.ok(measure(twoWide, FULL_MM) > measure(fourWide, FULL_MM));
});

test("a storyboard box stops growing before it swallows the page", () => {
  // A box scaling with its width came out enormous on a landscape page, which
  // pushed the writing lines off the bottom. The ceiling is what stops it.
  const wide = { helper: "storyboard", count: 2, columns: 1 };
  assert.ok(
    measure(wide, 261) < measure(wide, 261) * 1.01 + 1,
    "sanity: measurement is stable"
  );
  const oneColumn = measure({ helper: "storyboard", count: 1, columns: 1 }, 261);
  assert.ok(
    oneColumn < 80,
    `one box across a landscape page came out ${Math.round(oneColumn)}mm tall`
  );
});

// ─── the layout the flanked sheets needed ────────────────────────────────

test("the flanked layouts put the big zone in the MIDDLE", () => {
  // Every other layout reads left to right and top to bottom. These two do
  // not: the middle is the subject and the flanks refer inward to it, which is
  // why putting the map in a corner did not serve the sheet that asked for it.
  for (const id of ["flanked-middle", "flanked-middle-band"]) {
    const layout = LAYOUTS.find((l) => l.id === id);
    assert.ok(layout, `${id} is missing`);
    const zones = require("../src/layouts").zonesOf(layout);
    const middle = zones.find((z) => z.id === "b");
    const left = zones.find((z) => z.id === "a");
    const right = zones.find((z) => z.id === "c");
    assert.ok(middle.w > left.w, "the middle must be wider than its left flank");
    assert.ok(middle.w > right.w, "the middle must be wider than its right flank");
    assert.ok(
      Math.abs(left.w - right.w) < 0.001,
      "the two flanks must match, or the page reads as lopsided"
    );
  }
});
