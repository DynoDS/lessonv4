"""Success criteria (4.2.288), the fourth check's findings 1 to 4.

1. The list refusal and the 18 to 19pt warning are now held whole by tests (a
   clause added on an unpinned line, or after the last one, fails), and the
   preflight's slot-held branch and its no-double-naming are held by a test.
2. A named zone whose whole content was panels was left as an empty stack and
   the room report printed "-Infinity"; such a zone now keeps its panels, is
   named, and is said to be still measured, as the comment says.
3. The worksheets list notes that decision 10's "What it says now" was
   corrected after he answered it, and WS-R13's line is right.
4. The "measured" wording is true when a page is never reached; the card rules'
   bracket names only what the wall build offers.
"""
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
ROOT = REPO / "plugins" / "lesson-v4"


def patch(path: Path, pairs) -> None:
    raw = path.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    t = raw.replace("\r\n", "\n")
    for old, new in pairs:
        assert t.count(old) == 1, (path.name, t.count(old), old[:100])
        t = t.replace(old, new)
    if crlf:
        t = t.replace("\n", "\r\n")
    path.write_bytes(t.encode("utf-8"))
    print("patched", path.name)


# 2. A zone emptied of its panels keeps them.
patch(ROOT / "worksheet-html/src/worksheet.js", [
    ("  if (!node || typeof node !== \"object\") return node;\n"
     "  const out = {};\n"
     "  for (const [key, value] of Object.entries(node)) out[key] = withoutPanels(value);\n"
     "  return out;\n"
     "}\n\nfunction isEmptyGroup(item) {",
     "  if (!node || typeof node !== \"object\") return node;\n"
     "  const out = {};\n"
     "  for (const [key, value] of Object.entries(node)) {\n"
     "    // A slot whose whole content was panels (a named zone that is only a\n"
     "    // stack of them) keeps them: taken off, it would leave an empty zone the\n"
     "    // room report cannot measure.\n"
     "    const cleaned = withoutPanels(value);\n"
     "    out[key] = isEmptyGroup(cleaned) && !isEmptyGroup(value) ? value : cleaned;\n"
     "  }\n"
     "  return out;\n"
     "}\n\nfunction isEmptyGroup(item) {"),
    ("// off. A panel held on its own in a slot (a repeat's stack, one side of a pair,\n"
     "// a named zone that is only the panel) stays, and is measured.\n",
     "// off. A panel held on its own in a slot (a repeat's stack, one side of a pair,\n"
     "// a named zone that is only panels) stays, and is measured.\n"),
])

# 4. The "measured" wording, true when a page is never reached.
patch(ROOT / "worksheet-html/scripts/check-worksheet.js", [
    ("            ? \"The page below is measured without the panels that can come off; one held on its own in a slot is still measured.\"\n"
     "            : \"The page below is measured without it.\")\n",
     "            ? \"Any page measured below is measured without the panels that can come off; one held on its own in a slot is still measured.\"\n"
     "            : \"Any page measured below is measured without it.\")\n"),
])
patch(ROOT / "references/working-wall-card-contracts.md", [
    ("(the build and the focused repair already offer it, and for success criteria it is how the card makes room, since their words never change)",
     "(the wall build already offers it, and for success criteria it is how the card makes room, since their words never change)"),
])

# 1. Tests: the preflight's slot-held branch, and the two messages held whole.
patch(ROOT / "worksheet-html/test/omit-unfittable.test.js", [
    ('test("a fault that is not about page fit still refuses everything", () => {\n',
     'test("a panel held in a slot of its own is named once and said to be still measured", () => {\n'
     '  const spec = specWithOneUnfittable();\n'
     '  spec.sheets.greaterDepth = {\n'
     '    layout: "full",\n'
     '    orientation: "portrait",\n'
     '    zones: { a: { stack: [panel(), panel()] } },\n'
     '  };\n'
     '  const stdout = preflight(spec);\n'
     '  const named = stdout.match(/CRITERIA_NOT_ON_SHEETS/g) || [];\n'
     '  assert.equal(named.length, 2);\n'
     '  assert.match(stdout, /Greater Depth - zones\\.a\\.stack\\[0\\]: CRITERIA_NOT_ON_SHEETS.*one held on its own in a slot is still measured/);\n'
     '  assert.doesNotMatch(stdout, /Infinity|NaN/);\n'
     '});\n'
     '\n'
     'test("a fault that is not about page fit still refuses everything", () => {\n'),
])

