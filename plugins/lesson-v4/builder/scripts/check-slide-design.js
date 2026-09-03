#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { capacityWarnings } = require('../src/content/capacity');
const { friendlyParseError } = require('../src/validate');

const BLOCKING_CAPACITY_SIGNALS = new Set([
  'FIXED_CAPTION_CAPACITY',
  'SUCCESS_CRITERIA_CAPACITY',
]);

function buildDiagnostic(warning) {
  return `BUILD_DIAGNOSTIC: ${JSON.stringify({
    signal: warning.signal,
    artifact: 'slides',
    faultClass: 'composition',
    location: {
      slide: warning.slide,
      path: warning.field,
    },
    message: warning.message,
  })}`;
}

function parseBuildDiagnostics(output) {
  const diagnostics = [];
  for (const line of String(output || '').split(/\r?\n/)) {
    if (!line.startsWith('BUILD_DIAGNOSTIC: ')) continue;
    try {
      diagnostics.push(JSON.parse(line.slice('BUILD_DIAGNOSTIC: '.length)));
    } catch {
      // The underlying build output remains authoritative and is returned intact.
    }
  }
  return diagnostics;
}

function stripScratchWroteLine(output) {
  const lines = String(output || '')
    .split(/\r?\n/)
    .filter((line) => !line.startsWith('Wrote: '));
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines.length ? `${lines.join('\n')}\n` : '';
}

function pathIsInside(filePath, directoryPath) {
  const relative = path.relative(
    path.resolve(directoryPath),
    path.resolve(filePath)
  );
  return (
    relative !== '' &&
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function appendLine(text, line) {
  const current = String(text || '');
  if (!current) return `${line}\n`;
  return `${current}${current.endsWith('\n') ? '' : '\n'}${line}\n`;
}

// Internal lesson-stage labels ("Teach 1", "Do 2", bare "Apply") belong to the
// lesson-design document, never to a child-facing slide title. A title that is
// only a stage label tells a child nothing about the slide, so it blocks the
// check before any deck is built. Child-facing classroom labels — My Turn,
// Your Turn, Quick check, Practise — do not match and stay valid.
const INTERNAL_STAGE_TITLE =
  /^(?:(?:Teach|Do)\s+\d+(?:\s*:.*)?|Apply)$/i;

function presentationWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides)
    ? lesson.slides
    : [];
  const warnings = [];

  slides.forEach((slideData, index) => {
    if (!slideData || typeof slideData !== 'object') return;
    const title =
      typeof slideData.title === 'string'
        ? slideData.title.trim()
        : '';
    if (!INTERNAL_STAGE_TITLE.test(title)) return;
    warnings.push({
      signal: 'INTERNAL_STAGE_TITLE',
      slide: index + 1,
      field: 'title',
      message:
        `"${title}" is an internal lesson-stage label, not a child-facing title.`
    });
  });

  return warnings;
}

