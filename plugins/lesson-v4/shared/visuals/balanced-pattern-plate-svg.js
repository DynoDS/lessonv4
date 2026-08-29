'use strict';

// A broad, neutral food-group pattern for Year 4. The same five proportions are
// used in teaching and practice: practice removes selected answers, never changes
// the geometry. The separate less-often cue is deliberately outside the plate.
// No calorie, weight, moral, or "bad food" language belongs in this primitive.

const W = 1120;
const H = 840;
const CX = 360;
const CY = 370;
const R = 318;
const STROKE = 8;
const FONT = 'Arial, sans-serif';
const INK = '#17324D';
const MUTED = '#587083';
const BLUE = '#0070C0';
const GREEN = '#58A55C';
const ORANGE = '#F2A33A';
const PURPLE = '#8B6BB8';
const TEAL = '#4FA7A2';
const YELLOW = '#F5D76E';
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
    label: 'Dairy or alternatives', examples: ['milk', 'yoghurt', 'fortified soya'] },
  { key: 'oils-spreads', share: 0.02, colour: '#FFF8CF', edge: '#C7A62A',
    label: 'Oils and spreads', examples: ['small amounts'] }
];

const DEFAULT_CAPTION = 'Aim for this balance across a day or over time — not every meal.';

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function f(n) { return Number(n).toFixed(2); }
function point(angleDeg, radius) {
  const a = angleDeg * Math.PI / 180;
  return { x: CX + Math.cos(a) * radius, y: CY + Math.sin(a) * radius };
}

function sectorPath(start, end) {
  const a = point(start, R);
  const b = point(end, R);
  const large = end - start > 180 ? 1 : 0;
  return `M ${f(CX)} ${f(CY)} L ${f(a.x)} ${f(a.y)} A ${R} ${R} 0 ${large} 1 ${f(b.x)} ${f(b.y)} Z`;
}

function normaliseKey(value) {
  const s = String(value || '').trim().toLowerCase().replace(/[ _]+/g, '-');
  if (s === 'fruit' || s === 'vegetables' || s === 'fruit-and-vegetables') return 'fruit-vegetables';
  if (s === 'starch' || s === 'carbohydrates' || s === 'starchy-carbs') return 'starchy-carbohydrates';
  if (s === 'dairy' || s === 'alternatives' || s === 'dairy-or-alternatives') return 'dairy-alternatives';
  if (s === 'oils' || s === 'spreads' || s === 'oils-and-spreads') return 'oils-spreads';
  return GROUPS.some(g => g.key === s) ? s : null;
}

function resolvedGroups(spec) {
  const labels = spec && spec.groupLabels && typeof spec.groupLabels === 'object' ? spec.groupLabels : {};
  const examples = spec && spec.examples && typeof spec.examples === 'object' ? spec.examples : {};
  return GROUPS.map(g => {
    const customLabel = labels[g.key] || labels[g.label];
    const customExamples = examples[g.key] || examples[g.label];
    return {
      ...g,
      label: String(customLabel || g.label),
      examples: Array.isArray(customExamples) && customExamples.length
        ? customExamples.map(String).slice(0, 5)
        : g.examples
    };
  });
}

function givenSet(spec) {
  const practice = spec && (spec.mode === 'practice' || spec.practice === true);
  if (!practice) return new Set(GROUPS.map(g => g.key));
  const raw = Array.isArray(spec.givenGroups)
    ? spec.givenGroups
    : ['fruit-vegetables', 'starchy-carbohydrates'];
  return new Set(raw.map(normaliseKey).filter(Boolean));
}

function textLines(lines, x, y, size, colour, opts) {
  const o = opts || {};
  const anchor = o.anchor || 'middle';
  const weight = o.weight || '700';
  const lineH = o.lineH || size * 1.18;
  return `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${colour}">` +
    lines.map((line, i) => `<tspan x="${f(x)}" dy="${i === 0 ? 0 : lineH}">${esc(line)}</tspan>`).join('') +
    '</text>';
}

