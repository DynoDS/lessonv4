#!/usr/bin/env python3
"""Print a lesson design's Do beats one after another, as the class meets them.

It exists for the lesson designer's completion check "The Do beats read in a
row" and for a redesign, which both have to read every Do beat together rather
than one at a time. It never fails a design itself; the design check
(`validate-lesson-design.py`) refuses missing or inconsistent declarations.
This view supplies evidence for the designer's separate semantic judgement.

For each Do beat (and the practice) it prints how children answer (the
format and the first words of what they are told to do), and any run of three
or more words the beat's task or answer shares with the Teach just before it or
with a star fact printed on it. On 28 September 2026 a Codex design went back
to its designer twice: first because a Do repeated the case its Teach had just
taught ("hot, very little rain" in both), then because the repair left all
three Do beats asking for a written answer. Both were visible in a list like
this one before any review ran.

It also prints, for each Do, the teaching sentence nearest the answer beside
the answer, and how many of the answer's words the teaching already said: the
same count the reviewer's view prints (`beside_teaching.py`). Until 6 October
2026 this tool closed with `A look, not a verdict`, and a science designer
shown twelve words of its Teach in a task's answer went on to hand the design
in. Now a Do with a high count says what it brings or that it is rehearsal.

After the Do beats it prints the whole lesson from a child's seat: every
stretch where children only listen, with the words the teacher says and
roughly how long they take to say, and every time children do something, with
cards in their hands or from the board, on their own or with someone. On
30 September 2026 a Year 4 RE lesson on the Nativity passed every check with a
deck and script the teacher called fantastic, and lost the class: every task
before the writing was answered alone, off the board, and two gave back words
the teacher had just said ("a lot of listening, a lot of sitting"). Each Do
beat looked fine on its own; only the whole run showed it. The review view
prints the same lines (`design-review-packet.py`).

    python do-beats-in-a-row.py <lesson-design.json>

Standard library only.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import beside_teaching  # noqa: E402 - the count the reviewer's view also prints
import taught_time  # noqa: E402 - the time the slides take to teach by asking

# Words that make a shared run look meaningful when it is only grammar.
LITTLE = {
    "a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "at", "for", "is",
    "are", "was", "were", "it", "its", "it's", "that", "this", "with", "as", "be",
    "you", "your", "they", "their", "we", "our", "i", "my", "he", "she", "his",
    "her", "what", "why", "how", "do", "does", "did", "not", "if", "so", "from",
    "by", "can", "will", "would", "has", "have", "had", "there", "then", "when",
}


def words(text: str) -> list[str]:
    return re.findall(r"[a-z0-9']+", str(text or "").lower())


def runs(text: str, size: int = 3) -> set[tuple[str, ...]]:
    ws = words(text)
    return {
        tuple(ws[i:i + size])
        for i in range(len(ws) - size + 1)
        if sum(w not in LITTLE for w in ws[i:i + size]) >= 2
    }


def shared(beat_text: str, board_text: str) -> list[str]:
    """Longest word runs (three or more words) both texts carry."""
    common = runs(beat_text) & runs(board_text)
    if not common:
        return []
    # Join overlapping three-word runs back into the phrases they came from.
    ws = words(beat_text)
    phrases, i = [], 0
    while i < len(ws) - 2:
        if tuple(ws[i:i + 3]) in common:
            j = i + 3
            while j < len(ws) and tuple(ws[j - 2:j + 1]) in common:
                j += 1
            phrases.append(" ".join(ws[i:j]))
            i = j
        else:
            i += 1
    return phrases


def flatten(value) -> str:
    if isinstance(value, dict):
        return " ".join(flatten(v) for v in value.values())
    if isinstance(value, list):
        return " ".join(flatten(v) for v in value)
    return str(value) if value is not None else ""


def first_words(text: str, count: int = 8) -> str:
    ws = str(text or "").split()
    return " ".join(ws[:count]) + (" ..." if len(ws) > count else "")


# Beats where the teacher presents and no child produces anything (the lesson
# design validator's TEACHER_PRESENTS_KINDS). The main work is the first beat
# of a kind that carries it; a skill lesson with none ends on its last Your Turn.
LISTEN_KINDS = {"prepare", "my-turn", "grounding-input", "stimulus", "set-task",
                "teach", "teach-why", "teach-needed"}
MAIN_KINDS = {"practise", "do-task", "use-learning", "synthesise", "finish"}
# The kinds that teach a new chunk, as against setting a task or a scene.
CHUNK_TEACH_KINDS = {"teach", "teach-why", "teach-needed", "my-turn"}
# A steady classroom reading pace. What the teacher says aloud, before any
# question is asked or answered, so the real stretch is longer.
WORDS_A_MINUTE = 120
# Legacy saved designs without doMode retain their old timing heuristic.
# New designs carry the designer's explicit scope; neither time nor printing
# silently reclassifies that choice.
QUICK_CHECK_MINUTES = 2
TOGETHER = re.compile(r"\b(partners?|pairs?|groups?|together|table)\b", re.IGNORECASE)


def script_of(unit: dict) -> str:
    notes = unit.get("speakerNotes")
    if isinstance(notes, dict) and isinstance(notes.get("script"), str):
        return notes["script"]
    return unit.get("script") if isinstance(unit.get("script"), str) else ""


def time_to_say(count: int) -> str:
    minutes = count / WORDS_A_MINUTE
    if minutes < 0.75:
        return "under a minute to say"
    rounded = round(minutes * 2) / 2
    return f"about {rounded:g} minute{'' if rounded == 1 else 's'} to say"


def how_answered(unit: dict) -> str:
    """The format the design names, or what its task structure shows."""
    content = unit.get("content") or {}
    if content.get("format"):
        return str(content["format"])
    structure = unit.get("taskStructure") or {}
    if structure.get("kind"):
        handling = structure.get("handling") or {}
        where = (f"with printed cards, one set per {handling.get('per')}"
                 if handling.get("kind") == "cards"
                 else f"on a printed sheet, one per {handling.get('per')}"
                 if handling.get("kind") == "sheet" else "from the board")
        return f"{structure['kind']} {where}"
    return "-"


def class_order(design: dict) -> list[tuple[str, dict]]:
    """Every beat the class meets, in order, with each word card where it is
    shown: ("unit", unit) or ("card", {"terms": [...], "script": ...})."""
    starter = design.get("starter") if isinstance(design.get("starter"), dict) else None
    starter_id = (starter or {}).get("sourceUnitId") or ""
    terms = {row.get("id"): row.get("term", "") for row in design.get("vocabulary") or []
             if isinstance(row, dict)}
    cards: dict[str, list[dict]] = {}
    introductions = design.get("vocabularyIntroductions")
    if isinstance(introductions, list) and introductions:
        for entry in introductions:
            if isinstance(entry, dict):
                cards.setdefault(entry.get("after") or starter_id, []).append({
                    "terms": [terms.get(ref, ref) for ref in entry.get("vocabularyRefs") or []],
                    "script": entry.get("script") if isinstance(entry.get("script"), str) else "",
                })
    elif terms:
        placement = design.get("vocabularyPlacement")
        anchor = placement.get("after") if isinstance(placement, dict) else None
        cards[anchor or starter_id] = [{"terms": list(terms.values()), "script": ""}]

    units = ([starter] if starter else []) + [
        unit for unit in design.get("teachingSequence") or [] if isinstance(unit, dict)]
    ending = design.get("ending") or {}
    if ending.get("included") and isinstance(ending.get("beat"), dict):
        units.append(ending["beat"])
    order: list[tuple[str, dict]] = []
    placed = set()
    for unit in units:
        order.append(("unit", unit))
        anchor = unit.get("sourceUnitId") or ""
        if anchor in cards and anchor not in placed:
            placed.add(anchor)
            order.extend(("card", card) for card in cards[anchor])
    for anchor, group in cards.items():
        if anchor not in placed:
            order[1:1] = [("card", card) for card in group]
    return order


def child_seat(design: dict) -> list[str]:
    """The lesson as the class lives it: listening stretches and what children
    do, in order. A look, never a verdict."""
    order = class_order(design)
    main_at = next((i for i, (what, unit) in enumerate(order)
                    if what == "unit" and unit.get("kind") in MAIN_KINDS), None)
    if main_at is None:
        main_at = max((i for i, (what, unit) in enumerate(order)
                       if what == "unit" and unit.get("kind") not in LISTEN_KINDS), default=None)

    lines = ["From a child's seat, in the order the class meets it (words the teacher says, "
             f"at about {WORDS_A_MINUTE} a minute, before any question is asked or answered):"]
    listened = 0
    # Everything the teacher says, the talk on each task's own slides included.
    # The renga lesson of 2 October 2026 printed "children only listen to 620
    # words, about 5 minutes", its review repeated "listening totals about five
    # minutes", and the script ran to 1,260 words: about 300 of them were the
    # checklist, the good and weak join and the steps said on the main task's
    # own slides before any child touched a card, which a count of the Teach
    # slides alone never sees. The teacher read it and said it felt long.
    said = 0
    stretch: list[tuple[str, int]] = []
    stretches: list[list[tuple[str, int]]] = []
    before_main = {"do": 0, "cards": 0, "together": 0, "quick": 0}
    # Chunks of teaching before the main work: a listening stretch holding a
    # Teach, ended by whatever children do next, quick check or task. A Year 4
    # sound lesson (18 October 2026) taught three chunks, the middle one
    # checked only by a quick check, then its explanation task, and passed
    # the task count; the teacher found it "so much".
    chunks_before_main = 0
    lead_in: list[str] = []
    lead_in_new_word = False
    taught_in_stretch = False
    after_main = 0
    quick_after_main = 0
    for i, (what, item) in enumerate(order):
        if what == "card":
            name = "word card: " + ", ".join(t for t in item["terms"] if t)
            count = len(item["script"].split())
            lines.append(f"  listen  {name} ({count} words, {time_to_say(count)})")
            listened += count
            said += count
            stretch.append((name, count))
            continue
        name = item.get("label") or item.get("sourceUnitId") or item.get("kind") or "beat"
        count = len(script_of(item).split())
        said += count
        if item.get("kind") in LISTEN_KINDS:
            lines.append(f"  listen  {name} ({count} words, {time_to_say(count)})")
            listened += count
            stretch.append((name, count))
            taught_in_stretch = taught_in_stretch or item.get("kind") in CHUNK_TEACH_KINDS
            # An enabling input can own the immediate pupil action too.
            if not (item.get("kind") == "teach-needed" and item.get("pupilInstruction")):
                continue
        if (taught_in_stretch and main_at is not None and i < main_at
                and item.get("kind") != "starter"):
            chunks_before_main += 1
        # Teaching that runs straight into the main work, with nothing for
        # children to do, hid a fourth chunk in a Year 4 cholera lesson
        # (18 October 2026): the leaking well, a new word card and the sewers
        # came after the last task, so the count above said three. A new word
        # there is usually new teaching, but the word the final task itself
        # asks about (Shaftesbury's "significant") can be the lead-in readying
        # it, so the stretch is named for the reader to judge, not counted.
        if i == main_at and stretch:
            names = [name for name, _count in stretch]
            lead_in_new_word = any(name.startswith("word card:") for name in names)
            if taught_in_stretch or lead_in_new_word:
                lead_in = names
        taught_in_stretch = False
        if stretch:
            stretches.append(stretch)
            stretch = []
        content = item.get("content") or {}
        told = (item.get("pupilInstruction") or content.get("task") or content.get("prompt")
                or content.get("question") or content.get("activity") or "")
        handling = (item.get("taskStructure") or {}).get("handling") or {}
        cards = handling.get("kind") == "cards"
        together = (handling.get("per") in {"pair", "group"}) or bool(TOGETHER.search(flatten(told)))
        sheet = handling.get("kind") == "sheet"
        levels = item.get("levels") if isinstance(item.get("levels"), dict) else {}
        printed = levels.get("printed") if isinstance(levels.get("printed"), dict) else None
        # The board version always runs; the printed level is what the teacher
        # can hand out instead, shown so the run of beats reads as the class
        # could live it on a prepared day as well as from the slides.
        where = (f"with printed cards, one set per {handling.get('per')}" if cards
                 else f"on a printed sheet, one per {handling.get('per')}" if sheet
                 else f"from the board, or a printed {printed.get('form')} sheet one per {printed.get('per')}" if printed
                 else "from the board or in books")
        if levels.get("realThings"):
            where += f", or with {levels['realThings']}"
        who = "with a partner or group" if together else "on their own"
        planned = item.get("minutes")
        # Explicit source scope wins. Only old saved designs without it use
        # the historical print/time approximation.
        mode = item.get("doMode")
        quick = (mode == "quick" if mode in {"quick", "deeper"} else
                 (item.get("kind") != "starter" and i != main_at and printed is None
                  and isinstance(planned, (int, float)) and planned <= QUICK_CHECK_MINUTES))
        tag = "MAIN" if i == main_at else ("quick" if quick else "do")
        minutes = f", {planned} min planned" if isinstance(planned, (int, float)) else ""
        if mode in {"quick", "deeper"}:
            minutes += f", designer chose {mode}"
        lines.append(f"  {tag:<6}  {name}: \"{first_words(flatten(told), 10)}\" - {where}, {who}"
                     f" (teacher says {count} words{minutes})")
        if item.get("kind") == "starter":
            continue
        if main_at is not None and i < main_at and quick:
            before_main["quick"] += 1
        elif main_at is not None and i < main_at:
            before_main["do"] += 1
            before_main["cards"] += cards
            before_main["together"] += together
        elif main_at is not None and i > main_at and quick:
            # A quick check is not a task wherever it falls. A Year 6 PSHE
            # lesson of the 20-lesson test (7 October 2026) put a two-minute
            # check after its main sort and was told it held three tasks.
            quick_after_main += 1
        elif main_at is not None and i > main_at:
            after_main += 1
    if stretch:
        stretches.append(stretch)

    lines.append(f"  On the Teach slides and word cards alone, children listen to {listened} words, "
                 f"{time_to_say(listened)}.")
    lines.append(f"  Everything the teacher says, the talk on each task's own slides included: {said} words, "
                 f"{time_to_say(said)}. That is the lesson's listening; asking and answering add to it.")
    honest, _rows = taught_time.honest_minutes(design)
    lines.append(f"  Taught by asking rather than read out (what the slides show, at about {taught_time.BOARD_WORDS_A_MINUTE} "
                 f"words a minute, a cover teacher's pace on 20 October 2026), the beats take about {honest} minutes, "
                 f"{honest + 5} with books out and moving about. The design check refuses more than 50.")
    if stretches:
        longest = max(stretches, key=lambda run: sum(count for _name, count in run))
        words_in = sum(count for _name, count in longest)
        lines.append(f"  The longest listening stretch is {words_in} words, {time_to_say(words_in)}: "
                     + "; ".join(name for name, _count in longest) + ".")
    if main_at is not None:
        lines.append(
            f"  Between the starter and the main work children do {before_main['do']} "
            f"task{'' if before_main['do'] == 1 else 's'} and {before_main['quick']} quick "
            f"check{'' if before_main['quick'] == 1 else 's'} (a Do planned at {QUICK_CHECK_MINUTES} minutes "
            f"or less): {before_main['cards']} with cards in their hands, {before_main['together']} with "
            f"a partner or group, the rest on their own from the board or in books."
        )
        if after_main or quick_after_main:
            parts = []
            if after_main:
                parts.append(f"{after_main} more task{'' if after_main == 1 else 's'}")
            if quick_after_main:
                parts.append(f"{quick_after_main} quick check{'' if quick_after_main == 1 else 's'}")
            lines.append(f"  After the main work they do {' and '.join(parts)}.")
        counted = before_main["do"] + 1 + after_main
        lines.append(f"  Tasks counted against the two or three a lesson holds (the main work and anything "
                     f"after it included, quick checks not): {counted}.")
        lines.append("  A written piece children start once a sort or an order is done is a task of its own "
                     "and adds one to that count, which this list cannot see.")
        lines.append(f"  Chunks of teaching before the main work, each ended by a quick check or a task: "
                     f"{chunks_before_main}. Usually two, then a short lead-in and the final task "
                     f"(`preferences.md` -> `A lesson holds two or three Dos, then its final task`); "
                     f"a third is the sign to look again at what the objective needs, never a cap. This number "
                     f"is not argued down: teaching closed by a task of its own is its own chunk whatever the "
                     f"design calls it, and only a set of names checked by quick checks as it arrives stays one. "
                     f"At three, go back to fewer things or say in the closing decisions' Amount line why this "
                     f"objective needs the third. A skill lesson's My Turn cycles keep their own shape.")
        if lead_in:
            judged = ("If it only ties together what was taught, it is the lead-in; if it teaches the next "
                      "part of the story, it is a chunk of its own and adds one to that count.")
            if lead_in_new_word:
                judged += (" It brings in a new word, which is new teaching unless the final task itself "
                           "asks children to use that word.")
            lines.append(f"  Teaching that runs straight into the main work with nothing for children to do: "
                         + "; ".join(lead_in) + f". {judged}")
    lines.extend(clock(design, order))
    return lines


DO_KINDS_IN_A_CYCLE = {"our-turn", "your-turn"}


# The teacher's rough picture of where a lesson's minutes go (12 October 2026,
# `preferences.md` -> Classroom Norms, Time). None is a rule; only the total is
# enforced, by the design check.
UNPLANNED_MINUTES = 5
LESSON_MOST_MINUTES = 50
WORKSHEET_ABOUT_MINUTES = 15
WORKSHEET_SHORT_MINUTES = 10
TASKS_SPENT_MINUTES = 15
TEACH_KINDS = {"teach", "teach-why", "teach-needed"}


def room(design: dict, order: list[tuple[str, dict]], planned: float) -> list[str]:
    """Where the planned minutes go, beside the teacher's rough picture.

    The total alone hides a full lesson. A Year 5 history lesson of the
    20-lesson test (7 October 2026) added up to 39 minutes of 45 and passed
    every count: two partner source readings of 7 and 8 minutes, then a third
    new idea, then a worksheet timed at 9. The teacher read the deck and said
    the class would be lost by the third idea; the readings were right for the
    objective and had used the room that idea needed, and the 9 was the
    worksheet made to fit. Neither showed anywhere the designer or the
    reviewer read. A look, never a verdict."""
    units = [unit for what, unit in order if what == "unit"]
    main_at = next((i for i, unit in enumerate(units) if unit.get("kind") in MAIN_KINDS), None)
    if main_at is None:
        # A skill lesson with no such beat ends on its last Your Turn.
        main_at = max((i for i, unit in enumerate(units) if unit.get("kind") not in LISTEN_KINDS), default=None)

    def minutes(unit: dict) -> float:
        value = unit.get("minutes")
        return value if isinstance(value, (int, float)) else 0

    starter = sum(minutes(u) for u in units if u.get("kind") == "starter")
    teaching = sum(minutes(u) for u in units if u.get("kind") in LISTEN_KINDS)
    tasks: list[float] = []
    late_teach = None
    for i, unit in enumerate(units):
        if main_at is not None and i >= main_at:
            break
        kind = unit.get("kind")
        if kind in TEACH_KINDS and sum(tasks) >= TASKS_SPENT_MINUTES and late_teach is None:
            late_teach = (unit.get("label") or unit.get("sourceUnitId") or "a Teach", sum(tasks))
        if kind != "starter" and kind not in LISTEN_KINDS:
            tasks.append(minutes(unit))
    main = minutes(units[main_at]) if main_at is not None else 0
    after = sum(minutes(u) for i, u in enumerate(units)
                if main_at is not None and i > main_at and u.get("kind") not in LISTEN_KINDS)
    whole = planned + UNPLANNED_MINUTES
    each = " + ".join(f"{m:g}" for m in tasks) if len(tasks) > 1 else ""
    lines = [
        f"  Where the {planned:g} planned minutes go: starter {starter:g}; teaching {teaching:g}; tasks before "
        f"the main work {sum(tasks):g}{f' ({each})' if each else ''}; the main work {main:g}"
        f"{f'; after it {after:g}' if after else ''}. With about {UNPLANNED_MINUTES} that no beat plans (books "
        f"out, the date and objective, moving to tables and back) the lesson runs about {whole:g} minutes.",
        f"  The teacher's rough picture, none of it a rule: 45 to {LESSON_MOST_MINUTES} in all; about 15 to 20 of "
        f"teaching; a quick task 2 to 3 and a longer one 5 to 10, as the task needs; about "
        f"{WORKSHEET_ABOUT_MINUTES} for a worksheet when the lesson ends on one.",
    ]
    if whole > LESSON_MOST_MINUTES:
        lines.append(f"  THE DESIGN CHECK WILL REFUSE THIS: {whole:g} is past {LESSON_MOST_MINUTES}. Reconsider "
                     "the whole allocation using preferences.md, Classroom Norms, Time; change the work, "
                     "then estimate it honestly.")
    if late_teach:
        label, spent = late_teach
        lines.append(
            f"  LOOK AGAIN: \"{label}\" starts new teaching after {spent:g} minutes of tasks since the starter, "
            "with the main work still to come. Judge whether this sequence leaves enough capacity for "
            "the new learning and its use. Apply preferences.md, Classroom Norms, Time to reconsider "
            "both the teaching and pupil work; long tasks may be justified, but their current allocation "
            "is not protected by this warning.")
    sheet = (design.get("worksheet") or {}).get("status") == "generated"
    if sheet and main_at is not None and 0 < main <= WORKSHEET_SHORT_MINUTES:
        lines.append(
            f"  LOOK AGAIN: the lesson prints a worksheet and its main work is planned at {main:g} minutes, "
            f"where a worksheet usually takes about {WORKSHEET_ABOUT_MINUTES}. A short sheet is a real thing; "
            f"a sheet given {main:g} because that was what the sum had left is a lesson fuller than it "
            "looks. Which is this?")
    return lines


def clock(design: dict, order: list[tuple[str, dict]]) -> list[str]:
    """The planned minutes against the lesson's length, and how many Dos each
    taught idea takes before the next. A Year 6 divisibility lesson of
    2 October 2026 gave each of four checks a My, Our and Your Turn: 34 slides,
    38 planned minutes of 45, six left for the worksheet, and a review that
    called every check "one short cycle in the 45 minutes". Its rebuild kept
    every idea and one Do after each, and the teacher found it far better.
    Neither number was printed anywhere the designer or the reviewer read."""
    lines: list[str] = []
    duration = (design.get("lesson") or {}).get("durationMinutes")
    planned = sum(unit.get("minutes") for what, unit in order
                  if what == "unit" and isinstance(unit.get("minutes"), (int, float)))
    if isinstance(duration, (int, float)) and planned:
        lines.extend(room(design, order, planned))
    names = {c.get("id"): c.get("name") or c.get("id") for c in design.get("concepts") or [] if isinstance(c, dict)}
    dos: dict[str, int] = {}
    for what, unit in order:
        ref = unit.get("conceptRef") if what == "unit" else None
        if ref in names:
            dos.setdefault(ref, 0)
            dos[ref] += unit.get("kind") in DO_KINDS_IN_A_CYCLE
    if len(dos) > 1:
        lines.append(f"  Dos after each taught idea, before the next: "
                     + "; ".join(f"{names[ref]}: {n}" for ref, n in dos.items())
                     + f" ({len(dos)} ideas, {sum(dos.values())} Dos).")
    return lines


def response_contract_lines(design: dict, unit: dict) -> list[str]:
    """Expose the authored success boundary and actual response affordance.

    This is a readout for judgement, not a semantic pass/fail classifier.
    Resolve only the selected visual configuration: another state may supply
    the answer or leave different work for the pupil.
    """
    content = unit.get("content") or {}
    answer = unit.get("answer") or {}
    private = {"format", "connection", "modelledExemplar", "teacherListensFor", "focus", "evidenceProduced"}
    if any(content.get(key) for key in ("task", "prompt", "question")):
        private.add("activity")
    task_content = {key: value for key, value in content.items() if key not in private and value is not None}
    lines = ["  RESPONSE CONTRACT (check against the actual pupil task):",
             "    intended thinking: " + str(unit.get("thinking") or "(not recorded)"),
             "    task-facing content: " + json.dumps(task_content, ensure_ascii=False),
             "    pupil instruction: " + str(unit.get("pupilInstruction") or "(none)"),
             "    model/exact answer: " + beside_teaching.beside_expected_answer(unit),
             "    acceptance boundary: " + str(answer.get("acceptanceCondition") or "(none recorded)"),
             "    answer delivery: " + str(answer.get("delivery") or "(not recorded)")]
    if unit.get("taskStructure"):
        lines.append("    task material: " + json.dumps(unit["taskStructure"], ensure_ascii=False))
    for field, pool in (("successCriteriaRefs", "successCriteria"), ("stickyKnowledgeRefs", "stickyKnowledge")):
        registry_rows = {r.get("id"): r for r in design.get(pool) or [] if isinstance(r, dict)}
        for ref in unit.get(field) or []:
            lines.append("    supplied reference: " + json.dumps(registry_rows.get(ref, {"unresolved": ref}), ensure_ascii=False))
    registry = {r.get("id"): r for r in design.get("representations") or [] if isinstance(r, dict)}
    for use in unit.get("representationRefs") or []:
        if not isinstance(use, dict):
            continue
        config = next((c for c in registry.get(use.get("ref"), {}).get("configurations", [])
                       if c.get("id") == use.get("configuration")), None)
        lines.append("    selected visual state: " + json.dumps(
            {"use": use, "configuration": config}, ensure_ascii=False))
    lines.append("    response materials: " + json.dumps(unit.get("levels"), ensure_ascii=False))
    if unit.get("photoRefs"):
        lines.append("    picture specifications to inspect: " + ", ".join(unit["photoRefs"]))
    lines.append("    Work the least demanding correct response allowed here. Does it contain the "
                 "intended subject work? Check what the pupil actually chooses, draws or uses; "
                 "do not infer a choice already supplied. Apply task-contrasts.md, "
                 "'Test the least demanding successful response too', including its recall and modelling limits.")
    return lines


def main(argv: list[str]) -> int:
    # A Windows console rejects the arrow in a food chain answer; a designer
    # run of 18 October 2026 lost the list to it until it re-ran with -X utf8.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if len(argv) != 1:
        print("usage: do-beats-in-a-row.py <lesson-design.json>", file=sys.stderr)
        return 2
    design = json.loads(Path(argv[0]).read_text(encoding="utf-8"))
    sticky = {
        item.get("id"): flatten(item.get("text") or item)
        for item in design.get("stickyKnowledge") or []
        if isinstance(item, dict)
    }

    beside = {id(row.pupil): row for row in beside_teaching.read_beside(design)}
    owing = 0
    last_teach = ""
    count = 0
    for unit in design.get("teachingSequence") or []:
        if not isinstance(unit, dict):
            continue
        kind = unit.get("kind")
        content = unit.get("content") or {}
        if kind == "teach":
            last_teach = flatten(content)
            continue
        if kind not in {"do", "practise"}:
            continue
        count += 1
        task = content.get("task") or content.get("prompt") or content.get("question") or ""
        told = unit.get("pupilInstruction") or task or content.get("activity") or ""
        form = how_answered(unit)
        label = "practice" if kind == "practise" else f"Do {count}"
        print(f"{label}: {unit.get('label') or unit.get('sourceUnitId')}")
        print(f"  answered as: {form}; told: \"{first_words(told)}\"")
        print("\n".join(response_contract_lines(design, unit)))

        beat_text = " ".join([flatten(task), flatten((unit.get("answer") or {}).get("content"))])
        repeats = shared(beat_text, last_teach)
        if repeats:
            print(f"  also in the Teach just before: {'; '.join(repeats)}")
        for ref in unit.get("stickyKnowledgeRefs") or []:
            printed = shared(beat_text, sticky.get(ref, ""))
            if printed:
                print(f"  also in its star fact ({ref}): {'; '.join(printed)}")
        row = beside.get(id(unit))
        if row is not None and row.total:
            print(f"  the teaching said: \"{row.taught_sentence}\"")
            print(f"  the answer it expects: \"{row.answer}\"")
            print(f"  words of that answer the teaching already said: {row.repeated} of {row.total}")
            if row.declares:
                print(f"  {row.declaration_line()}")
                if row.wrong:
                    print(
                        "  Read the page below beside the wrong answer you named: is that an answer "
                        "the question pulls a child towards, or one only you can see?"
                    )
                fault = row.fault()
                clues = beside_teaching.page_clues(unit)
                if fault:
                    owing += 1
                    print("  THE DESIGN CHECK WILL REFUSE THIS BEAT AS IT STANDS.")
                # The page with the teaching covered: all a child who was not
                # listening has to go on.
                print("  WITH THE TEACHING COVERED, this is the whole page a child reads:")
                print(f"    {' '.join(beside_teaching.stem_text(unit).split())}")
                for option in beside_teaching.task_options(unit):
                    print(f"    [ ] {option}")
                structure = unit.get("taskStructure") or {}
                if structure.get("kind") == "sort":
                    print("    headings: " + " | ".join(str(g.get("label")) for g in structure.get("groups") or []))
                    print("    cards: " + " | ".join(str(i.get("label")) for i in structure.get("items") or []))
                for _refused, sentence in clues:
                    print(f"  ON THE PAGE: {sentence}" + ("" if sentence.endswith("?") else "."))
                if row.practice:
                    print(
                        "  PRACTICE: Attempt the pupil action with this material and support. "
                        "Judge it under `preferences.md` → `Choose Do activities for the learning`: "
                        "what is practised, what remains for the child, and what feedback improves it? "
                        "A practice label does not turn a supplied answer into worthwhile work."
                    )
                elif row.rehearsal:
                    print("  REHEARSAL: Check what this secures and where children then use it; "
                          "do not treat it as independent evidence.")
                else:
                    print(
                        "  Answer it now from that page alone, as the child who heard none of the lesson. "
                        "If you reach the expected answer (a matching word, the only option that is an "
                        "answer at all, a line that says where to look, an instruction that states the "
                        "repair), the page is doing the thinking: change the page and run this again."
                    )
                    half = row.half_listener_line()
                    if half:
                        print(f"  Then answer it once more. {half} Run this again. If they reach the "
                              "wrong answer you named, that misconception is distinguished; also test "
                              "the least demanding correct response in the response contract.")
                    else:
                        print("  Reaching the named wrong answer distinguishes that misconception, "
                              "not every route to a shallow correct response. Check the response contract.")

    if owing:
        print(
            f"DO_BEATS_IN_A_ROW: {count} beats, {owing} to put right before you hand the design "
            "in. For each one marked above: change the task so the taught idea is used on "
            "something the class has not been shown, and write that thing in `use.new` in the "
            "task's own words; or, if saying it back is the beat's job, write why in "
            "`use.rehearsal`; where doing the work is the learning, use `use.practice` alone "
            "and judge the action under `preferences.md` → `Choose Do activities for the learning`. "
            "`validate-lesson-design.py` prints the same faults."
        )
    else:
        print(
            f"DO_BEATS_IN_A_ROW: {count} beats, none refused by the mechanical checks. "
            "This is not a judgement of task quality. Judge the practice under `preferences.md` "
            "→ `Choose Do activities for the learning`, including its feedback and preparation. "
            "Read each `new` beside the "
            "teaching sentence above it as the reviewer will: is it something the class has not "
            "been shown, that the taught idea decides? One answer form across every beat is "
            "fine only where the thinking genuinely suits it."
        )
    whole = beside_teaching.whole_lesson_line(list(beside.values()))
    if whole:
        print(whole)
    for _label, unit in taught_time.lesson_beats(design):
        if unit.get("kind") in beside_teaching.BESIDE_PUPIL_KINDS - {"do", "practise"}:
            print(f"Response task: {unit.get('label') or unit.get('sourceUnitId')}")
            print("\n".join(response_contract_lines(design, unit)))
    print()
    print("\n".join(child_seat(design)))
    return 0


if __name__ == "__main__":
    import utf8_output
    utf8_output.enable()
    sys.exit(main(sys.argv[1:]))
