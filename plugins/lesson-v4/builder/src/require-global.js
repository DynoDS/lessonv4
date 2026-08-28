'use strict';

const { execSync } = require('child_process');
const path = require('path');

let cachedGlobalRoot = null;

function globalNodeModulesRoot() {
  if (cachedGlobalRoot) return cachedGlobalRoot;
  const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
  cachedGlobalRoot = root;
  return root;
}

function requireGlobal(name) {
  try {
    return require(name);
  } catch (_) {
    const resolved = path.join(globalNodeModulesRoot(), name);
    return require(resolved);
  }
}

module.exports = requireGlobal;
