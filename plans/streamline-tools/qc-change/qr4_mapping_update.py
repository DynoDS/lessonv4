"""The last three phrases the 4.2.286 repairs moved, in both mapping scripts."""
from pathlib import Path

HERE = Path(__file__).resolve().parent


def patch(path: Path, pairs) -> None:
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (path.name, old[:80])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", path.name)


DIAGRAM_OLD = "turn the words into a diagram or the diagram back into words,"
DIAGRAM_NEW = "turn the words into a diagram or a diagram the class has not had explained back into words,"

patch(HERE / "build_qc_mapping.py", [
    ('    ("Do not reject a deliberately brief recall check',
     f'    ("{DIAGRAM_OLD}", "{DIAGRAM_NEW}"),\n    ("Do not reject a deliberately brief recall check'),
    ('    "QC-B06": "decision 4:',
     '    "QC-D01": "decision 6: the list that sends designers to the diagram formats carries their condition (a diagram the class has not had explained)",\n    "QC-B06": "decision 4:'),
    ('never the slide\'s own sentence twisted.")]),',
     'never the slide\'s own sentence twisted, and the reason is written. Prefer a sort, a match or an odd one out when those force the same decision.")]),'),
    ('(PACKET, "def _beside_pairs(sequence: list[dict]) -> list[tuple[dict, dict]]:"),',
     '(PACKET, "def _beside_pairs(sequence: list[dict]) -> list[tuple[list[dict], dict]]:"),'),
])

patch(HERE.parent / "td-change" / "build_td_mapping.py", [
    ('QC_SWAPS = [\n',
     f'QC_SWAPS = [\n    ("{DIAGRAM_OLD}", "{DIAGRAM_NEW}"),\n'),
    ('    "TD-E03": "the thinking line',
     '    "TD-E02": "the list that sends designers to the diagram formats carries their condition (quick checks 4.2.286, decision 6)",\n    "TD-E03": "the thinking line'),
])
