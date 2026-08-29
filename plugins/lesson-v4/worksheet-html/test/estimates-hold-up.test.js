"use strict";

// Do the arithmetic estimates match what a browser actually draws?
//
// Every helper states its own height by calculation, because the overnight box
// has no browser and a height that needed rendering would work on one machine
// and not another. `scripts/check-render.js` has always been able to check
// those estimates against a real Chrome - and it was never run by anything.
//
// So an estimate drifted and nothing said a word. The `questions` helper, which
// is on very nearly every worksheet there is, measured itself 15mm shorter than
// it drew at column widths, and `overflow: hidden` on the zone cut the rest off.
// Worksheets were refused for it, one lesson at a time, for as long as it took
// somebody to run a script by hand.
//
// It takes about two seconds. There was never a reason for it to sit outside
// the suite, and there is none now. On a machine without a browser it skips,
// which is the same trade the build itself makes.

const assert = require("node:assert/strict");
const test = require("node:test");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const { findChrome } = require("../src/chrome");

function browserAvailable() {
  try {
    return Boolean(findChrome());
  } catch {
    return false;
  }
}

test("every helper's height estimate holds up in a real browser", { timeout: 120000 }, (t) => {
  if (!browserAvailable()) {
    t.skip("no browser on this machine, so nothing could be measured");
    return;
  }

  const script = path.join(__dirname, "..", "scripts", "check-render.js");
  let output = "";
  let failed = false;
  try {
    output = execFileSync(process.execPath, [script], { encoding: "utf8" });
  } catch (err) {
    failed = true;
    output = `${(err && err.stdout) || ""}${(err && err.stderr) || ""}`;
  }

  // The script names every helper that draws taller than it measured, and the
  // millimetres it is out by. Carried through verbatim: a bare "it failed"
  // would leave whoever reads this rerunning it by hand to find out what.
  const clipped = output.slice(output.indexOf("CLIPPED"));
  assert.ok(
    !failed,
    `a helper draws taller than it measures, so a zone holding it will cut ` +
      `content off:\n${clipped}`
  );
  assert.match(
    output,
    /Nothing is clipped/,
    `the estimate check did not confirm the estimates:\n${output.slice(-800)}`
  );
});
