'use strict';

// Five more layout gaps from the 27 September 2026 trial runs
// (evaluations/trial-2026-09-27/fix-later.md, items 10, 19, 20, 22 and 23).
//
//   10. A Teach question slot painted a telling sentence blue.
//   19. One refused slide stopped the whole slide-design preview, so no page was
//       seen while repairing.
//   20. The criteria-card refusal named one limit at a time.
//   22. A row did not give a height-bound photograph's spare width to the words
//       beside it.
//   23. The header instruction held about 43 characters at 16pt and refused
//       every longer pupil instruction.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { expandTeachLayouts } = require('../src/teach-layouts');
const { presentationRuns } = require('../src/presentation-text');
const { drawContent } = require('../src/content');
const { bodyZone } = require('../src/layout');
const { drawHeader } = require('../src/headers');
const { COLOURS } = require('../src/styles');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build.js');
const CHECK = path.join(ROOT, 'scripts', 'check-slide-design.js');

// A plain PNG of the given size, so the test needs no picture library.
function png(width, height) {
  const zlib = require('node:zlib');
  const table = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.alloc(1 + width * 3, 0x88);
  row[0] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(Array.from({ length: height }, () => row)))),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function slideFor() {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
  pptx.layout = 'W';
  return { pptx, slide: pptx.addSlide() };
}

function runText(runs) {
  return (Array.isArray(runs) ? runs : [{ text: runs }]).map((r) => r.text).join('');
}

// ─── 10. a question slot that tells before it asks ────────────────────────

test('a Teach question that tells then asks keeps the telling black and the asking blue, on its own line', () => {
  const [slide] = expandTeachLayouts({ slides: [{
    template: 'teach-layout', layout: 'picture-statement-question', headerStyle: 'title', title: 'A ragged school',
    pictures: [{ type: 'image', imagePath: 'x.png' }],
    lead: 'Ragged schools were free schools for the poorest children.',
    question: 'Look at the children in the picture. What are they doing?'
  }] }).slides;
  const question = slide.secondary.items[1];
  assert.notEqual(question.color, '0070C0', 'the whole question block is still painted blue');
  // The design's words are unchanged; the colour and the break are the board's.
  assert.equal(question.value, 'Look at the children in the picture. What are they doing?');
  const runs = presentationRuns(question.value, true, COLOURS.body, question);
  const telling = runs.filter((r) => r.text.includes('Look at'));
  const asking = runs.filter((r) => r.text.includes('What are they doing?'));
  assert.ok(telling.length && telling.every((r) => r.options.color === COLOURS.body), 'the telling is not black');
  assert.ok(asking.length && asking.every((r) => r.options.color === COLOURS.title), 'the asking is not blue');
  assert.ok(telling[telling.length - 1].options.breakLine, 'the question does not start a line of its own');
});

test('a question that only asks is blue throughout, as before', () => {
  const [slide] = expandTeachLayouts({ slides: [{
    template: 'teach-layout', layout: 'picture-statement-question', headerStyle: 'title', title: 'A ragged school',
    pictures: [{ type: 'image', imagePath: 'x.png' }],
    lead: 'Ragged schools were free.', question: 'Why might a free school matter?'
  }] }).slides;
  assert.equal(slide.secondary.items[1].color, '0070C0');
});

test('a taught word inside the asking sentence keeps its green', () => {
  const owner = { asksInBlue: true, emphasis: [{ text: 'free school', role: 'vocabulary' }] };
  const value = 'Some children came with no shoes. Why might a free school matter to them?';
  const runs = presentationRuns(value, true, COLOURS.body, owner);
  assert.equal(runText(runs), value.replace('shoes. Why', 'shoes.Why'));
  assert.equal(runs.find((r) => r.text === 'free school').options.color, COLOURS.green);
  assert.equal(runs.find((r) => r.text.startsWith('Why')).options.color, COLOURS.title);
});

