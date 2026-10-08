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
// A ring (`circle` or `box`) is measured from the ink, not from the line box:
// from the tops of the tall letters to the bottoms of the tails, with air all
// round, and its two ends sit in the finger spaces either side of its words.
// So a comma or full stop that touches the last word is inside the ring with
// it. Until 8 October 2026 a `circle` was an oval drawn through the corners of
// the words' box, which is the first and last letters, and a box stopped at
// the last letter, which is where the full stop is (three lessons of twenty in
// the stress test of 7 October). The teacher chose the rounded loop over a
// true oval grown big enough to miss the letters, which on a sentence runs out
// into the margins and over the lines above and below. He ruled the same day
// that an underline crossing the tail of a g, and a highlight that stops at
// the last letter, are right as they are: leave both alone.
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
//                       exact match exists. A punctuation mark alone (",")
//                       marks that comma itself: underline, wavy, highlight
//                       or colour, never a ring, which has no room there.
//              nth      which occurrence, counting from 1 through the whole
//                       text (default 1).
//              style    underline | wavy | circle | box | highlight | colour
//                       (default underline). `colour` prints the words
//                       themselves in the colour.
//              colour   blue | green | orange | red | purple (default blue).
//                       Two marks whose notes say different things never
//                       share a colour: the second takes the next free one,
//                       so a note is matched to its words by colour and not
//                       only by following its line. Marks with the same note
//                       keep one colour, and so do two marks an arrow joins.
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
//   callouts the working wall's step numbers and pointers (its own field, drawn
//            by the wall). A callout whose `part` names a mark's id, or any
//            words of the passage as printed ("moon", ","), is given a place:
//            a step number gets room left for it just above its word.
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
// Air between two notes stacked in one margin. At 0.35 three two-line notes
// read as one paragraph of six lines (7 October 2026).
const NOTE_GAP = 0.8;
const NOTE_MAX_SHARE = 0.3; // one margin is at most this share of the width
const NOTE_MIN_W = 5.5; // a margin narrower than this many ems cannot hold a note
const NOTE_OFFSET = 0.9; // gap between the text and a margin note
const ANNOTATE_SHARE = 0.22; // each margin in the write-on form
const LANE_STEP = 0.55; // between two arrows running down the left margin
const LANE_PAD = 0.5; // between the text and the nearest arrow lane
const UNDERLINE_DROP = 0.12; // below the baseline
const STROKE = 0.085; // marks and arrows
// Where Comic Sans puts its ink, from the baseline: the tall letters rise this
// far and the tails of g, y, p and Q drop this far. A ring clears both.
const INK_TOP = 0.8;
const INK_BOTTOM = 0.33;
const RING_PAD_X = 0.2; // a ring's ends, out from its words into the finger space
const RING_PAD_Y = 0.13; // above the tall letters and below the tails
const RING_CLEAR = 0.06; // the least air between a ring's end and the next word
const LOOP_RADIUS = 0.5; // the loop's rounded corners; a box's are BOX_RADIUS
const BOX_RADIUS = 0.1;
const HIGHLIGHT_REACH = 0.16; // how far past a highlighted line an arrow starts
// A step number the wall pins above a word: the circle, and the air under it.
const PIN_R = 0.6;
const PIN_GAP = 0.15;
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
// The order a note takes a colour of its own in. Red is last: on a board it
// reads as "wrong".
const NOTE_COLOURS = ['blue', 'green', 'orange', 'purple', 'red'];
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
    if (!core(find) && (style === 'circle' || style === 'box')) {
      throw fail('ANNOTATED_TEXT_INVALID', `mark "${find}" asks for a ${style} round a punctuation mark on its own. It touches the word beside it, so a ring there would cut the letter; use highlight, colour or underline for it, or ring the word and its punctuation together by naming the word.`);
    }
    return { id: str(m.id || find).trim(), find, nth, style, colour, note, write, side };
  });
  ownNoteColours(marks, spec.links);
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
  // The places the wall's callouts name. A step number is given room above its
  // word; any other pointer is only told where the word is.
  const pins = [];
  for (const c of Array.isArray(spec.callouts) ? spec.callouts : []) {
    const part = c && typeof c.part === 'string' ? c.part.trim() : '';
    if (!part || pins.some((p) => p.part === part)) continue;
    pins.push({ part, step: Number.isInteger(c.step) && c.step > 0 });
  }
  return { blocks, marks, links, brackets, pins, hasCounts, countColour, space, title: str(spec.title).trim(), stem: str(spec.text).trim() };
}

