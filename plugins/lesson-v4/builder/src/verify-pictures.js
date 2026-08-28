'use strict';

// Proves that the pictures a deck asks for are actually inside the file.
//
// A slide holds a picture in two halves that are written separately: the shape
// on the slide (`<p:pic>` carrying `r:embed="rId1"`) and the picture itself (a
// relationship pointing at a part under `ppt/media/`). When only the first half
// is written, PowerPoint opens the deck and draws a white box reading "The
// picture can't be displayed" exactly where the photograph should be.
//
// Nothing used to notice. The build finished, printed "No warnings.", renamed
// the deck into place and exited 0, so a deck with ten unusable slides read as
// a clean build to make-lesson, to a scheduled run, and to whoever was about to
// teach from it. The fault reached a person only when someone looked at the
// rendered pages.
//
// The half that goes missing is not always missing for the same reason, so this
// checks the finished package rather than any one cause. The cause already seen
// is the Windows extended-length path prefix: pptxgenjs decides a media part's
// file extension by splitting the path on "?" to drop a URL query, and on
// `\\?\C:\...` that leaves a bare backslash where `png` should be, so the media
// part and its relationship are dropped while the shape stays on the slide.
// `src/images/resolve.js` now takes that prefix off, and this stands behind it
// so the next cause is caught by the same net.
//
// Four things are checked, in the order a reader would ask them:
//
//   1. every picture on a slide names a relationship that exists;
//   2. every image relationship points at a part that is in the package;
//   3. every media part holds something that really is an image; and
//   4. every media part's extension has a declared content type, without which
//      PowerPoint will not open the part even when the bytes are perfect.
//
// It reads the package and changes nothing.

const { loadJSZip } = require('./fix-paragraph-props');

// Parts that can carry a picture. Slides are where a lesson's photographs live;
// the others are checked too because a broken picture on a layout or a master
// shows on every slide that uses it.
const PICTURE_PARTS =
  /^ppt\/(slides|slideLayouts|slideMasters|notesSlides|notesMasters)\/[^/]+\.xml$/;

const EMBED_ID = /r:(?:embed|link)="([^"]+)"/g;
const RELATIONSHIP = /<Relationship\b[^>]*>/g;
const ATTR = (name) => new RegExp(name + '="([^"]*)"');

const IMAGE_REL_TYPE = /\/relationships\/image$/;

// What the first bytes of a real picture look like. A media part that matches
// none of these is not a picture, whatever its name says.
const SIGNATURES = [
  { name: 'PNG', test: (b) => b.length > 8 && b.readUInt32BE(0) === 0x89504e47 },
  { name: 'JPEG', test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { name: 'GIF', test: (b) => b.length > 6 && b.toString('latin1', 0, 3) === 'GIF' },
  { name: 'BMP', test: (b) => b.length > 2 && b.toString('latin1', 0, 2) === 'BM' },
  {
    name: 'TIFF',
    test: (b) =>
      b.length > 4 &&
      (b.toString('latin1', 0, 4) === 'II\u002a\u0000' ||
        b.toString('latin1', 0, 4) === 'MM\u0000\u002a'),
  },
  {
    name: 'WebP',
    test: (b) =>
      b.length > 12 &&
      b.toString('latin1', 0, 4) === 'RIFF' &&
      b.toString('latin1', 8, 12) === 'WEBP',
  },
  { name: 'EMF', test: (b) => b.length > 44 && b.toString('latin1', 40, 44) === ' EMF' },
  {
    name: 'WMF',
    test: (b) =>
      b.length > 4 &&
      (b.readUInt32LE(0) === 0x9ac6cdd7 || (b[0] === 0x01 && b[1] === 0x00 && b[2] === 0x09)),
  },
  // An SVG is text, so it is recognised by its opening tag rather than a magic
  // number. PowerPoint reads one only alongside a raster preview, which is why
  // the pipeline rasterises its drawings before they reach a slide.
  {
    name: 'SVG',
    test: (b) => b.length > 0 && /^\s*<(\?xml|svg)/i.test(b.toString('utf8', 0, 200)),
  },
];

function slideNumber(partName) {
  const match = /^ppt\/slides\/slide(\d+)\.xml$/.exec(partName);
  return match ? Number(match[1]) : undefined;
}

// "ppt/slides/slide3.xml" -> "ppt/slides/_rels/slide3.xml.rels"
function relsPartFor(partName) {
  const cut = partName.lastIndexOf('/');
  return partName.slice(0, cut) + '/_rels' + partName.slice(cut) + '.rels';
}

// A relationship Target is written relative to the part that owns it, so
// "../media/image-1-1.png" inside ppt/slides is ppt/media/image-1-1.png.
function resolveTarget(partName, target) {
  const base = partName.slice(0, partName.lastIndexOf('/')).split('/');
  for (const step of target.split('/')) {
    if (step === '.' || step === '') continue;
    if (step === '..') base.pop();
    else base.push(step);
  }
  return base.join('/');
}

function parseRelationships(xml) {
  const out = new Map();
  let match;
  RELATIONSHIP.lastIndex = 0;
  while ((match = RELATIONSHIP.exec(xml)) !== null) {
    const tag = match[0];
    const id = ATTR('Id').exec(tag);
    if (!id) continue;
    const target = ATTR('Target').exec(tag);
    const type = ATTR('Type').exec(tag);
    const mode = ATTR('TargetMode').exec(tag);
    out.set(id[1], {
      target: target ? target[1] : '',
      type: type ? type[1] : '',
      external: !!mode && mode[1] === 'External',
    });
  }
  return out;
}

function declaredExtensions(contentTypesXml) {
  const out = new Set();
  const pattern = /<Default\b[^>]*Extension="([^"]*)"[^>]*>/g;
  let match;
  while ((match = pattern.exec(contentTypesXml)) !== null) {
    out.add(match[1].toLowerCase());
  }
  return out;
}

