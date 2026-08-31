# Authoring a content helper

This is the single authoritative guide for adding a new **content helper** to the lesson-resources engine — a new kind of thing a lesson can draw (a diagram, a chart, a labelled visual). Both the `helper-builder` agent and the `/edit-templates` command read this, so the rules live here once rather than in each.

It is read at two different moments, and every repository-relative path in it means the same thing at both: a destination inside the package.

- **Building** (the `helper-builder` agent, mid-lesson). Nothing is written into the package. Each path names where the file will land, so it is the path the file is written at inside `[WORKING_DIR]/pending-helper/<name>/`. Nothing here is rendered, guarded, versioned, committed or pushed.
- **Installing** (`/install-helper`, or `/edit-templates` working directly). Each path is relative to the caller's verified `PLUGIN_SOURCE_ROOT` - a writable git checkout. Never write to an installed `PLUGIN_ROOT` unless its canonical path is exactly the same as `PLUGIN_SOURCE_ROOT`.

The split exists because a helper is commissioned in the middle of a lesson, from one lesson's need, with nobody having read it. Building it there is right; letting it into the engine, or out to everyone the package installs for, is a decision a person makes with the pictures in front of them. So the *Verify by looking* and *Finish every install* sections below belong to the install, and everything before them belongs to the build.

A content helper is small and reusable: it renders one kind of content object inside whatever zone it is handed, and the slide-designer and worksheet-designer reach for it by name. Getting one *fully* wired matters because the engine fails quietly — a helper registered in one place but not another doesn't error, it just renders as plain label text or a blank cell, and the gap only shows up when a teacher looks at a finished slide. The checklists below exist so a new helper works the first time, everywhere it is used.

---

## First decide: drawn or stock?

A helper is anything a designer reaches for by name and gets the same faithful visual from every time. Two forms exist, and everything below changes depending on which you are building.

**Drawn.** Code builds the picture from the lesson's data, so one helper serves every lesson that needs that shape with different contents: a bar chart, a place-value chart, a number line, a sorting frame, a plate divided into food groups. Change the numbers, labels or categories and the drawing changes with them. The rest of this guide is written for these.

**Stock.** The helper hands out a fixed picture by name, because the thing it shows never varies: a £1 coin, a UK three-pin plug, a compass rose, a named piece of apparatus. `money` and `map` are the existing pattern - a small renderer that places a named file, and a curated folder of files in `builder/assets/` beside it.

The test is what the picture is made of. If the lesson's data changes the drawing, it is drawn. If the picture is one fixed thing that would be wrong if it varied, it is stock. Reuse is what makes either worth building, but it is not what tells them apart.

### Before either: is this picture's correctness a fact about the world?

Ask what makes the drawing right. A bar chart is right when its bars match the lesson's numbers. A Venn is right when its regions match the sets. An angle is right when it measures what it says. Those are true by construction, so code can draw them from nothing and be correct every time.

A coastline, a country border, a river's course, the face of a coin, the shape of a named piece of apparatus is not like that. It is right only when it matches something that already exists, and no amount of care in the code gets you closer to it. **So a figure whose correctness is a fact about the world is never drawn from coordinates you choose.** It is built on the real thing: an asset already in `builder/assets/`, a new stock asset you source or generate and check, or the lesson's own picture route. Whatever the lesson adds goes ON TOP of that as annotation - a dot on a place, a dashed outline round a region, a line along a river - positioned in fractions of the real picture, the way the `map` content object does.

The trap is that a real-world figure can still be configurable, so it passes the drawn/stock test above and reads as "drawn". A location map that takes a zoom stage, a highlight and a label list changes with the lesson's data in every way except the one that matters: the land. **The discriminating question is not "does this vary?" but "if this comes out wrong, is it wrong because it mismatched the lesson, or because it mismatched the world?"**

The case this rule was written from: a Year 4 rainforest lesson needed a world-to-Amazon location map. Nothing in the catalogue did the zoom, so a new drawn helper was built, with continents, country borders and a rainforest boundary as hand-picked polygon points. It rendered cleanly, filled its slot, passed the parity guard and every test, and put South America in the wrong shape, Brazil in the wrong place, and a rainforest boundary that answered to nothing. Meanwhile eight real map images were sitting in `builder/assets/maps/`, and the `map` object already drew them.

**Where this does not apply.** A diagram whose form is a teaching convention rather than a survey: a circuit symbol, a rainforest cross-section, a water cycle, a food-group plate. Nobody can photograph the canonical rainforest cross-section; its accuracy is pedagogical, and drawing it is exactly right. Nor does it apply to a schematic that is honestly presented as invented - the four-figure grid-reference map of a town that does not exist - because there is no real place for it to be wrong about. The rule bites when a child is being told **where or what something actually is**.

**Record the answer where the guard can hold you to it.** Every entry in `shared/visual-parity.js` carries a `depicts` field: `'data'` when the drawing is right by matching the lesson's own data or an agreed convention, or `'asset:<folder under builder/assets>'` / `'projection:<named projection>'` when it depicts a real place or object and takes its form from that source. `npm run check` refuses an entry that declares neither, and refuses an `asset:` folder that does not exist. The guard cannot judge whether a drawing is accurate; what it can do is make you write down what it is drawn from, so "I picked these coordinates by eye" has to be said out loud before it can ship.

**Before building a real-world figure at all, look for the helper that already holds the real source.** If one exists and falls short, grow it - a new annotation, a new asset in its folder, a new named overlay - rather than building a second helper that draws the same place its own way. Two helpers for one place is two answers to "where is it", and the sheet and the board will eventually give different ones.

### Building a stock helper

1. **Make the picture once.** Source it, or generate it with your own image generation. Do not route it through a lesson's picture stage: that stage is built for one-off lesson photographs and carries a per-picture attempt ledger, prompt hashing and provenance rules that exist for that job and add nothing here.
2. **Hold it to the thing itself.** A pound coin whose face is not the real coin's face teaches the wrong coin. For a stock item, wrong is a reason to redo it, not a note for the teacher.
3. **Crop it tight**, exactly as the no-deadspace section below requires. A stock picture with baked-in margin wastes the slot in every lesson that uses it, forever.
4. **File it** under the matching folder in `builder/assets/<family>/`, named as the designer will name it.
5. **Wire the family, not the file.** If the family already has a helper (`money`, `map`), the new file needs only its catalogue line. If the family is new, write the small renderer that places a named file from that folder, mirroring `map.js`, and take it through the same per-renderer checklists below as any other helper.
6. **Name it in the catalogue**, so a designer knows the file exists. An unlisted stock file is invisible in exactly the way an unlisted drawn helper is, and the designer's fallback is to ask for a generated picture of a thing the package already holds correctly.

**A visual only one lesson will ever want is neither.** It is that lesson's own picture, and the lesson picture route already makes it. Build a helper when another lesson will want the same visual again.

---

## First decide: which renderer(s) does this helper serve?

A visual can be drawn by up to **four code renderers** — four surfaces in all, and a helper only reaches the ones you wire it into. This single decision is what most often goes wrong: a figure gets built for the board and the sheet, the wall (or the stick-in pack) is forgotten, and nothing errors — the wall just ships words where the picture should be, and the gap surfaces weeks later when a teacher looks at the display. So make the decision deliberately, by asking of each surface *where a child or teacher actually meets this visual*:

- **The slide builder** (`builder/`) — PowerPoint, the board. Wire here when children meet the visual during teaching.
- **The worksheet engine** (`worksheet-html/`) - printed PDF sheets. Wire here when children meet it on paper, as a question or a recording frame.
- **The working wall** (`working-wall-html/`) — printed classroom display cards. Wire here when the visual is the sort a wall shows: a classification picture in a "types of…" poster (each type beside the shape that defines it), or an anchor/reference diagram children look up across the unit. A wall carries no question frames and no one-off teaching diagrams, so a worksheet-only recording helper has no place on it.
- **The stick-in pack** (`stick-in-sheets-html/`) — small cut-and-glue pieces for the exercise book. Wire here when the visual is a **write-on moment**: a picture the child marks, sorts, labels or draws on rather than copies (a Venn to sort into, an angle to name, a diagram to label, a grid to reflect a shape on). A child cannot reproduce that picture by hand in a squared book, so it is printed and glued in; a figure the child only reads and answers from is not a stick-in. Reaching this surface takes two wires together: the builder's visual registry **and** the stick-in-sheets-designer's supported-visuals list (in `references/stick-in-sheets-pedagogy.md`): an unlisted visual is one the designer never emits, so the piece goes unprinted even though the builder could draw it.

