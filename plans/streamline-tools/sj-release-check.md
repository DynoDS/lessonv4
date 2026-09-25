# The subject-files release (topic 8, release 1): first check

Checked on 25 September 2026, against the branch `streamline/8-subject-files` in
`C:\Users\Daniel\Projects\lessonv4-subjects` (from `2db3ceba`, nothing committed), the
builder's report `sj-release-report.md`, its scripts in `sj-change/`, his answers in
`plans/2026-09-23-subject-files-ledger.md` ("His answers, 24 September") and release 1 of
`plans/2026-09-24-topic-8-change-plan.md` with section 13. Nothing in either copy was
changed except this file. Scratch is `scratch/sjchk1/`.

## What I did

- Read every changed line old beside new (a word diff with line endings ignored), the
  75 removed rows' kinds in the ledger, and every reading line that routes an agent to
  the new homes.
- Ran the ledger's own quote checker (`check-ledger-quotes.py`) over a clean export of
  `2db3ceba` (all quotes found) and over the branch (96 rows not found), and compared the
  96 with the mapping's 96 changed rows.
- Searched the whole worktree outside `plans/` (instructions, commands, both manifests,
  the read-me, programs, tests, the review packet) for the skill, the guide and any
  subject file to come, by name and by concept.
- On a scratch copy of the whole plugin (no `node_modules`) with main's `plans/` ledgers
  beside it: ran the seven pin and diet tests untouched first (88 passed, 81,205
  subtests), then 51 attacks of my own, restoring each; the copy was byte for byte the
  branch again afterwards.
- On a second scratch copy: ran `build_sj_mapping.py` (after reading that it writes only
  into the copy it sits in, and seeing it print those paths): the pin file and the
  mapping came out byte for byte the branch's. Replayed every change script on a clean
  `2db3ceba` export in scratch (the builder's `sj_12_replay.py`, source pinned to the
  worktree, scratch folders left out of the comparison, its one guard relaxed to "inside
  sjchk1"): nothing only in the branch, nothing only in the replay, nothing different.
- Ran the suites in the worktree's plugin folder, with a scratch venv's `python3.exe`
  first on the path for pytest and bytecode writing off; hashed all 953 plugin files
  before and after, and the worktree was unchanged.
- Ran the unchanged validator from `2db3ceba` and from the branch over all 267 saved
  `lesson-design.json` files under the main checkout (not only the 53 under the three
  usual roots), comparing the whole output design by design.
- Measured sizes with line endings normalised, and counted em and en dashes in every
  changed or new file before and after.

## Findings, most serious first

**1. The prophet rule left two of the RE file's three readers.** The move made the rule
reach every lesson's designer, which is what he asked for, but the RE file's other two
readers no longer see its own words, and nothing sends them to the new home when it
matters.

- Old RE, read by the designer, the design reviewer and the adaptation designer of every
  RE lesson: "Islam does not depict Muhammad, and no lesson may request a picture of him
  or of any prophet; teach through the mosque, the Qur'an, calligraphy, the practice or
  the community instead."
- New RE: "Islam does not depict Muhammad (the rule every lesson follows is in
  `preferences.md` → Lesson Designer visual-need boundary); teach through the mosque,
  ..." The rule's words now live only at `preferences.md` L639.
- The design reviewer opens that section only on this card trigger
  (`design-review-packet.py` L141 to L149): "Read when a teaching or task unit's own
  content names something that exists in the world ... and that unit has no photograph
  or representation attached." A requested picture of a prophet is the opposite case, so
  the card never sends it there.
- The adaptation designer reads the RE file whole (`adaptation-designer.md` L48), "may
  request its own required photographs" (L224), and its list of preference sections
  (L46) does not include the visual-need boundary.
- What survives for them is "Islam does not depict Muhammad" and "teach through ...
  instead", so a picture of Muhammad would still probably be caught; "no lesson may
  request" and "or of any prophet" no longer reach them. This is the rounds' fault kind
  "a pointer that drops what its copy carried". Neither the report nor the log mentions
  it (both say only that the picture stage and the decorator do not read it, which was
  true before too).
- Fix: keep the rule's own words in the RE file as well, pointing without paraphrase
  (for example "Islam does not depict Muhammad, and no lesson may request a picture of
  him or of any prophet (the rule every lesson follows, in `preferences.md` → Lesson
  Designer visual-need boundary); teach through ..."), and change the test's
  `assertNotIn("no lesson may request a picture", re_file)` to hold both copies. A copy
  in RE costs no other lesson a read.

**2. The log's size bullet says the package is smaller; it is 442 KB larger.**
`build-review-log.md`, the new entry: "The package is 30.7 KB smaller: the skill and its
guide, which no lesson read." Measured with line endings normalised, the plugin folder
goes from 69,480,266 to 69,922,287 bytes (+442,021): the instruction files are 32,234
bytes smaller, the tests and pins 462,617 larger and the log 11,638 larger. The same
bullet then says the pins grow by 462 KB, so it contradicts itself. The report's own
wording ("The two removed files are 30.7 KB; the instruction files overall are 32.2 KB
smaller") is right; the log should say the same and give the whole-package figure.

- The same bullet says the circuit sentence adds about 170 bytes "in each of four places
  that only a circuit lesson's designers meet". One of the four is the `circuit-diagram`
  row of the section 1.2 capability index in `templates.md`, which the slide designer is
  told to scan at the start of every run ("Scan the section 1.2 capability index", L5),
  so that one is read in every lesson.

**3. A question for him, not a build fault: "any prophet" now reaches every lesson
without RE's limit beside it.** In the RE file the sentence sat straight after
"Christian art depicts Jesus freely, so a nativity, a crucifix or a Bible illustration
is ordinary teaching material." In `preferences.md` it stands alone: "no lesson may
request a picture of him or of any prophet." Islam counts Jesus, Moses, Noah and Abraham
among its prophets, so a literal designer of a history lesson on Victorian Christmas or
a Year 2 Noah's Ark story, which never reads the RE file, could take it as ruling out a
nativity or an ark picture. His words were "let's not have any pictures of him". The
plan moved the sentence whole, so this is his call: keep "or of any prophet" for every
lesson, or scope it (for example "any prophet of Islam"). It should not be changed
without asking him.

**4. The handover names the playbook's rows but not the reviewer's or the routes'.**
This release changes or removes RV-T05 (geography's "reads the book" line), RV-T06 (the
guide), RV-T07 and RV-T08 (the skill) in the design reviewer's list, and RT-L20 (the
English hedge) in the routes list. The report asks the lead to record PB-V20 and PB-B21
in the playbook ledger but says nothing of these five. Releases 2 and 3 re-check their
quotes and would stop on them, but the record belongs in the handover beside the
playbook's.

**5. The log's second quoted story silently joins two sentences.** The entry quotes the
skill as "The comparison is the only check that catches what cutting broke, and it
catches it nowhere else. Geography lost two ideas exactly this way, and both were found
by this run rather than by reading the file." In the skill (`SKILL.md` L261 at
`2db3ceba`) a sentence sits between them ("The casualty and the cousin both ask ...
without the other version beside it."). Mark the cut with "..." or quote only the story
sentence. (The first quoted passage, 465 characters, is word for word.)

**6. The Tudor story lost one fact and became a general claim (small, within the
plan).** Old: "A Year 4 deck on why Tudor children worked (14 September 2026) told its
invented cases in the present tense, named "Tudor" once or twice in eighteen slides, and
asked every question about the one child, and the user found the class would come away
thinking ...". New: "Invented cases told in the present tense, with the period named
once or twice and every question asked about the one child, leave a class thinking, in
the user's words, ...". His words are unchanged and the log holds the deck (L1243), but
"in eighteen slides" is now in neither place, and "once or twice" has lost what it was
out of.

**7. Two things the new tests cannot see (worth knowing, not blockers).**

- The designer is sent to the prophet rule's home twice: at the picture decision (L447,
  "read `preferences.md` → Lesson Designer visual-need boundary here to do it") and in
  its decision-point list (L558). The test checks only that the backticked section name
  appears somewhere in the designer's file, so deleting the L447 direction passed every
  ledger test (my attack 37).
