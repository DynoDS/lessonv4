# The subject-files release (topic 8, release 1): what was built

Built on the side branch `streamline/8-subject-files` (worktree
`C:\Users\Daniel\Projects\lessonv4-subjects`, from `2db3ceba`, 4.2.289), following
`side-branch-brief.md`, release 1 of `plans/2026-09-24-topic-8-change-plan.md`, and his
answers in `plans/2026-09-23-subject-files-ledger.md` ("His answers, 24 September"),
with the prophet line from the plan's section 13. Nothing is committed; no version is
set; the build-log entry has no number.

## In short

- Every decision and settled item the plan gives release 1 is built, with his words as
  the standard. One thing beyond the plan's list, inside his answer: the adaptation
  guidance also said English progression "belongs in a future subject-English file";
  that is the same hedge, and it goes too (found by this release's own test).
- The change is scripts in `sj-change/` (order below), each old text asserted once. A
  replay on a clean `2db3ceba` tree reproduces this copy file for file (`sj_12_replay.py`).
- Every suite passes on the repaired tree (Python 2,217 passed and 1 skipped against 4.2.289's 2,201 and 1; every node suite the same count as 4.2.289, because no engine changed). The 53 saved designs give the same result as on 4.2.289, design by design.
- **Repaired after the first check** (`sj-release-check.md`, see "The first check, and
  what was repaired"): RE keeps its own rule beside its pointer; with his answer of 25
  September ("yes to prohet muhammad not being pictured"), every lesson's rule is the
  Prophet Muhammad only, and RE keeps "or of any prophet" beside its nativity line; the
  log states the sizes truly (see below); the circuit sentence's catalogue row is said to be read in every run; the log
  quotes the skill's comparison paragraph whole; the Tudor telling keeps "in eighteen
  slides"; the handover names RV-T05 to T08 and RT-L20; the two attacks that got through
  are now caught.
- **Repaired after the second check** (`sj-release-second-check.md`, see "The second
  check, and what was repaired"): the every-lesson Prophet Muhammad sentence is also
  where the adaptation designer decides its own photographs; the picture section every
  lesson reads is pinned paragraph by paragraph; the hedge shapes grew from five to
  eleven; the handover names all 30 rows of other lists this release changes, PF-N74 and
  N75 among them, and `sj_09` now retires a pin on a removed paragraph instead of
  stopping; the log's claims say only what the tests hold, and its figures are measured
  again.
- A trial merge with the worksheets release (4.2.290, the main checkout's working tree
  committed in a throwaway shared clone in scratch, then git merged with this branch),
  repeated after the repairs, conflicts only in the build log, where both releases
  append; every pin file, `ledger_pin_checks.py`, the lesson designer and
  `preferences.md` merge on their own. With the log taken as both entries and
  `sj_09_follow_at_merge.py` run, the whole Python suite passed on the merged tree
  (2,241 passed, 1 skipped, before the second check's repairs; the second check's own
  trial merge ran every suite, node included, and all passed). Not repeated after the
  second check's repairs, at the lead's word: he merges after the worksheets release is
  committed and reruns everything then.
- Attacks on the new pins: 23 of mine on the first merged tree, all caught; the first
  check's 50, of which 48 were caught; after the repairs the two that got through, and
  six more on the repaired lines and his answer (RE losing its own rule, "any prophet"
  put into every lesson's rule, the Prophet Muhammad rule taken out, RE's nativity line
  moved away from its rule, the Tudor count cut, the reading list losing the section),
  all caught (`sj_attacks4.py` in scratch); the second check's 44, of which 32 were
  caught; after its repairs the adaptation designer's rule removed, a ban on any prophet
  or other figures written in three other places, and its six hedge rewordings, all
  caught (`sj_attacks5.py` in scratch, 11 of 11).
- The instruction files are 32.0 KB smaller (30.7 KB of it the two removed files, never
  read in a lesson); the package as a whole is about 492 KB larger, 483 KB of it the new
  pin file. What a lesson reads: a PSHE lesson 1.8 KB less, history 0.4 KB and
  geography 0.3 KB less, science 0.14 KB and RE 0.12 KB more, the lesson designer 0.3 KB
  and the adaptation designer 0.15 KB more.

## Order of work, and the scripts

All in `plans/streamline-tools/sj-change/`, each run with `python -X utf8 <script>`;
each finds the copy it sits in from its own place and prints it.

| Script | What it does |
|---|---|
| `_patch.py` | one replacement at a time, old text asserted once, line endings kept |
| `sj_01_stories.py` | checks the log already holds every date and story that leaves; copies the one it lacks (the skill's "geography lost two ideas", SJ-C43 and C50) into a new entry, before anything moves |
| `sj_02_remove.py` | decisions 1 and 3: deletes the skill and its guide; the setup guide, read-me, reasoning prompts and adaptation guidance stop naming a subject file to come; two tests stop naming the skill |
| `sj_03_subjects.py` | the six subject files, the lesson designer's reading line, the prophet rule's new home |
| `sj_04_reaches.py` | decision 8: the circuit sentence in four places |
| `sj_05_tests.py` | the diet test, the shared pin checks, the vocabulary test, the new ledger test |
| `sj_06_repin_other_topics.py` | the earlier topics' pins that followed the words, in place |
| `sj_07_record_in_ledgers.py` | each of those recorded in its own ledger |
| `build_sj_mapping.py` | the mapping (`plans/2026-09-25-subject-files-mapping.md`) and the pins |
| `sj_08_log_entry.py` | the log entry around the stories (its two figures from `log_facts.txt`) |
| `sj_09_follow_at_merge.py` | **for the lead, after the merge**: moves the worksheets release's pins on the maths paragraph this release undated |
| `sj_10_sizes.py`, `sj_11_dash_check.py`, `sj_12_replay.py`, `sj_13_compare_designs.py` | sizes, the dash check, the replay, the saved designs |

Replay order: sj_01 to sj_07, build_sj_mapping, sj_08.

## What changed, decision by decision

### Decisions 1 and 3: the skill and its guide are gone

His words: "forget about 'writing a new subject file' guidance. it should just knowe the
files it has, nothing around what could be added in future." and "is this a new skill
called make subject file skill or something? just remove it completely."

- Deleted: `skills/make-subject-file/SKILL.md` (25.6 KB) and
  `references/authoring-subject-files.md` (5.0 KB). Ledger rows B01 to B20, C01 to C54 and
  C56 (75) go with them, each pinned as held by its file staying gone.
- `computer-setup.md` (SJ-C55, the playbook's PB-V20) and the package `README.md` (same
  clause, in no ledger) stop listing "writing a subject file".
- `reasoning-prompts.md` loses "Until a subject-English file exists, keep the detailed
  reading, writing and grammar guidance below active." (SJ-A59); the English bullets stay.
- **Beyond the plan's list:** `adaptive-adaptation.md`'s "Detailed English progression
  belongs in a future subject-English file." goes. It is the same hedge (the read-back
  names "the ... hedges", plural), in no ledger; the new test found it.
- Kept, and why: "where one exists" / "when this lesson's subject has one" (the lesson
  designer, the adaptation designer, the reasoning prompts, the adaptation guidance) are
  about subjects with no file today, not files to come.
- Tests: the root contract's token count and the no-publishing docstring stop naming it.
- The new test also holds the idea, not only the old words: eleven shapes of a sentence
  about a subject file to come ("may be added later", "a future ... file", "until ...
  exists" and two more), tried against every instruction file and the read-me; a test
  of its own checks the shapes catch both old hedges and every rewording the two checks
  tried (a hedge put some other way would pass), and nothing the files
  say now.

### Decision 4: history need not use sources

His words: "History doesnt always need sources right? It often leads to it anyway, but
does it have to be a strict rule?" The top line (SJ-E09) now opens "When the lesson uses
sources, teach historical knowledge through the evidence: ...", the rest unchanged. The
sketch and its lead-in unchanged bar the date; E66 stands.

### Decision 6: food follows the NHS Eatwell Guide

His words: "those balanced diet things sound like things I wouldnt want in the pshe
subject files", "extra rul4es yes, maybe the subject file could say to look for guidance
from eatwell guide thing", "yes and yes".

- PSHE `## Food and diet` (J24 to J28: five paragraphs, not the plan's "four") is one line:
  "A lesson about food, diet or healthy eating follows the NHS Eatwell Guide for what a
  balanced diet is and how it is shown." Science gains the same heading and line at its
  end.
- Not gone: the reviewer's single-lunch example, the food plate's caption and its ban on
  good and bad foods, the no-invented-count rule (SC-G01). SC-G02 retired.
- `test_diet_and_safety_content_boundaries.py`: the four tests became one (both files
  carry the pointer; no subject file carries the rules' sentences).

### The prophet line (his answer to question 1)

"Okay, so yeah, let's not have any pictures of him." Then the first check's question
(in the RE file the rule sits straight after "Christian art depicts Jesus freely, so a
nativity, a crucifix or a Bible illustration is ordinary teaching material.", and carried
alone to every lesson "or of any prophet" could rule out Noah's ark or a nativity). Asked
whether every lesson gets only "no pictures of the Prophet Muhammad" while RE keeps its
fuller rule with that exception, he answered "yes, purple is fine, yes to prohet muhammad
not being pictured" (recorded in the ledger, which this branch's copy now carries).

- `preferences.md` → Lesson Designer visual-need boundary gains, as its own paragraph
  after the limits that win over the referent test: "**Islam does not depict the Prophet
  Muhammad, and no lesson may request a picture of him.**" Every lesson's designer reads
  that section when it decides its pictures (sent there twice: at the picture decision
  and in its reading list; both directions are now pinned).
- RE keeps its fuller rule in its own words, straight after its nativity line, with a
  pointer: "Islam does not depict Muhammad, and no lesson may request a picture of him or
  of any prophet (every lesson's rule, no picture of the Prophet Muhammad, is in
  `preferences.md` → Lesson Designer visual-need boundary); teach through the mosque, the
  Qur'an, calligraphy, the practice or the community instead." Keeping the words, not
  only a pointer, is for the RE file's other two readers, the design reviewer and the
  adaptation designer, who read the RE file whole and are not sent to that preferences
  section for this (the first check's finding 1).
- The adaptation designer asks for its own photographs in any subject and does not read
  that preferences section, so the every-lesson sentence is also where it decides them,
  at the end of its picture paragraph in `### 5. Plan visual requirements`, pointing at
  its home (the second check's finding 1).
- The picture stage and the decorator do not read it: they fetch what the designers name.
- Tested, as the lead asked: a nativity picture in a Christmas lesson is not refused by the every-lesson
  rule (it names only "him", the Prophet Muhammad; the section still shows its own nativity
  example as a thing worth showing; and no program refuses a picture by what it shows).
- Pinned: the preferences paragraph (and "any prophet" barred from it), RE's sentence, its
  nativity line sitting straight before it, and the designer's two directions.

"purple is fine" in the same answer is about another list (topic 7's colours), not this
release.

### Decision 8: circuit symbols are Year 6 work

One sentence, "Standard circuit symbols are Year 6 work (`subject-science.md`); a Year 4
lesson shows a labelled photograph of a real circuit instead (`label-diagram` on the
photograph).", in `templates.md` (the catalogue row and the `circuit-diagram` section),
`worksheet-helpers/science.md` (after the "whole electricity unit" line) and
`working-wall-card-contracts.md` (after "Wall material for an electricity unit").
`label-diagram` on a photograph exists on all three surfaces (checked by the script).
The catalogue row sits in `templates.md`'s section 1.2 capability index, which the slide
designer scans at the start of every run, so that copy is read in every lesson; the sheet
guide's copy is read in every science lesson with a sheet (the worksheet designer reads
its subject's helper guide); the drawing's own section and the wall's contract are met
only by a lesson that draws a circuit.
Left alone: the generated sheet catalogue's purpose line (no claim about a unit or year;
changing it means the sheet engine's purpose list), the stick-in and wall-visual lists,
the engine's code comment, and `circuit-symbol-bank` (his answer named the circuit
drawing). Nothing refuses the drawing in Year 4.

### Settled items

- **12:** history's and geography's word-for-word start notes (E01, G01) fold into the
  lesson designer's reading line (A04), which now says to read the file "before the
  structure is chosen: in history and geography its routing is part of that choice" and
  to "Come back to it alongside the teaching-sequence file once the structure is set: the
  structure file tells you what shape the lesson takes, and the subject file what the
  thinking inside it should be." Maths, science, RE and PSHE keep their notes. PSHE's
  "The PSHE label does not determine the route." (J03) goes; the designer's Structure
  Decision holds it.
- **10:** "(4 September 2026)" out of the sketch's introducing sentence and nothing else
  of it (E11); "on 14 September 2026" out of the Tudor boards (E21); the rounding ruling's
  "19 September 2026" (D12); "(16 September 2026)" after Classroom Secrets (D42). E27: the
  Tudor deck loses its date and name ("A Year 4 deck on why Tudor children worked (14
  September 2026)" becomes "A deck that"), and the rest of its telling stays word for
  word, "in eighteen slides" and his words included, as a plain undated example (the
  first check's finding 6: my first build had cut the count and made it a general
  claim).
- **7:** the timeline line (F26), "the historical part" (E39), and geography's reviewer
  line (G45, RV-T05) say what is true. H04 stays (the plan).
- **9:** maths's three positions untouched.

### Not done, as the plan says

- F28 (decoration on sad history) is 7B's.
- D15's "(17 September 2026)" story and D21's "12 September 2026" (pinned by the rhythm
  topic, TD-K17) stay: no decision or settled item names them. A question for him.
- The science, RE and PSHE titles keep their em dashes; `shared/visual-parity.js` still
  says a school timeline is "almost never honestly to scale" (code, outside this list).

## Pins, and why each moved

**This topic.** `scripts/tests/subject_files_ledger_pins.json` pins all 490 rows: 394 in
place; 96 changed, moved or retired (each with its decision and whole paragraph; 75
removed with their files); three added rows (science's food line; the circuit sentence
in four places; where each agent that asks for pictures meets the Prophet Muhammad
rule: the lesson designer's two directions and the adaptation designer's sentence); four
homes (the picture section every lesson reads, `### Lesson Designer visual-need
boundary`, added after the second check, and PSHE and science `## Food and
diet`, RE's picture section). `test_subject_files_ledger_is_kept.py` runs the shared
checks and ten decision tests: among them that the six files on disk are the six the
review packet hands the reviewer, that the prophet rule is in both its places, and that
no sentence has the shape of a subject file to come.

**Shared checks.** `ledger_pin_checks.py` learns `fileRemoved` (a phrase whose whole file
he removed stays gone while the file does; the file coming back fails) and reads a home
that ends its file to the end, line for line the worksheets release's change (the trial
merge took both cleanly). `test_vocabulary_ledger_is_kept.py`, which carries its checks
inline, learns `fileRemoved` too.

**Earlier topics, moved in place by `sj_06` and recorded in their own ledgers:**

| Pin | Why |
|---|---|
| AK-C03, TD-A14, VOC-M15 (the skill), SC-C15 (the guide), SC-C16 (the skill) | retired with the removed files, decisions 1 and 3 |
| SC-G02 | retired: PSHE's per-meal quota rule, decision 6 |
| AK-B37 | the Tudor boards without their date, settled 10 |
| TD-K09 | the sketch's lead-in without its date, settled 10 |
| TD-A13 | the designer's reading list gained the start note, settled 12 |

AK-H10 (the E26 paragraph the plan expected to move) pins phrases the change left alone,
so it did not move.

**At the merge (the lead):** the worksheets pins WS-G09 and HOME-WS-MATHS-WORDING-02 hold
the maths paragraph with "(16 September 2026)". Run `sj_09_follow_at_merge.py` after the
merge; on the trial merge it moved exactly those (three records) and every pin test
passed. It writes nothing if anything else fails to hold.

## The first check, and what was repaired

`sj-release-check.md`, each finding verified against the files first. The repairs are in
the change scripts themselves (sj_01, sj_03, the test in `new/`, the mapping builder,
sj_08 and `log_facts.txt`, sj_09's substitutions), and the branch was rebuilt from a
clean 2db3ceba state by running them, so a replay makes the repaired release directly.

| Finding | Verified | Repair |
|---|---|---|
| 1. The prophet rule left RE's reviewer and adaptation designer | yes: the reviewer's card sends it to the visual-need section only for a referent with no picture; the adaptation designer's preference list does not name that section | RE keeps the rule's own words with a pointer, no paraphrase; the test holds both copies and both of the designer's directions; the mapping pins them |
| 2. The log said the package was 30.7 KB smaller; the catalogue row is read every run | yes | the log says the instruction files are smaller and the package larger, each measured whole by `sj_10_sizes.py` (figures again after the second check, below); the catalogue row's reach is stated |
| 3. "or of any prophet" without RE's Christian line | a question, not a fault | his answer, "yes to prohet muhammad not being pictured": every lesson's rule names the Prophet Muhammad only; RE keeps any prophet beside its nativity line |
| 4. The handover missed RV-T05 to T08 and RT-L20 | yes | the table above, and the log's closing paragraph |
| 5. The log's second quote joined two sentences | yes (a sentence sat between them) | the paragraph is quoted whole; sj_01 now asserts each quoted passage is the skill's own words before the skill is removed |
| 6. The Tudor story lost "in eighteen slides" | yes | only "A Year 4 deck on why Tudor children worked (14 September 2026)" becomes "A deck that"; the rest stays word for word |
| 7a. Deleting the designer's picture-decision read line passed | yes | pinned (an added row) and tested |
| 7b. A reworded "subject file to come" passed | yes | five shapes of such a sentence, tested against every instruction file, with a test that they catch the old and reworded hedges and nothing the files now say |

Found in passing by the check, not this release's, passed on: the sheet catalogue's
`timeline` entry says nothing about proportion and its worked example is not in
proportion (for the worksheets or drawing topic); `agents/diagram-anchor.md` still says
"the working wall carries no label-diagram", which the wall contract and renderer no
longer bear out.

## The second check, and what was repaired

`sj-release-second-check.md` found no blocker. Each finding verified against the files
first; the repairs are in the change scripts, and the branch was rebuilt from a clean
2db3ceba state by running them.

| Finding | Verified | Repair |
|---|---|---|
| 1. Outside RE only the lesson designer met the every-lesson rule, yet the adaptation designer asks for its own photographs | yes: its preference list does not name the section | the sentence, word for word, ends its picture paragraph (`### 5. Plan visual requirements`), pointing at the home; pinned (`SJ-PROPHET-READERS`) and tested |
| 2. Twenty rows of two more lists break, PF-N74 and N75 among them | yes | the handover table names all 30 rows in five lists; the note on PF-N74 and N75; `sj_09` retires a pin on a removed paragraph instead of stopping (tried on scratch) |
| 3. The nativity test was narrower than the log said; four bans elsewhere passed | yes | the picture section every lesson reads is pinned as a home, paragraph by paragraph; the test bars "any prophet" in every instruction file outside RE; the log says what the tests hold |
| 4. The hedge shapes caught two rewordings in eight | yes | eleven shapes now, catching all eight; the log and report say a hedge put some other way would pass |
| 5. The pin file's size was stale | yes | every figure measured again (the pin file is now 483,217 bytes, because the home adds the picture section) |
| 6. The sheet guide's circuit copy is read in every science lesson with a sheet | yes | the log and report say so |
| 7. The first check's attacks were 48 of 50 | yes | corrected |
| 8. Nothing held that the reviewer reads RE whole | yes | the test holds that the packet reserves a section only in maths |

## The suites

`bash plans/streamline-tools/run-all-suites.sh sj-final` on the finished tree (logs
`sj-final-*.log` beside the script; the baseline is `sj-before-*.log`):

| Suite | After | Baseline (4.2.289) |
|---|---|---|
| python (`scripts/tests`) | 2,217 passed, 1 skipped | 2,201 passed, 1 skipped |
| voice harness | 21 passed | 21 |
| builder | 742 pass, 0 fail | 742 |
| worksheet-html | 722 pass, 0 fail | 722 |
| stick-in-sheets-html | 70 pass, 0 fail | 70 |
| working-wall-html | 142 pass, 0 fail | 142 |
| shared | 126 pass, 0 fail | 126 |
| test | 46 pass, 0 fail | 46 |

Python: the diet test's four checks became one (-3) and the new ledger test adds 19. This
run is on the repaired tree, log entry included.

**An environment fault, not this release.** About 12:48 the machine's `python3` (the
Microsoft Store Python 3.13 alias) began to hang, and the first after-run sat on
`test_unavailable_picture_route.py`, which calls `python3` by name (so does
`test_make_lesson_static_contract.py`). The worksheets checkers' scratch runs hung on it
too; I told the lead. The final run put a scratch folder holding only a working
`python3.exe` (a redirector to the same installed Python 3.13) first on the path for
that run; nothing in any plugin or setting changed. The `sj-after-*` logs are that
interrupted first run (its node suites and saved designs are good; its Python log was
overwritten by a mistaken rerun and shows only "No module named pytest"); the
`sj-final-*` logs are the run that counts, on the repaired tree.

## The saved designs

`validate-saved-designs.py` over the 53 saved designs under the three usual roots of the main checkout, before (`sj-before-designs.json`) and on the repaired tree (`sj-final-designs.json`): the same result for every design (`sj_13_compare_designs.py`: "designs whose result changed: none"). All 53 are refused both times, for reasons older than this release; the validator is untouched. The first check ran all 267 saved designs under the main checkout on 2db3ceba and on the branch: identical output for every one.

## Renders

None: nothing this release changes is drawn. The circuit sentence is guidance; the
drawing is unchanged.

## Size, before and after

As git stores them (`sj_10_sizes.py`):

| Group | 4.2.289 | After | Change |
|---|---|---|---|
| The six subject files | 122,660 | 120,360 | -2,300 (PSHE -1,805, history -382, geography -339, maths -39, science +142, RE +123) |
| Other instruction files read in a lesson | 844,515 | 845,558 | +1,043 (templates +345, lesson designer +291, adaptation designer +148, sheet science guide +172, wall contract +172, preferences +93, reasoning prompts -107, adaptation guidance -71) |
| Setup guide and read-me | 25,821 | 25,773 | -48 |
| Removed (never read in a lesson) | 30,661 | 0 | -30,661 |
| **All instruction files** | | | **-31,966** |
| Tests and pins (the files this release touched) | 1,630,764 | 2,139,418 | +508,654 (483,217 bytes the new pin file) |
| The build log | 699,322 | 715,041 | +15,719 (the entry and its one story) |
| **The whole package** (`plugins/lesson-v4`) | 69,481,789 | 69,974,196 | **+492,407** |

## Files touched (for the merge)

Plugin, changed: `README.md`; `agents/lesson-designer.md`; `references/`
`adaptive-adaptation.md`, `build-review-log.md`, `computer-setup.md`, `preferences.md`,
`reasoning-prompts.md`, `subject-geography.md`, `subject-history.md`, `subject-maths.md`,
`subject-pshe.md`, `subject-re.md`, `subject-science.md`, `templates.md`,
`working-wall-card-contracts.md`, `worksheet-helpers/science.md`; `scripts/tests/`
`ledger_pin_checks.py`, `test_diet_and_safety_content_boundaries.py`,
`test_plugin_root_contract.py`, `test_run_never_publishes.py`,
`test_vocabulary_ledger_is_kept.py`, `assumed_knowledge_ledger_pins.json`,
`success_criteria_ledger_pins.json`, `teach_then_do_ledger_pins.json`,
`vocabulary_ledger_pins.json`.
Plugin, deleted: `skills/make-subject-file/SKILL.md`, `references/authoring-subject-files.md`.
Plugin, new: `scripts/tests/subject_files_ledger_pins.json`,
`scripts/tests/test_subject_files_ledger_is_kept.py`.
Plans, changed: `2026-09-22-assumed-knowledge-ledger.md`, `2026-09-23-success-criteria-ledger.md`,
`2026-09-22-teach-then-do-ledger.md`, `2026-09-22-vocabulary-ledger.md` (a closing note each).
Plans, new: `2026-09-25-subject-files-mapping.md`, `streamline-tools/sj-change/`, this
report, the `sj-before-*` and `sj-after-*` logs, and
`2026-09-23-subject-files-ledger.md`, **a byte-for-byte copy** of the main checkout's
untracked ledger (the pin test reads it). If main commits its own first, the two are
identical and merge as one; if main still has it untracked, delete this copy first or git
refuses the merge. Already modified on the branch before I began (the lead's):
`streamline-tools/ledger_mapping.py`, `run-all-suites.sh`.

**Merge notes.** The build log conflicts (both append): keep the worksheets entry, then
this one. Then run `sj_09_follow_at_merge.py`. No version or plugin.json change here. No
earlier builder is frozen on this branch; main's frozen ones win at the merge, and none
must be rerun (a rerun would undo `sj_06`'s moves).

**PF-N74 and PF-N75 must follow this branch.** They are the PSHE food paragraphs his
decision 6 removed, and the rest-of-preferences ledger marks them "STAYS (SUBJ)". This
branch merges before topic 7's 7A, so 7A pins them as this release leaves them (gone, or
retired), never as kept. Should a pin on them exist before `sj_09` runs, it is now retired
(its words barred where they were) rather than stopping the follow-up: `sj_09` holds the
paragraphs and lines this release removed from files that stay (the five food paragraphs,
PSHE's route-label line, the history and geography start notes), tried on a scratch copy
with a PF-N74 pin written as kept ("FOLLOW_OK 1 moved").

**Rows of five other lists this release changed, to record in their ledgers** (none is on
this branch, and none has a pin file yet; each list's release would stop on them when it
re-checks its quotes). The second check listed the 20 in the rest of preferences and the
voice guide by running the quote checker over every ledger, `2db3ceba` against the branch:

| Ledger | Row | What happened |
|---|---|---|
| playbook | PB-V20 | the setup guide's "writing a subject file" clause removed (SJ-C55) |
| playbook | PB-B21 | the skill's test-run line, removed with the skill (SJ-C48) |
| design reviewer | RV-T05 | geography's "The design-reviewer reads the book at the end of the lesson" corrected to "The design reviewer reads the finished design against this file" (SJ-G45) |
| design reviewer | RV-T06 | in the removed writing guide (SJ-B15) |
| design reviewer | RV-T07, RV-T08 | in the removed skill (SJ-C07, SJ-C33) |
| routes | RT-L20 | the reasoning prompts' "Until a subject-English file exists" hedge removed (SJ-A59) |
| rest of preferences (topic 7) | PF-A42, A43, A45, A46, B33, D80, M48, M49, M84, M99, O30 | in the removed skill and guide |
| rest of preferences | PF-C59 | the Classroom Secrets paragraph, "(16 September 2026)" removed (SJ-D42) |
| rest of preferences | PF-N28 | the past-tense paragraph, the Tudor deck's date and name removed (SJ-E27) |
| rest of preferences | PF-N74, PF-N75 | the PSHE food paragraphs, removed (SJ-J24 to J28); see the note above |
| rest of preferences | PF-S13 | RE's picture paragraph, the pointer added (SJ-I08) |
| rest of preferences | PF-W29 | the Tudor boards, "on 14 September 2026" removed (SJ-E21) |
| voice guide | VG-M42, VG-M43, VG-M44 | in the removed guide and skill |

## Anything he should know

- **The door is closed on purpose.** There is no command for writing a subject file now;
  his answer asks for exactly that. Codex keeps the command until
  `codex plugin add lesson-v4@lessonv4` refreshes its per-version copy.
- **The food rules are gone from PSHE**, not moved: what a lesson now meets is the
  Eatwell pointer, plus the reviewer's example, the plate drawing's caption and the
  no-invented-count rule where they already were.
- **The Prophet Muhammad rule** is read by every lesson's designer; RE's fuller rule (any
  prophet, beside its nativity line) by an RE lesson's designer, reviewer and adaptation
  designer through the RE file. The picture stage never sees either, and does not need
  to while the designer never asks.
- **Two dated stories remain in the maths file** (17 and 12 September): a question for him.
- **Untried on a real run.**
