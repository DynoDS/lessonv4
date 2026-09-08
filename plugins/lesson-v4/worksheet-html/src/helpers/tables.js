"use strict";

// Two tables that look alike and behave nothing alike. The test for which one
// you want is simply: who writes in the cells?

const { LINE_MM, NOTE_LINE_MM, esc, linesFor } = require("./shared");
const { SPACE, RULE } = require("../tokens");

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
// A row is priced at what the CSS actually spends on it: the browser's own
// line box for a table cell (a shade taller than prose leading, hence the
// 1.05), the vertical padding above and below the text, and one collapsed
// border. The old prices were multiples of LINE_MM chosen by eye - 1.6 for a
// plain row, 1.35 for a compact one - and the compact multiple ran about a
// third of a millimetre SHORT per row. On a five-row table the measure's flat
// 4mm cushion swallowed that; on a ten-row hundred square it compounded to
// 3.5mm, sailed past the page's safety margin, and the browser found the last
// row clipped after every arithmetic check had said the sheet fit - which
// cost a real lesson its whole worksheet set. Both paddings are 1mm vertically
// in tokens.js (compact only tightens horizontally), so the two prices differ
// only in name; they are kept separate so a future CSS change to one cannot
// silently misprice the other.
const DATA_ROW_MM = LINE_MM * 1.05 + 2 * SPACE.hair + RULE.line;
const DATA_ROW_COMPACT_MM = LINE_MM * 1.05 + 2 * SPACE.hair + RULE.line;
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
  // The caption costs its line box plus the padding beneath it - the compact
  // one dropped the padding and priced a line at note size exactly, so a
  // captioned table started a millimetre behind before a row was counted.
  const capMm = spec.caption
    ? (spec.compactCaption
        ? NOTE_LINE_MM * 1.05 + SPACE.hair
        : LINE_MM * 1.4)
    : 0;
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
//
// Each size says two heights, not one. `rowMm` is the floor: the smallest row
// a child can honestly write that answer in. `grownMm` is where the gain runs
// out: the tallest that row is still BETTER at.
//
// The second number was missing for a long time and its absence produced the
// maths sheet of 7 September 2026. A single row asking for three four-digit
// numbers was drawn 30.7mm tall - two and a half times its own floor - because
// the zone had 30.7mm to give and nothing in the engine had ever been asked
// whether a box for one number gets better at 30mm. It does not. A number is
// as tall as the digits a child writes; the rest of the box is a big empty
// rectangle, which is exactly the look these sheets were being rebuilt to lose.
//
// A sentence is the opposite case and the reason this is per response rather
// than one number for the table: a sentence cell genuinely does keep improving
// for a while, because the child is fitting more words into it.
const WRITING = {
  tick: { columnMm: 16, rowMm: 9, grownMm: 11 },
  number: { columnMm: 22, rowMm: 12, grownMm: 16 },
  word: { columnMm: 30, rowMm: 12, grownMm: 18 },
  sentence: { columnMm: 52, rowMm: 22, grownMm: 33 },
};

// A name this table does not know used to fall back to "word" without a word
// said, so a sheet asking for "number" columns silently got word-width ones and
// nobody could see why the table was wider than the page wanted. A name is
// either one this engine sizes or a mistake worth showing.
function writingSize(name, where) {
  if (name === undefined || name === null) return WRITING.word;
  const size = WRITING[name];
  if (!size) {
    throw new Error(
      `recording-table ${where} is "${name}", which is not a writing size. ` +
        `Use one of: ${Object.keys(WRITING).join(", ")}.`
    );
  }
  return size;
}

function writingFor(spec) {
  if (Array.isArray(spec.writing)) {
    // The widest column decides the row height, because one row is one height.
    let widest = WRITING.tick;
    spec.writing.forEach((name, i) => {
      const size = writingSize(name, `writing[${i}]`);
      if (size.rowMm > widest.rowMm) widest = size;
    });
    return widest;
  }
  return writingSize(spec.writing, "writing");
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
    return columns.map((_, i) => writingSize(spec.writing[i], `writing[${i}]`));
  }
  const single = writingSize(spec.writing, "writing");
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
        return `<td class="h-write"></td>`;
      });
      // The height goes on the ROW, not on the writing cells. This table
      // stretches to fill its zone, and a browser hands a stretched table's
      // spare height to whichever rows are unconstrained: on a sheet whose
      // first row was the fully worked example (42, 32, 52), that row was the
      // only one with no height and swallowed the lot, coming out five times
      // the height of the rows beneath it.
      return `<tr style="height:${writingFor(spec).rowMm}mm">${cells.join("")}</tr>`;
    })
    .join("");
  // The caption sits OUTSIDE the table rather than in a <caption> element,
  // because this table stretches to fill its zone and a <caption> is laid out
  // outside the table's own box: setting the table to the full height of the
  // zone then pushed the caption past the bottom edge and the last row was
  // clipped. A data table keeps its <caption>, since it never stretches.
  // The note is the line of small print that says what to WRITE in a column
  // ("write mains, battery, both or not electrical"). A data table has carried
  // one from the start; this table did not, and the field was accepted in
  // silence - so a sheet asking for a power source printed no clue what a
  // power source should look like, twice on one lesson, and nothing said so.
  // Same field, same place, same styling as its twin.
  return `
    <div class="h-record-block">
      ${spec.caption ? `<p class="h-record-caption">${esc(spec.caption)}</p>` : ""}
      <table class="h-table h-record">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
      ${spec.note ? `<p class="h-record-note">${esc(spec.note)}</p>` : ""}
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
  // One line for the note here, because `needs` is the floor and a note is
  // never shorter than a line. `measure` prices how it really wraps.
  const noteMm = spec.note ? NOTE_LINE_MM + 1 : 0;
  return (
    capMm + LINE_MM * 1.6 + writingFor(spec).rowMm * recordingRows(spec).length +
    noteMm + 4
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
  const noteMm = spec.note ? linesFor(spec.note, available) * NOTE_LINE_MM + 1 : 0;
  return capMm + headMm + bodyMm + noteMm + 4;
}

// The tallest this table is still gaining from: its own measured height, plus
// the room each row can still turn into a better answer. Everything else about
// the table - a caption, a wrapped heading, a line of small print - is text at
// a fixed size and gains nothing from being given more page.
function enoughRecordingTable(spec, widthMm) {
  const size = writingFor(spec);
  const perRowMm = Math.max(0, size.grownMm - size.rowMm);
  return (
    measureRecordingTable(spec, widthMm) + perRowMm * recordingRows(spec).length
  );
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
  /* Cells are centred, horizontally and vertically. A table on a worksheet is
     a grid a child reads across and writes into, and centring keeps a short
     given value, a heading and an empty writing cell sitting on the same line
     as each other instead of each hugging its own top-left corner. The caption
     above stays left, because it is a line of prose rather than a cell. */
  .h-table th, .h-table td {
    border: var(--rule-line) solid var(--colour-ink);
    padding: var(--inset-cell); text-align: center; vertical-align: middle;
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
  /* Small print under the table: a source, a unit, a "figures are rounded".
     Under a recording table it is usually what to WRITE in a column, so it
     must not stretch with the table above it - hence flex: none. */
  .h-data-note,
  .h-record-note {
    margin: var(--space-hair) 0 0;
    font-size: var(--type-note);
    color: var(--colour-quiet);
    line-height: 1.35;
  }
  .h-record-note { flex: none; }

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
    requires: ["rows"],
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
    requires: ["columns"],
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
    // And the gain stops where the answer does. See WRITING above.
    enough: enoughRecordingTable,
  },
};

module.exports = { helpers, css };
