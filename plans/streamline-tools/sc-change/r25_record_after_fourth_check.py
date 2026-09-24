"""Success criteria (4.2.288): the mapping and the log follow r24 (the fourth
check's findings)."""
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")
M = HERE / "build_sc_mapping.py"
LOG = ROOT / "references" / "build-review-log.md"

t = M.read_text(encoding="utf-8")
old_bracket = "(the build and the focused repair already offer it, and for success criteria it is how the card makes room, since their words never change)"
new_bracket = "(the wall build already offers it, and for success criteria it is how the card makes room, since their words never change)"
assert t.count(old_bracket) == 1
t = t.replace(old_bracket, new_bracket)
old_pin = '      ("worksheet-html/test/omit-unfittable.test.js", "a named sheet\'s panel is named even when another sheet cannot be laid out"),\n'
new_pin = (old_pin +
           '      ("worksheet-html/test/omit-unfittable.test.js", "a panel held in a slot of its own is named once and said to be still measured"),\n'
           '      ("worksheet-html/src/worksheet.js", "out[key] = isEmptyGroup(cleaned) && !isEmptyGroup(value) ? value : cleaned;"),\n'
           '      ("scripts/tests/test_success_criteria_fit_a_glance.py", "def test_the_sheet_list_refusal_is_held_whole():"),\n'
           '      ("scripts/tests/test_success_criteria_fit_a_glance.py", "def test_the_18_to_19pt_warning_asks_for_nothing_and_is_held_whole():"),\n')
assert t.count(old_pin) == 1
t = t.replace(old_pin, new_pin)
M.write_text(t, encoding="utf-8")
print("mapping follows r24")

raw = LOG.read_bytes().decode("utf-8")
crlf = "\r\n" in raw
s = raw.replace("\r\n", "\n")
old = "and a cell too long for its column was offered two cards, which cannot cure it.\n"
new = (old +
       "- **The fourth reader.** A last narrow check of those repairs found nothing lost: lesson 15 now names all four of its panels, in the preflight and the build, with and without the last-resort flag, and the 61 saved sheets lost no signal. It found a clause could still be added to the list refusal on its one unpinned line, or after the 18 to 19pt warning's last line (both messages are now held whole by tests); the preflight's handling of a panel held in a slot of its own was held by nothing (now tested); a named zone that was only panels was left empty and the room report printed \"-Infinity\" (such a zone now keeps its panels and is said to be still measured); and the worksheets list's decision on a method's steps was corrected after he answered it without saying so (now noted).\n")
assert s.count(old) == 1
s = s.replace(old, new)
if crlf:
    s = s.replace("\n", "\r\n")
LOG.write_bytes(s.encode("utf-8"))
print("log follows the fourth check")

# Then by hand: the log's programs figure, measured after r24, from "about 11.1 KB"
# to "about 11.4 KB" (scratch/sc_sizes.py: instructions 5,124, catalogue -629,
# programs 11,354).
