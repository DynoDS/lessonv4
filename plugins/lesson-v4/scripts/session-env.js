#!/usr/bin/env node
"use strict";

// Claude Code start-up step (hooks/hooks.json, SessionStart). It adds one line
// to the session's environment file, which Claude Code runs before every shell
// command in the session, workers included.
//
// PYTHON_BASIC_REPL=1 keeps Python 3.13 on its old interactive prompt. In Git
// Bash on Windows an empty here-block (`python3 - <<'EOF'` with nothing before
// `EOF`) or `< /dev/null` reaches Python as the NUL device, which Windows
// reports as a console, so Python opens its interactive prompt. The 3.13
// prompt cannot size a console that is not there, prints an error and tries
// again forever; the old prompt reads end of input and exits at once. Between
// 1 and 17 October 2026 that loop froze 27 worker and session commands until
// the tool's time limit stopped them (the lesson 31 decorator for 400
// seconds). Scripts given real input run exactly as before.
//
// Codex runs no here-blocks and gets no CLAUDE_ENV_FILE, so there this does
// nothing.

const fs = require("fs");

const envFile = process.env.CLAUDE_ENV_FILE;
if (!envFile) process.exit(0);

try {
  const current = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";
  if (!/^export PYTHON_BASIC_REPL=1$/m.test(current)) {
    const lead = current && !current.endsWith("\n") ? "\n" : "";
    fs.appendFileSync(envFile, `${lead}export PYTHON_BASIC_REPL=1\n`);
  }
} catch (error) {
  // A start-up step must never stop a session from opening.
  process.stderr.write(`lesson-v4 session-env: ${error.message}\n`);
}
