#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { capacityWarnings } = require('../src/content/capacity');
const { friendlyParseError } = require('../src/validate');
const { expandTeachLayoutsEach, LAYOUTS } = require('../src/teach-layouts');

const BLOCKING_CAPACITY_SIGNALS = new Set([
  'FIXED_CAPTION_CAPACITY',
  // SUCCESS_CRITERIA_CAPACITY is deliberately NOT blocking. It counts criteria
  // and characters, and the teacher's standing ruling is that "too much" is a
  // judgement rather than a number (10 September 2026): a method with six real
  // steps is a method with six real steps, and refusing the deck over the sixth
  // would be the cap he removed. It reports, and the panel's own render-time
  // warning names the step that cost the panel its readable size.
  // A picture children work from below its readable floor. Was a warning
  // only, and a warning shipped a two-inch classroom photograph under "look
  // closely" (4 September 2026); the repair is the designer's own (a taller
  // zone, a split, `essential: false` for a picture that is only context).
  'PICTURE_BELOW_READABLE_FLOOR',
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

// Internal lesson-stage labels ("Teach 1", "Do 2", a bare "Practise" or
// "Apply") belong to the lesson-design document, never to a child-facing slide
// title. A title that is only a stage label tells a child nothing about the
// slide, so it blocks the check before any deck is built. Child-facing
// classroom labels (My Turn, Our Turn, Your Turn, Quick check) do not match and
// stay valid. "Practise" names the slot, not the move, in every subject (the
// teacher's "yes", 24 September 2026, `preferences.md` -> Slide Headings).
const INTERNAL_STAGE_TITLE =
  /^(?:(?:Teach|Do)\s+\d+(?:\s*:.*)?|Apply|Practise)$/i;

function presentationWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides)
    ? lesson.slides
    : [];
  const warnings = [];

  // Maths is the exception the teacher asked for: its decks are titled by the
  // plain words a class reads them by, `My Turn`, `Our Turn`, `Your Turn`,
  // `Answers` and `Apply`, because the slide's own question is already on the
  // board under the title (19 September 2026, `preferences.md` → Slide
  // Headings). Elsewhere a bare `Apply` is still a stage label on a board.
  const maths = /^maths$/i.test(String((lesson && lesson.subject) || '').trim());

  slides.forEach((slideData, index) => {
    if (!slideData || typeof slideData !== 'object') return;
    const title =
      typeof slideData.title === 'string'
        ? slideData.title.trim()
        : '';
    // An untitled arithmetic grid printed "Independent Tasks", a structural
    // label the teacher keeps off the board. The final build now draws it with
    // no title line rather than refuse the deck; this sends the designer back
    // to title it, beside the stage-label rule below. A grid under the starter
    // header is left alone: that header never prints a title, so asking for one
    // would ask for a word nobody sees.
    if (slideData.template === 'grid-calc' && !title && slideData.headerStyle !== 'starter') {
      warnings.push({
        signal: 'GRID_WITHOUT_TITLE',
        slide: index + 1,
        field: 'title',
        message:
          'a grid-calc slide has no "title", and the builder no longer prints ' +
          '"Independent Tasks" for one. Give it the design\'s label as its title: ' +
          'in maths the plain words, usually "Your Turn".'
      });
      return;
    }
    if (maths && /^apply$/i.test(title)) return;
    if (!INTERNAL_STAGE_TITLE.test(title)) return;
    warnings.push({
      signal: 'INTERNAL_STAGE_TITLE',
      slide: index + 1,
      field: 'title',
      message:
        `"${title}" is an internal lesson-stage label, not a child-facing title. ` +
        'Title the slide with the move the unit makes, in a child\'s words, from its own content. ' +
        'In maths the plain words My Turn, Our Turn, Your Turn, Answers and Apply are the titles; ' +
        'Practise is not one of them (preferences.md -> Slide Headings).'
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
// to be recognised through its house blue, but an instruction is black unless
// it is the child's own short task (see teacher-slide-visual-profile.md ->
// Semantic colour), so the list itself has to count or every instructed turn
// would read as a reference-only slide.
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

// The turn's own task, written as prose rather than carried by a question
// helper. A roomier free layout has no `questions` field to put it in, so the
// task arrives as a text node - and because Semantic colour keeps an
// instruction BLACK unless it is the child's own short task, marked `task-blue`
// (the teacher's rule of 24 September 2026, narrowing his of 3 September),
// nothing about a black node's colour says "turn".
//
// That left one class of slide with no legal way to exist. The Find 1,000
// more/less deck met it on four slides: black, and TURN_SLIDE_WITHOUT_ITS_TURN
// said there was no task; blue, and BLUE_WITHOUT_A_QUESTION said an imperative
// is not a question. Both rules were right. The deck was rebuilt from scratch to
// escape them (8 September 2026).
//
// So an imperative counts as the turn it is. An imperative opens with its verb,
// which is exactly what distinguishes "Find 1,000 more than 3,412." from the
// reference material this check exists to catch - "A thousand is ten hundreds."
// names a fact, and a slide carrying only facts under a turn title is still the
// interlude the rule refuses.
const TASK_OPENERS = new RegExp(
  '^(?:' + [
    'add', 'answer', 'ask', 'build', 'calculate', 'change', 'check', 'choose',
    'circle', 'colour', 'compare', 'complete', 'continue', 'convert', 'copy',
    'count', 'cross', 'decide', 'describe', 'design', 'discuss', 'divide',
    'draw', 'estimate', 'explain', 'fill', 'find', 'finish', 'give', 'identify',
    'imagine', 'improve', 'join', 'justify', 'label', 'list', 'look', 'make',
    'mark', 'match', 'measure', 'multiply', 'name', 'order', 'partition',
    'pick', 'place(?! value)', 'plan', 'plot', 'point', 'prove', 'put', 'read',
    'record', 'round', 'say', 'shade', 'share', 'show', 'solve', 'sort',
    'spot', 'subtract', 'suggest', 'take', 'tell', 'test', 'tick', 'try',
    'underline', 'use', 'work out', 'write',
  ].join('|') + ')\\b',
  'i'
);

function isTaskWording(value) {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (!text) return false;
  // A question already counts through its own routes; this is only about the
  // imperative half, so a "?" here means the other check owns it.
  return TASK_OPENERS.test(text);
}

// A `[[ ]]` span anywhere this node prints. Deliberately not the global
// FOCUS_SPAN regex: that one carries `lastIndex` between calls, and this is
// asked the same question about many nodes in a row.
const FOCUS_SPAN_PRESENT = /\[\[[\s\S]*?\]\]/;

function carriesFocusSpan(node) {
  return Object.keys(node).some((key) => {
    if (key === 'speakerNotes' || key === 'decorations') return false;
    const value = node[key];
    if (typeof value === 'string') return FOCUS_SPAN_PRESENT.test(value);
    if (Array.isArray(value)) {
      return value.some(
        (entry) => typeof entry === 'string' && FOCUS_SPAN_PRESENT.test(entry)
      );
    }
    return false;
  });
}

function taskBlueAsks(node) {
  const whole = typeof node.value === 'string' ? node.value : node.text;
  return typeof whole === 'string' && taskSentences(whole).some((sentence) => sentence.endsWith('?'));
}

function carriesItsTurn(slideData) {
  // A grid's calculations are the class's turn: twelve sums to work out are the
  // task, though no verb opens them. Without this the title the untitled grid's
  // own message asks for, "Your Turn", was refused as a turn with no task.
  if (
    slideData.template === 'grid-calc' &&
    Array.isArray(slideData.calculations) &&
    slideData.calculations.some((calculation) => String(calculation || '').trim())
  ) {
    return true;
  }
  let found = hasTaskSteps(slideData, false);
  walkContent(slideData, (node) => {
    if (found) return;
    if (Array.isArray(node.questions) && node.questions.length) found = true;
    else if (QUESTION_TYPES.has(node.type)) found = true;
    else if (isTaskWording(node.value) || isTaskWording(node.text)) found = true;
    // The three carriers Semantic colour names for a question are `color`,
    // `focus-blue` and a `[[ ]]` span inside a line. Only the first two were
    // read here, so a turn whose question is one clause of a longer line - the
    // ordinary shape when a number sentence is followed by the thing to decide -
    // looked like a slide with no question on it at all.
    else if (carriesFocusSpan(node)) found = true;
    else if (node.colorRole === 'focus-blue') found = true;
    // A `task-blue` line counts by what it says, never by its role: a
    // statement so marked is not the turn. A question on it is (the role
    // draws that question blue); a task verb has counted above already.
    else if (node.colorRole === 'task-blue' && taskBlueAsks(node)) found = true;
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
        "no task and no answer - only reference material. Put the turn's own " +
        "question or task on it, or fold this content into the slide that does " +
        'have the question (a reference usually fits beside a task as a side panel ' +
        'in a row) rather than leaving a reference-only slide wearing a turn ' +
        'label. Colour does not make a line a task: a statement or an instruction ' +
        'painted blue is refused by BLUE_WITHOUT_A_QUESTION, and `task-blue` is ' +
        'only for the child\'s own short task, the job itself (`Explain your ' +
        'answer.`), never advice on how to go about it.'
    });
  });
  return warnings;
}

// Two modelling slides in a row means the class watched two MOVES before
// practising either, so the move shown first commonly reaches independent work
// with no guided attempt behind it. A Year 4 deck went My Turn (cross a
// hundred), My Turn (cross a thousand), one Our Turn, Your Turn, and the teacher
// abandoned the lesson on the second model.
//
// Two moves is the fault, and the slide's source unit is what says whether that
// is what happened. Examples of one move live in one My Turn unit, so two
// consecutive My Turn slides carrying the SAME `designUnitId` are one modelling
// moment the layout had to divide, not a second move: the class still practises
// that one move next, which is the whole thing this rule protects. Different
// units are two moves and are still refused.
//
// The rule used to say a layout problem could never justify dividing a My Turn -
// examples that will not fit together "are different moves rather than a layout
// problem". A representation with a minimum usable size disproves that. Two
// four-column place-value charts sharing one slide give each column around
// 0.6in, which the build refuses outright - `PLACE_VALUE_COUNTERS_TOO_SMALL`
// when the chart carries counters, `PLACE_VALUE_WRITE_IN_TOO_NARROW` when a row
// is left blank to be filled in live - so a lesson modelling two numbers on
// charts has nowhere else to go (flagged by Daniel on 3 September 2026, "2 in
// one slide is still too small to do anything with ... I'd honestly have one
// each slide, 2 my turns", and again on 4 September when the write-in form of
// the same shape shipped). One number per slide, twice, is one move modelled
// twice at a size children can use. It is not two moves.
const MY_TURN_TITLE = /^my\s+turn\b/i;
const ANSWER_TITLE = /\banswers?\b/i;

// A figure the teacher writes on while modelling holds ONE modelled number.
//
// Two questions above one number line means the teacher models the first, then
// rubs the whole thing out in front of the class to model the second. The
// teacher asked for the second example to be its own slide instead: "it would
// be so much quicker if I just had an extra slide" (19 September 2026). The
// playbook has said since 4.2.108 that two examples each needing their own
// annotated figure may not share one, and decks kept doing it (43 and 45 over
// one line on 16 September, 34 and 50 on 17 September), because nothing
// checked it.
//
// The limit is what the figure is for: a Your Turn where children draw their
// own lines in books, and a reference figure nobody writes on, are untouched.
// This is My Turn and Our Turn only, where the teacher completes the figure.
const ANNOTATED_FIGURES = new Set([
  'numberline',
  'place-value-chart',
  'bar-model',
  'part-whole-model',
  'blank-surface',
  'label-diagram',
]);
const MODELLING_TITLE = /^(?:my|our)\s+turn\b/i;

function annotatedFigureCount(node, seen) {
  let total = 0;
  const walk = (value) => {
    if (Array.isArray(value)) { value.forEach(walk); return; }
    if (!value || typeof value !== 'object') return;
    if (typeof value.type === 'string' && ANNOTATED_FIGURES.has(value.type)) {
      total += value.type === 'numberline' && Array.isArray(value.lines)
        ? Math.max(1, value.lines.length)
        : 1;
      return;
    }
    Object.keys(value).forEach((key) => walk(value[key]));
  };
  walk(node, seen);
  return total;
}

function sharedModelWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const warnings = [];
  slides.forEach((slideData, index) => {
    if (!slideData || typeof slideData !== 'object') return;
    const title = typeof slideData.title === 'string' ? slideData.title.trim() : '';
    if (!MODELLING_TITLE.test(title)) return;
    const questions = Array.isArray(slideData.questions) ? slideData.questions : [];
    if (questions.length < 2) return;
    const figures = annotatedFigureCount(slideData);
    if (figures === 0 || figures >= questions.length) return;
    warnings.push({
      signal: 'ONE_MODEL_PER_ANNOTATED_FIGURE',
      slide: index + 1,
      field: 'questions',
      message:
        `"${title}" models ${questions.length} numbers over ${figures} figure` +
        `${figures === 1 ? '' : 's'} the teacher writes on, so the first model has to be ` +
        'rubbed out in front of the class before the second can start. Give each ' +
        'modelled example its own slide, with the same title and the same source ' +
        'unit, so the teacher clicks on to a clean figure. A figure children draw ' +
        'for themselves, or one nobody writes on, is not this check\'s business.',
    });
  });
  return warnings;
}

function consecutiveModellingWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const warnings = [];
  const titleOf = (slideData) =>
    slideData && typeof slideData.title === 'string' ? slideData.title.trim() : '';
  const unitOf = (slideData) =>
    slideData && typeof slideData.designUnitId === 'string' ? slideData.designUnitId : '';
  slides.forEach((slideData, index) => {
    if (index === 0) return;
    const title = titleOf(slideData);
    const previous = titleOf(slides[index - 1]);
    if (!MY_TURN_TITLE.test(title) || !MY_TURN_TITLE.test(previous)) return;
    // An answer or reveal slide is not a second model, and the turn rules put a
    // My Turn's answer in the speaker notes rather than on a slide of its own.
    if (ANSWER_TITLE.test(title)) return;
    // One unit divided across slides is one move shown more than once. Two units
    // back to back are two moves, which is the fault.
    if (unitOf(slideData) && unitOf(slideData) === unitOf(slides[index - 1])) return;
    warnings.push({
      signal: 'MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS',
      slide: index + 1,
      field: 'title',
      message:
        `"${title}" is a second modelling slide immediately after "${previous}", ` +
        'so children watch two moves before practising either and the first one ' +
        'can reach independent work with no guided attempt behind it. These two ' +
        'come from different source units, so they are two moves: give the ' +
        'second its own cycle with an Our Turn between. Examples of ONE move ' +
        'belong in one My Turn unit, and a unit divided across slides because ' +
        'its representation cannot be read at the size sharing one slide would ' +
        'give it is allowed - that is one move modelled twice, and the class ' +
        'still practises it next.'
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

// The same sentence printed twice on ONE slide.
//
// `slide-success-criteria.md` already says a sticky fact that is the slide's
// key sentence is rendered once, and on 22 September 2026 a Year 4 history
// deck printed `Steam engines brought new fairground rides in Victorian
// times.` as a card and again as the star line beneath it, on the slide whose
// question was how a steam engine changed a fair: the repair that added the
// star line to satisfy the landed-sentence check left the card where it was.
// The teacher's note on it was one word: "Twice." Nothing in the words of
// either copy is wrong, so only the slide as a whole shows the fault. Keys
// that never reach the board, and the emphasis spans inside a line, are not
// read, and a line under five words (a caption, a heading) is left alone.
const UNRENDERED_TEXT_KEYS = new Set([
  ...UNRENDERED_SLIDE_KEYS,
  'emphasis', 'imagePath', 'layout', 'fit', 'variant', 'type', 'headerStyle',
  'id', 'kind', 'role', 'align', 'alt', 'description', 'context', 'avoid',
  'concept', 'prompt', 'educationalSvgId', 'educationalSvgSlug', 'frame', 'layer'
]);

// Each line with where it sits. The same label on every card of a set, or the
// same note under each of three number lines, is a parallel layout and not a
// repeat: those copies sit at one path that differs only in which card or
// figure holds them. Two copies in two different places (a card and the star
// line), or twice in one list, are the fault.
function slideLines(slideData) {
  const found = [];
  const walk = (node, route) => {
    if (typeof node === 'string') {
      found.push({ text: node, route });
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((child, index) => walk(child, route.concat(index)));
      return;
    }
    if (!node || typeof node !== 'object') return;
    Object.entries(node).forEach(([key, child]) => {
      if (UNRENDERED_TEXT_KEYS.has(key)) return;
      walk(child, route.concat(key));
    });
  };
  walk(slideData, []);
  return found;
}

function isParallelCopy(first, second) {
  if (first.length !== second.length) return false;
  if (typeof first[first.length - 1] === 'number') return false;
  return first.every((part, index) =>
    typeof part === 'number' ? typeof second[index] === 'number' : part === second[index]);
}

function sameLineWords(text) {
  return text
    .toLowerCase()
    .replace(/\[\[|\]\]|<<|>>|✨/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function repeatedLineWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const warnings = [];
  slides.forEach((slideData, index) => {
    if (!slideData || typeof slideData !== 'object') return;
    const seen = new Map();
    slideLines(slideData).forEach(({ text, route }) => {
      const words = sameLineWords(text);
      if (words.split(' ').length < 5) return;
      const entry = seen.get(words) || { text, routes: [] };
      entry.routes.push(route);
      seen.set(words, entry);
    });
    seen.forEach(({ text, routes }) => {
      const times = routes.length;
      if (times < 2) return;
      if (routes.every((route) => isParallelCopy(routes[0], route))) return;
      warnings.push({
        signal: 'SAME_LINE_TWICE_ON_ONE_SLIDE',
        slide: index + 1,
        field: 'text',
        message:
          `"${text.trim()}" is printed ${times} times on this slide. A class that reads one ` +
          'sentence twice reads it as a mistake, not as emphasis, and the second copy ' +
          'takes the room the slide needed for the reason or the thing to look at. ' +
          'Keep it once, in the place it does its job (the star line when it is the ' +
          'sticky fact), and give the other slot to a sentence of the explanation.'
      });
    });
  });
  return warnings;
}

// A word card sits straight before the first slide whose board shows its word.
// The card is not where a word is taught: it is there so a child can read the
// word on the slide that comes next (the teacher's rule, 28 September 2026:
// "Is there an important word to do with the topic that they would need to know
// in the next slide? If so, vocab slide"). The design can only name a unit, so
// the slide designer moves the card on to the exact slide, and a Codex
// geography deck the same day still put `climate` before a Sahara slide whose
// board never said it. Only the board counts: the title and every printed
// piece, never the speaker notes.
function boardWords(slideData) {
  // The objective line is the teacher's LO, printed on every lesson's first
  // slide; a word in it has not been met yet.
  const { lo, ...board } = slideData;
  const text = [board.title || '']
    .concat(slideLines(board).map(({ text: line }) => line))
    .join(' ');
  return ` ${sameLineWords(text)} `;
}

function showsTerm(board, term) {
  const words = sameLineWords(term);
  if (!words) return true;
  const stem = words.endsWith('y') ? `${words.slice(0, -1)}(?:y|ies)` : words;
  return new RegExp(` ${stem.replace(/ /g, ' ')}(?:s|es)? `).test(board);
}

function vocabCardBeforeItsWord(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const warnings = [];
  const isCard = (slideData) => slideData && slideData.template === 'key-vocabulary';
  slides.forEach((slideData, index) => {
    if (!isCard(slideData)) return;
    const terms = (Array.isArray(slideData.words) ? slideData.words : [])
      .map((entry) => (entry && typeof entry.word === 'string' ? entry.word : ''))
      .filter(Boolean);
    if (!terms.length) return;
    const shows = (at) => {
      const board = boardWords(slides[at] || {});
      return terms.some((term) => showsTerm(board, term));
    };
    const named = terms.map((term) => `"${term}"`).join(' and ');
    // Too late: a board before the card already shows the word (a paced Teach
    // that says "a disease called cholera" on its fourth slide, with the card
    // after the whole Teach and a script saying "the word we've just met").
    const earlier = slides.findIndex((other, at) => at < index && !isCard(other) && shows(at));
    if (earlier !== -1) {
      warnings.push({
        signal: 'VOCAB_CARD_AFTER_A_SLIDE_WITH_ITS_WORD',
        slide: index + 1,
        field: 'words',
        message:
          `The card for ${named} comes after slide ${earlier + 1}, whose board already shows ` +
          `${terms.length > 1 ? 'those words' : 'that word'}. A card sits straight before the first slide ` +
          `that uses its word, so move it back to sit before slide ${earlier + 1}. If its speaker notes ` +
          'speak as if the word was already met, report that upstream rather than rewording them.'
      });
      return;
    }
    let next = index + 1;
    while (next < slides.length && isCard(slides[next])) next += 1;
    if (next >= slides.length) return;
    if (shows(next)) return;
    let first = next + 1;
    while (first < slides.length && (isCard(slides[first]) || !shows(first))) first += 1;
    warnings.push({
      signal: 'VOCAB_CARD_BEFORE_A_SLIDE_WITHOUT_ITS_WORD',
      slide: index + 1,
      field: 'words',
      message:
        `The card for ${named} sits before slide ${next + 1}, whose board does not show ` +
        `${terms.length > 1 ? 'those words' : 'that word'}. A card is there so a child can read ` +
        'its word on the very next slide, not to teach it early. ' +
        (first < slides.length
          ? `The first board after it that shows it is slide ${first + 1}: move the card to sit ` +
            'straight before that slide, and keep its speaker notes exactly as written.'
          : 'No board after it shows the word. Put the word on the board where the idea lands, ' +
            'or report the card upstream as a word no slide needs.')
    });
  });
  return warnings;
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
          '(a `[[ ]]` span or a separate text object). A short task that is the ' +
          'child\'s job may share its question\'s line as `task-blue`.'
      });
    });
  });
  return warnings;
}

// House blue means one thing on the body of a slide: this is your job - a
// question to answer, or a short task the designer has marked `task-blue`
// (the teacher's rule of 24 September 2026, narrowing his of 3 September, when
// a history deck's nine task lines arrived blue; the build log keeps it).
// Anything else painted blue - a statement, an answer, an instruction about
// how to go about the task - spends the contrast that was lifting the job, so
// it is refused here. Whether a line is the job or advice is the designer's
// judgement, which the role records; no count of words can make it.
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
    node.colorRole === 'task-blue' ||
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
  // A `task-blue` line has said what it is; TASK_BLUE_NOT_A_SHORT_TASK judges it.
  if (nodeIsBlue(node) && node.colorRole !== 'task-blue' && typeof whole === 'string') {
    runs.push(whole);
  }
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
            'nothing. Blue is for a question children answer, and for the ' +
            'child\'s own short task, the job itself (`Explain your answer.`, ' +
            '`Write one reason.`), marked `colorRole: "task-blue"`; a statement, ' +
            'an answer or an instruction about how to go about the task is ' +
            'black, so drop the blue here (remove the `focus-blue` role, the ' +
            'house-blue `color` or the `[[ ]]` span) and leave it for the ' +
            'question or short task this belongs to.'
        });
      });
    });
  });
  return warnings;
}

