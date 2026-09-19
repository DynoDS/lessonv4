#!/usr/bin/env node
"use strict";

// The drawing library is 261,740 canonical files and about 1.8 GB. Searching it never
// opens a single one of them: a drawing's file name is its entire description,
// so the name list is the whole search surface. That list gzips to a small
// index, which is why the plugin can ship the search and fetch only the
// handful of drawings a lesson actually chooses.
//
// Run this after adding drawings to the library repository, and commit the
// rebuilt index. A drawing missing from the index is invisible; a name in the
// index with no file behind it fetches nothing and closes the picture
// text-only. Neither stops a lesson, and neither is much use either.

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const {
  INDEX_PATH,
  STYLES,
  LIBRARY_ID_RE,
  isLegacySolidAlias,
} = require("../shared/educational-svg-library");

function usage(message) {
  if (message) console.error(message);
  console.error(
    'Usage: node build-educational-svg-index.js --library "<path to library/>" [--out "<index.txt.gz>"]'
  );
  process.exit(2);
}

function parseArgs(argv) {
  const options = { library: null, out: INDEX_PATH };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index + 1];
    if (argv[index] === "--library") {
      if (!value) usage("--library needs a path.");
      options.library = path.resolve(value);
      index += 1;
    } else if (argv[index] === "--out") {
      if (!value) usage("--out needs a path.");
      options.out = path.resolve(value);
      index += 1;
    } else {
      usage(`Unknown option: ${argv[index]}`);
    }
  }
  if (!options.library) usage("--library is required.");
  return options;
}

function collect(libraryRoot) {
  const ids = [];
  const skipped = [];
  const aliases = [];
  for (const style of STYLES) {
    const styleRoot = path.join(libraryRoot, style);
    if (!fs.existsSync(styleRoot)) continue;
    for (const prefix of fs.readdirSync(styleRoot, { withFileTypes: true })) {
      if (!prefix.isDirectory()) continue;
      const prefixRoot = path.join(styleRoot, prefix.name);
      for (const entry of fs.readdirSync(prefixRoot, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".svg")) continue;
        const id = `${style}/${prefix.name}/${entry.name}`;
        // A path the resolver would later refuse is worse in the index than
        // absent from it: it searches, ranks and gets chosen, then fails at the
        // one point where the picture was supposed to arrive.
        if (LIBRARY_ID_RE.test(id) && !isLegacySolidAlias(id, libraryRoot)) ids.push(id);
        else if (LIBRARY_ID_RE.test(id)) aliases.push(id);
        else skipped.push(id);
      }
    }
  }
  return { ids: [...new Set(ids)].sort(), skipped, aliases };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(options.library) || !fs.statSync(options.library).isDirectory()) {
    console.error(`Library folder is not there: ${options.library}`);
    process.exit(1);
  }

  const { ids, skipped, aliases } = collect(options.library);
  if (!ids.length) {
    console.error(`No drawings found under ${options.library}`);
    process.exit(1);
  }

  // gzip rather than a denser codec so both the Node search and the Python
  // pass check read the index with nothing installed.
  const packed = zlib.gzipSync(Buffer.from(`${ids.join("\n")}\n`, "utf8"), { level: 9 });
  fs.mkdirSync(path.dirname(options.out), { recursive: true });
  fs.writeFileSync(options.out, packed);

  console.log(`EDUCATIONAL_SVG_INDEX: ${options.out}`);
  console.log(`drawings: ${ids.length}`);
  console.log(`size: ${(packed.length / 1024).toFixed(1)} KB`);
  if (skipped.length) {
    console.log(`skipped ${skipped.length} unusable path(s), first: ${skipped[0]}`);
  }
  if (aliases.length) {
    console.log(`ignored ${aliases.length} legacy standard/solid alias path(s)`);
  }
}

if (require.main === module) main();

module.exports = { collect };
