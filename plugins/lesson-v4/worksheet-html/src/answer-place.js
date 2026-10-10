"use strict";

// On a pencil sheet, every question has somewhere to answer it.
//
// A sheet marked "sheet" carries the pencil at its head, and the pencil is a
// promise: what is asked here is answered here. A set of questions keeps that
// promise by itself, because the engine prints a blank after each one. The
// promise is broken when a designer switches that blank off
// (`answerBlank: false`) and puts nothing in its place: a Year 4 Greater Depth
// sheet printed "Draw your own river... label all six features... write why
// the river gets bigger there" under the pencil with no box, no lines and no
// word about a book, while the Expected sheet gave the same task an 80mm box
// (the stress test of 7 October 2026).
//
// The teacher's ruling (9 October 2026): that page is never printed. The
// designer's check refuses it by name, so the designer chooses where the answer
// goes while it can still think about the task. If one reaches the build all
// the same, the sheet is printed with the question sent to the book
// (`answerInBook`, the book mark and "Write your answer in your book."), and
// the build says which question, because one question never withholds a pack.
//
// Read narrowly on purpose. Only a blank the designer switched off is certain;
// a question whose answer is a mark on a figure, a table or a printed text
// beside it has its place to answer, and nothing here second-guesses that.

// What a child reads and cannot answer on. An instruction counts as a place to
// answer when it prints a blank of its own ("___ books").
const WORDS_ONLY = new Set(["instruction", "section-label", "questions"]);
const BLANK = /_{2,}/;

const textOf = (item) => (typeof item === "string" ? item : String((item && item.text) ?? ""));

function switchedOff(node) {
  return (
    node &&
    node.helper === "questions" &&
    node.answerBlank === false &&
    node.answerInBook !== true &&
    Array.isArray(node.items) &&
    !node.items.some((item) => BLANK.test(textOf(item)))
  );
}

// Does anything in this question give the child a place to answer?
function hasPlace(node, skip) {
  if (Array.isArray(node)) return node.some((part) => hasPlace(part, skip));
  if (!node || typeof node !== "object") return false;
  if (node === skip) return false;
  if (typeof node.helper === "string") {
    if (!WORDS_ONLY.has(node.helper)) return true;
    if (node.helper === "instruction") return BLANK.test(String(node.text ?? ""));
    if (node.helper === "questions") return !switchedOff(node);
    return false;
  }
  return Object.values(node).some((value) => hasPlace(value, skip));
}

// Every switched-off set of questions on a pencil sheet with nothing else in
// its question to answer on. `scope` is the numbered question it sits in, or
// the whole zone when it is in none.
function findOn(content) {
  const found = [];
  const walk = (node, scope) => {
    if (Array.isArray(node)) return node.forEach((part) => walk(part, scope));
    if (!node || typeof node !== "object") return;
    const within = node.question === true ? node : scope;
    if (switchedOff(node) && !hasPlace(within, node)) found.push(node);
    if (typeof node.helper === "string") return;
    for (const value of Object.values(node)) walk(value, within);
  };
  const zones = Array.isArray(content) ? content : Object.values(content || {});
  for (const zone of zones) walk(zone, zone);
  return found;
}

function contentOf(sheet) {
  if (Array.isArray(sheet.pages)) return sheet.pages.map((page) => (page && page.zones) || []);
  return [sheet.zones || []];
}

function nodesOn(sheet) {
  if (!sheet || typeof sheet !== "object" || sheet.recording !== "sheet") return [];
  return contentOf(sheet).flatMap((zones) => findOn(zones));
}

const quote = (node) => {
  const words = textOf(node.items[0]).replace(/\s+/g, " ").trim();
  return words.length > 70 ? `${words.slice(0, 67)}...` : words;
};

function answerPlaceProblems(worksheet) {
  const problems = [];
  for (const [key, sheet] of Object.entries((worksheet && worksheet.sheets) || {})) {
    for (const node of nodesOn(sheet)) {
      problems.push({
        signal: "NOWHERE_TO_ANSWER",
        sheet: key,
        question: quote(node),
        message:
          `sheets.${key} is a pencil sheet ("recording": "sheet"), and "${quote(node)}" ` +
          `has nowhere to answer: its answer space is switched off ("answerBlank": false) ` +
          `and nothing else in the question is there to write, draw or mark on. Choose ` +
          `where the answer goes. A drawing or diagram a child this age can make ` +
          `themselves, and any long answer, goes in the book: set "answerInBook": true ` +
          `on this set of questions and take "answerBlank" off, which prints the book ` +
          `mark and "Write your answer in your book." A short written answer takes ` +
          `written-answers with the sentences it asks for. A drawing-space box is for ` +
          `when the book will not do: the drawing has to sit beside something printed, ` +
          `or the child cannot yet set it out alone. Give the same question the same ` +
          `place on every level, and never reword it to fit.`,
      });
    }
  }
  return problems;
}

// The build's safety net: the same questions, sent to the book.
function withAnswersInBooks(worksheet) {
  const changed = [];
  const sheets = {};
  for (const [key, sheet] of Object.entries((worksheet && worksheet.sheets) || {})) {
    const hit = new Set(nodesOn(sheet));
    if (!hit.size) {
      sheets[key] = sheet;
      continue;
    }
    const mend = (node) => {
      if (Array.isArray(node)) return node.map(mend);
      if (!node || typeof node !== "object") return node;
      if (hit.has(node)) {
        changed.push({ sheet: key, question: quote(node) });
        const { answerBlank, ...rest } = node;
        return { ...rest, answerInBook: true };
      }
      return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, mend(v)]));
    };
    sheets[key] = mend(sheet);
  }
  return { worksheet: changed.length ? { ...worksheet, sheets } : worksheet, changed };
}

module.exports = { answerPlaceProblems, withAnswersInBooks };
