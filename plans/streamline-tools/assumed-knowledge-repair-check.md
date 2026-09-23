# Independent check of the repairs: the assumed-knowledge change (4.2.287, uncommitted, on top of 4.2.286)

What I did: read both briefs, the first check and its fix list, the ledger's decisions with the third and fourth rounds of decision 7, the repair scripts `r1_repairs.py` to `r8_naming_caption.py` (r8, his fourth-round Van Gogh words, ran at 17:51 after the brief was written; I checked the state it left, and nothing in the plugin changed after it), the rebuilt mapping and every pin row the repairs touched in all four pin files; diffed every changed file against HEAD and against the text before the repairs (the old strings in r1, r5 and r8); searched the whole plugin (instructions, examples, programs, tests) for anything that still asks for words about where a picture came from; ran HEAD's, the pre-repair and the current review-page code over all 90 saved `lesson-design.json` files; ran 44 break-the-rule experiments on scratch copies of the whole plugin under `scratch/akrep` (everything but `node_modules`, the four ledgers beside it; the four pin tests pass on the untouched copy, 50 tests, and so does the whole suite, 2,158 passed and 1 skipped); and ran the whole suite on the real plugin (2,158 passed, 1 skipped).

**One slip, reported plainly.** At 18:18 I meant to rebuild the mapping inside my scratch copy; the path change failed and `build_ak_mapping.py` ran against the real repository. It rewrote `scripts/tests/assumed_knowledge_ledger_pins.json` and `plans/2026-09-23-assumed-knowledge-mapping.md`. Both are byte for byte what they were (compared with copies taken minutes before); only their modification times changed, to 18:18:22, and putting the old times back was refused. The useful side result: rebuilding from the current files reproduces the pins and the mapping exactly. Apart from that and this report, I changed nothing in the repository.

---

## A. The first check's fix list, item by item

1. **"Not a card" (1a): done, by the first of the two ways offered (scope), not "not a card alone".**
   - Reviewer, before: «which you read every review. For both, the repair is in how the teaching is worded, not a card: the name or the thing arrives with its context in the sentence that brings it in»
   - Reviewer, now: «which you read every review, and use its three repairs. For a name, or a thing the lesson meets on the way, the repair is in how the teaching is worded, not a card: it arrives with its context in the sentence that brings it in»
   - Name paragraph, before: «so is a thing the class has never met (an order, a steam engine). The repair is in how the teaching is worded, not a vocabulary card.»
   - Name paragraph, now: «so is a thing the lesson meets on the way that the class has never met (an order, a steam engine). For these, the repair is in how the teaching is worded, not a vocabulary card. What the lesson exists to teach is taught, and a word the teaching leans on takes the three repairs in `Vocabulary` → `A word the teaching leans on is taught`.»
   - Sound in intent; the line it draws has the same examples on both sides (finding 4).
2. **The compatibility route (2a): done.** «What a Lesson Is For and The Teach → Do → Teach → Do Rhythm,» became «What a Lesson Is For, The Teach → Do → Teach → Do Rhythm and Vocabulary (for `A word the teaching leans on is taught`),». TD-DEC-06 re-pinned with it.
3. **The reminder's reach (1b): done.** «and give anything today's teaching leans on from one of them a short reminder» became «Anything today's teaching leans on from an earlier lesson, whether one of the plan's, the previous lesson or prior teaching the brief names, gets a short reminder». The general knowledge check's pointer to it now reaches as far.
4. **The script half of decision 7 (1c): done differently, and soundly.** It went to him, and his third and fourth rounds took the honest caption away rather than choosing board or script. Playbook at HEAD: «a caption that must be honest about what a picture is (a reconstruction, a modern photograph of an old place) is said once, at the picture's first appearance or in the script, not reprinted beneath each return». Now: «a picture an artist drew to show how something might have looked, or a photograph of a place today, has no caption saying how it was made (`This is a reconstructed picture of a historical setting`): the picture is just shown, and the teacher can say it if they need to.» The first clause («no caption on a Teach slide whose lines or script already say what the picture is») was left as it was; with no honest caption left to print, it no longer has a second answer. The ruling's own reach is findings 1 to 3 and 5.
5. **The reviewer's pointer (1d): done.** «`Work from what children can use at that point`, and its limits.» became «`Work from what children can use at that point` (new evidence is allowed; a new explanation the lesson never taught is not) and `The work claims no more than the evidence, and keeps its support` beside it.» Decision 9's own words for the limits. QC-A22's outcome now names the right paragraph.
6. **Small wording: both done.**
   - A31's condition in the home: «Each distinct case a child meets alone is one they have seen worked» became «Where a method has distinct cases, each case a child meets alone that changes the procedure is one they have seen worked». Matches the skill route's «distinct cases the child must tell apart and handle differently», and no longer reaches an idea lesson's fresh instances.
   - A05: «because the script only says the board» became «because the script says the board and never teaches what the board lacks», the wording suggested.
7. **Tests: all done, and each now fails when it should** (section E): the part-word test uses `Victoria` beside `Victorian` (D25 caught); a script-only name must be first listed at `Do` (D24, D24b caught); the Source and Scenario Integrity trigger is pinned both halves (D27, D27b caught); "spoken preparation" and "unless an earlier lesson the brief names" are barred everywhere (R01, R02, R05 caught); the names note's reminder clause is pinned (D30 caught).
8. **Log and mapping: done, but four figures went stale after r3 and r8** (finding 7): "seven" is "ten"; the three extras and their paragraph are named; the noise is named; a "Not done yet" paragraph names the untried run, the no-calendar case and the four later-topic lines; the mapping's D01 now says what else changed.
9. **Later topics: done**, listed in the log's "Not done yet".

---

## B. Findings, most serious first

**1. The Teach calibration the slide designer opens first still captions `reconstructed` and says so in the notes.**
- The playbook (line 356): «`references/examples/tudor-teach-slides.lesson.json` is a whole Teach run the user chose ... Open it before composing the first Teach slide of a knowledge lesson, because it is the shape being asked for and prose about it is the lossy version.»
- The example: `"caption": "Tudor England 1485 to 1603, reconstructed"` on slides 1 and 2, `"caption": "A leather workshop, reconstructed"` on slides 3 and 5 (slide 5 is that picture's third appearance); slide 1's notes: «Teacher information: The picture is a modern reconstruction, not a photograph of a real Tudor child; the caption says so.»
- The ruling: «`reconstructed`, `modern summary` and an organisation's name never go under a picture» (playbook) and «carries no words about how it was made ..., on the board or in the notes» (history). The example already broke the older rule too («no caption on a picture the class has already met with one»).
- Not new in this change, but it is now the one place in the plugin that shows the opposite of his ruling, and it is the place the slide designer is told to trust over prose. No test reads its captions: `test_the_board_carries_the_route.py` checks layouts, titles and that notes start «Say to children:». Putting a fifth caption on it (P16) passed everything.
- Example: the slide designer on the next Year 4 history deck with a drawn picture reads both the playbook's rule and the calibration, and is told to trust the calibration; captions are written after the design review, so no later reader catches `..., reconstructed` under the picture.

**2. The history paragraph now gives two answers about the notes.**
- The new sentence: «An artist's drawing of how something might have looked, or a photograph of a place today, carries no words about how it was made (`This is a reconstructed picture of a historical setting`), on the board or in the notes».
- Two sentences before it, kept: «A label in a historian's words (`modern summary`, `modern reconstruction`, an organisation's name as the heading of a card) stays off the board unless the lesson teaches it: ...; the exact provenance goes in `teacherInfo`.»
- The sentence after it, kept from HEAD: «Put production provenance and links in teacher-facing fields unless children need them to evaluate the source.»
- `teacherInfo` is the notes: «Speaker notes have a fixed shape: a **script** first, then a short **teacher-info** line only if needed» (`preferences.md` line 653), and the calibration's notes carry exactly such a line. "Production provenance" of a drawn picture is how it was made.
- His words were «Doesn't need to be in the speaker notes»; the settled reading made that «carries no words ... in the notes». On the board the reading is faithful. In the notes it is a step wider than "doesn't need to be", and that step is what collides with the two kept sentences. Either the picture sentence says the notes need none (not required), or the two provenance sentences say they are for written sources and the run's records, not a drawn picture.

