"""Point the shared `ledger_mapping` tool at a scratch copy of the plugin, for a
checker replaying the routes release on a clean 4.2.293 copy.

`ledger_mapping.py` reads and writes the plugin in the checkout it sits in, and
a checker's edit to point it elsewhere once failed silently and rewrote the real
pin file. So this release's pin scripts (`rt_07_repin_other_topics.py` and
`build_rt_mapping.py`) import this first: when `LESSONV4_PLUGIN_ROOT` names a
folder, the tool's plugin root, its file lists and its text cache follow it, and
`LESSONV4_MAPPING_OUT` (an absolute path) takes the mapping instead of
`plans/` (the builder passes it as an absolute path, which the tool writes to
as given). The ledgers are always read from this checkout's `plans/` folder.
The root and every path written are printed before anything is written."""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import ledger_mapping  # noqa: E402

root = os.environ.get("LESSONV4_PLUGIN_ROOT")
if root:
    ROOT = Path(root)
    ledger_mapping.ROOT = ROOT
    ledger_mapping.RUNTIME = [q for folder in ("agents", "references", "skills", "commands")
                              for q in (ROOT / folder).rglob("*.md") if q.name != "build-review-log.md"]
    ledger_mapping.PROGRAMS = sorted((ROOT / "scripts").glob("*.py")) + sorted(
        q for folder in ("builder", "worksheet-html", "working-wall-html", "stick-in-sheets-html", "shared")
        for q in (ROOT / folder).rglob("*.js")
        if "node_modules" not in q.parts and "test" not in q.parts and "out" not in q.parts)
    ledger_mapping._texts.clear()
print(f"pin scripts' plugin root: {ledger_mapping.ROOT}")
MAPPING_OUT = os.environ.get("LESSONV4_MAPPING_OUT")
