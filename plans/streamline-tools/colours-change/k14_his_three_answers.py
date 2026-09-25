"""The colours release, step 14: his answers to the three details the second
round's renders left for him (25 September 2026, recorded in the
rest-of-preferences ledger as "Three colour details left by the colours
release's repairs"): "1. yes 2. leave it 3. yes".

1. The ring round the digit a worked row changed is purple with its row, never
   green, a mistaken row included: nothing on a worked row is green.
2. A wall section's third part stays the board's category purple: no change.
3. A method frame on a worksheet is purple only when it shows worked numbers;
   an empty one, the child's to fill in every box, looks as it did before this
   release: an ink edge and a question-blue heading. A frame partly filled by
   the example is judged by its lines: as soon as one line is worked right
   through (every value in it written, no box left for the child), the frame
   shows worked numbers and is purple; a frame whose every line still holds a
   box for the child is the child's, whatever numbers it hands them to start
   from. The board's method frame is the teacher's, drawn as he models it, and
   stays purple.

Run after `k8_repin_other_topics.py` and before `build_colours_mapping.py`.
"""
from _patch import MATHSH, PROFILE, TMPL, assert_absent, replace_once

CHART = "shared/visuals/place-value-chart-svg.js"
METHODS = "worksheet-html/src/helpers/methods.js"
TOKENS = "worksheet-html/src/tokens.js"

# ── 1. the ring on a worked row is purple ────────────────────────────────────
replace_once(CHART,
    "          // never `answer`, and every digit in it is the worked-example purple, the\n"
    "          // ringed one included: green in the ring would call a wrong digit right.\n",
    "          // never `answer`, and every digit in it is the worked-example purple, the\n"
    "          // ringed one included, and so is the ring (his answer of 25 September\n"
    "          // 2026, shown it still green: \"yes\" to purple): green anywhere on a\n"
    "          // worked row would call a wrong digit right.\n")

replace_once(CHART,
    "          if (picked) rings.push({ x: cx + ringInset, y: dy + ringInset, w: colWs[i] - 2 * ringInset, h: digitH - 2 * ringInset, sw: ringW, column: c });\n"
    "          cx += colWs[i];\n",
    "          const ringStroke = row.worked && !row.answer ? pal.worked : pal.ring;\n"
    "          if (picked) rings.push({ x: cx + ringInset, y: dy + ringInset, w: colWs[i] - 2 * ringInset, h: digitH - 2 * ringInset, sw: ringW, column: c, stroke: ringStroke });\n"
    "          cx += colWs[i];\n")

replace_once(CHART,
    "fill=\"none\" stroke=\"${L.pal.ring}\" stroke-width=\"${f2(r.sw)}\"/>`));\n",
    "fill=\"none\" stroke=\"${r.stroke || L.pal.ring}\" stroke-width=\"${f2(r.sw)}\"/>`));\n")

replace_once(TMPL,
    "A row is `answer` or `worked`, never both. Every digit on a worked row is purple, the ringed one "
    "included, so a wrong digit is never printed green.",
    "A row is `answer` or `worked`, never both. Every digit on a worked row is purple, the ringed one "
    "included, and so is its ring: nothing on a worked row is green, so a wrong digit is never printed "
    "as right.")

replace_once(PROFILE,
    "and every digit in them is purple, the ringed one included.",
    "and every digit in them is purple, the ringed one and its ring included.")

replace_once(PROFILE,
    "and the sheet's method frame matches it.",
    "and the sheet's method frame matches it when it shows worked numbers; an empty one, the child's "
    "to fill in every box, keeps its ink edge and blue heading.")

# ── 3. a worksheet's method frame is purple only when it shows worked numbers ─
replace_once(METHODS,
    "function renderMethodFrame(spec) {\n"
    "  const lines = frameLines(spec);\n"
    "  const labelMm = labelColumnMm(lines);\n"
    "  const framed = spec.frame !== false;\n",
    "// A frame shows worked numbers when one of its lines is worked right through:\n"
    "// every value written, no box left for the child. Only then is it a worked\n"
    "// example, in the worked-example purple (his answer of 25 September 2026); a\n"
    "// frame whose every line still holds a box is the child's, whatever numbers\n"
    "// it hands them to start from, and keeps the ink edge and blue heading.\n"
    "function showsWorkedNumbers(lines) {\n"
    "  return lines.some((line) => {\n"
    "    const segs = tokenize(line && line.content);\n"
    "    return segs.length > 0 && !segs.some((s) => s.box);\n"
    "  });\n"
    "}\n"
    "\n"
    "function renderMethodFrame(spec) {\n"
    "  const lines = frameLines(spec);\n"
    "  const labelMm = labelColumnMm(lines);\n"
    "  const framed = spec.frame !== false;\n"
    "  const worked = showsWorkedNumbers(lines);\n")

replace_once(METHODS,
    "<div class=\"h-mframe-panel${framed ? \" h-mframe-framed\" : \"\"}\">",
    "<div class=\"h-mframe-panel${framed ? \" h-mframe-framed\" : \"\"}${worked ? \" h-mframe-worked\" : \"\"}\">")

replace_once(METHODS,
    "  .h-mframe-framed {\n"
    "    background: var(--colour-tint);\n"
    "    border: var(--rule-line) solid var(--colour-worked);\n"
    "    box-sizing: border-box;\n"
    "  }\n"
    "  .h-mframe-title {\n"
    "    margin: 0 0 2mm;\n"
    "    font-size: var(--type-sectionLabel); font-weight: bold;\n"
    "    color: var(--colour-worked);\n"
    "    line-height: 1.35;\n"
    "  }\n",
    "  .h-mframe-framed {\n"
    "    background: var(--colour-tint);\n"
    "    border: var(--rule-line) solid var(--colour-ink);\n"
    "    box-sizing: border-box;\n"
    "  }\n"
    "  .h-mframe-title {\n"
    "    margin: 0 0 2mm;\n"
    "    font-size: var(--type-sectionLabel); font-weight: bold;\n"
    "    color: var(--colour-question);\n"
    "    line-height: 1.35;\n"
    "  }\n"
    "  /* A frame that shows worked numbers is a worked example: its edge and title\n"
    "     take the worked-example purple, as the board's frame does. */\n"
    "  .h-mframe-framed.h-mframe-worked { border-color: var(--colour-worked); }\n"
    "  .h-mframe-worked .h-mframe-title { color: var(--colour-worked); }\n")

replace_once(METHODS,
    "     than the system has. The frame's own edge and title are the worked-example\n"
    "     purple here and on the board alike (the teacher's rule of 24 September\n"
    "     2026), so the child meets the frame they watched the teacher fill. */\n",
    "     than the system has. The frame's own edge and title are the worked-example\n"
    "     purple when the frame shows worked numbers, as the board's is (the\n"
    "     teacher's rule of 24 September 2026); an empty frame, the child's to fill,\n"
    "     keeps its ink edge and question-blue heading (his answer of 25 September). */\n")

replace_once(TOKENS,
    "  worked: \"#7030A0\", // a worked example's frame: the edge of a method frame and its\n"
    "  // title, the method's name, which is words a child reads. The deck's sticky and\n"
    "  // worked-example purple (the teacher's rule of 24 September 2026), so the frame\n"
    "  // a child fills is the one they watched the teacher fill on the board. What a\n"
    "  // child writes, and the frame's labels, stay ink.\n",
    "  worked: \"#7030A0\", // a worked example's frame: the edge and title of a method\n"
    "  // frame that shows worked numbers, the title being words a child reads. The\n"
    "  // deck's sticky and worked-example purple (the teacher's rule of 24 September\n"
    "  // 2026). A frame the child fills in every line keeps its ink edge and blue\n"
    "  // title (his answer of 25 September). What a child writes, and the frame's\n"
    "  // labels, stay ink.\n")

replace_once(MATHSH,
    "The board draws the same frame, so the child meets one picture in both places.",
    "The board draws the same frame, so the child meets one picture in both places. "
    "A frame that shows worked numbers, one line or more worked right through, is a worked "
    "example and takes the worked-example purple on its edge and heading, as on the board; a "
    "frame the child fills in every line keeps its ink edge and blue heading.")

assert_absent(METHODS, "purple here and on the board alike")
print("his three answers done")
