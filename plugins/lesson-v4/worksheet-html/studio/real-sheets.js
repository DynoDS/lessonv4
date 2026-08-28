"use strict";

// The library judged from the other end.
//
// Forty empty boxes are hard to have an opinion about. Six real sheets are not.
// These are the teacher's OWN documented sheet types, taken from
// references/worksheet-compositions.md ("Proven composition library"), each
// drawn on the layout that fits it, with every zone labelled with what actually
// goes there and how much of the page that type is supposed to get.
//
// The question this view answers is the useful one: does the library cover the
// sheets he really makes? Anything here that has no good layout is a gap.
// Anything in the library that never appears here is a candidate for cutting.

const { rows, cols } = require("../src/layouts");

// `share` is the band the teacher's own composition file states for the primary
// region, quoted so the layout can be checked against it rather than guessed.
const REAL_SHEETS = [
  {
    id: "source-response",
    name: "Source, then respond",
    blurb:
      "A photograph, short text, evidence cards, map or data source, then evidence selection and a response. More than one prompt must depend on reading it.",
    share: "source 24 to 52% of printable height",
    orientation: "portrait",
    layout: "third-then-two",
    tree: rows([1, 2], "source", "b"),
    labels: { source: "The source", b: "Questions and response" },
    example: "Four evidence cards, one inference, one claim to test, one decision.",
  },
  {
    id: "shared-visual-reasoning",
    name: "One visual, several questions",
    blurb:
      "One graph, grid, map, clock set or diagram shared by several prompts. It must stay usable for reading, plotting or drawing.",
    share: "visual 30 to 58%",
    orientation: "portrait",
    layout: "band-two-cols (adapted)",
    tree: rows([0.42, 0.28, 0.3], "visual", "read", "reason"),
    labels: {
      visual: "The chart, grid or map",
      read: "Read-off questions",
      reason: "Reasoning, with writing lines",
    },
    example:
      "One coordinate grid with labelled shapes, then a translation, an error to diagnose and a proof. This is Daniel's bar chart question: chart on top, fluency under it, reasoning at the foot.",
  },
  {
    id: "comparison-matrix",
    name: "Compare, then decide",
    blurb:
      "Pupils compare the same dimensions across cases, then explain or decide. Headings factual, pupils supply the comparison.",
    share: "matrix 24 to 52%",
    orientation: "landscape",
    layout: "two-then-third",
    tree: rows([2, 1], "matrix", "decide"),
    labels: { matrix: "The comparison grid", decide: "Explain or decide" },
    example: "Two communities compared for travel, resources and change, then a decision.",
  },
  {
    id: "classification-sorting",
    name: "Sort, then justify",
    blurb:
      "Sorting or classifying items, then boundary cases, exceptions or justification.",
    share: "sorting surface 28 to 58%",
    orientation: "landscape",
    layout: "halves-side",
    tree: cols([1, 1], "sortA", "sortB"),
    labels: { sortA: "Category one", sortB: "Category two" },
    example:
      "Sort evidence into cause categories, place one ambiguous item, then defend it. The justification needs a strip: this layout may need one adding.",
  },
  {
    id: "causal-chain-decision",
    name: "Build a chain, then decide",
    blurb:
      "Pupils construct or inspect a cause-and-effect chain before choosing and defending an action.",
    share: "chain 24 to 50%, decision 20 to 42%",
    orientation: "portrait",
    layout: "halves-stacked",
    tree: rows([1, 1], "chain", "decision"),
    labels: { chain: "The cause and effect chain", decision: "Decision and defence" },
    example: "Order road access, migration and forest loss, then decide where prevention is possible.",
  },
  {
    id: "practical-recording",
    name: "Record trials, then conclude",
    blurb:
      "Generated trials, observations or calculations recorded in a table, then a conclusion.",
    share: "recording 40 to 70%",
    orientation: "portrait",
    layout: "two-then-third",
    tree: rows([2, 1], "recording", "conclusion"),
    labels: { recording: "The recording table", conclusion: "Conclusion" },
    example: "Generate six trials, record method and result, spot a pattern and explain an exception.",
  },
];

module.exports = { REAL_SHEETS };
