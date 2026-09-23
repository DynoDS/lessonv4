# Independent check: the assumed-knowledge change (4.2.287, uncommitted, on top of 4.2.286)

What I did: read the brief, the ledger's decisions (both rounds) and the proposals he agreed, every changed row of the ledger, the change plan, the mapping, the change scripts' texts and the previous check; diffed all 17 changed tracked files against HEAD word by word, and read the new pin file, the new test files and the ten moved rows of the earlier topics' pins; checked by script that every one of the 255 "unchanged" rows still has each of its ledger quotes in its file, had it in HEAD, and pins it; searched the whole plugin (instructions, programs, tests, fixtures, evals) for the retired wordings and for text the new wording now contradicts; ran the Python suite (2,156 passed, 1 skipped); ran HEAD's and the new review-page code over all 90 saved `lesson-design.json` files in the repository (29 of them under `working` and `output\working`) and compared the names lists and the whole views; and ran 76 break-the-rule experiments on scratch copies of the whole plugin (everything but `node_modules`, with the four ledgers beside it; the four pin tests pass on the untouched copy, and the whole suite fails there only in `test_helper_coverage.py`, twice, because it looks for the real checkout). I changed nothing in the repository except writing this file.

Findings are ordered most serious first inside each heading. Anything checked and found sound is listed in one line at the end of its heading.

---

## 1. Row by row (the 23 rows this change made; the five the Teach then Do topic changed are its own)

**1a. K01 and the new name paragraph: "not a card" now reaches ordinary words, against the vocabulary rule the reviewer is sent to every review.**
- The reviewer (new): «The list cannot see an ordinary word a sentence leans on (`government`, `order`, `steam engine`): read the teaching for those by `preferences.md` → Vocabulary, `A word the teaching leans on is taught`, which you read every review. For both, the repair is in how the teaching is worded, not a card»
- The rule it sends the reviewer to (vocabulary topic, unchanged and pinned): «Three repairs, in order of preference: say it in words the class already has (...); teach the word in that beat, in its own landed sentence, because it is worth having; or give it a card.» The same section: «**A word that needs real teaching gets a Teach beat as well as its card.**» History gives `parliament` and `monarchy` cards: «where the lesson needs one, it gets its card just before it is needed like any other word».
- The name paragraph (new, `preferences.md`): «so is a thing the class has never met (an order, a steam engine). The repair is in how the teaching is worded, not a vocabulary card.»
- His words were about names and things "just thrown on the board with no previous context" (Elizabeth I, the order, the steam engine), and the settled read-back is "the fix is in how the teaching is worded, not a vocabulary card" for those. "For both" carries it onto every ordinary word the teaching leans on, which the finished vocabulary topic answers with a card as its third repair.
- Example: a Year 4 history lesson on the Factory Acts that leans on `parliament`. The history file says it earns a card; the reviewer, in one every-review reading, is told the repair is not a card.
- The name paragraph's "a thing the class has never met" has the same reach in the designer's reading: the thing a lesson exists to teach (evaporation, a stomach) is also a thing the class has never met.

**1b. F01 (decision 3): the reminder for facts and ideas is scoped to a plan's earlier lessons.**
- Decision 3 as agreed: "Anything today's teaching leans on that an earlier lesson taught gets a short reminder where it first appears today (`Lord Shaftesbury, who we met last week, ...`), never a reteach".
- F01 (new): «A plan's lessons before this one are rough context: take them as taught by the time this one is, and give anything today's teaching leans on from one of them a short reminder where it first appears today (`Lord Shaftesbury, who we met last week, ...`), never a reteach.»
- "From one of them" is the plan's lessons. A fact or idea from the lesson handed over as `PREVIOUS_LESSON_DIR` without a plan, or from prior teaching the brief names, has no reminder rule anywhere. Names are covered in every case (the name paragraph, history, the reviewer), so the gap is facts and ideas.
- The general knowledge check sends its reminder here («in a named earlier lesson (with its short reminder today, `lesson-designer.md` → Prior knowledge)»), so it inherits the narrowing.
- The change plan scoped it the same way ("anything today leans on from them gets decision 3's reminder"), so this came in at the plan, not at the typing.

