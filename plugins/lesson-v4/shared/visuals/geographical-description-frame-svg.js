'use strict';

// Shared geometry for a three-part GEOGRAPHICAL DESCRIPTION FRAME. The frame is
// deliberately a write-on scaffold: its task form always shows the headings and
// prompts but leaves every ruled response space blank. An answer/reveal string is
// rendered only when the caller explicitly selects answer mode.

// ─── CONSTANTS (SVG user units) ─────────────────────────────────────────────
const W = 1200;
const OUTER_PAD = 20;
const PANEL_GAP = 16;
const PANEL_RX = 16;
const PANEL_STROKE = 3;
const HEADER_H = 68;
const TEXT_PAD_X = 24;
const PROMPT_GAP = 10;
const LINE_GAP = 42;
const LINE_STROKE = 2;
const BOTTOM_PAD = 22;
const HEADING_FS = 30;
const PROMPT_FS_MAX = 25;
const PROMPT_FS_MIN = 18;
const ANSWER_FS_MAX = 25;
const ANSWER_FS_MIN = 18;
const LINE_HEIGHT = 1.22;
const CHAR_W = 0.54;
const DEFAULT_RESPONSE_LINES = 2;
const MIN_RESPONSE_H = 92;
const MAX_RESPONSE_H = 270;
const PANEL_FILL = '#FFFFFF';
const PANEL_STROKE_COLOUR = '#0070C0';
const HEADER_FILL = '#DCEEFF';
const HEADING_COLOUR = '#005A9C';
const TEXT_COLOUR = '#1A1A1A';
const LINE_COLOUR = '#718096';
const ANSWER_COLOUR = '#00B050';
const FONT = 'Arial';
// ─── END CONSTANTS ─────────────────────────────────────────────────────────

const KEYS = ['biome', 'location', 'features'];
const DEFAULTS = Object.freeze({
  biome: {
    heading: 'Biome',
    prompt: 'What does biome mean? Give one example.',
  },
  location: {
    heading: 'Location',
    prompt: 'Name the continent and more than one country.',
  },
  features: {
    heading: 'Features from evidence',
    prompt: 'Describe two features. Link each one to map or photograph evidence.',
  },
});

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function valueFor(data, plural, key, fallback) {
  const nested = data && data[key] && typeof data[key] === 'object' ? data[key] : {};
  const grouped = data && data[plural] && typeof data[plural] === 'object' ? data[plural] : {};
  const singular = plural.endsWith('s') ? plural.slice(0, -1) : plural;
  if (nested[singular] != null) return nested[singular];
  if (nested[plural] != null) return nested[plural];
  if (grouped[key] != null) return grouped[key];
  return fallback;
}

function normalise(data = {}) {
  const answerMode = data.mode === 'answer' || data.showAnswers === true;
  const sections = KEYS.map((key) => {
    const heading = String(valueFor(data, 'headings', key, DEFAULTS[key].heading)).trim() || DEFAULTS[key].heading;
    const prompt = String(valueFor(data, 'prompts', key, DEFAULTS[key].prompt)).trim() || DEFAULTS[key].prompt;
    let responseLines = Number(valueFor(data, 'responseLines', key, DEFAULT_RESPONSE_LINES));
    responseLines = Number.isFinite(responseLines) ? clamp(Math.round(responseLines), 1, 6) : DEFAULT_RESPONSE_LINES;
    let responseHeight = Number(valueFor(data, 'responseHeights', key, NaN));
    responseHeight = Number.isFinite(responseHeight) ? clamp(responseHeight, MIN_RESPONSE_H, MAX_RESPONSE_H) : null;
    const answer = String(valueFor(data, 'answers', key, valueFor(data, 'reveals', key, '')) || '').trim();
    return { key, heading, prompt, responseLines, responseHeight, answer: answerMode ? answer : '' };
  });
  return { answerMode, sections };
}

function wrapText(text, maxWidth, maxFs, minFs) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  for (let fs = maxFs; fs >= minFs; fs -= 1) {
    const maxChars = Math.max(8, Math.floor(maxWidth / (fs * CHAR_W)));
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= maxChars || !line) line = candidate;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    if (lines.length <= 3) return { fs, lines };
  }
  const fs = minFs;
  const maxChars = Math.max(8, Math.floor(maxWidth / (fs * CHAR_W)));
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars || !line) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return { fs, lines };
}