**3. The ban has no room for a lesson whose thinking depends on the picture being a modern drawing, and his last sentence is read one way without a read-back.**
- Playbook: «`reconstructed`, `modern summary` and an organisation's name never go under a picture.» History and the reviewer keep the exception the playbook dropped: «stays off the board unless the lesson teaches it» (history), «each stays off the board unless the lesson teaches it» (reviewer). Three files, two answers for a lesson that teaches the word.
- History keeps «Prepare children for any distinction between advice, depiction and records of actual life that their task depends on», and the playbook keeps «a source's date and maker» as a caption a child needs. A lesson that asks "what does this picture tell us about Tudor farm work?" over a modern drawing depends on children knowing it is a depiction; the new picture sentence has no exception for that case.
- His fourth round ends «But it doesn't always have to be. This is a reconstructed picture of a historical setting.» The ledger settles it as the words that must stay off. It can also be read as his example of a caption that is optional, which fits "doesn't always have to be" and his round-three "Doesn't need to be". The ledger records no read-back of rounds three and four, where decisions 1, 2, 7 and 8 each had one.
- My judgement: faithful for the ordinary lesson (the Tudor deck he objected to), too wide at the edge. Worth one question to him: is it "never", or "not needed, and only when the lesson uses it"?

**4. Names and ordinary words: the line the repair drew has the same examples on both sides.**
- Reviewer: «The list cannot see an ordinary word a sentence leans on (`government`, `order`, `steam engine`): read the teaching for those by ... Vocabulary, ... and use its three repairs.» The third repair is «or give it a card».
- Next sentence: «For a name, or a thing the lesson meets on the way, the repair is in how the teaching is worded, not a card».
- Name paragraph: «so is a thing the lesson meets on the way that the class has never met (an order, a steam engine). For these, ... not a vocabulary card.»
- So `order` and `steam engine`, his own two examples, are listed both as ordinary words (a card allowed) and as things met on the way (no card). His words for them were "it's not like explaining these words through a vocabulary slide".
- The first check's own example is not resolved either. `Parliament` is a named organisation: the names list lists it as a name (the new test `test_a_name_on_a_vocabulary_card_is_listed` puts it on a card and expects it listed, and the log calls it a real name). So "for a name ... not a card" still meets history's «where the lesson needs one, it gets its card just before it is needed».
- The first check's other option fits all three: "not a card alone". A name or a thing met on the way is explained in the sentence that brings it in; a word worth having may also have its card.

**5. "Identify written sources honestly" narrows further than the ruling.**
- HEAD: «Identify sources honestly, in words the class already has». Now: «Identify written sources honestly, in words the class already has».
- The ruling took out two kinds of picture (an artist's drawing, a photograph of a place today). A real picture that is itself a source (an 1897 classroom photograph, a portrait painted in the period, a photograph of an artefact) is neither, and has now lost the history file's honesty rule. What remains for it is the playbook's caption limit («a source's date and maker»), which the lesson designer does not read. Low: history's own sketch still says «This is a classroom from 1897».

**6. The pins after the repairs: what is still held by nothing.** Every repair and every restored phrase the first check listed is now held (section E). Still caught by nothing:
- **A "how it was made" caption rule in new words, anywhere outside the two pinned paragraphs** (P01 playbook, P04 slide designer, P05 history, P09 science, P10 playbook with the first change's "the exact provenance goes in the teacher's note").
- **The retired picture wordings outside their own file.** Three of the new absent pins are local: «`An artist drew this recently, to show what it might have looked like`» is barred only in history (P06 caught there; the same words as a new playbook paragraph, P13, were not), «a caption that must be honest about what a picture is» only in the playbook (P14 into the slide designer), «Say it once: a set of pictures» only in history (P15 into the playbook). The first check's Gap 2, repaired for "spoken preparation", is open again for the picture words.
- **The new `NOT_A_NAME` words.** Taking `Someone`, `I'd`, `I'm`, `I've` and `I'll` back out passes the whole suite (N12). The test's sentences start with them («Someone said so. I'd like to know.»), and a one-word sentence opening is dropped anyway; `Then Someone I know said so. Maybe I'm wrong.` is the case the words were added for. The same shape as the first check's 4a.
- **New words saying the opposite** (N18, a plan-only reminder in the reviewer). Expected: no phrase pin can hold that.

