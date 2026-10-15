'use strict';

// The same cycle in the same place on several slides (a question slide with
// stages or arrow words left blank, and its answers slide that writes them in)
// is one loop to the class, so it must not change size or move when the
// answers arrive. The loop is laid out round its words: an empty box asks for
// room to write in, and a stage's name takes the width it needs, so the
// answers slide drew the loop at a different size from the question.
//
// Before the slides are drawn, every cycle in a group is told the stages and
// arrow words of the others (`roomFor`), and each is laid out round the fuller
// of them. A group is cycles in the same slot of the same template and layout
// with the same number of stages, which agree wherever both name a stage or
// an arrow and share at least one: the question's "egg" and "chrysalis" are
// the answers slide's, so the two are one loop. Two different loops a lesson
// shows in the same place (the water cycle, then a butterfly) share nothing,
// and each is left exactly as it was.

const listOf = (spec) => (Array.isArray(spec.boxes) ? spec.boxes : Array.isArray(spec.stages) ? spec.stages : []);
const words = (raw) => {
  const text = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw.text : raw;
  return text == null || String(text).trim() === '' ? null : String(text).trim().toLowerCase();
};

// Whether two cycles are one loop: no stage or arrow they both fill differs,
// and at least one they both fill is the same.
function sameLoop(a, b) {
  const stagesA = listOf(a);
  const stagesB = listOf(b);
  if (stagesA.length !== stagesB.length || !stagesA.length) return false;
  let shared = 0;
  const pairs = [];
  for (let i = 0; i < stagesA.length; i += 1) {
    pairs.push([words(stagesA[i]), words(stagesB[i])]);
    pairs.push([words((a.arrows || [])[i]), words((b.arrows || [])[i])]);
  }
  for (const [x, y] of pairs) {
    if (x == null || y == null) continue;
    if (x !== y) return false;
    shared += 1;
  }
  return shared > 0;
}

function keepCyclesStill(lesson) {
  const groups = [];
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  slides.forEach((slide) => {
    (function walk(obj, slot) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.type === 'cycle') {
        const place = [slide && slide.template, typeof (slide && slide.layout) === 'string' ? slide.layout : '', slot].join('|');
        const group = groups.find((g) => g.place === place && g.members.every((m) => sameLoop(m, obj)));
        if (group) group.members.push(obj);
        else groups.push({ place, members: [obj] });
        return;
      }
      for (const k of Object.keys(obj)) walk(obj[k], `${slot}/${k}`);
    })(slide, '');
  });
  for (const { members } of groups) {
    if (members.length < 2) continue;
    const contents = members.map((m) => ({
      boxes: listOf(m), arrows: Array.isArray(m.arrows) ? m.arrows : [],
      ...(m.arrowLine === true ? { arrowLine: true } : {}), ...(m.labelLine === true ? { labelLine: true } : {}),
    }));
    if (new Set(contents.map((c) => JSON.stringify(c))).size < 2) continue;
    for (const member of members) member.roomFor = contents;
  }
  return lesson;
}

module.exports = { keepCyclesStill, sameLoop };
