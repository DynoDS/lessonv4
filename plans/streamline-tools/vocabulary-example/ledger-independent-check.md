# Independent check of the vocabulary ledger

Checked against lesson-v4 at `ee9c6e2c` (4.2.283); the plugin working tree has no local changes. Read-only: nothing in the repo was changed.

How the search was done: every file and line the ledger names (rows and the "another topic" appendix) was collected by script. Then every instruction file in `agents\`, `references\` (plus `references\worksheet-helpers\`), `skills\` and `commands\` was searched for lines about vocabulary that the ledger never names. The search covered: vocab, definition/define, glossary, key word, technical term/language, word card, taught word/term, proper noun, headword, terminology, jargon, pronunciation, word family, subject/disciplinary language, tier 2/3, "the word", "new word", "which means", everyday meaning, named people/places, word-level, and every uncited line containing "term". All of the ledger's core sections were then read in full, to find sentences on a cited line that no «quote» covers. The build-review-log was left out.

Line numbers are file lines at `ee9c6e2c`.

---

## 1. Missed rules

These are rules an agent is told to follow. The ledger has no row for them, and its appendix does not list them either (or the appendix files them under the wrong topic). They are ordered by how much a fold would lose.

### Likely to matter

1. **`references\templates.md` L387.** This sits in the key-vocabulary `visual` paragraph, but the rows N14 and N15 quote other sentences from it:
   «**Prefer built-in drawings over `image` when they carry the meaning - they require no picture sourcing and cannot become a missing-file placeholder.**»
   Group D. It bears directly on decision 1: this is the maths-picture rule the slide designer actually reads.

2. **`references\preferences.md` L754 (Pride Lessons).** A calibrating example of Daniel's vocabulary taste, with no row:
   «Vocabulary had visuals next to definitions (e.g. "vertebrate" with a spine image).»
   Group D, kind "your example". The brief names Pride Lessons as a calibration that must be kept.

3. **`references\working-wall-preferences.md` L175.** A chip card's place in the wall's sheet cap:
   «A chip card counts as **one teaching sheet** against the one-sheet default and two-sheet hard cap, regardless of how many chips sit on it. Do not add it on top of an overview unless it performs the exceptional second sheet's distinct, durable job.»
   Its companion is `agents\working-wall-designer.md` L372, whose second sentence O06 does not quote: «The chips are the items; the card is one teaching sheet regardless of chip count.»
   Group O.

4. **`references\working-wall-preferences.md` L161 and L163.** O12 quotes only the heading sentence at L158. The actual choosing rule is not quoted:
   - L161: «Reach for `vocabDefinition` when the lesson teaches a specific tier-3 word as a concept — `denominator`, `isosceles`, `metaphor`, `evaporation`. One word, big, with a child-language definition and a drawn primitive.»
   - L163: «Both can live on the same wall under the same `Vocabulary` heading: one or two definition cards for the lesson's central terms, plus a chip card carrying the broader vocabulary the children will use around them.»
   Group O. L163 also contradicts item 3 above; see section 4.

5. **`references\working-wall-preferences.md` L167 and L169.** Chip wording and chip title, neither in any row:
   - L167: «**Chip wording.** Single words or short noun-phrases - `pound`, `ten pence`, `change` - not full sentences. Keep each chip to roughly 12 characters or 2 words. ... When the lesson genuinely needs a longer phrase (`make a prediction`), the chip card is the wrong fit - that's `sentenceStem` or `stickyKnowledge` territory.»
   - L169: «**Title.** A short noun naming the *set* of words on the card — `Money words`, `Body parts`, `Weather`, `Science kit`. Keep it ≤ 5 words.»
   The card contracts repeat the chip limit at L388 and L399: «(≤ 2 words, ≤ 12 characters reads cleanly)».
   Group O.

6. **`agents\working-wall-designer.md` L120-122.** The wall's ban on decorations for vocabulary families. The slide version is in the ledger (N17, Q03); the wall version is not:
   «P3 is allowed only on `stickyKnowledge`, `workedExample`, `sentenceStem`, `misconception`, `referenceTable`, `equivalenceGrid`, after core content/layout is settled. It is forbidden on vocabulary/furniture/special families.»
   Group O.

7. **`references\preferences.md` L85.** Vocabulary at Greater Depth. Group P has no Greater Depth language rule:
   «**Greater Depth normally deepens the thinking rather than the prose.** Keep language accessible unless a richer text, terminology or language demand is itself a legitimate part of the subject thinking. Do not manufacture depth through longer reading or harder wording alone.»
   Group P.

8. **`references\preferences.md` L182.** Teaching the names of a set is a vocabulary-timing rule, and it pulls against grouping (E17):
   «Where the objective requires children to name and describe each unfamiliar member of a set, normally teach and let children use each member's defining knowledge before moving on; naming them together and adding a shared task is not equivalent.»
   Group E; shared with the rhythm topic.

9. **`references\teaching-sequence-skill-based.md` L219.** Constrains where a vocabulary card may sit in a skill lesson:
   «The one thing fixed is the cycle itself: between a My Turn and its Your Turn nothing intervenes, because a class modelled to and then taken somewhere else arrives at its check having lost the thread. The other beats sit before a cycle or after it.»
   The ledger cites L217 (E34, "vocabulary is free") but not this limit on it. Read literally, it forbids a `key-vocabulary` slide anchored after a My Turn or Our Turn. I am unsure whether Daniel meant it to cover vocabulary slides, but nothing in the code stops such an anchor.
   Group E.

10. **`references\teacher-voice.md` L328.** The conditions under which a longer definition is allowed. C19 quotes only the sentence before:
    «A longer version is better only when the extra wording adds: - a useful example; - a misconception correction; - a method reminder; - genuinely helpful scaffolding; - an important connection.»
    Group C. It is the fullest statement of when a second sentence earns its place (compare C06 and O11 in section 4).

11. **`references\teacher-voice.md` L312.** The counterweight that J03 («This is not a ban on sophisticated vocabulary») answers:
    «When the underlying idea is abstract or difficult, lighter language can reduce unnecessary cognitive load.» It comes with the Claudius example at L315-320.
    Group J. Keeping J03 without it keeps the reply and loses the rule it replies to.

12. **`references\preferences.md` L45.** H05 cites this line but does not quote its last sentence:
    «Preserve necessary technical language and formal source quotations; the teacher's own explanation need not inherit their register.»
    Group H/J.

13. **`references\teacher-voice.md` L461.** Ordinary words with an adult sense:
    «The sharpest version of this is a single ordinary word that means one thing to an adult and another to a child. `What do their reasons share?` uses `share` to mean hold in common ... where a common word is carrying an adult sense, use the plain one: `What is the same about their reasons?`»
    Group H. This also corrects M03's note "reads as general; only here". The everyday-meaning hazard is written generally here for prompts, though the remedy differs (use the plain word, rather than teach the contrast on a card).

### Misfiled in the appendix (a vocabulary rule filed as "word banks")

14. **`references\preferences.md` L61.** The appendix files it under word banks, but it also carries this rule:
    «And a name invented during planning (`the balance rule`, `the nutrient-job table`) never reaches the child: the page says `the table above`, because the child has met the thing, not its working title.»
    This belongs in group I, with I07 (planning nouns) and I02 (a lesson's own label).

15. **`agents\worksheet-designer.md` L161-164.** Filed as word banks, but it is the only rule that places a vocabulary definition on a worksheet:
    «A definition of the word the question turns on, a sentence starter the answer is written into, a word bank the answer is chosen from, a step list worked *through*: no, and without it there is no answer, so it is part of the question and sits with it, above the writing space rather than under it.» It comes with the `continuity = stayed similar` example.
    Group Q.

### Smaller copies and companions with no row

16. **`agents\worksheet-designer.md` L56-57.** «A word the lesson itself taught is not this fault: `continuity` on a sheet whose class was taught the word is the lesson's own language.» This is the worksheet designer's copy of I07/I08. Group I.

17. **`agents\lesson-designer-focused-repair.md` L46.** «A definition, a script or a question repaired into something shorter and flatter has swapped one fault for another. Keep the thinking the line was asking for.» This is the repair role's only copy of C01; that role never reads preferences. Group C.

18. **`references\teaching-sequence-skill-based.md` L223** («what the word `digit` names» as a `teach` beat's job) and **`references\preferences.md` L180** («A Teach block introduces a single new thing — ... a vocabulary distinction»). Group E. Both matter to decision 8 (see section 4, pair 4).

19. **`references\templates.md` L257.** «Add `headingRole: "vocabulary"` when the two headings are taught words.» This covers the newer `compare-words` and `compare-pictures` layouts; N07 and N08 cover only `teach-compare`. Group N.

20. **`references\teacher-slide-visual-profile.md` L114.** N19's line; these sentences are not quoted:
    - «Success criteria arrive with the taught word already marked as `{{word}}` ...»
    - «Answer reveals keep their own green, so a taught term inside a revealed answer is not marked twice.»
    The second is an exception to "every occurrence". Group N.

21. **`references\preferences.md` L435.** «When one word could take two colours, the picture wins, then the taught word. Mark the words doing that work and leave the rest black: usually one or two parts of a step». Group N; shared with success criteria. See section 4, pair 3.

22. **`references\working-wall-preferences.md`** (O group, on lines the ledger cites but does not quote):
    - L165: «When the unit's full vocabulary list runs longer than 12 words, split into two chip cards (`Money words` + `Money actions`, for example) rather than cramming.»
    - L171: «Pair an image with a chip when the image makes the meaning obvious at a glance ... Skip the image when the word is abstract (`amount`, `change`, `spend`) and a stock image would feel forced; an unpaired chip is fine.»
    - L173: «If the lesson uses two new words in passing, the card is too thin to print — skip it and let the words live on the slides.»
    - L76-79: the four examples under O17, including the condition «"joining word (conjunction)" not "conjunction" alone — until they know the word».

23. **`references\working-wall-card-contracts.md` L387-388** (O group):
    - «The visual is what shows what the term looks like; the definition is what it means.»
    - «Photo filenames must already be listed in `photo-requirements.json`; missing files fall back gracefully (text-only pill).»
    Related: `agents\working-wall-designer.md` L414 and `agents\working-wall-designer-focused-repair.md` L25 (a chip picture that cannot be delivered becomes text-only).

24. **`agents\working-wall-builder.md` L55 and L110.** The builder's side of O19:
    - L55: «Report it; do not render the card text-only.»
    - L110: «A semantic-vocabulary P2 is not expendable on Working Wall; unresolved, missing or unreadable semantic Educational SVG is a build failure.»
    Group O.

25. **`agents\adaptation-designer.md` L459.** In the output template: «name any essential difficult vocabulary and its support». This is the recording side of P05. Group P.

26. **`references\teacher-voice.md` L587** («Have I made the vocabulary unnecessarily casual just to sound human?», the check paired with J05) and **L731** («do not use teacher-facing terminology pupils may not understand;», comparison prompts). Group J/I.

27. **`references\subject-history.md` L32.** «What generalises is the order: material, noticing, the idea named after it is met, use, ...». This generalises E30 (Daniel's sketch) into a timing rule. Group E; it stays with the sketch.

28. **`references\teacher-voice.md` L302-308.** The `Partition 24` / `Split 24` calibrating example for J02 («if `partition` is the expected mathematical language») is not quoted. Minor.

Searched with nothing further found: `agents\slide-decorator.md`, `stick-in-sheets-*`, `skills\make-lesson\SKILL.md`, `playbook-lite.md`, `commands\*`, the discovery, dialogic and task-centred routes, and `design-review-route-checks.md`, `lesson-from-plan.md`, `brief-gap-protocol.md`, `revising-in-place.md` and `books-or-sheet.md`. The discovery route has no vocabulary rule at all, which matters for E09 (section 2).

---

## 2. Duplicates that are not duplicates

A fold that deletes these would lose the quoted difference.

- **A12 is not A11.**
  - A11 applies only when the plan is over the limit: «When plan lists more than limit, trim no-job items, note decision.»
  - A12 has no condition: «Trim vocab with no job.»
  - A12 applies to every supplied plan, whatever its count. Folding it into A11 narrows it.
- **A05 is not A04.**
  - A04 is about words children «reuse and that deepen their understanding of the subject».
  - A05 is about «learning-critical language with genuine job in today's explanation/question/discussion/task». That is a job today, and it names "discussion" as a landing, which G01's landing list does not.
  - The ledger rates A04 "default" and A05 "must", so it has recorded one rule at two strengths.
- **C04 is stronger than C03.**
  - C03: «is worth opening before you write the set» (default).
  - C04: «Open `teacher-voice.md` §5 with it» and «whose definition rule you read before writing the set» (must).
  - Keeping C03's wording weakens the designer's must-read.
- **C06 is not C01 or C10.** It carries a permission with its own condition: «two short connected sentences are fine when the second gives a genuinely helpful example or experience». Neither C01 nor C10 has this. The wall's version (O11/O15) uses a different condition, «when forcing it into one would damage accuracy», and teacher-voice L328 gives five.
- **E08 differs from E07.**
  - E07 prefers one repair: «the question is usually the other way round ... the repair is that beat's own wording rather than the card's place».
  - E08 offers both repairs equally, card first: «can be repaired by moving the card ... or by the earlier beat saying the word».
  - The validator's message also puts moving the card first. The "usually" preference exists only in the designer file.
- **E09 is not E10.** «Discovery still introduces formal vocabulary after the exploration» is a route-wide rule for Discovery lessons: all formal vocabulary comes after the exploration. E10 covers only a definition that would hand over the discovery. The Discovery route file has no vocabulary rule, so folding E09 into E10 loses it.
- **E19** adds «a prerequisite word and a pair of contrast words are two entries, not one». E17 and E18 do not have it (E27 has the same point).
- **E28 is not E01.** «neither observation-first nor an opening glossary is compulsory» is a permission that E01 lacks, and it sits against E02's must.
- **E29 is weaker than E02.** E29: «Noticing an accessible source before naming continuity and change can work well». That is "can", where E02 says "goes in after". Folding changes history's strength.
- **G03 carries a condition G01 lacks.** «Where task about something key word names, write task with word in it.» G01 lists "a task written with it in" only as one possible landing.
- **G08 is broader than G07.** «A definition card, diagram label or mention in a script does not alone establish understanding.» It covers diagram labels and script mentions, and its repair is H04 («Supply a missing referent»). G07's repair is a bridge.
- **K02 has a condition** that K01 and K03 lack: «If brief signals change, audit together.»
- **P04 is fuller than P01.** It has the condition «when the learning requires them» and names the supports: «a clear picture, labelled word bank, pronunciation cue or previously taught meaning rather than replacing them with vague alternatives». P05 adds «with specified support», which means the support must be named. The ledger proposes P01 as the owner, which would lose both.
- **J09 and J10 differ in strength.** J09 is «Precise subject vocab when helps.» (rated default). J10 is «Necessary taught subject vocabulary stays.» (rated must). Both are folded into J01.
- **J12 is not J01.** «do not ban words merely because they can occur in planning» limits the reviewer's planning-noun sweep so it does not over-police. It is a different rule.
- **N24 is not N18.** N24 bans green as a category colour, and the code enforces it (`categoryColor cannot be green`). N18 is about marking taught words green. Folding N24 into N18 loses the ban.
- **O16 is weaker than O07.** O07 keeps «the same characters, the same operation or setting»; O16 has only «the meaning and every protection». Keep O07's words.
- **O15** adds «it must still remain readable at a glance» to O11.
- **C05 is wider than C01.** It covers explanations as well as definitions, and it is one of the four voice tells run over every string. The ledger keeps it as STAYS, which is right, but it is not a duplicate.
- **E11** adds an audit of «the starter, the vocabulary cards, every visible reference and photograph» that E10 lacks. The ledger keeps it in the route file, which is fine.

---

## 3. Strength and scope (about 45 rows checked)

Wrong or incomplete:

- **N17 is marked "must (code)". The code does not refuse.** `shared\decorations.js` `inspectDecorations` returns a warning, «`decorations` is not supported on this surface; the collection is omitted.», and drops them. By the ledger's own definition, "Code" means a program refuses the lesson.
- **N19's "every slide / every occurrence" misses two exceptions:**
  - answer reveals keep their own green (L114);
  - in success criteria the picture colour wins over the taught word, and only one or two parts of a step are marked (preferences L435).
- **The code rows (A13, E05, E25, F01, F02, G05) are conditional in a way the ledger does not say.** The validator enforces them only when `vocabularyIntroductions` is present (see section 5).
- **J11 is marked "may",** but its second sentence is a must-not: «Do not rephrase merely to sound stylistically varied.»
- **E28 is marked "must",** but it is half permission: «neither observation-first nor an opening glossary is compulsory».
- **E29 has no strength recorded.** It is a "may" («can work well»).
- **A04 "default" and A05 "must"** are the same imperative, and the ledger calls one a duplicate of the other.
- **D11 "must"** is inferred. The text only warns («Template holds single image. Two words both attracting 🌍 end up same picture - obvious in set.»); "check" fits better.
- **D13's scope is too narrow for the name it records.**
  - D13 says `built-in` is for «notation as built-in glyph (e.g. "10:05" or "0.7")».
  - The contract's own example is `{ "kind": "built-in", "value": "money: £1" }` (output-template L143), which is a drawn helper.
  - `templates.md` L387 also speaks of «built-in drawings».
  - Recording `built-in` from D13 alone would lose the helper meaning.
- **M12's "When it applies" says "science" only.** It omits the exception quoted in the same row: «Add it only when the approved objective, supplied sequence or curriculum for this lesson requires it.»
- **C12's "When it applies"** omits its exception, «Where two definitions need each other, neither order is wrong and the more concrete word leads.»
- **M06 applies to history only, as written. The reviewer's check (H07) runs on every subject.** Geography's M01 says names «belong in the teaching» but not that they are explained where they first appear. So outside history the designer is not told what the reviewer will check.
- **O13 "must (12 by code)" is right.** The 4-chip floor, however, is prose only; the build does not enforce it.

Checked and correct: A01, A08, A09, A11, A16, B01, B03, B04, C01, C03, C08, C10, C22, D01, D02, D03, D04, D09, D12, D14, D18, E01, E02, E07, E12, E14, E17, E25, E31, E34, E35, E36, F02, F04, G01, G04, G06, G07, H02, I02, K01, K04, L04, M03, M07, N02, N05, N14, O05, O07, O08, P01, P07, Q01, Q02.

---

## 4. Disagreements

### The ledger's decisions 1 to 6

1. **Maths card pictures: genuine.**
   - D09: «lean on emojis (🔢➗🔟)».
   - D17 fails a picture that «merely gestures at the area». 🔢 is exactly that kind of picture.
   - The slide designer is also told «Prefer built-in drawings over `image`» (templates L387, missed rule 1). That sentence belongs on the D02/D17 side of this decision.
2. **Definition shape in the examples: genuine, but uneven.**
   - C21 («water turning into vapour») is the clearest clipped phrase.
   - C07 («a force that slows things when surfaces rub together») and C20 («Two amounts that are worth the same.») have a verb doing work inside a relative clause.
   - They are in the "term: phrase" format rather than the «An electrical appliance is something that uses electricity to work» sentences in teacher-voice §5.
3. **History's big words: they pull, but a consistent reading exists.**
   - M05 cards them. M07 says «used and applied rather than defined and displayed».
   - Read with G01 and G02 (every card must be used), "card it and apply it" satisfies both.
   - Taken literally, M07's «rather than defined» still excludes a card. Worth asking Daniel.
4. **The five-word ceiling: genuine inside the plugin, with one caveat.**
   - Inside the plugin: "3–5" reads as a floor, while the code, output-template («An empty vocabulary array takes an empty introductions array») and E27 accept 0, and the wall offers a definition card from 1.
   - The caveat: the "no caps" side is not in any plugin file. It is Daniel's 10 September ruling in memory (`one-reviewer-no-caps-no-room-theory.md`: «No ceiling on beats, slides, sources, words or new ideas»). The ledger should say the ruling lives in memory. "Words" there may mean word counts rather than vocabulary items (unsure).
5. **Where the next beat uses the word: genuine.**
   - G04 asks for board, question/task and script.
   - E04 and E05 ask only that «the next beat uses it».
   - The code accepts the word in any of `content`, `pupilInstruction`, `taskStructure` or `speakerNotes.script`, so the script alone passes.
6. **The wall may shorten, the board may not: the ledger names the wrong pair.**
   - N09 (slides) and O07 (wall) are separate surface rules that do not contradict.
   - J11 does not pull against O07: J11 is a permission to repeat, plus a ban on rephrasing *for variety*, and tightening for a character budget is neither.
   - The real pull is C01 and C10 against O07 and O16. C01: «aim at shortness directly and the cheapest way to obey is to compress the meaning into a noun phrase» and «rewrite it rather than trim it»; C10: «not a phrase squeezed until it fits». O07 and O16 let the wall tighten a definition to fit its budget.
   - K03's reason also bears on it: «a reworded step reads to a child as a new rule».

### Pairs the ledger did not raise

1. **Wall sheet count contradicts itself.**
   - `working-wall-preferences.md` L163 and L173 describe «one or two definition cards ... plus a chip card» and «two definition cards plus a chip card».
   - L175 of the same file says a chip card counts against the «two-sheet hard cap». The wall designer (L280) allows «0–2 teaching cards», and `working-wall-html\build.js` L257 refuses more than 2 teaching cards.
   - O05 («Vocab definition — always 1 (one term, one card). Two terms = two cards.») means two terms plus chips is three sheets, which the build refuses.
2. **One term per wall card, against pairs on slides.**
   - O05 allows one term per card; B01 and B03 let a genuine pair share one slide card.
   - The wall designer's own combining rule (L359) gives «"common factor" + "common multiple"» as its example of a natural pair to put on one card.
3. **Green on every occurrence, against the criteria colour rule.**
   - N19: «every occurrence», including success criteria.
   - preferences L435: «When one word could take two colours, the picture wins, then the taught word», and mark «usually one or two parts of a step».
4. **E35, the rule decision 8 proposes to move, against A09 and H02.**
   - E35: a Teach beat is «in addition to - never instead of - the word's card».
   - A09: «a card, or one explicit taught line».
   - H02: «teach the word in that beat ... or give it a card».
   - Moving E35 into the designer's reading unchanged would import this conflict. Separately, the ledger's claim that the designer never meets the idea is too strong: the designer's own files say a teach beat can carry «what the word `digit` names» (skill-based L223) and a Teach block can introduce «a vocabulary distinction» (preferences L180). What only the playbook has is the "never instead of the card" clause.
5. **Every card has a picture, against the examples.**
   - D01 and D03: every card carries a visual; `none` is «the rare exception ... and the design says so».
   - The contract's only example entry is `"term": "equivalent"` with `"visual": { "kind": "none" }` (output-template L121-123).
   - The slide catalogue's last example is «`{ "word": "convert", "definition": "..." }` — no visual needed, cell stays empty» (templates L404).
   - Both examples model `none` as casual, which is the same kind of fault as decision 2.
6. **Chip numbers cannot be met.**
   - The wall packet offers `vocabChips` only when the design has ≥4 vocabulary entries (`working-wall-packet.py` L426), and A01 caps entries at 5.
   - O13 says «Aim for 6–8 chips». O10 says chip words are ones that do not need a definition, the kind A06 says to «label ... where it is used» rather than card.
   - Unsure whether chips may carry words from outside the design's `vocabulary`; nothing says they may.
7. **The build tells the slide designer to do something it may not do.**
   - The `VOCAB_PICTURES_TOO_BIG_FOR_ONE_SLIDE` message (`key-vocabulary.js` L249-256) says «introduce these words in separate vocabulary entries».
   - N02 and N03 forbid the slide designer to split an entry, and `templates.md` N14 gives only «give one a smaller picture».
8. **Skill-lesson cycles against card placement.**
   - Skill-based L219: «between a My Turn and its Your Turn nothing intervenes».
   - E04 and E05: a card sits right in front of the beat that first needs the word.
   - When an Our Turn or Your Turn is the first beat needing the word, both cannot hold.
9. **Naming a set against grouping (smaller).**
   - preferences L182: «naming them together and adding a shared task is not equivalent».
   - E17: a set of words needed together is one introduction.
10. **Everyday meaning on the card against an uncluttered card (smaller).**
    - M03: «the card has to name that meaning and separate it from the geographical one».
    - C08: keep the card uncluttered; «fuller teaching belongs on the Teach slide».
11. **Where a word may land.**
    - G01 allows a landing in «a task written with it in».
    - The code counts only `teachingSequence` beats. A word used only in the Apply/Reflect ending or on the worksheet is refused as «introduced and then never used».
12. **When a second sentence is allowed: three different conditions.**
    - C06: a helpful example or experience.
    - O11 and O15: accuracy.
    - teacher-voice L328: five reasons.

---

## 5. Code

Omitted or stated wrongly in "What the code enforces today" and "Names the code depends on":

- **Every introduction check can be skipped, and the ledger states them unconditionally.**
  - `validate-lesson-design.py` L33 lists `vocabularyIntroductions` in `OPTIONAL_TOP_LEVEL_FIELDS`.
  - A design with neither it nor `vocabularyPlacement` skips all four checks: introduced once, none missing, script starting `Say to children:`, used in the next beat.
  - Normal runs are covered only because the scaffold always emits the field.
- **What counts as "used":**
  - The strings read are `content`, `pupilInstruction`, `taskStructure` and `speakerNotes.script`, of `teachingSequence` units only (L1348-1366, L3506).
  - The starter, the ending beat and the worksheet do not count.
  - Either half of a paired card counts (`greater than / less than`), `equal to` counts as `equal`, and plurals and hyphens count (L1369-1384).
- **Further refusals not listed:**
  - an introduction naming no word;
  - `after` that is not the starter or a teaching-sequence id;
  - legacy `vocabularyPlacement.after` that is not a teaching-sequence id;
  - both schedules present;
  - a `photo` visual whose `photoRef` is not in the initial photo contract;
  - a `representation` visual whose rep or configuration does not exist;
  - `none` carrying any other key (L1771-1812).
  - The whole-design checks also bind definitions and vocabulary scripts: em and en dashes, numbers containing 67, and scaffold placeholders (L3235-3237).
- **Not enforced, though the prose implies it:**
  - `{{word}}` in criteria is never checked against the vocabulary list.
  - The scaffold does not enforce «never more than `vocabularyCount`» (E27) or the limit of five.
  - The launch taught-word check runs only when `goodLooksLike.strong.words` is a string, and it matches loosely, by stem.
- **Review view (`design-review-packet.py`):**
  - The vocabulary slide's `script` is never printed. `vocabulary_schedule` (L1156) keeps only term and definition, and only unit `speakerNotes` scripts become "Teacher says:" (L1041).
  - So the reviewer's string-by-string voice sweep (L06, «every script») never sees any vocabulary-slide script.
  - Also omitted: groups whose anchor names no unit print as «Vocabulary (unplaced)», and "Names on the board" does not scan vocabulary cards.
- **Wall packet (`working-wall-packet.py`):**
  - It offers `vocabDefinition` only when the design has ≥1 vocabulary entry and `vocabChips` only when it has ≥4 (L425-426). The wall designer is told to treat an un-offered family as failing its criteria (working-wall-designer L299).
  - Headings the code cuts by exact title are missing from "Names the code depends on": `Vocab chip cards — wording and selection` (L151), `Wording style — short, concrete, self-contained` (always cut; it holds O15, O16 and O17), and `### vocabDefinition` / `### vocabChips` in the card contracts.
