"""Make three clean working folders per lesson and the launch message for each.

Each folder holds only what the worksheet designer was really given: the
lesson design, the helper check, the adaptation, the photograph contracts and
the pictures the lesson's own run ended up with. No earlier worksheet.json.
"""
import json
import shutil
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
EVAL = REPO / "evaluations" / "worksheet-designer-three-runs-2026-10-04" / "round2"
PLUGIN_ROOT = REPO / "plugins" / "lesson-v4"
# The Python a Codex worker can start: find-python.js, run inside the Codex sandbox.
PYTHON = "C:/Users/Daniel/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe"

LESSONS = [
    {
        "key": "subtract",
        "label": "Year 4 Maths: subtract two 2-digit numbers",
        "source": REPO / "lesson-output" / "working" / "year-4-maths-lesson-21-subtract-two-2-digit-numbers",
    },
    {
        "key": "renga",
        "label": "Year 6 Writing: know what a renga is",
        "source": REPO / "working" / "year-6-writing-lesson-1-know-what-a-renga-is",
    },
    {
        "key": "divisibility",
        "label": "Year 6 Maths: rules of divisibility",
        "source": REPO / "working" / "year-6-maths-rules-of-divisibility",
    },
    {
        "key": "leisure",
        "label": "Year 4 History: how children's leisure time changed",
        "source": REPO / "working" / "year-4-history-lesson-5-how-children-s-leisure-time-changed (1)",
    },
    {
        "key": "choices",
        "label": "Year 4 PSHE: make sensible choices in different situations",
        "source": REPO / "working" / "year-4-pshe-to-make-sensible-choices-in-different-situations (1)",
    },
]

INPUT_FILES = [
    "lesson-design.json",
    "helper-check.json",
    "adaptation.md",
    "adaptation-photo-provisional.json",
    "phase2-initial-photo-requirements.json",
]

MESSAGE = """You are the worksheet designer. Read your agent instructions with:
"{python}" "{plugin}/scripts/read-reference.py" --role worksheet-designer --page 1
and each page it names.

PLUGIN_ROOT: {plugin}
PYTHON: {python}
WORKING_DIR: {working}
OUTPUT_DIR: {output}

AUTHORITATIVE_INPUTS:
LESSON_DESIGN: {working}/lesson-design.json
HELPER_CHECK: {working}/helper-check.json
PHOTO_REQUIREMENTS_PATH: {working}/adaptation-photo-provisional.json
PICTURE_STAGE: {stage}
ADAPTATION_DESIGN: {working}/adaptation.md

OWNED_OUTPUTS:
- {working}/worksheet.json

SUCCESS_CHECK:
Run the worksheet specification validator and the helper-delivery check
named by your role. Require WORKSHEET_PREFLIGHT_OK and HELPER_DELIVERY_OK.
TERMINAL_STATE: COMPLETE
"""


def posix(path: Path) -> str:
    return str(path).replace("\\", "/")


def main() -> None:
    record = []
    for lesson in LESSONS:
        src = lesson["source"]
        initial = json.loads((src / "phase2-initial-photo-requirements.json").read_text(encoding="utf-8"))
        count = len(initial.get("photos", []))
        stage = f"attempting {count} pictures" if count else "none required"
        for run in ("a", "b", "c"):
            working = EVAL / "runs" / f"{lesson['key']}-{run}"
            if working.exists():
                raise SystemExit(f"already exists: {working}")
            working.mkdir(parents=True)
            for name in INPUT_FILES:
                shutil.copy2(src / name, working / name)
            if (src / "unsplash").is_dir():
                shutil.copytree(src / "unsplash", working / "unsplash")
            (working / "output").mkdir()
            message = MESSAGE.format(
                python=posix(Path(PYTHON)),
                plugin=posix(PLUGIN_ROOT),
                working=posix(working),
                output=posix(working / "output"),
                stage=stage,
            )
            launch = EVAL / "launch" / f"{lesson['key']}-{run}.txt"
            launch.parent.mkdir(parents=True, exist_ok=True)
            launch.write_text(message, encoding="utf-8")
        record.append({
            "key": lesson["key"],
            "label": lesson["label"],
            "source": str(src),
            "pictureStage": stage,
            "pictures": len(list((src / "unsplash").iterdir())) if (src / "unsplash").is_dir() else 0,
        })
        print(lesson["key"], stage)
    (EVAL / "lessons.json").write_text(json.dumps(record, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
