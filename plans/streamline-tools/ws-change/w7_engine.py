"""The worksheets release (4.2.290), step 8: the sheet engine (change plan
section 1, decisions 5 and 10; section 2, settled items f, g and o).

- check-worksheet.js: a Below or Greater Depth sheet returned for a teaching
  problem stands (decision 5); one omitted over pictures that will never
  arrive stands, read from the terminal receipts beside the spec or from the
  run's picture stage (settled item f); the page-only words on a books sheet
  are printed as a prompt to look again (settled item o).
- slips.js: the page-only words leave `recordingProblems` for their own
  advisory, `recordingAdvisories` (`RECORDING_LOOK_AGAIN`), quiet when the
  reason names the words.
- build-worksheet.js: corrects a books sheet to "sheet" only for an advisory
  its reason does not answer.
- text.js: the list refusal leaves off a method's steps listed only to consult
  (decision 10), without saying where they are shown.
- build-catalogue.js and build-layouts-doc.js: the stale "say so in notes" and
  "the band the learning objective ... sit in" (decision 5, settled item g);
  the two generated references are rebuilt with `npm run catalogue` and
  `npm run layouts` afterwards (w7b).
- doc-claims.test.js: its comment names two sentences no document holds any
  more (settled item g).
"""
from _patch import replace_once

CHECK = "worksheet-html/scripts/check-worksheet.js"
SLIPS = "worksheet-html/src/slips.js"
BUILD = "worksheet-html/scripts/build-worksheet.js"
TEXT = "worksheet-html/src/helpers/text.js"
CATALOGUE = "worksheet-html/scripts/build-catalogue.js"
LAYOUTS = "worksheet-html/scripts/build-layouts-doc.js"
DOC_CLAIMS = "worksheet-html/test/doc-claims.test.js"

# ─── check-worksheet.js: the directed-sheet gate ─────────────────────────
replace_once(
    CHECK,
    'const { recordingProblems } = require("../src/slips");\n',
    'const { recordingProblems, recordingAdvisories } = require("../src/slips");\n',
)

