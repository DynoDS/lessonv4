'use strict';

// Pictures the lesson run could not get because the picture tool's usage ran
// out (the photo site's hourly allowance spent, or no picture maker available
// on this host or with allowance left). The teacher's ruling, 6 November 2026:
// a grey box is wanted only then, "if I don't" have usage, never when a search
// ran properly and found nothing. So these are the only missing pictures a
// final build may deliver: each is drawn as a grey box that says in plain
// words what goes there, and listed so the teacher, or a fresh session once
// the usage is back, can add it and rebuild. Every other missing picture still
// stops the build.
//
// The list comes from run-fixed-resource.py, which reads the run's picture
// records; the builder never decides for itself that a picture is awaited.

const fs = require('fs');

const awaiting = new Map();   // filename -> plain description
const drawn = new Map();      // "[slide, filename]" -> { slide, filename, describe }

function loadAwaitingPictures(filePath) {
  awaiting.clear();
  if (!filePath) return;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const list = Array.isArray(data) ? data : data.pictures;
  if (!Array.isArray(list)) {
    throw new Error(`AWAITING_PICTURES_INVALID: ${filePath} holds no "pictures" list.`);
  }
  for (const item of list) {
    if (!item || typeof item.filename !== 'string' || !item.filename.trim()) {
      throw new Error(`AWAITING_PICTURES_INVALID: an entry in ${filePath} has no filename.`);
    }
    const describe = typeof item.describe === 'string' && item.describe.trim()
      ? item.describe.trim()
      : item.filename;
    awaiting.set(item.filename, describe);
  }
}

function awaitedDescription(filename) {
  return awaiting.has(filename) ? awaiting.get(filename) : null;
}

function recordAwaitedPicture(slideNumber, filename) {
  drawn.set(JSON.stringify([slideNumber, filename]), {
    slide: slideNumber,
    filename,
    describe: awaiting.get(filename),
  });
}

function awaitedPictureFindings() {
  return Array.from(drawn.values(), (finding) => ({ ...finding }));
}

function clearAwaitedPictures() {
  drawn.clear();
}

module.exports = {
  loadAwaitingPictures,
  awaitedDescription,
  recordAwaitedPicture,
  awaitedPictureFindings,
  clearAwaitedPictures,
};
