"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  REGISTRY,
  helperNames,
  helperCss,
  renderHelper,
  measure,
  greed,
  fits,
} = require("../src/helpers");

// The contract every helper signs, checked against the whole registry rather
// than helper by helper. A new helper is covered by these the moment it is
// added, which is the point: the previous design kept render, measure, needs
// and greed in four separate lists, so a helper could be added to three of
// them and quietly behave as a default in the fourth.

const A_HALF_COLUMN_MM = 87; // roughly a half-width column on A4 portrait
const FULL_WIDTH_MM = 180; // the full printable width, portrait

test("the registry is not empty", () => {
  assert.ok(helperNames().length > 0);
});

test("a standalone instruction is text, not an empty question list", () => {
  const html = renderHelper({ helper: "instruction", text: "Use the chart." });
  assert.match(html, /Use the chart\./);
  assert.doesNotMatch(html, /<li|<ol/);
});

test("a recording table can supply a middle cell and leave its neighbours writable", () => {
  const html = renderHelper({
    helper: "recording-table",
    columns: ["10 less", "Number", "10 more"],
    rows: [[null, "2,048", null]],
  });
  assert.match(html, /class="h-given">2,048/);
  assert.equal((html.match(/class="h-write"/g) || []).length, 2);
});

test("growing stack items retain their natural basis", () => {
  assert.match(helperCss, /\.h-stack-item--grows\s*\{\s*flex:\s*1 1 auto/);
});

test("every helper provides all four parts of the contract", () => {
  for (const [name, h] of Object.entries(REGISTRY)) {
    assert.equal(typeof h.render, "function", `"${name}" has no render`);
    assert.equal(typeof h.measure, "function", `"${name}" has no measure`);
    assert.equal(typeof h.needs, "function", `"${name}" has no needs`);
    assert.equal(typeof h.greed, "number", `"${name}" has no greed`);
  }
});

test("greed is a sensible appetite, not an arbitrary number", () => {
  for (const [name, h] of Object.entries(REGISTRY)) {
    assert.ok(
      Number.isFinite(h.greed) && h.greed >= 0 && h.greed <= 5,
      `"${name}" has greed ${h.greed}, which is outside 0 to 5`
    );
  }
});

test("an unknown helper is refused by name, with the known ones listed", () => {
  assert.throws(
    () => renderHelper({ helper: "not-a-real-helper" }),
    (err) => {
      assert.match(err.message, /UNKNOWN_HELPER/);
      assert.match(err.message, /not-a-real-helper/);
      // The list matters: it is what turns a dead end into a correction.
      assert.match(err.message, /questions/);
      return true;
    }
  );
});

test("helper names use lower-case-hyphen form, matching the Word builder", () => {
  // A worksheet written for one engine should read the same on the other.
  for (const name of helperNames()) {
    assert.match(name, /^[a-z][a-z0-9-]*$/, `"${name}" is not in the house form`);
  }
});

test("every helper's CSS is gathered for the page", () => {
  assert.equal(typeof helperCss, "string");
});

test("the line height in the CSS matches the one the estimates assume", () => {
  // These two numbers are the same fact written in two places, and when they
  // drifted apart every line of text came out taller than predicted and the
  // bottom of the zone was quietly clipped. Nothing about the page looked
  // wrong; a question was simply half missing.
  const { LINE_MM, BODY_PT, PT_MM } = require("../src/helpers/shared");
  const assumed = LINE_MM / (BODY_PT * PT_MM);

  const declared = helperCss.match(/line-height:\s*([\d.]+)/g) || [];
  assert.ok(declared.length > 0, "no line-height is pinned anywhere");
  for (const rule of declared) {
    const value = Number(rule.split(":")[1]);
    assert.ok(
      Math.abs(value - assumed) < 0.001,
      `the CSS pins line-height ${value} but the estimates assume ${assumed.toFixed(2)}`
    );
  }
});

test("spec fields are camelCase, so one convention holds across the engine", () => {
  // Some helpers were lifted from the Word builder, which writes its spec
  // fields in snake_case. Mixing the two means an author writes `wordBank`,
  // gets nothing, and is told nothing: the field is simply never read. One
  // convention, checked here, is cheaper than that silence.
  const examples = require("./helper-examples");
  for (const [helper, spec] of Object.entries(examples)) {
    for (const field of Object.keys(spec)) {
      assert.ok(
        !field.includes("_"),
        `"${helper}" uses the field "${field}"; this engine writes fields in camelCase`
      );
    }
  }
});

// ─── the parts that decide whether a sheet is usable ─────────────────────

test("a stated minimum is a real, positive size on paper", () => {
  for (const [name, h] of Object.entries(REGISTRY)) {
    const need = h.needs(exampleFor(name));
    assert.ok(
      Number.isFinite(need.minWidthMm) && need.minWidthMm > 0,
      `"${name}" states a minimum width of ${need.minWidthMm}`
    );
    assert.ok(
      Number.isFinite(need.minHeightMm) && need.minHeightMm > 0,
      `"${name}" states a minimum height of ${need.minHeightMm}`
    );
    // A minimum wider than the page can never be satisfied, so the helper
    // would be refused everywhere and silently unusable.
    assert.ok(
      need.minWidthMm <= 267,
      `"${name}" needs ${need.minWidthMm}mm, wider than any A4 page`
    );
  }
});

test("no helper claims to need more height than it actually draws", () => {
  // A minimum height must be the SHORTEST this content can come out, so that
  // no zone shorter than it could ever hold the helper. State the tallest case
  // instead - by measuring at the narrowest width, where text wraps onto more
  // lines - and the helper is refused from pages it would have sat on happily.
  //
  // method-frame did exactly that: it claimed 66mm while drawing 48mm at full
  // width, and was thrown off its own showcase page, which is a helper Daniel
  // then cannot check on paper. Nothing else in the engine noticed.
  for (const name of helperNames()) {
    const spec = exampleFor(name);
    const { minHeightMm } = REGISTRY[name].needs(spec);
    const drawn = measure(spec, FULL_WIDTH_MM);
    assert.ok(
      minHeightMm <= drawn + 0.5,
      `"${name}" states a minimum height of ${minHeightMm.toFixed(0)}mm but draws ` +
        `${drawn.toFixed(0)}mm at full width, so it refuses zones that would fit it`
    );
  }
});

test("every helper measures to a real height at both a column and full width", () => {
  for (const name of helperNames()) {
    const spec = exampleFor(name);
    for (const widthMm of [A_HALF_COLUMN_MM, FULL_WIDTH_MM]) {
      const h = measure(spec, widthMm);
      assert.ok(
        Number.isFinite(h) && h > 0,
        `"${name}" measures ${h}mm at ${widthMm}mm wide`
      );
      assert.ok(
        h <= 297,
        `"${name}" wants ${Math.round(h)}mm at ${widthMm}mm wide, taller than a page`
      );
    }
  }
});

test("every helper renders to non-empty markup", () => {
  for (const name of helperNames()) {
    const html = renderHelper(exampleFor(name));
    assert.equal(typeof html, "string", `"${name}" did not return markup`);
    assert.ok(html.trim().length > 0, `"${name}" rendered nothing`);
  }
});

test("cause-path-grid renders designer-authored heading counts instead of forcing four", () => {
  for (const headings of [
    ["Cause", "Change", "Effect"],
    ["Cause", "Action", "Change", "Result", "Effect"],
  ]) {
    const html = renderHelper({
      helper: "cause-path-grid",
      instruction: "Choose the path.",
      headings,
      rows: [
        {
          prompt: "Start here.",
          choices: ["Choice A", "Choice B"],
        },
      ],
    });

    assert.equal((html.match(/<th>/g) || []).length, headings.length);
    for (const heading of headings) {
      assert.match(html, new RegExp(`>${heading}<`));
    }
  }

  assert.throws(
    () =>
      renderHelper({
        helper: "cause-path-grid",
        instruction: "Choose the path.",
        headings: ["Only heading"],
        rows: [
          {
            prompt: "Start here.",
            choices: ["Choice A", "Choice B"],
          },
        ],
      }),
    /HELPER_STRUCTURE_INVALID/
  );
});

test("no helper hard-codes a colour: they all come from the token system", () => {
  // A raw hex in a helper is a second colour system starting, which is how a
  // child ends up meeting two meanings for the same colour in one lesson.
  // The shared visual modules carry the deck's own palette and are excluded.
  const drawnElsewhere = new Set(
    Object.keys(REGISTRY).filter((n) => renderHelper(exampleFor(n)).includes("<svg"))
  );
  for (const name of helperNames()) {
    if (drawnElsewhere.has(name)) continue;
    const html = renderHelper(exampleFor(name));
    const hex = html.match(/#[0-9a-fA-F]{3,6}\b/);
    assert.equal(hex, null, `"${name}" hard-codes the colour ${hex && hex[0]}`);
  }
});

test("text reaching the page is escaped, so a stray angle bracket cannot break it", () => {
  const html = renderHelper({
    helper: "questions",
    items: ["What is <b>5</b> & 3?"],
  });
  assert.ok(!html.includes("<b>"), "raw markup survived into the page");
  assert.ok(html.includes("&lt;b&gt;"));
  assert.ok(html.includes("&amp;"));
});

// ─── fitting ─────────────────────────────────────────────────────────────

test("a zone smaller than the minimum is refused, in millimetres", () => {
  const spec = { helper: "recording-table", columns: ["a", "b", "c", "d"], rowLabels: ["x"] };
  const verdict = fits(spec, 90, 200);
  assert.equal(verdict.ok, false);
  assert.match(verdict.why, /needs 120mm wide, zone is 90mm/);
});

test("a minimum grows with the content, so a wider table needs a wider zone", () => {
  // The mistake this guards against: a constant per helper cannot know that a
  // four-column table needs more room than a two-column one, which is how a
  // recording table came to be sliced down its right-hand edge with the fit
  // check reporting no problem.
  const two = { helper: "recording-table", columns: ["a", "b"], rowLabels: ["x"] };
  const four = { helper: "recording-table", columns: ["a", "b", "c", "d"], rowLabels: ["x"] };
  assert.ok(
    REGISTRY["recording-table"].needs(four).minWidthMm >
      REGISTRY["recording-table"].needs(two).minWidthMm
  );
});

test("a zone that meets the minimum is accepted", () => {
  const spec = { helper: "questions", items: ["How many?"] };
  assert.equal(fits(spec, 120, 60).ok, true);
});

test("a suppressed question list drops its duplicate numbers from the markup", () => {
  // A one-item helper nested inside an outer numbered question used to print
  // the outer number twice: once for the question, once for the helper's own
  // set. showNumbers:false is how the engine tells it the number is taken.
  const numbered = renderHelper({ helper: "questions", items: ["What is 4 x 7?"] }, 87);
  assert.ok(numbered.includes('<span class="h-num">(1)</span>'), "a standalone set keeps its number");

  const suppressed = renderHelper(
    { helper: "questions", showNumbers: false, items: ["What is 4 x 7?"] },
    87
  );
  assert.ok(!suppressed.includes('class="h-num"'), "the duplicate number must not print");
  assert.ok(suppressed.includes("What is 4 x 7?"), "the question text itself still prints");

  const answers = renderHelper(
    { helper: "written-answers", showNumbers: false, items: [{ text: "How do you know?", lines: 2 }] },
    87
  );
  assert.ok(!answers.includes('class="h-num"'), "a suppressed written-answers item drops its number too");
});

test("suppress the numbers and the 5mm / 6mm number gutter comes out of measurement too", () => {
  // The layout estimate must measure the helper it is about to print: numbers
  // gone means the gutter that held them is gone, so both printing and
  // measuring drop it together.
  const questions = {
    helper: "questions",
    items: Array(8).fill("w".repeat(60) + ". Explain why this works."),
  };
  const withNumbers = measure(questions, 87);
  const withoutNumbers = measure({ ...questions, showNumbers: false }, 87);
  assert.ok(
    withoutNumbers < withNumbers,
    `suppression freed the questions gutter: ${withoutNumbers} should be less than ${withNumbers}`
  );

  const written = {
    helper: "written-answers",
    items: [
      { text: "w".repeat(60) + ". Explain why this works.", lines: 8 },
      { text: "w".repeat(120) + ".", lines: 8 },
    ],
  };
  assert.ok(
    measure({ ...written, showNumbers: false }, 87) < measure(written, 87),
    "the written-answers gutter is freed the same way"
  );
});

test("greed defaults rather than throwing for something unregistered", () => {
  assert.equal(greed("not-a-real-helper"), 1);
});

// A realistic example per helper, so the contract is checked against content a
// lesson would actually carry rather than an empty object. A helper added
// without an example here fails loudly, which is deliberate: an untested
// helper should not slip in quietly.
function exampleFor(name) {
  const examples = require("./helper-examples");
  const spec = examples[name];
  if (!spec) {
    throw new Error(
      `No example content for helper "${name}". Add one to test/helper-examples.js ` +
        `so the contract tests can check it.`
    );
  }
  return { helper: name, ...spec };
}

test("every helper says what it is for", () => {
  // The engine never needs this; the worksheet-designer does. It chooses
  // between sixty-four things with nothing to go on but their names, and a
  // name does not tell a recording table from a data table.
  //
  // Same rule as the examples above: a helper with no line fails by name. An
  // undocumented helper is one the designer will never reach for, which is the
  // same as not having built it.
  const purposes = require("../src/helpers/purposes");
  const missing = helperNames().filter((name) => !purposes[name]);
  assert.deepEqual(
    missing,
    [],
    `these helpers say nothing about what they are for: ${missing.join(", ")}. ` +
      `Add a line to src/helpers/purposes.js.`
  );

  const orphans = Object.keys(purposes).filter((name) => !helperNames().includes(name));
  assert.deepEqual(orphans, [], `these purposes name no helper: ${orphans.join(", ")}`);
});

test("a purpose is one sentence a chooser can read, not a paragraph", () => {
  // The designer reads sixty-four of these in one go while deciding. A
  // paragraph each is four pages of prose before it has chosen anything, and
  // the detail it would carry belongs in the example, which cannot go stale.
  const purposes = require("../src/helpers/purposes");
  const tooLong = Object.entries(purposes)
    .filter(([, text]) => text.length > 220)
    .map(([name]) => name);
  assert.deepEqual(tooLong, [], `these purposes are too long to scan: ${tooLong.join(", ")}`);

  const unhelpful = Object.entries(purposes)
    .filter(([, text]) => text.length < 25 || !/[.!]$/.test(text))
    .map(([name]) => name);
  assert.deepEqual(
    unhelpful,
    [],
    `these purposes are too short or do not end in a full stop: ${unhelpful.join(", ")}`
  );
});

test("every helper has a place in the catalogue the designer reads", () => {
  // The generated catalogue groups helpers into families so the designer reads
  // them in the order it would think of them. A helper left out of every family
  // is documented nowhere, which is the failure the generated catalogue exists
  // to end - and it would otherwise only surface when someone happened to
  // regenerate the file.
  const { FAMILIES } = require("../scripts/build-catalogue");
  const placed = FAMILIES.flatMap(([, list]) => list);

  const homeless = helperNames().filter((n) => !placed.includes(n));
  assert.deepEqual(
    homeless,
    [],
    `these helpers are in no catalogue family: ${homeless.join(", ")}. ` +
      `Add each to FAMILIES in scripts/build-catalogue.js.`
  );

  const ghosts = placed.filter((n) => !helperNames().includes(n));
  assert.deepEqual(ghosts, [], `these catalogue entries name no helper: ${ghosts.join(", ")}`);

  const duplicated = placed.filter((n, i) => placed.indexOf(n) !== i);
  assert.deepEqual(duplicated, [], `these helpers appear in two families: ${duplicated.join(", ")}`);
});

test("a set of questions can carry the instruction above it", () => {
  // The commonest shape on a maths sheet is an instruction over a column of
  // questions: "Add these fractions." Sixteen helpers carried a stem and these
  // two did not, so that instruction had nowhere to go and the designer would
  // have had to fold it into the first question.
  for (const name of ["questions", "written-answers"]) {
    const helper = REGISTRY[name];
    // The example now carries a `text` of its own, so it is stripped to get
    // the no-instruction case.
    const { text, ...base } = { helper: name, ...require("./helper-examples")[name] };
    const withStem = { ...base, text: "Add these fractions." };

    assert.match(
      helper.render(withStem),
      /h-q-stem/,
      `${name} did not draw the instruction it was given`
    );
    assert.ok(
      !helper.render(base).includes("h-q-stem"),
      `${name} drew an instruction line when it was given none`
    );

    // The measurement has to move with it, or the last question is drawn
    // outside the zone and clipped without a word.
    const grew = helper.measure(withStem, 120) - helper.measure(base, 120);
    assert.ok(grew > 0, `${name} measured no taller with an instruction on it`);
  }
});

test("the subject guides only name helpers that exist", () => {
  // These three are the hand-written half of the designer's reading, and the
  // half a generator cannot check. A guide that recommends `clock-face-question`
  // sends the designer to a helper the engine has never had: the build fails
  // with UNKNOWN_HELPER, and the failure looks like the designer's fault.
  //
  // That is not hypothetical. The files these replaced named `-question` and
  // `-row` helpers throughout, which was the Word builder's naming and had
  // already been dropped here.
  const fs = require("node:fs");
  const path = require("node:path");

  const dir = path.join(__dirname, "..", "..", "references", "worksheet-helpers");
  const names = helperNames();

  // Words in backticks that are not helper names: spec fields, layout words,
  // and files the guides point at. Named rather than pattern-matched, so a real
  // mistake cannot hide behind a loose rule.
  const NOT_HELPERS = new Set([
    "stack", "row", "repeat", "text", "notes", "items", "lines", "zones",
    "layout", "orientation", "meta", "sheets", "below", "expected",
    "greaterDepth", "helper", "diagram-anchor", "lesson-design", "adaptation",
    "catalogue", "shared", "maths", "science", "hint",
  ]);

  for (const file of ["shared.md", "maths.md", "science.md"]) {
    const text = fs.readFileSync(path.join(dir, file), "utf8");
    const quoted = [...text.matchAll(/`([a-z][a-z0-9-]{3,})`/g)].map((m) => m[1]);
    const strayed = [...new Set(quoted)].filter(
      (word) => !names.includes(word) && !NOT_HELPERS.has(word)
    );
    assert.deepEqual(
      strayed,
      [],
      `${file} names things that are not helpers: ${strayed.join(", ")}`
    );
  }
});

test("a fact file can be scaffolded without a colour of its own", () => {
  // The below sheet's whole reason for using this helper. The principle it
  // serves is to remove the BARRIER while leaving the child their own subject:
  // a starter is a frame they finish about their own choice, not a topic handed
  // to them.
  const helper = REGISTRY["fact-file"];
  const plain = { helper: "fact-file", fields: ["Capital city"] };
  const scaffolded = {
    helper: "fact-file",
    fields: [{ name: "Capital city", hint: "The capital is ...", wordBank: ["Madrid"] }],
  };

  assert.ok(!/h-ff-hint|h-ff-bank/.test(helper.render(plain)), "plain drew scaffolding");
  assert.match(helper.render(scaffolded), /h-ff-hint/);
  assert.match(helper.render(scaffolded), /h-ff-bank/);

  // The height has to follow, or the scaffolding pushes the writing space off
  // the bottom of a form that still looks finished.
  assert.ok(
    helper.measure(scaffolded, 120) > helper.measure(plain, 120),
    "a scaffolded field measured no taller than a bare one"
  );

  // The design system has no scaffold colour on purpose, and states why: a
  // starter is set apart by weight and its own line, which keeps the sheet to
  // four colour meanings rather than five.
  const { COLOUR } = require("../src/tokens");
  assert.equal(COLOUR.scaffold, undefined);
  const { helperCss } = require("../src/helpers");
  const hintRule = /\.h-ff-hint\s*\{[^}]*\}/.exec(helperCss)[0];
  assert.match(hintRule, /--colour-ink/, "the starter should be ordinary ink");
  assert.match(hintRule, /bold/, "the starter should be set apart by weight");
});

test("a section label marks the mode of work and is its own block", () => {
  // It belongs to a BLOCK rather than to an activity, and a block is often
  // several helpers stacked, which is why it is a helper and not a field on
  // every other helper.
  const helper = REGISTRY["section-label"];
  assert.match(helper.render({ text: "Fluency" }), /h-section-label/);

  // Never grows. Spare height between a block's name and the block reads as
  // two things rather than one.
  assert.equal(helper.greed, 0);

  // Wide enough not to wrap: a heading that wraps stops reading as a heading.
  const long = helper.needs({ text: "Problem Solving" });
  const short = helper.needs({ text: "Apply" });
  assert.ok(long.minWidthMm > short.minWidthMm);
});

test("every helper draws the words its own example gives it", () => {
  // The catalogue prints each helper's example and tells the designer "the
  // example is the contract". label-diagram broke that promise in silence: its
  // example carried an instruction line, the renderer built only the picture,
  // and a designer following the documentation exactly shipped a photograph
  // with blank lines and nothing saying what to write.
  //
  // So every readable string in an example has to reach the page. This is the
  // one check that makes the catalogue's promise true rather than hopeful.
  const examples = require("./helper-examples");
  const failures = [];

  // Strings that are NOT meant to be read off the page, named rather than
  // pattern-matched so a real omission cannot hide behind a loose rule.
  // A switch whose VALUE picks a variant of the drawing ("parallel", "vertical",
  // "rectangle") rather than being words a child reads. These are exempt
  // because nothing is meant to print them, and they are listed by name so an
  // omission cannot hide behind a loose rule.
  const NOT_PRINTED = new Set([
    "helper", "imagePath", "imageHref", "shape", "state", "phase", "unit",
    "variant", "kind", "orientation", "separator", "operator", "dot", "mode",
    "relationship", "highlight", "mirror", "labels", "type",
  ]);

  for (const [name, example] of Object.entries(examples)) {
    const html = REGISTRY[name].render({ helper: name, ...example });
    for (const [field, value] of Object.entries(example)) {
      if (NOT_PRINTED.has(field)) continue;
      if (typeof value !== "string" || value.length < 4) continue;
      // Compared on the words alone: the renderer escapes, wraps and may split
      // a string across elements.
      const words = value.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3);
      if (!words.length) continue;
      if (!words.some((w) => html.includes(w))) {
        failures.push(`${name}.${field} ("${value.slice(0, 40)}") never reaches the page`);
      }
    }
  }

  assert.deepEqual(failures, [], failures.join("\n"));
});

