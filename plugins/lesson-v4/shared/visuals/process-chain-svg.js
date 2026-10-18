'use strict';

// THE process chain: boxes joined by arrows. A food chain, a life cycle, the
// order of events. One drawing, placed by the board, the worksheet, the working
// wall and the stick-in pack.
//
// The arrows are the picture. They carry the "this leads to that" the task is
// testing, which a list of the same words in the same order does not say.
//
// It was the worksheet's alone (worksheet-html/src/helpers/science.js), drawn in
// a fixed 150-unit box scaled to its zone with one unwrapped line of 18-unit
// type, so a stage named "caterpillar makes a chrysalis" ran out of its box and
// no other surface could draw the chain at all (13 September 2026: every picture
// became one shared drawing reachable from every surface).
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//
// Spec:
//   boxes   the stages in order. A box that is null, missing or "" is left
//           empty for the child to write in, which is the whole "complete the
//           sequence" task: give them the ones they need and leave the rest.
//   text    the question above the chain (the worksheet prints it as its own
//           line of sheet text; the other surfaces draw it above the boxes)
//
// A link may also be an object, for a chain of things a child can picture (the
// living things of a food chain, the stages of a life cycle). Boxes of words
// alone read as labels, and a class that cannot yet read "producer" has nothing
// to look at (the Year 4 food chains lesson, 11 October 2026):
//   { text, imagePath, label }
//     text       the name, printed under the picture (or in the box, with none)
//     imagePath  the picture. The surface reads the file before the drawing is
//                asked for (`preparePictures`), as it does for a labelled
//                diagram; a link whose picture was not read is drawn as its
//                words, so a chain is never lost for want of a photograph.
//     label      a short role word under the link ("producer"), in the taught
//                word colour where the surface prints colour.
//   labelLine   true leaves a line under every link without a label, for the
//               child to write the role on. Use it when naming the roles is
//               part of the task and leave it off when it is not.
//   arrowHeads  false draws each join as a plain line, for the child to turn
//               into an arrow. The direction is then the child's decision,
//               which is the point where the arrow's meaning is being taught.
//   bank        named pictures in a row above the chain, in the order given,
//               joined by nothing: the things to be put into the empty boxes.
//               Give it mixed up; the drawing keeps the order it is handed.
//
// The answers. A chain with empty boxes has a check slide that fills them in,
// and the words that fill them are the answer, so they are drawn in answer
// green, as the cycle's are: mark each one where it is written,
//   { text: "eardrum", answer: true }
// and keep the stages the question gave (the bell the chain starts from) as
// they were, so the class sees which were the answers. A Year 4 science check
// slide had no way to say it: its answers sat black in the boxes and a green
// line under the chain wrote the whole order out again (17 October 2026).
// Green on the board and the wall. A pupil sheet and the stick-in pack are the
// child's to fill in, so there an answer box prints empty (a pictured link
// keeps its picture and loses its name); the teacher's answer sheet asks for
// them (`answers: "show"` on the profile) and prints them green.
//
// A chain too long for one row turns onto a second, as a line of a book does:
// the first half of the links on top, the rest underneath starting under the
// first, both read left to right, and one arrow leaving the last link of the
// top row, running back under it and coming into the first link of the second.
// Before this the drawing refused the chain, and slide designers split a Year 4
// bell-to-brain chain of seven links into two separate chains in two cards,
// which the class read as two journeys: nothing joined the fourth link to the
// fifth (stress test, 17 and 18 October 2026). A chain that fits one row at any
// readable size is drawn on one row, exactly as before.

const T = require('./figure-text');
const { PALETTES } = require('./surface-profiles');

