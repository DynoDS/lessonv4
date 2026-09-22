# Independent check of the repairs (vocabulary fold, 4.2.284, uncommitted, against ee9c6e2c)

What I did: read the earlier check, the teacher's decisions and the mapping; read the whole current diff and the old text of every changed section; re-tested every earlier finding; checked all 222 "unchanged" rows against the old files (every ledger quote is still present word for word, and every pin sits under the same heading as before); compared every sentence of every changed row's ledger quote with the current plugin; ran the old and new vocabulary checks side by side over every saved `lesson-design.json` (65 designs with introductions, 62 distinct, 170 word introductions); built probe cases for the code (`code_cases.py`, `corpus.py`, `corpus2.py` in this folder); ran 17 attacks on a scratch copy of the pinned files (`pin_attacks.py`, copy in `pincopy/`). Full Python suite: 2,078 passed, 1 skipped. The two named test files: 26 passed. `git status` is the same as at the start: I changed nothing in the repository.

---

## 1. Real problems, most serious first

**1.1 The wider word matcher now fails to hear plurals it used to hear (a regression, and it reaches the older checks too).**
`_word_forms` gives a word ending in `y` only `word`, `-ies` and `-ied`. The old matcher gave every word `s`, `es` or `ies`. So a word ending vowel + `y` has lost its plural:

| Card | Board or script says | Old | New |
|---|---|---|---|
| valley | «Rivers carve valleys.» | heard | not heard |
| array | «Make two arrays.» | heard | not heard |
| key | «Use the keys on the map.» | heard | not heard |
| day, journey, chimney, abbey, display, survey, decay | their `-s` plurals | heard | not heard |

`_word_patterns` feeds all three checks, so this is not only the new board rule. A sound geography lesson whose card is `valley` and whose next beat says «How do rivers make valleys?» (board and script) is now refused with «`valley` is introduced and then never used», where before the change it passed. No saved design hits this today (the only old/new difference across the corpus is `monastery`, which the new matcher now correctly hears as `monasteries`). The build log's claim that «The matcher also hears a word's natural forms» is true for the forms it names, not for these.

**1.2 The picture's printed words are heard only in one phrasing, so the check still wrongly refuses sound lessons (earlier finding 6a, partly repaired).**
`VISIBLE_TEXT_FEATURE` needs `caption`, `label`, `heading` or `title` followed straight away by a colon, `read(s)`, `say(s)` or a quote mark. Across all 781 required features in the saved designs it matches 14: twelve «Visible caption: Each interval is worth ...» (one lesson family) and two headings. Real phrasings in the same saved designs that print words and are not heard:
- «labels reading 'ear canal' and 'eardrum' and nothing else» (`reading` is not `reads`)
- «the eardrum labelled»; «four aligned columns labelled Thousands, Hundreds, Tens and Ones»; «the Equator drawn and labelled across the middle of the map»
- «with a shared label reading: Same load»; «is labelled: More air resistance»
- «one part is a blank circle captioned thousands»; «halfway written under the middle tick of every line»; «a caption saying the balance is across a day»

I ran each as the next beat's picture with the card word in the script: every one is refused «... but not on its board». No guidance tells the designer to write printed words as `Visible caption:`, so this is a hidden contract. The build log says the check hears «a required feature naming a caption, label, heading or title with its words»; that overstates it.

The same regex takes everything after the marker to the end of the feature, so words that only describe can pass: «No caption: children work out what each interval is worth themselves» passes an `interval` card, and «Visible caption: Coldest to warmest. Arrows show the negative numbers below zero» passes a `negative` card. Both are my constructions; neither appears in the saved designs.

**1.3 The pin test is much stronger, but four gaps remain (earlier gaps 1 to 3, partly repaired).** 17 attacks on a scratch copy; 7 caught, 10 missed:

| # | Attack | Result |
|---|---|---|
| 1 | «A word must not be introduced» → «should not» (home) | caught |
| 2 | designer pointer «is always taught» → «is usually taught» | caught |
| 3 | wall O16 «genuinely cannot fit» → «does not easily fit» | caught |
| 4 | history M07 «three different contexts across the year» → «one context» | **missed** |
| 5 | delete M07's «Children can study a whole empire topic and still be unable to say what the word means.» | **missed** |
| 6 | templates N13 «Card heights and font sizes scale with the word count.» → «Card heights are fixed.» | **missed** |
| 7 | move a pinned rule from `### Lesson Designer visual-need boundary` to `### Slide Designer presentation rules` | caught |
| 8 | move a pinned playbook rule from `### Vocabulary` to `### Colour` | caught |
| 9 | move the worksheet designer's opening «A word the lesson itself taught is not this fault» paragraph to `## Final preflight` | **missed** |
| 10 | move the skill route's opening bounded-attempt audit to `## Output Format Block` | **missed** |
| 11 | delete geography M04 (a row's only quote, outside the home) | caught |
| 12 | put «**Retired, do not follow:**» in front of a home paragraph | **missed** |
| 13 | add «In a maths lesson the objective's own term never needs a card or a taught line.» to the designer's Vocabulary section | **missed** |
| 14 | reorder the home so «The selection test above» and «The Lesson Designer records this» lose what they point at | **missed** |
| 15 | wrap a home paragraph in a code fence | **missed** |
| 16 | add «lean on emojis (🔢➗🔟)» to `subject-maths.md` | **missed** |
| 17 | add «aim for 3–5 cards» to the designer's pointer | caught |

What the misses mean:
- **Changed rows outside the home are still pinned in fragments (4, 5, 6).** The 19 home paragraphs and the designer's 4 are pinned whole, which repairs the earlier gap there. But M07 pins only its first and last sentences and N13 only its first. Two of M07's four sentences and N13's last sentence can be reworded or deleted silently.
- **Five pins name the file's own title as their section (9, 10).** A18 (`# Lesson Designer`), E11 twice (`# Teaching Sequence — Skill-Based (MT / OT / YT)`), I10 and Q06 (`# Worksheet Designer`). The title spans the whole file, so the section check does nothing for these. The build log says the pins «check each rule's section as well as its file».
- **A retired phrase is checked only in the file it left (16).** The log says the test «fails if any is dropped or brought back». It fails only if it comes back to the same file.
- **The coverage test still checks the pin file against itself.** `test_every_ledger_row_is_pinned` asserts the pin file's own `ledgerIds` has 285 entries; it never reads the ledger. A row whose `present` list is emptied still passes if it has an `absent` pin (true of C07, C13, C20, C21 and others).
- **Additions pass (12 to 15).** Presence pins cannot see a rule negated by words added round it, a contradicting sentence added nearby, or paragraphs reordered. That limits any presence pin, not a fault of this one. But reordering matters here, because the home now relies on «The selection test above», «the job test above» and «The Lesson Designer records this».

**1.4 One sentence of M07 changed meaning, the mapping does not list it, and no pin protects it.**
- Old: «Children have studied a whole empire topic and been unable to say what the word means.»
- New: «Children can study a whole empire topic and still be unable to say what the word means.»

A reported finding has become a possibility. Decision 3 licensed rewording «rather than defined and displayed», not this sentence. The mapping's M07 entry lists the first and last sentences only. Low.

**1.5 Criteria, sticky facts and captions count as "board" in the new check only.** The older "is it used" and "where is it first needed" checks still read only the beat's own text and script. So a next beat that shows the word only in its criteria (script silent), with the word used two beats on, gets «`interval` is introduced here and first needed 1 beat later». A next beat that shows it only in its picture caption gets «introduced and then never used». The rule also asks for the script, so a refusal is defensible, but the message sends the designer to the wrong repair. Meanwhile a word in the next beat's own text with a silent script passes. Low.

**1.6 The wider forms also hear some different words.** `count` hears «counters», `mean` hears «meaning», `rule` hears «ruler», `time` hears «timer», `compute` hears «computer», `form` hears «former», `even` hears «evening» and `light` hears «lighter». Because these feed the "never used" check too, a card word nothing genuinely uses can pass if a later beat says one of these. `mean` and `even` already leaked through their plain senses before the change. Low.

**1.7 The new build-log entry is mostly accurate. Four statements are not:**
- «Four existing tests pinned the designer's own copies and now look in the one home». Three changed: one in `test_bounded_attempt_and_taught_invariants.py`, one in `test_make_lesson_static_contract.py`, one in `test_the_lesson_is_written_as_a_lesson.py`. The fourth changed test is the script-counts one, which the log counts separately.
- «Across the 54 saved designs, 21 of 114 word introductions were script-only». I cannot reproduce it. I count 34 of 170 across the 65 designs that have introductions (62 distinct). The named examples are right: `negative` on lesson 15's «My Turn - Compare» shows «−3» and never the word, and the other examples are continuity and change on the history beats and exchange, place value, placeholder and expanded form on maths My Turns.
- «fails if any is dropped or brought back» and «check each rule's section as well as its file». These are true only with the limits in 1.3.
- «Every one was repaired». Finding 1h was not, and 6a was only in part (1.2).

Accurate: 285 places in 40 files (I counted both); the next-beat check shipped in 4.2.234; the E06 story, now pinned there; the review-packet change; the three new code tests.

**1.8 Smaller notes.**
- **The merged C08/C10 sentence is clumsy.** It reads «that fuller teaching belongs on the Teach slide; teach necessary comparisons, caveats or fuller explanation elsewhere while the card remains useful as a quick reference». It says the same thing twice with two different homes. Nothing is lost, but a reader could take the second half as contradicting the first.
- **A vocabulary term that is exactly `s` crashes the validator.** `*first, last = stem.split()` raises a ValueError on an empty stem. Negligible in practice.

---

## 2. The earlier findings, one by one

| Finding | Status | Old words | Current words |
|---|---|---|---|
| 1a designer pointer dropped the taught-line alternative and the deferral | **Repaired** | «always a term the approved objective names» | «how a term the approved objective names is always taught (a card, or one explicit taught line, unless the teacher's sequence defers it)»; the test pins this now |
| 1b D12 became a description, lost "Foundation subjects" and the pyramid | **Repaired** | «...the same photograph on the card lets the child meet it twice at no cost» | «In a foundation subject, when the teaching sequence already sources a photograph (a biome landscape, a river's source, a Mayan pyramid), name the same photograph as the card's visual: the child meets it twice and it costs nothing.» |
| 1c C10 "elsewhere" narrowed to the Teach slide | **Repaired** (join clumsy, 1.8) | «that fuller teaching belongs on the Teach slide, while the card remains useful» | «...belongs on the Teach slide; teach necessary comparisons, caveats or fuller explanation elsewhere while the card remains useful as a quick reference.» |
| 1d E12 lost "must not", orphaned "at one end" | **Repaired** | «The failure at one end is a word introduced after...» | «A word must not be introduced after the last moment it was any use: that is not late teaching, it is no teaching.» The orphan is gone. |
| 1e E01 sentence removed | **Repaired** | (removed) | «Reading the whole set out after the starter has not been helping.» is back; E01 matches its ledger quote exactly |
| 1f A11 trigger changed | **Repaired** | «more words than earn a place» | «When a plan lists more words than the limit, trim the ones with no job and record each in `trimmedVocabulary` with its reason.» |
| 1g N13 dropped "compact" | **Repaired** | «each with the picture the design chose for it» | «each with the compact picture the design chose for it» |
| 1h E03's classroom example dropped | **Not repaired** (the mapping gives a reason; harmless) | «(children look at two classrooms and say what is alike, then hear that the alike things are called continuities)» | still gone; E02 keeps «(`children learning together, continuity; no whiteboard, change`)» |
| 1i evaporation example implied heating | **Repaired** | «Evaporation is when water warms up and turns into a gas called water vapour.» | «Evaporation is when liquid water slowly turns into a gas called water vapour, like a puddle drying up.» |
| 2 decision 4, contents line | **Repaired** | «choosing 3–5 cards» | «choosing up to five cards»; the README is fixed too; A03 pins the new text and bars the old |
| 2 decision 12, F03 twin and E34 date | **Repaired** | «a deck shipped with two vocabulary slides and empty notes on both...»; «The user, 12 September 2026:» | both gone; «The teacher's words:» |
| 2 decision 11, Z01 not word for word, mapping said unchanged | **Repaired** | mapping «unchanged in place» | mapping now «moved to Support, Checking and Release (decision 11), its incident and date retired (decision 12)»; the text keeps his words and every condition |
| 2 decision 6 contradicted by the pointer | **Repaired** | as 1a | as 1a |
| 2 decision 9, O11 «One concise child-readable definition» | **Not addressed** (still unsure; the log defers it) | | unchanged |
| 3 designer lost the A Picture Beside a Word pointer for word banks and sorting sets | **Repaired** | (gone) | «`preferences.md` → A Picture Beside a Word is the test for every picture you put beside a word: a vocabulary card, a word bank, a sorting set, a slide list.» |
| 4 E22 «this» read as the Teach beat | **Repaired** | followed E35 | «The Lesson Designer records this as `vocabularyIntroductions`...» now follows the Three boundaries paragraph and precedes E35 |
| 5 pins locked in contradictions | **Repaired** | «always a term the approved objective names», «choosing 3–5 cards» | both corrected and pinned the right way |
| 5 build-log count | **Changed, still not reproducible** | «22 of 114» | «21 of 114» (I count 34 of 170) |
| 6a picture's printed words ignored | **Partly repaired** | refused «Visible caption: Each interval is worth 10.» | that phrasing is heard now; most real phrasings are not (1.2) |
| 6b ordinary word forms | **Repaired, with a regression** | continuities, changed, rounding, exchanged were refused | all heard now; vowel + `y` plurals lost (1.1) |
| 6 script on the next beat not checked | **Unchanged** | | still unchecked; the designer's pointer honestly says «its script alone does not count» |
| 6 ids in the board text | **Unchanged** (low, not new) | | still walks every string value, including `photoRef` ids in task items |
| 7 gap 1, changed rows pinned in fragments | **Repaired in the home, not outside it** (1.3) | | 19 + 4 home paragraphs pinned whole; M07 and N13 still fragments |
| 7 gap 2, pins check file not section | **Repaired for 346 pins, not for 5** (1.3) | | 351 of 355 pins carry a section; 5 of those name the file title |
| 7 gap 3, coverage only counts | **Partly repaired** | | now requires each id to pin something, and E06 is pinned in the log; still never reads the ledger; an emptied `present` list with an `absent` pin passes |
| 7 gap 4, conflicting pins | **Repaired** | | |

---

## 3. Did the repairs break anything in the named files?

- **`preferences.md` → Vocabulary.** Every sentence of the old section and of the designer's old section has a home or a licensed reason to go. I checked by comparing the sentences of each changed row's ledger quote with the whole plugin. The only unlicensed changes are the C08/C10 join (1.8), which loses nothing, and the M07 sentence in the history file (1.4). «Add a visual note where it makes the meaning clearer.» and «Record visual note alongside definition» are retired under decision 13, as the ledger's out-of-date list says.
- **`lesson-designer.md` → Vocabulary.** The pointer is accurate. The validator does refuse «a word introduced twice or not at all» (the duplicates and missing checks). «Visual must move child closer to concept» now reaches the designer through the restored A Picture Beside a Word pointer. The only nearby phrase that could read as a new rule is «(up to five, each with a job today)», which matches A01 and A04.
- **`output-template.md`.** The example card's `{ "kind": "representation", "representationRef": "rep-001", "configuration": "vocabulary" }` matches the contract's own shape. The F03 story is gone and the F02 rule is intact.
- **`templates.md`.** «One to five words ... compact picture» is fine. N30 is now a prose bullet in a list of JSON examples, which reads fine. Both `vocab` examples are accurate single sentences.
- **`teaching-sequence-skill-based.md`.** Decision 7's clause is correct and limited to the skill route. The teacher's quoted words are kept, with the date dropped.
- **Build log 4.2.284.** Accurate on what the code and tests do, except the points in 1.7.

## 4. Checked and found sound

- **Unchanged rows.** All 222 "unchanged" rows: every ledger quote is present word for word in its file, and every pin sits under the same heading in the old file as in the new.
- **Tests.** The full suite (2,078 passed, 1 skipped) and the two named files (26 passed).
- **Review packet.** It prints each vocabulary slide's script as «Teacher says: ...», with the `Say to children:` opening removed, exactly as other beats print. It only displays, so it cannot wrongly refuse or pass anything.
- **Board check on real designs.** Across the corpus it refuses nothing that the beat's picture visibly prints in a form I could find, and the lesson 15 `negative` refusal is the case the teacher named.
- **Things the check handles correctly.**
  - A takeaway that references a sticky fact is covered: the validator already requires that fact in `stickyKnowledgeRefs`, which `_shown_beside` reads.
  - «every integer labelled, with correct negative signs» correctly prints nothing.
  - `roundabout` is correctly not `round`.
