"use strict";

// What a sheet carries that is not the work, and what it stopped carrying on
// 12 September 2026.
//
// Daniel read three built packs in one sitting and every fault he named was the
// same kind: the page's furniture taking room, attention or both from the work
// on it. A question label in a tinted chip with a heavy navy rule down its side,
// pressed up against the number being rounded. A lesson title across the top of
// a sheet the child is holding in that lesson - which on one pack wrapped out of
// its fixed band and printed through question 1. A bordered blue "Sheet B" badge
// in the corner. Section headings ruled edge to edge behind one word. The
// lesson's method printed as a grey paragraph because no helper existed to draw
// it. A photograph in a full-width box using a quarter of it.
//
// Each has its own repair in its own file. This is the one place that holds what
// a sheet may print above and around its questions, so a later change that puts
// any of it back fails here rather than in a classroom.

const { test } = require("node:test");
const assert = require("node:assert");

const { renderSheet } = require("../src/render");
const { renderContent, renderHelper, measure, REGISTRY } = require("../src/helpers");
const { numbered, SHEET_CODES } = require("../src/worksheet");
const { TYPE } = require("../src/tokens");

const ZONES = { a: { helper: "instruction", text: "Choose the correct symbol." } };

function sheet(extra = {}) {
  return renderSheet({
    layout: "full",
    orientation: "portrait",
    yearGroup: 4,
    zones: ZONES,
    ...extra,
  });
}

// ─── the top of the page ─────────────────────────────────────────────────

test("no lesson title reaches the paper, whatever the spec calls the sheet", () => {
  const html = sheet({ title: "How can being active help my mind and body", code: "B" });
  const body = html.split("<body")[1];
  assert.ok(
    !body.includes("How can being active"),
    "the lesson name printed on the sheet"
  );
  assert.doesNotMatch(html, /class="sheet-header"/);
  assert.doesNotMatch(html, /class="sheet-title"/);
});

test("the code is quiet grey text with no badge around it", () => {
  const html = sheet({ code: "GD" });
  const rule = /\.sheet-code \{[^}]*\}/.exec(html);
  assert.ok(rule, "the sheet code has no styling at all");
  assert.match(rule[0], /--colour-quiet/, "the code is not set in the quiet grey");
  assert.match(rule[0], /--type-note/, "the code is not set at note size");
  for (const furniture of ["background", "border", "border-radius"]) {
    assert.ok(
      !new RegExp(`${furniture}\\s*:`).test(rule[0]),
      `the code still draws a ${furniture}`
    );
  }
  assert.match(html, /class="sheet-code">GD</);
});

test("the code abbreviates the level the adaptation designer names", () => {
  // Not "Sheet A": A, B and C are an alphabet laid over three levels, and the
  // teacher sorting the pile has to translate. These are the initials of the
  // words the adaptation document itself uses.
  assert.deepEqual(SHEET_CODES, { below: "B", expected: "E", greaterDepth: "GD" });
});

// ─── the question label ──────────────────────────────────────────────────

test("a question label is blue text with real space after it", () => {
  const html = renderContent({ number: "1a", helper: "instruction", text: "6,734" }, 120);
  assert.match(html, /class="h-numbered-n">\(1a\)/);

  const rule = /\.h-numbered-n \{[^}]*\}/.exec(require("../src/helpers").helperCss);
  assert.match(rule[0], /--colour-question/);
  assert.ok(!/background\s*:|border(-\w+)?\s*:/.test(rule[0]), "the label is in a box");
  assert.match(rule[0], /text-align: left/, "the label is not pinned to the left edge");

  // The column is wider than the widest label a sheet reaches, so there is
  // always room left before the question. "(10a)" measures 8.85mm at 10pt bold
  // Comic Sans; the gutter is 10mm.
  const gap = /gap: (\d+(?:\.\d+)?)mm/.exec(/\.h-numbered \{[^}]*\}/.exec(
    require("../src/helpers").helperCss
  )[0]);
  assert.ok(gap && Number(gap[1]) > 0, "nothing separates the label from the question");
});

test("a label is set smaller than the question it labels", () => {
  // The whole reason there is room for a gap. A label at body size filled its
  // column, and widening the column instead would have cost the page width the
  // approved partitioning sheet does not have.
  assert.ok(
    TYPE.questionNumber < TYPE.body,
    `a question label is ${TYPE.questionNumber}pt against ${TYPE.body}pt body text`
  );
  assert.ok(
    TYPE.questionNumber >= TYPE.note,
    "a question label has dropped below the smallest size on the sheet"
  );
});

// ─── the section heading ─────────────────────────────────────────────────

test("a section heading's ground stops at the end of its word", () => {
  const css = /\.h-section-label \{[^}]*\}/.exec(require("../src/helpers").helperCss)[0];
  assert.match(css, /display: inline-block/, "the heading still rules edge to edge");
  assert.match(css, /var\(--inset-cell\)/, "the heading is still padded like a card");
});

// ─── the steps panel ─────────────────────────────────────────────────────

const STEPS = {
  helper: "steps",
  title: "Use these steps to help you.",
  steps: [
    "Read the question: 10s or 100s?",
    "Find the 10s or 100s each side.",
    "Draw a number line. Mark your number.",
  ],
};

test("the lesson's steps print as the panel the class worked from", () => {
  const html = renderHelper(STEPS, 174);
  assert.match(html, /class="h-steps"/);
  assert.match(html, /class="h-steps-title">✓ Use these steps to help you\./);
  assert.equal((html.match(/class="h-steps-badge"/g) || []).length, 3);
  assert.match(html, /class="h-steps-badge">1<\/span>/);
  assert.match(html, /Draw a number line\. Mark your number\./);

  const css = require("../src/helpers").helperCss;
  assert.match(/\.h-steps \{[^}]*\}/.exec(css)[0], /--colour-criteria/);
  assert.match(/\.h-steps \{[^}]*\}/.exec(css)[0], /--colour-vocab/);
});

