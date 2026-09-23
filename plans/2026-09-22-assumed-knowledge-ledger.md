# Assumed-knowledge rule ledger (streamline topic 2)

Step 1 of the streamline method in `streamline-plan.md`, for one topic: what
children are assumed to already know. Nothing in the plugin was changed to make
it.

**Snapshot.** lesson-v4 4.2.284, commit `3de9c956`. Line numbers are the line
in that commit where the quote starts. Every «quoted» passage is the file's own
words; `streamline-tools/check-ledger-quotes.py` confirms each one exists in the
file named in its Where column.

**What counts as this topic.** Every instruction about the words, names,
places, ideas and prior learning a lesson relies on without teaching them:
explaining a named person, place, organisation or event where it first appears;
supplying a missing referent, meaning, context or connection before relying on
it; working only from what children can use at that point in the lesson (the
prior learning the brief establishes, and what this lesson has made
understandable so far); what an earlier lesson counts as having taught;
labelling sources and where they came from in words the class has; questions a
child cannot parse because they assume the adult's knowledge; and the design
reviewer's check of the names on the board, with the review page that lists
them.

**What belongs to a neighbouring topic.** The Teach then Do rhythm (one idea
per Teach, every Teach followed by a Do, each Do paired with its own Teach,
orientation, links between beats) and quick checks (what makes a check genuine
rather than a restatement, fresh cases) are running beside this one. Vocabulary
is finished: its rules about a word the teaching leans on and about named
people in history are owned by vocabulary and pinned by its test. Rows from
those three, and from later topics (voice, success criteria, worksheets, the
wall, starters, adaptation), are listed here marked "shared" with the owning
topic named, so the fold can see them. They are not proposed to move.

## How to read a row

| Column | Meaning |
|---|---|
| ID | `AK-` then a group letter and a number. Groups: A work from what children can use at that point, B supplying the missing context, connection or referent, C named people, places and events, D sources and where they came from, E knowledge before judgement and what each route needs children to hold first, F prior learning and what an earlier lesson counts as having taught, G questions and wording that assume the adult's knowledge, H time and place, I home, family and everyday experience, J pages children read away from the teaching, K the review page and the reviewer's name check, L Below and Greater Depth. |
| What the agent is told | The rule's own words. Several «quotes» in one row are separate sentences of the same rule. |
| When it applies | The condition, and any exception the text gives. |
| Strength | **must** (never, always, only), **default** (normally, usually, prefer), **may** (a permission), **check** (a test the agent runs), **mechanics** (how to record or build it). "Code" means a program refuses or prints it. |
| Code names | Field names, markers, headings or commands a program or test depends on. These cannot change without the code. |
| Where | The file, its section and line. The primary row of a rule lists its copies. |
| Kind | rule; your example (how the agents learn your taste); your ruling (your words); duplicate of another row; near-duplicate (and what it adds); contradiction (a numbered decision below); story (a dated incident); pointer; maintainer; stale; shared (another topic owns it, named). |
| Proposed home | A proposal only. **PREF-WFU** preferences.md → What a Lesson Is For → `Work from what children can use at that point`; **PREF-SP** preferences.md → Slide Philosophy → Lesson Designer content boundaries; **PREF-SSI** preferences.md → Source and Scenario Integrity; **LD-SETTLE** the designer's `Settle the classroom experience`; **LD-PRIOR** the designer's `Before You Design Anything` → Prior knowledge; **TV6** teacher-voice.md §6; **REV** the design reviewer's own file; **SUBJ** its subject file; **ROUTE** its route file; **SD** the slide designer's files; **WS**, **WALL**, **ADAPT** the worksheet, wall and adaptation files; **LOG** build-review-log.md; **CODE** the program; **STAYS** stays where it is because another topic owns it. |

## What the list shows, in short

- **283 places** in 38 files (36 instruction files and two programs) say
  something about what children are assumed to already know. About 220 of them
  are in what the lesson designer reads.
- **103 are rules in their own right.** **37 repeat a rule written elsewhere**,
  and **37 more are near-repeats that carry their own condition, strength or
  limit** (marked "near-duplicate", "not a duplicate" or "adds" in their row). A
  fold has to keep those extra words, or it loses a rule.
- **About 96 are shared with another topic** and listed so nothing is hidden:
  mostly the rhythm (24), vocabulary (18), voice (15), worksheets (13),
  adaptation (10), success criteria (9), the Teach board (9) and starters (8).
- **The rule has no single home, and its scope changes from place to place.**
  "Work from what children can use at that point" is written in full once, in
  your preferences. The same idea is then said by the designer's prior-knowledge
  rule (anything unspecified is new), its step-by-step walk (supply a missing
  referent before relying on it), its task check, its final check (which counts
  the script), the history names rule (history only; an earlier lesson the brief
  names counts), history's knowledge-before-judgement check (every beat), the
  reviewer's names check (every subject), its route check (a step done "at this
  size") and its pedagogy read (only what a child can see). That is the "nine
  places with nine scopes" the streamline brief found, and decisions 1 to 6 are
  where the scopes disagree.
- **Four places contradict another rule** in what the agents read: the
  designer's final check counts what is only said aloud, and the reviewer both
  excuses a spoken reason with no panel and makes one a finding (decision 1);
  the Connect It Back beat calls last week's idea "secure" (decision 3); and
  history both bans and uses the word "reconstruction" on the board (decision 7).
- **Three rules the whole plugin needs live only in the history file**, which
  only history lessons read: explain a name where it first appears (decision 4),
  the explaining-cost test for a source (decision 5), and the beat-by-beat
  knowledge check (decision 6). The designer's general rule even points at the
  second one for every subject, and no section read can select it.
- **One of the widest assumptions is made by a program, not a rule.** The brief
  printed for a lesson from your long-term plan says the class "has already
  covered" every earlier objective in the unit, though the plan runs ahead of
  what has been taught, and the "previous lesson" handed to the designer is the
  one built last, not taught last (decision 2).
- **Nothing here is out of date**, but the review page does less than the
  reviewer is told it does: it cannot see a one-word name opening any piece of
  text, a slide title or any ordinary word, and it counts the script and
  part-words as "said earlier"; a test holds part of that behaviour (decision 8).
- **Two stories are not in the build log yet** (Sophie's breathing, Sarah
  Gooder beside two invented children), so they must be copied there before
  they can leave; three more are only partly there (the 1590 order, and the
  rounding numbers behind F14 and F31).
- **The code enforces almost none of this topic**: it prints the list of names
  and source words for the reviewer, requires a Discovery lesson to record its
  prerequisites, and refuses an unmodelled written explanation in content
  lessons only. **Tests already pin a sentence in 74 rows**, and **the
  vocabulary test pins 20 rows** of this topic in place, so a fold that moves
  them moves those pins in the same release.
- **An independent check** found 67 places the first list missed (ten of them
  sentences tests already pin), duplicates that carry their own condition,
  scope errors and five disagreements. Each was verified against the files and
  the code before it went in; what went in differently is listed at the end.
- **Eleven decisions for you** below, and five more noted for later topics.

## Decisions taken (23 September 2026)

Daniel answered all eleven in one message. His words first, then what each
means for the change.

1. "Speaker notes and board should never be combined or seen as one. You have
   the board, which has the teaching, activities, helpers and pictures to point
   to. The speaker notes are seperate and used by cover, tired teachers, new
   inexperienced teachers, to guide them on how to speak, share and present
   that information on the board in a conversational way." The board holds the
   teaching, the activities, the helpers and the pictures to point to. The
   script is a separate guide for a cover, tired or new teacher on how to say
   and present what is on the board, conversationally; it never counts as
   having taught something the board lacks. Anything a later beat relies on is
   on the board first. The designer's final check ("spoken preparation") and
   the reviewer's "without forcing every spoken reason into a panel" are
   reworded to match, and history's "on the board or in the script" becomes
   "on the board". The rule that a script which gives an answer away still
   counts stays.
2. "The plugin can sometimes be shown medium term plans which is a sequence of
   lessons. This gives it context to know what was taught beforehand
   (roughly). Its as simple as that." The suggested proof rule (the brief says
   so, or the saved slides show it) is not adopted. A plan's sequence is the
   rough context for what came before: the lessons before this one in the plan
   are taken as taught by the time this one is taught, and the plan brief's
   "has already covered" wording stays. With decision 3, anything today's
   lesson leans on from one of them gets a short reminder where it first
   appears today. This reading was stated back to him.
   Correction found on 23 September: with the school calendar (his usual
   filing), the "previous lesson" handed to the designer is already the one in
   the calendar slot before this one (`resolve-filing.py` `previous_lesson`);
   only without the calendar (a cloud letterbox run, or no filing chosen) is it
   simply the last one built (`latest_lesson`). The decision 2 text above
   overstated it. No code change is part of this decision; the no-calendar case
   is noted for the before-and-after reruns.
3. "Agree."
4. "Agree."
5. "Agree"
6. "Agree"
7. "Agree, but also, not always needed." Where a source came from is said once,
   in children's words, when it matters to the lesson; not every source needs
   a line about where it came from.
8. "I don't get this one. I wasn't saying those words were bad, I'm saying
   they were just thrown on the board with no previous context, and assumed
   they know what these things are. If I just go on a random slide and see
   those slides I saw, it's just too much cognitive overload." Not decided:
   re-explained and asked again. His principle stands for the whole topic:
   words and names thrown on the board with no context overload the class.
9. "Agree"
10. "Agree"
11. "Agree."

### Second round (23 September 2026), his replies to the read-back

- 1. "Yes, that's right. The speaker notes are just the script to teach that
  slide. They're not something separate. I've said time and time again that
  most of the time a teacher does not read the speaker notes. So the board has
  to show the teaching. And whatever. But we we need to stop keeping them as a
  combined thing." Settled: the notes are the script for teaching that slide;
  most of the time a teacher does not read them, so the board shows the
  teaching; nothing is taught by the notes and the board together.
- 2. "Yep, that's fine." Settled as read back.
- 7. "Agree." Settled as read back.
- 8. "Really similar to what we were just talking about About the abstract thing
   And it's not like explaining these words through a vocabulary slide. It's
   just the way you word it. Like rather than just going, Elizabeth First said
   this. You, you set the scene. You say Elizabeth First was the, I'm guessing,
   the Queen of England at that time. And she thought this. So she wrote
   something called an order. This is it. Or an order is something, blah,
   blah, blah, blah, blah. Then show the order. It just makes sense now. And
   the thing about the steam engine, it was just so random. There were, there
   were two fairgrounds. And then it's mentioning one's powered by steam
   engine. It's like, okay, give me some context around that. One's powered by
   steam steam engine, which is a da da da da da da da."
  Settled, and wider than the reviewer's list: the fix is in how the teaching
  is worded, not a vocabulary card. A name, source or thing arrives with its
  context in the sentence that brings it in ("Elizabeth I was the Queen of
  England at that time. She was worried about ... so she wrote something
  called an order. This is it."; "one was powered by a steam engine, which is
  a ..."). The reviewer's list is repaired as suggested, and the reviewer reads
  every lesson for it. His Teach then Do decision 3 reply below states the
  test both topics share.
- His test, given in his Teach then Do decision 3 reply (recorded in full in
  that ledger): read any slide on its own and understand what it is doing and
  why, or go back one or two slides and see why. Nothing arrives feeling
  random, to him or to the children; it is not only about abstract ideas.

## Decisions for Daniel

What this topic needs from you. Each one says what the plugin says now, what I
think and what I suggest; "yes" takes the suggestion.

1. **Does something the teacher only says count as taught?**
   - **What it says now.** Most of the plugin says a later task may only rely
     on what children have seen on the board: "a line the final task needs is
     teaching, always, and may never be moved to the script"; notes "do not
     rescue missing essential meaning"; the reviewer tries a task "using only
     what is on the board and everyday sense", and treats an answer that was
     only ever said aloud as unprepared (the PSHE check whose answer,
     breathing, lived only in the script). The designer's final check is the
     odd one out: it works an answer from the "spoken preparation children
     receive". Some places put things in the script on purpose: the history
     rule on judging a person ("One sentence, on the board or in the script"),
     the teacher's framing of a task ("the orientation, the why-it-matters"),
     and an Our Turn's guiding questions ("the script is their only home").
     And the reviewer's own file says both "without forcing every spoken reason
     into a panel" and that a teaching sentence in the script with nothing on
     the board is a finding.
   - **What I think.** The disagreement is narrower than it looks. What a later
     task relies on belongs on the board; the script's other jobs (framing,
     guiding questions, saying the board's teaching more fully) are fine where
     they are. Only two lines pull the wrong way: the final check's "spoken
     preparation" and the reviewer's "without forcing every spoken reason into a
     panel". Your vocabulary ruling ("it should be on the board, not just the
     script") points the same way, and it is the one place the checking program
     already holds it.
   - **What I suggest.** Say it once: anything a later beat relies on children
     knowing is on the board before that beat; the script may frame, guide and
     say more. The final check and the reviewer's panel line are reworded to
     match. The rule that the script still counts when it gives an answer away
     stays exactly as it is. One honest note: history's "on the board or in the
     script" for the "we're not asking whether he was nice" sentence would become
     "on the board", because the class's judgement relies on it.
   - **Question:** should anything a later task relies on have to be on the
     board, with the script free to frame, guide and add?

2. **What counts as "taught in an earlier lesson"?**
   - **What it says now.** At least eight wordings. Names: "an earlier lesson
     the brief names". History's judgement check: "a named earlier lesson of
     the enquiry". The designer: "supplied prior teaching and neighbouring
     lessons", and "earlier lessons tell you what children already hold".
     Your preferences: "the prior learning the brief establishes (checked where
     it matters)". Method steps: "already done at this size, in an earlier
     lesson or today's starter". A model answer: an earlier lesson never
     counts. And when a lesson comes from your long-term plan, the brief says
     the class "has already covered" every earlier objective in the unit (or,
     at the start of a unit, the whole previous unit), and the designer is told
     a supplied plan is "authoritative on objective, coverage and sequence".
   - **What I think.** They agree the evidence has to be named; they disagree
     about what the evidence is. The plan brief's line was written to help the
     starter, but it reads as a statement of what the class knows. It is also
     not always true: the plan runs up to five lessons ahead of what has been
     saved, so "already covered" can include lessons not taught yet, and the
     "previous lesson" the designer is handed is the one built last, not the one
     taught last. The designer's "make the foundation visible" still applies, so
     a bare name after it would break one rule, but the brief invites it. Two
     sturdier sources already exist: the previous lesson's saved design, which
     "holds the words children actually saw", and history's "the design names
     what this lesson banks".
   - **What I suggest.** One sentence in the designer's prior-knowledge rule,
     which the other places point to: an earlier lesson counts as having taught
     a name or fact when the brief says so or that lesson's saved design shows
     it; the plan's list of objectives shows what the unit covers, not what the
     class now holds. The plan brief's words change to "comes before this lesson
     in your plan" (no test holds the old words), and the previous lesson
     becomes the one before this in the plan rather than simply the last one
     built. Model answers stay as they are.
   - **Question:** should an earlier lesson only count as having taught
     something when the brief says so or its own saved slides show it?

3. **Does a name or fact from an earlier lesson get a reminder today?**
   - **What it says now.** A named person or place is explained where it first
     appears "unless an earlier lesson the brief names taught it", so it can
     appear bare. But the designer is told earlier teaching "is not proof of
     mastery" and to make the foundation "visible"; a set of categories taught in
     an earlier year gets "a brisk recap ... not an assumption it is still
     secure"; and history says "causal and interpretive material needs
     re-explaining rather than only retrieving". Against them, the Do-beat
     catalogue's Connect It Back beat says "the older idea is the familiar half,
     so the child is reasoning from something secure".
   - **What I think.** Bare is the risky reading for Year 4. A clause costs a
     few words.
   - **What I suggest.** Anything today's teaching leans on that an earlier
     lesson taught gets a short reminder where it first appears today (`Lord
     Shaftesbury, who we met last week, ...`), never a reteach; the Connect It
     Back note reads "familiar once it has been brought back" rather than
     "secure". A method step children have already done at this size stays
     named and left alone, as now. One honest note: the names sentence belongs
     to vocabulary, which is finished and pinned, so a yes changes it together
     with its pins.
   - **Question:** should a name or fact from an earlier lesson get a short
     reminder the first time it appears today?

4. **Explaining a name where it first appears, in every subject.**
   - **What it says now.** Every designer is told, in general, to bridge
     anything unfamiliar ("a clear bridge when a word or idea is unfamiliar",
     and "concrete explanations of anything unfamiliar" in the script). Only the
     history file says where and how for a named person, place or event: on the
     board, where it first appears, in a clause a child can hold. Geography says
     names "belong in the teaching" but not where or how; science, RE and PSHE
     add nothing. The reviewer checks every name in every subject, and the review
     page lists them for every lesson.
   - **What I think.** The designer is marked on a rule it only reads in
     history. A geography board with Manaus and the Tropic of Capricorn, or an
     RE board with a named saint, has the same problem as the leisure lesson's
     Elizabeth I.
   - **What I suggest.** One sentence in the designer's general reading, beside
     the general bridge rule and "a case arrives with the context that makes it
     make sense": a named person, place, organisation or event is explained in a
     clause a child can hold where it first appears on the board, in any
     subject. History keeps its own paragraph and examples exactly as they are.
   - **Question:** should designers in every subject be told to explain a name
     where it first appears?

5. **The "costs more explaining than it teaches" test for a source.**
   - **What it says now.** The test (list what a teacher new to the period
     would have to explain before the source makes sense, beside what the source
     then teaches that the next step uses; when the first list is longer, choose
     a clearer source or tell it plainly) is only in the history file. The
     designer's general rule tells it to drop any named source, story or clip
     that costs more explaining than it teaches, in every subject, and points at
     the history file for how. A geography or RE designer never opens that file,
     and even a history designer cannot pull the paragraph out on its own: the
     pointer names a bold lead-in, not a heading, and the paragraph sits under
     "Optional decoration on sensitive history".
   - **What I think.** The rule applies everywhere, but its how-to is only
     reachable by reading the whole history file.
   - **What I suggest.** The test moves word for word to the general home next
     to the rule it serves, with "new to the period" read as "new to the topic";
     history keeps the 1590 order as its own example.
   - **Question:** should the source test move to where every subject reads it?

6. **How far "knowledge before judgement" reaches.**
   - **What it says now.** History has the strongest version: every beat that
     asks children to infer, judge, evaluate or explain names where its
     knowledge was taught, earlier in this lesson or in a named earlier lesson,
     or it is a guessing beat. The general rule asks the designer to try only a
     substantial task from what children have. PSHE, RE, the discussion route
     and science each say "teach the knowledge before the judgement", without
     the beat-by-beat check. And several places ask before teaching on purpose:
     history's speculation at the start ("It does not matter that they know
     nothing yet"), geography's "show it and ask before you explain", the whole
     Discovery route (explore, then teach why), the skill route's first attempt
     before the model, maths's "estimate first", and new evidence children
     interpret for themselves.
   - **What I think.** The leisure lesson's weakest moments were small Do
     beats, not the main task, and the beat-by-beat check is what catches them.
     But written for every subject without those exceptions, it would forbid
     moves you want.
   - **What I suggest.** History's beat-by-beat check becomes the general rule
     for every subject, with the exceptions written into it: a beat that asks
     before teaching on purpose (a hook, a pattern children read, an
     exploration, a first attempt, an estimate, fresh evidence) says so, stays
     short, and the teaching that gives it meaning follows straight after. The
     subject files keep their own examples (the Vikings, the Egyptian
     artefacts).
   - **Question:** should every beat that asks children to judge or explain
     have to name where its knowledge was taught, except a beat that asks first
     on purpose?

7. **Words about where a source came from.**
   - **What it says now.** History says label a source in words the class has
     (`An artist drew this recently, to show what it might have looked like`),
     and that `modern reconstruction` or `modern summary` means nothing to a
     Year 4 child. The same paragraph then says a set of reconstruction pictures
     is "named as reconstructions" once. The slide designer's rule says a caption
     that must be honest about "a reconstruction" is said once, without saying
     the word itself goes on the board, and that a caption carrying a source's
     date and maker or a place's name stays. The review page flags any
     `reconstruct...` word on the board.
   - **What I think.** On the Tudor deck you wanted a caption to read "as it
     might have looked" rather than "reconstructed". That is the children's-words
     version, and "named as reconstructions" leaves the door open. One honest
     note: the caption box on two Teach layouts holds only 29 and 44 characters,
     which is what forced `reconstructed` onto that deck, so a yes meets a space
     limit as well as a wording rule.
   - **What I suggest.** Where a source came from is said once, in the class's
     words, at its first appearance or in the script; `reconstruction`, `modern
     summary` and an organisation's name stay off the board unless the lesson
     teaches them; a caption that tells children a date, a maker, a place or
     which picture is which stays; the exact provenance goes in the teacher's
     note.
   - **Question:** should the board always say where a source came from in
     children's words, never "reconstruction" or "modern summary"?

8. **The review page's list of names (a program change).**
   - **What it says now.** The list the reviewer reads finds a capitalised
     name in the middle of a sentence. It misses a one-word name at the start
     of a sentence, after a colon or a question (`Answer: Shaftesbury`), on a
     card holding one name, or opening a quotation; it never reads slide
     titles or vocabulary cards; and it never lists ordinary words
     (`government`, `order`, `steam engine`, three of the six things the leisure
     board assumed). It marks a name "said earlier" when only the teacher's
     script said it, or when a longer word contained it (`Victoria` counted as
     said because `Victorian` was). The rule it serves says the explaining must
     be on the board. And a test holds today's behaviour: it requires
     `Listen to each other.` to give no name, so simply listing every one-word
     opening would break it.
   - **What I think.** A list cannot tell `government` from `garden`, so
     ordinary words stay with the reviewer reading as a child. But nothing sends
     the reviewer to the rule about a word the teaching leans on unless the
     vocabulary looks doubtful.
   - **What I suggest.** A program change with its own tests: read titles and
     vocabulary cards, count only whole words on the board as "said earlier", and
     find a better signal for a one-word name than a capital letter (for example
     the same word capitalised elsewhere in the lesson), updating the test that
     holds today's behaviour. The reviewer's reading card sends it to the
     word-the-teaching-leans-on rule on every review.
   - **Question:** should the review page and the reviewer's reading be changed
     that way?

9. **One home for "work from what children can use".**
   - **What it says now.** Written in full once in your preferences, then again
     in shorter forms: the designer twice, the reviewer five times, history, the
     task calibrations and the content route. Several copies carry something the
     full rule does not: "a new reasoning demand needs preparation" (reviewer)
     and maths's fuller version of it ("a genuinely new decision, representation,
     reading demand or way of thinking", but not for a label alone); the final
     task, its model answer and its acceptance "claim no more than the evidence
     children studied" (history, and your preferences for invented cases);
     "including after a freshness repair", "the same conclusion" earned case by
     case, and "do not ... strip useful support to manufacture independence"
     (reviewer); "avoidable reading" (reviewer); "a Practise brought forward
     before the knowledge it runs on is taught" and "beats kept only because they
     were already written" (content route and its review check); "seen each one
     worked" (skill route); and "an invented wage", "often unverified" (history).
   - **What I think.** The copies are mostly faithful, which is why they are
     safe to fold, and each extra is real.
   - **What I suggest.** The full rule stays where it is and takes every extra
     listed; the designer and the reviewer each keep one pointer that names both
     limits (new evidence is allowed, a new explanation the lesson never taught
     is not); subject examples stay in their subject files.
   - **Question:** fold it that way?

10. **One home for "a question written by someone who already knows the answer".**
    - **What it says now.** Two full versions with different content. The voice
      guide's `Say what you mean`: name the thing, and add a second smaller
      question that leads to the first, with your "college kids" ruling. The
      slide rules' version: four shapes (a question naming the property the
      answer turns on, a second question that leans on the first being solved,
      a heading where a question is needed, a stem built from the task instead
      of the learning), and read every prompt with the answer covered. The
      reviewer points only at the first.
    - **What I think.** They are one rule, and each copy lacks the other's
      repairs.
    - **What I suggest.** Both become one section in the voice guide, which
      owns how a question reads, keeping every example and repair; the slide
      rules keep a one-line pointer that names the four shapes.
    - **Question:** fold it that way?

11. **Which of children's own experiences a lesson may lean on.**
    - **What it says now.** Some places say not to assume children share the
      same home, family or experience (your preferences, the discussion route,
      PSHE: "No beat needs a child's own experience to be completed"). Others
      invite it: geography's "their own experience is comparison material worth
      using", the PSHE and RE starter prompts ("Think of a time when…"), and a
      set the class builds from "being a person". RE adds where the alternatives
      must live: a script that said `think about December in your house` three
      times, with the other options only in a note to the teacher, "has withdrawn
      them from the child who needed them".
    - **What I think.** They fit together once they are said in one place:
      experience may be invited, never required.
    - **What I suggest.** One home in Source and Scenario Integrity: a lesson may
      invite children's own experience (a starter, a comparison, a set built from
      being a person), but no beat needs it to be completed, and the alternatives
      (school, friends, a made-up case, a private answer) are said in the words
      the class hears. PSHE and RE keep their own examples.
    - **Question:** should a lesson be able to invite children's own experience
      but never depend on it?

For later topics, found while listing this one:

- **Worksheets.** Seven places decide whether a sheet may lean on the board,
  and none says which sheets count as used on their own: "a resource intended
  for use on its own cannot assume an unseen board" (AK-J03); the worksheet
  designer may drop a reference the child meets on the board (J04) and omits a
  criteria panel unless "the sheet must stand independently" (J14); two
  preferences say drop what the board shows (J15, J16); the reviewer says assume
  neither that nothing is available nor that the board will always be there
  (J13); and the board may assume the sheet (J17).
- **The rhythm.** Orientation, "the context needed to enter the first example",
  is written four times in slightly different words and at different strengths
  (AK-B15 to AK-B18).
- **Success criteria.** "Every step in words they already own" and "wherever
  you have to supply a meaning the words leave out" are written six times
  (AK-G23 to AK-G27, G29).
- **Vocabulary (finished).** The slide colour rule greens "a prior lesson's
  term the design says children already hold", but the design has nowhere to
  say it (AK-F29).
- **The Teach board.** "A teacher who does not know this topic, on their first
  day, with the notes closed" is this topic's test turned on the teacher; it
  lives with the Teach slide and is listed at the end, not as rows.

---

