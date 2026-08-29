'use strict';

// A broad, neutral food-group pattern. The five proportions are the fixed
// content of this helper - they are the thing the picture teaches - so no spec
// field changes them. Everything a lesson may vary is words: which groups are
// already named, what each group is called, and which examples sit in it.
//
// Layout is measured, never eyeballed. Each group's words are wrapped and
// shrunk against the wedge they belong to, and a group whose wedge is too
// narrow to hold them at a readable size moves out to the label gutter on a
// leader line instead of being clipped by the rim or floated over a neighbour.
// That is what makes this reusable: change the labels or the examples and the
// drawing rearranges around them rather than breaking.
//
// No calorie, weight, moral, or "bad food" language belongs in this primitive.

const FONT = 'Arial, sans-serif';
const INK = '#17324D';
const MUTED = '#587083';
const BLUE = '#0070C0';
const GREEN = '#58A55C';
const ORANGE = '#F2A33A';
const PURPLE = '#8B6BB8';
const TEAL = '#4FA7A2';
const PAPER = '#FFFFFF';
const PRACTICE_FILL = '#FAFCFE';

const GROUPS = [
  { key: 'fruit-vegetables', share: 0.40, colour: '#DDF2D8', edge: GREEN,
    label: 'Fruit and vegetables', examples: ['apple', 'carrot', 'peas', 'berries'] },
  { key: 'starchy-carbohydrates', share: 0.37, colour: '#FFF0CC', edge: ORANGE,
    label: 'Starchy carbohydrates', examples: ['potato', 'rice', 'pasta', 'bread'] },
  { key: 'protein', share: 0.12, colour: '#E9E0F5', edge: PURPLE,
    label: 'Protein foods', examples: ['beans', 'eggs', 'fish', 'lentils'] },
  { key: 'dairy-alternatives', share: 0.09, colour: '#DDF2F0', edge: TEAL,
    label: 'Dairy or alternatives', examples: ['milk', 'yoghurt', 'soya drink'] },
  { key: 'oils-spreads', share: 0.02, colour: '#FFF8CF', edge: '#C7A62A',
    label: 'Oils and spreads', examples: ['small amounts'] }
];

const DEFAULT_CAPTION = 'Aim for this balance across a day or over time, not every meal.';
const DEFAULT_INSTRUCTION = 'Complete the empty areas. Keep the plate sections the same size.';
const DEFAULT_LESS_OFTEN = 'Foods high in fat, salt or sugar';

// --- page furniture ---------------------------------------------------------
const MARGIN = 30;
const PLATE_GAP = 46;          // plate rim to gutter
const GUTTER_MIN = 320;
const GUTTER_MAX = 430;
const PANEL_PAD = 20;
const PANEL_GAP = 22;
const BASE_R = 362;            // plate radius before the gutter asks for more
const MAX_R = 470;
const RIM_PAD = 14;            // how far a block stays off the rim
const WEDGE_PAD = 12;          // how far a block stays off a wedge edge

const LABEL_MAX = 36;
const LABEL_MIN = 23;
const PILL_MIN = 21;
const CAPTION_FONT = 30;
const INSTRUCTION_FONT = 28;
const CAPTION_H = 62;
const INSTRUCTION_H = 54;
const MAX_EXAMPLES = 4;
const MAX_LABEL_LINES = 3;

// --- text measurement -------------------------------------------------------
// Arial advance widths per 1000 units. Clipped words were the reported fault, so
// the widths are real rather than an average-glyph guess, and every fit adds a
// small safety margin on top for the renderer's own rounding.
const ARIAL = {
  ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667, "'": 191,
  '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278,
  '0': 556, '1': 556, '2': 556, '3': 556, '4': 556, '5': 556, '6': 556, '7': 556,
  '8': 556, '9': 556, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556,
  '@': 1015, 'A': 667, 'B': 667, 'C': 722, 'D': 722, 'E': 667, 'F': 611, 'G': 778,
  'H': 722, 'I': 278, 'J': 500, 'K': 667, 'L': 556, 'M': 833, 'N': 722, 'O': 778,
  'P': 667, 'Q': 778, 'R': 722, 'S': 667, 'T': 611, 'U': 722, 'V': 667, 'W': 944,
  'X': 667, 'Y': 667, 'Z': 611, '[': 278, '\\': 278, ']': 278, '^': 469, '_': 556,
  '`': 333, 'a': 556, 'b': 556, 'c': 500, 'd': 556, 'e': 556, 'f': 278, 'g': 556,
  'h': 556, 'i': 222, 'j': 222, 'k': 500, 'l': 222, 'm': 833, 'n': 556, 'o': 556,
  'p': 556, 'q': 556, 'r': 333, 's': 500, 't': 278, 'u': 556, 'v': 500, 'w': 722,
  'x': 500, 'y': 500, 'z': 500, '{': 334, '|': 260, '}': 334, '~': 584
};
const ARIAL_FALLBACK = 600;    // an unlisted glyph is assumed wide, never narrow
const BOLD_FACTOR = 1.06;
const SAFETY = 1.04;

