'use strict';

// A column calculation with its exchange SHOWN HAPPENING. One drawing, placed by
// the board, the worksheet, the working wall and the stick-in pack.
//
// Exchanging used to be pictured as two place value charts side by side, the
// ten that goes ringed on the left and the ten ones ringed on the right. The
// teacher (18 October 2026): "too static", "not really a relationship between
// them", "just showing 2 different place value charts", "it doesn't actually
// feel like you could look at it and know what's happening". He doubted before
// and after labels would help. A hand-made deck of 52 - 28 as ONE chart, one
// move per slide with PowerPoint's Morph transition between them, the ten
// sliding across into the ones and breaking into ten ones while the written sum
// changed on the same clicks, was his "it works great". This is that deck's
// picture, for every surface:
//
//   - one chart of pieces (counters with their value on, or base-ten blocks),
//     and the written sum beside it, drawn by the place value chart's own
//     calculation code so it is the same sum children meet everywhere else;
//   - the moments of the method worked out from the numbers, never listed by
//     hand, so the pieces and the sum cannot show a wrong exchange (round six,
//     Thursday: hand-listed exchanges drew the wrong working);
//   - each piece one size for the whole run, standing in a fixed slot, so it
//     only moves when the method moves it;
//   - the piece an exchange moves, and everything it becomes, in that
//     exchange's colour, and the sum's marks for that exchange in the same
//     colour: that colour is the relationship between picture and sum;
//   - on a move, a dashed outline where the piece was and an arrow to where it
//     went, so every moment reads on its own on paper, in a PDF and in an older
//     PowerPoint that cannot Morph;
//   - what is taken away stays where it was, faded, so what is left is the
//     answer a child can count.
//
//   stepsFor(spec)                  -> [{ kind, column, sentence, ... }]
//   tightSvg(spec, profile)         -> { svg, w, h, aspect, layout }
//   slideLayers(spec, profile)      -> { w, h, layers: [{ name, svg, x, y, w, h }] }
//                                      the same picture as separate named parts,
//                                      for the board to place one by one (Morph)
//   cacheKey(spec, profile), normalise(spec), minWidthPt(spec, profile)
//
// The spec:
//   { operator: "-" | "+", numbers: ["52", "28"], pieces?: "blocks" | "counters",
//     sum?: "teacher", step?: 0..n-1 | "exchange" | "end" }
// `sum: "teacher"` keeps the written sum as set (numbers only, no marks, no
// answer) on every step, for the teacher to write on as the pieces move; left
// out, the sum fills itself in step by step.
// `pieces` left out, the drawing chooses (the teacher, 18 October 2026: "it
// should just decide what it thinks" unless he asks for one): blocks while every
// number in the sum has at most two digits, where a rod of ten cubes beside a
// cube is the whole idea; counters for anything bigger, because a column of
// nineteen rods or ten flats does not fit a slide at a size anyone can see.
// `step` left out is the run on a slide (the board makes one slide per step) and
// the `exchange` still on paper: the first exchange with its outline, its arrow
// and what it became already landed, so one picture shows what happens.

const { textWidthEm } = require('../text/comic-glyph-width');
const { profileFor, INK_TONES } = require('./surface-profiles');
const { fitUnit, insetProfile } = require('./fit-unit');
const placeValue = require('./place-value-chart-svg');

const { canonicalColumn, COLUMN_COLOURS } = placeValue;

// ─── CONSTANTS (in U, one piece's size, unless named) ───────────────────────
const PLACES = ['Th', 'H', 'T', 'O'];
const WORD = { Th: 'thousand', H: 'hundred', T: 'ten', O: 'one' };
const VALUE = { Th: '1000', H: '100', T: '10', O: '1' };
// The wall's exchange colours, in order: an exchange's pieces and its marks in
// the sum share one (place-value-chart-svg.js CALC_EXCHANGE_WALL).
const EXCHANGE_COLOURS = ['#E46C0A', '#7030A0', '#C2185B', '#00828A'];
const INK_EXCHANGE = [INK_TONES.ink, INK_TONES.dark, INK_TONES.ink, INK_TONES.dark];
const GRID_COLS = 5;          // pieces per row in a column, at most; fewer when width is short
const PITCH = 1.18;           // slot to slot, so neighbours never touch
const GROUP_GAP = 0.5;        // between the two numbers' pieces before they join
const COL_PAD = 0.35;         // inside a column, round its pieces
const HEAD_H = 1.5;           // the heading band
const ROD_PITCH = 1.7;        // rod to rod across the tens
const SUM_GAP = 1.2;          // between the chart and the sum
const FADED = 0.18;           // what has been taken away
const STROKE = 0.06;          // a piece's outline
const NATURAL_PT = 26;        // a piece on paper at its natural size
const MIN_COUNTER_PT = 20;    // a counter still carrying "1000" readably
const MIN_BLOCK_PT = 11;      // a cube still a cube
const COUNTER_FACE = 0.82;    // the share of a counter its value may use across
const MIN_FACE_PT = 9;        // a counter's value below this is a smudge
const ARROW_W = 0.16;
const DASH = 0.22;
const INK = '#1A1A1A';
const BLOCK_FILL = '#F2F2F2';
const FINE = '#9A9A9A';
// ─── END CONSTANTS ──────────────────────────────────────────────────────────

function f2(n) {
  return Math.round(n * 100) / 100;
}

function refuse(why) {
  throw new Error(`EXCHANGE_HAPPENING_INVALID: ${why}`);
}

function digitsOf(value, what) {
  const s = String(value == null ? '' : value).replace(/[,\s]/g, '');
  if (!/^\d+$/.test(s) || s.length > 4) refuse(`${what} "${value}" must be a whole number of up to four digits.`);
  return s.replace(/^0+(?=\d)/, '');
}

