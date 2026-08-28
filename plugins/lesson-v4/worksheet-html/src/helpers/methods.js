"use strict";

// The formal written methods: the taught algorithms a child performs on paper.
//
// Four of these are ruled grids of the same family as forms.js's
// column-method-grid, and they deliberately share its geometry - the same cell
// size, the same square cells, the same thick answer rule. A sheet that carries
// an addition grid beside a multiplication grid must draw them the same size,
// or the child reads two different systems for one method.
//
// The fifth, method-frame, is the other kind of written method: not an
// algorithm in boxes but a taught mental strategy printed line by line, with
// the blanks the child fills in. It is the same picture the slide builder puts
// on the board, so a child meets one shape in both places.

const { LINE_MM, esc, linesFor } = require("./shared");
const { TYPE, INSET } = require("../tokens");

const PT_TO_MM = 0.3528;

// The printable width of A4 landscape: the widest a zone can ever be, and so
// the width at which a block of text comes out SHORTEST. Same constant, and
// same reason, as text.js and frames.js.
const WIDEST_ZONE_MM = 261;

// ─── shared grid geometry ────────────────────────────────────────────────
// Square digit cells, sized exactly as forms.js sizes a column method. Both
// numbers are repeated rather than imported because a helper file stands on
// its own, but they are one fact: if one moves, the other must move with it.

const GRID_CELL_MIN_MM = 14; // small enough to fit a narrow column, still big
                             // enough for a child's handwritten digit
const GRID_CELL_MAX_MM = 15; // and a ceiling, because square cells otherwise
                             // scale with whatever width they are given: a
                             // written calculation does not read better bigger
                             // past the point where a child can write in it

// One digit row is one square. A carry row is drawn at half height, as the
// Word builder's own carry row is (240 DXA against its 480 DXA digit rows).
const CARRY_ROWS_EQUIV = 0.5;

function cellMm(cols, widthMm) {
  // The ceiling is applied here AND in the markup, so the drawn grid and the
  // height it was promised cannot disagree.
  return Math.min(widthMm, cols * GRID_CELL_MAX_MM) / cols;
}

function padDigits(value, width) {
  const arr = String(value ?? "").split("");
  while (arr.length < width) arr.unshift("");
  return arr;
}

function cell(text, extraClass) {
  return `<div class="h-mgrid-cell${extraClass ? ` ${extraClass}` : ""}">${esc(text ?? "")}</div>`;
}

function blankCells(count, extraClass) {
  return Array.from({ length: count }, () => cell("", extraClass)).join("");
}

function row(cells, extraClass) {
  return `<div class="h-mgrid-row${extraClass ? ` ${extraClass}` : ""}">${cells}</div>`;
}

// Millimetres for a style attribute, without the floating-point tail that
// turns 37.3 into 37.300000000000004 on the page.
function mm(value) {
  return `${Math.round(value * 100) / 100}mm`;
}

function grid(cols, rows) {
  return `<div class="h-mgrid" style="--h-mgrid-cols:${cols}; max-width:${mm(cols * GRID_CELL_MAX_MM)}">${rows}</div>`;
}

// `id` prints as the question's number above the grid, matching the Word
// builder's "3." in question blue.
function hasId(spec) {
  return spec.id !== undefined && spec.id !== null && spec.id !== "";
}

function idHtml(spec) {
  return hasId(spec) ? `<p class="h-mgrid-id">${esc(spec.id)}.</p>` : "";
}

function idMm(spec) {
  return hasId(spec) ? LINE_MM + 2 : 0; // one line, margin-bottom 2mm
}

// ─── short-multiplication-grid ───────────────────────────────────────────
// Column multiplication by a single digit: the number, the multiplier under
// its ones column beside a ×, a thick-topped answer row, and a shallow carry
// row beneath.

function shortMultGeometry(spec) {
  const width = String(spec.top ?? "").length;
  return { width, cols: width + 1 };
}

const SHORT_MULT_ROWS_EQUIV = 3 + CARRY_ROWS_EQUIV;

