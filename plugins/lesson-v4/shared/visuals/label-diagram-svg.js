'use strict';

// Shared geometry for a LABELLED DIAGRAM: a base image (a photo or drawing) sat
// inside a margin band, with each callout a small anchor dot on the image joined
// by a straight leader line out to either a bold given label or a blank write-on
// line in the margin. This is the ONE source of that geometry, so the worksheet,
// the slides and the stick-in pack all draw the identical figure: change the
// look here and every engine follows, exactly the way venn/carroll/angle already
// share their geometry.
//
// The leader line is the whole point and the reason this exists as its own
// helper: a child reads the answer by following the line from the part to its
// label, so a label that just floats in a corner (the old four-callout slide) is
// not a labelled diagram. Keep the dot-on-the-part + line-to-the-label pairing.
//
// Pure and synchronous: it is handed the image already prepared as an `href` (a
// base64 data URI for a rasterising engine, or a path for inline-SVG HTML) plus
// the image's natural pixel size, and returns the composite SVG string and its
// canvas size. Each engine does its own file-load and rasterising around this.
//
// Spec:
//   href     the base image as a data URI (data:image/png;base64,…) or a path.
//   width    the image's natural pixel width.
//   height   the image's natural pixel height.
//   callouts array of { anchor, label, label_at?, given? }:
//     anchor   [x, y] as PERCENTAGES (0 to 100) of the image: the point on the
//              picture the label is about (the river's source, the leaf's vein).
//     label    the word that names that part.
//     given    true  → the label is printed (a completed/answer diagram, or a
//                       part the lesson hands the child).
//              false/absent → a blank write-on line is drawn instead, for the
//                       child (or the teacher, live) to fill the label in.
//     label_at optional [x, y] percentage for where the label sits; when absent
//              the label auto-routes to the nearest margin from its anchor, so a
//              designer only has to place the anchors.
//
// Optional presentation flags let a caller adapt the figure without changing its
// geometry; each defaults to the original behaviour, so the engines that don't
// pass them render exactly as before:
//   marginRatio   fraction of the long edge reserved for the label band on every
//                 side (default 0.28).
//   marginXRatio  left/right band, overriding marginRatio horizontally.
//   marginYRatio  top/bottom band, overriding marginRatio vertically. The working
//                 wall sets a wide horizontal band and a slim vertical one, so its
//                 phrase-length labels sit in the roomy left/right margins of a
//                 landscape card while the diagram keeps the scarce height.
//   layout        'auto' (default) routes each label to its nearest margin — right
//                 for a single anchor, but labels near each other collide.
//                 'sides' stacks the labels down the left and right margins,
//                 split by which half of the picture each anchor sits in, so
//                 several callouts never overlap — the anatomy-poster layout.
//                 The stack is spaced by what each label measures: names sit
//                 evenly down the picture, and a side whose labels are too
//                 tall for that is stacked block under block, the drawing
//                 growing above and below the picture when it has to.
//   labelMaxChars when > 0, wraps a label onto word-broken lines of about this
//                 many characters, so a long phrase reads as a tidy two-line block
//                 instead of one overrunning line. Default 0 keeps one line.
//   arrow         true draws an arrowhead at the anchor, pointing at the part, in
//                 place of the dot — the classroom-poster "this bit here" cue.
//                 Default false keeps the dot, the convention on board and sheet.
//   labelColour   the colour of a given (printed) label, default INK. The wall
//                 prints its finished labels in the house answer-green so the card
//                 reads as a worked reference, matching the rest of its colour
//                 grammar.
//   answerColour  the colour of the part of a label after `||`, default the
//                 answer green. The photocopied stick-in pack passes ink.
//   frame         optional [w, h]: the SHAPE of the box the picture is shown in
//                 (only the ratio matters). The picture is fitted inside it and
//                 centred, never stretched, and the labels sit around the box.
//                 This is how a tall picture (a body, a plant) fits a page it
//                 would overrun at full width. Anchors stay percentages of the
//                 PICTURE, so the dots land where diagram-anchor put them.
//
// Alongside the SVG the drawing returns what it measured, for a surface to
// check before it places the picture:
//   fontSize     the label type, in the drawing's own units (w wide).
//   restacked    the sides whose labels were too tall to sit evenly, 'left'
//                and/or 'right'.
//   outgrown     the restacked sides whose labels stand taller than the picture
//                itself, each as { side, need, room, rows }: the height the
//                labels take, the height of the picture, and the rows of the
//                longest label there.
//   labelFaults  { overlaps: [[label, label], ...], clipped: [label, ...] }:
//                printed labels that land on each other, or run off the edge
//                of the drawing. 'sides' cannot produce either; 'auto' and
//                `label_at` can, because the label goes where it was told.
//
// A surface read from across a room sets the size of the words itself:
//   fontSize     the label type in the drawing's own units (picture pixels).
//                Without it the type is a twentieth of the picture's long side,
//                which is right on paper, where the picture is printed at a
//                size chosen for it, and wrong on the board, where a picture
//                sharing a slide with two others is drawn small and took its
//                labels down with it: 11pt letters beside 28pt sentences on
//                three lessons of the 7 October 2026 stress test. Given a
//                size, the dots, lines and side bands follow the words rather
//                than the picture, and blank write-on rules are given their
//                room in the side bands like printed labels.
//   reserve      { leftEm, rightEm, rows }: room to keep for labels this
//                drawing does not carry, in multiples of the type size, so the
//                same picture on several slides sits in one place whatever
//                each slide's labels say. The drawing returns its own needs
//                as `bands` in the same form.
//
// `width` and `height` must be the picture's real pixel size. The dots and
// lines are sized from it, with a floor for small pictures, so a made-up small
// size turns the floor into giant circles (the Week 4 digestive sheet, 29 Sept
// 2026, was told 75 by 56 for a 1024 by 1536 picture). A box shape belongs in
// `frame`, never in the size.

