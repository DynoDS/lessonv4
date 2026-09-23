"""4.2.286 decision 9: the review view's side-by-side section reaches every
route, reads structured sort and classification answers, and counts the
Teach's takeaway. Replaces build_do_beside_teach whole."""
from pathlib import Path

P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\scripts\design-review-packet.py")
text = P.read_text(encoding="utf-8")
start = text.index("def build_do_beside_teach(design: dict) -> list[str]:")
end = text.index("def read_class_view_count(")
assert text.count("def build_do_beside_teach(") == 1

NEW = '''# The beats that teach, and the beats where children use what was taught.
# `teach-needed` carries its own pupil instruction, so it is both at once.
BESIDE_TEACHING_KINDS = TEACH_KINDS | {"my-turn", "grounding-input"}
BESIDE_PUPIL_KINDS = {
    "do", "practise", "use-learning", "our-turn", "your-turn", "talk",
    "stimulus-talk", "do-task",
}


def _beside_teaching_text(unit: dict, sticky: dict[str, str]) -> str:
    """Everything the class was shown or told on a teaching beat, including
    its takeaway, which is the line a Do is most likely to say back."""
    content = unit.get("content") or {}
    takeaway = content.get("takeaway")
    if isinstance(takeaway, dict):
        takeaway = takeaway.get("text") or sticky.get(takeaway.get("ref") or "", "")
    parts = [
        content.get(key)
        for key in (
            "headline", "explanation", "teachingText", "accurateExplanation",
            "enablingInput", "modelledOn", "example", "modelledExemplar", "input",
        )
    ]
    parts += [takeaway, " ".join(content.get("keyQuestions") or [])]
    parts += [(unit.get("speakerNotes") or {}).get("script"), (unit.get("answer") or {}).get("content")]
    return " ".join(str(part) for part in parts if part)


def _beside_expected_answer(unit: dict) -> str:
    """The expected answer in whatever shape the design stored it: prose, or
    a structured sort or evidence classification, which used to print as
    `(none written)`."""
    answer = unit.get("answer") or {}
    if answer.get("content"):
        return " ".join(str(answer["content"]).split())
    structure = answer.get("structure")
    task = unit.get("taskStructure") or {}
    if not isinstance(structure, dict):
        return ""
    if structure.get("kind") == "sort":
        items = {row["id"]: row.get("label", "") for row in task.get("items") or []}
        groups = {row["id"]: row.get("label", "") for row in task.get("groups") or []}
        return "; ".join(
            f"{items.get(p.get('itemRef'), p.get('itemRef'))} under {groups.get(p.get('groupRef'), p.get('groupRef'))}"
            for p in structure.get("placements") or []
        )
    if structure.get("kind") == "evidence-classification":
        return "; ".join(
            ", ".join(str(value.get("value")) for value in result.get("values") or [])
            for result in structure.get("results") or []
        )
    return ""


def _beside_pairs(sequence: list[dict]) -> list[tuple[dict, dict]]:
    """Each teaching beat with the first beat where children use it, in every
    route. A My Turn is shown beside its Our Turn and its Your Turn, because a
    Your Turn that re-sorts the shapes just placed is the skill route's form of
    the restatement. An enabling input is beside its own pupil instruction."""
    pairs = []
    for index, unit in enumerate(sequence):
        kind = unit.get("kind")
        if kind == "teach-needed" and unit.get("pupilInstruction"):
            pairs.append((unit, unit))
            continue
        if kind not in BESIDE_TEACHING_KINDS:
            continue
        for later in sequence[index + 1:]:
            later_kind = later.get("kind")
            if later_kind in BESIDE_PUPIL_KINDS:
                pairs.append((unit, later))
                if kind == "my-turn" and later_kind == "our-turn":
                    continue
                break
            if later_kind in BESIDE_TEACHING_KINDS or later_kind == "teach-needed":
                break
    return pairs


def build_do_beside_teach(design: dict) -> list[str]:
    """Each pupil beat with the teaching it follows and the answer it expects.

    The class view prints them in order, but the expected answer of a quick
    check is usually teacher-only and lives far down the view, so the
    restatement (`Steam could drive roundabouts, so children had a new kind of
    ride to enjoy`, every word of it said on the slide before) is never seen
    beside what the class was just told. Until 4.2.286 this read only a
    content lesson's Do straight after a Teach, printed a structured sort's
    answer as `(none written)` and ignored the Teach's takeaway, so the same
    restatement as a sort, or as a Your Turn re-sorting the shapes just
    placed, passed unseen.
    """
    sequence = design.get("teachingSequence") or []
    sticky = {row.get("id"): row.get("text", "") for row in design.get("stickyKnowledge") or []}
    lines = [
        "## Each Do beside the teaching before it",
        "",
        (
            "For each beat where children use what was just taught, in every "
            "route, what the class was shown and told just before, the answer "
            "the design expects, and how many of that answer's words the "
            "teaching already said. Ask of each: could a child give this answer "
            "by remembering the last slide, without using the idea on anything "
            "new? A quick check is a fresh case (`preferences.md` → `A quick "
            "check is a fresh case, not the last slide again`); the count is "
            "where to look, not the verdict."
        ),
        "",
    ]
    shown = 0
    for teach, pupil in _beside_pairs(sequence):
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
            lines.append(f"### {pupil['label']} (after `{teach['label']}`)")
        lines.append(f"- Asked: {asked}")
        structure = pupil.get("taskStructure") or {}
        items = [row.get("label", "") for row in structure.get("items") or [] if row.get("label")]
        if items and structure.get("kind") == "option-bank":
            lines.append("- Options: " + " | ".join(items))
        elif items and structure.get("kind") == "sort":
            groups = [row.get("label", "") for row in structure.get("groups") or []]
            lines.append("- Cards: " + " | ".join(items) + "; groups: " + " | ".join(groups))
        lines.append(f"- Expected answer: {answer or '(none written)'}")
        if answer_words:
            lines.append(
                f"- Words of the expected answer the Teach's board or script already said: "
                f"{repeated} of {len(answer_words)}"
            )
        lines.append("")
        shown += 1
    if not shown:
        lines.extend(["- No beat where children use the teaching follows a teaching beat.", ""])
    return lines


'''
text = text[:start] + NEW + text[end:]
P.write_text(text, encoding="utf-8")
print("view code replaced")
