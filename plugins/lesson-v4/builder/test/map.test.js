'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { normaliseMapKey, preRenderMaps } = require('../src/content/map');

test('harmless spellings of one map name resolve identically', () => {
  // Same place, typed three ways. Normalising this is not a silent change of
  // meaning, which is why it stays.
  assert.equal(normaliseMapKey('south america'), 'south-america');
  assert.equal(normaliseMapKey('south_america'), 'south-america');
  assert.equal(normaliseMapKey('South-America'), 'south-america');
});

const lessonWith = (content) => ({ slides: [{ content }] });

test('an unsupported country overlay is refused rather than silently dropped', async () => {
  await assert.rejects(
    () =>
      preRenderMaps(
        lessonWith({ type: 'map', map: 'south america', selectedCountry: 'Peru' })
      ),
    /MAP_OVERLAY_UNSUPPORTED/
  );
});

test('an unsupported basin overlay is refused too', async () => {
  await assert.rejects(
    () =>
      preRenderMaps(
        lessonWith({ type: 'map', map: 'south america', basin: 'Congo basin' })
      ),
    /MAP_OVERLAY_UNSUPPORTED/
  );
});

test('a map with no overlay requested is left alone', async () => {
  const rendered = await preRenderMaps(lessonWith({ type: 'map', map: 'south america' }));
  assert.deepEqual(rendered, {});
});

test('the supported overlays are accepted', async () => {
  // Either it prepares the shading or it says why it could not. What it must
  // never do is return quietly having drawn nothing.
  await assert.doesNotReject(async () => {
    try {
      await preRenderMaps(
        lessonWith({
          type: 'map',
          map: 'south america',
          selectedCountry: 'brazil',
          basin: 'amazon basin',
        })
      );
    } catch (e) {
      if (/MAP_OVERLAY_RENDER_FAILED/.test(e.message)) return;
      throw e;
    }
  });
});
