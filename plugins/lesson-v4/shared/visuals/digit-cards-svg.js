'use strict';

// THE digit cards: a number drawn large as a row of cards, one digit each, with
// the working of a digit-based check marked on the number itself. One drawing,
// placed by the board, the worksheet, the working wall and the stick-in pack.
//
// It was built from a Year 6 divisibility wall the teacher said he would "100%
// have up" (2 October 2026), because of "the number cards, the lines, the
// arrows, the different colours". Its four figures are what this draws from
// fields: 77 with an arc between its two 7s marked "same!"; 316 with the 3
// greyed and the 16 boxed as "last two digits: 16", an arrow down to "half of 16
// is 8"; 5,463 with + between its cards and lines joining to "digit sum: 18";
// 114 with its 4 outlined orange as the even digit and a bracket under all
// three. The same moves serve any lesson that reads a number digit by digit:
// rounding ("look at the digit to the right"), place value (the digit that
// changed), digit sums. It is not a sheet of words: the digits a step looks at
// are boxed or coloured, and the working runs off them.
//
// It also draws the worksheet's older loose `digits` row ("here are four digit
// cards"), which the sheet set as typed boxes until this became its picture:
// the same cards, spaced apart so they read as cards to arrange, not a number.
//
// Marks NAME the digits they mark (a position, counting digits from the left,
// or "last 2"), never a point on the drawing, so they stay on their digits
// whatever size the number is laid out at.
//
//   tightSvg(spec, profile)     -> { svg, w, h, aspect, layout, anchors }
//   cacheKey(spec, profile)     -> string
//   describeLayout(spec, profile) -> where every card, mark, label and line went
//   maxWidthPt(spec, profile)   -> the widest this drawing ever uses
//
// Spec:
//   value     the number, as children write it: "5,463", "316", "3.47". A
//             string prints exactly as given (commas and a decimal point are
//             drawn between the cards); a JS number gets commas from 1,000.
//             Not `number`, which a worksheet reads as the question number.
//   digits    instead of `value`: loose cards to make numbers from, [0, 3, 4,
//             7]. "" leaves a card empty.
//   marks     what is marked on the digits. Each:
//               digits  which: a position from the left (1 is the first digit),
//                       a list [2, 3], or "first", "last", "first 2", "last 2",
//                       "all"
//               style   box (one box round a run of cards), ring, outline (the
//                       card's own edge in the colour), dim (greyed: a digit the
//                       step ignores), colour (the digit itself in the colour),
//                       none (only a label or note). Default outline.
//               colour  blue | purple | green | orange | grey | ink. Default:
//                       blue, or grey for dim.
//               label   words under the marked digits ("last two digits: 16").
//               note    a short word beside the marked digits ("even ✓"): in the
//                       side margin when the mark reaches that end of the
//                       number, otherwise under it with the labels.
//               id      a name for a step pin (default "mark 1", "mark 2"...).
//             "" for a label or note leaves a ruled line for the child.
//   bracket   { digits, label, colour }: a bracket under a run of cards, with
//             its label beneath ("2 digits", "1 + 1 + 4 = 6").
//   arc       { from, to, label, colour }: an arrow arcing over the cards from
//             one digit to another, its label above ("same!"). Default orange.
//   sum       { label, colour }: + signs between every card and lines from each
//             card joining at one total beneath ("digit sum: 18").
//   working   lines beneath, in order. Each { text, colour, arrow, beside }:
//             `arrow: true` draws a down arrow into this line from what is above
//             it; `beside: true` sets it beside the line before, so two checks
//             sit side by side in columns. A line meaning yes is colour green.
//   text      the question above the cards ("Is 316 divisible by 4?"), drawn
//             at the same size as the drawing's other words on every surface.
//   callouts  the wall's step pins ({ part, step }). The drawing leaves room
//             for a pin beside each part a step names, so the pin sits next to
//             the words rather than on them. Parts: "card 1"..., each mark's
//             id, "bracket", "arc", "sum", "working 1"...
//
// A tick (✓) anywhere prints in answer green, because a tick is a yes.

const T = require('./figure-text');
const { INK_TONES } = require('./surface-profiles');

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
// The words print at `tp` points; the digits at DIGIT_EM of the unit, so they
// stay large beside the words they are explained by. Card sizes are in digit
// sizes (D); everything else in word sizes (tp).
const DIGIT_EM = 3;            // digit size as a multiple of the unit
const DIGIT_EM_TIGHT = [2.2, 1.6]; // smaller digits tried, in turn, before refusing
const TEXT_GROW_MAX = 1.2;     // words stop growing at this share of the surface's size
const CARD_W = 1.08;           // card width, in D
const CARD_H = 1.3;            // card height, in D
const CARD_R = 0.12;           // corner radius, in D
const CARD_STROKE = 0.055;     // card edge, in D
const DIGIT_BASE = 0.5;        // baseline below the card's middle, in D (a digit inks ~0.72 D)
const GAP = 0.2;               // between the cards of one number, in D
const LOOSE_GAP = 0.5;         // between loose cards
const SEP_GAP = 0.42;          // the gap that holds a comma or decimal point
const SEP_SIZE = 0.6;          // a comma or decimal point, in D
const PLUS_GAP = 0.55;         // the gap that holds a + in a digit sum
const PLUS_SIZE = 0.36;        // the + sign, in D
const MARK_PAD = 0.1;          // a box or ring outside its cards, in D
const RING_X = 1.16;           // a ring's half-width over its cards' half-width
const RING_Y = 1.1;            // and its half-height over theirs
const MARK_CLEAR = 0.07;       // a box or ring to the next card, in D
const MARK_STROKE = 0.07;      // a box, ring or outline, in D
const DIM_STROKE = 0.045;      // a greyed card's edge, in D
const GUTTER_GAP = 0.4;        // cards to a side note, in tp
const GUTTER_MAX = 6;          // a side note wraps past this many ems
const UNDER_GAP = 0.35;        // cards to the first thing beneath, in tp
const TIER_GAP = 0.35;         // between stacked things beneath, in tp
const ITEM_GAP = 0.8;          // between two labels side by side, in tp
const BRACKET_H = 0.5;         // a bracket's ticks, in tp
const BRACKET_STROKE = 0.1;    // in tp
const SUM_H = 1.7;             // the joining lines' drop, in tp
const LINE_STROKE = 0.09;      // joining lines and arrows, in tp
const ARC_RISE = 1.5;          // an arc's height over the cards, in tp
const ARC_STROKE = 0.14;       // in tp
const ARROW_LEN = 1.3;         // a down arrow between working lines, in tp
const HEAD_LEN = 0.5;          // arrowheads, in tp
const HEAD_W = 0.45;
const PIN_R = 0.62;            // a step pin's radius, in tp
const PIN_GAP = 0.3;           // a pin to its words, in tp
const COL_GAP = 1.4;           // between working lines set side by side, in tp
const QUESTION_GAP = 0.6;      // the question to the drawing, in tp
const WRITE_W = 6;             // a ruled line for the child, in tp
const PAD = 0.15;              // breathing room round the ink, in tp
const MAX_DIGITS = 12;
const MAX_MARKS = 8;
const MAX_WORKING = 6;
// ────────────────────────────────────────────────────────────────────────────