function renderShortMultiplicationGrid(spec) {
  const { width, cols } = shortMultGeometry(spec);
  const topDigits = padDigits(spec.top, width);
  // Right-aligned, so the multiplier sits under the ones digit - which is
  // where the child starts, and the whole reason the method lines up.
  const mulDigits = padDigits(spec.multiplier, width);

  const rows =
    row(cell("") + topDigits.map((d) => cell(d)).join("")) +
    row(cell("×") + mulDigits.map((d) => cell(d)).join("")) +
    row(blankCells(cols), "h-mgrid-answer") +
    row(blankCells(cols), "h-mgrid-carry");

  return `<div class="h-method">${idHtml(spec)}${grid(cols, rows)}</div>`;
}

function measureShortMultiplicationGrid(spec, widthMm) {
  const { cols } = shortMultGeometry(spec);
  return idMm(spec) + cellMm(cols, widthMm) * SHORT_MULT_ROWS_EQUIV;
}

function needsShortMultiplicationGrid(spec) {
  const { cols } = shortMultGeometry(spec);
  return {
    // A four-digit number needs a column more than a three-digit one; a
    // constant per helper cannot know that.
    minWidthMm: cols * GRID_CELL_MIN_MM,
    minHeightMm: idMm(spec) + GRID_CELL_MIN_MM * SHORT_MULT_ROWS_EQUIV,
  };
}

// ─── long-multiplication-grid ────────────────────────────────────────────
// The long multiplication shape: the two numbers, a thick line, one partial
// product row PER DIGIT of the multiplier, a second thick line, the total, and
// a carry row.
//
// The Word builder always draws two partial rows. Here the count follows the
// multiplier, because a three-digit multiplier needs three partial products
// and a grid one row short is a grid the method does not fit in. Two is the
// floor, so the ordinary 2-digit case is drawn exactly as it always was.

function longMultGeometry(spec) {
  const width = Math.max(String(spec.top ?? "").length, String(spec.bottom ?? "").length);
  const partials = Math.max(2, String(spec.bottom ?? "").length);
  return { width, cols: width + 1, partials };
}

function longMultRowsEquiv(spec) {
  const { partials } = longMultGeometry(spec);
  return 2 + partials + 1 + CARRY_ROWS_EQUIV; // numbers, partials, total, carry
}

function renderLongMultiplicationGrid(spec) {
  const { width, cols, partials } = longMultGeometry(spec);
  const topDigits = padDigits(spec.top, width);
  const bottomDigits = padDigits(spec.bottom, width);

  const partialRows = Array.from({ length: partials }, (unused, i) =>
    // Only the FIRST partial row carries the thick rule: it is the line drawn
    // under the two numbers, not a border between working rows.
    row(blankCells(cols), i === 0 ? "h-mgrid-answer" : "")
  ).join("");

  const rows =
    row(cell("") + topDigits.map((d) => cell(d)).join("")) +
    row(cell("×") + bottomDigits.map((d) => cell(d)).join("")) +
    partialRows +
    row(blankCells(cols), "h-mgrid-answer") +
    row(blankCells(cols), "h-mgrid-carry");

  return `<div class="h-method">${idHtml(spec)}${grid(cols, rows)}</div>`;
}

function measureLongMultiplicationGrid(spec, widthMm) {
  const { cols } = longMultGeometry(spec);
  return idMm(spec) + cellMm(cols, widthMm) * longMultRowsEquiv(spec);
}

function needsLongMultiplicationGrid(spec) {
  const { cols } = longMultGeometry(spec);
  return {
    minWidthMm: cols * GRID_CELL_MIN_MM,
    // Grows with the multiplier too: more digits, more partial products,
    // more rows to fit.
    minHeightMm: idMm(spec) + GRID_CELL_MIN_MM * longMultRowsEquiv(spec),
  };
}

// ─── bus-stop-grid ───────────────────────────────────────────────────────
// Short division. The answer row sits ON TOP, under the roof; the divisor sits
// outside the wall to the left; the dividend's digits sit inside it.

function busStopGeometry(spec) {
  const digits = String(spec.dividend ?? "").split("");
  return { digits, cols: digits.length + 1 };
}

const BUS_STOP_ROWS_EQUIV = 2 + CARRY_ROWS_EQUIV;

