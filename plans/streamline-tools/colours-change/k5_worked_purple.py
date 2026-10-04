"""The colours release, step 5: a worked example is purple, the same colour as a
sticky fact (decision 11: "Worked examples can be something different. Maybe
purple."; then "worked example purple too").

Everywhere his answer reaches. Decision 11 named PF-R05, whose "Prepared
examples and `visible-in-unit` models ... stay black" is where a worked example
is written into the teaching: a prepared, finished example is a worked example,
so it is purple now, with a new `colorRole`, `worked-purple`, on its text lines
(a question card and a list item take it too), and a place-value chart row takes
`worked: true` (`k4`). A mistaken worked example is purple too: his answer, told
he had greened one himself on 19 September, was "purple is fine". Any other
drawn figure (a number line, a tally, a table's cells) keeps its own colours,
because it has no purple of its own; the words say so. Every copy of "prepared examples stay
black" follows: the playbook, the lesson-design contract, the slide designer,
the catalogue.

The board's `method-frame` drew a green "method" panel and title; it draws them
in the sticky purple now. Its twin on the sheet takes the same purple on its
edge and title, so the child meets one picture on board and paper; its labels
stay scaffold ink, as the teacher settled. The sheet gains a `worked` colour,
and its comments that counted four meanings follow. The success-criteria
panel's green box is unchanged (settled in 4.2.288).
"""
from _patch import PLAYBOOK, PREF, PROFILE, TMPL, assert_absent, replace_once

STYLES = "builder/src/styles.js"
PT = "builder/src/presentation-text.js"
FRAME = "builder/src/content/method-frame.js"
METHODS = "worksheet-html/src/helpers/methods.js"
TOKENS = "worksheet-html/src/tokens.js"
CONTRACT = "references/output-template.md"
SLIDE_DESIGNER = "agents/slide-designer.md"

replace_once(STYLES,
    "  sticky:      '7030A0',   // sticky-knowledge words, the LO's purple\n",
    "  sticky:      '7030A0',   // sticky-knowledge words, the LO's purple\n"
    "  // A worked example is the same purple as a sticky fact (the teacher's choice,\n"
    "  // 24 September 2026): a worked line, the method frame's panel and title, and\n"
    "  // the frame's pale ground.\n"
    "  worked:      '7030A0',\n"
    "  workedBg:    'EDE3F5',\n")

# ── the role a worked line takes ─────────────────────────────────────────────
replace_once(PT,
    "  'peer-blue',\n"
    "  'peer-purple'\n"
    "]);\n",
    "  'peer-blue',\n"
    "  'peer-purple',\n"
    "  'worked-purple'\n"
    "]);\n")

replace_once(PT,
    "  if (role === 'peer-purple') return COLOURS.lo;\n",
    "  if (role === 'peer-purple') return COLOURS.lo;\n"
    "  // A worked example the class sees finished (a prepared example, a\n"
    "  // `visible-in-unit` model): the sticky fact's purple.\n"
    "  if (role === 'worked-purple') return COLOURS.worked;\n")

# ── PF-R05 and its copies: a prepared example is a worked example ───────────
replace_once(PREF,
    "Prepared examples and `visible-in-unit` models are teaching content and stay black, even when "
    "they are complete.",
    "Prepared examples and `visible-in-unit` models are worked examples, finished before the class "
    "sees them, so they are purple, the same colour as a sticky fact, never answer green.")

replace_once(PLAYBOOK,
    "Prepared examples and visible-in-unit models stay black.",
    "Prepared examples and visible-in-unit models are worked examples, in purple (`worked-purple`).")

replace_once(CONTRACT,
    "- `visible-in-unit` stores a completed prepared model that is visible as ordinary black teaching "
    "content in its source unit. It is not an answer reveal.",
    "- `visible-in-unit` stores a completed prepared model that is visible in its source unit as a "
    "worked example, in the worked-example purple. It is not an answer reveal.")

replace_once(CONTRACT,
    "The resource designer renders the structured completed outcome as ordinary black teaching "
    "content inside that source unit's prepared model.",
    "The resource designer renders the structured completed outcome as a worked example, in the "
    "worked-example purple, inside that source unit's prepared model.")

replace_once(SLIDE_DESIGNER,
    "render the prepared model as ordinary black teaching content. Do not use answer-green styling.",
    "render the prepared model as a worked example, in purple (`colorRole: \"worked-purple\"` on its "
    "text lines). Do not use answer-green styling.")

replace_once(TMPL,
    "Prepared examples and `visible-in-unit` models remain body black.",
    "Prepared examples and `visible-in-unit` models are worked examples: give their lines "
    "`colorRole: \"worked-purple\"`.")

replace_once(TMPL,
    "Prepared teaching models stay black.",
    "Prepared teaching models are worked examples: give the card `colorRole: \"worked-purple\"`.")

replace_once(TMPL,
    "A completed prepared example or `visible-in-unit` model uses ordinary black text.",
    "A completed prepared example or `visible-in-unit` model is a worked example, but a cell takes no "
    "colour role, so in a table it stays the table's black.")

replace_once(TMPL,
    "- `peer-purple` - house purple for one item in a compact equal-status peer set.\n",
    "- `peer-purple` - house purple for one item in a compact equal-status peer set;\n"
    "- `worked-purple` - a worked example the class sees finished (a prepared example, a "
    "`visible-in-unit` model), in the sticky fact's purple, never answer green; a place-value chart row "
    "takes `worked: true` instead, and any other drawn figure keeps its own colours.\n")

replace_once(PROFILE,
    "The check refuses a whole-line emphasis on a sticky line by name.\n",
    "The check refuses a whole-line emphasis on a sticky line by name.\n"
    "- A worked example is purple, the same colour as a sticky fact. A prepared example or a "
    "`visible-in-unit` model written into the teaching gives its worked lines `colorRole: "
    "\"worked-purple\"`, on any slide, a teach layout's lines included; a question card, a list item "
    "and a step take the role too. The `method-frame` draws its panel and title purple for you, and "
    "the sheet's method frame matches it. A place-value chart's worked rows take `worked: true`, and "
    "every digit in them is purple, the ringed one included. On the wall the worked-example card is "
    "purple beside the sticky fact, and a section part marked `worked: true` shows its result on "
    "purple. Purple does not reach a figure with no purple of its own (a number line, a bar model, a "
    "tally, a table's cells), a worksheet's first worked row, or the good card of a strong-and-weak "
    "pair: those keep their own colours. A worked example is purple even when the lesson is about to "
    "show it is wrong, the teacher's word: \"purple is fine\". It is never answer green.\n")

assert_absent(PREF, "are teaching content and stay black")
assert_absent(PLAYBOOK, "models stay black")
assert_absent(CONTRACT, "ordinary black teaching content")
assert_absent(SLIDE_DESIGNER, "ordinary black teaching content")
assert_absent(TMPL, "remain body black")

# ── the method frame, board and sheet ────────────────────────────────────────
replace_once(FRAME,
    "//   title   optional heading (\"Adjusting strategy\") — green, sits above the lines\n"
    "//   frame   draw the green \"method\" panel behind the lines (default true)\n",
    "//   title   optional heading (\"Adjusting strategy\") — purple, sits above the lines\n"
    "//   frame   draw the purple \"method\" panel behind the lines (default true)\n")

replace_once(FRAME,
    "const PANEL_FILL      = 'E8F6EE';// pale green — lighter than the SC panel so white boxes pop\n"
    "const PANEL_LINE      = '00B050';// house green — the \"method\" identity\n",
    "// A worked example is purple, the same colour as a sticky fact (the teacher's\n"
    "// rule of 24 September 2026: green is kept for a taught word or an answer).\n"
    "const PANEL_FILL      = COLOURS.workedBg;// pale purple, light enough that white boxes pop\n"
    "const PANEL_LINE      = COLOURS.worked;  // the worked-example purple, the \"method\" identity\n")

replace_once(FRAME,
    "const TITLE_COLOUR    = '00B050';// green, matches the panel border\n",
    "const TITLE_COLOUR    = COLOURS.worked;  // purple, matches the panel border\n")

replace_once(TOKENS,
    "  given: \"#E46C0A\", // material handed to the child: word banks, supplied values.\n",
    "  given: \"#E46C0A\", // material handed to the child: word banks, supplied values.\n"
    "  worked: \"#7030A0\", // a worked example's frame: the edge of a method frame and its\n"
    "  // title, the method's name, which is words a child reads. The deck's sticky and\n"
    "  // worked-example purple (the teacher's rule of 24 September 2026), so the frame\n"
    "  // a child fills is the one they watched the teacher fill on the board. What a\n"
    "  // child writes, and the frame's labels, stay ink.\n")

