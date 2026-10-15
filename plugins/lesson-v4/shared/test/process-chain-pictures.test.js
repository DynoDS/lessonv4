'use strict';

// The process chain as a chain of pictures (11 October 2026: a Year 4 food
// chain reached the board, the wall and the tables as boxes of words, and
// "build the chain" as cards under 1st, 2nd, 3rd, because the drawing could
// hold nothing but words and had no form a child completes).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const chain = require('../visuals/process-chain-svg');
const { profileFor } = require('../visuals/surface-profiles');

// A 4 by 3 picture, already read, as a surface hands it over.
const pic = (w = 400, h = 300) => ({ imageHref: 'data:image/png;base64,AAAA', imageWidth: w, imageHeight: h });
const SURFACES = [
  ['slides', { widthPt: 12.3 * 72, heightPt: 3.6 * 72 }],
  ['worksheets', { widthMm: 174 }],
  ['wall', { widthMm: 380 }],
  ['stickin', { widthMm: 180 }],
];
const TEACH = { boxes: [
  { text: 'Grass', imagePath: 'grass.jpg', label: 'producer', ...pic(300, 400) },
  { text: 'Rabbit', imagePath: 'rabbit.jpg', label: 'consumer', ...pic(320, 400) },
  { text: 'Fox', imagePath: 'fox.jpg', label: 'consumer', ...pic(600, 400) },
] };
const BUILD = { boxes: [null, null, null], arrowHeads: false, bank: [
  { text: 'Frog', ...pic() }, { text: 'Lettuce', ...pic() }, { text: 'Slug', ...pic() },
] };

test('a pictured chain draws its pictures, names and role labels on every surface', () => {
  for (const [surface, box] of SURFACES) {
    const out = chain.tightSvg(TEACH, profileFor(surface, box));
    assert.equal((out.svg.match(/<image /g) || []).length, 3, `${surface}: three pictures`);
    for (const word of ['Grass', 'Rabbit', 'Fox', 'producer', 'consumer']) assert.ok(out.svg.includes(`>${word}<`), `${surface}: prints "${word}"`);
    assert.equal((out.svg.match(/class="chain-arrow"/g) || []).length, 2, `${surface}: two arrows`);
    assert.ok(!/<rect[^>]*rx=/.test(out.svg), `${surface}: a pictured link is not a box of words`);
    if (box.heightPt) assert.ok(out.h <= box.heightPt + 0.5, `${surface}: stays inside its space`);
  }
});

test('no picture is cropped or stretched: each keeps its own shape inside the shared frame', () => {
  const L = chain.describeLayout(TEACH, profileFor('wall', { widthMm: 380 }));
  TEACH.boxes.forEach((b, i) => {
    const p = L.boxes[i].pic;
    assert.ok(Math.abs(p.w / p.h - b.imageWidth / b.imageHeight) < 0.01, `${b.text} keeps its shape`);
    assert.ok(p.x >= L.boxes[i].x - 0.01 && p.x + p.w <= L.boxes[i].x + L.boxes[i].w + 0.01, `${b.text} stays in its link`);
  });
});

test('a pictured chain takes the height its pictures need, so it is not a strip', () => {
  const words = chain.tightSvg({ boxes: ['Grass', 'Rabbit', 'Fox'] }, profileFor('wall', { widthMm: 380 }));
  const pictures = chain.tightSvg(TEACH, profileFor('wall', { widthMm: 380 }));
  assert.ok(pictures.h > words.h * 2.5, `pictures ${pictures.h.toFixed(0)}pt against words ${words.h.toFixed(0)}pt`);
});

test('arrowHeads false leaves plain joins for the child to finish, with no arrow drawn', () => {
  for (const [surface, box] of SURFACES) {
    const out = chain.tightSvg(BUILD, profileFor(surface, box));
    assert.equal((out.svg.match(/class="chain-join"/g) || []).length, 2, `${surface}: two joins`);
    assert.ok(!out.svg.includes('<polygon'), `${surface}: no arrowhead gives the direction away`);
    assert.equal((out.svg.match(/<rect[^>]*rx=/g) || []).length, 3, `${surface}: three empty boxes`);
  }
});

