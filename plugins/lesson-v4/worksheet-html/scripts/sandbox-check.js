#!/usr/bin/env node
"use strict";

// Stage 0. Answers one question: can this machine turn HTML into a true A4
// PDF with a headless browser? Prints a verdict and exits non-zero on failure
// so a scheduled run reports it clearly.
//
// Run with: npm run sandbox-check

const { findChrome, htmlToPdf, candidatePaths } = require("../src/chrome");

async function main() {
  console.log(`platform: ${process.platform}`);
  console.log(`node: ${process.version}`);

  let exe;
  try {
    exe = findChrome();
  } catch (err) {
    console.error("SANDBOX CHECK: FAILED - no browser available.");
    console.error(`paths tried:\n  ${candidatePaths().join("\n  ")}`);
    process.exit(1);
  }
  console.log(`chrome: ${exe}`);

  const pdf = await htmlToPdf(
    "<style>@page{size:A4}</style><h1>sandbox check</h1>"
  );

  // A PDF starts with %PDF and an A4 page is a few kilobytes at minimum.
  const looksLikePdf = pdf.subarray(0, 4).toString() === "%PDF";
  if (!looksLikePdf || pdf.length < 500) {
    console.error(
      `SANDBOX CHECK: FAILED - produced ${pdf.length} bytes that do not look like a PDF.`
    );
    process.exit(1);
  }

  console.log(`pdf: ${pdf.length} bytes`);
  console.log("SANDBOX CHECK: PASSED - headless printing works here.");
}

main().catch((err) => {
  console.error("SANDBOX CHECK: FAILED - unexpected error.");
  console.error(err);
  process.exit(1);
});
