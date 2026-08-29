'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const shared = require('../../shared/visuals/world-geography-map-svg');
const { VISUALS } = require('../../stick-in-sheets-html/src/visual-registry');

test('continent retrieval is north-up, has all seven shapes and never prints an answer', () => {
  const { svg } = shared.tightSvg({ configuration: 'continent-retrieval', labels: true });
  assert.equal(shared.CONTINENTS.length, 7);
  for (const name of ['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Oceania', 'Antarctica']) {
    assert.doesNotMatch(svg, new RegExp('>' + name + '<'));
  }
  assert.equal((svg.match(/stroke-dasharray="8 6"/g) || []).length, 7, 'one blank ruled space per continent');
  const byKey = Object.fromEntries(shared.CONTINENTS.map(c => [c.key, c.anchor]));
  assert.ok(byKey['north-america'][1] > byKey['south-america'][1]);
  assert.ok(byKey.europe[1] > byKey.africa[1]);
  assert.ok(byKey.asia[1] > byKey.oceania[1]);
  assert.ok(byKey.antarctica[1] < -70);
});

test('every retrieval writing space stays inside the tight map and clears every other space', () => {
  const layout = shared.describeLayout({ configuration: 'continent-retrieval' });
  for (const item of layout.labels) {
    const b = item.box;
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= layout.width && b.y + b.h <= layout.height, item.key + ' leaves the map');
    assert.equal(item.text, '');
  }
  for (let i = 0; i < layout.labels.length; i += 1) {
    for (let j = i + 1; j < layout.labels.length; j += 1) {
      const a = layout.labels[i].box;
      const b = layout.labels[j].box;
      const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
      assert.ok(apart, layout.labels[i].key + ' overlaps ' + layout.labels[j].key);
    }
  }
});

test('the biome configuration uses an exact matching four-part key and examples across continents', () => {
  const { svg } = shared.tightSvg({ configuration: 'biome-examples', labels: true });
  assert.deepEqual(shared.BIOMES.map(b => b.label), ['Tropical forest', 'Desert', 'Savannah', 'Tundra']);
  for (const label of shared.BIOMES.map(b => b.label)) assert.match(svg, new RegExp('>' + label + '<'));
  for (const pattern of ['tropicalForest', 'desert', 'savannah', 'tundra']) {
    assert.ok((svg.match(new RegExp('url\\(#' + pattern + '\\)', 'g')) || []).length > 1, pattern + ' has no mapped examples');
  }
});

test('rainforest pattern marks five world regions, shows all three latitude lines and does not flood the Tropics', () => {
  const { svg } = shared.tightSvg({ configuration: 'rainforest-pattern' });
  for (const label of ['Tropic of Cancer', 'Equator', 'Tropic of Capricorn', 'Tropical rainforest']) {
    assert.match(svg, new RegExp(label));
  }
  // Seven separate patches cover Central America, Amazonia, Africa, Asia and
  // Oceania. They are discrete land patches, not a filled tropical belt.
  assert.equal((svg.match(/fill="url\(#tropicalForest\)" stroke="#FFFFFF"/g) || []).length, 7);
  assert.doesNotMatch(svg, /<rect[^>]+fill="url\(#tropicalForest\)"[^>]+width="1184/);
});

test('South America can be highlighted without filling any retrieval answer', () => {
  const { svg } = shared.tightSvg({ configuration: 'continent-retrieval', highlightSouthAmerica: true });
  assert.match(svg, /<ellipse[^>]+stroke="#E46C0A"[^>]+stroke-dasharray="18 10"/);
  assert.doesNotMatch(svg, />South America</);
});

test('the stick-in route always produces the blank child task', () => {
  const entry = VISUALS['world-geography-map'];
  assert.ok(entry);
  const spec = entry.specFn({ configuration: 'rainforest-pattern', labels: true, highlightSouthAmerica: true });
  assert.deepEqual(spec, {
    configuration: 'continent-retrieval', labels: false, highlightSouthAmerica: false
  });
  const { svg } = entry.tightSvg(spec);
  assert.doesNotMatch(svg, /Tropical rainforest|Equator|South America/);
  assert.equal((svg.match(/stroke-dasharray="8 6"/g) || []).length, 7);
});

test('unknown configurations fail by name instead of silently drawing the wrong map', () => {
  assert.throws(
    () => shared.tightSvg({ configuration: 'world' }),
    /WORLD_GEOGRAPHY_MAP_CONFIGURATION_UNSUPPORTED/
  );
});
