# Release 7A (4.2.293): second independent check

Checked on 26 September 2026 against the uncommitted working tree on top of `b1c2d427`
(4.2.292), after the builder's repair rounds 1, 2 and 3, with `7a-release-brief.md`,
`7a-release-report.md`, `7a-release-check.md`, the scripts in `7a-change/`, the change
plan's 7A section and his words in both topic 7 ledgers (his newest: "answer to your wall
question, I guess, but I rarely also use cards with no picture or helper, so?"). Nothing in
the plugin was changed. Scratch work is in `scratch/7achk2/`: `replay.py`, `mutate.py`
(`mutate.log`, `mutate-round1.log`), `wall-html.js` (saved walls on both versions),
`wall-gen.js` and `wall-probe.js` (a sweep of cards, and a check of the printed page), the
grid decks in `grid/`, the small walls in `wall/`.

## In short

**Must be repaired (both small):**

1. **The untitled grid's own fix is refused by the same check.** The slide check now sends an
   untitled number grid back and says to title it "usually Your Turn". Titled "Your Turn",
   the same check refuses it again ("promises the class a turn, but this slide carries no
   question"), because it does not count a grid's sums as the class's turn. So in maths every
   plain title for a practice grid fails (none, "Your Turn", "Practise"), and only a title
   against his maths ruling ("Adding") gets through. A grid used as the opening slide, under
   the starter header, which never prints a title, passed on 4.2.292 and is now refused; the
   only way through is a title nobody will see. Repair: the check counts a grid's sums as its
   turn and leaves a grid under the starter header alone, with a test for each. No saved deck
   uses the grid, so nothing he has changes.
2. **Nothing stops the designer's own check being made lenient.** Adding `--settled` to the
   slide designer's check (its own page, or the playbook's Track A check) passes every test
   in every suite. That flag would let every wording, title and colour fault through the one
   gate that sends them back. A test that those two commands never carry it closes this.

**For him to decide:**

