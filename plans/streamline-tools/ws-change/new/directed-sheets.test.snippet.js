
// ─── what can stand, 4.2.290 ─────────────────────────────────────────────
//
// The worksheets topic's decision 5, in the teacher's words: a sheet a child
// could not use "should probably go back to be redesigned", while the others
// are made. And its settled item f: a picture that will never arrive is not a
// picture that has not arrived yet. Each return is recorded in the spec's
// `returned` field, and the gate reads that, never the note's words: a
// teaching note may well mention the photograph. The gate still refuses the
// case it was built for, a picture excuse over a picture still coming.

const { spawnSync } = require("node:child_process");

function runBoth(dir, worksheet, extraArgs = []) {
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(worksheet));
  const result = spawnSync("node", [CHECK, specPath, ...extraArgs], { encoding: "utf8" });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

function withContract(dir, photos) {
  const adaptation = path.join(dir, "adaptation.md");
  fs.writeFileSync(adaptation, DIRECTIVE);
  const contract = path.join(dir, "photos.json");
  fs.writeFileSync(contract, JSON.stringify({ photos }));
  return ["--adaptation", adaptation, "--photo-requirements", contract];
}

function receipt(dir, filename, terminalState) {
  const folder = path.join(dir, "orchestration-receipts", "picture-terminal");
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(
    path.join(folder, `${filename.replace(/\W/g, "_")}.json`),
    JSON.stringify({ schemaVersion: 1, filename, terminalState })
  );
}

const PHOTOS = [
  { id: "adaptation-photo-001", filename: "a1.png" },
  { id: "adaptation-photo-002", filename: "a2.png" },
];

function returnedBelow(note, entry) {
  const spec = baseSpec();
  spec.notes = [note];
  spec.returned = [{ sheet: "below", ...entry }];
  return spec;
}

test("a Below sheet returned for its teaching stands, whatever its note mentions", () => {
  // Each of these was refused while the gate read the note's words.
  for (const note of [
    "WORKSHEET_CONTENT_GAP: Below - question 2 asks the child to choose a job without saying what a job means here; return to adaptation designer.",
    "WORKSHEET_CONTENT_GAP: Below - question 2 asks 'What is happening in the photograph?' and a Below child has nothing to act on; return to adaptation designer.",
    "WORKSHEET_CONTENT_GAP: Below - the answer given for the image question is wrong; return to adaptation designer.",
    "WORKSHEET_CONTENT_GAP: Below - question 3 on adaptation-photo-001 asks the child to name a part the adaptation never taught; return to adaptation designer.",
    "WORKSHEET_CONTENT_GAP: Below - find a job on the photocopy of the timetable is not something a child can do; return to adaptation designer.",
    "WORKSHEET_CONTENT_GAP: Below - the timeline visual the adaptation asks for has no helper that draws it; return to adaptation designer.",
  ]) {
    const dir = tmpDir();
    const result = runBoth(dir, returnedBelow(note, { problem: "teaching" }), withContract(dir, PHOTOS));
    assert.strictEqual(result.code, 0, note + "\n" + result.stdout);
    assert.ok(result.stdout.includes("WORKSHEET_PREFLIGHT_OK"), result.stdout);
    assert.ok(result.stderr.includes("the gap stands and goes back to its owner"), result.stderr);
  }
});

test("a picture still coming is refused, and the refusal never says to ship a sheet a child could not use", () => {
  const dir = tmpDir();
  const spec = returnedBelow(
    "WORKSHEET_CONTENT_GAP: Below - adaptation-photo-001 has not arrived; return to adaptation designer.",
    { problem: "picture", refs: ["adaptation-photo-001"] }
  );
  const result = runBoth(dir, spec, withContract(dir, PHOTOS));
  assert.notStrictEqual(result.code, 0);
  assert.ok(result.stdout.includes("CONTENT_GAP_UNFOUNDED"), result.stdout);
  assert.ok(result.stdout.includes("design it to the promised filenames"), result.stdout);
  // The third check: a teaching return is refused too while the sheet's own
  // pictures are coming, so the refusal no longer points there.
  assert.ok(result.stdout.includes("goes in its WORKSHEET_CONTENT_GAP note on the built sheet"), result.stdout);
  assert.ok(!result.stdout.includes('return it as "problem": "teaching"'), result.stdout);
});

