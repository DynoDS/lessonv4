/improving-agents-and-skills

# Rethink the slide designer: could a different approach reach the same slides faster and cheaper?

Daniel asked me to brief you on this. He is a primary teacher, not a developer, and the lesson-v4 plugin in `C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4` makes his lessons. His question, in his words: would the slide designer "do things totally differently but still achieve same or if not better and quicker and cheaper results"?

This is an investigation that ends in recommendations. **Do not change the plugin, the installed copies, or Codex's plugin cache.** Run every experiment in scratch copies. When you are confident, suggest changes and stop. Daniel decides what gets built.

## What we found on 18 October 2026

The slide designer is the slowest worker in a lesson run, about level with the lesson designer.

**Tonight's five Claude runs** were all Year 4 column subtraction (lessons 29 to 33). They took 27, 34, 34, 36 and 38 minutes. In every run:

- reading its guidance took about 2 minutes
- running tools (measuring, previews, the check) took only 4 to 8 minutes in total
- the other 23 to 29 minutes were the model thinking between short steps, spread across 140 to 175 steps rather than a few long pauses
- most of that went on **finding out how a slide will come out**: it read the builder's own source code 8 to 26 times per run (chart drawing, stack sizing, split geometry, criteria panels), then tried roughly 10 to 30 layout variants in measure scripts before one fitted
- the hunt centred on practice slides where a column sum, place-value counters, a box of steps (success criteria) and an answer sentence share one slide

Lesson 29's transcript shows this most clearly: guidance read by minute 2, engine code read from minute 3 to 12, layout trials from minute 12 to 36, the full check passed at minute 37.

**It is not only maths.** Since 10 October, history and science slide designers have also taken 25 to 35 minutes. They try fewer layouts but still read engine code heavily (up to 23 times in one science run). The common thread is that **nothing tells the designer up front how a slide will come out**, so it learns by reading code and by trial.

**One more fact.** The agent file says `effort: high` (uncommitted, changed earlier today from xhigh), but tonight's runs recorded `xhigh`. The change is not installed yet. Treat thinking level as a separate lever, not the answer to this brief. A 15 October test on the lesson designer showed lighter thinking saves time but can thin the work.

### Where the evidence lives

- Claude transcripts: `C:\Users\Daniel\.claude\projects\C--Users-Daniel-Projects-lessonv4\<session>\subagents\agent-*.jsonl`, with `agent-*.meta.json` beside each (its `agentType` is `lesson-v4:slide-designer`). Every assistant record carries a timestamp (UTC), `model` and `effort`. Tonight's five are in sessions starting `155e6567`, `4fb0dcb2`, `d25af487`, `51c63305` and `9b380b6b`. About 68 slide-designer transcripts exist in total.
- Codex records: `C:\Users\Daniel\.codex\sessions\` (rollout files). `plugins\lesson-v4\scripts\worker-launch.py audit` and `timeline` read Codex's record. `scripts\run-record.py` reads Claude's.
- Lesson working folders with each run's `lesson-design.json`, `lesson.json` and friction notes: `C:\Users\Daniel\Projects\lessonv4\working\`.
- Earlier speed work, so you build on it rather than repeat it: `plans\2026-09-29-optimisation-measure.md`, `plans\2026-10-17-streamline-measure.md`, `plans\streamline-plan.md`. Also read Daniel's memory folder `C:\Users\Daniel\.claude\projects\C--Users-Daniel-Projects-lessonv4\memory\`, especially `lesson-33-slow-run-2026-10-17.md`, `speed-profile-and-deferred-gains.md`, `optimisation-step-1-measured.md`, `streamline-s1-slide-designer.md`, `engine-sorts-it-not-refuses.md` and `designer-effort-test-2026-10-15.md`.

### Already tried, so do not re-propose without new evidence

- Telling the designer not to study checker code (29 Sept). It was not adopted: the slowness it targeted turned out to be a test-harness artefact.
- A measure tool that prints which slide rules a draft breaks, and suggests nearby arrangements that fit (17 Oct, uncommitted). It helped only about 1 refused slide in 10.
- A ready-made layout for one kind of lesson. Daniel rejected this tonight because it helps one lesson type and nothing else. Whatever you recommend has to work across subjects.

## What to do

### 1. Understand the job before judging the method

Read the slide designer's role (`agents\slide-designer.md`), what it reads, its check (`builder\scripts\check-slide-design.js`), its measure tool, and the make-lesson skill's slide stage. Write down, in a sentence or two each:

- what the slide designer is for
- what it must hand on
- what a good deck looks like to Daniel

Daniel's rulings in the memory folder are the standard here, more than the code is. The job is to understand the goal well enough to judge whether the current method is the best route to it.

### 2. Review past runs on both hosts

Look across Claude and Codex slide-designer runs, not just tonight's. For each, find where the time and tokens went: reading, engine code, layout trials, checks, repairs.

Look for the general pattern rather than one lesson's story, because a fix shaped around one lesson misfires on the next.

Note where Codex differs. Codex runs this role on `gpt-6.1-sol` at medium thinking. Confirm with `python -I plugins\lesson-v4\scripts\worker-launch.py spec` before relying on it.

### 3. Evaluate the current approach, then think from scratch

Judge how well the current approach serves the goal from step 1. Then imagine designing the slide stage fresh, knowing what you now know. Develop several genuinely different approaches, not tweaks of today's. Possible directions:

- the engine chooses arrangement and sizes from a statement of what a slide holds
- the designer gets a sized catalogue or a rendered contact sheet up front, instead of reading code
- a cheaper worker places slides while a stronger one only judges the result
- slide decisions move into a script with the model as reviewer
- a different split of work between designer, decorator and builder

These are prompts for your thinking, not a menu.

For each approach, say what it would gain and what it would risk. In particular, say what could get worse in the slides Daniel sees.

### 4. Test on Codex

Test your strongest ideas against **previous designs**: real `lesson-design.json` files from past runs, so the input is held fixed and only the slide stage changes.

Run the tests on Codex only, using the role's real model and thinking (`gpt-6.1-sol`, medium). Launch each worker as a direct `codex.exe exec` session. A worker spawned through a controller stores its task encrypted, so its prompt can't be checked afterwards. Work in a scratch copy of the plugin, never the working tree or the cache.

Two practical notes from past runs:
- the Codex sandbox can block the network and refuse renames (see the memory notes on both)
- never run the make-lesson skill inside a subagent

Compare each candidate with a baseline run of the unchanged slide designer on the same design. Use at least two subjects, one of them non-maths. Measure:

- time
- tokens or cost
- check passes needed
- whether the deck passes the full slide check

Look at the slides themselves against Daniel's rulings. Counts alone do not show whether a deck feels right to him; the memory folder has a note on exactly this.

To show Daniel a deck, use the PDF that PowerPoint draws, not the app's .pptx preview, which renders in the wrong font.

### 5. Recommend, then stop

You are finished when you have a written report in `plans\` that:

- shows where the time goes today
- describes the approaches you considered
- gives the test results with the baseline beside them
- ranks your recommendations with honest downsides
- separates what was proved from what is theory

Then walk Daniel through it in chat.

Stop and ask Daniel if you reach a decision that is his to make, for example a recommendation that would change how slides look.

## How to talk to Daniel

He is not a developer, so describe things by their job, never by filename or code. Give him the report's findings one decision at a time, as a conversation:
- what it does now
- what you think
- what you suggest
- then one question for him to answer in his own words, not a list of options to click

Use short chunks with white space between them; dense paragraphs lose him. Never use em dashes or en dashes in anything you write for him.