// Two marks whose notes say different things, both in one colour, leave a
// reader to follow each dashed line to learn which note is whose, and a line
// that runs under the next marked phrase looks tied to that one (a Year 6
// online-safety wall, 7 October 2026: three warning signs, all orange). So
// the second note to arrive at a colour another note already has takes the
// next colour nothing else is using, and its mark, note and line all match.
// Marks with the same note keep one colour ("fronted adverbial" twice is one
// kind of thing), and so do the two ends of an arrow, whose shared colour is
// the link. Only the colour changes, never the kind of mark.
function ownNoteColours(marks, rawLinks) {
  const linked = new Set();
  for (const l of Array.isArray(rawLinks) ? rawLinks : []) {
    linked.add(str(l && l.from).trim());
    linked.add(str(l && l.to).trim());
  }
  const taken = new Set(marks.filter((m) => !m.note || linked.has(m.id)).map((m) => m.colour));
  const owner = new Map(); // colour -> the note it belongs to
  const colourOfNote = new Map();
  for (const m of marks) {
    if (!m.note) continue;
    const key = m.note.toLowerCase();
    const holder = owner.get(m.colour);
    if (linked.has(m.id) || holder === undefined || holder === key) {
      owner.set(m.colour, holder === undefined ? key : holder);
      if (!colourOfNote.has(key)) colourOfNote.set(key, m.colour);
      continue;
    }
    const next = colourOfNote.get(key)
      || NOTE_COLOURS.find((c) => !owner.has(c) && !taken.has(c))
      || NOTE_COLOURS.find((c) => !owner.has(c));
    if (!next) continue; // more kinds of note than colours: the lines still join them
    m.colour = next;
    owner.set(next, key);
    colourOfNote.set(key, next);
  }
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
  lines.forEach((line, li) => line.words.forEach((w, pos) => all.push({ ...w, line: li, pos, key: core(w.text) })));
  return all;
}

// Which printed words a mark covers: the nth run of words matching `find`.
function locate(mark, words) {
  const want = mark.find.split(/\s+/).map(core).filter(Boolean);
  if (!want.length) {
    // A punctuation mark on its own: the nth word that carries it at an end.
    const p = mark.find.trim();
    const hits = [];
    for (const w of words) {
      const lead = w.text.match(/^[^\p{L}\p{N}]*/u)[0];
      const trail = w.key ? w.text.match(/[^\p{L}\p{N}]*$/u)[0] : '';
      const at = trail.includes(p) ? w.text.length - trail.length + trail.indexOf(p) : lead.includes(p) ? lead.indexOf(p) : -1;
      if (p && at >= 0) hits.push([{ ...w, punct: { at, text: p } }]);
    }
    return hits[mark.nth - 1] || null;
  }
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
  if (w.punct) return { x: w.x + T.widthPt(w.text.slice(0, w.punct.at), pt, bold), w: T.widthPt(w.punct.text, pt, bold) };
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
    placed.push({ ...m, pieces: piecesOf(hit, pt, bold, textX) });
  }
  const markById = new Map(placed.map((m) => [m.id, m]));

  // The places the wall's callouts name: a mark by its id, or any words of
  // the passage. A name the passage does not hold is left for the wall to
  // refuse in its own words.
  const pins = [];
  for (const pin of n.pins) {
    const mark = markById.get(pin.part);
    const hit = mark ? null : locate({ find: pin.part, nth: 1 }, words);
    const piece = mark ? mark.pieces[0] : hit ? piecesOf(hit, pt, bold, textX)[0] : null;
    if (piece) pins.push({ ...pin, line: piece.line, x: (piece.x1 + piece.x2) / 2 });
  }
  const pinRoom = (li) => (pins.some((p) => p.step && p.line === li) ? (2 * PIN_R + PIN_GAP) * pt : 0);

  // Vertical placement: a gap above the first line too, so an arrow pointing
  // up into the first line has somewhere to run, and room above any line a
  // step number is pinned to.
  const gapH = pitch - TEXT_BOX * pt;
  let y = PAD * pt + titleH + (routed ? gapH : 0);
  lines.forEach((line, i) => {
    if (i > 0 && line.block !== lines[i - 1].block) y += STANZA_GAP * pitch;
    y += pinRoom(i);
    line.top = y;
    line.baseline = y + T.BASELINE * pt;
    line.gapBelow = { top: y + TEXT_BOX * pt, h: (i < lines.length - 1 && lines[i + 1].block !== line.block ? gapH + STANZA_GAP * pitch : gapH), tracks: 0 };
    y += pitch;
  });
  const topGap = { top: PAD * pt + titleH, h: routed ? gapH : 0, tracks: 0 };

  for (const pin of pins) {
    pin.y = pin.step ? lines[pin.line].top - (PIN_GAP + PIN_R) * pt : lines[pin.line].top;
  }

  // The rings. Each end goes out into the finger space beside its words: as
  // far as RING_PAD_X where there is room, half the space where the next word
  // is ringed too, and never as far as the next word or the drawing's edge.
  const sw = Math.max(1, STROKE * pt) * 1.3;
  const ringed = new Set();
  for (const m of placed) {
    if (!isRing(m.style)) continue;
    for (const p of m.pieces) for (let k = p.pos1; k <= p.pos2; k += 1) ringed.add(`${p.line}:${k}`);
  }
  for (const m of placed) {
    if (!isRing(m.style)) continue;
    for (const p of m.pieces) {
      const line = lines[p.line];
      const before = line.words[p.pos1 - 1];
      const after = line.words[p.pos2 + 1];
      const reach = (space, shared) => Math.max(0, Math.min(RING_PAD_X * pt, (shared ? space / 2 : space - RING_CLEAR * pt) - sw / 2));
      const padL = before
        ? reach(p.fx1 - (before.x + before.w + textX), ringed.has(`${p.line}:${p.pos1 - 1}`))
        : Math.max(0, Math.min(RING_PAD_X * pt, p.fx1 - sw / 2));
      const padR = after
        ? reach(after.x + textX - p.fx2, ringed.has(`${p.line}:${p.pos2 + 1}`))
        : Math.max(0, Math.min(RING_PAD_X * pt, usedW - p.fx2 - sw / 2));
      p.ring = {
        x1: p.fx1 - padL,
        x2: p.fx2 + padR,
        top: line.baseline - (INK_TOP + RING_PAD_Y) * pt,
        bottom: line.baseline + (INK_BOTTOM + RING_PAD_Y) * pt,
      };
    }
  }
  // Where a mark's top and bottom are, for an arrow or a note's line to leave from.
  const markTop = (m, piece) => (piece.ring ? piece.ring.top - sw / 2 : lines[piece.line].top - (m.style === 'highlight' ? HIGHLIGHT_REACH * pt : 0));
  const markBottom = (m, piece) => (piece.ring ? piece.ring.bottom + sw / 2 : lines[piece.line].top + TEXT_BOX * pt + (m.style === 'highlight' ? HIGHLIGHT_REACH * pt : 0));

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
    let aY;
    let bY;
    let gA;
    let gB;
    if (pb.line > pa.line) {
      // Down the page: out of the bottom of the first, into the top of the second.
      aY = markBottom(a, pa);
      gA = lines[pa.line].gapBelow;
      bY = markTop(b, pb);
      gB = gapAbove(pb.line);
    } else if (pb.line < pa.line) {
      aY = markTop(a, pa);
      gA = gapAbove(pa.line);
      bY = markBottom(b, pb);
      gB = lines[pb.line].gapBelow;
    } else {
      // Along one line: under it, and up into the second word.
      aY = markBottom(a, pa);
      bY = markBottom(b, pb);
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
    const fromY = markBottom(note.mark, p);
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
  return { pt, notePt, pitch, lines, textX, textW, usedW, stemLines, stemH, titleLines, placed, arrows, notes, brackets, pins, countsX, h, routed };
}

