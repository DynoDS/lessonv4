"use strict";

// The formal written methods: the taught algorithms a child performs on paper.
//
// Short and long multiplication are the shared place value chart's written
// calculation, the drawing forms.js's column-method-grid prints, so a sheet
// that carries an addition beside a multiplication draws them as one system.
// The two division grids are still ruled here, at the same cell size.
//
// The fifth, method-frame, is the other kind of written method: not an
// algorithm in boxes but a taught mental strategy printed line by line, with
// the blanks the child fills in. It is the same picture the slide builder puts
// on the board, so a child meets one shape in both places.

const { LINE_MM, esc, linesFor } = require("./shared");
const { TYPE, INSET, NUMBER_BOX_MM } = require("../tokens");
const { MM_TO_PT } = require("../../../shared/visuals/surface-profiles");
const { atPrintedWidth } = require("./at-printed-width");
const placeValueChart = require("../../../shared/visuals/place-value-chart-svg");

const PT_TO_MM = 0.3528;

// The printable width of A4 landscape: the widest a zone can ever be, and so
// the width at which a block of text comes out SHORTEST. Same constant, and
// same reason, as text.js and frames.js.
const WIDEST_ZONE_MM = 261;

// ─── shared grid geometry ────────────────────────────────────────────────
// Square digit cells, sized exactly as forms.js sizes a column method. Both
// numbers are repeated rather than imported because a helper file stands on
// its own, but they are one fact: if one moves, the other must move with it.

const GRID_CELL_MIN_MM = 10; // small enough to fit a narrow column, still big
                             // enough for a child's handwritten digit (14 and
                             // 15 until 7 October 2026; see CALC_PAPER_COL_MM
                             // in the shared place value drawing)
const GRID_CELL_MAX_MM = 12; // and a ceiling, because square cells otherwise
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

// ─── short-multiplication-grid and long-multiplication-grid ──────────────
// Both are the shared place value chart's `calculation`, the drawing the
// board and the working wall show and the one column-method-grid has printed
// since 5 October 2026. Until 13 October 2026 these two ruled their own black
// and white grid, so a child who had watched a long multiplication grow row by
// row in coloured columns on the board met a different layout on the page: the
// sheet put the answer's first digit under the multiplication sign, where the
// board gives it a column of its own (stress test, 7 October 2026). The
// sheet's fields are unchanged: top, multiplier or bottom, id.

const WHOLE_COLUMNS = ["M", "HTh", "TTh", "Th", "H", "T", "O"];
const wholeDigits = (value) => {
  const text = String(value ?? "").replace(/[,\s]/g, "");
  return /^\d+$/.test(text) ? text : "";
};

// A column for every digit of the answer, so its first digit is never left to
// be written outside the grid.
function productColumns(top, by) {
  const a = wholeDigits(top);
  const b = wholeDigits(by);
  if (!a || !b) return undefined;
  const digits = Math.max(a.length, b.length, String(BigInt(a) * BigInt(b)).length);
  return digits <= WHOLE_COLUMNS.length ? WHOLE_COLUMNS.slice(-digits) : undefined;
}

function toShortMultiplication(spec) {
  const columns = productColumns(spec.top, spec.multiplier);
  return {
    headings: spec.showHeadings === true,
    ...(columns ? { columns } : {}),
    calculation: { operator: "x", numbers: [spec.top, spec.multiplier] },
  };
}

// `upTo` prints the working as far as a stage ("ones row", "tens zero",
// "tens row"), for a sheet that gives a child the first row and asks for the
// rest. Left out, every row is the child's to write.
function toLongMultiplication(spec) {
  const worksOut = wholeDigits(spec.top) && wholeDigits(spec.bottom).length >= 2;
  return {
    headings: spec.showHeadings === true,
    calculation: {
      operator: "x",
      numbers: [spec.top, spec.bottom],
      ...(worksOut
        ? { upTo: spec.upTo == null ? "set out" : spec.upTo }
        : { partials: Math.max(2, String(spec.bottom ?? "").length) }),
    },
  };
}

