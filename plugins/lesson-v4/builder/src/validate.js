'use strict';

// Pre-build check of a lesson.json slide spec.
//
// The renderer fails soft by design: an unknown template renders a red placeholder
// mid-deck, an invented photo path becomes a grey box or a silent clean gap, a
// vocab entry in the old flat shape drops its visual, and an answer slide without
// its `||` markers prints the answers small and black. Each of those reaches the
// teacher as a finished-looking deck with something quietly wrong inside it. This
// check runs before any rendering and turns that whole class of silent failures
// into loud, plain-English problems while the spec is still cheap to fix.
//
// Called by build.js on every build, and runnable standalone at spec time via
// scripts/check-lesson.js. The slide-designer's final gate is
// scripts/check-slide-design.js, which reaches this validation through build.js
// before reporting done.
// Photo files may legitimately not exist yet at spec time because the picture stage
// runs in parallel, so a photo path passes when the file exists OR
// photo-requirements.json promises it; only a path nobody promised is an error.
//
// Keep every message plain English, say what the child/teacher would see go
// wrong, and end with how to fix it — the reader is often the slide-designer
// mid-run or the teacher reading a build report.

const fs = require('fs');
const path = require('path');
const { TEMPLATES } = require('./templates');
const { normalizeLocalPath } = require('./images/resolve');
const { sixSevenNumbers, sixSevenMessage } = require('../../shared/text/no-six-seven');
const {
  inspectDecorations,
  withoutDecorations,
} = require("../../shared/decorations");
const {
  EDUCATIONAL_SVG_ID_RE,
  confinedEducationalSvgPngPath,
  validateSemanticEducationalSvgVisual,
} = require("../../shared/educational-svg-asset");
const {
  isVocabularySurface,
  forEachVocabularyEntry,
} = require("./decorations");
const {
  SUCCESS_CRITERIA_HELPER_KEYS,
  isSuccessCriteriaHelperKey
} = require('../../shared/visuals/success-criteria-helper-catalogue');
const {
  CATEGORY_COLOUR_KEYS,
  CATEGORY_COLOUR_BLOCKED_TYPES,
  categoryColourFor
} = require('./category-colours');
const {
  presentationText,
  validatePresentationSpec
} = require('./presentation-text');
const { MIN_FONT_PT } = require('./styles');

// Walk every nested object/array and call fn(value) for each value stored
// under the given key, wherever it sits (body, stacks, rows, insets, vocab).
function forEachValue(node, key, fn) {
  if (Array.isArray(node)) {
    node.forEach((item) => forEachValue(item, key, fn));
    return;
  }
  if (!node || typeof node !== 'object') return;
  Object.keys(node).forEach((k) => {
    if (k === key) fn(node[k], node);
    forEachValue(node[k], key, fn);
  });
}

// Every string value anywhere in the slide object.
function collectStrings(node, out) {
  out = out || [];
  if (typeof node === 'string') { out.push(node); return out; }
  if (Array.isArray(node)) { node.forEach((v) => collectStrings(v, out)); return out; }
  if (node && typeof node === 'object') {
    Object.keys(node).forEach((k) => collectStrings(node[k], out));
  }
  return out;
}

// A `fontSize` a designer sets is a CEILING: the size the text starts at before
// the build's fit pass shrinks it to whatever its box will hold. So a ceiling at
// or below the projection floor is not a small size, it is no room at all - the
// fit pass has nowhere to shrink to, and the first line that runs a word long
// fails the build outright instead of settling a point or two smaller.
//
// This is caught here, against the specification, because the alternative is
// finding it after a scratch build as a text-overflow on a box whose words look
// perfectly reasonable, which says nothing about the ceiling that caused it.
function validateFontCeilings(slide, slideNumber, errors) {
  forEachValue(slide, 'fontSize', (value, owner) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return;
    if (value > MIN_FONT_PT) return;

    const text = presentationText(owner);
    const shown = text == null ? '' : ` ("${String(text).slice(0, 40)}")`;

    errors.push(
      `slide ${slideNumber}: fontSize ${value} is at or below the ${MIN_FONT_PT}pt ` +
      `projection floor${shown}, so this text has no room to shrink and the ` +
      `build fails on the first line that will not fit. A fontSize is the size ` +
      `text starts at, not the size it ends at: set the ceiling you would like ` +
      `it to reach and let the fit pass bring it down, or give the text a zone ` +
      `that holds it.`
    );
  });
}

