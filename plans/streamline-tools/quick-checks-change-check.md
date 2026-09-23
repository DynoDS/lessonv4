# Independent check: the quick-checks change (4.2.286, uncommitted, on top of 4.2.285)

What I did: read the brief, the whole ledger (307 rows, the ten decisions and the proposals he agreed), the mapping and the previous check; rebuilt the 4.2.285 state from `stash@{0}` and the snapshot tar in a scratch folder and diffed all 13 changed tracked files, the changed Teach then Do pin file, the new pin file and the two new test files against it, word by word; checked every changed row by hand against its ledger quote and the proposal; confirmed by script that every "unchanged" row pins all of its ledger quotes and that each quote is in both the 4.2.285 and the current file; searched the whole plugin for the excuse's wordings and for text the new wording now contradicts; ran the Python suite (2,121 passed, 1 skipped); ran the old and new review-view code over all 54 saved `lesson-design.json` files and over hand-built designs for every route; and ran 42 break-the-rule experiments on a scratch copy of the whole plugin (everything but `node_modules`; the three pin tests pass on the untouched copy, and the whole suite fails there only in `test_helper_coverage.py`, twice, because it looks for the real checkout). I changed nothing in the repository except writing this file.

Findings are ordered most serious first inside each heading. Anything checked and found sound is listed in one line at the end of its heading.

---

## 1. Row by row (the 41 changed rows)

**1a. C01, C02, C03, C04 and C08 (decision 4): the pointers carry the half of the recall line that permits and drop the half that limits.**
- The home: «A fact, a name or a definition is the one thing recalled rather than applied: straight after teaching it may be asked for once the answer is no longer on show, [...] and it claims recall, never understanding. A check that an idea, a relationship or a method's decision has landed is a fresh case.»
- The pointers:
  - C02: «A response after new teaching may simply establish or retrieve it, including the last short response before main practice (recall with the answer off the board, or a fresh case: [...])»
  - C03 (designer): «A short recall response may secure new knowledge, including in the last Do, when the answer is no longer on show ([...])»
  - C04: «A short response can establish new knowledge, when its answer is not on the board ([...])»
  - C08 (reviewer): «Preserve purposeful repeated practice and useful simple checks (a fresh case, or recall with the answer off the board: [...])»
  - C01: «(a quick check on a fresh case, or recall with the answer off the board: [...])»
- None says "a fact, a name or a definition". Read alone, each licenses recalling an explanation straight after it was given, which the home sends to a fresh case and A01 calls finding («repeating the sentence the slide or the teacher has just said is finding it»).
- Example: after a Teach explaining why a shadow forms, `cover the board: why does a shadow form?` passes every pointer. The reviewer is told to preserve it under C08, one bullet before D08 tells it that «a summary, headline or one-sentence recap of the explanation just given is a restatement».
- Decision 4 said "Each permission keeps its words and points to that line." These do more than point: each paraphrases half the line.
- This is the brief's exact worry: the home's new line matches the proposal (apart from 1g), and the copies quietly widen it.

**1b. H05 (decision 5): Two Truths and a Lie took half of True or False's limit.**
- True or False (5.3, unchanged): «it earns its place only when the statement is one a child in the class could genuinely believe (`Tudor families sent children to work because they didn't care about them`) and the reason is written. Prefer a sort, a match or an odd one out when those force the same decision.»
- Two Truths and a Lie (5.6, new): «**The limit:** as True or False (5.3), fine but can be cheap: it earns its place only when the lie is one a child in the class could genuinely believe, never the slide's own sentence twisted.»
- Lost: «and the reason is written», and the preference for a sort, match or odd one out. The decision was "Two Truths and a Lie takes True or False's limit". "as True or False (5.3)" could be read as importing the whole limit, but the sentence then states the limit in full and leaves the reason out, and 5.6's own task («pupils identify the false one») asks for none.
- Added, and sound: «never the slide's own sentence twisted».