// My Turn, Our Turn and Your Turn are promises to the class about whose go it
// is. A slide making one has to show what is being turned over: the question or
// task itself, or - on the reveal that follows it - its answer.
//
// A Year 4 place-value deck ran three "My Turn" slides in a row. The first
// carried a column-value chart, a strip of tenfold relationships and a sticky
// fact, and nothing to work on at all: it was the reference the next slide
// needed, given a slide and a turn label of its own when a repair split a
// crowded My Turn in two. The teacher met "My Turn", taught, clicked, and met
// "My Turn" again (flagged by Daniel, 2 Sept 2026: "It says My turn but I don't
// actually do anything apart from teach, then next slide is finally my turn").
//
// The composition playbook already forbids the interlude slide this produces -
// a reference-only slide "has no job of its own to show" - so this is that rule
// where the deck cannot get past it.
const TURN_TITLE = /^(?:my|our|your)\s+turn\b/i;
const QUESTION_TYPES = new Set(['numbered-questions', 'question-cards']);
// The green answer markers, which templates.md allows only on an answer or
// reveal slide. Their presence is what makes a "Your Turn Answers" the reveal of
// its turn rather than a turn with nothing on it.
const ANSWER_GREEN = /\|\||\{\{/;

// A task list is the turn on a slide that instructs rather than asks. It used
// to be recognised through its house blue, but instructions are black now (see
// teacher-slide-visual-profile.md -> Semantic colour), so the list itself has to
// count or every instructed turn would read as a reference-only slide.
// Success criteria are steps too, and they are the reference a child checks
// their work against rather than the work itself, so the panel never counts.
function hasTaskSteps(node, insidePanel) {
  if (Array.isArray(node)) {
    return node.some((child) => hasTaskSteps(child, insidePanel));
  }
  if (!node || typeof node !== 'object') return false;
  const inPanel = insidePanel || node.type === 'sc-panel';
  if (
    !inPanel &&
    node.type === 'steps' &&
    Array.isArray(node.steps) &&
    node.steps.length
  ) {
    return true;
  }
  return Object.keys(node).some((key) => {
    if (key === 'speakerNotes' || key === 'decorations') return false;
    return hasTaskSteps(node[key], inPanel);
  });
}

function carriesItsTurn(slideData) {
  let found = hasTaskSteps(slideData, false);
  walkContent(slideData, (node) => {
    if (found) return;
    if (Array.isArray(node.questions) && node.questions.length) found = true;
    else if (QUESTION_TYPES.has(node.type)) found = true;
    else if (node.colorRole === 'focus-blue') found = true;
    else if (typeof node.color === 'string' && HOUSE_BLUE.test(node.color.trim())) {
      found = true;
    } else if (typeof node.value === 'string' && ANSWER_GREEN.test(node.value)) {
      found = true;
    } else if (typeof node.text === 'string' && ANSWER_GREEN.test(node.text)) {
      found = true;
    }
  });
  return found;
}

function turnWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const warnings = [];
  slides.forEach((slideData, index) => {
    if (!slideData || typeof slideData !== 'object') return;
    const title = typeof slideData.title === 'string' ? slideData.title.trim() : '';
    if (!TURN_TITLE.test(title)) return;
    if (carriesItsTurn(slideData)) return;
    warnings.push({
      signal: 'TURN_SLIDE_WITHOUT_ITS_TURN',
      slide: index + 1,
      field: 'title',
      message:
        `"${title}" promises the class a turn, but this slide carries no question, ` +
        'no task in house blue and no answer - only reference material. Put the ' +
        "turn's own question or task on it, or fold this content into the slide " +
        'that does have the question (a reference usually fits beside a task as a ' +
        'side panel in a row) rather than leaving a reference-only slide wearing a ' +
        'turn label.'
    });
  });
  return warnings;
}

// Two modelling slides in a row means the class watched two moves before
// practising either, so the move shown first commonly reaches independent work
// with no guided attempt behind it. The design validator refuses two My Turn
// source units for one concept; this catches the other route to the same board,
// where one unit carrying examples that cannot share a representation is split
// across consecutive slides. Either way the repair is upstream: give the second
// move its own cycle with an Our Turn between, or choose examples that share one
// starting value and one visual.
const MY_TURN_TITLE = /^my\s+turn\b/i;
const ANSWER_TITLE = /\banswers?\b/i;

function consecutiveModellingWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const warnings = [];
  const titleOf = (slideData) =>
    slideData && typeof slideData.title === 'string' ? slideData.title.trim() : '';
  slides.forEach((slideData, index) => {
    if (index === 0) return;
    const title = titleOf(slideData);
    const previous = titleOf(slides[index - 1]);
    if (!MY_TURN_TITLE.test(title) || !MY_TURN_TITLE.test(previous)) return;
    // An answer or reveal slide is not a second model, and the turn rules put a
    // My Turn's answer in the speaker notes rather than on a slide of its own.
    if (ANSWER_TITLE.test(title)) return;
    warnings.push({
      signal: 'MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS',
      slide: index + 1,
      field: 'title',
      message:
        `"${title}" is a second modelling slide immediately after "${previous}", ` +
        'so children watch two moves before practising either and the first one ' +
        'can reach independent work with no guided attempt behind it. Put every ' +
        "example of one move on that move's own slide, and give a genuinely " +
        'different move its own cycle with an Our Turn between. Where the ' +
        'examples cannot share one starting value and one visual, they are ' +
        'different moves and belong in different cycles rather than in one unit ' +
        'split across slides.'
    });
  });
  return warnings;
}

