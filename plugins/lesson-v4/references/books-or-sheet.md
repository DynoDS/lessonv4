# Books or Sheet

The worksheet designer reads this when setting each sheet's `recording`, after
the sheet's content is settled. It decides one thing: whether a class could do
this sheet in their exercise books, from its question slip or the board.

## Why the choice exists

The teacher's school asked staff to use less paper. A sheet
the class can do in books needs no copy per child. So every sheet says
`"books"` or `"sheet"`, prints a small book or pencil beside its level code, and
a books sheet prints as a page of question slips in its place in the file: the
same questions with the answer room taken out, half a page wide, several to a
page, for children to stick in and answer underneath. The slip is what lets
someone monitoring books see what was asked.

The mark decides what prints: a books sheet prints its slips and not the sheet,
because printing both spent the paper the mark was there to save (the teacher,
29 September 2026). It changes nothing about what the sheet asks. Never change a
question, its response form, its support or its visual to earn `"books"`: a sheet
where the maths is on the page (an empty part-whole model to fill, a claim with
the counters that depict it) is a good sheet and is honestly marked `"sheet"`.

## The test

Ask of every question on the sheet:

> Could a child this age make whatever they need in their book quickly and
> accurately enough that the thinking is still the task, and does the book version
> still ask the same thing?

Writing *about* something passes: the child reads the picture, number line, table
or source from the slip or the board and writes. Working *on* something fails: the child
has to mark, label, circle, plot or fill in the printed thing itself.

**A blank is not the same as a page.** A digit box in `2,_80`, a gap in a short
sentence, a missing number in a calculation: all of these are copied into a book
in seconds, with the blank, and the question still asks the same thing. What
makes a sheet `"sheet"` is a printed thing the child cannot reproduce - a
photograph, a map, a grid, a scale where exact placement is the point - or a
copying cost that would swallow the lesson. Daniel's ruling on the Year 4
nearest-1,000 Greater Depth sheet, 19 September 2026: one digit box does not
make a write-on sheet.

**Room to answer is what a book is.** A `response` upstream that says where the
answers go - handwriting lines, an open working area, space to try numerals and
list what you find, boxes for a search - describes answer room. The book
supplies that room, and the slip is the same question with it taken out, so it
never makes a sheet on its own. Neither does a speech bubble, a claim or a
reference the child reads before writing: it prints on the slip and is read
there. Greater Depth is where this goes wrong: a finite search and a
counterexample, each answered with a list or an explanation, were marked
`"sheet"` on four Year 4 maths lessons in a row because their answer room was
described as a printed working area. A sheet needs something printed that the
child works *on*.

**Say why, either way.** Every sheet carries `"recordingReason"`: one line saying
why this whole sheet is better that way. For `"sheet"`, name the question that
needs the page and what the child does to it - `"Q4: the child labels the printed
photograph"`, `"Q2: the child plots the reading on the printed grid"`. For
`"books"`, say what makes every question answerable in a book - `"Every
answer is a number, an explanation, or a line the children rule for themselves"`.
Going to look for a question that needs the page is the test, and either mark can
be reached without running it, so the line is what tells a decision from a
default. It is a report, not a defence: a sheet that genuinely needs the page is
a good sheet, and changing a question to reach either mark is the only way this
field makes a worksheet worse.

**The whole sheet is `"books"` only when every question passes.** One question
that needs the page makes the sheet `"sheet"`. A half-and-half sheet saves no
paper, because every child still needs a printed copy for the half that needs it,
and it adds trimming the teacher has to do. Each level (Below, Expected, Greater
Depth) is decided on its own sheet and often differs: a Below sheet with a partly
filled model is `"sheet"` while the Expected calculations beside it are `"books"`.

## What children can make in their books, by age

The same activity changes with age and with the size of what must be drawn. This
is a starting judgement, not a lookup: a question's own demands can move it.

