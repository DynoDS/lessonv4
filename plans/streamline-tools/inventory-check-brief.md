# Checking another agent's rule ledger (streamline step 2)

You are checking a rule ledger someone else built for one topic of the
lesson-v4 streamline. Daniel, a primary teacher, set the rule that whoever made
a list does not mark their own work, because past tidy-ups of this plugin
quietly dropped rules he had asked for. A missed rule matters more than
anything else you could report: a rule missing from the ledger can be lost
later without anyone noticing.

Read `C:\Users\Daniel\Projects\lessonv4\plans\streamline-plan.md` (the method
and its rules), then the ledger you are checking, including its topic boundary,
its decisions and its appendix of mentions judged to belong elsewhere. For what
a good check finds, see
`plans\streamline-tools\vocabulary-example\ledger-independent-check.md`: on
vocabulary it found 28 missed rules and 20 "duplicates" that were not.

The quotes have already been machine-checked (`check-ledger-quotes.py`); do not
re-verify that they exist. Spend your effort on judgement, and report under
these headings:

1. **Missed rules.** Search every instruction file in
   `plugins\lesson-v4\agents`, `references` (except the build log), `skills`
   and `commands` for anything that tells an agent what to do about this topic
   and has no row and no appendix entry. These rules often avoid the topic's
   obvious words. Give file, line, exact sentence and the group it belongs in.
2. **Duplicates that are not duplicates.** For every row marked a duplicate,
   compare it with the row it copies: does it carry a condition, exception,
   example or strength the other lacks? Quote the difference.
3. **Strength and scope.** Spot-check at least 30 rows: is the strength right,
   and does "when it applies" hold every exception the text gives?
4. **Disagreements.** Do the ledger's decisions describe real pulls, read in
   the actual text? List any pair it missed.
5. **Code and tests.** What `scripts/validate-lesson-design.py`,
   `scripts/design-review-packet.py` and the tests enforce or pin for this
   topic that the ledger omits or states wrongly.
6. **Stories.** Check the ledger's claims about which stories the build log
   already holds (search it case-insensitively).

Change no file anywhere except your report. Quote exact words; mark anything
unsure as unsure; do not list what is fine. Write the full report to
`plans\streamline-tools\<topic>-inventory-check.md` and return a summary of
under 300 words, most important first.