function overriddenParts(contentTypesXml) {
  const out = new Set();
  const pattern = /<Override\b[^>]*PartName="([^"]*)"[^>]*>/g;
  let match;
  while ((match = pattern.exec(contentTypesXml)) !== null) {
    out.add(match[1].replace(/^\//, ''));
  }
  return out;
}

function extensionOf(partName) {
  const base = partName.slice(partName.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return dot === -1 ? '' : base.slice(dot + 1).toLowerCase();
}

// Reads the written deck and reports every picture that would not appear.
// Returns `{ faults, pictures, media }`; an empty `faults` means every picture
// on every slide is present in the package and readable.
async function verifyPictures(pptxPath, deps) {
  const fs = (deps && deps.fs) || require('fs');
  const JSZip = (deps && deps.JSZip) || loadJSZip();

  const zip = await JSZip.loadAsync(fs.readFileSync(pptxPath));
  const names = new Set(Object.keys(zip.files));
  const faults = [];
  let pictures = 0;

  const contentTypesFile = zip.file('[Content_Types].xml');
  const contentTypes = contentTypesFile ? await contentTypesFile.async('string') : '';
  const defaults = declaredExtensions(contentTypes);
  const overrides = overriddenParts(contentTypes);

  const parts = Object.keys(zip.files).filter((name) => PICTURE_PARTS.test(name));
  parts.sort();

  for (const part of parts) {
    const xml = await zip.file(part).async('string');
    const ids = [];
    let match;
    EMBED_ID.lastIndex = 0;
    while ((match = EMBED_ID.exec(xml)) !== null) ids.push(match[1]);
    if (!ids.length) continue;

    const relsName = relsPartFor(part);
    const relsFile = zip.file(relsName);
    const rels = relsFile ? parseRelationships(await relsFile.async('string')) : new Map();
    const slide = slideNumber(part);
    const where = slide ? `slide ${slide}` : part;

    for (const id of ids) {
      pictures += 1;
      const rel = rels.get(id);
      if (!rel) {
        faults.push({
          slide,
          part,
          message:
            `${where} draws a picture (${id}) that the deck has no relationship for, ` +
            `so PowerPoint will show a white box reading "The picture can't be ` +
            `displayed" where the picture should be.`,
        });
        continue;
      }
      // A linked picture lives outside the file on purpose and is not something
      // this package can vouch for.
      if (rel.external) continue;
      if (!IMAGE_REL_TYPE.test(rel.type)) continue;

      const target = resolveTarget(part, rel.target);
      if (!names.has(target)) {
        faults.push({
          slide,
          part,
          message:
            `${where} draws a picture (${id}) whose file "${rel.target}" is not in ` +
            `the deck, so the slide would open with an empty frame where the ` +
            `picture should be.`,
        });
      }
    }
  }

  const media = Object.keys(zip.files).filter(
    (name) => /^ppt\/media\//.test(name) && !zip.files[name].dir
  );
  media.sort();

  for (const part of media) {
    const bytes = await zip.file(part).async('nodebuffer');
    if (!bytes.length) {
      faults.push({
        part,
        message: `the picture "${part}" is empty, so nothing would be drawn where it sits.`,
      });
      continue;
    }
    if (!SIGNATURES.some((sig) => sig.test(bytes))) {
      faults.push({
        part,
        message:
          `the picture "${part}" does not begin like any image format PowerPoint ` +
          `reads, so it would not be drawn. The file it was copied from is ` +
          `probably not the picture it claims to be.`,
      });
      continue;
    }
    const extension = extensionOf(part);
    if (!overrides.has(part) && !defaults.has(extension)) {
      faults.push({
        part,
        message:
          `the picture "${part}" has no declared content type for its "${extension || '(none)'}" ` +
          `extension, so PowerPoint would refuse to read it even though the file is ` +
          `a real image.`,
      });
    }
  }

  return { faults, pictures, media: media.length };
}

module.exports = {
  verifyPictures,
  parseRelationships,
  resolveTarget,
  relsPartFor,
  extensionOf,
  SIGNATURES,
};
