# The colours release (topic 7's 7C): what was built

Built on the side branch `streamline/7c-colours` (worktree `lessonv4-colours`, from
`2db3ceba`, 4.2.289) by `side-branch-brief.md`, following the 7C section of
`plans/2026-09-24-topic-7-change-plan.md` and the teacher's words in
`plans/2026-09-23-preferences-rest-ledger.md` (decision 11 and the colour half of
decision 22, his answers of 24 September, the change plan's question 1, and his
later "purple is fine" on a mistaken worked example, and his "y" of 25 September: a job
that names what to use is blue, and his "1. yes 2. leave it 3. yes" on the three
details the second round's renders left him). Repaired after each of four independent
checks (`colours-release-check.md`, `colours-release-second-check.md`,
`colours-release-third-check.md`, `colours-release-fourth-check.md`), with the repairs
the lead passed on each time.
Nothing is committed. No version number: the build-log entry is headed without one
and neither `plugin.json` is touched.

## In short

- **Blue is a question or the child's short task**, the job itself (`Explain your
  answer.`, `Write one reason.`, `Round 346 to the nearest 10.`), and a job that names
  what to use is still the job (`Explain your answer using the photograph.`, his "y"
  of 25 September). A line that only says how to go about it stays black (`Use the
  shaded map.`, `Use the two photographs.`). No count of
  words tells the two apart, so the slide designer says which with a new colour role,
  `task-blue`, and the check reads the role, refuses it wherever the spec shows the
  line is not a short task (a colour of its own beside the role included), and never
  lets the role alone make a slide's turn. The header's small cue stays black.
- **Green is a taught word or an answer**: the five catalogue exceptions he was shown
  are corrected, one in code (the callout) and one with a new mark (a taught word in
  a word bank).
- **A worked example is purple, wherever his answer reaches**: a prepared example and
  a `visible-in-unit` model (a new role, `worked-purple`, on any slide, a teach
  layout's lines and steps and a step list included), a place-value chart's worked
  rows (a new `worked: true`, a mistaken chain included, every digit and the ring
  purple), the method frame on the board, the sheet's method frame when it shows worked
  numbers, the wall's worked-example card and a section's worked part.
- **No saved deck or sheet uses a method frame, a callout or either new role**, so on
  the board and the sheet all of this shows first in new lessons. On the wall it shows
  at once: every wall is recoloured.
- **The working wall uses the board's colour meanings.**
- **A taught word's braces never print from a figure, on any surface**: one shared
  helper takes them off wherever the board, the sheet, the wall and the stick-in pack
  hand a figure to a shared drawing, and inside a figure the word prints plain.
- The change is fourteen scripts in `colours-change/`, with four tools and the shared
  `_patch.py` beside them. Replayed on a clean `2db3ceba` copy they reproduce the tree
  exactly. Every suite passes; each of 101 changes, bent back one at a time, is
  caught.
- Rendered before and after, for him: `colours-renders/compare-slides.png`,
  `compare-sheet.png`, `compare-wall.png`, `compare-real-walls.png`.

## Order of work, and the scripts

All in `plans/streamline-tools/colours-change/`, run with `python -X utf8 <script>`
(the census with `node`). Each old text is asserted to appear exactly once; line
endings are kept as found; every script finds the plugin from its own place and
prints it before writing.

| Script | What it does |
|---|---|
| `_patch.py` | one replacement at a time, old text asserted once, line endings kept |
| `k1_stories_first.py` | the stories that leave (the 3 September history deck, the lone (1) note) copied to the log first |
| `k2_blue_code.py` | the `task-blue` role (drawn house blue), the check's reading of it, its refusals, the turn and its verb list, the messages |
| `k3_blue_words.py` | the profile's Semantic colour, the header cue, preferences' fold, the playbook, the catalogue's colour lines, the two "blue belongs to questions" lines, J13, the final pass line, the speech-bubble rule and the paragraph rhythm line |
| `k4_green_catalogue.py` | the catalogue's exceptions, the callout's colours, the taught chip, the chart's `worked` row (its ringed digit purple), two code comments, R97 and R95 |
| `k5_worked_purple.py` | the `worked-purple` role (on a teach layout and a step too), preferences' R05 and its copies, where purple reaches, the method frame on the board and the sheet, the sheet's `worked` colour and comments |
| `k6_wall.py` | the wall's palette, parts, results, overviews, colour marks (and braces never printed), and its words |
| `k7_tests.py` | the moved tests and the new ones (from `new/`) |
| `k8_repin_other_topics.py` | the five success-criteria pins that followed their words |
| `k14_his_three_answers.py` | his "1. yes 2. leave it 3. yes": the ring on a worked row purple; the sheet's method frame purple only when it shows worked numbers |
| `k15_third_check.py` | the third check's repairs: a `task-blue` line with a colour of its own refused; a Teach slide's worked steps purple; an extract refuses `worked-purple` |
| `k16_figure_marks.py` | a taught word's braces never print from a figure: the shared helper and the four surfaces' hand-offs, with a test on each surface |
| `k17_fourth_check.py` | the fourth check's repairs: a marked worked step stays purple; the hex refusal names the colour; a frame line of words decides nothing; the stick-in caption and handles print a taught word plain |
| `k9_log_entry.py` | the build-log entry |
| `build_colours_mapping.py` | the mapping (`plans/2026-09-25-colours-mapping.md`) and the pins, the log entry's own claims included |
| `k10_dash_check.py` | no em or en dash in anything the release wrote |
| `k11_deck_census.js` | every saved deck through the slide check (run before and after) |
| `k12_sizes.py` | bytes before and after, as git stores them |
| `k13_mutate.py` | each change bent back one at a time; a test must fail |

Replay order: k1, k2, k3, k4, k5, k6, k7, k8, k14, k15, k16, k17, k9, build_colours_mapping
(the mapping now runs last, so it can pin the log entry's own sentences). Each repair
round rewrote the scripts themselves; the tree was reset to `2db3ceba` and replayed, so
the scripts make the repaired release directly.

## What changed, decision by decision

### Decision 11, blue: a question or the child's short task

His words: "I want blue means question or like a short task as in like explain why
or something like that." The change plan's question 1, "yes": a question or a short
task is blue, and a longer instruction about how to go about it stays black.

- **Why a role, not a count** (the first check's finding 1). The first build counted
  words (a task verb first, five words or fewer). Run against his saved decks it
  refused 41 job lines (`Round 346 to the nearest 10.`, six words; `Say why.`, a verb
  not on the list) and passed advice (`Use the shaded map.`, `Read the question
  carefully.`) and statements (`Change: the tools were different.`). His line is
  between the job and advice on it, and no count finds that. The lesson design has
  no field that does either: its `pupilInstruction` holds both kinds (`Use the word
  bank to help you name the marked parts.` beside `Write one sentence.`). So the
  slide says which: `colorRole: "task-blue"`, drawn in house blue
  (`builder/src/presentation-text.js`).
- **The check** (`builder/scripts/check-slide-design.js`) reads the role.
  `BLUE_WITHOUT_A_QUESTION` refuses every blue line that asks nothing, exactly as
  4.2.289 did, unless the line is `task-blue`; its message says what blue is for and
  names the role. `TASK_BLUE_NOT_A_SHORT_TASK` refuses a `task-blue` line wherever the
  spec shows it is not a short task (the second check's finding 4): the reveal mark
  `||`; a sticky fact, by its sparkle or because the lesson design beside the deck
  holds the same words; the design's answer (any `answer.content`, matched without
  marks, case or a closing full stop); a statement or a task before a question, the
  tell-then-ask block `MIXED_BLOCK_WHOLE_BLUE` refuses in `focus-blue`; and two or
  more sentences that are not questions; and a colour of its own beside the role (the
  third check: a statement given the role and the house-blue hex printed blue and
  counted as the turn, because the turn reads a hex; the catalogue already said the
  short task's blue comes "through `colorRole: "task-blue"`, never a hex"; its message
  says to take the `color` off and keep the role, since the fourth check found it
  telling the designer to take the role off). One
  question, or several, then one task on
  the same line passes. `e.g.` and `i.e.` no longer end a sentence, and a taught word
  `{{word}}` on a task line is allowed.
- **The role never makes a turn.** At the second check a statement marked `task-blue`
  passed as a My Turn's turn. `carriesItsTurn` now counts a marked line only by its
  words, a question in it or an opening task verb, as it counts a black line, and the
  verb list gains the openers the saved decks use (say, justify, put, take, place but
  not "place value", suggest, imagine, ask, plan, improve), so `Say why.` is still the
  turn. The turn message says colour does not make a line a task.
- **What the check cannot do, said plainly.** Once a designer marks a line
  `task-blue`, the check cannot tell whether it is truly the job or advice, nor a lone
  statement the design does not name; it refuses what the spec shows. Five advice
  lines, each on its own node and each marked, pass; the same five on one line are
  refused. It is the profile's examples that teach the line.
- **The header's small cue stays black** (the first check's finding 2). The profile
  defines it as a cue that helps use the body (`Use the word bank`, `Look at both
  circuits`, `Use the table`): advice. `builder/src/headers.js` is untouched, and the
  profile says "The cue is drawn black."
- **The words.** The profile's Semantic colour is the one home: the blue line names
  the short task with examples and the role; the black line gives advice as the black
  examples, keeps the reason (a whole board arriving blue tells a child nothing),
  says the judgement is the designer's ("no count of words decides it") and names the
  refusals; the deck-wide line covers the short task; the order paragraph says a short
  task after a question is blue too, keeping his words about the Apply slide without
  the date; the action-verb line says a verb is never blue on its own and takes R04's
  surviving sentence, with the PSHE case as a plain undated example; the peer line
  takes R03's one missing condition ("answer status"). Preferences' three paragraphs
  (R02 to R04) fold into it; preferences keeps his words, his agreed examples and a
  pointer that names every part the profile owns, the starter's exception included.
  The playbook's colour paragraphs, and the catalogue's `focus-blue`, new `task-blue`,
  `core-action` and `color` lines, follow. The two places that still gave the old
  reason, "blue belongs to questions" (PF-B41, PF-B61), give the new one. The
  profile's paragraph rhythm (PF-B56) gives a short task its blue beside the
  question's, and the speech-bubble rule (PF-R72) names `task-blue` for its leftover
  task line, which without the role the check would refuse.
- **His answer on a job with its how** (25 September, recorded in the ledger): asked
  whether `Explain your answer using the photograph.` is blue, "y". A line whose main
  ask is the child's job is blue even when it names what to use; a line that only says
  how to go about it stays black. Built everywhere the line is taught, each way with
  real saved lines: the profile's blue bullet (`Explain your answer using the
  photograph.`, `Describe each tooth using the pictures.`) and black bullet (`Use the
  shaded map.`, `Use the number line to help you.`, `Look at the shaded areas and the
  Equator.`), with "the test is the line's main ask" and a pair (`Use the two
  photographs.`, advice); preferences' pointer, with his "y"; the catalogue's
  `task-blue` line. `Point to the details in the photograph that support your
  comparison.`, which had stood as a black example in four places, is gone from all of
  them (barred), since it sits on the line he just drew. The build log's story, which
  said the history deck's lines were "still black", now gives his answer; the check
  test's comment says the first line is the job, blue once marked. The check's tests
  run four saved job-with-its-how lines (pass when marked) and four saved how-only
  lines (refused in blue); the pin test holds both shapes in the profile, preferences
  and the catalogue.
- **His job line of 18 September** (`Explain how Sam's tooth decayed.`, left open in
  the log) is right under his rule; it passes once marked `task-blue`. Saved decks
  carry no role, so the check treats them exactly as 4.2.289 did.

