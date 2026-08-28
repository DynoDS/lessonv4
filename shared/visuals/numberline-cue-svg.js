'use strict';

// Deliberately simplified Success Criteria treatment for a number-line jump.
// Values and jump sizes come from the question, so the cue owns only direction.
function tightSvg(data) {
  const direction = data && data.direction === 'left' ? 'left' : 'right';
  const w = 250, h = 120;
  const start = direction === 'right' ? 58 : 192;
  const end = direction === 'right' ? 192 : 58;
  const sweep = direction === 'right' ? 1 : 0;
  const head = direction === 'right' ? '198,64 178,54 182,76' : '52,64 72,54 68,76';
  const ticks = [38, 82, 126, 170, 214].map(function (x) {
    return `<line x1="${x}" y1="79" x2="${x}" y2="103" stroke="#333333" stroke-width="6" stroke-linecap="round"/>`;
  }).join('');
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><line x1="24" y1="91" x2="226" y2="91" stroke="#333333" stroke-width="7" stroke-linecap="round"/>${ticks}<path d="M ${start} 72 A 72 58 0 0 ${sweep} ${end} 64" fill="none" stroke="#0070C0" stroke-width="8" stroke-linecap="round"/><polygon points="${head}" fill="#0070C0"/></svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg };
