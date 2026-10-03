# Overnight 3 October 2026: fixes for the run log's repeat problems

Daniel asked: fix every partly-fixed and not-fixed repeat problem from the shared
run log (`~/.lesson-resources/Lesson run log.md`, 12 runs, 29 Sept to 2 Oct),
do a final check, then turn the PC off. Nothing committed, pushed or installed
(testing phase). All on main's working tree, alongside other chats' uncommitted
4.2.308 work.

## Done

1. **Photo site's hourly limit read as "wrong password".** Two faults, both fixed.
   - `unsplash_fetch.py` and `openverse_fetch.py`: a 403 with `X-Ratelimit-Remaining: 0`
     or "rate limit" in the body is now `rate_limit`, not `auth`.
   - `validate-image-scout.py`: an un-retried `rate_limit` now counts as a shut
     rung, so a later rung's winner stands (outage note says "quota spent").
     A real bad key (`auth`) still blocks.
   - Scout reference sentence updated. Tests added; a mutation check confirmed the
     new test fails without the fix.

2. **A swapped picture muddling later stages.**
   - `validate-lesson-design.py`: after Phase 1 (no `--initial-photo-namespace`),
     picture numbers may have gaps, so a replacement takes a new number and
     nothing is renumbered. Phase 1 stays strict.
   - Playbook content-gap wave paragraph says so, and relaunches the blocked
     designer on the current `photo-requirements.json`.
   - `finalize-picture-assignment.py` provenance: a picture a revision took out
     is kept as a retired row (PICTURE_RETIRED), when its receipt matches an
     unchanged Phase 2 or wave snapshot. Early-adaptation leftovers still need
     `--early-wave-snapshot`; stray receipts are still refused.
   - `validate-run-report.py`: a retired picture no built resource names no
     longer blocks COMPLETE; it must still be named in the report.
   - Checked on the real Nativity folder: the three retired receipts are now
     accepted; its renumbered wise-men picture still fails, which is the
     renumbering the new rule prevents.

3. **Repairs refused for harmless changes.** `check-repair-scope.py`:
   `columnWidths` and `photoRefs` are layout; a picture the picture stage's own
   receipts end as omitted/unsatisfied (no file) may be dropped. Found
   automatically from the receipts, so no agent wording was needed (the repair
   agent is at its size cap). `--omitted-picture` also exists. Rerun on the five
   real past repairs: all four wrongful refusals now pass; the renga slide-4
   repair passes with no flag.

6. **Vocabulary slides.** `check-optional-pictures.py` has a seventh reason,
   `vocabulary-slide`, accepted only on a vocabulary slide (same test the
   builder uses). Reference table and decorator role updated.

## Not changed, and why

4. **Worksheets too big.** Investigated, no change. Measured all 42 real
   questions from four lessons with the engine's own `suggest.js --measure`:
   item heights are close to the planner's price list (tables median 40mm vs
   55mm priced, written answers 22mm vs 25mm), and the printable page is 267mm,
   not the 250mm the planner budgets. The planner itself priced most of these
   sheets at or over the edge (271, 253, 250, 245mm) and named the cuts. The
   one big miss (Y6 Below measured 336mm vs 253mm planned) can't be traced
   because the first draft wasn't kept. Next useful check: keep the worksheet
   designer's first preflight measurement in the run, so the next overrun
   shows which part grew.
   Daniel's real question may be the cut itself (Below lost all its 11
   practice): that is a teaching choice to put to him.

5. **Wall drawing text smaller than its steps.** Needs his eye; not touched.

Soft pictures and 18pt criteria: no change (genuinely small originals,
already flagged; 18pt is his floor).

## Checks

`run_all_checks.py`: all green (python 2,557, builder 914, worksheet 805,
stick-in 89, wall 183, shared 197, root 46, voice 21). One independent
reviewer read tonight's changes; its findings and what was done about them are
below.

## Independent review

One independent reviewer (fresh context, Opus) read tonight's changes and found
six things. All six were fixed, and every check was rerun green (4,815 passed).

1. The repair check removed a whole object naming a missing picture, so a
   card's words could vanish unseen. Now only the picture keys are released;
   a whole object goes only when it is a bare picture. Test: a sort card's
   word is still counted.
2. A file merely missing from disk counted as proof of an omitted picture.
   The manual flag was removed; only the picture stage's own receipts
   (omitted/unsatisfied, no file) prove it.
3. A picture could leave the contract with no proof a revision took it out.
   Provenance and the run report now require a later wave's contract
   (`photo-requirements-w-N.json`) that dropped it.
4. A replacement could reuse a spent picture number. The design validator now
   refuses any id a frozen contract (Phase 2 or a wave) gave to another file.
   The playbook says "above every id used so far".
5. lesson-designer.md always validated with the strict flag. It now says a
   revision after the freeze validates without it.
6. A spent quota now makes the standby search owed. The generation and
   recovery references and a compiler comment now say so.

Low items left as notes:
- The playbook's "preserve exhausted pictures as history" (owner repairs)
  sits beside the wave's "lost entry leaves the contract". Both hold: the
  receipt is the history, and only a wave revision removes the entry. The
  playbook is at its size cap, so no clarifying sentence was added.
- Retired-picture matching uses the exact filename string, so a spec spelling
  a path differently would be missed.
- `wikimedia_fetch.py` and `web_fetch.py` still read every 403 as `auth`.
  Neither has an hourly quota like Unsplash's; a web 403 is usually bot
  blocking. Worth a look if it shows up in a run.

## Other ideas noted

- Pictures can't be reused across lessons: the trapper engraving was searched
  three times, the digestive diagram twice. Worth a look.
- No Teach layout takes a headline, one line and a question with no picture
  (Shaftesbury, twice).
