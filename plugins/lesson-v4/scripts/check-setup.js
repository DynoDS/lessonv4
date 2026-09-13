#!/usr/bin/env node
'use strict';

// Is this computer ready to build a lesson, and if not, make it ready.
//
//   node check-setup.js            look only; a second or two when all is well
//   node check-setup.js --fix --python <path>
//                                  install whatever is missing, then look again;
//                                  <path> is the PYTHON= the check printed
//   node check-setup.js --decline unsplash
//                                  remember that the teacher said no thanks
//
// A run used to discover a missing piece at the moment it needed it: the slide
// builder's libraries after twenty minutes of lesson design, a Python library
// when the first picture was measured, PowerPoint never, because a deck that
// could not be looked at was quietly built unlooked-at. Everything the package
// needs from the computer is checked here, once, before any design work, so a
// fresh computer, another teacher's computer and a cloud box all find out in
// the first seconds and the fix happens there.
//
// Two kinds of thing are checked and they are treated differently on purpose.
//
// Needed: the builders' Node libraries, a Python that can load the build
// libraries, the Python libraries that do the visual checks, and a browser to
// print worksheets. These are installed by --fix without asking, into the
// package's own folders and the plugin's own folder, so nothing else on the
// computer changes. Python itself is the exception: installing a program is the
// teacher's decision, so a computer with no Python at all is reported, not
// fixed.
//
// Nice to have: PowerPoint or LibreOffice (to look at slides), an Unsplash key
// (modern photographs), access to the drawings library. A run without them
// still delivers every resource, so their absence is a note for the teacher and
// never stops anything.
//
// Output, for the orchestrator:
//   SETUP_OK                      exit 0  nothing needed
//   SETUP_NEEDS_FIX: <what>       exit 4  run the SETUP_FIX_COMMAND line that follows
//   SETUP_NEEDS_PYTHON: <why>     exit 2  ask the teacher before installing Python
//   SETUP_BLOCKED: <why>          exit 3  the sandbox refused to start a Python
//   PYTHON=<absolute path>                the interpreter for this run, when one exists
//   SETUP_NOTE: <plain English>           one per thing the teacher should hear
//   SETUP_FIX_FAILED: <what>              --fix only: one per step that did not work

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const https = require('node:https');
const { spawnSync } = require('node:child_process');

const { findPython, librariesFor } = require('./find-python');
const { pluginHome, readSettings, writeSettings } = require('./plugin-settings');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const ENGINES = ['builder', 'worksheet-html', 'working-wall-html', 'stick-in-sheets-html'];
const DRAWINGS_PROBE_TIMEOUT_MS = 3000;
// A library that failed to install is not asked for again for a week, so one
// unavailable library cannot turn every run's check into an install attempt.
const RETRY_FAILED_INSTALL_MS = 7 * 24 * 60 * 60 * 1000;

// ------------------------------------------------------------------ builders

function missingNodeLibraries(root = PLUGIN_ROOT, platform = process.platform, arch = process.arch) {
  const gaps = [];
  for (const engine of ENGINES) {
    const folder = path.join(root, engine);
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(path.join(folder, 'package.json'), 'utf8'));
    } catch (_) {
      continue;
    }
    const missing = Object.keys(manifest.dependencies || {}).filter(
      (name) => !fs.existsSync(path.join(folder, 'node_modules', name, 'package.json'))
    );
    // sharp brings a compiled part made for one kind of computer. A copy made
    // on Windows is present on a Linux cloud box and still cannot load there.
    if (manifest.dependencies && manifest.dependencies.sharp && !missing.includes('sharp')) {
      const img = path.join(folder, 'node_modules', '@img');
      let parts = [];
      try {
        parts = fs.readdirSync(img);
      } catch (_) {
        parts = [];
      }
      const prefix = platform === 'linux' ? `sharp-linux` : `sharp-${platform}`;
      if (!parts.some((p) => p.startsWith(prefix) && p.endsWith(arch))) missing.push(`sharp for ${platform}-${arch}`);
    }
    if (missing.length) gaps.push({ engine, folder, missing });
  }
  return gaps;
}