// The shared drawing, with the question's number above it and set against the
// left edge under that number, where the old grid sat.
function sharedGrid(toSpec) {
  const drawn = atPrintedWidth(placeValueChart, {
    toSpec,
    minWidthMm: (spec) => Math.ceil(placeValueChart.minWidthPt(toSpec(spec), "worksheets") / MM_TO_PT),
  });
  return {
    ...drawn,
    render: (spec, width) =>
      `<div class="h-method">${idHtml(spec)}${drawn.render(spec, width).replace('class="h-figure"', 'class="h-figure h-mgrid-shared"')}</div>`,
    measure: (spec, width) => idMm(spec) + drawn.measure(spec, width),
    needs: (spec) => {
      const needs = drawn.needs(spec);
      return { minWidthMm: needs.minWidthMm, minHeightMm: idMm(spec) + needs.minHeightMm };
    },
  };
}

const shortMultiplicationGrid = sharedGrid(toShortMultiplication);
const longMultiplicationGrid = sharedGrid(toLongMultiplication);

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

// The one box for one number (tokens.js). It was 11mm by 9mm, the Word
// builder's size, beside 12mm squares elsewhere on the same sheet.
const BOX_W_MM = NUMBER_BOX_MM;
const BOX_H_MM = NUMBER_BOX_MM;
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

// On a question slip (`spec.slip`, set by src/slips.js) each label sits on its
// own line above its boxes instead of in a column beside them. Beside them,
// "Two numbers that make 10:" and its boxes asked for about 130mm, and a slip
// is half a page wide so that it fits an exercise book (Daniel, 29 September
// 2026). The sheet itself keeps the column.
const LABEL_ABOVE_GAP_MM = 1;

function labelsAbove(spec) {
  return spec.slip === true;
}

function labelAboveMm(line, widthMm) {
  const label = labelOf(line).trim();
  if (!label) return 0;
  return linesFor(label, widthMm) * LINE_MM + LABEL_ABOVE_GAP_MM;
}

// A fraction with a part to find is one piece, not a box beside a loose "/6".
//
// A line used to be cut at every blank before anything looked for a fraction,
// so "2/3 = ___/6" printed a stacked 2/3, a box, then "/6" typed on the line:
// the one fraction the child had to finish was the only one not written top
// and bottom (stress test, 12 October 2026). The teacher's choice, from the
// real Year 5 sheet (13 October 2026): the box a child writes in sits on the
// bar, the size of every other box in the frame, with the number under it.
//
// When the whole fraction is missing ("___/___") a younger child gets a box
// over a box with the bar between, and an older one a single tall box (his
// line, the same day: Years 1 to 4 and every Below sheet are younger). The
// sheet says which with `fractionBlank` (src/worksheet.js).
const BLANK_PART = "(?:_{2,}|□)";
const BLANK_FRACTION = new RegExp(
  `(${BLANK_PART})\\s?/\\s?(${BLANK_PART}|\\d{1,3})(?![\\d/]|[.,]\\d)|(?<![\\d/.,])(\\d{1,3})\\s?/\\s?(${BLANK_PART})`,
  "g"
);
const FRAC_BAR_GAP_MM = 0.8; // between the bar and what sits above and below it
const FRAC_BAR_MM = 0.4;
const FRAC_DIGIT_MM = TYPE.body * PT_TO_MM * 1.05; // the room a printed part is given
const FRAC_ONE_BOX_MM = BOX_H_MM + FRAC_BAR_GAP_MM * 2 + FRAC_BAR_MM + FRAC_DIGIT_MM;
const FRAC_TWO_BOX_MM = BOX_H_MM * 2 + FRAC_BAR_GAP_MM * 2 + FRAC_BAR_MM;
const FRAC_TALL_BOX_MM = NUMBER_BOX_MM + 4; // one box a whole fraction is written in
const PUNCT_MM = 2;
const PUNCT_ONLY = /^[,.;:]$/;

function tokenizePlain(content) {
  return String(content == null ? "" : content)
    .split(/(_{2,}|□)/)
    .filter((p) => p !== "")
    .map((p) => (/^(_{2,}|□)$/.test(p) ? { box: true } : { text: p.trim() }))
    .filter((seg) => seg.box || seg.text.length > 0);
}