function normalise(spec = {}) {
  const op = String(spec.operator == null ? '-' : spec.operator).trim();
  const operator = op === '+' ? '+' : ['-', '−', '–'].includes(op) ? '−' : refuse(`the operator "${op}" is not one this drawing shows; use "-" or "+".`);
  const numbers = Array.isArray(spec.numbers) ? spec.numbers : [];
  if (numbers.length !== 2) refuse('give the two numbers of the sum, top first: "numbers": ["52", "28"].');
  const top = digitsOf(numbers[0], 'the top number');
  const bottom = digitsOf(numbers[1], 'the bottom number');
  if (operator === '−' && Number(bottom) > Number(top)) refuse(`${top} - ${bottom} would go below zero; the top number is the larger.`);
  const answer = String(operator === '−' ? Number(top) - Number(bottom) : Number(top) + Number(bottom));
  if (answer.length > 4) refuse(`${top} + ${bottom} makes ${answer}, five digits, more than this drawing's four columns.`);
  const width = Math.max(top.length, bottom.length, answer.length);
  const columns = PLACES.slice(PLACES.length - width);
  const pieces = spec.pieces == null || spec.pieces === '' ? (width <= 2 ? 'blocks' : 'counters') : String(spec.pieces).toLowerCase();
  if (pieces !== 'blocks' && pieces !== 'counters') refuse(`"pieces" is "${spec.pieces}"; use "blocks" or "counters", or leave it out and the drawing chooses.`);
  if (pieces === 'blocks' && width > 2) refuse('blocks are drawn for sums of tens and ones; a sum with hundreds or thousands is shown with counters. Leave "pieces" out and the drawing chooses.');
  const writes = spec.sum == null || spec.sum === '' ? 'shown' : String(spec.sum).toLowerCase();
  if (writes !== 'shown' && writes !== 'teacher') refuse(`"sum" is "${spec.sum}"; use "teacher" when the teacher writes the sum as the pieces move, or leave it out and the sum fills itself.`);
  return { operator, top, bottom, answer, columns, pieces, writes, step: spec.step == null || spec.step === '' ? null : spec.step };
}

function digitAt(number, columns, column) {
  const i = columns.indexOf(column) - (columns.length - number.length);
  return i >= 0 ? Number(number[i]) : 0;
}

function plural(n, column) {
  return `${n} ${WORD[column]}${n === 1 ? '' : 's'}`;
}

// ─── the method, as moments ─────────────────────────────────────────────────
// Worked right to left, as on paper. Each moment records what the pieces and
// the sum look like after it, so a step is a picture, not a difference.

function stepsFor(spec) {
  const c = spec && spec.columns && spec.top != null ? spec : normalise(spec);
  const steps = c.operator === '−' ? subtractionSteps(c) : additionSteps(c);
  return foldUntouched(c, steps);
}

// The pieces show only the columns an exchange moves between, and the ones
// column beside them (the teacher, 16 October 2026: counters beside a written
// sum show only the columns the exchange moves between; the sum already shows
// every column). A column no exchange reaches is worked in the sum alone, in
// one closing step, so 4,252 - 1,128 is a chart of tens and ones and the
// hundreds and thousands are written in at the end. A sum with no exchange at
// all keeps every column: there is nothing else to show.
function foldUntouched(c, steps) {
  const ex = steps.exchanges;
  const at = (col) => c.columns.indexOf(col);
  const shown = ex.length
    ? c.columns.slice(Math.min(...ex.map((e) => Math.min(at(e.from), at(e.to)))), Math.max(...ex.map((e) => Math.max(at(e.from), at(e.to)))) + 1)
    : c.columns.slice();
  c.shown = shown;
  if (shown.length === c.columns.length) return steps;
  // The equation that closed the method belongs on the very last click.
  const final = steps[steps.length - 1];
  const tail = / \d[\d,]* [−+] \d[\d,]* = \d[\d,]*\.$/.exec(final.sentence);
  if (tail) final.sentence = final.sentence.slice(0, tail.index);
  const list = (xs) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
  // Each run of columns worked without pieces becomes one click, where it falls
  // in the method, so the sum is still written in the order it is on paper.
  const folded = [];
  let group = [];
  const flush = () => {
    if (!group.length) return;
    const sums = group.map((x) => `${digitAt(c.top, c.columns, x.column)} ${c.operator} ${digitAt(c.bottom, c.columns, x.column)} = ${digitAt(c.answer, c.columns, x.column)}`);
    folded.push({ kind: 'rest', columns: group.map((x) => x.column), sentence: `The ${list(group.map((x) => `${WORD[x.column]}s`))} need no exchanging: ${list(sums)}.` });
    group = [];
  };
  steps.forEach((x) => {
    if ((x.kind === 'take' || x.kind === 'join') && !shown.includes(x.column)) group.push(x);
    else { flush(); folded.push(x); }
  });
  flush();
  if (tail) folded[folded.length - 1].sentence += tail[0];
  folded.exchanges = ex;
  return folded;
}

function subtractionSteps(c) {
  const { columns, top, bottom } = c;
  const have = {};
  columns.forEach((col) => { have[col] = digitAt(top, columns, col); });
  const steps = [{ kind: 'start', sentence: `Here is ${Number(top).toLocaleString('en-GB')}.` }];
  const exchanges = [];
  // Into column i, from its left neighbour, borrowing further left first when
  // that neighbour has nothing to give (across a zero), as it is written.
  const exchangeInto = (i, because) => {
    const to = columns[i];
    const from = columns[i - 1];
    if (have[from] === 0) exchangeInto(i - 1, 'zero');
    const k = exchanges.length;
    exchanges.push({ from, to, k });
    have[from] -= 1;
    const before = have[to];
    have[to] += 10;
    steps.push({
      kind: 'move', exchange: k, from, to,
      sentence: because === 'zero'
        ? `There are no ${WORD[to]}s to exchange, so first we take 1 ${WORD[from]} from the ${WORD[from]}s.`
        : `There aren't enough ${WORD[to]}s to take away ${digitAt(bottom, columns, to)}, so we take 1 ${WORD[from]} from the ${WORD[from]}s.`,
    });
    steps.push({ kind: 'break', exchange: k, from, to, sentence: `The ${WORD[from]} becomes 10 ${WORD[to]}s. Now there ${have[to] === 1 ? 'is' : 'are'} ${plural(have[to], to)}.`, before });
  };
  for (let i = columns.length - 1; i >= 0; i -= 1) {
    const col = columns[i];
    const take = digitAt(bottom, columns, col);
    if (have[col] < take) exchangeInto(i, 'short');
    const left = have[col] - take;
    steps.push({ kind: 'take', column: col, take, sentence: `${plural(have[col], col)} take away ${plural(take, col)} leaves ${plural(left, col)}.` });
  }
  steps[steps.length - 1].sentence += ` ${Number(top).toLocaleString('en-GB')} − ${Number(bottom).toLocaleString('en-GB')} = ${Number(c.answer).toLocaleString('en-GB')}.`;
  steps.exchanges = exchanges;
  return steps;
}

