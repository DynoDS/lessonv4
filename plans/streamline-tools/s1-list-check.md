# S1 list check: independent check of the S1 ledger

Checked 17 October 2026 against the working tree (the three plugin files read whole, the annotations file whole, the ledger's cluster table and every row's ID, location, fate and tests column, the memory rulings named in the brief plus the other slide rulings since 26 September, the slide designer's start-up sections of `preferences.md` and `templates.md`, `scripts/read-reference.py`, the focused repair role, the slide decorator, `context-pictures.md`, and the tests named below). Nothing in the plugin was changed.

## Verdict

The ledger is a careful and mostly sound inventory: every paragraph has a row, most "story" rows keep the teacher's words, the two raised questions (D2, D3) are real, and the clusters K01, K05, K10, K12, K16, K18, K20, K26, K29, K33, K41 and K42 fold without loss once their carries are added. It is not yet safe to build from. Seven folds would lose a condition, a check name or a field name that the home does not hold (C04, C02, G68 with C01, G56, B93, F59, G66's tail); one annotation is filed against the wrong row so a dated ruling keeps its date (SD-L37 for SD-L16); a cross-reference would be left pointing at a heading that no longer exists (A83). Three clusters choose a home that runs against tests written to protect an earlier deliberate placement (K03 "the core keeps its execution cue", K27 "the profile is the only copy left", K07 and K31 "surface-specific rules moved from core"); those are design decisions for the teacher, not pins to move quietly. Six disagreements between the files, or between a file and a ruling in memory, are not raised, the clearest being the playbook's "headings written in full" against the Th, H, T, O ruling, the profile's "every digit ... is purple" against the 16 October "given numbers black" ruling, and the word card that the 13 October ruling keeps out from between a question and its answer, which only the check knows. The tests column misses several tests that hold the changed words. The SD-M09 claim is true.

## Findings

### 1. SD-B05 to SD-B10 (K02): the fold leaves a dead cross-reference, and a fourth copy is unmarked

- SD-A83 (kept, x:S2) says: "the task itself stays in the body (Main task versus header cue, below)". If the whole role section folds into the profile, that heading is gone and the pointer lands on nothing.
- SD-B07's "render the exact wording in the body composition" carries "exact" and "non-null"; the profile's SD-L26 says "place that wording". The copy-exactly rule elsewhere covers it, so this is minor.
- `templates.md` 1.4 "Header `instruction` is a secondary cue" is a fourth copy of the same rule ("A main source-authored task belongs in the body at task-reading size", "If a fixed template would force an essential multi-action pupil task into the header instruction, use a free template"). The K02 row list does not mark it x:S2.
- **Ledger should say:** SD-A83 is a "fix" row: its pointer becomes "(teacher-slide-visual-profile.md → Main task prominence and the header cue)". Add the templates 1.4 copy to K02 as x:S2.

### 2. SD-B84 to SD-B90 (K03): the fold breaks tests that pin a deliberate design, and SD-B87 is wider than its home

- Two test files say in their names that the role keeps a short cue on purpose while the profile owns the rule: `doc-claims.test.js` "the teacher profile owns main-task prominence and the core keeps its execution cue" (asserts the role holds "main pupil task or teaching object is the strongest body-level element" and "Do not hide it in header furniture") and "the teacher profile owns visible task phases and the core keeps its execution cue" (asserts the role holds "Make task phases visible"); `test_slide_designer_brain_contract.py` `test_core_preserves_execution_cues_without_second_ownership` asserts the role holds "Show the task once", "Make task phases visible", "Preserve card boundaries", "row-versus-stack judgement" and "Sparse physical-demonstration slides remain intentionally sparse" (SD-C30, an ask:D3 row).
- These are not incidental pins: they encode an earlier decision that the core role keeps a compact cue beside one owner. Folding K03 reverses it.
- SD-B87 reads "Attach each label, phrase, prompt, number and reference to the object or action it controls." The profile's Task-to-object attachment (SD-L74, SD-L81) is about the phases of one task and about instructions ("an instruction to inspect one source belongs with that source"); it does not say labels, numbers or references attach to what they control.
- The ledger's tests column lists tests only for SD-B85 and SD-B83; SD-B86 to SD-B89 hold pinned words too.
- **Ledger should say:** K03 is "ask": keep the six-cue list in the role (it is about 600 bytes) or fold it and rewrite those three tests consciously. If folded, carry "each label, phrase, prompt, number and reference" into the profile's Task-to-object attachment. List both test files against SD-B84 to SD-B90 and SD-C30.

