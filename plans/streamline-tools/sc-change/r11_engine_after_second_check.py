"""Success criteria (4.2.288), the second check's findings 1 and 2, in the
worksheet engine.

1. Decision 8 is "no success criteria on worksheets", in his words. The
   instruction refusal and the render comment still spoke of a method's steps
   too; they now say criteria, and send a method's steps a child works through
   to where the instructions already put them (with their question, one per
   line, or `method-frame`). Whether a method's steps belong on a sheet at all
   is the worksheets topic's open decision 10; this neither widens nor settles it.
2. A criteria panel on an "auto" sheet was priced as content before the check
   that refuses it ran, so the preflight could ask for a question to be cut to
   make room for it, and a last-resort build could drop the sheet over it. It is
   now found before a shape is chosen: the preflight names it and measures the
   page without it; the build refuses it and never omits a sheet for it.
"""
from pathlib import Path

WS = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\worksheet-html")


def patch(rel: str, pairs) -> None:
    path = WS / rel
    raw = path.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    t = raw.replace("\r\n", "\n")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, t.count(old), old[:100])
        t = t.replace(old, new)
    if crlf:
        t = t.replace("\n", "\r\n")
    path.write_bytes(t.encode("utf-8"))
    print("patched", rel)


patch("src/helpers/text.js", [
    ("      'are the lesson\\'s success criteria or the steps of its method, leave them ' +\n"
     "      'off: they stay on the board and are never printed on a worksheet. ' +\n",
     "      'are the lesson\\'s success criteria, leave them off: they stay on the ' +\n"
     "      'board and are never printed on a worksheet. If they are steps a child ' +\n"
     "      'works through to reach the answer, they are part of its question: put ' +\n"
     "      'them with it, one to a line, or in maths use \"method-frame\". ' +\n"),
])

patch("src/render.js", [
    ("// Success criteria, and a method's steps, stay on the board. The teacher does\n"
     "// not want them on any worksheet (23 September 2026: \"I don't want any success\n"
     "// criteria on worksheets.\"), so a sheet carrying the steps panel is refused\n",
     "// Success criteria stay on the board. The teacher does not want them on any\n"
     "// worksheet (23 September 2026: \"I don't want any success criteria on\n"
     "// worksheets.\"), so a sheet carrying the criteria (steps) panel is refused\n"),
])

patch("src/worksheet.js", [
    ("const { checkFit, criteriaPanelsOn } = require(\"./render\");\n",
     "const { checkFit, criteriaPanelsOn, NOT_ON_SHEETS } = require(\"./render\");\n"),
    ("// Every auto sheet in a worksheet resolved at once, with the choices reported\n",
     "// Criteria panels on \"auto\" sheets, found before a shape is chosen. Left in,\n"
     "// a panel is priced as content: the fit report asks for a real question to be\n"
     "// cut to make room for it, and a last-resort build can drop the whole sheet\n"
     "// over it, when the next pass refuses the panel anyway (success criteria stay\n"
     "// on the board; the teacher, 23 September 2026). A named layout's panel is\n"
     "// reported by checkWorksheet, which runs on the sheet as written.\n"
     "function autoSheetCriteriaPanels(worksheet) {\n"
     "  const found = [];\n"
     "  const sheets = (worksheet && worksheet.sheets) || {};\n"
     "  for (const [key, sheet] of Object.entries(sheets)) {\n"
     "    if (!sheet || sheet.layout !== \"auto\") continue;\n"
     "    for (const where of criteriaPanelsOn({ zones: sheet.zones })) {\n"
     "      found.push({\n"
     "        sheet: key,\n"
     "        label: SHEET_LABELS[key] || key,\n"
     "        where: where.replace(/^sheet\\./, \"\"),\n"
     "      });\n"
     "    }\n"
     "  }\n"
     "  return found;\n"
     "}\n"
     "\n"
     "function withoutPanels(node) {\n"
     "  if (Array.isArray(node)) {\n"
     "    return node\n"
     "      .filter((item) => !(item && NOT_ON_SHEETS.has(item.helper)))\n"
     "      .map(withoutPanels);\n"
     "  }\n"
     "  if (!node || typeof node !== \"object\") return node;\n"
     "  const out = {};\n"
     "  for (const [key, value] of Object.entries(node)) out[key] = withoutPanels(value);\n"
     "  return out;\n"
     "}\n"
     "\n"
     "// The same worksheet with those panels taken off, so the preflight measures\n"
     "// each auto sheet as it will be once the designer has removed them.\n"
     "function withoutAutoSheetCriteriaPanels(worksheet) {\n"
     "  if (!autoSheetCriteriaPanels(worksheet).length) return worksheet;\n"
     "  const sheets = {};\n"
     "  for (const [key, sheet] of Object.entries(worksheet.sheets)) {\n"
     "    sheets[key] =\n"
     "      sheet && sheet.layout === \"auto\" ? { ...sheet, zones: withoutPanels(sheet.zones) } : sheet;\n"
     "  }\n"
     "  return { ...worksheet, sheets };\n"
     "}\n"
     "\n"
     "// Every auto sheet in a worksheet resolved at once, with the choices reported\n"),
    ("  resolveAutoSheet,\n  resolveAutoLayouts,\n",
     "  resolveAutoSheet,\n  resolveAutoLayouts,\n  autoSheetCriteriaPanels,\n  withoutAutoSheetCriteriaPanels,\n"),
])

CRITERIA_MSG = (
    "CRITERIA_NOT_ON_SHEETS, a success-criteria (steps) panel. Success criteria stay "
    "on the board and are never printed on a worksheet; take the panel off the sheet."
)

patch("scripts/check-worksheet.js", [
    ("  resolveAutoLayouts,\n  sheetsOf,\n  WorksheetError,\n} = require(\"../src/worksheet\");\n",
     "  resolveAutoLayouts,\n  autoSheetCriteriaPanels,\n  withoutAutoSheetCriteriaPanels,\n"
     "  sheetsOf,\n  WorksheetError,\n} = require(\"../src/worksheet\");\n"),
    ("    // A sheet that said `\"layout\": \"auto\"` gets its shape here, the same way\n"
     "    // and at the same point the build gives it one, so this gate checks the\n"
     "    // exact page the build will draw.\n"
     "    const resolvedAuto = resolveAutoLayouts(worksheet);\n",
     "    // A criteria panel on an auto sheet is named before the shape is chosen,\n"
     "    // and the page is then measured without it: priced as content, it would\n"
     "    // ask for a real question to be cut to make room for a panel the build\n"
     "    // refuses anyway.\n"
     "    for (const found of autoSheetCriteriaPanels(worksheet)) {\n"
     "      fail(\n"
     "        \"ZONE_SPEC_INVALID\",\n"
     "        `${found.label} - ${found.where}: " + CRITERIA_MSG + " ` +\n"
     "          \"The page below is measured without it.\"\n"
     "      );\n"
     "    }\n"
     "    worksheet = withoutAutoSheetCriteriaPanels(worksheet);\n"
     "\n"
     "    // A sheet that said `\"layout\": \"auto\"` gets its shape here, the same way\n"
     "    // and at the same point the build gives it one, so this gate checks the\n"
     "    // exact page the build will draw.\n"
     "    const resolvedAuto = resolveAutoLayouts(worksheet);\n"),
])

patch("scripts/build-worksheet.js", [
    ("  resolveAutoLayouts,\n  WorksheetError,\n  SHEET_LABELS,\n} = require(\"../src/worksheet\");\n",
     "  resolveAutoLayouts,\n  autoSheetCriteriaPanels,\n  WorksheetError,\n  SHEET_LABELS,\n} = require(\"../src/worksheet\");\n"),
    ("  // One sheet comes out per pass, because the shapes are chosen per sheet and\n"
     "  // the next sheet's refusal is only visible once this one is gone.\n"
     "  const omitted = [];\n",
     "  // One sheet comes out per pass, because the shapes are chosen per sheet and\n"
     "  // the next sheet's refusal is only visible once this one is gone.\n"
     "  //\n"
     "  // A criteria panel is refused before any shape is chosen, so a sheet is\n"
     "  // never omitted for the room a refused panel took (success criteria stay on\n"
     "  // the board; the teacher, 23 September 2026).\n"
     "  const panels = autoSheetCriteriaPanels(worksheet);\n"
     "  if (panels.length) {\n"
     "    for (const found of panels) {\n"
     "      fail(\n"
     "        \"ZONE_SPEC_INVALID\",\n"
     "        `${found.label} - ${found.where}: " + CRITERIA_MSG + "`,\n"
     "        \"composition\",\n"
     "        { sheet: found.sheet, zone: zoneNameIn(found.where) }\n"
     "      );\n"
     "    }\n"
     "    return;\n"
     "  }\n"
     "  const omitted = [];\n"),
    ("function zoneNameIn(problem) {\n"
     "  const m = /zone \"([^\"]+)\"/.exec(String(problem));\n"
     "  return m ? m[1] : undefined;\n"
     "}\n",
     "function zoneNameIn(problem) {\n"
     "  const m = /zone \"([^\"]+)\"/.exec(String(problem)) || /\\bzones\\.([a-z])\\b/.exec(String(problem));\n"
     "  return m ? m[1] : undefined;\n"
     "}\n"),
])

patch("test/omit-unfittable.test.js", [
    ("test(\"a fault that is not about page fit still refuses everything\", () => {\n",
     "test(\"a criteria panel is refused before the fit, and never costs the pack a sheet\", () => {\n"
     "  // Success criteria stay on the board (the teacher, 23 September 2026). A\n"
     "  // panel on a sheet that cannot fit was priced as content, so the last-resort\n"
     "  // build dropped the whole sheet for it; the panel is now refused first.\n"
     "  const spec = specWithOneUnfittable();\n"
     "  spec.sheets.greaterDepth.zones.push({\n"
     "    helper: \"steps\",\n"
     "    items: [\"Compare the thousands.\", \"Same? Move right.\"],\n"
     "  });\n"
     "\n"
     "  const { stdout, files } = buildWith(spec, [\"--omit-unfittable\"]);\n"
     "  assert.match(stdout, /Greater Depth - zones\\[1\\]: CRITERIA_NOT_ON_SHEETS/);\n"
     "  assert.doesNotMatch(stdout, /SHEET_OMITTED/);\n"
     "  assert.deepEqual(files, []);\n"
     "});\n"
     "\n"
     "test(\"a fault that is not about page fit still refuses everything\", () => {\n"),
])
