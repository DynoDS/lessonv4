"""The voice guide mapping and pins (topic 8, release 5).

Every row of `plans/2026-09-23-teacher-voice-ledger.md` (470) is pinned: a row
whose words still stand is pinned where they now sit; a changed row names the
decision that changed it, the words that now carry it and the words that went,
and its whole paragraph is pinned; words a decision added that no row quoted are
their own rows; and the voice guide is this topic's home, pinned paragraph by
paragraph, section by section (all but §10, which the success-criteria topic
already holds as its home). `ledger_mapping.build` checks every phrase against
the files before anything is written.

The voice ledger has rows in the voice harness (`evals/`) and the builders'
shared text code (`shared/`), which the shared tool's file pattern does not
read, so this builder widens it, and the pin test passes the same two folders.

Rows four earlier releases changed after the ledger's snapshot (4.2.288's
working tree) are mapped to the words those releases left, with the release
named: colours (4.2.292, K15), release 7A (4.2.293, M33), the design reviewer
(4.2.294, O25, O26) and the subject files (4.2.291, M42 to M44, whose files it
removed, so they are held by those files staying gone).

The routes release (topic 8, release 3) merges before this one and rewords a
few rows of this list. On this branch those rows stand as the ledger quotes
them. After the merge the lead reruns this builder once (through
`vg_09_follow_at_merge.py`), and any row the routes release reworded that is not
mapped in `ROUTES` below fails as "changed but not mapped", so none is claimed
silently; then the builder is frozen like every finished topic's.

    python -X utf8 plans/streamline-tools/vg-change/build_vg_mapping.py
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import ledger_mapping  # noqa: E402
from ledger_mapping import Q, REPO, ROOT, build, norm  # noqa: E402

ledger_mapping.P = re.compile(
    r"`((?:agents|references|skills|commands|scripts|builder|evals|shared)/[^`]+)`")
P = ledger_mapping.P

print(f"plugin: {ROOT}")
print(f"plans: {REPO / 'plans'}")

LEDGER = "2026-09-23-teacher-voice-ledger.md"
PINS = "scripts/tests/teacher_voice_ledger_pins.json"
MAPPING = "2026-09-26-teacher-voice-mapping.md"

TV = "references/teacher-voice.md"
LD = "agents/lesson-designer.md"
PREF = "references/preferences.md"
SD = "agents/slide-designer.md"
SD_REPAIR = "agents/slide-designer-focused-repair.md"
PLAYBOOK = "references/slide-composition-playbook.md"
SPEECH = "references/slide-speech-and-characters.md"
DIAL = "references/teaching-sequence-dialogic.md"
CONTENT = "references/teaching-sequence-content-based.md"
TASK = "references/teaching-sequence-task-centred.md"
DB = "references/do-beats.md"
ES = "references/evidence-synthesis.md"
ADAPT = "agents/adaptation-designer.md"
ADAPTIVE = "references/adaptive-adaptation.md"
HARNESS = "evals/teacher-voice/README.md"
RUNNER = "evals/teacher-voice/sweep-runner.md"
REV = "agents/design-reviewer.md"
WALL = "agents/working-wall-designer.md"
LOG = "references/build-review-log.md"
SKILL = "skills/make-subject-file/SKILL.md"
GUIDE = "references/authoring-subject-files.md"
REMOVED_FILES = (SKILL, GUIDE)

# A removed file reads as empty, so its phrases are "gone from it" (the
# subject-files builder's own handling, repeated here for M42 to M44).
_text_of = ledger_mapping.text_of


def text_of(rel: str) -> str:
    if rel in REMOVED_FILES:
        assert not (ROOT / rel).exists(), f"{rel} should have been removed"
        return ""
    return _text_of(rel)


ledger_mapping.text_of = text_of


def ledger_rows():
    rows = {}
    for raw in (REPO / "plans" / LEDGER).read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\| (VG-[A-Z]\d{2}) \|", raw)
        if not m:
            continue
        p = P.search(Q.sub("", raw))
        if p and m.group(1) not in rows:
            rows[m.group(1)] = (p.group(1), Q.findall(raw))
    return rows


ROWS = ledger_rows()
assert len(ROWS) == 470, len(ROWS)


def quotes(rid):
    return ROWS[rid][1]


def keep(rid, *indexes):
    """The row's own quotes that still stand, pinned where they sit."""
    rel, qs = ROWS[rid]
    return [(rel, qs[i]) for i in (indexes or range(len(qs)))]


# --- His words (the ledger's "His answers, 24 September (afternoon)").
ANSWER = "his answer of 24 September (afternoon) on the voice guide's list"
D1 = (f"decision 1 ({ANSWER}, his 1: \"yes\"): writing a sentence stem or other support opens §7, and §14 is read "
      "once, when the kind of lesson is settled")
D2 = (f"decision 2 ({ANSWER}, his 2: \"yes\"): the slide rules say \"before the case\" means before the question about "
      "it, and when the thing is on the board the sentence about it comes first and the general one straight after; "
      "his own order in §6 does not change")
D4 = (f"decision 4 ({ANSWER}, his 3: \"yes\"): the slide designer's three triggers take the speech guidance's own list, "
      "word for word, the first keeping its pinned opening")
