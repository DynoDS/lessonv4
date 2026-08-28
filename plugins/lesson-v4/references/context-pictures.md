# Optional context pictures and relevant decoration

This reference owns two optional visual layers shared by the resource designers.
It does not own photographs, maps, diagrams or other P1 visuals that the teaching
depends on. Those stay in their existing routes.

P2 is a helpful context picture attached to a word, question, fact or example.
P3 is relevant decoration attached to the physical slide/page. P2 may carry
meaning; P3 does not. P1 always wins over both, and P2 wins over P3.

## Slide Designer read route

At Slide Designer startup, read this introduction, `The boundary`, and the whole-deck opportunity-pass rules in `Priority 2 source routes`. Do not load request JSON, resolver publication steps or other resource surfaces at startup.

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

Both optional layers are nice to have. They never change the lesson's teaching,
become part of the answer, shrink text, reduce writing space, crowd a diagram,
change a template/layout/page count or delay a finished resource. P3 is the first
thing moved, faded, replaced or removed when anything competes.

On a slide, keeping the text size does not mean keeping the original line
count. A picture may shorten the text column and make a question or fact wrap
onto an extra line when the complete set still fits comfortably at the same
font size. The nearby card may grow only by the height that wrapping genuinely
needs. If that would crowd the set or make anything smaller, remove that
individual picture instead.

On slides, optional context pictures stay visually quieter than the words. The
builder renders them at 50% transparency and sizes them from the usable height
of their own row or card while preserving their natural proportions. A wide
picture is capped before it takes essential text room; if the same-size wording
still cannot fit, that individual picture closes up. This treatment belongs
only to the optional picture layer. Do not fade a photograph, map, diagram or
other visual that carries the teaching. Printed resources also keep enough
contrast to survive ordinary classroom printing rather than inheriting the
slide transparency automatically.

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

The Educational SVG drawings are a large shared asset set held at
`[PLUGIN_ROOT]/educational-svg/`. An install of this plugin may not carry
them. Confirm once, before the opportunity pass reaches any Educational SVG
decision, that `[PLUGIN_ROOT]/educational-svg/search.js` is present.

If it is absent, the Educational SVG route is unavailable for the whole run.
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

Use either an emoji or a hand-drawn Educational SVG picture.

- An emoji is the fallback route when it is clear, suitable for children and
  visually coherent with the surrounding set.
- Prefer an Educational SVG picture when the hand-drawn object gives a cleaner,
  calmer or more specific match. Search the shared local library after the
  resource's design is complete. The builder never guesses the picture.
- Across a normal visual deck, run one explicit opportunity pass after the core
  slide geometry is settled. Look at every non-vocabulary slide and decide
  whether P1 already carries the visual job, a useful P2 fits, a useful P3 fits,
  or no relevant optional visual fits without competition.
- Author at least one relevant Educational SVG P2 or P3 request when that pass finds a
  plausible suitable object that does not take space from P1. One or two
  meaningful uses remains the normal target.
- Zero is valid only when the explicit opportunity pass found no suitable use or
  every plausible use would compete with P1 or P2. Record that zero reason in
  the Slide Designer completion report.
- Never use an unrelated drawing solely to meet the target.

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

P3 decoration

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

These rules apply only when the library check above found
`[PLUGIN_ROOT]/educational-svg/search.js`. Search the fixed shared library
with one short concrete query and up to five useful alternatives:

`node "[PLUGIN_ROOT]/educational-svg/search.js" --query "<concept>" --query "<useful-alternative>" --limit 12`

Add `--style standard`, `--style cartoon` or `--style solid` only when the
surrounding set needs that style. The location is fixed. The command makes one
quick folder check and does not search the computer or use the network.

If it prints `EDUCATIONAL_SVG_UNAVAILABLE`, apply the failure rule below. This
is an optional-picture outcome and must not stop the lesson.

For a short candidate list, render temporary previews with:

`node "[PLUGIN_ROOT]/scripts/rasterize-educational-svg.js" "<candidate.svg>" "[WORKING_DIR]/icons/.preview/<unique-name>.png"`

Inspect the previews with the host's image-reading tool. Compare the real
drawing with the request's context and avoid list. Remove the temporary preview
files after the request is settled.

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

Use the local search once with an honest set of alternatives. If the library is
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
6. the deterministic builder renders the local files;
7. the normal visual reviewer treats P3 as first expendable.

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
