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
function renumberByReadingOrder(callouts) {
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
    ...withIndex.filter((o) => o.c.anchor[0] < 50).sort(byY),
    ...withIndex.filter((o) => o.c.anchor[0] >= 50).sort(byY),
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
function wrapLabel(text, maxChars) {
  const t = String(text == null ? '' : text);
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

function buildLabelDiagramSvg({ href, width, height, callouts = [], blue = DEFAULT_BLUE, font = 'Comic Sans MS', marginRatio = 0.28, marginXRatio = null, marginYRatio = null, layout = 'auto', labelMaxChars = 0, arrow = false, labelColour = INK }) {
  const W = width, H = height;
  const maxDim = Math.max(W, H);

  const fsize = Math.round(maxDim * 0.05);
  const lineHeight = fsize * 1.15;
  const charW = fsize * 0.52;             // rough Comic-Sans-bold character width
  const lineLen = Math.round(W * 0.18);   // floor length for a blank write-on line

  // Scale the line and dot to the image so they read at whatever size the figure
  // is shown. Hairline-thin on a board-sized diagram is the recurring "I can't
  // see which part it points to" failure. The floors keep a small worksheet image
  // exactly as before (at ~360px a 2px line / r4 dot already read on paper), while
  // a board-sized image gets a proportionally bolder line and anchor.
  const strokeW = Math.max(2, maxDim * 0.005);
  const dotR    = Math.max(4, maxDim * 0.009);

  const f = (n) => Number(n).toFixed(2);

  // Pre-wrap every printed label so the margins can be sized to exactly what the
  // labels need. The chart then stays as large as possible, and no label is ever
  // cut off at the canvas edge. A blank write-on callout carries no text block.
  // Only the `sides` layout stacks its labels into read-down-the-page columns, so
  // it is the only one where a number's position carries a reading order to honour.
  const placed = layout === 'sides' ? renumberByReadingOrder(callouts || []) : (callouts || []);

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
    return Math.max(lineLen, Math.round(needed));
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
    const leaderRun = maxDim * 0.06;
    const floorMX = Math.round(maxDim * 0.04);
    // Widest label actually routed to each side. A side with no labels keeps
    // only the floor, so the picture takes the room instead.
    const widestOn = (test) => {
      let w = 0;
      for (const o of list) {
        if (!o.rows || !test(o)) continue;
        for (const row of o.rows) w = Math.max(w, rowWidth(row));
      }
      return w;
    };
    const leftW = widestOn((o) => o.c.anchor[0] < 50);
    const rightW = widestOn((o) => o.c.anchor[0] >= 50);
    const bandFor = (w) =>
      w > 0 ? Math.max(Math.round(w + fsize * 0.5 + leaderRun), floorMX) : floorMX;
    MXL = bandFor(leftW);
    MXR = bandFor(rightW);
    MX = Math.max(MXL, MXR);
    MY = Math.max(ratioMY, Math.round(blockHalf));
  }
  const CW = W + MXL + MXR, CH = H + MY * 2;
  const ox = MXL, oy = MY;

  for (const o of list) {
    o.ax = ox + (o.c.anchor[0] / 100) * W;
    o.ay = oy + (o.c.anchor[1] / 100) * H;
  }

  // ── Place each label. 'sides' stacks the labels down the two side margins,
  //    split by which half of the picture the anchor is in, so they never collide;
  //    'auto' keeps the original nearest-margin routing (one anchor per label). ──
  if (layout === 'sides') {
    const top = oy + H * 0.12, bot = oy + H * 0.88;
    const place = (group, lx) => {
      group.sort((a, b) => a.ay - b.ay);
      group.forEach((o, k) => {
        o.lx = lx;
        o.ly = group.length === 1 ? o.ay : top + (bot - top) * (k / (group.length - 1));
      });
    };
    place(list.filter((o) => o.c.anchor[0] < 50).map((o) => (o.side = 'left', o)), ox - MXL * 0.5);
    place(list.filter((o) => o.c.anchor[0] >= 50).map((o) => (o.side = 'right', o)), ox + W + MXR * 0.5);
  } else {
    for (const o of list) {
      if (o.c.label_at) {
        o.lx = ox + (o.c.label_at[0] / 100) * W;
        o.ly = oy + (o.c.label_at[1] / 100) * H;
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

  const parts = [`<image x="${ox}" y="${oy}" width="${W}" height="${H}" href="${href}"/>`];

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
        .map((seg) => `<tspan fill="${seg.g ? ANSWER_GREEN : labelColour}">${escapeXml(seg.t)}</tspan>`)
        .join('');
      parts.push(`<text x="${f(lx)}" y="${f(ly + fsize * 0.35)}" font-family="${font}" font-size="${fsize}" font-weight="bold" text-anchor="middle">${tspans}</text>`);
    } else if (c.given) {
      // Wrapped label: stack the rows as tspans, the block centred on ly.
      const blockTop = ly - ((rows.length - 1) * lineHeight) / 2;
      const tspans = rows
        .map((row, k) => `<tspan x="${f(lx)}" y="${f(blockTop + k * lineHeight + fsize * 0.35)}" fill="${row[0].g ? ANSWER_GREEN : labelColour}">${escapeXml(row.map((seg) => seg.t).join(''))}</tspan>`)
        .join('');
      parts.push(`<text font-family="${font}" font-size="${fsize}" font-weight="bold" fill="${labelColour}" text-anchor="middle">${tspans}</text>`);
    } else {
      const bl = blankLineLen(c);
      parts.push(`<line x1="${f(lx - bl / 2)}" y1="${f(ly + fsize * 0.5)}" x2="${f(lx + bl / 2)}" y2="${f(ly + fsize * 0.5)}" stroke="${INK}" stroke-width="${f(strokeW)}"/>`);
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}"><rect width="${CW}" height="${CH}" fill="#FFFFFF"/>${parts.join('')}</svg>`;
  return { svg, w: CW, h: CH, aspect: CW / CH };
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

module.exports = { buildLabelDiagramSvg, tightSvg, cacheKey, leaderCueSvg };
