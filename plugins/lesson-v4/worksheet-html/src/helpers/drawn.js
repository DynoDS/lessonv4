"use strict";

// Three drawings, built as inline SVG rather than the picture-of-a-picture the
// Word builder needs. On paper an SVG stays sharp at any size and needs no
// image library, so the geometry is lifted from the Word builder's own
// clock-face.js, number-line.js and fraction-bar.js, and everything to do with
// `sharp`, DPI multipliers and PNG buffers is dropped. The drawing itself
// (proportions, stroke weights, Comic Sans labels) is kept identical.
//
// Every builder below returns { svg, aspect, ...whatever `needs` reuses }, so
// `measure` and `needs` both work from the SAME geometry the render used:
// nothing is guessed twice and the two numbers cannot drift apart.

const { esc, heightFromAspect } = require("./shared");
const jumpsGeo = require("../../../shared/visuals/number-line-jumps");

const INK = "var(--colour-ink)";
const FONT = "var(--font)";

// All three drawings size themselves by their own aspect ratio and the width
// the zone actually gives them. None of them read better for extra SPARE
// height once that aspect is filled: the picture is bounded by its width, so
// idle vertical room would only sit under it as blank padding rather than
// make the drawing bigger. Hence greed: 0 on all three.
const NEVER_STRETCH = 0;

// ─── clock-row ─────────────────────────────────────────────────────────
// A row of analogue clock faces, each with hands or left blank for the child
// to draw. Geometry lifted from clock-face.js: same pad, tick lengths, hand
// lengths and number placement, drawn once per clock instead of once per PNG.

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

const CLOCK_UNIT = 280; // matches the Word builder's own default widthPx
const CLOCK_GAP = 30; // breathing room between adjacent faces
const CLOCK_LABEL_H = 60; // room for the "(a)" letter above a face
const CLOCK_LABEL_FONT = 42;

function clockFaceParts(cx, cy, size, time, hands) {
  const pad = 18;
  const r = size / 2 - pad;
  const numberR = r - 28;
  const majorTickInner = r - 14;
  const minorTickInner = r - 7;
  const hourHandLen = r * 0.55;
  const minuteHandLen = r * 0.82;
  const numberFont = Math.round(r * 0.22);

  const parts = [];

  parts.push(
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="${INK}" stroke-width="2.5" />`
  );

  for (let i = 0; i < 60; i++) {
    const rad = toRad(i * 6 - 90);
    const isMajor = i % 5 === 0;
    const inner = isMajor ? majorTickInner : minorTickInner;
    const x1 = cx + r * Math.cos(rad);
    const y1 = cy + r * Math.sin(rad);
    const x2 = cx + inner * Math.cos(rad);
    const y2 = cy + inner * Math.sin(rad);
    parts.push(
      `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${INK}" stroke-width="${isMajor ? 2 : 1}" />`
    );
  }

  for (let n = 1; n <= 12; n++) {
    const rad = toRad(n * 30 - 90);
    const nx = cx + numberR * Math.cos(rad);
    const ny = cy + numberR * Math.sin(rad);
    parts.push(
      `<text x="${nx.toFixed(2)}" y="${ny.toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${numberFont}" fill="${INK}">${n}</text>`
    );
  }

  if (hands && time) {
    const [hStr, mStr] = String(time).split(":");
    const h = parseInt(hStr, 10) % 12;
    const m = parseInt(mStr, 10);

    const minRad = toRad(m * 6 - 90);
    const mhx = cx + minuteHandLen * Math.cos(minRad);
    const mhy = cy + minuteHandLen * Math.sin(minRad);
    parts.push(
      `<line x1="${cx}" y1="${cy}" x2="${mhx.toFixed(2)}" y2="${mhy.toFixed(2)}" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" />`
    );

    const hourRad = toRad(h * 30 + m * 0.5 - 90);
    const hhx = cx + hourHandLen * Math.cos(hourRad);
    const hhy = cy + hourHandLen * Math.sin(hourRad);
    parts.push(
      `<line x1="${cx}" y1="${cy}" x2="${hhx.toFixed(2)}" y2="${hhy.toFixed(2)}" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" />`
    );
  }

  parts.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="${INK}" />`);
  return parts;
}

function buildClockRowSvg(spec) {
  const clocks = spec.clocks || [];
  const n = Math.max(1, clocks.length);
  const letters = !!spec.letters;
  const labelH = letters ? CLOCK_LABEL_H : 0;

  const totalW = n * CLOCK_UNIT + (n - 1) * CLOCK_GAP;
  const totalH = labelH + CLOCK_UNIT;

  const parts = [];
  clocks.forEach((c, i) => {
    const cx = i * (CLOCK_UNIT + CLOCK_GAP) + CLOCK_UNIT / 2;
    const cy = labelH + CLOCK_UNIT / 2;
    if (letters) {
      parts.push(
        `<text x="${cx}" y="${labelH / 2}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${CLOCK_LABEL_FONT}" font-weight="bold" fill="${INK}">(${String.fromCharCode(97 + i)})</text>`
      );
    }
    parts.push(...clockFaceParts(cx, cy, CLOCK_UNIT, c.time, c.hands ?? true));
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}">${parts.join("")}</svg>`;
  return { svg, aspect: totalW / totalH };
}

