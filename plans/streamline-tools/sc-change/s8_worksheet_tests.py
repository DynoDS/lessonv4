"""Success criteria (4.2.288), decision 8: one list of the helpers the engine
keeps but never lets onto a sheet, read by the renderer, the catalogue, the
browser check and the tests; and a test that a sheet carrying the panel is
refused."""
from pathlib import Path

W = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\worksheet-html")


def patch(rel: str, pairs) -> None:
    path = W / rel
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", rel)


patch("src/render.js", [
    ("function criteriaPanelsOn(spec) {\n",
     "const NOT_ON_SHEETS = new Set([\"steps\"]);\n\nfunction criteriaPanelsOn(spec) {\n"),
    ("    if (node.helper === \"steps\") found.push(where);\n",
     "    if (NOT_ON_SHEETS.has(node.helper)) found.push(where);\n"),
    ("module.exports = {\n", "module.exports = {\n  NOT_ON_SHEETS,\n"),
])
patch("scripts/build-catalogue.js", [
    ("  // Helpers the engine keeps but never lets onto a sheet, so the designer is\n"
     "  // not offered them: the success-criteria panel stays on the board (the\n"
     "  // teacher, 23 September 2026).\n"
     "  const notOnSheets = new Set([\"steps\"]);\n",
     "  // Helpers the engine keeps but never lets onto a sheet, so the designer is\n"
     "  // not offered them: the success-criteria panel stays on the board (the\n"
     "  // teacher, 23 September 2026).\n"
     "  const notOnSheets = NOT_ON_SHEETS;\n"),
    ('const { helperNames, REGISTRY } = require("../src/helpers");\n',
     'const { helperNames, REGISTRY } = require("../src/helpers");\nconst { NOT_ON_SHEETS } = require("../src/render");\n'),
])
patch("scripts/check-render.js", [
    ('const { renderSheet, checkFit } = require("../src/render");\n',
     'const { renderSheet, checkFit, NOT_ON_SHEETS } = require("../src/render");\n'),
    ("  for (const name of helperNames()) {\n",
     "  for (const name of helperNames()) {\n"
     "    // Never on a sheet, so its height on a sheet is never needed.\n"
     "    if (NOT_ON_SHEETS.has(name)) continue;\n"),
])
patch("test/helpers.test.js", [
    ('  const { FAMILIES } = require("../scripts/build-catalogue");\n'
     "  const placed = FAMILIES.flatMap(([, list]) => list);\n",
     '  const { FAMILIES } = require("../scripts/build-catalogue");\n'
     '  const { NOT_ON_SHEETS } = require("../src/render");\n'
     "  // A helper the engine never lets onto a sheet is left out on purpose.\n"
     "  const placed = [...FAMILIES.flatMap(([, list]) => list), ...NOT_ON_SHEETS];\n"),
])
patch("test/doc-claims.test.js", [
    ('  const catalogue = fs.readFileSync(path.join(refDir, "worksheet-helpers", "catalogue.md"), "utf8");\n'
     "  const names = helperNames();\n",
     '  const catalogue = fs.readFileSync(path.join(refDir, "worksheet-helpers", "catalogue.md"), "utf8");\n'
     '  // A helper the engine never lets onto a sheet is not offered to the designer.\n'
     '  const { NOT_ON_SHEETS } = require("../src/render");\n'
     "  const names = helperNames().filter((n) => !NOT_ON_SHEETS.has(n));\n"),
])
patch("test/page-furniture.test.js", [
    ('  assert.throws(() => renderHelper(asList, 174), /"steps" helper/);\n',
     '  // Criteria and a method\'s steps stay on the board (4.2.288), so the\n'
     '  // refusal no longer sends them to the steps panel.\n'
     '  assert.throws(() => renderHelper(asList, 174), /never printed on a worksheet/);\n'),
    ('test("an instruction carrying a list is refused and told where the list belongs", () => {\n',
     'test("a sheet carrying a success-criteria panel is refused", () => {\n'
     '  // The teacher, 23 September 2026: "I don\'t want any success criteria on\n'
     '  // worksheets." The panel is kept for the board\'s colour marks, not for paper.\n'
     '  const { renderSheet } = require("../src/render");\n'
     '  const sheet = {\n'
     '    layout: "stack",\n'
     '    zones: { a: { stack: [\n'
     '      { helper: "questions", question: true, items: ["Round 2,748 to the nearest 100."] },\n'
     '      STEPS,\n'
     '    ] } },\n'
     '  };\n'
     '  assert.throws(() => renderSheet(sheet), /CRITERIA_NOT_ON_SHEETS/);\n'
     '});\n'
     '\n'
     'test("an instruction carrying a list is refused and told where the list belongs", () => {\n'),
])
