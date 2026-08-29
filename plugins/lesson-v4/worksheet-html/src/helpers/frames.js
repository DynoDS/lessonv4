"use strict";

// Places a child writes INTO, where the shape of the place is part of the
// teaching.
//
// The engine already had ruled lines under a question, which is the plainest
// version of this and the only one it had. Real worksheets are full of richer
// ones: an empty speech bubble that says "reply to this person", a museum tag
// that says "this is a label, so write like a label", a fact file whose named
// slots say what a country study needs to record.
//
// The shape does work that a ruled line cannot. A child asked to reply in a
// speech bubble writes speech; the same child given three lines writes a
// sentence about speech. That is the whole reason these are separate helpers
// rather than one lined box with a different heading.
//
// House rule from the colour system, and it governs everything here: a
// sentence-starter carries NO colour of its own. It is set apart by weight and
// by having its own line. Colour on paper means question (blue), given
// material (orange) or vocabulary (green), and a scaffold is none of those.

const { LINE_MM, NOTE_LINE_MM, WRITING_LINE_MM, PT_MM, esc, promptHtml, linesFor } = require("./shared");
const { TYPE, RULE, INSET, SPACE } = require("../tokens");

const WIDEST_ZONE_MM = 261;

function writingLineMm(spec) {
  return WRITING_LINE_MM[spec.phase === "upper" ? "upper" : "lower"];
}

// ─── speech-scene ────────────────────────────────────────────────────────
// One or more turns of a conversation: a figure, and a bubble that is either
// printed for the child to read or empty for the child to fill.

const FIGURE_MM = 20; // the head-and-shoulders beside a bubble
const BUBBLE_PAD_V_MM = INSET.card.v;
const BUBBLE_PAD_H_MM = INSET.card.h;
const BUBBLE_TAIL_MM = 5; // the pointer, which hangs BELOW the bubble body
const TURN_GAP_MM = 5;

// The widest a PRINTED bubble is allowed to run, in millimetres: about fifty
// characters of body text, which is a comfortable measure for a line a child
// reads.
//
// A printed bubble holds a sentence somebody said, so it is the size of that
// sentence. Given a full-width zone it took the whole page: "10 more than 72
// is 73." was drawn inside a bubble 174mm wide with nothing in the right-hand
// two thirds of it, which reads as a box to write in rather than as speech.
// The match-up card states the same rule for the same reason - "a large empty
// box on a worksheet means write in here" - and it is not about beauty: it is
// the wrong instruction.
//
// A BLANK bubble is exempt. That one IS a box to write in, and every
// millimetre of it is room the child uses.
const BUBBLE_MEASURE_MM = 105;

// The box a child puts their tick or cross in, and the two marks printed
// beside it so it is obvious what may go there.
//
// A sheet whose instruction read "Tick or cross." drew Sam's claim and then a
// writing line, so the one thing the child was asked to do had nowhere to
// happen. An instruction on a worksheet is a promise about the paper: if it
// says tick or cross, a box to tick has to be there.
//
// One box rather than a tick box and a cross box side by side. The child's
// answer is a MARK, and asking them to tick the box next to a printed cross
// makes the answer a mark about a mark. The pair is printed beside the box as
// a key, which says what may go in it without turning it into a choice of
// boxes.
const JUDGE_BOX_MM = 12;
const JUDGE_MARK_MM = 5;

// A plain head and shoulders, drawn in the ink colour by inheritance rather
// than a colour of its own. Deliberately featureless: it stands for "a person
// is speaking", and a face drawn here would be a character the lesson did not
// ask for.
function figureSvg(name) {
  return `
    <span class="h-speech-figure">
      <svg viewBox="0 0 100 120" class="h-speech-fig-svg" aria-hidden="true">
        <circle cx="50" cy="34" r="26" fill="none" stroke="currentColor" stroke-width="5"/>
        <path d="M12 118 a38 38 0 0 1 76 0" fill="none" stroke="currentColor" stroke-width="5"/>
      </svg>
      ${name ? `<span class="h-speech-name">${esc(name)}</span>` : ""}
    </span>`;
}

function bubbleBodyMm(turn, bubbleWidthMm, lineMm) {
  if (turn.says) {
    return linesFor(turn.says, bubbleWidthMm - BUBBLE_PAD_H_MM * 2) * LINE_MM + BUBBLE_PAD_V_MM * 2;
  }
  const lines = Math.max(1, turn.lines || 3);
  return lines * lineMm + BUBBLE_PAD_V_MM * 2;
}

