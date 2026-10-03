'use strict';

// THE annotated text: a passage set in the middle, marked up the way a teacher
// marks a model text on the board. Words underlined, circled, boxed or
// highlighted in colour; arrows from one word to another; short notes in the
// margin joined to the words they are about. One drawing, placed by the board,
// the worksheet, the working wall and the stick-in pack.
//
// It is one drawing for every kind of text a lesson reads closely, not a poem
// helper: a renga with the word each stanza picks up circled and the two joined
// by an arrow; a model paragraph with its fronted adverbials underlined and
// labelled; one sentence with its main clause boxed; a source extract with the
// telling phrase highlighted and a note on what it shows. Until 2 October 2026
// the board could only fake a poem with stacked text boxes and the wall could
// not show one at all, so a renga wall showed the poem's shape and never the
// links that are the point of it.
//
// The marks NAME the words they mark (`find`), never a position. The text is
// laid out at draw time and rewraps with the zone, so a mark placed by position
// would land on the wrong word the first time the zone changed; a mark that
// names its words is found again every time the text is drawn.
//
// Everything a mark draws sits in white space: an underline under its word, a
// ring round it, and every arrow and note leader runs through the gaps between
// lines and down the margins, never across another word. That is why a marked
// text is set with more room between its lines than a plain one.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//   describeLayout(spec, profile) -> where every line, mark, note and arrow went
//
// Spec:
//   lines    a poem or anything whose line breaks are the author's: one entry
//            per line, and "" for the gap between stanzas. A line too long for
//            the room wraps with its continuation indented.
//   passage  prose, wrapped to the room. A blank line ("\n\n") starts a new
//            paragraph. Give `lines` or `passage`, not both.
//   marks    what is marked. Each:
//              find     the word or words to mark, as printed ("Puddles",
//                       "As the sun set"). Punctuation at either end of a word
//                       is ignored when matching, and case is ignored when no
//                       exact match exists.
//              nth      which occurrence, counting from 1 through the whole
//                       text (default 1).
//              style    underline | wavy | circle | box | highlight | colour
//                       (default underline). `colour` prints the words
//                       themselves in the colour.
//              colour   blue | green | orange | red | purple (default blue).
//              note     a short note in the margin, joined to the words by a
//                       line. "" or `write: true` leaves a ruled line there
//                       for the child to write the note.
//              side     left | right: which margin the note goes in (default:
//                       the margin nearer the words, so its line is short).
//              id       a name for an arrow to refer to (default: `find`).
//   links    arrows between marked words, drawn down the left margin. Each:
//              from, to   a mark's id (or its `find`)
//              colour     default: the colour of the `from` mark
//   counts   with `lines`: one entry per entry of `lines` (null, or nothing,
//            for a line with none and for a stanza gap), printed in a column
//            just right of the passage, so a pattern down the lines shows at a
//            glance: a poem's syllables, line numbers. `countColour` (default
//            blue) colours them.
//   brackets notes on a whole stanza or paragraph, each drawn as a bracket
//            down its right-hand side with the note beside it:
//              stanza (or paragraph)  which one, counting from 1
//              note    "3 lines: 5, 7, 5", "Always ends on 2 lines"
//              colour  default purple
//   space    "annotate" leaves wide empty margins and roomy lines for the child
//            to mark the text by hand: the write-on form.
//   title    an optional heading printed above the passage.
//   text     the question above the drawing, as on every other drawing (the
//            worksheet prints it as its own line of sheet text; the other
//            surfaces draw it above the title).

const T = require('./figure-text');
const { INK_TONES } = require('./surface-profiles');

// ─── CONSTANTS (in ems of the settled text size) ─────────────────────────────
// Line pitch: a plain text reads at ordinary leading; a marked one needs a gap
// under every line for underlines, and a wider one where arrows and leaders run.
const PITCH_PLAIN = 1.3;
const PITCH_MARKED = 1.55;
const PITCH_ROUTED = 1.8;
const PITCH_ANNOTATE = 2.3;
const STANZA_GAP = 0.5; // extra space between stanzas or paragraphs, in pitches
const TEXT_BOX = 1.25; // the height of one line of words
const INDENT = 1.2; // a wrapped continuation line's indent
const NOTE_SCALE = 0.82; // margin notes are a little smaller than the text
const NOTE_GAP = 0.35; // air between two notes stacked in one margin
const NOTE_MAX_SHARE = 0.3; // one margin is at most this share of the width
const NOTE_MIN_W = 5.5; // a margin narrower than this many ems cannot hold a note
const NOTE_OFFSET = 0.9; // gap between the text and a margin note
const ANNOTATE_SHARE = 0.22; // each margin in the write-on form
const LANE_STEP = 0.55; // between two arrows running down the left margin
const LANE_PAD = 0.5; // between the text and the nearest arrow lane
const UNDERLINE_DROP = 0.12; // below the baseline
const STROKE = 0.085; // marks and arrows
const RING_PAD_X = 0.14;
const RING_PAD_Y = 0.16;
const HEAD_LEN = 0.42;
const HEAD_W = 0.36;
const WRITE_LINE_H = 1.6; // a ruled note line for the child, in note ems
const TITLE_SCALE = 1.1;
const TITLE_GAP = 0.6;
const PAD = 0.2;
const COUNT_GAP = 0.9; // between the end of the longest line and the counts
const BRACKET_GAP = 0.6; // between the counts (or the passage) and a bracket
const BRACKET_TICK = 0.35; // the bracket's ends, turned back towards the text
const MAX_MARKS = 24;
const MAX_LINKS = 8;
// ────────────────────────────────────────────────────────────────────────────

