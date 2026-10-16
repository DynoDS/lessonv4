# Several lessons in one request

The teacher has asked for more than one lesson. Each lesson is built by an
ordinary make-lesson run; your job here is to plan the set, start the runs,
report as they move on, and hand back one combined report. You do not conduct
the lessons yourself.

The reason is memory. One lesson run fills most of the chat that conducts it,
so a chat conducting several at once juggles several runs' instructions and
mixes them up, and a run handed to a subagent cannot launch its own workers in
the background, so every step waits on the one before it (2 October 2026).
On Claude Code, each lesson therefore runs as its own background session with
a fresh memory, exactly as if the teacher had opened a chat for it.

`lesson-batch.py` below means `"[PYTHON]" "[PLUGIN_ROOT]/scripts/lesson-batch.py"`,
and `[OUTPUT_DIR]` is the folder an ordinary run would build in.

## 1. Read the request as a set of lessons

A lesson needs a year group, a subject and an objective, or a plan that
supplies them. Give each a short plain tag the teacher would recognise
("subtraction", "food chains").

When the count is plain, carry on. When it is not, say in one line how you
read it and wait for the teacher's answer, because a misread set costs an
hour of usage before anyone sees it. The cases that need that line:

- a pasted plan holding several lessons, where the teacher may want all of
  them or only the next one;
- "make this week's maths", which is several lessons with no objectives yet:
  the teacher's plan supplies them through
  `[PLUGIN_ROOT]/references/lesson-from-plan.md`, so read the objectives from
  it and name them in the line;
- a note about the next lesson inside one lesson's brief, which is context for
  that lesson, not a second request.

For example: "I read this as 3 lessons: subtraction, food chains, Roman roads.
Is that right?"

Settle every lesson's year and subject now. A background session cannot ask
the teacher anything, so a question left for it becomes a guess.

## 2. Choose how the lessons are built

Run `lesson-batch.py route`.

- `BATCH_ROUTE=in-chat`: this host cannot start separate sessions (Codex, a
  computer without the `claude` command, or an account without auto mode).
  Build the lessons one after another in this chat as ordinary runs, in the
  teacher's order, each with its planned save slot from step 3 named as the
  teacher's day. Tell the teacher this in one line, with the
  `BATCH_REASON`, so a slower set is expected rather than a surprise.
- `BATCH_ROUTE=sessions` with `BATCH_AGREED=no`: ask once, in these words or
  close to them: "To build these while you get on with other things, each
  lesson runs on its own in the background in auto mode: ordinary steps go
  ahead without asking you, and a safety check blocks anything risky. I'll
  only ask this once. OK?" On yes, run `lesson-batch.py agree`. It proves auto
  mode starts here; if it prints `BATCH_ROUTE=in-chat`, take the in-chat route
  above and say why in one line. On no, take the in-chat route.
- `BATCH_ROUTE=sessions` with `BATCH_AGREED=yes`: carry on.

Before starting any session, run the setup check in the main chat as the
skill describes (`check-setup.js`), and fix what it asks for here, where the
teacher can see and approve it. A missing library found inside five
background sessions is five failed lessons.

## 3. Plan where each lesson goes

Write `[OUTPUT_DIR]/working/lesson-batch-plan.json`:

```json
{"lessons": [
  {"tag": "subtraction", "year": "4", "subject": "Maths", "brief": "..."},
  {"tag": "food chains", "year": "4", "subject": "Science", "brief": "..."}
]}
```

List the lessons in the order the teacher gave them, because that order is
what puts Monday's lesson on Monday. Each `brief` is the teacher's own words
for that lesson, copied exactly, followed by any words of theirs that apply to
every lesson ("for my Year 4 class, mixed ability"), also copied exactly. The
brief becomes the lesson's `teacher-brief.txt`, which the designer reads as the
teacher speaking, so a reworded brief puts your words in the teacher's mouth.
A plan file the teacher named stays a path inside the brief, as in a single
run.

Run `lesson-batch.py plan "[OUTPUT_DIR]/working/lesson-batch-plan.json" --output "[OUTPUT_DIR]"`.
It lays lessons in one daily subject on consecutive free teaching days and
lessons in one weekly subject on consecutive weeks, because every session
reads the drive as it starts, and with nothing new filed yet they would all
take the same first free day.

- `PLANNED` lines: tell the teacher where each lesson is going, one line
  each, then start straight away, as a single run does: "Tell me if any should
  go somewhere else."
- `OPENING_WEEK`: ask which week, then record the answer with
  `lesson-batch.py set-destination --output "[OUTPUT_DIR]" --tag "<tag>" "<term>" <week> [<day>]`.
