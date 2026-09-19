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
  // The slides' optional layer is resolved by the Slide Decorator, the pass
  // in its own worker since 1 Sept 2026; the Slide Designer composes and
  // leaves room but authors no request.
  const decorator = read("agents/slide-decorator.md");
  const slide = read("agents/slide-designer.md");
  const worksheet = read("agents/worksheet-designer.md");
  const stickIn = read("agents/stick-in-sheets-designer.md");
  const wall = read("agents/working-wall-designer.md");

  assert.doesNotMatch(slide, /Resolve your own Educational SVG requests/i);
  for (const designer of [decorator, worksheet, stickIn, wall]) {
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
  // Optional pictures are settled by the decorator on the promoted spec, so
  // the orchestrator waits on the finished lesson.json (its decoration and
  // its terminal pictures) and only then anchors any labelled diagram over a
  // real photograph.
  assert.match(
    playbook,
    /Wait until Slide Designer, the Slide Decorator \(or its degrade\) and all\s+picture filenames referenced by `lesson\.json`[\s\S]*labelled diagram over a photo, launch Diagram\s+Anchor/
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

test("the wall's authorities agree on what earns a card its place", () => {
  // These four documents are one authority split across four files, and on
  // 6 September 2026 they stopped agreeing. That commit retired the visual
  // gate, which had made a recognised picture the entry ticket for every card:
  // the load-bearing principle, the card criteria, the visual rules and the
  // deterministic check were all rewritten so that a clear text-led reference
  // is valid and a missing optional picture is not grounds to drop a card.
  //
  // The retired rule survived in about ten other places, including the packet
  // file cut for every run, so the designer was told to apply a "visual gate,
  // rule 2" that rule 2 no longer contained. This test used to pin the retired
  // wording in place, which is why it went red that day and stayed red: it
  // asserted the old policy rather than agreement about the current one.
  const contracts = read("references/working-wall-card-contracts.md");
  const designer = read("agents/working-wall-designer.md");
  const visualLanguage = read("references/working-wall-visual-language.md");
  const builder = read("agents/working-wall-builder.md");

  // What earns a card its place, in the file the packet cuts for every run.
  assert.match(contracts, /point-at test/i);
  assert.match(contracts, /text-led reference is valid/i);

  // P3's real constraints, in the agent that places it.
  assert.match(designer, /P3 is allowed only on/);
  assert.match(designer, /A failed P3\s+removes only that decoration, never the card/);
  assert.match(
    designer,
    /A decoration is not teaching content and never what makes a card worth its\s+space/
  );

  // A decoration never stands in for the teaching, in the file that owns visuals.
  assert.match(visualLanguage, /P3 decoration does not replace teaching content/);

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

test("no wall instruction still asserts the retired visual gate", () => {
  // Pointed the other way round from the test above, because the failure worth
  // catching is a retired rule left running, not a current one left unsaid. A
  // passage may still name the gate to record that it was replaced, or to
  // forbid an `entryTicket` field; asserting it as live is what fails here.
  const RETIRED =
    /visual gate|visual-entry|entry.?ticket|words-only|earns wall-worthiness|recognised visual that earns/i;
  const RECORDS_THE_RETIREMENT = /replaced|retired|no longer|do not add fields/i;

  for (const file of [
    "agents/working-wall-designer.md",
    "agents/working-wall-builder.md",
    "references/working-wall-card-contracts.md",
    "references/working-wall-preferences.md",
    "references/working-wall-visual-language.md",
    "references/context-pictures.md",
    "skills/make-lesson/playbook-lite.md",
    "scripts/working-wall-packet.py",
  ]) {
    for (const paragraph of read(file).split(/\r?\n\s*\r?\n/)) {
      if (!RETIRED.test(paragraph)) continue;
      assert.ok(
        RECORDS_THE_RETIREMENT.test(paragraph),
        `${file} still asserts the retired visual gate: ${paragraph.trim().slice(0, 160)}`
      );
    }
  }
});

test("the drawing-landed confirmation makes the smallest P3-only repair first", () => {
  // The one pass that sees a decoration obstructing something is the Slide
  // Designer's own confirming render, taken after it has authored and resolved
  // the layer. Swapping in a different drawing was on this list once, but a
  // different drawing at the same size and place covers exactly what the first
  // one did.
  const decorator = read("agents/slide-decorator.md");
  const look = decorator.split("## Confirm the layer landed where you put it")[1];
  assert.ok(look, "slide-decorator.md has no drawing-landed confirmation");
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
  const decorator = read("agents/slide-decorator.md");
  assert.match(decorator, /now draws the optional layer/);
});