**7. The log and the mapping went stale after r3 and r8.**
- «Across all 90 saved designs it adds 37 entries»: 37 was the count before the repairs. Now 34 (the repairs took out `I'd`, `Someone` and `Prove Oliver` twice, and added `Leo`). «loses only four the old list got wrong» is four words in six entries.
- «Eight rows of the earlier topics' pins whose words this change altered»: nine now. r3 re-pinned TD-DEC-06 for the compatibility route (VOC-H07, VOC-L05, VOC-M06, TD-H03, TD-K14, TD-DEC-06, QC-A22, QC-B06, QC-S13), plus the two contents-line pins.
- «The instruction files are about 7.9 KB larger»: 8,343 bytes with line endings made the same (8.3 KB). The code's «about 4.7 KB» is right (4,745).
- The log's decisions bullet and the mapping's AK-D06 and AK-K01 outcomes say «carries no words about where it came from» and «no words about where it came from»; since r8 the files say «how it was made». The log's «Where a source came from is said once» no longer matches history, which says only «said only when it matters».
- The brief lists r1 to r7; r8 also ran. Worth a line wherever the repairs are listed.

**8. Low.**
- **The widened reminder meets history's causal caution.** «gets a short reminder where it first appears today (...), never a reteach» (designer) now reaches the previous lesson and anything the brief names; history keeps «Causal and interpretive material needs re-explaining rather than only retrieving». The words follow decision 3 as agreed; one clause would join them (a reason leaned on is re-explained in a sentence, which is not a reteach).
- **The names list adds words one at a time.** `Convince Oliver he is wrong.` gives `Convince Oliver`, `Correct Ava's mistake.` gives `Correct Ava`, `Maybe I'm wrong` gives `Maybe I'm`, `I'm Tom and I like maps.` gives `I'm Tom and I`. No real name is lost; the reviewer still sees the name inside the noise.
- **A capitalised title that is a name's first appearance is not listed, but counts as "said earlier".** Title `The Reign Of Queen Victoria` on the Teach, `What did Queen Victoria change?` on the Do: the list says «Queen Victoria: first on the board in `Do`; said earlier on the board.» From the first change, not the repairs.

---

## C. Checked and sound

- **The repairs lose nothing.** Every sentence r1, r5 and r8 replaced was compared with its new form. What went is what his rulings removed: the honest caption for a drawn picture («said once, in the class's words, at the picture's first appearance»), «`An artist drew this recently, ...`», «Say it once: a set of pictures ... introduced as that», and the first change's «the exact provenance goes in the teacher's note» in the playbook and «in `teacherInfo`» in the reviewer, neither of which HEAD had.
- **The picture ruling's keeps are kept:** written sources' honest labels («`This is what the Queen's order said, in simpler words`»); a made-up child labelled as made up; the caption a child needs («a source's date and maker, a place's name, which of two pictures is which»); a caption printed once and not under each return; «the teacher can say it if they need to»; the fourth round's naming caption («may help and is never required (`The Starry Night by Van Gogh`)») in history, the playbook and the reviewer alike. The templates' `A present-day Maya family in Guatemala` beside `The Mayan city of Tikal` is "which picture is which" and fits.
- **Nothing in the build puts picture credits on the board or in the notes.** Licences and credits stay in the run's provenance records (`web_fetch.py`, `finalize-picture-assignment.py`); no renderer prints them.
- **The name paragraph's scope** reads cleanly with "For these" covering both names and things met on the way; the bold lead-in («A name, or a thing the class has never met, arrives with its context») claims only the arrival, which is right for anything.
- **The reminder reaching any earlier lesson** sits beside «A method step the class has already done at this size stays named and left alone» and «When prior teaching of the target is unspecified, assume it is new» without contradicting either; the general knowledge check's pointer inherits the wider reach.
- **The home's "seen worked" condition** matches the skill route; the designer's «needs prior modelling or guidance» and the skill route's My Turn and Our Turn together still agree with it.
- **The reviewer's pointer** names both limits in decision 9's words and the paragraph beside the home; the reviewer still reads the whole section every review.
- **The code over all 90 saved designs:** no crash in any version; against HEAD, 34 entries added and 6 lost, all six noise (`I'm` three times, `I've`, `I'll`, `Someone I`); against the pre-repair code, 10 noise entries gone (`I'd`, `I'm` three times, `I've`, `I'll`, `Someone`, `Someone I`, `Prove Oliver` twice) and one real name gained (`Leo`, from a sentence-case title); `Oliver` still listed where `Prove Oliver` was; the whole review view identical to the pre-repair view outside `Names on the board` for all 79 designs that build; the 11 that do not build fail identically in all three versions.
- **The mapping and pins are what the builder makes from the current files** (by the slip above).
- **The earlier topics' pin outcomes** (QC-A22, QC-B06, TD-H03, TD-DEC-06 and the rest) say what changed and why; exactly 11 rows differ from HEAD across the three files, none added or removed.
- **The full suite:** 2,158 passed, 1 skipped, on the real plugin and on the untouched copy.
- **Dashes:** no em dash or en dash in any prose the repairs wrote. The em dashes in added lines are inside pins that copy the contents list; the one en dash is the code's title-splitting pattern, as before.

