"""The routes release: every saved design's review card and review view, written
by the review packet program of a given plugin copy, so the clean 4.2.293 copy
and this branch can be compared file by file (the change plan's section 0: for
the releases that change the packet, every saved design's card and view before
and after, every changed count line and card line explained).

    python -X utf8 rt_cards.py before   (the clean copy in scratch/rt/p293)
    python -X utf8 rt_cards.py after    (this branch)
    python -X utf8 rt_cards.py compare

The saved designs are read, never written. The card and view are built with the
packet's own functions, as the reviewer release's `rv_cards.py` does, without
running the validator first. Output goes to `scratch/rt/cards-<label>/`."""
import difflib
import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
SCRATCH = REPO / "plans" / "streamline-tools" / "scratch" / "rt"
ROOTS_BY_LABEL = {"before": SCRATCH / "p293" / "plugins" / "lesson-v4", "after": REPO / "plugins" / "lesson-v4"}
SAVED = Path(r"C:\Users\Daniel\Projects\lessonv4")
ROOTS = ["working", "lesson-resources-output/working", "output/working"]


def build(label):
    root = ROOTS_BY_LABEL[label]
    out = SCRATCH / f"cards-{label}"
    print(f"reading the packet program in {root}")
    print(f"writing cards and views into {out}")
    out.mkdir(parents=True, exist_ok=True)
    spec = importlib.util.spec_from_file_location(f"rt_packet_{label}", root / "scripts" / "design-review-packet.py")
    packet = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(packet)
    summary = {}
    for saved_root in ROOTS:
        for design_path in sorted((SAVED / saved_root).rglob("lesson-design.json")):
            rel = str(design_path.relative_to(SAVED))
            name = rel.replace("\\", "/").replace("/lesson-design.json", "").replace("/", "__")
            folder = out / name
            folder.mkdir(parents=True, exist_ok=True)
            record = {}
            try:
                design = json.loads(design_path.read_text(encoding="utf-8"))
                photos_path = design_path.with_name("photo-requirements.json")
                photos = json.loads(photos_path.read_text(encoding="utf-8")) if photos_path.exists() else {"photos": []}
            except Exception as error:
                summary[rel] = {"load": f"{type(error).__name__}: {error}"}
                continue
            try:
                lesson = design["lesson"]
                refs = packet.review_reference_paths(root, lesson)
                card, _sources = packet.build_review_reference(
                    root / "references" / "preferences.md", root / "references" / "do-beats.md",
                    refs["teachingSequence"], refs.get("subject"), lesson, design["worksheet"], 3, 16,
                    plugin_root=root, teacher_voice_path=root / "references" / "teacher-voice.md",
                    route_checks_path=root / "references" / "design-review-route-checks.md")
                (folder / "card.md").write_text(card.replace(str(root), "<ROOT>"), encoding="utf-8")
                record["card"] = "written"
            except Exception as error:
                record["card"] = f"{type(error).__name__}: {error}"
            try:
                (folder / "view.md").write_text(packet.build_review_view(design, photos), encoding="utf-8")
                record["view"] = "written"
            except Exception as error:
                record["view"] = f"{type(error).__name__}: {error}"
            summary[rel] = record
    (out / "summary.json").write_text(json.dumps(summary, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"{len(summary)} saved designs; {sum(r.get('card') == 'written' for r in summary.values())} cards and "
          f"{sum(r.get('view') == 'written' for r in summary.values())} views written")


def compare():
    before, after = SCRATCH / "cards-before", SCRATCH / "cards-after"
    lines = []
    for folder in sorted(p for p in before.iterdir() if p.is_dir()):
        for name in ("card.md", "view.md"):
            a, b = folder / name, after / folder.name / name
            if not a.exists() or not b.exists():
                if a.exists() != b.exists():
                    lines.append(f"{folder.name}/{name}: present on one side only")
                continue
            old, new = a.read_text(encoding="utf-8").splitlines(), b.read_text(encoding="utf-8").splitlines()
            if old == new:
                continue
            diff = [d for d in difflib.unified_diff(old, new, lineterm="", n=0) if d[:1] in "+-" and d[:3] not in ("---", "+++")]
            lines.append(f"## {folder.name}/{name}")
            lines += [d[:400] for d in diff]
    report = SCRATCH / "cards-compare.txt"
    print(f"writing {report}")
    report.write_text("\n".join(lines) + "\n", encoding="utf-8")
    changed = [line for line in lines if line.startswith("## ")]
    print(f"{len(changed)} files differ")
    for line in changed:
        print(line)


if sys.argv[1] == "compare":
    compare()
else:
    build(sys.argv[1])
