# Optimisation step 1: where the time and usage go (29 September 2026)

Measuring only. Nothing in the plugin was changed. Scripts are in the session scratchpad (`measure/measure_session.py`, `buckets.py`, `breakdown.py`, `measure_codex.py`, `codex_roles.py`); rerun them on any new session to compare.

## Claude Code (five lessons, session 61996877, 28 September)

- 907 agent-minutes in total, about 180 per lesson (many run side by side).
- Fresh input 13.7M tokens, cached 578M, output 0.41M. Cached reading is almost all of it.
- **Slide designer:** 29 minutes a run on average, 124 turns, context up to 600K, 89 slide checks across five runs (about 18 a run). The biggest single cost.
- **Slide designer focused repair:** 23 minutes.
- **Worksheet designer:** 17 minutes, 81 turns, context up to 370K.
- **Design reviewer:** 11 minutes, 44 turns, context up to 290K.
- **Lesson designer:** 12 to 19 minutes, about 620K characters of instructions read per run.
- What the slide designer reads besides its instructions: the builder's own code (about 111K characters a run, to work out why a check failed), and its own earlier long outputs read back again from saved files (584K across runs).

## Codex (geography full run, 28 September, 16:23 to about 17:58)

- About 95 minutes from start to finish, 26 workers.
- Workers are quick one by one: slide designer 12 minutes, worksheet designer 4, reviewer 2 to 4.
- **The design loop went round three times:** designer, reviewer, redesign, reviewer, redesign, reviewer, then a "content gap" redesign and review. That is about 35 minutes before a single slide was made.
- Instructions read per worker: 120K to 780K characters. The lesson designer reads the most (776K). Every redesign and every review round reads its instructions again from the start (about 300K to 450K each time).
- Slide designer focused repair: 14 minutes, the longest single slide job.
- Image scout for the worksheet pictures took in 14.5M characters of picture data; the slide scout 1.7M.
- The orchestrator stayed open for the whole run and carried 22M tokens of input (mostly cached).

## Candidate levers (not yet proposed, one at a time, each tested on both)

1. Fewer slide-designer check-and-fix rounds on Claude (18 a run), for example by giving it the check's reasons in plain words so it doesn't open the builder's code.
2. Fewer design review rounds on Codex (three plus a content gap), by finding what the reviewer sent back each time.
3. Workers not re-reading their whole instruction set on a redesign or repair round.
4. Picture scouts not loading full-size pictures to judge them.
5. Model and effort choices per worker, tested last because they change decision making most.

## Lever 1 diagnosis (29 September, Claude slide designer)

- The "18 check rounds" figure was wrong: it counted commands that merely named the checker. Real check runs were 4 to 8 per deck, and most first checks passed or nearly passed.
- Tool running is only 3 to 5 minutes of each 22 to 35 minute run; the rest is the model reading and thinking.
- 36 to 64 reads of builder code per run. The checker's own source (`check-slide-design.js`, 84KB) was read 57 times across all five runs, almost all BEFORE the first check ran (first check at 14.7, 19.9 and 21.0 minutes in three runs). It was studying the checker to avoid failing.
- The rules it looked up (blue questions, task blue, teach layout repeats, reveal answers) are already described in the references it had read.
- Likely driver: the three-repair-pass budget and "a failure costs the run a separate repair worker" make failing look expensive, so it predicts the checker instead of running it. The first check does not use a repair pass.
- Codex's slide designer does not do this: it read two small targeted pieces (map fields, the helper check) and finished in 12 minutes.
- Candidate: tell the slide designer to write the whole candidate from the references and run the check to learn what it refuses, opening builder or checker code only for one finding whose message does not say what to change. Test: same five lesson designs, current plugin, baseline versus candidate on Claude, time plus Daniel's look at the decks.

## Codex review loop (investigator, 29 September)

