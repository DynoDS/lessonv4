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

// ─── Marks that keep off the letters (8 October 2026) ────────────────────────
// Three lessons of twenty in the stress test of 7 October had a mark cutting
// its own words: an oval through the first and last letters, a box edge on the
// full stop. Nothing here asked where a ring's line was, only which words it
// was on. These ask. The passages are the ones that showed it (a Year 6
// argument, a Year 6 online-safety message) and two that did not, so the rule
// is not learnt from English prose alone: a maths word problem and the poem.

const ARGUMENT = {
  passage: 'On the other hand, many people say children need a rest after school. They have already spent six hours there. Homework can also be unfair, because not every child has a quiet place to work or someone at home to help.\n\nIn conclusion, there are good points on both sides. I think a small amount of homework is a good idea, as long as it is short.',
  marks: [
    { find: 'children need a rest after school', style: 'box', colour: 'blue', note: 'A' },
    { find: 'They have already spent six hours there', style: 'underline', colour: 'orange' },
    { find: 'Homework can also be unfair', style: 'box', colour: 'blue', note: 'A' },
    { find: 'I think a small amount of homework is a good idea, as long as it is short', style: 'circle', colour: 'purple' },
  ],
};

const WORD_PROBLEM = {
  passage: 'Maya has 248 stickers. She gives 59 to Tom, then buys 3 packs of 12. How many stickers does she have now?',
  marks: [
    { find: '248', style: 'circle', colour: 'blue', note: 'start' },
    { find: 'gives 59', style: 'box', colour: 'red', note: 'take away' },
    { find: '3 packs of 12.', style: 'box', colour: 'green', note: 'multiply first' },
    { find: 'How many stickers', style: 'circle', colour: 'purple' },
  ],
};

const SIGNS = {
  title: 'StarPlayer_K',
  passage: "That was so fun! You're my favourite person to play with. Which school do you go to? Don't tell your mum we're chatting. She won't get it. Quick, tell me before I have to go!",
  marks: [
    { find: 'Which school do you go to', style: 'underline', colour: 'orange', note: 'asks for personal information' },
    { find: "Don't tell your mum we're chatting", style: 'underline', colour: 'orange', note: 'asks him to keep a secret' },
    { find: 'Quick, tell me before I have to go', style: 'underline', colour: 'orange', note: 'rushes him' },
  ],
};

function ringPieces(L) {
  const out = [];
  for (const m of L.placed) for (const p of m.pieces) if (p.ring) out.push({ m, p, line: L.lines[p.line] });
  return out;
}

for (const [surface, box] of SURFACES) {
  test(`${surface}: a loop or a box clears its letters, tails and punctuation, and ends in the finger space`, () => {
    for (const spec of [ARGUMENT, WORD_PROBLEM, RENGA]) {
      const L = A.describeLayout(spec, surface, box);
      const half = (Math.max(1, 0.085 * L.pt) * 1.3) / 2; // half the drawn line
      const rings = ringPieces(L);
      assert.ok(rings.length > 0, 'the passage has no rings to check');
      for (const { m, p, line } of rings) {
        const first = line.words[p.pos1];
        const last = line.words[p.pos2];
        const what = `the ${m.style} round "${m.find}" at ${L.pt}pt`;
        // Round the whole of its words, the punctuation that touches them included.
        assert.ok(p.ring.x1 + half <= first.x + L.textX + 0.01, `${what} cuts its first letter`);
        assert.ok(p.ring.x2 - half >= last.x + last.w + L.textX - 0.01, `${what} cuts its last letter or the punctuation after it`);
        // Above the tall letters and below the tails.
        assert.ok(p.ring.top + half <= line.baseline - 0.8 * L.pt, `${what} cuts the tops of the tall letters`);
        assert.ok(p.ring.bottom - half >= line.baseline + 0.33 * L.pt, `${what} cuts the tails`);
        // Short of the words either side, and inside the drawing.
        const before = line.words[p.pos1 - 1];
        const after = line.words[p.pos2 + 1];
        if (before) assert.ok(p.ring.x1 - half >= before.x + before.w + L.textX - 0.01, `${what} runs onto the word before it`);
        if (after) assert.ok(p.ring.x2 + half <= after.x + L.textX + 0.01, `${what} runs onto the word after it`);
        assert.ok(p.ring.x1 - half >= -0.5 && p.ring.x2 + half <= L.usedW + 0.5, `${what} leaves the drawing`);
        assert.ok(p.ring.top - half >= -0.5 && p.ring.bottom + half <= L.h + 0.5, `${what} leaves the drawing`);
      }
      // Two rings on neighbouring lines never share ink.
      for (const a of rings) for (const b of rings) {
        if (a === b || b.p.line !== a.p.line + 1) continue;
        assert.ok(a.p.ring.bottom + half <= b.p.ring.top - half + 0.01, 'two rings on neighbouring lines overlap');
      }
    }
  });
}

test('a circle is drawn as a rounded loop, never an oval', () => {
  const { svg } = A.tightSvg(ARGUMENT, 'slides', { widthPt: 860, heightPt: 400 });
  assert.ok(!svg.includes('<ellipse'), 'an oval clips the corners of what it goes round, which is the first and last letters');
  assert.ok(svg.includes('annotated-text-ring'));
});

test('an underline and a highlight stop at the last letter, as the teacher ruled', () => {
  // 8 October 2026: an underline through the tail of a g and a highlight that
  // stops at the last letter are right as they are. Only rings changed.
  const L = A.describeLayout(PROSE, 'slides', { widthPt: 860, heightPt: 400 });
  const set = L.placed.find((m) => m.find === 'As the sun set,');
  const piece = set.pieces[set.pieces.length - 1];
  assert.ok(piece.x2 < piece.fx2 - 0.5, 'the highlight has grown to take in the comma');
  assert.equal(piece.ring, undefined);
});

