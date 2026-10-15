'use strict';

// THE cycle: stages joined by arrows in a loop, the last leading back to the
// first. The water cycle, a life cycle, the seasons, day and night, the rock
// cycle, blood round the body. One drawing, placed by the board, the worksheet,
// the working wall and the stick-in pack.
//
// The arrow from the last stage back to the first is the picture. A straight
// chain of the same stages says "and then it stops", and the lesson has to
// close the loop in a sentence beside it (Year 6 circulatory system, stress
// test, 7 October 2026: "no loop or cycle diagram; the only chain runs in a
// straight line").
//
// It is laid out as a track of two rows, not a ring. A ring puts every stage
// at the end of a spoke and leaves its middle empty, so a stage named "water
// vapour cools and condenses into clouds" gets a sliver. On a track the first
// stage is top left, the top row runs left to right, the route turns down at
// the right-hand end, comes back along the bottom row and turns up to the
// first stage again: clockwise, from where a child starts reading, the same
// everywhere. An odd number of stages turns through one tall stage at the
// right-hand end.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// Spec (the stage fields are the process chain's own, so a stage written for a
// chain draws in a cycle unchanged):
//   boxes      the stages in order, three to eight. A stage is words, or
//              { text, imagePath, label } for a named picture with a short
//              phrase under it, or null for a box the child writes in.
//   arrows     a few words beside each arrow, in the order of `boxes`: the
//              first belongs to the arrow leaving the first stage, the last to
//              the arrow from the last stage back to the first. Often this is
//              the taught word ("evaporation"), not the stage. Leave an entry
//              null for an arrow with nothing beside it.
//   arrowLine  true leaves a writing line beside every arrow that has no
//              words, for the child to name what happens there.
//   labelLine  true leaves a writing line under every stage without a label.
//   arrowHeads false draws each join as a plain line for the child to turn
//              into an arrow.
//   title      what the cycle is ("The water cycle"), set in the middle of the
//              loop, which the two rows leave free.
//   text       the question above (the worksheet prints it as sheet text).
//
// The answers. A cycle with blank stages or blank arrow words has an answers
// slide that fills them in, and the words that fill them are the answer, so
// they are drawn in the package's answer green, as every other drawing's
// answers are. Mark each one where it is written:
//   a stage    { text: "caterpillar", answer: true }
//   an arrow   { text: "evaporation", answer: true } in place of the string
// Green on the board and the wall. A pupil sheet and the stick-in pack are the
// child's to fill in, so there an answer stage prints as an empty box (a
// pictured stage keeps its picture and loses its name) and an answer arrow as
// a writing line; the teacher's answer sheet asks for them (`answers: "show"`
// on the profile) and prints them green.
//   roomFor    the stages and arrow words of the other slides this cycle shares
//              a place with. The board sets it, never a designer: a question
//              slide and its answers slide are one loop to the class, so both
//              are laid out round the fuller of them and the loop neither
//              shrinks nor moves when the answers are written in
//              (cycles-stand-still.js).
//
// Two loops through one stage. Blood goes heart, lungs, heart, body and back:
// name the shared stage both times the route passes it and it is drawn once,
// tall, in the middle, with one loop each side of it.

const T = require('./figure-text');
const chain = require('./process-chain-svg');
const { PALETTES } = require('./surface-profiles');

// A stage as a chain link, keeping whether its name is the answer.
function stage(raw) {
  const out = chain.link(raw);
  if (out && raw && typeof raw === 'object' && !Array.isArray(raw) && raw.answer === true && out.text) out.answer = true;
  return out;
}

// The words beside one arrow, and whether they are the answer. An arrow is
// written as its words, or as { text, answer }.
function arrowEntry(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return filled(raw.text) ? { text: String(raw.text).trim(), answer: raw.answer === true } : { text: null, answer: false };
  }
  return filled(raw) ? { text: String(raw).trim(), answer: false } : { text: null, answer: false };
}

// Whether the answers are drawn on this surface: on the board and the wall,
// and on paper only where the surface asks (the teacher's answer sheet).
function answersShown(profile) {
  if (profile && profile.answers === 'show') return true;
  if (profile && profile.answers === 'hide') return false;
  return !(profile && (profile.palette === 'sheet' || profile.palette === 'ink'));
}

// The question the cycle asks: every answer taken off. An answer stage becomes
// an empty box (a pictured one keeps its picture and loses its name); an
// answer arrow loses its words and gains a line to write them on.
function withoutAnswers(spec) {
  const out = { ...spec };
  delete out.roomFor;
  const key = Array.isArray(spec.boxes) ? 'boxes' : Array.isArray(spec.stages) ? 'stages' : null;
  if (key) {
    out[key] = spec[key].map((raw) => {
      if (!(raw && typeof raw === 'object' && !Array.isArray(raw) && raw.answer === true)) return raw;
      const kept = { ...raw, text: null };
      delete kept.answer;
      return chain.link(kept) ? kept : null;
    });
  }
  if (Array.isArray(spec.arrows)) {
    let taken = false;
    out.arrows = spec.arrows.map((raw) => {
      if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.answer === true) { taken = true; return null; }
      return raw;
    });
    if (taken) out.arrowLine = true;
  }
  return out;
}

// The spec the loop is laid out from when it shares its place with other
// slides: at each stage and each arrow, the widest words any of them writes
// there, and room for an empty box or a writing line wherever any of them
// leaves one. Null when they are not the same loop (a different number of
// stages), and each is then laid out on its own.
function roomSpec(own, others) {
  const listOf = (spec) => (Array.isArray(spec.boxes) ? spec.boxes : Array.isArray(spec.stages) ? spec.stages : []);
  const all = [own, ...others.filter((o) => o && typeof o === 'object')];
  const count = listOf(own).length;
  if (all.some((spec) => listOf(spec).length !== count)) return null;
  const width = (text) => (filled(text) ? T.widthPt(String(text), 10, true) : -1);
  const boxes = [];
  const arrows = [];
  let blank = false;
  for (let i = 0; i < count; i += 1) {
    let best = null;
    for (const spec of all) {
      const raw = listOf(spec)[i];
      const link = chain.link(raw);
      if (!link || !link.text) blank = true;
      if (link && (!best || width(link.text) > width(chain.link(best).text))) best = raw;
    }
    boxes.push(best);
    let words = null;
    for (const spec of all) {
      const entry = arrowEntry((Array.isArray(spec.arrows) ? spec.arrows : [])[i]);
      if (entry.text && width(entry.text) > width(words)) words = entry.text;
    }
    arrows.push(words);
  }
  const out = { ...own, boxes, arrows, blankRoom: blank };
  delete out.stages;
  delete out.roomFor;
  out.arrowLine = all.some((spec) => spec.arrowLine === true);
  out.labelLine = all.some((spec) => spec.labelLine === true);
  return out;
}

// ─── CONSTANTS (in ems of the settled font size) ─────────────────────────────
const BOX_PAD_X = 0.5; // words to the box edge, each side
const BOX_PAD_Y = 0.45;
const BOX_MIN_H = 3.2; // an empty box holds a child's written word
const BOX_MIN_W = 4.5;
// A box a child writes a stage name in is never narrower than a written word.
const BLANK_MIN_W = 7;
const BOX_MAX_W = 12;
// The width a box of words is given before the words on the arrows take more.
const BOX_PREF_W = 7;
const BOX_MAX_LINES = 4;
const BOX_RADIUS = 0.6;
const BOX_STROKE = 0.14;
const ARROW_W = 2.6; // an arrow with nothing beside it, tail to tip
const JOIN_W = 4; // a plain join the child draws a head on
const ARROW_MAX_W = 6; // how far an arrow stretches into width pictures leave
const ARROW_GAP = 0.35; // air between a box edge and the arrow
const ARROW_STROKE = 0.3;
const ARROW_HEAD_W = 0.9;
const ARROW_HEAD_H = 0.95;
// Words beside an arrow: how wide they run before they wrap, how far they sit
// from the shaft, and how many lines they may take.
const ARROW_WORDS_MAX_W = 8;
const ARROW_WORDS_GAP = 0.2;
const ARROW_WORDS_MAX_LINES = 3;
const SIDE_WORDS_OFFSET = 0.8; // from an upright arrow to the words beside it
// A line a child writes an arrow's word on: 8mm of paper at the sheet's size,
// and long enough for "evaporation" in a child's hand.
const WRITE_LINE_H = 2.3;
const WRITE_LINE_W = 8.5;
const WRITE_LINE_CLEAR = 0.75; // from the line down to the arrow's shaft
const STEM_GAP = 0.6;
const PAD = 0.15;
const MID_MIN = 0.9; // the least air between the two rows
const MID_PAD = 0.3; // above and below what the middle holds
const TITLE_SCALE = 1.15;
const TITLE_PAD = 0.8; // either side of the title
const TITLE_MAX_LINES = 3;
const MIN_STAGES = 3;
const MAX_STAGES = 8;
const MAX_LOOP_STAGES = 4; // each loop of a pair, not counting the shared stage
// Two rows of pictures are twice as deep as a chain's one, so a picture stops
// growing sooner here: wide enough to see across a room on the wall, and a
// cycle of four still leaves most of a page for the questions under it.
const PIC_MAX_W = 13;
const PIC_MIN_H = 3.6;
const PIC_NAME_GAP = 0.25;
const NAME_MAX_LINES = 2;
const LABEL_SCALE = 0.85;
const LABEL_GAP = 0.15;
const LABEL_MAX_LINES = 3;
const LABEL_LINE_SHARE = 0.84;
// ────────────────────────────────────────────────────────────────────────────

function filled(v) {
  return v !== null && v !== undefined && String(v).trim() !== '';
}

const nameOf = (raw) => (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw.text : raw);
const sameName = (raw) => (filled(nameOf(raw)) ? String(nameOf(raw)).trim().toLowerCase().replace(/\s+/g, ' ') : null);

// The stage both passes share, as one stage: whichever mention carries the
// picture or the label supplies it.
function merged(a, b) {
  const obj = (r) => (r && typeof r === 'object' && !Array.isArray(r) ? r : { text: r });
  const out = { ...obj(b) };
  for (const [k, v] of Object.entries(obj(a))) if (filled(v) || v === true) out[k] = v;
  return out;
}

// The track: columns left to right, each a pair (a stage in the top row and
// one in the bottom row) or one tall stage both rows pass through. `topPos`
// and `bottomPos` are places on the route, which is how each arrow finds the
// words that belong beside it: the arrow leaving a column along the top row
// carries `arrows[topPos]`, the one leaving along the bottom `arrows[bottomPos]`.
function track(raw, rawArrows, rawAnswers) {
  const count = raw.length;
  const seen = new Map();
  raw.forEach((r, i) => {
    const key = sameName(r);
    if (key) seen.set(key, [...(seen.get(key) || []), i]);
  });
  const repeats = [...seen.values()].filter((at) => at.length > 1);
  if (repeats.length > 1 || (repeats[0] && repeats[0].length > 2)) {
    throw new Error(
      'CYCLE_REPEATED_STAGE: a cycle may pass through one stage twice (two loops through a shared stage, as blood passes the heart), and this one repeats more than that. ' +
        'Give every other stage its own name.'
    );
  }
  if (!repeats.length) {
    if (count < MIN_STAGES || count > MAX_STAGES) {
      throw new Error(
        count < MIN_STAGES
          ? `CYCLE_TOO_FEW_STAGES: a cycle needs at least ${MIN_STAGES} stages in \`boxes\` (null for one the child fills) and was given ${count}. Two things that turn into each other are a pair of arrows, not a loop.`
          : `CYCLE_TOO_MANY_STAGES: ${count} stages were asked for and ${MAX_STAGES} is the most one cycle carries at a readable size. Drop the stages this lesson does not teach.`
      );
    }
    const cells = raw.map((r) => stage(r));
    const columns = [];
    const half = Math.ceil(count / 2);
    for (let c = 0; c < half; c += 1) {
      if (count % 2 === 1 && c === half - 1) columns.push({ tall: c, topPos: c, bottomPos: c });
      else columns.push({ top: c, bottom: count - 1 - c, topPos: c, bottomPos: count - 1 - c });
    }
    return { cells, columns, arrows: rawArrows, arrowAnswers: rawAnswers, pair: false, returnPos: count - 1 };
  }

  // Two loops: turn the route so it starts at the shared stage.
  const [p, q] = repeats[0];
  const turn = (list) => [...list.slice(p), ...list.slice(0, p)];
  const route = turn(raw);
  const arrows = turn(rawArrows);
  const arrowAnswers = turn(rawAnswers);
  const second = q - p;
  const first = route.slice(1, second); // the loop drawn on the right
  const other = route.slice(second + 1); // the loop drawn on the left
  if (!first.length || !other.length) {
    throw new Error('CYCLE_SHARED_STAGE_ADJACENT: the stage named twice has nothing between its two mentions, so there is no second loop. Name a stage once unless the route really passes it twice.');
  }
  if (first.length > MAX_LOOP_STAGES || other.length > MAX_LOOP_STAGES) {
    throw new Error(`CYCLE_TOO_MANY_STAGES: each loop through a shared stage holds ${MAX_LOOP_STAGES} stages at the most, and one of these has ${Math.max(first.length, other.length)}.`);
  }
  const cells = [stage(merged(route[0], route[second]))];
  const add = (r) => cells.push(stage(r)) - 1;
  const k = first.length;
  const m = other.length;
  const right = [];
  const rightAt = first.map(add);
  for (let j = 0; j < Math.ceil(k / 2); j += 1) {
    if (k % 2 === 1 && j === Math.ceil(k / 2) - 1) right.push({ tall: rightAt[j], topPos: 1 + j, bottomPos: 1 + j });
    else right.push({ top: rightAt[j], bottom: rightAt[k - 1 - j], topPos: 1 + j, bottomPos: k - j });
  }
  const left = [];
  const leftAt = other.map(add);
  for (let j = 0; j < Math.ceil(m / 2); j += 1) {
    const at = second + 1 + j;
    if (m % 2 === 1 && j === Math.ceil(m / 2) - 1) left.push({ tall: leftAt[j], topPos: at, bottomPos: at });
    else left.push({ bottom: leftAt[j], top: leftAt[m - 1 - j], bottomPos: at, topPos: second + m - j });
  }
  const columns = [...left.reverse(), { tall: 0, topPos: 0, bottomPos: second, shared: true }, ...right];
  return { cells, columns, arrows, arrowAnswers, pair: true, returnPos: -1 };
}

function normalise(spec = {}) {
  const raw = Array.isArray(spec.boxes) ? spec.boxes : Array.isArray(spec.stages) ? spec.stages : [];
  const given = Array.isArray(spec.arrows) ? spec.arrows : [];
  const entries = raw.map((_, i) => arrowEntry(given[i]));
  const t = track(raw, entries.map((e) => e.text), entries.map((e) => e.answer));
  return {
    ...t,
    blankRoom: spec.blankRoom === true,
    arrowLine: spec.arrowLine === true,
    labelLine: spec.labelLine === true,
    arrowHeads: spec.arrowHeads !== false,
    title: filled(spec.title) ? String(spec.title).trim() : '',
    text: spec.text == null ? '' : String(spec.text).trim(),
  };
}

function wrapped(text, pt, width, bold, most, what, profile) {
  const lines = T.wrap(text, pt, width, bold);
  if (!lines) {
    return new Error(
      `CYCLE_WORD_TOO_WIDE: the word "${T.longestWord(text, pt, bold)}" in "${text}" is wider than its ${what} at the ${profile.minFontPt}pt readable size. ` +
        'Use a shorter word, or give the cycle more width; a word is never split.'
    );
  }
  if (lines.length > most) {
    return new Error(
      `CYCLE_WORDS_TOO_LONG: "${text}" takes ${lines.length} lines in its ${what} at the ${profile.minFontPt}pt readable size, and it holds ${most}. ` +
        'Shorten it, or give the cycle more width.'
    );
  }
  return lines;
}

// The arrows of a track, before anything is measured: which are level (along
// a row) and which are upright (the turn at an end).
function joins(n) {
  const cols = n.columns;
  const level = [];
  for (let c = 0; c < cols.length - 1; c += 1) {
    level.push({ row: 'top', from: c, to: c + 1, pos: cols[c].topPos });
    level.push({ row: 'bottom', from: c + 1, to: c, pos: cols[c + 1].bottomPos });
  }
  const upright = [];
  const last = cols.length - 1;
  if (cols[0].tall == null) upright.push({ end: 'left', col: 0, pos: cols[0].bottomPos });
  if (cols[last].tall == null) upright.push({ end: 'right', col: last, pos: cols[last].topPos });
  return { level, upright };
}

