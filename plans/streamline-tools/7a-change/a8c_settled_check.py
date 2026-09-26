"""Release 7A (4.2.293), step 8c (added after the first check, its section 7):
a title slip never costs the deck its drawings.

The slide decorator runs the slide check on a settled deck, and the playbook
has the orchestrator run it again after. A wording, title or layout fault the
slide designer's round left (a slide titled only `Practise`, which 7A now
flags, or an untitled grid) failed that check too, so the decorator returned
`SLIDE_DECORATION_FAILED` and the whole deck lost its drawings. The check gains
`--settled`: on a settled deck the spec-only presentation faults are printed as
notes, because composition is closed to the decorator and they are not its to
mend, while a fault its own layer can cause (a picture drawn twice on a slide)
and anything the scratch build refuses still fail. The decorator's command and
the playbook's decorator success check pass the switch; the slide designer's own
check does not, so it is still sent back for every such fault. Tested."""
from _patch import CHECK, PB, read, replace_once, write

DECORATOR = "agents/slide-decorator.md"
TEST = "builder/test/slide-design-check.test.js"

# --- the check -------------------------------------------------------------------------

replace_once(CHECK, '''  const presentation = teachLayout
    .concat(launchPair)
    .concat(presentationWarnings(lesson))
    .concat(turnWarnings(lesson))
    .concat(consecutiveModellingWarnings(lesson))
    .concat(sharedModelWarnings(lesson))
    .concat(mixedBlockWarnings(lesson))
    .concat(blueStatementWarnings(lesson))
    .concat(taskBlueWarnings(lesson, jsonPath))
    .concat(starterColourWarnings(lesson))
    .concat(stickyEmphasisWarnings(lesson))
    .concat(pictureWarnings(lesson))
    .concat(repeatedLineWarnings(lesson));
''', '''  const pictures = pictureWarnings(lesson);
  const presentationAll = teachLayout
    .concat(launchPair)
    .concat(presentationWarnings(lesson))
    .concat(turnWarnings(lesson))
    .concat(consecutiveModellingWarnings(lesson))
    .concat(sharedModelWarnings(lesson))
    .concat(mixedBlockWarnings(lesson))
    .concat(blueStatementWarnings(lesson))
    .concat(taskBlueWarnings(lesson, jsonPath))
    .concat(starterColourWarnings(lesson))
    .concat(stickyEmphasisWarnings(lesson))
    .concat(pictures)
    .concat(repeatedLineWarnings(lesson));
  // A settled deck is checked by the slide decorator, and by the orchestrator
  // after it. Composition is closed to the decorator, so a wording, title or
  // layout fault the slide designer's round left is not its to mend, and
  // failing on one cost the whole deck its drawings (release 7A's first check:
  // a slide titled only "Practise"). With `settled`, those print as notes; a
  // fault the decorator's own layer can cause (a picture drawn twice on one
  // slide) and anything the scratch build refuses still fail.
  const presentation = options.settled
    ? presentationAll.filter((warning) => pictures.includes(warning))
    : presentationAll;
  const settledNotes = options.settled
    ? presentationAll
      .filter((warning) => !pictures.includes(warning))
      .map((warning) => `  note: slide ${warning.slide} ${warning.field}: ${warning.signal}: ${warning.message}`)
    : [];
''')
replace_once(CHECK, '''  outcome = withEarly(outcome);
  if (outcome && cueNotes.length) {''', '''  outcome = withEarly(outcome);
  if (outcome && settledNotes.length) {
    outcome.stderr =
      `\\n${settledNotes.length} note(s) on a settled deck, the slide designer's to mend and ` +
      `never a reason to withhold its drawings:\\n${settledNotes.join('\\n')}\\n${outcome.stderr || ''}`;
  }
  if (outcome && cueNotes.length) {''')
replace_once(CHECK, '''  const preview = argv.includes('--preview');
  const args = [];''', '''  const preview = argv.includes('--preview');
  const settled = argv.includes('--settled');
  const args = [];''')
replace_once(CHECK, '''    if (arg === '--preview') continue;
    if (arg === '--photo-requirements') {''', '''    if (arg === '--preview' || arg === '--settled') continue;
    if (arg === '--photo-requirements') {''')
replace_once(CHECK, """        '[--photo-requirements <photo-requirements.json>] [--preview]'""",
             """        '[--photo-requirements <photo-requirements.json>] [--preview] [--settled]'""")
replace_once(CHECK, '''  const result = runSlideDesignCheck(args[0], {
    retainPreview: preview,
    photoRequirementsPath,
  });''', '''  const result = runSlideDesignCheck(args[0], {
    retainPreview: preview,
    photoRequirementsPath,
    settled,
  });''')

# --- who passes the switch ---------------------------------------------------------------

replace_once(DECORATOR, '''  --preview \\
  --photo-requirements "[PHOTO_REQUIREMENTS_PATH]" \\
  "[WORKING_DIR]/lesson.json.tmp.[ATTEMPT_ID]"''', '''  --preview --settled \\
  --photo-requirements "[PHOTO_REQUIREMENTS_PATH]" \\
  "[WORKING_DIR]/lesson.json.tmp.[ATTEMPT_ID]"''')
replace_once(DECORATOR,
             "A settled deck passes; if it does not, the composition was not settled and the fault is not yours: return `SLIDE_DECORATION_FAILED` with every `BUILD_DIAGNOSTIC:` line verbatim and stop.",
             "A settled deck passes. `--settled` prints a wording, title or layout fault the designer's round left as a note, never a failure: it is not yours to mend, and it never costs the deck its drawings. If the check still fails, the composition was not settled and the fault is not yours: return `SLIDE_DECORATION_FAILED` with every `BUILD_DIAGNOSTIC:` line verbatim and stop.")
replace_once(PB, '''SUCCESS_CHECK:
node "[PLUGIN_ROOT]/builder/scripts/check-slide-design.js" \\
  "[WORKING_DIR]/lesson.json"

Require: SLIDE_DESIGN_CHECK_OK: [N] slides

"[PYTHON]" "[PLUGIN_ROOT]/scripts/check-optional-pictures.py" \\''', '''SUCCESS_CHECK:
node "[PLUGIN_ROOT]/builder/scripts/check-slide-design.js" \\
  "[WORKING_DIR]/lesson.json" --settled

Require: SLIDE_DESIGN_CHECK_OK: [N] slides

"[PYTHON]" "[PLUGIN_ROOT]/scripts/check-optional-pictures.py" \\''')

# --- the test ------------------------------------------------------------------------------

replace_once(TEST, '''test('a whole-blue block that tells and then asks blocks, and the scratch build still runs', () => {''', '''test('on a settled deck a title slip is a note, and never costs the drawings', () => {
  // Release 7A's first check: a bare "Practise" that survived the slide
  // designer's round failed the decorator's check too, and the whole deck lost
  // its drawings. The decorator and the orchestrator pass --settled; the
  // designer's own check does not, so it is still sent back.
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(
      root,
      `'use strict';\\n` +
        `const fs = require('node:fs');\\n` +
        `const path = require('node:path');\\n` +
        `const out = path.join(process.argv[3], 'Scratch Check.pptx');\\n` +
        `fs.writeFileSync(out, 'deck');\\n` +
        `console.log('Wrote: ' + out);\\n`
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

test('a whole-blue block that tells and then asks blocks, and the scratch build still runs', () => {''')
print("the settled check written")