test("a picture return naming no ref is refused while pictures may still come", () => {
  const dir = tmpDir();
  const spec = returnedBelow(
    "WORKSHEET_CONTENT_GAP: Below - its photographs have not arrived; return to adaptation designer.",
    { problem: "picture" }
  );
  const result = runBoth(dir, spec, withContract(dir, PHOTOS));
  assert.notStrictEqual(result.code, 0);
  assert.ok(result.stdout.includes("names no refs"), result.stdout);
  assert.ok(!/design the sheet\b/.test(result.stdout), result.stdout);
});

test("the designer's own return line stands under an unavailable picture stage", () => {
  // Step 1's line, exactly as the designer file prints it; under `unavailable`
  // nothing is coming, so it needs no ref.
  const dir = tmpDir();
  const spec = returnedBelow(
    "WORKSHEET_CONTENT_GAP: Below — required visual photograph of the circuit has no approved request; return to adaptation designer",
    { problem: "picture" }
  );
  const args = withContract(dir, PHOTOS);
  const result = runBoth(dir, spec, [...args, "--picture-stage", "PICTURE_STAGE: unavailable - PICTURE_ASSIGNMENTS_FAILED"]);
  assert.strictEqual(result.code, 0, result.stdout);
  assert.ok(result.stderr.includes("never publish"), result.stderr);
  const attempting = runBoth(dir, spec, [...args, "--picture-stage", "PICTURE_STAGE: attempting 4 pictures"]);
  assert.notStrictEqual(attempting.code, 0);
});

test("terminal receipts that say never let a picture return stand; a published or missing receipt refuses", () => {
  const spec = () =>
    returnedBelow(
      "WORKSHEET_CONTENT_GAP: Below - its two photographs will never arrive; return to adaptation designer.",
      { problem: "picture", refs: ["adaptation-photo-001", "adaptation-photo-002"] }
    );
  let dir = tmpDir();
  receipt(dir, "a1.png", "unsatisfied");
  receipt(dir, "a2.png", "omitted");
  let result = runBoth(dir, spec(), withContract(dir, PHOTOS));
  assert.strictEqual(result.code, 0, result.stdout);
  assert.ok(result.stderr.includes("will never arrive"), result.stderr);

  dir = tmpDir();
  receipt(dir, "a1.png", "unsatisfied");
  receipt(dir, "a2.png", "published");
  result = runBoth(dir, spec(), withContract(dir, PHOTOS));
  assert.ok(result.stdout.includes("CONTENT_GAP_UNFOUNDED"), result.stdout);

  dir = tmpDir();
  receipt(dir, "somewhere-else.png", "unsatisfied");
  receipt(dir, "a1.png", "unsatisfied");
  result = runBoth(dir, spec(), withContract(dir, PHOTOS));
  assert.ok(result.stdout.includes("CONTENT_GAP_UNFOUNDED"), result.stdout);
});

test("a return needs its record and its note", () => {
  let dir = tmpDir();
  const noteOnly = baseSpec();
  noteOnly.notes = ["WORKSHEET_CONTENT_GAP: Below - question 2 cannot be answered as printed; return to adaptation designer."];
  let result = runBoth(dir, noteOnly, withContract(dir, PHOTOS));
  assert.ok(result.stdout.includes("SHEET_DIRECTED_MISSING"), result.stdout);
  assert.ok(result.stdout.includes('"returned" entry'), result.stdout);

  dir = tmpDir();
  const recordOnly = baseSpec();
  recordOnly.returned = [{ sheet: "below", problem: "teaching" }];
  result = runBoth(dir, recordOnly, withContract(dir, PHOTOS));
  assert.ok(result.stdout.includes("SHEET_DIRECTED_MISSING"), result.stdout);
  assert.ok(result.stdout.includes("no WORKSHEET_CONTENT_GAP note names it"), result.stdout);

  dir = tmpDir();
  const bad = baseSpec();
  bad.returned = [{ sheet: "below", problem: "photo" }];
  result = runBoth(dir, bad);
  assert.ok(result.stdout.includes("RETURNED_INVALID"), result.stdout);
});

