'use strict';

// The one set of digit cards every surface places (shared/visuals/digit-cards-svg.js).
//
// Built on 2 October 2026 from a Year 6 divisibility wall the teacher approved
// for its number cards, lines, arrows and colours. These pin the layout the
// drawing promises rather than the words it prints: every mark lands on the
// digits it names, nothing written overlaps a card or another piece of words,
// every piece sits inside the picture, a wall step pin gets room of its own
// beside its part, the drawing fills the board zone it is given, and a mark
// that names a digit the number does not have is refused by name.

const test = require('node:test');
const assert = require('node:assert/strict');

const D = require('../visuals/digit-cards-svg');

// The four figures of the approved wall.
const CASES = {
  '77': {
    text: 'Is 77 divisible by 11?', value: '77',
    arc: { from: 1, to: 2, label: 'same!', colour: 'orange' },
    bracket: { digits: 'all', label: '2 digits' },
    working: [{ text: 'Yes, 77 is divisible by 11 ✓', colour: 'green' }],
  },
  '316': {
    text: 'Is 316 divisible by 4?', value: '316',
    marks: [
      { digits: 1, style: 'dim' },
      { id: 'last two', digits: 'last 2', style: 'box', colour: 'blue', label: 'last two digits: 16' },
      { id: 'even', digits: 3, style: 'none', note: 'even ✓' },
    ],
    working: [{ text: 'half of 16 is 8', arrow: true }, { text: '8 is even, so yes ✓', colour: 'green' }],
  },
  '5463': {
    text: 'Is 5,463 divisible by 3? By 9?', value: '5,463',
    sum: { label: 'digit sum: 18', colour: 'purple' },
    working: [
      { text: 'in 3 times table' }, { text: 'in 9 times table', beside: true },
      { text: '✓ divisible by 3', colour: 'green' }, { text: '✓ divisible by 9', colour: 'green', beside: true },
    ],
  },
  '114': {
    text: 'Is 114 divisible by 6?', value: '114',
    marks: [{ id: 'even', digits: 'last', style: 'outline', colour: 'orange', note: 'even ✓' }],
    bracket: { digits: 'all', label: '1 + 1 + 4 = 6' },
    working: [{ text: '6 is in the 3 times table ✓' }, { text: 'Both checks pass, so yes ✓', colour: 'green' }],
  },
};

// Wording and a number the drawing was not built around: rounding, a long
// label, a mark in the middle with a note, blanks for the child.
const ROUNDING = {
  text: 'Round 46,382 to the nearest thousand.', value: 46382,
  marks: [
    { id: 'rounding digit', digits: 2, style: 'outline', colour: 'blue', label: 'the thousands digit' },
    { id: 'look right', digits: 3, style: 'ring', colour: 'orange', note: 'less than 5, so round down' },
  ],
  working: [{ text: 'The digits after the thousands become zeros.', arrow: true }, { text: '', colour: 'green' }],
};

const SURFACES = [
  ['slides', { widthPt: 5.5 * 72, heightPt: 4 * 72 }],
  ['worksheets', { widthMm: 170 }],
  ['wall', { widthMm: 240 }],
  ['stickin', { widthMm: 110 }],
];

function overlaps(a, b) {
  return a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
}

const pinsFor = (spec, parts) => ({ ...spec, callouts: parts.map((part, i) => ({ part, step: i + 1 })) });

for (const [surface, box] of SURFACES) {
  for (const [name, spec] of [...Object.entries(CASES), ['rounding', ROUNDING]]) {
    test(`${surface} ${name}: every piece sits inside the picture and clear of the cards and of each other`, () => {
      const L = D.describeLayout(spec, surface, box);
      const words = L.boxes.filter((b) => b.kind === 'text');
      const cards = L.boxes.filter((b) => b.kind === 'card');
      for (const b of L.boxes) {
        assert.ok(b.x >= -0.5 && b.y >= -0.5 && b.x + b.w <= L.w + 0.5 && b.y + b.h <= L.h + 0.5, `${b.part} (${b.kind}) is outside the picture`);
      }
      for (const w of words) for (const c of cards) assert.ok(!overlaps(w, c), `"${w.part}" lies on ${c.part}`);
      for (let i = 0; i < words.length; i += 1) {
        for (let j = i + 1; j < words.length; j += 1) assert.ok(!overlaps(words[i], words[j]), `"${words[i].part}" and "${words[j].part}" touch`);
      }
      assert.ok(L.w <= L.profile.widthPt + 0.5, 'wider than its box');
      if (L.profile.heightPt) assert.ok(L.h <= L.profile.heightPt + 0.5, 'taller than its zone');
      assert.ok(L.tp >= L.profile.minFontPt - 1e-6, `words at ${L.tp}pt, under the ${L.profile.minFontPt}pt floor`);
    });
  }
}

