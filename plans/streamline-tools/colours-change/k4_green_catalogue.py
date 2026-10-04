"""The colours release, step 4: green means a taught word or an answer, and the
template catalogue's exceptions he was shown are corrected (decision 11: "green
is vocabulary or an answer. So we'd have to fix those").

- A word inside a statement: "The [[tens]] column changes." coloured *tens*
  blue; it stays black (the ledger's own suggestion). A callout's line is bold
  throughout, so no word in it is picked out by bold, and the catalogue says so.
- A table's deciding word: bold, not blue, except in the first column, which is
  bold throughout; the catalogue says bold shows nothing there. The two code
  comments that gave the old rule (`answer-text.js` on `[[x]]`, and the place
  value chart on a wrong chain) follow; the chart's keeps its record that he
  greened that chain himself on 19 September.
- A callout's own colours: its green default ("what is true") and its blue
  "thing being decided on" were a colour grammar of their own. A statement
  callout is black-edged now, blue marks a question, orange and purple keep
  their board meanings, and green is not a callout colour (a green edge round
  black words is a frame, not an answer).
- A worked example printed green when the lesson is about to show it is wrong:
  it is not an answer. His answer, when told he had greened such a chain himself
  on 19 September: "purple is fine". So a place-value chart row takes a new
  `worked: true`, and its digits print in the worked-example purple, a mistaken
  worked example included, on every surface the shared chart draws. The ringed
  digit is purple too (the second check: it printed green in its ring, the one
  digit a mistaken chain is about); the ring is drawn as on any row.
- A word bank of taught words printed black: a chip written `{{word}}` is one of
  this lesson's taught words and prints in vocabulary green.
- Two out-of-date colour words this release carries (the change plan's B16):
  the tally summary's green My Turn rows (R97) and the maths helper guide's
  "question blue" ring (R95).
"""
from _patch import MATHSH, TMPL, assert_absent, replace_once

CALLOUT = "builder/src/content/callout.js"
CHIPS = "builder/src/content/chip-bank.js"

# ── the table's deciding word ────────────────────────────────────────────────
replace_once(TMPL,
    "The common use is `[[ ]]` on the deciding word of a branch/lookup table (the word that changes "
    "row to row), so a child's eye lands on it rather than reading every word at equal weight.",
    "The common use is `**bold**` on the deciding word of a branch/lookup table (the word that changes "
    "row to row), so a child's eye lands on it rather than reading every word at equal weight. The "
    "first column is bold throughout, so a deciding word there takes no mark: bold shows nothing "
    "in it. `[[ ]]` is question blue, and a deciding word is not a question.")

# ── a chain the lesson shows is wrong ────────────────────────────────────────
replace_once(TMPL,
    "Correctness is not the test. A worked chain the lesson is about to show is wrong still prints "
    "green, because green marks what the number IS, not whether it is right.",
    "A worked chain is a worked example, not an answer, and a worked example is purple, a mistaken one "
    "included: mark its rows `worked: true` (below) and never `answer`, because green tells a child the "
    "number is right.\n"
    "- `worked`: `true` marks the row as part of a worked example the class watches, finished or about to "
    "be shown wrong, and prints its digits in the worked-example purple, the sticky fact's colour. A row "
    "is `answer` or `worked`, never both. Every digit on a worked row is purple, the ringed one "
    "included, so a wrong digit is never printed green.")

# ── the tally summary (R97, out of date) ─────────────────────────────────────
replace_once(TMPL,
    "A `total` with the green `||` marker (`\"||12\"`) reveals that frequency as a worked answer — for "
    "the modelled rows on a My Turn and the whole column on an answer slide.",
    "A `total` with the green `||` marker (`\"||12\"`) reveals that frequency as an answer, on an "
    "answer slide; a My Turn models its frequencies in plain black (see `tally-chart`).")

# ── the word bank's taught words ─────────────────────────────────────────────
replace_once(TMPL,
    "A titled word bank in the warm variant (the White Rose word-bank look):\n"
    "```json\n"
    "{ \"type\": \"chip-bank\", \"title\": \"Word bank\", \"variant\": \"yellow\",\n"
    "  \"chips\": [\"square\", \"rectangle\", \"rhombus\", \"parallelogram\", \"trapezium\"] }\n"
    "```\n",
    "A titled word bank of the lesson's taught words in the warm variant (the White Rose word-bank "
    "look), each marked so it prints green:\n"
    "```json\n"
    "{ \"type\": \"chip-bank\", \"title\": \"Word bank\", \"variant\": \"yellow\",\n"
    "  \"chips\": [\"{{square}}\", \"{{rectangle}}\", \"{{rhombus}}\", \"{{parallelogram}}\", \"{{trapezium}}\"] }\n"
    "```\n")

replace_once(TMPL,
    "- `yellow` — the warm word-bank look (pale yellow fill, orange outline, black text), matching the "
    "White Rose word banks. Use for a vocabulary / word bank.\n",
    "- `yellow` — the warm word-bank look (pale yellow fill, orange outline, black text), matching the "
    "White Rose word banks. Use for a vocabulary / word bank.\n"
    "\n"
    "**A taught word in a bank is green, in any variant.** Write a chip that is one of this lesson's "
    "taught words as `{{square}}`: it prints in vocabulary green, as a taught word does everywhere a "
    "child reads it, and the braces never print. Other chips keep the variant's own text colour.\n")

# ── the callout's colours ────────────────────────────────────────────────────
replace_once(TMPL,
    "  \"text\": \"The [[tens]] column changes.\",\n",
    "  \"text\": \"The tens column changes.\",\n")

replace_once(TMPL,
    "- `variant` — the box's colour, and what it says about the line: `\"green\"` (default) an "
    "observation about what happened or what is true, `\"blue\"` the thing being decided on, "
    "`\"orange\"` information the question supplies, `\"purple\"` the objective.",
    "- `variant` — the box's colour, and what it says about the line, in the board's own colour "
    "meanings: `\"black\"` (default) an observation about what happened or what is true, black like "
    "every statement on the board; `\"blue\"` a question the class answers, whose words go in `[[ ]]` "
    "so they print blue like every other question; `\"orange\"` information the question supplies; "
    "`\"purple\"` the objective. Green is not a callout colour: a green edge round black words is a "
    "frame, not an answer, so an answer inside a callout carries its own green marker on its words.")

replace_once(TMPL,
    "`[[tens]]` is focus blue, `{{sum}}` answer green, `<<358>>` supplied orange, `**not**` plain bold "
    "stress. So \"The [[tens]] column changes.\" colours *tens* in exactly the blue the rest of the deck "
    "uses for the word being decided on.",
    "`[[ ]]` is question blue, `{{sum}}` answer green, `<<358>>` supplied orange, `**not**` plain bold "
    "stress. So \"The tens column changes.\" stays black, because a statement is black on every "
    "slide and `[[ ]]` is kept for a question; and a callout's line is bold throughout, so no word "
    "in it is picked out by `**bold**`.")

assert_absent(TMPL, "The [[tens]] column changes.")
assert_absent(TMPL, "Correctness is not the test.")

replace_once(CALLOUT,
    "// Key words inside the line carry colour with the deck's ordinary inline markers,\n"
    "// which is why there is no separate colouring mechanism here: `[[tens]]` is the\n"
    "// focus blue, `{{green}}` the answer green, `<<orange>>` supplied information,\n"
    "// `**bold**` plain stress. So \"The [[tens]] column changes.\" colours \"tens\" in\n"
    "// exactly the blue every other slide uses for the word being decided on.\n",
    "// Key words inside the line carry colour with the deck's ordinary inline markers,\n"
    "// which is why there is no separate colouring mechanism here: `[[ ]]` is question\n"
    "// blue, `{{green}}` the answer green, `<<orange>>` supplied information,\n"
    "// `**bold**` plain stress (the line is bold throughout, so bold picks out no\n"
    "// word here). So \"The tens column changes.\" stays black: a statement is black\n"
    "// on every slide, and blue is a question.\n")

