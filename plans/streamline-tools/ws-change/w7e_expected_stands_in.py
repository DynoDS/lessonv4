"""The worksheets release (4.2.290), step 8e: the Expected sheet stands in, run
after w7d.

His answer to the question the first check's repair round held for him (the
worksheets ledger, "Asked from the release's first check", 25 September 2026):
if a Below or Greater Depth sheet sent back to be redesigned still cannot be
made, those children get the Expected sheet in its place, flagged so he knows
("yes"). The lead passed it on for every Below or Greater Depth sheet the build
cannot make: at the last resort (`--omit-unfittable`), a page too small or any
other fault that sheet still has gets the Expected sheet in its place, flagged,
rather than costing all three sheets and the key (the second check's finding 3).
The one exception stays: an Expected sheet the page cannot hold is omitted, as
before, and then nothing stands in for another tier; an Expected sheet with any
other fault still refuses the pack, because the class's own sheet is never built
around.

w7d makes the build print the Expected sheet in a returned tier's place
(`src/returned.js`) and collects each stand-in with its reason. This script adds:

1. The answer key's section for such a tier is the Expected answers, under a
   line saying so and why (`src/worksheet.js`).
2. The last resort, before anything is drawn: each Below or Greater Depth sheet
   goes through every check the build makes, on its own (its pictures, a
   criteria panel, its shape, its answer-key section, what the page prints), and
   when it would be refused while the Expected sheet passes them all, the
   Expected sheet stands in. The Expected sheet is measured the same way, so a
   stand-in is never announced and then dropped (the second check's finding 5).
3. The last resort in the browser: a Below or Greater Depth sheet the browser
   finds clipped, when the Expected sheet printed clean, gets the Expected sheet
   in its place; its pages are drawn again and the key rewritten.
4. Each stand-in is named once the pack is built, on a `SHEET_STANDS_IN:` line: a
   flag for his report, never a fault for a repair round, so it carries no
   `BUILD_DIAGNOSTIC` (the second check's finding 9).
5. The run's script (`run-fixed-resource.py`) names every tier stood in for in
   its summary (`standInSheets`), each with its reason, and says
   `FIXED_RESOURCE_FLAGGED`, as it does for an omitted sheet; its help says what
   the last resort does.
6. The tests: `test/stand-in.test.js` (from `ws-change/new/`), the last-resort
   cases in `test/omit-unfittable.test.js`, and a run-script test.

The run's side (asking the adaptation designer first, rebuilding with its
redesign, reaching the last resort for faults other than page fit, carrying the
flag into the report) is the playbook's, and is named in the release report for
the playbook release rather than added here.
"""
from pathlib import Path

from _patch import ROOT, read, replace_once, write

HERE = Path(__file__).resolve().parent
BUILD = "worksheet-html/scripts/build-worksheet.js"
WORKSHEET = "worksheet-html/src/worksheet.js"
RUN = "scripts/run-fixed-resource.py"
RUN_TESTS = "scripts/tests/test_run_fixed_resource.py"
OMIT_TESTS = "worksheet-html/test/omit-unfittable.test.js"

# --- 1. the key says which tier the Expected sheet stands in for, and why ------
replace_once(
    WORKSHEET,
    "function renderAnswerKey(worksheet, answerKey = answerKeyOf(worksheet)) {\n",
    "// `stoodIn` maps each tier the Expected sheet stands in for to why, in words\n"
    "// the teacher reads under the heading (the sheet could not be used as printed,\n"
    "// its picture never arrived, the page could not hold it, or it could not be\n"
    "// built): its section is the Expected answers, and says so.\n"
    "function renderAnswerKey(worksheet, answerKey = answerKeyOf(worksheet), { stoodIn = {} } = {}) {\n",
)
replace_once(
    WORKSHEET,
    "    lines.push(heading.toUpperCase());\n"
    "    for (const entry of answerKey[name]) {\n",
    "    lines.push(heading.toUpperCase());\n"
    "    if (stoodIn[name]) {\n"
    "      lines.push(\n"
    "        `The Expected sheet stands in here for the ${SHEET_LABELS[name]} sheet, ${stoodIn[name]}. ` +\n"
    "          \"These are the Expected answers.\"\n"
    "      );\n"
    "    }\n"
    "    for (const entry of answerKey[name]) {\n",
)
replace_once(
    BUILD,
    '  fs.writeFileSync(answersPath, renderAnswerKey(worksheet, answerKey), "utf8");\n',
    '  fs.writeFileSync(answersPath, renderAnswerKey(worksheet, answerKey, { stoodIn: keyLines() }), "utf8");\n',
)

# --- 2. the last resort, before anything is drawn ---------------------------------
replace_once(
    BUILD,
    'const { describeReturn, returnedProblems, withExpectedStandingIn } = require("../src/returned");\n',
    "const {\n"
    "  STAND_IN_TIERS,\n"
    "  describeReturn,\n"
    "  returnedProblems,\n"
    "  withExpectedIn,\n"
    "  withExpectedStandingIn,\n"
    '} = require("../src/returned");\n',
)
replace_once(
    BUILD,
    "  const optionalVisuals = prepareWorksheetDecorations(back.worksheet, specDir);\n",
    "  const keyLines = () => Object.fromEntries([...standIns].map(([key, s]) => [key, s.keyLine]));\n"
    "\n"
    "  // The last resort (`--omit-unfittable`, passed only once a sheet's own repair\n"
    "  // round is over). His answer (25 September 2026) was for a Below or Greater\n"
    "  // Depth sheet sent back that still cannot be fixed: the Expected sheet in its\n"
    "  // place, flagged. The lead passed it on for any such sheet the build cannot\n"
    "  // make, for any reason: a page too small,\n"
    "  // a picture it cannot have, a panel, an answer key that does not match it, or\n"
    "  // any other fault the checks below refuse. So each such sheet is first put\n"
    "  // through every check the build makes before drawing, on its own, and when\n"
    "  // it would be refused while the Expected sheet passes them all, the Expected\n"
    "  // sheet stands in for that tier. Nothing stands in for the Expected sheet: one\n"
    "  // the page cannot hold is omitted below, as before, and then nothing stands\n"
    "  // in for another tier, since a copy of it would not fit either; one with any\n"
    "  // other fault still refuses the pack.\n"
    "  let packSpec = back.worksheet;\n"
    "  if (omitUnfittable && packSpec.sheets && packSpec.sheets.expected && !sheetFaults(packSpec, \"expected\", specDir).length) {\n"
    "    for (const key of STAND_IN_TIERS) {\n"
    "      if (!packSpec.sheets[key] || standIns.has(key)) continue;\n"
    "      const faults = sheetFaults(packSpec, key, specDir);\n"
    "      if (!faults.length) continue;\n"
    "      const label = sheetLabel(key);\n"
    "      const pageOnly = faults.every((fault) => fault.fit);\n"
    "      const first = faults[0].text + (faults.length > 1 ? ` (and ${faults.length - 1} more)` : \"\");\n"
    "      packSpec = withExpectedIn(packSpec, key);\n"
    "      standIns.set(key, {\n"
    "        keyLine: pageOnly ? \"which the page could not hold\" : \"which could not be built\",\n"
    "        why: pageOnly\n"
    "          ? `the page cannot hold the ${label} sheet (${first})`\n"
    "          : `the ${label} sheet cannot be built (${first})`,\n"
    "      });\n"
    "    }\n"
    "  }\n"
    "  const optionalVisuals = prepareWorksheetDecorations(packSpec, specDir);\n",
)
replace_once(
    BUILD,
    "  // last sheet standing is never omitted, because a pack with nothing in it is\n"
    "  // not a partial delivery.\n",
    "  // last sheet standing is never omitted, because a pack with nothing in it is\n"
    "  // not a partial delivery. A Below or Greater Depth sheet the build cannot make\n"
    "  // already has the Expected sheet in its place (above) whenever the Expected\n"
    "  // sheet passes every check, so what still comes out here is an Expected sheet\n"
    "  // the page cannot hold, and then any copy of it.\n",
)
replace_once(
    BUILD,
    "function sheetLabel(key) {\n",
    "// Every fault the build would refuse one sheet for, checked on its own and in\n"
    "// the order the build checks them: its pictures, a criteria panel, its shape,\n"
    "// its answer-key section, and what the page prints. `fit` marks a page too\n"
    "// small; the browser's own measure comes later, when the pages are drawn.\n"
    "function sheetFaults(worksheet, key, specDir) {\n"
    "  const label = sheetLabel(key);\n"
    "  const plain = (message) => {\n"
    "    const text = String(message);\n"
    "    return text.startsWith(`${label} - `) ? text.slice(label.length + 3) : text;\n"
    "  };\n"
    "  const one = { ...worksheet, sheets: { [key]: worksheet.sheets[key] } };\n"
    "  if (worksheet.answerKey) {\n"
    "    one.answerKey = worksheet.answerKey[key] === undefined ? {} : { [key]: worksheet.answerKey[key] };\n"
    "  }\n"
    "  try {\n"
    "    const problems = [];\n"
    "    let single = resolveImages(prepareWorksheetDecorations(one, specDir).worksheet, specDir, problems);\n"
    "    const pictures = unresolvedImages(single, problems);\n"
    "    if (pictures.length) return pictures.map((item) => ({ fit: false, text: `${item.signal}: ${item.message}` }));\n"
    "    const panels = sheetCriteriaPanels(single);\n"
    "    if (panels.length) return panels.map((found) => ({ fit: false, text: `CRITERIA_NOT_ON_SHEETS: ${found.where}` }));\n"
    "    single = resolveAutoLayouts(single).worksheet;\n"
    "    answerKeyOf(single);\n"
    "    const faults = [];\n"
    "    for (const sheet of checkWorksheet(single)) {\n"
    "      for (const problem of sheet.tooTight) faults.push({ fit: true, text: plain(problem) });\n"
    "      for (const problem of [\n"
    "        ...sheet.badZones,\n"
    "        ...sheet.wordBanks,\n"
    "        ...sheet.unprinted,\n"
    "        ...sheet.emptySets,\n"
    "        ...sheet.pupilWording,\n"
    "        ...sheet.labelIntent,\n"
    "      ]) {\n"
    "        faults.push({ fit: false, text: plain(problem) });\n"
    "      }\n"
    "    }\n"
    "    return faults;\n"
    "  } catch (e) {\n"
    "    if (!(e instanceof WorksheetError)) throw e;\n"
    "    return [{ fit: e.signal === \"SHEET_DOES_NOT_FIT\", text: `${e.signal}: ${plain(e.message)}` }];\n"
    "  }\n"
    "}\n"
    "\n"
    "// What the browser found wrong with a drawn page, in words.\n"
    "function clipDetail(problem) {\n"
    "  return problem.kind === \"zone-overflow\"\n"
    "    ? `rendered content overflows the zone (content ${problem.scrollHeight}px ` +\n"
    "        `tall in ${problem.clientHeight}px, ${problem.scrollWidth}px wide in ` +\n"
    "        `${problem.clientWidth}px)`\n"
    "    : problem.kind === \"child-outside-zone\"\n"
    "      ? \"rendered content reaches outside the zone and is cut by its edge\"\n"
    "      : problem.kind === \"child-spills-over-neighbour\"\n"
    "        ? `the box \"${problem.box}\" is drawing over what comes after it ` +\n"
    "          `(content ${problem.scrollHeight}px tall in a ${problem.clientHeight}px box, ` +\n"
    "          `${problem.scrollWidth}px wide in ${problem.clientWidth}px), so two ` +\n"
    "          `blocks print on top of each other`\n"
    "        : \"a box inside the zone is cutting off its own content\";\n"
    "}\n"
    "\n"
    "function sheetLabel(key) {\n",
)

# --- 3. the last resort in the browser ----------------------------------------------
replace_once(BUILD, "  const sheets = sheetsOf(worksheet);\n", "  let sheets = sheetsOf(worksheet);\n")
replace_once(
    BUILD,
    "  const rendered = [];\n"
    "  for (const sheet of sheets) {\n"
    "    const html = renderSheet(sheet.spec);\n"
    "    // A level is one page and one file, except for the approved two-page\n"
    "    // exception, where page 2 must not overwrite page 1.\n"
    "    const suffix = sheet.pageCount > 1 ? `-${sheet.key}-p${sheet.page}` : `-${sheet.key}`;\n"
    "    const htmlPath = path.join(outDir, `${base}${suffix}.html`);\n"
    "    fs.writeFileSync(htmlPath, html);\n"
    "    rendered.push({ sheet, html, htmlPath });\n"
    "  }\n",
    "  const draw = (list) =>\n"
    "    list.map((sheet) => {\n"
    "      const html = renderSheet(sheet.spec);\n"
    "      // A level is one page and one file, except for the approved two-page\n"
    "      // exception, where page 2 must not overwrite page 1.\n"
    "      const suffix = sheet.pageCount > 1 ? `-${sheet.key}-p${sheet.page}` : `-${sheet.key}`;\n"
    "      const htmlPath = path.join(outDir, `${base}${suffix}.html`);\n"
    "      fs.writeFileSync(htmlPath, html);\n"
    "      return { sheet, html, htmlPath };\n"
    "    });\n"
    "  let rendered = draw(sheets);\n",
)
replace_once(
    BUILD,
    "  const slipSheets = sheets.filter((s) => s.spec.recording === \"books\" && s.pageCount === 1);\n",
    "  let slipSheets = sheets.filter((s) => s.spec.recording === \"books\" && s.pageCount === 1);\n",
)
replace_once(
    BUILD,
    "    for (const r of rendered) {\n"
    "      // The browser's verdict, and what was done about it, come back from one\n",
    "    const settleAll = async () => {\n"
    "    for (const r of rendered) {\n"
    "      // The browser's verdict, and what was done about it, come back from one\n",
)
replace_once(
    BUILD,
    "      pdfs.push(settled.pdf);\n"
    "      for (const problem of settled.fitProblems) {\n"
    "        clipped.push({ sheet: r.sheet, problem });\n"
    "      }\n"
    "    }\n",
    "      pdfs.push(settled.pdf);\n"
    "      for (const problem of settled.fitProblems) {\n"
    "        clipped.push({ sheet: r.sheet, problem });\n"
    "      }\n"
    "    }\n"
    "    };\n"
    "    await settleAll();\n"
    "\n"
    "    // The last resort in the browser: a Below or Greater Depth sheet it finds\n"
    "    // clipped, when the Expected sheet printed clean, cannot be made either, so\n"
    "    // the Expected sheet stands in for it. Those pages are drawn again, the\n"
    "    // key is written again, and every sheet is measured again.\n"
    "    const clippedKeys = [...new Set(clipped.map((c) => c.sheet.key))];\n"
    "    if (\n"
    "      omitUnfittable &&\n"
    "      clippedKeys.length &&\n"
    "      worksheet.sheets.expected &&\n"
    "      clippedKeys.every((key) => STAND_IN_TIERS.includes(key) && !standIns.has(key))\n"
    "    ) {\n"
    "      for (const key of clippedKeys) {\n"
    "        const details = clipped.filter((c) => c.sheet.key === key).map((c) => clipDetail(c.problem));\n"
    "        worksheet = withExpectedIn(worksheet, key);\n"
    "        standIns.set(key, {\n"
    "          keyLine: \"which the page could not hold\",\n"
    "          why: `the page cannot hold the ${sheetLabel(key)} sheet (${details.join(\" \")})`,\n"
    "        });\n"
    "      }\n"
    "      fs.writeFileSync(answersPath, renderAnswerKey(worksheet, answerKeyOf(worksheet), { stoodIn: keyLines() }), \"utf8\");\n"
    "      sheets = sheetsOf(worksheet);\n"
    "      rendered = draw(sheets);\n"
    "      slipSheets = sheets.filter((s) => s.spec.recording === \"books\" && s.pageCount === 1);\n"
    "      for (const list of [pdfs, clipped, reshaped, corrected]) list.length = 0;\n"
    "      await settleAll();\n"
    "    }\n",
)
replace_once(
    BUILD,
    "        const detail =\n"
    "          problem.kind === \"zone-overflow\"\n"
    "            ? `rendered content overflows the zone (content ${problem.scrollHeight}px ` +\n"
    "              `tall in ${problem.clientHeight}px, ${problem.scrollWidth}px wide in ` +\n"
    "              `${problem.clientWidth}px)`\n"
    "            : problem.kind === \"child-outside-zone\"\n"
    "              ? \"rendered content reaches outside the zone and is cut by its edge\"\n"
    "              : problem.kind === \"child-spills-over-neighbour\"\n"
    "                ? `the box \"${problem.box}\" is drawing over what comes after it ` +\n"
    "                  `(content ${problem.scrollHeight}px tall in a ${problem.clientHeight}px box, ` +\n"
    "                  `${problem.scrollWidth}px wide in ${problem.clientWidth}px), so two ` +\n"
    "                  `blocks print on top of each other`\n"
    "                : \"a box inside the zone is cutting off its own content\";\n"
    "        fail(\n"
    "          \"SHEET_DOES_NOT_FIT\",\n"
    "          `${sheet.label} page ${sheet.page} zone \"${problem.zone}\" - ${detail}.`,\n"
    "          \"composition\",\n"
    "          { sheet: sheet.key, page: sheet.page, zone: problem.zone }\n"
    "        );\n"
    "      }\n"
    "      return;\n",
    "        const detail = clipDetail(problem);\n"
    "        // A tier the Expected sheet stood in for is named as that: the page\n"
    "        // clipped is the Expected sheet's, and the tier's own reason is said.\n"
    "        const standIn = standIns.get(sheet.key);\n"
    "        const whose = standIn ? ` (the Expected sheet, standing in because ${standIn.why})` : \"\";\n"
    "        fail(\n"
    "          \"SHEET_DOES_NOT_FIT\",\n"
    "          `${sheet.label} page ${sheet.page} zone \"${problem.zone}\"${whose} - ${detail}.`,\n"
    "          \"composition\",\n"
    "          { sheet: sheet.key, page: sheet.page, zone: problem.zone }\n"
    "        );\n"
    "      }\n"
    "      // A refused pack leaves no answer key behind. It was written before the\n"
    "      // pages were drawn, and on its own it would be delivered as if the pack\n"
    "      // were, naming a stand-in the class never got.\n"
    "      fs.rmSync(answersPath, { force: true });\n"
    "      return;\n",
)

# --- 3b. a stand-in dropped at the last resort is named for what it was -----------
replace_once(
    BUILD,
    "  const keyLines = () => Object.fromEntries([...standIns].map(([key, s]) => [key, s.keyLine]));\n",
    "  const keyLines = () => Object.fromEntries([...standIns].map(([key, s]) => [key, s.keyLine]));\n"
    "  // A tier the Expected sheet stood in for, omitted because the page cannot\n"
    "  // hold the Expected sheet either, is named for its own reason, never with\n"
    "  // the Expected sheet's measurement as if it were the tier's own.\n"
    "  const omission = (key, problem) => {\n"
    "    const standIn = standIns.get(key);\n"
    "    if (!standIn) return problem;\n"
    "    const label = sheetLabel(key);\n"
    "    const text = String(problem);\n"
    "    const detail = text.startsWith(`${label} - `) ? text.slice(label.length + 3) : text;\n"
    "    return (\n"
    "      `${label} - ${standIn.why}, and the Expected sheet cannot stand in for it: ` +\n"
    "      `the page cannot hold the Expected sheet either (${detail})`\n"
    "    );\n"
    "  };\n",
)
replace_once(
    BUILD,
    "        worksheet = withoutSheet(worksheet, key);\n"
    "        omitted.push(key);\n"
    "        console.log(`SHEET_OMITTED: ${e.message}`);\n"
    "        diagnostic(\"SHEET_OMITTED\", \"composition\", e.location, e.message);\n",
    "        const message = omission(key, e.message);\n"
    "        worksheet = withoutSheet(worksheet, key);\n"
    "        omitted.push(key);\n"
    "        console.log(`SHEET_OMITTED: ${message}`);\n"
    "        diagnostic(\"SHEET_OMITTED\", \"composition\", e.location, message);\n",
)
replace_once(
    BUILD,
    "      for (const problem of sheet.tooTight) {\n"
    "        console.log(`SHEET_OMITTED: ${sheet.label} - ${problem}`);\n"
    "        diagnostic(\"SHEET_OMITTED\", \"composition\", { sheet: sheet.key, page: sheet.page }, problem);\n"
    "      }\n",
    "      for (const problem of sheet.tooTight) {\n"
    "        const message = omission(sheet.key, `${sheet.label} - ${problem}`);\n"
    "        console.log(`SHEET_OMITTED: ${message}`);\n"
    "        diagnostic(\"SHEET_OMITTED\", \"composition\", { sheet: sheet.key, page: sheet.page }, message);\n"
    "      }\n",
)
replace_once(
    BUILD,
    "        `omitted ${omitted.join(\", \")} because the page cannot hold it. The answer ` +\n"
    "        `key covers the delivered sheets only.`\n",
    "        `omitted ${omitted.join(\", \")} because the page cannot hold it` +\n"
    "        (omitted.some((key) => standIns.has(key))\n"
    "          ? \" (for a tier the Expected sheet stood in for, the Expected sheet)\"\n"
    "          : \"\") +\n"
    "        `. The answer key covers the delivered sheets only.`\n",
)

# --- 4. each stand-in named once the pack is built -------------------------------
replace_once(
    BUILD,
    "  console.log(\n"
    "    `Sheets: ${[...new Set(sheets.map((s) => s.label))].join(\", \")}`\n"
    "  );\n",
    "  // Each tier the Expected sheet stands in for, named once the pack is built:\n"
    "  // a flag for the teacher's report, never a fault for a repair round, so it\n"
    "  // carries no BUILD_DIAGNOSTIC.\n"
    "  for (const [key, standIn] of standIns) {\n"
    "    if (!worksheet.sheets[key]) continue;\n"
    "    const label = sheetLabel(key);\n"
    "    console.log(\n"
    "      `SHEET_STANDS_IN: ${label} - the Expected sheet stands in for ${label}, and the ` +\n"
    "        `${label} section of the answer key is the Expected answers: ${standIn.why}.`\n"
    "    );\n"
    "  }\n"
    "\n"
    "  console.log(\n"
    "    `Sheets: ${[...new Set(sheets.map((s) => s.label))].join(\", \")}`\n"
    "  );\n",
)

# --- 5. the run's script flags a tier stood in for --------------------------------
replace_once(
    RUN,
    "            \"worksheets only: deliver the sheets that fit when one sheet cannot \"\n"
    "            \"be made to fit, naming each omitted sheet and its measurement. Used \"\n"
    "            \"only after that sheet's own repair round has failed.\"\n",
    "            \"worksheets only: the last resort, used only after a sheet's own \"\n"
    "            \"repair round has failed. A Below or Greater Depth sheet the build \"\n"
    "            \"cannot make, for any fault, gets the Expected sheet in its place (a \"\n"
    "            \"SHEET_STANDS_IN line) when the Expected sheet passes every check; an \"\n"
    "            \"Expected sheet the page cannot hold is omitted, named with its \"\n"
    "            \"measurement.\"\n",
)
replace_once(
    RUN,
    "        # version of it: the run passes --omit-unfittable only after a sheet has\n"
    "        # had its own repair round and still does not fit, so an ordinary build\n"
    "        # refuses exactly as it always has.\n",
    "        # version of it: the run passes --omit-unfittable only after a sheet has\n"
    "        # had its own repair round and still does not fit, so an ordinary build\n"
    "        # refuses exactly as it always has. A Below or Greater Depth sheet the\n"
    "        # build cannot make then gets the Expected sheet in its place, flagged:\n"
    "        # Daniel's \"yes\" (25 September 2026) was for a sheet sent back that\n"
    "        # still cannot be fixed, and the lead passed it on for any sheet the\n"
    "        # build cannot make. An Expected sheet the page cannot hold is omitted\n"
    "        # as before.\n",
)
replace_once(
    RUN,
    "        omitted.append({\"sheet\": label.strip(), \"measurement\": measurement.strip() or body})\n"
    "    return omitted\n",
    "        omitted.append({\"sheet\": label.strip(), \"measurement\": measurement.strip() or body})\n"
    "    return omitted\n"
    "\n"
    "\n"
    "def sheets_stood_in(stdout: str) -> list[dict]:\n"
    '    """The tiers the Expected sheet stands in for, from the build\'s own\n'
    "    `SHEET_STANDS_IN:` lines, each with the reason the build gave: the sheet\n"
    "    could not be used as printed, or the last resort could not make it. Those\n"
    "    children get the Expected sheet: Daniel's \"yes\" (25 September 2026) was\n"
    "    for a sheet sent back that still cannot be fixed, and the lead passed it\n"
    "    on for any sheet the build cannot make. The teacher flag needs both\n"
    "    halves: which tier, and why.\"\"\"\n"
    "    stood_in = []\n"
    "    for line in stdout.splitlines():\n"
    "        if not line.startswith(\"SHEET_STANDS_IN: \"):\n"
    "            continue\n"
    "        body = line[len(\"SHEET_STANDS_IN: \"):].strip()\n"
    "        label, _, why = body.partition(\" - \")\n"
    "        stood_in.append({\"sheet\": label.strip(), \"why\": why.strip() or body})\n"
    "    return stood_in\n",
)
replace_once(
    RUN,
    "    if args.kind == \"worksheets\":\n"
    "        summary[\"omittedSheets\"] = sheets_omitted(completed.stdout)\n",
    "    if args.kind == \"worksheets\":\n"
    "        summary[\"omittedSheets\"] = sheets_omitted(completed.stdout)\n"
    "        summary[\"standInSheets\"] = sheets_stood_in(completed.stdout)\n",
)
replace_once(
    RUN,
    "    # A short pack is a delivered pack, and it is flagged for exactly the same\n"
    "    # reason a flagged deck is: the teacher is getting something usable and has\n"
    "    # to be told what is not in it.\n"
    "    if summary.get(\"omittedSheets\"):\n"
    "        names = \", \".join(sheet[\"sheet\"] for sheet in summary[\"omittedSheets\"])\n"
    "        print(f\"FIXED_RESOURCE_FLAGGED {args.kind}: {names}\")\n"
    "        return 0\n",
    "    # A short pack is a delivered pack, and it is flagged for exactly the same\n"
    "    # reason a flagged deck is: the teacher is getting something usable and has\n"
    "    # to be told what is not in it. A tier the Expected sheet stands in for is\n"
    "    # flagged the same way.\n"
    "    flagged_sheets = [\n"
    "        sheet[\"sheet\"]\n"
    "        for group in (\"omittedSheets\", \"standInSheets\")\n"
    "        for sheet in summary.get(group, [])\n"
    "    ]\n"
    "    if flagged_sheets:\n"
    "        print(f\"FIXED_RESOURCE_FLAGGED {args.kind}: {', '.join(flagged_sheets)}\")\n"
    "        return 0\n",
)

