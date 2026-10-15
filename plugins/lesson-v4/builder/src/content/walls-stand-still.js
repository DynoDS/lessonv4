'use strict';

// The same fraction wall in the same place on several slides (a question slide
// and its answers, a model told over two slides) is one wall to the class, so
// it must not change size or move when the teacher's ruled line arrives. The
// line runs a little past the top and the foot of the wall, as a ruler line
// does, and takes that room from the rows, so a wall with a line drew smaller
// than the unmarked wall the slide before had shown.
//
// Before the slides are drawn, every wall in a group where any slide rules a
// line is told to keep the line's room (`roomFor: "line"`). A group is the
// same rows, in the same slot of the same template and layout: the rule a
// shape already follows (shapes-stand-still.js). Shading takes no room, so a
// wall that only gains shading never needed this. A wall alone, or one given
// a different slot, is left exactly as it was.

const hasLine = (wall) => {
  const line = wall.line != null ? wall.line : wall.lines;
  return line != null && line !== false && line !== '' && !(Array.isArray(line) && !line.length);
};

function keepWallsStill(lesson) {
  const groups = new Map();
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  slides.forEach((slide) => {
    (function walk(obj, slot) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.type === 'fraction-wall') {
        const group = [
          JSON.stringify(obj.fractions || null), slide && slide.template,
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
    if (members.length < 2 || !members.some(hasLine)) continue;
    for (const member of members) {
      if (!hasLine(member)) member.roomFor = 'line';
    }
  }
  return lesson;
}

module.exports = { keepWallsStill };
