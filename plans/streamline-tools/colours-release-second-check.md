# The colours release (topic 7's 7C): the second independent check

Checked 25 September 2026, after the builder's repairs, against the side branch
`streamline/7c-colours` in `lessonv4-colours` (uncommitted, on `2db3ceba`). I
changed nothing in either copy except writing this file. Everything I built, ran
or attacked is in `plans/streamline-tools/scratch/colchk2/`. On the two real copies
I used only read-only git commands, with optional locks off, and I hashed both
plugin folders before and after my runs: the worktree's is unchanged; in the main
checkout one file, `worksheet-html/scripts/build-worksheet.js`, changed at 17:42
while I worked, which is the worksheets release still being built there, not me (I
ran nothing in that copy).

## What I did

- Read his words (decision 11, decision 22's colour half, the two follow-ups, "A
  worked example that shows a mistake", the change plan's question 1 and 7C
  section), "What the rounds have taught", the first check, the report, the whole
  diff and the build-log entry.
- Ran 34 chosen slides through the branch's slide check, the roles on and off
  (`probe_roles.js`, `probe-roles.txt`), and built and rendered two probe decks
  that put the new roles into every helper that could carry them (`probe-deck/`,
  `probe-deck2/`, `decks/probe*/after-png/`).
- Built every `lesson.json` under the main checkout (90 files; 8 over 25 MB
  skipped) with a `git archive` of `2db3ceba` and with the branch, and compared every
  slide's XML with the two plugin paths made equal (`scan_decks.sh`,
  `scan_compare.py`, `scan-compare.txt`).
- Built three saved walls the first check did not (the 10 and 100 more table, the
  rounding worked example, the continuity and change overview) and three probe walls
  that use colour marks, before and after; rendered them and looked at every page
  side by side (`build_all.sh`, `walls/`, `look/`). Looked at every one of the
  builder's renders. Counted the saved worksheets that use a method frame (61
  sheets, none).
- Counted the prepared examples in the 90 saved lesson designs by the kind of unit
  that holds them (`saved-designs.txt`).
- Copied the whole plugin folder from the worktree (all but `node_modules`) into
  `pinatk/` with the main checkout's `plans/*.md` beside it. On the untouched copy
  the six pin tests pass (78 passed, none skipped, so the ledger check runs) and so
  do the builder, sheet and wall suites. Then made 27 single edits of my own, one at
  a time, running the pins and the relevant suite after each (`attack.py`,
  `attack-log.txt`), and replayed the builder's 35 mutations there (`k13-replay.txt`).
  The copy was byte for byte the same afterwards.
- Ran every suite from the worktree's plugin folder (a scratch venv with a
  `python3.exe` first on PATH for pytest only).
- Replayed `k1` to `k8`, `build_colours_mapping.py` and `k9` on a fresh export of
  `2db3ceba` with the two ledgers beside it (`replay/`).
- Trial-merged the branch with the main checkout's uncommitted worksheets release in
  a scratch git repository (`trial_merge.py`, `merge/repo`), resolved the one
  conflict and ran every suite on the merged tree.
- Measured sizes with line endings normalised (`sizes.py`) and checked every dash on
  an added line.

## Findings, most serious first

### 1. `worked-purple` cannot reach a Teach slide or a step list, where most prepared examples live, and the instructions send the designer there

- **Where prepared examples are.** In the 90 saved lesson designs, 27 units carry
  `modellingState: "Prepared example"`; 24 are Teach units. Of the 17 whose answer is
  `delivery: "visible-in-unit"`, 16 are Teach units and one is a My Turn.
- **What the slide designer is now told.** `agents/slide-designer.md`:
  "`delivery: visible-in-unit` → ... render the prepared model as a worked example,
  in purple (`colorRole: "worked-purple"` on its text lines)". The same file: "**A
  Teach unit's slide is a `teach-layout`.** ... The check refuses a Teach unit built
  from free zones". The profile: "A worked example takes the same purple, whatever
  carries it."
- **What the builder does.** A teach layout refuses the role. My probe deck, one
  teach-layout slide with its worked lines marked, stopped with: "TEACH_LAYOUT_INVALID:
  slide 2 (teach-layout) "four-cards" lines[0]: colorRole cannot be set on a
  teach-layout line; the layout sets size, alignment and colour so every slide stays
  centred and even." The slide check expands teach layouts first, so a designer who
  follows the instruction meets a refusal, spends a repair pass, takes the role off,
  and the model is black after all.
