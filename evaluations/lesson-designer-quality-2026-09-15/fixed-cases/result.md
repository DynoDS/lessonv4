# Fixed judgement cases: result

Evidence level: **fresh outputs compared (Claude-run)**. Both reviews were produced by Claude Fable 5.1 subagents following the Design Reviewer guidance of the tree named, on the blinded case file, with the expected column withheld. Neither is a run of the configured production reviewer (gpt-6-astra, effort high), whose behaviour on these cases is untested.

## Verdicts against the predefined expectations

| Case | Expected | Candidate guidance | Baseline guidance |
|---|---|---|---|
| H1 | REVISE | REVISE | REVISE |
| H2 | PASS | PASS | PASS |
| S1 | REVISE | REVISE | REVISE |
| S2 | PASS | PASS | PASS |
| G1 | REVISE | REVISE | REVISE |
| G2 | PASS | PASS | PASS |
| M1 | PASS | PASS | PASS |
| M2 | REVISE | REVISE | REVISE |
| E1 | REVISE | REVISE | REVISE |
| E2 | PASS | PASS | PASS |
| R1 | REVISE | REVISE | REVISE |
| R2 | PASS | PASS | PASS |
| P1 | REVISE | REVISE | REVISE |
| P2 | PASS | PASS | PASS |

Fourteen of fourteen for both. Reasons were compared with the predefined reasons case by case (`review-candidate-guidance.md`, `review-baseline-guidance.md`): both name the bypass (pleasant/unpleasant wording in H1, the drawn bulb in S1, the printed labels in G1, the circled hundred in M2, the adjective count in E1, opinion in R1, the recalled scenario in P1), the learning left untested, and a repair of the right size; both keep the seven sound tasks, including the simple match (H2), the repeated practice (M1) and the reflection (R2). Both found the defensible second answers the batch planted (the baking card is absent from these cases by design; they found `one less mouth to feed` under Bad, 650 on the halfway point in M1, the showing sentence that fails the adjective count in E1, and the keep-the-message order in P2).

## What this does and does not show

- The candidate reviewer's judgement is **shown on fixed cases**, as the plan's acceptance for section 6 asks: it distinguishes the shallow main task from the valid simple check, detects the overly exclusive key, and does not reject purposeful repetition or enabling support.
- It does **not** show that the two probes improved the reviewer, because the baseline guidance run by the same model reached the same verdicts and the same second answers. Two reasons, both to be read together:
  1. **The assignment leaked the probe.** Both reviewers were asked to write, for every case, the response that bypasses the task, the learning left untested, the smallest repair, and a "second answer" line. That format is the probe, so the baseline reviewer was handed the candidate's method in the prompt. A fair discrimination run would give both a neutral instruction ("PASS or REVISE, with your reason") and compare what each finds unprompted. It was not run, because the plan caps the review-calibration work at one batched assignment on the fixed cases and one on the generated pairs, and both were spent; it is the first thing to run next.
  2. **The cases may sit under a capable model's ceiling.** Fourteen short, judgeable cases with the teaching, stimulus and response supplied are easier than a whole design read cold. The Tudor deck was approved by the production reviewer in a whole-design review, which is the setting the probes are written for.
- The candidate reviewer's second-answer findings are worth keeping as they stand: `one less mouth to feed at home` is arguably Bad for the boy and Good for the family under headings that say "about being an apprentice", which is exactly the muddy-groups fault the preferences already name; 650 sits on the halfway point and the M1 panel needs the rounds-up convention. Both are bounded corrections the candidate reviewer is now told to make, not redesigns.

## Not evaluated

- The production reviewer (gpt-6-astra, high) on these cases.
- A neutral-prompt discrimination run between baseline and candidate guidance.
- Any teacher reading of the verdicts.
