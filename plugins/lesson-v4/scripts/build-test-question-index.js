#!/usr/bin/env node
"use strict";

// The bank is 1,915 questions and about 227 MB. Searching it never opens one of
// them: a question's file name is its entire description, so the name list is
// the whole search surface. That list gzips to a few tens of kilobytes, which is
// why the plugin can ship the search and fetch only the questions a lesson
// chooses.
//
// Run this after adding questions to the bank repository, and commit the rebuilt
// index. A question missing from the index is invisible; a name in the index
// with no question behind it fetches nothing and the starter falls back to
// written questions. Neither stops a lesson, and neither is much use either.

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const { INDEX_PATH, listLocal, hasQuestions } = require("../shared/test-question-bank");

function usage(message) {
  if (message) console.error(message);
  console.error(
    'Usage: node build-test-question-index.js --bank "<path to the bank checkout>" [--out "<index.txt.gz>"]'
  );
  process.exit(2);
}

function parseArgs(argv) {
  const options = { bank: null, out: INDEX_PATH };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index + 1];
    if (argv[index] === "--bank") {
      if (!value) usage("--bank needs a path.");
      options.bank = path.resolve(value);
      index += 1;
    } else if (argv[index] === "--out") {
      if (!value) usage("--out needs a path.");
      options.out = path.resolve(value);
      index += 1;
    } else {
      usage(`Unknown option: ${argv[index]}`);
    }
  }
  if (!options.bank) usage("--bank is required.");
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!hasQuestions(options.bank)) usage(`no year folders with questions under ${options.bank}`);

  const entries = listLocal(options.bank);
  const withoutAnswer = entries.filter((entry) => !entry.answerText && !entry.answerPicture);
  if (withoutAnswer.length) {
    // A question with no answer would reach a starter slide with nothing to
    // reveal, so it is left out rather than shipped and discovered live.
    console.error(`Left out ${withoutAnswer.length} question(s) with no answer beside them:`);
    for (const entry of withoutAnswer.slice(0, 10)) console.error(`  ${entry.id}`);
  }

  const usable = entries.filter((entry) => entry.answerText || entry.answerPicture);
  const lines = usable.map((entry) => {
    const flags = `${entry.answerText ? "t" : ""}${entry.answerPicture ? "p" : ""}`;
    return `${entry.id}\t${flags}`;
  });

  fs.mkdirSync(path.dirname(options.out), { recursive: true });
  fs.writeFileSync(options.out, zlib.gzipSync(Buffer.from(`${lines.join("\n")}\n`, "utf8"), { level: 9 }));

  const byYear = new Map();
  for (const entry of usable) byYear.set(entry.year, (byYear.get(entry.year) || 0) + 1);
  const size = fs.statSync(options.out).size;
  console.log(`TEST_QUESTION_INDEX_OK ${options.out}`);
  console.log(`questions: ${usable.length}`);
  console.log(`with an answer picture: ${usable.filter((entry) => entry.answerPicture).length}`);
  for (const year of [...byYear.keys()].sort()) console.log(`  ${year}: ${byYear.get(year)}`);
  console.log(`index size: ${Math.round(size / 1024)} KB`);
}

main();
