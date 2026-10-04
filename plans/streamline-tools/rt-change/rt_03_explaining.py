"""The routes release, step 3: decisions 3 and 4 (his 3, widened): the teacher's
way of explaining is written once, as how he usually explains anything, and
read wherever something is explained; the launch fields get their own heading
too (change plan section 4, "Decisions 3 and 4").

His words: "thats how i explain anything, so might not neccearily be teach slides
i guess". His starters answer of the same afternoon gives the parts: the because
or so "just to explain that one key point"; "then addressing a misconception or
pointing to an example".

- The content route's output block gains `### How this teacher explains` and
  `### The launch`, at its end, below the reviewer's line. The first holds the
  `explanation` paragraphs (RT-E45 to E63) as they stand after `rt_02`, the
  second the launch paragraphs (RT-E70 to E77); both are moves. The Teach's
  `thinking`, `teachingText`, `keyQuestions` and anchor lines (RT-E64 to E67)
  stay with the Teach, so the section holds only the explaining. Each heading
  sits where `read-reference.py --select` can hand it to another route whole:
  a section runs to the next heading at its level or above, so the two go last.
- The bold sentence (RT-E45) becomes his read-back, and one short paragraph
  above it names the field that carries the explaining in each route and the
  two exceptions, each where it lives.
- Each route points there, keeping its own exception and its own length; the
  designer reads the two sections with the bundled reader when its route is not
  the content route; the reviewer's four-parts line, the walk-through line and
  the preferences' pointer name the heading; the voice guide's §5 gains one
  pointer sentence."""
from _patch import CONTENT, DIAL, DISC, LD, PREF, REV, SKILL, TASK, TV, assert_present, read, replace_once, write

HOW = "### How this teacher explains"
LAUNCH = "### The launch"

# --- The content route: move the two blocks under their headings.
text = read(CONTENT)
crlf = "\r\n" in text
body = text.replace("\r\n", "\n")
assert HOW not in body and LAUNCH not in body
paragraphs = body.rstrip("\n").split("\n\n")


def index_of(opening: str) -> int:
    hits = [i for i, p in enumerate(paragraphs) if p.startswith(opening)]
    assert len(hits) == 1, (opening, len(hits))
    return hits[0]


explain_start = index_of("`explanation` is the teaching, as the child reads it:")
explain_end = index_of("**A Teach has a thought in it, and `thinking` names it.**")
EXPLAINING = ["`explanation` is the teaching, as the child", "**The fourth part: when the sentence",
              "The limit is the wrong idea a later beat", "**The test is a teacher who does not",
              "So the default is to write it, and the"]
assert len(paragraphs[explain_start:explain_end]) == len(EXPLAINING)
assert all(p.startswith(o) for p, o in zip(paragraphs[explain_start:explain_end], EXPLAINING))
explaining = paragraphs[explain_start:explain_end]
paragraphs[explain_start:explain_end] = [
    "`explanation` is written the way this teacher explains: `How this teacher explains`, below."
]

launch_start = index_of("`launch` is `null` when children can begin from the question alone,")
launch_end = index_of("Keep the canonical answer/model/standard in the source unit's structured `answer`.")
LAUNCHING = ["`launch` is `null` when children can begin", "**The instance is whatever the product",
             "**`established` sets the case, not a recap.**", "**`steps` are stages of work",
             "**`difference` is one line a child can", "**The strong instance would meet",
             "**When the task asks children to explain"]
assert len(paragraphs[launch_start:launch_end]) == len(LAUNCHING)
assert all(p.startswith(o) for p, o in zip(paragraphs[launch_start:launch_end], LAUNCHING))
launching = paragraphs[launch_start:launch_end]
paragraphs[launch_start:launch_end] = ["`launch` is written as `The launch`, below, says."]
assert paragraphs[-1].startswith("Keep the canonical answer/model/standard")

# The bold sentence becomes his read-back; the field and the exceptions are
# named once, above it.
OLD_BOLD = ("**The shape this teacher teaches in, more often than not, is four parts in this order, and the board "
            "should read that way unless the beat has a reason not to.** ")
assert explaining[0].count(OLD_BOLD) == 1
explaining[0] = explaining[0].replace(OLD_BOLD, "")
OPENING = (
    "**This is how this teacher usually explains anything, on a Teach board in any kind of lesson or wherever else "
    "something is explained: the takeaway, then a because or so that explains that one key point, then an example or "
    "what it does not mean.** It is how he usually explains, not a template, and the board reads that way unless the "
    "beat has a reason not to. The field that carries it is `explanation` on this route's Teach and on a skill "
    "lesson's `teach`, `activity` on a skill `prepare` in `explanation` mode, `explanation` on a task lesson's "
    "`teach-needed`, `accurateExplanation` on a discovery `teach-why`, and `input` on a dialogic `grounding-input` "
    "when it explains. Two exceptions keep their own shape: a skills lesson's teaching board stays brief "
    "(`teaching-sequence-skill-based.md` → Cycles, and the beats around them), and a discovery lesson lands its "
    "takeaway at the end, because children reach it themselves (`teaching-sequence-discovery.md` → Teach why)."
)
paragraphs += [HOW, OPENING] + explaining + [LAUNCH] + launching
out = "\n\n".join(paragraphs) + "\n"
if crlf:
    out = out.replace("\n", "\r\n")
write(CONTENT, out)

# --- Each route points there, keeping its own exception and its own length.
POINT = "`teaching-sequence-content-based.md` → `How this teacher explains`"
replace_once(
    SKILL,
    "Use these `kind` and `content` shapes for Skill-based teaching.\n",
    "Use these `kind` and `content` shapes for Skill-based teaching.\n\nA `teach` beat takes the knowledge route's "
    "Teach fields, and its `explanation` explains as " + POINT + " says, kept brief on the board as `Cycles, and the "
    "beats around them` says. A `practise` beat takes the knowledge route's Practise fields, and its `launch` is "
    "written as that file's `The launch` says.\n",
)
replace_once(
    SKILL,
    "two or three short lines on the board (what the idea means, why it matters, what it looks like), not a "
    "description of an activity",
    "two or three short lines on the board, the way this teacher explains (" + POINT + "), not a description of an "
    "activity",
)
replace_once(
    SKILL,
    "It takes the full launch its size deserves.",
    "It takes the full launch its size deserves (`teaching-sequence-content-based.md` → `The launch`).",
)
replace_once(
    TASK,
    "`explanation` supplies necessary visible meaning beside the `modelledOn` instance, with completion",
    "`explanation` supplies necessary visible meaning beside the `modelledOn` instance, the way this teacher explains "
    "(" + POINT + "), with completion",
)
replace_once(
    TASK,
    "\"explanation\": \"the teaching of that idea as the child reads it, in two or three short lines: what it means, "
    "why it matters, what it looks like; null only",
    "\"explanation\": \"the teaching of that idea as the child reads it, in two or three short lines, the way this "
    "teacher explains (`teaching-sequence-content-based.md` → How this teacher explains); null only",
)
replace_once(
    DISC,
    "`accurateExplanation` is the explanation as the child reads it, two or three short lines on the evidence they "
    "just saw: what happened, why, what it looks like.",
    "`accurateExplanation` is the explanation as the child reads it, two or three short lines on the evidence they "
    "just saw, the way this teacher explains (" + POINT + "), with the takeaway landing at the end, because children "
    "reach it themselves.",
)
replace_once(
    DISC,
    "\"accurateExplanation\": \"the explicit explanation as the child reads it: two or three short lines on the "
    "evidence, what happened, why, what it looks like\",",
    "\"accurateExplanation\": \"the explicit explanation as the child reads it: two or three short lines on the "
    "evidence, the way this teacher explains (`teaching-sequence-content-based.md` → How this teacher explains), the "
    "takeaway landing at the end\",",
)
replace_once(
    DIAL,
    "Do not use this for substantial factual teaching; that still needs Content-based teaching.\n",
    "Do not use this for substantial factual teaching; that still needs Content-based teaching.\n\nWhen the input "
    "explains something rather than naming it, it explains the way this teacher explains (" + POINT + ").\n",
)

# --- The designer reads the two sections, beside its success-criteria read
# line (the one other place a lesson reads part of another route's file).
SC_READ = ("So whenever your criteria come out as steps and your route is not skill-based, read only the `Writing the "
           "Success Criteria` section of `teaching-sequence-skill-based.md`, not the file. Each step is a clear action "
           "the child performs in the words they would use: `Explain what the electricity does`, never a noun phrase "
           "with the verb buried at the end.\n")
replace_once(
    LD,
    SC_READ,
    SC_READ + "\n**How this teacher explains, and the launch, in every route.** The content route's file writes both "
    "once, and a lesson on another route reads only those two sections, not the file. When your route is not "
    "content-based and the lesson has a beat that explains (a skill `teach` or a `prepare` in `explanation` mode, a "
    "task `teach-needed`, a discovery `teach-why`, a dialogic `grounding-input` that explains), read "
    "`teaching-sequence-content-based.md::How this teacher explains` with `read-reference.py --select`. When it "
    "launches a substantial task (a task `do-task`, a skill `practise`), read "
    "`teaching-sequence-content-based.md::The launch` the same way.\n",
)
replace_once(
    LD,
    "in the order and with the exceptions `teaching-sequence-content-based.md` → `explanation` gives)",
    "in the order and with the exceptions " + POINT + " gives)",
)
replace_once(
    REV,
    "Read each Teach board for the four parts the teacher teaches in (`teaching-sequence-content-based.md` → "
    "`explanation`):",
    "Read each Teach board for the four parts the teacher teaches in (" + POINT + "):",
)
replace_once(
    PREF,
    "(`teaching-sequence-content-based.md` → `explanation` owns the four parts and their exceptions)",
    "(" + POINT + " owns the four parts and their exceptions)",
)

# --- Explanations elsewhere: the voice guide's §5.
replace_once(
    TV,
    "# 5. Explanations and definitions\n\n## Prefer direct explanation",
    "# 5. Explanations and definitions\n\nAn explanation usually goes the way this teacher explains (" + POINT
    + "); that is how he usually explains, not a template.\n\n## Prefer direct explanation",
)

for rel, phrase in [
    (CONTENT, "`Look at her. She isn't being paid to do this.`"),
    (CONTENT, "(1) The takeaway, one sentence, which is the `headline`"),
    (CONTENT, "**The fourth part: when the sentence invites a wrong reading, refuse it on the same board.**"),
    (CONTENT, "At most one boundary line per Teach slide"),
    (SKILL, "In a methods lesson it is brief on the board as well as in time"),
]:
    assert_present(rel, phrase)
print("EXPLAINING_OK")
