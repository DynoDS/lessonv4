'use strict';

// The slide `timeline` helper: era bands on a line with dated ticks beneath.
//
// A Year 4 history deck (4 September 2026) rendered its "not-to-scale
// Victorian-to-today timeline" three times as a three-column `table` with
// "not to scale" as a column heading, because the slide engine had no
// timeline and the helper check recorded the table as covering it. These
// tests pin the layout the helper promises rather than the words it prints:
// every mark lands where the designer's fraction puts it, every label box
// sits inside the zone and clear of its neighbours, an edge label tucks
// inward from its tick, a word is never split, and a zone that cannot hold
// the figure is refused by name in the zone's own units.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawTimeline, measureTimeline, layoutTimeline } = require('../src/content/timeline');
const { textBoxWidthIn } = require('../src/glyph-width');

// Draw one timeline into one zone and capture every shape and text box.
function draw(zone, data) {
  const pptx = new PptxGenJS();
  const shapes = [];
  const texts = [];
  const slide = {
    addShape: (_kind, opts) => shapes.push(opts),
    addText: (value, opts) => texts.push({ value, ...opts }),
    addImage: () => {},
  };
  drawTimeline(pptx, slide, zone, data);
  return { shapes, texts };
}

// The full body-full zone of a 13.33 by 7.5 slide, roughly.
const BODY = { x: 0.33, y: 1.0, w: 12.67, h: 5.6 };
// A wide strip, the shape the catalogue calls the natural fit.
const STRIP = { x: 0.33, y: 1.0, w: 12.67, h: 2.0 };

const VICTORIAN = {
  type: 'timeline',
  eras: [{ label: 'Victorian period 1837 to 1901', from: 0.05, to: 0.62 }],
  marks: [
    { label: '1837', at: 0.05 },
    { label: 'Hampton timetable 1862', at: 0.27 },
    { label: 'Port Sunlight classroom April 1897', at: 0.55 },
    { label: 'today 2026', at: 0.97 },
  ],
  note: 'not to scale',
};

function inside(box, zone) {
  return box.x >= zone.x - 1e-6 && box.x + box.w <= zone.x + zone.w + 1e-6
    && box.y >= zone.y - 1e-6 && box.y + box.h <= zone.y + zone.h + 1e-6;
}

test('every mark sits at its own fraction of the line, and every box stays inside the zone', () => {
  const L = layoutTimeline(STRIP, VICTORIAN);
  L.marks.forEach((mark, i) => {
    const expected = L.lineX0 + mark.at * L.lineW;
    assert.ok(Math.abs(L.boxes[i].tickX - expected) < 1e-9, `mark ${i} tick at its fraction`);
  });
  const { shapes, texts } = draw(STRIP, VICTORIAN);
  for (const box of [...shapes, ...texts]) {
    assert.ok(inside(box, STRIP), `${JSON.stringify(box.value || 'shape')} inside the zone`);
  }
  // One era band, one line, two end caps, four ticks.
  assert.equal(shapes.length, 1 + 1 + 2 + 4);
});

test('neighbouring date labels never overlap, and the edge labels tuck inward from their ticks', () => {
  const L = layoutTimeline(STRIP, VICTORIAN);
  for (let i = 1; i < L.boxes.length; i += 1) {
    const prev = L.boxes[i - 1];
    const next = L.boxes[i];
    assert.ok(prev.x + prev.w <= next.x + 1e-6, `label ${i - 1} ends before label ${i} starts`);
  }
  // The first mark is at 0.05, within the edge band: its label starts at its
  // tick and reads rightward, so nothing hangs off the left of the figure.
  assert.equal(L.boxes[0].align, 'left');
  assert.ok(Math.abs(L.boxes[0].x - (L.boxes[0].tickX - 0.025)) < 1e-6);
  // The last mark is at 0.97: its label ends at its tick and reads leftward.
  const last = L.boxes[L.boxes.length - 1];
  assert.equal(last.align, 'right');
  assert.ok(Math.abs(last.x + last.w - (last.tickX + 0.025)) < 1e-6);
  // A middle mark is centred on its tick.
  assert.equal(L.boxes[1].align, 'center');
  assert.ok(Math.abs(L.boxes[1].x + L.boxes[1].w / 2 - L.boxes[1].tickX) < 1e-6);
});

