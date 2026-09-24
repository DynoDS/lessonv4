# Third independent check: the second round of repairs to the success-criteria change (4.2.288)

What I did: read the brief, the second check's report (its findings 1 to 11 and its fix list), the ledger's "Decisions taken", "Read back, and settled" and "After the first change check", the long-list investigation's decisions and its section 5, the worksheets ledger's decision 10 and group J, and the repair scripts `r11` to `r18` (with `r11b`, `r11c` and `r17`'s hand edit). I judged the files, not the scripts: I diffed the plugin as the second check left it (a byte-checked copy of its scratch copy) against the plugin now, which isolates this round, and read every changed line in place. The interrupted agent's scratch work was checked before use: its plugin copy was byte-identical to the plugin and its HEAD copy identical to `git archive HEAD`, and no attack was left in either. I redid its comparisons in my own subfolder rather than reuse its results.

- I ran the worksheet preflight (`check-worksheet.js`, which writes nothing) with HEAD's engine, the second check's state and now over all 61 saved `worksheet.json` files outside `node_modules` and scratch folders; built nine sheets (six saved lessons and three small specs made to isolate a case) with all three engines, with and without the last-resort flag, into scratch; and ran the panel-removal code on hand-made edge cases.
- I built the review page's class view (by importing `design-review-packet.py`, which writes nothing that way) from all three states over all 90 saved `lesson-design.json` files.
- I rebuilt the mapping on a scratch repository with the builder's paths pointed there.
- I made 67 break-the-rule attempts on two scratch copies of the whole plugin (everything but `node_modules`, with the ledgers beside it), after confirming an untouched copy passes the five pin tests (65 passed, 68,568 subtests), the whole Python suite (2,178 passed, 1 skipped, 70,630 subtests) and the three node suites (719, 709, 142). Each attempt ran the five pin tests, then the whole Python suite when the pins missed it, and the node suite of any program folder it touched. Every attempt was undone before the next; both copies hash-match the plugin afterwards.
- I ran the four suites in the plugin folder and hash-checked the plugin before and after.

I changed nothing in the repository except writing this file. My scratch work is in `scratch/sc3/me/`. One thing changed in the plugin folder while I worked that was not mine: its git-ignored `.pytest_cache/v/cache/nodeids`, at 09:02, while all my pytest runs used `-p no:cacheprovider` on scratch copies. Every other file hash-matches, and `git status` is as it was.

---

## Findings

**1. A panel on a sheet with a named layout is still not named while another sheet fails to lay out, and at the last resort the pack is refused over it.** Moderate.
- The new code finds panels before a shape is chosen only on `"auto"` sheets. Its comment: «A named layout's panel is reported by checkWorksheet, which runs on the sheet as written.» But `checkWorksheet` runs only after every auto sheet has a shape and the answer key passes.
- Lesson 15, the second check's own example, is this shape. Expected is a named `full` layout with two panels; Greater Depth is auto with two. The preflight now names the two Greater Depth panels, then stops at «SHEET_DOES_NOT_FIT: Greater Depth - layout "auto": ... over by 4mm». The two Expected panels are named nowhere. With Greater Depth's panels taken off (scratch copy), the preflight says only that; with Greater Depth removed as well, it stops at the answer key. Of the 11 saved sheets with a panel, 10 now have every panel named; lesson 15 has 2 of its 4.
- A small spec made to isolate it (Expected named, with a panel; Greater Depth auto and too big for any page): the preflight prints only `SHEET_DOES_NOT_FIT`. The last-resort build (`--omit-unfittable`) omits Greater Depth, then refuses everything: «ZONE_SPEC_INVALID: Expected - zones.a.stack[1]: CRITERIA_NOT_ON_SHEETS ...», no files. The designer was never told about that panel before the pass that loses the pack.
- Related, by design but not said: an auto sheet with a panel that also cannot fit now refuses the whole pack in the last-resort build, where the first round omitted that sheet and delivered the rest (built both ways). That follows the playbook («The flag rescues a too-small page and nothing else: any other fault still refuses the build»), but the log says only «the last-resort build never drops a sheet over it».
- Lesson 15's Greater Depth sheet is 4mm over without its panels (184mm on a 180mm page; HEAD's engine gives the same figure for the sheet with the panels deleted by hand), so it would still be omitted. The panels changed how it failed (22mm too narrow before, 4mm too tall now), not whether.
- Fix: find every sheet's panels (named, auto and two-page) before any shape is chosen, in both scripts, with a test of a named sheet carrying a panel beside an auto sheet that cannot fit; and say in the log that a panel still on a sheet at the last resort refuses the pack.

**2. The two lines that make "measured without it" true are held by nothing, and three of the claimed holds still miss.** Moderate.
- Deleting `worksheet = withoutAutoSheetCriteriaPanels(worksheet);` from the preflight (T05) passed the pins, the whole Python suite and the worksheet suite. The preflight then prices the panel as content again, which is the second check's finding 2 undone: the new test's sheet fits with or without its panel, so it cannot tell.
- Deleting the line that drops a row or stack its panels emptied (T06) also passed everything. On lesson 15 the preflight then reports «fits the page height with NaNmm to spare, and fails on WIDTH: its tightest zone is NaNmm too narrow for what it holds»: a false refusal with no numbers in it.
- The second check's Q05 still passes: «or shorten a step without losing what it tells a stuck child to do» added after the 18 to 19pt message's pinned words. So does pointing every panel at the half-width split again in new words on the same unpinned last line (T11, «For more room now, use the half-width split.»). Only the first three of the message's four lines are pinned.
- The second check's Q12 still passes: the two retired measurements («The bottom strip is sized for ~5 step rows» and the "5 steps needs about 2.0 to 2.5 inches of zone height" line) come back as a new paragraph. The new absent pins bar this round's retired phrases («cannot hold 5 steps at full size», «and success-criteria steps. The bottom strip»), not those two.
- The capacity test reads the list's text, not the behaviour: the cue put on the same line as the entry before it (Q02b), or added to the set just after the list (Q02c), passes.
- The list refusal is pinned on two of its four new lines. Adding «and nor are the steps of a method» back to an unpinned line (T03, the second check's finding 1 undone) passes, and so does dropping «or in maths use "method-frame"» (T02).
- The pins hold the new tests by their titles. A test body cut to nothing with its title kept (T31, the new preflight test) passes, and so does the flag test weakened to `or True` together with the cue put back on the list (T30). This is a limit of pinning titles, not a fault of this round, but it is where "held by a test" stops.
- Also passing: the build's zone-location fix reverted (T09, minor); a sentence added inside the card contracts' exception paragraph widening it to «Any other card too long for one card» (T20d; the pin there is section-only, not the whole paragraph); new paragraphs saying the opposite (F03, and «A method's steps a child works through are never printed on a worksheet either», C01), which is the limit the log already names.
- Fix: a preflight test whose sheet fits only once its panel is off (a row of two panels beside a question, as lesson 15 has), which catches T05 and T06; pin the 18 to 19pt message's last line and the list refusal's two other lines; bar the two retired measurements by their own words; pin the card contracts' paragraph whole.

**3. The list refusal now says what decision 10's suggested answer would make it say, and the worksheets ledger put to him this morning says the engine says the opposite.** Moderate.
- New (`text.js`): «If they are the lesson's success criteria, leave them off: they stay on the board and are never printed on a worksheet. If they are steps a child works through to reach the answer, they are part of its question: put them with it, one to a line, or in maths use "method-frame".»
- Against decision 8: sound. It is criteria only, in his words.
- Against the instructions: not wider. Preferences → Worksheets already says «A step list a child must work *through* in order before they can answer anything is not support at all: it is part of the task, and goes above the questions»; the worksheet designer «a step list worked *through*: no, and without it there is no answer, so it is part of the question and sits with it»; the maths helper guide «If the lesson wants the steps named as well, that is `method-frame`».
- Against decision 10 it is no longer silent. The worksheets ledger (headed «Put to him on the morning of 24 September») says under decision 10: «What it says now. The sheet engine's message tells the designer a method's steps are "never printed on a worksheet"», and suggests «A fill-in frame the child writes into, and steps a task needs, may print. The engine's message says the same.» The engine already says it. That ledger's WS-R12 and WS-R13 quote first-round words that are gone from the files («Success criteria, and a method's steps, stay on the board», «are the lesson\'s success criteria or the steps of its method, leave them»), and its "Found in passing" still says «the engine's instruction refusal still tells the designer that "the steps of its method" are "never printed on a worksheet"».
- The log's new «Whether a method's steps belong on a worksheet at all is the worksheets topic's open decision 10, and nothing here settles it» is true of the instruction files, not of the engine's message.
- In a skill lesson the two branches overlap, because the method's steps are its criteria. The message does not say the first wins (rule 13, «nothing on the page reprints them, as a panel or as a list», does). The comment above the check still calls the rounding sheet's list «the lesson's method, which is `steps`».
- Fix: before he answers decision 10, correct its "What it says now", WS-R12, WS-R13 and the passing note, and tell him the engine already names that route (a "no" means changing the message as well as the instructions). Make the order explicit in the message ("otherwise, if they are steps a child works through ..."). The log's line could say the message now matches the instruction files as they stand, and decision 10 may change both.

**4. "The one exception" to a second wall card is narrower than the wall's own messages.** Low to moderate.
- New (card contracts): «a second teaching card is exceptional and must do a genuinely different, repeatedly consulted job that the first cannot absorb; the one exception is a success-criteria list or table too long for one card, carried in order over two cards of the same title, which is one job split for room.»
- Written there, in the paragraph that defines the second card, it cannot be read as permission for a second card for anything else. That part is sound.
- But the wall build offers the same split for any list too tall for its card («Splitting the items in order over a second card keeps every word and is a layout change (a wall takes two teaching cards)»), and so do the focused repair («put the card's items, in their order, on two cards of the same type and title, when the wall holds only one teaching card») and the scope checker (a worked example's steps «go on two cards», since 14 September). "The one exception" now contradicts all three for a list that is not the criteria.
- The designer's own merge test (Step 4, «Add a second card only when it performs a genuinely different durable job») and rule 1 still name no exception; the designer meets it only through the packet's cut of the card contracts.
- Fix: either write the exception as any list or table carried in order over two cards of one title (for criteria, the way to make room, since their words never change), or narrow the message and the focused repair to criteria. Which is his call; the contradiction is not.

**5. Two panel shapes are named but still measured, and a sheet that was only a panel gets a second refusal.** Low.
- A panel written in the repeat form (`{ "stack": { "helper": "steps", ... }, "repeat": 2 }`) or in a named slot (`comparisonPair.left`) is named early but not taken off, so the page is measured with it (28% full with HEAD and now on a test sheet) and it is named twice (`zones[1].stack`, then `zones.b.stack`). Neither shape is in any saved sheet.
- An auto sheet whose only zone is a panel gets, after the panel refusal, «AUTO_LAYOUT_INVALID: ... This one is empty.» True of the page it will be, but a second message for one fault.
- The code also drops a row or stack that was already empty before any panel came off. Harmless, but a change beyond the panels.

**6. The log: three small overstatements.** Low.
- «every sentence the repairs wrote was caught when deleted, softened or moved»: the second check's own words were «apart from the two wall exceptions» (its Q09 and Q10). The same bullet goes on to say several repairs were held by nothing.
- «every topic's "everywhere" now reaches the programs, a retired story excepted, which may stay in a program's comment»: only the vocabulary test has that exception; it covers only rows whose outcome starts "story" (C13, E06, F03; F03's words are still barred through F01, a kept row, which caught V06); and it allows the story anywhere in a program, a printed message (V05) as well as a comment.
- «so lesson 15's Greater Depth sheet was told to cut and the last-resort build dropped it (now refused first, with tests)»: true of what happened, but the sheet is 4mm over without its panels (finding 1).

**7. Neighbouring words that still lean the old way.** Low.
- The slide build's fit summary still ends «except in a criteria panel, whose words stay and whose lever is a roomier composition», and its comment says «the repair is always the words». Beside a panel warning that now says «Nothing need change», the summary still names a lever for the same 18 to 19pt panel. It tells no one to pull it, so this is emphasis, not a contradiction.
- The wall's table-cell message offers «or the table goes over two cards» for a cell too long for its column, which splitting rows cannot cure; «the card makes room instead» is the remedy that can.
- The task-centred route keeps two more "standard" labels in its launch section: «`steps` are stages of work, not the standard said again» and «a class shown a model that would fail the standard is being marked against something it was never shown» (the second mirrors the validator's pinned message).

---

## 1. The second check's eleven findings

1. **The engine's list refusal: done as suggested.** Old «If they are the lesson's success criteria or the steps of its method, leave them off: they stay on the board and are never printed on a worksheet.»; new, finding 3's quote. `render.js` old «Success criteria, and a method's steps, stay on the board.», new «Success criteria stay on the board.» Decision 10: finding 3.
2. **A panel priced as content: done for sheets the engine lays out; not for a named sheet beside one that fails** (finding 1). The preflight names the panel and measures the page without it; the build refuses it before a shape is chosen; a named layout's panel now carries its zone in the build's diagnostic (`"zone":"a"`). Two tests added; neither holds the measuring (finding 2).
3. **The 18 to 19pt warning: done.** Old «The words are the lesson designer's and stay as they are; for more room use a roomier composition, such as the half-width split with the criteria down one whole side.» New «success criteria set at ...pt: within the 18pt floor, below the 20pt a panel reads best at from a table. ... Nothing need change: the words are the lesson designer's and stay as they are, and a list that does not fit is refused with a roomier shape named.» The refusal does name one («a wider or taller `sc-panel` composition up to half the slide, never fewer criteria»).
4. **The wall's tables: done.** Cell message «Cut it to N characters or fewer, unless the table is the lesson's success criteria, which are copied word for word (the card makes room instead, or the table goes over two cards)»; rows message «; a success-criteria table keeps every row and word, so its card makes room instead, or the table goes over two cards.»; designer's Edge Cases row «A success-criteria table is never cut, only split over two cards.»; preferences «A success-criteria table only splits: every row and word goes up, as the class used it.» Small flaw: finding 7.
5. **The log and the ledger: done.** Written Voice and Slide Philosophy both point home («(Success Criteria below)», «(Success Criteria above)», each the right direction); the vocabulary test reaches the programs (V01, V02 now caught); the size figures are true (section 7); the ledger now names AK J03 and J13 and the worksheets list's WS-I01, I03, I04, I05, I15 and I17, which are the right rows. Remaining overstatements: finding 6.
6. **What was held by nothing: mostly done.** The two wall exceptions, the fit summary's exception, both capacity messages whole and the panel refusal's «compared» are now pinned, and two behaviour tests were added; of the second check's fourteen named misses, eleven are now caught. Still passing: Q05, Q12 and F03 (finding 2).
7. **Decision 6's two "standard" lines: done.** «Set the Task put the question and the success criteria on the board at the start»; «attach the success criteria through `successCriteriaRefs`.» Two more labels: finding 7.
8. **The review page's heading: done differently, and soundly.** It names, for each criteria list the lesson shows, the last beat that showed it, and tells a repeated label apart by place («at the first Your Turn and at the second Your Turn»), rather than naming one beat by position. Section 5.
9. **The wall's picture condition and the two-card exception: done.** «unless the steps need it» is on all four copies (designer rule 8, build message, focused repair, budget table); the exception is in the card contracts. Its reach: finding 4.
10. **The halfway example's reason: done as suggested,** in the voice guide («is part of the step: the rule that decides the choice»), the skill route and the review cue. «always meets» is gone from the whole plugin.
11. **The two template lines: done.** `quad-v`: «and a short fourth piece in the bottom strip, which holds no criteria list at 18pt»; `steps`: «The bottom strip of `centre-big-v` (~1.66″) holds no criteria list at 18pt: use a template with a dedicated SC panel (`maths-turn-sc`).»

## 2. The engine repairs

- **Preflight, 61 saved sheets, three engines.** No signal lost between HEAD and now, or between the second check's state and now. 50 sheets give HEAD's signals; the 11 that differ all carry a panel and add `ZONE_SPEC_INVALID ... CRITERIA_NOT_ON_SHEETS`. Against the second check's state, 60 give the same signals; the one that differs is lesson 15, which now names its Greater Depth panels. No stack traces on any side. Clean sheets: 6 at HEAD, 3 now, as before this round.
- **Measured without the panel.** Lesson 15's Greater Depth reads 184mm on a 180mm page, exactly what HEAD's preflight gives the same sheet with its panels deleted by hand. The other ten panel sheets now report the fill of the page without its panel (for example 99% to 77%), and the "room" advisories describe that page. The location is the designer's own index (`zones[0].stack[8]`) instead of the chosen layout's zone.
- **Builds, into scratch.** A clean sheet (the digestive system) builds byte-identical pages and answers with all three engines. Lessons 16 and 17 and the PSHE and tooth-decay sheets now stop at the panel before any layout line; lesson 15 stops at its Greater Depth panels without omitting anything. Findings 1 and 5 for the cases that do not work.
- **The code that takes panels off.** It touches only auto sheets (a named sheet comes back as the same object), only when a panel is found, and never changes the saved spec. A row, stack or zone emptied by it goes too, nested to any depth (a row of two panels inside a stack goes whole). Finding 5 for its limits.

## 3. The wording repairs

- **"Unless the steps need it"** keeps "refer to it" (a step that refers to the picture needs it) and the wall's diagram rule («The wall card needs the same diagram or the support evaporates between desk and wall»). It turns a test the words of the steps could answer into a judgement: a loss of sharpness, not of a rule.
- **The halfway reason** agrees with decision 2 («it would stay because it's part of that step») and with the voice guide's «A condition that does not happen every time is not a step», read as a condition that would be a step of its own; halfway is part of the choosing step. The guide leaves that distinction to the reader.
- **The 18 to 19pt warning** matches «widen only as far as 18pt needs»: 18pt is his floor, and the message asks for nothing.
- **The two-card exception**: finding 4.
- **Dashes**: two em dashes left the wall designer's edited paragraph; no em or en dash was added anywhere in plugin prose, the 4.2.288 log entry or the ledger's changed line.

## 4. The pins and tests

Each attempt was made on a scratch copy and run against the five ledger pin tests; when they missed, against the whole Python suite; any program edit also against its folder's node suite.

**The second check's attempts that were caught by nothing and are now claimed to be held.**

| # | What I did | Result |
|---|---|---|
| Q02 | the capacity cue back on the check-before-teaching list, comment kept | caught by the new flag test |
| Q03 | the scaffold asks for worksheet criteria again, comment kept | caught by the new scaffold test |
| Q05 | «or shorten a step ...» after the 18 to 19pt message's pinned words | caught by nothing |
| Q06 | the fit summary's criteria exception taken out | caught by the pins |
| Q08 | «compared» taken out of the panel refusal | caught by the pins |
| Q09 | the wall's release gate loses its criteria exception | caught by the pins |
| Q10 | the wall designer's budget paragraph loses its criteria exception | caught by the pins |
| Q12 | the two retired template measurements back as a new paragraph | caught by nothing |
| P10, P10b | the capacity warning's two messages back to "what a panel holds" | caught by the pins |
| P14b | the launch refusal offers to drop the word, after its pinned words | caught by the pins |
| V01, V02 | the retired vocabulary wording "choosing 3 to 5 cards" (with its en dash) in a builder program and in the validator | caught by the pins |
| F03 | "a criteria table keeps its most useful rows" as a new wall paragraph | caught by nothing (the limit the log names) |

**This round's code and words, attacked.**

| # | What I did | Result |
|---|---|---|
| Q02b, Q02c | the capacity cue on the line of the entry before it; added to the set after the list | caught by nothing |
| P11 | a third wall remedy «or shorten the success-criteria steps to fit» | caught by nothing (not claimed) |
| T01 | the list refusal's worked-through sentence deleted | caught by the pins |
| T02 | «or in maths use "method-frame"» dropped | caught by nothing |
| T03 | «and nor are the steps of a method» added to an unpinned line | caught by nothing |
| T04 | `render.js` comment widened back to a method's steps | caught by the pins |
| T05 | the preflight measures the page with the panel still in | caught by nothing |
| T06 | an emptied row or stack left in | caught by nothing (lesson 15 then reads «NaNmm») |
| T07 | the build refuses the panel but carries on to lay out and omit | caught by the worksheet node test |
| T08 | «The page below is measured without it.» taken out | caught by the worksheet node test |
| T09 | the build's zone-location fix reverted | caught by nothing |
| T10 | «Nothing need change» softened to a suggestion | caught by the pins |
| T11 | the 18 to 19pt message sends every panel to the half-width split again, on its unpinned last line | caught by nothing |
| T12, T13, T14 | the wall's cell and row exceptions deleted or softened; «unless the steps need it» out of the list message | caught by the pins |
| T15a, b, c | the designer's criteria-table sentence deleted, softened, moved to Photos | caught by the pins |
| T16a, b | rule 8 back to «refer to it»; its condition deleted | caught by the pins |
| T17a, b, c | the preferences' criteria-table sentence deleted, softened, moved | caught by the pins |
| T18, T19 | the picture condition out of the budget table and the focused repair | caught by the pins |
| T20a, b, c, e | the card contracts' exception deleted, widened to any list, «the one» softened, moved to Every card | caught by the pins |
| T20d | «Any other card too long for one card may be split the same way.» added inside that paragraph | caught by nothing |
| T21 | «(Success Criteria above)» deleted | caught by the pins |
| T22, T23 | the task-centred lines back to «the standard» | caught by the pins |
| T24a, b, T25 | the halfway reason back to «always meets», or softened to «may be part of the step» | caught by the pins |
| T26 | the review cue back to «always meets» | caught by the pins |
| T27a, b | the heading back to the last beat only; repeated labels no longer told apart | caught by the new heading test |
| T28a, b, T29 | the template lines back to their old words, or softened to «a short criteria list» | caught by the pins |
| T30 | the flag test weakened to `or True`, and the cue put back on the list | caught by nothing |
| T31 | the new preflight test's four assertions cut, its title kept | caught by nothing |
| C01 | «A method's steps a child works through are never printed on a worksheet either» as a new designer paragraph | caught by nothing (the limit the log names) |
| C02 | «A long step may be trimmed to its first clause when the card has no room.» inside rule 8 | caught by the pins (its paragraph is pinned whole) |

**The vocabulary test's new reach.**

| # | What I did | Result |
|---|---|---|
| V04 | the VOC-E06 story in a builder program comment | passes, as intended |
| V05 | the same story in a program's printed message | passes (wider than the log's "comment") |
| V06 | the VOC-F03 story in a program comment | caught, through VOC-F01, a kept row with the same words |
| V07 | the VOC-C13 story in a program comment | passes, as intended |
| V08 | the VOC-E06 story in an instruction file | caught by the pins |

Of 67 attempts, 48 were caught and 3 passed by design (V04, V05, V07). What the pins and tests now hold well: every instruction sentence this round wrote, deleted, softened or moved; the wall's and the capacity messages' pinned lines; the review heading and the scaffold by behaviour. What they do not hold: finding 2.

## 5. The review page's heading

- 90 saved designs, three states: 4 views crash, the same 4 on every side; nothing new crashes.
- Of the 86 that build on both sides, 26 differ from the second check's state: 22 in the sheet heading, 4 only in the reworded cue; no other line differs.
- Of 85 generated sheets, 21 headings now name two or more beats, 10 use a place word, and 6 are plain "Worksheet" (no criteria shown). Checked by hand on four lessons (partition, Year 4 maths 14, history 4, maths 15): each names the last beat showing each list, in lesson order, and the place word counts the right repeat.

## 6. The suites

- From the plugin folder, `python -X utf8 -m pytest scripts/tests -q -p no:cacheprovider`: 2,178 passed, 1 skipped, 70,630 subtests passed.
- `node --test` in `worksheet-html`: 719 passed; in `builder` (`node --test "test/*.test.js"`): 709 passed; in `working-wall-html`: 142 passed.
- File hashes of the whole plugin before and after the runs: identical.

## 7. Honesty

- **Size figures, measured** (line endings normalised, tests and the log left out): instruction files 5,022 bytes larger (log «about 5.0 KB»), programs 9,705 larger («about 9.7 KB»), catalogue 629 smaller («about 0.6 KB smaller»). This round added 4,948 to the programs, 4,379 of it the early panel check and the heading; the sheet engine's panel work over both rounds is about 6.1 KB of the 9.7, so «most of it» holds.
- **The mapping** rebuilt on scratch: 466 pins, 80 changed rows, byte-identical to the repository's pin file and mapping.
- **The ledger's changed line** names the right rows.
- **The log's new and changed sentences**: true to the files apart from findings 1, 3 and 6.
- **Dashes**: none added (section 3).

---

## Checked and found sound

- The list refusal and the render comment say criteria only, in his words.
- The preflight names every panel on an auto sheet, at any depth, before a shape is chosen.
- The page is then measured as it will be once the panel is off (lesson 15 matches HEAD to the millimetre).
- The build refuses a panel on an auto sheet before any sheet can be omitted for it.
- A named layout's panel now carries its zone in the build's diagnostic.
- No saved sheet lost a signal, gained a crash or changed its output unless it carries a panel.
- The code that takes panels off never touches a named sheet or the saved spec.
- The 18 to 19pt warning says 18pt is within his floor and asks for nothing.
- The wall's list, cell and row messages, the designer's Edge Cases row and the preferences keep a criteria table whole.
- «unless the steps need it» is on all four wall copies and keeps the diagram rule.
- The two-card exception cannot be read as permission for any other second card.
- Slide Philosophy's copy points home, in the right direction.
- Decision 6 reached the two task-centred lines.
- The halfway reason is decision 2's, in all three places, and «always meets» is gone.
- The two template lines no longer say criteria fit the bottom strips.
- The review heading names each list's last beat and tells repeated labels apart; nothing new crashes.
- The vocabulary test bars a retired rule wording in the programs and still bars a story in the instructions.
- Eleven of the second check's fourteen named misses are now caught.
- The size figures, the mapping and the ledger's rows are true.
- Every suite passes, and nothing was written into the plugin by running them.

## What I would still fix before release

1. **Named sheets (finding 1):** find every sheet's panels before any shape is chosen, in the preflight and the build, with a test of a named sheet with a panel beside an auto sheet that cannot fit; say in the log that a panel left at the last resort refuses the pack.
2. **Pins and tests (finding 2):** a preflight test whose sheet fits only once its panel is off; pin the 18 to 19pt message's last line, the list refusal's two unpinned lines and the card contracts' exception paragraph whole; bar the two retired template measurements by their own words; if the flag test is kept as a text test, have it reject the cue anywhere in `build.js`'s flagging code.
3. **Decision 10 (finding 3):** correct the worksheets ledger's decision 10, WS-R12, WS-R13 and its passing note before he answers, and tell him the engine already names the route; make the criteria branch win in the message; adjust the log's "nothing here settles it".
4. **The one exception (finding 4):** put to him whether any list may split over two cards of one title, then make the card contracts, the build message and the focused repair say the same.
5. **Small (findings 5 to 7):** take off a repeat-form or slot-held panel too, or say it is measured; the log's three overstatements; the fit summary's comment; the wall cell's two-card remedy.
