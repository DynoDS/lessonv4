# Lesson Designer: conditional context, 10 September 2026

## Acceptance and scope

Reduce irrelevant fixed Lesson Designer context while preserving the teaching requirements, exceptions, curriculum boundary, teacher voice, ownership, model settings and independent review. Fewer bytes or a valid output schema alone does not demonstrate unchanged lesson quality.

Baseline: `work` at `45d8a7ede51bd7d372777258e42be017f6877e9c`, following the exact-section-reader patch. An isolated GitHub Actions checkout archived that exact revision; the original role's Git blob was verified as `dbb9734b1c7fb22ceae65807fdaf33c83b99ca0a`. No saved live lesson traces or matched model runs were available for this change.

The supported gap is context debt: the fixed role carries detailed execution rules for components some lessons do not use. The existing section reader already supplies the required mechanism. This change adds one conditional reference, not another agent, scheduler, runtime script, dependency, context ledger or output contract.

## Change and preservation

| Moved section | Source bytes moved verbatim | Activation before the decision |
| --- | ---: | --- |
| Dialogic route | 1,589 | Dialogic is a candidate, before committing the route |
| Task-Centred route | 1,591 | Task-Centred is a candidate, including distinguishing sustained work from repeated practice |
| Representation configurations | 1,845 | Before specifying or changing a configuration in any subject |
| Generated worksheet | 11,124 | Before choosing a generated sheet's activity, examples, shape, support or fit |
| Photograph acquisition | 6,186 | A required photograph is being considered, including Maths and repairs |

All 22,335 source bytes moved into `references/lesson-designer-components.md` were compared with the pinned original and retained unchanged. The main authority order explicitly retains these delegated sections at the main agent's precedence; moving a rule does not demote it below a teaching-route reference.

The core retains the guidance needed to decide whether a component is needed: visual selection, photograph-need and engine-tool boundaries, factual research without photographs, the picture budget, supplied-sheet coverage/non-duplication and adaptations, shared-frame routing, representation eligibility, modelling state, exact worked instances and the writing-form boundary. The worksheet section also contained slide and general pupil-wording rules; those stay in the core rather than disappearing when the teacher supplies a worksheet.

One duplicate is removed: the short inline five-route entry table. The existing mandatory `--structure-menu` still supplies all five original evidence-based entry conditions, with candidate-specific detail before commitment and Discovery safeguards across routes. The pedagogical decision record, completion passes, voice examples and reviewer are unchanged. A more aggressive consolidation of the two planning inventories was considered and not shipped because preservation was less clear. No claimed saving depends on removing quality checks.

The old location-dependent assertions now use the actual runtime section reader, preserving their original teaching assertions. A stale assertion about same-level-only section boundaries was updated to the earlier reader patch's actual peer-or-higher contract. New tests check extraction, non-overlap, prospective activation, retained authority, cross-subject and supplied-resource exceptions, and reference reachability.

## Context accounting

The fixed role falls from **136,175 to 115,647 UTF-8 bytes**: 20,528 bytes, or **15.07%**, less fixed role text. The new reference is 22,804 bytes. When detail is needed, it returns to context.

These illustrative views include the new reader's source wrappers, but exclude all other unchanged references, teacher input, generated outputs, tool-call syntax and success markers. They are not total-run token, latency or subscription-usage measurements.

| Conditional sections actually needed | Role plus selected text | Difference from baseline role |
| --- | ---: | ---: |
| None, for example a suitable supplied sheet without photos or configured helpers | 115,647 bytes | 15.07% less |
| Generated worksheet and representation configurations | 128,724 bytes | 5.47% less |
| Generated worksheet, representation configurations and photographs | 134,941 bytes | 0.91% less |
| Dialogic and a generated worksheet | 128,504 bytes | 5.63% less |
| All five, including comparison of both candidate routes | 138,163 bytes | 1.46% more |

This is selective loading, not universal compression. Routing adds a small overhead, and the saving depends on which conditions apply. Batch needed sections with existing reads rather than treating each field as a reason to fetch them again.

## Validation results

- The committed baseline reader passed all 36 unit tests in an isolated GitHub Actions checkout.
- Reader, loading and new component tests: **67 passed**, plus 41 parametrised subtests.
- Full baseline Python suite under `scripts/tests`: **1,464 passed, 7 failed**, plus 1,675 subtests.
- Full candidate Python sweep ran in four isolated worktrees: **1,490 passed, 7 failed**, plus 1,724 subtests. It exposed one further location-dependent assertion in `test_picture_ladder_sources.py`; after changing only its source lookup, that complete file passed **22 tests and 30 subtests**. The resulting aggregate is **1,491 passed and 6 unchanged baseline failures**. This aggregate combines the sweep and final affected-file rerun; it is not a claim that the whole suite was rerun after that last test-only edit.
- Three Node documentation/photo-costing suites: baseline and candidate both **56 passed, 2 failed**.
- Plugin-root verification and `git diff --check`: passed.
- A reconstruction of the candidate from the pinned baseline is checked against SHA-256 hashes for every changed file before publication.

The six remaining Python failures already occur on the baseline: three builder guards (`check-parity.js`, `check-paragraph-props.js`, `check-pictures.js`), the generic-controller choreography assertion, the reviewer effort assertion and the year-neutral voice/name assertion. The two Node failures also predate this change: photograph-fit documentation and original-Slide-Designer repair documentation. They were not weakened or repaired under an unrelated optimisation task.

These checks establish source preservation, executable extraction and contract reachability, not the quality of model decisions. **No matched live lessons, rendered lesson comparison, cache-hit measurement, token-cost measurement or whole-run timing comparison was performed.** The source changes are not a plugin release or installation, and `main` is not changed by this work-branch update.
