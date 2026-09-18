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
  // 2026). Blue is a question children answer; the task they act on is black.
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