function layoutAt(n, profile, pt) {
  const bold = profile.bold;
  const W = profile.widthPt;
  const cols = n.columns;
  const C = cols.length;
  const gap = ARROW_GAP * pt;
  const { level, upright } = joins(n);
  const anyPic = n.cells.some((b) => b && b.pic);
  const anyBlank = n.blankRoom || n.cells.some((b) => !b || (!b.text && !b.pic));

  // ── Across: the arrows take the width their words need, the stages the rest.
  const base = (n.arrowHeads ? ARROW_W : JOIN_W) * pt;
  const levelWords = level.map((a) => n.arrows[a.pos]).filter(Boolean);
  const levelLine = n.arrowLine && level.some((a) => !n.arrows[a.pos]);
  let wordsW = 0;
  if (levelWords.length) {
    const natural = Math.max(...levelWords.map((w) => T.widthPt(w, pt, bold)));
    const longest = Math.max(...levelWords.map((w) => T.widthPt(T.longestWord(w, pt, bold), pt, bold)));
    const spare = (W - 2 * PAD * pt - C * BOX_PREF_W * pt) / (C - 1) - 2 * gap;
    wordsW = Math.max(longest, Math.min(natural, ARROW_WORDS_MAX_W * pt, spare)) + 1;
  }
  const run = Math.max(base, wordsW, levelLine ? WRITE_LINE_W * pt : 0);
  const minW = (anyBlank ? BLANK_MIN_W : BOX_MIN_W) * pt;
  let boxW = Math.min((anyPic ? PIC_MAX_W : BOX_MAX_W) * pt, (W - 2 * PAD * pt - (C - 1) * (run + 2 * gap)) / C);
  if (boxW < minW) {
    const need = (C * minW + (C - 1) * (run + 2 * gap) + 2 * PAD * pt) * (profile.minFontPt / pt);
    return new Error(
      `CYCLE_TOO_NARROW: ${n.cells.length} stages and their arrows need ${((need / 72) * 25.4).toFixed(0)}mm across at the ${profile.minFontPt}pt readable size and this space is ${((W / 72) * 25.4).toFixed(0)}mm. ` +
        'Give the cycle more width, shorten the words beside its arrows, or drop a stage.'
    );
  }

  const stemLines = n.text ? T.wrap(n.text, pt, W - 2 * PAD * pt, bold) : [];
  if (stemLines === null) return new Error(`CYCLE_TOO_NARROW: a word in the question "${n.text}" is wider than this space.`);
  const stemH = stemLines.length ? T.blockHeight(stemLines.length, pt) + STEM_GAP * pt : 0;

  const labelPt = pt * LABEL_SCALE;
  const titlePt = pt * TITLE_SCALE;
  const levelLines = [];
  for (const a of level) {
    const words = n.arrows[a.pos];
    const lines = words ? wrapped(words, pt, run, bold, ARROW_WORDS_MAX_LINES, 'arrow', profile) : [];
    if (lines instanceof Error) return lines;
    levelLines.push(lines);
  }
  const levelWordsH = Math.max(0, ...levelLines.map((l) => T.blockHeight(l.length, pt)));
  // The shaft runs through the middle of its row, with its words above it, so
  // a row is never shallower than twice what sits above the shaft.
  const aboveShaft = Math.max(levelWordsH ? levelWordsH + ARROW_WORDS_GAP * pt : 0, levelLine ? (WRITE_LINE_H + WRITE_LINE_CLEAR) * pt : 0);
  const mainFloor = aboveShaft ? 2 * (aboveShaft + (ARROW_STROKE * pt) / 2) : 0;

  // Everything that follows from the stage width: the words in the stages, and
  // what the middle of the loop holds.
  const measure = (w) => {
    const inner = w - 2 * BOX_PAD_X * pt;
    const join = anyPic ? Math.max(run, Math.min(ARROW_MAX_W * pt, (W - 2 * PAD * pt - C * w) / (C - 1) - 2 * gap)) : run;
    const colX = (c) => PAD * pt + c * (w + join + 2 * gap);
    const contentW = C * w + (C - 1) * (join + 2 * gap) + 2 * PAD * pt;
    const cells = [];
    for (let i = 0; i < n.cells.length; i += 1) {
      const b = n.cells[i];
      const tall = cols.some((c) => c.tall === i);
      const boxed = tall || !(b && b.pic);
      const name = !b || !b.text ? [] : wrapped(b.text, pt, boxed ? inner : w, true, b.pic ? NAME_MAX_LINES : BOX_MAX_LINES, b.pic ? 'picture' : 'box', profile);
      if (name instanceof Error) return name;
      const label = b && b.label ? wrapped(b.label, labelPt, tall ? inner : w, true, LABEL_MAX_LINES, 'label', profile) : [];
      if (label instanceof Error) return label;
      cells.push({ b, tall, lines: name, labelLines: label });
    }
    const pairs = cells.filter((c) => !c.tall);
    const talls = cells.filter((c) => c.tall);
    const wordPairs = pairs.filter((c) => !(c.b && c.b.pic));
    const picPairs = pairs.filter((c) => c.b && c.b.pic);
    const boxH = Math.max(BOX_MIN_H * pt, T.blockHeight(Math.max(0, ...wordPairs.map((c) => c.lines.length)), pt) + 2 * BOX_PAD_Y * pt);
    const nameLines = Math.max(0, ...picPairs.map((c) => c.lines.length));
    const nameH = nameLines ? PIC_NAME_GAP * pt + T.blockHeight(nameLines, pt) : 0;
    const labelLines = Math.max(0, ...pairs.map((c) => c.labelLines.length));
    const writeLine = n.labelLine && pairs.some((c) => !c.labelLines.length);
    const labelH = Math.max(labelLines ? LABEL_GAP * pt + T.blockHeight(labelLines, labelPt) : 0, writeLine ? WRITE_LINE_H * pt : 0);
    const shape = picPairs.length ? Math.min(1, Math.max(...picPairs.map((c) => c.b.pic.h / c.b.pic.w))) : 0;

    // The middle: the two turns, the words beside them, and the title.
    const sides = {};
    for (const u of upright) {
      const words = n.arrows[u.pos];
      sides[u.end] = { ...u, words, line: !words && n.arrowLine, x: colX(u.col) + w / 2 };
    }
    const offset = SIDE_WORDS_OFFSET * pt;
    const natural = (s) => (s.words ? Math.min(T.widthPt(s.words, pt, bold), ARROW_WORDS_MAX_W * pt) + 1 : s.line ? WRITE_LINE_W * pt : 0);
    const least = (s) => (s.words ? T.widthPt(T.longestWord(s.words, pt, bold), pt, bold) + 1 : s.line ? WRITE_LINE_W * pt : 0);
    const has = (s) => s && (s.words || s.line);
    let titleBox = null;
    let titleAboveH = 0;
    let titleLines = [];
    if (n.pair) {
      // Each turn's words run inwards as far as the next column.
      for (const s of Object.values(sides)) {
        if (!has(s)) continue;
        s.w = Math.min(natural(s), w / 2 + join + 2 * gap - offset - 0.4 * pt);
        if (s.w < least(s) - 1e-6) return new Error(`CYCLE_TOO_NARROW: the words "${s.words}" beside an arrow do not fit at the ${profile.minFontPt}pt readable size. Shorten them, or give the cycle more width.`);
      }
      if (n.title) {
        // A shared stage stands in the middle, so the title goes above.
        titleLines = wrapped(n.title, titlePt, contentW - 2 * PAD * pt, true, TITLE_MAX_LINES, 'title', profile);
        if (titleLines instanceof Error) return titleLines;
        titleAboveH = T.blockHeight(titleLines.length, titlePt) + STEM_GAP * pt;
      }
    } else {
      const xL = sides.left.x;
      const xR = sides.right ? sides.right.x : colX(C - 1);
      const span = xR - xL;
      const reserve = (s, sw) => (has(s) ? offset + sw : 0);
      const place = (pick) => {
        const lw = has(sides.left) ? pick(sides.left) : 0;
        const rw = has(sides.right) ? pick(sides.right) : 0;
        return { lw, rw, room: span - reserve(sides.left, lw) - reserve(sides.right, rw) - 2 * TITLE_PAD * pt };
      };
      let got = place(natural);
      let inside = null;
      if (n.title) {
        const fits = (room) => {
          const lines = room > 0 ? T.wrap(n.title, titlePt, room, true) : null;
          return lines && lines.length <= TITLE_MAX_LINES ? lines : null;
        };
        inside = fits(got.room);
        if (!inside) {
          const tighter = place(least);
          inside = fits(tighter.room);
          if (inside) got = tighter;
        }
      }
      if (inside) {
        titleLines = inside;
        const tw = T.linesWidth(inside, titlePt, true);
        const left = xL + reserve(sides.left, got.lw) + TITLE_PAD * pt;
        titleBox = { x: left + (got.room - tw) / 2, w: tw, cx: left + got.room / 2 };
      } else {
        // No title in the middle (none given, or the words beside the two
        // turns leave it no room, when it goes above as a heading): the two
        // turns' words share the middle between them.
        if (n.title) {
          titleLines = wrapped(n.title, titlePt, contentW - 2 * PAD * pt, true, TITLE_MAX_LINES, 'title', profile);
          if (titleLines instanceof Error) return titleLines;
          titleAboveH = T.blockHeight(titleLines.length, titlePt) + STEM_GAP * pt;
        }
        const each = (span - 0.8 * pt) / (has(sides.left) && has(sides.right) ? 2 : 1) - offset;
        got = { lw: Math.min(got.lw, each), rw: Math.min(got.rw, each) };
        for (const s of Object.values(sides)) {
          if (has(s) && each < least(s) - 1e-6) return new Error(`CYCLE_TOO_NARROW: the words "${s.words || ''}" beside an arrow do not fit at the ${profile.minFontPt}pt readable size. Shorten them, or give the cycle more width.`);
        }
      }
      if (has(sides.left)) sides.left.w = got.lw;
      if (has(sides.right)) sides.right.w = got.rw;
    }
    let sideH = 0;
    for (const s of Object.values(sides)) {
      s.lines = s.words ? wrapped(s.words, pt, s.w, bold, ARROW_WORDS_MAX_LINES + 1, 'arrow', profile) : [];
      if (s.lines instanceof Error) return s.lines;
      sideH = Math.max(sideH, T.blockHeight(s.lines.length, pt), s.line ? WRITE_LINE_H * pt : 0);
    }
    const titleInH = titleBox ? T.blockHeight(titleLines.length, titlePt) : 0;
    const midH = Math.max(MID_MIN * pt, upright.length ? base + 2 * gap : 0, sideH ? sideH + 2 * MID_PAD * pt : 0, titleInH ? titleInH + 2 * MID_PAD * pt : 0);

    // What a tall stage needs from top to bottom, with its picture at the
    // width it has.
    let tallNeed = 0;
    for (const c of talls) {
      const wordsH = T.blockHeight(c.lines.length, pt) + (c.labelLines.length ? LABEL_GAP * pt + T.blockHeight(c.labelLines.length, labelPt) : n.labelLine ? WRITE_LINE_H * pt : 0);
      const picH = c.b && c.b.pic ? Math.min(inner, inner * (c.b.pic.h / c.b.pic.w)) + (c.lines.length ? PIC_NAME_GAP * pt : 0) : 0;
      c.wordsH = wordsH;
      c.need = wordsH + 2 * BOX_PAD_Y * pt;
      tallNeed = Math.max(tallNeed, c.need + picH);
    }
    return { w, join, colX, contentW, cells, boxH, nameH, labelH, writeLine, shape, sides, titleLines, titleBox, titleAboveH, midH, tallNeed, anyWordPair: wordPairs.length > 0, anyPicPair: picPairs.length > 0, talls };
  };

  let m = measure(boxW);
  if (m instanceof Error) return m;
  let mainH = 0;
  let wide = null;
  for (let pass = 0; pass < 2; pass += 1) {
    const under = m.nameH + m.labelH;
    const floor = Math.max(m.anyWordPair ? m.boxH : 0, mainFloor, m.anyPicPair ? PIC_MIN_H * pt : 0, pt);
    // A tall stage spans both rows and the middle, less what hangs under the
    // bottom row.
    const tallDriven = (m.tallNeed - m.midH - under) / 2;
    mainH = Math.max(floor, m.anyPicPair ? boxW * m.shape : 0, tallDriven);
    if (!profile.heightPt) break;
    const room = (profile.heightPt - (2 * PAD * pt + stemH + m.titleAboveH + m.midH + 2 * under)) / 2;
    if (room < floor - 0.5 && wide) {
      // The narrower stage wrapped its words onto more lines than the space
      // has: keep the wide one, with its pictures as deep as the room allowed.
      ({ m, boxW, mainH } = wide);
      break;
    }
    if (room < floor - 0.5) {
      return new Error(
        `CYCLE_ZONE_TOO_SHALLOW: the cycle needs ${((2 * PAD * pt + stemH + m.titleAboveH + m.midH + 2 * (under + floor)) / 72).toFixed(2)}in of height at the ${profile.minFontPt}pt readable size and the space is ${(profile.heightPt / 72).toFixed(2)}in. ` +
          'Give it more height, or shorten the stages and the words beside the arrows.'
      );
    }
    if (mainH <= room) break;
    mainH = room;
    // A shallow space is a narrower stage, not a letterbox: the pictures keep
    // their shape and the arrows take the width they leave.
    // Never narrower than the longest word under a picture: a name is not
    // split, so a narrow frame would refuse the whole cycle for one word.
    const widestWord = Math.max(0, ...n.cells.filter((c) => c && c.pic).flatMap((c) => [
      c.text ? T.widthPt(T.longestWord(c.text, pt, true), pt, true) : 0,
      c.label ? T.widthPt(T.longestWord(c.label, labelPt, true), labelPt, true) : 0,
    ])) + 1;
    const narrower = m.anyPicPair ? Math.max(minW, widestWord, Math.min(boxW, room / m.shape)) : boxW;
    if (pass === 1 || narrower >= boxW - 0.5) break;
    wide = { m, boxW, mainH };
    const tried = measure(narrower);
    if (tried instanceof Error) break;
    boxW = narrower;
    m = tried;
  }
  const cellH = mainH + m.nameH + m.labelH;
  const tallH = cellH + m.midH + mainH;
  for (const c of m.talls) {
    if (c.need > tallH + 0.5) {
      return new Error(`CYCLE_ZONE_TOO_SHALLOW: "${c.b && c.b.text}" does not fit in its stage at the ${profile.minFontPt}pt readable size. Give the cycle more height, or shorten it.`);
    }
  }
  const h = 2 * PAD * pt + stemH + m.titleAboveH + 2 * cellH + m.midH;
  return { pt, labelPt, titlePt, run, base, boxW, mainH, cellH, tallH, stemLines, stemH, h, ...m };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const own = answersShown(profile) ? spec : withoutAnswers(spec);
  const mine = normalise(own);
  const room = Array.isArray(spec.roomFor) && spec.roomFor.length ? roomSpec(own, spec.roomFor) : null;
  const shared = room ? normalise(room) : null;
  // Laid out round what every slide sharing the place writes, then given its
  // own words back. A loop that is not the same shape as the others is laid
  // out on its own.
  if (shared && JSON.stringify(shared.columns) === JSON.stringify(mine.columns)) {
    return ownWords(layoutOf(shared, profile), mine);
  }
  return layoutOf(mine, profile);
}

