"use strict";

// Things a child writes on or into. The tick boxes, the sort grid and the
// drawing space are plain HTML and CSS rather than pictures: a tick box is a
// bordered span, a sort grid is a table, and they need a browser's own text
// flow (wrapping, borders) far more than they need a drawing. The column
// method is the exception: it is the shared drawing the board and the wall
// place, so a child meets one column sum in all three places.

const { LINE_MM, NOTE_LINE_MM, esc, promptHtml, linesFor } = require("./shared");
const { SPACE } = require("../tokens");
const { MM_TO_PT } = require("../../../shared/visuals/surface-profiles");
const { atPrintedWidth } = require("./at-printed-width");
const placeValueChart = require("../../../shared/visuals/place-value-chart-svg");

// ─── multiple-choice ─────────────────────────────────────────────────────
// A stem, an instruction ("Tick one" / "Tick all that apply"), then each
// option on its own line beside a tick box. Mirrors the Word builder's
// multiple-choice helper field for field: text, select, options.

function renderMultipleChoice(spec) {
  // The question usually says what to do already ("Which of these have stayed
  // the same? Tick them."), and the helper's own line then contradicted it:
  // "Tick them." with "Tick one." printed underneath (the teacher, 4 October
  // 2026). The line is printed only when the question's words do not say.
  const says = /\b(tick|circle|choose|pick)\b/i.test(String(spec.text || ""));
  const instr = says ? "" : spec.select === "all" ? "Tick all that apply." : "Tick one.";
  const options = (spec.options || [])
    .map(
      (opt) => `<li class="h-mc-opt"><span class="h-mc-box"></span><span>${esc(opt)}</span></li>`
    )
    .join("");
  return `
    <div class="h-mc">
      ${spec.text ? `<p class="h-mc-stem">${promptHtml(spec.text)}</p>` : ""}
      ${instr ? `<p class="h-mc-instr">${esc(instr)}</p>` : ""}
      <ul class="h-mc-opts">${options}</ul>
    </div>`;
}

const MC_OPT_MM = 8; // one option's tick box and label, tall enough not to
                      // crowd the option below it

function measureMultipleChoice(spec, widthMm) {
  const stemMm = spec.text ? linesFor(spec.text, widthMm) * LINE_MM : 0;
  const instrMm = LINE_MM * 1.2;
  const optsMm = (spec.options || []).length * MC_OPT_MM;
  return stemMm + instrMm + optsMm + 4;
}

function needsMultipleChoice(spec) {
  const count = (spec.options || []).length;
  return {
    // A tick box and a short option label always fit a narrow column; what
    // grows this helper is how MANY options there are, which costs height,
    // not width.
    minWidthMm: 60,
    minHeightMm: LINE_MM * 2 + count * MC_OPT_MM + 4,
  };
}

// ─── sort-grid ───────────────────────────────────────────────────────────
// A grid of named columns with blank rows for a child to sort items into,
// plus an optional word bank above it. Mirrors the Word builder's sort-grid:
// text, wordBank, columns, rows.

const SORT_WRITE_ROW_MM = 14; // a cell a child sorts SEVERAL words into, so
                               // roomier than tables.js's single-answer cell
// And where sorting stops gaining. A column a child writes words down needs
// room for the words; past about half again, the extra is a bigger empty box
// rather than a better one. See `enough` in helpers/index.js.
const SORT_GROWN_ROW_MM = 22;

// A bank entry is a bare string ("torch 🔦") or an object with a real
// picture: { word: "torch", imagePath: "photos/torch.jpg" }. The picture form
// exists for the child who cannot yet decode the word - a below sheet sorting
// real things wants each thing SHOWN, and an emoji is only a picture when it
// happens to be the thing. imagePath resolves to an embedded imageHref at
// build time like every other picture in the engine.
const BANK_IMG_MM = 10; // thumbnail height: big enough to recognise a real
                        // object, small enough that a bank of eight stays a
                        // bank rather than becoming the page's main visual
function bankEntries(spec) {
  return (spec.wordBank || []).map((w) => (typeof w === "string" ? { word: w } : w));
}