test('labels share one size, never split a word, and take at most two lines', () => {
  const L = layoutTimeline(STRIP, VICTORIAN);
  const { texts } = draw(STRIP, VICTORIAN);
  const dateTexts = texts.filter((t) => VICTORIAN.marks.some((m) => m.label === t.value));
  assert.equal(dateTexts.length, 4);
  const sizes = new Set(dateTexts.map((t) => t.fontSize));
  assert.equal(sizes.size, 1, 'date labels share one font size');
  assert.ok(L.markFont >= 11 && L.markFont <= 18);
  // The widest single word of every label fits its box at the chosen size.
  VICTORIAN.marks.forEach((mark, i) => {
    const longest = mark.label.split(/\s+/).sort((a, b) => b.length - a.length)[0];
    assert.ok(textBoxWidthIn(longest, L.markFont, true) <= L.boxes[i].w + 1e-6, `"${longest}" fits its box`);
  });
  // The era label sits on one line at a size that fits its band.
  const era = texts.find((t) => t.value === VICTORIAN.eras[0].label);
  assert.ok(era, 'the era label is drawn');
  assert.ok(textBoxWidthIn(era.value, era.fontSize, true) <= era.w + 1e-6);
  // The note is small, grey and right-aligned; nothing prints when it is absent.
  const note = texts.find((t) => t.value === 'not to scale');
  assert.ok(note && note.align === 'right' && note.fontSize < era.fontSize);
  const without = draw(STRIP, { ...VICTORIAN, note: undefined });
  assert.equal(without.texts.some((t) => t.value === 'not to scale'), false);
});

test('a zone too narrow for a date label is refused by name, and the refusal says why', () => {
  const narrow = { x: 0.33, y: 1.0, w: 3.0, h: 2.0 };
  const marksOnly = { ...VICTORIAN, eras: [] };
  // Which label trips first depends on the spacing (here "1837" at the tucked
  // left end runs out of room before the long middle label does); what is
  // pinned is that the refusal names a date label, the room it had, and the
  // levers that move it.
  assert.throws(
    () => layoutTimeline(narrow, marksOnly),
    (error) => /^TIMELINE_ZONE_TOO_NARROW: the date label "[^"]+" has [\d.]+in between its neighbours/.test(error.message)
      && /space the marks further apart/.test(error.message)
  );
  // An era band too narrow for its own label is refused by name as well: a
  // band is never wrapped or squeezed below the floor.
  assert.throws(
    () => layoutTimeline(narrow, VICTORIAN),
    (error) => /^TIMELINE_ZONE_TOO_NARROW: the era "Victorian period 1837 to 1901"/.test(error.message)
      && /widen that era's from\/to span/.test(error.message)
  );
  // Two marks jammed together so one word cannot fit: the message names the
  // word. The first mark carries no label, so the second is the one judged.
  const jammed = {
    type: 'timeline',
    marks: [{ label: '', at: 0.5 }, { label: 'Portsmouth', at: 0.52 }],
  };
  assert.throws(
    () => layoutTimeline(BODY, jammed),
    (error) => /needs [\d.]+in for the word "Portsmouth"/.test(error.message)
  );
});

test('a zone too short for the figure is refused by name, in the zone\'s own units', () => {
  const shallow = { x: 0.33, y: 1.0, w: 12.67, h: 0.9 };
  assert.throws(
    () => layoutTimeline(shallow, VICTORIAN),
    (error) => /^TIMELINE_ZONE_TOO_SHORT: this timeline needs [\d.]+in of height/.test(error.message)
      && /the zone is 0\.90in tall/.test(error.message)
  );
  // The measure declines rather than throws, so a card is never drawn around
  // a figure the build is about to refuse.
  assert.equal(measureTimeline(shallow, VICTORIAN), null);
});

test('the card hugs the drawn figure, centred in a zone taller than it needs', () => {
  const rect = measureTimeline(BODY, VICTORIAN);
  assert.ok(rect, 'a measure is returned');
  assert.ok(inside(rect, BODY));
  assert.ok(rect.h < BODY.h - 1.0, 'the figure does not claim the whole tall zone');
  const centre = rect.y + rect.h / 2;
  assert.ok(Math.abs(centre - (BODY.y + BODY.h / 2)) < 0.01, 'the figure is centred');
  // In the strip it uses nearly everything it is given.
  const strip = measureTimeline(STRIP, VICTORIAN);
  assert.ok(strip.h > STRIP.h - 0.5);
});

test('a bare line still draws when there are neither eras nor marks', () => {
  const { shapes, texts } = draw(STRIP, { type: 'timeline' });
  assert.equal(shapes.length, 3, 'the line and its two end caps');
  assert.equal(texts.length, 0);
});
