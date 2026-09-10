"use strict";

// The worksheet product identity.
//
// The helper library answers what a task IS: a number line, a table, a claim,
// a drawing surface. This file answers the separate question every published
// resource family has to answer: what does one lesson-v4 worksheet look like
// before the subject-specific object has even been chosen?
//
// Deliberately small. It does not wrap every task in another card, change the
// mathematical geometry, add decoration, or invent a new semantic colour. It
// gives existing helpers a shared finish: a quiet header treatment, pale-blue
// section surfaces, softer grouping edges and one response-target language.
// None of the rules below change measured height; that is intentional. A visual
// identity that changes geometry without changing the measurement is a clipping
// bug wearing nicer clothes.

const css = `
  /* ─── page identity ─────────────────────────────────────────────────── */
  /* Only coded multi-sheet packs receive the header rule, because only those
     have a header band reserved by render.js. The rule lands at the bottom of
     that band, inside the 15mm printable margin. */
  body[data-worksheet-page]:has(.sheet-code)::before {
    content: "";
    position: absolute;
    left: 15mm;
    right: 15mm;
    top: 21mm;
    border-top: 0.45mm solid var(--colour-question);
    z-index: 2;
    pointer-events: none;
  }

  .sheet-code.sheet-code {
    background: #EAF5FB;
    color: #075D89;
    border-radius: 2mm;
    padding: 0.35mm 2.2mm;
    font-weight: 700;
  }

  /* ─── hierarchy ─────────────────────────────────────────────────────── */
  /* A section label is navigation, not another sentence in the worksheet.
     The background uses the line box it already owns: no vertical padding,
     therefore no new height for the fit engine to discover later. */
  .h-section-label.h-section-label {
    display: block;
    background: #EAF5FB;
    color: #075D89;
    border-radius: 1.8mm;
    text-indent: 2.5mm;
    font-weight: 700;
  }

  /* Question numbers remain the same measured strings and the same gutters;
     only their visual role changes from ordinary ink to navigation blue. */
  .h-num.h-num,
  .h-numbered-n.h-numbered-n,
  .h-cq-num.h-cq-num {
    color: #075D89;
    font-weight: 700;
  }

  /* A task stem should read as the entry to the working surface below it, not
     as detached prose. A background does that without padding or height. */
  .h-cq-stem.h-cq-stem {
    background: #F4FAFD;
    border-radius: 1.5mm;
    color: #162C43;
  }

  /* ─── one family of response targets ───────────────────────────────── */
  .h-cmp-box.h-cmp-box,
  .h-ineq-box.h-ineq-box,
  .h-ns-box.h-ns-box,
  .h-ns-cell.h-ns-cell,
  .h-order-blank.h-order-blank,
  .h-speech-judge-box.h-speech-judge-box {
    border-color: var(--colour-question);
    border-radius: 1.4mm;
    background: #FFFFFF;
  }

  /* ─── quiet grouping ────────────────────────────────────────────────── */
  .h-card.h-card {
    border-color: #A7C6D8;
    border-radius: 1.8mm;
  }

  .h-claim-panel.h-claim-panel {
    border-color: var(--colour-given);
    background: #FFF8F1;
    border-radius: 1.8mm;
  }

  .h-source.h-source {
    background: #FBFCFD;
    border-radius: 0 1.5mm 1.5mm 0;
  }

  .h-draw-surface.h-draw-surface {
    border-color: #A7C6D8;
    border-radius: 1.8mm;
  }

  /* The neutral table system remains usable in every subject, but a header is
     navigation and may share the worksheet's pale-blue surface. Given values,
     vocabulary and pupil answers keep their existing semantic colours. */
  .h-table.h-table thead th {
    background: #EAF5FB;
    color: #162C43;
  }

  /* Greyscale should still leave hierarchy in weight, border and position. */
  @media print and (monochrome) {
    .sheet-code.sheet-code,
    .h-section-label.h-section-label,
    .h-cq-stem.h-cq-stem,
    .h-table.h-table thead th {
      background: #F1F1F1;
      color: #111111;
    }
  }
`;

module.exports = { css };
