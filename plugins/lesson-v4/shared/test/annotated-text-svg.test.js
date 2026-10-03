'use strict';

// The one marked passage every surface places (shared/visuals/annotated-text-svg.js).
//
// Built on 2 October 2026 after a Year 6 renga lesson could only fake its poem
// on the board with stacked text boxes, and its wall could show the poem's shape
// but never the links between stanzas. These pin the layout the drawing
// promises rather than the words it prints: every mark lands on the words it
// names, a poem's lines stay whole, margin notes sit inside the drawing and
// clear of the passage and of each other, arrows run outside the words, and a
// mark that names words the passage does not hold is refused by name.

const test = require('node:test');
const assert = require('node:assert/strict');

const A = require('../visuals/annotated-text-svg');

const RENGA = {
  lines: [
    'Rain taps on the glass.', 'Grey clouds sit low on the roofs.', 'Puddles fill the street.', '',
    'I jump into the puddle', "and splash my sister's school socks.", '',
    'Wet socks on the chair,', 'drip, drip, by the kitchen fire.',
  ],
  marks: [
    { find: 'Puddles', style: 'circle', note: "Mateo's idea" },
    { find: 'puddle', id: 'p2', style: 'circle', note: 'Layla picks it up' },
    { find: 'socks', id: 's1', style: 'circle', colour: 'green' },
    { find: 'socks', nth: 2, id: 's2', style: 'circle', colour: 'green', note: '' },
  ],
  links: [{ from: 'Puddles', to: 'p2' }, { from: 's1', to: 's2' }],
};

const PROSE = {
  passage: 'As the sun set, the old lighthouse keeper climbed the spiral stairs. Slowly, carefully, he lit the great lamp. Out at sea, a small boat was heading for the rocks.',
  marks: [
    { find: 'As the sun set,', style: 'highlight', colour: 'orange', note: 'fronted adverbial' },
    { find: 'Slowly, carefully,', style: 'highlight', colour: 'orange', note: 'fronted adverbial' },
    { find: 'spiral', style: 'wavy', colour: 'purple', note: 'adjective' },
    { find: 'heading', style: 'colour', colour: 'green' },
  ],
};

const SURFACES = [
  ['slides', { widthPt: 860, heightPt: 400 }],
  ['worksheets', { widthMm: 180 }],
  ['wall', { widthMm: 260 }],
  ['stickin', { widthMm: 120 }],
];

function overlaps(a, b) {
  return a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
}

for (const [surface, box] of SURFACES) {
  test(`${surface}: every mark lands on the words it names`, () => {
    const L = A.describeLayout(RENGA, surface, box);
    for (const m of L.placed) {
      const piece = m.pieces[0];
      const line = L.lines[piece.line];
      const word = line.words.find((w) => w.x + L.textX <= piece.x1 + 0.5 && w.x + L.textX + w.w >= piece.x2 - 0.5);
      assert.ok(word, `mark "${m.find}" is not over a word`);
      assert.equal(word.text.replace(/[^\p{L}]/gu, '').toLowerCase(), m.find.toLowerCase());
    }
    // The second "socks" is on a later line than the first.
    const [s1, s2] = ['s1', 's2'].map((id) => L.placed.find((m) => m.id === id));
    assert.ok(s2.pieces[0].line > s1.pieces[0].line);
  });

  test(`${surface}: a poem keeps every line whole`, () => {
    const L = A.describeLayout(RENGA, surface, box);
    assert.equal(L.lines.length, RENGA.lines.filter(Boolean).length);
    assert.ok(L.lines.every((l) => l.indent === 0));
  });

  test(`${surface}: notes sit inside the drawing, beside the passage and clear of each other`, () => {
    for (const spec of [RENGA, PROSE]) {
      const L = A.describeLayout(spec, surface, box);
      const textBox = { x: L.textX, y: L.lines[0].top, w: L.textW, h: L.lines[L.lines.length - 1].top - L.lines[0].top };
      for (const n of L.notes) {
        const nb = { x: n.x, y: n.top, w: n.w, h: n.h };
        assert.ok(n.x >= -0.5 && n.x + n.w <= L.usedW + 0.5, 'a note leaves the drawing');
        assert.ok(n.top + n.h <= L.h + 0.5, 'a note runs off the bottom');
        assert.ok(!overlaps(nb, textBox), 'a note sits on the passage');
        for (const m of L.notes) if (m !== n && m.side === n.side) assert.ok(!overlaps(nb, { x: m.x, y: m.top, w: m.w, h: m.h }), 'two notes overlap');
      }
    }
  });

  test(`${surface}: an arrow's long runs lie between lines or in the margin, never through a line of words`, () => {
    const L = A.describeLayout(RENGA, surface, box);
    for (const a of L.arrows) {
      for (let i = 1; i < a.points.length; i += 1) {
        const [x1, y1] = a.points[i - 1];
        const [x2, y2] = a.points[i];
        if (Math.abs(y1 - y2) < 0.01) {
          // A horizontal run: between the bottom of one line's words and the top of the next.
          for (const line of L.lines) {
            const inside = y1 > line.top + 0.5 && y1 < line.top + 1.25 * L.pt - 0.5;
            assert.ok(!inside, `a horizontal arrow run crosses the line "${line.words.map((w) => w.text).join(' ')}"`);
          }
        } else if (Math.abs(x1 - x2) < 0.01 && x1 < L.textX) {
          assert.ok(x1 > 0, 'an arrow lane leaves the drawing');
        }
      }
    }
  });
}