const COLOURS = {
  ink: { colour: '#000000', ink: INK_TONES.ink },
  blue: { colour: '#0070C0', ink: INK_TONES.ink },
  purple: { colour: '#7030A0', ink: INK_TONES.dark },
  green: { colour: '#00B050', ink: INK_TONES.dark },
  orange: { colour: '#E46C0A', ink: INK_TONES.ink },
  grey: { colour: '#8C8C8C', ink: INK_TONES.mid },
};
const CARD_LOOK = {
  colour: { fill: '#DEEAF1', stroke: '#0070C0', digit: '#0070C0' },
  ink: { fill: INK_TONES.paper, stroke: INK_TONES.ink, digit: INK_TONES.ink },
};
const DIM_LOOK = {
  colour: { fill: '#F2F2F2', stroke: '#A6A6A6', digit: '#8C8C8C' },
  ink: { fill: INK_TONES.paper, stroke: INK_TONES.light, digit: INK_TONES.mid },
};
const STYLES = ['box', 'ring', 'outline', 'dim', 'colour', 'none'];
const TICK = '✓';

function str(v) {
  return v == null ? '' : String(v);
}

function fail(code, message) {
  return new Error(`${code}: ${message}`);
}

// A label or note: null when absent, '' for a ruled write-on line.
function words(v) {
  if (v === undefined || v === null) return null;
  return str(v).trim();
}

function colourName(v, fallback, what) {
  const c = str(v || fallback).toLowerCase().replace(/^#/, '');
  if (COLOURS[c]) return c;
  // The board's own hexes, as a designer copying a slide may write them.
  const byHex = Object.keys(COLOURS).find((k) => COLOURS[k].colour.slice(1).toLowerCase() === c);
  if (byHex) return byHex;
  throw fail('DIGIT_CARDS_INVALID', `${what} asks for colour "${v}"; use one of ${Object.keys(COLOURS).join(', ')}.`);
}

function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i += 1) out.push(i);
  return out;
}

// Which digits a selection names, as positions from the left, sorted.
function pickDigits(sel, count, what) {
  let list;
  if (Array.isArray(sel)) list = sel.map(Number);
  else if (typeof sel === 'number') list = [sel];
  else {
    const s = str(sel).trim().toLowerCase();
    const m = /^(first|last)(?:\s+(\d+))?$/.exec(s);
    if (s === 'all') list = range(1, count);
    else if (m) {
      const k = m[2] ? Number(m[2]) : 1;
      list = m[1] === 'first' ? range(1, k) : range(count - k + 1, count);
    } else if (/^\d+$/.test(s)) list = [Number(s)];
    else {
      throw fail('DIGIT_CARDS_INVALID', `${what} names its digits as "${sel}". Give a position from the left (1 is the first digit), a list [2, 3], or "first", "last", "last 2", "all".`);
    }
  }
  if (!list.length) throw fail('DIGIT_CARDS_INVALID', `${what} names no digits.`);
  for (const d of list) {
    if (!Number.isInteger(d) || d < 1 || d > count) {
      throw fail('DIGIT_CARDS_UNKNOWN_DIGIT', `${what} names digit ${d}, and the number has ${count} digit${count === 1 ? '' : 's'}. Count digits from the left, starting at 1; commas are not digits.`);
    }
  }
  return [...new Set(list)].sort((a, b) => a - b);
}

function isRun(list) {
  return list.every((d, i) => i === 0 || d === list[i - 1] + 1);
}

// The number's characters as cards and the separators between them.
function tokensOf(spec) {
  if (spec.value != null && spec.digits != null) {
    throw fail('DIGIT_CARDS_INVALID', 'give the number as `value` ("5,463") or loose cards as `digits` ([0, 3, 4, 7]), not both.');
  }
  if (Array.isArray(spec.digits)) {
    const cards = spec.digits.map((d) => str(d).trim());
    for (const d of cards) {
      if (!/^\d?$/.test(d)) throw fail('DIGIT_CARDS_INVALID', `a digit card holds one digit; "${d}" is not one.`);
    }
    return { loose: true, tokens: cards.map((ch) => ({ kind: 'digit', ch })) };
  }
  let text;
  if (typeof spec.value === 'number' && Number.isFinite(spec.value)) {
    const [whole, frac] = String(Math.abs(spec.value)).split('.');
    text = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (frac ? `.${frac}` : '');
  } else text = str(spec.value).trim();
  if (!text) throw fail('DIGIT_CARDS_INVALID', 'there is no `value` to draw: give the number as `value` ("5,463"), or loose cards as `digits`.');
  if (!/^\d+(?:,\d{3})*(?:\.\d+)?$/.test(text) && !/^\d+(?:\.\d+)?$/.test(text)) {
    throw fail('DIGIT_CARDS_INVALID', `"${text}" is not a number the cards can show. Write digits, with commas between groups of three and at most one decimal point ("5,463", "3.47").`);
  }
  return { loose: false, tokens: [...text].map((ch) => (/\d/.test(ch) ? { kind: 'digit', ch } : { kind: 'sep', ch })) };
}

// ─── The spec, checked ───────────────────────────────────────────────────────

