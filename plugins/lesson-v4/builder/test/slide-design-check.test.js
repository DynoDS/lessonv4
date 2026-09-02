'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  runSlideDesignCheck,
} = require('../scripts/check-slide-design');

function makeRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'slide-design-check-test-'));
}

function writeLesson(root, lesson) {
  const file = path.join(root, 'lesson.json.tmp.test-attempt');
  fs.writeFileSync(file, JSON.stringify(lesson, null, 2));
  return file;
}

let fakeBuilderNumber = 0;

function writeFakeBuilder(root, body) {
  fakeBuilderNumber += 1;
  const file = path.join(root, `fake-builder-${fakeBuilderNumber}.js`);
  fs.writeFileSync(file, body);
  return file;
}

function ordinaryLesson() {
  return {
    lessonName: 'Scratch Check',
    subject: 'Maths',
    lo: 'Check a slide',
    slides: [
      {
        template: 'title',
        title: 'Check this slide',
      },
    ],
  };
}

test('a long fixed caption blocks before the scratch builder runs', () => {
  const root = makeRoot();
  try {
    const builderMarker = path.join(root, 'builder-ran.txt');
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\n` +
        `require('node:fs').writeFileSync(${JSON.stringify(builderMarker)}, 'ran');\n`
    );
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        {
          template: 'teach',
          content: {
            type: 'image',
            caption: 'w'.repeat(200),
          },
        },
      ],
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SLIDE_DESIGN_CAPACITY');
    assert.match(result.stdout, /"signal":"FIXED_CAPTION_CAPACITY"/);
    assert.equal(fs.existsSync(builderMarker), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('internal lesson-stage titles block before the scratch builder runs', () => {
  const root = makeRoot();
  try {
    const builderMarker = path.join(root, 'builder-ran.txt');
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\n` +
        `require('node:fs').writeFileSync(${JSON.stringify(builderMarker)}, 'ran');\n`
    );
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        { template: 'title', title: 'Do 2' },
        { template: 'title', title: 'Apply' }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, {
      buildPath: fakeBuilder
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SLIDE_DESIGN_PRESENTATION');
    assert.match(result.stdout, /"signal":"INTERNAL_STAGE_TITLE"/);
    assert.match(result.stdout, /"faultClass":"presentation"/);
    assert.equal(fs.existsSync(builderMarker), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a whole-blue block that tells and then asks blocks before the scratch builder runs', () => {
  // Geography slide 6 painted "Look at the tropical rainforest regions. What
  // pattern do you notice around the Equator?" as one blue card, hiding the
  // question inside the instruction.
  const root = makeRoot();
  try {
    const builderMarker = path.join(root, 'builder-ran.txt');
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';
` +
        `require('node:fs').writeFileSync(${JSON.stringify(builderMarker)}, 'ran');
`
    );
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        {
          template: 'body-full',
          title: 'Look Closely',
          body: {
            type: 'stack',
            items: [
              {
                type: 'text',
                color: '0070C0',
                value: 'Look at the tropical rainforest regions. What pattern do you notice around the Equator?'
              },
              { type: 'text', color: '0070C0', value: 'Which continent is A?' },
              { type: 'text', value: 'The Sahara looks different. How can both be biomes?' }
            ]
          }
        }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, {
      buildPath: fakeBuilder
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SLIDE_DESIGN_PRESENTATION');
    const hits = result.stdout.match(/"signal":"MIXED_BLOCK_WHOLE_BLUE"/g) || [];
    assert.equal(hits.length, 1);
    assert.match(result.stdout, /"slide":1/);
    assert.equal(fs.existsSync(builderMarker), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a clean scratch build passes, hides its Wrote line and deletes its deck', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\n` +
        `const fs = require('node:fs');\n` +
        `const path = require('node:path');\n` +
        // node, script, lesson.json, outputDir. The check used to insert
        // --skip-optional-decorations ahead of these, which pushed the output
        // directory to argv[4]; it no longer skips the optional layer, so the
        // scratch build sees the same arguments the real build does.
        `const outputDir = process.argv[3];\n` +
        `const outputPath = path.join(outputDir, 'Scratch Check.pptx');\n` +
        `fs.mkdirSync(outputDir, { recursive: true });\n` +
        `fs.writeFileSync(outputPath, 'scratch');\n` +
        `console.log('Wrote: ' + outputPath);\n` +
        `console.log('No warnings.');\n`
    );
    const lessonPath = writeLesson(root, ordinaryLesson());

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, true);
    assert.equal(result.slideCount, 1);
    assert.doesNotMatch(result.stdout, /^Wrote:/m);
    assert.match(result.stdout, /No warnings\./);
    assert.ok(result.scratchOutputPath);
    assert.equal(fs.existsSync(result.scratchOutputPath), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('runSlideDesignCheck passes the exact frozen photo contract to the build', () => {
  const root = makeRoot();
  try {
    const photoPath = path.join(root, 'frozen-photo-requirements.json');
    const observedPath = path.join(root, 'observed-photo-path.txt');
    fs.writeFileSync(photoPath, JSON.stringify({ photos: [] }));
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\n` +
        `const fs = require('node:fs');\n` +
        `const path = require('node:path');\n` +
        `fs.writeFileSync(${JSON.stringify(observedPath)}, process.env.PHOTO_REQUIREMENTS_PATH || '');\n` +
        // node, script, lesson.json, outputDir. The check used to insert
        // --skip-optional-decorations ahead of these, which pushed the output
        // directory to argv[4]; it no longer skips the optional layer, so the
        // scratch build sees the same arguments the real build does.
        `const outputDir = process.argv[3];\n` +
        `const outputPath = path.join(outputDir, 'Scratch Check.pptx');\n` +
        `fs.writeFileSync(outputPath, 'scratch');\n` +
        `console.log('Wrote: ' + outputPath);\n`
    );
    const lessonPath = writeLesson(root, ordinaryLesson());

    const result = runSlideDesignCheck(lessonPath, {
      buildPath: fakeBuilder,
      photoRequirementsPath: photoPath,
    });

    assert.equal(result.ok, true);
    assert.equal(fs.readFileSync(observedPath, 'utf8'), path.resolve(photoPath));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a failed scratch build preserves its diagnostic and returns failure', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\n` +
        `console.log('BUILD_DIAGNOSTIC: {"signal":"TEXT_OVERLOAD","artifact":"slides","faultClass":"content","location":{"slide":2,"box":"body"},"message":"too much text"}');\n` +
        `console.error('TEXT_OVERLOAD: too much text');\n` +
        `process.exit(1);\n`
    );
    const lessonPath = writeLesson(root, ordinaryLesson());

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SCRATCH_BUILD_FAILED');
    assert.match(result.stdout, /"signal":"TEXT_OVERLOAD"/);
    assert.match(result.stderr, /TEXT_OVERLOAD: too much text/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a builder that writes outside the private scratch directory is rejected', () => {
  const root = makeRoot();
  try {
    const escapedOutput = path.join(root, 'escaped.pptx');
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\n` +
        `const fs = require('node:fs');\n` +
        `fs.writeFileSync(${JSON.stringify(escapedOutput)}, 'not private');\n` +
        `console.log('Wrote: ' + ${JSON.stringify(escapedOutput)});\n`
    );
    const lessonPath = writeLesson(root, ordinaryLesson());

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SCRATCH_BUILD_OUTPUT_ESCAPE');
    assert.match(result.stderr, /wrote outside its private directory/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('exit zero without one Wrote marker is not accepted as a checked deck', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\nconsole.log('No warnings.');\n`
    );
    const lessonPath = writeLesson(root, ordinaryLesson());

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SCRATCH_BUILD_MARKER_MISSING');
    assert.match(result.stderr, /without exactly one Wrote: line/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a blocking capacity diagnostic cannot pass merely because the builder exited zero', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\n` +
        `const fs = require('node:fs');\n` +
        `const path = require('node:path');\n` +
        // node, script, lesson.json, outputDir. The check used to insert
        // --skip-optional-decorations ahead of these, which pushed the output
        // directory to argv[4]; it no longer skips the optional layer, so the
        // scratch build sees the same arguments the real build does.
        `const outputDir = process.argv[3];\n` +
        `const outputPath = path.join(outputDir, 'Scratch Check.pptx');\n` +
        `fs.writeFileSync(outputPath, 'scratch');\n` +
        `console.log('BUILD_DIAGNOSTIC: {"signal":"SUCCESS_CRITERIA_CAPACITY","artifact":"slides","faultClass":"composition","location":{"slide":1,"path":"successCriteria"},"message":"too much"}');\n` +
        `console.log('Wrote: ' + outputPath);\n`
    );
    const lessonPath = writeLesson(root, ordinaryLesson());

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SLIDE_DESIGN_CAPACITY');
    assert.doesNotMatch(result.stdout, /^Wrote:/m);
    assert.match(result.stdout, /"signal":"SUCCESS_CRITERIA_CAPACITY"/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a preview check retains the checked deck in a private preview directory', () => {
  const root = makeRoot();
  let previewDir = null;
  try {
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\n` +
        `const fs = require('node:fs');\n` +
        `const path = require('node:path');\n` +
        // node, script, lesson.json, outputDir. The check used to insert
        // --skip-optional-decorations ahead of these, which pushed the output
        // directory to argv[4]; it no longer skips the optional layer, so the
        // scratch build sees the same arguments the real build does.
        `const outputDir = process.argv[3];\n` +
        `const outputPath = path.join(outputDir, 'Scratch Check.pptx');\n` +
        `fs.mkdirSync(outputDir, { recursive: true });\n` +
        `fs.writeFileSync(outputPath, 'scratch');\n` +
        `console.log('Wrote: ' + outputPath);\n` +
        `console.log('No warnings.');\n`
    );
    const lessonPath = writeLesson(root, ordinaryLesson());

    const result = runSlideDesignCheck(lessonPath, {
      buildPath: fakeBuilder,
      retainPreview: true,
    });

    assert.equal(result.ok, true);
    assert.ok(result.previewDir, 'the preview directory is reported');
    assert.ok(result.previewOutputPath, 'the preview deck path is reported');
    assert.ok(fs.existsSync(result.previewOutputPath), 'the deck survives for the render pass');
    assert.equal(fs.readFileSync(result.previewOutputPath, 'utf8'), 'scratch');
    assert.ok(
      path.relative(result.previewDir, result.previewOutputPath) === path.basename(result.previewOutputPath),
      'the preview deck sits inside its own private directory'
    );
    // The scratch dir still goes: the preview copy is what outlives the check.
    assert.equal(fs.existsSync(result.scratchOutputPath), false);
    previewDir = result.previewDir;
  } finally {
    if (previewDir) fs.rmSync(previewDir, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a failed preview check retains no preview', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\n` +
        `console.error('TEXT_OVERLOAD: too much text');\n` +
        `process.exit(1);\n`
    );
    const lessonPath = writeLesson(root, ordinaryLesson());

    const result = runSlideDesignCheck(lessonPath, {
      buildPath: fakeBuilder,
      retainPreview: true,
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SCRATCH_BUILD_FAILED');
    assert.equal(result.previewDir, undefined, 'no preview directory on failure');
    assert.equal(result.previewOutputPath, undefined, 'no preview deck on failure');
    assert.equal(result.scratchOutputPath, null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the CLI ends malformed JSON with the exact failure marker', () => {
  const root = makeRoot();
  try {
    const badJson = path.join(root, 'lesson.json.tmp.bad');
    fs.writeFileSync(badJson, '{"slides": [}');
    const photoPath = path.join(root, 'photo-requirements.json');
    fs.writeFileSync(photoPath, JSON.stringify({ photos: [] }));
    const script = path.join(__dirname, '..', 'scripts', 'check-slide-design.js');

    const result = spawnSync(
      process.execPath,
      [script, badJson, '--photo-requirements', photoPath],
      { encoding: 'utf8' }
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /SLIDE_DESIGN_CHECK_FAILED: LESSON_JSON_INVALID/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
