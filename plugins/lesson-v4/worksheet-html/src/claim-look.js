"use strict";

// One job, one look: which drawing a child's claim gets.
//
// A child's claim is drawn as a figure with a speech bubble, and as a flat
// panel only where there is no room for the figure (the teacher, 9 October
// 2026: the figure first, the panel as the fallback, and a difference between
// levels is fine only when room forced it). The helper itself falls back where
// the piece is too narrow (helpers/frames.js). The two places that know about
// the PAGE ask for the panel through here and nowhere else: the layout pass,
// for a sheet that would otherwise be refused for height (worksheet.js), and
// the slips, where the figure would cost slips on the page (slips.js). It is
// never the designer's to pick.

function isFigureClaim(node) {
  if (!node || node.look === "panel") return false;
  if (node.helper === "named-claim") return true;
  const turns = node.helper === "speech-scene" && Array.isArray(node.turns) ? node.turns : [];
  return turns.length === 1 && Boolean(turns[0] && turns[0].says);
}

function withClaimPanels(node) {
  if (Array.isArray(node)) return node.map(withClaimPanels);
  if (!node || typeof node !== "object") return node;
  if (isFigureClaim(node)) return { ...node, look: "panel" };
  const out = {};
  for (const [key, value] of Object.entries(node)) out[key] = withClaimPanels(value);
  return out;
}

function hasFigureClaim(node) {
  if (Array.isArray(node)) return node.some(hasFigureClaim);
  if (!node || typeof node !== "object") return false;
  return isFigureClaim(node) || Object.values(node).some(hasFigureClaim);
}

module.exports = { withClaimPanels, hasFigureClaim };
