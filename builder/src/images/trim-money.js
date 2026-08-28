'use strict';

const fs = require('fs');
const path = require('path');

const requireGlobal = require('../require-global');
let sharp = null;
function getSharp() {
  if (!sharp) sharp = requireGlobal('sharp');
  return sharp;
}

const ASSET_DIR   = path.resolve(__dirname, '..', '..', 'assets', 'money');
const TRIMMED_DIR = path.join(ASSET_DIR, '.trimmed');
const TRIM_THRESHOLD = 10;
const MAX_DIMENSION = 500;

function collectMoneyKeys(lesson) {
  const keys = new Set();
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.type === 'money' && Array.isArray(obj.items)) {
      obj.items.forEach(function (k) { keys.add(String(k)); });
    }
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);
  return Array.from(keys);
}

// Asset filenames avoid the £ sign (it trips up some packaging tools); lesson keys keep it.
function fileNameFor(key) {
  return `${String(key).replace(/£/g, 'pound')}.png`;
}

async function trimIfNeeded(key) {
  const srcPath = path.join(ASSET_DIR, fileNameFor(key));
  if (!fs.existsSync(srcPath)) return;
  const outPath = path.join(TRIMMED_DIR, fileNameFor(key));

  if (fs.existsSync(outPath)) {
    const srcStat = fs.statSync(srcPath);
    const outStat = fs.statSync(outPath);
    if (outStat.mtimeMs >= srcStat.mtimeMs) return;
  }

  try {
    fs.mkdirSync(TRIMMED_DIR, { recursive: true });
    const s = getSharp();
    await s(srcPath)
      .trim({ threshold: TRIM_THRESHOLD })
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toFile(outPath);
  } catch (err) {
    console.warn(`[trim-money] could not trim ${key}: ${err.message}`);
  }
}

async function preTrimMoney(lesson) {
  const keys = collectMoneyKeys(lesson);
  for (const k of keys) {
    await trimIfNeeded(k);
  }
}

function trimmedPathFor(key) {
  const outPath = path.join(TRIMMED_DIR, fileNameFor(key));
  return fs.existsSync(outPath) ? outPath : null;
}

module.exports = { preTrimMoney, trimmedPathFor, fileNameFor, ASSET_DIR };
