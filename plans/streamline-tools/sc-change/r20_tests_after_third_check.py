"""Success criteria (4.2.288), the third check's findings 1 and 2: two tests.

- A sheet that fits only once its two panels (in a row of their own) come off:
  the preflight must measure it without them, and must not leave the emptied
  row behind (which printed "NaNmm"). Deleting either line of the repair fails it.
- A named-layout sheet with a panel beside an auto sheet that cannot fit: the
  preflight names the named sheet's panel, and the last-resort build refuses on
  the panel before it drops any sheet.
"""
from pathlib import Path

P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\worksheet-html\test\omit-unfittable.test.js")
raw = P.read_bytes().decode("utf-8")
crlf = "\r\n" in raw
t = raw.replace("\r\n", "\n")

old = 'test("a fault that is not about page fit still refuses everything", () => {\n'
new = r'''function preflight(spec) {
  const CHECK = path.join(__dirname, "..", "scripts", "check-worksheet.js");
  for (const sheet of Object.values(spec.sheets)) {
    sheet.recording = "sheet";
    sheet.recordingReason = "Q1: the child writes on the printed page.";
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worksheet-panel-"));
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  let stdout;
  try {
    stdout = execFileSync(process.execPath, [CHECK, specPath], { encoding: "utf8" });
  } catch (e) {
    stdout = String(e.stdout || e.message);
  }
  fs.rmSync(dir, { recursive: true, force: true });
  return stdout;
}

// Eight steps a panel, two panels in a row of their own under seventeen
// questions: the page holds the questions only once both panels are off, as
// lesson 15's Greater Depth sheet did with its two panels side by side.
const panel = () => ({
  helper: "steps",
  title: "Use these steps to help you.",
  steps: Array.from({ length: 8 }, (_, i) => `Step ${i + 1}: compare the digits in the next column along carefully.`),
});
const sheetThatFitsOnlyWithoutItsPanels = () => ({
  layout: "auto",
  zones: [
    {
      stack: [
        {
          question: true,
          helper: "questions",
          items: Array.from({ length: 17 }, (_, i) => `Write a number between -${i + 5} and -${i + 1}.`),
        },
        { row: [panel(), panel()] },
      ],
    },
  ],
});

test("the preflight measures a sheet without its panels, and leaves no empty row behind", () => {
  const spec = specWithOneUnfittable();
  spec.sheets.greaterDepth = sheetThatFitsOnlyWithoutItsPanels();
  const stdout = preflight(spec);
  assert.match(stdout, /Greater Depth - zones\[0\]\.stack\[1\]\.row\[0\]: CRITERIA_NOT_ON_SHEETS/);
  assert.match(stdout, /Greater Depth - zones\[0\]\.stack\[1\]\.row\[1\]: CRITERIA_NOT_ON_SHEETS/);
  assert.match(stdout, /AUTO_LAYOUT: Greater Depth/);
  assert.doesNotMatch(stdout, /SHEET_DOES_NOT_FIT/);
  assert.doesNotMatch(stdout, /NaN/);
});

test("a named sheet's panel is named even when another sheet cannot be laid out", () => {
  // Lesson 15: its Expected sheet (a named layout) carried two panels, and its
  // Greater Depth sheet could not be laid out, so the Expected panels were named
  // nowhere and the last-resort build refused the pack over them after dropping
  // Greater Depth.
  const spec = specWithOneUnfittable();
  spec.sheets.expected.zones.a = {
    stack: [spec.sheets.expected.zones.a, panel()],
  };
  const stdout = preflight(JSON.parse(JSON.stringify(spec)));
  assert.match(stdout, /Expected - zones\.a\.stack\[1\]: CRITERIA_NOT_ON_SHEETS/);

  const built = buildWith(spec, ["--omit-unfittable"]);
  assert.match(built.stdout, /Expected - zones\.a\.stack\[1\]: CRITERIA_NOT_ON_SHEETS/);
  assert.doesNotMatch(built.stdout, /SHEET_OMITTED/);
  assert.deepEqual(built.files, []);
});

''' + old
assert t.count(old) == 1
t = t.replace(old, new)
if crlf:
    t = t.replace("\n", "\r\n")
P.write_bytes(t.encode("utf-8"))
print("tests added")