function normalise(spec = {}) {
  const { loose, tokens } = tokensOf(spec);
  const count = tokens.filter((t) => t.kind === 'digit').length;
  if (count < 1) throw fail('DIGIT_CARDS_INVALID', 'there are no digits to draw.');
  if (count > MAX_DIGITS) {
    throw fail('DIGIT_CARDS_TOO_MANY', `${count} digits were asked for and ${MAX_DIGITS} is the most a row of cards carries at a readable size.`);
  }

  const rawMarks = Array.isArray(spec.marks) ? spec.marks : [];
  if (rawMarks.length > MAX_MARKS) {
    throw fail('DIGIT_CARDS_TOO_MANY', `${rawMarks.length} marks were asked for and ${MAX_MARKS} is the most before nothing stands out. Mark what this step looks at.`);
  }
  const marks = rawMarks.map((m, i) => {
    const what = `mark ${i + 1}`;
    const style = str((m && m.style) || 'outline').toLowerCase();
    if (!STYLES.includes(style)) throw fail('DIGIT_CARDS_INVALID', `${what} asks for style "${m.style}"; use one of ${STYLES.join(', ')}.`);
    const digits = pickDigits(m && m.digits, count, what);
    if ((style === 'box' || style === 'ring') && !isRun(digits)) {
      throw fail('DIGIT_CARDS_INVALID', `${what} draws one ${style} round digits ${digits.join(', ')}, which are not next to each other. Mark each run separately.`);
    }
    return {
      id: str(m.id).trim() || `mark ${i + 1}`,
      digits,
      style,
      colour: colourName(m.colour, style === 'dim' ? 'grey' : 'blue', what),
      label: words(m.label),
      note: words(m.note),
    };
  });

  let bracket = null;
  if (spec.bracket) {
    const digits = pickDigits(spec.bracket.digits == null ? 'all' : spec.bracket.digits, count, 'the bracket');
    if (!isRun(digits)) throw fail('DIGIT_CARDS_INVALID', 'a bracket goes under digits that are next to each other.');
    bracket = { digits, label: words(spec.bracket.label), colour: colourName(spec.bracket.colour, 'ink', 'the bracket') };
  }
  let arc = null;
  if (spec.arc) {
    const [from] = pickDigits(spec.arc.from, count, 'the arc');
    const [to] = pickDigits(spec.arc.to, count, 'the arc');
    if (from === to) throw fail('DIGIT_CARDS_INVALID', 'an arc joins two different digits.');
    arc = { from, to, label: words(spec.arc.label), colour: colourName(spec.arc.colour, 'orange', 'the arc') };
  }
  let sum = null;
  if (spec.sum) {
    if (count < 2) throw fail('DIGIT_CARDS_INVALID', 'a digit sum needs two digits or more.');
    if (bracket) throw fail('DIGIT_CARDS_INVALID', 'a digit sum and a bracket both join the digits underneath; use one of them.');
    sum = { label: words(spec.sum.label) == null ? '' : words(spec.sum.label), colour: colourName(spec.sum.colour, 'ink', 'the digit sum') };
  }

  const rawWorking = Array.isArray(spec.working) ? spec.working : [];
  if (rawWorking.length > MAX_WORKING) {
    throw fail('DIGIT_CARDS_TOO_MANY', `${rawWorking.length} lines of working were asked for and ${MAX_WORKING} is the most that stay tied to the cards. Put the rest in the steps beside the picture.`);
  }
  const working = rawWorking.map((w, i) => {
    const one = typeof w === 'string' ? { text: w } : w || {};
    return {
      text: words(one.text) == null ? '' : words(one.text),
      colour: colourName(one.colour, 'ink', `working line ${i + 1}`),
      arrow: one.arrow === true,
      beside: i > 0 && one.beside === true,
    };
  });

  const parts = new Set([...range(1, count).map((k) => `card ${k}`), ...marks.map((m) => m.id), ...working.map((_, i) => `working ${i + 1}`)]);
  if (bracket) parts.add('bracket');
  if (arc) parts.add('arc');
  if (sum) parts.add('sum');
  const ids = marks.map((m) => m.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i || /^(card|working) \d+$/.test(id) || ['bracket', 'arc', 'sum'].includes(id));
  if (dup) throw fail('DIGIT_CARDS_INVALID', `the mark id "${dup}" is used twice or names another part; give each mark its own id.`);

  // The steps a wall card pins on, so the drawing leaves each one room.
  const pinned = [];
  for (const c of Array.isArray(spec.callouts) ? spec.callouts : []) {
    if (!c || !Number.isInteger(c.step) || c.step < 1 || Array.isArray(c.anchor)) continue;
    const part = str(c.part).trim();
    if (parts.has(part) && !pinned.includes(part)) pinned.push(part);
  }

  return { loose, tokens, count, marks, bracket, arc, sum, working, pinned, stem: str(spec.text).trim() };
}

// ─── Laying it out ───────────────────────────────────────────────────────────

// A piece of words: wrapped lines, or a ruled line for the child, with a pin
// beside it when a step is pinned there.
function textPiece(value, tp, availW, bold, pin) {
  const pinW = pin ? 2 * PIN_R * tp + PIN_GAP * tp : 0;
  if (value === '') {
    const w = Math.min(WRITE_W * tp, availW - pinW);
    return { write: true, lines: [], textW: w, w: w + pinW, h: T.LINE * tp, pinW };
  }
  const lines = T.wrap(value, tp, availW - pinW, bold);
  if (lines === null || availW - pinW <= 0) return null;
  const textW = T.linesWidth(lines, tp, bold);
  return { write: false, lines, textW, w: textW + pinW, h: T.blockHeight(lines.length, tp), pinW };
}

