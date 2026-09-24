"""Success criteria (4.2.288), decision 1: the launch check's refusal no longer
offers taking a taught word out of the criteria, which would undo the
teacher's ruling that every taught word is green in the criteria."""
from pathlib import Path

P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\scripts\validate-lesson-design.py")
t = P.read_text(encoding="utf-8")
old = ('        "criteria name as taught words the work must use. Write the model as a "\n'
       '        "child meeting the criteria would write it, or take the word out of the "\n'
       '        "criteria; a class shown a model that would fail the standard is being "\n'
       '        "marked against something it was never shown",\n')
new = ('        "criteria name as taught words the work must use. Write the model as a "\n'
       '        "child meeting the criteria would write it, using the word; a taught "\n'
       '        "word stays in the criteria, and a class shown a model that would fail "\n'
       '        "the standard is being marked against something it was never shown",\n')
assert t.count(old) == 1
P.write_text(t.replace(old, new), encoding="utf-8")
print("launch message ok")