// The room a bubble has, which for a printed one is capped at the measure
// above. Capping the DRAWING without capping this is how a helper starts
// under-estimating: the text wraps sooner than the arithmetic thinks, the
// bubble takes a line the estimate never counted, and the bottom of it is
// quietly clipped by the zone.
function speechBubbleWidthMm(widthMm, turn) {
  const available = Math.max(30, widthMm - FIGURE_MM - 4);
  return turn && turn.says ? Math.min(available, BUBBLE_MEASURE_MM) : available;
}

function turnHeightMm(turn, widthMm, lineMm) {
  const bubbleMm =
    bubbleBodyMm(turn, speechBubbleWidthMm(widthMm, turn), lineMm) + BUBBLE_TAIL_MM;
  // The figure carries a name under it, so it is taller than the drawing alone.
  const figureMm = FIGURE_MM + NOTE_LINE_MM;
  return Math.max(bubbleMm, figureMm);
}

// Does this scene ask the child to judge what was said?
//
// Read from the INSTRUCTION the designer already wrote, rather than from a
// field they would have to know exists. A field would be a second way of
// saying the same thing, and the sheet that went out was wrong precisely
// because the two ends were not tied together: it said "Tick or cross." and
// drew a writing line, so the one thing the child was asked to do had nowhere
// to happen. Wording the instruction IS asking for the box.
const TICK_OR_CROSS = /\btick\s*(?:or|\/|,|and)\s*(?:a\s+)?cross\b/i;

function wantsTickOrCross(spec) {
  return TICK_OR_CROSS.test(String(spec.text || ""));
}

// The two marks, drawn rather than typed. A ✓ and a ✗ are characters Comic
// Sans does not carry, so a typed one falls back to whatever font the machine
// finds and prints at a size and weight nobody chose. Two strokes each.
function judgeMarksSvg() {
  const box = JUDGE_MARK_MM;
  const stroke = `fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round"`;
  return `
    <svg viewBox="0 0 100 100" class="h-speech-mark" aria-hidden="true" style="width:${box}mm;height:${box}mm">
      <path d="M15 55 L40 80 L85 20" ${stroke}/>
    </svg>
    <span class="h-speech-judge-or">or</span>
    <svg viewBox="0 0 100 100" class="h-speech-mark" aria-hidden="true" style="width:${box}mm;height:${box}mm">
      <path d="M22 22 L78 78 M78 22 L22 78" ${stroke}/>
    </svg>`;
}

function judgeBoxHtml() {
  return `
      <div class="h-speech-judge">
        <span class="h-speech-judge-box"></span>
        <span class="h-speech-judge-key">${judgeMarksSvg()}</span>
      </div>`;
}

function renderSpeechScene(spec) {
  const lineMm = writingLineMm(spec);

  const turns = (spec.turns || [])
    .map((turn) => {
      const side = turn.side === "right" ? "right" : "left";
      const inner = turn.says
        ? `<p class="h-speech-says">${esc(turn.says)}</p>`
        : Array.from(
            { length: Math.max(1, turn.lines || 3) },
            () => `<span class="h-speech-line" style="height:${lineMm}mm"></span>`
          ).join("");

      return `
      <li class="h-speech-turn h-speech-${side}">
        ${figureSvg(turn.speaker)}
        <span class="h-speech-bubble${turn.says ? " h-speech-given" : " h-speech-blank"}">
          ${inner}
        </span>
      </li>`;
    })
    .join("");

  return `
    <div class="h-speech">
      ${spec.text ? `<p class="h-speech-stem">${promptHtml(spec.text)}</p>` : ""}
      <ul class="h-speech-turns">${turns}</ul>
      ${wantsTickOrCross(spec) ? judgeBoxHtml() : ""}
    </div>`;
}

function measureSpeechScene(spec, widthMm) {
  const lineMm = writingLineMm(spec);
  const stemMm = spec.text ? linesFor(spec.text, widthMm) * LINE_MM + 2 : 0;
  const turns = spec.turns || [];
  const body = turns.reduce((h, t) => h + turnHeightMm(t, widthMm, lineMm), 0);
  const gaps = Math.max(0, turns.length - 1) * TURN_GAP_MM;
  // The answer box and the gap above it, counted here so the zone leaves room
  // for the one thing the child has to do.
  const judgeMm = wantsTickOrCross(spec) ? JUDGE_BOX_MM + SPACE.item : 0;
  return stemMm + body + gaps + judgeMm;
}