function textW(text, size, weight) {
  const s = String(text == null ? '' : text);
  let units = 0;
  for (const ch of s) units += (ARIAL[ch] === undefined ? ARIAL_FALLBACK : ARIAL[ch]);
  const bold = Number(weight || 400) >= 600 ? BOLD_FACTOR : 1;
  return (units / 1000) * size * bold * SAFETY;
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function f(n) { return Number(n).toFixed(2); }
function rad(deg) { return deg * Math.PI / 180; }

// Greedy wrap by measured width. A single word wider than the box still gets its
// own line: the caller shrinks the font instead of the wrapper silently clipping.
function wrapToWidth(text, maxW, size, weight, maxLines) {
  const words = String(text == null ? '' : text).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (!line || textW(next, size, weight) <= maxW) line = next;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  const cap = maxLines || MAX_LABEL_LINES;
  if (lines.length <= cap) return lines;
  // Too many lines for the box: fold the tail back so nothing is dropped.
  const kept = lines.slice(0, cap - 1);
  kept.push(lines.slice(cap - 1).join(' '));
  return kept;
}

function widestLine(lines, size, weight) {
  return lines.reduce((most, line) => Math.max(most, textW(line, size, weight)), 0);
}

// --- example pills ----------------------------------------------------------
const PILL_PAD_X = 15;
const PILL_GAP = 10;
const PILL_ROW_GAP = 9;

function pillLayout(items, maxW, size) {
  const safe = (items || []).slice(0, MAX_EXAMPLES);
  if (!safe.length) return { rows: [], w: 0, h: 0, size, rowH: 0 };
  const rowH = Math.round(size * 1.5);
  const rows = [[]];
  let rowW = 0;
  for (const item of safe) {
    const w = textW(item, size, 600) + PILL_PAD_X * 2;
    if (rowW && rowW + PILL_GAP + w > maxW) { rows.push([]); rowW = 0; }
    rows[rows.length - 1].push({ item, w });
    rowW += (rowW ? PILL_GAP : 0) + w;
  }
  const widest = rows.reduce((most, row) => {
    const total = row.reduce((n, p) => n + p.w, 0) + PILL_GAP * (row.length - 1);
    return Math.max(most, total);
  }, 0);
  return {
    rows, size, rowH, w: widest,
    h: rows.length * rowH + (rows.length - 1) * PILL_ROW_GAP
  };
}

function pillParts(pills, cx, top, edge) {
  const parts = [];
  let y = top;
  for (const row of pills.rows) {
    const total = row.reduce((n, p) => n + p.w, 0) + PILL_GAP * (row.length - 1);
    let x = cx - total / 2;
    for (const pill of row) {
      parts.push('<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(pill.w) + '" height="' + f(pills.rowH) + '" rx="' + f(pills.rowH / 2) + '" fill="' + PAPER + '" fill-opacity="0.92" stroke="' + edge + '" stroke-width="3"/>');
      parts.push(textLine(pill.item, x + pill.w / 2, y + pills.rowH * 0.68, pills.size, INK, { weight: '600' }));
      x += pill.w + PILL_GAP;
    }
    y += pills.rowH + PILL_ROW_GAP;
  }
  return parts.join('');
}

function textLine(text, x, y, size, colour, opts) {
  const o = opts || {};
  return '<text x="' + f(x) + '" y="' + f(y) + '" text-anchor="' + (o.anchor || 'middle') +
    '" font-family="' + FONT + '" font-size="' + f(size) + '" font-weight="' + (o.weight || '700') +
    '" fill="' + colour + '">' + esc(text) + '</text>';
}

function textBlock(lines, x, top, size, colour, opts) {
  const o = opts || {};
  const lineH = o.lineH || size * 1.2;
  return lines.map((line, i) => textLine(line, x, top + size * 0.82 + i * lineH, size, colour, o)).join('');
}

// --- spec resolution --------------------------------------------------------
function normaliseKey(value) {
  const s = String(value || '').trim().toLowerCase().replace(/[ _]+/g, '-');
  if (s === 'fruit' || s === 'vegetables' || s === 'fruit-and-vegetables') return 'fruit-vegetables';
  if (s === 'starch' || s === 'carbohydrates' || s === 'starchy-carbs') return 'starchy-carbohydrates';
  if (s === 'protein-foods') return 'protein';
  if (s === 'dairy' || s === 'alternatives' || s === 'dairy-or-alternatives') return 'dairy-alternatives';
  if (s === 'oils' || s === 'spreads' || s === 'oils-and-spreads') return 'oils-spreads';
  return GROUPS.some(g => g.key === s) ? s : null;
}

function resolvedGroups(spec) {
  const labels = spec && spec.groupLabels && typeof spec.groupLabels === 'object' ? spec.groupLabels : {};
  const examples = spec && spec.examples && typeof spec.examples === 'object' ? spec.examples : {};
  let angle = 0;
  return GROUPS.map(g => {
    const customLabel = labels[g.key] || labels[g.label];
    const customExamples = examples[g.key] || examples[g.label];
    const a1 = angle;
    angle += g.share * 360;
    return Object.assign({}, g, {
      a1,
      a2: angle,
      label: String(customLabel || g.label),
      examples: Array.isArray(customExamples)
        ? customExamples.map(String).filter(Boolean).slice(0, MAX_EXAMPLES)
        : g.examples
    });
  });
}

// Which groups arrive already named. The helper never picks this for a lesson:
// `givenGroups` names the ones that are given, `blankGroups` names the ones that
// are not, and a practice plate with neither is blank throughout.
function givenSet(spec) {
  const s = spec || {};
  const practice = s.mode === 'practice' || s.practice === true;
  if (!practice) return new Set(GROUPS.map(g => g.key));
  if (Array.isArray(s.givenGroups)) {
    return new Set(s.givenGroups.map(normaliseKey).filter(Boolean));
  }
  if (Array.isArray(s.blankGroups)) {
    const blank = new Set(s.blankGroups.map(normaliseKey).filter(Boolean));
    return new Set(GROUPS.map(g => g.key).filter(key => !blank.has(key)));
  }
  return new Set();
}

// --- wedge geometry ---------------------------------------------------------
function makeGeom(R, cx, cy) {
  function point(angleDeg, radius) {
    const a = rad(angleDeg);
    return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius };
  }
  function sectorPath(start, end) {
    const a = point(start, R);
    const b = point(end, R);
    const large = end - start > 180 ? 1 : 0;
    return 'M ' + f(cx) + ' ' + f(cy) + ' L ' + f(a.x) + ' ' + f(a.y) +
      ' A ' + f(R) + ' ' + f(R) + ' 0 ' + large + ' 1 ' + f(b.x) + ' ' + f(b.y) + ' Z';
  }
  // Inside the wedge means clear of the rim and clear of both bounding rays by a
  // real distance in pixels, not by an angle that shrinks to nothing near the
  // centre. The cross products below are exactly those two distances.
  function inside(px, py, a1, a2) {
    const dx = px - cx;
    const dy = py - cy;
    if (Math.hypot(dx, dy) > R - RIM_PAD) return false;
    const u1x = Math.cos(rad(a1));
    const u1y = Math.sin(rad(a1));
    const u2x = Math.cos(rad(a2));
    const u2y = Math.sin(rad(a2));
    return (u1x * dy - u1y * dx) >= WEDGE_PAD && (u2x * dy - u2y * dx) <= -WEDGE_PAD;
  }
  // Slide a w x h block along the wedge's bisector and keep every radius where
  // all four of its corners sit inside. The middle of that run is the placement:
  // it is as far from the rim as it is from the point.
  function place(w, h, a1, a2) {
    const am = (a1 + a2) / 2;
    const ux = Math.cos(rad(am));
    const uy = Math.sin(rad(am));
    const hits = [];
    for (let r = Math.round(R * 0.12); r <= R; r += 4) {
      const bx = cx + ux * r;
      const by = cy + uy * r;
      if (inside(bx - w / 2, by - h / 2, a1, a2) && inside(bx + w / 2, by - h / 2, a1, a2) &&
          inside(bx - w / 2, by + h / 2, a1, a2) && inside(bx + w / 2, by + h / 2, a1, a2)) {
        hits.push({ x: bx, y: by });
      }
    }
    return hits.length ? hits[Math.floor(hits.length / 2)] : null;
  }
  return { point, sectorPath, place, R, cx, cy };
}

// --- blocks -----------------------------------------------------------------
const LABEL_GAP = 12;
const DECISION_W = 262;
const DECISION_H = 118;
const DECISION_MIN_W = 152;

function givenBlock(group, font, maxW) {
  const lines = wrapToWidth(group.label, maxW, font, '700');
  const lineH = font * 1.18;
  const pills = pillLayout(group.examples, maxW, Math.max(PILL_MIN, Math.round(font * 0.78)));
  const w = Math.max(widestLine(lines, font, '700'), pills.w);
  const h = lines.length * lineH + (pills.h ? LABEL_GAP + pills.h : 0);
  return { kind: 'given', lines, lineH, font, pills, w, h };
}

function decisionBlock(scale) {
  return {
    kind: 'blank',
    w: Math.max(DECISION_MIN_W, DECISION_W * scale),
    h: Math.max(DECISION_MIN_W * (DECISION_H / DECISION_W), DECISION_H * scale)
  };
}

// Try the readable sizes first and only then the small ones, and try a wide
// block before a narrow one so a label breaks into two lines rather than five.
// `null` means the wedge cannot hold this content at a size a child can read
// from across the room, which is the signal to move it to the gutter.
function layoutInWedge(group, given, geom) {
  if (!given) {
    for (const scale of [1, 0.9, 0.8, 0.7, 0.6, 0.5]) {
      const block = decisionBlock(scale);
      const at = geom.place(block.w, block.h, group.a1, group.a2);
      if (at) return Object.assign({}, block, at);
    }
    return null;
  }
  const span = geom.R * 1.7;
  const widths = [0.92, 0.78, 0.64, 0.52, 0.42, 0.34, 0.27];
  for (let font = LABEL_MAX; font >= LABEL_MIN; font -= 1) {
    for (const frac of widths) {
      const maxW = span * frac;
      const block = givenBlock(group, font, maxW);
      if (block.w > maxW * 1.01) continue;
      const at = geom.place(block.w, block.h, group.a1, group.a2);
      if (at) return Object.assign({}, block, at);
    }
  }
  return null;
}

function decisionParts(cx, cy, w, h) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) +
    '" rx="18" fill="' + PRACTICE_FILL + '" fill-opacity="0.94" stroke="' + BLUE +
    '" stroke-width="4" stroke-dasharray="14 10"/>' +
    '<line x1="' + f(x + w * 0.12) + '" y1="' + f(cy - h * 0.10) + '" x2="' + f(x + w * 0.88) +
    '" y2="' + f(cy - h * 0.10) + '" stroke="' + MUTED + '" stroke-width="3"/>' +
    '<line x1="' + f(x + w * 0.18) + '" y1="' + f(cy + h * 0.24) + '" x2="' + f(x + w * 0.82) +
    '" y2="' + f(cy + h * 0.24) + '" stroke="' + MUTED + '" stroke-width="3"/>';
}

