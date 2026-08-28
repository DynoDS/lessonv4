'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const circuit = require('../../shared/visuals/circuit-diagram-svg');

// The four canonical states are shorthand for one known circuit each, and
// lessons already written against them keep working.
for (const state of ['complete', 'gap', 'no-cell', 'switch-open']) {
  test(`the legacy state "${state}" still draws its established circuit`, () => {
    const { svg, aspect } = circuit.tightSvg({ state });
    assert.match(svg, /^<\?xml/);
    assert.ok(aspect > 0);
  });
}

test('counts stated in range are drawn exactly as given', () => {
  const { svg } = circuit.tightSvg({
    cells: 2,
    lamps: 3,
    switch: 'closed',
    path: 'complete',
  });
  assert.match(svg, /<svg/);
});

test('a count past what the diagram draws is refused, not clamped', () => {
  assert.throws(
    () => circuit.tightSvg({ cells: 1, lamps: 99 }),
    /CIRCUIT_COUNT_UNSUPPORTED/
  );
});

test('a fractional count is refused, not rounded', () => {
  // Rounding 3.5 lamps to 4 draws a circuit nobody described.
  assert.throws(
    () => circuit.tightSvg({ cells: 1, lamps: 3.5 }),
    /CIRCUIT_COUNT_UNSUPPORTED/
  );
});

test('an unknown component is refused, not dropped', () => {
  assert.throws(
    () => circuit.tightSvg({ cells: 1, components: ['lamp', 'motor'] }),
    /CIRCUIT_COMPONENT_UNSUPPORTED/
  );
});

test('a genuinely identical alias is accepted', () => {
  // "bulb" and "lamp" are the same component said two ways.
  const viaAlias = circuit.tightSvg({
    cells: 1,
    components: ['bulb'],
    switch: 'closed',
    path: 'complete',
  });
  const viaName = circuit.tightSvg({
    cells: 1,
    components: ['lamp'],
    switch: 'closed',
    path: 'complete',
  });
  assert.equal(viaAlias.svg, viaName.svg);
});

test('a mistyped switch state is refused, not repaired to closed', () => {
  // Repairing "opne" to "closed" turns a switch the lesson opened into a shut
  // one, and the slide then teaches the opposite of what it meant to.
  assert.throws(
    () => circuit.tightSvg({ cells: 1, lamps: 1, switch: 'opne' }),
    /CIRCUIT_STATE_INVALID/
  );
});

test('an unknown top-level state is refused rather than assumed complete', () => {
  assert.throws(
    () => circuit.tightSvg({ state: 'nearly-complete' }),
    /CIRCUIT_STATE_INVALID/
  );
});

test('a circuit that says nothing about its science is refused', () => {
  // No cells, no components, no known state: inventing a one-cell one-lamp
  // circuit would be inventing the answer to the question on the slide.
  assert.throws(() => circuit.tightSvg({}), /CIRCUIT_FIELD_MISSING/);
});

test('a non-legacy circuit with no switch state is refused, not assumed closed', () => {
  assert.throws(
    () => circuit.tightSvg({ cells: 2, lamps: 3, path: 'complete' }),
    /CIRCUIT_FIELD_MISSING:.*switch/
  );
});

test('a non-legacy circuit with no path state is refused, not assumed complete', () => {
  assert.throws(
    () => circuit.tightSvg({ cells: 2, lamps: 3, switch: 'closed' }),
    /CIRCUIT_FIELD_MISSING:.*path/
  );
});

test('a label that fits is drawn in full', () => {
  const { svg } = circuit.tightSvg({
    cells: 1,
    lamps: 1,
    switch: 'closed',
    path: 'complete',
    label: 'A complete circuit',
  });
  assert.match(svg, /A complete circuit/);
});

test('a label too wide for its circuit is refused, not truncated', () => {
  assert.throws(
    () =>
      circuit.tightSvg({
        cells: 1,
        lamps: 1,
        switch: 'closed',
        path: 'complete',
        label: 'This label is far too long to sit under one circuit diagram',
      }),
    /CIRCUIT_LABEL_DOES_NOT_FIT/
  );
});

test('the same spec produces the same drawing wherever it is asked for', () => {
  // One shared module, so the board, the sheet and the wall cannot disagree
  // about what this circuit looks like.
  const spec = {
    cells: 2,
    components: ['lamp', 'buzzer'],
    switch: 'open',
    path: 'complete',
  };
  assert.equal(circuit.tightSvg(spec).svg, circuit.tightSvg(spec).svg);
  assert.equal(circuit.cacheKey(spec), circuit.cacheKey(spec));
});

test('the symbol bank draws every requested symbol and name, in order', () => {
  const spec = {
    items: [
      { symbol: 'cell', label: 'cell' },
      { symbol: 'lamp', label: 'lamp' },
      { symbol: 'wire', label: 'wire' },
      { symbol: 'switch-open', label: 'open switch' },
      { symbol: 'switch-closed', label: 'closed switch' }
    ]
  };
  const { svg, aspect } = circuit.symbolBankSvg(spec);
  assert.match(svg, /^<\?xml/);
  assert.ok(aspect > 1, 'a five-symbol bank is a wide strip');
  const names = ['cell', 'lamp', 'wire', 'open switch', 'closed switch'];
  let cursor = -1;
  for (const name of names) {
    const at = svg.indexOf(`>${name}</text>`);
    assert.ok(at > cursor, `the ${name} label renders after the previous one`);
    cursor = at;
  }
  assert.equal(circuit.symbolBankCacheKey(spec), circuit.symbolBankCacheKey(spec));
});

test('the wire symbol is a plain straight line, with no terminal dots', () => {
  // A standard wire is a straight line and nothing else: endpoint dots read as
  // terminals or junction markers, which the bank's canonical reference must
  // not invent.
  const { svg } = circuit.symbolBankSvg({
    items: [
      { symbol: 'wire', label: 'wire' },
      { symbol: 'lamp', label: 'lamp' }
    ]
  });
  const wireCell = svg.split('</g>')[0];
  assert.equal(
    (wireCell.match(/<line /g) || []).length,
    1,
    'the wire cell is one straight line'
  );
  assert.ok(
    !wireCell.includes('<circle'),
    'no terminal dots on a standard wire'
  );
});

test('an unknown symbol is refused, not dropped from the bank', () => {
  // Dropping the motor would leave the child with a key missing the part the
  // lesson just taught; the refusal goes back to whoever wrote the bank.
  assert.throws(
    () => circuit.symbolBankSvg({
      items: [
        { symbol: 'cell', label: 'cell' },
        { symbol: 'motor', label: 'motor' }
      ]
    }),
    /CIRCUIT_BANK_INVALID:.*motor/
  );
});

test('a bank outside its 2 to 6 entries, or with an unfittable name, is refused', () => {
  const bank = (n) => Array.from({ length: n }, (_, i) => ({
    symbol: 'lamp',
    label: `lamp ${i + 1}`
  }));
  assert.throws(
    () => circuit.symbolBankSvg({ items: bank(1) }),
    /CIRCUIT_BANK_INVALID:.*2 to 6/
  );
  assert.throws(
    () => circuit.symbolBankSvg({ items: bank(7) }),
    /CIRCUIT_BANK_INVALID:.*2 to 6/
  );
  assert.throws(
    () => circuit.symbolBankSvg({
      items: [
        { symbol: 'cell', label: 'cell' },
        { symbol: 'lamp', label: 'a name that will never fit under one symbol' }
      ]
    }),
    /CIRCUIT_BANK_LABEL_DOES_NOT_FIT/
  );
});
