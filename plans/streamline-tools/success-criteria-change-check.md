# Independent check: the success-criteria change (4.2.288, uncommitted, on top of 4.2.287)

What I did: read the brief, the ledger's sixteen decisions in his words and the read-back, the sixteen proposals, all 392 rows, the change plan, the mapping, the change scripts and the previous check; diffed all 44 changed tracked files against HEAD word by word, and read the new pin file, the new test and the eleven moved rows of the earlier topics' pins; checked by script that every quote of the 324 "unchanged" rows is in its file now and was at HEAD; searched the whole plugin (instructions, programs, tests, fixtures, evals) for the retired wordings and for text the new wording now contradicts; ran every suite (Python 2,174 passed and 1 skipped; node: worksheet 717, builder 709, wall 142, shared 130 and stick-in 70, all passing), checking before and after that nothing in the plugin was written; ran HEAD's and the new validator and review-page code over all 90 saved `lesson-design.json` files and compared results and whole views; rendered the saved `worksheet.json` files that carry a criteria panel through the new engine (11 files, 10 of which still lay out), and put three of them through the designer's own preflight; re-ran the mapping builder on a separate scratch copy (its paths pointed there) and compared its output with the repository's; and ran 97 break-the-rule experiments on a scratch copy of the whole plugin (everything but `node_modules`, with the five ledgers beside it). On the untouched copy the five ledger pin tests pass (65 tests, 22,317 subtests) and so does the whole Python suite (2,174 passed, 1 skipped), and the node suites pass with the real `node_modules` on `NODE_PATH`. I changed nothing in the repository except writing this file.

Findings are ordered most serious first inside each heading. Anything checked and found sound is listed at the end of its heading.

---

## 1. Row by row (the 68 rows this change made, and 4 decision rows)

**1a. SC-N08: the check that the board's criteria fit the worksheet's own task has gone, from the designer's instructions and from the review page.**
- Old (`lesson-designer-components.md`): «Apply `preferences.md` → Support, Checking and Release to the worksheet's actual tasks and intended use. Check reused criteria against the worksheet's evidence and response, not only the board task they originally served.»
- New: «Apply `preferences.md` → Support, Checking and Release to the worksheet's other support, and record where a child still meets a reference in existing planning fields».
- "Other support" now takes the criteria out of that check. But the criteria are still what children use while they do the sheet: the playbook keeps «The criteria stay on the board because children consult them while they write, which is also why the sheet does not reprint them» (SC-H09). With decision 8 the board's list is the only list a child working on a sheet has, so whether it fits the sheet's questions matters more, not less.
- The review page lost its half too: the class view printed the worksheet's criteria beside the sheet (4.2.286), and those are now always empty, so nothing puts the board's criteria beside the sheet's questions. `test_reused_worksheet_criteria_are_resolved_beside_the_new_task` still sets `worksheet.successCriteriaRefs = ["sc-001"]` to test that view, a state the validator now refuses.
- The ledger marked this row as carrying that extra check; the mapping's line for it says only «a worksheet never carries SC, and the validator refuses any».

**1b. SC-J03 (decision 1): the one example of a picture mark is a word the new sentence says goes green.**
- New: «Every taught word is green, every time, even when it also names a coloured part of the picture (`tens` beside a coloured tens column is green). The picture and orange marks go on the other words doing that work ... `Compare the ((thousands)) first. If they match, move right and <<stop at the first digit that is different>>.`»
- The picture mark exists only for place-value columns («Place-value columns are the parts the engine colours today»), and in a place-value lesson those are usually the vocabulary cards. So the example teaches the case the rule has just turned round. It needs "(where `thousands` is not one of the lesson's cards)", or a taught word shown green beside it.
- The code's own description of the marks still gives the old order: `shared/text/criteria-marks.js` «gives three kinds of word their own colour, in this order of priority when one word could be two: ((thousands)) ... {{interval}} ...». It is a comment, but it is the colour code's statement of the rule, and it says the picture wins.

**1c. SC-D14 and SC-D16 (decision 15): the bullet under "What changed each time" no longer names a change, and sits under the pair it praises.**
- The pair stays exactly, as he asked: «> Same? Move one place right. / Different? Choose < or >. > became > If they are the same, compare the hundreds. / Put < or > ...»
- The list headed «What changed each time:» now says: «**Write a condition so the child knows what to do next.** A short question that does is a good step (`Same? Move right.`), and so is an `If...` sentence».
- An agent reads a rewrite of `Same? Move one place right.` explained by a bullet saying that shape is good. What did change in that pair (the step now names what to compare, and the choice gets its deciding rule) is in the bullets either side, but nothing ties this one to it. One clause fixes it: "the question was not the fault; `compare the hundreds` names what to compare".

