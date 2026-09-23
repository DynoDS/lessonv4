# Independent check of the assumed-knowledge ledger

Checked against lesson-v4 at `3de9c956` (4.2.284), the ledger's own snapshot;
the plugin working tree has no local changes. Read-only: nothing in the repo
was changed except this report.

Line numbers are file lines at `3de9c956`. The build-review-log was searched
only for section 6.

**Most important, in one line each.** Ten sentences tests already pin have
no row (section 1, items 1 to 5 and 21), including "the final task claims no
more than the evidence children studied" and "a line the final task needs is
teaching". Decision 1 misses five places that allow the script (section 4). A
test pins the very behaviour decision 8 wants to change, and the names list
misses slide titles and more single-word names than the ledger says
(section 5). The ledger's claim that the model check runs in four routes is
wrong: it runs in content lessons only.

---

## 1. Missed rules

How the search was done: every file and line the ledger names (rows and the
appendix) was collected by script, and every quote was located so that
unquoted sentences on a cited line could be listed too. Then every instruction
file in `agents\`, `references\` (with `worksheet-helpers\`), `skills\` and
`commands\` was searched on uncited lines for about ninety wordings that avoid
the topic's obvious words (already know / hold / have / met, prior,
prerequisite, earlier or previous lesson, assume, unfamiliar, never taught,
cold, background, context, referent, orient, make sense, familiar, secure,
recap, reminder, decode, the adult, as a child, period, date, chronology and
others). The core files were then read whole: `lesson-designer.md`,
`design-reviewer.md`, `preferences.md` (Written Voice to Pride Lessons),
`subject-history.md`, `subject-geography.md`, `subject-re.md`,
`subject-science.md`, `subject-pshe.md`, the first half of `subject-maths.md`,
`task-contrasts.md`, and the Dialogic, Discovery and Task-Centred route
excerpts. Finally the test files were searched for pinned sentences that have
no row.

Ordered by how much a fold would lose. Items marked **pinned** have a sentence
a test already asserts, which is the strongest sign the ledger missed them.

### Likely to matter

1. **`references\subject-history.md` L40, pinned** (`test_the_lesson_builds_on_what_children_can_use.py`, the test file for this very topic). No row and no appendix entry:
   «**The final task claims no more than the evidence children studied.** When the lesson has taught that one child's account cannot speak for every child, the final task, its model answer and its acceptance keep to that: they describe what the accounts studied show and compare those accounts (`George's day was longer than Sarah's`), and a verdict about a whole job or all children (`servants were safer than miners`) needs evidence about that group the lesson actually gave.»
   Its general copy is `references\preferences.md` L521, also pinned, on the line B33 cites but not quoted:
   «The group claim rests on what the lesson taught about the group, with the story as the example; an answer that generalises from the one story alone claims more than one story can show.»
   Group A (what the final task may draw on). These are the only two places that apply "work from what was taught" to the model answer and the acceptance, not only to the task.

2. **`references\preferences.md` L776, pinned** (`test_the_class_is_inside_the_lesson.py`). No row:
   «**A line the final task needs is teaching, always, and may never be moved to the script.**»
   with its case (the PSHE `When you rest, it all settles down again` line). Group A, shared with the Teach board. It is the strongest statement of decision 1's position, and decision 1 does not cite it.

3. **`references\subject-history.md` L125, pinned** (`test_five_repairs_from_the_shaftesbury_comparison.py`). No row:
   «**Where the lesson judges a person, the class is told what is being judged.** Designing the character question out is not the same as ruling it out in the room, and children will reach for it anyway: asked how significant somebody was, a nine-year-old answers whether they were kind. So a lesson that evaluates a person says the distinction out loud, once, in the words the class hears, at the point the criteria arrive» ... «One sentence, on the board or in the script.»
   Group G (a question a child answers with their own meaning of a word). The words «on the board or in the script» are one of the pulls decision 1 missed (section 4).

4. **`references\subject-history.md` L38, pinned** (`test_the_board_carries_the_route.py`). No row:
   «**Tell the past in the past tense, and keep the period in view.**» ... «the slide titles name the period (`Why did Tudor children work?`, not `Why did these children work?`)»
   Group H (time and place). Its limit is on the same line: «The limit is the teacher speaking to the class about now (`What does your home need every day?`), which stays in the present because it is.»

5. **`references\subject-re.md` L53, pinned** (`test_needed_is_not_tidy.py`). No row:
   «The choices that protect a child are in the words the class hears and reads, not in a flag to the teacher: that the example can come from school, friends or home; that the time can mean little or bring mixed feelings and still be explained well; and that a private spoken answer can replace writing. A script that says `think about December in your house` three times and offers the alternatives only in a teacher note has withdrawn them from the child who needed them, whatever the flag says.»
   Group I (home and family). It is the only rule that says where the non-assuming alternatives must live.

6. **`references\subject-pshe.md` L46.** No row (I04 cites only L20):
   «No beat needs a child's own experience to be completed; a private choice can stay private (`Use safe distance` above).»
   With L22: «Personal reflection may remain private.» Group I.

7. **`references\subject-pshe.md` L16.** No row:
   «Teach necessary factual, legal, anatomical or safeguarding knowledge directly before asking children to make a judgement that depends on it.»
   Group E. Decision 6 says RE, the discussion route and science carry "teach the knowledge before the judgement"; PSHE does too and is not named.

8. **`references\subject-maths.md` L17.** No row:
   «Give reasoning or problem solving its own enabling teaching when it introduces a genuinely new decision, representation, reading demand or way of thinking. Do not create a second whole-class teaching act merely because a task has been labelled "problem solving".»
   Group A. Decision 9 presents "a new reasoning demand needs preparation" as an extra only the reviewer's copy (A11) carries; this copy has it too, with more (a representation, a reading demand) and a limit.

9. **`references\subject-maths.md` L25.** No row. The maths copy of F13/F14, with its own limits:
   «So the step that grows with the number (finding the ends of the line, the column an exchange moves into) is taught with its own short model and a quick go before the bigger numbers need it» ... «Two limits. The small case is the way in, not the lesson, so it takes two or three minutes and the objective's own numbers arrive quickly and carry every bit of the practice and the assessment. And it is not always available: where the difficulty genuinely is the size of the number, or where the small case behaves differently from the general one, teach the real case and scaffold it instead.»
   Group F.

10. **`references\task-contrasts.md` L25.** No row (A10 is the only contrast listed):
    «Adding a second cell brings in a second relationship (more cells, a brighter bulb), so it is a fair question only once that has been taught as well; it is not the same thinking with a new variable.»
    Group A, calibration: the science example of "a new explanatory mechanism is not" (A03), and the only one that says a changed condition can smuggle in an untaught relationship.

11. **`references\subject-history.md` L214 and L217.** No row:
    «Every lesson moves the argument forward and ends with something banked that the final lesson will use. So the design names what this lesson banks.» / «Where the brief gives the enquiry question, treat it as the thing this lesson serves.»
    Group F. The one place that asks a lesson to record what it leaves for later lessons, which is the evidence decision 2 is looking for.

12. **`references\subject-history.md` L203.** No row, and not in the appendix's starters list:
    «Causal and interpretive material needs re-explaining rather than only retrieving, and a starter that pulls back six dates children can chant tells you nothing about whether the explanation survived the week.»
    Group F (shared with starters). A reason for decision 3 that the ledger does not cite.

13. **`references\do-beats.md` L538** (10.9 Connect It Back). No row:
    «**SEND access:** the older idea is the familiar half, so the child is reasoning from something secure.»
    Group F. It assumes last week's idea is secure, against F01's «Prior exposure is not proof of mastery» (section 4).

14. **`references\evidence-synthesis.md` L233 and L249**, the Dialogic and Task-Centred `Use when` paragraphs, which `read-reference.py --structure-menu` prints to the designer at the structure decision. No rows (E12 and E21 quote the component file, which is read only later):
    - L233: «(b) children have a stake or anchor to speak from — lived experience, accessible scenarios, or prior content knowledge with substance;»
    - L249: «One sustained real task is the lesson's centre of gravity, children largely hold the knowledge or skill needed to begin, and the completed task is the main evidence of learning.»
    Group E. Code names: the `**Use when.**` marker (the menu raises an error unless each structure has exactly one).

15. **`agents\design-reviewer.md` L234.** No row:
    «For needed support omitted from a sheet, check the planned shared access before making a finding; do not assume either that nothing is available or that the board will always be there;»
    Group J. The reviewer's side of the J03/J04 question the ledger parks for worksheets; it sits between the two.

16. **`agents\worksheet-designer.md` L912-916** (rule 13). No row:
    «Omit a duplicated panel when the surrounding lesson context already supplies the reference adequately. Include the exact concise criteria when the sheet must stand independently or access depends on that reference»
    Group J. It already names "a sheet that must stand independently", the category the ledger says nothing defines.

17. **`references\preferences.md` L692 and L713.** No rows:
    - L692: «Whatever is already on the slides while they work, most often the success-criteria panel, is on the board for them to consult, so reprinting it on the sheet duplicates what they can already see and spends the space the frame needs.»
    - L713: «drop a reference the board is already showing while they work»
    Group J. Two more places where a sheet may assume the board, beside J03 («cannot assume an unseen board»).

18. **`references\slide-composition-playbook.md` L157.** Filed in the appendix under "the teacher's knowledge", but it is the reverse J rule (the board may assume the sheet):
    «**The board does not reprint what is already in the child's hands, and it says whose sheet the work is on.**» with its limit «The limit is material children need while working that the sheet does not carry, such as a word bank, a worked example they refer back to or a diagram too large to print: that stays on the board.»

### Shared rows the ledger promised but does not list

The ledger says rows owned by vocabulary, the rhythm and quick checks are "listed here marked shared". These are not listed at all.

19. **Vocabulary's VOC-H01, `references\preferences.md` L371**: «This one runs the other way: read the finished teaching and find the words a child has to already hold for a sentence to land.» Decision 8 and "Found in passing" both lean on this rule, and it has no AK row.

20. **Vocabulary's VOC-J01, `references\preferences.md` L53**: «Use a clear bridge when a word or idea is unfamiliar: `which means...`, `for example...`, `it's like when...`, a concrete comparison, a picture, or a brief parenthetical explanation may all help.» The words «or idea» reach past vocabulary into group B.