replace_once(
    CHECK,
    "// The sheets adaptation.md directs must be in the spec, or their omission must\n"
    "// point at a photograph request that genuinely is not in the photo contract.\n"
    "// Without this, a designer that omitted the Below sheet because its adaptation\n"
    "// pictures \"had not arrived\" passed preflight, promotion then found no sheet\n"
    "// referencing those pictures and sourced none, and the sheet became\n"
    "// unrecoverable - the check said OK at the exact moment the loss was still\n"
    "// repairable.\n"
    "function checkDirectedSheets(worksheet, adaptationPath, photoReqPath) {\n",
    "// The sheets adaptation.md directs must be in the spec, or their omission must\n"
    "// be a gap that can stand. Without this, a designer that omitted the Below sheet\n"
    "// because its adaptation pictures \"had not arrived\" passed preflight, promotion\n"
    "// then found no sheet referencing those pictures and sourced none, and the sheet\n"
    "// became unrecoverable - the check said OK at the exact moment the loss was still\n"
    "// repairable.\n"
    "//\n"
    "// Three omissions stand, each going back to its owner through the note:\n"
    "//   - over a ref genuinely absent from the photo contract;\n"
    "//   - over refs that will never arrive: every named ref's terminal receipt beside\n"
    "//     the spec reads `unsatisfied` or `omitted`, or the run's picture stage was\n"
    "//     `unavailable`, so no approved picture will ever be published;\n"
    "//   - for a problem that is not a picture at all. The teacher's ruling on the\n"
    "//     worksheets list (24 September 2026): a sheet a child could not use as\n"
    "//     printed goes back to be redesigned while the others are made. A note that\n"
    "//     names no ref and claims no picture is that, and refusing it left no way to\n"
    "//     return a Below or Greater Depth sheet for its teaching.\n"
    "// A note that claims a picture and names no ref is still refused, because that\n"
    "// is the \"had not arrived\" case this check was built for. The picture words are\n"
    "// the ones that name a picture (photo, picture, image, an approved request):\n"
    "// \"visual\" alone is not among them, because a visual no helper can draw is one\n"
    "// of the teaching gaps that must be able to go back.\n"
    "const PICTURE_CLAIM = /\\b(?:photo\\w*|pictures?|images?|approved request)\\b/i;\n"
    "const NEVER_ARRIVES = new Set([\"unsatisfied\", \"omitted\"]);\n"
    "\n"
    "// filename -> terminalState, from the receipts the picture stage writes beside\n"
    "// the working folder's specs (the same reading working-wall-packet.py does).\n"
    "function terminalStates(specDir) {\n"
    "  const states = new Map();\n"
    "  const folder = path.join(specDir, \"orchestration-receipts\", \"picture-terminal\");\n"
    "  let names = [];\n"
    "  try {\n"
    "    names = fs.readdirSync(folder).filter((name) => name.endsWith(\".json\")).sort();\n"
    "  } catch {\n"
    "    return states;\n"
    "  }\n"
    "  for (const name of names) {\n"
    "    try {\n"
    "      const receipt = JSON.parse(fs.readFileSync(path.join(folder, name), \"utf8\"));\n"
    "      if (typeof receipt.filename === \"string\" && typeof receipt.terminalState === \"string\") {\n"
    "        states.set(receipt.filename.replace(/\\\\/g, \"/\"), receipt.terminalState);\n"
    "      }\n"
    "    } catch {\n"
    "      // An unreadable receipt proves nothing, so it lets nothing stand.\n"
    "    }\n"
    "  }\n"
    "  return states;\n"
    "}\n"
    "\n"
    "function stateOf(states, filename) {\n"
    "  if (typeof filename !== \"string\") return null;\n"
    "  const asked = filename.replace(/\\\\/g, \"/\");\n"
    "  if (states.has(asked)) return states.get(asked);\n"
    "  const base = path.posix.basename(asked);\n"
    "  for (const [name, state] of states) {\n"
    "    if (path.posix.basename(name) === base) return state;\n"
    "  }\n"
    "  return null;\n"
    "}\n"
    "\n"
    "function checkDirectedSheets(worksheet, adaptationPath, photoReqPath, options = {}) {\n"
    "  const pictureStage = typeof options.pictureStage === \"string\" ? options.pictureStage : \"\";\n"
    "  const stageUnavailable = /\\bunavailable\\b/i.test(pictureStage);\n"
    "  const states = options.specDir ? terminalStates(options.specDir) : new Map();\n",
)

replace_once(
    CHECK,
    "  let contractIds = null;\n"
    "  if (photoReqPath) {\n"
    "    try {\n"
    "      const contract = JSON.parse(fs.readFileSync(path.resolve(photoReqPath), \"utf8\"));\n"
    "      contractIds = new Set(\n"
    "        (Array.isArray(contract.photos) ? contract.photos : [])\n"
    "          .map((p) => p && p.id)\n"
    "          .filter((id) => typeof id === \"string\")\n"
    "      );\n",
    "  let contractIds = null;\n"
    "  const filenameOf = new Map();\n"
    "  if (photoReqPath) {\n"
    "    try {\n"
    "      const contract = JSON.parse(fs.readFileSync(path.resolve(photoReqPath), \"utf8\"));\n"
    "      const photos = Array.isArray(contract.photos) ? contract.photos : [];\n"
    "      contractIds = new Set(\n"
    "        photos\n"
    "          .map((p) => p && p.id)\n"
    "          .filter((id) => typeof id === \"string\")\n"
    "      );\n"
    "      for (const photo of photos) {\n"
    "        if (photo && typeof photo.id === \"string\") filenameOf.set(photo.id, photo.filename);\n"
    "      }\n",
)

