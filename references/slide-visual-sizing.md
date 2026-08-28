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

## The readable floors

Each visual helper has an empirically-tested minimum below which children stop being able to read it from across the room (the "Minimum useful size" notes in §4 of `templates.md` carry the full set). Multiply your item count by the helper's minimum on the zone's *short* axis: if it exceeds what the zone has, you have outgrown the template. Pick a template with a bigger zone, or split across slides — but **never reduce the count of helpers the lesson-designer specified to make geometry fit.** Content count is set upstream and stays whole.

The floors for the helpers that get crammed into rows most often:

- `clock`: 2.0″ square, and it binds on both axes — 3 across = ~6″ wide zone (4 = ~8″, 6 = ~12″), *and* each stacked row needs ~2.0″ of height before its heading
- `numberline`: 3.5″ wide
- `place-value-chart`: very tolerant — ~2.0″ wide with 4 columns is still readable
- `part-whole-model`: 1.4″ square
- `pyramid`: 2.0″ square if empty, 2.8″ square if cells carry text
- `table`: 5.5″ wide for sentence-length cells, 3.0″ for digit-only cells
- `money` single coin (focal): 1.0″ square, no upper cap when alone
- `money` mixed strip: 6.0″ wide for a typical coin set

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
