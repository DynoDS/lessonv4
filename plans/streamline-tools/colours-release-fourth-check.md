# The colours release (topic 7's 7C): the fourth check

Checked 25 September 2026, this round only (his "1. yes 2. leave it 3. yes" and the
third check's repairs), on `streamline/7c-colours` in `lessonv4-colours` (uncommitted,
on `2db3ceba`). I changed nothing in either copy except writing this file; everything I
built or ran is in `plans/streamline-tools/scratch/colchk4/`. I hashed both plugin
folders before and after: the worktree's is unchanged. In the main checkout both
`plugin.json` files, the build log and `worksheets_ledger_pins.json` changed while I
worked: the worksheets release being built there, not me.

## In short

- Every item works as described, with one gap: **a worked step that carries a taught
  word or bold prints black**, apart from the marked word. It happens on a Teach slide's
  `steps` and `picture-steps` and on a free-zone step list alike.
- A figure with no marks draws exactly as it did at `2db3ceba` on all four surfaces. The
  wall's pre-render and card lookup agree.
- 26 of my 28 undoings are caught by a test. Two got through with no test failing.
- Every suite passes. No em or en dash added.

## 1. Each item, built and looked at

- **The ring** (`deck/png`, `sheet/png`, `wall2/png`, `stick/page1.png`): the ring
  round Sam's changed digit is purple with its purple row on the board, the sheet and
  the wall. A ringed digit on a row not marked `worked` keeps its green ring. The
  stick-in pack draws both in ink.
- **The sheet's method frame** (`sheet/png/sheet-page-02.png`):
  - an empty frame and a partly filled one (a box on every line) have a black edge and
    a blue heading;
  - a frame with one line worked through, and a fully worked frame, have a purple edge
    and heading;
  - the ground is pale grey in all four.
  - The empty frame's markup is byte-identical to `2db3ceba`. Only the shared
    stylesheet differs: the new token, two new rules and comments.
  - One edge case: the judge looks for boxes, not numbers. A line of words with no box
    counts as worked, so a frame opening "Look at the ones digit." above
    "346 rounds to ___" prints purple.
