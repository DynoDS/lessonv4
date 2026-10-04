

# The design reviewer release (topic 8, release 2). His decision 7 on the
# reviewer's list (24 September 2026, "2. yes"): three of the reviewer's checks
# send it to a `preferences.md` section for a case the routing card never
# listed, and the card is its whole reading assignment, so none was opened.
# Each trigger now names its case, and each fires on something the reviewer can
# see before judging it (the comment above ALWAYS_READ_REVIEW_SECTIONS: a
# trigger that needs the defect noticed first never fires).
CARD_CASES = (
    (
        "Slide Philosophy",
        "Read its `Lesson Designer content boundaries` too whenever the view's `Names "
        "on the board` lists a real person, place, organisation or event, for `A name, "
        "or a thing the class has never met, arrives with its context`; a made-up "
        "person or a label such as `Chart A` is not this case.",
        "A named person, place, organisation or event, in any subject, is explained "
        "where it first appears on the board",
    ),
    (
        "Lesson Designer visual-need boundary",
        "Read it too whenever a beat quotes, voices or names a made-up person who is "
        "present in it, for `A person the lesson invents counts as something in the "
        "world`; one only referred back to is not this case.",
        "The boundary against the paragraph above is whether a person is present in "
        "the beat or merely referred back to",
    ),
    (
        "Source and Scenario Integrity",
        "Read it too when a made-up person or story stands for a group the objective "
        "is about (`An invented case is evidence about the group`).",
        "**An invented case is evidence about the group, so the question asks about "
        "the group.**",
    ),
)


def _preference_section(heading: str) -> str:
    """A `preferences.md` section, to the next heading at its level or above."""
    lines = PREFERENCES.read_text(encoding="utf-8").splitlines()
    start = lines.index(heading)
    level = len(heading.split(" ")[0])
    end = next((i for i in range(start + 1, len(lines))
                if re.match(r"^(#{1,6}) ", lines[i]) and len(lines[i].split(" ")[0]) <= level), len(lines))
    return "\n".join(lines[start:end])


def test_the_card_opens_the_three_sections_the_reviewers_checks_send_it_to():
    routes = _routing()
    preferences = " ".join(PREFERENCES.read_text(encoding="utf-8").split())
    for heading, sentence, section_words in CARD_CASES:
        # The new case follows the trigger's own words, which stay whole.
        assert routes[heading].endswith(" " + sentence), heading
        # And the section it opens holds what the case needs, limit included.
        assert section_words in preferences, heading
    # Each case names a paragraph that is really in the section it opens.
    slide = " ".join(_preference_section("### Lesson Designer content boundaries").split())
    assert "**A name, or a thing the class has never met, arrives with its context" in slide
    # The name case fires on what that paragraph is about, in its own words,
    # and never on any listed name: most lessons list a made-up child or a
    # label, which the paragraph says nothing about (the first check's item 1).
    assert "A named person, place, organisation or event, in any subject" in slide
    assert "lists a real person, place, organisation or event" in routes["Slide Philosophy"]
    assert "lists a name," not in routes["Slide Philosophy"]
    visual = " ".join(_preference_section("### Lesson Designer visual-need boundary").split())
    assert "**A person the lesson invents counts as something in the world" in visual
    assert "whether a person is present in the beat or merely referred back to" in visual
    sources = " ".join(_preference_section("## Source and Scenario Integrity").split())
    assert "**An invented case is evidence about the group" in sources
    # The earlier triggers are untouched: each new case is a sentence after them.
    assert "or when a substantial task arrives with instructions only." in routes["Slide Philosophy"]
    assert "right to have none." in routes["Lesson Designer visual-need boundary"]
    assert "any beat that invites children's own experience." in routes["Source and Scenario Integrity"]

    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(working_dir)
        result, _preflight, reference = prepare(working_dir)
        assert result.returncode == 0
        card = reference.read_text(encoding="utf-8")
    for heading, sentence, _section_words in CARD_CASES:
        # Printed on the card the reviewer reads, on its section's own line.
        assert f"- `{heading}`: {routes[heading]}" in card.splitlines(), heading


def _names_listed(design: dict) -> dict[str, str]:
    return {
        line[2:].split(":", 1)[0]: line
        for line in packet_module.build_board_names(design)
        if line.startswith("- ") and "first on the board" in line
    }


def test_a_one_word_name_opening_its_board_sentence_is_listed_when_the_script_names_it():
    """The release's second check, item 2: the name case fires on a real person,
    place, organisation or event the list prints, and the list could not see a
    one-word name that opens its board sentence (`England, 1485 to 1603.`,
    `Bruegel painted ...`), which is capitalised there only for being first. A
    word the teacher's script capitalises mid-sentence now counts as known, as
    a word the board capitalises mid-sentence already did."""
    design, _photos = fixtures.valid_content_contract()
    teach = next(unit for unit in design["teachingSequence"] if unit["kind"] == "teach")
    teach["content"]["explanation"] += " England, 1485 to 1603."
    assert "England" not in _names_listed(design)
    # A script that only opens a sentence with the word vouches for nothing.
    teach["speakerNotes"]["script"] += " England was ruled by the Tudors."
    assert "England" not in _names_listed(design)
    teach["speakerNotes"]["script"] += " This farm was in England, near a town."
    names = _names_listed(design)
    assert "England" in names
    assert "first on the board in" in names["England"]
    # The script only vouches for a word the class reads: a name only the
    # script says is never listed.
    teach["speakerNotes"]["script"] += " It was a long way from London."
    assert "London" not in _names_listed(design)
    # A vocabulary slide's script vouches the same way.
    assert "for _anchor, _group, script in vocabulary_introductions(design)" in PACKET.read_text(encoding="utf-8")


# His decision 2 on the reviewer's list (24 September 2026, "1. y"): small
# wording fixes are the reviewer's; a picture swap or a rewritten Do beat goes to
# the lesson designer, with the reviewer naming the fix. Two checks had worded
# those fixes as the reviewer's own. A Teach example written as an instruction
# to look stays the reviewer's own wording fix: asked on 26 September, with
# "Look at the diagram.", whether the reviewer rewrites it itself as what
# children will notice ("Notice the enamel is the hardest layer."), he said "yes".
DESIGNER_MAKES_THE_FIX = (
    "do-that-says-its-teach-back-goes-back-named",
    "photograph-of-a-drawn-tool-goes-back-named",
)
REVIEWER_MAKES_THE_FIX = "teach-example-written-as-an-instruction-to-look-is-rewritten"


def test_the_designer_makes_two_fixes_the_reviewer_names_and_the_reviewer_makes_the_third():
    payload = json.loads(BEHAVIOUR_CASES.read_text(encoding="utf-8"))
    cases = {row["id"]: row for row in payload["cases"]}
    for case_id in DESIGNER_MAKES_THE_FIX:
        case = cases[case_id]
        assert case["expectedResult"] == "REDESIGN REQUIRED", case_id
        assert case["expectedOwner"] == "Lesson Designer", case_id
        assert case["forbiddenFinding"].startswith("Do not make the change yourself; name it."), case_id
    look = cases[REVIEWER_MAKES_THE_FIX]
    assert look["expectedResult"] == "APPROVED AFTER BOUNDED CORRECTION"
    assert look["expectedOwner"] == "Design Reviewer"
    assert "`Look at the diagram.`" in look["materialDifference"]
    assert "`Notice the enamel is the hardest layer.`" in look["protectedBehaviour"]
    assert look["forbiddenFinding"].startswith("Do not send a line of words back to the Lesson Designer")
    # No other case gives the two designer fixes to the reviewer as its own correction.
    for row in payload["cases"]:
        if row["expectedResult"] == "APPROVED AFTER BOUNDED CORRECTION":
            text = " ".join(str(value) for value in row.values()).lower()
            for mark in ("engine draws", "says its teach back"):
                assert mark not in text, (row["id"], mark)


def test_the_report_shape_shows_the_closest_calls_the_check_requires():
    """The shape the reviewer is told to use exactly now carries the lines the
    after-review check refuses a report without."""
    reviewer = (ROOT / "agents" / "design-reviewer.md").read_text(encoding="utf-8")
    shape = reviewer[reviewer.index("Use exactly this report shape:"):]
    shape = shape[shape.index("```markdown"):]
    shape = shape[: shape.index("```\n", 12)]
    lines = shape.splitlines()
    at = lines.index("## Voice sweep")
    assert packet_module.VOICE_SWEEP_RE.match(
        lines[at + 1].replace("[N]", "12").replace("[Y]", "4").replace("[M]", "0")
    )
    assert lines[at + 2] == packet_module.CLOSEST_CALLS_HEADING
    calls = lines[at + 3: at + 3 + packet_module.CLOSEST_CALLS_WANTED]
    assert len(calls) == packet_module.CLOSEST_CALLS_WANTED
    for call in calls:
        assert packet_module.CLOSEST_CALL_RE.match(call), call
    assert lines[at + 3 + packet_module.CLOSEST_CALLS_WANTED] == ""
