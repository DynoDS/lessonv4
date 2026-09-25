"""The colours release, step 17: the fourth check's repairs
(`colours-release-fourth-check.md`), as the lead passed them on.

- A worked step whose words carry a mark (`{{word}}`, `**bold**`) printed black
  apart from the marked word: the step list drew its words with no base colour,
  so every run took the body black. A worked step's runs now start from the
  worked-example purple, on a Teach slide's `steps` and `picture-steps` and a
  free-zone step list alike.
- The hex refusal told the designer to take the role off, where the fix is the
  colour: it now says to take the `color` off and keep the role.
- A method-frame line of words with no box counted as worked: only a line that
  writes its values out (a number in it, no box left) shows worked numbers now,
  and a line of words alone decides nothing.
- A one-moment stick-in pack printed its piece's label in the page caption as
  written, braces and all: a taught word's braces never print in a caption or a
  handle either.

Run after `k16_figure_marks.py` and before `k9_log_entry.py`.
"""
from _patch import replace_once

STEPS = "builder/src/content/steps.js"
CHECK = "builder/scripts/check-slide-design.js"
METHODS = "worksheet-html/src/helpers/methods.js"
STICKIN_BUILD = "stick-in-sheets-html/build.js"

# ── a marked worked step stays purple ──────────────────────────────────────
replace_once(STEPS,
    "    slide.addText(splitAnswerRuns(step.text, true), {\n"
    "      x: textX, y: rowY,\n",
    "    // A worked step's runs start from the worked purple, so a taught word or a\n"
    "    // bold word in it does not turn the rest of the step black (the fourth check).\n"
    "    slide.addText(splitAnswerRuns(step.text, true, step.worked ? COLOURS.worked : undefined), {\n"
    "      x: textX, y: rowY,\n")

# ── the hex refusal names the colour ───────────────────────────────────────
replace_once(CHECK,
    "      const fault = ownColour\n"
    "        ? `it also carries its own colour (\"${ownColour.trim()}\"), and a short task takes its blue from the role alone, never a hex`\n"
    "        : taskBlueFault(whole, facts);\n"
    "      if (!fault) return;\n"
    "      warnings.push({\n"
    "        signal: 'TASK_BLUE_NOT_A_SHORT_TASK',\n"
    "        slide: index + 1,\n"
    "        field: 'text',\n"
    "        message:\n",
    "      if (ownColour) {\n"
    "        warnings.push({\n"
    "          signal: 'TASK_BLUE_NOT_A_SHORT_TASK',\n"
    "          slide: index + 1,\n"
    "          field: 'text',\n"
    "          message:\n"
    "            `\"${whole.trim().slice(0, 60)}\" is marked task-blue and also carries its own colour ` +\n"
    "            `(\"${ownColour.trim()}\"). A short task takes its blue from the role alone, never a ` +\n"
    "            'hex: take the `color` off and keep `colorRole: \"task-blue\"`. If the line is not the ' +\n"
    "            'child\\'s own short task, take both off.'\n"
    "        });\n"
    "        return;\n"
    "      }\n"
    "      const fault = taskBlueFault(whole, facts);\n"
    "      if (!fault) return;\n"
    "      warnings.push({\n"
    "        signal: 'TASK_BLUE_NOT_A_SHORT_TASK',\n"
    "        slide: index + 1,\n"
    "        field: 'text',\n"
    "        message:\n")

# ── a line of words decides nothing ────────────────────────────────────────
replace_once(METHODS,
    "// A frame shows worked numbers when one of its lines is worked right through:\n"
    "// every value written, no box left for the child. Only then is it a worked\n",
    "// A frame shows worked numbers when one of its lines is worked right through:\n"
    "// its values written out (a number in it) and no box left for the child. A\n"
    "// line of words alone (\"Look at the ones digit.\") decides nothing (the\n"
    "// fourth check). Only a worked line makes the frame a worked\n")

replace_once(METHODS,
    "    return segs.length > 0 && !segs.some((s) => s.box);\n",
    "    return !segs.some((s) => s.box) && segs.some((s) => /\\d/.test(s.text));\n")

# ── the stick-in pack's caption and handles print a taught word plain ──────
replace_once(STICKIN_BUILD,
    "const { renderPieceHtml, esc } = require(\"./src/render-piece-html\");\n",
    "const { renderPieceHtml, esc } = require(\"./src/render-piece-html\");\n"
    "const { withoutTaughtMarks } = require(\"../shared/text/criteria-marks\");\n")

replace_once(STICKIN_BUILD,
    "  const captionText = moments.length === 1\n",
    "  // A piece's label or handle may carry a taught word's mark; the caption and\n"
    "  // the handle print the word plain, never its braces (the fourth check).\n"
    "  const captionText = withoutTaughtMarks(moments.length === 1\n")

replace_once(STICKIN_BUILD,
    "    : `✂ Cut along the dashed lines and stick in. Every child gets one of each labelled piece${handles.length ? `: ${handles.join(\", \")}` : \"\"}.`;\n",
    "    : `✂ Cut along the dashed lines and stick in. Every child gets one of each labelled piece${handles.length ? `: ${handles.join(\", \")}` : \"\"}.`);\n")

replace_once(STICKIN_BUILD,
    "<span>${esc(m.handle)}</span></div>`\n",
    "<span>${esc(withoutTaughtMarks(m.handle))}</span></div>`\n")

replace_once(STICKIN_BUILD,
    "function pageDiv(caption, body) {\n"
    "  return `<div class=\"page\"><div class=\"caption\">${esc(caption)}</div>${body}</div>`;\n",
    "function pageDiv(caption, body) {\n"
    "  return `<div class=\"page\"><div class=\"caption\">${esc(withoutTaughtMarks(caption))}</div>${body}</div>`;\n")

print("fourth check done")