test('the design check no longer refuses a Teach question that tells then asks', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-gaps-2-q-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'photo.png'), png(600, 400));
  const spec = path.join(dir, 'lesson.json');
  fs.writeFileSync(spec, JSON.stringify({ lessonName: 'Q', yearGroup: 'Year 4', subject: 'History', lo: 'x', slides: [{
    template: 'teach-layout', layout: 'picture-statement-question', headerStyle: 'title', title: 'A ragged school',
    designUnitId: 'u/teaching-sequence/unit-001', speakerNotes: 'Say to children: look.',
    pictures: [{ type: 'image', imagePath: 'photo.png', essential: false }],
    lead: 'Ragged schools were free schools for the poorest children.',
    question: 'Look at the children in the picture. What are they doing?'
  }] }));
  const result = spawnSync(process.execPath, [CHECK, spec], { encoding: 'utf8' });
  const log = (result.stdout || '') + (result.stderr || '');
  assert.doesNotMatch(log, /MIXED_BLOCK_WHOLE_BLUE/, log);
});

// ─── 20. one refusal names every limit of the list ─────────────────────────

// F-pshe slide 15 on the first pass: four criteria and the sticky line in the
// narrow side of a 70-30 split.
const CHLOE_LIST = { type: 'sc-panel', content: { type: 'steps', steps: [
  'Find the {{food group}} each food belongs to.',
  'Find the groups the day has <<nothing from>>.',
  'Say which job each missing group does for your body.',
  'Choose a food from that group and say how it would help.',
  '✨ A {{balanced diet}} has food from every {{food group}}, because each group does a different job in your body.'
] } };

function draw(zone, item) {
  const { pptx, slide } = slideFor();
  drawContent(pptx, slide, Object.assign({ class: 'C' }, zone), item, { slideIndex: 0, cardLook: true });
}

test('a criteria refusal says what the whole list needs, and that room clears every item', () => {
  const zone = { x: 9.3, y: 0.6, w: 3.8, h: 6.65 };
  let message = '';
  assert.throws(() => draw(zone, CHLOE_LIST), (error) => { message = error.message; return true; });
  const height = message.match(/About (\d+\.\d+)in more height/);
  const width = message.match(/about (\d+\.\d+)in more width at this height/);
  assert.ok(height, message);
  assert.ok(width, message);
  // Each lever on its own clears the whole list, not only the item named.
  assert.doesNotThrow(() => draw(Object.assign({}, zone, { h: zone.h + Number(height[1]) + 0.02 }), CHLOE_LIST));
  assert.doesNotThrow(() => draw(Object.assign({}, zone, { w: zone.w + Number(width[1]) + 0.02 }), CHLOE_LIST));
});

// ─── 22. a row gives a height-bound photograph's spare width away ──────────

test('a portrait photograph in a row gives the width it cannot fill to the words beside it', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-gaps-2-row-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'tall.png'), png(480, 720));
  const { pptx, slide } = slideFor();
  const zone = { x: 0.2, y: 0.8, w: 12.8, h: 5.0, class: 'E-wide' };
  const words = 'Thousands of people came to his funeral, many of them poor children he had helped.';
  drawContent(pptx, slide, zone, { type: 'row', items: [
    { type: 'image', imagePath: 'tall.png', fit: 'contain', essential: false },
    { type: 'text', value: words, heightMode: 'fill' }
  ] }, { slideIndex: 0, cardLook: true, lessonDir: dir, imageDims: { 'tall.png': { w: 480, h: 720 } } });
  const text = slide._slideObjects.find((o) => o._type === 'text' && JSON.stringify(o.text).includes('Thousands'));
  assert.ok(text, 'no text drawn');
  // An equal share would give the words under 6.4in; the photograph draws
  // about 3.3in wide at this height, so the words get the rest.
  assert.ok(text.options.w > 8, `the words were given ${text.options.w.toFixed(2)}in`);
});

// ─── 23. a long header instruction takes two lines ────────────────────────

test('a header instruction too long for one line takes two, and the body moves down for it', () => {
  const short = { headerStyle: 'title', title: 'Find another Amazon country', instruction: 'Talk to your partner.' };
  const long = { headerStyle: 'title', title: 'Find another Amazon country',
    instruction: 'Talk to your partner first, then write your answer in your book using because.' };
  assert.equal(bodyZone('title', short).y, 0.6, 'a one-line instruction moved the body');
  const zone = bodyZone('title', long);
  assert.ok(zone.y > 0.6, 'the body did not make room for a two-line instruction');
  const { slide } = slideFor();
  drawHeader(slide, long, { cardLook: true });
  const box = slide._slideObjects.find((o) => o._type === 'text' && JSON.stringify(o.text).includes('Talk to your'));
  assert.ok(box.options.h >= 0.6, `the instruction box is ${box.options.h}in tall, one line`);
  assert.equal(box.options.fontSize, 16, 'the instruction was drawn smaller');
  assert.ok(box.options.y + box.options.h <= zone.y, 'the instruction runs into the body');
});

