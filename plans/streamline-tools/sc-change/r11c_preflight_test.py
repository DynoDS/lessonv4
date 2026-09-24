"""r11 follow-up: a preflight test for an auto sheet carrying a criteria panel."""
from pathlib import Path

P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\worksheet-html\test\omit-unfittable.test.js")
raw = P.read_bytes().decode("utf-8")
crlf = "\r\n" in raw
t = raw.replace("\r\n", "\n")
old = "test(\"a fault that is not about page fit still refuses everything\", () => {\n"
new = ("test(\"the preflight names a panel on an auto sheet and measures the page without it\", () => {\n"
       "  const CHECK = path.join(__dirname, \"..\", \"scripts\", \"check-worksheet.js\");\n"
       "  const spec = specWithOneUnfittable();\n"
       "  spec.sheets.greaterDepth = {\n"
       "    layout: \"auto\",\n"
       "    zones: [\n"
       "      { question: true, helper: \"questions\", items: [\"Write a number between −5 and −1.\"] },\n"
       "      { helper: \"steps\", items: [\"Compare the thousands.\", \"Same? Move right.\"] },\n"
       "    ],\n"
       "  };\n"
       "  for (const sheet of Object.values(spec.sheets)) {\n"
       "    sheet.recording = \"sheet\";\n"
       "    sheet.recordingReason = \"Q1: the child writes on the printed page.\";\n"
       "  }\n"
       "  const dir = fs.mkdtempSync(path.join(os.tmpdir(), \"worksheet-panel-\"));\n"
       "  const specPath = path.join(dir, \"worksheet.json\");\n"
       "  fs.writeFileSync(specPath, JSON.stringify(spec));\n"
       "  let stdout;\n"
       "  try {\n"
       "    stdout = execFileSync(process.execPath, [CHECK, specPath], { encoding: \"utf8\" });\n"
       "  } catch (e) {\n"
       "    stdout = String(e.stdout || e.message);\n"
       "  }\n"
       "  fs.rmSync(dir, { recursive: true, force: true });\n"
       "  assert.match(stdout, /Greater Depth - zones\[1\]: CRITERIA_NOT_ON_SHEETS.*measured without it/);\n"
       "  assert.match(stdout, /AUTO_LAYOUT: Greater Depth/);\n"
       "  assert.doesNotMatch(stdout, /SHEET_DOES_NOT_FIT: Greater Depth/);\n"
       "  assert.doesNotMatch(stdout, /WORKSHEET_PREFLIGHT_OK/);\n"
       "});\n"
       "\n" + old)
assert t.count(old) == 1
t = t.replace(old, new)
if crlf:
    t = t.replace("\n", "\r\n")
P.write_bytes(t.encode("utf-8"))
print("ok")
