# Success criteria rule ledger (streamline topic 5)

Step 1 of the streamline method in `streamline-plan.md`, for one topic: a
lesson's success criteria. Nothing in the plugin was changed to make it.

**Snapshot.** The plugin's working tree on the evening of 23 September 2026:
lesson-v4 4.2.286 (commit `bf658468`) with the assumed-knowledge change
(4.2.287) sitting uncommitted on top. Quotes are taken from that working tree,
not from a commit, and line numbers are the line in the working tree where the
quote starts. The working tree was still moving while this list was built
(`design-review-packet.py`, `preferences.md` and `lesson-designer.md` were
rewritten at 17:39 by the assumed-knowledge work), so a line number may drift by
a few lines; the words are what `streamline-tools/check-ledger-quotes.py`
checks, and every «quoted» passage is the file's own words.

**What counts as success criteria here.** Everything the plugin says about a
lesson's success criteria: what they are for (a live reference children use
while they work, not a label); when a lesson has them and when it does not; the
form following the task; how many steps and how each step reads (clarity before
brevity, one sentence, no explanation the teaching already gave, in words the
child already owns, no lesson-coined label for something visible); the step
and lookup-table mechanics; where the criteria appear (the Teach and practice
slides, the launch, the worksheet, the stick-in pack, the working wall) and
what each surface does with them; building them live and `drawLive`; carrying a
previous lesson's steps word for word; the colour marks inside a criterion
(picture, taught word, the part to decide), with your vocabulary decision 16;
the panel's size on a slide; the reviewer's checks; and what the programs check
or print about criteria.

**What belongs to a neighbouring topic.** Vocabulary is finished and pinned:
its rows about a lesson's own label (VOC-I01 to I06), green on every taught word
(VOC-N19, N25, N29) and continuity (VOC-K01 to K03) are listed here as shared
with vocabulary where they touch criteria. Assumed knowledge (4.2.287) owns
"work from what children can use"; its rows G23 to G27 and G29 are this topic's
and appear here as E01 to E04, D13 and E09. The Teach then Do rhythm and quick checks
are finished. Worksheets (topic 6), the launch, starters and sticky knowledge
(topic 7), the reviewer, subject files and voice guide in general (topic 8) and
the slide, worksheet, wall and adaptation designers' page work (topic 9) come
later: a criteria rule inside one of their files is a row here, and the page
mechanics round it are marked shared with that topic.

## How to read a row

| Column | Meaning |
|---|---|
| ID | `SC-` then a group letter and a number. Groups: A what the criteria are for, B when a lesson has them, C the form follows the task, D how a step reads, E words the child already owns and the fresh-example test, F step and table mechanics and the same wording across a concept, G what a step may carry (counts, answers), H which slides and beats carry the criteria, I downstream copies them exactly, J the colour marks, K the panel on a slide, L building them live (`drawLive`), M continuing an earlier lesson's criteria, N the worksheet, O the stick-in pack and the working wall, P Below and Greater Depth, Q the reviewer and the designer's own checks, R the launch and its good instance, S what the programs check and print, U criteria a subject gives the class. |
| What the agent is told | The rule's own words. Several «quotes» in one row are separate sentences of the same rule. |
| When it applies | The condition, and any exception the text gives. |
| Strength | **must** (never, always, only, or refused by code), **default** (normally, usually, prefer), **may** (a permission), **check** (a test or tell the agent runs), **mechanics** (how to record or build it). "Code" means a program refuses or prints it. |
| Code names | Field names, markers, headings, messages or commands a program or test depends on. These cannot change without the code. |
| Where | The file, its section and line. The primary row of a rule lists its copies. |
| Kind | rule; your example (how the agents learn your taste); your ruling (your words); duplicate; near-duplicate (with what it adds or lacks); contradiction (a numbered decision below); story (a dated incident); pointer; maintainer; stale; code; shared (another topic owns it, named). |
| Proposed home | A proposal only: see decision 10. **PREF-SC** preferences.md → Success Criteria; **TV10** teacher-voice.md → 10. Success criteria (how a step sounds, and your rewrites); **SKILL** teaching-sequence-skill-based.md → Writing the Success Criteria (step and table mechanics, which every lesson with steps already reads); **LD-SC** the designer's own `Success Criteria Types`, kept for recording and the read instruction; **OT** output-template.md → Success criteria; **ROUTE** its route file; **SSC** slide-success-criteria.md (slide placement); **PB** slide-composition-playbook.md §9; **VP** teacher-slide-visual-profile.md; **TPL** templates.md; **WS**, **WALL**, **STICK**, **ADAPT** the worksheet, wall, stick-in and adaptation files; **REV** the design reviewer; **SUBJ** its subject file; **CODE** the program; **LOG** build-review-log.md; **STAYS** stays where it is because another topic owns it. |

## What the list shows, in short

- **392 places** in 55 files (47 instruction files and 8 programs) say
  something about success criteria. About 202 of them are in what the lesson
  designer reads.
- **122 are rules in their own right.** **48 repeat a rule written elsewhere**,
  and **41 more are near-repeats that carry their own condition, permission,
  strength or example** (marked "near-duplicate" or "adds" in their row). A fold
  has to keep those extra words or it loses a rule.
- **101 rows touch another topic** and are marked shared so nothing is hidden:
  mostly the slide designer's page work, the wall, vocabulary (green words, a
  lesson's own label, continuity), assumed knowledge (the fresh-example test,
  words children own, dropping a reference the board shows), the launch, support
  and release, and sticky knowledge.
- **The core rules are written many times, in different words.** "As few words
  as possible without making the child work out what they mean" six times; the
  criteria as a live reference visible while children work, seven; the same
  wording from modelling to practice, five; copy the criteria word for word
  downstream, over a dozen (slides, wall, worksheet); building the criteria
  live, six; not on a slide of their own before the My Turn, three; a table of
  facts is not the criteria, three; a word the lesson coined for something
  visible is not owned, four; working a fresh example from the steps alone,
  three. The designer's own criteria section is almost entirely copies of your
  preferences and the voice guide.
- **The home is already split three ways, and sensibly**: your preferences own
  what the criteria are for and their form, the voice guide's success-criteria
  section owns how a step reads and carries your rewrites, and the skill-lesson
  instructions own the step and table techniques, which every lesson with steps
  already reads. The fold is mostly the copies around those three.
- **Fourteen places pull against each other** (decisions 1 to 9 and 12 to 16).
  The largest: your decision 16 against the "one or two marks" limit and a
  launch check whose message offers to take the green word out; "show fewer
  criteria" against "never drop a step"; word for word on the wall against the
  wall's length limits; a worksheet reprinting the criteria, where your own 19
  September words and the log's reading of them point different ways; and one
  sentence per step against your own two-sentence rewrite, which the reviewer
  would mark as a fault.
- **Seven examples the agents copy from** are in the shapes the rules forbid,
  including the worksheet panel's and the wall's only examples of steps
  (decision 7).
- **Seven pieces of text no longer match** the plugin or your later rulings
  (decision 11).
- **Two stories are not in the build log yet** (a history panel printed on six
  slides; a science step `Explain the job electricity powers`), and a third is
  only half there (the class stuck on 346: the incident is logged, the number is
  not). Four of your criteria rulings are only in the log; the runtime carries
  the rules without your words, which is right, but one of them (19 September)
  is carried by half and goes to you in decision 8.
- **The code enforces the shape, not the wording.** It checks the three forms
  and their keys, the colour marks, the same criteria on every turn of a skill
  concept, the half-slide limit, the build-live hand-off, the helpers, the
  wall's two-line limit and the taught words in a launch's model. Nothing checks
  how a step reads (the review page prints cues), and nothing checks that a
  green word was actually taught.
- **Tests already pin a phrase in 66 rows**, the builder, worksheet and wall
  tests pin **14 more**, and **other topics' pin files hold 58 rows** of this
  topic (vocabulary 29, assumed knowledge 29, the rhythm 14, quick checks 8), so
  a fold that touches them moves those pins in the same release.
- **An independent check** (a fresh agent that did not write this list) found 36
  places the first list missed, most of them in the wall files, the slide
  catalogue and the worksheet designer's page-fit repair; 16 "duplicates" that
  carry their own condition or strength; 14 strength and scope errors; and five
  new pulls. Each was checked against the files before it went in; the three it
  got wrong are listed under "Found in passing".
- **Sixteen decisions for you** below, and four notes for later topics.

## Decisions taken (23 September 2026)

Daniel answered all sixteen in one message. His words, as given; what each
means is read back to him before any change.

1. "number one in success criteria if there's a vocabulary word it's green every time This was a recent added rule. There was a rule, I think, where the designer could decide that different words have different colors to make them stand out or verbs or I don't know, something important so it's not just all black text. That should stay too. But any vocab words that has been taught is green."
2. "I think this is because that particular situation was more of a sticky knowledge, extra facts kind of thing to use rather than being in the success criteria itself. The success criteria is literally, or well, the step-by-step -step success criteria is literally step one, do this, step two, do this, step three, do this. If one of those was if the number ends in zero, keep it, then yeah, it, sh it would stay because it's part of that step. But if it's extra knowledge, then it should be away."
3. "I'm not sure why the whole list wouldn't fit. Do you mean template wise? Do you mean helper wise? Do you mean if sentences are too big? If sentences are too big, doesn't it just do the auto fit where it makes it smaller? If you're looking at template, I swear there's been six or seven different steps in one lesson."
4. "I agree."
5. "If in a lesson, like a maths lesson, the children were having a success criteria that was a step by step. If it goes on the working wall, it should be the exact same steps. Children shouldn't have different steps on the wall compared to what they've done. However, there's also the thing where the designer chooses whether there should be a working wall or not. That doesn't mean every time there's steps that a working wall should be built, because there's still the rules about it looks at previous lessons and lessons after to decide if a wall should be built."
6. "I think I disagree. Success criteria isn't this is what a good answer does, I don't think. I think it's something the children can use to help them do the thing. that if children get stuck they can look at and use therefore I think sentence stems are that thing if anything I'd say that history rewrite doesn't do enough find something that has changed Seems okay. User detail from each source could work, but it might say a sentence stem like find something that has changed. This has changed from this source because I don't know, that's a bad example, but you get what I mean."
7. "Not sure what you mean when I said doesn't help for the children. That find the neighbor in multiples is just worded wrong. Read the question, work it out, check the answer isn't really success criteria either. Remember what I just said, it's something that they can look at and actually use to help them."
8. "I don't want any success criteria on worksheets."
9. "I don't think a two sentence step is a fault necessarily. But in that exact example, you're right. It's just naming what the step produced. And I don't want that because success criteria space is bare enough as it is."
10. "Agree. Whatever's the best home for the designer to use and read clearly."
11. "There is not a time where I want the PowerPoint slide deck to never be produced because of an error. It should work to fix it. So whatever you think."
12. "Interesting, I just spoke about this in another answer. I don't think it should be reworded. I'm sure it can figure out how to put it on."
13. "I don't think the slide designer reports back. There should be a way to make it fit. We might need to do another investigation on how to actually make it fit, even if that means a new slide template."
14. "Your suggestion."
15. "Questions can be fine as steps because they help children know what to do next or what to look for."
16. "Agree."

### Read back, and settled (23 September 2026)

His two questions were answered first: the list does not fit when long, clear
steps meet the 18 point floor and the half-slide panel at once (short steps fit,
six or seven of them); and "doesn't help" was his own 13 September words on
`Find the neighbouring multiples.`, whose rewrite was `Find the 10s or 100s each
side of your number.`. He was then asked to name any reading to change, and
changed one:

- "for number 12 same move right is a fine step it's short and snappy and it
  makes sense" (the example was in decision 15). Settled: a short question step
  such as `Same? Move right.` is fine when it tells the child what to do next or
  what to look for; so is an `If...` sentence. This turns round the 13 September
  line that listed `Same? Move right.` as a slogan to rewrite, and the voice
  guide's and the skill route's examples of it as a fault.

The other readings stand as read to him:
1. Every taught vocabulary word is green, every time, including when the word
   is also a coloured part of the picture; the designer still colours one or two
   other important words.
2. A condition that is part of a step stays in the step; extra knowledge goes to
   sticky knowledge or the teaching.
3. Never only some of a method's steps; if the list does not fit, the layout
   changes, never the list, and the build's message stops offering "fewer
   criteria".
4. As suggested.
5. On the wall, the exact same steps; the designer still decides whether a wall
   is made.
6. Criteria are what a stuck child looks at and uses to do the task, so in an
   explaining or writing lesson sentence stems count as criteria, inside or
   beside the steps.
7. The seven examples are rewritten as things a child can look at and use.
8. No success criteria on worksheets (the Below-sheet exception in 3 goes with
   it).
9. A two-sentence step is not automatically a fault; a second sentence that only
   names what the step produced goes, so his rounding example loses `That's the
   ten below.`
10. As suggested: whatever home the designer reads most clearly.
11. All seven corrected; the build never withholds a deck over the criteria.
12. The wall never rewords a step; it makes room (no picture, or two cards).
13. The slide designer never turns a table into lines and never reports back; it
    makes it fit. How to fit a very large list (perhaps a new layout) is a
    separate investigation after this topic, not started without his word.
14. As suggested. 16. As suggested.

### After the first change check (23 September 2026)

The check asked what a sheet used away from the board (cover, homework) does
now that it cannot carry the criteria; the suggestion was a line that such a
sheet writes what a child needs into its questions. His answer:

- "no overcomplications. worksheets are not homework, worksheets are delivered
  in class all the time"

Settled: no line is added. A worksheet is done in class, where the board and
its criteria are. The places that still speak of a sheet used on its own
(assumed knowledge's rows J03 and J13; the worksheets list gathers them under its decision 1 as WS-I01, I03, I04, I05, I15 and I17) belong to the worksheets
topic, whose decision 1 carries his words.

## Decisions for Daniel

What this topic needs from you. Each one says what the plugin says now, what I
think and what I suggest; "yes" takes the suggestion. Decisions 1 to 11 were in
the first list, now with the extra evidence the independent check found;
decisions 12 to 16 are pulls the check found that are yours to settle.

1. **Taught words in green inside the criteria (your decision 16, made exact).**
   - **What it says now.** Colour marks go on "usually one or two parts of a
     step", and when a word could take two colours "the picture wins, then the
     taught word". On 22 September you said every taught word goes green in the
     criteria, and the one-or-two limit is for the other marks. Two things sit
     behind that. A program already refuses a launch whose good example leaves
     out any green word in that beat's criteria, and its refusal message offers
     "or take the word out of the criteria", which is the way out that would
     undo your decision. And "taught" is defined on the slides as the lesson's
     own vocabulary cards (and a word from an earlier lesson the design says the
     class holds), not every subject noun, with answer reveals keeping their own
     green. (SC-J03, J04, J13, S07)
   - **What I think.** Writing your decision in means every taught word is
     green however many a step holds, and "one or two" limits only the picture
     colours and the orange. It also makes the launch check stricter, which is
     right, but its message should stop offering to take the word out. One case
     your decision did not cover: a taught word that is also a coloured part of
     the picture, like `tens` beside a tens column drawn in its own colour; your
     15 September order says the picture colour wins there.
   - **What I suggest.** Every taught word (the lesson's vocabulary cards)
     green, every time; the one-or-two limit for the picture and orange marks
     only; a taught word that is also a coloured part of the picture keeps the
     picture's colour; and the launch check's message drops "take the word out
     of the criteria", keeping "write the model as a child meeting the
     criteria would".
   - **Question:** is that right, including the picture colour winning for a
     word like `tens`?

2. **A case that only sometimes happens.**
   - **What it says now.** The voice guide, from your rounding rewrite on 17
     September, says an occasional case is left out of the steps and taught
     where it comes up, in the model and the script. The skill-lesson
     instructions say an occasional case "goes under the steps as a note". The
     designer's final check and the reviewer are both told to work "a case that
     takes each conditional branch and one where that branch should not
     apply", which assumes steps that sometimes do not apply. (SC-D27, D40,
     E13, E14)
   - **What I think.** The newer rule is yours: `If the number ends in 0, keep
     it` came off the rounding list because it stopped every child on every
     question. The two checks still make sense for a condition the method
     always meets (`If you have ten ones, exchange them for one ten.`), which
     stays in the steps.
   - **What I suggest.** Keep your 17 September version everywhere; the "note
     under the steps" line goes; the two checks say "each condition the steps
     name" rather than implying steps that are sometimes skipped.
   - **Question:** should an occasional case stay off the criteria, taught
     where it comes up?

3. **When the whole list does not fit.**
   - **What it says now.** Almost everywhere: keep every step, never drop,
     merge or shorten one. But several places allow less or a different shape:
     the slide instructions and the build's message say "show fewer criteria on
     this slide"; the worksheet designer may print "fewer criteria" and may
     take off "one marked required" reference when a page does not fit; the
     slide rules allow "a coherent split"; the wall's repair splits the steps
     over two cards. And one real exception exists: a Below sheet may take
     "one step at a time, the sequence chunked" when holding the steps is what
     stops a child. (SC-K05, I03, N02, N18, O22, P08, S18)
   - **What I think.** "Fewer criteria" can be read as steps 1 to 4 of a
     six-step method, which is the thing every other rule forbids: a child
     checking step 5 against a panel that stops at 4 is worse off than a child
     with no panel. Splitting the whole list in order over two cards, or two
     slides of the same task, keeps every step and is fine.
   - **What I suggest.** A method's steps are shown all together, in order, or
     not at all. On a slide, a roomier layout or the same task over two slides
     with the whole list; on a sheet, the whole panel or none, leaving it to the
     board; on the wall, the whole list (over two cards if needed) or no card.
     The one exception is a Below sheet chunking the steps because holding them
     is the barrier.
   - **Question:** apart from that Below exception, may a slide, sheet or wall
     ever show only some of a method's steps?

4. **A slide that is only the criteria.**
   - **What it says now.** Your preference: the criteria never get a slide of
     their own before the My Turn unless they themselves need teaching,
     comparing or building; they belong on the My Turn and practice slides. The
     slide rules add: no slide of just criteria between a task's introduction
     and the task. But the template guide says use the full criteria slide
     "when the criteria needs space", and the half-slide limit tells the slide
     designer, when a panel will not fit in half, to "give them that slide of
     their own". On 15 September you said that slide "is allowed to be full
     slide of course", and your Pride vertebrates lesson had the classification
     table as the whole slide. (SC-H01, H02, H04, K05, H25)
   - **What I think.** These fit together if the full criteria slide is for
     criteria being taught or built with the class (the vertebrates table, the
     exchange steps written up live), and never a place to park a method that
     did not fit beside the work. Parked there, children do the practice with
     the criteria a slide back, which is the nutrient-table problem again.
   - **What I suggest.** A criteria-only slide is for criteria being taught,
     compared or built, and it may fill the slide. When criteria are too big for
     half of a practice slide, the fix is a different layout, not a slide of
     their own.
   - **Question:** is the full criteria slide only for criteria being taught
     or built, never for overflow?

5. **Criteria built live, and the working wall.**
   - **What it says now.** Your preferences, the designer's instructions, the
     lesson contract and the hand-off check's own notes say that criteria
     marked to build live with the class are reproduced by the working wall.
     The wall designer says the mark is "evidence, not a licence": the point-at
     test decides, and one lesson's task steps do not go up even when marked.
     And a method's steps can only go up on a worked-example card, which must
     include "a finished worked example, not just steps", so a method the lesson
     never works through to a finished example has no card to go on (a labelled
     set, like the four tooth types, can go up as a poster). (SC-L01, L04, L05,
     L11, L12, O24, S17)
   - **What I think.** The wall designer's version matches your 18 September
     wall repairs: you put up 2 of 56 sheets, and the two you kept were the ones
     you could point at a week later. The promise elsewhere cannot always be
     kept.
   - **What I suggest.** Say it the wall's way everywhere: criteria marked to
     build live are offered to the wall, which puts them up when they pass the
     point-at test and a card can hold them. Whether a labelled set should get
     a card of its own is a question for the wall topic.
   - **Question:** should the build-live mark offer the criteria to the wall
     rather than promise them a place on it?

6. **Criteria in lessons where children explain, discuss or make something.**
   - **What it says now.** The core rule: criteria say what the child does or
     what good work shows; the forms are steps, a lookup table, a worked example
     or a labelled set; a table of facts is not the criteria. The discussion
     lesson instructions suggest "a table of the frames the teacher named" or "a
     sentence-stem bank" as the criteria; the task lesson instructions "a
     feature checklist"; the content lesson instructions "a feature table".
     There is nowhere in the lesson's record to store "a worked example" as the
     criteria, and the subject-file guide admits that neither steps nor a
     category set fits "explain why the Romans invaded". History's significance
     lessons give the class three questions to judge with ("How much changed.
     How many people it changed things for. And how long it lasted"). (SC-B02,
     C01, C12, C14, C16, U01)
   - **What I think.** Your history rewrite already shows the answer: `Choose
     whether you will describe play or work. / Find something that is the same
     in both sources. / Find something that has changed. / Use a detail from
     each source to show how you know.` That is a short list of what good work
     does. A stem bank is something children write with; it does not say what a
     good answer does. The significance questions are a different thing, the
     subject's own way of judging, and I would leave them as they are.
   - **What I suggest.** For explaining, discussing or making something, the
     criteria are a short list of what good work does, as steps in the child's
     words like your history ones. A stem bank or a table of frames is support
     shown beside the task, not the criteria. A worked example sits beside the
     criteria (the launch already does this), not in their place. History's
     three significance questions stay as the one subject exception.
   - **Question:** yes?

7. **Examples that show the shapes the rules say not to write.**
   - **What it says now.** Seven examples the agents copy from are in forms
     your rules rule out: the lesson record's only steps (`Read the question. /
     Choose the correct operation. / Work it out. / Check the answer.`) and the
     slide catalogue's (`Read the question. / Underline the key information. /
     Solve.`), both stage names; the worksheet panel's only example (`Read the
     question: 10s or 100s? / Find the 10s or 100s each side. / ... / Find
     halfway. Before it or after it?`), question fragments and a step the voice guide
     calls "plainer and still not runnable"; the wall's method steps (`Find the
     neighbouring multiples. / Find halfway. / Choose the closest.`), where
     `Find the neighbouring multiples.` is the step you said "doesn't help dumb
     kids"; the exchange example `No tens? Exchange first.`; the conversion
     example `× for smaller, ÷ for larger`, which names a category where the
     same instructions say name what the child sees; and the sticky example
     `Both? → overlap. Neither? → outside.` (SC-C18, C23, N20, O23, F02, F13,
     F19)
   - **What I think.** As with the vocabulary examples, an example beats a
     rule: an agent that meets four stage names writes four stage names. Two of
     these are also used as test data (the worksheet and wall examples), so
     their tests change with them.
   - **What I suggest.** Rewrite each as steps a stuck child could act on,
     keeping what each example is there to show.
   - **Question:** yes?

8. **Does the printed worksheet carry the criteria?**
   - **What it says now.** The slide rules say the criteria stay on the board
     "which is also why the sheet does not reprint them". The worksheet rules
     say print them only when the sheet must work on its own or a child could
     not start without them, and the worksheet designer may take a reference
     the board shows off a page that does not fit. A frame sheet never reprints
     them. The worksheet panel's example is titled "Use these steps to help
     you." where the board says "✓ Success Criteria". On 19 September you said:
     "I've had worksheets before that had the success criteria and I did chop
     it off. So I do think it's a kind of waste ... on a slip, I really don't
     think it's needed at all." The log entry then records that you kept the
     panel on the Expected and Below sheets, and took it off the slips only.
     (SC-H09, N01, N08, N09, N12, N18, N20)
   - **What I think.** Your words and the log's reading of them point in
     different directions for the sheet itself, so this is yours to say rather
     than mine to settle. Your words sound like "a waste on paper generally";
     the log reads them as "a waste on a slip".
   - **What I suggest.** The sheet normally leaves the criteria to the board,
     printing the panel only when the sheet will be used away from the board
     or a child's way in depends on it; slips never carry it; and when the
     panel is printed it has the board's heading.
   - **Question:** do you want the criteria on the printed sheet normally, only
     when it is used away from the board, or never?

9. **One sentence per step.**
   - **What it says now.** Three places say each step is one sentence. The
     reviewer is told "a step of two sentences, or one that explains a word or
     suggests content, is carrying teaching"; the skill-lesson instructions say
     "the usual sign is a second sentence inside one step"; and the review page
     asks about any step with two. Your own approved rounding rewrite has
     two-sentence steps: `Change the ones digit to 0. That's the ten below.`
     and `Round to the nearer ten. If it is halfway, round up.` (SC-D04, D10,
     D11, D14, D38, Q01, S12)
   - **What I think.** Those second sentences are not explanation: one names
     what the step has just produced, the other the condition that step always
     meets. As written, the reviewer would mark your rewrite as a fault.
   - **What I suggest.** Keep one sentence as the normal shape, and name the
     exception your rewrite shows: a short second sentence may say what the
     step has just produced, or give a condition the step always meets. The
     reviewer's line and the skill-lesson line say the same, and the review page
     keeps asking, as a question and not a fault.
   - **Question:** yes?

10. **One home for the rules.**
    - **What it says now.** The core rules are written several times each, in
      different words (the counts are in the summary above), and several copies
      carry something the others lack: "one action or idea per step", "a short
      reason is allowed when it tells the child what a step is for", "an
      accuracy reminder may earn its own step", "type each concept's criteria
      on its own", "keep" (where another copy says "may remain"), "a coherent
      split", "a Reflect slide". One copy is weaker than its home: the reviewer
      says a condition the method always meets "may stay" in the steps, where
      the home says it stays.
    - **What I suggest.** Your preferences' success-criteria section holds each
      rule once: what the criteria are for, when a lesson has them, the form,
      the principles of a good step, counts, the colour marks and building
      live. The voice guide's success-criteria section keeps how a step sounds,
      with your rewrites exactly as they are. The skill-lesson instructions keep
      the step and table techniques. The designer's own section keeps how to
      record the criteria and the instruction to read. The slide, worksheet,
      wall, stick-in and adaptation instructions keep their own page mechanics
      with one pointer each. Every extra condition a copy carries goes with it,
      and the reviewer's "may stay" becomes "stays".
    - **Question:** yes?

11. **Out-of-date text.**
    - **What it says now.** Seven places no longer match: the wall's picture
      guidance twice mentions a "success-criteria exception" from an older rule
      the wall's own card rules say was replaced; the template guide says the
      final slide check stops a deck over the criteria's capacity, when since 19
      September it only reports (your 10 September ruling that "too much" is a
      judgement, not a number); "Five short steps is a useful default" reads as
      a step target, which you removed on 13 September, and the build's warning
      prints the same five as what "the panel holds at a readable size"; the
      wall designer's "The 2-line cap exception above" points at nothing above
      it; and the "note under the steps" line in decision 2.
    - **What I suggest.** Correct all seven.
    - **Question:** yes?

12. **Word for word on the wall, against the wall's length limits.**
    - **What it says now.** The wall designer must copy the criteria steps
      exactly: "same number of steps, same wording", "never reword the steps",
      and if the list will not fit, omit the card. The wall's own rules say every
      item fits two lines, a worked-example step is "≤ 60 characters" (elsewhere
      "about 62"), "longer steps need splitting", and "Write it short first";
      the wall's repair says an over-long item "fits only reworded". (SC-O04,
      O18 to O22)
    - **What I think.** Your approved `Put < or > between the numbers, with the
      open side facing the greater number.` is 77 characters: it fits a card
      with no picture (about 106) but not one with a picture (about 62), and the
      budget table's own line says split it. Clearer steps came out longer on
      purpose (13 and 17 September), so the length limit and the word-for-word
      rule will keep meeting.
    - **What I suggest.** The criteria's words win: a criteria step is never
      shortened or split for the wall; the card gives the steps the room they
      need (leaving out its picture, or carrying the list over two cards), and
      only when that still fails does the card come off.
    - **Question:** should the wall ever reword a criteria step to fit?

13. **May the slide designer turn a criteria table into a list?**
    - **What it says now.** You and the designer choose the criteria's form
      (steps, a lookup table, a labelled set). The slide instructions say never
      flatten a table into prose and never change the designer's wording. But
      the template guide tells the slide designer, when a criteria table will
      not fit a narrow side panel, to "put a criteria table in a wide zone or
      give the same criteria as lines". (SC-C01, I02, I21, K43)
    - **What I think.** A lookup table the child scans (`Hours → minutes? ×
      60`) becomes a different thing as lines; changing it is a teaching
      decision made by the one agent not allowed to make them.
    - **What I suggest.** The slide designer puts a criteria table in a wide
      zone; "give the same criteria as lines" goes; if no layout holds the
      table, it reports that back rather than reshaping it.
    - **Question:** yes?

14. **A second method folded into another's criteria.**
    - **What it says now.** When one method uses another inside it (convert,
      then compare), the second concept's criteria carry "the key decision cues
      from Concept 1", "not the full SC verbatim, but enough to trigger the
      right procedure". Elsewhere: a reworded step "reads to a child as a new
      rule", and wording must not drift "even slightly". (SC-F13, F11, M01)
    - **What I think.** The folded cues are a shorter, reworded copy of steps
      the class has just used, which is the drift the other rules warn about,
      and they tend to be the stage-name shape (`pick your fact`) your rewrites
      removed.
    - **What I suggest.** When the first method's steps are needed inside the
      second, carry the ones that are needed in the first method's own words,
      rather than a compressed version.
    - **Question:** yes?

15. **A branch written as a question, or as a sentence?**
    - **What it says now.** The skill-lesson instructions say "Phrase each
      branch as the question the child asks" (`Is the answer missing?`) and
      allow "a short decision list". The voice guide says write a condition as a
      sentence, not a slogan (`If they are the same, compare the hundreds.`, not
      `Same? Move right.`), and the review page flags a question-fragment
      condition in a step. (SC-F05, F06, D16, D44, S12)
    - **What I think.** Both are right in their place: a question works in a
      lookup table the child scans row by row; in a list of steps the child
      runs, the sentence is clearer. The rules just do not say where each
      belongs, so a decision list written as steps gets both.
    - **What I suggest.** Questions for the rows of a lookup table; `If...`
      sentences for conditions inside steps.
    - **Question:** yes?

16. **Naming a step the class was taught earlier today.**
    - **What it says now.** One rule: a step may name a method without saying
      how "only when that sub-procedure is secure from earlier lessons"; when
      it is today's new learning, the step says how. Another, in the same
      section: name "a familiar or just-taught action only when children
      genuinely know how to carry it out". (SC-E11, E12)
    - **What I think.** "Just-taught" lets a step name something taught twenty
      minutes ago, which the first rule rules out. The skill instructions
      already have the rounding lesson's main list start with its short cycle's
      own steps, word for word, which says how rather than naming it.
    - **What I suggest.** Keep the first rule: only a method secure from earlier
      lessons may be named without saying how; "just-taught" comes out.
    - **Question:** yes?

For later topics, found while listing this one:

- **Slides (topic 9).** The same colour marks mean different things on a slide
  and inside the criteria, and the slide catalogue bans a green marker on the
  teaching slides the criteria sit on; one slide rule says green is only for
  revealed answers and vocabulary headings, where your preferences add every
  taught word and the criteria panel. A `steps` object may carry its own
  "✓ Success Criteria" heading in a free zone, where other rules say wrap the
  criteria in the green panel. Splitting a set over two slides repeats "every
  still-needed live reference", where the criteria rule says not every part of a
  split by default. A worked method frame draws a second green box beside the
  criteria panel.
- **Adaptation (topic 9).** Nothing says whether a Below sheet carries the class
  criteria, and the adaptation's final check lists the criteria but asks
  nothing about them.
- **Wall (topic 9).** An English worked-example card relabels the criteria's
  numbered steps "What", "Why", "How".
- **Voice (topic 8).** The voice guide's calibrated criteria example gives its
  reasons as "imperative, specific, economical", which predates "clear first";
  it is your example and stays exactly, but the reasons under it may want your
  eye.

---

## A. What the criteria are for

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-A01 | «A live reference, not a framing for what's about to happen. Success criteria earns its place by being visible *while* children work — so they can consult it as they apply it.» | every lesson that has criteria | must | | `references/preferences.md` › Success Criteria · L429. Copies: SC-A02 to SC-A07 | rule (the home sentence) | PREF-SC |
| SC-A02 | «**Success Criteria** — a live reference, form follows the task, and the draw-live marking for wall-worthy references.» | the contents list agents choose sections by | pointer | heading `Success Criteria` (review routing card) | `references/preferences.md` › Contents · L24 | pointer; "wall-worthy" pulls against the wall's own test (decision 5) | STAYS (contents) |
| SC-A03 | «`preferences.md` → Success Criteria governs form: a live reference children consult while they work, shaped by the task rather than defaulting to numbered steps, with process (how-to steps, modelled) and recognition (a labelled set of categories, shown) told apart. Read it before deciding; type each concept's criteria on its own.» | the designer, before choosing criteria | must (read) | | `agents/lesson-designer.md` › Success Criteria Types · L285 | pointer summarising A01, C01 and C04 | LD-SC |
| SC-A04 | «The success criteria belongs on this slide as a live reference, visible while the teacher models — so children see each criterion in use as they read it. For a procedure that is the steps being demonstrated; for a recognition skill it is the labelled set being matched against.» | a skill lesson's My Turn | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L39 | near-duplicate of A01: adds that the criteria are up while the teacher models, not only while children work | SKILL |
| SC-A05 | «## 9. Success criteria are a live reference» | the slide designer | pointer | | `references/slide-composition-playbook.md` › 9 · L238 | heading restating A01 | STAYS (slides) |
| SC-A06 | «The success criteria here is the standard for the task itself — what makes a good fair-test plan, a strong bridge, a clear opening paragraph — and it stays visible while children work, because it is the thing they are aiming at, not a recap of what was taught.» | a task-centred Set the Task | must | | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L13 | near-duplicate of A01: adds "the standard for the task itself" and "not a recap of what was taught" | ROUTE |
| SC-A07 | «**Success criteria** is the standard for the task, kept visible throughout.» | task-centred lessons | must | | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L41 | near-duplicate of A06: wider ("kept visible throughout"), which read literally pulls against H05 (off the answer slide) and H07 (not on every part of a split) | ROUTE |
| SC-A08 | «This is the same instinct as keeping success criteria visible while children work: the thing the task refers to has to be where they can see it.» | a structure a task points at | | | `references/preferences.md` › Slide Philosophy › Lesson Designer content boundaries · L561 | shared (Slide Philosophy); uses A01 as its reason | STAYS |
| SC-A09 | «- Provide an answer, model, success criteria or another suitable comparison standard where the outcome is definite or exemplifiable. Do not prescribe whether the teacher live-marks, self-marks or examines work later.» | a task with a definite or exemplifiable outcome | must; must not (prescribe marking) | | `references/evidence-synthesis.md` › 4. Independent Practice · L105 | shared (evidence synthesis): criteria as one kind of comparison standard | STAYS |
| SC-A10 | «Use standard classroom names: success criteria, vocabulary, starter, reference table, steps. No metaphors for structural components.» | naming components | must | | `agents/lesson-designer.md` › Name Things Plainly · L66 | shared (naming; the same sentence is VOC-J16) | STAYS |
| SC-A11 | «Use this guide when writing pupil-facing teaching resources in the teacher's voice: lesson slides, worksheets, questions, worked examples, model answers, success criteria, sentence stems and task instructions.» | | pointer | | `references/teacher-voice.md` › Purpose · L5 | pointer | STAYS |
| SC-A12 | «the per-resource voices (model answers, worked examples, success criteria, practical lessons)» | authoring child-facing wording | pointer | | `references/preferences.md` › Written Voice (House Style) · L37 | pointer to teacher-voice §10 | STAYS |

