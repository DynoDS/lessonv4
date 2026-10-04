"""The subject-files mapping and pins (topic 8, release 1).

Every row of `plans/2026-09-23-subject-files-ledger.md` (490) is pinned: a row
whose words still stand is pinned where they now sit; a changed row names the
decision that changed it, the words that now carry it and the words that went,
and its whole paragraph is pinned; words a decision added that no row quoted are
their own rows; the three sections this release rewrote are pinned paragraph by
paragraph. `ledger_mapping.build` checks every phrase against the files before
anything is written.

Three things the shared tool cannot do on its own, handled here for this run
only (the tool itself is left as it is, so no earlier topic's mapping changes):

- 75 rows lived in the two files his decisions 1 and 3 removed. Their words are
  pinned as gone from a file that is gone: the tool reads a missing file as
  empty, and each such pin is marked `fileRemoved`, which the shared checks
  hold by the file staying gone (`ledger_pin_checks.py`).
- Two of the homes are the last section of their file, which the tool's home
  reader does not reach the end of; it is read to the file's end here, as the
  shared checks now do.
- The ledger is read from this copy's `plans/` folder. It is not on this
  branch's history (it is untracked in the main checkout); the copy here is
  byte for byte the main checkout's.

    python -X utf8 plans/streamline-tools/sj-change/build_sj_mapping.py
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import ledger_mapping  # noqa: E402
from ledger_mapping import HEADING, P, Q, REPO, ROOT, build, norm  # noqa: E402

print(f"plugin: {ROOT}")
print(f"plans: {REPO / 'plans'}")

LEDGER = "2026-09-23-subject-files-ledger.md"
PINS = "scripts/tests/subject_files_ledger_pins.json"
MAPPING = "2026-09-25-subject-files-mapping.md"

LD = "agents/lesson-designer.md"
PREF = "references/preferences.md"
ADAPT = "agents/adaptation-designer.md"
HISTORY = "references/subject-history.md"
GEOGRAPHY = "references/subject-geography.md"
MATHS = "references/subject-maths.md"
SCIENCE = "references/subject-science.md"
RE = "references/subject-re.md"
PSHE = "references/subject-pshe.md"
RP = "references/reasoning-prompts.md"
SETUP = "references/computer-setup.md"
TEMPLATES = "references/templates.md"
SCIENCE_HELPERS = "references/worksheet-helpers/science.md"
WALL = "references/working-wall-card-contracts.md"
SKILL = "skills/make-subject-file/SKILL.md"
GUIDE = "references/authoring-subject-files.md"
REMOVED_FILES = (SKILL, GUIDE)

# A removed file reads as empty, so its phrases are "gone from it".
_text_of = ledger_mapping.text_of


def text_of(rel: str) -> str:
    if rel in REMOVED_FILES:
        assert not (ROOT / rel).exists(), f"{rel} should have been removed"
        return ""
    return _text_of(rel)


ledger_mapping.text_of = text_of


def home_paragraphs(rel: str, heading: str) -> list[str]:
    lines = (ROOT / rel).read_text(encoding="utf-8").splitlines()
    start = lines.index(heading)
    level = len(heading.split(" ")[0])
    end = next((i for i in range(start + 1, len(lines))
                if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= level), len(lines))
    return [norm(x) for x in "\n".join(lines[start + 1:end]).split("\n\n") if norm(x) and norm(x) != "---"]


ledger_mapping.home_paragraphs = home_paragraphs

# --- The decisions, in his words (the ledger's "His answers, 24 September").
D1_3 = ("his decisions 1 and 3 of 24 September, \"forget about 'writing a new subject file' guidance. it should "
        "just knowe the files it has, nothing around what could be added in future.\" and \"is this a new skill "
        "called make subject file skill or something? just remove it completely.\"")
D4 = ("his decision 4 of 24 September, \"History doesnt always need sources right? It often leads to it anyway, "
      "but does it have to be a strict rule?\": not a strict rule, and the top line gains \"When the lesson uses "
      "sources\"; the sketch, its lead-in and \"a history lesson does not need a source in it\" (E66) are unchanged")
D6 = ("his decision 6 of 24 September, \"those balanced diet things sound like things I wouldnt want in the pshe "
      "subject files\", then \"extra rul4es yes, maybe the subject file could say to look for guidance from "
      "eatwell guide thing\" and \"yes and yes\": the PSHE food section is one line pointing to the NHS Eatwell "
      "Guide, and science has the same line. What reaches a diet lesson another way stays where it is: the "
      "reviewer's single-lunch example, the food plate's caption and its ban on good and bad foods, and the rule "
      "against an invented count in a criterion (SC-G01)")
D8 = ("his decision 8 of 24 September, \"yes\": the circuit drawing's guidance says standard symbols are Year 6 "
      "work and a Year 4 lesson shows a labelled photograph of a real circuit (`label-diagram` on the "
      "photograph); the science file stays as it is")
PROPHET = ("his answer of 24 September (evening) to the change plan's question 1, \"Okay, so yeah, let's not have "
           "any pictures of him.\", and of 25 September to the first check's question, \"yes to prohet muhammad not "
           "being pictured\": every lesson gets no picture of the Prophet Muhammad, in the picture rules every "
           "lesson's designer reads (`preferences.md` -> Lesson Designer visual-need boundary); RE keeps its fuller "
           "rule, any prophet, beside its line that a nativity or a Bible illustration is ordinary, and points there, "
           "because an RE lesson's reviewer and adaptation designer read the RE file and not that section (the first "
           "check's finding 1)")
S7 = "settled item 7: out-of-date text says what is true"
S10 = "settled item 10: the date beside his example goes, every word of the example stays (the log holds the date)"
S12 = ("settled item 12: one copy of a true repeat; history's and geography's word-for-word start notes fold into "
       "the designer's own reading line, carrying what they held (read before the structure is chosen because the "
       "routing is part of that choice; come back beside the teaching-sequence file; what each file is for)")
STORY = ("the standing story rule: the deck's date and name go (the log holds them, with his words); its telling "
         "stays word for word as a plain undated example, \"in eighteen slides\" and his words included (the first "
         "check's finding 6)")

EATWELL = ("A lesson about food, diet or healthy eating follows the NHS Eatwell Guide for what a balanced diet is "
           "and how it is shown.")
YEAR_6 = ("Standard circuit symbols are Year 6 work (`subject-science.md`); a Year 4 lesson shows a labelled "
          "photograph of a real circuit instead (`label-diagram` on the photograph).")
LD_LINE = ("- Read the one matching `subject-*.md` file when it exists, whole, with `--file` and every page, before "
           "the structure is chosen: in history and geography its routing is part of that choice. List the "
           "directory and match the subject. Do not guess a filename. Come back to it alongside the "
           "teaching-sequence file once the structure is set: the structure file tells you what shape the lesson "
           "takes, and the subject file what the thinking inside it should be.")
PROPHET_HOME = "**Islam does not depict the Prophet Muhammad, and no lesson may request a picture of him.**"


def ledger_rows():
    rows = {}
    for raw in (REPO / "plans" / LEDGER).read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\| (SJ-[A-Z]\d{2}) \|", raw)
        if not m:
            continue
        p = P.search(Q.sub("", raw))
        if p:
            rows[m.group(1)] = (p.group(1), Q.findall(raw))
    return rows


ROWS = ledger_rows()
assert len(ROWS) == 490, len(ROWS)


def quotes(rid):
    return ROWS[rid][1]


CHANGED = {}

# Removed with their files (decisions 1 and 3): every row whose home was the
# skill or the guide. SJ-C55 lives in the setup guide and is mapped below.
for rid, (rel, qs) in ROWS.items():
    if rel in REMOVED_FILES:
        CHANGED[rid] = (f"retired: removed with its file, {D1_3}; none of it was read in a lesson",
                        [], [(rel, q, "local") for q in qs])
assert len(CHANGED) == 75, len(CHANGED)

CHANGED["SJ-C55"] = (
    f"changed: the setup guide stops listing writing a subject file among the developer commands, {D1_3} "
    "(the playbook ledger's PB-V20)",
    [(SETUP, "lets the developer commands (installing a helper, editing templates) change the plugin.")],
    [(SETUP, quotes("SJ-C55")[0], "local")],
)
CHANGED["SJ-A59"] = (
    f"retired: the \"until a subject-English file exists\" hedge goes, {D1_3}; the English guidance below it stays, "
    "now simply live (the routes ledger's RT-L20); the adaptation guidance's \"future subject-English file\" note, "
    "the same hedge in no ledger, goes with it",
    [(RP, "- English may compare effects, justify structural choices or reason from textual evidence.")],
    [(RP, quotes("SJ-A59")[0]),
     ("references/adaptive-adaptation.md", "Detailed English progression belongs in a future subject-English file.")],
)
CHANGED["SJ-A04"] = (
    f"changed: {S12}",
    [(LD, LD_LINE)],
    [(LD, quotes("SJ-A04")[0], "local")],
)
for rid, rel in (("SJ-E01", HISTORY), ("SJ-G01", GEOGRAPHY)):
    CHANGED[rid] = (f"folded into the designer's reading line (SJ-A04), {S12}", [(LD, LD_LINE)], [(rel, quotes(rid)[0])])
CHANGED["SJ-J03"] = (
    "folded: the designer's Structure Decision says it for every subject (SJ-A09, \"The subject file does not select "
    "a route by label alone\"), settled item 12",
    [(LD, "The subject file does not select a route by label alone")],
    [(PSHE, quotes("SJ-J03")[0])],
)
CHANGED["SJ-E09"] = (
    f"changed: {D4}",
    [(HISTORY, "When the lesson uses sources, teach historical knowledge through the evidence: a concrete aspect of "
               "life, what a source shows or tells us about it, and a useful comparison or inference."),
     (HISTORY, quotes("SJ-E09")[1])],
    [(HISTORY, "Teach historical knowledge through the evidence")],
)
CHANGED["SJ-E11"] = (
    f"changed: {S10}",
    [(HISTORY, "The shape that produces this, in the order a child meets it, is the user's own sketch of a Victorian "
               "schooling lesson, kept here as the calibration:")],
    [(HISTORY, "Victorian schooling lesson (4 September 2026)")],
)
CHANGED["SJ-E21"] = (
    f"changed: {S10}",
    [(HISTORY, "The Teach boards of the Tudor lesson the user chose (`preferences.md` → Pride Lessons, `What a "
               "Teach slide holds`) are the same order inside one beat: what the class already has, the new thing, "
               "the look at the picture, the sentence that lands.")],
    [(HISTORY, "the user chose on 14 September 2026")],
)
CHANGED["SJ-E27"] = (
    f"changed: {STORY}",
    [(HISTORY, "A deck that told its invented cases in the present tense, named \"Tudor\" once or twice in eighteen "
               "slides, and asked every question about the one child, and the user found the class would come away "
               "thinking \"that child experienced it, rather than this was a different time in history and many "
               "children experienced this\".")],
    [(HISTORY, "A Year 4 deck on why Tudor children worked (14 September 2026)")],
)
CHANGED["SJ-E39"] = (
    f"changed: {S7} (a slip in a history file)",
    [(HISTORY, "The historical part is the second half: the child says what in the source told them, not just what "
               "they concluded.")],
    [(HISTORY, "The geographical-sounding part")],
)
CHANGED["SJ-F26"] = (
    f"changed: {S7}; the timeline guidance places marks in proportion to their real dates and refuses a \"not to "
    "scale\" note (his ruling of 8 September)",
    [(HISTORY, "(both engines draw a `timeline` from the positions you set, and their own guidance places each mark in "
               "proportion to its real date, and a line is never labelled not to scale)")],
    [(HISTORY, "a school timeline is almost never honestly to scale")],
)
CHANGED["SJ-G45"] = (
    "changed: the reviewer reads the finished design against the whole file, before any book exists (the reviewer "
    "ledger's RV-T05, corrected here because the file is this list's)",
    [(GEOGRAPHY, "The design reviewer reads the finished design against this file and asks whether it reads as the "
                 "subject."),
     (GEOGRAPHY, quotes("SJ-G45")[1])],
    [(GEOGRAPHY, "The design-reviewer reads the book at the end of the lesson")],
)
CHANGED["SJ-D12"] = (
    f"changed: {S10}",
    [(MATHS, "Its limit is the first model only: the lesson still needs those cases, and this says where they go, "
             "not whether to teach them (the teacher, after the nearest-100 lesson modelled 34 first).")],
    [(MATHS, "(the teacher, 19 September 2026, after the nearest-100 lesson modelled 34 first)")],
)
CHANGED["SJ-D42"] = (
    f"changed: {S10} (the worksheets ledger's WS-G09)",
    [(MATHS, "The standard is the Classroom Secrets reasoning and problem-solving sheets the user holds up as the way "
             "a maths question should read."),
     (MATHS, quotes("SJ-D42")[1])],
    [(MATHS, "the way a maths question should read (16 September 2026)")],
)
CHANGED["SJ-I08"] = (
    f"changed: {PROPHET}",
    [(PREF, PROPHET_HOME),
     (RE, "Christian art depicts Jesus freely, so a nativity, a crucifix or a Bible illustration is ordinary teaching "
          "material."),
     (RE, "Islam does not depict Muhammad, and no lesson may request a picture of him or of any prophet (every "
          "lesson's rule, no picture of the Prophet Muhammad, is in `preferences.md` → Lesson Designer visual-need "
          "boundary); teach through the mosque, the Qur'an, calligraphy, the practice or the community instead."),
     (RE, "Where you are unsure whether a tradition depicts a figure, request the place, object, text or practice "
          "rather than the figure, which teaches the same thing and cannot offend the people being taught about.")],
    [(RE, "no lesson may request a picture of him or of any prophet; teach through"),
     (PREF, "no lesson may request a picture of him or of any prophet.", "local")],
)
for rid, extra in (
    ("SJ-J24", ""),
    ("SJ-J25", "; the reviewer keeps its single-lunch example and the food plate's caption says across a day or "
               "over time, not every meal"),
    ("SJ-J26", "; shared with success criteria (SC-G02), retired there too"),
    ("SJ-J27", ""),
    ("SJ-J28", "; the food plate drawing still bans good and bad foods"),
):
    CHANGED[rid] = (f"retired: {D6}{extra}", [(PSHE, EATWELL)], [(PSHE, q) for q in quotes(rid)])

ADDED = [
    ("SJ-DEC-06-SCIENCE", f"added: {D6}", [(SCIENCE, EATWELL)]),
    ("SJ-PROPHET-READERS",
     "added: where each agent that asks for pictures meets the Prophet Muhammad rule, in every lesson: the lesson "
     "designer's two directions to the section that holds it (at the picture decision and in its reading list; the "
     "first check found that deleting the first passed every pin), and the sentence itself where the adaptation "
     "designer decides its own photographs (it does not read that section; the second check's finding 1)", [
        (ADAPT, "There is no fixed picture maximum, but visual-heavy content creates serious fitting risk. Islam does "
                "not depict the Prophet Muhammad, and no lesson may request a picture of him (`preferences.md` → "
                "Lesson Designer visual-need boundary)."),
        (LD, "**Settle WHICH pictures the lesson wants before any of that, and read `preferences.md` → Lesson Designer "
             "visual-need boundary here to do it.**"),
        (LD, "- Read the Lesson Designer parts of `Slide Philosophy`: `Lesson Designer content boundaries`, `Lesson "
             "Designer visual-need boundary` and `Speaker notes hand-off`."),
     ]),
    ("SJ-DEC-08-CIRCUIT", f"added: {D8}", [
        (TEMPLATES, "Use for reading, comparing and reasoning about primary circuit diagrams, not as a realistic "
                    "equipment picture. " + YEAR_6),
        (TEMPLATES, "switches have clear open and closed positions. This is a schematic, not a realistic equipment "
                    "picture. " + YEAR_6),
        (SCIENCE_HELPERS, "whole electricity unit: a working circuit, a broken one, a switch open. " + YEAR_6),
        (WALL, "Wall material for an electricity unit: the anchor a child checks their own circuit against all term. "
               + YEAR_6),
    ]),
]

HOMES = [
    (PSHE, "## Food and diet", "HOME-SJ-PSHE-FOOD"),
    (SCIENCE, "## Food and diet", "HOME-SJ-SCIENCE-FOOD"),
    (RE, "## Check the tradition's own rules before asking for a picture of it", "HOME-SJ-RE-PICTURES"),
    # The section every lesson's designer reads for its pictures, paragraph by
    # paragraph, so a new limit put anywhere in it is caught (the second
    # check's finding 3: a ban on other figures, reworded, passed otherwise).
    (PREF, "### Lesson Designer visual-need boundary", "HOME-SJ-PICTURE-RULES"),
]

build(
    ledger=LEDGER, prefix="SJ", changed=CHANGED, added=ADDED, homes=HOMES, pins=PINS, mapping=MAPPING,
    title="The subject files: where each row went (topic 8, release 1)",
    snapshot="2db3ceba (4.2.289) with the subject-files release built on its side branch, 25 September 2026",
    intro=[
        "Built by `streamline-tools/sj-change/build_sj_mapping.py` from `2026-09-23-subject-files-ledger.md` "
        "(490 rows) and his answers of 24 September, recorded in that ledger and in "
        "`2026-09-24-topic-8-change-plan.md` (the prophet line and the maths explanation question). Every "
        "phrase below was checked against the files before this was written. A row removed with its file is "
        "held by that file staying gone; the ledger's own words for it are its record.",
    ],
)

# Mark every pin on a removed file, so the shared checks hold it by the file
# staying gone rather than trying to read it.
path = ROOT / PINS
data = json.loads(path.read_text(encoding="utf-8"))
marked = 0
for row in data["rows"]:
    for pin in row["absent"]:
        if pin["file"] in REMOVED_FILES:
            assert not pin["everywhere"]
            pin["fileRemoved"] = True
            marked += 1
path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
print(f"marked {marked} pins as held by their removed file")

# The shared tool writes in text mode, which on Windows writes CRLF; the
# repository keeps text at LF on disk as well (`.gitattributes`).
mapping = REPO / "plans" / MAPPING
mapping.write_text(mapping.read_text(encoding="utf-8"), encoding="utf-8", newline="\n")
