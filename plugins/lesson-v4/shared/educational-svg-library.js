"use strict";

// Where the drawing library is, what is in it, and how one drawing arrives.
//
// The library is 135,610 files and about 940 MB. It used to be copied into the
// plugin, which put every one of those files into the history of the repository
// people install from, so every install downloaded the whole set for ever after
// - including long after the files themselves had been deleted again. It was
// then pointed at one particular checkout on one particular machine, which
// worked on that machine and nowhere else.
//
// So the library lives in its own repository that no install ever clones. The
// plugin ships the index of drawing names, because a name is a drawing's entire
// description and searching never opens a file. Choosing a drawing fetches that
// one file into a cache outside the plugin, where it survives every reinstall.
//
// A full local copy still wins when one is configured, so the library can be
// worked on, or used with no network, without changing anything else.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");
const https = require("node:https");
const { execFileSync } = require("node:child_process");

const STYLES = Object.freeze(["standard", "cartoon", "solid"]);
const LIBRARY_ID_RE = /^(?:standard|cartoon|solid)\/[a-z0-9]{2}\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/;

const LOCAL_ROOT_VARIABLE = "LESSON_EDUCATIONAL_SVG_ROOT";
const CACHE_VARIABLE = "LESSON_EDUCATIONAL_SVG_CACHE";
const REPO_VARIABLE = "LESSON_EDUCATIONAL_SVG_REPO";
const REF_VARIABLE = "LESSON_EDUCATIONAL_SVG_REF";
const OFFLINE_VARIABLE = "LESSON_EDUCATIONAL_SVG_OFFLINE";

const DEFAULT_REPO = "DynoDS/educational-svg";
const DEFAULT_REF = "main";
const INDEX_PATH = path.resolve(__dirname, "..", "educational-svg", "index.txt.gz");

const PROBE_TIMEOUT_MS = 6000;
const FETCH_TIMEOUT_MS = 20000;
const MAX_DRAWING_BYTES = 2 * 1024 * 1024;

const STOP_WORDS = new Set([
  "a", "an", "and", "as", "at", "for", "from", "in", "of", "on", "or", "the", "to", "with",
]);

// ---------------------------------------------------------------- locations

function environment(source) {
  return source || process.env;
}

function cacheRoot(env) {
  const configured = (environment(env)[CACHE_VARIABLE] || "").trim();
  if (configured) return path.resolve(configured);
  // Outside the plugin on purpose. A cache inside the package is thrown away by
  // the next reinstall, which is the thing being reinstalled most often here.
  return path.join(os.homedir(), ".educational-svg");
}

function localRoot(env) {
  const configured = (environment(env)[LOCAL_ROOT_VARIABLE] || "").trim();
  return configured ? path.resolve(configured) : null;
}

function hasDrawings(root) {
  const library = path.join(root, "library");
  if (!fs.existsSync(library)) return false;
  return STYLES.some((style) => fs.existsSync(path.join(library, style)));
}

function repository(env) {
  const configured = (environment(env)[REPO_VARIABLE] || "").trim();
  return configured || DEFAULT_REPO;
}

function reference(env) {
  const configured = (environment(env)[REF_VARIABLE] || "").trim();
  return configured || DEFAULT_REF;
}

function offline(env) {
  const configured = (environment(env)[OFFLINE_VARIABLE] || "").trim().toLowerCase();
  return configured === "1" || configured === "true" || configured === "yes";
}

// -------------------------------------------------------------------- index

let indexCache = null;

function indexPath(env) {
  const configured = (environment(env).LESSON_EDUCATIONAL_SVG_INDEX || "").trim();
  return configured ? path.resolve(configured) : INDEX_PATH;
}

function readIndex(env) {
  const file = indexPath(env);
  if (indexCache && indexCache.file === file) return indexCache.ids;
  if (!fs.existsSync(file)) return null;
  let ids;
  try {
    ids = zlib
      .gunzipSync(fs.readFileSync(file))
      .toString("utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (_) {
    return null;
  }
  if (!ids.length) return null;
  indexCache = { file, ids };
  return ids;
}

// A local copy is the authority on itself. Reading its folders costs a moment
// and keeps a working library and its index from drifting apart unnoticed.
function listLocal(root) {
  const ids = [];
  const library = path.join(root, "library");
  for (const style of STYLES) {
    const styleRoot = path.join(library, style);
    if (!fs.existsSync(styleRoot)) continue;
    for (const prefix of fs.readdirSync(styleRoot, { withFileTypes: true })) {
      if (!prefix.isDirectory()) continue;
      for (const entry of fs.readdirSync(path.join(styleRoot, prefix.name), {
        withFileTypes: true,
      })) {
        if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".svg")) continue;
        const id = `${style}/${prefix.name}/${entry.name}`;
        if (LIBRARY_ID_RE.test(id)) ids.push(id);
      }
    }
  }
  return ids.sort();
}

