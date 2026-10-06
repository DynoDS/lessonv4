"use strict";

// A note pointing at one place in a wall drawing: the place ringed, a few
// words in a small box beside the drawing, and a curly arrow from one to the
// other.
//
// Why this exists. The step-by-step sheet rings the digit a step wrote and
// points a note at it, and the teacher asked for that look on any wall (5
// October 2026). The first sheet it was wanted on outside that family was a
// "Remember" card: "A zero holds an empty place so the other digits keep their
// value." over the sum 3,204 + 564, with nothing in the picture picking out
// the zero the sentence is about. A callout carrying `note` does that on any
// card's drawing:
//
//   { "part": "tens number 1", "note": ["The zero", "holds the tens place"] }
//
// `part` is a place the drawing names, or `anchor: [x%, y%]` on a drawing that
// names none. Blue is the board's "look here" colour, so the ring, the arrow
// and the box are blue whatever the card's own colour.

const { boldWidthPx } = require("./layout");

const BLUE = "#0070C0";
const BLUE_FILL = "#E8F2FB";
const INK = "#1A1A1A";
const MAX_LINES = 3;

function isNoteCallout(c) {
  return Boolean(c) && c.note != null && !(Array.isArray(c.note) && c.note.length === 0);
}

function linesOf(note) {
  return (Array.isArray(note) ? note : [note]).map((line) => String(line == null ? "" : line).trim()).filter(Boolean);
}

const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const n = (v) => v.toFixed(1);

// Every place the drawing names, in pixels: the box of what is written there.
function placesOf(anchors, width, height) {
  const boxes = (anchors && anchors.pointAt) || {};
  return Object.keys(boxes).map((name) => {
    const b = boxes[name];
    return { name, cx: (b[0] / 100) * width, cy: (b[1] / 100) * height, halfW: (b[2] / 100) * width, halfH: (b[3] / 100) * height, written: b[4] !== 0 };
  });
}

function targetFor(callout, anchors, places, width, height) {
  if (places.length) {
    const place = places.find((p) => p.name === callout.part);
    if (!place) {
      throw new Error(
        `a note points at ${callout.part ? `"${callout.part}"` : "a spot given by numbers"}, but this drawing's places are named, ` +
        `so the place can be ringed. Give \`part\` one of: ${places.map((p) => p.name).join(", ")}.`
      );
    }
    return { ...place, ring: place.written };
  }
  const spot = Array.isArray(callout.anchor)
    ? callout.anchor
    : anchors && Array.isArray(anchors[callout.part])
      ? anchors[callout.part]
      : anchors && anchors.rows && anchors.rows[callout.part];
  if (!Array.isArray(spot)) {
    throw new Error(
      `a note points at ${callout.part ? `"${callout.part}"` : "no place"}, which this drawing does not name. ` +
      "Name a part the drawing exposes, or give anchor: [x%, y%]."
    );
  }
  return { cx: (spot[0] / 100) * width, cy: (spot[1] / 100) * height, halfW: 0, halfH: 0, ring: false };
}

