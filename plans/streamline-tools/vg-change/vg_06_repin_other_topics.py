"""The voice guide release, step 6: the earlier topics' pins whose words this
release changed follow them, in place, each with the decision that changed it,
as the reviewer, worksheets and colours releases did (`rv-change/rv_06`,
`ws-change/w9`, `colours-change/k8`). The earlier topics' mapping builders are
frozen and are not rerun: a rerun would undo moves like these.

Every pin is found by its words, not by a fixed old text. Each of this release's
replacements is applied, file by file, to every pin on that file that still
holds the old words; and the four pins whose words left their file (the lesson
designer's shorter copy of the guide's route, and the adaptation reference's
plain repeat) move to where the rule now lives, found by their old words too. So
the script replays on a clean 4.2.294 tree after steps 1 to 5, and equally on
the tree the merge with the routes release (topic 8, release 3) leaves, where
that release's own pin file holds some of the same lines: the other release's
words are left as they are, and only this release's change. This topic's own
pin file is built by `build_vg_mapping.py` and is not touched here.

Each changed pin's row records the decision in its outcome, and each topic's
ledger records it too (`vg_07_record_in_ledgers.py`)."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from ledger_mapping import HEADING, ROOT, norm, pin_of  # noqa: E402

TV = "references/teacher-voice.md"
LD = "agents/lesson-designer.md"
PREF = "references/preferences.md"
SD = "agents/slide-designer.md"
SD_REPAIR = "agents/slide-designer-focused-repair.md"
PLAYBOOK = "references/slide-composition-playbook.md"
DIAL = "references/teaching-sequence-dialogic.md"
TASK = "references/teaching-sequence-task-centred.md"
DB = "references/do-beats.md"
ES = "references/evidence-synthesis.md"
ADAPT = "agents/adaptation-designer.md"
ADAPTIVE = "references/adaptive-adaptation.md"
RELEASE = "the voice guide release (topic 8, release 5)"
print(f"repinning in {ROOT}")

LIST = "the voice guide's list (`2026-09-23-teacher-voice-ledger.md`, 24 September 2026)"
D1 = (f"his decision 1 on {LIST}, \"yes\": a sentence stem or other support opens §7, and §14 is read once, when the "
      "kind of lesson is settled")
D2 = ("its decision 2, \"yes\": \"before the case\" means before the question about it, and when the thing is on the "
      "board the sentence about it comes first and the general one straight after")
D4 = "its decision 4, \"yes\": the slide designer's three triggers take the speech guidance's own list, word for word"
D9 = ("its decisions 9 and 10, turned round (\"Humour wherever\"; \"humour is allowed in pshe\"): humour is welcome in "
      "every subject, maths and PSHE included")
D11 = ("its decision 11 (\"Named but not always class 4a 4b etc, jazz it up\"): a class the lesson comes back to gets a "
       "name the first time, and not always a class code")
D12 = "its decision 12, \"yes\": the discussion itself is not scripted; the words that open and frame it are"
S1 = ("its settled item 1: the guide's route names all four most-missed kinds, each with its reason, and the lesson "
      "designer points at that route instead of keeping a shorter copy of it")
S5 = "its settled item 5: \"Do not normally reverse\" stays, and the copies that said never come into line with it"
S6 = "its settled item 6: each copy of \"keep precise subject vocabulary\" keeps its own condition; the plain repeats fold"
S8 = "its settled item 8: out-of-date text says what is true now"
DASH = ("its settled item 8: a long dash in an example a child could be given is replaced, because the teacher does not "
        "write one")
STORY = "the standing story rule: the incident left for the build log, where the release copied it first; the reason stays"
DATE = "the standing story rule: his words stay and their date goes (the build log holds it)"
NOTES = ("his speaker-notes answer on the rest-of-preferences list, its decision 3 (\"for the speaker notes it doesn't "
         "have to be short sentences ... speaker notes are as long as the idea needs, of course, and they're also "
         "conversational\"), planned for 7B (its B1) and brought into this release by the lead")
D13 = ("the voice list's decision 13, by his answer on the rest-of-preferences list (\"I actually don't know why it says "
       "nine-year-old. Um, because the plugin is for years one, two, three, four, five, and six, right?\"): the reader "
       "is a child in this class; planned for 7B (its B1) and brought into this release by the lead")

SPEECH_LIST = ("a speaking character, a voiced claim, a misconception, a disagreement, a prediction to judge, an "
               "advice-to-a-character move, or anyone who simply says what they think, gives their reason or asks a "
               "question")
TWO = ("because a definition feels like a structured field being filled and a script feels like notes rather than "
       "writing; both are words a child reads or hears, and both are where the register slips first.")

# (file, old words, new words, why), each exactly as steps 2 and 3 replaced them,
# cut to the smallest run that is unique, so a pin holding only part of a
# changed paragraph still follows it. Where two entries share words, the longer
# comes first; once it has matched, the shorter no longer can.
EDITS = [
    (TV, "not the calibration evidence archive. Apply these rules as defaults,",
     "not the calibration evidence archive. Treat this guide as the default runtime specification. Apply these rules "
     "as defaults,", S8 + " (the Maintenance note's one sentence for every reader stays in the guide)"),
    (TV, "not for each string. Read the numbered section",
     "not for each string, and §14 once, when the kind of lesson is settled. Read the numbered section", D1),
    (TV, "a definition or explanation §5, a model answer §8,",
     "a definition or explanation §5, a sentence stem or other support §7, a model answer §8,", D1),
    (TV, "**§6 and §12 are the two most often missed, and they are missed the same way:**",
     "**§6 and §12 are two of the four most often missed, and they are missed the same way:**", S1),
    (TV, "Three reached real children. `Choose a job.` on an appliances sheet, which a class answered `Fireman`, and "
         "`Write one question you would ask before making a stronger judgement.` on a Greater Depth diet sheet, both "
         "§6 (5 September 2026). `What do their reasons share?` on a Year 4 RE slide, where §12's own calibrated "
         "wording was already sitting in that same slide's teacher script (11 September 2026). Every one was written",
     "Questions and comparison prompts missed this way have reached real children. Every one was written", STORY),
    (TV, "Routing by the kind of string only works if you stop and name the kind.",
     "Routing by the kind of string only works if you stop and name the kind. **Definitions and scripts are the other "
     "two**, " + TWO, S1),
    (TV, "It doesn't sound human\" (14 September 2026). A clipped line",
     "It doesn't sound human\". A clipped line", DATE),
    (TV, "A Year 4 RE slide printed `What do their reasons share?` while its own script said `Tell your partner what is "
         "the same and what is different`. The plain version was already written, by the same agent, on the same "
         "slide. The board got the clever one, and `share` means",
     "A Year 4 slide that prints `What do their reasons share?` while its own script says `Tell your partner what is the same "
     "and what is different` is the shape: the plain version is already written, by the same agent, on the same "
     "slide, and the board gets the clever one, where `share` means",
     STORY + " (one plain telling stays as the example)"),
    (TV, "The board got the clever one, and `share` means",
     "and the board gets the clever one, where `share` means", STORY + " (one plain telling stays as the example)"),
    (TV, "but has to be funny\" (12 September 2026). Both halves", "but has to be funny\". Both halves", DATE),
    (TV, "Ordinary teaching content can include a small light moment if it fits naturally.",
     "Ordinary teaching content can include a small light moment if it fits naturally, in every subject, maths and "
     "PSHE included: in the teacher's words, \"Humour wherever\" and \"humour is allowed in pshe\".", D9),
    (TV, "is somebody they can picture and put themselves beside.",
     "is somebody they can picture and put themselves beside. A class the lesson comes back to gets a name the first "
     "time, and not always a class code like `Class 4B` (`Oak Class`, `the class at Hilltop School`), and keeps it.",
     D11),
    (TV, "belongs in the teacher line above, not in the middle",
     "belongs in a teacher line of its own (a caveat or a safeguarding note in the teacher information below the "
     "script, a staging line for a model finished live in `On the board:` above it), not in the middle", S8),
    (LD, "- Read `teacher-voice.md` at the same point: its core sections, then the numbered section for the kind of "
         "thing being written - §6 a question",
     "- Read `teacher-voice.md` at the same point, by the route its `How to read this file` sets out: its core "
     "sections, then the numbered section for the kind of thing being written, at the moment you write it, among "
     "them §6 a question", S1),
    (LD, "the most confident children), §5 a vocabulary definition or explanation, §§1 and 3 a spoken script, §8 a "
         "model answer, §9 a worked example, §10 success criteria, §11 a misconception warning, §12 a comparison or "
         "critique prompt. Definitions and scripts are the two most often missed, " + TWO + " Read its calibrated "
         "examples (§16) only when wording remains uncertain. §4 is routed",
     "the most confident children). §4 is routed", S1),
    (LD, "the slide keeps the tighter version, never the reverse)",
     "the slide keeps the tighter version, not normally the reverse)", S5),
    (LD, "Give it a plain ordinary name the first time it appears (`Class 4B`, `the Hill Road team`) and use that name",
     "Give it a name the first time it appears, and not always a class code like `Class 4B` (`Oak Class`, `the class "
     "at Hilltop School`, `the Hill Road team`), and use that name", D11),
    (LD, "That section is the one place every vocabulary decision",
     "`preferences.md` → Vocabulary is the one place every vocabulary decision", S8 + " (\"That section\" named)"),
    (PREF, "the fuller conversational version - not the other way round.",
     "the fuller conversational version - not normally the other way round.", S5),
    (PREF, "comes off in one spot. The same applies to a scenario,",
     "comes off in one spot. Before the case means before the question about it: when the thing is on the board, the "
     "sentence about the thing in view comes first and the general one straight after. The same applies to a "
     "scenario,", D2),
    (PREF, "The full voice and worked examples live in the Speaker Notes Voice section of the lesson-designer agent.",
     "The full voice and its short examples live in the Speaker Notes Voice section of the lesson-designer agent, and "
     "two full-length scripts in `teacher-voice.md` §16H.", S8 + " (the hand-off names §16H)"),
    (PREF, "true or false \u2014 felt blocks", "true or false: felt blocks", DASH),
    (PREF, "\"Look down your conductor column \u2014 what is the same about all of them?\"",
     "\"Look down your conductor column. What is the same about all of them?\"", DASH),
    (PREF, "\"Watch me \u2014 taking a reading\"", "\"Watch me: taking a reading\"", DASH),
    (SD, "when a unit contains a speaking character, voiced claim, misconception, disagreement or "
         "advice-to-a-character move.", "when a unit contains " + SPEECH_LIST + ".", D4),
    (SD_REPAIR, "- a speaking character, voiced claim, misconception, disagreement or advice-to-a-character treatment:",
     "- " + SPEECH_LIST + ":", D4),
    (PLAYBOOK, "Whenever a source unit contains a speaking character, voiced claim, misconception, disagreement or "
               "advice-to-a-character move,", "Whenever a source unit contains " + SPEECH_LIST + ",", D4),
    (DIAL, "how to bounce answers or another discussion-management routine.",
     "how to bounce answers or another discussion-management routine. The discussion itself is not scripted; the "
     "words that open and frame it are.", D12),
    (DIAL, "(\"you're [character] \u2014 what would you say?\")", "(\"you're [character], what would you say?\")", DASH),
    (DB, "Convince them \u2014 60 seconds each.", "Convince them - 60 seconds each.", DASH),
    (DB, "\"Which is the odd one out \u2014 and why?\"", "\"Which is the odd one out, and why?\"", DASH),
    (DB, "\"erosion \u2014 fingers wearing down a fist\"", "\"erosion: fingers wearing down a fist\"", DASH),
    (DB, "\"Give me an example \u2014 not from my slide \u2014 of an invertebrate.\"",
     "\"Give me an example (not from my slide) of an invertebrate.\"", DASH),
    (TASK, "\"your research \u2014 most of the lesson\"", "\"your research: most of the lesson\"", DASH),
    (ES, "(\"here are the seven kinds of influence \u2014 copy them down\")",
     "(\"here are the seven kinds of influence - copy them down\")", DASH),
    (ADAPT, "Keep essential subject vocabulary and proper nouns, supporting them with examples, visuals or "
            "plain-language bridges rather than automatically replacing them.",
     "On a separate Below resource, keep essential subject vocabulary and proper nouns as Written Voice's Below "
     "paragraph says: supported, not automatically replaced.", S6 + " (the adaptation designer's copy points at "
                                                                     "Written Voice's Below paragraph)"),
    (ADAPTIVE, " Keep necessary subject vocabulary and use accessible support around it.", "",
     S6 + " (the plain repeat, two lines above the section's fuller copy, is cut)"),
    (TV, "a comparison prompt §12, a practical lesson §13.", "a comparison or critique prompt §12, a practical lesson §13.",
     S1 + " (the designer's own copy sent a critique prompt to §12 too)"),
    (LD, "The voice: clear simple language a nine-year-old follows easily, short straightforward sentences, concrete "
         "explanations of anything unfamiliar, and a warm direct tone that speaks to the child in front of you.",
     "The voice: as long as the idea needs and conversational, in words the children in this class follow (the "
     "teacher: \"it doesn't have to be short sentences\"), with concrete explanations of anything unfamiliar and a warm "
     "direct tone that speaks to the child in front of you. Ask how you would say this so these children understand "
     "it.", NOTES),
    (PREF, "chosen for the idea rather than a mechanical simplicity rule. Necessary",
     "chosen for the idea rather than a mechanical simplicity rule (in the teacher's words, \"speaker notes are as long "
     "as the idea needs, of course, and they're also conversational\"). Necessary", NOTES),
    (PREF, "in one plain sentence a nine-year-old would follow.", "in one plain sentence a child in this class would "
                                                                   "follow.", D13),
    (PREF, "answering your own question as a nine-year-old who has not met the topic.",
     "answering your own question as a child in this class who has not met the topic.", D13),
    (ADAPT, "the deeper task is still met by a nine-year-old reading it alone.",
     "the deeper task is still met by a child in this class reading it alone.", D13),
    (ADAPT, "(`Is she right about all of it?`)", "(`Is Asha right about all of it?`)",
     "the rest-of-preferences list's settled item 14 (PF-N82, his hand edit that names the child in the question), "
     "carried with decision 13 in the same line, as 7B's plan had it"),
]
EDITS = [(f, norm(old), norm(new), why) for f, old, new, why in EDITS]

# Pins whose words left their file: each moves to where the rule now lives.
N15 = ("Keep essential subject vocabulary and proper nouns when the learning requires them, supporting difficult "
       "necessary words through a clear picture, labelled word bank, pronunciation cue or previously taught meaning "
       "rather than replacing them with vague alternatives.")
MOVES = [
    ((LD, "§5 a vocabulary definition or explanation"), (TV, "a definition or explanation §5"),
     S1 + " (the guide's route names the definition)"),
    ((LD, "Definitions and scripts are the two most often missed, " + TWO),
     (TV, "**Definitions and scripts are the other two**, " + TWO), S1 + " (the reason moved to the guide's route)"),
    ((LD, "§10 success criteria"), (TV, "success criteria §10"), S1 + " (the guide's route names the criteria)"),
    ((ADAPTIVE, "Keep necessary subject vocabulary and use accessible support around it."), (ADAPTIVE, N15),
     S6 + " (the plain repeat is cut; the section's fuller copy, two lines on, holds it)"),
]
MOVES = [((f, norm(old)), (nf, norm(new)), why) for (f, old), (nf, new), why in MOVES]

EDITED = sorted({f for f, *_ in EDITS} | {nf for _o, (nf, _n), _w in MOVES})
raws = {f: (ROOT / f).read_text(encoding="utf-8").replace("\r\n", "\n") for f in EDITED}
now_text = {f: norm(raw) for f, raw in raws.items()}
now_paragraphs = {f: {norm(x) for x in raw.split("\n\n")} for f, raw in raws.items()}
# An edit whose new words begin with its old ones adds a sentence after them;
# its old words rightly stay, so only its new words are checked for it.
for f, old, new, _why in EDITS:
    assert old in new or old not in now_text[f], f"{f} still holds: {old[:80]}"
    assert not new or new in now_text[f], f"{f} lacks: {new[:80]}"
for (f, old), (nf, new), _why in MOVES:
    assert old not in now_text[f], f"{f} still holds: {old[:80]}"
    assert new in now_text[nf], f"{nf} lacks: {new[:80]}"


def home_paragraphs(rel: str, heading: str) -> list[str]:
    """A section's paragraphs as the shared checks read them (to the next
    heading at its level or above, or the file's end)."""
    lines = raws[rel].split("\n")
    start = lines.index(heading)
    level = len(heading.split(" ")[0])
    end = next((i for i in range(start + 1, len(lines))
                if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= level), len(lines))
    return [norm(x) for x in "\n".join(lines[start + 1:end]).split("\n\n") if norm(x) and norm(x) != "---"]


def note_on(row, note):
    if note in row["outcome"]:
        return
    if row["outcome"] == "unchanged in place":
        row["outcome"] = f"unchanged in place until {RELEASE}; then {note}"
    else:
        row["outcome"] += f"; then {note}"


def follow(text: str, rel: str) -> tuple[str, list[str]]:
    whys = []
    for f, old, new, why in EDITS:
        # A pin already carrying the new words (a merged tree) is left alone.
        if f == rel and old in text and not (old in new and new in text):
            text = norm(text.replace(old, new))
            whys.append(why)
    return text, whys


moved = []
files = []
for path in sorted((ROOT / "scripts" / "tests").glob("*_ledger_pins.json")):
    if path.name == "teacher_voice_ledger_pins.json":
        continue
    data = json.loads(path.read_text(encoding="utf-8"))
    changed_here = False
    for row in data["rows"]:
        whys = []
        for i, pin in enumerate(row["present"]):
            if pin["file"] not in EDITED:
                continue
            for (f, old), (nf, new), why in MOVES:
                if pin["file"] == f and pin["text"] == old:
                    row["present"][i] = pin_of(nf, new)
                    whys.append(why)
                    break
            else:
                text, found = follow(pin["text"], pin["file"])
                if text != pin["text"]:
                    assert text, (path.name, row["id"], "a pin whose whole text left")
                    assert text in now_text[pin["file"]], (path.name, row["id"], text[:120])
                    if pin.get("paragraph"):
                        assert text in now_paragraphs[pin["file"]], (path.name, row["id"], "no longer a paragraph")
                    pin["text"] = text
                    whys += found
        if whys:
            note_on(row, f"{RELEASE} changed words inside this pinned text, which follows them: "
                         + "; ".join(dict.fromkeys(whys)))
            moved.append((path.name, row["id"]))
            changed_here = True
    # A home on an edited file keeps its own list of paragraphs beside the rows
    # that pin them; it follows the same words, and must then be exactly the
    # section's paragraphs in order.
    for home in data.get("homes", []):
        if home["file"] not in EDITED:
            continue
        paragraphs = [follow(para, home["file"])[0] for para in home["paragraphs"]]
        if paragraphs != home["paragraphs"]:
            assert paragraphs == home_paragraphs(home["file"], home["heading"]), (path.name, home["heading"])
            home["paragraphs"] = paragraphs
            moved.append((path.name, f"home {home['heading']}"))
            changed_here = True
    files.append((path, data, changed_here))