test("no helper states a minimum height it cannot reach", () => {
  // `fits` compares the content's natural height, at the width its zone gives
  // it, against the minimum the helper states. For text that is right: text
  // wraps, so a narrow zone makes it taller. For anything scaled by its width
  // it is backwards - a picture gets TALLER as it gets WIDER - so a minimum
  // measured at the widest zone is the tallest the content could be, and the
  // helper gets refused for being shorter than its own worst case.
  //
  // Six helpers did this. A row of three photographs claimed 59mm and needed
  // 33mm at half-page width, so it was refused from every zone but one. That
  // cost a real below sheet two questions and its only reasoning question.
  const examples = require("./helper-examples");
  const impossible = [];

  for (const name of helperNames()) {
    const helper = REGISTRY[name];
    const spec = { helper: name, ...examples[name] };
    const need = helper.needs(spec);
    if (!need.minHeightMm) continue;

    // At the narrowest zone this helper allows itself, it must not already be
    // shorter than the minimum it just asked for.
    const natural = helper.measure(spec, Math.max(20, need.minWidthMm));
    if (natural < need.minHeightMm - 0.5) {
      impossible.push(
        `${name}: ${natural.toFixed(0)}mm tall at its own minimum width, ` +
          `but asks for ${need.minHeightMm.toFixed(0)}mm`
      );
    }
  }

  assert.deepEqual(impossible, [], impossible.join("\n"));
});

