"use strict";

const { canonicalColumn } = require("../../shared/visuals/place-value-chart-svg");

// The colours of a stepByStep sheet, and what each step's picture takes from
// them. Kept apart from the sheet's renderer because the pictures are drawn
// before any card is laid out, and both places must agree on the picture.

// One colour a step, so five steps read as five things. Blue, orange and purple
// are the board's own category colours; pink and teal carry a fourth and fifth
// step. Green is an answer or a taught word on every surface, so it never
// tells steps apart.
const STEP_THEMES = [
  { main: "0070C0", fill: "E8F2FB" },
  { main: "E46C0A", fill: "FEF1E4" },
  { main: "7030A0", fill: "F2EAF8" },
  { main: "C2185B", fill: "FCE8F0" },
  { main: "00828A", fill: "E3F4F5" },
];

const NUMBER_LINES = new Set(["numberLine", "number-line"]);

function jumpsOf(step) {
  const visual = step && step.visual;
  return visual && NUMBER_LINES.has(visual.type) && Array.isArray(visual.jumps) ? visual.jumps : null;
}

const sameJump = (a, b) => a && b && a.from === b.from && a.to === b.to;

// A column subtraction's exchanges, and the column a step rings.
function sumOf(step) {
  const visual = step && step.visual;
  return visual && visual.type === "place-value-chart" && visual.calculation && typeof visual.calculation === "object" ? visual.calculation : null;
}

const exchangesOf = (step) => {
  const sum = sumOf(step);
  return sum && Array.isArray(sum.exchanges) ? sum.exchanges : [];
};

// A step's picture as the sheet draws it. What a step adds to the picture is
// drawn in that step's colour and keeps it on every later step, so the +2 jump
// is orange beside the orange card and still orange under step 3 (the teacher's
// note on the first number line sheet, 6 October 2026: every jump was the one
// blue, and nothing tied a jump to the step that made it). A number line's
// jumps are what it adds; a jump the designer coloured itself is left alone.
// A column subtraction adds its exchanges the same way: the crossed-out digit,
// the digit above it and the small 1 are the colour of the step that made
// them, and the column a step rings is ringed in that step's colour (the
// teacher's mock-up of 10 October 2026, each exchange in its card's colour).
function stepVisual(card, index) {
  const before = stepsBefore(card);
  return sequenceVisual(Array.isArray(card && card.steps) ? card.steps : [], index, STEP_THEMES.map((_, k) => STEP_THEMES[(k + before) % STEP_THEMES.length].main));
}

// A sequence too long for one sheet runs on to the next, and the second sheet
// carries on the count and the colours. Each sheet used to count its own steps
// from 1, so the six features of a river in order went up as 1, 2, 3 beside
// 1, 2, 3 in the same three colours, and nothing said the sheets were one
// order or which came first (stress test, 7 October 2026). Step sheets that
// follow one another under the same title are one sequence; under different
// titles they are two methods, and each starts at 1.
const stepsBeforeCard = new WeakMap();
const sequenceOfCard = new WeakMap();
const isStepSheet = (card) => Boolean(card && card.type === "stepByStep" && Array.isArray(card.steps));
const titleOf = (card) => String((card && card.title) || "").trim().toLowerCase();

function continueStepSheets(cards) {
  let previous = null;
  (Array.isArray(cards) ? cards : []).forEach((card) => {
    if (!isStepSheet(card)) {
      previous = null;
      return;
    }
    const carriesOn = previous && titleOf(previous) === titleOf(card);
    stepsBeforeCard.set(card, carriesOn ? stepsBefore(previous) + previous.steps.length : 0);
    const sequence = carriesOn ? sequenceOfCard.get(previous) : [];
    sequence.push(...card.steps);
    sequenceOfCard.set(card, sequence);
    previous = card;
  });
}

// How many steps of the same sequence the sheets before this one hold.
function stepsBefore(card) {
  return (card && stepsBeforeCard.get(card)) || 0;
}

// The step of this sequence that a word names, on whichever sheet it stands:
// the step whose heading or own label is that word. A second label on a
// photograph takes that step's colour, so "confluence" pointed out on the
// tributary's photograph is the purple of the confluence step below it (the
// teacher, 10 October 2026: a repeated word is the same colour, arrow and all).
const plainWord = (text) => String(Array.isArray(text) ? text[0] || "" : text || "").replace(/\{\{|\}\}|<<|>>|\*\*/g, "").trim().toLowerCase();
function themeOfWord(card, word) {
  const steps = (card && sequenceOfCard.get(card)) || (card && card.steps) || [];
  const wanted = plainWord(word);
  if (!wanted) return null;
  const at = steps.findIndex((step) => step && (plainWord(step.heading) === wanted || plainWord(step.note) === wanted));
  return at < 0 ? null : STEP_THEMES[at % STEP_THEMES.length];
}

