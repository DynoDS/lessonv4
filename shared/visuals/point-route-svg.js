'use strict';

// Shared tiny route geometry for Success Criteria Helpers whose only useful
// form is inline: joining points in order and closing a shape. These are not
// promoted into full-size content helpers because a real teaching diagram
// should use coordinate-grid or geoboard instead. The catalogue records that
// boundary; this module owns the deliberately simplified marks.

const INK = '#1A1A1A';
const BLUE = '#0070C0';
const RED = '#C00000';

function wrap(w, h, parts, defs) {
  return {
    svg: `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs || ''}${parts.join('')}</svg>`,
    aspect: w / h,
    w,
    h
  };
}

function markerDefs() {
  return '<defs><marker id="route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#0070C0"/></marker></defs>';
}

function joinInOrderSvg() {
  const points = [
    { x: 17, y: 72, n: 1 },
    { x: 57, y: 22, n: 2 },
    { x: 105, y: 66, n: 3 }
  ];
  const parts = [
    '<path d="M 17 72 L 57 22 L 105 66" fill="none" stroke="#0070C0" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" marker-mid="url(#route-arrow)" marker-end="url(#route-arrow)"/>'
  ];
  points.forEach(function (p) {
    parts.push(`<circle cx="${p.x}" cy="${p.y}" r="7" fill="${RED}"/>`);
    parts.push(`<text x="${p.x}" y="${p.y - 12}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${INK}">${p.n}</text>`);
  });
  return wrap(122, 92, parts, markerDefs());
}

function closeShapeSvg() {
  const parts = [
    '<path d="M 18 72 L 57 18 L 108 67" fill="none" stroke="#1A1A1A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
    '<path d="M 108 67 L 18 72" fill="none" stroke="#0070C0" stroke-width="7" stroke-linecap="round" marker-end="url(#route-arrow)"/>',
    `<circle cx="18" cy="72" r="7" fill="${RED}"/>`,
    `<circle cx="57" cy="18" r="7" fill="${RED}"/>`,
    `<circle cx="108" cy="67" r="7" fill="${RED}"/>`
  ];
  return wrap(126, 90, parts, markerDefs());
}

function tightSvg(data) {
  const mode = String((data && data.mode) || 'join-in-order');
  return mode === 'close-the-shape' ? closeShapeSvg() : joinInOrderSvg();
}

module.exports = { tightSvg };