# --- 6. the tests ----------------------------------------------------------------
(ROOT / "worksheet-html" / "test" / "stand-in.test.js").write_bytes((HERE / "new" / "stand-in.test.js").read_bytes())

replace_once(
    OMIT_TESTS,
    '  const files = fs.readdirSync(dir).filter((f) => f !== "worksheet.json");\n'
    "  fs.rmSync(dir, { recursive: true, force: true });\n"
    "  return { stdout, files, failed };\n",
    '  const files = fs.readdirSync(dir).filter((f) => f !== "worksheet.json");\n'
    '  const keyFile = files.find((f) => f.endsWith(" - Answers.txt"));\n'
    '  const key = keyFile ? fs.readFileSync(path.join(dir, keyFile), "utf8") : "";\n'
    "  fs.rmSync(dir, { recursive: true, force: true });\n"
    "  return { stdout, files, failed, key };\n",
)
replace_once(
    OMIT_TESTS,
    'test("with the flag, the sheets that fit are delivered and the omission is said out loud", () => {\n'
    '  const { stdout, files } = buildWith(specWithOneUnfittable(), ["--omit-unfittable"]);\n'
    "\n"
    "  assert.match(stdout, /^SHEET_OMITTED: .*Greater Depth/m);\n"
    "  assert.match(stdout, /SHEET_OMITTED_SUMMARY: delivered expected; omitted greaterDepth/);\n"
    "  assert.match(stdout, /^Built: .*Omission - Worksheets\\.pdf$/m);\n"
    "  assert.match(stdout, /^Built answers: /m);\n"
    "\n"
    "  // The pupil pack and the teacher's key both exist, and the key covers what\n"
    "  // was delivered rather than a tier nobody has.\n"
    '  assert.ok(files.includes("Omission - Worksheets.pdf"));\n'
    '  assert.ok(files.includes("Omission - Answers.txt"));\n'
    "  assert.ok(files.some((f) => /expected\\.html$/.test(f)));\n"
    "  assert.ok(!files.some((f) => /greaterDepth\\.html$/.test(f)));\n"
    "});\n",
    (HERE / "new" / "omit-unfittable.stand-in.snippet.js").read_text(encoding="utf-8"),
)
# The success-criteria topic's panel test keeps its name and its point (the
# panel is refused before the fit and never printed); at the last resort the
# Greater Depth sheet carrying it now has the Expected sheet in its place.
replace_once(
    OMIT_TESTS,
    '  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);\n'
    "  assert.match(stdout, /Greater Depth - zones\\[1\\]: CRITERIA_NOT_ON_SHEETS/);\n"
    "  assert.doesNotMatch(stdout, /SHEET_OMITTED/);\n"
    "  assert.deepEqual(files, []);\n"
    "});\n",
    "  // Without the flag the panel refuses the pack. At the last resort (the\n"
    "  // worksheets release, 4.2.290) the sheet carrying it cannot be made, so the\n"
    "  // Expected sheet stands in for it: the panel is still never printed, and no\n"
    "  // sheet is omitted for the room it took.\n"
    "  const plain = buildWith(spec);\n"
    "  assert.match(plain.stdout, /Greater Depth - zones\\[1\\]: CRITERIA_NOT_ON_SHEETS/);\n"
    "  assert.deepEqual(plain.files, []);\n"
    "\n"
    '  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);\n'
    "  assert.match(stdout, /^SHEET_STANDS_IN: Greater Depth - .*cannot be built \\(CRITERIA_NOT_ON_SHEETS: zones\\[1\\]/m);\n"
    "  assert.doesNotMatch(stdout, /SHEET_OMITTED/);\n"
    '  assert.ok(files.includes("Omission - Worksheets.pdf"));\n'
    "});\n",
)
# The guard that matters most keeps its point (a faulty sheet is never printed)
# and changes its outcome for Below and Greater Depth at the last resort.
replace_once(
    OMIT_TESTS,
    'test("a fault that is not about page fit still refuses everything", () => {\n',
    'test("a fault that is not about page fit never prints the faulty sheet", () => {\n',
)
replace_once(
    OMIT_TESTS,
    "  // failure this engine exists to refuse.\n"
    "  const spec = specWithOneUnfittable();\n"
    '  spec.sheets.greaterDepth = fittingSheet("Write a number between −5 and −1.");\n'
    "  spec.answerKey.greaterDepth = [];\n"
    "\n"
    '  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);\n'
    "  assert.doesNotMatch(stdout, /SHEET_OMITTED/);\n"
    "  assert.deepEqual(files, []);\n"
    "});\n",
    "  // failure this engine exists to refuse. Since the worksheets release\n"
    "  // (4.2.290) a Below or Greater Depth sheet with such a fault gets the\n"
    "  // Expected sheet in its place at the last resort, so it is still never\n"
    "  // printed; the same fault on the Expected sheet still refuses everything.\n"
    "  const spec = specWithOneUnfittable();\n"
    '  spec.sheets.greaterDepth = fittingSheet("Write a number between −5 and −1.");\n'
    "  spec.answerKey.greaterDepth = [];\n"
    "\n"
    '  const { stdout, files, key } = buildWith(spec, ["--omit-unfittable"]);\n'
    "  assert.doesNotMatch(stdout, /SHEET_OMITTED/);\n"
    "  assert.match(stdout, /^SHEET_STANDS_IN: Greater Depth - .*cannot be built \\(ANSWER_KEY_MISSING/m);\n"
    '  assert.ok(files.includes("Omission - Worksheets.pdf"));\n'
    "  assert.equal(timesInKey(key), 2);\n"
    "\n"
    "  const broken = specWithOneUnfittable();\n"
    '  broken.sheets.greaterDepth = fittingSheet("Write a number between −5 and −1.");\n'
    '  broken.answerKey.greaterDepth = [{ question: 1, answer: "−3" }];\n'
    "  broken.answerKey.expected = [];\n"
    '  const refused = buildWith(broken, ["--omit-unfittable"]);\n'
    "  assert.doesNotMatch(refused.stdout, /SHEET_OMITTED|SHEET_STANDS_IN/);\n"
    "  assert.deepEqual(refused.files, []);\n"
    "});\n",
)

