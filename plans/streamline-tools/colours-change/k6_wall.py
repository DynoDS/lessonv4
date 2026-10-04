"""The colours release, step 6: the working wall uses the board's colour meanings
(decision 22, its colour half: "yes"; the wording half is release 7A's).

The mapping is derived from his answer, not given by him (the change plan says
so), and the rendered wall goes to him before anything is committed:

- a sticky fact and a worked example are purple, the board's colour for both;
- taught words are green (the vocabulary cards leave teal);
- a misconception's right answer stays green and its wrong one red;
- titles and headers are blue, as the board's own titles are (the reference
  table's header, the misconception, sentence stem, equivalence, mnemonic,
  labelled-diagram and overview title bars);
- a sentence stem and a reference table are neutral, with any taught word inside
  them green; the stem's modelled line, a worked example of the stem, is purple;
- colours that only told parts apart take the board's category colours (blue,
  orange, purple; never green), and an answer a section part works out is green,
  or purple on a part marked `worked: true`, a worked example, a mistaken one
  included (the second check);
- a taught word's braces never print on any card: a card that draws its words
  with their marks shows the word green, and every other place prints it plain;
- teal, navy and amber, which mean nothing on the board, leave.

The rainbow the zoners and banners cycle through is left alone (decoration that
labels the wall's zones, not teaching), and so are the shared figures, which
are already the board's own drawings.
"""
from _patch import WALL_CC, WALL_PREF, WALL_VL, assert_absent, replace_once

STYLE = "working-wall-html/style.json"
SHARED = "working-wall-html/src/shared.js"
PANELS = "working-wall-html/src/render-panels.js"
GRIDS = "working-wall-html/src/render-grids.js"
SECTION = "working-wall-html/src/render-section.js"
OVERVIEW = "working-wall-html/src/render-overview.js"
DISPLAY = "working-wall-html/src/render-display.js"

# ── the palette ──────────────────────────────────────────────────────────────
replace_once(STYLE,
    '    "workedExampleTitleBarFill": "00B050",\n'
    '    "workedExamplePanelFill": "D5F5E3",\n'
    '    "workedExamplePanelLine": "00B050",\n'
    '    "workedExampleLabel": "00B050",\n',
    '    "workedExampleTitleBarFill": "7030A0",\n'
    '    "workedExamplePanelFill": "EDE3F5",\n'
    '    "workedExamplePanelLine": "7030A0",\n'
    '    "workedExampleLabel": "7030A0",\n')

replace_once(STYLE,
    '    "stickyTitleBarFill": "1F4E79",\n'
    '    "stickyPanelFill": "DEEAF1",\n'
    '    "stickyPanelLine": "1F4E79",\n'
    '    "stickyLabel": "1F4E79",\n',
    '    "stickyTitleBarFill": "7030A0",\n'
    '    "stickyPanelFill": "EDE3F5",\n'
    '    "stickyPanelLine": "7030A0",\n'
    '    "stickyLabel": "7030A0",\n')

replace_once(STYLE,
    '    "sentenceStemTitleBarFill": "00B050",\n'
    '    "sentenceStemPanelFill": "D5F5E3",\n'
    '    "sentenceStemPanelLine": "00B050",\n'
    '    "sentenceStemLabel": "00B050",\n'
    '    "sentenceStemBullet": "00B050",\n',
    '    "sentenceStemTitleBarFill": "0070C0",\n'
    '    "sentenceStemPanelFill": "F4F6FA",\n'
    '    "sentenceStemPanelLine": "7F7F7F",\n'
    '    "sentenceStemLabel": "7030A0",\n'
    '    "sentenceStemBullet": "000000",\n')

replace_once(STYLE,
    '    "misconceptionTitleBarFill": "D97706",\n',
    '    "misconceptionTitleBarFill": "0070C0",\n')

replace_once(STYLE,
    '    "referenceTableHeaderFill": "1F4E79",\n',
    '    "referenceTableHeaderFill": "0070C0",\n')

