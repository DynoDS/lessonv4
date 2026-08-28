'use strict';

// Inline-only structure cue: one whole linked to two parts. Labels and values
// are task-specific and remain in the step/question.
function tightSvg() {
  const w = 210, h = 160;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><line x1="105" y1="69" x2="55" y2="112" stroke="#333333" stroke-width="7"/><line x1="105" y1="69" x2="155" y2="112" stroke="#333333" stroke-width="7"/><circle cx="105" cy="45" r="36" fill="#DEEAF6" stroke="#000000" stroke-width="6"/><circle cx="52" cy="126" r="29" fill="#FFFFFF" stroke="#1F4E79" stroke-width="6" stroke-dasharray="11,8"/><circle cx="158" cy="126" r="29" fill="#FFFFFF" stroke="#1F4E79" stroke-width="6" stroke-dasharray="11,8"/></svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg };
