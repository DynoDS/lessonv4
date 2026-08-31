# Optional context pictures and relevant decoration

This reference owns two optional visual layers shared by the resource designers.
It does not own photographs, maps, diagrams or other P1 visuals that the teaching
depends on. Those stay in their existing routes.

P2 is a helpful context picture attached to a word, question, fact or example.
P3 is relevant decoration attached to the physical slide/page. P2 may carry
meaning; P3 does not. P1 always wins over both, and P2 wins over P3.

## Slide Designer read route

At Slide Designer startup, read this introduction, `The boundary`, `Where an optional picture sits on a slide`, and the whole-deck opportunity-pass rules in `Priority 2 source routes`, including `The pass writes a record, one line per slide` - the record is written as the pass goes, so reading it afterwards is reading it too late. The placement section is needed at startup rather than later because a light slide may choose its template around a P2, and by the opportunity pass that choice has already been made. Do not load request JSON, resolver publication steps or other resource surfaces at startup.

After the core slide geometry is settled, run the one whole-deck opportunity pass. If that pass selects an ordinary P2, semantic vocabulary P2 or P3 request, read `Request shape`, `How a designer searches and chooses`, the Slides part of `Timing by resource`, and the Slides line in `Surface-specific limits` before authoring or resolving it.

The Slide Designer does not read the Worksheet, Working Wall or Stick-in surface rules during a slide run.

## The boundary

An ordinary P2 context picture helps a child recognise, locate or understand the
nearby content. It remains visually connected to that content. A relevant robin
beside a robin question is P2 even though the question could technically work
without it.

P3 is different. It may make a finished resource warmer or more visual, but it
must still relate naturally to the lesson. A faint forest in the corner of a
rainforest slide may be P3. A random star, squiggle, paint blob or unrelated
object added merely because space exists is not.

Neither layer changes the lesson's teaching, becomes part of the answer, shrinks
text, reduces writing space, crowds a diagram or delays a finished resource.
Those protections are what make an optional picture safe to reach for: it cannot
cost a child anything, so the question is only ever whether it helps.

Where the two layers differ is their claim on space, and the difference is
meaning. A P2 carries meaning, so it may hold a place of its own, and on a slide
with genuine room to spare it may be weighed while the template is still being
chosen. A P3 carries none, so no template, layout or page count is ever arranged
around one: it goes where the surface is already spare. P3 stays the first thing
moved, faded, replaced or removed when anything competes.

"Competes" is physical and local. An optional picture competes when it covers,
shrinks, crowds or pulls the eye off something on its own slide or page that a
child must read or use. Judge it one surface at a time, against that surface's
spare space. What does not count as competing: the P1 visuals a deck leans on
appearing on many slides, or on this one; the drawing sharing its subject with
a P1 visual; a wish to keep the deck visually uniform around its teaching
visuals; or a worry that a decoration might be read as recommending the thing
it shows, since a P3 asserts nothing and no task asks a child to read it. A
deck anchored by one or two strong P1 references is the normal case, not a
special one: those references are why the optional layer stays quiet beside
them, never why the whole deck goes without it.

On a slide, keeping the text size does not mean keeping the original line
count. A picture may shorten the text column and make a question or fact wrap
onto an extra line when the complete set still fits comfortably at the same
font size. The nearby card may grow only by the height that wrapping genuinely
needs. If that would crowd the set or make anything smaller, remove that
individual picture instead.

On slides, optional context pictures stay visually quieter than the words. The
builder renders them at 50% transparency and sizes them from the usable height
of their own row or card while preserving their natural proportions. A picture
placed by its own frame is sized by that frame instead, at the same 50%. A wide
picture is capped before it takes essential text room; if the same-size wording
still cannot fit, that individual picture closes up. This treatment belongs
only to the optional picture layer. Do not fade a photograph, map, diagram or
other visual that carries the teaching. Printed resources also keep enough
contrast to survive ordinary classroom printing rather than inheriting the
slide transparency automatically.

## Where an optional picture sits on a slide

A picture beside the words is the ordinary case and the first to reach for: the
text column narrows, the words rewrap around it, and the picture stays visually
connected to the content it supports.

A P2 may also hold a place of its own. Use that when the slide is genuinely
light, meaning the teaching content already has everything it needs at full
readable size and what is left over is real slide rather than the margin a
diagram's own proportions happen to leave. A relevant drawing there does quietly
what a photograph would do, and reads as chosen rather than as filler.

This is the one point where an optional picture may affect the template. On a
light slide, decide whether a P2 belongs before the template is settled, and pick
one whose shape leaves it somewhere to sit. What this prevents is the common
shape of the miss: three settled pieces of content take a three-part template,
the geometry closes, and a picture that would genuinely have helped has nowhere
left to go. The freedom carries the same check a nice-to-have photograph gets,
because the drawing is searched for later and may not exist: choose a template
that still looks finished as text on its own, so a slide whose picture never
arrives reads as deliberate rather than holed.

A P3 never gets a place made for it, because it carries no meaning to justify
one. It goes where the slide is already spare: behind a text card, straddling a
card's edge, tucked into a corner of the slide, or resting in the margin a card's
shape already leaves. Overlapping content is normal and usually reads better than
floating in open space, because it ties the drawing into the composition instead
of leaving it adrift. Use `layer: "low"` to sit behind a card and `layer: "high"`
to rest on top of one. Overlapping must never cover a word, a number, a table
cell or any part of a figure a child reads.

Size a free-standing optional picture for its job: small enough that the eye
still lands on the teaching first, large enough to read as a drawing rather than
a smudge. Several small ones can share a slide when they share a style and sit
around the edges of the composition. What fails is a scatter of unrelated marks,
which reads as clutter however relevant each one is on its own.

---

The lesson-designer makes no decision about this layer and writes no request for
it. Each visual designer works from the pedagogy already settled upstream and
decides whether its own surface has a comfortable optional picture place.

P2 and P3 are outside the lesson's 16 required Image Team picture-request
ceiling. That ceiling counts only required picture objects promoted through
`photo-requirements.json` into the real-photo / AI-generated picture pipeline.
Emoji requests and Educational SVG P2/P3 requests live in resource specifications and do
not enter, consume or reduce those 16 Image Team places.

## Priority 2 source routes

### Check the Educational SVG library is here before you use that route

The Educational SVG drawings are a large shared asset set that no install
carries. The package ships the index of all 135,607 drawings; the drawings
themselves live in their own repository and arrive one at a time, as they are
chosen, into a cache on this machine. So the folder is not a fixed path to be
assumed, and whether the library can be reached at all is a fact about this run.
Resolve it once, as the first act of the opportunity pass, before any slide's
optional picture is decided. Not when a decision reaches the library: a designer
that never looks never runs the check, and then reports a deck with no drawings
in it as though the library had been consulted and found wanting.

`node "[PLUGIN_ROOT]/scripts/publish-educational-svg.js" --resolve-root`

`EDUCATIONAL_SVG_ROOT=<path>` gives this run's library home. Use it wherever
this reference writes `[EDUCATIONAL_SVG_ROOT]`. The resolver takes a configured
local copy when there is one and otherwise the fetching library, so a library
normally needs no configuration at all and the absence of drawing files from the
package is not by itself an answer.

`EDUCATIONAL_SVG_UNAVAILABLE` means that
the Educational SVG route is unavailable for the whole run.
Then, on every surface:

- an ordinary P2 uses the emoji route when a clear, child-suitable emoji
  genuinely fits, and otherwise the item closes text-only;
- semantic vocabulary P2 and P3 are Educational SVG only, so author none and
  record the zero with that reason;
- on the Working Wall, apply the card's visual-entry rule with the emoji route
  as the only P2 available.

Do not run the search, preview or publish commands, do not read the rest of
this reference's Educational SVG detail, and do not spend a retry on it. A
missing optional-picture library is a quieter resource, not a fault, a helper
gap or a blocking finding, and it never delays or stops a build.

**Look in the Educational SVG library first, and use an emoji when nothing in it
fits.** These are not two routes to pick between on taste. The library is the
route; the emoji is what you fall back to when the library has no clear,
child-suitable drawing for this item, and it is the weaker picture because the
device draws it, not you.