### 3. SD-C04 (K39): "only when necessary" and "concept, phase" would be lost; a test pins them

- SD-C04: "When `pupilInstruction` is null, you may add one narrow title or instruction **only when it is necessary to operate a source-defined surface**. It must not add a new task, **concept, phase** or pedagogical decision."
- The home, playbook section 3 (SD-F27), says the designer "may author one short piece of slide furniture" whenever `pupilInstruction` is null on a pupil-action unit. It has no necessity condition. Its "It may not" list (SD-F33 to SD-F38) names no "concept" and no "phase".
- `test_slide_designer_brain_contract.py` `test_source_wording_and_content_ownership_remain_strict` asserts the role holds "must not add a new task, concept, phase or pedagogical decision". `brief-gap-protocol.md` holds the same words ("does not add a task, concept, phase or pedagogical choice"), but it is read only when no route remains.
- This is a strength loss: an "only when necessary" becomes a general permission.
- **Ledger should say:** fold:K39 with carry "only when it is necessary to operate a source-defined surface" into SD-F27 and "a new concept or phase" into the SD-F32 list; or keep SD-C04. Its test moves with it. If the teacher prefers F27's wider permission, that is a decision (ask), since the two copies disagree today.

### 4. SD-C02 (K09): "split only at a complete item or card boundary" is not in SD-G70

- SD-C02: "If a structured set must split, split only at a complete item or card boundary, use consecutive slides with the same `designUnitId`, and repeat every still-needed live reference."
- SD-G70: "If a structured set remains readable on one slide, keep it together. If it does not, use consecutive slides with the same `designUnitId`. Repeat exact group labels and every still-needed live reference. Do not remove a boundary clue to make the slide fit."
- SD-G70 never says where a general structured set (a sort, an option bank) may be cut. "Split only between complete cards" exists only for evidence classification (SD-B03, SD-G46, SD-G69). The sentence is pinned whole as SC-H50 in `success_criteria_ledger_pins.json`.
- **Ledger should say:** fold:K09, carry "split only at a complete item or card boundary" into SD-G70.

### 5. SD-G68 first sentence with SD-C01 (K08, K03): "every destination and every item" and "Keep every non-null detail" would go

