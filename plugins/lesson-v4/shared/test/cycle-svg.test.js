'use strict';

// The cycle: stages joined by arrows in a loop (13 October 2026). The stress
// test's Year 6 circulatory system lesson needed blood to go round and the only
// chain ran in a straight line, so the loop was closed in a sentence beside it.
// These lock where each space landed, not which words were printed: a label
// clipped in half still contains its words.

const test = require('node:test');
const assert = require('node:assert/strict');

const cycle = require('../visuals/cycle-svg');
const { prepareChainsIn } = require('../visuals/process-chain-pictures');
const { profileFor } = require('../visuals/surface-profiles');

const pic = (w = 400, h = 300) => ({ imageHref: 'data:image/png;base64,AAAA', imageWidth: w, imageHeight: h });
const SURFACES = [
  ['slides', { widthPt: 12.3 * 72, heightPt: 4.4 * 72 }],
  ['worksheets', { widthMm: 174 }],
  ['wall', { widthMm: 360 }],
  ['stickin', { widthMm: 160 }],
];
const BLOOD = { boxes: ['The heart pushes blood out', 'Arteries carry it to the body', 'The body takes the oxygen', 'Veins carry it back to the heart'] };
const WATER = { title: 'The water cycle', boxes: ['sea, rivers and lakes', 'water vapour in the air', 'clouds', 'rain, hail or snow'], arrows: ['evaporation', 'condensation', 'precipitation', 'collection'] };
const LONG = { boxes: ['The Sun heats water in the sea', 'Water evaporates and rises as water vapour', 'Water vapour cools and condenses into clouds', 'Clouds grow heavy and rain falls', 'Rain runs into streams and rivers', 'Rivers carry the water back to the sea'] };
const MOON = { boxes: ['New Moon', 'waxing crescent', 'first quarter', 'waxing gibbous', 'Full Moon', 'waning gibbous', 'last quarter', 'waning crescent'] };
const FROG = { boxes: ['frogspawn', 'tadpole', 'tadpole with legs', 'froglet', 'adult frog'] };
const PLANT = { boxes: ['seed', 'seedling', 'adult plant'], arrows: ['germination', 'growth', 'seed dispersal'] };
const BUTTERFLY = { boxes: [
  { text: 'egg', label: 'laid on a leaf', ...pic(300, 400) }, { text: 'caterpillar', label: 'eats and grows', ...pic(400, 300) },
  { text: 'chrysalis', label: 'changes inside', ...pic(300, 450) }, { text: 'butterfly', label: 'lays new eggs', ...pic(500, 300) } ] };
const TWO_LOOPS = { boxes: ['heart', 'lungs', 'heart', 'body'], arrows: ['blood low in oxygen', 'blood rich in oxygen', 'blood rich in oxygen', 'blood low in oxygen'] };
const FILL_IN = { boxes: ['egg', null, 'chrysalis', null], arrowLine: true };
const EVERY = { BLOOD, WATER, LONG, MOON, FROG, PLANT, BUTTERFLY, TWO_LOOPS, FILL_IN };

const overlap = (a, b) => a.x < b.x + b.w - 0.01 && b.x < a.x + a.w - 0.01 && a.y < b.y + b.h - 0.01 && b.y < a.y + a.h - 0.01;
const inside = (r, W, H) => r.x >= -0.01 && r.y >= -0.01 && r.x + r.w <= W + 0.01 && r.y + r.h <= H + 0.01;
const stageRect = (b) => (b.boxed ? { x: b.x, y: b.y, w: b.w, h: b.h } : { x: b.pic.x, y: b.pic.y, w: b.pic.w, h: b.bottom - b.pic.y });