function additionSteps(c) {
  const { columns, top, bottom } = c;
  const steps = [{ kind: 'start', sentence: `Here are ${Number(top).toLocaleString('en-GB')} and ${Number(bottom).toLocaleString('en-GB')}.` }];
  const exchanges = [];
  let incoming = 0;
  for (let i = columns.length - 1; i >= 0; i -= 1) {
    const col = columns[i];
    const a = digitAt(top, columns, col);
    const b = digitAt(bottom, columns, col);
    const total = a + b + incoming;
    if (a + b + incoming === 0 && i < columns.length - 1 && columns.slice(0, i + 1).every((x) => digitAt(top, columns, x) + digitAt(bottom, columns, x) === 0)) break;
    const parts = [plural(a, col), plural(b, col)].concat(incoming ? [`the exchanged ${WORD[col]}`] : []);
    steps.push({ kind: 'join', column: col, sentence: `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]} make ${plural(total, col)}.` });
    incoming = 0;
    if (total >= 10 && i > 0) {
      const to = columns[i - 1];
      const k = exchanges.length;
      exchanges.push({ from: col, to, k });
      steps.push({ kind: 'move', exchange: k, from: col, to, sentence: `10 ${WORD[col]}s make 1 ${WORD[to]}, so they move into the ${WORD[to]}s.` });
      steps.push({ kind: 'break', exchange: k, from: col, to, sentence: `The 10 ${WORD[col]}s become 1 ${WORD[to]}. ${plural(total - 10, col)} ${total - 10 === 1 ? 'is' : 'are'} left.` });
      incoming = 1;
    }
  }
  steps[steps.length - 1].sentence += ` ${Number(top).toLocaleString('en-GB')} + ${Number(bottom).toLocaleString('en-GB')} = ${Number(c.answer).toLocaleString('en-GB')}.`;
  steps.exchanges = exchanges;
  return steps;
}

// Which step a spec asks for, as an index, and whether it is the paper still.
function stepIndex(c, steps) {
  const s = c.step;
  if (s === 'end') return { index: steps.length - 1 };
  if (s == null || s === 'exchange') {
    const k = steps.findIndex((x) => x.kind === 'break');
    if (k === -1) return { index: steps.length - 1 };
    // The still: the move's outline and arrow with what it became landed.
    return { index: k, still: true };
  }
  const n = Number(s);
  if (!Number.isInteger(n) || n < 0 || n >= steps.length) {
    refuse(`"step" is ${JSON.stringify(s)}; this sum has steps 0 to ${steps.length - 1} (or "exchange", or "end").`);
  }
  return { index: n };
}

// ─── the pieces at every step ───────────────────────────────────────────────
// Every piece that ever exists has a stable id. At each step it has a slot in a
// column (or a landing place), a colour, and whether it is shown, faded, hidden
// under the piece it will come out of, or gone.

function simulate(c, steps) {
  const sub = c.operator === '−';
  const pieces = new Map();
  const madeFrom = new Map();
  const add = (id, column, extra = {}) => {
    const p = { id, column, value: column, ...extra };
    pieces.set(id, p);
    return p;
  };
  // Per step: id -> { column, slot, landing, state, colour }
  const frames = [];
  const at = new Map();
  const set = (id, s) => at.set(id, { ...(at.get(id) || {}), ...s });
  const live = (column) => [...at.entries()].filter(([, s]) => s.column === column && s.state === 'shown' && s.group !== 'bottom').map(([id]) => id);
  const slotOf = (id) => at.get(id).slot;

  c.shown.forEach((col) => {
    const a = digitAt(c.top, c.columns, col);
    for (let j = 0; j < a; j += 1) { add(`${col}-${j}`, col); set(`${col}-${j}`, { column: col, slot: j, state: 'shown', group: 'top' }); }
    if (!sub) {
      const b = digitAt(c.bottom, c.columns, col);
      for (let j = 0; j < b; j += 1) { add(`${col}-b${j}`, col); set(`${col}-b${j}`, { column: col, slot: j, state: 'shown', group: 'bottom' }); }
    }
  });
  const snap = () => frames.push(new Map([...at.entries()].map(([id, s]) => [id, { ...s }])));

  steps.forEach((step, n) => {
    if (step.kind === 'move' && sub) {
      // The piece with the highest slot in the giving column lifts across.
      const giving = live(step.from).sort((x, y) => slotOf(y) - slotOf(x))[0];
      const landing = live(step.to).length;
      set(giving, { column: step.to, slot: null, landing, moved: step.exchange, from: { column: step.from, slot: slotOf(giving) } });
      step.piece = giving;
      // Its ten pieces wait under it, so on the board they come out of it.
      for (let j = 0; j < 10; j += 1) {
        const id = `${step.to}-x${step.exchange}-${j}`;
        add(id, step.to, { child: giving, exchange: step.exchange });
        set(id, { column: step.to, slot: null, under: giving, state: 'hidden', exchange: step.exchange });
      }
    } else if (step.kind === 'break' && sub) {
      const parent = steps[n - 1].piece;
      const base = at.get(parent).landing;
      set(parent, { state: 'gone' });
      for (let j = 0; j < 10; j += 1) set(`${step.to}-x${step.exchange}-${j}`, { slot: base + j, under: null, state: 'shown' });
    } else if (step.kind === 'take') {
      // The bottom number's worth fades where it stands, the highest slots first.
      live(step.column).sort((x, y) => slotOf(y) - slotOf(x)).slice(0, step.take).forEach((id) => set(id, { state: 'faded' }));
    } else if (step.kind === 'join') {
      // The bottom number's pieces (and an exchanged one waiting) slide into the
      // free slots after the top number's.
      let next = live(step.column).filter((id) => at.get(id).slot != null).length;
      [...at.entries()].filter(([, s]) => s.column === step.column && s.state === 'shown' && s.group === 'bottom').sort((x, y) => x[1].slot - y[1].slot)
        .forEach(([id]) => { set(id, { slot: next, group: 'top' }); next += 1; });
      [...at.entries()].filter(([, s]) => s.column === step.column && s.state === 'shown' && s.landing != null && s.group !== 'bottom')
        .forEach(([id]) => { set(id, { slot: next, landing: null }); next += 1; });
    } else if (step.kind === 'move' && !sub) {
      // Ten of the joined pieces, the last ten, gather and move as a stack.
      const all = live(step.from).sort((x, y) => slotOf(x) - slotOf(y));
      const ten = all.slice(all.length - 10);
      step.pieces = ten;
      ten.forEach((id, j) => set(id, { column: step.to, slot: null, landing: 'stack', stack: j, moved: step.exchange, from: { column: step.from, slot: slotOf(id) } }));
    } else if (step.kind === 'break' && !sub) {
      const made = `${step.to}-x${step.exchange}`;
      add(made, step.to, { exchange: step.exchange });
      madeFrom.set(made, steps[n - 1].pieces.slice());
      steps[n - 1].pieces.forEach((id) => set(id, { state: 'gone' }));
      set(made, { column: step.to, slot: null, landing: 'stack', state: 'shown', exchange: step.exchange, group: 'top' });
    }
    // An outline is drawn only on the step that moved the piece.
    for (const [id, s] of at.entries()) {
      if (s.from && !(step.kind === 'move' && (step.piece === id || (step.pieces || []).includes(id)))) set(id, { from: null });
    }
    snap();
  });
  return { pieces, frames, made: madeFrom };
}