test("the Expected sheet sent back stops the worksheets with a message that fits the gap", () => {
  const dir = tmpDir();
  const spec = baseSpec();
  spec.sheets = { below: spec.sheets.expected };
  spec.answerKey = { below: spec.answerKey.expected };
  spec.notes = ["WORKSHEET_CONTENT_GAP: Expected - question 2 cannot be answered as printed; return to lesson designer."];
  spec.returned = [{ sheet: "expected", problem: "teaching" }];
  const result = runBoth(dir, spec);
  assert.notStrictEqual(result.code, 0);
  assert.ok(result.stdout.includes("EXPECTED_SHEET_MISSING"), result.stdout);
  assert.ok(result.stdout.includes("returned to the lesson designer"), result.stdout);
  assert.ok(!result.stdout.includes("fitPriority"), result.stdout);

  const present = baseSpec();
  present.returned = [{ sheet: "expected", problem: "teaching" }];
  const refused = runBoth(tmpDir(), present);
  assert.ok(refused.stdout.includes("RETURNED_INVALID"), refused.stdout);
});

test("a Below sheet a repair returns over a dead picture costs neither the other sheets nor the key", () => {
  // His answer (settled item f, and the first check's repair round): the
  // Below sheet goes back to the adaptation designer; the class still gets the
  // other sheets and their answer key, and (his answer of 25 September) the
  // Below children get the Expected sheet until a redesigned sheet replaces it.
  // The repair takes the Below sheet out whole, with its key section, and
  // records the return (the second check: a sheet left in the spec beside its
  // record would hide a redesign).
  const dir = tmpDir();
  const spec = baseSpec();
  spec.notes = [
    "WORKSHEET_CONTENT_GAP: Below - adaptation-photo-002 will never arrive and no published picture carries it; return to adaptation designer.",
  ];
  spec.returned = [{ sheet: "below", problem: "picture", refs: ["adaptation-photo-002"] }];
  receipt(dir, "photos/never.png", "unsatisfied");
  const args = withContract(dir, [{ id: "adaptation-photo-002", filename: "photos/never.png" }]);
  const checked = runBoth(dir, spec, args);
  assert.strictEqual(checked.code, 0, checked.stdout);
  assert.ok(checked.stderr.includes("[directed-sheets] Below sheet returned over adaptation-photo-002"), checked.stderr);

  const out = path.join(dir, "out");
  const built = spawnSync(
    "node",
    [path.join(__dirname, "..", "scripts", "build-worksheet.js"), path.join(dir, "worksheet.json"), out, "Grid refs"],
    { encoding: "utf8" }
  );
  assert.ok(built.stdout.includes("SHEET_STANDS_IN: Below - the Expected sheet stands in for Below"), built.stdout);
  assert.ok(!built.stdout.includes('BUILD_DIAGNOSTIC: {"signal":"SHEET_STANDS_IN"'), built.stdout);
  assert.ok(!built.stdout.includes("IMAGE_MISSING"), built.stdout);
  assert.ok(/^(Built: |PDF_SKIPPED)/m.test(built.stdout), built.stdout);
  const answers = fs.readdirSync(out).filter((name) => name.endsWith(".txt"));
  assert.strictEqual(answers.length, 1, fs.readdirSync(out).join(", "));
  const key = fs.readFileSync(path.join(out, answers[0]), "utf8");
  assert.ok(/^EXPECTED/m.test(key) && /^BELOW/m.test(key), key);
  assert.ok(key.includes("The Expected sheet stands in here for the Below sheet"), key);
});

