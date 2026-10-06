"use strict";

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

// A step's picture as the sheet draws it. What a step adds to the picture is
// drawn in that step's colour and keeps it on every later step, so the +2 jump
// is orange beside the orange card and still orange under step 3 (the teacher's
// note on the first number line sheet, 6 October 2026: every jump was the one
// blue, and nothing tied a jump to the step that made it). A number line's
// jumps are what it adds; a jump the designer coloured itself is left alone.
function stepVisual(card, index) {
  const steps = Array.isArray(card && card.steps) ? card.steps : [];
  const step = steps[index];
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
    return { ...jump, colour: STEP_THEMES[first % STEP_THEMES.length].main };
  });
  return { ...step.visual, jumps: coloured };
}

module.exports = { STEP_THEMES, stepVisual };
