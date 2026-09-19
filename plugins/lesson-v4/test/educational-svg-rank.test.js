"use strict";

// Ranking a drawing shortlist by meaning adds an outside service to a search
// that used to need nothing but a file on disk, so the tests here are mostly
// about what happens when that service is not there.
//
// The failure being guarded against is specific and has happened before in this
// corner of the package: an optional picture route that broke quietly, so every
// picture went missing for a whole run and nothing said why. A search that
// cannot reach the ranking service must still return a shortlist, must return
// the one the words gave it, and must say out loud which of the two orders the
// caller is holding. An unranked shortlist looks exactly like a ranked one.
//
// Nothing here touches the network. The service is a stub, so the tests say the
// same thing on a machine with no key and no internet as they do on Daniel's.

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const rank = require("../shared/educational-svg-rank");

const PACKAGE = path.join(__dirname, "..");
const SEARCH = path.join(PACKAGE, "scripts", "search-educational-svg.js");

function scratch(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `lr-svg-rank-${label}-`));
}

// No key, no cache, no home of this machine's: a test must never pass because
// the developer happened to be logged in.
function sealed({ home, keyFile } = {}) {
  const env = { ...process.env };
  delete env[rank.KEY_VARIABLE];
  delete env[rank.KEY_FILE_VARIABLE];
  delete env.GITHUB_TOKEN;
  delete env.GH_TOKEN;
  const stand = home || scratch("home");
  env.USERPROFILE = stand;
  env.HOME = stand;
  env.LESSON_EDUCATIONAL_SVG_CACHE = scratch("cache");
  env.LESSON_EDUCATIONAL_SVG_OFFLINE = "1";
  if (keyFile) env[rank.KEY_FILE_VARIABLE] = keyFile;
  return env;
}

function candidates(names, { style = "standard", score = 18 } = {}) {
  return names.map((name) => ({
    libraryId: `${style}/${name.slice(0, 2)}/${name}.svg`,
    style,
    label: name.replace(/-/g, " "),
    score,
  }));
}

// A stub of the service: it ranks whichever names contain `wanted`, so a test
// can tell a real reordering from the order it started in.
function stubService(wanted, { failFinal = false } = {}) {
  const calls = [];
  return {
    calls,
    post: async (body) => {
      calls.push(body);
      const labels = Object.keys(body.questions.best.criteria);
      const hits = labels.filter((label) => label.includes(wanted));
      if (failFinal && labels.length <= 12) return { error: "the final round fell over" };
      const probabilities = {};
      for (const label of labels) probabilities[label] = hits.includes(label) ? 0.9 / hits.length : 0.001;
      return {
        body: {
          answers: {
            best: { type: "choice", choice: hits[0] || labels[0], probabilities, confidence: 0.8 },
            anythingFits: { type: "noul", noul: hits.length ? 0.95 : 0.1 },
          },
          usage: { input_tokens: 100, output_tokens: 20 },
        },
      };
    },
  };
}

test("the placeholder line in the key file is not mistaken for a key", () => {
  const home = scratch("placeholder");
  const file = path.join(home, rank.DEFAULT_KEY_FILE);
  fs.writeFileSync(file, "PASTE-YOUR-KEY-ON-THIS-LINE-AND-DELETE-THESE-WORDS\n");

  const { key, reason } = rank.apiKey(sealed({ home }));
  assert.equal(key, null);
  // The reason has to name the file, because the person reading it is the person
  // who has not finished filling it in.
  assert.match(reason, /placeholder/);
  assert.match(reason, /typesafe-key/);
});

test("the environment is read before any file", () => {
  const home = scratch("both");
  fs.writeFileSync(path.join(home, rank.DEFAULT_KEY_FILE), "from-the-file\n");
  const env = sealed({ home });
  env[rank.KEY_VARIABLE] = "from-the-environment";

  const { key, from } = rank.apiKey(env);
  assert.equal(key, "from-the-environment");
  assert.match(from, /TYPESAFE_API_KEY/);
});

test("a missing key file is reported, not thrown", () => {
  const { key, reason } = rank.apiKey(sealed({ home: scratch("empty") }));
  assert.equal(key, null);
  assert.match(reason, /no file to read/);
});

test("one drawing in three styles takes one place, not three", () => {
  const pool = [
    ...candidates(["group-studying-together"], { style: "standard" }),
    ...candidates(["group-studying-together"], { style: "cartoon" }),
    ...candidates(["group-studying-together"], { style: "solid" }),
    ...candidates(["birthday-cake-work"]),
  ];
  const unique = rank.uniqueByLabel(pool);
  assert.deepEqual(
    unique.map((entry) => entry.label),
    ["group studying together", "birthday cake work"]
  );
});

