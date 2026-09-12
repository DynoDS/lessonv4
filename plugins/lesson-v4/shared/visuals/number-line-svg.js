'use strict';

// Printable extension of the existing numberline family. Values are supplied
// by the lesson; geometry uses indices and never calculates intermediate values.
// SVG user units. At 130 mm wide, 80 units gives >11 mm of writing height.
const WIDTH = 900;
const PAD = 4;
const FONT = 'Arial';
const INK = '#1A1A1A';
const STROKE = 2.5;
const TICK_HALF = 9;
const FONT_MAX = 29;
const FONT_MIN = 24;
const LABEL_MAX_W = 220;
const LINE_HEIGHT = 1.25;
const LABEL_GAP = 12;
const WRITE_HEIGHT = 80;
const ROW_GAP = 28;
const ARROW_STEM = 28;
const ARROW_HEAD = 8;
const ARROW_GAP = 9;
const MAX_INTERVALS = 100;
// Jumps and a highlighted space, meaning shared with every other engine through
// number-line-jumps.js. This piece is printed for a child to write on, so it
// stays in ink: a jump is an ink arc, and a highlighted space is a grey bar and
// wash that still reads when the pack is photocopied.
const JUMP_TIER = 56;
const JUMP_HEAD = 12;
const JUMP_BOX_W = 84;
const HIGHLIGHT_GREY = '#8C8C8C';
const HIGHLIGHT_BAR = 9;
// Arial advance widths, per 1000 em; conservative allowance covers weight and
// renderer rounding. Unknown glyphs reserve a full em, never a narrow average.
const GLYPHS = {
  ' ':278, '!':278, '"':355, '#':556, '$':556, '%':889, '&':667, "'":191,
  '(':333, ')':333, '*':389, '+':584, ',':278, '-':333, '.':278, '/':278,
  ':':278, ';':278, '<':584, '=':584, '>':584, '?':556, '@':1015,
  A:667,B:667,C:722,D:722,E:667,F:611,G:778,H:722,I:278,J:500,K:667,L:556,M:833,
  N:722,O:778,P:667,Q:778,R:722,S:667,T:611,U:722,V:667,W:944,X:667,Y:667,Z:611,
  a:556,b:556,c:500,d:556,e:556,f:278,g:556,h:556,i:222,j:222,k:500,l:222,m:833,
  n:556,o:556,p:556,q:556,r:333,s:500,t:278,u:556,v:500,w:722,x:500,y:500,z:500,
  '£':556, '−':584
};
const TEXT_ALLOWANCE = 1.12;
const jumpsGeo = require('./number-line-jumps');

