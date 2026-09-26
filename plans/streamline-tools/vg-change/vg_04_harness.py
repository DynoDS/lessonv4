"""The voice guide release, step 4: the voice harness's read-me and sweep runner.

- Settled item 8 (the Maintenance note, VG-A16 and A17): the guide's
  `## Maintenance` sat inside §17, which the reviewer is shown every review. Its
  maintainer lines move here, beside how a voice change is measured, word for
  word but for what "it" and "here" now point at; the one sentence every reader
  needs stayed in the guide (`vg_02_guide.py`).
- Settled item 8, out of date (VG-Q02, VG-Q13): the held-out file is no longer
  an empty structure, and the runner's "the paragraph before it" is not the one
  before (it sits in the reviewer's opening section)."""
from _patch import HARNESS, RUNNER, assert_absent, replace_once

replace_once(
    HARNESS,
    "Its job is to let a proposed voice change be measured against recorded human\n"
    "judgements, instead of being argued from one lesson that happened to read badly.\n"
    "\n"
    "## Fixture separation\n",
    "Its job is to let a proposed voice change be measured against recorded human\n"
    "judgements, instead of being argued from one lesson that happened to read badly.\n"
    "\n"
    "## Changing the voice guide\n"
    "\n"
    "The guide (`references/teacher-voice.md`) is the default runtime specification.\n"
    "Do **not** keep expanding it every time one sentence is corrected.\n"
    "\n"
    "Only change the guide when real resource work reveals:\n"
    "- a repeated miss;\n"
    "- a genuinely new register;\n"
    "- a contradiction in the current guidance;\n"
    "- a preference that survives more than one context.\n"
    "\n"
    "Keep detailed calibration examples, rejected alternatives and testing history in\n"
    "the teacher's separate evidence document rather than adding them all to the guide.\n"
    "\n"
    "## Fixture separation\n",
)

replace_once(
    HARNESS,
    "- `held-out-input.json` is an empty structure for the next fresh lesson. There\n"
    "  is no held-out gold file:",
    "- `held-out-input.json` carries the strings of the next fresh lessons, waiting\n"
    "  for labels (now the 112 of the Week 4 History and Science lessons). There\n"
    "  is no held-out gold file:",
)

replace_once(
    RUNNER,
    "and the paragraph before it that begins `A child-facing or spoken string in the wrong register is not polish.`",
    "and the paragraph in its opening section, `Material-defect boundary`, that begins `A child-facing or spoken "
    "string in the wrong register is not polish.`",
)
assert_absent(HARNESS, "is an empty structure")
assert_absent(RUNNER, "the paragraph before it")
print("HARNESS_OK")
