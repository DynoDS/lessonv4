# Choosing a helper: maths

Read `shared.md` first. `catalogue.md` gives every helper's fields and a working
example. This file is what those cannot say: **which helper teaches what, in
maths, and how a set of them should be sequenced.**

---

## `number-line`: what each part of the line is for

- **A sentence about the line** ("Each interval is worth 100.") is its "caption",
  printed under the numbers. "unit" is the "cm" at the end of a ruler and
  "object" is the thing a ruler measures; a sentence put in either was clipped to
  "Each in", then drawn as a blue bar through every answer box, on a printed
  Year 4 sheet. Both now refuse it.
- **A value for the child to find** is a box in "boxes", at its tick.
- **A value about the whole line for the child to write** ("Scale: ___") is a
  "caption" with a blank in it. The engine draws the blank as an answer box
  like the ones at the ticks, above the line beside them when one end is clear
  and under the numbers when not. An `instruction` underneath gives the same
  words a thin line in a different place on every question, and a caption
  without a blank reads as something given rather than something to fill in.
- **A line to judge** ("Has this line been completed correctly?") prints the
  wrong number where it was written: a label `{ "at": 2600, "text": "2,700" }`
  puts "2,700" under the 2,600 mark. Without it the only way to ask the question
  is to rewrite it.
- **The move along the spaces** is "jumps", and **the space itself** is
  "highlight"; see the example in `catalogue.md`. A line with jumps carries no
  boxes, arrows or bracket.

## The written methods

`column-method-grid`, `short-multiplication-grid`, `long-multiplication-grid`,
`bus-stop-grid`, `long-division-grid`.

Each is the ruled shape of one taught method. Choose by the method the lesson
teaches, not by the numbers: a division lesson uses `bus-stop-grid` whether the
answer has a remainder or not.

`long-division-grid` is a bus stop WITH a working box beneath it. The box is the
whole point. Use it when the child is showing the subtract-and-bring-down steps,
and use the plain `bus-stop-grid` when they are not.

A grid gives the child the ruled shape and nothing else. If the lesson wants
the steps named as well, that is `method-frame`.

## `method-frame`: the taught strategy in words

A mental strategy printed as a fill-in method: labelled lines, with boxes where
the child writes.

**It can be faded across a set, when the lesson asked for that.** The same
frame can be given fully worked, then with one blank, then all blank, and the
helper takes the blanks per line so that progression is possible. It is not a
default: the lesson designer and the adaptation designer own whether support
fades, and `preferences.md` → Support, Checking and Release is explicit that
there is no fixed fully-partly-blank pattern. Render the progression that was
approved upstream. A set of frames that all stay fully blank, or all stay
partly worked, is a real design and not a fade somebody forgot.

The board draws the same frame, so the child meets one picture in both places.

## Place value

- `place-value-counter-chart` - counters in columns. Filled, it asks "what
  number is shown?"; empty, it asks the child to draw counters to show a number.
- `place-value-chart` - the chart digits are written into, or read from.
- `digit-cards` - "here are four digit cards", for making numbers from.

The counter chart is a wide object. A four-column one wants most of a portrait
page's width (about 157mm of the 180, standing only about 45mm tall), and that
is the truth about counters big enough to read the value on rather than something
to squeeze. It is the same chart the slides draw, so its columns carry the
board's colours.

**The chart's rows are what make it a teaching picture rather than a grid.**
Left alone it is one empty row, and setting instances to 3 gives three empty
copies for "write each of these numbers into a chart". Give it a rows list
instead and each row can be filled (a number handed to the child), empty (a
number they write), labelled (what the row IS - "3,462", "10 more"), and
highlighted (the one digit that changed, ringed in the question blue).

Reach for the label and the highlight together whenever the lesson is about
**which column changes**: 10 and 100 more or less, exchanging, rounding,
multiplying and dividing by 10. There the changed digit is the learning, and a
chart that shows two numbers with nothing marked leaves the child to find it.
Leave both off when the chart is simply the ruled shape a number goes into.

