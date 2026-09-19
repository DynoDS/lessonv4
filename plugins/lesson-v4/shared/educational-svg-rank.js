"use strict";

// Putting a shortlist of drawings in the order the request means.
//
// A drawing's name is its whole description, and the word scorer in
// educational-svg-library.js can only compare words. That is fine when the
// request happens to share a word with a filename: "listening during class
// discussion" puts `person listening class` first, correctly. It collapses as
// soon as the request is written the way a designer actually writes one.
//
// Asked for "a quiet image of cooperation alongside the class agreement" on
// 19 September 2026, 367 drawings scored exactly the same 18, so the twelve
// that reached the caller were simply the first twelve of those 367 in
// alphabetical order. `group studying together` and `working agreement` sat in
// that same tie and were never seen; `apprentice working alone` was, offered
// for a request about cooperation. Asked for "cooperation" on its own, the
// stemmer cuts the word back to "coop" and `chicken coop` outranks the lot.
//
// So the word scorer keeps the job it is good at: casting a wide, cheap net
// over 135,000 names without opening a single file. This module puts that net
// in order of meaning, and answers the one question the scorer cannot ask at
// all - whether anything in the net shows the thing - so "nothing here fits"
// becomes an answer the caller can act on rather than the least-bad filename
// arriving dressed as a result.
//
// Every failure is non-fatal and named. No key, no network, a refused request,
// a reply in an unexpected shape: the caller is handed no ranking plus the
// reason why, keeps the order the words gave it, and reports which of the two
// it used. A drawing search must never be the reason a lesson does not build,
// and a silent drop back to alphabetical order is the exact failure this
// module exists to end - it looks identical to a search that worked.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const https = require("node:https");

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";

// The key is a credential, not a library path. It is read from the environment
// first, the way the vendor's own tools expect, and otherwise from one file in
// the user's home - the ordinary place a credential lives, and outside every
// repository here, so it cannot be committed by accident.
const KEY_VARIABLE = "TYPESAFE_API_KEY";
const KEY_FILE_VARIABLE = "TYPESAFE_KEY_FILE";
const DEFAULT_KEY_FILE = ".typesafe-key.txt";

// The pool has to be big enough to contain the answer, and each request has to
// stay small enough to judge well. Those pull in opposite directions.
//
// Big enough: 367 names tied for top place on the first request tried here, and
// the two that were plainly right sat at `g` and `w`, so any pool that keeps
// only the alphabet's first hundred-odd throws them away again - which is the
// bug this module exists to fix, reappearing one layer further in.
//
// Small enough: the model's own published jagged edges say accuracy falls as
// the state grows with content unrelated to the decision, and 400 drawing names
// for one slide are mostly unrelated by definition.
//
// So the pool is judged in batches, each batch the size the vendor's own
// examples rank well, all of them in flight at once. The best few from each
// batch then meet in one final round. Four or five small questions per picture
// instead of one big one, still a fraction of a penny, and the round trips
// overlap so it costs about two.
const MAX_CANDIDATES = 400;
const BATCH_SIZE = 100;
const SURVIVORS_PER_BATCH = 3;
const REQUEST_TIMEOUT_MS = 20000;

const BEST = "best";
const FITS = "anythingFits";

function environment(source) {
  return source || process.env;
}

function apiKey(env) {
  const source = environment(env);
  const direct = (source[KEY_VARIABLE] || "").trim();
  if (direct) return { key: direct, from: `$${KEY_VARIABLE}` };

  const configured = (source[KEY_FILE_VARIABLE] || "").trim();
  const home = source.USERPROFILE || source.HOME || os.homedir();
  const file = configured ? path.resolve(configured) : path.join(home, DEFAULT_KEY_FILE);

  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (_) {
    return { key: null, reason: `no key in $${KEY_VARIABLE}, and no file to read at ${file}` };
  }
  const key = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#"));
  if (!key) return { key: null, reason: `${file} is empty` };
  // The file ships as a placeholder line, and a placeholder sent as a key comes
  // back as a refusal from the service, which reads like a broken integration
  // rather than an unfinished setup.
  if (/paste|your-key/i.test(key)) {
    return { key: null, reason: `${file} still holds the placeholder line, not a key` };
  }
  return { key, from: file };
}