### Decision 11, green: the catalogue's exceptions corrected

His words: "green is vocabulary or an answer. So we'd have to fix those."

- A word inside a statement: "The [[tens]] column changes." becomes "The tens column
  changes.", black. The callout's line is bold throughout, so no word in it is picked
  out by bold, and the catalogue now says so rather than promising the eye lands on it.
- A table's deciding word: `**bold**`, not `[[ ]]`. The first column is bold
  throughout, so the catalogue now says bold shows nothing there.
- A worked chain the lesson will show is wrong: not an answer. His later answer ("purple
  is fine") makes it purple: see the next section.
- A callout's own colours (`callout.js`): the default is a new `black` variant (a black
  edge, a statement's colour), `blue` is a question the class answers (its words carry
  `[[ ]]`), `orange` and `purple` keep their meanings, and green is no longer a callout
  colour (a green edge round black words is a frame, not an answer). A spec that names
  `green` gets the default.
- A word bank of taught words printed black (`chip-bank.js`): a chip written `{{word}}`
  is a taught word and prints green, braces never printed. A mark rather than the
  bank's style, because the saved yellow banks also hold words that are not taught
  (`so`, `because`).
- Two code comments that gave the old rule are corrected: `builder/src/answer-text.js`
  (`[[x]]` is the part of a line that asks, not a table's deciding word) and
  `shared/visuals/place-value-chart-svg.js` (see below).
- Out of date and colour (the plan's B16): the tally summary (R97) and the maths helper
  guide's ring (R95).

### Decision 11, purple: a worked example, wherever his answer reaches

His words: "Worked examples can be something different. Maybe purple.", "worked
example purple too", and, told he had greened a mistaken chain himself on 19 September,
"purple is fine".

- **A prepared example is a worked example.** PF-R05, which decision 11 names, said
  "Prepared examples and `visible-in-unit` models are teaching content and stay black";
  it now says they are worked examples, so purple, never answer green. Its copies
  follow: the playbook (R25), the lesson-design contract (R34, R35), the slide designer
  (R36) and the catalogue (R40, R53, Y68's second quote). The mechanism is a new colour
  role, `worked-purple`, drawn in `COLOURS.worked`, the sticky `7030A0`.
- **It reaches the Teach slide and the step list** (the second check's finding 1). Of
  the 17 saved prepared models the class sees finished, 16 sit on Teach units, whose
  slide is a teach layout, and a teach layout refused every colour role, so the
  instruction led to a refusal and a black model. `builder/src/teach-layouts.js` now
  takes `worked-purple`, and no other role, on an explanation line; it refuses it on
  the question (blue), on the line to remember (purple already) and with orange, and
  its refusal message names it. A step list drew every step black whatever it
  carried: a step written `{ "text": ..., "colorRole": "worked-purple" }` now prints its
  words and its number purple (`builder/src/content/steps.js`), and
  `builder/src/validate.js` refuses any other role on a step. The third check found a
  Teach slide's steps still plain strings only: the `steps` and `picture-steps` layouts
  now take `{ "text": ..., "colorRole": "worked-purple" }` too, and refuse any other
  object with a message naming the role. The fourth check found a worked step that
  carries a mark (`{{word}}`, `**bold**`) printing black apart from the marked word, on
  all three: the step list drew its words from body black. Its runs now start from the
  worked purple (`steps.js`), tested on a Teach `steps`, a `picture-steps` and a
  free-zone list. A `source-text` extract took the role and
  printed black without a word; it now refuses it, saying why (an extract is the
  source's own words, drawn as written). A text line, a question card and a list item
  already took it.
- **A place-value chart's worked rows** take a new `worked: true`
  (`shared/visuals/place-value-chart-svg.js`, so the board, the sheet and the wall draw
  it alike, and the photocopied stick-ins in ink): every digit prints purple, the
  ringed one included (the second check's finding 2: the ringed digit, the one a
  mistaken chain is about, printed answer green), and so does the ring (his "1. yes",
  shown it still green), and a row marked `answer` too reads
  as the answer. A chain the lesson is about to show is wrong is marked `worked`, never
  `answer`. The chart's comment keeps his 19 September green as history and says his
  later answer changed it.
- **The method frame**: the board's panel and title are purple. On the sheet the
  frame's edge and title are purple only when it shows worked numbers (his "3. yes"): a
  frame the child fills in every box looks as it did before this release, an ink edge
  and a question-blue heading. **Mine:** a frame partly filled by the example is judged
  by its lines; as soon as one line is worked right through (its values written out,
  a number in it, and no box left for the child) it shows worked numbers and is
  purple. A line of words alone ("Look at the ones digit.") decides nothing: the fourth
  check found it counting as worked, and it no longer does. A frame whose
  every line still holds a box is the child's, whatever numbers it hands them to start
  from. The board's frame stays purple: the teacher fills it as he models. Purple on
  paper is a fifth colour, on the frame's edge and title; what a child writes and the
  frame's labels stay ink. The sheet's comments that counted four meanings are
  corrected, the two in `frames.js` included.
- **Where purple does not reach**, now said in the profile instead of "whatever carries
  it": a figure with no purple of its own (a number line, a bar model, a tally, a
  table's cells), a worksheet's first worked row, and the good card of a
  strong-and-weak pair keep their own colours.
- **No saved deck or sheet uses** a method frame, a callout, `worked-purple` or a
  `worked` row today, so on the board and the sheet this shows first in new lessons.
- The success-criteria panel's green is unchanged (settled in 4.2.288).

### Decision 22, colour half: the wall uses the board's colour meanings

Derived from his "yes", as the plan says; rendered for him before the merge.

- **Card colours** (`style.json`): sticky fact and worked example purple (title bar,
  panel, label); vocabulary green (the teal leaves); misconception red beside green
  under a blue title (the amber leaves); the reference table's header and every other
  title bar blue (navy leaves); the sentence stem neutral (pale grey panel, grey edge,
  black bullets) with its modelled line purple, a worked example of the stem. The
  labelled diagram's title bar was borrowing the worked example's colour; it is a
  title, so blue. The worked example's step badges stay the green of the
  success-criteria steps they copy.
- **The section family**: parts take the board's category colours, blue, orange,
  purple (a fourth part blue again, across the grid). A part's result sits on answer
  green when it is the answer; a part marked `worked: true`, a worked example, a
  mistaken one always, shows its result on the worked-example purple (the second
  check's finding 3: "Sam wrote 340" sat on green). The card contracts' field table
  gains the field.
- **The overview families**: two parallel groups blue then orange; "The big idea" and a
  cause card's reason in the sticky purple; captions black on a neutral ground; teal
  and navy gone.
- **Taught words green, and braces never printed.** The board's colour marks draw on a
  sentence stem, a reference-table cell, a section's notes and steps, a sticky fact, a
  vocabulary definition, a misconception's two sides and a worked example's lines,
  each measured without the marks. Everywhere else (a title, a heading, a coloured
  strip, a caption) the wall's escaping strips a taught word's braces and prints the
  word plain: at the second check they printed on a sticky card, a misconception and a
  section result. Inside a figure too (the third check found a labelled diagram's
  labels and a Venn's items still printing them, drawn into the picture): see the next
  bullet. The card contracts say so.
- **A figure's words, on every surface** (the third check's item 2, built the way the
  lead chose, "one shared helper ... the word printing plain inside a figure, and a
  board helper that already greens a marked word keeping that", by his standing rule
  that a stray mark never stops a build). A figure's words are drawn into its picture
  by a shared drawing, which printed `{{enamel}}` as written. `withoutTaughtMarks`
  (`shared/text/criteria-marks.js`) takes the braces off every string of a figure's
  spec, and each surface applies it where it hands a figure to a shared drawing: the
  board once, to the lesson it both pre-renders and draws (`builder/src/figure-marks.js`,
  from `builder/build.js`, for every figure the parity manifest lists but the callout
  and the word bank); the sheet in its helper registry (`worksheet-html/src/helpers/index.js`);
  the wall in its pre-render and its card lookup alike (`svg-renderer.js`,
  `visuals.js`), so the two agree; the stick-in pack for every piece
  (`render-piece-html.js`), and, since the fourth check, the pack's page caption and
  handles, where a one-moment pack printed its label's braces. Each surface has a
  test that reads the drawn picture's own
  text for a labelled diagram and a Venn. **Where a marked word is green and where
  plain:** inside a figure's picture the word prints plain on all four surfaces; on the
  board, a caption set under a figure as slide text through `answer-text.js` keeps its
  mark and prints green (the `label` of an angle, Carroll, geoboard, line pair,
  rainforest layers, reflection grid, translation shape, triangle and Venn, and of the
  shared figures that carry a caption); on the wall, a card's own words green as the
  bullet above says; the sheet and the stick-in pack draw no taught-word green
  anywhere.
- **The words**: the visual language (panel identity, card-type table, anti-patterns,
  vocabulary family) and the wall preferences (the modelled line, the chips). Because
  the sticky and worked-example cards now share purple, the "don't fight the type
  system" rule keeps its rule and changes its reason: a child tells method from fact by
  the card's shape.
- **Left alone:** the zoners' and banners' rainbow (it labels the wall's zones) and the
  shared figures (already the board's drawings).

## Every pin, and why

**This release's pins.** The rest-of-preferences list has no pin file yet (7B makes
it), so this release has its own: `scripts/tests/colours_ledger_pins.json`, built by
`build_colours_mapping.py` on the shared `ledger_mapping.py`, tested by
`scripts/tests/test_colours_are_kept.py`.

- **40 ledger rows**: 35 rest-of-preferences rows the release changed (R02, R03, R04,
  R05, R15, R16, R18, R19, R24, R25, R26, R27, R28, R30, R32, R34, R35, R36, R40, R53,
  R72, R89, R90, R91, R95, R97, Y64, Y68, Y70, Y76, Y77, J13, B41, B56, B61), one kept
  on purpose (Y74, with the taught-word paragraph beside it), and four from the
  starters list (SA-D21, SA-I14 to I16). Each with its outcome naming the decision, its
  new words, its whole paragraph (unless the home already pins it), and its retired
  wordings, barred everywhere unless marked local; the builder refuses a wording meant
  to be gone everywhere that another file still holds.
- **Ten added mechanisms**: the `task-blue` role, its refusals, its turn and the verb
  list; the black header cue; the callout; the taught chip; the `worked-purple` role on
  a line, a teach layout and a step, the purple frame on both surfaces and where purple
  does not reach; **every wall colour the mapping decided, as values**, a worked part's
  purple result, the braces stripped and the contracts' whole paragraph on colour
  marks; the two corrected code comments; the chart's `worked` row with its ringed
  digit and ring; the build log's own claims (the refusal sentence, which the third
  check put back unnoticed, and the braces sentence, now true); a figure's braces taken
  off on each surface. The programs' retired messages, the old turn line, the old chart
  fill and the sheet's "four meanings" comments are barred.
- **The home**, the profile's `## Semantic colour`, paragraph by paragraph.
- **For 7B and 7A at merge**: 7B's `PF-` pin file must take these 36 rows from
  `COLOURS_ROWS` in `build_colours_mapping.py`, and 7A's `SA-` file the four `SA-` rows.
  PF-R15 and PF-R16 carry his answer of 25 September in their outcomes and pins, and
  the old black example is barred everywhere.

**Earlier topics' pins that followed the words** (`k8`, in place, each found by its
old words so it replays on a merged tree; it now also checks every paragraph pin is
still exactly a paragraph):

| Pins | Row | Why |
|---|---|---|
| success criteria | SC-J11 | preferences' copy of "success-criteria body text is black" folded into the profile; it pins the profile's sentence |
| success criteria | SC-J12 | the profile's sentence now ends on the longer instruction |
| success criteria | SC-O15 | the wall's anti-pattern table, pinned whole: its sticky row names the card's shape |
| success criteria | SC-O23 | the wall section's field table, pinned whole: it gains the part's `worked` field |
| success criteria | SC-O28 | the wall's worked-example panel is purple |

**Moved tests**, each with a comment naming the decision: `doc-claims.test.js` (the two
colour-grammar tests, the playbook's prepared-example line, and the profile's numbering
note), `slide-design-check.test.js` (one comment). **New**:
`builder/test/colours-follow-the-board.test.js` (13), seven appended to
`slide-design-check.test.js` (the saved lines all three checks named, both ways; every
refusal, a colour beside the role included; the role's turn; the three messages'
guidance whole; a starter of marked lines), `worksheet-html/test/worked-example-purple.test.js`
(3), `worksheet-html/test/figure-words-plain.test.js` (2),
`stick-in-sheets-html/test/figure-words-plain.test.js` (3),
`working-wall-html/test/colours-follow-the-board.test.js` (12), and the pin test.

**What got through the second check, each now caught**: the three refusal messages'
guidance (tested whole, read from the check's own output); the role's turn; a `{{ }}`
on a task line; a starter of `task-blue` lines; the frame's pale ground (tested as the
value `EDE3F5`, not found by the same constant); a worked row on the stick-in pack
(ink); the wall's measuring with marks (six card types, each at a length where four
more characters a mark would change the size, which the test proves with a `##` copy);
a section step's braces; a fourth section part green; the map's caption and ground;
the contracts' list of where marks carry over (pinned whole); the paragraph rhythm
line (B56, pinned whole).

## The suites

`bash plans/streamline-tools/run-all-suites.sh colours-after`, final tree (logs beside
the script; the baseline is `colours-before-*.log`):

| Suite | Result | Baseline (4.2.289) |
|---|---|---|
| python (`scripts/tests`) | 2,214 passed, 2 skipped | 2,201 passed, 1 skipped |
| voice harness | 21 passed | 21 |
| builder | 762 pass, 0 fail | 742 |
| worksheet-html | 727 pass, 0 fail | 722 |
| stick-in-sheets-html | 73 pass, 0 fail | 70 |
| working-wall-html | 154 pass, 0 fail | 142 |
| shared | 126 pass, 0 fail | 126 |
| test | 46 pass, 0 fail | 46 |

The skip beyond the baseline's is the pin test's check that its rows are the ledgers'
own: the ledgers live in the main checkout's `plans/`, so it runs after the merge (the
builder checks every row against the ledger when it writes the pins).

**The machine, not the release.** Since about 12:48 on 25 September the Windows
`python3` alias hangs, and the tests that start `python3` by name
(`test_make_lesson_static_contract.py`, `test_unavailable_picture_route.py`) waited on
it. Every run since used a scratch virtual environment whose `python3.exe` is the same
Python 3.13, first on PATH for the pytest runs only. Nothing in the plugin changed for
it.

## Checked beyond the suites

- **Mutations** (`k13_mutate.py`): 101 of 101. The first 95 were caught in one full
  run on the third round's tree; the fourth round added six (a line of words making a
  frame purple, a marked worked step black, the hex message naming the role, a Teach
  step's extra field, the helper taking off only the first mark, the stick-in caption)
  and changed one (an empty frame purple), and those seven, with the hex refusal, were
  run one by one on the final tree and caught; every one of the 101 applies to it. Among
  them: the first rounds' 35 (each part of the role, the header cue, `worked-purple`
  drawn black, R05, both "blue belongs to questions" lines, the frame's title, the
  wall's decided values, the profile counting words); the second check's repairs and
  attacks (the role making a turn again, each refusal switched off, `e.g.` ending a
  sentence, "place value" opening a task, each message losing its guidance, a teach
  layout refusing or dropping the role, a worked step black or its number green, any
  role on a step, the stick-in ink, a worked part's result green, a fourth part green,
  the wall printing braces, six cards measuring their marks, the map's caption and
  ground, R72, B56, the contracts' list, `frames.js`, where purple does not reach); his
  answers (the job-with-its-how example removed or called advice; the ring on a worked
  row green again or drawn green; an empty sheet frame purple, a worked one not, each
  frame rule and the profile's sentence undone); the third check's (a colour beside the
  role, a Teach slide's worked step refused or dropped, an extract taking the role, the
  shared helper, the board's figure pass, its build wiring and its green caption, the
  sheet's, the wall's pre-render and card lookup, the stick-in pack's, and the two log
  sentences). In an earlier full run the stem's two undoings got through; its tests
  were tightened then, and they are caught here.
- **The saved lines the checks named, both ways** (in the check's tests): twelve job
  lines of every length pass once marked (`Say why.`, `Name a job, e.g. a chimney
  sweep.`, `Explain what {{enamel}} does.` and four saved jobs that name what to use
  among them); ten advice lines, statements and labels (four of them saved how-only
  lines), and a span and a hex, are refused unless marked; eight marked lines that
  are not a short task are refused, each with its own reason.
- **The saved decks** (`k11_deck_census.js`, 59 decks through the slide check, before
  and after): every result is identical to 4.2.289, because no saved deck carries
  either new role, and the wider verb list changes no saved deck's turn.
- **The saved designs**: `colours-after-designs.json` matches `colours-before-designs.json`
  design by design (0 of 53 pass on both, with the same faults; the design check is
  untouched).
- **No dashes** (`k10_dash_check.py`): none in anything written; lines that only
  corrected a word beside an existing dash keep it, each named in the script.

## Replay

`k1` to `k8`, `k14`, `k15`, `k16`, `k9` and `build_colours_mapping.py`, run in order on a
fresh export of `2db3ceba` with only the two ledgers copied into its `plans/`, reproduce
this tree exactly: every plugin file the same (line endings normalised), nothing
missing or extra, and the same mapping file (run last on the final tree).

## Rendered, for him

In `plans/streamline-tools/colours-renders/` (PowerPoint and pdftoppm through the
plugin's own `render-pages.py`). The "before" pages were drawn by the untouched
`2db3ceba` code (the plugin reset, drawn, and the release replayed from its scripts).

- `compare-slides.png`: a demonstration deck (`demo/lesson.json`; `demo/lesson-before.json`
  is the same slides written by the old rules), seven slides: a question with its
  short task in blue (`task-blue`), the task a job that names what to use (`Explain your
  answer using the number line.`, his answer), advice black, a word bank's taught words green and
  the header cue black; the purple method frame beside a blue short task; Sam's
  mistaken "10 more" row, purple digit by digit with the changed digit still ringed
  (before: green, as the old catalogue told the designer), and a black-edged callout;
  a table's deciding word, bold not blue; a Teach slide's prepared model, purple on a
  teach layout, beside its sticky fact; a My Turn with its short task blue and its
  prepared worked lines purple; a worked example set out as steps, purple words and
  numbers, with its question and short task on one blue line.
- `compare-sheet.png`: the method frame on paper: a frame worked by the teacher,
  purple; the child's two empty frames as before, ink edge and blue heading (his "3.
  yes"). Its before page is new, drawn by the untouched code.
- `compare-wall.png`: the wall's own test fixtures and two demonstration sheets: a
  section whose right result is green and whose second part (the last report said
  third; it is the second, in orange), "Sam's mistake", shows its
  result on purple, a reference table (its "down" and "up" plain words, black, as on
  the board), and a sticky fact whose taught word is green without braces.
- `compare-real-walls.png`: five of his real saved walls (Lord Shaftesbury, the
  digestive system, negative numbers, how a tooth decays, Victorian working
  conditions), built from their own `working-wall.json` before and after.

## Size, before and after

Measured as git stores the files (`k12_sizes.py`):

| Group | 4.2.289 | After | Change |
|---|---|---|---|
| Instruction files (11) | 918,100 | 925,896 | +7,796 |
| Programs (28) | 555,244 | 579,029 | +23,785 |
| Tests and pins (10) | 562,173 | 815,885 | +253,712 (the pin file is most of it: it pins whole paragraphs, one of them the catalogue's 21 KB helper table) |
| The build log | 699,322 | 710,565 | +11,243 (the entry and its stories) |

By file: the profile +2,554, preferences -248, the slide playbook +169, the catalogue
+3,229, the maths helper guide +266, the wall's visual language +659, the wall
preferences +57, the card contracts +980, the lesson-design contract +31, the slide
designer +45, the speech-and-characters guide +54. The programs grew most in the slide
check (+7,184: the role's refusals, the design reader, the turn, the colour beside the
role and its message), then the board's figure pass (+2,368, a new file), the teach layout (+2,126),
the wall's shared escaping and marks (+1,204) and the shared helper (+1,208), the
sheet's method frame (+1,056), the chart (+975), the sheet's registry (+844), the
section (+823), the validator (+762), the panels (+670) and the steps (+385). The
groups count every file this release touches, so their 4.2.289 figures are larger than
earlier reports'. The instruction files are larger, not smaller: the fold saved a
little in preferences, and his decisions (two new roles and where they reach, the
chart's worked row, the header cue, his examples both ways, the sheet's frame) are
written where they are read.

## Files touched (for the merge)

Changed: `plans/streamline-tools/ledger_mapping.py` and `run-all-suites.sh` (the lead's
own edits, as found), and in `plugins/lesson-v4/`: `agents/slide-designer.md`,
`builder/build.js`, `builder/scripts/check-slide-design.js`, `builder/src/answer-text.js`,
`builder/src/content/callout.js`, `builder/src/content/chip-bank.js`,
`builder/src/content/method-frame.js`, `builder/src/content/steps.js`,
`builder/src/presentation-text.js`, `builder/src/styles.js`,
`builder/src/teach-layouts.js`, `builder/src/validate.js`,
`builder/test/doc-claims.test.js`, `builder/test/slide-design-check.test.js`,
`references/build-review-log.md`, `references/output-template.md`,
`references/preferences.md`, `references/slide-composition-playbook.md`,
`references/slide-speech-and-characters.md`, `references/teacher-slide-visual-profile.md`,
`references/templates.md`, `references/working-wall-card-contracts.md`,
`references/working-wall-preferences.md`, `references/working-wall-visual-language.md`,
`references/worksheet-helpers/maths.md`, `scripts/tests/success_criteria_ledger_pins.json`,
`shared/text/criteria-marks.js`, `shared/visuals/place-value-chart-svg.js`,
`stick-in-sheets-html/build.js`, `stick-in-sheets-html/src/render-piece-html.js`,
`working-wall-html/src/render-display.js`,
`working-wall-html/src/render-grids.js`, `working-wall-html/src/render-overview.js`,
`working-wall-html/src/render-panels.js`, `working-wall-html/src/render-section.js`,
`working-wall-html/src/shared.js`, `working-wall-html/src/svg-renderer.js`,
`working-wall-html/src/visuals.js`, `working-wall-html/style.json`,
`worksheet-html/src/helpers/frames.js`, `worksheet-html/src/helpers/index.js`,
`worksheet-html/src/helpers/methods.js`, `worksheet-html/src/tokens.js`.

New: `builder/src/figure-marks.js`, `builder/test/colours-follow-the-board.test.js`,
`scripts/tests/colours_ledger_pins.json`, `scripts/tests/test_colours_are_kept.py`,
`stick-in-sheets-html/test/figure-words-plain.test.js`,
`working-wall-html/test/colours-follow-the-board.test.js`,
`worksheet-html/test/figure-words-plain.test.js`,
`worksheet-html/test/worked-example-purple.test.js`; and outside the plugin
`plans/2026-09-25-colours-mapping.md`, `plans/streamline-tools/colours-change/`,
`plans/streamline-tools/colours-renders/` (large; commit it or not), this report and the
four check reports. `builder/src/headers.js` is not touched.

**Overlap with the worksheets release (4.2.290), which merges first.** Both touch
`preferences.md` (different paragraphs), `references/output-template.md`,
`worksheet-helpers/maths.md` (its lines 96 to 100, this release's line 81), the build
log (both append an entry), the success-criteria pin file (different rows) and the two
plan tools, `ledger_mapping.py` and `run-all-suites.sh` (the same edits but for line
endings). At the second check these merged cleanly but for the build log. This round
adds `worksheet-html/src/helpers/frames.js` (two comments), and the third round
`worksheet-html/src/helpers/index.js` (the figure hand-off) and
`worksheet-html/src/helpers/methods.js` (the frame's judgement), to the files the
worksheets release may also touch. If the pin file does not merge cleanly, take the worksheets
release's version and rerun `k8_repin_other_topics.py`, then
`build_colours_mapping.py`, on the merged tree.

## Anything he should know

- **Untried on a real run.** Nothing on his boards or sheets changes until a designer
  uses the new roles; the wall changes at once.
- **His answer is built:** a job that names what to use is blue (`Explain your answer
  using the photograph.`); a line that only says how to go about it is black. The line
  he drew is the designer's to apply, marked by the role; the check cannot read it.
- **The short task is the designer's judgement, marked by a role.** A statement or a
  piece of advice marked `task-blue` on its own line, which the design does not name,
  passes the check (it is never the slide's turn); a run of marked lines, one per
  node, passes where the same words on one line are refused. The profile's examples
  teach the line, and "no count of words decides it" means a long one-sentence job
  marked `task-blue` passes too.
- **His three answers, built** (25 September, recorded in the ledger as "Three colour
  details left by the colours release's repairs"): "1. yes 2. leave it 3. yes". The
  ring round a worked row's changed digit is purple with its row, a mistaken row
  included; a wall section's third part stays the board's category purple (his answer
  was given on an accurate description: blue, orange, purple, only to tell parts apart,
  so no new render was needed); a method frame on a worksheet is purple only when it
  shows worked numbers, and an empty one looks as it did before. How a partly filled
  frame is judged is mine (the method frame bullet above).
- **A consequence of "worked example purple too"**: on the wall the sticky and
  worked-example cards are the same colour and differ by shape; on the board a Teach
  slide's model and its sticky fact are both purple.
- **Contrast, worth one printed wall**: white on the answer green is about 2.9 to 1, now
  the vocabulary card's title bar and every right section result; green chip words on
  the default pale-blue bank are lower still. All read in the renders.
- **Not built, for him**: whether a table's deciding word should take the orange
  `<<...>>` mark the skill route gives it (the catalogue says bold, which shows nothing
  in the first column); a word bank on paper still prints every chip green by its title
  (topic 9's); the labelled diagram's names are drawn black though the visual language
  calls them answer green (older than this release).
- **Left for other releases**: the playbook's launch steps called "a numbered blue list"
  (R67, 7B or topic 9); the teacher-voice pointer to preferences' presentation rules
  (R14, the voice release); the zoners' rainbow.
- **`plans/streamline-plan.md` is not updated by me** (outside my files).