replace_once(
    CHECK,
    "    if (contractIds) {\n"
    "      const namedIds = gapNote.match(/(?:adaptation-photo|photo)-\\d+/g) || [];\n"
    "      const allPresent =\n"
    "        namedIds.length > 0 && namedIds.every((id) => contractIds.has(id));\n"
    "      if (allPresent) {\n"
    "        fail(\n",
    "    if (contractIds) {\n"
    "      const namedIds = gapNote.match(/(?:adaptation-photo|photo)-\\d+/g) || [];\n"
    "      const allPresent =\n"
    "        namedIds.length > 0 && namedIds.every((id) => contractIds.has(id));\n"
    "      const neverArrives = (id) =>\n"
    "        stageUnavailable || NEVER_ARRIVES.has(stateOf(states, filenameOf.get(id)));\n"
    "      if (allPresent && namedIds.every(neverArrives)) {\n"
    "        console.warn(\n"
    "          `[directed-sheets] ${directive.label} sheet omitted over ${namedIds.join(\", \")}, ` +\n"
    "            (stageUnavailable\n"
    "              ? \"which the picture stage will never publish (it was unavailable)\"\n"
    "              : \"whose terminal receipts say they will never arrive\") +\n"
    "            \" - the gap stands and goes back to its owner.\"\n"
    "        );\n"
    "      } else if (allPresent) {\n"
    "        fail(\n",
)

replace_once(
    CHECK,
    "      } else if (namedIds.length === 0) {\n"
    "        fail(\n"
    "          \"CONTENT_GAP_UNFOUNDED\",\n"
    "          `the ${directive.label} sheet was omitted with a content-gap note that ` +\n"
    "            `names no photo ref, so the claim cannot be checked against the ` +\n"
    "            `contract. Name the missing ref, or design the sheet.`\n"
    "        );\n"
    "      } else {\n",
    "      } else if (namedIds.length === 0 && !PICTURE_CLAIM.test(gapNote)) {\n"
    "        console.warn(\n"
    "          `[directed-sheets] ${directive.label} sheet returned with a content-gap note ` +\n"
    "            `that is not about a picture - the gap stands and goes back to its owner.`\n"
    "        );\n"
    "      } else if (namedIds.length === 0) {\n"
    "        fail(\n"
    "          \"CONTENT_GAP_UNFOUNDED\",\n"
    "          `the ${directive.label} sheet was omitted with a content-gap note that ` +\n"
    "            `names no photo ref, so the claim cannot be checked against the ` +\n"
    "            `contract. Name the missing ref, or design the sheet.`\n"
    "        );\n"
    "      } else {\n",
)

replace_once(
    CHECK,
    "  let photoReqArg = null;\n"
    "  for (let i = 0; i < argv.length; i += 1) {\n"
    "    if (argv[i] === \"--adaptation\") { adaptationArg = argv[++i]; continue; }\n"
    "    if (argv[i] === \"--photo-requirements\") { photoReqArg = argv[++i]; continue; }\n",
    "  let photoReqArg = null;\n"
    "  let pictureStageArg = null;\n"
    "  for (let i = 0; i < argv.length; i += 1) {\n"
    "    if (argv[i] === \"--adaptation\") { adaptationArg = argv[++i]; continue; }\n"
    "    if (argv[i] === \"--photo-requirements\") { photoReqArg = argv[++i]; continue; }\n"
    "    if (argv[i] === \"--picture-stage\") { pictureStageArg = argv[++i]; continue; }\n",
)
replace_once(
    CHECK,
    "    fail(\"SPEC_MISSING\", \"Usage: check-worksheet.js <worksheet.json> [--adaptation adaptation.md] [--photo-requirements contract.json]\");\n",
    "    fail(\"SPEC_MISSING\", \"Usage: check-worksheet.js <worksheet.json> [--adaptation adaptation.md] [--photo-requirements contract.json] [--picture-stage \\\"PICTURE_STAGE: ...\\\"]\");\n",
)
replace_once(
    CHECK,
    "    checkDirectedSheets(worksheet, adaptationArg, photoReqArg);\n",
    "    checkDirectedSheets(worksheet, adaptationArg, photoReqArg, {\n"
    "      pictureStage: pictureStageArg,\n"
    "      specDir: path.dirname(file),\n"
    "    });\n",
)

