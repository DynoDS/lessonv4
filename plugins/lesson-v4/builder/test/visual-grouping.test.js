'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { fitGroupId, growFitObjectName } = require('../src/text-fit');
const { splitAnswerRuns } = require('../src/answer-text');
const { drawChipBank } = require('../src/content/chip-bank');
const { drawCallout } = require('../src/content/callout');
const { drawRow } = require('../src/content/row');
const { drawTable } = require('../src/content/table');
const { drawNumberedQuestions, measureQuestionStack } = require('../src/content/numbered-questions');
const { chooseBulletFont } = require('../src/content/bullets');
const { labelDiagramKey } = require('../src/content/label-diagram');
const { circuitDiagramKey } = require('../src/content/circuit-diagram');
const { circuitSymbolBankKey } = require('../src/content/circuit-symbol-bank');
const { tightSvg } = require('../../shared/visuals/circuit-diagram-svg');
const { symbolBankSvg } = require('../../shared/visuals/circuit-diagram-svg');
const { drawSortBoard } = require('../src/content/sort-board');
const { drawEvidenceCards } = require('../src/content/evidence-cards');
const { drawSourcePathway } = require('../src/content/source-pathway');
const { drawImage } = require('../src/content/image');
const { clearWarnings, getWarnings } = require('../src/warnings');
const { drawContent, ZONE_COMPAT } = require('../src/content');

const ZONE = { x: 0, y: 0, w: 10, h: 5, class: 'A' };

function capture(drawer, zone, data, ctx) {
  const shapes = [];
  const texts = [];
  const images = [];
  const pptx = new PptxGenJS();
  const slide = {
    addShape: (kind, options) => shapes.push({ kind, ...options }),
    addText: (content, options) => texts.push({ content, ...options }),
    addImage: (options) => images.push(options)
  };
  drawer(pptx, slide, zone, data, ctx || { slideIndex: 0, imageDims: {} });
  return { shapes, texts, images };
}

function groupFromName(name) {
  const match = /^GROWFIT__([^_]+)__\d+__/.exec(name || '');
  return match ? match[1] : null;
}

function temporaryImage(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'slide-image-test-'));
  const file = path.join(dir, 'image.png');
  fs.writeFileSync(file, Buffer.from('not-decoded-in-this-unit-test'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return file;
}

test('grow-fit names encode a stable group and an explicit ceiling', () => {
  const zone = { x: 1.25, y: 2.5, w: 3.75, h: 4 };
  const first = fitGroupId(zone, 'table-column-1');
  const second = fitGroupId(zone, 'table-column-1');
  const other = fitGroupId(zone, 'table-column-2');
  assert.equal(first, second);
  assert.notEqual(first, other);
  assert.match(
    growFitObjectName(first, 54, 'Mains electricity'),
    /^GROWFIT__[A-Za-z0-9-]+__54__Mains-electricity$/
  );
});

test('table cells grow by column and remain uniform within each column', () => {
  const { texts } = capture(drawTable, ZONE, {
    headers: ['Category', 'What it means'],
    rows: [
      ['Electrical appliance', 'Made to use electricity to do a job.'],
      ['Mains electricity', 'Designed to connect to the mains supply.'],
      ['Battery', 'Designed to use a battery as its power source.']
    ]
  });
  const body = texts.filter((entry) => /__table-cell-/.test(entry.objectName || ''));
  const byColumn = [
    body.filter((entry) => /table-cell-\d+-0$/.test(entry.objectName)),
    body.filter((entry) => /table-cell-\d+-1$/.test(entry.objectName))
  ];
  assert.deepEqual(byColumn.map((column) => column.length), [3, 3]);
  assert.ok(byColumn.every((column) => new Set(column.map((entry) => groupFromName(entry.objectName))).size === 1));
  assert.notEqual(groupFromName(byColumn[0][0].objectName), groupFromName(byColumn[1][0].objectName));
  assert.ok(body.every((entry) => /__54__/.test(entry.objectName)));
});

test('numbered question text uses one shared grow-fit group', () => {
  const { texts } = capture(drawNumberedQuestions, ZONE, {
    questions: [
      'Use each photograph to name the object.',
      'Identify its power source.'
    ]
  });
  const bodies = texts.filter((entry) => /__question-text-/.test(entry.objectName || ''));
  assert.equal(bodies.length, 2);
  assert.equal(new Set(bodies.map((entry) => groupFromName(entry.objectName))).size, 1);
  assert.ok(bodies.every((entry) => /__40__/.test(entry.objectName)));
});

test('chip bank labels use one shared grow-fit group with a 54 point ceiling', () => {
  const { texts } = capture(drawChipBank, ZONE, {
    chips: ['Kettle', 'Torch', 'Book', 'Wooden spoon']
  });
  const chips = texts.filter((entry) => /__chip-/.test(entry.objectName || ''));
  assert.equal(chips.length, 4);
  assert.equal(new Set(chips.map((entry) => groupFromName(entry.objectName))).size, 1);
  assert.ok(chips.every((entry) => /__54__/.test(entry.objectName)));
});

test('chip bank can keep six short appliance labels on one row', () => {
  const { texts } = capture(drawChipBank, ZONE, {
    maxRows: 1,
    chips: ['Kettle', 'Television', 'Fridge', 'Bicycle', 'Football', 'Candle']
  });
  const chips = texts.filter((entry) => /__chip-/.test(entry.objectName || ''));
  assert.equal(chips.length, 6);
  assert.equal(new Set(chips.map((entry) => entry.y)).size, 1);
  assert.equal(new Set(chips.map((entry) => groupFromName(entry.objectName))).size, 1);
  assert.ok(chips.every((entry) => entry.x >= ZONE.x));
  assert.ok(chips.every((entry) => entry.x + entry.w <= ZONE.x + ZONE.w));
});

test('plain callouts can anchor from opposite outer edges', () => {
  const leftZone = { x: 0, y: 0, w: 5, h: 2, class: 'A' };
  const rightZone = { x: 5, y: 0, w: 5, h: 2, class: 'A' };
  const left = capture(drawCallout, leftZone, {
    text: 'Uses electricity',
    points: 'none',
    placement: 'left',
    variant: 'blue'
  });
  const right = capture(drawCallout, rightZone, {
    text: 'Does not use electricity',
    points: 'none',
    placement: 'right',
    variant: 'orange'
  });
  assert.ok(Math.abs(left.shapes[0].x - (leftZone.x + 0.06)) < 0.001);
  assert.ok(
    Math.abs(
      right.shapes[0].x + right.shapes[0].w -
      (rightZone.x + rightZone.w - 0.06)
    ) < 0.001
  );
});

test('parallel text cards share one height and one text size group', () => {
  const { shapes, texts } = capture(drawRow, ZONE, {
    equaliseTextCards: true,
    items: [
      { type: 'text', value: 'Light', align: 'center', color: '0070C0' },
      { type: 'text', value: 'Sound', align: 'center', color: '0070C0' },
      { type: 'text', value: 'Heat', align: 'center', color: '0070C0' },
      { type: 'text', value: 'Movement', align: 'center', color: '0070C0' }
    ]
  }, {
    slideIndex: 0,
    imageDims: {},
    cardLook: true
  });
  assert.equal(shapes.length, 4);
  assert.equal(new Set(shapes.map((shape) => shape.y)).size, 1);
  assert.equal(new Set(shapes.map((shape) => shape.h)).size, 1);
  assert.equal(texts.length, 4);
  assert.equal(new Set(texts.map((entry) => groupFromName(entry.objectName))).size, 1);
  assert.ok(texts.every((entry) => entry.align === 'center'));
});

test('completed sort uses one large panel per category', () => {
  const { shapes, texts } = capture(drawSortBoard, ZONE, {
    groups: [
      { label: 'Uses electricity', items: ['Kettle', 'Torch'] },
      { label: 'Does not use electricity', items: ['Book', 'Wooden spoon'] }
    ]
  });
  const headings = texts.filter((entry) => /__sort-heading-/.test(entry.objectName || ''));
  const items = texts.filter((entry) => /__sort-item-/.test(entry.objectName || ''));
  assert.equal(headings.length, 2);
  assert.equal(items.length, 4);
  const outerPanels = shapes.filter((shape) => shape.h > 4.5);
  assert.equal(outerPanels.length, 2);
  assert.ok(items.every((entry) => entry.h > 1.5));
});

test('completed sort item labels share one grow-fit group', () => {
  const { texts } = capture(drawSortBoard, ZONE, {
    groups: [
      { label: 'Uses electricity', items: ['Kettle', 'Torch'] },
      { label: 'Does not use electricity', items: ['Book', 'Wooden spoon'] }
    ]
  });
  const items = texts.filter((entry) => /__sort-item-/.test(entry.objectName || ''));
  assert.equal(new Set(items.map((entry) => groupFromName(entry.objectName))).size, 1);
  assert.ok(items.every((entry) => /__54__/.test(entry.objectName)));
});

test('multiple answer reveals reset after each line', () => {
  const runs = splitAnswerRuns(
    'Object: ||Hairdryer\nPower source: ||Mains electricity\nEvidence: ||It has a plug.',
    true
  );
  assert.equal(
    runs.map((run) => run.text).join(''),
    'Object: Hairdryer\nPower source: Mains electricity\nEvidence: It has a plug.'
  );
  assert.equal(
    runs.some((run) => run.text.includes('||')),
    false
  );
  const greenRuns = runs.filter(
    (run) => run.options && run.options.color === '00B050'
  );
  assert.deepEqual(
    greenRuns.map((run) => run.text),
    ['Hairdryer', 'Mains electricity', 'It has a plug.']
  );
});

test('evidence answers stay directly below their own photographs', (t) => {
  const image = temporaryImage(t);
  const ctx = { slideIndex: 0, imageDims: { [image]: { w: 100, h: 100 } } };
  const { texts, images } = capture(drawEvidenceCards, ZONE, {
    items: [
      {
        imagePath: image,
        fields: [
          { label: 'Object name', value: 'Hairdryer' },
          { label: 'Power source', value: 'Mains electricity' }
        ]
      },
      {
        imagePath: image,
        fields: [
          { label: 'Object name', value: 'Manual can opener' },
          { label: 'Power source', value: 'No electrical power source' }
        ]
      }
    ]
  }, ctx);
  const answers = texts.filter((entry) => /__evidence-answer-/.test(entry.objectName || ''))
    .sort((a, b) => a.x - b.x);
  const photos = images.slice().sort((a, b) => a.x - b.x);
  assert.equal(answers.length, 2);
  assert.equal(photos.length, 2);
  answers.forEach((answer, index) => {
    const photo = photos[index];
    assert.ok(answer.x <= photo.x);
    assert.ok(answer.x + answer.w >= photo.x + photo.w);
    assert.ok(answer.y >= photo.y + photo.h);
  });
  assert.ok(answers.every((answer) => answer.w < ZONE.w / 2));
});

test('evidence answer text shares one grow-fit group', (t) => {
  const image = temporaryImage(t);
  const ctx = { slideIndex: 0, imageDims: { [image]: { w: 100, h: 100 } } };
  const { texts } = capture(drawEvidenceCards, ZONE, {
    items: [
      { imagePath: image, fields: [{ label: 'Object name', value: 'Hairdryer' }] },
      { imagePath: image, fields: [{ label: 'Object name', value: 'Manual can opener' }] }
    ]
  }, ctx);
  const answers = texts.filter((entry) => /__evidence-answer-/.test(entry.objectName || ''));
  assert.equal(new Set(answers.map((entry) => groupFromName(entry.objectName))).size, 1);
  assert.ok(answers.every((entry) => /__36__/.test(entry.objectName)));
});

test('evidence cards refuse more than four cards', () => {
  assert.throws(
    () => capture(drawEvidenceCards, ZONE, { items: new Array(5).fill({ imagePath: 'x' }) }),
    /EVIDENCE_CARDS_CAPACITY/
  );
});

test('new grouping helpers are registered only in large usable zones', () => {
  assert.deepEqual(ZONE_COMPAT['sort-board'], ['A', 'B', 'C', 'E-wide']);
  assert.deepEqual(ZONE_COMPAT['evidence-cards'], ['A', 'B', 'C', 'E-wide']);
  assert.deepEqual(ZONE_COMPAT['source-pathway'], ['A', 'C', 'E-wide']);
});

test('a short takeaway card can hug its text and centre as one object', () => {
  const { shapes, texts } = capture(drawContent, ZONE, {
    type: 'text',
    value: 'Some appliances do more than one.',
    fontSize: 28,
    widthMode: 'content',
    placement: 'center',
    align: 'center'
  }, {
    slideIndex: 0,
    imageDims: {},
    cardLook: true
  });
  assert.equal(shapes.length, 1);
  assert.equal(texts.length, 1);
  assert.ok(shapes[0].w < ZONE.w);
  assert.ok(
    Math.abs(
      shapes[0].x + shapes[0].w / 2 -
      (ZONE.x + ZONE.w / 2)
    ) < 0.001
  );
  assert.equal(texts[0].align, 'center');
});

test('source pathway keeps four sources distinct before electricity and appliance', () => {
  const { shapes, texts } = capture(drawSourcePathway, ZONE, {
    sources: [
      'Mains socket',
      'Battery / cell',
      'Solar cell',
      'Turn handle\nDynamo'
    ],
    middle: 'Electricity',
    outcome: 'Appliance'
  });
  const rendered = texts.map((entry) => entry.content);
  assert.deepEqual(rendered, [
    'Mains socket',
    'Battery / cell',
    'Solar cell',
    'Turn handle\nDynamo',
    'Electricity',
    'Appliance'
  ]);
  const sourceTexts = texts.slice(0, 4);
  assert.equal(
    new Set(sourceTexts.map((entry) => groupFromName(entry.objectName))).size,
    1
  );
  const arrows = shapes.filter(
    (shape) => shape.line && shape.line.endArrowType === 'triangle'
  );
  assert.equal(arrows.length, 2);
  assert.ok(texts[4].y > sourceTexts[0].y);
  assert.ok(texts[5].y > texts[4].y);
});

test('contain preserves the full natural aspect', (t) => {
  const image = temporaryImage(t);
  const { images } = capture(drawImage, { x: 0, y: 0, w: 2.24, h: 2.24 }, {
    type: 'image', imagePath: image, fit: 'contain'
  }, { slideIndex: 0, imageDims: { [image]: { w: 400, h: 100 } } });
  assert.equal(images.length, 1);
  assert.equal(images[0].w / images[0].h, 4);
  assert.equal(images[0].w, 2);
  assert.equal(images[0].h, 0.5);
  assert.equal(images[0].sizing, undefined);
});

test('cover uses a centred crop instead of stretch', (t) => {
  const image = temporaryImage(t);
  const { images } = capture(drawImage, { x: 0, y: 0, w: 2.24, h: 2.24 }, {
    type: 'image', imagePath: image, fit: 'cover'
  }, { slideIndex: 0, imageDims: { [image]: { w: 400, h: 100 } } });
  assert.equal(images.length, 1);
  assert.equal(images[0].sizing.type, 'crop');
  assert.equal(images[0].sizing.x, 3);
  assert.equal(images[0].sizing.y, 0);
  assert.equal(images[0].sizing.w, 2);
  assert.equal(images[0].sizing.h, 2);
});

// ─── A PICTURE THAT HAS NOT ARRIVED YET ───────────────────────
//
// A run sources its photographs while the slide specification is being written,
// so a deck is routinely drawn with some pictures delivered and some still
// coming. The reserved space for a picture that has not arrived is what the
// designer reads the composition off, so it has to mean the same thing as the
// space a delivered picture takes. It used to mean the opposite: a pending
// picture filled its whole cell while a delivered one was contain-fitted and
// its card hugged it, so a wide, shallow cell previewed as a broad landscape
// band and then rendered a near-square photograph at a quarter of that width.

// A wide, shallow picture cell: the shape a 2x2 grid of pictures takes when a
// statement bar sits above and below it.
const SHALLOW_PICTURE_CELL = { x: 0.22, y: 1.9, w: 6.3, h: 1.55, class: 'C' };

test('a picture that has not arrived reserves the room a picture is guaranteed', (t) => {
  clearWarnings();
  t.after(() => clearWarnings());
  const { shapes } = capture(
    drawContent,
    SHALLOW_PICTURE_CELL,
    { type: 'image', imagePath: 'not-delivered-yet.jpg', caption: 'Kettle - heats water' },
    { slideIndex: 0, imageDims: {}, cardLook: true }
  );
  const grey = shapes.find((shape) => shape.kind === 'rect');
  assert.ok(grey, 'a required picture still holds its place while it is missing');
  // Square, because which orientation arrives is not the lesson's to choose.
  assert.ok(
    Math.abs(grey.w - grey.h) < 0.01,
    `the placeholder is square, not a full-cell band (got ${grey.w} x ${grey.h})`
  );
  assert.ok(
    grey.w < SHALLOW_PICTURE_CELL.w / 2,
    'the placeholder never promises width the cell cannot guarantee'
  );
});

test('a pending and a delivered picture claim the same room in the same cell', (t) => {
  clearWarnings();
  t.after(() => clearWarnings());
  const image = temporaryImage(t);
  const caption = 'Hand whisk - mixes food';

  const pending = capture(
    drawContent,
    SHALLOW_PICTURE_CELL,
    { type: 'image', imagePath: 'not-delivered-yet.jpg', caption },
    { slideIndex: 0, imageDims: {}, cardLook: true }
  );
  const delivered = capture(
    drawContent,
    SHALLOW_PICTURE_CELL,
    { type: 'image', imagePath: image, caption },
    { slideIndex: 0, imageDims: { [image]: { w: 900, h: 800 } }, cardLook: true }
  );

  const pendingCard = pending.shapes.find((shape) => shape.kind !== 'rect');
  const deliveredCard = delivered.shapes.find((shape) => shape.kind !== 'rect');
  assert.ok(pendingCard && deliveredCard, 'both cells draw a card');
  // A near-square photograph is what the square stand-in predicted, so the two
  // cards are within a whisker of each other. Before the fix the pending card
  // was the full 6.3in cell and the delivered one about 1.1in.
  assert.ok(
    Math.abs(pendingCard.w - deliveredCard.w) < 0.2,
    `pending ${pendingCard.w} and delivered ${deliveredCard.w} cards must agree`
  );
});

test('a cover-fit picture that has not arrived still fills its cell', (t) => {
  clearWarnings();
  t.after(() => clearWarnings());
  const { shapes } = capture(
    drawContent,
    SHALLOW_PICTURE_CELL,
    { type: 'image', imagePath: 'not-delivered-yet.jpg', fit: 'cover' },
    { slideIndex: 0, imageDims: {}, cardLook: true }
  );
  const grey = shapes.find((shape) => shape.kind === 'rect');
  assert.ok(grey, 'a required cover picture holds its place');
  // A cover picture really is cropped to fill its frame, so the whole frame is
  // the honest reservation here and the square stand-in would understate it.
  assert.ok(grey.w > SHALLOW_PICTURE_CELL.w - 0.5, 'cover keeps the full width');
});

test('an optional picture that has not arrived still leaves no empty card', (t) => {
  clearWarnings();
  t.after(() => clearWarnings());
  const { shapes } = capture(
    drawContent,
    SHALLOW_PICTURE_CELL,
    { type: 'image', imagePath: 'not-delivered-yet.jpg', essential: false, caption: 'nice to have' },
    { slideIndex: 0, imageDims: {}, cardLook: true }
  );
  assert.equal(shapes.length, 0, 'an enhancement that could not be sourced vanishes cleanly');
  assert.equal(getWarnings().length, 0, 'and says nothing, by design');
});

test('a picture cell too small to read from the back of the room is named', (t) => {
  clearWarnings();
  t.after(() => clearWarnings());
  capture(
    drawContent,
    SHALLOW_PICTURE_CELL,
    { type: 'image', imagePath: 'not-delivered-yet.jpg', caption: 'Kettle - heats water' },
    { slideIndex: 0, imageDims: {}, cardLook: true }
  );
  const sizeWarnings = getWarnings().filter((line) => /short side/.test(line));
  assert.equal(sizeWarnings.length, 1, 'named once, on the slide it belongs to');
  assert.match(sizeWarnings[0], /back of the room/);
  assert.match(sizeWarnings[0], /non-essential/, 'and says how a supporting photo opts out');
});

test('the same cramped cell is named whether or not the picture arrived', (t) => {
  // The fault is the allocation, not the file, so the answer must not change
  // when the picture stage delivers. A warning that only appeared afterwards
  // would reach the designer once repairing it had become expensive.
  const image = temporaryImage(t);
  t.after(() => clearWarnings());

  clearWarnings();
  capture(
    drawContent,
    SHALLOW_PICTURE_CELL,
    { type: 'image', imagePath: image, caption: 'Kettle - heats water' },
    { slideIndex: 0, imageDims: { [image]: { w: 1600, h: 900 } }, cardLook: true }
  );
  assert.equal(getWarnings().filter((line) => /short side/.test(line)).length, 1);
});

test('a picture cell with room to be read is left alone', (t) => {
  clearWarnings();
  t.after(() => clearWarnings());
  capture(
    drawContent,
    { x: 0.22, y: 0.8, w: 6.3, h: 3.2, class: 'C' },
    { type: 'image', imagePath: 'not-delivered-yet.jpg', caption: 'Kettle - heats water' },
    { slideIndex: 0, imageDims: {}, cardLook: true }
  );
  assert.equal(
    getWarnings().filter((line) => /short side/.test(line)).length,
    0,
    'a 2x2 picture grid with real height is a sound composition'
  );
});

test('a supporting picture in a small corner is not held to the reading floor', (t) => {
  clearWarnings();
  t.after(() => clearWarnings());
  capture(
    drawContent,
    { x: 0.22, y: 1.9, w: 1.4, h: 1.4, class: 'G' },
    { type: 'image', imagePath: 'not-delivered-yet.jpg', essential: false },
    { slideIndex: 0, imageDims: {}, cardLook: true }
  );
  assert.equal(getWarnings().filter((line) => /short side/.test(line)).length, 0);
});

test('an unmeasured real image stops the build', (t) => {
  const image = temporaryImage(t);
  assert.throws(
    () => capture(drawImage, ZONE, { type: 'image', imagePath: image }, { slideIndex: 0, imageDims: {} }),
    /IMAGE_DIMENSIONS_UNAVAILABLE/
  );
});

test('bullets grow to a back-row-readable size in a short wide strip', () => {
  // A four-question circuit strip in a 7.5 x 1.8 zone: the font search must
  // land at a size the whole strip reads at from the back row, not at the
  // fixed list size that used to leave the strip floating in dead space.
  const items = [
    'Draw the missing circuit labels.',
    'Join the wires in order.',
    'Predict what the lamp will do next.',
    'Draw the circuit and explain why the lamp stays lit.'
  ];
  assert.ok(
    chooseBulletFont(items, 7.5, 1.8) >= 22,
    'a four-question strip in 7.5 x 1.8 must size at 22pt or larger'
  );
});

test('an explicit phase break earns a narrower card than the flat paragraph', () => {
  const flat = measureQuestionStack([
    'Write the missing labels and join the circuit in a loop. Explain why each part of the circuit is needed. Say what happens to the lamp when the switch opens.'
  ], 24, 10);
  const broken = measureQuestionStack([
    'Write the missing labels and join the circuit in a loop.\nExplain why each part of the circuit is needed.\nSay what happens to the lamp when the switch opens.'
  ], 24, 10);
  assert.ok(broken.w < flat.w, 'the card hugs the longest written line, not the paragraph');
  assert.ok(broken.cards.length === 1 && flat.cards.length === 1);
  assert.ok(broken.cards[0].h > 0 && flat.cards[0].h > 0);
  // The break still carries every written line, so the broken card keeps the
  // height the three phases need - the width saving comes from the hug, not
  // from dropped lines.
  assert.equal(broken.cards[0].h, flat.cards[0].h);
});

test('a labelled diagram card hugs the contained picture', () => {
  const data = {
    type: 'label-diagram',
    imagePath: 'robin.png',
    callouts: [{ anchor: [50, 50], label: 'The beak', given: true }]
  };
  const ctx = {
    slideIndex: 0,
    imageDims: {},
    cardLook: true,
    labelDiagramImages: { [labelDiagramKey(data)]: { png: Buffer.from('x'), aspect: 4 } }
  };
  const { shapes } = capture(drawContent, ZONE, data, ctx);
  assert.equal(shapes.length, 1, 'one card around the contained diagram');
  assert.ok(shapes[0].h < 3.2, 'the card hugs the 4:1 picture, not the 5in zone');
  assert.ok(shapes[0].h > 2.0, 'and it still carries the picture at a real size');
});

test('a circuit diagram card hugs the contained drawing', () => {
  const data = {
    type: 'circuit-diagram',
    circuits: [
      { circuit: { cells: 1, components: ['lamp'], switch: 'closed', path: 'complete', label: 'Complete' } },
      { circuit: { cells: 1, components: ['lamp'], switch: 'open', path: 'complete', label: 'Open' } }
    ]
  };
  const { aspect } = tightSvg(data);
  const ctx = {
    slideIndex: 0,
    imageDims: {},
    cardLook: true,
    circuitDiagramImages: { [circuitDiagramKey(data)]: { png: Buffer.from('x'), aspect } }
  };
  const { shapes } = capture(drawContent, ZONE, data, ctx);
  assert.equal(shapes.length, 1, 'one card around the contained circuit');
  assert.ok(shapes[0].h < 4, 'the card hugs the drawing, not the 5in zone');
});

test('E-narrow short text may grow to 28pt', () => {
  const result = capture(
    drawContent,
    {
      x: 0,
      y: 0,
      w: 3.8,
      h: 2.0,
      class: 'E-narrow'
    },
    {
      type: 'text',
      value: 'Open switch'
    },
    {
      slideIndex: 0,
      cardLook: false,
      imageDims: {}
    }
  );

  const text = result.texts.find(
    (entry) =>
      entry.content === 'Open switch'
  );

  assert.ok(text);
  assert.equal(text.fontSize, 28);
});

test('heightMode fill keeps a paired text card at full zone height', () => {
  const zone = {
    x: 0,
    y: 0,
    w: 4,
    h: 4.5,
    class: 'C'
  };

  const result = capture(
    drawContent,
    zone,
    {
      type: 'text',
      value:
        'A = cell\n\nB = lamp\n\nC = switch\n\nD = wire',
      heightMode: 'fill'
    },
    {
      slideIndex: 0,
      cardLook: true,
      imageDims: {}
    }
  );

  const card = result.shapes.find(
    (shape) =>
      shape.fill &&
      shape.fill.color === 'FFFFFF'
  );

  assert.ok(card);
  assert.ok(
    Math.abs(card.h - zone.h) < 0.001
  );
});

test('invalid text heightMode fails loudly', () => {
  assert.throws(
    () =>
      capture(
        drawContent,
        {
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          class: 'C'
        },
        {
          type: 'text',
          value: 'Question',
          heightMode: 'stretchy'
        },
        {
          slideIndex: 0,
          cardLook: true,
          imageDims: {}
        }
      ),
    /TEXT_HEIGHT_MODE_INVALID/
  );
});

test('a circuit symbol bank card hugs the contained bank', () => {
  const data = {
    type: 'circuit-symbol-bank',
    items: [
      { symbol: 'cell', label: 'cell' },
      { symbol: 'lamp', label: 'lamp' },
      { symbol: 'wire', label: 'wire' },
      { symbol: 'switch-open', label: 'open switch' },
      { symbol: 'switch-closed', label: 'closed switch' }
    ]
  };
  const { aspect } = symbolBankSvg(data);
  const ctx = {
    slideIndex: 0,
    imageDims: {},
    cardLook: true,
    circuitSymbolBankImages: { [circuitSymbolBankKey(data)]: { png: Buffer.from('x'), aspect } }
  };
  const { shapes } = capture(drawContent, ZONE, data, ctx);
  assert.equal(shapes.length, 1, 'one card around the contained bank');
  assert.ok(shapes[0].h < 2.2, 'the five-symbol bank hugs a strip, not the 5in zone');
});