test('every cycle lays out on every surface with nothing outside the picture and nothing on top of anything else', () => {
  for (const [name, spec] of Object.entries(EVERY)) {
    for (const [surface, box] of SURFACES) {
      const profile = profileFor(surface, box);
      const out = cycle.tightSvg(spec, profile);
      const L = out.layout;
      const where = `${name} on ${surface}`;
      assert.ok(out.w <= profile.widthPt + 0.5, `${where}: no wider than its space`);
      if (box.heightPt) assert.ok(out.h <= box.heightPt + 0.5, `${where}: no deeper than its space`);
      assert.ok(L.pt >= profile.minFontPt - 1e-6, `${where}: words at a readable size`);
      const stages = L.boxes.map(stageRect);
      stages.forEach((r, i) => assert.ok(inside(r, out.w, out.h), `${where}: stage ${i + 1} is inside the picture`));
      stages.forEach((a, i) => stages.slice(i + 1).forEach((b, j) => assert.ok(!overlap(a, b), `${where}: stages ${i + 1} and ${i + j + 2} are apart`)));
      const words = L.arrows.filter((a) => a.words).map((a) => a.words);
      const lines = L.arrows.filter((a) => a.line).map((a) => ({ x: a.line.x, y: a.line.y - 1, w: a.line.w, h: 1 }));
      const title = L.title ? [{ x: L.title.x, y: L.title.y, w: L.title.w, h: L.title.h }] : [];
      for (const r of [...words, ...lines, ...title]) {
        assert.ok(inside(r, out.w, out.h), `${where}: words beside an arrow, a writing line or the title is inside the picture`);
        stages.forEach((s, i) => assert.ok(!overlap(r, s), `${where}: nothing written over stage ${i + 1}`));
      }
      const loose = [...words, ...title];
      loose.forEach((a, i) => loose.slice(i + 1).forEach((b) => assert.ok(!overlap(a, b), `${where}: arrow words and the title are clear of each other`)));
    }
  }
});

test('the loop is closed: one arrow per stage, and one of them runs from the last stage back to the first', () => {
  for (const spec of [BLOOD, WATER, LONG, MOON, FROG, PLANT]) {
    const out = cycle.tightSvg(spec, profileFor('wall', { widthMm: 360 }));
    assert.equal((out.svg.match(/class="cycle-arrow[ "]/g) || []).length, spec.boxes.length);
    assert.equal((out.svg.match(/cycle-return/g) || []).length, 1);
    const back = out.layout.arrows.find((a) => a.returns);
    const first = out.layout.boxes[0];
    assert.equal(back.pos, spec.boxes.length - 1);
    assert.ok(back.y2 < back.y1 && Math.abs(back.x2 - (first.x + first.w / 2)) < 0.01, 'the return arrow points up into the first stage');
  }
});

test('the first stage is top left and the route runs clockwise, whatever the number of stages', () => {
  for (const spec of [PLANT, BLOOD, FROG, LONG, MOON]) {
    const L = cycle.describeLayout(spec, profileFor('worksheets', { widthMm: 174 }));
    const first = L.boxes[0];
    L.boxes.forEach((b) => assert.ok(first.x <= b.x + 0.01 && first.y <= b.y + 0.01, 'nothing is above or left of stage one'));
    const second = L.boxes[1];
    assert.ok(second.x > first.x && Math.abs(second.y - first.y) < 0.01, 'stage two is to the right of stage one');
    const last = L.boxes[L.boxes.length - 1];
    assert.ok(last.y > first.y && Math.abs(last.x - first.x) < 0.01, 'the last stage is under stage one');
  }
});

test('the words beside an arrow belong to the arrow leaving that stage', () => {
  const L = cycle.describeLayout(WATER, profileFor('wall', { widthMm: 360 }));
  const [sea, vapour, clouds, rain] = L.boxes;
  const at = (pos) => L.arrows.find((a) => a.pos === pos);
  assert.deepEqual(at(0).lines, ['evaporation']);
  assert.ok(at(0).x1 > sea.x && at(0).x2 <= vapour.x, 'evaporation runs from the sea to the vapour');
  assert.deepEqual(at(1).lines, ['condensation']);
  assert.ok(at(1).y1 < at(1).y2 && at(1).y2 <= clouds.y, 'condensation runs down to the clouds');
  assert.deepEqual(at(2).lines, ['precipitation']);
  assert.ok(at(2).x2 < at(2).x1 && at(2).x2 >= rain.x + rain.w, 'precipitation runs back along the bottom to the rain');
  assert.deepEqual(at(3).lines, ['collection']);
});

