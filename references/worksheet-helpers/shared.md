# Choosing a helper: any subject

`catalogue.md` says what each helper IS and gives a working example of each.
This file is the part no generator can write: **which one to reach for, and
what a good sheet does with it.** Read it for every lesson.

---

## Start from what the child does

Not from what the page looks like. A helper is chosen by the action:

| The child… | Reach for |
|---|---|
| answers in a word or a number | `questions` |
| answers in their own words | `written-answers` |
| reads something and works from it | `source-text`, `data-table` |
| records what they find | `recording-table` |
| joins one thing to another | `match-up`, `card-row`, `timeline`, `label-diagram` |
| sorts into groups | `sort-grid`, `venn`, `carroll` |
| picks from options | `multiple-choice`, `circle-the-answer`, `chip-bank` |
| completes a taught method | `method-frame`, the grid helpers |
| draws or plots | `blank-surface`, `coordinate-grid`, `storyboard` |
| writes at length in a shape | `writing-frame`, `fact-file`, `speech-scene` |

If two fit, choose the one that leaves the least explaining to do.

**A frame the child fills** is `fact-file` when it is a stack of named slots. A
frame whose boxes need different heights, or one the child fills row by row, is
`recording-table` instead.

**The same frame carries all three sheets, and the fields are what change.** On
the expected sheet a field is its bare name and nothing else. The below sheet
hangs a `hint` and a `wordBank` on the fields that need one, and both are drawn
so they cannot be mistaken for the child's own writing: a starter set apart by
weight and its own line, a bank in the colour this sheet already uses for
material handed to the child. That is as much of the job as the help itself,
since a starter that reads like the child's answer is a page a teacher cannot
mark. Scaffold the child's own choice of subject rather than replacing it: the
starter finishes a sentence about the thing THEY picked. The greater depth sheet
takes the same frame again with a tighter hint or instruction line that raises
the standard, never a stretch block bolted underneath - the frame is the task,
and a second task below it says the first one was not enough.

**A picture beside a word in a word bank or on a card follows the test in
`preferences.md` → "A Picture Beside a Word".** In short: it has to BE the thing,
so a child who cannot read the word still knows what it is, and where nothing
true exists the word goes on its own rather than wearing a near-miss. An upstream
brief asking for "a small picture beside each object" is asking for that, not for
one glyph per word at any cost - so a bank where two of eight words are bare is
right, and a spiral standing in for a vacuum cleaner is not.

---

## The instruction line

About a third of the helpers take a `text`: the quiet line above the activity
that says what to do. The catalogue's example for each helper shows whether it
has one, and a `text` written onto a helper that has none is silently dropped;
where the helper cannot carry it, put an `instruction` above it in the stack.
One short line. Two is one too many at the top of a page whose room belongs
to the questions.

Leave it out when the questions speak for themselves. A line saying "Answer
these questions" above some questions is one more thing for a child to read
before starting.

---

## Labelling a block

`section-label` names the mode of work a block sits under: Practise, Apply,
Stretch. Maths uses its own words, because they are the ones already on the
board there: Fluency, Problem Solving, Going Deeper.

It marks the KIND of thinking, never the topic. "Adding pence" and "Conjunctions
practice" say what the child can already see from the questions, and spend the
one place on the page that could have said what sort of work this is.

Put it at the top of a `stack`, above the block it names.

**One heading per block.** Several helpers carry their own title (a fact file, a
method frame, a data table's caption), and a section label directly above one of
those prints two headings the same size in the same colour, one under the other.
Use the helper's own title and leave the label off, or label the block and leave
the helper's title out.

---

## One answer format per question

Pick one. A bordered box AND writing lines AND a blank space is three
invitations to answer in the same question, and a child will use the wrong one
and be marked as if they chose badly.

`questions` already carries its own short answer space. Putting `written-answers`
beside it for the same question gives two.

---

## When one question is several things

A diagram, a prompt and somewhere to write is ONE numbered question, and no
arrangement of zones makes it three. Use `stack` (one above another) or `row`
(side by side) inside the zone.

Do not reach for them when two short things could simply be two numbered
questions. Composing is for a question that is genuinely multi-part.

---

## Portrait first

Try portrait. Go landscape when the content genuinely needs the width - a wide
diagram, a match-up with long labels, a timeline - and not to rescue a page that
is over-full. Orientation is per sheet, so a landscape sort can sit in the same
file as portrait questions.

---

## A photograph, when it has to share a page

`label-diagram` is the only helper whose photograph is the activity itself, and
it comes in two forms. (A word bank and a card row take small pictures too, but
a thumbnail beside a word costs almost nothing; this section is about a
photograph the child works from.) They cost very different amounts of page, and picking the wrong one is
what turns a buildable picture-led sheet into an unbuildable one.

**Words round the picture.** Each part's name is written on a line beside the
photograph. The line has to be long enough for a child to write the word on, and
the picture has to survive a band of those lines down each side, so a diagram
naming a "flower head" needs about **99mm across and 139mm down** - half a page.
Reach for it when the photograph carries the sheet: one big picture, labelled
properly, and the questions beside or beneath it. Two of these are a page's
ceiling; a third never fits.

**Numbers on the picture.** The dots carry printed numbers and the naming happens
in a list beside or below. A number needs almost no line, so the same photograph
comes down to about **84mm by 103mm**, and three photograph-and-list pairs fit
one page. Write the labels as `"1"`, `"2"`, `"3"` with `given: true` so the
numbers actually print: left blank they draw a write-on line instead, and a child
looking at unnumbered dots cannot tell which one row 3 of the list is asking
about. The drawing already renumbers its dots into reading order, so the list
runs 1, 2, 3 down the page.

**This is not a compromise.** Numbering the parts and answering in a list is how
most published science sheets do this, and it is the form to reach for the moment
a sheet carries more than two photographs. Three separate photographs is the
ceiling even numbered, and past that no arrangement of zones exists that
holds them — so the answer is fewer pictures, or several parts numbered on one
picture rather than one part each on several.

These sizes and ceilings are pinned by `test/photo-costing.test.js` in the
worksheet engine: when a change to the engine moves them, that test fails and
names this file, so the numbers here are current rather than remembered.

**Widening a zone does not help a photograph.** A picture is scaled by its width
and its height follows, so a wider zone holds a TALLER picture and the page total
grows. That is why "too narrow" on a picture-led sheet usually means one picture
too many rather than the wrong shape.

---

## Questions are copied, never rewritten

Every question already exists upstream, in `lesson-design.json` or
`adaptation.md`. Copy the text exactly. Do not paraphrase it, renumber it,
re-pitch a number or tidy a prompt on the way past.

If something upstream looks wrong, say so in `notes`. Do not fix it silently:
the sheet then disagrees with the board, and nobody finds out until a child does.

---

## When nothing fits

The worksheet-designer's rule 9 owns this decision; the short of it is **change
how a question is asked, never whether**. Compose from existing helpers first
(the catalogue is bigger than its names suggest), then keep the question's
words and ask it plainer, and only a question that cannot be asked honestly at
all goes in `notes` as a named gap. Never bend the nearest helper into a shape
it does not draw: a page that looks finished and is wrong is the failure this
engine exists to refuse.

Flagged gaps are how helpers get built. The newest arrived because seven
published worksheets went in front of this engine, none could be built, and
every flag named the same missing thing. All seven build now.