// ─── layout ─────────────────────────────────────────────────────────────────

// How much room each column needs, read off every step of the run, so a column
// is as big as its busiest moment and never changes size between clicks.
function columnShape(c, sim) {
  const sub = c.operator === '−';
  const shape = {};
  c.shown.forEach((col) => {
    const rods = c.pieces === 'blocks' && col === 'T';
    const a = digitAt(c.top, c.columns, col);
    const b = sub ? 0 : digitAt(c.bottom, c.columns, col);
    let most = 0;
    let lands = false;
    sim.frames.forEach((f) => {
      for (const [, st] of f) {
        if (st.column !== col || st.state === 'gone') continue;
        if (st.slot != null && st.group !== 'bottom') most = Math.max(most, st.slot + 1);
        if (st.landing != null) lands = true;
        if (st.landing != null && st.landing !== 'stack') most = Math.max(most, st.landing + 1);
      }
    });
    if (rods) {
      // Before addition's join the bottom number's rods stand after a gap, and
      // an exchanged one lands after another.
      const slots = sub ? Math.max(1, most) : Math.max(1, a + b + (lands ? 1 : 0));
      shape[col] = { kind: 'rods', slots, a, b, lands: !sub && lands };
      return;
    }
    const per = c.perRow || GRID_COLS;
    const topRows = Math.ceil(a / per);
    const bottomRows = Math.ceil(b / per);
    const rows = Math.max(1, Math.ceil(most / per), topRows + bottomRows);
    // A rod that lands in the blocks' ones, or a gathered ten that lands in an
    // addition's column, stands in a strip at the column's right.
    const strip = lands && (c.pieces === 'blocks' || !sub);
    shape[col] = { kind: 'grid', rows, topRows, bottomRows, gap: bottomRows > 0, strip };
  });
  return shape;
}

function measure(c, U, profile, shape) {
  const head = Math.max(profile.minFontPt, Math.min(profile.fontPt, 0.62 * U));
  const headH = Math.max(HEAD_H * U, head * 1.7);
  const cols = c.shown.map((col) => {
    const s = shape[col];
    if (s.kind === 'rods') {
      const gaps = (s.b ? 1 : 0) + (s.lands ? 1 : 0);
      const w = s.slots * ROD_PITCH * U + gaps * GROUP_GAP * ROD_PITCH * U + 2 * COL_PAD * U;
      return { col, ...s, w, bodyH: 10 * U + 2 * COL_PAD * U };
    }
    const stripW = s.strip ? (c.pieces === 'blocks' ? 1.6 : 1.5) * U : 0;
    const w = (c.perRow || GRID_COLS) * PITCH * U + 2 * COL_PAD * U + stripW;
    const pile = s.strip && c.pieces === 'counters' ? 1.2 * U : 0;
    const bodyH = Math.max(s.rows * PITCH * U + (s.gap ? GROUP_GAP * U : 0), pile + PITCH * U) + 2 * COL_PAD * U;
    return { col, ...s, w, bodyH, stripW };
  });
  const rodTall = c.pieces === 'blocks' && cols.some((k) => k.kind === 'rods' || k.strip) ? 10 * U + 2 * COL_PAD * U : 0;
  const tallest = Math.max(rodTall, ...cols.map((x) => x.bodyH));
  let x = 0;
  cols.forEach((k) => { k.x = x; x += k.w; });
  return { U, head, headH, bodyH: tallest, cols, w: x, h: headH + tallest };
}

