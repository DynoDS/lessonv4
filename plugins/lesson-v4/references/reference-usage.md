# Guidance usage receipts

`scripts/read-reference.py` records guidance it emits on Claude and Codex in
`~/.lesson-resources/reference-usage.sqlite3` (or under `LESSON_RESOURCES_HOME`).
`LESSON_REFERENCE_USAGE_DB` overrides that database path. Records stay outside
the plugin and survive updates. Separate computers/cloud environments have
separate records unless given the same persistent location; nothing is uploaded.

For every guidance read, use the reader and append
`--host [claude|codex] --reader-role [worker role] --lesson-id "[WORKING_DIR]"`.
This includes `--select`, `--file`, `--structure-menu` and every page, as well as
`--role` reads. Do not replace selective reads with whole-file reads for tracking.
Keep existing reading triggers unchanged. On Claude, role instructions supplied
by the host are not measured; `--companions-only` still records their reference
companions. Direct file tools and host-injected instructions bypass these receipts.

Each page records UTC time, host, available session ID, role, lesson identifier,
plugin version, section hashes and exact emitted character ranges. No source or
lesson text is stored. Whole-file and parent-section reads count their children;
the structure menu counts only the headings and Use-when paragraphs it emits.
Index lookups, refused reads, missing sections and unprinted pages do not count.
An unwritable database prints `REFERENCE_USAGE_UNAVAILABLE` and the lesson proceeds.

Inspect both hosts with:

```text
python scripts/reference_usage.py --file do-beats.md --depth 3
python scripts/reference_usage.py --since 2026-11-04 --json
```

The report compares receipts with the current section's text, so unchanged
sections retain coverage across plugin updates. `different-text` means that
heading was emitted before, but its present text has no recorded coverage.
Coverage accumulates across receipts and readers; it does not assert that one
agent received the whole section. A receipt means the process flushed that text
to its output, not that the host showed it uncut or the agent understood or
applied it. It does not record whether a conditional trigger occurred. Treat
unobserved sections as investigation candidates, never automatic deletions.
