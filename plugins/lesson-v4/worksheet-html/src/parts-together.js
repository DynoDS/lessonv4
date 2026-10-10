"use strict";

// The parts of one question stay in one column.
//
// A Year 2 sheet put its photograph, its word bank and part (1a) in the left
// column, had no room left, and started the right column with (1b), (1c) and
// (1d). A child finishing (1a) has to find the rest of the question at the top
// of another column, away from the instruction and the word bank it shares
// (the stress test of 7 October 2026; the teacher, 9 October: "confusing
// because it goes 1a, then 1b and c are on next column"). Nothing told the
// designer that parts belong together, and nothing checked.
//
// The check is on the page the build will draw, in printed numbers. It is
// narrow on purpose, because the teacher called the other way round "great":
// (1a) to (1c) under the photograph with (1d) starting the next column reads
// as a question that ran on. What reads as a mistake is a question that starts
// with a stub and has most of itself elsewhere. So a question is reported when
// its first column holds fewer of its parts than a later one, and all of its
// parts would have fitted, at that column's width, in the column the later
// parts are in. A question too long for a column has to run on, and is never
// reported.

const { drawnZones, contentArea } = require("./render");
const { measureContent } = require("./helpers");

const PART = /^(\d+)[a-z]+$/;

// Every lettered part in a zone's content, outermost first: a part's own
// insides are its own and are not walked.
function partsIn(content) {
  const found = [];
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if (typeof node.number === "string" && PART.test(node.number)) {
      found.push(node);
      return;
    }
    if (typeof node.helper === "string") return;
    for (const value of Object.values(node)) walk(value);
  };
  walk(content);
  return found;
}

function splitQuestionProblems(sheets) {
  const problems = [];
  for (const sheet of sheets || []) {
    const spec = sheet && sheet.spec;
    if (!spec || !spec.zones || typeof spec.zones !== "object" || Array.isArray(spec.zones)) continue;
    let placed;
    try {
      placed = drawnZones(spec);
    } catch {
      continue; // a sheet that cannot be laid out yet is reported by the fit checks
    }
    const area = contentArea(spec);
    const byQuestion = new Map();
    for (const zone of placed) {
      for (const part of partsIn(zone.content)) {
        const question = part.number.match(PART)[1];
        if (!byQuestion.has(question)) byQuestion.set(question, []);
        byQuestion.get(question).push({ part, zone });
      }
    }
    for (const [question, parts] of byQuestion) {
      const zones = [...new Set(parts.map((p) => p.zone))];
      if (zones.length < 2) continue;
      const count = (zone) => parts.filter((p) => p.zone === zone).length;
      if (!zones.slice(1).some((zone) => count(zone) > count(zones[0]))) continue;
      // The column the question finishes in, from its top to the foot of the
      // page: could the whole question have gone there?
      const last = zones[zones.length - 1];
      const roomMm = area.heightMm - last.y;
      let wholeMm = 0;
      try {
        wholeMm = parts.reduce((mm, p) => mm + measureContent(p.part, last.w), 0);
      } catch {
        continue;
      }
      if (wholeMm > roomMm) continue;
      const labels = parts.map((p) => `(${p.part.number})`);
      const here = zones.map(
        (z) => `${parts.filter((p) => p.zone === z).map((p) => `(${p.part.number})`).join(" ")} in zone "${z.id}"`
      );
      problems.push({
        signal: "QUESTION_SPLIT_ACROSS_COLUMNS",
        sheet: sheet.key,
        question,
        message:
          `${sheet.label} - question ${question} is split: ${here.join(", ")}. Its ` +
          `${labels.length} parts measure ${Math.round(wholeMm)}mm together and zone ` +
          `"${last.id}" has ${Math.round(roomMm)}mm, so the whole question fits in one ` +
          `column, and most of it has been left behind its first part. A child who ` +
          `finishes the first part should find the next one under it, with the ` +
          `instruction and support they share in sight. Keep the parts ` +
          `together and move what crowded them out: material the whole sheet shares ` +
          `(the picture, the word bank, the instruction) goes in a band across the top ` +
          `("band-two-cols", as a row with stated "parts" so the words keep their ` +
          `width), or beside the question in the other column. Only a question too ` +
          `long for a column runs on into the next.`,
      });
    }
  }
  return problems;
}

module.exports = { splitQuestionProblems };
