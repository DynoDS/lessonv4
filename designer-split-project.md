# Designer split project

One piece of work, tracked here so it survives new sessions: splitting the
Lesson v4 lesson designer into a stage that decides the lesson and a
fresh-context stage that writes the final words. This file lives at the
repository root, outside `plugins/lesson-v4/`, so it is never shipped inside
the installed plugin.

**Any session resuming this project reads this file first, then continues
from the first open decision below.** Settled decisions stay settled: reopen
one only when Daniel asks, or when implementation uncovers evidence it cannot
work, and then by putting that evidence to Daniel in plain English, never by
changing course silently. Decisions are made with Daniel one question per
message, in plain English with no code jargon, using his preferred shape:
what happens now, what I think, what I suggest, then one clear question.
Mark progress ("that's 2 of 5") so he can see where the project is.

## The problem being solved

- The lesson designer's instruction file grew from 66KB to 90KB in three days
  (28 to 31 Aug 2026): every escaped failure added guidance, and new variants
  kept escaping past rules that were already active.
- The designer writes every final child-facing and spoken string at the end of
  one long run, and its own instructions admit the voice drifts furthest there.
- The semantic review runs only after all the wording is written, so a wrong
  early decision costs up to two full redesigns of everything.

The full investigation and verdict are in the session that opened this
project (31 Aug 2026, versions 4.2.45 to 4.2.46). The verdict corrected an
external AI's advice on three points worth remembering: most of its
"move to code" list was already done; `design-decisions.md` is written first
as a thinking anchor and must not become a generated summary; and a separate
blueprint file format was rejected for the reason under Settled below.

## Settled decisions

1. **Split, in this shape.** One agent decides the lesson; a review happens
   while the design is still compact; a fresh-context agent then writes the
   final wording once, with the voice guides loaded and no authority to
   change decisions. Reason: the wording is written last and drifts most, and
   a fresh context is the only real reset; a compact review catches a wrong
   route before it is expensive.
2. **Same contract, two passes, no new blueprint format.** The existing
   `lesson-design.json` is filled in two passes: the decider fills decisions
   and leaves child-facing strings as marked placeholders; the words-writer
   fills only those strings. Reason: meaning and wording live inside the same
   fields (a worked example is both the exact numbers and the child-facing
   sentence), so a separate blueprint would need a second schema, a second
   validator and a translation layer, the exact machinery recent work has
   been deleting.
3. **A words-writer that cannot express a decision reports the gap.** It
   names precisely what blocks it and hands back; it never redesigns
   silently. Reason: silent redesign is the drift the split exists to remove.
4. **Growth freeze on the designer's instructions.** Until the split is
   tested, wording-drift failures in `agents/lesson-designer.md` are answered
   with enforcement (validator, code, tests) or left for this project, not
   with new guidance paragraphs. Reason: the file's growth is itself the
   failure being fixed. Limit: a failure that genuinely cannot wait and
   cannot be enforced in code may still add guidance, with a note here.
5. **Daniel's pipeline keeps working throughout.** He teaches with it daily
   and installs from main. Whatever the rollout route (open decision 2), no
   state may be published where a normal lesson run is broken.
6. **The words-writer takes all the words from day one** - slides, spoken
   script and worksheet questions alike (Daniel, 31 Aug 2026). Reason: one
   writer means one voice and one owner, and the worksheet is where tired
   end-of-run wording has hurt most. Accepted cost: a bigger first version,
   so the first test lesson carries more weight.

## Open decisions, in order

1. **What happens to the review.** Today one reviewer checks everything after
   design. The compact early review of decisions is settled; open is what the
   after-wording check looks like: the current reviewer trimmed to wording
   and local fixes, or kept whole at first and trimmed later.
2. **How the switch happens.** Side-by-side testing while the old route keeps
   serving real lessons, or switch over and test on real runs. This sets the
   git route (branch versus staged commits), which is a technical consequence,
   not a question for Daniel.
3. **First test lesson and the bar for switching.** Which lesson runs first,
   and what result counts as good enough.
4. **How hard the words-writer thinks.** Same maximum effort as the designer,
   or one notch down for speed, since it expresses settled decisions rather
   than making them. The external advice suggested testing the lower notch.

## Test lessons for before and after

Lessons that each exposed a distinct real failure, to be re-run on the same
briefs once the split exists: circuit symbols (expanded into the wrong
learning), electrical appliances, balanced diet, rainforest, four-digit plus
or minus three-digit numbers. Do not change voice rules at the same time as
the architecture, or the comparison shows nothing.

## Status log

- **31 Aug 2026.** Project opened. Investigation and verdict done; external
  advice verified against the repository (its evidence held; its blueprint
  format and generated decisions record were rejected). The one enforcement
  fix shipped separately as 4.2.46. Daniel said yes to the project and asked
  for this tracking file. Decision made the same day: the words-writer takes
  all the words from day one (settled 6). Next: open decision 1, the review.