So an emoji is a decision made **after** a search, never instead of one. Typing
an emoji into a slot without having searched the library for that same slot is
not choosing the cheaper of two routes: it is skipping the route, and it reads
afterwards exactly like a deck where the library had nothing to offer. If you
cannot say what the search returned, you have not made the choice yet.

- An emoji is the fallback route when it is clear, suitable for children and
  visually coherent with the surrounding set.
- **An emoji is drawn by the device, not by you.** Every platform draws its own
  version, so an emoji carries only the meaning that survives all of them. It is
  the right picture for a general thing children recognise at a glance (a candle,
  a bird, a bus). It cannot carry a form the learning depends on: a UK three-pin
  plug and socket, a pound coin, a particular instrument, a specific road sign,
  a named piece of apparatus. When the design asks for one of those, the emoji
  route is closed and the visual comes from a helper, a required photograph or
  an Educational SVG drawing. The test is simple: if a child could look at the
  drawn glyph and learn the wrong thing, no emoji fits.
- **This applies wherever the emoji sits, not only in a `picture` object.** An
  emoji typed into a category label, a sorting heading, a word bank, an item of
  teaching text or an answer is still the picture a child reads the meaning
  from, so it meets the same test. A relevant emoji lifting an otherwise
  text-only line is decoration and is unaffected.
- Search the shared drawing library once the resource's design is complete, and
  take the drawing whenever one fits: it is cleaner, calmer and more specific
  than the glyph a device happens to ship. The builder never guesses the
  picture.
- While composing a light slide, ask whether a relevant P2 belongs before
  settling its template, and choose one that leaves the picture somewhere to
  sit. Only a slide with genuine room to spare qualifies, and only P2 does: room
  is never arranged around a P3.
- Across a normal visual deck, run one explicit opportunity pass after the core
  slide geometry is settled. Look at every non-vocabulary slide and decide
  whether P1 already carries the visual job, a useful P2 fits, a useful P3 fits,
  or no relevant optional visual fits without competition. A slide that has done
  everything else right and still reads as a wall of text, or carries no imagery
  at all, is the case a P3 is for.
- Decide slide by slide rather than against a whole-deck quota. Each slide's
  answer belongs to that slide: what P1 already carries there, whether a
  relevant P2 helps there, and whether the finished slide reads flat enough to
  want a P3. A count fixed in advance is answered by finding that many, which is
  how an unrelated drawing ends up on a slide that did not want one.
- Expect a normal deck to carry several. Its teaching, task, reference and
  reflection slides are different situations and will not answer alike, so a
  deck where only one slide could take a picture is a genuinely dense deck
  rather than a well-judged one.
- Vary what is used and where it sits. The same drawing slide after slide, or
  the same corner every time, reads as a template rather than a decision and
  stops being noticed at all. Slides that are genuinely full stay bare, and that
  contrast is what makes the pictures elsewhere read as chosen.
- Zero is valid only when the explicit opportunity pass found no suitable use or
  every plausible use would compete with P1 or P2, physically and on its own
  slide. A deck-level reason - visual consistency, the strength or number of
  the P1 visuals, the sensitivity of the subject - is not competition and never
  zeroes the layer. Record that zero reason in the Slide Designer completion
  report.
- Zero drawings is not the same as zero optional pictures, and the second is the
  one that has to be explained. A deck whose optional layer is entirely emoji has
  not run an empty pass: it has run a pass that never opened the library. So when
  the drawing count is zero and the emoji count is not, the reason to record is
  what the library search returned for those items, item by item, and not a
  sentence about how visual the deck already is.
- Never use an unrelated drawing to reach a number. A drawing that does not
  belong to this lesson's subject is worse on the slide than no drawing at all.

### The pass writes a record, one line per slide

The pass has an output, and it is not the deck. It is
`[WORKING_DIR]/optional-picture-pass.json`: one entry for every slide, written as
you go, and checked before the deck is promoted.

Writing a line per slide, as you go, is what makes the slide-by-slide rule a
thing you do rather than a thing you claim: a single thought about the whole
deck cannot be written in this shape, and the check reads the record before the
deck is promoted.

```json
{
  "schemaVersion": 1,
  "slides": [
    { "slide": 1, "decision": "used", "pictures": ["educational-svg"] },
    { "slide": 2, "decision": "none", "reason": "full" },
    { "slide": 4, "decision": "none", "reason": "nothing-fits",
      "searched": ["monsoon", "rainy season", "year of weather"],
      "rejected": ["cartoon/ra/rain-cloud.svg", "standard/we/weather-icons.svg"] }
  ]
}
```

`decision` is `used` or `none`. On `used`, `pictures` lists the kinds you placed
there, and the check reads the deck to confirm they are really on that slide.

On `none`, `reason` is one of exactly five, and every one of them is a claim
about **this slide**:

| Reason | What you are saying |
| --- | --- |
| `full` | This slide's own content already fills it at a readable size. There is no spare room. Fullness is what the content *needs*, not what its boxes currently span: a card stretched over space its words are not using, or a zone allocated more height than its content asked for, is room wearing a card, not fullness. |
| `competes` | A picture would cover, shrink or crowd what a child has to read here. |
| `would-mislead` | A drawing here would bias, answer or pre-empt the task. The rainforest photo beside "which biome?" is this. |
| `nothing-fits` | You searched the library for this slide and nothing suitable came back. |
| `library-unavailable` | The library was not available to this run at all, as the resolver reported. |

**There is no code for a deck-level answer, and that is deliberate.** "The deck
is already visual enough", "I used one on slide 4 already", and "this slide has a
photograph on it" are the three answers that emptied the layer, and none of them
can be written down. A photograph settles whether a P2 saying the same thing is
wanted; it says nothing about whether this slide has room to spare, which is the
only question the pass asks. There is no deck budget: a picture on one slide
neither earns nor spends anything on another.

**`nothing-fits` is paid for, not asserted.** Name the searches you ran in
`searched`. Where those searches return drawings, name in `rejected` at least one
real `libraryId` you looked at and turned down. The check re-runs your searches
against the real library and confirms each rejected drawing exists, so a drawing
you never saw cannot be one you rejected. Say nothing-fits about drawings you
have actually looked at.

**An emoji-only slide pays the same price.** Choosing an emoji is saying the
library had nothing better, which is the same claim as `nothing-fits`, so a
`used` entry whose pictures are all emoji carries `searched` and `rejected` too.
That is the exact failure this catches: an emoji weather strip typed onto the one
slide that wanted a picture, on a deck where the library was never opened.

**`nothing-fits` and `library-unavailable` are answers to different questions,
and the machine settles which one you are allowed.** `nothing-fits` asserts a
search; with no library there was nothing to search, so the check refuses it and
asks for `library-unavailable` instead. `library-unavailable` describes the
machine rather than the slide, so with a library present the check refuses that
too: it cannot be true of one slide and false of the deck around it. This is why
the resolver runs as the first act of the pass rather than at the first slide
that wants a drawing - the answer it gives decides which vocabulary the whole
pass is entitled to.

The check prints `OPTIONAL_PICTURE_LIBRARY:` on every run, saying whether it
verified your evidence against a real library or had none to verify against, and
that line is carried into the run report. A deck with no drawings in it means one
thing when the library was searched and had nothing for these slides, and quite
another when there was no library to ask; without that line the two read
identically ever afterwards, and "why did it not use the drawings?" becomes a
question about the guidance when it was never a question about the guidance.

Run the check before promoting the deck:

```bash
python3 "[PLUGIN_ROOT]/scripts/check-optional-pictures.py" \
  --pass-record "[WORKING_DIR]/optional-picture-pass.json" \
  --lesson "[the candidate lesson.json]" \
  --library-root "[EDUCATIONAL_SVG_ROOT]"
```

Require `OPTIONAL_PICTURE_PASS_OK`. Drop `--library-root` only when the resolver
returned `EDUCATIONAL_SVG_UNAVAILABLE`.

It also prints `OPTIONAL_PICTURE_SHAPE` - the per-slide counts in order, like
`2,0,1,0,0,3,1`. That shape is the variety, made visible: a deck should read
uneven, because a teaching slide, a task slide and a reflection slide are
different situations. A shape that is all zeros, or the same number over and
over, is the failure this whole section exists to catch.

