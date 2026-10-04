'use strict';

// The ONE success-criteria panel geometry, shared by every route that renders
// a criteria panel: the fixed right-hand panel of the `*-sc` templates and the
// `sc-panel` content object used anywhere else (a bottom strip, a free zone, a
// Reflect slide). Before this file each route painted its own copy — same green
// box, different padding, different label size, and the content-type route
// suppressed the white step cards the template route kept — so the same
// criteria read as two different objects depending on where it was parked.
//
// One panel now means one identity: the pale-green surface, the 28pt green
// "✓ Success Criteria" label, and the compact white cards the criteria ride
// on, whichever route drew them.

const { FONT, FIT } = require('./styles');
const { warn, withoutRecording } = require('./warnings');
const { isMarkedList, markedListHeldAt18, markedListFloor } = require('./marked-criteria');
const requireGlobal = require('./require-global');
const { drawSignalTopRight } = require('./signals');
const { SLIDE_W, SLIDE_H } = require('./layout');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD         = 0.15;
const LABEL_H     = 0.55;
const BG          = 'D5F5E3';
const LINE        = '00B050';
const LINE_W      = 1.5;
const RADIUS      = 0.08;
const LABEL_FONT  = 28;
const LABEL_COLOR = '00B050';
// The teacher's limit: the criteria support the work and never take more than
// half the slide. Only a slide whose one job is the criteria may go further, or
// a slide marked `workOnPaper`: the children do the task on paper and the board
// shows only the question and a reference, so nothing on it needs protecting
// from the criteria (29 September 2026, a labelling slide whose six-row "what it
// looks like" table was refused at 51% although the labelling was on the sheet).
const MAX_SLIDE_SHARE = 0.5;

function workIsOnPaper(ctx) {
  const slides = ctx && ctx.lesson && Array.isArray(ctx.lesson.slides) ? ctx.lesson.slides : null;
  const slide = slides && Number.isInteger(ctx.slideIndex) ? slides[ctx.slideIndex] : null;
  return !!(slide && slide.workOnPaper === true);
}
// ─── END CONSTANTS ────────────────────────────────────────────

