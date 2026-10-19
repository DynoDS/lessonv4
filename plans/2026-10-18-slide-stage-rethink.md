# Could the slide stage work differently?

Investigation for Daniel, 18 October 2026. Recommendations only. No plugin installation or production change.

## My answer

There is a credible opportunity to stop the designer repeatedly discovering how things fit. But these tests do not establish a replacement that is faster, cheaper and at least as good across subjects.

I would keep the designer responsible for what children see and how a teaching sequence unfolds. My preferred next design would give it a few measured, rendered arrangements of the actual teaching moment, including its answer states, so it chooses from evidence. That is a recommendation for a further bounded prototype, not a proven saving or permission to build it.

The tested automatic arranger is not ready. Its corrected trials took 17.75 minutes for maths and 18.39 for science, against unchanged-designer baselines of 13.04 and 15.01. Both still needed substantial composition and repair. An earlier flawed maths pilot also lost the stepwise answer reveals Daniel has approved, despite passing the checks; the corrected trial restored them during review. The script-built first draft safely automated too little to replace most of the designer's work, and its corrected science trial failed visual review.

## What the job is for

**Purpose.** Make the already settled lesson teachable from the board by a teacher encountering it for the first time. The designer decides grouping, emphasis, visual size and pacing while preserving the teaching, wording, examples and answers.

**Handoff.** A faithful, checked description of every slide and reveal, with the promised representations and source identities, plus a measured map of room for later illustrations. The private rendered deck is evidence; the lesson coordinator produces the final classroom deck later.

**Daniel's standard.** The main thing to look at and the task must be obvious and readable, with useful support beside the work and meaningful changes on each click. Preserve the words and teaching, split crowded teaching across slides, keep pictures useful, and judge the result by looking at it rather than counting slides or green checks.

Specific rulings used here include sum, counters and criteria together on the first written exchange; showing only the changing counter columns where appropriate; criteria present when the work starts; criteria width governed by the words; and stable, successive answer reveals. A longer deck is not a fault. Optional decoration must not displace essential teaching.

## Where the time goes now

The current route asks the designer to interpret a rich lesson plan, translate prose descriptions of visuals into exact drawing instructions, choose an arrangement, measure it, repair it, run the full check, inspect the rendered slides and repair again if needed.

The builder already fits text, shares text sizes, redistributes some stacked space, narrows support panels and supplies named teaching arrangements. The proposal is therefore to automate the remaining search, not to introduce automatic sizing for the first time.

The five named Claude records support the reported pattern:

| Lesson | Total minutes | Recorded tool envelopes | First full check starts | Explicit builder/checker source reads or searches |
|---|---:|---:|---:|---:|
| 29 | 38.23 | 7.10 | 36.35 | 44 |
| 30 | 34.37 | 7.36 | 30.23 | 33 |
| 31 | 35.65 | 8.25 | 31.57 | 19 |
| 32 | 27.33 | 4.18 | 25.57 | 32 |
| 33 | 33.90 | 5.17 | 28.14 | 21 |

These source counts use a broader, explicit definition than the brief: repeated read/search actions, including checker and measurement source, rather than unique files or only successful engine reads. An independent review corrected both false positives and missed searches. The late first checks and repeated layout experiments are more useful evidence than the precise source-read count.

Between 23.15 and 31.12 minutes per run fall outside matched tool envelopes. That includes guidance consumption, generation, scheduling and possible waits. It is not a direct measurement of private thinking. The visible sequence strongly supports repeated layout discovery as a substantial part of this batch, but it does not justify labelling every remaining minute wasted layout work.

Across these five runs there were 18 to 33 layout-trial calls and only 1 to 3 full-check invocations. One call can try many arrangements. For example, a single lesson 29 script probes 14 counter dimensions. The repair-pass limit does not limit that earlier search.

The cross-subject evidence matters. A reviewed Claude history run took 33.87 minutes, with its first check at 23.63 and 23 source-read/search actions. A science run took 24.95 minutes, with its first check at 21.79 and 33 source actions. Their work also includes picture sizing, teaching arrangements, content interpretation and repairs. This is a general presentation problem, not just a subtraction layout problem.

