'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const map = require('../../shared/visuals/map-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');
const { VISUALS } = require('../../stick-in-sheets-html/src/visual-registry');
const fixture = require('./map-world-sites.fixture.json');
const task = () => VISUALS.map.specFn(structuredClone(fixture));
test('copied E/F map retains evidence through the real stick-in adapter', () => {
 const d = task();
 assert.equal(d.worksheetMode, 'world-sites');
 assert.deepEqual(d.annotations, fixture.annotations);
 assert.deepEqual(d.key, fixture.key);
 const s = map.resolve(d), original = map.resolve(fixture);
 assert.equal(s.mode, 'world'); assert.equal(s.key, 'world-with-antarctica');
 assert.deepEqual(s.annotations, original.annotations);
 assert.deepEqual(s.mapKeyEntries, original.mapKeyEntries);
 assert(s.showEquator); assert.equal(s.writeOnMarkers.length, 0);
 const points = s.annotations.filter(a => a.kind === 'point');
 assert.deepEqual(points.map(a => a.label), ['E','F']);
 assert.equal(points[0].at[1], points[1].at[1]);
 assert(Math.abs(points[0].at[0] - 203 / 360) < 1e-9);
 assert(Math.abs(points[1].at[0] - 217 / 360) < 1e-9);
 assert(Math.abs(points[0].at[1] - 91 / 180) < 1e-9);
 assert.equal(points[0].colour, points[1].colour);
});
test('all surfaces retain source geometry and measured labels; paper leaves pencil room', () => {
 for (const surface of ['slides','worksheets','wall','stickin']) {
  const p = profileFor(surface, { widthMm: surface === 'slides' || surface === 'wall' ? 300 : 150 });
  const drawn = map.tightSvg(task(), p);
  assert(drawn.svg.includes('Equator')); assert(drawn.svg.includes('Tropical rainforest'));
  assert(drawn.svg.includes('>E<')); assert(drawn.svg.includes('>F<'));
  assert(drawn.svg.includes('data:image/png;base64,'));
  assert(drawn.layout.map.w * 14 / 360 >= 5 * 72 / 25.4);
  assert.equal(drawn.layout.s.writeOnMarkers.length, 0);
 }
 assert.throws(() => map.tightSvg(task(), profileFor('stickin', {widthMm:90})), /TOO_SMALL|TOO_NARROW|DO_NOT_FIT/);
});
test('response strokes refuse, and point styling cannot select a correct site', () => {
 const d = task(); d.annotations.find(a => a.label === 'E').colour = 'orange';
 const points = map.resolve(d).annotations.filter(a => a.kind === 'point');
 assert.equal(points[0].colour, points[1].colour);
 assert.throws(() => map.resolve({...task(), annotations:[...fixture.annotations,{kind:'line',points:[[0,0],[1,1]]}]}), /WORLD_SITES_INVALID/);
});
test('regional and continent naming routes are preserved', () => {
 // A regional map keeps the shading and names the child reads the answer from;
 // only a lesson that asks for regional-marking gets the shading removed.
 const regionalTask = {map:'south-america',presentation:'regional-layers',regionLayers:['Amazon rainforest']};
 assert.deepEqual(map.stickInSpec(regionalTask), regionalTask);
 assert.equal(map.stickInSpec({...regionalTask,worksheetMode:'regional-marking'}).worksheetMode,'regional-marking');
 assert.equal(map.stickInSpec({map:'world-with-antarctica'}).worksheetMode,'continents-and-oceans');
 assert.notEqual(map.cacheKey(task(),'stickin',{widthMm:150}),map.cacheKey(fixture,'stickin',{widthMm:150}));
});
