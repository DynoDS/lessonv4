# Fewer repairs: plan (3 October 2026)

Status: proposal only. Nothing in the plugin has been changed. Decisions marked "his call" are waiting for Daniel.

Asked for by Daniel after the Codex run of Year 4 Maths Lesson 21 (4.2.309, 74 minutes, 16 launches). His brief: not this one lesson. Make the plugin catch or teach things earlier so runs have fewer frictions and fewer repairs in general, and find out whether some repairs fix things he would never have noticed.

Builds on, and does not repeat: `plans/2026-09-29-optimisation-measure.md` (where the time goes, changes A to G) and `plans/2026-10-03-overnight-run-log-fixes.md` (run-log repeat problems).

## The pattern across runs

Evidence: the 27 saved friction records since 24 September (duplicate test copies removed), today's run folder and its Codex session logs.

| What stopped a run | Runs (of 27) | What kind of problem |
| --- | --- | --- |
| Slide designer ran out of its three repair attempts | 11 | 7 of the 11 are "more on one board than a board holds" |
| An essential picture could not be fetched | 8 | Outside world (network, licences). Already diagnosed separately |
| Worksheet did not fit, or needed something the engine cannot draw | about 7 | Decided upstream, discovered at the page |
| Reviewer asked for a redesign | 4 | Working as designed (judgement) |
| Helper check failed on a figure's name | 3 | All 3 were false alarms, each "repaired" by renaming |
| A check compared against a draft that an approved revision had replaced | 3 | Stale baseline |

Three causes sit under almost all of it:

1. **Truth arrives late.** The agent that decides how much goes on a sheet or a board cannot see what it costs. The real measure happens two or three agents later, when the only tools left are cuts and repair launches.
2. **Checks stop the run for things that may not matter.** Some refusals are for a hair. Some are plain false alarms. Some compare against a draft that is no longer the plan.
3. **A repair is a fresh agent with part of the picture.** It rereads, patches and can break something else. Today's wrong answer on the answer sheet came from exactly that.

## Workstream 1: real sizes where the decision is made (sheets)

**Evidence.**
- 29 September: 4 of 5 worksheet hand-backs named mispricing.
- Today: the lesson designer priced the Expected sheet at about 220mm; the page check measured 291mm. The adaptation designer priced Greater Depth at 227mm; the real figure was 354mm stacked, 286mm at best.
- The helper catalogue tells designers a blank number line needs 100mm by 41mm. The engine needed 52mm for the one this lesson used (with its start number).
- The rough price list designers add up from has five entries and no entry for this helper. It also budgets 250mm; the real page is 267mm.
- Last night's measurement of 42 real questions found the listed items priced about right. The misses come from items that are not on the list.

**Already built.** A measuring mode for the worksheet designer (change D, 29 September). The upstream designers still price from the rough list.

**Proposed.**
1. A size list generated from the engine itself: every helper a child writes or draws on, with its real smallest width and height, and the real page size. Generated and tested so it cannot drift from the engine. It replaces the five rough prices where the lesson designer and adaptation designer price a sheet.
2. Correct the catalogue's "smallest usable" figure so it reflects the size with real content in it (the 41 against 52 gap).
3. The page check reports every level in one go. Today Greater Depth's overflow surfaced 23 minutes after Expected's.
4. Working space is sized by the agent that lays out the page. Upstream says what the child must do in the space ("room to list seven equations"), not a fixed height. Today a protected 90mm box lost the whole Greater Depth sheet for 19mm.

**Not proposed yet.** Having upstream designers run the measuring tool themselves, or moving the page plan earlier in the pipeline. Both are bigger changes. Try the size list first and see whether page gaps drop.

**How we would know it worked.** Rerun this lesson and two earlier page-gap lessons on both Claude and Codex. Success: the upstream price is within about 10% of the measured page, and no page-gap hand-back.

## Workstream 2: is it repairing things he would not think twice about?

**Why we cannot answer it today.** When a check refuses a slide or a sheet, the engine draws nothing for it. The refused version is never seen by anyone, and most runs do not keep its measurements. So there is no "before" to show him.

**First signal from the numbers.** Only 10 refusals across all saved runs kept both numbers (what it needed, what it had). Of those 10:
- 4 were less than 3% short. One table row needed 0.38in and was given 0.38in. A sheet zone was 6 pixels over in 350.
- 3 more were between 3% and 10% short.
- 3 were genuinely far off.

From the friction notes: a vocabulary card refused for being 0.01in too short, which made the slide designer swap the planned picture for a three-box chain. In two runs the third repair attempt made a passing deck fail.

A sample of 10 is a hint, not a finding.

**Proposed investigation (his eyes are the only yardstick).**
1. A "draw it anyway" evidence mode: the engine draws the refused version as it would have looked, marked as evidence only, never delivered.
2. From saved runs, build before and after pairs for each repair: the refused version beside the repaired version, unlabelled.
3. Daniel marks each pair: fine before / needed fixing / the repair made it worse.
4. Each check then gets a verdict from his marks. A check he mostly marks "fine before" becomes a note the designer may act on, or gets a small tolerance. A check he marks "needed fixing" stays as it is.
5. Runs keep the first draft and its measurements from now on, so this can be repeated without archaeology.

**First set of pairs built (3 October, evidence only, plugin untouched).** Ten pairs published privately for Daniel at https://claude.ai/artifact/EZdYdZqVa15vjPcAjAUQF4 . How they were made: a scratch copy of the slide builder with the table-height refusal switched off drew each "before" from the saved pre-repair file; the "after" came from the repaired file through the same copy; optional drawings were left out of both so the sides differ only by the repair. Working files are in the session scratchpad (`pairs/`), so they will not survive; the recipe is this paragraph.

Key (which side is the earlier version), not shown on the page:

| Pair | Slide | A | B | Why it was repaired |
| --- | --- | --- | --- | --- |
| 1 | Lesson 21 (3 Oct) slide 5 | after | before | Refused: table rows 0.35in against 0.38in |
| 2 | Lesson 21 slide 19 | before | after | Refused: table rows 0.38in against 0.38in |
| 3 | Lesson 21 slide 9 | after | before | Refused: table rows 0.07in (genuinely squashed) |
| 4 | Lesson 21 slide 13 | before | after | Refused: table rows 0.16in (genuinely squashed) |
| 5 | Fractions test deck slide 7 | before | after | Refused: text 39% over its card |
| 6 | Shaftesbury (1 Oct) slide 13 | after | before | No check: a picture never arrived and left a gap |
| 7 | Divisibility first run slide 6 | before | after | No check: the designer's own look judged the reminder too small |
| 8 | Fractions test deck slide 1 | after | before | Already passing; the designer changed it anyway |
| 9 | Fractions test deck slide 19 | before | after | Already passing; the designer changed it anyway |
| 10 | Lesson 21 Greater Depth sheet | designed sheet, working box 70mm instead of 90mm | the Expected sheet that was delivered | Sheet dropped for being 19mm too tall |

My own read before his marks (to be checked against them, not instead of them): pairs 1 and 2 look the same either way; 3, 4, 5 and 6 needed fixing; 7 and 8 are real improvements; 9 is marginal; the Greater Depth sheet with the smaller box looks entirely usable.

Found while building pair 10: the dropped Greater Depth sheet also had a question-numbering fault (its last question printed as a fourth question while the answer key had 3a and 3b), the same fault the run repaired on the Expected sheet.

Limits: only two saved cases are hair's-width refusals, because most runs keep neither the refused file nor its numbers. Several refused slides in the test decks could not be redrawn (their refusals happen before drawing starts).

**Daniel's marks (3 October), decoded with the key.**

| Pair | His mark | What it means |
| --- | --- | --- |
| 1 | Repaired one slightly better, "not worth the repair" | Hair's-width refusal: wasted repair |
| 2 | Can't tell | Hair's-width refusal: wasted repair |
| 3, 4 | Repaired one clearly better, the other "broken" | The check was right |
| 5 | Repaired one better, "obvious error". His own note: the blue question card had dead space, so the top card could simply have been taller | The check was right, and the cure was arithmetic the engine could have done |
| 6 | "That would need fixing!" | Right to repair a missing-picture gap |
| 7, 8 | Later version better | The slide designer's own look earns its keep |
| 9 | Can't tell, earlier one marginally better, "not worth a repair" | Changing a passing slide again gained nothing |
| 10 | Neither | Not yet understood. My reading, unconfirmed: the designed sheet is too empty for Greater Depth and the Expected sheet is not Greater Depth work |

So the checks are mostly catching real faults. The waste is not that they are too strict. The waste is that the designer is allowed to build the fault in the first place and learns about it afterwards.

**His steer after marking:** "surely there's a way that we need to have the designers just know this anyway without having to repair, making most runs actually not have frictions." This reorders the plan: prevention first. See "Revised direction" below.

**His call.** Where the line sits. His stated floors (18pt criteria, 28pt wall steps) are not up for change by this; the question is refusals for a fraction of a millimetre around them.

## Workstream 3: false alarms and stale baselines

1. **Helper name check.** It reads the words in a figure's name and description. "Number line" drawn by the blank surface, "digit cards with a place-value chart", and "not place-value columns" all tripped it. All three recent failures were false alarms fixed by changing the wording. Proposed: accept the helpers that legitimately draw each named figure (the blank surface set to a number line is a number line), ignore negated mentions, and report to the lesson designer inside its own turn so a real mismatch costs a rename in context, not a launch.
2. **Checks after an approved revision.** The repair-scope check compares against the pre-revision draft and rejects removals the lesson designer approved (today; also 28 September and the run-report check that read old receipts). Proposed: after any approved revision, the revised version becomes the baseline for every later check.

## Workstream 4: a repair must not leave the answers behind

Today the page repair changed George's question to 80 take away 36 and the answer sheet kept "35 pencils" (it should be 44). The lesson design had the right answer; the worksheet's answer key was edited by hand and nothing compared the two.

Proposed: the worksheet check confirms each final answer in the lesson design appears in the answer key for that level, and fails by name when one does not.

## Workstream 5: learning the machine by bumping into it

**Evidence.** 29 September: every kind of worker reads a checker's source code to find out what it wants. Today: the slide designer read the checker's code to learn the answer-slide pairing rule; the lesson designer read the worksheet engine to measure a page; a repair agent read the scope checker.

Also today: the slide check's first report was 188 lines and Codex cut it in the middle, because each finding is printed three times.

**Proposed.**
1. Each finding is printed once, shortest form first, so a whole report fits one read.
2. When a later repair attempt fails and an earlier attempt passed, the designer returns the passing one and names the visual fault, instead of returning a failing deck as "exhausted".
3. Number-line captions: the check measures them (today it passed a deck with clipped captions; only the designer's own look caught it).

## Revised direction (after his marks): the designer should not have to guess

There are two ways for a designer to "just know". Both are needed.

**A. Don't make it know. The engine does the sums.**

On a slide, the designer writes a guess for how much height each item gets (a weight). The engine then measures, and when the guess is short it refuses, works out the number that would have fitted, and prints that number for the designer to type in on its next attempt. It already knows the answer and hands it back as homework.

A first version of "share the room by what each item needs" was added on 27 September, but it only covers plain text and the success criteria panel. Tables, step lists, number lines, nested groups and the fixed Teach layouts still use the guess. Today's pairs 1 and 2 were a table in exactly that position. Pair 5 was text in a fixed Teach layout slot with spare room beside it.

Proposed: every item that knows what it needs gets it automatically whenever the slide has the room. A slide is only returned when it truly cannot hold everything, and then the message is a real decision (split it, or move something) with no arithmetic in it.

Rough size of the win: of the 11 runs where the slide designer ran out of attempts, about 4 or 5 were this kind (boxes or tables given too little height while the slide had room). Not yet measured properly.

**B. Where it is a real decision, give it the true numbers before it decides.**

"How much fits on one board, or one page" is a decision, and about 4 of the 11 slide failures plus all the worksheet page gaps are this kind.

- Sheets already let the designer ask the engine which arrangement suits the content before choosing. The designers upstream of it do not get real sizes (Workstream 1).
- Slides have no such question to ask. The slide designer picks a template by hand and finds out afterwards.

Proposed: a "will this fit on one slide, and in which arrangement" answer the slide designer gets before composing, built from the same measuring the check uses, and the real-size list for sheets from Workstream 1.

**C. What the designers keep bumping into gets written back.**

Every run's friction notes contain lines of the form "I expected X, the engine does Y" (one picture per Teach layout, a caption holds one line, the same picture twice is refused). Each is something the designer did not know. Today they are logged and nobody reads them back in. Each recurring one should become either an engine change that makes the expectation true, or one line where the designer chooses that thing.

**What his marks say to leave alone:** the checks that catch genuinely broken slides (pairs 3, 4, 5, 6) and the slide designer's own look at the finished pages (pairs 7, 8).

## Test version of A, first step: the engine lends spare height (3 October)

Daniel said yes to a test version, not released. Built in a separate checkout so the live plugin and the copy Codex installs from are untouched.

- **Where:** the folder `lessonv4-room-by-need` beside the main project (git worktree, branch `room-by-need`, taken from release 4.2.309). Nothing committed, nothing pushed, nothing installed. It has no node_modules of its own: run its checks with NODE_PATH pointing at main's four node_modules folders.
- **What it does, final form.** In a stack of items on a slide:
  1. A table whose rows would fall under a readable line borrows exactly what it is short by from text beside it that is holding room its words do not use. The lender keeps its size and its card.
  2. A line of text whose share is thinner than its own white card borrows enough to keep the card. (The engine already lifted a line that could not hold its words at 18pt; this catches the line that just holds them and was printing bare.)

  When the lenders cannot cover it, nothing moves.
- **Files:** `builder/src/content/stack.js`, `builder/test/stack-lends-spare-height.test.js` (new, five tests), `builder/test/weight-advice-works.test.js` (three tests added, one given a neighbour that cannot lend), `references/templates.md` (three sentences so the slide designer knows).

Evidence on the final form:

| Check | Result |
| --- | --- |
| All 47 saved decks rebuilt with the released engine and the test engine, slide by slide | 46 identical. The one that differs is Lesson 21's pre-repair file |
| Refused slides that now build with no repair | 2: Lesson 21 slides 5 and 19 |
| Still refused, correctly | Lesson 21 slides 9, 13, 15, 17 (genuinely too much in the column); every Roman numerals slide (see below) |
| Every automatic check the plugin has, run on the test copy | 4,823 passed, 0 failed |
| The two behaviour tests with the change taken out | Both fail, as they should; the three guard tests pass either way |

Shown to Daniel at https://claude.ai/artifact/HqtJR76jwRLQvaiuPgfX5u (three pictures per slide: made first, test version first time, after the repair).

What was tried and taken out, each because of what it did to real slides:

1. **Re-sharing the whole stack when a table is short.** Two text lines lost their white cards, and one slide in a finished deck moved. Removed.
2. **Borrowing from the band a stack leaves empty.** It let two Roman numerals slides build in their first arrangement. Daniel, shown both: "I'd want the repaired one" (rebuilt side by side with bigger writing). So that refusal was doing useful work, and it stands. Removed, with a test that pins the refusal.
3. **Lifting a thin line before the engine's existing 18pt settling.** It pre-empted that settling and made one finished slide's instruction card slightly smaller. Reordered so the existing settling runs first.

His marks on the test slides: slides 1 and 2 "first-time one is good enough"; slides 3 and 4 (Roman) "I'd want the repaired one"; then on slide 1, "I prefer the white card in after, but the actual working table first is fine", which is what item 2 above now does.

Honest limits:
- Tables and thin text lines in a stack only. Step lists, number lines and the fixed Teach layout slots (his pair 5) still run on the guess.
- Not yet run through a real lesson on Claude or Codex. The proof is on saved decks.

## Why the first version is worse than the repaired one, and what gets it right first time (his question, 3 October)

His question: "why these problems before when I preferred the after? How do we get it right to do it first time?"

What the evidence shows:

- **The designer composes blind.** It picks an arrangement from a catalogue and types guesses for sizes. It only sees the slide after building it.
- **Its attempts go on arithmetic.** It has three goes after the first check. On the Roman numerals deck all three went on table heights, so it never reached the part it is good at: looking at the page and improving it.
- **The repair is the first one that looks.** A repair agent starts from the drawn slide and the measurement. That is why "after" is better: the same kind of agent, but one that could see.
- **His preferences are consistent and measurable.** In every pair where he preferred the later version (pairs 7 and 8, Roman 3 and 4, the card on slide 1) the later version had bigger writing, less empty space, and every line on a white card.

Three levers, in order:

1. **The engine does the sums**, so attempts are not spent on arithmetic. Started today (tables, thin lines).
2. **The designer looks at its first build with attempts still in hand.** This already exists and earned its keep (pairs 7 and 8). Lever 1 frees the attempts for it.
3. **The engine proposes the arrangement.** For a slide's content, try the arrangements the templates allow, measure writing size and empty space for each, and hand the designer the best one to start from. Worksheets already work this way. Slides do not.

Proposed next experiment (no plugin change): take the saved slides where he preferred the later version, let the engine try the arrangements and pick by "biggest writing, least empty space", and see whether its pick matches the version he preferred. His marks are the answer key. If it matches, lever 3 is worth building.

## Lever 3 experiment: can the engine pick the arrangement he prefers? (3 October)

Daniel said yes to the experiment. No plugin change: a script in the session scratchpad drove the test engine.

His marks on the final test version first: slide 1 "middle is fine, repaired is a bit better"; slide 2 "middle is as good as the repaired one".

**The measure, fixed before any result was looked at.**
1. A layout that is refused or carries a fault is out.
2. Best is the largest writing: the mean point size of the body text, weighted by how much text there is (slide title left out).
3. Layouts within 1pt of the best are tied on size, and the tie goes to the smallest "largest empty rectangle" on the drawn page.

**Test A: does the measure agree with his marks?** For each pair he judged, the earlier and later versions were built and measured.

| Slide | Earlier version | Later version | His mark | Measure |
| --- | --- | --- | --- | --- |
| Roman numerals 4 | 19.3pt, fault | 22.2pt | later | later |
| Roman numerals 5 | 20.8pt, fault | 22.2pt | later | later |
| Divisibility 6 | 20.0pt (smallest 16) | 21.2pt (smallest 18) | later | later |
| Fractions starter | 20.6pt | 28.9pt | later | later |
| Fractions "why is one eighth smaller" | 18.4pt, fault | 20.5pt | later | later |
| Lesson 21 slide 9 | fault | 23.3pt | later | later |
| Lesson 21 slide 13 | fault | 21.7pt | later | later |
| Shaftesbury 13 | not measured (missing picture, not an arrangement) | | later | n/a |
| Lesson 21 slide 5 | 24.6pt | 24.9pt | first fine, repaired a bit better | tie |
| Lesson 21 slide 19 | 23.6pt | 23.7pt | the same | tie |
| Fractions "who is correct" | 31.3pt | 32.1pt | cannot tell | tie on size |

Every clear preference agreed (7 measured), and the three he called the same or nearly the same came out as ties.

**Test B: given only the first version's content, which of the 24 two-zone layouts does the engine pick?** (12 split templates, main part on either side.)

| Slide | Engine's pick | Compared with the version he preferred |
| --- | --- | --- |
| Roman numerals 4 | half and half, side by side: 24.7pt, smallest 24pt | The repair chose side by side too (70/30): 22.2pt, smallest 18pt. Same kind of layout, bigger writing. Needs his eyes |
| Roman numerals 5 | half and half, side by side: 24.4pt | Repair: 22.2pt. As above |
| Lesson 21 slide 5 | 60/40 (24.0pt, less empty space) over the existing 50/50 (24.6pt) | Already fine. A change nobody asked for: shows the engine should leave a slide alone unless a layout is clearly better |
| Lesson 21 slide 19 | the existing 50/50 | Correct: left alone |
| Lesson 21 slides 9, 13 | none of the 24 holds the content | Correct: these needed the content regrouped, which the repair did. The engine can say "no layout holds this" before the designer composes, instead of after three attempts |
| Divisibility 6 | only the existing 90/10 builds | A miss. The repair's 80/20 needed two heights changed as well; with the guessed heights every other layout is refused. A table beside the criteria would have to give up spare height, which the test version does not do yet |

Shown to Daniel at https://claude.ai/artifact/RNCpTwhgGAdhTcotWrbyPC (first version, repaired version, engine's pick, three slides).

What this says:
- The measure tracks his eye well on the slides he has judged. Small sample: 10 pairs, mostly maths.
- Picking the layout by that measure finds the kind of layout he preferred on the two slides where the first arrangement was the problem, and beats the repair on writing size.
- Levers 1 and 3 need each other: the layout search is blocked wherever guessed heights still decide what fits (Divisibility 6).
- Two rules fall out for any real build: only suggest a different layout when it is clearly better (more than a point of writing size, or the current one has a fault), and say plainly when no layout holds the content.
- Not covered: Teach layouts and slides that need their content regrouped (the fractions starter went from one column to two). The search only swapped layouts for slides already built as two zones.

**His marks on the engine's picks (3 October):** "Engine's pick is best" on all three slides, including the subtraction slide where the pick was only a tie on writing size and won on less empty space. So the cautious rule drafted above ("only suggest a different layout when it is more than a point bigger") is stricter than his eye: less empty space at the same writing size is a real gain to him.

**Wider run, started 3 October at his prompt** ("do you think we should do this for other slides from other runs too?"): the same test over 74 two-zone slides from 22 finished decks in six subjects (Maths 39, History 11, PSHE 8, Science 8, RE 4, Writing 4). Questions it answers: how often the engine's pick differs from what was delivered, by how much, whether it holds outside maths, and whether it ever picks something worse. Results land in the session scratchpad as `wide-report.json`, to be copied to `evaluations/trial-2026-10-03-arrangement`. A blind sample of the slides where the pick differs goes to him to judge.

## Wider layout run: results (3 October)

74 two-zone slides from 22 finished lessons, six subjects, 24 layouts each, built with the test engine. Scripts, both reports and the blind key are kept in `evaluations/trial-2026-10-03-arrangement`.

**The first measure failed outside maths, and the wider run is what showed it.** Scored on writing size and empty space alone, its three biggest "gains" were bad picks: a digestive-system diagram, a cracker photograph and a number line each squashed to a thumbnail so the writing could grow. The plugin's own full slide check does not flag those layouts either (its picture floor covers pictures marked as worked-from, not context pictures or drawn figures). The three slides he had judged before had no picture that could be squeezed, which is why the measure looked sound on them.

**Measure, second form (fixed before re-scoring).**
1. Refused or faulty layouts are out.
2. Writing: mean body-text size, counted only up to 28pt, as a share of the best any usable layout reaches.
3. Pictures and drawn figures: total drawn area, as a share of the best any usable layout reaches. A slide with none scores full marks here.
4. A layout's score is the lower of the two shares, so it cannot win by starving one to feed the other.
5. Layouts within 3% of the best are tied; the tie goes to the smallest empty patch.

The 28pt ceiling and the "lower of the two" rule are my assumptions, not his rulings. The blind pairs are there to test them.

**What the second form picks.**

| | Count |
| --- | --- |
| Slides tested | 74 |
| Could be compared (delivered layout and at least one alternative both build) | 67 |
| Engine picks the delivered layout | 29 |
| Engine picks a different layout | 38 (57%) |
| By subject, different / compared | Maths 19 of 36, History 7 of 11, Science 4 of 8, PSHE 3 of 4, RE 3 of 4, Writing 2 of 4 |

What the different picks look like, from reading them:
- **No picture:** the pick usually moves a few percent of width between the work and the success criteria. Writing rises by 1 to 2.5pt on the work, and the criteria often get narrower and smaller. Whether that trade is a gain is his call.
- **With a picture:** the pick usually enlarges the picture and gives up 1 to 5pt of writing. One of these is a class character drawing made much larger, which is probably not what he wants: a context drawing should not drive the layout.
- **Same writing, less empty slide:** several, like the subtraction slide he preferred.

**Blind sample sent to him:** twelve pairs, delivered against the engine's pick, sides shuffled, at https://claude.ai/artifact/NjEmN3ps1AosZmtmPpSinv . Key in `evaluations/trial-2026-10-03-arrangement/blind-pairs-key.json` (pairs 1, 3, 4, 5, 9, 11: A is the engine's pick; pairs 2, 6, 7, 8, 10, 12: A is the delivered slide).

What his marks will settle:
- Pairs 1 to 6 (no picture): is bigger work at the cost of smaller criteria a gain, and does less empty space alone count.
- Pairs 7 to 10 (picture): does he want the bigger picture when the writing shrinks, and does a character drawing count as a picture.
- Pairs 11 and 12 (number line, part-whole model): figures children read.

Limits:
- The test stripped the question-and-answer pairing from each slide so one slide could be built alone. A real build keeps a question and its answer slide in the same layout, so the engine would have to pick for the pair together.
- Only layouts were swapped. Teach layouts and slides needing their content regrouped are not covered.
- Three slides had no layout that built in the test at all, an artefact of building the slide alone.

## His marks on the twelve blind layout pairs (3 October)

Decoded with the key.

| Pair | Slide | What the engine's pick changed | His mark | Meaning |
| --- | --- | --- | --- | --- |
| 1 | Maths, number bonds answers | work +2.4pt, criteria narrower | A better | engine's pick better |
| 2 | Maths, six sums | work +2.3pt | can't tell | tie |
| 3 | History, model answer | work +1.3pt | A better | engine's pick better |
| 4 | Maths, number bonds Your Turn | side by side became top and bottom, less empty | neither; delivered if forced. "Questions could fill the deadspace, success criteria text could still be bigger" | delivered slightly better, both lacking |
| 5 | Maths, three sums | same writing, less empty | can't tell | tie |
| 6 | History, explain | same writing, less empty, criteria smaller | A better | delivered better |
| 7 | Science, astronaut | photo doubled, writing -5pt | can't tell. Likes the photo size and less dead space in one, the text size and spacing in the other | tie |
| 8 | RE, wise men | painting doubled, writing -3pt | can't tell. "Because A text box is wider, it reads better" | tie |
| 9 | PSHE, Ines | photo bigger, writing -4.4pt | can't tell. "As long as the text in A is still readable from back of class" | tie, conditional |
| 10 | Science, Grandad | drawing much bigger, writing -1.2pt | can't tell. "Text is probably more important to be bigger than the picture" | tie |
| 11 | Maths, negative numbers answers | number line moved to the top, less empty | can't tell | tie |
| 12 | Maths, partitioning | top and bottom became side by side: writing +2.9pt and picture bigger | B better | engine's pick better |

Tally: engine's pick better 3, delivered better 2 (one of them "neither"), no difference 7.

What it says:
- **On finished slides the picker is mostly noise.** It would change 38 of 67 slides and he sees a difference in 5 of 12, three for and two against.
- **Every win had the work's writing at least 1.3pt bigger and nothing else smaller.** Pair 12 started from the smallest writing in the sample (19.1pt).
- **Less empty space alone is not a gain.** Pairs 5 and 6: tie and worse. (The subtraction slide he preferred earlier was seen unblinded with the repaired version alongside.)
- **A bigger picture at the cost of writing is not a gain.** All four picture pairs were ties, and his comments put text first. So the second measure's "picture and writing matter equally" was wrong for him. A picture should not be squashed, and it should not be fed at the writing's expense either.
- **Width matters as well as point size.** "Because A text box is wider, it reads better."
- **Pair 4 names a different problem from layout:** the sums sit small in a big space and the criteria are small. Things should grow into the room they have. That is sizing inside a layout (lever 1), not choosing between layouts.

His order of what matters, in his words across the pairs: readable writing first, criteria included, in boxes wide enough to read well; then filled space; then picture size.

Decision this supports: do NOT build a layout chooser that overrides the designer on every slide. Keep the idea only as a narrow help: when a slide is refused, or its writing comes out small, name the layout that builds it with clearly bigger writing and nothing made smaller.

## The layout search on refused slides, the population that matters for repairs (3 October)

Every slide the released engine refuses in any saved deck: 27 distinct slides. 25 are two-part slides the search can try; 2 are other templates.

| Group | Slides | Result |
| --- | --- | --- |
| Roman numerals to L, first draft | 6 | A layout builds all six cleanly: side by side, writing about 24.5pt. That run spent three attempts and a repair on these |
| Lesson 21 slides 5 and 19, first draft | 2 | A layout builds them, but the test version's height lending already does, in the designer's own layout and with bigger writing |
| Lesson 21 slides 9, 13, 15, 17, first draft | 4 | No layout builds them: too much in the column |
| Roman numerals to C, first draft | 4 | No layout builds them |
| Find 10 and 100 more or less | 3 | No layout builds them |
| Fractions test decks | 6 | Not counted: refused for the question-and-answer pairing, which this test strips, so their passing here proves nothing |

Of the 19 that count: 8 have a layout that builds cleanly and 11 have none.

So for a refused slide the engine can say one of two true things at the first check, before any attempt is spent:
- "This content builds in this layout, with writing at this size", or
- "No layout holds this content: split the slide or regroup it."

Results kept as `refused-report.json` in `evaluations/trial-2026-10-03-arrangement`.

**Where the plan stands after today's tests.**

