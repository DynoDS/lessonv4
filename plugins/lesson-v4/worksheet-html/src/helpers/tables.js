"use strict";

// Two tables that look alike and behave nothing alike. The test for which one
// you want is simply: who writes in the cells?

const { LINE_MM, NOTE_LINE_MM, esc, linesFor } = require("./shared");

// ─── data table ──────────────────────────────────────────────────────────
// Values HANDED to the child to read from: a price list, a timetable, a set of
// results, a population table. Cells come filled and sit at single-line height,
// because nobody writes in them.

// A tighter row, a quieter caption and a line of small print beneath: three
// things a designer may ASK for, and none the engine may decide.
//
// The distinction matters more than it looks. A table the fitting engine
// compacted on its own would be the engine choosing to make a child's reading
// harder in order to make a sum work - which is the kind of quiet cut this
// engine exists to refuse. A designer who compacts a nine-row timetable has
// looked at it and judged it still readable. So `compact` is an authored input
// and nothing in the fitting path ever sets it.
const DATA_ROW_MM = LINE_MM * 1.6;
const DATA_ROW_COMPACT_MM = LINE_MM * 1.35;
const DATA_COL_MIN_MM = 24;
const DATA_COL_COMPACT_MIN_MM = 20;

// A headerless table is legitimate (a nutrient | job | examples grid whose
// note beneath explains the columns), and it is written as no `columns` or an
// empty array. It must not emit an empty <thead><tr></tr></thead>: Chrome's
// collapsed-border resolution treats that empty row as the table's first row,
// and the first body row's TOP border vanishes - the table prints open along
// its top edge and looks clipped.
function dataColumns(spec) {
  return Array.isArray(spec.columns) ? spec.columns : [];
}

