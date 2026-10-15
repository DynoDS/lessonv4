'use strict';

// On an answers slide a method frame's line carries one reveal marker, and
// everything after it printed green: `4 × ||2 = 8` turned the given `= 8`
// green with the answer, and `3/4 ||> 5/8` the given `5/8` (Year 5 equivalent
// fractions, 13 October 2026). The marker says where the first answer starts,
// never where an answer ends. The question slide does: the same frame, in the
// same slot, with a box where each answer goes (`4 × ___ = 8`).
//
// Before the slides are drawn, every answered line is told what its question
// asked (`asked`), and the frame colours only what stands where a box stood. A
// group is the same labels, in the same slot of the same template and layout:
// the rule a shape already follows (shapes-stand-still.js). A frame with no
// question before it, or whose answer does not read as its question filled in,
// is drawn exactly as before.

const BLANK = /_{2,}|□/;
const BLANKS = /_{2,}|□/g;

function frameKey(spec) {
  return JSON.stringify([spec.title || '', (spec.lines || []).map((l) => [l && l.label, l && l.step])]);
}

function tellFramesWhatWasAsked(lesson) {
  const groups = new Map();
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  slides.forEach((slide) => {
    (function walk(obj, slot) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.type === 'method-frame' && Array.isArray(obj.lines)) {
        const group = [
          frameKey(obj), slide && slide.template,
          typeof (slide && slide.layout) === 'string' ? slide.layout : '', slot,
        ].join('|');
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push(obj);
      }
      for (const k of Object.keys(obj)) walk(obj[k], `${slot}/${k}`);
    })(slide, '');
  });
  for (const members of groups.values()) {
    const asked = [];
    for (const member of members) {
      member.lines.forEach((line, i) => {
        if (!line || typeof line.content !== 'string') return;
        if (BLANK.test(line.content)) asked[i] = line.content;
        else if (line.content.includes('||') && asked[i]) line.asked = asked[i];
      });
    }
  }
  return lesson;
}

const escaped = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');

// The answered line as pieces in order, `{ text, answer }`, or null when it is
// not its question with the boxes filled in. A fraction with a part to find is
// an answer whole (`___/8` filled in is `6/8`, green top and bottom), and
// answers with only a comma or a space between them stay one run.
function answerPieces(asked, shown) {
  const given = String(asked).trim().split(BLANKS);
  if (given.length < 2) return null;
  const plain = String(shown).replace(/\|\|/g, '').trim();
  const found = new RegExp(`^${given.map(escaped).join('(.+?)')}$`).exec(plain);
  if (!found) return null;

  const texts = given.slice();
  const answers = found.slice(1).map((a) => a.trim());
  answers.forEach((_, i) => {
    const part = /^\s*\/\s*\d+/.exec(texts[i + 1]);
    if (part) { answers[i] += part[0].replace(/\s+/g, ''); texts[i + 1] = texts[i + 1].slice(part[0].length); }
    const whole = /\d+\s*\/\s*$/.exec(texts[i]);
    if (whole) { answers[i] = whole[0].replace(/\s+/g, '') + answers[i]; texts[i] = texts[i].slice(0, whole.index); }
  });

  const pieces = [];
  const add = (text, answer) => {
    const last = pieces[pieces.length - 1];
    if (last && last.answer === answer) last.text += text;
    else pieces.push({ text, answer });
  };
  texts.forEach((text, i) => {
    // Between two answers, a comma, a space or a fraction's own slash.
    const joins = i > 0 && i < texts.length - 1 && /^[\s,;/]*$/.test(text);
    if (joins) add(text === '' ? '' : text.trim() === '/' ? '/' : `${text.trim()} `, true);
    else if (text.trim()) add(text, false);
    if (i < answers.length) add(answers[i], true);
  });
  return pieces.map((p) => ({ text: p.text.trim(), answer: p.answer })).filter((p) => p.text);
}

module.exports = { tellFramesWhatWasAsked, answerPieces };