1. Engine lends spare height (tables, thin lines): built in the test copy, proved on saved decks, his marks agree. Ready for a real-lesson test on both hosts when he says.
2. Layout chooser on every slide: tested and NOT recommended. Mostly no difference to him, and it can make criteria smaller.
3. Layout named when a slide is refused: supported by the refused-slide test (8 of 19 would have been fixed in one go, 11 told plainly to split). Not built.
4. Things growing into the room they have (his pair 4 comment: sums small in a big space, criteria small): not investigated yet. It is sizing inside a layout, the same family as item 1.
5. Small fixes from earlier (answers drifting from questions, false alarms, stale baselines, Codex's two): not started.

## Built in the test copy: a refused slide is told which layouts hold it (3 October)

Daniel, asked whether to build the narrow version: "do what you think". Built in the same separate checkout as the height lending (`lessonv4-room-by-need`, branch `room-by-need`). Nothing committed, pushed or installed.

**What it does.** When the slide check refuses a two-part slide, it draws that slide's content once in each of the other eleven two-part layouts and prints one line for the slide:
- the layouts that build it with all its writing at 20pt or more, and any that build it with some writing smaller; or
- that no two-part layout holds the content, so the designer should split or regroup instead of trying templates.

It reports what fits and does not choose. A question and its answer slide are tried together, because they must share a layout. It runs only when something was refused, and never on a settled deck.

**Files:** `builder/scripts/layout-options.js` (new), `builder/scripts/check-slide-design.js` (calls it on a refused build), `builder/test/layout-options.test.js` (new, seven tests), `agents/slide-designer.md` (one paragraph saying what the line means).

**Evidence.**

| Check | Result |
| --- | --- |
| Roman numerals to L, first draft (six refused slides) | Each is told: builds with all writing at 20pt or more as half-and-half or 60/40 side by side; at 70/30 some drops to 18pt |
| Lesson 21, first draft (four refused slides) | Each is told no two-part layout holds it |
| Time added to a failing check | 2 to 3 seconds |
| A named layout really builds the slide | Tested: the layout is taken and the slide then passes |
| A clean deck | No line printed |
| Every automatic check, run on the test copy | 4,830 passed, 0 failed |

**A fault caught while building it.** The first version read a trial that never ran as "every layout builds" and named three layouts for slides nothing holds. It now speaks only when the trial deck was actually drawn and measured, and a test pins that.

**Not done:** Teach layouts and other templates get no line. The line names layouts that fit; it does not rank them by how they read.

## Corrected answer sheet, prepared and not delivered

A corrected copy of Lesson 21's answer sheet (question 4: 44 pencils) is in the project's `lesson-output` folder as "Year 4 Maths Lesson 21 - Subtract two 2-digit numbers - Answers (corrected).pdf". The delivered files and the school drive are untouched: replacing them needs his word.

## What is in the test copy now, awaiting a real-lesson run

1. Height lending: a short table, and a text line thinner than its card, borrow spare height from text beside them.
2. Layout line: a refused two-part slide is told which layouts hold it, or that none does.

Both proved on saved decks only. Neither has run through a real lesson on Claude or Codex.

## Worksheets: census of saved runs and the first comparison (3 October)

Daniel: "the run had many problems with worksheets, do you think we should do some testing and some A/B comparisons with these". Yes. Started with what the saved runs already show (`evaluations/trial-2026-10-03-arrangement/worksheet-census.py`).

**Census, 26 saved lessons with a worksheet.**

| What happened | Lessons |
| --- | --- |
| A sheet was sent back because it would not fit the page | 6 |
| A level was replaced by the Expected sheet | 1 (today's Greater Depth) |
| A question, a row, a prompt or working room was taken off a sheet so it would fit | about 9, mostly on the Below sheet |
| Three distinct levels delivered | 16 |
| Two levels delivered | 10 |

Where the designers wrote a page estimate, several were already at or over the page (290, 277, 271, 256, 253mm against a 267mm page) with the cuts named in advance. So for those sheets the estimate was not wrong: the content does not fit one side, and the plan was to cut. The cuts land on the Below sheet because its frames and supports are the biggest items.

So there are two different worksheet problems:
1. **Mis-pricing** (today): a helper the price list does not cover, found three agents late. Workstream 1 covers this.
2. **Cutting to fit** (about 9 lessons): the Below sheet loses a question or a support to stay on one side. This is a teaching choice, not arithmetic, and it is his to rule on.

**First comparison sent to him:** the same lesson made twice (1 October and 3 October), sheet by sheet, at https://claude.ai/artifact/Hf3Hf7cT5NZ5WhKnSLgpUV . Not blind. Expected: eight questions with fill-in frames against four with draw-your-own lines. Below: its own sheet against the Expected sheet unchanged. Greater Depth: slips for books, against the dropped sheet, against the Expected sheet. Asks which he would hand out and why, and what was missing when he said "neither" earlier.

**Comparisons proposed next, not built:**
- **Cut against kept.** For the lessons where something came off the Below sheet: the delivered sheet beside the same sheet with everything kept, made to fit another way (blank space trimmed, a second side, or landscape). Tells us whether he would rather lose the question or accept the other cost.
- **How small can the write-on parts go.** The blank number line at its current height beside smaller ones, and the working box likewise. His earlier size rulings stand; this finds where his eye says too small for the items he has not ruled on.

## His rulings on the worksheet comparison, and the number line shape (3 October)

His answers, same lesson made on 1 October and 3 October:

- **Expected: neither.** "The slides taught numberline right? so that should be what's on sheets, but the numberline sheet is formatted all wrong."
- **Below: the 1 October sheet**, "but numberlines for each question".
- **Greater Depth: the 1 October slips.** "Greater depth probably don't need numberlines right, so probably a slip with questions."

What these say:
1. **The sheet practises with what the board taught.** If the lesson taught the number line, the sheet uses the number line. (1 October's Expected sheet used a fill-in frame instead.)
2. **A number line question has to be formatted properly on paper.** Today's was not.
3. **Below keeps its frames and gets a number line for every question.**
4. **Greater Depth works without the printed support, in books, from a slip.** He phrased this as a question ("probably... right?"), so it is his leaning, not yet a ruling.

**Why the number line sheet was "formatted all wrong": one cause, in the drawing.** The blank draw-your-own number line (`shared/visuals/blank-surface-svg.js`) has one fixed shape: 1000 units wide by 410 tall, with a 300-unit empty band above the line for jumps. It scales by width. At the full width of a sheet it is 71mm tall, so a designer who wants several on a page has to squeeze each into a narrow column beside its sum (125mm wide, 52mm tall), where the start number prints tiny. Four of them stacked full width with the other two tasks need 434mm against a 267mm page. On the board the same shape comes out as a short faint line with a start number too small to read.

This is the same fact as the mis-pricing found earlier: the catalogue says the helper's smallest size is 41mm tall, and that is only true at its narrowest.

**Test picture (scratch copy only, plugin untouched).** With the band above the line cut from 300 to 90 units and the band below from 110 to 55, each line is 174mm wide and 27mm tall, and all six tasks the lesson designer first wanted (four number line calculations, the reasoning claim, the problem) fit one portrait side. That is the set whose refusal started today's 25-minute worksheet chain. The same change on a Your Turn slide makes the line span its column and roughly doubles the start number.

Shown to him at https://claude.ai/artifact/Mtj9fxQ2pPPX9bFe1QLXUW : worksheet and board, as delivered beside reshaped, asking whether the reshaped one is right and what is still wrong.

Open for him:
- Is about 15mm above the line enough room to draw and label jumps?
- Is the start number big enough on the board?
- Does he want anything printed that is not there now (a mark at the start, a place for the answer)? The helper is deliberately bare, because drawing the line is the skill.
- A change to this shared drawing changes the board, the sheet, the wall and the stick-in pack together, and his 29 July ruling (the line needs width; 55mm is too small) still stands.

## Built in the test copy: the number line reshaped (3 October)

His marks on the shape: worksheet "the reshaped one is right"; board "the reshaped one is right", with "maybe thicker line and bigger number. 20 font size is min".

Built in the same separate checkout (`lessonv4-room-by-need`, branch `room-by-need`). Nothing committed, pushed or installed.

**What changed.**
1. **The shared drawing** (`shared/visuals/blank-surface-svg.js`): the empty band above the line goes from 300 to 90 units and the band below from 110 to 55. One shape on all four surfaces, as before. A full-width line on a sheet is 174mm by 27mm.
2. **The board only** (`builder/src/content/blank-surface.js`): the start number never prints under 20pt and the line is drawn about 4pt thick. The drawing scales with its zone and the zone is only known while the slide is drawn, so a labelled number line is made at seven label sizes and each slide takes the smallest that reaches 20pt at the width it really has. The number comes out between 20 and about 27pt on any slide.
3. **What the designers read**: the helper catalogue is regenerated (smallest size now 100mm by 15mm, was quoted as 41mm) and the helper's one-line description says it goes full width under its calculation and is a sixth as tall as it is wide, 27mm on a full page. That is the fact the lesson designer and adaptation designer lacked when they priced Monday's sheet.

**Files:** `shared/visuals/blank-surface-svg.js`, `builder/src/content/blank-surface.js`, `worksheet-html/src/helpers/purposes.js`, `references/worksheet-helpers/catalogue.md` (generated), `builder/test/blank-number-line-shape.test.js` (new, five tests).

**Evidence.**

| Check | Result |
| --- | --- |
| The six tasks the lesson designer first wanted (four number line calculations, the claim, the problem), built by the test copy | One portrait side, 99% full. On the released engine they need 434mm of a 267mm page |
| Start number on the board | 20pt or more in every column width from 30% to full width (tested) |
| All 47 saved decks, released engine against test engine | 45 identical. The two that differ are Monday's lesson, the only saved lesson that uses this line; its number line slides change as intended and nothing new is refused |
| Every automatic check, on the test copy | 4,835 passed, 0 failed |

A project rule caught one thing on the way: a helper's description must stay short enough to scan, so the sizing advice was cut to fit it.

Shown to him at https://claude.ai/artifact/Mtj9fxQ2pPPX9bFe1QLXUW (board and sheet, as given beside as built).

**His answer on the built version: "both right"** (board and worksheet). The number line shape and the board's thicker line and 20pt number are settled.

**Not done:**
- The wall and the stick-in pack use the same drawing and take the new shape. No saved lesson puts this line on either, so that is untested on real output.
- A sheet built before this change that put the line beside its sum (Monday's delivered sheet) would now print thin lines. New sheets are told to set it full width; old specs are not rewritten.
- Whether Greater Depth should work from a slip without the printed line is still his to confirm.

## What is in the test copy now, awaiting a real-lesson run (updated)

1. Height lending: a short table, and a text line thinner than its card, borrow spare height from text beside them.
2. Layout line: a refused two-part slide is told which layouts hold it, or that none does.
3. Number line shape: shallow and full width on every surface; on the board a thicker line and a start number of 20pt or more.

All three proved on saved decks and sheets only. None has run through a real lesson on Claude or Codex. Monday's subtraction lesson is the natural test: it is the one that broke.

## The general picture: every friction note from the last 27 runs (3 October)

Daniel, after I proposed re-running Monday's lesson: "listen, you just did this run. i was expecting more general". He is right: the three things built today (height lending, the layout line, the number line shape) all came out of one lesson. This section is the general view he asked for at the start.

Source: all 206 friction notes in the 27 run records since 24 September (duplicate test copies removed). Sorted by keyword rules and then read; the proportions are sound, single notes may sit in the wrong pile. Script: `evaluations/trial-2026-10-03-arrangement/friction-classify.py`.

| General cause | Notes | Runs (of 27) | Marked "harmed" |
| --- | --- | --- | --- |
| A picture from the web: not found, blocked, weak, small, or late | about 80 | 15 | 22 |
| A command or tool did not match its instructions | about 45 | 16 | 1 |
| Too much for the slide or the page | about 20 | 11 | 5 |
| The engine could not do what the designer expected | about 16 | 9 | 2 |
| A later stage worked from an older version | about 13 | 6 | 1 |
| A check was wrong or raised a false alarm | about 9 | 7 | 0 |
| Choices recorded, nothing wrong | the rest | | |

And what stopped a run outright (from the earlier tally of blocks): slide designer out of attempts in 11 runs, an essential picture lost in 8, a reviewer redesign in 4, a helper-name false alarm in 4, a page gap in 3.

**What this says.**
- **Pictures are the biggest cause by far**: about four notes in ten, and 22 of the 36 notes marked "harmed". Nothing built today touches them. (Last night's fix for the photo site's hourly limit being read as a wrong password is in 4.2.309; most of these 27 runs predate it, so the true current figure is unknown.)
- **Tools not matching their instructions is the most widespread**: 16 of 27 runs, nearly always harmless, each one a wasted try. A missing required argument in a written command, a reader that refuses a batched read, a search tool that is not installed, a script that will not print a minus sign, a worker's report that never arrives.
- **Room on the slide or page** is about one note in ten, but it is what sends the slide designer to a repair, so it costs the most minutes. Today's work sits here.
- **Stale versions**: after an approved change, a later stage or check still reads the earlier file. The slide decorator re-measured a stale room file by hand in three separate runs.

**One general mechanism per cause (proposed, none built except where said).**

| Cause | General mechanism | Not a per-lesson patch because |
| --- | --- | --- |
| Tools and instructions disagree | Every command written in an agent's instructions is run against its tool by an automatic check before release (dry run), and each worker is told at launch what this host has: the page-drawing route already found, the search tool to use, UTF-8 output | It tests the instructions themselves, whatever the lesson |
| Room | The engine shares room by need for every item that can say what it needs (built for tables and thin lines only). Real sizes for every helper at half and full page width, generated into the catalogue (built for one helper only). The page check reports all levels at once. A refused slide is told which layouts hold it (built) | The size list and the sharing are per kind of item, not per lesson |
| Stale versions | One "current version" after an approved change, read by every later check; a measurement that has gone stale is re-made automatically | Removes a whole family: scope check, picture contract, room file |
| Wrong checks | Fix the four known: figure name matching, changed-but-approved removals, field order in the voice check, answer markers drawn by helpers | A short known list |
| Engine cannot do what was expected | Each recurring "I expected X" becomes either an engine change or a stated limit in the catalogue entry the designer reads when choosing | Feeds every later lesson |
| Pictures | Needs its own investigation first: how many of the 80 notes last night's fix removes, what a slide does when its picture never arrives (twice a gap was left), and reusing a picture already found for an earlier lesson | Unknown until looked at |

**Honest position.** Today's three changes are sound and judged by him, but they address roughly a tenth of the friction notes. The two largest causes are untouched.

## The two biggest general causes, looked at properly (3 October, evening)

Asked which to take first, pictures or the tools check, Daniel said "yes". Both were investigated across all 27 runs. Read-only: nothing was changed.

### Tools not matching their instructions: the planned fix was tested and dropped

**The idea was:** an automatic check that runs every command written in the instructions against its tool.

**Tested before building it** (`evaluations/trial-2026-10-03-arrangement/written-commands.py`): 62 written commands in 79 instruction files were compared with what each tool says it accepts. Real mismatches: none. The written commands already match their tools, so that check would have caught nothing.

**What the 45 notes really are**, read one by one:

| What the worker met | Notes |
| --- | --- |
| The reference reader refused a batched or combined read | 8 |
| The search tool the instructions expect is not on this computer | 7 |
| PowerPoint could not draw the pages, so the other route was used | 6 |
| A long script passed through the shell broke on quotes | 4 |
| The worker's report never came back to the orchestrator | 3 |
| A required file list the instructions do not mention | 3 |
| Clean-up blocked by the computer's own rules | 3 |
| The rest (a wrong path, a minus sign that would not print, a bare file name) | about 10 |

Nearly all of it is the same thing: **every worker rediscovers the same facts about the computer it is running on, in every run.** Each worker tries the fast search tool, finds it missing, and falls back. Each one probes PowerPoint. None is told.

**General mechanism (proposed):** the facts are found once at the start of a run and handed to every worker at launch: which search to use, which route draws pages, read references one at a time, write long scripts to a file. And an expected difference like "PowerPoint is not available here" stops being recorded as friction at all.

### Pictures: the same shape as the room problem

160 picture notes and blocks, 17 runs.

| What happened | Notes | Runs | Harmed or blocked |
| --- | --- | --- | --- |
| A picture never arrived and something downstream was left with a hole | 31 | 10 | 24 |
| Picture paperwork: file lists, receipts, numbering | 26 | 13 | 7 |
| The photo site's hourly limit read as a wrong password (fixed 3 October, in 4.2.309) | 22 | 6 | 15 |
| The only copy found was small or low quality | 15 | 8 | 1 |
| A source would not download (certificate errors, blocked pages) | 11 | 4 | 5 |
| No faithful picture turned up, a near match or none was taken | 10 | 7 | 1 |

Read run by run, the damage follows one pattern:

1. The lesson designer writes the lesson around pictures it has asked for.
2. The picture search runs while the slides and sheets are being designed.
3. An essential picture cannot be found.
4. The lesson designer is called back to redesign around different pictures, a second search runs, and the slide and worksheet designers rework what they built.

An essential picture was lost in 8 of the 27 runs, and each time it cost a redesign and a second search. In 3 more runs an optional picture did not come and a slide was left with an empty half until a repair filled it (his mark on one of these: "That would need fixing!").

**This is the room problem again: the lesson is built around something before anyone knows it can be had.**

**General mechanisms (proposed, none built):**
- **Search before building.** The essential pictures are looked for before the slides and sheets are designed around them, so a picture that cannot be found is replaced once, at design time, by the agent that chose it.
- **Reuse what was already found.** The same engraving was searched for in three lessons and the same diagram in two. A picture found once should be offered to the next lesson that asks for it.
- **No holes.** When an optional picture does not come, the slide closes up around the gap by itself. Twice the slide designer expected that and found an empty band.

**Unknown, and the first thing to measure:** how much last night's fix already removed. The hourly-limit fault alone was 22 notes and 15 of the harmed ones, and nearly all 27 runs predate the fix.

### One principle under all of it

Room on the page, room on the slide, which layout, whether a picture exists, what this computer has: in every case **the work is committed before the fact is known**, and the fact arrives as a refusal. The general fix is always the same: find the fact first, or let the engine handle it.

## Plan: pictures are settled before anything is built around them (3 October)

Daniel said yes to working out how "search before building" fits the order of a lesson, to be shown before any change. This is that plan. Nothing is changed.

### The order now (from the playbook, Phase 1 to Phase 3)

1. The lesson is designed, with the pictures it wants listed.
2. The design is reviewed.
3. The picture list is frozen. The picture search starts, alongside the wording edit.
4. The slides and the sheets are designed while the search is still running. Each designer is told only that the search is being attempted.
5. A picture that cannot be found is discovered now. The lesson designer is called back for a revision, the whole design is reviewed again, a second search runs, and the designer that was blocked is launched again.

In the one picture-loss run that kept its clock (Year 4 geography, 28 September): the first search was launched at 17:08, the slide designer at 17:11, the loss was known at 17:13, and the redesign, second review, second search, reworked adaptation, reworked worksheet and slide repair ran until 17:45. Thirty of the run's ninety-five minutes came after the loss was discovered.

### The order proposed

1. The lesson is designed, with the pictures it wants listed.
2. The design is reviewed, and **the picture search runs at the same time**, on the list as the designer wrote it.
3. **A picture that cannot be found goes back to the lesson designer together with the review's findings**, while the lesson is still only a design. One revision covers both.
4. The picture list is frozen, with every picture on it already found or already replaced. The wording is edited.
5. **The slides and sheets are designed knowing exactly which pictures exist.** No designer builds around a picture that may not come.

### What it removes, by the counts in the 27 runs

| Today | Runs | After |
| --- | --- | --- |
| Lesson designer called back to redesign after the slides and sheets were built | 8 | The redesign happens once, before anything is built |
| A slide left with an empty half because an optional picture did not come | 3 | The slide designer knows it is not coming and never leaves room for it |
| The room measurement gone stale because a picture arrived late | 3 | Pictures are in place before the room is measured |
| Sheets handed back whole because their picture was missing | 2 | The sheet is designed for what exists |
| The slide designer's inputs changing while it worked | 1 | They are fixed before it starts |

### What already exists that this would reuse

- An early search on a provisional list is already done for the Below and Greater Depth sheets (the early adaptation picture wave), with its leftovers accounted for.
- The picture tools already keep a retired picture's record and accept a replacement under a new number (4.2.309).
- The search already takes its own snapshot of the list, so it does not depend on the list being frozen.

So this is a change to when the first search starts and to what the designers wait for, not new machinery.

### Costs and risks

1. **A wasted search.** If the review sends the design back and the redesign changes a picture, the search for the old one was wasted. Reviews asked for a redesign in about 4 of 27 runs, and only some of those changed pictures.
2. **A short wait.** If a second search is needed, the slides and sheets wait for it: a few minutes, against a rework that cost thirty in the run measured.
3. **The photo site's hourly limit.** A wasted search uses some of it.
4. **It changes the order a lesson is made in.** That needs a real run on Claude and on Codex before it is trusted.

### Unknowns

- How often an essential picture is still lost now that the hourly-limit fault is fixed. Most of the 8 losses predate that fix.
- Certificate failures on Codex's network are an outside fault: searching earlier finds out sooner, it does not find the picture.

### Separate, smaller, not part of this change

- **Reuse:** a picture found for one lesson is offered to the next lesson that asks for it (one engraving was searched for in three lessons).
- **Close up:** a slide whose optional picture is absent closes the gap by itself. With the order above the designer already knows, so this matters less.

### His decision

Whether the slides and sheets should wait until the pictures are settled. **His answer (3 October): no.** The designers are not held for pictures, which is also the playbook's standing rule ("never hold it for picture work").

What survives without any waiting: start the first search earlier, alongside the design review. The review, the helper check and the wording edit together take about as long as a search, so most pictures would already be found or lost when the designers start, and a loss known by then can still go back with the review's findings. Anything not settled by then is handled exactly as today. Steps 4 and 5 of "The order proposed" above are withdrawn. Not built; not yet agreed.

### His follow-up, and the evidence for it (3 October, late)

Daniel: "we can try it if you think theres less chance of reviewer taking out something that needed those pictures right? or even if it did it can sort it right?"

Two questions: how likely is it that an early search looks for a picture the review then makes unwanted, and does the lesson cope if it does. Both checked from the saved records, read-only. Scripts: `evaluations/trial-2026-10-03-arrangement/review-pictures.py` and `picture-head-start.py`.

**Does the review change the pictures?**

- 66 saved reviews: 55 approved first time, 11 asked for a redesign.
- The reviewer itself cannot change the picture list. It is recorded as protected before and after each review, and all 66 records show it untouched.
- Only a redesign can change it. In all 11 redesign records the picture list after matches the list before. (Honest limit: several of those 11 are trial folders that stopped at the review, so they prove little.)
- The six real redesigns, read one by one, were about: the final task repeating an earlier answer (three), the worksheet questions, the worked example, and too much on one board. None was about a picture.
- Separately, two runs changed the list between a first and second review: one picture added in one, one diagram swapped in the other. Neither left a found picture unwanted.

**Would an early search finish before anyone is ready to build?**

Three runs kept both a clock and a picture search.

| Run | Review start to slide designer start | First search took | Today, loss known | If started with the review |
| --- | --- | --- | --- | --- |
| History, Shaftesbury (22 Sept) | 17 min | under 2 min | 2 min after slides began | 15 min spare |
| History, Shaftesbury (later run) | 16 min | under 5 min | 5 min after slides began | 11 min spare |
| Maths lesson 3 | 14 min | about 4 min | 4 min after slides began | 10 min spare |

In the lessons without pictures the same gap was 6 to 13 minutes. So in every run measured, a search started with the review would have finished well before the slide designer was launched, with nobody waiting. Three runs is a small sample.

**Does the lesson cope if a searched picture becomes unwanted?**

Yes, with parts that already exist: a replaced picture takes a new number and the old one is kept on record as retired (4.2.309); unused early pictures are already accounted for in the Below and Greater Depth early search. The cost is one wasted search and a little of the photo site's hourly allowance.

### The order proposed (nobody waits)

1. The lesson is designed, with its picture list.
2. The review starts. **The first picture search starts at the same moment**, on a copy of the list as designed.
3. Review approves (about five times in six): the list is fixed exactly as now. Pictures already found are matched to it. Nothing is searched twice.
4. **A picture that could not be found is known before the slides and sheets start.** The lesson designer replaces it there and then, in the same round as any review findings. Only the replacement is searched for.
5. The review sends the lesson back and the redesign drops a picture (not seen in any saved run): the found picture is set aside on record, the new one is searched for.
6. The search is still running when the designers are ready: they start anyway, exactly as today.

### To check before building

- That the search tools accept a list copied before the review's freeze, and that the freeze afterwards matches found pictures to it instead of starting again.
- That the design check's rule "every frozen picture must still be used" is not tripped by an early search for a picture a redesign later drops.
- Both on Claude and on Codex: one real lesson with pictures on each, in the test copy, not released.

### Not part of this

Reuse of pictures across lessons, and slides closing up around a missing optional picture, stay as separate smaller items.

### Correction after the two checks (3 October, late): not built

Daniel said "y" to building the early search in the test copy. The two checks promised first were run before any change. They overturn part of what he was told, so nothing was built.

**What he was told that was wrong.** "The picture list was untouched every time" and "none of the redesigns was about a picture". The first measured only whether the reviewer itself touched the list during its own pass. The second read the reviewer's stated reason, not what the redesign then did.

**The better measure** (`evaluations/trial-2026-10-03-arrangement/picture-list-stability.py`): the review start records a fingerprint of the picture list, and the locked copy sits beside it. Of 38 saved runs with pictures, the list was identical in 29 and had changed in 9.

| What changed between the review starting and the list being locked | Runs |
| --- | --- |
| Pictures dropped (2 to 6 each, 17 in all) | 6 |
| Pictures added only (1 each) | 2 |
| Same pictures, wording changed | 1 |

So about one picture lesson in six drops pictures after the review starts, mostly because a redesign that slims the lesson takes slides, and their pictures, out.

**Check 1: can the search start from the list before it is locked? Not safely as things stand.**

- Before the lock, pictures must be numbered 1, 2, 3 with no gaps (`validate-lesson-design.py`, the initial numbering rule). A redesign that drops a picture renumbers every picture after it.
- A found picture is tied, word for word and number for number, to the entry it was searched from (`finalize-picture-assignment.py`, `receipt_matches_final_contract`). A renumbered picture's early find fails that check at the end of the run.
- This is the same fault as the Nativity run of 30 September, where a renumbering made one number mean two pictures and broke the slides, the sheets and the picture record.
- To make an early search safe, the numbers must be fixed from the moment the search starts. That reaches six tools: the list tool (an early copy and a step that sorts early finds into kept, dropped, search again), the search compiler and its checker (a new wave), the design check (numbering once a search has started), the end-of-run picture proof (more than one early wave, retired against unused), the run report check, plus the lesson order, the lesson designer's instructions and their tests.
- The alternative, locking the list before the review, needs no new tool but sends every one of those 9-in-38 runs down the after-lock revision route, which is where the Nativity, retired-picture and stale-list faults all came from.

**Check 2: does a dropped picture trip the "every picture must be used" rule? No.** That rule reads the design, not what was searched.

**What the gain would now be.** Of the six runs that lost an essential picture and kept their notes: the photo site's hourly limit was the cause or part of it in three (fixed in 4.2.309), no faithful picture existed in two, a certificate fault in one, no picture generation on the host in two. So perhaps half the losses remain, and no lesson with pictures has run since the fix.

**Position.** The change is larger and riskier than "a change to when the first search starts", its cost is now measured (one picture lesson in six searches for pictures it then drops), and its gain is unmeasured since the fix. Recommended: do not build it yet; read the essential-picture line in the next few picture lessons on 4.2.309; build only if losses are still common. The smaller item that needs no reordering (a slide closing up when an optional picture never comes, three runs, his mark "That would need fixing!") can go ahead by itself.

## Codex's static review of 4.2.309, checked against the code and the run records (3 October)

Daniel asked Codex to read the plugin for needless repairs and prevention gaps. It read instructions and code; it did not look at runs. Each claim below was checked here before being accepted.

| Codex claim | Checked | Seen in a saved run? | Verdict |
| --- | --- | --- | --- |
| The voice-edit checker treats the order of fields in a file as a change of structure, and can then restore the whole approved version | Reproduced: same data in a different field order compares as different (`check-voice-edit.py`, `flatten`) | No. 53 voice-edit records and all friction records searched | Real false alarm waiting to happen. Small mechanical fix. Add to Workstream 3 |
| The slide designer measures spare room on the candidate but names the final file, so the measurement is stamped with the wrong version or none | Confirmed in `slide-designer.md` ("Measure the room, then promote" passes `lesson.json`) | Not traced | Small hand-off fix. Add to Workstream 3 |
| The key-sentence checker compares words, ignores word order and drops "not" | Confirmed (`check-landed-sentence.py`, "not" is in its ignore list) | No failures recorded | Real weakness, low risk because the slide designer must copy approved wording exactly. Park |
| Reviewer corrections can break the design validator on a word limit, needing a repair of the repair | Not checked in code | No. That repair route does not appear in any friction record | Park until it shows up |
| Reviewer lets explanation stay in the notes; voice editor insists it goes on the board | The voice editor's rule is Daniel's own ruling (14 and 23 September: the board carries the teaching because notes go unread). The reviewer also tests each Teach board with the notes closed. The reviewer sentence Codex describes was not found | n/a | Do NOT adopt Codex's wording ("notes may supply fuller explanation without all of that being printed"). It would loosen a ruling he made, and the 27 September over-correction (takeaway-only boards) was undone the same evening. If the two agents differ, resolve towards his ruling |
| No check of meaning after the voice editor rewrites | Its checker's own notes admit a reversed meaning can pass | No reversal found, not searched for systematically | His call: it adds a checking step, and his standing boundary is one reviewer with everything downstream mechanical. Park |
| Some files refer to a final review that no longer runs | Partly: the playbook says there is no review of finished files; two other mentions found may mean the owner's own review | n/a | Tidy when touching those files |

What this changes: nothing in the order. None of these has caused a repair in the saved runs, while guessed heights and page room account for most of them. Two small mechanical fixes join Workstream 3. Codex's general principles (fix the machinery, not the standards; give the agent the fact where it decides; test "leave this alone" as hard as "catch this") match this plan, and the ten judged pairs are the start of that "leave alone" test set.

## Order suggested (revised)

1. A: the engine shares room by need for every item kind. Removes hair's-width refusals and guessed heights at the source.
2. Workstream 4: answers cannot drift from questions (small, protects the classroom).
3. Workstream 1 and B: real sizes for sheet designers, then the "will this fit" answer for slides.
4. Workstream 3: false alarms and stale baselines.
5. C and Workstream 5.

## Order suggested (first version, superseded)

1. Workstream 4 (small, protects what reaches the classroom).
2. Workstream 3 (small, removes repair launches that fix nothing).
3. Workstream 1 (the biggest saving; needs testing on both hosts).
4. Workstream 2 (needs Daniel's time; changes nothing until he has judged the pairs).
5. Workstream 5.

Each change tested on both Claude and Codex before release, one at a time.

## Not verified

- The orchestrator's claims that its final report failed eight checks, that the review verifier wanted a different path, and its own ordering mistakes.
- Whether the page check truly stops at the first level, read from behaviour (only Expected was reported at 13:30; Greater Depth appeared at 13:53), not proven from the code.
- The near-miss sample is 10 refusals. Most runs did not keep the numbers.
- Whether a "draw it anyway" mode is simple for every kind of refusal.

## Separate, needs him before Monday

The delivered answer sheet for Lesson 21 (Autumn 1, Week 5, Maths, Monday) says 35 pencils for question 4. It should be 44. Not corrected: he asked for no changes.

## His ruling on printed number lines, and the guidance change (3 October, evening)

After the Lesson 21 sheets were remade with a number line under every Expected calculation, Daniel: "this is the kind of lesson where I teach the concept of the numberline and working backwards, but only below would need them on the sheet, they can draw them. I would want below with the visual and everyone else just strips."

**This corrects my reading of his earlier line** ("The slides taught numberline right? so that should be what's on sheets"). He meant the sheet practises the taught method, not that the drawing is printed for everyone.

**Where the run went wrong, traced.** The lesson designer gave every Expected calculation the response "mark on a printed visual" with a printed empty number line, and protected all of them. The adaptation designer kept the printed line for Greater Depth and gave Below "Expected unchanged". The worksheet designer then had to mark the sheets for the printed page, because its guide forbids changing what a question asks in order to earn books.

**Why.** Two pieces of guidance pulled apart:
- `subject-maths.md` said "the representation the lesson taught in is on the sheet", read as "print it".
- `books-or-sheet.md` already says a Year 3 to 4 child draws a simple number line in their book, but only the worksheet designer reads it, after the content is settled.

**How common.** Of 13 saved Expected maths sheets, 8 were marked for the printed page. Three of those printed a taught method's own support (this lesson twice, and the addition lesson before it); in lesson 19 the designer judged the same kind of frame "copied in seconds" and used books. So the same question was being answered differently from run to run (`evaluations/trial-2026-10-03-arrangement/printed-draw-your-own-census.py`).

**Changed (main working tree, uncommitted, not installed):**
- `references/subject-maths.md`, under "The worksheet's sections in maths": two paragraphs. The board's form is the method the child works in and is printed only for the child who needs it; Expected and Greater Depth answer the calculation and draw their own, so their sheets come out as slips; the printed representation is Below's support, so "Use Expected unchanged" does not fit Below there; the age table in `books-or-sheet.md` stays the one owner of what a child can draw; anything a child could not reproduce is still printed for every level.
- `scripts/tests/worksheets_ledger_pins.json`: the two paragraphs added to that section's pinned record. Nothing else in it changed.
- `scripts/tests/test_worksheets_ledger_is_kept.py`: one test holding his ruling and its boundary.
- All checks: 4,826 passed, 0 failed.

**Not done:** no lesson designer or adaptation designer has been run against the new wording, so whether they take it up is unproven. Scope is maths only, which is my reading of "this kind of lesson".

**Resource.** Lesson 21 remade a second time: Below keeps the frames with a number line under each; Expected and Greater Depth are slips for books. On the drive (Week 5, Maths, Monday).
