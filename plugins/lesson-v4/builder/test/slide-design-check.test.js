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

test('a long fixed caption blocks, and the scratch build still runs', () => {
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
    // The build runs beside the spec-only rules, so its faults arrive in the
    // same report rather than on the next attempt.
    assert.equal(fs.existsSync(builderMarker), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('internal lesson-stage titles block, and the scratch build still runs', () => {
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
    // The build runs beside the spec-only rules, so its faults arrive in the
    // same report rather than on the next attempt.
    assert.equal(fs.existsSync(builderMarker), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a bare Practise is a slot name in every subject, and a bare Apply only outside maths', () => {
  // The teacher's "yes" of 24 September 2026 (release 7A): `Practise` names
  // the slot, not the move, so a slide titled only that is flagged wherever it
  // is; in maths `Apply` is one of the plain words he wants, so it passes there.
  const { presentationWarnings } = require('../scripts/check-slide-design');
  const flagged = (subject) =>
    presentationWarnings({
      subject,
      slides: [
        { title: 'Practise' },
        { title: 'Apply' },
        { title: 'Your Turn' },
        { title: 'Practise rounding to the nearest 100' },
        { title: 'practise' },
      ],
    }).map((warning) => `${warning.slide}:${warning.signal}`);
  assert.deepEqual(flagged('Maths'), ['1:INTERNAL_STAGE_TITLE', '5:INTERNAL_STAGE_TITLE']);
  assert.deepEqual(flagged('History'), ['1:INTERNAL_STAGE_TITLE', '2:INTERNAL_STAGE_TITLE', '5:INTERNAL_STAGE_TITLE']);
  const [warning] = presentationWarnings({ subject: 'Maths', slides: [{ title: 'Practise' }] });
  assert.match(
    warning.message,
    /In maths the plain words My Turn, Our Turn, Your Turn, Answers and Apply are the titles; Practise is not one of them/
  );
});

test('on a settled deck a title slip is a note, and never costs the drawings', () => {
  // Release 7A's first check: a bare "Practise" that survived the slide
  // designer's round failed the decorator's check too, and the whole deck lost
  // its drawings. The decorator and the orchestrator pass --settled; the
  // designer's own check does not, so it is still sent back.
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\n` +
        `const fs = require('node:fs');\n` +
        `const path = require('node:path');\n` +
        `const out = path.join(process.argv[3], 'Scratch Check.pptx');\n` +
        `fs.writeFileSync(out, 'deck');\n` +
        `console.log('Wrote: ' + out);\n`
    );
    const titleSlip = writeLesson(root, {
      ...ordinaryLesson(),
      subject: 'History',
      slides: [{ template: 'title', title: 'Practise' }]
    });

    const designer = runSlideDesignCheck(titleSlip, { buildPath: fakeBuilder });
    assert.equal(designer.ok, false);
    assert.equal(designer.reason, 'SLIDE_DESIGN_PRESENTATION');

    const settled = runSlideDesignCheck(titleSlip, { buildPath: fakeBuilder, settled: true });
    assert.equal(settled.ok, true, settled.stderr);
    assert.match(settled.stderr, /never a reason to withhold its drawings/);
    assert.match(settled.stderr, /note: slide 1 title: INTERNAL_STAGE_TITLE/);

    // A fault the decorator's own layer can cause still fails on a settled deck.
    const twice = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [{
        template: 'split-h-50-50',
        title: 'Look closely',
        primary: { type: 'image', imagePath: 'photo.jpg' },
        secondary: { type: 'image', imagePath: 'photo.jpg' }
      }]
    });
    const picture = runSlideDesignCheck(twice, { buildPath: fakeBuilder, settled: true });
    assert.equal(picture.ok, false);
    assert.match(picture.stdout, /"signal":"PICTURE_TWICE_ON_ONE_SLIDE"/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the command line passes --settled through', () => {
  const root = makeRoot();
  try {
    const lessonPath = path.join(root, 'lesson.json.tmp.settled');
    fs.writeFileSync(lessonPath, JSON.stringify({
      lessonName: 'Settled',
      subject: 'History',
      slides: [{ template: 'body-full', title: 'Practise', body: { type: 'text', value: 'Put the three events in order.' } }]
    }, null, 2));
    const script = path.join(__dirname, '..', 'scripts', 'check-slide-design.js');
    const plain = spawnSync(process.execPath, [script, lessonPath], { encoding: 'utf8' });
    assert.equal(plain.status, 1, plain.stdout + plain.stderr);
    const settled = spawnSync(process.execPath, [script, lessonPath, '--settled'], { encoding: 'utf8' });
    assert.equal(settled.status, 0, settled.stdout + settled.stderr);
    assert.match(settled.stdout, /SLIDE_DESIGN_CHECK_OK: 1 slides/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a whole-blue block that tells and then asks blocks, and the scratch build still runs', () => {
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
    // The build runs beside the spec-only rules, so its faults arrive in the
    // same report rather than on the next attempt.
    assert.equal(fs.existsSync(builderMarker), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// The deck's third colour. Black is the teacher talking, blue is the child's job,
// purple is the sentence to keep, and the builder paints a sticky line purple off
// the back of its own star marker. An `emphasis` span stretched across the whole
// statement paints over that - a Year 4 PSHE deck ran its one sticky fact in
// problem red on two slides that way and finished with no purple anywhere
// (flagged by Daniel, 2 September 2026). A span *inside* the line is a different
// thing entirely and stays allowed.
test('an emphasis covering a whole sticky line is refused, and the build still runs', () => {
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
          title: 'Get help from a trusted adult',
          stickyKnowledgeRefs: ['sk-002'],
          body: {
            type: 'stack',
            items: [
              {
                type: 'text',
                referenceId: 'sk-002',
                value: '✨ Tell a trusted adult if something makes you feel unsafe.',
                emphasis: [
                  {
                    text: 'Tell a trusted adult if something makes you feel unsafe.',
                    role: 'safety-warning'
                  }
                ]
              }
            ]
          }
        }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SLIDE_DESIGN_PRESENTATION');
    assert.match(result.stdout, /"signal":"STICKY_LINE_RECOLOURED"/);
    assert.match(result.stderr, /let the sticky line keep its colour/);
    // The build runs beside the spec-only rules, so its faults arrive in the
    // same report rather than on the next attempt.
    assert.equal(fs.existsSync(builderMarker), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// The discrimination case. Vocabulary green reaches every place a child reads a
// taught term, sticky knowledge included, and marking one word inside the line
// is not repainting the line.
test('a taught term marked inside a sticky line is left alone', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';
` +
        `const fs = require('node:fs');
` +
        `const path = require('node:path');
` +
        `const outputDir = process.argv[3];
` +
        `fs.mkdirSync(outputDir, { recursive: true });
` +
        `fs.writeFileSync(path.join(outputDir, 'Scratch Check.pptx'), 'scratch');
` +
        `console.log('No warnings.');
`
    );
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        {
          template: 'body-full',
          title: 'What is a biome?',
          stickyKnowledgeRefs: ['sk-001'],
          body: {
            type: 'text',
            referenceId: 'sk-001',
            value: '✨ A biome is a large region with a similar climate.',
            emphasis: [{ text: 'biome', role: 'vocabulary' }]
          }
        }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.ok(
      !/STICKY_LINE_RECOLOURED/.test(result.stdout),
      'one green word inside a sticky line is not a recoloured line'
    );
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
        `console.log('BUILD_DIAGNOSTIC: {"signal":"FIXED_CAPTION_CAPACITY","artifact":"slides","faultClass":"composition","location":{"slide":1,"path":"caption"},"message":"too much"}');\n` +
        `console.log('Wrote: ' + outputPath);\n`
    );
    const lessonPath = writeLesson(root, ordinaryLesson());

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SLIDE_DESIGN_CAPACITY');
    assert.doesNotMatch(result.stdout, /^Wrote:/m);
    assert.match(result.stdout, /"signal":"FIXED_CAPTION_CAPACITY"/);
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

test('a spec-only fault fails the check beside a clean build, and retains no preview', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\n` +
        `const fs = require('node:fs');\n` +
        `const path = require('node:path');\n` +
        `const out = path.join(process.argv[3], 'Scratch Check.pptx');\n` +
        `fs.writeFileSync(out, 'deck');\n` +
        `console.log('Wrote: ' + out);\n`
    );
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [{ template: 'title', title: 'Do 2' }]
    });

    const result = runSlideDesignCheck(lessonPath, {
      buildPath: fakeBuilder,
      retainPreview: true
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SLIDE_DESIGN_PRESENTATION');
    assert.match(result.stdout, /"signal":"INTERNAL_STAGE_TITLE"/);
    assert.equal(result.previewDir, undefined);
    assert.equal(result.previewOutputPath, undefined);
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

test('a blue line that asks the class nothing blocks, and the scratch build still runs', () => {
  // The Year 4 history deck ran "Explain your answer using the photograph." and
  // three `[[ ]]` task steps in house blue, so the board was almost all blue and
  // the colour stopped marking the questions (flagged by Daniel, 3 September
  // 2026). Since 24 September the child's short task may be blue too, but only
  // when the designer marks it `task-blue` (the first line here is one, his
  // answer of 25 September: a job that names what to use); neither is marked,
  // so both still block: blue without the role is refused whatever the line is.
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
          template: 'body-full',
          title: 'Compare the two classrooms',
          body: {
            type: 'stack',
            items: [
              {
                type: 'text',
                colorRole: 'focus-blue',
                value: 'How did children use these two classrooms?'
              },
              {
                type: 'text',
                colorRole: 'focus-blue',
                value: 'Explain your answer using the photograph.'
              },
              {
                type: 'steps',
                steps: ['[[Point to the details that support your comparison.]]']
              },
              { type: 'text', colorRole: 'focus-blue', value: 'Changed' }
            ]
          }
        }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SLIDE_DESIGN_PRESENTATION');
    const hits = result.stdout.match(/"signal":"BLUE_WITHOUT_A_QUESTION"/g) || [];
    // The question passes, the short blue label passes, the instruction and the
    // blue span inside the task list do not.
    assert.equal(hits.length, 2);
    assert.match(result.stdout, /Explain your answer using the photograph/);
    assert.match(result.stdout, /Point to the details/);
    // The build runs beside the spec-only rules, so its faults arrive in the
    // same report rather than on the next attempt.
    assert.equal(fs.existsSync(builderMarker), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a starter whose every question is blue blocks, and the scratch build still runs', () => {
  // A starter is questions all the way down, so blue there marks nothing a child
  // cannot already see. One question stays black; several alternate black, blue,
  // black, blue so the colour separates one from the next.
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
          template: 'body-full',
          title: 'Starter',
          headerStyle: 'starter',
          body: {
            type: 'numbered-questions',
            questions: [
              { text: 'Which year came first?', colorRole: 'focus-blue' },
              {
                text: 'What could a photograph tell us that a bell could not?',
                colorRole: 'focus-blue'
              }
            ]
          }
        }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SLIDE_DESIGN_PRESENTATION');
    assert.match(result.stdout, /"signal":"STARTER_QUESTIONS_ALL_BLUE"/);
    // The build runs beside the spec-only rules, so its faults arrive in the
    // same report rather than on the next attempt.
    assert.equal(fs.existsSync(builderMarker), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('an alternating starter and a black instruction under a blue question both pass', () => {
  // The shape the rule asks for: the starter alternates black, blue, and the
  // teaching slide keeps its one blue question with the task in black under it.
  const root = makeRoot();
  try {
    const builderMarker = path.join(root, 'builder-ran.txt');
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\n` +
        `require('node:fs').writeFileSync(${JSON.stringify(builderMarker)}, 'ran');\n` +
        `console.log('Wrote: ' + process.argv[3]);\n`
    );
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        {
          template: 'body-full',
          title: 'Starter',
          headerStyle: 'starter',
          body: {
            type: 'numbered-questions',
            questions: [
              { text: 'Which year came first?' },
              {
                text: 'What could a photograph tell us that a bell could not?',
                colorRole: 'focus-blue'
              }
            ]
          }
        },
        {
          template: 'body-full',
          title: 'Your Turn: compare the classrooms',
          body: {
            type: 'stack',
            items: [
              {
                type: 'text',
                colorRole: 'focus-blue',
                value: 'How did children use these two classrooms?'
              },
              {
                type: 'text',
                value: 'Explain your answer using the photograph.'
              }
            ]
          }
        }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.notEqual(result.reason, 'SLIDE_DESIGN_PRESENTATION');
    assert.ok(!/BLUE_WITHOUT_A_QUESTION/.test(result.stdout));
    assert.ok(!/STARTER_QUESTIONS_ALL_BLUE/.test(result.stdout));
    assert.ok(!/TURN_SLIDE_WITHOUT_ITS_TURN/.test(result.stdout));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a turn slide with nothing to work on blocks, and the scratch build still runs', () => {
  // A Year 4 place-value My Turn was split when its chart would not fit, and the
  // reference half kept the turn label: a slide holding a column-value chart, a
  // tenfold-relationship strip and a sticky fact, and nothing for the class to do
  // (flagged by Daniel, 2 Sept 2026).
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
          template: 'split-h-70-30',
          title: 'My Turn: column values',
          primary: {
            type: 'stack',
            items: [
              {
                type: 'place-value-chart',
                columns: ['Thousands', 'Hundreds', 'Tens', 'Ones'],
                rows: [{ cells: ['1,000', '100', '10', '1'] }]
              },
              { type: 'text', value: "A digit's place tells us its value." }
            ]
          },
          secondary: {
            type: 'sc-panel',
            content: { type: 'steps', steps: ['Name the columns.'] }
          }
        }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SLIDE_DESIGN_PRESENTATION');
    assert.match(result.stdout, /"signal":"TURN_SLIDE_WITHOUT_ITS_TURN"/);
    assert.match(result.stdout, /"slide":1/);
    // The build runs beside the spec-only rules, so its faults arrive in the
    // same report rather than on the next attempt.
    assert.equal(fs.existsSync(builderMarker), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// The deadlock of 8 September 2026. A roomier free layout has no `questions`
// field, so the turn's task arrives as prose - and Semantic colour makes a task
// BLACK. Black, and this check said there was no task; blue, and
// BLUE_WITHOUT_A_QUESTION said an imperative is not a question. Four slides of
// the Find 1,000 more/less deck had no legal form, and the deck was rebuilt from
// scratch to get out of it.
test('a black imperative IS the turn, and does not have to be painted blue', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'slide-design-imperative-'));
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';
`);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        {
          template: 'split-h-60-40',
          title: 'My Turn',
          primary: {
            type: 'stack',
            items: [
              { type: 'text', value: 'Find 1,000 more and 1,000 less than 3,412.' },
              {
                type: 'place-value-chart',
                columns: ['Thousands', 'Hundreds', 'Tens', 'Ones'],
                rows: [{ cells: ['3', '4', '1', '2'] }]
              }
            ]
          },
          secondary: {
            type: 'sc-panel',
            content: { type: 'steps', steps: ['Find the thousands column.'] }
          }
        }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });
    assert.doesNotMatch(result.stdout, /TURN_SLIDE_WITHOUT_ITS_TURN/);
    // And the task stays black, so the colour rule is not paid to satisfy it.
    assert.doesNotMatch(result.stdout, /BLUE_WITHOUT_A_QUESTION/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// Semantic colour names three carriers for a question - `color`, `focus-blue`
// and a `[[ ]]` span inside a line. Only the first two were read here, so a turn
// whose question is one clause of a longer line looked like no question at all.
test('a question carried as a [[ ]] span inside a line counts as the turn', () => {
  const chr10 = String.fromCharCode(10);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'slide-design-span-'));
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';
`);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        {
          template: 'split-h-60-40',
          title: 'My Turn',
          primary: {
            type: 'stack',
            items: [
              {
                type: 'text',
                value: '9,406 + 1,000 = ___' + chr10 + 'Then take away 1,000. [[Do we get back to 9,406?]]'
              },
              {
                type: 'place-value-chart',
                columns: ['Thousands', 'Hundreds', 'Tens', 'Ones'],
                rows: [{ cells: ['9', '4', '0', '6'] }]
              }
            ]
          },
          secondary: {
            type: 'sc-panel',
            content: { type: 'steps', steps: ['Find the thousands column.'] }
          }
        }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });
    assert.doesNotMatch(result.stdout, /TURN_SLIDE_WITHOUT_ITS_TURN/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// The discrimination the two above must not cost: a slide of facts under a turn
// title is still the interlude this check exists to refuse. "A thousand is ten
// hundreds." names something; it does not ask the class to do anything.
test('a turn slide carrying only statements is still refused', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'slide-design-statements-'));
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';
`);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        {
          template: 'split-h-60-40',
          title: 'My Turn',
          primary: {
            type: 'stack',
            items: [
              { type: 'text', value: 'A thousand is ten hundreds.' },
              { type: 'text', value: 'The thousands column sits fourth from the right.' }
            ]
          },
          secondary: {
            type: 'sc-panel',
            content: { type: 'steps', steps: ['Name the columns.'] }
          }
        }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });
    assert.match(result.stdout, /"signal":"TURN_SLIDE_WITHOUT_ITS_TURN"/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a turn slide showing its question, and the answer slide after it, both pass', () => {
  // The discrimination this check has to make: the same reference material is
  // fine on a slide that also carries the turn's question, and an answer slide
  // legitimately shows answers rather than a question.
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\nconsole.log('Wrote: nothing');\n`
    );
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        {
          template: 'split-h-60-40',
          title: 'My Turn: read the chart',
          primary: {
            type: 'stack',
            items: [
              {
                type: 'text',
                colorRole: 'focus-blue',
                value: 'What number does this chart represent?'
              },
              {
                type: 'place-value-chart',
                columns: ['Thousands', 'Hundreds', 'Tens', 'Ones'],
                rows: [{ cells: ['1,000', '100', '10', '1'] }]
              }
            ]
          }
        },
        {
          template: 'split-h-70-30',
          title: 'Your Turn Answers',
          primary: {
            type: 'stack',
            items: [{ type: 'text', value: '||4,261' }]
          }
        },
        // A turn whose question is a maths-turn-sc `questions` array, not a text
        // block, is carrying its turn just as clearly.
        {
          template: 'maths-turn-sc',
          title: 'Our Turn (a)',
          questions: [{ text: 'What number does this chart show?' }]
        }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.doesNotMatch(result.stdout, /TURN_SLIDE_WITHOUT_ITS_TURN/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function modellingSlide(title) {
  return {
    template: 'split-v-50-50',
    title,
    primary: {
      type: 'stack',
      items: [
        { type: 'text', value: '1,390 + 10 =', color: '0070C0' },
        {
          type: 'place-value-chart',
          columns: ['Th', 'H', 'T', 'O'],
          rows: [{ label: '1,390', cells: ['1', '3', '9', '0'] }, { label: '10 more', cells: ['', '', '', ''] }]
        }
      ]
    },
    secondary: {
      type: 'sc-panel',
      content: { type: 'steps', steps: ['Make the number.'] }
    }
  };
}

test('two modelling slides in a row block, and the scratch build still runs', () => {
  // The Year 4 "find 10 and 100 more or less" deck went My Turn (cross a
  // hundred), My Turn (cross a thousand), one Our Turn, Your Turn. The teacher
  // abandoned the lesson on the second model: the class had watched two moves
  // before practising either (flagged by Daniel, 3 Sept 2026). The design
  // validator refuses two My Turn source units; this catches the same board
  // reached by splitting one unit whose examples cannot share a visual.
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
        modellingSlide('My Turn: Cross a hundred'),
        modellingSlide('My Turn: Cross a thousand')
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SLIDE_DESIGN_PRESENTATION');
    assert.match(
      result.stdout,
      /"signal":"MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS"/
    );
    assert.match(result.stdout, /"slide":2/);
    // The message has to name the repair, not only the fault.
    assert.match(result.stdout, /its own cycle with an Our Turn between/);
    // The build runs beside the spec-only rules, so its faults arrive in the
    // same report rather than on the next attempt.
    assert.equal(fs.existsSync(builderMarker), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a model followed by the class taking its turn passes', () => {
  // The discrimination case: same two slides, but the second is the Our Turn.
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        modellingSlide('My Turn: Cross a hundred'),
        modellingSlide('Our Turn: Cross a thousand')
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.doesNotMatch(
      result.stdout,
      /MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS/
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a My Turn answer or reveal slide is not counted as a second model', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        modellingSlide('My Turn'),
        modellingSlide('My Turn answers')
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.doesNotMatch(
      result.stdout,
      /MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS/
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// A Year 4 place-value My Turn carried a counter-value reference twice: legibly
// in the side panel, and again as a half-inch smudge at the foot of the main
// column, where four columns of headings and values were pure noise. The
// smaller copy was doing nothing the larger one was not, and it was taking
// space from the charts the class had to read (flagged by Daniel, 3 September
// 2026: "those place value charts ... were so small").
function pictureSlide(title, primaryItems, secondaryItems) {
  const slide = {
    template: 'split-h-60-40',
    title,
    primary: { type: 'stack', items: primaryItems }
  };
  if (secondaryItems) slide.secondary = { type: 'stack', items: secondaryItems };
  return slide;
}

const REFERENCE = { type: 'image', imagePath: 'generated/counter-values.png' };

test('one picture drawn twice on one slide blocks, and the scratch build still runs', () => {
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
        pictureSlide(
          'My Turn - read the chart',
          [{ type: 'text', value: 'What number does each chart show?' }, { ...REFERENCE, weight: 0.7 }],
          [{ ...REFERENCE, weight: 2 }]
        )
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SLIDE_DESIGN_PRESENTATION');
    assert.match(result.stdout, /"signal":"PICTURE_TWICE_ON_ONE_SLIDE"/);
    assert.match(result.stdout, /"slide":1/);
    // The message has to name the repair, not only the fault.
    assert.match(result.stdout, /Keep the copy that is the right size/);
    // The build runs beside the spec-only rules, so its faults arrive in the
    // same report rather than on the next attempt.
    assert.equal(fs.existsSync(builderMarker), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a reference the class reads across a run of slides is left alone', () => {
  // The discrimination, and the reason this counts copies per slide rather than
  // per deck: a reference that recedes on every slide of a beat is exactly what
  // the composition playbook asks for. The fault is two copies competing in one
  // field of view, not one picture doing its job several times.
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        pictureSlide('My Turn', [{ type: 'text', value: 'Watch me.' }], [{ ...REFERENCE, weight: 2 }]),
        pictureSlide('Our Turn', [{ type: 'text', value: 'Together.' }], [{ ...REFERENCE, weight: 2 }]),
        pictureSlide('Your Turn', [{ type: 'text', value: 'Your go.' }], [{ ...REFERENCE, weight: 2 }])
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.doesNotMatch(result.stdout, /PICTURE_TWICE_ON_ONE_SLIDE/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a picture named in speaker notes is not a picture on the slide', () => {
  // Notes are the teacher's script and never reach the board, so a filename
  // mentioned there must not read as a second copy.
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const slide = pictureSlide('My Turn', [{ ...REFERENCE, weight: 2 }]);
    slide.speakerNotes = { reminder: { type: 'image', imagePath: 'generated/counter-values.png' } };
    const lessonPath = writeLesson(root, { ...ordinaryLesson(), slides: [slide] });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.doesNotMatch(result.stdout, /PICTURE_TWICE_ON_ONE_SLIDE/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// One My Turn divided across slides is one move modelled twice; two My Turns
// from different source units are two moves, which is the fault this rule was
// built for. The source unit is what tells them apart, and until it was read the
// rule refused both - so a lesson whose representation cannot be shared legibly
// had nowhere to go (flagged by Daniel, 3 September 2026: "I'd honestly have one
// each slide, 2 my turns etc").
function modelSlide(title, unit) {
  return { ...modellingSlide(title), designUnitId: unit };
}

test('one My Turn unit divided across two slides is one move, not two', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        modelSlide('My Turn - build the chart', 'teaching-sequence/unit-001'),
        modelSlide('My Turn - build the chart', 'teaching-sequence/unit-001')
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.doesNotMatch(result.stdout, /MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('two My Turn units in a row are still two moves and still refused', () => {
  // The discrimination, and the original fault: cross a hundred, then cross a
  // thousand, and the class practises neither before watching both.
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        modelSlide('My Turn: Cross a hundred', 'teaching-sequence/unit-001'),
        modelSlide('My Turn: Cross a thousand', 'teaching-sequence/unit-002')
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.match(result.stdout, /"signal":"MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS"/);
    assert.match(result.stdout, /come from different source units/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a My Turn with no source unit at all is still refused', () => {
  // The permission is evidence, not an absence of it: a slide that names no unit
  // cannot claim to share one.
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [modellingSlide('My Turn'), modellingSlide('My Turn')]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.match(result.stdout, /MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a picture below its readable floor blocks promotion like any capacity fault', () => {
  // The floor used to be a [warn] line the check read past: a lone classroom
  // photograph shipped at two inches under "look closely" (4 September 2026).
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\n` +
        `const fs = require('node:fs');\n` +
        `const path = require('node:path');\n` +
        `const outputDir = process.argv[3];\n` +
        `const outputPath = path.join(outputDir, 'Scratch Check.pptx');\n` +
        `fs.writeFileSync(outputPath, 'scratch');\n` +
        `console.log('BUILD_DIAGNOSTIC: {"signal":"PICTURE_BELOW_READABLE_FLOOR","artifact":"slides","faultClass":"composition","location":{"slide":9,"path":"image:unsplash/classroom.jpg"},"message":"guaranteed only 1.91 on its short side"}');\n` +
        `console.log('Wrote: ' + outputPath);\n`
    );
    const lessonPath = writeLesson(root, ordinaryLesson());

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SLIDE_DESIGN_CAPACITY');
    assert.match(result.stdout, /"signal":"PICTURE_BELOW_READABLE_FLOOR"/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// A launch pair assembled by hand.
//
// The pair is the one board that tells a class which of two things is better,
// and `strong-and-weak` is what draws that: the tick, the cross, the red weak
// card. Three Year 4 decks each invented their own two plain white boxes
// instead, on a different side each time.
function writeDesignWithLaunchPair(root) {
  fs.writeFileSync(path.join(root, 'lesson-design.json'), JSON.stringify({
    teachingSequence: [
      {
        sourceUnitId: 'lesson-section/teaching-sequence/unit-006',
        kind: 'practise',
        content: {
          activity: 'Write the explanation',
          launch: {
            established: null,
            goodLooksLike: {
              strong: { words: 'A chained explanation.', show: null },
              weak: { words: 'Four true facts.', show: null },
              difference: 'Each sentence picks up the one before.'
            },
            steps: ['Read it.', 'Write it.']
          }
        }
      }
    ]
  }, null, 2));
}

test('a launch pair built by hand is refused and named', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    writeDesignWithLaunchPair(root);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        {
          template: 'body-full',
          title: 'What a good explanation does',
          designUnitId: 'lesson-section/teaching-sequence/unit-006',
          body: {
            type: 'row',
            items: [
              { type: 'text', value: 'Strong: "A chained explanation."' },
              { type: 'text', value: 'Weak: "Four true facts."' }
            ]
          }
        }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.match(result.stdout, /"signal":"LAUNCH_PAIR_NEEDS_ITS_TEMPLATE"/);
    assert.match(result.stdout, /strong-and-weak/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a launch pair on its own template passes', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    writeDesignWithLaunchPair(root);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        {
          template: 'strong-and-weak',
          title: 'What a good explanation does',
          designUnitId: 'lesson-section/teaching-sequence/unit-006',
          strongHeading: 'An explanation',
          weakHeading: 'Not an explanation',
          strong: { type: 'text', value: 'A chained explanation.' },
          weak: { type: 'text', value: 'Four true facts.' },
          difference: 'Each sentence picks up the one before.'
        }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.ok(!/LAUNCH_PAIR_NEEDS_ITS_TEMPLATE/.test(result.stdout));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a lesson whose launch carries no pair is left alone', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    fs.writeFileSync(path.join(root, 'lesson-design.json'), JSON.stringify({
      teachingSequence: [
        {
          sourceUnitId: 'lesson-section/teaching-sequence/unit-006',
          kind: 'practise',
          content: {
            activity: 'Write the explanation',
            launch: {
              established: 'We have the four steps.',
              goodLooksLike: null,
              steps: ['Read it.', 'Write it.']
            }
          }
        }
      ]
    }, null, 2));
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [
        {
          template: 'body-full',
          title: 'How to write it',
          designUnitId: 'lesson-section/teaching-sequence/unit-006',
          body: { type: 'text', value: 'Read it. Write it.' }
        }
      ]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.ok(!/LAUNCH_PAIR_NEEDS_ITS_TEMPLATE/.test(result.stdout));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function twoModelsOneLine(title, questionCount) {
  return {
    template: 'maths-turn-sc',
    title,
    questions: Array.from({ length: questionCount }, (_, i) => ({ text: `Round ${340 + i * 8} to the nearest 100.` })),
    questionVisual: { type: 'numberline', start: 300, end: 400, interval: 10, labels: [] },
    criteria: { type: 'steps', steps: ['Mark halfway and your number.'] }
  };
}

test('two modelled numbers over one figure the teacher writes on are refused', () => {
  // 19 September 2026: modelling 34 and then 50 over one number line means
  // rubbing the first model out in front of the class.
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [twoModelsOneLine('My Turn: Which hundred is nearer?', 2)]
    });

    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'SLIDE_DESIGN_PRESENTATION');
    assert.match(result.stdout, /"signal":"ONE_MODEL_PER_ANNOTATED_FIGURE"/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('one modelled number per figure passes, and so does a Your Turn with several', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const onePerSlide = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [twoModelsOneLine('My Turn: Which hundred is nearer?', 1)]
    });
    assert.doesNotMatch(
      runSlideDesignCheck(onePerSlide, { buildPath: fakeBuilder }).stdout,
      /ONE_MODEL_PER_ANNOTATED_FIGURE/
    );

    const yourTurn = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [twoModelsOneLine('Your Turn: Round these', 4)]
    });
    assert.doesNotMatch(
      runSlideDesignCheck(yourTurn, { buildPath: fakeBuilder }).stdout,
      /ONE_MODEL_PER_ANNOTATED_FIGURE/
    );

    const twoLines = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [{
        ...twoModelsOneLine('My Turn: Two finished lines', 2),
        questionVisual: {
          type: 'numberline',
          lines: [
            { start: 300, end: 400, interval: 10, labels: [] },
            { start: 600, end: 700, interval: 10, labels: [] }
          ]
        }
      }]
    });
    assert.doesNotMatch(
      runSlideDesignCheck(twoLines, { buildPath: fakeBuilder }).stdout,
      /ONE_MODEL_PER_ANNOTATED_FIGURE/
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// `inBooks` narrows a sum's empty row because nobody writes in it on the board
// (the teacher, 16 October 2026). On a My Turn or Our Turn the teacher does.
function sumSlide(title, inBooks) {
  return {
    template: 'maths-turn-sc',
    title,
    questions: ['6,284 - 2,139 ='],
    questionVisual: {
      type: 'place-value-chart',
      columns: ['Th', 'H', 'T', 'O'],
      calculation: { operator: '-', numbers: ['6284', '2139'] },
      ...(inBooks ? { inBooks: true } : {})
    },
    criteria: { type: 'steps', steps: ['Start with the ones.'] }
  };
}

test('a sum the teacher completes on the board may not be marked as answered in books', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    for (const title of ['My Turn', 'Our Turn']) {
      const result = runSlideDesignCheck(
        writeLesson(root, { ...ordinaryLesson(), slides: [sumSlide(title, true)] }),
        { buildPath: fakeBuilder }
      );
      assert.equal(result.ok, false, title);
      assert.match(result.stdout, /"signal":"IN_BOOKS_ON_A_MODELLING_SLIDE"/);
    }
    for (const [title, inBooks] of [['Your Turn', true], ['My Turn', false]]) {
      assert.doesNotMatch(
        runSlideDesignCheck(
          writeLesson(root, { ...ordinaryLesson(), slides: [sumSlide(title, inBooks)] }),
          { buildPath: fakeBuilder }
        ).stdout,
        /IN_BOOKS_ON_A_MODELLING_SLIDE/
      );
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// Blue is a question or the child's short task, and an instruction about how to
// go about the task stays black: the teacher's answer of 24 September 2026,
// narrowing his "can we make only questions to children blue" of 3 September.
// Which a line is cannot be counted in words, so the designer says, with
// `colorRole: "task-blue"`, and the check reads the role. These run the saved
// lines the colours release's checks named, both ways: the job lines pass when
// marked, and advice, statements and answers are refused in any blue the
// designer did not declare a task, and in the role itself wherever the spec
// shows what the line is.
function slideOf(items, title = 'Your Turn: round the numbers') {
  return {
    ...ordinaryLesson(),
    slides: [{ template: 'body-full', title, body: { type: 'stack', items } }]
  };
}

function checkSlide(items, title, design) {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const lessonPath = writeLesson(root, slideOf(items, title));
    if (design) fs.writeFileSync(path.join(root, 'lesson-design.json'), JSON.stringify(design));
    return runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

// The messages a designer repairs from, read as plain text.
function messages(result) {
  return result.stdout
    .split('\n')
    .map((line) => {
      try {
        return JSON.parse(line.slice(line.indexOf('{')));
      } catch {
        return null;
      }
    })
    .filter((entry) => entry && typeof entry.message === 'string');
}

function messageFor(result, signal) {
  const found = messages(result).find((entry) => entry.signal === signal);
  assert.ok(found, `no ${signal} in ${result.stdout}`);
  return found.message;
}

test('a short task marked task-blue passes, alone and after its question, at any length the job takes', () => {
  const jobs = [
    'Round 346 to the nearest 10.',
    'Explain what happens to the digits.',
    'Write the greater number in each pair.',
    'Name a job a Victorian child did.',
    'Name a job, e.g. a chimney sweep.',
    'Explain what {{enamel}} does.',
    'Explain why your example matters to you.',
    'Say why.',
    'Justify your answer.',
    'Put these in order.',
    'Is Isla correct? Explain your answer.',
    'Is Dev right? Explain.',
    // A job with its how is the job (his answer of 25 September 2026: "y"):
    // saved lines that ask for the job and name what to use.
    'Explain your answer using the photograph.',
    'Describe each tooth using the pictures.',
    'Explain using the number line.',
    'Sort the examples using the 1842 rule.',
    // A job said in two or three sentences is still the job (his answers of 8
    // and 13 October 2026: "blue is like a question for children"). A Year 4
    // science deck had six of these refused and delivered them black.
    'Choose the producer. Write its name.',
    'Decide who has eaten more. Write Chidi, Ali or the same.',
    'Is Isla correct? Explain your answer. Write one reason.',
    'Label the producer and the consumers. Choose one arrow. Explain what it tells us.'
  ];
  const result = checkSlide(jobs.map((value) => ({ type: 'text', colorRole: 'task-blue', value })));
  assert.doesNotMatch(result.stdout, /BLUE_WITHOUT_A_QUESTION/);
  assert.doesNotMatch(result.stdout, /MIXED_BLOCK_WHOLE_BLUE/);
  assert.doesNotMatch(result.stdout, /TASK_BLUE_NOT_A_SHORT_TASK/);
  assert.doesNotMatch(result.stdout, /TURN_SLIDE_WITHOUT_ITS_TURN/);
});

test('advice, a statement or a label painted blue without the role is refused, as 4.2.289 refused it', () => {
  const lines = [
    // Saved lines that only say how to go about the job: black, and refused
    // in blue.
    'Use the shaded map.',
    'Use the two photographs.',
    'Use the number line to help you.',
    'Look at the shaded areas and the Equator.',
    'Read the question carefully.',
    'Look at the picture.',
    'Round numbers are easier.',
    'Change: the tools were different.',
    'Answer: 4,000.',
    'Round 346 to the nearest 10.'
  ];
  const items = lines.map((value) => ({ type: 'text', colorRole: 'focus-blue', value }));
  items.push({ type: 'steps', steps: ['[[Explain your answer.]]'] });
  items.push({ type: 'text', color: '0070C0', value: 'Write one reason.' });
  const result = checkSlide(items);
  assert.equal(result.ok, false);
  const hits = result.stdout.match(/"signal":"BLUE_WITHOUT_A_QUESTION"/g) || [];
  // Every line: a job line too, until the designer marks it a task, because a
  // span or a hex cannot say which it is.
  assert.equal(hits.length, lines.length + 2);
  // The whole of what the designer is told, not only its opening.
  const message = messageFor(result, 'BLUE_WITHOUT_A_QUESTION');
  assert.ok(message.includes(
    "Blue is for a question children answer, and for the child's own short task, the job itself " +
    '(`Explain your answer.`, `Write one reason.`). If this line is the job children do, it stays ' +
    'blue: mark it `colorRole: "task-blue"` in place of the `focus-blue` role, the house-blue ' +
    '`color` or the `[[ ]]` span. If it is a statement, an answer or an instruction about how to go ' +
    'about the task, it is black: take the blue off and leave it for the question or short task ' +
    'this belongs to.'
  ), message);
});

test('task-blue refuses what the spec shows is not a short task', () => {
  const design = {
    stickyKnowledge: [{ id: 'sk-1', text: 'Enamel cannot grow back.' }],
    teachingSequence: [{
      sourceUnitId: 'unit-1',
      answer: { kind: 'text', content: '346 rounds to 350', acceptanceCondition: null, delivery: 'reveal' }
    }]
  };
  const refused = [
    ['Round 3,462 to the nearest 1,000. ||3,000', /it carries the reveal mark `\|\|`/],
    ['✨ Enamel is the hardest material.', /it is a sticky fact, which is purple/],
    ['Enamel cannot grow back.', /it is a sticky fact, which is purple/],
    ['346 rounds to 350.', /it is the lesson's answer, which is green on an answer slide/],
    ['A kettle and a lamp are both appliances. What is electricity doing in each one?', /it tells before it asks/],
    ['Explain your answer. Is Isla correct?', /it tells before it asks/],
    ['Amara smiles. Could Amara still need support? Use the story to explain.', /it tells before it asks/],
    ['Look at the picture. Read the question carefully. Use the word bank. Write one sentence.', /it holds 4 sentences that are not questions, and a board that arrives all blue lifts nothing/]
  ];
  const result = checkSlide(
    refused.map(([value]) => ({ type: 'text', colorRole: 'task-blue', value })),
    undefined,
    design
  );
  assert.equal(result.ok, false);
  const found = messages(result).filter((entry) => entry.signal === 'TASK_BLUE_NOT_A_SHORT_TASK');
  assert.equal(found.length, refused.length, result.stdout);
  refused.forEach(([value, reason], index) => {
    assert.ok(found[index].message.startsWith(`"${value.slice(0, 60)}"`), found[index].message);
    assert.match(found[index].message, reason);
  });
  assert.ok(found[0].message.includes(
    "`task-blue` is for the child's own short task, the job in a few words (`Explain your answer.`, " +
    '`Choose the producer. Write its name.`), alone or after its question on the same line. A ' +
    'statement, an answer, a sticky fact or an instruction about how to go about the task is not ' +
    'blue: move that sentence into black text of its own and leave the job blue. Take the role off ' +
    'the whole line only when none of it is the job.'
  ), found[0].message);
  // What to do with a block that tells and then asks, so the repair keeps the blue on the job.
  assert.ok(found[4].message.includes(
    'split it at that question, so the question starts a blue line of its own with its job after it, ' +
    'and a sentence that only tells goes in black text of its own'
  ), found[4].message);
});

test('a task-blue line that carries its own colour is refused, and its hex never makes the turn', () => {
  // The third check: a statement marked task-blue and given the house-blue hex
  // printed blue and counted as a My Turn's turn, because the turn reads a hex.
  const title = 'My Turn: column values';
  for (const value of ["A digit's place tells us its value.", 'Explain your answer.']) {
    const result = checkSlide([{ type: 'text', colorRole: 'task-blue', color: '0070C0', value }], title);
    assert.equal(result.ok, false, value);
    const message = messageFor(result, 'TASK_BLUE_NOT_A_SHORT_TASK');
    assert.ok(message.includes('is marked task-blue and also carries its own colour ("0070C0"). A short task takes ' +
      'its blue from the role alone, never a hex: take the `color` off and keep `colorRole: "task-blue"`.'), message);
    assert.ok(!message.includes('take the role off'), message);
  }
});

test('a question with its task in one focus-blue block is still a mixed block, and the message names task-blue', () => {
  const result = checkSlide([
    { type: 'text', colorRole: 'focus-blue', value: 'Is Isla correct? Explain your answer.' }
  ]);
  assert.match(result.stdout, /"signal":"MIXED_BLOCK_WHOLE_BLUE"/);
  assert.match(result.stdout, /may share its question's line as `task-blue`/);
});

test('the role never makes a turn: a statement marked task-blue is still no turn', () => {
  const title = 'My Turn: column values';
  const statement = checkSlide([{ type: 'text', value: "A digit's place tells us its value." }], title);
  assert.match(statement.stdout, /"signal":"TURN_SLIDE_WITHOUT_ITS_TURN"/);
  const message = messageFor(statement, 'TURN_SLIDE_WITHOUT_ITS_TURN');
  assert.ok(message.includes(
    'Colour does not make a line a task: a statement or an instruction painted blue is refused by ' +
    "BLUE_WITHOUT_A_QUESTION, and `task-blue` is only for the child's own short task, the job itself " +
    '(`Explain your answer.`), never advice on how to go about it.'
  ), message);
  assert.doesNotMatch(statement.stdout, /The task stays BLACK/);
  const marked = checkSlide(
    [{ type: 'text', colorRole: 'task-blue', value: "A digit's place tells us its value." }],
    title
  );
  assert.match(marked.stdout, /"signal":"TURN_SLIDE_WITHOUT_ITS_TURN"/);
  // A marked short task is the turn by its words: a task verb, the saved
  // decks' own openers among them, or a question it carries.
  for (const value of ['Write the value of each digit.', 'Say why.', 'Is Isla correct? Explain.']) {
    const turn = checkSlide([{ type: 'text', colorRole: 'task-blue', value }], title);
    assert.doesNotMatch(turn.stdout, /TURN_SLIDE_WITHOUT_ITS_TURN/, value);
  }
  // `Place value` opens a statement, not a task.
  const placeValue = checkSlide([{ type: 'text', value: 'Place value tells us what a digit is worth.' }], title);
  assert.match(placeValue.stdout, /"signal":"TURN_SLIDE_WITHOUT_ITS_TURN"/);
});

test('a starter of task-blue lines is all blue, as one of focus-blue lines is', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [{
        template: 'body-full',
        title: 'Starter',
        headerStyle: 'starter',
        body: {
          type: 'numbered-questions',
          questions: [
            { text: 'Round 346 to the nearest 10.', colorRole: 'task-blue' },
            { text: 'Round 351 to the nearest 10.', colorRole: 'task-blue' }
          ]
        }
      }]
    });
    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });
    assert.match(result.stdout, /"signal":"STARTER_QUESTIONS_ALL_BLUE"/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// A starter that tells and then asks is coloured like any other slide. The
// teacher asked why its question was black (5 October 2026): the starter rule
// is for a list of questions, and it had been read as "a starter is black".
test('a starter that tells and then asks has its question in blue', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const starter = (question) => writeLesson(root, {
      ...ordinaryLesson(),
      slides: [{
        template: 'body-full',
        title: 'What can a badge remind us of?',
        headerStyle: 'starter',
        body: {
          type: 'stack',
          items: [
            { type: 'text', value: 'This team badge can remind someone of their team.' },
            { type: 'text', value: 'What else could the same badge remind someone of?', ...question }
          ]
        }
      }]
    });
    const black = runSlideDesignCheck(starter({}), { buildPath: fakeBuilder });
    assert.equal(black.reason, 'SLIDE_DESIGN_PRESENTATION');
    assert.match(black.stdout, /"signal":"STARTER_QUESTION_NOT_BLUE"/);
    const blue = runSlideDesignCheck(starter({ colorRole: 'focus-blue' }), { buildPath: fakeBuilder });
    assert.ok(!/STARTER_QUESTION/.test(blue.stdout));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// `--settled` turns every wording, title and colour fault into a note. On the
// slide designer's own check that would let them all through the one gate that
// sends them back, so only the decorator's check, on a settled deck, and the
// orchestrator's re-check after it carry it (the second check, 26 September
// 2026, found that adding it to the designer's check passed every suite).
test("the slide designer's own check never runs with --settled; only the decorator's does", () => {
  const plugin = path.join(__dirname, '..', '..');
  const read = (rel) => fs.readFileSync(path.join(plugin, rel), 'utf8').replace(/\r\n/g, '\n');
  // scripts/preview-deck.py runs the same check, then draws the pages
  // (17 October 2026), so its commands count as check commands too.
  const commands = (text) =>
    text.split(/\n\s*\n/).filter((block) =>
      block.includes('builder/scripts/check-slide-design.js') || block.includes('scripts/preview-deck.py'));
  let designerCommands = 0;
  for (const name of fs.readdirSync(path.join(plugin, 'agents')).filter((file) => file.endsWith('.md'))) {
    for (const block of commands(read(path.join('agents', name)))) {
      if (name === 'slide-decorator.md') {
        assert.match(block, /--settled/, `${name}: ${block}`);
      } else {
        assert.doesNotMatch(block, /--settled/, `${name}: ${block}`);
        designerCommands += 1;
      }
    }
  }
  assert.ok(designerCommands >= 1, "the slide designer's check command was not found");
  const playbook = read(path.join('skills', 'make-lesson', 'playbook-lite.md'));
  const pass = playbook.indexOf('**The decoration pass.**');
  assert.ok(pass > 0, 'the playbook no longer marks the decoration pass');
  const trackA = commands(playbook.slice(0, pass));
  assert.ok(trackA.length >= 1, "the playbook's Track A check was not found");
  for (const block of trackA) assert.doesNotMatch(block, /--settled/, block);
  const decorator = commands(playbook.slice(pass));
  assert.ok(decorator.length >= 1, "the playbook's decorator check was not found");
  for (const block of decorator) assert.match(block, /--settled/, block);
});

// The teacher's rule of 28 September 2026: a word card sits straight before the
// first slide whose board shows its word. A Codex geography deck put `climate`
// before a Sahara slide whose board never said it.
test('a word card before a slide whose board lacks its word names the slide to move to', () => {
  const { vocabCardBeforeItsWord } = require('../scripts/check-slide-design');
  const lesson = { slides: [
    { template: 'key-vocabulary', words: [{ word: 'climate', definition: 'The weather a place usually has.' }] },
    { template: 'teach-layout', title: 'From dry land to thick forest', lead: 'The Sahara gets very little rain.',
      speakerNotes: 'Climate means the weather a place usually has.' },
    { template: 'teach-layout', title: 'From dry land to thick forest', lead: 'Its climate stays warm and wet.' }
  ] };
  const found = vocabCardBeforeItsWord(lesson);
  assert.strictEqual(found.length, 1, 'the notes do not count as the board');
  assert.match(found[0].message, /slide 3: move the card/);
});

test('a word card straight before its word, in any form, is left alone', () => {
  const { vocabCardBeforeItsWord } = require('../scripts/check-slide-design');
  const lesson = { slides: [
    { template: 'key-vocabulary', words: [{ word: 'biome', definition: 'A large area.' }] },
    { template: 'key-vocabulary', words: [{ word: 'Equator', definition: 'A line.' }] },
    { template: 'teach-layout', title: 'What makes a biome?', lead: 'Deserts are biomes too.' },
    { template: 'key-vocabulary', words: [{ word: 'city', definition: 'A big town.' }] },
    { template: 'teach-layout', lead: 'Most people live in cities.' }
  ] };
  const found = vocabCardBeforeItsWord(lesson);
  assert.strictEqual(found.length, 1, 'only Equator, which no board shows');
  assert.match(found[0].message, /Equator/);
  assert.match(found[0].message, /No board after it shows the word/);
});

// 29 September 2026: a paced Teach said "a disease called cholera" on a slide
// before its card, whose script then said "the word we've just met".
test('a word card after a slide that already shows its word is sent back before that slide', () => {
  const { vocabCardBeforeItsWord } = require('../scripts/check-slide-design');
  const lesson = { slides: [
    { template: 'body-full', lo: 'To explain how cholera spread and was treated', title: 'Victorian London', body: 'Families lived squashed together.' },
    { template: 'teach-layout', title: 'Why did Victorians blame the smell?', lead: 'In 1854, a disease called cholera spread through Soho.' },
    { template: 'key-vocabulary', words: [{ word: 'cholera', definition: 'A disease that makes people very sick.' }] },
    { template: 'teach-layout', lead: 'Cholera made people very sick in their stomachs.' }
  ] };
  const found = vocabCardBeforeItsWord(lesson);
  assert.strictEqual(found.length, 1, 'the objective line on slide 1 does not count');
  assert.strictEqual(found[0].signal, 'VOCAB_CARD_AFTER_A_SLIDE_WITH_ITS_WORD');
  assert.match(found[0].message, /move it back to sit before slide 2/);
});

// 13 October 2026: a Year 5 fractions deck asked "Who has painted more?", showed
// the card for numerator and denominator, then answered. The answer slide was the
// first board to print the words, so the check had forced the card in between.
const fencesPair = (cardAt) => {
  const question = { template: 'teach-layout', designUnitId: 'lesson-section/teaching-sequence/unit-001',
    title: 'Who has painted more?', lead: 'Two fences the same length.', task: { value: 'Explain why.', signal: 'pencil' } };
  const answer = { template: 'teach-layout', designUnitId: 'lesson-section/teaching-sequence/unit-001',
    title: 'Who has painted more?', sticky: 'We can only compare the numerators when the denominators are the same.' };
  const card = { template: 'key-vocabulary', words: [{ word: 'numerator and denominator', definition: 'Top and bottom.' }] };
  const starter = { template: 'body-full', headerStyle: 'starter', title: 'Starter', body: 'Write < or >.' };
  const later = { template: 'split-h-70-30', designUnitId: 'lesson-section/teaching-sequence/unit-002', title: 'My Turn' };
  const slides = [starter, question, answer, later];
  slides.splice(cardAt, 0, card);
  return { slides };
};

test('a word card between a question and its answer is sent to one side of the pair', () => {
  const { vocabCardBeforeItsWord } = require('../scripts/check-slide-design');
  const found = vocabCardBeforeItsWord(fencesPair(2));
  assert.strictEqual(found.length, 1);
  assert.strictEqual(found[0].signal, 'VOCAB_CARD_BETWEEN_A_QUESTION_AND_ITS_ANSWER');
  assert.match(found[0].message, /straight after slide 4, or to straight before slide 2/);
});

test('a word card straight after the answer, or straight before the question, is in place', () => {
  const { vocabCardBeforeItsWord } = require('../scripts/check-slide-design');
  assert.deepStrictEqual(vocabCardBeforeItsWord(fencesPair(3)), [], 'after the answer');
  assert.deepStrictEqual(vocabCardBeforeItsWord(fencesPair(1)), [], 'before the question');
});

test('a card inside an ordinary run of teaching slides keeps the old rule', () => {
  const { vocabCardBeforeItsWord } = require('../scripts/check-slide-design');
  const unit = 'lesson-section/teaching-sequence/unit-001';
  const lesson = { slides: [
    { template: 'teach-layout', designUnitId: unit, title: 'Victorian London', lead: 'Families lived squashed together.' },
    { template: 'key-vocabulary', words: [{ word: 'cholera', definition: 'A disease.' }] },
    { template: 'teach-layout', designUnitId: unit, lead: 'Cholera made people very sick.' }
  ] };
  assert.deepStrictEqual(vocabCardBeforeItsWord(lesson), [], 'no task on the slide before, so nothing is split');
});

// The teacher's rulings of 7 October 2026, after six of twenty lessons were
// refused: the starter is outside the placement rule, a paired card is two
// words, and cards may sit back to back.
test('a starter that prints the word does not make the card after it late', () => {
  const { vocabCardBeforeItsWord } = require('../scripts/check-slide-design');
  const lesson = { slides: [
    { template: 'split-h-60-40', headerStyle: 'starter', title: 'Starter', primary: { type: 'text', value: 'Noun or adjective?' } },
    { template: 'split-h-60-40', designUnitId: 'lesson-section/starter/unit-001', title: 'Starter - check', primary: { type: 'text', value: 'owl is a noun' } },
    { template: 'key-vocabulary', words: [{ word: 'noun', definition: 'A naming word.' }, { word: 'adjective', definition: 'A describing word.' }] },
    { template: 'teach-layout', lead: 'Tall is the adjective and tree is the noun.' }
  ] };
  assert.deepStrictEqual(vocabCardBeforeItsWord(lesson), []);
});

test('a word card before the starter is sent to after it', () => {
  const { vocabCardBeforeItsWord } = require('../scripts/check-slide-design');
  const lesson = { slides: [
    { template: 'key-vocabulary', words: [{ word: 'noun', definition: 'A naming word.' }] },
    { template: 'split-h-60-40', headerStyle: 'starter', title: 'Starter', primary: { type: 'text', value: 'Noun or adjective?' } },
    { template: 'split-h-60-40', headerStyle: 'starter', title: 'Answers', primary: { type: 'text', value: 'owl is a noun' } },
    { template: 'teach-layout', lead: 'Tree is the noun.' }
  ] };
  const found = vocabCardBeforeItsWord(lesson);
  assert.strictEqual(found.length, 1);
  assert.strictEqual(found[0].signal, 'VOCAB_CARD_BEFORE_THE_STARTER');
  assert.match(found[0].message, /after slide 3, the starter's last slide/);
});

test('a paired card is read as its two words', () => {
  const { vocabCardBeforeItsWord } = require('../scripts/check-slide-design');
  const pair = { template: 'key-vocabulary', words: [{ word: 'whole and part', definition: 'Everything, and one piece of it.' }] };
  const shown = { slides: [pair, { template: 'maths-turn-sc', title: 'My Turn', body: '5 is the whole.' }] };
  assert.deepStrictEqual(vocabCardBeforeItsWord(shown), []);
  const slashed = { slides: [
    { template: 'key-vocabulary', words: [{ word: 'tributary / confluence', definition: 'A smaller river, and where it joins.' }] },
    { template: 'teach-layout', lead: 'The two rivers meet at a confluence.' }
  ] };
  assert.deepStrictEqual(vocabCardBeforeItsWord(slashed), []);
  const absent = { slides: [pair, { template: 'maths-turn-sc', title: 'My Turn', body: '7 and 3 make 10.' }] };
  const found = vocabCardBeforeItsWord(absent);
  assert.strictEqual(found.length, 1, 'neither word is on the next board');
  assert.strictEqual(found[0].signal, 'VOCAB_CARD_BEFORE_A_SLIDE_WITHOUT_ITS_WORD');
});

test('two word cards back to back pass when the slide after them shows their words', () => {
  const { vocabCardBeforeItsWord } = require('../scripts/check-slide-design');
  const lesson = { slides: [
    { template: 'body-full', headerStyle: 'starter', title: 'Starter', body: 'Count the boxes.' },
    { template: 'key-vocabulary', words: [{ word: 'number bond', definition: 'Two numbers that make another.' }] },
    { template: 'key-vocabulary', words: [{ word: 'whole', definition: 'Everything together.' }] },
    { template: 'teach-layout', lead: 'In this number bond, 10 is the whole.' }
  ] };
  assert.deepStrictEqual(vocabCardBeforeItsWord(lesson), []);
});

// ─── An essential picture drawn only as background ────────────────────────

function writePhotoRequirements(root, photos) {
  fs.writeFileSync(path.join(root, 'photo-requirements.json'), JSON.stringify({ schema_version: 2, photos }));
}

function diagramSlide(title, essential) {
  const picture = { type: 'image', imagePath: 'unsplash/body-diagram.jpg' };
  if (essential !== undefined) picture.essential = essential;
  return pictureSlide(title, [{ type: 'text', value: 'Blood travels in tubes called blood vessels.' }], [picture]);
}

test('a picture the plan calls essential cannot be background on every slide that draws it', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    writePhotoRequirements(root, [{ id: 'photo-005', filename: 'unsplash/body-diagram.jpg', essential: true }]);

    // The Year 6 science deck: the main diagram, opted out everywhere.
    const hidden = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [diagramSlide('How does blood get around your body?', false), diagramSlide('Find a red tube', false)]
    });
    const refused = runSlideDesignCheck(hidden, { buildPath: fakeBuilder });
    assert.equal(refused.ok, false);
    assert.match(refused.stdout, /"signal":"ESSENTIAL_PICTURE_ONLY_AS_BACKGROUND"/);
    assert.match(refused.stdout, /every slide that draws it \(1, 2\)/);

    // Shown properly once, it may come back as a reminder (the Year 1 plant deck).
    const reminder = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [diagramSlide('How does blood get around your body?'), diagramSlide('The same body again', false)]
    });
    const allowed = runSlideDesignCheck(reminder, { buildPath: fakeBuilder });
    assert.doesNotMatch(allowed.stdout, /ESSENTIAL_PICTURE_ONLY_AS_BACKGROUND/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a picture the plan does not call essential may be background everywhere', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    writePhotoRequirements(root, [{ id: 'photo-005', filename: 'unsplash/body-diagram.jpg', essential: false }]);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [diagramSlide('How does blood get around your body?', false)]
    });
    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });
    assert.doesNotMatch(result.stdout, /ESSENTIAL_PICTURE_ONLY_AS_BACKGROUND/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a vocabulary card picture is left out of the background-only check', () => {
  // The Year 1 plant deck: three word-card pictures, each essential in the
  // plan and drawn nowhere else. The card refuses nothing (13 September 2026).
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    writePhotoRequirements(root, [{ id: 'photo-002', filename: 'unsplash/flower-close-up.jpg', essential: true }]);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [{
        template: 'key-vocabulary',
        words: [{
          word: 'flower',
          definition: 'A flower is the colourful part of a plant.',
          visual: { type: 'image', imagePath: 'unsplash/flower-close-up.jpg', essential: false }
        }]
      }]
    });
    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });
    assert.doesNotMatch(result.stdout, /ESSENTIAL_PICTURE_ONLY_AS_BACKGROUND/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ─── the story before its instruction ──────────────────────────────

const STORY = 'At break Amara smiles when a friend comes over. Amara has stayed away from the playground game for three days.';
const HOW_TO = 'Read Amara\'s break-time story with your partner. Underline the words that help you explain your answer.';

function storySignals(items, design, unitId) {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const lesson = slideOf(items, 'Amara at break time');
    if (unitId) lesson.slides[0].designUnitId = unitId;
    const lessonPath = writeLesson(root, lesson);
    if (design) fs.writeFileSync(path.join(root, 'lesson-design.json'), JSON.stringify(design));
    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });
    return messages(result).filter((entry) => entry.signal === 'INSTRUCTION_ABOVE_ITS_STORY');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('an instruction above the story it is about is sent back, naming both cards', () => {
  const found = storySignals([
    { type: 'text', value: HOW_TO, signal: 'pencil' },
    { type: 'text', value: STORY, color: 'ED7D31' },
    { type: 'text', value: 'Could Amara still need support?', colorRole: 'focus-blue' }
  ]);
  assert.equal(found.length, 1);
  assert.ok(found[0].message.includes('"Read Amara\'s break-time story with your partner.'), found[0].message);
  assert.ok(found[0].message.includes('the story or case first'), found[0].message);
});

test('the story first, then the question, then how to go about it, passes', () => {
  assert.equal(storySignals([
    { type: 'text', value: STORY, color: 'ED7D31' },
    { type: 'text', value: 'Could Amara still need support?', colorRole: 'focus-blue' },
    { type: 'text', value: HOW_TO, signal: 'pencil' }
  ]).length, 0);
});

test('a signed question above the case is not an instruction, and a slide with no case is left alone', () => {
  assert.equal(storySignals([
    { type: 'text', value: 'What could Amara do next?', colorRole: 'focus-blue', signal: 'talk' },
    { type: 'text', value: STORY, color: 'ED7D31' }
  ]).length, 0);
  assert.equal(storySignals([
    { type: 'text', value: HOW_TO, signal: 'pencil' },
    { type: 'text', value: 'Smiling does not always mean someone is fine.' }
  ]).length, 0);
});

test('a story left black is still known from the lesson design beside the deck', () => {
  const unitId = 'lesson-section/teaching-sequence/unit-002';
  const design = { teachingSequence: [{
    sourceUnitId: unitId,
    pupilInstruction: HOW_TO,
    content: { task: `${STORY}\n\nCould Amara still need support?` }
  }] };
  const items = [
    { type: 'text', value: HOW_TO, signal: 'pencil' },
    { type: 'text', value: STORY }
  ];
  assert.equal(storySignals(items, design, unitId).length, 1);
  assert.equal(storySignals(items, null, unitId).length, 0);
});

// The criteria are on the board from the first slide the class works from
// (the teacher, 16 October 2026): Tuesday's first exchange was written down
// with its counters and no criteria, which arrived two slides later.
function unitSlide(title, interaction, withCriteria) {
  return {
    template: 'body-full',
    title,
    designUnitId: 'lesson-section/teaching-sequence/unit-002',
    representationRefs: interaction ? [{ ref: 'rep-001', configuration: 'decide', interaction }] : [],
    ...(withCriteria ? { successCriteriaRefs: ['sc-001'] } : {}),
    body: {
      type: 'stack',
      items: [
        { type: 'text', value: '4,352 - 1,218' },
        ...(withCriteria ? [{ type: 'sc-panel', content: { type: 'steps', steps: ['Start with the ones.'] } }] : [])
      ]
    }
  };
}

test('criteria that arrive after the class has started working are refused', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const run = (slides) => runSlideDesignCheck(
      writeLesson(root, { ...ordinaryLesson(), slides }),
      { buildPath: fakeBuilder }
    );
    for (const interaction of ['teacher-completes', 'pupil-uses', 'pupil-writes-on']) {
      const late = run([unitSlide('My Turn', interaction, false), unitSlide('My Turn', interaction, true)]);
      assert.equal(late.ok, false, interaction);
      assert.match(late.stdout, /"signal":"CRITERIA_AFTER_THE_WORK_STARTS"/);
    }
    // Criteria from the first working slide, a set-up slide before the work,
    // an answers slide, and a unit with no criteria on any slide all pass.
    for (const slides of [
      [unitSlide('My Turn', 'teacher-completes', true), unitSlide('My Turn', 'teacher-completes', true)],
      [unitSlide('A story first', 'view', false), unitSlide('My Turn', 'teacher-completes', true)],
      [unitSlide('Answers', 'teacher-completes', false), unitSlide('My Turn', 'teacher-completes', true)],
      [unitSlide('My Turn', 'teacher-completes', false), unitSlide('My Turn', 'teacher-completes', false)]
    ]) {
      assert.doesNotMatch(run(slides).stdout, /CRITERIA_AFTER_THE_WORK_STARTS/, slides[0].title);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// A task in words is work too. Every sound deck of 17 October 2026, two made on
// Claude and two on Codex, ran its explanation as case, strong-and-weak model,
// partner talk, writing, and drew the criteria only on the writing slide; the
// check read only figures, so all four passed. One Codex deck also named the
// criteria on every slide in `successCriteriaRefs` while drawing them on none
// before the writing, and the check took the names for the panel.
function wordSlide(title, items, extra) {
  return {
    template: 'body-full',
    title,
    designUnitId: 'lesson-section/teaching-sequence/unit-006',
    body: { type: 'stack', items },
    ...(extra || {})
  };
}
const CRITERIA_PANEL = { type: 'sc-panel', content: { type: 'steps', steps: ['Say what moves.', 'Say why it stops.'] } };
const theCase = () => wordSlide('Explain the buzzing ruler', [{ type: 'text', value: 'The ruler buzzes, then stops.' }]);
const theModel = (withCriteria) => ({
  template: 'strong-and-weak',
  title: 'Explain the buzzing ruler',
  designUnitId: 'lesson-section/teaching-sequence/unit-006',
  strongHeading: 'An explanation',
  weakHeading: 'Not enough yet',
  strong: { type: 'text', value: 'Its free end moves back and forth, so it buzzes.' },
  weak: { type: 'text', value: 'The ruler moves.' },
  ...(withCriteria ? { criteria: CRITERIA_PANEL } : {})
});
const theTalk = (withCriteria) => wordSlide('Explain the buzzing ruler', [
  { type: 'text', value: 'Tell your partner how the ruler makes its sound.', signal: 'talk' },
  ...(withCriteria ? [CRITERIA_PANEL] : [])
]);
const theWriting = () => wordSlide('Explain the buzzing ruler', [
  { type: 'text', value: 'Explain how the ruler makes a sound.', signal: 'pencil' },
  CRITERIA_PANEL
]);

test('criteria that arrive after a task in words has started are refused', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';
`);
    const run = (slides) => runSlideDesignCheck(
      writeLesson(root, { ...ordinaryLesson(), slides }),
      { buildPath: fakeBuilder }
    );
    const refused = (slides, why) => {
      const result = run(slides);
      assert.equal(result.ok, false, why);
      assert.match(result.stdout, /"signal":"CRITERIA_AFTER_THE_WORK_STARTS"/, why);
    };
    // The sound decks' shape: talk before the criteria.
    refused([theCase(), theModel(false), theTalk(false), theWriting()], 'partner talk before the criteria');
    // A slide that names its criteria but draws none has not shown them.
    refused([theCase(), { ...theTalk(false), successCriteriaRefs: ['sc-001'] }, theWriting()],
      'criteria named in successCriteriaRefs but not drawn');
    // A Do sign, a tick to mark, and a My Turn are working slides too.
    refused([{ ...theCase(), doSign: 'quick' }, theWriting()], 'a Do beat before the criteria');
    refused([wordSlide('Mark it', [{ type: 'text', value: 'Tick each part it has.', signal: 'tick' }]), theWriting()],
      'marking before the criteria');
    refused([wordSlide('My Turn', [{ type: 'text', value: 'Watch me explain the bell.' }]), theWriting()],
      'a modelled turn before the criteria');

    // Passing shapes: criteria from the talk on; criteria beside the model;
    // a long model that goes without, with the talk carrying them; the case
    // and a look-closely slide before the work; a unit with no criteria.
    for (const [slides, why] of [
      [[theCase(), theModel(false), theTalk(true), theWriting()], 'criteria from the partner talk'],
      [[theCase(), theModel(true), theTalk(true), theWriting()], 'criteria beside the model as well'],
      [[theCase(), wordSlide('Look closely', [{ type: 'text', value: 'Look at the ruler.', signal: 'magnifier' }]), theWriting()],
        'a look-closely slide before the work'],
      [[theCase(), theModel(false), theTalk(false)], 'a unit that draws no criteria anywhere']
    ]) {
      assert.doesNotMatch(run(slides).stdout, /CRITERIA_AFTER_THE_WORK_STARTS/, why);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
