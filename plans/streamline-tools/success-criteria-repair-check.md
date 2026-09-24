# Second independent check: the repairs to the success-criteria change (4.2.288, uncommitted, on top of 4.2.287)

What I did: read both briefs, the first check's report and its fix list, the ledger's sixteen decisions, its read-back and the new "After the first change check" section, the long-list investigation and its decisions, the repair scripts `r1` to `r10` and the updated mapping builder; diffed the whole plugin against HEAD and read every repair in place (the files, not the scripts; `r8`'s hand correction is what the file now holds). I ran every suite in the plugin folder and checked by file hashes, before and after, that nothing in the plugin was written. I ran HEAD's and the new validator and review page over all 90 saved `lesson-design.json` files, HEAD's and the new worksheet preflight (`check-worksheet.js`, which writes nothing) over all 61 saved `worksheet.json` files, and built two saved sheets through the new worksheet build into scratch. I rebuilt the mapping on a separate scratch copy with its paths pointed there, and made 63 break-the-rule attempts on a scratch copy of the whole plugin (everything but `node_modules`, with the six ledgers beside it), after confirming the untouched copy passes the five pin tests (65 tests, 56,068 subtests), the whole Python suite (2,175 passed, 1 skipped) and the three node suites. Every attempt was undone before the next, and the copy was hash-checked afterwards. I changed nothing in the repository except writing this file; my scratch work is in `scratch/screp/`.

Findings are numbered most serious first. Anything checked and found sound is listed after them, one line each.

---

## Findings

**1. "No criteria on a worksheet" was narrowed back to his words in the worksheet designer only; the engine still tells the designer a method's steps are left off.**
- Narrowed (rule 13): «`worksheet.successCriteriaRefs` is always empty, and nothing on the page reprints them, as a panel or as a list.» Preflight: «Confirm no success criteria are printed, as a panel or as an instruction carrying a list.»
- Still wide, in the engine the designer is told to follow when refused (`worksheet-html/src/helpers/text.js`, `INSTRUCTION_IS_A_LIST`): «If they are the lesson's success criteria or the steps of its method, leave them off: they stay on the board and are never printed on a worksheet.» And `render.js`: «Success criteria, and a method's steps, stay on the board.»
- Kept, and now contradicted by that message: preferences → Worksheets «A step list a child must work *through* in order before they can answer anything is not support at all: it is part of the task, and goes above the questions in their own column» (SC-N07); the worksheet designer «a step list worked *through*: no, and without it there is no answer, so it is part of the question and sits with it» (SC-N05); the maths helper guide «If the lesson wants the steps named as well, that is `method-frame`» (SC-N21).
- The engine refuses the `steps` helper whatever it holds, and the catalogue lost the only entry that offered "the steps of the taught method". So a designer who writes a worked-through step list as one instruction is sent away from it, when the sanctioned routes are one short instruction per step or `method-frame`, and no message names them.
- The log says «"no criteria on a worksheet" had been widened to every method's steps (narrowed back to his words)».
- Fix: the refusal says that success criteria stay on the board, and that a method's steps a child works through go one line each or in `method-frame`; the `render.js` comment says "Success criteria stay on the board".

**2. A criteria panel on a sheet whose auto layout fails is still priced as content, and the build can drop the sheet for it.**
- `check-worksheet.js` and `build-worksheet.js` both resolve `"layout": "auto"` before `checkWorksheet`, where the new refusal lives.
- Saved proof: `working/year-4-maths-lesson-15-compare-and-order-negative-numbers/worksheet.json`, whose Greater Depth sheet carries two steps panels in a row. The preflight prints only `SHEET_DOES_NOT_FIT`: «The most expensive single item is a stack of [... + a row of [2 x steps]] ... Composing it with another item that shares its picture, asking it without its picture, or taking it off and saying so in `notes` are the three moves ... Cut content or choose a roomier layout.» The build with `--omit-unfittable` (which `run-fixed-resource.py` passes after a failed repair) printed «SHEET_OMITTED: Greater Depth ...» and «omitted greaterDepth because the page cannot hold it».
- So the designer may cut a real question to make room for a panel the next pass refuses, or the pack loses a sheet over it. Of the 11 saved sheets carrying a panel, the preflight now names the panel on 10; this is the eleventh.
- Minor, same place: the build's refusal location has no zone, because `zoneNameIn` looks for `zone "a"` and the message says `zones.a.stack[8]`.
- Fix: look for criteria panels before resolving auto layouts in both scripts, and add a test with an overflowing auto sheet.

**3. The 18 to 19pt panel warning now points every legal 18 or 19pt panel at the half-width split.**
- New: «success criteria set at ${sharedFont}pt, below the ${TEXT_FONT_TARGET}pt a panel is read at from a table. The longest step is "...". The words are the lesson designer's and stay as they are; for more room use a roomier composition, such as the half-width split with the criteria down one whole side.»
- The code comment says «not a fault in itself: 18pt is legal», but the message does not, and the slide designer is told to «fix any warning that identifies a slide-spec fault you own». The investigation saw this warning on 8 of 13 slides of one deck. It asked only that the "shorten" advice come out (its section 5 and recommendation 3), and he chose to widen only as far as 18pt needs. The half side costs the working side its ruled space and question sizing and gives the criteria 42% of the slide "even when less would do" (option D).
- Done differently, and the difference pulls against his choice. Suggested: say 18pt is within his floor and nothing need change unless the panel does not read beside the work; the refusal (`STEP_TEXT_OVERLOAD`) already names the roomier shape when a list truly does not fit.

**4. The wall's reference tables were not reached: a criteria table can still lose rows or have its cells shortened.** (Found in passing; not in the ledger.)
- `working-wall-html/src/layout.js`, table cells: «Cut it to ${budget} characters or fewer» and «Remove a row, or shorten cells to their column budgets».
- Wall designer, Edge Cases: «Lesson's reference table has > 6 rows | Pick the highest-leverage rows for the wall card; note the cut in `rationaleNote`.» Wall preferences: «if the lesson's table is longer, split into two cards or pick the highest-leverage rows and note the cut in `rationaleNote`.»
- For a criteria lookup table offered to the wall, that is only some of the criteria (decision 3), not "the exact same steps or reference" (decision 5), and a reworded table (decisions 12 and 13). The wall's own rule 5 already says reference-table columns stay word for word. The repair reached the list message only; the log says «the wall build's messages never offer to shorten a criteria step», which is true of steps.

**5. The log is not quite true in four places, and the ledger's new pointer names the wrong rows.**
- «(every topic's "everywhere" now reaches the programs)»: the vocabulary topic's test carries its own list, instruction files only. The retired vocabulary wording "choosing 3 to 5 cards" (written with its original en dash) put into a builder program (V01) and into the validator (V02) was caught by nothing. The other four topics share the new list (V03 caught).
- «the programs about 4.1 KB larger»: they are now 4,757 bytes larger with line endings normalised; the review page's heading came after that sentence. The instruction files (+4,620) and the catalogue (−629) are right.
- «narrowed back to his words»: only in the worksheet designer (finding 1).
- «the other copies stay where their readers are and point home»: Written Voice's copy does («(Success Criteria below)»); Slide Philosophy's «Success criteria are short runnable actions.» does not.
- The ledger's "After the first change check" quotes him exactly, and the log's "Not done yet" is true to his words. But its «(assumed knowledge's rows J03, J04 and J13 to J17)» as "places that still speak of a sheet used on its own" includes AK-J14, which this change already turned round into rule 13, and J15 to J17, which are the board-side rules («Whatever is already on the slides while they work ... is on the board for them to consult»). J03 and J13 are the ones that speak of a sheet on its own. The worksheets ledger's own list for its decision 1 is WS-I01, I03, I04, I05, I15 and I17.

**6. Some repair text is held by nothing, and two code repairs are held only by a comment.** Each was deleted, reverted or loosened on the scratch copy and passed the pins and every suite:
- the wall's release-gate exception «(never a success-criteria step, which is copied word for word)» (Q09) and the wall designer's «; a success-criteria step is the exception (Rules That Never Change)» (Q10);
- the fit summary's «except in a criteria panel, whose words stay and whose lever is a roomier composition» put back to HEAD (Q06), and «or shorten a step without losing what it tells a stuck child to do» added after the 18 to 19pt message's pinned words (Q05);
- the capacity warning: only its tail «`limit). Nothing was removed.`,» is pinned, so both messages went back to "what a panel holds at a readable size" (P10, P10b);
- `SUCCESS_CRITERIA_CAPACITY` put back on the check-before-teaching list with the new comment kept (Q02), and the scaffold asking for worksheet criteria again with its new comment kept (Q03): the pins hold the comments, not the behaviour;
- a third wall remedy «or shorten the success-criteria steps to fit» beside the pinned ones (P11), «compared» taken out of the panel refusal (Q08), and the launch refusal offering again, after its pinned words, to «drop the word from the criteria» (P14b, the first check's X10);
- the two retired template measurements back as a new paragraph (Q12), since only their replacements are pinned.

**7. Decision 6 left two "standard" lines in the task-centred route, one the twin of a line just repaired.** Low.
- Output Format Block, same section as the repaired «Write what a stuck child uses once, as success criteria»: «attach the exact standard through `successCriteriaRefs`».
- «Set the Task put the question and the standard on the board at the start».
- Both routes: «`goodLooksLike` is `null` when the success criteria already show what a good one looks like». The content route keeps «a feature table is valid» two sentences after its features were taken out.
- These read as labels, like those the first check left to the voice topic, but the first is the same sentence twice in one section.

**8. The review page's new worksheet heading is ambiguous in some lessons.** Low.
- It names the label of the last unit with criteria: «Worksheet (done beside the success criteria shown above at Your Turn)».
- In 14 of the 83 saved designs it heads, that label appears more than once in the lesson (two "Your Turn"s, for example). In 6, the sheet had printed criteria that the named beat does not show (both concepts' lists), so the reviewer is pointed at one list for a sheet that spans two methods. It is still the right cue to have; naming the beat by position would make it exact.

**9. The wall's "picture off unless the steps refer to it" is narrower than the wall's diagram rule, and the condition did not travel.** Low.
- Designer, rule 8: «take the card's picture off unless the steps refer to it». Visual language: «The lesson's success-criteria slide visual is a drawn diagram. ... The wall card needs the same diagram or the support evaporates between desk and wall.» Steps beside a place-value chart need not mention it (`Compare the thousands digits first.`).
- The build message («the picture off, or the list over two cards»), the focused repair («its picture off») and the budget table («no picture, or the list over two cards») carry no condition.
- Two cards of the same title meets «a second teaching card is exceptional and must do a genuinely different, repeatedly consulted job» (card contracts) and the designer's merge test. That was true before this change (the focused repair and `check-repair-scope.py` already allowed it), but nothing names it as the exception.

**10. The voice guide's new example gives the wrong reason for keeping `If it is halfway, round up.`** Low.
- New: «A second sentence is not a fault in itself (`If it is halfway, round up.` gives a condition the step always meets)». Three paragraphs on, the same section keeps «A condition that does not happen every time is not a step» and «a case that comes up occasionally is extra knowledge». Halfway comes up occasionally.
- His rewrite keeps it because it is part of the step (decision 2's «part of that step»), the rule that decides the choice. The skill route and the review cue use the same "always meets" wording. Suggested: "(`If it is halfway, round up.` is part of the step: the rule that decides the choice)".

**11. Two template lines around the corrected ones still say criteria fit the bottom strips.** Low.
- `quad-v` use case still lists «success-criteria steps» as one of its four stacked pieces, just before the new «The bottom strip holds no criteria list at 18pt».
- `steps`: «The bottom strip of `centre-big-v` (~1.66″) cannot hold 5 steps at full size ... for SC of 4+ steps, use a template with a dedicated SC panel», which implies three steps fit. The investigation measured none, and the placement guide now says «Never put a method's steps in ... `centre-big-v`».

---

## 1. The first check's fix list, item by item

1. **Decision 6 in the routes (2a): done**, in the four lines named. Old «The success criteria here is the standard for the task itself» became «The success criteria here are what a child who gets stuck looks at and uses to do the task itself (the steps of a fair-test plan, what a strong bridge needs, the stems for a clear opening paragraph)»; «a feature checklist when it's a product or a piece of writing» became «the steps or sentence stems a child can use»; «Define that standard once» became «Write what a stuck child uses once»; the content route's «features or decisions that distinguish a successful performance» became «what a child who gets stuck can use (the decisions to make, the steps, or sentence stems)». Remnants: finding 7.
2. **Decision 8 where the designer can act (4a):**
   - the preflight reports the panel (`problemsWith` in `worksheet.js`): done, except on a sheet whose auto layout fails (finding 2);
   - the scaffold writes `"successCriteriaRefs": []` for a generated sheet: done;
   - a validator test (`test_a_worksheet_never_carries_success_criteria`): done, and it now catches C01;
   - a node test with a panel inside a row, at the build and in the preflight: done, and it catches X06 and C04.
3. **The second-sentence cue (4b): done as suggested.** «does the second only name what the step produced, restate it or explain it (then it goes), is it a second step, or is it a condition the step always meets or a stem the child writes into (then it stays)?» The test now asks the equator example about explanation and a second step.
4. **Decision 12 in the wall's program (2e): done for lists, not tables.** «otherwise remove an item or shorten the longest, never a success-criteria step, which is copied word for word» and «a success-criteria step is never reworded, so its card makes room instead (the picture off, or the list over two cards)». The table message: finding 4.
5. **Put to Daniel:** 2b settled as criteria only, narrowed in the worksheet designer (finding 1); 2c answered ("no overcomplications. worksheets are not homework, worksheets are delivered in class all the time"), no line added, recorded in the ledger and the log (finding 5 for the pointer); 1d left to the next release and named in "Not done yet".
6. **Decision 8 loose ends:** the sheet-fit check restored in the components («Check the board's criteria against the worksheet's own evidence and response, not only the board task they were written for, because a child working the sheet looks up at them.»), faithful to the old «Check reused criteria against the worksheet's evidence and response, not only the board task they originally served»; the review page heads the sheet with the beat (finding 8) and the old test is retargeted; «still keeps the steps in view» gone; `slips.js` corrected.
7. **Small wording:**
   - J03's example: done («(where `thousands` is not one of the lesson's vocabulary cards)»), and `criteria-marks.js`'s header;
   - 1c: done («In the pair above the question was not the fault: `compare the hundreds` names what to compare.»);
   - 1g: done (finding 10 on its example);
   - 1e: done in the home, the designer and the contract («the exact same steps or reference»);
   - 1f: done differently (finding 9);
   - «taught, compared or built» in the panel refusal: done.
8. **Pins:**
   - the short forms are barred everywhere: `just-taught`, `under the steps as a note`, `Same digits? Move right.`, `the picture wins`, `same criteria as lines`, `question-fragment condition`, `Five short steps`, `fewer criteria on this slide` and old rule 13's heading. A step off them still passes: «show fewer criteria.» (F01), «just taught» without the hyphen (F02);
   - the JavaScript programs are in "everywhere" for four of the five topics (finding 5);
   - the capacity cue is pinned only by its tail and a comment (finding 6); the wall's list messages are pinned.
9. **Log:** 29 of 53, why the panel stays and the cue change are all written in; "Not done yet" is updated. "Three to seven times" is kept, with a new claim that the other copies point home (finding 5).

## 2. The repairs' own words

- **Decision 6 against the rest of each route: sound, with the remnants in finding 7.** The dialogic route already treats a stem bank as criteria, and the task-centred Set the Task slide rule («the SC ("your job today") in a panel») still reads true.
- **Decision 8 narrowed:** the designer's rule, its preflight and preferences → Worksheets agree with each other; the engine does not (finding 1). Nothing else now calls `method-frame` wrong.
- **The restored sheet-fit check** says what the old one said, and nothing contradicts it: a child working a sheet in class has the board, as his 2c answer now confirms.
- **The two cues against decisions 9 and 15:** sound. The question cue is his words («what to do next or what to look for»). The second-sentence cue keeps his answers and asks the two questions the first check wanted back; its "always meets" wording is finding 10.
- **"Exact same steps or reference":** sound, and it matches the wall's «copy its categories, steps and pictures faithfully».
- **The wall's two-card condition** («when the wall has room for both») says what the focused repair says («when the wall holds only one teaching card (it takes two)») in other words. The picture condition: finding 9.
- **The Greater Depth parenthesis** in `adaptive-adaptation.md` («written into the task, never printed on the sheet as a criteria panel») agrees with the adaptation designer's sentence.
- **The long-list lines:**
  - the placement guide's «What holds a list today» paragraph is section 4 of the investigation (items 1, 2, 3 and 5);
  - the two template measurements are the investigation's;
  - the panel refusal and the capacity warning say what his decisions say;
  - the 18 to 19pt warning is finding 3.

## 3. The code

- **Saved designs, validator:** 86 of 90 give the same result as HEAD. The other 4 gain only the new worksheet refusal, as the first check found; none validates in either version because of older faults.
- **Saved designs, review page:** 10 of 90 views are identical. 79 differ by the new worksheet heading, and some also by the two cue lines. The 4 views that crash crash the same way before and after; nothing new crashes.
- **Saved worksheets, preflight:** 51 of 61 give the same signals as HEAD. The 10 that differ all carry a steps panel and now add `ZONE_SPEC_INVALID: ... CRITERIA_NOT_ON_SHEETS`. Clean sheets fell from 6 to 3, all three for the panel. The eleventh sheet with a panel is lesson 15 (finding 2). No stack traces either way.
- **Build:** `l16` (roman numerals to L) now stops at «Expected - zones.a.stack[8]: CRITERIA_NOT_ON_SHEETS ... take the panel off the sheet.», which is the same fault the preflight now names.
- **Capacity flag:** `SUCCESS_CRITERIA_CAPACITY` is off the check-before-teaching list. Nothing else read that list for it; the slide check already treated it as non-blocking.
- **Scaffold, validator, panel refusal and steps refusal:** as described in section 1; the suites pass.

## 4. The pins

Coverage: `success_criteria_ledger_pins.json` now holds 463 pins (392 ledger rows, 6 decision rows, the three homes paragraph by paragraph), with 77 changed rows mapped. The mapping builder, rebuilt on a separate scratch copy with its paths pointed there, produced a pin file and a mapping identical to the repository's.

Each attempt below was made on the scratch copy, run against the five ledger pin tests, and, when the pins missed it, against the whole Python suite; a JavaScript edit was also run against its folder's node suite.

**The first check's misses, again.**

| # | What I did | Result |
|---|---|---|
| P01 | «show fewer criteria on this slide» as a new playbook paragraph | caught by the pins |
| P02 | «just-taught» as a new content-route paragraph | caught by the pins |
| P03 | «under the steps as a note» into the content route | caught by the pins |
| P04 | old rule 13's heading into the helper guide | caught by the pins |
| P05 | «`Same digits? Move right.` as a success-criteria step is compressed shorthand» into the playbook | caught by the pins |
| P06 | «give the same criteria as lines» into a builder program | caught by the pins |
| P07 | «question-fragment condition» into the validator | caught by the pins |
| P08 | «the picture wins, then the taught word» into the colour-mark code | caught by the pins |
| P09 | «show fewer criteria on this slide» into another builder program | caught by the pins |
| P12 | the sheet engine lets a steps panel through inside a row | caught by the worksheet node test |
| P13 | the validator's worksheet refusal made never to fire | caught by the new validator test |
| P14 | the launch refusal offers to drop the word, inside its pinned words | caught by the pins |
| P14b | the same, after its pinned words (the first check's X10) | caught by nothing |
| P15 | the sheet engine only warns about a panel | caught by the worksheet node test |
| P10, P10b | the capacity warning's two messages back to "what a panel holds" | caught by nothing |
| P11 | a third wall remedy offering to shorten criteria steps | caught by nothing |

**The repairs' new code, attacked.**

| # | What I did | Result |
|---|---|---|
| Q01 | the preflight loop kept, but it reports nothing | caught by the worksheet node test |
| Q04 | the review page heads the sheet "Worksheet" again | caught by the retargeted packet test |
| Q07 | the instruction refusal sends a list to the steps helper again | caught by the worksheet node test |
| Q11 | the placement guide loses «Never put a method's steps in a 30% column ...» | caught by the pins |
| S20 | «is it a second step» taken out of the cue | caught by the fit-a-glance test |
| Q02, Q03, Q05, Q06, Q08, Q09, Q10, Q12 | as in finding 6 | caught by nothing |
| Q13 | the task-centred route calls the criteria "the standard the finished task is judged against", new paragraph | caught by nothing |
| Q14 | "A method's steps are never printed on a worksheet either" added to the worksheet designer | caught by nothing |
| F01, F02 | «show fewer criteria.» and «just taught» (no hyphen) | caught by nothing |
| F03 | "a success-criteria table that is too long keeps its most useful rows" into the wall preferences | caught by nothing |

**The repairs' own sentences: every deletion, softening and move was caught by the pins.**
- task-centred Set the Task softened (S01), deleted (S02); its Success criteria line moved below the reviewer's line (S03); its output line softened (S04);
- the content route's line put back to "a successful performance" (S05) and moved below the line (S06);
- rule 13's "nothing" to "little" (S07); the preflight line to "few" (S08);
- the restored sheet-fit check deleted (S09a), softened (S09b), moved to Photograph acquisition (S09c), its reason cut (S23);
- the 1 September story's «still keeps the steps in view» put back (S10); J03's condition deleted (S11);
- «or reference» dropped in the designer (S12) and the contract (S13);
- the voice guide's pair clause deleted (S14) and «not a fault in itself» made «usually a fault» (S15);
- the wall's «unless the steps refer to it» (S16a) and «when the wall has room for both» (S16b) deleted;
- the Greater Depth parenthesis deleted (S17); the bottom-strip correction deleted (S18);
- the wall program's «never a success-criteria step» softened (S19); the 18 to 19pt message's «stay as they are» softened (S21);
- «What holds a list today» moved to the templates file (S22).

**The log's claim about every topic:** V01 and V02 (a retired vocabulary phrase in a builder program and in the validator) were caught by nothing; V03 (a retired teach-then-do phrase in a builder program) was caught.

What the pins now hold well: every sentence the repairs wrote into an instruction file, apart from the two wall exceptions; the retired short forms in their pinned spelling, in the JavaScript programs too; and the code repairs that have a test behind them. What they do not hold: new words that say the opposite (Q13, Q14, F03, as the first check's Gap 3), spellings a step off the pinned ones, and code whose only pin is a comment or the tail of a message.

## 5. The suites

- From the plugin folder, `python -X utf8 -m pytest scripts/tests -q -p no:cacheprovider`: 2,175 passed, 1 skipped, 58,130 subtests passed.
- `node --test` in `worksheet-html`: 717 passed; in `builder` (`node --test "test/*.test.js"`): 709 passed; in `working-wall-html`: 142 passed.
- File hashes of the whole plugin before and after the runs are identical: nothing was written.

## 6. Honesty

- **The 4.2.288 entry:** true to the files apart from finding 5 and the partial claims in findings 1 and 4. The "second reader" bullet lists what the first check found fairly, and says which of it was repaired.
- **"Not done yet"** now carries his 2c answer in words true to his («worksheets are not homework and are done in class, so no line was added»). The ledger's new section quotes him exactly.
- **The mapping** reproduces exactly (section 4).
- **The earlier topics' pin files** are unchanged by the repairs; their eleven moved rows are as the first check found.
- **Dashes:** no em or en dash was added anywhere in plugin prose. The task-centred route lost two em dashes and `templates.md` one em and one en dash, all with old text. The 4.2.288 log entry and the ledger's new section have none.

---

## Checked and found sound

- Decision 6 reached the four route lines the first check named, and the designer, the reviewer and the home agree with them.
- Rule 13 and the worksheet preflight say criteria only, in his words.
- The components' restored check matches the old one's substance.
- The review page's cue and its test ask about explanation and a second step again.
- The preflight names a panel at any depth (row, stack, zone) on every sheet that lays out.
- The scaffold no longer asks for worksheet criteria.
- The validator's worksheet refusal is now tested.
- The wall's list messages never offer to shorten a criteria step.
- The capacity warning calls its numbers a cue, and a fitting panel is no longer flagged before teaching.
- The panel refusal names the half-slide shape and the criteria-only slide's three uses.
- The template measurements are the investigation's.
- `slips.js` and `criteria-marks.js` describe the rule as it now is.
- Every new instruction sentence, deleted, softened or moved, was caught by the pins.
- The retired short forms are barred in the instructions and the programs.
- The mapping is reproducible.
- Every suite passes, and nothing was written into the plugin by running them.

## What I would still fix before release

1. **The engine's refusal and comment (finding 1):** say success criteria stay on the board, and name one line per step or `method-frame` for a method's steps a child works through.
2. **The criteria check before auto layout (finding 2),** in the preflight and the build, with a test of an overflowing auto sheet carrying a panel.
3. **The 18 to 19pt warning (finding 3):** say 18pt is within his floor; name a roomier shape only in the refusal.
4. **The wall's tables (finding 4):** the table message, the designer's Edge Cases row and the preferences' row-cut line each say a criteria table is copied whole and its card makes room. Or put to him whether a criteria table ever goes up.
5. **The log and ledger (finding 5):** "four of five topics" or bring the vocabulary test onto the shared list; about 4.8 KB for the programs; the narrowing as partial until finding 1 is fixed; the Slide Philosophy copy; the ledger's AK rows as J03 and J13, or the worksheets ledger's WS rows.
6. **Pins (finding 6):**
   - pin the two wall exceptions, the fit summary's exception and both capacity messages whole;
   - add tests that `SUCCESS_CRITERIA_CAPACITY` is not a flagging signal and that the scaffold writes `[]`;
   - pin the two retired template measurements as gone.
7. **Small wording (findings 7 to 11):**
   - the task-centred «attach the exact standard» and «put the question and the standard on the board»;
   - the worksheet heading naming its beat by position;
   - the wall's picture condition in the build message, the focused repair and the budget table;
   - the halfway example's reason;
   - the two template lines around the strips.
