"""The subject-files release (topic 8, release 1), step 9, run by the lead AFTER
the merge with the worksheets release (4.2.290), on the merged tree.

That release's pin file (`worksheets_ledger_pins.json`) is not on this branch,
and it pins words this release changes: the maths file's Classroom Secrets
paragraph with its date "(16 September 2026)" (WS-G09) and, as a home
paragraph by paragraph, the section it sits in (`## How a maths sheet's
questions are worded`). The worksheets plan left that date to this release (its
G09). This script makes every pin file on the merged tree follow this
release's words, the way `sj_06` does on the branch:

- a pin (or a home's paragraph) holding one of the old wordings below takes the
  new one, in place, with the decision named in its outcome;
- a pin on one of the two removed files is retired and held by the file staying
  gone (`fileRemoved`);
- a pin on a paragraph this release removed from a file that stays (the PSHE food
  paragraphs, PSHE's route-label line, the history and geography start notes) is
  retired, its words barred where they were; the rest-of-preferences list's
  PF-N74 and PF-N75 are the known case, should topic 7 pin them first;
- anything else that no longer holds is reported and nothing is written, so a
  pin is never moved by a guess.

Run from any folder: `python -X utf8 plans/streamline-tools/sj-change/sj_09_follow_at_merge.py`.
It reads and writes only the copy it sits in, and says so. Run on the branch
itself it finds nothing to move (sj_06 has moved those pins) and says so."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from ledger_mapping import HEADING, ROOT, norm, paragraph_of, pin_of  # noqa: E402

print(f"plugin: {ROOT}")

RELEASE = "the subject-files release (topic 8, release 1)"
S10 = "settled item 10 on the subject-files list: the date beside his example goes, every word of it stays"
S7 = "settled item 7 on the subject-files list: out-of-date text says what is true"
S12 = "settled item 12 on the subject-files list: the designer's reading line gains the history and geography start note"
D4 = "decision 4 on the subject-files list, his words \"does it have to be a strict rule?\": \"When the lesson uses sources\""
D8 = "decision 8 on the subject-files list: the circuit drawing's guidance says standard symbols are Year 6 work"
PROPHET = "his answer \"let's not have any pictures of him\": RE keeps the rule and points to where every lesson reads it"
D1_3 = "decisions 1 and 3 on the subject-files list, \"just remove it completely\""
YEAR_6 = ("Standard circuit symbols are Year 6 work (`subject-science.md`); a Year 4 lesson shows a labelled "
          "photograph of a real circuit instead (`label-diagram` on the photograph).")
REMOVED_FILES = ("skills/make-subject-file/SKILL.md", "references/authoring-subject-files.md")

# (file, old words, new words, why): every wording this release changed in a
# file that still exists.
SUBS = [
    ("references/subject-maths.md", "the way a maths question should read (16 September 2026).",
     "the way a maths question should read.", S10),
    ("references/subject-maths.md", "(the teacher, 19 September 2026, after the nearest-100 lesson modelled 34 first)",
     "(the teacher, after the nearest-100 lesson modelled 34 first)", S10),
    ("references/subject-history.md", "Victorian schooling lesson (4 September 2026), kept here",
     "Victorian schooling lesson, kept here", S10),
    ("references/subject-history.md", "the user chose on 14 September 2026 (", "the user chose (", S10),
    ("references/subject-history.md",
     "A Year 4 deck on why Tudor children worked (14 September 2026) told its invented cases",
     "A deck that told its invented cases", S10),
    ("references/subject-history.md", "Teach historical knowledge through the evidence:",
     "When the lesson uses sources, teach historical knowledge through the evidence:", D4),
    ("references/subject-history.md", "The geographical-sounding part is the second half",
     "The historical part is the second half", S7),
    ("references/subject-history.md", "and their own guidance is that a school timeline is almost never honestly to scale)",
     "and their own guidance places each mark in proportion to its real date, and a line is never labelled not to scale)", S7),
    ("references/subject-geography.md",
     "The design-reviewer reads the book at the end of the lesson and asks whether it reads as the subject.",
     "The design reviewer reads the finished design against this file and asks whether it reads as the subject.", S7),
    ("references/subject-re.md",
     "Islam does not depict Muhammad, and no lesson may request a picture of him or of any prophet; teach",
     "Islam does not depict Muhammad, and no lesson may request a picture of him or of any prophet (every lesson's "
     "rule, no picture of the Prophet Muhammad, is in `preferences.md` → Lesson Designer visual-need boundary); "
     "teach", PROPHET),
    ("agents/lesson-designer.md",
     "with `--file` and every page. List the directory and match the subject. Do not guess a filename.",
     "with `--file` and every page, before the structure is chosen: in history and geography its routing is part of "
     "that choice. List the directory and match the subject. Do not guess a filename. Come back to it alongside the "
     "teaching-sequence file once the structure is set: the structure file tells you what shape the lesson takes, and "
     "the subject file what the thinking inside it should be.", S12),
    ("references/reasoning-prompts.md",
     "reason from textual evidence. Until a subject-English file exists, keep the detailed reading, writing and "
     "grammar guidance below active.", "reason from textual evidence.", D1_3),
    ("references/adaptive-adaptation.md",
     "sequence context. Detailed English progression belongs in a future subject-English file.", "sequence context.", D1_3),
    ("references/computer-setup.md", "(installing a helper, editing templates, writing a subject file)",
     "(installing a helper, editing templates)", D1_3),
    ("references/templates.md", "not as a realistic equipment picture |",
     "not as a realistic equipment picture. " + YEAR_6 + " |", D8),
    ("references/templates.md", "This is a schematic, not a realistic equipment picture.",
     "This is a schematic, not a realistic equipment picture. " + YEAR_6, D8),
    ("references/worksheet-helpers/science.md", "a working circuit, a broken one, a switch open.",
     "a working circuit, a broken one, a switch open. " + YEAR_6, D8),
    ("references/working-wall-card-contracts.md", "checks their own circuit against all term.",
     "checks their own circuit against all term. " + YEAR_6, D8),
    ("agents/adaptation-designer.md", "visual-heavy content creates serious fitting risk.",
     "visual-heavy content creates serious fitting risk. Islam does not depict the Prophet Muhammad, and no lesson "
     "may request a picture of him (`preferences.md` → Lesson Designer visual-need boundary).", PROPHET),
]

# (file, words, why): paragraphs and sentences this release removed from a file
# that still exists. A pin holding one of them is retired, its words barred
# where they were, rather than stopping the follow-up: the rest-of-preferences
# list's PF-N74 and PF-N75 (the PSHE food paragraphs) are the known case, if
# topic 7 has pinned them as kept before this runs.
D6 = ("decision 6 on the subject-files list, \"maybe the subject file could say to look for guidance from eatwell guide "
      "thing\": the PSHE food section is one line pointing to the NHS Eatwell Guide")
REMOVED_WORDS = [
    ("references/subject-pshe.md", "Diet lessons recur in every primary year", D6),
    ("references/subject-pshe.md", "Balance is a property of eating over time, never of one meal.", D6),
    ("references/subject-pshe.md", "No invented per-meal quotas.", D6),
    ("references/subject-pshe.md", "is a teaching scaffold, not the definition of balance.", D6),
    ("references/subject-pshe.md", "Keep food morally neutral throughout", D6),
    ("references/subject-pshe.md", "The PSHE label does not determine the route.", S12),
    ("references/subject-history.md", "Read this at the start of the run when the lesson is History", S12),
    ("references/subject-geography.md", "Read this at the start of the run when the lesson is Geography", S12),
]


def removed_here(text: str, rel: str):
    for f, words, why in REMOVED_WORDS:
        if f == rel and norm(words) in text and norm(words) not in norm((ROOT / rel).read_text(encoding="utf-8")):
            return why
    return None


def follow(text: str, rel: str):
    """The pin's text with every substitution for its file applied, and why."""
    reasons = []
    for f, old, new, why in SUBS:
        if f == rel and norm(old) in text and norm(new) not in text:
            text = text.replace(norm(old), norm(new))
            reasons.append(why)
    return text, reasons


def note_on(row, notes):
    for note in notes:
        full = f"{RELEASE}, {note}"
        if full in row["outcome"]:
            continue
        row["outcome"] = (f"unchanged in place until {full}" if row["outcome"] == "unchanged in place"
                          else row["outcome"] + f"; then {full}")


def home_paragraphs(rel, heading):
    lines = (ROOT / rel).read_text(encoding="utf-8").splitlines()
    start = lines.index(heading)
    level = len(heading.split(" ")[0])
    end = next((i for i in range(start + 1, len(lines))
                if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= level), len(lines))
    return [norm(x) for x in "\n".join(lines[start + 1:end]).split("\n\n") if norm(x) and norm(x) != "---"]


problems, moved, files = [], [], {}
for path in sorted((ROOT / "scripts" / "tests").glob("*_ledger_pins.json")):
    if path.name == "subject_files_ledger_pins.json":
        continue
    data = json.loads(path.read_text(encoding="utf-8"))
    changed = False
    for row in data["rows"]:
        for n, pin in enumerate(list(row["present"])):
            if pin["file"] in REMOVED_FILES:
                row["present"].remove(pin)
                row["absent"].append({"file": pin["file"], "text": pin["text"], "everywhere": False, "fileRemoved": True})
                if not row["present"]:
                    row["outcome"] = f"retired: removed with its file in {RELEASE}, {D1_3}; {row['outcome']} until then"
                changed = True
                moved.append(f"{path.name} {row['id']}: retired with its file")
                continue
            gone = removed_here(pin["text"], pin["file"])
            if gone:
                row["present"].remove(pin)
                row["absent"].append({"file": pin["file"], "text": pin["text"], "everywhere": False})
                row["outcome"] = (f"retired in {RELEASE}, {gone}; {row['outcome']} until then" if not row["present"]
                                  else row["outcome"] + f"; then its words on this paragraph retired in {RELEASE}, {gone}")
                changed = True
                moved.append(f"{path.name} {row['id']}: retired, its paragraph removed")
                continue
            new, why = follow(pin["text"], pin["file"])
            if why:
                at = row["present"].index(pin)
                extra = {k: v for k, v in pin.items() if k not in ("file", "text", "section", "paragraph", "aboveReviewLine")}
                row["present"][at] = pin_of(pin["file"], new, **extra)
                if pin.get("paragraph"):
                    assert paragraph_of(pin["file"], new) == new, (path.name, row["id"], "not a paragraph after the move")
                note_on(row, why)
                changed = True
                moved.append(f"{path.name} {row['id']}: {', '.join(why)[:60]}")
    for home in data.get("homes", []):
        paragraphs = []
        whys = []
        for para in home["paragraphs"]:
            new, why = follow(para, home["file"])
            paragraphs.append(new)
            whys += why
        if whys:
            home["paragraphs"] = paragraphs
            changed = True
            moved.append(f"{path.name} home {home['file']} {home['heading']}")
    if changed:
        files[path] = data

