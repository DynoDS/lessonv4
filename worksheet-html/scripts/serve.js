#!/usr/bin/env node
"use strict";

// A small local server for the studio, so there is one tab to keep open and
// refresh rather than a file path to re-open. It rebuilds the page on every
// request, so changing a layout and hitting refresh is the whole loop.

const http = require("node:http");

const { buildGalleryHtml } = require("../studio/gallery");

const PORT = Number(process.env.PORT) || 4173;

const ROUTES = {
  "/": buildGalleryHtml,
  "/layouts": buildGalleryHtml,
};

const server = http.createServer((req, res) => {
  const path = (req.url || "/").split("?")[0];
  const build = ROUTES[path];

  if (!build) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Not found. Try ${Object.keys(ROUTES).join("  ")}`);
    return;
  }

  try {
    // Rebuilt per request, and the modules are re-read, so an edit shows up on
    // a plain refresh with no restart.
    for (const key of Object.keys(require.cache)) {
      if (key.includes("worksheet-html") && !key.includes("node_modules")) {
        delete require.cache[key];
      }
    }
    const fresh = require("../studio/gallery");
    const html = fresh.buildGalleryHtml();

    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Build failed:\n\n${err && err.stack ? err.stack : err}`);
  }
});

server.listen(PORT, () => {
  console.log(`Layout library:  http://localhost:${PORT}/`);
  console.log(`\nEdit a layout, then just refresh the tab.`);
});
