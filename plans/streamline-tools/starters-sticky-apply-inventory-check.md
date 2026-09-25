# Independent check of the starters, sticky knowledge and Apply ledger (SA-)

Checked on 24 September 2026 against the plugin's working tree (lesson-v4 4.2.287, commit `79426973`, with the success-criteria change 4.2.288 uncommitted on top), the same snapshot the ledger quotes. Read-only: nothing in the plugin or the ledger was changed. Line numbers are working-tree lines.

How the search was done: every file and line the ledger cites (rows and the "belongs elsewhere" appendix) was collected by script (`scratch/sachk/sa_cited.py`), then every instruction file in `agents`, `references` (not the build log), `skills` and `commands` was searched for uncited lines on starter, sticky, apply, hook, retrieval, recap, last lesson, prior knowledge, takeaway, remember, exit, plenary, closing, next lesson, ending, final task, opening, warm-up, SATs, test question and reflect (`sa_hits.py`). The ledger's core sections were then read whole for sentences on a cited line that no «quote» covers: preferences Starters, Sticky Knowledge, The Apply Slide, Practising a Test Question and Purposeful Endings; the designer's Starter, Sticky Knowledge and Apply Slide; evidence-synthesis §1 and §8; the contract's starter, sticky and ending blocks; the five routes; templates §1.4, §2.1, §2.8; the wall's sticky rules; the subject files; the validator, the review packet, the builder's starter header and the slide and wall checks. Tonight's other ledgers (`PF-`, `RT-`, `RV-`) were searched for hand-offs to this list.

---

## 1. Missed rules

### Likely to matter

1. **Your 19 September ruling on the starter slide's title is not in the ledger, and two template lines contradict it.** The builder stopped printing a starter `title` in 4.2.256 (only `heading` prints under "Starter"), after your words, kept in `builder/src/layout.js` L74 and the build log L645:
   «It keeps doing little titles for the starter. And I don't know why, because I don't want them in any lesson. Just the starter heading that's underlined is enough.»
   A builder test pins it (`builder/test/starter-heading.test.js` L101: a `title` gives no prompt). Two instruction lines still describe the old behaviour:
   - `references/templates.md` › 1.4 · L139 (the rest of SA-E08): «Give the slide a `title` (or a `heading`) as normal and the builder puts it on a full-width line underneath the label, at slide-title size, where a question is actually readable».
   - `references/templates.md` › 2.8 · L476, no row: «`title` — the starter's own prompt, drawn under the fixed "Starter" heading in the left column.»
   Group E. This changes decision 4 (section 4).

2. **`agents/lesson-designer.md` › Apply Slide · L337.** Two sentences of J17's paragraph have no quote, and the second is the only place the Apply's cost is stated:
   «Two shapes worth knowing because a designer reaching only for "use all of it together" will not find them.»
   «A Year 4 class that has spent thirty minutes judging one man can answer that, it takes two minutes, and it is the beat that turns a lesson about Shaftesbury into a lesson about significance.»
   Group J. It bears on decision 9.

3. **`references/teaching-sequence-skill-based.md` › Cycles · L198.** J29 quotes only the last sentence. The one before names where a skill lesson's reasoning and word problems go, and no ledger holds it:
   «a Practise unit is the work that draws on more than one, and that is where the mixed set after blocked cycles goes, and the reasoning question about the method as a whole, and the word problems the objective earns.»
   Group J. It belongs in decision 11 beside J15 and J31.

4. **`references/preferences.md` › Starters · L311.** D12 quotes the cue rule and its test but not the three ways a cue becomes the answer:
   «A parenthetical that supplies the answer (*an a______ (adjective)*), a definition that already contains the target word, or a gap whose only sensible filler sits right beside it has crossed from cue into answer key, and the child copies instead of recalls.»
   Group D.

