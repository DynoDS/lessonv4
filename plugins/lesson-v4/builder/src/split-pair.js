'use strict';

const { measureContentExtent } = require('./content');

// Whole-composition alignment for a side-by-side split pair.
//
// The two zones of a split-h template used to be drawn blind to each other,
// which produced the two faults the teacher kept correcting by hand:
//
//   - a text with heightMode "fill" spanned its whole zone even when its
//     partner was a photo card half that height, so the "paired" card
//     towered over its pair with dead white space where the pairing was
//     supposed to be;
//   - a shorter member (usually the photo) sat pinned to the top beside a
//     taller partner, leaving a meaningless void underneath instead of the
//     one shared visual centre the pair should read as.
//
// This pass measures what each side will actually draw and settles the pair
// before either side is drawn: fill means "span the pair", so a fill card is
// never taller than the taller member; a measured shorter member centres on
// the pair. A side whose content spans whatever it is given (a stack, a
// panel, a helper with no measure) keeps its whole zone and the pair height
// is the zone height, which is exactly the old behaviour.
function isFillText(data) {
  return !!data && data.type === 'text' &&
    String(data.heightMode || '').toLowerCase() === 'fill';
}

function alignSplitHPair(primaryZone, primaryData, secondaryZone, secondaryData, ctx) {
  if (!primaryData || !secondaryData) return;
  const sides = [
    { zone: primaryZone, data: primaryData },
    { zone: secondaryZone, data: secondaryData }
  ];
  sides.forEach((side) => {
    const extent = measureContentExtent(side.zone, side.data, ctx);
    side.h = extent ? Math.min(extent.h, side.zone.h) : side.zone.h;
    side.measured = !!extent;
  });
  const pairH = Math.max(sides[0].h, sides[1].h);
  sides.forEach((side) => {
    if (isFillText(side.data)) {
      side.zone.h = pairH;
    } else if (side.measured && side.h < pairH - 0.05) {
      side.zone.y += (pairH - side.h) / 2;
    }
  });
}

module.exports = { alignSplitHPair };