The archive scan identified 89 Claude and 225 Codex slide-worker records, including older plugin families, experiments and repairs. It found 31 exact Claude role-metadata matches plus three focused repairs, with further workers identified through aliases and their actual assignment. It did not confirm approximately 68 exact matches. The row-by-row inventory preserves uncertain and excluded records instead of calling all 314 comparable production lessons.

### Codex is different

The current launcher confirms gpt-6.1-sol at medium thinking. Every new worker's own recorded settings confirm that combination. The five named Claude workers actually used xhigh; the uninstalled high setting does not describe them.

Three reviewed October 15 Codex lessons took 9.42 minutes for maths, 7.29 for history and 12.61 for science. However, all three reported unavailable visual inspection after rendering failures. Their shorter times cannot establish equal quality, nor isolate the effects of model, effort, plugin version or lesson.

The new unchanged-role baselines took 13.04 minutes for maths and 15.01 for science, including successful PowerPoint rendering and inspection. Neither explicitly read builder source. Maths made 11 measurement calls and reached its first full preview at 9.51 minutes; science made eight and reached it at 7.97. Both still needed visual repairs after a passing check. A source-reading ban would miss much of their actual work. All experiments here deliberately use Codex, so they do not establish a saving for Claude.

### Tokens and attribution

The five Claude runs recorded 23,703 to 48,824 output tokens, 38.52 to 64.95 million cached-input tokens and about 0.51 to 0.64 million cache-creation tokens. Repeatedly sending the accumulated context explains why cached totals are large. These are not unique words read.

The evidence inventory separates reading, source inspection, layout trials, drafting, checks and repairs. For Claude, deduplicated response usage is assigned to the outgoing action where linkage is available; mixed responses remain mixed. That describes the response's action, not what every token was mentally used for. Reliable response-to-category linkage was not established for historical Codex records, so those tokens remain explicitly unassigned by activity. Whole-run Codex totals are checked against the independent cumulative counters where available. Missing category usage is not zero usage.

## Different approaches considered

| Approach | What it could gain | What could get worse on Daniel's slides | Evidence here |
|---|---|---|---|
| Software chooses arrangement and size from meaningful groups | Replace repeated model-led geometry trials with a batch search | Important pictures or counters can be small; support can dominate; answer states can move; mathematically fitting arrangements can teach badly | Narrow prototype tested on both subjects; not dependable |
| Designer chooses from a small rendered shortlist of the actual content | Give direct visual evidence before committing; preserve judgement | A limited menu can anchor choices, miss a better shape or become another large catalogue to read | Recommended next direction, not tested end to end |
| Script assembles slides, model reviews and completes them | Reduce copying and routine assembly | Missing material can look finished; the reviewer may rebuild the draft; prose visual instructions may be misinterpreted | Safe partial-draft prototype tested; most work remained |
| Cheaper placer, stronger reviewer | Spend less on routine assembly | Duplicated reading and repair can erase savings; weak pacing or missing meaning can survive a superficial review | Not tested; no cheaper model substituted |
| Define a representation once, reuse its states on board and paper | Reduce repeated translation and inconsistency | Board handwriting space and staged reveals differ from paper answer space; a shared visual must not dictate every surface | Promising larger architecture, unproved |
| Combine designer and decorator | Retain visual context and reduce handoffs | Optional pictures may crowd essential work; the slow worker inherits more work; later resources may start later | No evidence to reverse the existing split |
| Replace the slide system with a free-form presentation maker | Avoid the detailed current assembly process | House style, shared diagrams, reliable answer states and checks may be lost | Too broad for this controlled comparison |

A generic catalogue of measured component sizes is less risky than changing the whole system, but it can go stale and cannot show how actual wording and photographs interact. A small live shortlist is the stronger version of that idea.

## Controlled trials

The inputs were two real saved designs: Year 4 column subtraction, lesson 29, and Year 4 science, how we hear sounds. These were the second saved working-folder variants, not a claim to replay tonight's exact version. The same lesson design, helper commitments, required photographs and picture information were used in each clean comparison. No worker saw a previous completed lesson deck or another arm's result.

The baseline is the unchanged current working-tree snapshot, including existing uncommitted improvements. It is not the installed version used in historical Claude runs. All experiments and prototype code stayed in scratch copies. The source role and full checker were not changed. Each worker was a direct Codex execution with its readable prompt retained, on the real model and thinking level, with the normal first check and at most three grouped repair passes.

The automatic-arrangement arm kept the designer choosing the meaningful groups. Software tried permitted beside/below splits and stack shares, then returned an ordinary slide draft. Named Teach arrangements stayed with the existing system. It was a limited prototype of geometry automation, not a universal layout engine.

The script-draft arm copied only decisions that were unambiguous in the source and listed unresolved material. It produced one maths slide and three science slides before the designer took over. Prose descriptions of visual configurations prevented safe automatic completion of most teaching and practice. This tests a conservative partial draft, not a mature complete compiler.

One initial science draft trial lacked the picture anchor information and provenance sidecars, although the design and picture pixels matched. It is retained as a flawed pilot and excluded from the clean comparison. A fresh direct worker repeated it with the full frozen inputs. This was a setup correction, not a search for a favourable result.

The initial arrangement trials also returned no text-size measurements, including blank measurement logs where a preview existed. They were repeated with an explicitly permitted measuring subprocess and added execution diagnostics. The search and ranking algorithm stayed unchanged. The corrected trials returned successful execution records and actual measurements. This correction matters: the first trials cannot fairly test size-informed selection. All earlier outcomes remain visible below.

### Time and checks

| Subject | Method | Minutes | Full checks | Repairs | Full check | Handoff | Slides |
|---|---|---:|---:|---:|---|---|---:|
| Maths | Unchanged designer | 13.04 | 2 | 1 | Pass | Complete | 36 |
| Maths | Automatic arrangement + designer | 17.75 | 2 | 1 | Pass | Complete | 34 |
| Maths | Script draft + designer | 12.79 | 2 | 1 | Pass | Complete | 40 |
| Science | Unchanged designer | 15.01 | 3 | 2 | Pass | Complete | 27 |
| Science | Automatic arrangement + designer | 18.39 | 4 | 3 | Pass | Complete | 30 |
| Science | Script draft + designer | 17.93 | 4 | 3 | Pass | FAILED visual review | 26 |

Full checks count the worker's complete preview/check attempts. The independent final check is additional verification and is not counted as another worker repair. Every final preview above was produced by PowerPoint and matched to the final slide description, including the withheld science candidate. An earlier preview cannot stand in for the retained result.

### Recorded token use

| Subject | Method | Fresh input | Cached input | Output |
|---|---|---:|---:|---:|
| Maths | Unchanged designer | 275,364 | 12,754,432 | 22,443 |
| Maths | Automatic arrangement + designer | 308,299 | 15,196,160 | 28,741 |
| Maths | Script draft + designer | 263,703 | 13,601,152 | 21,251 |
| Science | Unchanged designer | 257,405 | 16,437,248 | 23,828 |
| Science | Automatic arrangement + designer | 299,154 | 15,150,592 | 34,423 |
| Science | Script draft + designer | 330,682 | 19,384,576 | 29,609 |

Cached input is already part of total input, so it is separated from fresh input here. Reasoning tokens are already part of output. No monetary price or saving has been guessed. All completed totals reproduce the session's cumulative counters. Timing includes normal reading, measurements, checks, rendering, review and handoff.

The script makes its partial draft in about 0.1 seconds, before the reviewer starts. Creating the prototypes took 10.01 worker minutes and 22,474 output tokens for the arranger, and 5.37 minutes and 12,992 output tokens for the script draft. Those development costs are separate from per-lesson figures; they exclude this investigation's analysis and setup work.

### Earlier compromised trials

| Trial | Minutes | Full checks | Output tokens | Why excluded from clean comparison |
|---|---:|---:|---:|---|
| Maths: Automatic arrangement + designer | 12.45 | 2 | 23,383 | Size measurements unavailable; explicit execution preflight added for repeat |
| Science: Automatic arrangement + designer | 16.34 | 3 | 27,666 | Size measurements unavailable; explicit execution preflight added for repeat |
| Science: Script draft + designer | 15.95 | 4 | 25,204 | Picture anchor and provenance sidecars missing |

All three earlier trials ultimately passed after designer work. Their defects and visible results are retained; they are not selected or discarded according to speed.