// ─── CONSTANTS (in ems of the settled font size) ─────────────────────────────
const BOX_PAD_X = 0.5; // words to the box edge, each side
const BOX_PAD_Y = 0.45;
// An empty box is somewhere a child writes a word, so it is never shallower
// than a written word needs, whatever its filled neighbours hold.
const BOX_MIN_H = 3.2;
const BOX_MIN_W = 4.5;
// The widest a box of words grows. On paper and on the wall a chain of three
// short words does not need to span the page to be read.
const BOX_MAX_W = 11;
const BOX_RADIUS = 0.6;
const BOX_STROKE = 0.14;
const ARROW_W = 2.6; // the arrow between two boxes, tail to tip
// A join the child turns into an arrow is longer: there has to be room to draw
// a head at either end and still see the line.
const JOIN_W = 4;
// Pictures held small by a shallow space leave width over, and the arrows take
// some of it: a chain reads as a chain when its links are joined across the
// space, not huddled in the middle of it.
const ARROW_MAX_W = 6;
const ARROW_GAP = 0.35; // air between a box edge and the arrow
const ARROW_STROKE = 0.3;
const ARROW_HEAD_W = 0.9;
const ARROW_HEAD_H = 0.95;
const STEM_GAP = 0.6;
const PAD = 0.15;
const MAX_BOXES = 8;
// A picture is what the class looks at, so it takes the width its link has and
// the height that width gives it, down to a floor under which it is a smudge.
const PIC_MAX_W = 22;
const PIC_MIN_H = 3.6;
const PIC_NAME_GAP = 0.25;
const NAME_MAX_LINES = 2;
const LABEL_SCALE = 0.85;
const LABEL_GAP = 0.15;
const LABEL_MAX_LINES = 3;
// A line a child writes a role word on: 8mm of paper at the sheet's own size.
const LABEL_LINE_H = 2.3;
const LABEL_LINE_SHARE = 0.84;
// The bank is what the child looks at to decide, so its pictures are the big
// thing on the page; the boxes under them are the width of a written name.
const BANK_MAX_W = 16;
const BANK_GAP_X = 1.2;
const BANK_GAP_Y = 1.1;
const BANK_SHAPE = 0.75; // a bank picture's frame, height over width
// A chain on two rows: the band between the rows that the turning arrow runs
// back along, and the room it takes beside the rows to turn down and come in.
const ROW_GAP = 1.5;
const TURN_W = 2;
// ────────────────────────────────────────────────────────────────────────────

function filled(v) {
  return v !== null && v !== undefined && String(v).trim() !== '';
}

function picture(raw) {
  const href = raw.imageHref != null ? raw.imageHref : raw.href;
  const w = Number(raw.imageWidth != null ? raw.imageWidth : raw.width);
  const h = Number(raw.imageHeight != null ? raw.imageHeight : raw.height);
  if (filled(href) && w > 0 && h > 0) return { href: String(href), w, h };
  // A picture the run has not delivered yet keeps its place, square, as an
  // ordinary board picture does, so the chain is the same size before and
  // after the photograph lands.
  return raw.imagePending === true ? { href: null, w: 1, h: 1 } : null;
}

function link(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const text = filled(raw.text) ? String(raw.text).trim() : null;
    const label = filled(raw.label) ? String(raw.label).trim() : null;
    const pic = picture(raw);
    if (!text && !pic && !label) return null;
    return { text, label, pic, imagePath: filled(raw.imagePath) ? String(raw.imagePath) : null };
  }
  return filled(raw) ? { text: String(raw), label: null, pic: null, imagePath: null } : null;
}

// A box as a link, keeping whether its words are the answer.
function box(raw) {
  const out = link(raw);
  if (out && raw && typeof raw === 'object' && !Array.isArray(raw) && raw.answer === true && out.text) out.answer = true;
  return out;
}

// Whether the answers are drawn on this surface: on the board and the wall,
// and on paper only where the surface asks (the teacher's answer sheet).
function answersShown(profile) {
  if (profile && profile.answers === 'show') return true;
  if (profile && profile.answers === 'hide') return false;
  return !(profile && (profile.palette === 'sheet' || profile.palette === 'ink'));
}

// The question the chain asks: every answer taken off. An answer box becomes
// an empty box; a pictured one keeps its picture and loses its name.
function withoutAnswers(spec) {
  if (!Array.isArray(spec.boxes)) return spec;
  return {
    ...spec,
    boxes: spec.boxes.map((raw) => {
      if (!(raw && typeof raw === 'object' && !Array.isArray(raw) && raw.answer === true)) return raw;
      const kept = { ...raw, text: null };
      delete kept.answer;
      return link(kept) ? kept : null;
    }),
  };
}