- Loop is typical: about 9 of 15 Codex runs since 19 Sept needed a redesign (about a third before). Recurring reviewer findings: a Do repeats the Teach just before it; every Do answers the same way; a missing visual.
- 28 Sept rounds: round 1 real (Do repeated the taught case; equator Do didn't use its Teach); round 2 caused by round 1's repair (turned the map-choice Do into a third written answer); content gap = Wikimedia certificate failures on essential real maps, after a post-approval helper pass (map helper takes 8 labels, design needed 9) switched maps to real-only composites.
- 4.2.301-302 self-checks ("Do beats read in a row", "answer on the board, read again") target rounds 1-2 but are prose for a low-effort Codex worker; untested on Codex.
- Candidates: (1) validator prints an information-only Do-beat digest (format, first verb, phrases shared with the preceding Teach); (2) redesign hand-over (playbook-lite.md:359) asks for the whole Do run to be re-read, with the reason; (3) helper limits checked before review by check-helper-coverage.py from a table generated or tested against the helper code.
- Still failing after all three: picture download failures (needs a picture-side fallback) and judgement-only reviewer findings.
- Hypothesis only: Codex designer/reviewer at low effort since 4.2.239 (commit e11e064e) may raise redesign rate; needs a matched low vs medium A/B before any change.

## Other Claude workers (investigator, 29 September; scripts in scratchpad\inv-claude)

- Worksheet designer: 4-14 min of fit rounds (5-26 fit failures); 3 of 5 runs built their own brute-force layout harness from engine internals. Root cause upstream: preferences.md Worksheets price table gives heights only and catalogue "smallest usable" is for example content; 4 of 5 handbacks name mispricing (method frame 95 vs 130 wide; place-value chart 79mm+gutter vs 84mm column; diagram 105 vs 206mm -> PAGE_PLAN_GAP and a 12.9 min focused repair).
- Design reviewer: no mechanical waste; the time is the review itself.
- Lesson designer: small waste reading validator source before first validation.
- Adaptation: "598K re-read" is a spilled sed output read once; real harm is copying the example's method-frame size.
- Wall designer lean. Every worker retried its hand-back 3-4 times (spawner gone): a test-setup artefact that inflates minute figures.
- Candidates ranked: (1) a measure mode for the worksheet designer (real width x height per item, what fits after each removal in fit-priority order); (2) upstream pricing with real sizes (adaptation runs the measure, or the price table gains widths); (3) put looked-up facts into check messages and catalogue, run the preflight to learn; (4) harness fix; (5) resume the reviewer for round 2 (low confidence).

## Rereads, orchestrator, picture scouts (investigator, 29 September; scripts in scratchpad\inv-reread)

- Codex redo rounds spend about two thirds of their time rereading instructions (about 15-20 worker-minutes a run); fewer rounds beats cheaper rounds.
- Codex orchestrator: 22M tokens from 197 turns, not reading; 69 waits at 60 s, 42 empty (a third of its tokens); a 10-minute report tail studying validate-run-report.py (51K) and writing its own report script. Claude tail 2-4 min.
- Picture scouts: image loading is cheap (host shrinks images); do NOT downsize (would weaken resolution judgement). Real cost: results-checker refusals ("lacks final outage evidence", "lacks its one retry", "no primary summary") and 3-6 reads of the checker source per scout, 1.5-2.5 min each, both hosts.
- Candidates: (1) longer Codex wait timeout; (2) scout results checker says exactly what to write, or image-scout-attempts.py fills those fields; (3) run-report skeleton printed by validate-run-report.py plus a filler for mechanical sections; (4) resume the same worker for a redo (risky: anchoring, Codex resume unconfirmed); (5) downsizing rejected.
- Cross-cutting pattern: slide designer, worksheet designer, picture scouts, lesson designer and the Codex orchestrator all read a checker's source to learn what it wants. Shared fix: checkers say plainly what to change, and workers run the check to learn.

## Smaller workers (investigator, 29 September; scripts in scratchpad\inv-small)

- Voice editor 1-2 min (Claude), nothing to cut. Helper builder reads code because it writes code. Diagram anchor about 2 min.
- Slide decorator on Codex 6-17 min: 11 of 14 runs read check-optional-pictures.py (format already in context-pictures.md 312-360); the check spawns one search per declined entry, takes 13-31 s on Codex, Codex returns empty at 30 s and the worker restarts it (about 9 min lost 26 Sept).
- Stick-in designer (Codex 28 Sept) started before the helper builder finished the map it needed and dropped the map piece.
- Candidates: (1) optional-picture check runs all searches in one go (identical output required); (2) checker prints a blank per-slide record, no decisions filled; (3) stick-in designer waits for pending helpers; (4) anchor instructions name the dots' coordinate system.

## Instruction reading (investigator, 29 September; scripts in scratchpad\inv-docs)

- Near-verbatim duplication within a worker's reading is only 1-2%; history 2-5%. A big document tidy-up would save little.
- Codex read 5.9M chars of instructions in the geography run; 59% in the design loop; 42 reads cut in the middle (about 1.6M).
- Codex reads every long role file twice (whole file, cut, then paged): about 690K per run. Fix: Codex launch spec prints the paged read command for long role files; Claude untouched.
- "Read in full" references read raw on Codex get cut: add slide designer's visual profile and playbook, and adaptation's reference plus its nine preferences sections, to the paged role read's companions.
- Some workers read whole documents for a few sections (Codex adaptation read all of preferences).
- Stories/dates out: about 20K (1-3%), touches about 5,000 pinned rows; low value. Folding paraphrased repeats: small saving, high risk of lost rules.
- Verdict: do NOT finish the streamline project as a speed route (its own measures show the text is needed; each topic takes days). Finish it later for its quality goal on its own method. Where it stopped: 10A part-built in worktree lessonv4-playbook, branch streamline/10a-playbook; humour, 10B, 10C, topic 9 not built.
- Pull forward from 10B: decorator told to preview a flagged deck but the slide check refuses it (flagged decks get no drawings); run report can pass COMPLETE while the last review says REDESIGN REQUIRED.
- read-reference.py ROLE_COMPANIONS exists only for the voice editor; worker-launch.py line 192 launch line not pinned (candidate 1 needs no repins).

## Whole-run timeline (investigator, 29 September; scripts in scratchpad\inv-timeline)

- Critical path always: lesson designer -> review loop -> helper check -> voice editor -> slide designer -> slide focused repair -> decorator -> build. Worksheet branch finished first in 5 of 7 Codex runs. Slide focused repair on the critical path in 6 of 7 (6-14 min, once 44); decorator always last (6-21.5 min).
- Clean Codex run about 55 min with 8-10 min orchestrator-only time; messy 28 Sept run lost about 25 of 105.
- WORKER_TIMELINE records a worker's FIRST message as its return, so the lesson designer shows 2-4 min instead of 11-17. Fix before trusting it.
- The 29 Sept five-lesson Claude timings are inflated: foreground launches made the worksheet designer wait for the slide designer (11-25 min per lesson). Harness artefact.
- Proposals: (1) draft run report and walk-through during the decorator wait (3-10 min); (2) fix WORKER_TIMELINE; (3) one script for approval-to-launch bookkeeping (1-2 min); (4) decorator beside the slide repair, merging onto untouched slides (6-8 min, medium risk); (5) launch the slide designer during the voice edit with the voiced file withheld (about 3 min, medium risk); (6) tell the slide designer when pictures publish (uncertain); (7) lesson designer before filing ends (about 1 min).
- Rejected: voice editor beside the reviewer or before the helper check; adaptation before the voice edit; wall before the repair.
- Evidence: Codex resumed the same lesson designer for a redesign on 26 Sept in 0.9 min (vs 3.5-4.8 fresh); round 2 approved. Anchoring risk untested.

## Lever 1 test result (29 September, Claude only) - NOT adopted

- Round 1 (general-purpose workers): maths base 14.7 / cand 13.0 min, both pass; PSHE base 12.6 FAILED (exhausted) / cand 15.0 pass.
- Round 2 (real lesson-v4:slide-designer, opus xhigh): maths base 8.8 (7 checks) / cand 11.5 (14 checks); PSHE base 18.0 (5 checks) / cand 15.4 (3 checks). All four passed.
- Neither arm reproduced the 29 Sept pre-study (0-3 checker reads before the first check). The 20-35 min runs of session 61996877 were most likely an artefact of that session's nested sub-orchestrators, not of the instructions. The candidate paragraph is not worth shipping; the copy stays in scratchpad\opt1\cand.
- Every run reported the slide check revealing faults one at a time (stops at the first layout-slot error): the likely real lever is the checker reporting every fault in one run.

## Built 29 September evening (uncommitted, not installed; Claude-tested only)

- A: check-slide-design.js `--flagged-slides` (decorator previews a flagged deck; faults only on flagged slides pass as notes); slide-decorator.md uses it. validate-run-report.py refuses COMPLETE and requires the words REDESIGN REQUIRED when design-review.md's Result says so.
- B: refused teach layouts no longer end the slide check: each is named by slide, a placeholder stands in, the rest is checked (teach-layouts.js expandTeachLayoutsEach). validate-image-scout.py messages say what is missing and where.
- C: check-optional-pictures.py batches its searches (search-educational-svg.js `--batch-file`) and reads the catalogue once: identical output on 9 saved decks, 2.5x faster.
- D: worksheet-html/scripts/suggest.js `--measure`; worksheet-designer.md points to it; preferences.md Worksheets adds a width/labels paragraph after the price paragraph.
- E: scripts/do-beats-in-a-row.py; lesson-designer.md completion pass opens with it (also on a redesign).
- F: worker-launch.py timeline uses each worker's LAST message.
- G (Codex only): worker-launch.py spec prints read_instructions_with for long roles on Codex; SKILL.md tells the wait tool to use a ten-minute timeout.
- Not built: decorator blank record (Codex-only habit, bias risk); worksheet "what fits after each removal" (removal is adaptation's teaching decision); stick-in waits for helper builder (a built helper is not live in the run, so no gain); run report drafted during the decorator wait and one-script bookkeeping (playbook and delivery slice at size budget; Daniel's call); ROLE_COMPANIONS for slide designer and adaptation (duplicate-read risk, needs a Codex test).
- Tests: builder 856 of 856 pass; Python 9 known baseline failures only.
- Owed before release: a Claude lesson run end to end, and a Codex run once usage returns.

## Full Claude test run, digestive system (29 September evening)

- Real make-lesson route, named agents, all A-G changes in. 21:29 to 22:17, about 48 minutes to built deck, worksheets and wall. Lesson designer 16 min, review 6 (approved first time), voice 2, slide designer 17 (returned a content block on slides 22-23), adaptation 3.5, worksheet designer 8.5 (used --measure three times, one engine-source read), decorator about 5 on a flagged deck (17 drawings: fix A working), wall designer 3.
- Blind judge vs last week's approved deck: A (approved) slides 8, sheets 6; B (new) slides 7, sheets 7.5; slight preference for A overall. B's weaknesses: busier open-web diagram (liver, pancreas unlabelled), tiny vocab thumbnails, starter asks "nutrients" before it is taught, oesophagus card early, guessable three-way poo choice. None trace to today's changes (checkers, measure tool, Do list, launch/timing fixes); they are run-to-run design variation and the picture source.
- Found and fixed during the run: check-helper-coverage missed stick-in label-diagram (reads dispatcher now); wall renderer overflowed on tall high-res labelled pictures (density capped only above 250M pixels; 165 wall tests pass).
- Daniel's rulings from slide 22: the half-slide criteria cap should apply only when the board carries the work; table columns should size to their words (equal widths waste space); asked whether criteria tables can hold pictures (not yet; proposed a picture column).
