#!/usr/bin/env python3
"""Each pupil beat beside the teaching before it: one count, read by everyone.

The lesson designer's tool (`do-beats-in-a-row.py`), the design check
(`validate-lesson-design.py`) and the reviewer's view
(`design-review-packet.py`) all ask the same question of a Do beat: how much
of the answer it expects did the teaching just before it already say? Until
6 October 2026 they asked it two different ways (the designer saw shared
three-word runs, the reviewer a share of the answer's words), both called it
"a look, not a verdict", and nothing had to be done about either. A Year 4
science lesson was shown `16 of 17` on a task whose answer was its Teach
board almost word for word, by the designer's tool and then by two reviews,
and reached the teacher.

So the count lives here once. It decides who has to answer, never who fails:
a good task that uses a taught idea on a new case says the idea in the
Teach's own words (an arrow in an airport prayer room `points the way to
Makkah`, 10 of 10), so a high count on its own proves nothing. What a beat
with a high count owes is a declaration, `use`, and the declaration is what
can be wrong:

    "use": {"new": "...", "rehearsal": null}   what this task puts in front of
                                               children that the lesson has not
                                               shown them, in the task's own words
    "use": {"new": null, "rehearsal": "..."}   saying it back is the job here,
                                               and why

Standard library only.
"""
from __future__ import annotations

import re

TEACH_KINDS = {"teach", "teach-why", "teach-needed"}

# The beats where children use what was taught, and the beats that show or
# tell them something first. An enabling input with its own pupil instruction,
# a combined stimulus and talk, and an Our Turn are both: the class uses what
# it met, and what it met is on the board for whatever comes next.
BESIDE_PUPIL_KINDS = {
    "do", "practise", "use-learning", "our-turn", "your-turn", "talk",
    "stimulus-talk", "do-task", "plan-checkpoint",
}
BESIDE_SHOWN_KINDS = TEACH_KINDS | {
    "my-turn", "grounding-input", "stimulus", "make-sense", "observe", "prepare",
}

# The beats that carry a `use` declaration: the Do and quick check of a
# content lesson and the Use the learning of a discovery lesson. The final
# task is left out on purpose: the class is shown a good answer to that very
# question before writing (the teacher's ruling of 1 October 2026), so its
# answer is meant to be near what was shown. A maths Your Turn practises a
# taught method on new numbers and is left out too.
USE_KINDS = {"do", "use-learning"}

# A beat is asked to answer when at least this share of its expected answer's
# words was already said by the teaching just before it. Chosen from a replay
# over 23 saved designs (6 October 2026): at 55 it reaches eight of the nine
# beats a reader judged to hand the teaching back, and the ninth is a making
# task whose written answer describes the object, which no word count can
# see. It also asks about one in three sound beats, which costs each of them
# one true phrase. The number never fails a beat.
ASK_SHARE = 0.55
# An answer of one or two words is a name or a letter; a share of it says
# nothing.
ASK_MIN_WORDS = 4
# A `new` has to bring at least this many words the lesson has not used yet.
NEW_MIN_UNSAID = 2
# What a task brings is said in a phrase. On 6 October 2026 a design pasted
# both of a task's options into `new`; the wrong option's words were new, so
# a task whose right option was its Teach board passed.
NEW_MAX_WORDS = 30
# A wrong answer is something a child says, not `yes` or `no`.
WRONG_MIN_WORDS = 3
# A beat declared `practice` is not one of the lesson's say-it-back beats. The
# teacher, 6 October 2026, asked whether practising a refusal aloud to a
# partner counts: "different because saying it is the point". The edge is what
# is said: words or an action the child will have to say or do in life are
# practice; a fact, a meaning or a rule recited aloud is still rehearsal.
# A reason for rehearsal is a sentence, not a label.
REHEARSAL_MIN_WORDS = 6

_SMALL = {
    "the", "and", "that", "this", "with", "was", "were", "they", "their", "for",
    "not", "but", "can", "could", "had", "has", "have", "its", "into", "from",
    "what", "who", "how", "why",
}
# Words a task is set with, and words that only point. None of them is a new
# thing put in front of a child, so none counts towards a `new`.
_SETTING = _SMALL | {
    "you", "your", "our", "she", "her", "his", "him", "them", "then", "than",
    "when", "where", "which", "there", "here", "these", "those", "are", "is",
    "does", "did", "will", "would", "should", "about", "after", "before",
    "already", "still", "just", "also", "very", "more", "most", "some", "any",
    "all", "each", "every", "one", "two", "three", "new", "same", "other",
    "another", "different", "now", "again", "only", "out", "off", "over",
    "write", "tell", "say", "partner", "choose", "decide", "sort", "explain",
    "think", "look", "find", "use", "case", "condition", "question", "task",
    "example", "situation", "thing", "something", "children", "child", "class",
    "answer", "because",
}


def answer_words(text: str) -> list[str]:
    """The words of an answer worth counting, lightly stemmed."""
    words = [word.strip("'") for word in re.findall(r"[a-z0-9']+", str(text or "").lower())]
    stems = []
    for word in words:
        if not word or len(word) < 3 or word in _SMALL:
            continue
        for suffix in ("ies", "es", "s"):
            if word.endswith(suffix) and len(word) > 4:
                word = word[: -len(suffix)]
                break
        stems.append(word)
    return stems


def flatten(value) -> str:
    """Every string inside a value, in order."""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return " ".join(flatten(item) for item in value)
    if isinstance(value, dict):
        return " ".join(
            flatten(item) for key, item in value.items()
            if key not in {"id", "kind", "photoRef", "ref", "representationRef"}
        )
    return ""


def beside_teaching_text(unit: dict, sticky: dict[str, str], *, own_answer: bool = True) -> str:
    """Everything the class was shown or told on a beat, including a Teach's
    takeaway, which is the line a Do is most likely to say back, and the
    result a discovery lesson made visible."""
    content = unit.get("content") or {}
    takeaway = content.get("takeaway")
    if isinstance(takeaway, dict):
        takeaway = takeaway.get("text") or sticky.get(takeaway.get("ref") or "", "")
    parts = [
        content.get(key)
        for key in (
            "headline", "explanation", "teachingText", "accurateExplanation",
            "enablingInput", "modelledOn", "example", "modelledExemplar", "input",
            "resultOrPattern", "prompt", "question", "materialOnSlide", "activity",
        )
    ]
    parts += [takeaway, " ".join(content.get("keyQuestions") or [])]
    parts.append((unit.get("speakerNotes") or {}).get("script"))
    if own_answer:
        parts.append((unit.get("answer") or {}).get("content"))
    return " ".join(str(part) for part in parts if part)


def beside_expected_answer(unit: dict) -> str:
    """The expected answer in whatever shape the design stored it: prose, a
    structured sort or evidence classification (once printed as `(none
    written)`), or what the teacher listens for in a talk."""
    answer = unit.get("answer") or {}
    if answer.get("content"):
        return " ".join(str(answer["content"]).split())
    structure = answer.get("structure")
    task = unit.get("taskStructure") or {}
    if isinstance(structure, dict) and structure.get("kind") == "sort":
        items = {row["id"]: row.get("label", "") for row in task.get("items") or []}
        groups = {row["id"]: row.get("label", "") for row in task.get("groups") or []}
        return "; ".join(
            f"{items.get(p.get('itemRef'), p.get('itemRef'))} under {groups.get(p.get('groupRef'), p.get('groupRef'))}"
            for p in structure.get("placements") or []
        )
    if isinstance(structure, dict) and structure.get("kind") == "evidence-classification":
        return "; ".join(
            ", ".join(str(value.get("value")) for value in result.get("values") or [])
            for result in structure.get("results") or []
        )
    listens = (unit.get("content") or {}).get("teacherListensFor") or []
    return "; ".join(str(line) for line in listens if line)


def beside_pairs(sequence: list[dict]) -> list[tuple[list[dict], dict]]:
    """Each pupil beat with everything the class met since the last one, in
    every route. Walking back from a pupil beat collects the beats that showed
    or told the class something and stops at the previous pupil beat, with two
    exceptions: a Your Turn looks back through its cycle's Our Turn to the My
    Turn, because the Our Turn's revealed answer is what it could copy; and an
    enabling input with its own instruction, or a combined stimulus and talk,
    is what the next beat saw, so the walk takes it and stops. Such a beat is
    also paired with itself, never counted against its own answer."""
    pairs = []
    for index, unit in enumerate(sequence):
        kind = unit.get("kind")
        self_paired = kind == "teach-needed" and unit.get("pupilInstruction")
        if self_paired:
            pairs.append(([], unit))
            continue
        if kind not in BESIDE_PUPIL_KINDS:
            continue
        shown: list[dict] = []
        for earlier in reversed(sequence[:index]):
            earlier_kind = earlier.get("kind")
            if earlier_kind == "our-turn" and kind == "your-turn":
                shown.append(earlier)
                continue
            if earlier_kind == "my-turn" and kind == "your-turn":
                shown.append(earlier)
                break
            # One exploration can show two findings: every Use the learning
            # is read against the result made visible, not only the first.
            if kind == "use-learning" and earlier_kind in {"use-learning", "teach-why"}:
                if earlier_kind == "teach-why":
                    shown.append(earlier)
                continue
            if earlier_kind in {"teach-needed", "stimulus-talk"}:
                shown.append(earlier)
                if earlier.get("pupilInstruction") or earlier_kind == "stimulus-talk":
                    break
                continue
            if earlier_kind in BESIDE_PUPIL_KINDS or earlier_kind == "explore":
                break
            if earlier_kind in BESIDE_SHOWN_KINDS:
                shown.append(earlier)
        if kind == "stimulus-talk":
            # The activity is its own stimulus: what the class reads on it
            # counts, beside any grounding input before it.
            shown.insert(0, {**unit, "answer": None})
        if shown:
            pairs.append((list(reversed(shown)), unit))
    return pairs