function normalise(spec = {}) {
  const boxes = Array.isArray(spec.boxes) ? spec.boxes.map(box) : [];
  if (boxes.length < 1) {
    throw new Error('PROCESS_CHAIN_INVALID: a process chain needs `boxes`, one entry per stage (null for a box the child fills).');
  }
  if (boxes.length > MAX_BOXES) {
    throw new Error(
      `PROCESS_CHAIN_TOO_MANY_BOXES: ${boxes.length} stages were asked for and ${MAX_BOXES} is the most one chain carries at a readable size. ` +
        'Split the sequence into two chains, or drop the stages this question does not ask about.'
    );
  }
  const bank = (Array.isArray(spec.bank) ? spec.bank.map(link) : []).filter(Boolean);
  if (bank.length > MAX_BOXES) {
    throw new Error(`PROCESS_CHAIN_TOO_MANY_BOXES: the bank holds ${bank.length} pictures and ${MAX_BOXES} is the most one row carries at a readable size.`);
  }
  return {
    boxes,
    bank,
    labelLine: spec.labelLine === true,
    arrowHeads: spec.arrowHeads !== false,
    text: spec.text == null ? '' : String(spec.text).trim(),
  };
}

function wrapped(text, pt, width, bold, most, what, profile) {
  const lines = T.wrap(text, pt, width, bold);
  if (!lines) {
    return new Error(
      `PROCESS_CHAIN_WORD_TOO_WIDE: the word "${T.longestWord(text, pt, bold)}" in "${text}" is wider than its ${what} at the ${profile.minFontPt}pt readable size. ` +
        'Use a shorter word, or give the chain more width; a word is never split.'
    );
  }
  if (lines.length > most) {
    return new Error(
      `PROCESS_CHAIN_STAGE_TOO_LONG: "${text}" takes ${lines.length} lines in its ${what} at the ${profile.minFontPt}pt readable size, and a stage holds ${most}. ` +
        'A stage is a few words; put the explanation in the question.'
    );
  }
  return lines;
}

// The bank: named pictures in one row, nothing joining them.
function bankAt(n, profile, pt, W, widest = Infinity) {
  if (!n.bank.length) return { h: 0, cells: [] };
  const m = n.bank.length;
  const gap = BANK_GAP_X * pt;
  const cellW = Math.min(BANK_MAX_W * pt, widest, (W - 2 * PAD * pt - (m - 1) * gap) / m);
  if (cellW < BOX_MIN_W * pt) {
    return new Error(`PROCESS_CHAIN_TOO_NARROW: ${m} bank pictures do not fit across this space at the ${profile.minFontPt}pt readable size. Give the chain more width, or a shorter bank.`);
  }
  const anyPic = n.bank.some((b) => b.pic);
  const picH = anyPic ? cellW * BANK_SHAPE : 0;
  const cells = [];
  let nameLines = 0;
  for (const b of n.bank) {
    const lines = b.text ? wrapped(b.text, pt, cellW, true, NAME_MAX_LINES, 'bank picture', profile) : [];
    if (lines instanceof Error) return lines;
    nameLines = Math.max(nameLines, lines.length);
    cells.push({ ...b, lines });
  }
  const nameH = nameLines ? T.blockHeight(nameLines, pt) + (anyPic ? PIC_NAME_GAP * pt : 0) : 0;
  return { h: picH + nameH + BANK_GAP_Y * pt, cells, cellW, picH, gap, rowW: m * cellW + (m - 1) * gap };
}