- The "subject file to come" test matches eight fixed phrases. A reworded hedge added to
  the adaptation guidance ("An English subject file may be added later; until then use
  this.") passed (attack 39). Free text can only be held this way; the decision is held
  well enough for the words that were there.

## Found sound

- The 96 rows whose ledger quotes no longer hold on the branch are exactly the mapping's
  96 changed rows; no changed row was missed.
- The 75 removed rows are maintainer text or copies of rules held elsewhere (five shared
  rows, all retired in their own topics); at `2db3ceba` no run-time file pointed into
  either removed file, so nothing a lesson needs lived only there.
- No instruction, command, manifest, read-me, program, test or review routing names the
  skill, the guide or a subject file to come; `skills/` on disk holds only `make-lesson`,
  and the Codex manifest reads the folder.
- The adaptation guidance's "future subject-English file" line is the same hedge his
  words cover ("nothing around what could be added in future"); removing it loses no
  rule, and "where one exists" lines rightly stay.
- Decision 4 is exact, E66's permission is intact, and no other line or program makes
  sources compulsory in history.
- Decision 6 is exact in both files; the never-invented count (SC-G01, in
  `preferences.md` → Success Criteria), the food plate's caption and the reviewer's lunch
  example are where the log says. The dignity line ("no judging any child's real food")
  went with the rest; he was told it was one of them before he answered.
- Decision 8: one identical sentence in four places; a labelled photograph exists on the
  board, a sheet and the wall (the wall contract's `label-diagram`, L807); the stick-in
  and wall-visual lists make no year claim, so leaving them is right.
- Settled item 12: the designer's line carries both start notes' content under "At the
  start"; PSHE's heading "Choose the route from the actual learning" still says what J03
  said.
- Settled items 7 and 10: exact. His calibrating examples (the Victorian sketch, the
  Tudor lesson and boards, the rounding cases, the Classroom Secrets standard and
  endings, maths's three positions) are word for word bar the four dates, confirmed by
  the quote checker and by attacks on each.
- The earlier topics' pins: AK-C03, SC-C15, SC-C16, TD-A14 and VOC-M15 retired as held
  by their file staying gone, SC-G02 retired as absent everywhere, AK-B37, TD-K09 and
  TD-A13 moved to the new words, each with its reason in its pin and in its own ledger;
  AK-H10 rightly did not move.
- `ledger_pin_checks.py`'s two changes (the removed-file pin, a home that ends its file)
  work: a paragraph added after science's Eatwell line at the end of the file was caught.
- 51 attacks on the new pins, 49 caught (list in `scratch/sjchk1/attacks_result.txt`),
  including a date put back on each example, the sources rule made strict or softened,
  E66 dropped, a word changed in the sketch, the Tudor sort, the rounding case, Aria and
  Jen, the prophet rule softened, cut, removed or moved to the slide designer's section,
  RE's examples, pointer or Christian limit dropped, food rules added under either
  Eatwell line, the old quota rule copied into science, each circuit sentence removed or
  changed, the skill, the guide or a seventh subject file back.
- Suites on the branch: Python 2,215 passed, 1 skipped; builder 742, worksheet-html 722,
  working-wall-html 142, stick-in-sheets-html 70, all passing, as the report says (the
  voice harness, `shared` and the root tests were not rerun).
- Saved designs: all 267 give identical validator output on `2db3ceba` and the branch (9
  pass on both); the validator itself is unchanged.
- The record builder and the replay reproduce the branch byte for byte, as the report
  says.
- Sizes: every figure in the report's table matches mine (its tests row counts only the
  touched test files; the change, +462,617, is the same).
- No em or en dash was added anywhere: the only new ones are copies of existing headings
  and quoted text inside the new pin file and the mapping.
- `sj_09_follow_at_merge.py` writes only into the copy it sits in, prints that path, and
  writes nothing if any pin fails to hold. Main's working-tree pins touch this branch's
  words only at WS-G09 and its home, which the script covers. I did not rerun the trial
  merge.

## Found in passing (not this release's)

- The history file now says both engines' "own guidance places each mark in proportion
  to its real date". The slide guidance (`templates.md` L1959) and the wall contract (L745)
  do; the sheet catalogue's `timeline` entry says nothing about it, and its own worked
  example is not in proportion ("2,000,000 years ago" at 0.02, "12,000 years ago" at
  0.44). One for the worksheets or drawing topic.
- `agents/diagram-anchor.md` still says "the working wall carries no label-diagram"; the
  wall contract and renderer now carry one.

## What I would fix before release

1. Finding 1: keep the prophet rule's own words in the RE file as well as in
   `preferences.md`, and change the test to hold both copies.
2. Finding 2: correct the log's size bullet (instruction files 32.2 KB smaller, the
   package about 442 KB larger, most of it the new pin file) and the "only a circuit
   lesson" line.
3. Finding 5: mark the cut in the log's second quotation.
4. Finding 4: add RV-T05 to T08 and RT-L20 to the handover beside PB-V20 and PB-B21.
5. Finding 3: ask him whether "or of any prophet" should reach every lesson as written.
