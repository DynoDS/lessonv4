"""Success criteria (4.2.288), the third check's finding 2: the mapping follows
r19 to r21 and pins what it found loose. The two lines that make "measured
without it" true, the list refusal's four lines, the 18 to 19pt message's last
line and the card contracts' exception paragraph whole are pinned; the two
retired template measurements are barred by their own words; and the flag test
reads the build's code, not only its list."""
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")
M = HERE / "build_sc_mapping.py"
t = M.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, (t.count(old), old[:100])
    t = t.replace(old, new)


# The card contracts' exception paragraph, pinned whole, as the file has it.
wcc = (ROOT / "references" / "working-wall-card-contracts.md").read_text(encoding="utf-8").replace("\r\n", "\n")
para = next(p for p in wcc.split("\n\n") if p.startswith("The wall is finite."))
assert "\n" not in para and '"' not in para
swap('      (WCC, "the one exception is a success-criteria list or table too long for one card, carried in order over two cards of the same title, which is one job split for room."),\n',
     f'      (WCC, "{para}"),\n')
swap('"unless the table is the lesson\'s success criteria, which are copied word for word (the card makes room instead, or the table goes over two cards)"',
     '"unless the table is the lesson\'s success criteria, which are copied word for word (the card makes room instead)"')

# The engine: every sheet's panels, the two lines that make the measurement
# true, the list refusal's four lines, and the new tests.
swap('      ("worksheet-html/src/helpers/text.js", "\'works through to reach the answer, they are part of its question: put \' +"),\n',
     '      ("worksheet-html/src/helpers/text.js", "\'board and are never printed on a worksheet. Otherwise, if they are steps a child \' +"),\n'
     '      ("worksheet-html/src/helpers/text.js", "\'works through to reach the answer, they are part of its question: put \' +"),\n'
     '      ("worksheet-html/src/helpers/text.js", "\'them with it, one to a line, or in maths use \\"method-frame\\". \' +"),\n')
swap('      ("worksheet-html/src/worksheet.js", "function autoSheetCriteriaPanels(worksheet) {"),\n'
     '      ("worksheet-html/scripts/check-worksheet.js", "for (const found of autoSheetCriteriaPanels(worksheet)) {"),\n'
     '      ("worksheet-html/scripts/build-worksheet.js", "const panels = autoSheetCriteriaPanels(worksheet);"),\n',
     '      ("worksheet-html/src/worksheet.js", "function sheetCriteriaPanels(worksheet) {"),\n'
     '      ("worksheet-html/src/worksheet.js", "if (isEmptyGroup(cleaned) && !isEmptyGroup(item)) continue;"),\n'
     '      ("worksheet-html/scripts/check-worksheet.js", "const panelsFound = sheetCriteriaPanels(worksheet);"),\n'
     '      ("worksheet-html/scripts/check-worksheet.js", "worksheet = withoutTheirPanels;"),\n'
     '      ("worksheet-html/scripts/build-worksheet.js", "const panels = sheetCriteriaPanels(worksheet);"),\n'
     '      ("worksheet-html/test/omit-unfittable.test.js", "the preflight measures a sheet without its panels, and leaves no empty row behind"),\n'
     '      ("worksheet-html/test/omit-unfittable.test.js", "a named sheet\'s panel is named even when another sheet cannot be laid out"),\n')

# The 18 to 19pt message's last line.
swap('      ("builder/src/content/steps.js", "`designer\'s and stay as they are, and a list that does not fit is refused ` +"),\n',
     '      ("builder/src/content/steps.js", "`designer\'s and stay as they are, and a list that does not fit is refused ` +"),\n'
     '      ("builder/src/content/steps.js", "`with a roomier shape named.`"),\n')

# The two retired template measurements, barred by their own words.
swap('    "SC-K12": [(TPL, "cannot hold 5 steps at full size")],\n',
     '    "SC-K12": [(TPL, "cannot hold 5 steps at full size"), (TPL, "5 steps needs ~2.0–2.5″ of zone height")],\n')
swap('    "SC-K38": [(TPL, "and success-criteria steps. The bottom strip")],\n',
     '    "SC-K38": [(TPL, "and success-criteria steps. The bottom strip"), (TPL, "The bottom strip is sized for ~5 step rows")],\n')
M.write_text(t, encoding="utf-8")
print("mapping follows the third check")

# The flag test reads the build's code, comments aside, not only its list.
TEST = ROOT / "scripts" / "tests" / "test_success_criteria_fit_a_glance.py"
raw = TEST.read_bytes().decode("utf-8")
crlf = "\r\n" in raw
s = raw.replace("\r\n", "\n")
old = ("    entries = re.findall(r\"^\\s*'([A-Z_]+)',\", listed.group(1), re.M)\n"
       "    assert 'FIXED_CAPTION_CAPACITY' in entries\n"
       "    assert 'SUCCESS_CRITERIA_CAPACITY' not in entries\n")
new = ("    entries = re.findall(r\"^\\s*'([A-Z_]+)',\", listed.group(1), re.M)\n"
       "    assert 'FIXED_CAPTION_CAPACITY' in entries\n"
       "    assert 'SUCCESS_CRITERIA_CAPACITY' not in entries\n"
       "    # Nor anywhere else in the build's code: put on the same line as another\n"
       "    # entry, or added to the list after it is made, it would flag a fitting\n"
       "    # panel just the same.\n"
       "    code = re.sub(r'//[^\\n]*', '', build)\n"
       "    assert 'SUCCESS_CRITERIA_CAPACITY' not in code\n")
assert s.count(old) == 1
s = s.replace(old, new)
if crlf:
    s = s.replace("\n", "\r\n")
TEST.write_bytes(s.encode("utf-8"))
print("flag test reads the code")