- SD-G68 opens: "For `taskStructure.kind: "sort"`, show every group as a destination and every item as a separate chip, card or photograph card. Keep every non-null detail." The note says it "repeats G41 and goes".
- SD-G41 says how a sort looks ("Groups look like destinations. Label-only items look movable or selectable. Evidence items look like separate cards and keep each clue or photograph attached"), not that every group and every item is shown, and not that every non-null detail is kept.
- SD-C01 ("show every destination and every item") folds at the same time, so the completeness rule would survive only by implication from SD-B01's "protected exact pieces".
- **Ledger should say:** SD-G68 keeps its first sentence (it is the home of K08's completeness), or "every" and "Keep every non-null detail" are carried into SD-G41.

### 6. SD-G56 (K15): not word for word; "Do not add P3" would be lost

- The note says SD-G56 is "Word for word the end of the role's B41". SD-B41 ends at "... when no honest semantic visual exists." SD-G56 adds: "Do not add P3 merely because a vocabulary card is text-only."
- That sentence is pinned as VOC-N06 in `vocabulary_ledger_pins.json`.
- **Ledger should say:** fold:K15, carry "Do not add P3 merely because a vocabulary card is text-only" into SD-B41; move VOC-N06.

### 7. SD-B93 (K04): the field name `revealPair` and its three block types are not carried

- SD-B93: "For an exact ordinary reveal made from `text`, `numbered-questions` or `question-cards`, use the `revealPair` contract in `templates.md` on every changing supported block".
- The annotation's carry into SD-B26 lists the rendered-pair check, "a repair to either state rechecks both" and "record the teaching reason", but not this sentence. SD-B26 says only "the pairing contract in `templates.md`"; SD-G23 says "the pairing contract in `templates.md` for each changing supported text or question block". After the fold no file the designer reads at start-up names the field. The focused repair role names `revealPair` (line 46), so the name matters to the route.
- **Ledger should say:** carry the whole `revealPair` sentence into SD-B26.

### 8. SD-F59 and SD-L22 (K06): "on its own card" and the two tests

- SD-F59 ends: "its label is a whole sentence and is rendered whole, on its own card." The carry names only SD-L22's version ("rendered whole rather than shortened to fit a card"), which drops "on its own card".
- SD-F59 also opens with the reason "A short bank of selectable or matchable labels is material, not prose", which SD-B02 does not hold.
- `test_invented_people_and_the_spoken_question.py` asserts in both the playbook and the profile: "never about its length", "not length", "rather than joining them back into the instruction", "never rejoined into comma-separated prose". Its docstring says both owners were reworded so "material, not prose" could not be read as licence to shorten. The tests column lists it for SD-F59 only, not SD-L22.
- **Ledger should say:** carry "on its own card" and "material, not prose ... never about its length" into SD-B02; list the test against SD-L22 too.

### 9. SD-A82 with SD-G65 and SD-G66 (K19): the copy to keep is the role's, and D2 has a third party

- SD-A82: "A beat's `rehearsal` is a short slide of its own before the task, carrying three things and no more: `sayIt` as the instruction, `partnerAsks` as a blue question, and the beat's `reasoningWords` as a `chip-bank` under them."
- SD-G66 says the same three things, but places "Three things on it and no more" straight after the sentence about the task slide ("so it carries the case or question, the success criteria and the same `chip-bank` of words together ... Three things on it and no more: `sayIt` ..."). Read in order, "it" is the task slide. SD-A82 is the only unambiguous statement; folding it into the playbook copy keeps the ambiguous one.
- `test_teaching_reaches_the_board.py` asserts the role holds "carrying three things and no more" and "built from `strong-and-weak`".
- D2 (where the established line goes) has more parties than the ledger names. SD-A82 says all launch pieces sit "as separate pieces on a slide of their own before the task slide". `preferences.md` Slide Philosophy, read at start-up, sides with SD-G66: "the case comes first, on a short slide of its own before the model". `templates.md` `strong-and-weak` sides with SD-G65: "the gathering line, when the design still carries one, sits above", with an `established` slot.
- **Ledger should say:** for K19, keep SD-A82's rehearsal sentence (or carry it whole and repair SD-G66's order so "three things" sits on the rehearsal slide). D2 lists SD-A82, the preferences paragraph and the template entry beside SD-G65 and SD-G66.

### 10. SD-G66's tail (K31): the field name `keyQuestions` and a pinned check name would go

- The tail to be removed holds "Keep every structured `keyQuestions` entry visible in a readable treatment" and "A pupil-action slide makes the material, decision, response and active reference visible."
- SD-G53 says "a key question children are meant to think about during a Teach unit must be visible when the structured source provides it". It does not name the field and covers Teach units only. Section 13 does not hold the pupil-action sentence.
- `test_slide_designer_brain_contract.py` `test_playbook_preserves_surface_specific_rules_moved_from_core` asserts the playbook holds "structured `keyQuestions`" and "PUPIL_INSTRUCTION_AMBIGUOUS". The tail removal and the SD-C03 move together remove the playbook's only copy of the code name. The test's name says these rules were moved out of the role into the playbook on purpose.
- **Ledger should say:** carry "`keyQuestions`" into SD-G53 ("when the structured source provides it in `keyQuestions`"), and keep the pupil-action sentence or name its home. List the brain-contract test against SD-G66 and SD-C03, and decide with the teacher whether the code name stays in the playbook.

### 11. SD-B03 as K07's home: the fold reverses an earlier move and leaves what the focused repair reads

