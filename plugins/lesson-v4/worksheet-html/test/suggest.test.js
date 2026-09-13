"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  suggestLayouts,
  describeSuggestions,
  verdictFor,
  comfortPenalty,
  ROOMY_BELOW_PCT,
  TIGHT_ABOVE_PCT,
} = require("../src/suggest");
const { checkFit, renderSheet } = require("../src/render");

const CHART = {
  helper: "bar-chart",
  title: "Our favourite sports",
  categories: ["Football", "Swimming", "Tennis", "Cricket"],
  values: [12, 8, 6, 4],
  yMax: 14,
  yInterval: 2,
};
const SHORT_QUESTIONS = {
  helper: "questions",
  items: [
    "How many children chose football?",
    "Which sport was the most popular?",
  ],
};
const WRITING = {
  helper: "written-answers",
  items: [{ text: "Explain how you know.", lines: 3 }],
};

const THREE = [CHART, SHORT_QUESTIONS, WRITING];

test("suggestions come back ranked, most comfortable page first", () => {
  const { fits } = suggestLayouts(THREE);
  assert.ok(fits.length > 0, "nothing fitted, which cannot be right");
  for (let i = 1; i < fits.length; i++) {
    assert.ok(
      comfortPenalty(fits[i - 1].fillPct) <= comfortPenalty(fits[i].fillPct),
      `a less comfortable page (${fits[i - 1].fillPct}%) was ranked above a ` +
        `more comfortable one (${fits[i].fillPct}%)`
    );
  }
});

// The ranking used to sort by raw fullness, so the shape at the top of the list
// was always the one nearest the edge of the page. A designer told to take what
// the tool offers was therefore handed the riskiest arrangement every time, and
// a sheet that measured 99% full clipped by 6px once a browser drew it for real.
test("a page with no room to spare is never offered above a comfortable one", () => {
  assert.ok(
    comfortPenalty(88) < comfortPenalty(99),
    "a bursting page ranked at least as well as a comfortable one"
  );
  assert.ok(
    comfortPenalty(88) < comfortPenalty(100),
    "a completely full page ranked at least as well as a comfortable one"
  );
  // And it must not overcorrect into recommending half-empty pages either.
  assert.ok(
    comfortPenalty(88) < comfortPenalty(40),
    "a half-empty page ranked at least as well as a comfortable one"
  );
});

test("the tight end is penalised harder than the roomy end", () => {
  // Ten points over the tight line clips and is refused. Ten points under the
  // roomy line is a strip at the foot of the page that a teacher trims off.
  assert.ok(
    comfortPenalty(TIGHT_ABOVE_PCT + 10) > comfortPenalty(ROOMY_BELOW_PCT - 10),
    "being over-full was treated as no worse than being under-full"
  );
});

test("only layouts with the right number of zones are considered", () => {
  const { fits, refused } = suggestLayouts(THREE);
  for (const f of [...fits, ...refused]) {
    const zoneCount = f.zones ? f.zones.length : 3;
    assert.equal(zoneCount, 3, `${f.layout} was considered with ${zoneCount} zones`);
  }
});

test("asking for one orientation returns only that orientation", () => {
  const { fits } = suggestLayouts(THREE, { orientation: "landscape" });
  assert.ok(fits.length > 0);
  for (const f of fits) assert.equal(f.orientation, "landscape");
});

// The point of the whole exercise: a suggestion that cannot actually be built
// is worse than no suggestion, because it is trusted.
test("every suggested layout genuinely renders", () => {
  const { fits } = suggestLayouts(THREE);
  for (const f of fits) {
    const zones = {};
    f.zones.forEach((id, i) => {
      zones[id] = THREE[i];
    });
    const spec = { layout: f.layout, orientation: f.orientation, zones };
    assert.deepEqual(
      checkFit(spec),
      [],
      `${f.layout} (${f.orientation}) was suggested but does not pass the fit check`
    );
    assert.doesNotThrow(
      () => renderSheet(spec),
      `${f.layout} (${f.orientation}) was suggested but throws when built`
    );
  }
});

test("a refusal carries the reason, so a near miss is visible", () => {
  const { refused } = suggestLayouts(THREE);
  assert.ok(refused.length > 0, "expected some layouts to be too small for a chart");
  for (const r of refused) {
    assert.ok(Array.isArray(r.why) && r.why.length > 0, `${r.layout} refused with no reason`);
    assert.match(r.why[0], /mm/, "a refusal should name the millimetres");
  }
});

test("nothing is ever offered at more than a full page", () => {
  const tall = {
    helper: "written-answers",
    items: Array.from({ length: 8 }, (_, i) => ({
      text: `Explain your reasoning for part ${i + 1} in full sentences.`,
      lines: 6,
    })),
  };
  const { fits, refused } = suggestLayouts([tall, SHORT_QUESTIONS, WRITING], {
    orientation: "landscape",
  });

  for (const f of fits) {
    assert.ok(f.fillPct <= 100, `${f.layout} was offered at ${f.fillPct}% full`);
  }
  assert.ok(refused.length > 0, "expected this much writing to be refused somewhere");
});