// Where a piece stands, as its top-left corner and size.
function placeOf(L, c, s) {
  const U = L.U;
  const col = L.cols.find((k) => k.col === s.column);
  const top = L.headH + COL_PAD * U;
  const left = col.x + COL_PAD * U;
  if (col.kind === 'rods') {
    const rodX = (slot, gaps) => left + slot * ROD_PITCH * U + gaps * GROUP_GAP * ROD_PITCH * U + (ROD_PITCH - 1) * U / 2;
    if (s.landing === 'stack') {
      // Ten cubes gathered into a rod's shape where the exchanged ten will be.
      const x = rodX(col.a + col.b, (col.b ? 1 : 0) + 1);
      if (s.stack != null) return { x, y: top + s.stack * U, w: U, h: U, kind: 'cube' };
      return { x, y: top, w: U, h: 10 * U, kind: 'rod' };
    }
    const bottom = s.group === 'bottom';
    const slot = bottom ? col.a + (s.slot || 0) : s.slot;
    return { x: rodX(slot, bottom ? 1 : 0), y: top, w: U, h: 10 * U, kind: 'rod' };
  }
  const piece = c.pieces === 'blocks' ? 'cube' : 'counter';
  const stripX = col.x + col.w - COL_PAD * U - (c.pieces === 'blocks' ? U : 1.25 * U);
  if (c.pieces === 'blocks' && s.landing != null && s.landing !== 'stack') {
    // A rod landed in the ones before it breaks, at the right of the column.
    return { x: stripX, y: top, w: U, h: 10 * U, kind: 'rod' };
  }
  if (s.landing === 'stack') {
    // A gathered ten: counters as a small pile in the strip.
    const j = s.stack == null ? 0 : s.stack;
    return { x: stripX + (j % 2) * 0.12 * U, y: top + (9 - j) * 0.12 * U, w: U, h: U, kind: piece };
  }
  const grid = (slot, bottomBand) => ({
    x: left + (slot % (c.perRow || GRID_COLS)) * PITCH * U + (PITCH - 1) * U / 2,
    y: top + Math.floor(slot / (c.perRow || GRID_COLS)) * PITCH * U + (PITCH - 1) * U / 2 + (bottomBand ? col.topRows * PITCH * U + GROUP_GAP * U : 0),
    w: U, h: U, kind: piece,
  });
  if (s.landing != null) return grid(s.landing, false);
  return grid(s.slot, s.group === 'bottom');
}

// ─── drawing ────────────────────────────────────────────────────────────────

function paletteFor(profile) {
  const ink = profile.palette === 'ink';
  return {
    ink,
    exchange: (k) => (ink ? INK_EXCHANGE : EXCHANGE_COLOURS)[k % EXCHANGE_COLOURS.length],
    head: (col) => (ink ? INK_TONES.pale : COLUMN_COLOURS[col][0]),
    body: (col) => (ink ? '#FFFFFF' : COLUMN_COLOURS[col][1]),
    counter: (col) => (ink ? INK_TONES.light : COLUMN_COLOURS[col][0]),
    faceInk: INK,
  };
}

// A piece as plain shapes: a counter is a circle with its value on, a cube a
// square, a rod ten cubes in a box. The same shapes are written as SVG for paper
// and handed to the board as PowerPoint shapes, so the picture is one drawing
// and on the board every cube is its own shape PowerPoint can move.
function pieceShapes(kind, place, column, fill, U, opacity, name, cubeNames) {
  const sw = Math.max(0.8, STROKE * U);
  if (kind === 'counter') {
    const face = VALUE[column];
    const pt = Math.max(MIN_FACE_PT, Math.min(0.5 * U, (U * COUNTER_FACE) / Math.max(0.6, textWidthEm(face, true))));
    return [{ name, kind: 'ellipse', x: place.x, y: place.y, w: U, h: U, fill, line: INK, lineW: sw, text: face, textPt: pt, opacity }];
  }
  if (kind === 'rod') {
    const out = [];
    for (let j = 0; j < 10; j += 1) {
      out.push({ name: cubeNames ? cubeNames[j] : `${name}-c${j}`, kind: 'rect', x: place.x, y: place.y + j * U, w: U, h: U, fill, line: fill === BLOCK_FILL ? FINE : INK, lineW: sw * 0.6, opacity });
    }
    out.push({ name: `${name}-box`, kind: 'rect', x: place.x, y: place.y, w: U, h: 10 * U, fill: null, line: INK, lineW: sw, opacity });
    return out;
  }
  return [{ name, kind: 'rect', x: place.x, y: place.y, w: U, h: U, fill, line: INK, lineW: sw, opacity }];
}

function shapeSvg(d, font) {
  const op = d.opacity < 1 ? ` opacity="${f2(d.opacity)}"` : '';
  const fill = d.fill || 'none';
  const dash = d.dash ? ` stroke-dasharray="${f2(d.lineW * 2.4)} ${f2(d.lineW * 1.5)}"` : '';
  if (d.kind === 'ellipse') {
    const r = d.w / 2;
    const face = d.text
      ? `<text x="${f2(d.x + r)}" y="${f2(d.y + r + d.textPt * 0.35)}" text-anchor="middle" font-family="${font}" font-size="${f2(d.textPt)}" font-weight="bold" fill="${INK}">${d.text}</text>`
      : '';
    return `<g${op}><circle cx="${f2(d.x + r)}" cy="${f2(d.y + r)}" r="${f2(r - d.lineW / 2)}" fill="${fill}" stroke="${d.line}" stroke-width="${f2(d.lineW)}"${dash}/>${face}</g>`;
  }
  return `<rect${op} x="${f2(d.x)}" y="${f2(d.y)}" width="${f2(d.w)}" height="${f2(d.h)}" fill="${fill}" stroke="${d.line}" stroke-width="${f2(d.lineW)}"${dash}/>`;
}

function ghostShape(place, kind, colour, U, name) {
  const lineW = Math.max(1, ARROW_W * U * 0.7);
  return { name, kind: kind === 'counter' ? 'ellipse' : 'rect', x: place.x, y: place.y, w: place.w, h: place.h, fill: null, line: colour, lineW, dash: true, opacity: 1 };
}

