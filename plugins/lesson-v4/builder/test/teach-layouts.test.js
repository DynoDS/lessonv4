'use strict';

// Teach slides are built from named layouts, and the built deck is what is tested.
//
// On 12 September 2026 the teacher asked for teaching that is not one black block.
// The repair was a paragraph naming three good shapes, and its tests checked that
// the paragraph existed. The next deck the plugin made unsupervised (Year 4 RE,
// 13 September) put a picture on one half and a column of equal cards on the other
// on every Teach slide, and every one of those tests still passed. So these tests
// build decks and read what came out: which arrangement, which alignment, which
// text size each card settled on.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const JSZip = require('jszip');

const { LAYOUTS, expandTeachLayouts, TeachLayoutError } = require('../src/teach-layouts');
const { runSlideDesignCheck } = require('../scripts/check-slide-design');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATES_MD = path.resolve(ROOT, '..', 'references', 'templates.md');

const WIDE = path.join(ROOT, 'assets', 'science', 'water-cycle.png');
const TALL = path.join(ROOT, 'assets', 'children', 'bailey.png');

function picture(file) {
  return { type: 'image', imagePath: path.basename(file), essential: false };
}

// One filled example per layout: the smallest set of slots it accepts, plus the
// optional ones where the layout arranges them, so every branch is drawn.
const EXAMPLES = {
  'lead-picture-lines': { lead: 'A candle can hold a belief and a memory.', pictures: [picture(WIDE)],
    lines: ['Many Christians light a candle to remember Jesus.', { value: 'Its light can stand for hope.', orange: true }],
    question: 'What might a candle remind someone of?', sticky: 'One object can mean more than one thing.' },
  'picture-top-cards': { pictures: [picture(WIDE)], lines: ['Enamel is the hardest material.', 'It takes every bite.', 'It never grows back.'] },
  'two-pictures-captions': { pictures: [picture(WIDE), picture(WIDE)], captions: ['Skipping works your heart.', 'Balancing works your muscles.'], sticky: 'Movement helps in different ways.' },
  'question-lines-picture': { question: 'What is under the enamel?', pictures: [picture(TALL)], lines: ['A layer called dentine.', 'It makes up most of the tooth.'], sticky: 'Dentine is under the enamel.' },
  'compare-pictures': { sides: [{ heading: 'enamel', picture: picture(TALL), text: 'The hard covering.' }, { heading: 'dentine', picture: picture(TALL), text: 'The layer underneath.' }], headingRole: 'vocabulary' },
  'picture-statement-question': { pictures: [picture(TALL)], lead: 'The cross can stand for love and hope.', question: 'Why might someone wear one?' },
  'picture-three-cards': { pictures: [picture(WIDE)], lines: ['Her arms push the brush.', 'Her legs walk her round.'], sticky: 'Jobs make muscles work together.' },
  'three-pictures-captions': { pictures: [picture(WIDE), picture(WIDE), picture(WIDE)], captions: ['Skipping.', 'Balancing.', 'Sweeping.'] },
  'zigzag': { pictures: [picture(TALL), picture(TALL)], lines: ['A healthy tooth is covered.', 'A chip takes enamel away.'] },
  'big-fact-picture': { lead: 'Enamel is the hardest material in your body.', pictures: [picture(TALL)], sticky: 'Enamel covers the top of a tooth.' },
  'labelled-picture-lines': { pictures: [{ type: 'label-diagram', imagePath: path.basename(WIDE), layout: 'sides', callouts: [{ anchor: [30, 30], label: 'cloud', given: true }] }], lines: ['Water rises as vapour.', 'It cools into clouds.'] },
  'question-picture-answer': { question: 'Why does a cold drink hurt?', pictures: [picture(TALL)], lines: ['Tubes carry the cold inwards.'] },
  'banner-picture-sidebar': { lead: 'Moving gives your brain a break.', pictures: [picture(WIDE)], lines: ['It can lift your mood.', 'It can help you feel calm.'] },
  'picture-steps': { pictures: [picture(TALL)], steps: ['A tooth bites something hard.', 'A piece breaks off.'] },
  'picture-with-statement': { pictures: [picture(WIDE)], lead: 'The same object can mean different things.' },
  'one-speaker': { pictures: [picture(WIDE)], speakers: [{ name: 'Sam', child: 'mr-sear', speech: 'A candle is only for light.' }] },
  'two-speakers': { statement: 'A symbol can matter in different ways.', speakers: [{ name: 'Chloe', child: 'miss-brooker', speech: 'It reminds me of church.' }, { name: 'Sam', child: 'mr-sear', speech: 'It reminds me of my grandad.' }] },
  'statement-support-sticky': { lead: 'A symbol stands for something else.', lines: ['It sends a message without words.'], sticky: 'A symbol works when people know it.' },
  'two-cards-bar': { lines: ['Knowing about a belief.', { value: 'Believing it yourself.', orange: true }], sticky: 'You can understand without sharing.' },
  'lead-three-cards': { lead: 'Symbols are all around us.', lines: ['Send a message.', 'Stand for a belief.', 'Remind us of someone.'] },
  'four-cards': { lines: ['Your heart gets stronger.', 'Your muscles get stronger.', 'You can feel calmer.'], sticky: 'Moving helps body and mind.' },
  'question-answer-sticky': { question: 'Why does enamel matter?', lines: ['A chip stays for good.'], sticky: 'Enamel cannot repair itself.' },
  'steps': { steps: ['Brush twice a day.', 'Spit, do not rinse.', 'Visit the dentist.'] },
  'compare-words': { sides: [{ heading: 'preference', text: 'Liking a colour.' }, { heading: 'belief', text: 'Accepting something is true.' }], headingRole: 'vocabulary' },
  'word-meaning-example': { columns: [{ heading: 'Word', text: 'represent' }, { heading: 'Meaning', text: 'To stand for.' }, { heading: 'Example', text: 'A triangle means play.' }] },
  'question-three-answers': { question: 'What might a candle mean?', answers: ['Light.', 'Jesus.', 'A memory.'] },
  'source-text': { lead: 'A boy wrote this in 1833.', extract: 'We are called at five in the morning and work until eight at night.', lines: ['Long days.', 'Hard work.'], question: 'What does it tell us?' }
};

