# The voice guide release (topic 8, release 5): the independent check

Checked on 26 September 2026 against `voice-release-brief.md`, the change plan's section 6 (with sections 0, 1, 7,
8 and 10 to 13), his words in `plans/2026-09-23-teacher-voice-ledger.md` and the rest-of-preferences ledger (his
speaker-notes answer), the week 3 science deck (`scratch/vgb/week3-science-tooth-decay.pptx`, read with
python-pptx), and the builder's report. I wrote none of the release. Nothing in any copy was changed except this
file; every trial ran in `plans/streamline-tools/scratch/vgchk1/`.

## In short

**Must be repaired (all small, words or one script):**

1. **The guide misstates his lesson by about fifty words.** Its new speaker-notes part says one slide's script
   "ran to nearly two hundred words". That script is 149 words; 184 is only reached by counting the teacher
   information line under it. Since the part exists to calibrate how long a script is, the number should be
   true: "about a hundred and fifty words". The four quoted lines are exact.
2. **The merge script stops on the routes release as it now stands.** The routes release has since reworded one
   more row of this list (VG-O41, the content route's "That doesn't mean" paragraph). The voice mapping does not
   know it, so the follow-at-merge script fails with "VG-O41: changed but not mapped". With one entry added, the
   whole merge works and every Python test passes. The report and log also say "two rows" where it is now three.
3. **One trigger got narrower in a fold.** The lesson designer used to send "a comparison or critique prompt" to
   §12; it now follows the guide's route, which says only "a comparison prompt §12". Adding "or critique" to the
   guide's route puts it back (§12's own heading is "Comparison and critique prompts").

**Smaller tightening, worth doing in the same pass:**

4. A paragraph slipped in between the guide's title and its Purpose section is caught by no test (tried against
   the 95 test files that read these files). One assertion closes it.
5. The adaptation designer's new pointer can be read as "move the words onto a separate sheet". Reordered, it
   cannot.
6. Six retired wordings are barred only in their own file although they appear nowhere else; they could be barred
   everywhere.
7. Making the RE slide a plain example dropped "Year 4", which leaves "a nine-year-old" as a fixed reader, the
   phrase he questioned on 24 September.

**For him (or the lead) to decide:**

- **His speaker-notes answer is only half built.** The guide now quotes him ("it doesn't have to be short
  sentences"), but the lesson designer's own notes line, which is what writes every script, still says "short
  straightforward sentences" for "a nine-year-old". The plan leaves that line to release 7B, which is scheduled
  with the tidy-ups last, so the two will pull directly against each other until then. Either bring that one line
  (and the other three "nine-year-old" lines, the voice list's decision 13) into this release in 7B's planned
  words, or accept the gap and tell him.
- **The four things taken from his lesson are the builder's reading of it**, as the brief asked; he has not seen
  them. Show him with the release, with the builder's open question: his notes repeat a phrase for rhythm ("a tiny
  bit ... a tiny bit more"), which the guide warns against in writing.

**Confirmed:** nothing else lost or softened (433 rows word for word, the other 30 read old against new); his
decisions built as he said them; nothing of release 6 built early; only the one size limit moved; pins and test as
the report says; the scripts replay exactly; 30 of 31 undo attacks caught; the harness still meaningful; every
suite green in the worktree; no em or en dash added.

---

## 1. Nothing lost

Every one of the 470 rows is pinned; 433 stand word for word where they were (the pin test holds them). I read the
30 this release changed, old against new, for meaning and strength.

**Kept, moved with a true reason, or strengthened:** A02 (the Maintenance note's first sentence now in Purpose),
A06 and A07 (§7 and §14 routed), A10 (four kinds, with the designer's reason word for word), A11 (the three
prompts copied to the log first; the reason stays), A12 (unchanged, with one plain sentence giving "Every one" its
antecedent), A16 and A17 (the maintainer lines, whole, in the harness read-me), C05 and D15 (dates off, his words
exact), C13 (one plain telling keeps the reason), D19 (his humour words), D25 (log only; the entry says "never
maths" no longer stands), F12 and K29 (the class clause), J13 (the em dash raised from "avoid unless" to "Never
use", matching Written Voice and the program), J27 (both teacher lines, and the order is true: the slide designer
prints `On the board:` before the script, teacher information after it), K24 to K26 (the speech guidance's own
list, word for word), L04 and L20 ("normally"), L27 (§16H named), L46 (the discussion clause), M11 ("That section"
named), N14 (a true repeat; its fuller copy two lines on, «supporting difficult necessary words through a clear
picture, labelled word bank, pronunciation cue or previously taught meaning», stays), Q02 and Q13 (both now true:
the held-out file holds 112 cases, 61 history and 51 science; the register paragraph sits in the reviewer's first
section, `Material-defect boundary`). The dash replacements (four in the activity list, one each in the dialogic
and task routes, the research file, three in preferences) change punctuation only. The stories the plan names
(A11, L18, O07, O49, P04, Q29) are in the log with the runtime sentences they quote still in place; L61's tooth
slide is copied by the routes release, and on the merged tree `vg_09` confirms the log holds it.

**Finding 3, a trigger narrowed (M05, settled item 1).** Old, the lesson designer's own route:
«§11 a misconception warning, §12 a comparison or critique prompt». New, the designer reads the guide's route
instead: «a misconception warning §11, a comparison prompt §12». Every other kind in the old list is in the guide's
route (a vocabulary definition is a definition; §§1 and 3 for a script are the core sections plus §16H). A fold
carries every condition either copy held, so "or critique" should join the guide's route («a comparison or
critique prompt §12»). That paragraph is pinned by the success-criteria and vocabulary pin files as well as this
list's, so the repair moves those pins too.

**Finding 5, a pointer that reads two ways (N12, settled item 6).** Old: «Keep essential subject vocabulary and
proper nouns, supporting them with examples, visuals or plain-language bridges rather than automatically replacing
them.» New: «Keep essential subject vocabulary and proper nouns on a separate Below resource as Written Voice's
Below paragraph says: supported, not automatically replaced.» The means of support now live only in Written
Voice's Below paragraph, which the designer applies, so nothing is lost; but "keep ... on a separate Below
resource" can read as "put them on a separate resource". Suggest: «On a separate Below resource, keep essential
subject vocabulary and proper nouns as Written Voice's Below paragraph says: supported, not automatically
replaced.»

**Finding 7, a fixed reader made generic (C13).** Old: «A Year 4 RE slide printed `What do their reasons share?`
... The board got the clever one, and `share` means something different to a nine-year-old than it does to an
adult.» New: «A slide that prints `What do their reasons share?` ... where `share` means something different to a
nine-year-old than it does to an adult.» With "Year 4" gone, "a nine-year-old" becomes the fixed reader he
questioned ("I actually don't know why it says nine-year-old ... the plugin is for years one, two, three, four,
five, and six"). Keeping "A Year 4 slide that prints" fixes it without restoring the incident. Not one of decision
13's four places, so small.

**Noted, not a finding.** The Maintenance note now lives only in the harness read-me, with no pointer from the
guide, so someone editing the guide no longer meets "Do **not** keep expanding it every time one sentence is
corrected." That is the plan's approved move.

## 2. His words, decision by decision

- **Decision 1 ("yes"):** built as the plan words it. **Decision 2 ("yes"):** the clause is his read-back almost
  word for word («Before the case means before the question about it: when the thing is on the board, the sentence
  about the thing in view comes first and the general one straight after.»); his own order in §6 is untouched and
  tested. **Decision 4 ("yes"):** the three triggers carry the speech file's list exactly; no other trigger list
  exists (searched). **Decision 12 ("yes"):** his read-back's clause, exact.
- **Decisions 9 and 10 ("Humour wherever", "humour is allowed in pshe"):** «in every subject, maths and PSHE
  included: in the teacher's words, "Humour wherever" and "humour is allowed in pshe".» The melons line, the
  calculation-steps "often" and the sensitive-issue limits stay, as the read-back said. No runtime file carries
  "never maths" or a paraphrase of it (searched "humour", "joke", "playful", "straight").
- **Decision 11 ("Named but not always class 4a 4b etc, jazz it up"):** «Give it a name the first time it appears,
  and not always a class code like `Class 4B` (`Oak Class`, `the class at Hilltop School`, `the Hill Road team`)»;
  "plain ordinary" gone; the guide's one clause beside its examples. True to him.
- **Settled items 1, 5, 6, 8:** built as listed (findings 3 and 5 above); 3, 7, 14, 15 unchanged, and his two
  calibration examples another list called stale (PF-D41, PF-F75) stay exactly and are tested.
- **Nothing of release 6 built early.** Only `When humour is optional` changed in §4; "keep it straight", the
  placement paragraph, the four-pieces budget and the reviewer's question are untouched. (His "do those humour
  fixes" of 26 September is recorded in main's copy of the diagnosis; release 6 is still to come.)

**His speaker-notes answer and the week 3 deck.** His words are quoted exactly («"it doesn't have to be short
sentences"», «"speaker notes are as long as the idea needs, of course, and they're also conversational, so it links
them nicely. It's talking to children. It just needs to think how can I talk to children to get them to understand
it."»). I read all 19 slides' notes. The four quoted lines are exact, from slides 5, 11, 4 and 11:

| Line in the guide | In the deck |
|---|---|
| `When those germs feed on that sugar, they make something. They make acid.` | slide 5, exact |
| `So there is a hole in the enamel now. Does the acid stop there? No. It keeps going.` | slide 11, exact |
| `Run your tongue along your teeth, near the gum. That slightly furry feeling? That's the plaque, and that's where the germs sit.` | slide 4, exact (slide 3 has a different version) |
| `What is it called? The pulp. And what did we say was in the pulp? Nerves.` | slide 11, exact |

**Finding 1.** The guide says: «the slide that built the whole idea out of what is in the children's own mouths ran
to nearly two hundred words». Slide 4's script (from `Say to children:` to its `Teacher information` line) is 149
words; the note is 184 only with the teacher information. Script lengths across the deck: 26 (the writing slide),
37 (one step of the chain), 54 to 117 for most, 149 at the longest. "One step ... a few short sentences" and "the
slide that sent them off to write said what to do and stopped" are true. Repair: "about a hundred and fifty words".
(The report's "184" and "two vocabulary words take 150" count teacher information too; the vocabulary script is
115.)

**Does the guide now teach notes that sound like his?** In the guide, yes: his words plus four true features
(length follows the idea; each note picks up the last; it talks to them about themselves; it asks and answers).
The lesson designer, which writes the scripts, is the gap: its line «The voice: clear simple language a
nine-year-old follows easily, short straightforward sentences» now stands against «So a script's length, and the
length of its sentences, come from the idea rather than from a target» in the guide it is told to apply. See "For
him to decide". Nothing added that he did not ask for, beyond the builder's reading of the deck, which the brief
asked for and he should see.

## 3. The cap

Only `test_make_lesson_runtime.py` changed a limit: `budget = 8200 if owner == "slide-designer" else 8000`. The
slide designer's repair is 8,034 bytes (7,927 before); the other five repair roles stay under 8,000 (the wall's is
7,996); the picture-scout's 8,000 in `test_picture_context_budget.py` and the playbook budgets are untouched. No
other test or code limit moved (searched every changed test and program for budgets and limits). Attacks: 150
bytes added to the wall's repair and 200 to the slide designer's repair are both caught.

## 4. Pins, replay, attacks, the harness

- **Pin file and test:** 777 rows (470 ledger rows, 5 added, 302 guide paragraphs in 18 sections, all but §10),
  27 retired wordings; the outcomes read true. **Finding 6:** six retired wordings are barred only in their own
  file though none appears anywhere else: «Do **not** keep expanding it every time one sentence is corrected.»,
  «Keep detailed calibration examples, rejected alternatives and testing history», «## Maintenance», «A Year 4 RE
  slide printed `What do their reasons share?`», «§§1 and 3 a spoken script», «Keep necessary subject vocabulary
  and use accessible support around it.». Setting them to everywhere is free.
- **Earlier topics' pins:** 23 moves in six files (AK-B04, B27, F01, G09; QC-A18, B06; SA-B18, J43, L21, PF-I06,
  PF-V16 and the starters home; SC-D42; TD-C19, J62; VOC-A02, C24, P02, P03, DEC-10, HOME-LD-01 and the designer's
  vocabulary home). I diffed each old against new: every one follows a sentence this release changed, and each
  outcome names the right decision. Colours, reviewer, subject-files and worksheets pins untouched.
- **Replay:** my own script (`scratch/vgchk1/replay_check.py`) took `git archive 91687471`, ran the ten scripts in
  the report's order, and compared every plugin file and the plans files the release writes: identical, the
  hand-written report aside.
- **Attacks** (`scratch/vgchk1/attacks.py`, on the replayed copy, its tests green untouched first): 31 made, 30
  caught. Caught: each decision undone (route §7, route §14, the designer's route, the case clause, the repair
  trigger, the playbook's widened half, the humour words softened, "never maths" written into the maths file, "plain
  ordinary" back, the guide's class clause, the discussion clause, "never the reverse", "not the other way round",
  the adaptation pointer, the staging note, a dash back in the activity list and in preferences, the harness "empty
  structure", the Maintenance note back in §17 and cut from the read-me, his words cut, a quoted line reworded, a
  length target slipped into the notes part, the Fireman story back, both budgets, the log's "no longer stands"
  sentence, a sentence added to §10, the §16H line). **Finding 4, missed:** «Maths lessons stay straight: no light
  lines in maths.» added straight after `# Teacher Voice Guide` passes all 95 test files that read these files,
  because the guide's homes start at `## Purpose`. A test that nothing sits between the title and `## Purpose`
  closes it.
- **The harness:** its 21 tests pass; it reads the guide whole and the reviewer's two paragraphs, whose openings are
  unchanged and pinned; the runner's and read-me's corrections are true. It measured nothing here, as the log says.

## 5. The merge to come

`scratch/vgchk1/merge_run.sh` builds a throwaway repository: base `59f85708`, main `91687471`, the routes branch as
its worktree's files stood at 13:37 (they were still changing: an earlier trial caught them mid-repair, one
routes test out of step with its own file), and this branch's files. Routes into main, resolved as
`rt_follow_at_merge.py` says (ledgers and log both, reviewer and pin files main's side, heading numbered 4.2.295),
then that script: `FOLLOW_OK`. This branch into that: conflicts only in five ledgers, the log and the rhythm's pin
file, every instruction file merging cleanly; resolved as `vg_09` says (heading numbered 4.2.296).

**Finding 2.** `vg_09_follow_at_merge.py` then stops: «VG-O41: not found in
references/teaching-sequence-content-based.md ... VG-O41: changed but not mapped ... MAPPING_FAILED 2». The routes
release now rewords the row's middle sentence. Old (the ledger's words): «A deck whose every correction opens `That
doesn't mean` has found one sentence and reused it, which is the same-shape fault above at the level of slides».
Routes now: «... which is saying the same thing three ways, at the level of slides; the teacher's ruling: "we want
variety, and sometimes it's not relevant just stating the misconception"». The builder's `ROUTES` table maps only
VG-L16 and VG-M49. With a stand-in O41 entry (`scratch/vgchk1/patch_o41.py`), the mapping builds (778 pins, 40
changed rows), the two later ledgers are recorded, and on the merged tree the whole Python suite passes, 2,379 and
1 skipped, and the harness 21. Both releases' words are all there (the dialogic route's Four corners gone and the
role-play dash gone; the case clause, "normally", the notes part and the routes' §5 sentence all present), and I
found no line where one release contradicts the other. Node suites were not run there (no libraries; no engine
changed). The failure is loud, as designed, but the entry must be added (from routes' final words), the report's
"two rows" and the log's "maps the two rows of this list that release rewords" made three, and the trial rerun
once routes is final.

## 6. The suites

`bash plans/streamline-tools/run-all-suites.sh vgchk1` from the worktree, the venv first on the path: python 2,322
passed, 1 skipped; voice harness 21; builder 772; worksheet-html 771; stick-in-sheets-html 73; working-wall-html
166; shared 126; test 46, all failing none, as the report says. No em or en dash added: counted exactly per file,
every changed plugin file has the same number or fewer; the four in the new mapping are quotations of existing
plugin text.

## Scratch

`plans/streamline-tools/scratch/vgchk1/`: `read_deck.py` and `count.py` (the deck), `pin_moves.py` (the earlier
topics' moves), `replay_check.py` and `replay/`, `attacks.py` and `subset.txt`, `merge_trial.py`, `merge_run.sh`,
`resolve.py`, `patch_o41.py` and `merge/` (the throwaway repository), `merged-python2.log`.