// The starter header prints the word "Date" as a blank for the class to write
// beside. A deck is built days before it is taught, so a designer who fills that
// blank in the spec puts the wrong day on the board: a Year 4 rounding deck built
// on a Saturday opened with "Saturday 12 September 2026" in the instruction box,
// under the header's own empty Date label.
//
// Only today's date is refused, so a date that is the lesson's own content - a year
// on a timeline, a date in a source or a word problem - is never touched: a
// historical date cannot match the day the build is running.
function buildDateForms(now) {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const d = now || new Date();
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  const k = day % 100, j = day % 10;
  const suffix = (k >= 11 && k <= 13) ? 'th' : (j === 1 ? 'st' : j === 2 ? 'nd' : j === 3 ? 'rd' : 'th');

  const weekdays = [DAYS[d.getDay()], DAYS[d.getDay()].slice(0, 3)];
  const months = [MONTHS[month], MONTHS[month].slice(0, 3)];
  const days = [String(day), `${day}${suffix}`];
  const pad = (n) => String(n).padStart(2, '0');

  const forms = new Set([
    `${year}-${pad(month + 1)}-${pad(day)}`,
    `${pad(day)}/${pad(month + 1)}/${year}`,
    `${day}/${month + 1}/${year}`,
  ]);
  months.forEach((mo) => days.forEach((da) => {
    forms.add(`${da} ${mo} ${year}`);
    weekdays.forEach((wd) => forms.add(`${wd} ${da} ${mo} ${year}`));
  }));
  return [...forms];
}

function validateNoBuildDate(lesson, errors, now) {
  const forms = buildDateForms(now);
  const seen = new Set();
  collectStrings(lesson).forEach((s) => {
    const hit = forms.find((f) => s.includes(f));
    if (!hit || seen.has(hit)) return;
    seen.add(hit);
    errors.push(
      `the spec carries today's date ("${hit}"), which is the day this deck was ` +
      `built and not the day it will be taught. The starter header already prints ` +
      `the word "Date" as a blank for the class to write beside, so remove the ` +
      `date from the spec entirely: from the starter's "instruction", from any ` +
      `title or body text, and from a top-level "date" field, which the builder ` +
      `does not read. See templates.md §1.4.`
    );
  });
}

function validatePresentationFields(slide, slideNumber, errors) {
  const checked = new Set();

  function check(owner) {
    if (!owner || typeof owner !== 'object' || Array.isArray(owner)) return;
    if (checked.has(owner)) return;
    checked.add(owner);

    const value = presentationText(owner);
    if (value == null) {
      errors.push(
        `slide ${slideNumber}: colorRole/emphasis is attached to an object ` +
        `with no text or value string — presentation roles must style existing ` +
        `visible wording.`
      );
      return;
    }

    const problem = validatePresentationSpec(value, owner);
    if (problem) {
      errors.push(`slide ${slideNumber}: ${problem}.`);
    }
  }

  forEachValue(slide, 'colorRole', (_value, owner) => check(owner));
  forEachValue(slide, 'emphasis', (_value, owner) => check(owner));
}