function needsSpeechScene(spec) {
  return {
    // A figure plus a bubble a sentence fits into. Narrower than this and the
    // bubble takes more lines than it has room for.
    minWidthMm: 85,
    minHeightMm: measureSpeechScene(spec, WIDEST_ZONE_MM),
  };
}

// ─── fact-file ───────────────────────────────────────────────────────────
// Named slots a child fills in: a country study, a monarch, a habitat. The
// field NAMES are what makes it teach; they say what counts as knowing about
// this thing.
//
// A field is a plain string, or an object when it needs scaffolding:
//
//   "Capital city"
//   { name: "Capital city", hint: "The capital is ...", wordBank: ["Madrid"] }
//
// The scaffolding exists for the below sheet, and it is the whole reason this
// helper can carry that sheet at all. The principle it serves is to remove the
// BARRIER while leaving the child their own subject: a starter is a frame the
// child finishes about their own choice, not a topic handed to them.
//
// The words in a bank are separated rather than run together, for the reason
// chip-bank states in its own opening lines: a list joined by spaces reads as
// running text, and a child picking one word out of six should not have to
// parse a sentence first. A middot does that here without the borders a
// chip-bank draws, which would be heavy inside a field that is already boxed.
//
// Note what the scaffolding is NOT: a colour. The design system deliberately
// has no scaffold colour, and states why - a starter is set apart by weight and
// by having its own line, exactly as a writing frame's starters are, which
// keeps the page to four colour meanings instead of five. A word bank IS
// coloured, because it is material handed to the child, which is what the
// `given` orange already means everywhere else on the sheet.

const FIELD_WRITE_MM = 10; // the room under one field name
// A field in a fact file is a cell, and it already sat on the cell inset:
// 1mm above the label and 1mm below the writing space, 2mm each side.
const FIELD_PAD_MM = INSET.cell.v * 2; // above plus below
// Comes from the design system's line weights rather than a number
// chosen here, so every box on a sheet is drawn with the same pen.
const FIELD_BORDER_MM = RULE.line; // the rule between one field and the next

// One field, with every part of it accounted for.
//
// The first version said 6mm for the label and stopped there, which is a line
// of body text and nothing else: no padding, no rule between the fields. Two
// millimetres a field does not sound like much, and over five fields it was
// enough to slice the bottom off "Average rainfall" while the form still
// looked finished. The CSS below is pinned to this same number, so the two
// cannot drift apart again.
const FIELD_MM = LINE_MM + FIELD_WRITE_MM + FIELD_PAD_MM + FIELD_BORDER_MM;

// A field is a bare name, or a name with scaffolding hung on it.
function fieldParts(field) {
  return typeof field === "string" ? { name: field } : field || {};
}

// What the scaffolding adds to one field's height. Measured rather than
// assumed, because both parts wrap: a starter long enough to be useful is
// often two lines in a narrow column, and a field measured one line short
// slices the bottom off the writing space while the form still looks finished.
// One string, used by both the drawing and the measurement, so the two cannot
// disagree about how wide the bank runs.
function bankText(wordBank) {
  return wordBank.join("  ·  ");
}

function scaffoldMm(field, widthMm) {
  const { hint, wordBank } = fieldParts(field);
  const inner = Math.max(20, widthMm - INSET.cell.h * 2);
  return (
    (hint ? linesFor(hint, inner) * LINE_MM : 0) +
    // The bank now says "Word bank" on a line of its own, so the title is a
    // row the field has to be tall enough for. Left out of the sum, the label
    // would be drawn into space belonging to the writing lines below it.
    (wordBank && wordBank.length
      ? NOTE_LINE_MM +
        SPACE.hair +
        linesFor(bankText(wordBank), inner) * NOTE_LINE_MM +
        SPACE.hair
      : 0)
  );
}

// The title prints at section-label size, not body size.
const FF_TITLE_MM = TYPE.sectionLabel * PT_MM * 1.35 + 2;

// The box drawn round the whole set: its own border top and bottom, less the
// rule the last field does not draw.
const FF_FRAME_MM = 0.8 - FIELD_BORDER_MM;

function factFileHeightMm(spec, widthMm) {
  const fields = spec.fields || [];
  const scaffold = fields.reduce((h, f) => h + scaffoldMm(f, widthMm), 0);
  return (
    (spec.title ? FF_TITLE_MM : 0) +
    fields.length * FIELD_MM +
    scaffold +
    FF_FRAME_MM +
    0.5
  );
}