function renderSortGrid(spec) {
  const cols = spec.columns || [];
  const rows = spec.rows ?? 4;
  const entries = bankEntries(spec);

  const head = cols.map((c) => `<th>${esc(c)}</th>`).join("");
  const bodyRows = Array.from(
    { length: rows },
    () => `<tr>${cols.map(() => `<td class="h-write"></td>`).join("")}</tr>`
  ).join("");

  return `
    <div class="h-sortgrid">
      ${spec.text ? `<p class="h-sortgrid-stem">${esc(spec.text)}</p>` : ""}
      ${
        entries.length
          ? `<div class="h-sortgrid-bank">
              <p class="h-sortgrid-bank-title">Word bank</p>
              <div class="h-sortgrid-bank-choices">${entries
                .map(
                  (e) =>
                    `<span class="h-sortgrid-word">${
                      e.imageHref
                        ? `<img class="h-sortgrid-thumb" src="${esc(e.imageHref)}" alt="">`
                        : ""
                    }${esc(e.word)}</span>`
                )
                .join("&nbsp;&nbsp;&nbsp;")}</div>
            </div>`
          : ""
      }
      <table class="h-table h-sortgrid-table">
        <thead><tr>${head}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
}

function measureSortGrid(spec, widthMm) {
  const stemMm = spec.text ? linesFor(spec.text, widthMm) * LINE_MM + 2 : 0;
  const entries = bankEntries(spec);
  const hasImages = entries.some((e) => e.imageHref || e.imagePath);
  // Both kinds of bank are now priced from how they actually wrap. The
  // text-only bank used to be a flat line and a half whatever it held, so a
  // bank of twelve words was measured as one line, wrapped to three on paper
  // and pushed the grid off the bottom of the zone. Every entry is kept - a
  // bank that will not fit is a fit fault the designer resolves, never words
  // quietly dropped until the sum works.
  //
  // Entries are joined the way the renderer joins them, a thumbnail counted as
  // about five characters of width, and each line priced at the thumbnail
  // height when there are pictures and a text line when there are not. The
  // title is its own row.
  let bankMm = 0;
  if (entries.length) {
    const asText = entries
      .map((e) => (e.imageHref || e.imagePath ? "XXXXX" : "") + e.word)
      .join("   ");
    const lineMm = hasImages ? BANK_IMG_MM + 3 : LINE_MM;
    bankMm =
      NOTE_LINE_MM + SPACE.hair + linesFor(asText, widthMm) * lineMm + SPACE.item;
  }
  const headerMm = LINE_MM * 1.6;
  const rows = spec.rows ?? 4;
  return stemMm + bankMm + headerMm + rows * SORT_WRITE_ROW_MM + 4;
}

// The tallest a sorting grid is still gaining from: its own measured height,
// plus the room each row of cells can still turn into easier sorting.
//
// This used to be Infinity, by way of `fills: true`, and that is most of how
// the balanced-diet sheet came to be one 209mm rectangle. The shared helper
// guide sent "somewhere to draw" here, `fills` was read as "no useful upper
// size", and the box took the page. A sorting grid is a sorting grid; a
// surface a child draws on is `drawing-space`, which states the surface it
// wants instead of taking whatever is going.
function enoughSortGrid(spec, widthMm) {
  const rows = spec.rows ?? 4;
  return (
    measureSortGrid(spec, widthMm) + rows * (SORT_GROWN_ROW_MM - SORT_WRITE_ROW_MM)
  );
}

function needsSortGrid(spec) {
  const cols = (spec.columns || []).length;
  const rows = spec.rows ?? 4;
  return {
    // A column a child sorts words INTO cannot be narrow, for the same
    // reason tables.js's recording-table cannot: a four-column grid needs
    // more width than a two-column one, a constant per helper cannot know
    // that.
    minWidthMm: Math.max(80, cols * 28),
    minHeightMm: 20 + rows * SORT_WRITE_ROW_MM,
  };
}

// ─── drawing-space ───────────────────────────────────────────────────────
// The surface a child draws on: a lunchbox to design, a habitat to draw and
// label, a poster panel, an object to sketch beside the one already printed.
//
// It exists because the alternative was worse. The shared helper guide used to
// send "somewhere to draw" to a one-row `sort-grid`, and a sort grid is a
// TABLE: tinted heading band, ruled cells, and - because sorting cells were
// declared bottomless - a rectangle that took whatever height the page had
// going spare. A balanced-diet sheet shipped with a 209mm blank cell under a
// heading, which is a whole page of generic box, and nothing in the engine
// disagreed with it because nothing had been asked to.
//
// The task was never the problem. Children choosing their own foods, drawing
// them, labelling them and adding arrows is exactly the work that wants an open
// surface, and pre-printing the foods or the compartments would take away the
// decisions the lesson is for. What was missing was anybody DECIDING how much
// surface the work needs. So this helper asks:
//
//   draw       how many separate things go on the surface (default 1)
//   annotate   true when labels and arrows go around them as well
//   heightMm   the surface, stated outright, when the designer knows it
//   areas      names for side-by-side parts of the surface, when it has parts
//
// IT IS ALWAYS DRAWN AS A BOX. `frame: "none"` used to give bare paper, and on
// 12 September 2026 Daniel found what that prints as: the Greater Depth rounding
// sheet had 43mm of working room between question 2 and question 3 with no edge
// and no words, and it read as the end of the sheet. A space a child cannot see
// is not a space a child has. He settled it in one line - "dont want bare paper,
// if it is a question it truly thinks needs working space (that they couldnt
// just do in book) then it should have a box but thats rare."
//
// The same argument the callout rule already makes: paper left blank because
// that is the question, and paper left blank because nothing was put there, look
// identical, and only one of them is a design. A border is what tells them
// apart, and it costs nothing.
//
// and works out a surface from the answer. `heightMm` beats the arithmetic,
// because a designer who has looked at the task knows better than a formula.
// Nothing here decides what the child draws.

// One thing, drawn big enough to be worth drawing and to be marked.
const DRAW_ONE_MM = 50;
// Each further thing sharing the same surface. Sub-linear on purpose: four
// objects on one sheet of paper share the width as well as the height, so the
// fourth costs less than the first.
const DRAW_MORE_MM = 12;
// Labels and arrows live in the space AROUND a drawing, so annotating one adds
// room rather than multiplying it.
const DRAW_ANNOTATE_MM = 20;
// Past this, a surface is a decision rather than a default, and `heightMm` is
// how a designer makes it. A derived surface that quietly took two thirds of a
// portrait page would be the old fault in a new helper.
const DRAW_DERIVED_MAX_MM = 150;
// The smallest surface anybody can draw on. Below this it is a tick box.
const DRAW_MIN_MM = 30;
const DRAW_NAME_MM = 6; // the quiet label at the top of a named area

// A saved spec may still carry `frame: "outline"`, which is what it has always
// drawn and all it can draw now. Anything else is refused by name rather than
// quietly corrected, because a designer who asked for bare paper was making a
// decision and should be told it is not one that exists.
function checkDrawingFrame(spec) {
  const frame = spec.frame;
  if (frame === undefined || frame === null || frame === "outline") return;
  throw new Error(
    `DRAWING_SPACE_FRAME: frame is ${JSON.stringify(frame)}. A drawing or ` +
      "working space is always drawn as a box: paper with no edge round it " +
      "reads as the end of the sheet, and a child cannot tell it from the " +
      "margin. If this question does not earn a box - most do not, because " +
      "children have their books - take the space off the sheet instead."
  );
}

function drawAreas(spec) {
  const named = Array.isArray(spec.areas) ? spec.areas.filter((a) => a !== "") : [];
  return named.length ? named : [null];
}

function drawSurfaceMm(spec) {
  if (spec.heightMm !== undefined) {
    const stated = Number(spec.heightMm);
    if (!Number.isFinite(stated) || stated < DRAW_MIN_MM || stated > 250) {
      throw new Error(
        `drawing-space heightMm is ${spec.heightMm}, which is not a surface a ` +
          `child can draw on. State it in millimetres, between ${DRAW_MIN_MM} and 250.`
      );
    }
    return stated;
  }
  const things = Math.max(1, Math.floor(Number(spec.draw) || 1));
  const derived =
    DRAW_ONE_MM +
    (things - 1) * DRAW_MORE_MM +
    (spec.annotate ? DRAW_ANNOTATE_MM : 0) +
    (drawAreas(spec).some(Boolean) ? DRAW_NAME_MM : 0);
  return Math.min(DRAW_DERIVED_MAX_MM, derived);
}

function renderDrawingSpace(spec) {
  checkDrawingFrame(spec);
  const areas = drawAreas(spec);
  const cells = areas
    .map(
      (name) =>
        `<div class="h-draw-area">${
          name ? `<span class="h-draw-name">${esc(name)}</span>` : ""
        }</div>`
    )
    .join("");
  return `
    <div class="h-draw">
      ${spec.text ? `<p class="h-draw-stem">${esc(spec.text)}</p>` : ""}
      <div class="h-draw-surface">${cells}</div>
    </div>`;
}

function measureDrawingSpace(spec, widthMm) {
  // Refused while measuring as well, so a sheet is turned back before it is
  // drawn rather than after.
  checkDrawingFrame(spec);
  const stemMm = spec.text ? linesFor(spec.text, widthMm) * LINE_MM + SPACE.tight : 0;
  return stemMm + drawSurfaceMm(spec);
}

function needsDrawingSpace(spec) {
  const areas = drawAreas(spec).length;
  return {
    // An area a child draws in cannot be a strip. Two named areas side by side
    // need twice what one needs, the same way a sorting grid's columns do.
    minWidthMm: Math.max(60, areas * 45),
    minHeightMm: Math.max(DRAW_MIN_MM, drawSurfaceMm(spec) * 0.75),
  };
}

// ─── column-method-grid ────────────────────────────────────────────────
// A written column calculation for the child to complete: the two numbers
// stacked with the sign beside the second, a thick rule, the answer row, a
// second thick rule, and a shallow row under the answer for what is carried.
//
// It is the shared place value chart's `calculation`, the same drawing in the
// same column colours the board and the working wall show. Until 5 October
// 2026 the sheet ruled its own grid in black and white with the carry row in a
// tint so pale it printed as no row at all, so the sum a child had watched in
// four coloured rows on the board arrived on the page as three plain ones.
// The sheet's fields are unchanged: operator, top, bottom, showHeadings.

function toCalculation(spec) {
  // Headings are derived from the numbers' own width so they can never be
  // wrong; an explicit list re-opens the mislabelling this refuses. Named
  // refusal, not a silent no-op: a repair loop rebuilt pixel-identical pages
  // twice on 30 August 2026 because unsupported fields were quietly ignored.
  if (spec.columns !== undefined) {
    throw new Error(
      "COLUMN_METHOD_UNSUPPORTED: column-method-grid derives its place-value " +
        "headings from the numbers - use showHeadings: true, not a columns list."
    );
  }
  return {
    // `showHeadings: true` prints the place-value letters above the digit
    // columns (T and O on a 2-digit grid, Th H T O on a 4-digit one). A
    // worksheet that tells a child "the digits are aligned under T and O"
    // must actually show the T and the O - a run on 30 August 2026 shipped
    // Sheet A saying exactly that over headingless grids.
    headings: spec.showHeadings === true,
    calculation: { operator: spec.operator, numbers: [spec.top, spec.bottom] },
  };
}

// The cells are square and stop at the size a child writes one digit in, so
// the grid is as wide as its own columns and no wider. It never takes spare
// height either: extra height without extra width would only pull the cells
// out of square, and a child's place value has to line up down the page.
const columnMethodGrid = atPrintedWidth(placeValueChart, {
  toSpec: toCalculation,
  minWidthMm: (spec) => Math.ceil(placeValueChart.minWidthPt(toCalculation(spec), "worksheets") / MM_TO_PT),
});
// Set against the left edge, under the question it belongs to, where the old
// grid sat. A figure is centred in its zone by default, which is right for a
// diagram and leaves a sum floating away from "256 + 127 =".
const renderColumnMethodGrid = (spec, width) =>
  columnMethodGrid.render(spec, width).replace('class="h-figure"', 'class="h-figure h-colgrid"');

const css = `
  /* multiple-choice */
  .h-mc { font-size: var(--type-body); }
  /* An instruction, so ink. See the note on colour meanings in tokens.js. */
  .h-mc-stem { margin: 0 0 var(--space-tight); color: var(--colour-ink); }
  /* "Tick all that apply" is an instruction, so ink like every other. */
  .h-mc-instr { margin: 0 0 var(--space-item); font-style: italic; color: var(--colour-ink); font-size: var(--type-note); }
  .h-mc-opts { list-style: none; margin: 0; padding: 0; }
  .h-mc-opt { display: flex; align-items: center; gap: var(--space-tight); margin-bottom: var(--space-tight); }
  .h-mc-box {
    display: inline-block; width: 5mm; height: 5mm;
    border: var(--rule-line) solid var(--colour-ink); flex: none;
  }

  /* drawing-space.
     A surface, not a table. The old route here was a one-row sorting grid, and
     it looked like one: a tinted heading band, ink-weight cell borders and a
     word bank on top of a big empty rectangle. What a child needs is paper with
     an edge, so the outline is the hairline rule rather than the ink, the
     corner is softened, and a named area carries its name quietly in the corner
     instead of under a heading bar. */
  .h-draw { display: flex; flex-direction: column; height: 100%; }
  .h-draw-stem {
    margin: 0 0 var(--space-tight);
    font-size: var(--type-body); line-height: 1.35;
    flex: none;
  }
  /* The hairline, and the hairline's own meaning: a line the child works on.
     A box edge at ink weight would say "this is a cell in a table", which is
     exactly the reading the sorting grid gave this task and exactly the one to
     lose. */
  .h-draw-surface {
    flex: 1; display: flex; min-height: 0;
    border: var(--rule-hair) solid var(--colour-rule);
    border-radius: 1.5mm;
  }
  .h-draw-area { flex: 1; min-width: 0; position: relative; }
  .h-draw-area + .h-draw-area {
    border-left: var(--rule-hair) solid var(--colour-rule);
  }
  .h-draw-name {
    position: absolute;
    top: var(--inset-card-v); left: var(--inset-card-h);
    font-size: var(--type-note); color: var(--colour-quiet);
  }

  /* sort-grid */
  .h-sortgrid-stem { margin: 0 0 var(--space-tight); font-size: var(--type-body); }
  .h-sortgrid-bank {
    margin: 0 0 var(--space-item); font-size: var(--type-body);
    background: var(--colour-tint); padding: var(--space-tight);
  }
  /* The bank says what it is on its own line. Written as "Word bank:" inline
     ahead of the words, the label read as the first thing in a list, and a
     child scanning for support found a sentence rather than a block. */
  .h-sortgrid-bank-title {
    margin: 0 0 var(--space-hair);
    font-size: var(--type-note);
    font-weight: bold;
    color: var(--colour-ink);
  }
  .h-sortgrid-bank-choices { display: block; }
  /* A bank entry is one thing to the child, so it never breaks across lines.
     An entry carrying a picture ("torch 🔦") wraps at its own space otherwise,
     stranding the picture alone on the next line where it reads as a further
     object to sort rather than as part of the word above it. */
  .h-sortgrid-word { white-space: nowrap; display: inline-block; }
  .h-sortgrid-thumb {
    height: ${BANK_IMG_MM}mm; width: auto; vertical-align: middle;
    margin-right: 1.5mm;
  }
  .h-sortgrid-table .h-write { height: ${SORT_WRITE_ROW_MM}mm; }
  .h-sortgrid-table thead th { background: var(--colour-tint); }
  /* Columns a child sorts INTO are equal, because the groups are equal. Left
     to the browser they are sized by how long each HEADING happens to be, so a
     box headed "Your drawing" and "What electricity helps it do" came out a
     35mm sliver beside a 65mm column - the child given least room for the part
     that needed most. The heading names the group; it does not measure it. */
  .h-sortgrid-table { table-layout: fixed; }

  /* Same as the recording table: this helper claims spare height (greed 3), so
     it has to actually take it, or the extra becomes a hole under the grid.
     The stem and the word bank keep their own size and the TABLE absorbs the
     rest, because room to sort words into is the part that gains. */
  .h-sortgrid { height: 100%; display: flex; flex-direction: column; }
  .h-sortgrid-table { flex: 1; }

  /* column-method-grid: the shared drawing, set left under its question */
  .h-figure.h-colgrid { justify-content: flex-start; }
`;

const helpers = {
  "multiple-choice": {
    requires: ["options"],
    render: renderMultipleChoice,
    measure: measureMultipleChoice,
    needs: needsMultipleChoice,
    greed: 0, // a fixed set of options does not read better bigger
  },
  "sort-grid": {
    requires: ["columns"],
    render: renderSortGrid,
    measure: measureSortGrid,
    needs: needsSortGrid,
    greed: 3, // taller rows are more room to sort words into, a real gain
    // The cells ARE the activity, so this is first in the queue for spare
    // height and takes a short column's leftover ahead of the writing lines
    // beside it. First in the queue is not the same as bottomless, though: a
    // cell to write three words in stops improving at some size, and where it
    // stops is `enough`.
    fills: true,
    enough: enoughSortGrid,
  },
  "drawing-space": {
    render: renderDrawingSpace,
    measure: measureDrawingSpace,
    needs: needsDrawingSpace,
    greed: 3, // a bigger surface is more of the work, up to the surface asked for
    // First in the queue for room nothing else can use: a short column's
    // leftover prints as a hole beside anything else, and as paper to draw on
    // here.
    fills: true,
    // And it stops at the surface the task was given. The point of this helper
    // is that somebody DECIDED how much room the drawing needs; letting it then
    // absorb whatever the page had left over would be deciding it again, by
    // accident, out of the page's arithmetic.
    enough: measureDrawingSpace,
  },
  "column-method-grid": { ...columnMethodGrid, render: renderColumnMethodGrid },
};

module.exports = { helpers, css };