function busStopRows(spec) {
  const { digits } = busStopGeometry(spec);
  // The roof is the underside of the answer row, so the answer row is where
  // the child writes and the thick border below it is the bus stop's roof.
  const roof =
    row(cell("", "h-mgrid-bare") + digits.map(() => cell("", "h-mgrid-bare h-mgrid-roof")).join(""));
  const body =
    row(cell(spec.divisor, "h-mgrid-bare h-mgrid-wall") + digits.map((d) => cell(d, "h-mgrid-bare")).join(""));
  return roof + body;
}

function renderBusStopGrid(spec) {
  const { cols } = busStopGeometry(spec);
  const rows = busStopRows(spec) + row(blankCells(cols), "h-mgrid-carry");
  return `<div class="h-method">${idHtml(spec)}${grid(cols, rows)}</div>`;
}

function measureBusStopGrid(spec, widthMm) {
  const { cols } = busStopGeometry(spec);
  return idMm(spec) + cellMm(cols, widthMm) * BUS_STOP_ROWS_EQUIV;
}

function needsBusStopGrid(spec) {
  const { cols } = busStopGeometry(spec);
  return {
    // A four-digit dividend is a wider bus stop than a two-digit one.
    minWidthMm: cols * GRID_CELL_MIN_MM,
    minHeightMm: idMm(spec) + GRID_CELL_MIN_MM * BUS_STOP_ROWS_EQUIV,
  };
}

// ─── long-division-grid ──────────────────────────────────────────────────
// The same bus stop with a blank working box beneath it, for the child to show
// the repeated subtract-and-bring-down steps. The box is the whole point of
// the helper: without room to work, long division cannot be done on the sheet.

const LONG_DIV_ROWS_EQUIV = 2; // no carry row; the working box takes that job
const WORKING_BOX_MM = 32; // the Word builder's 1800 DXA
const WORKING_GAP_MM = 2; // var(--space-tight) between the bus stop and the box

function renderLongDivisionGrid(spec) {
  const { cols } = busStopGeometry(spec);
  return `<div class="h-method h-longdiv" style="max-width:${mm(cols * GRID_CELL_MAX_MM)}">${idHtml(spec)}<div class="h-mgrid" style="--h-mgrid-cols:${cols}">${busStopRows(spec)}</div><div class="h-longdiv-working"></div></div>`;
}

function measureLongDivisionGrid(spec, widthMm) {
  const { cols } = busStopGeometry(spec);
  return (
    idMm(spec) + cellMm(cols, widthMm) * LONG_DIV_ROWS_EQUIV + WORKING_GAP_MM + WORKING_BOX_MM
  );
}

function needsLongDivisionGrid(spec) {
  const { cols } = busStopGeometry(spec);
  return {
    minWidthMm: cols * GRID_CELL_MIN_MM,
    // The working box is stated at full size rather than a squeezed one. It is
    // not decoration to be trimmed when the page is tight: a box too short to
    // work in leaves the child a division they cannot actually do.
    minHeightMm:
      idMm(spec) + GRID_CELL_MIN_MM * LONG_DIV_ROWS_EQUIV + WORKING_GAP_MM + WORKING_BOX_MM,
  };
}

// ─── method-frame ────────────────────────────────────────────────────────
// A taught mental strategy printed as a fill-in method: labelled lines inside
// a panel, where a run of two or more underscores or a □ becomes a bordered
// write-in box. The caller decides how many blanks each line carries, so the
// SAME frame is given fully worked, part-given, or all blank - which is how a
// set fades from a worked example to independent work.

const BOX_W_MM = 11; // the Word builder's 620 DXA: room for a 2 - 3 digit answer
const BOX_H_MM = 9; //  and its 520 DXA
const SEG_MARGIN_MM = 1.25; // above and below a box, so two rows never touch
const SEG_ROW_MM = BOX_H_MM + SEG_MARGIN_MM * 2;
const SEG_CHAR_MM = 2.8; // a bold body character, measured generously
// Left plus right, so each side gets half. A cell step per side: a segment is
// a small inline box holding a couple of digits, not a card.
const SEG_PAD_MM = INSET.cell.h * 2;
const SEG_MIN_MM = 8; // so a one-character operator still reads as its own step
const SEG_GAP_MM = 2; // var(--space-tight)
// The panel inset. It was a flat 4mm, which is the horizontal step; a panel
// is tighter than that top to bottom, like every other box on the page.
const PANEL_PAD_V_MM = INSET.panel.v;
const PANEL_PAD_H_MM = INSET.panel.h;
const PANEL_BORDER_MM = 1; // 0.4mm top and bottom, rounded up
// Drops the label onto the FIRST row's centre line, which cannot be done with
// alignment: the label has to hold that line however many rows the segments
// wrap onto. Computed rather than stated, because a flat 2.5mm was left over
// from an earlier box height and sat the label 0.4mm high of the centre it
// was named after. This is geometry, not an inset, so it is exempt from the
// inset scale and the token test names it as such.
const LABEL_PAD_MM = SEG_MARGIN_MM + BOX_H_MM / 2 - LINE_MM / 2;
const TITLE_LINE_MM = TYPE.sectionLabel * PT_TO_MM * 1.35;

