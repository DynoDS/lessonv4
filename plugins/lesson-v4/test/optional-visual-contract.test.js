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
  const playbook = read("skills/make-lesson/playbook-lite.md");
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
  // The library folder is resolved, never assumed: the drawings are not in the
  // package at all, and a fixed path read that as "not installed". Searching is
  // the package's own command, because the index it reads ships here.
  assert.match(reference, /--resolve-root/);
  assert.match(reference, /\[PLUGIN_ROOT\]\/scripts\/search-educational-svg\.js/);
  assert.doesNotMatch(reference, /\[EDUCATIONAL_SVG_ROOT\]\/search\.js/);
  assert.doesNotMatch(reference, /\[PLUGIN_ROOT\]\/educational-svg\/search\.js/);
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
  // The drawings are a large optional asset set and an install may not carry
  // them. Whichever way this package ships, a designer must be able to tell
  // before it searches, and must know what a run does instead.
  assert.match(
    reference,
    /Check the Educational SVG library is here before you use that route/
  );
  assert.match(
    reference,
    /the Educational SVG route is unavailable for the whole run/
  );
  assert.match(reference, /Do not run the search, preview or publish commands/);
  if (!fs.existsSync(path.join(ROOT, "educational-svg", "search.js"))) {
    assert.equal(
      fs.existsSync(
        path.join(ROOT, "educational-svg", "library", "standard", "ro", "robin.svg")
      ),
      false,
      "a shipped library must include its search entrypoint"
    );
  }

  assert.match(reference, /ordinary P2[\s\S]*emoji fallback/);
  assert.match(reference, /semantic vocabulary[\s\S]*text-only/);
  assert.match(reference, /failed P3 decoration/);
  // Optional pictures are settled inside the designer that owns the spec, so the
  // orchestrator waits on the finished lesson.json (and its terminal pictures)
  // and only then anchors any labelled diagram over a real photograph.
  assert.match(
    playbook,
    /Wait until Slide Designer and all picture filenames referenced by `lesson\.json`[\s\S]*labelled diagram over a photo, launch Diagram\s+Anchor/
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

test("the drawing-landed confirmation makes the smallest P3-only repair first", () => {
  // The one pass that sees a decoration obstructing something is the Slide
  // Designer's own confirming render, taken after it has authored and resolved
  // the layer. Swapping in a different drawing was on this list once, but a
  // different drawing at the same size and place covers exactly what the first
  // one did.
  const designer = read("agents/slide-designer.md");
  const look = designer.split("### Confirm the layer landed where you put it")[1];
  assert.ok(look, "slide-designer.md has no drawing-landed confirmation");
  assert.match(look, /smallest P3-only repair/);
  assert.match(look, /move it.*smaller.*fade it further.*remove it/s);
  assert.doesNotMatch(look, /replacing the source/);
  assert.match(look, /Removal is always valid/);
});

test("the confirming render is the first sight of a drawing in position", () => {
  // The scratch build skipped decorations unconditionally, so the preview the
  // designer inspected never contained its own optional layer, and the only
  // pass that ever saw one was a second spawn gated on a photograph having
  // landed. A deck could ship a drawing sitting on a word with no check and no
  // eye having looked at it once.
  const check = read("builder/scripts/check-slide-design.js");
  assert.doesNotMatch(
    check,
    /'--skip-optional-decorations'/,
    "the scratch build is skipping the optional layer again"
  );
  const designer = read("agents/slide-designer.md");
  assert.match(designer, /now draws the optional layer/);
});
