# The voice guide release (topic 8, release 5): what was built

Built from `voice-release-brief.md`, following `plans/2026-09-24-topic-8-change-plan.md` section 6 (with
sections 0, 1, 8, 10 to 13), the teacher's words in `plans/2026-09-23-teacher-voice-ledger.md` ("Decisions
taken", "His answers, 24 September (afternoon)", the settled items and the closing sections), and the parts of
`plans/streamline-tools/humour-diagnosis.md` (causes 1 and 3) the plan gives release 5. Built on the side branch
`streamline/8-voice` in `C:\Users\Daniel\Projects\lessonv4-voice`, from `91687471` (4.2.294). Nothing is
committed; the version is not bumped (the lead sets it at merge). Repaired after the first independent check
(`vg-release-check.md`), in one round: see "Repairs after the first check", which comes first.

## His answer on the week 3 notes (26 September)

Shown the four points taken from his tooth-decay notes and asked whether repeating a phrase for rhythm ("a tiny
bit ... a tiny bit more") is fine in speaker notes, with the guide's warning against repeated phrases staying for
what is written on a slide, he said "yes thats fine". The lead relayed it; it was not yet in this copy's voice
ledger, so `vg_00_his_rhythm_answer.py` records it there ("His week 3 notes, and a phrase repeated for rhythm",
in "Decisions taken", with the lead's words and a read-back), and the replay reproduces it. Built:

- **The notes part** of the guide's §2 gains a fifth line from his lesson, quoted exactly: "**A phrase repeated
  for rhythm is how speech builds** (the teacher: "yes thats fine"): `It eats away a tiny bit of enamel today, a
  tiny bit more tomorrow, a tiny bit more the day after that.` §3's warning against a repeated shape still holds on
  the written board and page."
- **The warning names the written board.** §3 (Sentence rhythm) gains, after its `Important` line: "A phrase
  repeated on purpose for rhythm is the one exception, and only in speech: in a speaker note it is how speech builds
  (`a tiny bit ... a tiny bit more`), and the teacher wants it there (§2). On the written board and page, the
  warning above stands." The rest of §3 (tidy transitions, uniform polish) still reaches every string, scripts
  included, as his answer only concerned the repeated phrase.
- **Mapped with his words** as the added row VG-DEC-RHYTHM; a decision test; two undo attacks (the line taken out;
  the exception widened to the board), both caught.
- **Not changed:** the lesson designer's four register tells and the reviewer's voice sweep still name adjacent
  sentences of one shape as a slip in any string; a phrase repeated inside one spoken sentence is not that.
- **At the merge:** his entry sits inside the ledger, so taking main's side of that ledger at a conflict would drop
  it; `vg_09` now puts it back when no entry under its heading is there (the trial merge exercised this).

## Repairs after the first check

The lead asked for five repairs, and held the question of repetition for rhythm to ask him.

1. **The lesson's length is stated truly.** The guide said the week 3 lesson's longest Teach script "ran to nearly
   two hundred words"; it is 149 (184 only with the teacher information under it). It now says "about a hundred
   and fifty words". The report's own figures are corrected below (the vocabulary script is 115, not 150).
2. **The routes release's third row is mapped, and the trial merge is redone against main.** The routes release,
   now committed on main as `8af6f8a9` (4.2.295), rewords VG-O41 too (the content route's "That doesn't mean"
   paragraph: "the same-shape fault above" is now "saying the same thing three ways", his ruling kept without its
   date). `build_vg_mapping.py`'s `ROUTES` maps it from that commit's words, with VG-L16 and VG-M49; the log and
   this report say three rows. The trial merge (`vg_14_merge_trial.py`) is now a real `git merge` of this branch
   onto `8af6f8a9` in a throwaway clone: conflicts only in six ledgers, the log and the rhythm's pin file, every
   instruction file merging cleanly; resolved as `vg_09` says, then `vg_09_follow_at_merge.py`: the whole Python
   suite passes on the merged tree (2,382 and 1 skipped, after his answer) and the voice harness 21.
3. **The fold keeps "or critique".** The lesson designer's shorter copy sent "a comparison or critique prompt" to
   §12; the guide's route, which it now follows, said only "a comparison prompt". The route now says "a comparison
   or critique prompt §12". The success-criteria and vocabulary pins on that paragraph hold other phrases of it
   ("success criteria §10", "a definition or explanation §5"), which did not change, so they hold as they are (the
   repin script found nothing of theirs to move); this list's own pins on the paragraph were rebuilt.
4. **The smaller items.**
   - A test now holds that nothing sits between the guide's title and `## Purpose` (the homes start at Purpose, so
     a paragraph slipped in there was caught by nothing).
   - The adaptation designer's pointer reads one way: "On a separate Below resource, keep essential subject
     vocabulary and proper nouns as Written Voice's Below paragraph says: supported, not automatically replaced."
   - The six retired wordings found nowhere else are barred everywhere: the Maintenance heading, "Do **not** keep
     expanding it ...", "Keep detailed calibration examples ...", "A Year 4 RE slide printed ...", "§§1 and 3 a
     spoken script", "Keep necessary subject vocabulary and use accessible support around it.". (The two date
     phrases and the adaptation words that Written Voice's Below paragraph still holds stay barred in their own
     file only.)
   - The RE example keeps "Year 4": "A Year 4 slide that prints `What do their reasons share?` ...", so "a
     nine-year-old" in it reads as that class, not a fixed reader.
