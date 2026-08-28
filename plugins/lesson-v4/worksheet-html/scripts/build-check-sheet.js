#!/usr/bin/env node
"use strict";

// The check sheet: specific questions, each with the thing beside a ruler.
//
//   npm run check-sheet
//
// Two things this exists to fix, both of them Daniel's own words.
//
// "You keep saying check what looks wrong but I don't know how or what."
// Handing someone twenty-four pages and asking what looks wrong is not a
// question anybody can answer. So the questions are asked instead of implied,
// one thing each, in classroom language.
//
// "I'm not actually printing. But if it's on a PDF I can see if it's the right
// size." That killed the first version, which was built for paper and opened
// with "put a real ruler on this one". On a screen there IS no true size: a PDF
// viewer shows whatever its zoom setting says, so a box that is 40mm on paper
// can be any size at all on the glass.
//
// But RELATIVE size survives zoom perfectly. So every item is drawn beside a
// centimetre scale, in the same picture, at the same zoom. The scale reads 9cm
// whatever the zoom is, and the box beside it is plainly a third of that. The
// size is also written out in words underneath, so it can be read rather than
// estimated.
//
// What Claude can judge on its own is deliberately not asked about: alignment,
// spacing, whether anything is clipped, whether the colours are consistent.
// Those are checks, not judgements, and they already run. What is left is the
// part that genuinely needs a teacher.

const fs = require("node:fs");
const path = require("node:path");

const { REGISTRY, helperCss } = require("../src/helpers");
const { cssVariables, FONT } = require("../src/tokens");
const { htmlToPdf } = require("../src/chrome");
const EXAMPLES = require("../test/helper-examples");

function atMinimum(name) {
  return REGISTRY[name].needs({ helper: name, ...EXAMPLES[name] }).minWidthMm;
}

function measureAt(name, spec, widthMm) {
  return REGISTRY[name].measure(spec, widthMm);
}

const QUESTIONS = [
  {
    helper: "storyboard",
    widthMm: 90,
    ask: "Is each box big enough for a child to draw a picture in?",
    sizeNote: "Each drawing box is about <strong>4.3cm across and 2.2cm tall</strong>.",
    options: ["Fine", "Too small", "Could be smaller"],
  },
  {
    helper: "match-up",
    widthMm: 84,
    ask: "Is there enough room down the middle to draw the lines?",
    sizeNote: "The gap down the middle is about <strong>1.8cm</strong>.",
    why: "This is a half-page column, so it is the narrowest a match-up ever gets.",
    options: ["Fine", "Too narrow"],
  },
  {
    helper: "fact-file",
    widthMm: 70,
    ask: "Is there room to write a country name in each slot?",
    sizeNote: "Each slot is about <strong>1.8cm tall</strong>.",
    options: ["Fine", "Too small", "Could be smaller"],
  },
  {
    helper: "tally-chart",
    ask: "Could a child read this tally chart from their table?",
    why: "This size has been a guess since day one. Nobody has looked at one yet.",
    options: ["Fine", "Too small", "Could be smaller"],
  },
  {
    helper: "pictogram",
    ask: "Same question: could a child read this pictogram?",
    why: "Also a guess.",
    options: ["Fine", "Too small", "Could be smaller"],
  },
  {
    helper: "grid-map",
    ask: "Can you read the place names inside the squares without them crowding the lines?",
    why: "The third guess, and the one most likely to be wrong.",
    options: ["Fine", "Too small", "Could be smaller"],
  },
  {
    helper: "coin-strip",
    widthMm: 150,
    spec: { coins: ["£2", "50p", "10p", "£1", "2p", "20p", "5p", "1p"] },
    ask: "Do these look like real coins, and are the sizes right against each other?",
    why:
      "They are drawn to their real diameters. Biggest to smallest should run " +
      "£2, 50p, 2p, 10p, £1, 20p, 1p, 5p. The old Word builder drew every coin " +
      "the same size, and size is the first thing a child sorts coins by.",
    options: ["Right", "Wrong"],
  },
  {
    helper: "written-answers",
    widthMm: 120,
    spec: {
      phase: "lower",
      items: [{ text: "Explain how you know.", lines: 3 }],
    },
    ask: "Are these writing lines far enough apart for a Year 2 child's handwriting?",
    sizeNote: "The lines are <strong>8mm apart</strong>.",
    why:
      "They are 8mm apart for Years 1 to 3 and 6mm for Years 4 to 6. Those two " +
      "numbers set the floor for every writing space in the engine, so they are " +
      "worth being sure about.",
    options: ["Fine", "Too close", "Too far apart"],
  },
];

// A centimetre scale, drawn to the same millimetres as the thing above it.
//
// This is what makes the sheet answerable on a screen. Absolute size is
// unknowable there, because the viewer's zoom decides it; but the scale is in
// the same picture at the same zoom, so the comparison holds however it is
// being looked at.
function scale(widthMm) {
  const cm = Math.floor(widthMm / 10);
  const ticks = [];
  for (let i = 0; i <= cm; i += 1) {
    ticks.push(
      `<span class="tick" style="left:${i * 10}mm"></span>` +
        `<span class="num" style="left:${i * 10}mm">${i}</span>`
    );
  }
  return `
    <div class="scale" style="width:${cm * 10}mm">
      <span class="rule"></span>${ticks.join("")}
      <span class="cm">cm</span>
    </div>`;
}

