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
  'picture-top-cards': { lead: 'Enamel covers every tooth.', pictures: [picture(WIDE)], lines: ['Enamel is the hardest material.'],
    question: 'What does it protect?', sticky: 'Enamel never grows back.' },
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
  refuses(teachSlide('three-pictures-captions', { question: 'Where would this go?' }),
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
  refuses(teachSlide('picture-three-cards', { lines: ['One.'], sticky: undefined }), /cards with the picture take 3/);
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

// ─── a split Teach beat is still teaching on both halves ─────────────────
//
// The Tudor deck of 14 September 2026: one Teach beat was divided into a
// photograph with the label `A Tudor farm household` (all the notes on it)
// and every word on the next slide (no picture, no notes).

const TEACH_WITH_SCRIPT = [{ kind: 'teach', sourceUnitId: 'lesson-section/teaching-sequence/unit-001',
  speakerNotes: { script: 'Say to children: think about your home.' } }];

test('a half of a split Teach beat that is only a picture and a label is refused', (t) => {
  // 14 September 2026: the repair left a photograph captioned `A Tudor farm household`.
  const dir = tmpDir(t, 'teach-layouts-label-');
  const specPath = writeLesson(dir, [
    teachSlide('picture-with-statement', { designUnitId: 'lesson-section/teaching-sequence/unit-001',
      lead: 'A Tudor farm household' }),
    teachSlide('four-cards', { designUnitId: 'lesson-section/teaching-sequence/unit-001' })
  ]);
  designFor(dir, TEACH_WITH_SCRIPT);
  const result = runSlideDesignCheck(specPath);
  assert.equal(result.ok, false);
  assert.match(result.stdout, /TEACH_SPLIT_LEAVES_A_LABEL/);
  assert.match(result.stdout, /"slide":1/);
});

test('a half of a paced Teach beat may be a picture and one teaching sentence', (t) => {
  // 28 September 2026: "one slide with this picture ... And then maybe one more
  // slide, then do bit." A whole sentence of the explanation beside its picture teaches.
  const dir = tmpDir(t, 'teach-layouts-paced-');
  const specPath = writeLesson(dir, [
    teachSlide('picture-with-statement', { designUnitId: 'lesson-section/teaching-sequence/unit-001',
      lead: 'In Victorian London, lots of families lived squashed together in small, dirty houses.' }),
    teachSlide('four-cards', { designUnitId: 'lesson-section/teaching-sequence/unit-001' })
  ]);
  designFor(dir, TEACH_WITH_SCRIPT);
  const result = runSlideDesignCheck(specPath);
  assert.doesNotMatch(result.stdout || '', /TEACH_SPLIT_LEAVES_A_LABEL/);
});

test('a Teach card that repeats the slide title is refused', (t) => {
  // 22 September 2026: a repair moved history slide 4 to lead-picture-lines and
  // filled its one line with the title, and the split check counted it as teaching.
  const dir = tmpDir(t, 'teach-layouts-title-repeat-');
  const specPath = writeLesson(dir, [
    teachSlide('lead-picture-lines', { designUnitId: 'lesson-section/teaching-sequence/unit-001',
      title: 'Could Parliament shorten the working day?',
      lines: ['Could Parliament shorten the working day?'] }),
    teachSlide('four-cards', { designUnitId: 'lesson-section/teaching-sequence/unit-001' })
  ]);
  designFor(dir, TEACH_WITH_SCRIPT);
  const result = runSlideDesignCheck(specPath);
  assert.equal(result.ok, false);
  assert.match(result.stdout, /TEACH_LINE_REPEATS_TITLE/);
  assert.match(result.stdout, /"slide":1/);
});

test('a Teach line that shares words with the title but says more is allowed', (t) => {
  const dir = tmpDir(t, 'teach-layouts-title-near-');
  const specPath = writeLesson(dir, [
    teachSlide('lead-picture-lines', { designUnitId: 'lesson-section/teaching-sequence/unit-001',
      title: 'Could Parliament shorten the working day?',
      lines: ['Parliament could shorten the working day, but only by passing a law and checking it.'] })
  ]);
  designFor(dir, TEACH_WITH_SCRIPT);
  const result = runSlideDesignCheck(specPath);
  assert.doesNotMatch(result.stdout || '', /TEACH_LINE_REPEATS_TITLE/);
});

test('a Teach beat on one slide may be a picture with one statement', (t) => {
  // Discrimination: the big-fact slide is a shape in the catalogue; the fault
  // is a split that leaves one half with nothing to teach from.
  const dir = tmpDir(t, 'teach-layouts-one-statement-');
  const specPath = writeLesson(dir, [
    teachSlide('picture-with-statement', { designUnitId: 'lesson-section/teaching-sequence/unit-001' })
  ]);
  designFor(dir, TEACH_WITH_SCRIPT);
  const result = runSlideDesignCheck(specPath);
  assert.doesNotMatch(result.stdout || '', /TEACH_SPLIT_LEAVES_A_LABEL/);
});

test('every slide of a Teach beat carries its share of the script', (t) => {
  const dir = tmpDir(t, 'teach-layouts-script-');
  const specPath = writeLesson(dir, [
    teachSlide('lead-picture-lines', { designUnitId: 'lesson-section/teaching-sequence/unit-001' }),
    teachSlide('four-cards', { designUnitId: 'lesson-section/teaching-sequence/unit-001', speakerNotes: '' })
  ]);
  designFor(dir, TEACH_WITH_SCRIPT);
  const result = runSlideDesignCheck(specPath);
  assert.equal(result.ok, false);
  assert.match(result.stdout, /TEACH_SLIDE_WITHOUT_ITS_SCRIPT/);
  assert.match(result.stdout, /"slide":2/);
});

test('a Teach beat whose design has no script is not asked for one', (t) => {
  const dir = tmpDir(t, 'teach-layouts-no-script-');
  const specPath = writeLesson(dir, [
    teachSlide('lead-picture-lines', { designUnitId: 'lesson-section/teaching-sequence/unit-001', speakerNotes: '' })
  ]);
  designFor(dir, [{ kind: 'teach', sourceUnitId: 'lesson-section/teaching-sequence/unit-001',
    speakerNotes: { script: null } }]);
  const result = runSlideDesignCheck(specPath);
  assert.doesNotMatch(result.stdout || '', /TEACH_SLIDE_WITHOUT_ITS_SCRIPT/);
});

// ─── the child's quick task on a Teach slide ──────────────────────────────
//
// Three lessons of the twenty-lesson test (7 October 2026) gave children a
// quick job on a Teach slide and printed it black with no sign, because these
// layouts had no place for one. The teacher's rulings the next day: the job is
// blue with its sign, advice on how to go about it stays black on the same
// card, and two sentences that are both the job are both blue.

const TEACH_WITH_TASK = [{ kind: 'teach', sourceUnitId: 'lesson-section/teaching-sequence/unit-001',
  pupilInstruction: 'Write the two multiplications we need to do for 4,125 × 43. Don\'t work them out.',
  speakerNotes: { script: 'Say to children: look.' } }];

function taskCard(slide) {
  const [expanded] = expandTeachLayouts({ slides: [slide] }).slides;
  return texts(expanded).find((node) => node.teachTask === true);
}

test('a Teach slide\'s task is its own blue card with the sign it names', () => {
  const card = taskCard(teachSlide('lead-picture-lines', { question: undefined,
    task: { value: 'Write one word: yes or no.', signal: 'pencil' } }));
  assert.equal(card.value, 'Write one word: yes or no.');
  assert.equal(card.colorRole, 'task-blue');
  assert.equal(card.signal, 'pencil');
  assert.equal(card.adviceAfterBreaks, undefined);
});

test('the task may be the column\'s only card, where the lead has done the telling', () => {
  const card = taskCard(teachSlide('lead-picture-lines', { lines: undefined, task: 'Point to the tens digit.' }));
  assert.equal(card.value, 'Point to the tens digit.');
  assert.equal(card.signal, undefined);
});

test('advice shares the task\'s card and prints black under the blue job', () => {
  const { presentationRuns } = require('../src/presentation-text');
  const { COLOURS } = require('../src/styles');
  const card = taskCard(teachSlide('lead-picture-lines', { question: undefined, task: {
    value: 'Write the two multiplications we need to do for <<4,125 × 43>>.',
    advice: 'Don\'t work them out.', signal: 'pencil' } }));
  const runs = presentationRuns(card.value, true, COLOURS.body, card);
  const colourOf = (words) => runs.find((run) => run.text.includes(words)).options.color;
  const same = (a, b) => String(a).replace('#', '').toUpperCase() === String(b).replace('#', '').toUpperCase();
  assert.ok(same(colourOf('Write the two'), COLOURS.title), 'the job is blue');
  assert.ok(same(colourOf('work them out'), COLOURS.body), 'the advice is black');
  assert.ok(!same(colourOf('4,125'), COLOURS.title) && !same(colourOf('4,125'), COLOURS.body),
    'a supplied number keeps its own colour');
});

test('a task takes no sizing, no other colour and no sign the deck keeps for answers', () => {
  refuses(teachSlide('lead-picture-lines', { task: { value: 'Write it.', fontSize: 40 } }), /fontSize cannot be set on the task/);
  refuses(teachSlide('lead-picture-lines', { task: { value: 'Write it.', signal: 'tick' } }), /pencil, talk, magnifier/);
  refuses(teachSlide('picture-with-statement', { task: 'Write it.' }), /nowhere to put "task".*lead-picture-lines/);
});

test('a Teach unit\'s instruction left in an explanation line is refused', (t) => {
  const dir = tmpDir(t, 'teach-layouts-task-black-');
  const specPath = writeLesson(dir, [teachSlide('lead-picture-lines', {
    designUnitId: 'lesson-section/teaching-sequence/unit-001',
    lines: ['Write the two multiplications we need to do for <<4,125 × 43>>.\n\nDon\'t work them out.'] })]);
  designFor(dir, TEACH_WITH_TASK);
  const result = runSlideDesignCheck(specPath);
  assert.equal(result.ok, false);
  assert.match(result.stdout, /TEACH_TASK_OUTSIDE_ITS_SLOT/);
});

test('the same instruction in the task place passes, two sentences and all', (t) => {
  const dir = tmpDir(t, 'teach-layouts-task-blue-');
  const specPath = writeLesson(dir, [
    teachSlide('lead-picture-lines', { designUnitId: 'lesson-section/teaching-sequence/unit-001', question: undefined,
      task: { value: 'Write the two multiplications we need to do for <<4,125 × 43>>.',
        advice: 'Don\'t work them out.', signal: 'pencil' } }),
    teachSlide('four-cards', { designUnitId: 'lesson-section/teaching-sequence/unit-002', sticky: undefined,
      task: { value: 'Decide who has eaten more.\nWrite Chidi, Ali or the same.', signal: 'pencil' } })
  ]);
  designFor(dir, TEACH_WITH_TASK.concat([{ kind: 'teach', sourceUnitId: 'lesson-section/teaching-sequence/unit-002',
    pupilInstruction: 'Decide who has eaten more. Write Chidi, Ali or the same.',
    speakerNotes: { script: 'Say to children: look.' } }]));
  const result = runSlideDesignCheck(specPath);
  assert.doesNotMatch(result.stdout || '', /TEACH_TASK_OUTSIDE_ITS_SLOT|TASK_BLUE_NOT_A_SHORT_TASK|BLUE_WITHOUT_A_QUESTION|TEACH_LAYOUT/);
});

test('a Teach slide with no instruction in its design is not asked for a task', (t) => {
  const dir = tmpDir(t, 'teach-layouts-task-none-');
  const specPath = writeLesson(dir, [teachSlide('lead-picture-lines', {
    designUnitId: 'lesson-section/teaching-sequence/unit-001' })]);
  designFor(dir, TEACH_WITH_SCRIPT);
  const result = runSlideDesignCheck(specPath);
  assert.doesNotMatch(result.stdout || '', /TEACH_TASK_OUTSIDE_ITS_SLOT/);
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