function teachSlide(layout, extra) {
  return Object.assign({ template: 'teach-layout', layout, headerStyle: 'title', title: `Layout ${layout}`,
    speakerNotes: 'Say to children: look.' }, JSON.parse(JSON.stringify(EXAMPLES[layout])), extra || {});
}

function tmpDir(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.copyFileSync(WIDE, path.join(dir, path.basename(WIDE)));
  fs.copyFileSync(TALL, path.join(dir, path.basename(TALL)));
  return dir;
}

function writeLesson(dir, slides) {
  const specPath = path.join(dir, 'lesson.json');
  fs.writeFileSync(specPath, JSON.stringify({ lessonName: 'Teach layouts', yearGroup: 'Year 4',
    subject: 'Science', lo: 'To test layouts', slides }));
  return specPath;
}

function strings(node, out = []) {
  if (typeof node === 'string') out.push(node);
  else if (Array.isArray(node)) node.forEach((v) => strings(v, out));
  else if (node && typeof node === 'object') Object.values(node).forEach((v) => strings(v, out));
  return out;
}

function texts(node, out = []) {
  if (Array.isArray(node)) node.forEach((v) => texts(v, out));
  else if (node && typeof node === 'object') {
    if (node.type === 'text') out.push(node);
    Object.values(node).forEach((v) => texts(v, out));
  }
  return out;
}

// ─── every approved arrangement builds ───────────────────────────────

test('every layout in the catalogue has an example here, so none ships untested', () => {
  assert.deepEqual(Object.keys(EXAMPLES).sort(), Object.keys(LAYOUTS).sort());
});

test('a deck using every layout builds, one slide per layout', (t) => {
  const dir = tmpDir(t, 'teach-layouts-all-');
  const layouts = Object.keys(LAYOUTS);
  const specPath = writeLesson(dir, layouts.map((name) => teachSlide(name)));
  const result = spawnSync(process.execPath, [path.join(ROOT, 'build.js'), specPath, dir], { encoding: 'utf8' });
  const log = (result.stdout || '') + (result.stderr || '');
  assert.equal(result.status, 0, log);
  assert.match(result.stdout, /^Wrote:/m);
  const deck = fs.readdirSync(dir).find((n) => n.endsWith('.pptx'));
  assert.ok(deck, 'no deck written');
});

// ─── the standard, read from the built file ──────────────────────────

async function slideShapes(deckPath, slideNumber) {
  const zip = await JSZip.loadAsync(fs.readFileSync(deckPath));
  const xml = await zip.file(`ppt/slides/slide${slideNumber}.xml`).async('string');
  return xml.split('<p:sp>').slice(1).map((block) => ({
    name: (block.match(/<p:cNvPr[^>]*name="([^"]*)"/) || [])[1] || '',
    text: (block.match(/<a:t>([^<]*)<\/a:t>/g) || []).map((m) => m.replace(/<\/?a:t>/g, '')).join(''),
    sizes: (block.match(/<a:rPr[^>]*\ssz="(\d+)"/g) || []).map((m) => Number(m.match(/sz="(\d+)"/)[1])),
    centred: /algn="ctr"/.test(block)
  }));
}

