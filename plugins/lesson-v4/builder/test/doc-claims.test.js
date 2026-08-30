"use strict";

// SLIDE DOCUMENT CLAIMS, PINNED.
//
// references/templates.md is the slide-designer's whole picture of the
// engine, and the truth sweep of 1 August 2026 found its numbers drifting:
// header heights a version behind, a zone-compatibility table missing the
// ticks the code carries, a vocabulary column quoted at 28% when the code
// fixes it at 2.2 inches. These tests hold the re-measured claims to the
// engine, so the next drift fails here and templates.md gets re-measured
// rather than trusted. Run with `node --test` in builder/.
//
// The documents quoting these numbers:
//   references/templates.md            header heights (§1.4), the §5 zone
//                                      table, key-vocabulary's visual column,
//                                      centre-big-v's ratios, the rainforest
//                                      layer heights
//   references/slide-visual-sizing.md  the criteria column's usable size,
//                                      the picture reading floor

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const layout = require("../src/layout.js");
const { ZONE_COMPAT } = require("../src/content/index.js");
const { PICTURE_READABLE_FLOOR } = require("../src/content/image.js");
const { HEIGHT_TEXT } = require("../../shared/visuals/rainforest-layers-svg.js");

const TEMPLATES_MD = fs.readFileSync(
  path.join(__dirname, "..", "..", "references", "templates.md"),
  "utf8"
);
const SLIDE_DESIGNER_MD = fs.readFileSync(
  path.join(__dirname, "..", "..", "agents", "slide-designer.md"),
  "utf8"
);
const LESSON_DESIGNER_MD = fs.readFileSync(
  path.join(__dirname, "..", "..", "agents", "lesson-designer.md"),
  "utf8"
);
const DESIGN_REVIEWER_MD = fs.readFileSync(
  path.join(__dirname, "..", "..", "agents", "design-reviewer.md"),
  "utf8"
);
const VISUAL_REVIEWER_MD = fs.readFileSync(
  path.join(__dirname, "..", "..", "agents", "visual-reviewer.md"),
  "utf8"
);
const SLIDE_VISUAL_SIZING_MD = fs.readFileSync(
  path.join(__dirname, "..", "..", "references", "slide-visual-sizing.md"),
  "utf8"
);
const PREFERENCES_MD = fs.readFileSync(
  path.join(__dirname, "..", "..", "references", "preferences.md"),
  "utf8"
);
const OUTPUT_TEMPLATE_MD = fs.readFileSync(
  path.join(__dirname, "..", "..", "references", "output-template.md"),
  "utf8"
);
const CONTENT_SEQUENCE_MD = fs.readFileSync(
  path.join(
    __dirname,
    "..",
    "..",
    "references",
    "teaching-sequence-content-based.md"
  ),
  "utf8"
);
const MAKE_LESSON_MD = fs.readFileSync(
  path.join(__dirname, "..", "..", "skills", "make-lesson", "SKILL.md"),
  "utf8"
);
const MAKE_LESSON_PLAYBOOK_MD = fs.readFileSync(
  path.join(__dirname, "..", "..", "skills", "make-lesson", "playbook-lite.md"),
  "utf8"
);
const MAKE_LESSON_PLAYBOOK_FLAT = MAKE_LESSON_PLAYBOOK_MD.replace(/\s+/g, " ");
const SLIDE_FOCUSED_REPAIR_MD = fs.readFileSync(
  path.join(
    __dirname,
    "..",
    "..",
    "agents",
    "slide-designer-focused-repair.md"
  ),
  "utf8"
);
const CHECK_LESSON_JS = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "check-lesson.js"),
  "utf8"
);
const VALIDATE_JS = fs.readFileSync(
  path.join(__dirname, "..", "src", "validate.js"),
  "utf8"
);
const TEACHER_PROFILE_MD = fs.readFileSync(
  path.join(__dirname, "..", "..", "references", "teacher-slide-visual-profile.md"),
  "utf8"
);
const CONTEXT_PICTURES_MD = fs.readFileSync(
  path.join(
    __dirname,
    "..",
    "..",
    "references",
    "context-pictures.md"
  ),
  "utf8"
);
const SLIDE_SUCCESS_CRITERIA_MD = fs.readFileSync(
  path.join(__dirname, "..", "..", "references", "slide-success-criteria.md"),
  "utf8"
);
const PLAYBOOK_MD = fs.readFileSync(
  path.join(__dirname, "..", "..", "references", "slide-composition-playbook.md"),
  "utf8"
);
const VISUAL_REVIEW_DECK_MD = fs.readFileSync(
  path.join(__dirname, "..", "..", "references", "visual-review-deck.md"),
  "utf8"
);
const CHECK_SLIDE_DESIGN_JS = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "check-slide-design.js"),
  "utf8"
);
const VALIDATE_LESSON_DESIGN_PY = fs.readFileSync(
  path.join(__dirname, "..", "..", "scripts", "validate-lesson-design.py"),
  "utf8"
);

