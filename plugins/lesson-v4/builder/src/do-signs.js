'use strict';

// The Lesson Designer's doMode controls the badge: quick -> lightning,
// deeper -> the existing book/sheet drawing. Time, printing and practice vs
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
    const unit = linked.find((u) => u.doMode === 'quick' || u.doMode === 'deeper') || linked[0];
    const explicit = unit && (unit.doMode === 'quick' || unit.doMode === 'deeper');
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
    const working = (wanted) => slides.filter((slide) => taskSigns(slide).some((sign) => wanted.has(sign)));
    let marked = badge === 'sheet' ? working(new Set(['pencil'])) : [];
    if (!marked.length) marked = working(TASK_SIGNS);
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