function wrap(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach(word => {
    const next = line ? `${line} ${word}` : word;
    if (!line || next.length <= maxChars) line = next;
    else { lines.push(line); line = word; }
  });
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function examplePills(items, x, y, maxW, edge) {
  const safe = items.slice(0, 4);
  const parts = [];
  const gap = 10;
  const widths = safe.map(item => Math.max(72, Math.min(132, item.length * 12 + 30)));
  const rows = [[]];
  let rowW = 0;
  safe.forEach((item, i) => {
    const w = widths[i];
    if (rowW && rowW + gap + w > maxW) { rows.push([]); rowW = 0; }
    rows[rows.length - 1].push({ item, w });
    rowW += (rowW ? gap : 0) + w;
  });
  rows.forEach((row, ri) => {
    const total = row.reduce((n, it) => n + it.w, 0) + gap * (row.length - 1);
    let px = x - total / 2;
    row.forEach(it => {
      parts.push(`<rect x="${f(px)}" y="${f(y + ri * 46)}" width="${f(it.w)}" height="36" rx="18" fill="${PAPER}" fill-opacity="0.88" stroke="${edge}" stroke-width="3"/>`);
      parts.push(textLines([it.item], px + it.w / 2, y + 25 + ri * 46, 24, INK, { weight: '600' }));
      px += it.w + gap;
    });
  });
  return parts.join('');
}

function decisionSpace(x, y, w, h) {
  return `<rect x="${f(x - w / 2)}" y="${f(y - h / 2)}" width="${f(w)}" height="${f(h)}" rx="18" fill="${PRACTICE_FILL}" fill-opacity="0.94" stroke="${BLUE}" stroke-width="4" stroke-dasharray="14 10"/>` +
    `<line x1="${f(x - w * 0.34)}" y1="${f(y - 7)}" x2="${f(x + w * 0.34)}" y2="${f(y - 7)}" stroke="${MUTED}" stroke-width="3"/>` +
    `<line x1="${f(x - w * 0.27)}" y1="${f(y + 25)}" x2="${f(x + w * 0.27)}" y2="${f(y + 25)}" stroke="${MUTED}" stroke-width="3"/>`;
}

// Fixed label positions are chosen for the real wedge shapes, not a padded grid.
// This keeps the labels readable while the sector areas remain truthful.
const POS = {
  'fruit-vegetables': { x: 390, y: 500, maxW: 280, decisionW: 240, decisionH: 110 },
  'starchy-carbohydrates': { x: 210, y: 245, maxW: 280, decisionW: 240, decisionH: 110 },
  protein: { x: 470, y: 128, maxW: 190, decisionW: 150, decisionH: 88 },
  'dairy-alternatives': { x: 566, y: 248, maxW: 165, decisionW: 135, decisionH: 82 }
};

function cacheKey(spec) {
  const s = spec || {};
  return 'balanced-pattern-plate:' + JSON.stringify({
    mode: s.mode || (s.practice ? 'practice' : 'teaching'),
    givenGroups: Array.isArray(s.givenGroups) ? s.givenGroups : null,
    groupLabels: s.groupLabels || null,
    examples: s.examples || null,
    water: s.water !== false,
    caption: s.caption === undefined ? DEFAULT_CAPTION : s.caption,
    lessOftenLabel: s.lessOftenLabel || null
  });
}

function tightSvg(spec) {
  const s = spec || {};
  const groups = resolvedGroups(s);
  const given = givenSet(s);
  const practice = s.mode === 'practice' || s.practice === true;
  const parts = [];
  // Begin at the rightmost radius. This leaves the tiny final oils wedge at the
  // right edge, where its leader can leave the plate without crossing another
  // group, while the two large sectors still dominate the circle.
  let angle = -360;

  groups.forEach(group => {
    const end = angle + group.share * 360;
    parts.push(`<path d="${sectorPath(angle, end)}" fill="${group.colour}" stroke="${PAPER}" stroke-width="${STROKE}"/>`);
    angle = end;
  });
  parts.push(`<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${INK}" stroke-width="7"/>`);

  groups.slice(0, 4).forEach(group => {
    const p = POS[group.key];
    if (given.has(group.key)) {
      const labelLines = wrap(group.label, group.key === 'dairy-alternatives' ? 17 : 22);
      const labelSize = group.key === 'dairy-alternatives' ? 27 : (group.key === 'protein' ? 29 : 31);
      parts.push(textLines(labelLines, p.x, p.y, labelSize, INK, { lineH: 32 }));
      const examplesY = p.y + labelLines.length * 35 + 10;
      const examplesShown = (group.key === 'protein' || group.key === 'dairy-alternatives')
        ? group.examples.slice(0, 2) : group.examples;
      parts.push(examplePills(examplesShown, p.x, examplesY, p.maxW, group.edge));
    } else {
      parts.push(decisionSpace(p.x, p.y + 38, p.decisionW, p.decisionH));
    }
  });

  // The oils wedge is intentionally too small for internal text. A leader makes
  // its tiny share visible without making the share itself falsely large.
  const oil = groups[4];
  const oilGiven = given.has(oil.key);
  const oilPoint = point(-3.6, R - 18);
  parts.push(`<path d="M ${f(oilPoint.x)} ${f(oilPoint.y)} L 714 676 L 748 676" fill="none" stroke="#9B7C12" stroke-width="4"/>`);
  if (oilGiven) {
    parts.push(textLines([oil.label, oil.examples.join(' • ')], 760, 668, 27, INK, { anchor: 'start', lineH: 34 }));
  } else {
    parts.push(decisionSpace(875, 684, 250, 76));
  }

  // Water is beside, not inside, the proportional plate.
  if (s.water !== false) {
    parts.push(`<path d="M 775 86 L 900 86 L 922 238 Q 924 264 898 270 L 777 270 Q 751 264 754 238 Z" fill="#DFF2FF" stroke="${BLUE}" stroke-width="6"/>`);
    parts.push(`<path d="M 760 202 Q 836 180 916 205 L 922 238 Q 924 264 898 270 L 777 270 Q 751 264 754 238 Z" fill="#93D5F5"/>`);
    parts.push(textLines(['Water'], 838, 315, 34, BLUE));
  }

  // Foods high in fat, salt or sugar are separate from the main proportional
  // plate, using frequency/amount language rather than moral labels.
  const lessOften = String(s.lessOftenLabel || 'Foods high in fat, salt or sugar');
  parts.push(`<rect x="742" y="350" width="338" height="232" rx="30" fill="#FFF7E8" stroke="${ORANGE}" stroke-width="6" stroke-dasharray="15 10"/>`);
  parts.push(textLines(wrap(lessOften, 22), 911, 403, 30, INK, { lineH: 37 }));
  parts.push(textLines(['less often', 'small amounts'], 911, 510, 29, '#9A5C00', { lineH: 38 }));

  const caption = s.caption === undefined ? DEFAULT_CAPTION : String(s.caption || '');
  if (caption) {
    parts.push(`<rect x="42" y="765" width="1036" height="58" rx="25" fill="#EAF3FA"/>`);
    parts.push(textLines([caption], W / 2, 804, 29, INK, { weight: '700' }));
  }

  if (practice) {
    parts.push(textLines(['Complete the empty areas. Keep the plate sections the same size.'], 560, 44, 27, MUTED, { weight: '600' }));
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Balanced food pattern plate">${parts.join('')}</svg>`;
  return { svg, w: W, h: H, aspect: W / H };
}

module.exports = { GROUPS, DEFAULT_CAPTION, cacheKey, tightSvg };