**Nothing here puts a picture on a slide.** A full slide stays bare and says so
in one word. What the record removes is answering for the whole deck at once,
quietly.


Do not generate lesson-specific pictures with an image generator for this
layer. Keep fixed signal icons reserved for their learned meanings and separate
from context pictures.

P3 is Educational SVG-only. It has no emoji, photograph or AI-generation route. The same
Educational SVG library can therefore supply a helpful P2 robin beside a robin question
or a P3 forest accent, but the object's field location decides its job and its
protection.

Within one repeated set of question cards, fact cards or list items, prefer one
visual style, but each item earns its own picture. A robin question may keep its
robin even when another question has no useful picture. The item without a
picture closes up to an ordinary text layout with no empty slot. Never force an
unrelated substitute just to make the set match. Avoid switching casually
between monochrome Educational SVG drawings and colourful emojis inside one set, but do
not discard a good relevant picture merely because another item stays bare.

## Request shape

The visual designer puts a `picture` object on the item that may carry it. An
emoji is complete immediately:

```json
{
  "text": "A candle is lit.",
  "picture": {
    "kind": "emoji",
    "value": "🕯️",
    "alt": "lit candle"
  }
}
```

An Educational SVG request describes the meaning and leaves the exact drawing until the
core resource design is settled. The same visual designer then resolves its own
request before final validation:

```json
{
  "text": "A candle is lit during the baptism.",
  "picture": {
    "kind": "educational-svg",
    "concept": "lit candle",
    "context": "A plain candle lit during a baptism",
    "avoid": ["birthday cake", "scented jar"],
    "fallbackEmoji": "🕯️"
  }
}
```

`concept` is the short search subject. `context` says what the nearby words
mean. `avoid` names details that would tell the wrong story. `fallbackEmoji` is
optional. A visual designer never invents an Educational SVG identity, slug or
file path before searching the library. On every surface, the same visual designer that authors
the request resolves it only after the core resource design is settled, then
copies only the three publisher-returned fields.

After a successful search, the resolving worker adds the ordinary local-file
fields:

```json
{
  "kind": "educational-svg",
  "concept": "lit candle",
  "context": "A plain candle lit during a baptism",
  "avoid": ["birthday cake", "scented jar"],
  "fallbackEmoji": "🕯️",
  "educationalSvgId": "standard/ca/candle-lit.svg",
  "educationalSvgSlug": "candle-lit",
  "imagePath": "icons/candle-lit.png"
}
```

Semantic vocabulary P2

```json
{
  "visual": {
    "type": "image",
    "kind": "educational-svg",
    "concept": "magnifying glass",
    "context": "The vocabulary word means inspect or look closely.",
    "avoid": ["telescope"],
    "alt": "A magnifying glass",
    "educationalSvgId": "standard/ma/magnifying-glass.svg",
    "educationalSvgSlug": "magnifying-glass",
    "imagePath": "icons/magnifying-glass.png"
  }
}
```

P3 decoration, as a wide accent behind the content

```json
{
  "id": "decoration-rainforest-corner",
  "kind": "educational-svg",
  "concept": "rainforest trees",
  "context": "A wide forest accent in the lower corner, not part of the questions",
  "avoid": ["single house plant", "Christmas tree"],
  "frame": {
    "x": -0.08,
    "y": 0.70,
    "width": 1.08,
    "height": 0.34
  },
  "layer": "low",
  "rotation": 0,
  "transparency": 50,
  "educationalSvgId": "standard/fo/forest.svg",
  "educationalSvgSlug": "forest",
  "imagePath": "icons/forest.png"
}
```

P3 decoration, as one small drawing resting on a card's edge

```json
{
  "id": "decoration-banana-card-edge",
  "kind": "educational-svg",
  "concept": "banana",
  "context": "A single banana resting over the lower right edge of the task card on a balanced-diet slide, clear of every word",
  "avoid": ["bunch of bananas", "peeled banana", "cartoon face"],
  "frame": {
    "x": 0.86,
    "y": 0.40,
    "width": 0.10,
    "height": 0.18
  },
  "layer": "high",
  "rotation": 0,
  "transparency": 50,
  "educationalSvgId": "standard/ba/banana.svg",
  "educationalSvgSlug": "banana",
  "imagePath": "icons/banana.png"
}
```

