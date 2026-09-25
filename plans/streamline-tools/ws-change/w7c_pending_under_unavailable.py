"""The worksheets release (4.2.290), step 8c: the preflight's pending-picture
advisory stops promising a picture the run will never publish.

Settled item f, his 2 September review: "may re-point a dead reference at a
published picture, never replace it with a sentence saying what it showed".
The worksheet designer's step 1 now tells it, under `PICTURE_STAGE:
unavailable`, to re-point each affected question at a published picture or an
engine drawing, or return the sheet. The preflight still told the same
designer, for every approved picture not yet on disk, "That is the normal state
at design time ... The build waits for the real file", which under
`unavailable` is untrue and is how the 18 September run designed to filenames
that never arrived. With `--picture-stage` naming `unavailable` the advisory
now says what the designer's own step says. Advisory only, as before: no exit
code changes, and a test holds both wordings."""
from _patch import ROOT, replace_once

CHECK = "worksheet-html/scripts/check-worksheet.js"

replace_once(
    CHECK,
    "    const pendingPaths = new Set(pending.map((entry) => entry.imagePath));\n"
    "    if (pendingPaths.size) {\n"
    "      for (const entry of pending) {\n"
    "        console.warn(\n"
    "          `[pending-picture] \"${entry.imagePath}\" is an approved request that has ` +\n"
    "            `not been published yet. That is the normal state at design time, ` +\n"
    "            `because promotion reads this spec to decide which pictures to source. ` +\n"
    "            `The build waits for the real file.`\n"
    "        );\n"
    "      }\n"
    "    }\n",
    "    const pendingPaths = new Set(pending.map((entry) => entry.imagePath));\n"
    "    const stageUnavailable = /\\bunavailable\\b/i.test(pictureStageArg || \"\");\n"
    "    if (pendingPaths.size) {\n"
    "      for (const entry of pending) {\n"
    "        console.warn(\n"
    "          stageUnavailable\n"
    "            ? `[pending-picture] \"${entry.imagePath}\" is an approved request, but ` +\n"
    "                `the picture stage was unavailable, so it will never be published. ` +\n"
    "                `Re-point the question at a picture this run has published or a ` +\n"
    "                `drawing the engine makes, never at words; if neither can carry it, ` +\n"
    "                `return the sheet to its owner with its WORKSHEET_CONTENT_GAP note and ` +\n"
    "                `its \"returned\" entry (the worksheet designer's step 1).`\n"
    "            : `[pending-picture] \"${entry.imagePath}\" is an approved request that has ` +\n"
    "                `not been published yet. That is the normal state at design time, ` +\n"
    "                `because promotion reads this spec to decide which pictures to source. ` +\n"
    "                `The build waits for the real file.`\n"
    "        );\n"
    "      }\n"
    "    }\n",
)

PENDING_TESTS = r'''

// The worksheets topic's settled item f (4.2.290): under an unavailable
// picture stage the advisory must not promise a picture that never comes.
test("under an unavailable picture stage the pending advisory says the picture will never come", () => {
  const contract = { photos: [{ id: "adaptation-photo-001", filename: "ai/river-meander.png" }] };
  const runWith = (stage) => {
    const { dir, spec } = setup();
    const specPath = path.join(dir, "worksheet.json");
    fs.writeFileSync(specPath, JSON.stringify(spec));
    const contractPath = path.join(dir, "contract.json");
    fs.writeFileSync(contractPath, JSON.stringify(contract));
    return spawnSync("node", [CHECK, specPath, "--photo-requirements", contractPath, "--picture-stage", stage], {
      encoding: "utf8",
    });
  };
  const attempting = runWith("PICTURE_STAGE: attempting 1 pictures");
  assert.match(attempting.stderr, /The build waits for the real file\./);
  const unavailable = runWith("PICTURE_STAGE: unavailable - PICTURE_ASSIGNMENTS_FAILED");
  assert.match(unavailable.stderr, /will never be published/);
  assert.doesNotMatch(unavailable.stderr, /The build waits for the real file/);
  assert.strictEqual(unavailable.status, attempting.status, "advisory only: the exit code does not change");
});
'''
path = ROOT / "worksheet-html" / "test" / "pending-pictures.test.js"
text = path.read_text(encoding="utf-8")
assert "under an unavailable picture stage the pending advisory" not in text
path.write_text(text.rstrip("\n") + "\n" + PENDING_TESTS, encoding="utf-8")
print("pending-picture advisory follows the picture stage, with its test")
