"use strict";

// A sandboxed host refuses a connection to this computer's own address. The
// browser used to be reached that way, so on Codex it started, could not be
// spoken to, and every sheet and wall of three real lessons was sized from
// sums under the words "no browser on this machine" (stress test, 10 and 11
// October 2026). These tests refuse that connection the same way and ask that
// the page is still measured, and that a browser which truly cannot be used is
// never reported as a machine without one.

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { findChrome, whyNoBrowser } = require("../src/chrome");

const REFUSE = path.join(__dirname, "fixtures", "refuse-local-connections.js");
const CHROME = path.join(__dirname, "..", "src", "chrome.js");

function browserAvailable() {
  try {
    findChrome();
    return true;
  } catch {
    return false;
  }
}

function run(script) {
  return spawnSync(process.execPath, ["--require", REFUSE, "-e", script], {
    encoding: "utf8",
    cwd: path.join(__dirname, ".."),
  });
}

test("the page is measured with connections to this computer refused", (t) => {
  if (!browserAvailable()) return t.skip("no browser on this machine, so nothing could be measured");
  const result = run(`
    (async () => {
      const browser = await require(${JSON.stringify(CHROME)}).launchBrowser();
      const page = await browser.newPage();
      await page.setContent("<div id=a style='width:50mm;font-size:12pt'>some words to wrap over lines here</div>");
      const height = await page.evaluate(() => document.getElementById("a").getBoundingClientRect().height);
      await browser.close();
      console.log("MEASURED " + height);
    })();
  `);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /MEASURED [1-9]/);
});

test("a browser that started and could not be reached does not end the command as failed", (t) => {
  if (!browserAvailable()) return t.skip("no browser on this machine, so nothing could be measured");
  // The old way of reaching the browser, to meet the refusal on purpose.
  const result = run(`
    (async () => {
      const puppeteer = require("puppeteer-core");
      const launch = puppeteer.launch.bind(puppeteer);
      puppeteer.launch = (options) => launch({ ...options, pipe: false });
      const chrome = require(${JSON.stringify(CHROME)});
      try {
        await chrome.launchBrowser();
        console.log("REACHED");
      } catch (error) {
        console.log(chrome.whyNoBrowser(error));
      }
      setTimeout(() => console.log("STILL_RUNNING"), 3000);
    })();
  `);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /BROWSER_BLOCKED: a browser is on this machine/);
  assert.match(result.stdout, /STILL_RUNNING/);
});

test("a refused browser is told apart from a machine with none", () => {
  assert.equal(whyNoBrowser(new Error("NO_CHROME: no Chrome or Chromium found. Tried:\n  x")), "no browser on this machine");
  const refused = whyNoBrowser(new Error("connect EACCES 127.0.0.1:56481"));
  assert.match(refused, /^BROWSER_BLOCKED/);
  assert.match(refused, /connect EACCES 127\.0\.0\.1:56481/);
  assert.match(refused, /more access/);
});

test("an error that is not the browser's leftover folder still ends the command", () => {
  const result = run(`
    require(${JSON.stringify(CHROME)}).launchBrowser().catch(() => {});
    Promise.reject(new Error("something else went wrong"));
  `);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /something else went wrong/);
});