function renderFactFile(spec) {
  const fields = (spec.fields || [])
    .map((field) => {
      const { name, hint, wordBank } = fieldParts(field);
      const bank =
        wordBank && wordBank.length
          ? `<div class="h-ff-bank">
              <span class="h-ff-bank-title">Word bank</span>
              <span class="h-ff-bank-choices">${esc(bankText(wordBank))}</span>
            </div>`
          : "";
      return `
      <li class="h-ff-field">
        <span class="h-ff-label">${esc(name)}</span>
        ${hint ? `<span class="h-ff-hint">${esc(hint)}</span>` : ""}
        ${bank}
        <span class="h-ff-space"></span>
      </li>`;
    })
    .join("");

  return `
    <div class="h-ff">
      ${spec.title ? `<p class="h-ff-title">${esc(spec.title)}</p>` : ""}
      <ul class="h-ff-fields">${fields}</ul>
    </div>`;
}

function measureFactFile(spec, widthMm) {
  return factFileHeightMm(spec, widthMm);
}

function needsFactFile(spec) {
  return {
    // A field name and the answer under it both need to sit on one line at
    // ordinary body size; below this the labels start wrapping and the file
    // reads as a paragraph rather than a form.
    minWidthMm: 55,
    // Stated at the WIDEST a zone can be, so it is the SHORTEST this content
    // could come out. Measuring it at the minimum width would wrap every
    // starter and refuse zones the form would have sat in comfortably.
    minHeightMm: factFileHeightMm(spec, WIDEST_ZONE_MM),
  };
}

// ─── writing-frame ───────────────────────────────────────────────────────
// Sentence starters with room after each one, inside a frame whose SHAPE says
// what kind of writing this is. A museum tag, a postcard, a plaque.

const STARTER_GAP_MM = 2;

// The pointed end of a tag, as a FRACTION of the frame's width rather than a
// number of millimetres.
//
// The outline is one drawing stretched to whatever size the zone gives it, so
// its point is always the same share of the width: 28 units of 200 in the path
// below, which is 14%. Held clear with a fixed 14mm instead, the sums only
// agreed at one width, and on a full-width tag the last two writing lines ran
// out under the point and off the edge of the shape.
const TAG_POINT_FRACTION = 0.17; // the point, plus a little air after it

function frameOutline(shape) {
  // Drawn as an SVG outline stretched to the frame rather than a CSS border,
  // because a border cannot be any shape but a rectangle. `preserveAspectRatio
  // ="none"` is what lets one drawn shape fit whatever size the zone hands it.
  // No text inside it, so nothing here can print too small to read.
  if (shape === "tag") {
    return `
      <svg class="h-wf-outline" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 2 H170 L198 50 L170 98 H2 Z" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      </svg>`;
  }
  return `
    <svg class="h-wf-outline" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true">
      <rect x="2" y="2" width="196" height="96" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
    </svg>`;
}

function renderWritingFrame(spec) {
  const lineMm = writingLineMm(spec);
  const shape = spec.shape === "tag" ? "tag" : "plain";

  const starters = (spec.starters || [])
    .map((starter) => {
      const ruled = Array.from(
        { length: starterLinesCount(starter) },
        () => `<span class="h-wf-line" style="height:${lineMm}mm"></span>`
      ).join("");
      return `
        <li class="h-wf-starter">
          <span class="h-wf-text">${esc(starterText(starter))}</span>
          ${ruled}
        </li>`;
    })
    .join("");

  return `
    <div class="h-wf h-wf-${shape}">
      ${frameOutline(shape)}
      <div class="h-wf-inner">
        ${spec.text ? `<p class="h-wf-stem">${promptHtml(spec.text)}</p>` : ""}
        <ul class="h-wf-starters">${starters}</ul>
      </div>
    </div>`;
}

function starterLinesCount(starter) {
  return typeof starter === "string" ? 1 : Math.max(1, starter.lines || 1);
}

function starterText(starter) {
  return typeof starter === "string" ? starter : starter.text;
}

// The frame holds a stem and several starters, so it is a panel rather than a
// card. Both of these were written into the measurement below as a bare 8,
// which is 2 x 4mm and agreed with the CSS only by memory.
const WF_PAD_V_MM = INSET.panel.v;
const WF_PAD_H_MM = INSET.panel.h;