// One picture in two places on one board.
//
// Nothing in this engine crops a delivered picture: a file arrives whole and
// every slide that names it shows all of it. The contract validator refuses a
// picture drawn to be cut apart (`_PHOTO_CROP_RE` in validate-lesson-design.py,
// which is where a Year 4 place-value lesson's eight-chart sheet should have
// been stopped). This is the other half, on the finished deck: the same file
// drawn twice on ONE slide.
//
// That one is never a design. It is the same thing shown twice, and the second
// copy is always the smaller of the two - on the deck that found it, a
// place-value reference sat legibly in the side panel and again as a
// half-inch smudge at the bottom of the main column, where four columns of
// headings and values were pure noise. A picture the class reads on a run of
// slides is a different thing entirely and is exactly what §5 of the
// composition playbook asks for; the fault is two copies competing in one
// field of view.

// Fields that are never rendered to the board, so a filename inside them is not
// a picture on the slide.
const UNRENDERED_SLIDE_KEYS = new Set([
  'speakerNotes',
  'notes',
  'decorations',
  'template',
  'title',
  'designUnitId',
  'designUnitIds',
  'representationRefs',
  'successCriteriaRefs',
  'stickyKnowledgeRefs'
]);

// Every picture drawn on one slide, in the order the spec holds them.
function slidePictures(slideData) {
  const found = [];
  const seen = new Set();

  const walk = (node) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (node.type === 'image' && typeof node.imagePath === 'string') {
      found.push(node.imagePath);
    }
    Object.entries(node).forEach(([key, child]) => {
      if (UNRENDERED_SLIDE_KEYS.has(key)) return;
      if (child && typeof child === 'object') walk(child);
    });
  };

  Object.entries(slideData || {}).forEach(([key, value]) => {
    if (UNRENDERED_SLIDE_KEYS.has(key)) return;
    if (value && typeof value === 'object') walk(value);
  });

  return found;
}

function pictureWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const warnings = [];

  slides.forEach((slideData, index) => {
    if (!slideData || typeof slideData !== 'object') return;
    const timesDrawn = new Map();
    slidePictures(slideData).forEach((imagePath) => {
      timesDrawn.set(imagePath, (timesDrawn.get(imagePath) || 0) + 1);
    });
    timesDrawn.forEach((times, imagePath) => {
      if (times < 2) return;
      warnings.push({
        signal: 'PICTURE_TWICE_ON_ONE_SLIDE',
        slide: index + 1,
        field: 'imagePath',
        message:
          `"${imagePath}" is drawn ${times} times on this slide. One picture in ` +
          'two places on one board is the same thing shown twice, and the smaller ' +
          'copy is doing nothing the larger one is not already doing. Keep the ' +
          'copy that is the right size for what children read off it, and give ' +
          'the space back to whatever the slide was short of.'
      });
    });
  });

  return warnings;
}

// House blue is the colour of the words a child acts on. A text block whose
// whole `color` is blue while it both tells and asks ("Look at the tropical
// rainforest regions. What pattern do you notice around the Equator?") has
// hidden the question inside the explanation instead of lifting it; the
// asking sentence is meant to sit on its own line in blue with the telling
// black above it. The rule lives in the visual profile's Semantic colour, and
// two Year 4 geography decks in a row painted the whole card anyway, so the
// check names the card before the builder runs.
const HOUSE_BLUE = /^#?0070c0$/i;