function layoutAt(n, profile, pt, rows = 1) {
  const bold = profile.bold;
  const W = profile.widthPt;
  const count = n.boxes.length;
  // The links on each row; on two rows the top one holds the extra link.
  const perRow = Math.ceil(count / rows);
  const turn = rows > 1 ? TURN_W * pt : 0;
  const arrowRun = (n.arrowHeads ? ARROW_W : JOIN_W) + 2 * ARROW_GAP;
  const anyPic = n.boxes.some((b) => b && b.pic);
  const across = (W - 2 * PAD * pt - 2 * turn - (perRow - 1) * arrowRun * pt) / perRow;
  let boxW = Math.min((anyPic ? PIC_MAX_W : BOX_MAX_W) * pt, across);
  if (boxW < BOX_MIN_W * pt) {
    const mm = (((BOX_MIN_W + arrowRun) * perRow - arrowRun + 2 * PAD + (rows > 1 ? 2 * TURN_W : 0)) * profile.minFontPt / 72) * 25.4;
    return new Error(
      `PROCESS_CHAIN_TOO_NARROW: ${count} boxes and their arrows need ${mm.toFixed(0)}mm across${rows > 1 ? ' even on two rows' : ''} ` +
        `at the ${profile.minFontPt}pt readable size and this space is ${(W / 72 * 25.4).toFixed(0)}mm. ` +
        (rows > 1 ? 'Give the chain more width, or drop the stages this question does not ask about.' : 'Give the chain more width.')
    );
  }
  const stemLines = n.text ? T.wrap(n.text, pt, W - 2 * PAD * pt, bold) : [];
  if (stemLines === null) return new Error(`PROCESS_CHAIN_TOO_NARROW: a word in the question "${n.text}" is wider than this space.`);
  const stemH = stemLines.length ? T.blockHeight(stemLines.length, pt) + STEM_GAP * pt : 0;
  let bank = bankAt(n, profile, pt, W);
  if (bank instanceof Error) return bank;

  const labelPt = pt * LABEL_SCALE;
  // Everything but the pictures is set by the words, so it is measured for a
  // given link width; the pictures then take the height that is left.
  const wordsAt = (w) => {
    const inner = w - 2 * BOX_PAD_X * pt;
    const lines = [];
    const labels = [];
    for (const b of n.boxes) {
      // A pictured link's name sits under its picture, so it has the link's
      // whole width; a link of words alone is a box, with the box's padding.
      const name = !b || !b.text ? [] : b.pic ? wrapped(b.text, pt, w, true, NAME_MAX_LINES, 'picture', profile) : wrapped(b.text, pt, inner, true, 3, 'box', profile);
      if (name instanceof Error) return name;
      const label = b && b.label ? wrapped(b.label, labelPt, w, true, LABEL_MAX_LINES, 'label', profile) : [];
      if (label instanceof Error) return label;
      lines.push(name);
      labels.push(label);
    }
    const boxLines = Math.max(0, ...n.boxes.map((b, i) => (b && b.pic ? 0 : lines[i].length)));
    const boxH = Math.max(BOX_MIN_H * pt, T.blockHeight(boxLines, pt) + 2 * BOX_PAD_Y * pt);
    const nameLines = Math.max(0, ...n.boxes.map((b, i) => (b && b.pic ? lines[i].length : 0)));
    const nameH = nameLines ? PIC_NAME_GAP * pt + T.blockHeight(nameLines, pt) : 0;
    const labelLines = Math.max(0, ...labels.map((l) => l.length));
    const writeLine = n.labelLine && n.boxes.some((b) => !b || !b.label);
    const labelH = Math.max(labelLines ? LABEL_GAP * pt + T.blockHeight(labelLines, labelPt) : 0, writeLine ? LABEL_LINE_H * pt : 0);
    return { lines, labels, boxH, nameH, labelH, writeLine };
  };

  let words = wordsAt(boxW);
  if (words instanceof Error) return words;
  let picH = 0;
  if (anyPic) {
    // The tallest picture, at the link's width, sets the frame every picture
    // shares; none is cropped, so a wide one sits centred in a taller frame.
    const shape = Math.min(1, Math.max(...n.boxes.filter((b) => b && b.pic).map((b) => b.pic.h / b.pic.w)));
    picH = boxW * shape;
    if (profile.heightPt) {
      // Each row has its own pictures, names and labels; the rows share what is left.
      const room = (profile.heightPt - (stemH + bank.h + rows * (words.nameH + words.labelH) + (rows - 1) * ROW_GAP * pt + 2 * PAD * pt)) / rows;
      if (room < PIC_MIN_H * pt) {
        return new Error(
          `PROCESS_CHAIN_ZONE_TOO_SHALLOW: the chain's pictures are left ${(Math.max(0, room) / 72).toFixed(2)}in of height at the ${profile.minFontPt}pt readable size, and a picture needs ${(PIC_MIN_H * profile.minFontPt / 72).toFixed(2)}in to be seen. ` +
            'Give it more height, or shorten the names and labels.'
        );
      }
      if (picH > room) {
        // A shallow space is a narrower link, not a letterbox: the frame keeps
        // the pictures' own shape and the arrows keep their length.
        picH = room;
        boxW = Math.max(BOX_MIN_W * pt, Math.min(boxW, picH / shape));
        words = wordsAt(boxW);
        if (words instanceof Error) return words;
      }
    }
  }
  const mainH = Math.max(picH, n.boxes.some((b) => !b || !b.pic) ? words.boxH : 0);
  const rowH = mainH + words.nameH + words.labelH;
  const chainH = rows * rowH + (rows - 1) * ROW_GAP * pt;
  // A bank too tall for a shallow space gives up picture size before the chain
  // is refused: its pictures shrink towards the width of a box.
  if (profile.heightPt && bank.picH) {
    const over = stemH + bank.h + chainH + 2 * PAD * pt - profile.heightPt;
    if (over > 0.5) {
      bank = bankAt(n, profile, pt, W, Math.max(BOX_MIN_W * pt, (bank.picH - over) / BANK_SHAPE));
      if (bank instanceof Error) return bank;
    }
  }
  const baseJoin = (n.arrowHeads ? ARROW_W : JOIN_W) * pt;
  const spare = perRow > 1 ? (W - 2 * PAD * pt - 2 * turn - perRow * boxW) / (perRow - 1) - 2 * ARROW_GAP * pt : baseJoin;
  const joinW = anyPic ? Math.max(baseJoin, Math.min(ARROW_MAX_W * pt, spare)) : baseJoin;
  const contentW = Math.max(perRow * boxW + (perRow - 1) * (joinW + 2 * ARROW_GAP * pt) + 2 * PAD * pt + 2 * turn, bank.cells.length ? bank.rowW + 2 * PAD * pt : 0);
  const h = stemH + bank.h + chainH + 2 * PAD * pt;
  if (profile.heightPt && h > profile.heightPt + 0.5) {
    return new Error(
      `PROCESS_CHAIN_ZONE_TOO_SHALLOW: the chain needs ${(h / 72).toFixed(2)}in of height at the ${profile.minFontPt}pt readable size and the space is ${(profile.heightPt / 72).toFixed(2)}in. ` +
        'Give it more height, or shorten the stages.'
    );
  }
  return { pt, labelPt, joinW, boxW, boxH: words.boxH, picH, mainH, nameH: words.nameH, labelH: words.labelH, writeLine: words.writeLine, lines: words.lines, labels: words.labels, stemLines, stemH, bank, contentW, h, rows, perRow, rowH, rowGap: rows > 1 ? ROW_GAP * pt : 0, turn };
}

