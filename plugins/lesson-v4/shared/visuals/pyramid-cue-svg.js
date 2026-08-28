'use strict';

// Inline-only number-pyramid action cue: combine two neighbours to make the
// box above. Numbers are omitted because the operation belongs to the lesson.
function tightSvg() {
  const w = 220, h = 150;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect x="72" y="10" width="76" height="52" rx="6" fill="#DEEAF6" stroke="#000000" stroke-width="6"/><rect x="25" y="88" width="76" height="52" rx="6" fill="#FFFFFF" stroke="#1F4E79" stroke-width="6"/><rect x="119" y="88" width="76" height="52" rx="6" fill="#FFFFFF" stroke="#1F4E79" stroke-width="6"/><line x1="63" y1="88" x2="91" y2="62" stroke="#0070C0" stroke-width="7"/><line x1="157" y1="88" x2="129" y2="62" stroke="#0070C0" stroke-width="7"/></svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg };
