"""Every teacher-voice rule the teacher's ledger recorded is still where it lives.

How the words children read and the teacher says should sound was listed on 23
and 24 September 2026: 470 places in 58 files, the voice guide whole, the
speech-bubble guidance, the speaker notes' register wherever it is written,
every copy of a voice rule in another file, the no-em-dash rule and the voice
harness (plans/2026-09-23-teacher-voice-ledger.md). The teacher answered every
decision on 24 September. The guide's route sends a sentence stem to §7 and
reads §14 once; its "most often missed" names all four kinds with their reasons,
and the lesson designer reads the guide by that route; "before the case" in the
slide rules means before the question about it; the slide designer opens the
speech guidance for anyone who speaks; humour is welcome in every subject, maths
and PSHE included; a class the lesson comes back to gets a lively name; the
discussion is not scripted but its opening words are; the copies that said
"never the reverse" say "normally", as the guide does; two plain repeats of
"keep precise subject vocabulary" fold; the out-of-date lines say what is true;
and his answer on speaker notes ("as long as the idea needs ... talking to
children") is in the guide with five short lines from the science lesson he
pointed to, and in the lesson designer's own notes line, whose reader, like the
three other lines that fixed a nine-year-old, is now the child in this class.
His calibrating examples stay exactly as they are.

`teacher_voice_ledger_pins.json` holds each row's words where they now live,
each changed row's whole paragraph, the voice guide paragraph by paragraph (all
but §10, the success-criteria topic's home), and the retired wordings as gone.
The fix for a failure here is to update the ledger and the pins on purpose, with
the teacher's say-so.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ledger_pin_checks import LEDGER_FOLDERS, ROOT, RUNTIME, flat, make_ledger_tests  # noqa: E402

PINS = Path(__file__).resolve().with_name("teacher_voice_ledger_pins.json")
LEDGER = ROOT.parents[1] / "plans" / "2026-09-23-teacher-voice-ledger.md"
VOICE = ROOT / "references" / "teacher-voice.md"
DESIGNER = ROOT / "agents" / "lesson-designer.md"
PREFERENCES = ROOT / "references" / "preferences.md"
SPEECH = ROOT / "references" / "slide-speech-and-characters.md"
SLIDE_DESIGNER = ROOT / "agents" / "slide-designer.md"
SLIDE_REPAIR = ROOT / "agents" / "slide-designer-focused-repair.md"
PLAYBOOK = ROOT / "references" / "slide-composition-playbook.md"
DIALOGIC = ROOT / "references" / "teaching-sequence-dialogic.md"
ADAPTATION = ROOT / "agents" / "adaptation-designer.md"
ADAPTIVE = ROOT / "references" / "adaptive-adaptation.md"
HARNESS = ROOT / "evals" / "teacher-voice" / "README.md"
RUNNER = ROOT / "evals" / "teacher-voice" / "sweep-runner.md"
LOG = ROOT / "references" / "build-review-log.md"

# The voice list has rows in the voice harness and in the builders' shared text
# code, so its pins may name those two folders too.
EveryTeacherVoiceRowIsStillInItsHome = make_ledger_tests(
    PINS, LEDGER, "VG", 470, folders=LEDGER_FOLDERS + ("evals", "shared"))


def text(path: Path) -> str:
    return flat(path.read_text(encoding="utf-8"))


def paragraphs(path: Path) -> list[str]:
    return [flat(x) for x in path.read_text(encoding="utf-8").replace("\r\n", "\n").split("\n\n") if flat(x)]


def paragraph_holding(path: Path, words: str) -> str:
    found = [p for p in paragraphs(path) if words in p]
    assert len(found) == 1, (path.name, words, len(found))
    return found[0]


def section(path: Path, heading: str) -> str:
    lines = path.read_text(encoding="utf-8").splitlines()
    start = lines.index(heading)
    level = len(heading.split(" ")[0])
    end = next((i for i in range(start + 1, len(lines))
                if lines[i].startswith("#") and len(lines[i].split(" ")[0]) <= level
                and set(lines[i].split(" ")[0]) == {"#"}), len(lines))
    return flat("\n".join(lines[start:end]))


SPEECH_LIST = ("a speaking character, a voiced claim, a misconception, a disagreement, a prediction to judge, an "
               "advice-to-a-character move, or anyone who simply says what they think, gives their reason or asks a "
               "question")


class HisDecisionsAreBuilt(unittest.TestCase):
    def setUp(self) -> None:
        self.voice = text(VOICE)
        self.designer = text(DESIGNER)
        self.preferences = text(PREFERENCES)

    def test_the_route_sends_support_to_7_and_reads_14_once(self) -> None:
        # Decision 1 (his "yes"): nothing sent a writer to §7 or §14.
        route = paragraph_holding(VOICE, "Read the numbered section for the kind of thing you are writing")
        self.assertIn("a sentence stem or other support §7", route)
        self.assertIn("and §14 once, when the kind of lesson is settled", route)
        # Settled item 1's fold keeps the designer's own condition: a critique
        # prompt, as well as a comparison prompt, opens §12.
        self.assertIn("a comparison or critique prompt §12", route)
        # The route's other kinds, and §16H for the first script, are unchanged.
        for kind in ("opens §6**", "a definition or explanation §5", "a model answer §8", "success criteria §10",
                     "a practical lesson §13",
                     "**A speaker-note script opens §16H before the first one you write in a lesson**"):
            self.assertIn(kind, route)

    def test_four_kinds_are_the_most_often_missed_and_the_designer_reads_that_route(self) -> None:
        # Settled item 1: both lists stay as reasons, in the guide's route.
        missed = paragraph_holding(VOICE, "most often missed")
        self.assertIn("**§6 and §12 are two of the four most often missed, and they are missed the same way:**", missed)
        self.assertIn("**Definitions and scripts are the other two**, because a definition feels like a structured "
                      "field being filled and a script feels like notes rather than writing", missed)
        self.assertIn("Routing by the kind of string only works if you stop and name the kind.", missed)
        read_line = paragraph_holding(DESIGNER, "Read `teacher-voice.md` at the same point")
        self.assertIn("by the route its `How to read this file` sets out", read_line)
        self.assertIn("(including `Say what you mean, and give a second question that leads to the first`, because a "
                      "question naming nothing concrete is answered only by the most confident children)", read_line)
        self.assertIn("§4 is routed by moment rather than by kind of string", read_line)
        for gone in ("Definitions and scripts are the two most often missed", "§§1 and 3 a spoken script",
                     "§5 a vocabulary definition or explanation"):
            self.assertNotIn(gone, self.designer)
        # Its line sending the first script to the two full scripts stays.
        self.assertIn("Read `teacher-voice.md` §16H before the first script of a lesson", self.designer)

    def test_before_the_case_means_before_the_question_about_it(self) -> None:
        # Decision 2 (his "yes"): one clause in the slide rules; his own order
        # in the guide's §6 does not change.
        case = paragraph_holding(PREFERENCES, "**A case arrives with the context that makes it make sense.**")
        self.assertIn("One sentence, before the case, in the words the class hears, is usually the whole repair", case)
        self.assertIn("Before the case means before the question about it: when the thing is on the board, the "
                      "sentence about the thing in view comes first and the general one straight after.", case)
        board_first = self.voice.index("> This tooth has lost a piece of enamel. > Sometimes, teeth can be chipped")
        self.assertLess(self.voice.index("The teacher's own order:"), board_first)

    def test_the_speech_guidance_opens_for_anyone_who_speaks(self) -> None:
        # Decision 4 (his "yes"): the three triggers take the guidance's own
        # list, word for word; the first keeps its pinned opening.
        self.assertIn("puts a person in front of the class: " + SPEECH_LIST + ".", text(SPEECH))
        self.assertIn("- `slide-speech-and-characters.md` when a unit contains " + SPEECH_LIST + ".",
                      text(SLIDE_DESIGNER))
        self.assertIn("- " + SPEECH_LIST + ": `slide-speech-and-characters.md`;", text(SLIDE_REPAIR))
        self.assertIn("Whenever a source unit contains " + SPEECH_LIST + ", read `slide-speech-and-characters.md`",
                      text(PLAYBOOK))
        for path in (SLIDE_DESIGNER, SLIDE_REPAIR, PLAYBOOK):
            self.assertNotIn("voiced claim, misconception, disagreement or advice-to-a-character", text(path))

    def test_humour_is_welcome_in_every_subject(self) -> None:
        # Decisions 9 and 10 turned round: "Humour wherever" and "humour is
        # allowed in pshe". Nothing else in §4 moves.
        optional = section(VOICE, "## When humour is optional")
        self.assertIn("in every subject, maths and PSHE included", optional)
        self.assertIn("\"Humour wherever\"", optional)
        self.assertIn("\"humour is allowed in pshe\"", optional)
        for kept in ("Procedural content often works best without humour:", "- calculation steps;",
                     "never make the actual sensitive issue the joke;", "Priya's bought forty-seven melons. We "
                     "won't ask why.", "None is the right answer then", "opportunity-sensitive, not quota-based"):
            self.assertIn(kept, self.voice)
        for path in RUNTIME:
            with self.subTest(file=path.name):
                self.assertNotIn("never maths", text(path))
        self.assertIn("\"never maths\" no longer stands", text(LOG))

    def test_a_class_the_lesson_comes_back_to_gets_a_lively_name(self) -> None:
        # Decision 11: "Named but not always class 4a 4b etc, jazz it up."
        group = paragraph_holding(DESIGNER, "**A group you invent is named too")
        self.assertIn("Give it a name the first time it appears, and not always a class code like `Class 4B` (`Oak "
                      "Class`, `the class at Hilltop School`, `the Hill Road team`)", group)
        self.assertIn("use that name every time the lesson speaks about it", group)
        self.assertNotIn("plain ordinary name", group)
        invented = paragraph_holding(VOICE, "The same holds for a person or a class the lesson invents.")
        self.assertIn("`A class in Year 3 has a lot of dance lessons each week`", invented)
        self.assertIn("A class the lesson comes back to gets a name the first time, and not always a class code like "
                      "`Class 4B` (`Oak Class`, `the class at Hilltop School`), and keeps it.", invented)

    def test_the_discussion_is_not_scripted_but_its_opening_words_are(self) -> None:
        # Decision 12 (his "yes").
        notes = paragraph_holding(DIALOGIC, "Do not turn the notes into a compulsory script")
        self.assertIn("The discussion itself is not scripted; the words that open and frame it are.", notes)

    def test_the_slide_is_normally_the_tighter_version(self) -> None:
        # Settled item 5: "normally" stays, and the copies say so too.
        self.assertIn("Do not normally reverse this relationship.", self.voice)
        self.assertIn("the slide keeps the tighter version, not normally the reverse", self.designer)
        self.assertIn("the fuller conversational version - not normally the other way round.", self.preferences)
        for path in RUNTIME:
            with self.subTest(file=path.name):
                self.assertNotIn("never the reverse", text(path))

    def test_the_two_plain_repeats_of_keep_the_subject_words_fold(self) -> None:
        # Settled item 6: every other copy keeps its own condition.
        adaptive = text(ADAPTIVE)
        self.assertNotIn("Keep necessary subject vocabulary and use accessible support around it.", adaptive)
        self.assertIn("Keep essential subject vocabulary and proper nouns when the learning requires them", adaptive)
        self.assertIn("On a separate Below resource, keep essential subject vocabulary and proper nouns as Written "
                      "Voice's Below paragraph says: supported, not automatically replaced.", text(ADAPTATION))
        self.assertIn("Keep central subject vocabulary and proper nouns, supporting them with examples, visuals or "
                      "plain-language bridges rather than automatically replacing them.", self.preferences)
        self.assertIn("Necessary taught subject vocabulary stays.", self.preferences)
        self.assertIn("Precise subject vocab when helps.", self.designer)

    def test_the_out_of_date_lines_say_what_is_true(self) -> None:
        # Settled item 8.
        self.assertIn("belongs in a teacher line of its own (a caveat or a safeguarding note in the teacher "
                      "information below the script, a staging line for a model finished live in `On the board:` "
                      "above it)", self.voice)
        avoid = paragraph_holding(VOICE, "Avoid these unless the context clearly justifies them:")
        self.assertNotIn("em dash", avoid)
        self.assertIn("**Never use em dashes and en dashes** in anything a child or parent reads", self.voice)
        self.assertIn("and two full-length scripts in `teacher-voice.md` §16H.", self.preferences)
        self.assertIn("`preferences.md` → Vocabulary is the one place every vocabulary decision is written",
                      self.designer)
        self.assertNotIn("is an empty structure", text(HARNESS))
        self.assertNotIn("the paragraph before it", text(RUNNER))
        # The Maintenance note: out of §17, which the reviewer is shown every
        # review, and into the harness's read-me; the sentence every reader
        # needs stays in the guide.
        self.assertNotIn("## Maintenance", VOICE.read_text(encoding="utf-8"))
        self.assertIn("This is a **runtime voice guide**, not the calibration evidence archive. Treat this guide as "
                      "the default runtime specification.", self.voice)
        harness = text(HARNESS)
        self.assertIn("## Changing the voice guide", HARNESS.read_text(encoding="utf-8"))
        self.assertIn("Do **not** keep expanding it every time one sentence is corrected.", harness)
        self.assertIn("rather than adding them all to the guide.", harness)

    def test_speaker_notes_are_as_long_as_the_idea_needs(self) -> None:
        # His answer on the rest-of-preferences list (decision 3, his 1), with
        # the lesson he pointed to as its calibration, quoted and never copied.
        notes = section(VOICE, "### As long as the idea needs, said to these children")
        self.assertIn("\"speaker notes are as long as the idea needs, of course, and they're also conversational, so it "
                      "links them nicely. It's talking to children. It just needs to think how can I talk to children "
                      "to get them to understand it.\"", notes)
        self.assertIn("ask how you would say this to these children so that they understand it", notes)
        self.assertIn("ran to about a hundred and fifty words", notes)
        for line in ("`So there is a hole in the enamel now. Does the acid stop there? No. It keeps going.`",
                     "`What is it called? The pulp. And what did we say was in the pulp? Nerves.`"):
            self.assertIn(line, notes)
        # A few lines, not the deck: its other notes are not in the guide.
        for elsewhere in ("Hands up if you cleaned your teeth this morning",
                          "If you cut your finger, the skin grows back"):
            self.assertNotIn(elsewhere, self.voice)
        # It sits in §2, which every script's writer reads, and §16H still
        # holds the two full-length scripts the first script is sent to.
        self.assertLess(self.voice.index("# 2. Slides and speaker notes"), self.voice.index("As long as the idea needs"))
        self.assertLess(self.voice.index("As long as the idea needs"), self.voice.index("# 3. Sentence rhythm"))
        self.assertIn("## H. A speaker note, in full", VOICE.read_text(encoding="utf-8"))

    def test_a_phrase_repeated_for_rhythm_is_speech_and_the_warning_names_the_board(self) -> None:
        # His answer of 26 September: "yes thats fine".
        notes = section(VOICE, "### As long as the idea needs, said to these children")
        self.assertIn("**A phrase repeated for rhythm is how speech builds** (the teacher: \"yes thats fine\")", notes)
        self.assertIn("`It eats away a tiny bit of enamel today, a tiny bit more tomorrow, a tiny bit more the day after "
                      "that.`", notes)
        rhythm = section(VOICE, "# 3. Sentence rhythm: avoid the AI sound")
        exception = paragraph_holding(VOICE, "A phrase repeated on purpose for rhythm is the one exception")
        self.assertIn(exception, rhythm)
        self.assertIn("only in speech", exception)
        self.assertIn("On the written board and page, the warning above stands.", exception)
        # The rest of the warning is unchanged and still reaches every string.
        for kept in ("several adjacent sentences with the same basic shape;", "mechanically tidy transitions;",
                     "Do not force variation for its own sake."):
            self.assertIn(kept, rhythm)

    def test_the_designer_writes_notes_as_long_as_the_idea_needs_for_this_class(self) -> None:
        # His speaker-notes answer in the line that writes every script, and the
        # voice list's decision 13, both brought from 7B by the lead so the
        # designer and the guide no longer pull against each other.
        voice_line = paragraph_holding(DESIGNER, "The voice: ")
        self.assertIn("as long as the idea needs and conversational, in words the children in this class follow",
                      voice_line)
        self.assertIn("\"it doesn't have to be short sentences\"", voice_line)
        self.assertIn("Ask how you would say this so these children understand it.", voice_line)
        self.assertNotIn("short straightforward sentences", self.designer)
        self.assertIn("(in the teacher's words, \"speaker notes are as long as the idea needs, of course, and they're "
                      "also conversational\")", self.preferences)
        # The reader is the child in this class, not a fixed age: the plugin is
        # for years one to six.
        self.assertNotIn("nine-year-old", self.designer)
        adaptation = text(ADAPTATION)
        self.assertNotIn("nine-year-old", adaptation)
        self.assertIn("the deeper task is still met by a child in this class reading it alone.", adaptation)
        self.assertIn("(`Is Asha right about all of it?`)", adaptation)
        self.assertIn("in one plain sentence a child in this class would follow.", self.preferences)
        self.assertIn("answering your own question as a child in this class who has not met the topic.",
                      self.preferences)

    def test_nothing_sits_between_the_title_and_the_purpose(self) -> None:
        # The homes start at `## Purpose`, so a paragraph written under the
        # title would be read first by every writer and held by nothing else.
        lines = VOICE.read_text(encoding="utf-8").splitlines()
        self.assertEqual(lines[0], "# Teacher Voice Guide")
        self.assertEqual([line for line in lines[1:lines.index("## Purpose")] if line.strip()], [])

    def test_the_stories_left_and_his_words_stayed(self) -> None:
        for gone in ("Fireman", "Three reached real children", "(14 September 2026)", "(12 September 2026)",
                     "A Year 4 RE slide printed"):
            self.assertNotIn(gone, self.voice)
        self.assertIn("\"quick, punchy and summarised. It doesn't sound warm. It doesn't sound human\"", self.voice)
        self.assertIn("\"now slides are simple and better, a bit of humour would make me like them more but has to "
                      "be funny\"", self.voice)
        log = text(LOG)
        self.assertIn("`Choose a job.` on an appliances sheet, which a class answered `Fireman`", log)
        self.assertIn("A Year 4 RE slide printed `What do their reasons share?` while its own script said", log)

    def test_his_calibration_examples_stay_exactly(self) -> None:
        # Risk 15 of the plan: two of his examples that another list called
        # stale stay exactly, as the standing rule and the voice list's settled
        # item 7 say.
        self.assertIn("> Why won't this circuit work? Natural stem: > The circuit will not work because...", self.voice)
        self.assertIn("**LO: Write a setting description**", self.voice)
        self.assertIn("> You've made it work. Now break it. > *Not literally!*", self.voice)
        self.assertIn("> The clue is in the name! A **fronted** adverbial has been moved to the front of the sentence.",
                      self.voice)
        self.assertIn("> Thankfully, your teeth have divided up the jobs rather than all applying for the same one.",
                      self.voice)


if __name__ == "__main__":
    unittest.main()