// One row when the chain fits one at any readable size; otherwise two. The
// choice is made with the answers written in, so a pupil sheet whose empty
// boxes would squeeze onto one row still has the shape of its answer sheet.
// A shallow space is not helped by a second row, so its refusal stands.
function rowsFor(full, profile) {
  if (full.boxes.length < 3) return 1;
  try {
    T.settle(profile, (pt) => layoutAt(full, profile, pt, 1));
    return 1;
  } catch (err) {
    return /ZONE_TOO_SHALLOW/.test(err.message) ? 1 : 2;
  }
}

function settleRows(n, profile, full) {
  const rows = rowsFor(full, profile);
  return T.settle(profile, (pt) => layoutAt(n, profile, pt, rows));
}

// A picture placed whole inside its frame, centred, never cropped or stretched.
function fit(pic, x, y, w, h) {
  const scale = Math.min(w / pic.w, h / pic.h);
  const pw = pic.w * scale;
  const ph = pic.h * scale;
  return { href: pic.href, x: x + (w - pw) / 2, y: y + (h - ph) / 2, w: pw, h: ph };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = T.resolveProfile(profileOrSurface, box);
  const full = normalise(spec);
  const n = answersShown(profile) ? full : normalise(withoutAnswers(spec));
  const L = settleRows(n, profile, full);
  const { W, dx } = T.frameWidth(profile, L.contentW);
  const arrowRun = L.joinW + 2 * ARROW_GAP * L.pt;
  const chainW = L.perRow * L.boxW + (L.perRow - 1) * arrowRun;
  const x0 = dx + (W - chainW) / 2;
  const top = PAD * L.pt + L.stemH + L.bank.h;
  const boxes = n.boxes.map((b, i) => {
    // The second row starts under the first link, as a line of a book does.
    const row = Math.floor(i / L.perRow);
    const rowTop = top + row * (L.rowH + L.rowGap);
    const x = x0 + (i % L.perRow) * (L.boxW + arrowRun);
    const pic = b && b.pic ? fit(b.pic, x, rowTop, L.boxW, L.mainH) : null;
    return {
      text: b ? b.text : null,
      label: b ? b.label : null,
      answer: Boolean(b && b.answer),
      x,
      row,
      rowTop,
      arrowY: rowTop + L.mainH / 2,
      // A box of words, or an empty box, sits on the arrows' own line.
      y: pic ? rowTop : rowTop + (L.mainH - L.boxH) / 2,
      w: L.boxW,
      h: pic ? L.mainH : L.boxH,
      pic,
      lines: L.lines[i],
      labelLines: L.labels[i],
      writeLine: L.writeLine && !(b && b.label),
    };
  });
  const bankX0 = L.bank.cells.length ? dx + (W - L.bank.rowW) / 2 : 0;
  const bankTop = PAD * L.pt + L.stemH;
  const bankCells = L.bank.cells.map((c, i) => {
    const x = bankX0 + i * (L.bank.cellW + L.bank.gap);
    return { text: c.text, x, y: bankTop, w: L.bank.cellW, h: L.bank.picH, pic: c.pic ? fit(c.pic, x, bankTop, L.bank.cellW, L.bank.picH) : null, lines: c.lines };
  });
  return { ...L, n, profile, W, dx, boxes, bankCells, top, arrowY: top + L.mainH / 2, stemX: dx + PAD * L.pt };
}

