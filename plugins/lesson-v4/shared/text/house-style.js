'use strict';

// House-style text enforcement, shared by every builder.
//
// Two mechanical substitutions live here. The em dash (—) and en dash (–) are not part of
// this teacher's voice. The authoring agents are told this in preferences.md and
// are the first line of defence, but a generative model emits dashes statistically
// however clear the prose rule is — this run leaked them into the slides, the
// worksheet, the working wall and the lesson design at once. So the builders carry
// a deterministic safety net: whatever the agents author, nothing dash-shaped
// reaches a child or parent on the page. This mirrors the report-system's
// voice-checker, which fixes the same "mechanical certainty" the same way.
//
// The replacement is the spaced hyphen ( - ), the in-voice fallback preferences.md
// names for a dash-like pause. It is not always the most elegant choice the rule
// offers (a comma, brackets, a colon, a full stop) — that judgement stays with the
// authoring agents — but it is always in the teacher's register and never reads as
// machine-written, which a raw dash always does. Ordinary hyphens inside compound
// words ("three-quarter") are a different character and are left untouched.

// Collapse any whitespace around an em/en dash into a single spaced hyphen, so
// "neither — he" and "neither—he" both land on "neither - he".
function houseStyleString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/\s*[—–]\s*/g, ' - ')
    // U+2717 falls back to an empty square in the deck's classroom font on
    // Windows. U+2718 carries the same semantic mark and renders reliably.
    .replace(/✗/g, '✘');
}

// Walk a parsed spec tree in place, applying houseStyleString to every string
// value (object values and array items, to any depth). Returns the same object
// for convenience. Called once, right after JSON.parse, so every helper that
// later draws a string draws an already-clean one — no per-helper change needed.
function sanitizeHouseStyle(node) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const v = node[i];
      if (typeof v === 'string') node[i] = houseStyleString(v);
      else if (v && typeof v === 'object') sanitizeHouseStyle(v);
    }
  } else if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      const v = node[key];
      if (typeof v === 'string') node[key] = houseStyleString(v);
      else if (v && typeof v === 'object') sanitizeHouseStyle(v);
    }
  }
  return node;
}

module.exports = { houseStyleString, sanitizeHouseStyle };
