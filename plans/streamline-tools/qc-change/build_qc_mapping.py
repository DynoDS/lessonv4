"""The quick-checks mapping and pins (4.2.286). Rows whose quotes the change
altered are carried through the same substitutions the change made, or mapped
by hand; `ledger_mapping.build` checks every phrase against the files."""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ledger_mapping import build  # noqa: E402

PREF = "references/preferences.md"
LD = "agents/lesson-designer.md"
REV = "agents/design-reviewer.md"
BEATS = "references/do-beats.md"
TC = "references/task-contrasts.md"
HIST = "references/subject-history.md"
PACKET = "scripts/design-review-packet.py"
FIXTURE = "scripts/tests/fixtures/design-reviewer-behaviour-cases.json"
LOG = "references/build-review-log.md"
LEDGER = Path(__file__).resolve().parents[2] / "2026-09-22-quick-checks-ledger.md"

# The substitutions the change made (q1_text.py and its follow-ons), replayed on
# each row's old quotes so a row's pins follow its words exactly.
SWAPS = [
    ("(the teacher's ruling, 14 September 2026).", "(the teacher's ruling)."),
    ("stay legitimate choices rather than failures to aim higher.", "stay legitimate choices rather than failures to aim higher (`A quick check is a fresh case, not the last slide again`: a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case)."),
    ("including the last short response before main practice.", "including the last short response before main practice (`A quick check is a fresh case, not the last slide again`: a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case)."),
    ("Then read it against what the slide will show. If the line", "Then read it against what the slide will show and against what the class knew walking in. If the line"),
    ("A quick recall check is fine when recall is the claim; do not present it as deeper evidence.", "A quick recall check is fine when recall is the claim; do not present it as deeper evidence (`preferences.md` → `A quick check is a fresh case, not the last slide again`: a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case)."),
    ("A short recall response may secure new knowledge, including in the last Do.", "A short recall response may secure new knowledge, including in the last Do (`preferences.md` → `A quick check is a fresh case, not the last slide again`: a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case)."),
    ("Preserve purposeful repeated practice and useful simple checks;", "Preserve purposeful repeated practice and useful simple checks (`preferences.md` → `A quick check is a fresh case, not the last slide again`: a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case);"),
    ("so a pleasant/unpleasant sort is adequate as a brief orientation and insufficient", "so a pleasant/unpleasant sort is insufficient"),
    ("a quick label-reading check after a new map skill is an honest recall beat, named as one.", "a quick label-reading check after a new map skill is an honest recall beat."),
    ("and the Tudor lesson rebuilt on 14 September 2026 is the calibration", "and the teacher's rebuilt Tudor lesson (`Why did Tudor children work?`) is the calibration"),
    ("say what rules the others out (10.8).", "say what rules the others out (10.8: results children read for themselves, with wrong options a child could believe)."),
    ("A simple unlabelled diagram is provided; pupils add labels", "A simple unlabelled diagram is provided, of a thing the Teach did not label (a different flower, a new stretch of river), a blank copy of the taught one where no other picture of the thing exists (the world map), or the taught one in a later lesson, when it is retrieval; pupils add labels"),
    ("Given a partially-blank diagram, pupils fill in labels", "Given a partially-blank diagram of a thing the Teach did not label, a blank copy of the taught one where no other picture of it exists, or the taught one in a later lesson, pupils fill in labels"),
    ("**Best for:** after a modelled diagram, and as the check that a picture children copied actually means something to them.", "**Best for:** a diagram the class has not had explained (the same process drawn differently, a new cycle), and as the check that a picture children copied actually means something to them."),
    ("Accurate classification may itself be the intended check; do not", "Accurate classification may itself be the intended check (`preferences.md` → `A quick check is a fresh case, not the last slide again`: the cards are cases the Teach did not show); do not"),
    ("A short response can establish new knowledge; select", "A short response can establish new knowledge (`preferences.md` → `A quick check is a fresh case, not the last slide again`: a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case); select"),
    ("Settling the kind is not yet settling the thought: `complete the because` was on this list, a Year 4 RE design picked it after a slide that already stated the because, and the thought a child actually had was where to copy the words from.",
     "Settling the kind is not yet settling the thought: `complete the because` is on this list, and picked after a slide that already stated the because, the thought a child actually has is where to copy the words from."),
    ("puts each Do's expected answer next to the Teach it follows, with how many of the answer's words that Teach already said", "puts the expected answer of the first beat where children use each piece of teaching, in every route (a Do, a Your Turn beside its whole cycle, a Use the learning, a Talk, an enabling input's own instruction), next to the teaching it follows, with how many of the answer's words that teaching already said"),
    ("turn the words into a diagram or the diagram back into words,", "turn the words into a diagram or a diagram the class has not had explained back into words,"),
    (", and a reviewer approved both.", "."),
    (", and the teacher who wrote the lesson could not tell the groups apart.", ", and even the adult who wrote them cannot tell the groups apart."),
    ("words to diagram and back, what can we tell,", "words to diagram and back (a diagram the class has not had explained), what can we tell,"),
    ("Do not reject a deliberately brief recall check when recall is the stated evidence claim.", "Do not reject a brief recall check whose answer is off the board when recall is the evidence it claims; a check that repeats the sentence just said is not that."),
    ("A quick check may establish only that the class caught a new distinction when the design says so; judge", "A quick check may establish only that the class caught a new distinction, on a case the Teach did not show (here a fresh outline); judge"),
    ("Do not demand reasoning, a because sentence or fresh cases from a beat whose stated job is securing the names;", "Do not demand reasoning or a because sentence from a beat whose stated job is securing the names on a fresh outline;"),
    ('a quick label-reading check after a new map skill is an honest recall beat.', 'a quick label-reading check after a new map skill, on a map the lesson has not shown, is an honest check.'),
    ('**Best for:** consolidating a single Teach chunk fast. Lower stakes than Brain Dump.', '**Best for:** choosing what mattered across several chunks, once the teaching is off the board. Lower stakes than Brain Dump.'),
    ('**Best for:** after a content-rich Teach slide; works as the bridge into written response.', '**Best for:** retelling several chunks with the teaching off the board, later in the lesson or the unit; works as the bridge into written response.'),
    ('**Best for:** end of a Teach chunk where there is a single core idea.', '**Best for:** the end of a run of chunks or a lesson, choosing the one idea that mattered most with the teaching off the board.'),
    ('Pupils draw what was just described. *\\"Sketch the water cycle as I described it. 90 seconds. Stick figures fine.\\"*', 'Pupils sketch from memory something taught earlier, with what the sketch must show named. *\\"Sketch the water cycle from memory: the sea, a cloud, the rain and the arrows between them. 90 seconds. Stick figures fine.\\"*'),
    ('**Best for:** end-of-chunk consolidation when content is conceptual.', '**Best for:** consolidating several conceptual chunks from memory, once the teaching is off the board.'),
    ("**Best for:** end of a major Teach chunk; bridge into the lesson's main Practise.", "**Best for:** the end of a run of chunks, with the teaching off the board; bridge into the lesson's main Practise."),
    ('and as the check that a picture children copied actually means something to them.', 'and, in a later lesson, as the check that a picture children copied actually means something to them.'),
    ('Pupils draw what was just described. *"Sketch the water cycle as I described it. 90 seconds. Stick figures fine."*', 'Pupils sketch from memory something taught earlier, with what the sketch must show named. *"Sketch the water cycle from memory: the sea, a cloud, the rain and the arrows between them. 90 seconds. Stick figures fine."*'),
]

AUTO = {
    "QC-D01": "decision 6: the list that sends designers to the diagram formats carries their condition (a diagram the class has not had explained)",
    "QC-E11": "decision 10: the incident (a reviewer approved both) leaves; it is in the log (L2306), and the examples and their reason stay",
    "QC-G06": "decision 10: the incident (the teacher who wrote the lesson) leaves; it is in the log (L1187), and the reason stays",
    "QC-D02": "decision 6: the designer's list of the explanation formats carries the diagram condition",
    "QC-B06": "decision 4: keeps its words (decision 1 listed it word for word) and points home, carrying both halves of the recall line",
    "QC-C01": "decision 4: the permission keeps its words and points to when a quick check or recall is honest",
    "QC-C02": "decision 4: the permission keeps its words and points to when a short response is honest",
    "QC-C03": "decision 4: the permission keeps its words and points to when recall is honest",
    "QC-C04": "decision 4: the permission keeps its words and points to when a short response is honest",
    "QC-C05": "decision 4: the permission keeps its words and points to the fresh case",
    "QC-C08": "decision 4: the reviewer's words kept, with a pointer to when a simple check is honest",
    "QC-B03": "decision 2: the orientation permission goes; the reviewer's first clause and 'insufficient as the main evidence' stay",
    "QC-B02": "decision 1: \"named as one\" goes; the rest of the sentence stays",
    "QC-G27": "decision 10: the teacher's calibration stays, without its date",
    "QC-E03": "decision 8: the home reads the thinking line against what the class knew walking in, as the designer's copy did",
    "QC-E04": "the case stays as a plain example, the incident leaves (the standing ruling on stories); in the log (4.2.123)",
    "QC-F05": "decision 8: the pointer carries the format's two conditions",
    "QC-I06": "decision 3: the format says which picture",
    "QC-I07": "decision 3: the format says which picture",
    "QC-D21": "decision 6: a diagram the class has not had explained; one sentence about the diagram just talked through is a restatement",
    "QC-P01": "decision 9: the reviewer's pointer describes the widened view",
    "QC-P08": "decisions 1 and 4: the sample case no longer teaches the excuse (record only; tests read its id)",
    "QC-P10": "decisions 3 and 4: the sample case no longer teaches the excuse (record only; tests read its id)",
}

# The excuse's wordings, barred everywhere once gone (decisions 1 and 2).
AUTO_ABSENT = {
    "QC-B02": [(TC, "an honest recall beat, named as one"), (TC, "named as one", "local")],
    "QC-E11": [(REV, "and a reviewer approved both")],
    "QC-G06": [(PREF, "the teacher who wrote the lesson could not tell the groups apart")],
    "QC-B03": [(REV, "adequate as a brief orientation"), (REV, "two-minute orientation", "local"), (REV, "named as a check"), (REV, "the design says so", "local")],
    "QC-P08": [(FIXTURE, "Do not reject a deliberately brief recall check when recall is the stated evidence claim.")],
    "QC-P10": [(FIXTURE, "when the design says so; judge what the beat claims")],
}

CHANGED = {
    "QC-A01": ("kept as the one home (decision 8), its date dropped (the standing ruling), with what makes a case fresh (A21), when recall is honest (decision 4) and when saying what a beat is for is honest (decision 1) written beside it",
               [(PREF, "**A quick check is a fresh case, not the last slide again.** A short check straight after teaching is a real Do beat when children apply what was just taught to something the Teach did not show: a new picture to place, a new card to sort, a new example to judge, a new situation to predict (the teacher's ruling)."),
                (PREF, "Choosing, completing or repeating the sentence the slide or the teacher has just said is finding it, not checking it: a child gets it right by remembering where the words were, the teacher learns only who was listening, and calling the beat a check does not change what the child does. That holds for an option bank whose right answer is the Teach's own sentence reworded, and for a wrong option no child this age would believe."),
                (PREF, "What makes a case fresh depends on what it checks: for a procedure, fresh values can be enough when carrying out the procedure is itself the target; for reasoning, inference or explanation, a different name, picture or claim earns freshness only when children must examine or use its relevant features to reach an answer, and reusing the taught conclusion while ignoring the new material is weak evidence. The same conclusion can be valid in two cases when each requires that work; do not force different answers."),
                (PREF, "A fact, a name or a definition may be recalled straight after teaching once the answer is no longer on show, because that makes every child produce it and tells the teacher who has it, and it claims recall, never understanding. A check that an idea, a relationship or a method's decision has landed is a fresh case."),
                (PREF, "The difference is whether the answer is still in front of the child: after the enamel slide, `cover the board: what is the hard outer layer called?` is recall, `which of these says what enamel does?` with the Teach's own sentence as the right option is finding, and `which of these three teeth has lost its enamel?` is the fresh case."),
                (PREF, "Saying what a beat is for is honest when it changes what the beat claims or what is done to the task (a check of unaided work takes its support away, a supported rehearsal says it is not assessing, a reused task says it is consolidation). It never lets a label stand in for the fresh case: after teaching the key on a map of Brazil, the check is reading the key on a map of Kenya, and calling a re-read of the Brazil map a quick check does not make it one.")],
               [(PREF, "(the teacher's ruling, 14 September 2026)")]),
    "QC-A07": ("decision 8: the designer keeps the disagreement case and points to the one home for the fresh case",
               [(LD, "A quick check straight after teaching is a legitimate beat, and not every Do must stretch, when it is a fresh case (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `A quick check is a fresh case, not the last slide again`). Keep it short and save the reasoning for later. What this rule prevents is a reasoning beat, staged as disagreement, doing a checking beat's work while taking a reasoning beat's time.")],
               [(LD, "Picking or finishing the sentence just said is not a check, whatever the beat is named.")]),
    "QC-B01": ("retired by name (decisions 1 and 2): \"named as a check\" and the orientation permission go; what it also said stays (the sort is not the lesson's evidence, and a lesson that leans on it has taught less than it looks); whether this contrast should name a simpler task that is right is a question for the teacher",
               [(TC, "**Where the simpler task is right.** Straight after the lesson teaches that a Tudor child's work gave the family something it needed, a quick match of jobs the slide did not show (`carried water`, `minded the pigs`) to what each gave the family is the right check: it needs that idea and nothing more. The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks.")],
               [(TC, "It is fine there, named as a check"), (TC, "As a two-minute orientation straight after the deal is taught"), (TC, "named as a check"), (TC, "named as a quick check"), (TC, "two-minute orientation", "local"), (TC, "the design says so", "local"), (TC, "A sort still earns its place when its cards are cases the lesson did not show: sorting a different apprentice's deal, once this one is taught, settles the vocabulary of the deal and needs it.")]),
    "QC-B04": ("decision 2: the orientation permission goes; the sort is not evidence, and a lesson that leans on it has taught less than it looks",
               [(HIST, "To `sort what was bad and what was good about being an apprentice` straight after the deal is taught is a sort a child finishes from everyday sense; it is not evidence that children can explain the choice, and a lesson that leans on it has taught less than it looks.")],
               [(HIST, "is still a fair two-minute orientation before the question that matters"), (HIST, "two-minute orientation", "local")]),
    "QC-B05": ("decision 3: a label check straight after teaching uses a new picture, with its two limits; \"the design says so\" and the stale \"recap boundary\" go",
               [(PREF, "Where securing the exact term is the point, the label check straight after the Teach is on a new picture of the same thing: the layers named on a different tooth cut in half, not on the tooth diagram just taught. Where no other picture of the thing exists (the world map), a blank copy of the same one is the check, and in a later lesson the same picture is fine, because by then it is retrieval (`A quick check is a fresh case, not the last slide again`).")],
               [(PREF, "labelling the taught thing is right, and the design says so"), (PREF, "The limit is the recap boundary above:"), (BEATS, "the design says so", "local"), (LD, "the design says so", "local")]),
    "QC-E02": ("the case stays as a plain example, the incident leaves (the standing ruling); the walk words are copied to the log (4.2.286)",
               [(LD, "A beat that asks children to finish `My walk matters because...` under a bubble that already says `being outside helps me feel calm` has, honestly written, the line `Where on the slide is the reason?`, and seeing it written is what makes the repair obvious: take her reason away and ask what could make a walk matter."),
                (LOG, "A Year 4 RE beat asked children to finish `My walk matters because...`")],
               [(LD, "A Year 4 RE beat asked children to finish")]),
    "QC-P03": ("code: the view's instruction line, widened to every route (decision 9)",
               [(PACKET, "\"by remembering the last slide, without using the idea on anything \""),
                (PACKET, "\"new? A quick check is a fresh case (`preferences.md` → `A quick \"")], []),
    "QC-P09": ("decision 2: the sample case no longer calls the sort a fine orientation (record only; tests read its id)",
               [(FIXTURE, "would be a sound task.\"")],
               [(FIXTURE, "and the sort is fine as a named two-minute orientation before the question that matters.")]),
    "QC-P02": ("code: the section keeps its heading and now reads every route, structured answers and the takeaway (decision 9)",
               [(PACKET, "\"## Each Do beside the teaching before it\","),
                (PACKET, "def _beside_pairs(sequence: list[dict]) -> list[tuple[list[dict], dict]]:"),
                (PACKET, "def _beside_expected_answer(unit: dict) -> str:"),
                (PACKET, "takeaway = takeaway.get(\"text\") or sticky.get(takeaway.get(\"ref\") or \"\", \"\")")], []),
}

# Rows whose quotes stand and whose paragraph gained a line: pinned with it.
LIMIT = "**The limit:** not straight after the Teach it gives back, and only where children have been taught to summarise (`evidence-synthesis.md` §4); it earns its place when children choose across several things with the teaching off the board."
SKETCH = "**The limit:** not straight after the Teach it gives back, and only where children have been taught to sketch from memory, with what the sketch must contain named (`evidence-synthesis.md` §4); it earns its place when children choose across several things with the teaching off the board."
GAINED = {
    "QC-D11": ("decision 5: kept, with the one-line limit", [(BEATS, LIMIT)]),
    "QC-D12": ("decision 5: kept, with the one-line limit", [(BEATS, LIMIT)]),
    "QC-D13": ("decision 5: kept, with the one-line limit", [(BEATS, LIMIT)]),
    "QC-D14": ("decision 5: kept, with the one-line limit", [(BEATS, LIMIT)]),
    "QC-D15": ("decision 5: kept, with the one-line limit", [(BEATS, LIMIT)]),
    "QC-D16": ("decision 5: kept, with the one-line limit", [(BEATS, LIMIT)]),
    "QC-D19": ("decision 5: kept, with the one-line sketching limit", [(BEATS, SKETCH)]),
    "QC-D20": ("decision 5: kept, with the one-line sketching limit", [(BEATS, SKETCH)]),
    "QC-H05": ("decision 5: kept, with True or False's limit", [(BEATS, "**The limit:** as True or False (5.3), fine but can be cheap: it earns its place only when the lie is one a child in the class could genuinely believe, never the slide's own sentence twisted, and the reason is written. Prefer a sort, a match or an odd one out when those force the same decision.")]),
    "QC-D22": ("decision 6: kept, with the not-already-explained condition", [(BEATS, "The link is one the Teach did not explain; explaining the arrow the teacher has just talked through is saying it back.")]),
    "QC-D23": ("decision 6: kept, with the not-already-shown condition", [(BEATS, "The explanation is one the class has not already been shown drawn; drawing the diagram just shown is copying it.")]),
    "QC-G01": ("kept; the limit that followed it is B05, rewritten by decision 3", [(PREF, "Where securing the exact term is the point, the label check straight after the Teach is on a new picture of the same thing")]),
    "QC-A21": ("kept in the worksheet guidance, and carried into the one home beside A01, lightly reworded (for a procedure, enough, carrying out) with its must-not kept (decision 8)", [(PREF, "a different name, picture or claim earns freshness only when children must examine or use its relevant features to reach an answer")]),
}

for raw in LEDGER.read_text(encoding="utf-8").splitlines():
    m = re.match(r"^\| (QC-[A-Z]\d{2}) \|", raw)
    if not m:
        continue
    rid = m.group(1)
    path = re.search(r"`((?:agents|references|scripts)/[^`]+)`", re.sub(r"«.+?»", "", raw))
    quotes = re.findall(r"«(.+?)»", raw)
    if path is None:
        continue  # a summary table's row (stories, out of date), not the rule itself
    if rid in AUTO:
        present = []
        for q in quotes:
            for old, new in SWAPS:
                q = q.replace(old, new)
            present.append((path.group(1), q))
        CHANGED[rid] = (AUTO[rid], present, AUTO_ABSENT.get(rid, []))
    elif rid in GAINED:
        outcome, extra = GAINED[rid]
        replayed = []
        for q in quotes:
            for old, new in SWAPS:
                q = q.replace(old, new)
            replayed.append((path.group(1), q))
        CHANGED[rid] = (outcome, replayed + extra, [])

from ledger_mapping import paragraph_of  # noqa: E402

ADDED = [
    ("QC-KEEP-01", "sentences the fresh-case rule leans on, pinned whole (change check gap 1): the map contrast's new map, and the skill route's different criteria for a Your Turn",
     [(TC, paragraph_of(TC, "A new, unlabelled map with a river")),
      ("references/teaching-sequence-skill-based.md", paragraph_of("references/teaching-sequence-skill-based.md", "give the Your Turn a *different* criteria pair"))]),
    ("QC-DEC-09", "decision 9: the reviewer sees every pupil beat beside its teaching; the test that holds it",
     [("scripts/tests/test_every_pupil_beat_is_seen_beside_its_teaching.py", "The reviewer sees every pupil beat beside the teaching it follows.")]),
]

HOMES = [
    (PREF, "## The Teach → Do → Teach → Do Rhythm", "HOME-QC-PREF"),
]

build(
    ledger="2026-09-22-quick-checks-ledger.md",
    prefix="QC",
    changed=CHANGED,
    added=ADDED,
    homes=HOMES,
    pins="scripts/tests/quick_checks_ledger_pins.json",
    mapping="2026-09-23-quick-checks-mapping.md",
    title="Quick checks mapping: where every ledger row went",
    snapshot="4.2.285 (uncommitted, on 3de9c956)",
    intro=[
        "Every row of `2026-09-22-quick-checks-ledger.md`, with what happened to it in",
        "4.2.286. \"Unchanged in place\" rows are word for word where the ledger found",
        "them. Every other row names its new home and the words that now carry it; a",
        "retired phrase is listed as gone. Built and checked by",
        "`streamline-tools/qc-change/build_qc_mapping.py`. The same list is pinned by",
        "`scripts/tests/quick_checks_ledger_pins.json`.",
    ],
)
