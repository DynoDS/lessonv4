"""Success criteria (4.2.288): the assumed-knowledge pin AK-G07 follows the one
word change the second check's finding 5 made in its paragraph (Slide
Philosophy's criteria copy now points home: "(Success Criteria above)")."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from ledger_mapping import ROOT, norm, pin_of  # noqa: E402

REL = "references/preferences.md"
OLD = "Success criteria are short runnable actions. Questions keep"
NEW = "Success criteria are short runnable actions (Success Criteria above). Questions keep"
NOTE = ("then its paragraph re-pinned in 4.2.288, where the criteria sentence gained a "
        "pointer to the Success Criteria section (success-criteria decision 10)")

path = ROOT / "scripts" / "tests" / "assumed_knowledge_ledger_pins.json"
data = json.loads(path.read_text(encoding="utf-8"))
row = next(r for r in data["rows"] if r["id"] == "AK-G07")
hits = [p for p in row["present"] if p["file"] == REL and norm(OLD) in p["text"]]
assert len(hits) == 1, len(hits)
pin = hits[0]
replacement = pin_of(REL, pin["text"].replace(norm(OLD), norm(NEW)))
if pin.get("section"):
    replacement["section"] = pin["section"]
assert replacement["text"] in norm((ROOT / REL).read_text(encoding="utf-8"))
row["present"][row["present"].index(pin)] = replacement
if NOTE not in row["outcome"]:
    row["outcome"] += f"; {NOTE}"
path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
print("repinned AK-G07")
