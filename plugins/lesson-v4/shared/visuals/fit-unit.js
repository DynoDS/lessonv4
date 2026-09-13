'use strict';

// The size a shared drawing is laid out at, for the drawings whose every part
// grows with one unit (a brick's width, a cell's font, a circle's label).
//
// Paper and the wall draw a picture at its natural size and only shrink it to
// the width they have; the board fits a fixed zone and may grow into spare room
// as far as its profile allows (shared/visuals/surface-profiles.js). Either way
// the unit never goes under the floor the drawing names, and a caller that is
// still too big at the floor refuses by name, because a picture shrunk until its
// words are unreadable is not a smaller picture, it is a broken one.
//
//   fitUnit(layoutAt, profile, natural, floor) -> { unit, fits, layout }
//
// `layoutAt(unit)` returns at least { w, h } in points.

function fitUnit(layoutAt, profile, natural, floor) {
  const W = profile.widthPt;
  const H = profile.heightPt || null;
  let unit = natural * (H ? profile.grow || 1 : 1);
  let layout = layoutAt(unit);
  for (let k = 0; k < 60; k += 1) {
    const over = Math.max(layout.w / W, H ? layout.h / H : 0);
    if (over <= 1.0005 || unit <= floor) break;
    unit = Math.max(floor, unit / Math.max(1.002, over));
    layout = layoutAt(unit);
  }
  const fits = layout.w <= W + 0.5 && (!H || layout.h <= H + 0.5);
  return { unit, fits, layout };
}

// The box less the stroke a drawing lets bleed past its edge, so a drawing laid
// out to fill its box never comes back a few points bigger than the box.
function insetProfile(profile, bleedPt) {
  return {
    ...profile,
    widthPt: Math.max(1, profile.widthPt - 2 * bleedPt),
    heightPt: profile.heightPt ? Math.max(1, profile.heightPt - 2 * bleedPt) : profile.heightPt,
  };
}

module.exports = { fitUnit, insetProfile };
