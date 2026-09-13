'use strict';

// The one money picture every surface places (shared/visuals/money-svg.js).
// Ported from the worksheet's coin-strip tests when its drawn coins gave way to
// the real pictures (13 September 2026): what those tests held about a coin
// (one per coin, to scale, never bigger than life on paper, nothing outside the
// picture, unknown coins refused) is held here for every surface.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const money = require('../visuals/money-svg');
const { profileFor, PROFILES, MM_TO_PT } = require('../visuals/surface-profiles');

const SHEET = profileFor('worksheets', { widthMm: 260 });
const count = (s, needle) => s.split(needle).length - 1;

test('one real picture is placed for every coin listed, repeats included, and no coin is drawn', () => {
  const out = money.tightSvg({ items: ['£2', '£1', '20p', '20p', '10p'] }, SHEET);
  assert.equal(count(out.svg, '<use '), 5, 'a coin was not placed');
  assert.equal(count(out.svg, '<symbol '), 4, 'each picture goes in once');
  assert.ok(!/<(circle|path|rect)\b/.test(out.svg), 'a coin was drawn rather than placed');
  // The picture a 20p places is the shipped 20p picture.
  const shipped = fs.readFileSync(path.join(__dirname, '..', '..', 'builder', 'assets', 'money', 'placed', '20p.png')).toString('base64');
  assert.ok(out.svg.includes(shipped));
});

test('coins are to scale with each other, smallest to biggest', () => {
  // Size is the first thing a child sorts coins by: a 2p is a third wider than a
  // 5p, and a picture that makes them the same teaches the opposite.
  const order = ['5p', '1p', '20p', '£1', '10p', '2p', '50p', '£2'];
  const out = money.describeLayout({ items: order }, SHEET);
  for (let i = 1; i < order.length; i++) {
    assert.ok(out.items[i].w > out.items[i - 1].w, `a ${order[i]} is not bigger than a ${order[i - 1]}`);
  }
});

test('on paper a coin prints at its real size when there is room, and never bigger', () => {
  const out = money.describeLayout({ items: ['£2', '50p', '10p'] }, SHEET);
  const lifeMm = 28.4 + 27.3 + 24.5 + 2 * 2;
  assert.ok(Math.abs(out.w / MM_TO_PT - lifeMm) < 0.1, `drew ${out.w / MM_TO_PT}mm, not the true ${lifeMm}mm`);
  const narrow = money.describeLayout({ items: ['£2', '50p', '10p'] }, profileFor('worksheets', { widthMm: 60 }));
  assert.ok(Math.abs(narrow.w / MM_TO_PT - 60) < 0.1, 'in a narrow column it shrinks to fit');
  assert.equal(narrow.rows, 1, 'and stays one row while the coins are still readable');
});

test('a note is bigger than any coin but not drawn at its real size', () => {
  const out = money.describeLayout({ items: ['£5', '£2'] }, SHEET);
  const [note, coin] = out.items;
  assert.ok(note.w * note.h > coin.w * coin.h && note.w > coin.w, 'a note reads as bigger than the biggest coin');
  assert.ok(note.w < coin.w * 3, 'a life-size note shrinks every coin beside it to a crumb');
});

test('nothing is placed outside the picture', () => {
  for (const s of Object.keys(PROFILES)) {
    const profile = profileFor(s, s === 'slides' ? { widthPt: 400, heightPt: 200 } : { widthMm: 90 });
    const out = money.describeLayout({ items: ['1p', '20p', '50p', '£1', '£2', '£5', '|', '£20', '10p'] }, profile);
    out.items.forEach((it) => {
      assert.ok(it.x >= -1e-6 && it.y >= -1e-6 && it.x + it.w <= out.w + 1e-6 && it.y + it.h <= out.h + 1e-6, `${s}: ${it.key} runs off the picture`);
    });
    assert.ok(out.w <= profile.widthPt + 1e-6, `${s}: wider than its space`);
    if (profile.heightPt) assert.ok(out.h <= profile.heightPt + 1e-6, `${s}: taller than its zone`);
  }
});

test('coins in one row share one baseline', () => {
  const out = money.describeLayout({ items: ['5p', '£2', '1p'] }, SHEET);
  const bottoms = out.items.map((it) => it.y + it.h);
  bottoms.forEach((b) => assert.ok(Math.abs(b - bottoms[0]) < 1e-6));
});

test('a break between two groups is wider than the gap between two coins', () => {
  const out = money.describeLayout({ items: ['10p', '10p', '|', '10p'] }, SHEET);
  const [a, b, c] = out.items;
  assert.ok(c.x - (b.x + b.w) > 2 * (b.x - (a.x + a.w)));
});

test('a row too long for its width wraps rather than shrinking coins past telling apart', () => {
  const eight = ['£2', '£1', '50p', '20p', '10p', '5p', '2p', '1p'];
  const wall = money.describeLayout({ items: eight }, profileFor('wall', { widthMm: 180 }));
  assert.ok(wall.rows >= 2, 'the wall card wrapped instead of printing eight tiny coins');
  const smallest = Math.min(...wall.items.map((it) => it.w));
  assert.ok(smallest >= 2.5 * PROFILES.wall.minFontPt - 1e-6, `the smallest coin printed ${smallest}pt across`);
});

test('the board shows one coin as big as its zone allows', () => {
  const out = money.describeLayout({ items: ['£2'] }, profileFor('slides', { widthPt: 600, heightPt: 300 }));
  assert.ok(Math.abs(out.h - 300) < 1e-6);
});

test('a space too small for the coins, an unknown coin and an empty row are refused by name', () => {
  assert.throws(() => money.tightSvg({ items: ['£2', '£1', '50p', '20p', '10p', '5p', '2p', '1p'] }, profileFor('slides', { widthPt: 100, heightPt: 40 })), /MONEY_ZONE_TOO_SMALL/);
  assert.throws(
    () => money.normalise({ items: ['3p'] }),
    (err) => /UNKNOWN_DENOMINATION/.test(err.message) && /3p/.test(err.message) && /50p/.test(err.message)
  );
  assert.throws(() => money.normalise({ items: ['1p_back'] }), /UNKNOWN_DENOMINATION/);
  assert.throws(() => money.normalise({ items: [] }), /MONEY_EMPTY/);
  assert.throws(() => money.normalise({ items: ['|'] }), /MONEY_EMPTY/);
});

test('the sheet\'s coins spelling draws the same row as the board\'s items', () => {
  assert.deepEqual(money.normalise({ coins: ['£1', '5p'] }), money.normalise({ items: ['£1', '5p'] }));
});

test('coinImage places one coin\'s real picture in a box, for a drawing that holds coins', () => {
  const img = money.coinImage('50p', 1, 2, 30, 30);
  assert.match(img, /^<image x="1" y="2" width="30" height="30" /);
  assert.ok(img.includes('data:image/png;base64,'));
  assert.throws(() => money.coinImage('3p', 0, 0, 1, 1), /UNKNOWN_DENOMINATION/);
});