// Read the exact frozen contract when the caller supplies
// PHOTO_REQUIREMENTS_PATH. Fall back to the sibling contract only for legacy,
// hand-made and isolated validation calls. A missing sibling file stays a warning
// route. A missing or invalid explicitly named contract is a blocking input fault.
function readPromisedPhotos(lessonDir) {
  const promised = new Set();
  const explicitPath =
    typeof process.env.PHOTO_REQUIREMENTS_PATH === 'string'
      ? process.env.PHOTO_REQUIREMENTS_PATH.trim()
      : '';
  const reqPath = explicitPath
    ? path.resolve(explicitPath)
    : path.join(lessonDir, 'photo-requirements.json');

  if (!fs.existsSync(reqPath)) {
    return {
      promised: explicitPath ? new Set() : null,
      error: explicitPath
        ? `PHOTO_REQUIREMENTS_NOT_FOUND: exact frozen contract not found: ${reqPath}`
        : null,
    };
  }

  try {
    const req = JSON.parse(fs.readFileSync(reqPath, 'utf8'));
    const photos = Array.isArray(req.photos) ? req.photos : [];
    photos.forEach((photo) => {
      if (photo && typeof photo.filename === 'string') {
        promised.add(photo.filename);
        promised.add(path.basename(photo.filename));
      }
    });
  } catch (error) {
    return {
      promised,
      error: explicitPath
        ? `PHOTO_REQUIREMENTS_INVALID: exact frozen contract is not valid JSON: ${reqPath}`
        : null,
    };
  }

  return { promised, error: null };
}

