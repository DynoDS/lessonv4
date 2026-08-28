"use strict";

// Two structures a geography lesson keeps needing, built once so they stop
// being rebuilt by hand: a grid for choosing a cause and its effect, and a
// frame for weighing evidence against possible actions.
//
// Neither is a geography ROUTER. Nothing here decides that a lesson is about
// rainforests, or picks these helpers because a subject was named. A designer
// asks for them the way a designer asks for any other helper, and these are
// only capable of drawing what they are handed.
//
// The capacities below are what these layouts can actually hold at a readable
// size on a real column of a real page. They are small, and they are meant to
// be: a cause-path grid of six rows is not a tighter version of this helper, it
// is a different structure that has not been designed. So a third row is
// REFUSED and named rather than dropped, because a sheet quietly printing two
// of three causes is a sheet a teacher hands out believing it is complete.

const { LINE_MM, NOTE_LINE_MM, esc, linesFor } = require("./shared");
const { SPACE } = require("../tokens");

const CAUSE_PATH_MAX_ROWS = 2;
const CAUSE_PATH_MAX_CHOICES = 2;
const CAUSE_PATH_HEADING_COUNT = 4;
const EVIDENCE_MAX_ROWS = 2;

const CELL_PAD_MM = 2;
const CHOICE_BOX_MM = 4;

// ─── refusals ────────────────────────────────────────────────────────────
// Every one of these keeps the whole original input and says exactly what it
// received. Nothing is trimmed to fit, and nothing is substituted for a value
// that is missing: both would produce a sheet that looks finished and teaches
// something other than what was designed.

function exactArray(value, path, count) {
  if (!Array.isArray(value) || value.length !== count) {
    throw new Error(
      `HELPER_STRUCTURE_INVALID: ${path} requires exactly ${count} entries; ` +
        `received ${Array.isArray(value) ? value.length : "non-array"}.`
    );
  }
  return value;
}

function atMost(value, path, count) {
  if (!Array.isArray(value)) {
    throw new Error(`HELPER_STRUCTURE_INVALID: ${path} must be an array.`);
  }
  if (value.length > count) {
    throw new Error(
      `HELPER_CAPACITY_EXCEEDED: ${path} supports at most ${count}; ` +
        `received ${value.length}. Nothing was removed.`
    );
  }
  return value;
}

function required(value, path) {
  const text = String(value == null ? "" : value).trim();
  if (!text) {
    throw new Error(`HELPER_CONTENT_MISSING: ${path} is missing or empty.`);
  }
  return text;
}

// A symbol is printed exactly as the designer wrote it. A NAME, though, has to
// resolve to something this helper can actually draw, and an unknown one is
// reported with the exact value supplied rather than filled with a generic
// shape that would silently mean something else on the page.
const SUPPORTED_SYMBOLS = {
  arrow: "→",
  tick: "✓",
  cross: "✗",
  dot: "●",
};

function symbolFor(value, path) {
  const name = String(value == null ? "" : value).trim();
  if (!name) return "";
  if (!Object.prototype.hasOwnProperty.call(SUPPORTED_SYMBOLS, name)) {
    throw new Error(
      `UNSUPPORTED_SYMBOL: ${path} asked for ${JSON.stringify(name)}, which ` +
        `this helper cannot draw. Supported: ${Object.keys(SUPPORTED_SYMBOLS).join(", ")}.`
    );
  }
  return SUPPORTED_SYMBOLS[name];
}

// ─── cause-path-grid ─────────────────────────────────────────────────────
// Named steps across the top, and for each row a prompt plus the choices a
// child picks between at each step.

function readCausePath(spec) {
  if (!Array.isArray(spec.headings) || spec.headings.length < 2) {
    throw new Error(
      `HELPER_STRUCTURE_INVALID: cause-path-grid.headings requires at least 2 entries; ` +
        `received ${Array.isArray(spec.headings) ? spec.headings.length : "non-array"}.`
    );
  }
  const headings = spec.headings.map((h, i) =>
    required(h, `cause-path-grid.headings[${i}]`)
  );

  const rows = atMost(
    spec.rows || [],
    "cause-path-grid.rows",
    CAUSE_PATH_MAX_ROWS
  ).map((row, i) => {
    if (!row || typeof row !== "object") {
      throw new Error(
        `HELPER_STRUCTURE_INVALID: cause-path-grid.rows[${i}] must be an object.`
      );
    }
    const choices = atMost(
      row.choices || [],
      `cause-path-grid.rows[${i}].choices`,
      CAUSE_PATH_MAX_CHOICES
    ).map((c, j) => required(c, `cause-path-grid.rows[${i}].choices[${j}]`));

    if (!choices.length) {
      throw new Error(
        `HELPER_CONTENT_MISSING: cause-path-grid.rows[${i}].choices is empty.`
      );
    }

    return {
      prompt: required(row.prompt, `cause-path-grid.rows[${i}].prompt`),
      choices,
      symbol: symbolFor(row.symbol, `cause-path-grid.rows[${i}].symbol`),
    };
  });

  if (!rows.length) {
    throw new Error("HELPER_CONTENT_MISSING: cause-path-grid.rows is empty.");
  }

  return {
    instruction: required(spec.instruction, "cause-path-grid.instruction"),
    headings,
    rows,
  };
}

