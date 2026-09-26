# Release 7A (4.2.293): first independent check

Checked on 26 September 2026 against the uncommitted working tree on top of `b1c2d427`
(4.2.292), with `7a-release-brief.md`, `7a-release-report.md`, the scripts in
`7a-change/`, the change plan's 7A section (A1 to A14, "Before any release", "Where his
answers meet the other lists", "Risks") and his words in both topic 7 ledgers. Nothing in
the plugin was changed. Scratch work is in `scratch/7achk1/` (`replay.py`, `mutate.py`,
`mutate2.py`, `pindiff.py` and their logs).

## In short

**Must be repaired (all small):**

1. **A reason he never retired was removed and barred.** The wall preferences lost "the
   wall stops being a wall and becomes a poster", and the new pin file bars it everywhere
   as if a decision of his retired it. None did: the list only noted that it clashes with
   the wall's own look. By the streamline's rules that clash is a question for him, not a
   fix. Put the words back, take them off the barred list, and ask him with the wall's
   own list (topic 9).
2. **The build log says nothing re-checks an old design during a run. That is not quite
   true.** A lesson already running when 4.2.293 is installed (or stopped and picked up
   again after it) re-checks its own design at the adaptation picture step and at any later
   review, and is refused. At the adaptation step the playbook then drops the Below and
   Greater Depth sheets for that run ("adaptation omitted"). Correct the two sentences, and
   tell him: do not install 4.2.293 while a lesson is mid-run.
3. **Two new promises have no test.** Undoing either passed every suite: (a) the catalogue
   now says the tall-picture starter never prints a slide's `title`; (b) the scaffold guide's
   example request no longer carries `scope`, which the scaffold now refuses, so putting it
   back would make every run's first scaffold call fail.
4. **Six moved pins give a wrong reason.** QC-C08, QC-E11, QC-P01, SC-Q01, TD-L07 and
   TD-L09 hold the reviewer's section 3 paragraph, which only the test-question line (A8)
   changed; their recorded reason also names "PF decision 20 (the two split lines ...)",
   which sit in section 1. The words they hold are right.
5. **An untitled number grid can now cost the whole deck.** The slide designer and its one
   repair will almost always add the missing title, because the message names it. But if
   both miss, the final build refuses the entire deck, even in the mode that delivers
   flagged slides, and the playbook then ships no deck. That breaks his "a last resort still
   leaves a finished piece" for a cosmetic fault he only asked to stop printing. Move the
   refusal into the slide check, where the designer still meets it, and let the final build
   draw the grid without a title line. A bare "Practise" title cannot stop a deck (section 7).

**For him to decide:**

- **Refuse or quietly ignore the retired boxes?** I would keep refusing: it is the plain
  reading of "as if it never existed", and ignoring would keep the old names in the program
  for ever and let a designer's Lesson 2 plan vanish without anyone noticing. The only cost
  is item 2, which "don't install mid-run" avoids.
- **The wall now takes a card's picture off before it trims a sentence.** His "a bigger or
  second card rather than a clipped one" was read as "the card with no picture". A card
  three characters over now loses its picture first. Is that what he meant?
