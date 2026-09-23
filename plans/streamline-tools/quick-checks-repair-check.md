# Second check of the repairs (quick checks, 4.2.286, uncommitted, on top of 4.2.285)

What I did: read the brief, the first report (`quick-checks-change-check.md`), the ledger's decisions, the proposals he agreed and the three queued open questions, the five repair scripts (`qc-change/qr1` to `qr5`), `td-change/r2_after_qc_repairs.py`, the mapping scripts, `ledger_pin_checks.py`, the view code and its test, and the 4.2.286 build-log entry. I rebuilt the 4.2.285 state from the snapshot tar (the same files as `stash@{0}`, line endings aside) and diffed every changed instruction file word by word, reading each repaired sentence with its neighbours. I ran the 4.2.285 and the current view over all 54 saved `lesson-design.json` files under `working`, `output/working` and `lesson-resources-output/working`, compared them section by section, and ran eight hand-built route shapes through the new code. I searched the whole plugin, not only the scanned folders, for every retired phrase of both pin files. Pins: 38 attempts on three scratch copies of the whole plugin (everything but `node_modules`): the first report's fourteen misses, 21 new attempts aimed at the repairs, and three honest uses of the newly barred words. The three pin tests pass on the untouched copy (32 passed, 3 skipped for the missing plans folder). The whole suite there fails only in `test_helper_coverage.py`, twice, because it looks for the real checkout; those two are discounted. Suites on the real checkout: Python 2,126 passed, 1 skipped; builder 709 passed, none failed. The scripts are in the session scratchpad. The plugin folder matches my scratch copies byte for byte at the end, and `git status` is as it was at the start: I changed nothing in the repository except writing this file.

---

## 1. Real problems, most serious first

**1.1 The view reaches less than the log and the reviewer are told, and one shape has no test.**
- The log: «It now shows every beat where children use the teaching, in every route, beside everything the class met since the last one: a Do or Practise beside its Teach, a Use the learning beside its Teach why and the result made visible, [...] every Talk beside its own Stimulus and any grounding input, an enabling input's own instruction [...] and the task after it.» The reviewer: «puts the expected answer of each beat where children use the teaching, in every route [...] next to the teaching it follows».
- The code walks back from a pupil beat and stops at the previous one. Four shapes fall outside the claim:
  - **A combined Stimulus-talk is read against itself only.** A grounding input before it is never counted. Hand-built: a Stimulus-talk whose expected response is the grounding input's sentence word for word printed «0 of 6». This one misses decision 9 in its own terms, since the grounding input is the teaching it follows. Nothing tests a Stimulus-talk: removing its self-pairing drops it from the view and the whole suite passes (N12).
  - **The second finding of one exploration** (the Teach then Do decision 4 shape: explore, make sense of both, teach why 1, use 1, teach why 2, use 2). Use 2 is read against Teach why 2 alone. An answer copied from the Make sense board («Higher torch, shorter shadow.») printed «0 of 4».
  - **A Practise after a Do or a Your Turn is never shown**, whatever its answer. That is 38 of the 39 Practise beats in the saved designs. Decision 9 asked for "the first pupil beat after teaching", which the code does; "every beat where children use the teaching" says more.
  - **A task lesson's plan-checkpoint** (a pupil beat with its own instruction) is neither shown nor treated as a stop. On `year-4-pshe-our-pshe-rules`, `Your suggestion` is missing and the task is printed as «Build our agreement (after `Learning safely`)», paired back across it.
- No saved design is dialogic or discovery, so the first two have not bitten yet.

**1.2 The pins, attacked again: the repairs closed what they aimed at, and seven attempts outside the log's stated limit still pass.**

| # | What I did | Pin test | Whole suite |
|---|---|---|---|
| X37 | Code: stopped the view reading evidence-classification answers | not caught | caught (the new view test) |
| X38 | Code: took Talk and Stimulus-talk out of the pupil beats | not caught | caught (view test) |
| X39 | Code: took Practise and Do the task out of the pupil beats | not caught | caught (view test) |
| X46 | Deleted the view test's sort-answer assertion, keeping the file | not caught | not caught (stated limit) |
| X20 | Map contrast's «A new, unlabelled map» to «The same labelled map» | caught (QC-KEEP-01) | |
| X44 | Deleted the skill route's «give the Your Turn a *different* criteria pair» sentence | caught (QC-KEEP-01) | |
| X23 | Moved the whole of 10.2 Explain One Link, heading and all, into §5 | not caught | not caught (stated limit) |
| X27 | «fine when named as a check» in a new paragraph of `subject-science.md` | caught | |
| X28 | «a fair two-minute orientation» in a new paragraph of `subject-history.md` | caught | |
| X29b | «and the design says so» in a new paragraph of `do-beats.md` | caught | |
| X31 | The exact «It is fine there, named as a check» in the packet's always-read note | caught (programs now scanned) | |
| X33 | New reviewer paragraph: a check the design calls a check may be answered from the board | not caught | not caught (stated limit) |
| X34 | New line in the catalogue's §1: an explanation said back with the board covered checks the idea | not caught | not caught (stated limit) |
| X45 | New paragraph elsewhere in `preferences.md`: an idea's check may be the Teach's sentence said back | not caught | not caught (stated limit) |
| N01 | Reviewer's C08 pointer: «an idea needs a fresh case» to «an idea usually needs a fresh case» | caught | |
| N02 | Catalogue's C04 pointer loses its idea half | caught | |
| N03 | Home: «; do not force different answers» deleted again | caught (home) | |
| N04 | Home: «the one thing recalled rather than applied» put back | caught (home) | |
| N05 | Two Truths and a Lie: «, and the reason is written» deleted | caught | |
| N06 | Diagram to Words: the old water-cycle example put back | caught | |
| N17 | C05: «the cards are cases the Teach did not show» taken out of its pointer | caught | |
| N20 | Designer's B06: its pointer dropped | caught | |
| N21 | «named as a check» in the make-lesson `SKILL.md` | caught | |
| N13 | Code: an enabling input counted against its own answer again | not caught | caught (view test) |
| N14 | Code: an Our Turn's question left blank again | not caught | caught (view test) |
| N15 | Code: a Your Turn no longer read against the Our Turn | not caught | caught (view test) |
| N16 | Code: a Use the learning no longer read against the Make sense result | not caught | caught (view test) |
| N07 | The removed different-apprentice sentence back, word for word, as its own paragraph under the history contrast | not caught | **not caught** |
| N08 | «the design says so» in a new reviewer paragraph | not caught | **not caught** |
| N09 | «fine there, named as a quick check» in `task-contrasts.md` | not caught | **not caught** |
| N10 | The excuse in the packet's always-read note, split across two joined string literals («named as a " "check») | not caught | **not caught** |
| N11 | The exact retired sentence as a comment in `builder/scripts/check-slide-design.js` | not caught | **not caught** (Python suite; builder programs are not scanned) |
| N12 | Code: a Stimulus-talk no longer paired with itself, so it leaves the view | not caught | **not caught** (1.1) |
| N18 | «named as *a check*» (emphasis inside the words) in `task-contrasts.md` | not caught | **not caught** |
| N19 | The orientation permission back in new words in the reviewer («a fine warm-up») | not caught | not caught (stated limit) |
| H01 | Honest: «A source named as one of several accounts is read beside the others» in history | **refused** | |
| H02 | Honest: «A two-minute orientation to the apparatus needs no Do of its own» in science | **refused** | |
| H03 | Honest: a code comment in the packet recording that 4.2.286 retired «named as a check» | **refused** | |

15 caught by the pin test, 7 caught only by the new view test, 13 caught by nothing, 3 honest uses refused.