function wedgeParts(block, group) {
  if (block.kind === 'blank') return decisionParts(block.x, block.y, block.w, block.h);
  const top = block.y - block.h / 2;
  let parts = textBlock(block.lines, block.x, top, block.font, INK, { lineH: block.lineH });
  if (block.pills.h) {
    parts += pillParts(block.pills, block.x, top + block.lines.length * block.lineH + LABEL_GAP, group.edge);
  }
  return parts;
}

// --- gutter panels ----------------------------------------------------------
const GUTTER_LABEL_MAX = 30;
const GUTTER_LABEL_MIN = 22;

function calloutPanel(group, given, innerW) {
  if (!given) {
    return {
      kind: 'callout', group, given: false,
      h: DECISION_H * 0.72 + PANEL_PAD * 2,
      need: DECISION_MIN_W + PANEL_PAD * 2
    };
  }
  let font = GUTTER_LABEL_MAX;
  let lines = wrapToWidth(group.label, innerW, font, '700');
  while (font > GUTTER_LABEL_MIN && lines.length > 2) {
    font -= 1;
    lines = wrapToWidth(group.label, innerW, font, '700');
  }
  const lineH = font * 1.16;
  const pills = pillLayout(group.examples, innerW, Math.max(PILL_MIN, Math.round(font * 0.8)));
  return {
    kind: 'callout', group, given: true, lines, lineH, font, pills,
    h: PANEL_PAD + lines.length * lineH + (pills.h ? LABEL_GAP + pills.h : 0) + PANEL_PAD,
    need: Math.max(widestLine(lines, font, '700'), pills.w) + PANEL_PAD * 2
  };
}

