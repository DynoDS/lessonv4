# Plan: the mechanical faults the six 22 September runs hit

Written 22 September 2026 from the six lessons built that day on 4.2.276: Year 4
Maths 15 (compare and order negative numbers), Maths 16 (Roman numerals to L),
Maths 17 (Roman numerals to C), History 4 (Lord Shaftesbury), History 5
(children's leisure time) and Science 4 (name parts of the digestive system).
Apply in the order given; each part names its own check.

**Progress.** Parts A and B shipped as 4.2.280 and Part C as 4.2.281 (22 September 2026);
their entries are in `build-review-log.md`. Part D is diagnosed and blocked on
the playbook consolidation pass. E1 shipped as 4.2.282 and E2 is diagnosed and
not applied. Parts F and G are not started. Part H
is the deliberate do-nothing list.

These are all mechanical. The teaching faults from the same six runs were dealt
with in 4.2.277, 4.2.278 and 4.2.279 and are not reopened here.

**Acceptance statement.** A worksheet pack is never lost whole because one of its
three sheets will not fit. A success-criteria panel that cannot fit reaches a
roomier composition inside the Slide Designer's own passes rather than after
them, so 18pt criteria stop being the routine outcome. A repair carrying out an
upstream design change is not refused for carrying it out. A diagram anchor
coordinate is not treated as a number the class reads.

**What must survive.** The scope check still refuses every change nobody
authorised, which is the whole reason it exists and what it cost to learn. The
point-at test still refuses most walls, because most lessons should not earn
one. The no-67 rule still fires on every number in a question, an answer, a
table or a set of notes. A flagged resource still ships flagged, not silently.

---

## Part A. A diagram anchor coordinate is not a number the class reads - DONE (4.2.280)

**Diagnosis. Confirmed, not suspected.** In the science run the large-intestine
label sat at 67 percent across the digestive diagram, and the worksheet build
refused the sheet with `NUMBER_CONTAINS_SIX_SEVEN`. The anchor owner moved it to
68 and the sheet built. Nobody ever sees that number: it is a position inside a
picture.

The rule already knows this class of value and already skips it. Its skip list
covers `x`, `y`, `w`, `h`, `width`, `height` and the rest. What it does not cover
is the same value written as a pair. The label-diagram helper stores positions as
`anchor:[x%,y%]` and `label_at:[x%,y%]`, and when the walker descends into an
array it passes the parent key down, so the 67 arrives carrying the key `anchor`,
which is not on the list.

Reproduced directly against the shipped module:

```text
anchor pair: [ '67' ]      <- refused, and should not be
question:    [ '67' ]      <- refused, and should be
```

### plugins/lesson-v4/shared/text/no-six-seven.js

Find:

    const SKIPPED_NUMBER_KEYS = /^(fontSize|headingFontSize|weight|rotation|transparency|x|y|w|h|width|height|maxRows|blankChars|classSize|dpi|radius|lineW|pad|gap|minFont|maxFont|version|schemaVersion|lon|lat|longitude|latitude)$/;

Replace it with the same list plus `anchor` and `label_at`, and extend the
comment above it so the reason is on the record: a position inside a picture is
measured, not chosen, and the child never reads it. The existing comment already
explains why decimals and layout ratios are skipped; this is the same argument
for the same kind of value written as a pair.

**Its check.** The two lines above: the anchor pair passes, the question still
fails. Add both to the no-six-seven tests, the second so nobody later widens the
skip into the numbers that matter. Rebuild the science worksheets and confirm the
anchor can go back to its true position of 67.

---

## Part B. One sheet that will not fit must not lose the pack - DONE (4.2.280)

**Diagnosis.** This is the only fault of the six that cost a delivered resource.

Maths 15 has a deck and a walk-through and no worksheets at all. The Expected
sheet failed its page fit. The one permitted repair fixed Expected. The Greater
Depth sheet, which the repair had not touched, then failed on its own, portrait
22mm too narrow and landscape 55mm too tall. `playbook-lite.md` Phase 3.5 says
`There is no second round for the same fault`, so nothing else ran, and the
whole pack was excluded.

The principle that answers this is already yours and already in the same
section, four paragraphs below: **a deck the round did not clear still ships,
its slides flagged for the teacher** (16 September 2026, "flag the slides and
deliver it"). That was written for slides and never extended to sheets. So a
single bad slide costs one flagged slide out of seventeen, while a single bad
sheet costs all three sheets and the answer key.

The three sheets are separately rendered pupil documents. Below and Expected
fitting has nothing to do with Greater Depth not fitting.

### plugins/lesson-v4/skills/make-lesson/playbook-lite.md, Phase 3.5

Extend the flagged-delivery paragraph to say the same thing about the worksheet
pack that it already says about the deck: when a sheet cannot be made to fit,
build and deliver the sheets that do, print the complete answer key for them,
and name the missing sheet and its exact failing measurement as a teacher flag.
Exclude the pack only when no sheet at all can be written.

**Also worth changing, and cheaper.** `There is no second round for the same
fault` is doing more work than it was written for. Greater Depth failing was not
the same fault as Expected failing; it was a different sheet, first seen only
after the first repair ran. Say that plainly in the same paragraph: the bar is
one round per fault, and a fault the round uncovered in a sheet it did not touch
is a new one. That alone would have delivered this pack intact.

**Its check.** Rebuild the Maths 15 worksheets from the saved working directory.
Expect a pack containing Below and Expected, an answer key covering both, and a
teacher flag naming Greater Depth with its measurement. Then confirm a run where
every sheet fits is completely unchanged.

**What must survive.** Delivering two sheets and saying so is honest; delivering
two sheets quietly is not. The flag has to reach the run report's teacher flags,
not only the friction file.

**Found while proving this, still open.** Maths 15's Expected sheet prints six
questions and its answer key answers only four, so even with the pack rescued
that lesson refuses on `ANSWER_KEY_INCOMPLETE`. The run never reached this fault
because it died on the Greater Depth fit first. Rebuilding that one lesson's
worksheet belongs to its designer, not to this plan.

---

## Part C. A refusal has to point at the lever that works - DONE (4.2.281)

**The plan's first diagnosis was wrong, and the investigation is worth keeping.**

This part was written as "the designer does not reach for a composition change
during its three passes". The first thing the investigation found was that
`slide-designer.md` already says to, in as many words, and even predicts this
exact failure: *"Three passes spent trimming one crowded layout is how a deck
reaches EXHAUSTED 3/3 with the fault the first check named still standing."*
Adding that rule again would have been writing a rule that was already there.

So the question became why a designer holding that instruction still spent its
passes trimming. The answer was in the two refusals it was reading.

**Maths 17, the criteria panel: the refusal said the step fitted, and refused
it.** Its own words were "The card holds about 95 characters at 18pt (1 line of
about 95); this one is 40 characters, which wrap to 1 line." Forty into
ninety-five, one line into one line. The refusal was correct - the card was
0.31in tall where one line at 18pt needs 0.35in, so it held no line at all - but
`budgetSentence` floored its line count at one and described a card that did not
exist. Every number in it pointed at the wording, which is the one lever that
could never work. Confirmed by instrumenting the real file: `linesThatFit=0,
reportedLines=1` on all four slides.

*Fixed in `steps.js`: when the card holds no line at the floor, the sentence
says so, in the dimension that is actually wrong. It now reads "The card is
0.31in tall and one line at 18pt needs 0.35in, so it holds no line at all and no
wording will fit it. This is room, not words: each card here is about 0.04in
short." Pinned by `overload-message-is-true.test.js`, which holds the general
invariant: a refusal quoting a budget must show the overflow it is refusing.*

**Maths 16, the reference tables: the refusal was true but in the wrong unit.**
"Give the table a zone at least 1.50in tall" is correct and unusable, because a
slide spec sets weights, not inches, and converting between them needs the
stack's total height, which the refusal never carried. Each pass was a guess at
a weight, and the measurement moved a hundredth of an inch at a time.

*Fixed across `table.js` and `stack.js`: the refusal carries the height it needs
and the box it got, and the stack - the only place that knows both those and the
weights - appends the weight that would hold it. It now ends "In this stack that
is a weight of 1.16 on this item (it has 1); the other items keep theirs." The
advice is rounded up, never to nearest, because the first version landed exactly
on the floor and was refused by the last digit. Pinned by
`weight-advice-works.test.js`: the advised weight must clear the refusal that
offered it, and no weight is offered where no weight could reach it.*

**What the evidence does not support, recorded so it is not repeated.** Partway
through this I reported that a single weight change fixed all six of Maths 16's
slides and no template change was ever needed. That was wrong: it cleared the
table fault and uncovered a criteria fault underneath, because that half-slide
was carrying a 1.50in table and a four-card criteria panel at once. The template
change the focused repair made was the right answer for that lesson. What was
wrong was never the repair; it was that one of the two refusals lied and the
other spoke in inches.

**Still open, and named rather than done.** A criteria panel gets the truthful
message but no weight number, because the refusal happens at the card and the
stack's child is the panel, so the shortfall has to be multiplied by the number
of cards on the way up. That plumbing is the obvious next step and was left out
rather than rushed.

**Its check, as run.** Both real lessons, from their saved working directories:
Maths 17's four slides now refuse in the dimension that is wrong, and Maths 16's
six now carry a weight that works. 702 builder tests, and the full suites below.

---

## Part D. The repair went to a role that is not allowed to make it - DIAGNOSED, BLOCKED

**The plan's diagnosis was wrong here too, and the correction matters because
the plan's proposed fix would have done damage.**

This part was written as "give `check-repair-scope.py` a manifest of authorised
changes". The investigation says that check needs no change at all, and
loosening it would have removed the one guard that stopped a repair quietly
deleting a comparison from a slide.

**What actually happened.** Every party behaved correctly.

- The compact repair roles are defined as presentation-only.
  `slide-designer-focused-repair.md` says "Keep every upstream-authored
  pupil-facing string exact apart from presentation-only line breaks".
  `worksheet-designer-focused-repair.md` says to read the full role instead when
  the correction needs pedagogical content changed.
- Both roles did exactly that in History 5: they returned NOT FIXED and routed
  to the full owner.
- `check-repair-scope.py` refused the changes, which is its job.

**The fault is one line above all of that.** `playbook-lite.md` Phase 3.5 says
"Use the compact focused-repair role for the named owner when present, otherwise
its full creation role." It is unconditional. So a cross-resource update
carrying an approved redesign's new wording is sent to a role forbidden to write
it, and the round is spent discovering something that was knowable before it
started. History 5 lost two rounds that way, one of them the run's longest step
at 44 minutes.

The pipeline already knows this category exists: the same section says a
`SLIDE_CONTENT_GAP` or `WORKSHEET_CONTENT_GAP` goes to the content-gap wave and
never to the compact repairer. And `lesson-designer-focused-repair.md` carries
the matching boundary in its own description ("never for a reviewer's REDESIGN
REQUIRED"). The rule exists for the lesson designer and for picture gaps, and
not for a cross-resource content update.

**The change, ready to apply.** One condition folded into that sentence, not a
new paragraph and not a manifest:

    Use the compact focused-repair role for the named owner, and the full
    creation role when the change is to what children read: the compact roles
    may not author or drop it.

Roughly 65 bytes over what it replaces.

**Why it is not applied.** There is nowhere to put it.

    playbook-lite.md      78,839 / 78,848 bytes   headroom 9
    slide compact role     7,927 /  8,000 bytes   headroom 73

The playbook cap is a deliberate growth alarm, and its own note in
`test_make_lesson_runtime.py` says what to do when it is reached: "The file is
now the thing to consolidate: a third raise should be a consolidation pass
instead." Part B already used the last of that headroom.

Putting the boundary in the four compact agents' descriptions instead was tried
and reverted. It duplicates one decision across four files, which is the
stacking the method warns against, and the slide role has its own 8,000-byte cap
that a 218-byte clause broke.

**The three routes, and the recommendation.** Raising the cap is the one the
file argues against. Shaving unrelated prose to buy 65 bytes is worse, because
it trades settled guidance for a routing fix. So the consolidation pass is the
real next step, and it should be its own piece of work with its diff read rule
by rule: the standing warning on this package is that "no teaching change"
consolidations have quietly removed voice rules before.

Until then Part D is diagnosed and waiting, and the cost of leaving it is one
wasted repair round on any run where a redesign changes what children read.

---

## Part E. A picture that cannot be generated should not cost hours

### E1. A call that returned nothing has not been judged - DONE (4.2.282)

**Diagnosis, from the run's own ledger.** The science run recorded
`outcome: "rejected"` with `staging_path: null` and
`fault: "imagegen_output_unavailable"`. Nothing was generated, and the attempt
was closed as a verdict on an image that never existed. `rejected` is the one
outcome authorising no further call, so a checked hand-made replacement had
nowhere legal to go.

The recovery door existed the whole time: `interrupt-open` consumes the attempt
and leaves a `recovery` call. What the scout could not know is that a call
returning nothing belongs there, because all four outcomes are introduced by
"Classify each output" and none of them fits when there is no output.

*Fixed at the gate: `cmd_complete` refuses `rejected` for an open attempt with
no image and names `interrupt-open`. Only `rejected` is gated, because the other
three each leave a door open. The reference carries the routing in one sentence.
Replayed against the real prompt and fault string to confirm.*

### E2. Provenance has no route for a picture an approved redesign retired - DIAGNOSED, NOT APPLIED

**Diagnosis.** When a content-gap redesign retires a picture, the final contract
simply stops holding it, and its terminal receipt becomes "extra terminal
evidence". History 5 worked around this by hand, moving those receipts into a
`retired` subfolder that the scan does not reach. Nothing in
`finalize-picture-assignment.py` knows that folder exists, so the workaround
survives only as long as nobody changes the glob.

**The design, and it is already in the file.** `--early-wave-snapshot` solves
exactly this shape for a different cause: an early-wave picture the sheet never
took is accounted for rather than refused, because `receipt_bound_to` proves the
receipt was written against that specific immutable contract. A redesign-retired
picture wants the same treatment against the superseded contract it was sourced
under, and the run already keeps those snapshots (`photo-requirements-a-1.json`,
`photo-requirements-w-1.json`).

**Why it is not applied.** This widens the guard that stops a run proving a
picture with the wrong receipt, and it widens it further than the early-wave
case does: that accepts one named immutable snapshot, while a redesign can leave
several. Deciding which superseded contracts may justify a receipt is the whole
safety question, and it is not one to settle at the end of a long session when a
manual workaround exists and worked.

**Its check, when it is done.** History 5's provenance passes with its retired
receipts in place and names them as retired; a receipt matching no contract the
run ever compiled is still refused as stray.

---

## Part F. Maths never gets a working wall, and that needs checking before it is fixed

**Diagnosis, and this one is a hypothesis, not a finding.** None of the three
maths lessons produced a wall. Two were refused because no later lesson could be
named for the point-at test. The third was refused because the five-column Roman
numeral table will not fit A3 with a readable first column.

The point-at test is answered from one place. `working-wall-designer.md` line
190: the `Where this lesson sits` section is "the only place the answer is", and
`working-wall-packet.py` writes that section from `unit_context`. When
`unit_context` is empty the packet tells the designer it cannot name a later
lesson. From there a wall is close to unearnable.

The science run says the same thing in plain words: "Only lesson 4's row was
provided; neighbouring lessons were unavailable."

So before changing any judgement, find out why. There is a Year 4 maths plan
imported into the plan tracker. Either the packet is being given one row instead
of the unit, or the maths plan rows do not carry what the wall needs. Those have
completely different fixes, and guessing between them would mean loosening the
point-at test, which is the one thing here that should not be loosened.

**If it is the packet**, fix the packet and leave the test alone. The maths walls
then either earn their place honestly or do not.

**If the maths plan genuinely has no later lessons to point at**, then maths
mostly should not have walls, and the right change is to stop spending a designer
launch on it each run.

**Separately, the A3 table.** The wall renderer cannot give a five-column
reference table a wide enough first column at the readable floor. That is a real
renderer gap and is worth fixing on its own, because the same table is wanted on
the board and on the wall. Lower priority than knowing why the other two failed.

**Its check.** Whichever answer the investigation gives, the test still refuses a
lesson whose learning the unit never returns to. If maths walls start appearing
for lessons that do not deserve them, this part has gone wrong.

---

## Part G. The run report's timings cannot be trusted

**Diagnosis.** Maths 16, Maths 17 and History 5 print an identical worker
timeline: same session file, same worker names, same launch and return times to
the second. History 4 and Science share a second identical pair. Three lessons
were built in one sitting, and each report copied the whole sitting's timeline
rather than its own workers.

Two consequences. The timings cannot tell which lesson was slow, which is exactly
what they exist for. And the counts come out wrong: Maths 16 reports "6 workers,
4 returned" and Science "10 workers, 9 returned", which reads like two workers
hung and is really just the mixing.

This changes nothing about any lesson already built. It matters because speed work
starts from a WORKER_TIMELINE, so the next speed decision would be made on
numbers that are not about the lesson being judged.

**The change.** Filter the timeline to the workers belonging to this lesson's
own run, and drop the unreturned-worker counts when they cannot be attributed.

**Its check.** Build two lessons in one sitting. Each report names only its own
workers, and the two reports differ.

---

## Part H. Recorded and deliberately not acted on

These came out of the same six runs, are real, and are not worth a change now.
They are written down so that if any of them turns up a third time there is a
record it was seen and passed over.

- **Underfilled boxes.** Four of the six have a slide or two where a short
  sentence sits in a wide box. Nothing is missing or hidden. Cosmetic, and
  chasing it would push against the wording rules just settled in 4.2.278.
- **Temp-file tidying refused by policy.** Three runs. Never touched a finished
  resource, and `playbook-lite.md` already says this refusal is a normal outcome
  and not friction.
- **Check commands run without their routing arguments.** Twice, in Maths 16 and
  History 5. Self-corrected on the next command, seconds lost. Worth a fix only
  if it becomes constant.
- **Reference reads refused or truncated.** Maths 16 twice, History 5 once. Each
  recovered by reading in smaller pieces. Same judgement as above.
- **Two soft pictures in the Shaftesbury deck.** The 1842 mine image at 416x238
  and the ragged school at 640x467. The engine flagged both correctly and
  delivered them, which is the intended behaviour. A judgement on the board, not
  a code change.
- **A science sheet ending 37mm early.** The report calls it a harmless
  page-balance observation and it is.
- **Design review postflight missing three closest-call entries.** Maths 15. The
  entries were visibly in the review, canonical validation passed and the run
  used the review's real result, so nothing was lost. One occurrence.
- **No stick-in sheets in any of the six.** Every lesson decided against, each
  with a specific reason that reads sound. Six for six is worth noticing rather
  than fixing. If the next few runs also produce none, the question to ask is
  whether the bar is set right, and that is a teaching question, not a mechanical
  one.
