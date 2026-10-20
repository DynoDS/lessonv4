'use strict';

// A word bank and the task it serves are sized together.
//
// A Year 4 history writing slide (20 October 2026) stacked "Write your own
// explanation." over a four-word bank. The bank grew into the room the one-line
// task left: "flooding" and "new land" at 54pt under a 32pt task. The teacher
// wanted both large rather than the bank held down, so a lone task line now
// grows with its bank: their words share one fit group, settled to one size by
// fit_text_postprocess.py. Several lines over a bank keep their size, and the
// bank takes it as its ceiling.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { drawStack } = require('../src/content/stack');
const { drawChipBank } = require('../src/content/chip-bank');

const WORDS = ['flooding', 'new land', 'guarding', 'Ireland'];
const ZONE = { x: 0.22, y: 1.0, w: 7.6, h: 6.0, class: 'E-wide' };
const BANK = { type: 'chip-bank', title: 'Words to use', variant: 'yellow', chips: WORDS, weight: 1 };

function draw(fn, zone, data) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
  pptx.layout = 'W';
  const slide = pptx.addSlide();
  fn(pptx, slide, zone, data, { slideIndex: 0 });
  return (slide._slideObjects || []).filter((o) => o._type === 'text');
}

function find(texts, words) {
  const found = texts.find((o) => JSON.stringify(o.text || '').includes(words));
  assert.ok(found, `"${words}" was not drawn`);
  return found.options;
}

// GROWFIT__<group>__<ceiling>__<label>
function growGroup(options) {
  const match = /^GROWFIT__(.+?)__\d+__/.exec(options.objectName || '');
  return match ? match[1] : null;
}

test('a lone task line and its bank settle on one size, both allowed to grow large', () => {
  const texts = draw(drawStack, ZONE, {
    type: 'stack', verticalAlign: 'center', heightRatio: 0.8,
    items: [{ type: 'text', value: 'Write your own explanation.', colorRole: 'task-blue', weight: 0.6 }, BANK]
  });
  const task = find(texts, 'Write your own');
  const group = growGroup(task);
  assert.ok(group, 'the task line joined no fit group, so it cannot grow');
  WORDS.forEach((word) => assert.equal(growGroup(find(texts, word)), group, `"${word}" is sized apart from the task`));
  // The task can grow past its usual 32pt to meet the bank.
  assert.ok(Number(/__(\d+)__/.exec(task.objectName)[1]) > 40, task.objectName);
});

test('several lines over a bank keep their size, and the bank prints no larger', () => {
  const texts = draw(drawStack, ZONE, {
    type: 'stack',
    items: [
      { type: 'text', value: 'Tell your partner why the Anglo-Saxons came.', colorRole: 'task-blue' },
      { type: 'text', value: 'Start with their fields.' },
      Object.assign({}, BANK, { weight: 0.8 })
    ]
  });
  const task = find(texts, 'Tell your partner').fontSize;
  WORDS.forEach((word) => {
    const size = find(texts, word).fontSize;
    assert.ok(size <= task, `"${word}" printed at ${size}pt over a ${task}pt task`);
  });
});

test('a bank with the zone to itself still grows to be read across the room', () => {
  const texts = draw(drawChipBank, ZONE, BANK);
  assert.ok(find(texts, 'flooding').fontSize > 40, `a bank alone printed at ${find(texts, 'flooding').fontSize}pt`);
});
