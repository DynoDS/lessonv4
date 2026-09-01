'use strict';

// Is the picture actually using the space it was given?
//
// A map, a photograph and any other figure with a true shape is drawn CONTAINED
// in its slot: scaled until it touches two sides, never stretched, because a
// stretched map draws countries the wrong shape. That is right, and it has a
// consequence nobody was measuring. When the slot's proportions are a long way
// from the picture's, containing it leaves the rest of the slot empty, and the
// picture ends up a fraction of the size the slide had room for.
//
// A Year 4 world map went out at a bit over half the width of its card, with the
// rest white either side, and a world-to-continent zoom filled the top third of a
// tall card and left the remainder blank - which the optional-picture pass then
// helpfully decorated, because to that pass empty space is an opportunity rather
// than a symptom. Nothing errored. The deck looked deliberate. The map was just
// small, on a lesson about reading a map.
//
// The builder cannot fix this, and should not try: making the picture fill the
// slot means stretching it, and choosing a better-shaped slot is a composition
// decision that belongs to the designer. So this measures and reports, in the
// same advisory shape as the capacity checks next door.
//
// WHY A RATIO AND NOT A SIZE. "The picture is small" is not a fault on its own -
// a small slot honestly holds a small picture. The fault is a picture small
// BESIDE THE ROOM IT WAS GIVEN, which is exactly the mismatch between the two
// shapes, and that is what a coverage fraction measures.

// Coverage below this means the slot's proportions and the picture's disagree by
// more than about 1.7 to 1, which is where the empty band stops reading as a
// margin and starts reading as a hole. A map of 2:1 in a card of 2.5:1 covers
// 0.80 and looks right; the same map in a card of 3.6:1 covers 0.56 and does
// not.
const COVERAGE_FLOOR = 0.60;

// ...and the waste has to be worth a sentence. A thumbnail leaving 0.3in of slot
// empty is nobody's problem, so a slot has to be giving away at least this much
// on its long axis before the finding is raised. Together these keep the check
// on the case it exists for: a big picture in a badly shaped big slot.
const WASTED_INCHES = 1.0;

const findings = [];

function clearZoneFill() {
  findings.length = 0;
}

function zoneFillWarnings() {
  return findings.slice();
}

// Record how one contained figure sat in its slot. `zone` is what the template
// allocated, `drawn` is the rectangle the figure actually occupied, both in
// slide inches. Called by every helper that contains a figure of a true shape.
function checkZoneFill(ctx, zone, drawn, label) {
  if (!ctx || typeof ctx.slideIndex !== 'number') return;
  if (!zone || !drawn) return;
  const zoneArea = zone.w * zone.h;
  const drawnArea = drawn.w * drawn.h;
  if (!(zoneArea > 0) || !(drawnArea > 0)) return;

  const coverage = drawnArea / zoneArea;
  if (coverage >= COVERAGE_FLOOR) return;

  const wastedW = zone.w - drawn.w;
  const wastedH = zone.h - drawn.h;
  if (Math.max(wastedW, wastedH) < WASTED_INCHES) return;

  // Name the axis that is being given away, because the repair differs. A wide
  // picture in a tall slot wants a shorter, wider slot; a wide picture in an
  // even wider slot wants that slot narrowed or the picture given company.
  const acrossIsWasted = wastedW > wastedH;
  const axis = acrossIsWasted ? 'either side of it' : 'above and below it';
  const spare = acrossIsWasted ? wastedW : wastedH;

  findings.push({
    signal: 'FIGURE_ZONE_UNDERFILLED',
    slide: ctx.slideIndex + 1,
    field: label,
    message:
      `${label} fills only ${Math.round(coverage * 100)}% of the space it was given, ` +
      `leaving ${spare.toFixed(1)}in empty ${axis}. Its true proportions are ` +
      `${(drawn.w / drawn.h).toFixed(2)}:1 and the slot's are ${(zone.w / zone.h).toFixed(2)}:1, ` +
      `so containing it without distorting it cannot use the rest. Give this figure a slot ` +
      `shaped more like it - a wider, shallower zone for a wide picture, or a taller one for a ` +
      `tall picture - or put something beside it in the space it cannot reach. Do not stretch it: ` +
      `a distorted map draws countries the wrong shape.`,
  });
}

module.exports = { checkZoneFill, zoneFillWarnings, clearZoneFill, COVERAGE_FLOOR, WASTED_INCHES };