function splitSentences(value) {
  return String(value)
    .split(/(?<=[.?!])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function wholeBlueMixedBlock(node) {
  if (!node || typeof node !== 'object' || node.type !== 'text') return false;
  const blue =
    (typeof node.color === 'string' && HOUSE_BLUE.test(node.color.trim())) ||
    node.colorRole === 'focus-blue';
  if (!blue || typeof node.value !== 'string') return false;
  const sentences = splitSentences(node.value);
  if (sentences.length < 2) return false;
  const asks = sentences.filter((sentence) => sentence.endsWith('?'));
  return asks.length > 0 && asks.length < sentences.length;
}

function walkContent(node, visit) {
  if (Array.isArray(node)) {
    node.forEach((child) => walkContent(child, visit));
    return;
  }
  if (!node || typeof node !== 'object') return;
  visit(node);
  Object.keys(node).forEach((key) => {
    if (key === 'speakerNotes' || key === 'decorations') return;
    walkContent(node[key], visit);
  });
}

function mixedBlockWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const warnings = [];
  slides.forEach((slideData, index) => {
    walkContent(slideData, (node) => {
      if (!wholeBlueMixedBlock(node)) return;
      warnings.push({
        signal: 'MIXED_BLOCK_WHOLE_BLUE',
        slide: index + 1,
        field: 'text',
        message:
          `"${node.value.slice(0, 60)}" tells and then asks in one blue block; ` +
          'keep the telling black and put the question on its own line in blue ' +
          '(a `[[ ]]` span or a separate text object).'
      });
    });
  });
  return warnings;
}

// House blue means one thing on the body of a slide: this is a question for
// you. An instruction the class acts on is black, because it already reads as
// part of the job the blue question set, and painting it blue too spends the
// contrast that was lifting the question. A Year 4 history deck put "Explain
// your answer using the photograph.", "Point to the details that support your
// comparison." and seven more task lines in house blue, and the board arrived
// almost entirely blue (flagged by Daniel, 3 September 2026: "can we make only
// questions to children blue").
//
// A blue run is only judged when it is a finished sentence - it ends in a full
// stop or an exclamation mark and runs to more than one word. Short blue
// labels, category names and option words are navigational chrome the templates
// own, and they carry no terminal punctuation, so they never reach this check.
// A run carrying a question mark is doing blue's own job and passes; a blue
// block that both tells and asks is the neighbouring MIXED_BLOCK_WHOLE_BLUE
// fault, which splits it instead.
const FOCUS_SPAN = /\[\[([\s\S]*?)\]\]/g;

function blueStatement(run) {
  const text = String(run == null ? '' : run).trim();
  if (!/[.!]$/.test(text)) return false;
  if (text.includes('?')) return false;
  return text.split(/\s+/).filter(Boolean).length > 1;
}

function nodeIsBlue(node) {
  return (
    node.colorRole === 'focus-blue' ||
    (typeof node.color === 'string' && HOUSE_BLUE.test(node.color.trim()))
  );
}

// `[[ ]]` reaches blue from inside any string the slide prints, and a task
// list carries its lines as bare strings in `steps` rather than as text nodes,
// so scanning only `value` and `text` would let a whole blue instruction list
// through. Speaker notes are the teacher's script and never rendered to the
// board, so they stay out.
const UNPRINTED_KEYS = new Set(['speakerNotes', 'decorations']);

function blueStatementRuns(node) {
  const runs = [];
  const whole = typeof node.value === 'string' ? node.value : node.text;
  if (nodeIsBlue(node) && typeof whole === 'string') runs.push(whole);
  Object.keys(node).forEach((key) => {
    if (UNPRINTED_KEYS.has(key)) return;
    const value = node[key];
    const strings =
      typeof value === 'string'
        ? [value]
        : Array.isArray(value)
          ? value.filter((entry) => typeof entry === 'string')
          : [];
    strings.forEach((entry) => {
      for (const match of entry.matchAll(FOCUS_SPAN)) runs.push(match[1]);
    });
  });
  return runs.filter(blueStatement);
}

function blueStatementWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const warnings = [];
  slides.forEach((slideData, index) => {
    const seen = new Set();
    walkContent(slideData, (node) => {
      blueStatementRuns(node).forEach((run) => {
        const text = run.trim();
        if (seen.has(text)) return;
        seen.add(text);
        warnings.push({
          signal: 'BLUE_WITHOUT_A_QUESTION',
          slide: index + 1,
          field: 'text',
          message:
            `"${text.slice(0, 60)}" is in house blue but asks the class ` +
            'nothing. Blue is the colour of a question children answer; an ' +
            'instruction they act on is black, so drop the blue here (remove ' +
            'the `focus-blue` role, the house-blue `color` or the `[[ ]]` ' +
            'span) and leave the blue for the question this task belongs to.'
        });
      });
    });
  });
  return warnings;
}

