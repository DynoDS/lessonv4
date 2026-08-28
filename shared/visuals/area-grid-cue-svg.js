'use strict';

// Inline-only array cue: count rows and columns, then use both dimensions.
function tightSvg() {
  const w = 220, h = 150, x = 24, y = 18, cols = 4, rows = 3, cw = 43, ch = 36;
  const parts = [`<rect x="${x}" y="${y}" width="${cols * cw}" height="${rows * ch}" fill="#EAF3FB" stroke="#333333" stroke-width="6"/>`];
  for (let i = 1; i < cols; i++) parts.push(`<line x1="${x + i * cw}" y1="${y}" x2="${x + i * cw}" y2="${y + rows * ch}" stroke="#333333" stroke-width="4"/>`);
  for (let j = 1; j < rows; j++) parts.push(`<line x1="${x}" y1="${y + j * ch}" x2="${x + cols * cw}" y2="${y + j * ch}" stroke="#333333" stroke-width="4"/>`);
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg };
