'use strict';

// What the build says when a picture children work FROM is allocated a cell
// too small to read from the back of the room.
//
// Two things are pinned here. The DIAGNOSIS, because the number on its own
// sent a designer the wrong way: the message used to offer three repairs at
// once - a taller or wider zone, fewer pictures in the zone, mark it
// non-essential - without saying which of them could move this case. Only one
// ever can. A row of captioned photographs in a shallow band is stopped by
// height, so taking a picture out of the row widens the survivors and leaves
// the short side exactly where it was; a long row across a deep zone is
// stopped by width, so a taller zone does nothing. A slide deck reached
// `Slide self-repair: EXHAUSTED 3/3` still 0.11" short because three passes
// were spent on levers that could not move it.
//
// And the TIER, because a flat floor answered the wrong question. 1.6" says a
// picture is not broken; it never said whether the picture was the thing
// children were looking at. A history deck put its only classroom
// photograph, under a task that said "look closely", in a 2" cell beside an
// empty table and a 5" square of empty slide, and the flat floor passed it. So
// the floor now depends on how many pictures children work from share the
// slide: alone 3.0", one of a pair 2.2", one of three or more 1.6".

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawImage, pictureFloorFindings, clearPictureFloor } = require('../src/content/image');
const { getWarnings, clearWarnings } = require('../src/warnings');

// A lesson whose slide 0 carries `data` plus `companions` other pictures
// children work from, so the tier the check lands on is explicit in the test.
function lessonWith(data, companions = 0, extras = []) {
  const items = [data];
  for (let i = 0; i < companions; i += 1) {
    items.push({ type: 'image', imagePath: `unsplash/companion-${i}.jpg` });
  }
  return {
    slides: [
      {
        template: 'body-full',
        body: { type: 'stack', items: items.concat(extras) },
      },
    ],
  };
}

// Draw one picture into one zone and return the floor warning it raised, or
// null. Console noise is silenced: `warn` prints as well as records, and these
// tests deliberately raise warnings.
function floorWarning(zone, data, ctx = { slideIndex: 0, lesson: lessonWith(data) }) {
  clearWarnings();
  const realWarn = console.warn;
  console.warn = () => {};
  try {
    const pptx = new PptxGenJS();
    const slide = {
      addShape: () => {},
      addText: () => {},
      addImage: () => {},
    };
    drawImage(pptx, slide, zone, data, ctx);
  } finally {
    console.warn = realWarn;
  }
  const found = getWarnings().filter((w) => w.includes('on its short side'));
  clearWarnings();
  assert.ok(found.length <= 1, `expected at most one floor warning, got ${found.length}`);
  return found.length ? found[0] : null;
}

// A shallow band holding a captioned photograph: 1.94" tall, so 0.24" of pad
// and 0.54" of caption leave 1.16" of picture. Plenty wide.
const HEIGHT_BOUND = { x: 0.22, y: 4.9, w: 3.9, h: 1.94 };
// A thin column in a deep zone: 1.52" wide leaves 1.28" of picture, with far
// more height than the floor asks for.
const WIDTH_BOUND = { x: 0.22, y: 0.6, w: 1.52, h: 6.65 };
// Comfortable on both axes - the control.
const ROOMY = { x: 0.22, y: 0.6, w: 4.2, h: 4.6 };
// A wide, shallow cell that leaves 2.40" of picture: over the pair floor,
// under the hero's. This is the shape the history deck shipped.
const TWO_POINT_FOUR = { x: 0.33, y: 1.0, w: 12.6, h: 2.64 };
// 2.00" of picture: over the base floor, under the pair's.
const TWO_POINT_ZERO = { x: 0.33, y: 1.0, w: 6.0, h: 2.24 };
// The same 2.00" of picture once a caption has taken its 0.54".
const CAPTIONED_TWO_POINT_ZERO = { x: 0.33, y: 1.0, w: 6.0, h: 2.78 };

