'use strict';

// Shared series-circuit geometry for the slide circuit-diagram helper. It is
// kept outside the slide-specific renderer so another surface can reuse the
// same primary symbols later without the slide layer owning the geometry.
//
// The circuit is deliberately schematic. It uses the primary symbols for a
// lamp, buzzer, cell, battery, switch and a deliberate wire gap. There is one
// path only: no junctions, branches or realistic component pictures.

// ─── CONSTANTS (abstract SVG units) ───────────────────────────────────────
const LOOP_W = 260;
const LOOP_LEFT = 18;
const LOOP_RIGHT = LOOP_W - LOOP_LEFT;
const TOP = 21;
const BOTTOM = 145;
const WIRE_W = 2.8;
const MARK_W = 2.8;
const CELL_SHORT_W = 4;
const LAMP_R = 17;
const BUZZER_HALF = 17;
const BUZZER_RISE = 19;
const SWITCH_GAP = 18;
const SWITCH_DOT_R = 3.5;
const CELL_LONG_H = 44;
const CELL_SHORT_H = 26;
const CELL_STEP = 42;
const CELL_PAIR_GAP = 14;
const ROW_GAP = 24;
const ROW_PAD_X = 14;
const NO_LABEL_H = 174;
const LABEL_H = 190;
const LABEL_BASELINE = BOTTOM + 34;
const LABEL_FONT = 20;
const GAP_DOT_R = 2.5;
const MAX_CELLS = 6;
const MAX_LAMPS = 5;
const MAX_BUZZERS = 4;
// ─── END CONSTANTS ────────────────────────────────────────────────────────

function f(n) {
  return Number(n).toFixed(2).replace(/\.00$/, '');
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

// A count of real components in a real circuit.
//
// This used to round, clamp and fall back, which meant "3.5 lamps" quietly
// became 4 and "9 lamps" quietly became 5. Both draw a circuit that is not the
// one the lesson described, and a class then reasons about the wrong picture -
// so a count this renderer cannot draw is refused by name instead.
function countValue(value, fallback, max, path) {
  if (value === true) return 1;
  if (value === false || value == null || value === '') return 0;
  if (Array.isArray(value)) {
    if (value.length > max) {
      throw new Error(
        `CIRCUIT_COUNT_UNSUPPORTED: ${path} has ${value.length} entries; this ` +
          `diagram draws at most ${max}. Nothing was removed.`
      );
    }
    return value.length;
  }

  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(
      `CIRCUIT_COUNT_UNSUPPORTED: ${path} is ${JSON.stringify(value)}, which is ` +
        `not a number.`
    );
  }
  if (!Number.isInteger(n)) {
    throw new Error(
      `CIRCUIT_COUNT_UNSUPPORTED: ${path} is ${n}. A circuit has a whole number ` +
        `of components; this was not rounded.`
    );
  }
  if (n < 0) {
    throw new Error(`CIRCUIT_COUNT_UNSUPPORTED: ${path} is ${n}, which is below zero.`);
  }
  if (n > max) {
    throw new Error(
      `CIRCUIT_COUNT_UNSUPPORTED: ${path} is ${n}; this diagram draws at most ` +
        `${max}. Nothing was clamped.`
    );
  }
  return n;
}

// Only aliases that mean exactly the same component. "bulb" and "lamp" are the
// same thing said two ways; anything this renderer has no symbol for is
// reported with the value supplied, because dropping it silently draws a
// circuit missing a component the lesson put in it.
function componentType(value, path) {
  const raw = typeof value === 'object' && value !== null
    ? (value.type || value.component || value.kind || '')
    : value;
  const name = String(raw || '').trim().toLowerCase();
  if (name === 'lamp' || name === 'bulb' || name === 'light' || name === 'light-bulb') return 'lamp';
  if (name === 'buzzer' || name === 'beeper') return 'buzzer';
  throw new Error(
    `CIRCUIT_COMPONENT_UNSUPPORTED: ${path} is ${JSON.stringify(String(raw))}, ` +
      `which this diagram has no symbol for. Nothing was dropped.`
  );
}

function sourceData(input) {
  if (typeof input === 'string') return { state: input };
  if (!input || typeof input !== 'object') return {};
  if (input.circuit && typeof input.circuit === 'object' && !Array.isArray(input.circuit)) {
    return { ...input.circuit, ...input };
  }
  return input;
}

