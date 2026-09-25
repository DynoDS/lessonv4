# Independent check of the design reviewer ledger

Checked on 24 September 2026 against the plugin's working tree: lesson-v4 4.2.287 (`79426973`) with the success-criteria change (4.2.288) uncommitted on top. Read-only: nothing in the plugin or the ledger was changed. Scratch scripts are in `plans/streamline-tools/scratch/rvchk/`. Line numbers are working-tree lines.

**How the check was done.**

- A script marked every character of the reviewer's three files (`agents/design-reviewer.md`, `agents/design-reviewer-focused-repair.md`, `references/design-review-route-checks.md`) that some ledger quote covers. Coverage is complete: the only uncovered text is headings, the `Check:` lead-ins, the validator command block and the report template's placeholder lines. Nothing in the reviewer's own files lacks a row, so every missed rule below is in another file.
- Every instruction file in `agents`, `references` (not the build log), `skills` and `commands` was searched for review wording (reviewer, review, `REDESIGN`, `APPROVED`, Phase 1.25, routing card, runtime reference, review cue, judgement net, one net, quota, no cap, never a number, too much, Pride Lessons), and each hit on a line the ledger does not cite was read in its paragraph. The playbook's review step was coverage-checked like the reviewer's files.
- The packet program's printed strings were extracted by script and compared with the ledger's quotes (covered in substance; what is left is docstrings, error messages and success-criteria cues).
- The seven decisions were read against the actual text, the code, the tests, the behaviour fixture, the finished ledgers and tonight's other lists.

---

## 1. Missed rules

Ordered by how much a fold would lose.

1. **`skills/make-lesson/SKILL.md` L36-38: a second judgement after the review, stale.**
   «the retained Working Wall builder performs its required physical-output judgement.»
   The playbook builds the wall with `run-fixed-resource.py wall`, «Same command as the slides, worksheets and stick-ins; no builder agent» (L1149), and the wall builder's own description says it is «Not used by make-lesson». This is the sibling of RV-A10 (`FINAL RESOURCE REVIEW`): text saying something judges a resource after the design review, against his one-net ruling. No ledger has it (all ten searched), and none of the four tests that bar the retired review reads `SKILL.md`. Group R or T, shared with the playbook; it belongs in decision 5's list.

2. **`agents/adaptation-designer.md` L220: a reviewer that never sees these sheets.**
   «That is what the worksheet designer realises and what the reviewer checks; a support decision left implicit is one nobody downstream can tell from an oversight.»
   The design reviewer runs before the Below and Greater Depth sheets exist (RV-L10: «Below and Greater Depth sheets do not exist at this stage»), so no reviewer checks them. The worksheets list has the line (WS-L39) and settled it as its item 18, removing "what the reviewer checks", then handed on: "Whether a second reader should see those sheets is left for the reviewer topic." This ledger has no row and does not take up that hand-off (see heading 4, decision 6). Group T, shared with worksheets.

3. **`skills/make-lesson/playbook-lite.md` L341-348: the middle of RV-R10's paragraph is not quoted.**
   «Launch one focused clean-context `design-reviewer` job from the compact repair role `[PLUGIN_ROOT]/agents/design-reviewer-focused-repair.md` (if that file is missing or unreadable, use `[PLUGIN_ROOT]/agents/design-reviewer.md`), carrying the current canonical files, `design-review.md`, the exact validator failure lines, the prepared `validator.command` and the in-place editing rule from Phase 3.5, and tell it to repair only the fields the validator names, keep the meaning of its own correction, and leave the `Result` in `design-review.md` as it stands. Then re-run `design-review-packet.py verify`.»
   It carries a fallback (the full reviewer file when the repair role is missing) and the three limits the orchestrator gives the repair. RV-R10 quotes only the first and last sentences round it. Group R (the route into group Q).

4. **`skills/make-lesson/playbook-lite.md` L1229-1231, inside RV-R18's paragraph.**
   «Nothing waits on an unrelated sibling: Track A's build lands while the worksheet branch is still designing, and no stage after this one compares one resource against another.»
   The downstream half of the one-net boundary: no cross-resource review. Group A beside RV-A09, shared with the playbook.