D9 = (f"decisions 9 and 10, turned round ({ANSWER}, his 4 and 5: \"Humour wherever, but I still never see it on "
      "slides!\" and \"humour is allowed in pshe\"): humour is welcome in every subject, maths and PSHE included, and "
      "\"never maths\" no longer stands; \"often works best without\" for calculation steps, the sensitive-issue limits "
      "and the melons line stay; why a light line never reaches the board is release 6's, after its diagnosis")
D11 = (f"decision 11 ({ANSWER}, his 6: \"Named but not always class 4a 4b etc, jazz it up\"): a class the lesson comes "
       "back to gets a name the first time, and not always a class code (`Oak Class`, `the class at Hilltop School`, "
       "the examples his read-back used)")
D12 = (f"decision 12 ({ANSWER}, his 7: \"yes\"): the discussion itself is not scripted; the words that open and frame "
       "it are")
S1 = ("settled item 1 (his \"a0h are fine\"): both \"most often missed\" lists stay as reasons, the guide's route names "
      "all four kinds with their reasons, and the lesson designer points at that route instead of keeping a shorter "
      "copy; its line sending the first script to §16H stays")
S5 = ("settled item 5 (his \"a0h are fine\", item d looked at again in the humour diagnosis, whose cause 1 needs it): "
      "\"Do not normally reverse\" stays, and the two copies that said \"never the reverse\" and \"not the other way "
      "round\" come into line with it")
S6 = ("settled item 6 (his \"a0h are fine\"): \"keep precise subject vocabulary\" folds to Written Voice's home, each "
      "copy keeping its own condition; the two plain repeats fold (the adaptation reference's line cut, the adaptation "
      "designer's a pointer keeping its Below resource)")
S8 = "settled item 8 (his \"a0h are fine\"): out-of-date text says what is true now, none of it a change of rule"
MAINT = (f"{S8}: the Maintenance note sat inside §17, which the reviewer is shown every review, so its maintainer "
         "lines moved to the voice harness's read-me, beside how a voice change is measured, and the one sentence every "
         "reader needs stayed in the guide")
STORY = ("the standing story rule (\"Stories leave; reasons stay\"): the incident left for the build log, where the "
         "release copied its sentences first; the reason stays")
DATE = "the standing story rule: his ruling keeps his words and loses its date, which the build log holds"
NOTES = ("his speaker-notes answer on the rest-of-preferences list (24 September, its decision 3, his 1: \"speaker "
         "notes are as long as the idea needs, of course, and they're also conversational, so it links them nicely. "
         "It's talking to children. It just needs to think how can I talk to children to get them to understand it\"), "
         "calibrated on the week 3 science lesson he named (\"that kind of wording and phrasing and whatever might be "
         "something that's good for you to look at\"), quoted in five short lines and never copied whole")

# --- The new words, as they now stand.
A02_NEW = ("This is a **runtime voice guide**, not the calibration evidence archive. Treat this guide as the default "
           "runtime specification. Apply these rules as defaults, but do not let \"voice\" override good teaching, "
           "factual accuracy, age-appropriateness, safeguarding, clarity or the specific purpose of the resource.")
A06_NEW = ("Read §4 once when considering the whole lesson at completion, not for each string, and §14 once, when the "
           "kind of lesson is settled.")
A07_NEW = ("Read the numbered section for the kind of thing you are writing at the moment you write it: **a question or "
           "an instruction a child acts on opens §6**, a definition or explanation §5, a sentence stem or other support "
           "§7, a model answer §8, a worked example §9, success criteria §10, a misconception warning §11, a comparison "
           "or critique prompt §12, a practical lesson §13.")
A10_NEW = ("**§6 and §12 are two of the four most often missed, and they are missed the same way:** the writer does not "
           "notice which kind of thing they are writing, so the section that owns it is never opened. Questions and "
           "instructions are the most common thing anyone here writes, and a comparison prompt arrives disguised as a "
           "heading.")
A12_ANTECEDENT = "Questions and comparison prompts missed this way have reached real children."
TWO_NEW = ("**Definitions and scripts are the other two**, because a definition feels like a structured field being "
           "filled and a script feels like notes rather than writing; both are words a child reads or hears, and both "
           "are where the register slips first.")
A16_NEW = ["The guide (`references/teacher-voice.md`) is the default runtime specification. Do **not** keep expanding "
           "it every time one sentence is corrected.",
           "Only change the guide when real resource work reveals: - a repeated miss; - a genuinely new register; - a "
           "contradiction in the current guidance; - a preference that survives more than one context."]
A17_NEW = ("Keep detailed calibration examples, rejected alternatives and testing history in the teacher's separate "
           "evidence document rather than adding them all to the guide.")
C05_NEW = ("The user met the second on a built deck and called it \"quick, punchy and summarised. It doesn't sound "
           "warm. It doesn't sound human\".")
C13_NEW = ("A Year 4 slide that prints `What do their reasons share?` while its own script says `Tell your partner what is the "
           "same and what is different` is the shape: the plain version is already written, by the same agent, on the "
           "same slide, and the board gets the clever one, where `share` means something different to a nine-year-old "
           "than it does to an adult.")
D15_NEW = ("The user, once the decks had been stripped back to a picture, a landed sentence and a question: \"now "
           "slides are simple and better, a bit of humour would make me like them more but has to be funny\". Both "
           "halves are instructions.")
D19_NEW = ("Ordinary teaching content can include a small light moment if it fits naturally, in every subject, maths "
           "and PSHE included: in the teacher's words, \"Humour wherever\" and \"humour is allowed in pshe\".")
F12_NEW = ("A class the lesson comes back to gets a name the first time, and not always a class code like `Class 4B` "
           "(`Oak Class`, `the class at Hilltop School`), and keeps it.")
J13_NEW = ("**Never use em dashes and en dashes** in anything a child or parent reads: write a comma, brackets, a colon, "
           "a full stop or a spaced hyphen ( - ) instead (the full rule lives in Written Voice).")
J27_NEW = ("Every one of those is real and belongs in a teacher line of its own (a caveat or a safeguarding note in the "
           "teacher information below the script, a staging line for a model finished live in `On the board:` above "
           "it), not in the middle of a sentence the teacher is reading aloud to thirty children.")
SPEECH_LIST = ("a speaking character, a voiced claim, a misconception, a disagreement, a prediction to judge, an "
               "advice-to-a-character move, or anyone who simply says what they think, gives their reason or asks a "
               "question")
K24_NEW = "- `slide-speech-and-characters.md` when a unit contains " + SPEECH_LIST + "."
K25_NEW = "- " + SPEECH_LIST + ": `slide-speech-and-characters.md`;"
K26_NEW = ("Whenever a source unit contains " + SPEECH_LIST + ", read `slide-speech-and-characters.md` before composing "
           "it.")
K29_NEW = ("Give it a name the first time it appears, and not always a class code like `Class 4B` (`Oak Class`, `the "
           "class at Hilltop School`, `the Hill Road team`), and use that name every time the lesson speaks about it,")
L04_NEW = ("§2 settles only WHAT belongs here rather than on the slide (the script carries the fuller conversational "
           "register; the slide keeps the tighter version, not normally the reverse)")
L20_NEW = ("The slide carries the tighter, curated version of the voice and the speaker script carries the fuller "
           "conversational version - not normally the other way round.")
L27_NEW = ("The full voice and its short examples live in the Speaker Notes Voice section of the lesson-designer agent, "
           "and two full-length scripts in `teacher-voice.md` §16H.")
L27_FIRST = ("Speaker notes have the same fixed script-first shape, but the script follows **Written Voice (House "
             "Style)**: natural, speakable, direct and clear, with sentence length and vocabulary chosen for the idea "
             "rather than a mechanical simplicity rule (in the teacher's words, \"speaker notes are as long as the idea "
             "needs, of course, and they're also conversational\").")
L05_NEW = ("The voice: as long as the idea needs and conversational, in words the children in this class follow (the "
           "teacher: \"it doesn't have to be short sentences\"), with concrete explanations of anything unfamiliar and a "
           "warm direct tone that speaks to the child in front of you. Ask how you would say this so these children "
           "understand it.")
M21_NEW = ("**Depth raises the thinking, never the register.** Greater Depth wording stays in the same child speech as "
           "every other sheet (Written Voice, full strength): the deeper task is still met by a child in this class "
           "reading it alone.")
O58_NEW = "Say the difference between the two groups in one plain sentence a child in this class would follow."
L222_NEW = "Test it by answering your own question as a child in this class who has not met the topic."
NOTES_B1 = ("his speaker-notes answer on the rest-of-preferences list (its decision 3, his 1: \"for the speaker notes it "
            "doesn't have to be short sentences. Um speaker notes are as long as the idea needs, of course, and they're "
            "also conversational\"), planned for 7B (its B1) and brought into this release by the lead after its first "
            "check, so the designer and the guide no longer pull against each other")
D13 = ("the voice list's decision 13, answered through the rest-of-preferences list (\"I actually don't know why it says "
       "nine-year-old. Um, because the plugin is for years one, two, three, four, five, and six, right?\"): the reader is "
       "a child in this class; planned for 7B (its B1) and brought into this release by the lead")
L46_NEW = "The discussion itself is not scripted; the words that open and frame it are."
M05_NEW = ("- Read `teacher-voice.md` at the same point, by the route its `How to read this file` sets out: its core "
           "sections, then the numbered section for the kind of thing being written, at the moment you write it, among "
           "them §6 a question or an instruction a child acts on (including `Say what you mean, and give a second "
           "question that leads to the first`, because a question naming nothing concrete is answered only by the most "
           "confident children). §4 is routed by moment rather than by kind of string, because a playful opportunity is "
           "a property of the lesson's material and not of any sentence: read it once at the completion pass, not "
           "while authoring.")
M11_NEW = ("Open `teacher-voice.md` §5 with it. `preferences.md` → Vocabulary is the one place every vocabulary "
           "decision is written:")
N12_NEW = ("On a separate Below resource, keep essential subject vocabulary and proper nouns as Written Voice's Below "
           "paragraph says: supported, not automatically replaced.")
N15 = ("Keep essential subject vocabulary and proper nouns when the learning requires them, supporting difficult "
       "necessary words through a clear picture, labelled word bank, pronunciation cue or previously taught meaning "
       "rather than replacing them with vague alternatives.")
N05 = ("Keep central subject vocabulary and proper nouns, supporting them with examples, visuals or plain-language "
       "bridges rather than automatically replacing them.")