# Check everything before writing anything.
for path, data in list(files.items()) + [(p, json.loads(p.read_text(encoding="utf-8")))
                                         for p in sorted((ROOT / "scripts" / "tests").glob("*_ledger_pins.json"))
                                         if p not in files]:
    for row in data["rows"]:
        for pin in row["present"]:
            if pin["text"] not in norm((ROOT / pin["file"]).read_text(encoding="utf-8")):
                problems.append(f"{path.name} {row['id']}: not found in {pin['file']}: {pin['text'][:80]}")
        for pin in row["absent"]:
            if pin.get("fileRemoved"):
                if (ROOT / pin["file"]).exists():
                    problems.append(f"{path.name} {row['id']}: {pin['file']} is back")
            elif pin["text"] in norm((ROOT / pin["file"]).read_text(encoding="utf-8")):
                problems.append(f"{path.name} {row['id']}: retired words are back in {pin['file']}")
    for home in data.get("homes", []):
        if home_paragraphs(home["file"], home["heading"]) != home["paragraphs"]:
            problems.append(f"{path.name} home {home['file']} {home['heading']}: paragraphs differ")

if problems:
    print("\n".join(problems))
    raise SystemExit(f"FOLLOW_FAILED {len(problems)}: nothing written")
for path, data in files.items():
    path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
print("\n".join(moved) if moved else "nothing to move")
print(f"FOLLOW_OK {len(moved)} moved in {len(files)} pin files")
