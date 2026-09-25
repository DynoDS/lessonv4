"""The worksheets release (4.2.290), step 0: every saved worksheet.json through
the sheet engine's own checks, signals only, so the engine changes of this
release can be compared sheet by sheet before and after.

    python -X utf8 w0_sheet_census.py <plugin root> <out.json>

For each saved `worksheet.json` in the repository (scratch copies and
node_modules left out) it records three things:

- the preflight (`check-worksheet.js`), run as the worksheet designer runs it:
  with `--adaptation` when the working folder has `adaptation.md`, and
  `--photo-requirements` when it has `photo-requirements.json`. Exit code and
  every signal line (stdout `SIGNAL:` lines and stderr `[tag]` advisories).
- the build (`build-worksheet.js`) into a throwaway folder: exit code and every
  signal line it printed, the `RECORDING` lines among them.
- the build's recording pass on its own (`src/slips.js`), because most saved
  sheets stop the build before it reaches that pass: the signals
  `recordingProblems` returns, with and without the designer's `required`
  gate, and, when the engine has it, what `recordingAdvisories` returns.

The engine is the one under <plugin root>, so a clean 4.2.289 copy and the
working tree can be run the same way; node_modules are taken from the live
checkout when the copy has none.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
LIVE_MODULES = REPO / "plugins" / "lesson-v4" / "worksheet-html" / "node_modules"
SIGNAL = re.compile(r"^([A-Z][A-Z0-9_]{3,}):")
TAGGED = re.compile(r"^\[([a-z-]+)\]\s*(?:([A-Z][A-Z0-9_]{3,}):)?")

RECORDING_PASS = r"""
const slips = require(process.argv[2]);
const worksheet = JSON.parse(require("fs").readFileSync(process.argv[3], "utf8"));
const out = {
  build: slips.recordingProblems(worksheet).map((p) => `${p.sheet}:${p.signal}`),
  gate: slips.recordingProblems(worksheet, { required: true }).map((p) => `${p.sheet}:${p.signal}`),
};
if (typeof slips.recordingAdvisories === "function") {
  out.advisories = slips.recordingAdvisories(worksheet).map((p) => `${p.sheet}:${p.signal}:${p.phrases.join("|")}`);
  out.everyAdvisory = slips.recordingAdvisories(worksheet, { includeAnswered: true }).map((p) => `${p.sheet}:${p.signal}:${p.answered ? "answered" : "unanswered"}:${p.phrases.join("|")}`);
}
console.log(JSON.stringify(out));
"""


def saved_specs() -> list[Path]:
    found = []
    for path in REPO.rglob("worksheet.json"):
        parts = set(path.parts)
        if "node_modules" in parts or "scratch" in parts or ".git" in parts:
            continue
        if "plugins" in parts:
            continue
        found.append(path)
    return sorted(found)


def signals(stdout: str, stderr: str) -> list[str]:
    out = []
    for line in stdout.splitlines():
        m = SIGNAL.match(line.strip())
        if m and m.group(1) not in {"BUILD_DIAGNOSTIC"}:
            out.append(line.strip()[:220])
    for line in stderr.splitlines():
        m = TAGGED.match(line.strip())
        if m:
            out.append(line.strip()[:220])
    return out


def run(args: list[str], env: dict) -> tuple[int, str, str]:
    proc = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace", env=env, timeout=300)
    return proc.returncode, proc.stdout, proc.stderr


def main() -> None:
    plugin, out_path = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    engine = plugin / "worksheet-html"
    env = dict(os.environ)
    if not (engine / "node_modules").exists():
        env["NODE_PATH"] = str(LIVE_MODULES)
    helper = Path(tempfile.mkdtemp(prefix="ws-census-")) / "recording-pass.js"
    helper.write_text(RECORDING_PASS, encoding="utf-8")
    results = {}
    for spec in saved_specs():
        folder = spec.parent
        rel = str(spec.relative_to(REPO))
        args = ["node", str(engine / "scripts" / "check-worksheet.js"), str(spec)]
        if (folder / "adaptation.md").exists():
            args += ["--adaptation", str(folder / "adaptation.md")]
        if (folder / "photo-requirements.json").exists():
            args += ["--photo-requirements", str(folder / "photo-requirements.json")]
        code, stdout, stderr = run(args, env)
        record = {"preflight": {"exit": code, "signals": signals(stdout, stderr)}}

        build_out = Path(tempfile.mkdtemp(prefix="ws-census-build-"))
        code, stdout, stderr = run(["node", str(engine / "scripts" / "build-worksheet.js"), str(spec), str(build_out)], env)
        record["build"] = {"exit": code, "signals": signals(stdout, stderr),
                           "recording": [line.strip() for line in stdout.splitlines() if line.startswith("RECORDING")]}
        shutil.rmtree(build_out, ignore_errors=True)

        code, stdout, stderr = run(["node", str(helper), str(engine / "src" / "slips.js"), str(spec)], env)
        try:
            record["recordingPass"] = json.loads(stdout.strip().splitlines()[-1])
        except (ValueError, IndexError):
            record["recordingPass"] = {"error": (stdout + stderr)[-400:]}
        results[rel] = record
        print(f"{rel}: preflight {record['preflight']['exit']}, build {record['build']['exit']}", flush=True)
    out_path.write_text(json.dumps(results, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"CENSUS_OK {len(results)} sheets")


if __name__ == "__main__":
    main()
