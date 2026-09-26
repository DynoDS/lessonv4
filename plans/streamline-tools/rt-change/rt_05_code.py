"""The routes release, step 5: the programs (change plan section 4, decision 2's
"Code" and "His 13b in the code", settled items 7e, 7f and 7j).

- Decision 2 and the plan's question 2 (his "Yes"): the check that a class sees
  a good explanation before it writes one reaches a skill lesson's `practise` and
  a task lesson's Do the task, as well as a content lesson's Practise; a My Turn
  or Our Turn counts only when it shows the kind of thing children then write (it
  asks for an explanation itself and its good one is on the board). Its docstring
  and message name the beat.
- 13b: a launch kept with `goodLooksLike` null passes when its beat carries
  success criteria; the reviewer judges whether they show a good one.
- 7j: the Teach's explanation message describes the teaching in his order,
  opening on the sentence the slide lands.
- 7f: the skill turn-label message asks for the move after the turn word outside
  maths and accepts the plain word in maths (his 19 September maths ruling,
  `preferences.md` → Slide Headings). The check itself already took both.
- 7e: the review view's words the class reads gain a skill `prepare` unit's
  `activity` in `explanation` mode and a `teach-needed` unit's `modelledOn`, and
  the designer's list says the same."""
from _patch import LD, PACKET, VALIDATOR, replace_once

# --- The explanation check (decision 2, question 2 and 13b).
replace_once(
    VALIDATOR,
    '''_EXPLAINS = re.compile(r"explain|explanation|compar|paragraph|justif", re.IGNORECASE)


def _shows_the_class_a_model(unit: dict[str, Any]) -> bool:
    """Whether this beat puts a good finished instance in front of the class:
    a modelled turn, a model answer revealed to them, or a launch's pair."""
    if unit.get("kind") in {"my-turn", "our-turn"}:
        return True
    answer = unit.get("answer") or {}
    if answer.get("kind") in {"model", "standard"} and answer.get("delivery") in {"answer-slide", "visible-in-unit"}:
        return True
    launch = (unit.get("content") or {}).get("launch")
    return isinstance(launch, dict) and launch.get("goodLooksLike") is not None


def validate_explanation_task_is_modelled(structure: str, sequence: list[dict[str, Any]]) -> None:
    """A written explanation or comparison is shown before it is asked for.

    On 22 September 2026 a Year 4 history lesson ended on `Explain how these
    examples show change and continuity` with `launch: null`: the only earlier
    explanation was a Do whose model answer stayed in the teacher's notes, so no
    child had seen what a good explanation of it looked like, and the teacher
    who taught it said so ("You haven't given the tools to explain"). The
    exemption the launch rule allowed, `a form they have made before`, was the
    door, because nothing could check it. A skill lesson is left alone: its My
    Turn and Our Turn model the move every time.
    """
    if structure == "Skill-based":
        return
    for index, unit in enumerate(sequence):
        if unit.get("kind") != "practise":
            continue
        content = unit.get("content") or {}
        explains = bool(content.get("reasoningWords")) or bool(_EXPLAINS.search(content.get("format") or ""))
        if not explains:
            continue
        # Its own answer slide comes after the writing, so only its launch counts.
        launch = content.get("launch")
        if isinstance(launch, dict) and launch.get("goodLooksLike") is not None:
            continue
        if any(_shows_the_class_a_model(earlier) for earlier in sequence[:index]):
            continue
        expect(
            False,
            f"teachingSequence[{index}].content.launch: this Practise asks each child to write an "
            "explanation or comparison, and nothing earlier in the lesson has shown the class a good "
            "one: the launch has no good instance beside a weak one, and no earlier beat reveals its "
            "model answer. A child meeting the form for the first time in the task has to invent how "
            "the explanation goes and use the new learning at once, and the teacher has nothing on the "
            "board to point at. Give `launch.goodLooksLike` a strong instance beside a weak one on a "
            "parallel case (the lesson's own taught case works), or reveal the model answer of an "
            "earlier explanation Do to the class (`answer.delivery: answer-slide`) so they have seen a "
            "good one before they write their own",
        )
''',
    '''_EXPLAINS = re.compile(r"explain|explanation|compar|paragraph|justif", re.IGNORECASE)

# The beats that ask each child for the lesson's substantial written work, in
# every route: a content or skill lesson's Practise, a task lesson's Do the task.
_SUBSTANTIAL_TASKS = {"practise": "Practise", "do-task": "Do the task"}


def _asks_for_an_explanation(unit: dict[str, Any]) -> bool:
    """An explanation task carries the fields `explanation-tasks.md` owns
    (`reasoningWords`, `rehearsal`), and a Practise also names its form in
    `format`. A Do the task's `activity` is not searched for the word: an
    enquiry that compares two materials is not a written comparison."""
    content = unit.get("content") or {}
    if content.get("reasoningWords") or content.get("rehearsal"):
        return True
    return unit.get("kind") == "practise" and bool(_EXPLAINS.search(content.get("format") or ""))


def _shows_the_class_a_model(unit: dict[str, Any]) -> bool:
    """Whether this beat puts a good finished instance in front of the class:
    a model answer revealed to them, or a launch's pair.

    A My Turn or an Our Turn counts only when it shows the kind of thing
    children then write: its own question asks for an explanation, and its good
    one is on the board (its model answer revealed, or a My Turn's modelled
    exemplar written live). A maths turn that models the rounding has shown the
    rounding, not what a good explanation of it looks like, and the teacher's
    answer of 24 September 2026 was that such a turn does not count.
    """
    kind = unit.get("kind")
    content = unit.get("content") or {}
    answer = unit.get("answer") or {}
    revealed = (
        answer.get("kind") in {"model", "standard"}
        and answer.get("delivery") in {"answer-slide", "visible-in-unit"}
    )
    if kind in {"my-turn", "our-turn"}:
        if not _EXPLAINS.search(content.get("example") or ""):
            return False
        written_live = kind == "my-turn" and bool((content.get("modelledExemplar") or "").strip())
        return revealed or written_live
    if revealed:
        return True
    launch = content.get("launch")
    return isinstance(launch, dict) and launch.get("goodLooksLike") is not None


def validate_explanation_task_is_modelled(structure: str, sequence: list[dict[str, Any]]) -> None:
    """A written explanation or comparison is shown before it is asked for, in
    every route.

    On 22 September 2026 a Year 4 history lesson ended on `Explain how these
    examples show change and continuity` with `launch: null`: the only earlier
    explanation was a Do whose model answer stayed in the teacher's notes, so no
    child had seen what a good explanation of it looked like, and the teacher
    who taught it said so ("You haven't given the tools to explain"). The
    exemption the launch rule allowed, `a form they have made before`, was the
    door, because nothing could check it. The teacher's answer of 24 September
    2026 was one rule everywhere: a skill lesson's Practise and a task lesson's
    Do the task are checked too, and a My Turn or Our Turn counts only when it
    shows the kind of thing children then write.

    A launch kept with `goodLooksLike` null passes when its beat carries
    success criteria: criteria on the board that already show what a good one
    looks like count as one seen (his preferences decision 13b). Whether they
    do is the reviewer's to judge, since nothing here can read it.
    """
    for index, unit in enumerate(sequence):
        beat = _SUBSTANTIAL_TASKS.get(unit.get("kind"))
        if beat is None or not _asks_for_an_explanation(unit):
            continue
        content = unit.get("content") or {}
        # Its own answer slide comes after the writing, so only its launch counts.
        launch = content.get("launch")
        if isinstance(launch, dict):
            if launch.get("goodLooksLike") is not None:
                continue
            if unit.get("successCriteriaRefs"):
                continue
        if any(_shows_the_class_a_model(earlier) for earlier in sequence[:index]):
            continue
        expect(
            False,
            f"teachingSequence[{index}].content.launch: this {beat} asks each child to write an "
            "explanation or comparison, and nothing earlier in the lesson has shown the class a good "
            "one: the launch has no good instance beside a weak one, and no earlier beat reveals its "
            "model answer (a My Turn or Our Turn counts only when its own question asks for an "
            "explanation and its good one is on the board). A child meeting the form for the first "
            "time in the task has to invent how the explanation goes and use the new learning at "
            "once, and the teacher has nothing on the board to point at. Give `launch.goodLooksLike` "
            "a strong instance beside a weak one on a parallel case (the lesson's own taught case "
            "works), or reveal the model answer of an earlier explanation beat to the class "
            "(`answer.delivery: answer-slide`) so they have seen a good one before they write their own",
        )
''',
)

# --- 7j: the Teach explanation message, in his order.
replace_once(
    VALIDATOR,
    "        # The teaching of the idea as the child reads it: the route from what\n"
    "        # the class already has to the sentence the slide lands. Required. It\n",
    "        # The teaching of the idea as the child reads it: the route that\n"
    "        # follows the sentence the slide lands. Required. It\n",
)
replace_once(
    VALIDATOR,
    'f"{path}.explanation must carry the teaching as the child reads it: the route from what the class already has, '
    'through the thing on the board, to the sentence the slide lands, in whole sentences the teacher could say.',
    'f"{path}.explanation must carry the teaching as the child reads it: the route this teacher usually walks after '
    'the sentence the slide lands, the because or so that explains it, then an example on the board or what it does '
    'not mean, in whole sentences the teacher could say.',
)

# --- 7f: the turn-label message, with his maths ruling.
replace_once(
    VALIDATOR,
    '''                f"teachingSequence[{index}].label must begin with '{word}' and then "
                f"name the move ('{word} - Which thousand is nearer?'): children read a "
                "skill lesson by these three words, and the slide title is this label",''',
    '''                f"teachingSequence[{index}].label must begin with '{word}': children read a "
                "skill lesson by these three words, and the slide title is this label. In maths "
                f"the plain words are what the teacher wants ('{word}'); in other subjects name "
                f"the move after them ('{word} - Where does the comma go?')",''',
)

# --- 7e: what the class reads, in the review view and the designer's list.
replace_once(
    PACKET,
    """# `activityArchitecture`, `teacherListensFor` and their kind. In starter,
# observe, apply and reflect units, activity is the actual pupil prompt.
""",
    """# `activityArchitecture`, `teacherListensFor` and their kind. In starter,
# observe, apply and reflect units, activity is the actual pupil prompt, and in
# a skill `prepare` unit in `explanation` mode it is the explanation children
# read on the board. A task lesson's `modelledOn` is the instance its teaching
# is shown on, so the class reads it too.
""",
)
replace_once(PACKET, '    "enablingInput",\n', '    "enablingInput",\n    "modelledOn",\n')
replace_once(
    PACKET,
    'ACTIVITY_IS_THE_TASK_KINDS = {"starter", "observe", "apply", "reflect"}\n',
    '''ACTIVITY_IS_THE_TASK_KINDS = {"starter", "observe", "apply", "reflect"}
ACTIVITY_IS_READ_PREPARE_MODES = {"explanation"}


def activity_is_child_facing(unit: dict) -> bool:
    """Whether a unit's `activity` is words the class reads rather than a
    description written for a designer."""
    content = unit.get("content") or {}
    return unit.get("kind") in ACTIVITY_IS_THE_TASK_KINDS or (
        unit.get("kind") == "prepare" and content.get("mode") in ACTIVITY_IS_READ_PREPARE_MODES
    )
''',
)
replace_once(
    PACKET,
    """    keys = list(CHILD_FACING_CONTENT_KEYS)
    if unit.get("kind") in ACTIVITY_IS_THE_TASK_KINDS:
        keys.append("activity")""",
    """    keys = list(CHILD_FACING_CONTENT_KEYS)
    if activity_is_child_facing(unit):
        keys.append("activity")""",
)
replace_once(
    PACKET,
    """    if unit.get("kind") in ACTIVITY_IS_THE_TASK_KINDS:
        class_view_strings(content.get("activity"), out)""",
    """    if activity_is_child_facing(unit):
        class_view_strings(content.get("activity"), out)""",
)
replace_once(
    LD,
    "For starter, observe, apply and reflect units, `activity` is the actual pupil-facing prompt and must be written "
    "and reviewed as such.",
    "For starter, observe, apply and reflect units, `activity` is the actual pupil-facing prompt and must be written "
    "and reviewed as such; so is a skill `prepare` unit's `activity` in `explanation` mode, which is the explanation "
    "children read on the board, and a task lesson's `modelledOn`, the instance its teaching is shown on.",
)
print("CODE_OK")
