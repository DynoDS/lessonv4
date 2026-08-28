#!/usr/bin/env node
"use strict";

// Make this machine able to turn the worksheet's HTML into a PDF.
//
//   node scripts/ensure-chrome.js
//
// Three steps, each skipped when already done:
//   1. the PDF packages (puppeteer-core, pdf-lib) - `npm install` if missing
//   2. a Chrome - the one already on the machine if there is one
//   3. otherwise, download the official chrome-headless-shell (about 100MB,
//      needs the network) into worksheet-html/.chrome, where findChrome
//      looks on its own - no CHROME_PATH needed afterwards.
//
// Ends with `CHROME: <path>` on success or `ENSURE_CHROME_FAILED: <reason>`
// on failure. A failure changes nothing: the HTML-only build still works,
// so running this can never make things worse.

const path = require("node:path");
const { execSync } = require("node:child_process");

const pkgRoot = path.join(__dirname, "..");
const cacheDir = path.join(pkgRoot, ".chrome");

function run(command) {
  execSync(command, { cwd: pkgRoot, stdio: "inherit" });
}

function tryFindChrome() {
  try {
    return require("../src/chrome").findChrome();
  } catch {
    return null;
  }
}

function main() {
  // The packages first, even when a Chrome exists: "PDF-capable" means both.
  try {
    require.resolve("puppeteer-core");
    require.resolve("pdf-lib");
  } catch {
    console.log("Installing the PDF packages...");
    run("npm install --no-audit --no-fund");
  }

  const already = tryFindChrome();
  if (already) {
    console.log(`CHROME: ${already}`);
    return;
  }

  console.log("No Chrome here. Downloading chrome-headless-shell (about 100MB)...");
  run(
    `npx --yes @puppeteer/browsers install chrome-headless-shell@stable --path "${cacheDir}"`
  );

  const found = tryFindChrome();
  if (!found) {
    throw new Error(
      "the download finished but no usable binary was found in " + cacheDir
    );
  }
  console.log(`CHROME: ${found}`);
}

try {
  main();
} catch (e) {
  console.log(`ENSURE_CHROME_FAILED: ${e.message.split("\n")[0]}`);
  console.log(
    "The HTML files the build writes are still the worksheet: open each in " +
      "Chrome and print at 100% scale, margins None."
  );
  process.exitCode = 1;
}