test('a title sits in the middle of the loop, between the two rows', () => {
  const L = cycle.describeLayout(WATER, profileFor('slides', { widthPt: 900, heightPt: 330 }));
  assert.ok(L.title.y >= L.boxes[0].y + L.boxes[0].h && L.title.y + L.title.h <= L.boxes[3].y, 'between the rows');
  assert.ok(L.title.x > L.boxes[0].x + L.boxes[0].w / 2 && L.title.x + L.title.w < L.boxes[1].x + L.boxes[1].w / 2, 'between the two turns');
});

test('a title the two turns leave no room for goes above the loop instead of being refused', () => {
  const L = cycle.describeLayout({ ...WATER, arrows: undefined, arrowLine: true }, profileFor('worksheets', { widthMm: 150 }));
  assert.ok(L.title.y + L.title.h <= L.boxes[0].y, 'above the top row');
});

test('pictures keep their shape, and each name sits under its own picture', () => {
  for (const [surface, box] of SURFACES) {
    const out = cycle.tightSvg(BUTTERFLY, profileFor(surface, box));
    assert.equal((out.svg.match(/<image /g) || []).length, 4, `${surface}: four pictures`);
    out.layout.boxes.forEach((b, i) => {
      const raw = BUTTERFLY.boxes[i];
      assert.ok(Math.abs(b.pic.w / b.pic.h - raw.imageWidth / raw.imageHeight) < 0.01, `${surface}: ${raw.text} keeps its shape`);
      assert.ok(b.nameY >= b.pic.y + b.pic.h && b.nameY - (b.pic.y + b.pic.h) < out.layout.pt, `${surface}: ${raw.text} is named just under its picture`);
    });
    assert.equal((out.svg.match(/class="cycle-label"/g) || []).length, 4, `${surface}: four phrases under the names`);
  }
});

test('the board does not grow the words of a pictured cycle at the expense of its pictures', () => {
  const profile = profileFor('slides', { widthPt: 900, heightPt: 330 });
  assert.ok(cycle.describeLayout(BUTTERFLY, profile).pt <= profile.fontPt);
  assert.ok(cycle.describeLayout({ boxes: ['spring', 'summer', 'autumn', 'winter'] }, profile).pt > profile.fontPt, 'a cycle of short words does grow');
});

test('a blank stage is a box a child can write in, and arrowLine leaves a line beside every arrow', () => {
  const profile = profileFor('worksheets', { widthMm: 174 });
  const out = cycle.tightSvg(FILL_IN, profile);
  const mm = (ptv) => (ptv / 72) * 25.4;
  out.layout.boxes.filter((b) => !b.text).forEach((b) => {
    assert.ok(mm(b.h) >= 11.5, `a blank box is ${mm(b.h).toFixed(1)}mm deep`);
    assert.ok(mm(b.w) >= 25, `a blank box is ${mm(b.w).toFixed(1)}mm wide`);
  });
  assert.equal((out.svg.match(/class="cycle-arrow-line"/g) || []).length, 4);
  out.layout.arrows.forEach((a) => assert.ok(mm(a.line.w) >= 28, `a writing line is ${mm(a.line.w).toFixed(1)}mm long`));
  const named = cycle.tightSvg({ ...WATER, arrowLine: true }, profile);
  assert.equal((named.svg.match(/class="cycle-arrow-line"/g) || []).length, 0, 'an arrow with words has no line');
});

