# The colours release (topic 7's 7C): the first independent check

Checked 25 September 2026 against the side branch `streamline/7c-colours` in
`lessonv4-colours` (uncommitted, on `2db3ceba`, 4.2.289). Nothing in either
checkout was changed; everything I ran or built is in
`plans/streamline-tools/scratch/colchk1/`.

## What I did

- Read his words (ledger decisions 11 and 22, his two sets of answers of 24
  September, the change plan's 7C section and question 1), the release report,
  the whole diff, the build-log entry and the streamline plan's "What the rounds
  have taught".
- Ran every sentence a child reads in the 78 saved decks under the main checkout
  (outside `node_modules` and scratch) through the release's short-task test
  (`task_census.js`, `task-census.json`), and ran chosen lines through the slide
  check at 4.2.289 and on the branch side by side (`probe_blue.js`).
- Grepped for the old rule by concept, not only its retired phrases, across
  instructions, routes, the catalogue, the programs, shared drawings, the sheet
  and wall engines and the tests.
- Built three saved decks (the 5 September history trial, the Victorian working
  conditions deck, the tooth decay deck), five saved walls, one saved worksheet
  and the release's own method-frame sheet with a `git archive` of `2db3ceba`
  and with the branch, rendered both, compared every page by pixel and every
  slide by its XML (`build_decks.sh`, `build_walls.sh`, `build_sheet.sh`,
  `diff_pages.py`, `walls-compare.png`). Looked at every one of the builder's
  renders.
- Copied the whole plugin folder (everything but `node_modules`) into
  `pinatk/`, with the main checkout's `plans/*.md` beside it, ran all six pin
  tests and the builder, wall and sheet suites on the untouched copy (all pass,
  and the ledger-own test runs rather than skips), then made 28 single edits one
  at a time and ran the pins and the relevant suite after each
  (`attack_pins.py`, `attack-log.txt`).
- Ran every suite from the branch's plugin folder (scratch venv with a
  `python3.exe` first on PATH for pytest only).
- Replayed `k1` to `k9` and `build_colours_mapping.py` on a fresh export of
  `2db3ceba` with the two ledgers beside it (`replay/`), measured sizes with line
  endings normalised (`sizes.py`), and counted dashes in every added line.

## Findings, most serious first

### 1. "Five words or fewer" is a word count, not his line, and it both refuses short tasks and lets how-to instructions and some statements through

His words: "a short task as in like explain why or something like that", and
the question 1 he said yes to: "A short task is the child's job in a few words; a
longer instruction about how to go about it is not." That is two tests: is it the
job, and is it short. The check measures only the second (`SHORT_TASK_MAX_WORDS
= 5` in `builder/src/task-wording.js`, verb first from the old `TASK_OPENERS`
list). Run against his saved decks and against the old check:

- **Refused in blue, though each is the child's whole job in a few words.** `Round
  346 to the nearest 10.` (six words; the saved decks hold 41 different lines of
  exactly this shape), `Explain what happens to the digits.`, `Write the greater
  number in each pair.`, `Name a job a Victorian child did.`, `Explain why your
  example matters to you.` And any verb the list does not hold, at any length:
  `Say why.` (saved), `Justify your answer.`, `Put these in order.`. Meanwhile
  `Round to the nearest 10.` passes, so on a maths deck the same kind of line is
  blue on one slide and must be black on the next. The playbook calls that
  exactly the fault colour exists to avoid: "a deck where the question is house
  blue on slide 9 and body black on slide 8 has spent the colour and lost the
  meaning".
- **Passed in blue that 4.2.289 refused, though each is a how-to instruction he
  wants black.** Saved lines `Use the shaded map.`, `Read the question
  carefully.`, `Look at the picture.`, `Check the direction.`, `Use made-up
  names.`. And a whole blue block of them: `Look at the picture. Read the question
  carefully. Use the word bank. Write one sentence. Check your answer.` passes,
  because `isShortTaskLine` only asks that every sentence be short. That is the
  all-blue board of 3 September arriving in five-word pieces. A how-to line before
  a question in one blue block (`Use the shaded map. Which continents have
  tropical-rainforest areas?`) also passes now; the release's own census counts it
  among the "refusals that stop".
- **Passed in blue though they are statements.** A statement that opens with a word
  on the verb list: `Round numbers are easier.`, `Point A is higher.`, `Answer:
  4,000.`, and the saved Teach line `Change: the tools were different.` (the
  continuity and change deck, slides 7 to 9). All were refused at
  4.2.289. The log and the report both say the check "still refuses a
  statement or a longer instruction in blue"; for these it does not.

The report is honest that five is "a number chosen at the build" and "his to
move", but moving the number cannot fix this: any count lets short how-to lines
through and refuses longer jobs. What he has not been shown is the two lists
above. Before release I would put them to him, and at least: refuse a blue run of
more than one short task unless it follows its question (one job per question);
not count the numbers in a task as words (or count clauses, not words); and read
a verb followed by a colon (`Answer:`, `Change:`) as a label, not a task.

### 2. The header cue turns blue for exactly the how-to cues, stays black for a question, and no instruction says so

`builder/src/headers.js` now draws the small top-right cue house blue when it
passes the short-task test. The profile defines that cue as "a short secondary
cue that helps use the main body, such as: `Use the word bank`; `Look at both
circuits`; `Use the table`", which is how to go about the task, the thing he wants
black; all three now draw blue, as do `Answer in your books` and `Show me on
whiteboards`. A cue that is a question (`What caused this?`, `Where is 0.7 on this
line?`, both in saved decks) stays black, the reverse of "blue means question".

On the three saved decks I rebuilt, this is the only thing on any slide that
changes: slide 12 of the 5 September history trial now shows `Look at both
photographs` in blue in the corner while its job, `Choose one, and say what makes
you sure.`, stays black below (`decks/history-trial/history-trial-changed.png`).
The release's census found "1 of 63" cues turning blue (`Explain.`) because it
read three folders; the history trial and completion decks outside them add `Look
at both photographs` and `Use the table`.

The plan listed the header among the things question 1 settles; the report calls
the test "derived". Nothing in the profile, the playbook or the catalogue tells
the slide designer the cue changes colour, so a designer cannot choose it. I
would leave the cue black (it is a secondary cue by definition) or ask him,
before release.

### 3. "Worked examples purple" reaches none of his saved boards or sheets, and the row that holds the limit is not in the release

The release makes purple only a worked example "with a panel of its own": the
`method-frame` and the wall's worked-example card. No saved deck of the 78 uses a
`method-frame` or a `callout`, and no saved sheet uses the sheet's
`method-frame`. So on his boards and sheets "worked example purple too" changes
nothing; his My Turn worked examples stay black because preferences still says
"Prepared examples and `visible-in-unit` models are teaching content and stay
black, even when they are complete." The report rightly asks "whether he meant
every worked example", but without that number he cannot see that the answer as
built is invisible outside the wall.

That sentence is ledger row PF-R05, which decision 11 names itself ("R02, R05,
R16, and the catalogue's rows"). R05 is not among the release's 31 rows, not in
the mapping and not pinned, though the profile's new purple bullet now points at
it as the limit ("A prepared example written into the teaching as ordinary text
stays black (`preferences.md` → Slide Designer presentation rules)"). Attack A01
deleted that sentence from preferences and every pin test and the doc-claims
test still passed.

Fix before release: ask him the scope question with the zero in front of him, and
pin R05 whole as a row kept on purpose (as Y74 and R72 are).

### 4. The pictures he will judge by show two colour languages, and the bold that replaced blue shows nothing

- The wall demo (`colours-renders/wall/demo-section.json`) writes the "Which way to
  round" table's `down` and `up` as `{{down}}` and `{{up}}`, so they print green,
  while the board demo draws the same table's words black in bold
  (`demo/lesson.json`: `"**down**"`). `down` and `up` are not taught words; the
  card contracts say `{{word}}` means one. The page meant to show "the wall uses
  the board's colours" shows him the same table in two colours on the two
  surfaces. Change the demo before he sees it.
- `The **tens** column changes.` in a callout: the callout's text is always bold
  (`callout.js` draws it `bold: true`), so "tens" looks like its neighbours
  (`compare-slides.png`, third row). The same is true of a deciding word in a
  table's first column, which is always bold. The report says so; the catalogue
  still promises the purpose ("so a child's eye lands on it"). He should know the
  deciding word now carries no emphasis in those places. Note also that the
  skill-based route (`teaching-sequence-skill-based.md` L170) gives the deciding
  word the orange `<<...>>` mark, and the catalogue now says `**bold**`; it said
  `[[ ]]` before, so the two disagreed already, but this was the moment to make
  them agree, and that is his call.

### 5. The old rule still lives in six places, two of them unpinned instructions

- `teacher-slide-visual-profile.md` L39 (ledger PF-B41): `core-action` "renders
  bold in the line's own colour, never blue, because blue belongs to questions".
  `slide-composition-playbook.md` L106 (PF-B61): "exposing a verb never turns an
  instruction blue; blue stays the question's." Both are copies of R02 and still
  give the old reason. Neither is in the release or pinned: attack A06 reversed
  the profile's line and nothing failed.
- `shared/visuals/place-value-chart-svg.js` L803-805 keeps the retired Y70 rule:
  "Correctness is not the test: in the same edit he greened a worked chain that
  was wrong, because green marks what the number IS, not whether it is right."
  The pin that bars "Correctness is not the test." everywhere misses it only
  because this copy has a colon. The comment also records something he should
  hear: the green on a wrong chain came from his own hand edit of 19 September,
  which this release reverses on his later word.
- `builder/src/answer-text.js` L25-26: `[[x]]` is "the one word a reader must
  decide on (a branch/reference table's deciding word ...)", the retired Y68
  rule.
- `worksheet-html/src/tokens.js` L29 ("it keeps the system to four meanings
  instead of five") and `worksheet-html/src/helpers/methods.js` L504 ("a fifth
  colour the system does not have"), beside the release's own new fifth colour.
- `working-wall-visual-language.md` L186: the labelled diagram's parts are "named
  in answer-green", but the renderer draws them black, before and after (the
  digestive system wall in `compare-real-walls.png`). Older than this release,
  but those labels are the lesson's taught words, and the release is the one that
  says the wall's taught words are green.

### 6. Claims in the log and report that the files do not bear out

- "a fifth colour on paper, never on the words a child reads or writes" (log and
  `tokens.js`): the frame's title, `Adjusting strategy`, is words a child reads,
  and it prints purple (`compare-sheet.png`).
- "still refuses a statement or a longer instruction in blue": see finding 1.
- "1 of 63 saved header cues turns blue": true in the three folders read; see
  finding 2.
- The log's size: the report says 699,322 to 705,511; the file is 705,561 (+6,239,
  not +6,189). Every other figure matches.

### 7. Smaller things he should see

- Contrast. White on the answer green `00B050` is 2.87 to 1. It is now the
  vocabulary card's title (the taught word itself, which was white on teal, 3.74)
  and every section's answer strip (part one was white on navy, 8.66). Green chip
  words on the default pale-blue word bank are about 2.3 to 1. All read in the
  renders; worth one printed wall before release, as the wall is read from a
  desk.
- The wall's worked-example card holds the lesson's success-criteria steps, which
  are green on the board; on the wall they are now on purple. It follows the
  plan's mapping; he may want to see it named.
- On paper a bank titled "Word bank" still prints every chip green (`because`
  included), where the board now greens only marked taught words; the sheet's
  bank would also print `{{ }}` braces if a designer copied board chips (none
  does today). The ledger left paper word banks to topic 9.
- Three more attacks passed every suite. B09: the sticky card's panel fill back
  to pale blue (`"stickyPanelFill": "DEEAF1"`), so a purple title over a blue
  panel; the pin test checks only the title bar and bans only the old teal, navy
  and amber, and the wall tests do not look at the panel. B08: the sentence
  stem's bullets back to green. A10: the catalogue's `method-frame` field line
  ("optional purple heading") back to green (the summary row and the code are
  pinned). Pinning every `style.json` colour the mapping decided, as values, would
  close the first two.

## Sound

- Every suite passes from the branch's plugin folder, with the report's counts:
  python 2,212 passed, 2 skipped; builder 753; worksheet-html 724;
  working-wall-html 150; stick-in-sheets-html 70. The runs wrote nothing into the
  plugin.
- The replay of `k1` to `k9` and `build_colours_mapping.py` on a fresh `2db3ceba`
  reproduces every plugin file and the mapping exactly.
- Sizes with line endings normalised: instructions +2,341, programs +7,951, tests
  and pins +167,788, as reported.
- No em or en dash added: in every changed file the added lines carry fewer than
  the removed ones, all on lines that already had them; the new files' dashes are
  quotations in the pins and mapping.
- All six pin tests pass on an untouched full copy with the ledgers beside it,
  and the ledger-own test runs there rather than skipping.
- 23 of 28 attacks were caught (`attack-log.txt`; the five misses are A01 and A06
  in findings 3 and 5, and A10, B08 and B09 in finding 7): the profile's home,
  pinned paragraph by paragraph, catches every edit inside Semantic colour, and
  the builder, sheet and check tests catch every code revert I tried there. The
  scratch copy was put back byte for byte after each attack.
- The preferences fold keeps his words, the starter exception, the peer limits
  (now with "answer status") and the split at the boundary, and names each part the
  profile owns.
- The four success-criteria pins moved to the profile's and the wall's new words
  and still pin what the success-criteria topic cared about.
- The wall palette matches the plan's mapping; five saved walls rebuild with only
  their colours changed and nothing moved or cut.
- The callout's black default and blue-with-`[[ ]]` match his rule; the taught chip
  prints green without braces; the method frame is purple on board and paper.
- Three saved decks rebuild identically apart from finding 2's cue; a saved
  worksheet rebuilds identically.
- The speech rule's "separate task line in question blue" (R72) now agrees with
  the profile.

## What I would fix before release

1. Put finding 1's lists to him, then change the short-task test so a blue run of
   short tasks needs its question, numbers are not counted as words, and a verb
   followed by a colon is a label; correct the report and log wording about
   statements.
2. Draw the header cue black (or ask him), and say in the profile what colour the
   cue is.
3. Ask him the worked-example scope question with "no saved deck or sheet has a
   framed worked example" in front of him; pin PF-R05 whole as kept on purpose.
4. Fix the wall demo's `{{down}}`/`{{up}}`; tell him bold shows nothing in a
   callout or a first column, and ask whether the deciding word should take the
   route's orange mark instead.
5. Update B41 and B61 ("blue belongs to questions") and pin them; clear the old
   rule from the three code comments and the two "four meanings" comments; widen
   the Y70 "gone everywhere" pin to the concept.
6. Pin every wall colour the mapping decided (the panel fills and the stem's
   bullet included) as values, not only four title bars.
7. Correct the "never on the words a child reads" line and the log's size.