test("a helper's example shows every field the helper reads", () => {
  // The catalogue is generated from these examples and tells the designer "the
  // example is the contract". A field the code reads and the example never
  // shows is therefore a field the designer cannot know exists, which is how a
  // real run shipped Year 1 line spacing on a Year 4 sheet and restarted its
  // question numbering half way down a page.
  //
  // Deliberate omissions are named here with their reason, so leaving one out
  // is a decision on the record rather than an oversight.
  const DELIBERATELY_HIDDEN = {
    // Filled in from meta.yearGroup by the worksheet layer. Showing it would
    // invite a designer to set it, and they should not have to know it exists.
    //
    // `startAt` is the numbering walk's own plumbing: a designer marks
    // `question: true` and the worksheet layer writes startAt itself, counting
    // in reading order and across zones. Showing it invites the hand-numbered
    // sheet the walk was built to end - the catalogue's examples carry
    // `question: true` instead, which is the field a designer actually writes.
    //
    // `showNumbers` is the other half of that same plumbing: the numbering walk
    // writes it to suppress the duplicate inner number when a lone questions or
    // written-answers item sits inside an outer numbered question. A designer
    // never sets it - the worksheet-designer rule is that the engine owns the
    // duplicate number, and showing the field here would invite them to.
    questions: ["startAt", "showNumbers"],
    "written-answers": ["phase", "startAt", "showNumbers"],
    "circle-the-answer": ["phase"],
    "fact-file": ["phase"],
    // Turns the panel border off. The framed form is the one to reach for, and
    // the example shows that; the bare form is an inner detail of composing.
    "method-frame": ["frame"],
  };

  const examples = require("./helper-examples");
  const hidden = [];

  for (const name of helperNames()) {
    const helper = REGISTRY[name];
    const source = [helper.render, helper.measure, helper.needs]
      .map((f) => f.toString())
      .join("\n");
    const read = [
      ...new Set([...source.matchAll(/spec\.([a-zA-Z][a-zA-Z0-9]*)/g)].map((m) => m[1])),
    ];
    const shown = Object.keys(examples[name] || {});
    const allowed = DELIBERATELY_HIDDEN[name] || [];

    for (const field of read) {
      if (field === "helper" || shown.includes(field) || allowed.includes(field)) continue;
      hidden.push(`${name}.${field} is read by the code and shown nowhere`);
    }
  }

  assert.deepEqual(hidden, [], hidden.join("\n"));
});