function imageTag(p) {
  if (!p.href) return `<rect class="chain-picture-pending" x="${T.f2(p.x)}" y="${T.f2(p.y)}" width="${T.f2(p.w)}" height="${T.f2(p.h)}" fill="#E6E6E6"/>`;
  return `<image x="${T.f2(p.x)}" y="${T.f2(p.y)}" width="${T.f2(p.w)}" height="${T.f2(p.h)}" preserveAspectRatio="none" href="${T.esc(p.href)}"/>`;
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { pt, profile } = L;
  const c = profile.colours;
  const font = profile.font;
  // An answer is green wherever it is drawn: the board's own answer colour on
  // a surface that shows answers in colour, and the same green on the
  // teacher's answer sheet, whose sheet colours otherwise print it as ink.
  const answer = profile.answers === 'show' && profile.palette === 'sheet' ? PALETTES.colour.answer : c.answer;
  const parts = [];
  if (L.stemLines.length) {
    parts.push(T.textLines(L.stemLines, L.stemX, PAD * pt, pt, { fill: c.ink, font, bold: profile.bold, anchor: 'start' }));
  }
  L.bankCells.forEach((b) => {
    if (b.pic) parts.push(imageTag(b.pic));
    if (b.lines.length) parts.push(T.textLines(b.lines, b.x + b.w / 2, b.y + b.h + (b.h ? PIC_NAME_GAP * pt : 0), pt, { fill: c.ink, font, bold: true }));
  });
  const hair = Math.max(0.5, (BOX_STROKE * pt) / 2);
  const head = (tip, y) => `<polygon points="${T.f2(tip)},${T.f2(y)} ${T.f2(tip - ARROW_HEAD_W * pt)},${T.f2(y - (ARROW_HEAD_H * pt) / 2)} ${T.f2(tip - ARROW_HEAD_W * pt)},${T.f2(y + (ARROW_HEAD_H * pt) / 2)}" fill="${c.ink}"/>`;
  L.boxes.forEach((b, i) => {
    const underTop = b.rowTop + L.mainH + L.nameH;
    if (b.pic) {
      parts.push(imageTag(b.pic));
      if (b.lines.length) parts.push(T.textLines(b.lines, b.x + b.w / 2, b.rowTop + L.mainH + PIC_NAME_GAP * pt, pt, { fill: b.answer ? answer : c.ink, font, bold: true }));
    } else {
      parts.push(
        `<rect x="${T.f2(b.x)}" y="${T.f2(b.y)}" width="${T.f2(b.w)}" height="${T.f2(b.h)}" rx="${T.f2(BOX_RADIUS * pt)}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${T.f2(Math.max(1, BOX_STROKE * pt))}"/>`
      );
      if (b.lines.length) {
        const top = b.y + (b.h - T.blockHeight(b.lines.length, pt)) / 2;
        parts.push(T.textLines(b.lines, b.x + b.w / 2, top, pt, { fill: b.answer ? answer : c.ink, font, bold: true }));
      }
    }
    if (b.labelLines.length) {
      parts.push(`<g class="chain-label">${T.textLines(b.labelLines, b.x + b.w / 2, underTop + LABEL_GAP * pt, L.labelPt, { fill: c.answer, font, bold: true })}</g>`);
    } else if (b.writeLine) {
      const lw = b.w * LABEL_LINE_SHARE;
      parts.push(`<rect class="chain-label-line" x="${T.f2(b.x + (b.w - lw) / 2)}" y="${T.f2(underTop + LABEL_LINE_H * pt - hair)}" width="${T.f2(lw)}" height="${T.f2(hair)}" fill="${c.ink}"/>`);
    }
    const next = L.boxes[i + 1];
    if (next && next.row !== b.row) {
      // The turn: out of the last link of the top row, down past everything
      // under that row, back along the gap between the rows, down beside the
      // first link of the next row and into it, as the eye goes to the next
      // line of a book. Plain to its end when the child draws the heads.
      const out = TURN_W * pt - ARROW_GAP * pt;
      const xR = b.x + b.w + out;
      const xL = next.x - out;
      const yMid = b.rowTop + L.rowH + L.rowGap / 2;
      const tip = next.x - ARROW_GAP * pt;
      const end = L.n.arrowHeads ? tip - ARROW_HEAD_W * pt + 0.5 : tip;
      const d = `M ${T.f2(b.x + b.w + ARROW_GAP * pt)} ${T.f2(b.arrowY)} H ${T.f2(xR)} V ${T.f2(yMid)} H ${T.f2(xL)} V ${T.f2(next.arrowY)} H ${T.f2(end)}`;
      const line = `<path d="${d}" fill="none" stroke="${c.ink}" stroke-width="${T.f2(ARROW_STROKE * pt)}" stroke-linejoin="miter"/>`;
      parts.push(L.n.arrowHeads ? `<g class="chain-arrow chain-turn">${line}${head(tip, next.arrowY)}</g>` : `<g class="chain-join chain-turn">${line}</g>`);
    } else if (next) {
      const y = b.arrowY;
      const x1 = b.x + b.w + ARROW_GAP * pt;
      const tip = x1 + L.joinW;
      const headL = tip - ARROW_HEAD_W * pt;
      const bar = (to) => `<rect x="${T.f2(x1)}" y="${T.f2(y - (ARROW_STROKE * pt) / 2)}" width="${T.f2(to - x1)}" height="${T.f2(ARROW_STROKE * pt)}" fill="${c.ink}"/>`;
      parts.push(
        L.n.arrowHeads
          ? `<g class="chain-arrow">${bar(headL + 0.5)}` +
              `<polygon points="${T.f2(tip)},${T.f2(y)} ${T.f2(headL)},${T.f2(y - (ARROW_HEAD_H * pt) / 2)} ${T.f2(headL)},${T.f2(y + (ARROW_HEAD_H * pt) / 2)}" fill="${c.ink}"/></g>`
          : `<g class="chain-join">${bar(tip)}</g>`
      );
    }
  });
  const h = L.h;
  return { svg: T.svgDoc(L.W, h, parts), w: L.W, h, aspect: L.W / h, layout: L };
}

// The pictures are named by their files in the key: a photograph's own bytes
// would make a key of megabytes.
function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = T.resolveProfile(profileOrSurface, box);
  const n = normalise(answersShown(p) ? spec : withoutAnswers(spec));
  const slim = (b) => (b ? { text: b.text, label: b.label, answer: Boolean(b.answer), pic: b.pic ? [b.imagePath || (b.pic.href || '').length, Boolean(b.pic.href), b.pic.w, b.pic.h] : null } : null);
  return `process-chain:${T.profileKey(p)}:${JSON.stringify({ ...n, boxes: n.boxes.map(slim), bank: n.bank.map(slim) })}`;
}

const { preparePictures, prepareChainsIn } = require('./process-chain-pictures');

// `link`, `fit` and `imageTag` are also the cycle's (cycle-svg.js): a stage of a
// loop is written, and its picture placed, exactly as a link of a chain is.
module.exports = { tightSvg, cacheKey, normalise, describeLayout, preparePictures, prepareChainsIn, MAX_BOXES, link, fit, imageTag };
