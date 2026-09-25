"""The lead's two last points in the fit release (4.2.289), each settled by
the teacher's own earlier words. Runs after c5c.

1. The criteria cue is a note, never a refusal, the slide designer's own check
   included. Six steps, or 320 characters, on one panel draws
   `SUCCESS_CRITERIA_CAPACITY`, and his success-criteria decisions of 23
   September 2026 made those numbers a cue to look, never a fault ("never fewer
   criteria"; the capacity warning "is a cue to look, not a limit"; "I don't
   think the slide designer reports back. There should be a way to make it
   fit"), as his fit decisions did. 4.2.245 took the cue out of the findings
   `check-slide-design.js` refuses over, but the check's spec-only stage still
   refused on every capacity warning (the `if (capacity.length)` branch), so
   every long list in his style cost the slide designer its repair passes.
   - `builder/src/content/capacity.js`: the criteria cue says it is one
     (`cue: true`).
   - `builder/scripts/check-slide-design.js`: the spec-only stage refuses only a
     capacity warning that is not a cue; a cue is printed as a note beside the
     check's result, pass or fail.
   - `builder/build.js`: the build's own diagnostic for a cue carries
     `faultClass: "note"`, so a check that fails for something else does not
     hand it to the slide designer as a composition fault to repair.

2. A marked list too long even at 16pt never stops the run. Decision 11:
   "There is not a time where I want the PowerPoint slide deck to never be
   produced because of an error." So it passes the lesson check with a plain,
   prominent note, not a refusal; the review page shows it beside the list and
   asks the reviewer to send it back to the lesson designer to tighten, naming
   the fix (his ruling of 24 September 2026: such fixes are the designer's,
   with the reviewer naming them); and if it still reaches the build, every
   slide that shows it is a page for the teacher to check, the rarest case
   (the build already does this, `marked-criteria.js`). The deck is always
   written.
   - `scripts/validate-lesson-design.py`: only an unmarked list too long for
     every panel is refused; a marked one too long even at 16pt draws the first
     `LESSON_DESIGN_NOTE`, and the refusal and its comments say what that costs.
   - `scripts/design-review-packet.py`: the line beside such a list.
   - `references/output-template.md`, `agents/lesson-designer.md`: the cost.

    python -X utf8 plans/streamline-tools/fit-change/c5d_never_a_refusal.py
"""
from _patch import replace_once

CAPACITY = "builder/src/content/capacity.js"
CHECK = "builder/scripts/check-slide-design.js"
BUILD = "builder/build.js"
V = "scripts/validate-lesson-design.py"
PACKET = "scripts/design-review-packet.py"
OT = "references/output-template.md"
LD = "agents/lesson-designer.md"

# ─── 1. The criteria cue is a note ────────────────────────────────────────────

replace_once(CAPACITY, """  if (criteria.length > SC_MANY_ITEMS) {
    out.push({
      signal: 'SUCCESS_CRITERIA_CAPACITY',
      slide: slideNumber,
      field: 'successCriteria',""", """  // Both are a cue to look, never a fault (the teacher's decisions of 10 and
  // 23 September 2026: "never fewer criteria", and the slide designer makes
  // the list fit rather than reporting it back), so each says it is one: the
  // slide check prints it as a note and the build reports it as one.
  if (criteria.length > SC_MANY_ITEMS) {
    out.push({
      signal: 'SUCCESS_CRITERIA_CAPACITY',
      cue: true,
      slide: slideNumber,
      field: 'successCriteria',""")

replace_once(CAPACITY, """  } else if (total > SC_LONG_TOTAL_CHARS) {
    out.push({
      signal: 'SUCCESS_CRITERIA_CAPACITY',
      slide: slideNumber,""", """  } else if (total > SC_LONG_TOTAL_CHARS) {
    out.push({
      signal: 'SUCCESS_CRITERIA_CAPACITY',
      cue: true,
      slide: slideNumber,""")

replace_once(CHECK, """  const capacity = capacityWarnings(lesson);
""", """  // Only a capacity warning that is not a cue refuses a candidate. The
  // criteria cue (six steps, or 320 characters) is a cue to look, never a
  // fault, by the teacher's decisions of 10 and 23 September 2026, and it used
  // to refuse here although BLOCKING_CAPACITY_SIGNALS left it out: every long
  // list in his style cost the slide designer its repair passes. It is printed
  // as a note beside the result instead, pass or fail.
  const capacityAll = capacityWarnings(lesson);
  const capacity = capacityAll.filter((warning) => !warning.cue);
  const cueNotes = capacityAll
    .filter((warning) => warning.cue)
    .map((warning) => `  note: slide ${warning.slide} ${warning.field}: ${warning.signal}: ${warning.message}`);
""")

replace_once(CHECK, """  outcome = withEarly(outcome);
""", """  outcome = withEarly(outcome);
  if (outcome && cueNotes.length) {
    outcome.stderr =
      `\\n${cueNotes.length} slide-design note(s), a cue to look and never a fault:\\n` +
      `${cueNotes.join('\\n')}\\n${outcome.stderr || ''}`;
  }
""")

replace_once(BUILD, """  // How much a slide is being asked to hold. Warnings only: what to cut is a
  // teaching decision, so nothing here shortens or removes anything.
  for (const warning of capacityWarnings(coreLesson)) {
    note(
      `slide ${warning.slide} ${warning.field}: ${warning.message}`
    );
    diagnostic(
      warning.signal,
      'composition',""", """  // How much a slide is being asked to hold. Warnings only: what to cut is a
  // teaching decision, so nothing here shortens or removes anything. A cue
  // (the criteria count) is a note, never a composition fault to repair.
  for (const warning of capacityWarnings(coreLesson)) {
    note(
      `slide ${warning.slide} ${warning.field}: ${warning.message}`
    );
    diagnostic(
      warning.signal,
      warning.cue ? 'note' : 'composition',""")

# ─── 2. A marked list too long even at 16pt passes with a note ────────────────

replace_once(V, """# A list too long even at 16pt could not be drawn at all, so it is refused,
# marked or not, and the designer tightens it at least that far.""", """# A marked list too long even at 16pt could not be drawn at all, and it passes
# too, with a plain note, because the deck is always made: the review page asks
# the reviewer to send it back to be tightened, and if it still reaches the
# build, every slide that shows it is a page for the teacher to check, the
# rarest case. Only an unmarked list too long for every panel is refused.""")

replace_once(V, """def criteria_marker_notes(design: Any) -> list[str]:
    \"\"\"A list marked too long that the check does not find too long: a note,
    never a fault, so the mark and the flag that explains it can come out
    before the teacher reads it.\"\"\"
    if not isinstance(design, dict):
        return []
    notes = []
    for entry in criteria_fit_status(design.get("successCriteria"))["stale"]:""", """def criteria_marker_notes(design: Any) -> list[str]:
    \"\"\"Notes on marked lists, never faults. First, a marked list too long even
    at 16pt: it passes, because the deck is always made, but every slide that
    shows it will be a page for the teacher to check, so it is named first and
    plainly. Then a list marked too long that the check does not find too long,
    so the mark and the flag that explains it can come out before the teacher
    reads it.\"\"\"
    if not isinstance(design, dict):
        return []
    notes = []
    status = criteria_fit_status(design.get("successCriteria"))
    for entry in status["beyond_smaller"]:
        steps, roomiest = entry["steps"], entry["smaller"]["roomiest"]
        notes.append(
            f"successCriteria[{entry['index']}] ({entry['sc'].get('id')}), the list that begins "
            f"\\"{list_opening(steps)}\\", is marked `{MARKED_TOO_LONG}`, but it is too long even at "
            f"{MARKED_FLOOR_PT}pt, the least a marked list is drawn at: {takes_lines(steps, roomiest)} in "
            f"the roomiest criteria panel, the half-width side, which holds {roomiest['holds']} lines "
            f"of about {roomiest['chars']} characters at {MARKED_FLOOR_PT}pt for {len(steps)} steps. Every "
            "slide that shows it will reach the teacher as a page to check before teaching, with its "
            "question, working space and criteria not drawn. Tighten it here, keeping what each step "
            f"tells a stuck child to do, at least until it fits at {MARKED_FLOOR_PT}pt, and better until "
            "it fits at 18pt and needs no mark; the design reviewer is asked to send it back to you. "
            "This is a note; the check passed, because the deck is always made."
        )
    for entry in status["stale"]:""")

replace_once(V, """def validate_criteria_fit_a_named_panel(sc_items: list[Any]) -> None:
    \"\"\"Refuse a steps list none of the panels the guidance names can hold,
    unless the lesson designer, having tried to tighten it, has marked it too
    long and it fits once drawn smaller, down to 16pt: the teacher's decision 11
    is that an error never costs the deck, and a design the validator refuses at
    the end of its repair passes ends the run with none. Every slide that shows
    a marked list then draws it smaller, flagged for the teacher to check. A
    list too long even at 16pt is refused, marked or not.\"\"\"
    status = criteria_fit_status(sc_items)
    unmarked, beyond = status["unmarked"], status["beyond_smaller"]
    if not unmarked and not beyond:
        return""", """def validate_criteria_fit_a_named_panel(sc_items: list[Any]) -> None:
    \"\"\"Refuse a steps list none of the panels the guidance names can hold,
    unless the lesson designer, having tried to tighten it, has marked it too
    long: the teacher's decision 11 is that an error never costs the deck, and
    a design the validator refuses at the end of its repair passes ends the run
    with none. Every slide that shows a marked list then draws it smaller, down
    to 16pt, flagged for the teacher to check; a marked list too long even at
    16pt passes with a note (criteria_marker_notes), and every slide that
    shows it is a page to check.\"\"\"
    unmarked = criteria_fit_status(sc_items)["unmarked"]
    if not unmarked:
        return""")

