"""Build the vocabulary mapping and the pin list from the ledger.

For every ledger row: a row whose quotes are all still in its file is pinned
by those quotes. A row that changed is mapped by hand below to its new home,
the words that now carry it, and the decision that changed it; a retired
phrase is pinned as absent. Every phrase is checked against the files before
anything is written, so the mapping cannot claim a home that does not exist.
"""
import json
import re
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
ROOT = REPO / "plugins" / "lesson-v4"
LEDGER = REPO / "plans" / "2026-09-22-vocabulary-ledger.md"
MAPPING = REPO / "plans" / "2026-09-22-vocabulary-mapping.md"
PINS = ROOT / "scripts" / "tests" / "vocabulary_ledger_pins.json"

PREF = "references/preferences.md"
LD = "agents/lesson-designer.md"

# (row, outcome, [(file, phrase present)], [(file, phrase absent)])
CHANGED = {
    "VOC-A01": ("reworded, decision 4 (\"3–5 ... maximum\" becomes \"Up to five\"; the code limit is unchanged)",
                [(PREF, "Up to five cards or conceptual units, because five is about the most a child absorbs before the vocabulary slide stops being a quick reference and becomes a reading exercise; the validator refuses a sixth. How many is the lesson's decision, and fewer is normal when fewer earn a place.")], []),
    "VOC-A02": ("folded into A01; the designer's section names the limit in its pointer",
                [(LD, "which words earn a card (up to five, each with a job today), how a term the approved objective names is always taught (a card, or one explicit taught line, unless the teacher's sequence defers it)")],
                [(LD, "3–5 cards or conceptual units max.")]),
    "VOC-A03": ("contents line reworded, decision 4",
                [(PREF, "- **Vocabulary** — choosing up to five cards or genuine vocabulary units, definitions written for children, one coherent visual per card or unit.")],
                [(PREF, "choosing 3–5 cards")]),
    "VOC-A04": ("kept, with A05 folded in (a job today, and discussion as a landing); the long dash became a colon",
                [(PREF, "Choose the disciplinary language children think and reason *with*: words they reuse and that deepen their understanding of the subject, the words you would want to hear in their explanations, each with a genuine job in today's explanation, question, discussion or task.")], []),
    "VOC-A05": ("folded into A04 (its job-today and discussion words are carried there)",
                [(PREF, "each with a genuine job in today's explanation, question, discussion or task.")], []),
    "VOC-A07": ("folded into A06, which is unchanged", [(PREF, "An equipment word earns a card when children must understand, distinguish, select, use safely or explain it.")], []),
    "VOC-A08": ("kept; its two sentences now run test first",
                [(PREF, "The test for each candidate is whether knowing the word helps children perform or explain the intended learning."),
                 (PREF, "A unit like *decibel* may be a concept children reason with; a device name may be either learning-critical language or only a label, depending on the task.")], []),
    "VOC-A09": ("moved word for word from the designer's section (decision 10)",
                [(PREF, "**A technical term the approved objective itself names is learning-critical by definition:** children are assessed against an objective they must be able to read and own, so the term gets taught - a card, or one explicit taught line - never left living only in planning metadata."),
                 (PREF, "The exception is a term the teacher's own sequence explicitly defers.")], []),
    "VOC-A10": ("moved word for word with A09", [(PREF, "`To build and draw a series circuit` with no moment saying what *series* means leaves the LO unreadable to the class it belongs to.")], []),
    "VOC-A11": ("rule moved to the one home; the recording stays with the designer",
                [(PREF, "When a plan lists more words than the limit, trim the ones with no job and record each in `trimmedVocabulary` with its reason."),
                 (LD, "A word a supplied plan listed and you trimmed goes in `trimmedVocabulary` with its reason.")], []),
    "VOC-B01": ("kept, with B02's examples and B03's exception beside it",
                [(PREF, "**Two terms share one card only when they genuinely form one simple paired idea** or directly contrasting/symmetrical parts that make more sense together. Being related, being taught together or having an important relationship is not enough."),
                 (PREF, "`evaporation / condensation` normally stays as two separate cards.")], []),
    "VOC-B02": ("folded into B01, carrying its two examples and its no-evading clause",
                [(PREF, "`clockwise / anticlockwise` may share, `hour hand / minute hand` makes one `Clock hands` card and `past / to` one `Direction` card"),
                 (PREF, "Never pair words to fit more under the limit")], []),
    "VOC-B03": ("moved from the designer's section into B01's paragraph", [(PREF, "though a genuine simple pair on one quick conceptual card is how more than five literal words can fit.")], []),
    "VOC-C01": ("kept, with the teacher's words added (decision 2)",
                [(PREF, "Definitions are written for children, not adults, and the shape that gets you there is a sentence a teacher would actually say to the class, with a verb doing the work: conversational, so children understand it, never a dictionary line summarised until it is short."),
                 (PREF, "Write to that shape and the shortness follows; aim at shortness directly and the cheapest way to obey is to compress the meaning into a noun phrase, which is precisely the textbook register a child cannot use.")], []),
    "VOC-C07": ("example rewritten as a sentence a teacher would say (decision 2)",
                [(PREF, "`Friction is the force that slows things down when two surfaces rub together. You can feel it when you rub your hands together.`")],
                [(PREF, "`Friction - a force that slows things")]),
    "VOC-C08": ("kept word for word, beside C10",
                [(PREF, "The card is somewhere children glance back at, not somewhere the lesson teaches from, so keep it uncluttered and never inaccurate."),
                 (PREF, "When a necessary caveat or fuller explanation would make the card too long, that fuller teaching belongs on the Teach slide.")], []),
    "VOC-C09": ("retired by name, decision 13 (out of date)", [], [(PREF, "Add a visual note where it makes the meaning clearer.")]),
    "VOC-C12": ("kept; the round/multiple case stays as a plain example (decision 12)",
                [(PREF, "Read each definition and see which other carded words it contains; those come first, so a card for `round` whose definition says `multiple` sits below the card for `multiple`. It costs nothing, because the cards are a reference rather than a sequence the lesson depends on.")], []),
    "VOC-C13": ("story retired from the runtime (decision 12); in the build log at L661 and L3564; the case survives as C12's example",
                [(PREF, "a card for `round` whose definition says `multiple` sits below the card for `multiple`")],
                [(PREF, "the teacher swapped them by hand (19 September 2026)")]),
    "VOC-C20": ("example rewritten as a sentence, with a picture (decision 2)",
                [("references/output-template.md", "\"definition\": \"Two amounts are equivalent when they are worth the same, even though they look different.\""),
                 ("references/output-template.md", "\"configuration\": \"vocabulary\"\n  }\n}")],
                [("references/output-template.md", "\"definition\": \"Two amounts that are worth the same.\"")]),
    "VOC-C21": ("example rewritten as sentences (decision 2), accurate for evaporation without heating",
                [("references/templates.md", "{ \"word\": \"evaporation\", \"definition\": \"Evaporation is when liquid water slowly turns into a gas called water vapour, like a puddle drying up.\" },")],
                [("references/templates.md", "\"definition\": \"water turning into vapour\"")]),
    "VOC-D01": ("kept; its date dropped (decision 12)",
                [(PREF, "**Every vocabulary card carries one coherent visual.** A word with only a definition beside it is read to the class and explained; a word beside the thing it names is something children can look at, point to and be asked about, and the teacher wants every card to give that chance.")],
                [(PREF, "every card to give that chance (8 September 2026)")]),
    "VOC-D02": ("kept word for word",
                [(PREF, "The visual is whatever honestly shows the word in this lesson's own material: the photograph or diagram the word will be used on (the mouth diagram with the incisors coloured, the pair of rattles for `continuity`), a drawn helper (a place-value column for `placeholder`), or the library drawing of the object itself."),
                 (PREF, "a drawn helper (a place-value column for `placeholder`), or the library drawing of the object itself.")], []),
    "VOC-D03": ("kept; \"or emoji\" added beside \"symbol\" (decision 1)",
                [(PREF, "`A Picture Beside a Word` still decides which: a vague picture is worse than none, so when no single object IS the word, reach for the lesson's own source or helper rather than a symbol or emoji that gestures at the area."),
                 (PREF, "`none` is the rare exception for an idea nothing can honestly show, and the design says so.")], []),
    "VOC-D05": ("kept as a plain example, no longer a report of one deck (decision 12); in the log at L3443",
                [(PREF, "`belief` may honestly have no picture, but a family round a table is a celebration and people singing the same carol every year is a tradition.")], []),
    "VOC-D07": ("folded into D01 to D03", [(PREF, "**Every vocabulary card carries one coherent visual.**")], []),
    "VOC-D08": ("retired by name, decision 13 (out of date)", [], [(LD, "Record visual note alongside definition")]),
    "VOC-D09": ("emoji advice retired, decision 1; \"maths rarely needs photos\" kept",
                [(PREF, "Maths rarely needs a photograph: use the drawn picture the lesson itself works with (the number line, the place-value chart, the angle).")],
                [(LD, "lean on emojis"), (PREF, "lean on emojis")]),
    "VOC-D10": ("kept as the designer's pointer, in its recording list, and in D03",
                [(LD, "`preferences.md` → A Picture Beside a Word is the test for every picture you put beside a word: a vocabulary card, a word bank, a sorting set, a slide list."),
                 (PREF, "`A Picture Beside a Word` still decides which")], []),
    "VOC-D11": ("moved from the designer's section, kept as a check",
                [(PREF, "Each card holds one picture, so two words reaching for the same one (both drawn to 🌍) shows at once in the set, and neither has found its own.")], []),
    "VOC-D12": ("moved from the designer's section to follow D02, with its condition, examples and instruction",
                [(PREF, "In a foundation subject, when the teaching sequence already sources a photograph (a biome landscape, a river's source, a Mayan pyramid), name the same photograph as the card's visual: the child meets it twice and it costs nothing.")], []),
    "VOC-E02": ("kept, with E03's two examples added",
                [(PREF, "Two things decide the moment. A term children need in order to follow an instruction goes in before that instruction (a `series circuit`, a `noun phrase`): they cannot start otherwise, and there is no meaning to show them first. A term whose meaning the material can show goes in after that noticing, so it lands on what children have just seen and the next beat attaches it (`children learning together, continuity; no whiteboard, change`). Most lessons carry some of each.")], []),
    "VOC-E03": ("folded into E02 (its classroom example repeats E02's continuity example)", [(PREF, "(a `series circuit`, a `noun phrase`)")], []),
    "VOC-E04": ("folded into E05, which is unchanged; the designer's section names the check",
                [(PREF, "**A card sits in front of the beat that needs the word.** The next beat uses it"),
                 (LD, "The validator refuses a word introduced twice or not at all, and a word the beat straight after its card does not use")], []),
    "VOC-E06": ("story retired from the runtime (decision 12); copied to the build log",
                [("references/build-review-log.md", "A Year 4 science lesson (18 September 2026) introduced decay, plaque and acid together after the starter")],
                [(LD, "introduced decay, plaque and acid together")]),
    "VOC-E07": ("moved word for word from the designer's section",
                [(PREF, "Where a word feels like it belongs earlier than its first use, the question is usually the other way round: an earlier beat is describing the thing and not saying the word, and the repair is that beat's own wording rather than the card's place.")], []),
    "VOC-E09": ("moved: the Discovery rule sits with E10", [(PREF, "Discovery still introduces formal vocabulary after the exploration.")], []),
    "VOC-E10": ("kept, with E09 beside it",
                [(PREF, "A definition must not hand over what an exploration exists to discover: if the task is for children to notice which things stayed the same, naming that noticing first is telling them the answer, so the word follows the exploration,")], []),
    "VOC-E12": ("kept as a must-not, with E13's words for the moment", [(PREF, "A word must not be introduced after the last moment it was any use: that is not late teaching, it is no teaching.")], []),
    "VOC-E13": ("folded into E01 (the slogan) and E12 (the last moment)", [(PREF, "introduced after the last moment it was any use")], []),
    "VOC-E15": ("kept as a plain example, no longer a report of one deck (decision 12); in the log (4.2.143)",
                [(PREF, "a card defining incisors as the front teeth with thin edges that cut, shown straight after a slide asking what is different about two teeth's biting edges and before anybody has answered, has handed the lesson over.")],
                [(PREF, "a Year 4 teeth deck showed two teeth")]),
    "VOC-E16": ("folded into E14 and E15", [(PREF, "Read each introduction against the beat that follows it, not only against the beat that needs the word.")], []),
    "VOC-E17": ("kept, with E19's prerequisite-and-contrast clause and decision 8",
                [(PREF, "**Group words when they are needed together, and only then.** `past` and `to`, `continuity` and `change`, `series` and `parallel` arrive as a pair because each is only half an idea without the other, while a prerequisite word and a pair of contrast words are two introductions, not one."),
                 (PREF, "When the lesson teaches the members of a set one at a time, each word arrives just before its own part.")], []),
    "VOC-E19": ("folded into E17 and E18", [(PREF, "a prerequisite word and a pair of contrast words are two introductions, not one")], []),
    "VOC-E35": ("moved to where the designer reads it, with decision 6",
                [(PREF, "**A word that needs real teaching gets a Teach beat as well as its card.** When one word needs teaching rather than introducing, that teaching is a Teach beat with its own slide in the sequence, in addition to - never instead of - the word's card, so the class still has the card to glance back at. A smaller word can be explained in one line where it is used, with no card")],
                [("references/slide-composition-playbook.md", "When one word needs teaching rather than introducing")]),
    "VOC-F01": ("kept; its story retired (decision 12), in the log (4.2.140)",
                [(LD, "Each entry carries its own `script`: the teacher stands in front of that slide and reads those cards, so it is written like any other script.")],
                [(LD, "a deck shipped with two vocabulary slides and empty notes on both")]),
    "VOC-F02": ("kept; its story clause retired (decision 12), in the log (4.2.140)",
                [("references/output-template.md", "`script` is the words the teacher says while that slide is up, beginning `Say to children:`, written to the same standard as any other script (`teacher-voice.md` §16H). It is required on every entry, because the slide is a teaching moment and the teacher is standing in front of it."),
                 ("references/output-template.md", "Read each card, and for a word with a visual say what the class is looking at; the boundary decision the Vocabulary preference asks for (`cardboard, opaque or not opaque?`) lives here too.")], []),
    "VOC-F03": ("story retired from the runtime (decision 12), in the log (4.2.140)", [],
                [("references/output-template.md", "a deck shipped with two vocabulary slides and empty notes on both")]),
    "VOC-G01": ("kept, with G03's task clause",
                [(PREF, "point to where it lands: a script that says it aloud, a question whose answer needs it, a task written with it in, a stem that holds it. Where a task is about the thing a word names, write the task with the word in it.")], []),
    "VOC-G03": ("folded into G01 and G02", [(PREF, "Where a task is about the thing a word names, write the task with the word in it.")], []),
    "VOC-G04": ("moved, with decision 5; its story retired (decision 12), in the log (4.2.202)",
                [(PREF, "The beat straight after the card uses the word on its board, in its question or task, and in its script, so children use it rather than only meet its definition; the script alone is not enough, because a word the class only hears has not reached the board.")],
                [(LD, "was carded in a Tudor lesson and never said again")]),
    "VOC-H03": ("kept as a plain example, no longer a report of one slide (decision 12); in the log at L2103",
                [(PREF, "`Balancing and controlled movement practise balance and coordination`, beside `Regular energetic movement helps heart and lung fitness and strengthens muscles and bones`, gives a child who does not hold coordination, fitness or balance nothing from either.")],
                [(PREF, "A Year 4 PSHE slide landed")]),
    "VOC-L07": ("stale clause removed, decision 13", [("agents/design-reviewer.md", "a `script` that has to keep its `Say to children:` opening - and")],
                [("agents/design-reviewer.md", "a definition that has to stay inside its shape")]),
    "VOC-L08": ("stale clause removed, decision 13", [("agents/design-reviewer-focused-repair.md", "a word cap on `lookFor`, the `Say to children:` opening a script keeps.")],
                [("agents/design-reviewer-focused-repair.md", "the shape a definition stays inside")]),
    "VOC-M07": ("reworded, decision 3: the big history words get a card and are then used",
                [("references/subject-history.md", "The finding worth carrying is that a definition alone does not teach these words."),
                 ("references/subject-history.md", "so where the lesson needs one, it gets its card just before it is needed like any other word, and then it is used and applied, never only defined and displayed.")],
                [("references/subject-history.md", "it is used and applied rather than defined and displayed")]),
    "VOC-N13": ("stale count corrected, decision 13", [("references/templates.md", "**Purpose:** Vocabulary reveal. One to five words on light-green cards, each with the compact picture the design chose for it.")],
                [("references/templates.md", "2–5 words on light-green cards")]),
    "VOC-N30": ("example rewritten: a card with no picture is the rare case (decision 2)",
                [("references/templates.md", "- A word the design gives no `visual` (the rare word nothing can honestly show) leaves its picture cell empty.")],
                [("references/templates.md", "no visual needed, cell stays empty")]),
    "VOC-O07": ("reworded, decision 9: the wall keeps the lesson's definition",
                [("agents/working-wall-designer.md", "Free-standing prose that no child is matching word for word — a worked-example modelled sentence, a sticky-knowledge statement, a sentence stem's framing — may be tightened to come inside the card's budget,"),
                 ("agents/working-wall-designer.md", "A vocabulary definition is the lesson's own sentence and keeps the lesson's wording; only when it genuinely cannot fit may it be shortened, and then it stays a whole sentence a teacher would say, never a clipped phrase.")], []),
    "VOC-O16": ("reworded, decision 9",
                [("references/working-wall-preferences.md", "A vocabulary definition keeps the lesson's own wording; only when it genuinely cannot fit may it be shortened, and then it stays a whole sentence a teacher would say, never a clipped phrase.")], []),
    "VOC-Z01": ("moved to Support, Checking and Release (decision 11), its incident and date retired (decision 12); the teacher's own words kept",
                [(PREF, "**A PREFERENCE, not a rule: an answer slide that looks like its question slide with the answer filled in.** A trailing arrow on each practice question (`2,451 → nearest 10 →`) shows the empty space its answer will land in, matching the answers slide that follows. The teacher likes it sometimes, not always: \"I sometimes do like it when the answers appear and it looks really similar to the questions. But this isn't a rule I want you to have all of the time. It's just the preference I have.\" So it is available and never automatic."),
                 (PREF, "It suits a short set of one-value answers where the reveal is the point; it does not suit a question whose answer is a sentence, a method or an explanation, where an arrow into blank space promises something small. Do not add it to every practice set, and do not add a check for it.")],
                [(PREF, "The teacher added a trailing arrow to all six practice questions")]),
    "VOC-E34": ("unchanged; the teacher's ruling keeps his words without its date (decision 12)",
                [("references/teaching-sequence-skill-based.md", "Vocabulary is already free in the same way, since `vocabularyIntroductions` names the unit each word follows."),
                 ("references/teaching-sequence-skill-based.md", "if it thinks seperate key vocab do it")],
                [("references/teaching-sequence-skill-based.md", "The user, 12 September 2026:")]),
    "VOC-O11": ("reworded, decision 9: the wall card's definition field keeps the lesson's words",
                [("references/working-wall-card-contracts.md", "Used by `vocabDefinition` only. The lesson's own child-readable definition, in the lesson's words; shortened only when it genuinely cannot fit, and then still a whole sentence a teacher would say. It may use more than one short sentence when forcing it into one would damage accuracy.")],
                [("references/working-wall-card-contracts.md", "One concise child-readable definition.")]),
    "VOC-Q05": ("stale clause removed, decision 13", [("commands/edit-templates.md", "the pre-render step and row equaliser on the slide side;")],
                [("commands/edit-templates.md", "vocabulary-card gate")]),
}

