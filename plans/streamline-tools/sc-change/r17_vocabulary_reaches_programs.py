"""The second check's finding 5: the log said every topic's "everywhere" now
reaches the programs, but the vocabulary test carried its own list of
instruction files only. It now reads the same programs list the other four
topics share, so the log's words are true."""
from pathlib import Path

P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\scripts\tests\test_vocabulary_ledger_is_kept.py")
raw = P.read_bytes().decode("utf-8")
crlf = "\r\n" in raw
t = raw.replace("\r\n", "\n")
pairs = [
    ("import json\nimport re\nimport unittest\nfrom pathlib import Path\n",
     "import json\nimport re\nimport sys\nimport unittest\nfrom pathlib import Path\n\n"
     "sys.path.insert(0, str(Path(__file__).resolve().parent))\n"
     "from ledger_pin_checks import PROGRAMS  # noqa: E402\n"),
    ("                files = RUNTIME if pin.get(\"everywhere\") else [ROOT / pin[\"file\"]]\n",
     "                # \"Everywhere\" is the instructions and the programs whose messages\n"
     "                # the designers follow, as for every later topic.\n"
     "                files = RUNTIME + PROGRAMS if pin.get(\"everywhere\") else [ROOT / pin[\"file\"]]\n"),
]
for old, new in pairs:
    assert t.count(old) == 1, old[:80]
    t = t.replace(old, new)
if crlf:
    t = t.replace("\n", "\r\n")
P.write_bytes(t.encode("utf-8"))
print("vocabulary test reaches the programs")

# Then edited by hand: VOC-E06, a retired story, is still told in a comment in
# the validator, which only a maintainer reads. A retired story is barred from
# the instructions; a retired rule wording from the programs too:
#     story = row["outcome"].startswith("story")
#     reach = RUNTIME + ([] if story else PROGRAMS)
#     files = reach if pin.get("everywhere") else [ROOT / pin["file"]]