## B. When a lesson has criteria, and when it does not

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-B01 | «**Success criteria** in content-based lessons. A procedure is not required for a useful reference. When children need one, show the features or decisions that distinguish a successful performance and keep it visible during Practise.» «Simple familiar tasks need no separate criteria.» | content-based lessons; a simple familiar task needs none | may / default | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L59 | rule; one of four places that let a task have no criteria (B02, B05 and B06 are the others) | ROUTE (and PREF-SC for the general "when") |
| SC-B02 | «**Success criteria** in dialogic lessons. Often not needed as a procedural list — there's no method to step through. When appropriate, use a reference table of the frames the teacher named during Synthesise (so children writing the Reflect can lean on the language that emerged), or a sentence-stem bank kept visible during the Talk phase.» | dialogic lessons | may | | `references/teaching-sequence-dialogic.md` › Teaching Sequence Specification · L46 | rule; decision 6 (a table of frames or a stem bank as the criteria) | ROUTE |
| SC-B03 | «**One concept, one SC.** Each concept teaches one thing end-to-end and carries one success criteria.» «If you find yourself wanting to write two SCs for one concept (one for output X, one for output Y) that's the signal that you've got two procedures sharing a concept, not one — split them into two concepts at the structure level (`lesson-designer.md` → Structure Decision, `Splitting axis when LO names multiple outputs`).» | every skill concept | must (code: a Skill-based concept must name criteria) | `concepts[].successCriteriaRefs` | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L174. Copies: SC-B10, SC-S04 | rule; the form sentence between these two is SC-C10 | SKILL |
| SC-B04 | «That recording is still its own concept with its own success criteria when it carries genuinely new learning, but it does not automatically earn a full second cycle» | a skill concept that records what children have just done | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L81 | shared (the skill route's cycles) | STAYS |
| SC-B05 | «Define it once, with `successCriteriaRefs` as `[]` when no criteria belong to it» | an idea named as a concept in any route but skill | mechanics (code) | `concepts[].successCriteriaRefs` | `references/output-template.md` › Success criteria · L336. Copy: SC-B06 | mechanics | OT |
| SC-B06 | «`successCriteriaIndexes` may be `[]` when no criteria belong to the idea» | the scaffold request | mechanics | `successCriteriaIndexes` | `references/lesson-design-scaffold.md` › Success criteria and Skill-based concepts · L121 | the same meaning as B05 for a different field and program (tests pin both), so it cannot fold into B05 | STAYS |
| SC-B07 | «- the success-criteria form and the fresh worksheet evidence children produce;» | the walk-through's closing decisions | mechanics (record) | | `agents/lesson-designer.md` › Write the lesson, then the contract · L422 | recording | LD-SC |
| SC-B08 | «Include an Our Turn unless guided participation would remove no barrier the model and success criteria have not already removed» | the Our Turn omission test | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L79 | shared (the rhythm); the criteria count as support that can make an Our Turn unnecessary | STAYS |
| SC-B09 | «The LO's success criterion is *the child can articulate and justify a position*, not recall a fact or perform a skill.» | choosing the dialogic route | | | `references/evidence-synthesis.md` › Dialogic / Scenario-based (children form and justify · L233 | shared (route choice): "success criterion" here means what success is, not the panel | STAYS |
| SC-B10 | «Failure: splitting on directional gives concepts each teaching two procedures, SC covers both, modelling walks two writes per turn, child never sees one procedure clean. Splitting on output gives one clean procedure, one SC, modelling demonstrates act in full.» | a lesson whose objective names more than one output | must | | `agents/lesson-designer.md` › Structure Decision · L154 | near-duplicate of B03 (the designer's side of "one concept, one SC") | STAYS (structure) |

## C. The form follows the task

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-C01 | «**The success criteria is whatever a child has to look at to get *this* task right — its form follows the task, so don't default to a list of steps.**» «When the task is carrying out a procedure, the steps are what the child checks against. But when the task is recognising, naming, or classifying — name this turn, name this word class, sort this shape — there is no procedure to step through; what the child checks an instance against is the **labelled set of the categories themselves**.» «There the most useful criteria is that set shown and labelled, and it is usually a visual reference or helper rather than a column of imperatives» «So success criteria can be how-to steps, a lookup table, a worked example, or a labelled reference/diagram; pick the form by what a child must glance at to succeed, and use more than one form when both genuinely help.» | every lesson's criteria | must | `type`: `steps`, `reference-table`, `labelled-reference` (none for a worked example) | `references/preferences.md` › Success Criteria · L435. Copies: SC-C06, C08, C10, C11 | rule; its "worked example" has no type in the contract (decision 6) | PREF-SC |
| SC-C02 | «**Criteria say what the child does, or what good work shows. A table of facts the child reads is a representation, not the criteria, even when the task uses it.**» «A nutrient table (Foods, Nutrients, How they help) tells a child what carbohydrates do; it does not tell them what a good packed-lunch plan contains, so it is `rep-00x` and the criteria for that task are the three things a plan must do (choose foods that help in different ways, name each one, add an arrow saying how it helps).» «Keep the reference in its own zone under its own name and put the criteria under the criteria label. The one case where a labelled set IS the criteria is recognition: naming this tooth, this turn, this word class, where matching the instance to the named categories is the whole judgement.» | every lesson's criteria | must | `representations` (`rep-###`) | `references/preferences.md` › Success Criteria · L437. Copies: SC-C07, SC-I17, SC-Q01 | rule with its example | PREF-SC |
| SC-C03 | «A Year 4 PSHE lesson labelled the nutrient table "Success Criteria" on the working slide and left the real steps on the launch slide before it, so children drew with the facts in front of them and the standard one slide back (8 September 2026).» | illustrates C02 | | | `references/preferences.md` › Success Criteria · L437 | story (in the log, 4.2.109) | LOG |
| SC-C04 | «**The discriminator is whether there is a method to carry out or only an instance to match against a set, and if the content disagrees with the type you picked, the type is wrong.**» «Reading or deriving an attribute — counting a shape's sides, finding which sides are equal or parallel, which corners are right angles, working out a duration — is a **process**: its criteria is how-to steps the child performs, and it is taught by modelling the method on an example rather than by displaying the finished attributes as a set.» «One lesson often holds both, one per concept ("classify quadrilaterals" reads the properties first, a process, then names the shape from them, a recognition), so type each concept's criteria on its own. The tell that a process has been mislabelled as a labelled reference: the "reference" comes out as a column of imperatives ("count the sides", "check for equal sides"). Those are how-to steps, so reclassify, and let the teaching model them rather than list them.» | every criteria object | must / check | | `references/preferences.md` › Success Criteria · L451. Copies: SC-C08, C09, C10 | rule | PREF-SC |
| SC-C05 | «When the recognition turns on two independent attributes the child reads separately — size *and* direction, shape *and* orientation, number *and* unit — show each attribute's full set on its own (the four turn sizes; then, separately, what clockwise and what anticlockwise look like), not a handful of specific combinations.» «Separate axes always match the instance in front of the child and give a clean lookup for each decision; a fixed set of combos is longer, cannot cover every pairing, and reads wrong when it shows one combination beside a question that is a different one.» | a recognition that turns on two attributes | must | | `references/preferences.md` › Success Criteria · L453 (only copy) | rule | PREF-SC |
| SC-C06 | «**Criteria slot renders any content object**, so labelled visual reference fully available - row of labelled diagrams, labelled image, small table - not only steps list. Choose more than one form when both help. Where helps child see turn built from quarter turns, turn-diagram's countMarks numbers quarters on size reference: useful on reference and teaching diagrams, not questions.» | the designer choosing a form | may | `countMarks` | `agents/lesson-designer.md` › Success Criteria Types · L287 | near-duplicate of C01: the `countMarks` advice is only here | LD-SC (the helper detail) |
| SC-C07 | «**Criteria say what the child does or what good work shows; a table of facts the task uses is a representation.** The nutrient table children read while planning a lunch is `rep-00x`; the criteria are what the plan must do. Recognition (name this tooth, this turn) is the one case where the labelled set is the criteria.» | as C02 | must | | `agents/lesson-designer.md` › Success Criteria Types · L289 | duplicate of C02 | PREF-SC |
| SC-C08 | «The My Turn and Our Turn then identify instances *against* that displayed set, and the displayed, labelled set is the live reference the success criteria carries (`preferences.md` → Success Criteria owns that form choice and its why).» | a recognition skill | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L35 | shared (the skill route's recognition teaching); points at C01 | STAYS |
| SC-C09 | «`preferences.md` → Success Criteria sets the discriminator between the two kinds of skill (a method to carry out is a process; an instance to match against named categories is recognition) and one lesson often holds one of each.» «It is not taught by putting the finished attributes on the slide as a labelled list.» | a skill lesson with a process | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L37 | pointer to C04, plus how a process is taught (shared, modelling) | STAYS |
| SC-C10 | «When that thing is a procedure, its SC is the procedure as a numbered list — short verb-first imperatives, one action per step; when it is a recognition or classification (naming a turn, sorting a word class), its SC is the labelled reference set, per `preferences.md` → Success Criteria.» | a skill concept | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L174 | duplicate of C01 and C04; its "short" has no "clear first" beside it | PREF-SC |
| SC-C11 | «Choosing the *form* of the success criteria (how-to steps, a reference table, or a labelled set the child matches an instance against) is governed by `preferences.md` → Success Criteria, which the lesson-designer reads every run; what follows is how to write the steps once that form is chosen.» | writing steps | pointer | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L122 | pointer; names three forms where C01 names four (no worked example) | SKILL |
| SC-C12 | «Keep the format appropriate to the work; a feature table is valid and numbered steps are not compulsory.» | content-based lessons | may | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L59 | near-duplicate of C01: names "a feature table", a form C01 does not list (decision 6) | ROUTE |
| SC-C13 | «Match the task's actual conditions: a comparison requiring two sources needs guidance on using both and comparing matching aspects, not only definitions of comparison terms.» | content-based criteria | must | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L59 (only copy) | rule | ROUTE, or PREF-SC |
| SC-C14 | «Use how-to steps when the task turns on a clear move (the fair-test sort); a feature checklist when it's a product or a piece of writing.» | task-centred criteria | default | | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L41 | near-duplicate of C01: names "a feature checklist" for a product, a form C01 does not list (decision 6) | ROUTE |
| SC-C15 | «Rules about success rates, about a concept being a procedure with steps, about fluency preceding reasoning, about reference material coming off before independent work, and about success criteria being either a method or a category set are the ones most likely to collide with a subject taught a different way.» | writing a subject file | | | `references/authoring-subject-files.md` › They add; they never overrule · L23 | maintainer; names C04 as a known collision | STAYS |
| SC-C16 | «Success criteria being either a procedure or a labelled category set, when neither fits "explain why the Romans invaded".» | writing a subject file | | | `skills/make-subject-file/SKILL.md` › Stage 8: The collisions · L241 | maintainer; the same gap (decision 6) | STAYS |
| SC-C17 | «Define each success-criteria object once.» «How-to steps:» «Reference table:» «Labelled reference:» | recording criteria | mechanics (code: exact keys) | `successCriteria[]`: `id` `sc-###`, `type`, `drawLive`, `content`; `steps`; `columns` and `rows`; `items` with `label`, `text`, `representationRef`, `configuration` | `references/output-template.md` › Success criteria · L259 | mechanics | OT |
| SC-C18 | «"Read the question.", "Choose the correct operation.", "Work it out.", "Check the answer."» | the contract's only example of steps | | | `references/output-template.md` › Success criteria · L270 | example; contradiction (decision 7): stage names of the kind group D calls the commonest miss | OT (replace) |
| SC-C19 | «`criteria` (a content object: `steps`, `table`, `bullets`, `vocab`, or `image`).» | the standalone criteria slide | mechanics | template `success-criteria` | `references/templates.md` › `success-criteria` · L412 | mechanics | STAYS (slides) |
| SC-C20 | «Putting the diagram on the slide keeps its labels where the child reads them, on the diagram, so the success criteria stays the pure method and reads identically across My Turn, Our Turn and Your Turn, instead of the labels migrating into the Your Turn's criteria text because the diagram had nowhere else to live.» | a practice slide that sorts onto a diagram | must | `questionVisual` | `references/slide-representations.md` › Practice sorts · L43. Copy: SC-C21 | rule: a sort's labels are not criteria | STAYS (slides) |
| SC-C21 | «so the diagram and its labels sit on the slide where the child works, not described in words inside the success criteria» | `maths-your-turn-sc` | mechanics | `questionVisual` | `references/templates.md` › maths-your-turn-sc · L214 | near-duplicate of C20, wider: its line covers any diagram the child must read (a Venn or Carroll, a coordinate grid, a dial) | STAYS |
| SC-C22 | «Unlike the SC method, which is the constant thread across the concept, the sort criteria are meant to change between moments» | sorting labels | must | | `references/slide-representations.md` › Practice sorts · L45 | rule; "criteria" here are a sort's labels, and the sentence also restates F12 | STAYS |
| SC-C23 | «{ "type": "steps", "steps": ["Read the question.", "Underline the key information.", "Solve."] }» | the slide catalogue's only example of `steps` | | `steps` content object | `references/templates.md` › `steps` · L735 | example; decision 7 (stage names, the same shape as C18) | TPL (rewrite) |

## D. How a step reads: clarity first, then brevity

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-D01 | «**Criteria use as few words as possible without making the child work out what they mean.** Clarity comes first and brevity second: a child stuck on a question, with the teaching over, has only the panel's own words, so each step has to tell them what to do next rather than name the stage they are at.» | every step | must | | `references/preferences.md` › Success Criteria · L439. Copies: SC-D08, D09, D10, D31, D36, Q01 | rule; your principle, from your Notion page (13 September, in the log as 4.2.183) | PREF-SC (principle), TV10 (how it sounds) |
| SC-D02 | «The user rewrote a run of real five-step lists that were exactly this, short, stable and vague, and every rewrite came out longer and plainer (September 2026).» | illustrates D01 | | | `references/preferences.md` › Success Criteria · L439 | story (in the log, 4.2.183) | LOG; the reason can stay undated |
| SC-D03 | «`teacher-voice.md` → Success criteria owns how a step reads and carries those rewrites; read it before writing steps.» | before writing steps | must (read) | heading `# 10. Success criteria` | `references/preferences.md` › Success Criteria · L439. Copies: SC-D30, D31, D42 | pointer | PREF-SC |
| SC-D04 | «There is no word target and no step target: use as many steps as the method has, each one sentence with only the words it needs, and leave a step that is already clear alone.» | every list | must | | `references/preferences.md` › Success Criteria · L439. Copies: SC-D11, D22, D25, D31, D36 | rule; "each one sentence" meets your own two-sentence rewrite in D14 (decision 9) | PREF-SC |
| SC-D05 | «Cut explanation already supplied by the teaching and repeated equipment alternatives, never the words that make a step runnable.» | every step | must | | `references/preferences.md` › Success Criteria · L439. Copies: SC-D08, D24, D38, D39 | rule | PREF-SC |
| SC-D06 | «A condition the method always meets stays in the steps as a plain `If...` sentence; use a lookup table when several cases are easier to scan there.» | a condition inside a method | must | | `references/preferences.md` › Success Criteria · L439. Copies: SC-D16, D27, D31, D40, F04 | rule | PREF-SC |
| SC-D07 | «Table cells stay as short as a scan allows, and a row names the content the child sees rather than an abstract category.» | a lookup table | must | | `references/preferences.md` › Success Criteria · L439. Copies: SC-F04, F08 | rule (the table mechanics are in F) | PREF-SC, pointing at SKILL |
| SC-D08 | «**Success criteria are clear actions, not miniature explanations and not shorthand.** Keep one action or idea per step. Use direct actionable verbs. The reasoning for a step belongs in the teaching that established it, not appended to the success-criteria line simply to make the line more complete; the words that make the step runnable stay (Success Criteria below).» | every step | must | | `references/preferences.md` › Written Voice › Core rules · L73 | near-duplicate of D01 and D05: adds "one action or idea per step" and "direct actionable verbs", and is read by every author of child wording, not only the designer | PREF-SC, a pointer left in Written Voice |
| SC-D09 | «**Simple must still be intelligible.** Success criteria are short runnable actions.» | slides | must | | `references/preferences.md` › Slide Philosophy › Lesson Designer content boundaries · L553 | duplicate of D08; says "short" without D01's "clarity first" | a pointer |
| SC-D10 | «**Use as few words as possible without making the child work out what you mean.** Both halves bind. A step is one imperative sentence, written for a child using it alone once the teaching has moved on, so it has to carry enough of the method that the child could follow it without the teacher translating it, and no more: the panel sits beside the work, and every extra word is read by every child on every question. Shorten until the meaning would start to weaken, then stop.» | every step | must | | `references/teacher-voice.md` › 10. Success criteria · L627 | near-duplicate of D01: adds "one imperative sentence", "every extra word is read by every child on every question" and "shorten until the meaning would start to weaken, then stop" | TV10 |
| SC-D11 | «The user's own approved steps are each a single sentence, most of them four to ten words and none longer than about fourteen; that is a calibration of what clear-and-short looks like, not a target to reach. A step that needs a second sentence is usually two steps, or is carrying an explanation the teaching already gave.» | every step | check | the packet's 16-word cue (SC-S12) | `references/teacher-voice.md` › 10. Success criteria · L627 | your example (a calibration, not a target); "each a single sentence" meets D14 (decision 9) | TV10 |
| SC-D12 | «Prefer: - `Describe what can be seen and heard.` - `Use expanded noun phrases.` - `Choose powerful verbs.` - `Check capital letters, full stops and commas.`» «Do not default to: > I can use expanded noun phrases.» | writing criteria | default ("do not default to") | | `references/teacher-voice.md` › 10. Success criteria · L629 | your example; the one place that steers criteria away from "I can" statements, as a default rather than a ban (the LO rule at lesson-designer L180 is separate) | TV10 |
| SC-D13 | «Those four are short and already clear, because each names a move the class has been taught in words the class owns. That is what brevity looks like when it is earned. The failure this section exists for is the opposite one: a step made short by leaving the meaning out.» | every step | check | | `references/teacher-voice.md` › 10. Success criteria · L638 | rule (AK-G27) | TV10 |
| SC-D14 | «**Short but vague is the commonest miss.** A tidy five-step list of three-word cues looks finished and still leaves a child decoding every line. The user rewrote real lists like these:» «> Read the step size. / Count on across each space. / Check the next label. > became > Work out what each jump is worth. / Add that amount for each jump. / Check the numbers follow the same pattern.» «> Same? Move one place right. / Different? Choose < or >. > became > If they are the same, compare the hundreds. / Put < or > between the numbers, with the open side facing the greater number.» «> If the number ends in 0, keep it. / Otherwise, write the multiple of 10 just below it, then add 10 for the next one. / Mark the number and the midpoint on a number line. / Choose the nearer multiple of 10. If it's halfway, choose the greater one. > became > Change the ones digit to 0. That's the ten below. / Add 10. That's the ten above. / Mark halfway and your number. / Round to the nearer ten. If it is halfway, round up.» | every list | check | tests pin these rewrites | `references/teacher-voice.md` › 10. Success criteria · L640 | your example (your approved rewrites, which stay exactly); three of its steps are two sentences (decision 9) | TV10 |
| SC-D15 | «- **Name the actual action and what it acts on.** `find`, `work out`, `add`, `compare`, `write`, `check`, with the thing: `Compare the thousands digits first.`, not `Start with the thousands.`» | every step | must | | `references/teacher-voice.md` › 10. Success criteria · L656 | rule with example | TV10 |
| SC-D16 | «- **Write a condition as a sentence, not a slogan.** `If they are the same, compare the hundreds.` is barely longer than `Same? Move right.` and needs no unpacking.» | a condition inside a step | must | the packet's question-fragment cue (SC-S12) | `references/teacher-voice.md` › 10. Success criteria · L658 | rule with example; F02, F13 and F19 carry examples in the slogan or category form (decision 7) | TV10 |
| SC-D17 | «- **When the child has to choose, give the rule that decides the choice.** `Choose < or >` names the decision; `with the open side facing the greater number` lets the child make it. A step that decides something also says what the decision changes on the page: `Decide which of those marks your number is nearer.` leaves the child with an answer and nowhere to put it, and a final `Place a sensible estimate.` does not say what makes it sensible. Put the consequence in the step, such as putting the mark closer to that number.» | a step that decides | must | | `references/teacher-voice.md` › 10. Success criteria · L659 | rule with example (the consequence half is 4.2.209) | TV10 |
| SC-D18 | «- **Name what a pronoun stands for.** `Divide by that many spaces` makes the child remember what `that` was. `Count on and check` does not say what to count on by; `Count on using the answer to check` does.» | every step | must | | `references/teacher-voice.md` › 10. Success criteria · L660 | rule with example | TV10 |
| SC-D19 | «- **Show the arithmetic when the step is a calculation.** `Larger number - smaller number.` and `Difference ÷ number of spaces.` are more immediate than `Find their difference.` and `Divide by that many spaces.` Notation is not less child-friendly than prose when it is what the child writes.» | a calculation step | default | | `references/teacher-voice.md` › 10. Success criteria · L661 | rule with example | TV10 |
| SC-D20 | «- **Follow the thinking the child actually does, in that order, outside maths too.** A history comparison became `Choose whether you will describe play or work. / Find something that is the same in both sources. / Find something that has changed. / Use a detail from each source to show how you know.` The broad stages it replaced (`Compare then and now.`, `Match play with play, work with work.`) named the job without saying how to do it. A short reason is allowed when it tells the child what a step is for (`to show how you know`).» | every list, every subject | must; may (a short reason) | | `references/teacher-voice.md` › 10. Success criteria · L662 | rule, your example; its "a short reason is allowed" is a permission D08 and D24 lack (they send the reasoning to the teaching), so a fold must keep it | TV10 |
| SC-D21 | «- **Clear is not long.** The rounding list above got shorter as it got clearer: the rare case left the list, the step children could not do said how in their own words, and the teacher had found the longer version too wordy for what the class actually did (17 September 2026). When a plainer step is also a longer one, look for the shorter way to say how.» | every list | default (a check) | | `references/teacher-voice.md` › 10. Success criteria · L663 | rule; your ruling, dated (in the log, 4.2.221) | TV10 (your words, without the date) |
| SC-D22 | «- **Use as many steps as the method has.** Four clear steps are better than five padded or split ones, and six necessary ones are better than five that merge two actions.» | every list | must | | `references/teacher-voice.md` › 10. Success criteria · L664 | duplicate of D04, with its example | TV10 |
| SC-D23 | «These examples show the moves; they are not wording to reuse in another lesson.» | the examples above | must not | | `references/teacher-voice.md` › 10. Success criteria · L666 | rule (limit on D14 to D22) | TV10 |
| SC-D24 | «What a criterion leaves out is explanation the teaching already gave: why the step works, what a word means (`Above the equator means the Northern Hemisphere`), repeated equipment alternatives, examples of what the child might write, a second sentence restating the first. What it keeps is every word that makes the step runnable.» | every step | must | | `references/teacher-voice.md` › 10. Success criteria · L676 | near-duplicate of D05: adds "what a word means", "examples of what the child might write" and "a second sentence restating the first" | TV10 |
| SC-D25 | «**A step that is already clear is finished.** The repair above is for steps that leave a child guessing, not a licence to lengthen every step. `Use expanded noun phrases.` in a writing lesson that has taught them needs nothing added, and `Use expanded noun phrases to describe the trees, the path and the shadows.` is worse: it spends words and starts choosing the child's content. Ask of each step whether a stuck child could act on it; only where the answer is no do words go in, and only the words that answer it.» | every step | must | | `references/teacher-voice.md` › 10. Success criteria · L680 | rule with example (the limit on D14 to D22) | TV10 |
| SC-D26 | «**Read each step as an instruction to the weakest child in the class.** Short, imperative and specific is the shape of a step and not the test of one, so a step can have that shape and still fail in front of a child who is stuck.» «`Find the neighbouring multiples.` is four words, imperative and exact, and `neighbouring multiples` is a phrase a struggling Year 4 does not hold, so the step tells them nothing they can do. `Find the 10s or 100s each side of your number.` is plainer and still not runnable, because it names what to find without saying how, and a Year 4 class stuck on 346 had nothing to act on (17 September 2026). `Change the ones digit to 0. That's the ten below.` then `Add 10. That's the ten above.` says how, in words they own.» | every step | check | | `references/teacher-voice.md` › 10. Success criteria · L682 | rule; story (in the log: 4.2.146 for `neighbouring multiples`, 4.2.221 for 346); the rest of this paragraph is E04 and G03 | TV10 |
| SC-D27 | «**A condition that does not happen every time is not a step.** `If it is already a multiple, keep it.` is true and useful and it is not part of running the method, so as step 2 of six it stops every child on every question to rule out a case most of them do not have. A condition the method meets every time stays in the steps as a sentence (`If you have ten ones, exchange them for one ten.`); a case that comes up occasionally is taught where it comes up, in the model and the script, and left out of the steps. Often the method already covers it: a number ending in 0 is its own ten below, so it sits on the end of the line and stays.» | an occasional case | must | | `references/teacher-voice.md` › 10. Success criteria · L684 | rule; contradiction with D40 (decision 2) | TV10 |
| SC-D28 | «Where a class needs more support, the support goes in the step's own words rather than in an explanation after it:» «> Start a sentence with a fronted adverbial.» «> Try starting some of your sentences in different ways, for example with a fronted adverbial.» «The first names the move the child makes. The second describes it, and by the time a child has read it they have lost the thread of the writing.» | a class that needs more support | must | | `references/teacher-voice.md` › 10. Success criteria · L686 | rule with example | TV10 |
| SC-D29 | «## E. Success criteria» «**LO: Write a setting description**» «- Describe what can be seen and heard. - Use expanded noun phrases. - Use powerful verbs to describe movement. - Check capital letters, full stops and commas.» «Why it fits: - imperative; - specific; - economical.» | read when wording stays uncertain | | | `references/teacher-voice.md` › 16. Calibrated examples › E · L881 | your example; near-duplicate of D12 (`Use powerful verbs to describe movement.` where D12 has `Choose powerful verbs.`); its three reasons predate "clear first" (found in passing) | TV (stays exactly) |
| SC-D30 | «success criteria §10» | the voice guide's reading route | must (read) | heading `# 10. Success criteria` | `references/teacher-voice.md` › How to read this file · L20 | pointer | STAYS |
| SC-D31 | «Use as few words as possible without making the child work out what you mean: each step is one sentence that tells a stuck child what to do next, not which stage they are at, a step already clear is left alone, and there is no word or step target.» «A condition the method always meets stays in the steps as an `If...` sentence; a lookup earns its place when it makes several cases easier to follow. `teacher-voice.md` → Success criteria carries the user's own rewrites of short-but-vague steps. `preferences.md` → Success Criteria owns these judgements and `teaching-sequence-skill-based.md` → Writing the Success Criteria the mechanics.» | the designer writing steps | must | | `agents/lesson-designer.md` › Success Criteria Types · L289 | duplicate of D01, D04, D06 and D25 | LD-SC (pointer only) |
| SC-D32 | «Check form: Teach visually heavy or asks processing several distinct ideas before act, SC step carrying justification, question extra wording obscuring task = content in wrong form for board.» | the designer's form check | check | | `agents/lesson-designer.md` › Lesson Components · L162 | near-duplicate of D08 as a tell | STAYS (the designer's check) |
| SC-D33 | «**Writing steps of procedure SC:** Mechanics (phrasing each step as a clear child-doable action, saying how whenever the move is new, branch tables child can run, keeping steps identical across My/Our/Your Turn, folding Concept 1 cues into wrap-around Concept 2) live in `teaching-sequence-skill-based.md`, under Writing the Success Criteria. Recognition forms need none.» | a procedure's steps | pointer | heading `Writing the Success Criteria` | `agents/lesson-designer.md` › Success Criteria Types · L293 | pointer that summarises part of group F | LD-SC |
| SC-D34 | «**Steps-shaped criteria in a non-skill lesson still need those mechanics.**» «So whenever your criteria come out as steps and your route is not skill-based, read only the `Writing the Success Criteria` section of `teaching-sequence-skill-based.md`, not the file. Each step is a clear action the child performs in the words they would use: `Explain what the electricity does`, never a noun phrase with the verb buried at the end.» | steps in any route but skill | must (read) | heading `Writing the Success Criteria` | `agents/lesson-designer.md` › Success Criteria Types · L295 | rule (the reading route for non-skill lessons) | LD-SC |
| SC-D35 | «and a real Year 4 Science content lesson chose them and produced `Explain the job electricity powers` - a step nothing anywhere told it how to phrase.» | illustrates D34 | | | `agents/lesson-designer.md` › Success Criteria Types · L295 | story (undated). **Not in the build log** | LOG (copy it there first) |
| SC-D36 | «**Writing how-to steps:** Each step is one verb-first action, written so that a child who is stuck, with the teaching over, can do it from the words alone. Use as few words as possible without making the child work out what you mean; `teacher-voice.md` → Success criteria owns how a step reads and carries the user's own rewrites, so read it before writing steps. There is no word or step target. The review packet raises long steps and long lists for a reread, which is not a rejection and not a request to shorten. Do not compress two distinct actions into one vague instruction, or call a method two concepts merely to fit a panel.» | writing steps | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L124. Its next two sentences are copies of SC-F11 and SC-K07 | near-duplicate of D01 and D04: adds "verb-first", "do not compress two distinct actions" and "or call a method two concepts merely to fit a panel" | SKILL |
| SC-D37 | «**Steps go wrong in two directions, and the fix for one is not the fix for the other.**» «*Too short to run.* The step names a stage and leaves the child to supply the method: `Read the step size.`, `Find their difference.`, `Same? Move right.`, `Count on and check.` The repair adds the missing meaning: what to look at, what to calculate, what decides a choice, what to count on by. `Work out what each jump is worth.`, `Larger number - smaller number.`, `If they are the same, compare the hundreds.`, `Count on using the answer to check.`» | every step | check | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L126 | near-duplicate of D14 to D19 (the same examples) | SKILL, or fold into TV10 |
| SC-D38 | «*Too long to use.* The step carries teaching the child has already had, and the usual sign is a second sentence inside one step. Three things cause it, and each is removed without removing what makes the step runnable:» «- The explanation. `Multiply the whole pounds by 100 (this converts them to pence)` repeats the teaching inside the step; `Multiply the pounds by 100.` is the move. An accuracy reminder is not an explanation: `keeping any zeros it needs` may earn its own step when children need it. Do not hide necessary new teaching in notes or delete it to shorten the criteria.» | every step | must; may (an accuracy reminder as its own step) | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L130 | near-duplicate of D24: adds the accuracy-reminder permission and "do not hide necessary new teaching in notes"; its "the usual sign is a second sentence inside one step" is decision 9 | SKILL |
| SC-D39 | «- The alternatives. `Connect the switch to the lamp or buzzer`, four times down a list, spends most of the panel on a choice the teacher makes once. Name one piece of equipment and let the teacher say the class is using buzzers.» | a step with equipment choices | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L133 | near-duplicate of D05 with its example | SKILL |
| SC-D40 | «- A case that rarely happens. When children must choose between several cases, move them to a lookup table or other runnable guide; an occasional case goes under the steps as a note. A condition the method always meets stays in the steps as a sentence: `If you have ten ones, exchange them for one ten.`» | an occasional case | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L134 | contradiction with D27 (decision 2): "goes under the steps as a note" against "left out of the steps" | SKILL (decision 2) |
| SC-D41 | «The same mechanics hold outside maths. A PE throwing lesson:» «Good: "Point your other arm at the target."» «Bad: "Use your non-throwing arm to aim by pointing it toward where you want the ball to go (this keeps you balanced)."» | every subject | | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L144 | example | SKILL |
| SC-D42 | «§10 success criteria» «Read the relevant preference section before deciding the starter, vocabulary, sticky knowledge, success criteria, Apply or Reflect, reasoning, support and release, source use or worksheet.» | the designer at the decision point | must (read) | | `agents/lesson-designer.md` › Reference Files · L555 | pointer | STAYS (reading route) |
| SC-D43 | «2. **Could I remove words without losing useful teaching - and have I already removed words the child needed to know what to do?**» | every child-facing string | check | | `references/teacher-voice.md` › 17. Final pre-flight check · L953 | shared (voice pre-flight; its second half came in with 4.2.183) | STAYS |
| SC-D44 | «- `Same digits? Move right.` as a success-criteria step - compressed shorthand the child has to unpack (§10).» | every step | must not | | `references/teacher-voice.md` › 15. Things to avoid · L826 | duplicate of D16 in the voice guide's list of things to avoid | TV (the list stays; a pointer to §10) |
| SC-D45 | «Everything else a lesson carries is read by a child or said to one: a source unit's `content`, `taskStructure` and `answer`, every worksheet block, and the top-level `vocabulary` definitions, `successCriteria` steps, `stickyKnowledge` text and `displayedLo`.» | every criteria string | must | `successCriteria` | `agents/lesson-designer.md` › Worksheet · L359 | shared (Written Voice at full strength reaches the steps) | STAYS |
| SC-D46 | «Across the whole pipeline, every word that reaches a child or a parent is written in the teacher's own register: slide titles, body text, speech bubbles, success criteria, captions, a stick-in piece's labels, worksheet prose, report comments.» | every criteria string | must (code: the validator refuses a dash in the design) | | `references/preferences.md` › Calibration examples · L120 | shared (voice: no em dash) | STAYS |

## E. Words the child already owns, and the fresh-example test (shared ground with assumed knowledge)

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-E01 | «Carry out a fresh example using only the steps, as that child: wherever you have to supply a meaning the words leave out (what `the step size` is, what `that many` refers to, what decides `< or >`), the step is too short, however tidy the list looks.» | every list | check | | `references/preferences.md` › Success Criteria · L439. Copies: SC-E02, E03, E13, E14 | rule (AK-G23) | PREF-SC |
| SC-E02 | «Before keeping the steps, run a fresh example from their words alone, as a child who has only the page and not your plan; any meaning you had to supply is missing from a step, and a word this lesson brought in to name something the child can already see (the ends of a line called `landmarks`) is one of those meanings, even when it has a vocabulary slide.» | the designer's steps | check | | `agents/lesson-designer.md` › Success Criteria Types · L289 | near-duplicate of E01: carries your ruling that a word the lesson coined for something visible is a meaning the step leaves out (AK-G24, VOC-I03) | LD-SC (as the self-check) |
| SC-E03 | «Work a fresh example from the steps' words alone, as the weakest child with the teaching over: wherever you have to supply a meaning the words leave out (what a label like `the step size` refers to, what a word the lesson's own vocabulary slide coined for something visible stands for, what `that many` stands for, what decides a choice and what the child then does with it, what to count on by), that step is too short and needs the missing words, as in `teacher-voice.md` → Success criteria.» | reviewing criteria | check | | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L210 | near-duplicate of E01: adds "as the weakest child with the teaching over", the coined word (AK-G25, VOC-I05) and "what the child then does with it" | REV |
| SC-E04 | «The criteria are the thing that child leans on when the teaching has moved on, so every step is written in words they already own: do this, then do this, then do this.» | every step | must | | `references/teacher-voice.md` › 10. Success criteria · L682 | rule (AK-G26) | TV10 |
| SC-E05 | «**A word the lesson brings in to name something the child can already see is not vocabulary the class owns.** Giving it a vocabulary slide does not change that.» «Invented names for parts of the method do the same (`the first end value`, `the gap`). Ask of each noun in a step: is this the subject's own word that the learning needs, or a name for something the child could point at? The first stays; the second becomes the thing they point at. You wrote the plan, so every label reads clearly to you; read the step as a child who has only the page.» | every noun in a step | must | vocabulary test pins the heading sentence | `references/teacher-voice.md` › 10. Success criteria · L678. Copies: SC-E02, E03, E09, S14 | rule; your ruling (4.2.209); shared with vocabulary (VOC-I02), which pins it | TV10 |
| SC-E06 | «A Year 4 number-line lesson taught `landmark` for the two ends and the halfway mark, then wrote `Decide which two landmarks the number lies between.`: the step runs only for a child who remembers the card, and what they needed was the marks in front of them (`the two numbers marked on the line`).» | illustrates E05 | | | `references/teacher-voice.md` › 10. Success criteria · L678 | story (undated; in the log, 4.2.209) | stays as a plain example |
| SC-E07 | «Taught subject vocabulary stays when the class owns it (`partition`, `digit`, `fronted adverbial`); an untaught label does not become acceptable because it is shorter.» | every step | must | | `references/teacher-voice.md` › 10. Success criteria · L676 | rule; shared with vocabulary (VOC-I01) | TV10 |
| SC-E08 | «- **Lesson and task labels need to earn their place.** `starting value`, `step size`, `label`, `space`, `neighbour`, `direction` can all be correct and still make the child translate. Say the thing they can see: `the first number`, `each jump`, `smallest to largest or largest to smallest`.» | every step | must | | `references/teacher-voice.md` › 10. Success criteria · L657 | rule with example | TV10 |
| SC-E09 | «**A step is written in the child's own words, not the plan's.** `Divide the difference by the interval count` and `Compare the same part of life` are planning sentences: *interval count* and *part of life* are the designer's categories. The child's versions name what they can see and do: `Difference ÷ number of spaces.` and `Find something that is the same in both sources.` The tell is a noun the child has not been taught to use; the same tell catches a shorter label that still needs translating (`the step size`, `the next label`, `each neighbour`), and a label this lesson's own vocabulary slide introduced for something the child can already see (`landmarks` for the ends and halfway mark).» | every step | must / check | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L138 | near-duplicate of E05, E08 and E10 (AK-G29, VOC-I04) | SKILL |
| SC-E10 | «Criteria are read and used by the child, so they are written in the child's own words. A step can be imperative and specific and still fail by being planning language:» «> Judge balance using the pattern across a day or week.» «is a curriculum document's sentence. The child's step is:» «> Check the whole day or week.» | every step | must | | `references/teacher-voice.md` › 10. Success criteria · L668 | rule with example | TV10 |
| SC-E11 | «**Say how, unless the class can already do it without thinking.** A step may name a sub-procedure without re-teaching it only when that sub-procedure is secure from earlier lessons (`Partition each number.` in a Year 4 lesson that is not teaching partitioning). When the move is the lesson's new learning, or its sticking point, the step says how it is done, because that is the thing the child will forget.» «Where a step points at a literal mark the child writes (the colon in a digital time, the unit, a `+`, a calculation), put the mark in the step: `Write: ___ past.`, `Difference ÷ number of spaces.` Children can copy a mark; they cannot act on a description of one.» | every step; a secure sub-procedure may be named | must; may | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L136. Copy: SC-E12 | rule; shared with assumed knowledge (what counts as secure) | SKILL |
| SC-E12 | «**Name a familiar or just-taught action only when children genuinely know how to carry it out.** A short label may remind children of a secure sub-procedure without re-teaching it. Do not hide the lesson's new or difficult thinking inside an unexplained label; when that action is the learning, the criteria must make it runnable.» «Where a step needs to point at a literal piece of writing (the templated answer, the colon in a digital time, the unit), put the literal mark in the step itself: `"Write: ___ past."`, `":"`, `"Write it down."`. Children can copy a literal mark; they can't act on a description.» | as E11 | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L149 | near-duplicate of E11, not a copy: "just-taught" admits today's teaching where E11 allows only a sub-procedure "secure from earlier lessons", and it has its own literal-mark examples (decision 16) | SKILL (fold) |
| SC-E13 | «- **Pupil work:** Follow the actual success criteria on representative questions, including a case that takes each conditional branch and one where that branch should not apply. Recompute the answers; repair a condition that makes children perform an unnecessary or invalid move.» | the designer's completion pass | check | | `agents/lesson-designer.md` › One Completion Pass · L508 | near-duplicate of E01: adds working each conditional branch and a case where it should not apply; assumes steps that sometimes do not apply, which D27 says are not steps (decision 2) | STAYS (the designer's own final check) |
| SC-E14 | «Follow the success criteria, including when conditional steps apply or should be skipped.» | the reviewer's route check | check | | `agents/design-reviewer.md` › 2. Route, modelling and independence · L170 | duplicate of E13 for the reviewer (decision 2) | REV |

## F. Step and table mechanics, and the same wording across a concept

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-F01 | «**The steps are the procedure in the order the child performs it.** Carry out a worked example with the cues before keeping them. A line that cannot be done at that point is out of order or hides an untaught action.» «Use the appropriate cues for other operations rather than packing all alternatives into every step. A fact such as `The ones digit stays the same` is sticky knowledge, not another numbered action.» | a procedure's steps | must / check | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L140 | rule | SKILL |
| SC-F02 | «For subtracting ten with a taught exchange method, `Find the tens column. / No tens? Exchange first. / Take away one ten. / Read the new number.` recalls actions in usable order.» | illustrates F01 | | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L140 | example; `No tens? Exchange first.` is the slogan form D16 rules out (decision 7) | SKILL (rewrite, decision 7) |
| SC-F03 | «**Steps encode the decision rule, never an artefact of the worked example.** Ask of each step: would a different-but-correct performance fail it? Then the step is teaching the example, not the skill.» «Keep order in the steps only when the order IS the procedure being taught, as in an algorithm's own sequence; the order the model happened to be built in never qualifies.» | every step | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L142 (only copy) | rule with the circuit example | SKILL |
| SC-F04 | «**When several cases need a lookup** - for example a conversion where the direction changes the operation - name each row using the actual content the child sees, not an abstract category label. A child scans the guide to find their input and reads off the action. A single short condition may instead stay in the steps, as above.» «Good: "Hours → minutes? × 60"» «Bad: "Smaller unit? Multiply by 60."» «Good: "Next word starts with a, e, i, o or u sound? → an"» «Bad: "Choose the article that matches the following sound."» | a lookup | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L151. Copy: SC-D07 | rule with examples; F13's own example uses the category form this row calls bad (decision 7) | SKILL |
| SC-F05 | «When a task genuinely branches, use the clearest child-runnable guide: a table, flowchart, short decision list or another suitable form. Do not default to a flowchart or create a branching guide for a simple non-branching method. Whatever the form, write it as a decision the child can run, not a set of labels:» | a branching task | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L163 | rule | SKILL |
| SC-F06 | «- **Phrase each branch as the question the child asks** — "Is the answer missing?", "Is the first number missing?" — rather than a bare label ("Answer missing"). A question is something the child actively answers yes/no as they scan; a label is something they have to interpret first.» | a branching guide | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L165 | rule; a branch written as a question, where D16 and D44 say a condition is a sentence (decision 15) | SKILL |
| SC-F07 | «- **Name the cases in one consistent scheme the child can map onto any instance.**» «- **Keep the action half parallel so only the deciding part changes down the column.**» | a branching guide | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L166 | rule with examples | SKILL |
| SC-F08 | «- **Keep each cell short — a glance reference, not a sentence.** Trim anything the move already implies: a "Read the answer" tail after "Slide right" earns nothing, and length is what forces the table to shrink.» «in a narrow reference panel, forcing each part onto its own line adds height that shrinks the whole table toward unreadable, so there a short single line that wraps naturally is the better call.» | a lookup table's cells | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L168 | rule (near-duplicate of D07, plus the narrow-panel layout advice) | SKILL |
| SC-F09 | «- **Order the rows in a sequence the child can anticipate.**» | a lookup table | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L169 | rule | SKILL |
| SC-F10 | «The aim throughout is a table the child can *run*: scan the questions top to bottom, stop at the first yes, read off the move. Correct-but-unparallel rows hold the same information and make the child do the organising the table should have done for them.» | a lookup table | check | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L172 | rule | SKILL |
| SC-F11 | «**The SC must not change across My Turn, Our Turn, and Your Turn.** The teacher uses it during My Turn to teach. Children refer to it during Our Turn to learn how to use it. It remains available as the same reference during Your Turn. If the wording drifts — even slightly — between those three slides, it reads as a different rule and the repetition benefit is lost. Write the steps once and reuse them verbatim across all three slides in a concept.» | a skill concept | must (code: the same refs on every turn) | `successCriteriaRefs` | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L176. Copies: SC-F12, D33, D36, F14 to F16, S05, I12 | rule (the home of "the same wording") | SKILL, with one line in PREF-SC |
| SC-F12 | «Keep the wording stable across modelling and practice, because a child matches the panel to what they watched.» | every lesson | must | | `references/preferences.md` › Success Criteria · L439 | near-duplicate of F11: reaches every route, not only skill turns | PREF-SC |
| SC-F13 | «**When Concept 2 wraps around Concept 1's procedure, fold the key decision cues into Concept 2's SC.**» «Fix: embed the key decision cues from Concept 1 into the relevant Concept 2 step. Not the full SC verbatim, but enough to trigger the right procedure: "Convert to the same unit → find the units → pick your fact (60, 12 or 7) → × for smaller, ÷ for larger". This keeps the SC as one self-sufficient list children can work from without needing to look anywhere else.» | a concept that runs an earlier concept's procedure | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L178 (only full copy) | rule; its example's `× for smaller, ÷ for larger` is the category form F04 calls bad (decision 7), and the rule itself asks for a compressed paraphrase of an earlier concept's criteria where M01 and F11 ask for the same words (decision 14) | SKILL |
| SC-F14 | «Do not copy success-criteria wording into these `content` objects. Define it once under `successCriteria`, attach it to the concept, and copy the same `successCriteriaRefs` onto **every** unit of that concept: every My Turn, every Our Turn and every Your Turn.» | recording a skill concept | mechanics (code) | `successCriteria`, `successCriteriaRefs` | `references/teaching-sequence-skill-based.md` › Output Format Block · L285 | mechanics | SKILL |
| SC-F15 | «All My Turn, Our Turn and Your Turn units for the same concept use the same `conceptRef` and exact concept `successCriteriaRefs`.» | recording a skill concept | mechanics (code) | `conceptRef`, `successCriteriaRefs` | `references/teaching-sequence-skill-based.md` › Output Format Block · L241 | near-duplicate of F14: adds the same `conceptRef`, which the validator also checks | SKILL |
| SC-F16 | «Every My Turn, Our Turn and Your Turn for that concept uses exactly the same `successCriteriaRefs` array.» | recording a skill concept | mechanics (code) | `successCriteriaRefs` | `references/output-template.md` › Success criteria · L334 | duplicate of F14 | OT |
| SC-F17 | «Do not repeat `What good looks like` inside `content`. Define that standard once as success criteria and attach it through `successCriteriaRefs`.» | task-centred lessons | mechanics | `successCriteriaRefs` | `references/teaching-sequence-task-centred.md` › Output Format Block · L63. Copy: SC-F18 | mechanics (the task-centred version of F14) | ROUTE |
| SC-F18 | «attach the exact standard through `successCriteriaRefs`.» | task-centred lessons | mechanics | `successCriteriaRefs` | `references/teaching-sequence-task-centred.md` › Output Format Block · L149 | duplicate of F17 | ROUTE |
| SC-F19 | «**When how-to steps already enact fact, steps are sticky - don't append restating line.** Skill lesson SC steps (Both?→overlap. Neither?→outside) - if sticky says same, shows nothing new, reads as redundant fifth step. Fold sticky into practice SC only when carries something steps don't enact: why behind step, boundary, fact from different part. When steps already carry fact, let them.» | sticky knowledge beside steps | must | | `agents/lesson-designer.md` › Sticky Knowledge · L237 | shared (sticky knowledge); its example steps are the slogan form D16 rules out (decision 7) | STAYS |
| SC-F20 | «Full set lives in SC steps and Teach unit; exact source unit carries one appropriate refs entry.» | sticky knowledge on a practice unit | must | | `agents/lesson-designer.md` › Sticky Knowledge · L235 | shared (sticky knowledge) | STAYS |
| SC-F21 | «The exchange has to precede removal when there is no ten to remove, and its actual method must already have been modelled.» | a step that uses a method | must | | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L140 | rule: a step's method is modelled before a step asks for it (the sentence F01's row left unquoted) | SKILL |

## G. What a step may carry: counts, conditions and answers

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-G01 | «**A count inside a criterion comes from the curriculum, the guidance or the task's real demand - never invented to make judging easier.** Children learn the count as the concept.» «`Add two fruit or vegetable portions.` teaches that a balanced lunch means two portions, when UK guidance sets no per-meal rule at all; `Use three adjectives.` teaches that good description is adjective arithmetic.» «The tell is the one the worksheet response rule already uses: if work that meets the concept but not the number would read as wrong, the number is doing the marking. A count that genuinely is the demand stays - `Give two reasons.` when weighing more than one reason is the objective, steps numbered because the method has that many.» | a number inside a criterion | must | | `references/preferences.md` › Success Criteria · L459. Copies: SC-G02, G04 | rule with examples | PREF-SC |
| SC-G02 | «**No invented per-meal quotas.** UK portion advice works across the whole day (at least five fruit and vegetables) and deliberately sets no rules for a single meal. A criterion like `Add two fruit or vegetable portions` turns balance into a lunchbox checklist, which is the apple misconception wearing better clothes.» | PSHE diet lessons | must | | `references/subject-pshe.md` › Food and diet · L54 | near-duplicate of G01 with the subject's reason | SUBJ |
| SC-G03 | «Scaffold the method, not the answer: a step never supplies the value, verdict or conclusion the child is meant to reach.» | every step | must | | `references/teacher-voice.md` › 10. Success criteria · L682 (only copy for criteria) | rule | TV10, or PREF-SC |
| SC-G04 | «The criteria are the taught quality rather than a count of features, and the entry route has been prepared.» | the Compose operation | check | | `references/do-beats.md` › Operations to think with · L572 | shared (the Do-beat catalogue); near-duplicate of G01 | STAYS |
| SC-G05 | «**Weak.** `Write three sentences about the forest. Include at least two adjectives in each.` Requires: counting adjectives.» | a writing task | | | `references/task-contrasts.md` › English: a count is not the quality · L53 | shared (task contrasts): the same count tell, on a task rather than a criterion | STAYS |

