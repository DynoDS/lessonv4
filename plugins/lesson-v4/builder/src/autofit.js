'use strict';

// Running the text-fitting pass, and saying precisely what happened.
//
// The distinction this module exists for: TEXT THAT DOES NOT FIT and A MACHINE
// THAT COULD NOT CHECK are completely different problems with completely
// different owners, and both used to arrive as the same shrug of a warning
// while the build carried on and reported success.
//
//   AUTOFIT_OK                   every box measured, everything fits
//   TEXT_OVERLOAD                measured properly; some text is too heavy for
//                                its box even at the readable floor. A content
//                                decision: split the beat, cut the words.
//   AUTOFIT_DEPENDENCY_MISSING   no Python, or no font to measure with. The
//                                machine needs setting up. Says nothing about
//                                the lesson.
//   AUTOFIT_NOT_PERMITTED        Python is here and the sandbox refused to start
//                                it. Nothing is missing and nothing crashed; the
//                                same command succeeds with access. Kept apart
//                                from the two above because the repair is
//                                different and because every lesson run in
//                                September 2026 spent one attempt rediscovering
//                                it as a crash.
//   AUTOFIT_MEASUREMENT_FAILED   the pass ran but could not measure some box.
//                                A fault in this tooling.
//   AUTOFIT_PROCESS_FAILED       the pass itself crashed.
//
// Only AUTOFIT_OK means the deck's text has been checked.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RESULT_LINE = /^AUTOFIT_RESULT:\s*(\{[\s\S]*\})\s*$/m;

function parseResult(output) {
  const m = RESULT_LINE.exec(String(output || ''));
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

// The interpreter the run found at start-up comes first (scripts/find-python.js,
// handed down as LESSON_RESOURCES_PYTHON by the fixed build wrapper). Without it the
// common names are tried, and when none of those will start here the finder is
// asked directly: under Codex every command runs as a sandbox user who cannot
// start the machine's own Python but can start Codex's, so a name that is
// refused is not the end of the search (13 September 2026).
function interpreters(env) {
  if (env && env.LESSON_RESOURCES_PYTHON) return [env.LESSON_RESOURCES_PYTHON];
  return process.platform === 'win32'
    ? ['python', 'python3']
    : ['python3', 'python'];
}

function runAutofit(pptxPath, options = {}) {
  const script =
    options.script || path.join(__dirname, '..', 'scripts', 'fit_text_postprocess.py');

  if (!fs.existsSync(script)) {
    return {
      status: 'AUTOFIT_DEPENDENCY_MISSING',
      message: `the text-fitting script is missing (${script}).`,
    };
  }

  // Injectable so a test can present a refused spawn without a sandbox, the
  // same seam `decorations.js` uses for its own child process.
  const run = options.execFileSync || execFileSync;
  // Matches DEFAULT_FLOOR_PT in fit_text_postprocess.py: the smallest text a
  // child at the back of the room can read off the board. Both are stated
  // because this wrapper passes the floor explicitly, so a change to one
  // alone would be silently overridden by the other.
  const floor = String(options.floor || 18);
  let lastError = null;
  let ran = false;
  let output = '';
  let blockedBy = null;
  let blockedError = null;

  const queue = interpreters(options.env || process.env);
  const tried = new Set();
  let askedFinder = false;
  for (;;) {
    let bin = queue.shift();
    if (bin === undefined) {
      if (askedFinder) break;
      askedFinder = true;
      const finder = options.findPython || require('../../scripts/find-python').findPython;
      const found = finder();
      if (found && found.status === 'PYTHON' && !tried.has(found.exe)) {
        bin = found.exe;
      } else {
        break;
      }
    }
    tried.add(bin);
    try {
      output = run(bin, [script, '--floor', floor, pptxPath], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      ran = true;
      blockedBy = null;
      break;
    } catch (err) {
      if (err && err.code === 'ENOENT') {
        // This interpreter name does not exist here; try the next.
        continue;
      }
      if (err && (err.code === 'EPERM' || err.code === 'EACCES')) {
        // This interpreter exists and we were refused permission to start it.
        // Another one may still be allowed, so remember the refusal and keep
        // looking; it is reported only if nothing else starts.
        blockedBy = blockedBy || bin;
        blockedError = blockedError || err;
        continue;
      }
      // The script ran and exited non-zero. Its own output says why.
      lastError = err;
      output = `${(err && err.stdout) || ''}${(err && err.stderr) || ''}`;
      ran = true;
      break;
    }
  }

  if (blockedBy) {
    return {
      status: 'AUTOFIT_NOT_PERMITTED',
      message:
        `starting \`${blockedBy}\` was refused by the sandbox ` +
        `(${(blockedError && blockedError.code) || 'EPERM'}), so slide text was ` +
        'NOT measured or shrunk. Nothing is missing and nothing crashed: run ' +
        'this build again with permission to start a child process.',
      output,
    };
  }

  if (!ran) {
    return {
      status: 'AUTOFIT_DEPENDENCY_MISSING',
      message:
        'no Python interpreter found, so slide text was NOT measured or ' +
        'shrunk. On a cloud box run .claude/cloud-setup.sh first.',
      output,
    };
  }

  if (/^AUTOFIT_DEPENDENCY_MISSING:/m.test(output)) {
    return {
      status: 'AUTOFIT_DEPENDENCY_MISSING',
      message:
        'autofit found no usable font to measure with, so slide text was NOT ' +
        'measured or shrunk.',
      output,
    };
  }

  const result = parseResult(output);

  if (lastError) {
    return {
      status: 'AUTOFIT_PROCESS_FAILED',
      message:
        `the text-fitting pass exited with an error: ` +
        `${(lastError && lastError.message) || lastError}`,
      output,
      result,
    };
  }

  if (!result) {
    // The pass claimed to succeed but said nothing a caller can check. Treated
    // as a failure rather than a pass: an unreadable result is not a good one.
    return {
      status: 'AUTOFIT_PROCESS_FAILED',
      message:
        'the text-fitting pass produced no readable AUTOFIT_RESULT line, so ' +
        'nothing can confirm the text was measured.',
      output,
    };
  }

  const measurementFailures = Array.isArray(result.measurementFailures)
    ? result.measurementFailures
    : [];
  const overloaded = Array.isArray(result.overloaded) ? result.overloaded : [];

  // Technical before content: a box that could not be measured might also be
  // overloaded, and nobody can tell until the measurement works.
  if (measurementFailures.length) {
    return {
      status: 'AUTOFIT_MEASUREMENT_FAILED',
      message:
        `${measurementFailures.length} text box(es) could not be measured, so ` +
        `this deck's text has not been checked.`,
      failures: measurementFailures,
      output,
      result,
    };
  }

  if (overloaded.length) {
    return {
      status: 'TEXT_OVERLOAD',
      message:
        `${overloaded.length} text box(es) are still too heavy at the readable ` +
        `floor. The text has to give, not the size.`,
      overloaded,
      output,
      result,
    };
  }

  return { status: 'AUTOFIT_OK', output, result };
}

function autofitDiagnostics(autofit) {
  if (!autofit || autofit.status === 'AUTOFIT_OK') return [];

  const owner = autofit.status === 'TEXT_OVERLOAD' ? 'content' : 'technical';
  const entries = autofit.status === 'TEXT_OVERLOAD'
    ? autofit.overloaded
    : autofit.status === 'AUTOFIT_MEASUREMENT_FAILED'
      ? autofit.failures
      : null;

  if (!Array.isArray(entries) || entries.length === 0) {
    return [{ code: autofit.status, owner, location: {}, message: autofit.message }];
  }

  return entries.map((entry) => ({
    code: autofit.status,
    owner,
    location: { slide: entry.slide, box: entry.box },
    // The budget the fit pass measured, ahead of the words, because the words
    // are what the reader already has and the limit is what they are missing.
    message: entry.error
      || [entry.budget, entry.preview].filter(Boolean).join(' ')
      || autofit.message,
  }));
}

module.exports = { runAutofit, parseResult, autofitDiagnostics };