replace_once(CALLOUT,
    "// The house colours, each saying something different about the line inside:\n"
    "//   green  an observation about what happened or what is true — the default,\n"
    "//          because that is what a callout beside a diagram nearly always is\n"
    "//   blue   the focus: the thing the class is deciding on\n"
    "//   orange information the question supplies\n"
    "//   purple the objective / what we are learning to do\n"
    "const VARIANTS = {\n"
    "  green:  { fill: 'D5F5E3', line: COLOURS.green  },\n"
    "  blue:   { fill: 'DEEAF1', line: COLOURS.title  },\n"
    "  orange: { fill: 'FFF2CC', line: COLOURS.orange },\n"
    "  purple: { fill: 'EDE3F5', line: COLOURS.lo     }\n"
    "};\n"
    "const DEFAULT_VARIANT = 'green';\n",
    "// The house colours, each saying what the same colour says everywhere else on\n"
    "// the board (the teacher's rule of 24 September 2026: green is a taught word or\n"
    "// an answer, blue a question or a short task):\n"
    "//   black  an observation about what happened or what is true: the default,\n"
    "//          because that is what a callout beside a diagram nearly always is,\n"
    "//          and a statement is black on every slide\n"
    "//   blue   a question the class answers (its words carry `[[ ]]`)\n"
    "//   orange information the question supplies\n"
    "//   purple the objective / what we are learning to do\n"
    "// Green was the default until then, and a green edge round black words is a\n"
    "// frame, not an answer; a spec that still names it gets the default.\n"
    "const VARIANTS = {\n"
    "  black:  { fill: 'F2F2F2', line: COLOURS.body   },\n"
    "  blue:   { fill: 'DEEAF1', line: COLOURS.title  },\n"
    "  orange: { fill: 'FFF2CC', line: COLOURS.orange },\n"
    "  purple: { fill: 'EDE3F5', line: COLOURS.lo     }\n"
    "};\n"
    "const DEFAULT_VARIANT = 'black';\n")

# ── the chip bank prints a taught word green ─────────────────────────────────
replace_once(CHIPS,
    "const DEFAULT_VARIANT = 'blue';\n"
    "// ─── END CONSTANTS ────────────────────────────────────────────\n",
    "const DEFAULT_VARIANT = 'blue';\n"
    "// A chip wrapped whole in `{{ }}` is one of this lesson's taught words. It\n"
    "// prints in vocabulary green, as a taught word does everywhere a child reads\n"
    "// it, and the braces never print. A word bank of taught words printed black\n"
    "// was one of the exceptions the teacher had corrected (24 September 2026:\n"
    "// \"green is vocabulary or an answer\").\n"
    "const TAUGHT_CHIP = /^\\{\\{([\\s\\S]+)\\}\\}$/;\n"
    "// ─── END CONSTANTS ────────────────────────────────────────────\n"
    "\n"
    "function chipOf(raw) {\n"
    "  const text = String(raw == null ? '' : raw);\n"
    "  const match = TAUGHT_CHIP.exec(text.trim());\n"
    "  return match\n"
    "    ? { label: match[1].trim(), taught: true }\n"
    "    : { label: text, taught: false };\n"
    "}\n")

replace_once(CHIPS,
    "// Greedily pack chips into rows no wider than maxW. Returns an array of rows,\n"
    "// each row an array of { label, w }.\n"
    "function packRows(chips, fontPt, maxW) {\n"
    "  const rows = [];\n"
    "  let row = [];\n"
    "  let rowW = 0;\n"
    "  chips.forEach(function (label) {\n",
    "// Greedily pack chips into rows no wider than maxW. Returns an array of rows,\n"
    "// each row an array of { label, w, taught }.\n"
    "function packRows(chips, fontPt, maxW) {\n"
    "  const rows = [];\n"
    "  let row = [];\n"
    "  let rowW = 0;\n"
    "  chips.forEach(function (chip) {\n"
    "    const label = chip.label;\n")

replace_once(CHIPS,
    "      rows.push(row);\n"
    "      row = [{ label: label, w: w }];\n"
    "      rowW = w;\n"
    "    } else {\n"
    "      row.push({ label: label, w: w });\n",
    "      rows.push(row);\n"
    "      row = [{ label: label, w: w, taught: chip.taught }];\n"
    "      rowW = w;\n"
    "    } else {\n"
    "      row.push({ label: label, w: w, taught: chip.taught });\n")