test('the digits print far larger than the words beside them', () => {
  for (const [surface, box] of SURFACES) {
    const L = D.describeLayout(CASES['316'], surface, box);
    assert.ok(L.D >= 2 * L.tp, `${surface}: digits ${L.D}pt beside words at ${L.tp}pt`);
  }
});

test('a board zone is filled on one side: the drawing reaches its width or its height', () => {
  for (const spec of Object.values(CASES)) {
    const L = D.describeLayout(spec, 'slides', { widthPt: 5.5 * 72, heightPt: 4 * 72 });
    const fill = Math.max(L.w / L.profile.widthPt, L.h / L.profile.heightPt);
    assert.ok(fill > 0.97, `${spec.number} fills ${(fill * 100).toFixed(0)}% of its zone`);
  }
});

test('a mark covers exactly the cards it names, counting digits and not commas', () => {
  const L = D.describeLayout({ value: '5,463', marks: [{ digits: 'last 2', style: 'box' }] }, 'worksheets', { widthMm: 170 });
  assert.deepEqual(L.cards.map((c) => c.ch), ['5', '4', '6', '3']);
  assert.deepEqual(L.n.marks[0].digits, [3, 4]);
  assert.deepEqual(L.between.map((g) => g.glyph), [',']);
  const comma = L.between[0].x;
  assert.ok(comma > L.cards[0].x + L.cards[0].w && comma < L.cards[1].x, 'the comma sits between the 5 and the 4');
});

test('a digit sum puts a + between every card and none elsewhere', () => {
  const L = D.describeLayout(CASES['5463'], 'wall', { widthMm: 240 });
  assert.deepEqual(L.between.map((g) => g.glyph), ['+', '+', '+']);
  L.between.forEach((g, i) => assert.ok(g.x > L.cards[i].x + L.cards[i].w && g.x < L.cards[i + 1].x));
});

test('a JS number gets its commas; a string prints as written', () => {
  assert.equal(D.describeLayout({ value: 46382 }, 'worksheets').between.length, 1);
  assert.equal(D.describeLayout({ value: '4637' }, 'worksheets').between.length, 0);
  assert.deepEqual(D.describeLayout({ value: '3.47' }, 'worksheets').between.map((g) => g.glyph), ['.']);
});

test('loose cards are spaced wider than the cards of one number', () => {
  const loose = D.describeLayout({ digits: [0, 3, 4, 7] }, 'worksheets');
  const number = D.describeLayout({ value: '347' }, 'worksheets');
  const gap = (L) => L.cards[1].x - (L.cards[0].x + L.cards[0].w);
  assert.ok(gap(loose) > 2 * gap(number));
});

test('a side note sits beside the end of the number it is about', () => {
  const L = D.describeLayout(CASES['114'], 'wall', { widthMm: 240 });
  const note = L.boxes.find((b) => b.kind === 'text' && b.part === 'even');
  const last = L.boxes.find((b) => b.part === 'card 3');
  assert.ok(note.x > last.x + last.w, 'the note is right of the last card');
  assert.ok(note.y < last.y + last.h && note.y + note.h > last.y, 'and level with it');
});

test('a down arrow runs from the label above into the working line, under the same words', () => {
  const L = D.describeLayout(CASES['316'], 'slides', { widthPt: 5.5 * 72, heightPt: 4 * 72 });
  const arrow = L.boxes.find((b) => b.kind === 'arrow');
  const label = L.boxes.find((b) => b.kind === 'text' && b.part === 'last two');
  const line = L.boxes.find((b) => b.kind === 'text' && b.part === 'working 1');
  const mid = (b) => b.x + b.w / 2;
  assert.ok(arrow.y >= label.y + label.h - 0.5 && arrow.y + arrow.h <= line.y + 0.5, 'the arrow runs between them');
  assert.ok(Math.abs(mid(arrow) - mid(line)) < 1 && Math.abs(mid(line) - mid(label)) < 1, 'all three share one axis');
});