test("a page the zones each fit but the page cannot hold is still refused", () => {
  // Every zone can hold its own content AND the page cannot hold the lot: this
  // is the case the fit check used to miss entirely, offering a layout that
  // needed 258mm of a 180mm page as the BEST suggestion and only failing once
  // a page was being built.
  //
  // Drawings are used rather than text because a drawing's minimum height is a
  // floor for readability, well below the height it naturally wants, so it
  // clears the per-zone check and can still overrun the page. Text states its
  // true height, so it is caught a step earlier.
  const chart = {
    helper: "bar-chart",
    title: "Our favourite sports",
    categories: ["Football", "Swimming", "Tennis", "Cricket"],
    values: [12, 8, 6, 4],
    yMax: 14,
    yInterval: 2,
  };

  const { refused } = suggestLayouts([chart, chart, chart], {
    orientation: "landscape",
  });

  assert.ok(
    refused.some((r) => r.why.some((w) => /shortfall/.test(w))),
    "expected a layout refused for the whole page being too short"
  );
});

test("a page nobody could fill is reported as roomy rather than quietly offered", () => {
  assert.equal(verdictFor(40), "roomy");
  assert.equal(verdictFor(85), "good");
  assert.equal(verdictFor(99), "tight");
});

test("the written description names the layouts and their fill", () => {
  const text = describeSuggestions(suggestLayouts(THREE), 3);
  assert.match(text, /layouts fit/);
  assert.match(text, /%/);
  assert.match(text, /portrait|landscape/);
});

test("content no layout can hold is reported plainly, not as an empty list", () => {
  const enormous = {
    helper: "bar-chart",
    title: "Too many",
    categories: Array.from({ length: 40 }, (_, i) => `Category ${i}`),
    values: Array.from({ length: 40 }, () => 5),
    yMax: 10,
    yInterval: 2,
  };
  const result = suggestLayouts([enormous, SHORT_QUESTIONS, WRITING]);
  assert.equal(result.fits.length, 0);
  assert.match(describeSuggestions(result), /No layout can hold this content/);
});

test("a picture with no size yet is refused, not called a fit at NaN%", () => {
  // The tool's whole promise is "use what it gives you and the build will not
  // refuse you". A photograph reaches a spec as `imagePath`, a filename, and
  // the build reads the file and carries the picture inside the sheet BEFORE
  // measuring anything. This measured the filename: with no width or height
  // yet, every sum came out NaN, NaN compares false against both thresholds so
  // the verdict fell through to "good", and the count of fitting layouts nearly
  // doubled. The tool was at its most confident on its least known content, and
  // the designer it misled kept re-guessing shapes the build had refused.
  const examples = require("./helper-examples");
  const resolved = { helper: "label-diagram", ...examples["label-diagram"] };
  const { imageHref, imageWidth, imageHeight, ...bare } = resolved;
  const unresolved = { ...bare, imagePath: "plant.jpg" };
  const questions = { helper: "questions", items: ["One?", "Two?"] };

  const withPicture = suggestLayouts([resolved, questions], { yearGroup: 4 });
  const withFilename = suggestLayouts([unresolved, questions], { yearGroup: 4 });

  for (const fit of withPicture.fits) {
    assert.ok(Number.isFinite(fit.fillPct), `${fit.layout} reported ${fit.fillPct}%`);
  }

  // An unmeasurable picture must not become a recommendation. Either it is
  // refused, or it is reported with a real number - never "NaN% good".
  for (const fit of withFilename.fits) {
    assert.ok(
      Number.isFinite(fit.fillPct),
      `an unresolved picture was offered as ${fit.layout} at ${fit.fillPct}% - ` +
        `resolve images before suggesting, as scripts/suggest.js does`
    );
  }
});

test("suggest measures a writing line at the sheet's own year height", () => {
  // Years 4 to 6 write on 6mm lines and Years 1 to 3 on 8mm, and the build
  // applies that before it measures. This did not, so every Year 4 answer was
  // computed on the taller line: the percentages were wrong and layouts that
  // genuinely fitted were hidden. Same content, two year groups, must differ.
  const writing = {
    helper: "written-answers",
    items: [
      { text: "Explain how you know.", lines: 6 },
      { text: "Explain the other one.", lines: 6 },
    ],
  };
  const questions = { helper: "questions", items: ["One?", "Two?"] };

  const younger = suggestLayouts([writing, questions], { yearGroup: 2 });
  const older = suggestLayouts([writing, questions], { yearGroup: 5 });

  const fillOf = (r) => r.fits.find((f) => f.layout === "halves-side" && f.orientation === "portrait");
  assert.ok(fillOf(younger) && fillOf(older), "halves-side portrait fitted for neither year");
  assert.ok(
    fillOf(younger).usedMm > fillOf(older).usedMm,
    `Year 2 used ${fillOf(younger).usedMm}mm and Year 5 ${fillOf(older).usedMm}mm - ` +
      `the year group is not reaching the measurement`
  );
});

