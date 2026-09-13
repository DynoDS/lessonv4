'use strict';

// The start-of-run check: what a fresh computer, a set-up computer and a cloud
// box each hear, without needing one of each to hand. The real installs were
// proved once by hand on a clean copy of the package (13 September 2026); these
// hold the decisions that route a run: which gaps are fixed without asking,
// which only become a note, and which need the teacher's yes.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const setup = require('../../scripts/check-setup');
const settings = require('../../scripts/plugin-settings');

function engineTree(installed) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-engines-'));
  const manifests = {
    builder: { pptxgenjs: '^3', sharp: '^0.33' },
    'worksheet-html': { 'puppeteer-core': '^23', 'pdf-lib': '^1' },
  };
  for (const [engine, deps] of Object.entries(manifests)) {
    fs.mkdirSync(path.join(root, engine), { recursive: true });
    fs.writeFileSync(path.join(root, engine, 'package.json'), JSON.stringify({ dependencies: deps }));
    for (const dep of installed[engine] || []) {
      const at = path.join(root, engine, 'node_modules', dep);
      fs.mkdirSync(at, { recursive: true });
      if (!dep.startsWith('@img')) fs.writeFileSync(path.join(at, 'package.json'), '{}');
    }
  }
  return root;
}

function result(overrides = {}) {
  return {
    python: { status: 'PYTHON', exe: 'C:/py/python.exe', tried: [], probe: { missing: [] } },
    notes: [],
    fixes: [],
    platform: 'win32',
    ...overrides,
  };
}

test('a fresh package reports every builder library it lacks', () => {
  const root = engineTree({});
  const gaps = setup.missingNodeLibraries(root, 'win32', 'x64');
  assert.deepEqual(gaps.map((g) => [g.engine, g.missing]), [
    ['builder', ['pptxgenjs', 'sharp']],
    ['worksheet-html', ['puppeteer-core', 'pdf-lib']],
  ]);
});

test('an installed package reports nothing', () => {
  const root = engineTree({
    builder: ['pptxgenjs', 'sharp', '@img/sharp-win32-x64'],
    'worksheet-html': ['puppeteer-core', 'pdf-lib'],
  });
  assert.deepEqual(setup.missingNodeLibraries(root, 'win32', 'x64'), []);
});

test('libraries installed for Windows are still missing on a Linux cloud box', () => {
  const root = engineTree({
    builder: ['pptxgenjs', 'sharp', '@img/sharp-win32-x64'],
    'worksheet-html': ['puppeteer-core', 'pdf-lib'],
  });
  const gaps = setup.missingNodeLibraries(root, 'linux', 'x64');
  assert.deepEqual(gaps.map((g) => g.missing), [['sharp for linux-x64']]);
});

test('each state has its own status line and exit code', () => {
  assert.equal(setup.report(result()).code, 0);
  assert.match(setup.report(result()).text, /^SETUP_OK\nPYTHON=C:\/py\/python.exe\n$/);

  const needsFix = setup.report(result({ fixes: ['builder libraries (sharp)'] }));
  assert.equal(needsFix.code, 4);
  assert.match(needsFix.text, /^SETUP_NEEDS_FIX: builder libraries \(sharp\)\n/);
  // The fix is told which Python the check chose, or an elevated fix installs
  // into a different one and the sandbox asks again on every run.
  assert.match(needsFix.text, /\nSETUP_FIX_COMMAND: node ".*check-setup\.js" --fix --python "C:\/py\/python\.exe"\n/);
  assert.match(needsFix.text, /\nPYTHON=C:\/py\/python\.exe\n/);

  const noPython = setup.report(result({ python: { status: 'PYTHON_UNAVAILABLE', tried: [] } }));
  assert.equal(noPython.code, 2);
  assert.match(noPython.text, /^SETUP_NEEDS_PYTHON: .*Ask the teacher/);
  assert.doesNotMatch(noPython.text, /PYTHON=/);

  const refused = setup.report(result({ python: { status: 'PYTHON_BLOCKED', tried: [{ label: 'python', why: 'EPERM' }] } }));
  assert.equal(refused.code, 3);
  assert.match(refused.text, /^SETUP_BLOCKED:/);
});

test('a note never changes the status: the run carries on and the teacher is told', () => {
  const noted = setup.report(result({ notes: ["I can build your slides but can't look at them to check them."] }));
  assert.equal(noted.code, 0);
  assert.match(noted.text, /^SETUP_OK\n.*\nSETUP_NOTE: I can build your slides/s);
});

test('a library that would not install is not asked for again for a week', () => {
  const now = Date.parse('2026-09-13T12:00:00Z');
  const state = { failedInstalls: { pymupdf: '2026-09-10T12:00:00Z', pywin32: '2026-09-01T12:00:00Z' } };
  assert.equal(setup.recentlyFailed(state, 'pymupdf', now), true);
  assert.equal(setup.recentlyFailed(state, 'pywin32', now), false);
  assert.equal(setup.recentlyFailed({}, 'fonttools', now), false);
});

test('a key in the environment counts as an Unsplash key', () => {
  assert.equal(setup.hasUnsplashKey({ UNSPLASH_ACCESS_KEY: 'abc' }), true);
});

test('declining a note is remembered without erasing other settings', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-home-'));
  const env = { LESSON_RESOURCES_HOME: home };
  settings.writeSettings({ outputFolder: 'D:/Lessons' }, env);
  settings.writeSettings({ unsplash: 'declined' }, env);
  assert.deepEqual(settings.readSettings(env), { outputFolder: 'D:/Lessons', unsplash: 'declined' });
});

test('an unreadable settings file is an empty one, not a crash', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-home-'));
  fs.writeFileSync(path.join(home, 'settings.json'), '{ not json');
  assert.deepEqual(settings.readSettings({ LESSON_RESOURCES_HOME: home }), {});
});

test('PowerPoint is looked for only on Windows, and a Windows record of it counts', () => {
  const recorded = () => ({ status: 0, stdout: '\n    (Default)    REG_SZ    D:\\Office\\POWERPNT.EXE\n' });
  const absent = () => ({ status: 1, stdout: '' });
  assert.equal(setup.findPowerPoint('linux', recorded), null);
  // The usual Office folders may really exist on the computer running this
  // test, and then they answer first; either way an answer comes back.
  assert.ok(setup.findPowerPoint('win32', recorded));
  const onlyFolders = setup.findPowerPoint('win32', absent);
  assert.ok(onlyFolders === null || /POWERPNT\.EXE$/i.test(onlyFolders));
});
