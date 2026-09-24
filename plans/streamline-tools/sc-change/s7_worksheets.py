"""Success criteria (4.2.288), decision 8: no success criteria on worksheets.
The teacher: "I don't want any success criteria on worksheets."

The wording says so everywhere the sheet is decided, the validator refuses a
non-empty `worksheet.successCriteriaRefs` on every sheet, and the worksheet
engine refuses the steps panel on a sheet. The panel itself stays in the
engine, because the board and the wall colour criteria marks through the same
code and its helper tests hold that; it leaves the designer's catalogue."""
import json
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")


def patch(rel: str, pairs) -> None:
    path = ROOT / rel
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", rel)


# ---------------------------------------------------------------- the worksheet designer
patch("agents/worksheet-designer.md", [
    ("""13. **Include success criteria only when the upstream worksheet decision
    requires them.** Omit a duplicated panel when the surrounding lesson
    context already supplies the reference adequately. Include the exact
    concise criteria when the sheet must stand independently or access depends
    on that reference, colour marks (`((...))`, `{{...}}`, `<<...>>`) included,
    so each step is coloured as it was on the board. Do not invent criteria and do not remove required
    criteria for layout convenience. A one-line job statement for a reference
    under rule 12 is not a criteria panel.""",
     """13. **Never print success criteria on a worksheet.** They stay on the
    board, where children consult them while they work, and the teacher does
    not want them on any sheet or slip. `worksheet.successCriteriaRefs` is
    always empty, and nothing on the page reprints the criteria or a method's
    steps, as a panel or as a list. A one-line job statement for a reference
    under rule 12 is not a criteria panel."""),
    ("""14. **Criteria and taught method steps are drawn with `steps`, never written as
    an `instruction`.** `steps` prints the pale green panel the class worked
    from on the board - green tick heading, numbered badges, one white card per
    criterion - so a child who followed those steps on the board recognises the
    same object on their paper and can find step 4 at a glance. Written as an
    instruction they print as a grey paragraph, which is what a Year 4 rounding
    sheet shipped: seven lines at the foot of the page, indistinguishable from
    `Use the place value chart to help you.` The engine now refuses an
    instruction of three lines or more for exactly this reason. Price the panel
    honestly when you place it: six criteria stand about 55mm, against the 40mm
    the same words cost as prose, so a full sheet may have to carry fewer
    criteria, put the panel beside something in a row, or leave it to the board.
    Fewer criteria on the paper is a real answer - the board has all of them.""",
     """14. **Nor as a list in an `instruction`.** The engine refuses the `steps`
    panel on a sheet, and an instruction of three lines or more too, because a
    list written as an instruction prints as a grey paragraph, which is what a
    Year 4 rounding sheet shipped: seven lines at the foot of the page,
    indistinguishable from `Use the place value chart to help you.`"""),
    ("""- Confirm any criteria or taught method steps are a `steps` panel, not an
  instruction carrying a list.""",
     """- Confirm no success criteria or method steps are printed, as a panel or as an
  instruction carrying a list."""),
    ("""- Confirm every required visual, support and success criterion from upstream is
  present.""",
     """- Confirm every required visual and support from upstream is present."""),
    ("""an answer. Success criteria, a reminder of a method they have already used, a
prompt to check their work: yes,""",
     """an answer. A reminder of a method they have already used, a
prompt to check their work: yes,"""),
])

# ---------------------------------------------------------------- the preferences' worksheet sections
patch("references/preferences.md", [
    ("**Support comes after the work in the reading order, not before it.** Steps, success criteria, a word bank, a reminder or a worked reference are things a child glances across at while working",
     "**Support comes after the work in the reading order, not before it.** A word bank, a reminder or a worked reference are things a child glances across at while working"),
    ("Success criteria, a reminder of a method they have already used and a prompt to check their work all pass that test,",
     "A reminder of a method they have already used and a prompt to check their work pass that test,"),
])

# ---------------------------------------------------------------- the designer's notes and the contract
patch("references/lesson-designer-components.md", [
    ("**Decide whether worksheet itself needs SC.** Apply `preferences.md` → Support, Checking and Release to the worksheet's actual tasks and intended use. Check reused criteria against the worksheet's evidence and response, not only the board task they originally served. Include a suitable concise reference when the sheet must stand independently or access depends on it; omit the printed copy when the same suitable reference explicitly remains available elsewhere. Record that access in existing planning fields, without adding classroom instructions to every question.",
     "**A worksheet never carries SC.** The criteria stay on the board (`preferences.md` → Success Criteria), so `worksheet.successCriteriaRefs` is empty on every sheet; the validator refuses any. Apply `preferences.md` → Support, Checking and Release to the worksheet's other support, and record where a child still meets a reference in existing planning fields, without adding classroom instructions to every question."),
])
patch("references/output-template.md", [
    ("`successCriteriaRefs` names the exact success-criteria objects printed on the generated Expected sheet.",
     "`successCriteriaRefs` is always `[]`: success criteria are never printed on a worksheet, and the validator refuses any."),
])
patch("references/books-or-sheet.md", [
    ("""A books sheet can still print a figure. The slip keeps what the sheet prints
apart from three things it takes out for itself: the room for answers, the
success criteria panel (the `steps` helper, because the child already has it on
the board and the working wall), and anything marked `"onSlip": false`.""",
     """A books sheet can still print a figure. The slip keeps what the sheet prints
apart from two things it takes out for itself: the room for answers, and
anything marked `"onSlip": false`. Success criteria are on neither: they stay on
the board."""),
])
patch("references/worksheet-helpers.md", [
    ("""(see `books-or-sheet.md`). It changes nothing on the sheet itself. A slip drops
the room for answers and the `steps` success-criteria panel on its own, so
neither needs marking.""",
     """(see `books-or-sheet.md`). It changes nothing on the sheet itself. A slip drops
the room for answers on its own, so that needs no marking. Success criteria are
never on a sheet or a slip: the engine refuses the `steps` panel on a sheet."""),
])