## H. Which slides and beats carry the criteria

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-H01 | «Do not put the criteria on their own introductory slide before the My Turn unless the criteria themselves genuinely need teaching, comparison or construction. The teacher is about to demonstrate them; a list of "what we're about to do" teaches nothing. The criteria belong on the My Turn slide and on practice slides, where children see them in use.» | every lesson; exception: criteria that themselves need teaching, comparison or construction | must | | `references/preferences.md` › Success Criteria · L431. Copies: SC-H02, H03, H22 to H25 | rule; pulls against H04 and K05 (decision 4) | PREF-SC |
| SC-H02 | «Do not insert a ceremonial success-criteria slide before the teaching unless the criteria itself is being taught, compared or constructed. The same holds mid-lesson: a slide holding only a reference and criteria between a task's introduction and the task itself is an interlude with no job of its own - put the reference beside the task instead, and give every slide a visible reason to be on the screen.» | the slide designer | must | | `references/slide-composition-playbook.md` › 9 · L250 | near-duplicate of H01: adds the mid-lesson interlude | PB |
| SC-H03 | «This preserves the existing route's optional explanation, bounded pattern/method work, recognition-set establishment and the rare case where the criteria themselves genuinely need teaching.» | a skill lesson's preparation unit | may | prepare mode `criteria-teaching` (code, SC-S09) | `references/teaching-sequence-skill-based.md` › Output Format Block · L235 | rule (the recorded form of H01's exception) | SKILL |
| SC-H04 | «**Purpose:** Full-slide success-criteria reference. The entire body below the title is a criteria zone. Use when the criteria needs space — a large table, a detailed step list, a classification chart.» | the slide designer choosing a template | may | template `success-criteria` | `references/templates.md` › `success-criteria` · L410 | mechanics; "use when the criteria needs space" is a wider licence than H01 and H02 give (decision 4) | TPL |
| SC-H05 | «**And they come off the answer slide.** A check slide is the moment the class compares what they wrote with what was right, so the panel beside it is the one thing nobody looks at, and it takes a third of the board away from the answers it is sitting next to.» «On the teaching and practice slides that is correct and is what the criteria are for; on the checks it is furniture. The same holds for any slide whose whole job is a reveal.» | answer and reveal slides | must | | `references/preferences.md` › Success Criteria · L433 (only copy; the slide files do not repeat it) | rule; your reading (the log records that the boundary is yours) | PREF-SC, with a line in PB |
| SC-H06 | «A Year 4 maths deck carried the same six-step panel on thirteen of sixteen slides, including all four checks.» | illustrates H05 | | | `references/preferences.md` › Success Criteria · L433 | story (in the log, 4.2.146) | LOG |
| SC-H07 | «Success criteria follow the same rule as any other shared reference, and this is where that gets forgotten, because the criteria feel too important to leave off. Put them on the slides where children are actually working to them. Where they belong, they stay complete and exact - their appearance on an earlier slide is never a reason to shorten or compact them - and they take a receded share, per §5. What they must not do is arrive on every part of a split by default:» «Place a repeated panel beside the task (a row) rather than as a full-width band beneath it when the stack is tight, and keep it the smallest column in that row: growing a bottom panel's share squeezes the very task the criteria serve, and giving it a third of a row beside two photographs children must inspect does the same thing sideways.» | the slide designer: the first sentence for a unit split across slides, the last for any repeated panel when the stack is tight | must | | `references/slide-composition-playbook.md` › 6. Space-pressure order · L202 | rule (only copy of "not on every part of a split") | PB |
| SC-H08 | «a Year 4 history lesson referenced its criteria on three source units and printed the panel on six slides, so on the two continuation slides the green box was as loud as the new source comparison it was meant to serve.» | illustrates H07 | | | `references/slide-composition-playbook.md` › 6. Space-pressure order · L202 | story (undated). **Not in the build log** | LOG (copy it there first) |
| SC-H09 | «When a practice beat's questions, source or frame are printed on the child's own sheet, the launch slide carries the task in words, the success criteria and anything children genuinely cannot have in front of them, and it names the sheet in its title or first line.» «The criteria stay on the board because children consult them while they write, which is also why the sheet does not reprint them.» | a practice beat whose work is printed | must | | `references/slide-composition-playbook.md` › 5 · L157 | rule; "the sheet does not reprint them" pulls against N01 and N09 (decision 8) | PB (and WS for the sheet half) |
| SC-H10 | «3. every success criterion, sticky fact, representation or reference explicitly attached to this source unit;» | a tight slide: item 3 of the order in which content is protected, and the next paragraph allows such a reference to move to another consecutive slide of the same unit | must (protect first) | `successCriteriaRefs` | `references/slide-composition-playbook.md` › 6. Space-pressure order · L180. Copies: SC-H11, H12 | rule | PB |
| SC-H11 | «Show the exact question, representation, reference and success criteria named by the source unit.» | work that happens away from the slide | must | | `references/slide-composition-playbook.md` › 7. Empty space is working space · L212 | rule: the positive rule for a slide whose work happens away from it (not a copy of H10) | PB |
| SC-H12 | «By independent practice, let the scaffold fade **only as the structured source says it fades**. A reference absent from the current source unit stays absent. A success-criteria, sticky-knowledge or representation reference present on the current source unit stays visible.» | independent practice slides | must | `successCriteriaRefs` | `references/slide-composition-playbook.md` › 8 · L224 | rule (the slide designer never adds or drops criteria by stage) | PB |
| SC-H13 | «A worked example, reference table, visual tool or success criteria may remain when it enables the intended performance without doing the new thinking for the child. Do not withdraw support automatically by stage, item or pupil label.» | independent work | may; must not (withdraw by stage) | | `references/preferences.md` › Support, Checking and Release · L501 | shared (support and release); criteria stay into independent work | STAYS |
| SC-H14 | «Success criteria, a worked reference, a number line, a word bank, a model on the board are all things a child can choose to ignore, and a child who is ready to ignore them will.» | independent work | | | `references/preferences.md` › Support, Checking and Release · L503 | shared (support and release) | STAYS |
| SC-H15 | «- Keep success criteria, a word bank, representation, reference table or visual tool when it enables the intended performance without supplying the answer or making the key decision.» | a skill lesson's Your Turn | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L89 | near-duplicate of H13, stronger: "keep" where H13 says "may remain", and adds "or making the key decision" | STAYS |
| SC-H16 | «The `successCriteriaRefs` for the steps the work is judged by belong on the same beat, because that is what the children check themselves against while they write.» | a beat that sets a task | must | `successCriteriaRefs` | `references/do-beats.md` › Setting the task · L39 | rule (only copy of "on the same beat as the task"); shared with the Do-beat catalogue | PREF-SC |
| SC-H17 | «Task-framing slides in particular fail this test often: the question, the success criteria, and any useful visual or teaching object for the real context, with the wider task description living in speaker notes, is enough to set up the task. Children don't need both a paraphrase of the question AND the success criteria on screen — the SC is what tells them what good looks like.» | a task-framing slide | must | | `references/preferences.md` › Slide Philosophy › Lesson Designer visual-need boundary · L637 | rule; shared with Slide Philosophy | STAYS (Slide Philosophy) |
| SC-H18 | «The slide for this beat carries the question, the success criteria, a visual of the real context, and any task the children carry out here — and trims everything else to the teacher's voice.» «so keep on the slide the question (on the title), the SC ("your job today") in a panel, the visual hook, the investigation brief (if a prediction follows), and the prediction prompt the child writes from.» | a task-centred Set the Task slide | must | | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L15 | near-duplicate of H17 for the route | ROUTE |
| SC-H19 | «When completing a frame is part of the model, the modelling resource carries that exact starting instance in a blank or partly blank frame plus the success criteria; it does not leave the teacher to invent the instance.» | a task-centred modelled frame | must | | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L23 | rule | ROUTE |
| SC-H20 | «Show the exact example and useful support, including applicable success criteria.» | the Question and reference modelling state | must | `modellingState` | `references/modelling-formats.md` › Question and reference · L25 | rule; shared (modelling) | STAYS |
| SC-H21 | «Choose the smallest template that gives the example and any necessary success criteria or reference enough room to be read.» «Keep the dataset in `reference` and the criteria in `criteria` when using those template slots; do not let the reference or explanation occupy the promised writing area.» | prepared examples and live models on slides | must | `reference`, `criteria` slots | `references/slide-representations.md` › The modelling resource state sets what the slide must · L7 | mechanics (shared with the slide topic) | STAYS |
| SC-H22 | «a My Turn is the question, the tool and the criteria; a Practise is the task, the tool and the criteria, and the launch slide before it is what the class has established, the example and non-example of the product, and the steps, or why its question alone is enough.» | the walk-through's board line | must | | `agents/lesson-designer.md` › Write the lesson, then the contract · L406 | near-duplicate of H01 (the designer's own words for it) | STAYS |
| SC-H23 | «The rule does not make every slide a Teach slide: a practice slide is still the question, the tool and the criteria, and a Do slide is still the case and what every child decides.» | practice slides | must | | `references/preferences.md` › Slide Philosophy › Lesson Designer content boundaries · L541 | duplicate of H22 | STAYS |
| SC-H24 | «**Maths — rounding decimals (Y4/Y5):** Starter recapped prior rounding skill. My Turn slide had one question ("Round 5.6 to the nearest whole"), a blank number line below, success criteria below that — and speaker notes carried a ready-to-read teaching script plus things to watch for in Our Turn.» «The slides were minimal: the question, the tool, the SC. The teacher's voice filled the rest.» | the calibration for a slide's amount | | | `references/preferences.md` › Pride Lessons (Quality Anchor) · L770 | your example (a Pride Lesson): criteria below the tool, not in a side panel | STAYS exactly as it is |
| SC-H25 | «The success criteria was a classification table — nothing else on the slide; the teacher spoke through it.» | as H24 | | | `references/preferences.md` › Pride Lessons (Quality Anchor) · L772 | your example (a Pride Lesson): a criteria-only slide for a recognition set (decision 4) | STAYS exactly as it is |
| SC-H26 | «In the lessons the user is proud of, a slide is the question, the tool and the criteria, and the user's voice does the rest.» «A beat that hands a Year 4 class two sources, a scenario, three questions and a criteria panel at once is not unclear, it is too much, whatever its wording» | the reviewer's User-fit judgement | check | | `agents/design-reviewer.md` › Material-defect boundary · L42 | shared (the reviewer's amount test): carries a limit H22 lacks | STAYS |
| SC-H27 | «A beat that hands the class two sources, a scenario and several questions beside a criteria panel at once is too much, whatever its wording.» | the designer's completion pass | check | | `agents/lesson-designer.md` › One Completion Pass · L515 | shared (amount); duplicate of H26 | STAYS |
| SC-H28 | «an Our Turn slide shows the example, the success criteria and the helper, and nothing the teacher only says.» | a skill lesson's Our Turn | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L75 | rule; shared with the rhythm | STAYS |
| SC-H29 | «A Year 4 rounding deck printed three spoken prompts on one Our Turn slide, and the teacher wanted the label, the question, the criteria and the number line and nothing else (the user, 12 September 2026).» | illustrates H28 | | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L75 | your ruling, dated (in the log, 4.2.145) | keep your words without the date |
| SC-H30 | «What counts as *one coherent teaching move*: the question a child is working on, together with the tool, useful explanation and success criteria that serve it, is one move — the fraction wall and the steps are *how* the child meets that one question, not separate things competing for attention.» | slide design | must | | `references/preferences.md` › Slide Philosophy › Lesson Designer content boundaries · L569 | shared (Slide Philosophy) | STAYS |
| SC-H31 | «The first is the pile: a rule, a definition, a source, a question, a timeline and the criteria, all present, all legible, all competing, and the teacher has nowhere to point.» | a teaching slide | check | | `references/slide-composition-playbook.md` › 5 · L153 | shared (slide amount) | STAYS |
| SC-H32 | «The limit: a criterion, a definition or a reference genuinely needed to start does go first, and this is not an argument for withholding a tool until a child has struggled without it.» | ordering a lesson | may | | `references/preferences.md` › What a Lesson Is For · L162 | shared (the rhythm; VOC-E45 lists the same sentence) | STAYS |
| SC-H33 | «A success standard, briefing, reminder or description of the finished outcome is not another task and must not be wrapped in a lettered question card.» | lettered task slots | must | | `references/slide-composition-playbook.md` › 4 · L92. Copy: SC-K19 | rule | PB |
| SC-H34 | «When a step points at the question or task ("read the question: what am I comparing?"), the question has to be on the same slide, or the step has nothing to point at. A labelled slot is the goal, but never at the cost of stranding the steps on a question-less slide. When the steps reference the question, choose a template that holds the question and the steps together (a body zone with the question line above a `steps` object) rather than the full-slide `success-criteria` template, which leaves no room for the question.» | steps that point at the question | must | template `success-criteria` | `references/slide-success-criteria.md` › Keep the SC beside what its steps refer to · L45 | rule (decision 4 touches it); its illustration, a step reading "read the question: what am I comparing?", is the question-fragment shape (a smaller case for decision 7) | SSC |
| SC-H35 | «A slide handling the lesson's own business has no referent to show: here is your task, here are the success criteria, here is what we noticed on the slide before.» | the picture test | | | `references/preferences.md` › Slide Philosophy › Lesson Designer visual-need boundary · L635 | shared (pictures): a criteria slide needs no picture | STAYS |
| SC-H36 | «Zero separate sticky facts is acceptable when nothing distinct earns the role because the objective, representation or success criteria already carries the necessary idea.» | sticky knowledge | may | | `references/preferences.md` › Sticky Knowledge · L419 | shared (sticky knowledge) | STAYS |
| SC-H37 | «That tail may come off when it describes only the route to the learning or spells out what the success criteria will show anyway, and it stays when the qualifier, condition or method is itself part of the learning.» | the objective on the board | may | `displayedLo` | `references/preferences.md` › Classroom Norms · L136 | shared (the LO) | STAYS |
| SC-H38 | «`Use the photographs as evidence and use the success criteria to check each decision` tells a class only what they can already see they are meant to do, where `Look carefully at each photo. Remember, having a plug isn't what makes something electrical` hands them the idea they need in order to do it.» | a speaker-note script | check | | `agents/lesson-designer.md` › Speaker Notes Voice · L90 | shared (speaker notes): a script that only points at the criteria is stage directions | STAYS |
| SC-H39 | «*"During the My Turn, the teacher models [the column subtraction] while the class watches; the SC panel and any reference stay on the slide."*» | the modelling hand-off | mechanics | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L57 | example of the hand-off wording (shared, modelling) | STAYS |
| SC-H40 | «the teacher works the calculation out live using the SC steps.» | a Question-and-reference maths model | must | | `references/teaching-sequence-skill-based.md` › Teaching Sequence Specification · L67 | near-duplicate of A04 | STAYS |
| SC-H41 | «Keep word bank, representation, worked example, reference or SC that still enables intended thinking without supplying answer.» | an Apply slide | must | | `agents/lesson-designer.md` › Apply Slide · L331 | near-duplicate of H13, stronger ("keep") for the Apply slide | STAYS |
| SC-H42 | «a Do slide is the case and what every child decides, a practice slide is the question, the tool and the criteria, and neither is read as a Teach board.» | the reviewer's Teach-board check | check | | `agents/design-reviewer.md` › Material-defect boundary · L44 | duplicate of H22 | STAYS |
| SC-H43 | «while the important content (the question, the task, the success criteria) takes the width.» | sizing a nice-to-have photo | default | | `references/slide-visual-sizing.md` › Importance decides size too · L25 | shared (sizing) | STAYS |
| SC-H44 | «a slide whose business is the lesson's own (your task, your criteria, what we just noticed) has no person in it to show.» | speaking characters | | | `references/slide-speech-and-characters.md` › An invented person is shown, or is not invented · L13 | shared (characters): duplicate of H35 | STAYS |
| SC-H45 | «It is worked minutes after the teaching, by a child still holding one method, one representation and one set of criteria, so the form the sheet opens in is a teaching decision rather than a layout one.» | a maths worksheet | | | `references/subject-maths.md` › The worksheet's sections in maths · L75 | shared (maths sheets) | STAYS |
| SC-H46 | «A planning or checkpoint slide shows only the decisions pupils must make and the standard they need to meet.» | a task-centred planning or checkpoint slide | must | | `references/slide-composition-playbook.md` › Lesson rhythm · L400 | rule ("the standard" is the task's criteria) | PB |
| SC-H47 | «Set the Task put the question and the standard on the board at the start» | a task-centred lesson | | | `references/teaching-sequence-task-centred.md` › Teaching Sequence Specification · L31 | shared (the launch); restates A06 | STAYS |
| SC-H48 | «The slide carries the exact question, the blank or partly blank configuration and the SC.» | a live-complete helper on a `*-sc` template | must | | `references/slide-representations.md` › A live-complete helper · L19 | rule (which modelling slides carry the criteria) | STAYS (slides) |
| SC-H49 | «**Question and reference** shows the exact question, useful criteria and reference while the teacher produces separate working.» | the Question and reference state | must | | `references/slide-representations.md` › The modelling resource state · L11 | near-duplicate of H20 for the slide side | STAYS |
| SC-H50 | «If a structured set must split, split only at a complete item or card boundary, use consecutive slides with the same `designUnitId`, and repeat every still-needed live reference.» | a structured set split across slides | must | `designUnitId` | `agents/slide-designer.md` › Surface execution · L400. Copy: SC-H51 | shared (slides); "repeat every still-needed live reference" pulls against H07's "not on every part of a split" unless still-needed leaves the criteria out (for the slide topic) | STAYS |
| SC-H51 | «Repeat exact group labels and every still-needed live reference.» | as H50 | must | | `references/slide-composition-playbook.md` › Teaching and pupil action · L372 | duplicate of H50 | STAYS |

## I. Downstream copies the criteria exactly and decides nothing about them

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-I01 | «The constants are simple: source-authored success-criteria wording stays exact, every referenced criterion or sticky fact remains available on that source unit, and wording is never shortened to fit.» | every slide carrying criteria | must | | `references/slide-success-criteria.md` › Success criteria on slides: placement mechanics · L3. Copies: SC-I02 to I11 | rule | SSC |
| SC-I02 | «Never polish, shorten, simplify or paraphrase a supplied question, example, claim, sentence stem, success criterion, sticky fact, vocabulary definition, visible standard or representation label.» | the slide designer | must | | `references/slide-composition-playbook.md` › 3 · L49 | shared (copy wording exactly; VOC-N09) | STAYS |
| SC-I03 | «Copy every step verbatim. Never shorten a step to fit. Choose a roomier slot, a different template or a coherent split.» | the slide designer | must | | `references/slide-composition-playbook.md` › 9 · L244 | near-duplicate of I01: carries the remedy, including "a coherent split", a permission the fold must keep (decision 3) | PB |
| SC-I04 | «- a new success-criteria step;» | what the slide designer may not choose | must not | | `agents/slide-designer.md` › The governing distinction: content vs presentation · L92 | rule | STAYS |
| SC-I05 | «- which units have success criteria or sticky knowledge available;» | what the slide designer may not choose | must not | | `agents/slide-designer.md` › 1. Read the lesson as a sequence before choosing any · L132 | rule | STAYS |
| SC-I06 | «- success-criteria wording;» | what the slide designer copies exactly | must | | `agents/slide-designer.md` › 2. Treat each source unit as the authority for content · L155 | rule | STAYS |
| SC-I07 | «Any string already authored in source-unit `content` that is rendered as pupil-facing — a prompt, a label, a question, a stem, a success criterion — is Lesson Designer-owned: you may lay it out and insert a visual line break between existing words or sentences when word order and punctuation remain unchanged, but you may not trim it, reorder its words or emit a near-copy.» | the slide designer | must; may (a line break) | | `agents/slide-designer.md` › 2. Treat each source unit as the authority for content · L172 | rule (shared with every copied string) | STAYS |
| SC-I08 | «by changing source-authored words, examples, answers, success criteria, question count, teaching order or task demand;» | the slide designer's fault classes | mechanics | `faultClass: "content"` | `agents/slide-designer.md` › The order, once, so the pass has something to look at · L603 | mechanics | STAYS |
| SC-I09 | «Do not change a question, example, answer, success criterion, sticky-knowledge statement, misconception, task demand, representation family or configuration, required photograph, teaching beat, objective or scope.» | the slide designer's focused repair | must | | `agents/slide-designer-focused-repair.md` › Scope · L27 | duplicate of I07 for a role that never reads the full files | STAYS |
| SC-I10 | «no rewritten success criteria that fit a smaller slot» «what the success criteria say» «every specialist already has rules requiring verbatim copying of upstream content (questions, success criteria, speaker notes).» | any specialist whose brief and artefact disagree | must | | `references/brief-gap-protocol.md` › The principle · L13 | rule (three places in one file; the second quote is a fragment of I20) | STAYS |
| SC-I11 | «Keep the lesson-designer's step wording verbatim. The slide-designer changes only that step's JSON shape from a string to `{ "text": "...", "helper": "..." }`; the visible words do not change.» | a step given a helper | must | `helper` (legacy `figure`) | `references/slide-success-criteria.md` › Success Criteria Helpers · L51 | rule | SSC |
| SC-I12 | «When a unit names success-criteria or sticky-knowledge references, read the conditional reference before composing that unit.» «- A first success-criteria reference establishes the source-authored identity.» «- A continuation repeats that identity without drift.» «- When one reference is both success criteria and sticky knowledge, render one faithful combined reference rather than two competing copies.» | the slide designer | must | | `agents/slide-designer.md` › 6. Place source references exactly · L251 | rule (the slide half of F11's "same wording") | SSC |
| SC-I13 | «- `preferences.md` Success Criteria and Sticky Knowledge, plus the relevant part of `slide-success-criteria.md`, when a source unit has `successCriteriaRefs` or `stickyKnowledgeRefs`.» | the slide designer's reading | must (read) | `successCriteriaRefs` | `agents/slide-designer.md` › What you read · L52. Copies: SC-I14, I15 | pointer | STAYS |
| SC-I14 | «Whenever a source unit has `successCriteriaRefs` or `stickyKnowledgeRefs`, read `slide-success-criteria.md` before composing that slide.» | as I13 | must (read) | | `references/slide-composition-playbook.md` › 9 · L240 | duplicate of I13 | STAYS |
| SC-I15 | «Read success-criteria, representation and speech guidance whenever their trigger is present; do not work from memory.» | as I13 | must (read) | | `agents/slide-designer.md` › Rules that never change · L692 | duplicate of I13 | STAYS |
| SC-I16 | «- success-criteria or sticky-knowledge placement: `slide-success-criteria.md`;» | the focused repair's reading | pointer | | `agents/slide-designer-focused-repair.md` › Start narrow · L47 | pointer | STAYS |
| SC-I17 | «- The criteria label goes on the criteria only. A representation the task uses (a nutrient table, a word bank, a source) sits in its own zone under its own name; wrapping it in an `sc-panel` tells children the facts are the standard, and the real steps are then somewhere else or nowhere.» | the slide designer | must | `sc-panel` | `agents/slide-designer.md` › 6. Place source references exactly · L259 | near-duplicate of C02 for the slide side | SSC |
| SC-I18 | «- visible standards;» | what the slide designer copies exactly | must | | `agents/slide-designer.md` › 2. Treat each source unit as the authority for content · L159 | duplicate of I06 (a standard is the criteria under another name) | STAYS |
| SC-I19 | «render the renderable reference it has — the contrasting photos, the success-criteria checklist, the sentence frame.» | a slide whose named diagram cannot be drawn | may | | `references/brief-gap-protocol.md` › How to apply · L69 | shared (brief gaps) | STAYS |
| SC-I20 | «The line is crossed when the specialist starts making decisions in the *lesson-designer's* domain — what the question says, what the modelled answer looks like, whether the teacher should write something live, what the misconception is, what the success criteria say. Those decisions are upstream.» | any specialist whose brief and artefact disagree | must | | `references/brief-gap-protocol.md` › The line that separates legitimate work from invention · L84 | rule (I10 quotes a fragment of it) | STAYS |
| SC-I21 | «Keep a structured visual structured. Do not flatten a table, bank, sequence, checklist, diagram or card set into prose.» | the slide designer | must | | `agents/slide-designer.md` › 6. Place source references exactly · L261 | shared (slides); pulls against K43's "give the same criteria as lines" (decision 13) | STAYS |

## J. The colour marks inside a criterion (your vocabulary decision 16)

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-J01 | «**Colour picks out the part of a criterion a child's eye should land on.** Printed all in bold black, a step makes a child read every word at the same weight, and the word that tells them where to look is lost in the sentence. So mark that part, inside the criterion's own words, and the engine colours it the same way on the board, the worksheet and the working wall:» | every criteria form | default | | `references/preferences.md` › Success Criteria · L441. Copies: SC-J04 to J08 | rule; your ruling (15 September, "so its not all just black", in the log as 4.2.212) | PREF-SC |
| SC-J02 | «- `((thousands))` for a word naming a coloured part of the picture the child is looking at. It takes that part's own colour, so the words and the drawing line up. Place-value columns are the parts the engine colours today (thousands, hundreds, tens, ones, tenths, or Th, H, T, O, t); the validator names any other word.» «- `{{interval}}` for this lesson's taught word, in vocabulary green, the same word the child met on its vocabulary card.» «- `<<stop at the first digit that is different>>` for the part to look at or decide, in orange.» | as J01 | must (code: a picture mark must name a coloured part; a mark left open is refused) | `((...))`, `{{...}}`, `<<...>>`, `**...**` | `references/preferences.md` › Success Criteria · L443 | rule; the taught-word line is shared with vocabulary (VOC-N25) | PREF-SC |
| SC-J03 | «When one word could take two colours, the picture wins, then the taught word. Mark the words doing that work and leave the rest black: usually one or two parts of a step, and a step with nothing to pick out stays plain, because a step with every noun coloured has nothing standing out.» «`Compare the ((thousands)) first. If they match, move right and <<stop at the first digit that is different>>.` The marks work in every criteria form: a step, a table cell, a labelled reference.» | as J01 | default | | `references/preferences.md` › Success Criteria · L447 | rule with example; decision 1 (your decision 16 says every taught word is green and the one-or-two limit is for the other marks; this sentence applies the limit to all three); shared with vocabulary (VOC-N29) | PREF-SC (decision 1) |
| SC-J04 | «- Vocabulary green marks this lesson's taught terms wherever a child reads them: in task text, teaching sentences, sticky knowledge, success criteria and captions alike, every occurrence, so the word looks the same on slide 12 as it did on its vocabulary card and a child recognises it as the word they were taught.» «Success criteria arrive with the taught word already marked as `{{word}}` in the lesson designer's own wording (`preferences.md` → Success Criteria), and that mark is what colours it there.» | every slide, for the lesson's taught terms only (J13 carries the scope and the answer-reveal exception) | must | `vocabulary` emphasis role, `{{...}}` | `references/teacher-slide-visual-profile.md` › Semantic colour · L114 | shared with vocabulary (VOC-N19, which it pins); agrees with decision 16 and pulls against J03's limit | VP |
| SC-J05 | «- **Pick out the one word that changes between rows.** The deciding word — *answer*, *first number*, *second number* — is what the child must identify before they can act, so give it visual weight with the orange `<<...>>` mark for the part to decide (`preferences.md` → Success Criteria) while the scaffolding around it ("Is the ___ missing?") stays plain.» | a lookup table | must | `<<...>>` | `references/teaching-sequence-skill-based.md` › Writing the Success Criteria · L170 | near-duplicate of J02 for tables | SKILL |
| SC-J06 | «The colour marks inside a criterion (`((...))`, `{{...}}`, `<<...>>`) are part of the lesson designer's wording: copy them as they arrive, because the worksheet and the wall copy the same marks and a mark added or dropped on the board shows the child a different colour in each place.» | the slide designer | must | | `references/slide-success-criteria.md` › Fit the complete reference · L35 | rule (the slide copy of the marks) | SSC |
| SC-J07 | «**Where the move is a change to something children can see, mark it on the thing itself, not only in the criteria.**» «Marking the part it acts on inside the case (`Round 34<<6>> to the nearest 100.`) turns a described method into a demonstrated one, and the same orange mark the criteria use (`preferences.md` → Success Criteria, `<<the part to look at or decide>>`) carries it, so the criterion and the case point at the same thing.» | a modelled case, with the two limits in J14 | default | `<<...>>` | `references/modelling-formats.md` › Live-complete helper · L19 | shared (modelling); ties the case's mark to the criteria's | STAYS |
| SC-J08 | «**Green has a fixed teaching role.** Green pupil-facing text is reserved for answers being revealed or marked, vocabulary emphasis, vocabulary slides and success-criteria treatment.» | every slide | must | | `references/preferences.md` › Slide Philosophy › Slide Designer presentation rules · L593 | shared (slide colour) | STAYS |
| SC-J09 | «- green remains reserved for revealed answers and vocabulary headwords according to the existing contract.» | the slide designer | must | | `references/slide-composition-playbook.md` › 5 · L147 | shared (slides); narrower than J04 and J08: no taught words in text and no criteria green (for the slide topic) | STAYS (later topic) |
| SC-J10 | «Vocabulary and success criteria keep their established green roles.» «Ordinary question lists and success-criteria steps stay out of that palette.» | the slide designer | must (code: the builder refuses `categoryColor` on `steps`) | `categoryColor` | `references/slide-composition-playbook.md` › Colour · L404 | shared (slide colour); a builder test pins the second sentence | STAYS |
| SC-J11 | «Everything else on the slide is black - ordinary teacher explanation, statements, takeaways, success-criteria body text, reminder body text, and the instructions children act on.» | every slide | must | | `references/preferences.md` › Slide Philosophy › Slide Designer presentation rules · L587. Copy: SC-J12 | shared (slide colour): criteria text is black apart from its marks | STAYS |
| SC-J12 | «- Black carries everything else the board says: teacher explanation, supporting prose, statements, takeaways, success-criteria body text, reminder body text, and the instructions children act on.» | every slide | must | | `references/teacher-slide-visual-profile.md` › Semantic colour · L104 | duplicate of J11 | STAYS |
| SC-J13 | «The terms are the lesson's vocabulary cards (and a prior lesson's term the design says children already hold), not every subject noun on the slide: `biome` and `climate` are green on a lesson that taught them; `country` is not.» «Answer reveals keep their own green, so a taught term inside a revealed answer is not marked twice.» | which words count as taught for the green mark | must | `vocabulary` | `references/teacher-slide-visual-profile.md` › Semantic colour · L114 | rule; shared with vocabulary (VOC-N19) and assumed knowledge (AK-F29: the design has nowhere to say a prior lesson's term is held); the scope decision 1 needs | VP |
| SC-J14 | «Two limits. Where the move is a judgement rather than a change to a visible part, there is nothing to mark and nothing is marked. And the mark is on the part the move acts on, never on the answer: marking what changes shows the child where to work, while marking what it becomes does the work for them.» | the orange mark on a modelled case | must not | `<<...>>` | `references/modelling-formats.md` › Live-complete helper · L19 | rule (J07's two limits); nothing in group J says the criteria's own orange mark may not sit on the answer | STAYS (PREF-SC may want the same limit) |
| SC-J15 | «`{{green}}` or `{{answer-green}}` on a teaching slide.» «Vocabulary and success criteria keep their established green treatments.» | the slide catalogue | must not | inline colour markers | `references/templates.md` › `text` · L697 | shared (slides): bans a green marker on the very teaching slides the criteria's `{{...}}` marks sit on (for the slide topic) | STAYS |

## K. The panel on a slide: its look, its slot and its size

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-K01 | «The SC needs to read as the success criteria, not as a free-floating list. The fixed `*-sc` templates and the `sc-panel` content object carry a "✓ Success Criteria" heading automatically. The standalone `success-criteria` template does not: it prints "Success Criteria" as the slide title over a plain body zone, so a `steps` object placed there keeps its own heading.» «Prefer the labelled slot over dropping the steps into a bare `primary`/`secondary` zone of a free template, where a child sees a column of imperatives under the question and has no way to tell those steps are the standard to work to.» | every slide carrying criteria | must | `*-sc` templates, `sc-panel`, `success-criteria`, `steps.heading` | `references/slide-success-criteria.md` › Prefer a slot that labels the panel · L13. Copies: SC-K14, K19 | rule | SSC |
| SC-K02 | «When procedural `steps` are shown inside a success-criteria panel, use the same internal treatment whether the panel comes from a fixed `*-sc` template or the free `sc-panel` content object:» «- pale green outer panel; - `✓ Success Criteria` heading; - one compact white card per criterion; - green number badges; - one shared readable step-text size.» «Only the panel dimensions change with the layout. Do not switch the same procedural criteria to a flat divided list merely because a free template carries it.» | every panel | must (the builder draws one geometry) | `success-criteria-panel.js` | `references/slide-success-criteria.md` › One success-criteria object keeps one visual identity · L19. Copy: SC-K03 | rule; a builder test pins this section's heading | SSC |
| SC-K03 | «- Success criteria keep one identity across templates: the pale green panel, the `✓ Success Criteria` heading, and one compact white card per criterion with a green number badge. The route to the panel (fixed `*-sc` template or free `sc-panel`) never changes that identity; a flat divided rendering of the same criteria beside a white-card version is a local visual inconsistency.» | every panel | must | | `references/teacher-slide-visual-profile.md` › Repeated-reference identity · L161 | duplicate of K02; a builder test pins "one compact white card per criterion" here, so it cannot become a bare pointer without moving that test | VP |
| SC-K04 | «Sometimes a free template genuinely is the right geometry, most often because the criteria is a *wide visual reference* (a labelled `row` of diagrams) that needs a full-width strip the narrow `*-sc` side-panel can't give. There, wrap the criteria in an `sc-panel` content object so it keeps the full green-box identity (the rounded green box and the "✓ Success Criteria" label) wherever it sits, instead of rendering as a bare list or row a child reads as just more content. Use `sc-panel` only *outside* the `maths-*-sc` templates; their own criteria slot already draws the box, so wrapping there would double it.» | criteria in a free template | must | `sc-panel` | `references/slide-success-criteria.md` › When a free template is the right geometry · L31. Copies: SC-K09, K10 | rule | SSC |
| SC-K05 | «Five short steps is a useful default, not the capacity of every composition. Try the complete approved method in the existing `*-sc` panel. If it cannot share the screen with readable questions and a genuinely usable working surface, use a roomier free composition with `sc-panel`; changing panel width and height is a presentation decision, up to half the slide's area.» «The build refuses a bigger panel (`SC_PANEL_TOO_LARGE`) on any slide but a `success-criteria` slide, whose only job is the criteria and which may fill the slide; past half, show fewer criteria on the slide or give them that slide of their own. Keep the order, wording and necessary steps together wherever children need the whole method. Do not split the concept, drop steps, merge their wording or fragment an otherwise coherent practice set to fit the default sidebar.» | every panel; exception: a slide whose only job is the criteria may fill it | must (code: `SC_PANEL_TOO_LARGE`) | `SC_PANEL_TOO_LARGE`, template `success-criteria` | `references/slide-success-criteria.md` › Fit the complete reference, not a step-count quota · L35. Copies: SC-K07, K08, S18 | rule; your ruling (15 September: "I never want success criteria to take more than 50% though", and the criteria slide "is allowed to be full slide of course"; your words are only in the log, 4.2.211); "show fewer criteria" pulls against "drop steps" in the same paragraph (decision 3) and "that slide of their own" against H01 (decision 4); "Five short steps is a useful default" reads as a step target, and the build's capacity warning prints the same five as what "the panel holds at a readable size" (decision 11) | SSC |
| SC-K06 | «Steps carry an 18pt minimum through both initial layout and the final text-fitting pass. That floor is a backstop, not a claim that every slide at 18pt is good: inspect the rendered task, reference and writing space together at projection size. A word-count review cue is not permission to shrink text or bypass a failed build. If no supported composition can present the necessary work, report the specific representation or layout capability needed through the existing repair route rather than pretending the lesson only needs five steps.» | every panel | must (code: 18pt floor) | `STEP_TEXT_OVERLOAD` | `references/slide-success-criteria.md` › Fit the complete reference, not a step-count quota · L37 | rule | SSC |
| SC-K07 | «**The complete method must still fit beside usable work.** Counts are review cues, not a reason to merge distinct actions, omit a step, split a concept artificially or scatter one practice set across extra slides. The review packet exposes longer lists and wording for judgement. The Slide Designer must keep every needed step and the task readable, using a roomier existing composition when necessary; `slide-success-criteria.md` owns that placement. Actual unreadability or insufficient working space remains a blocking fault. A method is not two methods merely because a narrow panel cannot hold it.» | every panel | must | | `references/preferences.md` › Success Criteria · L449. Copies: SC-D36 (its last sentence), K05, Q01 | rule | PREF-SC (the principle), SSC (the placement) |
| SC-K08 | «A panel takes at most half the slide's area; the build refuses a bigger one (`SC_PANEL_TOO_LARGE`) everywhere except a `success-criteria` slide, whose only job is the criteria.» | every panel | must (code) | `SC_PANEL_TOO_LARGE` | `references/templates.md` › sc-panel · L1758 | duplicate of K05 | TPL |
| SC-K09 | «Wraps a success criteria in its green "✓ Success Criteria" box, so the criteria reads as the standard wherever it sits — use when the success criteria has to go somewhere the `maths-*-sc` panel can't reach (a wide visual reference in a full-width strip, a free-template zone).» «Carries an optional `flipchart: true` for a draw-live criteria — same corner flipchart drawing as the `*-sc` panels; set it on the `sc-panel` object itself here with `criteriaRef` naming the displayed source criterion» | the content-type catalogue | mechanics | `sc-panel`, `flipchart`, `criteriaRef` | `references/templates.md` › 1.2 Content objects (helpers) · L99 | duplicate of K04 and L06 | TPL |
| SC-K10 | «A success-criteria panel as a content object: the green rounded box with its "✓ Success Criteria" label, wrapped around whatever criteria you put inside. It exists so the success criteria reads *as* the standard — the same green identity children know from every practice slide — even when it can't sit in the fixed right-hand panel of the `maths-*-sc` family.» «in a narrow sidebar (E-narrow) the panel takes `steps`, `text` or a list and a `table` is refused: a two-column "The change / The reason" criteria table in a sidebar blanked both task slides of a Year 4 PSHE deck on 21 September 2026.» «Put the criteria under one of them — a panel that carries neither renders an empty green box, and the build now warns when that happens.» | `sc-panel` | mechanics | `sc-panel` `label`, `content` or `criteria` | `references/templates.md` › sc-panel · L1737 | mechanics with a story (in the log, 21 September); near-duplicate of K04 that carries the sidebar refusal, the two keys and the empty-panel warning (K43 has the rest of the paragraph) | TPL |
| SC-K11 | «- `criteria` (required) — a content object (typically `type: "steps"` or `type: "table"`)» «- `criteriaLabel` (optional) — panel label, defaults to "✓ Success Criteria"» | the `*-sc` templates | mechanics | `criteria`, `criteriaLabel` | `references/templates.md` › maths-turn-sc · L179 | mechanics | TPL |
| SC-K12 | «**Minimum useful size:** ~0.4–0.5″ per row at intended typography (each row carries a numbered badge plus 18pt bold text). 5 steps needs ~2.0–2.5″ of zone height. The bottom strip of `centre-big-v` (~1.66″) cannot hold 5 steps at full size — for SC of 4+ steps, use a template with a dedicated SC panel (`maths-turn-sc`).» | a `steps` object | mechanics | `steps` | `references/templates.md` › steps · L742 | mechanics | TPL |
| SC-K13 | «**Two capacity checks preserve every word and item.** `FIXED_CAPTION_CAPACITY` and `SUCCESS_CRITERIA_CAPACITY` never shorten, remove or rewrite content. The ordinary builder reports them as warnings. The Slide Designer's final `check-slide-design.js` gate treats them as blocking composition diagnostics» «It must not edit source-authored wording or remove referenced criteria.» | the slide design check | mechanics | `SUCCESS_CRITERIA_CAPACITY` | `references/templates.md` › 5. Zone class compatibility · L3024 | stale: the gate no longer blocks on `SUCCESS_CRITERIA_CAPACITY` (4.2.245, your 10 September ruling; SC-S19); decision 11 | TPL (correct) |
| SC-K14 | «Success criteria should read as success criteria, not as a free-floating list. Use a labelled `*-sc` slot or `sc-panel` treatment and keep the panel beside what its steps refer to.» | the slide designer | must | | `references/slide-composition-playbook.md` › 9 · L242 | duplicate of K01 and H34 | PB |
| SC-K15 | «Do not rebuild a maths My Turn, vocabulary reveal, success-criteria reference or two-card comparison from generic splits merely to be different.» | choosing a template | must | | `references/slide-composition-playbook.md` › 2 · L39 | shared (templates; VOC-N12 is the same sentence) | STAYS |
| SC-K16 | «- success criteria and references remain usable but do not compete with the task;» | a practice slide | must | | `references/slide-composition-playbook.md` › 5 · L145. Copy: SC-K17 | rule | PB |
| SC-K17 | «**Repeated reference material recedes; the current move leads.** Across a run of slides that share a reference (a success criteria panel, a word bank, a chart, a sticky fact), the reference keeps one consistent, quieter place and proportion, and the thing that has changed since the last slide is the largest and first-read element» «Receding is position and proportion, never truncation: the reference stays complete and readable, per §9.» | a run of slides sharing criteria | must | | `references/slide-composition-playbook.md` › 5 · L159 | rule | PB |
| SC-K18 | «Judge support at its actual size alongside the task. A quieter panel must still be readable; a complete panel must not make the source, example or response surface unusably small.» | a panel beside the task | must | | `references/slide-composition-playbook.md` › 6. Space-pressure order · L165 | rule | PB |
| SC-K19 | «- a question-card slot used for explanation or success criteria;» «- the same reference panel dominating three consecutive slides while the thing that changed between them sits small;» «- success criteria floating without a labelled treatment;» | the deck-level read | check | | `references/slide-composition-playbook.md` › 14. Deck-level quality tells · L422 | check (the tells for H33, K17 and K01) | PB |
| SC-K20 | «**The same scan path is why support sits late.** Success criteria, a steps list, a word bank or a reminder are things a child glances across at while working rather than reads first, so they come after the work in the scan: normally the right-hand side, sometimes below.» | slide layout | default | | `references/preferences.md` › Slide Philosophy › Slide Designer presentation rules · L616. Copy: SC-N06 | rule (the slide half of N06) | STAYS (Slide Philosophy) |
| SC-K21 | «When a shorter content group sits beside a taller peer such as a photograph, success-criteria panel, table or reference:» | slide alignment | mechanics | | `references/teacher-slide-visual-profile.md` › Whole-composition alignment and useful space · L76 | shared (layout) | STAYS |
| SC-K22 | «A success-criteria panel gives a wrapping sticky line more height than a one-line step.» | sizing | mechanics | | `references/slide-visual-sizing.md` › Room is shared out by what things can use, not by counting · L114 | shared (sizing) | STAYS |
| SC-K23 | «Cramming can come from visual count, text, a source, success criteria, a reference tool or a combination of necessary elements. First choose the most suitable template and layout. When the complete coherent move still cannot remain readable and usable, split it across enough related slides that every necessary element keeps the room it needs.» | a crowded slide | must | | `references/slide-visual-sizing.md` › When necessary content will not fit · L158 | shared (sizing) | STAYS |
| SC-K24 | «**Success Criteria Helper** is the plain-English name for a small, fixed visual placed beside a success-criteria step when that step names a stable visible mark, placement, structure or movement the child makes.» «When a success-criteria step names a stable visible mark, placement, structure or movement the child will physically make, place the matching Success Criteria Helper beside that step.» «An ordinary thinking or calculation step stays as plain text. The helper shows the action itself, never an emoji, and it does not license a decorative picture beside every criterion.» «Within a set, Success Criteria Helpers are intentionally mixed: the steps that name a visible mark get one and the ordinary steps do not.» | a step naming a visible mark | must; must not (decoration) | `helper` keys (the catalogue table) | `references/slide-success-criteria.md` › Terminology: Success Criteria Helpers · L7. Copies: SC-K25, K26 | rule | SSC |
| SC-K25 | «A step is normally a string. A success-criteria step that names a visible notation mark may use `{ "text": "...", "helper": "<catalogue-key>" }` so the engine draws a **Success Criteria Helper** beside the unchanged wording.» | a `steps` object | mechanics | `helper`, legacy `figure` | `references/templates.md` › steps · L738 | duplicate of K24 | TPL |
| SC-K26 | «Use a Success Criteria Helper only when a step names the stable visible mark, movement, structure or placement that the helper depicts. Do not add an icon beside every step as decoration.» | the slide designer | must | | `references/slide-composition-playbook.md` › 9 · L246 | duplicate of K24 | PB |
| SC-K27 | «A catalogue line records an audited decision; it does not make an arbitrary full-size visual suitable. Before adding one, build the proposed geometry at the real 0.68in-wide by at-most-0.62in-high slot, render it on a representative Success Criteria panel, and inspect the slide at full size.» «The code audit in `shared/visual-parity.js` covers every visual primitive, including those kept full-size or judged unsuitable.» | adding a helper | mechanics | `SUCCESS_CRITERIA_AUDIT` | `references/slide-success-criteria.md` › Terminology · L9 | maintainer (text for whoever builds helpers, inside a runtime file) | helper-authoring |
| SC-K28 | «**Audit Success Criteria use in the same manifest.** Every visual primitive has a `SUCCESS_CRITERIA_AUDIT` decision: `both`, `SC-inline`, `full-size`, or `unsuitable`, with a reason.» | building a helper | mechanics (code) | `SUCCESS_CRITERIA_AUDIT`, `successCriteriaHelpers` | `references/helper-authoring.md` › One drawing, on every surface · L109. Copy: SC-K29 | maintainer | STAYS |
| SC-K29 | «A **Success Criteria Helper** is the small treatment of a shared-catalogue drawing beside a success-criteria step. Read `references/slide-success-criteria.md` before adding one.» | the helper builder | must (read) | | `agents/helper-builder.md` › Helper Builder · L15 | maintainer | STAYS |
| SC-K30 | «Questions, writing lines, word banks, frames of labelled lines, tables of words and success-criteria panels are set as each surface's own text, so a teacher can edit the words in PowerPoint and a sheet can wrap them to its column.» | building a helper | mechanics | `TYPED_LAYOUT`, `WORKSHEET_LAYOUT_EXEMPT` | `references/helper-authoring.md` › One drawing, on every surface · L105 | shared (helpers) | STAYS |
| SC-K31 | «When a sticky fact needs to be visible on a practice slide (My Turn / Our Turn / Your Turn), the default is to fold it into the success-criteria panel as a reference line: the criteria slot takes two things, the SC steps plus one reference, rather than a separate box beside it.» «When a spec still hands you a sticky line that only says what the numbered steps already say, let the steps be the reference and add nothing: a restating line reads to a child as a puzzling extra step under the method.» | a sticky fact on a practice slide | default | leading `✨` in `steps` | `references/slide-success-criteria.md` › Sticky knowledge shares the panel · L99 | shared (sticky knowledge): the panel's second tenant | STAYS |
| SC-K32 | «Sticky knowledge appears only where the current unit references it. Follow the combined-panel and deduplication mechanics in `slide-success-criteria.md`; do not create a second box merely because the template has room.» | the slide designer | must | | `references/slide-composition-playbook.md` › 9 · L248 | shared (sticky knowledge) | STAYS |
| SC-K33 | «one small reference in `secondary` — a bare `place-value-chart` heading strip, a `chip-bank` of the category words, a short `text` criteria line.» «What the rail may hold: a bare `place-value-chart` heading strip (`rows: []`), a `chip-bank` of the category or vocabulary words, a short `text` criteria line. One reference, not a panel of them.» | the quick-check rail | may | `split-h-75-25` | `references/templates.md` › 3.1 Two-zone splits · L527 | shared (quick checks): a criteria line on the question slide children answer from (H05's check slide is the answer slide, so no conflict) | STAYS |
| SC-K34 | «Entries marked `SC-inline` are deliberately compact actions, not fake standalone diagrams. Use the normal task-specific full-size visual (`venn`, `carroll`, `tally-chart`, `turn-diagram`, `numberline`, `bar-chart`, `place-value-chart`, and so on) in the teaching area, and use the catalogue key only beside the matching step.» | a Success Criteria Helper | must | `SC-inline`, `both`, helper keys | `references/slide-success-criteria.md` › Success Criteria Helpers · L83 | mechanics (the helper catalogue table above it lists the keys) | SSC |
| SC-K35 | «When the success-criteria panel is already filled by a multi-row branch or lookup table, do not crush the table merely to force a second box into the same slot. This exception changes **physical placement only**. It does not authorise omission of a fact named in the source unit's `stickyKnowledgeRefs`.» | a sticky fact beside a criteria table | must | `stickyKnowledgeRefs` | `references/slide-success-criteria.md` › Sticky knowledge shares the panel · L103 | shared (sticky knowledge) | STAYS |
| SC-K36 | «Their geometry and typography are tuned to a specific teaching moment — a My Turn slide, a vocabulary reveal, a success-criteria reference.» | choosing a template | | | `references/templates.md` › 1.1 Two families of templates · L20 | duplicate of K15 | STAYS |
| SC-K37 | «**Purpose:** My Turn or Our Turn slide with a full-height SC panel on the right, and a diagram or visual helper as part of the question.» «**Purpose:** As `maths-your-turn` but cards narrower with a full-height SC panel on the right.» | the `*-sc` templates | mechanics | `maths-turn-sc`, `maths-your-turn-sc`, `writing-turn-ref-sc`, `maths-turn-ref-sc` | `references/templates.md` › maths-turn-sc · L176 | mechanics | TPL |
| SC-K38 | «designed for maths modelling slides (My Turn / Our Turn) that need four pieces stacked: question, abstract diagram (e.g. two part-whole models in a `row`), concrete reference (e.g. coin row), and success-criteria steps. The bottom strip is sized for ~5 step rows at intended typography.» | `quad-v` | mechanics | `quad-v` | `references/templates.md` › 3.2 Three- and four-zone layouts · L542 | mechanics | TPL |
| SC-K39 | «So `sc-panel` being ✓ in E-narrow does not make its `content` legal there: a criteria panel in a sidebar takes text or a list, and a `table` inside it is refused for the sidebar's width.» | `sc-panel` in a sidebar | mechanics (code) | zone class `E-narrow` | `references/templates.md` › 5. Zone class compatibility · L3015 | duplicate of K10 (the same 21 September story) | TPL |
| SC-K40 | «Use it when the criteria has to go somewhere those templates' panel can't reach: a wide labelled reference (a `row` of diagrams) that needs a full-width strip, a Reflect slide, any free-template zone. A success criteria dropped bare into a `split-v` secondary or a plain body zone has no green box and reads to a child as just another list — `sc-panel` restores the identity.» «Do **not** wrap criteria in `sc-panel` when it already sits in a `maths-*-sc` template's `criteria` slot — that slot draws the green box itself, so wrapping would double it. `sc-panel` is for criteria placed *outside* those panels.» | `sc-panel` | mechanics | `sc-panel` | `references/templates.md` › sc-panel · L1739 | near-duplicate of K04: adds "a Reflect slide", the only row that puts criteria there | TPL |
| SC-K41 | «**The rail carries the words a child answers WITH, never the answer.** A heading strip, the category names, a criteria line — those give a child the language and leave the thinking to them.» | the quick-check rail | must | | `references/templates.md` › numbered-questions · L1161 | shared (quick checks); see K33 | STAYS |
| SC-K42 | «e.g. a Your Turn side panel showing success-criteria steps on top and a fraction wall below as a live reference.» | the `stack` container | mechanics | `stack` | `references/templates.md` › stack · L2304 | example (mechanics) | TPL |
| SC-K43 | «Check the nested type's own row before nesting it, and put a criteria table in a wide zone or give the same criteria as lines.» «When the content is procedural `steps`, the steps use the same compact white cards and green number badges as the fixed `*-sc` templates; the route to the panel does not change the criteria's visual identity.» | criteria in a narrow sidebar | may (as lines); must (one identity) | `sc-panel`, zone class `E-narrow` | `references/templates.md` › sc-panel · L1754 | rule; "give the same criteria as lines" lets the slide designer change the form the lesson designer chose (decision 13); the last clause is pinned by a builder test | TPL |
| SC-K44 | «Use it to title a step list inside a free-template zone — e.g. `"heading": "✓ Success Criteria"` over a criteria panel — so the label reads as part of the list.» | a `steps` heading | may | `steps.heading` | `references/templates.md` › `steps` · L740 | mechanics; describes a bare labelled list where K04 and K40 say wrap criteria in `sc-panel` (for the slide topic) | TPL |
| SC-K45 | «Because a `*-sc` panel already prints the heading, a `steps` object you place inside its criteria slot should leave its own `heading` blank» «The `steps` `heading` is otherwise for bare free-template zones (a `split-h-60-40` `secondary`, the steps inside a plain body) that have no label of their own.» | a `steps` object's heading | must (code warns only, SC-S23) | `steps.heading` | `references/slide-success-criteria.md` › Prefer a slot that labels the panel · L13 | mechanics; the second sentence has K44's pull against `sc-panel` identity (for the slide topic) | SSC |
| SC-K46 | «When a reference panel or table is too small to read, the first move is re-shaping - a side panel in a row instead of a full-width band under the task, a tighter card, a different template - not growing its share of the stack, which squeezes the task the reference serves.» | the slide designer's focused repair | must | | `agents/slide-designer-focused-repair.md` › Repair and check · L85 | near-duplicate of H07's last sentence, for a role that never reads the playbook | STAYS |
| SC-K47 | «A vertical list of steps needs a tall zone.» | choosing a zone | mechanics | | `references/slide-composition-playbook.md` › 2 · L41 | shared (layout) | STAYS |

## L. Building the criteria live with the class (`drawLive`)

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-L01 | «**Criteria the class will need beyond today's screen are worth building *with* them and keeping up.** Two kinds earn it. A labelled set that a later lesson assumes as known: the named angles a properties-of-shapes lesson leans on, the word classes a later grammar lesson reuses, the four tooth types a diet lesson names. And a method children will run across a sequence of lessons: the exchange steps that 10, 100 and 1,000 more-or-less all share, the column method a week of addition builds on. Building either live gives children a generative, physical encounter with it, and the sheet stays up as the reference for the lessons where it is no longer on screen.» «Mark such a criteria `drawLive: true`; the slide then carries a small flipchart drawing in the corner of its green panel, suggesting the possibility to the teacher, and the working wall reproduces the same reference. The drawing is the whole cue: the slide stays otherwise unchanged, with no extra note or instruction for the children.» | a labelled set a later lesson assumes, or a method run across a sequence | must (code: `drawLive` is a required true or false) | `drawLive`, slide `flipchart`, `criteriaRef` | `references/preferences.md` › Success Criteria · L455. Copies: SC-L04 to L10 | rule; "the working wall reproduces the same reference" is decision 5 | PREF-SC |
| SC-L02 | «The teacher wrote a "how to exchange" list on the flipchart by hand during the 1,000 more-or-less lesson because the deck offered nothing to keep (8 September 2026); that is the cue this marking exists to give in advance.» | illustrates L01 | | | `references/preferences.md` › Success Criteria · L455 | story (in the log, 4.2.109 and 4.2.110; also in the check's own docstring) | LOG; the reason can stay undated |
| SC-L03 | «What does not earn it is a one-lesson method with no life after today, a set of steps that only paraphrases the question, or a lookup written for one task's numbers. Marking every criteria makes the cue mean nothing; the test is whether the teacher would sensibly write this up large and leave it on the wall for next week.» | the limit on L01 | must not | | `references/preferences.md` › Success Criteria · L457 | rule (limit) | PREF-SC |
| SC-L04 | «**Mark criteria worth keeping beyond today as `drawLive: true`.** A labelled set a later lesson assumes (named angles, word classes, the four tooth types) or a method children run across a sequence (the exchange steps shared by 10, 100 and 1,000 more-or-less) is worth building live and leaving on the wall; the slide then carries the flipchart cue and the working wall reproduces it. A one-lesson method or a lookup written for one task's numbers stays unmarked, so the cue keeps its meaning.» | as L01 | must | `drawLive` | `agents/lesson-designer.md` › Success Criteria Types · L291 | duplicate of L01 and L03 | LD-SC (recording only) |
| SC-L05 | «`drawLive: true` marks a criteria worth building live and keeping beyond today: a labelled set a later lesson assumes, or a method children run across a sequence of lessons (`preferences.md` → Success Criteria). The slide carries the flipchart cue for it and the working wall reproduces it. It does not prescribe where the teacher writes.» | recording | mechanics | `drawLive` | `references/output-template.md` › Success criteria · L322 | duplicate of L01, plus "it does not prescribe where the teacher writes" | OT |
| SC-L06 | «- A criteria whose source object carries `drawLive: true` sets `flipchart: true` and `criteriaRef` to its source ID on the same owner: at slide level beside `criteria` on the `*-sc` templates, on the `sc-panel` object elsewhere. Keep the actual source content inside that panel. `check-drawlive-handoff.py` checks each cue's location and source, not merely whether any flag exists on the slide; `slide-success-criteria.md` owns placement and legacy inference.» | the slide designer | must (code) | `flipchart`, `criteriaRef`, `DRAWLIVE_HANDOFF_OK` | `agents/slide-designer.md` › 6. Place source references exactly · L258. Copies: SC-L07, L08, K09 | mechanics | SSC |
| SC-L07 | «When setting `flipchart: true`, put `criteriaRef: "sc-001"` beside it on the same cue owner: the slide for a fixed `*-sc` template, or the `sc-panel` object in a free layout. It must name the source criterion actually shown inside that panel and be included in the slide's `successCriteriaRefs`. Do not put the flag on an arbitrary nested object or in notes; those locations do not draw the cue.» | the slide designer | must (code) | `flipchart`, `criteriaRef` | `references/slide-success-criteria.md` › Bind a live-drawing cue to its own reference · L41 | mechanics | SSC |
| SC-L08 | «- `flipchart` (optional) — set `true` when the lesson-designer marked this criteria `drawLive: true` (a labelled set a later lesson assumes, or a method children run across a sequence of lessons). Renders a small flipchart drawing in the panel's top-right corner suggesting to the teacher that this is worth building live and keeping; nothing else on the slide changes.» | the `*-sc` templates | mechanics | `flipchart` | `references/templates.md` › maths-turn-sc · L182 | duplicate of L01 (the slide side) | TPL |
| SC-L09 | «A separate optional draw-live pencil cue remains governed by `preferences.md`: when the lesson designer judges that a reusable reference would be useful to copy verbatim onto a working wall, the cue may suggest that possibility. It is never an instruction to the teacher and adds no child-facing or speaker-note direction.» | a modelled helper | must not (instruct the teacher) | | `references/modelling-formats.md` › Choosing and handing off the state · L44 | near-duplicate of L01: calls it a "pencil cue" (the builder draws a flipchart) and frames it as copying onto a wall rather than building with the class | PREF-SC (pointer) |
| SC-L10 | «The teacher decides how to annotate or complete the helper. Do not instruct them to use a flipchart, whiteboard, book, visualiser or another named surface.» | modelling | must not | | `references/modelling-formats.md` › Live-complete helper · L21 | shared (modelling); why the cue is a drawing and never a note | STAYS |
| SC-L11 | «A success criteria carrying `flipchart: true` in `lesson.json` is a direct signal of exactly this card. The flag means the lesson design suggests that copying the reference live to a flipchart or working wall could be useful; it does not require the teacher to do so, and the matching card is the printable version for lessons where that reference is not built by hand.» «**The flag is evidence, not a licence.** It does not answer the point-at test and never skips it: a reference worth writing on a flipchart for one lesson is often worth nothing on a wall the following week. Success criteria are where this is easiest to forget, so ask the prior question first: one lesson's task steps, or a method children run again in a named later lesson? The exchange steps shared by 10, 100 and 1,000 more-or-less pass. "Write the date, describe the source, explain your answer" does not, whatever flag it carries: that belongs on today's board.» | the wall designer | must | `flipchart` | `agents/working-wall-designer.md` › Diagrammatic LOs · L168 | contradiction with L01, L04, L05 and L12 (decision 5): the flag does not send a reference to the wall; the point-at test decides | WALL |
| SC-L12 | «Success Criteria (whose draw-live marking is what sends a reference to your wall)» | the wall designer's reading | pointer | | `agents/working-wall-designer.md` › Before You Start · L44 | pointer; pulls against L11 in the same file (decision 5) | WALL |
| SC-L13 | «When a flipchart-flagged criteria passes the point-at test and reproduces as a supported card, copy its categories, steps and pictures faithfully so the printed reference and the hand-drawn one are the same thing.» | the wall designer | must | | `agents/working-wall-designer.md` › Diagrammatic LOs · L170 | rule | WALL |
| SC-L14 | «Check the visible `drawLive` decision in both directions: a reusable method or reference may deserve it even when false, while a one-off lookup need not be flagged; do not mark everything or ask a validator to decide pedagogy;» | the reviewer | check | `drawLive` | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L210 | rule | REV |
| SC-L15 | «Require: DRAWLIVE_HANDOFF_OK» | the slide stage of a run | must (code) | `check-drawlive-handoff.py`, `DRAWLIVE_HANDOFF_OK` | `skills/make-lesson/playbook-lite.md` › Track A · L663 | mechanics | STAYS (the playbook) |

## M. Continuing an earlier lesson's criteria

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-M01 | «Where today continues it, reuse its `criteria.steps`, vocabulary definitions, sticky knowledge and representation word for word, because a reworded step reads to a child as a new rule. Where today moves on, it informs the starter only.» | today continues the previous lesson | must | `PREVIOUS_LESSON_DIR` | `agents/lesson-designer.md` › Before You Design Anything · L127. Copies: SC-M02, M03 | rule; shared with vocabulary (VOC-K03, the fullest copy) | STAYS (continuity; the criteria half could be named in PREF-SC) |
| SC-M02 | «Earlier lessons tell you what children already hold, so continuity is real rather than assumed - reuse their success criteria, sticky knowledge, vocabulary and representation verbatim where this lesson continues them.» | as M01 | must | | `agents/lesson-designer.md` › Before You Design Anything · L123 | duplicate of M01 (VOC-K01) | STAYS |
| SC-M03 | «- **Continuity:** Brief says continues prior → reuse prior SC, sticky, vocab, rep verbatim - no paraphrase. If brief signals change, audit together.» | as M01; exception: the brief signals a change | must | | `agents/lesson-designer.md` › Before You Design Anything · L126 | duplicate of M01 (VOC-K02), plus the exception | STAYS |
| SC-M04 | «It is not a lesson inside the lesson: one move, modelled on one or two cases and used once, and its criteria are the first steps of the main method's criteria, word for word, so the panel children meet next already starts with them.» | a short cycle for a missing step | must | | `references/teaching-sequence-skill-based.md` › Cycles, and the beats around them · L192 | rule (continuity inside one lesson); shared with the rhythm | SKILL |

## N. The worksheet (shared with the worksheet topic)

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-N01 | «13. **Include success criteria only when the upstream worksheet decision requires them.** Omit a duplicated panel when the surrounding lesson context already supplies the reference adequately. Include the exact concise criteria when the sheet must stand independently or access depends on that reference, colour marks (`((...))`, `{{...}}`, `<<...>>`) included, so each step is coloured as it was on the board. Do not invent criteria and do not remove required criteria for layout convenience. A one-line job statement for a reference under rule 12 is not a criteria panel.» | a generated worksheet | must | `worksheet.successCriteriaRefs` | `agents/worksheet-designer.md` › Rules that never change · L912. Copies: SC-N08, N09, H09 | rule; decision 8 (whether a sheet reprints the criteria) | WS |
| SC-N02 | «14. **Criteria and taught method steps are drawn with `steps`, never written as an `instruction`.** `steps` prints the pale green panel the class worked from on the board - green tick heading, numbered badges, one white card per criterion - so a child who followed those steps on the board recognises the same object on their paper and can find step 4 at a glance.» «The engine now refuses an instruction of three lines or more for exactly this reason. Price the panel honestly when you place it: six criteria stand about 55mm, against the 40mm the same words cost as prose, so a full sheet may have to carry fewer criteria, put the panel beside something in a row, or leave it to the board. Fewer criteria on the paper is a real answer - the board has all of them.» | a worksheet carrying criteria | must (code: an instruction of three or more lines is refused; the engine counts line breaks in the text, not printed lines, so a list run together on one line passes) | `steps` helper, `instruction` | `agents/worksheet-designer.md` › Rules that never change · L921 | rule; "a full sheet may have to carry fewer criteria" pulls against N01's "do not remove required criteria for layout convenience" and N04 (decision 3) | WS |
| SC-N03 | «Written as an instruction they print as a grey paragraph, which is what a Year 4 rounding sheet shipped: seven lines at the foot of the page, indistinguishable from `Use the place value chart to help you.`» | illustrates N02 | | | `agents/worksheet-designer.md` › Rules that never change · L925 | story (in the log) | LOG |
| SC-N04 | «- Confirm any criteria or taught method steps are a `steps` panel, not an instruction carrying a list.» «- Confirm every required visual, support and success criterion from upstream is present.» | the worksheet designer's final preflight | check | | `agents/worksheet-designer.md` › Final preflight · L945 | check | WS |
| SC-N05 | «**What sends something to the back is what a child could do without it, not what kind of thing it is.** Ask whether a child who never read it could still produce an answer. Success criteria, a reminder of a method they have already used, a prompt to check their work: yes, and those improve or check an answer that already exists, so they come after.» | where support sits on a sheet | must | | `agents/worksheet-designer.md` › Worksheet Designer · L157 | duplicate of N07 for the worksheet designer | WS |
| SC-N06 | «**Support comes after the work in the reading order, not before it.** Steps, success criteria, a word bank, a reminder or a worked reference are things a child glances across at while working rather than reads before starting, so they sit later in the scan than the work does: normally the right-hand column, sometimes a band below.» | where support sits on a sheet | default | | `references/preferences.md` › Worksheets › The printed page · L739. Copy: SC-K20 | rule; shared with worksheets | STAYS (Worksheets) |
| SC-N07 | «A step list a child must work *through* in order before they can answer anything is not support at all: it is part of the task, and goes above the questions in their own column like anything else they read from.» «Success criteria, a reminder of a method they have already used and a prompt to check their work all pass that test, because they improve or check an answer that already exists, and those are what "after" was written for.» | where support sits on a sheet | must | | `references/preferences.md` › Worksheets › The printed page · L743 | rule; shared with worksheets | STAYS (Worksheets) |
| SC-N08 | «**Decide whether worksheet itself needs SC.** Apply `preferences.md` → Support, Checking and Release to the worksheet's actual tasks and intended use. Check reused criteria against the worksheet's evidence and response, not only the board task they originally served. Include a suitable concise reference when the sheet must stand independently or access depends on it; omit the printed copy when the same suitable reference explicitly remains available elsewhere. Record that access in existing planning fields, without adding classroom instructions to every question.» | the designer choosing the sheet's criteria | must | `worksheet.successCriteriaRefs` | `references/lesson-designer-components.md` › Generated worksheet · L71 | near-duplicate of N01: adds "check reused criteria against the worksheet's evidence and response" (decision 8) | WS |
| SC-N09 | «- **Only the modelled frame goes on it.** The child fills the same shape they watched the teacher fill. Whatever is already on the slides while they work, most often the success-criteria panel, is on the board for them to consult, so reprinting it on the sheet duplicates what they can already see and spends the space the frame needs.» | a frame worksheet | must | | `references/preferences.md` › Worksheets › What the sheet is for · L704 | rule; shared with worksheets (decision 8) | STAYS (Worksheets) |
| SC-N10 | «`successCriteriaRefs` names the exact success-criteria objects printed on the generated Expected sheet.» | recording | mechanics (code) | `worksheet.successCriteriaRefs` | `references/output-template.md` › Worksheet · L841 | mechanics | OT |
| SC-N11 | «must use empty worksheet-level `successCriteriaRefs` and `stickyKnowledgeRefs`» | a shared-frame worksheet | mechanics (code) | `resourceMode: "shared-frame"` | `references/output-template.md` › Worksheet · L831 | mechanics | OT |
| SC-N12 | «The slip keeps what the sheet prints apart from three things it takes out for itself: the room for answers, the success criteria panel (the `steps` helper, because the child already has it on the board and the working wall), and anything marked `"onSlip": false`.» | question slips for a books sheet | mechanics (code) | `recording: "books"`, `onSlip` | `references/books-or-sheet.md` › Figures the children draw for themselves · L96. Copy: SC-N13 | mechanics; carries your ruling (19 September: "on a slip, I really don't think it's needed at all", only in the log, 4.2.247) | WS |
| SC-N13 | «A slip drops the room for answers and the `steps` success-criteria panel on its own, so neither needs marking.» | question slips | mechanics (code) | | `references/worksheet-helpers.md` › A sheet · L151 | duplicate of N12 | WS |
| SC-N14 | «- `steps` - Success criteria or the steps of the taught method, in the same green panel the class worked from on the board.» | the worksheet helper catalogue | mechanics | `steps` helper | `references/worksheet-helpers/catalogue.md` › Index · L50. Copy: SC-N15 | mechanics | WS |
| SC-N15 | «Success criteria or the steps of the taught method, in the same green panel the class worked from on the board. Nothing in it is written on.» | as N14 | mechanics | `steps` helper | `references/worksheet-helpers/catalogue.md` › steps · L250 | duplicate of N14, plus "Nothing in it is written on." | WS |
| SC-N16 | «Apply `preferences.md` → Support, Checking and Release to independent and optional worksheet use too: plan where needed references and source material remain accessible without filling in the child's comparison.» | content-based worksheets | must | | `references/teaching-sequence-content-based.md` › Teaching Sequence Specification · L59 | shared (support and release) | STAYS |
| SC-N17 | «**Check support against the task at each use.** Follow the selected criteria, worked reference or word bank as a child doing this task with its available materials.» «A separate worksheet need not duplicate a reference that remains accessible, but a resource intended for use on its own cannot assume an unseen board.» | every use of support | check | | `references/preferences.md` › Support, Checking and Release · L505 | shared (support and release; AK-J03 for the second sentence) | STAYS |
| SC-N18 | «**Drop a printed reference the child already has in front of them.** A reference is a thing to consult - a filled example chart, a classification diagram, an anchor image - and it is the one printed element whose removal costs a child nothing when the same thing is on the board or the working wall throughout the lesson.» «You may take one off on your own judgement, including one marked required, when all three hold:» «Record it in a top-level `notes` entry - the channel that reaches the teacher - naming the reference, where the child still meets it, and that the page would not otherwise fit.» | a sheet that does not fit its page | may | `notes` | `agents/worksheet-designer.md` › 4. Trust the refusal · L546 | shared with assumed knowledge (AK-J04); it does not name the criteria, but a criteria panel is such a reference, so this is how a required panel leaves a sheet; pulls against N01 (decisions 3 and 8) | WS |
| SC-N19 | «drop a reference the board is already showing while they work» | the designer pricing a sheet | may | | `references/preferences.md` › Worksheets › The printed page · L725 | shared with assumed knowledge (AK-J16); the same route for the panel (decision 8) | STAYS |
| SC-N20 | «"title": "Use these steps to help you.",» «"Read the question: 10s or 100s?", "Find the 10s or 100s each side.", "Draw a number line. Mark your number.", "Find halfway. Before it or after it?"» | the worksheet `steps` helper's only example | | `steps` `title` (the engine prints "Success criteria" when it is left out) | `references/worksheet-helpers/catalogue.md` › `steps` · L257 | example; decision 7 (question fragments, and a step D26 calls not runnable) and decision 8 (a title other than the board's "✓ Success Criteria"); generated from the worksheet engine's test examples, and a worksheet test pins the title | WS (the engine's example file, then regenerate) |
| SC-N21 | «A grid gives the child the ruled shape and nothing else. If the lesson wants the steps named as well, that is `method-frame`.» | a maths method grid on a sheet | may | `method-frame` | `references/worksheet-helpers/maths.md` › The written methods · L44 | shared (worksheets): a second object for a method's steps beside the `steps` panel; unverified whether its lines count as criteria | WS |
| SC-N22 | «The teacher rejected exactly that on 1 September 2026, on a PSHE sheet whose three steps sat in a 30% left column with the lunch photograph and all three questions squeezed into the 70% beside them; the same page with the columns the other way round gives the task its full run and still keeps the steps in view.» | illustrates N06 | | | `references/preferences.md` › Worksheets › The printed page · L741 | story (in the log, 1 September); shared with worksheets | LOG |

## O. The stick-in pack and the working wall

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-O01 | «These never produce a piece: vocabulary cards, success-criteria panels, the on-board sentence-stem frame (the empty scaffold children write *from*), answer/review slides, and any teacher-modelled My/Our Turn.» | the stick-in pack | must | | `references/stick-in-sheets-pedagogy.md` › Finding the moments - the walk · L49. Copy: SC-O02 | rule (shared with vocabulary, VOC-Q01) | STICK |
| SC-O02 | «The reference's "Finding the moments" section names what never produces a piece (vocabulary cards, success-criteria panels, answer slides, teacher-modelled My/Our Turn).» | the stick-in designer | must | | `agents/stick-in-sheets-designer.md` › How to work · L42 | duplicate of O01 | STICK |
| SC-O03 | «**Prose a child reads may be condensed to fit; a contract a child checks against may not.** The verbatim rule protects the things a child compares board against wall and would stop trusting if the two diverged: success criteria steps, reference-table columns, a misconception's "Don't" and "Do" pair.» | the wall designer | must | | `agents/working-wall-designer.md` › Rules That Never Change · L134. Copies: SC-O04, O05, O06 | rule | WALL |
| SC-O04 | «**Success criteria steps in particular must be verbatim.** When a worked-example card carries the procedure, the step text must match the lesson's success criteria exactly — same number of steps, same wording, same punctuation, and the same colour marks (`((...))`, `{{...}}`, `<<...>>`), which draw the colours the board used. Children see the SC on the slides during teaching and on the wall during practice; if the two diverge, they stop trusting either. Do not summarise the SC into shorter steps for the wall, do not omit a step because it feels redundant on a card.» «If the lesson has both a "past" SC and a "to" SC (or any pair of variant SCs), pick the one your worked-example is showing and copy that SC in full — do not blend or simplify across variants. The 2-line cap exception above does NOT extend to SC steps; if the full SC won't fit at the wall's fixed A3 size, remove non-SC extras from that card; if it still will not fit, omit the card, but never reword the steps.» | a worked-example card | must | `workedExample` | `agents/working-wall-designer.md` › Rules That Never Change · L138 | rule (the fullest copy; the only place saying "omit the card, but never reword the steps"); its "The 2-line cap exception above" points at nothing above it in this file (decision 11); against the wall's length limits O18 to O22 (decision 12) | WALL |
| SC-O05 | «What has to stay word for word is what a child compares board against wall: success criteria steps, reference-table columns, a misconception's "Don't"/"Do" pair.» | wall cards | must | | `references/working-wall-preferences.md` › Wording style · L98 | duplicate of O03 | WALL |
| SC-O06 | «- **Success criteria** - every `criteria.steps` array, with any `flipchart` flag. When you build a worked-example card, the steps must be copied **verbatim** from one of these - same words, same punctuation, same number of steps.» | the wall's view | must | `criteria.steps`, `flipchart` | `agents/working-wall-designer.md` › Step 1: Read the View · L197 | duplicate of O04, plus "with any `flipchart` flag" | WALL |
| SC-O07 | «every success criterion, sticky fact, misconception, stem and vocabulary entry with its ID» «- **Every figure as the board drew it** - each rendered map, chart, diagram, table and success-criteria panel from `lesson.json`, so a wall reuses the board's figure rather than one re-derived from prose.» | the wall's packet | mechanics (code: the packet prints them) | `working-wall-view.md` | `agents/working-wall-designer.md` › Before You Start · L50 | mechanics | WALL |
| SC-O08 | «the figures and criteria then come from `lesson-design.json`» | a run with no `lesson.json` | mechanics | | `agents/working-wall-designer.md` › Step 1: Read the View · L207 | mechanics | WALL |
| SC-O09 | «Match the scale to what the panel carries: when the worked-example card holds the multi-step success criteria verbatim (the usual case), keep the default panel split, which runs the panel full width and stacks a wide diagram like these beneath it, so the steps stay above the readable floor. The steps cannot be shortened to fit (they are copied verbatim), so `visualScale: "dominant"` is the wrong call here» | a sorting lesson's wall card | must | `visualScale` | `agents/working-wall-designer.md` › Diagrammatic LOs · L162 | mechanics (shared with the wall's page work) | WALL |
| SC-O10 | «Where the lesson's success-criteria slide is a clock with hands set to a worked time, the worked-example card's `visual` should be the same clock.» «- The lesson-design's success-criteria slide visual is a drawn diagram of one of the supported primitives.» | a wall card's picture | default | `visual` | `agents/working-wall-designer.md` › Diagrammatic LOs · L150. Copies: SC-O11, O12 | shared (the wall's pictures); "should" (a default) where O11 says "needs" | WALL |
| SC-O11 | «1. **The lesson's success-criteria slide visual is a drawn diagram.** Children have looked at it during teaching. The wall card needs the same diagram or the support evaporates between desk and wall.» | as O10 | must | | `references/working-wall-visual-language.md` › When to attach a `visual` · L126 | near-duplicate of O10, stronger: "needs the same diagram" (must) | WALL |
| SC-O12 | «If the lesson's success-criteria slide carries a labelled or colour-coded version of the diagram, the wall version should match. If the slide carries a plain reference, the wall stays plain.» | as O10 | must | | `references/working-wall-visual-language.md` › Reach for primitive variants when the lesson is teaching · L152 | rule | WALL |
| SC-O13 | «The lesson's success-criteria slide, made big and pinned up. Steps as numbered badges down the left, worked example sentence at the bottom.» | the worked-example card | mechanics | `workedExample` | `references/working-wall-visual-language.md` › How the card types serve the visual language · L185 | mechanics | WALL |
| SC-O14 | «When none of these gives an honest visual and the card does not qualify for the success-criteria exception, it stays on the slides rather than going up as text.» | a wall card with no picture | | | `references/working-wall-visual-language.md` › When to attach a `visual` · L144 | stale: the success-criteria exception belonged to the old visual gate, which the card contracts say was replaced (O16); decision 11 | WALL (correct) |
| SC-O15 | «A card a child can only read word-by-word can't be read from across the room, so it isn't wall furniture - it's slide content. Carry a visual (diagram, photo, or emoji cue), or leave the content on the slides. The one exception is a step-by-step success-criteria card.» | all-text wall cards | | | `references/working-wall-visual-language.md` › Anti-patterns · L237 | stale (same as O14); decision 11 | WALL (correct) |
| SC-O16 | «Why this replaced the older visual gate, which required every card to carry something a child recognises by sight with one exception for a step-by-step success-criteria card: the gate decided cards on whether a picture existed rather than on whether the reference was useful, so it omitted clear text-led references the teacher wanted and waved through a weak card that happened to carry a picture.» | the wall's card test | | | `references/working-wall-card-contracts.md` › The wall-worthy test · L17 | maintainer (the history that makes O14 and O15 out of date) | WALL |
| SC-O17 | «When the lesson-design models the stem with a worked completion (the My Turn slide shows the teacher saying the whole sentence, the worked example fills the blank in front of children, the success criteria carry the modelled version), populate the optional `filled` field on the same stem item.» | a sentence-stem wall card | mechanics | `filled` | `references/working-wall-preferences.md` › Sentence stem formatting · L117 | shared (the wall's stem cards; the card contracts say the same at L314): the criteria may carry a modelled stem | WALL |
| SC-O18 | «**4. Two-line maximum on every item.** Nothing — title, step, worked example, sentence stem, reference cell — wraps beyond two lines.» | every wall card item, criteria steps included | must (code: the build refuses) | | `references/working-wall-preferences.md` › Wording style · L83 | rule; pulls against O04's word-for-word steps (decision 12) | WALL |
| SC-O19 | «≤ 60 characters — "Read the conjunction — what job does it do?" fits; longer steps need splitting.» | a worked-example step | must | | `references/working-wall-preferences.md` › Wording style · L89 | rule; decision 12; says 60 where O20 and O21 say about 62, and its example is a question-fragment step | WALL |
| SC-O20 | «At A3 landscape each body item, counting its label plus two characters for the separator, gets:» «A worked-example step or sticky-knowledge statement that runs past its budget is not a formatting problem to fix later: it is a sentence that was never going to read from the back of the room. Write it short first, and let the build's refusal message, which names the card, the item and the exact overage, aim the repair.» | a worked-example step | must (code) | the budgets `62 characters` and `106 characters` (a wall test pins both) | `agents/working-wall-designer.md` › Write to the card's character budget · L326 | rule; "write it short first" against O04 (decision 12) | WALL |
| SC-O21 | «At A3 landscape, an item that will not fit two lines at the 36pt floor fails the build rather than shrinking further.» | every wall body item | must (code) | heading `## How much text one body item holds` (the wall packet cuts it by title); `62 characters`, `106 characters` (pinned) | `references/working-wall-preferences.md` › How much text one body item holds · L251 | duplicate of O20 | WALL |
| SC-O22 | «A panel too tall for its page is a layout fault you can repair without touching a word: put the card's items, in their order, on two cards of the same type and title, when the wall holds only one teaching card (it takes two).» «An item over its own character budget is different: it fits only reworded, and rewording is not this round's to do, so leave that finding unrepaired and say it needs the wall designer's wording.» | the wall's focused repair | may (split); must not (reword) | `check-repair-scope.py` | `agents/working-wall-designer-focused-repair.md` › Repair and check · L88 | rule: the two-card split decision 3 relies on; the reworded item is decision 12 | WALL |
| SC-O23 | «Optional numbered method, when this part *is* the strategy: `["Find the neighbouring multiples.", "Find halfway.", "Choose the closest."]`. Each step numbers itself in the part's colour.» | a `diagramSection` part | may | `cards[].parts[].steps`; heading `### diagramSection` (a wall test pins it) | `references/working-wall-card-contracts.md` › diagramSection · L101 | mechanics with example: a second home for a method's steps with no word-for-word rule (O04 covers only a worked-example card), and its example is the step D26 says tells a child nothing (decision 7); the complete example at L122 and a wall test use the same three steps | WALL |
| SC-O24 | «Lesson teaches an explicit multi-step procedure children will repeat; Model is durable (still useful in 2 weeks); Worth glancing back at, not just doing once; Includes a finished worked example, not just steps» | whether a lesson's criteria can go on the wall at all | must | heading `### workedExample` (a wall test pins it) | `references/working-wall-card-contracts.md` › workedExample · L183. Copy: SC-O25 | rule: a method's steps reach the wall only with a finished worked example, so a method the lesson never works through to a finished example has no card (decision 5); a labelled set can still go up as a poster (L11) | WALL |
| SC-O25 | «- A worked example modelled on the slides becomes a `workedExample` card with the same finished sentence/equation visible — not just the steps.» | the wall | must | `workedExample` | `references/working-wall-preferences.md` › Match the lesson's visual supports · L31 | duplicate of O24 | WALL |
| SC-O26 | «- **Maths**: number the steps ("Step 1", "Step 2"). Always.» «- **English**: label semantically ("What", "Why", "How") rather than numbering, where the procedure has named phases.» «- Always end a worked example card with one labelled `"Worked example"` item that shows the model applied to a concrete case.» | a worked-example card | must | heading `## Step labels in worked examples` (the wall packet cuts it by title) | `references/working-wall-preferences.md` › Step labels in worked examples · L106 | mechanics; an English card relabels the criteria's numbered steps (found in passing) | WALL |
| SC-O27 | «every word on a card is copied verbatim from upstream — the success-criteria steps in the same words, the same punctuation, the same number of steps. A paraphrased step is a card that contradicts the board it hangs beside.» | the wall designer | must | | `agents/working-wall-designer.md` › How You Work · L32 | duplicate of O04, and the reason the wall designer may not hand the work to another agent | WALL |
| SC-O28 | «This is how children learn "the green cards are how-to-do-it cards" without anyone telling them.» «If the lesson teaches a procedure, that is a `workedExample` card; it goes on a green panel, with the green identity.» | a wall card's colour | must | `workedExample` | `references/working-wall-visual-language.md` › 4. Saturated panels · L86 | shared (wall): the wall's version of K02's green identity | WALL |

## P. Below and Greater Depth

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-P01 | «- a more sophisticated constraint or success criterion;» | Greater Depth | may | | `agents/adaptation-designer.md` › 9. Design the Greater Depth work · L264. Copies: SC-P03, P04 | rule | ADAPT |
| SC-P02 | «Keep or add a representation, vocabulary bank, reference, scaffold or success criterion when it enables the deeper reasoning without supplying its answer. Remove support only when consulting it would perform the thinking being assessed.» | Greater Depth | must | | `agents/adaptation-designer.md` › 9. Design the Greater Depth work · L271 | rule; shared with vocabulary (VOC-P09) | ADAPT |
| SC-P03 | «When the task is open, Greater Depth may use the same central task with richer input, sharper criteria or a higher standard for the outcome rather than an extra prompt block.» | an open Greater Depth task | may | | `agents/adaptation-designer.md` › 9. Design the Greater Depth work · L282 | near-duplicate of P01: adds "When the task is open" and "rather than an extra prompt block" | ADAPT |
| SC-P04 | «When the common task is open, Greater Depth may remain the same central task with richer input, sharper success criteria, a more demanding reference or a higher standard for the outcome.» | as P03 | may | | `references/adaptive-adaptation.md` › Greater Depth · L150 | duplicate of P03 | ADAPT |
| SC-P05 | «List from the class lesson: every named character with numbers, every vocabulary word and its definition, the success criteria, the visual representation and the Expected worksheet practice.» | the adaptation's consistency sweep | check | | `agents/adaptation-designer.md` › One last sweep · L365 | rule (shared with vocabulary, VOC-P10); none of the seven check questions after it names the criteria (found in passing) | ADAPT |
| SC-P06 | «If the Expected task already provides authentic open depth and no different input, representation, support, criterion or task is useful, write `Resource decision: Use Expected unchanged` and explain why.» | Greater Depth | mechanics | `Resource decision:` | `agents/adaptation-designer.md` › 8. Decide whether a separate Greater Depth resource is · L251 | mechanics | ADAPT |
| SC-P07 | «When the Expected task already provides appropriate open depth and no different support, input, criterion or demand is needed, `Use Expected unchanged` is a valid deliberate decision.» | Greater Depth | may | `Use Expected unchanged` | `references/adaptive-adaptation.md` › Greater Depth · L137 | duplicate of P06 | ADAPT |
| SC-P08 | «One step at a time, the sequence chunked, a worked example beside the first attempt.» | a Below sheet where holding the steps is the barrier | may | | `agents/adaptation-designer.md` › 4. Design any separate Below resource · L183 | shared (adaptation): the Tier 1 dial decision 3's suggestion has to leave room for | ADAPT |

## Q. The design reviewer, and the designer's own checks

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-Q01 | «- success criteria are usable actions, decisions or recognition categories that match the taught performance, rather than a list of facts or a lesson outline. Read the object, not its id: a nutrient table is a representation, not the standard for a lunch plan.» «A tidy five-step list of short, stable cues is not evidence of quality; it is the commonest miss. The opposite miss is real too: a step of two sentences, or one that explains a word or suggests content, is carrying teaching, and a step a stuck child can already act on is left as it is. Review packet count cues invite judgement, not automatic rejection or a request to shorten. Trim explanation the teaching already gave and repeated alternatives; retain every word that makes a step runnable, and distinct actions. A condition the method always meets may stay in the steps as an `If...` sentence; use a lookup where it makes multiple cases easier to follow. Downstream must fit the complete needed method, not delete steps.» | every review | check | review routing card `Success Criteria` (SC-S11) | `agents/design-reviewer.md` › 3. Thinking, practice and evidence · L210 | rule; the reviewer's copy of C02, D01 to D06, D25 and K07, with one drop: a condition the method always meets "may stay" where D06 and D31 say it stays; its "a step of two sentences ... is carrying teaching" is decision 9 (the fresh-example sentence between these is E03, the `drawLive` sentence after them is L14) | REV (kept, pointing at PREF-SC and TV10) |
| SC-Q02 | «- vocabulary definitions are useful to children, and describe the same concept the teaching uses and the success criteria assess;» | every review | check | | `agents/design-reviewer.md` › 4. Language, load and teacher usability · L231 | shared with vocabulary (VOC-L02) | STAYS |
| SC-Q03 | «- scripts, slide content, answers, success criteria and instructions agree.» | every review | check | | `agents/design-reviewer.md` › 4. Language, load and teacher usability · L239 | rule | REV |
| SC-Q04 | «- success criteria against worked methods;» | the consistency sweep | check | | `agents/design-reviewer.md` › Cross-section consistency · L305 | rule | REV |
| SC-Q05 | «Read the resolved criteria, worked reference and word bank alongside that task's actual sources and required response, following `preferences.md` → Support, Checking and Release. A valid reference ID or suitability for an earlier task is not evidence of suitability here.» | every task using support | check | | `agents/design-reviewer.md` › 4. Language, load and teacher usability · L234 | shared (support; the reviewer's copy of N17) | STAYS |
| SC-Q06 | «Faults reaching children are ones author cannot see (numbers contradict wording, example drifts from SC, scenario falls apart, task completable without intended thinking). Keep honest as you write: check numbers answer question, example uses SC method, picture scenario once.» | the designer while writing | check | | `agents/lesson-designer.md` › Writing for the Reader · L106 | rule (the designer's version of Q04) | STAYS |
| SC-Q07 | «Read each definition beside the teaching that uses the term and the success criteria that assess it: all three describe the same concept. Defining `working conditions` as how long the days were and how safe the work was, then assessing the place and the time off as well, is a mismatch; widen the definition and the teaching, or narrow the criteria.» | the designer's completion pass | check | | `agents/lesson-designer.md` › One Completion Pass · L511 | shared with vocabulary (VOC-C22, C23) | STAYS |
| SC-Q08 | «Draw from SC, predictable misconception, sticky knowledge, taught surface feature.» | a `Look for:` line | default | `Look for:` | `agents/lesson-designer.md` › Speaker Notes Voice · L100 | shared (speaker notes): a look-for may come from the criteria | STAYS |
| SC-Q09 | «every script, explanation, definition, question, task instruction, success criterion, sticky fact, model answer and worksheet string it prints» | the reviewer's voice sweep | must | | `agents/design-reviewer.md` › First: authored wording · L130 | shared (the voice sweep; VOC-L06) | STAYS |

## R. The launch and its good instance (shared with the launch)

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-R01 | «**`steps` are stages of work, not the standard said again.** The teacher deleted a whole steps slide from the tooth deck on 18 September 2026 and the lesson lost nothing: `read what happened to Sam` came after two slides showing Sam, `use the four steps on the board, in order` pointed at the criteria panel on the next slide,» «A task whose work is one sustained go, launched with a model and with the criteria visible while children work, usually leaves `steps` empty; stages earn the field when they really happen in an order and the later ones are invisible until the earlier ones are done.» | a launch | must | `launch.steps` | `references/preferences.md` › Slide Philosophy › Lesson Designer visual-need boundary · L639. Copies: SC-R02, R03 | shared (the launch): a launch's steps must not restate the criteria; your ruling by hand edit (in the log) | STAYS (the launch) |
| SC-R02 | «A launch that shows a model, with the criteria visible while children work, has usually said all four of `read the case`, `use the criteria`, `write it as sentences` and `check each one leads to the next` already - on the case slide, in the criteria panel, in the two cards and in the `difference` line.» | a content-based launch | must | `launch.steps` | `references/teaching-sequence-content-based.md` › Output Format Block · L177 | duplicate of R01 | STAYS |
| SC-R03 | «A launch that shows a model, with the criteria visible while children work, has usually said all four of `read the case`, `use the criteria`, `write it as sentences` and `check each one leads to the next` already - on the case slide, in the criteria panel, in the two cards and in the `difference` line.» | a task-centred launch | must | `launch.steps` | `references/teaching-sequence-task-centred.md` › Output Format Block · L126 | duplicate of R02 (the same paragraph in a second route) | STAYS |
| SC-R04 | «`goodLooksLike` is `null` when the success criteria already show what a good one looks like.» | a launch | may | `launch.goodLooksLike` | `references/teaching-sequence-content-based.md` › Output Format Block · L171. Copy: SC-R05 | shared (the launch): criteria can stand in for the good-and-weak pair | STAYS |
| SC-R05 | «`goodLooksLike` is `null` when the success criteria already show what a good one looks like.» | as R04 | may | `launch.goodLooksLike` | `references/teaching-sequence-task-centred.md` › Output Format Block · L120 | duplicate of R04 | STAYS |
| SC-R06 | «Where the success criteria or the steps already own that sentence, use their words rather than coining a second way of saying it, so the class meets one wording on the example slide, on the steps and on the criteria panel while they write.» | a launch's difference line | must | `goodLooksLike.difference` | `references/preferences.md` › Slide Philosophy › Lesson Designer visual-need boundary · L647. Copies: SC-R07, R08 | shared (the launch); the same-wording rule reaching the launch | STAYS |
| SC-R07 | «**`difference` is one line a child can check their own work against.** The two cards already show the contrast, so this line names what the strong one *does* that the weak one only states, in the words the success criteria or the steps already use.» | a content-based launch | must | `goodLooksLike.difference` | `references/teaching-sequence-content-based.md` › Output Format Block · L179 | duplicate of R06 | STAYS |
| SC-R08 | «**`difference` is one line a child can check their own work against.** The two cards already show the contrast, so this line names what the strong one *does* that the weak one only states, in the words the success criteria or the steps already use.» | a task-centred launch | must | `goodLooksLike.difference` | `references/teaching-sequence-task-centred.md` › Output Format Block · L128 | duplicate of R07 | STAYS |
| SC-R09 | «**The good instance is a piece of work that would meet this lesson's own success criteria, taught words and all.**» «The validator refuses it now, matching every `{{taught word}}` in the beat's criteria against the model.» | a launch's good instance; the code skips a good instance with no written words (a diagram, a sketch, a sorted set), reads only the criteria on the launch's own unit and matches a loose stem | must (code) | `{{...}}`, `goodLooksLike.strong.words` | `references/preferences.md` › Slide Philosophy › Lesson Designer visual-need boundary · L649. Copies: SC-R11, R12, S07 | shared (the launch; vocabulary's G12 and G13 are the route copies) | STAYS |
| SC-R10 | «That launch modelled an explanation that never said `plaque`, while the criteria the same children were then marked against said `write what the germs in the {{plaque}} do with that sugar`: the class was shown a model that would have failed the standard.» | illustrates R09 | | | `references/preferences.md` › Slide Philosophy › Lesson Designer visual-need boundary · L649 | story (in the log, 18 September) | LOG |
| SC-R11 | «**The strong instance would meet this lesson's own success criteria.** Every `{{taught word}}` the beat's criteria name appears in it, and the validator refuses a model that leaves one out: a class shown a model that would fail the standard is being marked against something it was never shown.» | a content-based launch | must (code) | `{{...}}` | `references/teaching-sequence-content-based.md` › Output Format Block · L181 | duplicate of R09 (VOC-G12) | STAYS |
| SC-R12 | «**The strong instance would meet this lesson's own success criteria.** Every `{{taught word}}` the beat's criteria name appears in it, and the validator refuses a model that leaves one out: a class shown a model that would fail the standard is being marked against something it was never shown.» | a task-centred launch | must (code) | `{{...}}` | `references/teaching-sequence-task-centred.md` › Output Format Block · L130 | duplicate of R11 (VOC-G13) | STAYS |

## S. What the programs check and print

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-S01 | «SC_TYPES = {"steps", "reference-table", "labelled-reference"}» | every design | code | `successCriteria[].type` | `scripts/validate-lesson-design.py` · L133 | code: the three forms a design can record | CODE |
| SC-S02 | «content.steps must not be empty» «Brevity is reviewed in the deterministic review packet.» | a steps criterion | code | `content.steps` | `scripts/validate-lesson-design.py` · L3536 | code: a list must have at least one step; no word or step count is refused | CODE |
| SC-S03 | «The colour marks a success criterion may carry» «names no coloured part of a picture;» «a colour mark is left open or stray» | every criterion's words | code | `((...))`, `{{...}}`, `<<...>>`, `**...**`; `PICTURE_PART_WORDS` | `scripts/validate-lesson-design.py` · L544 | code: a picture mark must name a place-value column; an open mark is refused. `{{word}}` is never checked against the vocabulary list | CODE |
| SC-S04 | «must not be empty for a Skill-based concept» | a skill concept | code | `concepts[].successCriteriaRefs` | `scripts/validate-lesson-design.py` · L3612 | code (B03) | CODE |
| SC-S05 | «successCriteriaRefs must exactly match» | every My, Our and Your Turn of a concept | code | `conceptRef`, `successCriteriaRefs` | `scripts/validate-lesson-design.py` · L3679 | code (F11 to F16) | CODE |
| SC-S06 | «shared-frame worksheet.successCriteriaRefs must be []» | a shared-frame sheet | code | `worksheet.successCriteriaRefs` | `scripts/validate-lesson-design.py` · L3868 | code (N11) | CODE |
| SC-S07 | «criteria name as taught words the work must use.» | a launch's good instance | code | `goodLooksLike.strong.words` | `scripts/validate-lesson-design.py` · L2078 | code (R09); its refusal offers "or take the word out of the criteria", which under your decision 16 is the way out that undoes it (decision 1); its docstring carries the tooth-decay story and your "decide for themselves" evidence | CODE |
| SC-S08 | «What a beat puts on its slide by reference, lower-cased: the criteria» | the vocabulary landing check | code | | `scripts/validate-lesson-design.py` · L1493 | code; shared with vocabulary: a carded word used only in the next beat's criteria counts as on its board | CODE |
| SC-S09 | «"criteria-teaching",» | a skill preparation unit | code | prepare `mode` | `scripts/validate-lesson-design.py` · L1701 | code (H03) | CODE |
| SC-S10 | «not a second set of criteria» | a talk rehearsal's lines | code | `rehearsal.sayIt`, `partnerAsks` | `scripts/validate-lesson-design.py` · L1993 | code; shared (rehearsal) | CODE |
| SC-S11 | «Read when criteria are present, with teacher-voice.md → 10. Success» «criteria: check each step runs from its own words for a stuck child,» «any review cues, and whether drawLive true or false matches a» «reference worth retaining.» | the reviewer's routing card | code (must read) | heading `Success Criteria`; `# 10. Success criteria` | `scripts/design-review-packet.py` · L158 | code: when the reviewer opens the criteria section | CODE |
| SC-S12 | «steps: keep necessary actions; check the complete panel fits» «rows: check lookup load and readable placement» «teaching already gave, keeping every word that makes it runnable» «more than one sentence; is it two steps, or» «carrying explanation the teaching already gave?» «question-fragment condition; would an If...» «sentence save the child unpacking it?» «reread for a scannable lookup» | the review view's criteria list | code (cues, never a refusal) | more than 5 steps, more than 5 rows, more than 16 words, a second sentence, a question-fragment condition | `scripts/design-review-packet.py` · L1964 | code: prints the cues groups D and F describe, on steps and table cells only (a labelled reference gets none); the second-sentence cue fires on your own rewrite in D14 (decision 9), and the fragment cue on a decision list written as questions (decision 15) | CODE |
| SC-S13 | «Review cue (not a failure)» «(drawLive: » | the review view | code | | `scripts/design-review-packet.py` · L2149 | code: every criterion printed with its `drawLive` and cues | CODE |
| SC-S14 | «from this lesson's vocabulary; » «is it the subject's own word, or a name for something the» «14 September 2026: `Decide which two landmarks the number lies» | a step that uses a vocabulary term | code (a cue) | `vocabulary[].term` | `scripts/design-review-packet.py` · L1997 | code; shared with vocabulary (VOC-I06, which it pins); under decision 16 it will fire on every green taught word in a step; the comment carries the landmark story (E06) | CODE |
| SC-S15 | «`successCriteriaCount` is the number of success-criteria objects already chosen.» «The indexes are one-based positions in the generated `successCriteria` array. The scaffold generates `concept-###` IDs and binds each My Turn, Our Turn and Your Turn to the matching concept's success-criteria refs.» | the scaffold request | mechanics (code) | `successCriteriaCount`, `successCriteriaIndexes` | `references/lesson-design-scaffold.md` › Success criteria and Skill-based concepts · L113 | mechanics | STAYS |
| SC-S16 | «request["successCriteriaCount"] + 1,» | the scaffold | code | `sc-###` | `scripts/lesson-design-scaffold.py` · L1352 | code: writes one empty criterion per count, with `drawLive` to fill | CODE |
| SC-S17 | «The lesson designer marks a criteria `drawLive: true` when it is worth building» «and the working wall already reproduces a flagged reference.» «every draw-live criteria reaches at least one slide carrying its cue,» | the slide stage | code | `DRAWLIVE_HANDOFF_OK` | `scripts/check-drawlive-handoff.py` · L4 | code; its docstring repeats L01's "the wall reproduces" (decision 5) and the 8 September flipchart story | CODE |
| SC-S18 | «const MAX_SLIDE_SHARE = 0.5;» «the teacher never wants criteria over half a slide beside» | every panel on a slide | code | `SC_PANEL_TOO_LARGE` | `builder/src/success-criteria-panel.js` · L31 | code (K05, K08): your 15 September limit; its message names "fewer criteria on this slide" (decision 3) | CODE |
| SC-S19 | «SUCCESS_CRITERIA_CAPACITY is deliberately NOT blocking.» | the slide design check | code | `SUCCESS_CRITERIA_CAPACITY` | `builder/scripts/check-slide-design.js` · L15 | code: carries your 10 September ruling ("too much" is a judgement, not a number); makes K13 out of date | CODE |
| SC-S20 | «const SC_MANY_ITEMS = 5;» «const SC_LONG_TOTAL_CHARS = 320;» | the capacity warning | code | `SUCCESS_CRITERIA_CAPACITY` | `builder/src/content/capacity.js` · L19 | code: warns past five criteria or past 320 characters in total, never removes or shortens one; its message calls five what "the panel holds at a readable size" (decision 11) | CODE |
| SC-S21 | «"successCriteria": [],» «- success criteria: `sc-001`, `sc-002`, ...» «- success-criteria availability already expressed in `successCriteriaRefs`;» | the contract | mechanics (code) | `successCriteria`, `sc-###`, `successCriteriaRefs` | `references/output-template.md` › `lesson-design.json` · L47 | mechanics; the last quote keeps criteria out of `slideDesignNotes` | OT |
| SC-S22 | «They are counts of decisions already made, not targets to fill.» | the scaffold request's counts | mechanics | `successCriteriaCount` | `references/lesson-design-scaffold.md` › Counts · L85 | mechanics: no number of criteria is a target | STAYS |
| SC-S23 | «the label will appear twice. Leave the object's heading blank.» «gives two different Success Criteria Helpers in "helper" and legacy "figure"» «asks for unknown Success Criteria Helper» «keep ordinary question lists and success-criteria steps uncoloured» | the slide spec | code | `helper`, `figure`, `categoryColor` | `builder/src/validate.js` · L354 | code: refuses an unknown helper key, two different helpers on one step and `categoryColor` on `steps`; only warns about a doubled "Success Criteria" heading or an `sc-panel` inside a `*-sc` slot | CODE |
| SC-S24 | «fields = {"label", "text", "representationRef", "configuration"}» «configuration must be null without representationRef» | every criteria object | code | `successCriteria[]` keys; `validate_ref_list` | `scripts/validate-lesson-design.py` · L3561 | code: a criterion has exactly its four keys, a labelled item exactly its four, a picture it names must exist with one of its own configurations, and an unknown `successCriteriaRefs` entry is refused | CODE |

## U. Criteria a subject gives the class to judge with (shared with the subject files)

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| SC-U01 | «**The criteria the class is given carry three things, and a lesson missing the third is teaching impact.** How much changed. How many people it changed things for. And how long it lasted, or who decided afterwards that it mattered: the memorial, the name on the building, the reason it is in this curriculum and something else is not.» | a history significance lesson | must | | `references/subject-history.md` › What children do when it is really history · L64 | shared (history): the class's judging criteria for significance, which in such a lesson are also its success criteria | SUBJ |
| SC-U02 | «a Year 4 lesson on Lord Shaftesbury's significance built its criteria as *how many children, what changed for them, how do you know*, which is impact three times» | illustrates U01 | | | `references/subject-history.md` › What children do when it is really history · L62 | story (undated; in the log with the fountain, VOC-M08) | SUBJ |
| SC-U03 | «The limit: an objective can legitimately ask about impact alone (`what changed for children because of the Mines Act`), and then the lesson is about impact and does not need the third criterion.» | as U01 | may | | `references/subject-history.md` › What children do when it is really history · L66 | shared (history) | SUBJ |
| SC-U04 | «Teach the criteria somebody used, then apply them to a second case» | the history route table | default | | `references/subject-history.md` › Which move routes to which structure · L80 | shared (history) | SUBJ |
| SC-U05 | «Then the class meets those criteria on more than one case, so a child can see that the same three questions produce a different answer for a different person.» | a significance lesson | must | | `references/subject-history.md` › What children do when it is really history · L64 | shared (history): U01's second half; its three questions are criteria as questions, not steps (decision 6) | SUBJ |


---

## Out-of-date text (decision 11)

| Row | What it says | Why it is out of date |
|---|---|---|
| SC-K13 | «The Slide Designer's final `check-slide-design.js` gate treats them as blocking composition diagnostics» | Since 4.2.245 (19 September) the gate deliberately does not block on `SUCCESS_CRITERIA_CAPACITY`, on your 10 September ruling that "too much" is a judgement, not a number (SC-S19). A test pins the old sentence. |
| SC-O14 | «the card does not qualify for the success-criteria exception» | The exception belonged to the wall's old visual gate, which the card contracts say was replaced (SC-O16). |
| SC-O15 | «The one exception is a step-by-step success-criteria card.» | Same as O14. |
| SC-K05 | «Five short steps is a useful default» | Not wrong about the default panel's size, but it reads as a step target, which 4.2.183 removed ("there is no word target and no step target"). |
| SC-S20 | «const SC_MANY_ITEMS = 5;» | The build's capacity warning prints this five to the slide designer as what "the panel holds at a readable size": the same step-count reading as K05. |
| SC-O04 | «The 2-line cap exception above does NOT extend to SC steps» | Points at nothing: no two-line exception sits above it in the wall designer's file. The nearest candidate is the wall preferences' «Worked examples are the exception» (rule 3), which is in another file; what it once referred to is unverified. |
| SC-D40 | «an occasional case goes under the steps as a note» | Older than your 17 September rule that an occasional case is left out of the steps (SC-D27); decision 2. |

## Stories and dated rulings

Stories leave the runtime and reasons stay (the plan's standing rule). Your own
rulings keep your words without their dates.

| Row | Story or ruling | In the build log? |
|---|---|---|
| SC-D35 | A Year 4 science lesson wrote `Explain the job electricity powers` | **No.** Copy it there before it leaves. |
| SC-H08 | A Year 4 history lesson printed its panel on six slides | **No.** Copy it there before it leaves. |
| SC-D26 | `neighbouring multiples`, and a class stuck on 346 (17 September) | **Half.** 4.2.146 has `neighbouring multiples` with your words "doesn't help dumb kids"; 4.2.221 has the class that could not find the tens either side and the list that was too wordy. The number 346 is nowhere in the log (the only match, 5,346 in 4.2.165, is another story). Add the number if the story leaves; if the row keeps the example undated, nothing is lost. |
| SC-C03 | The nutrient table labelled "Success Criteria" (8 September) | Yes (4.2.109) |
| SC-D02 | Five real lists rewritten, every one longer and plainer (September) | Yes (4.2.183, 13 September, with your Notion page) |
| SC-E06 | `landmarks` for the ends of a number line | Yes (4.2.209, with your words "I dont understand it at all, so how will children") |
| SC-H06 | The six-step panel on thirteen of sixteen slides | Yes (4.2.146) |
| SC-K10 | A criteria table in a sidebar blanked two PSHE task slides (21 September) | Yes (the 21 September PSHE rebuild) |
| SC-L02 | Your hand-written "how to exchange" list on the flipchart (8 September) | Yes (4.2.109, 4.2.110): the log says the exchange steps you wrote up by hand; the words "how to exchange" are only in the runtime |
| SC-N03 | A rounding sheet printed its criteria as seven grey lines | Yes (4.2.158) |
| SC-N22 | A PSHE sheet's three steps in a 30% left column (1 September) | Yes (1 September, Year 4 PSHE balanced diet) |
| SC-R01 | You deleted the tooth deck's steps slide (18 September) | Yes (4.2.235) |
| SC-R10 | The launch model that never said `plaque` (18 September) | Yes (4.2.235) |
| SC-U02 | Shaftesbury's significance criteria were impact three times | Yes (4.2.139, with the fountain, VOC-M08) |
| SC-D21 | Your ruling: the rounding list was too wordy for what the class did (17 September) | Yes (4.2.221); keep your words |
| SC-H29 | Your ruling: the Our Turn slide holds the label, the question, the criteria and the number line (12 September) | Yes (4.2.145); keep your words |
| SC-D01 | Your principle: "Use as few words as possible without making the child work out what you mean." (13 September) | Yes (4.2.183); the runtime carries it as the rule |
| SC-K05, S18 | Your ruling: "I never want success criteria to take more than 50% though", and the criteria slide "is allowed to be full slide of course" (15 September) | Only in the log (4.2.211); the runtime carries the rule, not your words |
| SC-J01 | Your ruling: criteria "should be able to use colour to make things stand out so its not all just black" (15 September) | Only in the log (4.2.212) |
| SC-N12 | Your ruling (19 September): "I've had worksheets before that had the success criteria and I did chop it off. So I do think it's a kind of waste ... on a slip, I really don't think it's needed at all." | Only in the log (4.2.247), which reads it as the slip only and records that you kept the panel on the sheets; the runtime carries the slip half. Both halves go to you in decision 8. |
| SC-S19 | Your ruling: "too much" is a judgement, not a number (10 September) | In the log and a code comment |
| SC-J03 | Your vocabulary decision 16 (22 September): every taught word green in criteria | In the vocabulary ledger; the log names it as not yet done (4.2.284) |

## Names the code depends on

These are read by programs or tests and do not change without the code.

**In the lesson design.** `successCriteria`, each exactly `id` (`sc-###`),
`type` (`steps`, `reference-table` or `labelled-reference`), `drawLive` (true or
false) and `content` (`steps`; `columns` and `rows`; or `items` with exactly
`label`, `text`, `representationRef`, `configuration`); `successCriteriaRefs`
on every source unit, on every concept and on the worksheet; `concepts[]` and
`conceptRef`; the skill preparation mode `criteria-teaching`;
`launch.goodLooksLike.strong.words`; the worksheet's `resourceMode:
"shared-frame"`; the scaffold's `successCriteriaCount` and
`successCriteriaIndexes`. The colour marks `((...))`, `{{...}}`, `<<...>>` and
`**...**`, and the list of picture-part words the validator and
`shared/text/criteria-marks.js` share.

**On the slides.** Templates `maths-turn-sc`, `maths-turn-ref-sc`,
`maths-your-turn-sc`, `writing-turn-ref-sc` and `success-criteria`; the content
objects `sc-panel` (`label`, `content` or `criteria`) and `steps` (`heading`, a
step as `{ "text", "helper" }`, the legacy `figure`, and a leading `✨` for a
folded sticky line); the slots `criteria`, `criteriaLabel` and `label` (both
default to «✓ Success Criteria», `success-criteria-panel.js`), `flipchart` and
`criteriaRef`; the Success Criteria Helper keys and their
`SUCCESS_CRITERIA_AUDIT` entries in `shared/visual-parity.js`; the build signals
`SC_PANEL_TOO_LARGE`, `STEP_TEXT_OVERLOAD` and `SUCCESS_CRITERIA_CAPACITY`;
`check-drawlive-handoff.py` and `DRAWLIVE_HANDOFF_OK`; and `criteria.steps` in
the slide spec, which the wall's packet reads.

**On the worksheet and the wall.** The worksheet `steps` helper and its `title`
(printed as "Success criteria" when left out, `worksheet-html/src/helpers/frames.js`);
the slip that drops the panel (`recording`, `onSlip`); the wall's
`workedExample` and `diagramSection` cards (`cards[].parts[].steps`) and
`working-wall-view.md`, which prints every criterion with its `flipchart` flag.

**Headings named by the reviewer's routing card, the packets or tests.**
preferences `## Success Criteria`; teacher-voice `# 10. Success criteria`; the
skill route's `## Writing the Success Criteria` (the designer is told to read
that section by name, and tests pin the name); slide-success-criteria's
`## One success-criteria object keeps one visual identity` (a builder test); the
file name `slide-success-criteria.md`; working-wall-preferences'
`## Step labels in worked examples` and `## How much text one body item holds`
(the wall packet cuts both by exact title); the card contracts'
`### workedExample` and `### diagramSection` (a wall test); and the worksheet
catalogue's `steps` entry and index line (a worksheet test; the
catalogue is generated from the worksheet engine's test examples).

**What the code enforces today.** A criterion has exactly its four keys and is
one of the three types; each list, table or item set is not empty, a table's
rows match its columns, a labelled item has exactly its four keys, a picture it
names exists with one of its own configurations, and `drawLive` is set; an
unknown `successCriteriaRefs` entry is refused; a picture mark names a
place-value column and no mark is left open; a skill concept names criteria and
every My, Our and Your Turn of it carries exactly the concept's criteria and
`conceptRef`; a shared-frame sheet carries none; a launch's good instance uses
every `{{taught word}}` its beat's criteria name (see the limits below); every
draw-live criterion reaches a slide carrying its cue, and no slide claims a cue
the design did not mark; a panel may not take more than half a slide except on
a `success-criteria` slide; step text keeps an 18pt floor; a panel of fewer than
four steps keeps four-step card height; the slide build refuses an unknown
Success Criteria Helper, two different helpers on one step and `categoryColor`
on `steps`; a worksheet instruction with three or more line breaks is refused
(criteria go in the `steps` panel); a slip drops the panel; a wall item past two
lines is refused; and the worksheet and wall draw the marks in the same colours
as the board.

**Stated more narrowly than the text might suggest.** The launch check skips a
good instance with no written words (a diagram, a sketch, a sorted set), reads
only the criteria on the launch's own unit, matches a taught word as a loose
stem, and its message offers "or take the word out of the criteria". The
worksheet's three-line refusal counts line breaks, not printed lines, so a list
run together on one line passes. `SUCCESS_CRITERIA_CAPACITY` warns past five
criteria or past 320 characters and never blocks. The slide build only warns
about a doubled "Success Criteria" heading or an `sc-panel` inside a `*-sc`
slot.

**What it does not enforce, although the text might suggest it.** Nothing checks
a step's wording: length, sentence count, owned words and the fresh-example test
are the designer's and reviewer's judgement, and the review page only prints
cues (more than five steps or rows, more than 16 words in a step or a table
cell, a second sentence, a question-fragment condition, a vocabulary term inside
a step); a labelled reference gets no cue at all. `{{word}}` is never checked
against the vocabulary list. Nothing requires any criteria except on a skill
concept, checks that criteria are on the practice slides, or keeps them off
answer slides. The draw-live hand-off check confirms that a marked criterion's
own steps, in order, sit in the slide's panel; nothing else compares the wording
on a slide, a sheet or the wall with the design's.

**What the review page prints.** Since 4.2.286 the class view prints each
beat's criteria beside it, and the worksheet's criteria with the sheet; the
criteria list prints every criterion with its `drawLive` and its cues; the
concept list prints each concept's criteria. Under decision 16 the vocabulary
cue will fire on every green taught word in a step, as a question.

## Rows whose wording a test already pins

Found by matching every string of 20 characters or more in `scripts/tests`
against the quotes, every pinned passage in the four ledger pin files, and the
builder, worksheet and wall tests that read the instruction files; a shorter
pinned phrase would not be caught, so a fold still runs every suite. A row here
cannot lose that phrase without a test failing, so a fold that moves it moves
the test in the same release. Matches on a bare file or field name alone, and
strings a node test only uses as sample data, are left out.

- **By a Python test's own phrase (66 rows):** B03, B07; D01, D04, D11, D14,
  D15, D17, D19, D24, D25, D26, D27, D34, D35, D36, D37, D40, D45; E02, E03,
  E05, E06, E09, E10, E11; F02, F03; G01, G02; H01, H05, H07, H22, H26, H32,
  H38, H42, H46, H49; I07, I12, I13; K07, K13, K17, K19, K20; N05, N06, N07;
  O04; Q01, Q02, Q07, Q09; R01, R07, R08, R09, R11, R12; S03, S12; U01, U03.
- **By a builder, worksheet or wall test that reads the instruction files (14
  rows):** J10 (the playbook's "Ordinary question lists and success-criteria
  steps stay out of that palette"); J11 and J12 ("the instructions children act
  on", "Black carries everything else the board says"); K02 (its section
  heading); K03 ("one compact white card per criterion", so K03 cannot become a
  bare pointer without moving that test); K43 ("the route to the panel does not
  change the criteria's visual identity"); N14 and N15 (the catalogue's `steps`
  entry and index line); N20 (its title, which a worksheet test pins, and the
  catalogue is regenerated from the engine's examples); O20 and O21 (the
  "62 characters" and "106 characters" budgets); O23 and O24 (the
  `### diagramSection` and `### workedExample` headings); S23 (the builder's
  `categoryColor` message). The wall's `diagramSection` example steps (O23) are
  also used as test data in a wall test.
- **By another topic's ledger pins (58 rows),** so the fold must also update
  that topic's pin file: vocabulary pins A02, A10, E02, E03, E05, E07, E09,
  H32, I02, J02, J03, J04, J09, J13, K15, M01 to M03, O01, O03, O05, P02, P05,
  Q02, Q07, Q09, R11, R12, S14; assumed knowledge pins D09, D13, E01 to E04,
  E09, E11 to E14, F01, F21, H27, H32, J13, M01 to M04, N01, N09, N17 to N19,
  Q02, Q03, Q05, Q07; the rhythm pins A02, B03, B08, C10, D32, E03, E13, H27,
  H42, L14, M04, Q01, Q07, U04; quick checks pin E03, G04, K41, L14, M01 to
  M03, Q01.

The reviewer's whole criteria paragraph (Q01, E03 and L14 are its three parts)
is pinned whole by both the quick-check and the rhythm pins, and the
designer's three continuity sentences (M01 to M03) by three topics at once.

Rows with no pin today include most of group C (the form), group J's own copies
outside vocabulary's rows, group K's placement rules (as opposed to its identity
and fit rules, above), all of group L except L14, and every rule that lives in
only one place: C05, C13, D20, D23, D28, F05 to F10, G03 and H16.

## Mentions judged to belong to another topic

Looked at and left out of the rows, because success criteria are not what they
govern.

- **A sort's property labels, called "criteria"** (Venn and Carroll labels):
  templates L85, L86, L1626, L1665, L1679, L1700, L1702, L1708;
  working-wall-card-contracts L611; stick-in-sheets-pedagogy L85; skill route
  L33; slide-representations L47.
- **A wall card's "wall-worthy criteria"** (whether a card earns its place),
  apart from the worked-example test now in SC-O24: working-wall-designer L62,
  L200, L215, L294 to L299, L419; working-wall-card-contracts L3, L9, L51, L62,
  L73, L88, L131, L223, L285, L314, L347, L381, L393, L438, L450, L463, L488;
  working-wall-preferences L173.
- **Comparison and Do-beat criteria** (what two cases are compared on, how
  hard a beat's thinking is): subject-geography L21, L68, L82, L103; do-beats
  L7, L12, L13, L267, L320, L329, L566; reasoning-prompts L26;
  explanation-tasks L30.
- **"I can" and WALT on the objective**, not the criteria: preferences L138;
  lesson-designer L180.
- **A launch's own `steps`** (stages of work), beyond the rows in group R:
  content-based L53, L55, L163; task-centred L33, L108; slide-designer L149;
  design-reviewer L205; lesson-designer L243.
- **A method reminder inside an instruction**: teacher-voice L429 to L433
  (`Remember to partition each number before multiplying.`).
- **Acceptance criteria as a prompt's support**: lesson-designer L365.
- **A recording label named `Criterion`**: preferences L69.
- **Slide inline markers in general**: templates L646, L804, L1189, L1786 (L697
  is now SC-J15).
- **Steps in a Teach layout**, not criteria: templates L277, L286.
- **The Below dial's reading-side wording**: adaptive-adaptation L40 (the
  adaptation designer's own line is now SC-P08).
- **Telling the class what is being judged**: subject-history L125 (AK-G30).
- **Adaptation reading lists naming Tier 3 criteria**: adaptation-designer L46,
  L47.
- **A worked method frame's green panel**: templates L2639 (`method-frame`, for
  the slide topic; see decision list, later topics).

## Found in passing

- **No program checks that a green word was taught.** `{{word}}` in a
  criterion is never matched against the lesson's vocabulary, so a label the
  lesson coined for something visible (`landmarks`) can be marked green, and the
  colour then tells children it is a word they own, which is the very thing §10
  says it is not. The review page only asks, as a cue, about a vocabulary term
  inside a step.
- **The same marks mean different things on a slide and in the criteria** (for
  the slide topic). In the slide catalogue's inline markers `{{...}}` is answer
  green and `<<...>>` is a value the question supplies; inside criteria `{{...}}`
  is a taught word and `<<...>>` is the part to look at or decide. The slide
  catalogue also bans the green marker on teaching slides (SC-J15), which are
  where the criteria sit, and the slide playbook says green is reserved for
  revealed answers and vocabulary headwords (SC-J09), where your preferences and
  the visual profile add every taught word and the criteria panel (J04, J08).
- **The discovery route says nothing about success criteria**; the other four
  routes each do.
- **Nothing says whether a Below sheet carries the class criteria**, and the
  adaptation's last sweep lists the criteria (SC-P05) but none of its seven
  questions asks about them (for the adaptation topic).
- **The draw-live cue has two names**: the modelling file calls it a "pencil
  cue" (SC-L09); the builder draws a flipchart.
- **The calibrated example in the voice guide** (SC-D29) says
  `Use powerful verbs to describe movement.` where §10's own list says
  `Choose powerful verbs.`, and its three reasons (imperative, specific,
  economical) predate "clear first". It is your example and stays exactly; noted
  for the voice topic.
- **The standalone criteria slide accepts `vocab` and `bullets`** as its
  content (SC-C19), forms the core rule does not name.
- **The build log's 4.2.109 entry** says the validator refuses a sixth step and
  a table cell past eight words; it no longer does (4.2.183 and 4.2.245 took the
  caps out), and the same entry says the wall reproduces a draw-live criteria
  (decision 5). History, not runtime, but a reader of the log could be misled.
- **The wall build's overflow message offers the thing the wall designer is
  told never to do.** When a card's items overrun, `working-wall-html` suggests
  "Splitting the items in order over a second card keeps every word ...;
  otherwise remove an item or shorten the longest". For a worked-example card
  carrying the criteria, SC-O04 says omit the card but never reword or drop a
  step. Splitting the steps in order over two cards keeps every step and the
  repair check accepts it (SC-O22); removing or shortening one does not
  (decisions 3 and 12).
- **The wall's two budgets for a step differ**: the budget table says a
  worked-example step is «≤ 60 characters» (SC-O19); the wall designer and the
  budget section say about 62 with a picture and about 106 without (O20, O21).
- **An English worked-example card relabels the criteria's steps** "What",
  "Why", "How" instead of numbering them (SC-O26), so the wall's labels differ
  from the board's numbered badges (for the wall topic).
- **"Kept visible throughout"** (SC-A07, task-centred lessons) read literally
  pulls against taking the panel off the answer slide (H05) and off every part
  of a split (H07).
- **Checked and not taken from the independent check:** its claim that a
  labelled set has no wall card to go on (the wall designer's classification
  poster carries one, SC-L11); its claim that the quick-check rail's criteria
  line meets H05 was already the ledger's own note, now withdrawn (SC-K33); its
  "fourth place" in the brief-gap file is the fuller sentence of a fragment row
  I10 already quoted (now SC-I20). Whether `method-frame` lines count as
  criteria (SC-N21) is unverified.
- **The working tree moved while this list was built**: the assumed-knowledge
  work rewrote `design-review-packet.py`, `preferences.md` and
  `lesson-designer.md` at 17:39 on 23 September. Every quote was re-checked
  afterwards and all are found word for word.

## After the subject-files release (topic 8, release 1, 25 September 2026)

- **SC-C15** (the writing guide) and **SC-C16** (the skill) are retired in `success_criteria_ledger_pins.json`: his decisions 1 and 3 on the subject-files list (24 September): the make-subject-file skill and its writing guide are removed completely ("just remove it completely"). Each pin now holds its file staying gone.
- **SC-G02** is retired: his decision 6 on that list ("those balanced diet things sound like things I wouldnt want in the pshe subject files", then "maybe the subject file could say to look for guidance from eatwell guide thing") took the per-meal quota rule out of the PSHE file, whose food section is now one line pointing to the NHS Eatwell Guide. The general rule, a count in a criterion is never invented (SC-G01), stays where every lesson reads it.

## After the design reviewer release (topic 8, release 2, 26 September 2026)

- **SC-Q01** (the reviewer's section 3 list, pinned whole) moved with the design reviewer release (topic 8, release 2), on the design reviewer's list (`2026-09-23-design-reviewer-ledger.md`), whose mapping is `2026-09-26-design-reviewer-mapping.md`: the same two sentences as the quick-checks list's QC-C08 (the restating Do goes back to the lesson designer, his decision 2 there (24 September 2026, "1. y"): small wording fixes are the reviewer's, and a picture swap or a rewritten Do beat goes to the lesson designer with the reviewer naming the fix; "now" left the `unlocks` line). No success-criteria wording changed.

## After the routes release (topic 8, release 3; 26 September 2026)

The routes release moved these pins in place, each with its decision:
SC-H03 ("the existing route" goes, routes 7g); SC-H22 and SC-Q01 (his preferences decision
13b, in the designer's walk-through line and the reviewer's launch line, which also takes
routes decision 2's words); SC-R04 and R05 (the two `goodLooksLike` lines say the criteria
must show an actual good one, never a list of what a good one includes); SC-H29 (the Our
Turn ruling keeps his words without its date); SC-H47 (the task route's launch trigger
asks whether the class has seen a good one in this lesson, routes decision 2). No row was
added or dropped.

## After the voice guide release (topic 8, release 5, 26 September 2026)

- **SC-D42** moved with the voice guide release (topic 8, release 5), on the voice guide's list (`2026-09-23-teacher-voice-ledger.md`), whose mapping is `2026-09-26-teacher-voice-mapping.md`: the lesson designer's read line no longer lists the guide's sections one by one, so its "§10 success criteria" is now the guide's own route, "success criteria §10" (its settled item 1: the guide's route names all four most-missed kinds, each with its reason, and the lesson designer reads the guide by that route instead of keeping a shorter copy of it). The designer's pointer to the preference sections (the row's second quote) is unchanged.
