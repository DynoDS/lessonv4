#!/usr/bin/env node
'use strict';

// Which surfaces draw each picture from its one shared drawing?
//
// A picture reaches up to four surfaces: the board, the worksheet, the working
// wall and the stick-in pack. For a long time the parity guard only asked
// whether each surface COULD draw a picture, never whether it drew the same one,
// so the number line ended up drawn four different ways: a Year 4 wall card
// printed its line in bold Arial with a red dot and "A = 1,800" beside slides
// that looked nothing like it, and a fix made to the worksheet line (the gap
// under its numbers, the Scale box) reached no other surface (13 September
// 2026). Daniel's ruling: everything shared, so a picture looks the same
// everywhere and no surface ever needs a picture rebuilt because "it can't use
// that one".
//
// This reads the code each surface actually runs and answers, per surface:
//
//   shared    the surface draws this key by calling the picture's shared module
//             (the file named in `geometrySource`)
//   own       the surface has the key, but draws it with code of its own
//   missing   the surface cannot draw this picture at all
//
// It reads source rather than trusting a declaration, because a declaration is
// exactly what drifted before.
//
// Run:  node builder/scripts/sharing-status.js           (a table)
//       node builder/scripts/sharing-status.js --backlog (the backlog literal)

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SURFACES = ['slides', 'worksheets', 'wall', 'stickin'];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function keysOf(value) {
  if (value === false || value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function sourcesOf(primitive) {
  return keysOf(primitive.geometrySource);
}

// The local names a file gives to a shared module, and whether it calls one of
// the module's drawing functions through them. A file that requires the module
// only for a helper (a colour table, a counter layout) does not draw the picture
// from it, which is why requiring alone is not enough.
const DRAWING_FUNCTIONS = ['tightSvg', 'buildLabelDiagramSvg', 'buildSvg'];

function drawsFrom(src, geometrySource) {
  const base = path.basename(geometrySource, '.js');
  const req = new RegExp(
    String.raw`(?:const|let|var)\s+(\{[^}]*\}|[A-Za-z_$][\w$]*)\s*=\s*require\(\s*['"][^'"]*shared/visuals/` +
      base.replace(/[-]/g, '\\-') +
      String.raw`(?:\.js)?['"]\s*\)`,
    'g'
  );
  let m;
  let found = false;
  while ((m = req.exec(src))) {
    const binding = m[1];
    if (binding.startsWith('{')) {
      const names = binding
        .slice(1, -1)
        .split(',')
        .map((part) => part.trim().split(':').map((x) => x.trim()))
        .filter((pair) => pair[0]);
      for (const [imported, local] of names) {
        if (!DRAWING_FUNCTIONS.includes(imported)) continue;
        const alias = local || imported;
        // Called directly, or handed on (buildSvg = tightSvg; fromShared(module)).
        if (new RegExp(String.raw`\b` + alias + String.raw`\b\s*[(,)]|=\s*` + alias + String.raw`\b`).test(src.replace(m[0], ''))) {
          found = true;
        }
      }
    } else {
      const alias = binding;
      const called = DRAWING_FUNCTIONS.some((fn) =>
        new RegExp(String.raw`\b` + alias + String.raw`\s*\.\s*` + fn + String.raw`\b`).test(src)
      );
      const passedWhole = new RegExp(String.raw`fromShared\(\s*` + alias + String.raw`\b`).test(src);
      if (called || passedWhole) found = true;
    }
  }
  return found;
}

// ── slides ──────────────────────────────────────────────────────────────────
// HELPERS maps a type to a draw function; the require lines say which file that
// function comes from. The picture is shared when that file draws from the
// module.
function slideFileFor(type) {
  const index = read('builder/src/content/index.js');
  const block = index.slice(index.indexOf('const HELPERS = {'));
  const entry = new RegExp(String.raw`(?:^|\n)\s*['"]?` + type.replace(/[-]/g, '\\-') + String.raw`['"]?\s*:\s*([A-Za-z_$][\w$]*)`).exec(block);
  if (!entry) return null;
  const fn = entry[1];
  const req = new RegExp(String.raw`const\s*\{[^}]*\b` + fn + String.raw`\b[^}]*\}\s*=\s*require\(\s*['"]\./([^'"]+)['"]\s*\)`).exec(index);
  return req ? `builder/src/content/${req[1]}.js` : null;
}

// A picture placed by the board's one generic placer (content/shared-figure.js):
// index.js makes its draw function with drawerFor('<type>'), and FIGURES in
// shared-figure.js names the module for that type.
function slideGenericFrom(type, geometrySource) {
  const index = read('builder/src/content/index.js');
  const block = index.slice(index.indexOf('const HELPERS = {'));
  const entry = new RegExp(String.raw`(?:^|
)\s*['"]?` + type.replace(/[-]/g, '\-') + String.raw`['"]?\s*:\s*([A-Za-z_$][\w$]*)`).exec(block);
  if (!entry) return false;
  const made = new RegExp(String.raw`const\s+` + entry[1] + String.raw`\s*=\s*drawerFor\(\s*['"]([^'"]+)['"]\s*\)`).exec(index);
  if (!made) return false;
  const figures = read('builder/src/content/shared-figure.js');
  const base = path.basename(geometrySource, '.js');
  const row = new RegExp(String.raw`['"]?` + made[1].replace(/[-]/g, '\-') + String.raw`['"]?\s*:\s*\{\s*module:\s*require\(\s*['"][^'"]*shared/visuals/` + base + String.raw`(?:\.js)?['"]`).test(figures);
  return row;
}

// ── worksheets ──────────────────────────────────────────────────────────────
// The helper registry is plain data; each family file declares its helpers in
// one object. Which file holds the key, and does that entry draw from the module?
function worksheetEntrySource(key) {
  const dir = path.join(ROOT, 'worksheet-html', 'src', 'helpers');
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.js')) continue;
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    const at = src.search(new RegExp(String.raw`\n\s*["']?` + key.replace(/[-]/g, '\\-') + String.raw`["']?\s*:\s*(?:fromShared\(|\{|\(\(\)|[A-Za-z_$])`));
    if (at < 0) continue;
    if (!/const helpers = \{/.test(src)) continue;
    const helpersAt = src.indexOf('const helpers = {');
    if (at < helpersAt) continue;
    return { file: `worksheet-html/src/helpers/${file}`, src, at };
  }
  return null;
}

function worksheetDrawsFrom(key, geometrySource) {
  const found = worksheetEntrySource(key);
  if (!found) return false;
  const { src, at } = found;
  // The entry runs until the next top-level helper key in the object.
  // Skip the key's own line (the match starts on the newline before it).
  const lineEnd = src.indexOf('\n', src.slice(at).search(/\S/) + at);
  const rest = src.slice(lineEnd);
  const next = rest.search(/\n  ["']?[a-z][\w-]*["']?\s*:\s*(?:fromShared\(|\{|\(\(\)|[A-Za-z_$])/);
  const entry = src.slice(at, lineEnd) + (next < 0 ? rest : rest.slice(0, next));
  const base = path.basename(geometrySource, '.js');
  // fromShared(alias, ...) where alias is the module.
  const direct = /fromShared\(\s*([A-Za-z_$][\w$]*)/.exec(entry);
  if (direct) {
    const alias = direct[1];
    return new RegExp(String.raw`\b` + alias + String.raw`\s*=\s*require\(\s*['"][^'"]*shared/visuals/` + base + String.raw`(?:\.js)?['"]`).test(src);
  }
  // Otherwise the entry names render functions defined in the same file; the
  // file must draw from the module and the entry's render must reach it.
  if (!drawsFrom(src, geometrySource)) return false;
  const renderName = /render\s*:\s*([A-Za-z_$][\w$]*)/.exec(entry);
  if (!renderName) return /tightSvg|buildLabelDiagramSvg/.test(entry);
  const body = new RegExp(String.raw`function\s+` + renderName[1] + String.raw`\s*\([^)]*\)\s*\{`).exec(src);
  if (!body) return false;
  const slice = src.slice(body.index, body.index + 6000);
  return /tightSvg|buildLabelDiagramSvg|Shared\.|Svg\.\w+\(/.test(slice);
}

// ── wall ────────────────────────────────────────────────────────────────────
// preRenderSvgs holds one table: type → { keyFn, tightFn | svgFn }. Shared when
// the drawing function is the module's own.
function wallDrawsFrom(key, geometrySource) {
  const src = read('working-wall-html/src/svg-renderer.js');
  const base = path.basename(geometrySource, '.js');
  const alias = new RegExp(String.raw`const\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*['"][^'"]*shared/visuals/` + base + String.raw`(?:\.js)?['"]\s*\)`).exec(src);
  const destructured = new RegExp(String.raw`const\s*\{([^}]*)\}\s*=\s*require\(\s*['"][^'"]*shared/visuals/` + base + String.raw`(?:\.js)?['"]\s*\)`).exec(src);
  const tableAt = src.indexOf('const PRIMITIVES = {');
  if (tableAt < 0) return false;
  const table = src.slice(tableAt, src.indexOf('};', tableAt));
  const row = new RegExp(String.raw`\n\s*['"]?` + key.replace(/[-]/g, '\\-') + String.raw`['"]?\s*:\s*\{([^}]*)\}`).exec(table);
  if (!row) return false;
  if (alias && new RegExp(String.raw`(?:tightFn|svgFn)\s*:[^,]*\b` + alias[1] + String.raw`\.tightSvg\b`).test(row[1])) return true;
  if (alias && new RegExp(String.raw`(?:tightFn|svgFn)\s*:\s*` + alias[1] + String.raw`\.`).test(row[1])) return true;
  if (destructured) {
    const names = destructured[1].split(',').map((x) => x.trim().split(':').pop().trim());
    return names.some((n) => new RegExp(String.raw`(?:tightFn|svgFn)\s*:\s*` + n + String.raw`\b`).test(row[1]));
  }
  return false;
}

// ── stick-in ────────────────────────────────────────────────────────────────
function stickinDrawsFrom(key, geometrySource) {
  const registry = require(path.join(ROOT, 'stick-in-sheets-html', 'src', 'visual-registry'));
  const mod = require(path.join(ROOT, geometrySource));
  const entry = (registry.VISUALS && registry.VISUALS[key]) || (registry.ROW_VISUALS && registry.ROW_VISUALS[key]);
  if (entry && typeof entry.tightSvg === 'function') {
    // Either the module's own function, or a wrapper that passes the stick-in
    // profile and says which module it wraps.
    return Object.values(mod).includes(entry.tightSvg) || entry.geometry === mod;
  }
  // A key dispatched through its own branch in render-piece-html.js.
  const src = read('stick-in-sheets-html/src/render-piece-html.js');
  if (!new RegExp(String.raw`item\.visual\s*===\s*["']` + key + String.raw`["']`).test(src)) return false;
  return drawsFrom(src, geometrySource);
}

function liveKeys() {
  const slides = Object.keys(require(path.join(ROOT, 'builder', 'src', 'content', 'index')).ZONE_COMPAT);
  const { helperNames } = require(path.join(ROOT, 'worksheet-html', 'src', 'helpers', 'index'));
  const worksheets = helperNames();
  const wall = Object.keys(require(path.join(ROOT, 'working-wall-html', 'src', 'visuals')).VISUAL_KEY_FNS);
  const reg = require(path.join(ROOT, 'stick-in-sheets-html', 'src', 'visual-registry'));
  const stickin = new Set([...Object.keys(reg.VISUALS), ...Object.keys(reg.ROW_VISUALS)]);
  const piece = read('stick-in-sheets-html/src/render-piece-html.js');
  for (const m of piece.matchAll(/item\.visual\s*===\s*["']([^"']+)["']/g)) stickin.add(m[1]);
  return { slides: new Set(slides), worksheets: new Set(worksheets), wall: new Set(wall), stickin };
}

function surfaceStatus(primitive, surface, live) {
  const keys = keysOf(primitive[surface]);
  if (!keys.length || !keys.every((k) => live[surface].has(k))) return 'missing';
  const sources = sourcesOf(primitive);
  if (!sources.length) return 'own';
  const shared = keys.every((key) =>
    sources.some((source) => {
      if (surface === 'slides') {
        if (slideGenericFrom(key, source)) return true;
        const file = slideFileFor(key);
        return Boolean(file) && drawsFrom(read(file), source);
      }
      if (surface === 'worksheets') return worksheetDrawsFrom(key, source);
      if (surface === 'wall') return wallDrawsFrom(key, source);
      return stickinDrawsFrom(key, source);
    })
  );
  return shared ? 'shared' : 'own';
}

function sharingStatus() {
  const { PICTURES } = require(path.join(ROOT, 'shared', 'visual-parity'));
  const live = liveKeys();
  const out = {};
  for (const primitive of PICTURES) {
    out[primitive.id] = Object.fromEntries(SURFACES.map((s) => [s, surfaceStatus(primitive, s, live)]));
  }
  return out;
}

// What still has to change, per picture: every surface that is not `shared`.
function backlogFrom(status) {
  const backlog = {};
  for (const [id, row] of Object.entries(status)) {
    const open = Object.fromEntries(Object.entries(row).filter(([, v]) => v !== 'shared'));
    if (Object.keys(open).length) backlog[id] = open;
  }
  return backlog;
}

module.exports = { sharingStatus, backlogFrom, SURFACES };

if (require.main === module) {
  const status = sharingStatus();
  if (process.argv.includes('--backlog')) {
    const backlog = backlogFrom(status);
    const lines = Object.entries(backlog).map(
      ([id, row]) => `  ${JSON.stringify(id)}: { ${Object.entries(row).map(([s, v]) => `${s}: '${v}'`).join(', ')} },`
    );
    console.log(`const SHARING_BACKLOG = Object.freeze({\n${lines.join('\n')}\n});`);
  } else {
    const pad = (s, n) => String(s).padEnd(n);
    console.log(pad('picture', 32) + SURFACES.map((s) => pad(s, 12)).join(''));
    for (const [id, row] of Object.entries(status)) {
      console.log(pad(id, 32) + SURFACES.map((s) => pad(row[s], 12)).join(''));
    }
    const done = Object.values(status).filter((row) => SURFACES.every((s) => row[s] === 'shared')).length;
    console.log(`\n${done} of ${Object.keys(status).length} pictures come from one shared drawing on all four surfaces.`);
  }
}