function arrowSvg(from, to, colour, U) {
  const sw = Math.max(2, ARROW_W * U);
  const x1 = from.x + from.w / 2;
  const y1 = from.y + Math.min(from.h, U) / 2;
  const x2 = to.x + to.w / 2;
  const y2 = to.y + Math.min(to.h, U) / 2;
  const head = sw * 3.2;
  // A gentle arc over the pieces, ending short of the piece it points at.
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - 1.4 * U;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const ex = x2 - Math.cos(ang) * (U * 0.75);
  const ey = y2 - Math.sin(ang) * (U * 0.75);
  const hx = ex - Math.cos(ang) * head;
  const hy = ey - Math.sin(ang) * head;
  const nx = -Math.sin(ang) * head * 0.55;
  const ny = Math.cos(ang) * head * 0.55;
  return `<path d="M${f2(x1)} ${f2(y1)} Q${f2(mx)} ${f2(my)} ${f2(hx)} ${f2(hy)}" fill="none" stroke="${colour}" stroke-width="${f2(sw)}" stroke-linecap="round"/>` +
    `<polygon points="${f2(ex)},${f2(ey)} ${f2(hx + nx)},${f2(hy + ny)} ${f2(hx - nx)},${f2(hy - ny)}" fill="${colour}"/>`;
}

// The written sum at a step, in the place value chart's own drawing.
function sumSpec(c, steps, index, still, pal) {
  const sub = c.operator === '−';
  // `"sum": "teacher"`: the pieces move and the written sum stays as it was
  // set, for the teacher to write on as each piece moves. A sum that filled
  // itself left nothing to model: the teacher, 19 October 2026, after teaching
  // from one, "I couldn't really write over it" while the counters moved. The
  // band above the digits is kept, so the marks have room.
  if (c.writes === 'teacher') {
    return {
      columns: c.columns,
      calculation: { operator: sub ? '-' : '+', numbers: [c.top, c.bottom], answer: c.columns.map(() => ''), ...(sub ? { exchangeBand: true } : {}) },
    };
  }
  const answer = c.columns.map(() => '');
  const exchanges = [];
  const carry = {};
  const carryColours = {};
  steps.slice(0, index + 1).forEach((s, n) => {
    if ((s.kind === 'take' || s.kind === 'join') && !(n === index && still)) {
      if (s.kind === 'take' || !steps[n + 1] || steps[n + 1].kind !== 'move') {
        answer[c.columns.indexOf(s.column)] = String(digitAt(c.answer, c.columns, s.column));
      }
    }
    if (s.kind === 'move' && !sub) {
      // 7 + 5 = 12: the 2 is written and the exchanged 1 under the tens.
      answer[c.columns.indexOf(s.from)] = String(digitAt(c.answer, c.columns, s.from));
      carry[s.to] = '1';
      carryColours[s.to] = pal.exchange(s.exchange);
    }
    if (s.kind === 'rest' && !(n === index && still)) {
      s.columns.forEach((col) => { answer[c.columns.indexOf(col)] = String(digitAt(c.answer, c.columns, col)); });
    }
    if (s.kind === 'move' && sub) exchanges.push({ from: s.from, to: s.to, colour: pal.exchange(s.exchange).slice(1), receives: false });
    if (s.kind === 'break' && sub) exchanges[exchanges.length - 1].receives = true;
  });
  if (still && sub && exchanges.length) exchanges[exchanges.length - 1].receives = true;
  const calculation = {
    operator: sub ? '-' : '+',
    numbers: [c.top, c.bottom],
    answer,
    ...(sub ? { exchanges: exchanges.map(({ receives, ...e }) => (receives ? e : { ...e, receives })), exchangeBand: true } : { carry, carryColours }),
  };
  // It fills itself one click at a time, so nobody writes in its blank cells.
  return { columns: c.columns, inBooks: true, calculation };
}

// The smallest a piece may be: a cube still a cube; a counter still carrying its
// biggest value (1000 on a thousands counter) at a readable size.
function pieceFloor(c) {
  if (c.pieces === 'blocks') return MIN_BLOCK_PT;
  const widest = Math.max(...c.shown.map((col) => textWidthEm(VALUE[col], true)));
  return Math.max(MIN_COUNTER_PT, (MIN_FACE_PT * widest) / COUNTER_FACE);
}

// The sum's profile. On paper it prints a little larger than a sum on its own,
// so the small exchanged 1, a little over half a digit, still clears the
// sheet's 9pt floor: it is the mark this picture is about.
const PAPER_SUM_FONT_PT = 13;
function sumProfile(profile, w, h) {
  const paper = !profile.heightPt;
  return { ...profile, widthPt: w, heightPt: h, ...(paper ? { fontPt: Math.max(profile.fontPt, PAPER_SUM_FONT_PT) } : {}) };
}

function fitWith(c, sim, steps, pal, profile, inner, natural, floor, below) {
  const shape = columnShape(c, sim);
  const sumAt = (h, w) => placeValue.tightSvg(sumSpec(c, steps, steps.length - 1, false, pal), sumProfile(profile, w, h));
  let sumBox = null;
  const at = (U) => {
    const chart = measure(c, U, profile, shape);
    let sum;
    try {
      // The sum stands as tall as the chart, or as much taller as its readable
      // floor needs, in about a third of the width: sized to the chart, not
      // to the zone, so it never dwarfs the pieces it is written beside.
      // On paper, which grows downwards, the sum takes its own natural size.
      // Under the chart it may be as wide as the zone and as tall as the room left.
      let h = inner.heightPt ? (below ? Math.min(chart.h, Math.max(40, inner.heightPt - chart.h - SUM_GAP * U)) : chart.h) : null;
      const ceiling = inner.heightPt ? (below ? Math.max(h, inner.heightPt - chart.h - SUM_GAP * U) : inner.heightPt) : chart.h * 3;
      for (;;) {
        try { sum = sumAt(h, below ? inner.widthPt : inner.widthPt * 0.32); break; } catch (err) {
          if (!/DOES_NOT_FIT|TOO_NARROW/.test(err.message) || h == null || h >= ceiling) throw err;
          h = Math.min(ceiling, h * 1.12);
        }
      }
    } catch (err) {
      sum = { w: inner.widthPt, h: chart.h * 2 };
    }
    sumBox = sum;
    if (below) return { ...chart, chartW: chart.w, sumW: sum.w, sumH: sum.h, below: true, w: Math.max(chart.w, sum.w), h: chart.h + SUM_GAP * U + sum.h };
    return { ...chart, chartW: chart.w, sumW: sum.w, sumH: sum.h, w: chart.w + SUM_GAP * U + sum.w, h: Math.max(chart.h, sum.h) };
  };
  const fit = fitUnit(at, inner, natural, floor);
  return { ...fit, need: fit.fits ? null : at(floor) };
}