replace_once(STYLE,
    '    "vocabDefinitionTitleBarFill": "0D9488",\n'
    '    "vocabDefinitionPanelFill": "F0FDFA",\n'
    '    "vocabDefinitionPanelLine": "0D9488",\n'
    '\n'
    '    "equivalenceGridTitleBarFill": "1F4E79",\n'
    '    "mnemonicTitleBarFill": "1F4E79",\n',
    '    "vocabDefinitionTitleBarFill": "00B050",\n'
    '    "vocabDefinitionPanelFill": "D5F5E3",\n'
    '    "vocabDefinitionPanelLine": "00B050",\n'
    '\n'
    '    "equivalenceGridTitleBarFill": "0070C0",\n'
    '    "mnemonicTitleBarFill": "0070C0",\n'
    '    "labelledDiagramTitleBarFill": "0070C0",\n')

# ── the board's colour marks, drawn on the wall ──────────────────────────────
replace_once(SHARED,
    "const FONT_STACK_FALLBACK = \"'Segoe Print', cursive\";\n"
    "\n"
    "function esc(s) {\n"
    "  return String(s == null ? \"\" : s)\n"
    "    .replace(/&/g, \"&amp;\")\n"
    "    .replace(/</g, \"&lt;\")\n"
    "    .replace(/>/g, \"&gt;\");\n"
    "}\n",
    "const { criteriaSegments } = require(\"../../shared/text/criteria-marks\");\n"
    "\n"
    "const FONT_STACK_FALLBACK = \"'Segoe Print', cursive\";\n"
    "\n"
    "// A taught word is written `{{word}}` on the board, and words copied onto the\n"
    "// wall keep the mark. Its braces never print, whatever card the words land\n"
    "// on: where a card draws its words with their marks (markedHtml, below) the\n"
    "// word is green, and everywhere else (a title, a strip, a caption) it is\n"
    "// plain. Stripping them here, where every card's words pass, is what keeps\n"
    "// a card that has not been taught about marks from printing them.\n"
    "const TAUGHT_MARK = /\\{\\{([\\s\\S]+?)\\}\\}/g;\n"
    "\n"
    "function esc(s) {\n"
    "  return String(s == null ? \"\" : s)\n"
    "    .replace(TAUGHT_MARK, \"$1\")\n"
    "    .replace(/&/g, \"&amp;\")\n"
    "    .replace(/</g, \"&lt;\")\n"
    "    .replace(/>/g, \"&gt;\");\n"
    "}\n"
    "\n"
    "// Words carrying the board's colour marks, drawn in the colour the board gave\n"
    "// them: `{{taught word}}` green, `((picture part))` that part's colour,\n"
    "// `<<the part to decide>>` orange. The wall uses the board's colour meanings\n"
    "// (the teacher's rule of 24 September 2026), so a taught word copied onto a\n"
    "// sentence stem, a table cell or a section's note is green here as well.\n"
    "function markedHtml(text) {\n"
    "  return criteriaSegments(text)\n"
    "    .map((segment) => (segment.colour ? `<span style=\"color:${segment.colour};\">${esc(segment.text)}</span>` : esc(segment.text)))\n"
    "    .join(\"\");\n"
    "}\n")

replace_once(SHARED,
    "module.exports = {\n"
    "  esc,\n",
    "module.exports = {\n"
    "  esc,\n"
    "  markedHtml,\n")

# ── panels: sticky and worked example purple, the stem neutral ───────────────
replace_once(PANELS,
    "const { esc, mm, hash, imgTag, visualTag, titleBarHtml, panelHtml, panelWithVisualHtml, twoUpPanelsHtml } = require(\"./shared\");\n",
    "const { esc, markedHtml, mm, hash, imgTag, visualTag, titleBarHtml, panelHtml, panelWithVisualHtml, twoUpPanelsHtml } = require(\"./shared\");\n")

replace_once(PANELS,
    "// One centred bold line per body item. Use padding rather than margins so\n"
    "// consecutive line spacing does not collapse.\n",
    "// One centred bold line per body item, drawn with the board's colour marks (a\n"
    "// taught word green). Use padding rather than margins so consecutive line\n"
    "// spacing does not collapse.\n")