function layoutOf(n, profile) {
  // The board may grow a drawing into spare room, so a cycle of four short
  // names fills its space instead of sitting small in the middle of it. Not
  // one with pictures: there the spare room is the pictures', and bigger words
  // would take it from them.
  const grow = n.cells.some((b) => b && b.pic) ? 1 : profile.grow || 1;
  const L = T.settle(profile, (pt) => layoutAt(n, profile, pt), { maxPt: profile.fontPt * grow });
  const { pt } = L;
  const gap = ARROW_GAP * pt;
  const W = L.contentW;
  const yTop = PAD * pt + L.stemH + L.titleAboveH;
  const yBottom = yTop + L.cellH + L.midH;
  const shaft = { top: yTop + L.mainH / 2, bottom: yBottom + L.mainH / 2 };
  const inner = L.boxW - 2 * BOX_PAD_X * pt;

  // Each stage: where its box or picture is, and where its own ink ends.
  const boxes = n.cells.map(() => null);
  const place = (i, x, y, tall) => {
    const c = L.cells[i];
    const b = c.b;
    const out = { index: i, text: b ? b.text : null, label: b ? b.label : null, tall, x, y, w: L.boxW, lines: c.lines, labelLines: c.labelLines, pic: null, boxed: tall || !(b && b.pic) };
    if (tall) {
      out.h = L.tallH;
      const picRoom = L.tallH - c.need - (c.lines.length ? PIC_NAME_GAP * pt : 0);
      if (b && b.pic && picRoom > 1) {
        const fitted = chain.fit(b.pic, x + BOX_PAD_X * pt, 0, inner, Math.min(picRoom, inner * (b.pic.h / b.pic.w)));
        const stack = fitted.h + (c.lines.length ? PIC_NAME_GAP * pt : 0) + c.wordsH;
        const top = y + (L.tallH - stack) / 2;
        out.pic = { ...fitted, y: top };
        out.nameY = top + fitted.h + (c.lines.length ? PIC_NAME_GAP * pt : 0);
      } else {
        out.nameY = y + (L.tallH - c.wordsH) / 2;
      }
      out.labelY = out.nameY + T.blockHeight(c.lines.length, pt);
      out.writeLine = n.labelLine && !c.labelLines.length;
      out.bottom = y + L.tallH;
      return out;
    }
    out.h = L.mainH;
    out.pic = b && b.pic ? chain.fit(b.pic, x, y, L.boxW, L.mainH) : null;
    // A picture wider than the frame it shares sits in the middle of it, and
    // its name sits under the picture itself, not under the frame, so the two
    // read as one thing.
    out.nameY = out.pic ? out.pic.y + out.pic.h + (c.lines.length ? PIC_NAME_GAP * pt : 0) : y + (L.mainH - T.blockHeight(c.lines.length, pt)) / 2;
    out.labelY = out.pic ? out.nameY + T.blockHeight(c.lines.length, pt) : y + L.mainH;
    out.writeLine = L.writeLine && !c.labelLines.length;
    const ownLabel = c.labelLines.length ? LABEL_GAP * pt + T.blockHeight(c.labelLines.length, L.labelPt) : out.writeLine ? WRITE_LINE_H * pt : 0;
    out.bottom = out.labelY + ownLabel;
    return out;
  };
  n.columns.forEach((col, c) => {
    const x = L.colX(c);
    if (col.tall != null) boxes[col.tall] = place(col.tall, x, yTop, true);
    else {
      boxes[col.top] = place(col.top, x, yTop, false);
      boxes[col.bottom] = place(col.bottom, x, yBottom, false);
    }
  });

  const { level, upright } = joins(n);
  const arrows = [];
  level.forEach((a) => {
    const y = shaft[a.row];
    const leftCol = Math.min(a.from, a.to);
    const xa = L.colX(leftCol) + L.boxW + gap;
    const xb = xa + L.join;
    const lines = T.wrap(n.arrows[a.pos] || '', pt, L.run, profile.bold) || [];
    const wordsH = T.blockHeight(lines.length, pt);
    const cx = (xa + xb) / 2;
    const wordsW = T.linesWidth(lines, pt, profile.bold);
    const top = y - (ARROW_STROKE * pt) / 2 - ARROW_WORDS_GAP * pt - wordsH;
    const line = !lines.length && n.arrowLine ? { x: cx - Math.min(L.join, WRITE_LINE_W * pt) / 2, y: y - WRITE_LINE_CLEAR * pt, w: Math.min(L.join, WRITE_LINE_W * pt) } : null;
    const lineW = Math.min(L.join, WRITE_LINE_W * pt);
    arrows.push({
      pos: a.pos, level: true, returns: a.pos === n.returnPos,
      x1: a.row === 'top' ? xa : xb, y1: y, x2: a.row === 'top' ? xb : xa, y2: y,
      lines, words: lines.length ? { x: cx - wordsW / 2, y: top, w: wordsW, h: wordsH, cx, anchor: 'middle' } : null, line,
      room: {
        width: L.run, lineAt: { x: cx - lineW / 2, y: y - WRITE_LINE_CLEAR * pt, w: lineW },
        wordsAt: (ws, h) => ({ x: cx - ws / 2, y: y - (ARROW_STROKE * pt) / 2 - ARROW_WORDS_GAP * pt - h, w: ws, h, cx, anchor: 'middle' }),
      },
    });
  });
  upright.forEach((u) => {
    const s = L.sides[u.end];
    const col = n.columns[u.col];
    const ya = boxes[col.top].bottom + gap;
    const yb = yBottom - gap;
    // Beside the turn, in the middle of the space between the rows, so the
    // words never sit level with a name hanging under a neighbouring picture.
    const cy = yTop + L.cellH + L.midH / 2;
    const inward = u.end === 'left' ? 1 : -1;
    const wordsH = T.blockHeight(s.lines.length, pt);
    const wordsW = T.linesWidth(s.lines, pt, profile.bold);
    const tx = s.x + inward * SIDE_WORDS_OFFSET * pt;
    const lineW = s.line ? s.w || WRITE_LINE_W * pt : 0;
    const roomW = s.w || WRITE_LINE_W * pt;
    arrows.push({
      pos: u.pos, level: false, returns: u.pos === n.returnPos,
      x1: s.x, y1: u.end === 'left' ? yb : ya, x2: s.x, y2: u.end === 'left' ? ya : yb,
      lines: s.lines,
      words: s.lines.length ? { x: inward > 0 ? tx : tx - wordsW, y: cy - wordsH / 2, w: wordsW, h: wordsH, cx: tx, anchor: inward > 0 ? 'start' : 'end' } : null,
      line: s.line ? { x: inward > 0 ? tx : tx - lineW, y: cy + (WRITE_LINE_H * pt) / 2 - 0.2 * pt, w: lineW } : null,
      room: {
        width: roomW, lineAt: { x: inward > 0 ? tx : tx - roomW, y: cy + (WRITE_LINE_H * pt) / 2 - 0.2 * pt, w: roomW },
        wordsAt: (ws, h) => ({ x: inward > 0 ? tx : tx - ws, y: cy - h / 2, w: ws, h, cx: tx, anchor: inward > 0 ? 'start' : 'end' }),
      },
    });
  });

  const titleH = T.blockHeight(L.titleLines.length, L.titlePt);
  const title = !L.titleLines.length
    ? null
    : L.titleBox
      ? { lines: L.titleLines, cx: L.titleBox.cx, x: L.titleBox.x, w: L.titleBox.w, y: yTop + L.cellH + (L.midH - titleH) / 2, h: titleH }
      : { lines: L.titleLines, cx: W / 2, x: (W - T.linesWidth(L.titleLines, L.titlePt, true)) / 2, w: T.linesWidth(L.titleLines, L.titlePt, true), y: PAD * pt + L.stemH, h: titleH };
  boxes.forEach((b, i) => { if (b) b.answer = Boolean(n.cells[i] && n.cells[i].answer); });
  arrows.forEach((a) => { a.answer = Boolean(n.arrowAnswers && n.arrowAnswers[a.pos]); });
  return { ...L, n, profile, W, boxes, arrows, title, yTop, yBottom, shaft };
}