function describeLayout(data = {}) {
  const resolved = normalise(data);
  let y = OUTER_PAD;
  const panels = resolved.sections.map((section) => {
    const promptWrap = wrapText(section.prompt, W - 2 * OUTER_PAD - 2 * TEXT_PAD_X, PROMPT_FS_MAX, PROMPT_FS_MIN);
    const answerWrap = section.answer
      ? wrapText(section.answer, W - 2 * OUTER_PAD - 2 * TEXT_PAD_X, ANSWER_FS_MAX, ANSWER_FS_MIN)
      : null;
    const promptH = Math.max(promptWrap.fs * LINE_HEIGHT, promptWrap.lines.length * promptWrap.fs * LINE_HEIGHT);
    const answerH = answerWrap ? Math.max(MIN_RESPONSE_H, answerWrap.lines.length * answerWrap.fs * LINE_HEIGHT + 18) : 0;
    const responseH = answerWrap ? answerH
      : (section.responseHeight || Math.max(MIN_RESPONSE_H, section.responseLines * LINE_GAP + 18));
    const h = HEADER_H + TEXT_PAD_X + promptH + PROMPT_GAP + responseH + BOTTOM_PAD;
    const panel = {
      ...section,
      x: OUTER_PAD,
      y,
      w: W - 2 * OUTER_PAD,
      h,
      header: { x: OUTER_PAD, y, w: W - 2 * OUTER_PAD, h: HEADER_H },
      prompt: { x: OUTER_PAD + TEXT_PAD_X, y: y + HEADER_H + TEXT_PAD_X, w: W - 2 * OUTER_PAD - 2 * TEXT_PAD_X, h: promptH, ...promptWrap },
      response: { x: OUTER_PAD + TEXT_PAD_X, y: y + HEADER_H + TEXT_PAD_X + promptH + PROMPT_GAP, w: W - 2 * OUTER_PAD - 2 * TEXT_PAD_X, h: responseH },
      answerWrap,
    };
    y += h + PANEL_GAP;
    return panel;
  });
  const h = y - PANEL_GAP + OUTER_PAD;
  return { w: W, h, aspect: W / h, panels, answerMode: resolved.answerMode };
}

function textBlock(x, y, wrap, colour, weight = 'normal') {
  return wrap.lines.map((line, i) =>
    `<text x="${x}" y="${(y + (i + 0.82) * wrap.fs * LINE_HEIGHT).toFixed(2)}" font-family="${FONT}" font-size="${wrap.fs}" font-weight="${weight}" fill="${colour}">${esc(line)}</text>`
  ).join('');
}

function tightSvg(data = {}) {
  const layout = describeLayout(data);
  const parts = [];
  for (const panel of layout.panels) {
    parts.push(`<rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="${panel.h}" rx="${PANEL_RX}" fill="${PANEL_FILL}" stroke="${PANEL_STROKE_COLOUR}" stroke-width="${PANEL_STROKE}"/>`);
    parts.push(`<path d="M ${panel.x + PANEL_RX} ${panel.y} H ${panel.x + panel.w - PANEL_RX} Q ${panel.x + panel.w} ${panel.y} ${panel.x + panel.w} ${panel.y + PANEL_RX} V ${panel.y + HEADER_H} H ${panel.x} V ${panel.y + PANEL_RX} Q ${panel.x} ${panel.y} ${panel.x + PANEL_RX} ${panel.y} Z" fill="${HEADER_FILL}"/>`);
    parts.push(`<line x1="${panel.x}" y1="${panel.y + HEADER_H}" x2="${panel.x + panel.w}" y2="${panel.y + HEADER_H}" stroke="${PANEL_STROKE_COLOUR}" stroke-width="${PANEL_STROKE}"/>`);
    parts.push(`<text x="${panel.x + TEXT_PAD_X}" y="${panel.y + HEADER_H / 2}" dominant-baseline="central" font-family="${FONT}" font-size="${HEADING_FS}" font-weight="bold" fill="${HEADING_COLOUR}">${esc(panel.heading)}</text>`);
    parts.push(textBlock(panel.prompt.x, panel.prompt.y, panel.prompt, TEXT_COLOUR, 'bold'));

    if (panel.answer && panel.answerWrap) {
      parts.push(textBlock(panel.response.x, panel.response.y + 4, panel.answerWrap, ANSWER_COLOUR, 'bold'));
    } else {
      const count = panel.responseLines;
      const top = panel.response.y + 14;
      const usable = Math.max(0, panel.response.h - 20);
      for (let i = 1; i <= count; i++) {
        const ly = top + usable * i / count;
        parts.push(`<line x1="${panel.response.x}" y1="${ly.toFixed(2)}" x2="${(panel.response.x + panel.response.w).toFixed(2)}" y2="${ly.toFixed(2)}" stroke="${LINE_COLOUR}" stroke-width="${LINE_STROKE}"/>`);
      }
    }
  }
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${layout.w}" height="${layout.h}" viewBox="0 0 ${layout.w} ${layout.h}">${parts.join('')}</svg>`;
  return { svg, w: layout.w, h: layout.h, aspect: layout.aspect, layout };
}

function cacheKey(data = {}) {
  const r = normalise(data);
  return `geographical-description-frame:${JSON.stringify(r)}`;
}

module.exports = { tightSvg, cacheKey, describeLayout, normalise, DEFAULTS };
