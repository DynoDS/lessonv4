"""Release 7A (4.2.293), step 3's test (added after the first check, which
found the promise untested): the tall-picture starter never prints the slide's
`title` under "Starter", and prints a `heading` the starter carries (settled
item 4, his "Just the starter heading that's underlined is enough"; the
catalogue's 2.8 says so)."""
from _patch import write

write("builder/test/starter-question-tall-title.test.js", """'use strict';

// The tall-picture starter prints a heading the starter deliberately carries
// under "Starter", and never the slide's title: the teacher wants the underlined
// heading alone ("Just the starter heading that's underlined is enough";
// release 7A, `templates.md` 2.8). The example is his Year 4 science starter,
// "Teeth and their jobs".

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawStarterQuestionTall } = require('../src/templates/starter-question-tall');

function draw(data) {
  const texts = [];
  const slide = {
    addText: (content) => texts.push(typeof content === 'string' ? content : JSON.stringify(content)),
    addShape: () => {},
    addImage: () => {},
  };
  drawStarterQuestionTall(new PptxGenJS(), slide, data, { slideIndex: 0, imageDims: {}, cardLook: true });
  return texts;
}

test("a tall-picture starter never prints the slide's title", () => {
  const texts = draw({ title: 'Teeth and their jobs', lo: 'To name the layers of teeth' });
  assert.ok(texts.includes('Starter'), 'the heading is the word Starter');
  assert.ok(texts.every((t) => !t.includes('Teeth and their jobs')), texts.join(' | '));
});

test('a heading the tall-picture starter carries prints under Starter', () => {
  const texts = draw({ title: 'Teeth and their jobs', heading: 'Which teeth cut food?', lo: 'To name the layers of teeth' });
  assert.ok(texts.includes('Which teeth cut food?'), texts.join(' | '));
  assert.ok(texts.every((t) => !t.includes('Teeth and their jobs')), texts.join(' | '));
});
""")
print("tall-picture starter test written")