// The printed pieces of a run of words: a run can wrap, and each printed line
// it touches gets its own piece. `x1`..`x2` is the words without the
// punctuation at either end (where an underline or a highlight stops);
// `fx1`..`fx2` is the words with it (what a ring goes round); `pos1`..`pos2`
// is where they sit in their line.
function piecesOf(hit, pt, bold, textX) {
  const pieces = [];
  for (const w of hit) {
    const span = coreSpan(w, pt, bold);
    const full = w.punct ? span : { x: w.x, w: w.w };
    const last = pieces[pieces.length - 1];
    if (last && last.line === w.line) {
      last.x2 = span.x + span.w + textX;
      last.fx2 = full.x + full.w + textX;
      last.pos2 = w.pos;
    } else {
      pieces.push({ line: w.line, x1: span.x + textX, x2: span.x + span.w + textX, fx1: full.x + textX, fx2: full.x + full.w + textX, pos1: w.pos, pos2: w.pos });
    }
  }
  return pieces;
}

// A ring is drawn round its words, clear of them; a highlight is laid over them.
function isRing(style) {
  return style === 'circle' || style === 'box';
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
      } else if (p.ring) {
        // A loop (`circle`) or a box: one shape, measured in the layout, that
        // differs only in how round its corners are.
        const r = p.ring;
        const corner = Math.min((m.style === 'circle' ? LOOP_RADIUS : BOX_RADIUS) * pt, (r.x2 - r.x1) / 2, (r.bottom - r.top) / 2);
        over.push(`<rect class="annotated-text-ring" x="${T.f2(r.x1)}" y="${T.f2(r.top)}" width="${T.f2(r.x2 - r.x1)}" height="${T.f2(r.bottom - r.top)}" rx="${T.f2(corner)}" fill="none" stroke="${col}" stroke-width="${T.f2(sw * 1.3)}"/>`);
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
  const out = { svg: T.svgDoc(L.usedW, h, [...under, ...words, ...over]), w: L.usedW, h, aspect: L.usedW / h, layout: L };
  // Where each place a wall callout names is, as [x%, y%, r%] of the drawing:
  // a step number's circle in the room left above its word.
  if (L.pins.length) {
    out.anchors = {};
    for (const p of L.pins) out.anchors[p.part] = p.step ? [(p.x / L.usedW) * 100, (p.y / h) * 100, ((PIN_R * pt) / h) * 100] : [(p.x / L.usedW) * 100, (p.y / h) * 100];
  }
  return out;
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  return `annotated-text:${T.profileKey(p)}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, STYLES, COLOURS: Object.keys(COLOURS), MAX_MARKS, MAX_LINKS };