Most maths *figures* belong on the board and on paper both — the concept is taught on the slides and practised on a sheet — and a classification or reference figure belongs on the wall as well, so a child who classifies a triangle on the board, classifies one in their book, and finds the three types on the wall meets the same picture in each place. A write-on figure the child marks rather than copies belongs on the stick-in pack too. Decide each surface on its own merits; the useful defaults are: a classification or reference figure → board + paper + wall; a write-on figure → board + paper + stick-in. Build fewer only when the use is genuinely one-sided (a teaching-only diagram that never becomes a question, a worksheet-only recording frame, a procedure visual a wall would never display, a read-and-answer figure that is never marked on). A helper that exists in only one surface is the most common reason a later lesson — or its wall, or its stick-in pack — can't render what it needs.

**When a teacher flags a helper missing from a renderer, retrofit it into *every* renderer it should serve in that pass — not only the one named.** An older helper, built before this guidance or under a too-narrow brief, often lives in just one or two renderers; the shared geometry already exists, so adding it to the missing renderer is thin work. The trap is fixing only the renderer that was flagged: when a sorting diagram's absence surfaces on the worksheet, its wall (and its slides) are usually the same generation of work, so the next gap is already latent and resurfaces as a fresh complaint a fortnight later. So when a missing helper is reported, run the "which renderer(s)" test above for that helper, list every renderer it belongs in, and wire all of them now — the cheapest time to close the whole class of gap is while you already have the shared module open.

**Figures share their geometry; laid-out helpers don't.** A figure that rasterises through SVG (an angle, a line pair, a triangle) writes its geometry once in `shared/visuals/<name>-svg.js`, and every renderer imports it from there - so the board, the sheet, the wall and the stick-in piece draw the identical shape, and once the shared module exists each renderer's wiring is thin (it points at the shared geometry rather than redrawing it). Write the shared module first. A laid-out helper (steps, vocab) shares no code across engines; there, copy it across rather than importing.

**Record the decision in the parity manifest, so it is enforced and not just hoped-for.** The four-surface decision used to live only in this guidance, and it kept slipping - the wall was the usual casualty. It now has a source of truth: `shared/visual-parity.js` lists every shared visual primitive and, per code engine, the exact key that renderer dispatches on (or `false`, with the reason, where the visual genuinely does not belong). Add your new primitive there as part of the build, declaring each surface you decided it serves. The guard `builder/scripts/check-parity.js` (run by `npm run check` in `builder/`) then holds that decision two ways: it fails if a surface you declared is not actually wired (so a half-finished wiring stops here, not in a classroom), and it fails if a live wall or stick-in figure - or any new slide figure - is missing from the manifest (so a new visual cannot exist without the scoping decision being made). An honest `false` is respected; the guard never nags that a figure could reach one more surface, because that is your pedagogical call to make, not a mechanical rule. Recording the `false` is what makes the absence visible to the next author instead of silent.

**Audit Success Criteria use in the same manifest.** Every visual primitive has a `SUCCESS_CRITERIA_AUDIT` decision: `both`, `SC-inline`, `full-size`, or `unsuitable`, with a reason. Ask whether a stable visible mark, placement, structure or movement remains useful in the real 0.68in × 0.62in step slot. If yes, do not merely name it: add its compact method/spec to the primitive's `successCriteriaHelpers`, keep the drawing in the primitive's shared geometry module (or a deliberately inline-only shared module), return measured `w`, `h` and `aspect`, add the agent-facing mapping in `references/slide-success-criteria.md`, and render it at full size. If task values, labels or detailed relationships carry the meaning, keep the visual full-size. The catalogue loader enforces that every primitive has a decision and that accepted classifications have executable geometry.

