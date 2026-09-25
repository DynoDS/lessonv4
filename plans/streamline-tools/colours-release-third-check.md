# The colours release (topic 7's 7C): the third check

Checked 25 September 2026, after the builder's repairs to the second check, on
`streamline/7c-colours` in `lessonv4-colours` (uncommitted, on `2db3ceba`). I changed
nothing in either copy except writing this file; everything I built or ran is in
`plans/streamline-tools/scratch/colchk3/`. I hashed both plugin folders before and
after: the worktree's is unchanged. In the main checkout both `plugin.json` files, the
build log and a new `worksheets_ledger_pins.json` changed while I worked: the
worksheets release being built there, not me.

## In short

- The round is sound. Every second-check finding is done or put to him, the pictures
  show what the lead asked for, 53 of my 54 undone repairs are caught, and every suite
  passes.
- Three small holes are left (details below):
  1. A statement marked `task-blue` **and** given a house-blue `color` passes every
     check, prints blue and counts as a My Turn's turn.
  2. Taught-word braces still print in two places on the wall: a labelled diagram's
     callout labels and labels inside a drawn figure (a Venn's items).
  3. A worked example set out as steps on a Teach slide cannot be purple: the teach
     layouts `steps` and `picture-steps` take plain strings only. And `source-text`'s
     extract accepts `worked-purple` and prints black, without a word.
- One thing for him is still not rendered: a section's third part, purple, beside a
  purple worked result. The report says `compare-wall.png` shows "Sam's mistake" as the
  third part; it is the second part, in orange.

## 1. The second check's findings, one by one

1. **`worked-purple` on a Teach slide and a step list: done, with one gap.** Old
   refusal: "colorRole cannot be set on a teach-layout line ... Use "orange": true to
   lift the one line that carries the weight." New: the role passes, and the message
   adds "and "colorRole": "worked-purple" on the lines of a worked example." It is
   refused on the question ("a question stays blue"), the line to remember ("is purple
   already") and with orange. Steps: old `color: COLOURS.body`, new
   `color: step.worked ? COLOURS.worked : COLOURS.body` (the number badge too), and any
   other role on a step is refused ("step 1 carries colorRole "task-blue", which a step
   list does not draw"); a role on the whole list is refused too. Gap: on a teach
   layout, `steps: [{ "text": ..., "colorRole": "worked-purple" }]` stops with "each
   step is its words as a string.", which does not name purple, so a Teach slide's
   worked steps stay black; and the extract drops the role silently, against "nothing
   you write is ever silently left off the board".
2. **The mistaken chain's ringed digit: done.** Old
   `fill: (picked || revealed) ? pal.ring : worked ? pal.worked : pal.text`; new
   `fill: worked ? pal.worked : (picked || revealed) ? pal.ring : pal.text`. The ring
   itself stays green; the report puts that to him.
3. **The wall section's results: done.** Old: every result on `RESULT_GREEN`. New:
   `hash(item.worked ? RESULT_WORKED : RESULT_GREEN)`, with a part field `worked` in the
   contracts ("Without it the strip is answer green, which tells a child the result is
   right."). The third part's purple is kept and listed for him, but not rendered (see
   above).
4. **`task-blue` passing statements and making the turn: done, but for the hex.** Old
   `carriesItsTurn` counted `node.colorRole === 'task-blue'`; new counts it only
   `&& taskBlueAsks(node)`. Tell-then-ask is refused ("it tells before it asks"), the
   verb list is widened, and the report says plainly that a lone statement or advice
   marked `task-blue` passes. The hole: with `color: "0070C0"` beside the role,
   `BLUE_WITHOUT_A_QUESTION` skips the line (it is `task-blue`) and the turn check
   falls through to the hex, which counts. The catalogue says a short task carries its
   blue "through `colorRole: "task-blue"`, never a hex"; nothing refuses both.
5. **The job with its how: done with his "y".** Old profile: "`Explain your answer
   using the photograph.`, `Point to the details that support your comparison.` and
   ... are all black." New: "A job that also names what to use is still the job, and
   blue: `Explain your answer using the photograph.` and `Describe each tooth using the
   pictures.`". The log's story and the test comment now agree. Not taken: "in a few
   words" as the profile's guide. The profile says "no count of words decides it: the
   test is the line's main ask", while the refusal message still says "the job in a few
   words"; the report says a long one-sentence job passes.
6. **Where purple reaches: reworded, the scope left for him.** Old: "A worked example
   takes the same purple, whatever carries it." New: "Purple does not reach a figure
   with no purple of its own (a number line, a bar model, a tally, a table's cells), a
   worksheet's first worked row, or the good card of a strong-and-weak pair". The blank
   purple frame on paper is in the report's list for him, not yet asked.
7. **The old rule in five places: done, one overclaim.** `frames.js` now "keeps
   scaffold from becoming a colour meaning of its own" and "scaffold never becomes a
   colour meaning of its own"; R72 now "in question blue as the child's short task
   (`colorRole: "task-blue"`)"; the paragraph rhythm "a question or a short task takes
   its blue", pinned; the teach-layout message as in 1. The wall's `esc` now strips
   `{{ }}` everywhere its text passes, but a figure's own words are drawn by the shared
   drawings, which do not, so "a mark's braces never print anywhere" (contracts, log,
   report) is not true of figure and callout labels.
8. **What got through the second check: now caught** (my own versions, section 4).
9. **Claims: done.** `output-template.md` is in the overlap list; the log now says "It
   refuses every other blue line that asks nothing, as 4.2.289 did" and "the role never
   makes a slide's turn" (true but for the hex).

## 2. The pictures

- **Deck** (`deck1/png`): a Teach slide on `four-cards` with two worked lines purple
  beside a blue question and the starred sticky line; a Teach `statement-support-sticky`
  with its lead and line purple; a free-zone step list, words and numbers purple, with
  a blue `Round 782 to the nearest 10.`; Sam's "10 more" row purple digit by digit, the
  wrong 5 purple in a green ring, a worked row purple and an answer row green.
- **Sheet** (`sheet/png`): the same mistaken row purple, ring green; the method frame's
  edge and title purple, labels ink, pale grey ground.
- **Wall section** (`walls/section/png`): a right result green; "Sam wrote 340"
  (`worked`) purple; a worked part purple under a purple header; a mistake not marked
  `worked` ("Ali wrote 300") green, as the contracts warn. Taught words green in notes
  and steps; no braces on the green strip.
- **Braces on every card**: all 22 wall fixtures rebuilt with `{{ }}` round a word in
  every text field. No braces in any page's text, but the labelled diagram prints
  "The {{scale}} of values" and "{{Time}} along the bottom" (its labels are drawn into
  the picture, so the wall test, which reads the HTML, cannot see them), and the Venn
  prints "{{Square}}", "{{Rhombus}}".

## 3. The short-task role (`roles/probe-roles.txt`, `roles/probe2.txt`)

- **Refuses:** the reveal `||`; a line opening with the sparkle; a sticky fact or an
  answer the lesson design beside the deck holds word for word; tell-then-ask (a
  statement or a task before a question); two sentences that are not questions.
- **Passes:** his line `Explain your answer using the photograph.` and `Describe each
  tooth using the pictures.` (refused in `focus-blue`, fine in black); a question then
  its task; `Name a job, e.g. a chimney sweep.`; and, as the report admits, a lone
  statement, an answer in words the design does not hold exactly, a sticky fact without
  its sparkle or reworded, `Use the two photographs.`, five advice lines one per node,
  advice after a semicolon, a long one-sentence job.
- **Turn:** a marked statement alone on a My Turn is refused; `Say why.` and a marked
  question count. The one way through is the role plus a house-blue hex (section 1,
  item 4). A statement carrying `{{word}}` counts as the turn, black or blue alike; that
  is older than this release.

## 4. The new tests when their repair is undone (`attack.py`, `attack-run.txt`)

54 undoings, one at a time, on a full copy of the plugin with the ledgers beside it,
each file put back byte for byte (the copy hashed the same afterwards). 53 caught:
all 9 on the teach layout and steps, all 4 on the chart row (the stick-in ink
included), all 10 on the wall (results, parts, braces, notes, measuring, the map
caption), all 17 on `task-blue` (the turn, every refusal, `say`, "place value",
`e.g.`, `{{ }}` on a task line, the starter, all four messages), and all 13 on the
words (both `frames.js` comments, R72, B56, the contracts' list and `worked` row, his
example, the history line black again, where purple does not reach, a word count, the
slide designer, the frame's ground and the sheet's edge). Got through: one sentence of
the build log put back to "asks nothing or carries an answer"; the log is history, so
that is harmless.

## 5. The suites, from the worktree's plugin folder

Python 2,214 passed, 2 skipped; builder 757; worksheet-html 724; working-wall-html
153; stick-in-sheets-html 70; no failures (a scratch venv's `python3.exe` first on PATH
for pytest only). On the full copy with the ledgers beside it the pin tests run with no
skip: 79 passed. No em or en dash added: the count falls by 8, and the two new-looking
ones are "green" changed to "purple" beside a dash already there.

## What I would fix before release

1. Refuse a `task-blue` line that also carries a `color`, with a test.
2. Strip or refuse `{{ }}` in the wall's callout and figure labels, and correct "never
   print anywhere" in the contracts, the log and the report.
3. Let a teach layout's steps take `worked-purple` (or say in the catalogue that a
   Teach slide's steps stay black), and draw or refuse the role on an extract.
4. Render a three-part section for him, and correct the report's "third part".
5. Smaller: a row marked both `worked` and `answer` prints green without a word, though
   the catalogue says "never both"; and "in a few words" in the refusal message does
   not match the profile's "no count of words".