test("a books sheet whose words look as if they need the page passes with a prompt to look again", () => {
  // Settled item o: the preflight prints the prompt and never refuses it; the
  // sheet saying it was looked at again quiets it.
  const dir = tmpDir();
  const spec = baseSpec();
  spec.sheets.expected.recording = "books";
  spec.sheets.expected.recordingReason = "Every answer is a word or a grid reference.";
  const prompted = runBoth(dir, spec);
  assert.strictEqual(prompted.code, 0, prompted.stdout);
  assert.ok(prompted.stderr.includes("RECORDING_LOOK_AGAIN"), prompted.stderr);
  assert.ok(prompted.stderr.includes("Complete the table"), prompted.stderr);
  spec.sheets.expected.recordingLookedAgain = true;
  const answered = runBoth(dir, spec);
  assert.strictEqual(answered.code, 0, answered.stdout);
  assert.ok(!answered.stderr.includes("RECORDING_LOOK_AGAIN"), answered.stderr);
});

// ─── the second check of the worksheets release (4.2.290) ─────────────────

test("a sheet in the spec beside its own record is measured, and the preflight says the record must come off", () => {
  const dir = tmpDir();
  const spec = baseSpec();
  spec.sheets.below = JSON.parse(JSON.stringify(spec.sheets.expected));
  spec.answerKey.below = JSON.parse(JSON.stringify(spec.answerKey.expected));
  spec.notes = ["WORKSHEET_CONTENT_GAP: Below - question 2 cannot be answered as printed; return to adaptation designer."];
  spec.returned = [{ sheet: "below", problem: "teaching" }];
  const result = runBoth(dir, spec, withContract(dir, PHOTOS));
  assert.notStrictEqual(result.code, 0, result.stdout);
  assert.ok(result.stdout.includes("RETURNED_INVALID: the spec holds the Below sheet and a \"returned\" entry for it"), result.stdout);
  assert.ok(result.stdout.includes("take the entry and its WORKSHEET_CONTENT_GAP note off"), result.stdout);
  assert.ok(!result.stdout.includes("WORKSHEET_PREFLIGHT_OK"), result.stdout);
});

test("the build prints a redesigned sheet left beside its record, and says the record is left on", () => {
  const dir = tmpDir();
  const spec = baseSpec();
  const redesign = JSON.parse(JSON.stringify(spec.sheets.expected));
  redesign.zones.a.row[1].items[0] = "REDESIGNED: give the four-figure grid reference for the mill.";
  spec.sheets.below = redesign;
  spec.answerKey.below = JSON.parse(JSON.stringify(spec.answerKey.expected));
  spec.notes = ["WORKSHEET_CONTENT_GAP: Below - question 2 cannot be answered as printed; return to adaptation designer."];
  spec.returned = [{ sheet: "below", problem: "teaching" }];
  fs.writeFileSync(path.join(dir, "worksheet.json"), JSON.stringify(spec));
  const out = path.join(dir, "out");
  const built = spawnSync(
    "node",
    [path.join(__dirname, "..", "scripts", "build-worksheet.js"), path.join(dir, "worksheet.json"), out, "Grid refs"],
    { encoding: "utf8" }
  );
  assert.strictEqual(built.status, 0, built.stdout + built.stderr);
  assert.match(built.stdout, /^RETURN_RECORD_LEFT: Below - /m);
  assert.ok(!built.stdout.includes("SHEET_STANDS_IN"), built.stdout);
  const below = fs.readFileSync(path.join(out, "Grid refs-below.html"), "utf8");
  assert.ok(below.includes("REDESIGNED: give the four-figure grid reference"), "the redesign is printed");
});

test("a record for a tier the adaptation does not direct is refused", () => {
  const dir = tmpDir();
  const adaptation = path.join(dir, "adaptation.md");
  fs.writeFileSync(adaptation, "## Below\n\nResource decision: Use Expected unchanged\n");
  const spec = baseSpec();
  spec.notes = ["WORKSHEET_CONTENT_GAP: Below - question 2 cannot be answered as printed; return to adaptation designer."];
  spec.returned = [{ sheet: "below", problem: "teaching" }];
  const result = runBoth(dir, spec, ["--adaptation", adaptation]);
  assert.notStrictEqual(result.code, 0, result.stdout);
  assert.ok(result.stdout.includes("RETURNED_INVALID: \"returned\" sends the Below sheet back, but the adaptation does not direct a separate Below sheet"), result.stdout);
});