// A loop laid out round every slide's words, given this slide's own: a stage
// this slide leaves empty draws as an empty box in the same place, an arrow it
// leaves empty draws with nothing beside it (or its writing line), and words
// that differ are set again in the same room.
function ownWords(L, mine) {
  const { pt } = L;
  L.boxes.forEach((b, i) => {
    if (!b) return;
    const c = mine.cells[i];
    b.answer = Boolean(c && c.answer);
    const text = c && c.text ? c.text : null;
    if (text !== b.text) {
      const before = T.blockHeight(b.lines.length, pt);
      b.text = text;
      b.lines = text ? T.wrap(text, pt, b.boxed ? b.w - 2 * BOX_PAD_X * pt : b.w, true) || [text] : [];
      if (!b.pic) b.nameY += (before - T.blockHeight(b.lines.length, pt)) / 2;
    }
    const label = c && c.label ? c.label : null;
    if (label !== b.label) {
      b.label = label;
      b.labelLines = label ? T.wrap(label, L.labelPt, b.tall ? b.w - 2 * BOX_PAD_X * pt : b.w, true) || [label] : [];
      b.writeLine = !b.labelLines.length && mine.labelLine;
    }
  });
  L.arrows.forEach((a) => {
    a.answer = Boolean(mine.arrowAnswers && mine.arrowAnswers[a.pos]);
    const text = mine.arrows[a.pos] || null;
    if (text === (L.n.arrows[a.pos] || null)) return;
    if (!text) {
      a.lines = [];
      a.words = null;
      a.line = mine.arrowLine ? a.room.lineAt : null;
      return;
    }
    a.lines = T.wrap(text, pt, a.room.width, L.profile.bold) || [text];
    a.words = a.room.wordsAt(T.linesWidth(a.lines, pt, L.profile.bold), T.blockHeight(a.lines.length, pt));
    a.line = null;
  });
  return { ...L, n: { ...L.n, cells: mine.cells, arrows: mine.arrows, arrowAnswers: mine.arrowAnswers } };
}

