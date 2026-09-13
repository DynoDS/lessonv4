'use strict';

// One Python for the whole run, found by running each candidate where the run is.
//
// Every script used to be called as `python3`, and under Codex each worker ran
// as a sandbox user who could not find the teacher's `python` on PATH and was
// refused the teacher's Python install outright; only Codex's own Python would
// start. Python trouble appeared in 22 of 39 recorded runs (13 September 2026).
// These tests hold the finder's decisions without needing a sandbox: which
// candidates are tried in what order, and how a refusal, an absence and a
// Python that cannot run the build scripts are told apart.

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const { findPython, candidates, probe } = require('../../scripts/find-python');
const { runAutofit } = require('../src/autofit');

function fakeRun(table) {
  return (command) => {
    const outcome = table[command];
    if (!outcome) return { error: Object.assign(new Error('ENOENT'), { code: 'ENOENT' }) };
    return outcome;
  };
}

test('an explicit LESSON_V4_PYTHON is tried first, then the usual names, then Codex runtime Python', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'find-python-home-'));
  const runtime = path.join(home, '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'python');
  fs.mkdirSync(runtime, { recursive: true });
  fs.writeFileSync(path.join(runtime, 'python.exe'), '');
  const list = candidates({ LESSON_V4_PYTHON: 'C:/chosen/python.exe' }, 'win32', home).map((c) => c.label);
  assert.deepEqual(list, ['LESSON_V4_PYTHON', 'python', 'py -3', 'python3', 'Codex runtime Python']);
  const unix = candidates({}, 'linux', home).map((c) => c.label);
  assert.deepEqual(unix.slice(0, 2), ['python3', 'python']);
});

test('the first Python that starts and can import the build libraries wins, whatever refused before it', () => {
  const home = os.tmpdir();
  const refused = { error: Object.assign(new Error('EPERM'), { code: 'EPERM' }) };
  const noPptx = { status: 1, stdout: '', stderr: "ModuleNotFoundError: No module named 'pptx'" };
  const good = { status: 0, stdout: 'C:\\good\\python.exe\n', stderr: '' };
  const found = findPython({
    env: {}, platform: 'win32', home,
    run: fakeRun({ python: refused, py: noPptx, python3: good })
  });
  assert.equal(found.status, 'PYTHON');
  assert.equal(found.exe, 'C:\\good\\python.exe');
  assert.equal(found.tried[0].blocked, true, 'a refusal is recorded, not mistaken for absence');
  assert.match(found.tried[1].why, /cannot run the build scripts/);
});

test('when every Python that exists is refused, the answer is BLOCKED, not unavailable', () => {
  const denied = { status: 1, stdout: '', stderr: 'CreateProcessAsUserW failed: 5 (Access is denied.)' };
  const found = findPython({ env: {}, platform: 'win32', home: os.tmpdir(), run: fakeRun({ python: denied }) });
  assert.equal(found.status, 'PYTHON_BLOCKED');
  const none = findPython({ env: {}, platform: 'win32', home: os.tmpdir(), run: fakeRun({}) });
  assert.equal(none.status, 'PYTHON_UNAVAILABLE');
});

test('a refused name is not the end of the text-fitting search: the finder is asked', () => {
  const script = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'autofit-')), 'fit.py');
  fs.writeFileSync(script, 'print("stub")\n');
  const calls = [];
  const execFileSync = (bin) => {
    calls.push(bin);
    if (bin === 'C:/codex/python.exe') {
      return 'AUTOFIT_RESULT: {"overloaded": [], "measurementFailures": [], "fontMode": "exact"}\n';
    }
    throw Object.assign(new Error(`spawnSync ${bin} EPERM`), { code: 'EPERM' });
  };
  const result = runAutofit('deck.pptx', {
    script, env: {}, execFileSync,
    findPython: () => ({ status: 'PYTHON', exe: 'C:/codex/python.exe' })
  });
  assert.equal(result.status, 'AUTOFIT_OK', JSON.stringify(result));
  assert.equal(calls[calls.length - 1], 'C:/codex/python.exe');
});

test('the interpreter handed down by the build wrapper is used and nothing is guessed', () => {
  const script = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'autofit-')), 'fit.py');
  fs.writeFileSync(script, 'print("stub")\n');
  const calls = [];
  runAutofit('deck.pptx', {
    script,
    env: { LESSON_V4_PYTHON: 'C:/handed/python.exe' },
    execFileSync: (bin) => { calls.push(bin); return 'AUTOFIT_RESULT: {"overloaded": [], "measurementFailures": []}\n'; },
    findPython: () => { throw new Error('the finder should not be needed'); }
  });
  assert.deepEqual(calls, ['C:/handed/python.exe']);
});

test('probe reads a missing interpreter as not found', () => {
  const outcome = probe({ command: 'definitely-not-a-python-here', args: [] });
  assert.equal(outcome.ok, false);
});