# ─── check-worksheet.js: books or sheet ──────────────────────────────────
replace_once(
    CHECK,
    "  for (const problem of recordingProblems(worksheet, { required: true })) {\n"
    "    fail(problem.signal, problem.message);\n"
    "  }\n",
    "  for (const problem of recordingProblems(worksheet, { required: true })) {\n"
    "    fail(problem.signal, problem.message);\n"
    "  }\n"
    "  // Words that look as if they need the printed page are a prompt to look\n"
    "  // again, never a refusal: the teacher ruled on 19 September 2026 that one\n"
    "  // digit box does not make a write-on sheet, and \"in the box\" is on the list.\n"
    "  for (const advisory of recordingAdvisories(worksheet)) {\n"
    "    console.warn(`[recording] ${advisory.signal}: ${advisory.message}`);\n"
    "  }\n",
)

# ─── slips.js: the advisory ──────────────────────────────────────────────
replace_once(
    SLIPS,
    "// Whether a sheet is books or sheet is the worksheet designer's call, made\n"
    "// against `references/books-or-sheet.md`. This file owns only what can be\n"
    "// checked or computed: wording that plainly needs the page, and how many slips\n"
    "// fit on a page.\n",
    "// Whether a sheet is books or sheet is the worksheet designer's call, made\n"
    "// against `references/books-or-sheet.md`. This file owns only what can be\n"
    "// checked or computed: wording that may need the page (a prompt to look\n"
    "// again), and how many slips fit on a page.\n",
)
replace_once(
    SLIPS,
    "// A slip carries the sheet's words verbatim, and some words only make sense\n"
    "// with the printed page in front of the child: \"Circle the...\", \"Mark it on the\n"
    "// line\", \"Fill in the table\". A sheet whose questions say those things is not a\n"
    "// books sheet whatever it was marked, because a child with a slip and a book\n"
    "// has nothing to circle. The designer is told at preflight; the build treats\n"
    "// the sheet as \"sheet\" rather than print slips that ask the impossible.\n",
    "// A slip carries the sheet's words verbatim, and some words look as if they\n"
    "// only make sense with the printed page in front of the child: \"Circle the...\",\n"
    "// \"Mark it on the line\", \"Fill in the table\". They are a prompt to look again,\n"
    "// not a verdict: `Write the missing digit in the box.` asks for a blank a child\n"
    "// copies into a book in seconds, and the teacher ruled on 19 September 2026\n"
    "// that one digit box does not make a write-on sheet. So the designer is asked\n"
    "// to look again at preflight, and a `recordingReason` that names the words\n"
    "// answers it; the build treats the sheet as \"sheet\" only when nobody answered,\n"
    "// rather than print slips that ask a child to circle what they do not have.\n",
)
replace_once(
    SLIPS,
    "// The first piece of wording on a sheet that needs the printed page, as\n"
    "// `{ phrase, text }`, or null.\n"
    "function sheetOnlyWording(sheet) {\n"
    "  const content = sheet && (sheet.pages || sheet.zones);\n"
    "  for (const text of pupilStrings(content)) {\n"
    "    for (const pattern of SHEET_ONLY_WORDING) {\n"
    "      const m = pattern.exec(text);\n"
    "      if (m) return { phrase: m[0], text: text.replace(/\\s+/g, \" \").trim() };\n"
    "    }\n"
    "  }\n"
    "  return null;\n"
    "}\n",
    "// Every piece of wording on a sheet that looks as if it needs the printed page,\n"
    "// as `{ phrase, text }`, one per string (its first match), in reading order.\n"
    "function sheetOnlyWordings(sheet) {\n"
    "  const content = sheet && (sheet.pages || sheet.zones);\n"
    "  const found = [];\n"
    "  for (const text of pupilStrings(content)) {\n"
    "    for (const pattern of SHEET_ONLY_WORDING) {\n"
    "      const m = pattern.exec(text);\n"
    "      if (m) {\n"
    "        found.push({ phrase: m[0], text: text.replace(/\\s+/g, \" \").trim() });\n"
    "        break;\n"
    "      }\n"
    "    }\n"
    "  }\n"
    "  return found;\n"
    "}\n"
    "\n"
    "// The first of them, or null.\n"
    "function sheetOnlyWording(sheet) {\n"
    "  return sheetOnlyWordings(sheet)[0] || null;\n"
    "}\n"
    "\n"
    "const flatLower = (text) => String(text).toLowerCase().replace(/\\s+/g, \" \").trim();\n"
    "\n"
    "// A books sheet whose words look as if they need the printed page, as a prompt\n"
    "// to look again (`RECORDING_LOOK_AGAIN`), never a refusal. It is quiet when the\n"
    "// sheet's `recordingReason` names every flagged phrase, the way a note naming\n"
    "// the orientation quiets the mixed-orientation advisory: the reason is the\n"
    "// designer saying they looked. `includeAnswered` also returns the answered ones,\n"
    "// marked `answered: true`, for a census of saved sheets.\n"
    "function recordingAdvisories(worksheet, { includeAnswered = false } = {}) {\n"
    "  const advisories = [];\n"
    "  for (const [key, sheet] of Object.entries((worksheet && worksheet.sheets) || {})) {\n"
    "    if (!sheet || typeof sheet !== \"object\" || sheet.recording !== \"books\") continue;\n"
    "    const found = sheetOnlyWordings(sheet);\n"
    "    if (!found.length) continue;\n"
    "    const reason = flatLower(typeof sheet.recordingReason === \"string\" ? sheet.recordingReason : \"\");\n"
    "    const unanswered = found.filter((f) => !reason.includes(flatLower(f.phrase)));\n"
    "    const answered = unanswered.length === 0;\n"
    "    if (answered && !includeAnswered) continue;\n"
    "    const shown = answered ? found : unanswered;\n"
    "    const phrases = [...new Set(shown.map((f) => flatLower(f.phrase)))];\n"
    "    const quoted = shown.map((f) => `\"${f.phrase}\" in \"${f.text}\"`).join(\"; \");\n"
    "    advisories.push({\n"
    "      signal: \"RECORDING_LOOK_AGAIN\",\n"
    "      sheet: key,\n"
    "      answered,\n"
    "      phrases,\n"
    "      found: quoted,\n"
    "      message:\n"
    "        `sheets.${key} is marked \"books\", and ${quoted} look as if they need ` +\n"
    "        `the printed page. Look at that question against ` +\n"
    "        `references/books-or-sheet.md: a small blank a child copies into a book ` +\n"
    "        `in seconds keeps \"books\", and saying so in recordingReason, naming the ` +\n"
    "        `words, quiets this; a printed thing the child cannot reproduce makes the ` +\n"
    "        `sheet \"sheet\". Never reword the question.`,\n"
    "    });\n"
    "  }\n"
    "  return advisories;\n"
    "}\n",
)
replace_once(
    SLIPS,
    "    if (value === \"books\") {\n"
    "      const found = sheetOnlyWording(sheet);\n"
    "      if (found) {\n"
    "        problems.push({\n"
    "          signal: \"RECORDING_NEEDS_SHEET\",\n"
    "          sheet: key,\n"
    "          phrase: found.phrase,\n"
    "          message:\n"
    "            `sheets.${key} is marked \"books\", but \"${found.text}\" asks for ` +\n"
    "            `\"${found.phrase}\", which a child can only do on the printed page. ` +\n"
    "            `Mark the sheet \"sheet\".`,\n"
    "        });\n"
    "      }\n"
    "    }\n"
    "  }\n"
    "  return problems;\n"
    "}\n",
    "  }\n"
    "  return problems;\n"
    "}\n",
)
replace_once(
    SLIPS,
    "  recordingProblems,\n"
    "  sheetOnlyWording,\n",
    "  recordingProblems,\n"
    "  recordingAdvisories,\n"
    "  sheetOnlyWording,\n"
    "  sheetOnlyWordings,\n",
)

