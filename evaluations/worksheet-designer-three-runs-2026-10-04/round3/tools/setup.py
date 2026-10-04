"""Round 3: a fresh adaptation, then a fresh worksheet design, one go per lesson."""
import json, shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools"))
import setup_runs as base

ROUND = Path(__file__).resolve().parent.parent
PY = "C:/Users/Daniel/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe"
PLUGIN = base.posix(base.PLUGIN_ROOT)
HEAD = """PLUGIN_ROOT: {plugin}
PYTHON: {py}
WORKING_DIR: {w}
OUTPUT_DIR: {w}/output
"""
ADAPT = """You are the adaptation designer. Read your agent instructions with:
"{py}" "{plugin}/scripts/read-reference.py" --role adaptation-designer --page 1
and each page it names.

""" + HEAD + """
AUTHORITATIVE_INPUTS:
LESSON_DESIGN: {w}/lesson-design.json
PHOTO_REQUIREMENTS_PATH: {w}/phase2-initial-photo-requirements.json
TEACHER_BRIEF_FILE: {w}/teacher-brief.txt

OWNED_OUTPUTS:
- {w}/adaptation.md

TERMINAL_STATE: COMPLETE
"""
SHEET = """You are the worksheet designer. Read your agent instructions with:
"{py}" "{plugin}/scripts/read-reference.py" --role worksheet-designer --page 1
and each page it names.

""" + HEAD + """
AUTHORITATIVE_INPUTS:
LESSON_DESIGN: {w}/lesson-design.json
HELPER_CHECK: {w}/helper-check.json
PHOTO_REQUIREMENTS_PATH: {w}/__CONTRACT__
PICTURE_STAGE: {stage}
ADAPTATION_DESIGN: {w}/adaptation.md

OWNED_OUTPUTS:
- {w}/worksheet.json

SUCCESS_CHECK:
Run the worksheet specification validator and the helper-delivery check
named by your role. Require WORKSHEET_PREFLIGHT_OK and HELPER_DELIVERY_OK.
TERMINAL_STATE: COMPLETE
"""
for lesson in base.LESSONS:
    src = lesson["source"]; key = lesson["key"]
    w = ROUND / "runs" / key
    if w.exists(): shutil.rmtree(w)
    w.mkdir(parents=True)
    for name in ("lesson-design.json", "helper-check.json", "phase2-initial-photo-requirements.json", "teacher-brief.txt"):
        if (src / name).exists(): shutil.copy2(src / name, w / name)
    if (src / "unsplash").is_dir(): shutil.copytree(src / "unsplash", w / "unsplash")
    (w / "output").mkdir()
    count = len(json.loads((w / "phase2-initial-photo-requirements.json").read_text(encoding="utf-8")).get("photos", []))
    stage = f"attempting {count} pictures" if count else "none required"
    fill = dict(py=PY, plugin=PLUGIN, w=base.posix(w), stage=stage)
    (ROUND / "launch" / f"{key}-adaptation.txt").write_text(ADAPT.format(**fill), encoding="utf-8")
    (ROUND / "launch" / f"{key}-worksheet.txt").write_text(SHEET.format(**fill), encoding="utf-8")
    print(key, stage, sorted(p.name for p in w.iterdir()))
