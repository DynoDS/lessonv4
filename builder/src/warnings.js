'use strict';

const warnings = [];

function warn(slideIndex, message) {
  const tag = `slide ${slideIndex + 1}`;
  const full = `[warn] ${tag}: ${message}`;
  warnings.push(full);
  console.warn(full);
}

// A build-level note not tied to a single slide (e.g. a post-process step that
// failed). Lands in the same warning summary so the closing "No warnings" line
// stays honest.
function note(message) {
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

module.exports = { warn, note, getWarnings, clearWarnings, restoreWarnings };
