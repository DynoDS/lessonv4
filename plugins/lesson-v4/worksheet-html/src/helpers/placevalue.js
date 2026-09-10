"use strict";

// Place value, and the two missing-number puzzles that live beside it.
//
// Five helpers, and they split into two jobs. The first three are place value
// itself: counters in columns, an empty chart to write digits into, a row of
// digit cards. The last two are the recurring SATs reasoning shapes, a
// times-table facts grid and an addition pyramid, where the empty box IS the
// question and the child has to decide which operation fills it.
//
// Every one of them is a grid of cells a child writes a number into, so they
// share one lesson, learned the hard way by column-method-grid next door: a
// cell that scales with whatever width it is handed becomes a digit box the
// size of a matchbox on a wide page. Each of these therefore states a FLOOR
// (small enough to fit, still big enough for a nine-year-old's handwriting)
// and a CEILING (past which extra width is left alone rather than poured into
// the cells), and every one of them has greed 0.
//
// Ported from the Word builder's helpers.js. The Word names end in `-row`
// (`place-value-chart-row`, `digit-cards-row`); here they do not, because a
// helper in this engine does not know what row it sits in.

const { LINE_MM, NOTE_LINE_MM, PT_MM, BODY_PT, esc, linesFor } = require("./shared");
const { TYPE, INSET, RULE, SPACE } = require("../tokens");

// A label set at note size, measured the way shared.js measures body text: a
// note character is note/body of a body character, so a note-size label fits
// the same line count as body text in a proportionally wider column. Reusing
// linesFor keeps ONE character-width constant in the engine rather than a
// second copy here that could drift from it.
function noteLinesFor(text, widthMm) {
  return linesFor(text, widthMm * (BODY_PT / TYPE.note));
}

// ─── place-value-counter-chart ───────────────────────────────────────────
// Coloured counters sitting in place-value columns: "what number is shown?",
// or, left empty, "draw counters to show this number".
//
// The counter colours are the one place in this engine where colour is
// CONTENT rather than design. A child meets these discs as physical objects
// in a maths lesson (purple thousands, blue hundreds, red tens and ones,
// amber tenths, green hundredths), and a sheet that recoloured them into the
// worksheet's own blue/orange/black scheme would be showing a different
// manipulative from the one on the table. They are declared once, by name, in
// the CSS below, and no hex ever reaches the markup.

const PLACES = {
  thousands: { label: "Thousands", counter: "1000" },
  hundreds: { label: "Hundreds", counter: "100" },
  tens: { label: "Tens", counter: "10" },
  ones: { label: "Ones", counter: "1" },
  tenths: { label: "Tenths", counter: "0.1" },
  hundredths: { label: "Hundredths", counter: "0.01" },
};

// Two decimal places is as fine as a millimetre needs to be written.
function f2(n) {
  return Number(n.toFixed(2));
}

const COUNTER_MM = 9; // a disc holding "0.01" at note size, the smallest type
                      // the design system allows
const COUNTER_GAP_MM = 1.5;
const COUNTERS_PER_ROW = 3;
// A cell in a chart, so the cell inset. It used to be a flat 1.5mm both ways,
// while the place value CHART below used 1.4mm for the same cell in the same
// family: nobody chose either number.
const PVC_PAD_V_MM = INSET.cell.v;
const PVC_PAD_H_MM = INSET.cell.h;
const PVC_POINT_COL_MM = 6; // the decimal point's own narrow column

// Three discs, their gaps, the cell's padding, and the cell's own border on
// both sides. The border is not slack to be guessed at: the cell is
// box-sizing: border-box, so a 0.4mm rule on each side takes 0.8mm out of the
// content box. A half-millimetre allowance did not cover it, three discs no
// longer fitted, and nine tens wrapped two-per-row over five rows and spilled
// out of a chart measured for three.
const PVC_BORDER_MM = 2 * RULE.line;
const PVC_VALUE_COL_MM =
  COUNTERS_PER_ROW * COUNTER_MM +
  (COUNTERS_PER_ROW - 1) * COUNTER_GAP_MM +
  2 * PVC_PAD_H_MM +
  PVC_BORDER_MM;

function pvcColumns(spec) {
  return spec.columns || [];
}

function pvcColumnWidthMm(column) {
  return column === "." ? PVC_POINT_COL_MM : PVC_VALUE_COL_MM;
}

// This chart does not stretch. A counter is a fixed object at a fixed size,
// so the chart's width follows from how many columns it has, and a zone too
// narrow for it is refused by `needs` rather than quietly squashing the discs.
function pvcWidthMm(spec) {
  return pvcColumns(spec).reduce((total, c) => total + pvcColumnWidthMm(c), 0);
}

function pvcHeaderMm(spec) {
  const lines = pvcColumns(spec).reduce((most, column) => {
    if (column === ".") return most;
    const label = PLACES[column] ? PLACES[column].label : String(column);
    return Math.max(most, noteLinesFor(label, PVC_VALUE_COL_MM - 2 * PVC_PAD_H_MM));
  }, 1);
  return lines * NOTE_LINE_MM + 2 * PVC_PAD_V_MM;
}

function pvcCounterRows(spec) {
  const counts = spec.counts || {};
  const most = pvcColumns(spec).reduce(
    (max, c) => (c === "." ? max : Math.max(max, Number(counts[c] || 0))),
    0
  );
  const rows = Math.ceil(most / COUNTERS_PER_ROW);
  // No counts at all is the "draw counters to show this number" task, where
  // the body of the chart IS the working space. Word gave that case a single
  // empty row, which is a chart a child cannot answer in; three rows holds the
  // nine counters a single column ever needs.
  return rows === 0 ? 3 : rows;
}

function pvcBodyMm(spec) {
  const rows = pvcCounterRows(spec);
  return (
    rows * COUNTER_MM +
    (rows - 1) * COUNTER_GAP_MM +
    2 * PVC_PAD_V_MM +
    PVC_BORDER_MM
  );
}

