'use strict';

// The Lesson Designer's doMode controls the badge: quick -> lightning,
// deeper -> the existing book/sheet drawing, record (the final written piece) -> the flag. Time, printing and practice vs
// checking do not choose it. Older saved designs without doMode retain their
// print-based mapping. Source choices override slide-authored badges.
// Answer, setup and Our Turn slides carry no Do badge.

const fs = require('fs');
const path = require('path');

const ANSWER_TITLE = /(?:^|[-:]\s*)answers?$/i;
const CHECK_TITLE = /-\s*check$/i;

function designUnits(design) {
  const units = new Map();
  const add = (unit) => {
    if (unit && typeof unit === 'object' && typeof unit.sourceUnitId === 'string') units.set(unit.sourceUnitId, unit);
  };
  add(design.starter);
  (Array.isArray(design.teachingSequence) ? design.teachingSequence : []).forEach(add);
  if (design.ending && design.ending.beat) add(design.ending.beat);
  return units;
}

function worksheetTaskId(design) {
  const worksheet = design && design.worksheet;
  return worksheet && typeof worksheet.taskUnitId === 'string' ? worksheet.taskUnitId : null;
}

function badgeFor(unit, worksheetTask) {
  if (unit.kind === 'our-turn') return null;
  if (unit.doMode === 'quick') return 'quick';
  if (unit.doMode === 'deeper') return 'sheet';
  // The lesson's final written piece takes the teacher's flag, not the book
  // (5 November 2026: take the book off the final writing; 6 November: his
  // flag drawing as its own sign). It goes on every slide of that task, the
  // scene included, because it says the teaching has finished, where the bolt
  // and the book say children are working now.
  if (unit.doMode === 'record') return 'final';
  if (worksheetTask && unit.sourceUnitId === worksheetTask) return 'sheet';
  const levels = unit.levels && typeof unit.levels === 'object' ? unit.levels : null;
  if (!levels) return null;
  if (levels.printed && typeof levels.printed === 'object') return 'sheet';
  return 'quick';
}

function applyDoSigns(lesson, lessonDir) {
  const designPath = path.join(lessonDir || '.', 'lesson-design.json');
  if (!lesson || !Array.isArray(lesson.slides) || !fs.existsSync(designPath)) return lesson;
  let units;
  let worksheetTask;
  try {
    const design = JSON.parse(fs.readFileSync(designPath, 'utf8'));
    units = designUnits(design);
    worksheetTask = worksheetTaskId(design);
  } catch (err) {
    return lesson;
  }
  // Use task signals to locate actual work within a source unit's slides;
  // an explicit mode never puts badges on its launch or model slides.
  const byUnit = new Map();
  for (const slide of lesson.slides) {
    if (!slide || typeof slide !== 'object') continue;
    const ids = typeof slide.designUnitId === 'string' ? [slide.designUnitId]
      : Array.isArray(slide.designUnitIds) ? slide.designUnitIds : [];
    const linked = ids.map((id) => units.get(id)).filter(Boolean);
    const MODES = new Set(['quick', 'deeper', 'record']);
    const unit = linked.find((u) => MODES.has(u.doMode)) || linked[0];
    const explicit = unit && MODES.has(unit.doMode);
    if (unit && unit.kind === 'our-turn') { delete slide.doSign; continue; }
    if (explicit) delete slide.doSign;
    else if (slide.doSign !== undefined) continue;
    if (slide.headerStyle === 'starter') continue;
    const title = String(slide.title || slide.heading || '').trim();
    if (ANSWER_TITLE.test(title) || CHECK_TITLE.test(title) || revealsAnswers(slide)) continue;
    const badge = unit ? badgeFor(unit, worksheetTask) : null;
    if (!badge) continue;
    if (!byUnit.has(unit)) byUnit.set(unit, { badge, slides: [], explicit });
    byUnit.get(unit).slides.push(slide);
  }
  for (const { badge, slides, explicit } of byUnit.values()) {
    if (badge === 'final') { slides.forEach((slide) => { slide.doSign = badge; }); continue; }
    const working = (wanted) => slides.filter((slide) => taskSigns(slide).some((sign) => wanted.has(sign)));
    let marked = badge === 'sheet' ? working(new Set(['pencil'])) : [];
    if (!marked.length) marked = working(TASK_SIGNS);
    // A Do board over two slides gives its jobs out first, their cards signed
    // with what the work will be, and asks its question on the next slide,
    // where the work happens. The badge goes on the asking slide only, so the
    // set-up does not read as a second Do (the teacher, 6 November 2026).
    const asking = marked.filter(asksTheQuestion);
    if (asking.length && asking.length < marked.length) marked = asking;
    if (!marked.length) {
      if (explicit && slides.length > 1) {
        throw new Error('A source unit with doMode has several slides but no task signal identifying its working slide.');
      }
      marked = slides;
    }
    marked.forEach((slide) => { slide.doSign = badge; });
  }
  return lesson;
}

const TASK_SIGNS = new Set(['pencil', 'talk', 'magnifier']);

function asksTheQuestion(node) {
  if (Array.isArray(node)) return node.some(asksTheQuestion);
  if (!node || typeof node !== 'object') return false;
  if (node.colorRole === 'focus-blue' || node.colorRole === 'task-blue') return true;
  if (typeof node.value === 'string' && node.value.includes('[[')) return true;
  return Object.keys(node).some((key) => key !== 'speakerNotes' && asksTheQuestion(node[key]));
}

function taskSigns(node, found = []) {
  if (Array.isArray(node)) node.forEach((item) => taskSigns(item, found));
  else if (node && typeof node === 'object') {
    Object.keys(node).forEach((key) => {
      if (key === 'signal' && typeof node[key] === 'string') found.push(node[key]);
      else taskSigns(node[key], found);
    });
  }
  return found;
}

function revealsAnswers(node) {
  if (Array.isArray(node)) return node.some(revealsAnswers);
  if (!node || typeof node !== 'object') return false;
  if (node.revealPair && node.revealPair.state === 'answer') return true;
  return Object.keys(node).some((key) => revealsAnswers(node[key]));
}

// The tick on answer and check slides, drawn here rather than left to be
// remembered: it is the same sign in the same place in every lesson, and the
// teacher looked for it on decks that carried none (4 October 2026). A sign
// the slide already names is kept.
function applyAnswerTicks(lesson) {
  if (!lesson || !Array.isArray(lesson.slides)) return lesson;
  for (const slide of lesson.slides) {
    if (!slide || typeof slide !== 'object' || slide.signal !== undefined) continue;
    const title = String(slide.title || slide.heading || '').trim();
    if (ANSWER_TITLE.test(title) || CHECK_TITLE.test(title) || revealsAnswers(slide)) slide.signal = 'tick';
  }
  return lesson;
}

module.exports = { applyDoSigns, applyAnswerTicks, badgeFor };