## What the trials actually establish

The initial arranger trials tried 518 candidates in about 99 seconds for maths and 362 in about 44 seconds for science. All reported main-text measurements were unavailable. The larger drafts failed and the designer had to regroup or repair them. Their trial volume is not a count of successful layouts. Valid isolated samples had not exposed execution problems and failures involving paired slides and complete lesson constraints.

The corrected arrangement trials obtained actual measurements. Maths tried 658 candidate arrangements in about 114 seconds; science tried 503 in about 62 seconds. All 33 recorded measuring subprocesses completed successfully. These counts include refused arrangements and are not counts of successful slide designs.

The completed maths deck took 17.75 minutes, about 36% longer than the 13.04-minute baseline. It used 28,741 output tokens against 22,443, about 28% more. Both needed two full checks. The science deck took 18.39 minutes against 15.01, about 23% longer, and used 34,423 output tokens against 23,828, about 44% more. It needed four full checks against three. Those are observations from these runs, not estimated production averages. Science's cached-input total was lower, so the output increase alone is not a monetary cost comparison.

The computer could enumerate arrangements quickly, but the designer still had to handle the cases that matter to teaching. Testing one slide in isolation rejected linked question/answer states because their partners were absent. Five practice calculations still needed the designer to split them into three and two. Some important diagram content was outside the text-size ranking. A wide science photograph needed a different arrangement, and the whole bell-to-brain chain needed its own board. These are limitations of this particular prototype, not reasons to abandon automatic fitting in principle.

The corrected maths deck has 34 slides and keeps the counters, sum and criteria together at the first written exchange. It also preserves successive answer digits for all three whole-method models. Those reveals were added in its repair pass, which shows why the review remains consequential. Its first model uses large counters above the sum with the question and criteria beside them. Some practice charts are narrow and sit at different heights, and the final explanation is dense beside the complete criteria. The deck is a plausible teaching alternative, but neither equal teacher preference nor a speed gain is established.

I inspected all final overview sheets and opened the first exchange, practice, later model states and final explanation at full size. Apparent cropping in parts of the overview was absent from the full PowerPoint pages, so it is not reported as a slide defect.


This is evidence that this prototype is insufficient. It is not evidence that a well-built arrangement engine cannot work. I would not count its trial volume as successful layouts or present its final repaired decks as autonomous machine design.

The script's safe contribution was very small. In maths, the reviewer reconstructed even the supplied starter and wrote the remaining lesson. Any small time difference from baseline cannot credibly be attributed to meaningful automatic slide decisions. The prototype also added a gap ledger to read.

One revealing result from the initial maths arrangement trial is worth retaining despite its execution problem. It produced a 27-slide deck with the required first exchange, readable questions and complete criteria, but it jumped from blank calculations to full answers. The 36-slide baseline revealed digits successively. That is a material loss against Daniel's recorded preference, even though the checker passed both. This demonstrates a weakness in relying on check success, not a causal claim that the arrangement tool deleted the states. The script-assisted maths result preserved those steps and used 40 slides; its extra slides are not a fault in themselves.

There are also genuine alternative arrangements worth Daniel's judgement. In the script-assisted maths deck, page 7 groups the counters above the sum and puts the question and criteria alongside. The baseline puts the counters above the criteria to the sum's right. Both keep all three things together. This difference was composed by the model, not proved to be a benefit caused by the script.

The corrected script-assisted science trial is an explicit failure. It used all three repair passes and ended after four full checks. Every automatic check passed, but the designer still saw question cards changing width when the answers appeared, and withheld the final handoff. I inspected the full starter pages and confirmed the change. The diagram teaching also combines the ear bones and cochlea more tightly than the baseline. This is not an equal-quality speed result.

The science baseline itself is not perfect: some ear labels are small, and its starter answer removes the recall pictures. The correct comparison is between actual teaching sequences with visible tradeoffs, not a perfect baseline and flawed candidates. Both designs inherit the fixed source's limitation that the air route is pictured without depicting the push travelling through the air.