test('a wall step pin gets room of its own beside every part it names, clear of all words and cards', () => {
  const parts = {
    '77': ['bracket', 'arc'],
    '316': ['even', 'last two', 'working 1', 'working 2'],
    '5463': ['sum', 'working 1', 'working 2'],
    '114': ['even', 'bracket', 'working 1'],
  };
  for (const [name, list] of Object.entries(parts)) {
    const { anchors, layout: L } = D.tightSvg(pinsFor(CASES[name], list), 'wall', { widthMm: 240 });
    for (const part of list) {
      const a = anchors[part];
      assert.ok(a, `${name}: no anchor for "${part}"`);
      const r = (a[2] / 100) * L.h;
      const pin = { x: (a[0] / 100) * L.w - r, y: (a[1] / 100) * L.h - r, w: 2 * r, h: 2 * r };
      assert.ok(pin.x >= -0.5 && pin.x + pin.w <= L.w + 0.5 && pin.y >= -0.5 && pin.y + pin.h <= L.h + 0.5, `${name}: the "${part}" pin is outside the picture`);
      for (const b of L.boxes) {
        if (b.kind === 'arrow') continue;
        assert.ok(!overlaps(pin, b), `${name}: the "${part}" pin lies on ${b.part} (${b.kind})`);
      }
    }
  }
});

test('the columns of side-by-side working line up, pin or no pin', () => {
  const L = D.describeLayout(pinsFor(CASES['5463'], ['working 1', 'working 2']), 'wall', { widthMm: 240 });
  const at = (k) => L.boxes.find((b) => b.kind === 'text' && b.part === `working ${k}`).x;
  assert.ok(Math.abs(at(1) - at(3)) < 0.5, 'the 3 times table check and its answer start together');
  assert.ok(Math.abs(at(2) - at(4)) < 0.5, 'the 9 times table check and its answer start together');
});

test('a blank leaves a ruled line, not words', () => {
  const { svg, layout } = D.tightSvg(ROUNDING, 'stickin', { widthMm: 110 });
  assert.ok(layout.texts.some((t) => t.write));
  assert.ok(!svg.includes('>undefined<') && !svg.includes('>null<'));
});

test('the stick-in pack prints in ink and the board in its colours', () => {
  const ink = D.tightSvg(CASES['114'], 'stickin', { widthMm: 110 }).svg;
  const hexes = [...ink.matchAll(/#([0-9A-F]{6})/gi)].map((m) => m[1].toUpperCase());
  for (const h of hexes) assert.ok(h.slice(0, 2) === h.slice(2, 4) && h.slice(2, 4) === h.slice(4, 6), `#${h} is not a grey`);
  const board = D.tightSvg(CASES['114'], 'slides', { widthPt: 400, heightPt: 300 }).svg;
  assert.ok(board.includes('#E46C0A'), 'the judged digit is orange');
  assert.ok(board.includes('#00B050'), 'a yes is green');
});

test('a mark naming a digit the number does not have is refused by name', () => {
  assert.throws(() => D.describeLayout({ value: '316', marks: [{ digits: 4 }] }), /DIGIT_CARDS_UNKNOWN_DIGIT/);
  assert.throws(() => D.describeLayout({ value: '316', marks: [{ digits: [1, 3], style: 'box' }] }), /not next to each other/);
  assert.throws(() => D.describeLayout({ value: '3a6' }), /DIGIT_CARDS_INVALID/);
});

test('a zone too shallow for the working refuses by name rather than shrinking the words', () => {
  assert.throws(() => D.describeLayout(CASES['316'], 'slides', { widthPt: 400, heightPt: 90 }), /DIGIT_CARDS_ZONE_TOO_SHALLOW/);
});

test('the cache key changes with the pins, so a pinned and an unpinned picture never share one', () => {
  const a = D.cacheKey(CASES['77'], 'wall', { widthMm: 240 });
  const b = D.cacheKey(pinsFor(CASES['77'], ['arc']), 'wall', { widthMm: 240 });
  assert.notEqual(a, b);
});
