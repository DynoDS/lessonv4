'use strict';

const { COLOURS } = require('./styles');
const { splitAnswerRuns } = require('./answer-text');

const COLOR_ROLES = new Set([
  'default',
  'focus-blue',
  'task-blue',
  'peer-blue',
  'peer-purple',
  'worked-purple'
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
  // The child's short task, the job in a few words: blue, as a question is
  // (the teacher's rule of 24 September 2026).
  if (role === 'task-blue') return COLOURS.title;
  if (role === 'peer-blue') return COLOURS.title;
  if (role === 'peer-purple') return COLOURS.lo;
  // A worked example the class sees finished (a prepared example, a
  // `visible-in-unit` model): the sticky fact's purple.
  if (role === 'worked-purple') return COLOURS.worked;
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
    // Bold, in the line's own colour. House blue is the colour of the child's
    // job as a whole line, a question or a short task (teacher-slide-visual-
    // profile -> Semantic colour), never of a verb on its own, so an action verb
    // painted blue inside an instruction spends the contrast that was lifting
    // the job. A Year 4 PSHE deck
    // went out with "Choose", "Draw", "Label" and "add arrows" all in question
    // blue, one task sentence in four alternating chunks (8 September 2026).
    // Weight alone is what exposes the survival phrase; the colour stays with
    // the line it sits in.
    return { ...base, bold: true };
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

// A line that tells and then asks, printed with only its asking sentences in
// question blue and each on a line of its own, the telling left in the line's
// own colour above it.
//
// A Teach slide's question slot used to paint the whole block blue, so a key
// question the design opened with a telling sentence ("Look at the children in
// the picture. What are they doing?") came out as one blue block, which the
// check refuses (MIXED_BLOCK_WHOLE_BLUE) because blue marks the child's job and
// the telling is not it. A Year 4 history slide designer had to break such a
// question apart by hand (27 September 2026). The words are the design's and
// stay as they are; only the colour and the line break are the board's.
// Only words in the line's own base colour turn blue: a taught word in green or
// a supplied fact in orange keeps its colour inside the question.
function askingSentencesInBlue(runs, base, bold) {
  const plain = { color: base, bold: !!bold };
  const list = [];
  const pushText = function (text, options) {
    String(text).split('\n').forEach(function (part, index, parts) {
      if (part !== '') list.push({ text: part, options: options });
      if (index < parts.length - 1) list.push({ text: '\n', options: plain });
    });
  };
  if (typeof runs === 'string') pushText(runs, plain);
  else if (Array.isArray(runs)) runs.forEach(function (run) { pushText(run.text, run.options || plain); });
  else return runs;

  const full = list.map(function (run) { return run.text; }).join('');
  const sentences = [];
  let start = 0;
  for (let i = 0; i < full.length; i += 1) {
    const c = full[i];
    if (c === '\n') {
      sentences.push({ start: start, end: i, gapEnd: i });
      start = i + 1;
    } else if ('.?!'.indexOf(c) !== -1 && (i + 1 === full.length || /[ \t\n]/.test(full[i + 1]))) {
      let j = i + 1;
      while (j < full.length && (full[j] === ' ' || full[j] === '\t')) j += 1;
      sentences.push({ start: start, end: i + 1, gapEnd: j });
      start = j;
      i = j - 1;
    }
  }
  if (start < full.length) sentences.push({ start: start, end: full.length, gapEnd: full.length });
  sentences.forEach(function (s) { s.asks = full.slice(s.start, s.end).trim().endsWith('?'); });

  const blue = new Array(full.length).fill(false);
  const breakAt = new Array(full.length).fill(false);
  sentences.forEach(function (s, k) {
    if (s.asks) for (let i = s.start; i < s.end; i += 1) blue[i] = true;
    const next = sentences[k + 1];
    // A telling sentence followed on the same line by an asking one: the space
    // between them becomes the line break.
    if (next && !s.asks && next.asks && s.gapEnd > s.end && full[s.gapEnd - 1] !== '\n') {
      for (let i = s.end; i < s.gapEnd; i += 1) breakAt[i] = true;
    }
  });

  const sameColour = function (a, b) {
    return String(a || '').replace('#', '').toUpperCase() === String(b || '').replace('#', '').toUpperCase();
  };
  // Every line break, the design's own and the one added before a question,
  // is made a real paragraph break (`breakLine` on the run before it), so each
  // line is its own centred paragraph. A bare newline run is written into the
  // text itself by the deck library, and a renderer lays that out as one
  // paragraph with a break inside it.
  const out = [];
  const lineBreak = function () {
    if (out.length && !out[out.length - 1].options.breakLine) {
      const last = out[out.length - 1];
      out[out.length - 1] = { text: last.text, options: Object.assign({}, last.options, { breakLine: true }) };
    } else {
      out.push({ text: '', options: Object.assign({}, plain, { breakLine: true }) });
    }
  };
  let offset = 0;
  list.forEach(function (run) {
    if (run.text === '\n') {
      lineBreak();
      offset += 1;
      return;
    }
    let buffer = '';
    let bufferBlue = null;
    const flush = function () {
      if (!buffer) return;
      const options = bufferBlue
        ? Object.assign({}, run.options, { color: COLOURS.title })
        : Object.assign({}, run.options);
      delete options.breakLine;
      out.push({ text: buffer, options: options });
      buffer = '';
    };
    let breaking = false;
    for (let i = 0; i < run.text.length; i += 1) {
      const at = offset + i;
      if (breakAt[at]) {
        flush();
        if (!breaking) lineBreak();
        breaking = true;
        continue;
      }
      breaking = false;
      const turnBlue = blue[at] && sameColour(run.options && run.options.color, base);
      if (bufferBlue !== null && turnBlue !== bufferBlue) flush();
      bufferBlue = turnBlue;
      buffer += run.text[i];
    }
    flush();
    offset += run.text.length;
  });
  return out;
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
    const runs = splitAnswerRuns(text, bold, base);
    return wholeCalculationRuns(data.asksInBlue ? askingSentencesInBlue(runs, base, bold) : runs);
  }

  const ranges = data.emphasis
    .map((entry) => ({
      start: text.indexOf(entry.text),
      end: text.indexOf(entry.text) + entry.text.length,
      role: entry.role
    }))
    .sort((a, b) => a.start - b.start);

  const runs = [];
  const plain = { color: base, bold: !!bold };

  // A newline is always its own run, exactly as the marker route below does
  // it. A run that carries "\n" inside its text is split into lines by the
  // deck library and the last line is left waiting for the next run to break
  // it, so "...starchy foods.\nWe also need " followed by a green "protein"
  // came out as "We also need" on a line of its own with "protein foods" on
  // the next (Year 4 PSHE, 8 September 2026). Emitting the break by itself
  // keeps each source line one paragraph whatever emphasis it carries.
  const pushLines = function (value, options) {
    const parts = value.split('\n');
    parts.forEach((part, index) => {
      if (part !== '') runs.push({ text: part, options: options });
      if (index < parts.length - 1) runs.push({ text: '\n', options: plain });
    });
  };

  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      pushLines(text.slice(cursor, range.start), plain);
    }
    pushLines(
      text.slice(range.start, range.end),
      emphasisOptions(range.role, base, bold)
    );
    cursor = range.end;
  }

  if (cursor < text.length) {
    pushLines(text.slice(cursor), plain);
  }

  return wholeCalculationRuns(data.asksInBlue ? askingSentencesInBlue(runs, base, bold) : runs);
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
