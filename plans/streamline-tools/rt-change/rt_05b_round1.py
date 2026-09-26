"""The routes release, repair round 1 (after `rt-release-check.md`, the lead's six
items), run after `rt_05_code.py` and before the tests, pins and notes that
follow it.

1. His 13b skips only a second model: "count as one seen" (which the routes'
   own rule uses to let a whole launch go) becomes "stand in for the good
   instance, so the launch keeps its case and steps and needs no second model",
   in the home and its three pointers.
2. Criteria stand in for the good one only when they show an actual good one,
   his example being "a writing task whose criteria already show a good
   paragraph", never a list of what a good one includes: said in the same four
   places and in the two output-block lines the words came from. The program
   keeps asking a written explanation for the good instance itself: no criteria
   shape (steps, a reference table, labelled references) holds a written model,
   so it cannot see one, and the pass the first build gave any beat carrying
   criteria goes.
4. (Item 3 is the report's and the log's.) Item 4 is the follow script's.
5. The explaining section other routes read on its own: "the validator refuses
   `null`" is true of a knowledge Teach only, and two "fault above" pointers
   pointed outside the section.
6. The reviewer's launch line takes decision 2's words: a launch is needed when
   the class has not yet seen a good one of this product earlier in this lesson
   (not "when the product's form is new to the lesson"), and a null launch is
   right when children can begin from the question alone or the class has
   already seen a good one earlier in this lesson."""
from _patch import CONTENT, LD, PREF, REV, TASK, VALIDATOR, assert_absent, read, replace_once

OLD_13B = ("success criteria on the board that already show what a good one looks like count as one seen, so the "
           "launch needs no second model")
ACTUAL = ("(an actual good one, such as a model answer or a good paragraph, never a list of what a good one "
          "includes)")
NEW_13B = ("success criteria on the board that already show what a good one looks like " + ACTUAL + " stand in for "
           "the good instance, so the launch keeps its case and steps and needs no second model")

# --- Items 1 and 2: the words, in the home and its three pointers.
replace_once(PREF, OLD_13B[0].upper() + OLD_13B[1:] + ".", NEW_13B[0].upper() + NEW_13B[1:] + ".")
replace_once(LD, "the steps, on the board; " + OLD_13B + " (", "the steps, on the board; " + NEW_13B + " (")
replace_once(LD, "or why its question alone is enough (" + OLD_13B + ").", "or why its question alone is enough (" + NEW_13B + ").")

# --- Item 6 with items 1 and 2: the reviewer's launch line in decision 2's words.
replace_once(
    REV,
    "- a substantial task is launched before it is instructed: when the product's form is new to the lesson or the "
    "enabling input ran to several units, the unit's `launch` carries what the lesson has established, a good instance "
    "beside a weak one, and the steps, and a null `launch` is right only when children can begin from the question "
    "alone; " + OLD_13B + ", and the program cannot see whether they do,",
    "- a substantial task is launched before it is instructed: when the class has not yet seen a good one of this "
    "product earlier in this lesson or the enabling input ran to several units, the unit's `launch` carries what the "
    "lesson has established, a good instance beside a weak one, and the steps, and a null `launch` is right only when "
    "children can begin from the question alone or the class has already seen a good one of this product earlier in "
    "this lesson; " + NEW_13B + ", and the program cannot see whether they do,",
)
assert_absent(REV, "the product's form is new to the lesson")
for rel in (PREF, LD, REV):
    assert_absent(rel, "count as one seen")

# --- Item 2: the two output-block lines 13b came from carry the same limit.
for rel in (CONTENT, TASK):
    replace_once(
        rel,
        "`goodLooksLike` is `null` when the success criteria already show what a good one looks like.",
        "`goodLooksLike` is `null` when the success criteria already show what a good one looks like " + ACTUAL + ".",
    )

# --- Item 2: the program keeps asking a written explanation for the good one itself.
replace_once(
    VALIDATOR,
    """    A launch kept with `goodLooksLike` null passes when its beat carries
    success criteria: criteria on the board that already show what a good one
    looks like count as one seen (his preferences decision 13b). Whether they
    do is the reviewer's to judge, since nothing here can read it.
    \"\"\"""",
    """    His preferences decision 13b lets criteria that already show a good one
    stand in for the good instance ("a writing task whose criteria already show
    a good paragraph skips a second model"), but only an actual good one, never
    a list of what a good one includes. No criteria shape (steps, a reference
    table, labelled references) holds a written model, so nothing here can see
    one, and a written explanation still needs its good instance: a launch pair,
    or an earlier beat that showed one. The words keep 13b for the designer and
    the reviewer. The first build of this check passed any launch whose beat
    carried criteria, and three maths lessons whose rounding steps were attached
    as criteria went through with a one-line launch and no explanation shown.
    \"\"\"""",
)
replace_once(
    VALIDATOR,
    """        if isinstance(launch, dict):
            if launch.get("goodLooksLike") is not None:
                continue
            if unit.get("successCriteriaRefs"):
                continue
""",
    """        if isinstance(launch, dict) and launch.get("goodLooksLike") is not None:
            continue
""",
)
replace_once(
    VALIDATOR,
    '"explanation and its good one is on the board). A child meeting the form for the first "',
    '"explanation and its good one is on the board; success criteria that list what a good one "\n'
    '            "includes are not a good one shown). A child meeting the form for the first "',
)

# --- Item 5: the explaining section, read on its own by other routes.
replace_once(
    CONTENT,
    "Saying the same thing three ways is the fault above; walking the route",
    "Saying the same thing three ways is a fault (this section's last paragraph: the landed sentence again in other "
    "words); walking the route",
)
replace_once(
    CONTENT,
    "which is the same-shape fault above at the level of slides;",
    "which is saying the same thing three ways, at the level of slides;",
)
replace_once(
    CONTENT,
    "So the default is to write it, and the validator refuses `null`.",
    "So the default is to write it, and the validator refuses `null` on a `teach` beat (a task lesson's "
    "`teach-needed` keeps its own rule: `null` only when the idea and its instance already carry the meaning).",
)
assert "fault above" not in read(CONTENT)
print("ROUND1_OK")
