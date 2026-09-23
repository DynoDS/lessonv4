# Brief: independent check of the repairs to the assumed-knowledge change (4.2.287)

You are the second fresh reader. A first independent check read the assumed-knowledge change and wrote `plans/streamline-tools/assumed-knowledge-change-check.md`. The repairs it asked for, and one new ruling from the teacher, have since been made. Your job: check the repairs are right and complete, that they broke nothing, and that the whole change now stands. The teacher's condition: "A shorter file that loses a rule is a failure however clean it reads." You did not write any of it.

## Where to look

- Everything in `ak-change-check-brief.md` (beside this file) still applies: the plugin, the old text at HEAD (`git diff HEAD -- plugins/lesson-v4` from `C:\Users\Daniel\Projects\lessonv4`), the ledger and its decisions, the mapping, the pins, the change plan.
- The first check's report: `plans/streamline-tools/assumed-knowledge-change-check.md`, its closing list "What I would fix before release".
- The repair scripts: `plans/streamline-tools/ak-change/r1_repairs.py` to `r7_log_pictures.py`, and the updated `build_ak_mapping.py`.
- **The teacher's new ruling**, recorded in the ledger's decision 7, third round: asked whether where a picture came from should be on the board or said by the teacher, he answered "We're over complicating it. I don't think there should be any words. Just show the picture. The teacher can say it if they need to. Doesn't need to be in the speaker notes. Doesn't need to be on the board." It was applied to pictures (an artist's drawing, a photograph of a place today); written sources keep their honest labels, a made-up child is still labelled as made up, and a caption children use (which picture is which, a place's name, a source's date and maker) was left. Judge whether that reading is faithful, too narrow or too wide, and whether anything in the plugin still asks for words about where a picture came from.

## What to check

1. **Each item of the first check's fix list**: done, done differently (and is the difference sound), or not done. Quote old and new.
2. **The repairs' own words**: anything lost, softened, widened or newly contradicted by them. In particular: the name paragraph's new scope ("a thing the lesson meets on the way") and the reviewer's matching lines against the vocabulary rule's three repairs; the reminder now reaching any earlier lesson; the home's "seen worked" condition; the reviewer's pointer naming both limits.
3. **The code repairs**: the names list's added opening words and pronouns, and titles adding to what is known. Run it over the saved `lesson-design.json` files (under `C:\Users\Daniel\Projects\lessonv4`, excluding `node_modules`) against HEAD's: names lost, noise added, crashes.
4. **The pins after the repairs**, attacked again on a scratch copy of the WHOLE plugin folder (everything except `node_modules`, the ledgers beside it; run the pin tests once on the untouched copy first). Repeat the first check's experiments that were not caught and are now claimed to be (D24, D25, D27, D30, R01, R02, R05), try the new picture ruling (put a "drawn recently" caption rule back, in the playbook, history and the slide designer), and anything else the repairs touched. Report each attempt: caught by the pins, by another test, or by nothing.
5. **The full suite**: `python -X utf8 -m pytest scripts/tests -q -p no:cacheprovider` from the plugin folder.
6. **Honesty**: the 4.2.287 build-log entry, the mapping and the earlier topics' pin outcomes, against the files. Any new em or en dash in plugin prose.

## Limits

Change nothing in the repository. A different sound wording is not a finding. Use your own scratch folder (name it `akrep` under `plans/streamline-tools/scratch/`) and do not clear any other folder there: another agent is building a list in the same area.

## Your report

Write it to `plans/streamline-tools/assumed-knowledge-repair-check.md`: what you did, numbered findings most serious first with quoted text, one line per thing checked and found sound, and a closing list of what you would still fix before release. Reply with a summary of no more than fifteen lines.
