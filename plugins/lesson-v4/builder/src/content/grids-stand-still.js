'use strict';

// The same coordinate grid in the same place on several slides (a question
// slide and its answers, a translation told over two slides) is one grid to the
// class, so it must not change size or move when the answers arrive. The grid
// is cropped to what it carries, and a letter with its coordinates, or the
// words that count a path, can reach past the squared paper: an answers slide
// that writes "U (5, −3)" beside the edge drew the same grid a little smaller
// and further over than the question had.
//
// Before the slides are drawn, every grid in a group is told what each slide of
// its group plots (`roomFor`) and keeps the room the widest of them needs. A
// group is the same grid (its range, numbers and axis names) in the same slot
// of the same template and layout: the rule a shape and a fraction wall already
// follow (shapes-stand-still.js, walls-stand-still.js). A grid alone, or one in
// a different slot, is left exactly as it was.

const { FRAME_FIELDS, PLOTTED_FIELDS } = require('../../../shared/visuals/coordinate-grid-svg');

const frameKey = (grid) => JSON.stringify(FRAME_FIELDS.map((name) => (grid[name] === undefined ? null : grid[name])));
const plotted = (grid) => {
  const out = {};
  PLOTTED_FIELDS.forEach((name) => { if (grid[name] !== undefined) out[name] = grid[name]; });
  return out;
};

function keepGridsStill(lesson) {
  const groups = new Map();
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  slides.forEach((slide) => {
    (function walk(obj, slot) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.type === 'coordinate-grid') {
        const group = [
          frameKey(obj), slide && slide.template,
          typeof (slide && slide.layout) === 'string' ? slide.layout : '', slot,
        ].join('|');
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push(obj);
        return;
      }
      for (const k of Object.keys(obj)) walk(obj[k], `${slot}/${k}`);
    })(slide, '');
  });
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    const contents = new Map();
    members.forEach((member) => {
      const own = plotted(member);
      if (Object.keys(own).length) contents.set(JSON.stringify(own), own);
    });
    if (contents.size < 2) continue;
    for (const member of members) member.roomFor = [...contents.values()];
  }
  return lesson;
}

module.exports = { keepGridsStill };