5. **`references/teaching-sequence-skill-based.md` L43: a quote of the reviewer that the reviewer no longer says.**
   «(design-reviewer: "a task that only reformats the material it hands over")»
   The nearest words in the reviewer's file are RV-J38, «a child cannot succeed by copying, reformatting, reading a visible answer or following a predictable answer pattern». The quick-checks list holds it (QC-G33, "That phrase is no longer in the reviewer's file") and the routes list has the paragraph (RT-B21). This ledger needs a shared row in group T so a fold of J38 knows a route quotes it.

6. **The other side of decision 1, not listed.** The appendix names only `preferences.md` L788. These three say what happens when a Teach needs more than the ceiling, and they change decision 1 (heading 4):
   - `references/preferences.md` L543 (Slide Philosophy): «The limit is amount, and it is the ceiling in `Pride Lessons` → `How much a Teach slide holds`: about four pieces beside a picture. When the route needs more, the beat takes two slides, split where the teaching turns; the words never shrink, and they are never clipped to fit.»
   - `references/teaching-sequence-content-based.md` L122: «when it will not fit one board at the ceiling (`Pride Lessons` → `How much a Teach slide holds`) the Slide Designer splits the beat where the teaching turns»
   - `references/preferences.md` L790: «Ask what the extra line is before asking where to put it, and reach for the second slide first: the deck is allowed to be longer, and the board is not.»
   Group C, shared with the rest of preferences and the routes.

7. **`references/templates.md` L3024: his boundary, in the slide designer's reference.**
   «`SUCCESS_CRITERIA_CAPACITY` only reports, because a method with six real steps is a method with six real steps and "too much" is a judgement, not a number.»
   The topic brief asks for his boundaries "wherever they are written". No ledger quotes this sentence (SC-K13 cites the paragraph without it). Group A, shared with success criteria.

8. **Two more copies of "a review cue is not a failure"** (RV-S47, RV-T18), neither listed as a copy:
   - `references/slide-success-criteria.md` L37: «A word-count review cue is not permission to shrink text or bypass a failed build.» (SC-K06)
   - `references/teaching-sequence-skill-based.md` L124: «The review packet raises long steps and long lists for a reread, which is not a rejection and not a request to shorten.» (SC-D36, RT-D02)
   Group S, shared with success criteria.

9. **`agents/lesson-designer.md` L397**, the designer's side of RV-F14, with its own limit (written for the teacher, not the checker):
   «It is the surface the reviewer reads first and the one the teacher receives beside the deck, so it is written for a teacher reading it at 8:15am, not for a checker.»
   Near-duplicate of RV-A08. Group F, shared with the lesson designer.

10. **`agents/lesson-designer.md` L410**: «a slide whose line you cannot write is telling you something before any reviewer does.» Near-duplicate of RV-T15. Group T.

11. **Low.** Two downstream statements of the one-net boundary: `agents/working-wall-builder.md` L119, «Your page inspection and `[WORKING_DIR]/working-wall-build-evidence.json` are the wall's verification: nothing after you looks at it again.» (in an agent make-lesson no longer launches), and `agents/slide-designer.md` L574, «nothing reviews the delivered photograph's crop afterwards.» Group A, shared with topic 9.

---

## 2. Duplicates that are not duplicates

1. **RV-N09** «- full and displayed objectives;», marked a duplicate of H04 and CUT. The list it sits in opens «make one focused consistency sweep over the corrected design» (RV-N01): N09 re-checks the objectives after the reviewer's own corrections; H04 checks them before. The ledger keeps every other sweep line that repeats an earlier check (N05 of H07, N08 of J47). Near-duplicate with its own condition (after corrections); keep it.

2. **RV-O01** «Make a local correction only when one clear bounded change restores the settled lesson.», marked a duplicate of D01. D01 says «make a small local correction that restores the settled lesson without changing ...». O01 adds "one clear": a correction that needs more than one change, or is not clear, is not the reviewer's. RV-O04 uses the same test for the stimulus («correct the stimulus when that is one bounded change»). Near-duplicate; a fold carries "one clear".

