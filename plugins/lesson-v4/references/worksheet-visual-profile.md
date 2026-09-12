# Worksheet visual profile

This is the teacher's stable visual-judgement layer for the printed sheet, the
paper counterpart of `teacher-slide-visual-profile.md`. It says what a good
working surface looks like and where the line between meaning and presentation
falls. It never reopens the pedagogy: when it disagrees with a settled design
decision, the design decision wins and the disagreement is reported.

## The one thing this file is for

**A worksheet is a working surface for its subject, and it should look like
one.** The representations, the response spaces and the visual hierarchy should
express what children are actually doing. A page whose mathematics, sources,
map or apparatus have been flattened into prose and answer lines has lost
something real, however correct every word on it is.

This is not a demand for decoration, a number of diagrams per sheet, a
different helper on every question, or less writing everywhere. Plenty of good
sheets are mostly words: a comprehension is text-led because reading is the
work, and an extended piece of writing wants ruled lines and room to think. The
failure is the other one - a task with a relationship at the heart of it,
rendered as a question and a blank because that was the shortest route.

## The look this is against

Named plainly, because "premium" says what to reach for and not what to avoid,
and every sheet that has missed the mark has missed it in one of these ways:

- **Boxes bigger than the answers they hold.** A blank rectangle taking a third
  of a page under a heading; a 30mm row waiting for one four-digit number.
- **A page composed around a photograph's file** rather than around the object
  a child is being asked to look at.
- **Page furniture competing with the work.** A titled header band and a
  bordered code badge across the top of every sheet, saying what the child
  already knows; a question number set in a tinted chip with a rule down its
  side, making the loudest mark in the question the part that only says where
  you are. Both were real, and both are gone.
- **Furniture standing in for a task.** Two drawn figures and two speech
  bubbles where the work is one claim and an explanation of whether it holds.

None of those is a pedagogical fault and none is repaired by changing the
questions. They are what the page does with work that was already right.

## The positive example

On 6 September 2026 the teacher was shown two versions of the same Year 4
partitioning worksheets. One tidied the spacing around the questions. The other
made the mathematics into the page. He approved the second one, in those words:
*"Yes that looks incredible and premium."*

The original approval PDF was drawn by a standalone script and is retained as
provenance, not as an unavailable dependency. The repository now carries two
compact, buildable calibration fixtures made through the production HTML/SVG
engine:

- `worksheet-html/fixtures/visual-product-compare-numbers.json`
- `worksheet-html/fixtures/visual-product-number-lines.json`

They generalise the approved visual language: a restrained section surface,
consistent numbered-task emphasis, nested representations around one response,
and deliberate panel hierarchy. They are calibration examples, not templates to
copy literally. Their page furniture is not: they were built when a sheet still
carried a titled header band and a bordered sheet-code badge, and both have
since gone (`worksheet-helpers.md` -> The sheets). Judge the work on the page,
not the frame round it.

`worksheet-html/fixtures/maths-partition-four-digit-numbers.json` is this
engine's build of the same tasks, and it is a development fixture rather than a
second copy of the approval. It carries every task, value, case and response
target, and it does not carry the reference band from the foot of the approved
page: that band costs 69mm the work has already spent, and the fixture's `notes`
says so. Judge against the approved PDF; use the fixture to see what this engine
can currently draw and where it falls short.

Four things changed between the original worksheets and the approved ones, and
each is a move worth reusing:

- **A number to partition became a whole joined to four empty parts.** The
  additive relationship is the response surface. The child writes into the
  relationship rather than beside a copy of the number.
- **Mixed-order summands became separate tiles with a digit frame at the end.**
  Composition is visible without being done. `9 + 4,000 + 50 + 200` typed into
  a prompt is four values to pick out of a sentence first.
- **Two claims to judge became two matched panels, each with the counters that
  depict its right-hand side and its own room to explain.** The cases are
  separated, the evidence is attached to the case it serves, and nothing on the
  page says which is right.
- **Six generic writing lines became a blank record with a column for the
  number and a column for its expansion.** The findings stay comparable without
  the sheet supplying a search strategy.

**What generalises is the relationship between the subject and the surface**,
along with crisp vector construction, consistent alignment, light boundaries,
restrained hierarchy, evidence sitting next to the response it feeds, and the
same standard of finish across all three sheets. What does not generalise is
that page: not four nodes, not six rows, not a footer, not two columns, and not
a rule that partitioning must always show explicit zeros.

**A development build is not an approval.** Using the same tasks and the same
helper families does not make a rebuild the thing the teacher said yes to. Where
a build departs from the approved artefact - a support moved, a size floor
respected, a layout chosen differently - say so in `notes`, at the top level of
the document where the builder prints it, and treat the departure as a decision
someone still has to make rather than as the new standard.

## The boundary that matters most

**Never improve the appearance of a page by taking work off it.** The
investigation stays. The third activity stays. The explanation space stays.
When a redesign will not fit, the redesign is what gives way.

The same line runs the other way. A visual pass must not quietly ADD
scaffolding either: a zero already filled in, a counter that settles a claim,
a row count that announces how many solutions there are, a heading that
classifies a source before the child does. Every one of those turns an unaided
question into a supported one, and that is a decision for the Lesson Designer
or Adaptation Designer to make on purpose, before the content is frozen.