function waterPanel(innerW) {
  return { kind: 'water', lines: wrapToWidth('Water', Math.max(120, innerW - 130), 32, '700', 2), h: 138, need: 300 };
}

function lessOftenPanel(label, innerW) {
  const lines = wrapToWidth(label, innerW, 29, '700');
  return {
    kind: 'lessOften', lines,
    h: PANEL_PAD + lines.length * 35 + 12 + 2 * 35 + PANEL_PAD,
    need: widestLine(lines, 29, '700') + PANEL_PAD * 2
  };
}

function calloutParts(panel, x, y, w) {
  const g = panel.group;
  const cx = x + w / 2;
  // A blank callout is the answer space itself, so it carries no tinted panel:
  // one dashed box on the leader reads as somewhere to write, where a box inside
  // a coloured card reads as a card that already says something.
  if (!panel.given) {
    return decisionParts(cx, y + panel.h / 2, Math.min(w - PANEL_PAD * 2, DECISION_W), DECISION_H * 0.72);
  }
  const parts = ['<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(panel.h) +
    '" rx="22" fill="' + g.colour + '" stroke="' + g.edge + '" stroke-width="4"/>'];
  parts.push(textBlock(panel.lines, cx, y + PANEL_PAD, panel.font, INK, { lineH: panel.lineH }));
  if (panel.pills.h) {
    parts.push(pillParts(panel.pills, cx, y + PANEL_PAD + panel.lines.length * panel.lineH + LABEL_GAP, g.edge));
  }
  return parts.join('');
}