test('the bank keeps the order it is given and is joined by nothing', () => {
  const L = chain.describeLayout(BUILD, profileFor('stickin', { widthMm: 180 }));
  assert.deepEqual(L.bankCells.map((c) => c.text), ['Frog', 'Lettuce', 'Slug']);
  assert.ok(L.bankCells.every((c) => c.y + c.h < L.top), 'the bank sits above the chain');
  assert.ok(L.bankCells[0].x < L.bankCells[1].x && L.bankCells[1].x < L.bankCells[2].x);
});

test('labelLine gives a writing line under each link that has no label, and only then', () => {
  const sheet = profileFor('worksheets', { widthMm: 174 });
  const plain = chain.tightSvg({ boxes: [null, null, null] }, sheet);
  const lined = chain.tightSvg({ boxes: [null, null, null], labelLine: true }, sheet);
  assert.equal((plain.svg.match(/chain-label-line/g) || []).length, 0);
  assert.equal((lined.svg.match(/chain-label-line/g) || []).length, 3);
  assert.ok(lined.h - plain.h >= 8 / 25.4 * 72 - 1, 'a line a child can write on is about 8mm of paper');
  const given = chain.tightSvg({ boxes: [{ text: 'Oak leaves', label: 'producer' }, null, null], labelLine: true }, sheet);
  assert.equal((given.svg.match(/chain-label-line/g) || []).length, 2, 'a link whose label is given gets no line');
});

test('a chain of words alone is drawn exactly as it always was', () => {
  const sheet = profileFor('worksheets', { widthMm: 170 });
  const out = chain.tightSvg({ boxes: ['egg', 'caterpillar', null, 'butterfly'] }, sheet);
  assert.equal((out.svg.match(/<rect[^>]*rx=/g) || []).length, 4);
  assert.equal((out.svg.match(/class="chain-arrow"/g) || []).length, 3);
  assert.ok(!out.svg.includes('<image'));
  assert.ok(Math.abs(out.h - (3.2 + 0.3) * out.layout.pt) < 0.01, 'the strip keeps its old depth');
});

test('a picture not delivered yet keeps a square place, so the chain is the same size when it lands', () => {
  const board = profileFor('slides', { widthPt: 12.3 * 72, heightPt: 3.6 * 72 });
  const pending = { boxes: TEACH.boxes.map((b) => ({ text: b.text, label: b.label, imagePath: b.imagePath, imagePending: true })) };
  const landed = { boxes: TEACH.boxes.map((b) => ({ ...b, ...pic(400, 400) })) };
  const a = chain.tightSvg(pending, board);
  const b = chain.tightSvg(landed, board);
  assert.equal(a.h, b.h);
  assert.equal((a.svg.match(/chain-picture-pending/g) || []).length, 3);
});

test('preparePictures reads each named file and names the ones it could not read', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chain-pictures-'));
  // The smallest PNG there is: one pixel.
  fs.writeFileSync(path.join(dir, 'grass.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
  const spec = { type: 'process-chain', boxes: [{ text: 'Grass', imagePath: 'grass.png' }, { text: 'Rabbit', imagePath: 'rabbit.png' }, 'Fox'], bank: [{ text: 'Grass', imagePath: 'grass.png' }] };
  const missing = await chain.prepareChainsIn({ slides: [{ body: spec }] }, dir);
  assert.match(spec.boxes[0].imageHref, /^data:image\/png;base64,/);
  assert.equal(spec.boxes[0].imageWidth, 1);
  assert.match(spec.bank[0].imageHref, /^data:image\/png/);
  assert.deepEqual(missing.map((m) => m.imagePath), ['rabbit.png']);
  assert.equal(spec.boxes[1].imagePending, true);
  assert.ok(!chain.cacheKey(spec, profileFor('wall', { widthMm: 380 })).includes('base64'), 'the key names the file, not its bytes');
  fs.rmSync(dir, { recursive: true, force: true });
});