What the results mean:
- **The repairs did what they said.** Nine of the first report's fourteen misses are now caught: the view's shapes (X37 to X39), the two sentences pinned whole (X20, X44) and the short forms and the program scan (X27 to X31). The other five are the three kinds the log names as left to review. Every repaired sentence I put back or softened was caught (N01 to N06, N17, N20), and so was every code repair's reversal (N13 to N16).
- **Outside the stated limit.** The log says what no pin catches is «a new paragraph saying the opposite in new words, a deleted test assertion, and a catalogue entry moved whole with its heading». These pass as well:
  - N07 is the removed sentence in its own old words, not new words. Nothing bars it, and it is the one sentence the first check found added without a decision.
  - N08: «the design says so» is barred only in `task-contrasts.md` and `do-beats.md` (its pins are not "everywhere", because the vocabulary rule in `preferences.md` uses the same words honestly). The log's «"the design says so" outside its one honest use» reads as everywhere but one place.
  - N09 and N18: each bar is a literal string, so one inserted word or a pair of asterisks passes.
  - N10 and N11: «looked for in the plugin's programs» means the top-level `scripts/*.py` files, read as plain text. A phrase built from two joined literals reaches the reviewer whole and passes. `builder/`, the three HTML engines and `scripts/*.js` are not read.
- **The bars now refuse honest uses (H01 to H03).** «named as one» is twelve characters and barred in every instruction file and program, so ordinary English such as «named as one of» fails. So does a code comment that records what was retired, which is this codebase's habit («Until 4.2.286 this read only...»). Nothing honest fails today, and a reword is cheap. It is still a cost the log does not mention.

**1.3 The size figures are the pre-repair ones, in the log and in the plan.**
- The log: «The instruction files are about 5.7 KB larger, and the review packet's code about 3.9 KB». The streamline plan's topic 4 row says the same.
- Measured against 4.2.285 now: the seven instruction files are +6,116 bytes, and the packet is +5,612 bytes. Reversing `qr1`'s text swaps gives exactly the first report's +5,668. So the repairs added 448 bytes of instructions and about 1.7 KB of view code, and neither figure was updated.

**1.4 Earlier findings neither repaired nor named.** The log's account of the first check («It found: ...») lists what was repaired and reads as the whole list. These were found, not repaired and not named anywhere in the entry:
- **Decision 10's second half (1k).** He agreed "the other real-deck cases ... follow the standing rule: the reason stays, the incident goes to the log". Two still keep their incidents: the reviewer's «and a reviewer approved both» and the home's «and the teacher who wrote the lesson could not tell the groups apart».
- **10.6's copied-picture clause (1i), partly repaired.** The example is now the proposal's own («what is this drawing of a puddle drying telling us?»). The kept «and as the check that a picture children copied actually means something to them» still names what the next sentence calls a restatement. It is the same kind of kept "Best for" wording as the third queued question.
- **The designer's list (section 5).** Two of the three lists now carry decision 6's condition. The designer's «words to diagram and back» does not.
- **E03 (1j).** The home still reads the thinking line «against what the class knew walking in» and gives only the board's verdict.
- **Low:** a sort item's `detail` is still neither printed nor counted (no saved sort uses it), and `stick-in-sheets-pedagogy.md` still calls the blank world map «a genuine retrieval task».

**1.5 One new pull from a repair (low).** Two Truths and a Lie now ends its limit with «and the reason is written», which is decision 5's word. Two lines below, its unchanged SEND line says «familiar party-game framing lowers anxiety; concrete decision, not open prose». True or False's own SEND line fits a written reason («the binary T/F is the entry; the justification is the stretch»); this one now pulls the other way.

**1.6 Small log and record points (very low).**
- «five of the eight summary formats still name straight after the Teach»: the ledger's queued question also names Quick Sketch's opening («Pupils draw what was just described»).
- «every permission for a short recall [...] gains a pointer that carries both halves of the recall line»: C05's pointer carries «the cards are cases the Teach did not show» instead. That is the right condition for a sort, but not what the sentence says.
- On three saved skill designs of a shape the validator now refuses (several My and Our Turns sharing one Your Turn), the Your Turn is listed after every earlier beat of the lesson (up to eight), because the walk passes every Our Turn and not only its own cycle's. The count moves by at most two words. In any shape the validator allows, the walk stops at its own cycle.

---

## 2. The earlier findings, one by one

| Finding | Status | Current words |
|---|---|---|
| 1a pointers carried only the permitting half (C01 to C04, C08) | **Repaired** | each now ends «(`A quick check is a fresh case, not the last slide again`: a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case)»; `cover the board: why does a shadow form?` no longer passes them |
| 1b Two Truths and a Lie took half the limit | **Repaired**; one new pull (1.5) | «...never the slide's own sentence twisted, and the reason is written. Prefer a sort, a match or an odd one out when those force the same decision.» |
| 1c five Best-for lines and 4.1's opening | **Left for Daniel** (queued question 3); honest | unchanged |
| 1d the different-apprentice permission | **Repaired**; not barred (N07); the heading now names no simpler task (queued question 2) | «**Where the simpler task is right.** The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks.» |
| 1e B02 «an honest recall beat» | **Left for Daniel** (queued question 1); honest | «...a quick label-reading check after a new map skill is an honest recall beat.» |
| 1f A21's must-not | **Repaired**, and the mapping no longer says "word for word" | «The same conclusion can be valid in two cases when each requires that work; do not force different answers.»; mapping «lightly reworded (for a procedure, enough, carrying out) with its must-not kept» |
| 1g «the one thing» | **Repaired**, to the proposal's words | «A fact, a name or a definition may be recalled straight after teaching once the answer is no longer on show...» |
| 1h label formats lacked the world-map limit | **Repaired** | 3.5 «...a blank copy of the taught one where no other picture of the thing exists (the world map)...»; 4.2 «...a blank copy of the taught one where no other picture of it exists...» |
| 1i 10.6 clause and example | **Partly**: example repaired, clause kept, not named (1.4) | example «*"In one sentence, what is this drawing of a puddle drying telling us?"*» |
| 1j E03 guessing half | **Not repaired, not named** (1.4) | unchanged |
| 1k two incidents kept (decision 10) | **Not repaired, not named** (1.4) | unchanged |
| 3, B06 gained a condition | **Repaired**: words kept, pointer after them | «A quick recall check is fine when recall is the claim; do not present it as deeper evidence (`preferences.md` → ...: a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case).» |
| 4a self-pair counted against its own answer | **Repaired and tested** | the five PSHE beats now print 6 of 8, 5 of 11, 6 of 9, 13 of 14 and 9 of 11, the first report's own figures; test «already said: 1 of 7» |
| 4b Our Turn question blank | **Repaired and tested** | no blank «- Asked:» in any of the 176 sections |
| 4b Your Turn not against the Our Turn | **Repaired and tested** | «### Your Turn (after `My Turn`, `Our Turn`)» |
| 4b dialogic: Stimulus skipped, later Talks, no grounding input, `teacherListensFor` | **Repaired and tested** for a Talk; **not** for a Stimulus-talk (1.1) | test «### Talk 2 (after `Stimulus 2`)» |
| 4b discovery: Make sense not counted | **Repaired and tested** for the first finding; **not** for the second finding of one exploration (1.1) | test «### Use it (after `What we saw`, `Why`)» |
| 4b task after an instructed input | **Repaired and tested**; a plan-checkpoint between is skipped (1.1) | test «### Our test (after `Fair test`)» |
| 4b two My Turns in a row | **Repaired** | saved `year-4-maths-represent-4-digit-numbers`: «Our Turn (after `My Turn`, `My Turn`)» |
| 4b a sort item's `detail` | **Not repaired, not claimed** (1.4) | |
| 5, three unconditional diagram lists | **Two of three repaired** (1.4) | `preferences.md` «...or a diagram the class has not had explained back into words»; reviewer «...or a diagram the Teach did not explain turned back into words»; designer unchanged |
| 5, stick-in «genuine retrieval task» | **Not repaired, not named** (another topic's file; low) | |
| 5, out-of-date catalogue text | **Named** in «Not done yet» | |
| 6 gap 1 (view shapes; two sentences) | **Repaired** | X20, X37 to X39, X44 caught |
| 6 gap 2 (short forms; programs) | **Repaired for the forms tried**; narrower than the log says (1.2) | X27 to X31 caught; N08 to N11, N18 pass |
| 6 gaps 3 and 4 | **Stated as limits**, honestly | X23, X33, X34, X45, N19 pass |
| 7, «Nine rows» | **Repaired** | nine TD pins carry a 4.2.286 decision (E02, E03, E06, F09, F12, L09, Z05, Z07, Z18) and five say their paragraph changed beside them (E04, E05, F13, L07, M04) |
| 7, «keeps its words» | **Repaired**; C05 nit (1.6) | |
| 7, «every route» | **Reworded, still wider than the code** (1.1) | |
| 7, «leaves nothing behind» | **Repaired** | «Stories kept here. [...] it is copied, not retired, because `preferences.md` still tells it» (the Sophie story is at `preferences.md` line 63) |
| 7, no «not done yet» line | **Repaired**, and incomplete (1.4) | «**Not done yet, and named.** Behaviour is untried on a real run. Three questions are the teacher's...» |
| 7, size figures | were true; **now stale** (1.3) | |

**Leaving the three questions for Daniel is honest.** Each changes words he agreed as written:
- Decision 1 said to keep the rest of B02's sentence.
- Decision 2 said to keep what the history contrast also said.
- Decision 5 added a limit and said nothing about the Best-for lines.

They are queued in the ledger under `Open questions from the change`, and the plan's topic 4 row points there, so the next chat will find them. The cost of waiting is plain in the log: until he answers, the reviewer's always-read calibration file keeps a sentence the new home contradicts.

**What else should join them.** By the author's own standard:
- 10.6's kept «a picture children copied» clause belongs beside question 3 (1.4).
- So does 5.6's SEND line (1.5).

Decision 10's two incidents, the designer's list and E03 are not questions: they are agreed or plainly within a decision. They need doing, or naming under «Not done yet».

---

## 3. Did the repairs break anything?

- **The recall pointers against the home.** They agree: the home's line says a fact, name or definition may be recalled «once the answer is no longer on show» and an idea's check «is a fresh case». The pointer says the same in shorter words. The home's third part, «it claims recall, never understanding», stays at home. Next to the pointers, the designer's B06 («do not present it as deeper evidence») and C03 («do not label recall as reasoning») carry it. C01, C02, C04 and C08 do not, which decision 4's "points to that line" allows.
- **The recall pointers against `What a Lesson Is For`.** No clash. «A child answering because they remember what the teacher said a minute ago has shown attention, not learning» agrees with «claims recall, never understanding». Its limit paragraph sends a quick check to a fresh case and points at the same home.
- **C05.** Its condition moved from its own words («on cards the Teach did not show») into the pointer («: the cards are cases the Teach did not show»). The meaning is the same, and it is pinned whole (N17 caught).
- **The two diagram lists.** Only the diagram-to-words half carries the condition. «turn the words into a diagram» already presumes words without a drawing, so it does not clash with 10.5's new «drawing the diagram just shown is copying it».
- **The history contrast.** Taking out the added sentence left «Where the simpler task is right» naming no simpler task. The file's own opening promises each contrast «names the case where the simpler task is exactly right». That is queued question 2, and I would not call it a break.
- **The view on the saved designs.**
  - 52 of the 54 build in both versions. The other two are unfilled scaffolds and fail the same way in both.
  - All 84 sections the 4.2.285 code printed are still there, now among 176, each with the same `Asked` line, the same options and the same beat it follows.
  - Three former «(none written)» answers now show their sort placements. Five answers that used to break across lines are flattened.
  - No count fell: 18 rose, because the takeaway and the result made visible are now counted, and 63 are unchanged.
  - The two new «(none written)» lines belong to two task beats whose designs record no answer (kind `none`), which is honest.
  - The wrong pairings I found are in 1.1 (the plan-checkpoint) and 1.6 (old-shape Your Turns).
- **The "everywhere" check over programs.** Nothing honest fails today: the Python suite is green. No retired phrase of either pin file hides anywhere in the plugin. I searched every `.md`, `.py`, `.js`, `.json`, `.txt` and `.html` file outside `node_modules`: the only hits are test files, which are left out by design, and the vocabulary rule's honest «the design says so». What the bar refuses in future is in 1.2.

---

## 4. Checked and found sound

- **Suites.** Real checkout: Python 2,126 passed, 1 skipped; builder 709 passed, none failed.
- **Dashes.** No new em dash or en dash in any added word of the seven instruction files, the packet, the three new or changed test files, the fixture, the log entry or the ledger's queued questions. Checked two ways: added words in a word diff, and dash contexts absent from 4.2.285.
- **The home.** The home and every repaired pointer, catalogue entry and paragraph are pinned exactly or whole. Each softening or reversal I tried was caught (N01 to N06, N17, N20, N21).
- **The Teach then Do pins.** The nine plus five rows say what the log says, with the decision or the neighbouring edit in each outcome.
- **The mapping.** It follows the repairs: A21's «lightly reworded», B06, C05, D01, the different-apprentice sentence gone, the retired short forms listed, QC-KEEP-01. Its count is now 42 changed rows, with D01 added.
- **Log claims the files bear out:**
  - the ten decisions as described
  - the one home and what sits beside it
  - «the reviewer keeps its own sentences»
  - the second reader's list of what was repaired
  - «On the 52 filled saved designs it builds without error, loses nothing the old section showed, and no longer prints a blank question»
  - «The reviewer's sample cases no longer teach the excuse»
  - the two stories
  - the Zara twin under 4.2.123
- **The packet comment's «Seven short contrasts».** True: the file has seven.

---

## What I would fix before release

1. **The view (1.1).**
   - Read a Stimulus-talk against the grounding input before it, and test a Stimulus-talk.
   - Either count the Make sense result for every Use the learning of the same exploration, or say "the first" in the log.
   - Treat a plan-checkpoint as a pupil beat.
   - In the log and the reviewer's pointer, say "each beat that follows teaching" rather than "every beat where children use the teaching", or show a Practise after a Do.
2. **The size figures (1.3).** Instruction files +6.1 KB and the packet +5.6 KB, in the log and in the streamline plan's topic 4 row.
3. **The pins (1.2).**
   - Bar the different-apprentice sentence as retired, everywhere (N07).
   - Word the log's claims to match the tool. «the design says so» is barred in the contrasts and catalogue files only. «the plugin's programs» means the top-level Python scripts. A bar is a literal string: an inserted word, emphasis or two joined literals pass.
   - Optional: narrow «named as one» to a form ordinary English will not hit (H01).
4. **Name or do (1.4).**
   - Do decision 10's two incidents, or name them.
   - Add 10.6's copied-picture clause, and optionally 5.6's SEND line (1.5), to the queued questions.
   - Condition the designer's «words to diagram and back», or name it.
   - Add E03, sort item detail and the stick-in wording to «Not done yet».
5. **Log nits (1.6).** «five» also has Quick Sketch's opening beside it; C05's pointer carries the fresh-card condition, not the recall line.
