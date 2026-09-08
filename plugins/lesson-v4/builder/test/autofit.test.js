'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { runAutofit, parseResult, autofitDiagnostics } = require('../src/autofit');

// A stand-in for the Python pass, so each classification can be produced on
// demand without needing a real deck or a real font.
function fakeScript(body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'autofit-test-'));
  const file = path.join(dir, 'fake_autofit.py');
  fs.writeFileSync(file, body);
  return file;
}

test('a clean pass is AUTOFIT_OK', () => {
  const script = fakeScript(
    'print(\'AUTOFIT_RESULT: {"overloaded": [], "measurementFailures": [], "fontMode": "exact"}\')\n'
  );

  const result = runAutofit('deck.pptx', { script });
  assert.equal(result.status, 'AUTOFIT_OK');
});

test('text that will not fit at the floor is content overload, not a technical fault', () => {
  const script = fakeScript(
    'print(\'AUTOFIT_RESULT: {"overloaded": [{"slide": 4, "box": "body", "preview": "..."}], ' +
      '"measurementFailures": [], "fontMode": "exact"}\')\n'
  );

  const result = runAutofit('deck.pptx', { script });
  assert.equal(result.status, 'TEXT_OVERLOAD');
  assert.equal(result.overloaded[0].slide, 4);
});

test('a box that could not be measured is a technical fault, kept apart from overload', () => {
  const script = fakeScript(
    'print(\'AUTOFIT_RESULT: {"overloaded": [], ' +
      '"measurementFailures": [{"slide": 2, "box": "body", "error": "bad metrics"}], ' +
      '"fontMode": "exact"}\')\n'
  );

  const result = runAutofit('deck.pptx', { script });
  assert.equal(result.status, 'AUTOFIT_MEASUREMENT_FAILED');
  assert.equal(result.failures[0].slide, 2);
});

test('no font to measure with is reported as a missing dependency', () => {
  const script = fakeScript(
    "print('AUTOFIT_DEPENDENCY_MISSING: no usable font for measurement.')\n" +
      'raise SystemExit(3)\n'
  );

  const result = runAutofit('deck.pptx', { script });
  assert.equal(result.status, 'AUTOFIT_DEPENDENCY_MISSING');
});

test('a missing script is a missing dependency rather than a silent skip', () => {
  const result = runAutofit('deck.pptx', {
    script: '/nowhere/at/all/fit_text_postprocess.py',
  });

  assert.equal(result.status, 'AUTOFIT_DEPENDENCY_MISSING');
});

test('a crash in the pass is AUTOFIT_PROCESS_FAILED', () => {
  const script = fakeScript('raise RuntimeError("exploded")\n');

  const result = runAutofit('deck.pptx', { script });
  assert.equal(result.status, 'AUTOFIT_PROCESS_FAILED');
});

// A refused spawn is not a crash. Every lesson run in September 2026 met
// `spawnSync python EPERM` on its first build, reported it as
// AUTOFIT_PROCESS_FAILED - "the pass itself crashed" - and spent its one
// infrastructure retry rediscovering that the same command works with access.
// Nothing was broken and nothing was missing; the door was shut.
test('a spawn the sandbox refuses is not reported as a crash', () => {
  const refuse = (code) => () => {
    const err = new Error(`spawnSync python ${code}`);
    err.code = code;
    throw err;
  };

  for (const code of ['EPERM', 'EACCES']) {
    const result = runAutofit('deck.pptx', {
      script: fakeScript('print("never reached")\n'),
      execFileSync: refuse(code),
    });
    assert.equal(result.status, 'AUTOFIT_NOT_PERMITTED', code);
    assert.match(result.message, /refused by the sandbox/);
    assert.match(result.message, /permission to start a child process/);
  }
});

// The discrimination that matters: an interpreter that genuinely is not here
// still reads as a missing dependency, not as a permission problem.
test('an interpreter that does not exist is still a missing dependency', () => {
  const absent = () => {
    const err = new Error('spawnSync python ENOENT');
    err.code = 'ENOENT';
    throw err;
  };

  const result = runAutofit('deck.pptx', {
    script: fakeScript('print("never reached")\n'),
    execFileSync: absent,
  });
  assert.equal(result.status, 'AUTOFIT_DEPENDENCY_MISSING');
});

test('a pass that reports nothing readable is not treated as a pass', () => {
  // Silence is not success: without a result line nothing can confirm the text
  // was ever measured.
  const script = fakeScript('print("done, I think")\n');

  const result = runAutofit('deck.pptx', { script });
  assert.equal(result.status, 'AUTOFIT_PROCESS_FAILED');
});