Q02_NEW = ("- `held-out-input.json` carries the strings of the next fresh lessons, waiting for labels (now the 112 of the "
           "Week 4 History and Science lessons). There is no held-out gold file: a human labels those cases separately, "
           "and a set stops being held out the moment it is used to tune anything.")
Q13_NEW = ("and the paragraph in its opening section, `Material-defect boundary`, that begins `A child-facing or spoken "
           "string in the wrong register is not polish.`")

# The stories as the release copied them into the log (`vg_01_stories_first.py`).
A11_LOGGED = ("Three reached real children. `Choose a job.` on an appliances sheet, which a class answered `Fireman`, "
              "and `Write one question you would ask before making a stronger judgement.` on a Greater Depth diet sheet")
C13_LOGGED = ("A Year 4 RE slide printed `What do their reasons share?` while its own script said `Tell your partner what "
              "is the same and what is different`. The plain version was already written, by the same agent, on the "
              "same slide.")

EARLIER = "changed by an earlier release after this list's snapshot, mapped to the words it left:"
CHANGED = {
    # Decision 1 and settled item 1, the reading route.
    "VG-A06": (f"{D1}; §4's own line is unchanged", [(TV, A06_NEW)], []),
    "VG-A07": (f"{D1}; the rest of the route is unchanged", [(TV, A07_NEW)], []),
    "VG-A10": (f"{S1}: \"the two most often missed\" is now \"two of the four\", and the other two, definitions and "
               "scripts, follow with the lesson designer's reason for them, moved here nearly word for word",
               [(TV, A10_NEW), (TV, TWO_NEW)],
               [(TV, "**§6 and §12 are the two most often missed")]),
    "VG-A11": (f"story retired to the build log: {STORY}; A12's reason stays",
               [(LOG, A11_LOGGED)],
               [(TV, "Three reached real children.")]),
    "VG-A12": (f"unchanged word for word; its antecedent, the three prompts, left for the build log ({STORY}), so one "
               "plain sentence says what \"Every one\" refers to",
               keep("VG-A12") + [(TV, A12_ANTECEDENT)], []),
    "VG-M05": (f"{S1}: the lesson designer reads the guide by the guide's own route; its §6 pointer with assumed "
               "knowledge's reason, and its §4 line, stay word for word; the shorter copy of the route and its own "
               "\"two most often missed\" leave, the reason moving to the guide (A10); the §16H line for the first "
               "script stays in Speaker Notes Voice (L10)",
               [(LD, M05_NEW), (TV, TWO_NEW), (TV, "a definition or explanation §5")],
               [(LD, "Definitions and scripts are the two most often missed"),
                (LD, "§§1 and 3 a spoken script")]),
    # Decision 2 lands in the slide rules (preferences), not in this list's rows;
    # its row is added below. F03 to F07 (his own order) are unchanged.
    # Decision 4.
    "VG-K24": (D4, [(SD, K24_NEW)],
               [(SD, "a speaking character, voiced claim, misconception, disagreement or advice-to-a-character")]),
    "VG-K25": (D4, [(SD_REPAIR, K25_NEW)],
               [(SD_REPAIR, "a speaking character, voiced claim, misconception, disagreement or "
                            "advice-to-a-character")]),
    "VG-K26": (D4, [(PLAYBOOK, K26_NEW)],
               [(PLAYBOOK, "a speaking character, voiced claim, misconception, disagreement or "
                           "advice-to-a-character")]),
    # Decisions 9 and 10.
    "VG-D19": (D9, [(TV, D19_NEW)], []),
    "VG-D25": (f"{D9}; his ruling of 12 September stays in the build log as its history, and this release's entry says "
               "it no longer stands", keep("VG-D25") + [(TV, D19_NEW)], []),
    # Decision 11.
    "VG-F12": (f"{D11}; the examples stay", keep("VG-F12") + [(TV, F12_NEW)], []),
    "VG-K29": (f"{D11}; the rule and its limits are unchanged, and \"plain ordinary name\" goes with his \"jazz it up\"",
               keep("VG-K29") + [(LD, K29_NEW)],
               [(LD, "Give it a plain ordinary name the first time it appears")]),
    # Decision 12.
    "VG-L46": (f"{D12}; both of the row's sentences are unchanged, and the program's script on a combined "
               "stimulus-and-talk unit (Q27) agrees", keep("VG-L46") + [(DIAL, L46_NEW)], []),
    # Settled item 5.
    "VG-L04": (S5, [(LD, L04_NEW)], [(LD, "never the reverse")]),
    "VG-L20": (S5, [(PREF, L20_NEW), (PREF, quotes("VG-L20")[1])], [(PREF, "conversational version - not the other way "
                                                                            "round")]),
    # Settled item 6.
    "VG-N12": (S6, [(ADAPT, N12_NEW), (PREF, N05)],
               [(ADAPT, "supporting them with examples, visuals or plain-language bridges rather than automatically "
                        "replacing them", "local")]),
    "VG-N14": (f"{S6}: the plain repeat of N15, two lines above it in the same section, is cut; N15 holds it",
               [(ADAPTIVE, N15)],
               [(ADAPTIVE, "Keep necessary subject vocabulary and use accessible support around it.")]),
    # Settled item 8, out of date.
    "VG-A02": (f"{MAINT} (A16's first sentence, here beside what the guide is); the row's own words are unchanged",
               [(TV, A02_NEW)], []),
    "VG-A16": (MAINT, [(TV, "Treat this guide as the default runtime specification.")]
               + [(HARNESS, x) for x in A16_NEW],
               [(TV, "## Maintenance"),
                (TV, "Do **not** keep expanding it every time one sentence is corrected.")]),
    "VG-A17": (MAINT, [(HARNESS, A17_NEW)],
               [(TV, "Keep detailed calibration examples, rejected alternatives and testing history")]),
    "VG-J13": (f"{S8}: the em dash leaves the list headed \"Avoid these unless the context clearly justifies them\" for a "
               "line of its own that says never, as Written Voice and the program already do; its alternatives and its "
               "pointer are unchanged", [(TV, J13_NEW)],
               [(TV, "- em dashes and en dashes in anything a child or parent reads")]),
    "VG-J27": (f"{S8}: \"the teacher line above\" was wrong for a caveat or a safeguarding note, whose teacher line prints "
               "below the script, and right for a staging line on a model finished live, which prints above it as `On "
               "the board:`; the sentence names both",
               [(TV, "What is **not** in them, and this is the part that goes wrong: no staging instruction (`begin "
                     "with the photograph, then replace it`), no protective caveat (`these are imagined children, not "
                     "the people in the photo`), no safeguarding note."), (TV, J27_NEW)],
               [(TV, "belongs in the teacher line above")]),
    "VG-L27": (f"{S8}: the hand-off names where the full-length scripts are (§16H); and {NOTES_B1}: its first sentence "
               "gains his words beside \"chosen for the idea rather than a mechanical simplicity rule\"; its second "
               "sentence is unchanged", keep("VG-L27", 1) + [(PREF, L27_FIRST), (PREF, L27_NEW)],
               [(PREF, "The full voice and worked examples live")]),
    # His speaker-notes answer and decision 13, brought from 7B by the lead.
    "VG-L05": (f"{NOTES_B1}; and {D13}. The row's other sentences are unchanged, and the designer's line no longer pulls "
               "against the guide's \"Neither phase has a sentence-length target\" (A14) or the hand-off (L27)",
               [(LD, L05_NEW), (LD, quotes("VG-L05")[1])],
               [(LD, "short straightforward sentences"), (LD, "a nine-year-old follows easily")]),
    "VG-M21": (f"{D13}; the rest of the paragraph is unchanged but for his named child (the rest-of-preferences list's "
               "PF-N82, `Is Asha right about all of it?`, fixed in the same edit as 7B's plan had it)",
               [(ADAPT, M21_NEW), (ADAPT, "(`Is Asha right about all of it?`)")],
               [(ADAPT, "met by a nine-year-old reading it alone"), (ADAPT, "(`Is she right about all of it?`)")]),
    "VG-O58": (f"{D13}; the rest of the row is unchanged", [(PREF, O58_NEW), (PREF, quotes("VG-O58")[1])],
               [(PREF, "one plain sentence a nine-year-old would follow")]),
    "VG-M11": (f"{S8}: \"That section\" read as the voice guide's §5, which holds none of the vocabulary decisions it "
               "lists; it now names the section it means", [(LD, M11_NEW)],
               [(LD, "That section is the one place")]),
    "VG-Q02": (f"{S8}: the held-out file is no longer empty", [(HARNESS, Q02_NEW)],
               [(HARNESS, "is an empty structure")]),
    "VG-Q13": (f"{S8}: the reviewer's register paragraph is not the one before the sweep; it sits in the reviewer's "
               "opening section. The two openings the runner reads are unchanged, and the reviewer's pins hold them",
               [(RUNNER, Q13_NEW), (REV, "**Then sweep the voice, string by string.**"),
                (REV, "A child-facing or spoken string in the wrong register is not polish.")],
               [(RUNNER, "and the paragraph before it that begins")]),
    # Stories.
    "VG-C05": (DATE + " (14 September 2026, at 4.2.200)", [(TV, C05_NEW)],
               [(TV, "It doesn't sound human\" (14 September 2026)", "local")]),
    "VG-C13": (f"{STORY}: one plain telling stays as the example, as the plan asked", [(TV, C13_NEW), (LOG, C13_LOGGED)],
               [(TV, "A Year 4 RE slide printed `What do their reasons share?`")]),
    "VG-D15": (DATE + " (12 September 2026, at 4.2.152)", [(TV, D15_NEW)],
               [(TV, "but has to be funny\" (12 September 2026)", "local")]),
    # Rows earlier releases changed after this ledger's snapshot.
    "VG-K15": (f"{EARLIER} the colours release (4.2.292): the task line outside the bubble is in question blue as the "
               "child's short task", [(SPEECH, "- The judging question (`Is Dev right? Explain.`) is the pupils' task, "
                                               "not Dev's speech. It becomes the slide's open title (`Is Dev right?`) "
                                               "and, where wording remains (`Explain.` / `Explain how you know.`), a "
                                               "separate task line outside the bubble, in question blue as the child's "
                                               "short task (`colorRole: \"task-blue\"`).")] + keep("VG-K15", 0), []),
    "VG-M33": (f"{EARLIER} release 7A (4.2.293): the wall designer also reads the rest of Written Voice when it shortens "
               "a lesson sentence", [(WALL, "From Written Voice, read now only the paragraph beginning `Three habits "
                                            "keep any printed child-facing wording plain` - it governs every printed "
                                            "word on a card, including what you choose to copy onto one, so a planning "
                                            "name never reaches the wall. Read the rest of Written Voice only when you "
                                            "author a permitted new child-facing line, shorten a lesson sentence, or "
                                            "must report that settled wording is unsuitable; your cards are copied "
                                            "verbatim on most runs. When that trigger fires, read the core sections of "
                                            "`[PLUGIN_ROOT]/references/teacher-voice.md` with it - how a new line "
                                            "sounds is calibrated there.")], []),
    "VG-O25": (f"{EARLIER} the design reviewer release (4.2.294, its RV-D06): \"today the teacher edits it out by hand\" "
               "is now \"the teacher would have to edit it out by hand\"",
               [(REV, "A child-facing or spoken string in the wrong register is not polish. Every authored string ships "
                      "verbatim - no downstream agent is permitted to reword it -"),
                (REV, "so a script in curriculum-writer English or a model answer with machine rhythm reaches the "
                      "class exactly as written, and the teacher would have to edit it out by hand."),
                (REV, "Repair it in the voice sweep as a bounded correction; do not report it as a finding or leave it "
                      "as acceptable variation.")], []),
    "VG-O26": (f"{EARLIER} the design reviewer release (4.2.294, its RV-G09, the lead's reading of his words): the "
               "reader the sweep imagines is the actual child in this class",
               [(REV, "Read each one first as the child: the actual child in this class, who has not read the plan, "
                      "and then as the teacher saying it."), (REV, quotes("VG-O26")[1])], []),
}
REMOVED = ("retired: removed with its file by the subject-files release (4.2.291), his decisions 1 and 3 on that list "
           "(24 September): \"forget about 'writing a new subject file' guidance. it should just knowe the files it "
           "has, nothing around what could be added in future.\" and \"just remove it completely\"")