3. **A long sticky fact now costs its wall card the photo.** In his saved lessons, 48 of 142
   sticky facts (a third) are 73 to 106 letters. Beside a photo the build now fits 72 (up from
   62, the photo shrinking a little first, as he asked). One sentence cannot go over two cards,
   so for those facts the next move is the photo off, and the sentence stays whole. On 4.2.292
   the designer shortened the sentence first and kept the photo. His "a sentence never cut"
   and "I rarely use cards with no picture" meet here, and the read-back ("a card with none
   stays as rare as on his own walls") will not hold for photo cards. For one sentence of 73
   to 106 letters, which wins: the photo, with the sentence shortened to a whole sentence, or
   every word, with no photo?
4. **"Never cut" is built as "never clipped"**: a whole-sentence rewrite is still the very
   last move, after the photo is off. The builder flagged this; still his to confirm.
5. **Two of the first check's questions were settled without him:** old designs are still
   refused (so 4.2.293 goes in only between lessons), and the tall-picture starter's examples
   are now his own teeth starter ("Which teeth cut food?"). Tell him both when he is asked
   to release.

**Found in passing, not caused by 7A, but his "never clipped" is at stake:** the wall
measures letters narrower than they print, so a card can print text past its panel's edge.
One saved wall (the Christmas one) already does, on both versions. The new room carries the
fault to some newly allowed cards: a 72-letter sticky fact beside a photo prints its last line
under the panel's border (`scratch/7achk2/sk72-1.png`). The wall build never looks at the printed page for
this; the worksheets do. For the run-faults release or the wall's own list.

**Sound, and checked:** the first check's five repairs are all done and each failing case now
behaves; every suite passes (python 2,276 and 1 skipped, voice 21, builder 770, worksheet 771,
stick-in 73, wall 155, shared 126, test 46); the 24 scripts replayed on a clean `b1c2d427` copy
give the working tree's content exactly, and the same mapping and ledger notes; an untitled
grid builds with no title line with and without `--deliver-flagged`; `--settled` lets nothing
through that ever stopped a deck; all 45 saved walls that build draw exactly as on 4.2.292;
29 undo attacks, 25 caught (the misses are item 2's two and two low ones below); nothing he
retired is back; no em or en dash added.

---

## 1. The first check's findings, one by one

| Finding | Now | Tried |
|---|---|---|
| Repair 1, the wall's "poster" reason | Done. Principle 4 again ends «Three lines turns the item into a paragraph and the wall stops being a wall and becomes a poster.», it is pinned present (not barred), and the clash with the wall's visual language is carried to topic 9 in `streamline-plan.md` | Removing it fails the pin test |
| Repair 2, the log's "nothing re-checks an old design" | Done. Old: «A lesson designed before this release carries the retired keys and fails the new check if it is ever re-validated; nothing does that today.» New: «... a lesson already running when 4.2.293 is installed, or stopped and picked up again after it, is refused at the adaptation picture step (the run then drops its Below and Greater Depth sheets) and at any later review ... So 4.2.293 is installed only between lessons, never while one is running.» | Read |
| Repair 3a, the tall starter never prints `title` | Done: `builder/test/starter-question-tall-title.test.js` | Making the template read `data.title` fails 2 tests |
| Repair 3b, the scaffold guide's example | Done: `test_the_guide_example_request_is_one_the_scaffold_accepts` | Putting `"scope": "Complete lesson"` back fails it |
| Repair 4, six pins' reasons | Done: QC-C08, E11, P01, SC-Q01, TD-L07, L09 now end «the test-question line of the reviewer's section 3 carries both exceptions (the split lines PF decision 20 changed are in section 1)» | Read |
| Repair 5, an untitled grid could cost the deck | Done. Old `grid-calc.js` «title: data.title \|\| 'Independent Tasks',»; round 1 refused it in the build; now «title: data.title,», the refusal sits in the slide check (`GRID_WITHOUT_TITLE`), and `validate.js` is back to 4.2.292 exactly | `build.js` on an untitled grid, with and without `--deliver-flagged`: exit 0, deck written, no title line (rendered, `grid/render/gf-1.png`). But see item 1 above |
| Question: refuse or ignore old keys | Kept refusing, as the first check suggested; not recorded as put to him | Item 5 |
| Question: the wall's picture-first order | Put to him and answered; built in round 3 | Section 3 |
| Question: the tall starter's examples | Changed by the lead: old «(for example, "Answer the question.")» and «"||350 millilitres"», new «(for example, "Which teeth cut food?")» and «"||Incisors cut food."»; no answer of his recorded | Item 5 |
| Low: reviewer's "honest" | Fixed: «a lesson that left learning for another lesson says so, honestly and visibly, in the walk-through;» | Removing "honestly and visibly" fails the pin test |
| Low: playbook's "lesson scope" | Fixed: the report list no longer names it | Putting it back fails the pin test |
| Low: wall remedy names a picture for a card with none | Fixed: «any picture beside it» | Read |
| Low: content route's "headline still carries it"; rule 8's short sticky sentence | Left, with reasons in the report; both fine | |

## 2. The untitled grid, end to end (item 1)

Scratch decks in `grid/` (maths), run through the real slide check and the real build:

| Deck | 4.2.292 check | 4.2.293 check | 4.2.293 build |
|---|---|---|---|
| Untitled grid | passes | `GRID_WITHOUT_TITLE` | exit 0 with and without `--deliver-flagged`; no title line, nothing where it was |
| Grid titled "Your Turn" | `TURN_SLIDE_WITHOUT_ITS_TURN` | `TURN_SLIDE_WITHOUT_ITS_TURN` | builds |
| Grid under the starter header, untitled | passes | `GRID_WITHOUT_TITLE` | builds; the title slot is never drawn there |
| Grid under the starter header titled "Your Turn" | | `TURN_SLIDE_WITHOUT_ITS_TURN` | |
| Grid under the starter header titled "Adding" | | passes | builds; "Adding" is nowhere on the slide (`grid/sgout/sg-1.png`) |

- The new message: «a grid-calc slide has no "title", and the builder no longer prints
  "Independent Tasks" for one. Give it the design's label as its title: in maths the plain
  words, usually "Your Turn".» The catalogue says the same: «`title` (the design's label: in
  maths the plain words, usually `Your Turn`; an untitled grid prints no title line, and the
  slide check sends it back to be titled)».
- The turn check (`carriesItsTurn`) reads `questions`, question types, task wording, blue and
  answer marks; a grid's `calculations` are none of these, so «"Your Turn" promises the class a
  turn, but this slide carries no question, no task and no answer - only reference material.»
- The starter header: `templates.md` says «If the slide is the starter (slide 1) ... use
  `headerStyle: "starter"` on whatever body template fits», `drawGridCalc` passes the header
  style through, and the starter header never draws a `title` (his ruling: «a `title` never
  prints there»).
- Under `--settled` all of these are notes, so they never cost the drawings.
- Found in passing, older than 7A: under the starter header the grid draws "Starter" but not
  the slide's `heading`, because `drawGridCalc` passes the header only the title, instruction
  and signal.

## 3. `--settled` (item 2)

- **What it lets through.** On `--settled` the slide check turns every presentation warning
  except a picture drawn twice into a note: stage titles, the untitled grid, turns, blue and
  purple faults, launch pairs, Teach layouts, repeated lines. Capacity faults, a picture drawn
  twice and everything the scratch build refuses (drawings included, which the build checks)
  still fail. Tried: a bare "Practise" deck passes settled (exit 0, «note: slide 1 title:
  INTERNAL_STAGE_TITLE») and fails plain.
- **Can it let through anything that should stop?** No. The decorator's check never stopped a
  deck: «A decorator that fails, stalls or never returns degrades, never blocks», and the deck
  is built as the designer left it. The flag decides only whether the drawings ship. Two notes:
  no presentation warning reads `decorations`, so "a fault the decorator's own drawings cause
  still fails" holds through the build and the optional-picture check, not through the picture
  rule; and a decorator that rewrote words against its page would now pass the slide check,
  leaving it to the optional-picture check's composition fingerprint, which runs only when the
  deck was measured (`slide-room.json`).
- **Callers.** The decorator's page («--preview --settled \») and the playbook's decorator check
  («"[WORKING_DIR]/lesson.json" --settled») pass it; the designer's page and the playbook's
  Track A check do not, which is right. The playbook's next line, «run the slide-design check
  yourself», names no flag; worth "with `--settled`" (low). The flagged-deck route still fails
  (`--deliver-flagged` prints the usage line, exit 1), as the report says, for 10B.
- **The gap (repair 2).** Adding `--settled` to either designer command passed the full Python
  suite (2,276) and the pin tests; the builder tests do not read those files.

## 4. The wall fitter (items 3 and 4, and the overflow)

- **What was built.** `panelFractionThatFits`: a card whose words fit beside its picture at 60%
  keeps 60%; otherwise 65%, then 70%; otherwise 60% and the refusal. Wired into the sticky,
  definition, worked-example and sentence-stem cards. The probe it uses matches the real fit
  (same items, floor, title area), so a card that built before cannot change.
- **Saved walls.** All 52 saved `working-wall.json` files built on a 4.2.292 copy and a 4.2.293
  copy (like for like, Chrome held back so the pages could be compared as HTML): 48 build on
  both, 3 of them have no cards, and the other 45 are byte-identical. (Beware: the live checkout
  draws the step badges' numbers a little higher than any scratch copy does, on either version,
  so compare copy with copy.) Four fail on both: three the same way, and the balanced-diet wall,
  refused on 4.2.292 for a 65-letter sticky fact and an 82-letter worked step, now fits the fact
  and is still refused for the step.
- **Small walls** (`wall/`): sticky facts of 61, 68 and 71 letters beside a photo build at
  60%, 65% and 70%; 87 letters is refused. Rendered pages are `wall/pg-*.png` and
  `wall/hi-*.png`.
- **His answer as built.** His question: «the picture a little smaller first, then a bigger or
  second card, the picture off only when nothing else fits, and a sentence never cut». Built:
  the build shrinks the picture; the designer then carries a list over a second card, then takes
  the picture off, then as a last resort shortens to a whole sentence (rule 8: «Making room is
  the *first* move when an item overruns, not the last: the build shrinks the picture a little,
  then a list goes over a second card, and the picture comes off only when nothing else fits
  (his walls rarely have a card without one).»). "A bigger card" does not exist (every card is
  an A3 sheet). Old rule 8 said the reverse: «Reach for the shorter wording before you drop the
  picture». Item 3's numbers come from every sticky fact in the saved lesson designs (142
  distinct): 57 fit at 62, 25 more at 72, 48 need 73 to 106, 12 are longer than 106. Beside a
  drawing rather than a photo the build already allows about 124 letters, so item 3 is about
  photos (and emoji).
- **Text past the panel (found in passing).** `wall-probe.js` loads each page in the Chrome the
  builds print with and measures every line against its panel. Saved walls: one (the Christmas
  wall) prints text 50 pixels outside a panel, identically on both versions. A sweep of 78
  generated cards (one to three items, 50 to 74 letters, sticky and worked-example, beside a
  photo): 42 build on 4.2.292 and 5 of those print outside the panel; 72 build on 4.2.293 and 9
  do, the new four being cards the new room allowed (a 72-letter sticky fact; worked steps of
  64 to 72 letters). The cause is older than 7A: the fitter counts a letter as 0.55 of the type
  size and this bold font prints wider, so large type wraps to more lines than it planned.

## 5. Nothing lost, nothing retired rebuilt

- Searched every plugin file outside the log, the parked folder and tests: no
  `testQuestionPath`, "will return to it", "scanned question", `lesson2Direction`,
  `deferredLearning`, "Lesson 1 of 2", "know how a Roman lived", "production opens next",
  "quality-lock sentence", "for historical reasons" or "Independent Tasks" default (one test
  lesson titles a grid "Independent Tasks" itself). "Lesson scope" survives only as plain
  English in the reviewer («curriculum accuracy or lesson scope»).
- No fixed place for a sticky fact: every copy says "usually" («A Teach slide lands its
  sentence once, usually at the top.»; «**The landed sentence usually leads the board.**»), and
  the designer says «write it once, as the headline or as the star line, never both».
- Rounds 2 and 3 did not undo round 1: the poster sentence, both new tests, the six reasons and
  the playbook line all stand, and all pass their attacks.

## 6. Pins and replay

- **Pin file.** `starters_sticky_apply_ledger_pins.json`: 496 rows (390 SA rows, 45 PF rows, 10
  added mechanisms including `SA-ADD-03-GRID`, `SA-ADD-09-WALL-ORDER`, `SA-ADD-10-SETTLED-CHECK`,
  50 home paragraphs, and `SA-RETIRED`), as the report says. The test passes in the live tree
  (18 tests); on a scratch copy the ledger comparison skips, because the ledgers are not beside
  it.
- **Earlier topics.** Compared with 4.2.292: 37 pins in 28 rows moved (assumed knowledge 1,
  quick checks 5, success criteria 11, the rhythm 6, vocabulary 3, worksheets 1, colours 1); no
  row added or dropped, no barred phrase changed, no other field touched.
- **Replay.** `replay.py`: `git archive b1c2d427`, the 24 scripts in the report's order with the
  root on the copy (each printed the scratch root), then every file compared: 971 files, content
  identical, none on one side only, mapping identical byte for byte. 52 files differ in line
  endings only (git archive writes LF where the checkout has CRLF). `a16` replayed on the two
  ledgers as at HEAD gives the working tree's ledgers, except the lead's own entry recording his
  wall answer.
- **Undo attacks** (`mutate.py`, on a full copy that passed first; restored byte for byte):

| Attack | Result |
|---|---|
| Grid warning removed; default title back; grid slot text says a default | caught |
| `--settled` does nothing; passes everything; ignored on the command line; notes silent | caught (builder) |
| `--settled` taken off the decorator's command, or the playbook's decorator check | caught (pins) |
| `--settled` added to the playbook's Track A check, or the designer's own command | **missed** (full Python suite passes): repair 2 |
| No giving way; order reversed; a third step to 80%; widens a card that fits | caught (wall) |
| Giving way taken off the sticky card; the worked example | caught (wall; pin) |
| Giving way taken off the definition card; the sentence-stem card | **missed** (low: beside a drawing they already hold about 124 letters) |
| Wall message puts the picture first; rule 8, principle 5 or the focused repair reordered; the 72 line gone; the poster sentence gone | caught |
| Round 1: tall starter reads the title; `scope` back in the guide; "honestly and visibly" gone; "lesson scope" back | caught |

## 7. The suites and dashes

`run-all-suites.sh 7achk2` with the venv first on PATH: python 2,276 passed, 1 skipped; voice
21; builder 770; worksheet-html 771; stick-in 73; working-wall-html 155; shared 126; test 46.
All green, the report's counts. No added line carries a new em or en dash: the 19 added lines
with one keep dashes from words not rewritten (contents and bullet labels, the budget table,
untouched sentences), and the rewritten How Much Fits sentence lost its dash. The new tests, the
builder's report and the ledger notes have none.

## 8. Low notes (the lead's call)

- The wall's refusal still says «62 is the most that fits in 2 lines at 36pt» although the
  build has already tried 72 beside a shrunk picture; the preferences table says «about 72
  characters once the build has shrunk the picture a little». A designer shortening would aim
  ten letters lower than it needs to.
- Principle 4's new reason, «because the card draws each item in two lines at most», is not
  what the engine does: at larger type an item wraps up to five lines (`MAX_LINES_PER_ITEM = 5`);
  two lines is the budget at the smallest size (four beside a drawing).
- The playbook's «run the slide-design check yourself» after the decorator could say "with
  `--settled`".