5. **`references/preferences.md` › Starters · L317.** B07 quotes the rule and the check but not its calibrating example:
   «Recalling the idea the lesson rests on is retrieval ("some materials absorb sound vibrations"); aiming that same idea at today's exact case ("true or false — felt blocks more sound than foil") quietly settles the result before anyone tests it.»
   Group B.

6. **`references/preferences.md` › Starters · L313.** B05 omits the sentence that puts orientation, not only prediction, outside the starter:
   «An orientation paragraph or framing of the day's task needs the teacher to introduce that task.»
   Group B.

7. **`references/teacher-slide-visual-profile.md` › Semantic colour · L113.** A sticky line about safety stays purple:
   «Neither is a way of making a sentence look important: a sticky-knowledge line is not a warning because it is about safety, it is the thing to remember, and it reads purple like every other one.»
   Group H, beside H34.

8. **`references/lesson-designer-components.md` · L49.** The sheet's one use of a sticky fact is protected when a sheet is trimmed to fit:
   «A prompt that is the retest of a misconception, or the one place a sticky fact is used on the sheet, is never pre-authorised on the ground that the final section "asks a version of the same question"».
   Its contract copy is `references/output-template.md` L846 (WS-N03). Group H, shared with worksheets.

9. **`references/subject-re.md` L51 and `references/subject-pshe.md` L30.** The subject files' copies of J06 (the final task draws on the learning; a separate check is the fallback), written for the reflection endings RE and PSHE use most:
   - RE: «Design the reflection so it draws on that learning» «A reflection a child could have written before the lesson shows the product and none of the RE. A short check of the taught meaning is the fallback only when the reflection honestly cannot carry it».
   - PSHE: «The PSHE learning behind it is the knowledge or the decision the lesson taught, and the reflection draws on it or the lesson has only been told.»
   Group J/L, shared with the subject files. The RE line is the subject-file home of the Christmas case G05 cites.

10. **`references/templates.md` › 1.4 · L141.** E10's exception and reason are unquoted (see section 3):
    «A deck is built days before it is taught and is taught again next year, so a real date in the spec is wrong on the board on the day.»
    «A date that is the lesson's own content is untouched by this: a year on a timeline, a date in a source, a date inside a word problem.»
    Group E.

11. **More traces of the removed test-question starter**, in the same template section as F11 and F12 (`references/templates.md` › 2.8 · L472 to L478), not among the eight the ledger counts:
    «Right side is one full-height zone for the question image.»
    «`question` — the content object for the right zone, normally `{ "type": "image", "imagePath": "<file>.png" }`.»
    «(for example, "Answer the question.")» and «(e.g. `{ "type": "text", "text": "||350 millilitres" }`)», a past-paper style answer.
    Also a trace outside the plugin: `parked/test-question-bank/` at the repository root keeps the old files and "the teaching rules" (build log L77, «Nothing in that folder is guidance»). Group F, marked as traces.

### Misfiled in the appendix

12. **`references/do-beats.md` › 1.6 Retrieval Roulette · L106 to L108.** The appendix files L106 under quick checks, but it is the same kind of line as D13 (1.5), which this list took as a starter rule: mixed older retrieval with none of A07's conditions.
    «A two-column grid: one column random-cued from this topic, one from earlier topics.» «**Best for:** mid-unit lessons where prior topics matter.»
    The routes list handed this to topic 7 by name (`2026-09-23-routes-ledger.md` L142 and L982, row RT-J06: "For that list to decide, not here"). It folds under A07 carrying A07's conditions, as D13 does. Group D.

### Smaller copies and companions with no row

