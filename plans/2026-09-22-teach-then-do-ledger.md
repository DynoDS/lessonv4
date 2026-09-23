# The Teach then Do rhythm: rule ledger (streamline topic 3)

Step 1 of the streamline method in `streamline-plan.md`, for one topic only:
the Teach then Do rhythm. Nothing in the plugin was changed to make it, and
nothing is committed.

**Status (22 September 2026).** Inventory written, then checked by a fresh
agent (`streamline-tools/teach-then-do-inventory-check.md`); every verified
finding is in the rows below. The decisions have not yet been put to Daniel.

**After the change (4.2.285, 23 September 2026).** The quotes below are the words at the snapshot, so `check-ledger-quotes.py` now reports every changed row and every line number the change shifted; `2026-09-23-teach-then-do-mapping.md` says where each changed row went, and `td-change/build_td_mapping.py` checks those homes.

**Snapshot.** lesson-v4 4.2.284, commit `3de9c956`. Line numbers are the line
in that commit where the quote starts. Every «quoted» passage is the file's own
words; `streamline-tools/check-ledger-quotes.py` confirms each one exists in
the file named in its Where column.

**What counts as the rhythm here.** The lesson's load-bearing shape and the
pairing of each Teach with the Do that uses it: one idea per Teach and then
back to the children; every Teach followed by a beat where every child uses
the idea, not a question to the room; the Do practising the move its own Teach
taught; naming what a chunk needs children to do with it before choosing the
activity; choosing the material and the thinking together; orientation not
being automatically a Teach chunk; a beat carrying a second job; runs of
teacher-only beats; variety across Do beats; how each route (content,
discovery, dialogic, skill-based My Turn / Our Turn / Your Turn, task-centred)
states or varies the rhythm; and each major beat changing the state of the
lesson, with the links between beats read in the actual content.

**What belongs to a neighbouring topic.** The per-beat `thinking` and
`unlocks` lines belong to "What a Lesson Is For" and the lesson spine; they are
listed here as shared. What children are assumed to already know, and what
makes a quick check genuine (fresh cases, the restatement test, the "name it as
a check" excuse, a check before independent practice), are the two topics
running beside this one: their rows are listed as shared and not proposed for
moving. Vocabulary is finished and pinned by
`scripts/tests/test_vocabulary_ledger_is_kept.py`; several sentences in the
rhythm section are among its pins (TD-B04, TD-G03 and others), so they are
listed as shared with vocabulary. The Do-beat catalogue's individual formats
are listed only where they state a rhythm rule.

## How to read a row

| Column | Meaning |
|---|---|
| ID | `TD-` then a group letter and a number. Groups: A the shape and why it holds, B one idea per Teach and what counts as one idea, C every child uses it (the Do half), D the Do uses what its own Teach taught, E deciding the Do (what the chunk needs, thinking first, material and thinking together), F variety across Do beats and demand across the lesson, G each beat changes the state of the lesson (links, claims, building a set), H a beat with a second job and runs of teacher-only beats, I orientation, J how each route states the rhythm (numbered in blocks: J01 to J07 every route, J10 to J29 skill-based, J30 to J39 content, J45 to J48 Discovery, J55 to J65 Dialogic, J70 to J78 task-centred; rows added after the independent check took the free numbers J40 to J43 (skill), J44 and J49 (content) and J50 and J51 (Discovery)), K the subject files, L what the design reviewer checks, M recording fields shared with the lesson spine, N the slide side, Z shared rows owned by another topic. |
| What the agent is told | The rule's own words. Several «quotes» in one row are separate sentences of the same rule. |
| When it applies | The condition, and any exception the text gives. |
| Strength | **must** (never, always, only, or refused by code), **default** (normally, usually, prefer), **may** (a permission), **check** (a test or tell the agent runs), **mechanics** (how to record or build it). "Code" means a program refuses the lesson when it is broken. |
| Code names | Field names, markers, messages or headings a program or test depends on. These cannot change without the code. |
| Where | The file, its section and line. The primary row of a rule also lists its copies. |
| Kind | rule; your example (how the agents learn your taste); your ruling (your words); duplicate of another row; near-duplicate, with what it adds; contradiction (a numbered decision below); story (a dated incident); pointer (tells the agent to read something else); maintainer (for whoever edits the plugin, not the agent); stale (no longer matches the code or the rest of the text); shared (another topic owns it; listed so nothing is lost); code. |
| Proposed home | Where the one kept copy would live. A proposal only: see decision 1. Codes: **PREF-RHY** preferences.md → The Teach → Do → Teach → Do Rhythm; **LD-RHY** the lesson designer's own Teach → Do Rhythm section, kept for recording `unlocks`, `thinking` and `minutes` and the instruction to read PREF-RHY; **LD** stays where it is in the designer's file (the design order, the walk-through, the completion pass); **SKILL**, **CONTENT**, **DISC**, **DIAL**, **TASK** that route's own file; **SUBJ** its subject file; **DOB** do-beats.md core notes; **EVID** evidence-synthesis.md (evidence, not a rule home); **REV** design-reviewer.md; **RC** design-review-route-checks.md; **SD** slide-composition-playbook.md; **LOG** build-review-log.md; **CODE** a program, changed only with its tests; **STAYS** stays where it is because another topic owns it. |

## What the list shows, in short

- **309 places** in 29 files say something about the rhythm. **32** repeat a
  rule written elsewhere, **55** repeat one while carrying an extra condition,
  example or strength of their own (marked "near-duplicate" or "plus:"), and
  **50** belong to a neighbouring topic and are listed as shared. An
  independent check (`streamline-tools/teach-then-do-inventory-check.md`)
  found 35 missed rules, 17 "duplicates" that were not, and 11 pulls this list
  had not raised; each was verified against the files before it went in, and
  what was not taken is listed at the end.
- **The core rules are written many times over.** "A question to the room is
  not a Do" is written in about 15 places (five of them the subject files'
  Do-beat lists, three the subject files' "not only the confident speakers");
  "one idea per Teach, then children use it" in about 17; "each beat changes
  the state of the lesson" in about 17, three of them on the slide side; variety
  across Do beats in about 16; the pairing rule (the Do uses its own Teach's
  idea) in 9, four of them in other words inside the routes' `thinking`
  guidance; the orientation rule in 7.
- **The home is big, and it is repeated twice more.** The preferences section
  is about 27 KB. The lesson designer's own rhythm section (about 10 KB)
  restates most of it in clipped form beside the recording rules for
  `unlocks`, `thinking` and `minutes`, and also holds the designer's only copy
  of "a substantial task is launched before it is instructed" (Z19). The
  content route file restates the rhythm a third time.
- **Some rules live in only one place, and a fold must carry them:** the three
  repairs for a stray second job (H02) and a caveat meant for the children as
  its own beat (H07); "every beat earns its place against the objective" and
  the "what was today about" check (I02), whose "cut" has three written limits
  elsewhere (I09 to I11); what counts as one concept in a skill lesson (B14,
  B15); the "three explanation Do beats in a row" trigger (F03, content only);
  register is not demand (F07); the five-minute guide on uninterrupted
  explanation (A09); the "same job twice" and "two jobs in one beat" checks
  (G15, H03); a Teach may lead straight into the Practise that uses it (J33);
  what follows an early Practise (J44, and only L13 makes it a defect); a
  comparison runs side by side (K24 to K26); and a whole practical-lesson shape
  that sits in the voice guide (A11).
- **Eleven things pull against each other or against the code** (decisions 2
  to 6 and 8 to 12): teacher-only runs; scene-setting in a knowledge lesson;
  Discovery's single explanation; activity-list entries that break the rhythm;
  what the reviewer reads; a question to the class against the teacher
  choosing hands up; a check that reads a field the template leaves empty;
  sort-then-explain as one beat or two; challenge-first practical lessons; and
  whether a discussion lesson's summing-up is compulsory.
- **About ten pieces of text are out of date, misleading or written for a
  maintainer** (decision 7).
- **The code enforces each route's order of beats twice** (the validator, and
  the scaffold's own copy, held together by a test), but none of the judgement
  rules: every child committing, the Do using its own Teach's idea, one idea
  per Teach, variety, orientation, a second job, or runs of teacher-only beats.
- **Tests pin a phrase in 125 rows** (and match another 12 only through a
  section name). They also pin order: two sentences of the rhythm section, two
  of the content route and the designer's reading line must keep their order.
  The vocabulary pins hold sentences from 13 rows in their present sections,
  three of them in the skill route below the line the reviewer never reads
  (decision 6).

## Decisions taken (23 September 2026)

Daniel answered all twelve in one message. His words first, then what each
means for the change.

1. "Agree."
2. "We shouldnt outright ban 2 teach slides one after the other, especially
   when the slide designer is told to break heavy slides into more than one
   and other situations where it may be best decision. What it cannot do
   though is teach them something, then teach them something different,
   because You can then forget that first thing. The whole point is you teach
   children something and they do something immediately with that information
   before you teach them more things. It's cognitive overload, 101." The
   suggestion is taken, with his reason: the fault is a second new idea taught
   before children have done something with the first. Two teacher slides in
   a row carrying one idea (a heavy slide split, or another case where it is
   the best decision) are fine.
3. "It should never be a beat with a made up task after it, of course. The
   whole point of scene setting is just to make it familiar to the children.
   Rather than jumping straight into something abstract or something
   unfamiliar or something that makes no sense. What's the purpose of it?
   Children need to see things. They need to know things. They need to know
   the purpose of things. It doesn't have to be its own slide. It could if it
   makes sense. I just don't want to jump into something completely random
   where any human thinks, whoa, where did this come from?" Scene-setting
   exists to make the topic familiar and show children what it is and what it
   is for before anything abstract or unfamiliar. It may be its own slide or
   the opening of the first Teach, as the designer judges; it is never a beat
   with a made-up task after it. His reason goes into the rule.
4. "really understand this one. If we want them to discover two things, then
   isn't the whole point of a discovery lesson giving them a task to discover
   that thing? Whether that's a task that gets them to discover both at the
   same time, or whether the lesson designer thinks it's better to discover
   one thing in one task and then something else in a different task and it
   builds on." The suggestion (turn it into a knowledge lesson) is not taken.
   A discovery lesson may discover two things: one task that reveals both, or
   two discovery tasks in sequence, the second building on the first, as the
   designer judges. The validator's discovery shape changes to allow a second
   explore-then-explain cycle, with its tests. This reading was stated back to
   him.
5. "Agree."
6. "Agree,"
7. "Agree,"
8. "Agree,"
9. "Agree,"
10. "I think so." The suggestion is taken.
11. "Agree."
12. "Agree."

### Second round (23 September 2026), his replies to the read-back

- 2. "Agree." Settled as read back.
- 3. "Yes." Then, in full:
  "I don't know if I need to say more. Basically, what I do sometimes is I go
   to a random slide and I read it. I better understand what it's doing and
   why. And if not, I better be able to go back one or two slides and go, oh,
   okay, yeah, that's why it's doing it. That's the story. It should never be
   just introducing something completely off that f not even off, because
   obviously the lesson designer does it for a reason, but it just feels
   random. And to ch children, it just feels random. Children need to be there
   with you, learning, not listening to something completely random and
   trying to understand that. And it's not always just anything abstract.
   Maybe that's too much of a constraint. Like the in that history one... The
   Elizabeth First Order just appeared. There was nothing about who Elizabeth
   First was. There was nothing about uh, what an order is or that governments
   use orders and, and what they're for. There was nothing to do that. It's
   just bang, historical source and questions about it. And for a year nine
   class, sure, they know what an order probably is. But for a year one, two,
   three, four, five, six class... They're just met with it for the first time
   that there's some magical piece of writing called an order that someone
   from history made. That's all they get from that, really. They don't get,
   oh, an order is this, and they're written because of this, and the
   government want to do this, and the government are these kinds of people
   who make these kinds of decisions. They don't get any of that. They just
   see there's some words that, that the teacher's called order."
  Settled, with the read-back widened: scene-setting is not only for
  something abstract ("Maybe that's too much of a constraint"). The test is
  his random-slide test: any slide read on its own shows what it is doing and
  why, or going back one or two slides shows it. Nothing arrives feeling
  random to the children. The rest of the read-back stands (its own slide if
  that makes sense, or the opening of the first teaching slide; never a
  made-up task after it; his reason goes into the rule).
- 4. "Agree" Settled as read back: a discovery lesson may discover two things,
  one task revealing both (then teach and use each in turn) or a second task
  building on the first; the checking program changes to allow it.
- 10. "Agree" Settled.

### Open questions answered (23 September 2026)

His words, in one message: "1. Yes thats fine, sometimes it doesnt always have to be a full slide, sometimes just a note on slide is fine. 2. agree 3. keep". So: (1) the scene stays the opening of the first Teach, on its own slide only when the first board would be too full, and a note on the slide is often enough; letting the designer ask for a scene slide waits for the slide-designer topic, if ever. (2) A discovery lesson may discover any number of things, each taught and used before the next. (3) The reviewer keeps reading the whole rhythm section every review.

### Open questions from the change (23 September 2026), as they were put to Daniel

1. **The scene on a slide of its own.** His words: "It doesn't have to be its own slide. It could if it makes sense." The Slide Designer splits a Teach only when its board is too full, and the designer has no way to ask for a split, so the rule now says the scene gets its own slide "when the first board would otherwise be too full". Question: should the designer be able to ask for the scene on its own slide even when the board would fit (a small change to the designer's contract and the Slide Designer's split rule)?
2. **How many things a discovery lesson may discover.** He said two; the code and the route allow any number, each taught and used before the next. Question: keep it open, or limit it to two?
3. **The reviewer's reading.** Decision 6 put the rhythm on the always-read list "after the fold makes it shorter"; the section grew from about 27 KB to 32 KB with his new decisions. Question: keep it always read?

## Decisions for Daniel

Twelve for this topic, then three that belong to later topics. "Yes" to any
of them means take the suggestion.

1. **One home for the rhythm, losing nothing.**
   - **What it says now:** The Teach then Do rules are written in your
     preferences, again in shorter words in the lesson designer's own
     instructions, and a third time in the knowledge-lesson route. Some rules
     live in only one place: how to rehome a stray job, a warning meant for the
     children taught as its own beat, the check "could a child say what today's
     lesson was about after every beat?", what counts as one concept in a
     method lesson (split by what the child produces, not by direction), the
     "three explain-it Do beats in a row" check, and the "same job twice" and
     "two jobs in one beat" checks. The designer's rhythm section also holds its
     only copy of "a big task is launched, with a good example beside a weak
     one, before it is set". And the rule "cut a beat that serves nothing" has
     three written limits elsewhere: a brief interesting fact can earn its
     minute, enrichment can be worth knowing for its own sake, and the teaching
     must not be made thin.
   - **What I think:** Same as vocabulary. The designer reads your preferences
     section anyway, and three copies in different words is where they drift.
     But a fold only works if nothing is left behind, so each one-place rule and
     each limit has to travel with it.
   - **What I suggest:** Your preferences rhythm section holds each rule once,
     carrying every extra condition the other copies hold. "Cut" moves only
     together with its three limits. The designer's own section keeps how to
     record each beat (what it unlocks, the thought, the minutes), the
     instruction to read your section, and its launching sentence, which is not
     part of the rhythm and has nowhere else in the designer's reading. Each
     route keeps its own shape and points back; the subject files keep their
     own Do-beat lists; the contents line names everything the section holds.
     One honest note: the reviewer only opens the rhythm section when something
     triggers it (decision 6), so moving a check there does not by itself put
     it in front of the reviewer.
   - **Question:** Shall the rhythm live in one place like this?

2. **Two teacher-only slides in a row: always a fault?**
   - **What it says now:** Your preferences call "a run of slides that are all
     the teacher talking" a warning sign, and a test holds those exact words.
     The reviewer's instructions call any run of teacher-only beats a fault
     that sends the lesson back, with no exceptions, and its reading trigger
     fires at just two. Yet your own Tudor boards are two teacher slides in a
     row for one teaching beat (board 1 sets the scene, board 2 asks "How does
     carrying those sticks help her family?"), and the slides guidance splits a
     Teach that way on purpose. Three routes also put two teacher-only beats
     together by design: an explanation then the My Turn, a short fact input
     then the discussion prompt, and setting the task then its one input.
   - **What I think:** The fault you care about is several new ideas told
     before children do anything, counted in teaching beats, not slides. The
     designer's own section already says it in one line: the rule "prevents
     several different concepts taught before children do anything".
   - **What I suggest:** The warning sign and the reviewer's fault both become
     "more than one new idea told before children use any", with a Teach split
     over two slides counted as one beat. Your Tudor boards 1 and 2 pass. "What
     a fair test is", then "how to record results", then straight into the task
     does not. The test holding the old words moves in the same release.
   - **Question:** Should a run of teacher slides count as a fault only when it
     carries more than one new idea?

3. **Scene-setting in a knowledge lesson: say how it is done.**
   - **What it says now:** Your preferences allow scene-setting (what the topic
     is, when it happened) as a brief separate moment with no activity after it
     when it would overload the first teaching slide. There is no separate beat
     for it in a knowledge lesson, and the checking program wants an activity
     after every teaching beat. But a separate slide already exists another
     way: a full Teach board is split where its teaching turns, with the scene
     set on the first slide, and your Tudor board 1 is exactly that. What
     cannot be built is scene-setting as a beat of its own, which the reviewer
     already warns against when it comes with a made-up activity.
   - **What I think:** I overstated this before. Nothing new needs building;
     what is missing is one sentence saying how it is done, so the designer
     does not invent a pointless task.
   - **What I suggest:** Add to the rule: in a knowledge lesson, scene-setting
     that needs its own slide is the opening of the first teaching beat, split
     onto its own slide as in your Tudor lesson, never a beat of its own with a
     made-up activity after it. No program change.
   - **Question:** Shall the rule say that?

4. **A discovery lesson whose finding needs two ideas.**
   - **What it says now:** The rhythm says every route, discovery included,
     teaches one idea and has children use it before the next. But a discovery
     lesson is allowed exactly one "explain why" slide and one "use it" slide,
     and the program enforces that. If the finding needs two ideas explained,
     there is nowhere to put the second, and nothing says what to do.
   - **What I think:** Rare, but when it happens the designer is forced to put
     two ideas in one explanation, which is exactly what the rhythm forbids.
   - **What I suggest:** One sentence in the discovery route: its explanation
     carries one idea, and a finding that needs two is taught as a knowledge
     lesson that opens with a short observation (which that route already
     allows). For example, shadows need both "light travels in straight lines"
     and "some materials block it".
   - **Question:** Should a discovery lesson whose finding needs two ideas
     become a knowledge lesson with an observation first?

5. **Activity-list entries that break the rhythm.**
   - **What it says now:** The rhythm's tests for a Do are "could most of the
     class sit it out?" and "a Do that uses only earlier learning breaks the
     pair". The activity list still offers one child thinking aloud while the
     class watches, one child speaking in role when tapped (thought tracking),
     hot-seating and a short debate, and suggests "last lesson, last week"
     recall as "the opening Do beat after Teach 1", which uses nothing Teach 1
     taught. Thought tracking and six children ordering cards at the front are
     already limited by your calm-classroom ruling (movement only when you ask
     for it). The list already has a way to retire a format: three routines are
     marked "do not select unless the teacher asks".
   - **What I think:** Each of these lets most children watch, or practises
     something other than what was just taught.
   - **What I suggest:** Mark "one child thinks aloud" as not selected unless
     you ask, like those three routines. Keep hot-seating and a debate only when
     every child first commits (writes a position or picks a side). Change the
     recall format's best use from "the Do after Teach 1" to a starter.
   - **Question:** Shall I make those three changes?

6. **What the reviewer reads.**
   - **What it says now:** The reviewer reads each route's guidance only down
     to the part that describes the file format. In the My Turn route the core
     rhythm rules sit below that line: nothing between a My Turn and its Your
     Turn, every cycle ends with its own Your Turn, a small bridging cycle still
     earns two questions, the line between a teaching slide and a model, one My
     Turn per move. In the task route, "a task with several stages stays one
     task" sits there too. The program enforces most cycle rules, and the
     reviewer's own instructions already send back a missing mini-cycle, but it
     never reads the rest. The rhythm section itself is not on the reviewer's
     always-read list and opens only when a trigger fires. Two of those
     triggers need the fault already spotted, which the program's own comment
     says a trigger must not do. And "a question to the whole class instead of
     every child doing something" sends the reviewer to the slides section,
     which has one clause on it, not the rule.
   - **What I think:** The reviewer should read what it is meant to check.
     Moving words does not change them.
   - **What I suggest:** Move those rules above the line word for word, moving
     the vocabulary checks that hold three of them in the same release. After
     the fold makes it shorter, put the rhythm section on the always-read list.
     Point the "question to the room" trigger at the rhythm section, and reword
     the two find-it-first triggers into things the reviewer can see before
     judging. The last three are program changes, each with its test.
   - **Question:** Shall I move the rules and make the reviewer changes?

7. **Out-of-date and misleading wording.**
   - **What it says now:** The designer is told the rhythm section "is short"
     (it is about 4,700 words). A bracket in your preferences says "it was
     previously possible to satisfy the route while breaking this sentence",
     which is history. The knowledge-lesson template says main practice comes
     "after all Teach/Do pairs", and two summaries still put it last, though it
     can now come after any pair once the class is ready. Three route files use
     "CURRENT", a leftover name. The journey-line paragraph says an older
     version "was retired (2 September 2026)", which the build log already
     records. The My Turn route points to a "Picking the splitting axis"
     section that does not exist. It also says each distinct modelled move is
     "its own My Turn inside the same concept" without saying each opens its
     own cycle, so read alone it sends the designer to two My Turns in a row,
     which the program refuses. And two sentences describe the program more
     narrowly than it works.
   - **What I think:** Each one either misleads the designer or is written for
     whoever maintains the plugin.
   - **What I suggest:** Correct the wording, and move the one piece of history
     not yet in the build log there.
   - **Question:** Correct or remove all of these?

8. **A question to the class as the Do.**
   - **What it says now:** Your preferences say a discussion question can be
     the Do when it needs the idea and every child commits (writes a decision,
     tells a partner then writes a line, votes with a reason). The
     knowledge-lesson route says a question to the room is never the Do. Your
     routine rule says slides do not name how answers are gathered: the
     teacher chooses hands up, cold calling or whiteboards. So a designer
     following the routine rule writes "Discuss...", the teacher takes hands
     up, and the Do has become a question to the room. Three subject files add
     "not only the confident speakers".
   - **What I think:** Both rules are yours and both are right. They meet at
     one point: committing is part of the task, not a routine.
   - **What I suggest:** The preferences rule holds in every route, and the
     knowledge route is brought into line with it. When a question is the Do,
     the way every child commits is written into the task (for example "Write
     yes or no, then one reason"), which your routine rule already allows as
     "part of the selected task". How answers are then gathered stays the
     teacher's.
   - **Question:** Shall a question-Do always say how every child commits, and
     leave the gathering to the teacher?

9. **A check that reads an empty line.**
   - **What it says now:** The knowledge route tells the designer to read its Do
     beats' response-form lines, and if three in a row are talk or written
     explanation, to look for a sort or a ranking. The reviewer reads the same
     lines. But the Do template says to leave that line empty unless the
     response form is part of the learning, and the program allows it empty.
     Followed as written, there is usually nothing to count.
   - **What I think:** The check is sound; it is looking in the wrong place.
   - **What I suggest:** Both read what children actually do in each Do, its
     task and instruction, whatever that line says. Wording only.
   - **Question:** Shall the check read the task itself?

10. **Sort then explain: one beat or two?**
    - **What it says now:** The designer is told that when children first
      sort, then explain, then make a new case, each is its own beat. The "two
      jobs in one beat" check keeps a claim and the explanation of that same
      claim as one beat. The activity list says to add a short reason to a
      placement when the reason is part of the learning. The knowledge route
      says the reason for the hardest placement is where the explanation goes.
    - **What I think:** A sort with a one-line reason is one job. A sort
      followed by a paragraph is two.
    - **What I suggest:** A sort and a short reason for its placements stay
      one beat; the separate beats are for an explanation or a new case that is
      its own piece of work. "Sort the six jobs, then say why you put the
      hardest one where you did" is one beat. "Sort the jobs, then write a
      paragraph on why Tudor children worked" is two.
    - **Question:** Is that the line you want?

11. **Practical lessons that start with a challenge.**
    - **What it says now:** Your voice guide gives a practical-lesson shape:
      "challenge, brief teaching, try it, quick check, improve it, record it",
      with no conditions. The My Turn route allows a first attempt before any
      teaching only when it is safe, cheap and quick to reset, the goal is
      obvious and a child can see for themselves whether it worked, and maths
      never uses one. Decision 1 would move the voice guide's shape into the
      rhythm rules.
    - **What I think:** Moved as it stands, it would allow challenge-first in
      any practical lesson, maths included, which you have ruled out.
    - **What I suggest:** The shape moves carrying the first-attempt conditions
      and the maths exception. "Can you make the bulb light?" passes: it lights
      or it does not. "Have a go at column subtraction first" does not.
    - **Question:** Shall the practical shape keep those conditions?

12. **A discussion lesson's summing-up: always, or only when it helps?**
    - **What it says now:** The discussion route, the designer and the checking
      program require one summing-up beat, last, after the discussions. The
      evidence file says to add one "when it helps children compare what
      actually emerged".
    - **What I think:** The route and the program are the rule. The evidence
      line reads as permission to skip it.
    - **What I suggest:** Keep the summing-up compulsory and reword the
      evidence line to match.
    - **Question:** Keep it compulsory?

Your standing rulings from vocabulary apply without a new question: a dated
story leaves for the build log and its reason stays; your own words stay
without their dates; your calibration examples stay exactly as they are (the
Victorian sketch, the Tudor why-lesson and boards). Four stories must be
copied to the log before they can leave (listed at the end).

**For later topics, listed so they are not lost:**

- A. **Four corners.** The discussion route offers "four corners" (children
  move to a corner) as a talk format and a four-corners vote as an opening
  activity, while the activity list says never to reach for a move-to-show
  substitute for Stand If, and your calm-classroom ruling puts seated forms
  first. For whichever topic folds the discussion route or the activity list.
- B. **The quick-check paragraphs inside the rhythm section** (a quick check is
  a fresh case; a quick match or sort is a real Do when the cards are new; a
  sort's two groups). The quick-checks topic decides them; this fold leaves
  them where they are or moves them together.
- C. **The time numbers** (a Do one to three minutes, a talk three to five, a
  card sort at tables five or six, about five minutes of uninterrupted
  explanation) live in five places, and the designer is told the beats may
  take 40 of the 45 minutes while the program refuses only above 50. For the
  Classroom Norms topic.

---

## A. The shape, and why it holds

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-A01 | «This is the load-bearing shape of every lesson design, and `What a Lesson Is For` above is what the shape serves.» | every lesson, every route | must | heading `## The Teach → Do → Teach → Do Rhythm` (the reviewer's routing card, the designer's startup read, tests) | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L172 | rule | PREF-RHY |
| TD-A02 | «Children do not learn by being told things. They learn by doing something with what they have just been told. Every chunk of teaching — every Teach slide, every My Turn, every new concept — is followed immediately by a beat that requires every child to use what they have just been told before the next chunk arrives.» | every chunk; limit TD-A03 | must | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L174. Copies: A04, A05, B11, B12, C06, J03 | rule (the core) | PREF-RHY |
| TD-A03 | «An explanation and its model may form one coherent teaching block when they develop the same idea. The required child processing comes before the lesson introduces a genuinely different concept; it is not forced between the explanation and modelling of one idea.» | an explanation and the model of the same idea | may (the limit of A02) | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L176. Copies: A04, A05 | rule; decision 2 (a run of two teacher-only beats) | PREF-RHY |
| TD-A04 | «Short explanation + model completing same manageable idea may be one coherent teaching block. Children must then use/process that idea before teacher introduces different new idea. Rule prevents several different concepts taught before children do anything; does not force activity between explanation and model of one idea.» | as A02, A03 | must / may | | `agents/lesson-designer.md` › The Teach → Do Rhythm · L243 | near-duplicate of A02 and A03, plus: it states the rule's purpose, «Rule prevents several different concepts taught before children do anything» (the test decision 2 proposes), and says «Short explanation» | LD-RHY (pointer); its purpose sentence carried into PREF-RHY |
| TD-A05 | «Both skill/content: children use/process one idea before different new idea. Explanation + model of same idea may be one block.» | skill and content lessons only, as written | must / may | | `agents/lesson-designer.md` › Structure Decision · L142 | duplicate of A02 and A03, narrowed to two routes | LD (Structure Decision) |
| TD-A06 | «**Why the rhythm matters.** Working memory is tiny. If the next idea arrives before children have actively used the previous one, the previous one fades — they walk away with a vague impression of the lesson instead of usable knowledge. "Memory is the residue of thought." Design so that what children are meant to remember is what their working memory actually processes.» | the reason for A02 | | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L190. Copies: A07, A10 | rule (the reason) | PREF-RHY |
| TD-A07 | «**Why.** Small chunks protect working memory, while immediate processing makes children work with each idea before a different one arrives. Meaningful content practice combines remembering with worthwhile thinking where the objective supports it.» | content lessons (evidence) | | | `references/evidence-synthesis.md` › 9. Lesson Structures › Content-based · L217 | near-duplicate of A06 (evidence) | EVID |
| TD-A08 | «- Keep steps small. Rosenshine: teach in small steps, with pupil practice after each step.» | modelling (evidence) | default | | `references/evidence-synthesis.md` › 2. Teaching / Modelling · L70 | duplicate of A02 (the evidence behind it) | EVID |
| TD-A09 | «- **Pacing.** Break up unnecessarily long, uninterrupted explanation with useful opportunities to process or check understanding. Around five minutes is a useful guide for noticing when uninterrupted explanation may be running long, not a fixed outer limit; a story, demonstration, read-aloud or carefully developed explanation may reasonably last longer.» | a long explanation; exceptions: a story, demonstration, read-aloud or developed explanation | default | | `references/evidence-synthesis.md` › 7. Cognitive Load in Practice · L173 | near-duplicate of B01 ("long teacher talk"), plus: the only number anywhere on how long telling runs (about five minutes, a guide not a limit) | EVID |
| TD-A10 | «- **Memory is the residue of thought.** Consider what the activity will actually make pupils think about.» | every activity | | | `references/evidence-synthesis.md` › Cross-Cutting Principles · L264 | near-duplicate of A06 | EVID |
| TD-A11 | «Sometimes the most authentic resource is one where **the slide gets out of the way and lets pupils do something**.» «- give only the teaching needed before the next action;» «> Challenge → brief teaching → try it → quick check → improve it → record it.» «Avoid turning an activity-led lesson into:» «> explanation → explanation → explanation → worksheet.» | practical and activity-led lessons | default | | `references/teacher-voice.md` › 13. Practical / activity-led lessons · L740 | rule, in the voice guide rather than with the rhythm; the only place that names a whole practical-lesson shape; it has none of the first-attempt conditions (J26, K18) | PREF-RHY, carrying those conditions (decisions 1 and 11) |
| TD-A12 | «- **The Teach → Do → Teach → Do Rhythm** — the load-bearing lesson shape, the pairing test that each Do uses the idea its own Teach taught, naming what a chunk needs children to do with it before choosing any activity, and the variety rules across Do beats.» | the contents list agents choose sections by | pointer | | `references/preferences.md` › Contents · L16 | pointer; it names four of the section's parts and leaves out the rest (state of the lesson and links, orientation, sets, sorts, demand, claims) | STAYS (contents), reworded to name every part (decision 1) |
| TD-A13 | «The rhythm section is the load-bearing shape of every structure, task-centred and discovery included, and it is short.» | the designer's startup reading | must (read) | | `agents/lesson-designer.md` › Reference Files · L551 | pointer; "it is short" is stale: the section is about 27 KB, 4,700 words, 67 lines | LD (reading list); correct (decision 7) |
| TD-A14 | «The plugin's general layer already answers *how do I run a good lesson*: the Teach to Do rhythm,» | writing a new subject file | | | `skills/make-subject-file/SKILL.md` · L50 | maintainer (lesson agents never read it) | STAYS |

## B. One idea per Teach, and what counts as one idea

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-B01 | «**One concept per Teach block, then back to the children.** A Teach block introduces a single new thing — a method, a sentence structure, a fact, an explanation, a cause, a vocabulary distinction. Two at once means neither gets used before the next arrives; split them. The teacher's job in the block is to give the shortest, clearest route to that one thing, then hand the work back to the children. Long teacher talk replaces practice with listening and drains pace.» | every Teach block; limits B03, B05 | must | the second sentence is a vocabulary pin (VOC-E49, held in this section) | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L180. Copies: B07 to B12, J72 | rule | PREF-RHY |
| TD-B02 | «Three surfaces have to agree about what the one thing is: the idea the block names, the teaching written underneath it, and what children do straight after.» «A block headed `Ask what this source helps us find out`, whose teaching underneath defines primary and secondary sources, has named one move and taught two others,» «Read the three back to back before you move on: one move, taught, then used.» | every Teach block and its Do | check | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L180. Copy: B07 | rule with an undated example (the example's lesson is in the log, L3089) | PREF-RHY |
| TD-B03 | «What counts as one coherent idea depends on the subject, objective and children’s prior understanding. For first teaching, normally establish each unfamiliar component children must describe or use, with an opportunity to use it before adding the next. Several names under a shared heading, or several variations of one method, do not make them one already-understood idea.» | first teaching; "normally" | default | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L182. Copies: B09, L03 | rule | PREF-RHY |
| TD-B04 | «Where the objective requires children to name and describe each unfamiliar member of a set, normally teach and let children use each member’s defining knowledge before moving on; naming them together and adding a shared task is not equivalent. A shared function is a useful later connection, not a reason to skip that first encounter.» | an objective that names a set of unfamiliar members; "normally" | default | vocabulary pin VOC-E46 holds the first sentence in this section | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L182. Copy: L03 | rule; shared with vocabulary (its decision 8) | PREF-RHY (stays in this section, pinned) |
| TD-B05 | «On revisiting, combine more readily when the supplied context supports that foundation. A comparison or process can still be the clearest first explanation when its parts become intelligible through it; do not make a separate cycle for every fact or noun. Judge what the child must hold together, not the number of slides or the adult’s grouping.» | revisiting; a comparison or process that makes its parts clear | may / must not over-split | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L182 | rule (the limit of B01 and B03) | PREF-RHY |
| TD-B06 | «In a knowledge subject, teach substantive content through the sources, examples or experiences that make it intelligible. Teach a thinking move where the material makes children need it: a brief cue can suffice for a familiar comparison; an unfamiliar inference may need an explicit model and guided attempt. That focused teaching is legitimate, especially when the objective names the move. It must build knowledge of the topic, not replace it with a sequence of generic method rules.» | knowledge subjects | must | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L182. Copies: B10, K08 | rule | PREF-RHY |
| TD-B07 | «Heading, explanation and following Do name one move between them; read the three back to back.» | as B02 | check | | `agents/lesson-designer.md` › The Teach → Do Rhythm · L245 | duplicate of B02 | LD-RHY (pointer) |
| TD-B08 | «Check form: Teach visually heavy or asks processing several distinct ideas before act, SC step carrying justification, question extra wording obscuring task = content in wrong form for board.» | reading each component as the child receives it | check | | `agents/lesson-designer.md` › Lesson Components · L162 | near-duplicate of B01, as a board check | LD |
| TD-B09 | «Each Teach beat develops one understandable relationship or explanation, then children use it before the next distinct idea. Judge the chunk from what children must understand together to make that response, not from a shared topic heading. Apply the familiarity and grouping judgement in `preferences.md` → The Teach → Do → Teach → Do Rhythm: a shared comparison does not excuse skipping the individual understanding it depends on.» «Splitting the text across readable slides fixes presentation, not an overloaded learning chunk.» | content lessons | must | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L21 | near-duplicate of B01 and B03, plus: splitting a board across slides does not fix an overloaded chunk | CONTENT (pointer, keeping the "splitting" sentence) |
| TD-B10 | «A content chunk teaches knowledge about the topic. Teach a new thinking move through the material it helps children understand, with enough explanation and guided use for the later task. A brief cue may suffice for a familiar comparison; an unfamiliar evidence decision may need focused teaching of its own. Keep that teaching connected to substantive content rather than replacing the lesson with generic rules about thinking.» | content lessons | must | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L23 | near-duplicate of B06, plus a sufficiency condition: «with enough explanation and guided use for the later task» | CONTENT (pointer); the sufficiency clause carried into PREF-RHY |
| TD-B11 | «**Content-based:** Teach one manageable chunk → children use/process → next distinct chunk → larger practice drawing learning together. Closely connected facts may stay together only when still one simple easy chunk.» | choosing the route | | | `agents/lesson-designer.md` › Structure Decision · L140 | near-duplicate of A02 and J31; it puts the larger practice last, where the route now places it by readiness (J31) | LD (Structure Decision); decision 7 |
| TD-B12 | «**Structure.** Teach one small, manageable chunk → children use or process it → teach the next distinct chunk → larger practice that draws the lesson's knowledge together. Closely connected facts may remain together only when they still form one simple, easy-to-understand chunk.» | content lessons (evidence) | | | `references/evidence-synthesis.md` › 9. Lesson Structures › Content-based · L215 | near-duplicate of B11 (same order, practice last) | EVID; decision 7 |
| TD-B13 | «Two sorts that look short can take a quarter of the lesson between them once the reading, the whiteboard work and the checking are counted, and a Teach split across two slides is one episode, not two. Count changes of idea and context inside a beat, not just its title.» | the completion pass | check | | `agents/lesson-designer.md` › One Completion Pass › Classroom sequence · L514 | rule (the only "count changes of idea inside a beat" check); shared with the time budget | LD |
| TD-B14 | «**Splitting axis when LO names multiple outputs** (words+digital, add+subtract, pounds↔pence, standard+expanded, fraction+decimal): do outputs share one procedure or different? Same procedure different outputs = one concept (a/an: check next sound). Different procedures = two concepts (words = minutes-first, next hour for to-times; digital = hours-first, just-left hour).» | an objective naming several outputs | must | | `agents/lesson-designer.md` › Structure Decision · L152. Copies: B15, B16 | rule (what one concept is in a skill lesson; the only copy) | LD (Structure Decision), or SKILL beside J11 (decision 1) |
| TD-B15 | «When LO has output fork AND directional/categorical fork (words vs digital × past vs to), split on output fork - not directional. Output type is act child doing; directional is decision inside act. Concepts split by act, not decision.» | an objective with two kinds of fork | must | | `agents/lesson-designer.md` › Structure Decision · L154 | rule (only copy) | with B14 |
| TD-B16 | «If you find yourself wanting to write two SCs for one concept (one for output X, one for output Y) that's the signal that you've got two procedures sharing a concept, not one — split them into two concepts at the structure level (see "Picking the splitting axis" earlier).» | skill lessons | check | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L174 | rule; its pointer is stale: there is no "Picking the splitting axis" in the skill route, the rule lives only in B14 (decision 7) | SKILL, pointer corrected |

## C. Every child uses it: the Do half

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-C01 | «**Questioning is not doing.** The Do half of the rhythm is every child using the new learning: applying it to a fresh case, deciding, sorting, improving, rewriting, choosing, comparing, producing something that needed the idea. A question put to the class is answered by the children whose hands go up, and it can often be answered from the slide or from general good sense as easily as from the idea just taught,» «A discussion question can be the Do beat, but it is chosen, not defaulted: the answer has to need the idea just taught, so a child who missed the teaching could not give it, and the form has to make every child commit to one (a decision each child writes down, talk partners then a line each, a vote with a reason) before the reasoning is heard. Two tests on a finished beat: could a child answer it without the idea this slide taught, and could most of the class sit it out? Yes to either, and the beat is a question, not a use.» | every Do beat; a discussion only when chosen so every child commits | must | pointer name `Questioning is not doing` (named by five other files) | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L184. Copies: C03 to C06, K03 to K07, L08 | rule; decision 5 (formats where most of the class watches) | PREF-RHY |
| TD-C02 | «so a slide that teaches passing and then asks `What could the others say to Chloe?` has checked the room, not had each child use the idea.» | illustrates C01 | | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L184 | example (undated; **not found in the build log**) | with C01 |
| TD-C03 | «Questioning is not doing: the Do half, a `do` unit or a `pupilInstruction`, is every child using the idea (decide, sort, improve, rewrite, choose, produce); a question to the room is the beat only when chosen so the answer needs the idea and every child commits» | as C01 | must | `do`, `pupilInstruction` | `agents/lesson-designer.md` › The Teach → Do Rhythm · L245 | duplicate of C01, plus: names the two fields that carry the Do | LD-RHY (the field names stay) |
| TD-C04 | «**Do** — immediately after each Teach beat, children use or process the chunk before the next distinct idea. Every child uses it; a question to the room is a key question, not this beat» | content lessons | must (code: a Do or a Practise follows every Teach) | `do` | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L45 | near-duplicate of C01 but stricter: it has no exception for a question chosen so that every child commits, so in a content lesson it bans what C01 allows; decision 8 | CONTENT |
| TD-C05 | «A question the teacher puts to the room is not that use unless it is chosen so the answer needs the idea and every child commits» | task-centred enabling input | must | `pupilInstruction` | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L19 | duplicate of C01 | TASK (pointer) |
| TD-C06 | «A **Do beat** is a short consolidation or checking move between genuinely different taught ideas. It requires every child to use the chunk they have just been taught, and it leaves something the teacher can see: a written answer, a partner's spoken response, a visible decision, a physical position. A question put to the room is not one unless it is chosen so that every child commits to an answer that needs the idea just taught» «One to three minutes is a useful estimate, not a hard limit.» «If the activity becomes substantial, treat it as main practice rather than letting a nominally quick beat swallow the lesson.» | every Do beat | must | | `references/do-beats.md` · L3 | duplicate of C01, C07 and C09, plus: a Do sits "between genuinely different taught ideas" | DOB (keeps its opening definition, pointing to PREF-RHY) |
| TD-C07 | «**Choose Do activities for the learning.** A short processing beat makes children use one manageable chunk before the next distinct idea arrives. It gives every child something concrete to do with the chunk and leaves something the teacher can see: a written answer, a partner's spoken response, a visible decision, a physical position. One to three minutes is a useful normal estimate, not a hard limit.» | every Do beat | must (a use after each chunk, by every child, leaving something the teacher can see); default (one to three minutes) | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L192. Copies: C06, C08, C10 | rule | PREF-RHY |
| TD-C08 | «Every Do beat: every child uses the chunk and leaves something the teacher can see (written answer, partner's spoken response, visible decision, physical position).» | as C07 | must | | `agents/lesson-designer.md` › The Teach → Do Rhythm · L257 | duplicate of C07 | LD-RHY (pointer) |
| TD-C09 | «Let the activity take the time its thinking genuinely needs, but do not let a beat intended as a quick check quietly expand until it crowds out the lesson. When a worthwhile sort, explanation, diagram or other activity becomes substantial, treat it as main practice rather than continuing to call it a tiny Do beat.» | a Do that grows | must | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L204. Copies: C06, C10 | rule | PREF-RHY |
| TD-C10 | «One to three minutes is a useful normal estimate, not a hard limit. A spoken response, visible decision, movement, physical action, drawing or writing may all show the thinking; each Do does not need a permanent written artefact. If a worthwhile activity becomes substantial, treat it as main practice, in the place that beat was going to sit if the class is ready for it there, and protect the rest of the lesson rather than pretending it is still a tiny beat.» | content lessons | default (the time); must (a grown beat becomes main practice and the rest of the lesson is protected) | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L47 | near-duplicate of C07 and C09, plus: no permanent written record is needed, and the grown beat becomes main practice "in the place that beat was going to sit if the class is ready for it there" | CONTENT (the placement clause) |
| TD-C11 | «A key question is not a second response demand competing with the Do that follows, and reading it that way empties the field:» «The Do asks children to use the idea once it is taught. A key question is what makes them look at the thing while you are teaching it» «so the class is doing something during the teaching rather than waiting for it to end. Most Teach beats earn one.» «The teacher chooses how responses are gathered; the Do remains each child's opportunity to use the learning.» | content Teach beats, and the skill route's `teach` beat (J18's line) | default ("most earn one") | `content.keyQuestions` | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L37 | rule, with a story (four decks with empty key questions; in the log, L2119) | CONTENT |
| TD-C12 | «Where the beat is the lesson's evidence that each child holds the idea, give them a moment to settle their own answer before they talk, because a pair reaching agreement tells you one of them thought and not which one;» «Where the talk is there to generate, rehearse or open a question up, straight into the pair is right and thinking time first would only slow it.» | partner talk | default | | `references/preferences.md` › Classroom Norms · L132 | shared (Classroom Norms); agrees with C01's "every child commits" | STAYS |
| TD-C13 | «**The limit:** the user finds it "a bit better" than Stand If and still a weak Do beat. A thumb reports how a child feels, and a child who has misunderstood can feel sure, so it never stands in for a beat where every child uses the idea; it is not a Do beat at all, only a quick read the teacher may add beside one.» | a thumbs check | must not (as a Do); the entry's first line is stricter: a teacher-owned routine, not selected unless the teacher asks (C27) | | `references/do-beats.md` › 9.6 Thumbs-Direction · L479 | your ruling (your words; in the log, L1201) | DOB |
| TD-C14 | «A reasoning shape is not the same as a Do beat.» «but a Do beat is a 1–3-minute move to use a fact before the next chunk arrives, while a reasoning prompt is the question or task children justify their thinking on.» | telling a reasoning prompt from a Do | | | `references/reasoning-prompts.md` · L12 | near-duplicate of C07; "use a fact" is narrower than "use the chunk" | STAYS (reasoning prompts) |
| TD-C15 | «It does not mean adding reasoning where a structure already carries it — a content lesson's Do beats and a discussion lesson's talk are already the reasoning.» | reasoning in a lesson | | | `references/preferences.md` › Reasoning Is Every Child's Entitlement · L487 | shared (reasoning) | STAYS |
| TD-C16 | «a Do is the case and what every child decides or does;» | the walk-through's board line | must | | `agents/lesson-designer.md` › Write the lesson, then the contract · L410 | duplicate of C01, in walk-through form | LD |
| TD-C17 | «and what every child does (the pupil response it prepares);» | the walk-through's "what happens" line | must | | `agents/lesson-designer.md` › Write the lesson, then the contract · L412 | duplicate of C01 | LD |
| TD-C18 | «in the Do, a pupil thinks aloud through the same kind of problem while the class watches» | Think-Aloud Reverse | may (listed as a Do) | | `references/do-beats.md` › 9.7 Think-Aloud Reverse · L482 | contradiction with C01's "could most of the class sit it out?"; decision 5 | DOB |
| TD-C19 | «- Role-play or hot-seating ("you're [character] — what would you say?")» «- Short structured debate» | dialogic Talk formats | may | `talk` | `references/teaching-sequence-dialogic.md` › Teaching Sequence Specification · L26 | contradiction with C01 when one child speaks and the class listens; decision 5 | DIAL |
| TD-C20 | «Six pupils each hold a card with one event/step on it; they arrange themselves in order at the front while the class judges» | Human Sequencing | may (listed as a Do) | | `references/do-beats.md` › 7.6 Human Sequencing · L386 | contradiction with C01 (six act, the rest judge) and with your calm-classroom ruling (L357); decision 5 | DOB |
| TD-C21 | «Flexibility does not mean weak evidence. The design must still identify enough individual evidence to know whether each child can understand, decide or perform the intended learning rather than relying only on confident speakers.» | PSHE evidence | must | | `references/subject-pshe.md` › Choose evidence that shows the PSHE learning · L28. Copies: C22, C23 | near-duplicate of C01 in the subject's words (not the confident speakers) | SUBJ |
| TD-C22 | «There must still be enough individual evidence to show that children understood the intended knowledge, interpretation, comparison or reasoned view rather than relying only on confident speakers.» | RE evidence | must | | `references/subject-re.md` › Use evidence that directly shows the RE learning · L49 | near-duplicate of C01, as C21 | SUBJ |
| TD-C23 | «**Talk when it helps children form or show an answer.** Partner rehearsal can prepare writing; an individual spoken explanation can itself be the outcome. Make each child's understanding available to the teacher rather than relying on the most confident group spokesperson.» | history talk | must | | `references/subject-history.md` › Choose the response that reveals the history · L146 | near-duplicate of C01, as C21 (H06 quotes another line) | SUBJ |
| TD-C24 | «**Routine classroom management belongs to the live teacher.** Generated slides, notes and task briefs normally state the learning action only, such as "Write...", "Discuss...", "Draw..." or "Choose...", without naming a recording surface or routine participation method. Name a medium, device or response structure only when it is genuinely part of the selected task or required resource. The teacher chooses whether children use books, whiteboards, devices, hands up, cold calling, wait time or another routine in the live classroom.» | every slide, note and task | default (name no routine); may (name a response structure that is part of the task) | | `references/preferences.md` › Classroom Norms · L130. Copies: C25, C26, Z20 | shared (Classroom Norms); pulls against C01's "every child commits"; decision 8 | STAYS |
| TD-C25 | «- State the learning action and intended evidence. The live teacher chooses how to gather and inspect responses, including hands up, cold calling, partner work, writing or another routine.» | checks (evidence) | default | | `references/evidence-synthesis.md` › 6. Checking for Understanding · L153 | shared (Classroom Norms); duplicate of C24 | EVID |
| TD-C26 | «Do not ban mini-whiteboards or devices and do not make books or cold calling the default. Normally state the learning action. Name a device, medium or substantive response structure only when it genuinely forms part of the selected activity.» | every Do beat | default | | `references/do-beats.md` · L23 | shared (Classroom Norms); duplicate of C24 | DOB |
| TD-C27 | «**Teacher-owned response routine:** do not select this unless the teacher explicitly requests it.» | 1.3 Whole-class oral rehearsal, 1.7 Choral Response and 9.6 Thumbs-Direction (the same line heads each) | must not (unless the teacher asks) | | `references/do-beats.md` › 1.3 Whole-class oral rehearsal · L93 | rule (the catalogue's existing way of retiring a format that is not a use by every child; decision 5) | DOB |
| TD-C28 | «Mid-freeze-frame, the teacher taps one pupil's shoulder; they say one line of what their character is thinking (dramaresource.com).» | Thought Tracking | may (listed as a Do; a movement beat, so only when the teacher asks, L357) | | `references/do-beats.md` › 7.2 Thought Tracking · L365 | contradiction with C01 (one pupil speaks); decision 5 | DOB |
| TD-C29 | «Let each Talk take the time its thinking deserves. Three to five minutes is a useful estimate, not a fixed limit. Do not let a small discussion accidentally take over the lesson or cut a rich discussion short merely to satisfy a timer.» | Dialogic Talk | default (the time); must not (let it take over, or cut it short for a timer) | | `references/teaching-sequence-dialogic.md` › Teaching Sequence Specification · L29 | near-duplicate of C09 for the Dialogic route, plus: do not cut a rich discussion short | DIAL; its time to later decision C |
| TD-C30 | «A short precise answer can reveal understanding; longer wording is not evidence of deeper thinking.» «**Where the brief already lists key questions, start from those.**» | content Teach beats' key questions | default | `content.keyQuestions` | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L35 | rule (the companions of C11) | CONTENT |

## D. The Do uses what its own Teach taught

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-D01 | «**The Do uses the idea its own Teach just taught.** The questioning test above asks whether the beat is a use at all. This one asks whether it is a use of *this*.» «Say in your own words the move the Teach taught, then say what a child has to do in the Do: if a child who slept through this Teach and woke for the one before could still do it, the pair has come apart. Choose the repair by the approved learning: keep a necessary Teach and change a neighbouring Do to use it; when the Teach introduces an unnecessary idea and the Do serves the objective, revise the Teach instead. Neither half wins merely because it was written first. The boundary: a Do may and often should carry earlier learning forward, because comparing two classrooms still needs the deducing taught two beats ago. What breaks the pair is a Do that uses only the earlier idea, leaving the new one taught and unused.» | every Teach and Do pair; boundary: a Do may carry earlier learning too | must | pointer name `The Do uses the idea its own Teach just taught` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L186. Copies: D03, D04, L08 | rule | PREF-RHY |
| TD-D02 | «A Teach explaining what makes a source primary or secondary, followed by children deciding whether one boy's portrait shows what every child of his time wore, has every child committing to real work on a different idea:» «which is why this survives a check that only asks whether children were active.» | illustrates D01 | | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L186 | example (undated; in the log, L3076) | with D01 |
| TD-D03 | «A use of the wrong idea is not the beat either: the Do practises the move this Teach taught, not a neighbouring one the lesson happens to be about, so a Teach defining primary and secondary sources followed by children judging what one portrait proves about everybody taught one thing and used another, and passes every check that only asks whether children were active» | as D01 | must | | `agents/lesson-designer.md` › The Teach → Do Rhythm · L245 | duplicate of D01 and D02 | LD-RHY (pointer) |
| TD-D04 | «Match the substance before the form: this Do practises the move this Teach just taught, not a neighbouring one the lesson happens to be about, and a beat where every child commits to real work still breaks the pair when the move it uses was never taught here» | content lessons | must | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L51 | near-duplicate of D01, plus the order "substance before form" | CONTENT (pointer, keeping the order) |
| TD-D05 | «Choose an order children can follow through the subject, and apply `preferences.md` → The Teach → Do → Teach → Do Rhythm to decide what needs separate teaching and use.» | step 3 of the design order | pointer | | `agents/lesson-designer.md` › Settle the classroom experience · L58 | pointer | LD |
| TD-D06 | «A Your Turn the class could have done before the My Turn has practised nothing this lesson taught;» | skill lessons | check | `thinking` | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L94 | near-duplicate of D01 for the skill route; sits in the Your Turn's `thinking` guidance (shared with the spine) | SKILL |
| TD-D07 | «a task children could have done before the enabling input has used none of it.» | task-centred lessons | check | `thinking` | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L29 | near-duplicate of D01 for the task route; sits in the task's `thinking` guidance (shared with the spine) | TASK |
| TD-D08 | «a position children held walking in, reached without the grounding input, is an opinion the lesson has collected rather than thinking it has produced» | Dialogic Talk | check | `thinking` | `references/teaching-sequence-dialogic.md` › Teaching Sequence Specification · L21 | near-duplicate of D01 for the Dialogic route; sits in the Talk's `thinking` guidance (shared with the spine) | DIAL |
| TD-D09 | «Its `thinking` line, like the Explore's, names what the pattern lets a child predict or explain (`if we moved the torch closer, where would the shadow fall, and why?`), not the looking or the recording; a line a child could answer before the exploration has made the exploration decoration.» | Discovery's Use the learning | check | `thinking` | `references/teaching-sequence-discovery.md` › Use the learning · L41 | near-duplicate of D01 for Discovery (the fourth route copy); shared with the spine | DISC |
| TD-D10 | «When the class can settle it themselves, the honest move is not a statement: the wrong reading meets them in the Do that follows and the board carries the question.» | a Teach whose sentence invites a wrong reading | default | | `references/teaching-sequence-content-based.md` › Output Format Block · L116 | rule (what a Teach leaves for its own Do) | CONTENT |
| TD-D11 | «The limit is the wrong idea a later beat has children correct themselves.» «So ask which of the two a wrong idea is: one nothing downstream touches, which belongs here, or one a Do beat is built to expose, which does not.» | as D10 | must | | `references/teaching-sequence-content-based.md` › Output Format Block · L118 | rule (the limit of D10; its `fix the claim` example is undated) | CONTENT |
| TD-D12 | «**Best for:** lesson 2+ in a sequence; opening Do beat after Teach 1.» | 1.5 Last Lesson / Last Week / Last Term | may (as written) | | `references/do-beats.md` › 1.5 Last Lesson / Last Week / Last Term · L102 | contradiction with D01 (a Do that uses only earlier learning breaks the pair); decision 5 | DOB |

## E. Deciding the Do: what the chunk needs, thinking first, material and thinking together

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-E01 | «**Name what the chunk needs children to do with it.** Match the form to what was just taught, and settle what that teaching actually needs from children before you name any activity. The activity that fits comes from the thinking the chunk now needs, not from the topic it belongs to, and a beat chosen the other way round is where a lesson quietly turns into a run of write-a-sentence-about-it. What each kind of chunk needs:» | every Do beat | must (the order) | pointer name `Name what the chunk needs children to do with it` (named by four other files) | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L194. Copies: E05, E09, E10 | rule | PREF-RHY |
| TD-E02 | «- **A fact, name or definition** needs surfacing: recall it, match it, sort by it.» «- **A process or a method** needs running or laying out: label it, sketch it, put it in order, take the next step, complete a missing step, find and fix an error.» «- **A distinction children could blur** needs discriminating: an example beside a non-example, an odd one out, a boundary case to place, a true-but-misleading claim to judge.» «- **An explanation, a cause, a mechanism or a relationship** needs using *as* an explanation. This is the chunk most often answered with a written summary that only says it back, so reach past that:» «complete the because, explain one link in the chain, predict what the idea says will happen before the answer is shown, change one condition and say what follows, turn the words into a diagram or the diagram back into words, or decide which of two explanations is better and why» «- **Evidence** needs a conclusion drawn from it carefully:» «what it tells us, and the detail in it that shows so; what it cannot tell us yet, when the lesson's question turns on that.» «The evidence is something children read for themselves, not a source the Teach has just interpreted for them.» «- **A new idea that has to join an older one** needs connecting:» «what links this to what we already knew, what it changes about the earlier answer.» «- **A value, a position or a judgement** needs committing to: rank it, place it on a line, choose and give the reason.» | the seven kinds of chunk | must (settle the kind of thinking); the activities named are starting points (E10) | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L196. Copy: E10 (shorter) | rule (the list) | PREF-RHY |
| TD-E03 | «These name the thinking, not the format. `do-beats.md` holds the formats for each and is where you compare the plausible ones, and the subject file's `What a Do beat looks like` names the forms that thinking takes in that subject (a place marked on a map, a practice matched to its belief), so a beat in a content subject is not left to default to talk; this list is what you settle before you open either.» «So before opening the catalogue, write the beat's own `thinking` line: the question a child's mind is answering while they work, in that child's terms. Then read it against what the slide will show. If the line can be answered by reading the board, choose again,» «A chunk can be more than one of these, and the choice between them is a real decision about what today's learning most needs.» | every Do beat | must (the order) | `thinking`; the subject files' headings `What a Do beat looks like` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L204. Copies: E05, E07, E09 | rule; the `thinking` line is shared with the spine (M group) | PREF-RHY |
| TD-E04 | «Settling the kind is not yet settling the thought: `complete the because` was on this list, a Year 4 RE design picked it after a slide that already stated the because, and the thought a child actually had was where to copy the words from.» | illustrates E03 | | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L204 | story (in the log, L2336) | LOG, or an undated example (your standing ruling) |
| TD-E05 | «**Choose the thinking first, then the response form, then demand - three separate decisions.**» «Name what this chunk needs children to *do* with it before naming any activity - `preferences.md` → The Teach → Do → Teach → Do Rhythm, `Name what the chunk needs children to do with it`, owns that list and is what you settle before opening `do-beats.md`.» «The case to watch is a Teach that explained a cause, mechanism, reason or relationship: the reflex answer is a written summary, which only says the explanation back, and `do-beats.md` §10 holds the beats that actually use it» | every Do beat | must | | `agents/lesson-designer.md` › The Teach → Do Rhythm · L257 | near-duplicate of E01 to E03, plus: names demand as a third, separate decision | LD-RHY (pointer) or PREF-RHY for the "three decisions" line |
| TD-E06 | «**Choose the material and the thinking together, then how children respond.** Thinking is always thinking about something, and the same move is trivial on one piece of material and demanding on another: one source can carry a literal check, an inference or a comparison. So start from what children need to learn next, choose what they work on and what they have to do with it as one decision, and only then choose how they show it: said, written, drawn, handled or practised, and with what.» «These are examples, not exclusive routes, and a science lesson may still read a text; what they guard against is borrowing another subject's material because its format looked rich. A label is not the decision.» «For a beat the lesson relies on (the main work, or the Do that prepares it), say in a few words what the child does with the material: retrieve, complete, discriminate, compare, change a condition, predict, test, diagnose, repair, compose or rehearse, or more than one. That is what the task is, not how hard it is:» «It is not a taxonomy to fill, a formula for choosing or a ladder each beat must climb. A quick check, fresh practice of a taught method and a discussion in which each child's reasoning is heard all stay legitimate choices rather than failures to aim higher.» | every Do beat; the operation is named for beats the lesson relies on | must (the order) | pointer name `Choose the material and the thinking together` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L206. Copies: E07, E10, E11 | rule | PREF-RHY |
| TD-E07 | «Choose the task from what the understanding needs children to do with it, and write each beat's `thinking` line before its activity (`The Teach → Do Rhythm`, below, owns both). Choose the material children work on and the thinking it asks for together, as one decision, and only then how they respond» | step 3 of the design order | must | `thinking` | `agents/lesson-designer.md` › Settle the classroom experience · L58 | duplicate of E03 and E06 | LD (the design order points) |
| TD-E08 | «Work in this order, and let each step decide the next: **settle what children need to understand → choose the explanation, example, evidence or demonstration that establishes it → choose what children do with it → check what their responses would actually show.**» «The order matters because a lesson started from the activity fills with things that look right and make children busy, and a lesson started from the learning has to find the teaching that makes the activity possible.» | the whole design | must | | `agents/lesson-designer.md` › Settle the classroom experience · L52 | shared (What a Lesson Is For, "Three questions, in this order") | STAYS |
| TD-E09 | «1. Settle the intended thinking or checking purpose, using `preferences.md` → The Teach → Do → Teach → Do Rhythm, `Name what the chunk needs children to do with it`. That list is what a purpose is stated in; arriving here without one is how a beat ends up chosen by topic. Then write the beat's `thinking` line,» «a format that lets the child answer that question by reading the slide, or from what they knew walking in, is out, whatever section it came from;» | opening the catalogue | must | | `references/do-beats.md` › How to pick · L51 | near-duplicate of E01 and E03, plus a guessing test E03 lacks (answered «from what they knew walking in»); the designer has it (M04), the preferences home does not | DOB (its own how-to-pick) |
| TD-E10 | «A fact may suit recall or a sort, a process labelling, sketching or sequencing, and a judgement ranking or talk; these are starting possibilities, not routes that settle the choice. An explanation, cause, mechanism or relationship is the case with no obvious channel, and the one most often answered with a summary that only says it back:» «For a beat the lesson relies on, name what the child does with the material (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `Choose the material and the thinking together`);» | opening the catalogue | default | | `references/do-beats.md` › How to pick · L53 | near-duplicate of E02 (a shorter list) and E06 | DOB |
| TD-E11 | «An operation says what the child does, not how hard it is:» «It is not a taxonomy to fill, a formula for choosing a task, a field to record, or a ladder: a lesson needs neither every operation nor any particular one, a later row is not a better row, and a beat does not have to use a different operation from the last.» | the operations table | must not (a taxonomy) | | `references/do-beats.md` › Operations to think with · L549 | near-duplicate of E06's limit, plus: a beat need not use a different operation from the last | DOB |
| TD-E12 | «Read whenever the Teach that just finished explained a cause, a mechanism, a reason or a relationship, or handed children evidence to reason from. This is the commonest chunk in a content lesson and the easiest one to answer with a summary that only says it back.» | after an explanation chunk | pointer | | `references/do-beats.md` › Contents · L71 | pointer; overlaps E02 | DOB |
| TD-E13 | «Read `do-beats.md` core guidance and only the needed registers when a beat needs a short processing form, in any structure.» | the designer's reading | must (read) | | `agents/lesson-designer.md` › Reference Files · L565 | pointer | LD (reading list) |
| TD-E14 | «**Ask what the child would do to show you the answer, on every beat where they produce one.**» «if this child were showing you the answer with the work in front of them, would they point at it, move it, group it, order it, fix it, or tell you?» | every beat where children produce an answer | must | `format`, `activityArchitecture`, `responseForm` | `references/preferences.md` › Worksheets › The printed page · L697 | shared (worksheets, response form); the "then how children respond" step of E06 | STAYS |
| TD-E15 | «Each subject has its own kinds of material: history may work on sources and accounts; science on apparatus, models and results; geography on maps and spatial information; maths on mathematical objects and working; English on language and texts; RE on attributed accounts and religious material; PSHE on strategies and situations.» «a diagnosis can be easy or demanding depending on the material and the support, so judge demand separately.» | choosing the material | default | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L206 | rule (the list E06's «These are examples» refers to, and its demand clause) | PREF-RHY (with E06) |
| TD-E16 | «When the choice of task matters, because it is the main work or the evidence for the learning the lesson claims, compare a genuine alternative: not two route names, and not "this one is more engaging", but the actual explanation and pupil work side by side, asking what each requires a child to know and what a response to each would show. Two complete candidate lessons are never required, and a beat whose choice is routine needs no comparison written down.» | the main work, or a beat relied on as evidence; not a routine beat | must | | `agents/lesson-designer.md` › Settle the classroom experience · L58 | near-duplicate of F01's "Consider plausible alternatives", plus its condition and limit | LD |
| TD-E17 | «2. Notice the response form's actual demands and supports, such as writing load, spoken language, public performance, reading, movement, fine-motor control, partner dependence or visual structure.» | opening the catalogue | check | | `references/do-beats.md` › How to pick · L52 | rule (step 2; steps 1, 3 and 4 are E09, E10 and F10) | DOB |
| TD-E18 | «Then match the form to what was just taught, settling what that teaching needs from children before you name an activity (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `Name what the chunk needs children to do with it`).» | content lessons | must | a test pins its order after D04's sentence | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L51 | duplicate of E01 (the content route's copy) | CONTENT (pointer; keep its place after D04) |

## F. Variety across Do beats, and demand across the lesson

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-F01 | «**Use variety deliberately, without a quota.** Choose worthwhile pupil activity as carefully as the teaching example. Consider plausible alternatives for the particular learning before settling on a response: what will children inspect, handle, decide, rehearse, construct or explain, and why does that action help them learn this idea? Read the planned activities together from the child's side. A run of descriptions and explanations can be monotonous even when every prompt uses the right knowledge; changing the verb or moving the same explanation from writing to a partner does not by itself change the experience. Use the relevant `do-beats.md` entries to find a better-fitting activity when this happens. Simple recall, a sentence stem or a sketch can be the best choice. Repeat a form when the repetition builds the learning, as in arithmetic, spelling or practising a new writing move. There is no register quota, compulsory movement or requirement to make each task harder; choose variety for its learning value and engagement, with manageable preparation and transitions.» | the Do beats read together; repetition kept when it builds the learning | default | pointer name `Use variety deliberately, without a quota` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L216. Copies: F02, F05, F10, F11, L09 | rule | PREF-RHY |
| TD-F02 | «Read the activities together using `preferences.md` → The Teach → Do → Teach → Do Rhythm, `Use variety deliberately, without a quota`. Matching each activity to its preceding teaching is necessary but does not by itself make the sequence well chosen.» | content lessons | must | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L49 | pointer, plus: matching each Do to its Teach is not enough on its own | CONTENT (pointer) |
| TD-F03 | «Most Teach beats in a content lesson explain a cause, a mechanism or a relationship, and that is the chunk most often answered with a written summary that only says it back;» «It is one section of the catalogue, not the route for the lesson. A cause can be matched to its effect (§5.4), sorted by when it helps (§5.1), weighed against a cost (§6), put in order (§4.3) or explained (§10), and a lesson whose every Do beat is `spoken explanation` has picked the channel once and repeated it.» «Before the design is settled, read the Do beats' `format` lines in order: when three or more in a row are talk or written explanation, open §5 and §6 for at least one of them and choose the beat whose pupil action best forces its `thinking` line. A sort, a match or a weighing is not less thinking than a sentence; its placement is the decision, and the reason for the hardest placement is where the explanation goes.» | content lessons only, as written; it counts the Do beats' `format` lines, which the content Do template says to leave null unless the response structure is part of the learning (decision 9) | check (a count trigger: three in a row) | `format`, `thinking` | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L51. Copies: F15, L10 | rule; the only copy of the "three or more in a row" trigger | CONTENT (kept whole; the trigger carried in any fold) |
| TD-F04 | «A Year 4 history lesson on why Tudor children worked (14 September 2026) read only §10, and every beat came out as explain it to your partner; the user taught it as "listen to teacher, class discussion over and over again".» | illustrates F03 | | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L51 | story with your words (in the log, L1233) | LOG for the story; your words may stay without the date |
| TD-F05 | «Vary form when improves learning/attention/access, not quota.» | as F01 | default | | `agents/lesson-designer.md` › The Teach → Do Rhythm · L257 | near-duplicate of F01, plus: names access as a reason to vary | LD-RHY (pointer) |
| TD-F06 | «This document is a selective activity catalogue. `preferences.md` → The Teach → Do → Teach → Do Rhythm owns activity selection and purposeful variety. Use the catalogue while considering what children could do with the learning, before settling every beat as an explanation or a question. Response channel and cognitive demand are separate decisions; an impressive demand verb is not evidence of a well-chosen activity.» | using the catalogue | pointer / must | | `references/do-beats.md` · L5 | pointer, plus: channel and demand are separate decisions | DOB |
| TD-F07 | «**Register is not the same axis as demand, and a lesson needs to be chosen on both.** Register is about attention and access: switching channels keeps children awake and gives a child who fades on writing another way in. Demand is about how hard the thinking is:» «A lesson can span four registers, satisfy every rule about variety, and still ask children to do nothing harder than remember, because nothing in a register check can see that.» | every Do beat | must (both axes) | | `references/do-beats.md` · L7 | rule; only here: variety of channel does not give variety of demand | DOB, or PREF-RHY beside F01 (decision 1) |
| TD-F08 | «So pick each beat on both axes, and think about the shape across the lesson rather than beat by beat.» «This is the band that quietly fills a lesson, because these beats are the easiest to write.» | the three demand bands | default | | `references/do-beats.md` · L9 | rule (the surface band's warning); shared with quick checks for its fresh-case clause (L11) | DOB |
| TD-F09 | «**The shape across the lesson matters more than any single beat.** Follow `preferences.md` → The Teach → Do → Teach → Do Rhythm for the whole-lesson judgement, including main practice. These bands describe choices, not a compulsory sequence. A short response can establish new knowledge; select meaningful use or reasoning where the objective supports it rather than making the last Do harder by position alone.» | the lesson's demand | default | | `references/do-beats.md` · L17 | duplicate of F12 | DOB (pointer) |
| TD-F10 | «4. Read the sequence of pupil actions together against the purposeful-variety judgement in `preferences.md`. Keep useful repetition; reconsider a string of generic explanations even when each individually matches the taught content.» | choosing formats | check | | `references/do-beats.md` › How to pick · L54 | duplicate of F01 | DOB |
| TD-F11 | «There is no compulsory non-writing activity, fixed content-to-format route or SEND format. Familiar repetition is appropriate when it builds the target skill.» | choosing formats | must not (a quota) | | `references/do-beats.md` › How to pick · L56 | near-duplicate of F01's limit, plus: no fixed content-to-format route and no SEND format | DOB |
| TD-F12 | «**Climb the demand across the lesson, without forcing a staircase.** A response after new teaching may simply establish or retrieve it, including the last short response before main practice. Plan worthwhile use or reasoning across the lesson where the objective supports it; main practice can supply that progression. Do not demand a harder intermediate task solely because it is the last Do.» «Read the finished sequence through its expected pupil answers, not its activity labels. For each claimed reasoning task, identify the decision the child must still make after the teaching and visible support.» «Useful rehearsal stays, but a lesson whose responses all retrieve supplied conclusions needs worthwhile use where the objective supports it.» | the lesson's demand; a task-centred lesson may hold one level; a lesson may return to a simpler check | default | pointer name `Climb the demand` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L224. Copies: F09, F13, F14, L08 | rule; its paraphrase clause is shared with quick checks | PREF-RHY |
| TD-F13 | «Demand climbs across lesson where the objective supports it; `preferences.md` owns that judgement across teaching responses and main practice together. A short recall response may secure new knowledge, including in the last Do. Read what children actually do; do not label recall as reasoning or force each response to be harder.» | as F12 | default | | `agents/lesson-designer.md` › The Teach → Do Rhythm · L257 | duplicate of F12 | LD-RHY (pointer) |
| TD-F14 | «Follow the demand judgement in `preferences.md` → The Teach → Do → Teach → Do Rhythm across the whole lesson, including Practise. A short response can establish newly taught knowledge; its position as the last Do does not require a harder question.» | content lessons | default | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L51 | duplicate of F12 | CONTENT (pointer) |
| TD-F15 | «**A why lesson is not only explaining, over and over.** When the objective is to explain why people did something, the reflex is to make every Do beat an explanation to a partner, and the lesson arrives as a situation, a question, a situation, a question. A sort, a match or a weighing can carry the same causal decision a sentence would, with less reading and less waiting;» «and the written explanation is the final performance, not every beat on the way to it. What decides whether a placement is the thinking is what a child has to know to make it,» | history why-lessons | default | | `references/subject-history.md` › Choose the response that reveals the history · L135 | near-duplicate of F03, with your Tudor calibration (the lesson you taught on 15 September) | SUBJ (stays with the calibration) |
| TD-F16 | «**A repetition earns its place by changing something.** More items is not more practice.» | practice items (evidence) | default | | `references/evidence-synthesis.md` › 4. Independent Practice · L115 | shared (practice and worksheets); the same test as G15 for practice | EVID |
| TD-F17 | «It does not have to climb from simple to hard in a fixed order.» | a content Practise | must not (a fixed climb) | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L57 | duplicate of F12's limit | CONTENT |
| TD-F18 | «Use sparingly. Do not stack four of these in one lesson.» | 3.1 One-Sentence Summary | must not (four in one lesson) | | `references/do-beats.md` › 3.1 One-Sentence Summary · L173 | shared (quick checks, QC-D11); the catalogue's only numeric variety limit, beside F03's "three in a row" | STAYS |

## G. Each beat changes the state of the lesson: links, claims, building a set

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-G01 | «**Each major beat changes the state of the lesson, and what follows builds from that change.** A teacher flicking through the deck should feel that each slide comes next because of the one before it, not only that it belongs to the topic. What a beat changes is what children now know, notice, can do, have decided, are wondering or have produced, and the next beat normally depends on that: its own words pick up the thing just found or made, so a starter's discovery becomes an ingredient of the lesson rather than a warm-up that disappears, and a safety idea just taught is visibly one of the things the agreement now has to protect.» | every major beat; "normally" | default | pointer name `Each major beat changes the state of the lesson` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L218. Copies: G11, G12, L04 | rule | PREF-RHY |
| TD-G02 | «Each beat records this in its own `unlocks` line, one short sentence naming what children can now do that a later part needs, written as the thing gained rather than the activity done, and left `null` where the beat honestly sits beside the spine. Writing it is the point rather than filling it: a beat whose line you cannot write by looking forward is telling you something before any reviewer does.» | recording each beat | mechanics | `unlocks` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L218 | shared (the spine owns `unlocks`) | STAYS |
| TD-G03 | «The test is movability: if a major beat could sit somewhere else in the lesson with nothing lost, ask what it changes and what depends on it. That is a challenge to answer, not an automatic fault, because vocabulary, a routine, a safeguarding note or setup can legitimately sit beside the spine rather than on it. Sources or cases can also contribute different evidence to the same later comparison without depending on each other in a fixed order; their contribution to that final understanding answers the challenge. And the link is written only where it is real: a beat is never made to produce an artefact so that the next beat has something to name, and beats are not welded into a chain for the sake of it, because forced linking imposes one lesson shape on every subject.» | every major beat; exceptions: beats beside the spine, parallel evidence | check (a challenge, not a fault) / must not (forced links) | the second sentence is a vocabulary pin (VOC-E38, held in this section) | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L218. Copies: G12, L04 | rule; shared with vocabulary for the pinned sentence | PREF-RHY (the pinned sentence stays in this section) |
| TD-G04 | «**A link carries learning, not just an object or a phrase.** Reusing the same photograph, referring to the previous slide or writing "Now use what you learned" is not evidence that understanding accumulated. Trace a representative final performance backwards: which newly learned fact, distinction, relationship or action makes each part possible, where was it taught and used, and what did the next major stage need from it? Then read forwards to check those ingredients are available when needed. The final performance can be the last practice or completed task; do not add an Apply slide solely for this check.» «Parallel sources may instead contribute evidence to a later shared comparison; they need not depend on each other. This is a design and review judgement using the existing `unlocks` line and actual content, not another per-beat form, written artefact or progress banner.» «when a link is in doubt, ask what learning, useful practice or evidence would be lost if the beat disappeared, and "the arrows would read less smoothly" is not an answer.» | the whole sequence | check | pointer name `A link carries learning` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L220. Copies: G10, L02 | rule | PREF-RHY |
| TD-G05 | «In a number-line lesson, finding the endpoint difference enables finding one interval's value, which enables locating an unlabelled point. Merely naming the endpoints and then asking for a point without teaching the scale leaves the dependency missing.» | illustrates G04 | | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L220 | example | with G04 |
| TD-G06 | «**Read a link as four things in the actual content.** What children do; what that makes visible or understandable; what is checked or clarified; what the next teaching or task uses.» «What travels can be knowledge, a method, a question or a representation, and it needs no written artefact.» «**When later work builds on what children produced, the class has the right version first.** Give the teacher the expected answer and the one correction that matters through the existing answer and `teacherInfo` route, so a class that sorted the deal wrongly does not spend the next task treating its own mistake as the history. That is a brief check the teacher runs, not an answer slide after every beat and not generic advice to circulate.» | every link; the correct-version rule when later work builds on an earlier product | check / must | `teacherInfo`, `answer`; pointer name `Read a link as four things in the actual content` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L222. Copies: G14, L05 | rule | PREF-RHY |
| TD-G07 | «**Claim what the work can show, and no more.** Write the claim in `unlocks` and the walk-through to match the task children actually do:» «It orients the class or checks a detail was noticed. It is not independent inference.» «It consolidates the arrangement and prepares later work. It is not automatically deeper than explaining it.» «Application, when no cue or completed comparison already gives the answer.» «A new connection or use, when the response really requires it and the teaching supports it.» «It can be the whole worthwhile activity when the reason has to be worked out. Talk is not second best.» «It can support the work; it never establishes the quality of the thinking by itself.» «A Do does not have to produce a new discovery. The gain can be a clearer representation, a more fluent performance, a corrected misunderstanding or reliable evidence that the teacher can move on.» | every claim in `unlocks` and the walk-through | must | `unlocks`; pointer name `Claim what the work can show` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L226. Copy: G14 | rule (the table) | PREF-RHY |
| TD-G08 | «**Where the lesson is going to hand over a set, let the class build it first.**» «Built by the class first, every chunk afterwards answers a question the children asked. So put the situation in front of them and ask for the set before you teach it:» «Two or three minutes, their words on the board, and each chunk names the item it is answering as it arrives.» | a content lesson that hands over a set; limit G09 | default | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L212 | rule | PREF-RHY |
| TD-G09 | «The limit is what a child can honestly produce, and it is a hard one. This works when the set comes from being a person rather than from knowing the topic: needs, uses, reasons, the jobs a familiar thing does. It fails when the set is the knowledge itself, and then asking for it is guessing dressed as elicitation, with the added cost that a wrong list is what the class will remember:» «Test it by answering your own question as a nine-year-old who has not met the topic. If you cannot, teach the set.» | the limit of G08 | must | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L214 | rule (limit) | PREF-RHY |
| TD-G10 | «Test the cumulative route by working a representative final performance backwards to its taught ingredients, then forwards through their first use (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `A link carries learning`). Reusing a resource or saying "now use it" does not establish a dependency. Use the existing `unlocks` line, content and expected answers; do not add another per-beat report.» | before designing | check | `unlocks` | `agents/lesson-designer.md` › Before You Design Anything · L114 | duplicate of G04 | LD (pointer) |
| TD-G11 | «Each arrow is a change in what the class can now see, do or decide, not a change of activity.» «a row of arrows labels an order and cannot make one beat need the last, which is why an earlier version of this file that asked arrows to carry the spine was retired (2 September 2026); the spine is carried slide by slide below, in each slide's why.» «Read it back with the objective covered: if it could be the line for any lesson on this topic (`starter → teach → do → teach → do → practise`), it is the route, not this lesson's journey, and the lesson has not been designed yet.» | the walk-through's journey line | check | | `agents/lesson-designer.md` › Write the lesson, then the contract · L403 | rule; the "retired (2 September 2026)" clause is maintainer history | LD; the maintainer clause to LOG |
| TD-G12 | «- why it is here: what each major beat changes, in one line: the change it makes and the later beat that depends on it, with the link carried in that later beat's own words. This is the `unlocks` line in the words a teacher reads;» «A slide that honestly sits beside the spine (the vocabulary slide, a routine, a safeguarding note, setup) says so: that is a real answer to the movability challenge, and never forced linking to fill the line.» | the walk-through, every slide | must | `unlocks`; vocabulary pin VOC-E40 | `agents/lesson-designer.md` › Write the lesson, then the contract · L414 | duplicate of G01 and G03 in walk-through form | LD |
| TD-G13 | «`null` is a real answer for a beat beside the spine (a vocabulary moment, a routine, a safeguarding note, setup, the final performance), and a beat is never given a manufactured artefact so that a later one has something to name.» «A line that names the final task as what it feeds has to name the move the final task makes with it, and that move has to be the one this beat had children make.» «Governed by `preferences.md` → The Teach → Do → Teach → Do Rhythm, `Each major beat changes the state of the lesson`; the field's contract is in `output-template.md`.» | recording `unlocks` | mechanics | `unlocks`; vocabulary pin VOC-E39 | `agents/lesson-designer.md` › The Teach → Do Rhythm · L247 | shared (the spine owns `unlocks`); near-duplicate of G03, plus: «the final performance» sits beside the spine, and a line naming the final task must name the move this beat had children make | LD-RHY |
| TD-G14 | «Where a later beat works on what children produced in an earlier one, the earlier unit's `answer` or `teacherInfo` gives the teacher the expected version and the one correction that matters, so a class's mistake is not what the next task builds on; and each claim in `unlocks` matches what that task can honestly show (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `Claim what the work can show`).» | the completion pass | check | `answer`, `teacherInfo`, `unlocks` | `agents/lesson-designer.md` › One Completion Pass › Learning and evidence · L513 | duplicate of G06 and G07 | LD |
| TD-G15 | «- **Same job twice:** Read the beats in order and name what each one asks a child to do, in your own words rather than by its label. Two that come out the same sentence are one beat and a repeat of it, however different their headings look:» «Keep whichever is the better evidence, and either cut the other or change what it asks. This is not the rule against a second instance of an idea, which is right and wanted when the evidence changes; it is two beats over the same evidence asking for the same thing.» | the completion pass; not a second instance of an idea on new evidence | check | | `agents/lesson-designer.md` › One Completion Pass · L516 | rule (in this form only in the designer's completion pass; its science example is in the log, L2105); its near relatives G21 and G22 compare what is new to notice rather than what two beats ask | LD, or PREF-RHY beside H01 (decision 1) |
| TD-G16 | «**Purpose.** A run of three or four beats in which what children produce or come to understand is what the next beat works on.» «Four formats, a fresh picture on each slide, and every beat could run in any order, because none uses what the last one produced. The variety is in the channel only.» «Each beat's outcome is the material the next beat works on, and nothing new was added to make it look harder.» «Not every beat depends on the one before.» «a sequence does not need a named character, a chain between every pair of slides, or each later beat to be harder because it is later.» | calibrating a sequence of beats | check | vocabulary pin VOC-E43 on the section's last sentence | `references/task-contrasts.md` › A short sequence · L71 | rule with a weak and a strong example (calibration) | STAYS (task-contrasts) |
| TD-G17 | «The order that works is the one where each beat answers a question the class is already asking because of the beat before:» «The two tells that a lesson has been filed rather than sequenced: an abstract tool taught before any case needs it, and a beat that could swap places with its neighbour without either reading oddly.» | ordering the lesson | check | | `references/preferences.md` › What a Lesson Is For · L162 | shared (What a Lesson Is For); near-duplicate of G03's movability test, where it is a "tell" rather than "a challenge, not a fault" | STAYS |
| TD-G18 | «a Teach is there because the Do cannot be done without it, the Do is there because the next Teach builds on what the child has just used, and the final task is there to draw together what the stages built.» | every stage | | | `references/preferences.md` › What a Lesson Is For · L146 | shared (What a Lesson Is For) | STAYS |
| TD-G19 | «A move whose first performance is the final task is a stage the lesson is missing,» | the final task's moves | must | | `references/preferences.md` › What a Lesson Is For · L164. Copy: J38 | shared (What a Lesson Is For) | STAYS |
| TD-G20 | «When the next task works on the same object (the sorted cards, the marked map, the drawn circuit), that object is in front of the class again; when it works on an idea, no card has to follow it through the slides.» | a link to the next task | must | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L222 | rule (on G06's line) | PREF-RHY |
| TD-G21 | «Each time the same object or text comes back, name what is new to work out. A second instance of an idea on new evidence, and practice that repeats a known move on purpose, are right; the same evidence met again with nothing new to notice is time spent,» | every review | must (REVISE on User-fit when it happens more than once) | | `agents/design-reviewer.md` › Material-defect boundary · L42 | shared (Pride Lessons, amount); a near relative of G15 | STAYS |
| TD-G22 | «the same evidence met again with nothing new to notice is not, and a lesson that does this more than once has been built on one case.» | the designer's amount check | check | | `agents/lesson-designer.md` › One Completion Pass › Amount · L519 | shared (Pride Lessons, amount); a near relative of G15 | STAYS |

## H. A beat with a second job, and runs of teacher-only beats

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-H01 | «Two tells that the spine has broken: a beat carrying a second job that has no beat of its own (a routine appended to the conclusion, a fact bolted onto a task), and a run of slides that are all the teacher talking, because each thing children do is where the lesson turns.» | every lesson | check (tells) | the routing card's trigger (L17) | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L218. Copies: H02, H03, H05, L07 | rule; decision 2 (the reviewer makes the second tell a defect with no exception; this one is worded in slides, and a test holds the words, so read literally it catches your own two Tudor boards for one beat) | PREF-RHY |
| TD-H02 | «The finish carries one job: completing the task. Something the lesson must also establish that has no beat of its own (a class routine, a piece of information, a safety note) tends to get appended to whichever beat is nearest, usually this one, and the lesson's line breaks there: children finish the product and then meet a new thing with nothing to do with it. Give it a home on the line instead. If the task can use it, it is an enabling idea before the doing. If it belongs to the product, put it in the product: a question box is a rule about how we ask questions, so it can be one of the agreement's own rules. If it is a routine rather than learning, it lives in the teacher's notes.» | the task-centred finish, as written; the repairs fit any route | must | | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L35 | near-duplicate of H01's first tell, plus: the only copy of the three repairs (enabling idea, part of the product, teacher's notes) | TASK; the repairs to PREF-RHY beside H01 (decision 1) |
| TD-H03 | «- **One job twice over, in one beat:** the inverse of the check above, and it hides better, because a beat holding two tasks looks full rather than wrong. Read each beat's `unlocks` line and count the gains in it.» «one thought cannot cover two tasks, so a beat whose thought fits only half of what it asks is two beats. Nothing downstream can repair this, because the Slide Designer copies your wording exactly and may not decide that one of your tasks is a separate beat. Split it here: each task gets its own beat, its own `thinking`, its own `unlocks` and its own slide. The limit is a genuine single task with parts (a claim to judge and the explanation of that same claim; a calculation and the sentence about that same calculation), which is one job and stays one beat.» | the completion pass; limit: one task with parts | must | `unlocks`, `thinking` | `agents/lesson-designer.md` › One Completion Pass · L517 | rule (its example is in the log, L2031); related to H01's second-job tell | LD, or PREF-RHY beside H01 (decision 1) |
| TD-H04 | «**Make each pupil action independently presentable.** One source unit must not hide several separate actions inside one content.task or pupilInstruction. When children first sort, then explain, then generate new case, write three consecutive source units, each own prompt and answer.» | every pupil action, as written with no limit | must | `content.task`, `pupilInstruction` | `agents/lesson-designer.md` › Worksheet · L359 | rule; not a copy of H03: it has no limit, and its sort-then-explain example is split into three units where H03's limit and Z18 keep a placement and its reason in one beat; decision 10 | LD |
| TD-H05 | «Packing the ideas into one unit with one check after all of them puts several slides of the teacher talking in a row, and the deck reads as a run of separate slides rather than a lesson moving somewhere.» | task-centred enabling input | must | | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L19 | near-duplicate of H01's second tell | TASK |
| TD-H06 | «What counts as input is storytelling, shared reading of something substantial, and thinking aloud in front of them, broken up with children responding throughout. It is not thirty minutes of talking.» | history input | must | | `references/subject-history.md` › Which move routes to which structure · L85 | near-duplicate of H01 and A09 for history | SUBJ (with K13) |
| TD-H07 | «When the caveat is genuinely for the children (`you can choose to pass`, `you don't have to tell me what you believe`), it is not an aside either: it is taught, in its own beat, with its own words, where the class can take it in.» | a caveat meant for the children | must | | `agents/lesson-designer.md` › Speaker Notes Voice · L94 | rule (a home for a would-be second job, beside H02's three repairs) | LD, or PREF-RHY beside H02 (decision 1) |

## I. Orientation is not automatically a Teach chunk

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-I01 | «**Orientation is not automatically a Teach chunk.** Give children the context needed to enter the first example: what the topic is, where or when it belongs, or why the question arises. Fold a short orientation into the opening when it stays clear; let it occupy a brief separate presentation moment when combining it would overload the first teaching object. This does not require a manufactured Do activity or a full extra teaching cycle. When the groundwork is itself new learning children must use, teach and process it as a real chunk. Choose the amount from what these children need, not a fixed line count or a compulsory timeline.» | the opening of every lesson; exception: groundwork that is new learning children must use | must (give the context needed); may (a separate moment); the assumed-knowledge ledger records the same sentence as must (AK-B15) | pointer name `Orientation is not automatically a Teach chunk` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L188. Copies: I02, I03, L06 | rule; decision 3 (in a knowledge lesson the separate moment can only be the first half of a split first Teach) | PREF-RHY |
| TD-I02 | «**Every beat earns place against objective, and beat serving indirectly says so out loud.**» «When it is orientation children will not use (what the subject is, why we are here, scene-setting), it is not automatically a chunk and needs no manufactured Do. Give it only the brief context the opening needs, separately when folding it into the first example would overload that example» «Quick check: could child say what today's lesson was about after every beat, or would one leave thinking lesson about something else? Where beat serves nothing objective asks and cannot be linked back honestly, cut.» | every beat | must | | `agents/lesson-designer.md` › The Teach → Do Rhythm · L255 | near-duplicate of I01, plus (only here): every beat earns its place against the objective, groundwork lands back on the objective, the "what was today about" check, and cut | PREF-RHY for the additions, "cut" carried with its three limits I09 to I11 (decision 1); LD-RHY points |
| TD-I03 | «**Orient children enough to enter the first example.** Follow `preferences.md` → The Teach → Do → Teach → Do Rhythm: a brief separate presentation moment is allowed when it avoids overloading the first Teach, without inventing a Do for scene-setting. New prerequisite learning that children must use still earns teaching and processing.» | content lessons | may | code: every content Teach must be followed by a Do or a Practise, and the route has no other beat for this moment | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L27 | duplicate of I01; the code accepts no beat of its own for the moment, but a split first Teach gives it a slide (decision 3) | CONTENT |
| TD-I04 | «Make the focused question, phenomenon and relevant prior knowledge clear. Give children enough information to know what they are observing, comparing or changing without revealing the finding they are meant to reach.» | Discovery's opening beat | must | `question` unit | `references/teaching-sequence-discovery.md` › Orient to the question · L21 | rule (Discovery's own orientation beat) | DISC |
| TD-I05 | «**Choose the opening that makes the first learning accessible.** Begin with observation when the material is intelligible enough for children to notice something useful for the explanation that follows. Teach a necessary term, context or idea first when that will help them understand or attend to the material. Direct teaching does not need an exception justified by observation being impossible.» | content lessons | default | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L25 | rule (the next sentence is vocabulary's VOC-E28) | CONTENT |
| TD-I06 | «What stays in the notes is the *framing* — the why-it-matters, the orientation, the teacher's delivery voice.» | task-centred Set the Task | must | | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L15 | rule (task-centred orientation lives in the notes) | TASK |
| TD-I07 | «**Predictions, framing, and orientation are not part of the starter.**» «Both belong to their own beat — usually right after the question is properly posed on a Set the Task slide — not folded into the starter slot.» | the starter | must | | `references/preferences.md` › Starters · L305 | shared (Starters); bears on decision 3 | STAYS |
| TD-I08 | «Children can speculate from their own world at the start of a lesson, and they should.» «Keep it short, four or five minutes, because the recorded failure of this shape is guessing consuming the lesson and leaving no time for the period.» | a history opening | default | | `references/subject-history.md` › Knowledge before judgement, inside the lesson · L93 | rule (history's speculative opening) | SUBJ |
| TD-I09 | «A brief relevant fact can also earn its time as interesting subject knowledge children take away, without becoming a new assessed objective. Remove detours that crowd out the learning; do not mistake the fewest facts or slides for the clearest lesson.» | every beat and fact | may (a brief fact); must (remove detours) | | `agents/lesson-designer.md` › Write the lesson, then the contract · L399. Copies: I10, I11 | rule (a limit on I02's "cut") | carried with I02 (decision 1) |
| TD-I10 | «Brief relevant enrichment may be worthwhile knowledge in its own right; a substantial new strand still needs a place within the objective, teaching and available time.» «Preserve the explicit knowledge needed for meaningful success rather than making the teaching thin.» | content Teach beats | may / must | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L21 | near-duplicate of I09, plus: the counterweight to B01's "Long teacher talk" (do not make the teaching thin) | carried with I02 and B01 (decision 1) |
| TD-I11 | «Preserve knowledge needed for the response and brief relevant enrichment that earns its time as worthwhile subject learning; it need not all be assessed.» | content lessons, at review | must (preserve) | | `references/design-review-route-checks.md` › Content-based · L13 | near-duplicate of I09, as the reviewer's limit | RC |

## J. How each route states the rhythm

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-J01 | «**The rhythm holds in every structure.** Skill-based lessons carry it as the guided and independent practice that follows each modelled move, never as one block of practice at the end of several models» «Content-based as a Do beat after each chunk, Dialogic as talk after each stimulus. Discovery and Task-Centred are not exempt because their teaching is short: an enabling input that tells children two distinct ideas before they use the first is the same failure as two Teach slides in a row, and it is where a task-centred lesson most often goes flat.» | every route | must | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L178. Copies: J03, J04, B11 | rule; the summary leaves out content's Teach-then-Practise exception (J33) and Discovery's single Teach why (decision 4) | PREF-RHY |
| TD-J02 | «(the route file's cycle grammar enforces this: every My Turn plus Our Turn cycle ends with its own Your Turn, and it was previously possible to satisfy the route while breaking this sentence)» | | | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L178 | maintainer ("it was previously possible") | LOG; decision 7 |
| TD-J03 | «Skill-based: child-processing = guided + independent practice. Content-based: short use/processing beat after each chunk. Dialogic: Stimulus→Talk. Discovery: Explore before Teach why, Use learning after. Task-Centred: one enabling idea per `teach-needed` unit, each used through its `pupilInstruction` before the next is taught; only the last may be used by the plan or the task itself. Short teaching is not exempt: two ideas told before children use the first is the same failure as two Teach slides in a row.» | every route | must | `teach-needed`, `pupilInstruction` | `agents/lesson-designer.md` › The Teach → Do Rhythm · L245 | duplicate of J01, plus: the task-centred field rule | LD-RHY (pointer, keeping the field rule) |
| TD-J04 | «**Skill-based:** My Turn → Our Turn → Your Turn. Short explanation when skill needs it, else straight to model. One cycle may contain closely connected manageable variations; split when genuinely different procedures/decision rules or combined complexity too high.» | choosing the route | | | `agents/lesson-designer.md` › Structure Decision · L138 | near-duplicate of J10 and J11, plus «decision rules» as a reason to split (J27 has it too, J11 does not) | LD (Structure Decision) |
| TD-J05 | «**Read one teaching-sequence file per lesson, not all five.** Structure already chosen - other files describe shapes that don't apply, carrying them risks blending rhythms.» | reading | mechanics | | `agents/lesson-designer.md` › Teaching Sequence - Read Matching Reference · L273 | rule (reading) | LD |
| TD-J06 | «Teaching-sequence gives the rhythm. The subject file gives the thinking inside it, and where the subject file says what a chunk is in its subject (history: a piece of the past, with the historian's move taught inside the beat that needs it), that decides the spine, because the rhythm exists to serve the subject's learning and not the other way round.» | every lesson with a subject file | must | | `agents/lesson-designer.md` › Subject Discipline · L277 | rule (the only statement that a subject file decides what a chunk is) | LD, or PREF-RHY (decision 1) |
| TD-J07 | «**Structure sets rhythm, but how you ready children is decision within it - not reflex.** Enabling input can be narrated model, worked example to study, flawed example to critique, guided practice, concrete/embodied experience physically enacted, short warm-up, or nothing if already hold schema.» «Modelling strong default for genuinely new material; other moves equals when conditions favour them, not lesser.» | the enabling input in every route | default | | `agents/lesson-designer.md` › Subject Discipline · L285 | rule; shared with evidence §2 (the menu) | LD |
| TD-J10 | «My Turn → Our Turn → Your Turn is the core rhythm. Add a short explanation before My Turn when the actual skill needs one; otherwise move straight into modelling.» | skill lessons | must | | `references/teaching-sequence-skill-based.md` · L3 | rule | SKILL |
| TD-J11 | «For each skill being taught, design a My Turn → Our Turn → Your Turn sequence. Small variations of one procedure may share a cycle only when they are closely connected and easy enough to learn together. Split them when combining the variations creates too much complexity, even if they belong to the same broad procedure.» | skill lessons | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L15 | rule | SKILL |
| TD-J12 | «For each concept, use zero or more preparation units when genuinely needed, then **one or more cycles**. Each cycle is one My Turn source unit carrying that move's modelled examples, then at most one Our Turn for the same concept, then **its own Your Turn**.» «The Our Turn is present unless the omission test in the Our Turn section applies; omitting it is a purposeful decision, not a shortcut.» | skill lessons | must (code) | `prepare`, `my-turn`, `our-turn`, `your-turn`; validator: the cycle grammar | `references/teaching-sequence-skill-based.md` › Output Format Block · L213 | rule; the reviewer does not read below this file's Output Format Block line (decision 6) | SKILL (above the line, decision 6) |
| TD-J13 | «**Every cycle ends with its own Your Turn, and it is a check rather than the main practice.**» «The your turns are good because they are a quick check of can we do this before moving on to the next concept, even if its similar.» «So the Your Turn after a cycle answers one question, can the class do this yet, and it is sized to the cycle rather than to the lesson.» «The substantial independent practice is the last cycle's Your Turn,» | skill lessons | must (code: a cycle must end with a Your Turn); prose only: a check rather than the main practice, sized to the cycle | validator: "has a My Turn cycle with no Your Turn after it"; test_every_cycle_ends_with_its_own_your_turn; the refusal message itself carries "sized to that cycle" and the bridging floor, and tests pin both | `references/teaching-sequence-skill-based.md` › Output Format Block · L215. Copies: J25 (a different size) | rule with your words | SKILL (above the line, decision 6) |
| TD-J14 | «A lesson that runs three cycles and practises once at the end leaves the first move a single demonstration away from independent work, and a Year 4 rounding lesson did exactly that:» | illustrates J13 | | | `references/teaching-sequence-skill-based.md` › Output Format Block · L215 | story (in the log, L2011) | LOG; the reason stays |
| TD-J15 | «Three further source-unit kinds are available in this route, `prepare`, `teach` and `practise`, each placed where this lesson earns it rather than at a fixed point, and each used as many times as the lesson needs or not at all.» «i dont want to limit it to starter, answers, key vocab, mtotyt cycles. If it thinks teach in a place do it,» | skill lessons | may | `prepare`, `teach`, `practise`; vocabulary pin VOC-E34 on the paragraph | `references/teaching-sequence-skill-based.md` › Output Format Block · L217 | rule with your ruling (your words; in the log, L1997) | SKILL |
| TD-J16 | «The one thing fixed is the cycle itself: between a My Turn and its Your Turn nothing intervenes, because a class modelled to and then taken somewhere else arrives at its check having lost the thread. The other beats sit before a cycle or after it,» | skill lessons | must (code among the sequence's beats; a vocabulary slide anchored after a My Turn is not refused) | vocabulary pins VOC-E47 and DEC-07 on this line | `references/teaching-sequence-skill-based.md` › Output Format Block · L219. Copy: Z03 | rule; shared with vocabulary for the pinned words | SKILL (pinned; above the line only with its pin moved, decision 6) |
| TD-J17 | «**A step the method needs and the class cannot yet do at today's size gets its own short cycle, before the cycle that needs it.**» «It is not a lesson inside the lesson: one move, modelled on one or two cases and used once,» «The limit: a step the class has already done at this size, in an earlier lesson or today's starter, is named and left alone, and a remote prerequisite (reading a four-digit number in Year 4) is not retaught.» | skill lessons | must | | `references/teaching-sequence-skill-based.md` › Output Format Block · L221 | rule (its story is in the log, 4.2.221); shared with assumed knowledge (the step trace) | SKILL |
| TD-J18 | «**A `teach` beat carries knowledge the method leans on and does not itself perform**:» «The limit is sharp and it is about what the beat does rather than what it is called: the moment a beat shows how the method is carried out, it is a My Turn and owes the rest of its cycle. Ask what a child could do straight afterwards. If they could attempt a question from having watched, it was modelling.» | skill lessons | must | `teach`; vocabulary pin VOC-E48 on the same line | `references/teaching-sequence-skill-based.md` › Output Format Block · L223 | rule | SKILL |
| TD-J19 | «**Between `prepare` and `teach`, ask whether anything has to survive the lesson.**» «Where both readings fit, ask whether you would be content for the idea to disappear at the first Your Turn.» | skill lessons | check | `prepare`, `teach` | `references/teaching-sequence-skill-based.md` › Output Format Block · L225 | rule | SKILL |
| TD-J20 | «**A `practise` beat is independent work that is not any one cycle's check.** A Your Turn belongs to the move just modelled and is sized to it; a Practise unit is the work that draws on more than one,» | skill lessons | mechanics | `practise` | `references/teaching-sequence-skill-based.md` › Output Format Block · L227 | rule | SKILL |
| TD-J21 | «**Several examples of one move belong inside one My Turn unit; a genuinely different move earns its own cycle rather than a second My Turn beside the first.** A unit becomes its own slide, so two My Turn slides in a row means children watched two things before practising either:» «so the sequence runs My Turn, Our Turn, Your Turn, My Turn, Our Turn, Your Turn and each move is used, and checked on its own, before the next is taught. `validate-lesson-design.py` refuses two My Turn units in a row for the same concept, and the slide check refuses two consecutive My Turn slides (`MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`),» «This is a structural rule rather than a preference to weigh.» | skill lessons | must (code, twice) | validator: "has two My Turn units in a row"; `MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`; test_a_my_turn_is_used_before_the_next_is_taught | `references/teaching-sequence-skill-based.md` › Output Format Block · L229 | rule (its story is in the log, L1967); "for the same concept" is narrower than the code, which refuses any two My Turns in a row | SKILL |
| TD-J22 | «**Our Turn**: one or more fresh guided examples, all held in the cycle's one Our Turn unit (a second Our Turn unit is refused), with the amount chosen from the concept's likely difficulty. Children do the important thinking alongside the teacher rather than only watching.» | skill lessons | must (code) | validator: "has two Our Turn units in a row" | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L73 | rule | SKILL |
| TD-J23 | «Include an Our Turn unless guided participation would remove no barrier the model and success criteria have not already removed — because the learning is already secure enough, or because of the recording case below; do not use either exception to jump from one model to independent work on genuinely new or difficult learning.» | skill lessons; two exceptions | default; must not (use either exception to jump from one model to independent work on new or difficult learning) | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L79 | rule | SKILL |
| TD-J24 | «**When a concept records what children have just done, one model then release is the default.**» | a recording concept | default | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L81 | rule | SKILL |
| TD-J25 | «**Your Turn** — enough meaningful independent practice for the target action, cases and response cost.» «The practice must still be sufficient to establish and demonstrate the learning.» | skill lessons | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L83 | near-duplicate of J13 with a different size: J13 sizes an early cycle's Your Turn to the cycle as a quick check, this asks for enough to establish and demonstrate the learning; a fold keeps J13's condition | SKILL |
| TD-J26 | «So may a **bounded first attempt** at the target itself — a few minutes with the real equipment or task before any model:» «its job is to give the full modelling that follows immediately something real to explain,» | skill lessons, when the attempt is safe, cheap, quick and self-checking; not maths (K18) | may | `bounded-attempt` | `references/teaching-sequence-skill-based.md` · L7 | rule | SKILL |
| TD-J27 | «**Structure.** A short explanation when the skill needs it → My Turn → enough guided practice for the likely difficulty → Your Turn → optional Apply.» | skill lessons (evidence) | | | `references/evidence-synthesis.md` › 9. Lesson Structures › Skill-based · L208 | near-duplicate of J11; one cycle only, no "every cycle ends with its own Your Turn" | EVID |
| TD-J28 | «**Avoid.** Treating every lesson type as a My Turn → Our Turn → Your Turn sequence;» | every route (evidence) | must not | | `references/evidence-synthesis.md` › 3. Guided Practice · L91 | rule | EVID |
| TD-J29 | «**A bridging cycle on small numbers earns two questions, not none**: "even if its similar ... maybe your turn just has less questions".» «which is also where `subject-maths.md`'s blocked-then-mixed rule lands, because the earlier cycles' Your Turns are the blocks and the last one mixes them.» | skill lessons, a small-number bridging cycle | must (the floor; in the validator's refusal message) | test_every_cycle_ends_with_its_own_your_turn pins the floor | `references/teaching-sequence-skill-based.md` › Output Format Block · L215 | your ruling (your words, spliced from two remarks, L2021 holds the second); on J13's line | SKILL (above the line, decision 6) |
| TD-J40 | «In the structured hand-off, each genuinely distinct My Turn modelled move is its own `my-turn` source unit inside the same concept, so it can carry its own starting instance, modelling state, representation configuration, script and answer/model.» | skill lessons | mechanics | `my-turn` | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L51 | rule; read alone it sends the designer to two My Turns in a row, which J21 and the code refuse unless each opens its own cycle; decision 7 | SKILL, wording corrected |
| TD-J41 | «Reaching an unmodelled case means another example inside the My Turn when it teaches the same move, or a second cycle when the case is genuinely a different move (the structure section below governs which); it never means a second My Turn slide stacked on the first.» | skill lessons | must not (a stacked My Turn) | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L23 | near-duplicate of J21, plus its own must-not for an unmodelled case | SKILL |
| TD-J42 | «Keep question-shape consistent across My/Our/Your Turn.» | skill lessons | must | | `agents/lesson-designer.md` › Lesson Components · L166 | rule (the design-side partner of N02) | LD |
| TD-J43 | «Our Turn need not match My Turn in number.» | skill lessons | may | a test pins it | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L21 | rule | SKILL |
| TD-J30 | «# Teaching Sequence — Content-Based (Teach → Do → Teach → Do)» | | mechanics | heading | `references/teaching-sequence-content-based.md` · L1 | pointer (the file's name for the rhythm) | CONTENT |
| TD-J31 | «For each knowledge chunk being taught, design a Teach slide paired immediately with a Do beat. Multiple Teach→Do pairs in sequence. A main Practise applies the body of knowledge the pairs have built, and it sits where the class is ready for it: conventionally after the last pair, or after any complete Teach→Do pair once children hold what the substantial work needs.» «The judgement is readiness, not position.» «What stays is the preparation: at least one short Teach→Do pair comes before the first Practise, so the main work is never the first time children use what the lesson taught. The limit runs the other way too: a Practise brought forward because the lesson looks long, before the knowledge it runs on is taught, is a guessing task, and the beats kept after an early Practise each earn their place or go; an early main task is not a reason to keep every later task as compulsory work.» | content lessons | must (code: at least one pair before the first Practise, a Practise present) | `teach`, `do`, `practise`; validator: "Content-based Practise needs at least one Teach -> Do pair before it"; test_the_main_work_sits_where_the_lesson_earns_it | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L15. Copies: B11, B12, L13 | rule | CONTENT |
| TD-J32 | «A Year 4 history class (15 September 2026) could have written its explanations after the second chunk and instead sat through three more short whiteboard beats on the carpet,» | illustrates J31 | | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L15 | story (the log holds the lesson, L1135, but not this placement point) | LOG (copy the placement point first) |
| TD-J33 | «When the use of a chunk is itself the substantial work (a sort or an explanation that has grown past a quick check), that Teach leads straight into the Practise with no token Do between them, because the Practise is its use.» | content lessons | may (code) | validator: "Every Content-based Teach must be followed immediately by Do, or by the Practise that uses it" | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L15. Copy: L13 | rule (the one exception to "a Do after every Teach"; missing from J01 and J03) | CONTENT, and named in PREF-RHY's route summary (decision 1) |
| TD-J34 | «When this bounded pre-teach experience is used, serialise it as an `observe` source unit immediately before the Teach it exists to set up. It is not the Do paired with the preceding Teach and it must be followed immediately by the accurate Teach that secures its meaning.» | a bounded observation in a content lesson | must (code) | `observe`; validator: "Content-based observe must be followed immediately by Teach" | `references/teaching-sequence-content-based.md` · L9. Copy: J35 | rule | CONTENT |
| TD-J35 | «An `observe` unit may occur only immediately before the Teach it sets up. It is not a substitute for that Teach and is not the child-processing Do that follows the Teach.» | as J34 | must (code) | `observe` | `references/teaching-sequence-content-based.md` › Output Format Block · L80 | duplicate of J34 | CONTENT |
| TD-J36 | «**When the lesson names an idea in `concepts`, the pairs are its instances.** Each Teach→Do pair meets the idea on different evidence, a new pair of sources or a new case, under the same question,» | a content lesson that names an idea | must | `concepts`, `conceptRef` | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L17 | shared (What a Lesson Is For, ideas) | STAYS |
| TD-J37 | «**Practise** — after the Teach→Do pairs that supply what it needs, provide a larger opportunity to use the lesson's body of knowledge.» | content lessons | must | `practise` | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L53 | rule | CONTENT |
| TD-J38 | «Read the Practise's steps back as moves. When a step is a move no Do has had children make (compare two meanings, explain a difference, justify a choice), the last Do before the Practise is a supported attempt at that move on the lesson's own material, worked and improved together:» | the Do before a Practise | must | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L55 | shared (What a Lesson Is For owns "moves"); the rhythm's Do-before-Practise rule | STAYS |
| TD-J39 | «"activity": "the main application task after all Teach/Do pairs",» | the Practise template | mechanics | `content.activity` | `references/teaching-sequence-content-based.md` › Output Format Block · L153 | stale: a Practise may now come after any complete pair (J31) | correct (decision 7) |
| TD-J44 | «Teaching that the work earns (feedback on what they produced, the next distinction, a short transfer check) continues after it as ordinary Teach→Do pairs, and an Apply slide follows if earned.» | content lessons, after an early Practise | may | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L15. Copy: L13 | rule (on J31's line) | CONTENT |
| TD-J49 | «A bounded observation, pattern or short exploration may sit inside this route when seeing it first gives children something useful to explain. Follow it with the accurate teaching that secures the meaning. This does not replace Discovery as a full route when the investigation itself is the best main lesson shape.» | content lessons | may; must (the Teach follows) | `observe` | `references/teaching-sequence-content-based.md` · L7. Copies: J34, J35 | rule (the permission J34 serialises) | CONTENT |
| TD-J45 | «3. Explicit teacher explanation will follow and secure why the result or pattern occurred.» | Discovery's third condition | must | | `references/teaching-sequence-discovery.md` › Route conditions · L13 | rule | DISC |
| TD-J46 | «Give the accurate explicit explanation of why the result or pattern occurred. This is the load-bearing teaching beat.» | Discovery | must | `teach-why` | `references/teaching-sequence-discovery.md` › Teach why · L35 | rule | DISC |
| TD-J47 | «Give children an opportunity to explain, apply, compare or test the secured idea. Choose the form and amount from the objective. The practice must not depend on discovering another untaught idea.» | Discovery | must | `use-learning` | `references/teaching-sequence-discovery.md` › Use the learning · L41 | rule | DISC |
| TD-J48 | «Discovery sequence must be exactly:» | Discovery | must (code) | kinds `question`, `explore`, `make-sense`, `teach-why`, `use-learning`, `finish`, once each | `scripts/validate-lesson-design.py` · L2809 | code: one Teach why and one Use the learning only; decision 4 | CODE |
| TD-J50 | «State the limits, available material and any safety conditions children need. Do not leave the exploration as “see what you can find out” with no dependable focus.» | Discovery's Explore | must | `explore` | `references/teaching-sequence-discovery.md` › Explore · L27 | rule | DISC |
| TD-J51 | «Bring together or inspect the observations, outcomes or pattern before the explicit `Teach why` beat.» | Discovery's Make sense | must | `make-sense` | `references/teaching-sequence-discovery.md` › Make the result visible · L31 | rule | DISC |
| TD-J55 | «Design the number of Stimulus → Talk beats from the richness of the question and the available lesson time. Two to four pairs is a useful normal shape, not a quota. One discussion may carry the lesson only when it is genuinely rich and substantial; a brief partner chat is not a complete Dialogic lesson.» | Dialogic | default | `stimulus`, `talk` | `references/teaching-sequence-dialogic.md` › Teaching Sequence Specification · L11. Copy: J61 | rule | DIAL |
| TD-J56 | «A Stimulus can also be an *activity* — a ranking, a sort, a four-corners vote — when the activity itself surfaces children's positions. In that case the Stimulus and the Talk merge into a single working beat:» | Dialogic | may | `stimulus-talk` | `references/teaching-sequence-dialogic.md` › Teaching Sequence Specification · L19 | rule; its four-corners vote pulls against your calm-classroom ruling (later decision A) | DIAL |
| TD-J57 | «**Talk** — children discuss the Stimulus. The active beat.» | Dialogic | must | `talk`; validator: "Dialogic Stimulus must be followed immediately by Talk", and the Talk's `discussionQuestion` must equal the Stimulus's `question` exactly | `references/teaching-sequence-dialogic.md` › Teaching Sequence Specification · L21 | rule (its `thinking` sentence after this is shared with the spine) | DIAL |
| TD-J58 | «**Synthesise** — after all the Stimulus → Talk pairs are done, the teacher pulls together what emerged from the discussion.» | Dialogic | must (code: once, last) | `synthesise` | `references/teaching-sequence-dialogic.md` › Teaching Sequence Specification · L31. Copy: J62 | rule | DIAL |
| TD-J59 | «Do not use this for substantial factual teaching; CURRENT's Content-based routing rule still applies.» | the grounding input | must not | `grounding-input` | `references/teaching-sequence-dialogic.md` › Output Format Block · L69 | rule; "CURRENT's" is a leftover name (also in the content and task routes); a grounding input followed by a Stimulus is two teacher-only beats by design (decision 2) | DIAL; the word "CURRENT" corrected (decision 7) |
| TD-J60 | «Teach necessary factual/legal/anatomical/statutory/safeguarding directly before judgement depending on it. If substantial new knowledge must be taught, use Content-based.» | Dialogic | must | | `references/lesson-designer-components.md` › Dialogic route · L15 | rule (knowledge before judgement); its first sentence is vocabulary's VOC-E33 | STAYS (components) |
| TD-J61 | «**Structure.** Use one or more worthwhile Stimulus → Talk beats. One discussion may carry the lesson only when it is genuinely rich and substantial.» «Add an honest synthesis when it helps children compare what actually emerged, then obtain proper individual evidence in the lightest form that still shows the learning.» | Dialogic (evidence) | | | `references/evidence-synthesis.md` › 9. Lesson Structures › Dialogic · L237 | near-duplicate of J55, plus a condition: the synthesis is added «when it helps», where the route, the designer (J65) and the code make it compulsory; decision 12 | EVID |
| TD-J62 | «**Red flags.** Pure transmission of values dressed up as a discussion ("here are the seven kinds of influence — copy them down").» «Discussion with no Synthesise (the consolidation is the load-bearing step).» | Dialogic red flag | must not | | `references/evidence-synthesis.md` › 9. Lesson Structures › Dialogic · L243 | rule (evidence) | EVID |
| TD-J63 | «Genuinely dialogic normally earns one when best way to show learning, but not absolute requirement every dialogic ends with in-books response, and does not make writing after each earlier discussion compulsory.» | Dialogic: each Talk need not end in writing | may | `ending` | `agents/lesson-designer.md` › Apply Slide · L331 | shared (the ending and Reflect); the Dialogic form of C10's "each Do does not need a permanent written artefact" | STAYS |
| TD-J64 | «If an important missing perspective is needed, introduce it honestly as a new perspective or question, let children discuss it, and only then include it in the synthesis.» | Dialogic | must | | `references/teaching-sequence-dialogic.md` › Teaching Sequence Specification · L33 | rule (a new view gets its own Talk first) | DIAL |
| TD-J65 | «After the final discussion, include one honest Synthesise beat.» | Dialogic | must (code: once, last) | `synthesise` | `references/lesson-designer-components.md` › Dialogic route · L9 | duplicate of J58 (the designer's copy); decision 12 | STAYS (components) |
| TD-J70 | «The task is the spine of the lesson; teaching is a short input that serves it. Design the beats so the doing gets the bulk of the time — the most common way this structure fails is the teaching swelling until the task it was meant to enable has no room left.» | task-centred lessons | must | | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L11 | rule | TASK |
| TD-J71 | «If children already have what they need, teach nothing and move to planning. Keep it short on purpose: in a task-centred lesson the doing is the lesson, so a long teaching input both eats the time the task needs and quietly turns the child's work into copying the teacher's rather than thinking for themselves. Short is one idea and a few minutes, not the idea cut to a heading.» «Judge whether this teaching prepares the `pupilInstruction` that follows.» | task-centred enabling input | must | `teach-needed`, `pupilInstruction` | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L17 | rule | TASK |
| TD-J72 | «**One idea per enabling unit, used before the next arrives.** The Teach → Do rhythm in `preferences.md` holds here exactly as it does in a content lesson; a task-centred lesson is not exempt because its teaching is short. When the task needs two distinct inputs (what a fair test is and how to record a result; the right to pass and what happens to a worry), each is its own `teach-needed` unit, and children do something with the first before the second is taught: its `pupilInstruction` is every child using that idea: a decision on a fictional case each child commits to, a sort, a line rewritten, a reply chosen between two and defended.» «Only the last enabling idea may leave `pupilInstruction` null, because the planning or the task itself is what children do with it.» | task-centred lessons | must (code) | `teach-needed`, `pupilInstruction`; validator: "children use this enabling idea before the next teach-needed unit arrives"; test_rhythm_holds_in_every_route | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L19. Copies: J03, J73, L16 | rule | TASK |
| TD-J73 | «Use one `teach-needed` unit per distinct enabling idea, in the order taught. Every unit but the last carries the `pupilInstruction` children use that idea with; the validator refuses a `teach-needed` followed by another whose `pupilInstruction` is null.» | task-centred lessons | must (code) | as J72 | `references/teaching-sequence-task-centred.md` › Output Format Block · L78 | duplicate of J72; its last clause reads as if the second unit's field were checked, where the code checks the first | TASK |
| TD-J74 | «When even that would give too much away, a single quick neutral warm-up is fine — but only one, and named as a warm-up» | task-centred enabling input | may (one only) | | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L21 | rule | TASK |
| TD-J75 | «**Do the task** — sustained independent work. This is the bulk of the lesson and the artefact, and it must *read* as the centrepiece, not as one more short practice beat.» | task-centred lessons | must | `do-task` | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L29. Copy: J76 | rule | TASK |
| TD-J76 | «**A task with several stages stays one `do-task`, and `steps` is where the stages live.**» «the slide designer gives a stage that needs the board its own slide» «the single `do-task` is what keeps the doing reading as the centrepiece instead of fragmenting into a run of short practice beats.» «Reach for a separate `plan-checkpoint` unit only when planning produces a distinct artefact before the doing begins.» | task-centred lessons | must | `do-task`, `launch.steps` | `references/teaching-sequence-task-centred.md` › Output Format Block · L132 | near-duplicate of J75, plus the only statement that a staged task stays one `do-task` with its stages in `steps`; below the line the reviewer reads (decision 6) | TASK |
| TD-J77 | «Weight: skill-based builds skill via repeated performance; content-based builds knowledge in chunks; both weight on acquiring. Task-centred weight on applying - one sustained task.» | choosing the route | | | `references/lesson-designer-components.md` › Task-Centred route · L21 | rule (route choice) | STAYS (components) |
| TD-J78 | «A short enabling input may prepare children without turning the lesson into a sequence of disconnected exercises.» | task-centred (evidence) | | | `references/evidence-synthesis.md` › 9. Lesson Structures › Task-Centred · L251 | near-duplicate: it guards against fragmentation (J76's point), where J70 guards against the input swelling | EVID |

## K. The subject files

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-K01 | «Teach → process each coherent chunk, with activity that demonstrates the intended locational, descriptive or explanatory learning» «Teach the source, then have children find its limits on a fresh one» | geography, by move | default | | `references/subject-geography.md` › Which move routes to which structure · L39 | rule (route shape by move) | SUBJ |
| TD-K02 | «A lesson often carries two moves. Locate-then-describe is the commonest pair, and each is its own chunk with its own Teach → Do. Questioning the evidence rarely leads a whole primary lesson, so it usually sits as a beat inside one of the others.» | geography | must | | `references/subject-geography.md` › Which move routes to which structure · L46 | rule (one move per chunk, in geography) | SUBJ |
| TD-K03 | «A geography Do beat has a map, a photograph, a graph or a place in it, and the child gets something out of it. These are starting points to choose from by the beat's `thinking` line, not a list to work through; each names what every child does with the cards, map or page, because a question on its own is answered by the hands that go up; and each works on a place or map the Teach did not already use:» | geography Do beats | must | heading `## What a Do beat looks like in geography` (named in E03) | `references/subject-geography.md` › What a Do beat looks like in geography · L74. Copies: K04 to K07 | rule; each subject copy carries its own condition | SUBJ |
| TD-K04 | «**What a Do beat looks like in history.** The history moves above, done with cards and a pencil in two minutes. These are starting points to choose from by the beat's `thinking` line, not a list to work through; each names what every child does with the cards, map or page, because a question on its own is answered by the hands that go up; and the cards are cases the Teach did not show:» | history Do beats | must | a bold line, not a heading (the other four are headings) | `references/subject-history.md` › Choose the response that reveals the history · L137 | near-duplicate of K03 with history's condition | SUBJ |
| TD-K05 | «A PSHE Do beat has children apply the taught reason or boundary to a situation, always someone else's. These are starting points to choose from by the beat's `thinking` line, not a list to work through; each names what every child does with the cards, map or page, because a question on its own is answered by the hands that go up; and each uses a scenario the Teach did not already settle:» | PSHE Do beats | must | heading `## What a Do beat looks like in PSHE` | `references/subject-pshe.md` › What a Do beat looks like in PSHE · L34 | near-duplicate of K03 with PSHE's condition (always someone else's situation) | SUBJ |
| TD-K06 | «An RE Do beat makes children connect what people do with what they believe, and see who is speaking. These are starting points to choose from by the beat's `thinking` line, not a list to work through; each names what every child does with the cards, map or page, because a question on its own is answered by the hands that go up; and each uses a practice, person or text the Teach did not already explain:» | RE Do beats | must | heading `## What a Do beat looks like in RE` | `references/subject-re.md` › What a Do beat looks like in RE · L29 | near-duplicate of K03 with RE's condition | SUBJ |
| TD-K07 | «A science Do beat makes children use the scientific relationship, not describe what they saw. These are starting points to choose from by the beat's `thinking` line, not a list to work through; each names what every child does with the cards, map or page, because a question on its own is answered by the hands that go up; and each changes the case from the one the Teach showed:» | science Do beats | must | heading `## What a Do beat looks like in science` | `references/subject-science.md` › What a Do beat looks like in science · L59 | near-duplicate of K03 with science's condition. Maths has no such section (its Do beats are the cycles' Your Turns) | SUBJ |
| TD-K08 | «A lesson whose Teach slides are each a rule about method ("put a source in time before you compare it", "use the detail that is actually there", "compare the same part of life") is a lesson about being a historian, and children cannot see why anybody is telling them these things, because nothing is in front of them yet for the rules to be about. The knowledge is what makes the move mean something. Teach the move first and the class sits through methodology.» | history | must | | `references/subject-history.md` › What the lesson feels like to the child · L17 | rule (what a chunk is in history; see J06) | SUBJ |
| TD-K09 | «The shape that produces this, in the order a child meets it, is the user's own sketch of a Victorian schooling lesson (4 September 2026), kept here as the calibration:» «3. **Every child uses it.** Find one continuity and one change between this classroom and ours, with a partner or on whiteboards.» | history | | | `references/subject-history.md` › What the lesson feels like to the child · L21 | your example (the Victorian sketch: Teach, then every child uses it) | STAYS exactly as it is |
| TD-K10 | «What generalises is the order: material, noticing, the idea named after it is met, use, more knowledge, the historian's caution arriving as a question the knowledge lets children answer, then the task and the big question.» | history, and beyond | | vocabulary pin VOC-E50 on part of it | `references/subject-history.md` › What the lesson feels like to the child · L32 | your example (what the sketch teaches in general) | STAYS exactly as it is |
| TD-K11 | «Teach then process each coherent chunk, with activity that explains rather than only recalls» «Model the inference on one source, then children do it on a fresh one» «Teach the criteria somebody used, then apply them to a second case» | history, by move | default | | `references/subject-history.md` › Which move routes to which structure · L76 | rule (route shape by move) | SUBJ |
| TD-K12 | «Almost every history LO carries knowledge before it carries thinking, so the commonest shape is telling then doing rather than either alone. What history does not tolerate is doing without telling.» | history | must | | `references/subject-history.md` › Which move routes to which structure · L83 | rule | SUBJ |
| TD-K13 | «**The input takes a bigger share of the lesson here than it does in maths, and that is correct rather than a pacing failure.**» «The failure this guards against is a history lesson cut to a maths shape, where a five-minute input leaves children twenty minutes of activity built on knowledge they were never given.» | history | default | | `references/subject-history.md` › Which move routes to which structure · L85. Copy: H06 | rule (a subject limit on "short teaching") | SUBJ |
| TD-K14 | «**So this is a check on the design rather than advice.** Every beat that asks children to infer, judge, evaluate or explain names where the knowledge it runs on was taught: earlier in this lesson, or in a named earlier lesson of the enquiry. A beat that cannot point at either is a guessing beat and needs the teaching putting in front of it.» | history judgement beats | check | | `references/subject-history.md` › Knowledge before judgement, inside the lesson · L97 | rule; shared with assumed knowledge | SUBJ |
| TD-K15 | «Give reasoning or problem solving its own enabling teaching when it introduces a genuinely new decision, representation, reading demand or way of thinking. Do not create a second whole-class teaching act merely because a task has been labelled "problem solving".» | maths | must | | `references/subject-maths.md` › The shape of a maths lesson · L17 | rule (a new decision earns its own teaching) | SUBJ |
| TD-K16 | «**Each of the three is a beat, and this design decides where it goes.** Fluency lives in the cycles' Your Turns, one per modelled move. Reasoning and problem solving are `practise` units, placed where the lesson has enough behind them to carry them:» | maths | must | `practise` | `references/subject-maths.md` › Fluency, reasoning and problem solving · L55 | rule | SUBJ |
| TD-K17 | «It is not a My Turn, because nothing is being modelled: the class is being asked to look back at work they have already done and say what was the same every time. Writing it as a My Turn puts it under the cycle rule, so it then owes an Our Turn and a Your Turn of its own,» | the derived shortcut beat | must | `prepare`, `pattern-investigation` | `references/subject-maths.md` › The shape of a maths lesson · L31 | rule (the story is in the log, L2023) | SUBJ |
| TD-K18 | «**A maths skill lesson opens with the model.** The Skill-based route allows a bounded first attempt at the target before any modelling; maths does not use it.» «My Turn → Our Turn → Your Turn stays the maths rhythm, with the Our Turn omitted only under the route's own omission test.» | maths skill lessons | must | | `references/subject-maths.md` › The positions this file takes · L182 | rule (your position) | SUBJ |
| TD-K19 | «Teach necessary factual, legal, anatomical or safeguarding knowledge directly before asking children to make a judgement that depends on it.» | PSHE | must | | `references/subject-pshe.md` › Teach facts before dependent judgement · L16 | rule (knowledge before judgement) | SUBJ |
| TD-K20 | «Teach enough accurate knowledge about the religion or worldview before asking children to make a reflection, comparison or judgement that depends on it.» «Use **Dialogic** only when the question is genuinely open after children have the knowledge needed to reason.» | RE | must | | `references/subject-re.md` › Teach knowledge before dependent judgement · L7 | rule | SUBJ |
| TD-K21 | «The practical may come before, during or after explanation. Investigate first when seeing the result creates something useful to explain. Explain enough first when children would otherwise not know what to notice or would form unsupported conclusions. Choose the order for the learning rather than from a universal practical-first or explanation-first rule.» | science practicals | default | | `references/subject-science.md` › Place the practical for the learning · L39 | rule | SUBJ |
| TD-K22 | «Avoid overloading children by making both the scientific idea and the enquiry method completely new at the same time. This is a safeguard, not an absolute ban:» | science practicals | default | | `references/subject-science.md` › Place the practical for the learning · L41 | rule (one new thing at a time, in science) | SUBJ |
| TD-K23 | «Several activities are coherent when they attack the same sticking point from different angles; a list of science activities is not a sequence by itself.» | science | check | | `references/subject-science.md` › Build the lesson around the scientific sticking point · L27 | rule (a subject copy of G01) | SUBJ |
| TD-K24 | «The comparison is the spine, not a closing question» | a comparative geography objective | must | | `references/subject-geography.md` › Which move routes to which structure · L40. Copies: K25, K26 | rule (a comparison runs side by side) | SUBJ |
| TD-K25 | «**Comparison bolted on at the end.** When the LO is comparative, the two places run side by side through the lesson rather than one being taught and the other produced at the finish for a closing question.» | as K24 | must | | `references/subject-geography.md` › Making the thinking geographical · L68 | duplicate of K24 | SUBJ |
| TD-K26 | «Both periods run side by side, not one taught and the other produced at the end» | a comparative history objective | must | | `references/subject-history.md` › Which move routes to which structure · L79 | near-duplicate of K24 for history | SUBJ |

## L. What the design reviewer checks

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-L01 | «A concrete opening, valid Teach–Do order, live-model space and an answerable task do not by themselves establish teacher fit.» | the User-fit judgement | check | | `agents/design-reviewer.md` › Material-defect boundary · L40 | rule | REV |
| TD-L02 | «Trace a representative final performance backwards to the new learning each part needs, then read the sequence forwards from the child’s starting point» «Repeated resources, callback phrases and activity labels do not establish that dependency; the actual explanation, example and child action must supply it. Parallel evidence gathering, rehearsal and necessary setup remain legitimate; do not demand a written product or strict chain between every slide.» | every review | check | | `agents/design-reviewer.md` › 2. Route, modelling and independence · L166 | near-duplicate of G04, plus: rehearsal and necessary setup may stand without a chain | REV |
| TD-L03 | «When the objective requires naming and describing several unfamiliar members, trace each member’s defining explanation and immediate pupil use; a shared heading or shared function does not itself justify batching their first teaching. Do not count a collective recall task as proof that this grouping was appropriate. Apply the familiarity/grouping boundary in `preferences.md`: return missing individual teaching or premature combined demands for redesign, while preserving comparisons that themselves make their parts understandable and combined practice of established learning.» | an objective naming a set | check | | `agents/design-reviewer.md` › 2. Route, modelling and independence · L166 | duplicate of B03 to B05, plus: a collective recall task does not prove the grouping | REV |
| TD-L04 | «- each major beat changes the state of the lesson and the next builds from it: read the beats in order and name what each changes and what later depends on it.» «a line naming something no later beat uses, a line describing the activity (`they sorted six materials`) instead of what children gained, and a substantial teaching beat left `null` are each a finding,» «A major beat that could move elsewhere with nothing lost gets the challenge, and the answer is either a legitimate contribution to a later shared comparison, a place beside the spine (vocabulary, a routine, a safeguarding note, setup), or a finding; do not answer it by demanding forced links.» «a beat that makes nothing new but gives useful practice, a needed check or parallel evidence is sound when the design says that is its job» «a chain of lines that reads as written-after-the-fact tidy-up while the beats themselves do not connect is the one worth returning» | every review | check | `unlocks`; vocabulary pin VOC-E42 | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L200 | near-duplicate of G01 to G03, plus: useful practice or a needed check is sound without a forward link when the design says so, and which failure matters most | REV |
| TD-L05 | «Where a later beat works on what children produced earlier, check the correctness handover:» «its absence is a purposeful design defect when the later task depends on it» | later work built on an earlier product | must (defect) | `answer`, `teacherInfo` | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L200 | duplicate of G06, with its strength | REV |
| TD-L06 | «A Teach→Do pair whose Do nothing later uses is orientation wearing a chunk's clothes (what the subject is, why we are here); keep only the orientation needed to enter the example, using a brief separate presentation moment if needed, and remove a manufactured Do» | orientation | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L200 | near-duplicate of I01, plus a detection test (a Teach→Do pair whose Do nothing later uses is orientation in disguise); decision 3 | REV |
| TD-L07 | «A beat carrying a second job that has no beat of its own, or a run of teacher-presented beats with no pupil action between them, is a purposeful design defect, not polish (`preferences.md` → The Teach → Do → Teach → Do Rhythm);» | every review, as written with no exception | must (defect) | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L200 | near-duplicate of H01, stronger (defect where H01 says "tell"); contradiction, decision 2 | REV |
| TD-L08 | «- each Do beat or `pupilInstruction` is every child using the idea just taught, not a question to the room: a question a child could answer without that idea, or that most of the class could sit out, is a check on the room, and it is a finding unless the form makes every child commit; and it is the idea *this* Teach taught rather than a neighbouring one: a beat where every child commits to real work still breaks the pair when the move it practises was never taught here and the move that was taught is used by nobody, which is a purposeful design defect rather than polish; and judge worthwhile use or reasoning across the whole lesson, including main practice, without requiring a harder task solely because it is the last Do» | every Do beat | check / must (defect for a broken pair) | `pupilInstruction` | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L202 | duplicate of C01, D01 and F12, with the reviewer's strengths | REV |
| TD-L09 | «- the activities work as a pupil experience across the lesson, under `preferences.md` → `Use variety deliberately, without a quota`: flag a monotonous run of generic explanations where the learning would benefit from another suitable activity, even if every response individually matches its Teach, and do not reward five formats that still amount to five whole-class explanations. Read the classroom side of the same run: where the substantial work starts, and what reaching it costs in listening, reading, handling, discussing, recording and checking. Preserve purposeful repeated practice and useful simple checks;» | every review | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L203 | duplicate of F01, plus: the classroom cost of reaching the main work | REV |
| TD-L10 | «Two more reads on the class view, each REVISE when it holds across the lesson rather than on one line.» «And a lesson whose Do beats all share one response channel (every `format` a spoken or written explanation) is "listen, then discuss" however well each beat matches its Teach (`teaching-sequence-content-based.md`, the Do beat paragraph).» | every review; holds across the lesson | must (REVISE on User-fit) | `format` | `agents/design-reviewer.md` › Material-defect boundary · L44 | near-duplicate of F03 (all one channel, where F03 triggers at three in a row) | REV |
| TD-L11 | «- a Do beat following an explanation uses the explanation rather than restating it.» | a Do after an explanation | check | the review view's `Each Do beside the teaching before it` | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L204 | shared (quick checks: the restatement test) | STAYS |
| TD-L12 | «For a hands-on Skill-based objective — one where children handle equipment or perform the target physically — also count the teacher-led beats before children first touch or perform the target. Each delay must remove a specific safety, knowledge or procedural barrier; a run of modelling and guided beats that merely defers a safe, self-checking activity is a purposeful design defect,» «And where two concepts run consecutive full cycles, check whether the second is a genuinely separate procedure or a recording of the first that the route says needs only one model and release.» | hands-on skill lessons | must (defect) | | `references/design-review-route-checks.md` › Skill-based · L9 | rule (the only count of teacher-led beats, and only for hands-on skills) | RC |
| TD-L13 | «For Content-based lessons, apply the teaching-route test to what each pupil response requires children to understand together. A shared topic heading and separate readable slides do not establish a manageable chunk.» «A Practise that sits before the last Teach is legal and often right; judge it by readiness, not position:» «do the pairs after it teach something the work earned (feedback on what was produced, the next distinction, a short transfer check) rather than carry on the lesson as if the main work had not happened? A Practise placed early on knowledge not yet taught, or an early Practise followed by beats kept only because they were already written, is a purposeful design defect.» «A Teach whose use is the Practise straight after it needs no separate Do, so do not ask for one; the check is still that a short Teach→Do pair came before the first Practise.» «Return avoidable branches or several distinct unprocessed ideas for redesign.» | content lessons | check / must (redesign) | | `references/design-review-route-checks.md` › Content-based · L13 | near-duplicate of B09, J31 and J33, plus: the only place where beats kept after an early Practise only because they were written are a defect; its enrichment sentence is I11 | RC |
| TD-L14 | «For Dialogic lessons, check that pupils receive knowledge before judgement, the question permits several defensible positions, harmful or false claims are corrected, and synthesis does not invent class views or force one predetermined answer.» | Dialogic | check | | `references/design-review-route-checks.md` › Dialogic · L17 | rule | RC |
| TD-L15 | «For Discovery lessons, check that exploration is safe, bounded and dependable, pupils have the needed prerequisites, the result becomes visible, and explicit explanation follows.» | Discovery | check | | `references/design-review-route-checks.md` › Discovery · L21 | rule | RC |
| TD-L16 | «enabling teaching is limited to what the task needs and arrives one idea at a time with children using each before the next is taught (an enabling unit carrying several distinct ideas before its pupil action is a purposeful design defect, not polish),» «and the finish completes the task's purpose and carries nothing else.» | task-centred lessons | must (defect) | | `references/design-review-route-checks.md` › Task-Centred · L25 | duplicate of J72 and H02 | RC |
| TD-L17 | «Read when two teacher-presented beats run with no pupil action» «three or more Teach beats - with three, say in your own words the» | the reviewer's routing card | code | routing card entry for `The Teach → Do → Teach → Do Rhythm` | `scripts/design-review-packet.py` · L110 | code (triggers the reviewer's read of PREF-RHY) | CODE |
| TD-L18 | «in its script, when a Do beat is a question to the room rather» | the reviewer's routing card | code | routing card entry for `Slide Philosophy` | `scripts/design-review-packet.py` · L124 | code; sends the reviewer to Slide Philosophy for a rule that lives only in PREF-RHY (C01); decision 6 | CODE (decision 6) |
| TD-L19 | «the file start to, but not including, `## Output Format Block`,» | the reviewer's reading of a route file | code | | `scripts/design-review-packet.py` · L695 | code (L580 records the same scope for the hash check); the reviewer never reads the skill route's rules below that line (J12, J13, J16 to J21) or the content route's Teach board rules; decision 6 | CODE |
| TD-L20 | «## Each Do beside the teaching before it» | the review view | code | | `scripts/design-review-packet.py` · L1455 | code; shared (quick checks) | CODE |
| TD-L21 | «- in a knowledge subject (history, geography, science content, RE), the Teach labels and headlines read in order are things about the topic, not rules about how to think; a lesson whose Teach beats are each a rule about sources or evidence has put the method in front of the knowledge and is a purposeful design defect,» | knowledge subjects | must (defect) | | `agents/design-reviewer.md` › 1. Learning contract · L153 | duplicate of B06 and K08, as a reviewer check across every knowledge subject | REV |
| TD-L22 | «For a method, work the hardest case children do alone, step by step, as a child in this class, before you read the designer's step trace in the walk-through's closing decisions, then compare the two: a step that neither an earlier lesson at this size nor today's teaching supplies is a missing short cycle and goes back for redesign,» | a method lesson | must (redesign) | | `agents/design-reviewer.md` › 2. Route, modelling and independence · L166 | near-duplicate of J17: the reviewer returns the missing short cycle without reading J17's words | REV |
| TD-L23 | «have already found the fault in order to be sent to the section that» | the reviewer's routing card | code (a comment) | | `scripts/design-review-packet.py` · L104 | code: the comment says a trigger must be visible before the judgement, yet the rhythm trigger (L17) keeps two that need the fault found first (a Do on a different idea, a second job) | CODE (decision 6) |
| TD-L24 | «ALWAYS_READ_REVIEW_SECTIONS = (» | every review | code | always read: Pride Lessons, What a Lesson Is For, the voice pre-flight check, the task contrasts | `scripts/design-review-packet.py` · L226 | code: the rhythm section is not on the list, so the reviewer opens it only when a trigger fires; decision 6 | CODE |
| TD-L25 | «with no your-turn after it; every cycle runs uninterrupted and» | the scaffold's route shape | code | validate_route_shape; test_both_copies_agree_on_every_shape holds it to the validator | `scripts/lesson-design-scaffold.py` · L486 | code: a second gate holding its own copy of every route shape, before the files are written | CODE |

## M. Recording fields shared with the lesson spine

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-M01 | «`unlocks` is one short line naming what children can now do, notice, hold or have produced that a later part of this lesson needs, written as the thing gained rather than the activity done:» | every beat | mechanics (code: at most 200 characters; one beat at least not null) | `unlocks` | `references/output-template.md` › Source-unit contract · L442 | shared (the spine) | STAYS |
| TD-M02 | «Use `null` when the beat genuinely sits beside the spine rather than on it:» | beats beside the spine | mechanics | `unlocks`; vocabulary pin VOC-E41 | `references/output-template.md` › Source-unit contract · L444 | shared (the spine) | STAYS |
| TD-M03 | «Use `null` only for a beat where the teacher acts and children watch or listen: a My Turn, a stimulus, the setting of a task.» | the `thinking` line; the code also allows null on `prepare` (a bounded attempt included, where children act) and `grounding-input` | must (code) | `thinking`; the kinds allowed a null `thinking` are the teacher-only kinds | `references/output-template.md` › Source-unit contract · L448. Copies: M04, M05 | shared (the spine); it is also the code's list of teacher-only beats, which the reviewer's "run of teacher-presented beats" reads | STAYS |
| TD-M04 | «`null` is allowed only where the teacher acts and children watch (a My Turn, a stimulus, the setting of a task); the validator refuses it anywhere else, and that includes a Teach.» | as M03, with the same gap against the code | must (code) | `thinking` | `agents/lesson-designer.md` › The Teach → Do Rhythm · L253 | shared (the spine) | LD-RHY |
| TD-M05 | «**A Teach has a thought in it, and `thinking` names it.**» | content Teach beats | must (code) | `thinking` | `references/teaching-sequence-content-based.md` › Output Format Block · L124 | shared (the spine) | STAYS |
| TD-M06 | «**Write each beat's `minutes` as the time it really takes with a class, and read the sum.**» | every beat | must (code: refused when the starter, every teaching beat and the ending beat all carry `minutes` and they add up to more than 50; each beat 1 to 25); the text says the beats may take 40 | `minutes` | `agents/lesson-designer.md` › The Teach → Do Rhythm · L249 | shared (time; Classroom Norms); its story (18 September) is in the validator's comment, not in the log | LD-RHY |
| TD-M07 | «A card sort at tables with the cards handed out is five or six minutes, not two; a written record children complete from a source is the better part of ten.» | honest minutes | default | `minutes` | `agents/lesson-designer.md` › The Teach → Do Rhythm · L251 | shared (time); sits beside C07's "one to three minutes" for a Do | LD-RHY |
| TD-M08 | «the per-beat timings in this file (a starter five to eight minutes, a Do beat one to three, a Talk three to five) have to sum to the slot» | every lesson | default | | `references/preferences.md` › Classroom Norms · L126 | shared (Classroom Norms) | STAYS |
| TD-M09 | «at least one of them a beat where every child acts, and the validator refuses fewer.» | a named idea's instances | must (code) | `concepts`, `conceptRef`; validator: "at least one instance must be a beat where every child uses the idea" | `references/output-template.md` › Concepts · L346 | shared (What a Lesson Is For, ideas) | STAYS |
| TD-M10 | «at least one teachingSequence unit must record what it unlocks;» | every lesson | must (code) | `unlocks` | `scripts/validate-lesson-design.py` · L3658 | code (shared, the spine) | CODE |
| TD-M11 | «must name the thought every child has to have during this beat; null is only for a beat where the teacher acts and children watch» | every beat | must (code) | `thinking` | `scripts/validate-lesson-design.py` · L2148 | code (shared, the spine) | CODE |

## N. The slide side

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-N01 | «In content-based lessons, make Teach then Do chunking visible. A Do slide carries only the references its source unit names.» | the slide designer, content lessons | must | | `references/slide-composition-playbook.md` › Lesson rhythm · L392 | rule (slides) | SD |
| TD-N02 | «In skill-based lessons, My Turn, Our Turn and Your Turn keep one visual language around the same method.» | skill lessons | must | | `references/slide-composition-playbook.md` › Lesson rhythm · L394 | rule (slides) | SD |
| TD-N03 | «In discovery lessons, the phenomenon or exploration dominates before explanation. Do not pre-explain the finding on the noticing slide.» | Discovery | must | | `references/slide-composition-playbook.md` › Lesson rhythm · L396 | rule (slides) | SD |
| TD-N04 | «In task-centred lessons, the substantial task remains the centre of gravity. Enabling input and checkpoints support it without becoming the visual main event.» | task-centred lessons | must | | `references/slide-composition-playbook.md` › Lesson rhythm · L400 | rule (slides) | SD |
| TD-N05 | «so children watch two moves before practising either and the first one» | two My Turn slides in a row from different units | must (code: fails the slide check) | `MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS` | `builder/scripts/check-slide-design.js` · L401 | code (the slide side of J21) | CODE |
| TD-N06 | «In dialogic lessons, keep stimulus and prompt available together. A discussion slide shows the actual claim, scenario, source, choice or referent rather than teacher prose. The Reflect is purposeful individual synthesis and does not read as an answer to a discussion.» | Dialogic slides | must | | `references/slide-composition-playbook.md` › Lesson rhythm · L398 | rule (slides) | SD |
| TD-N07 | «A My Turn is the one beat where a split has to prove what it is: two modelling slides in a row means the class watches two MOVES before practising either, so the build refuses a second consecutive My Turn slide from a different source unit (`MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`). Two moves is the fault, and the source unit is the evidence. Examples of one move live in one My Turn unit, so two My Turn slides carrying the same unit are one modelling moment the layout had to divide, and the class still practises that one move next.» | splitting a My Turn | must (code) | `MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`; tests pin two phrases | `references/slide-composition-playbook.md` › 6. Space-pressure order · L194 | near-duplicate of J21 for the slide designer, plus: two slides of one unit are one move | SD |
| TD-N08 | «**A slide where children now do something should not look like a slide where the teacher was explaining.**» «on a Teach the thing being taught is the largest object and the task line is small or absent; on a Do the pupil's question or task leads and the material is the field it acts on» | every Teach and Do slide | must | a test pins it | `references/slide-composition-playbook.md` › 4. State the task once and set the material apart from it · L82 | rule (the slide side of Teach then Do) | SD |
| TD-N09 | «- what each unit changes since the one before it, and which reference it carries over unchanged, because the change is what its slide must let lead and the carried reference is what recedes.» | reading the lesson as a sequence | must | a test pins it | `agents/slide-designer.md` › 1. Read the lesson as a sequence · L135 | rule (the slide side of G01) | SD |
| TD-N10 | «7. What changed since the last slide, and is that the first thing the eye lands on?» | the slide designer's final read-back | check | a test pins it | `references/slide-composition-playbook.md` › 15. Final read-back · L455 | rule (the slide side of G01) | SD |

## Z. Rows another topic owns (listed so nothing is lost)

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| TD-Z01 | «**A quick check is a fresh case, not the last slide again.**» | a quick check after a Teach | must | pointer name used by four files | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L204 | shared (quick checks); sits inside this section | STAYS (quick checks decide) |
| TD-Z02 | «**A quick match, sort or label is a real Do beat when the things on the cards are new.**» «The groups of a sort are the other half, and a child has to understand them before any card can be placed.» | a quick match or sort | must | pointer name `A quick match, sort or label is a real Do beat` | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L208 | shared (quick checks and sort design); sits inside this section | STAYS (quick checks decide) |
| TD-Z03 | «In a skill lesson nothing comes between a My Turn and its Your Turn, so a method's words, like any teaching the cycle needs, come before the My Turn and the teacher models with them.» | skill lessons | must | vocabulary pin DEC-07 | `references/preferences.md` › Vocabulary · L355 | shared (vocabulary); a copy of J16 | STAYS (pinned) |
| TD-Z04 | «When one word needs teaching rather than introducing, that teaching is a Teach beat with its own slide in the sequence, in addition to - never instead of - the word's card,» | a word that needs real teaching | must | vocabulary pins | `references/preferences.md` › Vocabulary · L365 | shared (vocabulary) | STAYS (pinned) |
| TD-Z05 | «A quick check straight after teaching is a legitimate beat, and not every Do must stretch, when children use what was just taught on a case the Teach did not show:» | a quick check | may | | `agents/lesson-designer.md` › Misconceptions · L313 | shared (quick checks) | STAYS |
| TD-Z06 | «A quick check straight after a Teach may only establish that the class caught a new distinction, and it does that on a case the Teach did not show;» | a quick check | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L191 | shared (quick checks) | STAYS |
| TD-Z07 | «It is fine there, named as a check, and it is not the lesson's evidence.» | a good/bad sort as orientation | may | | `references/task-contrasts.md` › History · L17 | shared (quick checks; your decision B there says remove it) | STAYS (quick checks) |
| TD-Z08 | «will teaching every new chunk properly — each its own Teach → Do — *and* the substantial production both fit the time,» | two lessons or one | check | | `references/preferences.md` › How Much Fits in One Lesson · L266. Copies: Z09, Z10 | shared (How Much Fits) | STAYS |
| TD-Z09 | «The tell of a lesson straining to be two: one of the new chunks quietly loses its own Teach → Do and survives only as a line in a summary» | two lessons or one | check | | `references/preferences.md` › How Much Fits in One Lesson · L272 | shared (How Much Fits) | STAYS |
| TD-Z10 | «**One or two lessons?** LOs naming knowledge + substantial product may be two. Budget honestly Teach→Do per chunk + production vs time.» | two lessons or one | check | | `agents/lesson-designer.md` › Before You Design Anything · L116 | shared (How Much Fits) | STAYS |
| TD-Z11 | «Ask what one move this lesson makes children better at, keep the ideas that move needs, and let the rest belong to another lesson in the unit,» | too many new ideas | must | | `references/preferences.md` › How Much Fits in One Lesson · L274 | shared (How Much Fits); the lesson-scale form of B01 | STAYS |
| TD-Z12 | «An answer that needs the idea applied to a case the teaching did not already cover shows the idea has landed, and that is what each Do beat is for. The rhythm below is the shape this takes;» | every Do beat | | | `references/preferences.md` › What a Lesson Is For · L150 | shared (What a Lesson Is For) | STAYS |
| TD-Z13 | «**One coherent teaching move per slide.** A slide makes one coherent move — it teaches one thing, asks one question, or reveals one answer.» | every slide | must | | `references/preferences.md` › Slide Philosophy › Lesson Designer content boundaries · L555 | shared (slides); the slide-scale form of B01 | STAYS |
| TD-Z14 | «When independent work follows, the roughly 30-minute taught section means the teacher-guided lesson sequence, including modelling, questions, guided attempts and short child-processing activities, not continuous teacher talk.» | the taught section | default | | `references/preferences.md` › Classroom Norms · L128 | shared (Classroom Norms, time); the time form of B01's "long teacher talk" | STAYS |
| TD-Z15 | «The lesson should expose it, replace it with the target idea or method, then require children to use that learning.» | the dominant sticking point | must | | `agents/lesson-designer.md` › Before You Design Anything · L119 | shared (misconceptions); the rhythm applied to a wrong rule | STAYS |
| TD-Z16 | «so the second Teach→Do pair is a new pair of sources under the same question, and the Practise is that question over evidence children have not seen.» | a lesson whose learning is an idea | must | `concepts` | `references/preferences.md` › What a Lesson Is For · L160. Copy: J36 | shared (What a Lesson Is For, ideas) | STAYS |
| TD-Z17 | «- two substantial new demands are not stacked into one lesson without enough teaching, practice and checking for both;» | every review | check | | `agents/design-reviewer.md` › 1. Learning contract · L157 | shared (How Much Fits) | STAYS |
| TD-Z18 | «**Choose whether a placement needs an explanation.** Add a short justification when the reason behind a placement is part of the intended learning or when it will distinguish understanding from guessing. Accurate classification may itself be the intended check; do not turn every quick sort into a written explanation.» | a sort or placement Do | default | | `references/do-beats.md` · L15 | shared (quick checks); agrees with Z02 and with F01's variety | STAYS |
| TD-Z19 | «A substantial task is launched before it is instructed: what the lesson has established, a good instance beside a weak one, the steps, on the board (`preferences.md` → Slide Philosophy, `Giving a task its instructions is not launching it`).» | a substantial task | must | `launch` | `agents/lesson-designer.md` › The Teach → Do Rhythm · L245 | shared (launching a task); the designer's only copy of the launch rule, inside its rhythm section, so decision 1 must keep it | LD-RHY (stays) |
| TD-Z20 | «State what children do in the starter without prescribing a routine recording surface or participation method.» | the starter | default | | `references/preferences.md` › Starters · L299 | shared (Starters); a copy of C24 | STAYS |

---

## Out-of-date text and maintainer text (decision 7)

| Row | What it says | Why it is out of date |
|---|---|---|
| TD-A13 | «it is short» | The rhythm section is about 27 KB, 4,700 words and 67 lines, the longest thing in the designer's startup reading after Pride Lessons. |
| TD-J02 | «it was previously possible to satisfy the route while breaking this sentence» | History of a fix, written for a maintainer. |
| TD-J39 | «the main application task after all Teach/Do pairs» | A Practise may now sit after any complete pair once the class is ready (TD-J31), and the code allows it. |
| TD-B11, TD-B12 | the content structure ending on «larger practice» | The same older order, practice last, in the designer's structure summary and in the evidence file. |
| TD-J59 | «CURRENT's Content-based routing rule» | "CURRENT" is a leftover name; it also appears in the content route (L67, «CURRENT allows a bounded observation») and the task-centred route (L132, «When CURRENT's planning/checkpoint»). |
| TD-G11 | «was retired (2 September 2026)» | History of an earlier version of the file. The build log already records it (L2234), so it can go without copying. |
| TD-B16 | «see "Picking the splitting axis" earlier» | No such section exists in the skill route; the rule lives only in the designer's Structure Decision (TD-B14). |
| TD-J40 | «each genuinely distinct My Turn modelled move is its own `my-turn` source unit inside the same concept» | Read alone it sends the designer to two My Turns in a row, which the code and TD-J21 refuse; it needs "each opening its own cycle". |

Two further wordings are narrower or looser than the code: TD-J21 says the
validator refuses two My Turn units in a row «for the same concept», where it
refuses any two in a row; TD-J73's last clause reads as though the second
unit's `pupilInstruction` were checked, where the code checks the first.

## Stories and dated rulings

| Row | Story | In the build log? |
|---|---|---|
| TD-B02 | A block headed `Ask what this source helps us find out` teaching primary and secondary sources (undated example) | The lesson is (L3089) |
| TD-C02 | `What could the others say to Chloe?` after a slide teaching passing (undated example) | Not found; it can stay as a plain undated example |
| TD-C11 | Four decks in one week, every Teach with empty key questions | Yes (L2119) |
| TD-C13 | Thumbs is "a bit better" than Stand If | Yes, your words (L1201) |
| TD-D02, TD-D03 | Primary and secondary sources taught, one boy's portrait judged | Yes (L3076) |
| TD-E04 | `complete the because` picked after a slide that already stated the because (Year 4 RE) | Yes (L2336) |
| TD-F04 | Tudor why lesson read only §10; your words "listen to teacher, class discussion over and over again" (14 September) | Yes (L1233); your words stay without the date |
| TD-F15 | The Tudor lesson you taught on 15 September, the calibration for sorts | Yes (L1133 to L1140); your calibration, stays |
| TD-G11 | An earlier file asked the journey arrows to carry the spine, retired 2 September | Yes (L2234) |
| TD-G15 | Science deck: say the three layers, then name them on a diagram | Yes (L2105) |
| TD-H03 | The `3,448` Our Turn that held two tasks | Yes (L2031) |
| TD-J13, TD-J14 | Rounding lesson: 43 and 45 modelled, practised once at the end | The story, yes (L2011 to L2021). Your quoted words «The your turns are good because they are a quick check of can we do this before moving on to the next concept, even if its similar.» are not in the log; they stay in the file |
| TD-J29 | Your bridging-cycle words ("even if its similar ... maybe your turn just has less questions") | Partly: the log holds the second remark (L2021); the file joins words from two remarks |
| TD-J15 | Your ruling "i dont want to limit it to starter, answers, key vocab, mtotyt cycles" (12 September) | Yes (L1997); your words stay |
| TD-J17 | Year 4 class could not find the tens either side of 3,998 (17 September), and the repair taught next day (`528`, `5,996`) | Partly: the story is in the 4.2.221 entry (L1015 to L1021), not the numbers or the repair. **Copy the repair first** |
| TD-J18 | `43 children came to the fair` Teach read as wordy (17 September; in the paragraph, not quoted in the row) | The change is logged (L1021), the example is not. **Copy it first** |
| TD-J21 | 10 and 100 more: two My Turns, the plain case never guided | Yes, in the 4.2.84 teacher review (L3167 to L3170), told a little differently from the file; not L1967, which is the worksheet half of the same lesson |
| TD-J32 | Year 4 history class (15 September) could have written after the second chunk | Partly: L1135 holds your half (you wanted the class at tables for the written cases), not the route's reason. **Copy the reason first** |
| TD-K09, TD-K10 | Your Victorian schooling sketch (4 September) | Your example: stays exactly as it is |
| TD-K17 | The derived shortcut written as a My Turn (12 September) | Yes (L2023) |
| TD-M06 | A teacher on a finished Year 4 history deck (18 September): "because we had a big task already, then we've also got to do worksheet, it won't fit the 45 min." | Not in the log; it sits in the validator's comment. **Copy it first**, or keep your words without the date |
| TD-M04 | "28 saved designs in a row had written `null` there"; the `My walk matters because...` beat | The first, yes (L1255). The second is not in the log but is also written, undated, in What a Lesson Is For (L152) |
| TD-L10's line | The deck approved on 14 September with the teaching in the notes ("there's nothing on the slide to guide me to know what to say") | Yes (4.2.200, L1251 onwards); the row quotes only the rhythm half of the line |

## Names the code depends on

These are read by programs or tests and do not change without the code:

- **Headings.** `preferences.md` `## The Teach → Do → Teach → Do Rhythm`
  (the reviewer's routing card, the designer's startup read, and six test
  files pin the name); `lesson-designer.md` `### The Teach → Do Rhythm` (the
  vocabulary pin VOC-E39 names it as its section); the skill route's
  `## Output Format Block` (the vocabulary pins VOC-E34, E47, E48 and DEC-07
  name it as their section, and the review packet tells the reviewer to stop
  reading every route file at that line); each subject file's
  `## What a Do beat looks like in <subject>` (a test; history's is a bold
  line, not a heading); the content route's title.
- **Pointer names** other files cite by their bold words, several pinned by
  tests: `Questioning is not doing`, `The Do uses the idea its own Teach just
  taught`, `Name what the chunk needs children to do with it`, `Choose the
  material and the thinking together`, `Use variety deliberately, without a
  quota`, `Each major beat changes the state of the lesson`, `A link carries
  learning`, `Read a link as four things in the actual content`, `Climb the
  demand`, `Claim what the work can show`, `Orientation is not automatically a
  Teach chunk`, and the quick-checks topic's `A quick check is a fresh case,
  not the last slide again` and `A quick match, sort or label is a real Do
  beat`.
- **Beat kinds**, by route. Skill: `prepare`, `teach`, `practise`, `my-turn`,
  `our-turn`, `your-turn`. Content: `observe`, `teach`, `do`, `practise`.
  Discovery: `question`, `explore`, `make-sense`, `teach-why`, `use-learning`,
  `finish`. Dialogic: `grounding-input`, `stimulus`, `talk`, `stimulus-talk`,
  `synthesise`. Task-centred: `set-task`, `teach-needed`, `plan-checkpoint`,
  `do-task`, `share-conclude`.
- **Fields:** `pupilInstruction`, `unlocks`, `thinking`, `minutes`,
  `conceptRef`, `content.keyQuestions`, `format`, `launch`, `answer`,
  `teacherInfo`, `modellingState`, and the Dialogic pair `question` and
  `discussionQuestion`.
- **The code's own lists.** The validator's teacher-only kinds (`prepare`,
  `my-turn`, `grounding-input`, `stimulus`, `set-task`) are the only beats
  allowed a null `thinking`; its teacher-presents kinds add `teach`,
  `teach-why` and `teach-needed`, and are the beats a named idea's instances
  must not all be. The review packet's always-read list (TD-L24) does not
  include the rhythm section.
- **Two copies of every route shape:** the validator's route checks and the
  scaffold's `validate_route_shape` (TD-L25), held together by
  `test_both_copies_agree_on_every_shape`. A new beat kind or a changed order
  is a change to both programs and that test.
- **Messages that carry rhythm rules**, quoted in rows J21, J31, J33, J34,
  J48, J72, M09 to M11 and L25: the validator's "no Your Turn" refusal also
  says "sized to that cycle", "a bridging cycle on small numbers earns two
  questions, not none" and "A Teach or Practise beat goes between cycles rather
  than inside one", and tests pin three of those phrases; the slide check's
  `MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`; the review packet's
  routing-card entries (L17, L18) and its `Each Do beside the teaching before
  it` section.

## What the code enforces today

The validator and the scaffold enforce each route's order of beats, the
scaffold before the files are written and the validator after.

- **Skill-based:** each cycle is a My Turn, at most one Our Turn, then its own
  Your Turn, with nothing between them among the sequence's beats (a
  vocabulary slide anchored after a My Turn is not refused); two My Turns in a
  row are refused for any concept, and so are two Our Turns; concepts run in
  the order declared and are not returned to; `prepare`, `teach` and
  `practise` sit only before or between cycles; each turn's label begins My
  Turn, Our Turn or Your Turn. Two consecutive My Turn slides from different
  units fail the slide check, which finds a My Turn slide by its title.
- **Content-based:** every Teach is followed at once by a Do or by the Practise
  that uses it; an Observe only ever sits straight before a Teach; at least
  one Teach then Do pair comes before the first Practise; there is at least
  one Practise; nothing sits outside a pair. A Do's `format` may be null.
- **Discovery:** exactly question, explore, make sense, teach why, use the
  learning, finish, once each.
- **Dialogic:** an optional grounding input first; each Stimulus followed at
  once by a Talk whose `discussionQuestion` is exactly the Stimulus's
  `question`, or a combined beat; at least one; one Synthesise, last.
- **Task-centred:** Set the Task first; any number of enabling inputs, each
  one followed by another carrying a pupil instruction; an optional plan
  checkpoint; the task; an optional share; nothing else.
- **Every route:** `thinking` may be null only on a teacher-only kind (which
  includes `prepare` and `grounding-input`, wider than the text's "a My Turn, a
  stimulus, the setting of a task"); `unlocks` at most 200 characters, and at
  least one beat not null; each beat's `minutes` 1 to 25, and when the
  starter, every teaching beat and the ending beat all carry `minutes`, their
  sum may not pass 50; a named idea needs two instances, one where every child
  acts; a Do or Practise that hands children a representation to use or write
  on must carry a pupil instruction; an explanation or comparison Practise must
  be shown a good one first (its launch, or an earlier revealed model).

What it does not enforce, although the text might suggest it: that a Do has
every child commit (a question to the room passes); that the Do uses its own
Teach's idea; one idea per Teach or per enabling input; variety, or the
three-in-a-row trigger; orientation; a second job in a beat; runs of
teacher-only beats (only a reviewer reading trigger); that a skill `teach`
beat stops short of modelling; the mini-cycle for a step the class cannot yet
do (the reviewer checks it, L22); that Discovery's one explanation carries one
idea; and that a Dialogic synthesis names only views children expressed.

## Rows whose wording a test already pins

Found by matching every string of 20 characters or more in `scripts/tests`
(Python strings and the JSON pin files) against the quotes. A row here cannot
lose that phrase without a test failing; a fold that moves the phrase moves
the test with it.

A02, A12; B01, B02, B04, B07, B13, B14; C01, C03, C04, C06, C07, C08, C11,
C12, C13, C17; D01, D03, D04, D06 to D09; E01 to E11, E14 to E16, E18; F03,
F09, F12, F13, F15, F16; G01 to G03, G06 to G09, G11 to G17, G21; H01 to H04,
H07; I08; J01, J03, J05, J12, J13, J15, J16, J18 to J21, J29, J31, J36, J38,
J41, J43, J48, J60, J65, J72, J73; K03 to K07, K10, K16, K17; L04, L05, L08 to
L11, L13, L14, L16, L17, L20, L25; M01, M02, M04, M05, M11; N06 to N10; Z01 to
Z04, Z11, Z19. That is 125 rows.

Of these, the vocabulary pins (`vocabulary_ledger_pins.json`) hold A12, B01,
B04, G03, G12, G13, J15, J16, K10, L04, M02, Z03 and Z04, several with the
section they must stay in. A01, B09, D05, F02, F06, F14, G04, G10, I03, L07,
L18 and L19 match only through a name (`The Teach → Do → Teach → Do Rhythm`,
`A link carries learning`, `question to the room`, `## Output Format Block`).
L19's former line, the scope record at packet L580, is pinned by
`test_design_review_packet.py`.

**Tests pin order as well as words.** `test_the_do_uses_what_its_teach_taught.py`
requires `**The Do uses the idea its own Teach just taught.**` to come after
`**Questioning is not doing.**` in the rhythm section, and the content route's
«Match the substance before the form» (D04) to come before «Then match the
form to what was just taught» (E18). `test_rhythm_holds_in_every_route.py`
requires `The Teach → Do → Teach → Do Rhythm` to sit between `**At the
start:**` and `**At the decision point:**` in the designer's reading list
(A13's line). A fold that reorders the section or moves the reading line
fails these.

**A pinned phrase decision 2 would change.** `test_rhythm_holds_in_every_route.py`
L229 pins «a run of slides that are all the teacher talking» (H01). If H01 is
reworded, that test moves in the same release.

Rules that exist in one place and carry no pin today include A09, A11, B15,
C10's placement clause, C18 to C20, D10, D11, E17, F07, G05, G20, I01, I02,
I09, J17, J25, J33, J44, J49, J64, K24 to K26, L03's collective-recall clause,
L06, L12 and L22.

## Mentions judged to belong to another topic

Looked at and left out of the rows, because the rhythm is not what they
govern. Each goes with its own topic.

- **Prose and slide rhythm, not lesson rhythm:** `preferences.md` L37, L49,
  L67 (Written Voice density and rhythm), L590 ("the rhythm of a teaching
  beat" on a slide is reading order); `teacher-voice.md` §3; `slide-designer.md`
  L137 (the visual rhythm of a deck) and L393; `slide-composition-playbook.md`
  L192 (where a Teach splits across slides; the My Turn rule on L194 is N07)
  and L352 to L360 (Teach layouts).
- **Speaker notes and answers by beat type:** `lesson-designer.md` L90 (script
  shape for My Turn, Our Turn, Do, Your Turn), L389 (answer delivery for Do
  beats and checks); `templates.md` L1173 (numbered question cards are not for
  a Do beat).
- **Printed materials:** `lesson-designer.md` L385 (a card kit; "a two-minute
  check after a Teach stays on the board").
- **Setting a task and launching it:** `do-beats.md` L29 to L45 (the four
  parts of a pupil instruction; the quick beat keeps its one line);
  `preferences.md` L627 to L637 (launching a substantial task; the designer's
  own copy is Z19).
- **Do-beat formats and the calm classroom:** `do-beats.md` L357 (seated forms
  first) and L379 to L383 (Stand If is not used); the dialogic Talk formats
  other than those in decision 5; the catalogue entries that repeat "the
  teacher chooses how responses are gathered" (C24 carries the rule).
- **Support and checks:** `preferences.md` L501 (can every child start), L505
  (a check before independent practice: quick checks); `evidence-synthesis.md`
  §3 and the rest of §6.
- **Route choice rather than route rhythm:** `lesson-designer.md` L150 (a
  writing lesson is skill-based until the form is held), L144 (Discovery's
  three conditions); `lesson-designer-components.md` L27.
- **Slide titles:** `lesson-designer.md` L68 (a label names the move).
- **Layout uses of "in a row"** in the adaptation, worksheet and helper files.

## Found in passing

- **The reviewer is sent to the wrong section for "a question to the room"**
  (TD-L18). The slides section carries only one clause on it («a Do slide is
  still the case and what every child decides», `preferences.md` L531); the
  rule is in the rhythm section, whose own routing entry (TD-L17) does not name
  the trigger. Decision 6.
- **The rhythm section is conditional for the reviewer.** It is not on the
  always-read list (TD-L24), so it opens only when a trigger fires: two
  teacher-presented beats in a row, three or more Teach beats, and the rest.
  Two of the triggers (a Do on a different idea, a second job) need the fault
  found first, which the packet's own comment (TD-L23) says a trigger must not.
  A test pins the first of those two phrases. Decision 6.
- **The reviewer's reading of every route file stops at `## Output Format
  Block`**, given in words at packet L694 to L697 (L580 records the same scope
  for the hash check; the file itself is handed over whole). Beyond the skill
  route's rhythm rules and the task route's staged-task rule (decision 6), the
  content route's Teach board rules sit below that line too (the landed
  sentence leads the board, the four-part explanation, "A Teach has a thought
  in it", and D10 and D11), though the reviewer's own User-fit paragraph cites
  `teaching-sequence-content-based.md` → `explanation`. For the Teach-board
  topic.
- **The scaffold is a second gate** with its own copy of every route shape, in
  its own words (TD-L25). Any change to a route's beats is two programs and a
  test that holds them together.
- **`format` is nullable on a content Do** (the validator) and is not a
  child-facing key in the review view, so the reviewer sees it only among a
  unit's other fields; the "three in a row" and "all one channel" reads lean on
  it (decision 9).
- **"Each Do beside the teaching before it"** in the review view covers only a
  content `do` straight after a Teach: Your Turns, enabling-input
  instructions, Talk and Use the learning are not shown. Shared with quick
  checks, but it limits what L11 and L20 can see.
- **Null `thinking` on a bounded attempt.** The code allows `thinking` to be
  null on any `prepare`, including a `bounded-attempt`, where children act;
  the text allows null only where the teacher acts.
- **Time.** The designer is told the beats may take 40 minutes; the validator
  refuses only above 50, and only when every beat, the starter and the ending
  included, carries `minutes`. Later decision C.
- **TD-J73's wording**: «the validator refuses a `teach-needed` followed by
  another whose `pupilInstruction` is null» reads as though the second unit is
  checked; the code checks the first. **TD-J21's wording**: «refuses two My Turn
  units in a row for the same concept»; the code refuses any two in a row.
  Decision 7.
- **The subject files' Do-beat lists** are headings in four files and a bold
  line in history; maths has none, though your preferences point every lesson
  at "the subject file's `What a Do beat looks like`". A maths skill lesson's
  Do beats are its Your Turns, so this may be right; worth a sentence saying so.
- **An Our Turn and "questioning is not doing".** The skill route has the Our
  Turn's guiding questions spoken one at a time to the class. Read literally,
  the rhythm's "could most of the class sit it out?" test would catch that.
  The rhythm says skill lessons carry the Do as "guided and independent
  practice", which covers it, but no file says an Our Turn meets the test.
- **The two ledgers agree on I01's strength now**: must for giving the
  context, may for the separate moment (AK-B15 records the same sentence).
- **The build log has no entries between 4.2.222 and 4.2.235** (already
  found in the vocabulary round), and no entry for the Practise-placement
  change was found.

## Independent check: what was not taken

Every finding in `streamline-tools/teach-then-do-inventory-check.md` was
checked against the files. All held; these few were not taken in the form
proposed.

- **Separate rows for each catalogue entry saying "the teacher chooses how
  responses are gathered"** (item 5): they are format entries repeating the
  Classroom Norms rule, which C24 to C26 carry.
- **Merging G15 with the reviewer's and designer's "same evidence again"
  checks** (item 32): the check itself says they compare different things
  (what two beats ask, against what is new to notice); they are listed side by
  side (G15, G21, G22) and not proposed for merging.
- **The `my-turn` "inside the same concept" pull as its own decision** (pair
  4): J21 and the code already settle it, so it is a wording fix inside
  decision 7.
- **The 10 and 100 more example told differently from the log** (J21's
  story): the file's example is undated and makes the same point (two moves
  before practising either), so no change is proposed.
- **The scaffold note on decision 3** (a new beat kind needs both programs and
  a test): decision 3 no longer proposes a new beat kind.