- **The tall-picture starter still reads like the old scanned-question slide.** Its picture
  slot is called `question`, its example prompt is "Answer the question." and its example
  answer is "350 millilitres". The plan kept these. Does "like it didnt even exist" reach
  them? (The two examples can change with no code; the slot's name is code.)

**Sound, and checked:** every suite passes with the report's counts; the scripts replayed
on a clean `b1c2d427` copy give the working tree's content exactly and the same mapping;
40 undo attacks were made and 37 caught (the three misses are items 3a, 3b and one harmless
control); the 32 earlier-topic pins moved, none dropped or turned into "retired"; the
saved designs behave as reported; no em or en dash was added.

---

## 1. Nothing lost

Every rule the change moved was found in its new home, and every removal traced to a
decision of his, except the one below. Old and new are quoted for each finding.

### 1a. Repair: the wall's "poster" reason (PF-B77)

- Old, `working-wall-preferences.md` principle 4: «Why: from across a classroom a child
  glances at the card and parses it in one read. Three lines turns the item into a paragraph
  and the wall stops being a wall and becomes a poster.»
- New: «Why: from across a classroom a child glances at the card and parses it in one read,
  and a third line would turn the item into a paragraph.»
- The new pin file's `SA-RETIRED` row bars «the wall stops being a wall and becomes a
  poster» everywhere, "retired by SA settled item 1, PF decision 20, PF decision 21, PF
  decision 22 and PF settled item 14". Decision 22 asked that the wall keep sentences whole
  and use the board's colours; the plan's A6 asks only that principle 4 be "said as what fits
  a card, not a quota on writing". The ledger row PF-B77 records the clash («"becomes a
  poster" also contradicts the wall visual language's L31, which makes the display poster the
  wall's model») without a decision, and the builder's own report calls this "My reading, for
  him to check."
- Repair: restore the clause at the end of the new sentence, remove it from `RETIRED` in
  `build_7a_mapping.py`, re-pin, and add the clash to topic 9's questions.

### 1b. Checked and kept (the folds)

- **Sticky knowledge.** The designer's «In a knowledge subject the facts are the learning and
  a task-shaped objective can be met without them, so trace each one forward to the stage
  that needs it» is now in `preferences.md` → Sticky Knowledge («..., so trace each one forward
  to the stage that needs it: an RE lesson named ...»). «And a sticky fact is not where an idea
  goes: `tiny pewter plates were made for play` ...» is now its own paragraph there, pewter
  plates kept. «If fact would reveal thinking later task requires, leave ID off that task. If
  genuinely needed as reference, include.» became «A fact that would reveal the thinking a
  later task requires is left off that task, unless the task genuinely needs it as a
  reference.» The whole «**Phrasing consistency:** ...» copy is in the home in full prose,
  every clause kept, the working wall added (decision 7). The designer keeps «When Teach
  carries sticky and key sentence same idea, that's one entry on that slide, not two: write it
  once, as the headline or as the star line, never both». The wall designer and the slide
  designer both read that section already.
- **The Apply.** The designer's «Keep useful rehearsal within practice; omit the ending when
  practice already draws on the intended learning. Intended learning means what the
  quality-lock sentence and the sticky knowledge name ...» and its three repairs are in
  `preferences.md` → The Apply Slide («the lesson names it in the read-back sentence that
  closes the walk-through and in its sticky knowledge. Keep useful rehearsal within practice,
  and omit the ending ... The repairs, in order: ...»). One word moved: the designer's
  «Prefer reshaping the practice» is now the home's «reshape the final task», which was the
  home's own wording before; same repair.
- **The wall's other copies** (beyond the plan, to stay under the 51 KiB cap): the budget
  section («A worked-example step or sticky-knowledge statement that runs past its budget» →
  «A worked-example step you write that runs past its budget ... A sentence the lesson wrote
  makes room first (rule 8)»), the repair order («1. **Condense the wording** to the
  62-character budget» → «1. **Make room** (rule 8). 2. **Shorten the wording** to a whole
  sentence»), «Preserve readable learning and response examples rather than adding or removing
  a picture to gain a character allowance» → «... and preserve readable learning and response
  examples», the floor line, the focused repair («it fits only reworded» → «it needs its card's
  room first ... or, after that, a shorter whole sentence, and both are the wall designer's to
  decide») and the build message. Each follows decisions 7 and 22; «A success-criteria step is
  never written short: it is copied, and the card makes room» and «A success-criteria step is
  never reworded by anyone» still stand. Nothing else was lost.
- **Stories.** SA-H13's 17 September history slide is in the new log entry before it left
  the route; the PSHE starter story removed from the catalogue is in the 2 September entry.

### 1c. Low notes (the lead's call, no repair needed)

- Reviewer, old «any lesson split is honest and visible;», new «a lesson that left learning
  for another lesson says so in the walk-through;». "Visible" is kept; "honest" went. It is
  partly carried by the next-but-one line «the lesson fits the stated duration without
  rushing or dropping learning».
- Content route, after the new «It usually goes in the `headline`», the kept sentence «When
  that sentence is one of the lesson's sticky facts, the headline still carries it and
  `takeaway` stays `null`» can read as fixed for a sticky fact, where the contract's copy says
  «which is the usual case and stays the case». The plan kept it word for word; fine unless
  a run reads it as a rule.
- Rule 8's sticky sentence is only «So does a sticky-knowledge statement.» (the size cap); the
  wall preferences carry it in full («A sticky-knowledge fact is the same: the lesson's own
  words, shortened only when they genuinely cannot fit, and then still a whole sentence a
  teacher would say.»).
- The wall build's new remedy («take the card's picture off unless the words need it, since a
  card with no picture has the full width») is printed even for a card with no picture.