function validateLesson(lesson, lessonDir) {
  const errors = [];
  const warnings = [];
  const slides = Array.isArray(lesson.slides) ? lesson.slides : null;

  if (!slides || slides.length === 0) {
    errors.push('the spec has no slides: the "slides" array is missing or empty.');
    return { errors, warnings };
  }
  if (!lesson.lessonName) {
    warnings.push('no "lessonName" in the spec — the file will be called "Untitled Lesson.pptx".');
  }

  validateNoBuildDate(lesson, errors);
  const sixSeven = sixSevenNumbers(withoutDecorations(lesson));
  if (sixSeven.length) errors.push(sixSevenMessage(sixSeven, 'deck'));

  const photoContract = readPromisedPhotos(lessonDir);
  const promised = photoContract.promised;
  if (photoContract.error) errors.push(photoContract.error);

  slides.forEach((rawSlide, i) => {
    const n = i + 1;
    const slide = withoutDecorations(rawSlide);
    const decorationCheck = inspectDecorations(rawSlide && rawSlide.decorations, {
      surface: "slide",
      supported: !isVocabularySurface(rawSlide),
      baseDir: lessonDir,
      label: `slide ${n}`,
    });
    warnings.push(...decorationCheck.warnings);

    const tpl = slide && slide.template;

    if (!slide || typeof slide !== 'object' || !tpl) {
      errors.push(`slide ${n}: no "template" field — the builder cannot render it.`);
      return;
    }
    if (!TEMPLATES[tpl]) {
      errors.push(`slide ${n}: unknown template "${tpl}" — it would render as a red placeholder in the middle of the deck. Check the name against templates.md.`);
      return;
    }

    validatePresentationFields(slide, n, errors);
    validateFontCeilings(slide, n, errors);

    // Invented photo paths: the picture stage never obtains a file nobody promised, so
    // the slide would show a grey box (essential) or a silent gap (non-essential).
    forEachValue(slide, 'imagePath', (p, owner) => {
      if (typeof p !== 'string' || !p) return;
      // An absolute path is already the whole answer. Joining it onto the lesson
      // folder produced a path that never exists, so every absolute image was
      // reported as missing while the file sat right there, and the one check
      // that could have caught a picture going astray cried wolf on all of them.
      const local = normalizeLocalPath(p);
      const onDisk = fs.existsSync(
        path.isAbsolute(local) ? local : path.join(lessonDir, local)
      );
      // An Educational SVG context picture is a nice-to-have local asset. If the optional
      // search could not run, its request stays in the spec without imagePath,
      // or an old path may be absent. Neither case may block the lesson.
      if (!onDisk && owner && owner.kind === 'educational-svg') return;
      // An optional photo is allowed to vanish quietly, because a photo the lesson
      // can live without should leave clean slide rather than a grey box. That only
      // holds while nothing else on the slide is relying on it. A caption is the
      // visible sign that something does: the words stay on the board describing a
      // picture that is not there, and the class is asked to look at nothing. So the
      // absence stops being cosmetic and has to be said out loud.
      if (!onDisk && owner && owner.essential === false && owner.caption) {
        warnings.push(`slide ${n}: optional image "${p}" was not sourced, but its caption "${owner.caption}" stays on the slide and describes it — the class would be asked to look at a picture that isn't there. Source the photo, or drop the caption with it.`);
      }
      if (onDisk) return;
      if (promised) {
        const isPromised = promised.has(p) || promised.has(path.basename(p));
        if (!isPromised) {
          errors.push(`slide ${n}: image "${p}" is not promised in photo-requirements.json and no such file exists — the slide would render with a grey box where the picture should be. Use a filename from photo-requirements.json, or flag the missing entry instead of inventing one.`);
        }
      } else {
        warnings.push(`slide ${n}: image "${p}" does not exist and there is no photo-requirements.json here — the slide will show a grey box unless the file is added.`);
      }
    });

    // The old flat vocab shape is silently ignored by the template — the word
    // renders with no visual and nobody is told.
    if (tpl === 'key-vocabulary' && Array.isArray(slide.words)) {
      slide.words.forEach((w) => {
        if (!w || typeof w !== 'object') return;
        if (('emoji' in w || 'imagePath' in w) && !w.visual) {
          errors.push(`slide ${n}: vocab word "${w.word || '?'}" uses the old flat shape (emoji/imagePath at the top level) — the template ignores those keys and silently drops the visual. Use visual: { "type": "<a supported key-vocabulary visual>", ... }.`);
        }
      });
    }

    forEachVocabularyEntry(slide, (entry, location) => {
      const semantic = validateSemanticEducationalSvgVisual(
        entry.visual,
        lessonDir,
        `slide ${n} ${location} "${entry.word || "?"}"`
      );
      if (semantic.error) errors.push(semantic.error);
    });

    // A speaker relabelled "You" points the claim back at the reader instead of
    // at a character — the design's named speaker must survive to the slide.
    if (/^speech-bubbles-\d$/.test(tpl)) {
      forEachValue(slide, 'name', (v) => {
        if (typeof v === 'string' && v.trim().toLowerCase() === 'you') {
          errors.push(`slide ${n}: a speech-bubble speaker is named "You" — every speaker is Mr Sear, Miss Brooker, Bailey, or the design's named child (see references/slide-speech-and-characters.md).`);
        }
      });
    }

    // The *-sc criteria slot already prints the "✓ Success Criteria" heading and
    // draws the green box, so a heading or sc-panel inside it shows the label twice.
    if (/-sc$/.test(tpl) && slide.criteria && typeof slide.criteria === 'object') {
      if (typeof slide.criteria.heading === 'string' && /success criteria/i.test(slide.criteria.heading)) {
        warnings.push(`slide ${n}: the criteria object carries a "${slide.criteria.heading}" heading inside a *-sc slot that already prints one — the label will appear twice. Leave the object's heading blank.`);
      }
      if (slide.criteria.type === 'sc-panel') {
        warnings.push(`slide ${n}: an sc-panel inside a ${tpl} criteria slot draws the green box twice — pass the criteria content directly; sc-panel is only for free-template zones.`);
      }
    }

    // Success Criteria Helpers are a deliberately small, stable part of the
    // shared visual catalogue. A mistyped
    // key must not degrade to an unexplained blank beside a criterion, and the
    // object form needs visible text: the figure supports the instruction; it
    // never replaces it.
    forEachValue(slide, 'steps', (steps) => {
      if (!Array.isArray(steps)) return;
      steps.forEach((step, stepIndex) => {
        // The steps helper draws its own number badge, so a written ordinal
        // at the front of the text prints twice: a child reads "1 stage 1:
        // Say it or show it". The friendships deck of 30 August 2026 shipped
        // exactly that on slides 8 and 9. The check catches "step N"/"stage N"
        // prefixes and bare "1." / "(1)" ordinals; a step that merely begins
        // with a number ("10 ones become 1 ten") is untouched.
        const stepText = typeof step === 'string'
          ? step
          : (step && typeof step === 'object' && !Array.isArray(step) ? step.text : null);
        if (
          typeof stepText === 'string' &&
          /^\s*(?:(?:step|stage)\s*\d+\s*[-:.)]|\(\d+\)|\d+[).:](?=\s))/i.test(stepText)
        ) {
          errors.push(`slide ${n}: step ${stepIndex + 1} begins "${stepText.slice(0, 24)}..." - the steps helper numbers each step itself, so a written "step N"/"stage N"/"1." prefix prints twice. Start the step at its first real word.`);
        }
        if (!step || typeof step !== 'object' || Array.isArray(step)) return;
        if (typeof step.text !== 'string' || !step.text.trim()) {
          errors.push(`slide ${n}: step ${stepIndex + 1} uses the object form but has no readable "text" - write { "text": "...", "helper": "..." } so the instruction cannot disappear.`);
        }
        if (step.helper != null && step.figure != null && step.helper !== step.figure) {
          errors.push(`slide ${n}: step ${stepIndex + 1} gives two different Success Criteria Helpers in "helper" and legacy "figure" - keep only "helper".`);
        }
        const helper = step.helper != null ? step.helper : step.figure;
        if (helper != null && !isSuccessCriteriaHelperKey(helper)) {
          errors.push(`slide ${n}: step ${stepIndex + 1} asks for unknown Success Criteria Helper "${helper}" - use one of: ${SUCCESS_CRITERIA_HELPER_KEYS.join(', ')}.`);
        }
      });
    });

    // Category colour is deliberately narrow: it is a border on a real
    // comparison, sort or parallel fact group. A free-form colour would let
    // green leak into category cards, while putting the field on an own-surface
    // helper would look valid in JSON but draw nothing different.
    forEachValue(slide, 'categoryColor', (value, owner) => {
      const name = typeof value === 'string' ? value.trim().toLowerCase() : '';
      if (name === 'green') {
        errors.push(`slide ${n}: categoryColor cannot be green - green stays reserved for revealed answers and vocabulary. Use one of: ${CATEGORY_COLOUR_KEYS.join(', ')}.`);
        return;
      }
      if (!categoryColourFor(value)) {
        errors.push(`slide ${n}: unknown categoryColor "${String(value)}" - use one of: ${CATEGORY_COLOUR_KEYS.join(', ')}.`);
        return;
      }
      if (owner && CATEGORY_COLOUR_BLOCKED_TYPES.includes(owner.type)) {
        errors.push(`slide ${n}: categoryColor on ${owner.type} is not supported because that helper does not use the shared outer category card - keep ordinary question lists and success-criteria steps uncoloured, or wrap a genuine category block in a row or stack and put categoryColor on that container.`);
      }
    });

    forEachValue(slide, 'picture', (picture) => {
      if (!picture || typeof picture !== 'object' || Array.isArray(picture)) {
        errors.push(`slide ${n}: a "picture" value is not an object - use the request shape in references/context-pictures.md.`);
        return;
      }
      if (picture.kind !== 'emoji' && picture.kind !== 'educational-svg') {
        errors.push(`slide ${n}: optional picture kind "${String(picture.kind)}" is unknown - use "emoji" or "educational-svg".`);
        return;
      }
      if (picture.kind === 'emoji' && (picture.value == null || String(picture.value) === '')) {
        errors.push(`slide ${n}: an emoji picture has no value - add the emoji or remove the picture request.`);
      }
      if (picture.kind === 'educational-svg') {
        if (typeof picture.concept !== 'string' || !picture.concept.trim()) {
          errors.push(`slide ${n}: an Educational SVG picture has no concept - name the short search subject.`);
        }
        if (typeof picture.context !== 'string' || !picture.context.trim()) {
          errors.push(`slide ${n}: an Educational SVG picture has no context - explain what the nearby words mean so the designer can choose the right drawing.`);
        }
        const hasId =
          typeof picture.educationalSvgId === 'string' &&
          picture.educationalSvgId.trim() !== '';
        const hasSlug =
          typeof picture.educationalSvgSlug === 'string' &&
          picture.educationalSvgSlug.trim() !== '';
        const hasPath =
          typeof picture.imagePath === 'string' && picture.imagePath.trim() !== '';
        if (new Set([hasId, hasSlug, hasPath]).size !== 1) {
          errors.push(`slide ${n}: educationalSvgId, educationalSvgSlug and imagePath must either all be present or all be absent.`);
        } else if (!hasId) {
          errors.push(`slide ${n}: an Educational SVG picture is unresolved - resolve it, use its emoji fallback, or remove it before build.`);
        } else {
          if (!EDUCATIONAL_SVG_ID_RE.test(picture.educationalSvgId.trim())) {
            errors.push(`slide ${n}: educationalSvgId is not a stable library path such as standard/ca/candle-lit.svg.`);
          }
          if (!confinedEducationalSvgPngPath(lessonDir, picture)) {
            errors.push(`slide ${n}: the resolved Educational SVG picture must use icons/<educationalSvgSlug>.png inside the lesson working directory.`);
          }
        }
      }
    });

    // An answer slide with no `||` anywhere renders its answers small and black
    // instead of bold green — children can't tell question from answer at a glance.
    // Every subject's answer slides need this, not only the maths ones: a starter
    // answer slide in geography reads exactly as wrong as a maths one, and the
    // reveal reaches labelled diagrams and speech bubbles as well as question
    // lists. Starter slides name themselves in `heading` rather than `title`, so
    // both are read here, and checking only `title` is what let a green-less starter
    // answer slide through unnoticed.
    // The label has to BE a reveal, not merely mention answers: `Can the answer
    // be zero?` and `Does this answer work?` are question slides, and warning
    // them taught a run to ignore the warning it should have read (a Codex
    // nearest-1,000 run, 19 September 2026, carried both as accepted minor
    // issues). A reveal ends with the house form: `- check`, or `Answers` in a
    // maths deck, or a title ending in the word itself.
    const answerLabel = String(slide.title || slide.heading || '');
    if (/(?:^|[-–—:]\s*)answers?$/i.test(answerLabel.trim()) || /-\s*check$/i.test(answerLabel.trim())) {
      const strings = collectStrings(slide);
      // A sort-board reveals natively: its placed items print in answer green
      // with no marker (markers inside it are banned and would render
      // literally), so a sort-board answer slide already satisfies the reveal.
      // Warning it anyway is what pushed a designer to add `||` to sort items,
      // hit SLIDE_MARKER_LITERAL, revert, and ship the answers black.
      const hasGreenHelper = (function scan(node) {
        if (Array.isArray(node)) return node.some(scan);
        if (!node || typeof node !== 'object') return false;
        if (node.type === 'sort-board') return true;
        return Object.keys(node).some((key) => scan(node[key]));
      })(slide);
      if (!hasGreenHelper && !strings.some((s) => s.includes('||'))) {
        warnings.push(`slide ${n} ("${answerLabel}") looks like an answer slide but carries no "||" reveal marker anywhere, so the answers would render plain black at question size instead of answer green. On a labelled diagram put the marker inside the label ("1||North America"). The one fair exception is a model-answer slide whose whole body IS the answer, where there is no question to reveal it against.`);
      }
    }
  });

  return { errors, warnings };
}

// A JSON parse failure in plain English, pointing at the line and the most
// common cause (an unescaped double-quote inside a verbatim speaker-note script).
function friendlyParseError(jsonPath, source, err) {
  let where = '';
  const m = /position (\d+)/.exec(err.message || '');
  if (m && typeof source === 'string') {
    const pos = Number(m[1]);
    const line = source.slice(0, pos).split('\n').length;
    where = ` (around line ${line})`;
  }
  return (
    `${path.basename(jsonPath)} is not valid JSON${where}: ${err.message}\n` +
    'The most common cause is an unescaped double-quote inside a verbatim speaker-notes script — every literal " inside a string value must be written \\".'
  );
}

module.exports = { validateLesson, friendlyParseError };