test('a slide with a long header instruction builds without an overload', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-gaps-2-instr-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const spec = path.join(dir, 'lesson.json');
  fs.writeFileSync(spec, JSON.stringify({ lessonName: 'Instruction', yearGroup: 'Year 4', subject: 'Geography', lo: 'x', slides: [
    { template: 'body-full', headerStyle: 'title', title: 'Why is Borneo\'s rainforest getting smaller?',
      instruction: 'Use the map and the sentence beginnings to answer each question.',
      speakerNotes: 'Say to children: x', body: { type: 'text', value: 'Borneo is a big island in Asia.' } },
    { template: 'body-full', headerStyle: 'title', title: 'Find another Amazon country',
      instruction: 'Talk to your partner first, then write your answer in your book using because.',
      speakerNotes: 'Say to children: x', body: { type: 'text', value: 'Borneo is a big island in Asia.' } }
  ] }));
  const result = spawnSync(process.execPath, [BUILD, spec, dir], { encoding: 'utf8' });
  const log = (result.stdout || '') + (result.stderr || '');
  assert.equal(result.status, 0, log);
  assert.doesNotMatch(log, /TEXT_OVERLOAD/, log);
});

// ─── 19. a refused slide no longer hides the rest of the preview ───────────

test('a preview check that refuses one slide still keeps the pages it drew, under their own name', (t) => {
  const { runSlideDesignCheck } = require('../scripts/check-slide-design');
  const JSZip = require('jszip');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-gaps-2-preview-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const spec = path.join(dir, 'lesson.json');
  fs.writeFileSync(spec, JSON.stringify({ lessonName: 'Preview', yearGroup: 'Year 4', subject: 'PSHE', lo: 'x', slides: [
    { template: 'body-full', headerStyle: 'title', title: 'A slide that fits', speakerNotes: 'Say to children: x',
      body: { type: 'text', value: 'A balanced diet has food from every food group.' } },
    { template: 'split-h-70-30', primarySide: 'left', headerStyle: 'title', title: 'A panel that does not fit',
      speakerNotes: 'Say to children: x',
      primary: { type: 'text', value: 'Chloe really likes cheese.' },
      secondary: CHLOE_LIST }
  ] }));
  const result = runSlideDesignCheck(spec, { retainPreview: true });
  if (result.partialPreviewDir) t.after(() => fs.rmSync(result.partialPreviewDir, { recursive: true, force: true }));
  assert.equal(result.ok, false, 'the refused slide still fails the check');
  assert.equal(result.previewDir, undefined, 'a refused deck is never the promotable preview');
  assert.ok(result.partialPreviewOutputPath && fs.existsSync(result.partialPreviewOutputPath),
    'no pages were kept to look at while repairing');
  return JSZip.loadAsync(fs.readFileSync(result.partialPreviewOutputPath)).then((zip) => {
    const slides = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
    assert.equal(slides.length, 2);
  });
});

// ─── the geography map a fifth of the slide: the finding says what to do ────

test('a figure held in a shallow band is told to take the full height of a side', () => {
  const { checkZoneFill, zoneFillWarnings, clearZoneFill } = require('../src/content/_zone-fill');
  clearZoneFill();
  // The Year 4 geography task slide: a 1.48:1 map in a 12.7in by 2.3in band.
  checkZoneFill({ slideIndex: 18 }, { x: 0.3, y: 1.2, w: 12.7, h: 2.29 }, { x: 5, y: 1.2, w: 3.1, h: 2.1 }, 'the map');
  const [finding] = zoneFillWarnings();
  clearZoneFill();
  assert.ok(finding, 'no finding recorded');
  assert.equal(finding.signal, 'FIGURE_ZONE_UNDERFILLED');
  assert.match(finding.message, /too shallow/);
  assert.match(finding.message, /split the slide left and right/);
  assert.match(finding.message, /full height of\s+one side/);
  assert.doesNotMatch(finding.message, /a wider, shallower zone for a wide picture/);
});