5. **His speaker-notes answer, fully, and decision 13.** Brought from 7B (its B1) by the lead, in 7B's planned
   words and his, so the designer that writes every script and the guide no longer pull against each other:
   - The lesson designer's notes voice, which said "clear simple language a nine-year-old follows easily, short
     straightforward sentences", now reads "as long as the idea needs and conversational, in words the children in
     this class follow (the teacher: "it doesn't have to be short sentences"), with concrete explanations of
     anything unfamiliar and a warm direct tone that speaks to the child in front of you. Ask how you would say this
     so these children understand it." Its other sentences are unchanged.
   - The notes hand-off gains his words beside "chosen for the idea rather than a mechanical simplicity rule": "(in
     the teacher's words, "speaker notes are as long as the idea needs, of course, and they're also
     conversational")".
   - Decision 13's other three lines say a child in this class: a sort's two groups ("in one plain sentence a child
     in this class would follow"), preferences' own-question test ("as a child in this class who has not met the
     topic"), and the adaptation designer's Greater Depth line ("met by a child in this class reading it alone"),
     whose example now names its child (`Is Asha right about all of it?`), the rest-of-preferences list's PF-N82,
     fixed in the same edit as 7B's plan had it.
   - Recorded: topic 7's change plan (B1) says 7B no longer carries these, and the rest-of-preferences ledger says
     the same after the merge (`vg_10`). B1's other part, the hand-off naming the notes' lines in the order they
     print (settled item 3), stays 7B's; so does L57's date.
   - Tests: two tests that held the old lines follow them; the pin test gains a decision test; AK-B19, B20, G19,
     QC-G06 and the rhythm home, TD-G09 and the rhythm home, and WS-F20 follow the words.

**Held for him, then answered:** the repetition for rhythm (his answer above).

After every repair and his answer: every suite green, the replay makes the branch exactly, 60 of 60 undo checks
caught, no dash added, and the trial merge onto main passes.

## In short

- Every decision and settled item section 6 gives this release is built, with his words as the standard:
  decisions 1, 2, 4, 9 and 10 (turned round), 11 and 12; settled items 1, 5, 6 and 8; the stories. Settled items
  3, 7, 14 and 15 change nothing, as the plan says. And, by the lead after the first check, decision 13 and his
  speaker-notes answer in the lesson designer's own line, which the plan had given to 7B.
- His speaker-notes answer ("as long as the idea needs ... talking to children") is in the guide's §2, with four
  short lines from the week 3 science lesson he pointed to, quoted exactly (the fifth, a phrase repeated for
  rhythm, by his answer of 26 September), and in the designer's notes line and the hand-off. The deck is not
  copied.
- One departure, by the lead's choice: decision 4's list, word for word, pushes the slide designer's focused
  repair over its 8,000-byte budget, so its budget alone is widened to 8,200 (below).
- The change is twelve scripts in `vg-change/`, each old text asserted once, line endings kept. Replayed in
  order on a clean `git archive 91687471` copy (`vg_16_replay.py`), they make this branch's tree exactly.
- Every suite passes, the voice harness included. The 54 saved designs give the same result as before, design by
  design. Each of 60 changes, undone one at a time on a scratch copy, is caught by a test (`vg_13_undo_checks.py`).
- The instruction files are 2.5 KB larger, not smaller; the voice guide 2.1 KB larger where the plan expected 1 to
  2 KB smaller. Said plainly under "Size".

## The scripts, in replay order

All in `plans/streamline-tools/vg-change/`, run with `python -X utf8 <script>`. Each finds the tree from its own
place and prints it before it writes.

| Script | What it does |
|---|---|
| `_patch.py` | one replacement at a time, old text asserted once, line endings kept |
| `vg_00_his_rhythm_answer.py` | his answer of 26 September, recorded in the voice ledger so a replay makes the same ledger |
| `vg_01_stories_first.py` | the build-log entry's heading and its "Stories kept here" block, every story sentence that leaves copied word for word before anything moves |
| `vg_02_guide.py` | the voice guide: decisions 1, 9 and 10, 11; settled items 1 and 8; the stories; his speaker-notes answer |
| `vg_03_reaches.py` | the voice rules outside the guide: decisions 2, 4, 11, 12; settled items 1, 5, 6, 8; his notes voice and decision 13 |
| `vg_04_harness.py` | the voice harness's read-me and sweep runner (the Maintenance note moved in, two stale lines) |
| `vg_05_tests.py` | four tests follow changed words; the new pin test is placed (`new/test_teacher_voice_ledger_is_kept.py`) |
| `vg_05b_repair_budget.py` | the slide designer's repair budget, 8,200, the lead's choice; every other repair role keeps 8,000 |
| `vg_06_repin_other_topics.py` | earlier topics' pins that held a changed sentence follow it, found by their words, so it replays on the merged tree too |
| `vg_07_record_in_ledgers.py` | a closing section in the AK, QC, starters, SC, TD, VOC, worksheets and voice ledgers, and topic 7's plan note (appends only what is missing) |
| `vg_08_log_entry.py` | the log entry above its stories |
| `build_vg_mapping.py` | `plans/2026-09-26-teacher-voice-mapping.md` and `scripts/tests/teacher_voice_ledger_pins.json` (after the log, two of whose sentences it pins) |

Tools, not part of the replay: `vg_11_dash_check.py`, `vg_12_sizes.py`, `vg_13_undo_checks.py`,
`vg_14_merge_trial.py` (a real merge onto main's commit, in a throwaway clone), `vg_15_shared_paragraphs.py`,
`vg_16_replay.py`. For the lead at merge: `vg_09_follow_at_merge.py` (runs `vg_06`, `vg_07`, the mapping builder
and `vg_10_record_after_merge.py`).

## What changed, decision by decision

### Decision 1 (his 1, "yes"): the two parts nobody was sent to

The guide's reading route (VG-A07) gains "a sentence stem or other support §7" among the kinds, and its §4 line
(A06) gains "and §14 once, when the kind of lesson is settled". The plan's words, placed in the route's own list.

### Decision 2 (his 2, "yes"): the chipped tooth

Slide Philosophy's case-context paragraph (PF-P01) gains, after "One sentence, before the case, ... comes off in
one spot.": "Before the case means before the question about it: when the thing is on the board, the sentence
about the thing in view comes first and the general one straight after." His own order in the guide's §6 (F05) is
unchanged; a test holds that `This tooth has lost a piece of enamel.` still comes first. AK-B04 moved.

### Decision 4 (his 3, "yes"): the speech guidance's trigger

The slide designer (K24), its focused repair (K25) and the composition playbook (K26) now carry the guidance's
own list word for word: "a speaking character, a voiced claim, a misconception, a disagreement, a prediction to
judge, an advice-to-a-character move, or anyone who simply says what they think, gives their reason or asks a
question". K24 keeps its pinned opening (`when a unit contains a speaking character`). A test compares each with
the guidance's own opening. SA-J43 and PF-V16 moved. The repair role's budget is under "Where I departed".

### Decisions 9 and 10 (his 4 and 5), turned round: humour wherever

§4's `When humour is optional` (D19) now reads "Ordinary teaching content can include a small light moment if it
fits naturally, in every subject, maths and PSHE included: in the teacher's words, "Humour wherever" and "humour is
allowed in pshe"." Unchanged: calculation steps "often" work best without (D20), the sensitive-issue limits (D21,
D22), "none is the right answer", the turn test, and the melons line (his read-back kept it). No instruction ever
carried "never maths"; the log's 12 September ruling (D25) stays there as history and this release's entry says
it no longer stands (pinned). A test bars "never maths" from every instruction file.

### Decision 11 (his 6): a class the lesson comes back to, named and livelier

The lesson designer's group rule (K29): "Give it a name the first time it appears, and not always a class code like
`Class 4B` (`Oak Class`, `the class at Hilltop School`, `the Hill Road team`), and use that name every time ...";
"plain ordinary" went with his "jazz it up". The guide's §6 (F12) gains one clause beside its examples, which stay.
AK-F01, QC-B06, SA-L21 and PF-I06 moved.

### Decision 12 (his 7, "yes"): discussion notes

The dialogic route's notes paragraph (L46) keeps both its sentences and gains "The discussion itself is not
scripted; the words that open and frame it are."

### Decision 13 and his notes voice (brought from 7B by the lead)

See "Repairs after the first check", item 5. VG-L05, M21 and O58 are mapped with his words; the fourth line
(preferences' own-question test) has no row in this list and is pinned as the added row VG-DEC-13.

### Settled item 1: four kinds most often missed, one route

The guide's route (A10) now says "§6 and §12 are two of the four most often missed" and, after the reason that
stayed, "**Definitions and scripts are the other two**, because ..." with the lesson designer's reason moved word
for word. The route names "a comparison or critique prompt §12", keeping the designer's own condition. The lesson
designer's read line (M05) keeps its §6 pointer with assumed knowledge's reason (AK-G05) and its §4 line, and
otherwise points at the guide's route instead of its shorter copy; its line sending the first script to §16H stays.
VOC-C24 and SC-D42 followed their words into the guide.

### Settled item 5: "normally"

The lesson designer's "never the reverse" (L04) is "not normally the reverse"; Written Voice's "not the other way
round" (L20) is "not normally the other way round". The guide's own line is unchanged. This is the humour
diagnosis's cause 1 part given to this release; the rest of cause 1 is release 6's.

### Settled item 6: keep precise subject vocabulary

The adaptation reference's plain repeat (N14) is cut; the adaptation designer's copy (N12) points at Written
Voice's Below paragraph keeping both halves ("On a separate Below resource, keep essential subject vocabulary and
proper nouns as Written Voice's Below paragraph says: supported, not automatically replaced."). Every other copy
keeps its own condition. VOC-P02 and P03 moved.

### Settled item 8: out of date

- §16H's staging note (J27) names both teacher lines.
- The em dash (J13) leaves "Avoid these unless ..." for its own line: "**Never use em dashes and en dashes** in
  anything a child or parent reads: ...".
- The notes hand-off (L27) names the two full-length scripts in §16H (and, by item 5, gains his words).
- The lesson designer's "That section is the one place ..." (M11) names `preferences.md` → Vocabulary.
- The Maintenance note (A16, A17) left §17 for the harness read-me's "Changing the voice guide"; "Treat this guide
  as the default runtime specification." sits in the guide's Purpose paragraph.
- The harness read-me no longer calls the held-out file empty (Q02); the sweep runner names where the reviewer's
  register paragraph is (Q13).
- Long dashes in examples a child could be given: the activity list's four, the dialogic and task routes' one
  each, the research file's red flag, and preferences' three.
- Both "quick, punchy" orders stay; PF-D41 and PF-F75 stay exactly (risk 15), and a test holds both.

### The stories

A11's three prompts left the route (copied first); A12's reason stays word for word, with one plain sentence
before it saying what "Every one" means. C13 keeps one plain telling as its example ("A Year 4 slide that prints
`What do their reasons share?` ... is the shape"; AK-G09 moved). C05's and D15's dates went, his words stay. L18,
O07, O49 and the two code-comment stories (P04, Q29) are copied into the log; their sentences stay where they are.
L61's tooth slide was copied by the routes release, as it said; `vg_09` checks the log holds it, and on the trial
merge it does.

## What his week 3 notes taught, and where it went

Read with python-pptx from the copy in `scratch/vgb/` ("Explain how a tooth decays", 19 slides). What they show:

- **Length follows the idea, both ways.** Answer slides carry nothing; the slide that sends the class to write says
  what to do and stops (26 words of script); one step of the chain gets a few short sentences (37); most scripts
  run 54 to 117 words; the one that builds the idea out of the children's own mouths is the longest, 149 (184 with
  its teacher information); the two vocabulary words take 115.
- **The notes are one talk across the slides.** Each picks up where the last left off.
- **It talks to the children about themselves:** their own mouths, this morning's brushing.
- **It asks and answers**, so the class thinks along, and puts the wrong picture in words before the right one.
- **Short sentences and fragments sit beside longer ones**, and it repeats for rhythm ("a tiny bit ... a tiny bit
  more ... a tiny bit more").

**Where it went:** the guide's §2 (`As long as the idea needs, said to these children`): his words, the rule they
make, and four lines from the lesson, quoted exactly (checked by the first check, slide by slide); and, after the
check, the lesson designer's notes voice line and the hand-off (item 5 above). §16H still holds the two full-length
scripts. A test bars the deck's other lines from the guide.

**His answer on the repetition** ("yes thats fine") is built: the fifth line and §3's exception (above). And, for
release 6, this is the one saved deck with a light line on a slide's face (slide 4, "Whatever you've had, they get some
too."), with another in its notes ("Now I've got some bad news for you.").

## Where I departed from the plan, and why

1. **The slide designer's repair budget.** Decision 4's list, word for word, takes that compact entry point to
   8,034 bytes against an 8,000-byte cap it has had since the plugin began. Its budget alone is widened to 8,200 in
   `test_make_lesson_runtime.py` (every other repair role keeps 8,000; two undo attacks hold both). The lead chose
   this over a shorter wording or a fold elsewhere: his words kept whole beat a byte guard, and the file stays about
   an eighth of the full slide designer. The log says so, with the reason.
2. **Decision 13 and the notes voice line are built here**, not in 7B, by the lead after the first check (item 5).
3. **L61's tooth slide is not copied to the log here**: the routes release copied it first, and the merged tree
   holds it.
4. **A12 needed an antecedent**; one plain sentence precedes it, its own words unchanged.
5. **F12 and F14: one clause, not two**, as the ledger's decision says.
6. **The plan said the log lacked the diet sheet**; the worksheets release had since copied it. A11's sentences are
   copied anyway.
7. **The routes rows.** The routes release rewords three rows of this list (VG-L16, M49, O41). They are mapped in
   `build_vg_mapping.py`'s `ROUTES` from its committed words (`8af6f8a9`), used only when the merged tree holds
   them.

## Every pin, and why

**New.** `scripts/tests/teacher_voice_ledger_pins.json` (625 KB) with `test_teacher_voice_ledger_is_kept.py`: all 470
rows (430 in place; 33 changed, moved or retired by this release, each with its decision and whole paragraph; 7
changed by earlier releases, mapped to their words: K15 colours, M33 7A, O25 and O26 the reviewer, M42 to M44 held
by their removed files); seven added rows (VG-DEC-02-CASE, NOTES, RHYTHM, DASHES, HARNESS, 13, LOG); the voice guide's 18
sections but §10, paragraph by paragraph; 32 retired wordings barred, 26 of them everywhere. Sixteen decision tests
beside the eight shared checks. On the merged tree the builder maps three more (the routes rows): 43 changed.

**Earlier topics' pins moved in place** (`vg_06`, each outcome naming the decision; each ledger says so, `vg_07`):

| Pins | Rows | Why |
|---|---|---|
| assumed knowledge | AK-B04; AK-B19, B20, G19; AK-B27; AK-F01; AK-G09 | the case clause; decision 13 and the notes voice; a dash; the group's name; C13's plain telling |
| quick checks | QC-A18; QC-B06; QC-G06, HOME-QC-PREF-19, 21 and the rhythm home | a dash; the group's name; decision 13 |
| starters | SA-B18 and the starters home; SA-J43, PF-V16; SA-L21, PF-I06 | a dash; the speech trigger; the group's name |
| success criteria | SC-D42 | the designer's read line points at the guide's route |
| the rhythm | TD-C19; TD-G09, HOME-TD-PREF-19, 21 and the rhythm home; TD-J62 | a dash; decision 13; a dash |
| vocabulary | VOC-C24; VOC-A02, DEC-10, HOME-LD-01 and the designer's home; VOC-P02; VOC-P03 | settled 1; "That section" named; settled 6 twice |
| worksheets | WS-F20 | decision 13, with the named child |

Colours, reviewer and subject-files pins are untouched. On the merged tree `vg_06` also moves the routes release's
own pins that held this release's old words (RT-A43, F16, G07, G08, G09, J11, found on the trial merge).

## The suites

`bash plans/streamline-tools/run-all-suites.sh vg-after`, with the venv's `python3` first on `PATH`:

| Suite | After | Before (4.2.294) |
|---|---|---|
| python | 2,325 passed, 1 skipped | 2,301 passed, 1 skipped |
| voice harness | 21 | 21 |
| builder | 772 | 772 |
| worksheet-html | 771 | 771 |
| stick-in-sheets-html | 73 | 73 |
| working-wall-html | 166 | 166 |
| shared | 126 | 126 |
| test | 46 | 46 |

The 24 new Python tests are the new pin test (eight shared checks, sixteen decision tests). No engine changed.

## The saved designs

The saved-design folders now hold 54 designs (one new since the first run). Both validators, a clean `91687471`
copy's and this branch's, give the same result for every one of them (one passes, the rest are refused the same
way); no program changed.

## Size, before and after

Line endings normalised (`vg_12_sizes.py`), against a clean `91687471`:

| Group | 4.2.294 | After | Change |
|---|---|---|---|
| The voice guide | 58,586 | 60,642 | +2,056 |
| The lesson designer | 141,483 | 141,250 | -233 |
| Preferences | 237,335 | 237,692 | +357 |
| The slide designer, its repair, the playbook | 134,140 | 134,471 | +331 |
| The dialogic and task routes, the activity list, the research file | 141,793 | 141,848 | +55 |
| The adaptation designer and reference | 76,998 | 76,935 | -63 |
| **Instruction files in all** | 790,335 | 792,838 | **+2,503** |
| The voice harness (read by no lesson) | 9,180 | 9,838 | +658 |
| Tests and pins (14 files) | 3,469,569 | 4,128,227 | +658,658 (the new pin file 624,670) |
| The build log | 783,880 | 801,083 | +17,203 |

The voice guide grew where the plan expected it to shrink: the stories and the Maintenance note took out about 1
KB; his speaker-notes answer with its five lines and the rhythm exception, his humour words, the class clause, the two routed sections, the
definitions-and-scripts reason and the full staging note put about 3 KB back. Most of it is in §2, which every
script's writer reads; §17, which the reviewer is shown every review, is 0.6 KB smaller. Preferences grew by his
hand-off words and the case clause; the lesson designer shrank by its shorter route copy, less the longer notes line.

## The files touched, and every paragraph the routes release also touches

**Plugin, changed:** `references/teacher-voice.md`, `agents/lesson-designer.md`, `references/preferences.md`,
`agents/slide-designer.md`, `agents/slide-designer-focused-repair.md`, `references/slide-composition-playbook.md`,
`references/teaching-sequence-dialogic.md`, `references/teaching-sequence-task-centred.md`,
`references/do-beats.md`, `references/evidence-synthesis.md`, `agents/adaptation-designer.md`,
`references/adaptive-adaptation.md`, `evals/teacher-voice/README.md`, `evals/teacher-voice/sweep-runner.md`,
`references/build-review-log.md`, `scripts/tests/test_voice_reaches_every_string.py`,
`scripts/tests/test_invented_people_and_the_spoken_question.py`, `scripts/tests/test_make_lesson_runtime.py`,
`scripts/tests/test_do_beats_look_like_the_subject.py`,
`scripts/tests/test_the_class_builds_the_set_and_one_case_is_not_the_group.py`, and the pin files
`assumed_knowledge`, `quick_checks`, `starters_sticky_apply`, `success_criteria`, `teach_then_do`, `vocabulary`,
`worksheets`. **Plugin, new:** `scripts/tests/teacher_voice_ledger_pins.json`,
`scripts/tests/test_teacher_voice_ledger_is_kept.py`. **Plans, changed:** closing sections in the AK, QC, starters,
SC, TD, VOC, worksheets and voice ledgers; a note in topic 7's change plan (B1). **Plans, new:**
`plans/2026-09-26-teacher-voice-mapping.md`, `vg-change/`, this report, `vg-before-summary.txt`,
`vg-after-summary.txt` (and, ignored by git, the logs, the designs files and `scratch/vg/`).

**Trial merge** (`vg_14_merge_trial.py`): this branch committed on `91687471` in a throwaway clone and merged into
main's `8af6f8a9` (the routes release, 4.2.295). Every instruction file merges cleanly. Conflicts: six ledgers (the
QC, TD, starters, SC, voice and worksheets ledgers; both releases append closing sections), the build log (both
append; main's side, then this entry, numbered 4.2.296) and the rhythm's pin file (both move pins). Taking main's
side and running `vg_09_follow_at_merge.py` puts this release's words back, records its notes, maps the three routes
rows, records the two later ledgers and puts back his 26 September entry, which main's side of the voice ledger
drops; the whole Python suite then passes (2,382 and 1 skipped) and the voice harness 21. The node suites were not run there (the clone has no libraries; no engine changed).

**Paragraphs both releases touch** (`vg_15_shared_paragraphs.py`, against `8af6f8a9`):

- `references/teaching-sequence-dialogic.md`, the Talk paragraph and its list of formats: the routes release
  replaces the Four corners bullet; this release takes the dash out of the role-play bullet two lines below. They
  merge.
- The same file's `## Teaching Sequence Specification`: the routes release edits the Stimulus-activity paragraph and
  adds lines lower down; this release adds its sentence to the discussion-notes paragraph.
- `references/teaching-sequence-task-centred.md`, `## Teaching Sequence Specification`: different paragraphs (the
  routes release's plan-beat, launch and `teach-needed`; this release's dash in `Do the task`).
- `references/preferences.md`, `### Lesson Designer content boundaries`: different paragraphs (the routes release's
  "The fact is the destination" and launch; this release's case clause and structure example).
- `references/evidence-synthesis.md`, the Dialogic subsection: the routes release moves the dialogic sources line in;
  this release takes the dash out of its red-flags paragraph.
- `references/teacher-voice.md`: the routes release adds one sentence under §5's heading; this release changes none
  of §5, and its §5 home is rebuilt on the merged tree by `vg_09`.
- `agents/lesson-designer.md`, `references/do-beats.md` and `scripts/tests/test_do_beats_look_like_the_subject.py`:
  both change them, in different places.

## What is left for release 6

Humour on the board, waiting for his answer on the diagnosis: the guide's §2 and §17 naming the light line as the
conversational line that often belongs on the board; the look moved to where each board is written; where a light
line rides on each kind of board and Pride Lessons' sorting; CONTENT's misleading-word example; the reviewer's
board question; the maths instance and the scope of "keep it straight". This release did only what the diagnosis
gives it: his "humour wherever" recorded, maths and PSHE included, and the two "never the reverse" copies brought to
"normally".

## Anything he should know, in plain words

- **Untried on a real run.**
- **Humour is welcome in every subject now, maths and PSHE included**, in his words. Why a funny line never reaches
  the slides is the next job.
- **Speaker notes:** the guide and the agent that writes every script now both say a script is as long as its idea
  needs, talking to these children, in his words ("it doesn't have to be short sentences"). The guide shows five
  short lines from his week 3 science lesson as the model.
- **"A nine-year-old" is gone** from the four places that fixed the reader's age: each now says a child in this
  class, because the plugin serves Years 1 to 6.
- **A class the lesson comes back to gets a livelier name**, like "Oak Class", rather than always "Class 4B".
- **Anyone who speaks on a slide gets the speech-bubble treatment**, not only someone making a claim.
- **One small limit was raised a little** so his wording could go in whole: the slide designer's quick-repair
  instructions. No other limit changed.
- **Repeating a phrase for rhythm is fine in speaker notes**, as he said ("yes thats fine"): the guide now says
  so, with his own line as the example, and keeps its warning for what is written on the board and the page.
- **Not updated by me:** `plans/streamline-plan.md` (outside my files). Nothing committed.
