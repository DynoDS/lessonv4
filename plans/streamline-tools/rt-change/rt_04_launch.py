"""The routes release, step 4: decision 2 (his "y") in words, with his
preferences decision 13b (change plan section 4, "Decision 2").

Decision 2, the suggestion he said yes to: "One rule everywhere: the example is
skipped only when the class has seen a good one earlier in this lesson, and the
check covers big-task lessons and a skills lesson's bigger practice task too."
The code half is `rt_05_code.py`.

- The task route's line that let a launch go when "the product form is familiar"
  (RT-F19) takes the content route's rule (RT-E30); the two output-block lines
  (RT-E70, RT-F34) gain its second case.
- The task route's own trigger for a launch (RT-F18) asked whether children had
  made the form in this lesson, the question decision 2 replaced; it now asks
  whether they have seen a good one. The plan kept RT-F18's words, but his
  decision names the row; his words win, and the report says so.
- 13b, moved here from 7B so the words land with the code: success criteria on
  the board that already show what a good one looks like count as one seen, so
  the launch needs no second model. Written in the home (preferences, Slide
  Philosophy) and, in the same words, in the three pointers (the designer's two,
  the reviewer's one), so no pointer lacks an exception its home carries. The
  reviewer's line also says the program cannot see whether the criteria do show
  one, so the claim is the reviewer's to judge.
- Not here, and named in the report: 7B's B10 writes decision 2's words into the
  three pointers' own trigger and the case-first line (PF settled item 2)."""
from _patch import CONTENT, LD, PREF, REV, TASK, assert_present, replace_once

EARLIER = "an earlier beat of this lesson has already shown the class a good one of this product"
T13B = ("success criteria on the board that already show what a good one looks like count as one seen, so the launch "
        "needs no second model")

# The content route's home rule is unchanged (RT-E30).
assert_present(CONTENT, "Use `null` only when the practice is a set of questions children can begin from the question "
                        "alone, or when " + EARLIER + " (a model answer revealed on the board, or an earlier launch).")

replace_once(
    CONTENT,
    "`launch` is `null` when children can begin from the question alone, and `goodLooksLike` is `null` when the "
    "success criteria already show what a good one looks like.",
    "`launch` is `null` when children can begin from the question alone, or when " + EARLIER + ", and "
    "`goodLooksLike` is `null` when the success criteria already show what a good one looks like.",
)
replace_once(
    TASK,
    "`launch` is `null` only when children can begin from the question alone, and `goodLooksLike` is `null` when the "
    "success criteria already show what a good one looks like.",
    "`launch` is `null` only when children can begin from the question alone, or when " + EARLIER + ", and "
    "`goodLooksLike` is `null` when the success criteria already show what a good one looks like.",
)
replace_once(
    TASK,
    "A task children can begin from its question alone, because the enabling input was one unit and the product form "
    "is familiar, leaves `launch` null.",
    "`launch` is null only when children can begin from the task's question alone, or when " + EARLIER + " (a model "
    "answer revealed on the board, or an earlier launch).",
)
replace_once(
    TASK,
    "or the product has a form children have not yet made in this lesson (a rule, a plan, a paragraph),",
    "or the class has not yet seen a good one of this product in this lesson (a rule, a plan, a paragraph),",
)

# 13b: the home and its three pointers, in the same words.
replace_once(
    PREF,
    "A short beat children can start from its question alone, and a task whose product this lesson has already shown "
    "them a good one of, need none of this.",
    "A short beat children can start from its question alone, and a task whose product this lesson has already shown "
    "them a good one of, need none of this. " + T13B[0].upper() + T13B[1:] + ".",
)
replace_once(
    LD,
    "A substantial task is launched before it is instructed: what the lesson has established, a good instance beside a "
    "weak one, the steps, on the board (`preferences.md` → Slide Philosophy, `Giving a task its instructions is not "
    "launching it`).",
    "A substantial task is launched before it is instructed: what the lesson has established, a good instance beside a "
    "weak one, the steps, on the board; " + T13B + " (`preferences.md` → Slide Philosophy, `Giving a task its "
    "instructions is not launching it`).",
)
replace_once(
    LD,
    "or why its question alone is enough. Writing the board out is the amount check",
    "or why its question alone is enough (" + T13B + "). Writing the board out is the amount check",
)
replace_once(
    REV,
    "and a null `launch` is right only when children can begin from the question alone (`preferences.md` → Slide "
    "Philosophy, `Giving a task its instructions is not launching it`).",
    "and a null `launch` is right only when children can begin from the question alone; " + T13B + ", and the "
    "program cannot see whether they do, so judge that from the criteria beside the task (`preferences.md` → Slide "
    "Philosophy, `Giving a task its instructions is not launching it`).",
)
print("LAUNCH_OK")