// The whole drawing at one unit and digit ratio. Returns at least { w, h };
// `reason` says what did not fit when it is wider than the room.
function layoutAt(n, profile, u, digitEm) {
  const bold = profile.bold;
  const tp = Math.min(u, profile.fontPt * TEXT_GROW_MAX);
  const D = digitEm * u;
  const W = Math.max(1, profile.widthPt - 2 * PAD * tp);
  const cw = CARD_W * D;
  const ch = CARD_H * D;
  const pinR = PIN_R * tp;
  const pinned = new Set(n.pinned);
  // Too wide at this size: say by roughly how much, so the fit shrinks in
  // steps rather than dropping straight to the floor.
  const tooWide = (reason, need) => ({ w: Math.max(need || 0, profile.widthPt * 1.15), h: 0, reason });

  // How far a box or ring reaches past its cards. A ring is an ellipse round
  // the run, so it reaches further than a box; the gap beside a marked run
  // widens to keep it off the next card.
  const ringed = (m) => m.style === 'box' || m.style === 'ring';
  const nominalW = (m) => m.digits.length * cw + (m.digits.length - 1) * GAP * D;
  const outsetOf = (m) => {
    if (!ringed(m)) return { x: 0, y: 0 };
    const half = (MARK_STROKE * D) / 2;
    if (m.style === 'box') return { x: MARK_PAD * D + half, y: MARK_PAD * D + half };
    const p = MARK_PAD * D * 0.6;
    return { x: (nominalW(m) / 2) * (RING_X - 1) + p + half, y: (ch / 2) * (RING_Y - 1) + p + half };
  };
  const reachRight = (k) => Math.max(0, ...n.marks.filter((m) => ringed(m) && m.digits[m.digits.length - 1] === k).map((m) => outsetOf(m).x));
  const reachLeft = (k) => Math.max(0, ...n.marks.filter((m) => ringed(m) && m.digits[0] === k).map((m) => outsetOf(m).x));

  // The row of cards, from x = 0.
  const cards = [];
  const between = [];
  let x = 0;
  let sep = null;
  for (const t of n.tokens) {
    if (t.kind === 'sep') {
      sep = t.ch;
      continue;
    }
    if (cards.length) {
      const k = cards.length;
      const left = reachRight(k);
      const right = reachLeft(k + 1);
      let g;
      let glyph = null;
      if (n.sum) {
        g = PLUS_GAP * D;
        glyph = '+';
      } else if (sep) {
        g = SEP_GAP * D;
        glyph = sep;
      } else g = (n.loose ? LOOSE_GAP : GAP) * D;
      const marked = left || right ? left + right + MARK_CLEAR * D * (left && right ? 1 : 2) : 0;
      const room = glyph ? g + marked : Math.max(g, marked);
      if (glyph) between.push({ glyph, x: x + left + (room - left - right) / 2 });
      x += room;
    }
    sep = null;
    cards.push({ k: cards.length + 1, ch: t.ch, x, w: cw });
    x += cw;
  }
  const rowW = x;
  const rowMid = rowW / 2;
  const cardOf = (k) => cards[k - 1];
  const spanOf = (digits) => {
    const a = cardOf(digits[0]);
    const b = cardOf(digits[digits.length - 1]);
    return { x1: a.x, x2: b.x + b.w, mid: (a.x + b.x + b.w) / 2 };
  };
  const outset = (m) => outsetOf(m).y;

  // Side notes: a mark reaching an end of the number puts its note in that
  // end's margin; any other note goes beneath with the labels.
  const gutters = { left: [], right: [] };
  const under = [];
  // A pinned mark with no words of its own takes its pin over its cards.
  const pinAbove = new Set();
  for (const m of n.marks) {
    const pin = pinned.has(m.id);
    let pinPlaced = false;
    if (m.note !== null) {
      const side = m.digits[m.digits.length - 1] === n.count ? 'right' : m.digits[0] === 1 ? 'left' : null;
      if (side) {
        const longest = T.widthPt(T.longestWord(m.note, tp, bold), tp, bold);
        const piece = textPiece(m.note, tp, Math.max(GUTTER_MAX * tp, longest), bold, false);
        if (!piece) return tooWide(`the note "${m.note}"`);
        gutters[side].push({ mark: m, piece, pin, out: side === 'right' ? reachRight(n.count) : reachLeft(1) });
        pinPlaced = pin;
      } else {
        under.push({ part: m.id, value: m.note, colour: m.colour, mid: spanOf(m.digits).mid, pin: pin && !pinPlaced });
        pinPlaced = pin;
      }
    }
    if (m.label !== null) {
      under.push({ part: m.id, value: m.label, colour: m.colour, mid: spanOf(m.digits).mid, pin: pin && !pinPlaced });
      pinPlaced = pinPlaced || pin;
    }
    if (pin && !pinPlaced) pinAbove.add(m.id);
  }
  const gutterW = (side) => {
    const list = gutters[side];
    if (!list.length) return 0;
    const out = Math.max(...list.map((g) => g.out));
    return out + GUTTER_GAP * tp + Math.max(...list.map((g) => Math.max(g.piece.w, g.pin ? 2 * pinR : 0)));
  };
  const gL = gutterW('left');
  const gR = gutterW('right');
  const marksOut = Math.max(0, ...n.marks.map(outset));
  const contentL = Math.min(-gL, -reachLeft(1));
  const contentR = Math.max(rowW + gR, rowW + reachRight(n.count));
  if (contentR - contentL > W + 0.5) {
    return tooWide(gL || gR ? 'the cards and their side notes' : `a row of ${n.count} cards`, contentR - contentL + 2 * PAD * tp);
  }
  // The frame every piece of words is kept inside: centred on the cards where
  // the room allows, shifted just enough to hold what sits beside them.
  const frameL = Math.min(Math.max(rowMid - W / 2, contentR - W), contentL);
  const frameR = frameL + W;
  const place = (mid, w) => Math.min(Math.max(mid - w / 2, frameL), frameR - w);

  const boxes = [];
  const pins = [];
  const texts = [];
  const shapes = [];
  let y = 0;

  // The question.
  if (n.stem) {
    const lines = T.wrap(n.stem, tp, W, bold);
    if (lines === null) return tooWide(`a word in the question "${n.stem}"`);
    const w = T.linesWidth(lines, tp, bold);
    const h = T.blockHeight(lines.length, tp);
    const qx = place(rowMid, w);
    texts.push({ part: 'question', lines, x: qx, y, w, h, colour: 'ink' });
    boxes.push({ part: 'question', kind: 'text', x: qx, y, w, h });
    y += h + QUESTION_GAP * tp;
  }

  // The arc's label, then the arc's rise down to the cards.
  let arcGeo = null;
  if (n.arc) {
    const pin = pinned.has('arc');
    const piece = n.arc.label === null ? null : textPiece(n.arc.label, tp, W, bold, pin);
    if (piece === null && n.arc.label !== null) return tooWide(`the arc's label "${n.arc.label}"`);
    const a = cardOf(n.arc.from);
    const b = cardOf(n.arc.to);
    const ax = a.x + a.w / 2;
    const bx = b.x + b.w / 2;
    const apexX = (ax + bx) / 2;
    if (piece) {
      const lx = place(apexX, piece.w);
      addPiece(piece, 'arc', lx, y, n.arc.colour);
      y += piece.h + 0.2 * tp;
    } else if (pin) {
      pins.push({ part: 'arc', cx: apexX, cy: y + pinR, r: pinR });
      y += 2 * pinR + 0.2 * tp;
    }
    arcGeo = { ax, bx, apexY: y };
    y += ARC_RISE * tp;
  }

  // Pins on a card or a mark that has no words of its own sit over it.
  const overPins = [];
  for (const c of cards) if (pinned.has(`card ${c.k}`)) overPins.push({ part: `card ${c.k}`, mid: c.x + c.w / 2 });
  for (const m of n.marks) if (pinAbove.has(m.id)) overPins.push({ part: m.id, mid: spanOf(m.digits).mid, out: outset(m) });
  if (overPins.length) {
    const top = y;
    const extra = Math.max(0, ...overPins.map((p) => p.out || 0));
    for (const p of overPins) pins.push({ part: p.part, cx: p.mid, cy: top + pinR, r: pinR });
    y += 2 * pinR + 0.15 * tp + extra;
  }

  // The row, with its side notes centred beside it.
  const blockH = (side) =>
    gutters[side].reduce((s, g, i) => s + g.piece.h + (g.pin ? 2 * pinR + 0.15 * tp : 0) + (i ? TIER_GAP * tp : 0), 0);
  const bandH = Math.max(ch + 2 * marksOut, blockH('left'), blockH('right'));
  const rowTop = y + (bandH - ch) / 2;
  const rowBottom = rowTop + ch;
  for (const side of ['left', 'right']) {
    let gy = rowTop + ch / 2 - blockH(side) / 2;
    for (const g of gutters[side]) {
      const colW = Math.max(g.piece.w, g.pin ? 2 * pinR : 0);
      const gx = side === 'right' ? rowW + g.out + GUTTER_GAP * tp : -g.out - GUTTER_GAP * tp - colW;
      if (g.pin) {
        pins.push({ part: g.mark.id, cx: gx + colW / 2, cy: gy + pinR, r: pinR });
        gy += 2 * pinR + 0.15 * tp;
      }
      // A side note lines up with the cards it is about: flush to them.
      const nx = side === 'right' ? gx : gx + colW - g.piece.w;
      addPiece(g.piece, g.mark.id, nx, gy, g.mark.colour, side === 'right' ? 'start' : 'end');
      gy += g.piece.h + TIER_GAP * tp;
    }
  }
  for (const c of cards) boxes.push({ part: `card ${c.k}`, kind: 'card', x: c.x, y: rowTop, w: c.w, h: ch });
  y += bandH;

  // Beneath the cards: the digit sum's joining lines, or the bracket, then the
  // marks' labels in tiers so two never touch.
  let sumGeo = null;
  let bracketGeo = null;
  let lastBlock = { y: rowBottom + marksOut, mid: rowMid };
  if (n.sum || n.bracket || under.length) y = rowBottom + marksOut + UNDER_GAP * tp;
  if (n.sum) {
    const joinY = y + SUM_H * tp;
    sumGeo = { from: rowBottom + 0.1 * tp, joinX: rowMid, joinY };
    y = joinY + 0.2 * tp;
    const piece = textPiece(n.sum.label, tp, W, bold, pinned.has('sum'));
    if (!piece) return tooWide(`the digit sum "${n.sum.label}"`);
    addPiece(piece, 'sum', place(rowMid, piece.w), y, n.sum.colour);
    lastBlock = { y: y + piece.h, mid: rowMid };
    y += piece.h + TIER_GAP * tp;
  }
  if (n.bracket) {
    const s = spanOf(n.bracket.digits);
    bracketGeo = { x1: s.x1, x2: s.x2, y };
    boxes.push({ part: 'bracket', kind: 'line', x: s.x1, y, w: s.x2 - s.x1, h: BRACKET_H * tp });
    y += BRACKET_H * tp + 0.25 * tp;
    if (n.bracket.label !== null) {
      const piece = textPiece(n.bracket.label, tp, W, bold, pinned.has('bracket'));
      if (!piece) return tooWide(`the bracket's label "${n.bracket.label}"`);
      // The words sit under the bracket's middle, the pin out to their left.
      const lx = place(s.mid - piece.pinW / 2, piece.w);
      addPiece(piece, 'bracket', lx, y, n.bracket.colour);
      y += piece.h + TIER_GAP * tp;
    } else if (pinned.has('bracket')) {
      pins.push({ part: 'bracket', cx: s.mid, cy: y + pinR, r: pinR });
      y += 2 * pinR + TIER_GAP * tp;
    }
    lastBlock = { y: y - TIER_GAP * tp, mid: s.mid };
  }
  if (under.length) {
    const tiers = [];
    for (const item of under) {
      const piece = textPiece(item.value, tp, W, bold, item.pin);
      if (!piece) return tooWide(`the words "${item.value}"`);
      const ix = place(item.mid - piece.pinW / 2, piece.w);
      let t = 0;
      while (tiers[t] && tiers[t].items.some((o) => ix < o.x + o.w + ITEM_GAP * tp && o.x < ix + piece.w + ITEM_GAP * tp)) t += 1;
      if (!tiers[t]) tiers[t] = { items: [], h: 0 };
      tiers[t].items.push({ ...item, piece, x: ix, w: piece.w });
      tiers[t].h = Math.max(tiers[t].h, piece.h);
    }
    for (const tier of tiers) {
      for (const it of tier.items) addPiece(it.piece, it.part, it.x, y, it.colour);
      const widest = tier.items.reduce((a, b) => (b.w > a.w ? b : a));
      lastBlock = { y: y + tier.h, mid: widest.x + widest.piece.pinW + widest.piece.textW / 2 };
      y += tier.h + TIER_GAP * tp;
    }
  }

  // The working: rows of one line, or of lines side by side in columns.
  const rows = [];
  n.working.forEach((wl, i) => {
    if (wl.beside && rows.length) rows[rows.length - 1].cells.push({ ...wl, index: i });
    else rows.push({ cells: [{ ...wl, index: i }], arrow: wl.arrow });
  });
  // Rows in a run with the same number of columns share their column widths,
  // so a check and its answer stay one above the other.
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    const k = row.cells.length;
    const cellAvail = (W - (k - 1) * COL_GAP * tp) / k;
    for (const c of row.cells) {
      c.piece = textPiece(c.text, tp, cellAvail, bold, pinned.has(`working ${c.index + 1}`));
      if (!c.piece) return tooWide(`the working "${c.text}"`);
    }
  }
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    if (row.cols) continue;
    const k = row.cells.length;
    let end = r;
    while (k > 1 && rows[end + 1] && rows[end + 1].cells.length === k && !rows[end + 1].arrow) end += 1;
    // A column's words start at one edge whichever of its lines carries a pin.
    const run = rows.slice(r, end + 1);
    const pinCol = range(0, k - 1).map((j) => Math.max(...run.map((rr) => rr.cells[j].piece.pinW)));
    const cols = range(0, k - 1).map((j) => pinCol[j] + Math.max(...run.map((rr) => rr.cells[j].piece.textW)));
    for (const rr of run) {
      rr.cols = cols;
      rr.pinCol = pinCol;
    }
  }
  if (rows.length && !(n.sum || n.bracket || under.length)) y = Math.max(y, rowBottom + marksOut + UNDER_GAP * tp);
  // The working stands under the cards, unless an arrow leads into it: then it
  // stands under what the arrow comes from, and the lines after it follow.
  let axis = rowMid;
  for (const row of rows) {
    if (row.arrow) axis = lastBlock.mid;
    const total = row.cols.reduce((s, c) => s + c, 0) + (row.cols.length - 1) * COL_GAP * tp;
    const rx = place(axis, total);
    const rowH = Math.max(...row.cells.map((c) => c.piece.h));
    // A single line's words centre under the cards with its pin out to the left.
    const xs = [];
    if (row.cells.length === 1) xs.push(place(axis - row.cells[0].piece.pinW / 2, row.cells[0].piece.w));
    else {
      let cx = rx;
      row.cols.forEach((w, j) => {
        xs.push(cx + row.pinCol[j] - row.cells[j].piece.pinW);
        cx += w + COL_GAP * tp;
      });
    }
    if (row.arrow) {
      const c0 = row.cells[0];
      const tx = xs[0] + c0.piece.pinW + c0.piece.textW / 2;
      const y1 = lastBlock.y + 0.15 * tp;
      const y2 = Math.max(y1 + ARROW_LEN * tp, y);
      shapes.push({ kind: 'arrow', x: tx, y1, y2: y2 - 0.1 * tp });
      boxes.push({ part: `working ${c0.index + 1}`, kind: 'arrow', x: tx - (HEAD_W * tp) / 2, y: y1, w: HEAD_W * tp, h: y2 - y1 });
      y = y2 + 0.05 * tp;
    }
    row.cells.forEach((c, j) => addPiece(c.piece, `working ${c.index + 1}`, xs[j], y, c.colour));
    lastBlock = { y: y + rowH, mid: axis };
    y += rowH + TIER_GAP * tp;
  }

  // Everything that inks, for the tight crop.
  function addPiece(piece, part, px, py, colour, align = 'start') {
    if (piece.pinW) pins.push({ part, cx: px + pinR, cy: py + (T.LINE * tp) / 2, r: pinR });
    const tx = px + piece.pinW;
    texts.push({ part, lines: piece.lines, write: piece.write, x: tx, y: py, w: piece.textW, h: piece.h, colour, align });
    boxes.push({ part, kind: 'text', x: tx, y: py, w: piece.textW, h: piece.h });
  }

  const ink = [...boxes];
  for (const p of pins) ink.push({ x: p.cx - p.r, y: p.cy - p.r, w: 2 * p.r, h: 2 * p.r });
  for (const m of n.marks) {
    const s = spanOf(m.digits);
    const o = outsetOf(m);
    ink.push({ x: s.x1 - o.x, y: rowTop - o.y, w: s.x2 - s.x1 + 2 * o.x, h: ch + 2 * o.y });
  }
  if (arcGeo) ink.push({ x: Math.min(arcGeo.ax, arcGeo.bx), y: arcGeo.apexY - ARC_STROKE * tp, w: Math.abs(arcGeo.bx - arcGeo.ax), h: rowTop - arcGeo.apexY });
  const minX = Math.min(...ink.map((b) => b.x));
  const maxX = Math.max(...ink.map((b) => b.x + b.w));
  const minY = Math.min(...ink.map((b) => b.y));
  const maxY = Math.max(...ink.map((b) => b.y + b.h));
  const pad = PAD * tp;
  const w = maxX - minX + 2 * pad;
  const h = maxY - minY + 2 * pad;
  const dx = pad - minX;
  const dy = pad - minY;
  const outsets = n.marks.map(outsetOf);
  return { w, h, dx, dy, tp, D, u, digitEm, outsets, cards, between, rowTop, rowBottom, ch, cw, marksOut, texts, pins, shapes, boxes, arcGeo, sumGeo, bracketGeo };
}