Both are valid P3. The first spreads a faint accent behind everything; the
second is one small object sitting on top of a card in space the card's own
shape already left over. Neither changed the layout to exist.

Semantic vocabulary Educational SVG is meaning-carrying P2. It requires meaningful `alt`
and has no `fallbackEmoji`. On slides and worksheets it closes to text-only when
unresolved. On the Working Wall it is part of the visual-entry contract: if it
cannot be resolved, `working-wall-designer` removes that card before writing the
final specification.

P3 lives only in a supported physical surface's `decorations` array. It uses the
page-relative geometry and bounds in this reference, carries no alt meaning, and
disappears when unresolved.

The semantic vocabulary allowed keys are exactly:

type
kind
concept
context
avoid
alt
educationalSvgId
educationalSvgSlug
imagePath

fallbackEmoji is forbidden there.

The P3 canonical fields are:

id
kind
concept
context
avoid
frame
layer
rotation
transparency
educationalSvgId
educationalSvgSlug
imagePath

with avoid, rotation, and transparency optional as already defined by the locked contract.

The saved PNG is what every builder reads. Builders never search the shared
library. The selected source SVG also sits in `icons/source/` for provenance
and future reuse.

## How a designer searches and chooses

These rules apply whenever a visual designer resolves its own request. The
designer reads the complete item, not only `concept`. It searches several
candidates, opens the actual drawings and judges them at the small size the
resource will use. A file name and its search rank are not evidence that a
drawing fits.

Choose the picture that:

1. matches the particular context rather than only the noun;
2. is immediately recognisable to a primary-aged child;
3. adds no detail that suggests the wrong situation;
4. remains clear at the intended small size;
5. keeps its natural proportions and suits the other pictures in the set.

These rules apply only when the resolver above printed an
`EDUCATIONAL_SVG_ROOT`. Search with one short concrete query and up to five
useful alternatives:

`node "[PLUGIN_ROOT]/scripts/search-educational-svg.js" --query "<concept>" --query "<useful-alternative>" --limit 12`

Add `--style standard`, `--style cartoon` or `--style solid` only when the
surrounding set needs that style. The search reads the packaged index, so the
ranking is the same on every machine, and the command then brings the drawings
it names onto this one. Each candidate's `sourcePath` is a real file by the time
you read it: hand those paths straight to the preview sheet below.

A drawing that could not be brought over is left out of `candidates` and named
on its own `EDUCATIONAL_SVG_NOT_FETCHED` line. Treat it as a drawing that is not
available for this item and choose among the rest. Do not put a `libraryId` from
one of those lines into a specification, and do not name one in `rejected`,
because you never saw it.

If it prints `EDUCATIONAL_SVG_UNAVAILABLE`, apply the failure rule below. This
is an optional-picture outcome and must not stop the lesson.

Render the candidates onto one numbered preview sheet:

`node "[PLUGIN_ROOT]/scripts/rasterize-educational-svg.js" --sheet "[WORKING_DIR]/icons/.preview/<unique-name>.png" "<candidate-1.svg>" "<candidate-2.svg>" ...`

The command prints the sheet path and then one numbered line per drawing, in
reading order, so tile 3 and the third line name the same file. Look at the
sheet once with the host's image-reading tool and compare the real drawings with
the request's context and avoid list. Choosing means comparing, and a sheet is
what makes comparing possible; separate files turn one judgement into a
succession of half-remembered ones.

Candidates for several requests may share one sheet. Keep each request's
candidates together in the order given, and take the whole deck's optional
pictures in as few sheets as the shortlists allow.

A single drawing can still be rendered on its own by giving a source and an
output path with no `--sheet`. Remove the temporary preview files once the
requests are settled.

Publish the chosen library SVG directly with:

`node "[PLUGIN_ROOT]/scripts/publish-educational-svg.js" "<candidate.svg>" "[WORKING_DIR]" "<preferred-slug>"`