test("a layout suggest recommends is a layout the build accepts", () => {
  // The agreement itself, checked rather than assumed: every top recommendation
  // is put through the BUILD's own check, at a year group whose line height
  // differs from the default.
  const { checkWorksheet } = require("../src/worksheet");

  const items = [
    { stack: [SHORT_QUESTIONS, WRITING] },
    { stack: [WRITING, SHORT_QUESTIONS] },
  ];
  const yearGroup = 4;
  const result = suggestLayouts(items, { yearGroup });
  assert.ok(result.fits.length > 0, "nothing fitted, so nothing was checked");

  for (const fit of result.fits.slice(0, 5)) {
    const worksheet = {
      meta: { lesson: "T", lo: "L", yearGroup },
      sheets: {
        expected: {
          layout: fit.layout,
          orientation: fit.orientation,
          zones: { a: items[0], b: items[1] },
        },
      },
    };
    assert.deepEqual(
      checkWorksheet(worksheet),
      [],
      `suggest offered ${fit.layout} (${fit.orientation}) at ${fit.fillPct}% ` +
        `and the build refused it`
    );
  }
});

test("suggest includes the width cost of automatic question numbers", () => {
  // Regression from a real Y4 place-value sheet. The raw zone needed 76mm,
  // so portrait halves-side looked safe at 84mm. The build then added question
  // numbers to the two chart questions; their number gutter raised the honest
  // minimum to 90mm and the builder refused the layout the tool had recommended.
  const fluency = {
    stack: [
      { helper: "section-label", text: "Fluency" },
      {
        helper: "questions",
        question: true,
        items: [
          "10 more than 1,326 =",
          "10 less than 4,572 =",
          "100 more than 3,685 =",
          "100 less than 9,241 =",
        ],
      },
      {
        question: true,
        stack: [
          { helper: "instruction", text: "10 more than ___ is 3,000." },
          {
            helper: "place-value-chart",
            columns: ["Th", "H", "T", "O"],
            rows: [
              { label: "Number", cells: [] },
              { label: "10 more", cells: ["3", "0", "0", "0"] },
            ],
          },
        ],
      },
      {
        question: true,
        stack: [
          { helper: "instruction", text: "100 less than ___ is 6,930." },
          {
            helper: "place-value-chart",
            columns: ["Th", "H", "T", "O"],
            rows: [
              { label: "Number", cells: [] },
              { label: "100 less", cells: ["6", "9", "3", "0"] },
            ],
          },
        ],
      },
    ],
  };
  const reasoning = {
    stack: [
      { helper: "section-label", text: "Reasoning" },
      {
        helper: "written-answers",
        question: true,
        items: [
          { text: "Explain the first case.", lines: 4 },
          { text: "Explain the boundary case.", lines: 4 },
          { text: "Test the claim.", lines: 4 },
        ],
      },
    ],
  };

  const result = suggestLayouts([fluency, reasoning], { yearGroup: 4 });
  assert.equal(
    result.fits.some(
      (fit) => fit.layout === "halves-side" && fit.orientation === "portrait"
    ),
    false,
    "portrait halves-side was offered even though numbering makes zone a 6mm too narrow"
  );
  assert.equal(
    result.fits.some(
      (fit) => fit.layout === "halves-side" && fit.orientation === "landscape"
    ),
    true,
    "the nearby wider landscape layout should remain available"
  );
});

// ─── the verdict when nothing fits ───────────────────────────────────────
//
// A designer facing an over-full brief used to see a wall of individual noes,
// three at a time, one per shape. Two cases hide behind that wall and they call
// for opposite moves: content a few millimetres over, where another shape
// genuinely rescues it, and content far over, where none will and the brief
// itself is too big for a page. Guessing between them cost most of an hour on
// the first real run, and every number needed to tell them apart was already
// being computed and thrown away.

const TALL_CHART = {
  helper: "bar-chart",
  title: "Our favourite sports",
  categories: ["Football", "Swimming", "Tennis", "Cricket"],
  values: [12, 8, 6, 4],
  yMax: 14,
  yInterval: 2,
};

test("content that fits carries no verdict, because there is nothing to explain", () => {
  const result = suggestLayouts(THREE);
  assert.ok(result.fits.length > 0);
  assert.equal(result.verdict, null);
});