const STYLES = ['underline', 'wavy', 'circle', 'box', 'highlight', 'colour'];
const COLOURS = {
  blue: { colour: '#0070C0', ink: INK_TONES.ink },
  green: { colour: '#00B050', ink: INK_TONES.dark },
  orange: { colour: '#C65911', ink: INK_TONES.mid },
  red: { colour: '#CC0000', ink: INK_TONES.ink },
  purple: { colour: '#7030A0', ink: INK_TONES.dark },
};
const HIGHLIGHT_FILL = {
  blue: '#BDD7EE',
  green: '#C6EFCE',
  orange: '#F8CBAD',
  red: '#F4B6B6',
  purple: '#D9C3E9',
};

function str(v) {
  return v == null ? '' : String(v);
}

function core(word) {
  return word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

function fail(code, message) {
  return new Error(`${code}: ${message}`);
}

// ─── The spec, checked ───────────────────────────────────────────────────────

function normalise(spec = {}) {
  const hasLines = Array.isArray(spec.lines);
  const hasText = typeof spec.passage === 'string' && spec.passage.trim() !== '';
  if (hasLines === hasText) {
    throw fail('ANNOTATED_TEXT_INVALID', 'give the passage as `lines` (one entry per line, "" between stanzas) or as `passage` (prose), and only one of them.');
  }
  // Blocks: each a run of source lines; prose paragraphs wrap, poem lines keep.
  const blocks = [];
  const hasCounts = Array.isArray(spec.counts) && spec.counts.some((c) => c != null && str(c).trim() !== '');
  if (hasCounts && !hasLines) {
    throw fail('ANNOTATED_TEXT_INVALID', '`counts` sit beside lines, so they need the passage as `lines`.');
  }
  if (hasCounts && spec.counts.length > spec.lines.length) {
    throw fail('ANNOTATED_TEXT_INVALID', `there are ${spec.counts.length} counts for ${spec.lines.length} lines; give one per entry of \`lines\`, null for a gap.`);
  }
  if (hasLines) {
    let cur = [];
    let curCounts = [];
    spec.lines.forEach((line, i) => {
      if (str(line).trim() === '') {
        if (cur.length) blocks.push({ kind: 'lines', lines: cur, counts: curCounts });
        cur = [];
        curCounts = [];
      } else {
        cur.push(str(line).trim());
        const c = hasCounts ? spec.counts[i] : null;
        curCounts.push(c == null || str(c).trim() === '' ? null : str(c).trim());
      }
    });
    if (cur.length) blocks.push({ kind: 'lines', lines: cur, counts: curCounts });
  } else {
    for (const para of spec.passage.split(/\r?\n\s*\r?\n/)) {
      const t = para.replace(/\s+/g, ' ').trim();
      if (t) blocks.push({ kind: 'prose', lines: [t] });
    }
  }
  if (!blocks.length) throw fail('ANNOTATED_TEXT_INVALID', 'the passage has no words in it.');

  const marks = (Array.isArray(spec.marks) ? spec.marks : []).map((m, i) => {
    const find = str(m && m.find).trim();
    if (!find) throw fail('ANNOTATED_TEXT_INVALID', `mark ${i + 1} has no \`find\`: name the word or words it marks, as printed.`);
    const style = str(m.style || 'underline').toLowerCase();
    if (!STYLES.includes(style)) throw fail('ANNOTATED_TEXT_INVALID', `mark "${find}" asks for style "${m.style}"; use one of ${STYLES.join(', ')}.`);
    const colour = str(m.colour || 'blue').toLowerCase();
    if (!COLOURS[colour]) throw fail('ANNOTATED_TEXT_INVALID', `mark "${find}" asks for colour "${m.colour}"; use one of ${Object.keys(COLOURS).join(', ')}.`);
    const nth = m.nth == null ? 1 : Number(m.nth);
    if (!Number.isInteger(nth) || nth < 1) throw fail('ANNOTATED_TEXT_INVALID', `mark "${find}" has nth ${m.nth}; count occurrences from 1.`);
    const write = m.write === true || (m.note !== undefined && m.note !== null && str(m.note).trim() === '');
    const note = write ? null : m.note == null ? null : str(m.note).trim();
    const side = str(m.side || 'auto').toLowerCase();
    if (side !== 'left' && side !== 'right' && side !== 'auto') throw fail('ANNOTATED_TEXT_INVALID', `mark "${find}" puts its note on side "${m.side}"; use left or right, or leave it out.`);
    return { id: str(m.id || find).trim(), find, nth, style, colour, note, write, side };
  });
  if (marks.length > MAX_MARKS) {
    throw fail('ANNOTATED_TEXT_TOO_MANY_MARKS', `${marks.length} marks were asked for and ${MAX_MARKS} is the most one passage carries before nothing stands out. Mark what this question is about.`);
  }
  const byId = new Map();
  for (const m of marks) {
    if (byId.has(m.id)) throw fail('ANNOTATED_TEXT_INVALID', `two marks share the id "${m.id}"; give one of them its own \`id\` so an arrow can tell them apart.`);
    byId.set(m.id, m);
  }
  const links = (Array.isArray(spec.links) ? spec.links : []).map((l, i) => {
    const from = str(l && l.from).trim();
    const to = str(l && l.to).trim();
    for (const end of [from, to]) {
      if (!byId.has(end)) {
        throw fail('ANNOTATED_TEXT_UNKNOWN_MARK', `arrow ${i + 1} names "${end}", which is not a mark. An arrow joins two marked words: mark both, then name their ids (or their \`find\`).`);
      }
    }
    if (from === to) throw fail('ANNOTATED_TEXT_INVALID', `arrow ${i + 1} starts and ends on "${from}".`);
    const colour = str(l.colour || byId.get(from).colour).toLowerCase();
    if (!COLOURS[colour]) throw fail('ANNOTATED_TEXT_INVALID', `arrow ${i + 1} asks for colour "${l.colour}"; use one of ${Object.keys(COLOURS).join(', ')}.`);
    return { from, to, colour };
  });
  if (links.length > MAX_LINKS) {
    throw fail('ANNOTATED_TEXT_TOO_MANY_LINKS', `${links.length} arrows were asked for and ${MAX_LINKS} is the most one margin carries readably.`);
  }
  const brackets = (Array.isArray(spec.brackets) ? spec.brackets : []).map((b, i) => {
    const which = Number(b && (b.stanza != null ? b.stanza : b.paragraph));
    if (!Number.isInteger(which) || which < 1 || which > blocks.length) {
      throw fail('ANNOTATED_TEXT_INVALID', `bracket ${i + 1} names stanza ${b && (b.stanza != null ? b.stanza : b.paragraph)}; the passage has ${blocks.length}, counted from 1.`);
    }
    const note = str(b.note).trim();
    if (!note) throw fail('ANNOTATED_TEXT_INVALID', `bracket ${i + 1} has no \`note\`: say what the stanza shows.`);
    const colour = str(b.colour || 'purple').toLowerCase();
    if (!COLOURS[colour]) throw fail('ANNOTATED_TEXT_INVALID', `bracket ${i + 1} asks for colour "${b.colour}"; use one of ${Object.keys(COLOURS).join(', ')}.`);
    return { block: which - 1, note, colour };
  });
  const countColour = str(spec.countColour || 'blue').toLowerCase();
  if (!COLOURS[countColour]) throw fail('ANNOTATED_TEXT_INVALID', `countColour "${spec.countColour}"; use one of ${Object.keys(COLOURS).join(', ')}.`);
  const space = str(spec.space).toLowerCase() === 'annotate' ? 'annotate' : 'set';
  return { blocks, marks, links, brackets, hasCounts, countColour, space, title: str(spec.title).trim(), stem: str(spec.text).trim() };
}

// ─── Laying out the words ────────────────────────────────────────────────────

// The printed lines of the passage at `pt` in `availW`, each a list of words
// with their x offsets, and the running index of every word in the passage.
function setLines(n, pt, availW, bold) {
  const out = [];
  let wordIndex = 0;
  const space = T.widthPt(' ', pt, bold);
  for (let b = 0; b < n.blocks.length; b += 1) {
    const block = n.blocks[b];
    for (let si = 0; si < block.lines.length; si += 1) {
      const source = block.lines[si];
      const words = source.split(/\s+/).filter(Boolean);
      let line = { block: b, indent: 0, words: [], count: block.counts ? block.counts[si] : null };
      let x = 0;
      for (const w of words) {
        const ww = T.widthPt(w, pt, bold);
        const lineStart = line.indent;
        if (ww > availW - lineStart + 1e-6) {
          return fail('ANNOTATED_TEXT_WORD_TOO_WIDE', `the word "${w}" is wider than the room for the passage at the ${pt}pt size. Give the text more width, or narrow its margins by moving notes to one side.`);
        }
        const xAt = line.words.length ? x + space : lineStart;
        if (line.words.length && xAt + ww > availW + 1e-6) {
          out.push(line);
          const indent = block.kind === 'lines' ? INDENT * pt : 0;
          line = { block: b, indent, words: [], count: null };
          x = indent;
          line.words.push({ text: w, x: indent, w: ww, index: wordIndex });
          x = indent + ww;
        } else {
          line.words.push({ text: w, x: xAt, w: ww, index: wordIndex });
          x = xAt + ww;
        }
        wordIndex += 1;
      }
      out.push(line);
    }
  }
  return out;
}

// Every word in reading order, with the printed line it landed on.
function wordList(lines) {
  const all = [];
  lines.forEach((line, li) => line.words.forEach((w) => all.push({ ...w, line: li, key: core(w.text) })));
  return all;
}

// Which printed words a mark covers: the nth run of words matching `find`.
function locate(mark, words) {
  const want = mark.find.split(/\s+/).map(core).filter(Boolean);
  if (!want.length) return null;
  const runs = (exact) => {
    const hits = [];
    for (let i = 0; i + want.length <= words.length; i += 1) {
      let ok = true;
      for (let k = 0; k < want.length; k += 1) {
        const a = words[i + k].key;
        const b = want[k];
        if (exact ? a !== b : a.toLowerCase() !== b.toLowerCase()) {
          ok = false;
          break;
        }
      }
      if (ok) hits.push(words.slice(i, i + want.length));
    }
    return hits;
  };
  let hits = runs(true);
  if (hits.length < mark.nth) hits = runs(false);
  return hits[mark.nth - 1] || null;
}

// The ink of a word without the punctuation either side of it, so an underline
// stops at the word and a ring hugs it.
function coreSpan(w, pt, bold) {
  const lead = w.text.match(/^[^\p{L}\p{N}]*/u)[0];
  const trail = w.text.match(/[^\p{L}\p{N}]*$/u)[0];
  const body = w.text.slice(lead.length, w.text.length - trail.length) || w.text;
  const x = w.x + T.widthPt(lead, pt, bold);
  return { x, w: T.widthPt(body, pt, bold) };
}

function noteLines(note, notePt, w, bold) {
  return T.wrap(note, notePt, w, bold);
}

// The whole drawing at one text size, or an Error saying why it does not fit.
function layoutAt(n, profile, pt) {
  const bold = profile.bold;
  const W = profile.widthPt;
  const notePt = Math.max(profile.minFontPt, Math.round(pt * NOTE_SCALE * 2) / 2);
  const marks = sideMarks(n, profile, pt);
  const anyNotes = { left: false, right: false };
  for (const m of marks) if (m.note || m.write) anyNotes[m.side] = true;
  const routed = n.links.length > 0 || anyNotes.left || anyNotes.right;
  // Notes on a whole stanza sit in the right margin beside their brackets.
  if (n.brackets.length) anyNotes.right = true;
  const pitch = (n.space === 'annotate' ? PITCH_ANNOTATE : routed ? PITCH_ROUTED : n.marks.length ? PITCH_MARKED : PITCH_PLAIN) * pt;

  // The margins. A margin with notes is as wide as its widest note wants, up
  // to a share of the width; the arrows take lanes on the left. When the
  // passage needs the room, a note wraps down to its longest word before the
  // passage gives way.
  const lanesW = n.links.length ? LANE_PAD * pt + n.links.length * LANE_STEP * pt : 0;
  const sideNotes = (side) => [
    ...marks.filter((m) => m.side === side && (m.note || m.write)),
    ...(side === 'right' ? n.brackets : []),
  ];
  const natural = (side) =>
    sideNotes(side).reduce((mx, m) => Math.max(mx, m.write ? NOTE_MIN_W * notePt : T.widthPt(m.note, notePt, bold)), 0);
  const narrowest = (side) =>
    sideNotes(side).reduce((mx, m) => Math.max(mx, m.write ? NOTE_MIN_W * notePt : T.widthPt(T.longestWord(m.note, notePt, bold), notePt, bold)), 0);
  // The counts column and the brackets sit between the passage and the right
  // margin's notes.
  const allCounts = n.hasCounts ? n.blocks.flatMap((b) => b.counts || []).filter((c) => c != null) : [];
  const countsW = allCounts.length ? COUNT_GAP * pt + Math.max(...allCounts.map((c) => T.widthPt(c, pt, true))) : 0;
  const bracketW = n.brackets.length ? (BRACKET_GAP + BRACKET_TICK) * pt : 0;
  // A poem's lines are its shape, so the margins give way before a line does;
  // prose keeps at least half the width for itself.
  const poem = n.blocks.some((b) => b.kind === 'lines');
  const longest = poem ? Math.max(...n.blocks.flatMap((b) => b.lines).map((l) => T.widthPt(l, pt, bold))) : 0;
  const fixedL = (anyNotes.left ? NOTE_OFFSET * pt : 0) + lanesW;
  const fixedR = countsW + bracketW + (anyNotes.right ? NOTE_OFFSET * pt : 0);
  const forText = poem ? longest : 0.5 * W;
  const avail = W - 2 * PAD * pt - forText - fixedL - fixedR;
  const want = { left: Math.min(NOTE_MAX_SHARE * W, natural('left')), right: Math.min(NOTE_MAX_SHARE * W, natural('right')) };
  const squeeze = want.left + want.right > avail && want.left + want.right > 0 ? Math.max(0, avail) / (want.left + want.right) : 1;
  const room = {
    left: anyNotes.left ? Math.max(narrowest('left'), want.left * squeeze) : 0,
    right: anyNotes.right ? Math.max(narrowest('right'), want.right * squeeze) : 0,
  };
  const noteRoom = (side) => room[side];
  const leftNeed = room.left + fixedL;
  const rightNeed = room.right + fixedR;
  // The passage sits in the middle, with both margins as wide as the wider,
  // whenever that leaves it the room it needs; when it would not, each margin
  // keeps only its own width and the passage sits a little off centre.
  let gutterL = leftNeed;
  let gutterR = rightNeed;
  const even = Math.max(leftNeed, rightNeed);
  if (W - 2 * even - 2 * PAD * pt >= forText - 1e-6) {
    gutterL = even;
    gutterR = even;
  }
  if (n.space === 'annotate') {
    gutterL = Math.max(gutterL, ANNOTATE_SHARE * W);
    gutterR = Math.max(gutterR, ANNOTATE_SHARE * W);
  }
  const textRoom = W - gutterL - gutterR - 2 * PAD * pt;
  if (textRoom < 8 * pt) {
    return fail('ANNOTATED_TEXT_TOO_NARROW', `the margin notes leave ${(textRoom / 72 * 25.4).toFixed(0)}mm for the passage at the ${pt}pt size. Shorten the notes, put them all on one side, or give the drawing more width.`);
  }
  const lines = setLines(n, pt, textRoom, bold);
  if (lines instanceof Error) return lines;
  if (poem && pt > profile.minFontPt + 1e-6 && lines.some((l) => l.indent > 0)) {
    return fail('ANNOTATED_TEXT_LINE_WRAPS', `a line of the poem would wrap at ${pt}pt; a smaller size keeps it whole.`);
  }
  const textW = Math.max(...lines.map((l) => (l.words.length ? l.words[l.words.length - 1].x + l.words[l.words.length - 1].w : 0)));
  // A passage narrower than its room has its margins pulled in to meet it, so
  // nothing is wasted and the notes stay close.
  const usedW = Math.min(W, textW + gutterL + gutterR + 2 * PAD * pt);
  const textX = gutterL + PAD * pt + Math.max(0, (usedW - textW - gutterL - gutterR - 2 * PAD * pt) / 2);

  const titleLines = n.title ? T.wrap(n.title, pt * TITLE_SCALE, usedW - 2 * PAD * pt, true) : [];
  if (titleLines === null) return fail('ANNOTATED_TEXT_TOO_NARROW', `a word in the title "${n.title}" is wider than this space.`);
  const stemLines = n.stem ? T.wrap(n.stem, pt, usedW - 2 * PAD * pt, bold) : [];
  if (stemLines === null) return fail('ANNOTATED_TEXT_TOO_NARROW', `a word in the question "${n.stem}" is wider than this space.`);
  const stemH = stemLines.length ? T.blockHeight(stemLines.length, pt) + TITLE_GAP * pt : 0;
  const titleH = stemH + (titleLines.length ? T.blockHeight(titleLines.length, pt * TITLE_SCALE) + TITLE_GAP * pt : 0);

  // Vertical placement: a gap above the first line too, so an arrow pointing
  // up into the first line has somewhere to run.
  const gapH = pitch - TEXT_BOX * pt;
  let y = PAD * pt + titleH + (routed ? gapH : 0);
  lines.forEach((line, i) => {
    if (i > 0 && line.block !== lines[i - 1].block) y += STANZA_GAP * pitch;
    line.top = y;
    line.baseline = y + T.BASELINE * pt;
    line.gapBelow = { top: y + TEXT_BOX * pt, h: (i < lines.length - 1 && lines[i + 1].block !== line.block ? gapH + STANZA_GAP * pitch : gapH), tracks: 0 };
    y += pitch;
  });
  const topGap = { top: PAD * pt + titleH, h: routed ? gapH : 0, tracks: 0 };

  // The marks, found.
  const words = wordList(lines);
  const placed = [];
  for (const m of marks) {
    const hit = locate(m, words);
    if (!hit) {
      return fail(
        'ANNOTATED_TEXT_MARK_NOT_FOUND',
        `the mark "${m.find}"${m.nth > 1 ? ` (occurrence ${m.nth})` : ''} is not in the passage. A mark names words exactly as printed; check the spelling, or which occurrence it means.`
      );
    }
    // A run of words can wrap; each printed line it touches gets its own piece.
    const pieces = [];
    for (const w of hit) {
      const span = coreSpan(w, pt, bold);
      const last = pieces[pieces.length - 1];
      if (last && last.line === w.line) last.x2 = span.x + span.w;
      else pieces.push({ line: w.line, x1: span.x, x2: span.x + span.w });
    }
    placed.push({ ...m, pieces: pieces.map((p) => ({ ...p, x1: p.x1 + textX, x2: p.x2 + textX })) });
  }
  const markById = new Map(placed.map((m) => [m.id, m]));

  // A route takes the next free track in a gap; tracks spread through the gap
  // so two routes in one gap never share a line.
  const trackY = (gap) => {
    gap.tracks += 1;
    const k = gap.tracks;
    return gap.top + Math.min(gap.h - 0.12 * pt, (k * gap.h) / 3 + 0.08 * pt);
  };
  const gapAbove = (li) => (li === 0 ? topGap : lines[li - 1].gapBelow);

  // Arrows, down the left margin: out of the first word into the gap on the
  // side facing the second, along the gap to its lane, along the lane, back
  // along the gap by the second word and into it.
  const arrows = n.links.map((l, k) => {
    const a = markById.get(l.from);
    const b = markById.get(l.to);
    const pa = a.pieces[0];
    const pb = b.pieces[0];
    const ax = (pa.x1 + pa.x2) / 2;
    const bx = (pb.x1 + pb.x2) / 2;
    const ring = (m) => (markDraws(m.style) === 'ring' ? RING_PAD_Y * pt : 0);
    const topOf = (li, m) => lines[li].top - ring(m);
    const bottomOf = (li, m) => lines[li].top + TEXT_BOX * pt + ring(m);
    let aY;
    let bY;
    let gA;
    let gB;
    if (pb.line > pa.line) {
      // Down the page: out of the bottom of the first, into the top of the second.
      aY = bottomOf(pa.line, a);
      gA = lines[pa.line].gapBelow;
      bY = topOf(pb.line, b);
      gB = gapAbove(pb.line);
    } else if (pb.line < pa.line) {
      aY = topOf(pa.line, a);
      gA = gapAbove(pa.line);
      bY = bottomOf(pb.line, b);
      gB = lines[pb.line].gapBelow;
    } else {
      // Along one line: under it, and up into the second word.
      aY = bottomOf(pa.line, a);
      bY = bottomOf(pb.line, b);
      gA = lines[pa.line].gapBelow;
      gB = gA;
    }
    const yA = trackY(gA);
    const yB = gA === gB ? yA : trackY(gB);
    const laneX = textX - LANE_PAD * pt - k * LANE_STEP * pt;
    const points = gA === gB
      ? [[ax, aY], [ax, yA], [bx, yA], [bx, bY]]
      : [[ax, aY], [ax, yA], [laneX, yA], [laneX, yB], [bx, yB], [bx, bY]];
    return { ...l, points };
  });

  // Margin notes: each wants to sit level with the line its words are on, and
  // notes in one margin are pushed down until none overlaps the one above.
  const textRight = textX + textW;
  const countsX = textRight + COUNT_GAP * pt;
  const bracketX = textRight + countsW + BRACKET_GAP * pt;
  const rightNoteX = textRight + countsW + bracketW + NOTE_OFFSET * pt;
  // A bracket runs down the right of its stanza, from its first line's words
  // to its last's.
  const brackets = n.brackets.map((b) => {
    const mine = lines.filter((l) => l.block === b.block);
    const top = mine[0].top + 0.1 * pt;
    const bottom = mine[mine.length - 1].top + TEXT_BOX * pt - 0.1 * pt;
    return { ...b, x: bracketX, top, bottom, mid: (top + bottom) / 2 };
  });
  const notes = [];
  for (const side of ['left', 'right']) {
    const room = noteRoom(side);
    if (!room) continue;
    const items = placed
      .filter((m) => m.side === side && (m.note || m.write))
      .map((m) => ({ mark: m, wantMid: lines[m.pieces[0].line].top + (TEXT_BOX * pt) / 2, order: [m.pieces[0].line, m.pieces[0].x1] }));
    if (side === 'right') {
      for (const b of brackets) items.push({ bracket: b, wantMid: b.mid, order: [Infinity, 0] });
    }
    items.sort((p, q) => p.wantMid - q.wantMid || p.order[0] - q.order[0] || p.order[1] - q.order[1]);
    let floor = -Infinity;
    for (const it of items) {
      const text = it.bracket ? it.bracket.note : it.mark.note;
      const write = !it.bracket && it.mark.write;
      const ls = write ? [] : noteLines(text, notePt, room, bold);
      if (ls === null) {
        return fail('ANNOTATED_TEXT_NOTE_WORD_TOO_WIDE', `the note "${text}" has a word wider than its margin at the ${notePt}pt size. Use a shorter word, or give the drawing more width.`);
      }
      const h = write ? WRITE_LINE_H * notePt : T.blockHeight(ls.length, notePt);
      const top = Math.max(it.wantMid - h / 2, floor);
      floor = top + h + NOTE_GAP * notePt;
      const x = side === 'right' ? rightNoteX : textX - lanesW - NOTE_OFFSET * pt - room;
      notes.push({ mark: it.mark || null, bracket: it.bracket || null, side, x, top, w: room, h, lines: ls, write });
    }
  }
  // Each note's leader: down out of its words into the gap below their line,
  // along the gap to the edge of the text, then across to the note.
  for (const note of notes) {
    if (note.bracket) {
      // A stanza's note is joined to the middle of its bracket.
      const b = note.bracket;
      note.leader = [[b.x + BRACKET_TICK * pt, b.mid], [note.x - 0.15 * pt, note.top + note.h / 2]];
      continue;
    }
    const p = note.mark.pieces[note.mark.pieces.length - 1];
    const line = lines[p.line];
    const mid = (p.x1 + p.x2) / 2;
    const fromY = line.top + TEXT_BOX * pt + (markDraws(note.mark.style) === 'ring' ? RING_PAD_Y * pt : 0);
    const yT = trackY(line.gapBelow);
    const edge = note.side === 'right' ? textX + textW + 0.3 * pt : textX - lanesW - 0.3 * pt;
    const noteMid = note.top + note.h / 2;
    const noteEdge = note.side === 'right' ? note.x - 0.15 * pt : note.x + note.w + 0.15 * pt;
    note.leader = [[mid, fromY], [mid, yT], [edge, yT], [noteEdge, noteMid]];
  }

  const lastLine = lines[lines.length - 1];
  const textBottom = lastLine.top + pitch;
  const notesBottom = notes.reduce((mx, nt) => Math.max(mx, nt.top + nt.h), 0);
  const h = Math.max(textBottom, notesBottom) + PAD * pt;
  if (profile.heightPt && h > profile.heightPt + 0.5) {
    return fail(
      'ANNOTATED_TEXT_ZONE_TOO_SHALLOW',
      `the passage needs ${(h / 72).toFixed(2)}in of height at the ${profile.minFontPt}pt readable size and the space is ${(profile.heightPt / 72).toFixed(2)}in. Give it more height, use less of the passage, or split it across two slides.`
    );
  }
  return { pt, notePt, pitch, lines, textX, textW, usedW, stemLines, stemH, titleLines, placed, arrows, notes, brackets, countsX, h, routed };
}

// A note with no side goes in the margin nearer its words, so its leader is
// short and never runs under the rest of the line. Decided on a provisional
// setting of the passage at the width it would have with notes both sides.
function sideMarks(n, profile, pt) {
  if (!n.marks.some((m) => m.side === 'auto')) return n.marks;
  const W = profile.widthPt;
  const room = W * (1 - 2 * NOTE_MAX_SHARE);
  const lines = setLines(n, pt, Math.max(room, 8 * pt), profile.bold);
  if (lines instanceof Error) return n.marks.map((m) => (m.side === 'auto' ? { ...m, side: 'right' } : m));
  const words = wordList(lines);
  return n.marks.map((m) => {
    if (m.side !== 'auto') return m;
    const hit = locate(m, words);
    if (!hit) return { ...m, side: 'right' };
    const line = lines[hit[0].line];
    const last = line.words[line.words.length - 1];
    const lineW = last.x + last.w;
    const mid = (hit[0].x + hit[hit.length - 1].x + hit[hit.length - 1].w) / 2;
    return { ...m, side: mid < lineW / 2 ? 'left' : 'right' };
  });
}

// What a style draws: a ring round the words, a line under them, or a change
// to the words themselves.
function markDraws(style) {
  if (style === 'circle' || style === 'box' || style === 'highlight') return 'ring';
  if (style === 'colour') return 'words';
  return 'line';
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const n = normalise(spec);
  // A box with a known height (the board's zone, the wall's picture column) is
  // filled: the words grow past the surface's size, up to its `grow` allowance,
  // while the passage still fits both ways. A short wide passage set at the
  // ordinary size left most of the wall's column empty (2 October 2026). With
  // no height to fill, the words stay at the surface's own size.
  const grow = profile.heightPt ? Math.max(1, profile.grow || 1) : 1;
  const L = T.settle(profile, (pt) => layoutAt(n, profile, pt), { maxPt: profile.fontPt * grow });
  return { ...L, n, profile, W: L.usedW };
}

function poly(points) {
  return points.map(([x, y]) => `${T.f2(x)},${T.f2(y)}`).join(' ');
}

function arrowHead(points, colour, pt) {
  const [x2, y2] = points[points.length - 1];
  const [x1, y1] = points[points.length - 2];
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const bx = x2 - ux * HEAD_LEN * pt;
  const by = y2 - uy * HEAD_LEN * pt;
  const px = -uy * (HEAD_W / 2) * pt;
  const py = ux * (HEAD_W / 2) * pt;
  return `<polygon points="${T.f2(x2)},${T.f2(y2)} ${T.f2(bx + px)},${T.f2(by + py)} ${T.f2(bx - px)},${T.f2(by - py)}" fill="${colour}"/>`;
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { pt, profile } = L;
  const ink = profile.palette === 'ink';
  const c = profile.colours;
  const font = profile.font;
  const bold = profile.bold;
  const sw = Math.max(1, STROKE * pt);
  const colourOf = (name) => (ink ? COLOURS[name].ink : COLOURS[name].colour);
  const under = [];
  const over = [];

  if (L.stemLines.length) {
    over.push(T.textLines(L.stemLines, PAD * pt, PAD * pt, pt, { fill: c.ink, font, bold, anchor: 'start' }));
  }
  if (L.titleLines.length) {
    over.push(T.textLines(L.titleLines, L.usedW / 2, PAD * pt + L.stemH, pt * TITLE_SCALE, { fill: c.ink, font, bold: true }));
  }

  // Words printed in a colour are drawn word by word; every other word is set
  // as part of its line.
  const colouredAt = (li, x1, x2) => {
    for (const m of L.placed) {
      if (m.style !== 'colour') continue;
      for (const p of m.pieces) if (p.line === li && x1 >= p.x1 - 1 && x2 <= p.x2 + 1) return colourOf(m.colour);
    }
    return null;
  };

  for (const m of L.placed) {
    const col = colourOf(m.colour);
    for (const p of m.pieces) {
      const line = L.lines[p.line];
      const x1 = p.x1;
      const x2 = p.x2;
      if (m.style === 'highlight') {
        const fill = ink ? INK_TONES.pale : HIGHLIGHT_FILL[m.colour];
        under.push(`<rect x="${T.f2(x1 - RING_PAD_X * pt * 0.5)}" y="${T.f2(line.top + 0.05 * pt)}" width="${T.f2(x2 - x1 + RING_PAD_X * pt)}" height="${T.f2((TEXT_BOX - 0.1) * pt)}" rx="${T.f2(0.15 * pt)}" fill="${fill}"/>`);
      } else if (m.style === 'underline') {
        const y = line.baseline + UNDERLINE_DROP * pt;
        over.push(`<line x1="${T.f2(x1)}" y1="${T.f2(y)}" x2="${T.f2(x2)}" y2="${T.f2(y)}" stroke="${col}" stroke-width="${T.f2(sw * 1.3)}" stroke-linecap="round"/>`);
      } else if (m.style === 'wavy') {
        const y = line.baseline + UNDERLINE_DROP * pt * 1.6;
        const step = 0.32 * pt;
        let d = `M${T.f2(x1)},${T.f2(y)}`;
        let up = true;
        for (let x = x1; x < x2 - 1e-6; x += step) {
          const nx = Math.min(x2, x + step);
          d += ` Q${T.f2((x + nx) / 2)},${T.f2(y + (up ? -1 : 1) * 0.16 * pt)} ${T.f2(nx)},${T.f2(y)}`;
          up = !up;
        }
        over.push(`<path d="${d}" fill="none" stroke="${col}" stroke-width="${T.f2(sw * 1.1)}" stroke-linecap="round"/>`);
      } else if (m.style === 'circle') {
        const cx = (x1 + x2) / 2;
        const cy = line.top + (TEXT_BOX * pt) / 2;
        const rx = (x2 - x1) / 2 + RING_PAD_X * pt + 0.06 * pt;
        const ry = (TEXT_BOX * pt) / 2 + RING_PAD_Y * pt;
        over.push(`<ellipse cx="${T.f2(cx)}" cy="${T.f2(cy)}" rx="${T.f2(rx)}" ry="${T.f2(ry)}" fill="none" stroke="${col}" stroke-width="${T.f2(sw * 1.3)}"/>`);
      } else if (m.style === 'box') {
        over.push(`<rect x="${T.f2(x1 - RING_PAD_X * pt)}" y="${T.f2(line.top - RING_PAD_Y * pt * 0.5)}" width="${T.f2(x2 - x1 + 2 * RING_PAD_X * pt)}" height="${T.f2(TEXT_BOX * pt + RING_PAD_Y * pt)}" rx="${T.f2(0.1 * pt)}" fill="none" stroke="${col}" stroke-width="${T.f2(sw * 1.3)}"/>`);
      }
    }
  }

  // The passage, a word at a time at the place it was measured to, so every
  // mark sits on its word whatever the renderer's own spacing would have done.
  const words = [];
  L.lines.forEach((line, li) => {
    for (const w of line.words) {
      const x = w.x + L.textX;
      const col = colouredAt(li, x, x + w.w);
      const weight = col || bold ? ' font-weight="bold"' : '';
      words.push(`<text x="${T.f2(x)}" y="${T.f2(line.baseline)}" font-family="${font}" font-size="${T.f2(pt)}"${weight} fill="${col || c.ink}">${T.esc(w.text)}</text>`);
    }
  });

  // Arrows and note leaders.
  for (const a of L.arrows) {
    const col = colourOf(a.colour);
    over.push(`<g class="annotated-text-arrow"><polyline points="${poly(a.points)}" fill="none" stroke="${col}" stroke-width="${T.f2(sw * 1.2)}" stroke-linejoin="round" stroke-linecap="round"/>${arrowHead(a.points, col, pt)}</g>`);
  }
  // Counts beside their lines, and the brackets down each stanza.
  if (L.countsX != null) {
    const countCol = colourOf(L.n.countColour);
    for (const line of L.lines) {
      if (line.count == null) continue;
      over.push(`<text x="${T.f2(L.countsX)}" y="${T.f2(line.baseline)}" font-family="${font}" font-size="${T.f2(pt)}" font-weight="bold" fill="${countCol}">${T.esc(line.count)}</text>`);
    }
  }
  for (const b of L.brackets) {
    const col = colourOf(b.colour);
    const t = BRACKET_TICK * pt;
    over.push(`<path d="M${T.f2(b.x - t)},${T.f2(b.top)} L${T.f2(b.x)},${T.f2(b.top)} L${T.f2(b.x)},${T.f2(b.bottom)} L${T.f2(b.x - t)},${T.f2(b.bottom)} M${T.f2(b.x)},${T.f2(b.mid)} L${T.f2(b.x + t)},${T.f2(b.mid)}" fill="none" stroke="${col}" stroke-width="${T.f2(sw * 1.3)}" stroke-linejoin="round" stroke-linecap="round"/>`);
  }
  for (const nt of L.notes) {
    const col = colourOf(nt.bracket ? nt.bracket.colour : nt.mark.colour);
    if (nt.bracket) {
      const [[x1, y1], [x2, y2]] = nt.leader;
      if (Math.abs(y1 - y2) > 0.3 * pt) over.push(`<polyline points="${poly(nt.leader)}" fill="none" stroke="${col}" stroke-width="${T.f2(sw * 0.8)}" stroke-dasharray="${T.f2(0.25 * pt)} ${T.f2(0.15 * pt)}"/>`);
      over.push(T.textLines(nt.lines, nt.x, nt.top, L.notePt, { fill: col, font, bold, anchor: 'start' }));
      continue;
    }
    over.push(`<polyline points="${poly(nt.leader)}" fill="none" stroke="${col}" stroke-width="${T.f2(sw * 0.8)}" stroke-linejoin="round" stroke-dasharray="${T.f2(0.25 * pt)} ${T.f2(0.15 * pt)}"/>`);
    if (nt.write) {
      const y = nt.top + nt.h * 0.85;
      over.push(`<line x1="${T.f2(nt.x)}" y1="${T.f2(y)}" x2="${T.f2(nt.x + nt.w)}" y2="${T.f2(y)}" stroke="${c.ink}" stroke-width="${T.f2(Math.max(0.75, sw * 0.6))}"/>`);
    } else {
      const anchor = nt.side === 'right' ? 'start' : 'end';
      const x = nt.side === 'right' ? nt.x : nt.x + nt.w;
      over.push(T.textLines(nt.lines, x, nt.top, L.notePt, { fill: col, font, bold, anchor }));
    }
  }

  const h = L.h;
  return { svg: T.svgDoc(L.usedW, h, [...under, ...words, ...over]), w: L.usedW, h, aspect: L.usedW / h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  return `annotated-text:${T.profileKey(p)}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, STYLES, COLOURS: Object.keys(COLOURS), MAX_MARKS, MAX_LINKS };
