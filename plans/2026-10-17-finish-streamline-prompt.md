/improving-agents-and-skills

I want you to streamline the Lesson V4 plugin as it is today, version 4.2.325, and fix whatever it needs: each rule written once, in the place its decision is made, with nothing I asked for lost. An earlier streamline stopped on 26 September. Use its method and what it learned, but work from today's files, not from its old lists.

WHAT I AM TRYING TO ACHIEVE
My words from 22 September: "I want it optimized so it makes the files smaller. It makes the reading less. It makes it more focused. But without dropping things, without removing some random feature that I like... Every rule's there for a reason." Both halves count. A shorter file that loses a rule is a failure however clean it reads, and earlier tidy-ups did exactly that while reporting that nothing had changed.

WHY NOW
On 17 October a chat checked whether rules really repeat. They do. "A worked example is purple" is written in 5 files the slide designer reads, and the rule for a question slide and its answer slide is written 4 times inside one file. The files have also grown since the streamline paused at version 4.2.293: 44 releases later (now 4.2.325) the preferences file has gone from about 237 KB to 292 KB, the slide templates file from about 292 KB to 380 KB, and the slide designer's own file from about 61 KB to 79 KB. The slide designer reads from about 1 MB of guidance.
That chat also found that the repeats were not why the slide designer read the engine's code that night: every rule it looked up was written down. That problem has its own fix, built and uncommitted (see ABOUT THE REPO). So this job is about size, focus and one copy per rule, not about that incident.

THE EARLIER STREAMLINE, AND WHY ITS LISTS ARE NOT ENOUGH
The plan from that streamline is C:\Users\Daniel\Projects\lessonv4\plans\streamline-plan.md. Read it whole first. Its goal, its rules for every topic, its method and its "What the rounds have taught" list all still apply. Its topic table and ledgers describe the plugin as it was on 26 September.
Since then I have added many rulings from real lessons (criteria on the board from the first worked example, two criteria lists, counters beside the sum, word card placement and more), and none of them is in those ledgers. A fold built from an old ledger would quietly drop them. So every list you build comes from today's files. Use an old ledger only to check you have not missed something it found.

THE JOB
1. Read the plan, and the memory notes and guides listed below.
2. Measure today's plugin before proposing anything: for each worker, what it actually reads on a normal run (its own file plus the references it is told to open), in bytes, and where the true repeats are. The plan's "Where shorter comes from" section explains why a copy that carries its own condition is not a repeat.
3. Propose the order of work, piece by piece, with honest byte estimates for each. Start with the slide designer unless the measurements say otherwise, because it is the slowest step in every maths lesson and reads the most.
4. For each piece, in turn: build its list from today's files, have a fresh agent check the list, show me every decision for that piece in one message, then make the changes my answers allow, have two independent fresh agents check old against new rule by rule, run every test suite, and tell me plainly what changed and how many bytes it saved, even when the number is small.
5. Then move to the next piece.
Nothing changes in the plugin for a piece until I have answered its decisions. Keep the plan's topic table and lessons list up to date as you go, so a later chat can carry on if this one runs out of room.

MY EARLIER RULINGS, READ THESE FIRST
Some of what you find may be there because I asked for it. Read these before you form a view (they are in C:\Users\Daniel\.claude\projects\C--Users-Daniel-Projects-lessonv4\memory\):
- streamline-without-losing-rules.md (the whole streamline story, and what each release taught)
- consolidation-commits-thin-guidance.md (how past tidy-ups lost rules while saying they had not)
- decisions-batched-when-many.md (how I want a queue of decisions asked)
- one-reviewer-no-caps-no-room-theory.md (no number caps on content, and why)
- MEMORY.md, for my rulings since 26 September. Each is a rule that now lives somewhere in the plugin and must survive the fold.
Also read C:\Users\Daniel\.claude\skills\prompting-tips\SKILL.md, and the "Control growth", "Preserve meaning when editing" and "Place and route the change" sections of C:\Users\Daniel\.claude\skills\improving-agents-and-skills\SKILL.md.

HOW TO ASK ME
Put every decision in one message, numbered. Each one says what the files say now, what you think, what you suggest, and one plain question, and "yes" means take your suggestion, so I can answer "1 yes, 2 no: ...". Use plain English with a classroom example where it helps, no file or code names, short lines, and no em dashes anywhere, including in any plugin text you write. When you are not sure whether something matters, it stays, and it becomes a question for me.

ABOUT THE REPO
- The live plugin is C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4 (never the teaching-plugins copy). It is at 4.2.325, committed and pushed.
- There is other chats' unfinished work in the folder, all uncommitted. One chat taught the quick sizing check to report rule problems slide by slide (builder\scripts\measure-slides.js, builder\scripts\check-slide-design.js, agents\slide-designer.md and a new test, builder\test\measure-reports-slide-rules.test.js). Another added "arrangements that would fit" to the same sizing check, plus changes in builder\src\content\steps.js and references\templates.md, and a test, builder\test\measure-names-arrangements-that-fit.test.js. Treat that work as part of today's plugin: never revert it, and when a file you streamline holds some of it, keep those lines and their meaning like any other rule. Run git status before any commit, stage only your own work, and tell me first when a file holds both yours and another chat's, because then one commit would carry both.
- Do not commit, push, or install into Codex or Claude Code unless I ask. An install copies the whole folder, other chats' unfinished work included.
- Many rules are pinned by tests (the ledger pin files under scripts\tests\). Folding a copy means moving its pin in the same release. The plan explains how, and which record builders are frozen.
- Do not run a whole lesson to test anything without asking me first.