// The four canonical states of the original narrow circuit examples. These are
// unambiguous shorthand for one known circuit each, so they keep resolving the
// way they always have - existing lessons written against them are not wrong.
const LEGACY_STATES = new Set(['complete', 'gap', 'no-cell', 'switch-open']);

function normaliseCircuit(input) {
  const data = sourceData(input);
  const state = String(data.state || '').trim().toLowerCase();

  if (state && !LEGACY_STATES.has(state)) {
    // Not a state this renderer knows. Repairing it to "complete" would draw a
    // working circuit where the lesson may have described a broken one, which
    // is the one mistake a circuit diagram must never make.
    throw new Error(
      `CIRCUIT_STATE_INVALID: state ${JSON.stringify(String(data.state))} is not ` +
        `a circuit state this diagram knows. Known: ${[...LEGACY_STATES].join(', ')}.`
    );
  }

  const legacy = LEGACY_STATES.has(state);

  let cells;
  if (hasOwn(data, 'cells')) {
    cells = countValue(data.cells, 1, MAX_CELLS, 'circuit.cells');
  } else if (hasOwn(data, 'cellCount')) {
    cells = countValue(data.cellCount, 1, MAX_CELLS, 'circuit.cellCount');
  } else if (hasOwn(data, 'battery')) {
    const battery = data.battery;
    if (battery && typeof battery === 'object') {
      cells = countValue(
        battery.cells ?? battery.count ?? battery.cellCount,
        2,
        MAX_CELLS,
        'circuit.battery.cells'
      );
    } else {
      cells = battery === true ? 2 : countValue(battery, 2, MAX_CELLS, 'circuit.battery');
    }
  } else if (legacy) {
    // The legacy states describe a one-cell circuit; that is what they have
    // always drawn.
    cells = 1;
  } else {
    // No cells stated and no legacy shorthand. Inventing one would be inventing
    // the science: whether this circuit has a power source is the whole question
    // on some slides.
    throw new Error(
      'CIRCUIT_FIELD_MISSING: this circuit says nothing about its cells. State ' +
        'cells (0 is a valid answer), or use one of the known states: ' +
        `${[...LEGACY_STATES].join(', ')}.`
    );
  }
  if (state === 'no-cell' || data.noCell === true) cells = 0;

  let components;
  if (Array.isArray(data.components)) {
    components = data.components.map((c, i) =>
      componentType(c, `circuit.components[${i}]`)
    );
  } else if (
    hasOwn(data, 'lamps') || hasOwn(data, 'bulbs') || hasOwn(data, 'lamp') ||
    hasOwn(data, 'buzzers') || hasOwn(data, 'buzzer')
  ) {
    const lampSource = hasOwn(data, 'lamps') ? data.lamps
      : hasOwn(data, 'bulbs') ? data.bulbs
        : hasOwn(data, 'lamp') ? data.lamp : 0;
    const buzzerSource = hasOwn(data, 'buzzers') ? data.buzzers
      : hasOwn(data, 'buzzer') ? data.buzzer : 0;
    components = [
      ...Array(countValue(lampSource, 1, MAX_LAMPS, 'circuit.lamps')).fill('lamp'),
      ...Array(countValue(buzzerSource, 0, MAX_BUZZERS, 'circuit.buzzers')).fill('buzzer'),
    ];
  } else if (legacy) {
    components = ['lamp'];
  } else {
    throw new Error(
      'CIRCUIT_FIELD_MISSING: this circuit lists no components. State components, ' +
        'lamps or buzzers, or use one of the known states: ' +
        `${[...LEGACY_STATES].join(', ')}.`
    );
  }

  if (components.length > MAX_LAMPS + MAX_BUZZERS) {
    throw new Error(
      `CIRCUIT_COUNT_UNSUPPORTED: this circuit has ${components.length} components; ` +
        `the diagram draws at most ${MAX_LAMPS + MAX_BUZZERS}. Nothing was removed.`
    );
  }

  const rawSwitch = data.switch && typeof data.switch === 'object'
    ? data.switch.state
    : data.switch;
  let switchState = String(rawSwitch == null ? '' : rawSwitch).trim().toLowerCase();
  if (data.switchOpen === true || state === 'switch-open') switchState = 'open';
  if (switchState === '') {
    if (legacy || data.switchOpen === false) {
      switchState = 'closed';
    } else {
      throw new Error(
        'CIRCUIT_FIELD_MISSING: this circuit says nothing about its switch. State ' +
          'switch as open, closed or none, or state switchOpen explicitly.'
      );
    }
  } else if (switchState !== 'open' && switchState !== 'none' && switchState !== 'closed') {
    // A typo used to become "closed", turning a switch the lesson opened into
    // one that is shut.
    throw new Error(
      `CIRCUIT_STATE_INVALID: switch ${JSON.stringify(String(rawSwitch))} is not ` +
        `open, closed or none.`
    );
  }

  const rawPath = data.path || data.connection;
  const pathState = String(rawPath == null ? '' : rawPath).trim().toLowerCase();
  if (pathState && !['gap', 'incomplete', 'broken', 'complete'].includes(pathState)) {
    throw new Error(
      `CIRCUIT_STATE_INVALID: path ${JSON.stringify(String(rawPath))} is not ` +
        `complete, gap, incomplete or broken.`
    );
  }
  if (
    !pathState &&
    !legacy &&
    data.complete !== true &&
    data.complete !== false
  ) {
    throw new Error(
      'CIRCUIT_FIELD_MISSING: this circuit says nothing about its path. State path ' +
        'as complete, gap, incomplete or broken, or state complete explicitly.'
    );
  }
  const path = state === 'gap' || state === 'incomplete' || state === 'broken'
    || pathState === 'gap' || pathState === 'incomplete' || pathState === 'broken'
    || data.complete === false
    ? 'gap' : 'complete';

  const rawLabel = data.label == null ? '' : String(data.label);
  // Not truncated. A label cut at 24 characters loses the end of the sentence
  // that said what the circuit shows, and the sheet still looks finished.
  const label = rawLabel.replace(/^\|\|/, '').trim();

  return { cells, components, switch: switchState, path, label };
}