function measureWritingFrame(spec, widthMm) {
  const lineMm = writingLineMm(spec);
  const shape = spec.shape === "tag" ? "tag" : "plain";
  const innerMm =
    widthMm - WF_PAD_H_MM * 2 - (shape === "tag" ? widthMm * TAG_POINT_FRACTION : 0);
  const stemMm = spec.text ? linesFor(spec.text, innerMm) * LINE_MM + 2 : 0;

  const body = (spec.starters || []).reduce((h, starter) => {
    const textMm = linesFor(starterText(starter), innerMm) * LINE_MM;
    return h + textMm + starterLinesCount(starter) * lineMm + STARTER_GAP_MM;
  }, 0);

  return stemMm + body + WF_PAD_V_MM * 2;
}

function needsWritingFrame(spec) {
  return {
    // A starter and the space after it must sit inside the frame's padding,
    // and a tag loses another slice to its point.
    minWidthMm: spec.shape === "tag" ? 90 : 70,
    minHeightMm: measureWritingFrame(spec, WIDEST_ZONE_MM),
  };
}

// ─── storyboard ──────────────────────────────────────────────────────────
// Numbered boxes to draw in, each with writing lines beneath: a journey, a
// life cycle, a story retold in order.
//
// The grid is inside the helper, not in the layout. Eight boxes are one task a
// child works through in order, and a layout rebuilt for every count would be
// geometry standing in for content.

const SB_GAP_MM = 4;
const SB_BOX_RATIO = 0.52; // a drawing box's height against its own width
const SB_BOX_MIN_MM = 22;
const SB_BOX_MAX_MM = 44; // a box big enough to draw in does not keep gaining
// from being bigger, and two rows of enormous boxes push the rest off the page

// The smallest a column can be, and it depends on whether the child WRITES.
//
// A drawing box stops working somewhere around 45mm across. A writing line
// stops working much later than that, and the difference is what Daniel found
// on the check sheet: he confirmed the box at its floor and, in the same
// breath, said the children could not write on the lines. Both were true at
// once. At a 90mm two-column storyboard each line comes out 43mm long, and
// 43mm is not a line a child writes a sentence on.
//
// 70mm gives roughly the 8.5cm line the full-page cocoa-bean sheet already had,
// which is the version that worked on paper. A storyboard with no writing lines
// keeps the old floor, because then only the drawing has to fit.
const SB_DRAW_COLUMN_MM = 45;
const SB_WRITE_COLUMN_MM = 70;

function storyboardColumnMm(spec) {
  return (spec.lines ?? 2) > 0 ? SB_WRITE_COLUMN_MM : SB_DRAW_COLUMN_MM;
}

function storyboardColumns(spec) {
  const count = Math.max(1, spec.count || 1);
  return Math.max(1, Math.min(spec.columns || 2, count));
}

function storyboardCellWidthMm(widthMm, columns) {
  return Math.max(10, (widthMm - (columns - 1) * SB_GAP_MM) / columns);
}

function storyboardBoxHeightMm(widthMm, columns) {
  const cellMm = storyboardCellWidthMm(widthMm, columns);
  return Math.max(SB_BOX_MIN_MM, Math.min(SB_BOX_MAX_MM, cellMm * SB_BOX_RATIO));
}

function renderStoryboard(spec) {
  const count = Math.max(1, spec.count || 1);
  const columns = storyboardColumns(spec);
  const lineMm = writingLineMm(spec);
  const lines = Math.max(1, spec.lines || 2);

  const cells = Array.from({ length: count }, (unused, i) => {
    const ruled = Array.from(
      { length: lines },
      () => `<span class="h-sb-line" style="height:${lineMm}mm"></span>`
    ).join("");
    return `
      <li class="h-sb-cell">
        <span class="h-sb-box"><span class="h-sb-num">${i + 1}</span></span>
        <span class="h-sb-lines">${ruled}</span>
      </li>`;
  }).join("");

  return `
    <div class="h-sb">
      ${spec.text ? `<p class="h-sb-stem">${esc(spec.text)}</p>` : ""}
      <ul class="h-sb-grid" style="--h-sb-cols:${columns}">${cells}</ul>
    </div>`;
}