test('a picture stopped by height is told so, and told what will not help', () => {
  // Three pictures on the slide, so this is the base 1.6" tier and the
  // diagnosis numbers are the ones the flat floor always gave.
  const data = { type: 'image', imagePath: 'unsplash/tundra.jpg', caption: 'Tundra' };
  const message = floorWarning(HEIGHT_BOUND, data, {
    slideIndex: 0,
    lesson: lessonWith(data, 2),
  });
  assert.ok(message, 'a 1.16" picture space must raise the floor warning');

  assert.match(message, /1\.16" on its short side/);
  assert.match(message, /Height is what binds/);
  // The shortfall, so the designer knows how much room to find rather than
  // guessing and measuring again.
  assert.match(message, /0\.44" more height/);
  // What the caption is costing, because on this axis it is the single
  // biggest lever and nothing else on the slide reveals it.
  assert.match(message, /caption under the picture takes 0\.54"/);
  // The lever that cannot work here, named as such. This is the sentence that
  // stops a repair pass being spent on it.
  assert.match(message, /Fewer pictures side by side will not move it/);
});

test('a picture stopped by width is told so, and told what will not help', () => {
  const data = { type: 'image', imagePath: 'unsplash/kettle.jpg' };
  const message = floorWarning(WIDTH_BOUND, data, {
    slideIndex: 0,
    lesson: lessonWith(data, 2),
  });
  assert.ok(message, 'a 1.28" picture space must raise the floor warning');

  assert.match(message, /1\.28" on its short side/);
  assert.match(message, /Width is what binds/);
  assert.match(message, /0\.32" more width/);
  // A grid is the repair that actually returns width to each picture in a set.
  assert.match(message, /grid rather than one long row/);
  assert.match(message, /A taller zone will not move it/);
  // No caption, so nothing may be claimed about one.
  assert.ok(
    !/caption/.test(message),
    'a picture with no caption must not be told its caption costs anything'
  );
});

test('a cell short on both axes is sent to a different template, not a tweak', () => {
  // Rearranging inside this cell cannot reach the floor on either axis, so
  // offering a within-cell repair at all would spend the whole self-repair
  // budget for nothing.
  const message = floorWarning({ x: 0.22, y: 4.9, w: 1.52, h: 1.94 }, {
    type: 'image',
    imagePath: 'unsplash/desert.jpg',
    caption: 'Desert',
  });
  assert.ok(message, 'a doubly-short cell must raise the floor warning');

  assert.match(message, /Both axes are short/);
  assert.match(message, /different template or the beat split across two slides/);
  assert.ok(
    !/Height is what binds|Width is what binds/.test(message),
    'a doubly-short cell must not be blamed on one axis'
  );
});

test('a picture with room to be read raises nothing', () => {
  assert.equal(
    floorWarning(ROOMY, {
      type: 'image',
      imagePath: 'unsplash/rainforest.jpg',
      caption: 'Rainforest',
    }),
    null
  );
});

test('the only picture children work from on a slide is held to 3.0"', () => {
  // 2.40" was enough for the flat floor and is the size the history deck's
  // lone classroom photograph shipped at. Alone on the slide it is the hero,
  // and the message says so and names the tier's figure.
  const data = { type: 'image', imagePath: 'unsplash/classroom-1897.jpg' };
  const message = floorWarning(TWO_POINT_FOUR, data, {
    slideIndex: 0,
    lesson: lessonWith(data, 0, [{ type: 'table', headers: ['a', 'b'], rows: [['', '']] }]),
  });
  assert.ok(message, 'a lone 2.40" picture must raise the hero floor');
  assert.match(message, /2\.40" on its short side/);
  assert.match(message, /the only picture children work from on this slide/);
  assert.match(message, /needs 3\.00"/);
  assert.match(message, /Height is what binds/);
  assert.match(message, /0\.60" more height/);
});

test('one of a pair is held to 2.2", so 2.40" passes and 2.00" does not', () => {
  const data = { type: 'image', imagePath: 'unsplash/timetable-1862.jpg' };
  assert.equal(
    floorWarning(TWO_POINT_FOUR, data, { slideIndex: 0, lesson: lessonWith(data, 1) }),
    null,
    'a 2.40" picture in a pair is over the pair floor'
  );
  const message = floorWarning(TWO_POINT_ZERO, data, {
    slideIndex: 0,
    lesson: lessonWith(data, 1),
  });
  assert.ok(message, 'a 2.00" picture in a pair must raise the pair floor');
  assert.match(message, /one of two pictures children work from on this slide/);
  assert.match(message, /needs 2\.20"/);
});

test('one of three or more keeps the 1.6" base floor', () => {
  // Captioned, so the shallow band leaves 1.16" and is under the base floor.
  const data = { type: 'image', imagePath: 'unsplash/biome-a.jpg', caption: 'Desert' };
  assert.equal(
    floorWarning(CAPTIONED_TWO_POINT_ZERO, data, { slideIndex: 0, lesson: lessonWith(data, 2) }),
    null,
    'a 2.00" picture in a set of three is over the base floor'
  );
  const message = floorWarning(HEIGHT_BOUND, data, {
    slideIndex: 0,
    lesson: lessonWith(data, 3),
  });
  assert.ok(message, 'a 1.16" picture in a set must still raise the base floor');
  assert.match(message, /one of 4 pictures children work from on this slide/);
  assert.match(message, /needs 1\.60"/);
});

test('a companion marked essential: false does not count towards the tier', () => {
  // One working picture plus a supporting corner inset is still a lone
  // picture, so the hero floor applies to the working one.
  const data = { type: 'image', imagePath: 'unsplash/river.jpg' };
  const lesson = lessonWith(data, 0, [
    { type: 'image', imagePath: 'unsplash/setting.jpg', essential: false },
  ]);
  const message = floorWarning(TWO_POINT_FOUR, data, { slideIndex: 0, lesson });
  assert.ok(message, 'the working picture is still alone once the supporting one is discounted');
  assert.match(message, /the only picture children work from on this slide/);
});

test('supporting context is out of the check, however small its corner', () => {
  // `essential: false` is the honest way to say a photo is not what children
  // work from. A tiny corner inset of the real setting is meant to be tiny.
  assert.equal(
    floorWarning(HEIGHT_BOUND, {
      type: 'image',
      imagePath: 'unsplash/windowsill.jpg',
      caption: 'The real windowsill',
      essential: false,
    }),
    null
  );
});

test('a vocabulary card picture keeps the base floor, not the hero floor', () => {
  // A picture beside a word is not one children study, and it is drawn from
  // `words`, which the tier walk skips. It is held to 1.6" as it always was.
  // Captioned, so the shallow band leaves 1.16" and is under the base floor.
  const data = { type: 'image', imagePath: 'unsplash/torch.jpg', caption: 'torch' };
  const lesson = {
    slides: [
      {
        template: 'key-vocabulary',
        words: [{ word: 'torch', definition: 'A torch gives light.', visual: data }],
      },
    ],
  };
  assert.equal(
    floorWarning(CAPTIONED_TWO_POINT_ZERO, data, { slideIndex: 0, lesson }),
    null,
    'a 2.00" vocabulary picture is over the base floor and must not be held to 3.0"'
  );
  const message = floorWarning(HEIGHT_BOUND, data, { slideIndex: 0, lesson });
  assert.ok(message, 'a 1.16" vocabulary picture is still under the base floor');
  assert.match(message, /needs 1\.60"/);
});

test('a slide the check cannot see keeps the base floor', () => {
  // No lesson on the context: the real build always hands one over, so this
  // is a helper drawn on its own, and the flat floor it always had is the
  // honest answer when its company is genuinely unknown.
  assert.equal(
    floorWarning(TWO_POINT_FOUR, {
      type: 'image',
      imagePath: 'unsplash/unknown-company.jpg',
    }, { slideIndex: 0 }),
    null
  );
  const message = floorWarning(HEIGHT_BOUND, {
    type: 'image',
    imagePath: 'unsplash/unknown-company.jpg',
    caption: 'Unknown',
  }, { slideIndex: 0 });
  assert.ok(message);
  assert.match(message, /needs 1\.60"/);
});

test("a template's supports row is supporting by contract and keeps the base floor", () => {
  // `teach-compare-with-row` documents its `supports` row as "the smaller
  // supporting items below", so two artefact photographs there are not the
  // pair the slide is built around and are not held to 2.2".
  const data = { type: 'image', imagePath: 'unsplash/mayan-glyph.jpg', caption: 'A Mayan glyph' };
  const lesson = {
    slides: [
      {
        template: 'teach-compare-with-row',
        leftContent: { type: 'text', value: 'Stepped pyramids.' },
        rightContent: { type: 'text', value: 'Smooth pyramids.' },
        supports: {
          type: 'row',
          items: [data, { type: 'image', imagePath: 'unsplash/mayan-calendar.jpg', caption: 'A calendar' }],
        },
      },
    ],
  };
  assert.equal(
    floorWarning(CAPTIONED_TWO_POINT_ZERO, data, { slideIndex: 0, lesson }),
    null,
    'a 2.00" supporting picture is over the base floor'
  );
});

test('the pre-hug cell is what is measured, not the shrunk card around it', () => {
  // A card look hugs the zone in around the drawn picture, so by draw time the
  // zone can be smaller than the allocation the designer actually chose. The
  // allocation is the thing to repair, so `zone.cell` wins when it is present.
  const message = floorWarning(
    { ...ROOMY, cell: HEIGHT_BOUND },
    { type: 'image', imagePath: 'unsplash/tundra.jpg', caption: 'Tundra' }
  );
  assert.ok(message, 'the roomy hugged zone must not hide a cramped allocation');
  assert.match(message, /Height is what binds/);
});

test('a breach is recorded for the build to report as a blocking diagnostic', () => {
  // The warning alone shipped a two-inch classroom photograph under a task
  // that said "look closely"; the same fact now reaches the slide-design
  // check as PICTURE_BELOW_READABLE_FLOOR, which it refuses to promote.
  clearPictureFloor();
  const data = { type: 'image', imagePath: 'unsplash/classroom-1897.jpg' };
  floorWarning(TWO_POINT_FOUR, data, { slideIndex: 0, lesson: lessonWith(data, 0) });
  const findings = pictureFloorFindings();
  assert.equal(findings.length, 1);
  assert.equal(findings[0].signal, 'PICTURE_BELOW_READABLE_FLOOR');
  assert.equal(findings[0].slide, 1);
  assert.equal(findings[0].field, 'image:unsplash/classroom-1897.jpg');
  assert.match(findings[0].message, /needs 3\.00"/);

  clearPictureFloor();
  floorWarning(ROOMY, { type: 'image', imagePath: 'unsplash/rainforest.jpg' });
  assert.equal(pictureFloorFindings().length, 0, 'a picture with room records nothing');
});

// ─── Once the photograph has arrived ──────────────────────────────────────
//
// Everything above measures a picture that has not been delivered yet, where
// the honest answer is what the cell guarantees whatever shape turns up. Once
// the file is there its shape is known, and a contained picture only ever
// keeps the cell's short side when the two shapes match. A history deck's own
// classroom photograph is the case that exposed this: 400 x 332 in a 3.5"
// square cell reserves 3.26" and draws 2.71", a quarter-inch under the hero
// floor, with the reserved-frame check reporting nothing (5 September 2026).

// A file that really exists, so the check takes the delivered branch. Nothing
// opens it - the dimensions come from `imageDims`, exactly as the build
// supplies them - so which picture it is does not matter.
const REAL_FILE = path.join(__dirname, '..', 'assets', 'maps', 'europe.png');

// As `floorWarning`, but the picture has been delivered and measured.
function deliveredWarning(zone, data, dims, { companions = 0, extras = [] } = {}) {
  const withPath = { ...data, imagePath: REAL_FILE };
  const lesson = lessonWith(withPath, companions, extras);
  return floorWarning(zone, withPath, {
    slideIndex: 0,
    lesson,
    imageDims: { [REAL_FILE]: dims },
  });
}

// The history deck's cell: 3.5" square, no caption, so a 3.26" frame.
const SQUARE_CELL = { x: 0.5, y: 0.5, w: 3.5, h: 3.5 };
// Wide enough that the same photograph clears the hero floor: 3.76" of frame
// width carries a 1.2:1 picture to 3.12" tall.
const WIDER_CELL = { x: 0.5, y: 0.5, w: 4.0, h: 3.5 };

test('a delivered photograph is measured as drawn, not as the cell reserved', () => {
  const message = deliveredWarning(SQUARE_CELL, { type: 'image' }, { w: 400, h: 332 });
  assert.ok(message, 'a 2.71" drawn picture under a 3.0" floor must be reported');

  // The number the class actually sees, and the rectangle it came from.
  assert.match(message, /renders 3\.26" by 2\.71"/);
  assert.match(message, /only 2\.71" on its short side/);
  assert.match(message, /needs 3\.00"/);
  // Why a cell that reads as big enough is not: this is the sentence that
  // stops a designer measuring the cell again and concluding the check is wrong.
  assert.match(message, /cell reserves 3\.26", which reads as enough/);
  assert.match(message, /400 by 332/);
  // Width is the lever, even though the cell is square and the picture is
  // short on height: the fit already uses the full width, so height follows
  // from it and a taller cell moves nothing.
  assert.match(message, /Width is what binds/);
  assert.match(message, /0\.35" more width/);
});

test('the width that was asked for is the width that fixes it', () => {
  // 0.35" more width on a 3.5" cell is 3.85"; 4.0" is the next sensible cell
  // and clears it. A repair instruction that does not actually repair the case
  // costs a whole self-repair pass.
  assert.equal(deliveredWarning(WIDER_CELL, { type: 'image' }, { w: 400, h: 332 }), null);
});

test('a portrait photograph in the same cell is stopped by height instead', () => {
  // The mirror case, and the discrimination that a cell-only check cannot make:
  // identical cell, identical floor, opposite lever. 332 x 400 fills the
  // height and loses width, so widening the cell does nothing.
  const message = deliveredWarning(SQUARE_CELL, { type: 'image' }, { w: 332, h: 400 });
  assert.ok(message, 'a portrait picture drawn at 2.71" wide must be reported');
  assert.match(message, /renders 2\.71" by 3\.26"/);
  assert.match(message, /Height is what binds/);
  assert.match(message, /0\.35" more height/);
});

test('a panoramic photograph is told the real width a hero would need', () => {
  // A 2.67:1 landscape in a roomy 4.5" square cell still draws only 1.60"
  // tall. The honest answer is that a picture this shape cannot be a 3" hero
  // in any cell narrower than 8", which is a template decision, not a nudge.
  const message = deliveredWarning(
    { x: 0.5, y: 0.5, w: 4.5, h: 4.5 },
    { type: 'image' },
    { w: 1600, h: 600 }
  );
  assert.ok(message, 'a panoramic picture drawn at 1.60" must be reported');
  assert.match(message, /renders 4\.26" by 1\.60"/);
  assert.match(message, /Width is what binds/);
  assert.match(message, /3\.74" more width/);
});

test('the same photograph in the same cell passes as one of a pair', () => {
  // 2.71" is under the hero floor and over the pair floor. The delivered
  // measurement changes the number, not the tiers.
  assert.equal(
    deliveredWarning(SQUARE_CELL, { type: 'image' }, { w: 400, h: 332 }, { companions: 1 }),
    null
  );
});

test('a delivered supporting picture is still out of the check', () => {
  // `essential: false` is how a photo says it is context rather than the work.
  // Measuring the drawn rectangle must not drag those back in.
  assert.equal(
    deliveredWarning(SQUARE_CELL, { type: 'image', essential: false }, { w: 400, h: 332 }),
    null
  );
});

test('a picture that has not arrived still gets the early reserved-frame answer', () => {
  // The two branches must be distinguishable in the message, because they
  // answer different questions. Before delivery the check can only promise
  // what the cell guarantees; saying "renders" then would be a claim about a
  // file nobody has seen.
  const pending = floorWarning(TWO_POINT_FOUR, { type: 'image', imagePath: 'unsplash/not-yet.jpg' }, {
    slideIndex: 0,
    lesson: lessonWith({ type: 'image', imagePath: 'unsplash/not-yet.jpg' }, 0),
  });
  assert.ok(pending, 'a 2.40" reserved frame under the hero floor is still reported early');
  assert.match(pending, /is guaranteed only 2\.40"/);
  assert.ok(!/renders [0-9]/.test(pending), 'an undelivered picture must not be given drawn dimensions');

  const delivered = deliveredWarning(SQUARE_CELL, { type: 'image' }, { w: 400, h: 332 });
  assert.ok(!/is guaranteed only/.test(delivered), 'a delivered picture is measured, not promised');
});

test('one delivered picture raises one finding, not one per measurement', () => {
  // The reserved frame and the drawn rectangle are the same check on two
  // numbers. Reporting both would put 3.26" and 2.71" on one photograph and
  // leave a designer unable to tell which to repair against.
  clearPictureFloor();
  deliveredWarning(SQUARE_CELL, { type: 'image' }, { w: 400, h: 332 });
  const findings = pictureFloorFindings();
  assert.equal(findings.length, 1);
  assert.equal(findings[0].signal, 'PICTURE_BELOW_READABLE_FLOOR');
  assert.match(findings[0].message, /renders 3\.26" by 2\.71"/);
  clearPictureFloor();
});