---

## The no-deadspace principle

**Children read these visuals from across the room and from a desk, so every visual should fill the space it is given.** A diagram drawn on a padded square canvas and then centred in its slot wastes most of the slot on empty margin — the actual picture ends up small, faint, and hard to read, and a teacher rightly asks why the angle is a third of the size of the box it sits in. The fix is to crop to the ink and place by the picture's true shape, so a thin acute angle and a wide obtuse angle each grow to fill their slot instead of floating inside borders.

Carry this question into every helper that draws a figure: **does the rendered image's bounding box touch its own edges, or is there blank padding baked in?** If there's padding, the helper is throwing away size the child needs.

Two moves deliver it, and they apply to any image-based helper (anything rasterised through SVG → PNG):

1. **Crop the canvas tight to the drawn content.** Compute the bounding box of everything you actually draw — every stroke tip, the arc's bulge, the vertex dot — and set the SVG `width`/`height`/`viewBox` to that box plus only a hair of margin for the stroke width. Do not draw onto a fixed square canvas and centre within it; that is exactly what bakes in deadspace.
2. **Place by the true aspect ratio.** The rasterised image is now tall-narrow or wide-short depending on the angle, not square. Carry its width:height ratio out of the pre-render step, and in the draw step size it to fill the slot by that ratio — width-bound when the slot is relatively tall, height-bound when the slot is relatively wide — then centre. Never re-pad it back into a square.

The `angle` helper (`builder/src/content/angle.js` and `worksheet-html/src/helpers/geometry.js`) is the worked reference for both moves: it builds a tight viewBox from the bounding box of the vertex and arm tips, returns the aspect ratio alongside the PNG, and the draw step fills the slot by that ratio. Copy that shape for any new figure helper.

A flat colour fill behind the figure is the same waste in a different guise — keep the figure on a transparent (or no) background so nothing but the drawing claims space.

---

## Lay the drawing out from its own content

**A helper is a shape that redraws itself around whatever a lesson puts in it, so the only positions it may hold are ones it works out at draw time.** A table of hand-picked x/y coordinates, chosen by eye against the wording you happened to build it with, renders perfectly for that wording and then clips, collides or floats the moment a lesson supplies its own labels. Nothing catches it: the build is green, the guard is green, and the fault reaches a child's worksheet.

Three moves, for every helper that places text:

1. **Measure the text, do not count its characters.** The house pattern is a `fitFont(text, avail, maxFont, minFont)` beside the constants block - `carroll-svg.js`, `place-value-chart-svg.js` and `grid-map-svg.js` each carry one. Where the space is tight enough that a wrong estimate clips (text inside a wedge, a cell, a circle), measure with real glyph widths rather than an average, as `balanced-pattern-plate-svg.js` does.
2. **Derive the position from the geometry.** Compute the anchor from the shape the words belong to: the centroid of a band, the middle of a cell, the run of radii along a sector's bisector where the whole block still fits inside. A named constant for a gap, a stroke width or a colour is house style; a named constant for *where one particular label goes* is the eyeballing this rule exists to stop.
3. **Give it somewhere honest to go when it will not fit.** Shrink to a readable floor, then wrap, and if it still does not fit, move that label out to a gutter beside the drawing on a leader line - the pattern `rainforest-layers-svg.js` and `balanced-pattern-plate-svg.js` both use. The fallback is never "draw it anyway": a label lying across a neighbouring part teaches the wrong thing, which is worse than a label sitting outside on a line.

A readable floor is part of the rule, not an escape from it. A label that would have to go below it has outgrown its space and belongs in the gutter, not at eight point.

**Where this does not apply:** a drawing with no text in it, and a figure whose words are fixed content of the picture rather than a lesson's data - a compass rose's N, E, S and W. Those have nothing to vary, so nothing to fit.

**Lock it with a test on the layout, not on the words.** A test that greps the rendered SVG for a label passes on a label that is clipped in half. Expose where each space landed (`describeLayout` in `balanced-pattern-plate-svg.js` is the model) and assert the boxes sit inside the picture, inside the part they belong to, and clear of each other - with at least one case using wording the helper was not built around.