## A. Work from what children can use at that point

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| AK-A01 | «**Work from what children can use at that point.** A task can only draw on what children have to work with when they meet it: the prior learning the brief establishes (checked where it matters, because earlier exposure is not mastery); the facts, meanings, methods and relationships this lesson has actually made understandable so far; the vocabulary, representations and response forms they know how to use; and whatever the task itself deliberately puts in front of them.» «Before committing a substantial task, attempt it from that material alone and find any connection you supplied without noticing. Repair a real gap by teaching the connection, modelling the move, choosing a clearer example, supplying the evidence or narrowing the task within the objective, never by writing the missing idea into the answer key.» | every substantial task; limits AK-A02 and AK-A03 | must (attempt before committing) | tests pin the heading and the repair sentence | `references/preferences.md` › What a Lesson Is For · L166. Copies: A04, A05, A06, A11, A12 | rule (the owner); decisions 1, 6, 9 | PREF-WFU |
| AK-A02 | «**New evidence is allowed:** an adapted account can tell children something new, a test can produce a result nobody has seen, a fresh text can support an inference, and interpreting it can be the whole point, provided the lesson has prepared children to read it; this is not an instruction to tell them the answer before every investigation.» | limit of A01 | may | tests pin two phrases | `references/preferences.md` › What a Lesson Is For · L166 | rule (limit) | PREF-WFU |
| AK-A03 | «**A new explanatory mechanism is not:** a task relying on a law, a guild rule, an economic arrangement or a scientific process the lesson never taught has smuggled it in as assumed knowledge, however much more like real history or science the task then looks. Either it earns a place in the teaching, accurate, inside the objective and teachable in the time, or the task makes better use of what was taught.» «Deeper work usually comes from a comparison, a missing relationship, a changed condition, a fresh application or a closer use of evidence, not from more facts, longer answers or harder words.» | limit of A01 | must not | tests pin two phrases | `references/preferences.md` › What a Lesson Is For · L166. Copies: A07, A08, A09, A10 | rule (limit) | PREF-WFU |
| AK-A04 | «Work both answers only from what children can use at that point (`preferences.md` → What a Lesson Is For, `Work from what children can use at that point`): new evidence the task supplies is fair material to interpret, but a law, rule or process the lesson never taught is not, however much more like the subject the task then looks.» «then the response a child with a plausible misunderstanding could give from the board and everyday sense» | the main task, and any Do beat relied on as evidence | must | test pins the pointer | `agents/lesson-designer.md` › Settle the classroom experience · L60 | pointer that keeps both limits | LD-SETTLE (the pointer decision 9 proposes) |
| AK-A05 | «For a substantial explanation or judgement, work an answer using only the knowledge, sources, references and spoken preparation children receive.» | the designer's completion pass | check | | `agents/lesson-designer.md` › One Completion Pass · L512 | contradiction, decision 1: counts "spoken preparation", where A12, A13 and your vocabulary ruling count only what the board showed | decision 1 |
| AK-A06 | «For pedagogy, attempt a representative pupil response using only the preparation and accessible references the lesson provides - the taught knowledge, the demonstrated thinking and what a child can see. Identify any connection the adult would still have to supply.» | every review | check | | `agents/design-reviewer.md` › Material-defect boundary · L40 | near-duplicate of A01 for the reviewer: adds "what a child can see", which sides with A12 on decision 1 | REV |
| AK-A07 | «Run the same attempt the other way: a task that can only be answered with a law, a rule, a process or an arrangement the lesson never taught has been made to look deeper by changing what it requires, and that is a finding too (`preferences.md` → What a Lesson Is For, `Work from what children can use at that point`). New evidence the task itself supplies for children to interpret is not that fault.» «then attempt the task holding it, using only what is on the board and everyday sense» | every review of the main task and relied-on Do beats | check | test pins "has been made to look deeper by changing what it requires" | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L187 | duplicate of A03 for the reviewer | REV (the pointer) |
| AK-A08 | «Stronger reasoning never means untaught knowledge, trick wording or avoidable reading.» «Apply both with their limits. A retrieval starter is meant to use what children already know.» «A source on the page may be exactly what children should read and interpret. Do not reject any of these because the information is supplied or the task is straightforward; judge what the task claims to accomplish» | every review; limits: a retrieval starter rests on what children already know, and a source on the page may be what they read | must not | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L191 | near-duplicate of A03: adds "trick wording" and "avoidable reading", and closes the probes' paragraph of limits | REV |
| AK-A09 | «What does not deepen a history task is adding rules the lesson never taught: a law, a guild's entry rule or an invented wage makes the task look more historical and makes it a test of untaught, often unverified, content (`preferences.md` → What a Lesson Is For, `Work from what children can use at that point`).» | history | must not | | `references/subject-history.md` › Choose the response that reveals the history · L135 | near-duplicate of A03: adds "an invented wage" and "often unverified" | SUBJ (example); extras carried into PREF-WFU (decision 9) |
| AK-A10 | «**Weak, inflated.** A history task made to look more historical by adding rules the lesson never taught (a law about apprenticeships, a guild's entry rule) and asking children to judge a case against them. The task looks harder and now tests untaught content, which in the case this came from was also unverified.» | the calibration the designer and reviewer read | check | test pins "**Weak, inflated.**" | `references/task-contrasts.md` › A short sequence: work that builds, and work that only looks connected · L75 | example of A03 | STAYS (calibration) |
| AK-A11 | «Across all routes, trace preparation and independent performance in both directions, including after a freshness repair, using the representative answer you worked for the Pedagogy judgement: the relationship the adult would have to supply is the finding. New evidence with the same taught reasoning is legitimate; a new reasoning demand needs preparation.» «Reaching the same conclusion is also legitimate when children examine each case to earn it.» «Do not make every answer different or strip useful support to manufacture independence.» | every review | check | | `agents/design-reviewer.md` › 2. Route, modelling and independence · L170 | near-duplicate of A01 and A02: adds "a new reasoning demand needs preparation", "including after a freshness repair", and two limits (the same conclusion earned case by case; no stripping support to manufacture independence) | REV; extra carried into PREF-WFU (decision 9) |
| AK-A12 | «the task requires the thinking named by the objective, and the teaching supplies the particular knowledge, examples or demonstrated actions a successful performance depends on.» «the slides are written as if the teacher never opens the notes, so a check whose expected answer lives only in a script (`breathing`, said aloud on the slide before and printed nowhere) is unprepared.» «A topic-relevant picture, a correct headline or a claim of substantive teaching in the rationale is not sufficient by itself. Accept concise teaching and simple examples when they do supply what children need; richness is not a count of facts, images or activities;» | every review; limit: concise teaching and simple examples are accepted when they supply what children need | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L197 | rule; decision 1 | REV |
| AK-A13 | «**Write the slides as if the teacher never opens the notes.** The teacher chooses whether to use the speaker script, and the two are not read together, so anything a later check, Do beat or task expects a child to produce must have been visible on a slide before it, not only spoken.» «Children must see the source, representation, working or explanation that the planned learning depends on.» «It may be revealed or produced live; the starting slide need not be a finished explanation. Notes support delivery and subject knowledge, and they may say the same thing more fully. If children genuinely need more visible material than fits, reform or split the teaching moment rather than hiding it in notes.» | every later check, Do beat or task; exceptions: it may be revealed or produced live, and notes may say the same thing more fully; the repair is to split, never to hide in notes | must | | `references/preferences.md` › Written Voice › Core rules · L63 | rule; shared (the Teach board); decision 1 | STAYS |
| AK-A14 | «A Year 4 PSHE quick check asked what Sophie's body uses energy for when she is sitting still; the answer, breathing, lived only in the script of the slide before, whose visible lines said no more than the vocabulary card (8 September 2026).» | illustrates A13 | | | `references/preferences.md` › Written Voice › Core rules · L63 | story, **not in the build log** | LOG (copy first) |
| AK-A15 | «The limit runs the other way too: a Practise brought forward because the lesson looks long, before the knowledge it runs on is taught, is a guessing task» | a content lesson's main Practise | must not | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L15. Copy: A16 | rule; shared (the rhythm, where the Practise sits) | STAYS; carried into PREF-WFU (decision 9) |
| AK-A16 | «judge it by readiness, not position: does the class hold, from the pairs before it, everything the work runs on» «A Practise placed early on knowledge not yet taught, or an early Practise followed by beats kept only because they were already written, is a purposeful design defect.» | reviewing a content lesson | check | | `references/design-review-route-checks.md` › Content-based · L13 | near-duplicate of A15 for the reviewer: adds a second defect (beats kept only because they were already written) and scopes the evidence to this lesson's pairs | STAYS |
| AK-A17 | «Watch for the parallel case that is parallel in name only. Toffees sucked on the way home and squash sipped all afternoon are the same science, and a Year 4 will still spend the first minute of the task talking about toffee; a difference the lesson has not taught (sticky against sipped) is a difference children cannot reason across, so it is friction rather than transfer.» | a launch's parallel case | must not | | `references/preferences.md` › Slide Philosophy › Lesson Designer visual-need boundary · L633 | rule; shared (the launch); its case is in the log | STAYS |
| AK-A18 | «a clever likeness in a comparison model that the taught facts cannot support: `but we're both waiting for someone to come` is an analogy the child would have to unpack, and `we both save the whole year up` asserts something about Christians the lesson never taught. A model comparison states a plain difference or likeness the lesson gave the child the means to state» | a model answer | must not | | `references/teacher-voice.md` › 8. Model answers and exemplars · L574 | rule; shared (voice, model answers) | STAYS |
| AK-A19 | «**Read the final task backwards as moves, not facts.** Each step of the final task that is a move (compare, explain a difference, justify a choice, weigh two reasons) names the beat where children first made that move with support, on the lesson's own material.» | the final task | check | test pins the heading | `references/preferences.md` › What a Lesson Is For · L164 | shared (the rhythm): a move the class never made is something children cannot yet use | STAYS |
| AK-A20 | «Trace a representative final performance backwards: which newly learned fact, distinction, relationship or action makes each part possible, where was it taught and used, and what did the next major stage need from it? Then read forwards to check those ingredients are available when needed.» «Merely naming the endpoints and then asking for a point without teaching the scale leaves the dependency missing.» | every lesson | check | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L220 | shared (the rhythm, links) | STAYS |
| AK-A21 | «Every distinct case children must do independently needs prior modelling or guidance; teaching one direction does not automatically prepare its reverse.» | the designer's completion pass | check | | `agents/lesson-designer.md` › One Completion Pass · L513 | shared (the rhythm) | STAYS |
| AK-A22 | «Walk the transitions with the teacher and child: what is now known, what remains visible or available, what they do next and how long that takes.» | the designer's completion pass | check | | `agents/lesson-designer.md` › One Completion Pass · L514 | shared (the rhythm, timing) | STAYS |
| AK-A23 | «The limit: a criterion, a definition or a reference genuinely needed to start does go first, and this is not an argument for withholding a tool until a child has struggled without it. The question is whether the class has met the thing the tool is for.» | ordering the lesson | must | vocabulary pins the first clause (VOC-E45) | `references/preferences.md` › What a Lesson Is For · L162 | shared (the rhythm; vocabulary pins part) | STAYS |
| AK-A24 | «Read `task-contrasts.md` → The contrasts once, when choosing the main task or a Do beat the lesson will rely on as evidence of an important understanding. It calibrates step 4 of `Settle the classroom experience before collecting content` across subjects: what a task actually requires a child to know, and where the simpler task is right.» | choosing the main task | must (read) | | `agents/lesson-designer.md` › Reference Files · L566 | pointer | STAYS |
| AK-A25 | «So where a sheet's later work moves into a form or a context the lesson never used, ask whether the lesson should have met it once first, as a practise or apply beat after the cycles» | a maths worksheet moving into a new form | check | | `references/subject-maths.md` › The worksheet's sections in maths · L83. Copy: A26 | rule; shared (worksheets): a response form children have not met is something they cannot yet use | STAYS |
| AK-A26 | «Where the sheet moves into a form the lesson never used, say whether the lesson should have met it once first rather than only flagging the sheet;» | reviewing a maths worksheet | check | | `agents/design-reviewer.md` › 5. Worksheet evidence · L261 | near-duplicate of A25 for the reviewer: says only "a form" (not a context) and adds "rather than only flagging the sheet" | STAYS |
| AK-A27 | «A representation new to the class needs the preparation that goes with it.» | a generated worksheet's representation | must | | `references/lesson-designer-components.md` › Generated worksheet · L61 | rule; shared (worksheets) | STAYS |
| AK-A28 | «Teach a thinking move where the material makes children need it: a brief cue can suffice for a familiar comparison; an unfamiliar inference may need an explicit model and guided attempt.» | a thinking move the task needs | default (the amount of teaching: may) | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L182. Copies: A29, A30 | shared (the rhythm): how much teaching a move needs depends on whether children already know it | STAYS |
| AK-A29 | «A brief cue may suffice for a familiar comparison; an unfamiliar evidence decision may need focused teaching of its own.» | a content Teach | may | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L23 | duplicate of A28 | STAYS |
| AK-A30 | «Give an unfamiliar thinking move enough explicit modelling and guided use to prepare the later task.» | history | must | | `references/subject-history.md` › What the lesson feels like to the child · L19 | near-duplicate of A28 at a stronger strength: an instruction ("Give ... enough explicit modelling") where A28 says "may need"; a fold must keep the must | STAYS |
| AK-A31 | «When the Your Turn will mix those cases, the child needs to have *seen each one worked* before meeting it alone, because a case modelled nowhere but appearing in independent practice is a case the child meets cold.» «Do not introduce an unmodelled case that changes the procedure.» «Reaching an unmodelled case means another example inside the My Turn when it teaches the same move, or a second cycle when the case is genuinely a different move» | a skill lesson with distinct cases | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L23 | near-duplicate of A21, stronger: "seen each one worked" where A21 says "modelling or guidance", a must not A21 lacks, and where the extra case goes; shared (the rhythm) | STAYS |
| AK-A32 | «**The final task claims no more than the evidence children studied.** When the lesson has taught that one child's account cannot speak for every child, the final task, its model answer and its acceptance keep to that: they describe what the accounts studied show and compare those accounts (`George's day was longer than Sarah's`), and a verdict about a whole job or all children (`servants were safer than miners`) needs evidence about that group the lesson actually gave.» | history: the final task, its model answer and its acceptance | must | test pins the heading | `references/subject-history.md` › What the lesson feels like to the child · L40. Copy: A33 | rule: with A33, the only places that apply A01 to the model answer and the acceptance, not only the task; decision 9 | SUBJ; carried into PREF-WFU (decision 9) |
| AK-A33 | «The group claim rests on what the lesson taught about the group, with the story as the example; an answer that generalises from the one story alone claims more than one story can show.» | an invented case standing for a group, any subject | must | test pins the second clause | `references/preferences.md` › Source and Scenario Integrity · L521 | near-duplicate of A32 for every subject | PREF-SSI (stays) |
| AK-A34 | «**A line the final task needs is teaching, always, and may never be moved to the script.**» | a Teach board trimmed to fit | must | test pins it | `references/preferences.md` › Pride Lessons › How much a Teach slide holds, calibrated on real boards · L776 | rule; shared (the Teach board); the strongest statement of decision 1's board side; its PSHE case is in the log | STAYS |
| AK-A35 | «Give reasoning or problem solving its own enabling teaching when it introduces a genuinely new decision, representation, reading demand or way of thinking. Do not create a second whole-class teaching act merely because a task has been labelled "problem solving".» | maths reasoning and problem solving; limit: not for a label alone | must | | `references/subject-maths.md` › The shape of a maths lesson · L17 | near-duplicate of A11's "a new reasoning demand needs preparation": adds a representation and a reading demand, and the limit | SUBJ; carried into PREF-WFU (decision 9) |
| AK-A36 | «A changed condition is the same strength when it stays inside the relationship that was taught: `We make the long wire even longer. What happens to the bulb now?` Adding a second cell brings in a second relationship (more cells, a brighter bulb), so it is a fair question only once that has been taught as well; it is not the same thinking with a new variable.» | the calibration the designer and reviewer read | check | | `references/task-contrasts.md` › Science: a prediction that the relationship decides · L25 | example of A03: a changed condition can smuggle in an untaught relationship | STAYS (calibration) |
| AK-A37 | «**When later work builds on what children produced, the class has the right version first.** Give the teacher the expected answer and the one correction that matters through the existing answer and `teacherInfo` route, so a class that sorted the deal wrongly does not spend the next task treating its own mistake as the history.» | later work built on what children produced | must | `teacherInfo`; test pins the heading | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L222. Copies: A38, A39, A40 | shared (the rhythm): what children hold later includes their own product, which may be wrong | STAYS |
| AK-A38 | «Where a later beat works on what children produced in an earlier one, the earlier unit's `answer` or `teacherInfo` gives the teacher the expected version and the one correction that matters, so a class's mistake is not what the next task builds on» | the designer's completion pass | check | test pins it | `agents/lesson-designer.md` › One Completion Pass, Then Done · L513 | duplicate of A37; shared (the rhythm) | STAYS |
| AK-A39 | «Where a later beat works on what children produced earlier, check the correctness handover» «its absence is a purposeful design defect when the later task depends on it» | every review | check | test pins it | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L200 | duplicate of A37 for the reviewer; shared (the rhythm) | STAYS |
| AK-A40 | «the teacher confirms the fault before anyone builds on it» | the calibration | | test pins it | `references/task-contrasts.md` › A short sequence: work that builds, and work that only looks connected · L77 | example of A37; shared (the rhythm) | STAYS |
| AK-A41 | «Test the cumulative route by working a representative final performance backwards to its taught ingredients, then forwards through their first use» | every lesson | check | | `agents/lesson-designer.md` › Before You Design Anything · L114 | duplicate of A20; shared (the rhythm) | STAYS |
| AK-A42 | «Trace a representative final performance backwards to the new learning each part needs, then read the sequence forwards from the child’s starting point» | every review | check | | `agents/design-reviewer.md` › 2. Route, modelling and independence · L166 | duplicate of A20 for the reviewer; shared (the rhythm) | STAYS |
| AK-A43 | «could a child who did this beat now do that step of the final task without being shown a further move?» | writing a beat's `unlocks` | check | `unlocks` | `agents/lesson-designer.md` › The Teach → Do Rhythm · L247 | duplicate of A19; shared (the rhythm) | STAYS |
| AK-A44 | «- Apply against learning actually taught;» | the reviewer's consistency sweep | check | | `agents/design-reviewer.md` › Cross-section consistency · L311 | rule (the reviewer's check on the ending) | REV |
| AK-A45 | «Where one does not, keep the prompt anchored to the knowledge, evidence and performance children actually have.» | a reasoning prompt in a subject with no subject file | must | | `references/reasoning-prompts.md` › Cross-subject use · L89 | near-duplicate of A01; shared (reasoning) | STAYS |
| AK-A46 | «Notes supply concrete spoken modelling and subject backup; they must not be the sole home of evidence children must read or a result they must inspect.» | every slide | must | | `references/preferences.md` › Slide Philosophy › Lesson Designer content boundaries · L539 | rule; shared (the Teach board); decision 1 (board side) | STAYS |
| AK-A47 | «Speaker notes provide fuller spoken explanation and backup for a teacher who needs it; they do not rescue missing essential meaning.» | every slide | must | | `references/preferences.md` › Slide Philosophy › Lesson Designer content boundaries · L535 | rule; shared (the Teach board); decision 1 (board side) | STAYS |
| AK-A48 | «The slide also carries enough concise, accurate visible information for children and a teacher who does not use the notes to understand the core idea.» | a content Teach slide | must | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L29 | duplicate of A47 for the content route; decision 1 (board side) | STAYS |
| AK-A49 | «every taught idea is intelligible through the visible content and planned teacher action.» «On a content Teach, use `explanation` for necessary visible meaning, without forcing every spoken reason into a panel» | every review | check | `explanation` | `agents/design-reviewer.md` › 4. Language, load and teacher usability · L237 | contradiction, decision 1: allows a spoken reason with no panel, where C04 (the same file) makes a script sentence with no counterpart on the board a finding | decision 1 |
| AK-A50 | «so the script is their only home: an Our Turn slide shows the example, the success criteria and the helper, and nothing the teacher only says» | an Our Turn's guiding questions | must | `speakerNotes.script` | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L75 | rule: the script is the designed home of the questions that guide the class; decision 1 (script side) | ROUTE |
| AK-A51 | «Read teacher scripts alongside prompts and support: hiding a reminder does not preserve a diagnostic decision if the script supplies it.» | the designer's completion pass | check | | `agents/lesson-designer.md` › One Completion Pass, Then Done · L512 | rule: the script counts as heard when it gives an answer away; decision 1 must keep this direction | LD (stays) |
| AK-A52 | «Read the spoken script too, because it can supply a decision that the printed support carefully withholds.» | checking support against a task | check | | `references/preferences.md` › Support, Checking and Release · L497 | duplicate of A51; decision 1 must keep this direction | STAYS |
| AK-A53 | «Nothing on the board is missing from the script, and nothing that teaches in the script is missing from the board.» | the Tudor Teach boards | | | `references/preferences.md` › Pride Lessons › What a Teach slide holds: the Tudor calibration · L796 | your example (the boards you chose); decision 1 (board side) | STAYS exactly |

