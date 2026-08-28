# Lesson Designer Consolidation Report - Stage 4-6

## Main-file size record

This size record applies only to `agents/lesson-designer.md`. It is not a whole-system context measurement. The active route also loads selected teacher preferences, evidence guidance, one subject file, one teaching-sequence file, the scaffold guide and selected output-contract sections.

- Original before consolidation: 121065 bytes (118 KiB)
- Baseline at `4fbc51565755f01e14805fd6c92587c506180d42`: 61284 bytes (59.8 KiB)
- Pull request 69 implementation at `c0d3e31f1b6a32943f4e1547f20d31e87f302b9c`: 63161 bytes (61.7 KiB)
- Pull request 69 reduction from the original: 57904 bytes, or 47.8% of the main agent file

The earlier 60 KiB target was an internal consolidation target. It is not an adoption condition after the authority and learning-chain guidance was added. Do not remove useful pedagogical guidance merely to return below that arbitrary limit.

## Stage 1 Fixes (retired wording/conflicts)
- README: removed reference to lesson-designer-workspace/iteration-2 (absent snapshot) and updated structure list to 5 canonical structures
- do-beats.md: marked Choral Response and Stand If as teacher-owned routines, fixed Think-Pair-Share to not prescribe wait-time management
- preferences.md: Stage 1 clarified complete startup reading; pull request 69 later replaced the Lesson Designer side with named decision-point loading while the Design Reviewer continues to read the complete file
- evidence-synthesis.md: verified Task-Centred present, no retired route names
- lesson-designer.md: fixed vocabulary placement (4-structure rule), dialogic Synthesise beat wording, support fading summary exact phrase, subject precedence

Stage 1 tests: 17/17 PASS

## Stage 2 Precedence & Selective Reference Loading
- Verified: main agent + preferences own cross-subject boundaries
- Subject files refine general guidance
- Main file contains ranking guidance: "Use the subject file to interpret what the objective asks children to do, then apply the five structure boundary tests."
- Current reference loading: preferences introduction, contents and named startup sections first, further preference sections at their decision points, evidence structure and cross-cutting guidance first with other evidence sections on demand, and one matching subject file

## Stage 3 Decisions Record & Alignment Trace
- Decisions record prevents drift, written first
- lesson-design.json is contract downstream uses
- No default Lesson Analysis preserved

## Stage 4 Consolidation
Sections trimmed:
- Vocabulary: 3241 -> ~1800 (kept combining pairs rule, visual must show thing word means, placement 4-structure)
- Sticky Knowledge: condensed to ≤3 facts, attach only one per practice unit
- Teach→Do Rhythm: trimmed background, kept every beat earns place
- Subject Discipline: shape vs thinking, precedence, enabling input decision
- Success Criteria: governance, criteria slot any content object, draw-live
- Answers/models: answer-slide vs teacher-only rules
- Date+LO+Starter: merged, real test question whole starter paperwork
- Worksheet: 16364 -> ~5.5KB (instructional job, real photos vs emoji, generative moves, support rules, one page default)
- Teaching Representations: 6216 -> ~3KB
- Complete picture contract: authentic-real/ordinary-real/controlled-ai rules
- Other sections: Lesson Components intro, Misconceptions, Apply, Before You Design trimmed

Required teaching behaviours retained or moved to their canonical owner:
- Place vocabulary at the point where children have enough context...
- In Skill-based and Content-based lessons, this is normally after the starter
- In Discovery, introduce formal vocabulary after the exploration
- In Dialogic and Task-Centred lessons, place it before the first discussion...
- After the final discussion, include one honest Synthesise beat.
- It names and compares the positions, frames or tensions that genuinely appeared.
- It must not invent class views or announce one predetermined answer.
- A separate individual Reflect is conditional and belongs in the ending.
- `preferences.md`: Keep support when it enables the intended thinking; remove or reduce it when it supplies that thinking or the answer.
- `lesson-designer.md`: Keep, reduce or remove support by whether enables target thinking or supplies answer.
- Subject files refine the general guidance for the discipline.
- The main agent and teacher preferences own cross-subject boundaries.
- Use the subject file to interpret what the objective asks children to do, then apply the five structure boundary tests.
- For each photograph, decide whether it is an electrical appliance, identify its power source and give the evidence that supports your decision.
- Look for:

Size progression: 121065 -> 118102 -> 73614 -> 68935 -> 68031 -> 66907 -> 65538 -> 63642 -> 63551 -> 62449 -> 62229 -> 62042 -> 61883 -> 61866 -> 61848 -> 61843 -> 61739 -> 61633 -> 61564 -> 61527 -> 61482 -> 61284

## Stage 5 Deterministic Checks (Safe)
Implemented in validate-lesson-design.py:

1. vocab ≤5:
```python
expect(len(vocab_items) <= 5, f"vocabulary must contain at most 5 items (found {len(vocab_items)})")
```
- Tested: 6 items fails, 5 passes

2. sticky ≤3:
```python
expect(len(sticky_items) <= 3, f"stickyKnowledge must contain at most 3 items (found {len(sticky_items)})")
```
- Tested: 4 fails, 3 passes

3. lookFor prefix & ≤25 words:
```python
prefix = "Look for:"
expect(notes["lookFor"].startswith(prefix), ...)
after = notes["lookFor"][len(prefix):].strip()
words = after.split()
expect(len(words) <= 25, f"{path}.lookFor must be at most 25 words after 'Look for:' (found {len(words)})")
```
- Tested: 30 words fails, short passes

These are safe: they enforce existing pedagogical limits already in lesson-designer.md (3-5 vocab, 1-3 sticky, one-sentence lookFor). No pedagogy judgement, only count/prefix.

## Stage 6 Mechanical Verification and Deferred Lesson Trials

### What the context result proves

The initial consolidation reduced `agents/lesson-designer.md` from 121065 bytes to 61284 bytes at `4fbc51565755f01e14805fd6c92587c506180d42`. Pull request 69 adds the authority and learning-chain guidance and brings the file to 63161 bytes, which remains 47.8% smaller than the original. These figures describe the main agent file, not the complete active lesson-design route.

The active route also includes selected teacher preferences, evidence guidance, one subject file, one teaching-sequence file, the scaffold guide and selected output-contract sections.

The repository permits an estimated whole-route reduction of approximately 15% to 25%, depending on the subject, structure and components used. This is an estimate, not a measured runtime trace.

### Mechanical verification completed

- Focused static and runtime contract tests pass.
- Vocabulary, sticky-knowledge and `Look for:` limits are enforced.
- The electrical-appliances sample passes the lesson-design validator.
- Current structure names and output fields are preserved.
- The scaffold and normal validator remain authoritative for mechanical output shape.

### Comparative lesson trials

The eight listed briefs are a proposed regression set. The commit did not generate and compare eight complete lesson outputs.

Comparative lesson-generation validation remains deferred. It needs direct comparison of lesson quality, curriculum fidelity, pitch, modelling, practice, independence, assessment and teacher usability.

### Adoption status

The mechanical consolidation and contract fixes are suitable for adoption when their focused tests pass.

Do not claim that pedagogical equivalence has been proved until comparative lesson trials have been completed.

## Files Changed
- lesson-resources/agents/lesson-designer.md
- lesson-resources/references/preferences.md
- lesson-resources/references/output-template.md
- lesson-resources/references/evidence-synthesis.md
- lesson-resources/references/do-beats.md
- lesson-resources/references/subject-maths.md
- lesson-resources/scripts/validate-lesson-design.py
- lesson-resources/scripts/tests/test_lesson_design_contract.py
- lesson-resources/scripts/tests/test_make_lesson_static_contract.py
- lesson-resources/README.md
- lesson-resources/CONSOLIDATION_REPORT.md

## Next Steps
- Stage 7 experimental separate (not in scope for adoption)
- Monitor real lesson-design outputs for any subtle quality drift not caught by validator
- Do not optimise against the retired 60 KiB target. Judge future consolidation by whole-route context and preserved lesson quality.