- The playbook's teacher report still lists «lesson scope» (line 1503), whose only source was
  `lesson.scope`; the new line «When the walk-through says the lesson left something for
  another lesson, say what in one line.» covers the content.

## 2. His words built as he said them

| Item | His words | Built | Verdict |
|---|---|---|---|
| A1 | "get rid of the "will return" stuff, it needs to be like it didnt even exist" | `testQuestionPath`, its note, answer rule, scaffold key, tests and fixture gone; «such as a scanned question» gone from the catalogue and the code comment | Built; see the tall-starter question above |
| A2 | "it already knows how much it can fit in one lesson"; "yes and yes"; question 2 "yes" | three keys gone from contract, validator, scaffold, view, packet; «make the production the opening of the next lesson, warmed by a quick retrieval of today's learning» and «production opens next» gone; «ending on the lesson's core idea while it is still fresh» kept; «says in one line of the walk-through's closing decisions what it left for another lesson; it does not plan that lesson» | Built |
| A3 | decision 3 "Yes" | «a question the lesson will answer opens instead only in the two cases above»; the bullet adds «which stays a question children think and talk about, never a prediction or the task explained» | Built |
| A4 | settled 5 "yes" | «When the teacher's plan lists sticky facts, judge them like anything else it offers, and keep one the teacher marks as required.» | Built |
| A5 | "I dont think this needs to be a clear rule like "sticky klnowledge statement always at top"" | «**The landed sentence usually leads the board.** ... that is how this teacher usually explains, not a rule for every slide»; «Whatever leads, the top line is never a caption of the picture» | Built; no fixed place anywhere I searched |
| A6 | decision 7 "Yes"; decision 22 "yes" | room first, then a whole sentence; sticky fact beside the definition | Built; the picture-first reading is for him |
| A7 | decision 9 "yes"; settled 11, 12 | the ready-made reason now «For a lesson whose learning is a fact or a method»; the routing trigger adds «and when a lesson that named an idea has no Apply and its reason does not say where the idea met a case it was not taught on» | Built; the behaviour case against demanding an Apply passes |
| A8 | "keep with small fix" | reviewer: «with fresh content while the real item is held for a later test, unless the teacher explicitly asks for that exact item; a suitable real question that is not being held may be used itself» | Built, nothing wider than the home |
| A9 | "Just the starter heading that's underlined is enough." | the builder's `starterPrompt` reads `heading` only, as the catalogue now says | Built (test gap 3a) |
| A10 | settled (fold) | both formats carry A07's conditions and point at Starters | Built |
| A11 | settled 1, decision 21 "yes" | `Practise` flagged everywhere, `Apply` outside maths; untitled grid refused | Built; see below |
| A12, A13 | settled 12, 14 | contents block once, Pride note, `lesson-cover` | Built |

**Added by the plan, not by him.** Settled item 1 said an untitled grid "stops printing
"Independent Tasks""; the plan made the build refuse it («a grid-calc slide has no "title",
and the builder no longer prints "Independent Tasks" for one»). The slide designer meets it
first, but when it survives the repair round the final build refuses the whole deck (repair
5, section 7).

**Nothing rebuilt that he retired:** no test-question starter trace outside the tall-starter
examples above; no Lesson 2 field or wording in any runtime file or program (searched every
plugin file, JSON included); no fixed sticky position (the landed-sentence check and the
validator accept either placement).

## 3. The refusal of the retired boxes

**Every path that reads an existing design, and what an old design meets:**

