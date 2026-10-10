'use strict';

// "Fractions should always be top and bottom" (the teacher, 9 October 2026, on
// a Year 4 sheet that printed a fraction wall of stacked fractions above the
// sentence "2/5 and 4/10 are the same amount").

const test = require('node:test');
const assert = require('node:assert/strict');
const { stackFractionsInHtml, unstackFractionsInHtml, FRACTION } = require('../text/stacked-fractions');

const stacked = (top, bottom) => `<span class="sfr"><span class="sfr-n">${top}</span><span class="sfr-bar"></span><span class="sfr-d">${bottom}</span></span>`;

test('a fraction typed in a sentence is set top and bottom', () => {
  assert.equal(
    stackFractionsInHtml('<p>2/5 and 4/10 are the same amount.</p>'),
    `<p>${stacked(2, 5)} and ${stacked(4, 10)} are the same amount.</p>`
  );
  assert.equal(stackFractionsInHtml('<p>Not 1/2: that has 5.</p>'), `<p>Not ${stacked(1, 2)}: that has 5.</p>`);
});

test('a part to find is still a fraction', () => {
  assert.equal(stackFractionsInHtml('<p>1/2 = ?/10</p>'), `<p>${stacked(1, 2)} = ${stacked('?', 10)}</p>`);
});

test('a date, a long number, a web address and words with a slash are left alone', () => {
  for (const plain of ['on 9/10/2026 we', 'costs 1,250/3,000', 'and/or', 'see example.org/2/3/4', '1.5/2.5']) {
    assert.equal(stackFractionsInHtml(`<p>${plain}</p>`), `<p>${plain}</p>`, plain);
  }
});

test('only the words between tags are read: never an attribute, a drawing or a style', () => {
  const html = '<div data-ratio="1/2" style="aspect-ratio:3/4"><svg viewBox="0 0 1 1"><text>1/2</text></svg><style>.a{aspect-ratio:1/2}</style><p>1/2</p></div>';
  const out = stackFractionsInHtml(html);
  assert.equal(out, html.replace('<p>1/2</p>', `<p>${stacked(1, 2)}</p>`));
});

test('a check can read the typed form back', () => {
  const typed = '<p>Shade 3/4 on the top bar.</p>';
  assert.equal(unstackFractionsInHtml(stackFractionsInHtml(typed)), typed);
});

test('the pattern is shared, so a surface that draws fractions its own way finds the same ones', () => {
  assert.equal([...'1/2 = 2/4 = 3/6'.matchAll(FRACTION)].length, 3);
});
