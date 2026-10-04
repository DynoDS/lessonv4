"""The colours release, step 15: the third check's repairs
(`colours-release-third-check.md`), as the lead passed them on.

- A line marked `task-blue` that also carries a colour of its own is refused as
  a pair: a short task takes its blue from the role alone, never a hex (the
  catalogue already said so), and a hex beside the role let a statement count
  as a My Turn's turn, because the turn check reads a house-blue hex.
- A worked example set out as steps on a Teach slide can be purple: the teach
  layouts `steps` and `picture-steps` take a step written `{ "text": ...,
  "colorRole": "worked-purple" }`, as a free-zone step list does, and refuse
  any other object with a message that names the role.
- A `source-text` extract is the source's own words, drawn as they are
  written: it refuses `worked-purple` with a message saying why, where it had
  taken the role and printed black without a word.

Run after `k14_his_three_answers.py` and before `build_colours_mapping.py`.
"""
from _patch import TMPL, replace_once

CHECK = "builder/scripts/check-slide-design.js"
TEACH = "builder/src/teach-layouts.js"

# ── task-blue with a colour of its own ──────────────────────────────────────
replace_once(CHECK,
    "      if (node.colorRole !== 'task-blue') return;\n"
    "      const whole = typeof node.value === 'string' ? node.value : node.text;\n"
    "      if (typeof whole !== 'string' || !whole.trim()) return;\n"
    "      const fault = taskBlueFault(whole, facts);\n",
    "      if (node.colorRole !== 'task-blue') return;\n"
    "      const whole = typeof node.value === 'string' ? node.value : node.text;\n"
    "      if (typeof whole !== 'string' || !whole.trim()) return;\n"
    "      // The role is the short task's only blue. A colour beside it would let a\n"
    "      // hex decide what the role is for: the turn check reads a house-blue hex,\n"
    "      // so a statement given both counted as the turn (the third check).\n"
    "      const ownColour = [node.color, node.colour].find((c) => typeof c === 'string' && c.trim());\n"
    "      const fault = ownColour\n"
    "        ? `it also carries its own colour (\"${ownColour.trim()}\"), and a short task takes its blue from the role alone, never a hex`\n"
    "        : taskBlueFault(whole, facts);\n")

# ── a Teach slide's steps take the worked example's purple ─────────────────
replace_once(TEACH,
    "    steps: (v, w) => {\n"
    "      if (typeof v !== 'string' || !v.trim()) fail(w, 'each step is its words as a string.');\n"
    "      return v;\n"
    "    },\n",
    "    // A step is its words, or a step of a worked example: { \"text\": ...,\n"
    "    // \"colorRole\": \"worked-purple\" }, drawn purple by the step list as on any\n"
    "    // slide (the teacher's rule of 24 September 2026). No other object is a step.\n"
    "    steps: (v, w) => {\n"
    "      if (v && typeof v === 'object' && !Array.isArray(v)) {\n"
    "        const words = typeof v.text === 'string' ? v.text : v.value;\n"
    "        const extra = Object.keys(v).filter((k) => !['text', 'value', 'colorRole'].includes(k));\n"
    "        if (typeof words !== 'string' || !words.trim() || extra.length || v.colorRole !== 'worked-purple') {\n"
    "          fail(w, 'each step is its words as a string, or a step of a worked example written ' +\n"
    "            '{ \"text\": \"...\", \"colorRole\": \"worked-purple\" }; no other field or role is taken.');\n"
    "        }\n"
    "        return { text: words, colorRole: 'worked-purple' };\n"
    "      }\n"
    "      if (typeof v !== 'string' || !v.trim()) {\n"
    "        fail(w, 'each step is its words as a string, or a step of a worked example written ' +\n"
    "          '{ \"text\": \"...\", \"colorRole\": \"worked-purple\" }.');\n"
    "      }\n"
    "      return v;\n"
    "    },\n")

# ── an extract is the source's words ───────────────────────────────────────
replace_once(TEACH,
    "  if (item.worked && (role === 'question' || role === 'sticky')) {\n",
    "  if (item.worked && role === 'extract') {\n"
    "    fail(where, 'an extract is the source\\'s own words, drawn as they are written, so it ' +\n"
    "      'takes no colour. A worked example is not an extract: put its lines in \"lines\" with ' +\n"
    "      '\"colorRole\": \"worked-purple\".');\n"
    "  }\n"
    "  if (item.worked && (role === 'question' || role === 'sticky')) {\n")

replace_once(TMPL,
    "The lines of a worked example, a prepared model the class sees finished, take "
    "`\"colorRole\": \"worked-purple\"` and print purple; no other role is taken, and never on the "
    "question, the line to remember or an orange line.",
    "The lines of a worked example, a prepared model the class sees finished, take "
    "`\"colorRole\": \"worked-purple\"` and print purple; no other role is taken, and never on the "
    "question, the line to remember, an orange line or a source's extract. A step of a worked example "
    "on `steps` or `picture-steps` is `{ \"text\": \"...\", \"colorRole\": \"worked-purple\" }`.")

replace_once(TMPL,
    "same line, and a job that also names what to use (`Explain your answer using the "
    "photograph.`);",
    "same line, and a job that also names what to use (`Explain your answer using the "
    "photograph.`), taking its blue from the role alone (a `color` beside it is refused);")

print("third check done")