replace_once(PANELS,
    "    `font-size:${pt}pt;color:${hash(style.colours.body)};\">${esc(text)}</div>`\n"
    "  );\n"
    "}\n"
    "\n"
    "function optionalCardImagePath(card) {\n",
    "    `font-size:${pt}pt;color:${hash(style.colours.body)};\">${markedHtml(text)}</div>`\n"
    "  );\n"
    "}\n"
    "\n"
    "function optionalCardImagePath(card) {\n")

replace_once(PANELS,
    "  const items = card.items || [];\n"
    "  const fillColour = style.colours.stickyPanelFill;\n",
    "  const shown = card.items || [];\n"
    "  // The fits measure the words a child reads, never a colour mark.\n"
    "  const items = shown.map((item) => ({ ...item, text: plainCriteria(item.text) }));\n"
    "  const fillColour = style.colours.stickyPanelFill;\n")

replace_once(PANELS,
    "  const panelChildrenHtml = items.map((item) => bodyLineHtml(item.text, bodyPt, style)).join(\"\");\n",
    "  const panelChildrenHtml = shown.map((item) => bodyLineHtml(item.text, bodyPt, style)).join(\"\");\n")

replace_once(PANELS,
    "  const items = definition ? [{ text: definition }] : [{ text: \"\" }];\n",
    "  const items = definition ? [{ text: plainCriteria(definition) }] : [{ text: \"\" }];\n")

replace_once(PANELS,
    "  const fitItems = items.length > 0 ? items : [{ text: \"\" }];\n",
    "  const fitItems = items.length > 0 ? items.map((item) => ({ ...item, text: plainCriteria(item.text) })) : [{ text: \"\" }];\n")

replace_once(PANELS,
    "    `font-size:${bodyPt}pt;color:${hash(style.colours.body)};\">${esc(text)}</span>` +\n",
    "    `font-size:${bodyPt}pt;color:${hash(style.colours.body)};\">${markedHtml(text)}</span>` +\n")

replace_once(PANELS,
    "// ─── Sticky knowledge: blue panel, big bold body ────────────────────────\n",
    "// ─── Sticky knowledge: purple panel, big bold body ──────────────────────\n")

replace_once(PANELS,
    "// ─── Worked example: green panel + green numbered badges ────────────────\n",
    "// ─── Worked example: purple panel + green numbered badges ───────────────\n"
    "// The panel is the worked-example purple, the board's sticky purple; the step\n"
    "// badges stay the green of the success-criteria steps they copy.\n")

replace_once(PANELS,
    "// ─── Sentence stem: green panel, bullet stems with ___ blanks ───────────\n"
    "// Mirrors helpers.js#stemParagraph: bullet + text, both bold, the bullet\n"
    "// itself in the panel accent colour. Filled lines (the modelled completion)\n"
    "// sit directly beneath in accent colour, no bullet, indented to match the\n"
    "// bullet text above.\n",
    "// ─── Sentence stem: neutral panel, bullet stems with ___ blanks ─────────\n"
    "// Mirrors helpers.js#stemParagraph: bullet + text, both bold. Filled lines\n"
    "// (the modelled completion, a worked example of the stem) sit directly\n"
    "// beneath in the worked-example purple, no bullet, indented to match the\n"
    "// bullet text above. A taught word marked `{{word}}` is green in either.\n")

replace_once(PANELS,
    "    `<span style=\"color:${hash(style.colours.body)};\">${esc(text)}</span>` +\n"
    "    `</div>`\n"
    "  );\n"
    "}\n"
    "\n"
    "function filledParagraphHtml(text, bodyPt, accentColour, style) {\n",
    "    `<span style=\"color:${hash(style.colours.body)};\">${markedHtml(text)}</span>` +\n"
    "    `</div>`\n"
    "  );\n"
    "}\n"
    "\n"
    "function filledParagraphHtml(text, bodyPt, accentColour, style) {\n")