function renderPlaceValueCounterChart(spec) {
  const counts = spec.counts || {};
  const columns = pvcColumns(spec);

  // Only a column this engine has a counter colour for gets the colour class;
  // anything else falls back to the neutral defaults set on `.h-pvc`, so an
  // unfamiliar place name still draws a readable chart.
  const colourClass = (column) => (PLACES[column] ? ` h-pvc-${column}` : "");

  const cells = (kind) =>
    columns
      .map((column) => {
        const width = pvcColumnWidthMm(column);
        const open = (extra, inner) =>
          `<div class="h-pvc-cell h-pvc-${kind}-cell${extra}" style="width:${width}mm">${inner}</div>`;

        if (column === ".") {
          return open(" h-pvc-point", kind === "body" ? "." : "");
        }
        if (kind === "head") {
          const label = PLACES[column] ? PLACES[column].label : String(column);
          return open(colourClass(column), esc(label));
        }
        const face = PLACES[column] ? PLACES[column].counter : String(column);
        const discs = Array.from(
          { length: Number(counts[column] || 0) },
          () => `<span class="h-pvc-counter">${esc(face)}</span>`
        ).join("");
        return open(colourClass(column), discs);
      })
      .join("");

  const headCells = cells("head");
  const bodyCells = cells("body");

  // Both heights are written into the markup from the same functions the
  // measurement uses, so the chart that is drawn and the height it was
  // promised cannot disagree.
  return `
    <div class="h-pvc" style="width:${pvcWidthMm(spec)}mm">
      <div class="h-pvc-row" style="height:${pvcHeaderMm(spec)}mm">${headCells}</div>
      <div class="h-pvc-row" style="height:${pvcBodyMm(spec)}mm">${bodyCells}</div>
    </div>`;
}

function measurePlaceValueCounterChart(spec) {
  // Plus a millimetre, because the outer borders of a chart this size round
  // up by a fraction and a chart that measures short is a chart with its
  // bottom row of counters shaved off.
  return pvcHeaderMm(spec) + pvcBodyMm(spec) + 1;
}

function needsPlaceValueCounterChart(spec) {
  return {
    // A six-column chart is genuinely twice the object a three-column one is.
    // This is wide: a four-column chart wants most of a portrait page. That
    // is the truth about counters big enough to see, not a limitation worth
    // hiding by shrinking them.
    minWidthMm: pvcWidthMm(spec),
    minHeightMm: measurePlaceValueCounterChart(spec),
  };
}

// ─── counter-group ───────────────────────────────────────────────────────
// The counters on their own: a compact group of one denomination, several
// groups joined by an operator, under the claim they depict.
//
// The chart above is the right object when the COLUMNS are the teaching. It is
// the wrong object when two claims have to sit side by side and be compared,
// because a four-column chart is most of a portrait page's width and two of
// them are two pages. What that comparison needs is the discs themselves, at
// the size a child can read them, and nothing else.
//
// The discs are the same discs, in the same colours, drawn from the same PLACES
// table, so the counters a child meets in a chart on one sheet are the counters
// they meet in a group on the next.
//
// It draws exactly the groups it is given and nothing else. There is no field
// for a total, no field for a verdict, and no arithmetic anywhere in it: a
// helper that could work out whether the claim were true would sooner or later
// print the answer beside the question asking for it.

const CG_GROUP_GAP_MM = SPACE.item;
const CG_OP_MM = 6; // the operator's own column between two groups
const CG_STATEMENT_PAD_MM = INSET.card.v;

// A counter here is sized by the number on its face, not by the widest number
// any counter could carry.
//
// The chart above uses one square cell for every denomination, because its
// columns have to line up. These do not: they are separate groups sitting side
// by side, and a counter reading "1" drawn as wide as one reading "0.01" makes
// a group of nine ones three rows of enormous discs. The chart's 9mm square is
// the right answer there and the wrong answer here, and copying it cost the
// reference sheet's reasoning block half as much page again as it needed.
//
// Height is one line of note text with a cell's padding: the smallest the
// design system lets any label print, which is what a counter's face is.
const CG_COUNTER_H_MM = TYPE.note * PT_MM * 1.35 + 2 * INSET.cell.v;
const CG_FACE_CHAR_MM = TYPE.note * PT_MM * 0.5; // tracks CHAR_WIDTH_FACTOR
const CG_COUNTER_GAP_MM = COUNTER_GAP_MM;

function counterWidthMm(face) {
  return Math.max(
    CG_COUNTER_H_MM,
    String(face).length * CG_FACE_CHAR_MM + 2 * INSET.cell.h
  );
}

// The counter face a denomination shows, and the colour class that goes with
// it, both looked up in the one PLACES table the chart already uses.
const COUNTER_PLACES = Object.fromEntries(
  Object.entries(PLACES).map(([place, def]) => [def.counter, place])
);

function counterGroups(spec) {
  const groups = spec.groups;
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error("counter-group: `groups` must list at least one group of counters");
  }
  return groups.map((group, i) => {
    const face = String(group.value ?? "").trim();
    if (!face) {
      throw new Error(`counter-group: group ${i + 1} has no \`value\` (the number on the counter)`);
    }
    const count = Number(group.count);
    if (!Number.isInteger(count) || count < 1 || count > 20) {
      throw new Error(
        `counter-group: group ${i + 1} needs a \`count\` from 1 to 20. ` +
          "The count is the evidence; it is not something to infer."
      );
    }
    return { face, count, place: COUNTER_PLACES[face] || null };
  });
}

function counterGroupWidthMm(group) {
  const perRow = Math.min(COUNTERS_PER_ROW, group.count);
  return perRow * counterWidthMm(group.face) + (perRow - 1) * CG_COUNTER_GAP_MM;
}

function counterGroupHeightMm(group) {
  const rows = Math.ceil(group.count / COUNTERS_PER_ROW);
  return rows * CG_COUNTER_H_MM + (rows - 1) * CG_COUNTER_GAP_MM;
}

function counterGroupRowMm(spec) {
  const groups = counterGroups(spec);
  const joiner = spec.joiner != null && spec.joiner !== "" ? String(spec.joiner) : null;
  return (
    groups.reduce((w, g) => w + counterGroupWidthMm(g), 0) +
    Math.max(0, groups.length - 1) * (2 * CG_GROUP_GAP_MM + (joiner ? CG_OP_MM : 0))
  );
}

function counterGroupStatementMm(spec, widthMm) {
  if (!spec.statement) return 0;
  const inner = Math.max(20, widthMm - 2 * INSET.card.h);
  const lines = Math.max(
    1,
    Math.ceil(
      noteLinesFor(String(spec.statement), inner * (TYPE.note / TYPE.sectionLabel))
    )
  );
  return lines * (TYPE.sectionLabel * PT_MM * 1.35) + 2 * CG_STATEMENT_PAD_MM;
}

