# Brief: independent check of the Teach then Do change (4.2.285)

You are checking someone else's work. The teacher who owns this plugin, Daniel, set one condition above all others for this job: "A shorter file that loses a rule is a failure however clean it reads." Past tidy-ups reworded rules, reported that nothing had changed, and quietly dropped things. Your job is to find anything this change lost, softened, widened, contradicted or got wrong, before he reads it. You did not write it, which is the point: the author cannot see their own blind spots.

## What changed, and where to look

- The plugin: `C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4`. The change is uncommitted; `git diff HEAD -- plugins/lesson-v4` (run from `C:\Users\Daniel\Projects\lessonv4`) shows all of it, and `git show HEAD:<path>` gives the old text of any file.
- The rule list (ledger): `plans/2026-09-22-teach-then-do-ledger.md`. Every place the plugin said anything about the Teach then Do rhythm, 309 rows, each with its own words in «guillemets», when it applies, its strength and exceptions.
- Daniel's decisions: the same ledger, sections `Decisions taken (23 September 2026)` and `Second round`, then `Decisions for Daniel` for what each decision number proposed. His answers are the authority. Where his words and the proposal differ, his words win.
- The mapping: `plans/2026-09-23-teach-then-do-mapping.md`, which claims a new home for each changed row. The change plan: `plans/2026-09-23-teach-then-do-change-plan.md`.
- The pins: `scripts/tests/teach_then_do_ledger_pins.json`, checked by `scripts/tests/test_teach_then_do_ledger_is_kept.py` through `scripts/tests/ledger_pin_checks.py`.
- The worked example of this whole method, with its own check reports: `plans/streamline-tools/vocabulary-example/` (read `change-independent-check.md` for the depth expected).

## What to check

1. **Row by row, every changed row** (the mapping lists them). Read the old words (ledger and `git show HEAD`) beside the new ones. Look for a lost condition or exception, a strength that dropped ("must not" becoming a description, a defect becoming a tell), a rule that widened or narrowed, an example lost, a pointer that summarises a rule and drops its alternatives, and a fold that kept the narrower of two copies. Quote old and new for each finding.
2. **Decisions applied faithfully.** For each of the twelve, does the change do what Daniel said, no more and no less? Decision 3 and his second-round reply (the random-slide test) and decision 4 (a discovery lesson may discover two things) changed from the original proposal; check they follow his words, not the proposal.
3. **Unchanged rows really unchanged**, including rows whose paragraph moved (the skill route's cycle rules moved above `## Output Format Block`; the task route's staged-task rule moved). A moved rule that now reads differently because its neighbours changed counts.
4. **Collateral.** Anything in the diff no decision or ledger row accounts for. Anything elsewhere in the plugin that now contradicts the new wording (search the whole plugin, not just the changed files).
5. **The code.** `validate-lesson-design.py` and `lesson-design-scaffold.py` now accept more discovery shapes; `design-review-packet.py` moved the rhythm to the always-read list and changed two triggers. Look for shapes accepted that break the rhythm, things the reviewer no longer sees, and tests that were weakened rather than moved. Run the Python suite (`python -X utf8 -m pytest scripts/tests -q -p no:cacheprovider` from the plugin folder).
6. **The pins.** On a scratch copy (copy the plugin into your scratchpad and work there, never in the repository), try to break a rule without the pin test noticing: delete a sentence, move a paragraph out of its section, reword a changed rule, soften "must not", bring a retired phrase back somewhere else, add a sentence to the rhythm home that negates a rule. Report each attempt and whether it was caught.
7. **Plain honesty checks.** The build-log entry for 4.2.285 in `references/build-review-log.md` (still being written) and the stories it says it holds: are the four stories that left the files really in the log first? Does any new plugin text use an em dash or en dash (Daniel does not want them in anything written for him)?

## Limits

- Change nothing in the repository. The pin experiments happen on your scratch copy only.
- A different sound wording is not a finding. A finding is a rule lost, weakened, widened or contradicted, a decision misapplied, a code or test gap, or a pin that misses real damage.
- The total size went up about 4 KB. That is Daniel's new decisions adding text; it is worth a line if you find a fold that could honestly be tighter without losing anything, but size is not the question you are answering.

## Your report

Write it to `plans/streamline-tools/teach-then-do-change-check.md`, in the shape of `vocabulary-example/change-independent-check.md`: what you did, then findings under numbered headings, most serious first inside each, each with the quoted old and new text, and one line per thing you checked and found sound. End with a short list of the findings you would fix before release. Then reply with a summary of no more than fifteen lines.
