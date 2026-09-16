# Repairs after the review of the pushed branch

16 September 2026. Continues branch `lesson-designer-cumulative-2026-09-16` from `88f53347`, the head that was pushed and reviewed. The review is `REVIEW.md` and `FOR_CLAUDE.md` in `Lesson_V4_Actual_Review_and_Repairs_2026-09-16.zip`. Nothing was merged, released or installed, the version is unchanged, and no model setting or agent was added or changed.

**Newer work checked first.** The remote branch had no commits after `88f53347`. ChatGPT's branch `repair-validation-2026-09-16` holds one commit, a GitHub workflow that ran the three test suites at `88f53347` (builder check passed, 643 tests; stick-in passed, 57 tests; Python stopped at collection because the runner lacked `python-docx`). It contains no repairs. Its log is `tests/chatgpt-repair-validation-ci-run.log`.

## 1. What was repaired

### Printed cards lost information (review F1)

**Before.** The kit check compared card labels only. A card whose account sat in its `detail`, a card with a picture, and a kit whose instruction had been swapped for one that gave the answer away all passed as faithful. Reproduced on this checkout with the reviewer's harness: 3 of 6 controls failed (`evidence/kit-gate/reviewer-harness-before-repair.txt`).

**After.**
- The check compares each card's label and detail, the instruction, and the tag every card is stamped with.
- A printed kit prints words only, so a sort whose cards carry pictures is refused by name, both when the lesson design is validated and at the kit check, rather than printed without them.
- The builder prints each card's detail under its label, and refuses a card with a picture or a kit with no tag.
- The card-set spec in the stick-in pedagogy, the stick-in designer and the output template now say the detail is copied and printed.
- Reviewer's harness: 0 failures (`evidence/kit-gate/reviewer-harness-after-repair.txt`).

### Cards ran off the page (review F2)

**Before.** A set taller than the page was still put on one page, and the page hid what overflowed. The reviewer's 12-card set needed 224 mm in 185 mm, and two cards were cut off.

**After.**
- A set that fits shares pages with other sets, as before.
- A set taller than one page continues onto the next page at a row boundary. The caption says `Set 1, page 1 of 2: keep these pages together`, and every card still carries its tag.
- One card too tall for any page is refused with the heights named. Nothing is shrunk below the readable size, cut or dropped silently, and a refused kit is named as missing from the pack.
- Measured in Chrome (`evidence/kit-pages/browser-*.json` and screenshots): in the reviewer's tall set (now 2 pages), the largest kit the contract allows with long labels, details and six long headings (4 pages), and the ordinary fixture (5 pages), nothing sits past the page edge and no card's words spill out of their card.

### The lesson order forced a token extra beat (review section 2)

**Before.** The guidance said a Do that grows substantial becomes the main Practise in the same place, but the order check required a separate Do after every Teach, so `Teach, Practise` was refused.

**Decision.** A Teach may now be followed by the Practise that uses it. The preparation is kept on purpose: at least one short Teach then Do pair comes before the first Practise, so the main work is never the first time children use what the lesson taught. A lesson with no Practise, a Practise before that first pair, or a beat outside a pair is still refused. The scaffold and the validator agree on every shape tested, and the content route and reviewer route check each gained one sentence saying so.

### Misleading teaching examples (review F4, F5)

- **Maths.** An ordered run such as 349, 351, 449, 451 is now described as good teaching, weaker only when the lesson relies on it as evidence of each child's own decision. The weak example is now the pre-circled hundred, which does make the decision.
- **English.** The forest sentence may still give the place some feeling; the fault is that the task never asked for a choice, so the answer cannot show one.
- **RE.** `yes, because of Jesus` is now too short to tell either way, not proof of no understanding.
- **Science.** A second cell is named as a second relationship, fair only once taught. The changed condition that stays inside the taught relationship is a longer wire.
- **Operations.** The operations are now named in one line at the point the main task is chosen, in the rhythm section the designer already reads, rather than only when the designer notices a task looks thin. What a task is (its operation) is kept separate from how hard it is. The full table stays optional. Three of its conditions now allow what the review said they wrongly ruled out: a picture feature that is the evidence, a reasoned uncertain prediction, and one visible repair as supported practice.

### Answers supplied before independent work (review F3)

The existing owner, `Giving a task its instructions is not launching it`, now says the good instance in a launch sits on a case the task does not then ask about, using the Viking lesson as the example, or the same case is honestly labelled supported rehearsal. Models are not banned. The content route's Practise paragraph points at it, and the reviewer now reads the launch beside the task that follows it. Two behaviour cases were added: the Viking launch (a finding) and the same launch with its model on a third ship (approved).

### The evaluation (review F6 to F9)

- **Corrected case pack, as new files.** `evaluations/lesson-designer-cumulative-2026-09-16/cases-corrected.md` and `blind-cases-corrected.md` use neutral case names and fix C02, C07, C09, C13 and C14. Three history cases are replaced by the maths, science and geography contrasts already in the plugin. The originals and their 16 of 16 result are kept and relabelled as a developmental check.
- **Neutral re-review.** One fresh assignment that read only the blind pack matched 15 of 16 verdicts (K08 differed: BOUNDED CORRECTION where the key says REVISE; see `cases-corrected.md`).
- **Report corrections.** Section 10 of the follow-on report corrects: the builder does have `npm run check`; the evaporation results do not isolate temperature; the science excerpt left out its own correction; its table headings were reworded by hand; and 16 of 16 was not blind.