TEST = ROOT / "scripts/tests/test_success_criteria_fit_a_glance.py"
patch(TEST, [
    ("def test_guidance_names_both_misses_so_clear_steps_are_not_lengthened():\n",
     "def _block(text: str, start: str, end: str) -> str:\n"
     "    at = text.index(start)\n"
     "    return ' '.join(text[at:text.index(end, at)].split())\n"
     "\n"
     "def test_the_sheet_list_refusal_is_held_whole():\n"
     "    # Decision 8 is success criteria only; a method's steps a child works\n"
     "    # through go with their question. A clause on any line of the message\n"
     "    # would change that, so the whole message is held.\n"
     "    text = (ROOT / 'worksheet-html/src/helpers/text.js').read_text(encoding='utf-8')\n"
     "    assert _block(text, 'throw new Error(\\n    `INSTRUCTION_IS_A_LIST', ');\\n}') == ' '.join('''\n"
     "        throw new Error(\n"
     "        `INSTRUCTION_IS_A_LIST: this instruction carries ${lines.length} lines, ` +\n"
     "        \"so it is a list and will print as a paragraph of grey text. If they \" +\n"
     "        'are the lesson\\\\'s success criteria, leave them off: they stay on the ' +\n"
     "        'board and are never printed on a worksheet. Otherwise, if they are steps a child ' +\n"
     "        'works through to reach the answer, they are part of its question: put ' +\n"
     "        'them with it, one to a line, or in maths use \"method-frame\". ' +\n"
     "        'If they are questions, use \"questions\" or \"written-answers\", ' +\n"
     "        \"which number them and give the child somewhere to answer. An \" +\n"
     "        `instruction is one direction, in at most ${INSTRUCTION_MAX_LINES} lines.`\n"
     "    '''.split())\n"
     "\n"
     "def test_the_18_to_19pt_warning_asks_for_nothing_and_is_held_whole():\n"
     "    # He chose to widen a panel only as far as 18pt needs (23 September\n"
     "    # 2026), so the warning names no layout to move to and no words to cut.\n"
     "    text = (ROOT / 'builder/src/content/steps.js').read_text(encoding='utf-8')\n"
     "    assert _block(text, '`success criteria set at ${sharedFont}pt', ');') == ' '.join('''\n"
     "        `success criteria set at ${sharedFont}pt: within the 18pt floor, below the ` +\n"
     "        `${TEXT_FONT_TARGET}pt a panel reads best at from a table. The longest step is ` +\n"
     "        `\"${textOf(longest)}\". Nothing need change: the words are the lesson ` +\n"
     "        `designer's and stay as they are, and a list that does not fit is refused ` +\n"
     "        `with a roomier shape named.`\n"
     "    '''.split())\n"
     "\n"
     "def test_guidance_names_both_misses_so_clear_steps_are_not_lengthened():\n"),
])

# 3. The worksheets list.
LEDGER = REPO / "plans" / "2026-09-23-worksheets-ledger.md"
patch(LEDGER, [
    ("      \"never printed on a worksheet\". Three things print them:\n",
     "      \"never printed on a worksheet\" (this sentence was corrected on 24 September\n"
     "      after he had answered the question, from the morning's version, which said\n"
     "      the engine still said so; his answer does not change). Three things print them:\n"),
])
t = LEDGER.read_text(encoding="utf-8")
row = next(line for line in t.splitlines() if line.startswith("| WS-R13 | «const INSTRUCTION_MAX_LINES"))
assert "`worksheet-html/src/helpers/text.js` · L38" in row
LEDGER.write_text(t.replace(row, row.replace("`worksheet-html/src/helpers/text.js` · L38", "`worksheet-html/src/helpers/text.js` · L39")), encoding="utf-8")
print("WS-R13 line set")