test("a helper only claims spare height if it can actually use it", () => {
  // Greed says "give me the spare height and I will do something with it". A
  // drawing scaled by its WIDTH cannot: the CSS gives it `width: 100%` and its
  // height follows its own aspect, so extra height grows the BOX and leaves the
  // drawing at the top of it.
  //
  // fromShared defaulted to greed 2, so nearly every drawing on the page was
  // claiming height it had no way to use. On a real sheet that opened a gap
  // between a photograph and the question about it: the child read the question,
  // looked up, and the picture had moved away. Spare height belongs to writing
  // space, or at the foot where a teacher trims it.
  const examples = require("./helper-examples");
  const liars = [];

  for (const name of helperNames()) {
    const helper = REGISTRY[name];
    if (!helper.greed) continue;

    const spec = { helper: name, ...examples[name] };
    let narrow, wide;
    try {
      narrow = helper.measure(spec, 100);
      wide = helper.measure(spec, 200);
    } catch {
      continue;
    }

    // Height rising roughly in step with width is the signature of something
    // scaled by its width. Text does the opposite: it gets SHORTER as it widens.
    if (narrow > 0 && wide / narrow > 1.6) {
      liars.push(`${name} (greed ${helper.greed}) is sized by its width`);
    }
  }

  assert.deepEqual(liars, [], liars.join("\n"));
});