// ------------------------------------------------------------------- browser

function findBrowser() {
  try {
    return require('../worksheet-html/src/chrome').findChrome();
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------- office programs

function onPath(names, env = process.env) {
  const dirs = String(env.PATH || env.Path || '').split(path.delimiter).filter(Boolean);
  for (const dir of dirs) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      try {
        if (fs.statSync(candidate).isFile()) return candidate;
      } catch (_) {
        // not here
      }
    }
  }
  return null;
}

function findPowerPoint(platform = process.platform, run = spawnSync) {
  if (platform !== 'win32') return null;
  const roots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], 'C:\\Program Files', 'C:\\Program Files (x86)'];
  for (const root of roots.filter(Boolean)) {
    for (const version of ['root\\Office16', 'Office16', 'root\\Office15', 'Office15']) {
      const exe = path.join(root, 'Microsoft Office', version, 'POWERPNT.EXE');
      if (fs.existsSync(exe)) return exe;
    }
  }
  // Click-to-run and store installs live elsewhere; Windows records them all
  // under App Paths.
  const key = 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\powerpnt.exe';
  const result = run('reg', ['query', key, '/ve'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
  const match = !result.error && result.status === 0 && /REG_SZ\s+(.+)/.exec(String(result.stdout || ''));
  return match ? match[1].trim().replace(/^"|"$/g, '') : null;
}

function findLibreOffice(platform = process.platform) {
  const hit = onPath(platform === 'win32' ? ['soffice.exe', 'soffice.com'] : ['soffice', 'libreoffice']);
  if (hit) return hit;
  const fixed = [
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    '/usr/bin/soffice',
    '/usr/local/bin/soffice',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  ];
  return fixed.find((p) => fs.existsSync(p)) || null;
}

// ------------------------------------------------------------------ pictures

function hasUnsplashKey(env = process.env) {
  if (String(env.UNSPLASH_ACCESS_KEY || '').trim()) return true;
  try {
    const text = fs.readFileSync(path.join(os.homedir(), '.env.unsplash'), 'utf8');
    return text.split(/\r?\n/).some((line) => {
      const m = /^\s*UNSPLASH_ACCESS_KEY=(.*)$/.exec(line);
      return m && m[1].trim() && m[1].trim() !== 'your_access_key_here';
    });
  } catch (_) {
    return false;
  }
}

// 'available', 'unavailable' or 'unchecked'. A sandbox with the network shut
// off cannot tell a private library from an unreachable one, and the workers
// that fetch drawings run with the network, so that case says nothing rather
// than warning the teacher on every run about something that works.
async function drawingsAccess(env = process.env) {
  const library = require('../shared/educational-svg-library');
  if (String(env[library.LOCAL_ROOT_VARIABLE] || '').trim()) return 'available';
  if (library.hasDrawings(library.cacheRoot(env))) return 'available';
  if (String(env.GITHUB_TOKEN || env.GH_TOKEN || '').trim()) return 'available';
  const repo = String(env[library.REPO_VARIABLE] || '').trim() || library.DEFAULT_REPO;
  return new Promise((resolve) => {
    const request = https.get(
      `https://api.github.com/repos/${repo}`,
      { headers: { 'User-Agent': 'lesson-resources-setup' }, timeout: DRAWINGS_PROBE_TIMEOUT_MS },
      (response) => {
        response.resume();
        if (response.statusCode === 200) return resolve('available');
        // Private and not signed in reads as not found. A signed-in GitHub CLI
        // still gets in, and asking it is only worth the time when it matters.
        if (response.statusCode === 404 || response.statusCode === 401 || response.statusCode === 403) {
          const gh = spawnSync('gh', ['auth', 'status'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
          return resolve(!gh.error && gh.status === 0 ? 'available' : 'unavailable');
        }
        resolve('unchecked');
      }
    );
    request.on('timeout', () => {
      request.destroy();
      resolve('unchecked');
    });
    request.on('error', () => resolve('unchecked'));
  });
}

// ------------------------------------------------------------ login filer

// The login filer runs from a copy in the plugin's own folder, because a task
// pointing into the package would break when an update replaces it. When a new
// version changes one of these files the copy is refreshed, or a computer would
// keep collecting cloud lessons with an old filer long after the fix shipped.
// scripts/plugin_settings.py keeps the same list.
const FILER_FILES = ['letterbox_filer.py', 'plugin_settings.py', 'deliver_files.py', 'resolve-filing.py'];

function staleFilerFiles(settings, home = pluginHome()) {
  const letterbox = settings && settings.letterbox;
  if (!letterbox || !letterbox.clone) return [];
  return FILER_FILES.filter((name) => {
    try {
      return !fs.readFileSync(path.join(__dirname, name)).equals(fs.readFileSync(path.join(home, 'filer', name)));
    } catch (_) {
      return true;
    }
  });
}

function refreshFiler(home = pluginHome()) {
  fs.mkdirSync(path.join(home, 'filer'), { recursive: true });
  for (const name of FILER_FILES) fs.copyFileSync(path.join(__dirname, name), path.join(home, 'filer', name));
}

// --------------------------------------------------------------------- state

function statePath() {
  return path.join(pluginHome(), 'setup-state.json');
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath(), 'utf8')) || {};
  } catch (_) {
    return {};
  }
}

