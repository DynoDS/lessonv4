'use strict';

const fs = require('fs');
const path = require('path');

// Windows writes very long paths with an extended-length prefix: `\\?\C:\...`,
// or `\\?\UNC\server\share\...` for a network share. Nothing in the pipeline
// asks for it. Python's `Path.resolve()` adds it on its own once a path passes
// 260 characters, which a lesson folder inside a OneDrive-backed SharePoint
// library reaches easily, and it then travels into lesson.json as an image path.
//
// Every Node file call reads it happily, so the path looks healthy all the way
// to the last step. pptxgenjs then decides the media part's file extension by
// splitting the path on "?" to drop a URL query, and on this prefix that leaves
// a bare backslash where `png` should be. The picture and its relationship are
// dropped from the finished package while the shape stays on the slide, so
// PowerPoint opens the deck and shows "The picture can't be displayed" on every
// slide that had a photograph, and the build reports no warnings at all.
//
// The prefix is only ever another way of writing the same local file, so taking
// it off changes nothing about which file is opened. It is not surplus
// everywhere, though: sharp cannot manage without it, which is what
// `longPathSafe` below is for. `verify-pictures.js` stands behind both and
// refuses to publish a deck whose pictures did not arrive, whatever the reason.
const EXTENDED_LENGTH = /^\\\\\?\\/;
const EXTENDED_UNC = /^\\\\\?\\UNC\\/i;

function normalizeLocalPath(value) {
  if (typeof value !== 'string' || !value) return value;
  if (!EXTENDED_LENGTH.test(value)) return value;
  if (EXTENDED_UNC.test(value)) return '\\\\' + value.slice('\\\\?\\UNC\\'.length);
  return value.slice('\\\\?\\'.length);
}

// The same prefix, needed rather than harmful, one library along.
//
// libvips, the library behind sharp, opens Windows files through the ANSI API,
// which stops at 260 characters. Node's own fs calls go further, so a lesson
// folder inside OneDrive can pass that limit while every existence check still
// says the photograph is there and sharp alone reports "Input file is missing".
// The picture is then unmeasurable, and the build stops with
// IMAGE_DIMENSIONS_UNAVAILABLE on a photo that is sitting right where it should
// be.
//
// The prefix is how Windows asks for the long-path API, and sharp reads it
// happily at any length, so it goes on every absolute Windows path rather than
// only the long ones. One rule, and no threshold to get wrong by a character.
//
// So the two libraries want opposite things from the same path: sharp needs the
// prefix, pptxgenjs breaks on it. Each is given the form it can use, at the
// point it is called, which is why this is a pair of functions rather than one
// house style for paths.
function longPathSafe(value) {
  if (typeof value !== 'string' || !value) return value;
  if (process.platform !== 'win32') return value;
  if (EXTENDED_LENGTH.test(value)) return value;
  if (!path.isAbsolute(value)) return value;
  // A normalised path is part of what the prefix means: Windows does no
  // tidying of its own once it is present, so a "." or a forward slash left in
  // would become part of the name it looks for.
  const full = path.resolve(value);
  if (/^\\\\/.test(full)) return '\\\\?\\UNC\\' + full.slice(2);
  if (!/^[A-Za-z]:\\/.test(full)) return value;
  return '\\\\?\\' + full;
}

function resolveAbsolute(imagePath, ctx) {
  if (!imagePath) return null;
  const local = normalizeLocalPath(imagePath);
  if (path.isAbsolute(local)) return local;
  const base = normalizeLocalPath((ctx && ctx.lessonDir) || process.cwd());
  return path.join(base, local);
}

function resolveForEmbed(imagePath, ctx) {
  const absolute = resolveAbsolute(imagePath, ctx);
  if (!absolute) return null;
  const base = normalizeLocalPath((ctx && ctx.lessonDir) || process.cwd());
  const relative = path.relative(base, absolute);
  if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
    const cachePath = path.join(base, '.resized', relative);
    if (fs.existsSync(cachePath)) return cachePath;
  }
  return absolute;
}

module.exports = { resolveAbsolute, resolveForEmbed, normalizeLocalPath, longPathSafe };
