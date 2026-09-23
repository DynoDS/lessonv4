# Overnight run, 22 to 23 September 2026: three topic inventories

Started from the vocabulary session at Daniel's "yes". Nothing in the plugin is
changed by this run, and nothing is committed or pushed.

## The steps, per topic

| Topic | Ledger | Built by | Independent check report | State |
|---|---|---|---|---|
| What children are assumed to already know (`AK-`) | `plans/2026-09-22-assumed-knowledge-ledger.md` | agent `inv-ak` | `plans/streamline-tools/assumed-knowledge-inventory-check.md` | done: 283 rows after the check, 11 decisions |
| The Teach then Do rhythm (`TD-`) | `plans/2026-09-22-teach-then-do-ledger.md` | agent `inv-td` | `plans/streamline-tools/teach-then-do-inventory-check.md` | done: 309 rows after the check, 12 decisions |
| Quick checks (`QC-`) | `plans/2026-09-22-quick-checks-ledger.md` | agent `inv-qc` | `plans/streamline-tools/quick-checks-inventory-check.md` | done: 307 rows after the check, 10 decisions |

For each topic, in order:

1. The builder follows `plans/streamline-tools/inventory-agent-brief.md` and
   saves the ledger as it goes.
2. When the builder finishes, a fresh agent follows
   `plans/streamline-tools/inventory-check-brief.md` for that ledger.
3. The builder (resumed by name, or a fresh agent if that fails) verifies
   every finding in the check report against the files, adds the verified
   ones, reruns `check-ledger-quotes.py` until `LEDGER_QUOTES_OK`, and
   updates its "Decisions for Daniel".
4. When all three are done: update the topic table in
   `plans/streamline-plan.md` (lists built and checked, decisions waiting), and
   give Daniel one message: per topic, a short plain summary and every
   decision numbered, in his CLAUDE.md style.

## If the run was stopped

A usage limit stops running agents; files already saved remain. To resume, in
a chat: read this file, check which ledgers and check reports exist and how
far each ledger got (its last saved group), resume the named agent with a
message to carry on from where its file ends (or start a fresh one on the same
brief with that instruction), and continue the steps above.

## Finished

All three lists built, independently checked and corrected by about 23:00 on 22 September, without hitting a usage limit. The plan's topic table is updated. Next: Daniel answers the 33 decisions; then the changes, one topic at a time.