replace_once(V, """            + ("" if entry["smaller"]["fits"] else
               f" Even at {MARKED_FLOOR_PT}pt it does not fit, so marking it would not let it through.")""",
             """            + ("" if entry["smaller"]["fits"] else
               f" Even at {MARKED_FLOOR_PT}pt it does not fit: marked, it would pass with a note, but "
               "every slide that shows it would reach the teacher as a page to check with nothing "
               f"drawn on it, so tighten it at least until it fits at {MARKED_FLOOR_PT}pt.")""")

replace_once(V, """            "for the teacher that name the list by its words. The check reads only the mark. It "
            f"then lets the list through if it fits at {MARKED_FLOOR_PT}pt, but it costs every "
            "slide that shows the list: each draws it smaller than the 18pt the board allows "
            f"everything else, down to {MARKED_FLOOR_PT}pt, close to the smallest a class can "
            "read from the back of the room, and is flagged for the teacher to check before "
            "teaching. So tighten it if any word can go."
        )
    for entry in beyond:
        steps, sc, roomiest = entry["steps"], entry["sc"], entry["smaller"]["roomiest"]
        said.append(
            f"successCriteria[{entry['index']}] ({sc.get('id')}), the list that begins "
            f"\\"{list_opening(steps)}\\", is marked `{MARKED_TOO_LONG}`, but it is too long even "
            f"at {MARKED_FLOOR_PT}pt, the least a marked list is drawn at: {takes_lines(steps, roomiest)} "
            f"in the roomiest criteria panel, the half-width side, which holds {roomiest['holds']} "
            f"lines of about {roomiest['chars']} characters at {MARKED_FLOOR_PT}pt for {len(steps)} steps."
        )
    if beyond:
        said.append(
            "Tighten it here, where it is written, keeping what each step tells a stuck child "
            f"to do, at least until it fits at {MARKED_FLOOR_PT}pt, and better until it fits at 18pt "
            f"and needs no mark: a list no panel holds even at {MARKED_FLOOR_PT}pt cannot be drawn at "
            "all, and every slide that shows it would reach the teacher as a blank page to check "
            "before teaching. Nobody after you may reword a criterion."
        )
    raise ContractError(" ".join(said))""", """            "for the teacher that name the list by its words. The check reads only the mark. It "
            "then lets the list through, and it costs every slide that shows the list: each draws "
            f"it smaller than the 18pt the board allows everything else, down to {MARKED_FLOOR_PT}pt, "
            "close to the smallest a class can read from the back of the room, and is flagged for "
            f"the teacher to check before teaching; a list too long even at {MARKED_FLOOR_PT}pt "
            "cannot be drawn at all, and each of its slides reaches the teacher as a page to check "
            "with nothing drawn on it. So tighten it if any word can go."
        )
    raise ContractError(" ".join(said))""")

replace_once(PACKET, """    \"\"\"What the review page says beside a criteria list the lesson designer
    has marked too long for every criteria panel, keyed by the list's position.
    A marked list too long even at 16pt never reaches this page: the lesson
    check refuses it.\"\"\"""", """    \"\"\"What the review page says beside a criteria list the lesson designer
    has marked too long for every criteria panel, keyed by the list's position.
    A marked list too long even at 16pt passes the lesson check with a note,
    because the deck is always made; here the reviewer is asked to send it
    back to the lesson designer, naming the tightening (the teacher's ruling of
    24 September 2026: the fix is the designer's, the reviewer names it).\"\"\"""")

replace_once(PACKET, """    for entry in status["stale"]:
        lines.setdefault(entry["index"], []).append(""", """    for entry in status["beyond_smaller"]:
        lines.setdefault(entry["index"], []).append(
            "Lesson check (read this one): no criteria panel a slide is built with holds this "
            "list even at 16pt, the least a list marked too long is drawn at, so every slide that "
            "shows it will reach the teacher as a page to check before teaching, with its "
            "question, working space and criteria not drawn. Return `REDESIGN REQUIRED` and name "
            "the tightening that brings it to 16pt at least, and to 18pt if it can, with every "
            "step still telling a stuck child what to do: the words are the lesson designer's to "
            "change."
        )
    for entry in status["stale"]:
        lines.setdefault(entry["index"], []).append(""")

replace_once(OT, """The check reads the mark and lets the list through if it fits at 16pt, and every slide that shows it then draws it smaller than the 18pt floor, down to 16pt, flagged for the teacher to check before teaching, so it is never a way round tightening. A list too long even at 16pt is refused, marked or not: tighten it at least that far.""",
             """The check reads the mark and lets the list through, and every slide that shows it then draws it smaller than the 18pt floor, down to 16pt, flagged for the teacher to check before teaching, so it is never a way round tightening. A marked list too long even at 16pt still passes, with a note, because the deck is always made, but every slide that shows it reaches the teacher as a page to check with nothing drawn: tighten it at least that far.""")

replace_once(LD, """and a list too long even at 16pt is still refused, so tighten first.""",
             """and one too long even at 16pt reaches the teacher as pages to check with nothing drawn, so tighten first.""")

print("c5d: the criteria cue is a note, and a marked list too long even at 16pt passes with one")