replace_once(TOKENS,
    "  // frame, and it keeps the system to four meanings instead of five.\n",
    "  // frame, and it keeps scaffold from becoming a colour meaning of its own.\n")

replace_once(METHODS,
    "  .h-mframe-framed {\n"
    "    background: var(--colour-tint);\n"
    "    border: var(--rule-line) solid var(--colour-ink);\n",
    "  .h-mframe-framed {\n"
    "    background: var(--colour-tint);\n"
    "    border: var(--rule-line) solid var(--colour-worked);\n")

replace_once(METHODS,
    "  .h-mframe-title {\n"
    "    margin: 0 0 2mm;\n"
    "    font-size: var(--type-sectionLabel); font-weight: bold;\n"
    "    color: var(--colour-question);\n",
    "  .h-mframe-title {\n"
    "    margin: 0 0 2mm;\n"
    "    font-size: var(--type-sectionLabel); font-weight: bold;\n"
    "    color: var(--colour-worked);\n")

replace_once(METHODS,
    "     frame's sentence-starters are. Daniel settled this. On a worksheet blue\n"
    "     means the question, orange means material handed to the child, and green\n"
    "     means vocabulary, so a fourth meaning for \"the words that walk you through\n"
    "     the method\" would be a fifth colour the system does not have.\n"
    "     The slide deck's version of this frame IS green, and that is not an\n"
    "     inconsistency to fix: green on the board means a revealed answer, which is\n"
    "     a thing that cannot happen on paper. */\n",
    "     frame's sentence-starters are. Daniel settled this. On a worksheet blue\n"
    "     means the question, orange means material handed to the child, green\n"
    "     means vocabulary and purple frames a worked example, so another meaning\n"
    "     for \"the words that walk you through the method\" would be one colour more\n"
    "     than the system has. The frame's own edge and title are the worked-example\n"
    "     purple here and on the board alike (the teacher's rule of 24 September\n"
    "     2026), so the child meets the frame they watched the teacher fill. */\n")

FRAMES = "worksheet-html/src/helpers/frames.js"
replace_once(FRAMES,
    "// by having its own line, exactly as a writing frame's starters are, which\n"
    "// keeps the page to four colour meanings instead of five. A word bank IS\n",
    "// by having its own line, exactly as a writing frame's starters are, which\n"
    "// keeps scaffold from becoming a colour meaning of its own. A word bank IS\n")

replace_once(FRAMES,
    "  /* Set apart by weight and its own line rather than by a colour of its own,\n"
    "     which is the same way a writing frame's starters are set apart and the\n"
    "     reason the sheet still has four colour meanings rather than five. */\n",
    "  /* Set apart by weight and its own line rather than by a colour of its own,\n"
    "     which is the same way a writing frame's starters are set apart, so\n"
    "     scaffold never becomes a colour meaning of its own. */\n")

assert_absent(TOKENS, "four meanings instead of five")
assert_absent(METHODS, "a fifth colour the system does not have")
assert_absent(FRAMES, "four colour meanings")

replace_once(TMPL,
    "inside a green \"method\" panel, each line a stem",
    "inside a purple \"method\" panel (a worked example's colour), each line a stem")
replace_once(TMPL,
    "An ordered list of labelled lines inside a green \"method\" panel:",
    "An ordered list of labelled lines inside a purple \"method\" panel, the worked-example colour "
    "(the same purple as a sticky fact):")
replace_once(TMPL,
    "- `title` — optional green heading above the lines",
    "- `title` — optional purple heading above the lines")
replace_once(TMPL,
    "- `frame` — draw the green panel behind the lines.",
    "- `frame` — draw the purple panel behind the lines.")

assert_absent(TMPL, "green \"method\" panel")