// ------------------------------------------------------------------- github

let tokenCache;

function githubToken(env) {
  if (tokenCache !== undefined) return tokenCache;
  const source = environment(env);
  const direct = (source.GITHUB_TOKEN || source.GH_TOKEN || "").trim();
  if (direct) {
    tokenCache = direct;
    return tokenCache;
  }
  try {
    const printed = execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: PROBE_TIMEOUT_MS,
    }).trim();
    tokenCache = printed || null;
  } catch (_) {
    tokenCache = null;
  }
  return tokenCache;
}

function request(url, { token, timeout, raw }) {
  return new Promise((resolve) => {
    const headers = {
      "User-Agent": "lesson-v4-educational-svg",
      Accept: raw ? "application/vnd.github.raw" : "application/vnd.github+json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const call = https.get(url, { headers, timeout }, (response) => {
      const status = response.statusCode || 0;
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        resolve(request(response.headers.location, { token, timeout, raw }));
        return;
      }
      const chunks = [];
      let size = 0;
      let refused = false;
      response.on("data", (chunk) => {
        size += chunk.length;
        if (size > MAX_DRAWING_BYTES) {
          refused = true;
          response.destroy();
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        if (refused) resolve({ status: 0, body: null, error: "response too large" });
        else resolve({ status, body: Buffer.concat(chunks), error: null });
      });
      response.on("error", (error) => resolve({ status: 0, body: null, error: error.message }));
    });

    call.on("timeout", () => {
      call.destroy();
      resolve({ status: 0, body: null, error: "timed out" });
    });
    call.on("error", (error) => resolve({ status: 0, body: null, error: error.message }));
  });
}

function contentsUrl(env, libraryId) {
  return (
    `https://api.github.com/repos/${repository(env)}/contents/` +
    `library/${libraryId}?ref=${encodeURIComponent(reference(env))}`
  );
}

async function reachable(env) {
  if (offline(env)) return false;
  const answer = await request(`https://api.github.com/repos/${repository(env)}`, {
    token: githubToken(env),
    timeout: PROBE_TIMEOUT_MS,
    raw: false,
  });
  return answer.status === 200;
}

// ------------------------------------------------------------------ resolve

async function resolveLibrary({ env, probe = true } = {}) {
  const source = environment(env);
  const notes = [];

  const configured = localRoot(source);
  if (configured) {
    if (hasDrawings(configured)) {
      return { root: configured, label: `$${LOCAL_ROOT_VARIABLE}`, mode: "local", notes };
    }
    notes.push(`$${LOCAL_ROOT_VARIABLE}: no library/ with drawings under ${configured}`);
  }

  const ids = readIndex(source);
  if (!ids) {
    notes.push(`the shipped index is missing or unreadable at ${indexPath(source)}`);
    return { root: null, label: null, mode: null, notes };
  }

  const cache = cacheRoot(source);
  const fetching = () => {
    // Reporting a root means saying where this run's drawings live, so the
    // folder is made here rather than at the first fetch. Everything
    // downstream - the pass check among them - is entitled to treat a reported
    // root as a real directory.
    try {
      fs.mkdirSync(path.join(cache, "library"), { recursive: true });
    } catch (_) {
      // An unwritable cache is reported by the first fetch that needs it.
    }
    return {
      root: cache,
      label: `${repository(source)} (fetched as needed)`,
      mode: "fetch",
      notes,
    };
  };

  // A warm cache is a working library on its own, so a run with no network
  // still uses every drawing this machine has already fetched rather than
  // reporting the whole layer off.
  if (!probe || hasDrawings(cache)) return fetching();
  if (await reachable(source)) return fetching();

  notes.push(
    `${repository(source)}: could not be reached, and no drawing has been ` +
      `fetched to ${cache} yet`
  );
  return { root: null, label: null, mode: null, notes };
}

// ------------------------------------------------------------------- fetch

function cachedPath(root, libraryId) {
  return path.join(root, "library", ...libraryId.split("/"));
}

function looksLikeUsableSvg(buffer) {
  const text = buffer.toString("utf8");
  return /<svg\b/i.test(text) && /\bviewBox\s*=/i.test(text);
}