- **Wall build (`working-wall-html\build.js`):**
  - It refuses more than 2 teaching cards, and chip cards count (L257).
  - It refuses more than 12 chips with «Split into two chip cards.» (L267).
  - `VOCAB_EDUCATIONAL_SVG_*` failures refuse a definition card.
- **Slide checks (`builder\src\validate.js`):**
  - The old flat vocabulary shape (`emoji` or `imagePath` on a word with no `visual`) is refused (L322-329).
  - The semantic Educational SVG check runs on every vocabulary entry (L331-338).
  - Decorations on a vocabulary surface are dropped with a warning, not refused (see N17 in section 3).
- **`builder\src\templates\key-vocabulary.js`:**
  - The title defaults to "Key Vocabulary", with words at 20-44pt and definitions at 0.82 of the word size, never larger.
  - A picture that cannot draw (unknown type, unsourced photo, unresolved SVG) silently becomes a text-only card with a warning (`content\vocab.js` L65-99). It is not refused.
  - The refusal message also suggests splitting the introductions (section 4, pair 7).
  - The slide `words[]` slot names (`word`, `definition`, `visual`; the design's field is `term`) are code names the ledger does not list.

---

## 6. Stories

- **Decay, plaque and acid placement (18 September): the ledger is right, it is not in the log.**
  - The only log line mentioning the three words is L962, which is about `reasoningWords`, a different point.
  - The release that added the check has no log entry at all: commit `8ab4801b`, «A vocabulary card sits in front of the beat that needs the word (4.2.234)». The log's headings jump from 4.2.222 to 4.2.235.
  - Confirmed: the designer file says «another three beats» and the validator comment (L1437) says «another four», while both say «two beats of other work».
- **Piccadilly fountain: the ledger is wrong, the story is in the log.**
  - `build-review-log.md` L2212: «the Shaftesbury Memorial fountain, the one piece of ascribed significance in the room, was spent as a vocabulary hook.»
  - Only "Piccadilly Circus" and "on a vocabulary card" are absent. It does not need copying before it can leave; at most add the location.
- **Also: D05 is fully logged, not "partly".**
  - L3443 has «`belief` was right; a family round a table is a celebration and singing the same carol each year is a tradition.»
- The other cited log lines were spot-checked and match: L661, L3564, L2198, L2103, L1233.