const CLOCK_CAP_MM = 90; // one row of faces never needs more than this to read
const CLOCK_MIN_MM = 24; // smaller than this and the minute ticks blur together
const CLOCK_GAP_MIN_MM = 6;

function renderClockRow(spec) {
  return `<div class="h-figure">${buildClockRowSvg(spec).svg}</div>`;
}

function measureClockRow(spec, widthMm) {
  return heightFromAspect(buildClockRowSvg(spec).aspect, widthMm, CLOCK_CAP_MM);
}

function needsClockRow(spec) {
  const n = Math.max(1, (spec.clocks || []).length);
  const minWidthMm = n * CLOCK_MIN_MM + (n - 1) * CLOCK_GAP_MIN_MM;
  const { aspect } = buildClockRowSvg(spec);
  return { minWidthMm, minHeightMm: heightFromAspect(aspect, minWidthMm, CLOCK_CAP_MM) };
}

// ─── number-line ────────────────────────────────────────────────────────
// A labelled number line or ruler, optionally carrying marked or blank jumps,
// boxes to write in, and an object bracket. Geometry lifted whole from
// number-line.js: every spec field it read still means the same thing here.
//
// Colour choices carried over from the Word version's own palette: the arrow
// that marks an already-placed value keeps the "given" orange, the object
// bracket a ruler measures keeps the "question/focus" blue. Everything else
// (axis, ticks, labels, boxes) is ink, because none of it is colour-coded on
// the page, it is just the line itself.
const ARROW = "var(--colour-given)";
const OBJECT = "var(--colour-question)";
// A jump is the move the child makes along the spaces, so it takes the focus
// blue; a highlighted space takes the given orange, as a thick bar over the
// axis and a pale wash between its two marks. Both read in greyscale by weight
// and shape, never by hue alone.
const JUMP = "var(--colour-question)";
const HIGHLIGHT = "var(--colour-given)";
const JUMP_TIER_H = 64;
const JUMP_LABEL_FONT = 26;
const JUMP_LABEL_MIN = 18;
const JUMP_LABEL_H = JUMP_LABEL_FONT + 8;
const JUMP_HEAD = 16;
const JUMP_STROKE = 3;
const JUMP_BOX_W = 90;
const JUMP_GAP = 4;
const HIGHLIGHT_BAR_H = 10;
const HIGHLIGHT_WASH = 0.22;

// Year 4 place value is taught WITH the comma, and the question beside the
// line already uses it ("Round 6,734 to the nearest 10."). A line whose ends
// read 6730 and 6740 under that question puts both conventions in front of a
// child at once, on the sheet practising the convention. The slide engine made
// this repair on 8 September 2026 (builder numberline.js); the paper engine had
// kept String(v). Built by hand rather than through toLocaleString so the sheet
// reads the same whatever the building machine's locale is. Decimals, values
// under a thousand and authored string labels are left exactly as written.
function formatValue(v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return String(v);
  if (!Number.isInteger(v) || Math.abs(v) < 1000) return String(v);
  const digits = String(Math.abs(v));
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += ",";
    out += digits[i];
  }
  return (v < 0 ? "-" : "") + out;
}

