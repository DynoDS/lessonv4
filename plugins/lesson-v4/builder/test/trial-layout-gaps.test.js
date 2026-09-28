'use strict';

// Four layout gaps from the 27 September 2026 trial runs, each of which cost a
// slide designer repair passes it could not win, or shipped a slide with a hole
// in it. Each test builds the slide the way a run wrote it and reads the result.
//
//   1. A wide picture (about 2.6:1) with a lead line, a question and the line to
//      remember had no Teach layout, so one Teach beat went across three or four
//      slides (fix-later items 9 and 19).
//   2. banner-picture-sidebar pinned a wide picture to the top of its column and
//      left about 1.8in of empty slide under it (item 11).
//   3. A tall photograph on a vocabulary card was reported as filling 55% of its
//      panel, a finding nothing on the slide could change (item 12).
//   4. The last task slide, a case, a photo, a question and a success-criteria
//      panel, kept failing to lay out because a stack shares its height by the
//      designer's guessed weights, blind to what each item needs (item 21).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { expandTeachLayouts } = require('../src/teach-layouts');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build.js');

// A 2.6:1 picture, the shape of the 1842 mines report drawing, and a tall one,
// the shape of the Shaftesbury memorial fountain. Written as plain PNGs so the
// test needs no picture library.
function png(width, height) {
  const zlib = require('node:zlib');
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
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
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const row = Buffer.alloc(1 + width * 3, 0x88);
  row[0] = 0;
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))
  ]);
}

function tmpDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trial-layout-gaps-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'wide.png'), png(650, 250));
  fs.writeFileSync(path.join(dir, 'tall.png'), png(480, 720));
  fs.writeFileSync(path.join(dir, 'photo.png'), png(600, 400));
  return dir;
}

function build(dir, slides, extraArgs = []) {
  const specPath = path.join(dir, 'lesson.json');
  fs.writeFileSync(specPath, JSON.stringify({ lessonName: 'Trial layout gaps', yearGroup: 'Year 4',
    subject: 'History', lo: 'To test layouts', slides }));
  const result = spawnSync(process.execPath, [BUILD, specPath, dir, ...extraArgs], { encoding: 'utf8' });
  return { status: result.status, log: (result.stdout || '') + (result.stderr || '') };
}

const wide = (extra) => Object.assign({ type: 'image', imagePath: 'wide.png', fit: 'contain', essential: true }, extra || {});

// ─── 1. a wide picture with its lead, question and line to remember ─────────

// The Teach beat the B-h1 and D-h1 slide designers split across three and four
// slides, on one slide.
const MINES_BEAT = {
  template: 'teach-layout',
  layout: 'picture-top-cards',
  headerStyle: 'title',
  title: 'Who could stop Victorian children being sent down the mines?',
  speakerNotes: 'Say to children: look at this picture from the 1842 report.',
  lead: 'He couldn\'t make a law on his own.',
  pictures: [wide({ caption: 'A picture from the 1842 report' })],
  lines: [{ value: 'So he got Parliament to send people to ask children like John Hobson about their work.',
    emphasis: [{ text: 'Parliament', role: 'vocabulary' }] }],
  question: 'What is this child doing? Why do you think pictures like this shocked people?',
  sticky: 'In 1842, a law Lord Shaftesbury fought for stopped girls, and boys under ten, from working underground in mines.'
};

test('a wide picture, a lead line, a question and the line to remember go on one Teach slide', () => {
  const [slide] = expandTeachLayouts({ slides: [MINES_BEAT] }).slides;
  const written = JSON.stringify(slide);
  ['He couldn\'t make a law', 'John Hobson', 'What is this child doing', 'In 1842, a law']
    .forEach((words) => assert.ok(written.includes(words), `"${words}" did not reach the slide`));
});

