# S1 change check B (17 October 2026)

Independent check of the S1 streamline of the slide designer's three always-read files
(role, playbook, profile). Nothing in the plugin or the plans was changed; the attacks ran on a
scratch copy at `C:\Users\Daniel\AppData\Local\Temp\s1checkb\repo` (plugin without
node_modules, plus the top-level plan ledgers so the ledger-matching tests run instead of
skipping).

## Verdict

Sound. Every removed or reworded rule in the three files was traced to a home that keeps its
conditions, exceptions, field names, check names and strength. No rule was lost. All 37 pin
moves and all eleven test edits keep protecting the same rule. Fourteen attacks on the copy
were all caught, each by a test failing on the rule attacked. Five small findings below: one
leftover contradiction outside the three files, two unlisted departures to tell him about, one
pointer that names the wrong section, one wrong label in a pin record. No em or en dash in any
added text.

## Findings

**1. The template entry still puts the opening line above the pair (D2 left half done).**
D2: "the older 'above the pair' sentence goes." The playbook's copy went (before: "and the
`established` line above it only when the design still carries one"). But `references/templates.md`
line 353, `strong-and-weak` Purpose, still says: "the gathering line, when the design still
carries one, sits above." The decisions table lists "templates strong-and-weak" among D2's rows
and the ledger (SD-G65) names it as one of the conflicting copies, yet `s1_apply.py` only edits
the three files and the "departs from the list" paragraph does not mention it. The designer
reads that entry at the template's first use, so it meets two instructions. Repair: tell him;
either make the template entry say the line leads on its own slide before the pair, or record it
as left for a later topic.

**2. D6 said the answer rules gather in the role; three details went to (or stayed only in) the
playbook.** The role's "Answers and reveal slides" section is gone. Its sentences "After a My
Turn or Our Turn completed live, show that representation finished (the ends labelled, the mark
placed, the answer in green) with the answer sentence..." now live only in playbook §10 (moved
there), and "Show the exact structured answer in the form asked, including any requested
reason", "These answer-state changes do not permit unrelated objects to move" and the blank-copy
pointer ("its absence is not a fault to return") are held only by playbook §10's own copies
("in the form the question asked for", "all other static objects in the same positions", "do
not count its absence as a visual fault"). Nothing is lost and the playbook is read in full, but
it is not what D6 described ("one place in the role") and it is not in the build's departures.
Repair: add it to the departures he is told about.

**3. A story line now reads against D8.** Playbook §10, after the D8 edit: "Shown the lesson's
five worked sums on one slide with the panel off, once with the headings cut to initials and the
sums small and once with the digits at half size, he said "looks awful"". Two sentences earlier
the rule now says headings print "as the drawing prints them (`Th`, `H`, `T`, `O` on a column
sum)", and D8 says "the real failure is shrinking the digits". A reader can take "headings cut to
initials" as part of what looked awful. His quoted words are fine; the framing is not his.
Repair: put it to him whether the story should name only what was wrong (the sums small).