function markdownSection(text, start, end) {
  const startAt = text.indexOf(start);
  const endAt = text.indexOf(end, startAt);
  assert.notEqual(startAt, -1, `missing section start: ${start}`);
  assert.notEqual(endAt, -1, `missing section end: ${end}`);
  return text.slice(startAt, endAt);
}

test("the header heights templates.md quotes match the layout", () => {
  assert.equal(layout.HEADER_TITLE_H, 0.6, "title header height moved - templates.md §1.4 quotes ~0.6 inches");
  assert.equal(layout.HEADER_STARTER_H, 2.27, "starter header height moved - templates.md §1.4 quotes ~2.3 inches");
  assert.ok(TEMPLATES_MD.includes('~0.6"'), "templates.md §1.4 no longer quotes ~0.6 inches for the title header");
  assert.ok(TEMPLATES_MD.includes('~2.3"'), "templates.md §1.4 no longer quotes ~2.3 inches for the starter header");
});

test("the §5 zone table matches ZONE_COMPAT row for row", () => {
  const section = TEMPLATES_MD.split("## 5.")[1];
  assert.ok(section, "templates.md no longer has a §5 this guard can read");
  const header = section.match(/\| Content type \|([^\n]*)\|/);
  assert.ok(header, "the §5 table header is gone");
  const classes = header[1].split("|").map((s) => s.trim()).filter(Boolean);
  const rows = [...section.matchAll(/^\| `([\w-]+)`\s*\|(.*)\|$/gm)];
  assert.ok(rows.length >= 40, `only ${rows.length} rows parsed from the §5 table`);
  const seen = new Set();
  for (const row of rows) {
    const name = row[1];
    seen.add(name);
    const ticks = row[2].split("|").map((s) => s.trim());
    const documented = classes.filter((c, i) => ticks[i] === "✓");
    const actual = ZONE_COMPAT[name];
    assert.ok(actual, `the §5 table lists "${name}" but the engine has no such content type`);
    assert.deepEqual(
      documented.sort(),
      [...actual].sort(),
      `templates.md §5 and the code disagree about "${name}"`
    );
  }
  // Every registered type is either in the §5 table or carries its own
  // zone-class line in §4 (containers say "depends on its items" there).
  for (const name of Object.keys(ZONE_COMPAT)) {
    if (seen.has(name)) continue;
    const entry = TEMPLATES_MD.split("### `" + name + "`")[1];
    assert.ok(
      entry && /[Zz]one class/.test(entry.split("\n### ")[0]),
      `"${name}" is in neither the §5 table nor a §4 zone-class line - a designer cannot learn where it fits`
    );
  }
});

test("the vocabulary card's visual column is the fixed width templates.md quotes", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "key-vocabulary.js"), "utf8");
  const m = src.match(/const VISUAL_W\s*=\s*([\d.]+)/);
  assert.ok(m, "key-vocabulary.js no longer has a VISUAL_W constant this guard can read");
  assert.equal(Number(m[1]), 2.2, "the vocab visual column moved - templates.md and slide-designer.md quote 2.2 inches");
});

test("centre-big-v is the 22/50/25 split templates.md quotes", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "centre-big-v.js"), "utf8");
  const top = Number(src.match(/const TOP_RATIO\s*=\s*([\d.]+)/)[1]);
  const bottom = Number(src.match(/const BOTTOM_RATIO\s*=\s*([\d.]+)/)[1]);
  assert.equal(top, 0.22, "centre-big-v's top ratio moved - templates.md §3.2 quotes 22");
  assert.equal(bottom, 0.25, "centre-big-v's bottom ratio moved - templates.md §3.2 quotes 25");
});

test("the rainforest layer heights templates.md quotes match the drawing", () => {
  assert.deepEqual(
    HEIGHT_TEXT,
    {
      emergent: "about 60 m",
      canopy: "30 to 45 m",
      understorey: "5 to 30 m",
      "forest-floor": "ground level",
    },
    "the rainforest height labels moved - templates.md §4 quotes them verbatim"
  );
  assert.ok(
    TEMPLATES_MD.includes("about 60 m, 30 to 45 m, 5 to 30 m, ground level"),
    "templates.md no longer quotes the four heights the drawing prints"
  );
});