## B. Supplying the missing context, connection or referent

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| AK-B01 | «For the pivotal teaching, find the connection a child would otherwise have to invent (why a family would choose hard, unpaid work for their child; why the sun's angle makes the Equator hot; what changes when the ones digit is 5) and supply it through the explanation, worked example, comparison, demonstration or evidence that makes it visible. A fact, a picture and a question on one board do not supply it merely because all three are present; equally, a short direct explanation may be all it needs, and a story, a picture or a harder question is never compulsory.» | the pivotal teaching | must | | `agents/lesson-designer.md` › Settle the classroom experience · L56 | rule | LD-SETTLE |
| AK-B02 | «Walk through the middle as carefully as the opening, from the child’s current understanding rather than the adult’s completed explanation. Before each new idea or question, identify what children have actually seen, heard or done that makes it intelligible. Supply a missing referent, meaning or connection before relying on it. A definition card, diagram label or mention in a script does not alone establish understanding.» «Keep necessary context; choose a simpler example when it removes a detour without losing learning.» | every new idea or question | must | vocabulary pins two sentences (VOC-H04, VOC-G08) | `agents/lesson-designer.md` › Settle the classroom experience · L58. Copies: B03 | rule; shared (vocabulary pins two sentences in place); "seen, heard or done" bears on decision 1 | LD-SETTLE (stays, pinned) |
| AK-B03 | «At each transition, identify the actual earlier example, explanation or action that supplies the context the next part assumes. A named category or fact appearing on a slide is not by itself evidence that children can understand and use it.» | every review | check | | `agents/design-reviewer.md` › 2. Route, modelling and independence · L166 | not a duplicate of B02: B02 discounts a mention on a card, label or script, B03 a mention on the slide; together, neither a script mention nor a board mention is enough alone, so a fold keeps both clauses (decision 1) | REV |
| AK-B04 | «**A case arrives with the context that makes it make sense.**» «The cost is not confusion about the task, which is answerable either way; it is that the child has nothing to attach it to, so the answer is a guess at a diagram rather than a thought about a tooth. One sentence, before the case, in the words the class hears, is usually the whole repair: teeth chip when we bite something too hard, and when that happens the covering comes off in one spot. The same applies to a scenario, an invented person or a number problem's situation. The test: could a child say why they are being shown this, before they are asked the question about it?» | every case, scenario, invented person or number problem | must (the repair: "usually" one sentence, "in the words the class hears"; decision 1) | | `references/preferences.md` › Slide Philosophy › Lesson Designer content boundaries · L547. Copies: B06, B07 | rule; decision 4 proposes the name sentence beside it | PREF-SP |
| AK-B05 | «a Year 4 science deck taught enamel, dentine and pulp and then showed a chipped tooth and asked which layer was uncovered, having never said that teeth chip, why they chip, or that this happens to real people.» | illustrates B04 | | | `references/preferences.md` › Slide Philosophy › Lesson Designer content boundaries · L547 | example from a real deck (undated; in the log) | stays as a plain example |
| AK-B06 | «**when the task is about a particular case, that line is the case and the question, not a recap of the teaching**» «So the case comes first, on a short slide of its own before the model, carrying who it is, what happened and what they are being asked - and the task slide keeps the case as well, because that is the board they write from.» | a launch whose task is about one case | must | `launch` | `references/preferences.md` › Slide Philosophy › Lesson Designer visual-need boundary · L627 | near-duplicate of B04 for a launch; shared (the launch) | STAYS |
| AK-B07 | «when it sets a case that slide carries who it is, what happened and what they are being asked - the model means nothing to a child with no question in mind.» | the slide designer, a launch | must | `launch` | `references/slide-composition-playbook.md` › Surface execution cues › Teaching and pupil action · L364 | duplicate of B06 for the slide designer | SD |
| AK-B08 | «Do not assume children can interpret an isolated specimen, unfamiliar source or diagram merely because its features are clear. Name what children must recognise before asking them to compare or infer, and attach the useful reference to every task that still depends on it. Withhold support only where the task explicitly assesses the knowledge it would reveal. Familiar objects and tasks may need no extra context.» | every representation, source or specimen; exceptions: familiar objects and tasks, and support withheld where the task assesses that knowledge | must | | `agents/lesson-designer.md` › Teaching Representations · L213. Copy: B09 | rule | LD (stays; the only place it is said to the designer) |
| AK-B09 | «whether a child can interpret the intended teaching evidence;» | each planned photograph and load-bearing representation | check | | `agents/design-reviewer.md` › 6. Source, scenario and visual meaning · L290 | duplicate of B08 for the reviewer | REV |
| AK-B10 | «Keep the context needed for this step.» | each content Teach | must | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L21 | duplicate of B02 | ROUTE |
| AK-B11 | «**Choose the opening that makes the first learning accessible.** Begin with observation when the material is intelligible enough for children to notice something useful for the explanation that follows. Teach a necessary term, context or idea first when that will help them understand or attend to the material. Direct teaching does not need an exception justified by observation being impossible.» | a content lesson's opening | default | the next sentence is vocabulary's (VOC-E28) | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L25 | rule | ROUTE |
| AK-B12 | «What the class already has may open the route when the takeaway needs it (`Every home needs food, a fire and a roof, every single day.` before the Tudor sentence); it is the way in, not a fifth part.» | a Teach board | may | `explanation` | `references/teaching-sequence-content-based.md` › Output Format Block · L114. Copies: B13, B14, B37 | shared (the Teach board) | STAYS |
| AK-B13 | «Teaching is deliberately moving a child's thinking from where it is to something they can do without the teacher: connecting to what they already have, directing their attention to the thing that matters, making the relationship visible, giving them part of the thinking to do, and checking what they took from it.» «Neither carries teaching the other lacks» | what teaching is | | | `references/preferences.md` › Slide Philosophy › Lesson Designer content boundaries · L531 | shared (the Teach board) | STAYS |
| AK-B14 | «The route a Teach board carries runs from what the class already has, through the new thing, to the look at the picture and the sentence that lands» | the slide designer splitting a Teach beat | | | `references/slide-composition-playbook.md` › 6. Space-pressure order · L192 | shared (the Teach board) | STAYS |
| AK-B15 | «**Orientation is not automatically a Teach chunk.** Give children the context needed to enter the first example: what the topic is, where or when it belongs, or why the question arises.» «When the groundwork is itself new learning children must use, teach and process it as a real chunk.» | the lesson's opening | must (give the context) | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L188. Copies: B16, B17, B18 | shared (the rhythm owns orientation) | STAYS |
| AK-B16 | «**Orient children enough to enter the first example.**» «New prerequisite learning that children must use still earns teaching and processing.» «a brief separate presentation moment is allowed when it avoids overloading the first Teach, without inventing a Do for scene-setting» | a content lesson | must | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L27 | near-duplicate of B15: its "without inventing a Do for scene-setting" is a prohibition where B15 gives a permission; shared (the rhythm) | STAYS |
| AK-B17 | «When honest answer is beat supplies groundwork children will use (a prerequisite fact the first idea rests on), keep and make link part of teaching: say why matters for today's real question, have beat land back on objective. When it is orientation children will not use (what the subject is, why we are here, scene-setting), it is not automatically a chunk and needs no manufactured Do.» | every beat | must | | `agents/lesson-designer.md` › The Teach → Do Rhythm · L255 | near-duplicate of B15: adds the groundwork case (a prerequisite fact the first idea rests on); shared (the rhythm) | STAYS |
| AK-B18 | «keep only the orientation needed to enter the example, using a brief separate presentation moment if needed, and remove a manufactured Do» | reviewing a Teach→Do pair nothing uses | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L200 | near-duplicate of B15, the other way: a ceiling and a removal ("keep only", "remove a manufactured Do") where B15 is a floor; shared (the rhythm) | STAYS |
| AK-B19 | «The limit is what a child can honestly produce, and it is a hard one. This works when the set comes from being a person rather than from knowing the topic: needs, uses, reasons, the jobs a familiar thing does. It fails when the set is the knowledge itself, and then asking for it is guessing dressed as elicitation, with the added cost that a wrong list is what the class will remember: no child generates the four layers of a rainforest, the parts of a river or what a Tudor apprenticeship record holds. Test it by answering your own question as a nine-year-old who has not met the topic. If you cannot, teach the set.» | asking the class to build a set before it is taught | must (hard limit) | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L214 | rule; shared (the rhythm) | STAYS |
| AK-B20 | «The groups of a sort are the other half, and a child has to understand them before any card can be placed. Say the difference between the two groups in one plain sentence a nine-year-old would follow.» | every sort | must | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L210 | shared (Do beats, the rhythm); the reviewer's copy is in G03 | STAYS |
| AK-B21 | «**A generative task names the category it is generating from.** "Choose a job" asks a Year 4 to invent an abstraction, and a real class answered "Fireman", because a job is a thing people do until you say otherwise. Name the category in the child's own words and show one» | a generative task | must | `firstRowWorked` | `agents/lesson-designer.md` › Worksheet · L367 | rule, with a real case (in the log) | LD (stays) |
| AK-B22 | «**Tell children what to do, never what not to do with something they have never met.**» «A prohibition earns a child-facing place only when children already know and might actually reach for the thing being ruled out.» | every child-facing instruction; exception: children already know the thing | must | `teacherInfo` | `agents/lesson-designer.md` › Lesson Components · L168 | rule | LD (stays) |
| AK-B23 | «Every picture on the slide needs a visible role.» «The reason is usually already written in the speaker notes; a teacher who has not read them meets an unexplained object, and a child wonders why it is there. A picture that earns no visible role comes off the slide.» | the slide designer | must | | `references/slide-composition-playbook.md` › 12. Sets, banks, categories and captions · L318 | rule | SD |
| AK-B24 | «Describing the absent object makes children reconstruct it before they can compare; sufficient answer facts do not remove that burden.» «A script saying “look at” something needs that thing available in the resource or explicitly available in the classroom.» | foundation-subject Teach and task slides | must | | `references/preferences.md` › Slide Philosophy › Lesson Designer visual-need boundary · L625. Copies: B25, B26 | rule; shared (visual need) | STAYS |
| AK-B25 | «For an object comparison, children need to encounter both objects, through suitable images, diagrams or the real things, when their appearance or use makes the idea understandable; an accurate written description of the second object makes the child construct it before comparing.» | an object comparison | must | | `agents/lesson-designer.md` › Settle the classroom experience · L56 | duplicate of B24 | STAYS |
| AK-B26 | «An object already available in the classroom counts; a statement that children know what it looks like is not a plan to show it.» «Trace “look at”, “compare these” and equivalent script references to the actual available object or representation.» | reviewing a comparison | check | | `agents/design-reviewer.md` › 6. Source, scenario and visual meaning · L279 | near-duplicate of B24: adds "a statement that children know what it looks like is not a plan" | REV |
| AK-B27 | «**Show the structure a task points at, not only its name.**» «"Look down your conductor column — what is the same about all of them?" reads as a reference with its referent missing when no column is on screen» | a beat that records into or reads off a structure | must | | `references/preferences.md` › Slide Philosophy › Lesson Designer content boundaries · L549 | rule | PREF-SP |
| AK-B28 | «Keep pronouns, comparisons and instructions attached to their visible referents. A reference on a previous slide is not accessible during independent work unless another usable copy is actually available.» | the slide designer splitting a beat | must | | `references/slide-composition-playbook.md` › 6. Space-pressure order · L194 | rule | SD |
| AK-B29 | «Whenever a claim can be weighed against something children could look at, put that thing on the slide beside the speakers.» «First, judging becomes reasoning from evidence rather than recall of what the teacher said a minute ago.» | a claim children judge | must | | `references/slide-speech-and-characters.md` › Show the real referent the claim is judged against · L67. Copies: B30, B31 | rule | SD |
| AK-B30 | «Whenever a claim can be weighed against something children can look at, show that real referent beside the speaker: the photograph, map, chart, diagram, table, text or result set already authorised by the lesson design. Without it, the task becomes recall of what the teacher said rather than reasoning from evidence.» | as B29 | must | | `references/slide-composition-playbook.md` › 11. Claims and speaking characters need the thing being judged · L288 | duplicate of B29 | SD |
| AK-B31 | «- which units contain voices or claims that need a real referent;» | reading the lesson as a sequence | | | `agents/slide-designer.md` › 1. Read the lesson as a sequence · L133 | pointer | SD |
| AK-B32 | «**A voiced claim stands alone.** A speech bubble is read apart from the stimulus that sets it up, so the claim names its subject (`This kettle...`, `The toothbrush isn't...`) rather than opening with a bare pronoun whose referent lives in another box.» | a speech bubble | must | | `references/preferences.md` › Written Voice › Core rules · L71 | rule; shared (voice) | STAYS |
| AK-B33 | «Wherever the person IS named, name them every time the lesson speaks about them, including in the question and the answer» «A pronoun in the question makes a child look back up to work out who is being asked about, and on a board where two people have spoken it can be genuinely ambiguous. `she` and `he` belong inside the story, where the name has just been said.» | a named person in a question or answer | must | | `references/preferences.md` › Source and Scenario Integrity · L521 | rule, with a dated case (Isla, in the log); shared (invented cases) | STAYS |
| AK-B34 | «A class, a family, a team or a school that the lesson returns to is a character children picture or a placeholder they cannot, and `a class` is the group's version of `someone`: a Year 4 PSHE lesson said `a class` ten times across its beats, and the children were asked to advise somebody who was never introduced (21 September 2026).» | an invented group | must | `CHARACTER_NAMES` | `agents/lesson-designer.md` › Before You Design Anything · L125 | shared (invented people); story in the log | STAYS |
| AK-B35 | «Use a familiar comparison only when these children can reasonably understand the link. A strange analogy creates another concept to decode instead of removing one.» | an example or analogy | must | | `references/preferences.md` › Written Voice › Core rules · L79 | rule; shared (voice) | STAYS |
| AK-B36 | «**A suitable `fallbackEmoji` is a picture of the thing, or a gesture or object the child already uses with that meaning away from a screen.**» «The same test rules out an arrow standing in for an idea, a tick standing in for a value, and any symbol whose meaning comes from software rather than from life.» | an optional picture's emoji | must | `fallbackEmoji` | `references/context-pictures.md` › Request shape · L554 | rule; shared (pictures; vocabulary's VOC-D19 says the same of a statement) | STAYS |
| AK-B37 | «The Teach boards of the Tudor lesson the user chose on 14 September 2026 (`preferences.md` → Pride Lessons, `What a Teach slide holds`) are the same order inside one beat: what the class already has, the new thing, the look at the picture, the sentence that lands.» | history Teach boards | | vocabulary pins the sentence before it (VOC-E50) | `references/subject-history.md` › What the lesson feels like to the child · L32 | your example (what your Tudor boards teach in general); shared (the Teach board) | STAYS exactly |
| AK-B38 | «**`established` sets the case, not a recap.** When the task is about a particular case, this line is who it is, what happened and what they are being asked» | a content Practise's launch | must | `launch.established` | `references/teaching-sequence-content-based.md` › Output Format Block · L175 | duplicate of B06 for the content route | STAYS |
| AK-B39 | «**`established` sets the case, not a recap.** When the task is about a particular case, this line is who it is, what happened and what they are being asked» | a task-centred launch | must | `launch.established` | `references/teaching-sequence-task-centred.md` › Output Format Block · L122 | duplicate of B06 for the task-centred route | STAYS |
| AK-B40 | «Use a clear bridge when a word or idea is unfamiliar: `which means...`, `for example...`, `it's like when...`, a concrete comparison, a picture, or a brief parenthetical explanation may all help.» | every string | must | vocabulary pins it (VOC-J01) | `references/preferences.md` › Written Voice › Core rules · L53 | shared (vocabulary; "or idea" reaches past words into this topic); decision 4 | STAYS (vocabulary) |
| AK-B41 | «**A word the teaching leans on is taught, or the teacher ends up teaching it instead.**» «This one runs the other way: read the finished teaching and find the words a child has to already hold for a sentence to land.» | the finished teaching | must | vocabulary pins it (VOC-H01) | `references/preferences.md` › Vocabulary · L371 | shared (vocabulary owns it); the rule that catches ordinary words such as `government`; decision 8 | STAYS (vocabulary) |
| AK-B42 | «If those sentences are background explanation whose causal relationship children are meant to be told, connect the relationship explicitly. If they are the evidence/stimulus from which children are meant to infer the effect of reduced fish numbers, do **not** add the inference itself.» | calibration | | | `references/preferences.md` › Written Voice › Calibration examples · L111 | example: the limit on supplying a missing connection when finding it is the task | STAYS |
| AK-B43 | «one line per unit missing essential visible evidence, context or a usable state for its planned live action, naming the unit. Report an upstream content defect to its owner; do not repair it by inventing teaching.» | the slide designer's report | must | | `agents/slide-designer.md` › Reporting · L664 | rule: the slide designer's only instruction when context is missing | SD |
| AK-B44 | «What lives in the notes here is the teacher's *framing* of the task — the orientation, the why-it-matters, the longer description of what's ahead.» «The line to hold is framing-in-notes, task-on-slide» | a task-framing slide | may (framing in the notes) | | `references/preferences.md` › Slide Philosophy › Lesson Designer visual-need boundary · L625 | rule; decision 1 (script side): orientation in the notes beside B15's "context needed to enter the first example" | STAYS |

