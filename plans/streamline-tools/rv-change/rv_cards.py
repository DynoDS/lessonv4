"""The design reviewer release: every saved design's review card and review view,
written by the review packet program of the copy this script sits in, so a run
before the change and a run after it can be compared file by file.

    python -X utf8 rv_cards.py <label>

The saved designs are read (never written) from the main checkout's three roots,
the same ones `validate-saved-designs.py` reads. The card and view are built with
the packet's own functions, as `prepare` builds them, without running the
validator first (a saved design the validator now refuses still gets its card,
so every card line can be compared). The photograph count and ceiling are fixed
numbers, the same before and after. Run both with the same Python: the card's
reading commands print the interpreter's own path. Output goes to
`plans/streamline-tools/scratch/rv/cards-<label>/`, one folder per design, and a
summary file listing any design the program could not build a card or view for.
"""
import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
ROOT = REPO / "plugins" / "lesson-v4"
SAVED = Path(r"C:\Users\Daniel\Projects\lessonv4")
ROOTS = ["working", "lesson-resources-output/working", "output/working"]

label = sys.argv[1]
out = REPO / "plans" / "streamline-tools" / "scratch" / "rv" / f"cards-{label}"
print(f"reading the packet program in {ROOT}")
print(f"writing cards and views into {out}")
out.mkdir(parents=True, exist_ok=True)

spec = importlib.util.spec_from_file_location("design_review_packet_rv", ROOT / "scripts" / "design-review-packet.py")
packet = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packet)

summary = {}
for root in ROOTS:
    for design_path in sorted((SAVED / root).rglob("lesson-design.json")):
        rel = str(design_path.relative_to(SAVED))
        name = rel.replace("\\", "/").replace("/lesson-design.json", "").replace("/", "__")
        folder = out / name
        folder.mkdir(parents=True, exist_ok=True)
        record = {}
        try:
            design = json.loads(design_path.read_text(encoding="utf-8"))
            photos_path = design_path.with_name("photo-requirements.json")
            photos = json.loads(photos_path.read_text(encoding="utf-8")) if photos_path.exists() else {"photos": []}
        except Exception as error:  # a saved file that is not JSON
            summary[rel] = {"load": f"{type(error).__name__}: {error}"}
            continue
        try:
            lesson = design["lesson"]
            refs = packet.review_reference_paths(ROOT, lesson)
            card, _sources = packet.build_review_reference(
                ROOT / "references" / "preferences.md",
                ROOT / "references" / "do-beats.md",
                refs["teachingSequence"],
                refs.get("subject"),
                lesson,
                design["worksheet"],
                3,
                16,
                plugin_root=ROOT,
                teacher_voice_path=ROOT / "references" / "teacher-voice.md",
                route_checks_path=ROOT / "references" / "design-review-route-checks.md",
            )
            (folder / "card.md").write_text(card, encoding="utf-8")
            record["card"] = "written"
        except Exception as error:
            record["card"] = f"{type(error).__name__}: {error}"
        try:
            view = packet.build_review_view(design, photos)
            (folder / "view.md").write_text(view, encoding="utf-8")
            record["view"] = "written"
        except Exception as error:
            record["view"] = f"{type(error).__name__}: {error}"
        summary[rel] = record
(out / "summary.json").write_text(json.dumps(summary, indent=1, ensure_ascii=False), encoding="utf-8")
cards = sum(1 for r in summary.values() if r.get("card") == "written")
views = sum(1 for r in summary.values() if r.get("view") == "written")
print(f"{len(summary)} saved designs; {cards} cards and {views} views written")
