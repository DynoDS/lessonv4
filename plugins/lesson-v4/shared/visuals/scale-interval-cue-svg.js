'use strict';

// Inline-only scale cue shared by dials and measuring containers. The step is
// to count equal intervals; units and values remain task-specific.
function tightSvg() {
  const w = 240, h = 120;
  const ticks = [34, 77, 120, 163, 206].map(function (x, i) {
    const tall = i === 0 || i === 4;
    return `<line x1="${x}" y1="${tall ? 28 : 45}" x2="${x}" y2="92" stroke="#333333" stroke-width="7" stroke-linecap="round"/>`;
  }).join('');
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><line x1="24" y1="92" x2="216" y2="92" stroke="#333333" stroke-width="7" stroke-linecap="round"/>${ticks}<path d="M 77 28 L 120 14 L 163 28" fill="none" stroke="#0070C0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg };
