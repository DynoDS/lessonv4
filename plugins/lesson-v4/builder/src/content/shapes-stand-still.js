'use strict';

// The same shape in the same place on several slides (a question slide and its
// answers, one worked example told over two slides) is one shape to the class,
// so it must not change size or move when a side gains its length. The shape
// drawing fits the outline into the room left once its side lengths have
// theirs, so an answers slide that writes "8 cm" where the question wrote "C",
// or nothing, drew the same shape smaller and somewhere else (Year 5
// rectilinear shapes, 7 October 2026: 290px then 218px).
//
// Before the slides are drawn, every shape is told the longest length any
// slide of its group writes on each side (`roomFor`), and keeps that room. A
// group is the same outlines, in the same slot of the same template and
// layout: the rule a labelled photograph already follows (label-diagram.js,
// standStillGroups). A slide that gives the shape a different slot or a
// different amount of room places it afresh, and shares nothing.

const { textWidthEm } = require('../../../shared/text/comic-glyph-width');

function outlineKey(spec) {
  return JSON.stringify((spec.shapes || []).map((s) => [
    s && s.name, s && s.vertices, s && s.aspect, s && s.sides, Boolean(s && s.label),
  ]));
}

function keepShapesStill(lesson) {
  const groups = new Map();
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  slides.forEach((slide) => {
    (function walk(obj, slot) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.type === 'polygon' && Array.isArray(obj.shapes)) {
        const group = [
          outlineKey(obj), slide && slide.template,
          typeof (slide && slide.layout) === 'string' ? slide.layout : '', slot,
        ].join('|');
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push(obj);
      }
      for (const k of Object.keys(obj)) walk(obj[k], `${slot}/${k}`);
    })(slide, '');
  });
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    const count = members[0].shapes.length;
    for (let i = 0; i < count; i++) {
      const widest = [];
      for (const member of members) {
        const labels = (member.shapes[i] && member.shapes[i].sideLabels) || [];
        labels.forEach((text, side) => {
          const label = text == null ? '' : String(text);
          if (textWidthEm(label, true) > textWidthEm(widest[side] || '', true)) widest[side] = label;
        });
      }
      if (!widest.some(Boolean)) continue;
      const roomFor = Array.from(widest, (label) => label || '');
      for (const member of members) {
        if (member.shapes[i]) member.shapes[i].roomFor = roomFor;
      }
    }
  }
  return lesson;
}

module.exports = { keepShapesStill };
