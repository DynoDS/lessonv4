"use strict";

// Question slips from the stress test of 7 October 2026, round two (two of
// three Codex lessons). A slip is the sheet with its answer room taken out,
// because the child answers in the book; it said so but did not do so for
// every piece:
//
// - a Year 4 Greater Depth slip kept a child's claim's ruled lines, under a
//   bubble that asked nothing (Daniel: a slip "should not" have them);
// - five column sums ran one to a line with the right half empty, because the
//   slip priced their width with two flat letter sizes;
// - a sentence starter's "Please can you help?" printed question blue, and its
//   first blank fell to the next line away from "worried about".
//
// And a level the plan gives the Expected task unchanged had no page and no
// word anywhere; it is now said in the run (Daniel, 14 October 2026).

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { forSlip, slipNodesFor } = require("../src/slips");
const { helpers: frames } = require("../src/helpers/frames");
const { promptHtml, linesFor } = require("../src/helpers/shared");
const { sharedWithExpected } = require("../src/across-levels");
const { REGISTRY } = require("../src/helpers");

const maya = { helper: "named-claim", speaker: "Maya", says: "I put the same digit in both boxes." };
const noah = {
  helper: "named-claim",
  speaker: "Noah",
  says: "If the two digits in Tens add to 9, I always need an exchange in Tens.",
  ask: "Is Noah correct? Explain your answer.",
  lines: 3,
  tickOrCross: true,
};

test("every piece on a slip is told it is on a slip, not a listed few", () => {
  const slip = forSlip({ stack: [maya, { helper: "number-sentence", text: "3 + 4 =" }] });
  assert.ok(slip.stack.every((node) => node.slip === true));
});

test("a claim on a slip has no ruled lines and no tick-or-cross box", () => {
  const onSlip = frames["named-claim"].render(forSlip(noah), 84);
  assert.doesNotMatch(onSlip, /h-claim-line/);
  assert.doesNotMatch(onSlip, /judge-box/);
  assert.match(onSlip, /Is Noah correct\?/);
  assert.ok(frames["named-claim"].measure(forSlip(noah), 84) < frames["named-claim"].measure(noah, 84));
});

test("on a sheet the same claim keeps its lines and its box", () => {
  const onSheet = frames["named-claim"].render(noah, 84);
  assert.match(onSheet, /h-claim-line/);
  assert.match(onSheet, /judge-box/);
});