replace_once(PANELS,
    "    `color:${hash(accentColour)};\">${esc(text)}</div>`\n"
    "  );\n"
    "}\n"
    "\n"
    "function renderSentenceStem(",
    "    `color:${hash(accentColour)};\">${markedHtml(text)}</div>`\n"
    "  );\n"
    "}\n"
    "\n"
    "function renderSentenceStem(")

# The stem's two fits (the floor probe and the body fit) measure only the words
# a child reads, never the marks; one replacement, since the probe's lines are
# the same in three renderers and only the stem's is followed by its fit.
replace_once(PANELS,
    "      items.length > 0 ? items : [{ text: \"\" }],\n"
    "      minBodyPt(card, style),\n"
    "      card.page.size,\n"
    "      card.page.orientation,\n"
    "      style,\n"
    "      { widthOverride, titleAreaInches: titleBarHeightInches(titlePt) + reserve, ...stackedBodyOpts(card, panelFraction) }\n"
    "    );\n"
    "  const wideVisualReserve = wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor);\n"
    "  const titleAreaInches = titleBarHeightInches(titlePt) + wideVisualReserve;\n"
    "  // The draw uses the number the reserve was made with; the 0.25in is the\n"
    "  // gap `wideVisualReserveInches` adds above the figure.\n"
    "  const maxVisualHeightIn = wideVisualReserve > 0 ? wideVisualReserve - 0.25 : undefined;\n"
    "\n"
    "  // Autofit treats each filled line as an extra body line so the pair sizes\n"
    "  // down together rather than overflowing the panel.\n"
    "  const fitItems = [];\n"
    "  for (const item of items) {\n"
    "    fitItems.push({ text: item.text });\n"
    "    if (item.filled) fitItems.push({ text: item.filled });\n"
    "  }\n",
    "      items.length > 0 ? items.map((item) => ({ ...item, text: plainCriteria(item.text) })) : [{ text: \"\" }],\n"
    "      minBodyPt(card, style),\n"
    "      card.page.size,\n"
    "      card.page.orientation,\n"
    "      style,\n"
    "      { widthOverride, titleAreaInches: titleBarHeightInches(titlePt) + reserve, ...stackedBodyOpts(card, panelFraction) }\n"
    "    );\n"
    "  const wideVisualReserve = wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor);\n"
    "  const titleAreaInches = titleBarHeightInches(titlePt) + wideVisualReserve;\n"
    "  // The draw uses the number the reserve was made with; the 0.25in is the\n"
    "  // gap `wideVisualReserveInches` adds above the figure.\n"
    "  const maxVisualHeightIn = wideVisualReserve > 0 ? wideVisualReserve - 0.25 : undefined;\n"
    "\n"
    "  // Autofit treats each filled line as an extra body line so the pair sizes\n"
    "  // down together rather than overflowing the panel. It measures the words a\n"
    "  // child reads, never the colour marks.\n"
    "  const fitItems = [];\n"
    "  for (const item of items) {\n"
    "    fitItems.push({ text: plainCriteria(item.text) });\n"
    "    if (item.filled) fitItems.push({ text: plainCriteria(item.filled) });\n"
    "  }\n")

# ── the labelled diagram's title is a title ──────────────────────────────────
replace_once(DISPLAY,
    "  const titleBarEl = titleBarHtml(titleText, style.colours.workedExampleTitleBarFill, style, titlePt, card.page.size, card.page.orientation);\n"
    "\n"
    "  const _v = pickVisual(card.visual, ctx);\n",
    "  // A title is blue, as the board's titles are: the anatomy poster is not a\n"
    "  // worked example, so it no longer borrows that card's colour.\n"
    "  const titleBarEl = titleBarHtml(titleText, style.colours.labelledDiagramTitleBarFill, style, titlePt, card.page.size, card.page.orientation);\n"
    "\n"
    "  const _v = pickVisual(card.visual, ctx);\n")

# ── grids: table cells carry their marks; vocab chips green ─────────────────
replace_once(GRIDS,
    "const { esc, mm, hash, imgTag, titleBarHtml, panelHtml } = require(\"./shared\");\n",
    "const { esc, markedHtml, mm, hash, imgTag, titleBarHtml, panelHtml } = require(\"./shared\");\n"
    "const { plainCriteria } = require(\"../../shared/text/criteria-marks\");\n")

