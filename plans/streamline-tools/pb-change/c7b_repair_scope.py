"""The playbook release (10A), step 7b: the scope check's second mode (his answer
"yes" to the change plan's question 1, 24 September 2026).

Decision 1 sends a repair that changes what children read to the full creation
role. The compact repairs run a check that refuses new words and also refuses
lost content, so the full role could pass neither half and would have run with
no check at all. His answer: give the check a second mode for the full designer
that lets reworded text through but still refuses anything lost; the quick
repairs keep the whole check. A reworded question counts as a lost string in
the word-by-word comparison, so the new mode compares what can be counted
without the words: the content objects, the questions and cases, the rows of
every table, and the places to write.

`--new-words` is that mode. Without it nothing changes. The lines earlier topics
pin in this file (the words-added question, `additions`, `returned`, the
sent-back functions, the rejoin loop) are untouched."""
from _patch import CRS, replace_once

# The docstring says what the second mode is, beside the five questions.
replace_once(CRS, '''Exit 0 and print ``REPAIR_SCOPE_OK`` when nothing changed that should not have.
Otherwise exit 1 and name everything that did, so one run reports the whole
scope change rather than one piece of it at a time.
''', '''Exit 0 and print ``REPAIR_SCOPE_OK`` when nothing changed that should not have.
Otherwise exit 1 and name everything that did, so one run reports the whole
scope change rather than one piece of it at a time.

    python3 check-repair-scope.py --new-words --before PATH --after PATH

The second mode is for the one repair that is allowed to write words for
children: a full creation role putting an approved redesign's new wording onto
its resource (the make-lesson playbook's Phase 3.5). It could never pass the
questions about words, so it would otherwise run with no check at all. It lets
new and reworded words through, and still refuses anything lost, counted
without the words: a content object, a question or case, a row of a table, or
a place to write. The teacher said yes to exactly that (a second mode "that
lets reworded text through but still refuses anything lost"), and the quick
repairs keep the whole check.
''')

# The census counts the rows of every table, a tally that does not depend on
# the words in them.
replace_once(CRS, '''        self.room: Counter = Counter()
        self.cases: Counter = Counter()''', '''        self.room: Counter = Counter()
        # The rows of every table, counted without their words, for the second
        # mode: a row a child reads or fills in is lost when this falls.
        self.rows = 0
        self.cases: Counter = Counter()''')

replace_once(CRS, '''            if key == "parts" and is_width_split(child):
                continue
            child_channel = channel_of(channel, key)''', '''            if key == "parts" and is_width_split(child):
                continue
            if key == "rows" and isinstance(child, list):
                self.rows += len(child) * times
            child_channel = channel_of(channel, key)''')

# The second mode's comparison, beside the word-by-word one.
replace_once(CRS, '''def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Prove a repair preserved what children work from."
    )
    parser.add_argument("--before", required=True, help="The specification the repair received")
    parser.add_argument("--after", required=True, help="The specification the repair produced")
    args = parser.parse_args(argv)
''', '''def new_words_scope(before: "Census", after: "Census") -> int:
    """The second mode: new and reworded words pass; nothing may be lost.

    Everything here is counted without the words, because a reworded question
    is the job this mode exists for: the content objects by kind, how many
    questions or cases there are, the rows of every table, and the places to
    write with the room in them.
    """
    lost = losses(before.objects, after.objects)
    fewer_cases = sum(after.cases.values()) < sum(before.cases.values())
    fewer_rows = after.rows < before.rows
    short = losses(before.room, after.room)
    if lost or fewer_cases or fewer_rows or short:
        lines = list(lost)
        if fewer_cases:
            lines.append(
                f"questions or cases: {sum(before.cases.values())} before the repair, "
                f"{sum(after.cases.values())} after"
            )
        if fewer_rows:
            lines.append(f"table rows: {before.rows} before the repair, {after.rows} after")
        lines.extend(short)
        report(
            f"REPAIR_SCOPE_FAILED: new words are allowed in this repair, but "
            f"{len(lines)} thing(s) children read, work from or write in did not "
            "survive it:",
            lines,
            "Rewording is this repair's job; losing a question, a table row or a "
            "place to write is not. Put back what went missing and write the new "
            "words into it.",
        )
        return 1
    if not before.objects:
        print(
            "REPAIR_SCOPE_FAILED: no content object was recognised in --before, "
            "so nothing could be compared."
        )
        return 1
    print(
        f"REPAIR_SCOPE_OK: new words allowed; {sum(after.objects.values())} content "
        f"object(s), {sum(after.cases.values())} question(s) or case(s), "
        f"{after.rows} table row(s) and {after.room['targets']} place(s) to write "
        "preserved"
    )
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Prove a repair preserved what children work from."
    )
    parser.add_argument("--before", required=True, help="The specification the repair received")
    parser.add_argument("--after", required=True, help="The specification the repair produced")
    parser.add_argument(
        "--new-words",
        action="store_true",
        help=(
            "a full creation role's repair that puts new words for children on "
            "its resource: new and reworded words pass, and a lost content "
            "object, question, table row or place to write still fails"
        ),
    )
    args = parser.parse_args(argv)
''')

replace_once(CRS, '''    before = Census(without_sheets_sent_back(before_spec, after_spec))
    after = Census(after_spec)

    rejoin_split_sequences(before, after)
''', '''    before = Census(without_sheets_sent_back(before_spec, after_spec))
    after = Census(after_spec)
    if args.new_words:
        return new_words_scope(before, after)

    rejoin_split_sequences(before, after)
''')
print("REPAIR_SCOPE_OK_SCRIPT")