for rid in ("VG-M42", "VG-M43", "VG-M44"):
    rel, qs = ROWS[rid]
    assert rel in REMOVED_FILES
    CHANGED[rid] = (REMOVED, [], [(rel, q, "local") for q in qs])

# --- The routes release's rows, mapped to its words only on the merged tree.
# Each entry is (a phrase only the routes release's tree holds, outcome,
# present, absent), taken from that release's branch as it stood on 26
# September (its own ledger note names two of them; the first check found the
# third, O41, and its words are the release's final ones, as main's working
# tree held them when it merged). Any other row it rewords fails the build as
# "changed but not mapped".
ROUTES_RELEASE = "changed by the routes release (topic 8, release 3), merged before this one:"
ROUTES = {
    "VG-L16": ("with the route on the board in whole sentences and said more fully in the script",
               f"{ROUTES_RELEASE} its settled item 7i, the designer's form check keeps the route on the board in whole "
               "sentences, said more fully in the script, as his ruling that the board carries the teaching asks",
               [(LD, "Re-form here: attach explanation to thing learned (labels, callouts, marked-up example, wrong "
                     "beside right), keep one takeaway as key line, with the route on the board in whole sentences and "
                     "said more fully in the script.")],
               [(LD, "keep one takeaway as key line, full spoken in script")]),
    "VG-M49": ("so is a skill `prepare` unit's `activity` in `explanation` mode",
               f"{ROUTES_RELEASE} its settled item 7e, a skill `prepare` unit's `activity` in `explanation` mode and a "
               "task lesson's `modelledOn` are child-facing too, and the review program's list of child-facing fields "
               "follows",
               [(LD, quotes("VG-M49")[0]),
                (LD, "For starter, observe, apply and reflect units, `activity` is the actual pupil-facing prompt and "
                     "must be written and reviewed as such; so is a skill `prepare` unit's `activity` in `explanation` "
                     "mode, which is the explanation children read on the board, and a task lesson's `modelledOn`, the "
                     "instance its teaching is shown on.")],
               []),
    "VG-O41": ("which is saying the same thing three ways, at the level of slides",
               f"{ROUTES_RELEASE} its decisions 3 and 4 moved the paragraph under `How this teacher explains`, where "
               "\"the same-shape fault above\" pointed outside the section, so it now says what the fault is; his ruling "
               "keeps his words without its date (its RT-E53 and RT-E54); the paragraph's first and last sentences are "
               "unchanged",
               [(CONTENT, quotes("VG-O41")[0]),
                (CONTENT, "A deck whose every correction opens `That doesn't mean` has found one sentence and reused "
                          "it, which is saying the same thing three ways, at the level of slides; the teacher's "
                          "ruling: \"we want variety, and sometimes it's not relevant just stating the "
                          "misconception\"."),
                (CONTENT, quotes("VG-O41")[2])],
               [(CONTENT, "which is the same-shape fault above at the level of slides")]),
}
for rid, (marker, outcome, present, absent) in ROUTES.items():
    if norm(marker) in text_of(present[0][0]):
        CHANGED[rid] = (outcome, present, absent)