function block(q, i) {
  const spec = { helper: q.helper, ...(q.spec || EXAMPLES[q.helper]) };
  const widthMm = Math.round(q.widthMm || atMinimum(q.helper));
  const heightMm = Math.round(measureAt(q.helper, spec, widthMm));

  return `
  <section class="q">
    <div class="ask">
      <span class="n">${i + 1}</span>
      <div class="body">
        <p class="text">${q.ask}</p>
        ${q.why ? `<p class="why">${q.why}</p>` : ""}
        <p class="opts">${q.options.map((o) => `<span class="opt">${o}</span>`).join("")}</p>
      </div>
    </div>
    <div class="thing" style="width:${widthMm}mm">
      ${REGISTRY[q.helper].render(spec)}
    </div>
    ${scale(widthMm)}
    <p class="size">
      ${
        q.sizeNote
          ? q.sizeNote
          : `On a real worksheet this is <strong>${(widthMm / 10).toFixed(1)}cm</strong> across and about <strong>${(heightMm / 10).toFixed(1)}cm</strong> down.`
      }
      <span class="whole">The whole thing is ${(widthMm / 10).toFixed(1)}cm wide.</span>
    </p>
  </section>`;
}

function page() {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
${cssVariables()}
@page { size: A4 portrait; margin: 12mm; }
* { box-sizing: border-box; }
body { font-family: "${FONT}", cursive; margin: 0; color: var(--colour-ink); }

h1 { font-size: 16pt; margin: 0 0 2mm; }
.lead { font-size: 10.5pt; margin: 0 0 3mm; line-height: 1.35; }
.how {
  font-size: 10.5pt; line-height: 1.35;
  background: var(--colour-tint); padding: 3mm; margin: 0 0 7mm;
}
.how strong { color: var(--colour-question); }

.q { break-inside: avoid; page-break-inside: avoid; margin-bottom: 10mm; }
.ask { display: flex; gap: 3mm; align-items: flex-start; }
.n {
  flex: none; width: 7mm; height: 7mm; border-radius: 50%;
  background: var(--colour-question); color: white;
  font-size: 11pt; text-align: center; line-height: 7mm;
}
.body { flex: 1; }
.text { margin: 0; font-size: 12pt; line-height: 1.35; }
.why { margin: 1mm 0 0; font-size: 9pt; color: var(--colour-quiet); line-height: 1.35; }
.opts { margin: 2mm 0 0; font-size: 10.5pt; line-height: 1.35; }
.opt {
  display: inline-block; margin-right: 3mm;
  border: 0.3mm solid var(--colour-rule); border-radius: 2mm;
  padding: 0.5mm 2.5mm; color: var(--colour-quiet);
}

.thing { margin: 4mm 0 2mm 10mm; }

/* The scale sits directly under the thing and starts at the same left edge, so
   the two line up and can be read against each other without moving the eye. */
.scale { position: relative; height: 8mm; margin: 0 0 1mm 10mm; }
.rule {
  position: absolute; left: 0; right: 0; top: 0;
  border-top: 0.4mm solid var(--colour-question);
}
.tick {
  position: absolute; top: 0; height: 2.2mm; width: 0;
  border-left: 0.4mm solid var(--colour-question);
}
.num {
  position: absolute; top: 2.6mm; transform: translateX(-50%);
  font-size: 8pt; color: var(--colour-question); line-height: 1.35;
}
.cm {
  position: absolute; right: -7mm; top: 2.6mm;
  font-size: 8pt; color: var(--colour-question); line-height: 1.35;
}
.size { margin: 0 0 0 10mm; font-size: 9.5pt; line-height: 1.35; }
.whole { color: var(--colour-quiet); }

${helperCss}
</style></head>
<body>
  <h1>Worksheet check sheet</h1>
  <p class="lead">
    Eight questions. Each one is about a single thing, and the thing is shown
    below it with a centimetre scale underneath, so you can see how big it
    really is without printing anything. The scale is in the same picture, so it
    stays right however far you zoom in or out.
  </p>
  <p class="how">
    <strong>How to answer:</strong> just tell me in chat, by number.
    Something like &ldquo;1 fine, 2 too narrow, 4 too small&rdquo; is plenty.
    Anything you skip, I will leave alone.
    If a question does not make sense, say so: that means I asked it badly,
    not that you got it wrong.
  </p>
  ${QUESTIONS.map(block).join("")}
</body></html>`;
}

async function main() {
  const out = path.join(__dirname, "..", "out");
  fs.mkdirSync(out, { recursive: true });

  const html = page();
  fs.writeFileSync(path.join(out, "check-sheet.html"), html);
  fs.writeFileSync(path.join(out, "check-sheet.pdf"), await htmlToPdf(html, {}));

  console.log(`\n${QUESTIONS.length} questions, each beside a centimetre scale.`);
  console.log(`\n  ${path.join(out, "check-sheet.pdf")}\n`);
  console.log("Made for reading on screen. Nothing to print.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