// One arrow, level or upright, from its tail to its tip.
function arrowSvg(a, pt, ink, heads) {
  const s = ARROW_STROKE * pt;
  const head = heads ? ARROW_HEAD_W * pt : 0;
  const half = (ARROW_HEAD_H * pt) / 2;
  const cls = `${heads ? 'cycle-arrow' : 'cycle-join'}${a.returns ? ' cycle-return' : ''}`;
  if (a.level) {
    const dir = a.x2 > a.x1 ? 1 : -1;
    const end = a.x2 - dir * Math.max(0, head - 0.5);
    const bar = `<rect x="${T.f2(Math.min(a.x1, end))}" y="${T.f2(a.y1 - s / 2)}" width="${T.f2(Math.abs(end - a.x1))}" height="${T.f2(s)}" fill="${ink}"/>`;
    const tip = heads ? `<polygon points="${T.f2(a.x2)},${T.f2(a.y2)} ${T.f2(a.x2 - dir * head)},${T.f2(a.y2 - half)} ${T.f2(a.x2 - dir * head)},${T.f2(a.y2 + half)}" fill="${ink}"/>` : '';
    return `<g class="${cls}">${bar}${tip}</g>`;
  }
  const dir = a.y2 > a.y1 ? 1 : -1;
  const end = a.y2 - dir * Math.max(0, head - 0.5);
  const bar = `<rect x="${T.f2(a.x1 - s / 2)}" y="${T.f2(Math.min(a.y1, end))}" width="${T.f2(s)}" height="${T.f2(Math.abs(end - a.y1))}" fill="${ink}"/>`;
  const tip = heads ? `<polygon points="${T.f2(a.x2)},${T.f2(a.y2)} ${T.f2(a.x2 - half)},${T.f2(a.y2 - dir * head)} ${T.f2(a.x2 + half)},${T.f2(a.y2 - dir * head)}" fill="${ink}"/>` : '';
  return `<g class="${cls}">${bar}${tip}</g>`;
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { pt, profile, n } = L;
  const c = profile.colours;
  // An answer is green wherever it is drawn: the board's own answer colour on
  // a surface that shows answers in colour, and the same green on the
  // teacher's answer sheet, whose sheet colours otherwise print it as ink.
  const answer = profile.answers === 'show' && profile.palette === 'sheet' ? PALETTES.colour.answer : c.answer;
  const font = profile.font;
  const parts = [];
  const hair = Math.max(0.5, (BOX_STROKE * pt) / 2);
  const rule = (x, y, w, cls) => `<rect class="${cls}" x="${T.f2(x)}" y="${T.f2(y - hair)}" width="${T.f2(w)}" height="${T.f2(hair)}" fill="${c.ink}"/>`;
  if (L.stemLines.length) parts.push(T.textLines(L.stemLines, PAD * pt, PAD * pt, pt, { fill: c.ink, font, bold: profile.bold, anchor: 'start' }));
  if (L.title) parts.push(`<g class="cycle-title">${T.textLines(L.title.lines, L.title.cx, L.title.y, L.titlePt, { fill: c.ink, font, bold: true })}</g>`);
  L.boxes.forEach((b) => {
    const cx = b.x + b.w / 2;
    if (b.boxed) {
      parts.push(
        `<rect class="cycle-stage" x="${T.f2(b.x)}" y="${T.f2(b.y)}" width="${T.f2(b.w)}" height="${T.f2(b.h)}" rx="${T.f2(BOX_RADIUS * pt)}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${T.f2(Math.max(1, BOX_STROKE * pt))}"/>`
      );
    }
    if (b.pic) parts.push(chain.imageTag(b.pic));
    if (b.lines.length) parts.push(T.textLines(b.lines, cx, b.nameY, pt, { fill: b.answer ? answer : c.ink, font, bold: true }));
    if (b.labelLines.length) {
      parts.push(`<g class="cycle-label">${T.textLines(b.labelLines, cx, b.labelY + LABEL_GAP * pt, L.labelPt, { fill: c.answer, font, bold: true })}</g>`);
    } else if (b.writeLine) {
      const lw = (b.tall ? b.w - 2 * BOX_PAD_X * pt : b.w) * LABEL_LINE_SHARE;
      parts.push(rule(cx - lw / 2, b.labelY + WRITE_LINE_H * pt, lw, 'cycle-label-line'));
    }
  });
  L.arrows.forEach((a) => {
    parts.push(arrowSvg(a, pt, c.ink, n.arrowHeads));
    if (a.words) parts.push(`<g class="cycle-arrow-words">${T.textLines(a.lines, a.words.cx, a.words.y, pt, { fill: a.answer ? answer : c.ink, font, bold: profile.bold, anchor: a.words.anchor })}</g>`);
    if (a.line) parts.push(rule(a.line.x, a.line.y, a.line.w, 'cycle-arrow-line'));
  });
  return { svg: T.svgDoc(L.W, L.h, parts), w: L.W, h: L.h, aspect: L.W / L.h, layout: L };
}

// The pictures are named by their files in the key: a photograph's own bytes
// would make a key of megabytes.
function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  const shown = answersShown(p);
  const n = normalise(shown ? spec : withoutAnswers(spec));
  const slim = (b) => (b ? { text: b.text, label: b.label, answer: b.answer, pic: b.pic ? [b.imagePath || (b.pic.href || '').length, Boolean(b.pic.href), b.pic.w, b.pic.h] : null } : null);
  const room = Array.isArray(spec.roomFor) && spec.roomFor.length ? `:room:${JSON.stringify(spec.roomFor)}` : '';
  return `cycle:${T.profileKey(p)}${shown ? '' : ':question'}:${JSON.stringify({ ...n, cells: n.cells.map(slim) })}${room}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, MIN_STAGES, MAX_STAGES };
