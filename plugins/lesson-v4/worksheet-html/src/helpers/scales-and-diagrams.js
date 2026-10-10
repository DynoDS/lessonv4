"use strict";

// The measuring scales and the thinking diagrams the board drew and paper could
// not: a dial scale, a measuring jug, a number network, a concept map, a
// fishbone, a continuum line and a source pathway.
//
// Each is the one shared drawing in shared/visuals/, the same one the board, the
// wall and the stick-in pack place, and it reached paper when every picture
// became one shared drawing reachable from every surface (13 September 2026:
// "it stops anything having to be built because 'it can't use that one'").
// Whether a sheet uses one is the worksheet designer's decision; the sheet only
// has to be able to draw it.
//
// What stays here is the sheet's own typed text: a question above the drawing
// (`text`) and a scale's caption under it (`label`), both set as sheet text so
// they wrap and print at the sheet's body size.

const { esc, linesFor, LINE_MM } = require("./shared");
const { TYPE, SPACE } = require("../tokens");
const { atPrintedWidth } = require("./at-printed-width");
const dialScaleShared = require("../../../shared/visuals/dial-scale-svg");
const measuringJugShared = require("../../../shared/visuals/measuring-jug-svg");
const numberNetworkShared = require("../../../shared/visuals/number-network-svg");
const conceptMapShared = require("../../../shared/visuals/concept-map-svg");
const fishboneShared = require("../../../shared/visuals/fishbone-svg");
const continuumLineShared = require("../../../shared/visuals/continuum-line-svg");
const sourcePathwayShared = require("../../../shared/visuals/source-pathway-svg");
const annotatedTextShared = require("../../../shared/visuals/annotated-text-svg");

const WIDEST_ZONE_MM = 261;

function lineMm(text, widthMm) {
  return text ? linesFor(text, widthMm) * LINE_MM + 2 : 0;
}

// A question above and a caption below, as sheet text around the drawing.
function withSheetText(helper, { caption = false } = {}) {
  const below = (spec) => (caption && spec.label ? String(spec.label) : "");
  const textMm = (spec, widthMm) => lineMm(spec.text, widthMm) + lineMm(below(spec), widthMm);
  return {
    ...helper,
    render: (spec, width) => {
      const figure = helper.render(spec, width);
      if (!spec.text && !below(spec)) return figure;
      return (
        `<div class="h-figure-block">` +
        // A line break the designer typed is kept, as promptHtml keeps it.
        (spec.text ? `<p class="h-figure-stem">${esc(spec.text).replace(/\r\n|\r|\n/g, "<br>")}</p>` : "") +
        figure +
        (below(spec) ? `<p class="h-figure-stem h-figure-caption">${esc(below(spec))}</p>` : "") +
        `</div>`
      );
    },
    measure: (spec, width) => {
      const mm = typeof width === "number" ? width : width && width.widthMm;
      return textMm(spec, mm || WIDEST_ZONE_MM) + helper.measure(spec, width);
    },
    needs: (spec, width) => {
      const inner = helper.needs(spec, width);
      // Words wrap onto more lines in a narrower zone, so the shortest this can
      // come out is whichever of the narrowest and widest zones is shorter.
      const atNarrowest = inner.minHeightMm + textMm(spec, inner.minWidthMm);
      const atWidest = helper.measure(spec, WIDEST_ZONE_MM) + textMm(spec, WIDEST_ZONE_MM);
      return { ...inner, minHeightMm: Math.min(atNarrowest, atWidest) };
    },
  };
}

// The sheet's text is its own, so the drawing is handed the spec without it. A
// network's `label` stays in, because it tells the drawing to leave out its own
// target sentence.
const withoutText = (spec) => ({ ...spec, text: undefined });
const withoutCaption = (spec) => ({ ...spec, text: undefined, label: undefined });

// The gap between two words of a sentence a child writes a mark into, in ems
// of its own type (see withWriteInSentence, below).
const WRITE_IN_WORD_GAP_EM = 0.5;

const css = `
  .h-figure-caption { margin: var(--space-tight) 0 0; text-align: center; font-weight: bold; }
  .h-write-in-sentence {
    margin: 0 0 var(--space-tight); text-align: left; line-height: 1.35;
    font-size: var(--type-writeIn); word-spacing: ${WRITE_IN_WORD_GAP_EM}em;
  }
`;

// One sentence a child writes a mark into.
//
// "Put the comma in each sentence" was drawn by the marked-text drawing in its
// write-on form, which is made for a whole passage a child annotates: wide
// margins either side for notes, at the size a drawing's words print. So one
// sentence landed in the middle of the page, up to 62mm from its question
// number, the smallest print on the sheet, with ordinary spaces where the comma
// had to go (stress test, 7 October 2026). There is nothing to draw in a
// sentence with no marks on it, so it is set as a line of print: beside its
// number like every other line, a size up, with wide gaps between the words.
// The teacher chose this from pictures of the real Year 4 sheet (10 October
// 2026).
//
// Only the plain case: `space: "annotate"` with nothing marked, linked,
// bracketed, counted or titled, and either one short paragraph of prose or a
// few short `lines`. Anything more is a marked text and is drawn as one.
const WRITE_IN_LONGEST = 160; // characters: a sentence or two, not a passage
const PT_MM = 0.3528;

