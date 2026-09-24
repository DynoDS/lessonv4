# Fourth independent check: the third round of repairs to the success-criteria change (4.2.288)

What I did: read the brief, the third check's report (its seven findings and "What I would still fix before release"), the repair scripts `r19` to `r23` and `scratch/ws_engine_now_matches.py`. I judged the files, not the scripts. The third check's scratch copy of the plugin (`scratch/sc3/me/copy2`) differs from the plugin now in exactly the eleven files this round names, so I diffed the two to isolate this round and read every changed line in place, and read the same rows against HEAD.

- I ran the worksheet preflight (`check-worksheet.js`, which writes nothing) over all 61 saved `worksheet.json` files outside `node_modules` and scratch folders with three engines: HEAD (`git archive`), the third check's state, and now. For each of the 11 files that carry a panel I also deleted the panels by hand in a scratch copy and ran HEAD's preflight on that, as the measure the new engine should reproduce.
- I built lesson 15 and a clean sheet (the digestive system) into scratch with all three engines, lesson 15 with and without `--omit-unfittable`, and ran 17 hand-made edge cases (named zones, two-page sheets, repeat and pair slots, rows with `parts` and `letters`, already-empty rows) through all three preflights and now's build both ways.
- I rebuilt the mapping on a scratch repository and made 37 break-the-rule attempts on a scratch copy of the whole plugin (everything but `node_modules`, with the ledgers beside it), after confirming the untouched copy passes the five pin tests (65 passed, 69,444 subtests), the whole Python suite (2,178 passed, 1 skipped, 71,506 subtests) and the three node suites (721, 709, 142). Each attempt ran the five pin tests, then the whole Python suite when the pins missed it, and the node suite of every program folder it touched; each was undone before the next, and the copy hash-matches its starting state afterwards.
- I ran the four suites in the plugin folder, hash-checked the plugin and every saved lesson folder before and after, and compared `git status` with the start.

