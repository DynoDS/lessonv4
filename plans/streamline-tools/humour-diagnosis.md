# Humour on the board: why a light line never reaches a slide (diagnosis, 24 September 2026)

His words: "Humour wherever, but I still never see it on slides!" and "humour is
allowed in pshe". The read-back he agreed: find why a light line never reaches the
board and repair the cause, not add a rule. This is the diagnosis only. Nothing in
the plugin was changed. Scratch work is in `streamline-tools/scratch/humour/`.

Short names as in the topic 8 plan: LD `agents/lesson-designer.md`, REV
`agents/design-reviewer.md`, SD `agents/slide-designer.md`, TV
`references/teacher-voice.md`, PREF `references/preferences.md`, CONTENT
`references/teaching-sequence-content-based.md`, SKILL
`references/teaching-sequence-skill-based.md`, LOG `references/build-review-log.md`.
Line numbers are from the working tree of 24 September.

---

## In short

- **The pipeline can carry a light line to the slide, and has.** The tooth-decay
  deck (18 September) has `Whatever you've had, they get some too.` on slide 4's
  face. It was written into a board field by the lesson designer and every later
  step kept it. The slide designer may not trim or reword a child-facing string,
  and no program checks, counts or removes humour. So the repair needs no new
  field (the topic 8 plan's risk 12 is answered: the mechanism exists).
- **Lines are lost at the moment they are written, in two ways.** Since the
  closing humour record began (12 September), designers found a light line 14
  times and put 13 of them in the script, calling them "spoken" lines. And in the
  14 lessons actually built for him since then, 10 recorded no line at all:
  six maths, one PSHE, three history about children in hardship.
- **On the six decks at the project root, the ones he has read most recently,
  no light line is on any slide face.** One sits in the leisure deck's notes; the
  digestive lesson's one line was in the script and was lost in the 22 September
  hand rebuild.
- **Ranked causes** (section 4): (1) every rule the designer meets while writing
  a string sends a conversational line to the notes, and the one rule that says
  "no fixed home" is read once, at the end; (2) the look for a light line happens
  at the completion pass, when every board is written, checked and full, and the
  script is the only free place; (3) in maths, PSHE and hard history the guide's
  framing turns into "none" nearly every time; (4) the board's contract has no
  named place for a light line, and the four-piece budget sorts it with the
  asides that go to the script; (5) the review never asks whether a script line
  would do more on the board.

---

## What was read

- The humour parts of TV (§2, §4, §16B, §16G, §17), PREF's Written Voice, Slide
  Philosophy's notes hand-off and Pride Lessons (both Teach-slide calibrations),
  the voice ledger's answers of 24 September and group D, the topic 8 plan's
  sections 6 and 7, LOG's 4.2.83, 4.2.150, 4.2.151, 4.2.152, 4.2.278 and 4.2.279.
- LD (notes voice L84 to L94, "One Completion Pass, Then Done" L503 to L527, the
  reading route L529 to L566), REV (L42, L44, L57, "First: authored wording" L128
  to L143, the report shape), SD (L165 to L180),
  CONTENT (the Teach output block and `explanation`, L63 to L128), SKILL (the turn
  fields), `templates.md` (speech bubbles), `output-template.md`.
- `scripts/validate-lesson-design.py` (the Teach says-once check and every
  `explanation` check), and a search of every script, the packet and the builder
  for anything about humour (there is nothing).
- **Every saved design in the repository**, `node_modules` excluded: 168
  `lesson-design.json` files, which reduce to 80 distinct designs once the copies
  in `streamline-tools/scratch`, test fixtures and `tmp/` are dropped by content
  (48 of them with a `lesson.json`). Their `design-decisions.md` closing records,
  65 saved review reports, and the six built decks and walk-throughs at the
  project root, read for what is on each slide face and what is only in the notes.
- Not read: his Codex decks on the drive since 12 September, and the week 3
  science lesson he taught on 23 September (on the drive; it is very likely the
  digestive lesson, whose deck at the project root was read). The leisure
  lesson's design is not saved; its walk-through and deck were read.

---

## 1. Where a light line could live

A light line reaches the slide face only if it is written into a field the slide
designer draws. Those fields are all free text, and the slide designer must copy
them exactly (SD L172: "you may not trim it, reorder its words or emit a
near-copy").

| Beat | Fields a child reads on the board | What each field is described as | A light line named? |
|---|---|---|---|
| Teach | `headline`, `explanation`, `keyQuestions`, `teachingText`, the star line from `stickyKnowledgeRefs` or `takeaway` | `headline`: "the one sentence this slide lands"; `explanation`: "the because or so, the example the class looks at ..., and what it does not mean" (CONTENT L89, L114) | No |
| My Turn, Our Turn (maths, much English) | `example` (the question), `modelledExemplar`, the criteria panel, the tool | the Pride Lessons slide: "the question, the tool, the SC. The teacher's voice filled the rest" (PREF L772); guiding questions go in the script by rule (SKILL L75, L270) | No |
| Do, Practise, launch | `pupilInstruction`, `task`, `prompt`, `question`, `taskStructure` labels, `launch` fields | the task as the child reads it | No, though his own `Not literally!` sits in a task line (TV §16G) |
| Starter, ending | `activity`, `pupilInstruction` | the task | No |
| Any | speech bubbles, built from source content | `templates.md` L468 names "Bailey adding a playful prompt" as a use | Only there |
| Any | vocabulary definitions, sticky facts, success criteria | defined jobs a light line would spoil | Not suitable |

Only the teacher sees: `speakerNotes.script` on every beat and every vocabulary
introduction, `teacherInfo`, `lookFor`, `onTheBoard`. Never printed: `thinking`,
`unlocks`, the closing decisions.

So the only places the contract offers a light line are the free-text teaching
fields, where the field descriptions name other jobs, and the script, which has
no budget, no validator check and no board counterpart rule.

---

## 2. What the agents are told, and which wins

### The lesson designer

Read **while each string is written** (these run many times a lesson):

- LD L90, every time a script is written: "the script carries the fuller
  conversational register; the slide keeps the tighter version, never the reverse".
- TV §2 L64 to L103: slides "carry only the explanation pupils need to see";
  speaker notes carry "fuller conversational framing; more natural teacher-talk;
  rhetorical questions; ... pauses, emphasis and informal linking". A light line
  matches the notes list and nothing on the slide list.
- TV L119: "Short/direct can become the slide. Fuller/conversational can expand it
  in the notes. Do not normally reverse this relationship."
- PREF L57 (Written Voice, read before any child-facing wording): the slide is the
  tighter version, "not the other way round"; "conversational framing around it
  usually is not" slide language.
- TV §17 question 3, run over every string at the read-back (LD L519): "Does the
  sentence belong on the slide, or would I actually say it aloud?" A light line is
  the most sayable sentence in a lesson.
- PREF read-back question 5, same pass: "Does this wording help children
  understand or act, or is it merely narrating the lesson back to them?"

Read **once, at the start**:

- PREF Pride Lessons L772 to L792: the practice slide is "the question, the tool,
  the SC. The teacher's voice filled the rest"; a Teach slide holds "about four
  pieces of text", and of the two repairs, "a caveat the teacher can give in a
  breath, goes to the script"; then 4.2.152's sentence, "a light line competes
  here like anything else: if it belongs on the board, it is one of the four".
  Nothing says when it belongs on the board.

Read **once, at the end**:

- TV L20 and LD L555: "Read §4 once when considering the whole lesson at
  completion, not for each string."
- LD L519 to L521, the completion pass: "The line may go on the slide, in the
  script, or both; there is no fixed home for it", and the answer is written down
  in the closing decisions. Its own example of a found line is a board one (`one
  light line on the slide about the chip`).
- TV §4 L223 ("no fixed home"), L229 ("on a slide holding four things it is the
  one a child reads twice"), L235 ("None is the right answer then"), L243
  ("Procedural content often works best without humour: calculation steps;
  routine methods").

Read **only when wording is uncertain** (TV L20): §16B (`The clue is in the name!`)
and §16G (`Now break it.` / `Not literally!`), the only two calibrated light lines
that sit on a slide.

### The design reviewer

- REV L42: "a slide is the question, the tool and the criteria, and the user's
  voice does the rest".
- REV L139, its one playful judgement: made once against the material; "add the
  small line only where the content genuinely invites it, on the slide or in the
  script as the moment suits"; a lesson with nothing "is not a finding".
- Its voice sweep runs TV §17 over every string (REV L130), so question 3 again.
- Its amount pass trims Teach boards against the four pieces. The Victorian
  review (18 September) removed two board lines that were not teaching, each "a
  fifth text piece", because "the script says it aloud". A light line added as a
  fifth piece meets the same reasoning.
- Nothing asks whether a line in the script would do more on the board.

### The slide designer and the programs

- SD has no humour instruction and needs none: it copies authored child-facing
  wording exactly (SD L172) and splits a beat over two slides rather than drop or
  shrink words (CONTENT L122, PREF L816).
- The validator's only check that could touch an extra board sentence is the Teach
  says-once check, which needs 80 per cent of the shorter line's content words in
  the other; a light line never has that. There is no length or sentence limit on
  `explanation`. No script, packet or builder mentions humour.

### Which wins

The rules read while writing win, because the strings exist before §4 is opened.
When §4's "no fixed home" arrives at the completion pass, every board is already
written in the tighter register, checked, and at or over four pieces; putting a
line on it means displacing a route part (which Pride Lessons protects as
teaching) or splitting the slide, while a sentence added to the script costs
nothing. The reviewer inherits the same frame and accepts a script line.

---

## 3. What actually happened

### Every light line in the saved designs

| # | Lesson (date, kind of run) | The line | Where it sits | Put there by |
|---|---|---|---|---|
| 1 | Series circuit (5 Sep, completion run) | `Now break it. Not literally!` | **Board** (`task`) | designer, reusing his §16G line |
| 2 | Series circuit (lesson-output run) | `Now break the circuit - not literally!` | **Board** (`task`) | reviewer, reusing his §16G line |
| 3 | Parachutes (5 Sep, trial) | `We're not finding out who can launch one at the ceiling.` | script (slide 5 notes) | designer |
| 4 | Balanced diet | `One apple isn't a magic 'balanced diet' button.` | script (starter) | reviewer |
| 5 | Tudor toy plates (9 Sep) | `There wouldn't be much room for your lunch!` | script (slide 3 notes) | designer |
| 5a | Tudor toy jug (9 Sep) | `It's only 49 millimetres tall, smaller than your finger.` (the reviewer called it "a light toy-jug aside") | script | designer |
| 6 | Layers of teeth (13 Sep, proof run) | `It covers the crown like a tough coat, but it isn't the whole tooth` | script | designer |
| 7 | RE symbols (13 Sep, proof run) | `A stop sign is very bossy for a piece of red metal` | script ("the teacher can say") | designer |
| 8 | Round to the nearest 100 (16 Sep) | `Zero gets a turn too.` | script (slide 4 notes) | designer |
| 9 | Kilometres and metres (17 Sep, trial) | `leave it out and I've suddenly walked 270 metres further` | script | designer |
| 10 | Round to 10, secure (17 Sep, trial) | `35 can't make its mind up, so mathematicians made it up for it.` | script | designer |
| 11 | Round to 10 (17 Sep, trial) | `That's like standing on the top stair and saying you're nearer the bottom.` | script, on purpose: off Grace's slide "so it can't hand the class her answer" | designer |
| 12 | Tooth decay (18 Sep) | `Whatever you've had, they get some too.` | **Board** (`explanation`, slide 4 face) and script | designer |
| 13 | Vikings, baseline (19 Sep, evaluation) | Grimsby: `you have been to a Viking village, and nobody told you` | script (the card with the names is a sort item) | designer |
| 14 | Vikings, candidate (19 Sep, evaluation) | the king's hall, `every one of them armed` | script | designer |
| 15 | Sound, baseline (19 Sep, evaluation) | `the loudest drummer in the whole solar system` | script, "after the answers" | designer |
| 16 | Sound, candidate (19 Sep, evaluation) | astronauts `still have to call each other up` | script | designer |
| 17 | Multiplying, baseline (19 Sep, evaluation) | `Thirty-four lots of four, and the answer's over a thousand?` | script | designer |
| 18 | Digestive system (22 Sep) | `'Small' is doing a rather misleading job in that name!` | script; lost in the hand rebuild (below) | designer |
| 19 | Children's leisure (22 Sep) | `The horses still haven't taken anyone very far!` | script (slide 11 notes) | designer |

No line sat in a planning field. No pipeline step moved or removed a line: each
script line is in `lesson-design.json`'s script and in `lesson.json`'s notes,
unchanged, wherever both exist. The one line lost after design (row 18) was lost
in a hand rebuild, not by the pipeline.

### The counts

- **Since the closing record began (12 September): 27 records.** 14 found a line
  (rows 6 to 19): 13 in the script, 1 on the board. 13 recorded none, which is 11
  distinct lessons (two were second runs): seven maths, one PSHE, three history
  about children in hardship.
- **The lessons actually built for him in that time: 14.** No line in 10 (six
  maths, one PSHE, three hardship history), a script line in 3 (round to 100,
  digestive, leisure), a board line in 1 (tooth decay, and a mild one). The
  evaluation, trial and proof runs found lines far more often (10 of 12 records),
  partly because their material (Vikings, sound, rounding and conversion trials)
  offered more, and every one of those lines still went to the script.
- **Board placements in the whole corpus: 3,** and two are his own `Not
  literally!` copied into a circuit lesson whose material matched his.
- **Across every string in all 80 designs,** 10 sentences end in an exclamation
  mark (the form most of his calibrated lines take): 2 on a board (both `Not
  literally!`), 7 in scripts, 1 on a worksheet.
- **Reviews:** 65 saved review reports (some are earlier passes of one review).
  Four mention humour, all before 12 September: two added a line (row 2 to a
  board, row 4 to a script) and two noted a script line approvingly (rows 5 and
  5a). None removed a light line. No review since 12 September mentions humour.

### What the designers said about placement

Their own closing records describe the line as speech: "one light spoken line
about the name", "one brief spoken line", "One spoken line on slide 3", "said in
the first My Turn script", "in the first spoken model", "the line in the script",
"the script takes it lightly", "Taken, in the script, after the answers". Only one
gives a reason for the script (row 11, protecting the answer, which is a sound
reason). None mentions room on the board. None of the 13 considered the board and
declined it; the board was not in view.

### Three traces

- **Tooth decay (row 12), the one that reached the board.** The designer wrote it
  into the first Teach beat's `explanation` and said so ("it is on the board, not
  in the notes"). `lesson.json` slide 4 carries it as its second line; the built
  deck has it on the slide 4 face. Nothing downstream touched it. It is also a
  mild line (a small reaction, no strong turn), which may be why it did not
  register with him.
- **Digestive system (row 18), lost after the build.** The designer put the line
  in the intestines Teach script. It was still in `lesson.json.before-shape`
  (11:15, 22 September). The 11:44 hand rebuild to the new four-part Teach shape
  (4.2.278 and 4.2.279) moved the idea onto the board as a straight refusal,
  `Small doesn't mean shorter. It describes how wide the tube is, and the small
  intestine is the longer one.` (orange), and the script became `Now, the names
  are a bit misleading.` The joke went from both surfaces. That straight board
  line is now CONTENT's worked example of "the misleading word taken head on"
  (L116), and CONTENT L114 lists the light line itself among the lines "each said
  and never shown". The voice evaluation of the same day had labelled it KEEP ("a
  light line from the content, headteacher-safe"). So the one time the idea under
  a light line was promoted to the board, it was written in the board's plain
  register and the turn did not come with it.
- **Round to 10 (row 11) and Vikings (row 13), where the script was right or
  defensible.** Row 11 would have handed over Grace's answer on her slide. Row 13's
  names sit on a sort card, where a joke would change the item. A repair must keep
  these choices open.

### Against his calibrated slides

His two board lines are `The clue is in the name! A **fronted** adverbial has
been moved to the front of the sentence.` (§16B) and `You've made it work. Now
break it.` / `Not literally!` (§16G). Neither is an extra piece of text: each is
written into the line it is about, the definition and the task instruction. Most
of the generated lines have the same shape and could have ridden the same way:
row 18 is the fourth part of its Teach route, row 12 is the second line of its
route (and did ride), rows 8 and 10 are the halfway or zero case the model is
about. The plugin treats a light line as a separate piece that must earn a slot;
his slides show it costs no slot when it is written into the piece it is about.

### What the three earlier repairs did

- 4.2.150 (the answer written down): reached every run since; 27 records exist.
  It turned silence into an answer. It did not move placement.
- 4.2.151 (the turn test): most of the found lines have a real turn (rows 7, 9,
  10, 11, 13, 15); a few do not (row 6 is a simile, row 8 barely turns).
- 4.2.152 (a light line competes for the four pieces): 13 of the 14 lines found
  after it went to the script, and no record mentions room. Its sentence sits in
  Pride Lessons, read at the start, and meets the light line hours before the
  designer looks for one.

---

## 4. The causes, ranked

Read as two gates. Gate A: is a line found at all? Gate B: does a found line go on
the board? Since 12 September gate A passed 14 of 27 records (4 of the 14 lessons
he was given) and gate B passed 1 of 14. Gate B is the narrower, so its causes
come first: fixing gate A alone would add lines to scripts, and he would still
not see them. Gate A's cause accounts for the most lessons by count and comes
third.

### 1. A found line reads as speech to every rule met while writing (gate B: 13 of 14)

**Evidence.** The per-string rules in section 2 (LD L90's "never the reverse",
TV §2's two lists, TV L119, PREF L57, TV §17 question 3) are read many times a
lesson and all classify a conversational, sayable line as notes material. §4's
"no fixed home" and TV L229's reason for the board are read once, after the
strings exist. The two calibrated board examples sit in §16, which the reading
route opens only when wording is uncertain. The designers' records call the lines
"spoken" and never weigh the board.

**Smallest upstream change.** In TV §2, the part read with every string, name the
light line as the one conversational line that often belongs on the board: the
child reads it themselves, and on a lean board it is the line read twice (TV
L229's reason, moved to where the decision is made), with his two slides (§16B,
§16G) cited there as the examples. Give TV §17 question 3 the same exception, so
"would I say it aloud" is not read as "so it goes in the notes". Keep "normally"
in TV L119 (his calibrated slides need it); this is the named case where the
reversal is normal, which answers settled item 5 left to this fix. The "never the
reverse" copies (LD L90, PREF L57) already come to "normally" in release 5.

**Who carries it.** Release 5 for the copies; release 6 for TV §2 and §17.

### 2. The look comes at the end, when only the script is free (gate B, compounding cause 1)

**Evidence.** TV L20, LD L555 and LD L519 to L521 route §4 to the completion
pass, by design, because asked of each sentence the answer is always no (LOG
4.2.150). But by then every board is written, validated and full: the 42 Teach beats in
the designs from 18 September carry 4 to 12 text pieces each before any light
line (headline, route sentences, key questions and star line; median 7,
`teach_pieces.txt`; a long beat is split over two slides, so per slide it is
nearer the ceiling), against a ceiling of about four a slide. Adding to a board means a
rewrite or a new slide and a fresh validator run; adding to the script means one
sentence. 4.2.150 made the answer a decision about whether; it left the cheapest
answer about where.

**Smallest upstream change.** Move the look, not the record, to the moment each
beat's material is chosen: the picture, source, person, number or wrong idea that
beat puts in front of the class. That is still asked of the material rather than
of each sentence, which is why §4 was moved to the end, but it is asked while the
board for that material is being written. Keep the one closing line as the
receipt, and have it name where the line sits and, when it is the script, why
(row 11's reason is the model: it would give an answer away).

**Who carries it.** Release 6: TV L20, LD L519 to L521, LD L555. Limit: it must
not become a per-beat question with a per-beat answer; the record stays one line
a lesson, and "none" stays a good answer.

### 3. In maths, PSHE and hard history the guide's framing turns into "none" (gate A: 10 of the 14 lessons he was given)

**Evidence.** The nones: six maths lessons on real runs ("numerical position and
counting, with no natural factual surprise", "bare number lines ... no natural
light line beyond joking about a mistake", "a small numerical convention",
"no natural comic turn", "the comparison lets that surprise do its own work",
"no natural line beyond joking about the misconception") and the multiplying
candidate ("a joke at the wrong answer would land on the child holding it"); PSHE
twice ("children's bodies and circumstances"); history three times (poverty,
"three real children being hurt", exploitation). What they rest on in TV §4:
"Most lessons hand over nothing", "None is the right answer then", "calculation
steps; routine methods" kept straight, and "look at the other five first" for the
wrong-idea route. In bare-number maths the other five routes look empty and the
sixth looks discouraged, so the answer is none. Yet four maths runs on the same
kind of material found good lines in the numbers themselves (rows 8 to 11), so
the routes were not empty. The "never maths" reading of 12 September (LOG only)
matched these results; he has now reversed it. Some nones are right (the
Victorian children), and the multiplying candidate reads the guide more strictly
than it is written ("not the house joke" is about repeating one route across
lessons, not a ban).

**Smallest upstream change.** Release 5 records "humour wherever", maths and PSHE
included. Beyond that, in TV §4: scope "keep it straight" to the steps of a
calculation, not to a subject; give the route list one maths instance taken from
the material itself (a number or measure doing something odd, as rows 9 and 10
did), marked as an agent's example until he chooses one; and say plainly that the
house-joke warning is about sameness across lessons. Keep "none is the right
answer then", the turn test and the sensitive-issue limits exactly.

**Who carries it.** Release 5 (his words) and release 6 (the scope and the
example), TV §4 only.

### 4. The board has no named place, and the budget sorts a light line with the asides (gate B, what makes the board costly even when considered)

**Evidence.** No field description names a light line (section 1). A Teach board's
`explanation` is the three route parts; a maths turn's board is the question, the
tool and the criteria, with "the teacher's voice" filling the rest (PREF L772,
REV L42). Pride Lessons' first repair sends "a caveat the teacher can give in a
breath" to the script, which is exactly what a light line looks like, and
4.2.152's "if it belongs on the board" gives no test for when. The reviewer's
amount pass removes non-teaching fifth pieces "because the script says it aloud"
(the Victorian review). And the route file's own example (CONTENT L116) shows the
idea under a light line on the board with the turn taken out (trace 2).

**Smallest upstream change.** No new field: a field is a slot to fill, which TV
L223 warns against, and the free-text fields already carry a line to the deck.
Instead, say where a light line rides so that it costs no extra piece: on a Teach
board, written into the route part it is about (the refusal, the example, the
because), as row 12 was and row 18 could have been; on a task board, in the task
line (his `Not literally!`); on a maths turn, in the example's own wording or on
the answer reveal. In Pride Lessons, say the aside-to-the-script repair is not
where a light line is sorted, and keep "competes like anything else" for the
case where it would stand alone. Let CONTENT's misleading-word example carry the
light version (the lesson's own line, which the voice evaluation kept) beside the
straight one, as one of the shapes a refusal can take. The reviewer's amount pass
does not count a line that rides on a piece already there.

**Who carries it.** Release 6, reaching PREF L788 to L792 (topic 7's file,
handed by item 14 of the topic 8 plan), CONTENT L89, L114 and L116 (after
releases 3 and 4 settle that text), SKILL's turn fields, and REV's amount pass.

### 5. The review never asks the board question (a missed second chance)

**Evidence.** REV L139 accepts either surface, REV L42 frames the teacher's voice
as the notes, and no review since 12 September mentions humour.

**Smallest upstream change.** REV's one playful judgement gains the other half of
TV L229: when the lesson's line is in the script, would it do more where the class
reads it? Moving it onto the piece it rides on is a bounded wording repair; it is
not a finding when the script is right (row 11, row 13).

**Who carries it.** Release 6 (REV L139), after release 2 has settled REV.

---

## What is not a cause

- **The slide designer.** It copies child-facing wording exactly (SD L172), and
  the tooth-decay line reached the slide face unchanged. It needs no change, so
  topic 9 carries nothing for this.
- **The programs.** No check mentions humour. The says-once check needs 80 per
  cent word overlap; `explanation` has no length or sentence limit; the builder
  shrinks text to the 18pt floor and a beat is split rather than words dropped.
- **The decorator and the picture stage.** Pictures only.
- **Line quality.** Most found lines pass the turn test; the gap is placement and,
  in maths, PSHE and hard history, finding. Quality matters to the one board line
  (mild) but explains little of "never".

## Limits any repair keeps

Never a quota. None is the right answer when the material offers nothing. The turn
test. The sensitive-issue limits (never the issue itself, never at a child). No
fixed field for a light line. A line that would give away an answer stays off
that slide.

## His answer (26 September 2026)

Put to him in plain words: since 12 September a light line was found in 14 of 27 lessons and
only 1 of those 14 reached a slide; in maths, PSHE and hard history the answer is nearly always
none; the three causes (every rule met while writing sends chatty lines to the notes; the look
comes at the end when every board is full; the guide's framing reads as keep maths straight);
and five changes: at the moment each board is written, name a light line as the one chatty line
that often belongs on the slide, with his two slides as the examples (cause 1); look while each
beat's material is chosen, not at the end (cause 2); "keep it straight" means the steps of a
calculation, not a subject, with one maths example of a number or measure doing something odd
(cause 3); the line rides inside something already on the board, like his "Not literally!" in
a task line, so it needs no extra room (cause 4); the reviewer asks whether a line in the
script would do more on the slide (cause 5). Kept exactly: never a quota, none is fine when
nothing fits, never at a child or about the serious issue itself. He answered "do those humour
fixes". Release 6 builds all five, after releases 3 and 5 settle the text it reaches.

## Scratch

All read-only, in `streamline-tools/scratch/humour/`: `inventory.py` (every
design, deduplicated, with its closing humour record; `inventory.json`,
`inventory.txt`), `locate.py` with `cases.json` (where each named line sits in the
design and the slide spec; `locate.txt`), `deck_text.py` (slide face or notes, in
a built deck), `exclaim.py` (every sentence ending in an exclamation mark, by
surface; `exclaim.txt`), `teach_pieces.py` (text pieces per Teach board;
`teach_pieces.txt`), `keys.py` (every string field in the designs).