async function fetchDrawing(libraryId, { env, root } = {}) {
  const source = environment(env);
  if (!LIBRARY_ID_RE.test(libraryId)) {
    return { path: null, error: `not a library id: ${libraryId}` };
  }

  const home = root || cacheRoot(source);
  const target = cachedPath(home, libraryId);
  if (fs.existsSync(target)) return { path: target, error: null, cached: true };

  if (offline(source)) {
    return { path: null, error: `not cached, and fetching is switched off: ${libraryId}` };
  }

  const answer = await request(contentsUrl(source, libraryId), {
    token: githubToken(source),
    timeout: FETCH_TIMEOUT_MS,
    raw: true,
  });

  if (answer.status !== 200 || !answer.body || !answer.body.length) {
    const reason = answer.error || `HTTP ${answer.status}`;
    return { path: null, error: `could not fetch ${libraryId}: ${reason}` };
  }
  if (!looksLikeUsableSvg(answer.body)) {
    return { path: null, error: `fetched file is not a usable SVG: ${libraryId}` };
  }

  // Written under a private name and moved into place, so a run that reads the
  // cache while another is filling it never sees half a drawing.
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const incoming = `${target}.${process.pid}.${Date.now()}.incoming`;
  fs.writeFileSync(incoming, answer.body);
  try {
    fs.renameSync(incoming, target);
  } catch (error) {
    try {
      fs.unlinkSync(incoming);
    } catch (_) {
      // Another run won the race and its copy is the canonical one.
    }
    if (!fs.existsSync(target)) return { path: null, error: `could not save ${libraryId}` };
  }
  return { path: target, error: null, cached: false };
}

async function fetchDrawings(libraryIds, { env, root, concurrency = 8 } = {}) {
  const queue = [...libraryIds];
  const results = new Map();
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const libraryId = queue.shift();
      results.set(libraryId, await fetchDrawing(libraryId, { env, root }));
    }
  });
  await Promise.all(workers);
  return results;
}

// ------------------------------------------------------------------ search

function normalise(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function stem(token) {
  if (token.length > 5 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function tokens(value) {
  return normalise(value)
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token))
    .map(stem);
}

function scoreLabel(label, query) {
  const labelText = normalise(label);
  const labelTokens = labelText.split(" ").map(stem);
  const labelSet = new Set(labelTokens);
  const queryText = normalise(query);
  const queryTokens = tokens(query);
  if (!queryTokens.length) return 0;

  let score = 0;
  if (labelText === queryText) score += 120;
  else if (labelText.includes(queryText)) score += 70;

  let matched = 0;
  for (const token of queryTokens) {
    if (labelSet.has(token)) {
      score += 18;
      matched += 1;
      continue;
    }
    if (
      labelTokens.some(
        (labelToken) =>
          labelToken.length >= 4 &&
          token.length >= 4 &&
          (labelToken.startsWith(token) || token.startsWith(labelToken))
      )
    ) {
      score += 8;
      matched += 1;
    }
  }

  if (matched === queryTokens.length) score += 35;
  if (!matched) return 0;
  score -= Math.max(0, labelTokens.length - queryTokens.length) * 0.35;
  return score;
}

function searchIds(ids, { queries, styles = [], limit = 12 }) {
  const wanted = styles.length ? new Set(styles) : null;
  const candidates = [];
  for (const libraryId of ids) {
    const slash = libraryId.indexOf("/");
    const style = libraryId.slice(0, slash);
    if (wanted && !wanted.has(style)) continue;
    const fileName = libraryId.slice(libraryId.lastIndexOf("/") + 1);
    const label = fileName.slice(0, -4).replace(/-/g, " ");
    let best = { score: 0, query: null };
    for (const query of queries) {
      const score = scoreLabel(label, query);
      if (score > best.score) best = { score, query };
    }
    if (best.score <= 0) continue;
    candidates.push({
      libraryId,
      style,
      label,
      score: Math.round(best.score * 100) / 100,
      matchedQuery: best.query,
    });
  }
  candidates.sort(
    (left, right) => right.score - left.score || left.libraryId.localeCompare(right.libraryId)
  );
  return candidates.slice(0, limit);
}

function knownIds({ env, root, mode } = {}) {
  if (mode === "local" && root) return listLocal(root);
  return readIndex(env) || [];
}

module.exports = {
  DEFAULT_REPO,
  DEFAULT_REF,
  INDEX_PATH,
  LIBRARY_ID_RE,
  LOCAL_ROOT_VARIABLE,
  CACHE_VARIABLE,
  REPO_VARIABLE,
  OFFLINE_VARIABLE,
  STYLES,
  cacheRoot,
  cachedPath,
  fetchDrawing,
  fetchDrawings,
  hasDrawings,
  indexPath,
  knownIds,
  listLocal,
  normalise,
  readIndex,
  resolveLibrary,
  scoreLabel,
  searchIds,
  stem,
  tokens,
};
