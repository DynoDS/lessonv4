"use strict";

// Where the drawing library is, what is in it, and how one drawing arrives.
//
// The library is 261,740 canonical files and about 1.8 GB. It used to be copied into the
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
const transport = require("./github-file-fetch");
const { proxyFor } = transport;

const STYLES = Object.freeze(["standard", "cartoon", "solid", "inkbrush", "blockprint"]);
const STYLE_PREFERENCE = Object.freeze(["standard", "cartoon", "solid", "inkbrush", "blockprint"]);
const LIBRARY_ID_RE = /^(?:standard|cartoon|solid|inkbrush|blockprint)\/[a-z0-9]{1,2}\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/;
const LEGACY_SOLID_ALIAS_RE = /^standard\/[a-z0-9]{1,2}\/solid-[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/;

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

// Before the library had a canonical Solid folder, 1,461 Solid files were
// copied into standard/ with a `solid-` filename prefix. Keep those paths
// readable for old lesson records, but do not list them as extra drawings when
// the canonical solid/<prefix>/<name>.svg exists with the same bytes. A few
// genuine Original drawings also happen to begin with "solid-", so the byte
// check is intentional rather than treating the prefix alone as an alias.
function isLegacySolidAlias(libraryId, libraryRoot) {
  if (!LEGACY_SOLID_ALIAS_RE.test(libraryId) || !libraryRoot) return false;
  const parts = libraryId.split("/");
  const filename = parts[2];
  const slug = filename.slice(0, -4).replace(/^solid-/, "");
  const prefix = slug.replace(/[^a-z0-9]/g, "").slice(0, 2);
  const aliasPath = path.join(libraryRoot, ...parts);
  const canonicalPath = path.join(libraryRoot, "solid", prefix, `${slug}.svg`);
  try {
    return (
      fs.existsSync(canonicalPath) &&
      fs.readFileSync(aliasPath).equals(fs.readFileSync(canonicalPath))
    );
  } catch (_) {
    return false;
  }
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
        if (LIBRARY_ID_RE.test(id) && !isLegacySolidAlias(id, library)) ids.push(id);
      }
    }
  }
  return ids.sort();
}

// ------------------------------------------------------------------- github

function contentsUrl(env, libraryId) {
  return transport.contentsUrl(repository(env), reference(env), `library/${libraryId}`);
}

function rawUrl(env, libraryId) {
  return transport.rawUrl(repository(env), reference(env), `library/${libraryId}`);
}

// The transport tries the plain file address first and the API second, so a
// private library still arrives and a public one does not spend the API
// allowance. See shared/github-file-fetch.js.
async function download(env, libraryId, timeout) {
  return transport.downloadFile({
    repository: repository(env),
    reference: reference(env),
    filePath: `library/${libraryId}`,
    timeout,
    env,
    userAgent: "lesson-v4-educational-svg",
    maxBytes: MAX_DRAWING_BYTES,
  });
}

async function reachable(env) {
  if (offline(env)) return { ok: false, reasons: ["fetching is switched off"] };
  const ids = readIndex(env) || [];
  if (!ids.length) return { ok: false, reasons: ["no drawing named in the index to test with"] };
  const { answer, reasons } = await download(env, ids[0], PROBE_TIMEOUT_MS);
  return { ok: Boolean(answer), reasons };
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
  const probed = await reachable(source);
  if (probed.ok) return fetching();

  const proxy = proxyFor(rawUrl(source, "standard/aa/a.svg"), source);
  notes.push(
    `${repository(source)}: could not be reached (${probed.reasons.join("; ")}` +
      `${proxy ? `; through proxy ${proxy.host}` : ""}), and no drawing has been ` +
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

  const { answer, reasons } = await download(source, libraryId, FETCH_TIMEOUT_MS);
  if (!answer) {
    return { path: null, error: `could not fetch ${libraryId}: ${reasons.join("; ")}` };
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
  candidates.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    const leftStyle = STYLE_PREFERENCE.indexOf(left.style);
    const rightStyle = STYLE_PREFERENCE.indexOf(right.style);
    if (leftStyle !== rightStyle) return leftStyle - rightStyle;
    return left.libraryId.localeCompare(right.libraryId);
  });
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
  STYLE_PREFERENCE,
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
  isLegacySolidAlias,
  indexPath,
  knownIds,
  listLocal,
  normalise,
  proxyFor,
  readIndex,
  resolveLibrary,
  scoreLabel,
  searchIds,
  stem,
  tokens,
};
