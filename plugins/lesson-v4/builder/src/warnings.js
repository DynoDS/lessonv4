'use strict';

const warnings = [];
let quiet = 0;

function warn(slideIndex, message) {
  if (quiet) return;
  const tag = `slide ${slideIndex + 1}`;
  const full = `[warn] ${tag}: ${message}`;
  warnings.push(full);
  console.warn(full);
}

// A build-level note not tied to a single slide (e.g. a post-process step that
// failed). Lands in the same warning summary so the closing "No warnings" line
// stays honest.
function note(message) {
  if (quiet) return;
  const full = `[warn] ${message}`;
  warnings.push(full);
  console.warn(full);
}

function getWarnings() { return warnings.slice(); }
function clearWarnings() { warnings.length = 0; }

// Put a saved list back exactly as it was, without printing any of it again.
//
// The layout preflight draws every slide once before the real build, which
// raises the same warnings a second time. Rather than let a dry run double
// every line in the build's warning summary, it sets the store aside and
// restores it afterwards - and restoring is not the same as re-raising: these
// messages were printed when they first happened.
function restoreWarnings(saved) {
  warnings.length = 0;
  for (const w of saved) warnings.push(w);
}

// Run a measurement that draws onto a slide nobody will see, recording nothing
// it raises: no warning, printed or kept, and none of the findings the build
// reports as blocking (the picture floor, a figure underfilling its zone, a
// missing picture), whose stores ask `recording()` before they keep one.
//
// A template that tries its success-criteria panel at a few widths, or tries a
// picture beside its working space, draws them each time, and every try would
// raise the same things as the real drawing. The real drawing raises them once,
// when it happens; the tries raise nothing.
function withoutRecording(fn) {
  quiet += 1;
  try {
    return fn();
  } finally {
    quiet -= 1;
  }
}

function recording() {
  return quiet === 0;
}

module.exports = { warn, note, getWarnings, clearWarnings, restoreWarnings, withoutRecording, recording };