# ─── build-worksheet.js: correct only an unanswered advisory ─────────────
replace_once(
    BUILD,
    'const { recordingProblems, buildSlips } = require("../src/slips");\n',
    'const { recordingProblems, recordingAdvisories, buildSlips } = require("../src/slips");\n',
)
replace_once(
    BUILD,
    "  // Books or sheet. The designer's preflight refuses a missing or mistaken\n"
    "  // choice; here, where refusing would cost the class its worksheets, a\n"
    "  // mistaken one is corrected and said out loud instead. A sheet marked books\n"
    "  // whose words need the printed page (\"Circle...\", \"on the line\") is printed\n"
    "  // as a sheet, because slips would ask children to circle something they do\n"
    "  // not have.\n"
    "  for (const problem of recordingProblems(worksheet)) {\n"
    "    const label = sheetLabel(problem.sheet);\n"
    "    const corrected = problem.signal === \"RECORDING_NEEDS_SHEET\" ? \"sheet\" : undefined;\n"
    "    worksheet = withRecording(worksheet, problem.sheet, corrected);\n"
    "    console.log(\n"
    "      `RECORDING_CHANGED: ${label} - ${problem.message} ` +\n"
    "        (corrected\n"
    "          ? 'Printed with the \"sheet\" mark and no question slips.'\n"
    "          : \"Printed with no mark and no question slips.\")\n"
    "    );\n"
    "    diagnostic(\"RECORDING_CHANGED\", \"content\", { sheet: problem.sheet }, problem.message);\n"
    "  }\n",
    "  // Books or sheet. The designer's preflight refuses a missing or unusable\n"
    "  // choice; here, where refusing would cost the class its worksheets, an\n"
    "  // unusable one is printed unmarked and said out loud instead. A sheet marked\n"
    "  // books whose words look as if they need the printed page (\"Circle...\", \"on\n"
    "  // the line\") was asked at preflight to look again; one whose\n"
    "  // `recordingReason` names those words was looked at and keeps \"books\" (one\n"
    "  // digit box does not make a write-on sheet, the teacher's 19 September\n"
    "  // ruling), and one nobody answered is printed as a sheet, because its slips\n"
    "  // might ask children to circle something they do not have.\n"
    "  for (const problem of recordingProblems(worksheet)) {\n"
    "    const label = sheetLabel(problem.sheet);\n"
    "    worksheet = withRecording(worksheet, problem.sheet, undefined);\n"
    "    console.log(\n"
    "      `RECORDING_CHANGED: ${label} - ${problem.message} ` +\n"
    "        \"Printed with no mark and no question slips.\"\n"
    "    );\n"
    "    diagnostic(\"RECORDING_CHANGED\", \"content\", { sheet: problem.sheet }, problem.message);\n"
    "  }\n"
    "  for (const advisory of recordingAdvisories(worksheet)) {\n"
    "    const label = sheetLabel(advisory.sheet);\n"
    "    const message =\n"
    "      `sheets.${advisory.sheet} is marked \"books\", and ${advisory.found} look as if ` +\n"
    "      `they need the printed page, and its recordingReason does not say why a book ` +\n"
    "      `will do.`;\n"
    "    worksheet = withRecording(worksheet, advisory.sheet, \"sheet\");\n"
    "    console.log(\n"
    "      `RECORDING_CHANGED: ${label} - ${message} ` +\n"
    "        'Printed with the \"sheet\" mark and no question slips.'\n"
    "    );\n"
    "    diagnostic(\"RECORDING_CHANGED\", \"content\", { sheet: advisory.sheet }, message);\n"
    "  }\n",
)

