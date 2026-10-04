"use strict";

// The working wall uses the board's colour meanings (the teacher's answer to
// decision 22 of the rest-of-preferences ledger, 24 September 2026: "yes"). A
// child who sees green mean "answer" on the board must not see it mean "method"
// on the wall. So: a sticky fact and a worked example are purple, the board's
// colour for both; taught words are green (the vocabulary cards leave teal); a
// misconception's right answer stays green and its wrong one red; titles and
// headers are blue, as the board's titles are; a sentence stem and a reference
// table are neutral, with any taught word inside them green; and colours that
// only tell parts apart are the board's category colours, never green. The
// mapping was derived from his answer and rendered for him to see.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const style = require("../style.json");
const {
  renderSentenceStem, renderStickyKnowledge, renderWorkedExample, renderMisconception, renderVocabDefinition,
} = require("../src/render-panels");
const { renderReferenceTable, renderVocabChips, renderEquivalenceGrid } = require("../src/render-grids");
const { renderDiagramSection } = require("../src/render-section");
const { renderLabelledDiagram, renderBanner, renderMnemonicPoster, renderSectionHeading } = require("../src/render-display");
const { renderHeroCallouts, renderCauseCards, renderPhotoMapOverview } = require("../src/render-overview");
const { preRenderSvgs } = require("../src/svg-renderer");

const FIXTURES_DIR = path.join(__dirname, "..", "test-fixtures-a3");
const A3_LANDSCAPE = { size: "A3", orientation: "landscape" };

const BLUE = "0070C0";
const GREEN = "00B050";
const PURPLE = "7030A0";
const RED = "C00000";
const HAS_NO_BOARD_MEANING = ["0D9488", "1F4E79", "D97706"]; // teal, navy, amber

test("every card colour in the palette is one the board uses, in the board's meaning", () => {
  const c = style.colours;
  assert.strictEqual(c.stickyTitleBarFill, PURPLE);
  assert.strictEqual(c.stickyPanelLine, PURPLE);
  assert.strictEqual(c.workedExampleTitleBarFill, PURPLE);
  assert.strictEqual(c.workedExamplePanelLine, PURPLE);
  assert.strictEqual(c.vocabDefinitionTitleBarFill, GREEN);
  assert.strictEqual(c.vocabDefinitionPanelLine, GREEN);
  assert.strictEqual(c.misconceptionRightPanelLine, GREEN);
  assert.strictEqual(c.misconceptionWrongPanelLine, RED);
  for (const key of [
    "misconceptionTitleBarFill",
    "sentenceStemTitleBarFill",
    "referenceTableHeaderFill",
    "equivalenceGridTitleBarFill",
    "mnemonicTitleBarFill",
    "labelledDiagramTitleBarFill",
  ]) {
    assert.strictEqual(c[key], BLUE, `${key} is a title, and a title is blue`);
  }
  // The stem's modelled line is a worked example of the stem.
  assert.strictEqual(c.sentenceStemLabel, PURPLE);
  // Every value the mapping decided, panels and bullets included, not only the
  // title bars: a purple title over a pale blue panel, or a green bullet on a
  // neutral stem, is two colour languages on one card.
  const decided = {
    stickyTitleBarFill: PURPLE, stickyPanelFill: "EDE3F5", stickyPanelLine: PURPLE, stickyLabel: PURPLE,
    workedExampleTitleBarFill: PURPLE, workedExamplePanelFill: "EDE3F5", workedExamplePanelLine: PURPLE,
    workedExampleLabel: PURPLE,
    sentenceStemTitleBarFill: BLUE, sentenceStemPanelFill: "F4F6FA", sentenceStemPanelLine: "7F7F7F",
    sentenceStemLabel: PURPLE, sentenceStemBullet: "000000",
    misconceptionTitleBarFill: BLUE, misconceptionWrongPanelLine: RED, misconceptionRightPanelLine: GREEN,
    referenceTableHeaderFill: BLUE,
    vocabDefinitionTitleBarFill: GREEN, vocabDefinitionPanelFill: "D5F5E3", vocabDefinitionPanelLine: GREEN,
    equivalenceGridTitleBarFill: BLUE, mnemonicTitleBarFill: BLUE, labelledDiagramTitleBarFill: BLUE,
  };
  for (const [key, value] of Object.entries(decided)) {
    assert.strictEqual(c[key], value, `${key} is ${c[key]}, and the mapping decided ${value}`);
  }
  const cardColours = Object.entries(c).filter(([key]) => key !== "rainbowPalette").map(([, value]) => value);
  for (const hue of HAS_NO_BOARD_MEANING) {
    assert.ok(!cardColours.includes(hue), `${hue} means nothing on the board and is back in the palette`);
  }
});

