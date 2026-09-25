"""The colours release, step 7: the tests follow the teacher's answers, and new
ones hold what changed. Each moved assertion carries a comment naming the
decision that moved it; nothing that still holds is loosened.

- `doc-claims.test.js`: the two colour-grammar tests now hold the new rule (blue
  is a question or a short task, a longer instruction stays black; preferences
  keeps his words and points), and bar the retired "a task is black either
  way"; the profile's numbering note is held by what it still says ("adds no
  numbering rule of its own") instead of the stale sentence decision 14 removed.
- `doc-claims.test.js` also holds the worked example's purple where the
  playbook said prepared examples stay black, and the header cue's black.
- `slide-design-check.test.js`: the history-deck test's comment says why both
  lines are still refused; five tests are appended for the short task's role,
  run on the saved lines the first check named, both ways.
- New: the builder's `colours-follow-the-board.test.js`, the sheet's
  `worked-example-purple.test.js`, the wall's `colours-follow-the-board.test.js`,
  and the pin test `test_colours_are_kept.py` (its pins are written by
  `build_colours_mapping.py`, which runs after `k8`).
"""
from _patch import NEW, ROOT, announce, replace_once

DOC = "builder/test/doc-claims.test.js"
CHECK_TEST = "builder/test/slide-design-check.test.js"

replace_once(DOC,
    "  assert.match(PLAYBOOK_MD, /asking versus telling/);\n"
    "  assert.match(PREFERENCES_MD, /Blue asks; everything else tells/);\n",
    "  assert.match(PLAYBOOK_MD, /asking versus telling/);\n"
    "  // Decision 11 (24 September 2026) folded preferences' three blue paragraphs\n"
    "  // into the profile: preferences keeps his words and points at the owner.\n"
    "  assert.match(PREFERENCES_MD, /Blue asks or sets a short task, and a worked example is purple/);\n"
    "  assert.match(PREFERENCES_MD, /Semantic colour owns the whole grammar/);\n")

replace_once(DOC,
    "test('blue is the colour of a question, and instructions are black', () => {\n"
    "  // A Year 4 history deck put \"Explain your answer using the photograph.\",\n"
    "  // \"Point to the details that support your comparison.\" and six more task\n"
    "  // lines in house blue, so almost the whole board arrived blue and the colour\n"
    "  // stopped marking anything (flagged by Daniel, 3 September 2026: \"can we make\n"
    "  // only questions to children blue\"). Every owner of the grammar has to say\n"
    "  // instructions are black, or a run picks up whichever file it opens first.\n"
    "  assert.match(TEACHER_PROFILE_MD, /House blue is the colour of a question to children/);\n"
    "  assert.match(TEACHER_PROFILE_MD, /the instructions children act on/);\n"
    "  assert.match(PREFERENCES_MD, /the instructions children act on/);\n"
    "  assert.match(\n"
    "    PLAYBOOK_MD,\n"
    "    /Every child-facing question outside the starter carries the blue/\n"
    "  );\n",
    "test('blue is a question or a short task, and a longer instruction is black', () => {\n"
    "  // A Year 4 history deck put \"Explain your answer using the photograph.\",\n"
    "  // \"Point to the details that support your comparison.\" and six more task\n"
    "  // lines in house blue, so almost the whole board arrived blue and the colour\n"
    "  // stopped marking anything (flagged by Daniel, 3 September 2026: \"can we make\n"
    "  // only questions to children blue\"). On 24 September 2026 he narrowed it\n"
    "  // (decision 11 and the topic 7 plan's question 1): blue is a question or a\n"
    "  // short task, and a longer instruction about how to go about it stays black;\n"
    "  // on 25 September he said a job that names what to use is still the job, so\n"
    "  // the first of those lines is blue once marked. Every owner of the grammar has\n"
    "  // to say so, or a run picks up whichever file it opens first.\n"
    "  assert.match(\n"
    "    TEACHER_PROFILE_MD,\n"
    "    /House blue is the colour of the child's job: a question they answer, or a short task/\n"
    "  );\n"
    "  assert.ok(TEACHER_PROFILE_MD.includes('`Explain your answer.`, `Write one reason.`, `Explain why.`'));\n"
    "  assert.match(TEACHER_PROFILE_MD, /a longer instruction about how to go about the task/);\n"
    "  assert.ok(TEACHER_PROFILE_MD.includes('A job that also names what to use is still the job, and blue: `Explain your answer using the photograph.`'));\n"
    "  // The job or advice on how to do it is the designer's judgement, recorded by\n"
    "  // a role the check reads, never a count of words (the first check of the\n"
    "  // colours release).\n"
    "  assert.ok(TEACHER_PROFILE_MD.includes('marked `colorRole: \"task-blue\"`'));\n"
    "  assert.match(TEACHER_PROFILE_MD, /no count of words decides it/);\n"
    "  assert.match(TEACHER_PROFILE_MD, /The cue is drawn black/);\n"
    "  assert.ok(PREFERENCES_MD.includes('I want blue means question or like a short task'));\n"
    "  assert.match(PREFERENCES_MD, /a longer instruction about how to go about it stays black/);\n"
    "  assert.match(\n"
    "    PLAYBOOK_MD,\n"
    "    /Every child-facing question and short task outside the starter carries the blue/\n"
    "  );\n"
    "  for (const [name, text] of [\n"
    "    ['profile', TEACHER_PROFILE_MD],\n"
    "    ['preferences', PREFERENCES_MD],\n"
    "    ['playbook', PLAYBOOK_MD]\n"
    "  ]) {\n"
    "    assert.ok(!text.includes('a task is black either way'), `${name} still says every task is black`);\n"
    "    assert.ok(!text.includes('the instructions children act on'), `${name} still blackens every instruction`);\n"
    "  }\n")

