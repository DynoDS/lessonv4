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
// candidate by running it, here, in this process's own sandbox, and asks it to
// import the libraries the build scripts need. The first that answers is
// printed as an absolute path, so every later command and every worker uses the
// same interpreter and nobody guesses.
//
// Usage:  node find-python.js          -> PYTHON=<absolute path>, exit 0
//                                          PYTHON_BLOCKED: ...      exit 3
//                                          PYTHON_UNAVAILABLE: ...  exit 2
// Run it WITHOUT elevated access: the answer has to be one the workers, who run
// unelevated, can use too.

const { spawnSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

// The libraries a build needs. A Python that starts but lacks these would pass
// the start-up check and fail at the first build, which is the rediscovery this
// script exists to end.
const REQUIRED_MODULES = ['pptx', 'PIL'];
const PROBE = `import sys\nimport ${REQUIRED_MODULES.join(', ')}\nprint(sys.executable)`;
const TIMEOUT_MS = 30000;

function candidates(env = process.env, platform = process.platform, home = os.homedir()) {
  const list = [];
  // An explicit choice always wins, for a machine none of the defaults suit.
  if (env.LESSON_V4_PYTHON) list.push({ label: 'LESSON_V4_PYTHON', command: env.LESSON_V4_PYTHON, args: [] });
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

function probe(candidate, run = spawnSync) {
  const result = run(candidate.command, [...candidate.args, '-c', PROBE], {
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
    return { ok: false, why: /No module named/.test(last) ? `${last} (it cannot run the build scripts)` : last };
  }
  const exe = String(result.stdout || '').trim().split(/\r?\n/).pop();
  return exe ? { ok: true, exe } : { ok: false, why: 'printed no interpreter path' };
}

function findPython(options = {}) {
  const tried = [];
  for (const candidate of candidates(options.env, options.platform, options.home)) {
    const outcome = probe(candidate, options.run);
    if (outcome.ok) return { status: 'PYTHON', exe: outcome.exe, tried };
    tried.push({ label: candidate.label, ...outcome });
  }
  const blocked = tried.some((t) => t.blocked);
  return { status: blocked ? 'PYTHON_BLOCKED' : 'PYTHON_UNAVAILABLE', tried };
}

if (require.main === module) {
  const found = findPython();
  if (found.status === 'PYTHON') {
    process.stdout.write(`PYTHON=${found.exe}\n`);
    process.exit(0);
  }
  const detail = found.tried.map((t) => `${t.label}: ${t.why}`).join('; ');
  if (found.status === 'PYTHON_BLOCKED') {
    process.stdout.write(
      `PYTHON_BLOCKED: a Python exists but this sandbox refused to start it (${detail}). ` +
        'Re-run this finder with permission to start a child process; workers will need the same permission.\n'
    );
    process.exit(3);
  }
  process.stdout.write(
    `PYTHON_UNAVAILABLE: no Python that can import ${REQUIRED_MODULES.join(' and ')} was found (${detail}). ` +
      'Install Python 3 with python-pptx and Pillow, or set LESSON_V4_PYTHON to one that has them.\n'
  );
  process.exit(2);
}

module.exports = { findPython, candidates, probe, REQUIRED_MODULES };
