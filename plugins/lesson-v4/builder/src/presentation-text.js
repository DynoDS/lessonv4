'use strict';

const { COLOURS } = require('./styles');
const { splitAnswerRuns, taughtWordsInGreen } = require('./answer-text');

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
  'vocabulary',
  // The one sentence of a longer card you would say louder, in orange: the
  // way into a card of black sentences (teacher-slide-visual-profile ->
  // Semantic colour). On a teach-layout line that is one sentence, the line's
  // own "orange": true does the same job.
  'key-line'
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
  if (role === 'key-line') {
    return { ...base, color: COLOURS.orange };
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

// A block that names the method and then sets the sum, printed with the sum in
// question blue and the method line left black: "Use column addition." tells a
// child how to go about it, and "247 + 135 =" is the thing they answer. The
// teacher, of a My Turn that printed both in one colour (6 October 2026): "I'd
// prefer 'Use column...' black though and question blue." Marking the two by
// hand was not a way through: one blue block of both lines is refused as two
// tasks (TASK_BLUE_NOT_A_SHORT_TASK), and the repair that followed took the
// blue off altogether, so the board does it, as it does a taught word's green.
//
// A line counts as the sum when it is a calculation and nothing else, left for
// the child to finish: it ends at its equals sign, carries a blank, or has its
// answer behind the reveal mark. "6 + 7 = 13" in a line of teaching is a
// statement and stays black. The block must also hold a line of words, so a
// list of sums with no instruction among them stays black like any list of
// questions, and so does a sum standing alone. Only a black block is touched:
// one the designer coloured, or gave a role, has already said what it is.
const SUM_TERM = String.raw`(?:£?\d[\d,.]*(?:p|%)?|_+|\?|□|⬜)`;
const SUM_LINE = new RegExp(
  String.raw`^\s*` + SUM_TERM + String.raw`(?:\s*[+\-−×÷]\s*` + SUM_TERM + String.raw`)+\s*=\s*(` +
  SUM_TERM + String.raw`)?\s*$`
);

function isSumToWorkOut(line) {
  const reveal = line.indexOf('||');
  const asked = reveal === -1 ? line : line.slice(0, reveal);
  const match = SUM_LINE.exec(asked);
  if (!match) return false;
  if (reveal !== -1) return match[1] === undefined;
  return match[1] === undefined || /[_?□⬜]/.test(asked);
}

// An answers slide follows its task slide. Asked what colour the sum above a
// worked answer should be, the teacher said "whatever colour it was on the
// previous slide" (6 October 2026): a sum that printed blue where the class did
// the work prints blue again where they check it, though it now stands alone,
// and a sum that was black stays black. The build hands each answers slide the
// sums its task printed blue (sumsTheTaskPrintedBlue below), the way it hands
// every slide its taught words; a sum is matched by its own numbers and signs,
// so spacing, commas and a revealed answer do not matter. A sum no task slide
// holds is black, as it always was.
let SUMS_FOLLOWED = new Set();

function sumKey(line) {
  const reveal = line.indexOf('||');
  return (reveal === -1 ? line : line.slice(0, reveal))
    .replace(/[\s ,]/g, '').replace(/−/g, '-').replace(/=[_?□⬜]*$/, '=');
}

function setSumsFollowed(sums) {
  SUMS_FOLLOWED = new Set(Array.isArray(sums) ? sums : []);
}

const HOUSE_BLUE = /^#?0070c0$/i;
const UNPRINTED = new Set(['speakerNotes', 'notes', 'decorations']);
const TITLE_SAYS_ANSWERS = /(?:^|[-:]\s*)answers?$/i;

function showsAnswers(node, top) {
  if (Array.isArray(node)) return node.some((child) => showsAnswers(child));
  if (!node || typeof node !== 'object') return false;
  if (top !== false && TITLE_SAYS_ANSWERS.test(String(node.title || node.heading || '').trim())) return true;
  if (node.revealPair && node.revealPair.state === 'answer') return true;
  return Object.keys(node).some((key) => showsAnswers(node[key], false));
}

// Every sum one slide prints blue: under a line of words in a black block (the
// rule above), in a block the designer made blue, or inside a `[[ ]]` span.
function blueSumsOn(slideData) {
  const found = [];
  const consider = function (text, owner) {
    const lines = String(text).split('\n');
    const sums = lines.map(isSumToWorkOut);
    const own = [owner.color, owner.colour].find((c) => typeof c === 'string' && c.trim());
    const role = owner.colorRole;
    const blue = (own && HOUSE_BLUE.test(own.trim())) || role === 'focus-blue';
    const black = !own && (role == null || role === '' || role === 'default');
    const tells = lines.some((line, i) => !sums[i] && /[A-Za-z]{2,}/.test(line));
    if (blue || (black && tells)) lines.forEach((line, i) => { if (sums[i]) found.push(sumKey(line)); });
    for (const span of String(text).matchAll(/\[\[([\s\S]*?)\]\]/g)) {
      if (isSumToWorkOut(span[1])) found.push(sumKey(span[1]));
    }
  };
  const walk = function (node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    Object.keys(node).forEach((key) => {
      if (UNPRINTED.has(key)) return;
      const value = node[key];
      if (typeof value === 'string') consider(value, node);
      else if (Array.isArray(value)) {
        value.forEach((entry) => (typeof entry === 'string' ? consider(entry, node) : walk(entry)));
      } else walk(value);
    });
  };
  walk(slideData);
  return found;
}

// The sums an answers slide follows: those its task printed blue. The task is
// the nearest slide before it that is not itself an answers slide, with any
// slides straight before that one from the same source unit, since a task can
// run over two slides. Any other slide follows nothing.
function sumsTheTaskPrintedBlue(slides, index) {
  if (!Array.isArray(slides) || !showsAnswers(slides[index])) return [];
  let at = index - 1;
  while (at >= 0 && showsAnswers(slides[at])) at -= 1;
  if (at < 0) return [];
  const unit = slides[at] && slides[at].designUnitId;
  const found = [];
  for (let k = at; k >= 0; k -= 1) {
    const task = slides[k];
    if (showsAnswers(task) || (k !== at && (!unit || !task || task.designUnitId !== unit))) break;
    found.push(...blueSumsOn(task));
  }
  return found;
}

function sumLinesInBlue(runs, text, base, bold) {
  if (String(base).replace('#', '').toUpperCase() !== COLOURS.body.toUpperCase()) return runs;
  if (text.startsWith('||')) return runs;
  const lines = text.split('\n');
  const isSum = lines.map(isSumToWorkOut);
  const tells = lines.some((line, i) => !isSum[i] && /[A-Za-z]{2,}/.test(line));
  const sums = isSum.map((sum, i) => sum && (tells || SUMS_FOLLOWED.has(sumKey(lines[i]))));
  if (!sums.some(Boolean)) return runs;

  const plain = { color: base, bold: !!bold };
  const list = typeof runs === 'string' ? [{ text: runs, options: plain }] : runs;
  if (!Array.isArray(list)) return runs;
  const out = [];
  let line = 0;
  list.forEach((run) => {
    const options = run.options || plain;
    const own = String(options.color || '').replace('#', '').toUpperCase() === COLOURS.body.toUpperCase();
    String(run.text).split('\n').forEach((part, index, parts) => {
      if (part !== '') {
        out.push({
          text: part,
          options: sums[line] && own ? Object.assign({}, options, { color: COLOURS.title }) : options
        });
      }
      if (index < parts.length - 1) {
        out.push({ text: '\n', options: plain });
        line += 1;
      }
    });
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
    const runs = sumLinesInBlue(splitAnswerRuns(text, bold, base), text, base, bold);
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

  // The marked route above never passes through splitAnswerRuns, so a taught
  // word outside its emphasis spans is turned green here (answer-text.js).
  const withTaught = sumLinesInBlue(taughtWordsInGreen(runs, base, bold), text, base, bold);
  return wholeCalculationRuns(data.asksInBlue ? askingSentencesInBlue(withTaught, base, bold) : withTaught);
}

module.exports = {
  keepCalculationsWhole,
  isSumToWorkOut,
  setSumsFollowed,
  sumsTheTaskPrintedBlue,
  COLOR_ROLES,
  EMPHASIS_ROLES,
  baseColourForRole,
  presentationRuns,
  presentationText,
  validatePresentationSpec
};