test('notes that say different things take different colours; the same note keeps one', () => {
  const marks = A.normalise(SIGNS).marks;
  assert.equal(new Set(marks.map((m) => m.colour)).size, 3, 'three different notes share a colour');
  assert.equal(marks[0].colour, 'orange', "the first note keeps the designer's colour");
  assert.ok(marks.every((m) => m.style === 'underline'), 'the kind of mark changed');
  // Two boxes both noted "A" are one kind of thing.
  const arg = A.normalise(ARGUMENT).marks;
  assert.equal(arg[0].colour, 'blue');
  assert.equal(arg[2].colour, 'blue');
  // The same note twice in the worksheet's own example.
  const prose = A.normalise(PROSE).marks;
  assert.equal(prose[0].colour, prose[1].colour);
  // The two ends of an arrow keep their shared colour: it is the link.
  const renga = A.normalise(RENGA).marks;
  assert.equal(renga[0].colour, 'blue');
  assert.equal(renga[1].colour, 'blue');
  // A designer who already gave each note its own colour is left alone.
  const own = A.normalise({ passage: 'One two three.', marks: [{ find: 'One', colour: 'red', note: 'a' }, { find: 'two', colour: 'purple', note: 'b' }] }).marks;
  assert.deepEqual(own.map((m) => m.colour), ['red', 'purple']);
  // A new colour is one no other mark is using.
  const mixed = A.normalise({ passage: 'One two three four.', marks: [{ find: 'One', note: 'a' }, { find: 'two', note: 'b' }, { find: 'three', colour: 'green' }] }).marks;
  assert.equal(mixed[1].colour, 'orange');
});

test('notes stacked in one margin have clear air between them', () => {
  const L = A.describeLayout({ ...SIGNS, marks: SIGNS.marks.map((m) => ({ ...m, side: 'right' })) }, 'wall', { widthMm: 260 });
  const right = L.notes.filter((n) => n.side === 'right').sort((a, b) => a.top - b.top);
  assert.ok(right.length >= 2);
  for (let i = 1; i < right.length; i += 1) {
    assert.ok(right[i].top - (right[i - 1].top + right[i - 1].h) >= 0.5 * L.notePt, 'two notes read as one paragraph');
  }
});

test('a punctuation mark can be marked on its own, but not ringed', () => {
  const L = A.describeLayout({ lines: ['the bright, round moon'], marks: [{ find: ',', style: 'highlight', colour: 'green' }] }, 'wall', { widthMm: 260 });
  const piece = L.placed[0].pieces[0];
  const bright = L.lines[0].words[1];
  assert.equal(bright.text, 'bright,');
  assert.ok(piece.x1 > bright.x + L.textX + 0.5 * bright.w, 'the mark is on the word, not its comma');
  assert.ok(Math.abs(piece.x2 - (bright.x + bright.w + L.textX)) < 0.5);
  assert.throws(() => A.tightSvg({ lines: ['the bright, round moon'], marks: [{ find: ',', style: 'circle' }] }, 'wall', { widthMm: 260 }), /ANNOTATED_TEXT_INVALID.*punctuation/);
});

test('a wall step number that names a word is given room just above it', () => {
  const spec = {
    lines: ['a tree', 'the bright, round moon'],
    marks: [{ find: 'bright', style: 'highlight', colour: 'orange' }],
    callouts: [{ part: 'moon', step: 1 }, { part: 'bright', step: 3 }, { part: ',', step: 5 }, { part: 'tree', label: 'the noun' }],
  };
  const r = A.tightSvg(spec, 'wall', { widthMm: 260 });
  const L = r.layout;
  const plain = A.describeLayout({ ...spec, callouts: undefined }, 'wall', { widthMm: 260 });
  assert.ok(L.h > plain.h, 'no room was left for the step numbers');
  const second = L.lines[1];
  const firstBottom = L.lines[0].top + 1.25 * L.pt;
  for (const [part, word] of [['moon', 'moon'], ['bright', 'bright,']]) {
    const [x, y, rad] = r.anchors[part];
    const w = second.words.find((k) => k.text === word);
    const cx = (x / 100) * r.w;
    const cy = (y / 100) * r.h;
    const cr = (rad / 100) * r.h;
    assert.ok(cx > w.x + L.textX && cx < w.x + w.w + L.textX, `step on "${part}" is not over its word`);
    assert.ok(cy + cr <= second.top + 0.01, `step on "${part}" sits on its word`);
    assert.ok(cy - cr >= firstBottom - 0.01, `step on "${part}" sits on the line above`);
  }
  // The comma's own number is over the comma, right of the middle of "bright,".
  const brightWord = second.words.find((k) => k.text === 'bright,');
  assert.ok((r.anchors[','][0] / 100) * r.w > brightWord.x + L.textX + 0.6 * brightWord.w);
  // A word label is told where its word is, with no circle.
  assert.equal(r.anchors.tree.length, 2);
  // A drawing nobody points at names no places, and is laid out as before.
  assert.equal(A.tightSvg({ ...spec, callouts: undefined }, 'wall', { widthMm: 260 }).anchors, undefined);
  // A different set of step numbers is a different picture.
  assert.notEqual(A.cacheKey(spec, 'wall', { widthMm: 260 }), A.cacheKey({ ...spec, callouts: undefined }, 'wall', { widthMm: 260 }));
});