function renderCounterGroup(spec) {
  const groups = counterGroups(spec);
  const joiner = spec.joiner != null && spec.joiner !== "" ? String(spec.joiner) : null;

  const drawn = groups
    .map((group) => {
      const discs = Array.from(
        { length: group.count },
        () =>
          `<span class="h-cg-counter" style="width:${f2(counterWidthMm(group.face))}mm">` +
          `${esc(group.face)}</span>`
      ).join("");
      const colour = group.place ? ` h-pvc-${group.place}` : "";
      return (
        `<span class="h-cg-group${colour}" style="width:${f2(counterGroupWidthMm(group))}mm">` +
        discs +
        `</span>`
      );
    })
    .join(joiner ? `<span class="h-cg-op">${esc(joiner)}</span>` : `<span class="h-cg-op"></span>`);

  // The claim sits with the evidence for it. Splitting the two across separate
  // helpers is how a page ends up with a row of counters and no way to tell
  // which of two claims they belong to.
  const statement = spec.statement
    ? `<div class="h-cg-statement">${esc(spec.statement)}</div>`
    : "";

  return `<div class="h-cg">${statement}<div class="h-cg-row">${drawn}</div></div>`;
}

function measureCounterGroup(spec, widthMm) {
  const groups = counterGroups(spec);
  const tallest = groups.reduce((m, g) => Math.max(m, counterGroupHeightMm(g)), 0);
  return counterGroupStatementMm(spec, widthMm) + tallest + SPACE.tight;
}

function needsCounterGroup(spec) {
  // The discs are a fixed size, because a counter a child cannot read the face
  // of is not a counter. So the row's width is the truth about how much page
  // this evidence costs, not a starting point to shrink from.
  const minWidthMm = counterGroupRowMm(spec);
  return {
    minWidthMm,
    minHeightMm: measureCounterGroup(spec, minWidthMm),
  };
}

// ─── place-value-chart ───────────────────────────────────────────────────
// The chart the child writes digits into: a header row of place names and one
// or more rows beneath. `instances` puts several side by side on one row, for
// "write each of these three numbers into a chart".
//
// Two optional fields carry the teaching a bare grid cannot:
//
//   rows       one entry per row, so a chart can hand the child a number to
//              work FROM as well as an empty row to write IN. A row is
//              { label, cells, highlight }, and any of the three may be left
//              out. With no `rows` at all the chart is the single empty row it
//              has always been.
//   label      a short caption in a column at the left of a row, naming what
//              the row is ("3,462", "10 more", "100 more"). Three charts with
//              no labels are three grids of digits with nothing saying how
//              they relate.
//   highlight  which cell(s) of the row to pick out, named by their column.
//              In a "find 10 and 100 more" lesson, WHICH column changed is the
//              entire content of the lesson, so a chart that cannot mark one
//              digit cannot show the thing being taught.
//
// The highlight is drawn in the question blue, not a colour of its own. Blue
// already means "the focus" on this sheet, and that is exactly what a picked-
// out digit is; a fifth meaning would be a fifth thing for a child to learn.
// The highlighted cell keeps its place in the grid and gains a heavy ring, so
// the column coding of the chart still reads.
//
// (The Word builder calls this `place-value-chart-row`.)

const PVCHART_WRITE_MM = 16; // matches the Word chart's 900 DXA body row: a
                             // row a child writes a digit into, not a row that
                             // merely holds one
const PVCHART_GIVEN_MM = 10; // a row whose digits are all PRINTED is a row the
                             // child reads, not writes in, so it needs the
                             // height of a line of type and no more. Giving it
                             // the write row's 16mm would spend 6mm a row on
                             // white space, and a three-row chart would claim
                             // most of a column for nothing.
const PVCHART_PAD_V_MM = INSET.cell.v;
const PVCHART_PAD_H_MM = INSET.cell.h;
const PVCHART_GAP_MM = 6; // between charts, so two charts' borders never touch
const PVCHART_COL_MIN_MM = 14; // one handwritten digit, comfortably
const PVCHART_COL_MAX_MM = 24; // and the ceiling: a digit column wider than
                               // this is not easier to write in, it is just
                               // emptier, and on a full-width row three
                               // charts' worth of columns would each have
                               // taken 45mm
const PVCHART_POINT_WEIGHT = 0.6; // the decimal point needs less room than a
                                  // digit, as in the Word chart
const PVCHART_LABEL_WEIGHT = 1.8; // the row-label column, priced in digit
                                  // columns. Fixed rather than measured from
                                  // the longest label, so several charts side
                                  // by side keep their grids in register
                                  // instead of each sizing its own caption
                                  // column and stepping out of line.

function pvchartColumns(spec) {
  return spec.columns || [];
}

// A row is { label, cells, highlight }; a bare array is accepted as its cells,
// which is the shortest way to write the common "just the digits" row.
function pvchartRows(spec) {
  const rows = Array.isArray(spec.rows) ? spec.rows : null;
  // No rows at all is the chart this helper has always drawn: one empty row for
  // the child to write the whole number into.
  if (!rows || rows.length === 0) return [{ label: "", cells: [], highlight: [] }];
  return rows.map((row) => {
    if (Array.isArray(row)) return { label: "", cells: row, highlight: [] };
    if (!row || typeof row !== "object") return { label: "", cells: [], highlight: [] };
    const highlight =
      row.highlight == null ? [] : Array.isArray(row.highlight) ? row.highlight : [row.highlight];
    return {
      label: row.label == null ? "" : String(row.label),
      cells: Array.isArray(row.cells) ? row.cells : [],
      highlight,
    };
  });
}

function pvchartHasLabels(spec) {
  return pvchartRows(spec).some((r) => r.label !== "");
}

// A highlight names cells by their COLUMN, because that is how the lesson talks
// about them ("the tens digit changed"), and a chart never repeats a column so
// a name is unambiguous. A bare index works too.
function pvchartPicked(row, columns) {
  const picked = new Set();
  row.highlight.forEach((h) => {
    if (typeof h === "number" && Number.isInteger(h)) {
      if (h >= 0 && h < columns.length) picked.add(h);
      return;
    }
    const at = columns.indexOf(String(h));
    if (at !== -1) picked.add(at);
  });
  return picked;
}

// A row with every cell printed is read; a row with any cell left empty is the
// one the child writes in, and it needs the taller write height.
function pvchartRowIsWritten(row, columns) {
  return columns.some(
    (c, i) => c !== "." && (row.cells[i] == null || String(row.cells[i]) === "")
  );
}

