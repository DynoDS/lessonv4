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

const T = require('./figure-text');

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

function normalise(spec = {}) {
  const boxes = Array.isArray(spec.boxes) ? spec.boxes.map(link) : [];
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

function layoutAt(n, profile, pt) {
  const bold = profile.bold;
  const W = profile.widthPt;
  const count = n.boxes.length;
  const arrowRun = (n.arrowHeads ? ARROW_W : JOIN_W) + 2 * ARROW_GAP;
  const anyPic = n.boxes.some((b) => b && b.pic);
  const across = (W - 2 * PAD * pt - (count - 1) * arrowRun * pt) / count;
  let boxW = Math.min((anyPic ? PIC_MAX_W : BOX_MAX_W) * pt, across);
  if (boxW < BOX_MIN_W * pt) {
    return new Error(
      `PROCESS_CHAIN_TOO_NARROW: ${count} boxes and their arrows need ${(((BOX_MIN_W + arrowRun) * count - arrowRun + 2 * PAD) * profile.minFontPt / 72 * 25.4).toFixed(0)}mm ` +
        `across at the ${profile.minFontPt}pt readable size and this space is ${(W / 72 * 25.4).toFixed(0)}mm. Give the chain more width, or split it into two chains.`
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
      const room = profile.heightPt - (stemH + bank.h + words.nameH + words.labelH + 2 * PAD * pt);
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
  // A bank too tall for a shallow space gives up picture size before the chain
  // is refused: its pictures shrink towards the width of a box.
  if (profile.heightPt && bank.picH) {
    const over = stemH + bank.h + mainH + words.nameH + words.labelH + 2 * PAD * pt - profile.heightPt;
    if (over > 0.5) {
      bank = bankAt(n, profile, pt, W, Math.max(BOX_MIN_W * pt, (bank.picH - over) / BANK_SHAPE));
      if (bank instanceof Error) return bank;
    }
  }
  const baseJoin = (n.arrowHeads ? ARROW_W : JOIN_W) * pt;
  const spare = count > 1 ? (W - 2 * PAD * pt - count * boxW) / (count - 1) - 2 * ARROW_GAP * pt : baseJoin;
  const joinW = anyPic ? Math.max(baseJoin, Math.min(ARROW_MAX_W * pt, spare)) : baseJoin;
  const contentW = Math.max(count * boxW + (count - 1) * (joinW + 2 * ARROW_GAP * pt) + 2 * PAD * pt, bank.cells.length ? bank.rowW + 2 * PAD * pt : 0);
  const h = stemH + bank.h + mainH + words.nameH + words.labelH + 2 * PAD * pt;
  if (profile.heightPt && h > profile.heightPt + 0.5) {
    return new Error(
      `PROCESS_CHAIN_ZONE_TOO_SHALLOW: the chain needs ${(h / 72).toFixed(2)}in of height at the ${profile.minFontPt}pt readable size and the space is ${(profile.heightPt / 72).toFixed(2)}in. ` +
        'Give it more height, or shorten the stages.'
    );
  }
  return { pt, labelPt, joinW, boxW, boxH: words.boxH, picH, mainH, nameH: words.nameH, labelH: words.labelH, writeLine: words.writeLine, lines: words.lines, labels: words.labels, stemLines, stemH, bank, contentW, h };
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
  const n = normalise(spec);
  const L = T.settle(profile, (pt) => layoutAt(n, profile, pt));
  const { W, dx } = T.frameWidth(profile, L.contentW);
  const arrowRun = L.joinW + 2 * ARROW_GAP * L.pt;
  const chainW = n.boxes.length * L.boxW + (n.boxes.length - 1) * arrowRun;
  const x0 = dx + (W - chainW) / 2;
  const top = PAD * L.pt + L.stemH + L.bank.h;
  const boxes = n.boxes.map((b, i) => {
    const x = x0 + i * (L.boxW + arrowRun);
    const pic = b && b.pic ? fit(b.pic, x, top, L.boxW, L.mainH) : null;
    return {
      text: b ? b.text : null,
      label: b ? b.label : null,
      x,
      // A box of words, or an empty box, sits on the arrows' own line.
      y: pic ? top : top + (L.mainH - L.boxH) / 2,
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
  const parts = [];
  if (L.stemLines.length) {
    parts.push(T.textLines(L.stemLines, L.stemX, PAD * pt, pt, { fill: c.ink, font, bold: profile.bold, anchor: 'start' }));
  }
  L.bankCells.forEach((b) => {
    if (b.pic) parts.push(imageTag(b.pic));
    if (b.lines.length) parts.push(T.textLines(b.lines, b.x + b.w / 2, b.y + b.h + (b.h ? PIC_NAME_GAP * pt : 0), pt, { fill: c.ink, font, bold: true }));
  });
  const underTop = L.top + L.mainH + L.nameH;
  const hair = Math.max(0.5, (BOX_STROKE * pt) / 2);
  L.boxes.forEach((b, i) => {
    if (b.pic) {
      parts.push(imageTag(b.pic));
      if (b.lines.length) parts.push(T.textLines(b.lines, b.x + b.w / 2, L.top + L.mainH + PIC_NAME_GAP * pt, pt, { fill: c.ink, font, bold: true }));
    } else {
      parts.push(
        `<rect x="${T.f2(b.x)}" y="${T.f2(b.y)}" width="${T.f2(b.w)}" height="${T.f2(b.h)}" rx="${T.f2(BOX_RADIUS * pt)}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${T.f2(Math.max(1, BOX_STROKE * pt))}"/>`
      );
      if (b.lines.length) {
        const top = b.y + (b.h - T.blockHeight(b.lines.length, pt)) / 2;
        parts.push(T.textLines(b.lines, b.x + b.w / 2, top, pt, { fill: c.ink, font, bold: true }));
      }
    }
    if (b.labelLines.length) {
      parts.push(`<g class="chain-label">${T.textLines(b.labelLines, b.x + b.w / 2, underTop + LABEL_GAP * pt, L.labelPt, { fill: c.answer, font, bold: true })}</g>`);
    } else if (b.writeLine) {
      const lw = b.w * LABEL_LINE_SHARE;
      parts.push(`<rect class="chain-label-line" x="${T.f2(b.x + (b.w - lw) / 2)}" y="${T.f2(underTop + LABEL_LINE_H * pt - hair)}" width="${T.f2(lw)}" height="${T.f2(hair)}" fill="${c.ink}"/>`);
    }
    if (i < L.boxes.length - 1) {
      const y = L.arrowY;
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
  const n = normalise(spec);
  const slim = (b) => (b ? { text: b.text, label: b.label, pic: b.pic ? [b.imagePath || (b.pic.href || '').length, Boolean(b.pic.href), b.pic.w, b.pic.h] : null } : null);
  return `process-chain:${T.profileKey(p)}:${JSON.stringify({ ...n, boxes: n.boxes.map(slim), bank: n.bank.map(slim) })}`;
}

const { preparePictures, prepareChainsIn } = require('./process-chain-pictures');

// `link`, `fit` and `imageTag` are also the cycle's (cycle-svg.js): a stage of a
// loop is written, and its picture placed, exactly as a link of a chain is.
module.exports = { tightSvg, cacheKey, normalise, describeLayout, preparePictures, prepareChainsIn, MAX_BOXES, link, fit, imageTag };
