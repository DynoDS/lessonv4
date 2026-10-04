"""The colours release, step 16: a taught word's braces never print from a
figure, on any surface (the third check, item 2, built the way the lead chose:
"one shared helper that takes the braces out of a figure's words wherever a
surface hands a spec to a shared drawing, the word printing plain inside a
figure, and a board helper that already greens a marked word keeping that").

A figure's words (a labelled diagram's callouts, a Venn's items, a chart's
names) are drawn into its picture by a shared drawing, which prints them as
written, so `{{enamel}}` came out with its braces on the board, the sheet, the
wall and the stick-in pack. One shared helper, `withoutTaughtMarks`, takes the
braces off every string in a figure's spec, and each surface applies it where
it hands a figure to a shared drawing:

- the board, once, to the lesson it draws and pre-renders (so a picture and
  the key it is filed under agree), for every figure the parity manifest
  lists; a caption the board sets as text through `answer-text.js` (a Venn's
  `label`, a shared figure's caption) keeps its mark and prints the word green,
  as it always did;
- the sheet, in its helper registry, for every figure the manifest lists;
- the wall, in its pre-render and its card lookup alike, so the two agree;
- the stick-in pack, for every piece.

Inside a picture the word prints plain: a figure has no green of its own for a
taught word. Run after `k15_third_check.py` and before `build_colours_mapping.py`.
"""
from _patch import WALL_CC, replace_once

MARKS = "shared/text/criteria-marks.js"
BUILD = "builder/build.js"
FIGURE_MARKS = "builder/src/figure-marks.js"
SHEET_INDEX = "worksheet-html/src/helpers/index.js"
WALL_SVG = "working-wall-html/src/svg-renderer.js"
WALL_VISUALS = "working-wall-html/src/visuals.js"
STICKIN = "stick-in-sheets-html/src/render-piece-html.js"

# ── the shared helper ──────────────────────────────────────────────────────
replace_once(MARKS,
    "module.exports = {\n"
    "  DECIDE_ORANGE,\n"
    "  TAUGHT_GREEN,\n",
    "// A figure's words, without a taught word's braces. A figure's words are drawn\n"
    "// into its picture by a shared drawing, which prints them as written, so every\n"
    "// surface takes the braces off before it hands a figure over: inside a picture\n"
    "// the word prints plain (the colours release's third check, 25 September\n"
    "// 2026). Every string anywhere in the spec is read; a spec with no mark comes\n"
    "// back as the same object, and one with a mark as a copy.\n"
    "const TAUGHT_MARK = /\\{\\{([\\s\\S]+?)\\}\\}/g;\n"
    "\n"
    "function carriesTaughtMark(value) {\n"
    "  if (typeof value === 'string') return value.includes('{{');\n"
    "  if (Array.isArray(value)) return value.some(carriesTaughtMark);\n"
    "  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {\n"
    "    return Object.values(value).some(carriesTaughtMark);\n"
    "  }\n"
    "  return false;\n"
    "}\n"
    "\n"
    "function withoutTaughtMarks(value) {\n"
    "  if (!carriesTaughtMark(value)) return value;\n"
    "  if (typeof value === 'string') return value.replace(TAUGHT_MARK, '$1');\n"
    "  if (Array.isArray(value)) return value.map(withoutTaughtMarks);\n"
    "  const out = {};\n"
    "  for (const [key, inner] of Object.entries(value)) out[key] = withoutTaughtMarks(inner);\n"
    "  return out;\n"
    "}\n"
    "\n"
    "module.exports = {\n"
    "  DECIDE_ORANGE,\n"
    "  TAUGHT_GREEN,\n"
    "  withoutTaughtMarks,\n")

# ── the board: the lesson it draws and pre-renders ─────────────────────────
from _patch import ROOT, announce  # noqa: E402