// The column weights, one per place-value column and in the same order, so an
// index into `columns` indexes these too. The label column is priced separately
// below rather than pushed onto the front of this, because a weights array that
// no longer lines up with `columns` is exactly the sort of quiet off-by-one that
// puts "Hundredths" in the tens column.
function pvchartWeights(spec) {
  return pvchartColumns(spec).map((c) => (c === "." ? PVCHART_POINT_WEIGHT : 1));
}

// The chart's column tracks, written once for the whole chart.
//
// One set of tracks for every row is the entire point, and it is what the
// helper did not have. Each row used to be its own flex container with the
// weights on the cells, which looks equivalent and is not: a flex item sized
// from a zero basis still cannot be narrower than its own padding and border,
// so the fixed part of every cell is subtracted BEFORE the weights divide what
// is left. A header cell is padded and a digit cell is not, and a highlighted
// cell carries the heavy rule rather than the light one - so three rows of
// identical weights came out 156/94/94, 170/87/87 and 168/90/86 millimetres,
// and the labelled chart on the Below sheet printed visibly crooked. Nothing
// objected, because every row was correct on its own terms.
//
// minmax(0, Nfr) rather than a bare Nfr: a bare fr track will not shrink below
// its own content, so a long label would widen the caption column and take the
// digit columns with it - the same crookedness through a different door. The
// content wraps instead, which is what the measurement above already assumes.
function pvchartTemplate(spec) {
  const labelWeight = pvchartLabelWeight(spec);
  const tracks = labelWeight ? [labelWeight, ...pvchartWeights(spec)] : pvchartWeights(spec);
  return tracks.map((w) => `minmax(0, ${w}fr)`).join(" ");
}

function pvchartLabelWeight(spec) {
  return pvchartHasLabels(spec) ? PVCHART_LABEL_WEIGHT : 0;
}

function pvchartWeightTotal(spec) {
  return pvchartWeights(spec).reduce((a, b) => a + b, 0) + pvchartLabelWeight(spec);
}

function pvchartInstances(spec) {
  return Math.max(1, spec.instances || 1);
}

function pvchartSpanMm(spec, perColumnMm) {
  const instances = pvchartInstances(spec);
  return (
    instances * pvchartWeightTotal(spec) * perColumnMm + (instances - 1) * PVCHART_GAP_MM
  );
}

// The width the charts actually occupy: what the zone offers, capped.
function pvchartUsedWidthMm(spec, widthMm) {
  return Math.min(widthMm, pvchartSpanMm(spec, PVCHART_COL_MAX_MM));
}

// One chart's width at the given zone width, which is what every column
// measurement below is worked out from.
function pvchartOneChartMm(spec, widthMm) {
  const instances = pvchartInstances(spec);
  return (pvchartUsedWidthMm(spec, widthMm) - (instances - 1) * PVCHART_GAP_MM) / instances;
}

function pvchartColumnMm(spec, widthMm, weight) {
  return (pvchartOneChartMm(spec, widthMm) * weight) / pvchartWeightTotal(spec);
}

function pvchartHeaderMm(spec, widthMm) {
  const weights = pvchartWeights(spec);

  // A header wraps, and "Hundredths" in a narrow column is two lines. Counting
  // them is the difference between a chart that fits and a chart whose write
  // row is sliced off, so the count comes from the column's real width.
  const lines = pvchartColumns(spec).reduce((most, label, i) => {
    const colMm = pvchartColumnMm(spec, widthMm, weights[i]);
    return Math.max(most, noteLinesFor(label, Math.max(4, colMm - 2 * PVCHART_PAD_H_MM)));
  }, 1);
  return lines * NOTE_LINE_MM + 2 * PVCHART_PAD_V_MM;
}

// A row is as tall as whichever needs more room: the cells, or a label that
// wrapped. "100 more" fits one line in the label column at every width this
// chart is allowed; a longer caption does not, and a row measured without
// counting its second line is a row with its bottom border through the text.
function pvchartRowMm(spec, widthMm, row) {
  const columns = pvchartColumns(spec);
  const cellsMm = pvchartRowIsWritten(row, columns) ? PVCHART_WRITE_MM : PVCHART_GIVEN_MM;
  if (row.label === "") return cellsMm;
  const labelColMm = pvchartColumnMm(spec, widthMm, pvchartLabelWeight(spec));
  const labelMm =
    linesFor(row.label, Math.max(4, labelColMm - 2 * PVCHART_PAD_H_MM)) * LINE_MM +
    2 * PVCHART_PAD_V_MM;
  return Math.max(cellsMm, labelMm);
}