function normaliseCircuits(spec) {
  const data = spec && typeof spec === 'object' ? spec : {};
  if (Array.isArray(data.circuits) && data.circuits.length) {
    return data.circuits.map(normaliseCircuit);
  }
  if (data.circuit && typeof data.circuit === 'object') return [normaliseCircuit(data.circuit)];
  return [normaliseCircuit(data)];
}

function cacheKey(spec) {
  return `circuit-diagram:${JSON.stringify(normaliseCircuits(spec))}`;
}

function line(x1, y1, x2, y2, extra = '') {
  return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="currentColor" stroke-width="${WIRE_W}" stroke-linecap="round" ${extra}/>`;
}

function pathLine(d, extra = '') {
  return `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${WIRE_W}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}

function drawGap(x1, x2, y) {
  const mid = (x1 + x2) / 2;
  const half = Math.min(12, Math.max(6, (x2 - x1) / 4));
  return [
    line(x1, y, mid - half, y),
    line(mid + half, y, x2, y),
    `<circle cx="${f(mid - half)}" cy="${f(y)}" r="${GAP_DOT_R}" fill="currentColor"/>`,
    `<circle cx="${f(mid + half)}" cy="${f(y)}" r="${GAP_DOT_R}" fill="currentColor"/>`,
  ].join('');
}

function componentPositions(components, left, right) {
  if (!components.length) return [];
  const margin = 44;
  const start = left + margin;
  const end = right - margin;
  const step = components.length === 1 ? 0 : (end - start) / (components.length - 1);
  return components.map((type, i) => ({
    type,
    cx: components.length === 1 ? (left + right) / 2 : start + i * step,
    half: type === 'lamp' ? LAMP_R : BUZZER_HALF,
  }));
}

function drawLamp(cx) {
  const d = LAMP_R * 0.7;
  return [
    `<circle cx="${f(cx)}" cy="${f(TOP)}" r="${LAMP_R}" fill="white" stroke="currentColor" stroke-width="${MARK_W}"/>`,
    line(cx - d, TOP - d, cx + d, TOP + d),
    line(cx - d, TOP + d, cx + d, TOP - d),
  ].join('');
}

function drawBuzzer(cx) {
  return `<path d="M ${f(cx - BUZZER_HALF)} ${f(TOP)} Q ${f(cx)} ${f(TOP - BUZZER_RISE)} ${f(cx + BUZZER_HALF)} ${f(TOP)}" fill="none" stroke="currentColor" stroke-width="${MARK_W}" stroke-linecap="round"/>`;
}

