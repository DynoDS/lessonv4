"use strict";

// One job, one look, and room is the only thing that changes it.
//
// A child's claim printed as a flat box on one level and as a figure with a
// speech bubble on the next, with 35mm of the page spare, because two helpers
// drew the same job and the designer chose afresh for each level (a Year 4
// English sheet, the stress test of 7 October 2026). The teacher's ruling from
// those pages (9 October 2026): the figure first, the flat panel where the page
// is too tight, and the engine decides.

const test = require("node:test");
const assert = require("node:assert/strict");

const { resolveAutoLayouts, sheetsOf, WorksheetError } = require("../src/worksheet");
const { renderSheet } = require("../src/render");

const claim = {
  helper: "named-claim",
  speaker: "Kemi",
  says: "With a fronted adverbial, the comma always goes after the second word.",
  lines: 0,
};
const answer = (lines) => ({
  question: true,
  helper: "written-answers",
  items: [{ text: "Is Kemi right? Explain how you know.", lines }],
});

function pack(zones) {
  return {
    meta: { yearGroup: 4 },
    sheets: { expected: { recording: "sheet", recordingReason: "test", layout: "auto", orientation: "portrait", zones } },
  };
}

// One-line questions, as many as it takes to leave the page a given amount short.
function filler(count) {
  return {
    helper: "written-answers",
    items: Array.from({ length: count }, (_, i) => ({ text: `Why is ${i * 2} even?`, lines: 1 })),
  };
}

test("with room on the page the claim keeps its figure and nothing is reported", () => {
  const resolved = resolveAutoLayouts(pack([{ stack: [claim, answer(2)] }]));
  const [choice] = resolved.choices;
  assert.equal(choice.claimLook, undefined);
  const html = renderSheet(sheetsOf(resolved.worksheet)[0].spec);
  assert.ok(html.includes('<span class="h-speech-figure">'), "the figure is drawn");
  assert.ok(!html.includes('<div class="h-claim-panel"'), "and no panel");
});

test("a sheet the figure would get refused prints the panel and says so", () => {
  // Find a page that fits with the panel and not with the figure.
  let found = null;
  for (let count = 4; count < 30 && !found; count += 1) {
    try {
      resolveAutoLayouts(pack([{ stack: [filler(count), { ...claim, look: "panel" }] }]));
    } catch (error) {
      if (!(error instanceof WorksheetError)) throw error;
      break;
    }
    const resolved = resolveAutoLayouts(pack([{ stack: [filler(count), claim] }]));
    if (resolved.choices[0].claimLook === "panel") found = resolved;
  }
  assert.ok(found, "some page is too tight for the figure and still holds the panel");
  const html = renderSheet(sheetsOf(found.worksheet)[0].spec);
  assert.ok(html.includes('<div class="h-claim-panel"'), "the panel is what is drawn");
  assert.ok(!html.includes('<span class="h-speech-figure">'), "and no figure");
  assert.match(html, /Kemi says/, "with the speaker's name on it");
});

test("a sheet too full even for the panel is refused as it was designed", () => {
  assert.throws(
    () => resolveAutoLayouts(pack([{ stack: [filler(80), claim, answer(2)] }])),
    (error) => error instanceof WorksheetError && error.signal === "SHEET_DOES_NOT_FIT"
  );
});

// ─── the order a claim reads in, and its tick-or-cross box ───────────────
// Four sheets in the stress test of 7 October 2026: the box could only be
// asked for by the words "tick or cross" in the line printed ABOVE the claim,
// so "Is she correct?" came before her words, one designer added the words to
// the teacher's question to get the box, and one sheet went without it.

const { renderHelper, measure } = require("../src/helpers");

const EMMA = { helper: "named-claim", speaker: "Emma", says: "For the tens, I do 15 − 9.", lines: 0 };
const order = (html, ...parts) => parts.map((p) => html.indexOf(p));
const rising = (at) => at.every((n, i) => n >= 0 && (i === 0 || n > at[i - 1]));

test("a claim reads scene, words, question, box, lines", () => {
  const html = renderHelper(
    { ...EMMA, text: "Emma works out 5,463 − 2,198.", ask: "Is she correct?", tickOrCross: true, lines: 2 },
    174
  );
  assert.ok(
    rising(order(html, "Emma works out", "For the tens", "Is she correct?", "h-speech-judge-box", "h-claim-lines")),
    "the question follows what she said, and the box follows the question"
  );
  assert.match(html, /h-claim-ask" data-number-here/, "the question's number sits beside the question");
});

test("the box is asked for by a switch, with the question's wording untouched", () => {
  const plain = { ...EMMA, ask: "Is she correct? Explain your answer." };
  const boxed = { ...plain, tickOrCross: true };
  assert.ok(!renderHelper(plain, 174).includes("h-speech-judge-box"), "no box unless one is asked for");
  assert.match(renderHelper(boxed, 174), /h-speech-judge-box/);
  assert.ok(!/tick or cross/i.test(renderHelper(boxed, 174)), "and no words are added to get it");
  assert.ok(measure(boxed, 174) >= measure(plain, 174) + 12, "the box is counted in the height");
  // Words that promise a box still get one, wherever they are written.
  assert.match(renderHelper({ ...EMMA, ask: "Is she correct? Tick or cross." }, 174), /h-speech-judge-box/);
});

test("a question written in the scene line still prints under the words", () => {
  const old = renderHelper({ ...EMMA, text: "Is she correct? Tick or cross." }, 174);
  assert.ok(rising(order(old, "For the tens", "Is she correct?", "h-speech-judge-box")));
  // A line that only sets the scene stays above, and so does the measure.
  const scene = { ...EMMA, text: "Emma works out 5,463 − 2,198." };
  assert.ok(rising(order(renderHelper(scene, 174), "Emma works out", "For the tens")));
  assert.equal(measure(scene, 174), measure({ ...EMMA, text: "", ask: scene.text }, 174));
});

test("a one-turn speech scene takes the same order and the same switch", () => {
  const html = renderHelper(
    { helper: "speech-scene", ask: "Is Sam right?", tickOrCross: true, turns: [{ speaker: "Sam", says: "10 more than 72 is 73." }] },
    174
  );
  assert.ok(rising(order(html, "10 more than 72", "Is Sam right?", "h-speech-judge-box")));
});
