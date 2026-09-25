# Independent check of the playbook ledger (topic 10)

Checked on 24 September 2026 against the plugin's working tree: lesson-v4 4.2.287 (`79426973`) with the success-criteria change (4.2.288) uncommitted on top. None of this topic's files differ from the commit. Read-only: nothing in the plugin or the ledger was changed. Scratch scripts are in `plans/streamline-tools/scratch/pbchk/`. Line numbers are working-tree lines.

**How the check was done.**

- A script marked every character of the ten topic files that some ledger quote covers (`pbchk_coverage.py`, `pbchk_spans.py`). Prose coverage of the playbook and the skill is complete; what is left is headings, command blocks, the completion footer's return list and a few sentences in the commands and references (item 4 and item 10 below).
- Every instruction file in `agents`, `references` (not the build log), `skills` and `commands` was searched for what it tells or promises the run (orchestrator, make-lesson, final report, run report, teacher report, surfaces, flagged, anchor, root, and the gap and flag markers), and each hit the ledger does not cite was read in its paragraph and checked against the other lists.
- The runtime slicer, the fixed-build wrapper, the save program, the report check, the launch audit, the helper check, the picture compiler and finaliser, the photo cap, the stick-in launcher and the stick-in and worksheet builds were read for what they print, require and refuse (`pbchk_sizes.py` measures the playbook and its slices the way the size tests do).
- Every test string that sits inside a sentence the ledger proposes to remove was listed (`pbchk_pins.py`).
- The six decisions and the settled items were read against the text, the code, the six-run plan, the other lists and the memory notes of his rulings.

---

## 1. Missed rules

Ordered by what a fold, or a run, would lose.

1. **`agents/diagram-anchor.md` L3: the stick-in pack's labelled photo is never anchored.**
   «Runs once its base picture is published, over any spec file that can hold a label-diagram (lesson.json, worksheet.json, stick-in-sheets.json; the working wall carries no label-diagram, it annotates drawn figures by named part instead).»
   The playbook launches Diagram Anchor for `lesson.json` (PB-L12) and `worksheet.json` (PB-N17) and never for `stick-in-sheets.json`. The stick-in designer copies the slide's label-diagram «the same one the slide's `label-diagram` shows so the piece matches the board» (`references/stick-in-sheets-pedagogy.md` L113), and it starts «The moment `lesson.json` passes» (PB-L05), which is before the Track A anchor pass. So the pack prints the slide designer's provisional dots, and the stick-in build has no `EMPTY_SET` style refusal. N17's own warning is the cost: a sheet «can print "label the parts" over a photograph carrying nothing to label». No ledger has this. It also makes PB-L05's reason untrue for this one figure: «The wall and stick-in designers copy text and figures that are settled now». Group L or O.

