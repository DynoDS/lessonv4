'use strict';

// What the build says when a picture children work FROM is allocated a cell
// too small to read from the back of the room.
//
// The floor itself is old. What these tests pin is the DIAGNOSIS, because the
// number on its own sent a designer the wrong way. The message used to offer
// three repairs at once - a taller or wider zone, fewer pictures in the zone,
// mark it non-essential - without saying which of them could move this case.
// Only one ever can. A row of captioned photographs in a shallow band is
// stopped by height, so taking a picture out of the row widens the survivors
// and leaves the short side exactly where it was; a long row across a deep zone
// is stopped by width, so a taller zone does nothing. A slide deck reached
// `Slide self-repair: EXHAUSTED 3/3` still 0.11" short because three passes
// were spent on levers that could not move it.
//
// So the check has to name the binding axis, the shortfall, and what the
// caption is costing, and has to say plainly which repair will not work.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawImage } = require('../src/content/image');
const { getWarnings, clearWarnings } = require('../src/warnings');

// Draw one picture into one zone and return the floor warning it raised, or
// null. Console noise is silenced: `warn` prints as well as records, and these
// tests deliberately raise warnings.
function floorWarning(zone, data) {
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
    drawImage(pptx, slide, zone, data, { slideIndex: 0 });
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

test('a picture stopped by height is told so, and told what will not help', () => {
  const message = floorWarning(HEIGHT_BOUND, {
    type: 'image',
    imagePath: 'unsplash/tundra.jpg',
    caption: 'Tundra',
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
  const message = floorWarning(WIDTH_BOUND, {
    type: 'image',
    imagePath: 'unsplash/kettle.jpg',
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