test('a column of cards beside a picture comes out centred and at one text size', async (t) => {
  const dir = tmpDir(t, 'teach-layouts-column-');
  // Deliberately uneven lines: before this, the short one grew large beside the long one.
  const slide = teachSlide('lead-picture-lines', {
    lines: ['Short line.', 'A much longer line that has far more words in it than the short line does.'],
    question: 'Why?'
  });
  delete slide.sticky;
  const specPath = writeLesson(dir, [slide]);
  const result = spawnSync(process.execPath, [path.join(ROOT, 'build.js'), specPath, dir], { encoding: 'utf8' });
  assert.equal(result.status, 0, (result.stdout || '') + (result.stderr || ''));
  const deck = path.join(dir, fs.readdirSync(dir).find((n) => n.endsWith('.pptx')));
  const cards = (await slideShapes(deck, 1)).filter((s) => s.name.includes('size-column'));
  assert.equal(cards.length, 3, 'the three column cards should share one size group');
  cards.forEach((c) => assert.ok(c.centred, `"${c.text}" is not centred`));
  const settled = cards.map((c) => Math.max(...c.sizes));
  assert.equal(new Set(settled).size, 1, `column cards settled on different sizes: ${settled.join(', ')}`);
});

test('captions under a row of pictures settle on one text size', async (t) => {
  const dir = tmpDir(t, 'teach-layouts-captions-');
  const specPath = writeLesson(dir, [teachSlide('three-pictures-captions', {
    captions: ['Up.', 'Across the middle of the page.', 'A caption with a good many more words than either of the others.']
  })]);
  const result = spawnSync(process.execPath, [path.join(ROOT, 'build.js'), specPath, dir], { encoding: 'utf8' });
  assert.equal(result.status, 0, (result.stdout || '') + (result.stderr || ''));
  const deck = path.join(dir, fs.readdirSync(dir).find((n) => n.endsWith('.pptx')));
  const captions = (await slideShapes(deck, 1)).filter((s) => s.name.includes('size-captions'));
  assert.equal(captions.length, 3);
  assert.equal(new Set(captions.map((c) => Math.max(...c.sizes))).size, 1);
});

// ─── the expansion keeps every word and owns the look ──────────────────

for (const name of Object.keys(LAYOUTS)) {
  test(`${name}: every word supplied reaches the slide, centred`, () => {
    const slide = teachSlide(name);
    const [expanded] = expandTeachLayouts({ slides: [slide] }).slides;
    assert.notEqual(expanded.template, 'teach-layout');
    const written = strings(expanded).join('\n');
    for (const key of ['lead', 'lines', 'question', 'sticky', 'captions', 'statement', 'steps', 'answers', 'extract']) {
      strings(slide[key]).forEach((words) => {
        if (words === true) return;
        assert.ok(written.includes(words), `"${words}" from ${key} did not reach the slide`);
      });
    }
    texts(expanded)
      .filter((item) => item.value !== (slide.extract || null))
      .forEach((item) => assert.equal(item.align, 'center', `"${item.value}" is not centred`));
  });
}

// ─── what it refuses, and why ────────────────────────────────────

function refuses(slide, pattern) {
  assert.throws(() => expandTeachLayouts({ slides: [slide] }), (error) => {
    assert.ok(error instanceof TeachLayoutError);
    assert.match(error.message, pattern);
    return true;
  });
}

test('a slot the layout cannot place is refused, not dropped', () => {
  refuses(teachSlide('picture-top-cards', { question: 'Where would this go?' }),
    /nowhere to put "question".*Layouts that use "question"/);
});

test('an unknown layout names the catalogue', () => {
  refuses(teachSlide('steps', { layout: 'picture-left-cards-right' }), /not a teach layout\. Choose one of: lead-picture-lines/);
});

test('sizing and alignment belong to the layout', () => {
  refuses(teachSlide('picture-top-cards', { lines: [{ value: 'A.', fontSize: 40 }, 'B.'] }), /fontSize cannot be set/);
  refuses(teachSlide('picture-top-cards', { lines: [{ value: 'A.', align: 'left' }, 'B.'] }), /align cannot be set/);
});

test('orange stays one explanation line, and never a question, a sticky or a taught word', () => {
  refuses(teachSlide('two-cards-bar', { lines: [{ value: 'A.', orange: true }, { value: 'B.', orange: true }] }), /2 lines are orange/);
  refuses(teachSlide('picture-statement-question', { question: { value: 'Why?', orange: true } }), /question stays blue/);
  refuses(teachSlide('question-answer-sticky', { sticky: { value: 'Keep this.', orange: true } }), /stays purple/);
  refuses(teachSlide('picture-top-cards', { lines: [{ value: 'A belief is...', orange: true, emphasis: [{ text: 'belief', role: 'vocabulary' }] }, 'B.'] }), /vocabulary green/);
});

