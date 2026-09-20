#!/usr/bin/env node
"use strict";

// Search the maths test-question bank by name, then take the one you chose.
//
// Two steps, because they cost differently. Searching reads the packaged index
// and fetches only the shortlist's pictures into a preview folder, so looking at
// six questions costs six pictures. Taking one brings that question and its
// answer into the lesson folder, so a reject never costs an answer.
//
//   node search-test-questions.js --subject maths --year 4 \
//        --query "round to the nearest 100" --about "<what the starter retrieves>" \
//        --into "[WORKING_DIR]"
//
//   node search-test-questions.js --subject maths --take "year-4/number/<name>.png" \
//        --into "[WORKING_DIR]"

const fs = require("node:fs");
const path = require("node:path");

const bank = require("../shared/test-question-bank");

const PREVIEW_FOLDER = path.join("test-questions", ".preview");
const LESSON_FOLDER = "test-questions";

function fail(message) {
  console.error(`TEST_QUESTION_ERROR: ${message}`);
  process.exit(2);
}

function parseArgs(argv) {
  const options = {
    subject: null,
    year: null,
    strand: null,
    queries: [],
    about: null,
    limit: 6,
    into: null,
    take: null,
    includeNeighbours: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    const needs = () => {
      if (!value) fail(`${flag} needs a value.`);
      index += 1;
      return value;
    };
    if (flag === "--subject") options.subject = needs().toLowerCase();
    else if (flag === "--year") options.year = needs();
    else if (flag === "--strand") options.strand = needs().toLowerCase();
    else if (flag === "--query") options.queries.push(needs());
    else if (flag === "--about") options.about = needs();
    else if (flag === "--limit") options.limit = Number(needs());
    else if (flag === "--into") options.into = path.resolve(needs());
    else if (flag === "--take") options.take = needs();
    else if (flag === "--include-neighbouring-years") options.includeNeighbours = true;
    else fail(`Unknown option: ${flag}`);
  }
  return options;
}

// The bank holds maths and nothing else, so a history or science lesson asking
// it for a starter would get a maths question or, worse, a plausible-looking
// name that has nothing to do with the lesson. The subject is stated rather
// than guessed, and anything but maths stops here.
function requireMaths(subject) {
  if (subject === "maths") return;
  if (!subject) fail("--subject is required, and this bank only answers for maths.");
  fail(
    `this bank holds maths questions only, so it has nothing for ${subject}. ` +
      "Design the starter as usual."
  );
}

function normaliseYear(year) {
  if (!year) return null;
  const digits = String(year).match(/[1-6]/);
  if (!digits) fail(`--year should name a year group from 1 to 6, not "${year}".`);
  return `year-${digits[0]}`;
}

async function take(options) {
  if (!options.into) fail("--into is required: name the lesson folder to bring the question into.");
  const entries = bank.readIndex() || [];
  const entry = entries.find((candidate) => candidate.id === options.take) || null;
  const destination = path.join(options.into, LESSON_FOLDER);
  const result = await bank.fetchQuestion(options.take, destination, { entry });
  if (!result.question) {
    console.log("TEST_QUESTION_NOT_TAKEN");
    for (const reason of result.reasons) console.log(`  ${reason}`);
    console.log("Design the starter as usual.");
    return;
  }
  console.log("TEST_QUESTION_TAKEN");
  console.log(`question: ${result.question}`);
  for (const answer of result.answers) console.log(`answer: ${answer}`);
  const words = result.answers.find((file) => file.endsWith(".answer.txt"));
  if (words) {
    console.log("--- the answer, as the mark scheme gives it ---");
    console.log(fs.readFileSync(words, "utf8").trim());
  }
  for (const reason of result.reasons) console.log(`note: ${reason}`);
}

async function search(options) {
  if (!options.queries.length) fail("at least one --query is required.");
  if (!options.into) fail("--into is required: name the lesson folder to preview into.");
  const entries = bank.readIndex();
  if (!entries) fail(`the shipped index is missing or unreadable at ${bank.indexPath()}`);

  const year = normaliseYear(options.year);
  let shortlist = bank.searchQuestions(entries, {
    queries: options.queries,
    year,
    strand: options.strand,
    includeNeighbours: options.includeNeighbours,
    limit: options.limit,
  });

  // The bank grew unevenly, so a thin year group can answer nothing while the
  // question the starter wants sits one year either side. Widening is reported,
  // not silent, because the year a question was filed under is a fact the
  // teacher should see when judging whether it suits the class.
  let widened = false;
  if (!shortlist.length && year && !options.includeNeighbours) {
    shortlist = bank.searchQuestions(entries, {
      queries: options.queries,
      year,
      strand: options.strand,
      includeNeighbours: true,
      limit: options.limit,
    });
    widened = shortlist.length > 0;
  }

  if (!shortlist.length) {
    console.log("TEST_QUESTION_NONE_MATCHED");
    console.log("Nothing in the bank matches that retrieval target. Design the starter as usual.");
    return;
  }

  const preview = path.join(options.into, PREVIEW_FOLDER);
  fs.mkdirSync(preview, { recursive: true });
  if (widened) console.log("TEST_QUESTION_WIDENED: nothing in that year group, so neighbouring years were searched.");
  console.log(`TEST_QUESTION_SHORTLIST ${shortlist.length}`);
  if (options.about) console.log(`about: ${options.about}`);

  let fetched = 0;
  for (const candidate of shortlist) {
    const result = await bank.fetchQuestion(candidate.id, preview, { entry: candidate });
    if (result.question) fetched += 1;
    const line = [
      candidate.id,
      `score=${candidate.score}`,
      candidate.year,
      candidate.answerPicture ? "answer=picture+words" : "answer=words",
    ].join("  ");
    if (result.question) console.log(`  ${line}\n    picture: ${result.question}`);
    else console.log(`  ${line}\n    NOT FETCHED: ${result.reasons.join("; ")}`);
  }
  if (!fetched) {
    // Every candidate failed to arrive, which is one situation and not six: no
    // network, no sign-in to a private bank, or fetching switched off. Saying
    // so once is the difference between a designer falling back on purpose and
    // one choosing a question by its name without ever seeing it.
    console.log("TEST_QUESTION_UNAVAILABLE: the names matched but no picture could be fetched.");
    console.log("Do not choose a question you have not seen. Design the starter as usual.");
    return;
  }
  console.log("Look at the pictures before choosing. A name gets you close; only the picture");
  console.log("confirms the skill, the difficulty, and that the question stands alone.");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  requireMaths(options.subject);
  if (options.take) await take(options);
  else await search(options);
}

main().catch((error) => fail(error.message));