function drawSwitch(right, switchState) {
  if (switchState === 'none') return line(right, TOP, right, BOTTOM);
  const mid = (TOP + BOTTOM) / 2;
  const upper = mid - SWITCH_GAP;
  const lower = mid + SWITCH_GAP;
  const parts = [
    line(right, TOP, right, upper),
    line(right, lower, right, BOTTOM),
    `<circle cx="${f(right)}" cy="${f(upper)}" r="${SWITCH_DOT_R}" fill="currentColor"/>`,
    `<circle cx="${f(right)}" cy="${f(lower)}" r="${SWITCH_DOT_R}" fill="currentColor"/>`,
  ];
  if (switchState === 'open') {
    parts.push(line(right, lower, right - 28, upper - 7));
  } else {
    parts.push(line(right, lower, right, upper));
  }
  return parts.join('');
}

function drawCells(left, right, cells) {
  if (!cells) return line(left, BOTTOM, right, BOTTOM);
  const groupWidth = (cells - 1) * CELL_STEP + CELL_PAIR_GAP;
  const firstLong = (left + right - groupWidth) / 2;
  const parts = [];
  let previous = left;
  for (let i = 0; i < cells; i += 1) {
    const longX = firstLong + i * CELL_STEP;
    const shortX = longX + CELL_PAIR_GAP;
    parts.push(line(previous, BOTTOM, longX, BOTTOM));
    parts.push(`<line x1="${f(longX)}" y1="${f(BOTTOM - CELL_LONG_H / 2)}" x2="${f(longX)}" y2="${f(BOTTOM + CELL_LONG_H / 2)}" stroke="currentColor" stroke-width="${WIRE_W}"/>`);
    parts.push(`<line x1="${f(shortX)}" y1="${f(BOTTOM - CELL_SHORT_H / 2)}" x2="${f(shortX)}" y2="${f(BOTTOM + CELL_SHORT_H / 2)}" stroke="currentColor" stroke-width="${CELL_SHORT_W}"/>`);
    previous = shortX;
  }
  parts.push(line(previous, BOTTOM, right, BOTTOM));
  return parts.join('');
}

function drawCircuit(circuit, offsetX) {
  const left = offsetX + LOOP_LEFT;
  const right = offsetX + LOOP_RIGHT;
  const positions = componentPositions(circuit.components, left, right);
  const parts = [];

  // The top wire is built as separate segments around each component. If the
  // path is incomplete, the break goes in the longest available wire segment
  // so it stays visibly deliberate even when several components are present.
  const segments = [];
  let cursor = left;
  positions.forEach((item) => {
    segments.push([cursor, item.cx - item.half]);
    cursor = item.cx + item.half;
  });
  segments.push([cursor, right]);
  let gapIndex = -1;
  if (circuit.path === 'gap') {
    gapIndex = segments.reduce((best, segment, i, all) => {
      return segment[1] - segment[0] > all[best][1] - all[best][0] ? i : best;
    }, 0);
  }
  segments.forEach((segment, i) => {
    if (segment[1] <= segment[0]) return;
    parts.push(i === gapIndex ? drawGap(segment[0], segment[1], TOP) : line(segment[0], TOP, segment[1], TOP));
  });

  positions.forEach((item) => {
    parts.push(item.type === 'buzzer' ? drawBuzzer(item.cx) : drawLamp(item.cx));
  });

  parts.push(pathLine(`M ${f(left)} ${f(TOP)} L ${f(left)} ${f(BOTTOM)}`));
  parts.push(drawSwitch(right, circuit.switch));
  parts.push(drawCells(left, right, circuit.cells));

  if (circuit.label) {
    // The label band is as wide as the circuit it names. A label that will not
    // fit is refused rather than trimmed: a caption cut mid-phrase reads as
    // finished and says the wrong thing, and the fix (shorter words, or fewer
    // circuits in the row) belongs to whoever wrote it.
    const labelWidth = circuit.label.length * LABEL_FONT * 0.55;
    if (labelWidth > LOOP_W) {
      throw new Error(
        `CIRCUIT_LABEL_DOES_NOT_FIT: the label ${JSON.stringify(circuit.label)} is ` +
          `wider than the circuit it labels. Shorten it; it was not truncated.`
      );
    }
    const centre = (left + right) / 2;
    parts.push(`<text x="${f(centre)}" y="${f(LABEL_BASELINE)}" font-family="Arial, sans-serif" font-size="${LABEL_FONT}" font-weight="bold" text-anchor="middle" fill="currentColor">${esc(circuit.label)}</text>`);
  }
  return parts.join('');
}

