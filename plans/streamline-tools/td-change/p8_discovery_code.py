"""4.2.285 decision 4: a discovery lesson may discover more than one thing.
Both programs that hold the route shapes change together."""
from pathlib import Path

SCRIPTS = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\scripts")

HELPER = '''

# A discovery lesson may discover more than one thing (the teacher's decision,
# 23 September 2026): one exploration can reveal two findings, each taught and
# used in turn, or a second exploration can build on the first. Either way each
# finding is taught why and then used before the next is taught, which is the
# Teach then Do rhythm inside this route.
DISCOVERY_FIRST_FINDING = ["question", "explore", "make-sense", "teach-why", "use-learning"]
DISCOVERY_FINDING_FROM_THE_SAME_EXPLORATION = ["teach-why", "use-learning"]
DISCOVERY_FINDING_FROM_A_NEW_EXPLORATION = ["explore", "make-sense", "teach-why", "use-learning"]
DISCOVERY_SHAPE = (
    "question, explore, make-sense, teach-why, use-learning, then for each further "
    "finding either teach-why, use-learning (the same exploration showed it) or "
    "explore, make-sense, teach-why, use-learning (a second exploration), then finish"
)


def discovery_shape_is_valid(kinds: list[str]) -> bool:
    first = len(DISCOVERY_FIRST_FINDING)
    if kinds[:first] != DISCOVERY_FIRST_FINDING or len(kinds) <= first or kinds[-1] != "finish":
        return False
    rest = kinds[first:-1]
    index = 0
    while index < len(rest):
        if rest[index:index + 2] == DISCOVERY_FINDING_FROM_THE_SAME_EXPLORATION:
            index += 2
        elif rest[index:index + 4] == DISCOVERY_FINDING_FROM_A_NEW_EXPLORATION:
            index += 4
        else:
            return False
    return True
'''


def patch(name: str, anchor: str, old: str, new: str) -> None:
    path = SCRIPTS / name
    text = path.read_text(encoding="utf-8")
    assert text.count(old) == 1, (name, old[:60])
    text = text.replace(old, new)
    assert text.count(anchor) == 1, (name, anchor)
    text = text.replace(anchor, HELPER.lstrip("\n") + "\n\n" + anchor)
    path.write_text(text, encoding="utf-8")
    print("patched", name)


patch(
    "validate-lesson-design.py",
    "def validate_route_sequence(",
    '''    if structure == "Discovery":
        expected = ["question", "explore", "make-sense", "teach-why", "use-learning", "finish"]
        expect(kinds == expected, f"Discovery sequence must be exactly: {', '.join(expected)}")
        return
''',
    '''    if structure == "Discovery":
        expect(discovery_shape_is_valid(kinds), f"Discovery sequence must be: {DISCOVERY_SHAPE}")
        return
''',
)
patch(
    "lesson-design-scaffold.py",
    "def validate_route_shape(",
    '''    if structure == "Discovery":
        expected = [
            "question",
            "explore",
            "make-sense",
            "teach-why",
            "use-learning",
            "finish",
        ]
        require(
            kinds == expected,
            (
                "Discovery request must be exactly: "
                f"{', '.join(expected)}"
            ),
        )
        return
''',
    '''    if structure == "Discovery":
        require(
            discovery_shape_is_valid(kinds),
            f"Discovery request must be: {DISCOVERY_SHAPE}",
        )
        return
''',
)