// The label column is shared across every line so the method language reads
// down the left as a column, the way a taught strategy is spoken.
const LABEL_CHAR_MM = 2.6;
const LABEL_MIN_MM = 25;
const LABEL_MAX_MM = 74;

function frameLines(spec) {
  return Array.isArray(spec.lines) ? spec.lines : [];
}

function labelOf(line) {
  return String((line && line.label) || "");
}

function labelColumnMm(lines) {
  const longest = lines.reduce((m, l) => Math.max(m, labelOf(l).trim().length), 0);
  if (longest === 0) return 0; // no labels, no column
  return Math.min(LABEL_MAX_MM, Math.max(LABEL_MIN_MM, longest * LABEL_CHAR_MM + 3.5));
}

function tokenize(content) {
  return String(content == null ? "" : content)
    .split(/(_{2,}|□)/)
    .filter((p) => p !== "")
    .map((p) => (/^(_{2,}|□)$/.test(p) ? { box: true } : { text: p.trim() }))
    .filter((seg) => seg.box || seg.text.length > 0);
}

function segMm(seg) {
  return seg.box ? BOX_W_MM : Math.max(SEG_MIN_MM, seg.text.length * SEG_CHAR_MM + SEG_PAD_MM);
}

function lineWidthMm(line) {
  return tokenize(line && line.content).reduce((w, s) => w + segMm(s) + SEG_GAP_MM, 0);
}

// How tall ONE method line comes out at a given width: the segments wrap
// within what the label column leaves them, and the label itself can wrap.
function lineHeightMm(line, availMm, labelMm) {
  const rows = Math.max(1, Math.ceil(lineWidthMm(line) / Math.max(20, availMm)));
  const segsMm = rows * SEG_ROW_MM;
  if (labelMm <= 0) return segsMm;
  const labelRows = Math.max(1, Math.ceil((labelOf(line).length * LABEL_CHAR_MM + 3.5) / labelMm));
  return Math.max(segsMm, labelRows * LINE_MM + LABEL_PAD_MM);
}