// ─── SYMBOL BANK ────────────────────────────────────────────────────────────
// A board reference of individually identifiable standard circuit symbols, for
// lessons that teach or consult the component-symbol map rather than inspect
// one complete circuit. The bank reuses the circuit's symbol language
// (stroke width, terminal dots, lamp cross, cell long/short pair) so the
// reference and the diagram a child copies it from cannot disagree.
//
// The items keep the supplied order and every symbol gets comparable visual
// space: one cell per entry, the symbol centred above its child-facing name.
const SYMBOL_BANK_SYMBOLS = ['cell', 'lamp', 'wire', 'switch-open', 'switch-closed'];
const SYMBOL_BANK_MIN_ITEMS = 2;
const SYMBOL_BANK_MAX_ITEMS = 6;
const SYMBOL_BANK_CELL_W = 140;
const SYMBOL_BANK_CELL_H = 100;
const SYMBOL_BANK_SYMBOL_CY = 38;
const SYMBOL_BANK_LABEL_BASELINE = 88;
const SYMBOL_BANK_LABEL_FONT = 18;
const SYMBOL_BANK_LABEL_MAX_W = SYMBOL_BANK_CELL_W - 10;
const SYMBOL_BANK_ARM = 24;        // switch terminal reach from the cell centre
const SYMBOL_BANK_DOT_R = 3.5;

function normaliseSymbolBank(spec) {
  const data = spec && typeof spec === 'object' && !Array.isArray(spec) ? spec : {};
  if (!Array.isArray(data.items)) {
    throw new Error(
      'CIRCUIT_BANK_INVALID: a symbol bank needs an items array of ' +
        '{ symbol, label } entries.'
    );
  }
  if (
    data.items.length < SYMBOL_BANK_MIN_ITEMS ||
    data.items.length > SYMBOL_BANK_MAX_ITEMS
  ) {
    throw new Error(
      `CIRCUIT_BANK_INVALID: a symbol bank holds ${SYMBOL_BANK_MIN_ITEMS} to ` +
        `${SYMBOL_BANK_MAX_ITEMS} entries; found ${data.items.length}. Nothing was ` +
        'added or dropped.'
    );
  }
  return data.items.map((item, i) => {
    const raw = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
    const symbol = String(raw.symbol == null ? '' : raw.symbol).trim().toLowerCase();
    if (!SYMBOL_BANK_SYMBOLS.includes(symbol)) {
      throw new Error(
        `CIRCUIT_BANK_INVALID: items[${i}].symbol ${JSON.stringify(String(raw.symbol))} ` +
          `is not a symbol this bank draws. Known: ${SYMBOL_BANK_SYMBOLS.join(', ')}.`
      );
    }
    const label = String(raw.label == null ? '' : raw.label).trim();
    if (!label) {
      throw new Error(
        `CIRCUIT_BANK_INVALID: items[${i}].label is the child-facing name of the ` +
          'symbol and cannot be empty.'
      );
    }
    // The same refusal the circuit gives its labels: a name cut mid-word reads
    // as finished and says the wrong thing, so it is reported, not trimmed.
    if (label.length * SYMBOL_BANK_LABEL_FONT * 0.55 > SYMBOL_BANK_LABEL_MAX_W) {
      throw new Error(
        `CIRCUIT_BANK_LABEL_DOES_NOT_FIT: items[${i}].label ` +
          `${JSON.stringify(label)} is wider than its cell. Shorten it; it was ` +
          'not truncated.'
      );
    }
    return { symbol, label };
  });
}

function bankLamp(cx, cy) {
  const d = LAMP_R * 0.7;
  return [
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${LAMP_R}" fill="white" stroke="currentColor" stroke-width="${MARK_W}"/>`,
    line(cx - d, cy - d, cx + d, cy + d),
    line(cx - d, cy + d, cx + d, cy - d),
  ].join('');
}

