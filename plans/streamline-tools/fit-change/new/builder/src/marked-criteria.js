'use strict';

// A success-criteria list the lesson designer marked too long for every
// criteria panel (`tooLongForPanels: true` in lesson-design.json).
//
// The lesson check measured it against every panel the guidance names and let
// it through only because the designer could not tighten it without losing
// what a step tells a stuck child to do: the teacher's decision 11 is that an
// error never costs the deck. He does not want a blank
// page instead ("it should still try to fix it try to repair it"), and agreed
// on 24 September 2026 that such a list is drawn a little smaller, down to
// 16pt, on a finished slide flagged for him to check. His class test: 20pt was
// the smallest every child read, and 16pt is "really close to that limit". So a
// criteria panel draws a marked list at the largest size that fits, down to
// 16pt (success-criteria-panel.js), and the build names the slide for the
// teacher. The 18pt floor stands for every other list.
//
// A slide is matched to a marked list by the list's words. Nobody after the
// lesson designer may reword a criterion, so the words are how a slide names
// its list; a sticky line added beside the steps, and line breaks, are set
// aside.

const fs = require('fs');
const path = require('path');
const { criteriaStepsOf } = require('./content/capacity');
const { recording, withoutRecording } = require('./warnings');

// The least a marked list is drawn at. Nothing else goes under 18pt.
const MARKED_LIST_FONT_MIN = 16;

// Only the rarest case reaches this: a marked list that no criteria panel
// holds even at 16pt as the slide carries it. Either the lesson designer could
// not tighten it that far, and the lesson check let it through with a note
// because the deck is always made, or something the slide adds beside its
// words (a sticky line, a helper picture) has taken the last of the room.
const MARKED_TOO_LONG_MESSAGE =
  'This success-criteria list is marked too long in the design (`tooLongForPanels`), and ' +
  `no criteria panel holds it as this slide carries it, even at ${MARKED_LIST_FONT_MIN}pt, the ` +
  'least a marked list is drawn at: neither the practice panel at its widest nor the ' +
  'half-width split. Leave the slide flagged: no repair pass will find room for it, and it ' +
  'is delivered as a page for the teacher to check before teaching. Nothing was shrunk ' +
  'further or cut.';

function stepWords(step) {
  const text = typeof step === 'string' ? step : (step && typeof step.text === 'string' ? step.text : '');
  return text.replace(/\s+/g, ' ').trim();
}

// The words a list is known by.
function listKey(steps) {
  return steps.map(stepWords).filter((words) => !words.startsWith('✨')).join('\n');
}

// The marked lists of the design beside the lesson file, each by its words.
function markedCriteriaLists(lessonPath) {
  let design;
  try {
    design = JSON.parse(fs.readFileSync(path.join(path.dirname(lessonPath), 'lesson-design.json'), 'utf8'));
  } catch {
    return new Set();
  }
  const lists = new Set();
  (Array.isArray(design && design.successCriteria) ? design.successCriteria : []).forEach((sc) => {
    const steps = sc && sc.tooLongForPanels === true && sc.type === 'steps' && sc.content && sc.content.steps;
    if (Array.isArray(steps) && steps.length) lists.add(listKey(steps));
  });
  return lists;
}

// A list's own steps: a sticky line the slide designer puts beside them is
// set aside, because the mark is on the list.
function ownSteps(steps) {
  return steps.filter((step) => !stepWords(step).startsWith('✨'));
}

// Whether a list of steps is one of those lists, word for word.
function isMarkedList(steps, lists) {
  return !!(lists && lists.size) && Array.isArray(steps) && lists.has(listKey(steps));
}

// Whether a slide's criteria are one of those lists.
function showsMarkedList(slideData, lists) {
  return isMarkedList(criteriaStepsOf(slideData), lists);
}

// The largest floor, from the readable 18pt down to 16pt, at which a marked
// list draws: `drawsAt(floorPt)` draws it onto a slide nobody sees and throws
// the step fitter's refusal when it does not fit. Counting down is what makes
// it the largest size that fits; 16pt is not tried, it is what is left, and
// the real drawing then fits there or is refused there.
function markedListFloor(drawsAt) {
  const { TEXT_FONT_MIN } = require('./content/steps');
  for (let floorPt = TEXT_FONT_MIN; floorPt > MARKED_LIST_FONT_MIN; floorPt -= 1) {
    try {
      drawsAt(floorPt);
      return floorPt;
    } catch (err) {
      if (!/^STEP_TEXT_OVERLOAD:/.test(String(err && err.message))) throw err;
    }
  }
  return MARKED_LIST_FONT_MIN;
}

