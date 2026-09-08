"use strict";

// Three things a child writes on or into. Built as plain HTML and CSS rather
// than a picture: a tick box is a bordered span, a sort grid is a table, a
// column method is a grid of cells, and all three need a browser's own text
// flow (wrapping, borders) far more than they need a drawing.

const { LINE_MM, NOTE_LINE_MM, esc, promptHtml, linesFor } = require("./shared");
const { SPACE } = require("../tokens");

// ─── multiple-choice ─────────────────────────────────────────────────────
// A stem, an instruction ("Tick one" / "Tick all that apply"), then each
// option on its own line beside a tick box. Mirrors the Word builder's
// multiple-choice helper field for field: text, select, options.

function renderMultipleChoice(spec) {
  const instr = spec.select === "all" ? "Tick all that apply." : "Tick one.";
  const options = (spec.options || [])
    .map(
      (opt) => `<li class="h-mc-opt"><span class="h-mc-box"></span><span>${esc(opt)}</span></li>`
    )
    .join("");
  return `
    <div class="h-mc">
      ${spec.text ? `<p class="h-mc-stem">${promptHtml(spec.text)}</p>` : ""}
      <p class="h-mc-instr">${esc(instr)}</p>
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
//   frame      "outline" (the default) or "none" for bare paper
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
  const areas = drawAreas(spec);
  // The frame is named in the class rather than left as the absence of one, so
  // a page says which of the two it drew.
  const frame = spec.frame === "none" ? "none" : "outline";
  const cells = areas
    .map(
      (name) =>
        `<div class="h-draw-area">${
          name ? `<span class="h-draw-name">${esc(name)}</span>` : ""
        }</div>`
    )
    .join("");
  return `
    <div class="h-draw h-draw--frame-${frame}">
      ${spec.text ? `<p class="h-draw-stem">${esc(spec.text)}</p>` : ""}
      <div class="h-draw-surface">${cells}</div>
    </div>`;
}

function measureDrawingSpace(spec, widthMm) {
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
// Ruled boxes for a written column calculation: the two numbers stacked with
// the operator beside the second, a thick-topped answer row, and a shallow
// carry row beneath. Mirrors the Word builder's column-method-grid: operator,
// top, bottom.

function padDigits(value, width) {
  const arr = String(value).split("");
  while (arr.length < width) arr.unshift("");
  return arr;
}

function colgridCell(text, extraClass) {
  return `<div class="h-colgrid-cell${extraClass ? ` ${extraClass}` : ""}">${esc(text ?? "")}</div>`;
}

function columnMethodGeometry(spec) {
  const width = Math.max(String(spec.top).length, String(spec.bottom).length);
  return { width, cols: width + 1 };
}

// Place-value letters for the headings row, ones column outward. Seven places
// covers every number a primary written method meets.
const PLACE_VALUE_LETTERS = ["O", "T", "H", "Th", "TTh", "HTh", "M"];

function placeValueHeadings(width) {
  return PLACE_VALUE_LETTERS.slice(0, width).reverse();
}

function renderColumnMethodGrid(spec) {
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
  const { operator, top, bottom } = spec;
  const { width, cols } = columnMethodGeometry(spec);
  const topDigits = padDigits(top, width);
  const bottomDigits = padDigits(bottom, width);

  // `showHeadings: true` prints the place-value letters above the digit
  // columns (T and O on a 2-digit grid, Th H T O on a 4-digit one), derived
  // from the grid's own width so they can never disagree with the numbers.
  // A worksheet that tells a child "the digits are aligned under T and O"
  // must actually show the T and the O - a run on 30 August 2026 shipped
  // Sheet A saying exactly that over headingless grids.
  const headingRow = spec.showHeadings
    ? `<div class="h-colgrid-row h-colgrid-headings">${colgridCell("")}${placeValueHeadings(width)
        .map((label) => colgridCell(label))
        .join("")}</div>`
    : "";

  const topRow = `<div class="h-colgrid-row">${colgridCell("")}${topDigits.map((d) => colgridCell(d)).join("")}</div>`;
  const opRow = `<div class="h-colgrid-row">${colgridCell(operator)}${bottomDigits.map((d) => colgridCell(d)).join("")}</div>`;
  const answerRow = `<div class="h-colgrid-row h-colgrid-answer">${Array.from({ length: cols }, () => colgridCell("")).join("")}</div>`;
  const carryRow = `<div class="h-colgrid-row h-colgrid-carry">${Array.from({ length: cols }, () => colgridCell("")).join("")}</div>`;

  // The ceiling is applied here as well as in the measurement, so the drawn
  // grid and the height it was promised cannot disagree.
  return `<div class="h-colgrid" style="--h-colgrid-cols:${cols}; max-width:${cols * COLGRID_CELL_MAX_MM}mm">${headingRow}${topRow}${opRow}${answerRow}${carryRow}</div>`;
}

// Rows expressed as multiples of one SQUARE cell: a top-digit row, an
// operator row, a full-height answer row, and a carry row drawn at half
// height (the Word grid's own carry row is half its digit rows too).
const COLGRID_ROWS_EQUIV = 3.5;
// The optional headings row is text-only, drawn at half a cell's height.
const COLGRID_HEADINGS_EQUIV = 0.5;

function colgridRowsEquiv(spec) {
  return COLGRID_ROWS_EQUIV + (spec.showHeadings ? COLGRID_HEADINGS_EQUIV : 0);
}
const COLGRID_CELL_MIN_MM = 14; // small enough to fit width, still big enough
                                 // for a child's handwritten digit

// And a CEILING, because the cells are square and were scaling with whatever
// width they were given. Two column methods side by side on a full-width row
// came out with 28mm cells and took 119mm of a 267mm page between them: a
// digit box the size of a matchbox, for a child writing a single figure.
//
// A written calculation is not a diagram. It does not read better bigger past
// the point where a child can write in it comfortably, so it stops there and
// leaves the rest of the width alone.
const COLGRID_CELL_MAX_MM = 15;

function columnMethodWidthMm(spec, widthMm) {
  const { cols } = columnMethodGeometry(spec);
  return Math.min(widthMm, cols * COLGRID_CELL_MAX_MM);
}

function measureColumnMethodGrid(spec, widthMm) {
  const { cols } = columnMethodGeometry(spec);
  const cellMm = columnMethodWidthMm(spec, widthMm) / cols;
  return cellMm * colgridRowsEquiv(spec);
}

function needsColumnMethodGrid(spec) {
  const { cols } = columnMethodGeometry(spec);
  return {
    // A six-digit sum needs more columns, hence more width, than a
    // three-digit one; a constant per helper cannot know that.
    minWidthMm: cols * COLGRID_CELL_MIN_MM,
    minHeightMm: COLGRID_CELL_MIN_MM * colgridRowsEquiv(spec),
  };
}

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
  .h-draw--frame-none .h-draw-surface { border: none; }
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

  /* column-method-grid */
  .h-colgrid { display: flex; flex-direction: column; width: 100%; }
  .h-colgrid-row {
    display: grid;
    grid-template-columns: repeat(var(--h-colgrid-cols), 1fr);
  }
  .h-colgrid-cell {
    aspect-ratio: 1 / 1;
    /* The border must sit INSIDE the square, or every row is 0.6mm taller
       than the measurement said and the bottom row gets sliced off by the
       zone. The clipping was barely half a millimetre a row and still cut a
       visible strip off the carry row. */
    box-sizing: border-box;
    border: var(--rule-line) solid var(--colour-ink);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--type-question); font-weight: bold; color: var(--colour-ink);
  }
  .h-colgrid-answer .h-colgrid-cell { border-top: var(--rule-heavy) solid var(--colour-ink); }
  .h-colgrid-carry .h-colgrid-cell { aspect-ratio: 2 / 1; border-color: var(--colour-tint); }
  /* The headings row is a reference over the grid, not part of it: no border,
     half a cell tall, letters in the support colour so they read as labels
     rather than as digits already written in. */
  .h-colgrid-headings .h-colgrid-cell {
    aspect-ratio: 2 / 1;
    border: none;
    font-size: var(--type-note);
    color: var(--colour-quiet);
  }
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
  "column-method-grid": {
    render: renderColumnMethodGrid,
    measure: measureColumnMethodGrid,
    needs: needsColumnMethodGrid,
    // Cells must stay SQUARE for a child's place value to line up. Extra
    // height without extra width would only stretch them out of square, so
    // growth is refused rather than let the grid distort.
    greed: 0,
  },
};

module.exports = { helpers, css };