---

## House code rules (both engines)

These keep a new helper consistent with the others and safe through the autofit pass:

- **Read the shared constants, don't hard-code style.** Slide: `FONT`, `COLOURS`, `FIT` from `builder/src/styles.js`. Worksheet: use the shared values from `worksheet-html/src/tokens.js`. House colours are the blue/black/green/orange scheme; reuse them so a new helper reads as part of the set.
- **Open with a named constants block.** Every padding, colour, stroke width and font size sits at the top of the file, named, with its unit in a comment — this is the block the `/edit-templates` round-trip tunes, and a value buried in the function body silently won't tune.
- **Size everything relative to the zone.** Express widths, heights and gaps in terms of `zone.w` / `zone.h` (slide) so the helper drops cleanly into any zone shape, large or small.
- **Separate shape from text, always `margin: 0`.** When text sits inside a box, draw the box with `addShape` and the text with a separate `addText` inset by hand for padding — never text-on-shape. The autofit pass measures text frames assuming `margin: 0`, and merging the two makes PowerPoint reserve padding it can't predict, overflowing narrow boxes.
- **Font sizes are ceilings.** Include `fit: FIT` on slide text; the size you set is the maximum and the build shrinks it to fit. Keep body text `bold: true` (house style).
- **Mirror a sibling before writing.** Read the closest existing helper first so the new one matches house shape. For a figure that rasterises through SVG, `clock.js` / `turn-diagram.js` / `angle.js` are the models; for a laid-out helper, `steps.js` / `vocab.js`.

---

## Slide builder — every place to wire it

Work through all that apply. The first two are always required; the rest depend on what the helper does.

1. **The helper file** — `builder/src/content/<type>.js`, exporting `draw<Name>(pptx, slide, zone, data, ctx)`. Apply the no-deadspace principle if it draws a figure.
2. **The dispatcher** — `builder/src/content/index.js`, in two places: the `HELPERS` map (`type` → draw function) and `ZONE_COMPAT` (`type` → which zone classes it fits). A type missing from either falls back to plain label text.
3. **The catalogue** — `references/templates.md` §4 (content objects): a one-line purpose in the §1.2 table, then a `### <type>` section with a JSON example and the field list. This is the only thing the slide-designer reads to learn the helper exists; an unlisted helper is never emitted.
4. **Pre-render (only if it rasterises via sharp).** A helper that turns an SVG into a PNG should pre-render once before the slide loop, not inside the draw call, so identical figures are built once and the draw step stays synchronous. Add a `preRender<Name>(lesson)` that walks the lesson, dedupes by a content key, and returns a map; call it in `builder/build.js` and pass the result on `ctx` (e.g. `ctx.angleImages`). Follow `preRenderAngles` exactly.
5. **Row equaliser (only if it carries a caption and appears in a `row`).** So several of them in a row draw at one size, add a `<name>LabelBandHeight(data)` and have `builder/src/content/row.js` reserve the largest band any sibling needs — mirror the `turn-diagram` / `angle` handling already there.
6. **Vocabulary cards (only if it makes sense as a small icon beside a vocab word).** The key-vocabulary card renders its visuals through its own gate, `builder/src/content/vocab.js`, not the general dispatcher — so a helper that should sit beside a word (e.g. "acute angle" shown as the angle itself) must be added to `resolveVocabVisual` and `drawVisual` there too, the same way `turn-diagram` and `angle` are. This is the easiest place to forget, and the symptom is a blank cell on the vocab slide with a build warning.

---

## Worksheet engine - every place to wire it

The sheet the teacher prints is built by `worksheet-html/`, so the figure ships from there.