- `NO_SLOT`: say so in one line; that lesson starts once the teacher names a
  slot with `set-destination`.

When the teacher redirects a lesson that has already started, let it finish,
then move its saved files to the new place and say where they went.

## 4. Agree the set's thread

Lessons started together cannot read each other, so a lesson cannot keep the
day before's steps the way a single run does: the day before is being written
at the same moment. Each `THREAD <key>: <tags>` line from `plan` is a group in
one year and subject; before those lessons start, one lesson designer writes
what they share (the method steps as they grow day by day, the word cards, the
picture of the method), and every lesson in the group starts from it. Lessons
outside any group, and the in-chat route, which builds in order and reads the
real day before, need none.

Tell the teacher in one line that the set's shared steps are being agreed
first, then launch one `lesson-v4:lesson-designer` per thread, in the
background and all at once:

```text
This is not a lesson design. Write the shared thread for a set of lessons by
following [PLUGIN_ROOT]/references/set-thread.md in place of your design
workflow.

PLUGIN_ROOT: [PLUGIN_ROOT]
PYTHON: [PYTHON]
OUTPUT_DIR: [OUTPUT_DIR]
THREAD: [key]
```

When it returns, run
`lesson-batch.py thread-check --output "[OUTPUT_DIR]" --thread "[key]"`
yourself. On `THREAD_FAULT` lines, send the same designer those lines once. If
the thread still fails, or the designer could not run, start the lessons with
`launch --without-thread` and tell the teacher in one line that the days may
word their shared steps differently.

## 5. Start the lessons and report as they move on

Run `lesson-batch.py launch --output "[OUTPUT_DIR]"`. Every lesson starts at
once: the teacher asked for this many, and the number is theirs to choose. A
lesson whose thread is not yet `THREAD_OK` prints `THREAD_MISSING` and waits;
launch again once it is.

Launching also starts the set's keeper, a plain program that uses no usage.
It alone decides each lesson's state, so a set survives interruptions without
you or the teacher: a lesson counts as finished only once its session has
ended and every file it saved is in its day folder; after a usage limit it
waits until the limit resets, then reopens that lesson's own session so each
stopped helper finishes its job; a lesson that stops for no reason it gives
gets one more go; and a lesson never has two sessions. Do not start, stop or
restart lesson sessions yourself while it runs: a second session on one lesson
overwrites the first one's files.

Then run `lesson-batch.py watch --output "[OUTPUT_DIR]"` in the background.
It returns when the keeper reports something new, and the host wakes you
then; run it again each time until it prints `BATCH_DONE`. Report from what
it prints:

- `STEP <tag>: ...` is that lesson's own update to the teacher. Pass it on as
  one short line in your words ("Food chains: design done, building the slides
  now"). Several lines from one wake go in one message.
- `FINISHED <tag>: saved to <folder>`: "2 of 4 done: food chains, saved to
  Monday."
- `PAUSED <tag>`: "Food chains paused for the usage limit; it carries on by
  itself at 17:11." Nothing is needed from the teacher.
- `CARRYING_ON <tag>`: one line saying it is going again and why.
- `NOT_SAVED <tag>`: the lesson was made but its files did not reach the save
  folder; say why and that the files are in `[OUTPUT_DIR]`. It is not rebuilt.
- `STOPPED <tag>`: it stopped twice before saving; say which lesson, its last
  words, and that the others carry on.
- `WATCH_QUIET`: nothing moved. Start the watch again and say nothing, since
  an update with no news is noise.

Read `status`, never a session's log, when you need the state: a log is a
whole lesson run, and reading several of them is the memory problem this
route exists to avoid.

## 6. Finish

When `watch` prints `BATCH_DONE`, run
`lesson-batch.py status --output "[OUTPUT_DIR]" --final`. It prints each
finished session's final report between `REPORT` and `END_REPORT`. Give the
teacher one combined report:

- one short block per lesson: what was made and where it was saved;
- anything under a lesson's Teacher flags, under that lesson;
- "3 of 4 lessons made", with each lesson that did not finish named and the
  offer to carry it on.

## Carrying on after an interruption

The sessions and the keeper run apart from this chat, so closing it does not
stop them, and a usage limit is waited out without anyone asking; only the
updates stop. When the teacher comes back and asks how the lessons are going,
run `status`: it also restarts the keeper if the computer was restarted, which
carries on any lesson whose session ended. When the teacher asks to carry on a
lesson that `STOPPED` or another that has not finished, run
`lesson-batch.py resume --output "[OUTPUT_DIR]"`: finished lessons, lessons
still running and lessons waiting for the limit are left alone (`LEFT`,
`WAITING`), and each other one carries on from where it stopped. Then watch and
report as in step 5.
