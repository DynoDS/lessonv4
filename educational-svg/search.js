#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const LIBRARY_ROOT = path.join(__dirname, "library");
const STYLE_NAMES = new Set(["standard", "cartoon", "solid"]);
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

function usage(message) {
  if (message) console.error(message);
  console.error(
    'Usage: node search.js --query "lit candle" [--query "candle flame"] [--style standard,cartoon,solid] [--limit 12]'
  );
  process.exit(2);
}

function parseArgs(argv) {
  const options = { queries: [], styles: [], limit: 12 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === "--query") {
      if (!value) usage("--query needs text.");
      options.queries.push(value.trim());
      index += 1;
    } else if (arg === "--style") {
      if (!value) usage("--style needs a value.");
      options.styles.push(
        ...value
          .split(",")
          .map((entry) => entry.trim().toLowerCase())
          .filter(Boolean)
      );
      index += 1;
    } else if (arg === "--limit") {
      if (!value || !/^\d+$/.test(value)) usage("--limit needs a whole number.");
      options.limit = Number(value);
      index += 1;
    } else {
      usage(`Unknown option: ${arg}`);
    }
  }

  options.queries = [...new Set(options.queries.filter(Boolean))];
  options.styles = [...new Set(options.styles)];
  if (!options.queries.length) usage("At least one --query is required.");
  if (options.queries.length > 6) usage("Use no more than six queries.");
  if (options.styles.some((style) => !STYLE_NAMES.has(style))) {
    usage("--style must use standard, cartoon, or solid.");
  }
  if (options.limit < 1 || options.limit > 30) {
    usage("--limit must be from 1 to 30.");
  }
  return options;
}

function normalise(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
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

function listSvgFiles(root, styles) {
  const results = [];
  const selectedStyles = styles.length ? styles : [...STYLE_NAMES];
  for (const style of selectedStyles) {
    const styleRoot = path.join(root, style);
    if (!fs.existsSync(styleRoot)) continue;
    for (const prefix of fs.readdirSync(styleRoot, { withFileTypes: true })) {
      if (!prefix.isDirectory()) continue;
      const prefixRoot = path.join(styleRoot, prefix.name);
      for (const entry of fs.readdirSync(prefixRoot, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.toLowerCase().endsWith(".svg")) {
          results.push({
            style,
            prefix: prefix.name,
            fileName: entry.name,
            sourcePath: path.join(prefixRoot, entry.name),
          });
        }
      }
    }
  }
  return results;
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

function search(options, libraryRoot = LIBRARY_ROOT) {
  const started = process.hrtime.bigint();
  if (!fs.existsSync(libraryRoot) || !fs.statSync(libraryRoot).isDirectory()) {
    return {
      available: false,
      reason: "The fixed educational SVG library folder is not available.",
      libraryRoot,
      candidates: [],
      elapsedMs: Number(process.hrtime.bigint() - started) / 1e6,
    };
  }

  const candidates = [];
  for (const entry of listSvgFiles(libraryRoot, options.styles)) {
    const label = path.basename(entry.fileName, ".svg").replace(/-/g, " ");
    let best = { score: 0, query: null };
    for (const query of options.queries) {
      const score = scoreLabel(label, query);
      if (score > best.score) best = { score, query };
    }
    if (best.score <= 0) continue;
    const libraryId = [entry.style, entry.prefix, entry.fileName].join("/");
    candidates.push({
      libraryId,
      style: entry.style,
      label,
      score: Math.round(best.score * 100) / 100,
      matchedQuery: best.query,
      sourcePath: entry.sourcePath,
    });
  }

  candidates.sort(
    (left, right) =>
      right.score - left.score || left.libraryId.localeCompare(right.libraryId)
  );
  return {
    available: true,
    queries: options.queries,
    styles: options.styles.length ? options.styles : [...STYLE_NAMES],
    candidates: candidates.slice(0, options.limit),
    elapsedMs: Number(process.hrtime.bigint() - started) / 1e6,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = search(options);
  const marker = result.available
    ? "EDUCATIONAL_SVG_SEARCH"
    : "EDUCATIONAL_SVG_UNAVAILABLE";
  console.log(`${marker}: ${JSON.stringify(result)}`);
}

if (require.main === module) main();

module.exports = {
  LIBRARY_ROOT,
  listSvgFiles,
  normalise,
  parseArgs,
  scoreLabel,
  search,
  stem,
  tokens,
};