test("slide-designer points only at live slide guidance files", () => {
  assert.equal(
    SLIDE_DESIGNER_MD.includes("slide-" + "templates.md"),
    false,
    "slide-designer.md still names the removed template guidance file"
  );
  assert.equal(
    SLIDE_DESIGNER_MD.includes("slide-visual-" + "language.md"),
    false,
    "slide-designer.md still names the nonexistent visual-language guidance file"
  );

  for (const filename of [
    "templates.md",
    "slide-visual-sizing.md",
    "preferences.md",
    "teacher-slide-visual-profile.md",
  ]) {
    assert.equal(
      fs.existsSync(
        path.join(__dirname, "..", "..", "references", filename)
      ),
      true,
      `slide-designer.md depends on missing references/${filename}`
    );
  }

  assert.ok(
    SLIDE_DESIGNER_MD.includes(
      "[PLUGIN_ROOT]/references/templates.md"
    ),
    "slide-designer.md does not name the live template catalogue"
  );
  assert.ok(
    SLIDE_DESIGNER_MD.includes(
      "[PLUGIN_ROOT]/references/slide-visual-sizing.md"
    ),
    "slide-designer.md does not name the live visual-sizing guidance"
  );
  assert.ok(
    SLIDE_DESIGNER_MD.includes(
      "[PLUGIN_ROOT]/references/teacher-slide-visual-profile.md"
    ),
    "slide-designer.md does not read the teacher's stable visual-judgement profile"
  );
});

test("question labels are limited to starter, main independent work, and Maths Our Turn", () => {
  assert.ok(
    PREFERENCES_MD.includes(
      "The starter and main independent sequence are separate: each starts at (1)."
    ),
    "preferences.md does not separate starter numbering from main independent numbering"
  );
  assert.ok(
    PREFERENCES_MD.includes(
      "Do not number smaller questions or tasks between teaching steps"
    ),
    "preferences.md does not keep smaller lesson tasks unnumbered"
  );
  assert.ok(
    SLIDE_DESIGNER_MD.includes(
      "Do not use `numbered-questions`, `question-cards` or `questionNumbering` for a Do beat"
    ),
    "slide-designer.md can still number a Do beat"
  );
  assert.ok(
    TEMPLATES_MD.includes(
      "Use only on starter and main independent work slides"
    ),
    "templates.md still presents numbered-questions as a general quick-check helper"
  );
});

