# Consolidation and remaining guard failures — 10 September 2026

## Acceptance, evidence and scope

Continue on `work` from `be864e35fa359761aedd0a306a2ca16888722e81`. Reduce genuine repeated instruction without changing the lesson's required learning, Daniel's voice, curriculum boundaries, model settings or independent review. Diagnose the reported test failures rather than removing assertions merely to make a green suite. A smaller source file and passing deterministic tests do not establish unchanged live lesson quality or lower subscription usage.

The source was reconstructed from the earlier pinned archive plus a GitHub Actions overlay of this exact work revision. All 2,783 source blobs were checked against the repository's Git tree. Baseline tests were run before edits; candidate tests used separate worktrees so tests that temporarily alter fixtures or role files could not interfere with one another.

## Instruction changes and preservation

The Lesson Designer now has one inventory for settling and recording its decisions, rather than a planning inventory followed by a substantially overlapping recording inventory. Planning still happens before choosing activities; the compact quality lock still precedes the scaffold and final contract. The surviving inventory explicitly retains the unique obligations from both lists: before/after learning, fact/method/idea and varying evidence, the exact objective and performance, approved curriculum boundary and deferred content, prior knowledge and visible foundation, new knowledge/decision/procedure, the supported-to-independent path, the nearest alternative structure, the sticking point connecting foundation to new learning, concrete teaching encounters and choice of medium, visible explanations and task launches, uncued assessment, success criteria and fresh worksheet evidence, load-bearing representations/safety, forward dependencies, honest side-of-spine moments and deliberate omissions.

Marked teacher requirements, commission facts and plan authority have one fuller owner under Your Role as Decision-Maker. The startup checklist points there. A supplied plan still governs objective, curriculum coverage and sequence, not the choice of activities; inability to meet a binding requirement is still flagged. Representation registry and source-unit binding mechanics are stated together instead of repeated later. IDs, configuration-level load-bearing fields, interactions, modelling state and non-duplication remain explicit.

Only obsolete incident history is removed from the voice guide's reading introduction and two playbook lifecycle paragraphs. The fixed question/instruction trigger, all voice calibration examples, active worker-liveness and latest-artefact rules remain. The existing 71 KiB playbook growth threshold is not raised.

The quality-lock paragraph and the complete Lesson Designer completion/voice-check section are byte-identical to baseline. The independent Design Reviewer, preferences, conditional component guidance, pedagogical output template, lesson validator and worker-launch settings are unchanged. Two Slide Designer claims that nobody reviews the built output are corrected to match the final-resource review already active in the playbook. Early composition still does not wait for photographs; final review judges the delivered crop/usability and sends a wrong photograph to its existing owner.

## Diagnoses and repairs

| Failed check | Evidence and repair |
| --- | --- |
| Visual parity | `comparison-slot` was a real drawn symbol-entry ring missing from the manifest. Declare its board-only reach with the reason for each other-surface exclusion and classify it as unsuitable for a transferable success-criteria cue. Do not disguise it as plain text or exempt layout. |
| Missing-picture publication | A required image could render as a grey placeholder; the ZIP relationship verifier then saw no picture to reject. Record actual required-image omissions during rendering and include them in the existing final `SLIDE_PICTURE_MISSING` gate. The failed build preserves the previous deck and removes its temporary output. |
| Composition preview exception | Required pictures legitimately remain unsourced during the existing Slide Designer check. The checker passes an internal `--design-preview` flag, restricted to its direct temporary-directory namespace and a non-symlink directory. Only these private previews tolerate required placeholders. Ordinary builds do not. Decoration-free retries preserve the mode only when explicitly provided. This is a delivery-path distinction, not a security sandbox or authentication mechanism. |
| Paragraph-property guard | The guard looked only for top-level/global `jszip`; the installed `pptxgenjs` contained it as a nested dependency. Reuse the production `loadJSZip` resolver. No dependency or paragraph behaviour changes. |
| Numbering integration tests | The broader Node suite exposed the same direct `jszip` assumption in a template test. Reuse the existing resolvers so its six actual rendering assertions execute on both supported installation layouts. |
| Runtime growth guard | The playbook exceeded its existing 71 KiB threshold. Remove two historical retellings while retaining the worker-liveness and current-artefact requirements. Neither the threshold nor slice limits are weakened. |
| Reviewer settings assertion | The test still demanded `xhigh` although the configured, independently evaluated reviewer is Astra/high. Assert the existing model and effort together; the role is not downgraded. |
| Year-neutral voice assertion | A blanket ban on the words `Daniel` and `Year 4` rejected calibration examples. Assert the actual all-primary guidance, KS1/KS2 access treatment and absence of sentence-length targets. Existing audience and calibration checks remain. |
| Two stale Node documentation assertions | Assert early photograph-fit work plus the already-wired final review, and the real focused-repair boundary: creation-mode exhaustion versus later final-review findings. Do not remove the final review to satisfy an obsolete claim. |