// A starter is questions all the way down, so blue there marks nothing a child
// cannot already see and a screenful of solid blue reads worse than black. One
// starter question is black; several alternate black, blue, black, blue, where
// the colour is separating one numbered question from the next rather than
// saying "this is for you".
function starterQuestionEntries(slideData) {
  const entries = [];
  walkContent(slideData, (node) => {
    if (!QUESTION_TYPES.has(node.type) || !Array.isArray(node.questions)) return;
    node.questions.forEach((question) => entries.push(question));
  });
  return entries;
}

function starterQuestionIsBlue(question) {
  if (typeof question === 'string') {
    // FOCUS_SPAN is global, and a global regex carries lastIndex between
    // `test` calls, so it would answer every other question wrongly.
    return question.trim().match(FOCUS_SPAN) !== null;
  }
  if (!question || typeof question !== 'object') return false;
  return nodeIsBlue(question);
}

function starterColourWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const warnings = [];
  slides.forEach((slideData, index) => {
    if (!slideData || slideData.headerStyle !== 'starter') return;
    const questions = starterQuestionEntries(slideData);
    if (!questions.length) return;
    if (!questions.every(starterQuestionIsBlue)) return;
    warnings.push({
      signal: 'STARTER_QUESTIONS_ALL_BLUE',
      slide: index + 1,
      field: 'body',
      message:
        `every question on this starter is house blue, which marks nothing a ` +
        'child cannot already see on a slide that is questions all the way ' +
        'down. Leave a single starter question black; with several, alternate ' +
        'them black, blue, black, blue so the colour separates one numbered ' +
        'question from the next.'
    });
  });
  return warnings;
}

// A sticky-knowledge line is purple. That is the deck's whole point in having a
// third colour: black is the teacher talking, blue is the child's job, purple is
// the sentence to keep, and a child reads which is which without being told. The
// builder colours a sticky line for you - the ✨ marks it - so the only way to
// lose the purple is to paint over it, and an `emphasis` span stretched across
// the entire statement does exactly that. A Year 4 PSHE deck ran its one sticky
// fact in problem red on two slides that way (flagged by Daniel, 2 September
// 2026), and the deck then had no purple in it at all.
//
// A span *inside* a sticky line is untouched: a taught term stays green there,
// exactly as it does everywhere else a child reads it.
const STICKY_LINE = /^\s*✨/;

function stickyEmphasisWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const warnings = [];
  slides.forEach((slideData, index) => {
    walkContent(slideData, (node) => {
      const value = typeof node.value === 'string' ? node.value : null;
      if (!value || !STICKY_LINE.test(value)) return;
      if (!Array.isArray(node.emphasis) || !node.emphasis.length) return;
      const statement = value.replace(STICKY_LINE, '').trim();
      node.emphasis.forEach((entry) => {
        if (!entry || typeof entry.text !== 'string') return;
        if (entry.text.trim() !== statement) return;
        warnings.push({
          signal: 'STICKY_LINE_RECOLOURED',
          slide: index + 1,
          field: 'text',
          message:
            `"${statement.slice(0, 60)}" is a sticky-knowledge line, and the ` +
            `\`${entry.role}\` emphasis covers the whole of it, which repaints ` +
            'the sentence children are meant to read as purple. Remove that ' +
            'emphasis and let the sticky line keep its colour; mark a span ' +
            'inside it only when that span really is a taught term or a ' +
            'source-authored warning of its own.'
        });
      });
    });
  });
  return warnings;
}

function presentationDiagnostic(warning) {
  return `BUILD_DIAGNOSTIC: ${JSON.stringify({
    signal: warning.signal,
    artifact: 'slides',
    faultClass: 'presentation',
    location: {
      slide: warning.slide,
      box: warning.field
    },
    message: warning.message
  })}`;
}