test("every drawing in the batch is an option the model can actually choose", () => {
  const questions = rank.questionsFor(["group studying together", "working agreement"]);
  assert.equal(questions.best.type, "choice");
  assert.deepEqual(Object.keys(questions.best.criteria), [
    "group studying together",
    "working agreement",
  ]);
  // A yes/no with only one side described is half a question.
  assert.equal(questions.anythingFits.type, "noul");
  assert.ok(questions.anythingFits.criteria.true);
  assert.ok(questions.anythingFits.criteria.false);
});

test("with no key there is no ranking, and the caller is told why", async () => {
  const result = await rank.rankBySense({
    about: "a quiet image of cooperation",
    candidates: candidates(["apologetic-hands-together", "group-studying-together"]),
    env: sealed(),
  });
  assert.equal(result.ranked, null);
  assert.match(result.reason, /no file to read|no key/);
});

test("a described request reorders the shortlist the words handed over", async () => {
  const service = stubService("studying");
  const env = sealed();
  env[rank.KEY_VARIABLE] = "test-key";

  const result = await rank.rankBySense({
    about: "children working together on one task",
    candidates: candidates([
      "apologetic-hands-together",
      "birthday-cake-work",
      "group-studying-together",
    ]),
    env,
    post: service.post,
    limit: 2,
  });

  assert.equal(result.ranked.length, 2);
  assert.equal(result.ranked[0].label, "group studying together");
  assert.equal(result.anythingFits, 0.95);
  assert.equal(result.rounds, 1);
  assert.equal(service.calls.length, 1);
  // The words' own score has to survive the trip, because the caller still
  // reports it and a lost field reads as a zero.
  assert.equal(result.ranked[0].score, 18);
});

test("a pool too big for one question is judged in heats and a final", async () => {
  const service = stubService("studying");
  const env = sealed();
  env[rank.KEY_VARIABLE] = "test-key";

  const names = [];
  for (let n = 0; n < 250; n += 1) names.push(`filler-drawing-${n}`);
  names.push("group-studying-together");

  const result = await rank.rankBySense({
    about: "children working together on one task",
    candidates: candidates(names),
    env,
    post: service.post,
    limit: 3,
  });

  // Three heats of a hundred, then one final between their survivors.
  assert.equal(service.calls.length, 4);
  assert.equal(result.rounds, 4);
  assert.ok(service.calls.every((call) => Object.keys(call.questions.best.criteria).length <= rank.BATCH_SIZE));
  assert.equal(result.ranked[0].label, "group studying together");
  assert.equal(result.usage.requests, 4);
  assert.equal(result.usage.input_tokens, 400);
});

test("a lost final round keeps the heats rather than the alphabet", async () => {
  const service = stubService("studying", { failFinal: true });
  const env = sealed();
  env[rank.KEY_VARIABLE] = "test-key";

  const names = [];
  for (let n = 0; n < 150; n += 1) names.push(`filler-drawing-${n}`);
  names.push("group-studying-together");

  const result = await rank.rankBySense({
    about: "children working together on one task",
    candidates: candidates(names),
    env,
    post: service.post,
    limit: 3,
  });

  assert.ok(result.ranked, "a lost final round must not lose the shortlist");
  assert.equal(result.ranked[0].label, "group studying together");
  assert.match(result.note, /final round did not come back/);
});

test("the search still answers when the ranking service cannot be reached", () => {
  const output = execFileSync(
    process.execPath,
    [
      SEARCH,
      "--query",
      "children working together",
      "--about",
      "a quiet image of cooperation alongside the class agreement",
      "--style",
      "standard",
      "--limit",
      "4",
      "--no-fetch",
    ],
    { encoding: "utf8", env: sealed() }
  ).trim();

  const line = output
    .split("\n")
    .find((entry) => entry.startsWith("EDUCATIONAL_SVG_SEARCH: "));
  const payload = JSON.parse(line.replace("EDUCATIONAL_SVG_SEARCH: ", ""));

  assert.equal(payload.available, true);
  assert.equal(payload.candidates.length, 4, "a shortlist still arrives");
  // The two halves of the promise: it says which order this is, and it says why.
  assert.equal(payload.ranking, "words");
  assert.match(payload.rankingNote, /ranked by words, not meaning/);
  assert.match(output, /EDUCATIONAL_SVG_RANKING: /);
});

test("a search with no description is the search it always was", () => {
  const output = execFileSync(
    process.execPath,
    [SEARCH, "--query", "lit candle", "--limit", "3", "--no-fetch"],
    { encoding: "utf8", env: sealed() }
  ).trim();

  const line = output
    .split("\n")
    .find((entry) => entry.startsWith("EDUCATIONAL_SVG_SEARCH: "));
  const payload = JSON.parse(line.replace("EDUCATIONAL_SVG_SEARCH: ", ""));

  assert.equal(payload.ranking, "words");
  assert.equal(payload.about, null);
  // No description means nothing was asked of the service, so there is nothing
  // to explain and no note to print.
  assert.equal(payload.rankingNote, undefined);
  assert.equal(payload.candidates.length, 3);
});
