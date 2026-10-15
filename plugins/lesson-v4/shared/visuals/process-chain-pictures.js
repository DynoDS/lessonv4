'use strict';

// Reading a process chain's pictures off disk, before the chain is drawn.
//
// The drawing (process-chain-svg.js) is pure: it is handed each picture already
// read, as `imageHref` with the file's own pixel size, the way a labelled
// diagram is. This is the one place that does the reading for the board, the
// working wall and the stick-in pack, so the three cannot drift. The worksheet
// needs none of it: its own walk (worksheet-html/src/images.js) already turns
// every `imagePath` in a sheet into `imageHref`, and it is that walk's reader
// used here, so a picture is read the same way on every surface.
//
// A picture that cannot be read is marked `imagePending` and named in
// `missing`. The chain then keeps a square place for it, as the board keeps one
// for any picture the run has not delivered yet, and the surface says so: a
// lesson is not held back for one photograph.

const path = require('node:path');

// A photograph straight from a camera is several megabytes, and a chain holds
// up to eight plus a bank. Past this many pixels on the long side nothing a
// board, a wall sheet or a page shows is gained.
const LONG_SIDE = 1400;

function reader() {
  return require('../../worksheet-html/src/images').embedImage;
}

async function readPicture(file, sharp) {
  const raw = reader()(file);
  if (!sharp || Math.max(raw.width, raw.height) <= LONG_SIDE || /^data:image\/svg/.test(raw.href)) return raw;
  try {
    const { data, info } = await sharp(file).rotate().resize({ width: LONG_SIDE, height: LONG_SIDE, fit: 'inside' }).jpeg({ quality: 84 }).toBuffer({ resolveWithObject: true });
    return { href: `data:image/jpeg;base64,${data.toString('base64')}`, width: info.width, height: info.height };
  } catch (e) {
    return raw;
  }
}

// A cycle's stages are a chain's links (cycle-svg.js), so its pictures are read
// here too.
const PICTURED = ['process-chain', 'cycle'];
const isChain = (node) => node && typeof node === 'object' && Array.isArray(node.boxes) && [node.type, node.helper, node.visual, node.kind].some((name) => PICTURED.includes(name));

// Fills `imageHref`, `imageWidth` and `imageHeight` on every link and bank
// picture of one chain that names an `imagePath`. Changes the spec it is given.
async function preparePictures(spec, baseDir, { sharp = null, missing = [], resolve = null } = {}) {
  if (!spec || typeof spec !== 'object') return spec;
  for (const list of [spec.boxes, spec.bank]) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (!item || typeof item !== 'object' || typeof item.imagePath !== 'string' || !item.imagePath.trim() || item.imageHref) continue;
      const file = (resolve && resolve(item.imagePath)) || (path.isAbsolute(item.imagePath) ? item.imagePath : path.join(baseDir || '.', item.imagePath));
      delete item.imagePending;
      try {
        const got = await readPicture(file, sharp);
        item.imageHref = got.href;
        item.imageWidth = got.width;
        item.imageHeight = got.height;
      } catch (e) {
        item.imagePending = true;
        missing.push({ imagePath: item.imagePath, text: item.text || '', message: String((e && e.message) || e) });
      }
    }
  }
  return spec;
}

// Every chain anywhere inside a spec (a lesson, a wall, a stick-in pack).
// Returns the pictures that could not be read, for the surface to report.
async function prepareChainsIn(root, baseDir, { sharp = null, resolve = null } = {}) {
  const missing = [];
  const seen = new Set();
  const walk = async (node) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (isChain(node)) await preparePictures(node, baseDir, { sharp, missing, resolve });
    // The stick-in pack names the drawing on the item and keeps its fields in `spec`.
    else if (PICTURED.includes(node.visual) && node.spec && Array.isArray(node.spec.boxes)) await preparePictures(node.spec, baseDir, { sharp, missing, resolve });
    for (const value of Array.isArray(node) ? node : Object.values(node)) await walk(value);
  };
  await walk(root);
  return missing;
}

module.exports = { preparePictures, prepareChainsIn, readPicture, LONG_SIDE };