replace_once(GRIDS,
    "    row.map((cell) => (cell && typeof cell === \"object\") ? \"\" : cell)\n",
    "    row.map((cell) => (cell && typeof cell === \"object\") ? \"\" : plainCriteria(cell))\n")

replace_once(GRIDS,
    "color:${hash(textColour)};\">${esc(cell)}</div>`;\n",
    "color:${hash(textColour)};\">${markedHtml(cell)}</div>`;\n")

replace_once(GRIDS,
    "// ─── Vocab chips: 2-column grid of white pills, teal 3pt outline ────────\n",
    "// ─── Vocab chips: 2-column grid of white pills, green 3pt outline ───────\n")

replace_once(GRIDS,
    "word bold teal",
    "word bold green")
assert_absent(GRIDS, "teal")

# ── the section family: the board's category colours, a green answer ────────
replace_once(SECTION,
    "const { esc, mm, hash, imgTag, titleBarHtml } = require(\"./shared\");\n",
    "const { esc, markedHtml, mm, hash, imgTag, titleBarHtml } = require(\"./shared\");\n"
    "const { plainCriteria } = require(\"../../shared/text/criteria-marks\");\n")

replace_once(SECTION,
    "// One theme per part, so a section reads as two or three distinct things at a\n"
    "// glance rather than one grey wall of boxes. Same hues the other families\n"
    "// already use, so a section does not look like a different product.\n"
    "const PART_THEMES = [\n"
    "  { strip: \"1F4E79\", fill: \"F2F7FB\", accent: \"1F4E79\" },\n"
    "  { strip: \"0D9488\", fill: \"F0FDFA\", accent: \"0D9488\" },\n"
    "  { strip: \"D97706\", fill: \"FEF6E7\", accent: \"B45309\" },\n"
    "  { strip: \"00B050\", fill: \"F1FBF4\", accent: \"00873E\" },\n"
    "];\n",
    "// One theme per part, so a section reads as two or three distinct things at a\n"
    "// glance rather than one grey wall of boxes. The hues are the board's own\n"
    "// category colours (`categoryColor`: blue, orange, purple), because the wall\n"
    "// uses the board's colour meanings (the teacher's rule of 24 September 2026):\n"
    "// green is a taught word or an answer, so it never tells parts apart. A fourth\n"
    "// part takes blue again, diagonally across the grid from the first.\n"
    "const PART_THEMES = [\n"
    "  { strip: \"0070C0\", fill: \"EEF5FB\", accent: \"0070C0\" },\n"
    "  { strip: \"E46C0A\", fill: \"FEF4EB\", accent: \"E46C0A\" },\n"
    "  { strip: \"7030A0\", fill: \"F4EEF9\", accent: \"7030A0\" },\n"
    "];\n"
    "\n"
    "// The answer a part works out is green, what an answer is on the board,\n"
    "// whatever the part's own colour. A part that shows a worked example, a\n"
    "// mistaken one included, is marked `worked: true` and its result is the\n"
    "// worked-example purple: a wrong result on green tells a child it is right.\n"
    "const RESULT_GREEN = \"00B050\";\n"
    "const RESULT_WORKED = \"7030A0\";\n")

replace_once(SECTION,
    "  if (result) items.push({ kind: \"result\", text: result });\n",
    "  if (result) items.push({ kind: \"result\", text: result, worked: part.worked === true });\n")

replace_once(SECTION,
    "        `<div style=\"flex:1;${font}color:#000000;\">${esc(item.text)}</div></div>`\n",
    "        `<div style=\"flex:1;${font}color:#000000;\">${markedHtml(item.text)}</div></div>`\n")