function labelOf(libraryId) {
  const file = libraryId.slice(libraryId.lastIndexOf("/") + 1);
  return file.replace(/\.svg$/, "").replace(/-/g, " ");
}

// The same drawing exists in up to three styles under the same name, and the
// caller has already filtered to the styles it wants. Ranking the duplicates
// would spend shortlist places on one drawing three times over, which is how
// today's search offers a cartoon and a standard chicken coop in the same
// twelve.
function uniqueByLabel(candidates) {
  const seen = new Map();
  for (const candidate of candidates || []) {
    if (!candidate || !candidate.libraryId) continue;
    const label = candidate.label || labelOf(candidate.libraryId);
    if (!seen.has(label)) seen.set(label, { ...candidate, label });
  }
  return [...seen.values()];
}

function questionsFor(labels) {
  const criteria = {};
  for (const label of labels) criteria[label] = null;
  return {
    [BEST]: {
      type: "choice",
      instructions:
        "One slide in a lesson for primary school children needs a single drawing. " +
        "`pictureRequest` says what that drawing has to show. Every option is the whole " +
        "description of one drawing that is available. Choose the drawing whose subject " +
        "and action are the ones the request describes. A drawing that shows the same " +
        "idea in another form still answers the request; a drawing that only shares a " +
        "word with it does not, because the drawing sits beside the teaching and a child " +
        "who looks at the wrong subject learns nothing from it.",
      criteria,
    },
    [FITS]: {
      type: "noul",
      instructions:
        "Does at least one of the drawings listed in `drawings` show what `pictureRequest` asks for?",
      criteria: {
        true:
          "At least one drawing shows the subject and action the request describes, closely " +
          "enough that a teacher would be glad to put it on that slide.",
        false:
          "Every drawing in the list is about something else. Some may share a word with the " +
          "request, or belong to the same broad subject, while none of them shows the thing " +
          "the request asks for.",
      },
    },
  };
}

function postJson(body, key, { timeoutMs = REQUEST_TIMEOUT_MS, endpoint = ENDPOINT } = {}) {
  return new Promise((resolve) => {
    let payload;
    try {
      payload = Buffer.from(JSON.stringify(body), "utf8");
    } catch (error) {
      resolve({ error: `the request could not be written: ${error.message}` });
      return;
    }
    const request = https.request(
      endpoint,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": payload.length,
          authorization: `Bearer ${key}`,
        },
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          if (response.statusCode !== 200) {
            resolve({
              error: `the ranking service answered ${response.statusCode}: ${text.slice(0, 300)}`,
            });
            return;
          }
          try {
            resolve({ body: JSON.parse(text) });
          } catch (_) {
            resolve({ error: "the ranking service answered with something that is not JSON" });
          }
        });
      }
    );
    request.setTimeout(timeoutMs, () => {
      request.destroy();
      resolve({ error: `the ranking service did not answer within ${timeoutMs} ms` });
    });
    request.on("error", (error) => resolve({ error: error.message }));
    request.end(payload);
  });
}

function batches(items, size) {
  const out = [];
  for (let start = 0; start < items.length; start += size) out.push(items.slice(start, start + size));
  return out;
}

// Meaning first, then the words' own score, then the name. The tail keeps two
// drawings the model genuinely cannot separate in a stable order rather than a
// random one.
function bySense(left, right) {
  return (
    right.sense - left.sense ||
    (right.score || 0) - (left.score || 0) ||
    left.libraryId.localeCompare(right.libraryId)
  );
}

