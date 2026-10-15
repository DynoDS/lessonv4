'use strict';

// On Codex the sandbox refuses the rename that gives a finished PowerPoint its
// real name. Every slide preview in three lessons (10 and 11 October 2026) was
// built, passed its checks and was then lost, and the worker saw a stack trace
// until it asked for more access and built it all again. The real builder is
// run here with the rename refused the same way.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const BUILD = path.join(__dirname, '..', 'build.js');
const PUBLISH = path.join(__dirname, '..', '..', 'scripts', 'publish-educational-svg.js');

function lesson(slides) {
  return {
    lessonName: 'Sandbox Save',
    subject: 'Maths',
    lo: 'Save a deck where a rename is refused',
    slides,
  };
}

const CLEAN = [
  {
    template: 'split-v-60-40',
    title: 'A clean slide',
    primary: { type: 'text', value: 'Round 342 to the nearest 100.' },
    secondary: { type: 'text', value: 'Show it on a number line.' },
  },
];

// Cannot be laid out, so the build refuses the deck and keeps a preview only.
const REFUSED = [
  {
    template: 'split-v-60-40',
    title: 'Is this rounding right?',
    primarySide: 'top',
    primary: { type: 'text', value: 'Amira says 3,448 rounds to 3,500.' },
    secondary: {
      type: 'sc-panel',
      content: {
        type: 'steps',
        steps: [
          "If it's already a multiple of 100, keep it unchanged.",
          'Write the 100s either side of your number at the ends of a number line.',
          'Mark halfway and place your number.',
          'Choose the nearer hundred; at halfway, choose the greater hundred.',
        ],
      },
    },
  },
];

// What the sandbox does, loaded into the builder before it starts.
function sandbox(root, refusedCalls) {
  const file = path.join(root, `sandbox-${refusedCalls.join('-')}.js`);
  fs.writeFileSync(
    file,
    `'use strict';\n` +
      `const fs = require('node:fs');\n` +
      `const path = require('node:path');\n` +
      `const refuse = (call) => { throw Object.assign(new Error('EPERM: operation not permitted, ' + call), { code: 'EPERM' }); };\n` +
      `const refused = new Set(${JSON.stringify(refusedCalls)});\n` +
      `if (refused.has('rename')) fs.renameSync = () => refuse('rename');\n` +
      `if (refused.has('link')) fs.linkSync = () => refuse('link');\n` +
      `if (refused.has('write')) {\n` +
      `  const write = fs.writeFileSync;\n` +
      `  fs.writeFileSync = (target, ...rest) => {\n` +
      `    const name = path.basename(String(target));\n` +
      `    if (name.endsWith('.pptx') && !name.startsWith('.')) refuse('open');\n` +
      `    return write(target, ...rest);\n` +
      `  };\n` +
      `}\n`
  );
  return file;
}

function build(slides, refusedCalls, extraArgs = []) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sandbox-save-'));
  const lessonPath = path.join(root, 'lesson.json');
  // A preview is only built into the slide check's own private folder.
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-resources-slide-design-check-'));
  fs.writeFileSync(lessonPath, JSON.stringify(lesson(slides), null, 2));
  const run = spawnSync(
    process.execPath,
    ['--require', sandbox(root, refusedCalls), BUILD, lessonPath, outDir, ...extraArgs],
    { encoding: 'utf8' }
  );
  return {
    root,
    outDir,
    deck: path.join(outDir, 'Sandbox Save.pptx'),
    status: run.status,
    stdout: String(run.stdout || ''),
    stderr: String(run.stderr || ''),
  };
}

function leftovers(outDir) {
  return fs.readdirSync(outDir).filter((name) => name.includes('.building-'));
}

test('a deck is still saved where the sandbox refuses the rename', () => {
  const run = build(CLEAN, ['rename'], ['--design-preview']);
  try {
    assert.equal(run.status, 0, run.stderr);
    assert.ok(run.stdout.includes(`Wrote: ${run.deck}`), run.stdout);
    assert.ok(fs.statSync(run.deck).size > 1000, 'the saved file is the whole deck');
    assert.deepEqual(leftovers(run.outDir), [], 'no temporary copy is left beside it');
  } finally {
    fs.rmSync(run.root, { recursive: true, force: true });
    fs.rmSync(run.outDir, { recursive: true, force: true });
  }
});

test('a refused deck still keeps its preview pages where the rename is refused', () => {
  const run = build(REFUSED, ['rename'], ['--design-preview']);
  try {
    assert.equal(run.status, 1);
    assert.ok(run.stdout.includes(`PARTIAL_PREVIEW: ${run.deck}`), run.stdout + run.stderr);
    assert.ok(!run.stdout.includes('Wrote: '), 'a refused deck is never named as written');
    assert.ok(fs.existsSync(run.deck));
  } finally {
    fs.rmSync(run.root, { recursive: true, force: true });
    fs.rmSync(run.outDir, { recursive: true, force: true });
  }
});

test('a save refused both ways is one plain line, not a stack trace', () => {
  const run = build(CLEAN, ['rename', 'write']);
  try {
    assert.equal(run.status, 1);
    assert.ok(run.stderr.includes('SAVE_REFUSED: '), run.stderr);
    assert.ok(run.stderr.includes('once more with a request for more access'), run.stderr);
    assert.ok(!/\n\s+at .+build\.js/.test(run.stderr), 'no stack trace for the worker to decode');
    assert.ok(!run.stdout.includes('Wrote: '));
    assert.equal(fs.existsSync(run.deck), false);
    assert.deepEqual(leftovers(run.outDir), []);
  } finally {
    fs.rmSync(run.root, { recursive: true, force: true });
    fs.rmSync(run.outDir, { recursive: true, force: true });
  }
});

test('a drawing is still published where the sandbox refuses a hard link', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sandbox-drawing-'));
  try {
    const libraryRoot = path.join(root, 'library');
    const candidate = path.join(libraryRoot, 'standard', 'aa', 'a.svg');
    fs.mkdirSync(path.dirname(candidate), { recursive: true });
    fs.writeFileSync(
      candidate,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>'
    );
    const script =
      `const fs = require('node:fs');` +
      `const { publishEducationalSvgAsset } = require(${JSON.stringify(PUBLISH)});` +
      `const result = publishEducationalSvgAsset(${JSON.stringify(candidate)}, ${JSON.stringify(root)}, 'leaf', {` +
      `  libraryRoot: ${JSON.stringify(libraryRoot)},` +
      `  rasterize: (_source, output) => fs.writeFileSync(output, 'png'),` +
      `});` +
      `console.log(JSON.stringify(result));`;
    const run = spawnSync(
      process.execPath,
      ['--require', sandbox(root, ['rename', 'link']), '-e', script],
      { encoding: 'utf8' }
    );
    assert.equal(run.status, 0, run.stderr);
    assert.equal(JSON.parse(run.stdout).sourcePath, 'icons/source/leaf.svg');
    assert.ok(fs.existsSync(path.join(root, 'icons', 'source', 'leaf.svg')));
    assert.equal(fs.readFileSync(path.join(root, 'icons', 'leaf.png'), 'utf8'), 'png');
    assert.deepEqual(
      fs.readdirSync(path.join(root, 'icons', 'source')).filter((name) => name.includes('.incoming')),
      []
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
