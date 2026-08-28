"use strict";

// One A4 page showing the settled worksheet colour system in use, printed so
// Daniel can check it on paper rather than on a screen. Not a set of choices:
// the system is decided. This proves it reads.
//
// The sample deliberately puts all four roles on one page in the shapes they
// actually take on a sheet, because the question is never "is this a nice
// green" but "can a child tell these four things apart at a glance".

const { pageSize, DEFAULT_MARGIN_MM } = require("../src/page");

const QUESTION = "#0070C0"; // the question or focus, same as the deck
const VOCAB = "#00B050"; // the deck's green, carrying its vocabulary meaning
const GIVEN = "#E46C0A"; // material handed to the child, same as the deck
const INK = "#000000"; // what the child writes, and scaffold starters
const RULE = "#999999"; // writing lines

function sample() {
  return `
    <section class="sample">
      <p class="q">Which container holds the most?</p>
      <p class="given">Word bank: millilitres, litres, capacity</p>
      <p class="body">A jug holds 500<span class="vocab">ml</span>. Measure its
         <span class="vocab">capacity</span> using the scale on the side.</p>
      <p class="scaffold">I know it holds more because ...</p>
      <div class="lines"><span></span><span></span><span></span></div>
    </section>`;
}

function buildColourOptionsHtml() {
  const { widthMm, heightMm } = pageSize("portrait");
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Worksheet palette proof</title>
<style>
  @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Comic Sans MS", cursive;
    width: ${widthMm}mm;
    padding: ${DEFAULT_MARGIN_MM}mm;
    box-sizing: border-box;
    font-size: 12pt;
    color: ${INK};
  }
  h1 { font-size: 15pt; margin: 0 0 2mm; }
  .intro { font-size: 9pt; color: #666; margin: 0 0 8mm; }

  .key { margin-bottom: 10mm; font-size: 11pt; }
  .key div { margin-bottom: 2mm; }
  .swatch {
    display: inline-block; width: 12mm; height: 5mm;
    vertical-align: middle; margin-right: 3mm;
  }

  .sample { border-top: 0.3mm solid #CCC; padding-top: 6mm; }
  p { margin: 0 0 3mm; }
  .q { font-size: 15pt; color: ${QUESTION}; }
  .given { color: ${GIVEN}; }
  .vocab { color: ${VOCAB}; }
  /* Scaffold carries no colour: it is set apart by size and its own line. */
  .scaffold { font-size: 10.5pt; }
  .lines span {
    display: block;
    border-bottom: 0.35mm dotted ${RULE};
    height: 8mm;
  }
</style></head>
<body>
  <h1>Worksheet colour system</h1>
  <p class="intro">Print this. Check each role is tellable apart at arm's length,
     and that the scaffold line reads as help rather than as another question.</p>

  <div class="key">
    <div><span class="swatch" style="background:${QUESTION}"></span>The question or focus</div>
    <div><span class="swatch" style="background:${VOCAB}"></span>Vocabulary, a word that matters</div>
    <div><span class="swatch" style="background:${GIVEN}"></span>Given to you: word banks, supplied values</div>
    <div><span class="swatch" style="background:${INK}"></span>What you write, and sentence-starters</div>
  </div>

  ${sample()}
</body></html>`;
}

module.exports = { buildColourOptionsHtml, QUESTION, VOCAB, GIVEN, INK };