# Decisions that added words no ledger row held.
ADDED = [
    ("DEC-07", "decision 7: a method's words come before the My Turn",
     [(PREF, "In a skill lesson nothing comes between a My Turn and its Your Turn, so a method's words, like any teaching the cycle needs, come before the My Turn and the teacher models with them."),
      ("references/teaching-sequence-skill-based.md", "and a vocabulary slide is one of them: a method's words come before its My Turn, so the teacher models with them.")]),
    ("DEC-10", "decision 10: the designer's section sends it to the one home",
     [(LD, "That section is the one place every vocabulary decision is written"),
      (LD, "Read it whole before choosing the set, and return to it before writing `vocabularyIntroductions`.")]),
]

Q = re.compile(r"«(.+?)»")
P = re.compile(r"`((?:agents|references|skills|commands|scripts|builder)/[^`]+)`")


def norm(text: str) -> str:
    return " ".join(text.split())


texts: dict[str, str] = {}
HEADING = re.compile(r"^(#{1,6}) ")


def sections_of(rel: str) -> list[tuple[str, int, str]]:
    """(heading line, occurrence, normalised text of its span) for every
    heading outside code fences. A span runs to the next heading at the same
    or a higher level, so it includes its subsections."""
    lines = (ROOT / rel).read_text(encoding="utf-8").splitlines()
    heads = []
    fence = False
    for i, line in enumerate(lines):
        if line.lstrip().startswith("```"):
            fence = not fence
            continue
        m = HEADING.match(line)
        if m and not fence:
            heads.append((i, len(m.group(1)), line.rstrip()))
    out = []
    seen: dict[str, int] = {}
    for n, (i, level, line) in enumerate(heads):
        end = next((j for j, lv, _ in heads[n + 1:] if lv <= level), len(lines))
        occurrence = seen.get(line, 0)
        seen[line] = occurrence + 1
        out.append((line, occurrence, level, norm("\n".join(lines[i:end]))))
    return out


def home_of(rel: str, phrase: str):
    if not rel.endswith(".md"):
        return None
    best = None
    for line, occurrence, level, text in sections_of(rel):
        if norm(phrase) in text and (best is None or level >= best[2]):
            best = (line, occurrence, level)
    if best is None:
        return None
    return {"heading": best[0], "occurrence": best[1], "intro": best[2] == 1}


def paragraph_of(rel: str, phrase: str) -> str | None:
    """The whole paragraph a phrase sits in, flattened."""
    raw = (ROOT / rel).read_text(encoding="utf-8").replace("\r\n", "\n")
    for para in raw.split("\n\n"):
        if norm(phrase) in norm(para):
            return norm(para)
    return None


RUNTIME = [q for folder in ("agents", "references", "skills", "commands")
           for q in (ROOT / folder).rglob("*.md") if q.name != "build-review-log.md"]


def absent_everywhere(phrase: str) -> bool:
    return all(norm(phrase) not in norm(q.read_text(encoding="utf-8")) for q in RUNTIME)


def text_of(rel: str) -> str:
    if rel not in texts:
        texts[rel] = norm((ROOT / rel).read_text(encoding="utf-8"))
    return texts[rel]


rows = []
for raw in LEDGER.read_text(encoding="utf-8").splitlines():
    m = re.match(r"^\| (VOC-[A-Z]\d{2}) \|", raw)
    if not m:
        continue
    rest = Q.sub("", raw)
    p = P.search(rest)
    if not p:
        continue
    rows.append((m.group(1), p.group(1), Q.findall(raw)))

