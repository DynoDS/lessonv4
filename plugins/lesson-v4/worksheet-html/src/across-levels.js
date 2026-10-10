"use strict";

// The same question, given the same way on every level.
//
// Each level's sheet is written on its own, and nothing ever laid the three
// side by side. So a question printed word for word on two levels could be
// given three ruled lines on one and one on the other, for no reason a teacher
// could see (the stress test of 7 October 2026 found the same piece drawn
// differently across levels in 5 of 20 lessons). The engine now settles what it
// can by itself: a child's claim is one drawing (claim-look.js), a long answer
// goes in the book on every level (helpers/in-book.js), ruled lines carry no
// box. What is left is the designer's own count of lines, and this is the check
// on it.
//
// The teacher's rule (9 October 2026): the same question gets the same writing
// room on every level unless the task itself differs. "The same question" is
// read narrowly on purpose: the words a child reads in that question are
// identical on both levels. A question reworded for a level may well be a
// different task, and its room is the designer's to judge, so it is never
// reported here.

const { holdsBookAnswer } = require("./helpers");

const WRITING = new Set(["written-answers", "writing-frame", "named-claim"]);

const squash = (text) => String(text ?? "").replace(/\s+/g, " ").trim().toLowerCase();

// The words of one numbered question, and the room it gives the answer.
function readQuestion(node) {
  const words = [];
  const room = { book: false, lines: 0 };
  const walk = (item, top) => {
    if (Array.isArray(item)) return item.forEach((part) => walk(part, false));
    if (!item || typeof item !== "object") return;
    if (!top && item.number !== undefined) return; // a question of its own
    if (item.helper === "instruction" && item.hint !== true) words.push(item.text);
    if (WRITING.has(item.helper)) {
      if (item.text) words.push(item.text);
      if (holdsBookAnswer(item)) room.book = true;
      if (item.helper === "written-answers") {
        for (const answer of item.items || []) {
          if (answer.text) words.push(answer.text);
          room.lines += Number(answer.lines) || 0;
        }
      } else if (item.helper === "writing-frame") {
        for (const starter of item.starters || []) {
          if (typeof starter === "string") {
            words.push(starter);
            room.lines += 1;
          } else if (starter) {
            if (starter.text) words.push(starter.text);
            room.lines += Number(starter.lines) || 1;
          }
        }
      } else {
        words.push(item.says);
        room.lines += item.lines === undefined ? 3 : Number(item.lines) || 0;
      }
      return;
    }
    for (const key of ["stack", "row"]) {
      if (Array.isArray(item[key])) walk(item[key], false);
    }
  };
  walk(node, true);
  return { words: squash(words.filter(Boolean).join(" | ")), room };
}

function questionsOn(zones) {
  const found = [];
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if (node.number !== undefined) {
      const read = readQuestion(node);
      // Only a question a child writes an answer to has room to compare.
      if (read.words && (read.room.book || read.room.lines > 0)) {
        found.push({ number: node.number, ...read });
      }
    }
    for (const value of Object.values(node)) walk(value);
  };
  walk(zones);
  return found;
}

const describe = (room) =>
  room.book ? "answered in the book" : `${room.lines} ruled line${room.lines === 1 ? "" : "s"}`;

// Takes the engine's own sheets (`sheetsOf`), so the numbers are the printed
// ones. A "books" level prints no room at all, so it has nothing to compare.
function sameQuestionProblems(sheets) {
  const levels = sheets
    .filter((sheet) => sheet.spec && sheet.spec.recording !== "books")
    .map((sheet) => ({ label: sheet.label, questions: questionsOn(sheet.spec.zones) }));
  const problems = [];
  for (let a = 0; a < levels.length; a += 1) {
    for (let b = a + 1; b < levels.length; b += 1) {
      if (levels[a].label === levels[b].label) continue; // two pages of one level
      for (const first of levels[a].questions) {
        const second = levels[b].questions.find((q) => q.words === first.words);
        if (!second) continue;
        const same =
          first.room.book === second.room.book &&
          (first.room.book || first.room.lines === second.room.lines);
        if (same) continue;
        problems.push({
          signal: "SAME_QUESTION_DIFFERENT_ROOM",
          message:
            `${levels[a].label} question ${first.number} and ${levels[b].label} question ` +
            `${second.number} are the same question, word for word, and are given different ` +
            `room to answer: ${describe(first.room)} on ${levels[a].label}, ` +
            `${describe(second.room)} on ${levels[b].label}. A child on either level is ` +
            `writing the same answer, so give both the same number of lines (the larger, ` +
            `where both pages hold it). If the task really differs between the levels, the ` +
            `question's own words say so upstream and this check passes; never reword a ` +
            `question here to get past it.`,
        });
      }
    }
  }
  return problems;
}

module.exports = { sameQuestionProblems };
