'use strict';

// No number a class reads may contain a 6 followed by a 7.
//
// The "6-7" playground meme sets a class off whenever the two digits appear
// together, and it is not only 67: 670, 6,742 and 267 do it too (the teacher,
// 17 September 2026, after a rounding lesson's worksheet printed 6,742 and
// 6,747). The authoring agents choose numbers statistically, and 67 is an
// ordinary two-digit choice for them, so a sentence asking them to avoid it is
// not enough: every builder runs this check on the spec it is about to print.
//
// What counts: any whole number in a string or in a numeric field, with the
// thousands commas ignored ("6,742" is 6742). What does not: a decimal (6.7,
// 0.67, which are nearly always layout ratios), part of a word, identifier,
// file name or colour, and a four-digit year from 1000 to 2099 written without
// a comma, because a real date (1567, 1967) is a fact the lesson cannot change.
//
// Nor a position inside a picture. A label-diagram anchor is a percentage
// across and down the image, written as a pair (anchor: [35, 67]), which is
// the same kind of value as the x and y the list already skips: it is measured
// off the picture rather than chosen, and no child ever reads it. The science
// run of 22 September 2026 had a large-intestine label refused for sitting 67
// per cent across the digestive diagram, and the anchor had to be moved off the
// part it names before the worksheet would build.
//
// Nor a number sitting in a counting run with both its neighbours (a hundred
// square's rows, a list of every number from 60 to 70): the run cannot skip
// one, and a number square on every classroom wall has never been the trigger.

const SKIPPED_STRING_KEYS = /(^id$|Id$|Ids$|Ref$|Refs$|path|Path|url|Url|^src$|^href$|sha|Sha|[Ff]ile|[Cc]olou?r|^fill$|[Ss]lug|^layout$|^template$|^kind$)/;
const SKIPPED_NUMBER_KEYS = /^(fontSize|headingFontSize|weight|rotation|transparency|x|y|w|h|width|height|anchor|label_at|maxRows|blankChars|classSize|dpi|radius|lineW|pad|gap|minFont|maxFont|version|schemaVersion|lon|lat|longitude|latitude)$/;
const NUMBER_TOKEN = /(?<![\p{L}\p{N}_/\\.#-])(\d{1,3}(?:,\d{3})+|\d+)(?![\p{N}_/\\]|\.\d|-\d|,\d{3})/gu;

function offends(digits, writtenWithComma) {
  if (!digits.includes('67')) return false;
  if (!writtenWithComma && digits.length === 4) {
    const n = Number(digits);
    if (n >= 1000 && n <= 2099) return false;
  }
  return true;
}

// The whole numbers an array holds as bare values, one level of nesting deep,
// so a table's rows are read as one run.
function countingRun(array) {
  const values = new Set();
  const add = (item) => {
    if (typeof item === 'number' && Number.isInteger(item)) values.add(item);
    else if (typeof item === 'string' && /^(\d{1,3}(,\d{3})+|\d+)$/.test(item.trim())) {
      values.add(Number(item.trim().replace(/,/g, '')));
    }
  };
  array.forEach((item) => (Array.isArray(item) ? item.forEach(add) : add(item)));
  return values;
}

function sixSevenNumbers(tree) {
  const hits = new Set();
  const inRun = (value, run) => !!run && run.has(value - 1) && run.has(value + 1);
  const walk = (node, key, run) => {
    if (typeof node === 'string') {
      if (key && SKIPPED_STRING_KEYS.test(key)) return;
      for (const match of node.matchAll(NUMBER_TOKEN)) {
        const token = match[1];
        const digits = token.replace(/,/g, '');
        if (offends(digits, token.includes(',')) && !inRun(Number(digits), run)) hits.add(token);
      }
      return;
    }
    if (typeof node === 'number') {
      if (!Number.isInteger(node) || (key && SKIPPED_NUMBER_KEYS.test(key))) return;
      const digits = String(Math.abs(node));
      if (digits.includes('67') && !inRun(node, run)) hits.add(node.toLocaleString('en-GB'));
      return;
    }
    if (Array.isArray(node)) {
      const own = countingRun(node);
      const merged = run ? new Set([...run, ...own]) : own;
      node.forEach((item) => walk(item, key, merged));
      return;
    }
    if (node && typeof node === 'object') {
      Object.keys(node).forEach((k) => walk(node[k], k, null));
    }
  };
  walk(tree, null, null);
  return [...hits];
}

function sixSevenMessage(hits, what) {
  return (
    `NUMBER_CONTAINS_SIX_SEVEN: the ${what} contains ${hits.map((h) => `"${h}"`).join(', ')}. ` +
    `The class has a playground meme about 6 and 7, and any number with a 6 followed ` +
    `by a 7 sets it off, commas or not. Choose a different number that does the same ` +
    `mathematical job (the same number of digits, and the same case, such as exactly ` +
    `halfway or crossing a hundred), and change it everywhere it appears: the question, ` +
    `every answer, the notes and any figure drawn from it. Change it where the number ` +
    `was chosen - the lesson design, or the adaptation for a Below or Greater Depth ` +
    `question - and rebuild from there; editing only this spec leaves the source wrong ` +
    `and the next build brings it back.`
  );
}

module.exports = { sixSevenNumbers, sixSevenMessage };