| Path | What happens |
|---|---|
| Lesson designer at design, and its repair passes | A key written by habit is named («lesson has unknown fields: ...») and removed in the next pass; the scaffold and the contract no longer show it, so this should be rare. Finishes. |
| Scaffold request | `scope` refused («scaffold request has unknown fields: scope»); the designer repairs. Finishes. |
| Review packet (Phase 1.25, and a later review after a revision) | Refused; the hand-back to the focused repair can delete the keys. Finishes, at the cost of a repair. |
| `photo-contract.py build-provisional` and `promote-used` (adaptation and worksheet pictures) | Refused. The playbook: «If adaptation fails deterministically, preserve the expected worksheet route and report adaptation omitted.» The run finishes without its Below and Greater Depth sheets. |
| An interrupted run resumed after the update | «resume from the latest checkpoint whose validator still passes»: the design checkpoint no longer passes. |
| `resource-opportunities.py` | Uses two helper functions only; unaffected. |
| `working-wall-packet.py`, `resolve-filing.py` (reads an earlier lesson's year and subject), `validate-run-report.py`, the review view | Read only the keys they need; unaffected. |
| Plan tracker | Reads the plan, never a design. |
| Codex | Same scripts; Codex keeps its installed version until he runs `codex plugin add`, so no switch mid-run unless he installs mid-run. |
| Delivered lessons | Nothing re-checks them. Reopening an old folder to redo a resource meets the refusals above. |

So a new lesson always finishes. The exposure is a lesson already running when 4.2.293
arrives (Claude Code's marketplace can update under a run, which the skill's own "an update
published while a run is working" section expects), or an old folder reopened. The log's
«A lesson designed before this release carries the retired keys and fails the new check if
it is ever re-validated; nothing does that today.» and the report's «No program re-validates
an old design during a run.» should say this instead (repair 2).

**Refuse or ignore.** Refusing is the reading I would keep: the contract refuses every
field it does not have, which is exactly "as if it never existed". Quietly ignoring would
need the validator to name the three keys for ever (they could not be barred) and would let a
designer's Lesson 2 plan disappear unseen, which is the thing he asked to stop. If he wants
belt and braces, the cheapest is a habit, not code: install between lessons.

## 4. Pins

- **New file.** `starters_sticky_apply_ledger_pins.json` holds 492 rows: all 390 SA rows
  (325 unchanged in place, 65 changed, each naming its decision), the homes (How Much Fits,
  Starters, Sticky Knowledge, The Apply Slide, Practising a Test Question, Purposeful Endings,
  and the designer's Starter, Sticky Knowledge, Apply Slide) paragraph by paragraph, 44 PF
  rows, and a `SA-RETIRED` row of 21 wordings barred in every instruction file and program,
  in any case where gone in any case. Local-only bars are old sentences the new text extends
  (for example «**Best for:** the starter of lesson 2+ in a sequence.»), which is right.
- **Earlier topics.** `pindiff.py` against HEAD: 32 pins in 27 rows changed, no row added or
  dropped, no "absent" pin changed, no row turned "retired", flags unchanged except WS-B07,
  which followed phrasing consistency to `preferences.md` → Sticky Knowledge. Each holds the
  new words. The one wrong reason is repair 4 (QC-C08, E11, P01, SC-Q01, TD-L07, L09: "PF
  decision 20" should go from their note; only SA settled item 2 touched that paragraph).
- **Attacks** on a full scratch copy (untouched copy passing first): batch one 29, caught 27;
  batch two 11, caught 10. Caught, among others: the validator taking `testQuestionPath` or
  `scope` again, the reviewer's split and test-question lines, How Much Fits planning the next
  lesson, the hook question unconditioned, "usually" and the caption clause removed, the sticky
  leave-off rule, rule 8's sticky sentence, the repair order, the Apply trigger and ready-made
  reason, "Reflect", the starter title line, the do-beats conditions, the contents Apply line,
  the Pride note, `Practise` and maths `Apply` in the slide check, the grid refusal and default,
  the wall message, the designer planning the next lesson, the playbook line, the skill route,
  the numbered helpers, the teacher-listed sticky facts, the wall preferences' sticky sentence,
  the focused repair, and the research pointer. Missed: the tall starter reading `title` again
  (repair 3a), the scaffold guide's example carrying `"scope": "Complete lesson"` again (repair
  3b), and the wall packet listing `scope` again (harmless: it prints only keys present).

## 5. Replay

`scratch/7achk1/replay.py` extracted `b1c2d427` with `git archive`, ran the nineteen scripts in
the report's order with `LESSONV4_PLUGIN_ROOT` and `LESSONV4_MAPPING_OUT` on the copy (every
script printed the scratch root before writing), and compared every file: content identical
to the working tree, no file present on one side only, and the mapping identical. Files that
differ only in line endings are ones already carrying CRLF on disk before 7A (`git archive`
writes LF); `a10` and the mapping builder write pin files in text mode, so those carry CRLF on
disk too, as earlier releases' repin scripts did (git stores LF).

## 6. Suites and dashes

`run-all-suites.sh 7achk1` with the venv first on PATH: python 2,275 passed, 1 skipped; voice
21; builder 765; worksheet-html 771; stick-in 73; working wall 154; shared 126; test 46. All
green, the report's counts.

Saved designs, my own run against the working-tree validator: 0 of 53 pass (as before); 37 are
refused first with «lesson has unknown fields: deferredLearning, lesson2Direction, scope». The
builder's stripped comparison holds in full, not only on the first line: 52 of 53 fault lists
are identical, and the 53rd differs only by one fewer unfilled placeholder. One of the 16
"same first fault" designs (`childrens-lives-continuity-and-change`) now shows the unknown keys
where it showed «starter missing fields: thinking, unlocks»: the key check stops the contract
check earlier. Explained; nothing to do.

No em or en dash in any added plugin line except dashes already in lines only corrected
elsewhere (contents labels, bullet labels, an untouched sentence), as the plan allows; none in
the log entry, the new tests, the ledger notes or the builder's report. Size: instruction files
+1,935 bytes, programs -658, as reported.

## 7. The two new stops, traced through a real run (asked after the first report)

Tested on a scratch spec in `scratch/7achk1/stops/` (`grid.json`, `practise.json`), running
the real `build.js` with `--deliver-flagged` (what `run-fixed-resource.py slides` passes) and
the real slide check.

### A bare "Practise" title (`INTERNAL_STAGE_TITLE`, `check-slide-design.js`)

- **Where it is met.** Only in the slide check: the slide designer's own preview check (its
  required `SLIDE_DESIGN_CHECK_OK`), the decorator's check, and the orchestrator's re-check
  after the decorator. The final build (`build.js`, through `run-fixed-resource.py`) never
  looks at titles.
- **Who repairs it.** The slide designer, in its three passes: a title is its furniture, and
  Slide Headings tells it what to write («title the slide with the move the unit makes, in a
  child's words, taken from its own content»). Then the one focused slide-designer repair.
- **Can a run end without a deck?** No. `build.js practise.json out --deliver-flagged` wrote
  the deck (exit 0). Worst case, the deck ships with "Practise" printed on that slide. Two
  side effects in that worst case, both already true of any presentation fault that survives
  the round, so not new in kind: the build prints no `SLIDES_FLAGGED:` line for it, so the
  teacher hears of it only if the orchestrator copies the designer's `BUILD_DIAGNOSTIC:` line
  into Teacher flags; and the decorator's own check still fails on it, so the drawing layer
  degrades for the whole deck.
- **The two saved geography decks** (`output/working/year-4-geography-lesson-1` and
  `year-4-geography-where-in-the-world-are-tropical-rainforests`, slides 13 to 16 each) are
  finished decks. Rebuilding one through the final build would still build it; only a fresh
  run's slide check sends those four titles back to be renamed.

### An untitled number grid (`grid-calc`, `builder/src/validate.js`)

- **Where it is met.** In the slide check's scratch build, which reports
  `SLIDE_DESIGN_CHECK_FAILED: SCRATCH_BUILD_FAILED` with the message on stderr and no
  `BUILD_DIAGNOSTIC:` line, and again in the final build.
- **Who repairs it.** The slide designer, then its one focused repair (whose prompt carries
  "the existing build diagnostic"; here there is only the stderr text). The fix is one title,
  so it will nearly always be made.
- **Can a run end without a deck?** Yes, if both miss it. `build.js grid.json out
  --deliver-flagged` stopped with «1 problem(s) in the slide spec, nothing was built» (exit 1,
  no file): `validateLesson` runs before the flagged-delivery path, so `--deliver-flagged` does
  not rescue it, and the playbook then says «Exclude the deck only when the build cannot write
  one». No saved deck has a grid slide at all, so the chance is small, but by his rule a
  cosmetic title should never be able to withhold a deck.
- **Suggested repair.** Put the refusal in the slide check as a presentation fault, beside
  `INTERNAL_STAGE_TITLE` and with the same message, so the designer is still sent back for
  it; and let the final build draw an untitled grid with no title line (check that the
  header draws cleanly with no title) instead of refusing. Settled item 1 asked only that the
  grid stop printing "Independent Tasks"; it never asked for a refusal. The grid test would
  move to the slide check.