function writeState(state) {
  try {
    fs.mkdirSync(pluginHome(), { recursive: true });
    fs.writeFileSync(statePath(), JSON.stringify(state, null, 2) + '\n');
  } catch (_) {
    // Unwritable state only means a failed install is retried sooner.
  }
}

function recentlyFailed(state, pip, now = Date.now()) {
  const at = state.failedInstalls && state.failedInstalls[pip];
  return Boolean(at) && now - Date.parse(at) < RETRY_FAILED_INSTALL_MS;
}

// --------------------------------------------------------------------- check

async function inspect(options = {}) {
  const env = options.env || process.env;
  const platform = options.platform || process.platform;
  const settings = readSettings(env);
  const state = readState();

  const nodeGaps = missingNodeLibraries(options.root, platform);
  const python = findPython({ env, platform });
  const browser = findBrowser();
  const powerpoint = findPowerPoint(platform);
  const libreoffice = powerpoint ? null : findLibreOffice(platform);

  const pythonLibraries = librariesFor(platform).filter(
    // pywin32 only earns its install when there is a PowerPoint to talk to.
    (lib) => lib.module !== 'win32com' || powerpoint
  );
  const missingPython = python.probe
    ? pythonLibraries.filter((lib) => python.probe.missing.includes(lib.module))
    : [];
  const toInstall = missingPython.filter((lib) => lib.required || !recentlyFailed(state, lib.pip));
  const givenUp = missingPython.filter((lib) => !toInstall.includes(lib));

  const notes = [];
  if (!powerpoint && !libreoffice) {
    notes.push(
      "I can build your slides but can't look at them to check them. Say 'install LibreOffice for me' " +
        "(it's free) or install PowerPoint, and I'll check them next time."
    );
  }
  for (const lib of givenUp) {
    notes.push(`The ${lib.pip} library would not install on this computer, so I can't ${lib.job} this time.`);
  }
  if (!hasUnsplashKey(env) && settings.unsplash !== 'declined') {
    notes.push(
      "Pictures will come from free archives. For more modern photos, say 'set up Unsplash' and I'll walk " +
        "you through getting a free key (about 3 minutes)."
    );
  }
  const drawings = options.skipDrawings ? 'unchecked' : await drawingsAccess(env);
  if (drawings === 'unavailable') {
    notes.push(
      "Optional drawings are unavailable because this computer isn't signed in to GitHub. Say 'sign me in " +
        "to GitHub' and I'll help."
    );
  }

  const staleFiler = staleFilerFiles(settings);

  const fixes = [];
  for (const gap of nodeGaps) fixes.push(`${gap.engine} libraries (${gap.missing.join(', ')})`);
  if (toInstall.length) fixes.push(`Python libraries (${toInstall.map((l) => l.pip).join(', ')})`);
  if (!browser) fixes.push('a browser to print worksheets');
  if (staleFiler.length) fixes.push(`the login filer's copy (${staleFiler.join(', ')}) after an update`);

  return { python, nodeGaps, toInstall, browser, powerpoint, libreoffice, drawings, notes, fixes, platform, staleFiler };
}