// The optional visual layer has two routes: a drawing from the shared
// Educational SVG library, and an emoji as the fallback when no drawing fits.
// Only the drawing route leaves a trace anyone looks for, so a pass that never
// opened the library and typed emojis instead reports as "zero requests" and
// reads exactly like a deck the library had nothing for. Counting both makes
// the route that was actually taken a fact rather than a claim.
const OPTIONAL_PICTURE_KINDS = ['educational-svg', 'emoji'];

function countOptionalPictures(lesson) {
  const counts = { 'educational-svg': 0, emoji: 0 };
  const seen = new Set();

  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (
      typeof node.kind === 'string' &&
      OPTIONAL_PICTURE_KINDS.includes(node.kind)
    ) {
      counts[node.kind] += 1;
    }
    Object.values(node).forEach(walk);
  };

  walk(lesson);
  return counts;
}

function optionalPictureLine(counts) {
  return (
    `SLIDE_DESIGN_OPTIONAL_PICTURES: ${counts['educational-svg']} ` +
    `educational-svg, ${counts.emoji} emoji`
  );
}

function runSlideDesignCheck(inputPath, options = {}) {
  const jsonPath = path.resolve(inputPath);
  const buildPath = path.resolve(
    options.buildPath || path.join(__dirname, '..', 'build.js')
  );

  if (!fs.existsSync(jsonPath)) {
    return {
      ok: false,
      reason: 'LESSON_JSON_NOT_FOUND',
      slideCount: 0,
      stdout: '',
      stderr: `Lesson JSON not found: ${jsonPath}\n`,
      scratchOutputPath: null,
    };
  }

  const source = fs.readFileSync(jsonPath, 'utf8');
  let lesson;
  try {
    lesson = JSON.parse(source);
  } catch (error) {
    return {
      ok: false,
      reason: 'LESSON_JSON_INVALID',
      slideCount: 0,
      stdout: '',
      stderr: `${friendlyParseError(jsonPath, source, error)}\n`,
      scratchOutputPath: null,
    };
  }

  const slideCount = Array.isArray(lesson.slides) ? lesson.slides.length : 0;
  const optionalPictures = countOptionalPictures(lesson);
  const capacity = capacityWarnings(lesson);
  if (capacity.length) {
    return {
      ok: false,
      reason: 'SLIDE_DESIGN_CAPACITY',
      slideCount,
      stdout: `${capacity.map(buildDiagnostic).join('\n')}\n`,
      stderr:
        `\n${capacity.length} slide-design composition problem(s) - scratch build not run:\n` +
        capacity
          .map(
            (warning) =>
              `  ✗ slide ${warning.slide} ${warning.field}: ` +
              `${warning.signal}: ${warning.message}`
          )
          .join('\n') +
        '\nFix only the slide composition, then run the check again.\n',
      scratchOutputPath: null,
    };
  }

  const presentation = presentationWarnings(lesson)
    .concat(turnWarnings(lesson))
    .concat(consecutiveModellingWarnings(lesson))
    .concat(mixedBlockWarnings(lesson))
    .concat(blueStatementWarnings(lesson))
    .concat(starterColourWarnings(lesson))
    .concat(stickyEmphasisWarnings(lesson))
    .concat(pictureWarnings(lesson));
  if (presentation.length) {
    return {
      ok: false,
      reason: 'SLIDE_DESIGN_PRESENTATION',
      slideCount,
      stdout: `${presentation.map(presentationDiagnostic).join('\n')}\n`,
      stderr:
        `\n${presentation.length} slide-design presentation problem(s) - ` +
        `scratch build not run:\n` +
        presentation
          .map(
            (warning) =>
              `  x slide ${warning.slide} ${warning.field}: ` +
              `${warning.signal}: ${warning.message}`
          )
          .join('\n') +
        '\nRepair only what each line names, then run the check again.\n',
      scratchOutputPath: null
    };
  }

  let scratchDir;
  try {
    scratchDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'lesson-resources-slide-design-check-')
    );
  } catch (error) {
    return {
      ok: false,
      reason: 'SCRATCH_DIRECTORY_FAILED',
      slideCount,
      stdout: '',
      stderr: `Could not create the slide-design scratch directory: ${error.message}\n`,
      scratchOutputPath: null,
    };
  }

  let outcome;
  let scratchOutputPath = null;

  try {
    // The scratch build draws whatever the candidate actually carries,
    // decorations included. It used to skip them unconditionally, which meant
    // the optional layer was never rendered anywhere the designer could see it:
    // the preview it inspects had none, and the only pass that ever saw one in
    // position was a later spawn that ran only when a photograph had landed. A
    // deck could therefore ship a drawing sitting on a word without any check or
    // any eye having looked at it once. Nothing needs deciding here - before the
    // optional pass the candidate has no decorations and this is byte-identical
    // to skipping them; after it, the designer sees its own layer.
    const child = spawnSync(
      process.execPath,
      [
        buildPath,
        jsonPath,
        scratchDir,
      ],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          ...(options.env || {}),
          ...(options.photoRequirementsPath
            ? {
                PHOTO_REQUIREMENTS_PATH: path.resolve(
                  options.photoRequirementsPath
                ),
              }
            : {}),
        },
      }
    );

    const childStdout = String(child.stdout || '');
    const childStderr = String(child.stderr || '');

    if (child.error) {
      outcome = {
        ok: false,
        reason: 'SCRATCH_BUILD_LAUNCH_FAILED',
        slideCount,
        stdout: childStdout,
        stderr: appendLine(childStderr, child.error.message),
        scratchOutputPath,
      };
    } else if (child.status !== 0) {
      outcome = {
        ok: false,
        reason: 'SCRATCH_BUILD_FAILED',
        slideCount,
        stdout: childStdout,
        stderr: childStderr,
        scratchOutputPath,
      };
    } else {
      const blockingDiagnostics = parseBuildDiagnostics(childStdout).filter(
        (item) => BLOCKING_CAPACITY_SIGNALS.has(item && item.signal)
      );

      if (blockingDiagnostics.length) {
        outcome = {
          ok: false,
          reason: 'SLIDE_DESIGN_CAPACITY',
          slideCount,
          stdout: stripScratchWroteLine(childStdout),
          stderr: appendLine(
            childStderr,
            `${blockingDiagnostics.length} blocking slide-design capacity ` +
              'diagnostic(s) remained after the scratch build.'
          ),
          scratchOutputPath,
        };
      } else {
        const wroteLines = childStdout
          .split(/\r?\n/)
          .filter((line) => line.startsWith('Wrote: '));

        if (wroteLines.length !== 1) {
          outcome = {
            ok: false,
            reason: 'SCRATCH_BUILD_MARKER_MISSING',
            slideCount,
            stdout: childStdout,
            stderr: appendLine(
              childStderr,
              'The scratch build exited 0 without exactly one Wrote: line.'
            ),
            scratchOutputPath,
          };
        } else {
          scratchOutputPath = path.resolve(
            wroteLines[0].slice('Wrote: '.length).trim()
          );

          if (!pathIsInside(scratchOutputPath, scratchDir)) {
            outcome = {
              ok: false,
              reason: 'SCRATCH_BUILD_OUTPUT_ESCAPE',
              slideCount,
              stdout: stripScratchWroteLine(childStdout),
              stderr: appendLine(
                childStderr,
                `The scratch build wrote outside its private directory: ${scratchOutputPath}`
              ),
              scratchOutputPath,
            };
          } else if (!fs.existsSync(scratchOutputPath)) {
            outcome = {
              ok: false,
              reason: 'SCRATCH_BUILD_OUTPUT_MISSING',
              slideCount,
              stdout: stripScratchWroteLine(childStdout),
              stderr: appendLine(
                childStderr,
                `The scratch build reported a file that does not exist: ${scratchOutputPath}`
              ),
              scratchOutputPath,
            };
          } else {
            outcome = {
              ok: true,
              reason: null,
              slideCount,
              stdout: stripScratchWroteLine(childStdout),
              stderr: childStderr,
              scratchOutputPath,
            };

            if (options.retainPreview) {
              // --preview: the deck above is a scratch artifact the finally
              // block is about to delete. Copy it into a private preview
              // directory that outlives the check, so the designer can render
              // and read it before promoting the candidate. The scratch dir
              // itself never leaks, and the copy is disposable evidence - the
              // orchestrator still owns the final build.
              try {
                const previewDir = fs.mkdtempSync(
                  path.join(os.tmpdir(), 'lesson-resources-slide-preview-')
                );
                const previewOutputPath = path.join(
                  previewDir,
                  path.basename(scratchOutputPath)
                );
                fs.copyFileSync(scratchOutputPath, previewOutputPath);
                outcome.previewDir = previewDir;
                outcome.previewOutputPath = previewOutputPath;
              } catch (error) {
                outcome = {
                  ok: false,
                  reason: 'SCRATCH_PREVIEW_COPY_FAILED',
                  slideCount,
                  stdout: stripScratchWroteLine(childStdout),
                  stderr: appendLine(
                    childStderr,
                    `Could not copy the checked deck to a private preview directory: ${error.message}`
                  ),
                  scratchOutputPath,
                };
              }
            }
          }
        }
      }
    }
  } catch (error) {
    outcome = {
      ok: false,
      reason: 'SCRATCH_BUILD_LAUNCH_FAILED',
      slideCount,
      stdout: '',
      stderr: `${error.stack || error.message || error}\n`,
      scratchOutputPath,
    };
  } finally {
    try {
      fs.rmSync(scratchDir, { recursive: true, force: true });
    } catch (error) {
      outcome = {
        ok: false,
        reason: 'SCRATCH_CLEANUP_FAILED',
        slideCount,
        stdout: outcome ? outcome.stdout : '',
        stderr: appendLine(
          outcome ? outcome.stderr : '',
          `Could not remove the slide-design scratch directory ${scratchDir}: ${error.message}`
        ),
        scratchOutputPath,
      };
    }
  }

  if (outcome) outcome.optionalPictures = optionalPictures;

  return outcome;
}

