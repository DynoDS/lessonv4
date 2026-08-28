'use strict';

// Compact curved-arrow cue. The full turn diagram carries degrees and an
// object; inline only the clockwise/anticlockwise direction is stable.
function tightSvg(data) {
  const clockwise = !data || data.direction !== 'anticlockwise';
  const w = 170, h = 150;
  const path = clockwise ? 'M 45 118 A 58 58 0 1 1 126 118' : 'M 125 118 A 58 58 0 1 0 44 118';
  const head = clockwise ? '132,118 112,108 116,132' : '38,118 58,108 54,132';
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${path}" fill="none" stroke="#0070C0" stroke-width="10" stroke-linecap="round"/><polygon points="${head}" fill="#0070C0"/><circle cx="85" cy="76" r="10" fill="#333333"/></svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg };
