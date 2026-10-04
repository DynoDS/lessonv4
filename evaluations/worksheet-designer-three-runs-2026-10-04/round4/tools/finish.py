"""Build round 3's five packs and make its page: one row per lesson, the levels side by side."""
import importlib.util, json, re
from pathlib import Path
ROUND = Path(__file__).resolve().parent.parent
TOP = ROUND.parent
spec = importlib.util.spec_from_file_location("fin", TOP / "tools" / "finish_lesson.py")
fin = importlib.util.module_from_spec(spec); spec.loader.exec_module(fin)
fin.EVAL = ROUND
NAMES = {"subtract": "Year 4 Maths: subtract two 2-digit numbers", "renga": "Year 6 Writing: know what a renga is",
         "divisibility": "Year 6 Maths: rules of divisibility", "leisure": "Year 4 History: how children's leisure time changed",
         "choices": "Year 4 PSHE: make sensible choices"}
GOES = json.loads((ROUND / "goes.json").read_text(encoding="utf-8"))
SIDES = [("a", "below", "Below"), ("b", "expected", "Expected"), ("c", "greaterDepth", "Greater Depth")]
files, data = {}, []
for key, label in NAMES.items():
    w = ROUND / "runs" / key
    design = json.loads((w / "lesson-design.json").read_text(encoding="utf-8"))
    topic = re.sub(r'[<>:"/\|?*]', "", (design.get("lesson") or {}).get("lo") or key)[:60].strip() or key
    built = fin.build(key, topic)
    if not (ROUND / "built" / key / f"{topic} - Worksheets.pdf").exists():
        built = fin.build(key, topic, last_resort=True)
    pages = fin.split_pages(key, topic, built)
    print(key, built.get("marker"), {k: len(v) for k, v in pages.get("levels", {}).items()}, "slips", pages.get("slips"), "stand-ins", pages.get("standIns"))
    row = {"id": "sheets"}
    for side, level, name in SIDES:
        got = pages.get("levels", {}).get(level, [])
        if not got:
            row[side] = None; continue
        rel = f"img/{key}/{got[0]}"
        files[rel] = str(ROUND / "page" / "img" / key / got[0]).replace("\\", "/")
        flag = "Question slips for books" if level in pages.get("slips", []) else ("This is the Expected sheet standing in" if level in pages.get("standIns", []) else "")
        row[side] = {"img": rel, "what": name, "flag": flag}
    rows = [row]
    if pages.get("answers"):
        rel = f"img/{key}/{pages['answers'][0]}"
        files[rel] = str(ROUND / "page" / "img" / key / pages["answers"][0]).replace("\\", "/")
        rows.append({"id": "answers", "a": {"img": rel, "what": "Answer sheet", "flag": ""}, "b": None, "c": None})
    g = GOES[key]
    notes = [f"The worksheet designer passed its own check on go {g['goes']}." if g["goes"] else "The worksheet designer never passed its own check.",
             f"Adaptation {g['adaptMin']} minutes, worksheets {g['sheetMin']} minutes."]
    notes += ["Its note to you: " + l[5:].strip() for l in built.get("stdout", "").splitlines() if l.startswith("Note:")][:4]
    data.append({"id": key, "tag": label.split(":")[0], "label": label, "ready": True, "lo": (design.get("lesson") or {}).get("lo", ""),
                 "runs": {"a": notes, "b": [], "c": []}, "bands": [{"label": "The three levels", "note": "", "rows": rows}]})
t = (TOP / "round2" / "tools" / "page_template.html").read_text(encoding="utf-8")
swaps = [
    (r"<title>.*?</title>", "<title>Worksheets Round 4</title>"),
    (r'<div class="intro">[\s\S]*?</div>\s*\n\s*<div class="tabs"',
     '<div class="intro"><h1>Fresh sheets, designed for the new page</h1>'
     "<p>One go per lesson. Each has a fresh adaptation and a fresh worksheet design, both made knowing the new page: 4.3cm clear to trim, and the narrower one-column width.</p>"
     "<p>Below, Expected and Greater Depth sit side by side. Tap a page to see it large.</p></div>\n\n  <div class=\"tabs\""),
]
for old, new in swaps:
    t, n = re.subn(old, lambda m: new, t, count=1); assert n
for old, new in [
    ('"How " + s.toUpperCase() + "\'s go went"', '({a: "How it went", b: "", c: ""})[s]'),
    ("worksheet-three-runs-round-2", "worksheets-round-4"),
    ('[["A", "A is best"], ["B", "B is best"], ["C", "C is best"], ["same", "All about the same"]]',
     '[["yes", "Happy with these"], ["nearly", "Nearly"], ["no", "Not right"]]'),
    ("Something is wrong on all three", "The same fault is on every level"),
    ('cap.appendChild(el("b", null, name));', 'cap.appendChild(el("b", null, ""));'),
    ('name + " has no page here."', '"No sheet of its own for this level."'),
]:
    assert old in t, old[:40]; t = t.replace(old, new)
(ROUND / "page").mkdir(exist_ok=True)
(ROUND / "page" / "worksheets-round-4.html").write_text(t.replace("/*DATA*/", json.dumps(data, ensure_ascii=False).replace("</", "<\/")), encoding="utf-8")
(ROUND / "files.json").write_text(json.dumps({k: v.replace(str(ROUND).replace("\\", "/") + "/", "") for k, v in files.items()}), encoding="utf-8")
print(json.dumps({k: v.replace(str(ROUND).replace("\\", "/") + "/", "") for k, v in files.items()}))