---

## D. The ruling on pictures, in one place

The fourth round's wording (r8), judged as part of the repairs' own words: «A caption that names the picture may help and is never required: a famous painting can carry its title and painter (`The Starry Night by Van Gogh`), and two pictures side by side can say which is which» is faithful to «It could use a caption if it's helpful ... But it doesn't always have to be», and is carried the same way in history, the playbook and the reviewer. Moving the ban from «where it came from» to «how it was made» is the right narrowing: a painting's title and painter are where it came from, and they are now allowed. What r8 settles about his last sentence is finding 3.

Faithful for the case he was asked about: a drawn or present-day picture on a Teach slide carries no caption about how it was made, and the teacher can say it. Too narrow nowhere. Too wide in three places: the notes (finding 2), a lesson that teaches the word or whose task depends on the depiction (finding 3), and real pictures that are sources (finding 5). Still asking for words about where a picture came from: the Teach calibration (finding 1), the two kept provenance sentences in history (finding 2), and, by a loose reading, the slide designer's «Captions identify what an image cannot say on its own: a specific place, time, identity or technical name» (the first check's later-topic note). Nothing else in instructions, templates, examples or code.

---

## E. The pins, attacked again

Each edit was made on a scratch copy and undone before the next. Each ran first against the four ledger pin tests; those the pins missed then ran against the whole suite. "Caught" names the pin row or test that failed.

| # | What I did | Pins | Whole suite |
|---|---|---|---|
| D24 | Code: the script read as if it were board text | not caught | caught (`test_the_script_does_not_count`) |
| D24b | Code: HEAD's behaviour, the script counted as said earlier | not caught | caught (`test_the_script_does_not_count`) |
| D25 | Code: part-word match for "said earlier" put back | not caught | caught (`test_a_longer_word_does_not_count`) |
| D27 | Code: the old Source and Scenario Integrity trigger put back | caught (AK-DEC-05) | |
| D27b | Code: the trigger's experience half dropped | caught (AK-DEC-05) | |
| D30 | Code: the names note's reminder clause dropped | caught (AK-K02) | |
| R01 | "spoken preparation" into `preferences.md` | caught (AK-A05) | |
| R02 | "spoken preparation" into the reviewer | caught (AK-A05) | |
| R05 | "unless an earlier lesson the brief names covered it" into geography | caught (AK-C01) | |
| P01 | Playbook: a "drawn recently" caption rule as a new paragraph | not caught | **not caught** |
| P02 | Playbook: the same rule inside the pinned caption paragraph | caught (AK-D12) | |
| P03 | Slide designer: the same rule added to its caption line | caught (AK-D20) | |
| P04 | Slide designer: the same rule as a new paragraph, with "say so in the speaker notes" | not caught | **not caught** |
| P05 | History: the same rule as a new paragraph in What the board and the page hold | not caught | **not caught** |
| P06 | History: `An artist drew this recently, ...` back in another paragraph | caught (AK-D05) | |
| P07 | History: "or in the notes" dropped from the picture rule | caught (AK-D05, D06, D08) | |
| P08 | Reviewer: the picture half turned round | caught (AK-K01) | |
| P09 | Science: "An artist's drawing, not a photograph" caption rule, new paragraph | not caught | **not caught** |
| P10 | Playbook: "the exact provenance goes in the teacher's note", new paragraph | not caught | **not caught** |
| P11 | History: the naming caption sentence deleted | caught (AK-D05, D06, D08) | |
| P12 | Playbook: "never go under a picture" to "rarely" | caught (AK-D12) | |
| P13 | `An artist drew this recently, ...` word for word, new playbook paragraph | not caught | **not caught** |
| P14 | "a caption that must be honest about what a picture is" into the slide designer | not caught | **not caught** |
| P15 | "Say it once: a set of pictures" into the playbook | not caught | **not caught** |
| P16 | A fifth `reconstructed`-style caption on the Tudor calibration | not caught | **not caught** |
| N01 | Name paragraph: "For these, " dropped | caught (AK-DEC-04 and the decision test) | |
| N02 | Name paragraph: the three-repairs sentence deleted | caught (AK-DEC-04 and the decision test) | |
| N03 | Name paragraph: back to "a thing the class has never met" | caught (AK-DEC-04) | |
| N04 | Reviewer: "and use its three repairs" dropped | caught (AK-K01) | |
| N05 | Reviewer: "For both ... not a card" back | caught (AK-K01) | |
| N06 | Designer: reminder back to a plan's lessons only | caught (AK-F01, QC-B06) | |
| N07 | Home: "that changes the procedure" dropped | caught (AK-A01, A03, A11, DEC-09, the home) | |
| N08 | Reviewer pointer: the two limits dropped | caught (AK-A11, QC-A22) | |
| N09 | Reviewer pointer: the paragraph beside the home dropped | caught (AK-A11, QC-A22) | |
| N10 | Compatibility route: Vocabulary dropped | caught (TD-DEC-06) | |
| N11 | Designer: the old "because the script only says the board" | caught (AK-A05, TD-H03) | |
| N12 | Code: `Someone`, `I'd`, `I'm`, `I've`, `I'll` out of `NOT_A_NAME` | not caught | **not caught** |
| N13 | Code: `Prove` out of the opening verbs | not caught | caught (`test_an_opening_verb_or_pronoun_is_not_part_of_a_name`) |
| N14 | Code: titles no longer add to what is known | not caught | caught (`test_a_sentence_case_title_supplies_the_signal`) |
| N15 | Code: every title adds to what is known, capitalised throughout or not | not caught | caught (`test_a_title_with_every_word_capitalised_is_not_a_list_of_names`) |
| N16 | Code: the always-read Vocabulary note loses its rule's name | caught (AK-DEC-08, VOC-L05) | |
| N17 | "For a name and for an ordinary word ... not a card" as a new Vocabulary paragraph | caught (the vocabulary homes test) | |
| N18 | New words, opposite: a plan-only reminder in the reviewer | not caught | **not caught** |
| N19 | Skill route: "seen each one worked" weakened to "some of them" | caught (AK-A31) | |

