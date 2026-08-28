'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const triangle = require('../../shared/visuals/triangle-svg');
const linePair = require('../../shared/visuals/line-pair-svg');
const angle = require('../../shared/visuals/angle-svg');
const tallyChart = require('../../shared/visuals/tally-chart-svg');
const coordinateGrid = require('../../shared/visuals/coordinate-grid-svg');
const venn = require('../../shared/visuals/venn-svg');
const carroll = require('../../shared/visuals/carroll-svg');
const reflectionGrid = require('../../shared/visuals/reflection-grid-svg');
const translationShape = require('../../shared/visuals/translation-shape-svg');
const labelDiagram = require('../../shared/visuals/label-diagram-svg');
const geoboard = require('../../shared/visuals/geoboard-svg');
const barModel = require('../../shared/visuals/bar-model-svg');
const numberlineCue = require('../../shared/visuals/numberline-cue-svg');
const turnCue = require('../../shared/visuals/turn-diagram-cue-svg');
const scaleCue = require('../../shared/visuals/scale-interval-cue-svg');
const pyramidCue = require('../../shared/visuals/pyramid-cue-svg');
const barChart = require('../../shared/visuals/bar-chart-svg');
const placeValue = require('../../shared/visuals/place-value-chart-svg');
const areaGridCue = require('../../shared/visuals/area-grid-cue-svg');
const partWholeCue = require('../../shared/visuals/part-whole-model-cue-svg');
const { PRIMITIVES, SUCCESS_CRITERIA_AUDIT } = require('../../shared/visual-parity');
const {
  SUCCESS_CRITERIA_HELPERS,
  SUCCESS_CRITERIA_HELPER_KEYS,
  getSuccessCriteriaHelper,
  isSuccessCriteriaHelperKey,
  buildSuccessCriteriaInline,
  fullSizeContentFor
} = require('../../shared/visuals/success-criteria-helper-catalogue');
const {
  preRenderSuccessCriteriaHelpers,
  requestedSuccessCriteriaHelpers
} = require('../src/success-criteria-helpers');
const {
  coordinateGridKey,
  preRenderCoordinateGrids
} = require('../src/content/coordinate-grid');
const {
  reflectionGridKey,
  preRenderReflectionGrids
} = require('../src/content/reflection-grid');
const { validateLesson } = require('../src/validate');

const EXPECTED_MODES = {
  'venn-overlap': 'SC-inline',
  'venn-outside': 'SC-inline',
  'carroll-one-box': 'SC-inline',
  'angle-arc': 'both',
  'dash-equal-sides': 'both',
  'reflect-across-line': 'both',
  'translate-shape': 'both',
  'label-with-leader': 'SC-inline',
  'arrow-parallels': 'both',
  'square-corner': 'both',
  'line-of-symmetry': 'both',
  'bar-model-parts': 'both',
  'bar-model-compare': 'both',
  'tally-five': 'SC-inline',
  'turn-clockwise': 'SC-inline',
  'turn-anticlockwise': 'SC-inline',
  'jump-right': 'SC-inline',
  'jump-left': 'SC-inline',
  'plot-grid': 'both',
  'join-in-order': 'SC-inline',
  'close-the-shape': 'SC-inline',
  'count-scale-intervals': 'SC-inline',
  'number-pyramid': 'SC-inline',
  'draw-bars': 'SC-inline',
  'one-per-column': 'SC-inline',
  'count-array': 'SC-inline',
  'part-whole': 'SC-inline'
};

test('shared catalogue marks all audited helpers by supported size', () => {
  assert.equal(SUCCESS_CRITERIA_HELPERS.length, 27);
  assert.equal(new Set(SUCCESS_CRITERIA_HELPER_KEYS).size, 27);
  assert.deepEqual(
    Object.fromEntries(SUCCESS_CRITERIA_HELPERS.map((entry) => [entry.key, entry.mode])),
    EXPECTED_MODES
  );
  SUCCESS_CRITERIA_HELPER_KEYS.forEach((key) => {
    assert.equal(isSuccessCriteriaHelperKey(key), true);
    const built = buildSuccessCriteriaInline(key);
    assert.ok(built && built.svg.includes('<svg'), key + ' did not build an inline SVG');
    assert.ok(built.aspect > 0, key + ' has no usable aspect ratio');
    assert.ok(built.w > 0 && built.h > 0, key + ' has no measured bounds');
    assert.ok(Math.abs(built.aspect - built.w / built.h) < 0.01, key + ' has inconsistent bounds');
  });
});