const INK = '#1A1A1A';
const DEFAULT_BLUE = '#0070C0';   // house board blue; engines may pass their own
const ANSWER_GREEN = '#00B050';   // the deck-wide "this is the answer" green

// A label may carry the same `||` reveal the rest of the engine uses: everything
// after the first `||` is the answer and prints green, so a labelled diagram's
// answer slide reads like every other answer slide in the deck. A label with no
// marker comes back whole and renders exactly as it always has.
function splitReveal(label) {
  const t = String(label == null ? '' : label);
  const i = t.indexOf('||');
  if (i === -1) return { head: t, tail: null };
  return { head: t.slice(0, i).trimEnd(), tail: t.slice(i + 2).trimStart() };
}

// In the `sides` layout the labels stack down each margin in the order their dots
// sit down the picture, which is what keeps the leader lines from crossing. When
// the labels are a set of positional numbers a child works through as a list, that
// stacking is also the order the child reads, so the numbers have to agree with it:
// a map numbered by geography rather than by position prints 3, 5, 4 down the side
// and sends a child hunting for the number they are answering. Renumbering here,
// where the final stacking order is known, keeps each number attached to the part
// its dot sits on while making the column read 1, 2, 3 down the page.
//
// This only fires when every printed label opens with a number and those numbers
// are exactly 1..n, so the numbering is positional rather than meaningful. Named
// labels ("Equator", "the source") and numbers that carry their own meaning (a
// date, a measurement) are left untouched, and only the leading number is
// rewritten, so whatever the label says after it travels with its own dot.
function renumberByReadingOrder(callouts, onLeft = (c) => c.anchor[0] < 50) {
  const given = callouts.filter((c) => c.given && c.label != null);
  if (given.length < 2) return callouts;

  const leading = given.map((c) => /^\s*(\d+)(\D|$)/.exec(String(c.label)));
  if (leading.some((m) => m === null)) return callouts;

  const numbers = leading.map((m) => Number(m[1])).sort((a, b) => a - b);
  const isPositionalSet = numbers.every((n, k) => n === k + 1);
  if (!isPositionalSet) return callouts;

  const byY = (a, b) => a.c.anchor[1] - b.c.anchor[1];
  const withIndex = given.map((c, k) => ({ c, k }));
  const readingOrder = [
    ...withIndex.filter((o) => onLeft(o.c)).sort(byY),
    ...withIndex.filter((o) => !onLeft(o.c)).sort(byY),
  ];

  const renumbered = new Map();
  readingOrder.forEach((o, position) => {
    const label = String(o.c.label);
    renumbered.set(o.c, label.replace(/^(\s*)\d+/, `$1${position + 1}`));
  });

  return callouts.map((c) => (renumbered.has(c) ? { ...c, label: renumbered.get(c) } : c));
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Greedy word wrap to roughly maxChars per line, so a phrase-length label sits as
// a tidy block. A single over-long word is left on its own line rather than split.
// A line break written into the label is kept as a break, so a name with a note
// under it keeps the name on a row of its own.
function wrapLabel(text, maxChars) {
  const t = String(text == null ? '' : text);
  if (/\n/.test(t)) {
    const parts = t.split(/\n/).map((part) => part.trim()).filter(Boolean);
    return parts.length ? parts.flatMap((part) => wrapLabel(part, maxChars)) : [''];
  }
  if (!maxChars || t.length <= maxChars) return [t];
  const lines = [];
  let cur = '';
  for (const word of t.split(/\s+/)) {
    if (!cur) cur = word;
    else if ((cur + ' ' + word).length <= maxChars) cur += ' ' + word;
    else { lines.push(cur); cur = word; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// The box the picture is shown in: the picture itself, or with a `frame` the
// smallest box of that shape that holds it whole, with the picture centred.
function frameBox(W0, H0, frame) {
  const fw = Array.isArray(frame) ? Number(frame[0]) : NaN;
  const fh = Array.isArray(frame) ? Number(frame[1]) : NaN;
  if (!(fw > 0) || !(fh > 0)) return { W: W0, H: H0, dx: 0, dy: 0 };
  const r = fw / fh;
  const W = W0 / H0 < r ? Math.round(H0 * r) : W0;
  const H = W0 / H0 < r ? H0 : Math.round(W0 / r);
  return { W, H, dx: (W - W0) / 2, dy: (H - H0) / 2 };
}

function buildLabelDiagramSvg({ href, width, height, callouts = [], blue = DEFAULT_BLUE, font = 'Comic Sans MS', marginRatio = 0.28, marginXRatio = null, marginYRatio = null, layout = 'auto', labelMaxChars = 0, arrow = false, labelColour = INK, answerColour = ANSWER_GREEN, frame = null, fontSize = null, reserve = null, rule = null, sides = 'both' }) {
  // W and H are the box everything is laid out around; W0 and H0 the picture
  // inside it. With no frame they are the same, and the drawing is unchanged.
  const W0 = width, H0 = height;
  const { W, H, dx: picDX, dy: picDY } = frameBox(W0, H0, frame);
  const maxDim = Math.max(W, H);

  // The surface's own type size when it gives one, else a twentieth of the
  // picture. `sized` marks the first case: everything that holds or serves the
  // words then follows the words.
  const sized = fontSize > 0;
  const fsize = sized ? fontSize : Math.round(maxDim * 0.05);
  const lineHeight = fsize * 1.15;
  const charW = fsize * 0.52;             // rough Comic-Sans-bold character width
  // Floor length for a blank write-on line.
  const lineLen = sized ? fsize * 3.6 : Math.round(W * 0.18);

  // Scale the line and dot to the image so they read at whatever size the figure
  // is shown. Hairline-thin on a board-sized diagram is the recurring "I can't
  // see which part it points to" failure. The floors keep a small worksheet image
  // exactly as before (at ~360px a 2px line / r4 dot already read on paper), while
  // a board-sized image gets a proportionally bolder line and anchor.
  const strokeW = Math.max(2, maxDim * 0.005, sized ? fsize * 0.1 : 0);
  const dotR    = Math.max(4, maxDim * 0.009, sized ? fsize * 0.18 : 0);

  const f = (n) => Number(n).toFixed(2);

  // Pre-wrap every printed label so the margins can be sized to exactly what the
  // labels need. The chart then stays as large as possible, and no label is ever
  // cut off at the canvas edge. A blank write-on callout carries no text block.
  // Only the `sides` layout stacks its labels into read-down-the-page columns, so
  // it is the only one where a number's position carries a reading order to honour.
  // Which side margin a label goes to: the half of the picture its dot sits in,
  // or with `sides` set to 'left' or 'right' every label down that one side, so
  // a sheet whose write-on lines are long can keep them all in one band and
  // leave the picture the rest of the page.
  const onLeft = (c) => (sides === 'left' ? true : sides === 'right' ? false : c.anchor[0] < 50);
  const placed = layout === 'sides' ? renumberByReadingOrder(callouts || [], onLeft) : (callouts || []);

  // Each printed label becomes rows of coloured segments. A plain label is one
  // segment per row exactly as before; a label carrying a `||` reveal keeps its
  // question and its green answer on one row when they fit, and stacks them when
  // they don't, so the answer never runs off the edge of the margin band.
  const rowsFor = (c) => {
    if (!c.given) return [];
    const { head, tail } = splitReveal(c.label);
    if (tail === null) return wrapLabel(head, labelMaxChars).map((t) => [{ t, g: false }]);
    const joined = head + ' ' + tail;
    if (!labelMaxChars || joined.length <= labelMaxChars) {
      return [[{ t: head + ' ', g: false }, { t: tail, g: true }]];
    }
    return [
      ...wrapLabel(head, labelMaxChars).map((t) => [{ t, g: false }]),
      ...wrapLabel(tail, labelMaxChars).map((t) => [{ t, g: true }]),
    ];
  };

  const rowWidth = (row) => row.reduce((sum, seg) => sum + seg.t.length, 0) * charW;

  // How long a blank write-on line has to be. A child is being asked to write a
  // particular word on it, so the rule is sized to that word rather than to a
  // fixed share of the picture: on a small worksheet image a fixed share came out
  // barely a centimetre, too short to write "houses" on, which makes the one task
  // the sheet is asking for impossible to do. The answer word rides along in
  // `label` even on a blank callout, so it can be measured without being printed.
  const blankLineLen = (c) => {
    const word = splitReveal(c.label || '').head.trim();
    const needed = word ? word.length * charW * 1.4 + fsize : 0;
    // A surface a child writes on says how long a hand-written word is there,
    // in the drawing's own units: so much a letter, and never under a minimum.
    const byHand = rule ? Math.max(rule.min || 0, word.length * (rule.perLetter || 0)) : 0;
    return Math.max(lineLen, Math.round(needed), Math.round(byHand));
  };

  const list = placed.map((c) => ({
    c,
    rows: rowsFor(c),
    ax: null, ay: null, side: null, lx: null, ly: null,
  }));

  let maxLineW = 0, maxLines = 1;
  for (const o of list) {
    if (!o.c.given) {
      // A blank callout needs its write-on rule to fit in the margin band just as
      // much as a printed label needs its text to. Counting only printed labels
      // left a sheet of blanks with a margin sized to nothing, so the rules were
      // squeezed into a strip narrower than the word they were waiting for.
      maxLineW = Math.max(maxLineW, blankLineLen(o.c));
      continue;
    }
    for (const row of o.rows) maxLineW = Math.max(maxLineW, rowWidth(row));
    maxLines = Math.max(maxLines, o.rows.length);
  }
  if (reserve && reserve.rows > maxLines) maxLines = reserve.rows;

  // The margin bands hold the labels around the picture. The ratio sets the band
  // width. In the 'sides' layout the ratio is only a FLOOR: the band grows to fit
  // the widest label line (horizontal) and half the tallest label block
  // (vertical), so the stacked, wrapped wall labels sit clear of the diagram and
  // are never clipped, while the chart fills whatever room they leave. The default
  // 'auto' layout keeps the fixed band the slides and worksheets have always used.
  const ratioMX = Math.round(maxDim * (marginXRatio != null ? marginXRatio : marginRatio));
  const ratioMY = Math.round(maxDim * (marginYRatio != null ? marginYRatio : marginRatio));
  let MX = ratioMX;
  let MY = ratioMY;
  // The two side bands are sized independently, because 'sides' routes each
  // label to the half its anchor sits in and a picture whose features all lie
  // on one side leaves the opposite band holding nothing. Reserving it anyway
  // strands the picture beside a blank strip that no page measure can see: as
  // far as the document is concerned the image occupies the whole canvas.
  let MXL = ratioMX;
  let MXR = ratioMX;
  let bandsEm = null;
  // Outside the poster layout a label is centred 65% of the way out into its
  // band, so words set larger than the picture would have set them need a
  // wider band to stay on the drawing.
  if (sized && layout !== 'sides') {
    MX = Math.max(MX, Math.ceil((maxLineW + fsize) / 0.7));
    MXL = MX;
    MXR = MX;
    MY = Math.max(MY, Math.ceil(maxLines * lineHeight + fsize));
  }
  // How tall each label stands in its margin: its rows of type, or the room
  // above a write-on rule.
  const blockHeight = (o) => (o.c.given ? Math.max(0, o.rows.length - 1) * lineHeight + fsize : fsize);
  // Where the labels of one side sit, as centres measured down from the top of
  // the picture box. Names are spread evenly from 12% to 88% of the picture,
  // which keeps each one near its part. That spacing counted the labels and
  // never measured them, so labels taller than a name drew through each
  // other: a Year 4 digestion diagram went to the board on 6 October 2026
  // with a sentence under each organ name, eight blocks of up to seven rows
  // spaced as if each were one row, and no check noticed because the pile was
  // inside a picture. When the even spacing would make two neighbours touch,
  // the side is stacked block under block instead: across the same stretch of
  // picture while they fit it, and past the top and bottom of the picture,
  // centred on it, when they do not. A side that never touched is not moved.
  const stackGap = fsize * 0.6;
  const stackPlan = (group) => {
    const n = group.length;
    const heights = group.map(blockHeight);
    const even = group.map((o, k) => (n === 1 ? null : H * 0.12 + H * 0.76 * (k / (n - 1))));
    let touching = false;
    for (let k = 0; k + 1 < n; k++) {
      if (even[k + 1] - even[k] < (heights[k] + heights[k + 1]) / 2) touching = true;
    }
    if (!touching) return { centres: even, restacked: false, top: 0, bottom: H, rows: 0 };
    const sum = heights.reduce((a, b) => a + b, 0);
    const span = H * 0.76 + (heights[0] + heights[n - 1]) / 2;
    const tight = sum + stackGap * (n - 1);
    const gap = tight <= span ? (span - sum) / (n - 1) : stackGap;
    const total = sum + gap * (n - 1);
    let y = tight <= span ? H * 0.12 - heights[0] / 2 : (H - total) / 2;
    const top = y;
    const centres = heights.map((h) => {
      const centre = y + h / 2;
      y += h + gap;
      return centre;
    });
    const rows = Math.max(...group.map((o) => (o.c.given ? o.rows.length : 1)));
    return { centres, restacked: true, top, bottom: top + total, rows };
  };
  const byAnchorY = (a, b) => a.c.anchor[1] - b.c.anchor[1];
  const leftGroup = layout === 'sides' ? list.filter((o) => onLeft(o.c)).sort(byAnchorY) : [];
  const rightGroup = layout === 'sides' ? list.filter((o) => !onLeft(o.c)).sort(byAnchorY) : [];
  const leftPlan = stackPlan(leftGroup);
  const rightPlan = stackPlan(rightGroup);
  if (layout === 'sides') {
    const blockHalf = ((maxLines - 1) / 2) * lineHeight + fsize;
    // The side bands exist to hold the labels and to give each leader line a run
    // clear of the picture, so they are sized to exactly that. Holding them at a
    // fixed share of the image instead is what strands a map inside a wide white
    // surround: on a diagram whose labels are single digits, a fifth of the width
    // each side is reserved for type a few pixels wide, and the picture children
    // actually read shrinks to fit what is left. Sizing to the labels keeps a long
    // name like "Tropic of Capricorn" in clear space while letting a numbered map
    // fill the slot it was given.
    const leaderRun = sized ? fsize * 1.2 : maxDim * 0.06;
    const floorMX = Math.round(maxDim * 0.04);
    // Widest label actually routed to each side. A side with no labels keeps
    // only the floor, so the picture takes the room instead.
    const widestOn = (test) => {
      let w = 0;
      for (const o of list) {
        if (!o.rows || !test(o)) continue;
        for (const row of o.rows) w = Math.max(w, rowWidth(row));
        // A write-on rule needs its length in the band as a printed label
        // needs its width, or it is drawn across the picture and off the edge
        // (Year 1 parts of a plant, 7 October 2026). On every surface: it was
        // first given only to the board, and the sheets children actually
        // write on kept lines that started on top of the photograph.
        if (!o.c.given) w = Math.max(w, blankLineLen(o.c));
      }
      return w;
    };
    const kept = (em) => (reserve && em > 0 ? em * fsize : 0);
    const leftW = Math.max(widestOn((o) => onLeft(o.c)), kept(reserve && reserve.leftEm));
    const rightW = Math.max(widestOn((o) => !onLeft(o.c)), kept(reserve && reserve.rightEm));
    bandsEm = { leftEm: leftW / fsize, rightEm: rightW / fsize, rows: maxLines };
    const bandFor = (w) =>
      w > 0 ? Math.max(Math.round(w + fsize * 0.5 + leaderRun), floorMX) : floorMX;
    MXL = bandFor(leftW);
    MXR = bandFor(rightW);
    MX = Math.max(MXL, MXR);
    MY = Math.max(ratioMY, Math.round(blockHalf));
    // A restacked side that is taller than the picture needs the drawing to be
    // taller too, or its first and last labels are cut off at the edge.
    for (const plan of [leftPlan, rightPlan]) {
      if (!plan.restacked) continue;
      const beyond = Math.max(-plan.top, plan.bottom - H);
      if (beyond > 0) MY = Math.max(MY, Math.ceil(beyond + fsize * 0.25));
    }
  }
  const CW = W + MXL + MXR, CH = H + MY * 2;
  const ox = MXL, oy = MY;

  for (const o of list) {
    o.ax = ox + picDX + (o.c.anchor[0] / 100) * W0;
    o.ay = oy + picDY + (o.c.anchor[1] / 100) * H0;
  }

  // ── Place each label. 'sides' stacks the labels down the two side margins,
  //    split by which half of the picture the anchor is in, so they never collide;
  //    'auto' keeps the original nearest-margin routing (one anchor per label). ──
  if (layout === 'sides') {
    const top = oy + H * 0.12, bot = oy + H * 0.88;
    const place = (group, plan, side, lx) => {
      group.forEach((o, k) => {
        o.side = side;
        o.lx = lx;
        if (plan.restacked) o.ly = oy + plan.centres[k];
        else o.ly = group.length === 1 ? o.ay : top + (bot - top) * (k / (group.length - 1));
      });
    };
    place(leftGroup, leftPlan, 'left', ox - MXL * 0.5);
    place(rightGroup, rightPlan, 'right', ox + W + MXR * 0.5);
  } else {
    for (const o of list) {
      if (o.c.label_at) {
        o.lx = ox + picDX + (o.c.label_at[0] / 100) * W0;
        o.ly = oy + picDY + (o.c.label_at[1] / 100) * H0;
      } else {
        const dl = o.ax - ox, dr = ox + W - o.ax, dt = o.ay - oy, db = oy + H - o.ay;
        const m = Math.min(dl, dr, dt, db);
        if (m === dl) { o.lx = ox - MX * 0.65; o.ly = o.ay; o.side = 'left'; }
        else if (m === dr) { o.lx = ox + W + MX * 0.65; o.ly = o.ay; o.side = 'right'; }
        else if (m === dt) { o.lx = o.ax; o.ly = oy - MY * 0.5; o.side = 'top'; }
        else { o.lx = o.ax; o.ly = oy + H + MY * 0.5; o.side = 'bottom'; }
      }
    }
  }

  const parts = [`<image x="${ox + picDX}" y="${oy + picDY}" width="${W0}" height="${H0}" href="${href}"/>`];

  for (const o of list) {
    const { c, ax, ay, lx, ly, side } = o;
    const rows = o.rows;

    // The leader line ends at the inner edge of the label block (the side facing
    // the picture) rather than under the text, so the line connects part to label
    // cleanly. On a side label the block sits left or right of lx; otherwise the
    // line runs to the label point itself.
    let endX = lx, endY = ly;
    if (side === 'left' || side === 'right') {
      // Stop the leader at the inner edge of whatever sits in the margin, whether
      // that is a printed label or a blank rule. Running it to the centre point
      // instead drew the leader straight through the middle of the write-on rule,
      // and a horizontal rule crossed by a horizontal leader prints as a plus
      // sign hanging in the margin rather than as a line to write on.
      const blockW = c.given ? Math.max(...rows.map(rowWidth)) : blankLineLen(c);
      endX = side === 'left' ? lx + blockW / 2 + fsize * 0.25 : lx - blockW / 2 - fsize * 0.25;
      // Meet the write-on rule at its own height, so the leader arrives at the end
      // of the line rather than floating just above it.
      endY = c.given ? ly : ly + fsize * 0.5;
    }
    // Over a photograph a plain dark leader disappears into dark foliage or a
    // shadowed roof, so it carries a white casing: the same line drawn thicker in
    // white underneath. On a plain diagram the casing sits on white and is
    // invisible, so this costs nothing there.
    parts.push(`<line x1="${f(ax)}" y1="${f(ay)}" x2="${f(endX)}" y2="${f(endY)}" stroke="#FFFFFF" stroke-width="${f(strokeW * 2.6)}" stroke-linecap="round"/>`);
    parts.push(`<line x1="${f(ax)}" y1="${f(ay)}" x2="${f(endX)}" y2="${f(endY)}" stroke="${INK}" stroke-width="${f(strokeW)}"/>`);

    if (arrow) {
      // An arrowhead at the part, pointing from the label back to the anchor —
      // the "this bit here" cue. Sized off the stroke so it scales with the figure.
      const dx = ax - endX, dy = ay - endY;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;        // unit vector label → anchor
      const ah = Math.max(dotR * 2.2, strokeW * 4);
      const bx = ax - ux * ah, by = ay - uy * ah; // base of the arrowhead
      const px = -uy, py = ux;                    // perpendicular
      const hw = ah * 0.55;                       // half-width of the head
      parts.push(`<polygon points="${f(ax)},${f(ay)} ${f(bx + px * hw)},${f(by + py * hw)} ${f(bx - px * hw)},${f(by - py * hw)}" fill="${INK}"/>`);
    } else {
      parts.push(`<circle cx="${f(ax)}" cy="${f(ay)}" r="${f(dotR)}" fill="${blue}"/>`);
    }

    if (c.given && rows.length === 1 && rows[0].length === 1) {
      // Single-line label with no reveal: the original one-line form, so the
      // slides/worksheets output is unchanged to the byte.
      parts.push(`<text x="${f(lx)}" y="${f(ly + fsize * 0.35)}" font-family="${font}" font-size="${fsize}" font-weight="bold" fill="${labelColour}" text-anchor="middle">${escapeXml(rows[0][0].t)}</text>`);
    } else if (c.given && rows.length === 1) {
      // Question and its green answer on one line: the segments flow inline, so
      // the pair still centres on lx as a single block.
      const tspans = rows[0]
        .map((seg) => `<tspan fill="${seg.g ? answerColour : labelColour}">${escapeXml(seg.t)}</tspan>`)
        .join('');
      // `xml:space` keeps the space that ends the question: without it the
      // picture-maker drops a space at the end of a coloured piece, and
      // "A ||source" printed "Asource" (Year 4 rivers, 7 October 2026).
      parts.push(`<text x="${f(lx)}" y="${f(ly + fsize * 0.35)}" font-family="${font}" font-size="${fsize}" font-weight="bold" text-anchor="middle" xml:space="preserve">${tspans}</text>`);
    } else if (c.given) {
      // Wrapped label: stack the rows as tspans, the block centred on ly.
      const blockTop = ly - ((rows.length - 1) * lineHeight) / 2;
      const tspans = rows
        .map((row, k) => `<tspan x="${f(lx)}" y="${f(blockTop + k * lineHeight + fsize * 0.35)}" fill="${row[0].g ? answerColour : labelColour}">${escapeXml(row.map((seg) => seg.t).join(''))}</tspan>`)
        .join('');
      parts.push(`<text font-family="${font}" font-size="${fsize}" font-weight="bold" fill="${labelColour}" text-anchor="middle">${tspans}</text>`);
    } else {
      const bl = blankLineLen(c);
      parts.push(`<line x1="${f(lx - bl / 2)}" y1="${f(ly + fsize * 0.5)}" x2="${f(lx + bl / 2)}" y2="${f(ly + fsize * 0.5)}" stroke="${INK}" stroke-width="${f(strokeW)}"/>`);
    }
  }

  // What the printed labels came to, measured where they were drawn. A label
  // that lands on another, or runs off the edge of the drawing, cannot be read,
  // and a surface that places this picture has no other way to find that out:
  // the words are inside an image by the time it sees them. The slack is a
  // tenth of the type size, because the character width is an estimate. Blank
  // write-on rules are not measured here.
  const slack = fsize * 0.1;
  const boxes = list.filter((o) => o.c.given).map((o) => {
    const w = Math.max(...o.rows.map(rowWidth));
    const h = blockHeight(o);
    const name = o.rows.map((row) => row.map((seg) => seg.t).join('').trim()).join(' ');
    return { name, x0: o.lx - w / 2, x1: o.lx + w / 2, y0: o.ly - h / 2, y1: o.ly + h / 2 };
  });
  const overlaps = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const across = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
      const down = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (across > slack && down > slack) overlaps.push([a.name, b.name]);
    }
  }
  const clipped = boxes
    .filter((b) => b.x0 < -slack || b.y0 < -slack || b.x1 > CW + slack || b.y1 > CH + slack)
    .map((b) => b.name);
  const restacked = [leftPlan.restacked && 'left', rightPlan.restacked && 'right'].filter(Boolean);
  const outgrown = [['left', leftPlan], ['right', rightPlan]]
    .filter(([, plan]) => plan.restacked && plan.bottom - plan.top > H)
    .map(([side, plan]) => ({ side, need: Math.round(plan.bottom - plan.top), room: H, rows: plan.rows }));

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}"><rect width="${CW}" height="${CH}" fill="#FFFFFF"/>${parts.join('')}</svg>`;
  const picture = { x: ox + picDX, y: oy + picDY, w: W0, h: H0 };
  return { svg, w: CW, h: CH, aspect: CW / CH, fontSize: fsize, bands: bandsEm, box: { w: W, h: H }, picture, restacked, outgrown, labelFaults: { overlaps, clipped } };
}

// The labelled picture for paper a child writes on (worksheets, printed
// activities). Paper knows how wide the drawing prints, so a write-on line can
// be a real length: `perLetterMm` for each letter of the word that goes on it,
// never under `minMm`. Lines that long take room from the picture, so when a
// band on each side would leave the picture less than half the width, every
// label goes down one side instead and the picture keeps the rest (the
// teacher's choice from pictures of the Year 1 plant sheet, 8 October 2026:
// 40mm lines down one side, the photograph bigger than before).
//
// A printed name is a twentieth of the picture, as paper has always drawn it,
// but never under `minFontMm`: a picture that gave its room to the lines would
// otherwise take the one printed word down to a size nobody can read.
const PAPER_MIN_FONT_MM = 3.5; // about 10pt

function buildForPaper(args, { widthMm, perLetterMm, minMm, minFontMm = PAPER_MIN_FONT_MM }) {
  const at = (sides) => {
    let unitsPerMm = args.width / widthMm;
    let built = null;
    let fontSize = args.fontSize || null;
    for (let pass = 0; pass < 25; pass++) {
      built = buildLabelDiagramSvg({ ...args, sides, fontSize, rule: { perLetter: perLetterMm * unitsPerMm, min: minMm * unitsPerMm } });
      if (!args.fontSize && (fontSize || built.fontSize < minFontMm * (built.w / widthMm))) fontSize = minFontMm * (built.w / widthMm);
      const next = built.w / widthMm;
      const settled = Math.abs(next - unitsPerMm) / unitsPerMm < 0.002;
      unitsPerMm = next;
      // Lines that need more than the page has never settle: stop, and let
      // the share of the page the picture kept say so.
      if (settled || unitsPerMm > (args.width / widthMm) * 40) break;
    }
    return { ...built, sides, pictureMm: built.picture.w / unitsPerMm, share: built.picture.w / built.w };
  };
  const blanks = (args.callouts || []).filter((c) => !c.given);
  const both = at('both');
  if (!blanks.length || both.share >= 0.5) return both;
  const left = (args.callouts || []).filter((c) => c.anchor[0] < 50).length;
  const one = at(left > (args.callouts || []).length - left ? 'left' : 'right');
  return one.share > both.share ? one : both;
}

// A labelled diagram from a lesson's spec, with the board's presentation
// rules, for any surface that places the picture whole: the board and the
// working wall. The wall could not show a labelled photograph at all until 13
// September 2026 (it only overlaid labels on a diagram it had drawn itself), so
// a unit's anatomy poster of a real flower or a real church had to be left off
// the wall or rebuilt; now the wall places the same picture the slide shows.
//
// The picture has to be read from its file first, which only the surface can
// do: the spec reaches here with the image already prepared as
//   imageHref / imageWidth / imageHeight   (href / width / height also read)
// alongside the lesson's own fields, in the board's spelling:
//   imagePath  the file (only used in the cache key; the surface reads it)
//   callouts   [{ anchor, label, label_at?, given? }]  (a sheet's `labels` is read too)
//   layout, marginXRatio, marginYRatio, labelMaxChars, arrow, labelColour
//
// `layout: "sides"` is the poster form for a PHOTO: the names stack in the side
// margins on clear white, joined by leader lines, so dark label text never
// lands on the picture. When it is asked for, the board's poster defaults
// apply (a wide side band, a slim top and bottom band, wrapping at 16
// characters), each still overridable per spec; every other spec draws exactly
// as it always has.
function tightSvg(spec = {}) {
  const href = spec.imageHref != null ? spec.imageHref : spec.href;
  const width = Number(spec.imageWidth != null ? spec.imageWidth : spec.width);
  const height = Number(spec.imageHeight != null ? spec.imageHeight : spec.height);
  if (!href || !(width > 0) || !(height > 0)) {
    throw new Error(
      'LABEL_DIAGRAM_IMAGE_MISSING: a labelled diagram needs its picture read from imagePath before it is drawn; ' +
        'no picture reached the drawing, so nothing was drawn in its place.'
    );
  }
  const isSides = spec.layout === 'sides';
  return buildLabelDiagramSvg({
    href,
    width,
    height,
    callouts: Array.isArray(spec.callouts) ? spec.callouts : Array.isArray(spec.labels) ? spec.labels : [],
    blue: spec.blue || DEFAULT_BLUE,
    font: spec.font || 'Comic Sans MS',
    layout: spec.layout || 'auto',
    marginXRatio: spec.marginXRatio != null ? spec.marginXRatio : (isSides ? 0.22 : null),
    marginYRatio: spec.marginYRatio != null ? spec.marginYRatio : (isSides ? 0.02 : null),
    labelMaxChars: spec.labelMaxChars != null ? spec.labelMaxChars : (isSides ? 16 : 0),
    arrow: spec.arrow != null ? spec.arrow : false,
    labelColour: spec.labelColour || undefined,
    frame: spec.frame || null,
    fontSize: spec.fontSize > 0 ? spec.fontSize : null,
    reserve: spec.reserve || null,
  });
}

// Two diagrams that share a picture and callouts but lay their labels out
// differently are not the same picture, so the presentation flags belong in
// the key; the picture is named by its file, never by its inlined bytes.
function cacheKey(spec = {}) {
  return [
    'label-diagram',
    String(spec.imagePath || spec.image || ''),
    JSON.stringify(spec.callouts || spec.labels || []),
    spec.layout || 'auto',
    spec.marginXRatio, spec.marginYRatio, spec.labelMaxChars, spec.arrow, spec.labelColour,
    JSON.stringify(spec.frame || null),
  ].join('|');
}

// Deliberate inline treatment: target dot -> ruled leader -> label line. A base
// image would be task-specific and unreadable in the narrow Success Criteria
// slot, but the mark the child must draw remains clear.
function leaderCueSvg() {
  const w = 250, h = 120;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><circle cx="38" cy="82" r="13" fill="${DEFAULT_BLUE}"/><line x1="50" y1="76" x2="152" y2="34" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><line x1="152" y1="34" x2="232" y2="34" stroke="${INK}" stroke-width="7" stroke-linecap="round"/></svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { buildLabelDiagramSvg, buildForPaper, tightSvg, cacheKey, leaderCueSvg };