test('a malformed result line is not read as a pass either', () => {
  const script = fakeScript('print("AUTOFIT_RESULT: {not json}")\n');

  const result = runAutofit('deck.pptx', { script });
  assert.equal(result.status, 'AUTOFIT_PROCESS_FAILED');
});

test('the result line is found among other output', () => {
  const parsed = parseResult(
    'Fit-text: shrunk 3, unchanged 1\n' +
      'AUTOFIT_RESULT: {"overloaded": [], "measurementFailures": [], "fontMode": "exact"}\n'
  );

  assert.deepEqual(parsed.overloaded, []);
  assert.equal(parsed.fontMode, 'exact');
});

test('the result preserves grown and shrunk counts', () => {
  const parsed = parseResult(
    'AUTOFIT_RESULT: {"grown": 8, "shrunk": 5, "overloaded": [], ' +
      '"measurementFailures": [], "fontMode": "exact"}\n'
  );
  assert.equal(parsed.grown, 8);
  assert.equal(parsed.shrunk, 5);
});

test('every overloaded slide returns its own diagnostic, in order', () => {
  const script = fakeScript(
    'print(\'AUTOFIT_RESULT: {"overloaded": [' +
      '{"slide": 10, "box": "title", "preview": "ten..."}, ' +
      '{"slide": 11, "box": "body", "preview": "eleven..."}, ' +
      '{"slide": 12, "box": "body", "preview": "twelve..."}, ' +
      '{"slide": 17, "box": "subtitle", "preview": "seventeen..."}], ' +
      '"measurementFailures": [], "fontMode": "exact"}\')\n'
  );

  const result = runAutofit('deck.pptx', { script });
  assert.equal(result.status, 'TEXT_OVERLOAD');

  const diagnostics = autofitDiagnostics(result);
  assert.equal(diagnostics.length, 4);
  assert.deepEqual(
    diagnostics.map((d) => d.location.slide),
    [10, 11, 12, 17]
  );
  assert.deepEqual(
    diagnostics.map((d) => d.location.box),
    ['title', 'body', 'body', 'subtitle']
  );
  assert.ok(diagnostics.every((d) => d.code === 'TEXT_OVERLOAD'));
  assert.ok(diagnostics.every((d) => d.owner === 'content'));
  assert.equal(diagnostics[0].message, 'ten...');
  assert.equal(diagnostics[3].message, 'seventeen...');
});

test('every measurement failure returns its own diagnostic', () => {
  const script = fakeScript(
    'print(\'AUTOFIT_RESULT: {"overloaded": [], ' +
      '"measurementFailures": [' +
      '{"slide": 2, "box": "body", "error": "bad metrics"}, ' +
      '{"slide": 5, "box": "title", "error": "no extents"}], ' +
      '"fontMode": "exact"}\')\n'
  );

  const result = runAutofit('deck.pptx', { script });
  assert.equal(result.status, 'AUTOFIT_MEASUREMENT_FAILED');

  const diagnostics = autofitDiagnostics(result);
  assert.equal(diagnostics.length, 2);
  assert.deepEqual(
    diagnostics.map((d) => d.location.slide),
    [2, 5]
  );
  assert.ok(diagnostics.every((d) => d.code === 'AUTOFIT_MEASUREMENT_FAILED'));
  assert.ok(diagnostics.every((d) => d.owner === 'technical'));
  assert.equal(diagnostics[0].message, 'bad metrics');
  assert.equal(diagnostics[1].message, 'no extents');
});

test('a dependency failure returns one technical diagnostic', () => {
  const script = fakeScript(
    "print('AUTOFIT_DEPENDENCY_MISSING: no usable font for measurement.')\n" +
      'raise SystemExit(3)\n'
  );

  const result = runAutofit('deck.pptx', { script });
  assert.equal(result.status, 'AUTOFIT_DEPENDENCY_MISSING');

  const diagnostics = autofitDiagnostics(result);
  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0].code, 'AUTOFIT_DEPENDENCY_MISSING');
  assert.equal(diagnostics[0].owner, 'technical');
  assert.deepEqual(diagnostics[0].location, {});
  assert.equal(diagnostics[0].message, result.message);
});

test('a clean pass returns an empty diagnostics array', () => {
  const script = fakeScript(
    'print(\'AUTOFIT_RESULT: {"overloaded": [], "measurementFailures": [], "fontMode": "exact"}\')\n'
  );

  const result = runAutofit('deck.pptx', { script });
  assert.equal(result.status, 'AUTOFIT_OK');

  assert.deepEqual(autofitDiagnostics(result), []);
});