# ── purple reaches a Teach slide's model and a step list (the second check) ─
# Sixteen of the seventeen saved prepared models the class sees finished sit on
# Teach units, whose slide is a teach layout, and a teach layout refused every
# colour role. It now takes the one a worked line is: `worked-purple`, on an
# explanation line, never on the question (blue) or the line to remember
# (purple already), and never with orange. A step list drew every step black
# whatever role it carried; a step marked `worked-purple` now prints purple,
# its number too, and any other role on a step is refused, not ignored.
TEACH = "builder/src/teach-layouts.js"
STEPS = "builder/src/content/steps.js"
VALIDATE = "builder/src/validate.js"

replace_once(TEACH,
    "// Uniformity is the builder's job on these slides, so the knobs that would undo\n"
    "// it are refused rather than quietly overridden.\n",
    "// Uniformity is the builder's job on these slides, so the knobs that would undo\n"
    "// it are refused rather than quietly overridden. One colour is the line's own\n"
    "// to say: a worked example is purple (the teacher's rule of 24 September\n"
    "// 2026), so `colorRole: \"worked-purple\"` passes and no other role does.\n")

replace_once(TEACH,
    "    const owned = OWNED_TEXT_KEYS.filter((k) => Object.prototype.hasOwnProperty.call(value, k));\n"
    "    if (owned.length) {\n"
    "      fail(where, `${owned.join(', ')} cannot be set on a teach-layout line; the layout ` +\n"
    "        'sets size, alignment and colour so every slide stays centred and even. Use ' +\n"
    "        '\"orange\": true to lift the one line that carries the weight.');\n"
    "    }\n",
    "    const owned = OWNED_TEXT_KEYS.filter((k) => Object.prototype.hasOwnProperty.call(value, k))\n"
    "      .filter((k) => !(k === 'colorRole' && value.colorRole === 'worked-purple'));\n"
    "    if (owned.length) {\n"
    "      fail(where, `${owned.join(', ')} cannot be set on a teach-layout line; the layout ` +\n"
    "        'sets size, alignment and colour so every slide stays centred and even. Use ' +\n"
    "        '\"orange\": true to lift the one line that carries the weight, and ' +\n"
    "        '\"colorRole\": \"worked-purple\" on the lines of a worked example.');\n"
    "    }\n")

replace_once(TEACH,
    "    if (value.orange === true) item.orange = true;\n",
    "    if (value.orange === true) item.orange = true;\n"
    "    if (value.colorRole === 'worked-purple') item.worked = true;\n")

replace_once(TEACH,
    "  if (item.orange && Array.isArray(item.emphasis) &&\n",
    "  if (item.worked && (role === 'question' || role === 'sticky')) {\n"
    "    fail(where, `a ${role === 'question' ? 'question stays blue' : 'line to remember is purple already'}; ` +\n"
    "      '\"worked-purple\" belongs on the lines of a worked example.');\n"
    "  }\n"
    "  if (item.worked && item.orange) {\n"
    "    fail(where, 'a worked example is purple, so this line cannot be orange as well. ' +\n"
    "      'Lift another line with orange, or none.');\n"
    "  }\n"
    "  if (item.orange && Array.isArray(item.emphasis) &&\n")

replace_once(TEACH,
    "  else if (slot.orange) out.color = TEACH_ORANGE;\n",
    "  else if (slot.orange) out.color = TEACH_ORANGE;\n"
    "  else if (slot.worked) out.colorRole = 'worked-purple';\n")

replace_once(STEPS,
    "// Ordinary steps stay as strings. A step that names a visible mark may instead\n"
    "// be { text, helper }; the legacy `figure` field remains accepted. Keeping the\n"
    "// normal string form avoids making every\n"
    "// criterion carry object boilerplate just because a small catalogue exists.\n"
    "function normaliseStep(step) {\n"
    "  if (step && typeof step === 'object' && !Array.isArray(step)) {\n"
    "    return {\n"
    "      text: step.text == null ? '' : String(step.text),\n"
    "      helper: helperKeyForStep(step)\n"
    "    };\n"
    "  }\n"
    "  return { text: String(step == null ? '' : step), helper: '' };\n"
    "}\n",
    "// Ordinary steps stay as strings. A step that names a visible mark may instead\n"
    "// be { text, helper }; the legacy `figure` field remains accepted. Keeping the\n"
    "// normal string form avoids making every\n"
    "// criterion carry object boilerplate just because a small catalogue exists.\n"
    "// A step of a worked example is { text, colorRole: 'worked-purple' }: its\n"
    "// words and its number print purple, the worked example's colour (the\n"
    "// teacher's rule of 24 September 2026). validate.js refuses any other role.\n"
    "function normaliseStep(step) {\n"
    "  if (step && typeof step === 'object' && !Array.isArray(step)) {\n"
    "    return {\n"
    "      text: step.text == null ? '' : String(step.text),\n"
    "      helper: helperKeyForStep(step),\n"
    "      worked: step.colorRole === 'worked-purple'\n"
    "    };\n"
    "  }\n"
    "  return { text: String(step == null ? '' : step), helper: '', worked: false };\n"
    "}\n")

