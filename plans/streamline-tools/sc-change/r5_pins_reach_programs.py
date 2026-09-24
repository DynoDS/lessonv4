"""Success criteria (4.2.288), the first check's gap 1: a retired phrase barred
"everywhere" is also barred in the JavaScript programs (the slide builder, the
worksheet and wall engines and the shared text code), whose messages the
designers are told to follow."""
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
ROOT = REPO / "plugins" / "lesson-v4"


def patch(path: Path, pairs) -> None:
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (path.name, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", path.name)


PROGRAMS_OLD = 'PROGRAMS = sorted((ROOT / "scripts").glob("*.py"))\n'
PROGRAMS_NEW = (
    'PROGRAMS = sorted((ROOT / "scripts").glob("*.py")) + sorted(\n'
    '    path\n'
    '    for folder in ("builder", "worksheet-html", "working-wall-html", "stick-in-sheets-html", "shared")\n'
    '    for path in (ROOT / folder).rglob("*.js")\n'
    '    if "node_modules" not in path.parts and "test" not in path.parts and "out" not in path.parts\n'
    ')\n'
)
patch(ROOT / "scripts" / "tests" / "ledger_pin_checks.py", [
    ("# The programs the reviewer and designer are handed text by (the review packet's\n"
     "# notes and triggers among them). A retired phrase must not come back there\n"
     "# either. The tests are left out: they name retired phrases to bar them.\n" + PROGRAMS_OLD,
     "# The programs the reviewer and designer are handed text by (the review packet's\n"
     "# notes and triggers among them, and the builders' refusal messages the slide,\n"
     "# worksheet and wall designers are told to follow). A retired phrase must not\n"
     "# come back there either. The tests are left out: they name retired phrases to\n"
     "# bar them.\n" + PROGRAMS_NEW),
])

# The mapping helper decides "everywhere" over the same files the test reads.
patch(REPO / "plans" / "streamline-tools" / "ledger_mapping.py", [
    ("def absent_everywhere(phrase: str) -> bool:\n"
     "    return all(norm(phrase) not in norm(q.read_text(encoding=\"utf-8\")) for q in RUNTIME)\n",
     "PROGRAMS = sorted((ROOT / \"scripts\").glob(\"*.py\")) + sorted(\n"
     "    q for folder in (\"builder\", \"worksheet-html\", \"working-wall-html\", \"stick-in-sheets-html\", \"shared\")\n"
     "    for q in (ROOT / folder).rglob(\"*.js\")\n"
     "    if \"node_modules\" not in q.parts and \"test\" not in q.parts and \"out\" not in q.parts\n"
     ")\n"
     "\n"
     "\n"
     "def absent_everywhere(phrase: str) -> bool:\n"
     "    return all(norm(phrase) not in norm(q.read_text(encoding=\"utf-8\")) for q in RUNTIME + PROGRAMS)\n"),
])