// The largest unit, from the surface's own size (grown into spare room on the
// board) down to its readable floor, at which the drawing fits its box. The
// words stop growing before the digits do, so size is not proportional to the
// unit and a single shrink by the overflow would undershoot: bisect instead.
function fitAt(n, profile, digitEm) {
  const W = profile.widthPt;
  const H = profile.heightPt || null;
  const fits = (L) => L.w <= W + 0.5 && (!H || L.h <= H + 0.5);
  const at = (u) => layoutAt(n, profile, u, digitEm);
  const top = profile.fontPt * (H ? profile.grow || 1 : 1);
  const floor = profile.minFontPt;
  let best = at(top);
  if (fits(best)) return { fits: true, layout: best };
  let lo = floor;
  let hi = top;
  best = at(lo);
  if (!fits(best)) return { fits: false, layout: best };
  for (let k = 0; k < 18; k += 1) {
    const mid = (lo + hi) / 2;
    const L = at(mid);
    if (fits(L)) {
      lo = mid;
      best = L;
    } else hi = mid;
  }
  return { fits: true, layout: best };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  let got = null;
  for (const digitEm of [DIGIT_EM, ...DIGIT_EM_TIGHT]) {
    got = fitAt(n, profile, digitEm);
    if (got.fits) break;
  }
  if (!got.fits) {
    const L = got.layout;
    if (L.reason) {
      throw fail('DIGIT_CARDS_TOO_NARROW', `${L.reason} cannot fit across ${(profile.widthPt / 72 * 25.4).toFixed(0)}mm at the ${profile.minFontPt}pt readable size. Give the cards more width, or shorten the words.`);
    }
    if (L.w > profile.widthPt + 0.5) {
      throw fail('DIGIT_CARDS_TOO_NARROW', `the cards and their words need ${(L.w / 72 * 25.4).toFixed(0)}mm of width at the ${profile.minFontPt}pt readable size and the space is ${(profile.widthPt / 72 * 25.4).toFixed(0)}mm. Give them more width, or shorten the words.`);
    }
    throw fail(
      'DIGIT_CARDS_ZONE_TOO_SHALLOW',
      `the cards and their working need ${(L.h / 72).toFixed(2)}in of height at the ${profile.minFontPt}pt readable size and the space is ${((profile.heightPt || 0) / 72).toFixed(2)}in. Give them more height, or move some working into the steps beside the picture.`
    );
  }
  const L = got.layout;
  // Every box in drawing coordinates, for the tests that hold the layout.
  const shift = (b) => ({ ...b, x: b.x + L.dx, y: b.y + L.dy });
  return { ...L, n, profile, boxes: L.boxes.map(shift), pins: L.pins.map((p) => ({ ...p, cx: p.cx + L.dx, cy: p.cy + L.dy })) };
}

