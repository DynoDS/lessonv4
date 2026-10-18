# S1 change check A: old against new, rule by rule

Checked 17 October 2026. Read whole: the three before files in `s1-change/before/`, the three live files, the decisions file, the ledger rows for every changed paragraph, `s1_revisions.py`, `s1_apply.py`, the list check, the focused repair role, and the `preferences.md` Slide Philosophy and Success Criteria and `templates.md` `strong-and-weak` and criteria-panel entries. Diffs made with `git diff --no-index` from the before folder to the live files; every changed line was accounted for. Nothing in the plugin was changed.

## Verdict

The change is careful and nearly every fold is sound: every quoted word of the teacher survives (checked by script over every quoted string in the before files), only the dates beside his two example files remain, no dash was added, no pointer in the plugin lands on a removed heading, the other chats' two `RULE` paragraphs are untouched, and the S1 and neighbouring tests pass (538 Python tests, 59 builder tests). It is not quite finished. One new sentence contradicts the start-up `preferences.md` rule on where a picture sits, one decision (D2) leaves the template entry the designer reads at first use saying the opposite of the playbook, and the role no longer sends the designer back to the playbook's final-deck checks at the end of its run. The rest are small: one narrowing in the photograph-fit rule, a few wordings that differ from what he agreed, two departures not told to him, and four sentences that now read a little oddly.

## Findings

### 1. A new sentence sends every picture below the task; `preferences.md` puts a picture first (D10a)

- Before (playbook §4): "Set the material apart as the element the eye lands on: larger, lower, in its own line, card, table, diagram or picture area."
- After: "Set the material apart as the element the eye lands on: larger, in its own line, card, table, diagram or picture area, and below the task when it is a picture, table or figure. A written story, case or source the task runs on is the exception: it comes first, above its question (the role's `What children work from is read first`)."
- `preferences.md` Slide Philosophy, read at start-up: "the class reads or hears the thing - the claim, the statement, the worked line, the photograph - and then meets the question about it. Put the two on the slide in that order." Its one exception: "When children write onto or beside a figure, the instruction goes on top and the figure sits centred below it ... it applies when they write on or beside the figure, not to every slide that has one."
- The role's own story rule also says it does not cover "a picture, table or drawn figure, which the layout places".
- Why it matters: "lower" was one adjective among ways to set material apart; "below the task when it is a picture, table or figure" is now a placement rule, and for a photograph children look at (not write on) it says the opposite of the preferences rule. The build follows D10a's words ("'lower' stays for pictures and figures"), but the explanation he answered did not set this beside the preferences rule.
- Repair: put it to him. The existing preferences exception ("when children write onto or beside a figure") is the narrower wording already in the plugin.

### 2. D2 is carried out in the playbook only; the template entry still puts the line above the pair

- Playbook after: "the `established` line, when the design carries one, leads on a short slide of its own before the pair (below)."
- `templates.md` `strong-and-weak`, unchanged: "One line along the bottom names the difference, and the gathering line, when the design still carries one, sits above." Its slot list still offers `established`, and `strong-and-weak.test.js` passes "the gathering line prints above the pair only when the design carries one".
- The decisions table names "templates strong-and-weak" as a party to D2. The "Built" section does not say it was left, and the ledger gives it no x:S2 mark (only SD-A83 carries x:S2).
- Why it matters: the designer reads that entry immediately before first use of the template, so on the launch slide it meets two instructions that disagree.
- Repair: record it in the decisions file's "where it departs" list and in the S2 ledger as a carry, or change the template's purpose sentence now with his agreement.

### 3. The role no longer points to the playbook's final-deck checks (D3)

- Before (role, Preflight): "Read the final-deck sections of `slide-composition-playbook.md` and `teacher-slide-visual-profile.md`. Inspect the whole deck at thumbnail scale and every slide at board-distance scale."
- After: the whole paragraph is gone. At the end of the run the role says only "Apply `[PLUGIN_ROOT]/references/teacher-slide-visual-profile.md` → Final teacher pass." Nothing in the role names the playbook's "14. Deck-level quality tells" or "15. Final read-back" any more.
- D3 dropped the checklist because "its items are in the fuller final checks", and dropped "every slide at board distance". It did not drop the instruction that sends the designer to those fuller checks; with it gone, half of them (the playbook's) are reached only from the start-up read.
- Repair: carry "and the final-deck sections of `slide-composition-playbook.md`" (or "its §14 and §15") into the role's "Apply ... Final teacher pass" sentence.

### 4. Photograph fit: the playbook's own words were replaced, not kept (K10)

- Before (playbook): "Use `contain` when the whole image or its edges carry evidence. Use `cover` only when a centred crop cannot remove a load-bearing feature."
- After (the role's paragraph moved in whole): "Under `cover`, a centred crop fills the frame, so choose it only where a centred crop cannot remove evidence the photo requirement named."
- The ledger row SD-G75 says "Kept; gains B66's reason". The build replaced G75's two sentences instead. "A load-bearing feature" (anything the task needs) became "evidence the photo requirement named" (only what the requirement lists). Before, the designer read both copies, so the wider one was in force.
- Repair: keep G75's two sentences and add B66's reason after them, as the ledger row says.

### 5. The criteria-table exception says "stays" where he agreed "may sit" (D10c)

- After (role §6): "The exception is a table the design itself files as a set of criteria (a table of label meanings beside the steps): it stays inside the criteria box, under the steps."
- Agreed: "c) a table of meanings the planner filed as criteria may sit in the criteria box". His 14 October ruling: "A table of meanings may sit inside the success criteria box".
- It agrees with `templates.md` ("More than one set of criteria in one place": one panel), so it is unlikely to cause harm, but a permission has become a requirement in words he did not see.
- Repair: "may sit inside the criteria box, under the steps", or tell him.

### 6. D6 says one place in the role; one answer rule moved out of the role

- Before (role, Answers and reveal slides): "After a My Turn or Our Turn completed live, show that representation finished (the ends labelled, the mark placed, the answer in green) with the answer sentence: it is the model the teacher drew, for a class whose teacher did not draw it."
- After: that sentence is in playbook §10 only. The answer-note rules stay in the role's Speaker notes section.
- Nothing is lost (and the focused repair now reaches it), but D6 as explained was "Gather the answer rules into one place in the role", and the departures list does not mention this.
- Repair: add it to the "where it departs" list.

### 7. Word cards: one absolute softened, one example dropped (D7, "every detail of both")

- Before (role): "The timing is a teaching decision already made, so do not merge two entries onto one slide or split one entry across two." and "a unit that opens on a can just out of the fridge and says `condensation` on its second slide takes the card between the two".
- After (playbook): "do not merge its groups into one slide to tidy the deck, and do not split a group because the words look separable." The `condensation` case is reduced to "a can just out of the fridge" in the list of opening slides.
- "One per introduction" in the same paragraph still holds the meaning, so this is minor, but "split one entry across two" was unconditional and "because the words look separable" reads as one reason only.
- Repair: carry "or split one entry across two" into the last sentence.

### 8. The pointer for the action roles names the wrong profile section

- After (playbook §4): "The presentation layer on top (the survival phrase, the action roles, each phase beside its object) is `teacher-slide-visual-profile.md` → Visible task structure and Task-to-object attachment."
- `task-action`, and the rule that both action roles "render bold in the line's own colour", live in the profile's Semantic colour section. Visible task structure lists `core-action` and the other roles, not `task-action`. The removed playbook line also said when to use `task-action`: "When several source-authored action verbs expose the structure more clearly than one survival phrase alone"; the profile's bullet has no comparison with the survival phrase.
- Why it matters: the focused repair reads only "the matching sections" of the profile, so a repair following this pointer misses `task-action`.
- Repair: add "and Semantic colour" to the pointer.

### 9. Two departures not told to him

- SD-A08 (the `covered` helper paragraph) moved, unchanged, from above "What you read" into "Deliver the helper that was promised". It is a sensible move and loses nothing, but no decision covers a move (D13 is folds) and the departures list is silent.
- SD-M11 ("when a clear owned fault survives the shared repair budget, fail the check with the named diagnostics instead of promoting a deck the teacher will have to fight.") went with SD-M10. D13's explanation named "a profile line repeating 'repair only your own faults'", one line. The role still says it ("When a clear Slide Designer-owned visual fault remains after the third repair pass, return `SLIDE_DESIGN_CHECK_FAILED`"), so nothing is lost.
- SD-L96 ("read each slide from a distance, not from a screen;") is named in the D3 row of the decisions table but has no fate in the ledger and was left unchanged. Read at overview size it is compatible with the overview rule; say so.
- Repair: three lines in the "where it departs" list.

### 10. Sentences that now read oddly

- Playbook §5 list: the last item now ends "- hints recede;" with a semicolon, because the item after it (the green line) was removed. Repair: a full stop.
- Playbook §10, worked answers: the rule now makes `Th`, `H`, `T`, `O` the right heading, but the narration beside it still says "once with the headings cut to initials and the sums small and once with the digits at half size, he said "looks awful"". A reader can take initials as part of what looked awful. Repair: put to him whether the narration should name only the small sums; "looks awful" and his other words stay.
- Playbook Vocabulary: "it goes straight after the answer (the teacher: "or it could have went before the task")". The rule names one place and his quote opens a second, which the check also accepts. His words are verbatim, so this only reads oddly; leave it or tell him.
- Playbook §6, `inBooks`: "so it needs no handwriting width (the teacher)." With the date gone, a bare "(the teacher)" credits nothing quoted. Repair: "(his ruling)" or drop the brackets.

## Checked and found sound

- K01: the playbook's opening is the role's words; "visually flat or pedagogically misleading" carried into the role; the new pointer names `How you work`, which exists.
- K02 (D1): every condition of the role's header-cue section is in the profile's "Main task prominence and the header cue" (secondary cue, the three example cues, no duplicate, the fixed-template case); SD-B11's content is in the role's "You may choose" list and playbook §3. The signs paragraph's pointer was repaired and lands on the right heading.
- K03 and D4: the six reminders kept word for word; the Surface execution bullets each live elsewhere (sort completeness in the playbook's sort paragraph, split at complete items in G70, the stricter null-instruction wording in §3, Written Voice in the reading list); `PUPIL_INSTRUCTION_AMBIGUOUS` kept in the role and in playbook §13.
- K04 (D6): the `revealPair` sentence, the three block types, "a repair to either state rechecks both", "immediately after the pupil question slide", "do not infer a reveal" and "no generic Answer slide" all in role step 5; "in the form asked, including any requested reason" is §10's G28.
- K05: survival phrase, `core-action`, phases beside objects and the roles list in the profile, `safety-warning` carried.
- K07, K08, K09: evidence cards in one card with the connector sentence carried; G68's completeness sentence kept; "split only at a complete item or card boundary" carried into G70.
- K11, K12: comparison, arrows, fan-in and one model per figure all already in §8 and §12; the category-cards and physical-demonstration sentences carried; no pointer names the two removed headings.
- K15 (D7): starter exception, move-back for a paced Teach, design order for two entries, script copied exactly, `vocabularyPlacement`, "Do not add P3" all carried; his 13 October words added as he said them.
- K16, K18 (D5): each reading reminder now only in the role's reading list; his three speech triggers ("anyone who simply says what they think, gives their reason or asks a question") word for word in the role and the focused repair.
- K19 (D2 in the playbook, D12): "Three things on that slide and no more" now follows the rehearsal sentence; SD-A82 kept whole; "It is not a paragraph" given its subject.
- K20, K25, K26, K27, K29, K31, K33, K39: teach-layout task-blue line carried; top or bottom alignment carried; `groupAccent` named; "non-load-bearing", "the hero" and the asymmetric split carried; rebalance or split carried; `keyQuestions` named in §13; repair rules held by the role; "only when it is necessary to operate a source-defined surface" and "a new task, concept, phase or pedagogical decision" carried (D11).
- D8, D9, D10b, D10d, D12: Th, H, T, O on worked answers; "the exchanged ten"; dividing a My Turn names both reasons, pointing at §8, which holds `ONE_MODEL_PER_ANNOTATED_FIGURE`; 18pt never less; §6 for §8; the final read-back renumbered with item 7 unchanged.
- D14: every dated story row trimmed; dates remain only beside the Tudor and diseases example files; the example-files paragraph (SD-G62) is untouched; every double-quoted string of his in the before files is in the after files.
- New text: no em or en dash added (counts unchanged in all three files); the new heading "Checks before visual judgement" holds the kept deterministic-first rule.
- Focused repair reach: §3, §4, §10 and "A Teach beat splits where its teaching turns" are all still where it reads them; word-card placement, photograph fit and the teach-layout task line moved into the playbook, which it reads, so its reach improved.
- Untouched: the role's two `RULE` paragraphs (other chats' work) match the snapshot; the `preferences.md` and `templates.md` changes in the working tree are other chats' (the "6-7" rule and the criteria-either-side line), not S1.