test('every visual primitive has an explicit Success Criteria audit decision', () => {
  assert.deepEqual(Object.keys(SUCCESS_CRITERIA_AUDIT).sort(), PRIMITIVES.map((primitive) => primitive.id).sort());
  for (const primitive of PRIMITIVES) {
    const decision = SUCCESS_CRITERIA_AUDIT[primitive.id];
    assert.match(decision.classification, /^(both|SC-inline|full-size|unsuitable)$/);
    assert.ok(decision.reason.length > 10);
  }
});

test('inline treatments come from the same shared geometry owner as their full-size visual', () => {
  assert.equal(buildSuccessCriteriaInline('venn-overlap').svg, venn.regionCueSvg({ region: 'overlap' }).svg);
  assert.equal(buildSuccessCriteriaInline('venn-outside').svg, venn.regionCueSvg({ region: 'outside' }).svg);
  assert.equal(buildSuccessCriteriaInline('carroll-one-box').svg, carroll.oneCellCueSvg({}).svg);
  assert.equal(
    buildSuccessCriteriaInline('angle-arc').svg,
    angle.tightSvg({ degrees: 60, successCriteriaInline: true }).svg
  );
  assert.equal(
    buildSuccessCriteriaInline('dash-equal-sides').svg,
    triangle.tightSvg({ kind: 'isosceles', successCriteriaInline: true }).svg
  );
  assert.equal(
    buildSuccessCriteriaInline('arrow-parallels').svg,
    linePair.tightSvg({ relationship: 'parallel', form: 'horizontal', notation: 'arrows' }).svg
  );
  assert.equal(
    buildSuccessCriteriaInline('square-corner').svg,
    linePair.tightSvg({ relationship: 'perpendicular', form: 'L', notation: 'right-angle' }).svg
  );
  assert.equal(
    buildSuccessCriteriaInline('plot-grid').svg,
    coordinateGrid.tightSvg({ cols: 3, rows: 3, numbers: false, route: [2, 2] }).svg
  );
  assert.equal(
    buildSuccessCriteriaInline('tally-five').svg,
    tallyChart.tallyMarksSvg({ count: 5 }).svg
  );
  assert.equal(buildSuccessCriteriaInline('reflect-across-line').svg, reflectionGrid.reflectionCueSvg({}).svg);
  assert.equal(buildSuccessCriteriaInline('translate-shape').svg, translationShape.translationCueSvg({}).svg);
  assert.equal(buildSuccessCriteriaInline('label-with-leader').svg, labelDiagram.leaderCueSvg({}).svg);
  assert.equal(buildSuccessCriteriaInline('line-of-symmetry').svg, geoboard.symmetryCueSvg({}).svg);
  assert.equal(buildSuccessCriteriaInline('bar-model-compare').svg, barModel.comparisonCueSvg({}).svg);
  assert.equal(buildSuccessCriteriaInline('jump-right').svg, numberlineCue.tightSvg({ direction: 'right' }).svg);
  assert.equal(buildSuccessCriteriaInline('turn-anticlockwise').svg, turnCue.tightSvg({ direction: 'anticlockwise' }).svg);
  assert.equal(buildSuccessCriteriaInline('count-scale-intervals').svg, scaleCue.tightSvg({}).svg);
  assert.equal(buildSuccessCriteriaInline('number-pyramid').svg, pyramidCue.tightSvg({}).svg);
  assert.equal(buildSuccessCriteriaInline('draw-bars').svg, barChart.barsCueSvg({}).svg);
  assert.equal(buildSuccessCriteriaInline('one-per-column').svg, placeValue.onePerColumnCueSvg({}).svg);
  assert.equal(buildSuccessCriteriaInline('count-array').svg, areaGridCue.tightSvg({}).svg);
  assert.equal(buildSuccessCriteriaInline('part-whole').svg, partWholeCue.tightSvg({}).svg);
  assert.equal(getSuccessCriteriaHelper('angle-arc').geometrySource, 'shared/visuals/angle-svg.js');
  assert.equal(getSuccessCriteriaHelper('tally-five').geometrySource, 'shared/visuals/tally-chart-svg.js');
  assert.deepEqual(fullSizeContentFor('angle-arc'), { type: 'angle', degrees: 60 });
  assert.deepEqual(fullSizeContentFor('dash-equal-sides'), { type: 'triangle', kind: 'isosceles' });
  assert.equal(fullSizeContentFor('tally-five'), null);
  assert.equal(fullSizeContentFor('join-in-order'), null);
  assert.equal(fullSizeContentFor('close-the-shape'), null);
  SUCCESS_CRITERIA_HELPERS.forEach((entry) => {
    assert.equal(fullSizeContentFor(entry.key) !== null, entry.mode === 'both', entry.key);
  });
});