function measure(text, fs) {
  return Array.from(text).reduce((w, c) => w + (/\d/.test(c) ? 556 : GLYPHS[c] || 1000), 0)
    * fs / 1000 * TEXT_ALLOWANCE;
}
function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function label(value, field) {
  if (value == null || !String(value).trim() || (typeof value === 'number' && !Number.isFinite(value))) {
    throw new Error(`number-line requires ${field}`);
  }
  const text = String(value).trim();
  if (text.includes('||')) throw new Error(`number-line ${field} must be a given endpoint, not a reveal`);
  return text;
}
function wrap(text, maxW = LABEL_MAX_W) {
  let fs = FONT_MAX;
  while (fs > FONT_MIN && measure(text, fs) > maxW) fs -= 1;
  const lines = [];
  let current = '';
  for (const c of text) {
    if (current && measure(current + c, fs) > maxW) {
      lines.push(current.trim());
      current = '';
    }
    current += c;
  }
  if (current.trim()) lines.push(current.trim());
  return { lines, fs, w: Math.max(...lines.map(t => measure(t, fs))), h: lines.length * fs * LINE_HEIGHT };
}
function normalise(data = {}) {
  const lines = data.lines == null ? [data] : data.lines;
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 2) {
    throw new Error('number-line needs one or two lines');
  }
  return lines.map((s) => {
    if (!s || typeof s !== 'object') throw new Error('number-line line must be an object');
    const start = label(s.start, 'start'), end = label(s.end, 'end');
    const intervals = s.intervals;
    if (!Number.isInteger(intervals) || intervals < 1 || intervals > MAX_INTERVALS) {
      throw new Error(`number-line intervals must be an integer from 1 to ${MAX_INTERVALS}`);
    }
    const questionState = s.questionState == null ? data.questionState !== false : s.questionState !== false;
    if (s.showTicks != null && typeof s.showTicks !== 'boolean') throw new Error('number-line showTicks must be boolean');
    if (s.arrows != null && !Array.isArray(s.arrows)) throw new Error('number-line arrows must be an array');
    const arrows = (s.arrows || []).map(a => {
      if (!a || !Number.isInteger(a.index) || a.index < 0 || a.index > intervals || !/^[A-Za-z]$/.test(a.label)) {
        throw new Error('number-line arrows need an in-range integer index and one letter label');
      }
      return { index: a.index, label: a.label };
    });
    if (new Set(arrows.map(a => a.index)).size !== arrows.length || new Set(arrows.map(a => a.label)).size !== arrows.length) {
      throw new Error('number-line arrow indices and letters must be unique on each line');
    }
    // Explicit labels only. In question state a label prints only when it is
    // marked `given: true`: a number the task supplies to count from. An
    // unmarked label may be the answer, so it stays off the child's copy. With
    // nothing marked, a Year 4 set of pieces printed only its endpoints: Line A
    // lost the 5,000 the slide gave, and Line C printed the 10,000 the child had
    // to find instead of the 9,800 it was given (12 September 2026).
    const suppliedLabels = s.tickLabels || [];
    if (!Array.isArray(suppliedLabels)) throw new Error('number-line tickLabels must be an array');
    suppliedLabels.forEach(t => {
      if (!t || !Number.isInteger(t.index) || t.index <= 0 || t.index >= intervals) throw new Error('number-line tick label index must be interior');
      label(t.text, 'tick label');
    });
    const tickLabels = questionState ? suppliedLabels.filter(t => t.given === true) : suppliedLabels;
    // An endpoint the task leaves for the child is still named, so the piece
    // knows its own line, but it is not printed.
    ['startBlank', 'endBlank'].forEach(f => {
      if (s[f] != null && typeof s[f] !== 'boolean') throw new Error(`number-line ${f} must be boolean`);
    });
    const caption = s.caption == null ? '' : label(s.caption, 'caption');
    const indexScale = jumpsGeo.indexLine(intervals);
    const jumps = jumpsGeo.resolveJumps(s, indexScale);
    jumpsGeo.refuseCrowding(jumps, s, ['arrows'], 'this number line');
    const highlight = jumpsGeo.resolveIntervalHighlight(s, indexScale);
    return { start, end, intervals, showTicks: s.showTicks !== false, arrows, tickLabels, questionState, jumps, highlight,
      startBlank: s.startBlank === true, endBlank: s.endBlank === true, caption };
  });
}
function describeLayout(data = {}) {
  const specs = normalise(data);
  const blank = { lines: [], fs: FONT_MAX, w: 0, h: 0 };
  const ends = specs.map(s => [s.startBlank ? blank : wrap(s.start), s.endBlank ? blank : wrap(s.end)]);
  const x1 = PAD + Math.max(FONT_MAX, ...ends.map(e => e[0].w / 2));
  const x2 = WIDTH - PAD - Math.max(FONT_MAX, ...ends.map(e => e[1].w / 2));
  let top = PAD;
  const rows = specs.map((s, r) => {
    const arrows = s.arrows.map(a => ({ ...a, x: x1 + (x2-x1)*a.index/s.intervals }));
    // Stagger crowded letters onto measured tiers; arrows retain exact x.
    const tiers = [];
    arrows.sort((a,b) => a.x-b.x).forEach(a => {
      a.w = measure(a.label, FONT_MAX);
      let tier = tiers.findIndex(right => right + LABEL_GAP <= a.x-a.w/2);
      if (tier < 0) { tier = tiers.length; tiers.push(-Infinity); }
      tiers[tier] = a.x+a.w/2;
      a.tier = tier;
    });
    const jumpLabelH = s.jumps.some(j => j.label || j.box) ? FONT_MAX*LINE_HEIGHT : 0;
    const jumpBand = s.jumps.length ? TICK_HALF + ARROW_GAP + 4 + jumpsGeo.bandHeight(s.jumps, JUMP_TIER, jumpLabelH) : 0;
    const arrowBand = Math.max(arrows.length ? ARROW_GAP + ARROW_STEM + ARROW_HEAD + tiers.length*FONT_MAX*LINE_HEIGHT : WRITE_HEIGHT, jumpBand);
    const y = top + Math.max(WRITE_HEIGHT, arrowBand);
    const labels = ends[r].map((e,i) => ({...e, text: i ? s.end : s.start, x: (i ? x2 : x1)-e.w/2, y:y+TICK_HALF+LABEL_GAP}))
      .filter((e,i) => !(i ? s.endBlank : s.startBlank));
    s.tickLabels.forEach(t => {
      const e = wrap(String(t.text));
      labels.push({...e, text:String(t.text), x:x1+(x2-x1)*t.index/s.intervals-e.w/2, y:y+TICK_HALF+LABEL_GAP});
    });
    // Interior teaching labels are uncommon on this write-on surface. Refuse a
    // supplied crowding conflict explicitly instead of clipping or shrinking.
    const sorted = labels.slice().sort((a,b) => a.x-b.x);
    sorted.forEach((a,i) => {
      if (a.x < PAD-0.01 || a.x+a.w > WIDTH-PAD+0.01 || (i && sorted[i-1].x+sorted[i-1].w+LABEL_GAP > a.x)) {
        throw new Error('number-line supplied labels overlap: use fewer explicit tickLabels');
      }
    });
    arrows.forEach(a => {
      a.labelBox = {x:a.x-a.w/2, y:y-ARROW_GAP-ARROW_STEM-ARROW_HEAD-(a.tier+1)*FONT_MAX*LINE_HEIGHT, w:a.w, h:FONT_MAX*LINE_HEIGHT};
    });
    const captionBox = s.caption ? (() => {
      const e = wrap(s.caption, WIDTH - 2 * PAD);
      return { ...e, text: s.caption, x: (WIDTH - e.w) / 2, y: y+TICK_HALF+LABEL_GAP+WRITE_HEIGHT };
    })() : null;
    const bottom = Math.max(y+TICK_HALF+LABEL_GAP+WRITE_HEIGHT, ...labels.map(l => l.y+l.h), captionBox ? captionBox.y+captionBox.h : 0);
    const jumpShapes = s.jumps.map(j => {
      const jx1 = x1+(x2-x1)*j.fromIndex/s.intervals, jx2 = x1+(x2-x1)*j.toIndex/s.intervals;
      const geo = jumpsGeo.arcGeometry(jx1, jx2, y-TICK_HALF-ARROW_GAP/2, jumpsGeo.arcHeight(j, jx2-jx1, JUMP_TIER, jumpLabelH), JUMP_HEAD);
      let labelBox = null;
      if (j.label) {
        const w = measure(j.label, FONT_MAX);
        if (w > Math.abs(jx2-jx1) - LABEL_GAP) throw new Error('number-line jump labels overlap: label fewer jumps or use fewer intervals');
        labelBox = {x:geo.apex.x-w/2, y:geo.apex.y-jumpLabelH, w, h:jumpLabelH};
      } else if (j.box) {
        const w = Math.min(JUMP_BOX_W, Math.abs(jx2-jx1) - LABEL_GAP);
        labelBox = {x:geo.apex.x-w/2, y:geo.apex.y-jumpLabelH-2, w, h:jumpLabelH, box:true};
      }
      return { ...j, geo, labelBox };
    });
    const row = { ...s, x1, x2, y, top, bottom, arrows, labels, jumpShapes, captionBox,
      ticks:Array.from({length:s.intervals+1},(_,i)=>({index:i,x:x1+(x2-x1)*i/s.intervals})),
      writeBox:{x:x1+ends[r][0].w/2+LABEL_GAP,y:y+TICK_HALF+LABEL_GAP,
        w:x2-x1-ends[r][0].w/2-ends[r][1].w/2-2*LABEL_GAP,h:WRITE_HEIGHT} };
    top = bottom + ROW_GAP;
    return row;
  });
  return { w:WIDTH, h:rows[rows.length-1].bottom+PAD, rows };
}
function tightSvg(data = {}) {
  const layout = describeLayout(data);
  const parts = [];
  const line = (x1,y1,x2,y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${STROKE}"/>`;
  const text = (t,x,y,fs) => `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${fs}" fill="${INK}">${esc(t)}</text>`;
  layout.rows.forEach(r => {
    parts.push(line(r.x1,r.y,r.x2,r.y));
    r.highlight.forEach(h=>{
      const hx1=r.x1+(r.x2-r.x1)*h.fromIndex/r.intervals, hx2=r.x1+(r.x2-r.x1)*h.toIndex/r.intervals;
      parts.push(`<rect x="${hx1}" y="${r.y-TICK_HALF}" width="${hx2-hx1}" height="${TICK_HALF*2}" fill="${HIGHLIGHT_GREY}" fill-opacity="0.25"/>`);
      parts.push(`<rect x="${hx1}" y="${r.y-HIGHLIGHT_BAR/2}" width="${hx2-hx1}" height="${HIGHLIGHT_BAR}" fill="${HIGHLIGHT_GREY}"/>`);
    });
    r.ticks.filter(t=>r.showTicks || t.index===0 || t.index===r.intervals).forEach(t=>parts.push(line(t.x,r.y-TICK_HALF,t.x,r.y+TICK_HALF)));
    r.labels.forEach(l=>l.lines.forEach((t,i)=>parts.push(text(t,l.x+(l.w-measure(t,l.fs))/2,l.y+(i+0.82)*l.fs*LINE_HEIGHT,l.fs))));
    if (r.captionBox) { const c=r.captionBox; c.lines.forEach((t,i)=>parts.push(text(t,c.x+(c.w-measure(t,c.fs))/2,c.y+(i+0.82)*c.fs*LINE_HEIGHT,c.fs))); }
    r.jumpShapes.forEach(j=>{
      parts.push(`<polyline points="${j.geo.points.map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="${INK}" stroke-width="${STROKE}" stroke-linecap="round"/>`);
      parts.push(`<polygon points="${j.geo.head.map(p=>`${p.x},${p.y}`).join(' ')}" fill="${INK}"/>`);
      const b=j.labelBox;
      if (b && b.box) parts.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#FFFFFF" stroke="${INK}" stroke-width="${STROKE}"/>`);
      else if (b) parts.push(text(j.label,b.x,b.y+0.82*b.h,FONT_MAX));
    });
    r.arrows.forEach(a=>{
      const b=a.labelBox, tip=r.y-ARROW_GAP;
      parts.push(text(a.label,b.x,b.y+0.82*b.h,FONT_MAX));
      parts.push(line(a.x,b.y+b.h,a.x,tip-ARROW_HEAD));
      parts.push(`<polygon points="${a.x},${tip} ${a.x-ARROW_HEAD/2},${tip-ARROW_HEAD} ${a.x+ARROW_HEAD/2},${tip-ARROW_HEAD}" fill="${INK}"/>`);
    });
  });
  return {...layout,aspect:layout.w/layout.h,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${layout.w}" height="${layout.h}" viewBox="0 0 ${layout.w} ${layout.h}">${parts.join('')}</svg>`};
}
function cacheKey(data) { return `number-line:${JSON.stringify(normalise(data))}`; }
module.exports = { tightSvg, describeLayout, normalise, cacheKey };