| Activity | Years 1-2 | Years 3-4 | Years 5-6 |
|---|---|---|---|
| A number or word answer | Year 1 sheet; Year 2 books for a short list | books | books |
| A sentence or explanation in their own words | books, when the question need not be copied out | books | books |
| Pick an option (writing the letter or word instead of circling) | sheet | books | books |
| Put things in order (writing the order) | sheet | books when the items are short or lettered | books |
| Match (writing the pairs) | sheet | books when both sets are lettered or numbered | books |
| Sort into groups (drawing their own columns) | sheet | books for two groups of short items | books |
| Finish a sentence stem | sheet | books when the stem is a few words | books |
| Fix a wrong example | sheet | books for a calculation; sheet for a passage | books unless the passage is long |
| A simple number line (few steps, ends given, rough placement) | sheet | books | books |
| A small table (two columns, a few rows) | sheet | books in a squared maths book | books |
| A part-whole or bar model | sheet | books | books |
| A written column method | sheet | books | books |
| A drawing or diagram the child invents | books | books | books |

Always `"sheet"`, at any age: labelling a photograph or detailed drawing, marking
on a map or a source, plotting on a grid, measuring a printed shape or angle, a
larger table, and any scale where exact placement is the point (a line in steps of
250 on which 4,350 must be marked). A hand-ruled copy would put the child's ruling
errors into the answer.

Younger children pay far more for copying: a Year 2 child copying out a question
spends the lesson on handwriting. When a younger class would have to copy much of
the question to answer it, that is a reason for `"sheet"`.

## Figures the children draw for themselves: `"onSlip": false`

A books sheet can still print a figure. The slip keeps what the sheet prints
apart from two things it takes out for itself: the room for answers, and
anything marked `"onSlip": false`. Success criteria are on neither: they stay on
the board.

When the children will draw a figure for themselves in their books (a Year 4
class ruling its own 0 to 100 number line), mark that figure `"onSlip": false`,
so the slip leaves it off. Printed, it would double the slip's height and halve
the paper saved, and the child would work on the slip instead of drawing it.
Leave unmarked any figure a child reads from: a photograph, a source, a data
table, a number line whose value they read off.

## Slips are half a page wide

A slip is stuck into an exercise book, so it is half an A4 page wide: a
full-width strip is as wide as the page it goes on and saves the book nothing.
The slip redraws what it can to fit (a method frame puts its labels above its
boxes); a figure that still needs more than half a page cannot go on one, and
the preflight names it as `SLIP_TOO_WIDE`.

That is a question for you, not a verdict. Holding a wide figure is not by
itself a reason for `"sheet"`: ask what the child does with it. A figure the
children draw or copy for themselves in their books is marked `"onSlip": false`.
A figure the child works on, or one that has to be in front of them and cannot
be read any smaller, makes the sheet `"sheet"`. Never reword or cut a question
to make it fit. A books sheet whose slips still cannot be made prints as the
sheet instead, so the class always gets something.

## What the build checks

The preflight refuses a sheet with no `recordingReason` as
`RECORDING_REASON_MISSING`. The build never withholds a worksheet over it; it
prints a `RECORDING:` line per level saying what that level costs in paper and
why, so a choice nobody made is visible in the run rather than silent.

Wording on a `"books"` sheet that looks as if it needs the printed page ("Circle...",
"Mark it on the line", "Fill in the table") is a prompt to look again, not a
verdict: the preflight prints `RECORDING_LOOK_AGAIN`, naming the words and the
question. Words about a box or a gap are judged by what the sheet holds: a box
in the question's own sentence (`4,_50`), or on a sheet whose only helpers are
sentences and number sentences (questions, written answers, instructions,
number sentences, section labels), is the blank above and is never flagged; a
box on a sheet that also holds a figure (a part-whole model, a grid, a table, a
number line) is a prompt to look again.
Look at a flagged question against the test above. A printed thing the child
cannot reproduce makes the sheet `"sheet"`; when a book still does, set
`"recordingLookedAgain": true` on the sheet, which quiets the prompt, and say why
in `recordingReason`. Never reword the question, which is verbatim. Wording like
"Use the number lines to help you" is fine: in a book the child draws their own.
The build prints a flagged `"books"` sheet that does not say it was looked at
again as `"sheet"`, with `RECORDING_CHANGED`, so a books sheet nobody looked at
never prints slips asking a child to circle something they do not have.