- K07 makes the role's SD-B03 the home and folds SD-G26 (section 10, answers), SD-G46 (section 12) and SD-G69 (surface cues).
- `test_slide_designer_brain_contract.py` `test_playbook_preserves_surface_specific_rules_moved_from_core` asserts the playbook holds "evidence-cards". After K07, it holds none.
- The focused repair reads "the affected rule ... in `slide-composition-playbook.md`, including ... §10 for either state of a question/answer pair" and reads the role only as a last resort. An evidence-classification answer fault would no longer find its rule in section 10.
- **Ledger should say:** make the home the playbook (SD-G69 or SD-G26, gaining SD-B03's "Never place several photographs above one combined answer strip" and "keep the same `designUnitId`"), and fold the role's SD-B03 to its copy-exactly sentence; or put the choice to the teacher. `doc-claims.test.js` also pins "Never place several photographs above one combined answer strip" in the role, so either way one test moves.

### 12. SD-L53 and SD-L54 (K27): the tests say the profile must keep them

- `doc-claims.test.js` "the deck's composition criteria survive in the profile the designer applies" asserts the profile holds "The active pupil-working surface normally wins space over a supporting setup picture." Its comment: "The checklist is gone, so the profile is the only copy left and every one of them has to still be in it." A second test, "teacher profile aligns related groups and uses spare space for important content", asserts "active pupil-working surface normally wins space".
- The profile's own Final teacher pass (SD-M04) checks this rule, so the profile is its natural home.
- **Ledger should say:** home:K27 is SD-L53 and SD-L54 in the profile; SD-F65 and SD-F66 fold, carrying "Do not make the photograph the hero merely because it is visually attractive" and "Use an asymmetric split when one object does more teaching work". Keep "non-load-bearing" in the home, because it is what separates this rule from SD-B19's "the source is the hero and the frame takes the height its rows need".

### 13. SD-G81, SD-G82, SD-G83 (K30): the tests pin the playbook copy, and the colours home pin is exact-order

- `category-colours.test.js` "the template contract owns the container-border rule and the playbook keeps the cue" asserts the playbook holds "A category container takes its colour on the border through the documented `categoryColor` field" and "Ordinary question lists and success-criteria steps stay out of that palette". The carry moves both to the profile: the test's stated design ("the playbook keeps the cue") is reversed.
- `doc-claims.test.js` asserts the playbook holds "Prepared examples and visible-in-unit models are worked examples, in purple" (commented as decision 11, 24 September) and "asking versus telling" (its comment: "the playbook and the preferences copy must carry the same grammar"). The pointer that replaces SD-G81 must keep those words or the tests must be rewritten.
- `colours_ledger_pins.json` pins the profile's `## Semantic colour` section as a home with its paragraphs in exact order. Adding SD-G82, SD-G83 and the two `categoryColor` sentences, and taking dates off SD-L56, SD-L61 and SD-L66, breaks that home. The colours record builder is frozen, so S1 needs its own repin script (as `ws-change/w9_repin_other_topics.py` did).
- **Ledger should say:** list `category-colours.test.js` and both `doc-claims.test.js` tests against SD-G81, and the colours home pin against SD-L59. The `categoryColor` move is a choice to make knowingly, since the test names the playbook as the cue's place.

### 14. SD-F76 (K25): the profile does not hold "bottom alignment"

- SD-F76: "choose deliberate top alignment, bottom alignment or vertical centring."
- The profile (SD-L42 to SD-L44): "align their top and bottom edges when they genuinely share those boundaries; otherwise vertically centre ...; do not pin both zones to the top by habit". Aligning both edges is not bottom alignment, and deliberate top alignment is allowed only by implication.
- The note "says it with its three options. Carry: nothing" is not accurate.
- **Ledger should say:** carry "deliberate top or bottom alignment" into the profile's list, or keep the sentence.

### 15. SD-L37 is the wrong row; SD-L16 keeps its date; SD-B37 is an unmarked dated ruling

- The annotation on SD-L37 reads "Keep 'both needed paragraph breaks though' without '(4 October 2026: ...)'". SD-L37 is profile line 79, "The zone's long axis is a tiebreaker only when both arrangements protect...", which has no date and no quote. The quoted ruling is in SD-L16 (profile line 37, "A line break the design wrote is not yet that gap ... (4 October 2026: `both needed paragraph breaks though`)"), which has no fate. The annotation keyed a line number as a row ID.
- SD-B37 (role line 275) carries "The teacher chose this on two slides (8 October 2026)" and has no fate.
- **Ledger should say:** SD-L16 story (keep "both needed paragraph breaks though"); SD-L37 no fate; SD-B37 story (drop "(8 October 2026)", keep "The teacher chose this on two slides").

### 16. Disagreement not raised: worked-answer headings in full against Th, H, T, O

- SD-G31: worked answers need "drawings at a good size, their headings written in full", and "Fitting the set onto one slide by shrinking the digits, cutting the headings to initials or shrinking the questions is not a further step to try: it is the failure."
- SD-A99: "`place-value-chart` heads every column with its short name (`Th`, `H`, `T`, `O`) whichever form you give it ... That is the heading the teacher wants on every chart and column sum, more room does not bring the full word back". His 8 October ruling (column-headings-short-and-blank-frame-extra): Th, H, T, O "is fine as the heading on every column sum"; he "does not want the full words".
- G31's "looks awful" was said of five sums "with the headings cut to initials and the sums small"; what he disliked may have been the size, not the initials.
- **Ledger should say:** a new ask: does SD-G31's "headings written in full" stand, given SD-A99 and his 8 October ruling? SD-G31's story trim must not settle it.

### 17. Disagreement not raised: the profile says every worked digit is purple; his 16 October ruling says the given numbers stay black

- SD-L65: "A place-value chart's worked rows take `worked: true`, and every digit in them is purple, the ringed one and its ring included."
- `templates.md` (`worked: true`, section 4) now says: "the numbers the sum was set with stay black, so children can see what was given and what was done (16 October 2026)". Memory (worked-sum-given-black-one-margin): "On every worked sum ... the numbers it was set with stay black; the exchange marks, carried digits and answer are purple. 'yes'." The builder was changed to match.
- **Ledger should say:** SD-L65 "ask" (or "fix" to his ruling, put to him): the profile contradicts the template and the engine on every worked column sum.

### 18. Disagreement not raised: a word card between a question and its answer

- His 13 October ruling (fractions-deck-rulings): "A card never sits between a question slide and its answer. It goes straight after the answer, 'or it could have went before the task'." `check-slide-design.js` enforces it ("the card sits after the answer or before the question, never inside").
- SD-B39 and SD-G57 tell the designer to put the card "straight before the first slide whose board does" show the word, with the starter as the only exception. When the answer slide is the first to print the word, the written rule puts the card exactly where the check refuses it. Neither file nor `preferences.md` Vocabulary carries the exception.
- **Ledger should say:** K15's home gains nothing new now (no new rule in a fold), but the gap goes to the teacher as an ask: his ruling lives only in the check.

### 19. Disagreement not raised: the material "lower" against the story first

- SD-F43: "Set the material apart as the element the eye lands on: larger, lower, in its own line, card, table, diagram or picture area."
- SD-A86 (his 13 October ruling): "the story should come first and be visually easy to see, then the instruction", the order down the slide being "the story, then the question about it, then how to go about it". `preferences.md` Slide Philosophy agrees ("the class reads or hears the thing ... and then meets the question about it. Put the two on the slide in that order"), and makes one exception: a figure children write on goes below the instruction.
- For a written case, SD-F43 says below and SD-A86 says above.
- **Ledger should say:** a new ask, or a "fix" bringing SD-F43 under SD-A86's scope ("lower" for a figure or picture, "first" for a written case), put to him.

### 20. Disagreement not raised: dividing one My Turn "for nothing else"

- SD-F98: "Dividing one My Turn is for a representation that cannot be used shared, and for nothing else." SD-G01: "the reason to divide has to be a measured floor the shared version breaks, named in the build."
- SD-G12 gives a second reason that is not a size floor: two examples that would share one annotated figure each get their own slide, because the teacher otherwise rubs out the first before the second (`ONE_MODEL_PER_ANNOTATED_FIGURE`).
- The two are reconcilable (one shared figure against two figures on one slide), but "for nothing else" says they are not. K12 groups SD-G72 with SD-G12 and does not look at this.
- **Ledger should say:** a note on SD-F98 for the teacher, or a "fix" naming SD-G12's case as the other reason.

### 21. Lesser disagreements to note for the teacher

- SD-B35: "wrapping it in an `sc-panel` tells children the facts are the standard". His 13 and 14 October rulings (teach-slide-criteria-and-speaker, criteria-sets-share-one-box): "A table of meanings may sit inside the success criteria box", "two sets of criteria share one green box, steps first, table under". Reconcilable (his case is a table the planner filed as criteria), but a designer reading SD-B35 alone would pull it out.
- SD-B77: "Labels print at 20pt on the board whatever size the picture is drawn". `templates.md` and his 8 October ruling add "(18pt where 20pt would leave the picture too small, never less)".
- SD-G30 calls the exchange digit "the small 1"; his 13 October ruling says it is "the exchanged ten" and never "small 1". The text is the agent's, not a child's, but it is the phrase a designer may echo.

### 22. Missed repeats (unmarked in the ledger)

Within the three files, each carrying something of its own, so none is a straight fold:

- SD-B27 (the answer shown on the figure) with SD-G23 ("the swap reaches that drawing as well as the words"), SD-G29 and SD-G32. B27 alone says the question slide stays unmarked; G23 alone says "the same kind of drawing in the same place". Belongs in K04.
- SD-B36 and SD-B37 ("Keep a structured visual structured", "A table stays a table") with SD-G39 and SD-G40 (discrete objects, "headings look like headings").
- SD-B64 ("prioritise the photograph's size over surrounding prose") with SD-F64 ("A photograph used as evidence should dominate the prose") and SD-F67.
- SD-B65 (comparison set) with SD-G51 and the folded SD-G73; SD-G75's carry already relies on SD-G51, so K10 and K11 should list them.
- SD-L14 ("The telling-to-asking boundary is always a break") with SD-L60 ("The boundary is the sentence, not the block"), both in the profile.
- SD-L93 ("Repeated photographs, diagrams and references return with the same treatment") with SD-F83 ("the reference keeps one consistent, quieter place and proportion").
- SD-F68 ("Related peers share one grow-fit group"), SD-G44, SD-G45 (`sizeGroup`) and SD-L09 (peers share one width).
- SD-A87 (a unit's picture stays on its slides) with SD-F96 ("The picture stays on both halves") and SD-F97 ("Repeat a picture ... on both slides when children still use it").

Copies outside the three files, to mark x:S2 or x:S3:

- K02: `templates.md` 1.4 (finding 1). K20: the `teach-layout` entry in templates 2.3 repeats `TEACH_SLIDE_NEEDS_TEACH_LAYOUT` and `TEACH_LAYOUT_REPEATED` (SD-B14, SD-G61, SD-G64). K19: templates `strong-and-weak` (finding 9).
- `preferences.md` Slide Philosophy: "Slide question labels are always purple" with SD-L73; "Green has a fixed teaching role" with SD-F75 and SD-L69; "Use the whole slide, and give the eye somewhere to land" with SD-F78 and SD-F68; "One coherent teaching move per slide" with SD-D31 and SD-G71; "The slide carries the takeaway ... answers the question the title asked" with SD-G52 (K31); "The same scan path is why support sits late" with SD-B38; "Giving a task its instructions is not launching it" and "The good instance is shown, and only the difference is said" with SD-A82, SD-G65 and SD-G66 (K19); Speaker notes hand-off with SD-C10 to SD-C18.
- `preferences.md` Success Criteria: "Do not put the criteria on their own introductory slide" with SD-G21; "On an ordinary paired answer reveal, keep the complete criteria in the same place" with SD-G23; "A table of facts the child reads is a representation, not the criteria" with SD-B35.

### 23. Reading reach: the slide designer is safe; the focused repair is not

- `scripts/read-reference.py` `ROLE_COMPANIONS["slide-designer"]` gives the profile and the playbook whole (`("teacher-slide-visual-profile.md", ())`, `("slide-composition-playbook.md", ())`), with the role read. No fold moves a rule into a file the designer reads only sometimes.
- `agents/slide-designer-focused-repair.md` reads "only the affected rules" of the playbook and the profile by trigger, and the role "once" only when narrow reading fails. Every fold whose home is the role takes a rule out of what the repair reads: SD-F23 and SD-F24 (the repair cites "`slide-composition-playbook.md` §3" for exact wording), SD-G26, SD-G46, SD-G69 (finding 11), SD-G57 (word-card placement), SD-G56, SD-G75, SD-F59 and SD-L22 (finding 8).
- **Ledger should say:** a reading-reach column or note for these rows; prefer the playbook or profile as home where the repair's trigger points there.

### 24. Tests column: further gaps

Besides those named above: SD-M09's trim breaks `test_slide_designer_brain_contract.py` `test_optional_visual_pass_has_one_owner_and_one_timing`, which asserts the profile holds "optional-picture-pass.json" and "check the earlier optional P2/P3 pass" (a pin that should move to the decorator, which already holds the record); SD-G57's fold breaks `doc-claims.test.js` "the composition regressions from the electrical-appliances deck stay fixed" ("one per introduction the design planned", "do not split a group because the words look separable"); SD-G72 and SD-G73 would empty the headings "### Worked examples and physical demonstrations" and "### Comparison, sequence, and fan-in", which the brain-contract test asserts; SD-G34's fold breaks `test_teacher_voice_ledger_is_kept.py`, whose comment ties the three triggers to his decision 4 ("his 'yes'"), so tell him one of the three goes; SD-B11 and SD-C21 break `test_lesson_design_contract.py` (both are pins that can move: SD-A42 and SD-B20 hold the meaning).

### 25. Smaller notes the lead got wrong or left open

- SD-B67: "Word for word the playbook's caption sentence". It is not ("a specific place", "do not hide task-critical content in small italic caption text" against "Information children must act on belongs in a proper readable text slot"). The meaning holds, so the fold is sound.
- SD-G65 contains an orphan after the pointer: "It is not a paragraph and not a caption." Its "It" has lost its referent. A "fix" row, wording to him.
- SD-F96 (story) and SD-G62 (keep exactly) both name the two example files, with dates. Say whether the dates beside the file names stay in both or go in both.
- SD-H20's renumbering must keep "7. What changed since the last slide..." as item 7: `test_rhythm_holds_in_every_route.py` asserts that exact string.

## Rows checked and found sound

- K01: SD-F04, SD-F05, SD-F06 (word for word as claimed), SD-F07 with its carry into SD-A76.
- K02 content of SD-B05, SD-B06, SD-B08, SD-B09, SD-B10, SD-F45, SD-F46 (apart from finding 1).
- K05: SD-F53, SD-F55, SD-F56, SD-F57, SD-F58 with "safety-warning" carried into SD-L21 (`colours_ledger_pins.json` pins move).
- K04: SD-B92, SD-B94 (carry into SD-G29 complete), SD-B95, SD-C20, SD-C21 (carry complete; its test pin can move).
- K10: SD-G75 with its carry; SD-B67 (meaning holds).
- K11: SD-G73 with its carry. K12: SD-G72 and SD-G77 in meaning (the headings issue is in finding 24).
- K16: SD-A20 as home, SD-B28, SD-G15. K18: SD-G34 in meaning. K20: SD-B14 with its carry. K26: SD-F77 and SD-L84 with `groupAccent`. K29: SD-B13 with its carry. K33: SD-M10, SD-M11. K41: SD-C42 with its carry. K42: SD-A88 and SD-F97 both kept.
- SD-B11 (SD-A42 holds the ownership; the pin moves), SD-C03 (move), SD-C05.
- SD-F81 "fix": correct, staging is section 6 (SD-F95, SD-F96); `test_attention_and_teaching_rhythm.py` does not pin "§8".
- SD-H20 "fix": correct (two items numbered 7).
- SD-B82 trim: the dropped sentence is history only.
- SD-M09 trim: the claim is true. `agents/slide-decorator.md` writes `optional-picture-pass.json` as it goes and, at its line 115, will "check the pass record against the deck and the measurement" through `check-optional-pictures.py`; `context-pictures.md` says "a slide recorded `full` or `competes` while the render shows readable clear space fails, and names the space" and makes `would-mislead` name its task, searches and the drawing it fears. Only the test pin needs moving (finding 24).
- Story rows keep the teacher's quoted words as written in their notes: SD-A01, SD-A16, SD-A77, SD-A85, SD-A86, SD-A87, SD-C46, SD-F48, SD-F96, SD-F97, SD-F99, SD-G18, SD-G23, SD-G30, SD-G31, SD-G44, SD-G49, SD-G60, SD-G61, SD-G63, SD-G66, SD-G68, SD-L56, SD-L61, SD-L66. Every dated line in the three files has a story row except SD-B37 and SD-L16 (finding 15).
- D3 (SD-C22 against SD-C71) is a real tension; the profile's SD-L96 "read each slide from a distance" belongs in it too.
- SD-G02 against his 16 October "each slide shows whatever lists its own work needs": consistent, as the lead noted.
