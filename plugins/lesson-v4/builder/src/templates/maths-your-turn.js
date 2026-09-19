'use strict';

const { FONT, COLOURS, SIZE_CEILINGS, FIT } = require('../styles');
const { drawHeader } = require('../headers');
const { splitAnswerRuns } = require('../answer-text');

// ─── COORDINATES ──────────────────────────────────────────────
const CARDS_X        = 0.22;
const CARDS_Y        = 0.75;
const CARDS_W        = 12.89;
const CARDS_H        = 6.50;
const CARD_GAP       = 0.15;
const CARD_PAD       = 0.20;
const CARD_FONT      = 22;
const VIS_LABEL_W    = 0.50;
const VIS_LABEL_H    = 0.40;
const VIS_LABEL_FONT = 18;
// ─── END COORDINATES ──────────────────────────────────────────

function stripLeadingLabel(text) {
  return String(text).replace(/^\(\s*(?:[a-z]|\d+)\s*\)\s*/i, '');
}

function normaliseCircles(text) {
  return text.replace(/○/g, '◯');
}

function isContentObject(q) {
  return q && typeof q === 'object' && typeof q.type === 'string';
}

function drawMathsYourTurn(pptx, slide, data, ctx) {
  const titleOverride = data.title || 'Your Turn';
  drawHeader(slide, {
    headerStyle: 'title',
    title: titleOverride,
    instruction: data.instruction,
    signal: data.signal
  }, ctx);

  const questions = Array.isArray(data.questions) ? data.questions : [];
  drawQuestionCards(pptx, slide, questions, {
    x: CARDS_X, y: CARDS_Y, w: CARDS_W, h: CARDS_H
  }, ctx, firstLabel(data));
}

// Independent practice numbers, and the numbering runs on across the slides
// that follow rather than restarting on each one, so no two questions in a
// lesson wear the same label (Question Labelling in references/preferences.md).
// `startAt` is what carries it: the first independent slide omits it, and each
// later one sets it to the number after the previous slide's last question.
function firstLabel(data) {
  const n = Number(data.startAt);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

// One set of question cards, drawn by the one helper that knows how to size a
// set (19 September 2026).
//
// This used to draw the cards itself: `cardH = (box.h - gaps) / questions.length`
// with the type pinned at CARD_FONT and `fit` that only ever shrinks. Dividing
// the zone by the number of questions makes the cards as tall as the zone allows
// however little is in them, and pinning the font means the words never grow to
// meet that height. Three short roundings in the 6.5in Your Turn zone therefore
// came out as 2.067in cards holding one 22pt line - about a seventh of the card -
// and six questions could not be asked on one slide at all, so the practice was
// split across two and the success-criteria panel drawn twice. The teacher merged
// them back by hand and set 33pt (Round to 10, 100 or 1,000, 19 September 2026).
//
// `numbered-questions` already answers this properly: it measures each question,
// gives each card the height its own words need, and grows the type until the
// stack fills the zone. It is what the Answers slide in that same deck used, three
// slides later, to put all six questions on one slide at 33pt - the layout the
// teacher rebuilt by hand. Three helpers drew "a set of question cards" and only
// that one was right; the maths templates were using the worst of the three.
//
// What is NOT delegated: a set whose questions are content objects (clocks,
// diagrams) still uses the local grid, because those need cell geometry rather
// than text cards.
function drawQuestionCards(pptx, slide, questions, box, ctx, startAt) {
  if (questions.length === 0) return;

  // Callers pass firstLabel(data); this guard is the backstop so a missed or
  // bad argument degrades to numbering from 1, never to "(NaN)" on a child's
  // slide.
  const startN = Number(startAt);
  startAt = Number.isFinite(startN) && startN >= 1 ? Math.floor(startN) : 1;

  // Visual content objects (e.g. clocks) use a grid layout - tall vertical
  // cards give each visual too little height to be readable.
  if (questions.some(isContentObject)) {
    return drawVisualGrid(pptx, slide, questions, box, ctx, startAt);
  }

  // `normaliseCircles` stays here: it is this route's own tidy-up of the circle
  // glyph the maths templates receive, and the shared helper has never seen it.
  // Leading labels and "||" answer reveals are the shared helper's own work.
  const { drawNumberedQuestions } = require('../content/numbered-questions');
  drawNumberedQuestions(
    pptx,
    slide,
    box,
    { questions: questions.map(function (q) { return normaliseCircles(String(q)); }), startAt: startAt },
    ctx
  );
}

// Grid layout for visual content questions (clocks, diagrams, etc.).
// Uses 2 columns for 4+ items so each cell is tall enough to show the visual clearly.
function drawVisualGrid(pptx, slide, questions, box, ctx, startAt) {
  const { drawContent } = require('../content');
  const count = questions.length;
  const cols  = count <= 3 ? count : 2;
  const rows  = Math.ceil(count / cols);
  const cellW = (box.w - CARD_GAP * (cols - 1)) / cols;
  const cellH = (box.h - CARD_GAP * (rows - 1)) / rows;

  questions.forEach(function (q, i) {
    const col   = i % cols;
    const row   = Math.floor(i / cols);
    const cellX = box.x + col * (cellW + CARD_GAP);
    const cellY = box.y + row * (cellH + CARD_GAP);
    const badge = '(' + (startAt + i) + ')';

    slide.addText(badge, {
      x: cellX, y: cellY,
      w: VIS_LABEL_W, h: VIS_LABEL_H,
      fontFace: FONT, fontSize: VIS_LABEL_FONT, bold: true,
      color: COLOURS.title, align: 'left', valign: 'middle',
      margin: 0, objectName: 'NOFIT_yt-badge'
    });

    const zone = { x: cellX, y: cellY, w: cellW, h: cellH, noCard: true }; // inside the question card
    if (isContentObject(q)) {
      drawContent(pptx, slide, zone, q, ctx);
    } else {
      const text = normaliseCircles(stripLeadingLabel(String(q)));
      slide.addText(splitAnswerRuns(text, true), {
        x: cellX + CARD_PAD, y: cellY,
        w: cellW - 2 * CARD_PAD, h: cellH,
        fontFace: FONT, fontSize: CARD_FONT, bold: true,
        color: COLOURS.body, align: 'center', valign: 'middle',
        margin: 0, fit: FIT
      });
    }
  });
}

module.exports = { drawMathsYourTurn, drawQuestionCards, firstLabel };