function bankCell(cx, cy) {
  return [
    `<line x1="${f(cx - 10)}" y1="${f(cy - CELL_LONG_H / 2)}" x2="${f(cx - 10)}" y2="${f(cy + CELL_LONG_H / 2)}" stroke="currentColor" stroke-width="${WIRE_W}"/>`,
    `<line x1="${f(cx + 10)}" y1="${f(cy - CELL_SHORT_H / 2)}" x2="${f(cx + 10)}" y2="${f(cy + CELL_SHORT_H / 2)}" stroke="currentColor" stroke-width="${CELL_SHORT_W}"/>`,
  ].join('');
}

function bankWire(cx, cy) {
  // A standard wire is a straight line and nothing else: endpoint dots would
  // read as terminals or junction markers, which ordinary wire is not.
  return line(cx - SYMBOL_BANK_ARM, cy, cx + SYMBOL_BANK_ARM, cy);
}

function bankSwitch(cx, cy, open) {
  const parts = [
    `<circle cx="${f(cx - SYMBOL_BANK_ARM)}" cy="${f(cy)}" r="${SYMBOL_BANK_DOT_R}" fill="currentColor"/>`,
    `<circle cx="${f(cx + SYMBOL_BANK_ARM)}" cy="${f(cy)}" r="${SYMBOL_BANK_DOT_R}" fill="currentColor"/>`,
  ];
  if (open) {
    // The blade lifts from the far terminal, the way the circuit's own open
    // switch leans, so the two renderings of "open" read as one thing.
    parts.push(line(cx + SYMBOL_BANK_ARM, cy, cx - SYMBOL_BANK_ARM + 12, cy - 19));
  } else {
    parts.push(line(cx - SYMBOL_BANK_ARM, cy, cx + SYMBOL_BANK_ARM, cy));
  }
  return parts.join('');
}

function symbolBankSvg(spec) {
  const items = normaliseSymbolBank(spec);
  const width = SYMBOL_BANK_CELL_W * items.length;
  const height = SYMBOL_BANK_CELL_H;
  const body = items.map((item, i) => {
    const cx = i * SYMBOL_BANK_CELL_W + SYMBOL_BANK_CELL_W / 2;
    const cy = SYMBOL_BANK_SYMBOL_CY;
    const glyph =
      item.symbol === 'cell' ? bankCell(cx, cy)
      : item.symbol === 'lamp' ? bankLamp(cx, cy)
      : item.symbol === 'wire' ? bankWire(cx, cy)
      : item.symbol === 'switch-open' ? bankSwitch(cx, cy, true)
      : bankSwitch(cx, cy, false);
    const label = `<text x="${f(cx)}" y="${f(SYMBOL_BANK_LABEL_BASELINE)}" font-family="Arial, sans-serif" font-size="${SYMBOL_BANK_LABEL_FONT}" font-weight="bold" text-anchor="middle" fill="currentColor">${esc(item.label)}</text>`;
    return `<g>${glyph}${label}</g>`;
  }).join('');
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(width)}" height="${f(height)}" viewBox="0 0 ${f(width)} ${f(height)}" class="h-circuit" role="img" aria-label="Circuit symbol bank"><g>${body}</g></svg>`;
  return { svg, aspect: width / height, w: width, h: height };
}

function symbolBankCacheKey(spec) {
  return `circuit-symbol-bank:${JSON.stringify(normaliseSymbolBank(spec))}`;
}
// ─── END SYMBOL BANK ────────────────────────────────────────────────────────

function tightSvg(spec) {
  const circuits = normaliseCircuits(spec);
  const labelled = circuits.some((circuit) => circuit.label);
  const width = ROW_PAD_X * 2 + circuits.length * LOOP_W + (circuits.length - 1) * ROW_GAP;
  const height = labelled ? LABEL_H : NO_LABEL_H;
  const body = circuits.map((circuit, i) => drawCircuit(circuit, ROW_PAD_X + i * (LOOP_W + ROW_GAP))).join('');
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(width)}" height="${f(height)}" viewBox="0 0 ${f(width)} ${f(height)}" class="h-circuit" role="img" aria-label="Series circuit diagram"><g>${body}</g></svg>`;
  return { svg, aspect: width / height, w: width, h: height };
}

module.exports = {
  tightSvg,
  cacheKey,
  normaliseCircuit,
  normaliseCircuits,
  symbolBankSvg,
  symbolBankCacheKey,
  normaliseSymbolBank,
};
