#!/usr/bin/env node
"use strict";

// Writes the saved worksheet examples in `worksheet-html/fixtures`.
//
//   node scripts/make-fixtures.js
//
// These exist so the whole builder can be exercised without a lesson run: point
// build-worksheet.js at one and a real PDF comes out in seconds. They are
// GENERATED: the layout and zone assignment come from the engine's own
// suggester rather than from a name typed into a file, and the answer key is
// counted with the same traversal the validator uses. Re-run this after a
// change to layouts or numbering and the examples move with the code.
//
// The content itself is written by hand, because that is the part worth having
// a human eye on: a real chart, a real map, questions a Year 4 could answer.

const fs = require("node:fs");
const path = require("node:path");

const { suggestLayouts } = require("../src/suggest");
const { questionCount } = require("../src/worksheet");

// One split for every "drawing on the left, its question on the right" row, so
// the question column lands in the same place down the whole sheet.
const SPLIT = [1.8, 1];

// ─── maths: one lesson at three levels ───────────────────────────────────
// Year 4, reading a bar chart. The three sheets share the chart's shape and
// change what is asked of it, which is what a differentiated pack looks like.

const barChart = (title, categories, values, yMax, yInterval) => ({
  helper: "bar-chart",
  title,
  categories,
  values,
  yMax,
  yInterval,
});

const MATHS_BELOW = {
  title: "Reading a bar chart",
  questions: [
    {
      parts: SPLIT,
      row: [
        barChart("Books read in each class this term", ["Oak", "Elm", "Birch", "Willow"], [24, 18, 30, 12], 32, 4),
        {
          question: true,
          helper: "questions",
          items: [
            "How many books did Birch read?",
            "Which class read the fewest books?",
            "How many more books did Oak read than Willow?",
          ],
        },
      ],
    },
    {
      question: true,
      helper: "written-answers",
      items: [
        { text: "Elm says they read more than Oak. Is Elm right? How do you know?", lines: 3 },
      ],
    },
  ],
  answers: [
    "30",
    "Willow",
    "12",
    "No. Elm read 18 and Oak read 24, so Oak read 6 more.",
  ],
};

const MATHS_EXPECTED = {
  title: "Reading and using a bar chart",
  questions: [
    {
      parts: SPLIT,
      row: [
        barChart("Books read in each class this term", ["Oak", "Elm", "Birch", "Willow"], [24, 18, 30, 12], 32, 4),
        {
          question: true,
          helper: "questions",
          items: [
            "How many books did Birch read?",
            "Which class read the fewest books?",
            "How many more books did Oak read than Willow?",
          ],
        },
      ],
    },
    {
      parts: SPLIT,
      row: [
        {
          helper: "bar-model",
          shape: "part-whole",
          // Oak 24 + Elm 18 + Birch 30. The whole has to agree with the chart
          // above it, or the child is asked to prove two different things.
          whole: { label: "72" },
          parts: [{ label: "24" }, { label: "18" }, { label: "?" }],
        },
        {
          question: true,
          helper: "questions",
          items: ["Oak, Elm and Birch read 72 books altogether. How many did Birch read?"],
        },
      ],
    },
    {
      parts: SPLIT,
      row: [
        {
          row: [
            { helper: "column-method-grid", operator: "+", top: 24, bottom: 18 },
            { helper: "column-method-grid", operator: "+", top: 30, bottom: 12 },
          ],
          letters: true,
        },
        {
          question: true,
          helper: "questions",
          items: ["Work out each total using the column method."],
        },
      ],
    },
    {
      question: true,
      helper: "written-answers",
      items: [
        {
          text: "Willow says: 'If our class reads 12 more books we will have read the most.' Is Willow right? Explain how you know.",
          lines: 3,
        },
      ],
    },
  ],
  answers: [
    "30",
    "Willow",
    "12",
    "30",
    "(a) 42  (b) 42",
    "No. 12 + 12 = 24, which is still fewer than Birch's 30.",
  ],
};

const MATHS_GREATER_DEPTH = {
  title: "Reasoning from a bar chart",
  questions: [
    {
      parts: SPLIT,
      row: [
        barChart("Water collected by four groups (ml)", ["A", "B", "C", "D"], [350, 475, 425, 550], 600, 50),
        {
          question: true,
          helper: "questions",
          items: [
            "What does each gridline stand for?",
            "What is the difference between groups B and C?",
            "Which two groups together collected 900 ml?",
          ],
        },
      ],
    },
    {
      question: true,
      helper: "written-answers",
      items: [
        {
          text: "Someone says group D collected almost twice as much as group A. Is 'almost twice' fair? Use the numbers to explain.",
          lines: 3,
        },
        {
          text: "Each group measured once. Write one thing this chart does show, and one thing it cannot show.",
          lines: 3,
        },
      ],
    },
  ],
  answers: [
    "50 ml",
    "50 ml",
    "A and D (350 + 550)",
    "No. Twice 350 is 700, and D collected 550, so it is nearer one and a half times.",
    "Shows: D collected the most on this occasion. Cannot show: whether D would collect the most again, because each group measured only once.",
  ],
};

// ─── geography: one sheet, no adaptation ─────────────────────────────────
// A shared frame is a normal worksheet, not a degraded one, so one example
// carries a single expected sheet on purpose.

