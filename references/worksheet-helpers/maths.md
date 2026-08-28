# Choosing a helper: maths

Read `shared.md` first. `catalogue.md` gives every helper's fields and a working
example. This file is what those cannot say: **which helper teaches what, in
maths, and how a set of them should be sequenced.**

---

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

**Fade it across a set.** The same frame can be given fully worked, then with
one blank, then all blank. That progression is the teaching, and it is why the
helper takes the blanks per line rather than fixing them.

The board draws the same frame, so the child meets one picture in both places.

## Place value

- `place-value-counter-chart` - counters in columns. Filled, it asks "what
  number is shown?"; empty, it asks the child to draw counters to show a number.
- `place-value-chart` - the chart digits are written into, or read from.
- `digit-cards` - "here are four digit cards", for making numbers from.

The counter chart is a wide object. A four-column one wants most of a portrait
page's width (about 138mm of the 180, standing only about 39mm tall), and that
is the truth about counters big enough to see rather than something to squeeze.

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

`part-whole-money` is a whole bubble with parts beneath it, two being the usual
shape. **Its bubbles
carry text labels**, and that is the right default nearly every time: a
schematic part-whole reads at any column width, where coins inside a bubble are
competing for room with the bubble's own outline.

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

Fluency first, then reasoning, then the problem. That order is not decoration:
a child who cannot yet do the calculation cannot show reasoning about it.

- **Fluency** wants the same helper repeated, so the child settles into a rhythm
  and the page stops being something to decode. A `row` with `repeat` gives
  several of the same thing side by side.
- **Reasoning** wants a different shape, so the change of gear is visible.
- **The problem** usually wants room to write, which means `written-answers`
  rather than the short answer space `questions` carries.

Vary the helper between sections and not within one.
