# Image Scout Recovery and Focused Repair

Read this reference only when prior owned work exists or `assignment.repair` is non-null.

## Relaunch recovery

Durable search summaries, candidates, generated outputs, and AI ledgers survive a worker relaunch.

For each filename:

- reuse a completed search summary after checking its path and schedule step;
- do not repeat a completed search because the prior worker lacked a final result;
- keep a surviving `generated_unreviewed` output for pending batch review with zero new calls;
- inspect and reuse an accepted unrejected generated output with zero new calls;
- permit one recovery call only for an interrupted attempt with one call left;
- permit one retry only after provider misdirection with one call left;
- report `attempt_budget_exhausted` when both calls are consumed;
- never delete, reset, shrink, or replace a ledger.

## Focused repair

The orchestrator removes the rejected canonical image before repair starts. Never restore it.

Read the exact review fault and inspect the rejected staged asset or prior selected candidate.

For a sourced real image:

1. Inspect unused candidates from prior immutable summaries.
2. Accept one only when it fixes the fault and meets the full contract.
3. Otherwise use at most one additional real search.
4. Continue to AI only when the original contract permits it. With `fallback_action: ai` an operational gap does not withdraw that permission: record the outage and generate.

For a generated image:

1. Record the review rejection against the accepted ledger attempt.
2. Set `correctable: yes` only for one precise repairable fault.
3. Use one correction call only when one remains.
4. Otherwise leave the image unsatisfied.

Repair one filename only. Do not reconsider, search, generate, publish, or remove a sibling.