# ---------------------------------------------------------------- the validator
patch("scripts/validate-lesson-design.py", [
    ('        validate_ref_list(worksheet["successCriteriaRefs"], "worksheet.successCriteriaRefs", set(sc_by_id))\n',
     '        validate_ref_list(worksheet["successCriteriaRefs"], "worksheet.successCriteriaRefs", set(sc_by_id))\n'
     '        # The teacher, 23 September 2026: "I don\'t want any success criteria on\n'
     '        # worksheets." They stay on the board, where children consult them.\n'
     '        expect(worksheet["successCriteriaRefs"] == [],\n'
     '               "worksheet.successCriteriaRefs must be []: success criteria stay on the "\n'
     '               "board and are never printed on a worksheet")\n'),
])

# ---------------------------------------------------------------- the worksheet engine
patch("worksheet-html/src/render.js", [
    ("function renderSheet(spec, opts = {}) {\n  const problems = checkFit(spec);\n",
     "// Success criteria, and a method's steps, stay on the board. The teacher does\n"
     "// not want them on any worksheet (23 September 2026: \"I don't want any success\n"
     "// criteria on worksheets.\"), so a sheet carrying the steps panel is refused\n"
     "// before anything is measured. The helper itself stays: the board and the wall\n"
     "// colour criteria marks through the same code, and its own tests hold that.\n"
     "function criteriaPanelsOn(spec) {\n"
     "  const found = [];\n"
     "  const walk = (node, where) => {\n"
     "    if (Array.isArray(node)) {\n"
     "      node.forEach((n, i) => walk(n, `${where}[${i}]`));\n"
     "      return;\n"
     "    }\n"
     "    if (!node || typeof node !== \"object\") return;\n"
     "    if (node.helper === \"steps\") found.push(where);\n"
     "    for (const [key, value] of Object.entries(node)) {\n"
     "      if (value && typeof value === \"object\") walk(value, `${where}.${key}`);\n"
     "    }\n"
     "  };\n"
     "  walk(spec, \"sheet\");\n"
     "  return found;\n"
     "}\n"
     "\n"
     "function renderSheet(spec, opts = {}) {\n"
     "  const panels = criteriaPanelsOn(spec);\n"
     "  if (panels.length) {\n"
     "    throw new Error(\n"
     "      `CRITERIA_NOT_ON_SHEETS: ${panels.join(\", \")} is a success-criteria (steps) ` +\n"
     "        \"panel. Success criteria stay on the board and are never printed on a \" +\n"
     "        \"worksheet; take the panel off the sheet.\"\n"
     "    );\n"
     "  }\n"
     "  const problems = checkFit(spec);\n"),
])
patch("worksheet-html/src/helpers/text.js", [
    ("      \"so it is a list and will print as a paragraph of grey text. If they \" +\n"
     "      'are the lesson\\'s success criteria or the steps of its method, use the ' +\n"
     "      '\"steps\" helper, which draws the panel the class worked from on the ' +\n"
     "      'board. If they are questions, use \"questions\" or \"written-answers\", ' +\n",
     "      \"so it is a list and will print as a paragraph of grey text. If they \" +\n"
     "      'are the lesson\\'s success criteria or the steps of its method, leave them ' +\n"
     "      'off: they stay on the board and are never printed on a worksheet. ' +\n"
     "      'If they are questions, use \"questions\" or \"written-answers\", ' +\n"),
])
patch("worksheet-html/scripts/build-catalogue.js", [
    ('  ["Text and questions", ["section-label", "instruction", "questions", "written-answers", "source-text", "steps"]],\n',
     '  ["Text and questions", ["section-label", "instruction", "questions", "written-answers", "source-text"]],\n'),
    ("  const placed = new Set(FAMILIES.flatMap(([, list]) => list));\n",
     "  // Helpers the engine keeps but never lets onto a sheet, so the designer is\n"
     "  // not offered them: the success-criteria panel stays on the board (the\n"
     "  // teacher, 23 September 2026).\n"
     "  const notOnSheets = new Set([\"steps\"]);\n"
     "  const placed = new Set([...FAMILIES.flatMap(([, list]) => list), ...notOnSheets]);\n"),
    ("    `The ${names.length} helpers, what each is for, and a working example of each.`,\n",
     "    `The ${names.length - notOnSheets.size} helpers, what each is for, and a working example of each.`,\n"),
    ("  console.log(`${names.length} helpers in ${FAMILIES.length} families.`);\n",
     "  console.log(`${names.length - notOnSheets.size} helpers in ${FAMILIES.length} families.`);\n"),
])

# The fixture's partition sheet printed a steps panel beside its chart.
fx = ROOT / "worksheet-html" / "fixtures" / "maths-partition-four-digit-numbers.json"
raw = fx.read_text(encoding="utf-8")
data = json.loads(raw)


def drop_steps(node):
    if isinstance(node, dict):
        if isinstance(node.get("row"), list):
            kept = [c for c in node["row"] if not (isinstance(c, dict) and c.get("helper") == "steps")]
            if len(kept) != len(node["row"]):
                if len(kept) == 1:
                    return drop_steps(kept[0])
                node["row"] = kept
        for k, v in list(node.items()):
            node[k] = drop_steps(v)
    elif isinstance(node, list):
        return [drop_steps(x) for x in node if not (isinstance(x, dict) and x.get("helper") == "steps")]
    return node


data = drop_steps(data)
assert '"helper": "steps"' not in json.dumps(data)
fx.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("fixture: steps panel removed")