pins = []
problems = []
for rid, rel, quotes in rows:
    if rid in CHANGED:
        outcome, present, absent = CHANGED[rid]
    else:
        outcome, present, absent = "unchanged in place", [(rel, q) for q in quotes], []
    for f, phrase in present:
        if norm(phrase) not in text_of(f):
            problems.append(f"{rid}: not found in {f}: {phrase[:80]}")
    for f, phrase in absent:
        if norm(phrase) in text_of(f):
            problems.append(f"{rid}: still present in {f}: {phrase[:80]}")
    present_pins = [{"file": f, "text": norm(x), "section": home_of(f, x)} for f, x in present]
    if rid in CHANGED:
        for f, x in present:
            para = paragraph_of(f, x) if f.endswith(".md") and not f.endswith("build-review-log.md") else None
            if para and para != norm(x) and all(para != q["text"] for q in present_pins):
                present_pins.append({"file": f, "text": para, "section": home_of(f, x), "paragraph": True})
    pins.append({"id": rid, "outcome": outcome, "present": present_pins,
                 "absent": [{"file": f, "text": norm(x), "everywhere": absent_everywhere(x)} for f, x in absent]})
for rid, outcome, present in ADDED:
    for f, phrase in present:
        if norm(phrase) not in text_of(f):
            problems.append(f"{rid}: not found in {f}: {phrase[:80]}")
    pins.append({"id": rid, "outcome": outcome, "present": [{"file": f, "text": norm(x), "section": home_of(f, x)} for f, x in present], "absent": []})

homes = []
# The vocabulary home itself, paragraph by paragraph: a sentence deleted from
# it fails here even when no ledger row quoted that sentence.
for rel, heading, prefix in ((PREF, "## Vocabulary", "HOME-PREF"), (LD, "### Vocabulary", "HOME-LD")):
    lines = (ROOT / rel).read_text(encoding="utf-8").splitlines()
    start = lines.index(heading)
    level = heading.split(" ")[0]
    end = next(i for i in range(start + 1, len(lines)) if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= len(level))
    paragraphs = [norm(x) for x in "\n".join(lines[start + 1:end]).split("\n\n") if norm(x) and norm(x) != "---"]
    for n, para in enumerate(paragraphs, 1):
        pins.append({"id": f"{prefix}-{n:02d}", "outcome": f"a paragraph of {rel} {heading}, pinned whole",
                     "present": [{"file": rel, "text": para, "section": {"heading": heading, "occurrence": 0, "intro": False}}], "absent": []})
    homes.append({"file": rel, "heading": heading, "paragraphs": paragraphs})

unmapped = [rid for rid, rel, quotes in rows if rid not in CHANGED and any(norm(q) not in text_of(rel) for q in quotes)]
problems += [f"{rid}: changed but not mapped" for rid in unmapped]
if problems:
    print("\n".join(problems))
    raise SystemExit(f"MAPPING_FAILED {len(problems)}")