test('the one-slide mines beat builds with the picture large and every line readable', (t) => {
  const dir = tmpDir(t);
  const { status, log } = build(dir, [MINES_BEAT]);
  assert.equal(status, 0, log);
  assert.doesNotMatch(log, /FIGURE_ZONE_UNDERFILLED|PICTURE_BELOW_READABLE_FLOOR|TEXT_OVERLOAD/, log);
  // Five pieces of writing and a picture children work from is a full slide,
  // and the cards may settle a point under the 20pt the board aims for; none
  // of them is at the 18pt floor.
  assert.doesNotMatch(log, /at 18pt: "(He couldn|So he got|What is this|In 1842)/, log);
});

// ─── 2. banner-picture-sidebar uses the height a wide picture leaves ────────

test('banner-picture-sidebar does not leave the space under a wide picture empty', () => {
  const { drawBodySidebar } = require('../src/templates/body-sidebar');
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
  pptx.layout = 'W';
  const slide = pptx.addSlide();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trial-layout-gaps-bps-'));
  try {
    fs.writeFileSync(path.join(dir, 'wide.png'), png(650, 250));
    const [spec] = expandTeachLayouts({ slides: [{
      template: 'teach-layout', layout: 'banner-picture-sidebar', headerStyle: 'title', title: 'Mines',
      lead: 'He couldn\'t make a law on his own.', pictures: [wide({ caption: 'A picture from the 1842 report' })],
      lines: ['So he got Parliament to send people to ask children about their work.'],
      question: 'What is this child doing?'
    }] }).slides;
    const ctx = { slideIndex: 0, cardLook: true, lessonDir: dir, imageDims: { 'wide.png': { w: 650, h: 250 } } };
    drawBodySidebar(pptx, slide, spec, ctx);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const picture = slide._slideObjects.find((o) => o._type === 'image' || (o.image || o.path));
  assert.ok(picture, 'no picture drawn');
  const p = picture.options || picture;
  const bottomOfBody = 7.5 - 0.25;
  // The picture is held by its width, so it cannot fill the column. Under it
  // now is only its own caption and the card's padding, not the height it
  // could not use.
  const gapUnder = bottomOfBody - (p.y + p.h);
  assert.ok(gapUnder < 0.8, `the picture leaves ${gapUnder.toFixed(2)}in empty under it`);
  // That height went to the lead line above it, which prints larger for it.
  const lead = slide._slideObjects.find((o) => o._type === 'text' &&
    JSON.stringify(o.text || '').includes('make a law'));
  assert.ok(lead, 'no lead line drawn');
  assert.ok(lead.options.h > 1.2, `the lead's box is ${lead.options.h.toFixed(2)}in tall; it did not take the spare height`);
});

// ─── 3. a tall photograph on a vocabulary card ─────────────────────────────

test('a tall photograph on a vocabulary card is not reported as underfilling a panel nobody drew', (t) => {
  const dir = tmpDir(t);
  const { status, log } = build(dir, [{
    template: 'key-vocabulary', headerStyle: 'title', title: 'Key Vocabulary',
    speakerNotes: 'Say to children: significant.',
    words: [{ word: 'significant',
      definition: 'Someone is significant when what they did made a big difference to lots of people\'s lives, and people still remember them for it.',
      visual: { type: 'image', imagePath: 'tall.png', fit: 'contain', essential: true } }]
  }]);
  assert.equal(status, 0, log);
  assert.doesNotMatch(log, /FIGURE_ZONE_UNDERFILLED/, log);
});

// ─── 4. the last task slide and its check slide ────────────────────────────

// F-pshe slides 15-16 on the slide designer's second pass: the case and the
// criteria share a half of the slide by weights (2.25 and 3.2) that left the
// panel's cards one line tall, so a 41-character criterion was refused. The
// half had the room; the run found the weights that use it (2.45 and 4.2) only
// after further repair passes.
function chloeSlide(state) {
  return {
    template: 'split-h-50-50', primarySide: 'left', headerStyle: 'title',
    title: 'What was Chloe\'s day missing?',
    speakerNotes: 'Say to children: find what Chloe\'s day was missing.',
    primary: { type: 'stack', items: [
      { type: 'text', value: 'Use the photos to find where each of Chloe\'s foods goes, then answer both questions.', align: 'center', weight: 0.8 },
      { type: 'image', imagePath: 'photo.png', fit: 'contain', essential: true, weight: 3.8 },
      { type: 'text', value: state === 'question'
        ? 'Which food groups did Chloe have nothing from? What did that mean for her body?'
        : '||She had nothing from fruit and vegetables, or from protein.||',
      revealPair: { id: 'chloe', state }, align: 'center', weight: 1.8 }
    ] },
    secondary: { type: 'stack', items: [
      { type: 'text', value: 'Chloe really likes cheese. This is everything she ate on Saturday.\n\nBreakfast: a bowl of cereal with milk\nLunch: a cheese sandwich\nSnack: a chocolate biscuit\nTea: macaroni cheese',
        align: 'left', color: 'E46C0A', weight: 2.25 },
      { type: 'sc-panel', weight: 3.2, content: { type: 'steps', steps: [
        'Find the {{food group}} each food belongs to.',
        'Find the groups the day has <<nothing from>>.',
        'Say which job each missing group does for your body.',
        'Choose a food from that group and say how it would help.'
      ] } }
    ] }
  };
}

test('the Chloe task slide and its check slide lay out: the criteria panel takes the room its cards need', (t) => {
  const dir = tmpDir(t);
  const { status, log } = build(dir, [chloeSlide('question'), chloeSlide('answer')]);
  assert.equal(status, 0, log);
  assert.doesNotMatch(log, /STEP_TEXT_OVERLOAD|TEXT_OVERLOAD/, log);
});

// Rainforest slide 18 as delivered: the case text was given two parts in
// four and a bit, the question and the line to remember had room to spare
// under them, and the case was refused at 18pt.
function borneoSlide(state) {
  return {
    template: 'split-h-50-50', primarySide: 'left', headerStyle: 'title',
    title: 'Why is Borneo\'s rainforest getting smaller?',
    speakerNotes: 'Say to children: tell your partner first.',
    primary: { type: 'stack', items: [
      { type: 'text', weight: 2, value: 'Borneo is a big island in Asia. It\'s on the Equator, like the Amazon, so it has a tropical rainforest too.\n\n<<In Borneo, farmers have planted neat rows of oil palms, like the ones in this photo. Oil palm fruit is squeezed to make palm oil. Palm oil is sold all over the world, and it goes into foods like biscuits and chocolate spread.>>' },
      { type: 'text', weight: 1.5, revealPair: { id: 'borneo', state }, value: state === 'question'
        ? '[[Why is the rainforest in Borneo getting smaller?]]\n[[What was growing where the oil palms are now?]]\n\nTell your partner first. Then write your explanation.'
        : '[[Why is the rainforest in Borneo getting smaller?]]\n[[What was growing where the oil palms are now?]]\n||The rainforest in Borneo is getting smaller because farmers are cutting it down to make room for oil palms. They sell the palm oil, and it goes into foods like biscuits all over the world.' },
      { type: 'text', weight: 0.8, value: '✨ People cut down and dig up rainforests to get things they can sell: land to farm, wood and gold.' }
    ] },
    secondary: { type: 'stack', items: [
      { type: 'image', imagePath: 'photo.png', fit: 'contain', essential: true, weight: 1.3 },
      { type: 'sc-panel', weight: 1, content: { type: 'steps', steps: [
        'Say <<who>> is cutting down the trees.',
        'Say <<what they want the land for>>.',
        'Say <<what they sell>>. Join your ideas with because or so.'
      ] } }
    ] }
  };
}

test('the Borneo task slide and its check slide lay out: the case takes the room the lines under it do not use', (t) => {
  const dir = tmpDir(t);
  const { status, log } = build(dir, [borneoSlide('question'), borneoSlide('answer')]);
  assert.equal(status, 0, log);
  assert.doesNotMatch(log, /TEXT_OVERLOAD/, log);
});

// The Chloe slide as the first pass wrote it, with the line to remember in the
// same half as the case and the criteria: that half does not have the room at
// 18pt however it is shared, and the build says so rather than leaving the
// designer to move weights that cannot mend it.
test('a column that cannot hold its words at 18pt however it is shared says so', (t) => {
  const dir = tmpDir(t);
  const slide = chloeSlide('question');
  slide.secondary.items.push({ type: 'text', weight: 1,
    value: '✨ A balanced diet has food from every food group, because each group does a different job in your body.' });
  const answer = chloeSlide('answer');
  answer.secondary.items.push(JSON.parse(JSON.stringify(slide.secondary.items[2])));
  const { status, log } = build(dir, [slide, answer]);
  assert.notEqual(status, 0, 'this half really is too full at 18pt');
  assert.match(log, /need about \d+\.\d+in at the 18pt floor and have \d+\.\d+in, so no weights will fit them/, log);
});