test("a sticky fact and a worked example are drawn purple", () => {
  const sticky = renderStickyKnowledge(
    { type: "stickyKnowledge", page: A3_LANDSCAPE, title: "Remember", items: [{ text: "A circuit needs a closed path." }] },
    style, FIXTURES_DIR, { svgImages: {} }
  );
  const worked = renderWorkedExample(
    { type: "workedExample", page: A3_LANDSCAPE, title: "How to do it", items: [{ label: "Step 1", text: "Find the tens column." }] },
    style, FIXTURES_DIR, { svgImages: {} }
  );
  for (const html of [sticky, worked]) {
    assert.match(html, new RegExp(`background:#${PURPLE}`, "i"));
    assert.doesNotMatch(html, /#1F4E79/i);
  }
});

test("a sentence stem is neutral, its modelled line purple, and a taught word in it green", () => {
  const html = renderSentenceStem(
    {
      type: "sentenceStem",
      page: A3_LANDSCAPE,
      title: "Say it like this",
      items: [{ text: "The {{enamel}} protects the tooth because ___.", filled: "The {{enamel}} protects the tooth because it is hard." }],
    },
    style, FIXTURES_DIR, { svgImages: {} }
  );
  assert.match(html, new RegExp(`background:#${BLUE}`, "i"), "the title bar is blue");
  assert.match(html, new RegExp(`color:#${PURPLE};">The `, "i"), "the modelled line is purple");
  // In the stem and in its modelled line alike.
  assert.strictEqual((html.match(new RegExp(`<span style="color:#${GREEN};">enamel</span>`, "gi")) || []).length, 2, "the taught word is green");
  assert.ok(!html.includes("{{"), "a mark's braces printed");
  assert.doesNotMatch(html, new RegExp(`background:#${GREEN}`, "i"), "the stem is not a green card any more");
});

test("a misconception keeps red beside green under a blue title", () => {
  const html = renderMisconception(
    {
      type: "misconception",
      page: A3_LANDSCAPE,
      title: "Look out for",
      items: [{ label: "Don't", text: "Leave a wire loose." }, { label: "Do", text: "Clip each wire firmly." }],
    },
    style, FIXTURES_DIR, { svgImages: {} }
  );
  assert.match(html, new RegExp(`background:#${BLUE}`, "i"));
  assert.match(html, new RegExp(`#${RED}`, "i"));
  assert.match(html, new RegExp(`#${GREEN}`, "i"));
  assert.doesNotMatch(html, /#D97706/i);
});

test("a reference table has a blue header, and a taught word in a cell is green", () => {
  const html = renderReferenceTable(
    {
      type: "referenceTable",
      page: A3_LANDSCAPE,
      title: "Layers of a tooth",
      columns: ["Layer", "What it does"],
      rows: [["{{enamel}}", "Protects the tooth."], ["{{dentine}}", "Supports the enamel."]],
    },
    style, FIXTURES_DIR, { svgImages: {} }
  );
  assert.match(html, new RegExp(`background:#${BLUE}`, "i"));
  assert.match(html, new RegExp(`<span style="color:#${GREEN};">enamel</span>`, "i"));
  assert.ok(!html.includes("{{"), "a mark's braces printed");
});

test("a section's parts take the board's category colours; a right result is green and a worked one purple", async () => {
  const card = {
    type: "diagramSection",
    page: A3_LANDSCAPE,
    title: "Rounding",
    parts: [
      { heading: "Nearer ten", visual: { type: "numberLine", start: 340, end: 350, interval: 5, labels: "all" }, notes: ["Find the {{halfway}} point."], result: "347 rounds to 350" },
      // A worked example, a mistaken one included, is purple: a wrong result
      // on answer green tells a child it is right.
      { heading: "Sam's mistake", visual: { type: "numberLine", start: 300, end: 400, interval: 50, labels: "all" }, result: "Sam wrote 340", worked: true },
      { heading: "Nearer thousand", visual: { type: "numberLine", start: 0, end: 1000, interval: 500, labels: "all" }, result: "347 rounds to 0" },
      { heading: "Nearer hundred", visual: { type: "numberLine", start: 300, end: 400, interval: 50, labels: "all" }, result: "347 rounds to 300" },
    ],
  };
  const svgImages = await preRenderSvgs({ cards: [card] }, __dirname);
  const html = renderDiagramSection(card, style, __dirname, { svgImages });
  const strips = [...html.matchAll(/data-part="heading" style="[^"]*background:#([0-9A-F]{6})/gi)].map((m) => m[1].toUpperCase());
  // A fourth part takes blue again, never green.
  assert.deepStrictEqual(strips, [BLUE, "E46C0A", PURPLE, BLUE]);
  const results = [...html.matchAll(/data-part="result" style="[^"]*background:#([0-9A-F]{6})/gi)].map((m) => m[1].toUpperCase());
  assert.deepStrictEqual(results, [GREEN, PURPLE, GREEN, GREEN]);
  assert.match(html, new RegExp(`<span style="color:#${GREEN};">halfway</span>`, "i"));
  for (const hue of HAS_NO_BOARD_MEANING) assert.ok(!html.toUpperCase().includes(`#${hue}`), `${hue} is on the sheet`);
});

test("the labelled diagram's title is a blue title, not the worked example's colour", () => {
  const html = renderLabelledDiagram(
    { type: "labelledDiagram", page: A3_LANDSCAPE, title: "Parts of a pictogram" },
    style, FIXTURES_DIR, { svgImages: {} }
  );
  assert.match(html, new RegExp(`background:#${BLUE}`, "i"));
  assert.doesNotMatch(html, new RegExp(`background:#${PURPLE}`, "i"));
});

test("the overview sheets use the board's colours: blue titles, a blue and orange pair, a purple idea to keep", () => {
  const { renderHeroCallouts, renderCauseCards, renderPhotoMapOverview } = require("../src/render-overview");
  const card = (name) => require(`../test-fixtures-a3/${name}.json`).cards[0];
  const hero = renderHeroCallouts(card("heroCallouts-a3"), style, FIXTURES_DIR);
  const cause = renderCauseCards(card("causeCards-a3"), style, FIXTURES_DIR);
  const map = renderPhotoMapOverview(card("photoMapOverview-a3"), style, FIXTURES_DIR);
  for (const html of [hero, cause, map]) {
    assert.match(html, new RegExp(`background:#${BLUE}`, "i"), "the title bar is blue");
    for (const hue of HAS_NO_BOARD_MEANING) assert.ok(!html.toUpperCase().includes(`#${hue}`), `${hue} is on the sheet`);
  }
  // Two parallel groups take the board's default pairing, blue then orange.
  assert.match(hero, /color:#0070C0;[^>]*>What we can see/i);
  assert.match(hero, /color:#E46C0A;[^>]*>Why it matters/i);
  // The reason a cause card teaches, and the big idea, are the purple of a fact to keep.
  assert.match(cause, new RegExp(`color:#${PURPLE};[^>]*>To raise more cattle`, "i"));
  assert.match(map, new RegExp(`color:#${PURPLE};[^>]*>The big idea`, "i"));
  // The map's caption is words, not a title: black on a neutral ground, where
  // it was blue on pale blue.
  const caption = card("photoMapOverview-a3").map.caption;
  assert.ok(map.includes(`color:#000000;">${caption}</div>`), `the map caption "${caption}" is not black`);
  assert.match(map, /background:#F4F6FA/i);
  assert.doesNotMatch(map, /#DEEAF1/i);
});

// ─── a taught word's braces never print, and never change a fit ─────────────

const RENDERERS = {
  stickyKnowledge: renderStickyKnowledge, workedExample: renderWorkedExample, sentenceStem: renderSentenceStem,
  misconception: renderMisconception, referenceTable: renderReferenceTable, vocabDefinition: renderVocabDefinition,
  vocabChips: renderVocabChips, equivalenceGrid: renderEquivalenceGrid, mnemonicPoster: renderMnemonicPoster,
  sectionHeading: renderSectionHeading, banner: renderBanner, labelledDiagram: renderLabelledDiagram,
  photoMapOverview: renderPhotoMapOverview, heroCallouts: renderHeroCallouts, causeCards: renderCauseCards,
  diagramSection: renderDiagramSection,
};

// The words a child reads, on every card type the fixtures carry. A label that
// a renderer matches on ("Don't", "Do") and a visual's own fields are left.
const WORDS = new Set([
  "title", "text", "filled", "definition", "caption", "heading", "notes", "steps", "result", "subtitle",
  "phrase", "keySentence", "keyHeading", "heroCaption", "reason", "action", "actor", "word", "rows",
  "columns", "items", "callouts",
]);

function markTaughtWords(node, key) {
  if (typeof node === "string") {
    return WORDS.has(key) ? node.replace(/[A-Za-z]{4,}/, (word) => `{{${word}}}`) : node;
  }
  if (Array.isArray(node)) return node.map((item) => markTaughtWords(item, key));
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    out[k] = k === "visual" || k === "label" || k === "photo" || k === "type" ? v : markTaughtWords(v, WORDS.has(k) ? k : key === "rows" ? "rows" : k);
  }
  return out;
}

test("a taught word's braces never print, on any card type", async () => {
  const seen = new Set();
  for (const name of fs.readdirSync(FIXTURES_DIR).filter((file) => file.endsWith(".json"))) {
    const spec = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, name), "utf8"));
    for (const card of spec.cards || []) {
      const render = RENDERERS[card.type];
      if (!render) continue;
      const marked = markTaughtWords(card);
      const svgImages = await preRenderSvgs({ cards: [marked] }, FIXTURES_DIR);
      const html = render(marked, style, FIXTURES_DIR, { svgImages });
      assert.ok(!html.includes("{{") && !html.includes("}}"), `${card.type} in ${name} printed a mark's braces`);
      seen.add(card.type);
    }
  }
  for (const type of ["stickyKnowledge", "workedExample", "sentenceStem", "misconception", "vocabChips", "heroCallouts", "causeCards", "photoMapOverview"]) {
    assert.ok(seen.has(type), `no fixture drew ${type}`);
  }
});

test("a sticky fact, a definition and a misconception draw a taught word green", async () => {
  const sticky = renderStickyKnowledge(
    { type: "stickyKnowledge", page: A3_LANDSCAPE, title: "Remember", items: [{ text: "{{Enamel}} cannot grow back." }] },
    style, FIXTURES_DIR, { svgImages: {} }
  );
  const definition = renderVocabDefinition(
    { type: "vocabDefinition", page: A3_LANDSCAPE, title: "enamel", definition: "The hard {{layer}} on a tooth." },
    style, FIXTURES_DIR, { svgImages: {} }
  );
  const misconception = renderMisconception(
    { type: "misconception", page: A3_LANDSCAPE, title: "Look out for",
      items: [{ label: "Don't", text: "Think {{enamel}} grows back." }, { label: "Do", text: "Look after the {{enamel}} you have." }] },
    style, FIXTURES_DIR, { svgImages: {} }
  );
  assert.match(sticky, new RegExp(`<span style="color:#${GREEN};">Enamel</span>`, "i"));
  assert.match(definition, new RegExp(`<span style="color:#${GREEN};">layer</span>`, "i"));
  assert.strictEqual((misconception.match(new RegExp(`<span style="color:#${GREEN};">enamel</span>`, "gi")) || []).length, 2);
  // On a coloured strip a taught word prints plain: green on green is no word.
  const sectionCard = { type: "diagramSection", page: A3_LANDSCAPE, title: "Rounding",
    parts: [{ heading: "The {{nearest}} ten", steps: ["Look at the ones."] },
      { heading: "Check", visual: { type: "numberLine", start: 340, end: 350, interval: 5, labels: "all" },
        notes: ["347 is nearer 350."], result: "346 rounds to the {{nearest}} ten: 350" }] };
  const svgImages = await preRenderSvgs({ cards: [sectionCard] }, FIXTURES_DIR);
  const section = renderDiagramSection(sectionCard, style, FIXTURES_DIR, { svgImages });
  assert.ok(!section.includes("{{"), "the braces printed on a strip");
  assert.match(section, /data-part="result"[^>]*><div[^>]*>346 rounds to the nearest ten: 350</);
});

// A mark is never measured: the words a child reads are the same with or
// without it, so the card fits them at the same size.
test("a card with colour marks fits its words at the size the same words fit without them", async () => {
  const sizes = (html) => [...html.matchAll(/font-size:([0-9.]+)pt/g)].map((m) => Number(m[1]));
  // Each card at a length where four more characters a mark would change the
  // size (the `##` copy proves it), so a card that measured its marks fails.
  const many = (n, open, close) => (word) =>
    Array.from({ length: n }, (_, i) => (i % 2 ? `${open}${word}${close}` : word)).join(" ");
  const cards = [
    [6, renderStickyKnowledge, (w) => ({ type: "stickyKnowledge", page: A3_LANDSCAPE, title: "Remember", items: [{ text: w("enamel") }, { text: w("dentine") }] })],
    [16, renderVocabDefinition, (w) => ({ type: "vocabDefinition", page: A3_LANDSCAPE, title: "enamel", definition: w("layer") })],
    [4, renderMisconception, (w) => ({ type: "misconception", page: A3_LANDSCAPE, title: "Look out for", items: [{ label: "Don't", text: w("enamel") }, { label: "Do", text: w("dentine") }] })],
    [7, renderSentenceStem, (w) => ({ type: "sentenceStem", page: A3_LANDSCAPE, title: "Say it", items: [{ text: w("enamel"), filled: w("dentine") }] })],
    [3, renderReferenceTable, (w) => ({ type: "referenceTable", page: A3_LANDSCAPE, title: "Layers", columns: ["Layer", "What it does"], rows: [[w("enamel"), w("dentine")], [w("pulp"), w("root")]] })],
    [8, renderDiagramSection, (w) => ({ type: "diagramSection", page: A3_LANDSCAPE, title: "Rounding", parts: [
      { heading: "Nearer ten", visual: { type: "numberLine", start: 340, end: 350, interval: 5, labels: "all" }, notes: [w("halfway")] },
      { heading: "Strategy", steps: [w("ones"), w("round")] }] })],
  ];
  for (const [n, render, cardFor] of cards) {
    const drawn = async (open, close) => {
      const card = cardFor(many(n, open, close));
      const svgImages = await preRenderSvgs({ cards: [card] }, FIXTURES_DIR);
      return sizes(render(card, style, FIXTURES_DIR, { svgImages }));
    };
    const plain = await drawn("", "");
    const type = cardFor(many(n, "", "")).type;
    assert.notDeepStrictEqual(await drawn("##", "##"), plain, `${type}: the length does not test the fit`);
    assert.deepStrictEqual(await drawn("{{", "}}"), plain, `${type} measured its marks`);
  }
});

// ─── a taught word's braces never print from a figure ───────────────────────
// The third check: a labelled diagram's labels and a Venn's items printed their
// braces, drawn into the picture where the page's text check could not see
// them. The wall takes the braces off a figure's words in its pre-render and in
// its card lookup alike, so the two agree. This reads the drawn picture's text.

test("a taught word's braces never print from a figure on the wall, and the card still finds its picture", async () => {
  const vennShared = require("../../shared/visuals/venn-svg");
  const labelShared = require("../../shared/visuals/label-diagram-svg");
  const drawn = [];
  const record = (module) => {
    const original = module.tightSvg;
    module.tightSvg = (...args) => {
      const out = original(...args);
      drawn.push(out.svg);
      return out;
    };
    return () => { module.tightSvg = original; };
  };
  const restore = [record(vennShared), record(labelShared)];
  try {
    const venn = { type: "venn", label1: "has a {{right angle}}", label2: "{{parallel}} sides",
      shapes: [{ region: "overlap", label: "{{Square}}" }] };
    const diagram = { type: "label-diagram", imagePath: "photos/pizza.jpg",
      callouts: [{ anchor: [30, 30], label: "{{crust}}", given: true }, { anchor: [60, 70], label: "the {{topping}}", given: true }] };
    const cards = [
      { type: "stickyKnowledge", page: A3_LANDSCAPE, title: "Remember", items: [{ text: "Squares sit in both circles." }], visual: venn },
      { type: "stickyKnowledge", page: A3_LANDSCAPE, title: "Remember", items: [{ text: "A pizza has parts." }], visual: diagram },
    ];
    const svgImages = await preRenderSvgs({ cards }, FIXTURES_DIR);
    const text = drawn.join("\n");
    assert.ok(drawn.length >= 2, "the two figures were not drawn");
    assert.ok(!/\{\{|\}\}/.test(text), "a taught word's braces are in a drawn figure");
    assert.ok(text.includes("Square") && text.includes("crust"), "the words themselves are drawn");
    for (const card of cards) {
      const html = renderStickyKnowledge(card, style, FIXTURES_DIR, { svgImages });
      assert.match(html, /<img src="data:image\/png;base64,/, `the card lost its ${card.visual.type}: its lookup and the pre-render disagree`);
    }
  } finally {
    restore.forEach((undo) => undo());
  }
});