function renderDataTable(spec) {
  const columns = dataColumns(spec);
  const head = columns.length
    ? `<thead><tr>${columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>`
    : "";
  const body = spec.rows
    .map((r) => `<tr>${r.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`)
    .join("");
  const classes = [
    "h-table",
    "h-data",
    spec.compact ? "h-data--compact" : "",
    spec.compactCaption ? "h-data--compact-caption" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `
    <table class="${classes}">
      ${spec.caption ? `<caption>${esc(spec.caption)}</caption>` : ""}
      ${head}
      <tbody>${body}</tbody>
    </table>
    ${spec.note ? `<p class="h-data-note">${esc(spec.note)}</p>` : ""}`;
}

// A cell's text wraps inside its own column, not across the table, so the
// width that decides how many lines it takes is the COLUMN's - and the column
// loses a little to its own padding.
const CELL_PAD_MM = 3;

function cellTextWidthMm(columnMm) {
  return Math.max(8, columnMm - CELL_PAD_MM);
}

// One row, priced by its tallest cell.
//
// Both tables used to price every row at one line, whatever was in it. A row
// is as tall as its tallest cell, so a given cell holding a sentence made the
// table taller than the engine had promised, and because the error only ever
// runs one way the page passed its fit check and then clipped in the browser.
// The flat height stays the floor, so a blank or tick row is unchanged; the
// extra lines are what is added, at the height of a line of body text.
function rowHeightMm(cells, columnWidthsMm, flatRowMm) {
  let lines = 1;
  cells.forEach((cell, i) => {
    if (cell === undefined || cell === null || String(cell) === "") return;
    const width = cellTextWidthMm(columnWidthsMm[i] ?? columnWidthsMm[0] ?? 30);
    lines = Math.max(lines, linesFor(String(cell), width));
  });
  if (lines === 1) return flatRowMm;
  // The flat height is a FLOOR, not a base to stack lines on top of: a row of
  // blank writing cells is 12mm because that is room to write in, and a cell
  // whose text has grown past 12mm no longer needs that room added again. So
  // wrapped text is priced as its own lines plus the cell's padding, and the
  // taller of the two wins.
  const padMm = Math.max(0, Math.min(flatRowMm - LINE_MM, 2.5));
  return Math.max(flatRowMm, lines * LINE_MM + padMm);
}

function measureDataTable(spec, widthMm = 100) {
  const rowMm = spec.compact ? DATA_ROW_COMPACT_MM : DATA_ROW_MM;
  const capMm = spec.caption ? (spec.compactCaption ? NOTE_LINE_MM : LINE_MM * 1.4) : 0;
  const noteMm = spec.note ? linesFor(spec.note, widthMm) * NOTE_LINE_MM + 1 : 0;
  const columns = dataColumns(spec);
  const headerRows = columns.length ? 1 : 0;
  // A data table shares its width evenly; nothing in the spec says otherwise.
  const share = columns.length ? widthMm / columns.length : widthMm;
  const widths = (columns.length ? columns : [null]).map(() => share);
  let bodyMm = 0;
  for (const row of spec.rows) bodyMm += rowHeightMm(row, widths, rowMm);
  const headMm = headerRows ? rowHeightMm(columns, widths, rowMm) : 0;
  return capMm + headMm + bodyMm + noteMm + 4;
}

// ─── recording table ─────────────────────────────────────────────────────
// The cells are the CHILD'S to fill. Row labels are given, the rest is blank
// and tall enough to write in. This is the science results table, the trial
// record, the comparison grid a child completes.

// How much room a cell needs depends on WHAT THE CHILD WRITES IN IT, and
// nothing about the table itself can tell you that.
//
// Daniel, looking at every size of a three-column recording table: "all fit,
// but it depends what children are writing. All are fine if they're ticking, or
// writing one word, if they're writing sentences though..."
//
// He is right, and it is the same shape of problem as the Venn that is fine to
// read and too small to write in. The table cannot work it out, so the sheet
// has to say. `writing` takes one of these:
//
//   "tick"      a tick, a cross, a single digit
//   "word"      one or two words (the default: the commonest case)
//   "sentence"  a sentence a child composes
//
// The default is "word" rather than "sentence" because most recording tables
// take a word, and defaulting to the widest would refuse layouts that are
// perfectly fine. The cost of that choice is that a sheet wanting sentences has
// to say so, which is why the field is named for what the CHILD does rather
// than for a size.
//
// `writing` also takes an array, one entry per column, for the common table
// that mixes demands: ["word", "tick", "word", "sentence"]. See columnWriting.
const WRITING = {
  tick: { columnMm: 16, rowMm: 9 },
  word: { columnMm: 30, rowMm: 12 },
  sentence: { columnMm: 52, rowMm: 22 },
};

function writingFor(spec) {
  if (Array.isArray(spec.writing)) {
    // The widest column decides the row height, because one row is one height.
    let widest = WRITING.tick;
    for (const name of spec.writing) {
      const size = WRITING[name] || WRITING.word;
      if (size.rowMm > widest.rowMm) widest = size;
    }
    return widest;
  }
  return WRITING[spec.writing] || WRITING.word;
}

// What each column needs, in order.
//
// A recording table usually mixes demands: "Electrical or not" takes a tick,
// "Power source" takes a word, "What makes it work" takes a sentence. One size
// for the whole table forces the honest choice to be dishonest somewhere -
// size it for the sentence and the tick columns waste width the page does not
// have, size it for the word and the page tells the child to explain in a box
// too small to explain in. So `writing` also takes an ARRAY, one entry per
// column, and only the columns that need room get it.
//
// A string still means what it always did: that size for every column.
function columnWriting(spec) {
  const columns = spec.columns || [];
  if (Array.isArray(spec.writing)) {
    return columns.map((_, i) => WRITING[spec.writing[i]] || WRITING.word);
  }
  const single = WRITING[spec.writing] || WRITING.word;
  return columns.map(() => single);
}

function recordingRows(spec) {
  if (Array.isArray(spec.rows)) return spec.rows;
  return (spec.rowLabels || []).map((label) => [label]);
}

function renderRecordingTable(spec) {
  // Share the width out in proportion to what each column is for, so a
  // sentence column is visibly the place a sentence goes and a tick column
  // does not sit there looking like one.
  const sizes = columnWriting(spec);
  const totalMm = sizes.reduce((total, size) => total + size.columnMm, 0) || 1;
  const head = spec.columns
    .map(
      (c, i) =>
        `<th style="width:${((sizes[i].columnMm / totalMm) * 100).toFixed(1)}%">${esc(c)}</th>`
    )
    .join("");
  const body = recordingRows(spec)
    .map((row) => {
      const cells = spec.columns.map((_, i) => {
        const value = row[i];
        if (value !== undefined && value !== null && String(value) !== "") {
          const tag = i === 0 ? "th scope=\"row\"" : "td";
          return `<${tag} class="h-given">${esc(value)}</${tag.split(" ")[0]}>`;
        }
        return `<td class="h-write" style="height:${writingFor(spec).rowMm}mm"></td>`;
      });
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");
  // The caption sits OUTSIDE the table rather than in a <caption> element,
  // because this table stretches to fill its zone and a <caption> is laid out
  // outside the table's own box: setting the table to the full height of the
  // zone then pushed the caption past the bottom edge and the last row was
  // clipped. A data table keeps its <caption>, since it never stretches.
  return `
    <div class="h-record-block">
      ${spec.caption ? `<p class="h-record-caption">${esc(spec.caption)}</p>` : ""}
      <table class="h-table h-record">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

// The floor a recording table can always reach: its rows at their flat height,
// with nothing wrapped. This is what `needs` states, deliberately, because a
// minimum measured at the table's NARROWEST width would be the tallest it ever
// gets, and a helper that demands its own worst case is refused from every
// zone that could have held it. Honest wrapping belongs in `measure`, which is
// asked at the width the zone actually gives.
function flatRecordingHeightMm(spec) {
  const capMm = spec.caption ? LINE_MM * 1.4 : 0;
  return (
    capMm + LINE_MM * 1.6 + writingFor(spec).rowMm * recordingRows(spec).length + 4
  );
}

function measureRecordingTable(spec, widthMm) {
  const capMm = spec.caption ? LINE_MM * 1.4 : 0;
  const flatRowMm = writingFor(spec).rowMm;
  const sizes = columnWriting(spec);
  // Without a width there is nothing to wrap against, so fall back to the
  // table's own smallest usable width - the narrowest it is ever drawn at,
  // which is also where its given cells wrap hardest.
  const total = sizes.reduce((sum, size) => sum + size.columnMm, 0) || 1;
  const available = typeof widthMm === "number" && widthMm > 0 ? widthMm : total;
  const widths = sizes.map((size) => (size.columnMm / total) * available);
  const headMm = rowHeightMm(spec.columns || [], widths, LINE_MM * 1.6);
  let bodyMm = 0;
  for (const row of recordingRows(spec)) bodyMm += rowHeightMm(row, widths, flatRowMm);
  return capMm + headMm + bodyMm + 4;
}

const css = `
  .h-table {
    width: 100%; border-collapse: collapse;
    font-size: var(--type-body);
  }
  .h-table caption {
    text-align: left; font-weight: bold;
    color: var(--colour-question);
    padding-bottom: var(--space-tight);
  }
  .h-table th, .h-table td {
    border: var(--rule-line) solid var(--colour-ink);
    padding: var(--inset-cell); text-align: left;
  }
  .h-table thead th { background: var(--colour-tint); }

  /* Values handed to the child: given material, so orange, and single line. */
  .h-data td { color: var(--colour-given); }

  /* Explicitly asked for by the designer, never chosen by the fitting engine.
     The padding tightens; the type size does not, because a table a child
     cannot read has not been fitted, it has been spoiled. */
  .h-data--compact th, .h-data--compact td {
    padding: var(--space-hair) var(--space-tight);
  }
  /* The caption drops to note size and the quiet colour: still a caption,
     no longer competing with the table it names. */
  .h-data--compact-caption caption {
    font-size: var(--type-note);
    color: var(--colour-quiet);
    padding-bottom: var(--space-hair);
  }
  /* Small print under the table: a source, a unit, a "figures are rounded". */
  .h-data-note {
    margin: var(--space-hair) 0 0;
    font-size: var(--type-note);
    color: var(--colour-quiet);
    line-height: 1.35;
  }

  /* Cells the child fills: tall enough to write in, and left empty. */
  /* Height comes from the markup, because it depends on what the child
     writes rather than on the table. */
  .h-record .h-given {
    background: var(--colour-tint);
    color: var(--colour-given);
    font-weight: normal;
  }

  /* A recording table says it can use spare height (greed 3), and this is what
     makes that true rather than a claim. Without it the engine hands the zone
     extra height, the table stays its natural size, and the difference becomes
     a hole underneath it: the leftover pools between two blocks instead of
     collecting at the foot of the page where a teacher trims it.
     A data table is NOT given this, because taller rows do nothing for values
     a child only reads. */
  .h-record-block { height: 100%; display: flex; flex-direction: column; }
  .h-record-block .h-record { flex: 1; }
  .h-record-caption {
    margin: 0 0 1.5mm; text-align: left; font-weight: bold;
    color: var(--colour-question); font-size: var(--type-body);
  }
`;

const helpers = {
  "data-table": {
    render: renderDataTable,
    measure: measureDataTable,
    // A column a child only reads can be narrow.
    needs: (spec) => ({
      minWidthMm: Math.max(
        70,
        (spec.columns || []).length *
          (spec.compact ? DATA_COL_COMPACT_MIN_MM : DATA_COL_MIN_MM)
      ),
      minHeightMm: 25,
    }),
    greed: 0,
  },
  "recording-table": {
    render: renderRecordingTable,
    measure: measureRecordingTable,
    // A column a child WRITES in cannot be narrow: there has to be room for
    // an answer. A constant per helper cannot know that, which is how a
    // four-column recording table came to be sliced down its right-hand edge
    // with the fit check reporting no problem.
    needs: (spec) => ({
      minWidthMm: Math.max(
        80,
        columnWriting(spec).reduce((total, size) => total + size.columnMm, 0)
      ),
      // Its own rows, at the height whatever the child is writing needs. A flat
      // 35mm said a six-row table needed no more height than a two-row one, and
      // that a table of sentences needed no more than a table of ticks.
      minHeightMm: flatRecordingHeightMm(spec),
    }),
    greed: 3, // taller rows are more room to write, which is a real gain
  },
};

module.exports = { helpers, css };