**1c. D11 to D16, D19, D20 (decision 5): the new limit sits under Best-for lines that recommend the moment it forbids.**
- Five of the eight entries still say:
  - 1.2 «**Best for:** consolidating a single Teach chunk fast.»
  - 2.8 «**Best for:** after a content-rich Teach slide; works as the bridge into written response.»
  - 3.1 «**Best for:** end of a Teach chunk where there is a single core idea.»
  - 4.4 «**Best for:** end-of-chunk consolidation when content is conceptual.»
  - 8.7 «**Best for:** end of a major Teach chunk; bridge into the lesson's main Practise.»
- Each is now followed by «**The limit:** not straight after the Teach it gives back, [...] it earns its place when children choose across several things with the teaching off the board.»
- 4.1 is defined as the thing its limit rules out: «Pupils draw what was just described. *"Sketch the water cycle as I described it. 90 seconds. Stick figures fine."*»
- The ledger flagged it ("Some are listed as best straight after a Teach"), and the decision was only to add the limit, so this is the decision's letter. But a designer reads the recommendation first, and a single core idea is exactly where "choose across several things" cannot happen.
- One note, not a fault: «it earns its place when children choose across several things with the teaching off the board» comes from the proposal's "What I think", not its "What I suggest". "A one-line limit carrying both" names the two limits the analysis set out, so I read it as agreed.

**1d. B01 (decision 2): a new permission the proposal did not contain, which the contrast it sits under contradicts.**
- Old: «As a two-minute orientation straight after the deal is taught, the good/bad sort settles the vocabulary of the deal before the question that matters. It is fine there, named as a check, and it is not the lesson's evidence.»
- New: «A sort still earns its place when its cards are cases the lesson did not show: sorting a different apprentice's deal, once this one is taught, settles the vocabulary of the deal and needs it. The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks.»
- The suggestion he agreed: "Remove the orientation permission in all three places. Keep what each also says: such a sort is not evidence, and a lesson that leans on it has taught less than it looks." The different apprentice came from the ledger's "honest note", which was analysis.
- The same contrast says the good/bad sort fails on everyday sense, not freshness: «Requires: reading the card and knowing that early mornings are unpleasant. A child who slept through the lesson sorts all six correctly.» The reviewer's probe example agrees («A good/bad apprentice sort passes the misunderstanding untouched»), and so does fixture P09. A good/bad sort of another apprentice's deal passes on the same everyday sense.
- So the calibration file the reviewer reads every review now calls a sort "right" once the apprentice changes, and says it "needs" the vocabulary without saying what would make it need it.
- Related, and faithful to the proposal's words: history's «a lesson that treats it as the main work has taught less than it looks» became «a lesson that leans on it», which is looser, and the contrasts file gained the clause.

**1e. B02 (decision 1): what is left calls reading labels off a map "an honest recall beat", which the new home's own test says it is not.**
- New: «Reading labels off a map is right when reading a map is what is being taught, and a quick label-reading check after a new map skill is an honest recall beat.»
- The home: «The difference is whether the answer is still in front of the child», and «after teaching the key on a map of Brazil, the check is reading the key on a map of Kenya, and calling a re-read of the Brazil map a quick check does not make it one.»
- A label read off a map is in front of the child, so it is not recall, and the sentence does not say the map is new. Decision 1 said to keep the rest of the sentence, so the change did what he agreed. But this is the ledger's second survivor of the excuse, it now contradicts the example written for it, and it sits in the reviewer's always-read calibration. It needs his word.

**1f. A21 (decision 8): carried into the home reworded, with its must-not dropped, and the mapping says "word for word".**
- A21 (still whole in `lesson-designer-components.md`): «The same conclusion can be valid in two cases when each requires that work; do not force different answers. Conversely, reusing the taught conclusion while ignoring the new material is weak evidence of fresh application.»
- The home: «[...] and reusing the taught conclusion while ignoring the new material is weak evidence. The same conclusion can be valid in two cases when each requires that work.»
- «do not force different answers» is gone from the home. The reviewer keeps its own counterweight (A22, «Do not make every answer different or strip useful support to manufacture independence»); the designer reading the home for a quick check does not.
- Other edits keep the meaning: "For procedural fluency" to "for a procedure", "sufficient" to "enough", "executing" to "carrying out".
- The mapping's «carried word for word into the one home» is not true. The build log says only "carried", which is.

