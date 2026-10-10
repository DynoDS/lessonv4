'use strict';

// The Do beat's badge, read off the lesson design rather than left to anyone
// to remember (Daniel, 1 October 2026). A beat with a printed activity shows a
// sheet; a task kept on the board shows a lightning bolt, however long it runs
// (2 October 2026: a three-minute board task carried no mark, and he looked for
// one where a Do should be). The teacher reading the deck sees at a glance which tasks
// have a sheet to hand out and which stay quick ("I would have seen the
// lightning bolt and did it on the board").
//
// Two more rulings (8 October 2026). An Our Turn carries no badge: the class
// works it with the teacher, and the bolt is for the task children do on their
// own. And the lesson's main worksheet earns the sheet only on the task it
// IS (`worksheet.taskUnitId`: the planning grid a child can only fill in on
// paper), never on a Your Turn that has its own questions on the board with
// the worksheet as fresh practice beside it; that one keeps the bolt. Until
// the design named the task, a Your Turn done on the worksheet showed the
// bolt, because the worksheet is planned apart from the beats.
//
// The design sits beside lesson.json in the working folder; a deck built
// without it (a test deck, an older lesson) simply carries no badges. A badge
// the slide already names is kept. Answer and check slides take none: the
// beat's work is done by then.

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
  for (const slide of lesson.slides) {
    if (!slide || typeof slide !== 'object' || slide.doSign !== undefined) continue;
    if (slide.headerStyle === 'starter') continue;
    const title = String(slide.title || slide.heading || '').trim();
    if (ANSWER_TITLE.test(title) || CHECK_TITLE.test(title)) continue;
    const ids = typeof slide.designUnitId === 'string' ? [slide.designUnitId]
      : Array.isArray(slide.designUnitIds) ? slide.designUnitIds : [];
    const unit = ids.map((id) => units.get(id)).find(Boolean);
    const badge = unit ? badgeFor(unit, worksheetTask) : null;
    if (badge) slide.doSign = badge;
  }
  return lesson;
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
