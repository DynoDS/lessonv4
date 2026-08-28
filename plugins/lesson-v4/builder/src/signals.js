'use strict';

// The six drawn signal icons - a fixed picture language children learn once:
// pencil = you write now, talk = talk to your partner, star = remember this /
// challenge, magnifier = look closely, tick = mark your work, flipchart = this
// criterion is built live on the flipchart. The artwork is Daniel's vetted
// one-off set (the visual-refresh plan records the exception that allows it);
// never regenerate, redraw, or substitute these files.
//
// One helper owns placement so every template renders a signal the same way:
// callers say how tall the icon may be and it keeps its own width, so a
// portrait pencil and a landscape talk bubble both sit true to their drawing.

const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, '..', 'assets', 'signals');

// aspect is w / h of the trimmed asset
const SIGNALS = {
  pencil:    { file: 'pencil.png',    aspect: 213 / 378 },
  talk:      { file: 'talk.png',      aspect: 297 / 282 },
  star:      { file: 'star.png',      aspect: 288 / 333 },
  magnifier: { file: 'magnifier.png', aspect: 245 / 338 },
  tick:      { file: 'tick.png',      aspect: 273 / 300 },
  flipchart: { file: 'flipchart.png', aspect: 466 / 663 }
};

function signalMeta(name) {
  const s = SIGNALS[name];
  if (!s) return null;
  const p = path.join(DIR, s.file);
  if (!fs.existsSync(p)) return null;
  return { path: p, aspect: s.aspect };
}

// Width the icon takes at height h, or 0 for an unknown or missing signal.
// Callers lay text out against the returned width, so a bad name degrades to
// "no icon" rather than a hole where a picture should be.
function signalWidth(name, h) {
  const s = signalMeta(name);
  return s ? h * s.aspect : 0;
}

// Draw `name` with its left edge at box.x, top at box.y, height box.h.
// Returns the drawn width (0 when nothing drew).
function drawSignal(slide, name, box) {
  const s = signalMeta(name);
  if (!s) return 0;
  const w = box.h * s.aspect;
  slide.addImage({ path: s.path, x: box.x, y: box.y, w: w, h: box.h });
  return w;
}

// Draw `name` tucked into the top-right corner of a panel - the draw-live
// easel's home on the green criteria panel. Height is chosen by the caller so
// the icon ends where the panel's content begins.
function drawSignalTopRight(slide, name, box, opts) {
  const o = opts || {};
  const h = o.h != null ? o.h : 0.58;
  const inset = o.inset != null ? o.inset : 0.10;
  const w = signalWidth(name, h);
  if (!w) return 0;
  return drawSignal(slide, name, { x: box.x + box.w - w - inset, y: box.y + inset, h: h });
}

module.exports = { drawSignal, drawSignalTopRight, signalWidth };