function pythonInstallAdvice(platform) {
  if (platform === 'win32') return 'winget install --exact --id Python.Python.3.12 --scope user';
  if (platform === 'darwin') return 'brew install python';
  return 'sudo apt-get install -y python3 python3-pip';
}

function report(result, { fixFailures = [] } = {}) {
  const lines = [];
  const { python } = result;
  let code = 0;
  if (python.status === 'PYTHON_BLOCKED') {
    const detail = python.tried.map((t) => `${t.label}: ${t.why}`).join('; ');
    lines.push(`SETUP_BLOCKED: a Python exists but this sandbox refused to start it (${detail}). Run this check again with permission to start a program.`);
    code = 3;
  } else if (python.status === 'PYTHON_UNAVAILABLE') {
    lines.push(
      'SETUP_NEEDS_PYTHON: this computer has no Python, and every lesson needs it. Ask the teacher before ' +
        `installing it. With their yes, install it (${pythonInstallAdvice(result.platform)}), then run this check again with --fix.`
    );
    code = 2;
  } else if (result.fixes.length) {
    lines.push(`SETUP_NEEDS_FIX: ${result.fixes.join('; ')}`);
    const target = python.exe ? ` --python "${python.exe}"` : '';
    lines.push(`SETUP_FIX_COMMAND: node "${path.join(__dirname, 'check-setup.js')}" --fix${target}`);
    code = 4;
  } else {
    lines.push('SETUP_OK');
  }
  if (python.exe) lines.push(`PYTHON=${python.exe}`);
  for (const failure of fixFailures) lines.push(`SETUP_FIX_FAILED: ${failure}`);
  for (const note of result.notes) lines.push(`SETUP_NOTE: ${note}`);
  return { text: lines.join('\n') + '\n', code };
}

// ----------------------------------------------------------------------- fix

function runStep(command, args, cwd) {
  const shell = process.platform === 'win32' && /^(npm|npx)$/.test(command);
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    shell,
    maxBuffer: 64 * 1024 * 1024,
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  const last = output.split(/\r?\n/).filter(Boolean).slice(-3).join(' | ');
  if (result.error) return { ok: false, why: String(result.error.message || result.error.code) };
  return { ok: result.status === 0, why: last || `exit ${result.status}` };
}