replace_once(CHIPS,
    "  const chips = (Array.isArray(data.chips) ? data.chips : [])\n"
    "    .map(function (c) { return String(c == null ? '' : c); })\n"
    "    .filter(function (c) { return c !== ''; });\n",
    "  const chips = (Array.isArray(data.chips) ? data.chips : [])\n"
    "    .map(chipOf)\n"
    "    .filter(function (c) { return c.label !== ''; });\n")

replace_once(CHIPS,
    "        color: variant.text, align: 'center', valign: 'middle', margin: 0, fit: FIT,\n",
    "        color: c.taught ? COLOURS.green : variant.text,\n"
    "        align: 'center', valign: 'middle', margin: 0, fit: FIT,\n")

# ── the two code comments that still gave the old rule ───────────────────────
replace_once("builder/src/answer-text.js",
    "//   [[x]]   bold + focus blue — the one word a reader must decide on\n"
    "//           (a branch/reference table's deciding word — e.g. \"Is the [[answer]] missing?\")\n",
    "//   [[x]]   bold + focus blue: the part of a line that asks, a question\n"
    "//           (e.g. \"Is the [[answer]] missing?\"); a table's deciding word is not a\n"
    "//           question and takes no blue\n")

replace_once("shared/visuals/place-value-chart-svg.js",
    "          // ring keeps its own meaning. Correctness is not the test: in the same\n"
    "          // edit he greened a worked chain that was wrong, because green marks\n"
    "          // what the number IS, not whether it is right.\n",
    "          // ring keeps its own meaning. In the same edit he greened a worked chain\n"
    "          // that was wrong; his later answer changed that: green is a taught word\n"
    "          // or an answer, and a worked example is purple, a mistaken one included\n"
    "          // (\"purple is fine\", 24 September 2026). So a worked row is `worked: true`,\n"
    "          // never `answer`, and every digit in it is the worked-example purple, the\n"
    "          // ringed one included: green in the ring would call a wrong digit right.\n"
    "          const worked = !isDot && row.worked && !row.answer && text !== '';\n")

replace_once("shared/visuals/place-value-chart-svg.js",
    "          if (text !== '') texts.push({ role: 'digit', text, x: cx + colWs[i] / 2, y: dy, h: digitH, pt: D, fill: (picked || revealed) ? pal.ring : pal.text, picked });\n",
    "          if (text !== '') texts.push({ role: 'digit', text, x: cx + colWs[i] / 2, y: dy, h: digitH, pt: D, fill: worked ? pal.worked : (picked || revealed) ? pal.ring : pal.text, picked });\n")

replace_once("shared/visuals/place-value-chart-svg.js",
    "//     answer     true prints this row's digits in answer green with no ring:\n"
    "//                the row is a result, not the number the question started from\n",
    "//     answer     true prints this row's digits in answer green with no ring:\n"
    "//                the row is a result, not the number the question started from\n"
    "//     worked     true prints this row's digits in the worked-example purple:\n"
    "//                the row is part of a worked example the class watches, a\n"
    "//                mistaken one included; never with `answer`\n")

replace_once("shared/visuals/place-value-chart-svg.js",
    "  ring: '#00B050',     // house answer-green\n",
    "  ring: '#00B050',     // house answer-green\n"
    "  worked: '#7030A0',   // the worked-example purple, the sticky fact's colour\n")

replace_once("shared/visuals/place-value-chart-svg.js",
    "  ring: '#1A1A1A',\n",
    "  ring: '#1A1A1A',\n"
    "  worked: '#1A1A1A',\n")

replace_once("shared/visuals/place-value-chart-svg.js",
    "    answer: row.answer === true,\n",
    "    answer: row.answer === true,\n"
    "    worked: row.worked === true,\n")

assert_absent("shared/visuals/place-value-chart-svg.js", "green marks what the number IS")
assert_absent("builder/src/answer-text.js", "table's deciding word —")

# ── the maths helper guide's ring (R95, out of date) ─────────────────────────
replace_once(MATHSH,
    "highlighted (the one digit that changed, ringed in the question blue).",
    "highlighted (the one digit that changed, ringed in green, the same ring the board draws).")

print("green catalogue done")