function measureStoryboard(spec, widthMm) {
  const count = Math.max(1, spec.count || 1);
  const columns = storyboardColumns(spec);
  const rows = Math.ceil(count / columns);
  const lineMm = writingLineMm(spec);
  const lines = Math.max(1, spec.lines || 2);

  const stemMm = spec.text ? linesFor(spec.text, widthMm) * LINE_MM + 2 : 0;
  const cellMm = storyboardBoxHeightMm(widthMm, columns) + lines * lineMm + 2;
  return stemMm + rows * cellMm + (rows - 1) * SB_GAP_MM;
}

function needsStoryboard(spec) {
  const count = Math.max(1, spec.count || 1);
  const columns = storyboardColumns(spec);
  const rows = Math.ceil(count / columns);
  const lineMm = writingLineMm(spec);
  const lines = Math.max(1, spec.lines || 2);
  return {
    minWidthMm: Math.min(
      267,
      columns * storyboardColumnMm(spec) + (columns - 1) * SB_GAP_MM
    ),
    minHeightMm: rows * (SB_BOX_MIN_MM + lines * lineMm + 2) + (rows - 1) * SB_GAP_MM,
  };
}

const css = `
  /* ─── speech-scene ─── */
  /* This helper claims spare height, so it has to take it, or the extra shows
     as a hole under the last bubble. The room goes into the BLANK bubbles,
     which is the only part of a scene that gains from being bigger: a printed
     line of speech and a drawn figure are the size they are. */
  .h-speech { font-size: var(--type-body); display: flex; flex-direction: column; height: 100%; }
  .h-speech-stem { margin: 0 0 var(--space-item); line-height: 1.35; }
  .h-speech-turns { list-style: none; margin: 0; padding: 0; flex: 1; display: flex; flex-direction: column; }
  /* Spare height is only worth spreading when something can use it, and in a
     scene that is a blank bubble. With every bubble printed, the turns hug
     their own content so that anything under them - the answer box below - sits
     where the reading does, directly beneath the speech, and the spare collects
     at the foot of the zone where a teacher trims it. */
  .h-speech-turns:not(:has(.h-speech-blank)) { flex: 0 0 auto; }
  .h-speech-turn {
    display: flex; align-items: stretch; gap: var(--space-tight);
    margin-bottom: ${TURN_GAP_MM}mm;
  }
  .h-speech-turn:has(.h-speech-blank) { flex: 1 1 auto; }
  .h-speech-blank { display: flex; flex-direction: column; }
  .h-speech-blank .h-speech-line { flex: 1 0 auto; }
  .h-speech-turn:last-child { margin-bottom: 0; }
  .h-speech-right { flex-direction: row-reverse; }
  .h-speech-figure {
    flex: none; width: ${FIGURE_MM}mm;
    display: flex; flex-direction: column; align-items: center;
    color: var(--colour-ink);
  }
  .h-speech-fig-svg { width: ${FIGURE_MM * 0.72}mm; height: ${FIGURE_MM}mm; display: block; }
  .h-speech-name {
    font-size: var(--type-note); line-height: 1.35;
    text-align: center; color: var(--colour-ink);
  }
  .h-speech-bubble {
    flex: 1;
    box-sizing: border-box;
    padding: ${BUBBLE_PAD_V_MM}mm ${BUBBLE_PAD_H_MM}mm;
    border-radius: 3mm;
    position: relative;
    margin-bottom: ${BUBBLE_TAIL_MM}mm;
  }
  /* A printed line of speech is material handed to the child, so it takes the
     given colour, the same as a word bank. An empty bubble is where the child
     writes, so it is plain ink like every other writing space. */
  /* And a printed bubble HUGS its sentence, up to the measure set above. It is
     the size of what was said; the room left over belongs to the page, not to
     the bubble. The blank one keeps flex: 1 from the rule above, because that
     one is a writing space and every millimetre of it gets used. */
  .h-speech-given {
    border: var(--rule-line) solid var(--colour-given);
    flex: 0 1 auto; max-width: ${BUBBLE_MEASURE_MM}mm;
  }
  .h-speech-blank { border: var(--rule-line) solid var(--colour-ink); }
  .h-speech-says { margin: 0; line-height: 1.35; }
  .h-speech-line {
    display: block;
    border-bottom: var(--rule-hair) dotted var(--colour-rule);
  }
  /* The tail, drawn as two stacked triangles so the outline shows: the back
     one is the border colour, the front one white and a shade smaller, sat on
     top of it. */
  .h-speech-bubble::before, .h-speech-bubble::after {
    content: ""; position: absolute; top: 100%;
    width: 0; height: 0;
    border-left: ${BUBBLE_TAIL_MM}mm solid transparent;
    border-right: 2mm solid transparent;
  }
  .h-speech-bubble::before { left: 8mm; border-top: ${BUBBLE_TAIL_MM}mm solid currentColor; }
  .h-speech-bubble::after { left: 8.4mm; border-top: ${BUBBLE_TAIL_MM - 0.8}mm solid white; }
  /* The tail points at whoever is speaking. With the figure moved to the right
     and the tail left where it was, every reply bubble pointed away from the
     person saying it and at the person who had just finished - which reads, to
     a child, as the wrong person talking. */
  .h-speech-right .h-speech-bubble::before,
  .h-speech-right .h-speech-bubble::after {
    left: auto;
    border-left: 2mm solid transparent;
    border-right: ${BUBBLE_TAIL_MM}mm solid transparent;
  }
  .h-speech-right .h-speech-bubble::before { right: 8mm; }
  .h-speech-right .h-speech-bubble::after { right: 8.4mm; }
  .h-speech-given { color: var(--colour-given); }
  .h-speech-given .h-speech-says { color: var(--colour-ink); }
  .h-speech-blank { color: var(--colour-ink); }

  /* The tick-or-cross answer box, under the bubble and indented to start where
     the bubble starts, so it reads as the answer to what was said rather than
     as a new thing. Left-anchored: spare width goes to the right margin. */
  .h-speech-judge {
    flex: none;
    display: flex; align-items: center; gap: var(--space-item);
    margin: var(--space-item) 0 0 ${FIGURE_MM + 4}mm;
  }
  .h-speech-judge-box {
    flex: none; box-sizing: border-box;
    width: ${JUDGE_BOX_MM}mm; height: ${JUDGE_BOX_MM}mm;
    border: var(--rule-line) solid var(--colour-ink);
  }
  /* The key is an instruction about what to draw, so ink, and small enough not
     to be mistaken for the answer itself. */
  .h-speech-judge-key {
    display: flex; align-items: center; gap: var(--space-tight);
    color: var(--colour-ink); font-size: var(--type-note); line-height: 1.35;
  }
  .h-speech-mark { display: block; flex: none; }

  /* ─── fact-file ─── */
  .h-ff { font-size: var(--type-body); display: flex; flex-direction: column; height: 100%; }
  .h-ff-title {
    margin: 0 0 var(--space-tight);
    font-size: var(--type-sectionLabel); color: var(--colour-question);
    line-height: 1.35;
  }
  .h-ff-fields {
    list-style: none; margin: 0; padding: 0;
    border: var(--rule-line) solid var(--colour-ink);
    flex: 1; display: flex; flex-direction: column;
  }
  .h-ff-field {
    flex: 1 1 auto;
    box-sizing: border-box;
    border-bottom: ${FIELD_BORDER_MM}mm solid var(--colour-ink);
    padding: ${INSET.cell.v}mm ${INSET.cell.h}mm;
    display: flex; flex-direction: column;
    min-height: ${FIELD_MM}mm;
  }
  .h-ff-field:last-child { border-bottom: 0; }
  .h-ff-label { line-height: 1.35; color: var(--colour-ink); }
  /* Set apart by weight and its own line rather than by a colour of its own,
     which is the same way a writing frame's starters are set apart and the
     reason the sheet still has four colour meanings rather than five. */
  .h-ff-hint {
    display: block; line-height: 1.35;
    font-weight: bold; color: var(--colour-ink);
  }
  /* Words handed to the child, which is exactly what the given colour means
     everywhere else on the page. Note size: it is support, not the task. */
  .h-ff-bank {
    display: block; line-height: 1.35;
    font-size: var(--type-note); color: var(--colour-given);
  }
  /* A recognisable labelled block rather than a run of middot-separated words.
     Unlabelled, the words read as an example answer sitting in the field. */
  .h-ff-bank-title {
    display: block;
    font-weight: bold;
    color: var(--colour-ink);
  }
  .h-ff-bank-choices { display: block; }
  .h-ff-space { flex: 1; min-height: ${FIELD_WRITE_MM}mm; }

  /* ─── writing-frame ─── */
  .h-wf { position: relative; font-size: var(--type-body); color: var(--colour-ink); }
  .h-wf-outline {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    display: block;
  }
  /* Writing space is the right home for spare room, so the frame takes the
     height it claimed and puts it into the LINES rather than the gaps between
     starters. A taller line is more room to write; a wider gap is nothing.
     Growth is capped elsewhere at half again the natural height, so a line
     gets roomier without turning into an invitation to write an essay. */
  .h-wf { height: 100%; }
  .h-wf-inner {
    position: relative; padding: ${WF_PAD_V_MM}mm ${WF_PAD_H_MM}mm;
    height: 100%; box-sizing: border-box;
    display: flex; flex-direction: column;
  }
  /* A percentage padding is measured against the container's WIDTH, which is
     exactly what is wanted here: the point is a share of the frame, so the
     room kept clear of it has to be the same share. */
  .h-wf-tag .h-wf-inner { padding-right: ${TAG_POINT_FRACTION * 100}%; }
  .h-wf-stem { margin: 0 0 var(--space-tight); line-height: 1.35; }
  .h-wf-starters { list-style: none; margin: 0; padding: 0; flex: 1; display: flex; flex-direction: column; }
  .h-wf-starter { margin-bottom: ${STARTER_GAP_MM}mm; flex: 1 1 auto; display: flex; flex-direction: column; }
  /* Grow from the height already on the element, not from zero. A bare
     "flex: 1" inside a stack with nothing spare collapsed every line to its
     own border, which is to say the child had nowhere to write and the frame
     still looked finished. */
  .h-wf-line { flex: 1 0 auto; }
  /* A sentence starter is set apart by WEIGHT and by having its own line, and
     carries no colour. Colour on a worksheet means question, given material or
     vocabulary, and a scaffold is none of the three. */
  .h-wf-text { display: block; font-weight: bold; line-height: 1.35; }
  .h-wf-line {
    display: block;
    border-bottom: var(--rule-hair) dotted var(--colour-rule);
  }

  /* ─── storyboard ─── */
  .h-sb { font-size: var(--type-body); }
  .h-sb-stem { margin: 0 0 var(--space-tight); line-height: 1.35; }
  .h-sb-grid {
    list-style: none; margin: 0; padding: 0;
    display: grid;
    grid-template-columns: repeat(var(--h-sb-cols), 1fr);
    gap: ${SB_GAP_MM}mm;
  }
  .h-sb-cell { display: flex; flex-direction: column; }
  /* The box's height follows its own WIDTH, which is what the estimate
     assumes. Written as "flex: 1" with a min-height instead, it had no height
     to grow into (the cell it sits in is sized by its content, not the other
     way round), so every box came out at the 22mm minimum while the engine had
     reserved 44mm for it. Nothing clipped; the sheet simply carried 60mm of
     hole it had been told was full. */
  .h-sb-box {
    box-sizing: border-box;
    border: var(--rule-line) solid var(--colour-ink);
    aspect-ratio: ${1 / SB_BOX_RATIO} / 1;
    min-height: ${SB_BOX_MIN_MM}mm;
    max-height: ${SB_BOX_MAX_MM}mm;
    padding: ${INSET.cell.v}mm ${INSET.cell.h}mm;
  }
  /* The cell's place in the sequence. Ink and bold like every other number on
     the sheet: a child counting through six boxes should not meet a different
     kind of number from the one beside the questions. */
  .h-sb-num {
    font-size: var(--type-body); font-weight: bold; color: var(--colour-ink);
    line-height: 1.35;
  }
  .h-sb-lines { display: block; margin-top: 1mm; }
  .h-sb-line {
    display: block;
    border-bottom: var(--rule-hair) dotted var(--colour-rule);
  }
`;

const helpers = {
  "speech-scene": {
    render: renderSpeechScene,
    measure: measureSpeechScene,
    needs: needsSpeechScene,
    // A bubble the child writes in gains from being taller, but a scene is
    // mostly figures and printed speech, which do not.
    greed: 1,
  },
  "fact-file": {
    render: renderFactFile,
    measure: measureFactFile,
    needs: needsFactFile,
    greed: 3, // more room in each slot is the whole point of spare space here
  },
  "writing-frame": {
    render: renderWritingFrame,
    measure: measureWritingFrame,
    needs: needsWritingFrame,
    greed: 3, // writing space is the right home for spare room
  },
  storyboard: {
    render: renderStoryboard,
    measure: measureStoryboard,
    needs: needsStoryboard,
    // A box's height follows its WIDTH and stops at the ceiling above, so
    // there is nothing spare height can buy here. Claiming it anyway is how a
    // helper ends up sitting in a zone half again its size with the difference
    // showing as a hole underneath.
    greed: 0,
  },
};

module.exports = { helpers, css };