// The drawing with its notes: { svg, width, height }. The canvas grows equally
// on both sides so the drawing stays in the middle of its card.
function noteCalloutsSvg(callouts, anchors, width, height, baseHref, font) {
  const places = placesOf(anchors, width, height);
  const unit = Math.min(width, height);
  const fontPx = unit * 0.075;
  const lineH = fontPx * 1.3;
  const pad = fontPx * 0.55;
  const run = unit * 0.11;
  const stroke = unit * 0.011;

  const notes = callouts.map((callout) => {
    const lines = linesOf(callout.note);
    if (lines.length > MAX_LINES) {
      throw new Error(`a note has ${lines.length} lines; it is a label of at most ${MAX_LINES} short lines, and the sentence belongs in the card's words.`);
    }
    const target = targetFor(callout, anchors, places, width, height);
    const textW = Math.max(...lines.map((line) => boldWidthPx(line, fontPx * 0.75)));
    return { lines, target, boxW: textW + 2 * pad, boxH: lines.length * lineH + pad, side: target.cx >= width / 2 ? "right" : "left" };
  });

  const side = Math.max(0, ...notes.map((note) => note.boxW + run)) + stroke;
  const parts = [];
  const taken = { left: [], right: [] };
  for (const note of notes) {
    const t = note.target;
    const right = note.side === "right";
    const ringW = t.ring ? Math.max(t.halfW, unit * 0.022) + unit * 0.018 : 0;
    const ringH = t.ring ? Math.max(t.halfH, unit * 0.02) + unit * 0.014 : 0;
    // Is anything written between the place and the edge the note stands at?
    const between = places.filter((p) => p.written && p.name !== t.name && Math.abs(p.cy - t.cy) < p.halfH + ringH && (right ? p.cx > t.cx : p.cx < t.cx));
    // If so the arrow runs along the line between two rows, clear of the
    // digits in both, and hooks up into the corner of the ring; if not it
    // comes straight in, level with the place.
    let laneY = t.cy;
    if (between.length) {
      const below = places.filter((p) => Math.abs(p.cx - t.cx) < 1 && p.cy > t.cy + 1).sort((a, b) => a.cy - b.cy)[0];
      const above = places.filter((p) => Math.abs(p.cx - t.cx) < 1 && p.cy < t.cy - 1).sort((a, b) => b.cy - a.cy)[0];
      laneY = below ? (t.cy + below.cy) / 2 : above ? t.cy + (t.cy - above.cy) / 2 : t.cy + ringH * 2;
    }
    // Notes on one side stand clear of each other.
    let boxY = laneY - note.boxH / 2;
    for (const other of taken[note.side]) {
      if (boxY < other.bottom + pad && boxY + note.boxH > other.top - pad) boxY = other.bottom + pad;
    }
    taken[note.side].push({ top: boxY, bottom: boxY + note.boxH });
    const boxX = right ? side + width + run : side - run - note.boxW;
    const sx = right ? boxX : boxX + note.boxW;
    const sy = boxY + note.boxH / 2;
    const dir = right ? 1 : -1;
    let ex;
    let ey;
    let c1;
    let c2;
    if (between.length) {
      ex = side + t.cx + dir * ringW * 0.75;
      ey = t.cy + ringH + stroke;
      c1 = [sx - dir * run * 1.2, sy - unit * 0.05];
      c2 = [ex + dir * run * 1.1, ey + unit * 0.075];
    } else {
      ex = side + t.cx + dir * (ringW + stroke * 1.5 + (t.ring ? 0 : unit * 0.02));
      ey = t.cy;
      c1 = [sx - dir * run * 0.7, sy + unit * 0.01];
      c2 = [ex + dir * run * 0.7, ey - unit * 0.07];
    }
    const angle = Math.atan2(ey - c2[1], ex - c2[0]);
    const headL = unit * 0.04;
    const headW = unit * 0.02;
    const bx = ex - Math.cos(angle) * headL;
    const by = ey - Math.sin(angle) * headL;

    if (t.ring) {
      parts.push(`<rect x="${n(side + t.cx - ringW)}" y="${n(t.cy - ringH)}" width="${n(2 * ringW)}" height="${n(2 * ringH)}" rx="${n(unit * 0.015)}" fill="none" stroke="${BLUE}" stroke-width="${n(stroke)}"/>`);
    }
    parts.push(
      `<path d="M ${n(sx)} ${n(sy)} C ${n(c1[0])} ${n(c1[1])}, ${n(c2[0])} ${n(c2[1])}, ${n(bx)} ${n(by)}" fill="none" stroke="${BLUE}" stroke-width="${n(stroke * 1.2)}" stroke-linecap="round"/>` +
      `<polygon points="${n(ex)},${n(ey)} ${n(bx - Math.sin(angle) * headW)},${n(by + Math.cos(angle) * headW)} ${n(bx + Math.sin(angle) * headW)},${n(by - Math.cos(angle) * headW)}" fill="${BLUE}"/>`
    );
    parts.push(`<rect x="${n(boxX)}" y="${n(boxY)}" width="${n(note.boxW)}" height="${n(note.boxH)}" rx="${n(fontPx * 0.45)}" fill="${BLUE_FILL}" stroke="${BLUE}" stroke-width="${n(stroke * 0.7)}"/>`);
    note.lines.forEach((line, k) => {
      const y = boxY + pad / 2 + lineH * k + lineH / 2 + fontPx * 0.35;
      parts.push(`<text x="${n(boxX + note.boxW / 2)}" y="${n(y)}" text-anchor="middle" font-family="${font}, Arial, sans-serif" font-size="${n(fontPx)}" font-weight="${k === 0 ? "bold" : "normal"}" fill="${INK}">${esc(line)}</text>`);
    });
    note.top = boxY;
    note.bottom = boxY + note.boxH;
  }

  const top = Math.max(0, ...notes.map((note) => -note.top + stroke));
  const bottom = Math.max(0, ...notes.map((note) => note.bottom + stroke - height));
  const fullW = Math.ceil(width + 2 * side);
  const fullH = Math.ceil(height + top + bottom);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${fullW}" height="${fullH}" viewBox="0 ${n(-top)} ${fullW} ${fullH}">` +
    `<image href="${baseHref}" xlink:href="${baseHref}" x="${n(side)}" y="0" width="${width}" height="${height}"/>` +
    parts.join("") +
    `</svg>`;
  return { svg, width: fullW, height: fullH };
}

module.exports = { isNoteCallout, noteCalloutsSvg };
