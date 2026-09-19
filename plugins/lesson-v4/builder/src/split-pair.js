'use strict';

const { measureContentExtent, measureCompositionExtent } = require('./content');

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
  // A container is measured for the sake of its PARTNER, not for its own sake.
  //
  // `measureContentExtent` declines a stack or a row on purpose, and the reason
  // is a real one: a fill text beside a stack is meant to keep the whole zone
  // precisely because its partner cannot be measured. But that reason is about
  // the fill text, and the pass was using the same refusal to decide where the
  // OTHER side sits, so a photograph beside a stack of three cards centred on
  // the empty zone rather than on the cards. On the estimate slide the cards ran
  // from 0.60in to 5.11in, centre 2.86, and the photo sat centred at 3.93,
  // visibly low; the teacher moved it up by hand (19 September 2026).
  //
  // So each side keeps the narrow answer for its own behaviour, `measured`, and
  // gains the broader one, `contentH`, only for settling the pair's height. A
  // fill text still spans the pair, because `isFillText` is checked first and
  // nothing here changed what a fill text does.
  sides.forEach((side) => {
    const own = measureContentExtent(side.zone, side.data, ctx);
    const whole = own || measureCompositionExtent(side.zone, side.data, ctx);
    side.h = whole ? Math.min(whole.h, side.zone.h) : side.zone.h;
    side.measured = !!own;
    side.settles = !!whole;
  });
  // Two heights, because the two jobs want different answers.
  //
  // A fill text spans the pair, and what it may span is unchanged: the NARROW
  // measure only, so a fill text beside a container still keeps the whole zone,
  // which is the behaviour that paragraph above protects.
  //
  // Centring a shorter member is the job the broad measure was needed for, and
  // it is safe there because it only ever moves something that was already
  // going to be drawn shorter than its zone.
  const spanH = Math.max(
    sides[0].measured ? sides[0].h : sides[0].zone.h,
    sides[1].measured ? sides[1].h : sides[1].zone.h
  );
  const alignH = Math.max(
    sides[0].settles ? sides[0].h : sides[0].zone.h,
    sides[1].settles ? sides[1].h : sides[1].zone.h
  );
  sides.forEach((side) => {
    if (isFillText(side.data)) {
      side.zone.h = spanH;
    } else if (side.measured && side.h < alignH - 0.05) {
      side.zone.y += (alignH - side.h) / 2;
    }
  });
}

module.exports = { alignSplitHPair };
