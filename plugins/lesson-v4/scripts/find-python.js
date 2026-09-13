#!/usr/bin/env node
'use strict';

// Find the one Python this run can actually use, on whatever computer it is on.
//
// Every script in this package used to be invoked as `python3`, and each worker
// found out for itself whether that meant anything. On Windows `python3` is
// often only a Microsoft Store shortcut; under Codex every command runs as a
// restricted sandbox user who cannot see the teacher's own `python` on PATH and
// is refused the teacher's Python install outright. Python trouble appeared in
// 22 of 39 recorded lesson runs, each worker spending its first command
// rediscovering it and many asking for elevated access to get round it
// (13 September 2026).
//
// This is Node rather than Python because it has to run before any Python is
// known, and the package already needs Node to build slides. It tries each
// candidate by running it, here, in this process's own sandbox, and asks it
// which of the plugin's libraries it can load - its own, plus any the plugin
// installed for itself (scripts/python_extras.py). The first that can load the
// libraries every build needs is printed as an absolute path, so every later
// command and every worker uses the same interpreter and nobody guesses.
//
// A fresh computer usually has a Python that starts but lacks those libraries.
// That is not the same as having no Python, because the libraries can be
// installed into it, so it gets its own answer.
//
// Usage:  node find-python.js          -> PYTHON=<absolute path>,      exit 0
//                                          PYTHON_NEEDS_LIBRARIES: ... exit 4
//                                          PYTHON_BLOCKED: ...         exit 3
//                                          PYTHON_UNAVAILABLE: ...     exit 2
// Run it WITHOUT elevated access: the answer has to be one the workers, who run
// unelevated, can use too.

const { spawnSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Every Python library the package uses. `required` ones stop every build
// without them; the rest each take away one job, named in plain English so a
// setup report can say what a missing one costs. `module` is what the probe
// looks for and `pip` is what gets installed.
const LIBRARIES = [
  { module: 'pptx', pip: 'python-pptx', required: true, job: 'build slides and fit their text' },
  { module: 'PIL', pip: 'Pillow', required: true, job: 'measure, crop and check pictures' },
  { module: 'pymupdf', pip: 'pymupdf', job: 'turn worksheet and working-wall pages into pictures so they can be checked by eye' },
  { module: 'fontTools', pip: 'fonttools', job: 'measure line height exactly when fitting slide text' },
  { module: 'docx', pip: 'python-docx', job: 'read maths plans written in Word' },
  { module: 'win32com', pip: 'pywin32', platform: 'win32', job: 'ask PowerPoint to turn slides into pictures so they can be checked by eye' },
];
const REQUIRED_MODULES = LIBRARIES.filter((l) => l.required).map((l) => l.module);
const TIMEOUT_MS = 30000;

function librariesFor(platform = process.platform) {
  return LIBRARIES.filter((l) => !l.platform || l.platform === platform);
}

// Required libraries are really imported, because one that is present but
// broken cannot build anything. The rest are only located, which is fast.
function probeSource(platform = process.platform) {
  const wanted = librariesFor(platform);
  return [
    'import importlib, importlib.util, json, sys',
    `sys.path.append(${JSON.stringify(__dirname)})`,
    'extras = None',
    'try:',
    '    import python_extras',
    '    extras = str(python_extras.extras_dir())',
    'except Exception:',
    '    pass',
    'missing = []',
    `for name in ${JSON.stringify(wanted.filter((l) => l.required).map((l) => l.module))}:`,
    '    try:',
    '        importlib.import_module(name)',
    '    except Exception:',
    '        missing.append(name)',
    `for name in ${JSON.stringify(wanted.filter((l) => !l.required).map((l) => l.module))}:`,
    '    try:',
    // A library whose files this process may not read is found as an empty
    // folder with no origin, and fails the moment it is used.
    '        spec = importlib.util.find_spec(name)',
    '        found = spec is not None and spec.origin is not None',
    '    except Exception:',
    '        found = False',
    '    if not found:',
    '        missing.append(name)',
    'pip = importlib.util.find_spec("pip") is not None',
    'print(json.dumps({"exe": sys.executable, "missing": missing, "pip": pip, "extras": extras, "version": "%d.%d" % sys.version_info[:2]}))',
  ].join('\n');
}

function candidates(env = process.env, platform = process.platform, home = os.homedir()) {
  const list = [];
  // An explicit choice always wins, for a machine none of the defaults suit.
  if (env.LESSON_RESOURCES_PYTHON) {
    list.push({ label: 'LESSON_RESOURCES_PYTHON', command: env.LESSON_RESOURCES_PYTHON, args: [] });
  }
  const onPath = platform === 'win32'
    ? [['python', []], ['py', ['-3']], ['python3', []]]
    : [['python3', []], ['python', []]];
  onPath.forEach(([command, args]) => list.push({ label: [command, ...args].join(' '), command, args }));
  // The Python Codex ships with its own runtime. Codex's sandbox is granted
  // access to it, which is exactly what a sandboxed worker needs when the
  // machine's own Python is out of its reach.
  const runtime = path.join(home, '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'python');
  const bundled = platform === 'win32'
    ? path.join(runtime, 'python.exe')
    : path.join(runtime, 'bin', 'python3');
  if (fs.existsSync(bundled)) list.push({ label: 'Codex runtime Python', command: bundled, args: [] });
  return list;
}

function probe(candidate, run = spawnSync, platform = process.platform) {
  const result = run(candidate.command, [...candidate.args, '-c', probeSource(platform)], {
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
    windowsHide: true,
  });
  if (result.error) {
    const code = result.error.code;
    if (code === 'EPERM' || code === 'EACCES') return { ok: false, blocked: true, why: `refused permission to start (${code})` };
    if (code === 'ENOENT') return { ok: false, why: 'not found' };
    return { ok: false, why: String(result.error.message || code) };
  }
  if (result.status !== 0) {
    const lines = String(result.stderr || result.stdout || '').trim().split(/\r?\n/);
    const last = lines[lines.length - 1] || `exit ${result.status}`;
    // A Windows sandbox reports a refused start as an access-denied failure of
    // the process itself rather than as a Node error code.
    if (/access is denied|permission denied/i.test(last)) return { ok: false, blocked: true, why: last };
    return { ok: false, why: last };
  }
  const last = String(result.stdout || '').trim().split(/\r?\n/).pop();
  let report;
  try {
    report = JSON.parse(last);
  } catch (_) {
    return { ok: false, why: 'printed no readable answer' };
  }
  if (!report || !report.exe) return { ok: false, why: 'printed no interpreter path' };
  const missing = Array.isArray(report.missing) ? report.missing : [];
  const lacking = missing.filter((m) => REQUIRED_MODULES.includes(m));
  return {
    ok: lacking.length === 0,
    started: true,
    exe: report.exe,
    missing,
    pip: Boolean(report.pip),
    extras: report.extras || null,
    version: report.version || null,
    why: lacking.length ? `cannot load ${lacking.join(' and ')}, which every build needs` : undefined,
  };
}

// The first Python that can load the required libraries wins. A Python that
// starts but cannot is remembered as the one to install them into, and the
// search carries on, because a later candidate may already have them.
function findPython(options = {}) {
  const tried = [];
  const platform = options.platform || process.platform;
  let fixable = null;
  for (const candidate of candidates(options.env, platform, options.home)) {
    const outcome = probe(candidate, options.run, platform);
    if (outcome.ok) return { status: 'PYTHON', exe: outcome.exe, probe: outcome, tried };
    tried.push({ label: candidate.label, ...outcome });
    if (outcome.started && !fixable) fixable = outcome;
  }
  if (fixable) return { status: 'PYTHON_NEEDS_LIBRARIES', exe: fixable.exe, probe: fixable, tried };
  const blocked = tried.some((t) => t.blocked);
  return { status: blocked ? 'PYTHON_BLOCKED' : 'PYTHON_UNAVAILABLE', tried };
}

if (require.main === module) {
  const found = findPython();
  const detail = found.tried.map((t) => `${t.label}: ${t.why}`).join('; ');
  if (found.status === 'PYTHON') {
    process.stdout.write(`PYTHON=${found.exe}\n`);
    process.exit(0);
  }
  if (found.status === 'PYTHON_NEEDS_LIBRARIES') {
    process.stdout.write(
      `PYTHON_NEEDS_LIBRARIES: ${found.exe} starts but cannot load ${REQUIRED_MODULES.join(' and ')} (${detail}). ` +
        `Run node "${path.join(__dirname, 'check-setup.js')}" --fix to install them.\n`
    );
    process.exit(4);
  }
  if (found.status === 'PYTHON_BLOCKED') {
    process.stdout.write(
      `PYTHON_BLOCKED: a Python exists but this sandbox refused to start it (${detail}). ` +
        'Re-run this finder with permission to start a child process; workers will need the same permission.\n'
    );
    process.exit(3);
  }
  process.stdout.write(
    `PYTHON_UNAVAILABLE: no Python starts on this computer (${detail}). ` +
      'Install Python 3, or set LESSON_RESOURCES_PYTHON to one.\n'
  );
  process.exit(2);
}

module.exports = { findPython, candidates, probe, probeSource, librariesFor, LIBRARIES, REQUIRED_MODULES };