// A short task is the child's job said in a few words - `Explain your answer.`,
// `Write one reason.`, `Round 346 to the nearest 10.` - and it is blue, as a
// question is. Whether a line is the job or advice on how to go about it (`Use
// the shaded map.`) is the designer's call, recorded by the role. What the
// spec shows about the line, the check refuses: the reveal mark `||` (an
// answer is green on an answer slide); a line the lesson design holds as a
// sticky fact or as this lesson's answer; a sticky line's sparkle; and any
// shape but one short task, alone or after its question - a statement or a
// task before a question is a tell-then-ask block, and two instructions are
// the all-blue board of 3 September arriving one short line at a time. A lone
// statement marked `task-blue` that the design does not name passes this
// rule, which cannot read meaning; it never counts as the slide's turn,
// because carriesItsTurn reads a marked line's words, not its role.
const TASK_BLUE_REVEAL = /\|\|/;
const TASK_BLUE_MARKS = /\|\||\*\*|\[\[|\]\]|\{\{|\}\}|<<|>>|✨/g;

// The words, without marks, spacing, case or a closing full stop, so a line
// is matched to the design's own words however it was typed onto the slide.
function plainLine(text) {
  return String(text).replace(TASK_BLUE_MARKS, '').replace(/\s+/g, ' ').trim()
    .replace(/[.!]+$/, '').toLowerCase();
}