**One mistake of mine, put right.** My first attempt to rebuild the mapping ran against the repository, not scratch: the edit meant to point the builder at scratch did not take (the shell turned the path's double backslashes into single ones) and I ran the builder before checking it. At 13:47 it rewrote `plugins/lesson-v4/scripts/tests/success_criteria_ledger_pins.json` and `plans/2026-09-23-success-criteria-mapping.md` with byte-identical content (checked against my start-of-run hash and against a copy taken at 13:35). I set both files' modified times back (the mapping's exactly, the pin file's to the second). Their contents, every other plugin file and `git status` are as they were when I started. The rebuild was then done in scratch, with the builder's path checked before it ran.

Apart from that, I changed nothing in the repository except writing this file. My scratch work is in `scratch/sc4/`.

---

## Findings

**1. The messages this round pinned can still be widened through the lines around the pinned ones, and two of this round's engine repairs are held by nothing.** Moderate.
- The list refusal: its four new lines are pinned, but its first line is not. Changing «"so it is a list and will print as a paragraph of grey text. If they " +» to «... If they are the steps of a method or " +» makes the refusal read «If they are the steps of a method or are the lesson's success criteria, leave them off: they stay on the board and are never printed on a worksheet.» That is the second check's finding 1 undone, and it passed the pins, the whole Python suite and the worksheet suite (T03b).
- The 18 to 19pt message: every line is pinned, including the last, but a new literal added after it passes: «`with a roomier shape named.` + ` For more room now, use the half-width split.`» (T11b) and the same with «Or shorten a step without losing what it tells a stuck child to do.» (Q05b). The third check's own wordings of these (inside the last literal) are now caught.
- Finding 5's repairs are held by nothing: deleting the preflight's «if (panelsFound.length && /CRITERIA_NOT_ON_SHEETS/.test(problem)) continue;» brings back the double naming of a slot-held panel (N10), and replacing the slot-held branch with «The page below is measured without it.» (N11) passes too.
- The new measuring test is the only thing holding a change that keeps the pinned lines but stops an emptied row counting as empty (T06b); cut that test's assertions, title kept, and T06b passes everything (N15c). Pinning a test by its title is the limit the third check named.
- The log's «all pinned now» is true of the lines each message gained; it is not true of the messages whole.

**2. A zone whose whole content is a stack or row of panels is emptied in place, not kept.** Low to moderate.
- `withoutPanels` now walks the whole sheet. A panel in an array comes off, and so does a row or stack it empties, but only when that row or stack is itself in an array. A named zone (`zones.b = { stack: [panel] }`), a two-page sheet's zone (`pages[1].zones.b`) or one side of a pair is an object key, so it is left as `{ stack: [] }`.
- The preflight then says «The page below is measured without it.» and its room report prints «a stack of [0 x undefined] 174x0mm (needs -Infinityx0) -» (edge cases E1, E10, E14). Nothing says the zone will be empty.
- The new comment says «A panel held on its own in a slot (a repeat's stack, one side of a pair, a named zone that is only the panel) stays, and is measured.» That is true when the zone is the panel itself (E2, E13), not when the zone is a stack holding only the panel.
- HEAD gives the same «-Infinity» report, and `WORKSHEET_PREFLIGHT_OK`, for a sheet whose designer empties the zone by hand, so the measurement is "as it will be"; the fault is the noise and the silence about an empty zone. No saved sheet has this shape (the one named sheet with panels, lesson 15, holds them in a row inside a stack, which goes cleanly).

**3. Decision 10 in the worksheets list was corrected after he answered it, and nothing says so.** Low.
- Its «What it says now» now reads «Since the success-criteria repairs (24 September) the sheet engine's message says success criteria stay off, and that steps a child works through to reach an answer go with their question ...». It sits under «*Put to him on the morning of 24 September ...*», and the list records his «yes» that morning, but he read the old line («The sheet engine's message tells the designer a method's steps are "never printed on a worksheet"»). The script's own docstring says the correction came after his answer.
- His yes was to the suggestion, which is unchanged and which the engine already meets, so nothing he decided moves. But the list no longer shows what he was shown; a one-line note would keep the record straight.
- WS-R13 still gives «· L38»; its first quote now starts on line 39 (the comment above it gained a line). The ledger quote checker does not cover `worksheet-html` paths, so it cannot see this.

**4. Two "measured" promises are not always kept.** Low.
- On lesson 15 the preflight tells the Expected sheet «The page below is measured without it.», but Greater Depth then fails to lay out and the check stops, so the Expected page is never measured in that run. It is measured correctly once it is reached (see section 2).
- A named sheet whose panel is held in a slot is told «one held on its own in a slot is still measured». The room report does measure it, but the fit verdict is suppressed, because a sheet with a zone fault skips the fit check: a panel of 45 steps as zone `b` gave «SHEET_DOES_NOT_FIT: ... a shortfall of 85mm» at HEAD and nothing now (E15). The panel has to come off anyway, so this is wording, not a lost signal.

**5. The card contracts' new bracket says a little more than the build and the focused repair do.** Low.
- New: «the exception is a list or table too long for one card, carried in order over two cards of the same title, which is one job split for room (the build and the focused repair already offer it, ...)». For a list, both do. For a table that is not the criteria, neither does: the build's table message offers «Remove a row, or shorten cells» and only a criteria table «goes over two cards», and the focused repair speaks only of «the card's items».
- It adds no permission: the wall preferences already say of a long table «split into two cards or pick the highest-leverage rows», and the designer is told at HEAD to «split a too-tall card's items in order over a second card when the wall has room for one».

**6. Left as they were, and not claimed.** Low.
- An auto sheet whose only zone is a panel still gets a second message after the panel refusal: «AUTO_LAYOUT_INVALID: ... This one is empty.» (E7; third check finding 5, second bullet).
- The task-centred route keeps «`steps` are stages of work, not the standard said again» and «a class shown a model that would fail the standard is being marked against something it was never shown» (finding 7; not in its fix list).
- The wall designer's rule 1 and its merge test («Add a second card only when it performs a genuinely different durable job») still name no exception; the same file's validation paragraph does name the split.
- The build's diagnostic for a panel on page 2 of a two-page sheet carries `"zone":"a"` but no page (E4, E10). Only reachable now that two-page sheets are searched.

**7. Comments and test bodies no pin holds.** Not faults; the limit of phrase pins.
- Reverting the slide build's comment to «the repair is always the words» (N06), the list refusal's comment to «the lesson's method, which is `steps`» (N08) and deleting the build's «A panel still on a sheet at the last resort refuses the pack» comment (N13) pass everything.
- Weakening the flag test's new check with `or True` while putting the cue back (N14), and cutting the named-sheet test's build half while letting the build skip named panels (N16), pass everything.
- The two retired template measurements in new words («about five step rows», «about 2.0 to 2.5 inches») pass (Q12b); in their own words they are caught (Q12).

---

## 1. The third check's seven findings

1. **Named sheets: done.** Old: «if (!sheet || sheet.layout !== "auto") continue;» and «A named layout's panel is reported by checkWorksheet, which runs on the sheet as written.» New: «if (!sheet || typeof sheet !== "object") continue;» «for (const where of criteriaPanelsOn(sheet)) {», commented «Named layouts too: their sheets are checked only after every auto sheet has a shape, which another sheet's failure can stop (lesson 15's Expected sheet was never told of its two).» The build uses the same function («const panels = sheetCriteriaPanels(worksheet);») and says «A panel still on a sheet at the last resort refuses the pack: the flag rescues a page too small and nothing else.»; the log says the same. New test: «a named sheet's panel is named even when another sheet cannot be laid out». Lesson 15 now names all four panels in the preflight and the build (section 2).
2. **Pins and tests: done as asked, with the residue in finding 1.** Pinned: «worksheet = withoutTheirPanels;», «if (isEmptyGroup(cleaned) && !isEmptyGroup(item)) continue;», the 18 to 19pt message's last line «`with a roomier shape named.`», the list refusal's four new lines, the card contracts' exception paragraph whole, and the two retired template measurements as gone in their own words. New test «the preflight measures a sheet without its panels, and leaves no empty row behind», whose sheet fits only once its two panels are off. The flag test now also strips comments and asserts «'SUCCESS_CRITERIA_CAPACITY' not in code».
3. **Decision 10: done.** Message: old «If they are steps a child», new «Otherwise, if they are steps a child», so the criteria branch wins. Comment: old «the lesson's method, which is `steps`», new «the lesson's success criteria, which stay on the board (23 September 2026)». Log: old «Whether a method's steps belong on a worksheet at all is the worksheets topic's open decision 10, and nothing here settles it.», new «The engine's list refusal now matches the instruction files as they stand (success criteria off; steps a child works through go with their question); the teacher answered the worksheets topic's decision on a method's steps yes on 24 September, and that release carries it into the instructions.» Worksheets list: section 5 and finding 3.
4. **The one exception: done differently, and soundly.** Old «; the one exception is a success-criteria list or table too long for one card, carried in order over two cards of the same title, which is one job split for room.» New: finding 5's quote. It was not put to him, but it takes the side that changes nothing: the build («Splitting the items in order over a second card keeps every word and is a layout change (a wall takes two teaching cards)»), the focused repair («put the card's items, in their order, on two cards of the same type and title, when the wall holds only one teaching card (it takes two)»), the scope checker (which joins an ordered sequence split over two cards back into one) and the kept ledger row SC-O22 have all allowed it since 4.2.198 (14 September). Narrowing them instead would have taken a permission away. Its bracket: finding 5.
5. **Slot-held panels: done differently (said, not removed); the second refusal: not done; already-empty groups: done.** New message for a sheet with a slot-held panel: «The page below is measured without the panels that can come off; one held on its own in a slot is still measured.» A repeat-form or pair panel is now named once (the third check's state named each twice). New comment: «A row or stack the panels leave empty goes with them; one that was empty already stays.» An already-empty row now gives HEAD's own «NaNmm» verdict, as a hand-written empty row always has. Finding 6 for the sheet that is only a panel.
6. **The log's three overstatements: done.** «every sentence the repairs wrote into an instruction file, bar two on the wall, was caught»; «in the vocabulary topic a retired story may still stand in a program»; «so lesson 15's Greater Depth sheet was priced with its panels and the last-resort build dropped it (...; without its panels that sheet is still 4mm too tall, so it would still be left out for size)». All three are true.
7. **Neighbouring words: two of three done.** Comment: old «because the repair is always the words», new «because the repair is the words (except in a criteria panel, whose words stay and which 18pt already suits)». The printed line beneath it still says «whose lever is a roomier composition» (pinned); both are true. Cell message: old «(the card makes room instead, or the table goes over two cards)», new «(the card makes room instead)». The two task-centred "standard" labels: not done (finding 6).

## 2. The engine

- **Preflight, 61 saved sheets, three engines.** No signal lost against HEAD or against the third check's state, and none added against the third check's state. No stack trace, `NaN` or `Infinity` in any run. 45 outputs are byte-identical to the third check's state; 15 differ only by «Otherwise,» in the list refusal; lesson 15 adds its two Expected panels. No panel is named twice in any saved sheet.
- **Measured without the panels.** For every one of the 11 files with a panel, now's measuring lines (the `AUTO_LAYOUT` choice and fill, `SHEET_DOES_NOT_FIT`, the room and composition advisories) equal HEAD's on the same file with its panels deleted by hand, line for line. Lesson 15's Expected sheet on its own (Greater Depth and its answers taken out) also equals HEAD by hand, line for line; the third check's state measured it with its panels in (a 72mm row of two panels). Greater Depth reads 184mm on a 180mm page, as before.
- **Lesson 15 built into scratch.** HEAD: «SHEET_DOES_NOT_FIT: Greater Depth ... 22mm too narrow»; with the flag it omits Greater Depth and then refuses on «ANSWER_KEY_INCOMPLETE: answerKey.expected is missing question (5)», a fault of the saved spec itself. Third check's state: names the two Greater Depth panels only, both ways. Now: names all four panels, both ways, omits nothing and writes no files.
- **A clean sheet** (the digestive system) builds byte-identical pages and answer key with all three engines.
- **The code that takes panels off a whole sheet.** It removes only items whose helper is the panel, and a row or stack those removals empty when that row or stack sits in an array; everything else is copied unchanged, and the saved spec is never touched. Checked on hand-made cases: a named sheet like lesson 15 (row of two panels in a stack) and a named row of one panel go cleanly; a two-page sheet's panel inside a stack comes off and the page stays; a row with `parts` and `letters` loses the panel and falls back to shape-based widths, as a hand deletion would; an already-empty row stays; a repeat-form or pair panel stays and is said to be measured. It can leave an empty zone: finding 2. The build refuses on every one of these before any shape is chosen, with and without the flag.

## 3. The wording

- **The card contracts' exception** now matches the wall build's list message, the focused repair and the scope checker, and adds no permission they and the preferences lacked (finding 5 for its bracket).
- **The wall's table-cell message** no longer offers two cards for a cell too long for its column; «the card makes room instead» is the remedy that can cure it.
- **The builder comment** no longer says the repair is always the words.
- **The list refusal's «Otherwise»** makes the criteria branch win when a skill lesson's method is its criteria, and the comment above it now calls the rounding list criteria.

## 4. The pins and tests

The untouched copy passed the five pin tests, the whole Python suite and the three node suites before any attempt.

**The third check's uncaught attempts now claimed caught, repeated (and one variant of each that keeps the pinned words).**

| # | What I did | Result |
|---|---|---|
| T05 | the preflight's «worksheet = withoutTheirPanels;» deleted | caught by the pins and the new measuring test |
| T05b | the same effect with the pinned line kept (`withoutTheirPanels` set to the sheet as written) | caught by the new measuring test and the older auto-sheet test |
| T06 | the line that drops an emptied row or stack deleted | caught by the pins and the new measuring test |
| T06b | the pinned line kept, but an emptied row no longer counts as empty | caught by the new measuring test only |
| Q05 | «or shorten a step ...» inside the 18 to 19pt message's last literal | caught by the pins |
| Q05b | the same as a new literal after it | caught by nothing |
| T11 | «For more room now, use the half-width split.» inside the last literal | caught by the pins |
| T11b | the same as a new literal after it | caught by nothing |
| Q12 | the two retired template measurements back as a paragraph, in their own words | caught by the pins |
| Q12b | the same two measurements in new words | caught by nothing |
| Q02b | the capacity cue on the line of the entry before it | caught by the flag test |
| Q02c | the cue added to the set after the list | caught by the flag test |
| T02 | «or in maths use "method-frame"» dropped | caught by the pins |
| T03 | «and nor are the steps of a method» on the line the third check used | caught by the pins |
| T03b | the list refusal widened back to a method's steps through its unpinned first line | caught by nothing |
| T20d | «Any other card too long for one card may be split the same way.» inside the exception paragraph | caught by the pins |

**This round's words and code, deleted, softened and moved.**

| # | What I did | Result |
|---|---|---|
| N01, N02, N03 | the card contracts' exception deleted, softened to «an exception may sometimes be», moved to Every card | caught by the pins |
| N03b | the exception narrowed back to success criteria only | caught by the pins |
| N04 | the cell message offers two cards again | caught by the pins |
| N05 | the cell message loses its criteria exception | caught by the pins |
| N06 | the slide build's comment back to «the repair is always the words» | caught by nothing (a comment) |
| N07, N07b | «Otherwise,» deleted, or softened to «Also,» | caught by the pins |
| N08 | the list refusal's comment back to «the lesson's method, which is `steps`» | caught by nothing (a comment) |
| N09 | panels found early on auto sheets only again | caught by the named-sheet test |
| N10 | the preflight names a slot-held panel twice again | caught by nothing |
| N11 | a slot-held panel said to be «measured without it» | caught by nothing |
| N12 | the build filters out named sheets' panels, on the pinned line | caught by the pins and the named-sheet test |
| N12b | the same with the pinned line kept | caught by the named-sheet test |
| N13 | the build's last-resort comment deleted | caught by nothing (a comment) |
| N14 | the flag test's new check weakened with `or True`, the cue put back | caught by nothing (a test body) |
| N15 | the new measuring test's assertions cut, and T05 | caught by the pins (T05 changes a pinned line) |
| N15b | the same with T05b | caught by the older auto-sheet test |
| N15c | the same with T06b | caught by nothing (a test body) |
| N16 | the named-sheet test's build half cut, and N12b | caught by nothing (a test body) |

Of 37 attempts, 25 were caught (18 by the pins, 5 by the worksheet node suite, 2 by the flag test). Every sentence this round wrote into an instruction file, and every line it wrote into an engine message, was caught when deleted, softened or moved. What is not held: new words beside a pinned line, this round's two preflight message repairs, comments, and test bodies (finding 1 and finding 7).

## 5. The worksheets list

- **Decision 10:** true to the engine now (finding 3 on when it was written). «in maths a fill-in frame» is the message's «in maths use "method-frame"».
- **WS-R12:** all three quotes are in `render.js`, from line 619 as stated; its note («its comment named "a method's steps" too until the success-criteria repairs of 24 September, and now names success criteria only») is true.
- **WS-R13:** all three quotes are in `text.js`; its note is true; its line number is one short (finding 3).
- **WS-R23:** both quotes are in `design-review-packet.py`, from line 1225 as stated (the ledger quote checker agrees).
- **The R13 story row** («the comment now names the rounding list as the lesson's success criteria, which stay on the board») and **the passing note** («The engine now matches the instructions on a method's steps») are true.

## 6. The suites

From the plugin folder: `python -X utf8 -m pytest scripts/tests -q -p no:cacheprovider`: 2,178 passed, 1 skipped, 71,506 subtests passed. `node --test` in `worksheet-html`: 721 passed; in `builder` (`node --test "test/*.test.js"`): 709 passed; in `working-wall-html`: 142 passed. The plugin's files hash the same before and after the runs, and so does every saved lesson folder the preflight read.

## 7. The log entry

- **Size figures, measured** (line endings normalised, tests, the log and the catalogue left out of the instruction files): instruction files 5,141 bytes larger («about 5.1 KB»), programs 11,057 larger («about 11.1 KB»), catalogue 629 smaller («about 0.6 KB smaller»). This round added 119 bytes to the instruction files and 1,352 to the programs, most of it the preflight and the panel code.
- **The mapping**, rebuilt on scratch: 466 pins, 80 changed rows, byte-identical to the repository's pin file and mapping.
- **The third reader bullet** is true to the files and to the third check's report: «since 14 September» is 4.2.198; «now held by a test whose sheet fits only once its panels are off» is true (T05b, T06b); «all pinned now» is true of the lines named, not of the messages whole (finding 1).
- **The Checked (code) bullet's new sentences** are true, with finding 2's empty zone as the exception to «measures each page without the panels that can come off».
- **«Not done yet»**: its new sentence is true; «that release» reads as the worksheets topic's release.
- **Dashes**: no em or en dash was added to plugin prose, the log or the worksheets list. The one new en dash is inside a pin that bars the retired template words, which carried it.

---

## Checked and found sound

- Every sheet's panels, named, auto and two-page, are found before any sheet is laid out, in the preflight and the build.
- Lesson 15 now names all four of its panels in both, and the last-resort build omits nothing over them.
- Each page is measured as HEAD measures it with the panels deleted by hand, on all 11 saved files and on lesson 15's Expected sheet alone.
- No saved sheet lost a signal, gained one against the third check's state, crashed or had a panel named twice.
- A clean sheet builds byte-identical with all three engines.
- The panel-removal code changes only panels and the rows or stacks they empty inside a list, and never the saved spec.
- An already-empty row is left as the designer wrote it.
- A slot-held panel is named once and said to be measured.
- The list refusal's criteria branch wins, in words the instructions already use.
- The card contracts' exception matches the build, the focused repair and the scope checker, and adds no permission.
- The wall's cell message no longer offers a cure that cannot work.
- The builder comment no longer says the repair is always the words.
- The two lines that make "measured without it" true are held by a pin and a behaviour test.
- The 18 to 19pt message, the list refusal and the card contracts' paragraph are pinned on every line this round wrote.
- The retired template measurements are barred in their own words.
- The flag test rejects the cue anywhere in the build's code.
- The worksheets list's rows are true to the engine.
- The log's size figures, its three corrected overstatements and its third-reader bullet are true.
- The mapping rebuilds byte-identical.
- Every suite passes, and running them wrote nothing into the plugin.

## What I would still fix

1. **Finding 1:** pin the list refusal and the 18 to 19pt message whole (or add a node test that asserts each whole message), so a clause on an unpinned line cannot widen them; add a preflight test with a slot-held panel that checks it is named once and said to be measured.
2. **Finding 2:** when a zone's whole content was panels, either keep it and say it is held in a slot, or name the zone as empty in words; correct the comment.
3. **Finding 3:** add a line under decision 10 saying its «What it says now» was corrected after he answered, and set WS-R13 to L39.
4. **Small (findings 4 to 6):** the named sheet's «measured» wording when its page is not reached, the slot-held fit wording, the card contracts' bracket for tables, the second refusal for a sheet that is only a panel, the two task-centred labels, and the page in a two-page panel's diagnostic.