function writeText(stream, text) {
  if (!text) return;
  stream.write(text.endsWith('\n') ? text : `${text}\n`);
}

function main(argv = process.argv.slice(2)) {
  const preview = argv.includes('--preview');
  const args = [];
  let photoRequirementsPath = null;
  let photoRequirementsFlagSeen = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--preview') continue;
    if (arg === '--photo-requirements') {
      photoRequirementsFlagSeen = true;
      const next = argv[index + 1];
      photoRequirementsPath =
        next && !next.startsWith('--') ? next : null;
      if (photoRequirementsPath) index += 1;
      continue;
    }
    args.push(arg);
  }

  if (
    args.length !== 1 ||
    (photoRequirementsFlagSeen && !photoRequirementsPath)
  ) {
    console.error(
      'Usage: node check-slide-design.js <lesson.json> ' +
        '[--photo-requirements <photo-requirements.json>] [--preview]'
    );
    return 1;
  }

  const result = runSlideDesignCheck(args[0], {
    retainPreview: preview,
    photoRequirementsPath,
  });
  writeText(process.stdout, result.stdout);
  writeText(process.stderr, result.stderr);

  if (result.ok) {
    if (result.previewDir) {
      console.log(`SLIDE_DESIGN_PREVIEW_DIR: ${result.previewDir}`);
      console.log(`SLIDE_DESIGN_PREVIEW: ${result.previewOutputPath}`);
    }
    if (result.optionalPictures) {
      console.log(optionalPictureLine(result.optionalPictures));
    }
    console.log(`SLIDE_DESIGN_CHECK_OK: ${result.slideCount} slides`);
    return 0;
  }

  console.error(`SLIDE_DESIGN_CHECK_FAILED: ${result.reason}`);
  return 1;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  BLOCKING_CAPACITY_SIGNALS,
  countOptionalPictures,
  optionalPictureLine,
  buildDiagnostic,
  main,
  parseBuildDiagnostics,
  pathIsInside,
  runSlideDesignCheck,
  stripScratchWroteLine,
};