test("a question number looks the same wherever it appears", () => {
  // Daniel's rule: bold, black, in brackets. It was none of those consistently.
  // Three helpers printed their own number in question blue, one with a full
  // stop after it and one bare; the other sixty-two had "(1)" typed into their
  // text by hand in ordinary body text. A single sheet showed three of those at
  // once, which reads as three sheets stapled together.
  //
  // A number is now the engine's to draw, from `number` on a zone's content, so
  // a helper does not decide this at all. These are the ones that still print
  // their own, and they have to match.
  const { helperCss } = require("../src/helpers");
  const NUMBER_CLASSES = [
    "h-numbered-n", // the engine's own, on any question
    "h-num", // inside a set of questions
    "h-cq-num", // comparing helpers
    "h-mframe-id", // a method frame
    "h-sb-num", // a storyboard cell
  ];

  for (const cls of NUMBER_CLASSES) {
    const rule = new RegExp(String.raw`\.${cls}\s*\{[^}]*\}`).exec(helperCss);
    assert.ok(rule, `${cls} has no styling at all`);
    assert.match(rule[0], /--colour-ink/, `${cls} is not drawn in ink`);
    assert.match(rule[0], /bold/, `${cls} is not bold`);
    assert.ok(
      !/--colour-question/.test(rule[0]),
      `${cls} is still drawn in question blue`
    );
  }
});