test("a claim that asks nothing gets no lines, on a sheet too", () => {
  assert.doesNotMatch(frames["named-claim"].render(maya, 84), /h-claim-line/);
  // With its question in it, leaving `lines` out still gives three.
  const asked = { ...maya, ask: "What could her digit be?" };
  assert.equal((frames["named-claim"].render(asked, 84).match(/h-claim-line"/g) || []).length, 3);
});

test("an empty reply bubble is left off a slip, the spoken words stay", () => {
  const scene = {
    helper: "speech-scene",
    turns: [
      { speaker: "Sam", says: "Can I play?" },
      { speaker: "You", lines: 2 },
    ],
  };
  assert.match(frames["speech-scene"].render(scene, 120), /h-speech-blank/);
  const onSlip = frames["speech-scene"].render(forSlip(scene), 120);
  assert.doesNotMatch(onSlip, /h-speech-blank|h-speech-line|h-claim-line/);
  assert.match(onSlip, /Can I play\?/);
});

test("a follow-up prompt keeps its words and loses its lines on a slip", () => {
  const spec = { helper: "circle-the-answer", options: ["12", "21"], followUp: { text: "Explain how you know." } };
  const render = REGISTRY["circle-the-answer"].render;
  assert.match(render(spec, 84), /h-cq-line/);
  const onSlip = render(forSlip(spec), 84);
  assert.doesNotMatch(onSlip, /h-cq-line/);
  assert.match(onSlip, /Explain how you know\./);
});

// The numberer gives the slip numbered parts; this is the shape it hands on.
const sums = ["2,476 + 1,357 =", "3,658 + 1,347 =", "4,586 + 1,519 =", "2,769 + 1,236 =", "3,487 + 1,428 ="];
const numbered = {
  stack: [
    { helper: "instruction", text: "Use column addition.", groupPrompt: true },
    ...sums.map((text, i) => ({
      number: `1${"abcde"[i]}`,
      stack: [{ helper: "questions", items: [text], slip: true }],
    })),
  ],
};

test("five four-digit sums sit two across on a half-page slip", () => {
  const [laid] = slipNodesFor([numbered], 2);
  const rows = laid.stack.filter((node) => Array.isArray(node.row));
  assert.equal(rows.length, 3, "1a 1b, 1c 1d, 1e");
  assert.equal(laid.stack[0].text, "Use column addition.", "the task line keeps a line of its own");
});

test("a question too long for half a slip still keeps its own line", () => {
  const long = {
    stack: ["Round 4,280 to the nearest 1,000.", "Round 7,615 to the nearest 1,000."].map((text, i) => ({
      number: `1${"ab"[i]}`,
      stack: [{ helper: "questions", items: [text], slip: true }],
    })),
  };
  const [laid] = slipNodesFor([long], 2);
  assert.ok(laid.stack.every((node) => !Array.isArray(node.row)));
});

test("a question inside quotation marks is somebody's words and stays black", () => {
  const starter = "You can begin: “I'm worried about ___. I noticed ___. Please can you help?”";
  assert.doesNotMatch(promptHtml(starter), /h-ask/);
  assert.doesNotMatch(promptHtml('Ask your partner: "What did you notice?"'), /h-ask/);
  // The question the child is asked is still blue beside its instruction.
  assert.match(promptHtml("Read the story. Who is right?"), /<span class="h-ask">Who is right\?<\/span>/);
  assert.match(
    promptHtml("Tariq says: “I'm fine.” Is Tariq fine?"),
    /<span class="h-ask">Is Tariq fine\?<\/span>/
  );
});

test("a blank stays on the line with the word before it, and is measured so", () => {
  assert.match(promptHtml("I'm worried about ___."), /about <span class="h-blank"/);
  // Tied, "about" and its blank cannot sit on different lines: at a width that
  // only fits the words, the pair moves down together.
  const narrow = linesFor("I'm worried about ___.", 50);
  assert.ok(narrow >= 2);
});

test("a blank on a slip is a word wide, unless the designer set its width", () => {
  const starter = { helper: "instruction", text: "I noticed ___." };
  assert.equal(forSlip(starter).blankWidthMm, 12);
  assert.equal(forSlip({ ...starter, blankWidthMm: 30 }).blankWidthMm, 30);
  assert.equal(forSlip({ helper: "instruction", text: "Use column addition." }).blankWidthMm, undefined);
});

test("a level that uses the Expected task unchanged is named for the run", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "shared-level-"));
  const adaptation = path.join(dir, "adaptation.md");
  fs.writeFileSync(
    adaptation,
    "# Adaptation\n\n## Greater Depth\n\nResource decision: Use Expected unchanged\n" +
      "Reason: The open final task already stretches them.\n\n## Below\n\n" +
      "Resource decision: Generate separate Below adaptation\n"
  );
  const worksheet = (sheets) => ({ meta: { adaptationPath: adaptation }, sheets });
  const books = { recording: "books" };

  const [shared, ...more] = sharedWithExpected(worksheet({ expected: books, below: {} }));
  assert.equal(more.length, 0, "Below has its own sheet");
  assert.equal(shared.label, "Greater Depth");
  assert.match(shared.line, /use the Expected slips/);
  assert.match(shared.line, /already stretches them/);

  assert.match(sharedWithExpected(worksheet({ expected: { recording: "sheet" } }))[0].line, /the Expected sheet/);
  // A Greater Depth sheet of its own is not named, whatever the plan said.
  assert.deepEqual(sharedWithExpected(worksheet({ expected: books, greaterDepth: {} })), []);
});
