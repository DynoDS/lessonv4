# The set's thread

You are writing what a set of lessons shares before the lessons are designed.
This is not a lesson design. The lessons in the set start side by side as soon
as you finish, each in its own session, and none of them can read the others,
because the others are being written at the same moment. A lesson normally
keeps its steps, word cards and picture of the method by reading the lesson
before it; in a set, the lesson before does not exist yet, so the thread you
write stands in for it. Without one, five column subtraction lessons for one
Year 4 week (15 October 2026) worded the exchange step four ways in four days,
dropped the lines Tuesday taught for crossing out and writing the 1, and lost
Monday's `Nothing to take away? Write the top digit.` after Monday. A child
reads a reworded step as a new rule.

## What to read

1. Run `"[PYTHON]" "[PLUGIN_ROOT]/scripts/lesson-batch.py" thread-brief --output "[OUTPUT_DIR]" --thread "[THREAD]"`.
   It prints the file to write, the lessons in teaching order with the
   teacher's words for each, and `PREVIOUS_LESSON` / `EARLIER_LESSONS`: the
   lessons the class had before the set, wherever they were built.
2. Each lesson's objective and plan row, the way a lesson run finds them
   (`[PLUGIN_ROOT]/references/lesson-from-plan.md` for a plan file the teacher
   named). The rows decide what each day adds.
3. `PREVIOUS_LESSON`'s `lesson-design.json`: its `successCriteria`,
   `vocabulary` and `representations`. Read its steps against
   `[PLUGIN_ROOT]/references/teacher-voice.md` → Success criteria as you would a
   list you had just written. Where the set continues its method, a list that
   passes carries on word for word; one that does not is rewritten to that
   standard, and the rewrite is the list from the set's first day on.
4. `teacher-voice.md` → Success criteria in full, and the subject file's
   vocabulary section (`[PLUGIN_ROOT]/references/subject-[subject].md`, when the subject has one), because
   the words you write here go on every slide and wall in the set.

## What to write

One entry per lesson, in the order `thread-brief` printed them, each keyed by
its `key`:

```json
{"set": "Year 4 Maths, lessons 28 to 32", "lessons": [
  {"key": "lesson-29",
   "methodHeading": "How to subtract",
   "methodSteps": ["Line up the digits.", "Write the symbol.", "Start with the ((ones)). Then ((tens)), then ((hundreds)), then ((thousands)).\nNot enough to take away? {{Exchange}}.\nCrossed out? Use the <<new digit>>.\nNothing to take away? Write the top digit."],
   "sometimesLists": [{"heading": "How to exchange", "steps": ["Cross out the digit in <<the next column to the left>>.", "Write 1 less above it.", "Write a 1 in front of the digit that wasn't enough."]}],
   "newToday": "The exchange: its own list, named under step 3.",
   "wallExample": "",
   "wordCards": [{"term": "exchange", "definition": "When you exchange, you swap something for something else that's worth the same, like 1 ten for 10 ones."}],
   "representation": "The written column method, Th H T O, with place-value counters beside the first exchange."}
]}
```

- **`methodSteps`** is the full method list as it stands at the end of that
  day, in the markup a design's `successCriteria` steps use, smaller points on
  their own lines under their step. Each day's list is the day before's with
  only that day's new learning added, so the words a class met on Monday are
  still there on Friday; a line changes only when the day's learning changes
  what it says, and then it changes for every later day. Write it once for the
  set, so a smaller point that Wednesday generalises is worded to hold from
  the day it first appears where the rows show it will grow. Nothing appears
  before the day the plan teaches it. The example above is the shape the
  teacher approved for that week: a short route with what happens only
  sometimes hung under its step, and the exchange, a method of its own, in
  its own list (below). `[]` when a day shows no method list (a
  content lesson about why the Vikings came has none).
- **`sometimesLists`** and **`methodHeading`**: a method only some questions
  need, with steps of its own, is a list of its own and never a numbered step
  of the main list (`teacher-voice.md` → Success criteria, `A method only some
  questions need`; the teacher, 16 October 2026, when the exchange had been
  packed under step 3). Write each such list as
  `{"heading": "How to exchange", "steps": [...]}` in `sometimesLists`, give
  the main list its heading in `methodHeading` (`"How to subtract"`), and let
  the main list's smaller point name it in a few words
  (`Not enough to take away? {{Exchange}}.`). The day-by-day rule above holds
  for these lists too. Leave both out when the method has no such part.
- **`newToday`**: what that day adds to the list, in a sentence, so its
  designer knows which line its teaching is for. `""` when it adds nothing.
- **`wallExample`**: the working wall. A day whose lists match the day
  before's copies that day's wall sheet; a day whose lists change gets that
  sheet with its new step added. Some days keep the steps but teach a kind of
  sum the earlier sheet's example does not show, and a child stuck on it looks
  up at the wall for one that does: in the subtraction week (18 October 2026)
  Wednesday taught a column that gives an exchange and then needs one itself,
  with nothing new on the list, and the teacher wanted the sheet's
  one-exchange example swapped for one showing that. On such a day, say in a
  few words what the example must now show (`"an exchange in two columns, one
  straight after the other"`), never the numbers, which stay the wall's own
  choice. `""` when the earlier example still shows the day's work: a
  practise day, a day with a new step (its sheet already changes), the first
  day of the set.
- **`wordCards`**: a word that more than one day puts on a card, with the one
  definition every day uses. Leave out words only one day uses: that day
  chooses its own.
- **`representation`**: the picture of the method or idea the days share, so
  the board and the wall look the same across the set. `""` when the days share
  none.

The thread holds only what has to read the same every day. Starters, examples,
numbers, activities and the shape of each lesson stay each day's own decision,
made with the day's own design work, so leave them out even where you can see
a good one. A set whose lessons share nothing (the same subject, but unrelated
topics) gets entries with empty fields, which is a correct answer, not a
failure.

## Finished

Write the file `thread-brief` named, then run
`"[PYTHON]" "[PLUGIN_ROOT]/scripts/lesson-batch.py" thread-check --output "[OUTPUT_DIR]" --thread "[THREAD]"`
and repair until it prints `THREAD_OK`. Reply with that line and, per lesson,
its key and the number of steps in its list.