function inlineBold(text) {
  // Escaped FIRST, so markup in the spec cannot reach the page; ** survives
  // escaping untouched, so the bold pass is safe to run afterwards.
  return esc(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function renderMethodFrame(spec) {
  const lines = frameLines(spec);
  const labelMm = labelColumnMm(lines);
  const framed = spec.frame !== false;

  const stem = spec.text
    ? `<p class="h-mframe-stem">${hasId(spec) ? `<span class="h-mframe-id">(${esc(String(spec.id))}) </span>` : ""}${inlineBold(spec.text)}</p>`
    : "";

  const body = lines
    .map((line) => {
      const segs = tokenize(line && line.content)
        .map((s) =>
          s.box
            ? `<span class="h-mframe-box"></span>`
            : `<span class="h-mframe-seg">${esc(s.text)}</span>`
        )
        .join("");
      const label =
        labelMm > 0 ? `<span class="h-mframe-label">${esc(labelOf(line))}</span>` : "";
      return `<div class="h-mframe-line">${label}<span class="h-mframe-segs">${segs}</span></div>`;
    })
    .join("");

  const title = spec.title ? `<p class="h-mframe-title">${esc(spec.title)}</p>` : "";

  return `<div class="h-mframe" style="--h-mframe-label:${mm(labelMm)}">${stem}<div class="h-mframe-panel${framed ? " h-mframe-framed" : ""}">${title}${body}</div></div>`;
}

function measureMethodFrame(spec, widthMm) {
  const lines = frameLines(spec);
  const labelMm = labelColumnMm(lines);
  const framed = spec.frame !== false;

  const stemMm = spec.text
    ? linesFor(String(spec.text).replace(/\*\*/g, ""), widthMm) * LINE_MM + 2
    : 0;
  const titleMm = spec.title ? TITLE_LINE_MM + 2 : 0;
  const chromeMm = PANEL_PAD_V_MM * 2 + (framed ? PANEL_BORDER_MM : 0);
  const availMm = widthMm - PANEL_PAD_H_MM * 2 - labelMm;
  const linesMm = lines.reduce((h, l) => h + lineHeightMm(l, availMm, labelMm), 0);

  return stemMm + titleMm + linesMm + chromeMm;
}

const FRAME_MAX_MIN_MM = 240; // a minimum wider than the page can never be met,
                              // so it would make the helper unplaceable

function needsMethodFrame(spec) {
  const lines = frameLines(spec);
  const labelMm = labelColumnMm(lines);
  const widestMm = lines.reduce((w, l) => Math.max(w, lineWidthMm(l)), 0);

  // Wide enough for the longest line to stay on ONE line, because a method
  // step broken across two rows stops reading as one step. Grows with the
  // content in both directions: a longer label or a line with more boxes needs
  // more width, and more lines need more height.
  const minWidthMm = Math.min(FRAME_MAX_MIN_MM, Math.max(70, labelMm + widestMm + PANEL_PAD_H_MM * 2));

  return {
    minWidthMm,
    // Measured at the WIDEST a zone can ever be, not at the minimum width.
    //
    // Text gets SHORTER as it gets wider, so the widest case is the shortest
    // this content can possibly come out, which is exactly what a minimum
    // height has to be: no zone shorter than this can hold it at any width.
    // Measured at the minimum width instead, it stated the TALLEST case, 66mm
    // against the 48mm it actually draws at full width - and a helper that
    // claims to need more room than it uses gets refused from pages it would
    // have sat on happily. It was thrown off its own showcase page that way,
    // which is how this surfaced.
    //
    // Same reasoning, and the same constant, as text.js and frames.js. A zone
    // that is narrower AND too short is still caught, by the measurement that
    // runs on the real width.
    minHeightMm: measureMethodFrame(spec, WIDEST_ZONE_MM),
  };
}

const css = `
  /* the written-method grids */
  .h-mgrid-id {
    margin: 0 0 2mm;
    font-size: var(--type-questionNumber); font-weight: bold;
    color: var(--colour-question);
    line-height: 1.35;
  }
  .h-mgrid { display: flex; flex-direction: column; width: 100%; }
  .h-mgrid-row {
    display: grid;
    grid-template-columns: repeat(var(--h-mgrid-cols), 1fr);
  }
  .h-mgrid-cell {
    aspect-ratio: 1 / 1;
    /* The border must sit INSIDE the square, or every row is fractionally
       taller than the measurement said and the bottom row is quietly sliced
       off by the zone. Half a millimetre a row was enough to cut a visible
       strip off a carry row with nothing reporting a problem. */
    box-sizing: border-box;
    border: var(--rule-line) solid var(--colour-ink);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--type-question); font-weight: bold; color: var(--colour-ink);
  }
  /* The thick rule a child rules under a calculation before writing the
     answer. */
  .h-mgrid-answer .h-mgrid-cell { border-top: var(--rule-heavy) solid var(--colour-ink); }
  .h-mgrid-carry .h-mgrid-cell { aspect-ratio: 2 / 1; border-color: var(--colour-tint); }

  /* The bus stop is drawn with lines rather than boxes: only the roof and the
     wall are ruled. Transparent rather than removed, so the cells stay exactly
     the size the measurement assumes. */
  .h-mgrid-cell.h-mgrid-bare { border-color: transparent; }
  .h-mgrid-cell.h-mgrid-roof { border-bottom: var(--rule-heavy) solid var(--colour-ink); }
  .h-mgrid-cell.h-mgrid-wall { border-right: var(--rule-heavy) solid var(--colour-ink); }

  /* long-division: the working box takes any spare height (greed 2), so it has
     to actually take it, or the extra becomes a hole underneath. The bus stop
     keeps its own size - its cells are square and stretching them would put
     the place value out of line. */
  .h-longdiv { display: flex; flex-direction: column; height: 100%; }
  .h-longdiv .h-mgrid { flex: none; }
  .h-longdiv-working {
    flex: 1;
    min-height: ${WORKING_BOX_MM}mm;
    margin-top: ${WORKING_GAP_MM}mm;
    box-sizing: border-box;
    border: var(--rule-line) solid var(--colour-ink);
  }

  /* method-frame */
  .h-mframe { font-size: var(--type-body); }
  .h-mframe-stem { margin: 0 0 2mm; color: var(--colour-ink); line-height: 1.35; }
  .h-mframe-id { color: var(--colour-ink); font-weight: bold; }
  .h-mframe-panel { padding: ${PANEL_PAD_V_MM}mm ${PANEL_PAD_H_MM}mm; }
  .h-mframe-framed {
    background: var(--colour-tint);
    border: var(--rule-line) solid var(--colour-ink);
    box-sizing: border-box;
  }
  .h-mframe-title {
    margin: 0 0 2mm;
    font-size: var(--type-sectionLabel); font-weight: bold;
    color: var(--colour-question);
    line-height: 1.35;
  }
  .h-mframe-line { display: flex; align-items: flex-start; }
  /* A method label is SCAFFOLD, and scaffold carries no colour of its own: it
     is set apart by weight and by having its own column, exactly as a writing
     frame's sentence-starters are. Daniel settled this. On a worksheet blue
     means the question, orange means material handed to the child, and green
     means vocabulary, so a fourth meaning for "the words that walk you through
     the method" would be a fifth colour the system does not have.
     The slide deck's version of this frame IS green, and that is not an
     inconsistency to fix: green on the board means a revealed answer, which is
     a thing that cannot happen on paper. */
  .h-mframe-label {
    flex: 0 0 auto; width: var(--h-mframe-label);
    padding-top: ${LABEL_PAD_MM}mm;
    font-weight: bold; color: var(--colour-ink);
    line-height: 1.35;
  }
  .h-mframe-segs {
    flex: 1 1 auto;
    display: flex; flex-wrap: wrap; align-items: center;
    column-gap: ${SEG_GAP_MM}mm;
  }
  .h-mframe-seg, .h-mframe-box {
    height: ${BOX_H_MM}mm; margin: ${SEG_MARGIN_MM}mm 0;
    display: flex; align-items: center; justify-content: center;
    box-sizing: border-box;
  }
  .h-mframe-seg { padding: 0 ${SEG_PAD_MM / 2}mm; font-weight: bold; color: var(--colour-ink); }
  .h-mframe-box { width: ${BOX_W_MM}mm; border: var(--rule-line) solid var(--colour-ink); }
`;

const helpers = {
  "short-multiplication-grid": {
    render: renderShortMultiplicationGrid,
    measure: measureShortMultiplicationGrid,
    needs: needsShortMultiplicationGrid,
    // Cells must stay SQUARE for the place value to line up. Extra height
    // without extra width would only stretch them out of square.
    greed: 0,
  },
  "long-multiplication-grid": {
    render: renderLongMultiplicationGrid,
    measure: measureLongMultiplicationGrid,
    needs: needsLongMultiplicationGrid,
    greed: 0,
  },
  "bus-stop-grid": {
    render: renderBusStopGrid,
    measure: measureBusStopGrid,
    needs: needsBusStopGrid,
    greed: 0,
  },
  "long-division-grid": {
    render: renderLongDivisionGrid,
    measure: measureLongDivisionGrid,
    needs: needsLongDivisionGrid,
    // The one grid with somewhere for spare height to go: a taller working box
    // is more room to show the steps, which is a real gain rather than padding.
    greed: 2,
  },
  "method-frame": {
    render: renderMethodFrame,
    measure: measureMethodFrame,
    needs: needsMethodFrame,
    // The boxes are sized for the answer that goes in them. Spare height would
    // only push the steps apart, and a strategy reads as a sequence when its
    // steps sit close together.
    greed: 0,
  },
};

module.exports = { helpers, css };