test('arrowHeads false leaves plain joins, and labelLine a line under each stage', () => {
  const out = cycle.tightSvg({ boxes: ['spring', 'summer', 'autumn', 'winter'], arrowHeads: false, labelLine: true }, profileFor('stickin', { widthMm: 160 }));
  assert.equal((out.svg.match(/class="cycle-join/g) || []).length, 4);
  assert.ok(!out.svg.includes('<polygon'), 'no arrowhead is drawn');
  assert.equal((out.svg.match(/class="cycle-label-line"/g) || []).length, 4);
});

test('two loops through one stage: the shared stage is drawn once, tall, between them', () => {
  for (const [surface, box] of SURFACES) {
    const out = cycle.tightSvg(TWO_LOOPS, profileFor(surface, box));
    const L = out.layout;
    assert.equal(L.boxes.length, 3, `${surface}: heart, lungs and body`);
    assert.equal((out.svg.match(/>heart</g) || []).length, 1, `${surface}: the heart is printed once`);
    assert.equal(L.arrows.length, 4, `${surface}: four arrows`);
    const [heart, lungs, body] = L.boxes;
    assert.ok(body.x < heart.x && heart.x < lungs.x, `${surface}: one loop each side of the heart`);
    const into = L.arrows.filter((a) => Math.abs(a.x2 - heart.x) < L.pt || Math.abs(a.x2 - (heart.x + heart.w)) < L.pt);
    assert.equal(into.length, 2, `${surface}: two arrows arrive at the heart`);
  }
  const big = cycle.describeLayout({ boxes: ['heart', 'arteries to the lungs', 'lungs', 'veins from the lungs', 'heart', 'arteries', 'body', 'veins'] }, profileFor('wall', { widthMm: 360 }));
  assert.equal(big.boxes.length, 7);
  assert.equal(big.arrows.length, 8);
});

test('the route may start anywhere on a pair of loops and the arrows keep their own words', () => {
  const turned = { boxes: ['lungs', 'heart', 'body', 'heart'], arrows: ['to the heart', 'to the body', 'back to the heart', 'to the lungs'] };
  const L = cycle.describeLayout(turned, profileFor('wall', { widthMm: 360 }));
  const lungs = L.boxes.find((b) => b.text === 'lungs');
  const leaving = L.arrows.find((a) => a.lines.join(' ') === 'to the heart');
  assert.ok(Math.abs(leaving.x1 - lungs.x) < L.pt || Math.abs(leaving.x1 - (lungs.x + lungs.w)) < L.pt, '"to the heart" leaves the lungs');
});

test('what cannot be drawn is refused by name', () => {
  const wall = profileFor('wall', { widthMm: 360 });
  assert.throws(() => cycle.tightSvg({ boxes: ['day', 'night'] }, wall), /CYCLE_TOO_FEW_STAGES/);
  assert.throws(() => cycle.tightSvg({ boxes: 'abcdefghi'.split('') }, wall), /CYCLE_TOO_MANY_STAGES/);
  assert.throws(() => cycle.tightSvg({ boxes: ['heart', 'lungs', 'heart', 'body', 'heart', 'head'] }, wall), /CYCLE_REPEATED_STAGE/);
  assert.throws(() => cycle.tightSvg({ boxes: ['heart', 'heart', 'lungs', 'body'] }, wall), /CYCLE_SHARED_STAGE_ADJACENT/);
  assert.throws(() => cycle.tightSvg(MOON, profileFor('worksheets', { widthMm: 60 })), /CYCLE_TOO_NARROW/);
  assert.throws(() => cycle.tightSvg(LONG, profileFor('slides', { widthPt: 900, heightPt: 90 })), /CYCLE_ZONE_TOO_SHALLOW/);
});

test('a cycle on a pupil sheet prints nothing in the answer colour, and the stick-in pack prints in ink', () => {
  const sheet = cycle.tightSvg(BUTTERFLY, profileFor('worksheets', { widthMm: 174 })).svg;
  assert.ok(!sheet.includes('#00B050'));
  const piece = cycle.tightSvg(WATER, profileFor('stickin', { widthMm: 160 })).svg;
  assert.ok(!/#(00B050|0070C0|CC0000)/.test(piece));
});

test('two different cycles never share a cached picture', () => {
  const p = profileFor('wall', { widthMm: 360 });
  const keys = new Set([BLOOD, WATER, { ...WATER, title: '' }, { ...WATER, arrows: [] }, FILL_IN, { ...FILL_IN, arrowLine: false }, TWO_LOOPS].map((s) => cycle.cacheKey(s, p)));
  assert.equal(keys.size, 7);
});

test("a cycle's pictures are read wherever a chain's are", async () => {
  const lesson = { slides: [{ body: { type: 'cycle', boxes: [{ text: 'egg', imagePath: 'no-such-file.jpg' }, 'caterpillar', 'chrysalis'] } }] };
  const missing = await prepareChainsIn(lesson, __dirname);
  assert.equal(missing.length, 1);
  assert.equal(lesson.slides[0].body.boxes[0].imagePending, true);
  const piece = [{ visual: 'cycle', spec: { boxes: [{ text: 'egg', imagePath: 'no-such-file.jpg' }, 'caterpillar', 'chrysalis'] } }];
  assert.equal((await prepareChainsIn(piece, __dirname)).length, 1);
});

// ─── answers (14 October 2026) ──────────────────────────────────────────────
// A cycle with stages or arrow words left blank has an answers slide that
// writes them in. The words written in are the answer and are drawn in answer
// green, and the loop must not move or change size between the two slides.
const GREEN = '#00B050';
const BOARD = profileFor('slides', { widthPt: 855, heightPt: 447 });
const QUESTION = { title: 'Life cycle of a butterfly', boxes: ['egg', null, 'chrysalis', null], arrows: [null, 'makes a hard case', null, 'lays eggs'], arrowLine: true };
const ANSWERS = {
  title: 'Life cycle of a butterfly',
  boxes: ['egg', { text: 'caterpillar', answer: true }, 'chrysalis', { text: 'butterfly', answer: true }],
  arrows: [{ text: 'hatches', answer: true }, 'makes a hard case', { text: 'comes out with wings', answer: true }, 'lays eggs'],
};

test('the stages and arrow words that are the answer are green on the board and the wall, and the given ones are not', () => {
  for (const profile of [BOARD, profileFor('wall', { widthMm: 360 })]) {
    const { svg } = cycle.tightSvg(ANSWERS, profile);
    assert.match(svg, new RegExp(`fill="${GREEN}"[^>]*>caterpillar<`));
    assert.match(svg, new RegExp(`fill="${GREEN}"[^>]*>hatches<`));
    assert.doesNotMatch(svg, new RegExp(`fill="${GREEN}"[^>]*>egg<`));
    assert.doesNotMatch(svg, new RegExp(`fill="${GREEN}"[^>]*>lays eggs<`));
  }
});

test('a pupil sheet and the stick-in pack print the question: empty boxes and writing lines where the answers were', () => {
  for (const profile of [profileFor('worksheets', { widthMm: 174 }), profileFor('stickin', { widthMm: 160 })]) {
    const L = cycle.describeLayout(ANSWERS, profile);
    assert.deepEqual(L.boxes.map((b) => b.text), ['egg', null, 'chrysalis', null]);
    assert.equal(L.arrows.filter((a) => a.words).length, 2, 'only the two given arrow words print');
    assert.equal(L.arrows.filter((a) => a.line).length, 2, 'the two answer arrows get a line to write on');
    assert.doesNotMatch(cycle.tightSvg(ANSWERS, profile).svg, /caterpillar|hatches/);
  }
});

test('the teacher\'s answer sheet prints the answers in green', () => {
  const key = profileFor('worksheets', { widthMm: 90, overrides: { answers: 'show' } });
  assert.match(cycle.tightSvg(ANSWERS, key).svg, new RegExp(`fill="${GREEN}"[^>]*>caterpillar<`));
  assert.notEqual(cycle.cacheKey(ANSWERS, key), cycle.cacheKey(ANSWERS, profileFor('worksheets', { widthMm: 90 })));
});

test('a question loop and its answers loop told each other\'s words are laid out as one loop', () => {
  const shape = (L) => ({
    size: [L.W, L.h, L.pt].map((v) => v.toFixed(2)),
    boxes: L.boxes.map((b) => [b.x, b.y, b.w, b.h].map((v) => v.toFixed(2))),
    arrows: L.arrows.map((a) => [a.x1, a.y1, a.x2, a.y2].map((v) => v.toFixed(2))),
  });
  assert.notDeepEqual(shape(cycle.describeLayout(QUESTION, BOARD)), shape(cycle.describeLayout(ANSWERS, BOARD)), 'the test must start from a loop that moves');
  const roomFor = [QUESTION, ANSWERS];
  const q = cycle.describeLayout({ ...QUESTION, roomFor }, BOARD);
  const a = cycle.describeLayout({ ...ANSWERS, roomFor }, BOARD);
  assert.deepEqual(shape(q), shape(a));
  // Each still says only its own words: the question's two boxes stay empty
  // and its blank arrows keep their writing lines.
  assert.deepEqual(q.boxes.map((b) => b.text), ['egg', null, 'chrysalis', null]);
  assert.equal(q.arrows.filter((a) => a.line).length, 2);
  assert.doesNotMatch(cycle.tightSvg({ ...QUESTION, roomFor }, BOARD).svg, /caterpillar|hatches/);
});
