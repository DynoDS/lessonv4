"use strict";

// Titles stay untouched inside artifacts; only filesystem path components are
// cleaned. Slashes become hyphens rather than disappearing, so "more/less"
// never turns into the different-looking word "moreless".
function safeFilenameComponent(value, fallback = "Lesson") {
  const safe = String(value == null ? "" : value)
    .replace(/[—–]/g, "-")
    .replace(/[\\/]+/g, "-")
    .replace(/[:*?"<>|]/g, "")
    .replace(/[. ]+$/g, "")
    .trim();
  return safe || fallback;
}

function lessonSlug(value, fallback = "lesson") {
  const slug = String(value == null ? "" : value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

module.exports = { safeFilenameComponent, lessonSlug };