So the ownership is:

| Who | Decides |
|---|---|
| Lesson Designer | Which relationship the child meets, which representation carries it, what is given and what stays blank |
| Adaptation Designer | The same, for each variant, and what support changes with it |
| Design Reviewer | Whether the chosen representation still leaves the intended thinking to the child |
| Worksheet Designer | Which helpers realise those decisions, and how the page is composed around them |
| The engine | Accurate drawing, honest sizing, refusal when something will not fit |
| Final resource review | Whether the delivered page actually works at print size |

## Given and blank are different states, and they must stay different

A value handed to the child prints in the given colour. A place the child
writes stays empty. The two are never the same mark, and no helper may turn one
into the other.

**A zero is where this goes wrong.** `6,007` has zero hundreds and zero tens,
and those zeros are the entire question. A given zero is a printed `0`; a blank
is an empty box. Anything that reads a value for truthiness collapses them, and
the sheet then either hands the child two of its four answers or refuses to
print a zero the design asked for. The helpers that carry values state which
they are and refuse a node that says neither.

## Sizing comes from the answer, not from the page

A four-digit number, a four-term expression and a written explanation are three
different spaces. There is no universal answer-line length.

**Space stops paying off, and everything on a page has a point where it does.**
A ruled line reaches its useful height and passes it. A box for one four-digit
number reaches its useful height sooner: a child writes four digits in it and a
taller box holds the same four digits with more paper round them. A surface a
child draws on stops later, because more room is more drawing - but "later" is
not "never", and reading it as never is how a balanced-diet sheet shipped with a
209mm blank rectangle taking most of the page. Every helper in this engine now
states where its own gain runs out (`enough`), a zone stops there, and a page
that ends early ends at the FOOT, where a teacher trims it.

That is the difference between a generous page and a padded one, and it is
usually what somebody means when they say a sheet looks generated. Big empty
rectangles are not generosity: they are the page's arithmetic showing through.

Spare room goes to whatever is still gaining from it, and what is left over is
paper, not an excuse for two enormous boxes and tiny type elsewhere.

**A picture narrower than its zone is an invitation, not a frame.** A photograph
is drawn at the width its own proportions allow, so a landscape picture given a
full-width row uses about a quarter of it. The engine no longer rules a box round
the empty part - a card carrying nothing but a picture is as wide as the picture
- but the room is still there, and it is the designer's to use. Put the question
beside the picture, or the picture beside the response it feeds. Deadspace is
only earned where the child writes in it: the leader lines of a labelled diagram
need their band, and a drawing box is all response.

**A picture's file is not a design decision either.** Photographs arrive at
whatever size and shape the photographer framed, and letting each one print at
its full canvas hands the page's proportions to a stranger: two dolls a child
was asked to compare came out 132.6mm and 79.1mm tall because one had been shot
further back. Sources a child compares are drawn to one height at their own true
proportions. Where the difference in size IS the evidence, say so
(`imageFit: "canvas"`); where a photograph carries canvas that is not evidence,
`crop` trims it. Neither is a licence to stretch a source or to edit one.

Where a measurement is the task - a ruler, a coordinate grid - true scale is not
negotiable. A schematic whole-part node is the opposite case: its boxes are
symbols, and their widths must not suggest magnitude. A bar model is a bar
model and keeps its own proportions.

## Draw it, never generate a picture of it

Mathematics, apparatus, circuit symbols, table headings, counters, scales and
answer blanks are drawn by the engine as HTML and SVG. Image generation is for
photographs and authentic evidence through the existing picture route, and it
never renders an equation, a label or a place to write.

**A callout on a picture a child works from is a label.** Letters, numbers and
names pointing at parts are drawn by `label-diagram` over a plain picture, not
generated into the picture, and a worksheet's picture contract asks for the
picture without them. A generated callout cannot be moved onto the feature it
names, cannot be turned into a line the child writes on, and fixes the task to
one form before anyone has chosen it: a Year 4 tooth cutaway arrived with A, B
and C drawn in, so the only sheet that picture could produce was a lettered
diagram and a list of blanks underneath, on a page with half of itself empty.
`shared.md` has the choice the sheet should have been making instead.

## Print scale is the test, not the screen

Judge a delivered page at the size it prints, with the production font loaded,
and check it in greyscale. Nothing a child has to do may depend on telling two
colours apart: a denomination, a source, a label or a correct case that only
reads in colour does not read at all on the photocopier the class actually uses.

Small type is paid for in page width, not in cleverness. This engine grows a
drawing until its smallest label reaches note size, so a caption set as small
as a commercial worksheet's costs the page more room than it saves. Where the
approved reference sets something smaller than the design system allows, the
design system wins and the page is composed around it.

## When a cosmetic improvement cannot be made

Separate an unusable resource from an unfinished-looking one. A clipped zone, a
missing source or a response with nowhere to go is blocking. A page that is
merely plainer than hoped is not: keep the last valid version, say precisely
what could not be improved, and never buy the improvement by cutting work,
shrinking a response below a usable size, or invoking a fit-priority removal
that the tightness was not actually forcing.