function buildNumberLineSvg(spec) {
  const {
    start,
    end,
    interval = 1,
    labels = "ends",
    wholeTick,
    boxes = [],
    arrow,
    arrows,
    subLabel,
    widthPx = 1200,
    majorInterval,
    unit,
    object,
  } = spec;

  const allArrows = arrows || (arrow ? [arrow] : []);

  const scaleLine = jumpsGeo.valueLine({ start, end, interval });
  const jumps = jumpsGeo.resolveJumps(spec, scaleLine);
  jumpsGeo.refuseCrowding(jumps, spec, ["arrow", "arrows", "boxes", "object"], "this number line");
  const highlights = jumpsGeo.resolveIntervalHighlight(spec, scaleLine);
  const jumpsLabelled = jumps.some((j) => j.label || j.box);
  const jumpLabelH = jumpsLabelled ? JUMP_LABEL_H : 0;

  let resolvedWholeTick = wholeTick;
  let resolvedLabels = labels;
  if (majorInterval != null) {
    const majorValues = [];
    const steps = Math.round((end - start) / majorInterval);
    for (let i = 0; i <= steps; i++) {
      majorValues.push(Math.round((start + i * majorInterval) * 1e9) / 1e9);
    }
    resolvedWholeTick = majorValues;
    resolvedLabels = majorValues;
  }

  const subLabelFont = 36;
  const subLabelWidth = subLabel ? 100 : 0;
  const padLeft = 60 + subLabelWidth;
  const padRight = unit ? 80 : 60;
  const tickH = 26;
  const tallTickH = 40;
  const labelFont = 22;
  const labelGap = 26;
  const labelRowH = labelFont + 6;
  const boxSize = 80;
  const boxGap = 14;
  const arrowHeight = 60;
  const arrowLabelH = 30;
  const arrowGap = 8;
  const unitFont = 22;
  const objectBarH = 10;
  const objectGap = 12;
  const objectLabelFont = 20;

  const hasBoxes = boxes.length > 0;
  const hasArrows = allArrows.length > 0;
  const hasArrowBoxes = allArrows.some((a) => a.answerBox);
  const hasLabels = !!resolvedLabels;
  const hasObject = !!object;

  const arrowTopSpace = hasArrows
    ? arrowHeight + arrowLabelH + arrowGap + (hasArrowBoxes ? boxSize + boxGap : 0)
    : 0;

  const objectTopSpace = hasObject
    ? objectBarH + objectGap + (object.label ? objectLabelFont + 4 : 0)
    : 0;

  const jumpTopSpace = jumps.length
    ? JUMP_GAP + jumpsGeo.bandHeight(jumps, JUMP_TIER_H, jumpLabelH)
    : 0;

  const topSpace =
    Math.max(
      (hasBoxes ? boxSize + boxGap : 0) + arrowTopSpace,
      objectTopSpace + arrowTopSpace,
      jumpTopSpace
    ) + 8;

  const bottomSpace = (hasLabels ? labelRowH + labelGap : 0) + 8;
  const axisY = topSpace + Math.max(tallTickH, tickH) / 2;
  const heightPx = axisY + Math.max(tallTickH, tickH) / 2 + bottomSpace;

  const innerWidth = widthPx - padLeft - padRight;
  const totalSteps = Math.round((end - start) / interval);

  function getX(value) {
    return padLeft + ((value - start) / (end - start)) * innerWidth;
  }

  const tickValues = [];
  for (let i = 0; i <= totalSteps; i++) {
    tickValues.push(Math.round((start + i * interval) * 1e9) / 1e9);
  }

  const wholeSet = new Set(
    Array.isArray(resolvedWholeTick)
      ? resolvedWholeTick
      : resolvedWholeTick != null
      ? [resolvedWholeTick]
      : []
  );

  let labelValues;
  if (resolvedLabels === "all") labelValues = tickValues.slice();
  else if (resolvedLabels === "ends") labelValues = [start, end];
  else if (Array.isArray(resolvedLabels)) labelValues = resolvedLabels;
  else labelValues = [];

  const parts = [];

  if (subLabel) {
    parts.push(
      `<text x="10" y="${axisY + subLabelFont / 3}" text-anchor="start" font-family="${FONT}" font-size="${subLabelFont}" font-weight="bold" fill="${INK}">${esc(subLabel)}</text>`
    );
  }

  parts.push(
    `<line x1="${padLeft}" y1="${axisY}" x2="${widthPx - padRight}" y2="${axisY}" stroke="${INK}" stroke-width="2.2" stroke-linecap="square" />`
  );

  for (const hl of highlights) {
    const hx1 = getX(tickValues[hl.fromIndex]);
    const hx2 = getX(tickValues[hl.toIndex]);
    parts.push(
      `<rect x="${hx1}" y="${axisY - tickH / 2}" width="${hx2 - hx1}" height="${tickH}" fill="${HIGHLIGHT}" fill-opacity="${HIGHLIGHT_WASH}" />`,
      `<rect x="${hx1}" y="${axisY - HIGHLIGHT_BAR_H / 2}" width="${hx2 - hx1}" height="${HIGHLIGHT_BAR_H}" fill="${HIGHLIGHT}" />`
    );
  }

  for (const v of tickValues) {
    const h = wholeSet.has(v) ? tallTickH : tickH;
    const cx = getX(v);
    parts.push(
      `<line x1="${cx}" y1="${axisY - h / 2}" x2="${cx}" y2="${axisY + h / 2}" stroke="${INK}" stroke-width="2" />`
    );
  }

  const labelY = axisY + Math.max(tallTickH, tickH) / 2 + labelGap;
  for (const v of labelValues) {
    const cx = getX(v);
    parts.push(
      `<text x="${cx}" y="${labelY}" text-anchor="middle" dominant-baseline="hanging" font-family="${FONT}" font-size="${labelFont}" fill="${INK}">${esc(formatValue(v))}</text>`
    );
  }

  if (unit) {
    const ux = widthPx - padRight + 10;
    parts.push(
      `<text x="${ux}" y="${labelY}" text-anchor="start" dominant-baseline="hanging" font-family="${FONT}" font-size="${unitFont}" fill="${INK}">${esc(unit)}</text>`
    );
  }

  if (hasBoxes) {
    const boxBottomY = axisY - Math.max(tallTickH, tickH) / 2 - boxGap;
    for (const v of boxes) {
      const cx = getX(v);
      parts.push(
        `<rect x="${cx - boxSize / 2}" y="${boxBottomY - boxSize}" width="${boxSize}" height="${boxSize}" fill="white" stroke="${INK}" stroke-width="2" />`
      );
    }
  }

  if (hasObject) {
    const ox1 = getX(object.from);
    const ox2 = getX(object.to);
    const barBaseY = axisY - Math.max(tallTickH, tickH) / 2 - objectGap;
    const barTopY = barBaseY - objectBarH;
    const midY = barTopY + objectBarH / 2;

    parts.push(`<line x1="${ox1}" y1="${barTopY}" x2="${ox1}" y2="${barBaseY}" stroke="${OBJECT}" stroke-width="2.5" />`);
    parts.push(`<line x1="${ox2}" y1="${barTopY}" x2="${ox2}" y2="${barBaseY}" stroke="${OBJECT}" stroke-width="2.5" />`);
    parts.push(`<line x1="${ox1}" y1="${midY}" x2="${ox2}" y2="${midY}" stroke="${OBJECT}" stroke-width="2.5" />`);

    if (object.label) {
      const midX = (ox1 + ox2) / 2;
      parts.push(
        `<text x="${midX}" y="${barTopY - 4}" text-anchor="middle" dominant-baseline="alphabetic" font-family="${FONT}" font-size="${objectLabelFont}" fill="${OBJECT}">${esc(object.label)}</text>`
      );
    }
  }

  if (hasArrows) {
    const arrowBaseY = axisY - Math.max(tallTickH, tickH) / 2 - (hasBoxes ? boxSize + boxGap + 4 : 6);
    for (const a of allArrows) {
      const ax = getX(a.at);
      const topY = arrowBaseY - arrowHeight;

      parts.push(`<line x1="${ax}" y1="${topY}" x2="${ax}" y2="${arrowBaseY - 8}" stroke="${ARROW}" stroke-width="3" />`);
      parts.push(
        `<polygon points="${ax - 7},${arrowBaseY - 10} ${ax + 7},${arrowBaseY - 10} ${ax},${arrowBaseY}" fill="${ARROW}" />`
      );

      if (a.answerBox) {
        parts.push(
          `<rect x="${ax - boxSize / 2}" y="${topY - boxGap - boxSize}" width="${boxSize}" height="${boxSize}" fill="white" stroke="${INK}" stroke-width="2" />`
        );
      } else if (a.label) {
        parts.push(
          `<text x="${ax}" y="${topY - arrowGap}" text-anchor="middle" dominant-baseline="alphabetic" font-family="${FONT}" font-size="${arrowLabelH}" font-weight="bold" fill="${ARROW}">${esc(a.label)}</text>`
        );
      }
    }
  }

  if (jumps.length) {
    const baseY = axisY - Math.max(tallTickH, tickH) / 2 - JUMP_GAP;
    let jumpFont = JUMP_LABEL_FONT;
    for (const j of jumps) {
      if (!j.label) continue;
      const span = Math.abs(getX(tickValues[j.toIndex]) - getX(tickValues[j.fromIndex])) - 8;
      const need = j.label.length * JUMP_LABEL_FONT * 0.62;
      if (need > span) jumpFont = Math.min(jumpFont, (JUMP_LABEL_FONT * span) / need);
    }
    if (jumpFont < JUMP_LABEL_MIN) {
      throw new Error(
        "NUMBERLINE_JUMP_LABELS_CROWDED: the jump labels cannot sit over their spaces at a readable size. " +
          "Label one jump and put the rest in the question (\"Each jump is +10\"), or use fewer intervals."
      );
    }
    for (const j of jumps) {
      const x1 = getX(tickValues[j.fromIndex]);
      const x2 = getX(tickValues[j.toIndex]);
      const h = jumpsGeo.arcHeight(j, x2 - x1, JUMP_TIER_H, jumpLabelH);
      const geo = jumpsGeo.arcGeometry(x1, x2, baseY, h, JUMP_HEAD);
      parts.push(
        `<polyline points="${geo.points.map((p) => `${p.x},${p.y}`).join(" ")}" fill="none" stroke="${JUMP}" stroke-width="${JUMP_STROKE}" stroke-linecap="round" />`,
        `<polygon points="${geo.head.map((p) => `${p.x},${p.y}`).join(" ")}" fill="${JUMP}" />`
      );
      if (j.label) {
        parts.push(
          `<text x="${geo.apex.x}" y="${geo.apex.y - 6}" text-anchor="middle" dominant-baseline="alphabetic" font-family="${FONT}" font-size="${jumpFont}" font-weight="bold" fill="${JUMP}">${esc(j.label)}</text>`
        );
      } else if (j.box) {
        const w = Math.min(JUMP_BOX_W, Math.abs(x2 - x1) - 8);
        parts.push(
          `<rect x="${geo.apex.x - w / 2}" y="${geo.apex.y - JUMP_LABEL_H - 2}" width="${w}" height="${JUMP_LABEL_H}" fill="white" stroke="${INK}" stroke-width="2" />`
        );
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthPx} ${heightPx}">${parts.join("")}</svg>`;

  return {
    svg,
    aspect: widthPx / heightPx,
    labelCount: labelValues.length,
    featureCount: Math.max(boxes.length, allArrows.length, jumps.length),
  };
}

const NL_CAP_MM = 100; // a ruler with an object bar and arrows stacked above it
                        // still should not swallow more than this

function renderNumberLine(spec) {
  return `<div class="h-figure">${buildNumberLineSvg(spec).svg}</div>`;
}

function measureNumberLine(spec, widthMm) {
  return heightFromAspect(buildNumberLineSvg(spec).aspect, widthMm, NL_CAP_MM);
}

function needsNumberLine(spec) {
  const { aspect, labelCount, featureCount } = buildNumberLineSvg(spec);
  // Each printed label needs room either side of it not to collide with its
  // neighbour in Comic Sans; each box or arrow needs enough width that two
  // adjacent ones do not touch. Whichever is the tighter constraint wins.
  const minWidthMm = Math.max(70, labelCount * 14, featureCount * 22);
  return { minWidthMm, minHeightMm: heightFromAspect(aspect, minWidthMm, NL_CAP_MM) };
}

// ─── fraction-bar ───────────────────────────────────────────────────────
// One or more bars divided into equal parts, some shaded. Geometry lifted
// from fraction-bar.js. The shaded fill has no literal equivalent among the
// four token colours (the original's pale blue was a one-off), so it borrows
// "question" (the same blue that marks a focus elsewhere) at reduced opacity
// rather than reaching for a hex value the token system does not own.
const SHADE = "var(--colour-question)";

function buildFractionBarSvg(spec) {
  const bars = spec.bars || [];
  const widthPx = spec.widthPx || 500;
  const barHeight = spec.barHeight || 60;
  const gap = spec.gap || 20;
  const labelFont = 22;
  const labelGap = 28;
  const topPad = 6;

  const rowH = (bar) => barHeight + (bar.label ? labelFont + labelGap : 0);
  const totalH =
    topPad + bars.reduce((sum, bar, i) => sum + rowH(bar) + (i > 0 ? gap : 0), 0) + 6;

  const parts = [];
  let curY = topPad;
  let maxDenominator = 1;

  for (const bar of bars) {
    const { numerator, denominator, shaded = true, label } = bar;
    maxDenominator = Math.max(maxDenominator, denominator);
    const cellW = widthPx / denominator;
    const borderW = 2;

    if (shaded && numerator > 0) {
      for (let i = 0; i < numerator; i++) {
        parts.push(
          `<rect x="${i * cellW}" y="${curY}" width="${cellW}" height="${barHeight}" fill="${SHADE}" fill-opacity="0.35" />`
        );
      }
    }

    parts.push(
      `<rect x="${borderW / 2}" y="${curY + borderW / 2}" width="${widthPx - borderW}" height="${barHeight - borderW}" fill="none" stroke="${INK}" stroke-width="${borderW}" />`
    );

    for (let i = 1; i < denominator; i++) {
      const x = i * cellW;
      parts.push(`<line x1="${x}" y1="${curY}" x2="${x}" y2="${curY + barHeight}" stroke="${INK}" stroke-width="1.5" />`);
    }

    if (label) {
      const labelY = curY + barHeight + labelGap;
      parts.push(
        `<text x="${widthPx / 2}" y="${labelY}" text-anchor="middle" dominant-baseline="hanging" font-family="${FONT}" font-size="${labelFont}" fill="${INK}">${esc(label)}</text>`
      );
    }

    curY += rowH(bar) + gap;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthPx} ${totalH}">${parts.join("")}</svg>`;
  return { svg, aspect: widthPx / totalH, maxDenominator };
}

const FRACTION_CAP_MM = 120; // several stacked bars still should not run away
const FRACTION_CELL_MIN_MM = 8; // a cell narrower than this loses its divider line

function renderFractionBar(spec) {
  return `<div class="h-figure">${buildFractionBarSvg(spec).svg}</div>`;
}

function measureFractionBar(spec, widthMm) {
  return heightFromAspect(buildFractionBarSvg(spec).aspect, widthMm, FRACTION_CAP_MM);
}

function needsFractionBar(spec) {
  const { aspect, maxDenominator } = buildFractionBarSvg(spec);
  // The bar with the most parts sets the floor: fewer millimetres per cell
  // than this and the internal divider lines crowd into one smudge.
  const minWidthMm = Math.max(60, maxDenominator * FRACTION_CELL_MIN_MM);
  return { minWidthMm, minHeightMm: heightFromAspect(aspect, minWidthMm, FRACTION_CAP_MM) };
}

// `.h-figure` is styled once, in render.js, for every SVG-backed helper, so
// there is nothing per-drawing to add here.
const css = "";

const helpers = {
  "clock-row": {
    render: renderClockRow,
    measure: measureClockRow,
    needs: needsClockRow,
    greed: NEVER_STRETCH,
  },
  "number-line": {
    render: renderNumberLine,
    measure: measureNumberLine,
    needs: needsNumberLine,
    greed: NEVER_STRETCH,
  },
  "fraction-bar": {
    render: renderFractionBar,
    measure: measureFractionBar,
    needs: needsFractionBar,
    greed: NEVER_STRETCH,
  },
};

module.exports = { helpers, css };