async function fix(options = {}) {
  const failures = [];
  const before = await inspect({ ...options, skipDrawings: true });
  if (before.python.status === 'PYTHON_BLOCKED' || before.python.status === 'PYTHON_UNAVAILABLE') {
    return inspect(options).then((after) => report(after));
  }

  for (const gap of before.nodeGaps) {
    process.stderr.write(`Installing the ${gap.engine} libraries...\n`);
    // The lock file is the exact set every other computer builds with; the
    // shared npm cache makes a reinstall after an update quick.
    let step = runStep('npm', ['ci', '--no-audit', '--no-fund', '--prefer-offline'], gap.folder);
    if (!step.ok) step = runStep('npm', ['install', '--no-audit', '--no-fund'], gap.folder);
    if (!step.ok) failures.push(`${gap.engine} libraries: ${step.why}`);
  }

  if (before.toInstall.length) {
    const exe = before.python.exe;
    const target = before.python.probe.extras;
    const state = readState();
    state.failedInstalls = state.failedInstalls || {};
    if (!before.python.probe.pip) {
      runStep(exe, ['-m', 'ensurepip', '--upgrade'], PLUGIN_ROOT);
    }
    process.stderr.write(`Installing Python libraries: ${before.toInstall.map((l) => l.pip).join(', ')}...\n`);
    // One library at a time, so one that has no build for this computer does
    // not stop the others.
    for (const lib of before.toInstall) {
      const step = runStep(
        exe,
        ['-m', 'pip', 'install', '--disable-pip-version-check', '--no-warn-script-location', '--upgrade', '--target', target, lib.pip],
        PLUGIN_ROOT
      );
      if (step.ok) {
        delete state.failedInstalls[lib.pip];
      } else {
        state.failedInstalls[lib.pip] = new Date().toISOString();
        failures.push(`${lib.pip}: ${step.why}`);
      }
    }
    writeState(state);
    // pip builds each library in a private temporary folder and then moves it
    // into place, and on Windows a moved file keeps the permissions of the
    // folder it was built in. Codex's sandbox is allowed to read the plugin's
    // folder but not that private one, so it saw every library as an empty
    // folder and asked for the same install on every run (13 September 2026).
    // Resetting makes each file take its folder's permissions again.
    if (process.platform === 'win32' && fs.existsSync(target)) {
      const step = runStep('icacls', [target, '/reset', '/T', '/C', '/Q'], PLUGIN_ROOT);
      if (!step.ok) failures.push(`permissions on the Python libraries: ${step.why}`);
    }
  }

  if (before.staleFiler && before.staleFiler.length) {
    try {
      refreshFiler();
    } catch (error) {
      failures.push(`the login filer's copy: ${error.message}`);
    }
  }

  if (!before.browser) {
    process.stderr.write('Fetching a browser to print worksheets...\n');
    const step = runStep(process.execPath, [path.join(PLUGIN_ROOT, 'worksheet-html', 'scripts', 'ensure-chrome.js')], PLUGIN_ROOT);
    if (!step.ok) failures.push(`browser: ${step.why}`);
  }

  const after = await inspect(options);
  return report(after, { fixFailures: failures });
}

// ---------------------------------------------------------------------- main

async function main(argv = process.argv.slice(2)) {
  const decline = argv.indexOf('--decline');
  if (decline !== -1) {
    const what = argv[decline + 1];
    if (what !== 'unsplash') {
      process.stdout.write('SETUP_USAGE: --decline takes: unsplash\n');
      return 1;
    }
    writeSettings({ unsplash: 'declined' });
    process.stdout.write('SETUP_REMEMBERED: unsplash declined\n');
    return 0;
  }
  // The fix usually runs with more access than the check that asked for it,
  // and a process with more access can start a different Python: under Codex
  // the sandboxed check can start only Codex's own, while the elevated fix
  // would find the teacher's, report it complete, and leave the sandbox's
  // Python as bare as before, so every run would ask again. `--python` names
  // the interpreter the check chose, and the fix installs into that one.
  const named = argv.indexOf('--python');
  const env = named !== -1 && argv[named + 1]
    ? { ...process.env, LESSON_RESOURCES_PYTHON: argv[named + 1] }
    : process.env;
  const outcome = argv.includes('--fix') ? await fix({ env }) : report(await inspect({ env }));
  process.stdout.write(outcome.text);
  return outcome.code;
}

if (require.main === module) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      process.stdout.write(`SETUP_ERROR: ${error && error.stack ? error.stack : error}\n`);
      process.exit(1);
    }
  );
}

module.exports = {
  ENGINES,
  missingNodeLibraries,
  staleFilerFiles,
  FILER_FILES,
  findPowerPoint,
  findLibreOffice,
  hasUnsplashKey,
  recentlyFailed,
  inspect,
  report,
  fix,
  main,
};
