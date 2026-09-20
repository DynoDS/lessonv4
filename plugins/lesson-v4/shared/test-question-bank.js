"use strict";

// Where the maths test-question bank is, and how one question arrives.
//
// The bank is 1,915 real past-paper maths reasoning questions, each cropped as
// its own picture with the official mark-scheme answer beside it. It lives in
// its own repository that no install ever clones, for the same reason the
// drawing library does: committing it into the plugin would put every file into
// the history people install from, for ever, including after they were deleted.
//
// The plugin ships the index of question names, because a question's file name
// is its entire description and searching never opens a picture. A name says
// what the question tests, how it is presented and what is actually in it, so
// ranking names is ranking questions. Choosing one fetches that question and
// its answer into the lesson's own folder.
//
// The bank is maths. It holds nothing for any other subject, so nothing here
// takes a subject: the caller decides whether a maths lesson is being designed
// before it reaches this module, and scripts/search-test-questions.js refuses
// anything else at the boundary.
//
// A full local copy wins when one is configured, so the bank can be worked on,
// or used with no network, without changing anything else.

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const transport = require("./github-file-fetch");
const { scoreLabel } = require("./educational-svg-library");

const LOCAL_ROOT_VARIABLE = "LESSON_TEST_QUESTIONS_ROOT";
const REPO_VARIABLE = "LESSON_TEST_QUESTIONS_REPO";
const REF_VARIABLE = "LESSON_TEST_QUESTIONS_REF";
const OFFLINE_VARIABLE = "LESSON_TEST_QUESTIONS_OFFLINE";

const DEFAULT_REPO = "DynoDS/maths-test-question-bank";
const DEFAULT_REF = "main";
const INDEX_PATH = path.resolve(__dirname, "..", "test-questions", "index.txt.gz");

const YEARS = Object.freeze(["year-1", "year-2", "year-3", "year-4", "year-5", "year-6"]);
const STRANDS = Object.freeze(["geometry", "measurement", "number", "statistics"]);
const QUESTION_ID_RE =
  /^year-[1-6]\/(?:geometry|measurement|number|statistics)\/[a-z0-9]+(?:-[a-z0-9]+)*\.png$/;

const FETCH_TIMEOUT_MS = 20000;
const PROBE_TIMEOUT_MS = 6000;
const MAX_QUESTION_BYTES = 4 * 1024 * 1024;
const USER_AGENT = "lesson-v4-test-questions";

// ---------------------------------------------------------------- locations

function environment(source) {
  return source || process.env;
}

function repository(env) {
  return (environment(env)[REPO_VARIABLE] || "").trim() || DEFAULT_REPO;
}

function reference(env) {
  return (environment(env)[REF_VARIABLE] || "").trim() || DEFAULT_REF;
}

