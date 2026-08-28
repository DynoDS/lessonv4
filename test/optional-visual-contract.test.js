"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.join(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

test("resource designers resolve optional Educational SVG requests without a scout", () => {
  const skill = read("skills/make-lesson/SKILL.md");
  const playbook = read("skills/make-lesson/playbook.md");
  const reference = read("references/context-pictures.md");
  const readme = read("README.md");
  const slide = read("agents/slide-designer.md");
  const worksheet = read("agents/worksheet-designer.md");
  const stickIn = read("agents/stick-in-sheets-designer.md");
  const wall = read("agents/working-wall-designer.md");

  for (const designer of [slide, worksheet, stickIn, wall]) {
    assert.match(designer, /Resolve your own Educational SVG requests/i);
    assert.match(designer, /local-library search|local library/i);
    assert.match(designer, /no unresolved Educational SVG/i);
    assert.match(designer, /Do not spawn|Do not delegate/i);
  }

  assert.match(wall, /Resolve Your Own Educational SVG Requests/);
  assert.match(
    reference,
    /same visual designer[\s\S]*resolves its own request/i
  );
  assert.match(
    reference,
    /Do not spawn a separate Educational SVG resolver for any surface/
  );
  assert.match(reference, /\[PLUGIN_ROOT\]\/educational-svg\/search\.js/);
  assert.doesNotMatch(reference, /\[PLUGIN_ROOT\]\/\.\.\/educational-svg/);
  assert.match(reference, /EDUCATIONAL_SVG_UNAVAILABLE/);
  assert.match(
    reference,
    /educationalSvgId.*educationalSvgSlug.*imagePath/s
  );

  for (const content of [skill, playbook, reference, readme, wall]) {
    assert.doesNotMatch(
      content,
      /context-picture-scout|context-picture scout/i
    );
  }

  assert.equal(
    fs.existsSync(path.join(ROOT, "agents", "context-picture-scout.md")),
    false
  );
  assert.equal(fs.existsSync(path.join(ROOT, "educational-svg", "search.js")), true);
  assert.equal(
    fs.existsSync(
      path.join(ROOT, "educational-svg", "library", "standard", "ro", "robin.svg")
    ),
    true
  );

  assert.match(reference, /ordinary P2[\s\S]*emoji fallback/);
  assert.match(reference, /semantic vocabulary[\s\S]*text-only/);
  assert.match(reference, /failed P3 decoration/);
  assert.match(
    playbook,
    /slide-designer completes with final `lesson\.json`[\s\S]*check `lesson\.json` for a labelled diagram over a photo/
  );
  assert.doesNotMatch(playbook, /context-picture pass/i);
});

test("context contract keeps P2 and makes P3 Educational SVG-only", () => {
  const reference = read("references/context-pictures.md");
  assert.match(reference, /P2.*emoji.*Educational SVG/s);
  assert.match(reference, /P3 is Educational SVG-only/);
  assert.match(reference, /no emoji, photograph or AI-generation route/);
  assert.match(reference, /same source bytes.*reuse|identical.*reuse/is);
  assert.match(reference, /different\s+source bytes.*suffix|numeric suffix/is);
  assert.doesNotMatch(reference, /SVG-fetching|tool names may differ|incoming-candidate/i);
});

test("authoring contract keeps zero P3 valid", () => {
  const reference = read("references/context-pictures.md");
  const worksheet = read("agents/worksheet-designer.md");
  const wall = read("agents/working-wall-designer.md");

  assert.match(reference, /Zero is valid|There is no quota/i);
  assert.match(worksheet, /Zero is normal/);
  assert.match(wall, /Zero is normal/);
});

test("vocabulary allows semantic P2 and forbids P3", () => {
  const reference = read("references/context-pictures.md");
  const templates = read("references/templates.md");
  assert.match(
    reference,
    /Semantic vocabulary P2[\s\S]*"visual"[\s\S]*"kind": "educational-svg"/
  );
  assert.match(templates, /key-vocabulary/);
  assert.match(templates, /type.*vocab/s);
  assert.match(templates, /forbid.*P3|P3.*forbidden/s);
});

test("working-wall authorities agree that P3 never earns wall-worthiness", () => {
  const designer = read("agents/working-wall-designer.md");
  const preferences = read("references/working-wall-preferences.md");
  const visualLanguage = read("references/working-wall-visual-language.md");
  const builder = read("agents/working-wall-builder.md");
  for (const content of [designer, preferences, visualLanguage]) {
    assert.match(content, /P3/);
    assert.match(
      content,
      /(?:P3[\s\S]*(?:never count|never makes a card wall-worthy|cannot.*earn)|ignore every P3[\s\S]*Only P1 or genuine P2 counts)/i
    );
  }
  for (const type of [
    "stickyKnowledge",
    "workedExample",
    "sentenceStem",
    "misconception",
    "referenceTable",
    "equivalenceGrid",
  ]) {
    assert.match(designer, new RegExp(type));
  }
  assert.match(builder, /OPTIONAL_DECORATION_OMITTED/);
  assert.match(builder, /non-fatal|does not fail/i);
});

test("review contract makes contextual P3-only repair first", () => {
  const reviewer = read("agents/visual-reviewer.md");
  assert.match(reviewer, /smallest sound P3-only repair/);
  assert.match(
    reviewer,
    /moving.*resizing.*prominence\/transparency.*replacing.*removing/s
  );
  assert.match(reviewer, /Removal is always valid/);
  assert.doesNotMatch(reviewer, /repair in this order/i);
});

test("visual consistency does not demand decorative parity", () => {
  const reviewer = read("agents/visual-consistency-reviewer.md");
  assert.match(reviewer, /P3/);
  assert.match(reviewer, /not.*carry-across|no cross-resource.*decoration/s);
});

test("plugin version mirrors are identical at 3.31.0", () => {
  const claude = JSON.parse(read(".claude-plugin/plugin.json"));
  const codex = JSON.parse(read(".codex-plugin/plugin.json"));
  assert.equal(claude.version, "3.31.0");
  assert.equal(codex.version, "3.31.0");
});
