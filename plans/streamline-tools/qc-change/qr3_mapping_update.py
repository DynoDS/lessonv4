"""Bring build_qc_mapping.py in line with the 4.2.286 repairs."""
from pathlib import Path

p = Path(__file__).with_name("build_qc_mapping.py")
t = p.read_text(encoding="utf-8")
HOME = "`A quick check is a fresh case, not the last slide again`"
BOTH = "a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case"


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, old[:90]
    t = t.replace(old, new)


swap('"stay legitimate choices rather than failures to aim higher (a quick check on a fresh case, or recall with the answer off the board: `A quick check is a fresh case, not the last slide again`)."',
     f'"stay legitimate choices rather than failures to aim higher ({HOME}: {BOTH})."')
swap('"including the last short response before main practice (recall with the answer off the board, or a fresh case: `A quick check is a fresh case, not the last slide again`)."',
     f'"including the last short response before main practice ({HOME}: {BOTH})."')
swap('("A quick recall check is fine when recall is the claim; do not", "A quick recall check is fine when recall is the claim and the answer is off the board (`preferences.md` → `A quick check is a fresh case, not the last slide again`); do not"),',
     f'("A quick recall check is fine when recall is the claim; do not present it as deeper evidence.", "A quick recall check is fine when recall is the claim; do not present it as deeper evidence (`preferences.md` → {HOME}: {BOTH})."),')
swap('("A short recall response may secure new knowledge, including in the last Do.", "A short recall response may secure new knowledge, including in the last Do, when the answer is no longer on show (`preferences.md` → `A quick check is a fresh case, not the last slide again`)."),',
     f'("A short recall response may secure new knowledge, including in the last Do.", "A short recall response may secure new knowledge, including in the last Do (`preferences.md` → {HOME}: {BOTH})."),')
swap('("Preserve purposeful repeated practice and useful simple checks;", "Preserve purposeful repeated practice and useful simple checks (a fresh case, or recall with the answer off the board: `preferences.md` → `A quick check is a fresh case, not the last slide again`);"),',
     f'("Preserve purposeful repeated practice and useful simple checks;", "Preserve purposeful repeated practice and useful simple checks (`preferences.md` → {HOME}: {BOTH});"),')
swap('("Accurate classification may itself be the intended check; do not", "Accurate classification may itself be the intended check, on cards the Teach did not show (`preferences.md` → `A quick check is a fresh case, not the last slide again`); do not"),',
     f'("Accurate classification may itself be the intended check; do not", "Accurate classification may itself be the intended check (`preferences.md` → {HOME}: the cards are cases the Teach did not show); do not"),')
swap('("A short response can establish new knowledge; select", "A short response can establish new knowledge, when its answer is not on the board (`preferences.md` → `A quick check is a fresh case, not the last slide again`); select"),',
     f'("A short response can establish new knowledge; select", "A short response can establish new knowledge (`preferences.md` → {HOME}: {BOTH}); select"),')
swap('"A simple unlabelled diagram is provided, of a thing the Teach did not label (a different flower, a new stretch of river), or the taught one in a later lesson, when it is retrieval; pupils add labels"',
     '"A simple unlabelled diagram is provided, of a thing the Teach did not label (a different flower, a new stretch of river), a blank copy of the taught one where no other picture of the thing exists (the world map), or the taught one in a later lesson, when it is retrieval; pupils add labels"')
swap('"Given a partially-blank diagram of a thing the Teach did not label, or the taught one in a later lesson, pupils fill in labels"',
     '"Given a partially-blank diagram of a thing the Teach did not label, a blank copy of the taught one where no other picture of it exists, or the taught one in a later lesson, pupils fill in labels"')
swap('"QC-B06": "decision 4: recall is honest when its answer is off the board, and it points to the fresh-case rule",',
     '"QC-B06": "decision 4: keeps its words (decision 1 listed it word for word) and points home, carrying both halves of the recall line",')
swap('The same conclusion can be valid in two cases when each requires that work."),',
     'The same conclusion can be valid in two cases when each requires that work; do not force different answers."),')
swap('"A fact, a name or a definition is the one thing recalled rather than applied: straight after teaching it may be asked for once the answer is no longer on show, because',
     '"A fact, a name or a definition may be recalled straight after teaching once the answer is no longer on show, because')
swap("""    "QC-B01": ("retired by name (decisions 1 and 2): \\"named as a check\\" and the orientation permission go; the simpler task is right on cases the lesson did not show",""",
     """    "QC-B01": ("retired by name (decisions 1 and 2): \\"named as a check\\" and the orientation permission go; what it also said stays (the sort is not the lesson's evidence, and a lesson that leans on it has taught less than it looks); whether this contrast should name a simpler task that is right is a question for the teacher",""")
swap("""               [(TC, "**Where the simpler task is right.** A sort still earns its place when its cards are cases the lesson did not show: sorting a different apprentice's deal, once this one is taught, settles the vocabulary of the deal and needs it. The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks.")],""",
     """               [(TC, "**Where the simpler task is right.** The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks.")],""")
swap("""               [(TC, "It is fine there, named as a check"), (TC, "As a two-minute orientation straight after the deal is taught")]),""",
     """               [(TC, "It is fine there, named as a check"), (TC, "As a two-minute orientation straight after the deal is taught"), (TC, "named as a check"), (TC, "two-minute orientation"), (TC, "the design says so")]),""")
swap("""               [(PREF, "labelling the taught thing is right, and the design says so"), (PREF, "The limit is the recap boundary above:")]),""",
     """               [(PREF, "labelling the taught thing is right, and the design says so"), (PREF, "The limit is the recap boundary above:"), (BEATS, "the design says so")]),""")
swap('    "QC-A21": ("kept in the worksheet guidance, and carried word for word into the one home beside A01 (decision 8)",',
     '    "QC-A21": ("kept in the worksheet guidance, and carried into the one home beside A01, lightly reworded (for a procedure, enough, carrying out) with its must-not kept (decision 8)",')
swap('    "QC-B02": [(TC, "an honest recall beat, named as one")],',
     '    "QC-B02": [(TC, "an honest recall beat, named as one"), (TC, "named as one")],')
swap('    "QC-B03": [(REV, "adequate as a brief orientation")],',
     '    "QC-B03": [(REV, "adequate as a brief orientation"), (REV, "two-minute orientation"), (REV, "named as a check")],')
swap("ADDED = [",
     """from ledger_mapping import paragraph_of  # noqa: E402

ADDED = [
    ("QC-KEEP-01", "sentences the fresh-case rule leans on, pinned whole (change check gap 1): the map contrast's new map, and the skill route's different criteria for a Your Turn",
     [(TC, paragraph_of(TC, "A new, unlabelled map with a river")),
      ("references/teaching-sequence-skill-based.md", paragraph_of("references/teaching-sequence-skill-based.md", "give the Your Turn a *different* criteria pair"))]),""")
p.write_text(t, encoding="utf-8")
print("updated")