PINS.write_text(json.dumps({"ledger": "plans/2026-09-22-vocabulary-ledger.md", "snapshot": "4.2.283 ee9c6e2c",
                            "ledgerIds": [rid for rid, _rel, _quotes in rows],
                            "homes": homes,
                            "rows": pins}, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

lines = ["# Vocabulary mapping: where every ledger row went", "",
         "Every row of `2026-09-22-vocabulary-ledger.md`, with what happened to it in the",
         "vocabulary change. \"Unchanged in place\" rows are word for word where the ledger",
         "found them. Every other row names its new home and the words that now carry it;",
         "a retired phrase is listed as gone. Built and checked by `build_mapping.py`: each",
         "phrase below was confirmed present (or absent) in the files before this was written.",
         "The same list is pinned by `scripts/tests/vocabulary_ledger_pins.json`.", "",
         f"{sum(1 for p in pins if p['outcome'] == 'unchanged in place')} rows unchanged in place; "
         f"{len(CHANGED)} rows changed, moved, folded or retired; {len(ADDED)} decisions added new words.", ""]
for p in pins:
    if p["outcome"] == "unchanged in place" or p["id"].startswith("HOME-"):
        continue
    lines.append(f"## {p['id']}")
    lines.append("")
    lines.append(f"**What happened:** {p['outcome']}.")
    for item in p["present"]:
        lines.append(f"- Now in `{item['file']}`: «{item['text']}»")
    for item in p["absent"]:
        lines.append(f"- Gone from `{item['file']}`: «{item['text']}»")
    lines.append("")
lines.append("## Unchanged in place")
lines.append("")
lines.append(", ".join(p["id"] for p in pins if p["outcome"] == "unchanged in place"))
lines.append("")
lines.append("## The vocabulary home, pinned paragraph by paragraph")
lines.append("")
lines.append(f"{sum(1 for p in pins if p['id'].startswith('HOME-PREF'))} paragraphs of `preferences.md` → Vocabulary and "
             f"{sum(1 for p in pins if p['id'].startswith('HOME-LD'))} of `lesson-designer.md` → Vocabulary are pinned whole, "
             "each inside its own section.")
MAPPING.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"MAPPING_OK {len(pins)} pins; {len(CHANGED)} changed rows mapped")
