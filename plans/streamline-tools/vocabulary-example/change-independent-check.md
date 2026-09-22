# Independent check: the vocabulary fold (4.2.284, uncommitted, against ee9c6e2c)

What I did: read the brief, the whole ledger and the mapping; read every hunk of the diff and the old text of each changed section from git; compared all 59 changed rows by hand; ran a sentence-by-sentence comparison of the old Vocabulary sections (preferences and the designer's own file) against the new homes; checked that all 158 "unchanged" pins in edited files still sit under the same heading; ran the new code over all 91 saved `lesson-design.json` files in the repo; ran the full Python suite (2,075 passed, 1 skipped); and ran deletion and move experiments on a scratch copy of the pinned files. I changed nothing in the repository.

Findings are ordered most serious first inside each heading. Anything I checked and found sound is listed in one line at the end of its heading.

---

## 1. Row by row (the 59 changed rows)

**1a. VOC-A09 changed in the designer's always-read file, and a test now pins the change.** No decision licenses it.
- Old rule (A09, now word for word in preferences): «so the term gets taught - a card, or one explicit taught line - never left living only in planning metadata» and «The exception is a term the teacher's own sequence explicitly defers.»
- New pointer in `agents/lesson-designer.md` → Vocabulary: «which words earn a card (up to five, each with a job today, and always a term the approved objective names)».
- "Always ... earn a card" drops the "one explicit taught line" alternative and the teacher's-deferral exception. It also contradicts decision 6 ("a smaller word explained in one line needs no card"). This is the first thing the designer reads, before it opens preferences. `test_bounded_attempt_and_taught_invariants.py` now asserts this exact phrase, so correcting it means changing that test too.

**1b. VOC-D12 weakened and widened. Decision 10 said "every extra condition is carried", so no decision covers this.**
- Old: «Foundation subjects: when teaching sequence already sources photos (biome landscapes, river source, Mayan pyramid), name same photo as card visual - child meets twice, costs nothing.»
- New, inside a parenthesis in D02: «where the teaching already sources a photograph, such as a biome landscape or a river's source, the same photograph on the card lets the child meet it twice at no cost».
- The instruction ("name same photo as card visual") has become a description. The "Foundation subjects" condition has gone, so the rule now reads as applying to every subject. The Mayan pyramid example has been dropped. The effect is small, because D02 already points the card at "the photograph ... the word will be used on".

**1c. VOC-C10 narrowed when it was merged with C08.**
- Old C10: «teach necessary comparisons, caveats or fuller explanation elsewhere while the card remains useful as a quick reference.»
- New: «that fuller teaching belongs on the Teach slide, while the card remains useful as a quick reference.»
- "Elsewhere" (a script, a model, a later beat) has become "the Teach slide" only, which fits badly in a skill lesson with no Teach slide. The old C08 did say "the Teach slide", so the merge kept the narrower of the two.

**1d. VOC-E12 changed from a rule to a description.**
- Old: «A word must not be introduced after its last meaningful use; that is not late teaching, it is no teaching.»
- New: «The failure at one end is a word introduced after the last moment it was any use: that is not late teaching, it is no teaching.»
- It sits under "Three boundaries", so the intent survives. But the "must not" has gone, and "at one end" now has no "other end" after it (the other end moved to E01).

**1e. VOC-E01: a sentence removed that is not a story.**
- Removed: «Reading the whole set out after the starter has not been helping.»
- The mapping calls it a story under decision 12, but it has no date and reports no deck; it is a reason. Its point mostly survives in E18: «putting them all at the top because that is where they went last time».
- Low. Decision 12 covers dated stories and "a Year 4 deck did X" reports, not this.

**1f. VOC-A11: condition changed.**
- Old: «When plan lists more than limit, trim no-job items, note decision.»
- New: «When a plan lists more words than earn a place, trim the ones with no job».
- The trigger has moved from "over the limit" to "any word that does not earn a place". This matches A12 («Trim vocab with no job»), so in practice it changes nothing, but no decision covers it.

**1g. VOC-N13: a sizing word dropped.**
- Old: «each with an optional compact visual».
- New: «each with the picture the design chose for it».
- Dropping "optional" is decision 2. Dropping "compact" is not licensed. N15 («vocabulary-sized content») still carries the size cue, so this is very low.

**1h. VOC-E03: its worked example dropped.**
- Dropped: «(children look at two classrooms and say what is alike, then hear that the alike things are called continuities)».
- E02 keeps its shorter example and the history file's Victorian sketch (E30) shows the same order, so nothing is lost in practice.

**1i. VOC-C21: the new catalogue example may be inaccurate (unsure).**
- New: «Evaporation is when water warms up and turns into a gas called water vapour.»
- It suggests water must be heated to evaporate. The voice guide's own example (C15) is «Evaporation is when a liquid changes into a gas.» C08 and M13 say never inaccurate. The ledger notes the slide designer copies definitions from the design, so this example cannot spread directly. Worth a science-minded read.

Checked and sound: A01, A02 (apart from 1a), A04, A05, A07, A08, A09 and A10 (moved word for word), B01, B02 («Don't combine to evade limit» became «Never pair words to fit more under the limit», same meaning), B03, C01, C07, C08, C09, C12 (the round/multiple case kept as a plain example; its exception and limit kept), C13, C20, D01, D02, D03, D05, D07, D08, D09, D11, E02, E04, E06 (in the log, "three" beats), E07, E09, E10, E13, E15, E16, E17, E19, E35, F01, G01, G03, G04, H03, L07, L08, M07, N30, O07, O16, Q05, DEC-07, DEC-10. Every dated story removed from a changed row is in `build-review-log.md` (checked L661, L2103, L2150, L2152, L3443, L3564, and the new 4.2.284 entry for E06).

---

## 2. Decisions applied faithfully

- **Decision 4: applied in the Vocabulary section, not in the contents line every agent reads.** `references/preferences.md` line 21 still says «**Vocabulary** — choosing 3–5 cards or genuine vocabulary units». Every agent that reads preferences reads the introduction and contents first. The mapping lists VOC-A03 as "unchanged in place", and the pin file pins «choosing 3–5 cards», so the pin test now protects the wording the teacher asked to change. (The README also still says «selects 3–5 vocabulary words». It is for maintainers, not agents, so this is low.)
- **Decision 12: applied to one copy of a story and not its twin.** F01's story was removed from the designer's file, but the same story is still in `references/output-template.md` → Vocabulary: «a deck shipped with two vocabulary slides and empty notes on both, and the class met `belief` and `nativity` with nothing said about either.» The designer reads the contract, the ledger marked F03 "story, proposed home LOG", and the mapping calls it "unchanged in place". Also, D01's date was dropped under "his rulings keep his words without their dates", but E34's date stays next to text the change edited (`teaching-sequence-skill-based.md`: «The user, 12 September 2026: "i dont want to limit it..."»). Low.
- **Decision 11: reworded, although it said "word for word"; the mapping says unchanged.** The answer-arrow preference moved correctly to Support, Checking and Release. On the way, «The teacher added a trailing arrow to all six practice questions on a Year 4 maths deck ... Asked whether the engine should always do it, he was clear it should not:» and «(19 September 2026.)» were removed, and «The teacher likes it sometimes, not always:» was added. His quoted words and every condition survive, and decision 12 licenses dropping the story. But decision 11 said "moves word for word", and the mapping lists VOC-Z01 as "unchanged in place", which is false: it is the only "unchanged" row that changed section.
- **Decision 6: done in preferences, but contradicted by the designer's own pointer** (finding 1a).
- **Decision 5: the rule is right, but the check refuses some sound cases** (section 6).
- **Decisions 1, 2, 3, 7, 8, 9, 10, 13 and A:** each does what his words say, no more and no less. Some notes:
  - 1: "or emoji" was added beside "symbol" in D03, which matches "an emoji only when it is the thing".
  - 2: the `none` exception is kept.
  - 7: correctly limited to skill lessons, the only route with My Turn cycles.
  - 9: O11 in `working-wall-card-contracts.md` still says «One concise child-readable definition» (unchanged). Unsure whether this still pulls towards rewording on the wall; the designer's own "copy faithfully" rule probably holds it.
  - 13: all six stale texts are gone.

---

## 3. Reach

- **The designer lost its only pointer that the picture test covers word banks, sorting sets and slide lists (VOC-D10).** Old always-read text: «`preferences.md` → A Picture Beside a Word test applies wherever picture beside word - vocab card, word bank, sorting set, slide list.» The mapping says it was "folded into D03's pointer", but D03 is about the vocabulary card only («`A Picture Beside a Word` still decides which»). `agents/lesson-designer.md` now never mentions A Picture Beside a Word. The designer does choose word-bank photographs (`output-template.md`: «a word-bank thumbnail around 10 mm needs one instantly recognisable object»). The full rule (D16) still exists, and the contents line names the section, so this is a weaker route, not a missing rule. The downstream designers all name that section in their own reading lists.
- **The designer is still reliably sent to the one home.** Its Vocabulary section says «Read it whole before choosing the set, and return to it before writing `vocabularyIntroductions`», and "Reference Files" (unchanged) says «Read the relevant preference section before deciding the starter, vocabulary, ...». The section reads as a single page (15,227 bytes, `REFERENCE_READ_OK`, under the 24,000-character page).
- **Answer-arrow's new home is at least as reachable as the old one.** Support, Checking and Release is read by the designer before "support and release" and by the reviewer's routing card. Its old home (Vocabulary) was read at an unrelated moment.
- **The slide, wall and adaptation designers now read more design rules** (A09, E35, G04, decision 7's sentence). None of them can act on these, because their own files forbid merging, splitting or rewording, so I see no real risk. One unsure note: G04's «The beat straight after the card uses the word on its board» could tempt a slide designer to add the word to a title. Its own copy-exactly rules forbid that.
- **E35 left the slide designer's playbook, as decision 6 said "moves".** The slide designer still meets it, because it reads preferences → Vocabulary before any vocabulary slide.
- **The design reviewer's routing card is unchanged.** Its Vocabulary trigger («selection, definition, quantity or placement») still fits.

---

## 4. Unchanged rows really unchanged

- **Headings.** All 158 "unchanged" pins in the 12 edited files sit under the same heading as before, except VOC-Z01 (see section 2).
- **Neighbouring paragraphs.** I read the text around each of these and their meaning holds:
  - preferences: A06, A16, A17, B04, C02, C03, C06, C11 («the job test above» still points above), D04, D06, E05 (E07 now follows it), E14, E18, G02, G06, H01 («The selection test above» still points to A08), H02
  - designer's file: C04, D13, D14, E20, E21
  - output-template: A13, D15, E23 to E26, F02
  - templates: D23, N14 to N17, N24, N28
  - playbook: E36, N03, N06, N07
  - history: M05, M06, E29, E30, E50
  - skill route: E11, E34, E47 (now extended by decision 7, as licensed)
  - wall: O02 to O06, O12 to O15, O23 to O28
  - reviewer: L01 to L06, H07
- **One small shift.** VOC-E22 «The Lesson Designer records this as `vocabularyIntroductions`...» now comes straight after the new Teach-beat paragraph (E35), so «this» reads as if it means the Teach beat, not the card timing. Low.

---

## 5. Collateral edits

- **A new pin locks in a contradiction.** `test_bounded_attempt_and_taught_invariants.py` pins «always a term the approved objective names» (finding 1a).
- **A new headline sentence appears in preferences.** «**Up to five words, each with a job today.**» and «**A definition is a sentence you would say to the class.**» are summary headlines, not new rules.
- **New explanatory clauses.** Added: «so the class still has the card to glance back at» (E35) and «(the three repairs under `A word the teaching leans on` below)». Neither changes meaning.
- **The build log's count is from a different sample.** The new entry says 22 of 114 introductions were refused across 54 saved designs. Over all 91 designs in the repo I count 35 of 170, so this is not a contradiction.
- Nothing else in the diff falls outside a row or decision.
  - Both `plugin.json` files are bumped to 4.2.284.
  - The design-reviewer edits are L07 and L08; `edit-templates.md` is Q05.

---

## 6. Code

**Validator: it refuses words that are visibly on the board in two ways.**

- **(a) Words printed by the beat's picture do not count.** The board is taken from the beat's `content`, `pupilInstruction`, `taskStructure` and its referenced criteria and sticky facts. Representation captions and labels are ignored. A real saved design shows this:
  - The design is `lesson-resources-output/working/read-and-complete-number-lines/lesson-design.json`. The card is "Interval" and the next beat is "My Turn".
  - That beat's picture configuration `model-tens` requires «Visible caption: Each interval is worth 10.»
  - The check still refuses it: «`Interval` is in the teacher's script for `My Turn`, the beat straight after its card, but not on its board.»
- **(b) Ordinary word forms on the board do not match.** The word matcher accepts only the exact word plus s/es/ies on its end. It was lenient enough when the script counted, because the script usually uses the plain form. Now the board must match on its own, so a board that says the natural form is refused whenever the script says the plain one. I built cases to prove it:
  - A board of «What are the continuities between the two classrooms?» with a script saying "continuity" is refused.
  - A board of «What changed between the two classrooms?» with a script saying "change" is refused.
  - "rounding", "exchanged" and "evaporates" fail the same way.
  - None of the 91 saved designs hit this, so it is shown, not observed. It bites exactly on history's continuity and change boards.

**Validator: other behaviour.**
- **What it now does.** A word that appears in the next beat only in the teacher's script is refused, and criteria and sticky facts shown on that beat count as board. This matches decision 5's words.
- **What it still does not check.** The rule also asks for the word «in its script» on the next beat, and the code does not check that. Before the change the code was weaker still, and decision 5 asked only that the script alone is not enough.
- **Possible wrong passes (unsure, and not new).** The board text includes every string value in `content` and `taskStructure`, which can hold ids. An id like `vocabulary-interval` would match "interval". Low.
- **Everything else still works.** All other callers keep the same behaviour, and the full Python suite is green.

**Review packet.**
- It does what decision A says: each vocabulary slide's script prints as «Teacher says: ...» with the `Say to children:` opening removed, the same way other beats print.
- Old saved designs that only carry `vocabularyPlacement` have no script, and nothing prints for them.
- The class view's string count goes up by one per vocabulary slide, which is harmless.
- I found no way for it to wrongly refuse or pass anything, because it only displays.

---

## 7. The pin test

- **Coverage of IDs.** `vocabulary_ledger_pins.json` holds all 285 ledger IDs, with none missing and none extra, plus DEC-07 and DEC-10. Every "unchanged" row pins its full quotes.
- **Deleting a pinned sentence is caught.** Deleting «Avoid collections of separate decorative pictures.» in a scratch copy failed on VOC-D06.
- **Gap 1: changed rows are pinned only in fragments, so parts of their rules can be deleted without any test failing.** In a scratch copy I deleted three of these at once and the pin test still passed; I also searched the whole test suite and none of them is pinned anywhere:
  - C12's exception, «Where two definitions need each other, neither order is wrong and the more concrete word leads.»
  - C12's limit, «This is about the order on the card set, not about when each word is introduced in the lesson...»
  - E17's core sentence, «Grouping is a teaching decision, not a quota: one word is a normal introduction, so is a pair, so is a set of four...»

  Also unpinned:
  - E01: «a word introduced eight slides before it is used has stopped being a glance reference»
  - G01: «A card is a glance reference for language children are about to handle»
  - G06: «A child who has only heard a definition is holding a sentence...»
  - C11's appliance and electricity example
- **Gap 2: the pins check the whole file, not the section.** I moved the whole «Every vocabulary card carries one coherent visual» paragraph out of Vocabulary into Pride Lessons, and the pin test passed. So it cannot catch the failure the brief worries about most: a rule moved where its reader will not see it.
- **Gap 3: the coverage test only counts.** `test_the_pins_cover_the_whole_ledger` asserts at least 285 VOC ids. It does not compare them with the ledger, and a row whose "present" list is emptied is not noticed. VOC-E06 has no pin in the build log, where its story now lives.
- **Gap 4: it pins two texts that conflict with the teacher's decisions:** «choosing 3–5 cards» (A03) and, through the other test, «always a term the approved objective names».