announce()
target = ROOT / FIGURE_MARKS
assert not target.exists(), FIGURE_MARKS
target.write_text(
    "'use strict';\n"
    "\n"
    "// A taught word's braces never print from a figure on the board (the colours\n"
    "// release's third check, 25 September 2026). A figure's words are drawn into\n"
    "// its picture by a shared drawing, which prints `{{enamel}}` as written, and\n"
    "// the board's own check for leftover marks reads only slide text, never a\n"
    "// picture. So the braces come off every figure in the lesson once, before it\n"
    "// is pre-rendered or drawn, and a picture and the key it is filed under\n"
    "// agree. A figure is anything the parity manifest lists for the board, but\n"
    "// the callout and the word bank, which are board text and draw their marks.\n"
    "//\n"
    "// A caption the board sets under a picture as text, through `answer-text.js`,\n"
    "// keeps its mark and prints the word green, as it always did: the `label` of\n"
    "// the figures whose helpers read it that way.\n"
    "\n"
    "const { PRIMITIVES } = require('../../shared/visual-parity');\n"
    "const { withoutTaughtMarks } = require('../../shared/text/criteria-marks');\n"
    "const { FIGURES: CAPTIONED } = require('./content/shared-figure');\n"
    "\n"
    "const BOARD_TEXT = new Set(['callout', 'chip-bank']);\n"
    "\n"
    "const FIGURE_TYPES = new Set(\n"
    "  PRIMITIVES.flatMap((p) => [].concat(p.slides || [])).filter((type) => type && !BOARD_TEXT.has(type))\n"
    ");\n"
    "\n"
    "// The helpers that set a figure's `label` under it through answer-text.\n"
    "const MARKED_CAPTION_TYPES = new Set([\n"
    "  'angle', 'carroll', 'geoboard', 'line-pair', 'rainforest-layers', 'reflection-grid',\n"
    "  'translation-shape', 'triangle', 'venn',\n"
    "  ...Object.keys(CAPTIONED).filter((type) => CAPTIONED[type] && CAPTIONED[type].caption)\n"
    "]);\n"
    "\n"
    "function withoutFigureMarks(node) {\n"
    "  if (Array.isArray(node)) return node.map(withoutFigureMarks);\n"
    "  if (!node || typeof node !== 'object' || Object.getPrototypeOf(node) !== Object.prototype) return node;\n"
    "  if (typeof node.type === 'string' && FIGURE_TYPES.has(node.type)) {\n"
    "    const plain = withoutTaughtMarks(node);\n"
    "    if (plain !== node && MARKED_CAPTION_TYPES.has(node.type) && node.label !== undefined) {\n"
    "      return Object.assign({}, plain, { label: node.label });\n"
    "    }\n"
    "    return plain;\n"
    "  }\n"
    "  let changed = false;\n"
    "  const out = {};\n"
    "  for (const [key, inner] of Object.entries(node)) {\n"
    "    out[key] = withoutFigureMarks(inner);\n"
    "    if (out[key] !== inner) changed = true;\n"
    "  }\n"
    "  return changed ? out : node;\n"
    "}\n"
    "\n"
    "module.exports = { withoutFigureMarks, FIGURE_TYPES, MARKED_CAPTION_TYPES };\n",
    encoding="utf-8", newline="\n")
print(f"wrote {target}")

replace_once(BUILD,
    "const { withoutDecorations } = require(\"../shared/decorations\");\n",
    "const { withoutDecorations } = require(\"../shared/decorations\");\n"
    "const { withoutFigureMarks } = require('./src/figure-marks');\n")

replace_once(BUILD,
    "  const coreLesson = withoutDecorations(lesson);\n",
    "  // A taught word's braces come off every figure before anything is drawn\n"
    "  // or pre-rendered (src/figure-marks.js).\n"
    "  const coreLesson = withoutFigureMarks(withoutDecorations(lesson));\n")

# ── the sheet: the helper registry ─────────────────────────────────────────
replace_once(SHEET_INDEX,
    "const { legibleWidthMm } = require(\"./shared\");\n",
    "const { legibleWidthMm } = require(\"./shared\");\n"
    "const { withoutTaughtMarks } = require(\"../../../shared/text/criteria-marks\");\n"
    "const { PRIMITIVES } = require(\"../../../shared/visual-parity\");\n")

replace_once(SHEET_INDEX,
    "const REGISTRY = {};\n"
    "for (const file of FILES) {\n"
    "  for (const [name, helper] of Object.entries(file.helpers)) {\n"
    "    if (REGISTRY[name]) {\n"
    "      throw new Error(\n"
    "        `DUPLICATE_HELPER: \"${name}\" is defined in two helper files.`\n"
    "      );\n"
    "    }\n"
    "    REGISTRY[name] = withLegibilityFloor(helper);\n"
    "  }\n"
    "}\n",
    "// A figure's words are drawn into its picture by a shared drawing, which\n"
    "// prints a taught word's braces as written, so every figure the parity\n"
    "// manifest lists for the sheet is handed its spec without them: inside a\n"
    "// picture the word prints plain (the colours release's third check).\n"
    "const FIGURE_HELPERS = new Set(PRIMITIVES.flatMap((p) => [].concat(p.worksheets || [])).filter(Boolean));\n"
    "\n"
    "function withPlainFigureWords(helper) {\n"
    "  const out = { ...helper };\n"
    "  for (const [key, fn] of Object.entries(helper)) {\n"
    "    if (typeof fn === \"function\") out[key] = (spec, ...rest) => fn(withoutTaughtMarks(spec), ...rest);\n"
    "  }\n"
    "  return out;\n"
    "}\n"
    "\n"
    "const REGISTRY = {};\n"
    "for (const file of FILES) {\n"
    "  for (const [name, helper] of Object.entries(file.helpers)) {\n"
    "    if (REGISTRY[name]) {\n"
    "      throw new Error(\n"
    "        `DUPLICATE_HELPER: \"${name}\" is defined in two helper files.`\n"
    "      );\n"
    "    }\n"
    "    REGISTRY[name] = withLegibilityFloor(FIGURE_HELPERS.has(name) ? withPlainFigureWords(helper) : helper);\n"
    "  }\n"
    "}\n")