function layout(spec, profile) {
  const c = normalise(spec);
  const steps = stepsFor(c);
  const { index, still } = stepIndex(c, steps);
  const sim = simulate(c, steps);
  const pal = paletteFor(profile);
  const bleed = 3;
  const inner = insetProfile(profile, bleed);
  const floor = pieceFloor(c);
  const natural = c.pieces === 'blocks' ? NATURAL_PT * 0.55 : NATURAL_PT;
  // The sum is laid out at the height of the chart, beside it; the pair is fitted
  // together so both grow and shrink as one.
  // A slide zone is usually wider than it is tall, but a row of three columns
  // of counters can be the other way about: counters then stand four or three
  // to a row, whichever lets them be largest. Ten in two rows of five reads as
  // ten most easily, so five is kept whenever it does as well.
  // The sum stands beside the chart, or under it where a zone has height to
  // spare and that lets the pieces be larger (a half-width box on a slide).
  let best = null;
  for (const below of inner.heightPt ? [false, true] : [false]) {
    for (const per of c.pieces === 'counters' ? [5, 4, 3] : [5]) {
      c.perRow = per;
      const tried = fitWith(c, sim, steps, pal, profile, inner, natural, floor, below);
      if (tried.fits && (!best || !best.fits || tried.layout.U > best.layout.U * 1.04)) best = { ...tried, per };
      if (!best) best = { ...tried, per };
    }
  }
  c.perRow = best.per;
  const fit = best;
  if (!fit.fits) {
    throw new Error(
      `EXCHANGE_HAPPENING_DOES_NOT_FIT: this sum shown happening needs at least ${(fit.need.w / 72).toFixed(2)}in x ${(fit.need.h / 72).toFixed(2)}in ` +
        `for its ${c.pieces} and written sum to stay readable. Give it a wider or taller zone.`
    );
  }
  const L = fit.layout;
  return { c, steps, index, still, sim, pal, L, bleed, profile };
}

function frameParts(c, L, pal, profile) {
  const parts = [];
  const sw = Math.max(1, L.U * 0.05);
  L.cols.forEach((k) => {
    parts.push(`<rect x="${f2(k.x)}" y="0" width="${f2(k.w)}" height="${f2(L.headH)}" fill="${pal.head(k.col)}" stroke="${INK}" stroke-width="${f2(sw)}"/>`);
    parts.push(`<rect x="${f2(k.x)}" y="${f2(L.headH)}" width="${f2(k.w)}" height="${f2(L.bodyH)}" fill="${pal.body(k.col)}" stroke="${INK}" stroke-width="${f2(sw)}"/>`);
    parts.push(`<text x="${f2(k.x + k.w / 2)}" y="${f2(L.headH / 2 + L.head * 0.35)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(L.head)}" font-weight="bold" fill="${INK}">${k.col}</text>`);
  });
  return parts;
}

// Everything at one step: the shapes in drawing order, and the arrow.
function partsAt(model) {
  const { c, steps, index, still, sim, pal, L } = model;
  const frame = sim.frames[index];
  const U = L.U;
  const shapes = [];
  let arrow = null;
  const fillOf = (id, s) => {
    const p = sim.pieces.get(id);
    const k = s.moved != null ? s.moved : p.exchange != null ? p.exchange : null;
    if (k != null) return pal.exchange(k);
    return c.pieces === 'blocks' ? BLOCK_FILL : pal.counter(p.value);
  };
  const childrenOf = (id) => [...sim.pieces.values()].filter((q) => q.child === id).map((q) => q.id);
  // A rod's cubes carry the names of the ten ones it is, or will be: the rod a
  // subtraction breaks comes apart into them, and the rod an addition makes is
  // the ten ones it gathered, so on the board the very same cubes move.
  const cubeNamesOf = (id) => {
    const kids = childrenOf(id);
    if (kids.length === 10) return kids.map((k) => `!!xh-${k}`);
    const made = sim.made && sim.made.get(id);
    return made ? made.map((k) => `!!xh-${k}`) : null;
  };
  const blocks = c.pieces === 'blocks';
  // Hidden pieces first, so the piece they will come out of covers them.
  const order = [...frame.entries()].sort((a, b) => (a[1].state === 'hidden' ? 0 : 1) - (b[1].state === 'hidden' ? 0 : 1));
  const drawn = new Set();
  for (const [id, s] of order) {
    if (s.state === 'gone') continue;
    const p = sim.pieces.get(id);
    if (s.state === 'hidden') {
      // A ten's cubes ARE the rod's cubes, drawn with it; a counter's ten ones
      // wait stacked behind it, on the board only.
      if (blocks || !model.layered) continue;
      const pp = placeOf(L, c, frame.get(s.under));
      shapes.push(...pieceShapes('counter', pp, p.value, fillOf(id, s), U, 1, `!!xh-${id}`));
      continue;
    }
    const place = placeOf(L, c, s);
    const opacity = s.state === 'faded' ? FADED : 1;
    if (place.kind === 'rod') {
      const names = cubeNamesOf(id);
      if (names) names.forEach((n) => drawn.add(n));
      shapes.push(...pieceShapes('rod', place, p.value, fillOf(id, s), U, opacity, `!!xh-${id}`, names));
    } else {
      shapes.push(...pieceShapes(place.kind, place, p.value, fillOf(id, s), U, opacity, `!!xh-${id}`));
    }
  }
  const outlineStep = still ? index - 1 : index;
  const outFrame = sim.frames[outlineStep];
  const step = steps[outlineStep];
  if (step && step.kind === 'move') {
    const moved = step.piece ? [step.piece] : step.pieces;
    const colour = pal.exchange(step.exchange);
    let fromBox = null;
    let toBox = null;
    moved.forEach((id, j) => {
      const s = outFrame.get(id);
      const old = placeOf(L, c, { ...s, column: s.from.column, slot: s.from.slot, landing: null, stack: null, group: 'top' });
      shapes.push(ghostShape(old, old.kind, colour, U, `!!xh-ghost-${j}`));
      if (!fromBox) fromBox = old;
      toBox = toBox || placeOf(L, c, s);
    });
    if (blocks && c.operator === '+') toBox = placeOf(L, c, { column: step.to, landing: 'stack' });
    arrow = { name: '!!xh-arrow', svg: arrowSvg(fromBox, toBox, colour, U) };
  }
  // A shape drawn twice under one name would be two shapes PowerPoint cannot tell
  // apart: the last one wins.
  const seen = new Map();
  shapes.forEach((d) => seen.set(d.name, d));
  return { shapes: [...seen.values()], arrow };
}