21. **The correctness handover (rhythm), pinned** (`test_the_lesson_builds_on_what_children_can_use.py` pins all four):
    - `references\preferences.md` L222: «**When later work builds on what children produced, the class has the right version first.** Give the teacher the expected answer and the one correction that matters through the existing answer and `teacherInfo` route, so a class that sorted the deal wrongly does not spend the next task treating its own mistake as the history.»
    - `agents\lesson-designer.md` L513 (A21's line, unquoted sentence): «Where a later beat works on what children produced in an earlier one, the earlier unit's `answer` or `teacherInfo` gives the teacher the expected version and the one correction that matters, so a class's mistake is not what the next task builds on»
    - `agents\design-reviewer.md` L200 (B18's line): «Where a later beat works on what children produced earlier, check the correctness handover» ... «its absence is a purposeful design defect when the later task depends on it»
    - `references\task-contrasts.md` L77: «the teacher confirms the fault before anyone builds on it»
    Group A: what children "hold" at a later point includes their own product, which may be wrong.

22. **The familiarity and grouping boundary (rhythm).** `references\preferences.md` L182 (A28 and F27's line, unquoted): «Several names under a shared heading, or several variations of one method, do not make them one already-understood idea. Where the objective requires children to name and describe each unfamiliar member of a set, normally teach and let children use each member’s defining knowledge before moving on; naming them together and adding a shared task is not equivalent.» Reviewer copy, `agents\design-reviewer.md` L166: «When the objective requires naming and describing several unfamiliar members, trace each member’s defining explanation and immediate pupil use».

23. **The backward trace, designer and reviewer copies of A20 (rhythm).** `agents\lesson-designer.md` L114: «Test the cumulative route by working a representative final performance backwards to its taught ingredients, then forwards through their first use»; `agents\design-reviewer.md` L166: «Trace a representative final performance backwards to the new learning each part needs, then read the sequence forwards from the child’s starting point». And the designer's copy of A19, `agents\lesson-designer.md` L247: «could a child who did this beat now do that step of the final task without being shown a further move?»

### Smaller rules and copies with no row

24. **`agents\lesson-designer.md` L46**: «A supplied `LESSON_PLAN_INPUT` is a **source**: it says what the school intends this lesson to cover and what sits either side of it, and it is authoritative on objective, coverage and sequence.» With `references\lesson-from-plan.md` L39: «`plan-lesson.md` is the plan row: pass it as `LESSON_PLAN_INPUT`». Group F. Together these are how F10's "has already covered" line reaches the designer as an authoritative source; decision 2 cites the program but not this route.

25. **`agents\design-reviewer.md` L311** (cross-section sweep): «- Apply against learning actually taught;» Group A, check.

26. **`references\subject-science.md` L39 and L53**: «Explain enough first when children would otherwise not know what to notice or would form unsupported conclusions.» / «Ask for a prediction with a reason based on the child’s current scientific thinking. A blind guess is not useful prediction evidence.» Group E (science's copies of E23's reasoning).

27. **`references\subject-re.md` L9**: «Use **Dialogic** only when the question is genuinely open after children have the knowledge needed to reason.» Group E, RE's copy of E10.

28. **`references\subject-geography.md` L68, L21 and L25.**
    - L68: «Children need both pictures in place before they can weigh them, and the criteria for comparing (climate, relief, vegetation, settlement, how people live) are what the lesson teaches them to use.» Group E.
    - L21: «Children arrive having been to different places, so their own experience is comparison material worth using.» Group I (a permission to use experience, beside I01's caution).
    - L25: «which means the technique is taught in the room before children are asked to use it» Group E.

29. **`references\subject-history.md` L87** (group D, a story's provenance): «And a well-told story is one interpretation delivered as settled fact, which is the opposite of what the subject claims about itself, so a story is worth a sentence somewhere saying how we know any of it.»

30. **`references\subject-history.md` L156** (group H): «two dated sources from inside one period do not need a timeline, they need their dates in their captions»

31. **`references\preferences.md` L111** (your calibration example, group B, with its answer-protecting limit): «If those sentences are background explanation whose causal relationship children are meant to be told, connect the relationship explicitly. If they are the evidence/stimulus from which children are meant to infer the effect of reduced fish numbers, do **not** add the inference itself.»

32. **`agents\slide-designer.md` L664** (group B, the slide designer's only instruction when context is missing): «one line per unit missing essential visible evidence, context or a usable state for its planned live action, naming the unit. Report an upstream content defect to its owner; do not repair it by inventing teaching.» And its own caption rule at L323, a copy of D11 with more in it: «Captions identify what an image cannot say on its own: a specific place, time, identity or technical name. Do not caption the obvious, and do not hide task-critical content in small italic caption text.»

33. **`references\teaching-sequence-dialogic.md` L64 and `references\teaching-sequence-task-centred.md` L59** (mechanics, code names). The `grounding-input` unit: «"input": "the exact concise knowledge children need before they can reason sensibly"» (the validator holds its exact keys and lets a Dialogic sequence open with it). And: «Use `investigationBrief` when children need one or two lines of real task context before they can act or predict.» These are where E09 and E23 are recorded; the ledger's code-names list names neither `grounding-input` nor `investigationBrief`.

34. **`references\reasoning-prompts.md` L89** (group A, shared reasoning): «Where one does not, keep the prompt anchored to the knowledge, evidence and performance children actually have.»

35. **`references\subject-maths.md` L97 and L102** (group G, shared worksheets): «One closing ask from a small set children already recognise» (a "may assume", like G28), and «Name what the child can see, in the lesson's words.» ... «A term the lesson taught (`halfway`, `interval`, `exchange`) is used normally.»

36. **`references\adaptive-adaptation.md` L64-68 and L35** (group L, shared adaptation): the default assumption of what a Below child holds, «Use these defaults unless the teacher's brief names a specific working level.» / «| Y2, Y3, Y4 | Two years below |», and «the child does not yet have what it rests on. Name the prerequisite and why it is needed.»

37. **`references\preferences.md` L539** is filed in the appendix under "the teacher's knowledge", but its second sentence is about the child and bears on decision 1: «Notes supply concrete spoken modelling and subject backup; they must not be the sole home of evidence children must read or a result they must inspect.»

---

## 2. Duplicates that are not duplicates

Every row marked "duplicate" was read beside the row it copies, on the full
line of each file, not only the quoted part. Rows marked "near-duplicate" were
read too, where the ledger's note of what they add is incomplete. Listed only
where a fold into the named row would lose something.

1. **AK-B03 is not a duplicate of AK-B02: each discounts a different surface.** B02 (designer L58) says «A definition card, diagram label or mention in a script does not alone establish understanding.» B03 (reviewer L166) says «A named category or fact appearing on a slide is not by itself evidence that children can understand and use it.» Together they say neither a script mention nor a board mention is enough on its own. A fold keeping only B02's wording keeps the script half and loses the board half, and decision 1's "only what the board has shown counts" would then read as "anything on the board counts". Keep both clauses.

2. **AK-A31 is stronger than AK-A21.** A21 (designer L513): «Every distinct case children must do independently needs prior modelling or guidance». A31 (skill route L23) requires the case to have been «*seen each one worked*», adds a prohibition A21 lacks, «Do not introduce an unmodelled case that changes the procedure.», and on the same line says where the extra case goes: «Reaching an unmodelled case means another example inside the My Turn when it teaches the same move, or a second cycle when the case is genuinely a different move». "Modelling or guidance" is weaker than "seen worked".

3. **AK-A30 has a different strength from AK-A28.** A28 (preferences L182) is permissive: «an unfamiliar inference may need an explicit model and guided attempt». A30 (history L19) is an instruction: «Give an unfamiliar thinking move enough explicit modelling and guided use to prepare the later task.» The ledger itself grades A28 "default" and A30 "must". Folding history's copy into A28 turns a must into a may.

4. **AK-A16 carries a second defect AK-A15 does not.** A15 (content route L15) names one failure, a Practise brought forward before its knowledge is taught. A16 (route checks L13) adds «or an early Practise followed by beats kept only because they were already written, is a purposeful design defect», and scopes the evidence to this lesson: «does the class hold, from the pairs before it, everything the work runs on».

5. **AK-A08 carries two things AK-A03 lacks.** A08 (reviewer L191): «Stronger reasoning never means untaught knowledge, trick wording or avoidable reading.» A03's nearest sentence is «not from more facts, longer answers or harder words». "Avoidable reading" is not in A03. A08 also closes a paragraph of limits the ledger does not quote (see section 3, item 4).

6. **AK-A26 and AK-A25 each lack part of the other.** A25 (maths L83) covers «a form or a context the lesson never used» and says where the lesson meets it: «as a practise or apply beat after the cycles». A26 (reviewer L261) says only «a form the lesson never used» (no context) and adds its own instruction: «rather than only flagging the sheet».

7. **AK-B18 is a ceiling and a removal, AK-B15 a floor and a permission.** B15: «Give children the context needed to enter the first example» and «This does not require a manufactured Do activity». B18 (reviewer L200): «keep only the orientation needed to enter the example ... and remove a manufactured Do», triggered by «A Teach→Do pair whose Do nothing later uses is orientation wearing a chunk's clothes». "Keep only" and "remove" are not in B15. (B16 at content L27 is also a prohibition, «without inventing a Do for scene-setting», where B15 is a permission.)

8. **AK-F02 carries a limit AK-F01 lacks, and its proposed home is a fold.** F02 (evidence-synthesis L265): «Produce one coherent lesson with essential foundations visible; the live teacher adapts pace and support.» F01 has no "one coherent lesson" and nothing about the live teacher adapting. This is the limit that stops prior knowledge being answered with several versions of the lesson; a fold into LD-PRIOR must carry it.

9. **AK-H06 is not a duplicate of AK-H04.** H04 is how the teacher teaches a location (work outward from the known). H06 (geography L76) is a Do beat children do: «**Mark it.** Put the river, city or biome on a blank map, working outward from what the class already holds.» Different job, different owner (geography's Do beat list).

10. **AK-G29 is filed against the wrong row.** It is marked a duplicate of G23 (supply a meaning the words leave out), but its test is the untaught noun: «The tell is a noun the child has not been taught to use; the same tell catches a shorter label that still needs translating». That is G10's planning-noun test, and its line opens «**A step is written in the child's own words, not the plan's.**»

11. **AK-G24 carries your 4.2.209 ruling, which AK-G23 lacks.** The sentence after G24's quote at designer L293: «and a word this lesson brought in to name something the child can already see (the ends of a line called `landmarks`) is one of those meanings, even when it has a vocabulary slide.» G25 (reviewer L210) carries the same, plus «as the weakest child with the teaching over». A fold to G23 loses the ruling (shared with success criteria, but marked a duplicate here).

12. **AK-D12's limit is missing from its note.** The ledger calls D12 a near-duplicate of D06 without saying what it adds. It adds an exception decision 7 must keep: «The limit is a caption that carries something a child needs and nothing else on the slide says: a source's date and maker, a place's name, which of two pictures is which.» A "say it once" rule without it would strip a needed date or maker from a returning picture.

13. **AK-A11's extras are larger than the ledger says.** Decision 9 carries only «a new reasoning demand needs preparation» into the home. The same reviewer paragraph (L170) holds three limits that a pointer would lose: «including after a freshness repair», «Reaching the same conclusion is also legitimate when children examine each case to earn it.» and «Do not make every answer different or strip useful support to manufacture independence.»

14. **AK-F14's line carries limits on the short cycle that AK-F13 lacks.** Skill route L221, unquoted: «It is not a lesson inside the lesson: one move, modelled on one or two cases and used once, and its criteria are the first steps of the main method's criteria, word for word, so the panel children meet next already starts with them.»

15. **Two duplicates differ in strength (both shared, noted for the owning topics).**
    - AK-F26 (evidence-synthesis L32) says «Normally retrieve the previous lesson when it is known»; AK-F23 (preferences L282) says «- **If the prior lesson is known** — retrieve that lesson's learning.» Default against must.
    - AK-I03 (dialogic L17) says flatly «Do not assume children share the same family circumstances, personal experience or emotional safety.»; AK-I01 (preferences L523) says «Avoid unnecessarily forcing personal disclosure or assuming children share ...», where "unnecessarily" may be read as qualifying the assuming too (unsure). I03's absolute form should survive a fold.

---

## 3. Strength and scope

About seventy rows were checked against the full line they sit on (every row
in groups A, B, D, E and F that is not marked shared, most of G, H, I and J,
and K01). Most hold. These do not; each gives the words the row leaves out.

1. **AK-A13 (preferences L63) lists no exceptions, and its own paragraph gives three.** «It may be revealed or produced live; the starting slide need not be a finished explanation. Notes support delivery and subject knowledge, and they may say the same thing more fully. If children genuinely need more visible material than fits, reform or split the teaching moment rather than hiding it in notes.» A fold that keeps only «must have been visible on a slide before it, not only spoken» loses the live-reveal permission and the split-rather-than-hide repair.

2. **AK-A12 (reviewer L197) leaves out its limit.** The same bullet ends: «A topic-relevant picture, a correct headline or a claim of substantive teaching in the rationale is not sufficient by itself. Accept concise teaching and simple examples when they do supply what children need; richness is not a count of facts, images or activities;» The second sentence is the reviewer's protection against demanding more teaching than a task needs.

3. **AK-E29 (history L105), "must not", has an exception the row omits.** «The limit is that talking as somebody from the past is fine as a way into thinking about their reasons, in the moment, aloud. It is putting it on the page as the lesson's outcome that turns it into fiction with a date on it.»

4. **AK-A08 (reviewer L191) is scoped "every review" but closes a paragraph of limits on the two probes.** «Apply both with their limits. A retrieval starter is meant to use what children already know.» ... «A source on the page may be exactly what children should read and interpret. Do not reject any of these because the information is supplied or the task is straightforward; judge what the task claims to accomplish». These are the exceptions to the "only what children can use" probe (a retrieval starter is allowed to rest on prior knowledge) and belong in the scope of A07/A08.

5. **AK-D13 (content route L29) is graded "may" but is half "must not".** «A caption may identify the source briefly; it must not be the only place where learning-critical evidence appears.»

6. **AK-D14 (history L34) omits its limit.** The same line: «A thematic comparison may move between periods; chronological order and a dependency between every adjacent source are not requirements.»

7. **AK-J04 (worksheet designer L556) is graded "must" but is a permission with three conditions, and the row quotes only the second.** The rule: «You may take one off on your own judgement, including one marked required, when all three hold: no question's wording depends on reading it *from the sheet* ... the child demonstrably meets it elsewhere in this lesson ... and the page genuinely does not fit with it.» Strength should be "may, only when all three hold". The first and third conditions matter to the J03/J04 decision.

8. **AK-G14 and AK-G15 ("must not", exam-paper wording) lack the exception at preferences L55**, which the appendix files under "launches and forms the class already knows": «when the work is preparing children for a form they will really meet, preserve the language and structure of that form, so the test's register is familiar before the test asks it. Slides may use that language when it fits, and a worksheet may carry a test's exact form when the lesson is genuinely practising that form.»

9. **AK-I01 (preferences L523) omits its permission.** The same paragraph: «Personal reflection remains available when it is genuinely suitable.»

10. **AK-B08 (designer L213)'s scope column names only one exception.** It lists "familiar objects and tasks", but the quote carries a second: «Withhold support only where the task explicitly assesses the knowledge it would reveal.»

11. **AK-G06 (preferences L545)'s exception has its own limit, which the scope column drops.** «The limit is the prompt whose difficulty is the point ... Even there the child has to know what they are being asked *for*; they just should not find it easy.»

12. **AK-G13 (preferences L69)'s scope omits its exception.** «A plain noun label is fine when it names a thing to fill in (`Object name`); it stops being fine when it names a category of thinking (`Visible clue`, `Criterion`, `Attribute`).»

13. **AK-F20 (skill route L45) omits the sentence most about this topic.** «The final task should demonstrate the approved learning: use a whole transformation when that is the objective, but do not require unaided whole-passage performance before the component difficulties are prepared. Equally, do not split a familiar process into unnecessary cycles.»

14. **AK-H04 (content route L41) omits its size limit.** «In practice this is usually one extra visual beat rather than a new chunk: the world map with the continent picked out, then the closer map.»

15. **AK-B04 (preferences L547): the repair's strength and medium are softer than the row suggests.** The row is "must", which fits the heading, but the repair is «One sentence, before the case, in the words the class hears, is usually the whole repair». "Usually" and "the words the class hears" matter to decision 1 (section 4).

16. **AK-F22 (content route L53): the scope in "What the code enforces" is wider than the code.** See section 5, item 3.

17. **AK-F19 (skill route L31), graded "default": unsure.** «Decide which is new — the tool or the content — and keep the familiar one simple» is written as an instruction; "must" may be the fairer grade.

---

## 4. Disagreements

All ten decisions describe pulls that are really in the text. Four of them are
wider than the ledger says, and five pairs are not raised at all.

### Decisions whose pull is wider or narrower than stated

**Decision 1 (does something only said count as taught?).** Real, and the ledger understates both sides.

- *More places side with the board* than the ledger cites: preferences L776 (section 1, item 2), «**A line the final task needs is teaching, always, and may never be moved to the script.**»; the reviewer's weak-understanding probe at L187, «using only what is on the board and everyday sense»; the designer's own step 4 at L60, «from the board and everyday sense»; the content route L29, «The slide also carries enough concise, accurate visible information for children and a teacher who does not use the notes to understand the core idea»; and preferences L535, «they do not rescue missing essential meaning».
- *More places allow the script*, and the decision's suggestion ("something only spoken does not count as prepared") would overrule them without saying so:
  - history L125: «One sentence, on the board or in the script.» (the "not whether he was nice" distinction);
  - the reviewer's language check, L237: «every taught idea is intelligible through the visible content and planned teacher action» ... «On a content Teach, use `explanation` for necessary visible meaning, without forcing every spoken reason into a panel»;
  - preferences L625, framing-in-notes: «What lives in the notes here is the teacher's *framing* of the task — the orientation, the why-it-matters, the longer description of what's ahead.» Orientation is exactly what B15 says children need to enter the first example;
  - the skill route L75, where the script is the designed home of the Our Turn's guiding questions: «so the script is their only home: an Our Turn slide shows the example, the success criteria and the helper, and nothing the teacher only says»;
  - B04's own repair, «One sentence, before the case, in the words the class hears».
- *The softer side is softer than stated.* B02 does say «seen, heard or done», but the same passage ends «A definition card, diagram label or mention in a script does not alone establish understanding», so B02 already discounts a script-only mention.
- *The leak direction must survive.* Two rules count the script as heard when it gives an answer away: designer L512, «Read teacher scripts alongside prompts and support: hiding a reminder does not preserve a diagnostic decision if the script supplies it», and preferences L497, «Read the spoken script too, because it can supply a decision that the printed support carefully withholds». A "spoken does not count" wording must be scoped to preparation, or it reads as licence to ignore these.

**Decision 2 (what counts as taught in an earlier lesson).** Real. Three corrections.

- Its example overstates: a bare Lord Shaftesbury name after a plan brief would not satisfy "every rule". F01 still requires «Make the foundation children need for this lesson visible» and says «Prior exposure is not proof of mastery».
- The plan brief it cites is aimed at the starter. The brief prints, straight after the list F10 quotes: "Retrieve what they have recently learned when that is the best warm-up for today's objective, or a prerequisite that builds toward it." (assembled from string pieces in `plan-tracker.py` L214-215). It is still read by the designer as an authoritative source (section 1, item 24), so the pull stands, but the program's own intent is narrower than the ledger implies.
- Existing mechanisms the suggestion could use are not mentioned: history L214, «So the design names what this lesson banks», and F07's «A plan says what it covered; its `lesson-design.json` holds the words children actually saw.»

**Decision 4 (explain a name in every subject).** Real for names on the board, but "science, RE and PSHE say nothing" overstates. Every designer is told, in general terms, to bridge anything unfamiliar: G19 (designer L88), «concrete explanations of anything unfamiliar» (for the script), and VOC-J01 (preferences L53), «Use a clear bridge when a word or idea is unfamiliar». What only history adds is where (on the board, where it first appears) and how (a clause). The suggestion should say it sits beside these, not that nothing exists.

**Decision 5 (the source-explaining test).** Real, and worse than stated: the pointer in D04 (`subject-history.md` → `A real source needs an accessible route`) names a bold lead, not a heading, so the bundled section reader cannot select it even for a designer who tries (it sits under `Optional decoration on sensitive history`, as "Found in passing" notes).

**Decision 6 (knowledge before judgement for every beat).** Real, but the general rule suggested would collide with sanctioned reason-before-teaching moves the decision does not list: history E02 (speculation at the start, «It does not matter that they know nothing yet»); geography L66, «Where the pattern is legible, show it and ask before you explain»; the whole Discovery route (explore before `teach-why`); the skill route's attempt-first, L7, «its job is to give the full modelling that follows immediately something real to explain»; maths L47, «**Estimate first:**»; and A02, «interpreting it can be the whole point». A per-beat check for every subject needs those exceptions written in. PSHE L16 is a further copy of the rule (section 1, item 7).

**Decision 7 (words about where a source came from).** Real between D05 and D06. Two of its citations are weaker than presented: D11's «technical name» is the technical name of the thing pictured, not a label for the source's type; and D12 says a caption must be «honest about what a picture is (a reconstruction ...)» without saying the word goes on the board. D12's limit (section 2, item 12) must survive the fold.

**Decision 9 (one home for "work from what children can use").** The three extras listed are real, but there are more: maths L17's copy of "a new reasoning demand needs preparation" (section 1, item 8), history L40 and preferences L521 (the model answer and acceptance claim no more than was taught, section 1, item 1), and A11's three limits (section 2, item 13).

### Pairs the ledger did not raise

1. **Do-beats 10.9 against F01 and F16 (is last week's idea secure?).** `references\do-beats.md` L538: «the older idea is the familiar half, so the child is reasoning from something secure.» Against F01, «Prior exposure is not proof of mastery», and F16, «not an assumption it is still secure». This belongs with decision 3.

2. **The reviewer against itself on spoken reasons.** Reviewer L44: «a sentence that teaches in the script and has no counterpart on the board is the finding, named by beat and sentence» (with preferences L531, «Neither carries teaching the other lacks», and L796, «nothing that teaches in the script is missing from the board»). Reviewer L237: «without forcing every spoken reason into a panel». Both are in the file the reviewer reads whole. This belongs with decision 1.

3. **Orientation in the notes against orientation children need.** Preferences L625 puts «the orientation, the why-it-matters» in the notes for task-framing slides; B15 says «Give children the context needed to enter the first example»; B04 says «One sentence, before the case, in the words the class hears». Under decision 1's suggestion, orientation left in the notes would count as unprepared. The decision needs to say whether orientation and framing are exempt.

4. **Using children's own experience.** I01, I03 and PSHE L46 («No beat needs a child's own experience to be completed») against geography L21 («their own experience is comparison material worth using»), B19's elicitation from «being a person» and the PSHE starter prompts at preferences L291 («"Think of a time when…"»). Unsure whether these truly conflict (a starter is not a Do beat, and the geography line is a permission), but a fold of group I has to state which experiences may be assumed.

5. **Which sheets may assume the board (wider than the ledger's J03/J04 note).** J03, «a resource intended for use on its own cannot assume an unseen board», against J04 (a reference may be dropped when met on the board or wall), preferences L692 and L713 (drop what the board shows), worksheet designer rule 13 («when the sheet must stand independently»), reviewer L234 («do not assume either that nothing is available or that the board will always be there») and the playbook L157 (the board may assume the sheet). Six places, one undefined category.

---

## 5. Code and tests

`board_names_in` was run on sample strings to test the ledger's claims about
the review page (script in the scratchpad; nothing in the repo was run against
or changed).

1. **The names list misses more than "a one-word name that opens a sentence".** `design-review-packet.py` `board_names_in` (L1324) splits text at `. ! ? : ;`, line breaks, table cells (` | `) and opening quotation marks, then drops any single capitalised word at the start of a piece. Results:
   - `Answer: Shaftesbury` gives nothing; `Who changed the law? Shaftesbury.` gives nothing;
   - a card or line holding one name (`Victoria`, `Parliament`, one per line) gives nothing, so a sort, match or option bank whose items are single names never reaches the list;
   - `"Victoria was queen," said Sam.` gives only `Sam`;
   - `Tudor children worked.` gives nothing, while `Many Tudor children helped.` gives `Tudor`.
   The ledger's decision 8 and "What it does not enforce" describe only the sentence-opening case.

2. **Slide titles are never read for names.** `build_board_names` (L1378) reads each unit through `class_view_unit` (L991), which reads `content` fields, `pupilInstruction`, `taskStructure`, criteria, sticky facts, the answer and the script, but not the unit's `label`, which is the slide title (`lesson-designer.md` L68). A name that first appears in a title (`Why do we remember Lord Shaftesbury?`) is listed at a later beat or not at all. Not in the ledger. The fields read are fixed by `CHILD_FACING_CONTENT_KEYS` (L52), a code name the ledger does not list.

3. **"Said earlier" is a substring test.** L1399: `first_seen[name] = (unit["label"], name in said_before)`, where `said_before` is every earlier string joined, script included. So `Victoria` is marked "said earlier" if `Victorian` appeared before it. The ledger records the script half, not the substring half.

4. **A test pins the behaviour decision 8 wants to change, and the ledger does not say so.** `test_the_leisure_lesson_repairs.py`, `test_sentence_openers_labels_and_numerals_are_not_names`, asserts that `board_names_in("Every Tudor child stopped watching plays. Use the rides to explain. (a) Listen to each other. Children's lives | Play and learning. Label A and B. Write XLIV in numbers.")` returns exactly `["Tudor"]`. `Listen` and `Play` are not in `SENTENCE_OPENERS`; they are dropped only because they are one word at the start of a piece. Listing "a one-word name at the start of a sentence" would list them and fail this test. Telling `Shaftesbury wanted` from `Listen to each other` needs a word list or a different signal, so decision 8 is less simple than "a program change with its own test" suggests, and this test moves with it.

5. **F22's enforcement is narrower than the ledger says.** The ledger's "What the code enforces" says "a content, discovery, dialogic or task-centred Practise asking for a written explanation or comparison is refused unless this lesson has shown a good one". `validate_explanation_task_is_modelled` (`validate-lesson-design.py` L1307) returns at once for Skill-based and checks only units of kind `practise`, and `ROUTE_KINDS` (L186) gives `practise` to Content-based and Skill-based alone. Discovery's `use-learning`, Dialogic's ending and Task-Centred's `do-task` are never checked. In practice the refusal is Content-based only.

6. **The plan brief has a second "already covered" branch, and a scope the ledger drops.** `plan-tracker.py` `prior_context` (L201). Its strings are split across source lines, so these are the printed words, not file quotes:
   - the ledger quotes the same-unit branch; the first lesson of a new unit (L222-223) prints "The class has just finished "(previous unit)", covering:" with the whole previous unit's objectives;
   - both branches end on the starter: "Retrieve what they have recently learned when that is the best warm-up for today's objective, or a prerequisite that builds toward it." / "Bridge from it if that helps, or retrieve a prerequisite that builds toward today's objective.", and the function's docstring says «What the class covered just before, so the starter can connect back.»;
   - "covered" is plan order, not teaching: the tracker builds up to a buffer of lessons ahead of what has been saved (`buffer` 5 for daily subjects, 2 otherwise, L189; `buffer_full`, L268), so lessons listed as "already covered" may not have been taught when the brief is written.
   The new-unit branch is pinned (`test_plan_tracker.py` L115, «opens a new unit»); the words "has already covered" are not pinned by any test, so decision 2 can change them freely.

7. **`PREVIOUS_LESSON` is "built last", while the designer is told "had last".** F07 (designer L127): «`PREVIOUS_LESSON_DIR`, when given, is the lesson children had last in this subject.» `resolve-filing.py` L24 documents it as «the working folder of the lesson this run built last in the same year and subject», and outside sorted mode `latest_lesson` (L113) takes the most recently written `lesson-design.json` in that year and subject, with no check that it is a different lesson or that it has been taught. With the plan buffer it can be a lesson not yet taught. Unsure, needs a check before the leisure rerun: a rebuild of the same lesson may be handed its own earlier build as "the lesson children had last". The ledger states the code correctly but does not flag the gap with the text. (Outside the two scripts the brief names, included because it is the code behind F07 and decision 2.)

8. **Code names the ledger's list omits.** `grounding-input` and its `input` key (exact keys enforced, and a Dialogic sequence may open with it: `validate-lesson-design.py` L1797, L2814); `investigationBrief` on `set-task` (L1842-1845); the `**Use when.**` marker that `read-reference.py --structure-menu` requires exactly once per structure (L206-217), which makes the Dialogic and Task-Centred menu paragraphs (section 1, item 14) code-read text like E18; and `CHILD_FACING_CONTENT_KEYS` (item 2 above).

9. **The one place the code already enforces "on the board, not only the script" is vocabulary's**, and decision 1 could cite it: `validate-lesson-design.py` L1563-1577 refuses a newly introduced word that the next beat has only in its script, and its comment cites your 22 September ruling, "it should be on the board, not just the script".

10. **Pinned rows.** The ledger's list of 55 test-pinned rows matches a scripted search of the tests. What it misses is pinned sentences with no row at all: history L40 and preferences L521 (section 1, item 1), preferences L776 (item 2), history L125 (item 3), history L38 (item 4), RE L53 (item 5), and the four correctness-handover sentences (item 21), all asserted by `test_the_lesson_builds_on_what_children_can_use.py`, `test_the_class_is_inside_the_lesson.py`, `test_five_repairs_from_the_shaftesbury_comparison.py`, `test_the_board_carries_the_route.py` and `test_needed_is_not_tidy.py`. A fold that moves any of them moves those tests.

---

## 6. Stories

`build-review-log.md` was searched case-insensitively for every story in the
ledger's table and for the stories carried by the rows found in section 1.

**The ledger's table is right on 13 of 14.** A14 (Sophie, breathing) is not in
the log: "breathing" appears only at L2057, in an unrelated sentence («a caveat
the teacher gives in a breath»). D08 (Sarah Gooder, George, Sam) is not in the
log: no hit for Gooder, servant boy or bird scarer. D02 is partly there, as
stated (L4319 names Elizabeth I, a government, an order, `modern summary` and
the Thames; no 1590, plays or bear-baiting). B05 (L2071, L2095), B21 (L2254),
B33 (L659), B34 (L4008), G02 (L1233), G06 (L1451), G09 (L2242, L2252), A17
(L975), D12 (L1223 and L1263) and K01 (L4319) are all there.

**One correction.** AK-F14's story is marked "Yes (4.2.221, L1015)". The event
is there (L1017: «children could not find the two multiples of 10 either side
of a number, worst with hundreds and thousands»), but the case F14's line
carries is not: no hit for `3,998`, and none for the repair's `528` and
`5,996`. By the standard the ledger applies to D02 this is "partly".

**Stories on the rows section 1 adds:**

- preferences L776, the PSHE `When you rest, it all settles down again` line (12 September): in the log, L2057.
- history L38, the Tudor cases told in the present tense (14 September): in the log, L1243-1247.
- maths L25, «could not find the two tens either side of 346 or 3,998 ... (17 September 2026)»: the event is in the 4.2.221 entry, the numbers are not (the only `346` in the log is `5,346` at L1656, a wall card).
- RE L53, the script saying «`think about December in your house`» three times: not in the log (undated; it could stay as a plain example).
- A10's «which in the case this came from was also unverified» (undated): the case is in the log, L1125 («untaught, unverified laws and guild rules»).

**One log entry bears on decision 7.** L1263 records that the caption box on
two Teach layouts is too short for your wording: «The caption box on the
`picture-top-cards` layout holds 29 characters and on `banner-picture-sidebar`
44, which forced `reconstructed` into a caption he wanted to read `as it might
have looked`; noted, not fixed.» A yes to decision 7 on those layouts meets a
capacity limit, not only a wording rule.