function renderPlaceValueChart(spec) {
  const columns = pvchartColumns(spec);
  const rows = pvchartRows(spec);
  const hasLabels = pvchartHasLabels(spec);

  // The cell above the labels stays blank: the labels name rows, not a column,
  // and a heading over them would promise a heading that is not there.
  const headLabelCell = hasLabels
    ? `<div class="h-pvchart-cell h-pvchart-label-cell"></div>`
    : "";

  const head =
    headLabelCell +
    columns
      .map(
        (label) =>
          `<div class="h-pvchart-cell h-pvchart-head-cell">${esc(label)}</div>`
      )
      .join("");

  const bodyRows = rows
    .map((row) => {
      const picked = pvchartPicked(row, columns);
      // The decimal point belongs to a number, so it prints in a row that HAS
      // one and stays blank in a row that does not. An empty chart therefore
      // draws exactly as it always has: an empty narrow column the child's own
      // number will need.
      const rowHasDigits = columns.some(
        (c, i) => c !== "." && row.cells[i] != null && String(row.cells[i]) !== ""
      );
      const labelCell = hasLabels
        ? `<div class="h-pvchart-cell h-pvchart-label-cell">${esc(row.label)}</div>`
        : "";
      const cells = columns
        .map((column, i) => {
          const value = row.cells[i] == null ? "" : String(row.cells[i]);
          const text = column === "." ? (rowHasDigits ? "." : "") : value;
          const classes = [
            "h-pvchart-cell",
            text === "" ? "h-pvchart-write" : "h-pvchart-given",
            picked.has(i) ? "h-pvchart-picked" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return `<div class="${classes}">${esc(text)}</div>`;
        })
        .join("");
      // No height on the row. The cells carry a MINIMUM height in the CSS and
      // the row grows past it if a label wraps, so the drawn row can never be
      // shorter than its own text - which a height computed here from a width
      // this function does not know could easily be.
      return `<div class="h-pvchart-row">${labelCell}${cells}</div>`;
    })
    .join("");

  const template = pvchartTemplate(spec);
  const charts = Array.from(
    { length: pvchartInstances(spec) },
    () => `
      <div class="h-pvchart-one" style="grid-template-columns:${template}">
        <div class="h-pvchart-row">${head}</div>
        ${bodyRows}
      </div>`
  ).join("");

  // The ceiling is applied to the drawn chart as well as to the measurement,
  // so a wide zone leaves the spare width beside the charts instead of
  // inflating every digit column into it.
  return `
    <div class="h-pvchart" style="max-width:${pvchartSpanMm(spec, PVCHART_COL_MAX_MM)}mm">${charts}</div>`;
}

function measurePlaceValueChart(spec, widthMm) {
  const body = pvchartRows(spec).reduce(
    (total, row) => total + pvchartRowMm(spec, widthMm, row),
    0
  );
  return pvchartHeaderMm(spec, widthMm) + body + 1;
}

function needsPlaceValueChart(spec, widthMm) {
  const minWidthMm = pvchartSpanMm(spec, PVCHART_COL_MIN_MM);
  return {
    // Three charts side by side need three charts' worth of width, a chart with
    // a hundredths column needs more than one without, and a chart with row
    // labels needs the caption column as well: a constant per helper cannot
    // know any of the three.
    minWidthMm,
    // Planning without a width still gets a usable minimum-size box. During
    // fitting, measure at the actual width: wider headings can unwrap without
    // shortening the writing rows or making the chart unusable.
    minHeightMm: measurePlaceValueChart(spec,
      Number.isFinite(widthMm) ? Math.max(minWidthMm, widthMm) : minWidthMm),
  };
}

// ─── digit-cards ─────────────────────────────────────────────────────────
// "Here are four digit cards." A row of cards, one digit each. The digits are
// material handed to the child, so they carry the given colour, the same as a
// value in a data table.
//
// (The Word builder calls this `digit-cards-row`.)

const CARD_W_MM = 14;
const CARD_H_MM = 12;
const CARD_GAP_MM = 2;

function digitCardsList(spec) {
  return spec.digits || [];
}

function renderDigitCards(spec) {
  const cards = digitCardsList(spec)
    .map((d) => `<span class="h-digitcard">${esc(d)}</span>`)
    .join("");
  return `<div class="h-digitcards">${cards}</div>`;
}

function measureDigitCards() {
  return CARD_H_MM + 1;
}

function needsDigitCards(spec) {
  const count = Math.max(1, digitCardsList(spec).length);
  return {
    // Six cards need more of the row than four do. The cards do not wrap,
    // since a set of digit cards reads as one set, so the width has to be
    // real.
    minWidthMm: count * CARD_W_MM + (count - 1) * CARD_GAP_MM,
    minHeightMm: CARD_H_MM + 1,
  };
}

// ─── times-table-grid ────────────────────────────────────────────────────
// The multiplication-facts grid: an operator corner, headers across the top
// and down the side, products in the body. A blank product is found by
// multiplying the two headers; a blank HEADER is found by dividing a product
// by the known factor, which is the harder, inverse-reasoning variant.
//
// Not to be confused with short-/long-multiplication-grid in forms.js: those
// are the written column algorithm. Here the child is reasoning with facts.

const TT_CELL_MIN_MM = 12; // a two-digit product in a child's handwriting
const TT_CELL_MAX_MM = 16; // and the ceiling, for the same reason
                           // column-method-grid has one: a facts grid does not
                           // read better bigger, it just eats the page
const TT_ROW_RATIO = 0.82; // the Word grid's own row height, cellW * 0.82:
                           // slightly wider than tall, because "144" needs the
                           // width and the row does not need the height

function ttColHeaders(spec) {
  return spec.colHeaders || [];
}

function ttRowHeaders(spec) {
  return spec.rowHeaders || [];
}

function ttGeometry(spec) {
  return {
    cols: ttColHeaders(spec).length + 1, // + the corner
    rows: ttRowHeaders(spec).length + 1, // + the header row
  };
}

function ttCellMm(spec, widthMm) {
  const { cols } = ttGeometry(spec);
  return Math.min(widthMm / cols, TT_CELL_MAX_MM);
}

function renderTimesTableGrid(spec) {
  const operator = spec.operator || "×";
  const colHeaders = ttColHeaders(spec);
  const rowHeaders = ttRowHeaders(spec);
  const cells = spec.cells || [];
  const { cols } = ttGeometry(spec);

  const headRow = `<div class="h-ttgrid-row">
      <div class="h-ttgrid-cell h-ttgrid-corner">${esc(operator)}</div>
      ${colHeaders.map((h) => `<div class="h-ttgrid-cell h-ttgrid-head">${esc(h ?? "")}</div>`).join("")}
    </div>`;

  const bodyRows = rowHeaders
    .map((rh, r) => {
      const row = cells[r] || [];
      const products = colHeaders
        .map(
          (_, c) =>
            `<div class="h-ttgrid-cell h-ttgrid-product">${esc(row[c] ?? "")}</div>`
        )
        .join("");
      return `<div class="h-ttgrid-row">
          <div class="h-ttgrid-cell h-ttgrid-head">${esc(rh ?? "")}</div>
          ${products}
        </div>`;
    })
    .join("");

  return `
    <div class="h-ttgrid" style="--h-ttgrid-cols:${cols}; max-width:${cols * TT_CELL_MAX_MM}mm">${headRow}${bodyRows}</div>`;
}

function measureTimesTableGrid(spec, widthMm) {
  const { rows } = ttGeometry(spec);
  return rows * ttCellMm(spec, widthMm) * TT_ROW_RATIO;
}

function needsTimesTableGrid(spec) {
  const { cols, rows } = ttGeometry(spec);
  return {
    // A 12 x 12 grid needs four times the width of a 3 x 3 one. This is the
    // whole reason `needs` takes the spec.
    minWidthMm: cols * TT_CELL_MIN_MM,
    minHeightMm: rows * TT_CELL_MIN_MM * TT_ROW_RATIO,
  };
}

// ─── number-pyramid ──────────────────────────────────────────────────────
// Each brick is the sum of the two below it, apex at the top. A blank upper
// brick is reached by adding; a blank BASE brick by subtracting, which is the
// harder, inverse variant. Rows are centred so an upper brick sits over the
// join of the two beneath it, the way a pyramid reads on the page.

const PYRAMID_BRICK_MIN_MM = 14;
const PYRAMID_BRICK_MAX_MM = 22; // a brick is a box for one number: past this
                                 // it stops being a pyramid and starts being
                                 // a wall
const PYRAMID_ROW_RATIO = 0.72; // the Word pyramid's brick, cellW * 0.72
const PYRAMID_GAP_MM = 1; // mortar between courses, and the reason each row is
                          // legible as its own course

function pyramidRows(spec) {
  return spec.rows || [];
}

// The base is the widest row, and it is what the pyramid's width is set by.
function pyramidBase(spec) {
  return pyramidRows(spec).reduce(
    (widest, row) => Math.max(widest, (row || []).length),
    1
  );
}

function pyramidBrickMm(spec, widthMm) {
  const base = pyramidBase(spec);
  return Math.min(widthMm / base, PYRAMID_BRICK_MAX_MM);
}

function renderNumberPyramid(spec) {
  const rows = pyramidRows(spec);
  const base = pyramidBase(spec);

  const courses = rows
    .map((row) => {
      const bricks = (row || [])
        .map((value) => `<div class="h-pyramid-brick">${esc(value ?? "")}</div>`)
        .join("");
      return `<div class="h-pyramid-row">${bricks}</div>`;
    })
    .join("");

  return `
    <div class="h-pyramid" style="--h-pyramid-base:${base}; max-width:${base * PYRAMID_BRICK_MAX_MM}mm">${courses}</div>`;
}

function measureNumberPyramid(spec, widthMm) {
  const count = pyramidRows(spec).length;
  if (count === 0) return PYRAMID_GAP_MM;
  const brickMm = pyramidBrickMm(spec, widthMm) * PYRAMID_ROW_RATIO;
  return count * brickMm + (count - 1) * PYRAMID_GAP_MM;
}

function needsNumberPyramid(spec) {
  const count = Math.max(1, pyramidRows(spec).length);
  return {
    // A five-brick base needs a wider zone than a three-brick one...
    minWidthMm: pyramidBase(spec) * PYRAMID_BRICK_MIN_MM,
    // ...and a six-course pyramid a taller one than a three-course.
    minHeightMm:
      count * PYRAMID_BRICK_MIN_MM * PYRAMID_ROW_RATIO + (count - 1) * PYRAMID_GAP_MM,
  };
}

// ─── base-ten-blocks / Dienes ──────────────────────────────────────────
// A place-value representation, not an illustration. Every block is native
// SVG so it stays crisp in print and can be nested inside comparisonPair.
const BASE10_PLACES = ["thousands", "hundreds", "tens", "ones"];
const BASE10_COL_MM = 36;
const BASE10_GAP_MM = SPACE.tight;
const BASE10_HEAD_MM = NOTE_LINE_MM + 2 * INSET.cell.v;
const BASE10_BLOCK_MM = 16;

function base10Counts(spec) {
  const source = spec.counts || {};
  const counts = {};
  for (const place of BASE10_PLACES) {
    const value = Number(source[place] || 0);
    if (!Number.isInteger(value) || value < 0 || value > 10) {
      throw new Error(`base-ten-blocks: counts.${place} must be a whole number from 0 to 10`);
    }
    counts[place] = value;
  }
  return counts;
}

function base10Svg(place) {
  if (place === "thousands") return `<svg class="h-b10-shape" viewBox="0 0 40 40" aria-label="one thousand cube"><path d="M8 13 21 5l13 8v16l-13 8-13-8zM8 13l13 8 13-8M21 21v16"/><path class="h-b10-fine" d="M12 11l13 8m-9-11 13 8M8 18l13 8 13-8M8 23l13 8 13-8"/></svg>`;
  if (place === "hundreds") return `<svg class="h-b10-shape" viewBox="0 0 40 40" aria-label="one hundred flat"><rect x="5" y="5" width="30" height="30"/><path class="h-b10-fine" d="M8 5v30m3-30v30m3-30v30m3-30v30m3-30v30m3-30v30m3-30v30m3-30v30m3-30v30M5 8h30M5 11h30M5 14h30M5 17h30M5 20h30M5 23h30M5 26h30M5 29h30M5 32h30"/></svg>`;
  if (place === "tens") return `<svg class="h-b10-shape" viewBox="0 0 40 40" aria-label="one ten rod"><rect x="16" y="3" width="8" height="34"/><path class="h-b10-fine" d="M16 6.4h8m-8 3.4h8m-8 3.4h8m-8 3.4h8m-8 3.4h8m-8 3.4h8m-8 3.4h8m-8 3.4h8m-8 3.4h8"/></svg>`;
  return `<svg class="h-b10-shape" viewBox="0 0 40 40" aria-label="one unit cube"><path d="M12 15 21 10l9 5v11l-9 5-9-5zM12 15l9 5 9-5M21 20v11"/></svg>`;
}

function renderBaseTenBlocks(spec) {
  const counts = base10Counts(spec);
  const columns = BASE10_PLACES.map((place) => {
    const blocks = Array.from({ length: counts[place] }, () => base10Svg(place)).join("");
    return `<div class="h-b10-col"><div class="h-b10-head">${PLACES[place].label}</div><div class="h-b10-blocks">${blocks}</div></div>`;
  }).join("");
  return `<div class="h-b10">${columns}</div>`;
}

function measureBaseTenBlocks(spec) {
  const counts = base10Counts(spec);
  const rows = Math.max(1, ...BASE10_PLACES.map((p) => Math.ceil(counts[p] / 2)));
  return BASE10_HEAD_MM + rows * BASE10_BLOCK_MM + Math.max(0, rows - 1) * SPACE.hair;
}

function needsBaseTenBlocks(spec) {
  return {
    minWidthMm: BASE10_PLACES.length * BASE10_COL_MM + (BASE10_PLACES.length - 1) * BASE10_GAP_MM,
    minHeightMm: measureBaseTenBlocks(spec),
  };
}

const css = `
  /* place-value-counter-chart */

  /* The counter palette. Content colour, not design colour: these are the
     discs the child handles in the lesson, so they keep the classroom's
     meanings rather than the worksheet's. Named here, once, so no hex ever
     appears in the markup and a school using a different set changes it in
     one place. */
  .h-pvc { --pvc-fill: var(--colour-tint); --pvc-ink: var(--colour-ink); }
  .h-pvc-thousands { --pvc-fill: #7030A0; --pvc-ink: #FFFFFF; }
  .h-pvc-hundreds { --pvc-fill: #2E74B5; --pvc-ink: #FFFFFF; }
  .h-pvc-tens { --pvc-fill: #C0504D; --pvc-ink: #FFFFFF; }
  .h-pvc-ones { --pvc-fill: #C0504D; --pvc-ink: #FFFFFF; }
  .h-pvc-tenths { --pvc-fill: #E2A311; --pvc-ink: #000000; }
  .h-pvc-hundredths { --pvc-fill: #548235; --pvc-ink: #FFFFFF; }

  .h-pvc { display: flex; flex-direction: column; }
  .h-pvc-row { display: flex; }
  .h-pvc-cell {
    /* Inside the box, always. A border that adds to the height is how the
       bottom row of a grid gets shaved off by a zone that was told the grid
       was shorter than it is. */
    box-sizing: border-box;
    border: var(--rule-line) solid var(--colour-ink);
    flex: none;
  }
  .h-pvc-head-cell {
    display: flex; align-items: center; justify-content: center; text-align: center;
    padding: ${PVC_PAD_V_MM}mm ${PVC_PAD_H_MM}mm;
    font-size: var(--type-note); font-weight: bold; line-height: 1.35;
    background: var(--pvc-fill); color: var(--pvc-ink);
  }
  .h-pvc-body-cell {
    display: flex; flex-wrap: wrap; align-content: flex-start;
    gap: ${COUNTER_GAP_MM}mm; padding: ${PVC_PAD_V_MM}mm ${PVC_PAD_H_MM}mm;
  }
  .h-pvc-counter {
    width: ${COUNTER_MM}mm; height: ${COUNTER_MM}mm; flex: none;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: var(--type-note); font-weight: bold; line-height: 1.35;
    background: var(--pvc-fill); color: var(--pvc-ink);
  }
  .h-pvc-point.h-pvc-body-cell {
    align-items: center; justify-content: center;
    font-size: var(--type-sectionLabel); font-weight: bold; line-height: 1.35;
    color: var(--colour-ink);
  }

  /* Base-10 / Dienes blocks */
  .h-b10 { display: flex; gap: ${BASE10_GAP_MM}mm; width: 100%; }
  .h-b10-col {
    flex: 1 1 ${BASE10_COL_MM}mm; min-width: ${BASE10_COL_MM}mm;
    border: var(--rule-line) solid var(--colour-ink);
    background: var(--colour-paper); box-sizing: border-box;
  }
  .h-b10-head {
    min-height: ${BASE10_HEAD_MM}mm; box-sizing: border-box;
    padding: var(--inset-cell); text-align: center;
    font-size: var(--type-note); font-weight: bold; line-height: 1.35;
    color: var(--colour-navy); background: var(--colour-surface);
    border-bottom: var(--rule-hair) solid var(--colour-rule);
  }
  .h-b10-blocks {
    display: grid; grid-template-columns: repeat(2, ${BASE10_BLOCK_MM}mm);
    justify-content: center; gap: var(--space-hair);
  }
  .h-b10-shape {
    width: ${BASE10_BLOCK_MM}mm; height: ${BASE10_BLOCK_MM}mm;
    stroke: var(--colour-ink); fill: var(--colour-surface);
    stroke-width: 1.5; stroke-linejoin: round;
  }
  .h-b10-fine { fill: none; stroke: var(--colour-rule); stroke-width: .65; }

  /* counter-group */
  .h-cg-statement {
    box-sizing: border-box;
    padding: var(--inset-card);
    background: var(--colour-tint);
    font-size: var(--type-sectionLabel); font-weight: bold;
    color: var(--colour-ink); line-height: 1.35; text-align: center;
  }
  .h-cg-row {
    display: flex; flex-wrap: nowrap; align-items: center; justify-content: center;
    gap: ${CG_GROUP_GAP_MM}mm;
    margin-top: ${SPACE.tight}mm;
  }
  /* The same disc the chart draws, in the same colours, but as a pill sized to
     the number on its face. A round counter carrying "1000" would have to be
     as wide as its widest label in every direction. */
  .h-cg-counter {
    height: ${CG_COUNTER_H_MM}mm; flex: none;
    box-sizing: border-box;
    border-radius: ${CG_COUNTER_H_MM / 2}mm;
    display: flex; align-items: center; justify-content: center;
    font-size: var(--type-note); font-weight: bold; line-height: 1.35;
    background: var(--pvc-fill); color: var(--pvc-ink);
  }
  /* The discs of one denomination, wrapping three to a row the way they do in
     a chart cell, so a group of nine reads as three rows of three rather than
     as a line nine counters long. */
  .h-cg-group {
    display: flex; flex-wrap: wrap; justify-content: center;
    gap: ${COUNTER_GAP_MM}mm; flex: none;
  }
  .h-cg-op {
    flex: none; min-width: ${CG_OP_MM}mm; text-align: center;
    font-size: var(--type-sectionLabel); font-weight: bold;
    color: var(--colour-ink); line-height: 1.35;
  }

  /* place-value-chart */
  .h-pvchart { display: flex; gap: ${PVCHART_GAP_MM}mm; }
  /* min-width: 0 or a flex item refuses to shrink below the widest unbreakable
     word inside it. Three charts of "Ones . Tenths Hundredths" then draw 271mm
     wide on a 180mm page and the third one runs off the paper - and nothing
     objects, because needs() already counts the header wrapping onto a second
     line and reports the chart as fitting. The measurement was right; the CSS
     was refusing to do what the measurement assumed. */
  /* One grid for the whole chart, so every row draws from the SAME column
     tracks and no cell's content can knock its row out of line with the ones
     above and below it. The template comes from pvchartTemplate above. */
  .h-pvchart-one { flex: 1 1 0; min-width: 0; display: grid; }
  /* The row is kept in the markup because a chart is written and read row by
     row, but it draws no box of its own: its cells are the grid's items, which
     is what puts them on the chart's tracks rather than on the row's. */
  .h-pvchart-row { display: contents; }
  .h-pvchart-cell {
    box-sizing: border-box;
    border: var(--rule-line) solid var(--colour-ink);
    min-width: 0;
  }
  /* The row-label column: what this row IS ("3,462", "10 more"). It sits
     outside the grid it captions, so it carries no cell tint and no border
     weight of its own beyond the chart's. */
  .h-pvchart-label-cell {
    display: flex; align-items: center; justify-content: center; text-align: center;
    padding: ${PVCHART_PAD_V_MM}mm ${PVCHART_PAD_H_MM}mm;
    font-size: var(--type-body); font-weight: bold; line-height: 1.35;
    color: var(--colour-ink);
  }
  /* A digit the child has been GIVEN, so the given colour, the same as any
     other value handed over on this sheet. */
  .h-pvchart-given {
    min-height: ${PVCHART_GIVEN_MM}mm;
    display: flex; align-items: center; justify-content: center;
    font-size: var(--type-sectionLabel); font-weight: bold; line-height: 1.35;
    color: var(--colour-given);
  }
  /* The digit the lesson is ABOUT: the one that changed. Drawn in the question
     blue, because blue already means "the focus" on this sheet and a picked-out
     digit is exactly that - a fifth colour meaning would be a fifth thing for a
     child to learn. The ring is the heavy rule, so it reads as a ring rather
     than as a slightly darker cell. */
  .h-pvchart-picked {
    border: var(--rule-heavy) solid var(--colour-question);
    color: var(--colour-question);
  }
  .h-pvchart-head-cell {
    display: flex; align-items: center; justify-content: center; text-align: center;
    padding: ${PVCHART_PAD_V_MM}mm ${PVCHART_PAD_H_MM}mm;
    /* Note size, matching the counter chart's header above. These are the same
       label doing the same job in two sibling helpers, and they were set two
       sizes apart. Body size also meant "Hundredths" needed 21.2mm inside a
       column capped at 24mm, so the header fitted on one line only while the
       cell inset stayed at 1.4mm: a whole line of chart height resting on a
       tenth of a millimetre nobody had chosen. */
    font-size: var(--type-note); font-weight: bold; line-height: 1.35;
    background: var(--colour-tint); color: var(--colour-ink);
    /* "Hundredths" is one unbreakable word and a digit column is narrower than
       it. Without this the word simply overflows its cell and the tail is
       clipped, while the measurement has already reserved a second line for it
       to wrap onto. Breaking the word is what the measurement assumed. */
    overflow-wrap: anywhere;
  }
  /* Left empty on purpose: this cell is the child's. A minimum rather than a
     fixed height, so a row whose label wraps grows instead of printing its
     bottom border through the caption. */
  .h-pvchart-write { min-height: ${PVCHART_WRITE_MM}mm; }

  /* digit-cards */
  .h-digitcards { display: flex; gap: ${CARD_GAP_MM}mm; flex-wrap: nowrap; }
  .h-digitcard {
    box-sizing: border-box;
    width: ${CARD_W_MM}mm; height: ${CARD_H_MM}mm; flex: none;
    border: var(--rule-line) solid var(--colour-ink);
    background: var(--colour-tint);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--type-sectionLabel); font-weight: bold; line-height: 1.35;
    /* Handed to the child, like the values in a data table. */
    color: var(--colour-given);
  }

  /* times-table-grid */
  .h-ttgrid { display: flex; flex-direction: column; width: 100%; }
  .h-ttgrid-row {
    display: grid;
    grid-template-columns: repeat(var(--h-ttgrid-cols), 1fr);
  }
  .h-ttgrid-cell {
    aspect-ratio: 100 / ${Math.round(TT_ROW_RATIO * 100)};
    box-sizing: border-box;
    border: var(--rule-line) solid var(--colour-ink);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--type-question); font-weight: bold; line-height: 1.35;
  }
  /* The corner is the grid's own furniture, so it is ink. */
  .h-ttgrid-corner { background: var(--colour-tint); color: var(--colour-ink); }
  /* Headers and products that are printed are values handed to the child; the
     blanks are the question and stay empty. */
  .h-ttgrid-head { background: var(--colour-tint); color: var(--colour-given); }
  .h-ttgrid-product { color: var(--colour-given); }

  /* number-pyramid */
  .h-pyramid {
    display: flex; flex-direction: column; gap: ${PYRAMID_GAP_MM}mm;
    width: 100%;
  }
  .h-pyramid-row { display: flex; justify-content: center; }
  .h-pyramid-brick {
    width: calc(100% / var(--h-pyramid-base));
    aspect-ratio: 100 / ${Math.round(PYRAMID_ROW_RATIO * 100)};
    box-sizing: border-box;
    border: var(--rule-line) solid var(--colour-ink);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--type-question); font-weight: bold; line-height: 1.35;
    /* A brick with a number in it is one the child has been given; an empty
       brick is the question and prints nothing at all. */
    color: var(--colour-given);
  }
`;

const helpers = {
  "base-ten-blocks": {
    render: renderBaseTenBlocks,
    measure: measureBaseTenBlocks,
    needs: needsBaseTenBlocks,
    greed: 0,
  },
  "counter-group": {
    requires: ["groups"],
    render: renderCounterGroup,
    measure: measureCounterGroup,
    needs: needsCounterGroup,
    greed: 0, // a counter is a fixed object; height above it is a hole
  },
  "place-value-counter-chart": {
    render: renderPlaceValueCounterChart,
    measure: measurePlaceValueCounterChart,
    needs: needsPlaceValueCounterChart,
    // A counter is a fixed-size object. Extra room around the chart is not a
    // bigger chart, it is a bigger gap, so the chart declines it.
    greed: 0,
  },
  "place-value-chart": {
    render: renderPlaceValueChart,
    measure: measurePlaceValueChart,
    needs: needsPlaceValueChart,
    // One digit per cell. A taller cell is no easier to write one digit in.
    greed: 0,
  },
  "digit-cards": {
    render: renderDigitCards,
    measure: measureDigitCards,
    needs: needsDigitCards,
    greed: 0, // cards are read, not written on
  },
  "times-table-grid": {
    render: renderTimesTableGrid,
    measure: measureTimesTableGrid,
    needs: needsTimesTableGrid,
    // Cells stay in proportion so rows and columns read as rows and columns.
    // Height without width would only stretch them out of shape.
    greed: 0,
  },
  "number-pyramid": {
    render: renderNumberPyramid,
    measure: measureNumberPyramid,
    needs: needsNumberPyramid,
    greed: 0, // same: a brick is a brick
  },
};

module.exports = { helpers, css };