test("a word-bank entry can carry a real picture, and the bank grows to hold it", () => {
  // The below child sorting real things wants each thing SHOWN: an emoji is a
  // picture only when it happens to be the thing, and a fridge has no emoji.
  // A bank entry may therefore be { word, imagePath }, resolved to an embedded
  // imageHref like every other picture in the engine.
  const { REGISTRY } = require("../src/helpers");
  const grid = REGISTRY["sort-grid"];
  const png =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  const textOnly = {
    columns: ["Uses electricity", "Not electrical"],
    rows: 3,
    wordBank: ["torch", "broom", "laptop", "scissors"],
  };
  const withPictures = {
    columns: ["Uses electricity", "Not electrical"],
    rows: 3,
    wordBank: [
      { word: "torch", imageHref: png },
      { word: "broom", imageHref: png },
      { word: "laptop", imageHref: png },
      { word: "scissors", imageHref: png },
    ],
  };

  const html = grid.render(withPictures);
  const thumbs = (html.match(/h-sortgrid-thumb/g) || []).length;
  assert.equal(thumbs, 4, "every pictured entry draws its thumbnail");

  // Mixed banks stay legal: a word with no true picture goes bare.
  const mixed = grid.render({
    ...withPictures,
    wordBank: [{ word: "torch", imageHref: png }, "hairdryer"],
  });
  assert.equal((mixed.match(/h-sortgrid-thumb/g) || []).length, 1);
  assert.match(mixed, /hairdryer/);

  // The estimate must price the taller, sooner-wrapping picture rows, because
  // an estimate that stays at the text height clips the bank silently.
  const w = 174;
  assert.ok(
    grid.measure(withPictures, w) > grid.measure(textOnly, w) + 5,
    "picture bank measures taller than the same bank as text"
  );
});