- **A step list takes the role and ignores it.** Three `steps` items marked
  `worked-purple` passed the validator and printed black beside green number
  badges, with no word (`decks/probe2/after-png`, page 1).
- No test tries either; the new tests cover a text line, the method frame and the
  chart row.

This is the rounds' "check the mechanism exists before writing the promise": the
promise is written in the profile, R05, the output template, the slide designer, the
playbook and the catalogue, and the commonest case cannot be built. Before release:
ask him whether a Teach slide's prepared model is purple (it is often a sentence,
such as "I can see books with Elizabeth. That suggests the painter wanted..."). If
yes, let a teach-layout line take `worked-purple` and no other role, with a test and
the refusal message changed; if no, say so in R05 and its copies. Either way make
`steps` draw the role or refuse it.

### 2. A worked row's changed digit still prints answer green, so a mistaken chain shows its wrong digit green

- His answer was about exactly this case: told he had greened a mistaken chain on 19
  September, "yes, purple is fine". The ledger reason he said yes to: "A wrong example
  printed green tells a child it is right."
- My probe slide (`decks/probe/after-png`, page 3): Sam's "10 more" row, `3,562`,
  marked `"worked": true` with `"highlight": ["H"]`. The 3, 6 and 2 print purple; the
  wrong 5, the one digit the lesson is about, prints green in a green ring. The
  builder's own demo (`compare-slides.png`, third row) shows the same.
- The code: `fill: (picked || revealed) ? pal.ring : worked ? pal.worked : pal.text`.
- The profile says the opposite: "A worked example is purple even when the lesson is
  about to show it is wrong ... It is never answer green." The catalogue says "a ring
  on a worked row keeps its own meaning", and the test pins the green
  (`['#7030A0', '#00B050', '#7030A0', '#7030A0']`); my attack D06 (the ringed digit
  purple in a worked row) is refused by that test.

Before release: put the rendered slide to him. My suggestion: in a worked row the
ringed digit takes the purple; whether the ring stays green or goes purple is his
call.

### 3. The wall's section prints every part's result on answer green, a mistake included, and uses the fact-and-worked purple for "part three"

- `render-section.js`: `const RESULT_GREEN = "00B050";` for every part's result. My
  third probe wall (`look/demo3-01.png`) has a part headed "Sam's mistake" whose
  result "Sam wrote 340" sits on a green strip; before, it was the part's amber.
- On the board the same worked result is purple (a worked row, a `worked-purple`
  line), and on the wall's own worked-example card it is purple: one worked result,
  two colours in one room, which is what decision 22 was for.
- `PART_THEMES` gives the third part `{ strip: "7030A0", ... }`, the sticky and
  worked-example purple, where it only tells parts apart.
- The report rightly says the wall mapping is derived and goes to him; neither of
  these is in the pictures he has. Add `demo3` to what he sees.

### 4. `task-blue` passes a statement, and a statement marked `task-blue` now satisfies the turn check

The check refuses what it says it does: an `||` or `{{ }}` answer, a line opening with
the sparkle, several instructions on one line. But from `probe-roles.txt`:

- **Passes marked `task-blue`:** `Round numbers are easier.`; `Enamel cannot grow
  back.` (a sticky fact without its sparkle); `346 rounds to 350.` and `Answer:
  4,000.`; `Change: the tools were different.`; and a line that tells then asks, `A
  kettle and a lamp are both appliances. What is electricity doing in each one?`,
  which the profile forbids ("Never colour a whole mixed block blue") and the check
  refuses in `focus-blue` (MIXED_BLOCK_WHOLE_BLUE reads only `focus-blue` and a hex).
- **A statement becomes the turn.** A My Turn slide holding only `A digit's place tells
  us its value.` is refused (TURN_SLIDE_WITHOUT_ITS_TURN); the same line marked
  `task-blue` passes every check. `carriesItsTurn` now reads `node.colorRole ===
  'focus-blue' || node.colorRole === 'task-blue'`. The verb test already counts a
  black imperative as the turn, so the role adds a turn only for lines that do not
  open with a task verb: statements, and `Say why.`. The old message warned the
  designer off exactly this ("do not reach for house blue to satisfy this line"); the
  role is now that reach. Attack D01 (the role taken out of the turn) passed every
  test: the one test for it uses `Write the value of each digit.`, which the verb test
  counts anyway.
- **A blue run.** Five advice lines, one per node, each marked (`Look at the picture.`,
  `Read the question carefully.`, `Use the word bank.`, `Write one sentence.`, `Check
  your answer.`), pass; the same five on one line are refused. The first check's
  suggestion (one short task per question) was neither taken nor answered.
- Smaller: `Name a job, e.g. a chimney sweep.` is refused as two instructions (it
  splits at "e.g."); a taught word written `{{word}}` is refused as "it carries an
  answer"; a question after its task (`Explain your answer. Is Isla correct?`) passes
  though the message says the task comes "after its question".
- The log says the check refuses a `task-blue` line "that carries an answer"; it
  refuses the answer marks, not an answer in words.

Before release: count `task-blue` as the turn only when the line asks or opens with a
task verb (and widen the verb list with the saved decks' own misses: say, justify,
put, take, place, suggest, imagine, ask, plan, improve); refuse a `task-blue` line in
which a statement comes before the question, as MIXED_BLOCK does for `focus-blue`; and
tell him plainly that a statement or advice marked `task-blue` passes.

### 5. The line between the job and advice leaves the commonest real shape open, and the release's own anchor line is claimed black where the profile makes it blue

- The saved decks' commonest task shape is the job with its how in one sentence:
  `Explain your answer using the photograph.`, `Describe each tooth using the
  pictures.`, `Compare play using A and B.`, `Find a detail in Source A.`; and set-up
  steps such as `Look at the tropical rainforest regions.` or `Choose an example
  you're comfortable sharing.`
- At 4.2.289 the profile named two of these black: "`Explain your answer using the
  photograph.`, `Point to the details that support your comparison.` and `Choose the
  same part of classroom life in both photographs.` are all black." The release took
  both out of the examples. The new test is "each tells a child how to do the job,
  and is not the job", with `Explain your answer.` as the job. On those words
  `Explain your answer using the photograph.` is the job, and blue.
- The log's story says the reverse: "a longer instruction about how to go about it
  stays black, so the history deck's two lines above are still black", and a test
  comment in `slide-design-check.test.js` calls the line "advice on how to go about
  the job". A designer cannot get from the profile to the log. That line is one of
  the nine blue lines he objected to on 3 September.
- "Short" has no guard. The line he said yes to was "A short task is the child's job
  in a few words"; the profile now says "no count of words decides it", and a long
  one-sentence job marked `task-blue` passes (`Explain why, using the word bank and
  the shaded map to help you.`).

Before release: put the mixed shape to him with these saved lines, write his answer
into the profile as one example each way, and keep "in a few words" as the guide he
agreed to.

### 6. Purple reaches less than the words say, the frame is purple even when blank, and the scope was not put to him

- Purple reaches: a text line, a list item, a question card and a maths-turn line
  carrying the role; the method frame on board and sheet; a place-value row; the
  wall's worked-example card and the stem's modelled line.
- It does not reach: a Teach slide's model and a step list (finding 1); a table's
  worked rows ("in a table it stays the table's black"); a My Turn tally ("a My Turn
  models its frequencies in plain black"); a number line or bar model; the launch
  pair's good instance; the wall section's results (finding 3); and on paper a
  worksheet's `firstRowWorked` ("one complete worked example of the thing being
  generated", printed in ink) and a filled Venn.
- The method frame is purple when it is all blanks. On a sheet it nearly always is:
  `compare-sheet.png` shows two frames of empty boxes, the child's own working,
  framed in the worked-example colour.
- The profile says "whatever carries it", then lists exceptions. The first check
  asked for the scope question to go to him with "no saved deck or sheet has a framed
  worked example" in front of him; the ledger records only his answer on the mistaken
  chain. The builder read "worked example purple too" as covering prepared examples
  (R05, which decision 11 names) and not the rest: defensible, but a reading.

Before release: reword the profile's bullet to say where purple is and is not, and
put the list, with the blank frame on paper, to him as one question.

### 7. The old rule, or a claim that no longer holds, is still in five places

- `worksheet-html/src/helpers/frames.js` L329, "keeps the page to four colour
  meanings instead of five", and L947, "the reason the sheet still has four colour
  meanings rather than five". False since the frame's purple; the bar is on tokens.js's
  wording ("four meanings instead of five"), so these pass.
- `slide-speech-and-characters.md` (R72, "kept on purpose"): "a separate task line in
  question blue outside the bubble". It names no role: `Explain how you know.` in
  `focus-blue` or a blue hex is refused by BLUE_WITHOUT_A_QUESTION; only `task-blue`
  passes.
- The profile's Paragraph rhythm: "A statement followed by the question or
  instruction it sets up splits there, and a question takes its blue per Semantic
  colour". Unpinned: my attack W09 added "while every instruction stays black" and
  nothing failed.
- `teach-layouts.js`'s refusal: "the layout sets size, alignment and colour"
  (finding 1).
- The card contracts' new "Colour marks carry over" names four places (a worked
  example's steps, a stem, a table cell, a section's notes and steps). Everywhere else
  on the wall a `{{word}}` prints with its braces and nothing refuses it: I rendered a
  sticky card and a misconception with `The {{enamel}} ...` (both print the braces) and
  a section result "346 rounds to the {{nearest}} ten: 350" (the braces print on the
  green strip, `look/demo-01.png`). On the board a taught word in a sticky line is
  green, so "taught words green on the wall" holds in four places only.

### 8. The pins and tests after the repairs

The builder's own 35 mutations, replayed on the untouched full copy, are all caught.
Of my 27 attacks, 12 were caught and 15 got through (`attack-log.txt`):

- **The three refusal messages' guidance (M01 to M03).** Deleting what the turn, blue
  and `task-blue` messages tell the designer (what the role is for, what stays black,
  what is not blue) fails nothing; only each message's first fragment is pinned, and
  these messages are what a designer repairs from.
- **The check's own role logic.** D01, the role out of the turn; D02, a `{{ }}`
  allowed on a `task-blue` line; D03, a starter of `task-blue` lines no longer seen as
  blue.
- **D04.** The method frame's pale ground turned pale green under its purple edge
  (the test finds the panel by the same constant, so it follows the change).
- **D05.** A worked row printing purple on the photocopied stick-in pack.
- **D08 to D10.** A section step printing its braces again; a table cell and a stem
  measured with their braces (the change that let my probe stem fit where it did not
  at 4.2.289).
- **D11 and D12.** A fourth section part green again; the photo map's caption blue and
  its ground pale blue again.
- **W04.** The contracts' list of where marks carry over losing "a reference-table
  cell".
- **W09.** Finding 7's Paragraph rhythm line.

Caught: the catalogue's `task-blue` limits cut; the header cue's reason cut; the slide
designer's `worked-purple` softened; a paraphrase of the old rule, the retired count
and the Y70 idea in new words (each caught because I placed it inside a pinned
paragraph; the same words anywhere else would pass); R05's "never answer green"
dropped; the starter header's cue blue; the ringed digit purple; the taught chip's
anchors; the sheet frame's title; the section result strip.

### 9. Claims in the report and log the files do not bear out

- The report's overlap with the worksheets release names `preferences.md`,
  `worksheet-helpers/maths.md`, the build log and the success-criteria pins. Both
  releases also change `references/output-template.md` (it merged cleanly) and the two
  plan tools (the same but for line endings).
- The profile's "whatever carries it" (finding 6); the log's "still black" for the
  history line (finding 5); the log's "carries an answer" (finding 4).
- The log's "A marked short task counts as the turn": any marked line does
  (finding 4).

## The first check's findings, one by one

1. **The word count refused jobs and passed advice and statements: done
   differently.** Old: `SHORT_TASK_MAX_WORDS = 5` in `builder/src/task-wording.js`,
   verb first. New: the file is gone; the designer marks `colorRole: "task-blue"` and
   the profile says "no count of words decides it". Every job line the first check
   named passes when marked, and every advice line, statement and label is refused
   when painted blue without the role. Sound as a mechanism, with the holes in
   findings 4 and 5.
2. **The header cue turned blue for how-to cues: done.** `headers.js` is untouched
   (the cue is `COLOURS.body` on both headers) and the profile now says "The cue is
   drawn black. It tells a child how to go about the task, and advice stays black; the
   job it helps with is in the body, in blue." Pinned; my W02 and D07 were caught.
3. **Worked examples purple reached nothing he has, and R05 was unpinned: done
   differently.** Old R05: "Prepared examples and `visible-in-unit` models are teaching
   content and stay black, even when they are complete." New: "... are worked
   examples, finished before the class sees them, so they are purple, the same colour
   as a sticky fact, never answer green." R05 is a pinned row (W08 caught). But the
   scope was not put to him, and the role cannot reach the Teach slides where 16 of 17
   saved models sit (findings 1 and 6).
4. **The demo's `{{down}}`/`{{up}}`, and bold shows nothing: done.** The demo table
   now prints "down" and "up" black; the catalogue says bold "shows nothing" in a first
   column or a callout; the deciding word's orange mark is listed for him.
5. **The old rule in six places: mostly done.** B41 now "never blue on its own,
   because blue belongs to the child's job as a whole line, a question or a short
   task"; B61 "blue stays with the child's job as a whole line, the question or the
   short task"; both pinned. The chart comment now "In the same edit he greened a
   worked chain that was wrong; his later answer changed that"; `answer-text.js` now
   "[[x]] bold + focus blue: the part of a line that asks, a question"; tokens.js and
   methods.js no longer count four meanings. Not done: frames.js's two "four colour
   meanings" comments (finding 7). The labelled diagram's "answer-green" (L186) is
   left and named for him.
6. **Claims: done.** The frame line now reads "on the frame's edge and its title,
   which is words a child reads"; the log's size is right (706,493); the statement
   claim now says "every other blue line", true for unmarked lines.
7. **Smaller things: done.** Contrast is named for him; the sticky panel fill and the
   stem's bullet are pinned as values and tested (mutations 13 and 14 caught); the
   catalogue's frame `title` line is pinned.

## Sound

- Every suite passes from the worktree's plugin folder: python 2,213 passed, 2
  skipped (one is the colours pin test's ledger check, which runs where the ledgers
  sit beside the plugin); builder 754; worksheet-html 724; working-wall-html 150;
  stick-in-sheets-html 70. The runs wrote nothing.
- The six pin tests pass on the untouched full copy with the ledgers beside it (78
  passed, no skip), and the builder's 35 mutations are all caught there.
- The replay of `k1` to `k8`, `build_colours_mapping.py` and `k9` on a fresh `2db3ceba`
  export reproduces all 958 plugin files and the mapping exactly.
- 72 of the 90 `lesson.json` files under the main checkout (saved decks, and test decks
  kept in saved folders) build on both sides, and every slide's XML is identical once
  the two plugin paths are made equal; 10 fail at both versions with the same message;
  8 were too large to copy. The builder's census files before and after are identical.
- Three more saved walls rebuild with only their colours changed, the same page count
  and nothing moved; my stem and table probes print taught words green without braces
  and the modelled line purple.
- None of the 61 saved worksheets uses a method frame, so no saved sheet changes.
- The header cue stays black on both headers, and the profile says so.
- The callout's black default and blue for a question, a legacy `green` falling back
  to black; a taught chip green without braces; the method frame purple on board and
  paper, its labels ink on paper.
- Sizes, line endings normalised, as reported: instructions 906,862 to 911,977
  (+5,115, file by file as listed), programs 299,826 to 307,888 (+8,062), tests and
  pins 562,173 to 760,767, log 699,322 to 706,493.
- No em or en dash added: every dash on an added line sat on the line it replaced
  (three are "green" changed to "purple" beside an existing dash); the new files'
  dashes are quotations in the pins and the mapping.
- The preferences fold keeps his words and names each part the profile owns, the
  starter's exception included; the peer line gained "answer status".
- The trial merge with the worksheets release (its files as they stood at 18:04)
  conflicts in one file, the build log, where both append an entry. Taking both,
  worksheets first, every suite passes on the merged tree: python 2,238 passed, 1
  skipped (the ledger check runs there); builder 754; worksheet-html 765;
  working-wall-html 150; stick-in-sheets-html 70. `preferences.md`,
  `output-template.md`, `worksheet-helpers/maths.md` and the success-criteria pins
  merge cleanly, so `k8` need not be rerun.

## What I would fix before release

1. Make `worked-purple` buildable where prepared examples are: ask him about a Teach
   slide's model, then let a teach-layout line take the role (or say in R05 and its
   copies that it stays black); make `steps` draw the role or refuse it; test both.
2. Show him the mistaken chain (probe page 3) and the section wall (`demo3`); in a
   worked row draw the ringed digit purple unless he says otherwise; decide the
   section result's colour and the third part's purple with him.
3. Close the `task-blue` holes: the role alone never makes the turn; a statement
   before the question is refused as in `focus-blue`; widen the verb list; say plainly
   what a marked statement does.
4. Put the job-with-its-how shape to him with the saved lines, write his answer into
   the profile with "in a few words", and make the log's story and the test comment
   match it.
5. Reword the profile's "whatever carries it" to where purple is and is not, and put
   that list, with the blank frame on paper, to him as one scope question.
6. Fix frames.js's two comments, name `task-blue` in R72, pin the Paragraph rhythm
   paragraph, and either draw marks in the wall's other text fields or refuse a mark
   there.
7. Pin or test what my attacks got through (finding 8), above all the three refusal
   messages' guidance, the role's turn, and the method frame's pale ground.
8. Add `output-template.md` to the report's overlap list, and correct the log's
   "carries an answer" and "counts as the turn" lines.
