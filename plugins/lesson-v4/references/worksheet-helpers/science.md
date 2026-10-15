# Choosing a helper: science

Read `shared.md` first. `catalogue.md` gives every helper's fields and a working
example. This file is what those cannot say: **which helper teaches what, in
science.**

---

## The three science pictures

`circuit-diagram` draws one series circuit or a row of them in the standard
schematic symbols. Each circuit carries its own state, so one helper covers the
whole electricity unit: a working circuit, a broken one, a switch open.
Standard circuit symbols are Year 6 work (`subject-science.md`); a Year 4 lesson
shows a labelled photograph of a real circuit instead (`label-diagram` on the
photograph).

Draw a ROW of them when the question is comparative ("which of these will
light?"). One on its own when the question is about that circuit.

A comparative row is where the worksheet-designer's "break predictable
patterns" rule bites hardest, because a circuit has three ways of failing: a
gap in the wire, no cell, and a switch left open. Mix the working and broken
states across the row, and mix WHICH fault the broken ones carry, so answering
means checking each circuit for a complete loop, a power source AND a closed
switch. A row that runs working, broken, working, broken, or one where
every broken circuit has the same fault, can be finished by spotting the pattern
without ever tracing a circuit.

A row also needs somewhere to put the answer. Label the circuits and pair the
row with a way to RECORD a yes or no against each label: a `multiple-choice`,
or a small `sort-grid` with "will light" and "will not light" as its columns.
Without one the child has reasoned about six circuits and written nothing down,
and the sheet holds no evidence they did.

`classification-key` is a branching yes/no key down to named living things. Give
it the nested structure and never a coordinate: it works out where every branch
goes, so a key with an extra answer redraws itself rather than needing its
positions redone.

**A key printed on its own is something to read; running one is the skill.**
That is the same divide `data-table` and `recording-table` fall either side of
below. So follow the key with the creatures to identify: describe each one by
its features ("no wings, eight legs, no antennae") and leave a blank for the
child to name it by walking the branches. The features are what make the task
work, because a child who is given the name has nothing left to follow the key
for.

`process-chain` is links joined by arrows in a line that ends: a food chain, the
order of events. **The arrows are the helper.** They carry the "this leads to that"
the task is about, which is why a chain is not a row of cards.

**A task that has the child make a chain prints the chain to fill in**, not a
blank space with an instruction to draw one. The empty boxes, the joins and any
lines for role words are the page's shape of the answer, and a child who is
still learning what a food chain looks like has nothing to start from on an
empty box (a Below sheet of 11 October 2026 asked for "every label that fits
beside each living thing on your chain" over 55mm of blank paper). Leave a box
empty for each link the child writes (`"boxes": [null, null, null]`), list the
named pictures to place (`"bank": [{ "text", "imagePath" }]`, in the sheet's own
mixed-up order, in place of a separate row of picture cards), set
`arrowHeads: false` when the child decides which way each arrow points, and
`labelLine: true` when the task asks for the roles. A level can be given
more: a box already named, the arrows already drawn. A drawing space is still
right when the adaptation asks for the child's own drawing of each living thing.

`cycle` is the same idea bent into a loop: the last stage joins back to the
first, which is what makes a life cycle, the water cycle, the seasons or blood
round the body a cycle and not a list. Choose it over a chain whenever the board
taught the process as going round, so the sheet asks about the picture the
class was shown. Its stages are written as a chain's links are (words, a named
picture, or an empty entry for a box the child writes in), and it prints as two
rows that read clockwise from the top left. Its `"arrows"` list puts a few words
beside each arrow, in the order of the stages. When naming what happens between
stages is the task (evaporation, condensation), leave that list off and set
`arrowLine: true`: every arrow then has a line to write on. `arrowHeads: false`
and `labelLine: true` work as they do on a chain. A cycle copied from an
answers slide may keep its answers marked (`{ "text": "caterpillar", "answer":
true }` for a stage or an arrow's words): the pupil sheet prints an empty box or
a writing line in each one's place, and the same cycle given as the answer
key's picture prints them in green. Two rows of photographs are
deep (about 115mm for four), so a pictured cycle is most of a sheet's one
question, while a cycle of words takes 30 to 50mm.

---

## Recording what happens

`recording-table` is the science results table, and it is the difference between
a sheet a child reads and a sheet a child works on. Any cell can be given (a row
label, a worked first row, a result handed over), and the rest stay blank and
tall enough to write in.

A column heading can carry a second line saying what it means or what to write
under it: put a line break in the heading
(`"Appearance\nWhat does it look like?"`) and the second line prints small and
quiet under the first. That is
where a child looks when deciding what goes in a column, so prefer it to a
`note` under the table that explains every column at once. Keep the `note` for
something about the whole table. `data-table` headings take the same.

Use `data-table` when the values are HANDED to the child to work from, and
`recording-table` when the child fills them in. Confusing the two gives a child
a table of the answers they were supposed to find out.

---

## Labelling

`label-diagram` is the workhorse of primary science: label the digestive system,
the parts of a flower, the ear, a circuit. It puts a dot on each part it names,
joined out to either a printed label or a blank line for the child to write on.

It is the one helper handed a PICTURE rather than drawing itself from
numbers, and there is a step in the pipeline for that: a dot is a position
written before the picture is chosen, so it can land on empty sky. The
`diagram-anchor` pass opens the published base picture and moves each dot onto
the part it names, dropping any part that is not in the shot.

What sets its size is the LINE the child writes on, not the picture. Long words
need a wide line and so a big diagram. Numbered dots with a list beside them
need about 148mm across together, half a page rather than a full one, which is
the option to reach for when the diagram has to share a page.

A tall picture is the exception: a body or a plant printed across the page can
stand 250mm high and leave no room for anything else. Give it `"frame": [4, 3]`
(any width-to-height shape) and the picture is fitted and centred in a box of
that shape, never stretched, so the whole figure comes out shorter while the
dots stay on their parts. The build reads the picture's real size from the
file, so its size is never something to write in the spec.

---

## Sorting

`sort-grid` for sorting into named columns: solids, liquids and gases;
conductors and insulators. `venn` and `carroll` when two properties overlap or
cross, which is a different and harder job than sorting into separate groups.

---

## Enquiry shapes

A science sheet usually runs: what we know, what we did, what we found, what it
means.

- what we know - `data-table`, `source-text`, or a labelled picture
- what we did - `process-chain`, or a `writing-frame` for the method
- what we found - `recording-table`, `tally-chart`, `bar-chart`
- what it means - `written-answers`

Not every sheet needs all four. A sheet carrying all four with two lines for
each has taught the shape of an enquiry and left no room to do one.