async function askOneRound(description, group, key, post) {
  const labels = group.map((candidate) => candidate.label);
  const { body: answer, error } = await post(
    {
      model: MODEL,
      state: { pictureRequest: description, drawings: labels },
      questions: questionsFor(labels),
    },
    key
  );
  if (error) return { error };

  const answers = (answer && answer.answers) || {};
  const best = answers[BEST];
  const fits = answers[FITS];
  if (!best || !best.probabilities || typeof best.probabilities !== "object") {
    return { error: "an answer came back carrying no ranking" };
  }
  const scored = group
    .map((candidate) => ({
      ...candidate,
      sense:
        typeof best.probabilities[candidate.label] === "number"
          ? Math.round(best.probabilities[candidate.label] * 10000) / 10000
          : 0,
    }))
    .sort(bySense);
  return {
    scored,
    chose: best.choice,
    confidence: typeof best.confidence === "number" ? best.confidence : null,
    anythingFits: fits && typeof fits.noul === "number" ? fits.noul : null,
    usage: (answer && answer.usage) || null,
  };
}

async function rankBySense({ about, candidates, env, limit, post = postJson } = {}) {
  const description = (about || "").trim();
  if (!description) {
    return { ranked: null, reason: "nothing described what the picture has to show" };
  }
  const pool = uniqueByLabel(candidates);
  if (pool.length < 2) {
    return { ranked: null, reason: "fewer than two drawings to choose between" };
  }

  const { key, reason, from } = apiKey(env);
  if (!key) return { ranked: null, reason };

  const considered = pool.slice(0, MAX_CANDIDATES);
  const groups = batches(considered, BATCH_SIZE);
  const rounds = await Promise.all(groups.map((group) => askOneRound(description, group, key, post)));

  const usage = { input_tokens: 0, output_tokens: 0, requests: 0 };
  const add = (round) => {
    usage.requests += 1;
    if (round.usage) {
      usage.input_tokens += round.usage.input_tokens || 0;
      usage.output_tokens += round.usage.output_tokens || 0;
    }
  };

  const heats = rounds.filter((round) => round.scored);
  if (!heats.length) {
    const first = rounds.find((round) => round.error);
    return { ranked: null, reason: (first && first.error) || "no round of ranking came back" };
  }
  heats.forEach(add);

  // One batch is the whole pool, so its order is the answer.
  if (heats.length === 1) {
    const only = heats[0];
    return {
      ranked: typeof limit === "number" ? only.scored.slice(0, limit) : only.scored,
      chose: only.chose,
      confidence: only.confidence,
      anythingFits: only.anythingFits,
      considered: considered.length,
      rounds: 1,
      keyFrom: from,
      usage,
    };
  }

  // Otherwise the best few of each batch meet, and the rest keep their places
  // behind them so the caller still has a full list to fall back through.
  const finalists = heats.flatMap((round) => round.scored.slice(0, SURVIVORS_PER_BATCH));
  const alsoRan = heats.flatMap((round) => round.scored.slice(SURVIVORS_PER_BATCH)).sort(bySense);
  const final = await askOneRound(description, finalists, key, post);
  if (!final.scored) {
    // The heats still beat the alphabet, so their combined order stands rather
    // than throwing the work away over a lost final round.
    const combined = [...finalists.sort(bySense), ...alsoRan];
    return {
      ranked: typeof limit === "number" ? combined.slice(0, limit) : combined,
      chose: combined[0] && combined[0].label,
      confidence: null,
      anythingFits: Math.max(...heats.map((round) => round.anythingFits || 0)),
      considered: considered.length,
      rounds: heats.length,
      note: `the final round did not come back (${final.error}), so the heats decided the order`,
      keyFrom: from,
      usage,
    };
  }
  add(final);

  const ordered = [...final.scored, ...alsoRan];
  return {
    ranked: typeof limit === "number" ? ordered.slice(0, limit) : ordered,
    chose: final.chose,
    confidence: final.confidence,
    anythingFits: final.anythingFits,
    considered: considered.length,
    rounds: heats.length + 1,
    keyFrom: from,
    usage,
  };
}

module.exports = {
  BATCH_SIZE,
  ENDPOINT,
  KEY_VARIABLE,
  KEY_FILE_VARIABLE,
  DEFAULT_KEY_FILE,
  MAX_CANDIDATES,
  MODEL,
  apiKey,
  labelOf,
  postJson,
  questionsFor,
  rankBySense,
  uniqueByLabel,
};