**1g. The home's recall line adds an absolute the proposal did not have.**
- Proposal: "a fact, name or definition may be recalled straight after teaching when the answer is no longer on show".
- New: «A fact, a name or a definition is the one thing recalled rather than applied:».
- Read on its own, "the one thing" says nothing else is ever recalled. The catalogue's §1 still offers recall for more: «Use these when the prior chunk is a fact, name, date, definition, or rule that children need to lock in before building on it», and the claim table keeps «Recall or rebuild a taught arrangement». Probably meant "straight after teaching", where it is right.

**1h. I06 and I07 (decision 3): the catalogue's label formats leave out the no-other-picture limit.**
- I06: «A simple unlabelled diagram is provided, of a thing the Teach did not label (a different flower, a new stretch of river), or the taught one in a later lesson, when it is retrieval;» I07 is the same shape.
- The home also allows «Where no other picture of the thing exists (the world map), a blank copy of the same one is the check». A world-map label check straight after teaching is ruled out in the catalogue and allowed in the home. Low.

**1i. D21 (decision 6): a kept clause names the case the entry now rules out, and the example still reads as it.**
- New: «**Best for:** a diagram the class has not had explained (the same process drawn differently, a new cycle), and as the check that a picture children copied actually means something to them. One sentence about the diagram the teacher has just talked through is a restatement, not this.»
- The example is unchanged: «*"In one sentence, what is this diagram telling us about how the water gets back to the sky?"*»
- A picture children copied in the lesson is normally the diagram the teacher just talked through. The proposal's own example ("what is this drawing of a puddle drying telling us?") would have settled it. Low.

**1j. E03 (decision 8): the home now reads the thinking line «against what the class knew walking in» but gives only the board's verdict** («If the line can be answered by reading the board, choose again»). The guessing half is in the designer's E01 and in `What a Lesson Is For`, which the sentence cites. Low.

**1k. Decision 10's second half: two listed incidents keep their incident words.** Decision 10 said the other real-deck cases in the ledger's story list follow the standing rule (the reason stays, the incident goes to the log). E11 keeps «and a reviewer approved both» in the reviewer (a test pins it), and G06 keeps «and the teacher who wrote the lesson could not tell the groups apart» in the home. Both incidents are already in the log (L2306, L1187). Low.

Checked and sound: A01 (date out under the standing rule; the ruling is in the log at 4.2.205), A07 (only true repeats folded; «Keep it short and save the reasoning for later» and the disagreement case kept), B03 (the orientation clause out, the first clause and «insufficient as the main evidence» kept), B04 (the permission out; both test-pinned phrases kept; the new «a sort a child finishes from everyday sense» is what G26 in the same paragraph says), B05 (decision 3 exactly, both limits, the tooth example; the stale «recap boundary above» gone), C05 (its pointer is G01's own condition, not a new one), D22 and D23 (the conditions as proposed; Words to Diagram included, which he agreed), E02 (a plain example now; the story is in the 4.2.286 log in its old words), E04 (done in 4.2.285), F05 (both of 10.8's conditions carried), G01 (unchanged; its limit is B05), G27 (date out; the title `Why did Tudor children work?` matches log L1135), P01 (see section 4 for how far "every route" reaches), P02 and P03 (code), P08 to P10 (record only; ids kept, so the fixture tests still read them).

---

## 2. Each decision against its proposal

- **Decision 1: faithful.** Both clauses gone; the honest-say-so line matches the proposal, with the Brazil and Kenya example. Its second sentence («It never lets a label stand in for the fresh case») closes the one reading that could license a re-read by honestly claiming only attention. What was left of B02 now contradicts it (1e).
- **Decision 2: more than proposed.** The permission is out of all three places and the reviewer's first clause stays, but the contrasts file gained a new permission (1d).
- **Decision 3: faithful in the home and the test; the two catalogue formats miss one limit** (1h).
- **Decision 4: the home matches the proposal's words and all three enamel examples, with one added absolute** (1g). C06's table row is untouched and C01's test-pinned opening is kept, as agreed. **The pointers widen it** (1a), and B06 gained a condition rather than only a pointer (section 3).
- **Decision 5: the limit is on all eight formats (a test counts eight), but 5.6 got half of True or False's** (1b), and five Best-for lines now contradict their limit (1c).
- **Decision 6: done in all three formats, with a leftover in 10.6** (1i). The three lists that send designers and the reviewer to these formats still offer them without the condition (section 5).
- **Decision 7: done.** PSHE's and RE's wording is untouched and pinned (A14, A15).
- **Decision 8: done.** One home with A21 and both new lines beside the rule; the reviewer's A08, A09, G05 and E08 word for word; the contents line already named quick checks (4.2.285). A21's wording and its lost must-not are 1f.
- **Decision 9: done in code, with gaps** (section 4). The trigger half is answered, as the log says, by 4.2.285 putting the rhythm section on the always-read list. The always-read note still names only «a Do whose expected answer is a summary, headline, recap or restatement of the explanation its own Teach just gave» and «quick checks»; the decision's "whatever its form" (a sort, an option bank, a label) is not in its words. Low, since the section is read whole.
- **Decision 10: done** for G27; the second half is 1k.

---

## 3. The honest "say so" rules decision 1 listed

- **B06 is not word for word.**
  - Old: «A quick recall check is fine when recall is the claim; do not present it as deeper evidence.»
  - New: «A quick recall check is fine when recall is the claim and the answer is off the board (`preferences.md` → `A quick check is a fresh case, not the last slide again`); do not present it as deeper evidence.»
  - Decision 1 said every listed rule stays word for word; decision 4 listed B06 among the permissions that keep their words and point home. The inserted condition follows decision 4's substance and is more than either decision agreed. His call; I would keep it and tell him.
- Word for word at their ledger positions, and pinned: K22, S43, S42, S32, S33, M25, M26, B07. Experiment X11 confirms deleting K22's «and that is a decision made for that task and said out loud» is caught.

---

## 4. The code

**4a. An enabling input's own instruction always counts as a total restatement.**
- `_beside_teaching_text` includes the teaching beat's own `answer.content`. When the beat is paired with itself (a `teach-needed` with its own pupil instruction), the expected answer is counted against itself, so every one reads "N of N".
- On the saved designs this is all five such beats, in the two PSHE task lessons. The view prints 8 of 8, 11 of 11, 9 of 9, 14 of 14 and 11 of 11; with the beat's own answer left out the counts are 6 of 8, 5 of 11, 6 of 9, 13 of 14 and 9 of 11.
- The new test builds this case but checks only its heading.

**4b. Pupil beats still missed or wrongly paired.**
- **Every Our Turn is shown with its question blank.** Its question is `content.example`, which the view does not read. 36 of the 46 Our Turns shown across 18 saved designs print `- Asked:` with nothing after it, then an answer.
- **A Your Turn is compared only with the My Turn**, never with the Our Turn whose answer the class has just seen revealed.
- **Dialogic lessons.**
  - A Talk is paired with the grounding input, skipping the Stimulus the class is looking at, so the Stimulus material is not counted.
  - After the first Talk, no further Talk or Stimulus-talk is shown.
  - A dialogic lesson with no grounding input (it is optional) shows nothing.
  - A Talk's expected responses live in `teacherListensFor`, which is not read, so it prints `(none written)`.
  - No saved design is dialogic; I checked each point on a hand-built one.
- **Discovery lessons:** a Use the learning is counted against the Teach why only, not the Make sense result on the board just before it («The shadow grows bigger when the torch is closer» against a result card saying the same scored 2 of 6).
- **Task lessons:** a Do the task after an enabling input that has its own instruction is never shown.
- **Two My Turns in a row:** the first is never paired (one saved design, `year-4-maths-represent-4-digit-numbers`).
- **Sorts:** an item's `detail` is neither printed on the `Cards:` line nor counted.
- The reviewer's pointer and the log both say "in every route"; for dialogic that is only the first Talk after a grounding input.

**Checked and sound.**
- **No crashes on real designs.** The full review view builds for 52 of the 54 saved designs in both the old and the new code. The other two are unfilled scaffolds (`__LESSON_DESIGN_FILL__` where an object belongs) and fail in both, as the old code did.
- **Nothing the old view showed is gone.** All 84 old sections are still there, 174 in all now. The 3 old `(none written)` lines now show real answers, and no new ones appear.
- **What is new works on real designs.** The takeaway is counted, including a sticky fact's text; sort placements print as «item under group»; option banks still list their options.
- **The Python suite: 2,121 passed, 1 skipped.** The author's logs from 12:25, after every changed file but the build log (12:26), show the builder (709), worksheet (716), working-wall (142), stick-in (70), shared (126) and top-level (46) suites and the voice harness (21) all passing.

---

## 5. Collateral, and what elsewhere now disagrees

- **The three lists that point at decision 6's formats still offer them with no condition.**
  - `preferences.md`'s explanation list: «turn the words into a diagram or the diagram back into words»
  - the designer: «words to diagram and back»
  - the reviewer's repair list: «the words turned into a diagram or back»
  - So the reviewer's local repair for a restatement can produce the one-sentence account of the diagram just talked through, which 10.6 now calls a restatement. Low.
- **§1 Recall's opening against the home's "the one thing"** (1g).
- **`stick-in-sheets-pedagogy.md` still calls the blank world map «a genuine retrieval task».** The home now calls the same-lesson blank copy "the check" and keeps "retrieval" for a later lesson, and L01 says a beat thirty seconds on is not retrieval practice. This wording was there before the change. Low.
- **Out-of-date text the ledger listed and this change left, unnamed in the log:**
  - G10's «answer-scatter principle» (the principle it points at is `Protect answers without destroying meaningful order`)
  - D14's «Lower stakes than Brain Dump.» (there is no Brain Dump entry, and the new limit now sits directly under it)
  - G33's quotation of a reviewer phrase that no longer exists
  - the catalogue's counts
  - None was a decision.
- **No survivor of the excuse anywhere.** I searched every instruction file, program and fixture for "named as", "the design says so", "orientation", "fine as a" and "honest recall beat": the only hits in quick-check sense are B02 (1e) and the retired-phrase pins themselves.

---

## 6. The pins

**Coverage.**
- `quick_checks_ledger_pins.json` holds all 307 ledger ids, none missing and none extra, plus DEC-09 and the home's 29 paragraphs, in order.
- Every "unchanged" row pins all of its ledger quotes, and each quote is in both the 4.2.285 file and the current one.
- Every changed row outside code and the fixture pins its whole new paragraph (or catalogue entry).
- 13 retired phrases are pinned, all "everywhere".
- Of the Teach then Do pins, 13 rows changed, not nine: eight carry a quick-checks decision (E03, E06, F09, F12, L09, Z05, Z07, Z18). Five more (E04, E05, F13, L07, M04) had their whole-paragraph pins regenerated to the new text, while their outcome still describes 4.2.285.

**The experiments.** 42 edits, each made on the scratch copy and undone before the next. Each ran against the three pin tests. Those the pins missed then ran against the whole suite.

