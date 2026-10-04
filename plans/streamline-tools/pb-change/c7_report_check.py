"""The playbook release (10A), step 7: the run report check (change plan section
2, settled item f; settled item a: X14, X15).

Settled item f (his "yes"): a sheet left out of a short pack is flagged and the
lesson is recorded as partial, as a flagged deck is. The check now reads the
worksheet build's own summary: when `omittedSheets` names a sheet, the report
must name it under `## Outcome` (copying its `SHEET_OMITTED:` line), must list
the pack as delivered, and may not close `COMPLETE`. The same shape as the
flagged-deck block beside it.

X14: `QUEUED` leaves the shared log's statuses and its branch goes: nothing
prints it (`record-build-review.py` prints only `BUILD_REVIEW_LOG_OK` or
`_FAILED`), and the playbook says there is no pending-log branch. X15: the
retired final review's word leaves the message."""
from _patch import VRR, replace_once

replace_once(VRR, '''SHARED_LOG_STATUS_RE = re.compile(r"^Status: (UPDATED|QUEUED|NOT REQUIRED)$")''',
             '''SHARED_LOG_STATUS_RE = re.compile(r"^Status: (UPDATED|NOT REQUIRED)$")''')

replace_once(VRR, '''    # Every retained picture failure and friction record must be reported.
    obligations = report_obligations(working, failures)''', '''    # ── A pack short a sheet is delivered, and its sheet is named ─────────
    # The deck's rule, extended to the sheets (settled item f of the playbook
    # list, 24 September 2026): one sheet the page cannot hold never withholds
    # a pack, so the pack is delivered without it, the report names the sheet
    # the class is not getting, and the package is not finished. The worksheet
    # build's own summary names each such sheet; nothing else says it.
    sheet_build = read_json(working / "build-results" / "worksheets.json", "worksheets build summary", [])
    omitted_sheets = []
    if isinstance(sheet_build, dict) and isinstance(sheet_build.get("omittedSheets"), list):
        omitted_sheets = [
            str(entry.get("sheet")).strip() for entry in sheet_build["omittedSheets"]
            if isinstance(entry, dict) and str(entry.get("sheet") or "").strip()
        ]
    if omitted_sheets:
        copied = [
            line for line in sections.get("## Outcome", "").splitlines()
            if "SHEET_OMITTED:" in line
        ]
        unnamed = [sheet for sheet in omitted_sheets if not any(sheet in line for line in copied)]
        if unnamed:
            failures.append(
                "outcome: the pack was delivered without the "
                + ", ".join(unnamed)
                + " sheet(s); copy each `SHEET_OMITTED:` line under Outcome so the "
                "teacher knows which children have no sheet."
            )
        if "worksheets" in excluded_names or "worksheets" not in delivered_names:
            failures.append(
                "worksheets: the build delivered the pack without the sheet(s) it could "
                "not fit; list it under Delivered resources, not as withheld."
            )
        if package_status == "COMPLETE":
            failures.append(
                "COMPLETE: the pack was delivered without the "
                + ", ".join(omitted_sheets)
                + " sheet(s); a package short a sheet is PARTIAL, not COMPLETE."
            )

    # Every retained picture failure and friction record must be reported.
    obligations = report_obligations(working, failures)''')

replace_once(VRR, '''    # ── Shared investigation log: QUEUED/UPDATED lines carry their path ──''',
             '''    # ── Shared investigation log: an UPDATED line carries its path ──────''')

replace_once(VRR, '''                "shared investigation log: a status of UPDATED, QUEUED or NOT REQUIRED "
                "is required."''', '''                "shared investigation log: a status of UPDATED or NOT REQUIRED "
                "is required."''')

replace_once(VRR, '''    if shared_status in ("UPDATED", "QUEUED"):
        if not shared_status_lines:''', '''    if shared_status == "UPDATED":
        if not shared_status_lines:''')

replace_once(VRR, '''        if not path_lines:
            failures.append(
                f"shared investigation log: `{shared_status}` requires a `Path:` line naming "
                "the log that was (or would have been) written."
            )
        elif shared_status == "QUEUED":
            queued_token = path_lines[0][len("Path:"):].strip().strip("`").strip()
            if Path(queued_token).name != "pending-build-review-log.md":
                failures.append(
                    "shared investigation log: a QUEUED entry's only path is "
                    "[WORKING_DIR]/pending-build-review-log.md."
                )
            elif not path_exists(queued_token, working, output):
                failures.append(
                    f"shared investigation log: queued path does not exist: {queued_token}"
                )
''', '''        if not path_lines:
            failures.append(
                f"shared investigation log: `{shared_status}` requires a `Path:` line naming "
                "the log that was written."
            )
''')

replace_once(VRR, '''                "COMPLETE: the report carries PAGE_FIT_UNVERIFIED; an unverified review "
                "cannot close as COMPLETE."''', '''                "COMPLETE: the report carries PAGE_FIT_UNVERIFIED; unverified page fit "
                "cannot close as COMPLETE."''')
print("REPORT_CHECK_OK")