// ─── Drawing it ──────────────────────────────────────────────────────────────

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { profile, n, tp, D, dx, dy } = L;
  const inkOnly = profile.palette === 'ink';
  const font = profile.font;
  const bold = profile.bold;
  const col = (name) => (inkOnly ? COLOURS[name].ink : COLOURS[name].colour);
  const tick = inkOnly ? COLOURS.green.ink : COLOURS.green.colour;
  const f = T.f2;
  const X = (x) => f(x + dx);
  const Y = (y) => f(y + dy);
  const parts = [];
  const over = [];

  // Which marks touch each card.
  const marksOn = (k) => n.marks.filter((m) => m.digits.includes(k));

  // Boxes and rings round their run of cards, out as far as the layout left
  // them room.
  n.marks.forEach((m, i) => {
    if (m.style !== 'box' && m.style !== 'ring') return;
    const a = L.cards[m.digits[0] - 1];
    const b = L.cards[m.digits[m.digits.length - 1] - 1];
    const half = (MARK_STROKE * D) / 2;
    const o = L.outsets[i];
    const x1 = a.x - o.x + half;
    const x2 = b.x + b.w + o.x - half;
    const y1 = L.rowTop - o.y + half;
    const y2 = L.rowBottom + o.y - half;
    const sw = f(MARK_STROKE * D);
    if (m.style === 'box') {
      over.push(`<rect x="${X(x1)}" y="${Y(y1)}" width="${f(x2 - x1)}" height="${f(y2 - y1)}" rx="${f(CARD_R * D * 1.2)}" fill="none" stroke="${col(m.colour)}" stroke-width="${sw}"/>`);
    } else {
      over.push(`<ellipse cx="${X((x1 + x2) / 2)}" cy="${Y((y1 + y2) / 2)}" rx="${f((x2 - x1) / 2)}" ry="${f((y2 - y1) / 2)}" fill="none" stroke="${col(m.colour)}" stroke-width="${sw}"/>`);
    }
  });

  // The cards.
  for (const c of L.cards) {
    const on = marksOn(c.k);
    const dim = on.some((m) => m.style === 'dim');
    const look = (dim ? DIM_LOOK : CARD_LOOK)[inkOnly ? 'ink' : 'colour'];
    const outline = on.filter((m) => m.style === 'outline').pop();
    const coloured = on.filter((m) => m.style === 'colour').pop();
    const stroke = outline ? col(outline.colour) : look.stroke;
    const sw = outline ? MARK_STROKE * D * (inkOnly ? 1.6 : 1.25) : (dim ? DIM_STROKE : CARD_STROKE) * D;
    const inset = sw / 2;
    parts.push(
      `<rect x="${X(c.x + inset)}" y="${Y(L.rowTop + inset)}" width="${f(c.w - sw)}" height="${f(L.ch - sw)}" rx="${f(CARD_R * D)}" fill="${look.fill}" stroke="${stroke}" stroke-width="${f(sw)}"/>`
    );
    if (c.ch) {
      const fill = coloured ? col(coloured.colour) : look.digit;
      parts.push(
        `<text x="${X(c.x + c.w / 2)}" y="${Y(L.rowTop + L.ch / 2 + DIGIT_BASE * D * 0.72)}" text-anchor="middle" font-family="${font}" font-size="${f(D)}" font-weight="bold" fill="${fill}">${T.esc(c.ch)}</text>`
      );
    }
  }

  // Commas, decimal points and the + of a digit sum, in the gaps.
  for (const g of L.between) {
    if (g.glyph === '+') {
      const s = PLUS_SIZE * D;
      const cy = L.rowTop + L.ch / 2;
      const sw = f(Math.max(1, 0.065 * D));
      parts.push(`<path d="M${X(g.x - s / 2)},${Y(cy)} H${X(g.x + s / 2)} M${X(g.x)},${Y(cy - s / 2)} V${Y(cy + s / 2)}" stroke="${col('ink')}" stroke-width="${sw}" stroke-linecap="round"/>`);
    } else {
      // A comma or a decimal point sits on the digits' baseline.
      parts.push(
        `<text x="${X(g.x)}" y="${Y(L.rowTop + L.ch / 2 + DIGIT_BASE * D * 0.72)}" text-anchor="middle" font-family="${font}" font-size="${f(D * SEP_SIZE)}" font-weight="bold" fill="${col('ink')}">${T.esc(g.glyph)}</text>`
      );
    }
  }

  // The arc over the cards, its head pointing down into the second.
  if (L.arcGeo) {
    const { ax, bx, apexY } = L.arcGeo;
    const top = L.rowTop - 0.1 * tp;
    const cy = top - (top - apexY) / 0.75;
    const d = (bx - ax) * 0.12;
    const c = col(n.arc.colour);
    const head = HEAD_LEN * tp * 1.2;
    const endY = top - head * 0.8;
    over.push(`<path d="M${X(ax)},${Y(top)} C${X(ax + d)},${Y(cy)} ${X(bx - d)},${Y(cy)} ${X(bx)},${Y(endY)}" fill="none" stroke="${c}" stroke-width="${f(ARC_STROKE * tp)}" stroke-linecap="round"/>`);
    over.push(headSvg(bx, top, bx - d * 0.15, top - 2 * head, c, tp * 1.2, X, Y));
  }

  // The digit sum's lines, joining at one point.
  if (L.sumGeo) {
    const { from, joinX, joinY } = L.sumGeo;
    for (const c of L.cards) {
      over.push(`<line x1="${X(c.x + c.w / 2)}" y1="${Y(from)}" x2="${X(joinX)}" y2="${Y(joinY)}" stroke="${col('ink')}" stroke-width="${f(LINE_STROKE * tp)}" stroke-linecap="round"/>`);
    }
  }

  // The bracket.
  if (L.bracketGeo) {
    const { x1, x2, y } = L.bracketGeo;
    const h = BRACKET_H * tp;
    over.push(`<path d="M${X(x1)},${Y(y)} V${Y(y + h)} H${X(x2)} V${Y(y)}" fill="none" stroke="${col(n.bracket.colour)}" stroke-width="${f(BRACKET_STROKE * tp)}" stroke-linejoin="round"/>`);
  }

  // Arrows down between working lines.
  for (const s of L.shapes) {
    if (s.kind !== 'arrow') continue;
    const head = HEAD_LEN * tp;
    over.push(`<line x1="${X(s.x)}" y1="${Y(s.y1)}" x2="${X(s.x)}" y2="${Y(s.y2 - head * 0.8)}" stroke="${col('ink')}" stroke-width="${f(LINE_STROKE * tp * 1.3)}"/>`);
    over.push(headSvg(s.x, s.y2, s.x, s.y2 - head, col('ink'), tp, X, Y));
  }

  // The words: each line set from its measured left edge, so a tick inside it
  // can print green.
  for (const t of L.texts) {
    const c = col(t.colour);
    if (t.write) {
      const yy = t.y + T.BASELINE * tp + 0.1 * tp;
      over.push(`<line x1="${X(t.x)}" y1="${Y(yy)}" x2="${X(t.x + t.w)}" y2="${Y(yy)}" stroke="${col('ink')}" stroke-width="${f(Math.max(0.75, 0.06 * tp))}"/>`);
      continue;
    }
    t.lines.forEach((line, i) => {
      const lw = T.widthPt(line, tp, bold);
      const lx = t.align === 'end' ? t.x + t.w - lw : t.x;
      const yy = t.y + i * T.LINE * tp + T.BASELINE * tp;
      over.push(textLine(line, lx, yy, tp, c, tick, { font, bold, X, Y }));
    });
  }

  const svg = T.svgDoc(L.w, L.h, [...parts, ...over]);
  return { svg, w: L.w, h: L.h, aspect: L.w / L.h, layout: L, anchors: anchorsOf(L) };
}

