#!/usr/bin/env node
"use strict";

// Search the shared drawing library and put the candidates on this machine.
//
// Searching reads the shipped index of names, so it costs nothing and returns
// the same ranking whether or not the drawings themselves are here yet. The
// command then fetches the drawings it is about to name, because a candidate
// that cannot be looked at is not a candidate: the caller's very next step is
// to render these paths onto a preview sheet and choose between them.
//
// A drawing that cannot be fetched is reported on its own line and left out of
// `candidates`, so a shortlist is always a list of drawings that really are
// here. That keeps the caller's existing fallback correct without it having to
// know anything about the network.
//
// `--no-fetch` asks a different question: what does the index rank for these
// words, touching nothing. That is what the pass check needs, because it is
// re-running a search a designer already ran in order to verify what was
// claimed about it, and a verification that changes its answer with the
// network is not one. A designer never passes it.

const {
  LIBRARY_ID_RE,
  STYLES,
  cachedPath,
  fetchDrawings,
  knownIds,
  resolveLibrary,
  searchIds,
} = require("../shared/educational-svg-library");
const { MAX_CANDIDATES, rankBySense } = require("../shared/educational-svg-rank");

// How wide the words cast the net before meaning puts it in order.
//
// This is not a tuning knob, it is the whole point. The words score hundreds of
// names identically and then hand over whichever ones the alphabet reached
// first, so a narrow net is a narrow alphabet. Gathering names costs nothing at
// all - no file is opened, the index is already in memory - so the net is as
// wide as the ranking will take, and the ranking decides what the caller sees.
const NET = MAX_CANDIDATES;

function usage(message) {
  if (message) console.error(message);
  console.error(
    'Usage: node search-educational-svg.js --query "lit candle" [--query "candle flame"] ' +
      '[--about "what the picture has to show"] ' +
      "[--style standard,cartoon,solid,inkbrush,blockprint] [--limit 12] [--no-fetch]"
  );
  process.exit(2);
}

function parseArgs(argv) {
  const options = { queries: [], styles: [], limit: 12, fetch: true, about: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === "--query") {
      if (!value) usage("--query needs text.");
      options.queries.push(value.trim());
      index += 1;
    } else if (arg === "--about") {
      // What the picture has to show, in the designer's own words. The queries
      // stay as they are: they are search terms, and this is the requirement
      // they were an attempt at.
      if (!value) usage("--about needs text.");
      options.about = value.trim();
      index += 1;
    } else if (arg === "--style") {
      if (!value) usage("--style needs a value.");
      options.styles.push(
        ...value.split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean)
      );
      index += 1;
    } else if (arg === "--limit") {
      if (!value || !/^\d+$/.test(value)) usage("--limit needs a whole number.");
      options.limit = Number(value);
      index += 1;
    } else if (arg === "--no-fetch") {
      options.fetch = false;
    } else {
      usage(`Unknown option: ${arg}`);
    }
  }

  options.queries = [...new Set(options.queries.filter(Boolean))];
  options.styles = [...new Set(options.styles)];
  if (!options.queries.length) usage("At least one --query is required.");
  if (options.queries.length > 6) usage("Use no more than six queries.");
  if (options.styles.some((style) => !STYLES.includes(style))) {
    usage("--style must use standard, cartoon, solid, inkbrush, or blockprint.");
  }
  if (options.limit < 1 || options.limit > 30) usage("--limit must be from 1 to 30.");
  return options;
}

async function main() {
  const started = process.hrtime.bigint();
  const options = parseArgs(process.argv.slice(2));
  // Ranking needs the index and nothing else, so an index-only run neither
  // probes the library nor fails when it cannot be reached.
  const library = await resolveLibrary({ probe: options.fetch });

  if (!library.root) {
    console.log(
      `EDUCATIONAL_SVG_UNAVAILABLE: ${JSON.stringify({
        available: false,
        reason: library.notes.join("; ") || "the drawing library is not available.",
        candidates: [],
      })}`
    );
    return;
  }

  const ids = knownIds({ root: library.root, mode: library.mode });

  // Words cast the net, meaning puts it in order. With no `--about` there is
  // nothing to rank against, so this is exactly the search it always was.
  const byWords = searchIds(ids, { ...options, limit: options.about ? NET : options.limit });
  let ranked = byWords.slice(0, options.limit);
  const ordering = { ranking: "words", consideredByWords: byWords.length };

  if (options.about) {
    const sense = await rankBySense({
      about: options.about,
      candidates: byWords,
      limit: options.limit,
    });
    if (sense.ranked) {
      ranked = sense.ranked;
      ordering.ranking = "meaning";
      ordering.considered = sense.considered;
      ordering.rounds = sense.rounds;
      if (sense.note) ordering.rankingNote = sense.note;
      ordering.chose = sense.chose;
      ordering.rankConfidence = sense.confidence;
      ordering.anythingFits = sense.anythingFits;
      if (sense.usage) ordering.rankUsage = sense.usage;
    } else {
      // Named, never silent. A shortlist back in alphabetical order looks
      // exactly like a shortlist that was chosen, so the reason travels with it.
      ordering.rankingNote = `ranked by words, not meaning: ${sense.reason}`;
    }
  }

  const unavailable = [];
  let candidates = ranked.map((entry) => ({
    ...entry,
    sourcePath: cachedPath(library.root, entry.libraryId),
  }));

  if (options.fetch && ranked.length && library.mode === "fetch") {
    const fetched = await fetchDrawings(
      ranked.map((entry) => entry.libraryId),
      { root: library.root }
    );
    candidates = [];
    for (const entry of ranked) {
      const result = fetched.get(entry.libraryId);
      if (result && result.path) {
        candidates.push({ ...entry, sourcePath: result.path });
      } else {
        unavailable.push({ libraryId: entry.libraryId, reason: result ? result.error : "not fetched" });
      }
    }
  }

  const payload = {
    available: true,
    queries: options.queries,
    about: options.about,
    ...ordering,
    styles: options.styles.length ? options.styles : [...STYLES],
    libraryRoot: library.root,
    librarySource: library.label,
    candidates,
    elapsedMs: Number(process.hrtime.bigint() - started) / 1e6,
  };
  if (unavailable.length) payload.unavailable = unavailable;

  console.log(`EDUCATIONAL_SVG_SEARCH: ${JSON.stringify(payload)}`);
  if (ordering.rankingNote) console.log(`EDUCATIONAL_SVG_RANKING: ${ordering.rankingNote}`);
  for (const entry of unavailable) {
    console.log(`EDUCATIONAL_SVG_NOT_FETCHED: ${entry.libraryId} - ${entry.reason}`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
}

module.exports = { parseArgs, LIBRARY_ID_RE };