2. **`agents/slide-decorator.md` L55: the flagged-deck hand-off has two names.**
   «The orchestrator says so by giving you `FLAGGED_SLIDES:` with the numbers the build could not lay out.»
   PB-Q09 tells the run to pass «the build's `SLIDES_FLAGGED:` numbers as `--flagged-slides`», and the decorator's launch block (PB-L06) has no `FLAGGED_SLIDES:` field. A decorator that is not told builds its preview without `--deliver-flagged`, fails, and PB-L08 then ships the deck with no drawings at all, which is the 21 September PSHE outcome Q09 was written to stop. Unsure whether a run bridges the two names in practice. (The run also never sees a `SLIDES_FLAGGED:` line: the wrapper prints `FIXED_RESOURCE_FLAGGED slides: [numbers]`; `SLIDES_FLAGGED:` sits inside the summary's captured output.) Group Q, beside Q09.

3. **`agents/worksheet-designer.md` L62-63: who a sheet's content gap goes to.**
   «The orchestrator returns an Expected gap to the lesson designer and a Below or Greater Depth gap to the adaptation designer. Rebuild only the affected sheet after the source is repaired.»
   A routing rule for the run, held by the worksheets list as WS-P05 and absent here. It pulls against PB-P04 and PB-Q13, which send every `WORKSHEET_CONTENT_GAP` to one focused Lesson Designer revision, and PB-H06, which bars that revision from adding `adaptation-photo-###` (heading 4, missed pull 3). Group P, shared with worksheets (WS-P05).

4. **`skills/make-lesson/SKILL.md` L260-265: what every worker returns.**
   «Return only:» «- the exact terminal state required by this assignment, or `COMPLETE` when the assignment defines no more specific state;» «- any exact marker, diagnostic or short result field that this assignment explicitly requires the orchestrator to inspect;» «- one `Friction:` line per genuine obstacle under the rule below.»
   The body of the footer PB-C17 appends to every spawn. C17 and C18 quote the sentences round it, not the list, and the `COMPLETE` default is written nowhere else. L284 beside it, «That verdict is what separates an obstacle worth engineering away from one that merely cost a second attempt», is the reason for C20's unharmed or harmed verdict and is also unquoted. Group C.

5. **The designers' promises about the run's report, which the run never keeps.** No row and no appendix entry for any of these:
   - `agents/working-wall-designer.md` L128: «The orchestrator notes "Working wall: none earned" in the final report and that is a successful run, not a thin one.» (again at L414: «Final report says "Working wall: none earned — [reason]".»)
   - `references/working-wall-card-contracts.md` L32: «Never printed; included on the orchestrator's final report so the teacher sees the reasoning.» and L45 «so the run report can name the lesson.»
   - `agents/working-wall-designer.md` L420: «Designer still runs and writes working-wall.json; orchestrator notes the build could not run in the final report.»
   - `agents/stick-in-sheets-designer.md` L66: «leave it off the pack and name it in your final report rather than forcing a poor fit»
   - `references/working-wall-visual-language.md` L198: «When the lesson asks for something none of these covers naturally, note it in your final report.»
   - `agents/slide-designer.md` L309: «Name every affected `photoRef` in your completion report so the teacher is told what the lesson does without.»
   The playbook says only that an empty wall writes «its rationale for the run report» (PB-O05); nothing tells the run to write the wall's reason, and the completion footer (PB-C18) tells each of these workers that it «overrides that reporting section for this spawn». So a stick-in moment left off for want of a visual, or a wall card type that is missing, reaches nobody. The slide designer's list is covered anyway by PB-S06 (the run names every unpublished picture). The ledger's U24 note saw one case («"the orchestrator surfaces flags to the teacher" is not written anywhere in the playbook»); these are the rest. Group S, shared with topic 9.

6. **`agents/working-wall-designer.md` L207: a wall with no slide spec.**
   «The view says when `lesson.json` was absent (a degraded run where the slide-designer was skipped): the figures and criteria then come from `lesson-design.json`, and the orchestrator will have flagged it.»
   `working-wall-packet.py` supports this (`lesson_absent_reason`), but the playbook starts the wall (PB-O02) and the stick-in route (PB-O10) only when `lesson.json` passes, and PB-G02 omits the deck when the slide designer is missing. A run whose slide designer is absent, or never returns after its retry, therefore loses the wall and stick-ins too, which is the "withheld deck, wall and stick-ins" of 16 September that he said he did not want again (memory note, 4.2.213). Group O. Unsure how often it happens: the flagged-deck route (Q09) covers the common case.

7. **`skills/make-subject-file/SKILL.md` L253: a test run that overrides the root.**
   «Build one lesson in the subject through `make-lesson`, passing `PLUGIN_ROOT: [PLUGIN_SOURCE_ROOT]` in that run's worker prompts so the edit takes effect immediately rather than waiting for the version-pinned cache.»
   The subject-files list holds it as maintainer text (SJ-C48). Against this list's PB-C22 (every worker prompt carries «`PLUGIN_ROOT: [literal verified PLUGIN_ROOT]`») and PB-B15 («Do not ... fall back to another installed or source copy»), a run following the skill ignores the override and tests the installed copy. Group B or C, shared with SJ.

8. **`agents/slide-designer.md` L59: a hand-off the run never makes.**
   «- `adaptation.md` only when the orchestrator explicitly requires a shared visual adaptation.»
   No launch in the playbook passes `adaptation.md` to the slide designer, and nothing says when one would. Possibly dormant. Group L, topic 9.

9. **`references/brief-gap-protocol.md` L84: a "never" no ledger quotes.**
   «When the brief and the artefact contradict, the answer is never to make those decisions yourself.»
   A near-copy of PB-U19's last sentence and PB-U28's test, but it is the paragraph's only "never". Group U, stays.

10. **Smaller unquoted rules in the developer commands.** Group W.
    - `commands/edit-templates.md` L152: «and don't pre-compute sizes from content length» (PB-W25's quotes stop just before it).
    - `commands/edit-templates.md` L130: «Give each zone a `class` (A, B, C, D, E-wide, E-narrow, F, G — see `references/templates.md` §1.3) and pour content with `drawContent`.» (PB-W23 quotes the sentences either side.)
    - `commands/install-helper.md` L72: «These are the surgical edits a copy cannot do: the dispatcher line, the catalogue entry the designers read, the registry key, the `shared/visual-parity.js` row.» (what a `WIRING_REQUIRED` edit is; PB-W10 quotes round it.)

