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
const { warn } = require('./warnings');
const { drawSignalTopRight } = require('./signals');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD         = 0.15;
const LABEL_H     = 0.55;
const BG          = 'D5F5E3';
const LINE        = '00B050';
const LINE_W      = 1.5;
const RADIUS      = 0.08;
const LABEL_FONT  = 28;
const LABEL_COLOR = '00B050';
// ─── END CONSTANTS ────────────────────────────────────────────

function drawSuccessCriteriaPanel(pptx, slide, zone, data, ctx) {
  const { drawContent } = require('./content');
  const label = data.criteriaLabel || data.label || '\u2713 Success Criteria';
  const criteria = data.criteria || data.content;

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: zone.x, y: zone.y, w: zone.w, h: zone.h,
    fill: { color: BG },
    line: { color: LINE, width: LINE_W },
    rectRadius: RADIUS
  });

  slide.addText(label, {
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
      // The panel's interior takes the card look in its compact form: white
      // cards on the green read well (the children prefer them), but only
      // with the tight padding that keeps the step text at full size.
      compactCards: true
    };

    // The panel owns its surface, so nested content must not draw cards on
    // top of it — EXCEPT steps, whose per-item white cards ARE the criteria's
    // visual identity. The card barrier normally rides up through a content
    // type's own drawContent pass (the sc-panel route arrives already
    // barred), so set it deliberately here: un-barred for steps, barred for
    // everything else, restored when the content is done.
    const hadBarrier = !!ctx._cardBarrier;
    ctx._cardBarrier = content.type !== 'steps';
    try {
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