**1d. SC-K06 (decision 13): the report-back route is gone for every list, not only tables, and a list that fits nowhere now has no way out but a blank slide.**
- Old: «If no supported composition can present the necessary work, report the specific representation or layout capability needed through the existing repair route rather than pretending the lesson only needs five steps.»
- New: «When a composition does not hold the whole list, try a roomier one ...; the criteria are not reported back as unfittable, and never reshaped or cut to fit.»
- His words were about tables ("I don't think the slide designer reports back. There should be a way to make it fit"), and the read-back put the fitting of a very large list in a separate investigation. With fewer criteria, the criteria slide for overflow and the report all gone, a list too long for half a slide at 18pt meets `SC_PANEL_TOO_LARGE` or `STEP_TEXT_OVERLOAD`, the slide builder leaves that slide blank, and the deck ships flagged. That is his call, but it should be put to him, and the old route was the only thing telling the investigation which layout was missing.

**1e. SC-L01, SC-L04 and SC-L05 (decision 5): "the exact same steps" for a mark that also covers labelled sets.**
- Home: «criteria that go up are the exact same steps the class used, never a different version». Designer and contract: «which puts up the exact same steps if it takes them».
- `drawLive` covers «A labelled set that a later lesson assumes» (the named angles, the four tooth types) as well as a method. For a labelled set the guarantee should read "the exact same reference". The wall's own rule already says «copy its categories, steps and pictures faithfully» (SC-L13). Low.

**1f. SC-O04 (decision 12): the two-card repair lost its condition, and meets the diagram rule.**
- New: «make room: take the card's picture off ..., drop non-SC extras, or carry the list in order over two cards of the same type and title».
- The focused repair keeps the condition that makes two cards possible: «when the wall holds only one teaching card (it takes two)». The designer's version does not say it.
- Taking the picture off meets «The wall card needs the same diagram or the support evaporates between desk and wall» (`working-wall-visual-language.md`, SC-O11) when the criteria slide's visual is a drawn diagram. Two cards is then the only move that keeps both. Low.

**1g. SC-D11 (decision 9): the voice guide still leans a second sentence towards a fault.**
- New: «A step that needs a second sentence is usually two steps, or is carrying an explanation the teaching already gave; a second sentence that only names what the step has just produced goes».
- The home and the skill route say «A second sentence is not a fault in itself» and the skill route adds that one giving a condition the step always meets can stay. The voice guide, which «owns how a step reads», names neither, and his rounding rewrite keeps `Round to the nearer ten. If it is halfway, round up.` Low.

Checked and sound:
- **The 324 unchanged rows:** every ledger quote is in its file now, was at HEAD, and is pinned.
- **A02** (contents line names the new contents); **C01, C02** (stems join the forms, nutrient table and recognition kept whole); **C07, D31** (the designer's copy became a pointer; every clause it carried is in the home: the stuck child, what to do next not the stage, one sentence normally, a clear step left alone, no targets, the condition, the lookup, the nutrient example; the self-check and the rewrites pointer kept); **C10, C11** (clear before short; the pointer names every form); **C18, C23, O23** (the three examples are his own rewrites word for word: the comparing pair with `Compare the thousands digits first.` in front, and the rounding list twice); **D04, D06** (normally one sentence; a condition that is part of a step stays, as `If...` or a short question; a fact or occasional case is extra knowledge); **D10**; **D14** (his rounding rewrite without the two result sentences, the other two pairs exact); **D21, D26** (his words kept, dates to the log, and 346 now in the log with its date); **D27, D40** (the occasional case as extra knowledge; "note under the steps" gone); **D33, F13** (the wrap-around carries Concept 1's steps in their own words); **D37, D38** (both his decisions, and "a common sign ... that explains or restates it" keeps the explanation case); **D44** (retired); **E12** (only secure from earlier lessons; AK-F30 moved with it); **H01, H04, K05** (the criteria-only slide for criteria taught, compared or built, never overflow; no step default); **J01, J06** (the worksheet out of the colour sentence); **K07** (whole list or none); **K13** (true to the code since 19 September, and its test moved); **K43** (a table stays a table); **L12, S17** (offered, the wall-worthy test decides); **N01 to N07, N10, N12 to N15, N20** (decision 8's wording; the rounding-sheet story kept as the reason for rule 14); **O14, O15, O19, O20, O22** (the old exception gone; a criteria step copied and the card makes room); **P01** (Greater Depth); **Q01** ("may stay" became "stays", and the reviewer's line takes decisions 2, 6, 9 and 15); **S06, S07, S12, S18, S20** (section 4).
- **The mapping and pins are reproducible:** the mapping builder, run on a scratch copy with its paths pointed there, produced a pin file and a mapping identical to the repository's (461 pins, 68 changed rows).

