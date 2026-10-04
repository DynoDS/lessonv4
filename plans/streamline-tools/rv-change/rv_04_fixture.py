"""The design reviewer release, step 4: decision 2's cases join the reviewer's
behaviour fixture (`scripts/tests/fixtures/design-reviewer-behaviour-cases.json`).

Two go back to the lesson designer, each `REDESIGN REQUIRED` with the Lesson
Designer as owner and the reviewer naming the fix rather than making it: a Do
that says its Teach back, and a photograph of a tool the engine draws. The
third, a Teach example written as an instruction to look, stays the reviewer's
own wording fix (`APPROVED AFTER BOUNDED CORRECTION`, owner Design Reviewer), by
his answer of 26 September: asked, with "Look at the diagram." as the example,
whether the reviewer rewrites it itself as what children will notice ("Notice the
enamel is the hardest layer."), he said "yes". The release first sent it to the
designer; this case now holds the other way.

Checked first (the change plan's condition): no existing case gives the two
designer fixes to the reviewer. The cases that end `APPROVED AFTER BOUNDED
CORRECTION` are wording, answer-key and photo-brief corrections; none is a
photographed drawn tool or a Do that says its Teach back. Each forbidden finding
carries the limit its check already has in the reviewer's file, so a case cannot
be read wider than the rule.

The three are appended as text before the array's close, so the rest of the
file keeps every byte."""
import json

from _patch import FIXTURE, read, replace_once

before = json.loads(read(FIXTURE))
ids = {case["id"] for case in before["cases"]}
NEW_IDS = (
    "teach-example-written-as-an-instruction-to-look-is-rewritten",
    "do-that-says-its-teach-back-goes-back-named",
    "photograph-of-a-drawn-tool-goes-back-named",
)
assert not ids & set(NEW_IDS)
bounded = [case for case in before["cases"] if case["expectedResult"] == "APPROVED AFTER BOUNDED CORRECTION"]
for case in bounded:
    text = " ".join(str(v) for v in case.values()).lower()
    for mark in ("engine draws", "drawn tool", "photograph of a number line", "instruction to look",
                 "restat", "says its teach back", "says the teach back"):
        assert mark not in text, (case["id"], mark)
print("the bounded corrections the fixture gives the reviewer:", ", ".join(case["id"] for case in bounded))

CASES = [
    {
        "id": NEW_IDS[0],
        "materialDifference": "A Year 4 science Teach board on the layers of a tooth gives `Look at the diagram.` as its example and names nothing the class will find when they get there.",
        "expectedResult": "APPROVED AFTER BOUNDED CORRECTION",
        "expectedOwner": "Design Reviewer",
        "protectedBehaviour": "An example written as an instruction to look is the example missing; the reviewer rewrites it itself as what children will notice (`Notice the enamel is the hardest layer.`), or takes the line off the board when the picture's own label already names the thing and the key question does the pointing.",
        "forbiddenFinding": "Do not send a line of words back to the Lesson Designer; make the wording fix yourself. A board that honestly lacks a part, with nothing in the script supplying it, is not this finding.",
    },
    {
        "id": NEW_IDS[1],
        "materialDifference": "Straight after a Teach slide saying steam engines let the fair run bigger rides, a Do asks `What did steam engines make possible?` and expects the slide's sentence back.",
        "expectedResult": "REDESIGN REQUIRED",
        "expectedOwner": "Lesson Designer",
        "protectedBehaviour": "A Do whose expected answer says its Teach back changes what children have to think once repaired, so it goes back to the Lesson Designer with the fix named, keeping the chunk: here, ask what the fair would lose without its steam engine.",
        "forbiddenFinding": "Do not make the change yourself; name it. Do not return a quick check on a case the Teach did not show, or a term used on a fresh case when the term's exact wording is the learning.",
    },
    {
        "id": NEW_IDS[2],
        "materialDifference": "A Year 4 rounding lesson asks for a photograph of a number line from 300 to 400 on its Teach slide, a tool the engine draws.",
        "expectedResult": "REDESIGN REQUIRED",
        "expectedOwner": "Lesson Designer",
        "protectedBehaviour": "A photograph of a tool the engine draws goes back to the Lesson Designer, naming the helper that should draw it; adding or removing a photograph is never the reviewer's.",
        "forbiddenFinding": "Do not make the change yourself; name it. Do not return a photograph of a real-world referent (a real measuring jug, real coins, a real shelf label) or a picture the helper check's rescue route produced.",
    },
]


def block(case: dict) -> str:
    body = json.dumps(case, indent=2, ensure_ascii=False).splitlines()
    return "\n".join("    " + line for line in body)


replace_once(
    FIXTURE,
    '      "forbiddenFinding": "Do not treat any model answer in a launch as leakage because it shares the task\'s shape or sentence frame."\n'
    "    }\n"
    "  ]\n"
    "}\n",
    '      "forbiddenFinding": "Do not treat any model answer in a launch as leakage because it shares the task\'s shape or sentence frame."\n'
    "    },\n"
    + ",\n".join(block(case) for case in CASES) + "\n"
    "  ]\n"
    "}\n",
)

after = json.loads(read(FIXTURE))
assert after["cases"][: len(before["cases"])] == before["cases"]
assert [case["id"] for case in after["cases"][len(before["cases"]):]] == list(NEW_IDS)
print("fixture done:", len(after["cases"]), "cases")