// `top` and `bottom` are the printed number, or null for the part to write.
function tokenize(content) {
  const source = String(content == null ? "" : content);
  const segs = [];
  let at = 0;
  for (const m of source.matchAll(BLANK_FRACTION)) {
    segs.push(...tokenizePlain(source.slice(at, m.index)));
    const top = m[1] !== undefined ? null : m[3];
    const lower = m[1] !== undefined ? m[2] : m[4];
    // `box` too: a fraction with a part to write is a line the child still
    // has to finish, wherever a line's boxes are counted.
    segs.push({ box: true, frac: { top, bottom: /^\d/.test(lower) ? lower : null } });
    at = m.index + m[0].length;
  }
  segs.push(...tokenizePlain(source.slice(at)));
  return segs;
}

function wholeBlank(seg) {
  return Boolean(seg.frac) && seg.frac.top === null && seg.frac.bottom === null;
}

function segHeightMm(seg, spec) {
  if (!seg.frac) return BOX_H_MM;
  if (!wholeBlank(seg)) return FRAC_ONE_BOX_MM;
  return spec && spec.fractionBlank === "boxes" ? FRAC_TWO_BOX_MM : FRAC_TALL_BOX_MM;
}

// One row of a line: its tallest piece and the margin above and below it.
function rowMm(line, spec) {
  const tallest = tokenize(line && line.content).reduce((h, s) => Math.max(h, segHeightMm(s, spec)), BOX_H_MM);
  return tallest + SEG_MARGIN_MM * 2;
}

function segMm(seg) {
  if (seg.box || seg.frac) return BOX_W_MM;
  if (PUNCT_ONLY.test(seg.text)) return PUNCT_MM;
  return Math.max(SEG_MIN_MM, seg.text.length * SEG_CHAR_MM + SEG_PAD_MM);
}

function lineWidthMm(line) {
  return tokenize(line && line.content).reduce((w, s) => w + segMm(s) + SEG_GAP_MM, 0);
}

// How tall ONE method line comes out at a given width: the segments wrap
// within what the label column leaves them, and the label itself can wrap.
function lineHeightMm(line, availMm, labelMm, spec) {
  const rows = Math.max(1, Math.ceil(lineWidthMm(line) / Math.max(20, availMm)));
  const segsMm = rows * rowMm(line, spec);
  if (labelMm <= 0) return segsMm;
  const labelRows = Math.max(1, Math.ceil((labelOf(line).length * LABEL_CHAR_MM + 3.5) / labelMm));
  return Math.max(segsMm, labelRows * LINE_MM + labelPadMm(line, spec));
}

// The label holds the centre line of its line's first row, however tall a
// fraction makes that row.
function labelPadMm(line, spec) {
  return rowMm(line, spec) / 2 - LINE_MM / 2;
}

function fractionHtml(seg, spec) {
  const box = `<span class="h-mframe-box"></span>`;
  if (wholeBlank(seg) && !(spec && spec.fractionBlank === "boxes")) {
    return `<span class="h-mframe-box h-mframe-box-tall"></span>`;
  }
  const part = (value) => (value === null ? box : `<span class="h-mframe-frac-n">${esc(value)}</span>`);
  return `<span class="h-mframe-frac">${part(seg.frac.top)}<span class="h-mframe-frac-bar"></span>${part(seg.frac.bottom)}</span>`;
}