test('question cards and numbered questions share one stage boundary', () => {
  const entry = markdownSection(
    TEMPLATES_MD,
    '### `question-cards`',
    'Zone class compatibility'
  );
  assert.match(entry, /restricted to a starter or the lesson's main independent work/);
  assert.match(entry, /A Do beat, quick check, discussion question, My Turn or other smaller task uses an unnumbered composition/);
});

test("answer slides are limited without removing speaker-note answers", () => {
  assert.ok(
    LESSON_DESIGNER_MD.includes(
      "Exact-answer Do beats, Our Turn, smaller checks use teacher-only."
    ),
    "lesson-designer.md does not keep exact smaller-check answers in notes"
  );
  assert.ok(
    OUTPUT_TEMPLATE_MD.includes(
      "For every answer whose `kind` is not `none`, the slide-designer composes the structured answer into the source unit's question or task slide speaker notes."
    ),
    "output-template.md does not retain every structured answer in slide notes"
  );
  assert.ok(
    CONTENT_SEQUENCE_MD.includes(
      "A Do beat with an exact answer uses `teacher-only`"
    ),
    "the Content-based route can still assign an exact Do answer slide"
  );
  assert.ok(
    DESIGN_REVIEWER_MD.includes(
      "answer-delivery legality"
    ),
    "design-reviewer.md does not state that the deterministic check owns answer delivery"
  );
  assert.ok(
    DESIGN_REVIEWER_MD.includes(
      "answer visibility against intended pupil thinking"
    ),
    "design-reviewer.md does not protect the semantic answer-visibility review"
  );
});

test('semantic colour stays with the teacher profile and exact field contracts', () => {
  assert.match(TEACHER_PROFILE_MD, /Black carries ordinary teacher explanation/);
  assert.match(TEACHER_PROFILE_MD, /Answer green belongs only to answers being revealed or marked/);
  assert.match(TEACHER_PROFILE_MD, /Safety and failure are different semantic roles/);
  assert.match(TEMPLATES_MD, /`colorRole` is one of:/);
  assert.match(
    TEMPLATES_MD,
    /Every `emphasis\[\]\.text` must occur exactly once in the visible source string/
  );
  assert.match(PLAYBOOK_MD, /Prepared examples and visible-in-unit models stay black/);
  assert.match(SLIDE_DESIGNER_MD, /Use `teacher-slide-visual-profile.md` for visual judgement/);
});

test('the asking-versus-telling colour grammar holds across every colour owner', () => {
  // Blue asks, black tells, and a mixed block splits at the boundary. The rule
  // lives in the profile; the playbook, templates contract, reviewer reference
  // and preferences copy must all carry the same grammar or a run reads
  // whichever file it opens first and the decks come out inconsistent.
  assert.match(TEACHER_PROFILE_MD, /asking versus telling/);
  assert.match(TEACHER_PROFILE_MD, /The boundary is the sentence, not the block/);
  assert.match(PLAYBOOK_MD, /asking versus telling/);
  assert.match(VISUAL_REVIEW_DECK_MD, /asking versus telling/);
  assert.match(PREFERENCES_MD, /Black tells, blue asks/);
  assert.ok(
    !TEACHER_PROFILE_MD.includes('do not make routine starter questions or every task question blue'),
    'the retired one-focal-question restriction must not resurface in the profile'
  );
});

test('the composition regressions from the electrical-appliances deck stay fixed', () => {
  // Vocabulary returns to one key-vocabulary slide.
  assert.match(PLAYBOOK_MD, /Vocabulary is presented on one `key-vocabulary` slide/);
  assert.ok(!PLAYBOOK_MD.includes('two established shapes'));
  // Sort task slides: big item bank, hugged destinations.
  assert.match(PLAYBOOK_MD, /the item bank takes the slide's spare height/);
  // Labelled parallel fields render as real headings, not fused text cards.
  assert.match(PLAYBOOK_MD, /headings look like headings/);
  // Short labels can never fill a tall card.
  assert.match(TEACHER_PROFILE_MD, /A two- or three-word label/);
  // The bubble holds only spoken words; the judging question titles the slide.
  const SPEECH_MD = fs.readFileSync(
    path.join(__dirname, '..', '..', 'references', 'slide-speech-and-characters.md'),
    'utf8'
  );
  assert.match(SPEECH_MD, /The bubble holds only the spoken words/);
  assert.match(SPEECH_MD, /It is never printed/);
});

test("template reference matches image fit and grouping helper contracts", () => {
  for (const token of [
    "Cover preserves natural proportions",
    "It never stretches",
    "IMAGE_DIMENSIONS_UNAVAILABLE",
    "### `sort-board`",
    "### `evidence-cards`",
    "### `source-pathway`",
    "**`maxRows` field (optional):**",
    "**Equal text cards.**",
    "**Optional `widthMode`:**",
    "Every chip in one bank shares the largest safe whole-point size",
    "Each body column has its own shared maximum safe size",
  ]) {
    assert.ok(TEMPLATES_MD.includes(token), `templates.md is missing: ${token}`);
  }
  assert.deepEqual(ZONE_COMPAT["sort-board"], ["A", "B", "C", "E-wide"]);
  assert.deepEqual(ZONE_COMPAT["evidence-cards"], ["A", "B", "C", "E-wide"]);
  assert.deepEqual(ZONE_COMPAT["source-pathway"], ["A", "C", "E-wide"]);
});

test("the option bank keeps its labels out of the instruction in the design documents", () => {
  assert.ok(
    LESSON_DESIGNER_MD.includes(
      'Option bank: kind "option-bank" when children choose from'
    ),
    "lesson-designer.md does not structure a discrete option bank"
  );
  assert.ok(
    LESSON_DESIGNER_MD.includes(
      "Keep answer.content route; option bank does not create answer.structure."
    ),
    "lesson-designer.md can still invent an answer structure for an option bank"
  );
  assert.ok(
    OUTPUT_TEMPLATE_MD.includes('"kind": "option-bank"'),
    "output-template.md does not document the option-bank shape"
  );
  assert.ok(
    OUTPUT_TEMPLATE_MD.includes("`items` contains 2 to 12 entries."),
    "output-template.md does not pin the option-bank item count"
  );
});

test("templates.md documents the circuit symbol bank as a live content type", () => {
  assert.ok(
    TEMPLATES_MD.includes("### `circuit-symbol-bank`"),
    "templates.md does not document the circuit symbol bank"
  );
  assert.ok(
    TEMPLATES_MD.includes(
      "`symbol` is exactly one of `cell`, `lamp`, `wire`, `switch-open`, `switch-closed`."
    ),
    "templates.md does not pin the symbol bank's five symbols"
  );
  assert.deepEqual(
    ZONE_COMPAT["circuit-symbol-bank"],
    ["A", "B", "C", "D", "E-wide", "E-narrow", "G"],
    "the symbol bank's zone classes moved"
  );
});

test("teacher profile keeps the main task out of the small header cue", () => {
  assert.ok(
    TEACHER_PROFILE_MD.includes(
      "The small top-right `instruction` in the slide header is a secondary cue"
    )
  );
  assert.ok(
    TEACHER_PROFILE_MD.includes(
      "place that wording in the body composition at task-reading size"
    )
  );
});

test("teacher profile aligns related groups and uses spare space for important content", () => {
  for (const token of [
    "Whole-composition alignment and useful space",
    "vertically centre the shorter group",
    "important paired content remains unnecessarily small",
    "active pupil-working surface normally wins space"
  ]) {
    assert.ok(
      TEACHER_PROFILE_MD.includes(token),
      `teacher visual profile is missing: ${token}`
    );
  }
});

test("teacher profile carries focal-question task-action safety and parallel-group roles", () => {
  for (const token of [
    "`focus-blue`",
    "`task-action`",
    "`safety-warning`",
    "Parallel-group distinction"
  ]) {
    assert.ok(
      TEACHER_PROFILE_MD.includes(token),
      `teacher visual profile is missing: ${token}`
    );
  }
});

test('the teacher profile owns main-task prominence and the core keeps its execution cue', () => {
  assert.match(TEACHER_PROFILE_MD, /principal pupil task is in the body at task-reading size/);
  assert.match(SLIDE_DESIGNER_MD, /main pupil task or teaching object is the strongest body-level element/);
  assert.match(SLIDE_DESIGNER_MD, /Do not hide it in header furniture/);
});

test('the teacher profile owns visible task phases and the core keeps its execution cue', () => {
  assert.match(TEACHER_PROFILE_MD, /real task phases are visibly separated/);
  assert.match(TEACHER_PROFILE_MD, /physically attached to those objects/);
  assert.match(SLIDE_DESIGNER_MD, /Make task phases visible/);
});

test('stack alignment stays owned by the profile and template contract', () => {
  assert.match(TEACHER_PROFILE_MD, /vertically centre the shorter group against the taller peer/);
  assert.match(TEMPLATES_MD, /verticalAlign.*center/s);
});

test('context pictures own the optional pass and the core keeps the execution and report cues', () => {
  assert.match(
    CONTEXT_PICTURES_MD,
    /After the core slide geometry is settled, run the one whole-deck opportunity pass/
  );
  assert.match(SLIDE_DESIGNER_MD, /strict order P1 > P2 > P3/);
  assert.match(SLIDE_DESIGNER_MD, /Optional visual pass:/);
  assert.match(SLIDE_DESIGNER_MD, /Optional visual zero reason:/);

  // "P1 already carries the meaning" used to be the first of four answers, which
  // turned a photograph into a full stop: a deck came back with seventeen slides
  // and no drawing on any of them, explained as most slides already having
  // strong P1 visuals. A photograph settles what a picture may displace, never
  // whether the slide has room to spare.
  assert.doesNotMatch(SLIDE_DESIGNER_MD, /P1 already carries the meaning/);
  assert.match(
    SLIDE_DESIGNER_MD,
    /A photograph on this slide does not answer question 1/
  );
  assert.match(SLIDE_DESIGNER_MD, /There is no deck budget/);

  // The pass leaves a record, which is what makes slide-by-slide a thing that
  // happened rather than a thing that was claimed.
  assert.match(SLIDE_DESIGNER_MD, /optional-picture-pass\.json/);
  assert.match(SLIDE_DESIGNER_MD, /OPTIONAL_PICTURE_PASS_OK/);
  assert.match(
    CONTEXT_PICTURES_MD,
    /The pass writes a record, one line per slide/
  );
  assert.match(
    CONTEXT_PICTURES_MD,
    /There is no code for a deck-level answer/
  );
});

test("context pictures require an explicit slide opportunity pass without creating a visual quota", () => {
  assert.ok(
    CONTEXT_PICTURES_MD.includes(
      "run one explicit opportunity pass"
    )
  );
  assert.ok(
    CONTEXT_PICTURES_MD.includes(
      "Zero is valid only when the explicit opportunity pass found no suitable use"
    )
  );
  assert.ok(
    CONTEXT_PICTURES_MD.includes(
      "Never use an unrelated drawing to reach a number."
    )
  );
  // The deck target used to be one or two pictures across a whole deck, which
  // is a quota by another name and left almost every slide bare.
  assert.ok(
    CONTEXT_PICTURES_MD.includes(
      "Decide slide by slide rather than against a whole-deck quota"
    )
  );
  assert.ok(
    !CONTEXT_PICTURES_MD.includes("One or two meaningful uses remains the normal target")
  );
});

test("deck visual review checks main-task prominence alignment active work surfaces and group distinction", () => {
  for (const token of [
    "Main task prominence.",
    "Whole-composition alignment.",
    "Active work surface dominance.",
    "Parallel-group distinction."
  ]) {
    assert.ok(
      VISUAL_REVIEW_DECK_MD.includes(token),
      `visual-review-deck.md is missing: ${token}`
    );
  }
});

test("template catalogue makes header instruction secondary", () => {
  assert.ok(
    TEMPLATES_MD.includes(
      "Header `instruction` is a secondary cue"
    )
  );
  assert.ok(
    TEMPLATES_MD.includes(
      "A main source-authored task belongs in the body at task-reading size."
    )
  );
});

test("template catalogue documents stack alignment and group accents", () => {
  for (const token of [
    "`heightRatio`",
    "`verticalAlign`",
    "`groupAccent`",
    "blue`, `orange` or `purple"
  ]) {
    assert.ok(
      TEMPLATES_MD.includes(token),
      `templates.md is missing: ${token}`
    );
  }
});

test("template catalogue documents fill-height text and 28pt narrow text", () => {
  assert.ok(
    TEMPLATES_MD.includes(
      '`heightMode` is optional'
    )
  );
  assert.ok(
    TEMPLATES_MD.includes(
      'use `"fill"`'
    )
  );
  assert.ok(
    TEMPLATES_MD.includes(
      "28pt ceiling"
    )
  );
});

test("template catalogue documents focus task-action and safety roles", () => {
  for (const token of [
    "`focus-blue`",
    "`task-action`",
    "`safety-warning`"
  ]) {
    assert.ok(
      TEMPLATES_MD.includes(token),
      `templates.md is missing: ${token}`
    );
  }
});

test("the questionNumbering slot keeps its fixed roles in templates.md", () => {
  assert.ok(
    TEMPLATES_MD.includes(
      'Use `"teacher-led"` only for a Maths Our Turn containing two or more discrete questions; it renders `(a)`, `(b)`, `(c)` and restarts on that turn.'
    ),
    "templates.md no longer pins the teacher-led numbering boundary"
  );
  assert.ok(
    TEMPLATES_MD.includes(
      'omit or use `"none"` for My Turn and ordinary non-Maths Our Turn'
    ),
    "templates.md no longer keeps My Turn unnumbered by default"
  );
  // The generic sentence above already sits under other templates, so the
  // maths-turn-ref-sc slot contract is checked on its own section: a whole-file
  // search would pass even if this section still omitted the slot.
  const heading = "#### `maths-turn-ref-sc`";
  const start = TEMPLATES_MD.indexOf(heading);
  assert.notEqual(
    start,
    -1,
    "templates.md lost its maths-turn-ref-sc section"
  );
  const rest = TEMPLATES_MD.slice(start + heading.length);
  const nextHeading = rest.search(/\n#{2,4} /);
  const refSection = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  assert.ok(
    refSection.includes("`questionNumbering` (optional)"),
    "the maths-turn-ref-sc slot contract does not document questionNumbering"
  );
});

test("the success-criteria panel keeps one identity across its routes", () => {
  assert.ok(
    TEMPLATES_MD.includes(
      "the route to the panel does not change the criteria's visual identity"
    ),
    "templates.md does not pin the shared success-criteria panel identity"
  );
  assert.ok(
    SLIDE_SUCCESS_CRITERIA_MD.includes(
      "## One success-criteria object keeps one visual identity"
    ),
    "slide-success-criteria.md lost its one-card identity section"
  );
});

test("the composition playbook makes task phases visible before full reading", () => {
  assert.ok(
    PLAYBOOK_MD.includes("### Make task phases visible before full reading"),
    "slide-composition-playbook.md lost its task-phase section"
  );
  assert.ok(
    PLAYBOOK_MD.includes(
      "preserve every word, order and punctuation mark but use a line break or paragraph break at the real action boundary"
    ),
    "the playbook's phase-break rule no longer protects the source wording"
  );
});

test("the teacher slide visual profile pins its calibration rules", () => {
  assert.ok(
    TEACHER_PROFILE_MD.includes("survival phrase"),
    "the profile no longer names the survival-phrase rule"
  );
  assert.ok(
    TEACHER_PROFILE_MD.includes("the smallest load-bearing visual"),
    "the profile no longer judges rows against the smallest load-bearing visual"
  );
  assert.ok(
    TEACHER_PROFILE_MD.includes("hug the content it contains"),
    "the profile no longer requires ordinary cards to hug their content"
  );
  assert.equal(
    TEACHER_PROFILE_MD.includes("must lose its normal numbering"),
    false,
    "the profile re-learns the lone-(1) calibration as a positive numbering rule"
  );
  assert.ok(
    TEACHER_PROFILE_MD.includes(
      "does not establish that a single main-independent question should lose its normal numbering"
    ),
    "the profile no longer records that the lone-(1) calibration establishes no rule"
  );
  assert.ok(
    TEACHER_PROFILE_MD.includes("one compact white card per criterion"),
    "the profile no longer pins the success-criteria card identity"
  );
  assert.ok(
    TEACHER_PROFILE_MD.includes("Final teacher pass"),
    "the profile lost the final rendered teacher pass"
  );
});

test("the deck reviewer calibrates against the teacher's visual profile", () => {
  assert.ok(
    VISUAL_REVIEW_DECK_MD.includes("### Teacher visual-profile calibration"),
    "visual-review-deck.md lost its calibration section"
  );
  assert.ok(
    VISUAL_REVIEW_DECK_MD.includes("teacher-slide-visual-profile.md"),
    "the deck reviewer no longer names the visual profile it calibrates against"
  );
  assert.ok(
    VISUAL_REVIEWER_MD.includes("teacher-slide-visual-profile.md"),
    "visual-reviewer.md no longer routes the deck to the visual profile"
  );
});

test("the slide self-check can retain a private preview deck for the render pass", () => {
  assert.ok(
    CHECK_SLIDE_DESIGN_JS.includes("--preview"),
    "check-slide-design.js no longer accepts the --preview flag"
  );
  assert.ok(
    CHECK_SLIDE_DESIGN_JS.includes("SLIDE_DESIGN_PREVIEW_DIR"),
    "check-slide-design.js no longer reports the private preview directory"
  );
  assert.ok(
    SLIDE_DESIGNER_MD.includes("SLIDE_DESIGN_PREVIEW_DIR"),
    "slide-designer.md no longer reads the preview directory marker"
  );
  assert.ok(
    SLIDE_DESIGNER_MD.includes("SLIDE_DESIGN_PREVIEW: [absolute"),
    "slide-designer.md no longer reads the preview deck marker"
  );
});

test("the visual self-read renders the preview and reads it back", () => {
  assert.ok(
    SLIDE_DESIGNER_MD.includes("scripts/render-pages.py"),
    "slide-designer.md no longer renders the preview for the visual self-read"
  );
  assert.ok(
    SLIDE_DESIGNER_MD.includes("scripts/build-visual-consistency-overview.py"),
    "slide-designer.md no longer builds the deck overview"
  );
  assert.ok(
    SLIDE_DESIGNER_MD.includes("Visual self-read: unavailable"),
    "slide-designer.md lost the unavailable-render outcome"
  );
  assert.ok(
    SLIDE_DESIGNER_MD.includes(
      "Apply `[PLUGIN_ROOT]/references/teacher-slide-visual-profile.md` → Final teacher pass."
    ),
    "the visual self-read no longer applies the teacher's final pass"
  );
  assert.ok(
    SLIDE_DESIGNER_MD.includes(
      "This is one lightweight creator-QA pass, not the independent final Deck Visual Review."
    ),
    "Slide Designer self-read can drift into a duplicate full visual-review pass"
  );
});

test("the lesson-design validator rejects option-bank answer structures", () => {
  assert.ok(
    VALIDATE_LESSON_DESIGN_PY.includes('"option-bank"'),
    "validate-lesson-design.py no longer knows the option-bank kind"
  );
  assert.ok(
    VALIDATE_LESSON_DESIGN_PY.includes("option-bank answers use answer.content"),
    "validate-lesson-design.py no longer rejects option-bank answer structures"
  );
});

test("the slide self-check is required by both the role and orchestrator", () => {
  const checkPath = path.join(
    __dirname,
    "..",
    "scripts",
    "check-slide-design.js"
  );

  assert.equal(
    fs.existsSync(checkPath),
    true,
    "builder/scripts/check-slide-design.js is missing"
  );
  assert.ok(
    SLIDE_DESIGNER_MD.includes(
      'builder/scripts/check-slide-design.js'
    ),
    "slide-designer.md does not run the disposable scratch check"
  );
  assert.ok(
    SLIDE_DESIGNER_MD.includes(
      "Slide design check: SLIDE_DESIGN_CHECK_OK: [N] slides"
    ),
    "slide-designer.md does not require the successful completion marker"
  );
  assert.ok(
    SLIDE_DESIGNER_MD.includes("SLIDE_DESIGN_CHECK_FAILED"),
    "slide-designer.md does not define the bounded failure state"
  );
  assert.ok(
    MAKE_LESSON_MD.includes(
      "Slide design check: SLIDE_DESIGN_CHECK_OK: [N] slides"
    ),
    "make-lesson does not require the Slide Designer completion marker"
  );
  assert.ok(
    MAKE_LESSON_MD.includes("SLIDE_DESIGN_CHECK_FAILED"),
    "make-lesson does not route a failed designer scratch check"
  );
  assert.ok(
    CHECK_LESSON_JS.includes("check-slide-design.js"),
    "check-lesson.js still claims to be the Slide Designer's final gate"
  );
  assert.ok(
    VALIDATE_JS.includes("scripts/check-slide-design.js"),
    "validate.js does not identify the Slide Designer's real final gate"
  );
});

test("repairable slide-check faults stay inside the original Slide Designer", () => {
  assert.ok(
    SLIDE_DESIGNER_MD.includes(
      "you MUST repair all such diagnostics in this same Slide Designer invocation before returning control to the orchestrator"
    ),
    "Slide Designer can still return an owned automatic-check fault without repairing it"
  );

  assert.ok(
    SLIDE_DESIGNER_MD.includes(
      "A candidate-repair pass is grouped"
    ),
    "Slide Designer no longer groups all current owned diagnostics into one repair pass"
  );

  assert.ok(
    SLIDE_DESIGNER_MD.includes(
      "no more than three candidate-repair passes after the first check"
    ),
    "Slide Designer self-repair budget is not pinned to three grouped passes"
  );

  assert.ok(
    SLIDE_DESIGNER_MD.includes(
      "Do not return `SLIDE_DESIGN_CHECK_FAILED` while an allowed candidate-repair pass remains"
    ),
    "Slide Designer can still stop at the first repairable check failure"
  );

  assert.ok(
    SLIDE_DESIGNER_MD.includes(
      "Slide self-repair: EXHAUSTED 3/3"
    ),
    "Slide Designer failure no longer distinguishes exhausted self-repair"
  );

  assert.ok(
    SLIDE_DESIGNER_MD.includes(
      "Slide self-repair: BLOCKED_OUTSIDE_AUTHORITY"
    ),
    "Slide Designer failure no longer distinguishes an external-owner block"
  );

  assert.ok(
    MAKE_LESSON_PLAYBOOK_FLAT.includes(
      "On a semantic build diagnostic, run one focused Slide Designer repair and rebuild once."
    ),
    "make-lesson no longer routes a semantic slide-build diagnostic to one focused Slide Designer repair"
  );

  assert.equal(
    MAKE_LESSON_PLAYBOOK_MD.includes(
      "`TEXT_OVERLOAD`** is content — text too heavy for its box"
    ),
    false,
    "make-lesson still carries the obsolete rule that every TEXT_OVERLOAD is a pedagogical-content fault"
  );

  assert.ok(
    MAKE_LESSON_PLAYBOOK_FLAT.includes(
      "A failed build may receive its one documented focused repair"
    ),
    "make-lesson no longer bounds a failed build to its one documented focused repair"
  );

  assert.ok(
    SLIDE_FOCUSED_REPAIR_MD.includes(
      "This role is an escalation, not a continuation of creation-mode self-check."
    ),
    "the focused Slide Designer role can still act as creation-mode Slide Designer part two"
  );
});

test("the documented picture reading floor is the one the build enforces", () => {
  // The designer sizes a picture cell from this figure and the build names a
  // cell that falls below it. Two copies of one number is how a check and the
  // guidance that is supposed to pre-empt it drift apart, so the document's
  // copy is pinned to the engine's.
  const quoted = new RegExp(
    "children work FROM: " + PICTURE_READABLE_FLOOR.toFixed(1) + "″ on the"
  );
  assert.ok(
    quoted.test(SLIDE_VISUAL_SIZING_MD),
    "slide-visual-sizing.md does not quote the engine's " +
      PICTURE_READABLE_FLOOR +
      "in picture reading floor"
  );
});