function headSvg(tipX, tipY, fromX, fromY, colour, tp, X, Y) {
  const len = Math.hypot(tipX - fromX, tipY - fromY) || 1;
  const ux = (tipX - fromX) / len;
  const uy = (tipY - fromY) / len;
  const bx = tipX - ux * HEAD_LEN * tp;
  const by = tipY - uy * HEAD_LEN * tp;
  const px = (-uy * HEAD_W * tp) / 2;
  const py = (ux * HEAD_W * tp) / 2;
  return `<polygon points="${X(tipX)},${Y(tipY)} ${X(bx + px)},${Y(by + py)} ${X(bx - px)},${Y(by - py)}" fill="${colour}"/>`;
}

function textLine(line, x, y, pt, fill, tickFill, { font, bold, X, Y }) {
  const weight = bold ? ' font-weight="bold"' : '';
  const body =
    !line.includes(TICK) || fill === tickFill
      ? T.esc(line)
      : line
          .split(/(✓)/)
          .filter((r) => r !== '')
          .map((r) => (r === TICK ? `<tspan fill="${tickFill}">${TICK}</tspan>` : T.esc(r)))
          .join('');
  return `<text x="${X(x)}" y="${Y(y)}" font-family="${font}" font-size="${T.f2(pt)}"${weight} fill="${fill}" xml:space="preserve">${body}</text>`;
}