// The shape that holds a list, if either does: the practice panel (at
// whatever width it takes) or the half-width split, the two shapes the lesson
// check measures a list in. Drawn onto slides nobody sees, with the same code
// that draws them for real, so a marked list is measured at 16pt with the
// slide's marked lists in `ctx`, and at 18pt without them.
function namedShapeHolding(steps, ctx) {
  if (!Array.isArray(steps) || !steps.length) return null;
  const PptxGenJS = require('./require-global')('pptxgenjs');
  const { drawSlide } = require('./templates');
  const { scPanelWidth } = require('./templates/maths-turn-sc');
  const criteria = { type: 'steps', steps };
  const shapes = [
    ['the practice panel', () => scPanelWidth({ criteria }, Object.assign({}, ctx))],
    ['the half-width split', () => {
      const dry = new PptxGenJS();
      drawSlide(dry, dry.addSlide(), {
        template: 'split-h-50-50', title: 'x', primary: { type: 'text', value: 'x' },
        secondary: { type: 'sc-panel', content: criteria },
      }, Object.assign({}, ctx));
    }],
  ];
  for (const [name, draw] of shapes) {
    try {
      withoutRecording(draw);
      return name;
    } catch (err) {
      // Refused there: try the other shape.
    }
  }
  return null;
}

// Where a slide's marked list would fit at 16pt, if anywhere. A marked list
// still refused on a slide is the slide designer's to move while a named
// shape holds it; only when neither does is it the design's
// (MARKED_TOO_LONG_MESSAGE). The list is measured without a sticky line the
// slide carries beside it: that line keeps 18pt, and one that does not fit is
// the slide designer's to carry in its own treatment, as beside any list.
function markedListRoom(slideData, ctx) {
  const steps = criteriaStepsOf(slideData);
  return Array.isArray(steps) ? namedShapeHolding(ownSteps(steps), ctx) : null;
}

// Whether the practice panel at its widest or the half-width split holds a
// marked list at 18pt, as if it were not marked. If one does, the mark is
// stale (left behind after the list was tightened, which the lesson check
// names in a note), and the list is drawn, or refused, as any other: nothing
// under 18pt, and no flag telling the teacher it is too long for every panel.
// Measured on the list's own steps, and kept for the build, which asks once
// for every panel that shows the list.
const heldAt18 = new WeakMap();

function markedListHeldAt18(steps, ctx) {
  const lists = ctx && ctx.markedCriteria;
  const key = listKey(steps);
  let known = lists && typeof lists === 'object' ? heldAt18.get(lists) : undefined;
  if (known && known.has(key)) return known.get(key);
  const held = !!namedShapeHolding(ownSteps(steps), Object.assign({}, ctx, { markedCriteria: new Set() }));
  if (lists && typeof lists === 'object') {
    if (!known) {
      known = new Map();
      heldAt18.set(lists, known);
    }
    known.set(key, held);
  }
  return held;
}

// A marked list drawn under 18pt, one finding a slide: what the build names
// for the teacher to check. A drawing nobody will see records nothing.
const belowFloor = new Map();

function recordCriteriaBelowFloor(ctx, pt, steps) {
  if (!recording() || !ctx || !Number.isInteger(ctx.slideIndex)) return;
  const slide = ctx.slideIndex + 1;
  const words = String((steps && steps[0]) || '').split(/\s+/).filter(Boolean);
  const opening = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');
  belowFloor.set(slide, {
    signal: 'CRITERIA_BELOW_READABLE_FLOOR',
    slide,
    message:
      `the success criteria that begin "${opening}" are laid out at ${pt}pt, under the 18pt ` +
      'floor: the lesson design marks the list too long for every criteria panel ' +
      '(`tooLongForPanels`), because the lesson designer could not tighten it, and such a list is ' +
      `drawn at the largest size that fits, down to ${MARKED_LIST_FONT_MIN}pt, rather than left off ` +
      'the slide. Check this slide before teaching. Nothing was cut.',
  });
}

function criteriaBelowFloorFindings() {
  return [...belowFloor.values()];
}

function clearCriteriaBelowFloor() {
  belowFloor.clear();
}

module.exports = {
  listKey,
  markedCriteriaLists,
  isMarkedList,
  showsMarkedList,
  markedListFloor,
  markedListRoom,
  markedListHeldAt18,
  recordCriteriaBelowFloor,
  criteriaBelowFloorFindings,
  clearCriteriaBelowFloor,
  MARKED_LIST_FONT_MIN,
  MARKED_TOO_LONG_MESSAGE,
};
