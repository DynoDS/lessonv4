# The test-question bank — real paper questions as maths starters

## What it is and why it matters

`DynoDS/maths-test-question-bank` holds 1,915 real maths reasoning questions cropped from past papers, each with the official mark-scheme answer beside it. The plugin does not carry the bank; it ships the index of question names and fetches only the question a lesson chooses.

Each picture is the question exactly as a child will meet it in a test: the same layout, the same answer boxes, the same "1 mark" tag. That authenticity is the whole value. A written starter question and a bank question can rehearse the same skill, but only the bank question also rehearses the *format* — reading a jug scale drawn the way the paper draws it, writing into the answer box the paper uses. When a bank question genuinely hits the starter's retrieval target, prefer it over writing an equivalent question, because the child gets the skill and the format in one rehearsal. One bank question replaces the whole question list for that starter: it is the "single rich problem" retrieval form, already a recognised starter shape.

## It is maths, and only maths

The bank holds maths reasoning questions. It has nothing for history, science, geography, RE or PSHE, and `search-test-questions.js` refuses any subject but maths rather than returning a plausible-looking name that has nothing to do with the lesson. In every other subject the starter is designed as usual, and that is not a limitation to work around.

## The bank serves the starter's existing job

It does not change what a starter is for. The retrieval target still comes first (the prior lesson's skill, or the prerequisite today's LO builds on), and the bank is searched *for that target*. When nothing in the bank fits, or the skill being warmed needs several quick reps rather than one rich problem (number-fact fluency, times-table recall), design the written starter as usual. A near-miss question pressed into service teaches the wrong thing; falling back is the correct call, not a failure.

## Finding one

Name the retrieval target first. The target decides what you search for, not the other way round.

```
node "[PLUGIN_ROOT]/scripts/search-test-questions.js" --subject maths --year <1-6> \
     --query "<the skill in a teacher's words>" --query "<a useful alternative>" \
     --about "<what this starter has to bring back>" --into "[WORKING_DIR]"
```

Searching reads the packaged index and never opens a picture, because a question's file name is its entire description: it says what the question tests, how it is presented and what is in it. The command then brings the shortlist's pictures onto this machine and prints where each one landed.

Add `--strand geometry|measurement|number|statistics` when the target clearly sits in one. Year labels guide difficulty, they do not gate it: the bank grew unevenly, so when a year group answers nothing the search widens to the years either side on its own and says so. Take that widening as information about the question's demand, not as permission to ignore it.

`TEST_QUESTION_NONE_MATCHED` is an ordinary outcome. Design the written starter.

## Choosing one

**Look at the pictures.** The name gets you close; only the picture confirms the skill, the difficulty, and that the question stands alone without the rest of its paper. Read the two or three best candidates with the host's image tool and compare them against the retrieval target you named.

A question that needs the rest of its paper, or that turns on a diagram cropped too tightly to read at the back of the room, is not a candidate whatever its name says.

## Taking it

```
node "[PLUGIN_ROOT]/scripts/search-test-questions.js" --subject maths \
     --take "<the id printed in the shortlist>" --into "[WORKING_DIR]"
```

This brings the question and its answer into the lesson folder and prints the answer as the mark scheme gives it:

```
answer: 300
marks: 1
note: accept 300 written in words
```

**`answer` is the answer, and `note` is for you.** The note carries whatever the mark scheme adds beyond the answer: an alternative that would also be marked right, or the method that earns a mark. It is useful standing at the board with a child who wrote something close, and it never goes on a slide.

You no longer work the answer out yourself. It is the exam board's own answer, which is better than a worked one, so use it as given rather than rephrasing it.

Some questions bring an answer picture as well, `<name>.answer.png`: the mark scheme's own completed table, ticked shapes or finished diagram, for the questions whose answer is shown rather than written. When one arrives, that picture is the answer slide.

## Recording the choice in the Lesson Design

The starter's `content` carries the question's path in `testQuestionPath`, relative to the lesson folder, exactly as the take step printed it. Populate the structured `answer` from the `answer:` line, with `kind: "exact"` and `delivery: "answer-slide"` — a test question always has a definite answer, so the answer slide follows as usual.

Keep the `activity` line describing what children do ("One test question on the board: read the scale, subtract, answer in books"). The slide-designer reads the path, places the image readably, and builds the answer reveal in green from the answer you recorded.

A test question on the board must be readable from the back of the room, like everything else on the slides. `starter-question-tall` exists for a portrait crop, which would otherwise shrink below reading size under the normal starter header.
