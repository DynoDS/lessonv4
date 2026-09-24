"""Success criteria (4.2.288), the third check's findings 1, 3 and 5, in the
worksheet engine.

1. Panels were found early only on "auto" sheets; a named-layout sheet's panel
   waited for checkWorksheet, which never runs when another sheet fails to lay
   out (lesson 15's Expected sheet). Every sheet's panels are now found before
   any shape is chosen, in the preflight and the build.
3. The list refusal's two branches overlap in a skill lesson, where the
   method's steps are the criteria; "otherwise" makes the criteria branch win.
   The comment above it no longer names `steps` as the home of a method list.
5. A row or stack that was already empty is left alone (only one a panel
   emptied goes); a panel held on its own in a slot is still measured, and the
   preflight says so rather than claiming it measured the page without it; the
   preflight no longer names a panel twice.
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


OLD_BLOCK = '''// Criteria panels on "auto" sheets, found before a shape is chosen. Left in,
// a panel is priced as content: the fit report asks for a real question to be
// cut to make room for it, and a last-resort build can drop the whole sheet
// over it, when the next pass refuses the panel anyway (success criteria stay
// on the board; the teacher, 23 September 2026). A named layout's panel is
// reported by checkWorksheet, which runs on the sheet as written.
function autoSheetCriteriaPanels(worksheet) {
  const found = [];
  const sheets = (worksheet && worksheet.sheets) || {};
  for (const [key, sheet] of Object.entries(sheets)) {
    if (!sheet || sheet.layout !== "auto") continue;
    for (const where of criteriaPanelsOn({ zones: sheet.zones })) {
      found.push({
        sheet: key,
        label: SHEET_LABELS[key] || key,
        where: where.replace(/^sheet\\./, ""),
      });
    }
  }
  return found;
}

function withoutPanels(node) {
  if (Array.isArray(node)) {
    return node
      .filter((item) => !(item && NOT_ON_SHEETS.has(item.helper)))
      .map(withoutPanels)
      .filter((item) => !isEmptyGroup(item));
  }
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) out[key] = withoutPanels(value);
  return out;
}

// A row or stack that held nothing but panels goes with them.
function isEmptyGroup(item) {
  return Boolean(item) && typeof item === "object" && !item.helper &&
    ["row", "stack"].some((key) => Array.isArray(item[key]) && item[key].length === 0);
}

// The same worksheet with those panels taken off, so the preflight measures
// each auto sheet as it will be once the designer has removed them.
function withoutAutoSheetCriteriaPanels(worksheet) {
  if (!autoSheetCriteriaPanels(worksheet).length) return worksheet;
  const sheets = {};
  for (const [key, sheet] of Object.entries(worksheet.sheets)) {
    sheets[key] =
      sheet && sheet.layout === "auto" ? { ...sheet, zones: withoutPanels(sheet.zones) } : sheet;
  }
  return { ...worksheet, sheets };
}
'''

NEW_BLOCK = '''// Criteria panels on every sheet, found before any shape is chosen. Left in,
// a panel is priced as content: the fit report asks for a real question to be
// cut to make room for it, and a last-resort build can drop a sheet, or refuse
// the pack, over a panel that is refused anyway (success criteria stay on the
// board; the teacher, 23 September 2026). Named layouts too: their sheets are
// checked only after every auto sheet has a shape, which another sheet's
// failure can stop (lesson 15's Expected sheet was never told of its two).
function sheetCriteriaPanels(worksheet) {
  const found = [];
  const sheets = (worksheet && worksheet.sheets) || {};
  for (const [key, sheet] of Object.entries(sheets)) {
    if (!sheet || typeof sheet !== "object") continue;
    for (const where of criteriaPanelsOn(sheet)) {
      found.push({
        sheet: key,
        label: SHEET_LABELS[key] || key,
        where: where.replace(/^sheet\\./, ""),
      });
    }
  }
  return found;
}

// A panel in a list (a stack, a row, an auto sheet's zones) comes off. A row or
// stack the panels leave empty goes with them; one that was empty already stays.
function withoutPanels(node) {
  if (Array.isArray(node)) {
    const out = [];
    for (const item of node) {
      if (item && NOT_ON_SHEETS.has(item.helper)) continue;
      const cleaned = withoutPanels(item);
      if (isEmptyGroup(cleaned) && !isEmptyGroup(item)) continue;
      out.push(cleaned);
    }
    return out;
  }
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) out[key] = withoutPanels(value);
  return out;
}

function isEmptyGroup(item) {
  return Boolean(item) && typeof item === "object" && !item.helper &&
    ["row", "stack"].some((key) => Array.isArray(item[key]) && item[key].length === 0);
}

// The same worksheet with the panels that can come off removed, so the
// preflight measures each sheet as it will be once the designer has taken them
// off. A panel held on its own in a slot (a repeat's stack, one side of a pair,
// a named zone that is only the panel) stays, and is measured.
function withoutSheetCriteriaPanels(worksheet) {
  if (!sheetCriteriaPanels(worksheet).length) return worksheet;
  const sheets = {};
  for (const [key, sheet] of Object.entries(worksheet.sheets)) {
    sheets[key] = sheet && typeof sheet === "object" ? withoutPanels(sheet) : sheet;
  }
  return { ...worksheet, sheets };
}
'''

patch("src/worksheet.js", [
    (OLD_BLOCK, NEW_BLOCK),
    ("  autoSheetCriteriaPanels,\n  withoutAutoSheetCriteriaPanels,\n",
     "  sheetCriteriaPanels,\n  withoutSheetCriteriaPanels,\n"),
])

MSG = ("CRITERIA_NOT_ON_SHEETS, a success-criteria (steps) panel. Success criteria stay "
       "on the board and are never printed on a worksheet; take the panel off the sheet.")

patch("scripts/check-worksheet.js", [
    ("  autoSheetCriteriaPanels,\n  withoutAutoSheetCriteriaPanels,\n",
     "  sheetCriteriaPanels,\n  withoutSheetCriteriaPanels,\n"),
    ("    // A criteria panel on an auto sheet is named before the shape is chosen,\n"
     "    // and the page is then measured without it: priced as content, it would\n"
     "    // ask for a real question to be cut to make room for a panel the build\n"
     "    // refuses anyway.\n"
     "    for (const found of autoSheetCriteriaPanels(worksheet)) {\n"
     "      fail(\n"
     "        \"ZONE_SPEC_INVALID\",\n"
     "        `${found.label} - ${found.where}: " + MSG + " ` +\n"
     "          \"The page below is measured without it.\"\n"
     "      );\n"
     "    }\n"
     "    worksheet = withoutAutoSheetCriteriaPanels(worksheet);\n",
     "    // Every criteria panel, on every sheet, is named before any shape is\n"
     "    // chosen, and each page is then measured without the panels that can come\n"
     "    // off: priced as content, a panel would ask for a real question to be cut\n"
     "    // to make room for it, and a sheet laid out by the engine that fails would\n"
     "    // stop this check before a named sheet's panel was ever mentioned.\n"
     "    const panelsFound = sheetCriteriaPanels(worksheet);\n"
     "    const withoutTheirPanels = withoutSheetCriteriaPanels(worksheet);\n"
     "    const stillOn = new Set(sheetCriteriaPanels(withoutTheirPanels).map((found) => found.sheet));\n"
     "    for (const found of panelsFound) {\n"
     "      fail(\n"
     "        \"ZONE_SPEC_INVALID\",\n"
     "        `${found.label} - ${found.where}: " + MSG + " ` +\n"
     "          (stillOn.has(found.sheet)\n"
     "            ? \"The page below is measured without the panels that can come off; one held on its own in a slot is still measured.\"\n"
     "            : \"The page below is measured without it.\")\n"
     "      );\n"
     "    }\n"
     "    worksheet = withoutTheirPanels;\n"),
    ("        for (const problem of sheet.badZones) {\n"
     "          fail(\"ZONE_SPEC_INVALID\", `${sheet.label} - ${problem}`);\n"
     "        }\n",
     "        for (const problem of sheet.badZones) {\n"
     "          // Every panel was named above, before any shape was chosen.\n"
     "          if (panelsFound.length && /CRITERIA_NOT_ON_SHEETS/.test(problem)) continue;\n"
     "          fail(\"ZONE_SPEC_INVALID\", `${sheet.label} - ${problem}`);\n"
     "        }\n"),
])

patch("scripts/build-worksheet.js", [
    ("  autoSheetCriteriaPanels,\n", "  sheetCriteriaPanels,\n"),
    ("  // A criteria panel is refused before any shape is chosen, so a sheet is\n"
     "  // never omitted for the room a refused panel took (success criteria stay on\n"
     "  // the board; the teacher, 23 September 2026).\n"
     "  const panels = autoSheetCriteriaPanels(worksheet);\n",
     "  // A criteria panel on any sheet is refused before any shape is chosen, so a\n"
     "  // sheet is never omitted for the room a refused panel took, and the pack is\n"
     "  // never refused over a panel only after a sheet has been dropped (success\n"
     "  // criteria stay on the board; the teacher, 23 September 2026). A panel still\n"
     "  // on a sheet at the last resort refuses the pack: the flag rescues a page too\n"
     "  // small and nothing else.\n"
     "  const panels = sheetCriteriaPanels(worksheet);\n"),
])

patch("src/helpers/text.js", [
    ("//   \"Use these steps to help you. / Read the question: 10s or 100s? / Find the\n"
     "//    10s each side. / ...\"        the lesson's method, which is `steps`\n",
     "//   \"Use these steps to help you. / Read the question: 10s or 100s? / Find the\n"
     "//    10s each side. / ...\"        the lesson's success criteria, which stay on\n"
     "//                                  the board (23 September 2026)\n"),
    ("      'board and are never printed on a worksheet. If they are steps a child ' +\n",
     "      'board and are never printed on a worksheet. Otherwise, if they are steps a child ' +\n"),
])
