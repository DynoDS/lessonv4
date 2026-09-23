"""Pins follow the second repairs: incidents out, the designer's list
conditioned, the short bars narrowed to their own files where honest English
would trip them, and the removed sentence barred."""
from pathlib import Path

TOOLS = Path(__file__).resolve().parents[1]


def patch(path: Path, pairs) -> None:
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (path.name, old[:90])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", path.name)


# An absent pin may be (file, phrase, "local"): barred in its own file only,
# because the phrase is also ordinary English elsewhere.
patch(TOOLS / "ledger_mapping.py", [(
    '''                    "absent": [{"file": f, "text": norm(x), "everywhere": absent_everywhere(x)} for f, x in absent]})''',
    '''                    "absent": [{"file": a[0], "text": norm(a[1]),
                                "everywhere": (len(a) < 3 or a[2] != "local") and absent_everywhere(a[1])}
                               for a in absent]})''',
), (
    '''        for f, phrase in absent:
            if norm(phrase) in text_of(f):
                problems.append(f"{rid}: still present in {f}: {phrase[:90]}")''',
    '''        for f, phrase, *_scope in absent:
            if norm(phrase) in text_of(f):
                problems.append(f"{rid}: still present in {f}: {phrase[:90]}")''',
)])

APPRENTICE = "A sort still earns its place when its cards are cases the lesson did not show: sorting a different apprentice's deal, once this one is taught, settles the vocabulary of the deal and needs it."
patch(TOOLS / "qc-change" / "build_qc_mapping.py", [
    ('    ("Do not reject a deliberately brief recall check',
     '    (", and a reviewer approved both.", "."),\n'
     '    (", and the teacher who wrote the lesson could not tell the groups apart.", ", and even the adult who wrote them cannot tell the groups apart."),\n'
     '    ("words to diagram and back, what can we tell,", "words to diagram and back (a diagram the class has not had explained), what can we tell,"),\n'
     '    ("Do not reject a deliberately brief recall check'),
    ('    "QC-B06": "decision 4:',
     '    "QC-E11": "decision 10: the incident (a reviewer approved both) leaves; it is in the log (L2306), and the examples and their reason stay",\n'
     '    "QC-G06": "decision 10: the incident (the teacher who wrote the lesson) leaves; it is in the log (L1187), and the reason stays",\n'
     '    "QC-D02": "decision 6: the designer\'s list of the explanation formats carries the diagram condition",\n'
     '    "QC-B06": "decision 4:'),
    ('    "QC-B02": [(TC, "an honest recall beat, named as one"), (TC, "named as one")],',
     '    "QC-B02": [(TC, "an honest recall beat, named as one"), (TC, "named as one", "local")],\n'
     '    "QC-E11": [(REV, "and a reviewer approved both")],\n'
     '    "QC-G06": [(PREF, "the teacher who wrote the lesson could not tell the groups apart")],'),
    ('    "QC-B03": [(REV, "adequate as a brief orientation"), (REV, "two-minute orientation"), (REV, "named as a check")],',
     '    "QC-B03": [(REV, "adequate as a brief orientation"), (REV, "two-minute orientation", "local"), (REV, "named as a check"), (REV, "the design says so", "local")],'),
    ('(TC, "named as a check"), (TC, "two-minute orientation"), (TC, "the design says so")]),',
     f'(TC, "named as a check"), (TC, "named as a quick check"), (TC, "two-minute orientation", "local"), (TC, "the design says so", "local"), (TC, "{APPRENTICE}")]),'),
    ('(BEATS, "the design says so")]),',
     '(BEATS, "the design says so", "local"), (LD, "the design says so", "local")]),'),
    ('               [(HIST, "is still a fair two-minute orientation before the question that matters")]),',
     '               [(HIST, "is still a fair two-minute orientation before the question that matters"), (HIST, "two-minute orientation", "local")]),'),
])