test('a mark naming words the passage does not hold is refused by name', () => {
  assert.throws(() => A.tightSvg({ ...RENGA, links: [], marks: [{ find: 'umbrella' }] }, 'worksheets', { widthMm: 180 }), /ANNOTATED_TEXT_MARK_NOT_FOUND.*umbrella/);
});

test('an arrow to an unmarked word is refused by name', () => {
  assert.throws(() => A.tightSvg({ ...RENGA, links: [{ from: 'Puddles', to: 'kettle' }] }, 'worksheets', { widthMm: 180 }), /ANNOTATED_TEXT_UNKNOWN_MARK.*kettle/);
});

test('a passage is given as lines or as prose, not both and not neither', () => {
  assert.throws(() => A.tightSvg({ marks: [] }, 'worksheets', { widthMm: 180 }), /ANNOTATED_TEXT_INVALID/);
  assert.throws(() => A.tightSvg({ lines: ['a'], passage: 'b' }, 'worksheets', { widthMm: 180 }), /ANNOTATED_TEXT_INVALID/);
});

test('the stick-in copy prints in ink: no house colour survives the photocopy', () => {
  const { svg } = A.tightSvg(PROSE, 'stickin', { widthMm: 120 });
  for (const hex of ['#0070C0', '#00B050', '#C65911', '#CC0000', '#7030A0', '#F8CBAD']) assert.ok(!svg.includes(hex), `${hex} on a photocopied piece`);
});

test('the write-on form leaves wide margins and a ruled line for an empty note', () => {
  const L = A.describeLayout({ ...PROSE, space: 'annotate' }, 'worksheets', { widthMm: 180 });
  assert.ok(L.textX > 0.2 * L.usedW, 'the margins are not wide enough to annotate in');
  const blank = A.describeLayout(RENGA, 'worksheets', { widthMm: 180 }).notes.find((n) => n.write);
  assert.ok(blank, 'an empty note has no write-on line');
});

test('a narrow sheet shrinks a poem before it breaks a line', () => {
  const L = A.describeLayout(RENGA, 'stickin', { widthMm: 120 });
  assert.ok(L.lines.every((l) => l.indent === 0));
  assert.ok(L.pt >= 9);
});

// Counts beside the lines and notes on whole stanzas: the form's rules on the
// model text, as the teacher chose for the renga wall (2 October 2026).
const RULES = {
  lines: RENGA.lines,
  counts: [5, 7, 5, null, 7, 7, null, 5, 7],
  marks: [{ find: 'Puddles', style: 'highlight', colour: 'orange' }, { find: 'puddle', id: 'p2', style: 'highlight', colour: 'orange' }],
  links: [{ from: 'Puddles', to: 'p2' }],
  brackets: [{ stanza: 1, note: '3 lines: 5, 7, 5' }, { stanza: 3, note: 'Always ends on 2 lines' }],
};

for (const [surface, box] of SURFACES) {
  test(`${surface}: each count sits on its own line, in one column right of the passage`, () => {
    const L = A.describeLayout(RULES, surface, box);
    const counted = L.lines.filter((l) => l.count != null);
    assert.deepEqual(counted.map((l) => l.count), ['5', '7', '5', '7', '7', '5', '7']);
    assert.ok(L.countsX > L.textX + L.textW, 'the counts sit on the passage');
  });

  test(`${surface}: a bracket spans its stanza and its note sits beyond it, inside the drawing`, () => {
    const L = A.describeLayout(RULES, surface, box);
    const stanza1 = L.lines.filter((l) => l.block === 0);
    const b = L.brackets.find((x) => x.block === 0);
    assert.ok(b.top >= stanza1[0].top - 0.5 && b.bottom <= stanza1[stanza1.length - 1].top + 1.25 * L.pt + 0.5);
    assert.ok(b.x > L.countsX, 'the bracket sits on the counts');
    for (const n of L.notes.filter((x) => x.bracket)) {
      assert.ok(n.x > b.x && n.x + n.w <= L.usedW + 0.5, 'a stanza note leaves the drawing or sits on its bracket');
    }
  });
}

test('a bracket on a stanza the passage does not have is refused by name', () => {
  assert.throws(() => A.tightSvg({ ...RULES, brackets: [{ stanza: 9, note: 'x' }] }, 'worksheets', { widthMm: 180 }), /ANNOTATED_TEXT_INVALID.*stanza 9/);
});

test('counts need lines to sit beside', () => {
  assert.throws(() => A.tightSvg({ passage: 'One two three.', counts: [3] }, 'worksheets', { widthMm: 180 }), /ANNOTATED_TEXT_INVALID.*lines/);
});