const GEOGRAPHY_EXPECTED = {
  title: "Finding places with grid references",
  questions: [
    {
      parts: SPLIT,
      row: [
        // A four-figure grid: the numbers label the LINES, and a reference
        // names the bottom-left corner of a square.
        {
          helper: "grid-map",
          eastings: [31, 32, 33, 34, 35],
          northings: [51, 52, 53, 54, 55],
          river: [
            [31, 54.6],
            [32.4, 53.8],
            [33.2, 53.1],
            [34.1, 52.4],
            [35, 51.6],
          ],
          features: [
            { name: "Mill", square: [32, 53], type: "human" },
            { name: "Wood", square: [34, 54], type: "physical" },
            { name: "Bridge", square: [33, 51], type: "human" },
          ],
        },
        {
          question: true,
          helper: "questions",
          items: [
            "Give the four-figure grid reference for the mill.",
            "What is found at 3454?",
            "Which square does the river leave the map in?",
          ],
        },
      ],
    },
    {
      stack: [
        {
          helper: "source-text",
          heading: "A walker's notebook",
          paragraphs: [
            "We started at the bridge and followed the river north-west, keeping the water on our left. The mill came into view after about twenty minutes, and we stopped there to eat.",
          ],
          attribution: "From a walking diary, 2019",
        },
        {
          question: true,
          helper: "questions",
          items: [
            "In which direction did the walkers travel?",
            "Which two places did they pass between?",
          ],
        },
      ],
    },
    {
      stack: [
        {
          helper: "recording-table",
          caption: "Complete the table for three more places",
          columns: ["Place", "Grid reference", "Next to the river?"],
          rowLabels: ["Wood", "Bridge", "Your choice"],
          writing: "word",
        },
      ],
    },
  ],
  answers: [
    "3253",
    "The wood",
    "3451",
    "North-west",
    "The bridge and the mill",
  ],
};

// ─── the refusal case ────────────────────────────────────────────────────
// Deliberately more than a page holds. A builder that silently shrinks this
// into something unusable has a bug; the right answer is a named refusal, so
// this example exists to prove the refusal still happens.

const TOO_MUCH_FOR_A_PAGE = {
  title: "More than one page can hold",
  questions: Array.from({ length: 8 }, (_, i) => ({
    parts: SPLIT,
    row: [
      barChart(`Chart ${i + 1}`, ["A", "B", "C", "D"], [24, 18, 30, 12], 32, 4),
      {
        question: true,
        helper: "questions",
        items: [`Read chart ${i + 1} and give the largest value.`],
      },
    ],
  })),
};

// ─── generating ──────────────────────────────────────────────────────────

// The engine picks the shape and which zone each item lands in. Nothing here
// names a layout, so a renamed or retired layout cannot rot these files.
function toSheet(level) {
  const result = suggestLayouts(level.questions, { extra: { title: level.title } });
  if (!result.fits.length) return null;

  const best = result.fits[0];
  const zones = {};
  best.zones.forEach((id, i) => {
    if (level.questions[i]) zones[id] = level.questions[i];
  });

  return { title: level.title, layout: best.layout, orientation: best.orientation, zones };
}

// Counted with the engine's own traversal rather than by counting the answers
// written above, so a mismatch between the two shows up here instead of in a
// build weeks later.
function keyFor(sheet, answers) {
  const expected = questionCount(sheet.zones);
  if (answers.length !== expected) {
    throw new Error(
      `${sheet.title}: ${answers.length} answers written, but the sheet prints ${expected} questions.`
    );
  }
  return answers.map((answer, i) => ({ question: i + 1, answer }));
}

function worksheet(meta, levels) {
  const sheets = {};
  const answerKey = {};
  for (const [key, level] of Object.entries(levels)) {
    const sheet = toSheet(level);
    if (!sheet) throw new Error(`${level.title}: no layout in the library holds this.`);
    sheets[key] = sheet;
    answerKey[key] = keyFor(sheet, level.answers);
  }
  return { meta, sheets, answerKey };
}

function write(name, spec) {
  const dir = path.join(__dirname, "..", "fixtures");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(spec, null, 2)}\n`);
  const levels = Object.keys(spec.sheets).join(", ");
  console.log(`${name}.json  (${levels || "no sheets"})`);
  return file;
}

function main() {
  write(
    "maths-bar-chart-three-levels",
    worksheet(
      {
        lesson: "Reading and using a bar chart",
        lo: "To read a bar chart and use the numbers in it to solve problems",
        yearGroup: "Year 4",
        subject: "Mathematics",
      },
      { below: MATHS_BELOW, expected: MATHS_EXPECTED, greaterDepth: MATHS_GREATER_DEPTH }
    )
  );

  write(
    "geography-grid-references-one-sheet",
    worksheet(
      {
        lesson: "Finding places with grid references",
        lo: "To find and give four-figure grid references on a map",
        yearGroup: "Year 4",
        subject: "Geography",
      },
      { expected: GEOGRAPHY_EXPECTED }
    )
  );

  // Written straight rather than through `worksheet`, because the point of this
  // one is that no layout holds it: the suggester finds nothing, so there is no
  // sheet to build an answer key against. The builder should refuse it by name.
  const overflow = suggestLayouts(TOO_MUCH_FOR_A_PAGE.questions, {
    extra: { title: TOO_MUCH_FOR_A_PAGE.title },
  });
  if (overflow.fits.length) {
    throw new Error("The overflow example now fits a page, so it no longer tests a refusal.");
  }
  console.log("overflow example still refuses to fit, as intended.");
}

main();
