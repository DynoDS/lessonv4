'use strict';

// Two advisory capacity checks: a fixed caption that is getting long, and a
// success-criteria panel that is carrying a lot.
//
// WARNINGS ONLY, and deliberately so. Both of these are about how much a slide
// is being asked to hold, and the answer to "too much" is a teaching decision:
// cut a criterion, split the beat, shorten the wording. None of those is the
// builder's to make, so nothing here returns replacement text, trims a string
// or drops an item. It reports what it measured and leaves the content exactly
// as the designer wrote it.

// A fixed caption sits in a band of known height, so past a certain length it
// stops being a caption and starts being a paragraph in a slot that cannot grow.
const CAPTION_LONG_CHARS = 120;

// A success-criteria panel holds its criteria at a size a child reads from the
// back of the room. Past this the panel keeps shrinking its own text.
const SC_MANY_ITEMS = 5;
const SC_LONG_TOTAL_CHARS = 320;

function textOf(value) {
  return typeof value === 'string' ? value : '';
}

// Walk every content object on a slide, whatever nests it.
function eachContent(node, fn) {
  if (Array.isArray(node)) {
    node.forEach((n) => eachContent(n, fn));
    return;
  }
  if (!node || typeof node !== 'object') return;
  if (node.type) fn(node);
  for (const value of Object.values(node)) eachContent(value, fn);
}

function captionWarnings(slideData, slideNumber) {
  const out = [];

  eachContent(slideData, (content) => {
    const caption = textOf(content.caption);
    if (caption.length > CAPTION_LONG_CHARS) {
      out.push({
        signal: 'FIXED_CAPTION_CAPACITY',
        slide: slideNumber,
        field: `${content.type}.caption`,
        message:
          `caption is ${caption.length} characters, past the ${CAPTION_LONG_CHARS} ` +
          `a fixed caption band holds comfortably. Nothing was shortened.`,
      });
    }
  });

  return out;
}

function successCriteriaWarnings(slideData, slideNumber) {
  const out = [];
  const criteria = Array.isArray(slideData && slideData.successCriteria)
    ? slideData.successCriteria
    : null;
  if (!criteria) return out;

  const texts = criteria.map((c) =>
    typeof c === 'string' ? c : textOf(c && c.text)
  );
  const total = texts.reduce((n, t) => n + t.length, 0);

  if (criteria.length > SC_MANY_ITEMS) {
    out.push({
      signal: 'SUCCESS_CRITERIA_CAPACITY',
      slide: slideNumber,
      field: 'successCriteria',
      message:
        `${criteria.length} criteria, past the ${SC_MANY_ITEMS} the panel holds ` +
        `at a readable size. Nothing was removed.`,
    });
  } else if (total > SC_LONG_TOTAL_CHARS) {
    out.push({
      signal: 'SUCCESS_CRITERIA_CAPACITY',
      slide: slideNumber,
      field: 'successCriteria',
      message:
        `success criteria total ${total} characters, past the ` +
        `${SC_LONG_TOTAL_CHARS} the panel holds at a readable size. Nothing ` +
        `was shortened.`,
    });
  }

  return out;
}

function capacityWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const out = [];

  slides.forEach((slideData, i) => {
    if (!slideData || typeof slideData !== 'object') return;
    out.push(...captionWarnings(slideData, i + 1));
    out.push(...successCriteriaWarnings(slideData, i + 1));
  });

  return out;
}

module.exports = {
  capacityWarnings,
  CAPTION_LONG_CHARS,
  SC_MANY_ITEMS,
  SC_LONG_TOTAL_CHARS,
};