## 2. The connected example

`example/` is one short lesson built through the real checks, from existing material:

- **Source.** The saved real run `Why did Tudor children work?` (`example/source/`, copied unchanged), its sourced reconstruction pictures, and the teacher-approved apprentice boards in `plugins/lesson-v4/references/examples/tudor-teach-slides.lesson.json`.
- **Order.** Starter; the farm Teach then Do pair unchanged; the apprentice Teach using the approved board words; then the baker beat that followed it becomes the main Practise in the same place, straight after its Teach (the newly allowed order). The saved lesson's later beats are left out.
- **The task.** Pairs sort five printed cards for Tom, a baker's apprentice, under `Helped him straight away` and `Helped him when he grew up`, then each child writes why they placed the hardest card. Each card has a short detail line. The launch's strong reason is about a pair of shoes, not one of Tom's cards.
- **Checks run, in order.**
  - `validate-lesson-design.py`: `LESSON_DESIGN_OK`.
  - `resource-opportunities.py stick-in`: `STICK_IN_LAUNCH`.
  - `stick-in-kits`: `STICK_IN_KITS_OK: 1 card kit required, all present and faithful`.
  - The stick-in build: 15 sets, 8 pages, and the teacher's answers file.
  - The slide builder: 5 slides, `No warnings`, after it refused one crowded first layout.
  - PowerPoint rendering: `example/output/pages/`.
  - Chrome measurement of the kit: every card inside its page.
  - `check_agreement.py`: **56 of 56 checks agree** (`example/output/agreement-check.txt`). It compares design, slides, kit spec, printed pages and the teacher file string for string: route, approved boards unchanged, every Teach line on the board, instruction, preparation, headings, every card label and detail printed once per set, tags, key, check slide columns, acceptance condition, no key on pupil pages, the launch model on a different case, and no dashes.
- **How it was made.** `make_design.py`, `make_kit.py` and `make_slides.py` rebuild it. The slides were laid out by script from the design's strings, not by a Slide Designer run. The only presentation change is splitting the launch's weak and strong reasons onto separate lines at a sentence boundary.

## 3. Tests

Commands, from `plugins/lesson-v4` (Python 3.13, Node 24, Windows):

```
python -m pytest scripts/tests scripts/test-validate-lesson-design.py scripts/test_question_crop.py -q -p no:cacheprovider -rfE
cd builder && npm run check
cd stick-in-sheets-html && node --test
```

| Suite | Before repairs (`88f53347`) | After repairs |
|---|---|---|
| Python | 11 failed, 1895 passed, 1 skipped, 1972 subtests | 11 failed, 1899 passed, 1 skipped, 1979 subtests |
| Builder `npm run check` | 643 of 643 passed | 643 of 643 passed |
| Stick-in `node --test` | 57 of 57 passed | 63 of 63 passed |

**Existing failures, separated.** The 11 Python failures are the same 11 identities before and after (`tests/python-failures-before.txt`, `tests/python-failures-after.txt`, identical): Windows line-ending and model-route string checks recorded since Phase 1. Nothing these repairs changed broke a test. The new tests are:
- in `test_a_card_kit_reaches_the_table.py`: detail, instruction, tag and picture compared; a pictured card sort refused;
- in `test_the_main_work_sits_where_the_lesson_earns_it.py`: a Teach leading straight into its Practise;
- in `test_the_lesson_builds_on_what_children_can_use.py`: the operations named at the task choice;
- six in `card-kit.test.js`: detail printed, picture and missing tag refused, a tall set split across pages, the largest kit, a too-tall card refused, a refused kit dropped by name.

One scaffold test now expects the new refusal wording.

## 4. What remains unverified

- **Lesson generation.** No lesson designer or reviewer was run on a fresh brief after these changes. Whether the designer now picks the operation more carefully, keeps launch models off the task's own case, or chooses the Teach then Practise order when it should, is untested. The example shows that the checks and builders carry such a lesson faithfully, not that the designer will write one.
- **Teacher reading and classroom use.** None. The example has not been read by the teacher or used with a class.
- **Printing.** The kit was measured in Chrome, not printed. The PDF step was skipped on this computer (`puppeteer-core` is not installed), so the HTML fallback was measured; the school printer was not tried.
- **Pictures on cards.** Still not supported; a kit that needs them is refused, and the sort stays on the board.
- **The corrected case pack.** Its one re-review is the same model family that wrote the cases, and the pack is still weighted to history.
- **The science excerpt** was not rebuilt; its limits are recorded in the follow-on report instead.
- **Reading cost.** About 5 KB of guidance was added across the files the designer and reviewer read (largest: 1.2 KB in `preferences.md`, 1.0 KB in `do-beats.md`).