13. **`references/evidence-synthesis.md` › 1 · L29.** The reason a starter primes today's lesson, in no ledger: «Retrieval also activates schemas that upcoming teaching will extend, reducing intrinsic load for the new content.» (RT-O07 holds the interleaving sentence.) Group A.
14. **`references/preferences.md` › Starters · L305.** D02's reason: «Choosing the form that fits what children are actually retrieving makes the warm-up do more in the same few minutes, and stops every lesson opening with the identical ritual children learn to switch off during.» Group D.
15. **`references/working-wall-preferences.md` › Wording style · L98.** I05 quotes one sentence of the paragraph whose heading is the principle decision 7 has to answer: «**5. Prose a child reads may be condensed for the wall; a contract a child checks against may not.** What has to stay word for word is what a child compares board against wall: success criteria steps, reference-table columns, a misconception's "Don't"/"Do" pair.» Group I (the success-criteria list holds it).
16. **`references/working-wall-preferences.md` L253 to L254.** A second copy of the wall budgets in the same file as I06: «about **62 characters** on a card carrying a photograph or picture, and about **106 characters** on a card with no». Group I.
17. **`references/teacher-slide-visual-profile.md` L110.** H34's middle sentence, a limit on marking inside a sticky line: «mark a span inside a sticky line only when that span really is a taught term of its own.» Group H.
18. **`references/subject-history.md` › The "what can we learn from this today" question · L117.** Companion of J37 and of L35 (geography's comparison "bolted on at the end"): «The instinct is right and it runs through the lesson rather than being bolted on at the end.» Group L, shared with subject files.
19. **`references/slide-composition-playbook.md` L224** (shared, the success-criteria list holds it): «A success-criteria, sticky-knowledge or representation reference present on the current source unit stays visible.» The slide side's companion of H26. Group H.
20. **`references/teaching-sequence-skill-based.md` L134** (SC-D40, changed in 4.2.288): «an occasional case is extra knowledge, taught where it comes up through sticky knowledge or the teaching». A copy of G18 that now names sticky knowledge. Group G, shared.
21. **`references/subject-pshe.md` L22** (AK holds it): «Personal reflection may remain private. Protect it from unnecessary public disclosure, collection or marking for its personal content.» It limits a PSHE Reflect or ending (K04, K06). Group K, shared.
22. **`agents/lesson-designer.md` L127**, after A21 (AK holds it): «A brief naming another prior or sibling lesson: find it in `[OUTPUT_DIR]/working/` the same way. If absent, fallback paraphrase + flag.» How "the prior lesson is known" (A02) is found when the brief names it. Group L.
23. **`references/teaching-sequence-discovery.md` L21** (TD, AK, RT hold it): «Make the focused question, phenomenon and relevant prior knowledge clear.» Discovery's own opening beat brings prior knowledge back after the starter. Group B, beside B05.

Searched with nothing further found: `agents/slide-decorator.md`, the stick-in designer and pedagogy beyond N28 and N29, `skills/make-lesson/SKILL.md`, `playbook-lite.md` beyond L26, `commands/*` beyond E15, `lesson-from-plan.md`, `computer-setup.md`, `design-review-route-checks.md`, `reasoning-prompts.md` beyond J38, `task-contrasts.md`, `explanation-tasks.md`, `modelling-formats.md`, the adaptation files, and `subject-science.md`.

---

## 2. Duplicates that are not duplicates

A fold that deletes these loses the quoted difference.

- **D10 is not D05.** D10: «A definite starter answer follows immediately when the structured answer requests an answer slide.» That is the slide side's limit: it follows the design and does not add a reveal itself (`agents/slide-designer.md` L431: «Do not infer a reveal from stage, task type, whether an answer is definite»). Folded into D05 it becomes an instruction to the slide designer to add one.
- **E06 adds "only".** «Teacher orientation appears at the start of slide 1 notes only.» Neither E01 nor E04 limits the orientation to slide 1.
- **H29 is not H24.** H29 adds a limit H24 lacks: «do not create a second box merely because the template has room». H24 says only «A separate box is fine when there's a reason».
- **H30 is not H29.** Its second sentence is its own rule: «When one reference is both success criteria and sticky knowledge, render one faithful combined reference rather than two competing copies.»
- **H42 carries two exceptions H33 lacks:** «unless the template contract explicitly calls for a mechanical transformation such as automatic question labels, or the composition playbook allows a visual line break». Folded into H33's «Never polish, shorten, simplify or paraphrase», the line-break permission is lost.
- **J17 is stronger than J03.** J03: «the ending can take that idea somewhere the lesson never went» (a permission). J17: «Where the lesson named an idea in `concepts`, that is where the Apply comes from». It also carries the two-minute cost (missed rule 2). Keeping J03's wording weakens it; keeping J17's needs J02's "earned" limit beside it.
- **J09 adds a method J02 lacks:** «Compare the proposed answer with the answers and conclusions already supplied.»
- **L13 adds "previous".** «Do not invent a previous or next lesson to make a sequence look complete.» L04 forbids only «a next-day lesson». The "previous" half is the one that governs the starter (A02, "If the prior lesson is known").
- **B13 lacks B12's limit.** B12: «Light touch: load-bearing volatile figure needs care, not every number.» and «precise recent date». B13 has neither. The ledger folds B13 towards B12, which keeps them; the reverse would not.
- Smaller: **I15** adds a reason («Children stop trusting the colour grammar across the unit.»); **I20 is not I19** (I19 says the card reuses the slide's own drawing, I20 says when a card needs one); **A11** adds that mixing is «a sequence-level option».

---

## 3. Strength and scope (about 70 rows read)

Wrong or incomplete:

- **E08** is recorded as mechanics and as a contradiction. It is out-of-date: the builder has not printed a starter `title` since 4.2.256, and a builder test pins that (missed rule 1).
- **E10** has an empty "when it applies". The text gives an exception: a year on a timeline, a date in a source, a date inside a word problem.
- **B12** says "every real fact in any lesson". The text limits the care to «load-bearing volatile figure ... not every number».
- **H05** scope, "a task the fact would answer", drops its own exception: «If genuinely needed as reference, include.»
- **H34** records the refusal but not the permission: a span inside a sticky line may be marked «only when that span really is a taught term of its own». The check's message is wider still (see section 5).
- **H08** is described in decision 7 as "uses the same words everywhere". The text names the places: «phrase on Teach matches Practise reference later, worksheet, Apply». The wall is not among them.
- **A09** is "must (as written)". Its own file says it «does not automatically govern a lesson or override `preferences.md`» (evidence-synthesis L5), and the designer is told «When `preferences.md` and `evidence-synthesis.md` govern the same choice, `preferences.md` wins» (lesson-designer L36). Its working strength is below A01 to A08.
- **E18** is "mechanics". It carries two musts: `activity` «is the exact question or task children read, not a description of the learning purpose», and «A line about what children will retrieve ... belongs in planning, unless it is itself an intelligible instruction addressed to them».
- **F10** "must (always null)" is prose only. The validator accepts any string there (`expect_nullable_string`, L1690).
- **N06** says no range is set for the starter. Every timed beat, the starter included, must be 1 to 25 minutes (`BEAT_MINUTES_MAX`), and the 50-minute sum runs only when every beat carries minutes.
- **I06 and N3** place "about 100" in the wall preferences and "about 106" in the designer. The wall preferences say both (L91 and L254), and the wall test requires "106 characters" in that file.
- **M13** is called code that "never fires" on a declined Apply. It is a trigger the reviewer reads. Two other triggers can fire on that case (section 4, decision 10).

Checked and correct: A01, A02, A03, A05, A06, A07, A08, A21, B01, B02, B03, B04, B05, B07, B10, C01, C06, C09, C10, D03, D05, D11, D12, D15, D16, D22, E01, E07, E09, F03, F04, F05, F06, F08, G02, G03, G07, G13, H01, H06, H10, H14, H18, H24, H27, I04, I14, J02, J05, J12, J19, J29, J31, K01, K03, K04, K10, L01, L03, L04, L11, L20, M04, M08, N02, N04, N08, N09, N10, N21, N22.

---

## 4. Disagreements

### The ledger's twelve decisions: real pull, or settled by a fold?

You asked for no overcomplications. Read against the actual text, four are real pulls, three are answered already by a rule you made and need only a one-line confirm, three are folds that change nothing, and two should be rewritten or dropped.

| # | Verdict | Why |
|---|---|---|
| 1 Test-question note | **Settled by your ruling; fold into 12** | Not two places disagreeing: one stale note against your 21 September words. Two corrections to the ledger. (a) The build log itself calls the kept files "Parked, again" (L77), and your words were "its not ready. its not a feature needed right now", so "removed, not parked" overstates it. What is false is "the slide side still understand it" (no builder code reads the field) and the promise "the route will return to it". (b) The suggested reason, "the slot stays empty so older lessons still open", is not the recorded one. The log's reason (L70 to L75) is that removing it would touch the contract, its validator and three test files "for no gain", and that «A field with no instruction beside it is a field an agent invents a value for». Use that. |
| 2 Test question exceptions | **Fold; not a decision** | The plan's own rule settles it: «A pointer that summarises a rule keeps its alternatives and exceptions». Carrying F04 and F06 into the contents line and the reviewer's check changes no meaning. |
| 3 Question about today as a starter | **Real pull, but the suggestion loses a rule** | The pull is inside Starters: C01 and C04 allow «a hook question the lesson will answer» with no condition, B04 allows an explore-and-discuss opening only «when the retrieval would be empty», and B05 says «A starter is the recap». A09 is not part of the pull: it is subordinate by precedence (section 3). The suggestion drops B03's third case, where your brief says the surface is easy («open with the lesson's own big question as short exploratory discussion»). It also adds a condition no file has ("the topic is new to the class"). And it reads the vertebrates Pride Lesson as a today-question when the text says only «an open-ended question with animal pictures» (unsure: that could be retrieval). Reword the suggestion to carry B03's case and B04's condition, and nothing new. |
| 4 Starter title example | **Misdiagnosed; mostly a correction** | E08's example describes a title the builder stopped printing on your 19 September ruling (missed rule 1). Changing it to "Last week's PSHE" would describe a line you said you do not want in any lesson. The correction: say only `heading` prints under "Starter". What is left is small and real: E08 still invites "a `title` (or a `heading`)", so a slide designer can put E09's label into `heading` and print the little title. Ask only whether the starter slide carries any line under "Starter" besides its questions. |
| 5 Your own sticky facts | **Answered by your rule; confirm in one line** | G13's «use it» against G15. G15 is your general rule, «Binding is marked by the teacher, never inferred from grammar», and it names sticky knowledge. The suggestion restates G15. |
| 6 Top line or star line | **Settled by your rebuild; confirm in one line** | H10 was written from your 17 September hand rebuild (commit 4.2.223, "The sentence a Teach slide lands is the first line a child reads"). The slide side already agrees in three places the ledger files elsewhere: the playbook L352 («When the unit has a `headline`, that sentence is the `lead` across the top»), templates L251 and L267. H27 and H09 are the stale lines. H18 does not pull: "headline, or the sticky fact this slide lands" is H10 plus H14. Two more lines belong in the fold: G13's «Not teaching tool - reference/retention anchor», which reads against a sticky fact that is the Teach slide's lead, and content-based L31, which still offers «a short key sentence in a banner or strip, a labelled outcome below the visual» before saying the headline. |
| 7 Wall shortens sticky facts | **A real question about a rule, not two texts disagreeing** | H08 lists Teach, Practise, worksheet and Apply, not the wall. The wall's own principle, L98 (missed rule 15), classes a sticky fact as prose «nobody is matching word for word». So nothing contradicts today. The question is whether H08's reason ("same phrase ... strengthens trace") should reach the wall, which is a change in meaning and yours to decide. Correct "everywhere" and quote L98 beside it. |
| 8 What comes back next time | **Not a pull; drop, or make it one pointer** | This is new behaviour, not a disagreement. A02 already sends the starter to the previous lesson's learning, and L25 reads that lesson's file. The suggested default ("normally retrieves from its sticky facts") adds a rule, does not say what happens when that lesson named no sticky facts (G07 allows zero), and sits oddly with C06 (choose the starter from what today depends on). "Nowhere to be written" is also overstated: the walk-through's closing decisions can hold it in prose; what is missing is anything that reads it next time. The honest minimum is one clause saying a lesson's sticky facts are the things a later starter should ask for. |
| 9 Ready-made reason for no Apply | **Real pull; keep** | J19's stock reason is the synthesis-only reading J03 and J17 warn against. Add content-based L17 («The Practise is that question over evidence children have not seen»): in a content lesson that names an idea, the Practise usually already passes J05's test. So the suggested reason is often "yes, in the Practise", not a new Apply. |
| 10 Reviewer and a missing Apply | **Real gap, but the suggestion over-fires; merge with 9** | The ledger says nothing sends the reviewer. Two triggers can: How Much Fits fires «whenever an idea a Teach beat taught is not used again by the independent practice or the ending» (packet L114), and Purposeful Endings fires «when the ending ... is in doubt». The review view also prints a declined ending's reason (packet L2243 to L2250). What is true: neither sends it to the section that holds J03. As suggested ("a lesson that taught an idea has no Apply") it fires on most content idea lessons, and a reviewer test forbids «require an extra Apply slide» (section 5). A narrower trigger fits: the lesson named an idea, left the ending out, and its reason does not say where the idea met a case it was not taught on. |
| 11 Maths Apply | **Fold; not a decision** | The ledger itself says J29 already joins J15 and J31, and its suggestion changes nothing. Add L198 (missed rule 3), which is the skill route's statement of where reasoning and word problems go. Ask only if you want the maths Apply to stop being reasoning or problem solving. |
| 12 Out-of-date text | **Fold** | Add: templates L139 and L476 (the starter title, missed rule 1), the L472 to L478 test-question traces, the wall budget written as both 100 and 106 in one file, and decision 1's note. |

### Pairs the ledger did not raise

1. **E09 (the starter's label names what is remembered) against your "no little titles" ruling and the answer-slide form.** The builder prints no starter `title`, so E09's label reaches the board only if a slide designer turns it into `heading`, which prints it as a little title. D24's own example is «"Starter - check"», which assumes the starter's title is "Starter", while E09's label would give "Last week's rivers - check". Unsure which you want. It is decision 4's real residue.
2. **J17 against J02 and J11.** «that is where the Apply comes from» read alone makes an Apply from every named idea; J02 («earned through the lesson, not included automatically») and J11 («omit the ending when practice already draws on the intended learning») limit it. A fold must keep J17 conditional on "earned".
3. **B05's «Both belong to their own beat» against TD's L194** («the scene is the opening of the first Teach beat ... and never a beat of its own with a made-up task after it», in a knowledge lesson). B05's "their own beat" is the task route's Set the Task. A fold must not carry "their own beat" into knowledge lessons. Smaller.
4. **Retrieval Roulette (do-beats L106) against A07**, as D13 against A07. The routes list passed it here. It folds under A07's conditions.
5. **H34 and the check's message.** The profile allows a span inside a sticky line «only when that span really is a taught term». The check's message also allows «a source-authored warning of its own» (`check-slide-design.js`, STICKY_LINE_RECOLOURED). Meanwhile L113 says a safety sticky line stays purple. Smaller: spans, not whole lines.

---

## 5. Code and tests

Omitted or stated wrongly:

- **A builder test pins the starter title behaviour.** `builder/test/starter-heading.test.js` L101 asserts that `starterPrompt({ title: 'Rounding to 1,000' })` is empty (`builder/src/layout.js` L80 reads `heading` only). This contradicts E08 and templates L476 and is not in the ledger's code names or pins.
- **An included Apply or Reflect must have a script.** `SCRIPT_REQUIRED_KINDS` (validator L200 to L219) includes `apply` and `reflect`, not `starter`. Not listed.
- **An ending beat may carry a `conceptRef` and counts as an instance of the idea.** `idea_instances` (validator L2559) adds an included ending beat to an idea's instances, towards the "at least two" refusal; only the starter and `prepare` must be null (L2119 to L2125). This is the code under J17 and decisions 9 and 10, and it is not listed.
- **The minutes.** Each timed beat is 1 to 25 minutes (`BEAT_MINUTES_MAX`, L260). The 50-minute refusal runs only when every beat carries minutes (L3331). Only the upper end is refused (L3333 to L3336). The ledger's N06 and "no range for the starter" need these.
- **"Lands its sentence once" reads only `teach` units** (L1257). Discovery's `teach-why` takeaway and the ending are not checked. The ledger's summary is right for the content route but reads as general.
- **Two reviewer behaviour cases test the Apply** (`scripts/tests/fixtures/design-reviewer-behaviour-cases.json`):
  - L310 `claim-format-repeats-supplied-conclusion`: an extra Apply that repeats the conclusion is REDESIGN REQUIRED, «reconsider the unearned extra Apply» (J10's case).
  - L438 `cumulative-scale-learning`: APPROVED, with the forbidden finding «Do not require an extra Apply slide or a written product between each stage.»
  Neither is in M or N or the pinned list. The second constrains decision 10.
- **The review view prints a declined ending** (packet L2243 to L2250: Included, Kind, Reason), and the How Much Fits trigger (L114 to L119) names the ending. Both bear on decision 10 (section 4).
- **The wall test** (`working-wall-html/test/doc-claims.test.js` L153 to L166) builds 62 and 106 and refuses 63 and 107, and requires both "62 characters" and "106 characters" in `working-wall-preferences.md` and the wall designer. The preferences also say "about 100" at L91, so the split is inside one file.
- **The sticky-line check's message** allows «a taught term or a source-authored warning» inside a sticky line, wider than the profile's rule (section 4, pair 5). Its "fails the check" claim is right: presentation findings set `SLIDE_DESIGN_PRESENTATION` and the check exits non-zero.
- Checked and right: the starter's exact keys and null `conceptRef`, the answer-order refusal on a starter list, at most three sticky facts, the takeaway's sticky ref also in `stickyKnowledgeRefs`, the ending's kind by route with a reason always required, `MAIN_ANSWER_SLIDE_KINDS`, the shared-frame sheet's empty sticky refs, the routing card's five trigger texts, and the view's sticky "Drawn on by final work" line. The spot-check of "unpinned" rows (A01, D05, D11, E07, E10, F04, H09, J12, J19, K02, L03) found no pins; F03 is pinned through the quick-checks pins, as the ledger implies.

---

## 6. Stories

- **H13 (17 September history Teach slide rebuilt by hand): confirmed not in the log.** The rule it produced came in commit `69bab48a` (4.2.223), which has no log entry. The log goes from the 17 September run notes (L3472, which do not mention it) to later entries. L4096 mentions a related later change in outline only.
- **Every other cited log line matches:** L43, L871, L1997, L2135, L2216, L2292 («Tiny pewter plates were made for play around Tudor times»), L2306, L2348 (G05 in outline, without the Christmas fact, as the ledger says), L2470, L2986, L2998 and L3348 (E09's case without the words `What do historians use?`, as the ledger says). L34's story is at L2057 («A PSHE slide was trimmed by cutting `When you rest, it all settles down again`»). The ledger gives no line for it.
- **A ruling the stories table lacks:** your 19 September "little titles" words (log L645 and a code comment), which govern the starter slide (missed rule 1).
- **The test-question history, corrected:** the "parked ... will return" note was written in 4.2.266 (`737f5701`), while a replacement was still planned, and restored unchanged in 4.2.268 (`e7aee911`). The log's claim «exactly as 4.2.266 left it» is true. The note went stale on 21 September, not by mistake in 4.2.268. The log's own word for the kept files is "parked" (L77).