---

## 2. Each decision against what he agreed

**2a. Decision 6 did not reach the route files that define what criteria are, and they still say the thing he disagreed with.** His words: "Success criteria isn't this is what a good answer does ... it's something the children can use to help them do the thing." Unchanged:
- task-centred, Set the Task (above the reviewer's line): «The success criteria here is the standard for the task itself», glossed as «what makes a good fair-test plan, a strong bridge, a clear opening paragraph», and «it stays visible while children work, because it is the thing they are aiming at»;
- task-centred (above the line): «**Success criteria** is the standard for the task, kept visible throughout. Use how-to steps when the task turns on a clear move (the fair-test sort); a feature checklist when it's a product or a piece of writing.»;
- task-centred, Output Format Block: «Do not repeat `What good looks like` inside `content`. Define that standard once as success criteria»;
- content-based (above the line): «When children need one, show the features or decisions that distinguish a successful performance».
- The designer reads the route file every run on those routes, and the first two are the definition it meets first. The change plan chose this ("The routes' stem banks and feature lists read against that"), so it came in at the plan. But the home's new bold sentence and these lines now say opposite things, and a writing or design-and-make lesson is exactly where decision 6 says stems count.
- Milder, the same word: the templates' `sc-panel` «so the criteria reads as the standard wherever it sits» (twice), `slide-success-criteria.md` «those steps are the standard to work to», the slide designer's «visible standards» and «tells children the facts are the standard», the reviewer's «not the standard for a lunch plan», the launch refusal's «a model that would fail the standard», and do-beats' «the steps the work is judged by». These read as a label rather than a definition; I would leave them to the voice topic.
- Written Voice keeps «**Success criteria are clear actions, not miniature explanations and not shorthand.** ... Use direct actionable verbs.» and Slide Philosophy «Success criteria are short runnable actions.» Neither admits a stem or a short question. Low.

**2b. Decision 8 went wider than "success criteria" and left a step list a child works through with nowhere to go.**
- His words: "I don't want any success criteria on worksheets." Rule 13 now: «nothing on the page reprints the criteria or a method's steps, as a panel or as a list»; `render.js`: «Success criteria, and a method's steps, stay on the board»; the instruction refusal: «If they are the lesson's success criteria or the steps of its method, leave them off».
- Still in place: preferences → Worksheets, «A step list a child must work *through* in order before they can answer anything is not support at all: it is part of the task, and goes above the questions in their own column»; and the worksheet designer, «a step list worked *through*: no, and without it there is no answer, so it is part of the question and sits with it».
- The engine now refuses both the `steps` panel and a three-line instruction, so that list has no helper to print through. Either the step list is a criteria list (and the two passages should say so and go), or it is not (and "a method's steps" is wider than the decision). The log already puts `method-frame` to him; this is the same question.

**2c. Decision 8: the stand-alone sheet has no answer.** Support, Checking and Release keeps «For support the task needs, make its location clear in the existing design: on the sheet, in a retained shared reference, or in another explicitly available resource. A separate worksheet need not duplicate a reference that remains accessible, but a resource intended for use on its own cannot assume an unseen board.» (AK-J03). Its counterpart in the worksheet designer (AK-J14, «Include the exact concise criteria when the sheet must stand independently») was turned round and its pin moved; this one was not. A sheet used away from the board (a cover lesson, homework) now cannot carry the criteria and is told it cannot assume the board. The Greater Depth sentence has the pattern («written into the task or the standard it asks for»); nothing says it for any other sheet.

**2d. Decision 8: a kept story shows the steps on the sheet as the right answer.** preferences → Worksheets: «The teacher rejected exactly that on 1 September 2026, on a PSHE sheet whose three steps sat in a 30% left column ...; the same page with the columns the other way round gives the task its full run and still keeps the steps in view.» The log files those three steps with «steps, success criteria, word banks and reminders» (1 September): a steps panel on the Expected sheet, the thing decision 8 now forbids. The paragraph before it had "Steps, success criteria" taken out; this one was left. It is in the log already, so it can go or lose "still keeps the steps in view".

**2e. Decision 12 did not reach the wall's program**, which is what "aims the repair" (the wall designer: «let the build's refusal message, which names the card, the item and the exact overage, aim the repair»). `working-wall-html/src/layout.js` still says, for any item, a criteria step included: «Cut it to ${budget} characters or fewer», «an item over its own budget fits only reworded, which is the wall designer's decision», and «otherwise remove an item or shorten the longest». The ledger found this in passing. The instruction files now say the opposite; the message the designer is told to follow does not know which items are criteria.

- **Decision 1: faithful** in the home and the validator (1b is the example). The slide visual profile and the skill route's table line needed nothing.
- **Decision 2: faithful.** The designer's and reviewer's branch checks (E13, E14) are unchanged; the proposal wanted them reworded, the read-back did not, and they still make sense for a condition the method meets every time.
- **Decision 3: faithful** (the home, the placement file, both builder messages). One wording pull, low: the new «never only some of them ... anywhere else» sits beside decision 14's «carry the Concept 1 steps the Concept 2 problem needs», which is some of a method's steps inside another list. The playbook's «Choose a roomier slot, a different template or a coherent split» (SC-I03) is unchanged and can be read as the list split over slides.
- **Decision 4: faithful.** The panel refusal says «taught or built» where the home says «taught, compared or built».
- **Decision 5: faithful** (1e is wording).
- **Decision 6:** the home, the designer's pointer, the skill route's pointer and the reviewer as read back (the reviewer says «explain or write», the home «explain, discuss or write»; both are within the plan); history's significance questions untouched; the routes, 2a. The contract still has no way to record stems beside the steps (the three types are `steps`, `reference-table`, `labelled-reference`), so "beside the steps" means a second `steps` object. Low.
- **Decision 7: faithful.** One example of the same shape is left: `slide-success-criteria.md` illustrates a step that points at the question with «"read the question: what am I comparing?"», the "read the question" shape he said "isn't really success criteria". It was not one of the seven. Low.
- **Decision 8:** the wording, the validator, the contract, books-or-sheet, the catalogue, slips and Greater Depth are all done; 2b, 2c, 2d, 1a and section 4 (4a) are the gaps. Below: the adaptation designer reads the home, and its "Holding the steps" dial («One step at a time, the sequence chunked, a worked example beside the first attempt») reads as the task chunked, not the criteria printed, so I think it is sound; the read-back's "the Below-sheet exception goes" was the proposal's exception, never written, and nothing wrote it.
- **Decision 9: faithful in the words**; the review page's cue is 4b; 1g.
- **Decision 10: done for the designer's section only**, which is what the designer reads. The other copies stay (Written Voice's D08, Slide Philosophy's D09, the skill route's D36, the task-centred A06 and A07, the wall designer's O03 to O06). Sound given "whatever's best for the designer", but the log's "the core rules were written three to seven times each" reads as if they were folded.
- **Decision 11: all seven corrected.**
- **Decision 12:** the instructions faithfully; the program, 2e; 1f.
- **Decision 13: faithful**; 1d is the reach.
- **Decision 14: faithful.**
- **Decision 15: faithful** (the voice guide, the skill route, the reviewer, the cue); 1c.
- **Decision 16: faithful.**
- **Added that no decision asked for:** "a method's steps" in rule 13, the engine and the refusal (2b); "never reported back" for every list (1d); a Greater Depth sentence (sound, the decision needed it).
- **Asked for and missing:** decision 6 in the routes (2a); decision 12 in the wall's program (2e).

---

## 3. What must not have moved

All still where they were, word for word, and each deletion was caught (section 6): his approved rewrites in the voice guide other than the rounding one (the step-size pair, the comparing pair, the history comparison, `Compare the thousands digits first.`, the choice rule, the pronoun, the arithmetic, the fronted adverbial pair, the prefer list and the calibrated example); the nutrient-table sentence; recognition as the one case where a labelled set is the criteria; building live, `drawLive` and its limits (reworded only as decision 5 asked); the half-slide limit in the home, the placement file, the templates and the builder (`MAX_SLIDE_SHARE = 0.5`); the colour marks' syntax and the validator's check of it; history's three significance questions, its Shaftesbury story and its limit.

---

## 4. The code

**4a. The worksheet refusal fires only at the build, after the designer's own preflight has passed the sheet.**
- `CRITERIA_NOT_ON_SHEETS` is in `renderSheet`. The designer's final gate, `check-worksheet.js`, runs `checkWorksheet`, which calls `checkFit` and never `renderSheet`. Its own comment: «A designer whose sheet is called clean here and refused by the build does the whole round trip again to learn something that was already known, so every fault the build refuses is reported here too.»
- Proof on a scratch copy: `working/year-4-maths-lesson-16-roman-numerals-to-l/worksheet.json` prints `WORKSHEET_PREFLIGHT_OK`, and its Expected sheet is then refused (`CRITERIA_NOT_ON_SHEETS: sheet.zones.a.stack[8]`).
- At the build the refusal stops the whole pack, not one sheet: `build-worksheet.js` renders every sheet in one loop after its own fit check has passed, the signal is passed straight out, and `--omit-unfittable` leaves out only a sheet that is too tight. So one panel on a Below sheet costs a repair round after the build, or the pack.
- The habit is common: in the 10 saved worksheets that carry a panel and still lay out, 17 of 23 sheets would be refused, on Below, Expected and Greater Depth alike, and a Below sheet's panel does not come from `worksheet.successCriteriaRefs`, so the validator never sees it.
- Two more of the same kind:
  - the scaffold still writes `"successCriteriaRefs": [PLACEHOLDER]` for a generated worksheet (`lesson-design-scaffold.py`, where the teacher-provided branch writes `[]`), so every run is asked to decide something that is no longer a decision (29 of the log's 53 saved designs have criteria there);
  - no test feeds the validator a design with worksheet criteria: only its message is pinned, and loosening its condition passes everything (C01).

**4b. The review page's second-sentence cue lost the two questions that catch a bad second sentence.**
- Old: «more than one sentence; is it two steps, or carrying explanation the teaching already gave?»
- New: «more than one sentence; does the second only restate the step or name what it produced (then it goes), or give a condition the step always meets (then it stays)?»
- Decision 9 asked only that a second sentence stop being a fault in itself. The new cue offers two kinds, and the real ones are often neither. The test's own example, `Look at the equator. Above means the Northern Hemisphere.`, is the voice guide's own example of explanation («what a word means (`Above the equator means the Northern Hemisphere`)»), and the test now asserts that its cue contains `then it stays`. In the saved designs the cue fires on `Change the kilometres into metres. Each km is 1,000 m.` (a fact, which decision 2 sends to sticky knowledge), `Draw a number line. Mark your number.` (two steps) and `... Use because.` And the home's own stem example, `Find something that has changed. This has changed because ...`, fires it with no answer that fits.
- Suggested: "does the second only name what the step produced, restate it or explain it (then it goes), is it a second step, or is it a condition the step always meets or a stem the child writes into (then it stays)?"

**4c. The wall's program still offers to shorten a criteria step** (2e).

**4d. Comments and tests that still describe criteria on paper** (low):
- `worksheet-html/src/slips.js`: «The success criteria panel goes on the sheet and not on the slip ... The sheet keeps it, Below included.» This is the log's 19 September reading that decision 8 turned round.
- `shared/text/criteria-marks.js` (1b), and its header's «a verbatim copy onto the worksheet or the working wall».
- The shared test «the board, the sheet and the wall colour the same words the same way».
- `test_design_review_packet.py` (1a).

Checked and sound:
- **Validator over all 90 saved designs:** results change on exactly 4, each gaining only the new refusal. None of the 90 passes in either version, because of older faults, so the others never reach the new check.
- **The launch message:** «using the word; a taught word stays in the criteria».
- **The review view over all 90:** 74 identical; 16 differ only in the two cue lines.
- **The builder's panel and steps messages and the capacity warning** say what the decisions say; `SC_MANY_ITEMS = 5` is a cue.
- **The worksheet engine:** the refusal walks every nesting (row, stack, zone); the catalogue is regenerated without `steps` (90 helpers), and `check-render.js`, `doc-claims` and `helpers.test.js` skip it on purpose.
- **Other code:** the fixture lost its panel; the drawLive check's docstring.
- **Suites:** every suite passes (numbers above), and nothing was written into the plugin by running them.

---

## 5. Collateral, and what elsewhere now disagrees

- **Most of it is findings above:** the route definitions (2a); a step list worked through (2b); the stand-alone sheet (2c); the 1 September story (2d); the wall program (2e); the stale comments (4d).
- `references/adaptive-adaptation.md` (which the adaptation designer reads in full) keeps «Greater Depth may remain the same central task with richer input, sharper success criteria, a more demanding reference or a higher standard for the outcome» without the new sentence's "never printed on the sheet". The designer's own section governs, and the engine refuses the panel. Low.
- The wall's release gate, «shorten faithful display text, simplify the layout, or remove the card», and rule 3, «Split or simplify an item that becomes paragraph-like», do not except a criteria step; rule 5 does. Low.
- **Nothing survives:** no place in instructions, programs, fixtures or evals still says "the picture wins", "fewer criteria on", "as lines", "Five short steps", "just-taught", "under the steps as a note", "not a slogan" (of a step), "stand independently" (of criteria), "take the word out", "reproduces the same reference", "needs space", "decision cues", "question-fragment", "That's the ten", "success-criteria exception", "2-line cap exception", "may stay in the steps" or "the panel holds". The last places are the pins and tests that bar them, a comment in `text.js` recording the grey-paragraph story, test data in `helper-examples.js` and the wall's layout test, and two stale `.pyc` files of old packets in `scripts/__pycache__` (not from this change or from me).

---

## 6. The pins

**Coverage.**
- **Rows:** `success_criteria_ledger_pins.json` holds all 392 ledger ids, 4 decision rows, and the three homes paragraph by paragraph (16, 25 and 24): 461 pins.
- **Earlier topics:** the eleven moved rows are exactly the ones this change reworded (AK-F30, AK-J14, QC-C08, QC-E11, QC-P01, the rhythm's contents line, "One concept, one SC" and the reviewer's paragraph twice, vocabulary's contents line and N29), each with its reason.
- **Retired wordings:** 27 are pinned as gone, 18 of them everywhere in the instructions and the Python programs. "Everywhere" does not reach the JavaScript programs, and `SC-DEC-08`'s pin on `render.js` is `throw new Error(`, which appears elsewhere in the file.

**The experiments.** Each edit was made on the scratch copy and undone before the next, then run against the five ledger pin tests. Those the pins missed were run against the whole Python suite, and, for a JavaScript edit, against that folder's node suite.

Every deletion (D), softening (S) and move (M) was caught by the pin tests, most by the ledger subtests and some by the named decision tests as well; they are listed in one line each at the end. The rest:

| # | What I did | Pins | Whole suite |
|---|---|---|---|
| R01 | "the picture wins, then the taught word" into the slide visual profile | caught | |
| R03 | "give the same criteria as lines" into the slide designer | caught | |
| R04 | "Five short steps is a useful default" into templates | caught | |
| R07 | "Write a condition as a sentence, not a slogan" into preferences | caught | |
| R08 | "Include the exact concise criteria when the sheet must stand independently" into the helper guide | caught | |
| R13 | "Use when the criteria needs space" into the slide designer | caught | |
| R14 | "and the working wall reproduces the same reference" into the contract | caught | |
| R06 | "A rare case goes under the steps as a note." inside the voice guide's §10 | caught (it landed in a home) | |
| R16 | "That's the ten below." inside the skill route's criteria section | caught (it landed in a home) | |
| R12 | "a step of two sentences is carrying teaching" into the reviewer's check list | caught (that list is pinned whole) | |
| X01 | "A Below sheet may carry the steps one at a time." inside the preferences home | caught | |
| X02 | "or just-taught today" inside the skill route home | caught | |
| X03 | Rule 13's never-print moved to the worksheet designer's final preflight | caught | |
| X05 | Wall designer: "A success-criteria step may be condensed to fit" added to rule 8 | caught | |
| C02 | Validator: the worksheet refusal deleted whole | caught | |
| C03 | Validator: the launch message's pinned words replaced by an offer to remove the word | caught | |
| C05 | Worksheet engine: `NOT_ON_SHEETS` emptied | caught | |
| C06 | Review page: the second-sentence cue put back to HEAD's words | caught | |
| C07 | Review page: the question cue put back to "question-fragment" | caught | |
| C08 | Panel refusal: its pinned words replaced by "Or show fewer of the criteria here" | caught | |
| C09 | Steps refusal: "or fewer criteria on this slide" put back | caught (`test_the_whole_list_or_none`) | |
| C12 | drawLive check's docstring: "already reproduces a flagged reference" put back | caught | |
| C04 | Worksheet engine: the refusal no longer throws (constant and message kept) | not caught | not caught; **the worksheet node test catches it** |
| C11 | Worksheet instruction refusal sends a list to the `steps` helper again | not caught | not caught; the worksheet node test catches it |
| C16 | Catalogue builder: `steps` put back among the designer's helpers | not caught | not caught; the worksheet node test catches it |
| R02 | "When the panel will not fit, show fewer criteria on this slide." into the playbook | not caught | **not caught** |
| R05 | "A step may name a just-taught action without saying how." into the content route | not caught | **not caught** |
| X07 | "A rare case goes under the steps as a note." into the content route | not caught | **not caught** |
| R15 | Old rule 13's heading, "Include success criteria only when the upstream worksheet decision requires them", back as a new worksheet rule | not caught | **not caught** |
| R17 | "`Same digits? Move right.` as a success-criteria step is compressed shorthand" into the playbook | not caught | **not caught** |
| C14 | "give the same criteria as lines" into a builder program's message | not caught | **not caught** (node too) |
| C15 | "question-fragment condition; would an If..." into the validator | not caught | **not caught** |
| X08 | "the picture wins, then the taught word" into the colour-mark code | not caught | **not caught** (node too) |
| X09 | "show fewer criteria on this slide" into another builder program | not caught | **not caught** (node too) |
| R09 | Opposite, new words: print the criteria on the Expected sheet (helper guide) | not caught | **not caught** |
| R10 | Opposite, new words: show the first four steps and leave the rest to the board (playbook) | not caught | **not caught** |
| R11 | Opposite, new words: put criteria that do not fit on the criteria slide (templates) | not caught | **not caught** |
| R18 | Opposite, new words: a wall criteria step may be shortened to fit (wall preferences) | not caught | **not caught** |
| R19 | Opposite, new words: criteria are the standard the work is marked against (content route) | not caught | **not caught** |
| X04 | The same in the task-centred route | not caught | **not caught** |
| R20 | Opposite, new words: a taught word that is a picture part takes the picture's colour (visual profile) | not caught | **not caught** |
| C01 | Validator: the worksheet refusal's condition made always true, its message kept | not caught | **not caught** |
| X10 | Launch refusal: pinned words kept, "or drop the word from the criteria" added after them | not caught | **not caught** |
| C10 | Capacity warning: "5 is what a panel holds at a readable size" in new words | not caught | **not caught** (node too) |
| C13 | Wall build message: "otherwise shorten the success-criteria steps to fit" | not caught | **not caught** (node too) |
| X06 | Worksheet engine: a `steps` panel inside a row let through | not caught | **not caught** (node too) |

Caught by the pins, one line each:
- **Deletions:** D01 to D28:
  - the never-on-a-worksheet paragraph, whole-list sentence, criteria-only-slide sentence, stems sentence, green sentence and second-sentence sentence;
  - rule 13's always-empty sentence and the worksheet preflight line;
  - the wall's three new sentences and the Greater Depth sentence;
  - the skill route's short-question sentence and the voice guide's condition bullet;
  - the not-reported-back clause and the table-stays-a-table clause;
  - books-or-sheet's sentence and the contract's always-`[]` line;
  - the nutrient table, recognition, the half-slide sentence and the `((...))` bullet;
  - history's significance criteria, his history and step-size rewrites;
  - the reviewer's condition sentence, the wall-decides sentence and the colour-mark copy rule on slides.
- **Softenings:** S01 to S16, each "never/every/only/exact" turned to "rarely/usually/mainly/ideally/seldom/may", in the home, the worksheet designer, the wall, the placement file, the templates, the voice guide, the reviewer, Greater Depth and the wall budget, and "from earlier lessons" dropped.
- **Moves:** M01 to M07, the never-on-a-worksheet paragraph to Worksheets, the stems sentence into Written Voice, the condition bullet to Things to avoid, the whole-list and criteria-only sentences into Slide Philosophy, the green sentence to the visual profile, and rule 13's body into the preflight list.

**Gap 1: a retired wording is barred only in the length and the place it was pinned** (R02, R05, X07, R15, R17, C14, C15, X08, X09).
- Inside the three homes everything is held, because the homes are pinned paragraph by paragraph (R06, R16, X01, X02).
- Outside them:
  - "fewer criteria on this slide" is barred only in the two builder files the named test reads;
  - "just-taught" and "goes under the steps as a note" only in their longer pinned sentences;
  - the old rule 13 heading and "`Same digits? Move right.` as a success-criteria step" not at all outside their own files;
  - "everywhere" never reaches the JavaScript programs, so every retired phrase can come back in a builder, worksheet or wall message.

**Gap 2: the code is held in part** (C01, X10, C04, X06, C10, C13).
- The validator's new worksheet refusal is held only by its message: no test hands the validator a design with worksheet criteria.
- The launch refusal can offer to drop the word again, beside its pinned words.
- The worksheet engine's refusal is held by one node test that the Python pins cannot see (the pin on `render.js` is `throw new Error(`), and a panel inside a row is held by nothing.
- The capacity warning's "a cue to look" and the wall's messages are held by nothing, and the wall's message is already wrong (2e).

**Gap 3: exactness stops at the homes and the pinned paragraphs** (R09, R10, R11, R18, R19, X04, R20). A new paragraph elsewhere that says the opposite in new words passes. No phrase pin can close that. R19 and X04 matter most, because the route files already say it (2a).

What is held, and held well: every deletion, softening and move of a sentence this change wrote or touched; anything added inside the three homes; the three homes' order; every retired wording pinned "everywhere" in any instruction file; and the builder's two "fewer criteria" messages.

---

## 7. Plain honesty checks

- **True:**
  - "392 places in 55 files", "fourteen places pulled", "seven examples", "seven pieces of text", "36 places it had missed";
  - the sixteen decisions as summarised;
  - "The designer's own section became a pointer that keeps its self-check";
  - the code paragraph, as far as it goes;
  - "Eleven rows of the earlier topics' pins";
  - the sizes: instruction files +3,208 bytes, programs +2,679 and the catalogue −629, all with line endings normalised (the working tree is CRLF, HEAD is LF, so byte counts off the disk come out four to five times too big);
  - the stories kept, with 346 now in the log;
  - the "Not done yet" line, including `method-frame` and the investigation.
- **Not quite true:**
  - «Across the 53 saved designs, four now also carry the new worksheet refusal; nothing else changed.» True of what the validator prints, but 29 of those 53 designs put criteria on the sheet: the other 25 fail earlier, so the new refusal is never reached. That is the size of the behaviour change, and it belongs in the entry.
  - «the panel stays in the engine for the colour marks the board and the wall share»: the board and the wall do not use it. It stays because a shared test renders it to prove the three surfaces colour alike.
  - «The review page's two cues on a step ask his questions»: the second-sentence cue also dropped the explanation and two-steps questions (4b).
  - «pin ... the retired wordings as gone»: several are barred only in the length they were pinned, or only in their own file (section 6).
  - «The core rules were written three to seven times each»: the ledger counts "over a dozen" for copying downstream, and decision 10 folded only the designer's copy.
  - «The wall's layout test still uses `Find the neighbouring multiples.`»: true, and the worksheet engine's helper examples and page-furniture tests still use `Read the question: 10s or 100s?` the same way.
- **Not said at all:**
  - that the routes still define criteria as "the standard" (2a);
  - that the wall's program still offers to shorten a step (2e);
  - that the designer's preflight passes a sheet the build refuses, and the scaffold still asks for worksheet criteria (4a);
  - that the board-criteria-fit-the-sheet check went (1a);
  - that the stand-alone sheet has no route (2c).
- **Dashes.** No added line uses a new em or en dash: every file has the same count as at HEAD except `templates.md`, which lost one with the old "needs space" line. The build-log entry has none.

---

## What I would fix before release

1. **Decision 6 in the routes (2a).**
   - Rewrite the task-centred Set the Task sentence, its **Success criteria** line and its Output Format Block line, and the content-based **Success criteria** line, to say what the home now says: what a child who gets stuck looks at and uses (the fair test's steps, the stems of the explanation).
   - Or put it to him if he wants "the standard for the task" kept for task-centred lessons.
2. **Decision 8 where the designer can still act (4a).**
   - Report `CRITERIA_NOT_ON_SHEETS` from `checkWorksheet`, so the preflight says what the build will refuse.
   - Make the scaffold write `[]` for a generated worksheet's `successCriteriaRefs`.
   - Add a validator test that a design with worksheet criteria is refused, and a node test with a panel inside a row.
3. **The review page's second-sentence cue (4b).** Ask about explanation and two steps again beside his two answers, for example: "does the second only name what the step produced, restate it or explain it (then it goes), is it a second step, or is it a condition the step always meets or a stem the child writes into (then it stays)?" Change the test so its equator example is asked about as explanation.
4. **Decision 12 in the wall's program (2e).** The overflow message needs to say that a success-criteria step is never shortened or reworded, and that its card makes room (no picture, or two cards).
5. **Put to Daniel, with the `method-frame` question already in the log:**
   - "a method's steps" on a sheet (2b), and so what happens to the "step list worked through" passages;
   - the stand-alone sheet (2c): a line in Support, Checking and Release that a sheet used away from the board writes what a child needs into its questions, as the Greater Depth sentence does;
   - a list that fits nowhere ending as a flagged blank slide until the layout investigation (1d).
6. **Decision 8 loose ends:**
   - restore to the components the check that the board's criteria fit the worksheet's own evidence and response (1a), and retarget or drop `test_reused_worksheet_criteria_are_resolved_beside_the_new_task`;
   - drop "still keeps the steps in view" from the 1 September story (2d);
   - correct `slips.js`'s «The sheet keeps it, Below included.» (4d).
7. **Small wording:**
   - J03's example "(where `thousands` is not one of the lesson's cards)", and the priority order in `criteria-marks.js`'s header (1b);
   - one clause tying the condition bullet to the pair it sits under (1c);
   - "not a fault in itself" in the voice guide's §10 (1g);
   - "the exact same reference" for a labelled set (1e);
   - the two-card condition and the drawn-diagram case on the wall (1f);
   - "taught, compared or built" in the panel refusal.
8. **Pins:**
   - bar "fewer criteria", "just-taught", "under the steps as a note", "Same digits? Move right." and old rule 13's heading everywhere in their short forms;
   - include the JavaScript programs in "everywhere";
   - pin the capacity warning's "a cue to look" and, once fixed, the wall's message (Gap 1, Gap 2).
9. **Log:**
   - 29 of the 53 designs put criteria on the sheet, not four;
   - why the panel stays in the engine;
   - that the second-sentence cue changed what it asks;
   - "three to seven times" (decision 10 folded only the designer's copy);
   - add to "Not done yet" the routes (2a), the wall's program (2e), the preflight (4a) and the stand-alone sheet (2c), if they are not fixed first.