3. **RV-K03** «The first wording pass above owns the voice sweep. Here judge the wording you noted in its teaching context; do not repeat a separate whole-lesson sweep.», marked a duplicate of G02 and G03. The middle sentence is an instruction neither carries: section 4 is where the noted wording is judged in its teaching context. Only the last clause repeats G02.

4. **RV-P08**, marked a duplicate of G13, also defines `[Y]` and `[M]`, which G13 does not. The proposed home (one copy beside the shape) keeps them, provided the copy kept is P08's.

5. **RV-F26**, marked a duplicate of the card's always-read list, is the compatibility route's only reading list: with no packet there is no card. The ledger does not propose a cut, but the word "duplicate" invites one.

6. **RV-K09** is marked CUT, which is right as meaning, but it sits in the paragraph assumed knowledge pinned whole (AK-A49). The group note says so; the row should too, so the cut moves the pin in the same release.

---

## 3. Strength and scope

Spot-checked 60 rows: A02, A09, A11, B01, B04, B07, C02, C05, C09, C10, C18, C21, D03, D06, E02, E06, E07, E08, F11, F13, F20, F22, F24, G04, G22, G24, G26, H15, H16, I03, I12, J05, J09, J21, K02, K17, M05, M14, N17, O06, O07, P02, Q08, Q17, R07, R10, and S14 to S31. Only faults are listed.

1. **RV-S14 to RV-S31 (18 rows), "may (a trigger)".** Each card entry is «Read when ...»: a conditional must, with RV-F21's «Read a conditional section from `preferences.md` only when its trigger in the runtime reference applies» as its limit. The ledger's own legend says "may" is a permission. A fold that writes these as permissions softens every conditional read, and decision 7 rests on them being binding.

2. **RV-K02, "every unit label".** Missing the maths exception at `preferences.md` L665: «**In maths, the plain words are what the teacher wants: `My Turn`, `Our Turn`, `Your Turn`, `Answers`, `Apply`.**» K02's own example of a slot label to rewrite is `Apply`. See heading 4, decision 7.

3. **RV-M05, "a made-up character".** The check says «Where a beat quotes, voices or refers to a made-up character»; the section it cites limits that: «The boundary against the paragraph above is whether a person is present in the beat or merely referred back to: two children whose words are on this slide are present, and a line recalling what the class concluded about them yesterday is not.» (`preferences.md` L637). The scope column should carry the limit.

4. **RV-C10, "check", no owner.** «Repair it to what they will notice, or, when the picture's own label already names the thing, take the line off the board». That changes a Teach board's example, which RV-C17 says is «content only the Lesson Designer writes». Same ownership question as decisions 2 and 3 (heading 4). The row is pinned by the rhythm (TD-L10).

5. **RV-Q08 and RV-Q17, "must (code)".** `NOT A REVIEW CORRECTION` appears only in the focused repair's own file: no script, test or playbook line reads it, and the playbook's route for this repair names neither it nor `REPAIRED`. It is prose. RV-R10's code names list `REPAIRED`, which that paragraph never uses (the playbook's only `REPAIRED`, L217, belongs to the lesson designer's repair).

6. **RV-R07, "no packet".** Misses RV-R09's exception: after the verified Phase 2 freeze, the direct-review fallback omits `--initial-photo-namespace`, which R07's quote tells the orchestrator to run.

7. **RV-A09, "after every branch has built its resource or been excluded".** The rule, «the design reviewer is the pipeline's one judgement net», is a standing boundary on the whole run; finalisation is only where the playbook happens to say it. This matters for decision 6.

---

## 4. Disagreements

The teacher asked for "no overcomplications". For each decision: a real pull (two places that disagree, a rule that looks wrong, or a fold that would change a meaning), or something a fold settles without changing anything.

