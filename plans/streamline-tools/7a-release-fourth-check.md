# Release 7A (4.2.293), fourth check: repair round 10, one three-line fact a card

Checked on the working tree over `b1c2d427`. Scratch in `plans/streamline-tools/scratch/7achk4/`
(`replay.py`, `undo.py`, `cases.js`, `sweep.js`, `scope/`, `probe*.js`). Nothing else changed.

## Verdict

The build does what he said, and no saved wall is newly refused. Two faults remain. His rule
says "repair first", but the named repair cannot pass the focused repair's own scope check in
the commonest case, so a wall that reaches the build with two long facts on one card is lost.
The test for his exact case, two long facts, is missing.

## 1. Built as he said

Each case was validated on the live tree, then on a copy with `a8i` reversed ("undone"):

| Card beside a photo | Live | Undone |
|---|---|---|
| two long facts (79 and 89 letters) | refused, both named, the move named | builds |
| 76 and 106 letters | refused, the move named | builds |
| three long facts | refused, the move named | builds |
| long, short, long | refused; the move (long, short, then long on its own) builds | builds |
| one long fact and two short | builds | builds |
| two long facts, no photo | builds (not touched) | builds |
| two long facts, emoji picture | refused like a photo | builds |

- **Saved walls.** I found 74 distinct saved walls on this machine (Projects, Documents,
  Downloads and Desktop). Every one gives the same result and the same message with and without
  the change: 65 build and 9 are refused for other reasons. No saved sticky card with a picture
  holds two facts over 72 letters, so none of those 9 is hiding one.
- **Wrong for three or more long facts.** The message says "Put the second long fact, and any
  after it, in order on a second card". Doing that leaves two long facts on the second card,
  which is refused again (tried). A wall can have at most two teaching cards, so three long facts
  cannot be fixed by moving them. One has to be shortened, which is the wall designer's job. The
  new test checks for exactly this misleading message, on a card of three facts.
- **Note.** "Long" is counted by letters (over the 72-letter budget), not by printed lines.
  Facts of 76 and 79 letters print on two lines at 36pt but still go to a second card. A
  71-letter fact prints on three lines but is not counted. This matches the budgets staying
  letter counts.

## 2. Repair first: where it is met, who repairs it, can a run lose its wall

- **The wall designer's own check.** This is `build.js --validate-only`, which its instructions
  tell it to run. The route does not enforce it: the packet check never draws the layout. Here
  the designer may split or shorten freely, so this is the real repair.
- **The build in `run-fixed-resource.py wall`.** It runs the same code. The route allows one
  focused repair and one rebuild, with no second round. A wall that still fails is excluded and
  the run is `BLOCKED`, with no wall.
- **The focused repair's move fails its own scope check in the commonest case.**
  `check-repair-scope.py` only accepts a list split over two cards when each card keeps two or
  more items (`value_sequence` needs two). Tried on sticky cards:
  - two long facts onto one card each: `REPAIR_SCOPE_FAILED`
  - long, long, short into long | long, short: `REPAIR_SCOPE_FAILED`
  - long, short, long into long, short | long: `REPAIR_SCOPE_FAILED`
  - long, short, long, short split two and two: `REPAIR_SCOPE_OK`

  So two statements are wrong for this refusal: the focused repair's line
  "`check-repair-scope.py` accepts a list split that way", and the log's "which a focused repair
  may do".
- **No move without rewording when the wall already has two teaching cards, or when a card has
  three long facts.** The focused repair is told to leave these for the wall designer. Nothing
  in the route sends it back to the designer.
- **Plainly:** yes, a run can end with no wall because of this refusal whenever the fault reaches
  the build. The only earlier catch is the designer running and following its own check.
- **Suggested, not made:**
  - let `check-repair-scope.py` accept a split in order where one card keeps a single item;
  - have the message for three or more long facts, or for a wall already at two teaching cards,
    name shortening by the wall designer;
  - add a test for two long facts and a scope test for the split.

## 3. Tests, replay, suites, dashes

- **With `a8i` undone, the new tests fail.** 2 of the 4 fail: the constant, and "Missing
  expected rejection" on three long facts.
- **Gap.** I let two long facts through, changing the comparison to `> longItemsAtFloor + 1` in
  both places. That still passes all four tests in the file and the whole wall suite (166 of
  166). Two long facts on one card is his exact case.
- **Replay.** All 34 scripts, replayed in order on a clean `git archive b1c2d427`, give
  "different from the working tree: nothing". That includes the pins and the mapping.
- **Suites.**
  - Wall suite: 166 of 166 pass.
  - Python: the eight ledger pin tests and both repair-scope tests pass (197).
- **Dashes.** No em or en dash in any of these:
  - `a8i`'s additions
  - the new tests
  - the round 10 report section
  - the ledger entry
  - the log's added lines