The corrected arrangement-assisted science deck has 30 slides. It keeps the starter photographs during the answer states, gives the labelled ear a generous area and keeps the complete criteria beside the final model answer. Those are useful visible qualities. It also puts the ear-bones and cochlea explanations together on one fairly dense board, whereas the baseline separates them. Its question about whether the sound has been heard already shares a board with "Not yet", reducing the opportunity to pause before that answer. The model/non-model comparison is readable at full size but text-heavy. These are choices for Daniel to judge, not grounds for declaring the entire deck better.

All three final overview sheets were inspected, together with full-size pages for that question, the labelled diagram, the model comparison and the final answer. This trial needed all three repair passes, including changes to diagram size, reading order and the visual distinction between a question, a writing instruction and a completion condition. It demonstrates useful arrangement assistance but no removal of the designer's broader job.


The source-text spot audit checks selected teaching sentences, questions, takeaways and vocabulary definitions against visible slide text. It supports the fidelity review but does not prove complete pedagogical coverage. In particular, it cannot detect the lost stepwise reveal sequence. The complete rendered sequences were therefore inspected as well.

## Ranked recommendations

**1. Keep the current production stage for now.** Neither tested replacement has earned adoption. Keep the full check and rendered inspection, and judge future speed work against Daniel's actual rulings, including successive reveals and useful picture size. The downside is that the current slow runs remain until a better route is demonstrated.

**2. If Daniel wants further development, make the next prototype a visual choice service for a whole teaching moment.** The designer would state the main work, the support that must stay with it, the question and answer states, and the relationships that must remain fixed. Software would return a few genuinely fitting rendered options, with pictures, counters, criteria and writing space all protected. The designer would choose and review the sequence. This is cross-subject work, not a ready-made subtraction page. The downside is real development effort and possible anchoring to a restricted set of choices; no time or cost saving is yet proved.

The failed prototype tells us what that next test must cover: evaluate linked states together; obtain real measurements even when neighbouring candidates fail; reject missing measurements rather than rank them as success; consider the visible contents of diagrams and photographs; and keep a clear escape route when no arrangement works. Do not quietly shorten words, shrink important objects or split apart support Daniel says belongs together.

**3. Explore a reusable visual description only as a separate, larger proposal.** Exact visual data could remove repeated interpretation across slides and other resources. Keep lesson planning focused on teaching, and preserve different needs on board and paper. The downside is a new handoff and more system complexity; the partial-draft result shows why that foundation would be needed, not that it would pay for itself.

**4. Defer cheaper workers, merging roles and a free-form replacement.** They introduce more quality and coordination risks than the evidence currently resolves. Likewise, changing thinking level is a separate experiment. Nothing here shows that lighter thinking preserves quality, or that installing the high setting will solve the structural problem.

This builds on, rather than repeats, previous work. The September source-reading restriction was not adopted after a test-harness explanation emerged. The nearby-layout helper helped only about one refused slide in ten. The current snapshot already has broader measurement feedback. Earlier unrestricted layout scoring and reduced-context tests did not produce a consistent teacher-preferred improvement. Those findings argue for actual rendered evidence and constrained choices, not another blanket instruction.

## Proven, inferred and still unknown

**Proven in these trials:** the fixed model and effort were used; source inputs were held fixed in the clean arms; the observed times, tokens and check attempts are recorded; final checks can pass while an approved teaching feature is absent; and both prototypes needed substantial designer work.

**Supported inference:** the Claude traces contain a costly repeated search for presentation outcomes, and direct knowledge of actual rendered alternatives could remove some of that search. A whole teaching moment is a more appropriate unit than an isolated slide because continuity is part of quality.

**Not proved:** a production speed-up, lower monetary cost, equal teacher acceptance, a universal best layout, safety of a cheaper model, or the benefit of moving decisions upstream. One clean run per arm and subject is exploratory. Runs overlapped on one computer, and rendering and service load can affect timing. There was no large consistent quality-preserving winner to justify claiming repeatability.

