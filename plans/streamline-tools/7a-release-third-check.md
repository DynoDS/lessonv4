# Release 7A (4.2.293): third check, repair rounds 4 to 9

**Round 9, a last look (section 6).** The arrow is now heavy and still fits:
- The 33 scripts replay exactly, and the live tree equals the replay.
- The arrow stress test at 36 to 80pt prints nothing past a panel, and the plan equals the print.
- The arrows' ink stays inside their own line from 20 to 100pt, up and down arrows included.
- The shaft is as heavy as the digits.
- Six of round 9's changes, undone, are each caught.
- The wall suite (165) and every pin test pass.

With that, items 1 and 3 of "In short" below are settled. Item 2, the three-line exception,
is still with him.

Checked on 26 September 2026 against the uncommitted working tree on top of `b1c2d427`, with
`7a-release-report.md` (rounds 4 to 8), `7a-release-second-check.md`, the scripts in
`7a-change/` and his two answers in `plans/2026-09-23-preferences-rest-ledger.md`. Nothing in
the plugin was changed. Rounds 4 and 5 were checked first, on their scripts replayed as they
stood at 05:24 (`scratch/7achk3/r5/`). When the builder had stopped, rounds 6, 7 and 8 were
checked on the finished tree: the 31 scripts replayed at 06:31 (`r8/`) give the working tree
exactly, and the live tree still equalled that replay after the last suite run (06:53).

Scratch work is in `scratch/7achk3/`:
- `replay.py`
- `wallbuild.js`: builds walls and records what the fitter planned.
- `probe.js`: measures every panel in the Chrome the wall prints with.
- `gen.js` and `gen-arrows.js`: the sweeps.
- `pagediff.js`, with the before and after sheets in `shots/` and `shots6/`.
- `figs.js`, `glyphs.js`, `arrowlook.js`, `arrowcands.js`.
- `mutate.py`, `mutate8.py` with `mutations8.json`.

## In short

**For the lead or him to decide:**

1. **The arrows now fit, but they are thin.** Round 8 closed the gap this check found. Of the
   178 arrow stress cards, none prints past its panel or into its padding (4.2.292: 53 of 153
   past the edge), and the plan equals the print. The cost is the look:
   - Arial's arrow is a hairline beside Comic Sans bold digits. At 60pt its shaft is 4px against
     the digits' 11px; Segoe Print's arrow on 4.2.292 was 7px. At the 36pt floor that is about
     0.6mm of ink on the printed sheet (`arrowlook.png`, `round-arrows-compare.png`).
   - It still reads as an arrow close up, but from across a room it is fainter than the numbers
     either side of it, and in "3,462 → 3,500" the arrow carries the meaning.
   - No installed face does better within the line: Segoe UI Bold and Black, Arial Black and
     Tahoma Bold all draw thin arrows (`arrowcands.png`).
   - The heavier choice is the other repair the lead offered: Segoe Print's arrow, with its
     taller line planned. Worth showing him the two side by side.
2. **The three-line exception** (still with him). It sits in the same paragraph as his "three
   lines turns the item into a paragraph ... becomes a poster", and his "yys" answered a
   question that never mentioned lines. It also reaches further than his question:
   - It applies to every item on a sticky card beside a photo, not just one long fact. A card of
     three 106-letter facts now builds at the floor as three three-line paragraphs
     (`s3x106.png`), where 4.2.292 refused it and his order would have reached a second card.
   - The photo never shrinks further than round 3's widest give-way (30% of the sheet); the gain
     is the third line.

**Worth adding (small):**

3. **Arrow tests cover only two card types.** The guard's 60 arrow cards are all sticky facts or
   worked examples. Taking the arrow face out of the font list in any of these places passes
   every test: titles and captions (`shared.js`), reference tables and grids, display cards,
   overviews, section cards, and the page's own default. So the claim "on all sixteen card
   types" is untested for fourteen of them. One arrow in a title, a reference cell and a section
   would cover it. Low: dropping the bold arrow face passes (Chrome thickens the regular one), and
   so does dropping the arrow widths, since the plan then only over-plans.

**Sound:**

- **Round 4:** all three repairs behave (section 1).
- **The fit, in Chrome** (section 2): 45 saved walls, 240 long-fact cards and 258 sweep cards.
  No text past a panel's edge or in its padding. The planned lines and heights are the printed
  ones, except that five portrait worked examples over-plan (a label line counted at body
  height).