Seven new picture tests exercise real builder/checker calls, not only string matching: default-required and explicit-required failures, preservation of the previous deck, optional omission, legitimate private preview followed by a blocked final build, refusal of preview mode in a delivery directory, retry-mode propagation, and omission-record reset/deduplication. Six planning tests preserve the consolidation's source contract with 29 obligation subtests. Existing teaching assertions also run unchanged where their wording remains applicable.

## Validation results

All final production-code and instruction changes were present for the final runs below; the evaluation report was added afterwards.

| Test surface | Pinned baseline | Final candidate |
| --- | --- | --- |
| Complete Python `scripts/tests` | 1,491 passed, 6 failed; 1,724 subtests passed | **1,503 passed, 0 failed; 1,753 subtests passed** across four isolated worktrees covering all 92 test files |
| Complete `builder/test/*.test.js` | 573 passed, 3 failed (including the module that could not load) | **588 passed, 0 failed** |
| Worksheet photo-costing control | 5 passed | **5 passed** |
| Plugin-root verification and `git diff --check` | — | **Passed** |

The final Python worktrees reported 239, 365, 515 and 384 passing tests respectively. This is the final complete sweep, not the earlier intermediate sweep with three wording mismatches. Those mismatches were resolved by retaining the established planning phrases and obligations, not by deleting the teaching assertions. The Node count increases partly because the previously unloadable numbering test now executes its six cases and partly because seven publication regressions were added.

An intermediate candidate's parity entry initially lacked its success-criteria classification, and an initial new test used the wrong checker export. Both were corrected before final validation. They are not presented as successful attempts. An attempted final rerun initially checked out the prior local snapshot because a local commit lacked identity settings; those processes were stopped and the final four runs explicitly verified the corrected source bytes before testing.

## Context effect and limits

| Runtime source | Before | After | Change in UTF-8 bytes |
| --- | ---: | ---: | ---: |
| Lesson Designer | 115,647 | 114,601 | -1,046 (0.90%) |
| Teacher voice guide | 29,544 | 29,079 | -465 |
| Orchestration playbook | 72,991 | 72,573 | -418 |
| Slide Designer | 55,964 | 55,952 | -12 |

This is a modest consolidation, not a large efficiency claim. These file differences are not an observed runtime context, cache-hit rate, output-token saving, latency reduction or weekly-usage reduction. The production picture gate adds a small amount of deterministic code; it prevents publication of a known defective output rather than changing pedagogical model effort. No extra agent, output contract, model-driven summary or review stage is added.

## Live comparison and release gate

No connected runner for the user's configured Codex agents was available in this session. Consequently, **no matched live lesson-design trial, independent model-quality comparison, rendered lesson comparison or token/usage benchmark was performed**. The render tests above are deterministic integration fixtures, not substitute lesson-quality evaluations.

The initial live screen remains four designer attempts: the same Year 4 Maths brief and the same Year 4 History brief on this pinned baseline and the candidate, with identical teacher input, model/effort, source availability and clean-worker settings. Set the cases and stopping rule before launching. Record every attempt and any ordinary repair, compare the actual learning chain, preparation, independent evidence, visual needs and Daniel-fit, and use host usage/timeline records where available. Do not resample until a preferred output appears; a small screen detects regressions but does not prove universal equivalence. Render a matched case only where its result leaves a material presentation question unresolved.

This finishes the bounded instruction/guard cleanup on `work`. It is not a release or an installation. Do not merge or publish on the strength of deterministic checks alone while the live quality condition remains unevaluated.