function render(spec, profile, layered) {
  const model = layout(spec, profile);
  model.layered = layered;
  const { L, bleed, c, steps, index, still, pal } = model;
  const sumBuilt = placeValue.tightSvg(sumSpec(c, steps, index, still, pal), sumProfile(profile, L.sumW + 0.5, Math.max(L.sumH, L.h) + 0.5));
  const chartH = L.headH + L.bodyH;
  let W, H, sumX, sumY, chartX, chartY;
  if (L.below) {
    W = Math.max(L.chartW, sumBuilt.w);
    H = chartH + SUM_GAP * L.U + sumBuilt.h;
    chartX = (W - L.chartW) / 2;
    chartY = 0;
    sumX = (W - sumBuilt.w) / 2;
    sumY = chartH + SUM_GAP * L.U;
  } else {
    W = L.w;
    H = Math.max(chartH, sumBuilt.h);
    chartX = 0;
    chartY = (H - chartH) / 2;
    sumX = W - sumBuilt.w;
    sumY = (H - sumBuilt.h) / 2;
  }
  const frame = frameParts(c, L, pal, profile).join('');
  const parts = partsAt(model);
  return { model, W, H, sumBuilt, sumX, sumY, chartX, chartY, frame, parts };
}

function inner(svg) {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
}

function viewBoxOf(svg) {
  const m = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg);
  return m ? m.slice(1).map(Number) : [0, 0, 0, 0];
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
  const r = render(spec, profile, false);
  const b = r.model.bleed;
  const [vx, vy] = viewBoxOf(r.sumBuilt.svg);
  const pieces = r.parts.shapes.map((d) => shapeSvg(d, profile.font)).join('') + (r.parts.arrow ? r.parts.arrow.svg : '');
  const body = [
    `<g transform="translate(${f2(r.chartX)} ${f2(r.chartY)})">${r.frame}${pieces}</g>`,
    `<g transform="translate(${f2(r.sumX - vx)} ${f2(r.sumY - vy)})">${inner(r.sumBuilt.svg)}</g>`,
  ].join('');
  const w = r.W + 2 * b;
  const h = r.H + 2 * b;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(w)}" height="${f2(h)}" viewBox="${f2(-b)} ${f2(-b)} ${f2(w)} ${f2(h)}">${body}</svg>`;
  return { svg, w, h, aspect: w / h, layout: { steps: r.model.steps.length, step: r.model.index, pieces: r.model.c.pieces, U: r.model.L.U } };
}

// The same picture in parts, for the board: the frame and the sum as pictures
// (each the size of the whole drawing, so they cannot drift), the arrow as a
// picture, and every piece and outline as a shape in points from the drawing's
// top-left. A shape keeps its name on every step, which is how PowerPoint's
// Morph knows it is the same piece and moves it.
function slideLayers(spec = {}, profile) {
  const r = render(spec, profile, true);
  const b = r.model.bleed;
  const w = r.W + 2 * b;
  const h = r.H + 2 * b;
  const wrap = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(w)}" height="${f2(h)}" viewBox="${f2(-b)} ${f2(-b)} ${f2(w)} ${f2(h)}">${body}</svg>`;
  const [vx, vy] = viewBoxOf(r.sumBuilt.svg);
  const pictures = [
    { name: '!!xh-frame', svg: wrap(`<g transform="translate(${f2(r.chartX)} ${f2(r.chartY)})">${r.frame}</g>`) },
    { name: '!!xh-sum', svg: wrap(`<g transform="translate(${f2(r.sumX - vx)} ${f2(r.sumY - vy)})">${inner(r.sumBuilt.svg)}</g>`) },
  ];
  if (r.parts.arrow) pictures.push({ name: r.parts.arrow.name, svg: wrap(`<g transform="translate(${f2(r.chartX)} ${f2(r.chartY)})">${r.parts.arrow.svg}</g>`), front: true });
  const shapes = r.parts.shapes.map((d) => ({ ...d, x: d.x + r.chartX + b, y: d.y + r.chartY + b }));
  return { w, h, aspect: w / h, pictures, shapes, font: profile.font, steps: r.model.steps.length, step: r.model.index };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
  const c = normalise(spec);
  return `exchange-happening:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${c.operator}${c.top}:${c.bottom}:${c.pieces}:${c.writes}:${c.step == null ? '-' : c.step}`;
}

function minWidthPt(spec = {}, profileOrSurface = 'worksheets') {
  const profile = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, { widthPt: 500 }) : profileOrSurface;
  const c = normalise(spec);
  const sim = simulate(c, stepsFor(c));
  const U = pieceFloor(c);
  return measure(c, U, profile, columnShape(c, sim)).w * 1.6 + 12;
}

module.exports = { tightSvg, slideLayers, stepsFor, cacheKey, normalise, minWidthPt, EXCHANGE_COLOURS };
