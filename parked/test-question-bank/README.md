# Parked: the shipped test-question bank

Removed from the plugin on 20 September 2026 in 4.2.266, and replaced the same
day in 4.2.267 by a route that fetches from `DynoDS/maths-test-question-bank`.

**The route is live again, so nothing here is guidance.** The teaching rules
below were carried into `references/test-question-bank.md`, which is the file to
read and the file to change. What is kept here is the history: the files as they
were when the bank lived inside the plugin, and the reasoning that produced the
replacement.

## What changed in the replacement

- **The bank is outside the plugin**, searched by a shipped index of names and
  fetched one question at a time, exactly as the drawing library is.
- **It is maths only, and that is enforced rather than asked for.**
  `search-test-questions.js` refuses any other subject at the boundary, so a
  history lesson cannot be handed a maths question by a name that happened to
  match on words.
- **Answers come with the question.** The bank carries the exam board's own
  answer beside every question, so the designer no longer works one out from the
  picture. The rule below about working the answer out while the image is in
  front of you is the one piece that did not carry over.
- **The cropping tools stayed parked.** `/add-test-questions`, the
  `question-extractor` agent and `question_crop.py` built the old in-plugin
  bank. The new bank is built in its own repository, so they are history rather
  than tools waiting to be reconnected.

## Why it was removed

The bank was a folder of past-paper questions shipped inside the plugin
(`builder/assets/test-questions/`, 1,992 PNGs). Every instruction that used it
told an agent to browse that folder.

The teacher has removed the equivalent assets from lesson-resources, which
lesson-v4 will eventually merge back into. A bundled bank also repeats the
mistake the drawings library was moved out of the plugin to avoid: assets
committed inside the package live in its git history for ever, and every
install downloads them whether or not anybody uses them.

The replacement is a separate repository, fetched the way the Educational SVG
drawings already are: search a packaged index of file names, fetch only the
handful a lesson actually chooses. Maths first, other subjects in their own
repositories later.

## What is in this folder

| File | What it was |
|---|---|
| `test-question-bank.md` | The reference that taught an agent how to search the bank and choose a question. Was in `references/`. |
| `add-test-questions.md` | The `/add-test-questions` command: took a paper PDF, split long ones across parallel extractors, committed the crops. Was in `commands/`. |
| `question-extractor.md` | The agent that rendered pages, cropped each question, named the files and filed them by strand. Was in `agents/`. |
| `question_crop.py` | The rendering and cropping tool both of the above drove. Was in `scripts/`. |
| `test_question_crop.py` | Its tests. Was in `scripts/`. Needed the `tmp` fixture that was removed from `scripts/conftest.py` with it. |

## What stayed in the plugin, and why

Three things were deliberately left standing, because the new route will need
them and rebuilding them from nothing would be waste:

- **`starter-question-tall`**, the slide template that gives a portrait image
  the slide's full height beside the lesson-opening furniture. Its wording was
  generalised from "test question" to "tall image", but it is the same shape and
  it exists because a tall question crop shrinks past readability under the
  normal starter header.
- **`testQuestionPath`** on the starter source unit, and the validator rule that
  a starter carrying one must have an exact answer-slide answer. The field is
  documented as always `null` while the route is parked, so nothing invents a
  path for it.
- **Practising a Test Question** in `preferences.md`. That section is about a
  teacher handing over a real question from an upcoming assessment, and the rule
  that a held item stays out of teaching while a fresh parallel is built. It
  never depended on the bank.

## The teaching rules worth carrying back

These are decisions the teacher made, not scaffolding. They apply to the new
question source exactly as they applied to the old one, so they belong in
whatever reference replaces `test-question-bank.md` rather than being worked
out again.

**The retrieval target leads, and the bank is searched for it.** Name what the
starter is bringing back (the prior lesson's skill, or the prerequisite today's
objective builds on) before going anywhere near the questions. A bank searched
first and a target fitted to it afterwards teaches whatever the bank happened to
contain.

**Falling back is the correct call, not a failure.** When nothing genuinely
fits the target, or the skill needs several quick reps rather than one rich
problem, an ordinary written starter is right. A near-miss question pressed into
service teaches the wrong thing.

**Why a real question is worth reaching for at all.** A written starter and a
paper question can rehearse the same skill, but only the paper question also
rehearses the format: reading the scale drawn the way the paper draws it,
writing into the answer box the paper uses. That authenticity is the whole
value, and it is why one real question can replace a starter's entire question
list as the "single rich problem" retrieval form.

**It does not change what a starter is for.** The bank is one available
retrieval tool among sorting, matching, correcting, labelling and a written
list. It is not a new kind of starter.

**Look at the picture before choosing.** A file name gets you close; only the
image confirms the skill, the difficulty, and that the question stands alone
without the rest of its paper. Work the answer out while it is in front of you:
the answer slide needs it, and working it through is also the check that the
question is sound for this class.

**Year labels guide difficulty, they do not gate it.** The bank grows unevenly.
Judge by what a question asks, not by which folder it sits in.

**It has to be readable from the back of the room**, like everything else that
goes on the board.

## What the new route changes

Decided with the teacher on 20 September 2026, before the repository existed:

- **File names carry the question.** The search reads a name list and never
  opens an image, exactly as the drawings search does, so a name that does not
  say what the question tests makes it invisible. Names give the skill in a
  teacher's words first, then how the question is presented (table, number line,
  jug scale), then the specific content. Not a transcription of the question:
  hundreds of questions share the paper's own phrasing, so transcribing buries
  the maths and leaves nothing to tell two questions apart.
- **Answers travel with the questions.** One small file beside each question
  holding the answer in words, the marks, and a `sure` / `unsure` confidence
  flag, so no lesson ever works an answer out from scratch and an uncertain
  answer never reaches a board unchecked.
- **The answer slide is the question, marked in green**, pre-drawn once and
  stored beside the question as a second picture, rather than positioned at
  lesson time. Pre-drawing means the mistake is visible to a person before it is
  ever visible to a class. The fallback for questions with no drawn answer is
  the question shown again with the answer in green beside it, which is what
  `starter-question-tall` and `testQuestionPath` were kept for.
