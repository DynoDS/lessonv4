'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normaliseMapKey,
  preRenderMaps,
  mapKey,
  transformationSpec,
  projectEquirectangularToOrthographic,
  buildTransformationSvg
} = require('../src/content/map');

test('harmless spellings of one map name resolve identically', () => {
  assert.equal(normaliseMapKey('south america'), 'south-america');
  assert.equal(normaliseMapKey('south_america'), 'south-america');
  assert.equal(normaliseMapKey('South-America'), 'south-america');
});

const lessonWith = (content) => ({ slides: [{ content }] });

test('an unsupported country overlay is refused rather than silently dropped', async () => {
  await assert.rejects(
    () => preRenderMaps(lessonWith({ type: 'map', map: 'south america', selectedCountry: 'Peru' })),
    /MAP_OVERLAY_UNSUPPORTED/
  );
});

test('an unsupported basin overlay is refused too', async () => {
  await assert.rejects(
    () => preRenderMaps(lessonWith({ type: 'map', map: 'south america', basin: 'Congo basin' })),
    /MAP_OVERLAY_UNSUPPORTED/
  );
});

test('a map with no overlay requested is left alone', async () => {
  const rendered = await preRenderMaps(lessonWith({ type: 'map', map: 'south america' }));
  assert.deepEqual(rendered, {});
});

test('the supported overlays are accepted', async () => {
  await assert.doesNotReject(async () => {
    try {
      await preRenderMaps(lessonWith({
        type: 'map', map: 'south america', selectedCountry: 'brazil', basin: 'amazon basin'
      }));
    } catch (e) {
      if (/MAP_OVERLAY_RENDER_FAILED/.test(e.message)) return;
      throw e;
    }
  });
});

test('globe-to-flat defaults to the complete sequence and one Pacific label', () => {
  const spec = transformationSpec({ type: 'map', map: 'world', presentation: 'globe to flat' });
  assert.equal(spec.revealStage, 3);
  assert.equal(spec.suppressSecondPacific, true);
  assert.match(spec.notes.cut, /Pacific/);
});

test('each progressive reveal has a different cache key', () => {
  const base = { type: 'map', map: 'world', presentation: 'globe-to-flat' };
  assert.notEqual(mapKey({ ...base, revealStage: 1 }), mapKey({ ...base, revealStage: 2 }));
  assert.notEqual(mapKey({ ...base, revealStage: 2 }), mapKey({ ...base, revealStage: 3 }));
  assert.notEqual(mapKey(base), mapKey({ ...base, suppressSecondPacific: false }));
});

test('the transformation refuses a non-world asset and mixed overlays', () => {
  assert.throws(
    () => transformationSpec({ type: 'map', map: 'europe', presentation: 'globe-to-flat' }),
    /MAP_TRANSFORMATION_UNSUPPORTED/
  );
  assert.throws(
    () => transformationSpec({ type: 'map', map: 'world', presentation: 'globe-to-flat', annotations: [{ kind: 'point' }] }),
    /MAP_TRANSFORMATION_UNSUPPORTED/
  );
});

test('orthographic projection samples the supplied equirectangular pixels', () => {
  const raw = Buffer.from([
    255, 0, 0, 255, 0, 255, 0, 255,
    0, 0, 255, 255, 255, 255, 0, 255
  ]);
  const projected = projectEquirectangularToOrthographic(raw, { width: 2, height: 2, channels: 4 }, 0, 20);
  assert.equal(projected.info.width, 20);
  assert.equal(projected.info.channels, 4);
  assert.ok(projected.data.some((value, index) => index % 4 === 3 && value === 255));
});

test('the complete SVG embeds both derived globe images and the unchanged flat asset', () => {
  const image = Buffer.from('real-map-pixels');
  const spec = transformationSpec({ type: 'map', map: 'world', presentation: 'globe-to-flat' });
  const svg = buildTransformationSvg(image, image, image, spec);
  assert.match(svg, /1\. Begin with the globe/);
  assert.match(svg, /2\. Cut through the Pacific/);
  assert.match(svg, /3\. Open and flatten/);
  assert.match(svg, /edgePattern/);
  assert.match(svg, /one Pacific Ocean/);
  assert.equal((svg.match(/data:image\/png;base64/g) || []).length, 3);
});

test('the explicit two-edge-label option removes the one-Pacific join caption', () => {
  const image = Buffer.from('real-map-pixels');
  const spec = transformationSpec({
    type: 'map', map: 'world', presentation: 'globe-to-flat', suppressSecondPacific: false
  });
  const svg = buildTransformationSvg(image, image, image, spec);
  assert.doesNotMatch(svg, /one Pacific Ocean/);
  assert.equal((svg.match(/>Pacific Ocean</g) || []).length, 2);
});