- **His walls:** 20 of 45 draw differently from 4.2.292, the font list apart. Each is bigger
  type where there was room, a size smaller where words crowded the edge or an item ran past five
  lines, a figure given the room freed, or the section wall's strips holding their words. None
  reads worse from across a room, nothing is under the floor, and no figure is squeezed.
- **His order:** all 48 long facts keep their photo and whole sentence. "A second card" and
  "picture off last" both follow from his first answer (section 3).
- **Undo checks:** round 5's misses are all caught now. Of 15 on rounds 6 to 8, 6 are caught; the
  misses are item 3 (section 4).
- **Suites, replay, dashes:** all green, exact, none added (section 5).

---

## 1. Round 4's repairs, tried

| Case (real slide check, `grid/`) | Result |
|---|---|
| Grid titled "Your Turn" with sums | passes (exit 0) |
| Grid titled "Your Turn", sums all blank, or no sums | refused, `TURN_SLIDE_WITHOUT_ITS_TURN` |
| Untitled grid | refused, `GRID_WITHOUT_TITLE` |
| Untitled grid under the starter header, slide 1 or slide 2 | passes |
| Starter grid titled "Your Turn" or "Adding" | passes (the title never prints there) |
| A "Your Turn" content slide with no task | still refused |

- **`--settled` on the designer's own check:** adding it to the slide designer's command, or to
  the playbook's Track A check, fails `slide-design-check.test.js`. Every slide-check command
  in the agents and the playbook is covered.
- **The refusal names 72:** the balanced-diet wall reads «72 is the most that fits in 2 lines at
  36pt (36 per line)» (4.2.292: 62).

## 2. The fit, printed in Chrome

Each card was built with Chrome stubbed so the page is kept, then every panel measured in
Chrome. The measures: text past the border, text in the padding, the text width, each item's
printed lines and the body's height, all against what the fitter planned for that card.

| Set | 4.2.292 | Round 5 | Round 8 |
|---|---|---|---|
| 45 saved walls, text past an edge / in padding | 1 / 2 | 0 / 0 | 0 / 0 |
| 48 long facts x 4 photo shapes + emoji (240) | all refused | 0 / 0 | 0 / 0 |
| Sweep: sticky, definition, stem, worked example; photo, drawing, none, number line; both orientations | 36 past an edge | 0 / 8 (arrow lines) | 0 / 0 |
| Arrow stress (178 that build) | 53 of 153 past an edge | 45 past an edge | 0 / 0 |

- **Plan against print, round 8:** equal on every saved wall, every long fact and every arrow
  card. In the sweep, five portrait worked examples plan up to one line taller than they print:
  a "Worked example:" label alone on its line is counted at body height. That is the safe side.
- **Nothing below the floor:** body text never under 36pt; the smallest label is 28pt, as on
  4.2.292.
- **Figures:** six stacked figures are larger, and the section wall's two number lines are 5%
  smaller (196 to 186mm) as its heading strips grew to hold their words (`l14-pair.png`).
- **The changed walls, looked at** (`shots/*-pair.png`, `shots6/*-pair.png`):
  - Ten show bigger type where there was room: the partition card 36 to 44pt, the
    balanced-plate card 44 to 52pt.
  - Five show one size smaller. Christmas: its words were 50px past the edge. Rounding: its words
    ran 25.7px into the padding, and 44pt still would not fit. Continuities: 7.9px in. Parachute:
    six lines at 44pt, past the five one item may take. Teeth: 80 to 76pt; its text was 4px clear
    of the padding at 80, only the line's own padding over.
  - None reads worse from across a room.
- **New refusals:** 9 sweep cards that built on 4.2.292 are now refused. They are four-item
  sentence-stem cards and a five-fact number-line card, and each printed into its padding or
  past its edge on 4.2.292. No saved wall is newly refused.
- **Low:** the arrow face is `local("Arial")`. On a machine without Arial, arrows fall back to
  Segoe Print and its taller line again.

## 3. His order, built as he said it

- **The 48 long facts, rendered** (`facts-r8/`), each beside a tall, a square, a landscape and a
  wide photo, and beside an emoji:
  - All keep the picture and the whole sentence, and print at 60 to 76pt on five lines, nothing
    past the edge.
  - The photo is a 105mm square beside the words instead of 141mm, centred.
  - On a portrait sheet all 48 are still refused (24 letters a line), but no saved sticky card is
    portrait.
- **"A second card" before the shorter sentence:** follows. His first answer put a second card
  before the picture comes off, and a sentence never cut. His second answer was about one
  sentence, where a second card cannot apply.
- **"Picture off last" for every wall sentence:** follows, from his first answer as recorded
  ("taking the picture off is the very last move").
- **The two-line rule's exception:** needs asking (In short, item 2).
- **Low:** for a sticky fact the last step no longer gains anything, since with no picture the
  budget is also about 106 letters. In practice the photo always stays and the sentence is
  shortened.

## 4. Undo checks (each on a scratch copy, restored byte for byte)

| Undone | Result |
|---|---|
| Round 4: grid sums not a turn; starter grid sent back; `--settled` on the designer's check or Track A; refused at the full share; principle 4's old reason | caught |
| Round 5, the page model: line at 1.3; edge at 0.4in; letters narrower; no rounding margin; step padding; caption uncounted; page model off | caught |
| Round 5, his order: no third line; four lines; a narrower share; refusal shortens first; picture off early; rule 8, the budget list, principle 4's exception, principle 5, the focused repair or the sticky row reordered or removed | caught |
| Round 5's misses (stems unpaged or unindented; definitions unpaged; a dominant figure's reserve; the third line given to drawing cards) | missed on round 5, **all caught now** |
| Round 6: the pair planned stacked; the picture beneath the pair forgotten; a stacked figure at its full reserve | caught |
| Round 7: the heading strip's padding flat again | caught |
| Round 8: the panel cards' font list without the arrow face; arrow widths halved | caught |
| Round 8: the arrow face taken out of titles and captions, grids and tables, display cards, overviews, sections, or the page's default; the bold arrow face dropped; the arrow widths dropped | **missed** (In short, item 3) |
| Round 8: the arrow face widened to every character | passes, but changes nothing (Comic Sans draws its own characters first) |

## 5. Suites, replay, dashes

- **Suites** (`run-all-suites.sh 7achk3`, venv first on PATH, 06:45 to 06:53, on the finished
  tree), all green:
  - python 2,276 passed, 1 skipped
  - voice 21
  - builder 772
  - worksheet 771
  - stick-in 73
  - wall 163
  - shared 126
  - test 46
- **Replay** (`replay.py`, the 31 scripts on a clean `git archive b1c2d427`): 974 files, content
  identical, none on one side only, 65 differ in line endings only. The mapping is identical byte
  for byte, and the ledger differs only by the lead's own two entries.
- **Dashes:** no em or en dash added. The only file with more is the new pin file, which quotes
  existing text. The five change scripts and two test files of rounds 6 to 8 have none.

## 6. Round 9: the heavy arrow

The arrow face is now Segoe Print's own arrow at 140%, with its ascent and descent held under
Comic Sans's line.

- **Replay:** the 33 scripts on a clean `b1c2d427` copy: 975 files, content identical, none on
  one side only, the mapping identical byte for byte. The live tree equals the replay.
- **Arrow stress test again:** 178 cards drawn at 36 to 80pt. None prints past its panel or into
  its padding, and the planned lines and heights equal the printed ones. The saved walls and the
  sweep are unchanged from round 8 (nothing past an edge or in the padding).
- **Do the arrows leave their line?** Lines of ↑ ↓ ← → ↔ were set between empty lines at 20, 36,
  60 and 100pt, bold and regular, and every dark pixel was measured.
  - A line holding arrows is exactly as tall as one without (37, 67, 111 and 186px).
  - The arrows' ink stays inside their own line at every size: at 60pt it runs from 10px below
    the line's top to 2px above its bottom.
  - Nothing reaches the line above or below. In a wrapped paragraph the up arrow sits clear of
    the descenders above it (`arrow-para.png`).
- **The look:** the shaft is now as heavy as the digits beside it (the test holds it at 10px or
  more at 60pt). The rounding wall's "3,462 → 3,500" reads clearly (`round-r9-crop.png`).
- **Undone, one at a time** (`mutate9.py`): the 140% size, the held ascent and descent, the face
  back to Arial, the arrow widths back to round 8's, the arrow face out of the grids' font list,
  and out of the page's default. All six are caught.
- **Suites:** the wall suite passes (165). Every pin test passes (starters and sticky, vocabulary,
  success criteria, colours, assumed knowledge, quick checks, teach then do, worksheets and
  subject files).
- **Dashes:** none added. Round 9's scripts and its new test have none.