function offline(env) {
  const value = (environment(env)[OFFLINE_VARIABLE] || "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

function localRoot(env) {
  const configured = (environment(env)[LOCAL_ROOT_VARIABLE] || "").trim();
  return configured ? path.resolve(configured) : null;
}

function hasQuestions(root) {
  return YEARS.some((year) => fs.existsSync(path.join(root, year)));
}

// ------------------------------------------------------------------- index

// One line per question: its path, then which answer files sit beside it.
// `t` is an answer in words, `p` the mark scheme's own answer picture. A
// question always has at least one, which is why the bank holds no question
// that cannot be answered.
function parseIndexLine(line) {
  const [id, flags = "t"] = line.split("\t");
  if (!QUESTION_ID_RE.test(id)) return null;
  return {
    id,
    year: id.slice(0, id.indexOf("/")),
    strand: id.slice(id.indexOf("/") + 1, id.lastIndexOf("/")),
    name: id.slice(id.lastIndexOf("/") + 1, -4),
    answerText: flags.includes("t"),
    answerPicture: flags.includes("p"),
  };
}

function indexPath(env) {
  const configured = (environment(env).LESSON_TEST_QUESTIONS_INDEX || "").trim();
  return configured ? path.resolve(configured) : INDEX_PATH;
}

function readIndex(env) {
  const file = indexPath(env);
  if (!fs.existsSync(file)) return null;
  try {
    const text = zlib.gunzipSync(fs.readFileSync(file)).toString("utf8");
    const entries = [];
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const entry = parseIndexLine(trimmed);
      if (entry) entries.push(entry);
    }
    return entries;
  } catch (_) {
    return null;
  }
}

function listLocal(root) {
  const entries = [];
  for (const year of YEARS) {
    for (const strand of STRANDS) {
      const folder = path.join(root, year, strand);
      if (!fs.existsSync(folder)) continue;
      for (const file of fs.readdirSync(folder)) {
        if (!file.endsWith(".png") || file.endsWith(".answer.png")) continue;
        const id = `${year}/${strand}/${file}`;
        if (!QUESTION_ID_RE.test(id)) continue;
        const stem = file.slice(0, -4);
        entries.push({
          id,
          year,
          strand,
          name: stem,
          answerText: fs.existsSync(path.join(folder, `${stem}.answer.txt`)),
          answerPicture: fs.existsSync(path.join(folder, `${stem}.answer.png`)),
        });
      }
    }
  }
  return entries.sort((a, b) => a.id.localeCompare(b.id));
}

// ------------------------------------------------------------------ search

// Which year folders a lesson may look in. The lesson's own year leads, because
// that is where a question pitched for the class will be. The bank grew
// unevenly, though, so a year group may be thin or empty, and a question filed
// under a neighbouring year earns its place when its content is exactly the
// skill being retrieved. Year labels guide difficulty; they do not gate it.
function yearsToSearch(year, { includeNeighbours = false } = {}) {
  if (!year) return YEARS.slice();
  const index = YEARS.indexOf(year);
  if (index < 0) return [];
  if (!includeNeighbours) return [year];
  return YEARS.slice(Math.max(0, index - 1), index + 2);
}

function searchQuestions(entries, { queries, year, strand, includeNeighbours, limit = 8 }) {
  const years = new Set(yearsToSearch(year, { includeNeighbours }));
  const wantedStrand = strand || null;
  const scored = [];
  for (const entry of entries) {
    if (years.size && !years.has(entry.year)) continue;
    if (wantedStrand && entry.strand !== wantedStrand) continue;
    const label = entry.name.replace(/-/g, " ");
    let best = { score: 0, query: null };
    for (const query of queries) {
      const score = scoreLabel(label, query);
      if (score > best.score) best = { score, query };
    }
    if (best.score <= 0) continue;
    scored.push({
      ...entry,
      label,
      score: Math.round(best.score * 100) / 100,
      matchedQuery: best.query,
    });
  }
  scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return scored.slice(0, limit);
}

// ------------------------------------------------------------------- fetch

function answerPaths(id, entry) {
  const stem = id.slice(0, -4);
  const wanted = [];
  if (!entry || entry.answerText) wanted.push(`${stem}.answer.txt`);
  if (!entry || entry.answerPicture) wanted.push(`${stem}.answer.png`);
  return wanted;
}

async function fetchOne(env, filePath, destination, timeout) {
  const root = localRoot(env);
  if (root && hasQuestions(root)) {
    const source = path.join(root, filePath);
    if (!fs.existsSync(source)) return { written: null, reasons: ["not in the local bank"] };
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
    return { written: destination, reasons: [] };
  }
  if (offline(env)) return { written: null, reasons: ["fetching is switched off"] };
  const { answer, reasons } = await transport.downloadFile({
    repository: repository(env),
    reference: reference(env),
    filePath,
    timeout,
    env,
    userAgent: USER_AGENT,
    maxBytes: MAX_QUESTION_BYTES,
  });
  if (!answer) return { written: null, reasons };
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, answer.body);
  return { written: destination, reasons: [] };
}

// Brings one question and its answer into a folder, flat: the lesson refers to
// the question by its own name, not by the year and strand it was filed under.
// A question whose answer did not arrive is reported rather than returned, so
// nothing ever reaches a slide with a question and no way to reveal the answer.
async function fetchQuestion(id, destinationFolder, { env, entry, timeout = FETCH_TIMEOUT_MS } = {}) {
  if (!QUESTION_ID_RE.test(id)) return { id, question: null, answers: [], reasons: ["not a question in this bank"] };
  const name = id.slice(id.lastIndexOf("/") + 1);
  const picture = await fetchOne(env, id, path.join(destinationFolder, name), timeout);
  if (!picture.written) return { id, question: null, answers: [], reasons: picture.reasons };

  const answers = [];
  const reasons = [];
  for (const wanted of answerPaths(id, entry)) {
    const file = wanted.slice(wanted.lastIndexOf("/") + 1);
    const got = await fetchOne(env, wanted, path.join(destinationFolder, file), timeout);
    if (got.written) answers.push(got.written);
    else reasons.push(`${file}: ${got.reasons.join("; ")}`);
  }
  if (!answers.length) {
    fs.rmSync(picture.written, { force: true });
    return { id, question: null, answers: [], reasons: reasons.length ? reasons : ["no answer arrived"] };
  }
  return { id, question: picture.written, answers, reasons };
}

async function reachable(env) {
  const root = localRoot(env);
  if (root && hasQuestions(root)) return { ok: true, reasons: [], mode: "local" };
  if (offline(env)) return { ok: false, reasons: ["fetching is switched off"], mode: null };
  const entries = readIndex(env) || [];
  if (!entries.length) return { ok: false, reasons: ["no question named in the index to test with"], mode: null };
  const { answer, reasons } = await transport.downloadFile({
    repository: repository(env),
    reference: reference(env),
    filePath: entries[0].id,
    timeout: PROBE_TIMEOUT_MS,
    env,
    userAgent: USER_AGENT,
    maxBytes: MAX_QUESTION_BYTES,
  });
  return { ok: Boolean(answer), reasons, mode: answer ? "repository" : null };
}

module.exports = {
  DEFAULT_REPO,
  DEFAULT_REF,
  INDEX_PATH,
  LOCAL_ROOT_VARIABLE,
  OFFLINE_VARIABLE,
  QUESTION_ID_RE,
  REPO_VARIABLE,
  STRANDS,
  YEARS,
  fetchQuestion,
  hasQuestions,
  indexPath,
  listLocal,
  parseIndexLine,
  readIndex,
  reachable,
  repository,
  searchQuestions,
  yearsToSearch,
};
