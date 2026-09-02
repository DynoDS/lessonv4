'use strict';

const { COLOURS } = require('./styles');
const { splitAnswerRuns } = require('./answer-text');

const COLOR_ROLES = new Set([
  'default',
  'focus-blue',
  'peer-blue',
  'peer-purple'
]);

const EMPHASIS_ROLES = new Set([
  'core-action',
  'task-action',
  'required-material',
  'response-demand',
  'reasoning-demand',
  'problem-state',
  'safety-warning',
  'vocabulary'
]);

const LEGACY_MARKER_RE = /\|\||\*\*|\[\[|\]\]|\{\{|\}\}|<<|>>/;

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function countOccurrences(text, needle) {
  if (!needle) return 0;
  let count = 0;
  let cursor = 0;
  for (;;) {
    const found = text.indexOf(needle, cursor);
    if (found === -1) return count;
    count += 1;
    cursor = found + needle.length;
  }
}

function presentationText(owner) {
  if (!owner || typeof owner !== 'object' || Array.isArray(owner)) return null;
  if (typeof owner.text === 'string') return owner.text;
  if (typeof owner.value === 'string') return owner.value;
  return null;
}

function validatePresentationSpec(value, owner) {
  const text = String(value == null ? '' : value);
  const data = owner && typeof owner === 'object' && !Array.isArray(owner)
    ? owner
    : {};

  if (hasOwn(data, 'colorRole')) {
    if (
      typeof data.colorRole !== 'string' ||
      !COLOR_ROLES.has(data.colorRole)
    ) {
      return (
        `colorRole must be one of ${[...COLOR_ROLES].join(', ')}; ` +
        `found ${JSON.stringify(data.colorRole)}`
      );
    }
  }

  if (!hasOwn(data, 'emphasis')) return null;

  if (!Array.isArray(data.emphasis)) {
    return 'emphasis must be an array';
  }
  if (data.emphasis.length === 0) {
    return 'emphasis must contain at least one entry when supplied';
  }
  if (LEGACY_MARKER_RE.test(text)) {
    return (
      'emphasis cannot be combined with legacy inline markers in the same ' +
      'string; use one presentation system for that string'
    );
  }

  const ranges = [];
  for (let i = 0; i < data.emphasis.length; i += 1) {
    const entry = data.emphasis[i];
    const path = `emphasis[${i}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return `${path} must be an object`;
    }
    const keys = Object.keys(entry).sort();
    if (keys.join(',') !== 'role,text') {
      return `${path} must contain exactly text and role`;
    }
    if (typeof entry.text !== 'string' || !entry.text) {
      return `${path}.text must be a non-empty string`;
    }
    if (
      typeof entry.role !== 'string' ||
      !EMPHASIS_ROLES.has(entry.role)
    ) {
      return (
        `${path}.role must be one of ${[...EMPHASIS_ROLES].join(', ')}; ` +
        `found ${JSON.stringify(entry.role)}`
      );
    }

    const occurrences = countOccurrences(text, entry.text);
    if (occurrences !== 1) {
      return (
        `${path}.text must occur exactly once in the visible string; ` +
        `found ${occurrences} occurrences of ${JSON.stringify(entry.text)}`
      );
    }
    const start = text.indexOf(entry.text);
    ranges.push({
      start,
      end: start + entry.text.length,
      role: entry.role,
      text: entry.text
    });
  }

  ranges.sort((a, b) => a.start - b.start);
  for (let i = 1; i < ranges.length; i += 1) {
    if (ranges[i].start < ranges[i - 1].end) {
      return (
        'emphasis ranges must not overlap: ' +
        `${JSON.stringify(ranges[i - 1].text)} overlaps ` +
        `${JSON.stringify(ranges[i].text)}`
      );
    }
  }

  return null;
}

function baseColourForRole(baseColor, role) {
  const base = baseColor || COLOURS.body;
  if (role == null || role === '' || role === 'default') return base;
  if (role === 'focus-blue') return COLOURS.title;
  if (role === 'peer-blue') return COLOURS.title;
  if (role === 'peer-purple') return COLOURS.lo;
  throw new Error(
    `PRESENTATION_TEXT_INVALID: unknown colorRole ${JSON.stringify(role)}`
  );
}

function emphasisOptions(role, baseColor, bold) {
  const base = {
    color: baseColor || COLOURS.body,
    bold: !!bold
  };

  if (role === 'core-action' || role === 'task-action') {
    return { ...base, color: COLOURS.title, bold: true };
  }
  if (
    role === 'required-material' ||
    role === 'response-demand' ||
    role === 'reasoning-demand'
  ) {
    return {
      ...base,
      bold: true,
      underline: { style: 'sng' }
    };
  }
  if (role === 'problem-state' || role === 'safety-warning') {
    return { ...base, color: COLOURS.problem, bold: true };
  }
  if (role === 'vocabulary') {
    return { ...base, color: COLOURS.green, bold: true };
  }

  throw new Error(
    `PRESENTATION_TEXT_INVALID: unknown emphasis role ${JSON.stringify(role)}`
  );
}

// A calculation is read as one thing, so it is kept on one line: "2,648 + 10 ="
// split across two lines in a narrow card once, with the "+ 10 =" underneath
// the number, and a Year 4 class read a stacked sum whose digits did not line
// up. The spaces inside a run of numbers and operators become no-break spaces,
// which PowerPoint will not wrap at; the fit pass then shrinks the text until
// the whole calculation fits its width. Words around the calculation still wrap
// as normal, so "Is 90 + 10 = 910 correct?" keeps only its sum whole.
const CALCULATION_RE =
  /\d[\d,.]*(?:[ \t]+[+\-−×÷=][ \t]+(?:\|\|)?(?:\d[\d,.]*|_+|\?|□|⬜))*(?:[ \t]+=(?=[ \t]*$|[ \t]+(?:\|\|)?[\d_?□⬜]))*/gm;

function keepCalculationsWhole(text) {
  return String(text).replace(CALCULATION_RE, (match) =>
    /[+\-−×÷=]/.test(match) ? match.replace(/[ 	]+/g, ' ') : match
  );
}

function wholeCalculationRuns(runs) {
  if (typeof runs === 'string') return keepCalculationsWhole(runs);
  if (!Array.isArray(runs)) return runs;
  return runs.map((run) =>
    run && typeof run.text === 'string'
      ? Object.assign({}, run, { text: keepCalculationsWhole(run.text) })
      : run
  );
}

function presentationRuns(value, bold, baseColor, owner) {
  const text = String(value == null ? '' : value);
  const data = owner && typeof owner === 'object' && !Array.isArray(owner)
    ? owner
    : {};
  const error = validatePresentationSpec(text, data);
  if (error) {
    throw new Error(`PRESENTATION_TEXT_INVALID: ${error}`);
  }

  const base = baseColourForRole(baseColor, data.colorRole);

  if (!Array.isArray(data.emphasis) || data.emphasis.length === 0) {
    return wholeCalculationRuns(splitAnswerRuns(text, bold, base));
  }

  const ranges = data.emphasis
    .map((entry) => ({
      start: text.indexOf(entry.text),
      end: text.indexOf(entry.text) + entry.text.length,
      role: entry.role
    }))
    .sort((a, b) => a.start - b.start);

  const runs = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      runs.push({
        text: text.slice(cursor, range.start),
        options: { color: base, bold: !!bold }
      });
    }
    runs.push({
      text: text.slice(range.start, range.end),
      options: emphasisOptions(range.role, base, bold)
    });
    cursor = range.end;
  }

  if (cursor < text.length) {
    runs.push({
      text: text.slice(cursor),
      options: { color: base, bold: !!bold }
    });
  }

  return wholeCalculationRuns(runs);
}

module.exports = {
  keepCalculationsWhole,
  COLOR_ROLES,
  EMPHASIS_ROLES,
  baseColourForRole,
  presentationRuns,
  presentationText,
  validatePresentationSpec
};