# ── the wall: the pre-render and the card lookup, alike ────────────────────
replace_once(WALL_SVG,
    "const linePairShared = require('../../shared/visuals/line-pair-svg');\n",
    "const { withoutTaughtMarks } = require('../../shared/text/criteria-marks');\n"
    "const linePairShared = require('../../shared/visuals/line-pair-svg');\n")

replace_once(WALL_SVG,
    "  const collectVisual = (visual) => {\n"
    "    if (!visual) return;\n"
    "    if (visual._educationalSvgBuffer) return;\n",
    "  const collectVisual = (marked) => {\n"
    "    if (!marked) return;\n"
    "    if (marked._educationalSvgBuffer) return;\n"
    "    // A figure's words print plain, never a taught word's braces; the card\n"
    "    // lookup (visuals.js pickVisual) keys the same plain spec.\n"
    "    const visual = withoutTaughtMarks(marked);\n")

replace_once(WALL_VISUALS,
    "  labelDiagramKey,\n"
    "  badgeKey,\n"
    "  calloutKeySuffix,\n"
    "} = require(\"./svg-renderer\");\n",
    "  labelDiagramKey,\n"
    "  badgeKey,\n"
    "  calloutKeySuffix,\n"
    "} = require(\"./svg-renderer\");\n"
    "const { withoutTaughtMarks } = require(\"../../shared/text/criteria-marks\");\n")

replace_once(WALL_VISUALS,
    "function pickVisual(visual, ctx) {\n"
    "  if (!visual) return null;\n"
    "  if (visual._educationalSvgBuffer) {\n"
    "    return {\n"
    "      buf: visual._educationalSvgBuffer,\n"
    "      aspect: visual._educationalSvgAspect || 1,\n"
    "      alt: visual.alt || \"\",\n"
    "    };\n"
    "  }\n",
    "function pickVisual(marked, ctx) {\n"
    "  if (!marked) return null;\n"
    "  if (marked._educationalSvgBuffer) {\n"
    "    return {\n"
    "      buf: marked._educationalSvgBuffer,\n"
    "      aspect: marked._educationalSvgAspect || 1,\n"
    "      alt: marked.alt || \"\",\n"
    "    };\n"
    "  }\n"
    "  // Keyed on the figure's plain words, as the pre-render filed it.\n"
    "  const visual = withoutTaughtMarks(marked);\n")

# ── the stick-in pack: every piece ─────────────────────────────────────────
replace_once(STICKIN,
    "const { buildLabelDiagramSvg } = require(\"../../shared/visuals/label-diagram-svg\");\n",
    "const { buildLabelDiagramSvg } = require(\"../../shared/visuals/label-diagram-svg\");\n"
    "const { withoutTaughtMarks } = require(\"../../shared/text/criteria-marks\");\n")

replace_once(STICKIN,
    "async function renderPieceHtml(item, opts = {}) {\n",
    "async function renderPieceHtml(marked, opts = {}) {\n"
    "  // Every piece is a figure, and a figure's words print plain: a taught\n"
    "  // word's braces never reach the pack (the colours release's third check).\n"
    "  const item = withoutTaughtMarks(marked);\n")

# ── the contracts say it as it is ───────────────────────────────────────────
replace_once(WALL_CC,
    "On a title, a heading or a coloured strip the word prints plain, and a mark's braces never print anywhere.",
    "On a title, a heading, a coloured strip or inside a figure (a labelled diagram's labels, a Venn's items) "
    "the word prints plain, and a taught word's braces never print on any card or in any figure.")

# ── the tests that read each surface's drawn picture ────────────────────────
from _patch import NEW  # noqa: E402

for rel, name in (
    ("worksheet-html/test/figure-words-plain.test.js", "figure-words-plain.sheet.test.js"),
    ("stick-in-sheets-html/test/figure-words-plain.test.js", "figure-words-plain.stickin.test.js"),
):
    placed = ROOT / rel
    assert not placed.exists(), rel
    placed.write_bytes((NEW / name).read_bytes())
    print(f"wrote {placed}")

print("figure marks done")
