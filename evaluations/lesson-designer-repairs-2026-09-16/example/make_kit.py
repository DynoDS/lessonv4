"""Copy the card kit from the example's lesson design, the way the stick-in
designer is told to: the unit's groups as headings, its items as cards (with
their detail), its pupilInstruction, its structured answer, its acceptance
condition and its handling. Nothing is added or reworded."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
design = json.loads((HERE / "lesson-design.json").read_text(encoding="utf-8"))
unit = next(u for u in design["teachingSequence"] if (u.get("taskStructure") or {}).get("handling"))
task, answer = unit["taskStructure"], unit["answer"]
kit = {
    "meta": {"lesson": "Why did Tudor children work", "yearGroup": "Year 4", "subject": "History"},
    "classSize": 30,
    "items": [{
        "visual": "card-set",
        "tag": "Tom's deal",
        "label": unit["label"],
        "spec": {
            "sourceUnitId": unit["sourceUnitId"],
            "instruction": unit["pupilInstruction"],
            "headings": [{"id": g["id"], "label": g["label"]} for g in task["groups"]],
            "cards": [
                {"id": i["id"], "label": i["label"], **({"detail": i["detail"]} if i.get("detail") else {})}
                for i in task["items"]
            ],
            "sets": {"per": task["handling"]["per"], "groupCount": task["handling"]["groupCount"]},
            "teacher": {
                "where": task["handling"]["where"],
                "answer": [{"cardId": p["itemRef"], "headingId": p["groupRef"]} for p in answer["structure"]["placements"]],
                "alsoAccept": answer["acceptanceCondition"],
            },
        },
    }],
}
(HERE / "stick-in-sheets.json").write_text(json.dumps(kit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("wrote stick-in-sheets.json")