# ─── text.js: decision 10 in the list refusal ────────────────────────────
replace_once(
    TEXT,
    "      'board and are never printed on a worksheet. Otherwise, if they are steps a child ' +\n",
    "      'board and are never printed on a worksheet. A list of a method\\'s steps printed ' +\n"
    "      'just as a reminder is left off too. Otherwise, if they are steps a child ' +\n",
)

# ─── build-catalogue.js (P31): a gap goes back, not into notes ───────────
replace_once(
    CATALOGUE,
    "    \"If a lesson needs something no helper here can express, say so in `notes` rather\",\n"
    "    \"than bending the nearest one to fit. That is how the next helper gets built.\",\n",
    "    \"If a lesson needs something no helper here can express, return it as a gap (the\",\n"
    "    \"worksheet designer's rule 11) rather than bending the nearest one to fit. That is\",\n"
    "    \"how the next helper gets built.\",\n",
)

# ─── build-layouts-doc.js (O35): no objective prints ─────────────────────
# The change plan's draft was "the band the sheet code sits in". The engine
# takes no band at all (`headerMm` in render.js returns 0: the code sits in the
# 15mm printer margin, as the worksheet designer's step 4 now says), so the
# sentence says that instead, and the comment that justified a six-millimetre
# band goes the same way. Regenerating the reference (w7b) therefore also
# corrects every zone height it quotes, which were six millimetres short (four
# on a halved zone) since the band went.
replace_once(
    LAYOUTS,
    "    `zones (${GUTTER_MM}mm) and the band the learning objective and sheet code sit in`,\n"
    "    \"are already taken off. So these are the millimetres a helper actually gets, and\",\n",
    "    `zones (${GUTTER_MM}mm) is already taken off, and the sheet code sits in the top`,\n"
    "    \"margin, taking no room from the zones. So these are the millimetres a helper actually gets, and\",\n",
)
replace_once(
    LAYOUTS,
    "  // The page a sheet's ZONES actually get, which is the printable area less the\n"
    "  // band the learning objective sits in. Quoting the paper instead would\n"
    "  // overstate every height in this document by six millimetres, which is the\n"
    "  // same class of fault the comment above describes: a size stated here that a\n"
    "  // helper is then refused at.\n",
    "  // The page a sheet's ZONES actually get, read from the renderer's own\n"
    "  // `contentArea`, so any band taken off the page there is taken off here too.\n"
    "  // Today none is: nothing is titled, and the sheet code sits in the printer\n"
    "  // margin. A size stated here that a helper is then refused at is the same\n"
    "  // class of fault the comment above describes.\n",
)

# ─── doc-claims.test.js: the comment says what the tests measure ─────────
replace_once(
    DOC_CLAIMS,
    "//   - a picture beside a word is cheap (a photo word bank costs a sliver, not\n"
    "//     a page)                     agents/lesson-designer.md   \"A small picture beside a word is cheap\"\n"
    "//                                 agents/adaptation-designer.md  \"a picture-and-word bank are cheap\"\n"
    "//   - six cheap numbered items (coin strips, part-whole money) are an ordinary\n"
    "//     page; eight are not         the same two documents (\"six of those on a page is ordinary\")\n",
    "//   - a picture beside a word is cheap: eight pictures in a word bank cost\n"
    "//     under 30mm over bare words, and still leave room for four written\n"
    "//     answers on the page\n"
    "//   - six cheap numbered items (coin strips, part-whole money) are an ordinary\n"
    "//     page; eight are not\n"
    "//     (These two were quoted by the lesson designer and the adaptation\n"
    "//     designer, whose test titles still name them; neither file quotes the\n"
    "//     sentences any more, and the tests keep measuring the page.)\n",
)
print("engine changed; now run w7b to rebuild the two generated references")