function waterParts(panel, x, y, w) {
  const gw = 84;
  const gh = 96;
  const labelW = widestLine(panel.lines, 32, '700');
  const gap = 26;
  const gx = x + Math.max(PANEL_PAD, (w - (gw + gap + labelW)) / 2);
  const gy = y + 14;
  const body = ' L ' + f(gx + gw - 13) + ' ' + f(gy + gh) +
    ' Q ' + f(gx + gw - 15) + ' ' + f(gy + gh + 14) + ' ' + f(gx + gw - 30) + ' ' + f(gy + gh + 14) +
    ' L ' + f(gx + 30) + ' ' + f(gy + gh + 14) +
    ' Q ' + f(gx + 15) + ' ' + f(gy + gh + 14) + ' ' + f(gx + 13) + ' ' + f(gy + gh) + ' Z';
  return [
    '<path d="M ' + f(gx) + ' ' + f(gy) + ' L ' + f(gx + gw) + ' ' + f(gy) + body +
      '" fill="#DFF2FF" stroke="' + BLUE + '" stroke-width="6"/>',
    '<path d="M ' + f(gx + 6) + ' ' + f(gy + gh * 0.46) +
      ' Q ' + f(gx + gw / 2) + ' ' + f(gy + gh * 0.34) + ' ' + f(gx + gw - 6) + ' ' + f(gy + gh * 0.48) +
      body + '" fill="#93D5F5"/>',
    textBlock(panel.lines, gx + gw + gap + labelW / 2, y + panel.h / 2 - 24, 32, BLUE, { lineH: 36 })
  ].join('');
}

