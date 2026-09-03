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

// The deck's third colour. Black is the teacher talking, blue is the child's job,
// purple is the sentence to keep, and the builder paints a sticky line purple off
// the back of its own star marker. An `emphasis` span stretched across the whole
// statement paints over that - a Year 4 PSHE deck ran its one sticky fact in
// problem red on two slides that way and finished with no purple anywhere
// (flagged by Daniel, 2 September 2026). A span *inside* the line is a different
// thing entirely and stays allowed.
test('an emphasis covering a whole sticky line is refused before the build', () => {
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
    assert.equal(fs.existsSync(builderMarker), false);
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

test('a turn slide with nothing to work on blocks before the scratch builder runs', () => {
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
    assert.equal(fs.existsSync(builderMarker), false);
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

test('two modelling slides in a row block before the scratch builder runs', () => {
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
    assert.equal(fs.existsSync(builderMarker), false);
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