test("content nothing can hold says how far over it is, in millimetres", () => {
  const result = suggestLayouts([TALL_CHART, TALL_CHART, TALL_CHART, TALL_CHART], {
    orientation: "landscape",
  });
  assert.equal(result.fits.length, 0);
  assert.ok(result.verdict, "nothing fitted and no verdict was given");
  assert.ok(result.verdict.shortfallMm > 0, "a shortfall of no millimetres is not a shortfall");

  const text = describeSuggestions(result);
  assert.match(text, /closest shape/);
  assert.match(text, /mm/);
  // The item to aim the cutting at, named from the content rather than left to
  // the reader to guess.
  assert.match(text, /most expensive single item/);
});

test("the verdict never contradicts the refusals printed under it", () => {
  // The first version of this said "the page has room for all of this" over a
  // list of refusals reporting a 1404mm shortfall, because it took the smallest
  // shortfall across every shape without noticing that shape had failed for a
  // different reason. A reader who believed the headline would keep trying
  // shapes against content that cannot fit on paper.
  const result = suggestLayouts([TALL_CHART, TALL_CHART, TALL_CHART, TALL_CHART], {
    orientation: "landscape",
  });

  if (result.verdict.kind === "too-tall-for-any-page") {
    const anyInside = result.refused.some((r) => r.heightShortMm !== null && r.heightShortMm <= 0);
    assert.equal(anyInside, false, "claimed no shape is inside the page while one is");
  }
  if (result.verdict.kind === "too-narrow") {
    const anyInside = result.refused.some((r) => r.heightShortMm !== null && r.heightShortMm <= 0);
    assert.equal(anyInside, true, "claimed the height works while no shape's does");
  }
});

test("a zone count no layout has is told apart from content that is too big", () => {
  // Nine zones is not a near miss, it is a question the library cannot answer,
  // and reporting it as a shortfall would send the reader cutting content that
  // would have fitted grouped differently.
  const nine = Array.from({ length: 9 }, () => SHORT_QUESTIONS);
  const result = suggestLayouts(nine);
  assert.equal(result.fits.length, 0);
  assert.equal(result.verdict.kind, "wrong-zone-count");
  assert.match(describeSuggestions(result), /No layout in the library has 9 zones/);
});

test("a refusal carries its own shortfall, so the closest miss can be found without reparsing", () => {
  const result = suggestLayouts([TALL_CHART, TALL_CHART, TALL_CHART], {
    orientation: "landscape",
  });
  for (const r of result.refused) {
    assert.ok("heightShortMm" in r, `${r.layout} carries no height shortfall`);
    assert.ok("widthShortMm" in r, `${r.layout} carries no width shortfall`);
  }
});

// ─── what the shape does to the work ─────────────────────────────────────
//
// Fill was the only thing this ranking measured, and a percentage describes a
// page from the outside. Two shapes can fill a page identically and be nothing
// alike inside it: one gives a chart the width to be read, the other squeezes
// it to the narrowest size the engine will accept and spends the width it saved
// on writing lines that had enough already. The second was winning whenever its
// percentage came out closer to the target.

test("a shape that squeezes the work is not offered above one that does not", () => {
  const wideChart = {
    helper: "bar-chart",
    title: "Books read in each class this term",
    categories: ["Oak", "Elm", "Birch", "Willow", "Ash", "Yew"],
    values: [24, 18, 30, 12, 20, 26],
    yMax: 32,
    yInterval: 4,
  };
  const answers = {
    helper: "written-answers",
    items: [
      { text: "How many more books did Birch read than Willow?", sentences: 1 },
      { text: "Explain how you worked it out.", sentences: 2 },
    ],
  };

  const { fits } = suggestLayouts([wideChart, answers], {
    yearGroup: 4,
    extra: { title: "Bar charts", lo: "To read a bar chart" },
  });

  const strained = fits.filter((f) => f.strain > 0);
  assert.ok(
    strained.length > 0,
    "no shape here crams the chart, so this test proves nothing - pick content " +
      "with a wider picture in it"
  );

  for (const tight of strained) {
    const rank = fits.indexOf(tight);
    const easier = fits.filter((f) => f.strain === 0);
    assert.ok(
      easier.every((f) => fits.indexOf(f) < rank),
      `${tight.layout}/${tight.orientation} squeezes something and was still ` +
        `offered at position ${rank + 1}, above a shape that squeezes nothing`
    );
  }

  // And the demotion is doing real work here: on fill alone this shape was as
  // good as the best of them, so the old ranking had nothing to separate them
  // by and offered it near the top.
  const byFill = [...fits].sort(
    (a, b) => comfortPenalty(a.fillPct) - comfortPenalty(b.fillPct)
  );
  assert.ok(
    byFill.indexOf(strained[0]) < fits.indexOf(strained[0]),
    "ranked by fill alone this shape came no higher, so nothing changed"
  );
});