def _sentences(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+", " ".join(str(text or "").split())) if part.strip()]


def closest_taught_sentence(answer: str, taught_text: str) -> str:
    """The one sentence of the teaching that says most of the answer, so the
    two can be read side by side."""
    wanted = set(answer_words(answer))
    best, best_score = "", 0
    for sentence in _sentences(taught_text):
        score = len(wanted & set(answer_words(sentence)))
        if score > best_score:
            best, best_score = sentence, score
    return best


def ask_text(unit: dict) -> str:
    """Everything the task itself puts in front of children."""
    content = unit.get("content") or {}
    seen = [
        unit.get("pupilInstruction"), content.get("task"), content.get("discussionQuestion"),
        content.get("question"), unit.get("taskStructure"),
    ]
    if not any(seen):
        # `activity` is the designer describing the task, not the task: it is
        # read only when nothing children see has been written yet.
        seen = [content.get("activity")]
    return " ".join(flatten(part) for part in seen if part)


_LETTERED = re.compile(r"(?:^|\n)\s*([A-D])\s*[:.)]\s+(.+?)(?=(?:\n\s*[A-D]\s*[:.)]\s)|\Z)", re.S)
_ORDINALS = {"first": 0, "second": 1, "third": 2, "fourth": 3}


def task_options(unit: dict) -> list[str]:
    """The options a task offers: an option bank's items, or lettered blocks
    (`A: ...`, `B: ...`) written into the task itself."""
    structure = unit.get("taskStructure") or {}
    if structure.get("kind") == "option-bank":
        labels = [str(item.get("label") or "") for item in structure.get("items") or []]
        return [label for label in labels if label.strip()]
    content = unit.get("content") or {}
    found = _LETTERED.findall(str(content.get("task") or ""))
    return [" ".join(text.split()) for _letter, text in found] if len(found) >= 2 else []


def right_option(unit: dict, options: list[str]) -> str:
    """The option the answer names as right: by its letter, by `the second`,
    or as the one option whose words the answer repeats. Empty when the
    answer picks several, or none can be told."""
    if not options:
        return ""
    answer = " ".join(str((unit.get("answer") or {}).get("content") or "").split())
    letter = re.match(r"\W*(?:Option\s+|Answer\s+)?([A-D])\b(?!\s+and\b)", answer)
    if letter and ord(letter.group(1)) - ord("A") < len(options):
        return options[ord(letter.group(1)) - ord("A")]
    ordinal = re.match(r"\W*The\s+(first|second|third|fourth)\b", answer, re.I)
    if ordinal and _ORDINALS[ordinal.group(1).lower()] < len(options):
        return options[_ORDINALS[ordinal.group(1).lower()]]
    said = set(answer_words(answer))
    scores = []
    for option in options:
        words = answer_words(option)
        scores.append(sum(1 for word in words if word in said) / len(words) if words else 0.0)
    best = max(scores)
    if best >= 0.8 and sorted(scores)[-2] < 0.8:
        return options[scores.index(best)]
    return ""


def _thing_words(text: str) -> list[str]:
    # A contraction (`she'll`, `it's`) points at something and is never the thing.
    return list(dict.fromkeys(
        word for word in answer_words(text) if word not in _SETTING and "'" not in word
    ))


def _said(word: str, said: set[str]) -> bool:
    """Whether the lesson has used this word already. `small` and `smaller`,
    `chew` and `chewed` are one word to a child, so a shared opening counts."""
    if word in said:
        return True
    if len(word) < 5:
        return False
    stem = word[:5]
    return any(len(other) >= 5 and other[:5] == stem for other in said)


# A closing line that tells children where to look. `Remember` and `Look at`
# also open honest instructions (`Remember your capital letters`), so a line
# found this way is shown to the designer and never refused.
_HINT_LINE = re.compile(
    r"^(think about|remember|hint|clue|look for|look at|use the word|don'?t forget|do not forget)\b",
    re.I,
)
# A word shorter than this is grammar or a name's initial, not a key word.
CLUE_MIN_LETTERS = 4


def stem_text(unit: dict) -> str:
    """What children read before any option or card: the question, the case,
    the passage and the instruction."""
    content = unit.get("content") or {}
    text = " ".join(
        str(part) for part in (
            content.get("task"), content.get("discussionQuestion"), content.get("question"),
            unit.get("pupilInstruction"),
        ) if part
    )
    for option in task_options(unit):
        text = text.replace(option, " ")
    return " ".join(text.split())


def _key_words(text: str) -> list[str]:
    return [word for word in _thing_words(text) if len(word) >= CLUE_MIN_LETTERS]


def page_clues(unit: dict) -> list[tuple[bool, str]]:
    """What on the page could do a child's thinking for them, read with the
    teaching covered. Each finding is (refused, sentence).

    Six rounds of teaching the designer to `read it from the surface` (6 and
    7 October 2026) were read every time and changed little: a source said
    `settlements` three times and so did one option of two, a question ended
    `Think about who still lived in Britain`, three cards went under three
    headings. The designer agreed with the principle and could not see its
    own page. So the page is read here and the finding is put in front of it.

    Nothing here is refused. A replay over 435 saved designs (7 October 2026)
    found the real give-aways (`softer`, `settlements`) and beside them a
    poetry task whose right stanza is meant to pick up a word of the one
    before, so the finding is shown and the designer decides.
    """
    found: list[tuple[bool, str]] = []
    options = task_options(unit)
    stem = stem_text(unit)
    if len(options) >= 2:
        in_stem = set(answer_words(stem))
        right = right_option(unit, options)
        for index, option in enumerate(options):
            others = set(answer_words(" ".join(other for at, other in enumerate(options) if at != index)))
            alone = [
                word for word in _key_words(option)
                if _said(word, in_stem) and not _said(word, others)
            ]
            if not alone:
                continue
            words = ", ".join(f"`{word}`" for word in alone)
            chosen = (
                "This is the option children should choose, so a child who was not listening "
                "can pick it by matching the word"
                if right and option == right else
                "If that is the option children should choose, the word chooses it for them"
            )
            if right and option != right:
                continue
            found.append((False, (
                f"{words} from the question is in only this option: \"{option}\" {chosen}. "
                "Unless picking up that word is the skill being taught, put the same key words "
                "in the wrong options too, used wrongly, or drop that word from the question"
            )))
    structure = unit.get("taskStructure") or {}
    if structure.get("kind") == "sort":
        groups = structure.get("groups") or []
        items = structure.get("items") or []
        placements = ((unit.get("answer") or {}).get("structure") or {}).get("placements") or []
        per_group: dict[str, int] = {}
        for placement in placements:
            per_group[placement.get("groupRef")] = per_group.get(placement.get("groupRef"), 0) + 1
        if items and len(items) <= len(groups) and all(count == 1 for count in per_group.values()):
            found.append((False, (
                f"{len(items)} cards go under {len(groups)} headings, one each, so the last card "
                "is placed by what is left over and not by thinking"
            )))
    sentences = _sentences(stem.replace("\n", ". "))
    hints = [sentence for sentence in sentences[1:] if _HINT_LINE.match(sentence.strip("'\"‘“ "))]
    for hint in hints:
        found.append((False, (
            f"\"{hint}\" tells children where to look. If the answer is what they find there, "
            "the line has answered the question; without it, does the question still stand?"
        )))
    return found


class Beside:
    """One pupil beat read beside the teaching before it."""

    def __init__(self, shown: list[dict], pupil: dict, sticky: dict[str, str], earlier_text: str) -> None:
        self.shown = shown
        self.pupil = pupil
        self.answer = beside_expected_answer(pupil)
        self.answer_words = answer_words(self.answer)
        if shown:
            self.taught_text = " ".join(beside_teaching_text(unit, sticky) for unit in shown)
        else:
            self.taught_text = beside_teaching_text(pupil, sticky, own_answer=False)
        taught = set(answer_words(self.taught_text))
        # On a task with options the child produces a choice, so what is read
        # beside the teaching is the right option's own words. The design's
        # written answer explains the choice and can say many things the Teach
        # did not, while the option a child picks is the Teach board.
        self.options = task_options(pupil) if pupil.get("kind") in USE_KINDS else []
        self.right_option = right_option(pupil, self.options)
        if self.right_option:
            self.answer_words = answer_words(self.right_option)
        self.repeated = sum(1 for word in self.answer_words if word in taught)
        self.total = len(self.answer_words)
        # Everything the class has met in the lesson before this task is set.
        self.earlier_text = earlier_text
        raw = pupil.get("use")
        self.use = raw if isinstance(raw, dict) else None

    @property
    def share(self) -> float:
        return self.repeated / self.total if self.total else 0.0

    @property
    def declares(self) -> bool:
        return self.pupil.get("kind") in USE_KINDS

    @property
    def asked(self) -> bool:
        """Whether this beat has to say what it brings, or that it is rehearsal."""
        return self.declares and self.total >= ASK_MIN_WORDS and self.share >= ASK_SHARE

    @property
    def taught_sentence(self) -> str:
        return closest_taught_sentence(self.right_option or self.answer, self.taught_text)

    @property
    def new(self) -> str | None:
        value = (self.use or {}).get("new")
        return value.strip() if isinstance(value, str) and value.strip() else None

    @property
    def rehearsal(self) -> str | None:
        value = (self.use or {}).get("rehearsal")
        return value.strip() if isinstance(value, str) and value.strip() else None

    @property
    def wrong(self) -> str | None:
        value = (self.use or {}).get("wrong")
        return value.strip() if isinstance(value, str) and value.strip() else None

    @property
    def practice(self) -> str | None:
        value = (self.use or {}).get("practice")
        return value.strip() if isinstance(value, str) and value.strip() else None

    def new_words(self) -> tuple[list[str], list[str], list[str]]:
        """The things a `new` names: those the task does not contain, those
        the lesson had already said, and those that really are new."""
        things = _thing_words(self.new or "")
        in_task = set(answer_words(ask_text(self.pupil)))
        said = set(answer_words(self.earlier_text))
        if self.right_option and self.share >= ASK_SHARE:
            # The right option is the Teach's words, so another option's words
            # do not make the task new: only what the case or question brings.
            stem = ask_text(self.pupil)
            for option in self.options:
                stem = stem.replace(option, " ")
            in_stem = set(answer_words(" ".join(stem.split())))
            said = said | {word for word in in_task if not _said(word, in_stem)}
        missing = [word for word in things if not _said(word, in_task)]
        old = [word for word in things if word not in missing and _said(word, said)]
        fresh = [word for word in things if word not in missing and word not in old]
        return missing, old, fresh

    def fault(self, guide: bool = True) -> str | None:
        """What is wrong with this beat's declaration, or None. `guide` adds
        the two ways to put it right; a report of several says them once."""
        if not self.declares:
            return None
        label = self.pupil.get("label") or self.pupil.get("sourceUnitId")
        count = f"{self.repeated} of the {self.total} words of its expected answer"
        expects = (
            f"The option it expects children to choose: \"{self.right_option}\""
            if self.right_option else f"The answer it expects: \"{self.answer}\""
        )
        if self.right_option:
            count = f"{self.repeated} of the {self.total} words of the option children should choose"
        beside = f"The teaching said: \"{self.taught_sentence}\" {expects}"
        two_ways = (
            "Either make it a use, starting from a real case: something the class could meet "
            "that the lesson did not show, a named child saying what a real child might think, a "
            "new person or object the idea has to sort, or something that really happens and "
            "changes one thing; not an invented `imagine if` (`task-contrasts.md` -> `One story, "
            "one process, one set of meanings` has each as a pair from a real lesson). Keep it "
            "to one ask, and write the new thing in "
            "`use.new` in the task's own words. Or, if saying it back really is this beat's job "
            "(a name or a term to secure, a sentence rehearsed before it is written), write why "
            "in `use.rehearsal`; a lesson holds one of those. Two ways this goes wrong: left as it is, a child gets it right by "
            "remembering the last slide and the teacher learns only who was listening; and a "
            "freshness bought by changing a name, or by needing a law, a process or a fact the "
            "lesson never taught, is not fairer, it is a different fault"
        )
        if not guide:
            two_ways = "Put it right one of the two ways given for the first such beat above"
        if self.use is None:
            if not self.asked:
                return None
            return (
                f"`{label}`: the teaching just before this beat already said {count}, and the beat "
                f"does not say what it brings. {beside}. {two_ways}"
            )
        if self.practice:
            if self.new or self.rehearsal or self.wrong:
                return (
                    f"`{label}`.use gives `practice` beside another answer. A beat where saying or "
                    "doing it is the skill gives `practice` alone: leave the others as null"
                )
            if len(self.practice.split()) < REHEARSAL_MIN_WORDS:
                return (
                    f"`{label}`.use.practice is \"{self.practice}\". Say in a sentence what each "
                    "child says or does, and that it is something they will have to say or do in "
                    "life (a refusal, asking for help, a partner voice); a fact, a meaning or a rule "
                    "recited to a partner is rehearsal, not practice"
                )
            return None
        if self.new and self.rehearsal:
            return (
                f"`{label}`.use gives both `new` and `rehearsal`. A beat is one or the other: "
                "leave the one that is not true as null"
            )
        if not self.new and not self.rehearsal:
            if not self.asked:
                return None
            return (
                f"`{label}`.use is empty, and the teaching just before this beat already said "
                f"{count}. {beside}. {two_ways}"
            )
        if self.rehearsal:
            if self.wrong:
                return (
                    f"`{label}`.use gives `wrong` beside `rehearsal`. A say-it-back beat has no "
                    "tempting wrong answer to name: leave `wrong` as null"
                )
            if len(self.rehearsal.split()) < REHEARSAL_MIN_WORDS:
                return (
                    f"`{label}`.use.rehearsal is \"{self.rehearsal}\", which names the beat and "
                    "gives no reason. Say in a sentence why saying it back is the job here: what "
                    "children need secure before the next thing, and where in this lesson they "
                    "then use it on something new"
                )
            return None
        if "wrong" in self.use and len((self.wrong or "").split()) < WRONG_MIN_WORDS:
            return (
                f"`{label}`.use.wrong has to say what a child who has not understood would "
                "really answer, in that child's words (not `yes`, `no` or `the other one`). It is "
                "the test of the task: would you ask a class this, and would the child who "
                "understands answer differently from the child who does not? If the only wrong "
                "answer is one no child here would give, the task has an obvious answer; change "
                "it so that two answers both look right and the taught idea decides between them"
            )
        if len(self.new.split()) > NEW_MAX_WORDS:
            return (
                f"`{label}`.use.new is {len(self.new.split())} words long. Say in a phrase what "
                "this task puts in front of children that the lesson has not shown them (the "
                "case, the person, the thing that happens); the task's own options or its whole "
                "wording pasted in is not an answer to that"
            )
        missing, old, fresh = self.new_words()
        if missing:
            return (
                f"`{label}`.use.new is \"{self.new}\", and the task children are set does not "
                f"contain {', '.join(missing)}. Write `new` in the task's own words, so it names "
                "something that is really in front of the class, not a description of the task"
            )
        if self.asked and len(fresh) < NEW_MIN_UNSAID:
            already = ", ".join(old) if old else "all of it"
            if self.right_option:
                return (
                    f"`{label}`.use.new is \"{self.new}\", and the option children should "
                    f"choose is the teaching said back ({self.repeated} of its {self.total} "
                    f"words): \"{self.right_option}\" The teaching said: "
                    f"\"{self.taught_sentence}\" A different wrong option does not change "
                    f"that. {two_ways}"
                )
            return (
                f"`{label}`.use.new is \"{self.new}\", and the lesson had already said {already} "
                f"before this task was set, so it is not new to the class. The teaching just "
                f"before already said {count}. {beside}. {two_ways}"
            )
        return None

    def declaration_line(self) -> str:
        """The declaration as one line for a view."""
        if not self.declares:
            return ""
        if self.new:
            wrong = (
                f" A child who has not understood would say: \"{self.wrong}\""
                if self.wrong else " It does not say what a child who has not understood would answer."
            )
            return f"The design says this task brings something new: \"{self.new}\"" + wrong
        if self.practice:
            return f"The design says this beat practises the skill itself: \"{self.practice}\""
        if self.rehearsal:
            return f"The design says this beat is rehearsal: \"{self.rehearsal}\""
        if self.asked:
            return "The design does not say what this task brings. It has to."
        return "The design does not say what this task brings (it was not asked to)."


def read_beside(design: dict) -> list[Beside]:
    """Every pupil beat of a design beside the teaching before it."""
    sequence = [unit for unit in design.get("teachingSequence") or [] if isinstance(unit, dict)]
    sticky = {
        row.get("id"): row.get("text", "")
        for row in design.get("stickyKnowledge") or []
        if isinstance(row, dict)
    }
    position = {id(unit): index for index, unit in enumerate(sequence)}
    starter = design.get("starter") if isinstance(design.get("starter"), dict) else None
    result = []
    for shown, pupil in beside_pairs(sequence):
        before = sequence[: position[id(pupil)]]
        earlier = " ".join(
            " ".join((beside_teaching_text(unit, sticky), ask_text(unit))) for unit in before
        )
        if starter:
            earlier = " ".join((beside_teaching_text(starter, sticky), ask_text(starter), earlier))
        result.append(Beside(shown, pupil, sticky, earlier))
    return result


# How many Do beats and quick checks in one lesson may be rehearsal. This is
# the teacher's own number for this one thing (6 October 2026, shown a lesson
# whose first two tasks each said back what had just been taught: "two is too
# many, one at most"). It is not a pattern for other limits: he has ruled
# against caps on a lesson in general.
REHEARSAL_MOST = 1


def too_much_rehearsal(rows: list[Beside]) -> str | None:
    """The fault when more than one Do or quick check is declared rehearsal.

    Only the beats that carry `use` are counted (`USE_KINDS`). So these are
    not: the final task and the good answer shown before it, a maths My Turn,
    Our Turn and Your Turn, the starter's recall of earlier lessons, the
    vocabulary cards, and the partner rehearsal inside the final task.
    """
    said_back = [
        row for row in rows
        if row.declares and not row.new and row.rehearsal
    ]
    if len(said_back) <= REHEARSAL_MOST:
        return None
    names = ", ".join(f"`{row.pupil.get('label')}`" for row in said_back)
    return (
        f"{len(said_back)} beats are declared rehearsal ({names}), and a lesson holds one "
        "say-it-back Do or quick check at most (the teacher, 6 October 2026: \"two is too many, "
        "one at most\"). Keep the one where saying it back does most good, and make each of the "
        "others a use, starting from a real case: something the class could meet that the "
        "lesson did not show, a named child saying what a real child might think, a new person "
        "or object the idea has to sort, or something that really happens and changes one thing "
        "(`task-contrasts.md` -> `One story, one process, one set of meanings`), and write the "
        "new thing in its `use.new`. Do not buy the "
        "freshness the wrong way: a task that needs a law, a process or a fact the lesson never "
        "taught is unfair, and the same task with one name swapped is the same task"
    )


def whole_lesson_line(rows: list[Beside]) -> str:
    """How many Do beats use the learning on something new."""
    declaring = [row for row in rows if row.declares]
    if not declaring:
        return ""
    new = sum(1 for row in declaring if row.new)
    rehearsal = sum(1 for row in declaring if row.rehearsal and not row.new)
    practice = sum(1 for row in declaring if row.practice and not row.new and not row.rehearsal)
    silent = len(declaring) - new - rehearsal - practice
    parts = [f"{new} of {len(declaring)} say they use the learning on something new"]
    if rehearsal:
        parts.append(f"{rehearsal} say they are rehearsal")
    if practice:
        parts.append(f"{practice} practise the skill itself")
    if silent:
        parts.append(f"{silent} do not say")
    line = "Of the Do beats that follow a piece of teaching: " + "; ".join(parts) + "."
    if not new and not silent:
        line += (
            " Nowhere before the final task do children use what they were taught on anything "
            "the lesson has not already shown them."
        )
    return line