test('counts are checked against what the layout arranges', () => {
  refuses(teachSlide('three-pictures-captions', { captions: ['One.', 'Two.'] }), /takes 3 captions; found 2/);
  refuses(teachSlide('picture-three-cards', { lines: ['One.'], sticky: undefined }), /cards beside the picture take 3/);
});

test('two key questions fit a column layout and are refused where there is one place', () => {
  const [ok] = expandTeachLayouts({ slides: [teachSlide('lead-picture-lines', { question: ['First?', 'Second?'], sticky: undefined })] }).slides;
  const written = strings(ok).join('\n');
  assert.ok(written.includes('First?') && written.includes('Second?'));
  refuses(teachSlide('question-picture-answer', { question: ['First?', 'Second?'] }), /one place for a question/);
});

// ─── the gate ───────────────────────────────────────────────────

function designFor(dir, units) {
  fs.writeFileSync(path.join(dir, 'lesson-design.json'), JSON.stringify({ teachingSequence: units }));
}

test('a Teach unit built from free zones is refused by the design check', (t) => {
  const dir = tmpDir(t, 'teach-layouts-gate-');
  const specPath = writeLesson(dir, [{ template: 'split-h-60-40', headerStyle: 'title', title: 'Old way',
    designUnitId: 'lesson-section/teaching-sequence/unit-001',
    primary: picture(WIDE), secondary: { type: 'text', value: 'A candle.' } }]);
  designFor(dir, [{ kind: 'teach', sourceUnitId: 'lesson-section/teaching-sequence/unit-001' }]);
  const result = runSlideDesignCheck(specPath);
  assert.equal(result.ok, false);
  assert.match(result.stdout, /TEACH_SLIDE_NEEDS_TEACH_LAYOUT/);
});

test('a Do slide built from free zones is left alone', (t) => {
  // Discrimination: only Teach units are routed to teach layouts.
  const dir = tmpDir(t, 'teach-layouts-do-');
  const specPath = writeLesson(dir, [{ template: 'split-h-60-40', headerStyle: 'title', title: 'Your go',
    designUnitId: 'lesson-section/teaching-sequence/unit-002',
    primary: picture(WIDE), secondary: { type: 'text', value: 'Label the picture.' } }]);
  designFor(dir, [{ kind: 'do', sourceUnitId: 'lesson-section/teaching-sequence/unit-002' }]);
  const result = runSlideDesignCheck(specPath);
  assert.doesNotMatch(result.stdout || '', /TEACH_SLIDE_NEEDS_TEACH_LAYOUT/);
});

test('two Teach slides in a row sharing a layout are refused', (t) => {
  const dir = tmpDir(t, 'teach-layouts-repeat-');
  const specPath = writeLesson(dir, [
    teachSlide('picture-top-cards', { designUnitId: 'lesson-section/teaching-sequence/unit-001' }),
    teachSlide('picture-top-cards', { designUnitId: 'lesson-section/teaching-sequence/unit-003' })
  ]);
  const result = runSlideDesignCheck(specPath);
  assert.equal(result.ok, false);
  assert.match(result.stdout, /TEACH_LAYOUT_REPEATED/);
});

test('one Teach unit carried over two slides may keep its layout', (t) => {
  const dir = tmpDir(t, 'teach-layouts-same-unit-');
  const specPath = writeLesson(dir, [
    teachSlide('picture-top-cards', { designUnitId: 'lesson-section/teaching-sequence/unit-001' }),
    teachSlide('picture-top-cards', { designUnitId: 'lesson-section/teaching-sequence/unit-001' })
  ]);
  const result = runSlideDesignCheck(specPath);
  assert.doesNotMatch(result.stdout || '', /TEACH_LAYOUT_REPEATED/);
});

// ─── the catalogue the designer reads is the catalogue that exists ─────────

test('templates.md lists every layout the builder has, and no other', () => {
  const doc = fs.readFileSync(TEMPLATES_MD, 'utf8');
  const start = doc.indexOf('#### `teach-layout`');
  const end = doc.indexOf('#### `teach-compare`', start);
  const section = doc.slice(start, end);
  const listed = [...section.matchAll(/^\| `([a-z-]+)` \|/gm)].map((m) => m[1]);
  assert.deepEqual(listed.sort(), Object.keys(LAYOUTS).sort());
});