**1c. D12 and D06 (decision 7): "or in the script" is gone, and the sentence it sat in still defers to the script.**
- D12 old: «is said once, at the picture's first appearance or in the script, not reprinted beneath each return.»
- D12 new: «is said once, in the class's words, at the picture's first appearance (`as it might have looked`, not `reconstructed`), not reprinted beneath each return; `reconstruction`, `modern summary` and an organisation's name stay off the board unless the lesson teaches them, and the exact provenance goes in the teacher's note.»
- The same sentence still opens: «So: no caption on a Teach slide whose lines or script already say what the picture is».
- A picture an artist drew, first shown on a Teach slide whose script says so, now has two answers: no caption (first clause) and an honest caption at its first appearance (third clause). Before, "or in the script" made both true.
- My judgement on the consequence the brief asks about: dropping "or in the script" follows decision 1 and the settled read-back of decision 7, which is silent on the script. But the proposal he agreed said "said once, in the class's words, at its first appearance or in the script", so it needs his word. Whichever way he goes, the first clause has to match ("whose lines already say" if the board must carry it).
- History's D06 has the same drop («introduced as that at the first one, in the class's words»). There the rest fits a board reading: «a Teach script's `Caption the picture ...` note is for its first appearance».

**1d. A11 (decision 9): the reviewer's pointer does not name the two limits the decision said it would.**
- Decision 9: "the designer and the reviewer each keep one pointer that names both limits (new evidence is allowed, a new explanatory mechanism is not)". The change plan: "one pointer naming both limits".
- New: «the relationship the adult would have to supply is the finding, judged by `preferences.md` → What a Lesson Is For, `Work from what children can use at that point`, and its limits.»
- Old: «New evidence with the same taught reasoning is legitimate; a new reasoning demand needs preparation.» «Reaching the same conclusion is also legitimate when children examine each case to earn it.» «Do not make every answer different or strip useful support to manufacture independence.»
- The first went into the paragraph the pointer names. The last two went into a new sibling paragraph, «**The work claims no more than the evidence, and keeps its support.**», which the pointer does not name. "Its limits" reads as the two in the named paragraph.
- Nothing is out of reach: the reviewer reads the whole section every review, and its own section 3 (A07) still names both limits. But the pointer is not what was agreed. The moved quick-checks pin QC-A22 says it «moved ... to the one home of `Work from what children can use at that point`»; it is in the sibling paragraph.

**1e. A31 (decision 9): "seen each one worked" carried without its condition.**
- A31 (skill route, unchanged): «When the Your Turn will mix those cases, the child needs to have *seen each one worked* before meeting it alone»
- The home: «Each distinct case a child meets alone is one they have seen worked, because a case modelled nowhere but met in independent practice is met cold (`teaching-sequence-skill-based.md` says where the extra case goes).»
- It now reads in every subject, stronger than the designer's A21 («needs prior modelling or guidance»). In an idea lesson "distinct case" can be read as any new instance, which the same section wants unseen (the Practise as «the same question over evidence children have not seen», and `A quick check is a fresh case`). Low: "distinct" carries it, and the pointer names the skill route.

**1f. A05 (decision 1): the new reason says more than is true.**
- New: «work an answer using only the knowledge, sources and references children have seen on the board or the page, because the script only says the board»
- Two sentences on, the same bullet keeps «Read teacher scripts alongside prompts and support: hiding a reminder does not preserve a diagnostic decision if the script supplies it», and the skill route keeps the Our Turn's guiding questions with the script as «their only home». The script does more than say the board; what decision 1 says is that it never teaches what the board lacks. Low: the instruction is right, the "because" is not.

**1g. The mapping calls D01's move "word for word".** Besides the agreed "period" to "topic", «the people or experience being studied» became «what the lesson studies». The meaning is kept. Honesty only.

Checked and sound: A01 and A03 (every other extra is in the home at its strength: after a freshness repair, a new reasoning demand with maths's four kinds and its "problem solving" label limit, an invented wage and "often unverified", trick wording and avoidable reading, what the task, model answer and acceptance may claim, the same conclusion earned, no stripping support, a Practise brought forward and beats kept only because written); A08, A09, A15, A16, A31, A32 and A35 still whole in place; A13 (his words, below); A14 (story in the log since 4.2.286, the breathing case kept plain); A49 (C04's two directions, the old panel line gone); C01 (reminder, clause kept, its vocabulary pin moved with it); D04; D05 (off the board unless taught, provenance in `teacherInfo`, "only when it matters"); D08 (copied to the log first, the case kept without its date); E01 (the check whole in the home; history keeps its reason, the Egyptian example, its enquiry and the hook); F34 (as proposed); G02 (date out under the standing ruling; the words are at log L1233); G06 (moved whole; only "of that same test" and the dashes changed; the pointer names the four shapes, and `Simple must still be intelligible` keeps «Read a prompt with its answer covered»); G30 («One sentence, on the board.»); I01 (I03's flat «Do not assume», "unnecessarily" kept on disclosure only, personal reflection kept); K01 apart from 1a; K02 (section 4); the 255 unchanged rows, every ledger quote present now, present in HEAD and pinned.

---

## 2. Each decision against what he agreed

**2a. Decision 8 does not reach the reviewer's compatibility route.** When the packet is unavailable the reviewer is told: «always read `preferences.md` → Pride Lessons (Quality Anchor), What a Lesson Is For and The Teach → Do → Teach → Do Rhythm, `teacher-voice.md` → Final pre-flight check, and `task-contrasts.md` → The contrasts;» and «use the same conditional preference triggers». Vocabulary is on neither list now: it left the conditional triggers and is not in this always list. On that route the reviewer never reads the rule K01 says it reads «every review». When the rhythm became an every-review read (4.2.285) this list was updated; this time it was not.

- **Decision 1: faithful in the home.** A13 is his words: «The board and the notes are never one thing», the board «holds the teaching, the activities, the helpers and the pictures to point to», the notes are «the script for teaching that slide, a guide for a cover, tired or new teacher», «most of the time does not read them», «nothing is taught by the board and the notes together». «Notes ... may say the same thing more fully» and «reform or split the teaching moment» kept. A05, A49 and G30 done; A51 and A52 unchanged and tested. Consequences: 1c, 1f, and the collateral in section 5.
- **Decision 2: faithful.** `plan-tracker.py` is untouched ("has already covered" stays and is pinned); the proof rule is not adopted. The correction note ("the no-calendar case is noted for the before-and-after reruns") is carried into no plan, log entry or streamline row.
- **Decision 3: names done in all three places, F34 done, a method step at this size named and left** (F01 adds it; F13 and F14 unchanged). Facts and ideas narrowed to a plan's lessons (1b).
- **Decision 4 with decision 8's words: the paragraph matches.** His Elizabeth I scene-setting and steam engine, "a board with several is too much to take in", every subject, the random-slide test (which is in `Orientation is not automatically a Teach chunk`), beside B04 in the part of Slide Philosophy the designer reads. B04, B40 and C02 untouched. Its "not a vocabulary card" reach is 1a.
- **Decision 5: faithful.** History keeps its opening and the 1590 order; the pinning test followed; the designer's pointer names the new home.
- **Decision 6: as proposed.** The six moves that ask first are all there; history keeps the hook, the Egyptian example and its enquiry; the Vikings are untouched. Two notes on the proposal's own words, low: "stays short" now also bounds a whole Discovery route's investigation, which its route calls "bounded", not short; and "fresh evidence" in the exception is the ask-first kind, while a main task on new evidence read with taught reasoning passes the check without the exception. The words allow reading the second as the first.
- **Decision 7: faithful to the read-back** ("not always needed" is in history). The script half is 1c.
- **Decision 8: the code as suggested** (section 4), K01 as agreed apart from 1a, and 2a. Reading the whole 15 KB Vocabulary section every review, the consequence the brief asks me to judge: sound. The reading command selects by heading and the rule is a bold lead-in in the middle of the section, so the alternative was giving it its own heading, which moves vocabulary pins; the note keeps the old trigger for the rest of the section. The cost is real: the always-read command now runs to four pages.
- **Decision 9: every extra carried;** the reviewer's pointer is 1d and A31's condition is 1e.
- **Decision 10: faithful.**
- **Decision 11: faithful.** PSHE, RE and the dialogic route untouched.
- **Added that no decision asked for:** "For both ... not a card" (1a); the "because" in A05 (1f); the new paragraph name `The work claims no more than the evidence, and keeps its support` (sound, but see 1d); the reviewer's Source and Scenario Integrity trigger widened to «a named source, story or clip that may cost more explaining than it teaches, and any beat that invites children's own experience» (sound: without it the reviewer could not reach decisions 5 and 11); `Turn` and twelve opening verbs added to the code's word lists (sound).
- **Asked for and missing:** the reminder beyond a plan (1b), a pointer that names both limits (1d), and the compatibility route's read (2a).

---

## 3. What must not have moved

All still where they were, word for word, and each deletion was caught (section 6): a script that gives an answer away still counts, in the designer's completion pass (A51) and in `Support, Checking and Release` (A52); the Our Turn's guiding questions with the script as their only home (A50); history's 1590 order, the Egyptian artefacts and the speculation hook with its four or five minutes; the plan brief's «has already covered, in order:» in `plan-tracker.py`; a method step already done at this size, named and left (F13, F14, and now F01).

---

## 4. The code

**4a. The test for "said earlier" cannot catch the part-word regression it was written against.** `test_a_longer_word_does_not_count` puts `Victorian` on the board and asks about `Queen Victoria`. A two-word name is never inside `Victorian`, so putting back the old part-word match (`return name in board_text`) passes the whole suite (experiment D25). A one-word `Victoria` would test it. Putting the script back into "said earlier" exactly as HEAD did is caught (D24b); reading the script as if it were board text is not (D24), because the name is then listed at the script's beat and still says "not said earlier on the board".

**4b. Noise the log does not name, and one title shape that hides a name.** Across all 90 saved designs the new list adds 37 entries and loses none. Beside real names (children in titles such as `Rosie`, `Ethan`, `Ava and Leo`; `Earth` and the tropics on cards; `Romans`, `Tudor England`, `London`), the noise is `Source` four times, `Sources`, `Factory` twice, `Ragged`, `Someone`, `I'd`, `Prove Oliver` twice (the title `Prove Oliver wrong`: an opening verb not on the list glued to the name) and one card's `Personal, Social, Health and Economic` split into three names. And a title with every word capitalised drops a real name unless every word is already known from the board: `Tudor Children At Work` gives nothing. Low: HEAD read no titles at all.

**4c. A name only in a title never becomes "known".** The signal is built from the board and the cards, not the titles, so `Victoria` opening a board sentence is still missed when the only mid-sentence `Victoria` is in a title. Low.

Checked and sound:
- **No name lost** on any of the 90 designs (29 in the brief's two folders: 13 new entries, none lost).
- **"Said earlier" moved the right way:** 33 names changed their note, 30 from said to not said (the script or a part-word had counted) and 3 the other way (`God`, `Son`, `Jesus`, now said by a title or a card).
- **No new crashes:** the designs that fail (scaffolds and old formats) fail identically in both versions.
- **Nothing else in the view moved:** for all 28 buildable designs in the two folders the whole review view is identical to HEAD's outside `Names on the board`.
- **The reading card:** the always-read command reads `preferences.md` → Vocabulary whole (`REFERENCE_READ_OK: 15398 source bytes`).
- **The suite:** 2,156 passed, 1 skipped.

---

## 5. Collateral, and what elsewhere now disagrees

- **The compatibility route** (2a).
- **`teacher-voice.md` §2** still lists what the notes may hold as «fuller conversational framing; ... additional explanation;», with the example «So, why did the Romans actually want Britain? Well, there were a few reasons...». Beside A13's «nothing is taught by the board and the notes together» and A49's «a reason it adds that a later beat uses goes on the board, and one nothing later uses is a detour to take out», a script writer is told it may add explanation and reasons. "The board's explanation said more fully" would match.
- **`preferences.md` → Lesson Designer content boundaries** keeps «a slide can carry more when the teacher's voice does the heavy lifting» and «whether the longer description belongs in speaker notes instead». Both were there before and the ledger gave them to the Teach board topic; read after the new A13 they are the clearest remaining licence to move teaching into the notes.
- **The designer's Speaker Notes Voice** asks for «concrete explanations of anything unfamiliar» in the script. With decisions 4 and 8 the board explains it in the sentence that brings it in; the script may too, but the line can be read as enough. Low.
- **Captions may carry «a place, time, identity or technical name»** (the playbook's D11 and the slide designer's D20). Decision 7 keeps an untaught label (`reconstruction`) off the board, and "technical name" can be read as leave to print one. Low; the ledger flagged it and no decision changed it.
- **Nothing survives:** no place in instructions, programs, tests, fixtures or evals still says "spoken preparation", "without forcing every spoken reason into a panel", "on the board or in the script", "unless an earlier lesson the brief names", "named as reconstructions", "reasoning from something secure" or "new to the period" (outside the pins and the two tests that bar them); nothing still sends a subject to the history file for the source test; nothing else treats an earlier lesson's name as needing nothing; nothing puts `reconstruction` on the board.

---

## 6. The pins

**Coverage.**
- `assumed_knowledge_ledger_pins.json` holds all 283 ledger ids, none missing, plus five decision rows and the three homes paragraph by paragraph (14, 5 and 12).
- The ten moved rows of the earlier topics' pins are exactly the eight the change reworded (VOC-H07, VOC-L05, VOC-M06, TD-H03, TD-K14, QC-A22, QC-B06, QC-S13) and two contents-line pins (VOC-A03, TD-A12), each with its reason.

**The experiments.** Each edit was made on a scratch copy and undone before the next. Each ran against the four ledger pin tests. Those the pins missed then ran against the whole suite. Every experiment below that the pins caught was caught by `test_assumed_knowledge_ledger_is_kept`, sometimes with another ledger's test too, except S12, which only the other two ledgers' tests caught; the suite column says what the rest met.

| # | What I did | Pins | Whole suite |
|---|---|---|---|
| D01 | Deleted the name paragraph | caught | |
| D02 | Deleted its earlier-lesson reminder sentence | caught | |
| D03 | Deleted the ask-first exceptions from the general knowledge check | caught | |
| D04 | Deleted F01's plan-lessons reminder | caught | |
| D05 | Deleted F01's method step named and left | caught | |
| D06 | Deleted the reviewer's earlier-lesson reminder | caught | |
| D07 | Deleted the reviewer's ordinary-words sentence | caught | |
| D08 | Deleted A51 (script that supplies a decision still counts) | caught | |
| D09 | Deleted A52 (the same, in Support, Checking and Release) | caught | |
| D10 | Deleted A50 (the Our Turn's questions live in the script) | caught | |
| D11 | Deleted history's 1590 example | caught | |
| D12 | Deleted history's Egyptian example | caught | |
| D13 | Deleted history's speculation hook | caught | |
| D14 | Code: the plan brief's "has already covered" reworded | caught | |
| D15 | Deleted the skill route's named-and-left limit (F14) | caught | |
| D16 | Deleted the "claims no more than the evidence" paragraph | caught | |
| D17 | Deleted "each distinct case seen worked" from the home | caught | |
| D18 | Deleted where the experience alternatives are said | caught | |
| D19 | Deleted history's "said only when it matters" | caught | |
| D20 | Deleted Connect It Back's "once it has been brought back" | caught | |
| D28 | Deleted the four shapes from the voice guide | caught | |
| D29 | Deleted the reviewer's pointer to the home (A11) | caught | |
| S01 | Name paragraph: "never a reteach" to "rarely" | caught | |
| S02 | History names: "never a reteach" to "seldom" | caught | |
| S03 | General check: "stays short" to "usually stays short" | caught | |
| S04 | A49: "goes on the board" to "may go on the board" | caught | |
| S05 | G30: "on the board" to "ideally on the board" | caught | |
| S06 | Playbook: "stay off the board" to "usually stay off" | caught | |
| S07 | A13: "nothing is taught" to "little is taught" | caught | |
| S08 | A05: "seen on the board or the page" to "seen or heard" | caught | |
| S09 | K01: "each stays off the board" to "usually stays off" | caught | |
| S10 | Experience: "no beat needs it" to "few beats need it" | caught | |
| S11 | History D05: "stays off the board" to "rarely goes on" | caught | |
| S12 | Contents line: dropped the two new clauses | caught (Teach then Do and vocabulary pins) | |
| S13 | Home: "do not make every answer different" to "try not to" | caught | |
| S14 | Source test: "the longer" to "much longer" | caught | |
| M01 | Moved the knowledge-before-judgement paragraph into the Rhythm | caught | |
| M02 | Moved the name paragraph to `Slide Designer presentation rules` (the part the designer is told not to read) | caught | |
| M03 | Moved the source test into the history file | caught | |
| M04 | Moved the claims paragraph to Support, Checking and Release | caught | |
| M05 | Moved the four shapes to the voice guide's section 12 | caught | |
| M06 | Code: made the Vocabulary note conditional again | caught | |
| M07 | Moved the name paragraph into Written Voice | caught | |
| R03 | "without forcing every spoken reason into a panel" into Slide Philosophy | caught | |
| R04 | "on the board or in the script" into geography | caught | |
| R06 | "named as reconstructions" into the playbook | caught | |
| R07 | "reasoning from something secure" into do-beats 10.10 | caught | |
| R11 | "spoken preparation" into another part of the designer | caught | |
| R12 | Code: the names note says "or an earlier lesson the brief names" | caught | |
| R13 | The history pointer for the source test into science | caught | |
| R14 | "new to the period" back into history | caught | |
| R15 | Connect It Back: "reasoning from something already secure" | caught | |
| R17 | The Sophie story back into another part of `preferences.md` | caught | |
| R18 | "a set of reconstruction pictures" into the playbook | caught | |
| R22 | A13's old "the two are not read together" into the playbook | caught | |
| D21 | Code: Vocabulary taken out of the always-read list | not caught | caught (the new names test and two others) |
| D22 | Code: slide titles no longer read | not caught | caught (the new names test) |
| D23 | Code: vocabulary cards no longer read | not caught | caught (the new names test) |
| D24b | Code: HEAD's behaviour exactly, the script counted as said earlier | not caught | caught (the new names test) |
| D26 | Code: the known-name signal ignored | not caught | caught (the new names test) |
| D24 | Code: the script read as if it were board text | not caught | **not caught** |
| D25 | Code: part-word match for "said earlier" put back | not caught | **not caught** |
| D27 | Code: the old Source and Scenario Integrity trigger put back | not caught | **not caught** |
| D30 | Code: the names note's reminder clause dropped | not caught | **not caught** |
| R01 | "spoken preparation" (the short form) into `preferences.md` | not caught | **not caught** |
| R02 | "spoken preparation" (the short form) into the reviewer | not caught | **not caught** |
| R05 | "unless an earlier lesson the brief names ... covered it" into geography | not caught | **not caught** |
| R08 | Opposite, new words: "A name an earlier lesson taught ... needs nothing on the board today" (reviewer) | not caught | **not caught** |
| R09 | Opposite, new words: "The notes and the board together carry the teaching" (Written Voice) | not caught | **not caught** |
| R10 | Opposite, new words: "Label an artist's drawing `Reconstruction`" (playbook) | not caught | **not caught** |
| R16 | "one sentence in the script says what is being judged", new history paragraph | not caught | **not caught** |
| R19 | "said at the picture's first appearance, or in its script", new playbook paragraph | not caught | **not caught** |
| R20 | Opposite, new words: "A reflection may assume every child celebrates at home with family" (RE) | not caught | **not caught** |
| R21 | Opposite, new words: "A name from an earlier lesson ... appears bare" (history) | not caught | **not caught** |

**Gap 1: the code is held only in part** (D24, D25, D27, D30). The part-word test cannot fail (4a); reading the script as board passes; the reviewer's widened Source and Scenario Integrity trigger, the only way it reaches decisions 5 and 11, is held by nothing; and the names note's own reminder clause («a name an earlier lesson taught still gets a short reminder where it first appears today») can be dropped unseen.

**Gap 2: a retired phrase is barred only in the length it was pinned** (R01, R02, R05, R16, R19). "spoken preparation" alone is barred only in the designer's file; "unless an earlier lesson the brief names" is pinned with "taught it" on the end; "or in the script" said another way passes.

**Gap 3: exactness stops at the homes and the pinned paragraphs** (R08, R09, R10, R20, R21). A new paragraph anywhere else that says the opposite in new words passes. No phrase pin can close that; it is what the reviewer and the next check are for.

What is held, and held well: every deletion, softening and move of a sentence this change wrote or touched, the three homes' order, and every exact retired wording in a new place.

---

## 7. Plain honesty checks

- **True:**
  - both size figures (instruction files +7,376 bytes, "about 7.4 KB"; the review packet +4,405, "about 4.4 KB") and the 15 KB section;
  - "Eight rows of the earlier topics' pins ... (and two whose whole-paragraph pin on the contents list moved)";
  - "Five rows of this ledger were changed by the Teach then Do topic";
  - the reminder, the name paragraph, the source-words sentence and the stories kept, as described;
  - "lost none".
- **Not quite true:**
  - «in shorter forms seven more times»: the ledger's decision 9 counts ten (the designer twice, the reviewer five times, history, the task calibrations and the content route).
  - «holds `Work from what children can use at that point` with every extra its copies carried»: three of the extras (what the task may claim, the same conclusion, a Practise brought forward) sit in a new paragraph with its own name (1d).
  - «found twenty more real names (`Tudor` at a sentence start, `Parliament` on a card ...) ... `Source` and `Factory` on their own are the noise it adds»: on the saved designs `Parliament` is an earlier first appearance (on a card), not a new name, no design gains a new `Tudor` entry, and the noise also includes `Ragged`, `Someone`, `I'd`, `Prove Oliver` and a name split in three (4b).
  - The mapping's "word for word" for D01 (1g) and QC-A22's "the one home of `Work from ...`" (1d).
- **Not said at all:**
  - that "not a card" was carried onto ordinary words (1a);
  - that the reminder for facts reaches only a plan's lessons (1b);
  - a "not done yet" line: the behaviour is untried on a real run, and the no-calendar previous-lesson case from decision 2's correction was to be noted for the reruns.
- **Dashes.** No added prose uses an em dash or an en dash. The one added en dash is a character inside the code's title-splitting pattern, so that a title written with one splits too; it is not prose. The em dash on the Slide Philosophy contents line was already there; the G06 move turned its dashes into brackets.

---

## What I would fix before release

1. **"Not a card" (1a).** In K01, "For names, the repair is in how the teaching is worded"; leave ordinary words to the vocabulary rule's three repairs. In the name paragraph, scope "a thing the class has never met" to the things a lesson meets in passing (the order, the steam engine), or say "not a card alone".
2. **The compatibility route (2a).** Add `Vocabulary` to its always-read list.
3. **The reminder's reach (1b).** F01: anything today leans on from an earlier lesson, whether a plan's, the previous lesson or prior teaching the brief names.
4. **Put to Daniel: the script half of decision 7 (1c).** On the board only, or "or in the script" back as the proposal said. Then make the caption sentence's first clause agree.
5. **The reviewer's pointer (1d).** Name the two limits, and the sibling paragraph beside `Work from what children can use at that point`.
6. **Small wording:**
   - A31's condition in the home (1e): "a case that changes the procedure";
   - A05's "because" (1f): "because the script says the board and never teaches what it lacks".
7. **Tests:**
   - make the part-word test use a one-word name (4a);
   - check where a script-only name is first listed;
   - pin the Source and Scenario Integrity trigger;
   - pin "spoken preparation" everywhere and the shorter "unless an earlier lesson the brief names" (Gap 2).
8. **Log and mapping:**
   - "seven" to ten;
   - say where the three extras went;
   - name the rest of the noise;
   - add a "not done yet" line (untried on a real run, the no-calendar case);
   - the mapping's "word for word" for D01.
9. **Later topics, noted not fixed:** teacher-voice §2's «additional explanation», the content boundaries' «longer description belongs in speaker notes instead», the script voice's «concrete explanations of anything unfamiliar» and the captions' «technical name» (section 5).