replace_once(STEPS,
    "    slide.addShape(pptx.shapes.OVAL, {\n"
    "      x: rowX, y: badgeY, w: badgeW, h: badgeW,\n"
    "      fill: { color: COLOURS.green },\n"
    "      line: { color: COLOURS.green, width: 1 }\n"
    "    });\n",
    "    const badgeColour = step.worked ? COLOURS.worked : COLOURS.green;\n"
    "    slide.addShape(pptx.shapes.OVAL, {\n"
    "      x: rowX, y: badgeY, w: badgeW, h: badgeW,\n"
    "      fill: { color: badgeColour },\n"
    "      line: { color: badgeColour, width: 1 }\n"
    "    });\n")

replace_once(STEPS,
    "    slide.addText(splitAnswerRuns(step.text, true), {\n"
    "      x: textX, y: rowY,\n"
    "      w: textW, h: cardH,\n"
    "      fontFace: FONT, fontSize: textFont, bold: true,\n"
    "      color: COLOURS.body,\n",
    "    slide.addText(splitAnswerRuns(step.text, true), {\n"
    "      x: textX, y: rowY,\n"
    "      w: textW, h: cardH,\n"
    "      fontFace: FONT, fontSize: textFont, bold: true,\n"
    "      color: step.worked ? COLOURS.worked : COLOURS.body,\n")

replace_once(VALIDATE,
    "  forEachValue(slide, 'colorRole', (_value, owner) => check(owner));\n"
    "  forEachValue(slide, 'emphasis', (_value, owner) => check(owner));\n",
    "  forEachValue(slide, 'colorRole', (_value, owner) => check(owner));\n"
    "  forEachValue(slide, 'emphasis', (_value, owner) => check(owner));\n"
    "\n"
    "  // A step list draws one role, a worked example's purple (steps.js); any other\n"
    "  // role on a step would print black without a word, so it is refused.\n"
    "  forEachValue(slide, 'steps', (steps) => {\n"
    "    if (!Array.isArray(steps)) return;\n"
    "    steps.forEach((step, i) => {\n"
    "      if (!step || typeof step !== 'object' || step.colorRole === undefined) return;\n"
    "      if (step.colorRole === 'worked-purple') return;\n"
    "      errors.push(\n"
    "        `slide ${slideNumber}: step ${i + 1} carries colorRole ` +\n"
    "        `${JSON.stringify(step.colorRole)}, which a step list does not draw. A step ` +\n"
    "        `takes only \"worked-purple\", for a worked example set out as steps; take ` +\n"
    "        `the role off, or put the line in a text block that draws it.`\n"
    "      );\n"
    "    });\n"
    "  });\n")

replace_once(TMPL,
    "\n\n**Optional `heading`** — a short label rendered directly above the first step,",
    "\n\nA step of a worked example set out as steps is `{ \"text\": \"...\", \"colorRole\": "
    "\"worked-purple\" }`: its words and its number print purple, the worked example's colour, and the "
    "build refuses any other role on a step."
    "\n\n**Optional `heading`** — a short label rendered directly above the first step,")

replace_once(TMPL,
    "and orange on a line carrying a taught word). `align`, `fontSize`, `color` and the other sizing "
    "fields are refused on these slots, because the layout owns them.",
    "and orange on a line carrying a taught word). The lines of a worked example, a prepared model the "
    "class sees finished, take `\"colorRole\": \"worked-purple\"` and print purple; no other role is "
    "taken, and never on the question, the line to remember or an orange line. `align`, `fontSize`, "
    "`color` and the other sizing fields are refused on these slots, because the layout owns them.")

print("worked purple done")
