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

// A part the child writes is a box on the bar (the teacher, 13 October 2026,
// from the real Year 5 sheet of the 12 October stress test, where "___/6"
// printed a blank and then "/6" typed on the line).
test('a blank part, typed or already drawn by a sheet, is a write-in box on the bar', () => {
  const box = '<span class="sfr-box"></span>';

  assert.equal(stackFractionsInHtml('= ___/6'), `= ${stacked(box, '6')}`);
  assert.equal(stackFractionsInHtml('= □/6'), `= ${stacked(box, '6')}`);
  assert.equal(stackFractionsInHtml('= <span class="h-blank"></span>/6'), `= ${stacked(box, '6')}`);
  assert.equal(stackFractionsInHtml('= <span class="h-digit-box"></span>/6'), `= ${stacked(box, '6')}`);
  assert.equal(stackFractionsInHtml('3/<span class="h-blank" style="width:20mm"></span>'), stacked('3', box));
  assert.equal(stackFractionsInHtml('___/___'), stacked(box, box));
  assert.equal(stackFractionsInHtml('1/2 = ?/10').includes('<span class="sfr-n">?</span>'), true);
});

test('a blank that is not part of a fraction is left alone, and the typed form reads back', () => {
  assert.equal(stackFractionsInHtml('and/or ___ / no'), 'and/or ___ / no');
  assert.equal(stackFractionsInHtml('<span class="h-blank"></span> on 9/10/2026'), '<span class="h-blank"></span> on 9/10/2026');
  assert.equal(unstackFractionsInHtml(stackFractionsInHtml('2/3 = ___/6')), '2/3 = ___/6');
});
