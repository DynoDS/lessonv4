# 7A release, fifth check (repair round 11)

Checked round 11 (never lose a wall for his one-long-fact rule) against
`7a-release-fourth-check.md`'s finding, on the uncommitted working tree on top
of `b1c2d427`. All scratch work under
`plans/streamline-tools/scratch/7achk5/`; nothing else touched.

## 1. Four scratch walls, built through `run-fixed-resource.py wall`

- **One long fact + two short, on a photo card.** Built. Photo kept, all three
  sentences whole, no note (only one long fact, so his three-line-beside-photo
  rule alone covers it).
- **Two long facts, one card.** Built. Note printed naming the move; photo off,
  full width, both sentences whole.
- **Three long facts, one card.** Built. Same note, photo off, all three
  sentences whole, nothing clipped.
- **A wall that already has two teaching cards** (one non-sticky card plus a
  sticky card with two long facts, at the wall's two-teaching-card ceiling).
  Built, two pages, same note on the sticky card, photo off, both sentences
  whole. (A first attempt with three teaching cards on one wall hit the
  separate, correct two-card ceiling and was refused for that reason, not this
  one; redone within the ceiling.)

Looked at every rendered page: a wall came out in all four, every sentence
whole, the photo off only on the cards that needed it, and the note present
exactly where the rule fires.

## 2. The repair route

Built a five-fact card refused for height, split into a 4-and-1, and ran
`check-repair-scope.py`: the single-item second card passes
(`REPAIR_SCOPE_OK`). A drop (4 facts total, one missing) and a reorder (swap
the last two before splitting) are both `REPAIR_SCOPE_FAILED`, named by the
missing/moved sentence. `test_a_split_wall_arrives.py` run directly: 1 passed
(refuses the five-fact card, the split passes scope, the rebuild delivers the
wall).

## 3. The replay

`plans/streamline-tools/scratch/7ab/replay.py` run with no args (writes only
under its own `scratch/7ab/replay/`, against its own clean `p292` copy of
`b1c2d427`): all 36 scripts through `a12b_log_entry.py` exit 0, ending
"different from the working tree: nothing."

## 4. The suites

- `node --test` in `plugins/lesson-v4/working-wall-html`: 166 pass, 0 fail.
- `python -X utf8 -m pytest plugins/lesson-v4/scripts/tests -q -k "repair_scope or ledger or run_fixed"`:
  238 passed, 176930 subtests passed.

## Result

CLEAN.
