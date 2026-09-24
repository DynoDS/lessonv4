# Success criteria: the change plan (23 September 2026)

Step 5 of `streamline-plan.md` for topic 5, from Daniel's answers of 23
September and the read-back (both in the ledger's "Decisions taken", his words
first). One release, **4.2.288**, on `79426973`. Nothing is committed or
pushed until he says so. Baseline: `streamline-tools/sc-before-*.log` and
`sc-before-designs.json`.

## Every edit, by decision

1. **Green.** `preferences.md` → Success Criteria: every taught word (the
   lesson's vocabulary cards) is green, every time, even when it also names a
   coloured part of the picture; the designer still colours one or two other
   important words so a step is not all black. The launch check's refusal
   (validator) stops offering "take the word out of the criteria". The slide
   visual profile and the skill route's table line follow.
2. **A case that is extra knowledge.** The home, the voice guide and the skill
   route: a condition that is part of a step stays in it; a fact or a case that
   is extra knowledge goes to sticky knowledge or the teaching. "Goes under the
   steps as a note" goes.
3. **Never only some steps.** The home, the slide placement file, the templates
   and the build's two refusal messages: the whole list or none; a roomier
   composition, never fewer criteria.
4. **A criteria-only slide** is for criteria being taught, compared or built,
   and may fill the slide; never overflow. The templates' "when the criteria
   needs space", the placement file's "give them that slide of their own" and
   the panel refusal's "put them on their own slide" follow.
5. **Built live, and the wall.** The home, the designer, the contract, the
   drawLive check's note: the criteria are offered to the wall, which decides
   whether there is a wall; if they go up, they are the exact same steps.
6. **What criteria are.** The home: criteria are what a stuck child looks at
   and uses to do the task; in an explaining, discussing or writing lesson,
   sentence stems are criteria, inside a step or beside the steps. The table of
   facts stays a representation. The routes' stem banks and feature lists read
   against that. History's significance questions stay.
7. **Examples.** Rewritten: the contract's steps (`Read the question. / Choose
   the correct operation. / Work it out. / Check the answer.`), the slide
   catalogue's `steps`, the wall's `diagramSection` steps, and the wrap-around
   example (by decision 14). The worksheet `steps` example goes with decision 8.
   Question-shaped examples (`No tens? Exchange first.`, the sticky
   `Both? → overlap.`) are fine under decision 15 and stay.
8. **No criteria on worksheets.** The worksheet designer, the worksheet
   preferences, the designer's generated-worksheet notes, the contract,
   books-or-sheet and the helper catalogue say so; the validator refuses a
   non-empty `worksheet.successCriteriaRefs` for every sheet; the worksheet
   engine refuses the `steps` panel and its instruction refusal stops pointing
   at it. Tests and fixtures follow.
9. **A second sentence.** Not a fault in itself; one that only names what the
   step produced goes. His rounding example loses `That's the ten below.` and
   `That's the ten above.`; the reviewer's and the skill route's lines, and the
   review page's cue, follow.
10. **One home each.** Preferences (what criteria are for, when, form,
    principles, counts, colour, building live), the voice guide (how a step
    sounds, his rewrites), the skill route (step and table mechanics). The
    designer's section keeps recording, the read instruction and its
    self-check; copies become pointers carrying their extra conditions; the
    reviewer's "may stay" becomes "stays". The designer's "Explain the job
    electricity powers" story is copied to the log first.
11. **Out of date, seven places**, corrected; the build never withholds a deck
    over the criteria.
12. **The wall never rewords a step.** Its length rules and repair say: a
    criteria step is never shortened, split or reworded; the card makes room
    (no picture, or the list over two cards).
13. **A table stays a table.** "Give the same criteria as lines" goes; the
    slide designer makes it fit. Fitting a very large list (perhaps a new
    layout) is a separate investigation, not started without his word.
14. **Wrap-around.** Carry the first method's needed steps in its own words.
15. **Questions as steps.** A short question step (`Same? Move right.`) is fine
    when it tells the child what to do next or what to look for; so is an
    `If...` sentence. The voice guide, the skill route and the review page's
    cue follow. His 13 September rewrite pair stays exactly.
16. **Named without saying how** only when secure from earlier lessons;
    "just-taught" goes.

## After the change

Map and pin with `ledger_mapping.py` (392 rows); other topics' pins moved where
this touches them; every suite; saved designs compared; two independent
checks; build-log entry; both `plugin.json` bumped; report.