1. **The helper itself** - one entry in the matching family file under `worksheet-html/src/helpers/` (e.g. `geometry.js`, `visuals.js`), exporting `render`, `measure`, `needs` and `greed`, styled from `src/tokens.js`. A brand-new family file must also be added to the `FILES` list in `src/helpers/index.js`; a helper missing from the registry fails the build with `UNKNOWN_HELPER`.

   `greed` says whether spare height helps at all. If it also keeps helping - the helper's content IS the space, the way a box a child draws in is - add `fills: true` as well. Without it the helper is capped at half again its own height, which is the number the ruled writing lines were tuned to and the reason a drawing box asked to take a whole side once came out 20mm tall. Set it only where more space is genuinely more of the activity; ruled lines and option lists are not that, and inflating them just spreads a question down a page. Whatever the CSS does must match: a helper claiming height it does not visibly absorb turns the room into a hole underneath it.
2. **Its purpose line and worked example** - one line in `src/helpers/purposes.js` and a working spec in `test/helper-examples.js`. `npm test` (in `worksheet-html/`) fails on a helper missing either, and `npm run check-render` draws every helper's example at four widths.
3. **Its catalogue family** - add the helper to a family in `scripts/build-catalogue.js`, then run `npm run catalogue` to regenerate `references/worksheet-helpers/catalogue.md` (the script fails with `CATALOGUE_INCOMPLETE` on a helper with no family). The generated catalogue is the only thing the worksheet-designer reads to learn the helper exists.

---

## Working wall — every place to wire it (for the figures a wall shows)

A wall figure renders from the same `shared/visuals/<name>-svg.js` module the slides use, so once that shared module exists the wiring is short. Skip this engine only when the visual is not the sort a wall shows (a question frame, a one-off teaching diagram).

1. **The SVG registry** — `working-wall-html/src/svg-renderer.js`: `require('../../shared/visuals/<name>-svg')` and add it to the `PRIMITIVES` map in the aspect-true form, `<type>: { keyFn: shared.cacheKey, tightFn: shared.tightSvg, collected: {} }`, mirroring `angle` and `line-pair`. Export its `<name>Key` from the module too.
2. **The key registry** — `working-wall-html/src/visuals.js`: import `<name>Key` and add `<type>: <name>Key` to `VISUAL_KEY_FNS`, so a card `visual` or a reference-table cell visual resolves. (The renderer crops tight and places by true aspect on its own — no extra layout work.)
3. **The catalogue the designer reads (two files).** `agents/working-wall-designer.md`: add the primitive to the supported-primitives list and a row to the "Visual primitives" table. `references/working-wall-visual-language.md`: add it to the primitive lists there. An unlisted primitive is one the designer believes it cannot draw — so it ships a wall of words instead of the picture, the exact gap this checklist exists to prevent.

A reference-table cell or a card `visual` then carries `{ "type": "<type>", … }` and the wall draws it.

---

## Stick-in pack - every place to wire it (for a write-on figure)

A stick-in piece renders from the same `shared/visuals/<name>-svg.js` module, so the wiring is short once that exists. Wire this only for a **write-on** figure — one the child marks, sorts, labels or draws on rather than reads and answers from.

1. **The visual registry** — `stick-in-sheets-html/src/visual-registry.js`: add `<type>: { tightSvg: <name>.tightSvg, defaultWidthMm: … }` to the `VISUALS` map (or `ROW_VISUALS` for a `<type>-row` strip of figures, each with its own write-on line). A figure that needs bespoke handling (a base directory for a photo, a reserved label band) dispatches through an `item.visual === "<type>"` branch in `stick-in-sheets-html/src/render-piece-html.js`'s `renderPieceHtml` instead, mirroring `label-diagram`. Size by the smallest comfortably-usable size so the most copies fit a page.
2. **The supported-visuals list the stick-in-sheets-designer reads** — `references/stick-in-sheets-pedagogy.md`, the "supported visuals" list under the spec section. Add a `<type>` entry with its `spec` shape and a one-line purpose, mirroring `venn` and `label-diagram`. This is the only place the stick-in-sheets-designer learns the piece exists; an unlisted one is a write-on moment it leaves off the pack, so the book loses the figure even though the builder could draw it.

The stick-in-sheets-designer then emits `{ "visual": "<type>", "spec": { … } }` for that moment, copying the figure field-for-field from the slide that shows it so the glued piece matches the board.

---

## Hand the helper over

The build ends here. Write the drop-in complete, under `[WORKING_DIR]/pending-helper/<name>/`, laid out exactly as the package is laid out, and beside those files write `install.json` and a plain-English `README.md`.

`install.json` is what the installer reads. Its shape:

```json
{
  "schemaVersion": 1,
  "name": "rainfall-graph",
  "kind": "drawn",
  "summary": "A rainfall bar chart that redraws itself from a lesson's monthly figures.",
  "surfaces": ["slides", "worksheets", "wall", "stick-in"],
  "files": [
    { "from": "shared/visuals/rainfall-graph-svg.js",
      "to": "shared/visuals/rainfall-graph-svg.js",
      "action": "add" }
  ],
  "wiring": [
    { "file": "builder/src/content/index.js",
      "change": "dispatch type 'rainfall-graph' to drawRainfallGraph" },
    { "file": "shared/visual-parity.js",
      "change": "add the rainfall-graph row: slides true, worksheets true, wall true, stick-in true" }
  ],
  "unproven": ["npm run check", "slide render", "worksheet render", "wall render", "stick-in render"]
}
```

`kind` is `drawn` or `stock`. `surfaces` lists only the surfaces the helper actually serves. `files` carries every whole file you wrote: `from` is its path inside the drop-in folder, `to` is its destination inside the package (write them the same, so installing is a copy), and `action` is `add` for a new file or `replace` for a file you rewrote wholesale when growing an existing helper. `wiring` carries every surgical edit to a file that already exists - a dispatcher line, a catalogue entry, a registry key, the `shared/visual-parity.js` row - named file by file with the exact change, because those are the edits nobody can guess and the ones a missed wire hides in. `unproven` lists each check that has not been run, by name and surface.

Then run:

```bash
python3 "[PLUGIN_ROOT]/scripts/install-pending-helper.py" check --pending "[WORKING_DIR]/pending-helper/<name>"
```

Require `PENDING_HELPER_OK`. It proves the manifest is complete, that every file it lists is really there, and that every destination lands inside the package. It does not prove the picture is right; nothing at build time can.

**Do not bump a version, commit, or push.** Those belong to the install, where a person has seen the drawing.

---

## Verify by looking, not by the log

A clean build log means the builder didn't choke — not that the page looks right. Always render and *look* — **and look once for every renderer the helper serves, not only the one that triggered this build.** A helper is almost always commissioned from one place (a slide that needs it now), and the natural pull is to prove it on the board and stop. But the wiring you did in step 4 spans every renderer, and the renderer you don't render is the one that silently ships text where the picture should be — most often the working wall, because its lesson usually surfaces on the board first. Treat "I have seen this figure render on each engine I wired it into" as the bar for done.

**Render every surface through `scripts/render-pages.py`, not by hand.** It turns
a built `.pptx`, `.docx` or `.pdf` into one PNG per page. Probe the machine's
render routes once, then render each artefact against that route file:

```bash
python3 "[PLUGIN_SOURCE_ROOT]/scripts/render-pages.py" --probe-route "[a scratch dir]/render-route.json"

python3 "[PLUGIN_SOURCE_ROOT]/scripts/render-pages.py" "[the built file]" "[a scratch dir]/render" --route-file "[a scratch dir]/render-route.json" --manifest "[a scratch dir]/render.json"
```

Reach for it instead of driving PowerPoint COM or pdftoppm yourself. Neither can
open a path over 255 characters, and a lesson working directory a few folders
deep passes that mark easily, so a hand-rolled export fails on the workspace
rather than on the helper. The script converts inside a short scratch directory
and copies the page images back, so a deep workspace renders like a shallow one.
Then look at the PNGs it writes.

