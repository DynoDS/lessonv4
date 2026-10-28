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
 assert.equal(map.stickInSpec({map:'world-with-antarctica',presentation:'seven-continent-world',continentLabels:[{text:'Africa',at:[0.57,0.6]}]}).worksheetMode,'continents-and-oceans');
});
test('a journey map of named places with nothing shaded prints as the board drew it', () => {
 // Y4 Geography, 20 October 2026: pairs hold this map from the first stop and
 // trace the UK south to the Sahara and on to a "?" on the Equator. Forcing it
 // into the continent write-on task refused it, and the pack printed no map.
 const journey = {map:'world-with-antarctica',presentation:'seven-continent-world',showEquator:true,
  continentLabels:[{text:'Africa',at:[0.57,0.6]},{text:'Europe',at:[0.57,0.2]}],
  annotations:[{kind:'point',at:{lon:-1.5,lat:53},label:'The UK',colour:'blue'},
   {kind:'point',at:{lon:5,lat:23},label:'Sahara Desert',colour:'orange'},
   {kind:'point',at:{lon:20,lat:0},label:'?',colour:'green'}]};
 const d = map.stickInSpec(structuredClone(journey));
 assert.equal(d.worksheetMode, undefined);
 assert.deepEqual(d, journey);
 const drawn = map.tightSvg(d, profileFor('stickin', {widthMm:150}));
 assert(drawn.svg.includes('The UK')); assert(drawn.svg.includes('Sahara Desert')); assert(drawn.svg.includes('Equator'));
 assert.equal(drawn.layout.s.writeOnMarkers.length, 0);
 // On paper the stops print large enough to find (at the 9pt floor they could
 // not be seen); the board keeps its own floor, because bigger names there hid Africa.
 const sizes = (svg) => [...new Set([...svg.matchAll(/font-size="([\d.]+)"/g)].map(m => +m[1]))];
 assert(Math.min(...sizes(drawn.svg)) >= 14);
 const board = map.tightSvg(d, profileFor('slides', {widthMm:300}));
 assert.deepEqual(sizes(board.svg), [profileFor('slides', {widthMm:300}).minFontPt]);
 // A map that names places but sets clue letters for children to name is still the naming task.
 assert.equal(map.stickInSpec({...journey, clueMarkers:[{marker:'A',at:[0.2,0.3]}]}).worksheetMode, 'continents-and-oceans');
 assert.notEqual(map.cacheKey(task(),'stickin',{widthMm:150}),map.cacheKey(fixture,'stickin',{widthMm:150}));
});
