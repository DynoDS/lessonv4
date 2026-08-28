#!/usr/bin/env node
"use strict";

// The showcase as ONE file rather than a dozen.
//
//   npm run showcase-book
//
// Twelve separate PDFs mean twelve print jobs and twelve windows to flick
// between. This stitches the same pages into a single scrollable document that
// prints in one go, with each page still at true A4 size so what comes out of
// the printer is what a child would actually get.
//
// Run `npm run showcase` first: this reads the HTML it produced rather than
// rebuilding the pages, so the two can never show different things.

const fs = require("node:fs");
const path = require("node:path");

const { htmlToPdf } = require("../src/chrome");

const OUT = path.join(__dirname, "..", "out", "showcase");

// Each page's HTML is a whole document. Only the body and the style block are
// wanted, and the styles are identical across pages, so one copy is enough.
function partsOf(html) {
  const style = /<style>([\s\S]*?)<\/style>/.exec(html);
  const body = /<body>([\s\S]*?)<\/body>/.exec(html);
  const title = /<div class="lo">([\s\S]*?)<\/div>/.exec(html);
  return {
    style: style ? style[1] : "",
    body: body ? body[1] : "",
    title: title ? title[1].trim() : "",
  };
}

async function main() {
  const pages = fs
    .readdirSync(OUT)
    .filter((f) => f.endsWith(".html"))
    .sort();

  if (!pages.length) {
    console.log("No showcase pages found. Run `npm run showcase` first.");
    process.exitCode = 1;
    return;
  }

  const parsed = pages.map((f) => ({
    file: f,
    ...partsOf(fs.readFileSync(path.join(OUT, f), "utf8")),
  }));

  // Each page keeps its own A4 box and breaks after itself, so the stitched
  // document still prints one sheet per page rather than reflowing into a
  // continuous ribbon.
  const sheets = parsed
    .map(
      (p, i) => `
  <section class="sheet">
    <div class="sheet-num">${i + 1} of ${parsed.length}</div>
    ${p.body}
  </section>`
    )
    .join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Worksheet helpers at true size</title>
<style>
${parsed[0].style}

  /* The stitched view. On screen the sheets sit on a grey background so the
     paper's edge is visible; in print the background drops away and each sheet
     takes its own page. */
  html, body { width: auto; height: auto; padding: 0; background: #6b7280; }

  .sheet {
    position: relative;
    width: 210mm;
    height: 297mm;
    padding: 15mm;
    box-sizing: border-box;
    background: white;
    margin: 8mm auto;
    box-shadow: 0 2mm 6mm rgba(0,0,0,0.35);
    overflow: hidden;
  }

  .sheet-num {
    position: absolute; right: 15mm; top: 5mm;
    font-size: var(--type-note); color: var(--colour-quiet);
  }

  @media print {
    html, body { background: white; }
    .sheet {
      margin: 0; box-shadow: none;
      break-after: page; page-break-after: always;
    }
    .sheet:last-child { break-after: auto; page-break-after: auto; }
  }
</style></head>
<body>${sheets}</body></html>`;

  const htmlPath = path.join(OUT, "..", "showcase-book.html");
  fs.writeFileSync(htmlPath, html);
  fs.writeFileSync(
    path.join(OUT, "..", "showcase-book.pdf"),
    await htmlToPdf(html)
  );

  console.log(`${parsed.length} pages stitched into:`);
  console.log(`  ${htmlPath}`);
  console.log(`  ${htmlPath.replace(/\.html$/, ".pdf")}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