replace_once(SECTION,
    "      // The answer the part works out, marked the way the teacher's own wall\n"
    "      // marks it: its own coloured strip, so a child finds the result without\n"
    "      // reading the workings first.\n"
    "      return (\n"
    "        `<div data-part=\"result\" style=\"margin-top:${mm(0.07)}mm;background:${hash(theme.strip)};",
    "      // The answer the part works out, marked the way the teacher's own wall\n"
    "      // marks it: its own coloured strip, so a child finds the result without\n"
    "      // reading the workings first. The strip is answer green, or purple on a\n"
    "      // worked part.\n"
    "      return (\n"
    "        `<div data-part=\"result\" style=\"margin-top:${mm(0.07)}mm;background:${hash(item.worked ? RESULT_WORKED : RESULT_GREEN)};")

replace_once(SECTION,
    "    return `<div data-part=\"note\" style=\"text-align:center;${font}color:#000000;padding:${mm(0.02)}mm 0;\">${esc(item.text)}</div>`;\n",
    "    return `<div data-part=\"note\" style=\"text-align:center;${font}color:#000000;padding:${mm(0.02)}mm 0;\">${markedHtml(item.text)}</div>`;\n")

replace_once(SECTION,
    "      ? fitLinearBodySize(items, NOTE_PT, NOTE_MIN_PT, card.page.size, orientation, style, {\n",
    "      ? fitLinearBodySize(items.map((item) => ({ ...item, text: plainCriteria(item.text) })), NOTE_PT, NOTE_MIN_PT, card.page.size, orientation, style, {\n")

# ── the overview families ────────────────────────────────────────────────────
replace_once(OVERVIEW,
    "    overviewTextHtml(card.map.caption || \"\", 25, style, { color: style.colours.referenceTableHeaderFill });\n"
    "  const mapCellHtml = overviewCellHtml(mapInner, {\n"
    "    widthMm: mm(mapWidth / 1440),\n"
    "    fillColour: \"DEEAF1\",\n",
    "    overviewTextHtml(card.map.caption || \"\", 25, style);\n"
    "  const mapCellHtml = overviewCellHtml(mapInner, {\n"
    "    widthMm: mm(mapWidth / 1440),\n"
    "    fillColour: \"F4F6FA\",\n")

replace_once(OVERVIEW,
    "  const keyInner =\n"
    "    overviewTextHtml(card.keyHeading || \"The big idea\", 27, style, { color: \"0D9488\" }) +\n"
    "    overviewTextHtml(card.keySentence || \"\", 34, style);\n"
    "  const keyCellHtml = overviewCellHtml(keyInner, {\n"
    "    widthMm: mm(textWidth / 1440),\n"
    "    fillColour: \"F0FDFA\",\n",
    "  // The big idea is the one to keep, so it takes the sticky fact's purple.\n"
    "  const keyInner =\n"
    "    overviewTextHtml(card.keyHeading || \"The big idea\", 27, style, { color: style.colours.stickyPanelLine }) +\n"
    "    overviewTextHtml(card.keySentence || \"\", 34, style);\n"
    "  const keyCellHtml = overviewCellHtml(keyInner, {\n"
    "    widthMm: mm(textWidth / 1440),\n"
    "    fillColour: style.colours.stickyPanelFill,\n")

replace_once(OVERVIEW,
    "    overviewTextHtml(card.heroCaption || \"\", 26, style, { color: style.colours.referenceTableHeaderFill });\n",
    "    overviewTextHtml(card.heroCaption || \"\", 26, style);\n")

replace_once(OVERVIEW,
    "  // Each group is its own full-width tinted block stacked inside the\n"
    "  // callout column; a 90-before/90-after spacer sits between the two groups.\n"
    "  const groupBlocksHtml = groups.map((group, idx) => {\n"
    "    const groupInner =\n"
    "      overviewTextHtml(group.title, 34, style, { color: idx === 0 ? \"1F4E79\" : \"0D9488\" }) +\n",
    "  // Each group is its own full-width tinted block stacked inside the\n"
    "  // callout column; a 90-before/90-after spacer sits between the two groups.\n"
    "  // Two parallel groups take the board's default pairing, blue then orange.\n"
    "  const groupBlocksHtml = groups.map((group, idx) => {\n"
    "    const groupInner =\n"
    "      overviewTextHtml(group.title, 34, style, { color: idx === 0 ? \"0070C0\" : \"E46C0A\" }) +\n")

