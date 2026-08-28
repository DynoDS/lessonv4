'use strict';

// Generated question labels for a row of items, and the one rule about what
// happens when the author already wrote one.
//
// Two numbering worlds exist on purpose and mean different things to a class:
//
//   teacher-led   (a), (b), (c)   the questions a teacher works through aloud
//   independent   (1), (2), (3)   the questions a child answers on their own
//
// A label is only ever ADDED here. The meaning of an item's own words belongs
// to the designer, and the three cases are kept apart deliberately:
//
//   "Shape A"      keeps its name and gains a number: "(1) Shape A". A
//                  descriptive name is not a question number, and a row of
//                  "Shape A / Shape B" numbered (1) and (2) is exactly right.
//   "(1) Shape A"  where (1) is what would have been generated anyway: the
//                  duplicate prefix is removed so it prints once.
//   "(2) Shape A"  where (1) was expected: REFUSED. One of the two is wrong and
//                  the builder cannot know which. Overwriting the author's (2)
//                  would silently renumber a question a teacher may be reading
//                  from a plan, so it goes back upstream instead.

// A question-like prefix, and nothing else: a single letter, a number, or a
// number followed by a part letter. "Shape A" and "Method B" are not prefixes -
// they are not bracketed, and treating them as numbers would strip a name the
// designer chose.
const PREFIX = /^\(\s*([A-Za-z]|\d+[A-Za-z]?)\s*\)\s*/;

function canonical(value) {
  return String(value).trim().toLowerCase();
}

function expectedPrefix(expected) {
  return `(${expected})`;
}

function indexToLetter(index) {
  return String.fromCharCode(97 + index);
}

function validatePositiveInteger(value, path) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(
      `QUESTION_NUMBERING_INVALID: ${path} must be a whole number of 1 or more; ` +
        `received ${JSON.stringify(value)}.`
    );
  }
  return n;
}

// The labels a row will generate, in order. Nothing is applied yet: a caller
// that only wants to know what the labels WOULD be does not have to rewrite
// anything to find out.
function labelsForRow(data) {
  const items = Array.isArray(data.items) ? data.items : [];
  const mode = data.questionNumbering;

  if (mode === undefined || mode === null) return null;

  if (mode === 'teacher-led') {
    if (data.startAt !== undefined) {
      throw new Error(
        'QUESTION_NUMBERING_INVALID: teacher-led lettering does not take ' +
          'startAt. Lettering restarts at (a) for the turn it belongs to.'
      );
    }
    return items.map((_, i) => indexToLetter(i));
  }

  if (mode === 'independent') {
    const start =
      data.startAt === undefined
        ? 1
        : validatePositiveInteger(data.startAt, 'row.startAt');
    return items.map((_, i) => String(start + i));
  }

  throw new Error(
    `QUESTION_NUMBERING_INVALID: row.questionNumbering must be ` +
      `"teacher-led" or "independent"; received ${JSON.stringify(mode)}.`
  );
}

// Which text field on an item carries the label a child reads. Checked in this
// order, and only the first one found is touched.
const LABEL_FIELDS = ['label', 'caption', 'text'];

function labelFieldOf(item) {
  if (!item || typeof item !== 'object') return null;
  for (const field of LABEL_FIELDS) {
    if (typeof item[field] === 'string') return field;
  }
  return null;
}

// One item, with its generated label applied. Returns a SHALLOW COPY: the
// lesson JSON is the designer's file and is never rewritten in place by a
// renderer.
function applyLabel(item, expected, where) {
  const wanted = expectedPrefix(expected);
  const field = labelFieldOf(item);

  if (field === null) {
    // Nothing on this item reads as a label, so the row's numbering has nowhere
    // to go. An item drawn with no words of its own (a bare clock, say) still
    // carries its label through the field its own helper reads, so this is a
    // structural gap rather than something to invent a field for.
    return item;
  }

  const original = String(item[field]);
  const match = PREFIX.exec(original.trim());

  if (!match) {
    return { ...item, [field]: `${wanted} ${original.trim()}`.trim() };
  }

  const authored = match[1];
  if (canonical(authored) === canonical(expected)) {
    // Exactly the label that was going to be generated. Printing it twice is
    // the only thing that would be wrong here.
    return { ...item, [field]: `${wanted} ${original.trim().replace(PREFIX, '')}`.trim() };
  }

  throw new Error(
    `QUESTION_LABEL_CONFLICT: ${where} is labelled "(${authored})" but this row ` +
      `numbers it "${wanted}". Fix the numbering upstream: the builder will not ` +
      `renumber a question the designer labelled.`
  );
}

// A row's items with generated labels applied, or the items unchanged when the
// row asked for no numbering.
function numberRowItems(data, where = 'row') {
  const labels = labelsForRow(data);
  if (labels === null) return Array.isArray(data.items) ? data.items : [];

  return data.items.map((item, i) =>
    applyLabel(item, labels[i], `${where} item ${i + 1}`)
  );
}

module.exports = {
  PREFIX,
  canonical,
  expectedPrefix,
  labelsForRow,
  numberRowItems,
  validatePositiveInteger,
};