# --- Words the decisions added that no row quoted.
PREF_CASE = ("Before the case means before the question about it: when the thing is on the board, the sentence about "
             "the thing in view comes first and the general one straight after.")
NOTES_WORDS = [
    "### As long as the idea needs, said to these children",
    "The teacher on his own speaker notes: \"it doesn't have to be short sentences\", and \"speaker notes are as long "
    "as the idea needs, of course, and they're also conversational, so it links them nicely. It's talking to children. "
    "It just needs to think how can I talk to children to get them to understand it.\" So a script's length, and the "
    "length of its sentences, come from the idea rather than from a target: ask how you would say this to these "
    "children so that they understand it, and write that.",
    "A science lesson he taught and thought went well (how a tooth decays) sounds like this:",
    "`When those germs feed on that sugar, they make something. They make acid.`",
    "`So there is a hole in the enamel now. Does the acid stop there? No. It keeps going.`",
    "`Run your tongue along your teeth, near the gum. That slightly furry feeling? That's the plaque, and that's where "
    "the germs sit.`",
    "`What is it called? The pulp. And what did we say was in the pulp? Nerves.`",
]
DASHES = [
    (PREF, "(\"true or false: felt blocks more sound than foil\")"),
    (PREF, "\"Look down your conductor column. What is the same about all of them?\""),
    (PREF, "(\"Watch me: taking a reading\","),
    (DB, "Convince them - 60 seconds each."),
    (DB, "*\"Which is the odd one out, and why?\"*"),
    (DB, "(*\"erosion: fingers wearing down a fist\"*)"),
    (DB, "*\"Give me an example (not from my slide) of an invertebrate.\"*"),
    (DIAL, "(\"you're [character], what would you say?\")"),
    (TASK, "\"your research: most of the lesson\""),
    (ES, "(\"here are the seven kinds of influence - copy them down\")"),
]
LOG_WORDS = [
    "\"never maths\" no longer stands",
    "Decision 13 (a nine-year-old in four places) and his answer in the lesson designer's own notes line are built "
    "here, brought from release 7B by the lead",
]
ADDED = [
    ("VG-DEC-02-CASE", f"{D2}: the clause, in the slide rules' case-context paragraph (the rest-of-preferences list's "
                       "PF-P01, assumed knowledge's pinned AK-B04); the guide's §6 (F03 to F07) is unchanged",
     [(PREF, PREF_CASE), (PREF, "One sentence, before the case, in the words the class hears, is usually the whole "
                                "repair: teeth chip when we bite something too hard, and when that happens the "
                                "covering comes off in one spot."), (TV, quotes("VG-F05")[1]), (TV, quotes("VG-F05")[2])]),
    ("VG-DEC-NOTES", NOTES, [(TV, x) for x in NOTES_WORDS]),
    ("VG-DEC-RHYTHM", "his answer of 26 September (recorded in this list's \"His week 3 notes, and a phrase repeated for "
                      "rhythm\"): shown the four points taken from his tooth-decay notes and asked whether repeating a "
                      "phrase for rhythm is fine in speaker notes, with the guide's warning against repeated phrases "
                      "staying for what is written on a slide, he said \"yes thats fine\"; the notes part gains the "
                      "phrase as a fifth line, and §3's warning (B06, B10, unchanged) names the written board and page, "
                      "the repeated phrase in speech its one exception",
     [(TV, "- **A phrase repeated for rhythm is how speech builds** (the teacher: \"yes thats fine\"): `It eats away a "
           "tiny bit of enamel today, a tiny bit more tomorrow, a tiny bit more the day after that.` §3's warning "
           "against a repeated shape still holds on the written board and page."),
      (TV, "A phrase repeated on purpose for rhythm is the one exception, and only in speech: in a speaker note it is "
           "how speech builds (`a tiny bit ... a tiny bit more`), and the teacher wants it there (§2). On the written "
           "board and page, the warning above stands.")]),
    ("VG-DEC-DASHES", f"{S8}: a long dash in an example a child could be given, in topic 8's files and in preferences "
                      "(which 7B has not reached), is replaced; those in `templates.md`, the wall files and the "
                      "messages to him are topic 9's", DASHES),
    ("VG-DEC-HARNESS", MAINT, [(HARNESS, "## Changing the voice guide")]),
    ("VG-DEC-13", f"{D13}: the fourth line (preferences' own-question test) has no row in this list, so it is "
                  "pinned here, with the adaptation line's named child", [(PREF, L222_NEW),
                                                                        (ADAPT, "(`Is Asha right about all of it?`)")]),
    ("VG-DEC-LOG", "this release's build-log entry: two of its sentences are pinned, so neither changes unseen: \"never "
                   "maths\" no longer standing, and decision 13 and his notes-voice line built here",
     [(LOG, x) for x in LOG_WORDS]),
]

# The voice guide is this topic's home: every section but §10 (the success
# criteria topic's home), paragraph by paragraph.
HOMES = [(TV, h, t) for h, t in (
    ("## Purpose", "HOME-VG-PURPOSE"),
    ("## How to read this file", "HOME-VG-READ"),
    ("# 1. Core voice", "HOME-VG-01"),
    ("# 2. Slides and speaker notes are different registers", "HOME-VG-02"),
    ("# 3. Sentence rhythm: avoid the AI sound", "HOME-VG-03"),
    ("# 4. Humour and personality", "HOME-VG-04"),
    ("# 5. Explanations and definitions", "HOME-VG-05"),
    ("# 6. Questions and pupil instructions", "HOME-VG-06"),
    ("# 7. Scaffolding", "HOME-VG-07"),
    ("# 8. Model answers and exemplars", "HOME-VG-08"),
    ("# 9. Worked examples", "HOME-VG-09"),
    ("# 11. Misconceptions and \"Watch out!\" language", "HOME-VG-11"),
    ("# 12. Comparison and critique prompts", "HOME-VG-12"),
    ("# 13. Practical / activity-led lessons", "HOME-VG-13"),
    ("# 14. Tone by lesson type", "HOME-VG-14"),
    ("# 15. Things to avoid", "HOME-VG-15"),
    ("# 16. Calibrated examples", "HOME-VG-16"),
    ("# 17. Final pre-flight check", "HOME-VG-17"),
)]

# ledger_mapping's home reader stops at the next heading at the same level and
# does not reach a file's end; §17 is the last section, so it is read to the
# file's end here, as the shared checks read it.
from ledger_mapping import HEADING  # noqa: E402


def home_paragraphs(rel: str, heading: str) -> list[str]:
    lines = (ROOT / rel).read_text(encoding="utf-8").splitlines()
    start = lines.index(heading)
    level = len(heading.split(" ")[0])
    end = next((i for i in range(start + 1, len(lines))
                if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= level), len(lines))
    return [norm(x) for x in "\n".join(lines[start + 1:end]).split("\n\n") if norm(x) and norm(x) != "---"]


ledger_mapping.home_paragraphs = home_paragraphs

build(
    ledger=LEDGER, prefix="VG", changed=CHANGED, added=ADDED, homes=HOMES, pins=PINS, mapping=MAPPING,
    title="The teacher voice guide: where each row went (topic 8, release 5)",
    snapshot="91687471 (4.2.294) with the voice guide release built on its side branch, 26 September 2026",
    intro=[
        "Built by `streamline-tools/vg-change/build_vg_mapping.py` from `2026-09-23-teacher-voice-ledger.md` (470 rows) "
        "and his answers of 24 September, recorded in that ledger and planned in `2026-09-24-topic-8-change-plan.md`, "
        "section 6. Every phrase below was checked against the files before this was written. A row an earlier "
        "release changed is mapped to the words it left, with that release named; a row removed with its file is held "
        "by that file staying gone.",
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

# The shared tool writes in text mode; the repository keeps text at LF on disk.
mapping = REPO / "plans" / MAPPING
mapping.write_text(mapping.read_text(encoding="utf-8"), encoding="utf-8", newline="\n")

# The rows of other topics' lists whose quoted words this release changed (found
# by running the quote check on each list against a clean 4.2.294 copy and
# against this tree, and keeping the new faults). The finished topics' pins
# followed them (`vg_06`), and their ledgers say so (`vg_07`); the two lists not
# yet built, the rest of preferences (7B) and the routes (release 3, on its own
# branch), read their ledgers against the tree first.
LATER_ROWS = [
    ("finished topics, whose pins followed (`vg_06`) and whose ledgers say so (`vg_07`)", [
        ("AK-B04", "decision 2"), ("AK-B19", "decision 13"), ("AK-B20", "decision 13"), ("AK-B27", "a dash"),
        ("AK-G09", "C13"), ("AK-G19", "L05"), ("QC-A18", "a dash"), ("QC-G06", "decision 13"), ("TD-C19", "a dash"),
        ("TD-G09", "decision 13"), ("TD-J62", "a dash"), ("VOC-C24", "M05"), ("VOC-P02", "N12"), ("VOC-P03", "N14"),
        ("SA-B18", "a dash"), ("SC-D42", "M05"), ("WS-F20", "M21"),
    ]),
    ("the rest of preferences (`2026-09-23-preferences-rest-ledger.md`, topic 7's 7B, not built; the notes voice "
     "line and decision 13's lines are no longer 7B's)", [
        ("PF-A31", "A06, A07"), ("PF-B09", "L04"), ("PF-B19", "A02"), ("PF-C04", "L20"), ("PF-C27", "C05"),
        ("PF-C55", "C13"), ("PF-D49", "N12"), ("PF-D50", "N14"), ("PF-D79", "J13"), ("PF-F60", "a dash"),
        ("PF-N29", "K29"), ("PF-O55", "A10, A11"), ("PF-P01", "decision 2"), ("PF-P03", "a dash"), ("PF-U01", "L27"),
        ("PF-U34", "J27"), ("PF-V08", "a dash"), ("PF-V15", "a dash"), ("PF-W24", "D15"), ("PF-U07", "L05"),
        ("PF-C71", "M21"), ("PF-N82", "M21, fixed in the same edit"),
    ]),
    ("the routes (`2026-09-23-routes-ledger.md`, topic 8's release 3, on its own branch)", [
        ("RT-A43", "a dash"), ("RT-F16", "a dash"), ("RT-G07", "a dash"),
    ]),
]
lines = ["", "## Rows of other topics' lists that this release changed", "",
         "Each quotes a line this release changed; the row or item named beside it says how. The reviewer, subject "
         "files, worksheets, colours and playbook lists quote none of the changed lines.", ""]
for where, pairs in LATER_ROWS:
    lines.append(f"- {where}: " + ", ".join(f"{a} ({b})" for a, b in pairs) + ".")
text = mapping.read_text(encoding="utf-8").rstrip("\n") + "\n" + "\n".join(lines) + "\n"
mapping.write_text(text, encoding="utf-8", newline="\n")
print("later rows listed:", sum(len(p) for _w, p in LATER_ROWS))