// The sentences to set as print, or null when this is a marked text. Prose of
// one paragraph is one sentence line; a few `lines` are a line each (a child's
// four sentences to check, each on its own line).
const WRITE_IN_MOST_LINES = 8;

function writeInSentences(spec) {
  if (!spec || String(spec.space || "").toLowerCase() !== "annotate") return null;
  const none = (v) => v == null || (Array.isArray(v) && v.length === 0) || v === "";
  if (![spec.marks, spec.links, spec.brackets, spec.counts, spec.callouts, spec.title].every(none)) return null;
  const short = (s) => typeof s === "string" && s.trim() && s.trim().length <= WRITE_IN_LONGEST;
  if (!none(spec.lines)) {
    if (!none(spec.passage) || !Array.isArray(spec.lines) || spec.lines.length > WRITE_IN_MOST_LINES) return null;
    return spec.lines.every(short) ? spec.lines.map((s) => s.trim()) : null;
  }
  const passage = typeof spec.passage === "string" ? spec.passage.trim() : "";
  if (!short(passage) || /\n\s*\n/.test(passage)) return null;
  return [passage];
}

function writeInLines(sentence, widthMm) {
  const grown = TYPE.writeIn / TYPE.body;
  const gaps = Math.max(0, sentence.split(/\s+/).length - 1);
  // The same count the sheet's other lines use, at the width the bigger letters
  // and wider gaps leave.
  const gapMm = WRITE_IN_WORD_GAP_EM * TYPE.writeIn * PT_MM;
  const perLine = Math.max(1, Math.round(gaps / Math.max(1, linesFor(sentence, widthMm / grown))));
  return linesFor(sentence, Math.max(20, (widthMm - perLine * gapMm) / grown));
}

function withWriteInSentence(helper) {
  const widthOf = (width) => (typeof width === "number" ? width : (width && width.widthMm) || WIDEST_ZONE_MM);
  const heightMm = (spec, sentences, widthMm) =>
    sentences.reduce((mm, s) => mm + writeInLines(s, widthMm) * TYPE.writeIn * PT_MM * 1.35 + SPACE.tight, 0) +
    lineMm(spec.text, widthMm);
  return {
    ...helper,
    render: (spec, width) => {
      const sentences = writeInSentences(spec);
      if (!sentences) return helper.render(spec, width);
      const stem = spec.text ? `<p class="h-figure-stem">${esc(spec.text).replace(/\r\n|\r|\n/g, "<br>")}</p>` : "";
      return stem + sentences.map((s) => `<p class="h-write-in-sentence">${esc(s)}</p>`).join("");
    },
    measure: (spec, width) => {
      const sentences = writeInSentences(spec);
      return sentences ? heightMm(spec, sentences, widthOf(width)) : helper.measure(spec, width);
    },
    needs: (spec, width) => {
      const sentences = writeInSentences(spec);
      return sentences
        ? { minWidthMm: 80, minHeightMm: heightMm(spec, sentences, WIDEST_ZONE_MM) }
        : helper.needs(spec, width);
    },
  };
}

const helpers = {
  // A dial a child reads needs about 45mm across before its numbers crowd.
  "dial-scale": withSheetText(atPrintedWidth(dialScaleShared, { toSpec: withoutCaption, minWidthMm: 45 }), { caption: true }),
  "measuring-jug": withSheetText(atPrintedWidth(measuringJugShared, { toSpec: withoutCaption, minWidthMm: 35 }), { caption: true }),
  "number-network": withSheetText(atPrintedWidth(numberNetworkShared, { toSpec: withoutText, minWidthMm: 50 }), { caption: true }),
  "concept-map": withSheetText(atPrintedWidth(conceptMapShared, { toSpec: withoutText, minWidthMm: 120 })),
  fishbone: withSheetText(atPrintedWidth(fishboneShared, { toSpec: withoutText, minWidthMm: 140 })),
  "continuum-line": withSheetText(atPrintedWidth(continuumLineShared, { toSpec: withoutText, minWidthMm: 90 })),
  "source-pathway": withSheetText(atPrintedWidth(sourcePathwayShared, { toSpec: withoutText, minWidthMm: 110 })),
  // A marked passage needs its margins beside it for the notes and arrows.
  // One unmarked sentence to write a mark into is a line of print instead.
  "annotated-text": withWriteInSentence(withSheetText(atPrintedWidth(annotatedTextShared, { toSpec: withoutText, minWidthMm: 110 }))),
};

module.exports = { helpers, css };