**4. A pointer names the wrong home.** Playbook §4 (Make task phases visible): "The presentation
layer on top (the survival phrase, the action roles, each phase beside its object) is
`teacher-slide-visual-profile.md` → Visible task structure and Task-to-object attachment." The
`task-action` role it folded (before: "give those exact verbs or short action phrases the
`task-action` role") lives in the profile's Semantic colour, not Visible task structure. The
profile is read in full, so nothing is missed, but the pointer is inexact. Repair: add
"Semantic colour" to the pointer.

**5. One pin record carries the wrong decision label.** `teacher_voice_ledger_pins.json` VG-L51:
the change is the checklist renumbering ("10. Would a teacher..." to "11. ..."), which is D12, but
its outcome note says "D14, dates off and his words kept". Record only; the pin itself is right.
Repair: correct the note when the file is next touched.

Out of scope, noted: at 23:22 to 23:23, while the attacks ran, another session edited the live
role (the launch bullet) and playbook (the rehearsal paragraph: "Three things on that slide, and
the unit's success criteria beside them"). The check above is of the S1 state captured at 22:57.
The S1, rehearsal and brain-contract tests still pass on the live files after that edit (81
passed), so that session moved its pins too.

## Attack table

Untouched copy first: `-k "ledger or slide_designer or teacher_voice or teaching_reaches or
words_to_say or my_turn or lesson_design_contract"` gave 488 passed, 27520 subtests, no skips.
Each attack was one edit (or one pair of edits) to the copy, the same selection run, then the
file bytes restored. The copy's three files were byte-identical to their starting state after
the last restore.

| # | Attack | Caught | Failed | What failed |
|---|---|---|---|---|
| A1 | Playbook loses "and only when it is necessary to operate a source-defined surface"; the role's old bullet holding it is put back in the role | yes | 14 | D11 test; the SD row pins on the playbook's section 3 paragraph |
| A2 | Date back beside his quote in the profile ("(4 October 2026: `both needed paragraph breaks though`)") | yes | 4 | whole-paragraph pin on Paragraph rhythm |
| A3 | Date back beside his quote in the playbook category cards ("cards, 14 September 2026:") | yes | 4 | whole-paragraph pin on section 12 |
| A4 | Delete the new word-card ruling sentence | yes | 13 | D7 test; vocabulary home and row pins |
| A5 | "headings written in full" back | yes | 4 | D8 test; section 10 paragraph pin |
| A6 | Delete "Three things on that slide and no more..." from the rehearsal paragraph | yes | 4 | rehearsal-slide guidance test; paragraph pin |
| A7 | "split only at a complete item or card boundary, onto" back to "use" | yes | 8 | SC-H50 and SD pins on Teaching and pupil action |
| A8 | Delete the role's `PUPIL_INSTRUCTION_AMBIGUOUS` paragraph | yes | 7 | SD row pins on the role paragraph (the brain test alone would not catch it: the token is still in the six reminders) |
| A9 | Reword the profile's carried "Do not make the photograph the hero merely because it is visually attractive." | yes | 6 | profile paragraph pins |
| A10 | Reword the profile's carried alignment clause to "may still be fine" | yes | 11 | profile list pins |
| A11 | The header-cue duplicate comes back in the playbook | yes | 1 | D1 test (`test_the_header_cue_rule_has_one_copy`) |
| A12 | Drop the table-of-meanings criteria exception (D10c) from the role | yes | 6 | D10 test; role section 6 pins |
| A13 | Soften the vocabulary timing rule to "avoid merging its groups into one slide" | yes | 16 | vocabulary home, VOC-N02 and SD pins |
| A14 | "18pt where 20pt would leave the picture too small, never less" loses its floor | yes | 4 | D10 test; label-rule pin |

## Rows found sound

Part A, the three files:

- **D1 header cue.** The role's "Main task versus header cue" section and the playbook's two
  copies went; the profile's "Main task prominence and the header cue" holds every part: secondary
  cue only (with the `Use the word bank` / `Look at both circuits` / `Use the table` examples), the
  child must not have to notice it, the task in the body at task-reading size, a fixed template
  that forces the task into the header is not faithful ("choose body geometry"), and no duplicate
  in header and body. The role's "Physical navigation and presentation headings remain Slide
  Designer-owned" is held by the role's may-choose list; "never replaces the source question,
  adds teaching content or rescues unclear source prose" by the playbook's "It may not" list.
- **D2** in the three files: one sentence, the line leads on its own slide (finding 1 is outside).
- **D3.** The pre-write checklist went; "When page evidence exists ... Final teacher pass" and the
  overview rule stay in the role; the sparse demonstration line moved to playbook §7. The heading
  rename to "Checks before visual judgement" follows from the list going; nothing points at the old
  heading.
- **D4** six reminders untouched. **D5** reading reminders: the playbook's criteria and speech
  reminders and the role's criteria and vocabulary reminders went; the reading list holds each,
  with both `successCriteriaRefs` and `stickyKnowledgeRefs` and his speech triggers word for word.
- **D6** the rest: answer-slide placement, "do not infer a reveal", no generic Answer slide, the
  revealPair contract, "a repair to either state rechecks both", "record its teaching reason" are
  all in the role's section 5. `visible-in-unit` keeps "in purple (`colorRole: "worked-purple"`)".
- **D7** one word-card rule in the playbook with every role condition (moved past slides that do
  not show the word, moved back, starter outside, two entries keep the design's order, script is
  the speaker notes, `vocabularyPlacement`). His quote is genuine (memory file of 13 October:
  "It goes straight after the answer, "or it could have went before the task""). The role's
  absolute "do not merge two entries onto one slide or split one entry across two" became the
  playbook's reasoned wording, but the playbook's opening "one per introduction the design
  planned" keeps the absolute rule, so its strength survives.
- **D8, D9, D10 a to d, D11, D12** as agreed; the D10a "lower" became "below the task when it is a
  picture, table or figure" with the story exception; section 15 now numbers 1 to 11 once.
- **D13 folds**: playbook opening (role's "Do the spec yourself...", the judgement sentence, and
  the arc sentence now carrying "visually flat or pedagogically misleading"); survival phrase and
  action roles (profile, with `safety-warning` carried into its role list); Teach layout (the
  task-blue-with-sign line carried; neighbours-differ and `TEACH_LAYOUT_REPEATED` in the playbook);
  alignment, group discriminator, working surface and asymmetric split (profile, with carried
  words); captions and photo fit (playbook); evidence cards; sorts and splits ("split only at a
  complete item or card boundary" carried); the comparison and worked-example summaries (§8 holds
  "Arrows assert a journey", the fan-in `source-pathway` rule and one model per annotated figure;
  §7 holds unlabelled helper space; §12 keeps "comparable scale and crop style"); the green line
  (profile's answer green and vocabulary green are wider); the profile's two final bullets (the
  role holds "repair all currently visible owned faults together in the candidate file and rerun
  the complete `--preview` check" and `SLIDE_DESIGN_CHECK_FAILED` after the third pass); the
  decoration record (the decorator holds the `full` / `competes` / `would-mislead` checks).
- **The Surface execution recap** (a listed departure): every line has a home (source authority
  in role section 2, header cue in the profile, sort and split in the playbook,
  `PUPIL_INSTRUCTION_AMBIGUOUS` in the role and playbook, the stricter furniture wording in
  playbook section 3, Written Voice in the reading list).
- **The helper `featureChecks` paragraph** moved word for word into "Deliver the helper that was
  promised" (ledger SD-A08, a move).
- **D14** stories: every date beside his quotes is off, every quote kept exactly, the Tudor and
  diseases example file dates untouched.

Part B, the 37 pins (36 row pins and one colours home): 21 are the same edit as the file (dates
off, the renumbering, the answer-slide line, `safety-warning`, the Written Voice reason), and 16
move to the rule's new home: AK-D20 (stronger: "Information children must act on belongs in a
proper readable text slot"), PF-B61 (two pins; the whole profile paragraph stays pinned whole by
PF-B41 and SD-F55), PF-R24, SA-H45, SC-H50, SC-I12, SC-I14, SC-J09, VG-K26, VG-M29, VOC-F04,
VOC-N02 (three; the long placement sentence is still pinned whole through VOC-N03), VOC-N04,
VOC-N05, VOC-N22. None moved to a weaker phrase without the fuller text pinned elsewhere; several
gained a whole-paragraph check.

Part B, the eleven test edits: doc-claims photo fit (now on the playbook); the My Turn bound
(lengthened, D10b); "physical navigation and presentation headings" (the list item); "the sole
authority for answer treatment"; the stricter furniture wording and "add a new task, concept,
phase or pedagogical decision" (on the playbook); "**Sparse can be correct.**" plus the
playbook's demonstration sentence; the two retired playbook headings dropped from the heading
list; the profile's record assertions replaced (the decorator's record is asserted in
`test_the_pass_writes_a_record_the_deck_check_can_read`); the speech reminder (the reading-list
assertion above it stays); "Three things on that slide and no more"; the vocabulary script line
(on the playbook). Each keeps protecting its rule in its new home.