replace_once(OVERVIEW,
    "      fillColour: idx === 0 ? \"DEEAF1\" : \"F0FDFA\",\n",
    "      fillColour: idx === 0 ? \"DEEAF1\" : \"FFF2CC\",\n")

replace_once(OVERVIEW,
    "// ─── causeCards: exactly three cards, actor -> action -> teal reason ───\n",
    "// ─── causeCards: exactly three cards, actor -> action -> purple reason ─\n"
    "// The reason is the idea each card teaches, so it takes the purple of a\n"
    "// fact to keep (teal meant nothing on the board).\n")

replace_once(OVERVIEW,
    "      overviewTextHtml(\"↓\", 30, style, { color: \"0D9488\" }) +\n"
    "      overviewTextHtml(person.reason, 30, style, { color: \"0D9488\" });\n",
    "      overviewTextHtml(\"↓\", 30, style, { color: style.colours.stickyPanelLine }) +\n"
    "      overviewTextHtml(person.reason, 30, style, { color: style.colours.stickyPanelLine });\n")

for rel in (SECTION, OVERVIEW):
    for gone in ("0D9488", "1F4E79", "D97706"):
        assert_absent(rel, gone)

# ── the wall's own words about colour ────────────────────────────────────────
replace_once(WALL_VL,
    "The body sits on a bold-bordered, strong-coloured panel. Each card type has its own panel "
    "identity — green for worked examples, blue for sticky knowledge, red/green pair for "
    "misconceptions, and so on. This is how children learn \"the green cards are how-to-do-it cards\" "
    "without anyone telling them.",
    "The body sits on a bold-bordered, strong-coloured panel. Each card type has its own panel "
    "identity, and each colour means what it means on the board, so a child reads one colour "
    "language across the room: purple for a fact to keep and for a worked example (the board's sticky "
    "and worked-example purple), green for taught words and for the right answer beside a red wrong "
    "one, blue for titles and headers, and a neutral panel for a sentence stem or a reference table, "
    "where a taught word inside stays green. This is how children learn what each card is for "
    "without anyone telling them.")

replace_once(WALL_VL,
    "**Your job:** don't fight the type system. If the lesson teaches a procedure, that is a "
    "`workedExample` card; it goes on a green panel, with the green identity. Don't try to use a "
    "`stickyKnowledge` card to carry a procedure because the wording feels easier — children read the "
    "colour as the type, and a procedure on a blue panel reads as a fact, not a method.",
    "**Your job:** don't fight the type system. If the lesson teaches a procedure, that is a "
    "`workedExample` card; it goes on a purple panel with its steps numbered down the left. Don't try "
    "to use a `stickyKnowledge` card to carry a procedure because the wording feels easier. The two "
    "share purple, so children read the type from the card's shape: numbered steps ending in a worked "
    "example say method, one sentence says fact, and a procedure on a sticky card reads as a fact, not "
    "a method.")

replace_once(WALL_VL,
    "Card type drives colour: worked example green, sticky blue, misconception red+green, sentence stem "
    "green, reference table dark-blue header.",
    "Card type drives colour, in the board's meanings: worked example and sticky knowledge purple, "
    "vocabulary green, misconception red beside green, sentence stem neutral with its modelled line "
    "purple, and a blue title bar or header on every other card.")

replace_once(WALL_VL,
    "| Don't fight the type system | Pick the card type whose panel identity matches the content | A "
    "procedure on a blue panel reads as a fact; children stop trusting the colour grammar |",
    "| Don't fight the type system | Pick the card type whose panel identity matches the content | A "
    "procedure on a sticky card reads as a fact; children stop trusting what the card types mean |")

replace_once(WALL_VL,
    "gappy version on top in black, modelled version directly beneath in the green panel accent. The "
    "colour split between the two lines is the teaching — a supported child copies the green; an "
    "independent child uses the black.",
    "gappy version on top in black, modelled version directly beneath in purple, a worked example of "
    "the stem. The colour split between the two lines is the teaching — a supported child copies the "
    "purple; an independent child uses the black.")