- **Slides:** build the deck, render it, and inspect the slides that carry the helper. Confirm the figure is correct *and* large — if it floats small in its slot, the no-deadspace work isn't done.
- **Worksheets:** run `node worksheet-html/scripts/build-worksheet.js <worksheet.json>` on a small spec that uses the helper, confirm the page-fit line, then render the PDF and confirm the figure prints at a readable size. Where the helper can sit inside a `stack` or a `row`, render it that way as well as standalone.
- **Working wall** (whenever the helper serves it): write a tiny `working-wall.json` with one card carrying the new `visual`, run `working-wall-html/build.js`, and look at the figure on the page it actually ships on. The build writes a PDF (`Working Wall - [Topic].pdf`); render it and look at those pages. A card that builds with no error but shows only step badges and text is the silent-skip failure: the primitive isn't reaching the wall, usually because a wiring step (the SVG registry, the key registry, or one of the designer's two catalogues) was missed.
- **Stick-in pack** (whenever the helper serves it): write a tiny `stick-in-sheets.json` with one item carrying the new `visual`, run `stick-in-sheets-html/build.js`, and look at the same way. The build writes a PDF (`[Topic] - Stick-in Sheets.pdf`); render it and confirm the figure is in its write-on (blank) form and prints large enough to mark on.
- **Look at it with content you did not design it around.** The example you built the helper on is the one case already tuned to fit, so it proves the least. Render it again with the longest labels a real lesson might plausibly send, with a different number of items, and with the parts a lesson might leave blank for a child, and look at each. Anything that clips, collides or floats means the layout is still hand-placed: go back to *Lay the drawing out from its own content*.
- **A quick standalone check** of a figure helper — render a handful of representative cases (for an angle: a sharp acute, a near-right acute, a right angle, an obtuse) into bordered cells and look at how much of each cell the figure fills — catches both geometry bugs and leftover deadspace before a full lesson build.

**Run the guard as the mechanical complement to looking.** `npm run check` (in `builder/`) runs the catalogue and parity guards: it confirms every surface you declared in the manifest is actually wired, and that no live wall/stick-in/slide figure is missing from the manifest. Looking proves the picture is *right*; the guard proves the slide, worksheet, wall and stick-in wiring is *complete* - together they close both halves. A red guard names the exact surface still missing a wire. The guard proves the worksheet key is registered; `npm test` and `npm run check-render` in `worksheet-html/` prove the worksheet behavior and rendering.

---

## Finish every install

This runs when a person installs the helper - `/install-helper` over a drop-in, or `/edit-templates` working straight in the checkout. Not at build time.

1. **Run `npm run check`** (in `builder/`) and confirm it is green - both guards passing is the sign the manifest and every renderer's wiring agree. A red guard names the exact surface still missing a wire, and it is the silent-skip caught at the cheapest possible moment. Fix it, or send the helper back, before anything below.
2. **Look at every surface the helper declares**, exactly as *Verify by looking* sets out. A drop-in arrives with nothing rendered, so this is the first time anybody has seen the picture. A figure that clips, collides, floats small in its slot or is simply wrong about the world is not installed - it is repaired here or refused here.
3. **Bump the plugin version** in `[PLUGIN_SOURCE_ROOT]/.claude-plugin/plugin.json` and `[PLUGIN_SOURCE_ROOT]/.codex-plugin/plugin.json`, setting both to the same next minor version - the designers read the plugin from a version-pinned cache, so without a bump a new helper stays invisible on the next real lesson until the cache expires.
4. **Commit and push, once the teacher has said to.** The checkout above the package is its own git repo and deploys to the marketplace from `main`, so a push puts this drawing in front of every lesson anyone builds. Show what changed and what the guard and the renders said, and let the teacher answer. Never commit or push on your own judgement.
5. **To use the helper in a lesson running *now*** (before the cache picks up the new version), pass `PLUGIN_ROOT: [PLUGIN_SOURCE_ROOT]` to the affected designers and builders, run `node "[PLUGIN_SOURCE_ROOT]/builder/build.js" …`, and tell the designers to read the catalogue from `[PLUGIN_SOURCE_ROOT]` so they know the helper exists.
6. **When a lesson already rendered with the fallback, regenerate every output that used it - not just the one that surfaced the gap.** A missing helper degrades every renderer at once (slides, worksheet, working wall all shipped the text or typed-mark substitute), but the gap is usually noticed on one of them, and the pull is to rebuild only that one. The others keep the substitute until someone looks at each in turn. So once the helper is live, re-run the designer and builder for every renderer whose output carried the fallback, and look at each - the same "prove every renderer" bar as the original build.