Read the one `EDUCATIONAL_SVG_ASSET:` JSON line. Copy its
`educationalSvgId`, `educationalSvgSlug` and `imagePath` to the request. The
publisher refuses files outside the shared library and refuses active SVG
content. Identical source bytes reuse an existing slug and PNG. Different
source bytes never overwrite an existing asset. The publisher allocates a
stable numeric suffix when needed.

For example, a baptism item rejects birthday-cake and scented-jar candles. A
birthday question may make the birthday-cake candle the best choice. A search
for two words can also return the wrong half of the phrase, so the resolver
always looks at the drawing before accepting it.

Use the search once with an honest set of alternatives. If the library is
unavailable, the search has no suitable candidate, preview inspection rejects
the candidates, or publication fails, apply the surface's existing fallback:

- replace an ordinary P2 with its suitable complete emoji fallback, or remove
  the `picture`;
- remove a failed semantic vocabulary `visual` so the item closes text-only;
- remove a failed P3 decoration;
- on the Working Wall, reapply the card's visual-entry rule and remove the card
  when that rule requires it.

Do not leave an unresolved Educational SVG object in a final specification. Do
not retry through another worker. Optional picture work never stops the
resource from building.

## Timing by resource

Slides, worksheets and stick-in sheets use this order:
1. the visual designer settles the core resource;
2. for slides, the Slide Designer runs the explicit whole-deck P2/P3 opportunity pass before deciding that no request is needed;
3. that designer authors the P2 and supported P3 requests selected by the pass;
4. that same designer resolves every unresolved Educational SVG request in its spec;
5. the designer runs its existing final validation and closes its result;
6. the deterministic builder renders the local files, dropping an unresolvable
   P3 with the non-fatal `OPTIONAL_DECORATION_OMITTED` notice rather than
   failing the resource. P3 is the layer that is expendable first, and it is
   expendable without anyone deciding so.

If one of those specifications contains only emojis or no unresolved Educational SVG
request, skip the resolution step.

Working Wall resolves its own Educational SVG requests before writing final
`working-wall.json`:
1. `working-wall-designer` settles the core cards and decides whether each P2 is
   entry-critical or only an enhancement;
2. only then does it author and resolve any Working Wall P2/P3 Educational SVG requests;
3. it publishes accepted SVGs through `publish-educational-svg.js`, applies the
   Working Wall failure rules below, and removes every unresolved request;
4. it writes the final build-ready specification;
5. `working-wall-builder` renders and verifies that final specification.

Do not spawn a separate Educational SVG resolver for any surface.

## Surface-specific limits

- Slides keep CURRENT's ordinary P2 item rules. P3 may use a top-level
  `decorations` array only when the slide is not `key-vocabulary` and contains no
  `type: "vocab"` surface.
- Worksheets keep CURRENT's P2 helper rules. P3 may sit only in the page-level
  collection and never enters a zone or pupil workspace.
- Working-wall P2 may be a genuine visual anchor and may be the visual entry
  ticket for an ordinary card. `working-wall-designer` resolves its own P2/P3
  requests after the core card design is settled. For an ordinary P2 Educational SVG
  failure, replace the request with a complete emoji `picture` when its
  `fallbackEmoji` is suitable; use the original non-empty `alt` when present,
  otherwise use the original `concept` as `alt`. When no suitable fallback
  exists, remove the failed `picture`. If that leaves an ordinary card with no
  other qualifying P1/P2 visual, remove the card unless it is the existing
  step-by-step success-criteria exception. An unresolved semantic-vocabulary
  P2 removes its `vocabDefinition` card. An unresolved P3 removes only that
  decoration. Final `working-wall.json` contains no unresolved Educational SVG request.
  P3 remains allowed only on `stickyKnowledge`, `workedExample`, `sentenceStem`,
  `misconception`, `referenceTable`, `equivalenceGrid`, and never earns
  wall-worthiness.
- Stick-in pieces keep their current P2 identification cue and never use P3.

P3 coordinates use the full physical surface. `x`/`y` are JSON numbers from
-1.5 to 1.5, width/height are JSON numbers greater than 0 and no greater than
1.5, rotation is -180 to 180 clockwise degrees, and transparency is 0 to 90.