function lessOftenParts(panel, x, y, w) {
  const cx = x + w / 2;
  const top = y + PANEL_PAD;
  return [
    '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(panel.h) +
      '" rx="26" fill="#FFF7E8" stroke="' + ORANGE + '" stroke-width="6" stroke-dasharray="15 10"/>',
    textBlock(panel.lines, cx, top, 29, INK, { lineH: 35 }),
    textBlock(['less often', 'small amounts'], cx, top + panel.lines.length * 35 + 12, 28, '#9A5C00', { lineH: 35 })
  ].join('');
}

// A leader leaves the wedge at its own bisector and turns into the panel. Only
// the small right-hand groups ever reach the gutter, because the shares are
// fixed and the two large wedges are always on the left, so a leader never
// crosses the plate.
function leaderParts(geom, group, panelX, panelY) {
  const start = geom.point((group.a1 + group.a2) / 2, geom.R - 6);
  const bend = geom.cx + geom.R + PLATE_GAP * 0.45;
  return '<path d="M ' + f(start.x) + ' ' + f(start.y) + ' L ' + f(bend) + ' ' + f(start.y) +
    ' L ' + f(bend) + ' ' + f(panelY) + ' L ' + f(panelX) + ' ' + f(panelY) +
    '" fill="none" stroke="' + group.edge + '" stroke-width="4" stroke-linejoin="round"/>';
}

// --- cache key --------------------------------------------------------------
function cacheKey(spec) {
  const s = spec || {};
  return 'balanced-pattern-plate:' + JSON.stringify({
    mode: s.mode || (s.practice ? 'practice' : 'teaching'),
    givenGroups: Array.isArray(s.givenGroups) ? s.givenGroups : null,
    blankGroups: Array.isArray(s.blankGroups) ? s.blankGroups : null,
    groupLabels: s.groupLabels || null,
    examples: s.examples || null,
    water: s.water !== false,
    caption: s.caption === undefined ? DEFAULT_CAPTION : s.caption,
    instruction: s.instruction === undefined ? null : s.instruction,
    lessOftenLabel: s.lessOftenLabel || null
  });
}