// What the lesson design beside the deck says is a sticky fact or an answer,
// in plain words, so a marked line is refused by what it is, not by its shape.
function designFacts(jsonPath) {
  const facts = { sticky: new Set(), answers: new Set() };
  if (!jsonPath) return facts;
  const designPath = path.join(path.dirname(jsonPath), 'lesson-design.json');
  if (!fs.existsSync(designPath)) return facts;
  let design;
  try {
    design = JSON.parse(fs.readFileSync(designPath, 'utf8'));
  } catch {
    return facts;
  }
  (Array.isArray(design.stickyKnowledge) ? design.stickyKnowledge : []).forEach((fact) => {
    if (fact && typeof fact.text === 'string' && fact.text.trim()) facts.sticky.add(plainLine(fact.text));
  });
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    // A unit, block, part or prompt holds its answer as `answer.content`.
    const answer = node.answer;
    if (answer && typeof answer.content === 'string' && answer.content.trim()) {
      facts.answers.add(plainLine(answer.content));
    }
    Object.keys(node).forEach((key) => visit(node[key]));
  };
  visit(design);
  return facts;
}

// Sentences, as a reader meets them: `e.g.` and `i.e.` do not end one.
function taskSentences(whole) {
  return splitSentences(String(whole).replace(/\b(e\.g|i\.e)\.(?=\s)/gi, (m) => m.replace(/\./g, '․')));
}

