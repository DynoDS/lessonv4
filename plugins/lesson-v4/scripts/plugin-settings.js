'use strict';

// The plugin's own folder on this computer, and the settings kept in it.
//
// Anything the plugin must remember between runs lives here rather than inside
// the package: Codex keeps a fresh copy of the package for every version and
// Claude Code replaces its copy on update, so a file written into the package
// is gone after the next update. The folder is named for the plugin's job, not
// for a version or a repository, so it keeps working whichever repository the
// plugin is installed from.
//
// Python reads the same folder through scripts/python_extras.py; the two must
// agree on HOME_VARIABLE and the default location.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOME_VARIABLE = 'LESSON_RESOURCES_HOME';

function pluginHome(env = process.env) {
  const configured = String(env[HOME_VARIABLE] || '').trim();
  return configured ? path.resolve(configured) : path.join(os.homedir(), '.lesson-resources');
}

function settingsPath(env) {
  return path.join(pluginHome(env), 'settings.json');
}

// A missing or unreadable file is an empty set of settings: nothing has been
// chosen yet, which is the state of every fresh computer.
function readSettings(env) {
  try {
    const parsed = JSON.parse(fs.readFileSync(settingsPath(env), 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

// Merge, never replace: two parts of the plugin remember different things in
// the same file, and neither may erase the other's.
function writeSettings(changes, env) {
  const next = { ...readSettings(env), ...changes };
  fs.mkdirSync(pluginHome(env), { recursive: true });
  const target = settingsPath(env);
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(next, null, 2) + '\n');
  fs.renameSync(temporary, target);
  return next;
}

module.exports = { HOME_VARIABLE, pluginHome, settingsPath, readSettings, writeSettings };
