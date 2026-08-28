#!/usr/bin/env node
'use strict';

// Guards a deck's promise that the pictures on its slides are actually in it.
//
// The failure this exists for: a lesson's photographs were embedded by absolute
// path, those paths arrived carrying the Windows extended-length prefix
// (`\\?\C:\...`) that Python's Path.resolve() adds once a path passes 260
// characters, and pptxgenjs derived the media part's file extension by
// splitting the path on "?". That left a bare backslash where `png` should be,
// so the picture and its relationship were dropped from the package while the
// shape stayed on the slide. PowerPoint opened the deck and drew a white box
// reading "The picture can't be displayed" on every slide that had a photo.
//
// Nothing noticed. The build printed "No warnings.", renamed the deck into
// place and exited 0, so ten unusable slides read as a clean build to
// make-lesson and to whoever was about to teach from it. The fault reached a
// person only when someone looked at the rendered pages.
//
// Two halves are proved here, on real builds rather than on a description of
// one:
//   1. THE REPAIR - a picture path carrying the prefix now reaches the deck as
//      a real embedded picture;
//   2. THE GATE - when the repair is defeated, the build refuses to publish,
//      names the fault, and leaves whatever deck was already there alone.
//
// The gate matters more than the repair. The prefix is one way for a picture to
// go missing and it is now closed, but the gate is what makes the next way
// visible on the day it happens instead of in a classroom.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { spawnSync } = require('child_process');

const BUILD = path.join(__dirname, '..', 'build.js');
const RESOLVE = path.join(__dirname, '..', 'src', 'images', 'resolve.js');
const SOURCE_IMAGE = path.join(__dirname, '..', 'assets', 'signals', 'star.png');

const BACKSLASH = String.fromCharCode(92);
const EXTENDED_PREFIX = BACKSLASH + BACKSLASH + '?' + BACKSLASH;

let failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log('  ok   ' + name);
  } catch (err) {
    failures += 1;
    console.error('  FAIL ' + name);
    console.error('       ' + (err.message || err));
  }
}

function spec(imagePath) {
  return {
    lessonName: 'Picture Guard',
    yearGroup: 'Year 4',
    subject: 'Science',
    lo: 'I can check that a picture reached the deck.',
    slides: [
      {
        template: 'body-full',
        headerStyle: 'title',
        title: 'A Picture',
        body: { type: 'image', imagePath: imagePath, caption: 'A star' },
      },
    ],
  };
}

// Puts the extended-length prefix back on every embedded picture path, which is
// exactly what the pipeline used to hand pptxgenjs. Loaded with --require so it
// runs before the content helpers capture the function they call.
function preloadSource() {
  return [
    "'use strict';",
    'const resolve = require(' + JSON.stringify(RESOLVE) + ');',
    'const real = resolve.resolveForEmbed;',
    'const PREFIX = ' + JSON.stringify(EXTENDED_PREFIX) + ';',
    'resolve.resolveForEmbed = function (imagePath, ctx) {',
    '  const out = real(imagePath, ctx);',
    '  if (typeof out !== "string" || !out || out.slice(0, 4) === PREFIX) return out;',
    '  return PREFIX + out;',
    '};',
    '',
  ].join('\n');
}

