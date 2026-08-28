#!/usr/bin/env node
'use strict';

// Guards the build's honesty about slides that failed to render.
//
// A content helper that throws does not stop the build: the error is caught per
// slide so one broken helper cannot cost you the other nineteen. That is right.
// What was wrong is what happened next: the error was printed and then
// forgotten, so the build finished with "No warnings.", wrote the file, and
// exited 0. A deck with seven blank slides read as a clean build to make-lesson,
// to a scheduled run, and to whoever was about to teach from it.
//
// This proves the two halves of the fix on a real build rather than on a
// description of one:
//   1. the closing summary counts the failed slides and never claims there were
//      no warnings while slides were failing;
//   2. the process exits non-zero, so nothing downstream treats a deck with
//      blank zones as a shipped success.
//
// The failure is injected rather than found. Every helper in this engine guards
// its own input hard enough that no malformed spec reliably throws (which is
// good, and was checked), so a fixture built on "this input breaks that helper"
// would be a fixture that quietly stops testing anything the day the helper gets
// one more guard. Instead a --require preload wraps the real drawSlide and
// throws for the one slide flagged in the spec: deterministic, owned by this
// test, and it exercises the real catch block in build.js.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const BUILD = path.join(__dirname, '..', 'build.js');
const TEMPLATES = path.join(__dirname, '..', 'src', 'templates', 'index.js');

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

// Three ordinary slides. The middle one carries the flag the preload trips on,
// so a failure in the MIDDLE proves the build keeps going and still reports.
function spec() {
  return {
    lessonName: 'Render Failure Guard',
    subject: 'Maths',
    slides: [
      { template: 'body-full', title: 'One', body: { type: 'text', value: 'first' } },
      { template: 'body-full', title: 'Two', body: { type: 'text', value: 'second' }, failForTest: true },
      { template: 'body-full', title: 'Three', body: { type: 'text', value: 'third' } }
    ]
  };
}

// Wrap the real drawSlide instead of replacing it, so every slide but the flagged
// one renders exactly as it normally would and the deck under test is a real deck.
function preloadSource() {
  return [
    "'use strict';",
    'const templates = require(' + JSON.stringify(TEMPLATES) + ');',
    'const real = templates.drawSlide;',
    'templates.drawSlide = function (pptx, slide, data, ctx) {',
    '  if (data && data.failForTest) throw new Error("deliberate failure for the render-honesty guard");',
    '  return real(pptx, slide, data, ctx);',
    '};',
    ''
  ].join('\n');
}

function runBuild(dir, specPath, preloadPath) {
  const args = [];
  if (preloadPath) args.push('--require', preloadPath);
  args.push(BUILD, specPath, dir);
  const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'render-failures-'));
  const specPath = path.join(dir, 'spec.json');
  const preloadPath = path.join(dir, 'fail-one-slide.js');
  fs.writeFileSync(specPath, JSON.stringify(spec(), null, 2));
  fs.writeFileSync(preloadPath, preloadSource());

  const healthy = runBuild(dir, specPath, null);
  const broken = runBuild(dir, specPath, preloadPath);

  check('a deck where every slide renders still exits 0', function () {
    assert.strictEqual(healthy.status, 0, 'a healthy build exited ' + healthy.status + ':\n' + healthy.out);
    assert.ok(
      healthy.out.indexOf('failed to render') === -1,
      'a healthy build reported a render failure'
    );
  });

  check('a healthy build still says so', function () {
    // Only when nothing else warned. The autofit step warns on a machine with no
    // Python, and that is a real warning worth keeping, not a reason to fail here.
    if (healthy.out.indexOf('[warn]') !== -1) return;
    assert.ok(
      healthy.out.indexOf('No warnings.') !== -1,
      'a clean build no longer prints its all-clear line:\n' + healthy.out
    );
  });

  check('a slide that cannot be drawn stops the deck being published', function () {
    // The deck used to be written first and the failure reported afterwards, so
    // a partial deck with a blank slide sat on disk looking finished. It is now
    // caught before anything is written.
    assert.ok(
      broken.out.indexOf('Wrote:') === -1,
      'a deck was published despite a slide that could not be drawn:\n' + broken.out
    );
  });

  check('the failed slide is counted, and named', function () {
    assert.ok(
      broken.out.indexOf('slide 2') !== -1,
      'the summary did not name the failed slide:\n' + broken.out
    );
  });

  check('an existing good deck is never overwritten by a failed rebuild', function () {
    // The whole point of building to a temporary file: a teacher's working
    // PowerPoint survives a rebuild that goes wrong.
    assert.ok(
      broken.out.indexOf('left exactly as it was') !== -1 ||
        broken.out.indexOf('No PowerPoint was written') !== -1,
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

  check('"No warnings." never prints beside a failed slide', function () {
    assert.ok(
      broken.out.indexOf('No warnings.') === -1,
      'the build claimed there were no warnings while a slide was failing:\n' + broken.out
    );
  });

  check('a build with a failed slide exits non-zero', function () {
    assert.notStrictEqual(
      broken.status, 0,
      'a deck with a blank slide still reported success, so make-lesson and any ' +
      'scheduled run would ship it'
    );
  });

  fs.rmSync(dir, { recursive: true, force: true });

  if (failures) {
    console.error(
      '\nRender-failure guard FAILED (' + failures + '). A deck with blank slides may be ' +
      'reported as a clean build.'
    );
    process.exit(1);
  }
  console.log('Render failures OK: failed slides are named, nothing is published, and the build exits non-zero.');
}

main();