---

## 2. Duplicates that are not duplicates

- **PB-A27 is marked "duplicate of Q08", which is the wrong row.** Its twin is PB-Q07 («Rebuild only that resource and rerun its deterministic check: that rerun is the repair's confirmation»). And it carries what Q07 lacks: «return to the track the fault came from», the only place the run is told where to go after a repair. A near-duplicate, and the program's copy is the one that routes.
- **PB-C06 is not a copy of A05.** A05: «Validated canonical files and picture evidence carry continuity. Conversation history does not.» C06: «Saved lesson files, picture contracts, compiled assignments, picture results, AI ledgers and review findings carry continuity between attempts.» C06 is scoped to retries and repairs («between attempts») and names review findings, AI ledgers and compiled assignments, which a fold into A05 drops.
- **PB-S07 is not a copy of J31.** S07 opens «every helper gap: each visual answered with a substitute, and every helper this run built and left waiting». J31 is only about waiting helpers. The substitutes half is what the report check enforces (`helper_obligations` counts every `substitute` decision).
- **PB-S09 is two items.** Its second quote, «shared investigation-log status.», is a separate line of the report and not in S20.
- **PB-A06 against A05.** A06 adds «not conversations or scheduler state» and is read at the very end of the run, not at the start. The fold is safe only if A05 or D08 keeps the scheduler clause (D01, which has it, is never printed: heading 5, item 1).
- **PB-W16 and PB-W05** sit in two commands that are each read on their own, so they cannot fold into each other without a shared reference; "duplicate" should not be read as "can be cut".
- **PB-G07 folds safely only one way.** It lacks F03's «obtained before the first worker starts» and «in reply order»; the fold keeps F03's words, not G07's.

---

## 3. Strength and scope

Over eighty rows were read against their text and the code (among them A05, A10, A12, A16, A23, A25, A27, A28, B09, B12, B18, B19, C04, C06, C13, C16, C20, C21, D01, D02, D05, D06, E02, E05, F09, F10, G07, G11, G14, G15, H05, H06, H07, I06, I14, I15, J12, J19, J31, K07, K08, K11, L03, L05, L07, L14, M08, M16, N01, N12, N17, O05, O08, O12, O13, P04, P05, P07, Q02, Q07, Q09, Q10, R03, R05, S03, S07, S09, S13, S14, T01, U02, U06, U09, U26, W05, W13, W16, W39, W40, X08, X10, X14, X17, X18). What does not hold:

- **PB-D01 and PB-D02 ("every run", home PB) are read by no run.** They sit in the playbook's first 690 bytes, above «## Lightweight execution protocol», where no slice starts; the skill forbids opening the file directly. Heading 5, item 1.
- **PB-G11** «Say nothing about saving now; the final report offers the choice.» The offer is made only when `DELIVERY_OFFERED=no` (PB-T05); the row's "when it applies" leaves that exception out.
- **PB-O13** "must (code: the report check asks for exactly this line)". The check accepts any `- <resource>: NOT DELIVERED - <reason>`; the words `not needed:` appear only in its failure message.
- **PB-Q10** "must (code)". Only the build half is code. Nothing checks the teacher flag, the named tier, or the package status: a pack short a sheet can close `COMPLETE` (heading 5, item 6).
- **PB-L05** "must", with the reason «copy text and figures that are settled now, before any drawing is placed». Not true of a label-diagram's anchors (heading 1, item 1).
- **PB-B19** says «contradiction with I15»; the review step's log line is PB-I14.
- **PB-E05** is "mechanics", but «Claude Code and Codex on the teacher's computer start your next turn when a worker finishes» holds on Claude Code only for background workers; with the in-process workers his settings ask for, the turn cannot end while they run. Decision 3 turns on this.
- **PB-H05** «deliver `design-decisions.md` and the diagnosis»: on a blocked design this is the only thing produced, and PB-T01 and the save program keep it off his drive. Not wrong, but the row does not say that "deliver" here means "leave in the output folder".
- **PB-K07** lists the four designers that get the `PICTURE_STAGE:` line; the adaptation designer's inputs also name a photo contract («the frozen initial photo contract», PB-N02) and it gets no line. Minor.

---

## 4. Disagreements

### The six decisions: real pull, or already settled?

1. **A repair that changes what children read. Real pull, but the fix as written is incomplete.** Phase 3.5 routes every repair to the compact role; the compact roles may not change pupil-facing words (`slide-designer-focused-repair.md`: «Keep every upstream-authored pupil-facing string exact»). Two places disagree, so it is a real question. Two corrections:
   - The room-making half needs no question: stories, maintainer notes, out-of-date lines and same-moment repeats already leave under the plan's own rules.
   - The one line is not enough on its own. Phase 3.5 also requires every repair to return «Repair scope: REPAIR_SCOPE_OK» (PB-Q06). Only the four compact roles run `check-repair-scope.py`; the full creation roles never mention it, `FOCUSED REPAIR`, `Already passed` or the repair fields; and the check refuses new child-facing words by design («Did words appear on the child's page that were not on it before?»). A full-role repair that carries a redesign's new wording can therefore never return the field the run requires. The decision should say the return fields change with the route, or the run will record every such repair as failing its scope. This is the plan's own lesson: «Check the mechanism exists before writing the promise.»
2. **The template editor pushes on its own. Real pull (two commands disagree), but the premise is overstated.** «Your rule for this work is that nothing is pushed until you say» is the streamline plan's rule for its own releases. His `Projects/CLAUDE.md` says the opposite for plugin work («After making changes here, commit and push to GitHub»), though for the older teaching-plugins copy. Ask it neutrally. The version-step size («next minor version (e.g. `2.1.0` → `2.2.0`)») and "the architect" are plain corrections, and on Codex a bump alone does not reach his lessons (memory: `codex plugin add` follows); none of those needs his answer.
3. **Watching the agents. Partly settled by his own words.** His settings already choose in-process workers for this plugin on Claude Code; what is false is their claim that «The skill's own instructions already specify in-process mode». Codex shows its workers in its own list either way, so "not in Codex" is not a reason. The real pull is the speed design: PB-E05 and PB-K09 assume workers that report back one at a time, which in-process workers do not. The question worth asking is whether the skill should say "on Claude Code, launch where the teacher can watch, accepting that the run waits for each group", and it should be put so "yes" takes it.
4. **Two notes to the build log. Real pull.** PB-I14 needs a source root that PB-B19 resolves only at the end, for notes PB-R07 says the log does not take. One small correction to "What I think": the reviewer's own bounded corrections are in `design-review.md` only; the run report carries just the findings sent back to an owner (`BLOCK:` lines) and the unresolved ones.
5. **A card kit or a wall that still fails. Real pull, wider than the list says, and the reason for the wall is weak.**
   - An ordinary stick-in pack fails whole too: the stick-in build exits 1 when any one moment cannot be drawn («this pack looks complete and is not: it needs rebuilding once that is fixed»), so one undrawable moment loses the pack after its one repair.
   - «a wall that will not build has nothing to print» is not how the walls are lost: the log (L1273) records a wall lost on 14 September to one step «at 108 characters against a 106 budget». That is the "one fault costs the whole resource" shape his "flag the slides and deliver it" answered.
   - The card-kit reason (wrong cards on the tables) is sound. Suggest asking it as three cases, not one.
6. **Feedback on a lesson already made. Real pull (a rule never read when it is due), with two additions.**
   - The skill's trigger (PB-A01) names only new lessons, so in a new conversation a feedback message may not load the skill at all; a line in the skill body is reached only if the skill runs. And if it does run as a fresh lesson, PB-G05 archives the working folder and starts again, the exact thing the guidance forbids.
   - Unsure, from the memory notes rather than the plugin: on 14 September he «called out a partial edit» and asked that all the resources be edited, not just the slides under discussion. The guidance says «change exactly the slides the teacher named». Sending runs there without that ruling may produce the partial edits he objected to.

### The settled items

- **a** holds. Add: PB-P07 is reversed against the program (heading 5, item 2); PB-K08 «only when their prompts require it» is out of date against L05, O02 and O10; PB-R03's low-resolution line needs the friction tag; PB-S14 becomes one list of every flag; PB-P05 «keep the picture cap» means the run ceiling of 24 (PB-H07); PB-A28's last message (the save line comes after the teacher report). None changes a rule.
- **d** holds, with sources to copy from: B18's story is in the message of commit `fc698ee4`, M09's in `1744b996`, C13's in the six-run plan's Part G.
- **e** holds except PB-L14: its first sentence, «The Slide Decorator remains the earlier optional-picture stage», is pinned by three tests (`test_optional_picture_pass.py` L605, `test_slide_decorator.py` L164, `test_worker_lifecycle_orchestration.py` L164), which treat it as the marker that the decorator is not a review of the built deck. Keep the phrase or move the pins in the same release.
- **f** holds by his ruling, but nothing checks it (heading 5, item 6).
- **h** holds, but W05 and W16 cannot fold (heading 2).

### Real pulls the list missed

1. **The stick-in pack's label diagram is never anchored** (heading 1, item 1): L05's "settled now" against the anchor pass that runs later. Likely in science and geography labelling lessons.
2. **The flagged-deck hand-off** (heading 1, item 2): `FLAGGED_SLIDES:` in the decorator's file, `--flagged-slides` in the playbook, no field in the launch.
3. **A Below or Greater Depth sheet's content gap** (heading 1, item 3): the worksheet designer is told it goes to the adaptation designer; PB-P04 and PB-Q13 send it to a Lesson Designer revision that PB-H06 forbids to add adaptation pictures.
4. **Provenance skipped when pictures were published.** PB-R05 skips provenance under `none required`, but the supplemental wave runs «whenever ... the Phase 2 picture stage is not `unavailable`» (PB-M13) and the content-gap wave can publish too, so published pictures go without their licence proof. The ledger has this only "in passing"; it is two places that disagree and wants a line, or a yes.
5. **A short pack can close `COMPLETE`; a flagged deck cannot.** PB-S13 «A package missing an earned output is `PARTIAL`» against PB-Q10 «list the pack as delivered»; the report check reads `flaggedSlides` and never `omittedSheets`. If Expected is the missing tier, most of the class has no sheet and the record says complete.
6. **A run with no browser saves no printed resources.** The worksheet, wall and stick-in builds then write HTML (`FIXED_RESOURCE_DEGRADED`, which no instruction explains), and the save program copies only `.pptx`, `.pdf`, `.docx`, `.xlsx` and `- Answers.txt`, so his drive gets the deck and answer keys and nothing else, against PB-T01's list. Rare (the start-up check installs a browser), but silent.
7. **A wall and stick-ins with no passing slide spec** (heading 1, item 6).
8. **The subject-file test run's root** (heading 1, item 7).
9. **Designers' "final report" flags** (heading 1, item 5) against the completion footer.
10. Minor, unsure: `OPENING_WEEK=yes: ask which week` (PB-G14) beside «Don't wait» and, on a scheduled run, «Nobody can answer questions» (PB-V14). And PB-N01's «consider adaptation» against the lesson designer's «Below and Greater Depth adaptation still run» (WS-A08; the worksheets list owns it, WS-A14).

### Is the account of what could leave right?

The arithmetic is right: 78,839 bytes against 78,848, the slice figures (delivery 5 spare, worksheet-render 22, helpers 89, design-review 131, other-resources 156, focused-repair 1,932) and Part D's need of about 65 bytes all measure as stated. The 2.3 KB table adds up. But:

- **It misses the largest block that carries nothing a run reads.** The first 690 bytes (the title and PB-D01, D02) sit above the first slice and are never printed. Their substance is already said where runs read it: D08 «Do not manufacture a second queue or receipt system», D10 «These picture records do not require or authorise the generic orchestration controller», and S08 for the timeline. Removing D01 and D02 (about 640 bytes) is ten times Part D's need and loses nothing at run time; if he wants D01's longer list of forbidden records kept, it can move into the execution slice (3,894 spare) at no cost to the file.
- **L14 is not free.** Its first sentence is test-pinned (above), so about 60 of its 266 bytes stay unless three tests move.
- **The delivery slice can be freed, which the table does not say.** 618 of its bytes (the edge cases, PB-U01 to U04, and the closing PB-A06) govern earlier phases: U01 belongs beside F10 in `setup` (2,438 spare), U02 folds into N09, U03 is corrected, U04 sits beside A02, A06 folds into A05. That is the room the ledger says the report's headings would need.
- **"No rule is in it" otherwise holds.** No test pins anything inside the five stories, the stale lines or G07 and U02 (checked by script). M16's pointer must keep «Require `PICTURE_MANIFEST_OK`» and "again". U02 is shared with worksheets, which left it to this topic (WS-A13 "STAYS (playbook)").

---

## 5. Code and tests

1. **`make-lesson-runtime.py` never prints the playbook's first 690 bytes.** Every slice starts at a named heading; the earliest is «## Lightweight execution protocol». PB-D01 and D02 are not "every run" rules.
2. **PB-P07 is reversed against `compile-picture-assignments.py`.** `select_expected` narrows a compile to the filenames named («Narrow validated requirements to the filenames one wave owns»), and nothing checks receipts, so «naming already-terminal filenames so nothing finished reopens» would compile the finished pictures again; the supplemental wave (PB-M14) correctly names the pending ones. The ledger said "worth checking"; checked. The phrase is pinned by `test_content_gap_picture_wave.py` L121, so the correction moves the test.
3. **Part D's route cannot return what Phase 3.5 requires** (decision 1): `check-repair-scope.py` is run only from the four compact role files; the full roles never name it.
4. **The launch audit defaults to Codex.** `worker-launch.py` sets `--host` default `codex`, so PB-S08's unflagged «`worker-launch.py audit`», like PB-I15's `--host codex`, reads Codex's newest session file on a Claude Code run on a computer that also runs Codex: the report can carry another run's marker and timeline, not merely a missing one. With `--host claude` it prints `WORKER_LAUNCH_AUDIT_UNAVAILABLE`, which passes (PB-C16's fix holds).
5. **`FIXED_RESOURCE_DEGRADED` and HTML outputs.** `run-fixed-resource.py` prints `FIXED_RESOURCE_DEGRADED` when a printed build wrote HTML; `deliver_files.py`'s `RESOURCE_EXTENSIONS` skips HTML; `PAGE_FIT_UNVERIFIED` is printed only by `worksheet-html/scripts/build-worksheet.js` L424 (the ledger is right that the wall never prints it). None of this reaches an instruction.
6. **The report check does not read a short pack.** `run-fixed-resource.py` writes `omittedSheets` into the worksheet summary; `validate-run-report.py` reads `flaggedSlides` (refusing `COMPLETE` and requiring `Slides to check:`) but nothing for omitted sheets.
7. **The stick-in build refuses a pack short one moment** (exit 1, so `FIXED_RESOURCE_FAILED`), which decision 5 needs.
8. **`Slides to check:` must sit under `## Outcome`**; the check reads only that section. The ledger's report-shape paragraph does not say where.
9. **The report's shape is not quite "written nowhere the run reads".** `## Worker launches`, `## Friction` and `## Blocking faults` are named in the skill and the playbook, and most other sections are named in prose. What is written nowhere: the title line, `## Outcome` and `## Build attempts` as headings, the order, `Package status:`, `Slides to check:`, and `Status: UPDATED` with its `Path:` line.
10. **Nothing checks a `gap` decision reaches the report.** `check-helper-coverage.py` prints `HELPER_GAP:` and passes; the report check's `helper_obligations` counts only substitutes and waiting helpers. Add it to "What the code does not enforce".
11. **"The four tests that bar the phrase" are three**: `test_make_lesson_runtime.py` L650 (the finalize slice only), `test_optional_picture_pass.py` L597 and `test_worker_lifecycle_orchestration.py` L158 (the whole playbook, raw, so the line break defeats them). The reviewer list has the same count.
12. **Headings that pin files depend on, beyond the cut points.** `assumed_knowledge_ledger_pins.json` names «### Gather and preserve the brief» and «### Say where the lesson will be saved»; `success_criteria_ledger_pins.json` names the Track A heading (a whole paragraph) and four `brief-gap-protocol.md` headings («## The principle», «## How to apply», «## The line that separates legitimate work from invention», «## What this protocol does not change»); `vocabulary_ledger_pins.json` names `edit-templates.md`'s «### Step 2 — Build and wire it per the reference». The ledger's names section lists none of these.
13. **`design-review-packet.py`** builds the validator command with `--initial-photo-namespace` until a verified Phase 2 freeze exists, then without it. PB-I06's rule («already right for the review's stage») holds for both reviews; its bracket describes only the later one. Minor.

---

## 6. Stories

The ledger's claims hold. Searched case-insensitively and by the log's own wording (several are worded differently there):

- In the log, as claimed: B07 (L1564, «22 of 39»), E05 (L1322, 4.2.192), J12 (L2600, «slides fell back to the nearest live map compositions»), K10 (L2625, «Five sourced photographs sat unpublished for 14 minutes»), M08 (L3650, «twelve of its sixteen slides carry nothing at all»), P06 (L3794), Q08 (L4160 to L4176), T09 (L1267 for the 13 September deck, L1281 for the 14 September «wasted a blob»), V12 (L1328 to L1340), V17 (L207), X07 (L1318, L1524).
- Not in the log, as claimed: B18 (only in commit `fc698ee4`'s message: «losing the wall, the stick-ins and the filing to a patch that changed none of them»), C13 (the six-run plan's Part G), M09 (commit `1744b996`), U10, U24 (the clock), U25 (the blank world map; L4384 is a different map), W33 and W34.
- One missing from the stories table: PB-W24's «(hard-earned)», an undated story the row names; it is not in the log either.