function runBuild(dir, specPath, preloadPath) {
  const args = [];
  if (preloadPath) args.push('--require', preloadPath);
  args.push(BUILD, specPath, dir);
  const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

// Just enough zip reading to answer "is the picture in the file?" without
// pulling a dependency into a guard whose whole point is to depend on nothing
// the build itself might be wrong about.
function zipEntries(file) {
  const buf = fs.readFileSync(file);
  const entries = new Map();
  let i = buf.length - 22;
  while (i >= 0 && buf.readUInt32LE(i) !== 0x06054b50) i -= 1;
  assert.ok(i >= 0, 'not a zip file: ' + file);
  const count = buf.readUInt16LE(i + 10);
  let p = buf.readUInt32LE(i + 16);
  for (let n = 0; n < count; n += 1) {
    assert.strictEqual(buf.readUInt32LE(p), 0x02014b50, 'bad central directory');
    const method = buf.readUInt16LE(p + 10);
    const compressed = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const localExtra = buf.readUInt16LE(offset + 28);
    const localName = buf.readUInt16LE(offset + 26);
    const start = offset + 30 + localName + localExtra;
    const raw = buf.slice(start, start + compressed);
    entries.set(name, method === 0 ? raw : zlib.inflateRawSync(raw));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

// A folder deep enough that the photograph inside it passes the 260-character
// limit. The names are the ones a real lesson folder has, so the fixture reads
// as the case it stands for, and a term folder repeats until the path is long
// enough, because the temporary root it is built on differs by machine and a
// fixture that only sometimes reaches 260 characters only sometimes tests
// anything.
function longFolder(base) {
  let dir = path.join(
    base,
    'OneDrive - A Rather Long Multi Academy Trust Name',
    'Documents',
    'Teaching and Learning',
    'Year 4 2026 to 2027'
  );
  let term = 1;
  while (path.join(dir, 'name-electrical-appliances', 'photo.png').length <= 280) {
    dir = path.join(dir, 'Autumn Term ' + term + ' Week 3 Science Electricity');
    term += 1;
  }
  return path.join(dir, 'name-electrical-appliances');
}

function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'picture-guard-'));
  const image = path.join(dir, 'photo.png');
  fs.copyFileSync(SOURCE_IMAGE, image);

  const plainSpec = path.join(dir, 'plain.json');
  fs.writeFileSync(plainSpec, JSON.stringify(spec(image), null, 2));

  const prefixedSpec = path.join(dir, 'prefixed.json');
  fs.writeFileSync(prefixedSpec, JSON.stringify(spec(EXTENDED_PREFIX + image), null, 2));

  const preloadPath = path.join(dir, 'restore-prefix.js');
  fs.writeFileSync(preloadPath, preloadSource());

  const deck = path.join(dir, 'Picture Guard.pptx');

  const plain = runBuild(dir, plainSpec, null);

  check('a deck whose picture is on disk publishes, and carries the picture', function () {
    assert.strictEqual(plain.status, 0, 'a healthy build exited ' + plain.status + ':\n' + plain.out);
    assert.ok(fs.existsSync(deck), 'no deck was written:\n' + plain.out);
    const media = Array.from(zipEntries(deck).keys()).filter(function (n) {
      return n.indexOf('ppt/media/') === 0;
    });
    assert.strictEqual(media.length, 1, 'expected one picture in the deck, found ' + media.length);
  });

  check('an absolute picture path is no longer reported as missing', function () {
    // The existence check joined every path onto the lesson folder, so an
    // absolute path could never be found and every one of them was announced as
    // missing. A check that cries wolf on all of them tells nobody anything.
    assert.ok(
      plain.out.indexOf('does not exist') === -1,
      'an absolute picture path that is on disk was reported as missing:\n' + plain.out
    );
  });

  // A lesson folder inside a OneDrive-backed SharePoint library goes past 260
  // characters on its own, and sharp is the only part of the build that cannot
  // read a Windows path that long without the extended-length prefix. Every
  // existence check said the photograph was there, sharp alone said it was
  // missing, and the build stopped with IMAGE_DIMENSIONS_UNAVAILABLE on a
  // picture sitting exactly where it should be. So the same prefix pptxgenjs
  // must never see is the prefix sharp must always get, and both halves are
  // proved here rather than trusted.
  const longDir = longFolder(dir);
  const longImage = path.join(longDir, 'photo.png');
  fs.mkdirSync(longDir, { recursive: true });
  fs.copyFileSync(SOURCE_IMAGE, longImage);
  const longSpec = path.join(longDir, 'long.json');
  fs.writeFileSync(longSpec, JSON.stringify(spec(longImage), null, 2));
  const longDeck = path.join(longDir, 'Picture Guard.pptx');
  const long = runBuild(longDir, longSpec, null);

  check('a lesson in a folder past 260 characters still builds', function () {
    assert.ok(
      longImage.length > 260,
      'the fixture path is only ' + longImage.length + ' characters, so it proves nothing'
    );
    assert.strictEqual(
      long.status, 0,
      'a lesson at a long path exited ' + long.status + ':\n' + long.out
    );
    assert.ok(fs.existsSync(longDeck), 'no deck was written at a long path:\n' + long.out);
  });

  check('a photograph at a long path is measured, not declared missing', function () {
    assert.ok(
      long.out.indexOf('IMAGE_DIMENSIONS_UNAVAILABLE') === -1,
      'a photograph that is on disk could not be measured at a long path:\n' + long.out
    );
    const media = Array.from(zipEntries(longDeck).keys()).filter(function (n) {
      return n.indexOf('ppt/media/') === 0;
    });
    assert.strictEqual(media.length, 1, 'the picture did not reach a deck built at a long path');
  });

  const prefixed = runBuild(dir, prefixedSpec, null);

  check('a Windows extended-length picture path still reaches the deck', function () {
    assert.strictEqual(
      prefixed.status, 0,
      'a build whose picture path carried the extended-length prefix exited ' +
        prefixed.status + ':\n' + prefixed.out
    );
    const media = Array.from(zipEntries(deck).keys()).filter(function (n) {
      return n.indexOf('ppt/media/') === 0;
    });
    assert.strictEqual(
      media.length, 1,
      'the picture was dropped from the deck when its path carried the prefix'
    );
  });

  const before = fs.readFileSync(deck);
  const broken = runBuild(dir, plainSpec, preloadPath);

  check('a picture that did not make it into the deck stops publication', function () {
    assert.ok(
      broken.out.indexOf('Wrote:') === -1,
      'a deck was published with a picture missing from it:\n' + broken.out
    );
  });

  check('the missing picture is named, and its slide with it', function () {
    assert.ok(
      broken.out.indexOf('slide 1') !== -1,
      'the report did not say which slide lost its picture:\n' + broken.out
    );
    assert.ok(
      broken.out.indexOf('SLIDE_PICTURE_MISSING') !== -1,
      'no machine-readable diagnostic was emitted for the missing picture:\n' + broken.out
    );
  });

  check('"No warnings." never prints beside a missing picture', function () {
    assert.ok(
      broken.out.indexOf('No warnings.') === -1,
      'the build claimed there were no warnings while a picture was missing:\n' + broken.out
    );
  });

  check('a build with a missing picture exits non-zero', function () {
    assert.notStrictEqual(
      broken.status, 0,
      'a deck with a white box where a photograph should be still reported success, ' +
        'so make-lesson and any scheduled run would ship it'
    );
  });

  check('the teacher\u2019s working deck survives the failed rebuild', function () {
    assert.ok(
      Buffer.compare(before, fs.readFileSync(deck)) === 0,
      'the existing deck was overwritten by a build that could not carry its pictures'
    );
    assert.ok(
      broken.out.indexOf('left exactly as it was') !== -1,
      'the build did not confirm it left the existing deck alone:\n' + broken.out
    );
  });

  check('no temporary build file is left behind', function () {
    const leftovers = fs.readdirSync(dir).filter(function (f) {
      return f.indexOf('.building-') !== -1;
    });
    assert.strictEqual(
      leftovers.length, 0,
      'a temporary build file was left in the output folder: ' + leftovers.join(', ')
    );
  });

  fs.rmSync(dir, { recursive: true, force: true });

  if (failures) {
    console.error(
      '\nPicture guard FAILED (' + failures + '). A deck may ship with a white box ' +
        'where a photograph should be.'
    );
    process.exit(1);
  }
  console.log(
    'Pictures OK: an extended-length path still reaches the deck, and a picture that ' +
      'does not arrive blocks publication.'
  );
}

main();
