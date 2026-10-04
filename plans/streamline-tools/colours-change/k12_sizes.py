"""The colours release: bytes before (4.2.289, `2db3ceba`) and after, as git stores
the files (line endings normalised to LF), by group. Prints a table."""
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
P = "plugins/lesson-v4/"

GROUPS = {
    "Instruction files": [
        "references/teacher-slide-visual-profile.md", "references/preferences.md",
        "references/slide-composition-playbook.md", "references/templates.md",
        "references/worksheet-helpers/maths.md", "references/working-wall-visual-language.md",
        "references/working-wall-preferences.md", "references/working-wall-card-contracts.md",
        "references/output-template.md", "agents/slide-designer.md",
        "references/slide-speech-and-characters.md",
    ],
    "Programs": [
        "builder/scripts/check-slide-design.js", "builder/src/answer-text.js",
        "shared/visuals/place-value-chart-svg.js",
        "builder/src/presentation-text.js", "builder/src/styles.js", "builder/src/content/callout.js",
        "builder/src/content/chip-bank.js", "builder/src/content/method-frame.js",
        "worksheet-html/src/helpers/methods.js", "worksheet-html/src/tokens.js",
        "working-wall-html/style.json", "working-wall-html/src/shared.js",
        "working-wall-html/src/render-panels.js", "working-wall-html/src/render-grids.js",
        "working-wall-html/src/render-section.js", "working-wall-html/src/render-overview.js",
        "working-wall-html/src/render-display.js", "builder/src/teach-layouts.js",
        "builder/src/content/steps.js", "builder/src/validate.js", "worksheet-html/src/helpers/frames.js",
        "builder/build.js", "builder/src/figure-marks.js", "shared/text/criteria-marks.js",
        "worksheet-html/src/helpers/index.js", "working-wall-html/src/svg-renderer.js",
        "working-wall-html/src/visuals.js", "stick-in-sheets-html/src/render-piece-html.js",
    ],
    "Tests and pins": [
        "builder/test/doc-claims.test.js", "builder/test/slide-design-check.test.js",
        "builder/test/colours-follow-the-board.test.js", "worksheet-html/test/worked-example-purple.test.js",
        "working-wall-html/test/colours-follow-the-board.test.js", "scripts/tests/test_colours_are_kept.py",
        "scripts/tests/colours_ledger_pins.json", "scripts/tests/success_criteria_ledger_pins.json",
        "worksheet-html/test/figure-words-plain.test.js", "stick-in-sheets-html/test/figure-words-plain.test.js",
    ],
    "The build log": ["references/build-review-log.md"],
}


def before(rel):
    run = subprocess.run(["git", "show", f"2db3ceba:{P}{rel}"], cwd=REPO, capture_output=True)
    return len(run.stdout.replace(b"\r\n", b"\n")) if run.returncode == 0 else 0


def after(rel):
    path = REPO / P / rel
    return len(path.read_bytes().replace(b"\r\n", b"\n")) if path.exists() else 0


print("| Group | 4.2.289 | After | Change |")
print("|---|---|---|---|")
for group, files in GROUPS.items():
    b = sum(before(f) for f in files)
    a = sum(after(f) for f in files)
    print(f"| {group} ({len(files)}) | {b:,} | {a:,} | {a - b:+,} |")
print()
for rel in GROUPS["Instruction files"]:
    print(f"- {rel}: {before(rel):,} -> {after(rel):,} ({after(rel) - before(rel):+,})")