## Evidence and review copies
The complete record is retained locally. The report describes decisions by their job; these links provide the audit trail.
### PowerPoint-drawn PDFs
- [Maths: Unchanged designer](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/review/baseline-maths/render/Year 4 Maths - Column subtraction (one exchange)-source.pdf>)
- [Maths: Automatic arrangement + designer](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/review/arranger-maths-repeat/render/Year 4 Maths - Column subtraction (one exchange)-source.pdf>)
- [Maths: Script draft + designer](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/review/compiler-maths/render/Year 4 Maths - Column subtraction (one exchange)-source.pdf>)
- [Science: Unchanged designer](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/review/baseline-science/render/Year 4 Science - Explain how we hear sounds-source.pdf>)
- [Science: Automatic arrangement + designer](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/review/arranger-science-repeat/render/Year 4 Science - Explain how we hear sounds-source.pdf>)
- [Science: Script draft + designer (retained failed draft)](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/review/compiler-science-repeat/render/Year 4 Science - To explain how we hear sounds-source.pdf>)

- [Two-page first-exchange comparison: baseline then model-composed alternative](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/review/output/pdf/first-exchange-comparison.pdf>)

The two-page comparison copies the original PowerPoint-drawn pages without changing their appearance. It illustrates a teaching choice, not a proven effect of the script.

### Detailed evidence
- [Protocol and setup corrections](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/protocol.md>)
- [Corrected historical audit](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/trace-review/review.md>)
- [Every identified historical run](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/trace-review/corrected-runs.json>)
- [Historical activity and usage table](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/trace-review/activity-buckets.csv>)
- [Exact historical source commands and validation](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/trace-review/engine-source-review.md>)
- [Experiment timings, settings and token totals](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/experiment-results.json>)
- [Experiment action sequence](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/experimental-activities.json>)
- [Independent final checks](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/independent-verification.json>)
- [Independent visual review](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/visual-review.md>)
- [Selected source-text audit](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/content-spot-audit.json>)
- [Source and fixed-input integrity](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/integrity-results.json>)
- [Final preview provenance](<C:/Users/Daniel/Projects/lessonv4/evaluations/slide-stage-rethink-2026-10-18/review-manifest.json>)

### Daniel's rulings and prior work
- [Why counts cannot judge classroom feel](<C:/Users/Daniel/.claude/projects/C--Users-Daniel-Projects-lessonv4/memory/counts-do-not-measure-feel.md>)
- [Keep successive answers inside the column method](<C:/Users/Daniel/.claude/projects/C--Users-Daniel-Projects-lessonv4/memory/column-answers-step-by-step-loved.md>)
- [Keep counters, sum and criteria together](<C:/Users/Daniel/.claude/projects/C--Users-Daniel-Projects-lessonv4/memory/counters-beside-the-sum.md>)
- [Daniel's goal for automatic fitting and its earlier tests](<C:/Users/Daniel/.claude/projects/C--Users-Daniel-Projects-lessonv4/memory/engine-sorts-it-not-refuses.md>)
- [Separate evidence on lighter thinking](<C:/Users/Daniel/.claude/projects/C--Users-Daniel-Projects-lessonv4/memory/designer-effort-test-2026-10-15.md>)
- [September measurement and its withdrawn explanation](<C:/Users/Daniel/Projects/lessonv4/plans/2026-09-29-optimisation-measure.md>)
- [October measurement work](<C:/Users/Daniel/Projects/lessonv4/plans/2026-10-17-streamline-measure.md>)
- [Earlier streamlining plan](<C:/Users/Daniel/Projects/lessonv4/plans/streamline-plan.md>)

Each experiment folder retains its readable launch prompt, process times, direct-session identifier, full event record, checked candidates, final slide description and preview evidence. The original historical audit is retained too, but the corrected review supersedes its source-action counts and broad production-median interpretation.

The integrity check covers 1,360 frozen plugin files, all still identical to the starting snapshot. An earlier check also found the live source identical; a later check detected changes in two live files concerning resource opportunities and their tests, at 21:50 and 21:51 UTC. No experiment edited those files, and they were neither overwritten nor reverted. The trial snapshot remained fixed. This investigation made no edits to the source plugin, installed plugin or plugin cache. Scratch copies and this report are its deliverables.

Normal sandbox execution initially refused Python startup in every slide worker; each recovered through the permitted execution route. Both science arranger workers were refused access to calibration decks because the experiment prohibited reading previous completed decks; they continued with the written guidance. This is recorded as an experimental restriction, not a missing production capability.

The next decision belongs to Daniel. No recommendation here authorises implementation, installation, a changed classroom appearance or publication.