test('pre-render discovery accepts the new helper field and legacy figure field', () => {
  const lesson = {
    slides: [
      { criteria: { type: 'steps', steps: [
        { text: 'Dash the equal sides.', figure: 'dash-equal-sides' },
        { text: 'Mark the square corner.', helper: 'square-corner' }
      ] } },
      { template: 'teach-steps', steps: [
        { text: 'Plot across, then up.', helper: 'plot-grid' }
      ] }
    ]
  };
  assert.deepEqual(
    requestedSuccessCriteriaHelpers(lesson).sort(),
    ['dash-equal-sides', 'plot-grid', 'square-corner']
  );
});

test('ordinary wording stays text-only and never acquires a helper by inference', () => {
  const lesson = {
    lessonName: 'Plain success criteria',
    slides: [{
      template: 'maths-turn-sc',
      criteria: { type: 'steps', steps: [
        'Dash the equal sides.',
        'Check each label.'
      ] }
    }]
  };
  assert.deepEqual(requestedSuccessCriteriaHelpers(lesson), []);
  assert.deepEqual(validateLesson(lesson, path.join(__dirname, 'no-photos-here')).errors, []);
});

test('discovery pre-renders only explicitly requested Success Criteria Helpers', async () => {
  const lesson = {
    slides: [{ criteria: { type: 'steps', steps: [
      { text: 'Mark the angle with an arc.', helper: 'angle-arc' },
      'Count each mark once.',
      { text: 'Draw the fifth tally across the group.', helper: 'tally-five' }
    ] } }]
  };
  const images = await preRenderSuccessCriteriaHelpers(lesson);
  assert.deepEqual(Object.keys(images).sort(), ['angle-arc', 'tally-five']);
  Object.values(images).forEach((entry) => {
    assert.ok(Buffer.isBuffer(entry.png) && entry.png.length > 0);
    assert.ok(entry.aspect > 0);
  });
});

test('full-size coordinate grids pre-render from the same shared route geometry', async () => {
  const spec = { type: 'coordinate-grid', max: 4, route: [2, 3] };
  assert.equal(coordinateGridKey(spec), coordinateGrid.cacheKey(spec));
  const images = await preRenderCoordinateGrids({ slides: [{ questionVisual: spec }] });
  const entry = images[coordinateGridKey(spec)];
  assert.ok(entry && Buffer.isBuffer(entry.png) && entry.png.length > 0);
  assert.equal(entry.aspect, coordinateGrid.tightSvg(spec).aspect);
});

test('full-size reflection grids pre-render from the same shared geometry as their inline helper', async () => {
  const spec = { type: 'reflection-grid', cols: 4, rows: 3, mirror: { orientation: 'vertical', at: 2 }, shape: [[0, 0], [1, 0], [1, 1]], showReflection: true };
  assert.equal(reflectionGridKey(spec), reflectionGrid.cacheKey(spec));
  const images = await preRenderReflectionGrids({ slides: [{ questionVisual: spec }] });
  const entry = images[reflectionGridKey(spec)];
  assert.ok(entry && Buffer.isBuffer(entry.png) && entry.png.length > 0);
  assert.equal(entry.aspect, reflectionGrid.tightSvg(spec).aspect);
});

test('lesson validation keeps legacy JSON working and rejects invented helpers', () => {
  const legacy = {
    lessonName: 'Success Criteria Helper validation',
    slides: [{
      template: 'maths-turn-sc',
      criteria: { type: 'steps', steps: [
        { text: 'Dash the equal sides.', figure: 'dash-equal-sides' }
      ] }
    }]
  };
  const legacyResult = validateLesson(legacy, path.join(__dirname, 'no-photos-here'));
  assert.deepEqual(legacyResult.errors, []);

  const bad = {
    lessonName: 'Bad Success Criteria Helper',
    slides: [{
      template: 'maths-turn-sc',
      criteria: { type: 'steps', steps: [
        { helper: 'sparkly-triangle' }
      ] }
    }]
  };
  const result = validateLesson(bad, path.join(__dirname, 'no-photos-here'));
  assert.equal(result.errors.length, 2);
  assert.match(result.errors[0], /no readable "text"/);
  assert.match(result.errors[1], /unknown Success Criteria Helper/);
});

test('new helper field works and conflicting legacy/new fields fail clearly', () => {
  const valid = {
    lessonName: 'New Success Criteria Helper request',
    slides: [{
      template: 'maths-turn-sc',
      criteria: { type: 'steps', steps: [
        { text: 'Draw the fifth tally across the group.', helper: 'tally-five' },
        'Count each mark once.'
      ] }
    }]
  };
  assert.deepEqual(validateLesson(valid, path.join(__dirname, 'no-photos-here')).errors, []);

  const conflicting = structuredClone(valid);
  conflicting.slides[0].criteria.steps[0].figure = 'angle-arc';
  const result = validateLesson(conflicting, path.join(__dirname, 'no-photos-here'));
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /two different Success Criteria Helpers/);
});
