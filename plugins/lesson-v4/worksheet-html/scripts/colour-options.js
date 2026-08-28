#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { htmlToPdf } = require("../src/chrome");
const { buildColourOptionsHtml } = require("../studio/colour-options");

async function main() {
  const out = path.join(__dirname, "..", "out");
  fs.mkdirSync(out, { recursive: true });

  const html = buildColourOptionsHtml();
  fs.writeFileSync(path.join(out, "colour-options.html"), html);
  fs.writeFileSync(path.join(out, "colour-options.pdf"), await htmlToPdf(html));

  console.log(`Written:\n  ${path.join(out, "colour-options.html")}\n  ${path.join(out, "colour-options.pdf")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