**Decision 1, "never a count" beside "about four pieces": not a real pull, in my reading.** Read in full, the two already agree. The pieces ceiling is per board, and its repair is a second slide: «reach for the second slide first: the deck is allowed to be longer, and the board is not» (L790), and when a Teach route will not fit a board at the ceiling «the Slide Designer splits the beat» (content route L122; Slide Philosophy L543). "Never a count" is about the lesson's beats, slides, sources and words, and a second slide is exactly what it allows. The reviewer also judges beats before any slide exists. The ledger's suggested clause ("weighed as a judgement ... not failed on sight") paraphrases his calibration and drops its limiting half, «Six or more is over, however true each line is, and shortening every line is not the repair», which is the fault the plan warns about, and his calibrating examples are to stay exactly as they are. Suggest: no decision; keep both texts; if the fold touches RV-C05 at all, it points at the split rule without paraphrasing it.

**Decision 2, a photograph of a drawn tool: a real pull.** Confirmed. RV-O05 forbids adding or removing photo objects and choosing a new main representation; the after-review check refuses a changed photo count (RV-S52); and the initial validator requires every frozen picture to be cited, so the reviewer cannot leave the photograph unused either. No test pins M14's wording, and the behaviour fixture has no case for it.

**Decision 3, a Do that only repeats its Teach: a real pull.** J34 sits inside paragraphs pinned by quick checks, success criteria and the rhythm; the quick-checks list recorded "the repair is local and keeps the chunk" (QC-D08) without asking who makes it. It is the same question as decision 2 and as RV-C10 (missed). Suggest asking it once: when the fix changes what children see or have to think (a drawn tool for a photograph, a because question for a recap, a rewritten Teach example), the reviewer names the fix and the designer makes it. Three rows, one answer.

**Decision 4, board and script judged "together": a real disagreement, already decided in his own words.** His answer to assumed-knowledge decision 1 (23 September, recorded in that ledger): «Speaker notes and board should never be combined or seen as one.» The assumed-knowledge change reworded the reviewer's "spoken reason into a panel" line but missed RV-I07, and no ledger listed I07 before this one. Suggest: apply his existing answer as a correction and tell him in one line; no new question. The word "together" also appears in the pinned RV-C15 («Then uncover the script and read the two together»), where it is used board-first; the fix touches I07 only.

**Decision 5, five out-of-date texts: fold-settled, not pulls.** All five are confirmed: RV-A10's phrase breaks as `FINAL` / `RESOURCE REVIEW.` across L1151-1152, and all four guarding tests read the playbook raw; RV-P06's shape has no `Closest to a repair:` though `require_closest_calls` refuses a report without it; RV-O14, RV-T11 and RV-J18 are as stated. Each brings text into line with the code or with his 13 September ruling, and no meaning of his changes. Suggest: settle them as corrections, as the worksheets list did its settled items, and add the `SKILL.md` wall-builder "judgement" line (missed rule 1) beside RV-A10.

**Decision 6, the reviewer never hears it is the one net: not a real pull.** Nothing disagrees; it adds a sentence, and the ledger names no run where a reviewer let a fault through expecting a later check. RV-D06 already tells the reviewer «Every authored string ships verbatim - no downstream agent is permitted to reword it». Under "no overcomplications": drop it, or fold one clause into RV-A02 or D06. The one real question underneath is the one the worksheets list handed to this topic and this ledger missed: nobody reads the Below and Greater Depth sheets after their own designer. His 10 September ruling (log L1512, see heading 6) already answers it: no second judgement net. Suggest recording that as settled by his ruling, in one line.

**Decision 7, sections the card never opens: a real pull, and bigger than the ledger says.** The ledger says "What the reviewer checks does not change." It does, in both directions:

- **Slide Headings (RV-K02).** In maths the turn words and `Apply` are what he wants (L665, his 19 September ruling); K02 names `Apply` as a slot label to rewrite. A reviewer following K02 would retitle a maths Apply slide against his ruling, and the validator guards only the My, Our and Your Turn labels of a skill lesson, not `Apply`. This is already the starters list's neighbour note N1 (SA-J47); point to it rather than ask twice.
- **Visual-need boundary (RV-M05).** Opening the section narrows M05 to a person present in the beat.
- **Source and Scenario Integrity (RV-C18).** Opening it adds a check C18 lacks, «`she` and `he` belong inside the story, where the name has just been said», and the three-part repair with its limits (a real historical figure, a maths or English scenario).
- **Support (RV-K10 against RV-S28) is not a real mismatch.** K10's check is what raises the doubt that fires the trigger («Read when support or release to independence is in doubt»). Four cases, not five.
- **It is a code change.** The card's entries are `PREFERENCE_REVIEW_ROUTES` in the packet, and tests read them: `test_teaching_reaches_the_board.py` L683-704 pins the Slide Philosophy trigger's phrases and checks every routed heading exists, and `test_design_review_packet.py` L2375 reads the routes. The decision should say so.