| # | What I did | Pin test | Whole suite |
|---|---|---|---|
| X01 | Deleted the recall line (decision 4) from the home | caught | caught |
| X02 | Deleted the honest-say-so lines (decision 1) from the home | caught | caught |
| X14 | Softened «it claims recall, never understanding» to «rarely understanding» | caught | caught |
| X21 | Moved the recall and honest-say-so lines to `Support, Checking and Release` | caught | caught |
| X03 | Deleted 30-Second Expert's limit | caught | caught |
| X15 | Softened One-Sentence Summary's limit to «rarely straight after» | caught | caught |
| X18 | Softened Two Truths and a Lie's «only when» to «mostly when» | caught | caught |
| X05 | Deleted Explain One Link's condition (decision 6) | caught | caught |
| X06 | Deleted «do not force different answers» from the worksheet guidance's A21 | caught | caught |
| X07 | Deleted the science pointer's two conditions (F05) | caught | caught |
| X09 | Deleted «and the answer is off the board» from the designer's recall check (B06) | caught | caught |
| X19 | Softened the designer's C03 condition to «when it suits» | caught | caught |
| X11 | Deleted K22's «and that is a decision made for that task and said out loud» | caught | caught |
| X12 | Deleted the reviewer's «Do not make every answer different or strip useful support...» (A22) | caught | caught |
| X16 | Softened the contrasts' «is not the lesson's evidence» to «rarely» | caught | caught |
| X17 | Softened the reviewer's «A restatement is never preserved as a check» to «rarely» | caught | caught |
| X42 | Took «in every route (...)» out of the reviewer's pointer to the view | caught | caught |
| X43 | Put the designer's A07 back to its 4.2.285 words | caught | caught |
| X22 | Moved the catalogue's two intro paragraphs (C04, C05) to the end of the file | caught | caught |
| X24 | Moved the history contrast's simpler-task paragraph into the geography contrast | caught | caught |
| X29 | Put «when the design says so» back inside Label the Diagram's entry | caught | caught |
| X26 | Put the exact «It is fine there, named as a check» into `subject-geography.md` | caught | caught |
| X30 | Put the exact «adequate as a brief orientation» into `preferences.md` › Starters | caught | caught |
| X32 | Put the fixture's retired P08 wording into the reviewer's file | caught | caught |
| X35 | Put the ruling's date back, in `do-beats.md` | caught | caught |
| X36 | Code: put back the 4.2.285 view whole | caught | caught |
| X40 | Code: stopped counting the takeaway | not caught | caught (the new view test) |
| X41 | Code: stopped the view reading an enabling input's own instruction | not caught | caught (the new view test) |
| X37 | Code: stopped the view reading evidence-classification answers | not caught | **not caught** |
| X38 | Code: took Talk and Stimulus-talk out of the pupil beats | not caught | **not caught** |
| X39 | Code: took Practise and Do the task out of the pupil beats | not caught | **not caught** |
| X46 | Deleted the new view test's sort-answer assertion, keeping the file | not caught | **not caught** |
| X20 | Softened the map contrast's stronger task, «A new, unlabelled map», to «The same labelled map» | not caught | **not caught** |
| X44 | Deleted the skill route's «give the Your Turn a *different* criteria pair» sentence | not caught | **not caught** |
| X23 | Moved the whole of 10.2 Explain One Link, heading and all, into §5 | not caught | **not caught** |
| X27 | Put «fine when named as a check» (a shorter variant) into `subject-science.md` | not caught | **not caught** |
| X28 | Put «a fair two-minute orientation» (a shorter variant) into a new paragraph in `subject-history.md` | not caught | **not caught** |
| X29b | Put «and the design says so» into a new paragraph of `do-beats.md`, outside any pinned entry | not caught | **not caught** |
| X31 | Put the exact «It is fine there, named as a check» into the review packet's always-read note | not caught | **not caught** |
| X33 | Added a paragraph to the reviewer: a check the design calls a check may be answered from the board | not caught | **not caught** |
| X34 | Added a line to the catalogue's §1: an explanation said back with the board covered checks the idea | not caught | **not caught** |
| X45 | Added a paragraph elsewhere in `preferences.md`: an idea's check may be the Teach's sentence said back | not caught | **not caught** |

**Gap 1: the view's reach, and the rules beside the pins, are held by nothing** (X37, X38, X39, X46, X20, X44).
- The new view test covers a sort, the takeaway, the skill turns, a Use the learning and an enabling input's heading. It does not cover evidence classifications, dialogic beats, Practise or Do the task, and one of its own assertions can be deleted without anything noticing.
- Two unpinned sentences this topic leans on can go:
  - the map contrast's «A new, unlabelled map», the only place the contrasts file says the map for a map check is new (1e depends on it);
  - the skill route's concrete form of J02 («give the Your Turn a *different* criteria pair»).

**Gap 2: a retired phrase is barred only as its exact words, and only in instruction files and its own file** (X27, X28, X29b, X31). «named as a check» alone, «a fair two-minute orientation» alone and «the design says so» in a new paragraph all pass, and the exact retired «It is fine there, named as a check» passes when put into the review packet's code, which is not the file it left.

