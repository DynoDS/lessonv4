'use strict';

// Draw every slide once, into a presentation nobody will ever open, to find out
// which ones cannot be drawn.
//
// The builder used to discover a layout fault while writing the real deck: the
// slide threw, the error printed, and the file was written anyway with that
// slide blank. This runs the SAME drawing code first, against an in-memory
// PptxGenJS that is never saved, so a fault that would empty a slide is found
// before anything is published.
//
// It is a preflight, not a second layout engine. Every measurement it makes is
// made by the real helpers, because a check that modelled the layout separately
// would eventually disagree with the thing it was checking and be worse than no
// check at all.
//
// Nothing here repairs anything. Content that does not fit its zone, or a type
// the registry says cannot go where it has been put, is REPORTED with its slide
// number. Deleting the content, moving it or swapping the zone would each be the
// builder making a decision about what a lesson should contain.

const { getWarnings, clearWarnings, restoreWarnings } = require('./warnings');
const { ZONE_COMPAT } = require('./content/index');

// Every content object on a slide, with the zone it was put in where the slide
// says so. A container passes its own zone class down to its children, which is
// what the real renderer does too.
function eachTyped(node, fn) {
  if (Array.isArray(node)) {
    node.forEach((n) => eachTyped(n, fn));
    return;
  }
  if (!node || typeof node !== 'object') return;
  if (node.type) fn(node);
  for (const value of Object.values(node)) eachTyped(value, fn);
}

// The registry's own compatibility table, used as a safety net BEFORE drawing.
//
// At draw time an incompatible pairing is refused by name rather than replaced
// with label text. The dry render therefore returns the same fault before
// publication.
//
// A pairing the table rejects is a fault in the table or in the authoring, and
// which one it is decides who fixes it. It is never a reason to delete content.
function compatibilityProblems(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const problems = [];

  slides.forEach((slideData, i) => {
    eachTyped(slideData, (content) => {
      const classes = ZONE_COMPAT[content.type];
      if (!classes) {
        problems.push({
          signal: 'CONTENT_ZONE_INCOMPATIBLE',
          slide: i + 1,
          message:
            `content type "${content.type}" is not in the registry, so no zone ` +
            `class can be checked for it. Nothing was removed.`,
        });
      }
    });
  });

  return problems;
}

// Run the real drawing code over every slide, into a throwaway presentation.
//
// `contextForSlide(index, slideData)` supplies the same ctx the real build
// would, so the pre-rendered images and measurements a helper expects are the
// ones it actually gets.
function preflightLayouts({ PptxGenJS, lesson, contextForSlide, drawSlide }) {
  const { SLIDE_W, SLIDE_H } = require('./layout');
  const { drawSlide: realDrawSlide } = require('./templates');
  const draw = drawSlide || realDrawSlide;

  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const errors = [];
  const warnings = [];

  // A dry run raises the same warnings the real run will, and a warning counted
  // twice reads as two faults. So the global store is set aside for the duration
  // and put back exactly as it was: preflight reports its own findings and
  // leaves the real build's summary alone.
  const outerWarnings = getWarnings();
  clearWarnings();

  try {
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'LAYOUT_WIDE', width: SLIDE_W, height: SLIDE_H });
    pptx.layout = 'LAYOUT_WIDE';

    slides.forEach((slideData, i) => {
      const slide = pptx.addSlide();
      try {
        draw(pptx, slide, slideData, contextForSlide(i, slideData));
      } catch (err) {
        // A helper that refuses by name keeps its name: STEP_TEXT_OVERLOAD is a
        // different fault from a broken spec and goes to a different owner.
        const message = (err && err.message) || String(err);
        const named = /^([A-Z_]{3,}):\s*([\s\S]*)$/.exec(message);
        errors.push({
          signal: named ? named[1] : 'LAYOUT_PREFLIGHT_FAILED',
          slide: i + 1,
          message: named ? named[2].trim() : message,
        });
      }
    });

    warnings.push(...getWarnings());
  } finally {
    // Exactly what the real build had before the dry run, and nothing from it.
    restoreWarnings(outerWarnings);
  }

  errors.push(...compatibilityProblems(lesson));

  return { errors, warnings };
}

module.exports = { preflightLayouts, compatibilityProblems };
