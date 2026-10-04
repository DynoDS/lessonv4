'use strict';

// The banner above a picture was one line tall whatever its sentence, so a
// headline longer than about 68 characters was refused. Eight of ten slide
// runs hit that on 4 October 2026, forty refusals between them, and each time
// the designer moved the headline off its own slide or gave the layout up. The
// banner now takes the lines its lead needs, up to three.

const assert = require('node:assert/strict');
const test = require('node:test');
const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawBodySidebar } = require('../src/templates/body-sidebar');

const SHORT = 'Moving gives your brain a break.';
const LONG = 'Your mouth and your stomach squash your food and mix it with liquid until it is a runny soup.';
const PARAGRAPH = Array.from({ length: 6 }, () => LONG).join(' ');

function draw(lead) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  const page = pptx.addSlide();
  const texts = [];
  const slide = new Proxy(page, {
    get(target, prop) {
      if (prop === 'addText') return (text, o) => { texts.push(Object.assign({ text }, o)); return target.addText(text, o); };
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  const data = {
    template: 'body-sidebar', headerStyle: 'title', title: 'How does your body break food down?',
    banner: { type: 'text', value: lead, align: 'center' },
    body: { type: 'text', value: 'The picture goes here.' },
    sidebar: { type: 'text', value: 'A key point.' }
  };
  drawBodySidebar(pptx, slide, data, { slideIndex: 0, lesson: { slides: [data] }, cardLook: true });
  const flat = (t) => (Array.isArray(t) ? t.map((r) => r.text).join('') : String(t));
  const banner = texts.find((t) => flat(t.text).includes(lead.slice(0, 20)));
  const body = texts.find((t) => flat(t.text).includes('The picture goes here.'));
  return { banner, body };
}

test('a one-line lead keeps the one-line banner', () => {
  const { banner } = draw(SHORT);
  assert.ok(banner.h <= 0.71, `banner is ${banner.h}in`);
});

test('a headline of a full sentence gets a taller banner, and the picture starts under it', () => {
  const short = draw(SHORT);
  const long = draw(LONG);
  assert.ok(long.banner.h > short.banner.h + 0.1, `one line ${short.banner.h}in, two lines ${long.banner.h}in`);
  assert.ok(long.body.y > short.body.y + 0.1, 'the picture moves down by what the banner took');
  assert.ok(long.body.y >= long.banner.y + long.banner.h, 'and never sits under the banner');
});

test('the banner stops at three lines: a paragraph does not take the room of the picture', () => {
  const long = draw(LONG);
  const paragraph = draw(PARAGRAPH);
  assert.ok(paragraph.banner.h <= 1.31, `banner is ${paragraph.banner.h}in`);
  assert.ok(paragraph.body.y - long.body.y < 0.6, 'the picture keeps most of its height');
});
