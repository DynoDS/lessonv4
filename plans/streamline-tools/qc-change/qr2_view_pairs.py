"""4.2.286 repair (change check 4a, 4b): each pupil beat is paired with all the
teaching and material the class met since the last pupil beat, in every
route, and a beat paired with itself is not counted against its own answer."""
from pathlib import Path

P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\scripts\design-review-packet.py")
text = P.read_text(encoding="utf-8")
start = text.index("# The beats that teach, and the beats where children use what was taught.")
end = text.index("def build_do_beside_teach(design: dict) -> list[str]:")

NEW = '''# The beats where children use what was taught, and the beats that show or
# tell them something first. An enabling input with its own pupil instruction,
# a combined stimulus and talk, and an Our Turn are both: the class uses what
# it met, and what it met is on the board for whatever comes next.
BESIDE_PUPIL_KINDS = {
    "do", "practise", "use-learning", "our-turn", "your-turn", "talk",
    "stimulus-talk", "do-task",
}
BESIDE_SHOWN_KINDS = TEACH_KINDS | {
    "my-turn", "grounding-input", "stimulus", "make-sense", "observe", "prepare",
}


def _beside_teaching_text(unit: dict, sticky: dict[str, str], *, own_answer: bool = True) -> str:
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


def _beside_expected_answer(unit: dict) -> str:
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


def _beside_pairs(sequence: list[dict]) -> list[tuple[list[dict], dict]]:
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
        self_paired = (kind == "teach-needed" and unit.get("pupilInstruction")) or kind == "stimulus-talk"
        if self_paired:
            pairs.append(([], unit))
        if kind not in BESIDE_PUPIL_KINDS and not self_paired:
            continue
        if kind == "stimulus-talk":
            continue
        shown: list[dict] = []
        for earlier in reversed(sequence[:index]):
            earlier_kind = earlier.get("kind")
            if earlier_kind == "our-turn" and kind == "your-turn":
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
        if shown and not (self_paired and kind == "teach-needed"):
            pairs.append((list(reversed(shown)), unit))
    return pairs


'''
text = text[:start] + NEW + text[end:]

old_loop = '''    for teach, pupil in _beside_pairs(sequence):
        answer = _beside_expected_answer(pupil)
        answer_words = _answer_words(answer)
        taught = set(_answer_words(_beside_teaching_text(teach, sticky)))
        repeated = sum(1 for word in answer_words if word in taught)
        asked = (
            pupil.get("pupilInstruction")
            or (pupil.get("content") or {}).get("task")
            or (pupil.get("content") or {}).get("discussionQuestion")
            or (pupil.get("content") or {}).get("activity")
            or ""
        )
        asked = " ".join(str(asked).split())
        if pupil is teach:
            lines.append(f"### {pupil['label']} (its own pupil instruction)")
        else:
            lines.append(f"### {pupil['label']} (after `{teach['label']}`)")'''
new_loop = '''    for shown, pupil in _beside_pairs(sequence):
        answer = _beside_expected_answer(pupil)
        answer_words = _answer_words(answer)
        if shown:
            taught_text = " ".join(_beside_teaching_text(unit, sticky) for unit in shown)
        else:
            taught_text = _beside_teaching_text(pupil, sticky, own_answer=False)
        taught = set(_answer_words(taught_text))
        repeated = sum(1 for word in answer_words if word in taught)
        content = pupil.get("content") or {}
        asked = (
            pupil.get("pupilInstruction")
            or content.get("task")
            or content.get("discussionQuestion")
            or content.get("question")
            or content.get("example")
            or content.get("activity")
            or ""
        )
        asked = " ".join(str(asked).split())
        if not shown:
            lines.append(f"### {pupil['label']} (its own pupil instruction)")
        else:
            names = ", ".join(f"`{unit['label']}`" for unit in shown)
            lines.append(f"### {pupil['label']} (after {names})")'''
assert text.count(old_loop) == 1
text = text.replace(old_loop, new_loop)
P.write_text(text, encoding="utf-8")
print("pairs replaced")