// Where each named part is, as [x%, y%, r%] of the drawing, for a wall card's
// step pins: the pin spot the drawing left beside the part when a step names
// it, otherwise the part's own middle.
function anchorsOf(L) {
  const anchors = {};
  const pct = (x, y, r) => [(x / L.w) * 100, (y / L.h) * 100, (r / L.h) * 100];
  for (const b of L.boxes) {
    if (anchors[b.part] || b.part === 'question') continue;
    anchors[b.part] = pct(b.x + b.w / 2, b.y + b.h / 2, PIN_R * L.tp);
  }
  for (const m of L.n.marks) {
    if (anchors[m.id]) continue;
    const a = L.cards[m.digits[0] - 1];
    const b = L.cards[m.digits[m.digits.length - 1] - 1];
    anchors[m.id] = pct((a.x + b.x + b.w) / 2 + L.dx, L.rowTop - L.marksOut + L.dy, PIN_R * L.tp);
  }
  if (L.arcGeo && !anchors.arc) anchors.arc = pct((L.arcGeo.ax + L.arcGeo.bx) / 2 + L.dx, L.arcGeo.apexY + L.dy, PIN_R * L.tp);
  if (L.sumGeo && !anchors.sum) anchors.sum = pct(L.sumGeo.joinX + L.dx, L.sumGeo.joinY + L.dy, PIN_R * L.tp);
  for (const p of L.pins) anchors[p.part] = pct(p.cx, p.cy, p.r);
  return anchors;
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  return `digit-cards:${T.profileKey(p)}:${JSON.stringify(normalise(spec))}`;
}

// The widest the drawing ever draws: it stops growing once its words reach the
// surface's ceiling, so a row can give the rest of its width to its neighbours.
function maxWidthPt(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  return layoutAt(n, { ...profile, widthPt: 1e6, heightPt: null }, profile.fontPt * (profile.grow || 1), DIGIT_EM).w;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, maxWidthPt, STYLES, COLOURS: Object.keys(COLOURS), MAX_DIGITS };