function renderCausePathGrid(spec) {
  const { instruction, headings, rows } = readCausePath(spec);

  const head = headings.map((h) => `<th>${esc(h)}</th>`).join("");
  const body = rows
    .map((row) => {
      const choices = row.choices
        .map(
          (c) =>
            `<span class="h-cpg-choice"><span class="h-cpg-box"></span>${esc(c)}</span>`
        )
        .join("");
      return `
      <tr>
        <td class="h-cpg-prompt">${
          row.symbol ? `<span class="h-cpg-symbol">${esc(row.symbol)}</span>` : ""
        }${esc(row.prompt)}</td>
        <td class="h-cpg-choices" colspan="${headings.length - 1}">${choices}</td>
      </tr>`;
    })
    .join("");

  return `
    <div class="h-cpg">
      <p class="h-cpg-instruction">${esc(instruction)}</p>
      <table class="h-table h-cpg-table">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

function measureCausePathGrid(spec, widthMm = 100) {
  const { instruction, rows } = readCausePath(spec);
  const inner = Math.max(20, widthMm - CELL_PAD_MM * 2);
  const headMm = LINE_MM * 1.6;
  const rowsMm = rows.reduce((h, row) => {
    const promptMm = linesFor(row.prompt, inner / 2) * LINE_MM;
    const choicesMm = row.choices.reduce(
      (c, choice) => c + linesFor(choice, inner / 2) * LINE_MM + 1,
      0
    );
    return h + Math.max(promptMm, choicesMm) + CELL_PAD_MM * 2;
  }, 0);

  return (
    linesFor(instruction, widthMm) * LINE_MM +
    SPACE.tight +
    headMm +
    rowsMm +
    SPACE.item
  );
}

function needsCausePathGrid(spec) {
  const headings = Array.isArray(spec.headings) ? spec.headings.length : 0;
  return {
    minWidthMm: Math.max(90, headings * 22),
    minHeightMm: 30,
  };
}

// ─── evidence-chain-frame ────────────────────────────────────────────────
// A set of possible actions, and for each piece of evidence the actions a
// child decides should stop now.

function readEvidenceChain(spec) {
  const actions = (Array.isArray(spec.actions) ? spec.actions : []).map((a, i) =>
    required(a, `evidence-chain-frame.actions[${i}]`)
  );
  if (!actions.length) {
    throw new Error(
      "HELPER_CONTENT_MISSING: evidence-chain-frame.actions is empty."
    );
  }

  const evidenceRows = atMost(
    spec.evidenceRows || [],
    "evidence-chain-frame.evidenceRows",
    EVIDENCE_MAX_ROWS
  ).map((row, i) => {
    if (!row || typeof row !== "object") {
      throw new Error(
        `HELPER_STRUCTURE_INVALID: evidence-chain-frame.evidenceRows[${i}] must be an object.`
      );
    }
    // Never filled in from `actions`: "which of these should stop" is the
    // question the child answers, and answering it here would delete the task.
    const stopNow = (Array.isArray(row.stopNow) ? row.stopNow : []).map((s, j) =>
      required(s, `evidence-chain-frame.evidenceRows[${i}].stopNow[${j}]`)
    );
    if (!stopNow.length) {
      throw new Error(
        `HELPER_CONTENT_MISSING: evidence-chain-frame.evidenceRows[${i}].stopNow ` +
          `is missing or empty.`
      );
    }
    return {
      evidence: required(
        row.evidence,
        `evidence-chain-frame.evidenceRows[${i}].evidence`
      ),
      stopNow,
    };
  });

  if (!evidenceRows.length) {
    throw new Error(
      "HELPER_CONTENT_MISSING: evidence-chain-frame.evidenceRows is empty."
    );
  }

  return {
    // No built-in wording: an instruction this helper wrote itself would be the
    // builder deciding what the child is being asked to do.
    instruction: required(spec.instruction, "evidence-chain-frame.instruction"),
    actions,
    evidenceRows,
  };
}

function renderEvidenceChainFrame(spec) {
  const { instruction, actions, evidenceRows } = readEvidenceChain(spec);

  const actionList = actions
    .map((a) => `<li class="h-ecf-action">${esc(a)}</li>`)
    .join("");

  const rows = evidenceRows
    .map(
      (row) => `
      <li class="h-ecf-row">
        <p class="h-ecf-evidence">${esc(row.evidence)}</p>
        <ul class="h-ecf-stop">${row.stopNow
          .map(
            (s) =>
              `<li class="h-ecf-stop-item"><span class="h-ecf-box"></span>${esc(s)}</li>`
          )
          .join("")}</ul>
      </li>`
    )
    .join("");

  return `
    <div class="h-ecf">
      <p class="h-ecf-instruction">${esc(instruction)}</p>
      <ul class="h-ecf-actions">${actionList}</ul>
      <ul class="h-ecf-rows">${rows}</ul>
    </div>`;
}

function measureEvidenceChainFrame(spec, widthMm = 100) {
  const { instruction, actions, evidenceRows } = readEvidenceChain(spec);
  const actionsMm = actions.reduce(
    (h, a) => h + linesFor(a, widthMm) * NOTE_LINE_MM,
    0
  );
  const rowsMm = evidenceRows.reduce((h, row) => {
    const evidenceMm = linesFor(row.evidence, widthMm) * LINE_MM;
    const stopMm = row.stopNow.reduce(
      (s, item) => s + linesFor(item, widthMm - 8) * LINE_MM + 1,
      0
    );
    return h + evidenceMm + stopMm + SPACE.item;
  }, 0);

  return (
    linesFor(instruction, widthMm) * LINE_MM +
    SPACE.tight +
    actionsMm +
    SPACE.tight +
    rowsMm
  );
}

function needsEvidenceChainFrame() {
  return { minWidthMm: 80, minHeightMm: 30 };
}

const css = `
  /* ─── cause-path-grid ─── */
  .h-cpg { font-size: var(--type-body); color: var(--colour-ink); }
  .h-cpg-instruction { margin: 0 0 var(--space-tight); line-height: 1.35; }
  .h-cpg-table { width: 100%; }
  .h-cpg-prompt { line-height: 1.35; }
  .h-cpg-symbol { margin-right: 1.5mm; }
  .h-cpg-choices { line-height: 1.35; }
  .h-cpg-choice {
    display: inline-flex; align-items: center;
    gap: var(--space-hair);
    margin-right: var(--space-item);
    white-space: nowrap;
  }
  .h-cpg-box {
    width: ${CHOICE_BOX_MM}mm; height: ${CHOICE_BOX_MM}mm;
    border: var(--rule-line) solid var(--colour-ink);
    flex: none;
  }

  /* ─── evidence-chain-frame ─── */
  .h-ecf { font-size: var(--type-body); color: var(--colour-ink); }
  .h-ecf-instruction { margin: 0 0 var(--space-tight); line-height: 1.35; }
  .h-ecf-actions {
    list-style: none; margin: 0 0 var(--space-tight); padding: var(--space-tight);
    background: var(--colour-tint);
    font-size: var(--type-note);
  }
  .h-ecf-action { line-height: 1.35; }
  .h-ecf-rows { list-style: none; margin: 0; padding: 0; }
  .h-ecf-row { margin-bottom: var(--space-item); }
  .h-ecf-evidence { margin: 0 0 var(--space-hair); line-height: 1.35; }
  .h-ecf-stop { list-style: none; margin: 0; padding: 0 0 0 4mm; }
  .h-ecf-stop-item {
    display: flex; align-items: center; gap: var(--space-tight);
    line-height: 1.35;
  }
  .h-ecf-box {
    width: ${CHOICE_BOX_MM}mm; height: ${CHOICE_BOX_MM}mm;
    border: var(--rule-line) solid var(--colour-ink);
    flex: none;
  }
`;

const helpers = {
  "cause-path-grid": {
    render: renderCausePathGrid,
    measure: measureCausePathGrid,
    needs: needsCausePathGrid,
    greed: 0,
  },
  "evidence-chain-frame": {
    render: renderEvidenceChainFrame,
    measure: measureEvidenceChainFrame,
    needs: needsEvidenceChainFrame,
    greed: 0,
  },
};

module.exports = { helpers, css };