for name, rid in moved:
    print(f"moved {name} {rid}")

# On a clean 4.2.294 tree these are the pins that held the changed words. On the
# tree merged with the routes release its own pins on the same lines follow too,
# and are listed above; a pin file git merged cleanly may already carry this
# release's words, and then must simply hold, as checked below.
EXPECTED = {
    ("assumed_knowledge_ledger_pins.json", r)
    for r in ("AK-B04", "AK-B27", "AK-F01", "AK-G09", "AK-B19", "AK-B20", "AK-G19")
} | {
    ("quick_checks_ledger_pins.json", r)
    for r in ("QC-A18", "QC-B06", "QC-G06", "HOME-QC-PREF-19", "HOME-QC-PREF-21",
              "home ## The Teach → Do → Teach → Do Rhythm")
} | {
    ("teach_then_do_ledger_pins.json", r)
    for r in ("TD-G09", "HOME-TD-PREF-19", "HOME-TD-PREF-21", "home ## The Teach → Do → Teach → Do Rhythm")
} | {
    ("worksheets_ledger_pins.json", "WS-F20"),
} | {
    ("starters_sticky_apply_ledger_pins.json", r)
    for r in ("SA-B18", "SA-J43", "SA-L21", "PF-I06", "PF-V16", "HOME-SA-PREF-STARTERS-14", "home ## Starters")
} | {
    ("success_criteria_ledger_pins.json", "SC-D42"),
    ("teach_then_do_ledger_pins.json", "TD-C19"), ("teach_then_do_ledger_pins.json", "TD-J62"),
} | {
    ("vocabulary_ledger_pins.json", r)
    for r in ("VOC-A02", "VOC-C24", "VOC-P02", "VOC-P03", "DEC-10", "HOME-LD-01", "home ### Vocabulary")
}
for name, rid in sorted(EXPECTED - set(moved)):
    print(f"already following this release's words: {name} {rid}")
unexpected = sorted(set(moved) - EXPECTED)
for name, rid in unexpected:
    print(f"moved beyond the clean tree's list (a merged tree's own pins): {name} {rid}")

# No pin anywhere may still carry an old wording, and every pin on an edited
# file holds now, checked before anything is written.
for path, data, _changed in files:
    for row in data["rows"]:
        for pin in row["present"]:
            if pin["file"] not in EDITED:
                continue
            for f, old, new, _why in EDITS:
                if f == pin["file"] and old.strip():
                    if old in new:
                        assert old not in pin["text"] or new in pin["text"], (path.name, row["id"], old[:80])
                    else:
                        assert old not in pin["text"], (path.name, row["id"], old[:80])
            assert pin["text"] in now_text[pin["file"]], (path.name, row["id"], pin["text"][:100])
            if pin.get("paragraph"):
                assert pin["text"] in now_paragraphs[pin["file"]], (path.name, row["id"], pin["text"][:100])
    for home in data.get("homes", []):
        if home["file"] in EDITED:
            assert home["paragraphs"] == home_paragraphs(home["file"], home["heading"]), (path.name, home["heading"])
for path, data, changed in files:
    if changed:
        path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
print(f"REPIN_OK {len(moved)} pins moved")
