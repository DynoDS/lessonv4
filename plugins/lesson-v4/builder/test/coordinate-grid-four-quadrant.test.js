'use strict';

// The four-quadrant coordinate grid reaches the board.
//
// Until 7 October 2026 every grid the board could draw started both axes at
// zero, so a Year 6 lesson on translating shapes in four quadrants had no grid
// to plot (−4, 3) on. The shared drawing was grown (shared/visuals/
// coordinate-grid-svg.js; its own layout is held in shared/test/
// coordinate-grid-svg.test.js). These hold that the board draws the grown
// grid: that a question slide and its answer slide are two pictures rather than
// one cached one, that the real build script places every form of it, and that
// its numbers are sized for the board (they printed at 8 to 9pt on that lesson,
// because the grid was drawn small and stretched).

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const coordinateGrid = require('../../shared/visuals/coordinate-grid-svg');
const sharedFigure = require('../src/content/shared-figure');
const { PROFILES } = require('../../shared/visuals/surface-profiles');

// A full slide body, and the half of one a grid gets beside its question.
const FULL_ZONE = { x: 0.5, y: 1.4, w: 12.3, h: 5.4 };
const HALF_ZONE = { x: 0.5, y: 1.4, w: 6, h: 5.4 };
const place = (spec, zone) => sharedFigure.build('coordinate-grid', zone || FULL_ZONE, spec);

const ROOT = path.join(__dirname, '..');
const FOUR = { type: 'coordinate-grid', min: -5, max: 5 };
const TRIANGLE = { points: [[1, 2], [4, 2], [1, 5]], labels: ['A', 'B', 'C'], translate: { dx: -6, dy: -4 } };
const QUESTION = { ...FOUR, shapes: [{ ...TRIANGLE, showImage: false }] };
const ANSWER = { ...FOUR, shapes: [{ ...TRIANGLE, showImage: true }] };

const GRIDS = {
  'Axes named': { type: 'coordinate-grid', min: -3, max: 3, numbers: false, axisLabels: { x: 'x-axis', y: 'y-axis' } },
  'Quadrants': { type: 'coordinate-grid', min: -3, max: 3, numbers: false, tintQuadrants: true, highlight: 'top left' },
  'Past zero': { ...FOUR, numbers: 'positive', points: [{ x: 0, y: 4, label: 'J' }, { x: -4, y: 0, label: 'K' }, { x: 0, y: -4, label: 'L' }, { x: 4, y: 0, label: 'M' }] },
  'Blank grid': FOUR,
  'Plotted rectangle': { ...FOUR, pointStyle: 'cross', join: true, points: [{ x: 4, y: 3, label: 'A' }, { x: -4, y: 3, label: 'B' }, { x: -4, y: -3, label: 'C' }, { x: 4, y: -3, label: 'D' }] },
  'Loose points beside a shape': { ...FOUR, pointStyle: 'cross', points: [{ x: -3, y: 5, label: 'T', coords: true }, { x: 5, y: -3, label: 'U', coords: true }], shapes: [{ points: [[2, 3], [-4, 3], [-5, -2], [4, -2]], labels: ['P', 'Q', 'R', 'S'] }] },
  'Translate the triangle': QUESTION,
  'The triangle translated': ANSWER,
  'Which translation': { ...FOUR, shapes: [{ points: [[-5, 1], [-2, 1], [-5, 4]], inside: '1' }, { points: [[1, -4], [4, -4], [1, -1]], inside: '2' }], arrows: [{ from: [-5, 1], to: [1, -4], steps: true, count: true }] }
};

test('a question grid and its answer grid are two pictures, placed by the one shared placer', () => {
  assert.equal(sharedFigure.FIGURES['coordinate-grid'].module, coordinateGrid);
  assert.notEqual(place(QUESTION).key, place(ANSWER).key);
  assert.notEqual(place(FOUR).key, place({ type: 'coordinate-grid', max: 5 }).key);
  // The same grid in a different zone is a different picture: its words are sized for the zone.
  assert.notEqual(place(FOUR).key, place(FOUR, HALF_ZONE).key);
  [QUESTION, ANSWER, FOUR].forEach((spec) => {
    const { built, box } = place(spec);
    assert.ok(built.w / 72 <= box.w + 1e-6 && built.h / 72 <= box.h + 1e-6, 'the grid is larger than its zone');
    assert.ok(built.h / 72 >= box.h - 1e-6 || built.w / 72 >= box.w - 1e-6, 'the grid does not fill its zone');
  });
});

test('the axis numbers are sized for the board, and a question and its answer carry the same size', () => {
  const profile = (zone) => ({ ...PROFILES.slides, widthPt: (zone.w - 0.2) * 72, heightPt: (zone.h - 0.2) * 72 });
  const full = coordinateGrid.describeLayout(FOUR, profile(FULL_ZONE));
  // Ten squares each way in a full slide body: a fixed third of a square was about 11pt here.
  assert.ok(full.numberPt >= 16, `the numbers print at ${full.numberPt.toFixed(1)}pt on a full slide`);
  assert.ok(full.letterPt >= PROFILES.slides.minFontPt, `the letters print at ${full.letterPt.toFixed(1)}pt`);
  const question = coordinateGrid.describeLayout(QUESTION, profile(FULL_ZONE));
  const answer = coordinateGrid.describeLayout(ANSWER, profile(FULL_ZONE));
  assert.equal(question.textScale, answer.textScale);
  // A grid with few squares already has room: its numbers stop at the size the board asks for.
  const small = coordinateGrid.describeLayout({ max: 5 }, profile(FULL_ZONE));
  assert.ok(Math.abs(small.numberPt - PROFILES.slides.fontPt) < 0.6, `a five-square grid prints its numbers at ${small.numberPt.toFixed(1)}pt`);
});

test('every form of the four-quadrant grid builds on a slide', { timeout: 300000 }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'four-quadrant-grid-'));
  const titles = Object.keys(GRIDS);
  const lesson = {
    lessonName: 'Four-quadrant grid', yearGroup: 'Year 6', subject: 'Maths', lo: 'Translate shapes in four quadrants',
    slides: titles.map((title) => ({ template: 'body-full', headerStyle: 'title', title, body: GRIDS[title] }))
  };
  const lessonPath = path.join(dir, 'lesson.json');
  fs.writeFileSync(lessonPath, JSON.stringify(lesson));
  const run = spawnSync(process.execPath, [path.join(ROOT, 'build.js'), lessonPath, dir, '--skip-optional-decorations'],
    { encoding: 'utf8' });
  const out = `${run.stdout || ''}${run.stderr || ''}`;
  const faults = out.split('\n').filter((line) => /✗|BUILD_DIAGNOSTIC/.test(line)).map((line) => line.trim().slice(0, 200));
  assert.equal(run.status, 0, `the four-quadrant grid slides did not build:\n${faults.join('\n') || out.slice(-600)}`);
  assert.ok(fs.readdirSync(dir).some((name) => name.endsWith('.pptx')), 'the build wrote no deck');
});

test('a point the grid does not reach stops the build by name, not with a point in the margin', () => {
  assert.throws(
    () => place({ type: 'coordinate-grid', max: 5, points: [{ x: -4, y: 3, label: 'B' }] }),
    /COORDINATE_GRID_POINT_OFF_GRID/
  );
});
