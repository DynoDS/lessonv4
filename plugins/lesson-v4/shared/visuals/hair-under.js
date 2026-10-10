'use strict';

// How near a miss still draws, said once.
//
// A size floor is the right place to refuse a drawing nobody could use: two
// charts sharing a slide at 0.6in a column cannot be written in, and the build
// says so. The same line was also refusing drawings a teacher cannot tell from
// ones that pass. On 8 October 2026 a Year 4 column-addition deck lost four
// slides to "Check this slide before teaching" over write-in columns 0.824in
// wide against a floor of 0.83in; earlier decks spent a repair pass on counters
// 0.14in across against 0.147in and on table rows 0.36in tall against 0.38in.
// The teacher was shown all three drawn as they stood and would have taught
// from each ("not enough for a repair round"). The slide designer has three
// repair passes for a whole deck, so a pass spent on a difference nobody can
// see is a pass missing when a fault that matters turns up.
//
// So a slide refused over a size is given one second look with near misses let
// through: a drawing within HAIR of its floor is drawn and recorded as a note,
// and anything further under is refused exactly as before. It is a second look
// and not a lower floor, because the layout tries a drawing at several sizes on
// its way to the one it keeps, and a floor lowered everywhere stopped that
// search early and left a healthy deck's counters smaller than it would have
// made them. A slide that fits is therefore drawn exactly as it always was. The limit:
// this is for a measured size on the board only. Paper keeps its floors to the
// line, because a child writes in those cells and nobody has looked at a near
// miss there; and it is not for text that would spill out of its box or a
// count of things that would not fit, where a little over is visibly wrong.

const HAIR = 0.06;

const found = [];
let slideNumber = null;
let allowed = false;

// On only while the build redraws a slide it has just refused over a size.
function allowHairUnder(on) {
  allowed = Boolean(on);
}

function setHairUnderSlide(n) {
  slideNumber = Number.isFinite(n) ? n : null;
}

function clearHairUnder() {
  found.length = 0;
}

function hairUnderFindings() {
  return found.slice();
}

// True when `got` is clearly under `floor` and the caller should refuse. A near
// miss on a slide returns false, so the caller draws, and is kept as a note.
function clearlyUnder(got, floor, { surface, what, unit = 'in', perUnit = 72 } = {}) {
  if (!(got < floor)) return false;
  if (!allowed || surface !== 'slides' || got < floor * (1 - HAIR)) return true;
  if (slideNumber !== null) {
    const size = (v) => `${(v / perUnit).toFixed(3)}${unit}`;
    // The layout measures a drawing more than once; the last size is the one drawn.
    const earlier = found.findIndex((f) => f.slide === slideNumber && f.what === what);
    if (earlier !== -1) found.splice(earlier, 1);
    found.push({
      signal: 'DRAWN_A_HAIR_UNDER_SIZE',
      cue: true,
      slide: slideNumber,
      what,
      message:
        `${what} came out ${size(got)} against a floor of ${size(floor)}. That is close enough to teach from, ` +
        'so the slide is drawn as it stands. This is a note for the report and nothing to repair.',
    });
  }
  return false;
}

module.exports = { HAIR, clearlyUnder, allowHairUnder, setHairUnderSlide, clearHairUnder, hairUnderFindings };