// The 30 August loss, by the records: the Below sheet's own pictures are the
// adaptation's Photo refs for it, and the picture stage's receipts say whether
// they have arrived. The note is never read.
const OWN_PICTURES =
  "## Below\n\nResource decision: Generate separate Below adaptation\n\n" +
  "- Pupil prompt: Which food is a protein?\n- Photo refs: adaptation-photo-002\n";

function teachingReturn(dir, { receiptState, stage } = {}) {
  const adaptation = path.join(dir, "adaptation.md");
  fs.writeFileSync(adaptation, OWN_PICTURES);
  const contract = path.join(dir, "photos.json");
  fs.writeFileSync(contract, JSON.stringify({ photos: PHOTOS }));
  if (receiptState) receipt(dir, "a2.png", receiptState);
  const spec = returnedBelow(
    "WORKSHEET_CONTENT_GAP: Below - the Below sheet cannot be designed yet; return to adaptation designer.",
    { problem: "teaching" }
  );
  const args = ["--adaptation", adaptation, "--photo-requirements", contract];
  if (stage) args.push("--picture-stage", stage);
  return runBoth(dir, spec, args);
}

test("a teaching return is refused while the sheet's own pictures are still coming", () => {
  const refused = teachingReturn(tmpDir());
  assert.notStrictEqual(refused.code, 0, refused.stdout);
  assert.ok(refused.stdout.includes("CONTENT_GAP_UNFOUNDED: the Below sheet is returned while its own pictures (adaptation-photo-002"), refused.stdout);
  assert.ok(refused.stdout.includes("Design it to their promised filenames"), refused.stdout);
  assert.ok(!/ship|print it as it is/i.test(refused.stdout), refused.stdout);
});

test("a teaching return stands once the sheet's own pictures have arrived, will never arrive, or cannot come", () => {
  for (const state of ["published", "unsatisfied", "omitted"]) {
    const result = teachingReturn(tmpDir(), { receiptState: state });
    assert.strictEqual(result.code, 0, `${state}: ${result.stdout}`);
  }
  const unavailable = teachingReturn(tmpDir(), { stage: "PICTURE_STAGE: unavailable" });
  assert.strictEqual(unavailable.code, 0, unavailable.stdout);
  const attempting = teachingReturn(tmpDir(), { receiptState: "attempting" });
  assert.notStrictEqual(attempting.code, 0, attempting.stdout);
});

test("the build refuses a malformed record", () => {
  const dir = tmpDir();
  const spec = baseSpec();
  spec.returned = "below";
  fs.writeFileSync(path.join(dir, "worksheet.json"), JSON.stringify(spec));
  const built = spawnSync(
    "node",
    [path.join(__dirname, "..", "scripts", "build-worksheet.js"), path.join(dir, "worksheet.json"), path.join(dir, "out"), "Grid refs"],
    { encoding: "utf8" }
  );
  assert.notStrictEqual(built.status, 0, built.stdout);
  assert.match(built.stdout, /^RETURNED_INVALID: "returned" must be a list/m);
});

test("another tier's pictures do not hold a Below teaching return", () => {
  const dir = tmpDir();
  const adaptation = path.join(dir, "adaptation.md");
  fs.writeFileSync(
    adaptation,
    "## Greater Depth\n\nResource decision: Use Expected unchanged\n\n- Photo refs: adaptation-photo-002\n\n" +
      "## Below\n\nResource decision: Generate separate Below adaptation\n\n- Photo refs: None\n"
  );
  const contract = path.join(dir, "photos.json");
  fs.writeFileSync(contract, JSON.stringify({ photos: PHOTOS }));
  const spec = returnedBelow(
    "WORKSHEET_CONTENT_GAP: Below - question 2 cannot be answered as printed; return to adaptation designer.",
    { problem: "teaching" }
  );
  const result = runBoth(dir, spec, ["--adaptation", adaptation, "--photo-requirements", contract]);
  assert.strictEqual(result.code, 0, result.stdout);
});