// --- the drawing ------------------------------------------------------------
function tightSvg(spec) {
  const s = spec || {};
  const groups = resolvedGroups(s);
  const given = givenSet(s);
  const practice = s.mode === 'practice' || s.practice === true;

  // Which groups the plate itself can hold, at a given radius. Everything else
  // goes to the gutter, so the answer decides how tall the gutter has to be.
  function assign(R) {
    const geom = makeGeom(R, 0, 0);
    const inside = {};
    const gutter = [];
    for (const group of groups) {
      const block = layoutInWedge(group, given.has(group.key), geom);
      if (block) inside[group.key] = block;
      else gutter.push(group);
    }
    return { inside, gutter };
  }

  function gutterStack(gutter, gutterW) {
    const innerW = gutterW - PANEL_PAD * 2;
    const panels = gutter.map(group => calloutPanel(group, given.has(group.key), innerW));
    if (s.water !== false) panels.push(waterPanel(innerW));
    panels.push(lessOftenPanel(String(s.lessOftenLabel || DEFAULT_LESS_OFTEN), innerW));
    return panels;
  }

  function stackHeight(panels) {
    return panels.reduce((n, p) => n + p.h, 0) + PANEL_GAP * (panels.length - 1);
  }

  let R = BASE_R;
  let assigned = assign(R);
  let gutterW = GUTTER_MIN;
  let panels = gutterStack(assigned.gutter, gutterW);
  gutterW = Math.min(GUTTER_MAX, Math.max(GUTTER_MIN, Math.ceil(Math.max.apply(null, panels.map(p => p.need)))));
  panels = gutterStack(assigned.gutter, gutterW);
  let stackH = stackHeight(panels);

  // A gutter taller than the plate would leave the plate small in a tall frame,
  // so grow the plate to match. A bigger plate can only take labels back inside,
  // which is why the assignment is redone rather than reused.
  if (stackH > R * 2) {
    R = Math.min(MAX_R, Math.ceil(stackH / 2));
    assigned = assign(R);
    panels = gutterStack(assigned.gutter, gutterW);
    stackH = stackHeight(panels);
  }

  const instruction = practice
    ? String(s.instruction === undefined ? DEFAULT_INSTRUCTION : (s.instruction || ''))
    : '';
  const caption = s.caption === undefined ? DEFAULT_CAPTION : String(s.caption || '');

  const bandH = Math.max(R * 2, stackH);
  const topH = instruction ? INSTRUCTION_H : 0;
  const bottomH = caption ? CAPTION_H + 18 : 0;
  const W = MARGIN + R * 2 + PLATE_GAP + gutterW + MARGIN;
  const H = MARGIN + topH + bandH + bottomH + MARGIN;
  const bandTop = MARGIN + topH;
  const CX = MARGIN + R;
  const CY = bandTop + bandH / 2;
  const gutterX = MARGIN + R * 2 + PLATE_GAP;
  const geom = makeGeom(R, CX, CY);

  const parts = [];
  if (instruction) {
    parts.push(textLine(instruction, W / 2, MARGIN + 34, INSTRUCTION_FONT, MUTED, { weight: '600' }));
  }

  for (const group of groups) {
    parts.push('<path d="' + geom.sectorPath(group.a1, group.a2) + '" fill="' + group.colour +
      '" stroke="' + PAPER + '" stroke-width="8"/>');
  }
  parts.push('<circle cx="' + f(CX) + '" cy="' + f(CY) + '" r="' + f(R) +
    '" fill="none" stroke="' + INK + '" stroke-width="7"/>');

  for (const group of groups) {
    const block = assigned.inside[group.key];
    if (!block) continue;
    parts.push(wedgeParts(Object.assign({}, block, { x: block.x + CX, y: block.y + CY }), group));
  }

  // Where every space ended up, so the invariant "nothing is clipped and no
  // group's words sit over a neighbour" can be checked rather than eyeballed.
  const layout = {
    width: W, height: H, plate: { cx: CX, cy: CY, r: R },
    spaces: groups.map(group => {
      const block = assigned.inside[group.key];
      if (!block) return { key: group.key, given: given.has(group.key), placement: 'gutter', box: null };
      return {
        key: group.key,
        given: given.has(group.key),
        placement: 'plate',
        wedge: { a1: group.a1, a2: group.a2 },
        box: { x: block.x + CX - block.w / 2, y: block.y + CY - block.h / 2, w: block.w, h: block.h }
      };
    })
  };

  let y = bandTop + (bandH - stackH) / 2;
  for (const panel of panels) {
    if (panel.kind === 'callout') {
      parts.push(leaderParts(geom, panel.group, gutterX, y + panel.h / 2));
      parts.push(calloutParts(panel, gutterX, y, gutterW));
      const space = layout.spaces.find(s => s.key === panel.group.key);
      space.box = { x: gutterX, y, w: gutterW, h: panel.h };
    } else if (panel.kind === 'water') {
      parts.push(waterParts(panel, gutterX, y, gutterW));
    } else {
      parts.push(lessOftenParts(panel, gutterX, y, gutterW));
    }
    y += panel.h + PANEL_GAP;
  }

  if (caption) {
    const capY = bandTop + bandH + 18;
    parts.push('<rect x="' + f(MARGIN) + '" y="' + f(capY) + '" width="' + f(W - MARGIN * 2) +
      '" height="' + CAPTION_H + '" rx="26" fill="#EAF3FA"/>');
    parts.push(textLine(caption, W / 2, capY + CAPTION_H * 0.66, CAPTION_FONT, INK));
  }

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H +
    '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Balanced food pattern plate">' +
    parts.join('') + '</svg>';
  return { svg, w: W, h: H, aspect: W / H, layout };
}

// The same layout without the drawing, for callers that need to know where each
// group's space landed (and for the check that none of them overlaps or leaves
// the picture).
function describeLayout(spec) {
  return tightSvg(spec).layout;
}

// What a designer may put in each space, so nothing downstream has to guess.
// Every group takes its own `groupLabels` entry and up to MAX_EXAMPLES short
// `examples`; longer words shrink, then wrap, then move the whole group out to
// the gutter, and nothing is ever clipped.
const SLOTS = GROUPS.map(g => ({
  key: g.key,
  share: g.share,
  defaultLabel: g.label,
  maxExamples: MAX_EXAMPLES
}));

module.exports = {
  GROUPS, SLOTS, DEFAULT_CAPTION, DEFAULT_INSTRUCTION, MAX_EXAMPLES,
  cacheKey, tightSvg, describeLayout
};