// The lowest point a list of steps reaches in this panel, found by drawing it
// on a slide nobody sees. Zero when it cannot be drawn (the real draw below
// then refuses it by name, as before).
function lowestStep(contentZone, content, ctx) {
  const { drawContent } = require('./content');
  const PptxGenJS = requireGlobal('pptxgenjs');
  const dry = new PptxGenJS();
  const page = dry.addSlide();
  let bottom = 0;
  const note = (o) => {
    if (o && Number.isFinite(o.y) && Number.isFinite(o.h)) bottom = Math.max(bottom, o.y + o.h);
  };
  const probe = new Proxy(page, {
    get(target, prop) {
      if (prop === 'addShape') return (kind, o) => { note(o); return target.addShape(kind, o); };
      if (prop === 'addText') return (text, o) => { note(o); return target.addText(text, o); };
      if (prop === 'addImage') return (o) => { note(o); return target.addImage(o); };
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  const hadBarrier = !!ctx._cardBarrier;
  ctx._cardBarrier = false;
  try {
    withoutRecording(() => drawContent(dry, probe, contentZone, content, ctx));
  } catch (err) {
    return 0;
  } finally {
    ctx._cardBarrier = hadBarrier;
  }
  return bottom;
}

function drawSuccessCriteriaPanel(pptx, slide, zone, data, ctx) {
  const { drawContent } = require('./content');
  const label = data.criteriaLabel || data.label || '\u2713 Success Criteria';
  const criteria = data.criteria || data.content;

  const share = (zone.w * zone.h) / (SLIDE_W * SLIDE_H);
  if (share > MAX_SLIDE_SHARE + 0.005 && !(ctx && ctx._criteriaSlide) && !workIsOnPaper(ctx)) {
    throw new Error(
      `SC_PANEL_TOO_LARGE: the success criteria panel takes ${Math.round(share * 100)}% ` +
      `of the slide, and the teacher never wants criteria over half a slide beside ` +
      `the work. Give it a zone of at most half the slide (a 50-50 split, or the ` +
      `smaller side of a wider one). If the criteria then do not fit at 18pt, give ` +
      `the panel the roomiest shape half the slide allows (the full height of one ` +
      `side) and arrange the work beside it. Never show fewer criteria, and a ` +
      `\`success-criteria\` slide is only for criteria being taught, compared or built. ` +
      `When the children do this task on paper and the board shows only its question and a ` +
      `reference, mark the slide \`workOnPaper: true\` and the panel may take the room. ` +
      `Nothing was drawn smaller or cut.`
    );
  }

  // The panel hugs its criteria. A short list keeps the card size of a normal
  // one (steps.js), so two or three steps used to sit at the top of a box that
  // ran the full height of the slide, with empty green under them. The teacher,
  // 4 October 2026: "there's only two cards in there. Then there's a lot of
  // empty dead green space." A card is a boundary, and a boundary taller than
  // what it holds says the content is smaller than it is (the visual profile's
  // Card boundary), so the box now ends where its last step does. The text is
  // not blown up to fill the room instead: he called that overfilled on
  // 17 September. Only a list of steps is hugged; a table or a row of figures
  // keeps the zone it was given.
  let panelH = zone.h;
  if (criteria && criteria.type === 'steps' && !Number.isFinite(zone.measureFloorPt)) {
    const reach = lowestStep({
      x: zone.x + PAD, y: zone.y + PAD + LABEL_H, w: zone.w - 2 * PAD, h: zone.h - 2 * PAD - LABEL_H,
      class: zone.class || 'C', sourceAuthoredText: true, criteriaPanel: true,
      widestPracticePanel: !!zone.widestPracticePanel, compactCards: true
    }, criteria.heading ? Object.assign({}, criteria, { heading: undefined }) : criteria, ctx);
    if (reach > zone.y) panelH = Math.min(zone.h, reach - zone.y + PAD);
  }

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: zone.x, y: zone.y, w: zone.w, h: panelH,
    fill: { color: BG },
    line: { color: LINE, width: LINE_W },
    rectRadius: RADIUS
  });

  // The heading is one line, always: the fit pass shrinks a word it cannot
  // break, and "Success Criteria" once wrapped to two large lines in a
  // sidebar panel and pushed the criteria down. No-break spaces make it one word.
  slide.addText(String(label).replace(/ +/g, ' '), {
    x: zone.x + PAD, y: zone.y + PAD,
    w: zone.w - 2 * PAD, h: LABEL_H,
    fontFace: FONT, fontSize: LABEL_FONT, bold: true,
    color: LABEL_COLOR, align: 'left', valign: 'middle',
    margin: 0, fit: FIT
  });

  if (criteria) {
    // The panel already prints its own label above the content. If the
    // criteria is a `steps` object whose heading just repeats that label,
    // strip the heading so "✓ Success Criteria" doesn't render twice — once
    // as the panel label, once as the steps heading. The steps `heading` is
    // meant for bare zones (a split `secondary`, the standalone
    // `success-criteria` template) that have no panel label of their own, so
    // a heading that says something genuinely different is left intact.
    let content = criteria;
    const norm = (s) => String(s || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (content.type === 'steps' && content.heading && norm(content.heading) === norm(label)) {
      content = Object.assign({}, content, { heading: undefined });
    }

    const contentZone = {
      x: zone.x + PAD,
      y: zone.y + PAD + LABEL_H,
      w: zone.w - 2 * PAD,
      h: zone.h - 2 * PAD - LABEL_H,
      class: zone.class || 'C',
      // Every criteria panel in the deck comes through here, so this is the one
      // place that knows the text inside it is the lesson designer's wording.
      // A helper that refuses this zone can then name the lever the slide
      // designer actually has - a roomier panel, never fewer criteria
      // - instead of telling it to shorten words it is not allowed to touch.
      sourceAuthoredText: true,
      // Tells the steps helper this list is a criteria panel, whose card
      // height does not grow when the list is short (see steps.js).
      criteriaPanel: true,
      // A practice template's panel at the widest it goes, so a refusal names
      // the one shape that can hold more (see steps.js).
      widestPracticePanel: !!zone.widestPracticePanel,
      // The panel's interior takes the card look in its compact form: white
      // cards on the green read well (the children prefer them), but only
      // with the tight padding that keeps the step text at full size.
      compactCards: true
    };
    // A container measuring how tall this panel must be to hold its criteria at
    // a given size draws it on a slide nobody sees with that size as the floor
    // (content/stack.js). Never set on a panel that is really drawn.
    if (Number.isFinite(zone.measureFloorPt)) contentZone.floorPt = zone.measureFloorPt;

    // The panel owns its surface, so nested content must not draw cards on
    // top of it — EXCEPT steps, whose per-item white cards ARE the criteria's
    // visual identity. The card barrier normally rides up through a content
    // type's own drawContent pass (the sc-panel route arrives already
    // barred), so set it deliberately here: un-barred for steps, barred for
    // everything else, restored when the content is done.
    const hadBarrier = !!ctx._cardBarrier;
    ctx._cardBarrier = content.type !== 'steps';
    try {
      // A list the lesson designer marked too long for every criteria panel
      // (`tooLongForPanels`) is drawn smaller rather than not at all: at the
      // largest floor from 18pt down to 16pt at which it fits, found by drawing
      // it onto a slide nobody sees, and the build flags the slide for the
      // teacher (his ruling of 24 September 2026). Only where this panel is as
      // roomy as its route makes it: a practice template tries its wider widths
      // at 18pt first (maths-turn-sc.js), so its panel goes smaller only at its
      // widest. Every other list keeps the 18pt floor, and so does a marked
      // list that the practice panel at its widest or the half-width split
      // holds at 18pt: its mark is stale (left behind after the list was
      // tightened), and drawing it smaller, or telling the teacher it is too
      // long for every panel, would both be untrue.
      if (!Number.isFinite(zone.measureFloorPt) &&
          content.type === 'steps' && isMarkedList(content.steps, ctx.markedCriteria) &&
          (!zone.practicePanel || zone.widestPracticePanel) &&
          !markedListHeldAt18(content.steps, ctx)) {
        const PptxGenJS = requireGlobal('pptxgenjs');
        contentZone.floorPt = markedListFloor((floorPt) => {
          const dry = new PptxGenJS();
          withoutRecording(() => drawContent(dry, dry.addSlide(), Object.assign({}, contentZone, { floorPt }), content, ctx));
        });
      }
      drawContent(pptx, slide, contentZone, content, ctx);
    } finally {
      ctx._cardBarrier = hadBarrier;
    }
  } else {
    warn(
      ctx.slideIndex,
      'success criteria panel rendered empty — no "criteria" or "content" supplied'
    );
  }

  if (data.flipchart) {
    // The draw-live easel ends where the panel's content begins
    // (PAD + LABEL_H), so it never sits on the first criteria card.
    drawSignalTopRight(slide, 'flipchart', zone, { h: 0.58, inset: 0.10 });
  }
}

module.exports = { drawSuccessCriteriaPanel };