**Real pulls the list missed.**

- RV-C10's "Repair it", the same ownership question as decisions 2 and 3.
- RV-K02 against the maths titles (starters note N1; link, do not duplicate).
- RV-M05's "refers to" against the section's "present, not referred back to" (small; part of decision 7).
- The worksheets list's hand-off on the adapted sheets (settled by his ruling).

**Net for him:** two real questions (who makes a repair that changes what children see or think; the four sections the card never opens, with honest notes on what opening them changes), plus one-line confirmations for decision 4, decision 5 and the adapted sheets. Decisions 1 and 6 need nothing.

---

## 5. Code and tests

1. **The after-review check re-runs the lesson validator and the picture-cap check** over the reviewed files (`design-review-packet.py` `verify`, L3304 and L3312) and fails if either fails. The ledger's "What the after-review check refuses" and group S omit both, though they are what sends a review to the focused repair (RV-R08, RV-R10).
2. **It also refuses** a preflight whose validator or picture-cap command differs from the one right for the stage (`require_same_command`), and a review not at `[WORKING_DIR]/design-review.md`. Small; not in the ledger.
3. **`NOT A REVIEW CORRECTION` and `REPAIRED`** are marked as code for this role; neither is read by any program or named by the playbook's route for it (heading 3, item 5).
4. **The validator refuses a skill lesson's My Turn, Our Turn or Your Turn label that does not begin with its turn word** (`validate-lesson-design.py` L2636-2664). It is missing from the ledger's list of what the validator refused first, and it bears on K02: a reviewer's retitle of a skill turn would be refused and restored (RV-O13), while a maths `Apply` has no guard.
5. **Closest-call quotes are checked against the whole review view**, case-insensitively, not only the `As the class meets it` section the reviewer is told to quote (`require_closest_calls`). Harmless; noted so a fold does not describe the check as stricter than it is.
6. **Decision 7 changes code and its tests** (heading 4).
7. **The four tests that bar `FINAL RESOURCE REVIEW` all read the playbook only** (`builder/test/doc-claims.test.js` L820 reads `playbook-lite.md`); none reads `SKILL.md`, so the wall-builder "judgement" line has no guard.

Confirmed as the ledger states: the validator refusals it lists (a number containing 67, long dashes, an empty `thinking`, a `lookFor` over 25 words, `Say to children:`, concepts, unlocks, a timed lesson over its slot, an unused vocabulary word); the five required headings, with `## Judgements` not among them; exactly min(3, N) closest calls, each with a reason of four words or more and a hyphen or em dash before it; the two judgement refusals; photo count, id and filename refused, `essential` recorded; no program checking `kids`, `pupils`, `students` or praise lines. The pin claims spot-checked held: the reading list (F01 to F19) and K04 to K16 are in the assumed-knowledge pins; J40 and J47 are in three pin files.

---

## 6. Stories

1. **Wrong: the one-reviewer ruling.** The ledger says his 10 September words are "only in memory, not in the plugin or the log". The log quotes them at L1512: «It was a second judgement net after the design reviewer, which his 10 September ruling ("lesson design reviewer catches anything. Once it's downstream, it's being made") had already said not to have.»
2. The other claims hold, searched case-insensitively: RV-C06 (L2288; also L1289, L2232, and "both comparison objects available" at L2276), C08 (L1253), C13 (L4093; its two script lines are not in the log, and the log's own tummy line at L4115 is different words), F09 (L3296), G05 (L4047, where the line wraps; the PSHE string at L3986), G21 (L2242, L2252), L10 (L1967), L11 (L1727), M06 (L2242), R19 (L3794), T14 (L2306), no caps (L1213, L2278), the retired final review (L1510).
3. No dated incident in the reviewer's three files is missing from the story table.