**Gap 3: exactness stops at the one home** (X33, X34, X45). A new paragraph anywhere else that says the opposite of the rule passes: a reviewer paragraph saying a check the design calls a check may be answered from the board; a line in the catalogue's §1 saying an explanation said back with the board covered checks the idea; a paragraph elsewhere in `preferences.md` saying an idea's check may be the Teach's sentence said back. These are the excuse in new words, which no phrase pin can catch.

**Gap 4: a catalogue entry moves with its heading** (X23). Moving the whole of 10.2 into §5 passes, because each pin names its entry's own heading. Low harm: the entry keeps its words and its name.

---

## 7. Plain honesty checks

- **True:** the two size figures (instruction files +5,668 bytes; the review packet +3,923); the recall and honest-say-so lines "beside" the rule; the takeaway "including a sticky fact"; "The reviewer's sample cases no longer teach the excuse"; the two stories copied into the log in close to their old words.
- **Not quite true:**
  - «Nine rows of the Teach then Do ledger that this change touched are recorded in its pins with the decision that changed them.» Eight carry the decision. Five more rows' pins changed with no record (section 6).
  - «every permission for a short recall keeps its words and points home». Each also gained a condition, and B06 was on decision 1's word-for-word list (section 3).
  - «It now shows the first beat where children use the teaching in every route». Not for dialogic beyond the first Talk after a grounding input, nor for a Do the task after an instructed input (4b).
  - «A story kept here as it leaves nothing behind». The walk story did leave. The Sophie story is still told in `preferences.md` (S13, another topic's row, rightly left), so it was copied, not retired.
  - The mapping's «carried word for word» for A21 (1f).
- **Not said at all:**
  - the new different-apprentice permission (1d)
  - that 5.6 took only part of True or False's limit (1b)
  - a "not done yet" line: behaviour is untried on a real run, and the out-of-date items in section 5 are left
- **Dashes.** No added word anywhere in the change uses an em dash or an en dash: I checked every added word in the diff, the build-log entry and the three new test files. The dashes in `quick_checks_ledger_pins.json` are inside quotations of text that was already there.

---

## What I would fix before release

1. **The decision-4 pointers (1a).** Make each say "recall of a fact, name or definition with the answer off the board", or point without paraphrasing. The reviewer's C08 matters most, because it sits one bullet above D08.
2. **Two Truths and a Lie (1b).** Carry «and the reason is written», which the decision said it takes.
3. **Put to Daniel, because each changes what he agreed as written:**
   - **B01 (1d):** drop the different-apprentice sentence, or say what makes that sort need the deal.
   - **B02 (1e):** a map the lesson did not show, and "check" rather than "recall".
   - **The five Best-for lines and 4.1's opening (1c):** rewrite them so they no longer recommend the moment the limit forbids.
4. **The view's self-pair count (4a):** leave the beat's own answer out when a beat is paired with itself. **The Our Turn's question (4b):** read `content.example`.
5. **The home's A21 sentence (1f):** put back «do not force different answers». **"The one thing" (1g):** scope it to straight after teaching.
6. **The pins and tests (section 6):**
   - Gap 1: tests for the view's other shapes (an evidence classification, a dialogic Talk, a Practise, and the count on a self-paired input once 4a is fixed); pin the map contrast's stronger task and the skill route's different-criteria sentence.
   - Gap 2: a retired-phrase check over the scripts folder would close X31. The short variants (X27 to X29b) need the retired phrases pinned in their shortest harmful form ("named as a check", "two-minute orientation"), with care not to bar honest uses.
   - Gap 3 cannot be closed by any phrase pin; it is what the reviewer and the next check are for.
   - Gap 4 is low harm and can wait.
7. **Small items:**
   - the two catalogue label formats' world-map limit (1h)
   - 10.6's copied-picture clause and example (1i)
   - the three unconditional "words to diagram and back" lists (section 5)
   - the log's "nine", its "keeps its words", its "every route" and its missing "not done yet" line
   - the mapping's "word for word" for A21
