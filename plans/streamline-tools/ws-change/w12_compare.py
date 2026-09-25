"""The worksheets release (4.2.290): compare the saved designs and the saved
sheets before and after, and name every signal that appeared or went.

    python -X utf8 plans/streamline-tools/ws-change/w12_compare.py

Reads `ws-before-designs.json` / `ws-after-designs.json` (validate-saved-designs)
and `ws-before-sheets.json` / `ws-after-sheets.json` (w0_sheet_census.py, the
first run on a clean 4.2.289 copy, the second on the working tree)."""
import json
import re
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]


def load(name):
    return json.loads((HERE / name).read_text(encoding="utf-8"))


designs_before, designs_after = load("ws-before-designs.json"), load("ws-after-designs.json")
moved = [k for k in designs_before if designs_before[k] != designs_after.get(k)]
print(f"saved designs: {sum(v['ok'] for v in designs_after.values())} of {len(designs_after)} pass "
      f"(before: {sum(v['ok'] for v in designs_before.values())}); results changed for {len(moved)}")
for key in moved:
    print("  changed:", key)

# Tidy volatile parts: temp folders and millimetre measurements in room reports.
VOLATILE = re.compile(r"(\\|/)(Temp|tmp)(\\|/)[^\s\"']+|ws-census-build-\w+")


def tidy(signals):
    return [VOLATILE.sub("<tmp>", s) for s in signals]


sheets_before, sheets_after = load("ws-before-sheets.json"), load("ws-after-sheets.json")
assert set(sheets_before) == set(sheets_after)
totals = Counter()
for key in sorted(sheets_before):
    b, a = sheets_before[key], sheets_after[key]
    lines = []
    for stage in ("preflight", "build"):
        if b[stage]["exit"] != a[stage]["exit"]:
            lines.append(f"{stage} exit {b[stage]['exit']} -> {a[stage]['exit']}")
        gone = Counter(tidy(b[stage]["signals"])) - Counter(tidy(a[stage]["signals"]))
        came = Counter(tidy(a[stage]["signals"])) - Counter(tidy(b[stage]["signals"]))
        for s in gone:
            lines.append(f"{stage} lost: {s[:170]}")
            totals[f"{stage} lost"] += 1
        for s in came:
            lines.append(f"{stage} gained: {s[:170]}")
            totals[f"{stage} gained"] += 1
    rb, ra = b["recordingPass"], a["recordingPass"]
    for part in ("build", "gate"):
        if rb.get(part) != ra.get(part):
            lines.append(f"recording pass ({part}): {rb.get(part)} -> {ra.get(part)}")
            totals[f"recording {part} changed"] += 1
    if ra.get("everyAdvisory"):
        lines.append(f"recording advisories now: {ra['everyAdvisory']}")
        totals["sheets with a books prompt"] += 1
    if lines:
        print(key)
        for line in lines:
            print("  ", line)
print("totals:", dict(totals) or "no signal changed")