## C. Named people, places, organisations and events

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| AK-C01 | «Named people, places and events are content the lesson teaches and children need, but they belong in the teaching rather than on cards» «In the teaching means explained where each first appears on the board, in a clause a child can hold (`Queen Elizabeth I, who ruled England in Tudor times`, `the River Thames, which runs through London`), unless an earlier lesson the brief names taught it. A name nothing explains is a word the class cannot use, and the limit on vocabulary cards is no reason to leave it unexplained.» | history, as written; exception: an earlier lesson the brief names taught it | must | vocabulary pins it (VOC-M06); a test pins "In the teaching means explained where each first appears on the board" | `references/subject-history.md` › Vocabulary in history · L189. Copies: K01 | shared (vocabulary owns it; pinned); decisions 2, 3, 4 | STAYS (vocabulary) |
| AK-C02 | «Proper nouns and named features (Manaus, Tropic of Capricorn, the Amazon) are content the lesson teaches and children need, but they belong in the teaching rather than on vocabulary cards, because knowing them makes a child knowledgeable about one place rather than a stronger geographical thinker.» | geography | must | vocabulary pins it (VOC-M01) | `references/subject-geography.md` › Vocabulary in geography · L114 | shared (vocabulary); unlike C01 it does not say where or how a name is explained; decision 4 | STAYS (vocabulary) |
| AK-C03 | «because a designer reading the general rule will let a proper noun through» | writing a new subject file | | | `skills/make-subject-file/SKILL.md` › Stage 6: Draft the file · L203 | maintainer; shared (vocabulary, VOC-M15) | STAYS |
| AK-C04 | «If nothing later uses it (a source's limits in a lesson about what changed, a side-fact about who banned what), it is a detour, and the repair takes it out of the script and the lesson rather than promoting it to the board: a detour put on the board costs the class a slide of new people and words, and a Do to check them, for nothing the lesson needs.» «a sentence that teaches in the script and has no counterpart on the board is the finding, named by beat and sentence» | a Teach script sentence with no counterpart on the board | check (choose the repair) | test pins the repair clause | `agents/design-reviewer.md` › Material-defect boundary · L44 | rule; shared (the Teach board): the cost it names is new names and words; its script-without-board finding pulls against A49 (decision 1) | REV |

## D. Sources and where they came from

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| AK-D01 | «**A real source needs an accessible route before a child can think with it.** Select the smallest coherent source set the historical thinking requires. Select for a clear contribution to this enquiry, not authenticity or variety alone: a genuine record may still be a poor teaching choice if its link to the people or experience being studied needs substantial extra explanation. So list what a teacher who is new to the period would have to explain before the source makes sense to this class (who wrote it, what kind of document it is, the words and customs in it, why it was written) beside what the source then teaches that the next step of the lesson uses. When the first list is the longer, choose a clearer source or tell the knowledge plainly.» | history, as written; the designer's general rule (D04) sends every subject here | check | test pins "When the first list is the longer, choose a clearer source or tell the knowledge plainly" | `references/subject-history.md` › What the board and the page hold › Optional decoration on sensitive history · L165. Copies: D04 | rule; decision 5 | PREF-WFU (decision 5), history keeps D02 |
| AK-D02 | «A 1590 government order banning plays on two days cost a Year 4 class a queen, a government, an order, bear-baiting and the difference between a rule and what people did, and taught one sentence nothing later used.» | illustrates D01 | | | `references/subject-history.md` › What the board and the page hold › Optional decoration on sensitive history · L165 | example from the leisure lesson (undated; partly in the log, whose 4.2.283 entry names Elizabeth I, a government and an order) | stays as a plain example in history |
| AK-D03 | «Establish that link through reliable context or choose a clearer source. An unknown detail is acceptable when the conclusion does not depend on it; acknowledging uncertainty does not supply a missing link that the conclusion does need. Preserve the evidence children use, shorten it where appropriate and gloss difficult words in context. Identify adaptations honestly.» | history sources | must | | `references/subject-history.md` › What the board and the page hold › Optional decoration on sensitive history · L165 | rule | SUBJ |
| AK-D04 | «A source, story or clip the plan names is part of its activity, not its coverage: coverage is what the objective asks children to learn, so replace a named source with a clearer one, or leave it out, whenever it would cost the class more explaining than it teaches (`subject-history.md` → `A real source needs an accessible route`).» | a source, story or clip a supplied plan names, in any subject | must | test pins the first clause | `agents/lesson-designer.md` › Your Role as Decision-Maker · L46 | rule, and a pointer to a file only history lessons read; decision 5 | LD (stays), pointer to the new home |
| AK-D05 | «Identify sources honestly, in words the class already has: `This is what the Queen's order said, in simpler words`, `An artist drew this recently, to show what it might have looked like`. A label in a historian's words (`modern summary`, `modern reconstruction`, an organisation's name as the heading of a card) is honest to an adult and means nothing to a Year 4 child, who now has one more thing on the board to ask about; the exact provenance goes in `teacherInfo`.» | history sources | must | `teacherInfo`; test pins "Identify sources honestly, in words the class already has" | `references/subject-history.md` › What the lesson feels like to the child · L40. Copies: D06, D11, D12, K01 | rule; decision 7 | SUBJ |
| AK-D06 | «Say it once: a set of reconstruction pictures is named as reconstructions at the first one, or in the script, and not captioned again under every return, because each caption takes height from the picture (`slide-composition-playbook.md` → Sets, banks, categories and captions); a Teach script's `Caption the picture ...` note is for its first appearance. Put production provenance and links in teacher-facing fields unless children need them to evaluate the source. Never dress invented classroom material as a historical source.» | history sources | must | a test pins "Say it once: a set of reconstruction pictures" | `references/subject-history.md` › What the lesson feels like to the child · L40 | contradiction, decision 7 ("named as reconstructions" beside D05's "means nothing to a Year 4 child") | decision 7 |
| AK-D07 | «**A made-up child is labelled as made up where children read the story.** A real account keeps its name, age, date and `(adapted)`; an invented or composite child is introduced as what it is, once, at its first appearance (`A made-up example, based on real accounts from the time:`), and is never given the name, age and year line that marks real testimony.» | history, an invented case beside real accounts | must | test pins the heading | `references/subject-history.md` › What the lesson feels like to the child · L40 | rule | SUBJ |
| AK-D08 | «A Year 4 lesson on Victorian working conditions (16 September 2026) set Sarah Gooder's own 1842 words beside George, an invented servant boy, and Sam, an invented bird scarer, told in the same plain voice with nothing saying which was evidence and which was an example.» | illustrates D07 | | | `references/subject-history.md` › What the lesson feels like to the child · L40 | story, **not in the build log** | LOG (copy first) |
| AK-D09 | «Prepare children for any distinction between advice, depiction and records of actual life that their task depends on.» | history sources | must | | `references/subject-history.md` › What the lesson feels like to the child · L40 | rule | SUBJ |
| AK-D10 | «The original document sits small beside it, named as the real thing.» | history, step 6 of your sketch | | | `references/subject-history.md` › What the lesson feels like to the child · L28 | your example (the Victorian schooling sketch) | STAYS exactly |
| AK-D11 | «Captions identify what an image cannot say on its own: a place, time, identity or technical name. Do not caption the obvious.» | the slide designer | must | | `references/slide-composition-playbook.md` › 12. Sets, banks, categories and captions · L314 | rule; decision 7 ("technical name" in a caption) | SD |
| AK-D12 | «and a caption that must be honest about what a picture is (a reconstruction, a modern photograph of an old place) is said once, at the picture's first appearance or in the script, not reprinted beneath each return. The limit is a caption that carries something a child needs and nothing else on the slide says: a source's date and maker, a place's name, which of two pictures is which.» | the slide designer | must | | `references/slide-composition-playbook.md` › 12. Sets, banks, categories and captions · L316 | near-duplicate of D06 (the caption half): adds the limit that a caption carrying a date, a maker, a place or which picture is which stays; decision 7 must keep it | SD |
| AK-D13 | «A caption may identify the source briefly; it must not be the only place where learning-critical evidence appears.» | a content Teach slide showing a source | may; must not (the caption as the only place for learning-critical evidence) | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L29 | rule; decision 7 | ROUTE |
| AK-D14 | «Locate each source clearly in time and place so the comparison remains intelligible.» «A thematic comparison may move between periods; chronological order and a dependency between every adjacent source are not requirements.» | history sources; limit: a thematic comparison may move between periods, and chronological order is not required | must | | `references/subject-history.md` › What the lesson feels like to the child · L34 | rule (also time and place, group H) | SUBJ |
| AK-D15 | «Choose headings that children understand and that help them answer this enquiry using the available evidence.» «Check that children need taught context and source-specific details, rather than filling generic boxes or copying a conclusion.» | a history source frame | must | | `references/subject-history.md` › How a history lesson goes shallow while staying accurate · L109 | rule | SUBJ |
| AK-D16 | «What a source cannot tell us is one such thing, and in Years 3 and 4 it is met the way step 5 of the sketch above meets it: once, concretely, about a source the class already understands, when the lesson's question turns on it.» | a source's limits, Years 3 and 4 | must | | `references/subject-history.md` › How a history lesson goes shallow while staying accurate · L107 | rule; shared (history thinking) | SUBJ |
| AK-D17 | «Write the adapted extract yourself, in the child's reading range, as the unit's `teachingText` (or the worksheet's `stimulus`), and name the original as the picture beside it.» | an old document children read | must | `teachingText`, `stimulus` | `references/subject-history.md` › What the board and the page hold › Optional decoration on sensitive history · L167 | rule | SUBJ |
| AK-D18 | «Teach a religious story with its tradition, source, context, authority and meaning where those matter to the objective.» | RE | must | | `references/subject-re.md` › Keep religious stories inside their meaning · L13 | rule | SUBJ |
| AK-D19 | «And a well-told story is one interpretation delivered as settled fact, which is the opposite of what the subject claims about itself, so a story is worth a sentence somewhere saying how we know any of it.» | history told as a story | default | | `references/subject-history.md` › Which move routes to which structure · L87 | rule (a story's provenance) | SUBJ |
| AK-D20 | «Captions identify what an image cannot say on its own: a specific place, time, identity or technical name. Do not caption the obvious, and do not hide task-critical content in small italic caption text.» | the slide designer | must | | `agents/slide-designer.md` › Required image composition · L323 | near-duplicate of D11: adds "specific" and "do not hide task-critical content"; decision 7 | SD |

## E. Knowledge before judgement, and what each route needs children to hold first

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| AK-E01 | «What they cannot do is make a real historical judgement before they have been taught the context that makes the judgement possible.» «**So this is a check on the design rather than advice.** Every beat that asks children to infer, judge, evaluate or explain names where the knowledge it runs on was taught: earlier in this lesson, or in a named earlier lesson of the enquiry. A beat that cannot point at either is a guessing beat and needs the teaching putting in front of it.» | history, every beat that asks for an inference, judgement or explanation | check (per beat) | | `references/subject-history.md` › Knowledge before judgement, inside the lesson · L95. Copies: E06, E07, E10, E11 | rule; decisions 2 and 6 | PREF-WFU (decision 6), history keeps its example |
| AK-E02 | «Children can speculate from their own world at the start of a lesson, and they should.» «Keep it short, four or five minutes, because the recorded failure of this shape is guessing consuming the lesson and leaving no time for the period.» | the start of a history lesson | may (with a limit) | | `references/subject-history.md` › Knowledge before judgement, inside the lesson · L93 | rule (the permitted exception to E01) | SUBJ |
| AK-E03 | «A child reaches it only when they have been taught what those people believed and what their circumstances were, so the explanation runs through the past's own reasons rather than ours. A lesson that asks *why did the Vikings raid* before teaching what a Viking family needed from a winter is asking children to guess, and what they guess is that the Vikings were nasty.» | history, explaining why people acted | must | | `references/subject-history.md` › What children do when it is really history · L50 | rule with its example | SUBJ |
| AK-E04 | «What history does not tolerate is doing without telling.» | history | must | | `references/subject-history.md` › Which move routes to which structure · L83 | rule | SUBJ |
| AK-E05 | «The failure this guards against is a history lesson cut to a maths shape, where a five-minute input leaves children twenty minutes of activity built on knowledge they were never given.» | history | | | `references/subject-history.md` › Which move routes to which structure · L85 | rule (its reason) | SUBJ |
| AK-E06 | «The two ways it fails are being a topic heading with a question mark on the end, and being unanswerable because the unit never taught the knowledge it runs on.» | a history enquiry question | must | | `references/subject-history.md` › The lesson is a movement in a longer argument · L219 | rule | SUBJ |
| AK-E07 | «Teach enough accurate knowledge about the religion or worldview before asking children to make a reflection, comparison or judgement that depends on it. Uninformed opinion is not the intended outcome.» | RE | must | | `references/subject-re.md` › Teach knowledge before dependent judgement · L7 | near-duplicate of E01 for RE, without the per-beat check | SUBJ |
| AK-E08 | «Teach necessary factual/legal/anatomical/statutory/safeguarding directly before judgement depending on it. If substantial new knowledge must be taught, use Content-based.» | choosing the discussion route | must | the sentence before it is vocabulary's (VOC-E33) | `references/lesson-designer-components.md` › Dialogic route · L15. Copies: E09, E10, E11 | rule | STAYS |
| AK-E09 | «A small factual or vocabulary input may come first when children need it to reason sensibly. If substantial factual teaching is required, use Content-based teaching.» | the discussion route | may | vocabulary pins it (VOC-E31) | `references/teaching-sequence-dialogic.md` › Teaching Sequence Specification · L11 | near-duplicate of E08 ("may" where E08 says "teach directly"); shared (vocabulary pins it) | STAYS |
| AK-E10 | «Use **Dialogic** only when the Science objective genuinely involves an open judgement with several defensible positions, after the necessary scientific knowledge has been taught.» | science | must | | `references/subject-science.md` › Use the final route system · L11 | duplicate of E08 | SUBJ |
| AK-E11 | «For Dialogic lessons, check that pupils receive knowledge before judgement, the question permits several defensible positions, harmful or false claims are corrected, and synthesis does not invent class views or force one predetermined answer.» | reviewing a discussion lesson | check | | `references/design-review-route-checks.md` › Dialogic · L17 | duplicate of E08 for the reviewer | STAYS |
| AK-E12 | «Three conditions: genuinely contested/interpretive (multiple defensible positions), children have stake/anchor (lived experience, accessible scenarios, or prior content with substance), teacher scaffolds positions and surfaces multiple perspectives, not fixed answer.» | choosing the discussion route | must | | `references/lesson-designer-components.md` › Dialogic route · L11 | rule | STAYS |
| AK-E13 | «**Discovery:** Genuine route when observing/investigating phenomenon is best way to teach objective. All three must hold: enough prerequisite, phenomenon safe/dependable/revealing, explicit explanation follows securing why.» | choosing Discovery | must | | `agents/lesson-designer.md` › Structure Decision · L144. Copies: E14, E17, E18, E19 | rule | LD (stays) |
| AK-E14 | «1. Children have enough prerequisite knowledge to investigate productively.» «Judge those conditions from the actual objective, children’s prerequisites and phenomenon.» | a Discovery lesson | must | | `references/teaching-sequence-discovery.md` › Route conditions · L11 | duplicate of E13 | ROUTE |
| AK-E15 | «Make the focused question, phenomenon and relevant prior knowledge clear. Give children enough information to know what they are observing, comparing or changing without revealing the finding they are meant to reach.» | a Discovery lesson's opening | must | | `references/teaching-sequence-discovery.md` › Orient to the question · L21 | rule | ROUTE |
| AK-E16 | «The practice must not depend on discovering another untaught idea.» | a Discovery lesson's practice | must not | | `references/teaching-sequence-discovery.md` › Use the learning · L41 | rule | ROUTE |
| AK-E17 | «"prerequisites": "what children already need to know",» | recording a Discovery question | mechanics (code: exact keys) | `prerequisites` | `references/teaching-sequence-discovery.md` › Output Format Block · L62 | mechanics | ROUTE |
| AK-E18 | «**Use when.** Discovery is the best route after judging the objective, children's prerequisite knowledge and a safe, dependable phenomenon.» «If productive Discovery still looks doubtful after considering the prerequisites, phenomenon and objective, teach the learning directly.» | choosing Discovery | must | the designer's structure menu prints this paragraph; a test pins "safe, dependable phenomenon" | `references/evidence-synthesis.md` › Discovery / Inquiry · L220 | duplicate of E13 | STAYS |
| AK-E19 | «For Discovery lessons, check that exploration is safe, bounded and dependable, pupils have the needed prerequisites, the result becomes visible, and explicit explanation follows.» | reviewing a Discovery lesson | check | | `references/design-review-route-checks.md` › Discovery · L21 | duplicate of E13 for the reviewer | STAYS |
| AK-E20 | «Use **Discovery** when children have the prerequisites, the phenomenon is safe and dependable, and observing or investigating before the explanation is the best route.» | science | must | | `references/subject-science.md` › Use the final route system · L10 | duplicate of E13 | SUBJ |
| AK-E21 | «Children apply knowledge/skills largely already held, enabling input only if genuinely needed, substantial doing time protected, finished in form completing task's purpose.» | choosing Task-Centred | must | | `references/lesson-designer-components.md` › Task-Centred route · L19 | rule | STAYS |
| AK-E22 | «**Writing lesson turns on whether form already child's.** "Produce extended writing" is task-centred only when child already commands form and today is carrying out piece.» | a writing lesson | must | | `agents/lesson-designer.md` › Structure Decision · L150 | rule | LD (stays) |
| AK-E23 | «the investigation brief is the child's prerequisite — a prediction about an undescribed investigation is a guess, not reasoning, so the brief that enables the prediction belongs on the slide alongside the prediction prompt, not in the teacher's script.» | a Task-Centred prediction | must | | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L15 | rule | ROUTE |
| AK-E24 | «Choose the best enabling input for this lesson: a model, prepared example, flawed example, physical demonstration, short warm-up, guided move or no extra input when children already have what they need. If children already have what they need, teach nothing and move to planning.» | a Task-Centred lesson | must | | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L17 | rule (the other direction: do not teach what they already hold) | ROUTE |
| AK-E25 | «When children already have what they need, omit the `teach-needed` source unit entirely.» | recording a Task-Centred lesson | mechanics | `teach-needed` | `references/teaching-sequence-task-centred.md` › Output Format Block · L76 | mechanics | ROUTE |
| AK-E26 | «The best move depends on what the children already hold and what the lesson is *for*» «**Nothing — straight to the doing** — when pupils already hold the schema (forcing a model now triggers the expertise-reversal effect below).» «If pupils already know it, stop modelling — move on.» | choosing how to ready children | default | | `references/evidence-synthesis.md` › 2. Teaching / Modelling · L52 | shared (modelling); the other direction | STAYS |
| AK-E27 | «Enabling input can be narrated model, worked example to study, flawed example to critique, guided practice, concrete/embodied experience physically enacted, short warm-up, or nothing if already hold schema.» | choosing how to ready children | may | | `agents/lesson-designer.md` › Subject Discipline · L285 | shared (modelling); duplicate of E26 | STAYS |
| AK-E28 | «In a knowledge subject the central gap is usually knowledge children do not yet hold, and the wrong rule is met once, at the point where that knowledge makes it visibly wrong, then retested at the end; the subject file says how.» | naming the sticking point | default | | `agents/lesson-designer.md` › Before You Design Anything · L119 | shared (misconceptions) | STAYS |
| AK-E29 | «**Writing as somebody from the past.** A diary entry as a Roman soldier is not history. The child does not know what he ate, what his children were called or where he came from, so they write themselves in a costume and the lesson evidences imagination.» «The limit is that talking as somebody from the past is fine as a way into thinking about their reasons, in the moment, aloud. It is putting it on the page as the lesson's outcome that turns it into fiction with a date on it.» | history, a written outcome; exception: talking as somebody from the past, aloud, as a way into their reasons | must not | | `references/subject-history.md` › How a history lesson goes shallow while staying accurate · L105 | rule: a task that needs knowledge children do not have | SUBJ |
| AK-E30 | «Teach necessary factual, legal, anatomical or safeguarding knowledge directly before asking children to make a judgement that depends on it.» | PSHE | must | | `references/subject-pshe.md` › Teach facts before dependent judgement · L16 | near-duplicate of E07 for PSHE; decision 6 | SUBJ |
| AK-E31 | «(b) children have a stake or anchor to speak from — lived experience, accessible scenarios, or prior content knowledge with substance;» | choosing the discussion route | must | printed by the designer's structure menu, which needs exactly one `**Use when.**` paragraph per structure | `references/evidence-synthesis.md` › Dialogic / Scenario-based · L233 | duplicate of E12, the copy the designer meets first | STAYS (code-read) |
| AK-E32 | «One sustained real task is the lesson's centre of gravity, children largely hold the knowledge or skill needed to begin, and the completed task is the main evidence of learning.» | choosing Task-Centred | must | as E31 | `references/evidence-synthesis.md` › Task-Centred · L249 | duplicate of E21, the copy the designer meets first | STAYS (code-read) |
| AK-E33 | «Explain enough first when children would otherwise not know what to notice or would form unsupported conclusions.» | a science practical; the order is chosen for the learning | must | | `references/subject-science.md` › Place the practical for the learning · L39 | rule (beside its permission to investigate first) | SUBJ |
| AK-E34 | «Ask for a prediction with a reason based on the child’s current scientific thinking. A blind guess is not useful prediction evidence.» | a science prediction | must | | `references/subject-science.md` › Make predictions and conclusions useful · L53 | near-duplicate of E23 for science | SUBJ |
| AK-E35 | «Use **Dialogic** only when the question is genuinely open after children have the knowledge needed to reason.» | RE | must | | `references/subject-re.md` › Teach knowledge before dependent judgement · L9 | duplicate of E08 for RE | SUBJ |
| AK-E36 | «Children need both pictures in place before they can weigh them, and the criteria for comparing (climate, relief, vegetation, settlement, how people live) are what the lesson teaches them to use.» | a geography comparison | must | | `references/subject-geography.md` › Making the thinking geographical · L68 | rule | SUBJ |
| AK-E37 | «These are skills and they are taught as skills, which means the technique is taught in the room before children are asked to use it» | a geographical tool | must | | `references/subject-geography.md` › The seven geographical moves · L25 | rule | SUBJ |
| AK-E38 | «"input": "the exact concise knowledge children need before they can reason sensibly"» | recording a discussion lesson's grounding | mechanics (code: exact keys; a discussion sequence may open with it) | `grounding-input`, `input` | `references/teaching-sequence-dialogic.md` › Output Format Block · L64 | mechanics (where E09 is recorded) | ROUTE |
| AK-E39 | «Use `investigationBrief` when children need one or two lines of real task context before they can act or predict.» | recording a Task-Centred lesson | mechanics (code: exact keys) | `investigationBrief` | `references/teaching-sequence-task-centred.md` › Output Format Block · L59 | mechanics (where E23 is recorded) | ROUTE |
| AK-E40 | «Where the pattern is legible, show it and ask before you explain.» | geography, a legible pattern | default | | `references/subject-geography.md` › Making the thinking geographical · L66 | rule: a sanctioned ask-before-teaching move; decision 6 must allow it | SUBJ |
| AK-E41 | «**Estimate first:**» | maths | may | | `references/subject-maths.md` › Fluency, reasoning and problem solving are three different demands · L47 | rule: a sanctioned ask-before-working move; decision 6 must allow it | SUBJ |
| AK-E42 | «its job is to give the full modelling that follows immediately something real to explain» | a skill lesson's bounded first attempt | may | | `references/teaching-sequence-skill-based.md` › (opening) · L7 | rule: a sanctioned attempt-before-teaching move; decision 6 must allow it | ROUTE |

## F. Prior learning, and what an earlier lesson counts as having taught

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| AK-F01 | «**Prior knowledge:** Use supplied prior teaching and neighbouring lessons. When prior teaching of the target is unspecified, assume it is new; do not infer familiarity from year group or stop to ask this routine question. Use curriculum reasoning to identify essential prerequisites, not to declare the target already learned. Prior exposure is not proof of mastery. Make the foundation children need for this lesson visible without reteaching every remote prerequisite.» | every lesson | must | | `agents/lesson-designer.md` › Before You Design Anything · L117. Copies: F02, F05, F15 | rule (the owner); decisions 2 and 3 | LD-PRIOR |
| AK-F02 | «- **Prior knowledge changes support, but expected prior teaching is not proof of mastery.** Produce one coherent lesson with essential foundations visible; the live teacher adapts pace and support.» | every lesson | must | | `references/evidence-synthesis.md` › Cross-Cutting Principles · L265 | near-duplicate of F01: adds "Produce one coherent lesson" and "the live teacher adapts pace and support", the limit that stops prior knowledge being answered with several versions of the lesson | LD-PRIOR (fold, carrying both) |
| AK-F03 | «- **Curriculum coherence uses real context.** Link retrieval, misconceptions and later lessons when the brief, unit or assessment evidence supplies the connection. Do not invent a previous or next lesson to make a sequence look complete.» | linking lessons | must not (invent) | | `references/evidence-synthesis.md` › Cross-Cutting Principles · L262. Copy: F04 | rule | LD-PRIOR (fold) or STAYS |
| AK-F04 | «Use later retrieval or reteaching only when the user supplies genuine linked-lesson context, a sequence or real assessment evidence. Without that context, do not invent results, thresholds, weaknesses or a next-day lesson.» | endings and linked lessons | must not | | `references/preferences.md` › Purposeful Endings and Linked Lessons · L513 | near-duplicate of F03 (endings) | STAYS |
| AK-F05 | «**Read around the named lesson.** When the source is a unit, medium-term or long-term plan, read the lesson you are designing AND its neighbours before deciding anything.» «Later lessons tell you what this one must set up, and equally what it must leave alone: teaching lesson 3's content in lesson 1 empties lesson 3. If only the one lesson's row is available, say so in the flags rather than inferring a unit that was not supplied.» | a lesson from a plan | must | `flagsForTeacher`; vocabulary pins the sentence between these (VOC-K01) | `agents/lesson-designer.md` › Before You Design Anything · L123 | rule; shared (vocabulary pins "Earlier lessons tell you what children already hold"); decision 2 | LD-PRIOR |
| AK-F06 | «**Continuity:** Brief says continues prior → reuse prior SC, sticky, vocab, rep verbatim - no paraphrase. If brief signals change, audit together.» | today continues an earlier lesson | must | vocabulary pins it (VOC-K02) | `agents/lesson-designer.md` › Before You Design Anything · L126 | shared (vocabulary, continuity) | STAYS |
| AK-F07 | «**Find prior files:** `PREVIOUS_LESSON_DIR`, when given, is the lesson children had last in this subject. A plan says what it covered; its `lesson-design.json` holds the words children actually saw. Read it before designing.» «Where today moves on, it informs the starter only. A brief naming another prior or sibling lesson: find it in `[OUTPUT_DIR]/working/` the same way. If absent, fallback paraphrase + flag.» | a previous lesson is supplied or named | must | `PREVIOUS_LESSON_DIR`; vocabulary pins the sentence between these (VOC-K03) | `agents/lesson-designer.md` › Before You Design Anything · L127 | rule: the one place that separates what a plan covered from what children saw; decision 2 | LD-PRIOR |
| AK-F08 | «- a prior-lesson continuity limitation such as the authoritative earlier file being unavailable;» | what goes in the teacher's flags | mechanics | `flagsForTeacher` | `references/output-template.md` › Flags for the teacher · L1135 | mechanics | STAYS |
| AK-F09 | «put in `orchestrator-context.md` which lesson in it this run is for and that the surrounding lessons are context, not a script.» «Pass a non-empty `PREVIOUS_LESSON=` as `PREVIOUS_LESSON_DIR`» | the orchestrator | mechanics | `LESSON_PLAN_INPUT`, `PREVIOUS_LESSON=`, `PREVIOUS_LESSON_DIR` | `skills/make-lesson/playbook-lite.md` › Before Each Run: Know What Exists › Gather and preserve the brief · L113 | mechanics | STAYS |
| AK-F10 | «Earlier in this unit the class» «has already covered, in order:» | the brief printed for a lesson from the long-term plan | code (printed into the brief the designer reads) | the brief's `What came before:` line | `scripts/plan-tracker.py` · L213 | code; decision 2 (an objective in this list reads as taught) | CODE |
| AK-F11 | «- prior knowledge, the visible foundation rather than assumed mastery, new learning (knowledge, decision or procedure), the path from supported practice to independence, and why the chosen structure fits better than the nearest alternative;» | the walk-through's closing decisions | mechanics (record) | | `agents/lesson-designer.md` › Write the lesson, then the contract · L422. Copy: F12 | recording of F01 | LD-PRIOR |
| AK-F12 | «Record the consequential choice and the prior-learning basis in the existing walkthrough, not a second checklist.» | recording | mechanics | | `agents/lesson-designer.md` › Settle the classroom experience · L62 | duplicate of F11 | LD (stays) |
| AK-F13 | «- for a lesson that teaches a method, the steps a child runs on the hardest case they will do alone (the largest number, the case that crosses a boundary), one line per step, each ending with where this class has already done that step at this size or the slides that teach it today» «Work it as a child in this class rather than as an adult who already knows the method, because the step an adult does without noticing is the one a lesson forgets to teach. A step with neither answer is a gap, and it gets its own short cycle before the cycle that needs it» «A step secure at this size is named and left; this is not a list of every remote prerequisite;» | a lesson that teaches a method | must (record and check) | | `agents/lesson-designer.md` › Write the lesson, then the contract · L423. Copies: F14, F15 | rule and recording | LD (stays) |
| AK-F14 | «**A step the method needs and the class cannot yet do at today's size gets its own short cycle, before the cycle that needs it.**» «The limit: a step the class has already done at this size, in an earlier lesson or today's starter, is named and left alone, and a remote prerequisite (reading a four-digit number in Year 4) is not retaught.» «It is not a lesson inside the lesson: one move, modelled on one or two cases and used once, and its criteria are the first steps of the main method's criteria, word for word, so the panel children meet next already starts with them.» | a skill lesson | must | | `references/teaching-sequence-skill-based.md` › Output Format Block · L221 | near-duplicate of F13: adds "or today's starter", the remote-prerequisite example, and the size limit on the short cycle | ROUTE |
| AK-F15 | «When prior teaching of the target is unspecified, judge it as new. For a method, work the hardest case children do alone, step by step, as a child in this class, before you read the designer's step trace in the walk-through's closing decisions, then compare the two: a step that neither an earlier lesson at this size nor today's teaching supplies is a missing short cycle and goes back for redesign, and so is a step the trace calls secure that the brief and neighbouring lessons do not support.» | every review | check | | `agents/design-reviewer.md` › 2. Route, modelling and independence · L166 | near-duplicate of F01 and F13 for the reviewer: adds "a step the trace calls secure that the brief and neighbouring lessons do not support" | REV |
| AK-F16 | «Where that set was taught in an earlier year it is a brisk recap that re-surfaces and shows it, not an assumption it is still secure; an embodied or concrete route is often the quickest way to re-establish it» | a recognition skill whose set was taught before | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L35 | rule; decision 3 | ROUTE |
| AK-F17 | «**Say how, unless the class can already do it without thinking.** A step may name a sub-procedure without re-teaching it only when that sub-procedure is secure from earlier lessons (`Partition each number.` in a Year 4 lesson that is not teaching partitioning).» | a criteria step | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L136 | shared (success criteria) | STAYS |
| AK-F18 | «A line that cannot be done at that point is out of order or hides an untaught action.» «The exchange has to precede removal when there is no ten to remove, and its actual method must already have been modelled.» | a criteria step | check | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L140 | shared (success criteria) | STAYS |
| AK-F19 | «others teach a new *representation* — a Venn or Carroll diagram, a bar model, a number line — that children apply to content they already know (shapes they can already classify, numbers they can already compare).» «Decide which is new — the tool or the content — and keep the familiar one simple, so the child's effort lands on what they are actually learning, and the Your Turn earns its difficulty rather than echoing the demo.» | a lesson teaching a tool | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L31 | rule | ROUTE |
| AK-F20 | «When children already know the form, model and practise a coherent whole passage so its features work together. When a feature or decision is genuinely new, give it focused explanation and supported rehearsal before integrating it.» «The final task should demonstrate the approved learning: use a whole transformation when that is the objective, but do not require unaided whole-passage performance before the component difficulties are prepared. Equally, do not split a familiar process into unnecessary cycles.» | a writing transformation | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L45 | rule | ROUTE |
| AK-F21 | «**A `teach` beat carries knowledge the method leans on and does not itself perform**: what a kilogram is before a lesson converts to grams, that a scale's unlabelled ticks are worth the same, what the word `digit` names, why anyone rounds at all.» | a skill lesson | may | `teach`; vocabulary pins "what the word `digit` names" (VOC-E48) | `references/teaching-sequence-skill-based.md` › Output Format Block · L223 | rule; shared (vocabulary pins a phrase) | ROUTE |
| AK-F22 | «An explanation or comparison whose first good instance would be the child's own is refused by the validator, whatever an earlier lesson did, because nothing can check an earlier lesson and the class needs to see one today» | a Practise asking for an explanation or comparison | must (code refuses, in content lessons only) | `launch`; the validator's model check | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L53 | rule; shared (the launch): the one place an earlier lesson never counts; decision 2 | STAYS |
| AK-F23 | «- **If the prior lesson is known** — retrieve that lesson's learning. This is retrieval, not re-teaching.» «- **If the prior lesson is not known** — identify the prerequisite skill this LO builds on, and practise that.» | the starter | must | | `references/preferences.md` › Starters · L282 | shared (starters) | STAYS |
| AK-F24 | «**Pitch the starter at the year group, and never at ground the brief says is already won.**» | the starter | must | | `references/preferences.md` › Starters · L287 | shared (starters) | STAYS |
| AK-F25 | «So a starter draws on the secure prior knowledge the lesson builds on and leaves today's specific finding for the lesson itself.» | the starter | must | | `references/preferences.md` › Starters · L309 | shared (starters) | STAYS |
| AK-F26 | «- Normally retrieve the previous lesson when it is known; otherwise retrieve the prerequisite for today's objective.» | the starter | default | | `references/evidence-synthesis.md` › 1. Opener / Retrieval Practice · L32 | near-duplicate of F23 at a weaker strength ("Normally" where F23 is a must); shared (starters) | STAYS |
| AK-F27 | «What counts as one coherent idea depends on the subject, objective and children’s prior understanding. For first teaching, normally establish each unfamiliar component children must describe or use, with an opportunity to use it before adding the next.» «On revisiting, combine more readily when the supplied context supports that foundation.» | grouping a Teach | default | vocabulary pins a later sentence (VOC-E46) | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L182 | shared (the rhythm) | STAYS |
| AK-F28 | «Related does not mean prerequisite. Add a later convention only when the approved objective or supplied sequence requires it.» | the curriculum boundary | must | | `agents/lesson-designer.md` › Before You Design Anything · L115 | rule | LD (stays) |
| AK-F29 | «The terms are the lesson's vocabulary cards (and a prior lesson's term the design says children already hold), not every subject noun on the slide» | slide colour | must | vocabulary pins it (VOC-K04) | `references/teacher-slide-visual-profile.md` › Semantic colour · L114 | shared (vocabulary); nothing in the design can say a prior lesson's term is held | STAYS (later topic) |
| AK-F30 | «**Name a familiar or just-taught action only when children genuinely know how to carry it out.** A short label may remind children of a secure sub-procedure without re-teaching it. Do not hide the lesson's new or difficult thinking inside an unexplained label» | a criteria step | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L149 | near-duplicate of F17 in the same file: adds the word just-taught; shared (success criteria) | STAYS |
| AK-F31 | «So the step that grows with the number (finding the ends of the line, the column an exchange moves into) is taught with its own short model and a quick go before the bigger numbers need it» «Two limits. The small case is the way in, not the lesson, so it takes two or three minutes and the objective's own numbers arrive quickly and carry every bit of the practice and the assessment. And it is not always available: where the difficulty genuinely is the size of the number, or where the small case behaves differently from the general one, teach the real case and scaffold it instead.» | maths, a method that grows with the number | must, with two limits | | `references/subject-maths.md` › The shape of a maths lesson · L25 | near-duplicate of F13 and F14 for maths: adds its two limits | SUBJ |
| AK-F32 | «- Every lesson moves the argument forward and ends with something banked that the final lesson will use. So the design names what this lesson banks.» «Where the brief gives the enquiry question, treat it as the thing this lesson serves.» | a history lesson in an enquiry | must | | `references/subject-history.md` › The lesson is a movement in a longer argument · L214 | rule: the one place a lesson records what it leaves for later lessons; decision 2 | SUBJ |
| AK-F33 | «Causal and interpretive material needs re-explaining rather than only retrieving, and a starter that pulls back six dates children can chant tells you nothing about whether the explanation survived the week.» | a history starter | must | | `references/subject-history.md` › Chronology, and what the starter should recall · L203 | shared (starters); a reason for decision 3 | STAYS |
| AK-F34 | «**SEND access:** the older idea is the familiar half, so the child is reasoning from something secure.» | the Connect It Back Do beat | | | `references/do-beats.md` › 10.9 Connect It Back · L538 | contradiction, decision 3: assumes last week's idea is secure, against F01 and F16 | decision 3 |
| AK-F35 | «Several names under a shared heading, or several variations of one method, do not make them one already-understood idea. Where the objective requires children to name and describe each unfamiliar member of a set, normally teach and let children use each member’s defining knowledge before moving on; naming them together and adding a shared task is not equivalent.» | first teaching of a set | default | vocabulary pins the second sentence (VOC-E46) | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L182. Copy: F36 | shared (the rhythm) | STAYS |
| AK-F36 | «When the objective requires naming and describing several unfamiliar members, trace each member’s defining explanation and immediate pupil use» | every review | check | | `agents/design-reviewer.md` › 2. Route, modelling and independence · L166 | duplicate of F35 for the reviewer; shared (the rhythm) | STAYS |
| AK-F37 | «A supplied `LESSON_PLAN_INPUT` is a **source**: it says what the school intends this lesson to cover and what sits either side of it, and it is authoritative on objective, coverage and sequence.» | a supplied plan | must | `LESSON_PLAN_INPUT` | `agents/lesson-designer.md` › Your Role as Decision-Maker · L46 | rule: how F10's "has already covered" reaches the designer as an authoritative source; decision 2 | LD (stays) |
| AK-F38 | «`plan-lesson.md` is the plan row: pass it as `LESSON_PLAN_INPUT`» | a lesson from the long-term plan | mechanics | `plan-lesson.md`, `LESSON_PLAN_INPUT` | `references/lesson-from-plan.md` › 2. Ask what is due · L39 | mechanics; decision 2 | STAYS |

## G. Questions and wording that assume the adult's knowledge

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| AK-G01 | «A question can be the right question and still be written for a reader who already knows what it is getting at. `Which part helps the apprentice now, and which part could help later?` leaves a Year 4 child asking: part of what? `What did an apprentice get out of it?` leaves them asking: out of what? The words that make the question make sense (the meals, the bed, the lessons; the deal) are in the teacher's head and not in the sentence.» | every question a child thinks hard about | must | heading `Say what you mean, and give a second question that leads to the first`, named by the designer and the reviewer | `references/teacher-voice.md` › Say what you mean, and give a second question that leads to the first · L394. Copies: G03, G04, G05 | rule; decision 10 | TV6 |
| AK-G02 | «The user, on a Year 4 history deck (14 September 2026): "They seem like they'd be great for college kids to discuss, but for primary school children they feel a little too abstract... only my smarter children will answer, because SEND, EAL, low children still need to get it."» | the reason for G01 | | | `references/teacher-voice.md` › Say what you mean, and give a second question that leads to the first · L394 | your ruling (dated; in the log) | TV6, your words kept, date to the log |
| AK-G03 | «**Name the thing.** Put the actual things into the question, so a child can answer it without first working out what it refers to:» «A slide title and the headings of a sort are read the same way, and they are easier to miss because they do not look like questions.» «**Add a second question that walks towards the first.**» «The limit: a quick recall question (`What is a source?`), a question already concrete enough to answer cold, and a prompt whose difficulty is the point (a `what do you notice?`, an odd one out) do not get a second question; adding one to every question is a habit children stop reading.» | as G01; exceptions: quick recall, already concrete, a deliberate puzzle | must | | `references/teacher-voice.md` › Say what you mean, and give a second question that leads to the first · L398 | rule (the two repairs and the limit) | TV6 |
| AK-G04 | «A question a Year 4 child cannot answer without first working out what it refers to (`Which part helps the apprentice now?`, `What did he get out of it?`), with no second, concrete question leading to it, is answered by the most confident children only (`teacher-voice.md` §6, `Say what you mean`). The same holds for a slide title or a sort's group headings, and for a sort whose two groups a child could not tell apart in one plain sentence» | every review; REVISE when it holds across the lesson | check | | `agents/design-reviewer.md` › Material-defect boundary · L44 | duplicate of G01 and G03 for the reviewer; carries B20 too | REV |
| AK-G05 | «§6 a question or an instruction a child acts on (including `Say what you mean, and give a second question that leads to the first`, because a question naming nothing concrete is answered only by the most confident children)» | writing a question | must (read) | | `agents/lesson-designer.md` › Reference Files · L559 | pointer | LD (stays) |
| AK-G06 | «**The harder half of that same test: a prompt written by someone who already knows the answer.** Missing context is the visible failure; this one is invisible, because the prompt reads perfectly to whoever wrote it and only breaks for the child meeting it cold. It wears four shapes. A question can name the property the answer turns on before the child has found it: "what shape is the land where the forest has gone?" is a clue to an adult who knows about the fishbone pattern, while a child looking at the same photograph sees size and damage and no shape at all. A second question can lean on the first already being solved, so "the line down the middle of each shape" cannot be read until "each shape" means something.» «So read every prompt back with the answer covered up and ask whether a child could tell what *kind* of thing is being asked for; phrase as a question anything a child responds to; and build a stem out of the words of the question it answers.» «Even there the child has to know what they are being asked *for*; they just should not find it easy.» | every prompt; exception: a prompt whose difficulty is the point, where the child must still know what is being asked for | must | | `references/preferences.md` › Slide Philosophy › Lesson Designer content boundaries · L545 | near-duplicate of G01: its own four shapes and repairs, which G01 lacks; G01's two repairs are not here; decision 10 | TV6 (decision 10) |
| AK-G07 | «**Simple must still be intelligible.** Success criteria are short runnable actions. Questions keep the context needed to answer them and references remain beside the work they support. Read a prompt with its answer covered: can children tell what kind of response is wanted? Clarify an unexplained blank or teacher shorthand without supplying the answer.» | every prompt | must | | `references/preferences.md` › Slide Philosophy › Lesson Designer content boundaries · L543 | rule; overlaps G06 | PREF-SP |
| AK-G08 | «The sharpest version of this is a single ordinary word that means one thing to an adult and another to a child.» «Say the question out loud as the child hears it, and where a common word is carrying an adult sense, use the plain one: `What is the same about their reasons?`» | every pupil prompt | must | vocabulary pins it (VOC-H08) | `references/teacher-voice.md` › Use pupil-clear language · L461. Copy: G09 | rule; shared (vocabulary lists it) | TV6 |
| AK-G09 | «The board got the clever one, and `share` means something different to a nine-year-old than it does to an adult.» | the script-and-slide check | | | `references/teacher-voice.md` › The check that catches the reversal · L125 | duplicate of G08 (the same case) | STAYS |
| AK-G10 | «The tell is a sentence a child could only act on after being told what the noun means for them today.» | every pupil prompt | check | | `references/teacher-voice.md` › The planning nouns stay in the plan · L465. Copies: G11, G12 | shared (voice; the exception after it is vocabulary's VOC-I07) | STAYS |
| AK-G11 | «The test is whether a child could act on the line without being told what `detail`, `claim` or `support` means for them today (`teacher-voice.md` → The planning nouns stay in the plan);» | the reviewer's voice sweep | check | | `agents/design-reviewer.md` › First: authored wording · L134 | duplicate of G10 | STAYS |
| AK-G12 | «**A prompt a child cannot act on is one of these, and it is the one most often copied through.**» «could a child act on this line without first being told what one of its words means for them today?» | the worksheet designer, before copying a prompt | must (report upstream) | | `agents/worksheet-designer.md` › Worksheet Designer (opening) · L47 | duplicate of G10 for the worksheet designer; its closing exception is vocabulary's VOC-I10 | STAYS |
| AK-G13 | «**A label children answer against is the question a child would ask themselves.** Recording prompts - the fields of a classification card, the headed lines under a photograph - are read by a child deciding what to write, so phrase each one as that child's own question in words they already have: `How do you know?` reaches a Year 4 where `Visible clue:` asks them to decode a classifier first.» «A plain noun label is fine when it names a thing to fill in (`Object name`); it stops being fine when it names a category of thinking (`Visible clue`, `Criterion`, `Attribute`).» | a recording prompt or field label; exception: a plain noun naming a thing to fill in | must | | `references/preferences.md` › Written Voice › Core rules · L69 | rule; shared (voice) | STAYS |
| AK-G14 | «A Year 4 sheet asking a child to `identify the body job that is less represented` or `justify one targeted improvement` has slid from plain into an exam-paper voice, and the child spends their thinking on parsing instead of on the task.» | printed wording; exception: work preparing children for a form they will really meet (G33) | must not | | `references/preferences.md` › Written Voice › Core rules · L59 | shared (voice) | STAYS |
| AK-G15 | «Evaluative moves borrowed from secondary exam papers - `How far is Asha right?`, `To what extent...`, a starter like `A more accurate description...` - make the child decode an adult form before any thinking starts» | Greater Depth wording; exception: work preparing children for a form they will really meet (G33) | must not | | `agents/adaptation-designer.md` › 9. Design the Greater Depth work · L280 | shared (adaptation, voice) | STAYS |
| AK-G16 | «- do not use teacher-facing terminology pupils may not understand;» | comparison prompts | must not | vocabulary pins it (VOC-J19) | `references/teacher-voice.md` › 12. Comparison and critique prompts · L731 | shared (vocabulary, voice) | STAYS |
| AK-G17 | «Rewrite `What can the sharp forest boundary suggest, and what can this photograph not prove on its own?` The evidence-thinking is worthwhile, but the wording makes the child decode the question before reaching it.» | calibration | | | `references/preferences.md` › Written Voice › Calibration examples · L109 | example | STAYS |
| AK-G18 | «**Read every component as child receiving it.** YX child cold: understand wording? Complete in time? Speak to them or past? If embarrassed to read aloud, or average YX can't do in time, redesign.» | every component | check | | `agents/lesson-designer.md` › Lesson Components · L160 | rule; shared (voice) | STAYS |
| AK-G19 | «The voice: clear simple language a nine-year-old follows easily, short straightforward sentences, concrete explanations of anything unfamiliar, and a warm direct tone that speaks to the child in front of you.» | a script | default | | `agents/lesson-designer.md` › Speaker Notes Voice · L88 | shared (voice) | STAYS |
| AK-G20 | «an abstraction where a teacher would point at the thing (`what provides the power` where a teacher says `where the power comes from`), with an adult idiom as the same fault in one phrase (`decide whether Dev's rule holds` where a teacher says `so, is Dev right?`)» | a script | check | | `agents/lesson-designer.md` › Speaker Notes Voice · L90 | shared (voice) | STAYS |
| AK-G21 | «Read each one first as the child: the actual eight- or nine-year-old the year group names, who has not read the plan, and then as the teacher saying it.» | the reviewer's voice sweep | check | | `agents/design-reviewer.md` › First: authored wording · L130 | shared (voice) | STAYS |
| AK-G22 | «**Write for understanding, not merely decodability.** A child can be able to read every word and still not understand what the sentence means.» | every string | must | | `references/preferences.md` › Written Voice › Core rules · L41 | shared (voice) | STAYS |
| AK-G23 | «Carry out a fresh example using only the steps, as that child: wherever you have to supply a meaning the words leave out (what `the step size` is, what `that many` refers to, what decides `< or >`), the step is too short, however tidy the list looks.» | success criteria | check | | `references/preferences.md` › Success Criteria · L431. Copies: G24 to G27 | shared (success criteria) | STAYS |
| AK-G24 | «Before keeping the steps, run a fresh example from their words alone, as a child who has only the page and not your plan; any meaning you had to supply is missing from a step» «and a word this lesson brought in to name something the child can already see (the ends of a line called `landmarks`) is one of those meanings, even when it has a vocabulary slide.» | success criteria | check | | `agents/lesson-designer.md` › Success Criteria Types · L293 | near-duplicate of G23: carries your ruling that a word the lesson coined for something visible is one of the meanings a step leaves out; shared (success criteria) | STAYS |
| AK-G25 | «Work a fresh example from the steps' words alone, as the weakest child with the teaching over: wherever you have to supply a meaning the words leave out» «what a word the lesson's own vocabulary slide coined for something visible stands for» | reviewing success criteria | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L210 | near-duplicate of G23: carries the same ruling as G24, and "as the weakest child with the teaching over"; shared (success criteria) | STAYS |
| AK-G26 | «The criteria are the thing that child leans on when the teaching has moved on, so every step is written in words they already own: do this, then do this, then do this.» | success criteria | must | | `references/teacher-voice.md` › 10. Success criteria · L680 | shared (success criteria) | STAYS |
| AK-G27 | «Those four are short and already clear, because each names a move the class has been taught in words the class owns.» | success criteria | | | `references/teacher-voice.md` › 10. Success criteria · L636 | shared (success criteria) | STAYS |
| AK-G28 | «**My Turn, Our Turn, Your Turn** are familiar classroom labels and are kept as-is on skill-based maths and English slides. Children already know what these mean.» | slide titles | may (assume) | | `references/preferences.md` › Slide Headings (Child-Facing Labels) · L649 | shared (slide headings): something children may be assumed to know | STAYS |
| AK-G29 | «The tell is a noun the child has not been taught to use; the same tell catches a shorter label that still needs translating» «**A step is written in the child's own words, not the plan's.**» | a criteria step | check | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L138 | duplicate of G10 (the untaught-noun test), not G23; shared (success criteria) | STAYS |
| AK-G30 | «**Where the lesson judges a person, the class is told what is being judged.** Designing the character question out is not the same as ruling it out in the room, and children will reach for it anyway: asked how significant somebody was, a nine-year-old answers whether they were kind.» «One sentence, on the board or in the script.» | a lesson that evaluates a person | must | test pins the heading | `references/subject-history.md` › The "what can we learn from this today" question · L125 | rule: a child answers with their own meaning of the word; its "on the board or in the script" is decision 1 (script side) | SUBJ |
| AK-G31 | «- **One closing ask from a small set children already recognise:**» | maths sheet questions | may (assume) | | `references/subject-maths.md` › How a maths sheet's questions are worded · L97 | shared (worksheets): something children may be assumed to know, like G28 | STAYS |
| AK-G32 | «- **Name what the child can see, in the lesson's words.**» | maths sheet questions | must | the sentence after it is vocabulary's (VOC-I08) | `references/subject-maths.md` › How a maths sheet's questions are worded · L102 | shared (worksheets) | STAYS |
| AK-G33 | «Do not simplify wording merely because an assessment word is formal: when the work is preparing children for a form they will really meet, preserve the language and structure of that form, so the test's register is familiar before the test asks it.» | work preparing children for a form they will meet | must | | `references/preferences.md` › Written Voice › Core rules · L55 | shared (voice): the exception to G14 and G15 | STAYS |

## H. Time and place

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| AK-H01 | «Children find historical time genuinely hard, and later than teachers assume. Dates carry little meaning before around age 8, and it is only around 10 or 11 that children reliably connect them to what they know.» «So assume nothing: a Year 4 child who can recite Romans, Anglo-Saxons, Vikings may not know whether 1066 comes before or after AD 43.» | history | must | | `references/subject-history.md` › Chronology, and what the starter should recall · L197 | rule | SUBJ |
| AK-H02 | «**Place it in time so it can be reasoned with.** First this in 1877, then that in 1943, which means something. Dates support an answer; they are not the answer.» | history | must | | `references/subject-history.md` › What children do when it is really history · L68 | rule | SUBJ |
| AK-H03 | «Now we're going back to Tudor England, between 1485 and 1603. That's after the Romans and long before the Victorians.» | the Tudor Teach board's script | | | `references/preferences.md` › Pride Lessons › What a Teach slide holds: the Tudor calibration · L794 | your example (placing a period against what the class already has) | STAYS exactly |
| AK-H04 | «**When the chunk is where something is, anchor it to what children already located.** A place only means something once a child can put it inside somewhere they already hold, so teaching a location works outward from the known: the continent they can find, then the region, then the place itself.» «Where the starter or an earlier slide already had children name the continents, say so and use it, since the link back is what turns two separate facts into one picture.» «In practice this is usually one extra visual beat rather than a new chunk: the world map with the continent picked out, then the closer map.» | teaching a location; limit: usually one extra visual beat, not a new chunk | must | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L41. Copies: H05, H06 | rule | ROUTE |
| AK-H05 | «**Locate: where is it?** Fixing a place in a spatial frame the child already holds. The move is outward from the known: the continent they can find, then the region, then the place.» | geography | must | | `references/subject-geography.md` › The seven geographical moves · L17 | duplicate of H04 | SUBJ |
| AK-H06 | «- **Mark it.** Put the river, city or biome on a blank map, working outward from what the class already holds.» | a geography Do beat | must | | `references/subject-geography.md` › What a Do beat looks like in geography · L76 | not a duplicate of H04: H04 is how the teacher teaches a location, H06 a Do beat children do; geography's Do-beat list owns it | SUBJ |
| AK-H07 | «Choose the practice the objective and prior learning need.» | map work | default | | `references/subject-geography.md` › Making the thinking geographical · L62 | rule | SUBJ |
| AK-H08 | «What is worth pulling back is where this sits against what they already know, what came before and after it, and how long ago that actually is.» | a history starter | default | | `references/subject-history.md` › Chronology, and what the starter should recall · L199 | shared (starters) | STAYS |
| AK-H09 | «Locational knowledge fades faster than anything else children learn in this subject, so it is worth coming back to and it is cheap to retrieve: where is this, what is near it, what do we already know about it.» | a geography starter | default | | `references/subject-geography.md` › Retrieving where places are · L126 | shared (starters) | STAYS |
| AK-H10 | «**Tell the past in the past tense, and keep the period in view.**» «the slide titles name the period (`Why did Tudor children work?`, not `Why did these children work?`)» «The limit is the teacher speaking to the class about now (`What does your home need every day?`), which stays in the present because it is.» | history; limit: the teacher speaking about now | must | test pins the heading | `references/subject-history.md` › What the lesson feels like to the child · L38 | rule; its Tudor case is in the log | SUBJ |
| AK-H11 | «two dated sources from inside one period do not need a timeline, they need their dates in their captions» | history, two dated sources | must | | `references/subject-history.md` › What the board and the page hold · L156 | rule | SUBJ |

## I. Home, family and everyday experience

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| AK-I01 | «Avoid unnecessarily forcing personal disclosure or assuming children share the same family circumstances, experiences or emotional safety.» «Personal reflection remains available when it is genuinely suitable.» | invented scenarios and real-world claims; permission: personal reflection when genuinely suitable | must | | `references/preferences.md` › Source and Scenario Integrity · L523. Copies: I03, I04 | rule | PREF-SSI |
| AK-I02 | «`Councillors are chosen by local people who vote - maybe someone in your family has voted before.` is an acceptable small relatable aside. It is hedged, harmless and does not assume a particular family experience.» | calibration | | | `references/preferences.md` › Written Voice › Calibration examples · L114 | example | STAYS |
| AK-I03 | «Do not assume children share the same family circumstances, personal experience or emotional safety.» | a discussion stimulus | must | | `references/teaching-sequence-dialogic.md` › Teaching Sequence Specification · L17 | near-duplicate of I01: says it flatly, without I01's "unnecessarily" (which may be read as qualifying the assuming too); the flat form must survive a fold | ROUTE or pointer |
| AK-I04 | «Use fictional, school-based or third-person situations for sensitive topics. Do not assume children share the same family circumstances or ask them to reveal private information about family, money, relationships, mental health, puberty or unsafe experiences.» | PSHE | must | | `references/subject-pshe.md` › Use safe distance · L20 | near-duplicate of I01: names the sensitive areas | SUBJ |
| AK-I05 | «The choices that protect a child are in the words the class hears and reads, not in a flag to the teacher: that the example can come from school, friends or home; that the time can mean little or bring mixed feelings and still be explained well; and that a private spoken answer can replace writing.» «A script that says `think about December in your house` three times and offers the alternatives only in a teacher note has withdrawn them from the child who needed them, whatever the flag says.» | RE, a personal reflection | must | test pins it | `references/subject-re.md` › Use evidence that directly shows the RE learning · L53 | rule: the only one that says where the alternatives must live; its case is undated and not in the log | SUBJ; decision 11 |
| AK-I06 | «No beat needs a child's own experience to be completed; a private choice can stay private (`Use safe distance` above).» «Personal reflection may remain private.» | PSHE | must | | `references/subject-pshe.md` › What a Do beat looks like in PSHE · L46 | near-duplicate of I04: adds that no beat needs a child's own experience; decision 11 | SUBJ |
| AK-I07 | «Children arrive having been to different places, so their own experience is comparison material worth using.» | geography | may | | `references/subject-geography.md` › The seven geographical moves · L21 | rule: a permission to use experience, beside I01's caution; decision 11 | SUBJ |
| AK-I08 | «("Think of a time when…", "What would you do if…", "Is it always wrong to…?")» | a PSHE, RE or Citizenship starter | may | | `references/preferences.md` › Starters · L291 | shared (starters): a starter that invites experience; decision 11 | STAYS |

## J. Pages children read away from the teaching

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| AK-J01 | «A worksheet is the plainest surface, because a child works from it with no teacher's voice attached: clear, direct instructions with none of the slide's conversational flavour, self-contained enough that a child knows what to do, but never reteaching the method or giving away the thinking.» «Working-wall and stick-in wording remains self-contained and quick to re-enter because children may meet it away from the original explanation.» | worksheets, the wall, stick-in pieces | must | | `references/preferences.md` › Written Voice › Core rules · L57 | shared (voice, worksheets) | STAYS |
| AK-J02 | «made self-contained, and carries the framing a child needs when no teacher is talking them through it.» | a private practice sheet | must | | `references/preferences.md` › Worksheets › What the sheet is for · L689 | shared (worksheets) | STAYS |
| AK-J03 | «A separate worksheet need not duplicate a reference that remains accessible, but a resource intended for use on its own cannot assume an unseen board.» | support a task needs | must | | `references/preferences.md` › Support, Checking and Release · L497 | shared (support, worksheets); later decision | STAYS |
| AK-J04 | «the child demonstrably meets it elsewhere in this lesson, which you establish from the lesson design's own slides, representations or working-wall entries rather than assuming it;» «You may take one off on your own judgement, including one marked required, when all three hold:» «and the page genuinely does not fit with it.» | the worksheet designer dropping a printed reference; all three conditions: no question reads it from the sheet, the child meets it elsewhere, and the page does not fit | may, only when all three hold | `notes` | `agents/worksheet-designer.md` › 4. Trust the refusal · L556 | shared (worksheets); pulls against J03 (which sheets are used on their own?), later decision | STAYS |
| AK-J05 | «The card still has to be usable by the child standing in front of it, with enough context, an example or a picture to help without the teacher explaining its layout; it does not have to reteach a missed lesson.» | every wall card | must | | `references/working-wall-card-contracts.md` › The wall-worthy test · L13. Copies: J06, J10 | shared (the wall): the wall may assume the lesson, not a missed one | STAYS |
| AK-J06 | «A card should also offer useful help without the teacher explaining its layout or missing context.» «It does not have to reteach a lesson a child missed; aiming at that reader is what made cards general and lifeless.» | every wall card | must | | `references/working-wall-preferences.md` › The load-bearing principle · L16 | duplicate of J05 | STAYS |
| AK-J07 | «Self-contained (does not assume context the child has lost)» | a sticky-knowledge wall card | must | `stickyKnowledge` | `references/working-wall-card-contracts.md` › stickyKnowledge · L285 | shared (the wall) | STAYS |
| AK-J08 | «**1. Self-contained.** Every item on a card is a complete idea on its own. Bare label-text pairs are banned unless the relationship is obvious from the title alone.» «The bad version assumes the child knows the column header.» | wall wording | must | its heading is cut by exact title by the wall packet | `references/working-wall-preferences.md` › Wording style · L66 | shared (the wall) | STAYS |
| AK-J09 | «Avoid "Reference" — it's adult-speak.» «Use this phrasing rather than the adult word `Misconceptions`» | wall headings | must | | `references/working-wall-preferences.md` › Card titles · L56 | shared (the wall) | STAYS |
| AK-J10 | «- Anything a child standing in front of it could not use without the teacher explaining its layout (rule 3)» | wall cards | must not | | `agents/working-wall-designer.md` › Wall-Worthy Criteria › What gets skipped · L315 | duplicate of J05 | STAYS |
| AK-J11 | «Add context, an example or a visual where needed; a reminder does not have to replace all the teaching for a child who missed the lesson.» | wall cards | must | | `agents/working-wall-designer.md` › Rules That Never Change · L84 | duplicate of J05 | STAYS |
| AK-J12 | «Provide enough context, an example or a visual for that job. A wall reminder need not reteach an entire missed lesson.» | wall cards | must | | `references/working-wall-preferences.md` › The load-bearing principle · L18 | duplicate of J05 (a second copy in the same file as J06) | STAYS |
| AK-J13 | «For needed support omitted from a sheet, check the planned shared access before making a finding; do not assume either that nothing is available or that the board will always be there;» | reviewing a sheet's support | check | | `agents/design-reviewer.md` › 4. Language, load and teacher usability · L234 | shared (worksheets): sits between J03 and J04; later decision | STAYS |
| AK-J14 | «Omit a duplicated panel when the surrounding lesson context already supplies the reference adequately. Include the exact concise criteria when the sheet must stand independently or access depends on that reference» | a worksheet's criteria panel | must | | `agents/worksheet-designer.md` › Rules that never change · L913 | shared (worksheets): already names "a sheet that must stand independently"; later decision | STAYS |
| AK-J15 | «Whatever is already on the slides while they work, most often the success-criteria panel, is on the board for them to consult, so reprinting it on the sheet duplicates what they can already see and spends the space the frame needs.» | a shared working frame | must | | `references/preferences.md` › Worksheets › What the sheet is for · L692 | shared (worksheets): a sheet may assume the board; later decision | STAYS |
| AK-J16 | «drop a reference the board is already showing while they work» | a sheet priced over the page | may | | `references/preferences.md` › Worksheets › The printed page · L713 | shared (worksheets); later decision | STAYS |
| AK-J17 | «**The board does not reprint what is already in the child's hands, and it says whose sheet the work is on.**» «The limit is material children need while working that the sheet does not carry, such as a word bank, a worked example they refer back to or a diagram too large to print: that stays on the board.» | a slide launching a printed task | must | | `references/slide-composition-playbook.md` › 5. Build a hierarchy, not a pile of equal boxes · L157 | shared (worksheets): the reverse rule, the board may assume the sheet; later decision | STAYS |

## K. The review page and the reviewer's name check

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| AK-K01 | «Then read the view's `Names on the board`: every person, place, organisation or thing the class reads, with where it first appears. You know who Elizabeth I is and what the Thames is, so reading as a child cannot find them; the list can.» «For each name, find the words that tell this class who or what it is, on the board where it first appears or in an earlier lesson the brief names. A name nothing explains is a finding on User-fit, and you may repair it yourself as wording (a clause where it first appears: `Queen Elizabeth I, who ruled England in Tudor times`) or return it when the name is on the board because a source or detour put it there. The same list shows the words about where a source came from (`modern summary`, `reconstruction`, an organisation's name), which a child reads as one more thing to ask about.» | every review, every subject | check | `Names on the board`; tests pin "Then read the view's `Names on the board`" and "A name nothing explains is a finding on User-fit"; vocabulary pins "For each name..." (VOC-H07) | `agents/design-reviewer.md` › Normal packet route · L96 | rule; shared (vocabulary pins a sentence); decisions 2, 4, 7, 8 | REV |
| AK-K02 | «## Names on the board» «year group knows none of them unless this lesson, or an earlier lesson» «finding, repaired by a clause where it first appears or by taking it» | the review page | code (prints it) | `## Names on the board`; test pins the section's place after `## Teaching sequence` | `scripts/design-review-packet.py` · L1404 | code; decision 8 | CODE |
| AK-K03 | «Words on the board about where a source came from, which a child reads as one more thing to ask about:» | the review page | code (prints it) | `SOURCE_LABEL`, which matches modern summary, any word starting reconstruct, adapted from, and summary | `scripts/design-review-packet.py` · L1423 | code; decision 7 | CODE |

## L. Below and Greater Depth

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| AK-L01 | «**Reasoning sits at a scale the child already owns, not at the top of the climb.** A child asked to judge whether `1,247 + 10 = 1,257` when they met four-digit numbers ninety seconds ago is doing two new things at once, and a wrong answer tells nobody which one went wrong.» | a Below sheet | must | | `agents/adaptation-designer.md` › 3. Apply the selected tier's resource boundary · L126 | shared (adaptation) | STAYS |
| AK-L02 | «When the gap is wide enough that the rungs crowd the accessible practice down to two or three questions, or when the class case carries a SECOND new idea the child has not met, the climb buys one supported success and sells the practice that would have moved them.» | deciding whether a Below sheet climbs | check | | `agents/adaptation-designer.md` › 3. Apply the selected tier's resource boundary · L136 | shared (adaptation) | STAYS |
| AK-L03 | «**Adapting for children who find it hard means changing the route in, not the destination.** The move that feels wrong and is right is to give a weaker reader *more* teacher narrative rather than a simpler source with the same thin build-up, because the shortfall is knowledge and reading the source was never the point.» | history, children who find it hard | must | | `references/subject-history.md` › What the board and the page hold › Optional decoration on sensitive history · L171 | shared (adaptation) | STAYS |
| AK-L04 | «Use only when the context creates worthwhile transfer without adding irrelevant reading, background knowledge or novelty barriers.» | an unfamiliar context in reasoning | must | | `references/reasoning-prompts.md` › Reasoning prompt types · L31 | shared (reasoning, adaptation) | STAYS |
| AK-L05 | «Before using or adapting one, check mathematical or factual accuracy, year-group demand, prior teaching, the complete answer and avoidable reading or background demands.» | a reasoning exemplar | check | | `references/reasoning-prompts.md` › Year-group exemplars · L57 | shared (reasoning) | STAYS |
| AK-L06 | «Keep central subject vocabulary and proper nouns, supporting them with examples, visuals or plain-language bridges rather than automatically replacing them.» | Below resources | must | vocabulary pins it (VOC-P01) | `references/preferences.md` › Written Voice › Core rules · L83 | shared (vocabulary, adaptation) | STAYS |
| AK-L07 | «- do not create challenge through extra quantity, unnecessary unfamiliarity, inaccessible reading or automatic scaffold withdrawal;» | Greater Depth | must not | | `references/adaptive-adaptation.md` › Greater Depth, same objective · L145 | shared (adaptation) | STAYS |
| AK-L08 | «- a less familiar application when the unfamiliarity genuinely increases the relevant thinking.» | Greater Depth | may | | `agents/adaptation-designer.md` › 9. Design the Greater Depth work · L265 | shared (adaptation); the permission beside L07 | STAYS |
| AK-L09 | «Use these defaults unless the teacher's brief names a specific working level.» | the Below working level | default | | `references/adaptive-adaptation.md` › Default Working-Level Gap · L64 | shared (adaptation): the default assumption of what a Below child holds (two years below for Years 2 to 4, three for Years 5 and 6) | STAYS |
| AK-L10 | «the child does not yet have what it rests on. Name the prerequisite and why it is needed.» | a Tier 3 Below resource | must | | `references/adaptive-adaptation.md` › The Three Tiers · L35 | shared (adaptation) | STAYS |

---

## Out-of-date text

None of this topic's rows describes a behaviour the code no longer has. Two
places describe the review page more generously than the code behaves (decision
8): the reviewer is told the list holds "every person, place, organisation or
thing the class reads", and it holds only capitalised names that do not open a
sentence, never on a title, a card holding one name or an ordinary word; and
the rule wants the explaining on the board, while the page counts the script,
and part-words, as "said earlier". One pointer leads where its reader does not
go: AK-D04 sends every subject to a history paragraph that only history lessons
read and that no section read can select (decision 5). One sentence describes
what a program prints more strongly than the program means it: the plan brief's
"has already covered" was written for the starter (decision 2).

## Stories and dated rulings

Under your standing ruling (stories leave, reasons stay, a case that makes a
rule clear may stay as a plain example, your rulings keep your words without
their dates).

| Row | Story | In the build log? |
|---|---|---|
| AK-A14 | Sophie's body at rest; the answer, breathing, only in the script (8 September) | **No**: copy it there first |
| AK-D08 | Sarah Gooder beside the invented George and Sam (16 September) | **No**: copy it there first |
| AK-D02 | The 1590 order that cost a queen, a government, an order and bear-baiting | Partly: the 4.2.283 entry names Elizabeth I, a government and an order; 1590 and bear-baiting are not there. Proposed to stay as history's undated example |
| AK-B05 | The chipped tooth with no context | Yes (L2071, L2095) |
| AK-B21 | "Choose a job" answered "Fireman" | Yes (L2254) |
| AK-B33 | Isla named in the bubble, "she" in the question (19 September) | Yes (L659) |
| AK-B34 | `a class` said ten times, never introduced (21 September) | Yes (L4008) |
| AK-F14 | Rounding 3,998: the tens either side not taught (17 September) | Partly: the event is in 4.2.221 (L1017); 3,998 and the repair's 528 and 5,996 are not |
| AK-F31 | Children could not find the two tens either side of 346 or 3,998 (17 September) | Partly: the event is in 4.2.221; the numbers are not |
| AK-A34 | The PSHE line `When you rest, it all settles down again` cut from the board (12 September) | Yes (L2057) |
| AK-H10 | Tudor cases told in the present tense (14 September) | Yes (L1243 to L1247) |
| AK-A10 | A task inflated with an untaught, unverified law | Yes (L1125) |
| AK-I05 | A script saying `think about December in your house` three times, the alternatives only in a note | No, but undated: proposed to stay as a plain example |
| AK-G02 | Your "college kids" ruling (14 September) | Your words; yes (L1233) |
| AK-G06 | The fishbone pattern question | Yes (L1451) |
| AK-G09 | `share` on the RE board | Yes (L2252) |
| AK-A17 | Toffee and squash | Yes (L975) |
| AK-D12 | Every picture captioned `reconstructed` (14 September, in the playbook paragraph) | Yes (L1223, and L1263: you wanted "as it might have looked") |
| AK-K01 | Elizabeth I and the Thames | Yes (4.2.283, L4319) |

## Names the code depends on, and what the code enforces

Read by programs or tests, and not to change without the code:
`Names on the board` (the review page's heading, which the reviewer is told to
read and a test places after `## Teaching sequence`); `SOURCE_LABEL`
(`modern summary`, `reconstruct...`, `adapted from`, `summary`);
`PREVIOUS_LESSON=` printed by the filing script and passed as
`PREVIOUS_LESSON_DIR`; `LESSON_PLAN_INPUT` and the plan brief's `What came
before:` and `What comes next:` lines; `teacherInfo`, where provenance goes;
`flagsForTeacher`; the Discovery `question` unit's `prerequisites` field (exact
keys); `teach-needed`; `launch`; `CHARACTER_NAMES`; `fallbackEmoji`; the
review routing card's always-read `What a Lesson Is For`, which carries AK-A01;
the designer's structure menu (`--structure-menu`), which prints the
Discovery, Dialogic and Task-Centred "Use when" paragraphs AK-E18, E31 and E32
quote and needs exactly one `**Use when.**` paragraph per structure; the
Dialogic `grounding-input` unit and its `input` key (exact keys; a discussion
sequence may open with it); `investigationBrief` on a Task-Centred `set-task`;
and `CHILD_FACING_CONTENT_KEYS`, the content fields the review page reads for
names.

What the code enforces today: a Discovery question records its `prerequisites`
as a string; a Content-based Practise asking for a written explanation or
comparison is refused unless this lesson has shown a good one, whatever an
earlier lesson did (AK-F22; the check leaves skill lessons alone and never
looks at Discovery's `use-learning`, a Dialogic ending or Task-Centred's
`do-task`, so in practice it is content lessons only); a newly carded word the
next beat has only in its script is refused (vocabulary's check, the one place
the code already holds "on the board, not just the script"); the review page
lists capitalised names on the board with the first beat and whether any
earlier string said them, and lists source-label words; the plan brief lists
the unit's earlier objectives as "already covered" (or, at a unit's start, the
whole previous unit as "just finished"); the filing script names the last
lesson built in the year and subject.

What it does not enforce, although the text might suggest it: nothing checks
that a name is explained, that a task uses only taught knowledge, that a
pronoun has its referent, or that provenance sits in `teacherInfo`. The names
list misses a one-word name that opens any piece of text (`Shaftesbury wanted
shorter hours.`, `Answer: Shaftesbury`, `Who changed the law? Shaftesbury.`, a
card holding only `Victoria`, `Tudor children worked.`, the first word of a
quotation), and every lower-case word (`government`, `order`, `steam engine`);
never reads a unit's `label`, which is the slide title; counts the teacher's
script and part-words (`Victoria` inside `Victorian`) when it says "said
earlier in the lesson"; and never reads the vocabulary cards or the worksheet.

## Rows whose wording a test already pins

Found by matching every phrase-length string in `scripts/tests` against the
quotes, then dropping matches that are only a file or section name, a test
fixture, or a pointer the test checks in a different file. A row here cannot
lose that phrase without a test failing; a fold that moves the phrase moves
the test with it.

A01, A02, A03, A04, A07, A08, A10, A17, A18, A19, A23, A24, A25, A26, A32,
A33, A34, A37, A38, A39, A40, A43; B01, B02, B04, B06, B07, B12, B19, B20,
B21, B22, B34, B38, B39, B41; C01, C04; D01, D04, D05, D06, D07; E02, E08,
E11, E18, E22, E32, E41; F11, F28, F31, F37; G03, G04, G05, G08, G13, G18,
G19, G20, G22, G24, G25, G29, G30, G33; H10; I05; K01, K02; L01, L02 (74
rows).

Three of them sit on sentences a decision would change: D06 ("Say it once: a
set of reconstruction pictures", decision 7), G30 ("One sentence, on the board
or in the script" sits beside its pinned heading, decision 1), and E18, whose
paragraph the designer's structure menu prints and a test reads ("safe,
dependable phenomenon"). A fourth pin holds a behaviour decision 8 would
change: `test_the_leisure_lesson_repairs.py` requires the names list to give
exactly `Tudor` for a text containing `Listen to each other.` and `Play and
learning`, so a better one-word-name signal moves that test.

Pinned in place by the vocabulary test as well (`vocabulary_ledger_pins.json`):
A23, B02, B40, B41, C01, C02, C03, E09, F06, F21, F29, F35, G08, G16, G24, G25,
K01 and L06, and the sentences that sit between the quotes of F05 and F07
(VOC-K01, VOC-K03).

## Mentions judged to belong to another topic

Looked at and left out of the rows, because assumed knowledge is not what they
govern. Each goes with its own topic.

- **The teacher's knowledge, not the child's** (the Teach board and the slide
  designer): preferences L531 (its ruling "The scene hasn't been set"; B13
  lists the same paragraph's definition of teaching), L537, L565, L782
  (L539's second sentence is now A46); teaching-sequence-content-based L120;
  slide-designer L21, L23; slide-composition-playbook L153, and L157's symbol
  sentence (its heading and limit are now J17); modelling-formats L17; design-reviewer L44 (the Teach board read
  with the notes closed; C04 and G04 list other sentences of it), L236;
  subject-history L233.
- **The reverse test, "could a child do it without the lesson"** (what a lesson
  is for, quick checks): preferences L148, L150, L158; lesson-designer L231,
  L253, L416; design-reviewer L155, L201; output-template L446;
  task-contrasts L5; do-beats L51; teaching-sequence-dialogic L21.
- **Drawn-live criteria "a later lesson assumes"** (success criteria):
  preferences L447, lesson-designer L295, output-template L322, templates L182.
- **Retrieval and starters** beyond the rows above: preferences L285, L289,
  L292, L303; subject-geography L128, L130; do-beats L100, L408, L549, L553.
- **Reading access, not knowledge**: subject-maths L77, L79; adaptation-designer
  L194; history L167 is listed (D17) because it is about a source's words.
- **Launches and forms the class already knows** (the launch, worksheets):
  teaching-sequence-task-centred L31, design-reviewer L205, do-beats L493,
  subject-maths L154 (preferences L55 is now G33).
- **Other passing mentions**: lesson-designer L124 (ambiguous shorthand), L357
  (recognising objects without decoding names), L361; subject-re L17, L25;
  subject-geography L60, L64; slide-speech-and-characters L11, L13;
  working-wall-preferences L218 (canonical headings children read the same
  way across the school); evidence-synthesis L107.

## Found in passing

- **Nothing sends the reviewer to the rule that catches ordinary words.** The
  vocabulary rule "a word the teaching leans on is taught" is what catches
  `government`, `order` and `steam engine`; the reviewer reads the Vocabulary
  section only when "vocabulary selection, definition, quantity or placement is
  in doubt", and the names list cannot see lower-case words (decision 8).
- **The plan brief tells the designer the class "has already covered" every
  earlier objective in the unit.** That sentence is printed by a program, not
  written in any instruction file, so no tidy-up of the instructions would find
  it (decision 2). A second branch, for the first lesson of a unit, lists the
  whole previous unit as "just finished" (a test holds its words "opens a new
  unit"). Both branches end on the starter ("Retrieve what they have recently
  learned when that is the best warm-up for today's objective"), and the
  program's own note says the list is there "so the starter can connect back".
  "Covered" is plan order, not teaching: the tracker builds up to a buffer of
  lessons ahead of what has been saved (five for a daily subject, two
  otherwise), so a listed lesson may not have been taught when the brief is
  written. No test holds the words "has already covered".
- **The "previous lesson" is the one built last, not the one taught last.** The
  designer is told `PREVIOUS_LESSON_DIR` "is the lesson children had last in
  this subject"; the filing script documents it as the lesson "this run built
  last in the same year and subject", and outside its calendar mode it takes the
  most recently written design in that year and subject, with no check that it
  is a different lesson or that it has been taught. Worth checking before the
  leisure rerun: a rebuild of the same lesson may be handed its own earlier
  build as the lesson children had last (decision 2).
- **The review page's list of names misses more than the ledger first said**
  (decision 8): any one-word name opening a piece of text (after a full stop, a
  colon, a question mark, a line break, a table cell or an opening quotation
  mark), so a sort, match or option bank whose cards are single names never
  reaches the list; slide titles, which it never reads; and "said earlier" is a
  part-word match that also counts the script. A test holds the current
  sentence-opener behaviour, so the repair needs a different signal and moves
  that test.
- **The model check reaches content lessons only.** It is described as
  refusing an unmodelled written explanation "whatever an earlier lesson did",
  and it does, but only for a Content-based `practise`; a skill lesson is
  exempt and the Discovery, Dialogic and Task-Centred endings are never
  checked.
- **The history file carries two rules the whole plugin needs**, the
  explaining-cost test for a source and the beat-by-beat knowledge check, and
  only history lessons read it (decisions 5 and 6).
- **Twenty of this topic's rows are, or sit beside, sentences the vocabulary
  test pins** (A23, B02, B40, B41, C01, C02, C03, E09, F05, F06, F07, F21, F29,
  F35, G08, G16, G24, G25, K01, L06), so any fold that moves them moves the
  vocabulary pins in the same release.
- **A real history rule sits under an unrelated heading.** "A real source needs
  an accessible route" (D01, D03, D17) and "adapting for children who find it
  hard" (L03) are paragraphs under `Optional decoration on sensitive history`,
  so a reader selecting sections by their headings would not find them where
  their subject suggests.

## Independent check: what was not taken

The independent check (`streamline-tools/assumed-knowledge-inventory-check.md`)
was verified finding by finding against the plugin files and the code. Every
finding held and went in. Where it went in differently from how it was put:

- **The Below working-level table** (two years below for Years 2 to 4, three for
  Years 5 and 6) is described in AK-L09's scope rather than quoted, because a
  quote carrying table bars breaks this ledger's own table.
- **The correctness handover and the backward-trace copies** (A37 to A43) are
  listed as shared with the rhythm, not as this topic's rules: they bear on what
  children hold only through what the lesson built.
- **"Unsure" items were taken as stated, not decided**: F19 is graded "must"
  because its wording is an instruction; the pull between not assuming
  experience and inviting it became decision 11; I01's "unnecessarily" is
  recorded as possibly qualifying the assuming too; and the previous-lesson gap
  is recorded as worth checking, not as a proven fault.