// The colour of a step on its sheet, counted along the whole sequence.
function stepThemeOn(card, index) {
  return STEP_THEMES[(stepsBefore(card) + index) % STEP_THEMES.length];
}

// A section whose parts are stages of one thing (`sequence: true`, a before and
// an after) colours what each part adds the same way, in the part's own colour.
// Any other section's pictures are left as written.
const PART_COLOURS = ["0070C0", "E46C0A", "7030A0"];
function partVisual(card, index) {
  const parts = Array.isArray(card && card.parts) ? card.parts : [];
  if (!card || card.sequence !== true) return parts[index] ? parts[index].visual : undefined;
  return sequenceVisual(parts, index, PART_COLOURS);
}

function sequenceVisual(steps, index, colours) {
  const colourOf = (at) => colours[at % colours.length];
  const step = steps[index];
  const sum = sumOf(step);
  if (sum && (exchangesOf(step).length || sum.ring)) {
    const exchanges = exchangesOf(step).map((exchange, k) => {
      if (!exchange || typeof exchange !== "object" || exchange.colour) return exchange;
      let first = index;
      for (let earlier = 0; earlier < index; earlier += 1) {
        if (sameJump(exchangesOf(steps[earlier])[k], exchange)) {
          first = earlier;
          break;
        }
      }
      return { ...exchange, colour: colourOf(first) };
    });
    const calculation = { ...sum, ...(exchanges.length ? { exchanges } : {}) };
    if (sum.ring && !sum.ringColour) calculation.ringColour = colourOf(index);
    return { ...step.visual, calculation };
  }
  const jumps = jumpsOf(step);
  if (!jumps) return step ? step.visual : undefined;
  const coloured = jumps.map((jump) => {
    if (!jump || typeof jump !== "object" || jump.colour) return jump;
    let first = index;
    for (let k = 0; k < index; k += 1) {
      if ((jumpsOf(steps[k]) || []).some((earlier) => sameJump(earlier, jump))) {
        first = k;
        break;
      }
    }
    return { ...jump, colour: colourOf(first) };
  });
  return { ...step.visual, jumps: coloured };
}

// The picture of a one-big-picture method sheet (workedExample, pictureFirst).
// Each step has its own colour there: its circle on the picture, its number and
// card in the list, and whatever it writes on the sum. All green, the circles,
// the list and the crossings-out read as one mass and nothing said which step
// went with what (the teacher, 10 October 2026). An exchange takes the colour
// of the step pinned to the digit written above it ("tens exchange").
const PLACE_OF = {
  M: "millions", HTh: "hundred thousands", TTh: "ten thousands", Th: "thousands",
  H: "hundreds", T: "tens", O: "ones", t: "tenths", h: "hundredths", th: "thousandths",
};

function stepTheme(number) {
  return STEP_THEMES[(Math.max(1, Number(number) || 1) - 1) % STEP_THEMES.length];
}

function methodVisual(card) {
  const visual = card && card.visual;
  if (!visual || card.type !== "workedExample" || card.layout !== "pictureFirst") return visual;
  const callouts = Array.isArray(visual.callouts) ? visual.callouts : [];
  const pinned = callouts.map((callout) => (
    callout && Number.isInteger(callout.step) && callout.step > 0 && !callout.colour
      ? { ...callout, colour: stepTheme(callout.step).main }
      : callout
  ));
  const out = { ...visual, ...(callouts.length ? { callouts: pinned } : {}) };
  // A number line's jump takes the colour of the step pinned to it ("jump 2").
  if (NUMBER_LINES.has(visual.type) && Array.isArray(visual.jumps)) {
    out.jumps = visual.jumps.map((jump, k) => {
      if (!jump || typeof jump !== "object" || jump.colour) return jump;
      const pin = pinned.find((callout) => callout && callout.colour && callout.part === `jump ${k + 1}`);
      return pin ? { ...jump, colour: pin.colour } : jump;
    });
  }
  const sum = visual.type === "place-value-chart" && visual.calculation && typeof visual.calculation === "object" ? visual.calculation : null;
  if (sum && Array.isArray(sum.exchanges)) {
    out.calculation = {
      ...sum,
      exchanges: sum.exchanges.map((exchange) => {
        if (!exchange || typeof exchange !== "object" || exchange.colour) return exchange;
        const place = PLACE_OF[canonicalColumn(String(exchange.from || ""))];
        const pin = pinned.find((callout) => callout && callout.colour && callout.part === `${place} exchange`);
        return pin ? { ...exchange, colour: pin.colour } : exchange;
      }),
    };
  }
  return out;
}

module.exports = { STEP_THEMES, stepVisual, partVisual, methodVisual, stepTheme, continueStepSheets, stepsBefore, stepThemeOn, themeOfWord };
