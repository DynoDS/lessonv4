'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const test = require('node:test');
const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const JSZip = requireGlobal('jszip');
const { drawContent } = require('../src/content');
const { measureText } = require('../src/content/text');
const { ordinaryRevealWarnings } = require('../scripts/check-slide-design');

const zone = { x: 0.5, y: 1, w: 12, h: 5.5, class: 'A' };
const fixture = path.join(__dirname, 'fixtures', 'ordinary-reveal-grammar');

function grammar() {
  return JSON.parse(fs.readFileSync(path.join(fixture, 'lesson.json'), 'utf8'));
}

function tagPair(spec) {
  for (let i = 1; i <= 3; i += 1) {
    spec.slides[0].body.items[i].revealPair = { id: `grammar-${i}`, state: 'question' };
    spec.slides[1].body.items[i].revealPair = { id: `grammar-${i}`, state: 'answer' };
  }
  return spec;
}

async function shapes(spec) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  spec.slides.forEach((source, slideIndex) => {
    drawContent(pptx, pptx.addSlide(), zone, source.body,
      { lesson: spec, slideIndex, cardLook: true, imageDims: {} });
  });
  const zip = await JSZip.loadAsync(await pptx.write({ outputType: 'nodebuffer' }));
  return Promise.all([1, 2].map(async (n) => {
    const xml = await zip.file(`ppt/slides/slide${n}.xml`).async('string');
    return [...xml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].map((match) => match[0]);
  }));
}

function geometry(shape) {
  const pos = /<a:off x="(\d+)" y="(\d+)"\/>/.exec(shape);
  const size = /<a:ext cx="(\d+)" cy="(\d+)"\/>/.exec(shape);
  assert.ok(pos && size);
  return [...pos.slice(1), ...size.slice(1)];
}

test('the actual unpaired grammar output fails the source-authoritative design guard', () => {
  const spec = grammar();
  const warnings = ordinaryRevealWarnings(spec, path.join(fixture, 'lesson.json'));
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].signal, 'ORDINARY_REVEAL_UNPAIRED');
  assert.equal(warnings[0].slide, 2);
  assert.deepEqual(ordinaryRevealWarnings(tagPair(spec), path.join(fixture, 'lesson.json')), []);
  delete spec.slides[1].body.items[2].revealPair;
  assert.equal(ordinaryRevealWarnings(spec, path.join(fixture, 'lesson.json'))[0].signal,
    'ORDINARY_REVEAL_UNPAIRED', 'one tagged sibling cannot hide an unpaired answer');
});

test('the source guard leaves model answers and structured visual completions to their design', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ordinary-reveal-design-'));
  try {
    const source = JSON.parse(fs.readFileSync(path.join(fixture, 'lesson-design.json'), 'utf8'));
    source.teachingSequence[0].answer.kind = 'model';
    fs.writeFileSync(path.join(dir, 'lesson-design.json'), JSON.stringify(source));
    assert.deepEqual(ordinaryRevealWarnings(grammar(), path.join(dir, 'lesson.json')), []);
    source.teachingSequence[0].answer.kind = 'exact';
    source.teachingSequence[0].answer.structure = { kind: 'sort' };
    fs.writeFileSync(path.join(dir, 'lesson-design.json'), JSON.stringify(source));
    assert.deepEqual(ordinaryRevealWarnings(grammar(), path.join(dir, 'lesson.json')), []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('nested grammar text leaves share exact static geometry and a cross-slide fit group', async () => {
  const spec = tagPair(grammar());
  spec.slides[1].body.items[3].value = '||We carried the bags carefully along the narrow path, all the way to the school gate.';
  const [question, answer] = await shapes(spec);
  assert.equal(question.length, answer.length);
  assert.deepEqual(question.map(geometry), answer.map(geometry));
  assert.equal(question.filter((shape) => /GROWFIT__revealpair-/.test(shape)).length, 3);
  assert.equal(answer.filter((shape) => /GROWFIT__revealpair-/.test(shape)).length, 3);
});

test('text pairs also keep geometry when their leaves sit inside a row', async () => {
  const spec = tagPair(grammar());
  spec.slides.forEach((slide) => {
    slide.body = { type: 'row', items: slide.body.items.slice(1) };
  });
  const [question, answer] = await shapes(spec);
  assert.deepEqual(question.map(geometry), answer.map(geometry));
});

test('paired text rejects changed metadata, mismatched field shape and missing authored reveal', () => {
  const spec = tagPair(grammar());
  spec.slides[1].body.items[2].fontSize = 32;
  assert.throws(() => drawContent(new PptxGenJS(), new PptxGenJS().addSlide(), zone,
    spec.slides[0].body, { lesson: spec, slideIndex: 0, cardLook: true, imageDims: {} }),
  /REVEAL_PAIR_LAYOUT/);
  spec.slides[1].body.items[2].fontSize = 34;
  spec.slides[1].body.items[2].text = spec.slides[1].body.items[2].value;
  delete spec.slides[1].body.items[2].value;
  assert.throws(() => measureText(zone, spec.slides[0].body.items[2], { lesson: spec }),
    /REVEAL_PAIR_LAYOUT|same value\/text field shape/);
  spec.slides[1].body.items[2].value = spec.slides[1].body.items[2].text;
  delete spec.slides[1].body.items[2].text;
  spec.slides[1].body.items[2].value = 'She ran to the shop.';
  assert.throws(() => measureText(zone, spec.slides[0].body.items[2], { lesson: spec }),
    /authored \|\| answer reveal/);
  spec.slides[1].body.items[2].value = '';
  assert.throws(() => drawContent(new PptxGenJS(), new PptxGenJS().addSlide(), zone,
    spec.slides[1].body.items[2], { lesson: spec, slideIndex: 1, cardLook: false, imageDims: {} }),
  /nonempty question text/);
});

test('ordinary unpaired text still hugs and an explicit long-model fill still spans its zone', () => {
  const ordinary = { type: 'text', value: '||The answer is clear.' };
  assert.ok(measureText(zone, ordinary, {}).h < zone.h);
  assert.equal(measureText(zone, { ...ordinary, heightMode: 'fill' }, {}), null);
});