That does not make a place-value chart the default shape for every practice
item in a place-value lesson. Follow the Lesson Design's `Activity
architecture`. When the child is locating or explaining one change, or still
needs the columns as the access route, use the chart. When the child is
calculating several related transformations from each starting value and the
learning comes from comparing the results, use one `data-table` that keeps the
starting value and its related results on the same row. Put the invariant
starting value in the anchor column and the transformations in parallel
columns. The table is right because the relationship stays visible, not
because it packs in more answers. Keep separate questions when each item needs
its own method or working, and keep the chart on the Below sheet when removing
it would remove access rather than fade a scaffold.

## Comparing and ordering

`compare-row` for single `< > =` questions. `inequality-with-boxes` when the
child chooses digits that make a statement true, which is a different and harder
job than comparing two given numbers.

`order-numbers` and `order-table` are the same task laid out two ways. The table
is easier to mark and easier for a child to check; the row reads more like the
way the question would be asked aloud.

`data-table-with-ordering` when the ordering comes out of data the child has to
read first.

## Fractions

`stacked-fraction` and `fraction-sequence` write a fraction properly: a
numerator sitting on a rule above the denominator. **Never write a fraction flat
as "3/4" in question text.** That is a different notation from the one a child
is being taught to read.

`fraction-bar` is the picture, for equivalence and comparison.

## Measures

`ruler` prints at TRUE SIZE and refuses a zone too narrow rather than shrinking
into it. That refusal is the helper working. A scaled ruler still looks like a
ruler, and it makes every answer a child measures wrong on a page that looks
completely normal. If it will not fit, the layout changes.

`clock-row` for time. `coin-strip` for money, with the coins drawn at their real
sizes relative to one another for the same reason.

## The part-whole model

`part-whole` is a whole joined to its parts. It is one renderer under two names:
`part-whole-money` is the older, money-flavoured one, kept working because saved
specs use it, and its bubbles can carry coins. Reach for `part-whole` for
everything else - partitioning, decomposition, a missing addend, a bar-model-
adjacent split - because the mathematical object was never about money, and
while the only name for it was `part-whole-money` it was passed over for all of
that work.

**Every node says which of three things it is, and a node that says none is
refused.** `value` is a number handed to the child and prints in the given
colour. `label` is a word the child reads - `Left`, `Pounds` - and stays in ink.
`blank: true` is a place to write, and stays empty. This is the same discipline
`label-diagram` applies to its callouts, for the same reason: a node left empty
because that is the question and a node left empty because nobody decided look
identical on paper.

Two more fields carry the rest of the approved partitioning sheet. `caption`
names a node from outside its box - `Thousands` under a blank - so a child can
never read it as something already written in the space they are about to write
in. `joiner: "+"` prints the operator between the parts, which is what makes an
additive model say what it means rather than leaving the child to supply the
relationship.

`blankChars` sizes a blank for what goes in it: four for a four-digit number,
more for a word. A node the child writes a word into and a node they write a
digit into are not the same box.

**Its bubbles carry text labels**, and that is the right default nearly every
time: a schematic part-whole reads at any column width, where coins inside a
bubble are competing for room with the bubble's own outline.

The unfilled bubble is the question, wherever it sits. Leave the whole unfilled
and the child totals the parts; fill the whole and leave a part for them to
find, and the same helper asks a subtraction. That is why "£5.80" in the whole
with "Spent £2.40" and "Left" as the parts needs no second helper: "Left" names
the gap rather than answering it.

**Coins inside the bubbles are opt-in, for one kind of lesson**: one that
teaches a specific physical coin partition, where the coins themselves are what
the child is thinking about. Even then, prefer a separate `coin-strip` ABOVE
the model over cramming coins into small bubbles. The strip prints them at a
size a child can name, and the model keeps the shape that carries the
partition.

Where coins are drawn, use the fewest that make the amount: £2 + £1 + 50p reads
cleaner than three £1 coins and a 50p, and a child counting three coins is
reading the partition rather than the pile.

**One model per amount being partitioned.** A question that splits two
different amounts draws two models, never one: four bubbles hanging off a
single whole says all four are parts of that one whole, which is the opposite
of what the question asked.

## Composing, decomposing and the number sentence itself

`number-sentence` writes a number sentence out as the thing it is: values handed
over on their own tiles, operators between them, and a real target wherever the
answer goes. Three kinds of term, each saying exactly one thing - `value` (given,
orange, on a tile), `blank` (a box, sized by `chars`), `cells` (a segmented frame,
one cell per digit, for an answer whose digits are the point).

Reach for it when composing, recombining or finding a missing term IS the work.
`9 + 4,000 + 50 + 200 = ` typed into a question stem with a blank after it is
four values a child has to pick out of a sentence before they can start; the
same task with the terms apart shows the pieces being recombined. The mixed
order is usually the question, so never sort the terms into place-value order on
the way past.

A `heading` on a term names the column it stands in and runs across the terms
that follow it, which is what turns a stack of these into a record: `Your
number` over the digit frame, `Expanded form` over the blanks. Six blank rows
with nothing over them leave a child to work out which half is which.

`{ "stack": { ... }, "repeat": 6 }` writes one row once and prints six. **How
many rows is an authored decision, not a count of the answers.** Six rows for a
find-all investigation with six solutions is a capacity cue, and on the approved
Year 4 sheet that was deliberate.

Where withholding the number of solutions is part of the question, the answer is
an open surface, not a short one. A `recording-table` sized by its `writing`
gives rows that do not announce a count, and a `blank-surface` gives a child room
to organise their own search. Printing fewer rows than there are answers is not
the fix: it cues a smaller number and leaves a child who found them all with
nowhere to put the last two. Whichever it is, it is settled upstream and said
there; the renderer never works out how many rows there should be.

`counter-group` is the place-value counters without the chart: one compact group
per denomination, under the claim they are evidence for. Reach for it when two
cases sit side by side and are compared - two equations to judge, two
partitions to test - where two counter charts would be two pages. It draws the
groups it is given and has no field for a total or a verdict, which is the
point: the child decides whether the claim is true, and the sheet must not tint,
tick or total its way to the answer first. Keep the two panels visually matched
and give each its own room to explain, directly under it.

## Shape and space

`shape` carries the measurements a child reads to find a perimeter, an area or a
missing length. `triangle`, `angle` and `line-pair` are classification pictures:
they read at a glance or not at all, so they stay small and gain nothing from
being given more room.

`coordinate-grid`, `reflection-grid`, `translation-shape` and `geoboard` all
square up: more columns need more width, or the numbers along the bottom crowd
into each other.

## The reasoning grids

`times-table-grid` and `number-pyramid` are the recurring SATs shapes where the
EMPTY box is the question. A blank product is found by dividing; a blank base
brick in a pyramid is found by subtracting, which is the harder direction and
the reason to reach for one.

---

## Sequencing a maths sheet

Make the approved task sequence read coherently. Where a sheet does run fluency,
then reasoning, then a problem, keep that order: a child who cannot yet do the
calculation cannot show reasoning about it. But that is the shape of a common
sheet, not a shape to impose. A single investigation is a whole sheet. So is one
coherent practice set. **Do not invent a section the lesson design did not ask
for** so that a sheet has three of them.

- **Fluency** wants the same helper repeated, so the child settles into a rhythm
  and the page stops being something to decode. A `row` with `repeat` gives
  several of the same thing side by side, and a `stack` with `repeat` gives
  several down the page.
- **Reasoning** usually wants a different shape, so the change of gear is
  visible - though where the reasoning is about the same objects the fluency
  used, keeping the representation and changing the demand is the better move.
- **The problem** usually wants room to write, which means `written-answers`
  rather than the short answer space `questions` carries.

**Keep equivalent items visually consistent, and change the surface only when
the task changes.** Four numbers partitioned four ways are four of the same
model; printing each in a different helper says they are four different jobs.
Variation is a consequence of a different intellectual demand, never a goal in
itself.