function taskBlueFault(whole, facts) {
  if (TASK_BLUE_REVEAL.test(whole)) {
    return 'it carries the reveal mark `||`, and an answer is green on an answer slide, never blue';
  }
  if (whole.trim().startsWith('✨') || facts.sticky.has(plainLine(whole))) {
    return 'it is a sticky fact, which is purple';
  }
  if (facts.answers.has(plainLine(whole))) {
    return 'it is the lesson\'s answer, which is green on an answer slide, never blue';
  }
  const sentences = taskSentences(whole);
  const tasks = sentences.filter((sentence) => !sentence.endsWith('?'));
  if (tasks.length > 1) {
    return `it holds ${tasks.length} sentences that are not questions, and a short task is one`;
  }
  if (tasks.length === 1 && sentences[sentences.length - 1].endsWith('?')) {
    return 'it tells before it asks, and a line that tells or instructs and then asks is two things, not one short task';
  }
  return null;
}

function taskBlueWarnings(lesson, jsonPath) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const facts = designFacts(jsonPath);
  const warnings = [];
  slides.forEach((slideData, index) => {
    walkContent(slideData, (node) => {
      if (node.colorRole !== 'task-blue') return;
      const whole = typeof node.value === 'string' ? node.value : node.text;
      if (typeof whole !== 'string' || !whole.trim()) return;
      // The role is the short task's only blue. A colour beside it would let a
      // hex decide what the role is for: the turn check reads a house-blue hex,
      // so a statement given both counted as the turn (the third check).
      const ownColour = [node.color, node.colour].find((c) => typeof c === 'string' && c.trim());
      if (ownColour) {
        warnings.push({
          signal: 'TASK_BLUE_NOT_A_SHORT_TASK',
          slide: index + 1,
          field: 'text',
          message:
            `"${whole.trim().slice(0, 60)}" is marked task-blue and also carries its own colour ` +
            `("${ownColour.trim()}"). A short task takes its blue from the role alone, never a ` +
            'hex: take the `color` off and keep `colorRole: "task-blue"`. If the line is not the ' +
            'child\'s own short task, take both off.'
        });
        return;
      }
      const fault = taskBlueFault(whole, facts);
      if (!fault) return;
      warnings.push({
        signal: 'TASK_BLUE_NOT_A_SHORT_TASK',
        slide: index + 1,
        field: 'text',
        message:
          `"${whole.trim().slice(0, 60)}" is marked task-blue, but ${fault}. ` +
          '`task-blue` is for the child\'s own short task, the job in a few ' +
          'words (`Explain your answer.`), alone or after its question on the ' +
          'same line. A statement, an answer, a sticky fact or an instruction ' +
          'about how to go about the task is not blue: take the role off, or ' +
          'give each short task its own line and each question its own line ' +
          'before it.'
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

// Teach slides take a named layout, and the next Teach slide takes a different one.
//
// 4.2.148 answered "the teaching is one black block" with guidance naming three
// good shapes, and the next deck the plugin made unsupervised put a picture on
// one half and a column of equal cards on the other on every Teach slide. The
// guidance did not lose an argument; it lost to effort, because free zones make
// that one arrangement the cheapest to assemble. `teach-layout` makes every
// arrangement the teacher approved equally cheap, and these two checks are what
// stop a run walking round it: a Teach unit's slide that was built from free
// zones, and two Teach slides in a row sharing an arrangement.
//
// Which slides are Teach slides comes from the lesson design beside lesson.json.
// Without one (a hand-built spec, a fixture) the first check has nothing to read
// and stays quiet, and the repetition check still runs on the layouts named.
const TEACH_KINDS = new Set(['teach', 'teach-why', 'teach-needed']);

function slideUnitIds(slideData) {
  if (!slideData || typeof slideData !== 'object') return [];
  const ids = [];
  if (typeof slideData.designUnitId === 'string') ids.push(slideData.designUnitId);
  if (Array.isArray(slideData.designUnitIds)) {
    slideData.designUnitIds.forEach((id) => { if (typeof id === 'string') ids.push(id); });
  }
  return ids;
}

// The source design decides whether an adjacent reveal is an exact answer.
// Headings are presentation choices and cannot establish that pedagogical fact.
function exactAnswerUnits(jsonPath) {
  const designPath = path.join(path.dirname(jsonPath), 'lesson-design.json');
  if (!fs.existsSync(designPath)) return null;
  let design;
  try {
    design = JSON.parse(fs.readFileSync(designPath, 'utf8'));
  } catch {
    return null;
  }
  const ids = new Set();
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (typeof node.sourceUnitId === 'string' && node.answer &&
        node.answer.kind === 'exact' && node.answer.delivery === 'answer-slide' &&
        !node.answer.structure) {
      ids.add(node.sourceUnitId);
    }
    Object.values(node).forEach(visit);
  };
  visit(design);
  return ids;
}

function revealBlocks(slideData) {
  const blocks = [];
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (node.revealPair) blocks.push(node);
    Object.keys(node).forEach((key) => {
      if (!['speakerNotes', 'notes', 'revealPair'].includes(key)) visit(node[key]);
    });
  };
  visit(slideData);
  return blocks;
}

function answerBearingBlocks(slideData) {
  const found = [];
  const visit = (node) => {
    if (node == null) return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (typeof node !== 'object') return;
    if (node.type === 'text' && String(node.value || node.text || '').includes('||')) found.push(node);
    if ((['numbered-questions', 'question-cards'].includes(node.type) ||
         ['maths-your-turn', 'maths-your-turn-sc'].includes(node.template)) &&
        Array.isArray(node.questions) && node.questions.some((item) =>
      String(typeof item === 'string' ? item : item && item.text || '').includes('||'))) found.push(node);
    Object.keys(node).forEach((key) => {
      if (!['speakerNotes', 'notes'].includes(key)) visit(node[key]);
    });
  };
  visit(slideData);
  return found;
}

function ordinaryRevealWarnings(lesson, jsonPath) {
  const exact = exactAnswerUnits(jsonPath);
  if (!exact) return [];
  const slides = Array.isArray(lesson.slides) ? lesson.slides : [];
  const warnings = [];
  slides.forEach((answer, index) => {
    if (!index) return;
    const answerLeaves = answerBearingBlocks(answer);
    if (!answerLeaves.length) return;
    const question = slides[index - 1];
    const ids = slideUnitIds(answer).filter((id) => exact.has(id) && slideUnitIds(question).includes(id));
    if (!ids.length) return;
    const answerBlocks = revealBlocks(answer);
    const questionBlocks = revealBlocks(question);
    const answerIds = answerBlocks.map((block) => block.revealPair.id);
    const questionIds = questionBlocks.map((block) => block.revealPair.id);
    if (answerLeaves.some((block) => !block.revealPair) ||
        !answerIds.length || answerIds.length !== questionIds.length ||
        answerIds.some((id) => !questionIds.includes(id))) {
      warnings.push({
        signal: 'ORDINARY_REVEAL_UNPAIRED', slide: index + 1, field: 'revealPair',
        message: `source unit ${ids[0]} has an exact answer-slide reveal. Pair every ordinary answer-bearing text or question block with the preceding task slide using matching revealPair ids and opposite states, then keep the static composition unchanged. If the settled source calls for a different model or visual completion, refer that teaching decision to the lesson designer.`
      });
    }
  });
  return warnings;
}

// Every Teach unit in the design beside lesson.json, by id, with whether its
// design carries a script. Null when there is no design to read.
function teachUnits(jsonPath) {
  const designPath = path.join(path.dirname(jsonPath), 'lesson-design.json');
  if (!fs.existsSync(designPath)) return null;
  let design;
  try {
    design = JSON.parse(fs.readFileSync(designPath, 'utf8'));
  } catch {
    return null;
  }
  const units = new Map();
  const visit = (unit) => {
    if (unit && typeof unit === 'object' && TEACH_KINDS.has(unit.kind) &&
        typeof unit.sourceUnitId === 'string') {
      const script = unit.speakerNotes && typeof unit.speakerNotes === 'object'
        ? unit.speakerNotes.script : null;
      units.set(unit.sourceUnitId, { hasScript: typeof script === 'string' && script.trim().length > 0 });
    }
  };
  (Array.isArray(design.teachingSequence) ? design.teachingSequence : []).forEach(visit);
  return units;
}

// Units whose launch sets a good instance beside a weak one, and the headings
// the design gave each side. A launch pair is the one board that tells the class
// which of two things is the better one, and it has a template that draws that:
// the tick, the cross, the red weak card, the two cards at one text size.
// Assembled by hand instead, the same pair came out of three Year 4 decks as two
// plain white boxes with `Strong:` and `Weak:` typed inside the sentences, on a
// different side each time.
function launchPairUnits(jsonPath) {
  const designPath = path.join(path.dirname(jsonPath), 'lesson-design.json');
  if (!fs.existsSync(designPath)) return null;
  let design;
  try {
    design = JSON.parse(fs.readFileSync(designPath, 'utf8'));
  } catch {
    return null;
  }
  const units = new Set();
  (Array.isArray(design.teachingSequence) ? design.teachingSequence : []).forEach((unit) => {
    if (!unit || typeof unit !== 'object' || typeof unit.sourceUnitId !== 'string') return;
    const launch = unit.content && typeof unit.content === 'object' ? unit.content.launch : null;
    if (!launch || typeof launch !== 'object') return;
    const pair = launch.goodLooksLike;
    if (pair && typeof pair === 'object') units.add(unit.sourceUnitId);
  });
  return units;
}

function launchPairWarnings(lesson, jsonPath) {
  const pairUnits = launchPairUnits(jsonPath);
  if (!pairUnits || !pairUnits.size) return [];
  const slides = Array.isArray(lesson.slides) ? lesson.slides : [];
  const drawn = new Set();
  slides.forEach((slideData) => {
    if (!slideData || slideData.template !== 'strong-and-weak') return;
    slideUnitIds(slideData).forEach((id) => drawn.add(id));
  });
  const warnings = [];
  pairUnits.forEach((unit) => {
    if (drawn.has(unit)) return;
    const index = slides.findIndex((slideData) => slideUnitIds(slideData).includes(unit));
    warnings.push({
      slide: index >= 0 ? index + 1 : 1,
      field: 'template',
      signal: 'LAUNCH_PAIR_NEEDS_ITS_TEMPLATE',
      message:
        `${unit} launches its task with a good instance beside a weak one, and no slide ` +
        'carrying that unit is built from "strong-and-weak". That template is what puts ' +
        'the tick on one card and the cross and the red on the other, so a child knows ' +
        'which is which before reading either. Give the pair its own slide before the task ' +
        'slide: strongHeading, strong, weakHeading, weak, and difference as the one line ' +
        'underneath (templates.md, strong-and-weak).'
    });
  });
  return warnings;
}

// The slots on a teach-layout slide that carry teaching a class reads: an
// explanation line, a question, the line to remember, a passage, steps. A
// lead and a picture on their own are a caption under a photograph.
const TEACHING_SLOTS = ['lines', 'question', 'sticky', 'extract', 'steps', 'captions',
  'sides', 'answers', 'speakers', 'columns', 'statement'];

function wordsOf(text) {
  if (typeof text !== 'string') return '';
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function carriesTeaching(slideData) {
  return TEACHING_SLOTS.some((slot) => {
    const value = slideData[slot];
    if (Array.isArray(value)) {
      const titleWords = wordsOf(slideData.title);
      return value.some((item) => {
        const text = item && typeof item === 'object' ? item.value : item;
        return typeof text !== 'string' || !titleWords || wordsOf(text) !== titleWords;
      });
    }
    return value !== undefined && value !== null && value !== '';
  });
}

// A lead that is a whole teaching sentence teaches: a paced Teach run gives
// each thing the class looks at its own slide, and one of those slides can be
// a picture and the one sentence about it (the teacher, 28 September 2026:
// "one slide with this picture ... And then maybe one more slide, then do
// bit"). What stays refused is the label the 14 September repair produced,
// `A Tudor farm household`: a few words with no sentence in them.
function leadIsATeachingSentence(slideData) {
  const lead = slideData.lead && typeof slideData.lead === 'object' ? slideData.lead.value : slideData.lead;
  if (typeof lead !== 'string') return false;
  const text = lead.replace(/\{\{|\}\}/g, '').trim();
  if (!/[.!?]$/.test(text)) return false;
  if (text.split(/\s+/).length < 6) return false;
  const titleWords = wordsOf(slideData.title);
  return !titleWords || wordsOf(text) !== titleWords;
}

function teachLayoutWarnings(lesson, jsonPath) {
  const slides = Array.isArray(lesson.slides) ? lesson.slides : [];
  const warnings = [];
  const teachIds = teachUnits(jsonPath);
  const catalogue = Object.keys(LAYOUTS).join(', ');

  if (teachIds && teachIds.size) {
    slides.forEach((slideData, index) => {
      if (!slideData || slideData.template === 'teach-layout') return;
      const unit = slideUnitIds(slideData).find((id) => teachIds.has(id));
      if (!unit) return;
      warnings.push({
        slide: index + 1,
        field: 'template',
        signal: 'TEACH_SLIDE_NEEDS_TEACH_LAYOUT',
        message:
          `this slide carries the Teach unit ${unit} but is built from "${slideData.template}". ` +
          'A Teach slide uses template "teach-layout" with a named layout, so its words are ' +
          'centred, its cards match in size and the deck does not settle into one arrangement. ' +
          `Choose the layout whose shape fits what this slide holds (templates.md, teach-layout): ${catalogue}.`
      });
    });

    // A Teach unit that spans two slides is one beat the layout had to divide,
    // and both halves are still teaching. On 14 September 2026 a Year 4
    // history beat was divided into a photograph with the label `A Tudor farm
    // household` and, on the next slide, every word with no picture and no
    // notes; the teacher met the first half and had nothing to teach from.
    // So each half carries teaching the class reads, and each carries the
    // words the teacher says for what it shows (slide-composition-playbook.md,
    // Space-pressure order, and the Slide Designer's script rule).
    const slidesByUnit = new Map();
    slides.forEach((slideData, index) => {
      slideUnitIds(slideData).forEach((id) => {
        if (!teachIds.has(id)) return;
        if (!slidesByUnit.has(id)) slidesByUnit.set(id, []);
        slidesByUnit.get(id).push(index);
      });
    });
    slides.forEach((slideData, index) => {
      if (!slideData) return;
      const unit = slideUnitIds(slideData).find((id) => teachIds.has(id));
      if (!unit) return;
      const notes = slideData.speakerNotes;
      if (teachIds.get(unit).hasScript && !(typeof notes === 'string' && notes.trim())) {
        warnings.push({
          slide: index + 1,
          field: 'speakerNotes',
          signal: 'TEACH_SLIDE_WITHOUT_ITS_SCRIPT',
          message:
            `this slide carries the Teach unit ${unit}, whose design has a script, and its speakerNotes ` +
            'are empty. A teacher stands in front of every slide of a Teach beat, so when the beat ' +
            'spans more than one slide the script is cut where the slides cut and each slide carries ' +
            'the words for what it shows. Move the sentences that teach this slide into its speakerNotes.'
        });
      }
      if (slideData.template === 'teach-layout') {
        const titleWords = wordsOf(slideData.title);
        ['lead', 'lines', 'question'].forEach((slot) => {
          const items = Array.isArray(slideData[slot]) ? slideData[slot] : [slideData[slot]];
          items.forEach((item, position) => {
            const text = item && typeof item === 'object' ? item.value : item;
            if (typeof text !== 'string' || !titleWords || wordsOf(text) !== titleWords) return;
            warnings.push({
              slide: index + 1,
              field: Array.isArray(slideData[slot]) ? `${slot}[${position}]` : slot,
              signal: 'TEACH_LINE_REPEATS_TITLE',
              message:
                `this card says the slide's own title again ("${text}"). A title is a heading, not teaching, ` +
                'and a layout that needs a line is not filled by repeating it: on 22 September 2026 a repair moved ' +
                'a portrait slide to lead-picture-lines and put the title in the line, so the class read the question ' +
                'twice and no teaching. Put a sentence of the unit\'s explanation here, or choose a layout that ' +
                'does not need this slot.'
            });
          });
        });
      }
      if (slideData.template === 'teach-layout' && slidesByUnit.get(unit).length > 1 &&
          !carriesTeaching(slideData) && !leadIsATeachingSentence(slideData)) {
        warnings.push({
          slide: index + 1,
          field: 'layout',
          signal: 'TEACH_SPLIT_LEAVES_A_LABEL',
          message:
            `this slide is one part of the Teach unit ${unit} and carries only a picture and a lead line. ` +
            'That is a photograph with a caption, not teaching: a teacher who has not read the notes ' +
            'has nothing to say from it. Split a Teach beat where its teaching turns (the scene set ' +
            'on one slide, the look and the landed sentence on the next), keep the picture on both ' +
            'halves, and give each half at least one explanation line, question or line to remember.'
        });
      }
    });
  }

  let previous = null;
  slides.forEach((slideData, index) => {
    if (!slideData || slideData.template !== 'teach-layout') return;
    const units = slideUnitIds(slideData);
    if (previous && previous.layout === slideData.layout &&
        !(units.length && units.some((id) => previous.units.includes(id)))) {
      warnings.push({
        slide: index + 1,
        field: 'layout',
        signal: 'TEACH_LAYOUT_REPEATED',
        message:
          `this Teach slide uses "${slideData.layout}", the same layout as the Teach slide before it ` +
          `(slide ${previous.slide}). Consecutive Teach slides take different layouts so the ` +
          'lesson does not look like one slide repeated; more than one layout fits almost any ' +
          'set of words and pictures. Slides that carry the same unit may share one.'
      });
    }
    previous = { layout: slideData.layout, units, slide: index + 1 };
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

// Stands in for a teach-layout slide the check refused, so the rest of the deck
// can be checked and drawn. It keeps the slide's unit so unit-level checks read
// the deck as it will be, and says plainly on the page what it is.
function teachLayoutPlaceholder(slide) {
  const placeholder = {
    template: 'split-v-60-40',
    title: 'Check this slide',
    primary: { type: 'text', value: 'This slide’s teach layout was refused.' },
    secondary: { type: 'text', value: 'The check names the fix.' },
  };
  if (slide && typeof slide === 'object') {
    for (const key of ['designUnitId', 'designUnitIds']) {
      if (slide[key] !== undefined) placeholder[key] = slide[key];
    }
  }
  return placeholder;
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
  // Read against the slides as written, before teach layouts become ordinary slides.
  const teachLayout = teachLayoutWarnings(lesson, jsonPath);
  const launchPair = launchPairWarnings(lesson, jsonPath);
  // A teach layout that cannot be expanded used to end the check on the spot,
  // so every other fault in the deck waited for the next run: slide designers
  // met their faults one run at a time and spent their repair passes doing it
  // (29 September 2026, four runs out of four). Each refused layout is now
  // reported with its slide number, a plain placeholder stands in for it, and
  // the rest of the deck is checked and built as normal.
  const expandedEach = expandTeachLayoutsEach(lesson);
  const teachRefused = expandedEach.errors;
  const teachRefusedSlides = new Set(teachRefused.map((item) => item.slide));
  let buildJsonPath = jsonPath;
  let placeholderPath = null;
  if (teachRefused.length) {
    const standIn = lesson.slides.map((slide, index) =>
      teachRefusedSlides.has(index + 1) ? teachLayoutPlaceholder(slide) : slide
    );
    placeholderPath = path.join(
      path.dirname(jsonPath),
      `.${path.basename(jsonPath)}.teach-check-${process.pid}.json`
    );
    try {
      fs.writeFileSync(placeholderPath, JSON.stringify({ ...lesson, slides: standIn }));
      buildJsonPath = placeholderPath;
    } catch {
      placeholderPath = null;
    }
    lesson = {
      ...expandedEach.lesson,
      slides: expandedEach.lesson.slides.map((slide, index) =>
        slide === null ? teachLayoutPlaceholder(lesson.slides[index]) : slide
      ),
    };
  } else {
    lesson = expandedEach.lesson;
  }
  // A placeholder carries none of its slide's words, so a vocabulary card
  // beside one would be judged against a page that is not the lesson's.
  const onRefusedTeachSlide = (warning) =>
    !!warning &&
    (teachRefusedSlides.has(warning.slide) ||
      (/^VOCAB_CARD_/.test(warning.signal || '') &&
        (teachRefusedSlides.has(warning.slide + 1) || teachRefusedSlides.has(warning.slide - 1))));
  const optionalPictures = countOptionalPictures(lesson);
  // Only a capacity warning that is not a cue refuses a candidate. The
  // criteria cue (six steps, or 320 characters) is a cue to look, never a
  // fault, by the teacher's decisions of 10 and 23 September 2026, and it used
  // to refuse here although BLOCKING_CAPACITY_SIGNALS left it out: every long
  // list in his style cost the slide designer its repair passes. It is printed
  // as a note beside the result instead, pass or fail.
  const capacityAll = capacityWarnings(lesson).filter((warning) => !onRefusedTeachSlide(warning));
  const capacity = capacityAll.filter((warning) => !warning.cue);
  const cueNotes = capacityAll
    .filter((warning) => warning.cue)
    .map((warning) => `  note: slide ${warning.slide} ${warning.field}: ${warning.signal}: ${warning.message}`);
  const pictures = pictureWarnings(lesson);
  const presentationAll = teachLayout
    .concat(launchPair)
    .concat(ordinaryRevealWarnings(lesson, jsonPath))
    .concat(presentationWarnings(lesson))
    .concat(turnWarnings(lesson))
    .concat(consecutiveModellingWarnings(lesson))
    .concat(sharedModelWarnings(lesson))
    .concat(mixedBlockWarnings(lesson))
    .concat(blueStatementWarnings(lesson))
    .concat(taskBlueWarnings(lesson, jsonPath))
    .concat(starterColourWarnings(lesson))
    .concat(stickyEmphasisWarnings(lesson))
    .concat(pictures)
    .concat(repeatedLineWarnings(lesson))
    .concat(vocabCardBeforeItsWord(lesson))
    .filter((warning) => !onRefusedTeachSlide(warning) || teachLayout.includes(warning) || launchPair.includes(warning));
  // A settled deck is checked by the slide decorator, and by the orchestrator
  // after it. Composition is closed to the decorator, so a wording, title or
  // layout fault the slide designer's round left is not its to mend, and
  // failing on one cost the whole deck its drawings (release 7A's first check:
  // a slide titled only "Practise"). With `settled`, those print as notes; a
  // fault the decorator's own layer can cause (a picture drawn twice on one
  // slide) and anything the scratch build refuses still fail.
  const presentation = options.settled
    ? presentationAll.filter((warning) => pictures.includes(warning))
    : presentationAll;
  const settledNotes = options.settled
    ? presentationAll
      .filter((warning) => !pictures.includes(warning))
      .map((warning) => `  note: slide ${warning.slide} ${warning.field}: ${warning.signal}: ${warning.message}`)
    : [];

  // What the spec alone shows is reported WITH what the build shows, never
  // instead of it.
  //
  // These rules used to return before the scratch build ran, and the build
  // stopped at its own first stage too, so each run showed one layer of faults:
  // a designer fixed the wording, met the layout faults, fixed those, and only
  // then met the text that did not fit. On a Year 4 rounding deck (16 September
  // 2026) the last layer arrived after the repair passes were spent, eleven
  // slides at once, and the whole deck was withheld. The build takes about two
  // seconds, so every stage runs and every fault is listed in one go.
  const early = { stdout: '', stderr: '', reason: null };
  if (teachRefused.length) {
    early.reason = 'TEACH_LAYOUT_INVALID';
    early.stdout += teachRefused
      .map((item) => `BUILD_DIAGNOSTIC: ${JSON.stringify({
        signal: 'TEACH_LAYOUT_INVALID', artifact: 'slides', faultClass: 'composition',
        location: { slide: item.slide }, message: item.message
      })}`)
      .join('\n') + '\n';
    early.stderr +=
      `\n${teachRefused.length} teach layout(s) refused (fix the layout's slots, ` +
      'or choose a layout these slots fit; the placeholder page in the preview marks each one):\n' +
      teachRefused.map((item) => `  x TEACH_LAYOUT_INVALID: ${item.message}`).join('\n') +
      '\n';
  }
  if (capacity.length) {
    early.reason = early.reason || 'SLIDE_DESIGN_CAPACITY';
    early.stdout += `${capacity.map(buildDiagnostic).join('\n')}\n`;
    early.stderr +=
      `\n${capacity.length} slide-design composition problem(s):\n` +
      capacity
        .map(
          (warning) =>
            `  ✗ slide ${warning.slide} ${warning.field}: ` +
            `${warning.signal}: ${warning.message}`
        )
        .join('\n') +
      '\n';
  }
  if (presentation.length) {
    early.reason = early.reason || 'SLIDE_DESIGN_PRESENTATION';
    early.stdout += `${presentation.map(presentationDiagnostic).join('\n')}\n`;
    early.stderr +=
      `\n${presentation.length} slide-design presentation problem(s):\n` +
      presentation
        .map(
          (warning) =>
            `  x slide ${warning.slide} ${warning.field}: ` +
            `${warning.signal}: ${warning.message}`
        )
        .join('\n') +
      '\n';
  }
  if (early.reason) {
    early.stderr +=
      'The scratch build ran as well, so anything else it found is listed with ' +
      'these. Repair what every line names, then run the check again.\n';
  }

  // Folds the spec-only faults into whatever the build reported. The reason
  // stays the earliest stage that failed, which is the one callers already
  // route on; the build's own faults come through in its output beside them.
  const withEarly = (result) => {
    if (!early.reason || !result) return result;
    const merged = {
      ...result,
      ok: false,
      reason: early.reason,
      stdout: `${early.stdout}${result.stdout || ''}`,
      stderr: `${early.stderr}${result.stderr || ''}`,
    };
    delete merged.previewDir;
    delete merged.previewOutputPath;
    return merged;
  };

  let scratchDir;
  try {
    scratchDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'lesson-resources-slide-design-check-')
    );
  } catch (error) {
    return withEarly({
      ok: false,
      reason: 'SCRATCH_DIRECTORY_FAILED',
      slideCount,
      stdout: '',
      stderr: `Could not create the slide-design scratch directory: ${error.message}\n`,
      scratchOutputPath: null,
    });
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
        buildJsonPath,
        scratchDir,
        "--design-preview",
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

            if (options.retainPreview && !early.reason) {
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

    // A check that fails still keeps the pages it drew, when a preview was
    // asked for. One refused slide used to stop the whole preview, so the
    // slide designer of a Year 4 PSHE deck repaired a panel three passes
    // running without seeing a page (27 September 2026). The pages go under
    // their own names, never `previewDir`, so nothing promotes a deck the
    // check refused; the refused slides carry a "check this slide" note.
    if (options.retainPreview && outcome && (!outcome.ok || early.reason) && !outcome.previewDir) {
      const partialLine = childStdout
        .split(/\r?\n/)
        .find((line) => line.startsWith('PARTIAL_PREVIEW: ') || line.startsWith('Wrote: '));
      const drawnPath = partialLine
        ? path.resolve(partialLine.slice(partialLine.indexOf(':') + 1).trim())
        : null;
      if (drawnPath && pathIsInside(drawnPath, scratchDir) && fs.existsSync(drawnPath)) {
        try {
          const partialDir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'lesson-resources-slide-preview-refused-')
          );
          const partialPath = path.join(partialDir, path.basename(drawnPath));
          fs.copyFileSync(drawnPath, partialPath);
          outcome.partialPreviewDir = partialDir;
          outcome.partialPreviewOutputPath = partialPath;
        } catch {
          // The pages are a convenience while repairing; the check's verdict
          // stands without them.
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
      if (placeholderPath) fs.rmSync(placeholderPath, { force: true });
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

  // A flagged deck is settled: its repair round could not clear some slides,
  // it ships with them flagged, and the slide decorator still owes the other
  // slides their drawings. The decorator's preview used to fail on the flagged
  // slides themselves, so a flagged deck got no drawings at all. When every
  // fault the check found sits on a slide the build already flagged, the drawn
  // pages (those slides carrying their "check this slide" note) are the
  // preview. A fault anywhere else still fails, as does a fault with no slide.
  let flaggedNotes = [];
  if (
    options.flaggedSlides &&
    outcome &&
    (!outcome.ok || early.reason) &&
    outcome.partialPreviewOutputPath
  ) {
    const faults = parseBuildDiagnostics(`${early.stdout}${outcome.stdout || ''}`);
    const allFlagged =
      faults.length > 0 &&
      faults.every((d) => d && d.location && options.flaggedSlides.has(d.location.slide));
    if (allFlagged) {
      flaggedNotes = faults.map(
        (d) => `  note: slide ${d.location.slide}: ${d.signal}: flagged for the teacher; it takes no drawing`
      );
      early.reason = null;
      outcome = {
        ...outcome,
        ok: true,
        reason: null,
        stdout: String(outcome.stdout || '')
          .split(/\r?\n/)
          .filter((line) => !line.startsWith('BUILD_DIAGNOSTIC: ') && !line.startsWith('PARTIAL_PREVIEW: '))
          .join('\n'),
        previewDir: outcome.partialPreviewDir,
        previewOutputPath: outcome.partialPreviewOutputPath,
      };
      delete outcome.partialPreviewDir;
      delete outcome.partialPreviewOutputPath;
    }
  }

  outcome = withEarly(outcome);
  if (outcome && flaggedNotes.length) {
    outcome.stderr =
      `\n${flaggedNotes.length} fault(s) on the flagged slides, which ship as they are:\n` +
      `${flaggedNotes.join('\n')}\n${outcome.stderr || ''}`;
  }
  if (outcome && settledNotes.length) {
    outcome.stderr =
      `\n${settledNotes.length} note(s) on a settled deck, the slide designer's to mend and ` +
      `never a reason to withhold its drawings:\n${settledNotes.join('\n')}\n${outcome.stderr || ''}`;
  }
  if (outcome && cueNotes.length) {
    outcome.stderr =
      `\n${cueNotes.length} slide-design note(s), a cue to look and never a fault:\n` +
      `${cueNotes.join('\n')}\n${outcome.stderr || ''}`;
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
  const settled = argv.includes('--settled');
  const args = [];
  let photoRequirementsPath = null;
  let photoRequirementsFlagSeen = false;
  let flaggedSlides = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    // `--deliver-flagged` is what the build calls a flagged deck; here the
    // slide numbers do the work, so the word alone changes nothing.
    if (arg === '--preview' || arg === '--settled' || arg === '--deliver-flagged') continue;
    if (arg === '--flagged-slides') {
      const next = argv[index + 1] || '';
      const numbers = next.replace(/\s/g, '').split(',').filter(Boolean);
      if (!numbers.length || numbers.some((part) => !/^\d+$/.test(part))) {
        console.error(
          '--flagged-slides takes the slide numbers the build flagged, separated by commas ' +
            `(as its SLIDES_FLAGGED: line names them), not ${JSON.stringify(next)}`
        );
        return 1;
      }
      flaggedSlides = new Set(numbers.map(Number));
      index += 1;
      continue;
    }
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
        '[--photo-requirements <photo-requirements.json>] [--preview] [--settled] ' +
        '[--flagged-slides <n,n>]'
    );
    return 1;
  }
  if (flaggedSlides && !(preview && settled)) {
    console.error('--flagged-slides is for previewing a settled, flagged deck: use it with --preview --settled.');
    return 1;
  }

  const result = runSlideDesignCheck(args[0], {
    retainPreview: preview,
    photoRequirementsPath,
    settled,
    flaggedSlides,
  });
  writeText(process.stdout, result.stdout);
  writeText(process.stderr, result.stderr);
  if (preview && !settled) keepAttempt(args[0], result);

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

  if (result.partialPreviewOutputPath) {
    console.log(`SLIDE_DESIGN_REFUSED_PREVIEW: ${result.partialPreviewOutputPath}`);
  }
  console.error(`SLIDE_DESIGN_CHECK_FAILED: ${result.reason}`);
  return 1;
}

// Each attempt the designer checks is kept beside its lesson, with what the
// check said about it. A designer rewrites one candidate file as it repairs, so
// the first attempt and its refusals were gone by the end of every run, and
// "what would have saved this run a repair" could not be answered from the run
// itself: ten runs on 4 October 2026 left nothing to replay. Evidence only.
// Nothing reads these files during a lesson, and a folder that cannot be
// written never stops the check.
function keepAttempt(candidatePath, result) {
  try {
    const folder = path.join(path.dirname(path.resolve(candidatePath)), 'slide-attempts');
    fs.mkdirSync(folder, { recursive: true });
    const taken = fs.readdirSync(folder)
      .map((name) => /^attempt-(\d+)\.json$/.exec(name))
      .filter(Boolean)
      .map((found) => Number(found[1]));
    const number = String((taken.length ? Math.max(...taken) : 0) + 1).padStart(2, '0');
    fs.copyFileSync(candidatePath, path.join(folder, `attempt-${number}.json`));
    const verdict = result.ok
      ? `SLIDE_DESIGN_CHECK_OK: ${result.slideCount} slides`
      : `SLIDE_DESIGN_CHECK_FAILED: ${result.reason}`;
    fs.writeFileSync(
      path.join(folder, `attempt-${number}.check.txt`),
      [verdict, String(result.stdout || ''), String(result.stderr || '')].join('\n'),
      'utf8'
    );
  } catch (err) {
    // Keeping evidence is never a reason to fail a check.
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  BLOCKING_CAPACITY_SIGNALS,
  presentationWarnings,
  countOptionalPictures,
  optionalPictureLine,
  ordinaryRevealWarnings,
  buildDiagnostic,
  main,
  parseBuildDiagnostics,
  pathIsInside,
  repeatedLineWarnings,
  vocabCardBeforeItsWord,
  runSlideDesignCheck,
  stripScratchWroteLine,
};
