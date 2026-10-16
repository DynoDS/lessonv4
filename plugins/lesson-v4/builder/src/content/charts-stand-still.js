'use strict';

// A column sum whose answer is words ("no exchange" under a sum where no
// column needs one) carries them as its caption, and a caption takes height
// from the chart above it. Left alone, that one chart drew smaller than the
// two beside it, and smaller than itself on the question slide before, so the
// answer slide jumped. An answer that is "nothing needs doing" is still an
// answer and is shown (Year 4 maths lesson 30, slide 13, 16 October 2026: the
// first of three sums showed nothing at all where the task said "write no
// exchange").
//
// Before the slides are drawn, every chart sharing a row with a captioned
// chart, and every showing of the same sum in the same unit (the question slide
// and its answers), is given an empty caption, which keeps the same room (the
// chart's caption is `steady`, shared-figure.js). So the charts stay one size
// across the row and across the two slides. Nothing changes for a deck with
// no chart captions.

function sumKey(chart) {
  const calc = chart.calculation;
  if (!calc || typeof calc !== 'object') return null;
  return JSON.stringify([chart.columns, calc.operator, calc.numbers]);
}

function captioned(chart) {
  return chart.label != null && String(chart.label) !== '';
}

function keepChartsStill(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const charts = [];
  const rows = [];
  slides.forEach((slide) => {
    const unit = slide && typeof slide.designUnitId === 'string' ? slide.designUnitId : '';
    (function walk(obj) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.type === 'row' && Array.isArray(obj.items)) {
        rows.push(obj.items.filter((it) => it && it.type === 'place-value-chart'));
      }
      if (obj.type === 'place-value-chart') {
        const key = sumKey(obj);
        if (key) charts.push({ chart: obj, group: `${unit}|${key}` });
      }
      for (const k of Object.keys(obj)) walk(obj[k]);
    })(slide);
  });
  const held = new Set();
  charts.forEach(({ chart, group }) => { if (captioned(chart)) held.add(group); });
  charts.forEach(({ chart, group }) => {
    if (held.has(group) && chart.label == null) chart.label = '';
  });
  rows.forEach((row) => {
    if (row.some((chart) => chart.label != null)) {
      row.forEach((chart) => { if (chart.label == null) chart.label = ''; });
    }
  });
  return lesson;
}

module.exports = { keepChartsStill };