replace_once(DOC,
    "  assert.match(PLAYBOOK_MD, /Prepared examples and visible-in-unit models stay black/);\n",
    "  // Decision 11 (24 September 2026): a prepared, finished example is a worked\n"
    "  // example, and a worked example is purple, the same colour as a sticky fact.\n"
    "  assert.match(PLAYBOOK_MD, /Prepared examples and visible-in-unit models are worked examples, in purple/);\n")

replace_once(DOC,
    "  assert.match(PREFERENCES_MD, /Starter questions are the exception and stay black/);\n",
    "  // Preferences' pointer names the exception, because a pointer is read first.\n"
    "  assert.match(PREFERENCES_MD, /the starter's questions, which stay black or alternate/);\n")

replace_once(DOC,
    "  assert.ok(\n"
    "    TEACHER_PROFILE_MD.includes(\n"
    "      \"does not establish that a single main-independent question should lose its normal numbering\"\n"
    "    ),\n"
    "    \"the profile no longer records that the lone-(1) calibration establishes no rule\"\n"
    "  );\n",
    "  // The sentence this held presumed a lone main-independent question is\n"
    "  // numbered, which Question Labelling no longer says; it went as out of date\n"
    "  // (the rest-of-preferences ledger's decision 14, row J13). What it protected\n"
    "  // stays: the profile adds no numbering rule of its own.\n"
    "  assert.ok(\n"
    "    TEACHER_PROFILE_MD.includes(\"this profile adds no numbering rule of its own\"),\n"
    "    \"the profile no longer says it adds no numbering rule of its own\"\n"
    "  );\n")

replace_once(CHECK_TEST,
    "  // The Year 4 history deck ran \"Explain your answer using the photograph.\" and\n"
    "  // three `[[ ]]` task steps in house blue, so the board was almost all blue and\n"
    "  // the colour stopped marking the questions (flagged by Daniel, 3 September\n"
    "  // 2026). Blue is a question children answer; the task they act on is black.\n",
    "  // The Year 4 history deck ran \"Explain your answer using the photograph.\" and\n"
    "  // three `[[ ]]` task steps in house blue, so the board was almost all blue and\n"
    "  // the colour stopped marking the questions (flagged by Daniel, 3 September\n"
    "  // 2026). Since 24 September the child's short task may be blue too, but only\n"
    "  // when the designer marks it `task-blue` (the first line here is one, his\n"
    "  // answer of 25 September: a job that names what to use); neither is marked,\n"
    "  // so both still block: blue without the role is refused whatever the line is.\n")

text = (ROOT / CHECK_TEST).read_text(encoding="utf-8")
assert "function slideOf(items" not in text
announce()
(ROOT / CHECK_TEST).write_text(
    text.rstrip("\n") + "\n" + (NEW / "slide-design-check.append.js").read_text(encoding="utf-8"),
    encoding="utf-8", newline="")

for rel, name in (
    ("builder/test/colours-follow-the-board.test.js", "colours-follow-the-board.test.js"),
    ("worksheet-html/test/worked-example-purple.test.js", "worked-example-purple.test.js"),
    ("working-wall-html/test/colours-follow-the-board.test.js", "wall-colours-follow-the-board.test.js"),
    ("scripts/tests/test_colours_are_kept.py", "test_colours_are_kept.py"),
):
    target = ROOT / rel
    assert not target.exists(), rel
    target.write_bytes((NEW / name).read_bytes())

print("tests done")