replace_once(WALL_VL,
    "A subject-vocabulary card, identifiable by its teal title bar. The term in the bar, the "
    "child-language definition in the panel, the drawn example to the right. Children learn \"teal "
    "cards = vocabulary\" through repetition across the unit.",
    "A subject-vocabulary card, identifiable by its green title bar, the green every taught word is on "
    "the board. The term in the bar, the child-language definition in the panel, the drawn example to "
    "the right. Children learn \"green cards = vocabulary\" through repetition across the unit.")

replace_once(WALL_VL,
    "The lightweight half of the vocabulary identity, sharing the teal title bar. A grid of 4–12 short "
    "word chips on one A3 landscape page - each chip a teal-outlined box on white with the word "
    "bold-teal in the centre,",
    "The lightweight half of the vocabulary identity, sharing the green title bar. A grid of 4–12 short "
    "word chips on one A3 landscape page - each chip a green-outlined box on white with the word "
    "bold-green in the centre,")

replace_once(WALL_VL,
    "Same teal title bar, same teal accents, both pinned beneath the same `Vocabulary` zoner.",
    "Same green title bar, same green accents, both pinned beneath the same `Vocabulary` zoner.")

replace_once(WALL_VL,
    "Children learn the teal family by repetition:",
    "Children learn the green family by repetition:")

replace_once(WALL_VL,
    "| A procedure on a sticky-knowledge panel | The blue panel says \"fact\". A procedure on it reads as "
    "a fact, not a method. Children stop trusting the colour grammar across the unit. |",
    "| A procedure on a sticky-knowledge panel | The sticky card says \"fact\": one sentence to keep, where "
    "a method has numbered steps. A procedure on it reads as a fact, not a method, and children stop "
    "trusting what the card types mean across the unit. |")

assert_absent(WALL_VL, "teal")
assert_absent(WALL_VL, "the green cards are how-to-do-it cards")

replace_once(WALL_PREF,
    "The card then prints the gappy version on top and the fully-modelled version directly beneath in "
    "the panel accent colour, so the contrast is doing the teaching.",
    "The card then prints the gappy version on top and the fully-modelled version directly beneath in "
    "purple, the worked-example colour, so the contrast is doing the teaching.")

replace_once(WALL_PREF,
    "Each chip is the word in bold teal in a teal-outlined box,",
    "Each chip is the word in bold green in a green-outlined box, the green every taught word is on the board,")

assert_absent(WALL_PREF, "teal")

replace_once(WALL_CC,
    "If nothing earns a card, the file is still written with `cards: []`,",
    "**Colour marks carry over.** Words copied from the board keep its colour marks, and the renderer "
    "draws them in the board's colours: a taught word written `{{word}}` is green in a worked example's "
    "steps and lines, a sticky fact, a vocabulary definition, a misconception's two sides, a sentence "
    "stem, a reference-table cell and a section's notes and steps, as it is on the board, and "
    "`((part))` and `<<decide>>` keep theirs. On a title, a heading or a coloured strip the word prints "
    "plain, and a mark's braces never print anywhere. Every other colour on the wall is the renderer's, "
    "in the board's meanings.\n"
    "\n"
    "If nothing earns a card, the file is still written with `cards: []`,")

replace_once(WALL_CC,
    "| `cards[].parts[].result` | Optional single answer line, printed on its own coloured strip so a child "
    "finds the result before the workings: `347 rounds to 350.` |\n",
    "| `cards[].parts[].result` | Optional single answer line, printed on its own coloured strip so a child "
    "finds the result before the workings: `347 rounds to 350.` |\n"
    "| `cards[].parts[].worked` | `true` when the part shows a worked example rather than the answer, a "
    "mistaken one always (`Sam wrote 340.`): its result strip is the worked-example purple, as on the "
    "board. Without it the strip is answer green, which tells a child the result is right. |\n")

print("wall done")