What is held, and held well: every repair's words (deleted, softened or turned back), the code's script and part-word behaviour, the widened trigger, the names note's reminder clause, and "spoken preparation" and "unless an earlier lesson the brief names" in any file. What is not: finding 6.

---

## What I would still fix before release

1. **The Teach calibration** (finding 1): take the four `reconstructed` captions and the «the caption says so» sentence out of `tudor-teach-slides.lesson.json`, and let the example's test check that no caption says how a picture was made.
2. **The notes half of the picture ruling** (finding 2): make history say one thing about `teacherInfo` for a drawn picture; either "the notes need none" or scope «the exact provenance goes in `teacherInfo`» and «Put production provenance ... in teacher-facing fields» to written sources and the run's records.
3. **Put to Daniel, one question** (finding 3): is a caption about how a picture was made "never", or "not needed, and only when the lesson uses it" (a lesson that teaches the word, or asks children to read the picture as evidence)? Then make the playbook's «never go under a picture» agree with history's and the reviewer's «unless the lesson teaches it».
4. **Names and ordinary words** (finding 4): "not a card alone" in the name paragraph and the reviewer, or take `order` and `steam engine` out of the ordinary-word examples and say what makes a thing "met on the way"; either way `Parliament` must come out with its card.
5. **"Identify written sources honestly"** (finding 5): "Identify sources honestly", with the picture exception after it.
6. **Pins and tests** (finding 6): make the three local picture pins `everywhere`; give the `NOT_A_NAME` test a mid-sentence case (`Then Someone I know said so. Maybe I'm wrong.`).
7. **Log and mapping** (finding 7): 34 entries (six lost, four words); nine rows of the earlier topics' pins; 8.3 KB; "how it was made" in the log's decisions bullet and the mapping's AK-D06 and AK-K01 outcomes; drop "said once"; name r8 where the repairs are listed.
8. **Later, noted not fixed** (finding 8): a clause joining the reminder to history's causal re-explaining; the names list's next opening words.
