'use strict';

// Required placeholders are composition evidence, never a delivered photograph.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { runSlideDesignCheck } = require('../scripts/check-slide-design');
const { drawImage, clearMissingPictures, missingPictureFindings } = require('../src/content/image');
const { rebuildWithoutOptionalDecorations } = require('../src/decorations');
const PptxGenJS = require('../src/require-global')('pptxgenjs');
const ROOT = path.resolve(__dirname, '..');

function fixture(t, essential) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'required-picture-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const image = { type: 'image', imagePath: path.join(dir, 'not-sourced.png') };
  if (essential !== undefined) image.essential = essential;
  const spec = { lessonName: 'Required picture', yearGroup: 'Year 4', subject: 'Science',
    lo: 'Name the appliance.', slides: [{ template: 'body-full', headerStyle: 'title', title: 'An appliance', body: image }] };
  const specPath = path.join(dir, 'lesson.json');
  fs.writeFileSync(specPath, JSON.stringify(spec));
  return { dir, specPath, image, spec };
}
function build(f, args = []) {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'build.js'), f.specPath, f.dir, ...args], { encoding: 'utf8' });
  return { ...result, log: (result.stdout || '') + (result.stderr || '') };
}

for (const essential of [undefined, true]) {
  test(`a missing required image (${essential}) blocks final publication and preserves the old deck`, (t) => {
    const f = fixture(t, essential);
    const deck = path.join(f.dir, 'Required picture.pptx');
    const previous = Buffer.from('previous verified deck');
    fs.writeFileSync(deck, previous);
    const result = build(f);
    assert.notEqual(result.status, 0, result.log);
    assert.match(result.log, /SLIDE_PICTURE_MISSING/);
    assert.match(result.log, /slide 1/);
    assert.match(result.log, /not-sourced\.png/);
    assert.doesNotMatch(result.stdout, /^Wrote:/m);
    assert.deepEqual(fs.readFileSync(deck), previous);
    assert.equal(fs.readdirSync(f.dir).filter(n => n.includes('.building-')).length, 0);
  });
}

test('an explicitly optional missing image still permits the final build', (t) => {
  const f = fixture(t, false);
  const result = build(f);
  assert.equal(result.status, 0, result.log);
  assert.match(result.stdout, /^Wrote:/m);
  assert.doesNotMatch(result.log, /SLIDE_PICTURE_MISSING/);
});

test('the actual composition checker retains a required placeholder in its private preview', (t) => {
  const f = fixture(t);
  const result = runSlideDesignCheck(f.specPath, { retainPreview: true });
  if (result.previewDir) t.after(() => fs.rmSync(result.previewDir, { recursive: true, force: true }));
  assert.equal(result.ok, true, result.stdout + result.stderr);
  assert.ok(result.previewOutputPath && fs.existsSync(result.previewOutputPath));
  assert.notEqual(path.dirname(result.previewOutputPath), f.dir);
  assert.equal(fs.existsSync(path.join(f.dir, 'Required picture.pptx')), false);
  // The successful preview must not authorise a later production build.
  assert.notEqual(build(f).status, 0);
});

test('the preview switch cannot bypass the final gate in a delivery directory', (t) => {
  const f = fixture(t);
  const result = build(f, ['--design-preview']);
  assert.notEqual(result.status, 0);
  assert.match(result.log, /DESIGN_PREVIEW_OUTPUT_INVALID/);
  assert.equal(fs.existsSync(path.join(f.dir, 'Required picture.pptx')), false);
});

test('decoration-free fallback preserves preview mode only when explicitly supplied', () => {
  let args;
  const spawn = (_cmd, got) => { args = got; return { status: 0 }; };
  rebuildWithoutOptionalDecorations('lesson.json', 'scratch', { spawnSync: spawn, designPreview: true });
  assert.ok(args.includes('--design-preview'));
  rebuildWithoutOptionalDecorations('lesson.json', 'delivery', { spawnSync: spawn });
  assert.ok(!args.includes('--design-preview'));
});

test('required omission records deduplicate repeated draws and reset between passes', () => {
  clearMissingPictures();
  const pptx = new PptxGenJS();
  const slide = { addShape() {}, addText() {}, addImage() {} };
  const zone = { x: 0, y: 0, w: 5, h: 5 };
  const data = { type: 'image', imagePath: 'never-sourced.png' };
  const ctx = { slideIndex: 2, lessonDir: os.tmpdir() };
  const warn = console.warn; console.warn = () => {};
  try {
    drawImage(pptx, slide, zone, data, ctx);
    drawImage(pptx, slide, zone, data, ctx);
    assert.equal(missingPictureFindings().length, 1);
    assert.equal(missingPictureFindings()[0].slide, 3);
    const copy = missingPictureFindings(); copy[0].part = 'changed';
    assert.equal(missingPictureFindings()[0].part, data.imagePath);
    clearMissingPictures();
    assert.deepEqual(missingPictureFindings(), []);
    drawImage(pptx, slide, zone, { ...data, essential: false }, ctx);
    assert.deepEqual(missingPictureFindings(), []);
  } finally { console.warn = warn; clearMissingPictures(); }
});