function inlineBold(text) {
  // Escaped FIRST, so markup in the spec cannot reach the page; ** survives
  // escaping untouched, so the bold pass is safe to run afterwards.
  return esc(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

// A frame shows worked numbers when one of its lines is worked right through:
// its values written out (a number in it) and no box left for the child. A
// line of words alone ("Look at the ones digit.") decides nothing (the
// fourth check). Only a worked line makes the frame a worked
// example, in the worked-example purple (his answer of 25 September 2026); a
// frame whose every line still holds a box is the child's, whatever numbers
// it hands them to start from, and keeps the ink edge and blue heading.
function showsWorkedNumbers(lines) {
  return lines.some((line) => {
    const segs = tokenize(line && line.content);
    return !segs.some((s) => s.box) && segs.some((s) => /\d/.test(s.text));
  });
}

function renderMethodFrame(spec) {
  const lines = frameLines(spec);
  const above = labelsAbove(spec);
  const labelMm = above ? 0 : labelColumnMm(lines);
  const framed = spec.frame !== false;
  const worked = showsWorkedNumbers(lines);

  const stem = spec.text
    ? `<p class="h-mframe-stem">${hasId(spec) ? `<span class="h-mframe-id">(${esc(String(spec.id))}) </span>` : ""}${inlineBold(spec.text)}</p>`
    : "";

  const body = lines
    .map((line) => {
      const segs = tokenize(line && line.content)
        .map((s) =>
          s.frac
            ? fractionHtml(s, spec)
            : s.box
              ? `<span class="h-mframe-box"></span>`
              : PUNCT_ONLY.test(s.text)
                ? `<span class="h-mframe-seg h-mframe-punct">${esc(s.text)}</span>`
                : `<span class="h-mframe-seg">${esc(s.text)}</span>`
        )
        .join("");
      const label =
        labelMm > 0
          ? `<span class="h-mframe-label"${rowMm(line, spec) > SEG_ROW_MM ? ` style="padding-top:${mm(labelPadMm(line, spec))}"` : ""}>${esc(labelOf(line))}</span>`
          : "";
      const labelLine =
        above && labelOf(line).trim()
          ? `<div class="h-mframe-label-above">${esc(labelOf(line))}</div>`
          : "";
      return `${labelLine}<div class="h-mframe-line">${label}<span class="h-mframe-segs">${segs}</span></div>`;
    })
    .join("");

  const title = spec.title ? `<p class="h-mframe-title">${esc(spec.title)}</p>` : "";

  const match = Number.isFinite(spec.matchWidthMm) ? `; --h-mframe-match:${mm(spec.matchWidthMm)}` : "";

  return `<div class="h-mframe" style="--h-mframe-label:${mm(labelMm)}${match}">${stem}<div class="h-mframe-panel${framed ? " h-mframe-framed" : ""}${worked ? " h-mframe-worked" : ""}">${title}${body}</div></div>`;
}

function measureMethodFrame(spec, widthMm) {
  const lines = frameLines(spec);
  const above = labelsAbove(spec);
  const labelMm = above ? 0 : labelColumnMm(lines);
  const framed = spec.frame !== false;

  const stemMm = spec.text
    ? linesFor(String(spec.text).replace(/\*\*/g, ""), widthMm) * LINE_MM + 2
    : 0;
  const titleMm = spec.title ? TITLE_LINE_MM + 2 : 0;
  const chromeMm = PANEL_PAD_V_MM * 2 + (framed ? PANEL_BORDER_MM : 0);
  const availMm = widthMm - PANEL_PAD_H_MM * 2 - labelMm;
  const linesMm = lines.reduce(
    (h, l) => h + lineHeightMm(l, availMm, labelMm, spec) + (above ? labelAboveMm(l, availMm) : 0),
    0
  );

  return stemMm + titleMm + linesMm + chromeMm;
}

// How wide a frame's panel is when it hugs its lines: the label column, the
// longest line and the panel's own inset. The sheet uses it to give the frames
// of one question's parts the same width (src/worksheet.js).
function frameContentWidthMm(spec) {
  const lines = frameLines(spec);
  const widestMm = lines.reduce((w, l) => Math.max(w, lineWidthMm(l)), 0);
  const labelMm = labelsAbove(spec)
    ? 0
    : labelColumnMm(lines);
  return Math.round((labelMm + widestMm + PANEL_PAD_H_MM * 2) * 10) / 10;
}

const FRAME_MAX_MIN_MM = 240; // a minimum wider than the page can never be met,
                              // so it would make the helper unplaceable

function needsMethodFrame(spec) {
  const lines = frameLines(spec);
  const widestMm = lines.reduce((w, l) => Math.max(w, lineWidthMm(l)), 0);

  if (labelsAbove(spec)) {
    // Labels above: as wide as the longer of a label on one line and the
    // longest line of boxes, so neither wraps.
    const longestLabelMm = lines.reduce(
      (w, l) => Math.max(w, labelOf(l).trim().length * LABEL_CHAR_MM),
      0
    );
    return {
      minWidthMm: Math.min(FRAME_MAX_MIN_MM, Math.max(40, longestLabelMm, widestMm) + PANEL_PAD_H_MM * 2),
      minHeightMm: measureMethodFrame(spec, WIDEST_ZONE_MM),
    };
  }

  const labelMm = labelColumnMm(lines);

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
  /* a multiplication grid drawn by the shared drawing: at the left, under its number */
  .h-figure.h-mgrid-shared { justify-content: flex-start; }
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
  /* The carry row: shallow, and ruled in dashes. It was ruled in the panel
     tint, which is nearly white, so it barely printed and vanished on a
     photocopier (stress test, 7 October 2026). The teacher chose dashes from
     pictures of the real long multiplication sheet (10 October 2026): they
     print, and still read as the small row for carried digits rather than as
     another row of the answer. Shallow is his ruling of 5 October. */
  .h-mgrid-carry .h-mgrid-cell { aspect-ratio: 2 / 1; border: var(--rule-line) dashed var(--colour-quiet); }

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
  /* The frame's question label, in the question blue every other label on the
     sheet uses. */
  .h-mframe-id {
    color: var(--colour-question); font-weight: bold;
    font-size: var(--type-questionNumber);
  }
  /* The panel is only as wide as its longest line, at the left under its
     question, as the board's frame hugs its lines. It filled its column, so a
     frame of short lines was half empty tint (a Year 5 sheet: 110mm of frame
     round 55mm of lines; stress test, 12 October 2026). Frames of one
     question's parts share the widest one's width (--h-mframe-match). */
  .h-mframe-panel {
    box-sizing: border-box;
    width: fit-content; max-width: 100%;
    min-width: min(var(--h-mframe-match, 0mm), 100%);
    padding: ${PANEL_PAD_V_MM}mm ${PANEL_PAD_H_MM}mm;
  }
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
  /* A frame that shows worked numbers is a worked example: its edge and title
     take the worked-example purple, as the board's frame does. */
  .h-mframe-framed.h-mframe-worked { border-color: var(--colour-worked); }
  .h-mframe-worked .h-mframe-title { color: var(--colour-worked); }
  .h-mframe-line { display: flex; align-items: flex-start; }
  /* A slip's label, on its own line above its boxes (labelsAbove). */
  .h-mframe-label-above {
    margin-top: ${LABEL_ABOVE_GAP_MM}mm;
    font-weight: bold; color: var(--colour-ink);
    line-height: 1.35;
  }
  /* A method label is SCAFFOLD, and scaffold carries no colour of its own: it
     is set apart by weight and by having its own column, exactly as a writing
     frame's sentence-starters are. Daniel settled this. On a worksheet blue
     means the question, orange means material handed to the child, green
     means vocabulary and purple frames a worked example, so another meaning
     for "the words that walk you through the method" would be one colour more
     than the system has. The frame's own edge and title are the worked-example
     purple when the frame shows worked numbers, as the board's is (the
     teacher's rule of 24 September 2026); an empty frame, the child's to fill,
     keeps its ink edge and question-blue heading (his answer of 25 September). */
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
  /* A fraction with a part to write: the box sits on the bar. */
  .h-mframe-frac {
    display: inline-flex; flex-direction: column; align-items: center;
    margin: ${SEG_MARGIN_MM}mm 0; font-weight: bold; color: var(--colour-ink);
  }
  .h-mframe-frac .h-mframe-box { margin: 0; }
  .h-mframe-frac-bar {
    align-self: stretch; height: ${FRAC_BAR_MM}mm; margin: ${FRAC_BAR_GAP_MM}mm 0;
    background: var(--colour-ink);
  }
  /* The sheet's own line height, in a slot only as tall as the digits. */
  .h-mframe-frac-n {
    height: ${mm(FRAC_DIGIT_MM)}; line-height: 1.35;
    display: flex; align-items: center;
  }
  .h-mframe-box-tall { height: ${FRAC_TALL_BOX_MM}mm; }
  .h-mframe-punct { padding: 0; margin-left: -${SEG_GAP_MM}mm; width: ${PUNCT_MM}mm; }
`;

const helpers = {
  // Cells stay SQUARE for the place value to line up, so neither takes spare
  // height: extra height without extra width would only pull them out of square.
  "short-multiplication-grid": shortMultiplicationGrid,
  "long-multiplication-grid": longMultiplicationGrid,
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

module.exports = { helpers, css, frameContentWidthMm };
