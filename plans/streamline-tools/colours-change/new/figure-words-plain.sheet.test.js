"use strict";

// A taught word's braces never print from a figure (the colours release's third
// check, 25 September 2026). A figure's words are drawn into its picture by a
// shared drawing, which prints `{{enamel}}` as written, so the sheet hands every
// figure its spec without them and the word prints plain. These read the drawn
// picture's own text.

const assert = require("node:assert/strict");
const test = require("node:test");

const { renderContent } = require("../src/helpers");

// A one-pixel picture for the labelled diagram to label.
const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

function svgText(html) {
  const svgs = html.match(/<svg[\s\S]*?<\/svg>/g) || [];
  assert.ok(svgs.length, "no picture was drawn");
  return svgs.join("\n");
}

test("a Venn on the sheet draws its taught words plain", () => {
  const drawn = svgText(renderContent({
    helper: "venn",
    label1: "has a {{right angle}}",
    label2: "{{parallel}} sides",
    items: [{ region: "overlap", label: "{{Square}}" }],
  }));
  assert.ok(!/\{\{|\}\}/.test(drawn), "a taught word's braces are in the drawn Venn");
  assert.ok(drawn.includes("Square") && drawn.includes("parallel"), "the words themselves are drawn");
});

test("a labelled diagram on the sheet draws its taught words plain", () => {
  const drawn = svgText(renderContent({
    helper: "label-diagram",
    text: "Label the {{enamel}} and the root.",
    imageHref: PIXEL,
    imageWidth: 400,
    imageHeight: 300,
    // Given labels are drawn; the others are the child's to write.
    labels: [{ anchor: [30, 30], label: "{{enamel}}", given: true }, { anchor: [60, 70], label: "the {{root}}", given: true }],
  }));
  assert.ok(!/\{\{|\}\}/.test(drawn), "a taught word's braces are in the drawn diagram");
  assert.ok(drawn.includes("enamel") && drawn.includes("root"), "the words themselves are drawn");
});
