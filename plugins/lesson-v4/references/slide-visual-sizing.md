# Sizing and Laying Out a Visual

Read this whenever a slide carries a picture, a diagram, or a set of drawn helpers — which is most slides in most lessons.

One principle runs through everything here: **a visual children work from has to be readable from the back of the room, because that reading is the work.** Being present on the slide is not enough. Everything below is the geometry that principle runs into.

---

## The hero rule

**A central visual is the hero of its slide, so size it to be read, then arrange the rest around it.** This covers photographs and maps exactly as it covers drawn figures: a map children find countries on, a photograph they list features from, and a labelled river diagram are all the subject of their slide. A map is if anything the more demanding case, since a child has to pick out a border or a river winding through it rather than take in one bold shape. Treat "is this the thing children are working from?" as the test, not whether the engine drew it.

The recurring failure is letting supporting furniture crowd the diagram small: a single takeaway sentence handed a fat 30% zone while the diagram is squeezed into what's left, or a diagram dropped into a template's thumbnail-sized slot (the slim statement strip of a speech-bubble template) where it renders too small to use.

So choose the template whose largest zone matches the diagram's shape, give that zone to the diagram, and place a one-line takeaway in a slim band or in the margin the diagram's own proportions already leave over — never in a zone carved out of the diagram's room. A wide diagram (a Venn is about 1.4 times as wide as it is tall) fills a wide zone and naturally leaves side margins where a short supporting line sits happily.

**The test:** a child glancing at the slide lands on the diagram first, at a size they can actually read.

---

## Importance decides size too

A photo's `essential` flag (carried from `photo-requirements.json`) shapes the layout, not just whether the photo is fetched.

**Size a visual to how much it matters, not to the template's default proportions or a wish to fill space.** A nice-to-have photo is low-importance context, so it earns a small place — a slim side zone (an 80/20 split) or a corner inset — while the important content (the question, the task, the success criteria) takes the width. A photo of the real setting (pots of water on a windowsill) enriches the slide but is not the lesson, so it belongs in a corner, not across half the room. That holds whether or not the photo can be sourced: the hero element earns the space on its own merit.

Reserve image-dependent layouts — a photo filling one half of a split — for must-have photos children actually work from, and choose a template that reads well as text on its own when the photo is only an enhancement, so a slide whose photo could not be sourced still looks deliberate rather than holed.

---

## Which axis binds

**Multiple load-bearing items use the orientation that protects the smallest important item.** Before choosing `row` or `stack`, picture the actual items at their real aspect ratios in both arrangements. Compare the smallest load-bearing item each arrangement produces and choose the orientation that keeps that item larger and more usable from the back of the room. The zone's long axis is a tiebreaker only when both arrangements protect the important items equally well. A wide zone does not justify a row when splitting its width turns a photograph, diagram or reference into a thumbnail; a stack may use that same wide zone better by giving each item the full width. A tall narrow zone still normally favours `stack` because a row would hand each item a thin slice.

**Many same-shaped visuals want a grid, not one long line.** A single `row` of five or six shapes (a "count the lines of symmetry on these" Your Turn) hands each shape one narrow column, so every shape sizes down to that width and a broad band of the zone is left empty on the other axis — small shapes adrift in deadspace. When a set of visuals only needs to be *seen and worked on* rather than read left-to-right as a sequence, lay them out as a grid (a `stack` of `row`s, roughly three per row) so each shape claims a wider cell and the set fills the zone top to bottom.

**This bites hardest on photographs, because a photo can only grow as far as the narrower of its two constraints.** A photo keeps its own proportions, so four landscape photographs in one `row` each get a quarter of the width, bind on that width, and render as a thin strip with most of the zone's height empty below them — the picture children are meant to study ends up the smallest thing on the slide. Four photos belong in a 2 by 2 (`grid-4`, or a `stack` of two `row`s), which roughly doubles the width each claims and uses the height a single row wastes. Three or more pictures in one zone is the signal to picture the grid before reaching for a row.

**The exception is a set whose *sequence* is the point** — a timeline, a process in order, before-and-after — where reading left to right matters more than size and a row is right. A set of parallel examples children compare, like four biomes, has no reading order to protect.

**Choose the template by the shape of the picture as well as the count.** Zone shape and image shape multiply: a tall zone given a wide photo, or a wide zone given a portrait one, leaves bands of empty slide on the axis that doesn't bind, and the photo reads small however generous the zone looked on paper. Picture the actual photo in the actual zone and ask which axis binds before settling a template.

---

## A picture's shape is not yours to choose

Every other visual on a slide is drawn to order: a Venn is 1.4 times as wide as
it is tall because the engine draws it that way. A sourced photograph is not.
The picture stage asks for a composition and takes the best real photograph it
can find, so the kettle may arrive landscape and the hand whisk almost square,
and no earlier decision can make them match.

A photograph keeps its own proportions, so it grows only until it meets the
**nearer** edge of its cell. That makes the cell's short side, not its area, the
size the cell can promise: a 6.3″ by 1.3″ cell looks generous and gives a square
photograph 1.3″. Size a picture cell by asking **"if a square photograph turns
up here, is it still readable from the back of the room?"** If the answer is no,
the cell is too small however wide it looks.

**That square question is the floor a cell can promise, not the size the picture
will be.** It is the right question before the photograph exists, because its
shape is not yours to choose. Once the file arrives its shape is known, and a
contained picture leaves the spare room on one axis empty: a 400 by 332
classroom photograph in a 3.5″ square cell reserves 3.26″ and draws 3.26″ by
2.71″, which is under the 3.0″ a lone working picture needs. The build measures
the rectangle it actually put on the slide, so a cell that passed the square
question can still be named once the photograph lands, and the message then
quotes the drawn size and the picture's pixel dimensions rather than the cell's.
When a picture has to be the hero of its slide, spend the axis its subject runs
along: a landscape photograph needs the floor multiplied by how many times wider
than tall it is, a portrait one the same on height. A wide landscape cannot be a
3″ hero in a cell narrower than 8″, and that is a template decision rather than
a nudge.

This is why four pictures belong in a 2 by 2 rather than a row, and why a picture
grid squeezed between a statement bar above and a conclusion bar below is usually
the wrong shape: each of those decisions spends the axis the photograph needs.
Give the pictures the height, and put the sentences in slim bands or on their own
slide.

**Read which axis is short before choosing the repair.** Only one of the
available fixes can move a given case, and the other reads just as plausible.
Pictures in a shallow band are stopped by height: taking one out of the row
widens the survivors and leaves the short side exactly where it was, and so does
swapping the row for a grid. Pictures in a long row across a deep zone are
stopped by width: a taller zone does nothing, and the grid is the whole answer.
When height is short and the pictures carry captions, the caption band is the
biggest single lever on the slide — it costs the picture just over half an inch
of its own short side, so a label the task does not need is half an inch back for
free, while a label children read to do the task is a reason to find the height
elsewhere. When both axes are short, no rearrangement inside that cell reaches
the floor and the honest repair is a different template or the beat split across
two slides. The build's own message names the binding axis, the shortfall in
inches and the caption's cost, so read it rather than guessing and measuring
again.

**Pictures still being sourced show this honestly.** A picture that has not
arrived draws as a grey square at exactly the size its cell guarantees, so a
preview taken mid-run shows the same cramped composition the finished deck will.
A placeholder that looks small IS small. The one thing it cannot show is the
crop and framing of the photograph itself.

**A picture that is meant to be small says so.** `essential: false` marks a photo
as supporting context rather than something children work from, and takes it out
of this floor entirely, which is the right answer for a corner inset of the real
setting. It is not the right answer for a picture a task depends on: marking a
load-bearing photo non-essential to quiet the check leaves the lesson with a hole
in it, because an unsourced non-essential picture is dropped silently.

---

## Room is shared out by what things can use, not by counting them

**The engine moves unused room to whatever will read better for having it, so compose by what each part is for and let the sizing settle itself.** A success-criteria panel gives a wrapping sticky line more height than a one-line step. A stack takes back what a hugging item does not use. A row narrows a helper that has stopped growing and widens the ones that have not. A template hands the task the height its diagram will not use, so a slide with a small figure prints its question larger rather than leaving a band of nothing under it.

Two things follow for you.

**Do not hand-tune a size to compensate for a layout that looks wrong.** A `fontSize` picked by eye to suit today's arrangement is a number that stops being right the moment anything beside it changes, and it silently opts that element out of every mechanism above. Compose the slide honestly and let the measured sizing do its work; where the result is still wrong, the fault is in the sizing and wants fixing there, for every lesson, rather than papered over in one spec.

**When a slide does come out with a band of nothing on it, suspect room shared out by count.** That is the shape every one of these faults had: a panel splitting its height equally between lines of very different lengths, a container keeping a share it could not use because nothing had asked it what it wanted, a row giving equal widths to a wide chart and a small ring. Ask which part of the composition was given room on the basis of how many things there were rather than what those things can do with it, and fix it there. `references/build-review-log.md` carries the worked cases.

---

## The readable floors

Each visual helper has an empirically-tested minimum below which children stop being able to read it from across the room (the "Minimum useful size" notes in §4 of `templates.md` carry the full set). Multiply your item count by the helper's minimum on the zone's *short* axis: if it exceeds what the zone has, you have outgrown the template. Pick a template with a bigger zone, or split across slides — but **never reduce the count of helpers the lesson-designer specified to make geometry fit.** Content count is set upstream and stays whole.

The floors for the helpers that get crammed into rows most often:

- `clock`: 2.0″ square, and it binds on both axes — 3 across = ~6″ wide zone (4 = ~8″, 6 = ~12″), *and* each stacked row needs ~2.0″ of height before its heading
- `numberline`: 3.5″ wide, and **at most three stacked lines** - a fourth is refused by name, because each extra line comes out of the size of the numerals on all of them
- `place-value-chart`: the digits are very tolerant — ~2.0″ wide with 4 columns is still readable — but the **headings** are what bind. A column name is one word with nowhere to break, so a column narrower than its own heading gets that heading shrunk to fit (the build does this rather than letting PowerPoint split "Thousands" mid-word and clip it). Full words need about 1.0″ of column to read from the back, so a four-column **Thousands / Hundreds / Tens / Ones** chart wants ~4.0″ of width, and **two** is the most a body zone holds side by side. Three want stacking, which also gives the counters the width a row denies them. Abbreviated headings (`Th H T O`) are back at the 2.0″ figure
- `part-whole-model`: **the floor depends on the numbers in it, not on the helper.** 1.4″ square is right for single digits; a circle has only its inscribed width for one line of text, so four-digit labels need roughly 2.4″ × 2.5″ upright, or 2.4″ × 1.9″ lying on its side. The build measures the real labels and **refuses the zone by name** (`PART_WHOLE_MODEL_DOES_NOT_FIT`) with the size it needs, because a flat figure here let a Year 4 slide print "3,000" in a 0.39″ circle, where it wrapped to "3,00" over "0". A wide, shallow band is the shape that causes this: an upright model cuts its circles from the HEIGHT, so eight inches of width buys nothing. Lay it on its side (`"orientation": "horizontal"`) or give it more of the stack
- `pyramid`: 2.0″ square if empty, 2.8″ square if cells carry text
- `table`: 5.5″ wide for sentence-length cells, 3.0″ for digit-only cells, **and 0.74″ of height for the header band plus 0.2″ for every row**, so a two-row table needs a 1.15″ zone, a four-row table 1.55″, before any cell wraps onto a second line. A row shorter than that cannot show even `(1)` at a size a child can read, and the build refuses the zone by name rather than printing it
- `money` single coin (focal): 1.0″ square, no upper cap when alone
- `money` mixed strip: 6.0″ wide for a typical coin set
- a photograph or sourced picture children work FROM: 1.6″ on the cell's **short** side as the base, because that is all a picture of unknown shape is guaranteed (see "A picture's shape is not yours to choose" below), and the floor climbs with how few such pictures share the slide, because one picture alone on a slide is the thing children are looking at while they work. **Alone on the slide: 3.0″. One of a pair: 2.2″. One of three or more: 1.6″.** A single classroom photograph a task said to "look closely" at once shipped at 2″ beside an empty table and a 5″ square of blank slide, and a flat 1.6″ floor passed it. The build names a required picture that falls below its tier and says which tier it is in, and the slide-design check refuses to promote a candidate that carries one (`PICTURE_BELOW_READABLE_FLOOR`), because a warning was read past once and a two-inch photograph reached a class. An `essential: false` picture is out of the check and out of the count, and so is a class character portrait (Mr Sear, Miss Brooker or Bailey from the engine's own drawings), because children read what the character says, not the face; a picture in a vocabulary card or a template's `supports` row is supporting by definition and keeps the 1.6″ base

---

## Stacked rows: the budget is two-dimensional

The floors above read as widths, which is the whole story for one row across a zone. But a question built *from* a helper is itself a row of helpers — a "tick the clock" question is a time-phrase plus a row of clock options, and "circle the right shape" or "which bar shows ⅗" work the same way. Stacking several such questions down a zone makes a *grid*, and the binding constraint becomes vertical. It is the one most easily missed, because each row passes the width check on its own.

Read the height budget directly: **rows × (helper floor + its heading) ≤ zone height.**

A ~6.5″ left zone (a 70/30 or 60/40 split) holds about **two** rows of clocks at the 2.0″ floor once each row carries a one-line heading. A third row drives every clock below the floor, and a child can no longer read the hands from across the room, which empties a recognition task of its point.

**Let the helper claim the height, not its caption.** A one-line heading above a clock row belongs in a thin band — give it a small stack `weight` (heading `0.35` against the clock row's `1`) — so the clocks keep the lion's share instead of the default equal split handing a single line of text as much vertical room as the whole row.

This carries to any stacked rows of visual helpers — clocks, shapes, fraction bars, money strips — wherever they sit: starters, Your Turns, Apply.

---

## When necessary content will not fit: split, don't shrink or delete

Cramming can come from visual count, text, a source, success criteria, a reference tool or a combination of necessary elements. First choose the most suitable template and layout. When the complete coherent move still cannot remain readable and usable, split it across enough related slides that every necessary element keeps the room it needs. This applies to any slide type, not only Your Turn.

Preserve the worthwhile content approved upstream; do not reduce the question count or remove a useful representation merely to make one slide look cleaner. Each split question slide gets its matching answer slide. Add no timer or pacing instruction unless the teacher supplied or requested one.