- **Braces on four surfaces**: I tried a Venn (both circle labels and four items) and a
  labelled diagram (three callouts), each with `{{word}}`. The pictures and page text
  show no braces on the board, the sheet (the diagram's question line included), the
  wall (a sticky card, a labelled-diagram card, two reference-table cells) and the
  stick-in pack. The board's Venn caption "A {{Venn}} of shapes" prints with "Venn"
  green, as promised.
  - A side note, outside the figure claim: a stick-in pack with one moment prints that
    moment's `label` as written in its page caption ("✂ Sort the {{quadrilaterals}}
    (cut along ...)", `stick1/`).
- **`task-blue` with a colour of its own** (`refuse/`): the check refuses it whether the
  colour is written `color` or `colour`, with or without `#`, and inside a bullets item
  too. The role on its own still passes.
  - The message ends "take the role off, or give each short task its own line". For a
    real job such as `Explain your answer.` the right fix is to take the colour off, and
    the message never says so.
- **Purple Teach steps** (`deck/png` pages 3 and 4): worked steps print purple, words
  and number, and a plain step stays black with a green number. Two things are
  refused, each with a message naming the right form: an extract marked
  `worked-purple`, and a step object with another role, an extra field or no role.
  - **The gap:** on "How a tooth decays", the worked step "Sugar sits on the
    {{enamel}}." prints black with "enamel" green, while its number is purple
    (`deck/png/Colour check four-page-04.png`). The probe `refuse/marks-png` shows the
    same on a free-zone step list, for `{{word}}` and `**bold**` alike.
  - A worked text line and a worked teach-layout line with a taught word stay purple,
    because they pass their colour on to the words.
  - The cause is in `builder/src/content/steps.js`, which draws a step's words with
    `splitAnswerRuns(step.text, true)` and no base colour. Once a step carries a mark,
    each run takes the body black and the text box's purple is overridden.
  - The fix: pass `step.worked ? COLOURS.worked : undefined` as the third argument, and
    test a marked worked step. Until then, the log's "a step list draws it on a step's
    words" is only true of unmarked steps.

## 2. Nothing else changed (`cmp/`)

- **Board**: a plain deck (a Venn, a labelled diagram, a chart with no worked row, a
  clock, a Carroll) matches a `2db3ceba` build part by part, slides and pictures alike.
  The only difference is the timestamp in `docProps/core.xml`. To compare fairly, the
  old copy had to load the same `sharp` as the worktree (`samemods.js`). With a
  different `sharp` the picture bytes differed but the pixels were identical.
- **Sheet**: the page body is identical. Only the shared stylesheet differs, as above.
- **Wall**: every plain figure's picture is identical to `2db3ceba`, and every card finds
  its picture. A marked wall's lookups return the same pictures as the plain wall,
  reference-table cells included, so the pre-render and the lookup agree.
  - The chart's cache key text differs from the old one, because an earlier round added
    `worked: false` to each row. The picture is the same.
- **Stick-in**: each plain piece's HTML is identical to `2db3ceba`, and each marked
  piece's is identical to the plain one.

## 3. Undoing the repairs (`attack.py`, `attack-run.txt`, `attack-run2.txt`)

I made 28 undoings, one at a time, on a full copy of the plugin with the plans beside
it. Each file was put back byte for byte, and the copy hashed the same afterwards.

**Caught (26):**

- the ring green again, or drawn green;
- every sheet frame purple, none purple, the empty frame's edge purple, any written
  number counting as worked, every line needed, the worked title blue;
- the hex beside the role passing, and its message losing its reason;
- a Teach step dropping its role or taking any role;
- an extract taking the role again;
- the shared helper doing nothing;
- the build skipping the figure pass, the caption losing its mark, every node stripped,
  no figure types;
- the sheet, the wall's pre-render, its lookup and the stick-in pack each keeping the
  marks;
- both log sentences.

Two of these are caught only by the pin file's copy of the code line, not by a test of
behaviour: a row marked both `worked` and `answer` ringing purple, and reading only
`color` and not `colour`.

**Got through (2):**

- A Teach step object with an extra field (for example `helper`) accepted. The code
  refuses it, but no test does, even across the whole builder suite.
- The shared helper taking off only the first mark in a string. No test has two taught
  words in one string, even across all six suites and the pins. The code is right
  today: "{{enamel}} and {{dentine}}" comes out plain.

The first pass also had one undoing that matched three places and so ran nothing; it
was redone on a unique line, and that is the edge undoing listed above as caught.

## 4. The suites, from the worktree's plugin folder

| Suite | Result |
|---|---|
| Python | 2,214 passed, 2 skipped (a scratch venv's `python3.exe` first on PATH for pytest only) |
| builder | 760 |
| worksheet-html | 727 |
| working-wall-html | 154 |
| stick-in-sheets-html | 72 |
| shared | 130 |
| test | 46 |

No failures. `shared` shows 130 where the report says 126. A clean `2db3ceba` copy run
the same way also gives 130, so the difference comes from how the suite is started, not
from the release.

**No em or en dash added to the plugin.** The four added lines that hold one keep a dash
that was already there, with a word changed beside it ("green" to "purple", "teal" to
"green"). The new plugin files hold none, apart from the pin file's quotes of existing
text.

## What I would fix before release

1. A worked step's words stay purple when it carries a mark: pass the worked colour to
   `splitAnswerRuns` in `steps.js`, with a test on a marked step.
2. Test a Teach step object with an extra field, and a figure string holding two taught
   words.
3. Smaller:
   - the hex refusal's message should say to take the colour off;
   - a frame line of words with no box counts as worked numbers;
   - the one-moment stick-in caption prints a marked label as written.