test("the steps panel never claims spare height", () => {
  // It is reference material beside the work. Handed a zone's surplus it would
  // become the biggest object on a sheet it only supports.
  assert.equal(REGISTRY.steps.greed, 0);
});

test("a steps panel costs more than the same words as prose, and honestly", () => {
  // The panel is not free and the designer has to be able to price it. Six
  // criteria stand about 55mm against about 40mm as prose; what matters is that
  // the measurement says so rather than the sheet discovering it at build time.
  const six = {
    helper: "steps",
    title: "Use these steps to help you.",
    steps: [
      "Read the question: 10s or 100s?",
      "Find the 10s or 100s each side.",
      "Draw a number line. Mark your number.",
      "Find halfway. Before it or after it?",
      "Round to the nearer one. Halfway? Round up.",
      "Already a multiple? It stays the same.",
    ],
  };
  const panelMm = measure(six, 174);
  assert.ok(panelMm > 45 && panelMm < 70, `a six-step panel measures ${panelMm.toFixed(1)}mm`);
});

test("an instruction carrying a list is refused and told where the list belongs", () => {
  // The producing fault behind the grey paragraph. Every multi-line instruction
  // in the saved specs was either criteria or questions wearing this helper's
  // clothes.
  const asList = {
    helper: "instruction",
    text: "Use these steps to help you.\nRead the question.\nFind the 10s each side.",
  };
  assert.throws(() => renderHelper(asList, 174), /INSTRUCTION_IS_A_LIST/);
  assert.throws(() => measure(asList, 174), /INSTRUCTION_IS_A_LIST/);
  assert.throws(() => renderHelper(asList, 174), /"steps" helper/);
  assert.throws(() => renderHelper(asList, 174), /written-answers/);

  // A direction genuinely in two parts is one direction and is left alone.
  const twoPart = {
    helper: "instruction",
    text: "Write each number in expanded form.\nUse 0 for an empty part.",
  };
  assert.match(renderHelper(twoPart, 174), /class="h-instruction"/);
});

// ─── a picture's own width ───────────────────────────────────────────────

const PHOTO = {
  helper: "card-row",
  columns: 1,
  imageHeightMm: 32,
  cards: [{ imageHref: "hall.jpg", imageWidth: 1200, imageHeight: 800 }],
};

test("a card carrying only a picture is as wide as the picture", () => {
  assert.match(renderHelper(PHOTO, 174), /h-cardrow-list--hug/);
});

test("a card that does more than hold a picture keeps its column", () => {
  // The discrimination case, and the reason this is not "shrink every card".
  // A row of artefacts a child compares has to line up, and the moment a card
  // carries a title, a caption, a write line, a tick box or a join dot its box
  // is doing work beyond holding the picture.
  const titled = {
    ...PHOTO,
    cards: [{ ...PHOTO.cards[0], title: "A Tudor doll" }],
  };
  assert.doesNotMatch(renderHelper(titled, 174), /h-cardrow-list--hug/);

  const writeOn = { ...PHOTO, writeLabel: "What is it made of?" };
  assert.doesNotMatch(renderHelper(writeOn, 174), /h-cardrow-list--hug/);

  const joined = { ...PHOTO, dot: "right" };
  assert.doesNotMatch(renderHelper(joined, 174), /h-cardrow-list--hug/);
});

// ─── the word bank stays one bank ────────────────────────────────────────

test("a word bank holds every word, and one word can carry its meaning", () => {
  // Without this field a designer with one word to gloss had to split the bank,
  // and a child choosing a word could no longer see the set to choose from.
  const html = renderHelper(
    {
      helper: "chip-bank",
      title: "Word bank",
      chips: ["muscles", { word: "oxygen", meaning: "a gas in the air we breathe" }],
    },
    120
  );
  assert.equal((html.match(/class="h-chipbank /g) || []).length, 1, "the bank was split in two");
  assert.match(html, /class="h-chip-word">muscles/);
  assert.match(html, /class="h-chip-word">oxygen/);
  assert.match(html, /class="h-chip-meaning">a gas in the air we breathe/);

  // A meaning is prose the child reads, at note size: the word stays the thing
  // being chosen.
  const css = /\.h-chip-meaning \{[^}]*\}/.exec(require("../src/helpers").helperCss)[0];
  assert.match(css, /--type-note/);
  assert.match(css, /font-weight: normal/);
});

test("a glossed chip is sized by whichever of word and meaning is wider", () => {
  const bare = measure({ helper: "chip-bank", chips: ["oxygen"] }, 120);
  const glossed = measure(
    {
      helper: "chip-bank",
      chips: [{ word: "oxygen", meaning: "a gas in the air we breathe" }],
    },
    120
  );
  assert.ok(
    glossed > bare,
    "a chip carrying a meaning is measured as though it did not"
  );
});

// ─── numbering still works after all of that ─────────────────────────────

test("the engine still numbers questions in reading order", () => {
  const zones = numbered({
    a: {
      stack: [
        { question: true, questionGroupId: "g1", helper: "instruction", text: "6,734" },
        { question: true, questionGroupId: "g1", helper: "instruction", text: "8,995" },
        { question: true, helper: "instruction", text: "Explain." },
      ],
    },
  });
  const labels = zones.a.stack.map((n) => n.number);
  assert.deepEqual(labels, ["1a", "1b", 2]);
});