RUN_TEST_CODE = '''
    def test_a_tier_the_expected_sheet_stands_in_for_is_flagged(self) -> None:
        # Daniel, 25 September 2026 ("yes"): a Below or Greater Depth sheet sent
        # back to be redesigned that still cannot be made gets the Expected
        # sheet in its place, flagged so he knows which tier and why.
        self.js_writer(
            "worksheet-html/scripts/build-worksheet.js",
            """const fs=require('fs'); const p=require('path');
const out=process.argv[3];
const pdf=p.join(out, 'Lesson - Worksheets.pdf');
const answer=p.join(out, 'Lesson - Answers.txt');
fs.writeFileSync(pdf, 'pdf');
fs.writeFileSync(answer, 'answers');
console.log('Built answers: ' + answer);
console.log('Built: ' + pdf);
console.log('SHEET_STANDS_IN: Below - the Expected sheet stands in for Below, and the Below section of the answer key is the Expected answers: the Below sheet could not be used as printed (a picture it needs will never arrive: adaptation-photo-002).');
""",
        )
        completed = self.run_script("worksheets", "--lesson-name", "Lesson")
        summary = json.loads(
            (self.root / "summary.json").read_text(encoding="utf-8")
        )
        self.assertTrue(summary["ok"])
        self.assertEqual([s["sheet"] for s in summary["standInSheets"]], ["Below"])
        self.assertIn("adaptation-photo-002", summary["standInSheets"][0]["why"])
        self.assertEqual(summary["omittedSheets"], [])
        self.assertIn("FIXED_RESOURCE_FLAGGED worksheets: Below", completed.stdout)
'''
text = read(RUN_TESTS)
anchor = '\n\nif __name__ == "__main__":\n    unittest.main()\n'
assert text.count(anchor) == 1 and "\r\n" not in text
write(RUN_TESTS, text.replace(anchor, RUN_TEST_CODE.rstrip("\n") + "\n" + anchor))

print("the Expected sheet stands in: the key's line, the last resort, the flag, the run, the tests")
