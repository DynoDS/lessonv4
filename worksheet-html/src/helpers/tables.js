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

function renderDataTable(spec) {
  const head = spec.columns.map((c) => `<th>${esc(c)}</th>`).join("");
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
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table>
    ${spec.note ? `<p class="h-data-note">${esc(spec.note)}</p>` : ""}`;
}

function measureDataTable(spec, widthMm = 100) {
  const rowMm = spec.compact ? DATA_ROW_COMPACT_MM : DATA_ROW_MM;
  const capMm = spec.caption ? (spec.compactCaption ? NOTE_LINE_MM : LINE_MM * 1.4) : 0;
  const noteMm = spec.note ? linesFor(spec.note, widthMm) * NOTE_LINE_MM + 1 : 0;
  return capMm + rowMm * (spec.rows.length + 1) + noteMm + 4;
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
const WRITING = {
  tick: { columnMm: 16, rowMm: 9 },
  word: { columnMm: 30, rowMm: 12 },
  sentence: { columnMm: 52, rowMm: 22 },
};

function writingFor(spec) {
  return WRITING[spec.writing] || WRITING.word;
}

function recordingRows(spec) {
  if (Array.isArray(spec.rows)) return spec.rows;
  return (spec.rowLabels || []).map((label) => [label]);
}

function renderRecordingTable(spec) {
  const head = spec.columns.map((c) => `<th>${esc(c)}</th>`).join("");
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

function measureRecordingTable(spec) {
  const capMm = spec.caption ? LINE_MM * 1.4 : 0;
  return (
    capMm + LINE_MM * 1.6 + writingFor(spec).rowMm * recordingRows(spec).length + 4
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
      minWidthMm: Math.max(80, (spec.columns || []).length * writingFor(spec).columnMm),
      // Its own rows, at the height whatever the child is writing needs. A flat
      // 35mm said a six-row table needed no more height than a two-row one, and
      // that a table of sentences needed no more than a table of ticks.
      minHeightMm: measureRecordingTable(spec),
    }),
    greed: 3, // taller rows are more room to write, which is a real gain
  },
};

module.exports = { helpers, css };
