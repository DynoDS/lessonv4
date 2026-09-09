# Build review log

## 2026-09-08 Part-whole circles sized from their numbers (4.2.115)

Daniel: "whats up with the part whole model, that didnt work, too small". It printed "3,000" inside a circle as "3,00" over "0" - a four-digit number broken across two lines, on a slide teaching four-digit numbers.

The circle was sized from the zone alone, the label size was then guessed from the diameter and tapered by `3 / charCount`, and the result was clamped up to a 10pt "minimum" that was never checked against the circle it had to sit in. So the minimum did not mean "small but legible", it meant "overflow quietly": at 10pt "3,000" is wider than the 0.39in circle it was placed in, and PowerPoint wrapped it. The taper was also wrong on its own terms, pricing a comma as a digit.

The zone was the underlying fault: 7.75in wide and 1.27in tall. An upright model cuts its circles out of the HEIGHT, so nearly eight inches of width sat unused while the circles were starved. Nothing caught it because nothing measured the label.

The label is now measured with the shared glyph-width table, the font is the largest that genuinely fits the circle's inscribed width, and a zone that cannot seat a readable label is refused by name with the size it needs - the contract place-value-chart and table already keep. The documented flat floor of 1.4in square was itself wrong and now says what it depends on: single digits are happy at 1.4in, four-digit labels need about 2.4 x 2.5in upright or 2.4 x 1.9in on their side.

The reported deck's slide 4 was repaired against the new refusal: the model was laid on its side, which needs about 0.6in less height, and the stack rebalanced 1.2/0.7 to 0.95/1.2. Two of the five new regressions discriminate against the old renderer; the other three are invariants a roomy zone already satisfied.

## 2026-09-08 Number lines fill the card, and stacked lines say which they are (4.2.114)

Follow-up to 4.2.113, decided by Daniel against a mock deck showing both options side by side. He picked the fuller of the two.

A number line is a thin thing: one line and its numerals need about half an inch, and a My Turn card is often seven times that. Capping the drawing at its natural size banked all of that as white space and left the numerals smaller than the card could afford, on exactly the slides with the most room. The drawing may now grow up to 1.6x. The zone still binds first, so a crowded card is unaffected and only genuine surplus is given back, and room is kept above and below the axis because a My Turn line gets written on.

Stacked lines are now named A, B, C down their left edge by default. The reported deck asked "Line B: what number does Q show?" over three unnamed lines, so a child had to work out which line was B before starting the maths. Naming is the default rather than a field a designer sets, because forgetting it is invisible in the spec and only shows up in front of a class; `lineLabel` renames one and `lineLabels: false` turns them off.

One test had to change rather than pass: it compared a stacked arrow against a single-line arrow as a ratio, and a lone line may now grow, so the ratio moved for reasons unrelated to the stack. It measures the stacked arrow absolutely instead - 0.141in when this was reported, 0.180in now.

## 2026-09-08 Number line numerals that can actually be read (4.2.113)

Daniel reported that the arrows, axis numbers, the red marker and the green answers on a number line all looked too small. They were: on one axis a "0" printed at full size next to a "10000" at well under half of it, and the words in the question box beside them were roughly twice the height of either.

Two independent causes, which is why a previous repair that raised the font ceiling from 14pt to 24pt changed almost nothing. Every axis label was drawn in one fixed 0.55in box, so a numeral's rendered size tracked its DIGIT COUNT and the fit pass silently shrank whatever overflowed; on a Year 4 four-digit deck that is every number on every line. Separately, a stacked line claimed a flat 2.00in of height whether or not it carried an arrow or an answer, so a pair of bare endpoint lines "needed" 4in and three arrowed lines were scaled to 54% - numerals, arrowheads, dots and ticks together.

The renderer now measures every label with the existing shared glyph-width table, insets the axis so the end labels sit inside the zone at full size, charges a line only for the bands it carries, and holds the numerals to a 14pt floor by taking a deep stack's room out of the arrows and ticks instead. Spare vertical room goes between stacked lines rather than being banked below them. A crowded axis shrinks WHOLE - one size for every numeral on the visual - because letting each label take the size its own digits allow is the original fault in miniature. Eight of the reported deck's eleven lines now draw at the full 24pt.

Three further changes came out of reviewing a mock deck with Daniel. Axis numerals print with thousands separators, because the question said "Mark 3,000" over an axis reading 3000 and Year 4 is where that convention is taught. Ticks are taller and slightly heavier, since counting the equal intervals is the step of the method actually performed on them. And **three stacked lines is now a hard maximum**, refused by name: the guidance said "clearest at around three rather than five" and a run built five, at which size no other repair helps.

The printable `number-line-svg` helper already measured honestly and inset its axis, so the fault was confined to the slide renderer. Eleven focused regressions pin both original causes, the floor, the separators, the line cap, and the one case that should still shrink a numeral.

Also found: the render probe reporting no PPTX route was a false negative. Re-probing the same machine found PowerPoint immediately, and the run had already rendered all fifteen slide pages ten minutes before the final review declared them unrenderable - it read `render-route.json` and stopped while a current page manifest sat beside it. A deck shipped UNVERIFIED with its own evidence on disk.

## 2026-09-08 Memorable criteria without arbitrary ceilings (4.2.112)

Daniel clarified the purpose: "short and sweet, easy to remember, easy to repeat and call back." Neither eight words nor five steps is an absolute limit, provided the complete method can be displayed usefully. A simple condition may stay inline. This supersedes the numerical ceilings recorded below, not the preference for concise cues.

The design validator still checks structure and nonempty content, but no longer rejects a necessary action solely by word or row count. The existing review view exposes long wording/list cues and both true and false `drawLive` decisions. The designer, voice guide and reviewer now judge familiar, runnable callbacks; count cues are neither automatic failures nor excuses for verbose prose. Contradictory examples and the assertion that every condition needs a table were reconciled.

The existing fixed and free success-criteria panels already render six or seven short steps, so no second layout engine was added. Their real fitting gap was later: the steps helper calculated an 18pt initial floor but did not transmit it to final autofit. It now does. The placement guidance protects the complete method, question and working space, and routes genuine capacity failures instead of cutting steps or inventing a second concept.

The live-drawing check now binds each cue to its own source via optional `criteriaRef`, validates the displayed content and the supported flag location, and rejects an invented cue even when another criterion is legitimately marked. Unambiguous older panels infer their source from content. It deliberately does not decide pedagogically whether a method should be marked; that decision is now visible to the reviewer.

The cumulative-learning instructions already contained a substantial forward transition check. The focused addition distinguishes carrying learning from merely reusing a resource or a callback phrase, tracing a representative final performance backwards and then forwards. Parallel cases contributing to a later comparison remain valid. The concurrent 4.2.111 release and its existing `unlocks` field are preserved; this repair uses that line and the actual teaching rather than adding a second per-beat report, an extra agent or an automatic Apply slide. The new behavioural calibration cases are examples for review, not evidence that a model has passed a classroom evaluation.

Verification before integration with concurrent 4.2.111: 205 targeted Python tests passed, including the complete design-review packet and lesson-design contract tests; 11 focused steps/panel tests passed. The two-slide `criteria-callbacks-smoke.json` built without warnings, passed the cue handoff, and was rendered and visually inspected with Comic Sans MS loaded: all six/seven steps, the task, number line and modelling space remain usable. This is a layout fixture, not a generated-lesson effectiveness trial. The broader local builder check also exposed existing picture-guard failures and two stale documentation assertions; each was reproduced on the untouched starting snapshot. They are not silently treated as a clean whole-repository pass and are outside this criteria/progression repair. The full Node test run passed 526 of 528 tests, with only those same two baseline assertions failing. The full Python run passed 1,290 tests and 1,641 subtests; of four failures, three were reproduced on the untouched snapshot (picture guard, an old reviewer effort assertion, and an old voice-guide name assertion). The fourth expected the long criteria example replaced here; its expectation now follows the short callback, and that entire 18-test file passes.

## 2026-09-08 The research read, and the eight things it was still owed (4.2.111)

A deep research report on dependency-based instructional coherence was read against the plugin, point by point, and every claim traced to the file that owns it.

**Most of it was already here, and was left alone.** Working back from the final performance, supplying a missing referent before relying on it, each major beat changing the state of the lesson and the next building from it, semantic completeness in place of a rule against two Teach slides in a row, the pairing test, all-pupil commitment, diagnostic checks that resist surface cues, guided versus unguided discovery, demand that climbs without a staircase, variation theory in skill practice, variety not counting as a justification, vocabulary at its point of need, and the reviewer's beat-by-beat dependency read. Several of these had been repaired in 4.2.109 and the first draft of this analysis was written against a stale copy of the plugin that still lacked them.

**The selector was the real gap, and it explains the complaint.** Every place that told the designer how to choose a Do beat carried the same four-way map: a fact suits recall or a sort, a process labelling or sketching, a concept writing or generating, a value ranking or talk. A taught explanation, meaning a cause, a mechanism, a reason or a relationship, is the commonest chunk in a content lesson and has no entry in that map. It falls to "concept", and "concept" routes to writing a sentence about it, which is the one response a child can produce without using the explanation at all. The catalogue could not rescue the choice: a count of all sixty entries found no because-sentence, no prediction the taught idea decides, no words-to-diagram or diagram-to-words, no inference from evidence and no connection back to earlier learning. `preferences.md` now says what each kind of chunk needs, including explanation, evidence and a new idea joining an old one, with the boundary that a deliberate short recap is still right when the design says why; `do-beats.md` gains section 10 with those ten formats.

**The spine is now recorded, not only judged.** The principle that a beat changes the state of the lesson lived in guidance and in the reviewer's head, and nothing in `lesson-design.json` held it, so it was never visible to the teacher and never checkable. Every source unit now carries `unlocks`: one line of at most 200 characters naming what children can now do that a later part needs, written forward, with `null` a real answer for a beat beside the spine. The validator refuses a missing field, a blank line, a paragraph, and a sequence where every beat unlocks nothing. The reviewer's view prints the line even when it is absent, because a field that only renders when filled hides the case the reviewer is looking for.

**Five smaller repairs, each a point the research made and the plugin missed or contradicted.** A check that gates the next part now names what the likely wrong answers mean and the move that answers each, while the teacher keeps ownership of how responses are gathered. Ending the lesson successfully is separated from having learned it, so the design may name what has to come back without inventing results, thresholds or tomorrow's lesson. A recall beat thirty seconds after the answer was given is no longer sold as durable retrieval; its honest value is the processing and the read on the class. A repetition now has to change something (fluency, a moved feature, a discrimination, retrieval, a connected representation, less support, a new case), and that reaches content lessons rather than only maths. Partner talk gives each child a moment to settle their own answer first where the beat is the lesson's evidence, and goes straight into the pair where the talk is there to generate. A manipulative earns its place by having its objects and actions connected to the idea and by being planned to leave. A word gets the investment its job needs rather than the same middling treatment, and a card set is not sold as vocabulary growth. And the modelling section's blanket ban on "have a go first" now names the unstructured version only, keeping modelling first as the default while permitting the designed problem-first opening the plugin's own bounded-observation and flawed-example routes already used.

**What is established and what is not.** 1,344 tests pass, including 56 new ones that check the rules reach every agent that could break them and that the validator actually refuses each violation at its enforcement point. Two tests were already failing before this work and still are. No live lesson was run. Eleven recent designs were scanned for the summary-shaped pupil task the research predicts and none was found, so the selector repair closes a gap in the available choices rather than a defect visible in every lesson. The next real content lesson is the check, and the first thing to read in it is whether the `unlocks` lines are written forward or filled in afterwards.

## 2026-09-08 Criteria wording, and the draw-live cue that never fired (4.2.110)

Two things the teacher raised after reading the four decks, traced before changing anything.

**The flipchart cue had never once reached a lesson.** The easel drawing is in the builder, the green panel draws it whenever a slide's criteria carries `flipchart: true`, the working wall already reproduces a flagged reference, and a test lesson proves the render. Across 31 distinct designs between 25 August and 8 September, `drawLive: true` appears in none of them. Three reasons stacked: the rule reserved the marking for a labelled category set and said in as many words to leave procedure steps unmarked, so the exchange method the teacher writes up by hand was excluded by definition; the slide-designer role never mentioned the flag, so a design that had set it would have lost it at the handoff anyway; and the design reviewer's compact view does not print the decision, so nobody downstream could miss it. The first two were repaired in 4.2.109. This release adds the check that would have caught the third: `check-drawlive-handoff.py` compares the design with the built slide specification at the slide gate, names the slides that should have carried a marked criteria's cue, and refuses a cue on a lesson whose design marked nothing.

**Criteria steps had drifted long, and the drift is datable.** Across 113 recent steps the median is 5 words, but 47% run past 5 and 12% past 8; August averaged 5.0 words a step and September 6.1, with the circuits lesson at 10 to 14. The panel fits about five words to a line at the size it is read from the back, so a longer step wraps and reads as a sentence. The cause is in the guidance. The old plugin said "2 to 5 words, under 8 at the absolute outside" and "no explanation or reasoning, that belongs in speaker notes"; when this file was created on 28 August both lines were lost, and on 1 September the circuits repair added a validator cap of 12, which lets a step run to twice the aim and pass. Every one of the 14 steps over 8 words in that sample carried one of three things that belong elsewhere: the reason (taught on the Teach slide), an alternative (`the lamp or buzzer`, four times down one list, when the teacher can say which the class is using), or a condition (`Subtracting with no thousands?`, which is a branch and belongs in a lookup row beside the steps). The ceiling is 8 again, the validator refuses past it and names those three tells, and the mechanics carry the contrastive pairs back. The voice guide's own worked example was a 13-word criterion offered as good practice; it now shows the short form beside it.

## 2026-09-08 Four decks traced against the teacher's preferences (4.2.109)

The balanced diet, children's lives, 1,000 more/less and number line decks (Codex, 4.2.107/108) were traced through their runs against the preferences analysis. The record is `output/lesson-v4-preferences-analysis-2026-09-04/deck-investigation-2026-09-08.md`. What 4.2.109 changes:

- Action verbs were painted question blue. `core-action` and `task-action` rendered in house blue, while the visual profile said instructions stay black; a PSHE task sentence went out in four alternating blue and black chunks. Both roles now render bold in the line's own colour. Rebuilding the diet deck put slides 5, 8, 11 and 17 back in black with the one real question still blue.
- A practice question shrank to 10pt beside a 23pt criteria table because its fit name carried no floor. Numbered-question text now names its 14pt floor, so the history deck's slides 13 and 14 stop the build with `TEXT_OVERLOAD` instead of shipping.
- A two-paragraph model answer was half green: the `||` reveal is per line. A block that opens with the marker and carries no other is now green throughout.
- A green vocabulary word after a line break split its paragraph, because emphasis runs were not cut at newlines the way marker runs are. They are now.
- Success criteria authored as a sentence table (history) or six conditional steps (1,000) drove the panel taking half of every slide, the nutrient table wearing the criteria label (diet) and the Your Turn fragmenting into one-calculation slides. The design validator now refuses a sixth step and a table cell past eight words; the preferences say criteria are what the child does or what good work shows, a table of facts the task uses is a representation, and a branch is a lookup row. The design reviewer reads the object, not its id.
- The draw-live cue was reserved for labelled category sets and never reached the slide designer as a field. It now covers a method children run across a sequence of lessons too (the exchange steps the teacher wrote up by hand), the slide designer maps `drawLive` to `flipchart`, and the wall reproduces either.
- The timeline helper printed a "not to scale" note its documentation example taught. The teacher wants none: the note is refused by name and the catalogue shows how to place marks in proportion to real dates.
- The PowerPoint render probe asked only the interpreter running the script; Codex's bundled Python has no `win32com`, so three runs recorded no route on a machine that could render. The probe now tries every interpreter it can find, records the one that answered for the conversion, and names a missing module instead of reading it as absence.
- Preferences recorded from the teacher's answers: slides are written as if the notes are never opened, so a later check's answer must have been visible; every vocabulary card carries a visual; two questions never share a paragraph; a decoration may take a genuinely clear area at the same fade, and is judged at its placed size.

## 2026-09-06 Partition 4-digit numbers

- Final slide review found that slide specifications using the key `notes` produced a deck with empty speaker-note bodies because the fixed builder reads `speakerNotes`. Renaming only the slide-level key on all 15 slides preserved the note text and produced a reviewed PASS after rebuilding.

## 2026-09-01 - Year 4 Geography Lesson 1 (rebuilt deck, read)

- Maps came out a fraction of the size their cards had room for, and nothing measured it.
  *Addressed 1 Sep 2026. The opening map filled 46% of its card and the
  world-to-continent zoom 33% of its, with the rest white. The containment is
  right - stretching a map draws countries the wrong shape - but when the slot's
  proportions are far from the picture's, containing it leaves the remainder
  empty and nobody was looking at that number. Worse, the optional-picture pass
  then decorated the space, because to that pass empty space is an opportunity
  rather than a symptom: slide 9 got a grey map pin in the room its map should
  have been using. `FIGURE_ZONE_UNDERFILLED` now reports any contained figure
  covering under 60% of its slot, names the axis being given away and both
  shapes, and says plainly that stretching is not the repair. Advisory like the
  capacity checks beside it, because a better-shaped slot is a composition
  decision. Replaying the deck raises it on seven figures across six slides and
  stays silent on the rainforest slide, whose card already fits its map.*
- The starter's answer slide named three things and left the map marking one.
  *Addressed 1 Sep 2026 in the Slide Designer. The question marked one continent
  and asked for it, the ocean to its east and the continent to its north-west;
  leaving the other two unmarked on the QUESTION slide is correct, because
  finding them by direction is the geography. The answer slide then printed all
  three in green over the same single mark, so a child who guessed wrongly had
  nothing to check against and the one place the answer was visible stayed
  silent. An answer asked on a figure is now shown on that figure.*
- The one continent that was marked was hard to see.
  *Addressed 1 Sep 2026 in templates.md. A thin dashed outline round South
  America on a map at half its card's width is a line a class has to hunt for,
  and a starter whose first job is finding the thing being asked about has failed
  before the question starts. Where the mark is what the question turns on,
  shade it: shading survives being small, an outline does not.*

## 2026-09-01 - Marking a figure, package-wide

- Only six of 57 figures could be pointed at, and each of the six had invented its own word for it.
  *Addressed 1 Sep 2026, after Daniel asked what else the engine should learn to
  draw. A survey of every figure found marking on the map (`annotations`), the
  grid map (`highlightSquare`), the rainforest layers (`highlight`), the
  place-value chart, the geoboard (`emphasiseVertices`) and a labelled photo -
  one idea, six spellings, and fifty figures a teacher could not point at at all.
  Nothing in `helper-authoring.md` mentioned marking, which is why a new helper
  kept arriving without it.*
- The survey turned up a distinction worth writing down: there are two kinds of marking and confusing them would be silently wrong.
  *POSITIONAL marking belongs to a picture that is fixed and real - a map, a
  photograph - where a mark sits at a position and the position means something.
  SEMANTIC marking belongs to a figure the engine draws from the lesson's own
  data, where the layout moves whenever the data does, so a mark must NAME a part
  and let the figure find it. A ring placed 40% across a bar chart survives every
  check and ends up round the wrong bar the moment a value changes. The six
  existing implementations had all got this right by instinct; none of them had
  said so. `shared/visuals/figure-highlight.js` now owns the semantic half: one
  colour, one fade, one word (`highlight`), an unknown part name refused by name
  rather than ignored, and highlighting every part refused because it points at
  nothing. Wired into venn, carroll, tally-chart and pictogram, which between
  them reach the board, the sheet, the wall and the child's book from one change
  each.*
- The map could draw a route but not which way anything went.
  *Added 1 Sep 2026. `arrow: true` on a line puts a head at its end and
  `arrow: "both"` at each end, on the board, the printed sheet and the world map
  presentation. Movement is half of what a primary map is asked to show - a
  migration, a river's flow, a trade route, an invasion - and a line without a
  head draws the path while omitting the teaching. Only a line takes one: an area
  is a place rather than a journey and a point has no direction.*
- Still to do: bar chart and line graph.
  *Recorded 1 Sep 2026 rather than rushed. They are the two most-used figures of
  the set and they want highlighting most, but each has three separate
  implementations (a PowerPoint-native slide renderer, a worksheet renderer and
  the shared SVG the wall draws), so wiring them is a different size of job from
  the four done here and deserves its own pass.*

## 2026-09-01 - Year 4 Geography Lesson 1 (rebuild)

- The rainforest distribution map came back `unsatisfied` after two searches, and the run was about to build slides 6, 7 and 8 without it. Slide 6 is called "Spot the rainforest pattern".
  *Addressed 1 Sep 2026. Daniel's objection was the right one: the deleted
  schematic map produced a good teaching picture, and the only thing wrong with
  it was the fake coastlines. Everything else - shaded rainforest belts, a key,
  the Tropics, continent names - was correct and wanted. So the picture moved
  onto the real map rather than being lost with the helper that drew it badly.
  Three things were missing and all three were omissions rather than limits. The
  seven-continent world presentation ignored `annotations` outright and said
  nothing, so a lesson could hand it rainforests and get a bare world back; it
  now draws them. An `area` could only be outlined, which says "somewhere in
  here" where the lesson means "this whole area is the thing"; `shaded: true`
  now hatches it, hatched rather than solid so the coastlines and borders
  underneath survive a grey photocopy. And there was no key, so nothing could
  say what a shading meant; `key` adds a band under the map using the same
  hatch. The plain slide map draws PowerPoint shapes and cannot fill, so it
  refuses shading by name rather than quietly returning an outline.*
- Positions on the world map can now be given in real degrees, and should be.
  *Added 1 Sep 2026, because "how trustworthy is this?" is the right question to
  ask of a region placed by eye and the honest answer was "not very". A picture
  fraction is a guess only a render can check; a first attempt at the Amazon in
  fractions landed in the Pacific. Degrees are a fact this kind of author knows
  well, and `world-with-antarctica` is a full equirectangular world, so the
  conversion is exact arithmetic. Verified by rendering London, Cairo, Manaus and
  Sydney from their real coordinates: all four land on the right place. Degrees
  are refused by name on every other shipped map, because those are crops whose
  edges nobody recorded, and a degree converted against numbers we do not have is
  worse than a fraction since it looks precise.*
- The fallback ladder gave up several rungs early: a dead picture went almost straight to words.
  *Addressed 1 Sep 2026. The Slide Designer's degradation route had two rungs, a
  faithful helper then the slide's own words, and the missing middle rung is the
  one that matters most: a real base the package already holds, marked up. A
  lesson usually needs a visual showing where or what something is rather than a
  picture of it, and marks are what do that. The ladder now names that rung
  explicitly and says words are last. The helper check's `gap` decision carries
  the same test in four lines, because "no published picture exists" was being
  read as "this cannot be shown".*

## 2026-09-01 - Year 4 Geography Lesson 1 (deck review)

- Slides 1, 2, 6, 7, 8 and the practice slides drew a schematic world map instead of a real one, and it looked good enough that nobody questioned it until the finished deck was read.
  *Addressed 1 Sep 2026, and the fault was not the routing. `world-geography-map`
  drew its continents from longitude/latitude pairs typed to look about right,
  which is the one thing `map-annotations.js` says the package will never do. It
  shipped anyway because the parity guard accepted `projection:<name>` as a
  source and the helper declared `projection:equirectangular-lonlat` - a
  genuinely real projection over invented coordinates. No allowlist of
  projection names could have caught that: the name was already correct. A
  projection is how coordinates are transformed, never where they came from, so
  the prefix is now refused outright and the only sources are `data` and
  `asset:<folder>` - something on disk. The helper is deleted from every
  registry. Its three configurations go to the routes that can be right about
  the world: continent retrieval to the real write-on world map (now also the
  stick-in piece, so the map in a child's book is the one on the board), the
  Equator and both Tropics to `seven-continent-world` where they are computed
  from the asset's own equirectangular geometry, and biome or rainforest
  distribution to the picture route as a real thematic map, which the
  `substitute` check added earlier the same day now holds to a contract
  filename. Regression tests in `map-annotations.test.js`,
  `map-slide-world.test.js` and `render-visual.test.js`.*
- Slide 15's South America map was unreadable: ten label pills printed on top of one another across the map they were naming.
  *Addressed 1 Sep 2026. The marks were fine and a lower ceiling would have been
  the wrong fix - eight countries plus two overlays is a reasonable thing to
  want. The map simply had half a body row, so South America's proportions fitted
  it about 2.4in wide, and a board label pill is 0.82 to 1.62in because it has to
  read from the back of the room. The layout searched for clear positions,
  failed, and fell back to the preferred spot for every one it could not place -
  silently. It now marks what it could not place and the renderer refuses with
  `MAP_LABELS_DO_NOT_FIT`, naming the labels and the three ways out. The same
  spec given the whole body still draws, which is the point: the fault was the
  room, so the check is about the room.*
- The picture route was confirmed working as Daniel wants it and was left alone: a real source is preferred, `ordinary-real` falls back to generation, and a failed picture stage degrades to `PICTURE_STAGE: unavailable` and designs the deck without it rather than stopping the lesson.
  *No change, 1 Sep 2026.*

## 2026-09-01 - Year 4 Geography Lesson 1

- The installed package changed from 4.2.56 to 4.2.57 during the run; canonical outputs survived and the newer verified package completed the deterministic checks.
  *No engine fault, 1 Sep 2026: the package was reinstalled by hand mid-run. The run's own recovery was correct.*
- A promised substitute map route was recorded in helper coverage but no corresponding map filenames appeared in the photo contract, so slides fell back to the nearest live map compositions.
  *Addressed 1 Sep 2026, and the cause was two faults in one place. The verdict
  check that would have caught it lived only in `references/helper-route.md`,
  which is read only when a decision says `build`; this run's decisions were all
  `covered` and `substitute`, so the check never ran. And even when it did run,
  `substitute` needed only a reason, so a reason asserting "the approved picture
  contract supplies the exact teaching map" passed while the contract held
  nothing. The check's closing step now sits on the path every run takes
  (playbook Phase 1.5, "Close the check"), `substitute` names its contract
  filename in `picture` and the check resolves it against
  `photo-requirements.json`, and a new `gap` decision gives the genuine dead end
  somewhere to go that does not promise a picture nobody will source. Replaying
  this run's own `helper-check.json` against its contract now fails on both map
  decisions, before the freeze. Regression tests in `test_helper_coverage.py`.*
- One authentic worksheet riverfront photograph remained unsatisfied; focused repair successfully converted only that evidence card to text while preserving the confirmed aerial photograph and the intended reasoning task.
  *No change, 1 Sep 2026: working as designed. A documented Manaus riverfront is
  exactly the picture that must not be generated, `fallback_action: unsatisfied`
  said so, and the reconciliation route re-authored the one question. The route
  cost one focused repair and kept the sheet.*
- The Below worksheet exposed a 13-pixel rendered overflow not caught by JSON preflight; merging two adjacent instruction helpers fixed it without changing pupil-facing content.
  *No change, 1 Sep 2026: preflight measures the modelled page and the build
  measures the browser-rendered one, and 13 px of real-render overflow is only
  visible to the second. Moving a Chrome render into preflight would charge every
  design attempt for a fault one focused repair closed. Revisit if rendered
  overflow becomes a repeat finding rather than a single 13 px miss.*
- The run opened its branches in parallel and then serviced them one at a time. Five sourced photographs sat unpublished for 14 minutes and adaptation's provisional contract unbuilt for 12, both then running in seconds the moment an unrelated Slide Designer returned.
  *Addressed 1 Sep 2026, and the dependency graph was never the problem. The
  runtime's `phase3` slice - the one carrying "service each branch as it lands"
  - was named by no NEXT block, and `finalize` sits only behind it, so by the
  routing's own rule (a branch no NEXT block names has ended) the run ended when
  its last track did. A host with a large context inferred the tail and finished
  anyway, which is why this read as a slow run rather than a missing report. The
  three track-end slices now name `phase3`, and the servicing rule has moved
  forward into `phase2-core`, where it arrives before the first track opens
  rather than after the last one closes. Regression tests
  `test_no_slice_is_stranded_behind_a_door_nothing_opens` and
  `test_the_tracks_are_serviced_as_they_land_not_read_end_to_end`. Worth
  measuring on the next run: the worksheet branch is the run's longest pole and
  was held about 12 minutes of a 57 minute run.*
- The run report's picture stage read `attempting 2 pictures` for a contract of five.
  *Addressed 1 Sep 2026: `PICTURE_ASSIGNMENTS_OK` printed only the assignment
  count, and coherent pictures pack into one assignment, so the only number in
  front of the orchestrator was the wrong one - and that line goes verbatim into
  four designers' prompts. The marker now prints both counts and the playbook
  names which one the state line takes.*

Lesson runs append genuine engine findings here when a writable source
checkout resolves; the improvement pass reads them, fixes the engine, and
records what became of each entry. A run that cannot reach this file writes a
`pending-build-review-log.md` beside its run report instead, and the next
improvement pass folds those in.

## 2026-08-30 — Year 4 Maths: 4-digit ± 3-digit numbers

- Worksheet `column-method-grid` ignores both `showHeadings: true` and explicit
  `columns` arrays in rendered output; place-value headings remain absent
  although the spec requests them.
  *Addressed 30 Aug 2026: `showHeadings` is now rendered and measured
  (`worksheet-html/src/helpers/forms.js`), with the letters derived from the
  numbers' own width; regression test `column-method-headings.test.js`.*
- Working-wall no-photo cards retain the photo-column width, producing a
  substantial blank right-side band; the retained builder has no output-only
  override.
  *Investigated 30 Aug 2026: does not reproduce - the renderer reserves no
  photo column on a no-photo card, and the rebuilt page uses the full panel
  width. The band was the ragged right edge of left-set steps; the reviewer's
  dead-space standard now names that rag as not-a-fault
  (`agents/visual-reviewer.md`).*
- Working-wall ordinary spaces can collapse at particular line joins;
  non-breaking spaces restored canonical visible wording.
  *Investigated 30 Aug 2026: does not reproduce - the same spec with ordinary
  spaces renders correct spacing, and NBSP has the same printed width as a
  space, so the "fix" could not have changed the page. The likelier fault was
  pixel transcription at review DPI; wording-drift findings now require
  text-layer or 300 DPI confirmation (`agents/visual-consistency-reviewer.md`).*

## 2026-08-30 — Pending helpers from the batch

- The `map` growth (seven-continent world with Antarctica, globe-to-flat,
  continents-and-oceans worksheet form) was installed and proven on
  30 Aug 2026: the shipped `world.png` genuinely omits Antarctica, which had
  blocked the whole continents lesson.
- The `column-method-grid` drop-in was reviewed and NOT installed: its
  worksheet half hard-codes four Th/H/T/O columns, which would regress the
  2-digit grids the engine's own helper (now with `showHeadings`) derives
  correctly, and its slide half needs the same width-derivation before it is
  safe. Rework the drop-in before installing.
- The `water-cycle-diagram` drop-in remains waiting in its run folder; the
  substitute-picture route delivered that lesson, so installation stays a
  deliberate choice via `/install-helper`.

## 2026-08-30 — Year 4 PSHE: The importance of boundaries in friendships

(Folded in from the run's pending log entry.)

- Deck slide 6 still had overlapping pathway outcome boxes after the permitted
  owner repair and confirmation round (`DECK-001`).
- Printable Chrome packages were unavailable, so differentiated worksheet HTML
  and the answer key were delivered without a PDF or page-fit verification.
  *Addressed 30 Aug 2026: the preflight was passed as `ready` on a guess; the
  playbook now names the exact preflight command and output-to-state mapping
  (`skills/make-lesson/playbook-lite.md`).*

## 2026-08-31 — Year 4 PSHE: What is a balanced diet and why does having one matter?

- The working-wall nutrient reference table could not fit its required body-job wording within the builder's fixed two-line A3 table-cell cap. The permitted focused repair found no in-scope JSON change; the wall was excluded while the deck and differentiated worksheets passed review.
  *Addressed 1 Sep 2026 with the 1 Sep working-wall entry below: this is the
  same fault in the table renderer. The refusal now names the offending cell,
  its length and its column's character budget, so a repair aims at a number
  instead of guessing (`working-wall-html/src/layout.js`).*
- The Below worksheet's first build overflowed two zones; changing only that sheet to a landscape four-quarter layout resolved the clipping. Visual review then replaced one short response rule with a full-width handwriting line and confirmed all three pupil sheets and the separate answer key.
  *No engine change 1 Sep 2026: the run's own repair budget resolved this and
  the sheets shipped. Nothing to fix upstream.*
- Deck slide 6 initially merged setup and pupil-task colour semantics; a focused repair separated black setup text from the house-blue task, and confirmation found no regression.
  *No engine change 1 Sep 2026: repaired in-run and confirmed.*

## 2026-09-01 — Year 4 PSHE: What is a balanced diet and why does having one matter?

- Compiling an adaptation-only supplemental picture manifest from the merged requirements snapshot succeeded, but `validate-image-scout.py manifest` rejected it because it compares against the full deterministic partition and has no expected-filename filter. The Below sheet was therefore omitted; the Expected worksheet and answer key still built.
  *Addressed 1 Sep 2026: this was not a one-lesson accident. The compile side
  could narrow a snapshot to the filenames a wave owns and the validator could
  not, so every supplemental wave was unvalidatable and every adaptation
  picture in every lesson was promised to a worksheet and never sourced. Both
  sides now share one selector (`select_expected` in
  `scripts/compile-picture-assignments.py`), the manifest subcommand takes the
  same `--expected-filename` list, and the playbook spells out the command
  rather than leaving its arguments to be guessed. Regression:
  `scripts/tests/test_supplemental_wave_manifest.py`.*
- A subsequent zero-photo `promote-used` receipt did not remove the now-unused adaptation photos from the canonical contract. Provenance succeeded against the immutable initial contract, which exactly matched the four published pictures.
  *Investigated 1 Sep 2026: not a fault, and it was downstream of the entry
  above. Retention is the safe rule: a promoted filename can already have been
  published, and dropping it from canonical would orphan a picture's
  provenance. The worksheet only stopped referencing those two photographs
  because the wave that should have sourced them could not run.*
- The working-wall A3 layout again failed its 36pt/two-line cap after the single permitted focused repair, so no wall PDF was delivered.
  *Addressed 1 Sep 2026: the refusal said only that something at the floor size
  was too long. It named no card, no item and no target, so the one permitted
  repair was a guess, and it guessed wrong twice. Reproduced from the run's own
  `working-wall.json`: the sticky card was three characters over budget. The
  autofit refusal now names the card, the item, its length and the exact
  character budget, and the designer is given the budgets up front
  (62 characters on a card with a picture, 106 without) rather than only the
  36pt floor. `working-wall-html/src/layout.js`, `agents/working-wall-designer.md`,
  `references/working-wall-preferences.md`; the numbers are pinned to the
  renderer by `working-wall-html/test/doc-claims.test.js`.*
- Stick-in support could not reproduce the photograph-plus-three-response lunch-review frame and was omitted rather than weakened.
  *Open 1 Sep 2026: confirmed genuine - the stick-in renderer carries a
  photograph only inside a `labelDiagram`, so a photograph above plain response
  lines has no piece to be. The designer's refusal to weaken the task was the
  right call. Adding that piece is a helper-builder job, not a repair, and is
  left as a deliberate choice rather than folded into this pass.*

## 2026-09-01 — Year 4 Maths: the helper-gap picture route was closed to maths

- A maths run stopped at the design gate with `LESSON_DESIGN_INVALID: Maths
  lesson-design may not define initial photo-### requirements`. The helper check
  had found a visual the engine could not draw; its documented rescue is the
  picture route, which adds a `controlled-ai` picture and re-runs the design
  validator. The validator refused it and pointed at "the helper check's
  substitute route" as the alternative - which is that same picture route. The
  lesson could neither add the picture nor pass the gate, and every maths lesson
  meeting a drawing gap would have stopped identically.
  *Addressed 1 Sep 2026: the ban is removed from `validate-lesson-design.py` and
  `lesson-design-scaffold.py`, and from the two references that stated it as
  fact. The teacher settled the question: maths can have photographs. What the
  ban was protecting is real and is kept, moved to where it can actually be
  seen: no subject photographs a tool the engine draws, stated in
  `lesson-designer.md` with the two legitimate maths cases named (a real-world
  referent, and a picture the rescue route produced), and checked in
  `design-reviewer.md`. The subject-name rule ("Maths", not "Mathematics")
  stays on its own account, for filing and routing. Regression:
  `scripts/tests/test_maths_helper_gap_has_an_exit.py`.*

## 2026-09-01 — Year 4 PSHE balanced diet: teacher review of the finished outputs

- Three `speech-bubbles-1` slides put the judging question in the left column
  with the claim it asks about in the bubble on the right, so a child met the
  question before its own subject.
  *Addressed 1 Sep 2026: the template hard-coded the statement to the left and
  offered no side at all, so no designer could have fixed it. `statementSide`
  (`left` default, `right` available) now exists on the whole speech-bubble
  family; `slide-speech-and-characters.md` says which shape takes which side,
  and `preferences.md` carries the general reading-order preference, stated as a
  preference rather than a rule because the teacher named cases where the other
  order is right. Regressions: `builder/test/statement-side.test.js` and
  `scripts/tests/test_reading_order_left_to_right.py`.*
  *Corrected same day, twice. The first wording said "the thing they read first
  goes left, and the question about it goes right", which the teacher rejected on
  reading it back: he did not want every question pushed right on every slide.
  The second wording fixed the mandate but still anchored the rule to columns.
  He then gave the principle himself: the rhythm is claim or teaching first,
  question second, and that "doesnt neccessarily mean left and right. It could
  be top then bottom" - the left-right habit is downstream of children accessing
  a slide from the top left, which is also why he puts success criteria on the
  right. The preference now names the scan path, says the order is what matters
  rather than the sides, and derives the success-criteria habit from it instead
  of stating it as a second convention.*
- The Expected worksheet put its three steps in a 30% left column, pushing the
  photograph and all three questions into the 70% beside them and leaving a tall
  empty band under four short lines.
  *Addressed 1 Sep 2026: `side-70-30` already existed, so this was guidance, not
  mechanism. The settled column rules said where a stimulus goes and what the
  other column is for, and never covered support material. `preferences.md`
  (Worksheets) and the worksheet designer now place steps, success criteria,
  word banks and reminders after the work in the reading order, with the
  discriminating exception for a step list a child works through before
  answering. First written as "the right-hand column, never the left"; softened
  at the teacher's request into the split that actually matches the evidence -
  the side is latitude (right, or a band below), while the top-left corner
  belonging to whatever the questions read from is not, because taking that
  corner is what broke the sheet.*
- `rep-001/body-jobs` was recorded as covered by `concept-map` and the deck
  shipped a hand-built lookalike; only the orchestrator's post-build delivery
  check caught it, costing a repair worker and a rebuild.
  *Addressed 1 Sep 2026: the check reads the specification only and never needed
  the build. `helper-check.json` is now an authoritative input to both the slide
  and worksheet designers, each runs the delivery check at its own gate, and each
  is told that a hand-built lookalike is not delivery and that a promised helper
  takes its layout before the rest of the slide. The orchestrator's check stays
  as the independent backstop. Regression:
  `scripts/tests/test_helper_delivery_at_the_designer_gate.py`.*

## 2026-09-01 — Year 4 Maths: reverse-boundary modelling before independence

- The first design required pupils to find 10 or 100 less across a thousand in independent work without first modelling the distinct reverse-exchange case.
  *Addressed in the lesson design: the non-boundary model was retained, while the boundary model now uses 2,005 to teach reverse exchange and placeholder zeros before related guided and independent questions. The independent design review then approved the sequence.*

## 2026-09-01 — Year 4 Maths: live place-value counters and exchanges

- The slide `place-value-chart` helper could label place-value rows but could not show grouped counters, live add/remove moves, or exchanges through empty columns while preserving zero placeholders and unsolved inverse equations.
  *The lesson used three controlled-AI picture substitutes and completed unharmed. A tested slide-only extension is waiting at `pending-helper/place-value-chart/` in the lesson working folder for visual review and `/install-helper`; it is not installed in the package.*

## 2026-09-01 — Year 4 Geography: terminal pictures and working-wall tile validation

- Four real-only photographs used by two `photoMapOverview` wall cards finished `unsatisfied`. The focused wall repair followed its documented exception and removed only those unavailable `photo` fields; `working-wall.json` still passed its design validation and repair-scope check, but the builder then failed because every tile of this card type requires a readable photo. The repair route therefore spent its only round on a state the validator accepted but the builder cannot render. The focused role and validator need the same per-card-type requirement as the builder, or the repair must replace/drop the complete affected tile rather than its photo field alone.
- The installed package root updated from 4.2.64 to 4.2.65 after the shared Chrome preflight. The new root had no local PDF packages, so the first worksheet build returned `PAGE_FIT_UNVERIFIED` despite the earlier `CHROME:` state. Running the new root's own preflight installed its dependencies and the one infrastructure retry passed. A root refresh should invalidate or repeat the printable preflight automatically.

## 2026-09-02 — Teacher review of the Year 4 maths and geography runs (4.2.65)

Both decks, both worksheets and the maths wall were rendered and read page by
page against the teacher's own list. What follows is what the evidence showed
and where each repair was made; every one has a regression test.

- A calculation split across two lines in a narrow card, so `2,648 + 10 =`
  reached a class as a stacked sum whose digits did not line up. The fit pass
  sizes text by total height and refuses a size only for a single over-wide
  word, so two lines were always the bigger font. *Calculations now join with
  no-break spaces and the measurer respects them, so a sum shrinks rather than
  wraps; ordinary words around it still wrap.*
- The `✓ Success Criteria` heading wrapped to two lines in a sidebar panel.
  *Same mechanism, same fix: the heading is one unbreakable line.*
- The board objective was rewritten rather than shortened: a plan's `To describe
  and give examples of a biome and find the location and some features of the
  Amazon rainforest` reached the class as `To describe and give examples of
  biomes, and locate and describe the Amazon rainforest`. The preference asked
  for "the shortest form that preserves the learning", which reads as licence to
  reword. *`displayedLo` must now be `lo` word for word or its opening with a
  tacked-on tail cut at a natural join, enforced by the design validator.*
- Every judged claim was wrong, and the child making it was called Dev in run
  after run: the designer's own rule named Dev, and every reference example used
  him. *The scaffold draws four plain first names at random per run, and the
  designer weighs a claim's truth by what the lesson needs children to reason
  about; at least one judged claim in a lesson is right.*
- Success-criteria steps were true statements about the method rather than the
  method in the order a child performs it. *The step-writing mechanics now say
  to carry out the worked example with the steps and check each one can be done
  when it appears.*
- Map annotation labels and clue markers were around 8pt on the board, markers
  were drawn on top of the answer labels, and a shaded region was a dense hatch
  that hid the country under it. *Labels and markers are sized to be read from
  the back of the room, a name label at a marker's own point replaces the letter
  instead of covering it, the label layout keeps clear of markers, and shading
  is a soft translucent wash.*
- Sticky knowledge rendered black, indistinguishable from teacher talk. *It
  takes the objective's purple, in both places it is drawn.*
- A whole card was painted house blue where it first told and then asked, hiding
  the question inside the instruction. *The slide-design check refuses a
  whole-blue block that both tells and asks, before the build runs.*
- Taught vocabulary was green only on its own card. *A term this lesson teaches
  is vocabulary green wherever a child reads it.*
- Photograph captions wrote out the evidence the child was meant to find, under
  a task that asked them to find it. *The picture-repair roles may re-point a
  dead reference at a published picture, never replace it with a sentence saying
  what it showed.*
- A map sat above an inch of background with the task above it at 14pt. *A stack
  now hands back the height its hugged items do not use, and the picture grows
  into it.*
- A stack item weighted 0.55 landed 0.055in under the card threshold and lost
  its white card while every other line on the slide had one. *A text block that
  measures shorter than its zone keeps its card at any height.*
- The worksheet's place-value counters wrapped two per row and spilled into the
  question: the column allowed half a millimetre for a border that costs 0.8mm.
  *The border is paid for in both the width and the measured height.*
- The worked example row of a recording table came out five times the height of
  the rows below it, because it was the only row without an explicit height in a
  table that stretches. *The height goes on every row. `number` is now a real
  writing size and an unknown one is refused rather than silently sized as a
  word.*
- The maths working wall was a sheet of words while three photographs of the
  very counters its worked example described sat published. The "every card
  carries a visual" rule was there, but its success-criteria exception and a
  "most maths cards should have photo: null" line let it through, and nothing
  deterministic checked. *`working-wall-packet.py check` refuses a wall whose
  cards carry no picture while the lesson holds one; the exception is narrowed
  to a lesson with no picture at all; the maths line is rewritten.*
- The geography wall's repair removed four unavailable tile photographs, passed
  its own checks, and then could not build. *The build checks every required
  photograph first and names each empty slot; the repair role now distinguishes
  a picture that supports words from one that is the content.*
- Six Wikimedia photographs finished `unsatisfied` while Commons held thousands
  of each. Commons matches all of a query's words, so five-to-nine-word queries
  returned zero, and only the top three of a ranked list were ever downloaded,
  which for a landscape query is three satellite images. *A fruitless query is
  retried with its descriptor words removed, the search looks at thirty
  candidates, and every candidate is recorded whether downloaded or not. Two
  biome archetypes were also contracted as `authentic-real`, which is for a
  place named as evidence; the designer's rule now separates the two.*
- The optional-drawing pass declined twelve slides as `full` with no measurement
  behind it, because the designer produced no `slide-room.json`. *The decorator
  renders the deck for its own pass, so it measures those pages itself.*
- A SharePoint sync failed with `WinError 32` on a run built directly in the
  destination folder. *A file already at its destination is left in place.*

Not repaired this pass, and worth knowing: a photograph sitting alone in a tall
template zone still leaves the space under it (the zone-fill advisory sees it,
nothing acts on it), and the pending `place-value-chart` and `map` helper
extensions are still waiting for `/install-helper`.

## 2026-09-02 — Year 4 Our PSHE rules
Run: output/working/year-4-pshe-our-pshe-rules.
Design review APPROVED after two bounded voice corrections: pupil -> child in starter; Be respectful matters -> Being respectful matters in spoken script.
Wall packet check accepted a 75-character reference-table cell, while the fixed A3 landscape build limited it to 74. Focused repair removed the final period; wall check and physical Visual QA then passed. Investigate parity between packet validation and fixed build capacity.
Full tagged obstacles: output/working/year-4-pshe-our-pshe-rules/friction.md.

## 2026-09-02 - Year 4 Maths Lesson 2: Represent 4-digit numbers

- Worksheet place-value-counter-chart hardcodes valued, differently coloured counters while this lesson requires identical plain circles. Initial helper coverage was incorrect. Five verified picture assets rescued Expected and Below. Pending extension: C:\Users\Daniel\Projects\lessonv4\output\working\year-4-maths-represent-4-digit-numbers\pending-helper\place-value-counter-chart (not installed; installation tests unproven).
- blank-surface offers number lines and bars, not a free drawing box; sort-grid supplied chart-drawing space and coverage was corrected.
- Opening-model slide exhausted three local layout passes. Focused repair moved sticky knowledge below wider success criteria, preserving full-width charts. Rendered inspection caught a wrapped 1,000 after deterministic fit had passed. Final 20-slide deck passed.
- A3 landscape workedExample wall overflowed by 0.1in at 36pt minimum. Portrait orientation preserved all content and passed physical-page QA.
- Automatic worker audit selected another task record; explicit current-session audit corrected it. Policy blocked transient cleanup, so evidence and previews remain.
- Full run evidence: C:\Users\Daniel\Projects\lessonv4\output\working\year-4-maths-represent-4-digit-numbers\run-report.md and friction.md.

### Repaired in 4.2.73

Four of the findings above were traced to their cause and closed, so a later run
does not re-diagnose them:

- The Your Turn questions shipping at 12pt were not a fit-pass failure. Question
  cards were sized from an average character width deliberately set *under* the
  real one, so the text box came out narrower than its own words and the fit pass
  shrank the question into it. Cards are now measured against the real Comic Sans
  advance widths (`builder/src/glyph-width.js`), and a short set in a wide,
  shallow zone lays out in full rows so the type takes the width as well as the
  height.
- The reference-only "My Turn" slide came from a split made without the splitting
  rules: a capacity finding routes the focused repair to sizing, and nothing sent
  it to the rule that forbids a reference-only interlude. The trigger now fires on
  the repair as well as the finding, and `TURN_SLIDE_WITHOUT_ITS_TURN` refuses a
  turn-labelled slide carrying no question, task or answer.
- The wall capacity mismatch this log asked about is not a parity bug: a card's
  budget depends on page, orientation, column widths and the readable floor, so
  it only exists once the pages are drawn. `working-wall-html/build.js
  --validate-only` runs those checks without writing a PDF, and both wall
  designers now run it before returning.
- The blocked transient cleanup is gone from the two design roles, which had no
  reason to be tidying a directory the run keeps anyway. The picture-work cleanup
  stays (a rainforest lesson's picture work ran to 330MB) and a policy refusal of
  it is no longer reported as friction.

## 2026-09-02 - Year 4 PSHE - Our PSHE Lessons

- Design review corrected two worksheet model answers: a made-up story using classmates' names should be explained as making classmates feel picked on, not assumed to disclose a true private story.
- Design review required separate pupil use of fictional stories, general questions and safety help. One redesign split the combined input into three checked steps while preserving the 45-minute lesson and 15-minute class-agreement task. Second review approved the result.


### Resource findings from the same PSHE run
- Slide Designer: colour checking treated Read and Do you agree as explanatory prose; unchanged sentences were separated into individually blue task objects.
- Slide Designer: the full-width lower zone rejected a success-criteria table through E-narrow classification; a full-body stack with equivalent proportions passed.
- Working Wall Designer: the checker rejected an empty wall allowed by the role, so it retained a right-to-pass reminder with an emoji. A no-required-picture lesson had acquired optional slide illustrations during the concurrent decoration pass.

## 2026-09-02 - Three slide faults from the PSHE deck, repaired in the engine

Reported by Daniel against `Our PSHE lessons.pptx`. All three are fixed at
source, so a future run does not need to re-diagnose them:

- **The word "Starter" disappeared from slide 1.** The starter header filled its
  heading slot from `heading`, then `title`, and only fell back to "Starter"
  when a deck offered neither - so a starter titled with a question lost the
  label and shrank the question into a four-inch bar. The heading is now always
  "Starter", drawn by the builder, and the slide's own prompt reads underneath it
  full width at slide-title size.
- **A text-heavy deck got no optional drawings at all.** `measure-slide-room.py`
  counted a card, its outline and its shadow as content, so three white cards
  reaching the margins measured as no room anywhere and the pass wrote `full`
  down the whole record. Occupied now means ink - words, figures, photographs -
  and the blank inside and between cards is room, which is exactly where a
  drawing belongs on a wall of text.
- **The one sticky-knowledge fact rendered red.** A `safety-warning` emphasis
  covering the whole statement painted over the purple the builder gives a
  sticky line. A whole-line emphasis on a sticky line is now refused by name;
  a span inside one still works.

Telling coloured blue also stands as a live risk rather than a fixed fault: the
mixed-block check only sees a blue block that both tells and asks, so splitting
the block into two blue objects gets past it. The discrimination now lives in
the visual profile's Semantic colour - blue is about what a child does *now, on
this slide*, and a rule of conduct phrased as an imperative is still telling.

## 2026-09-02 - Year 4 PSHE agreement
Run: C:/Users/Daniel/Projects/lessonv4/lesson-output/working/to-create-our-rse-and-pshe-agreement
Design review approved without corrections.
AGENT: lesson-designer | FRICTION: The guidance requested separately presentable actions, but the Task-Centred scaffold allowed only one task and one conclusion unit; I preserved the stages as explicit sequences for separate physical slides - run unharmed
AGENT: slide-designer | FRICTION: Expected inline blue spans to cross paragraph breaks, but they printed literally; separate spans per paragraph rendered correctly - run unharmed
AGENT: working-wall-designer | FRICTION: Expected both settled safety reminders to fit as wall cards; the help-seeking reminder exceeded the readable two-line limit, so it remains on the slides - run harmed: it is not on the working wall.

AGENT: delivery | FRICTION: The report parser split unquoted paths at spaces and the sync wrapper required a term-file argument alongside the resolved term; I quoted the report paths and supplied the term file, then both checks passed - run unharmed

### Addressed 2 September 2026

- **A blue span could not cross a paragraph break, and nothing caught it.**
  *Fixed in `answer-text.js`. The builder split text into lines first and only
  then looked for markers inside each line, so a span opening on one line and
  closing on the next matched nothing and printed its own `[[` and `]]` at the
  class. Markers are now scanned across the whole string, with each newline kept
  as its own base-colour run; `||` stays per line, because a field list must
  start each line back in the base colour. The safety net had the matching hole:
  a line break starts a new `<a:p>`, so the two halves reached the XML as
  separate runs, each holding one unpaired half, and unpaired is documented as
  deliberately literal. `verify-markers.js` now rejoins the runs within a shape
  before looking. A sort board carrying the split span built clean and said "No
  warnings" before this; it is now refused by name.*
- **A safety reminder was dropped from the wall for being eight characters too
  long.** *Fixed in the Working Wall Designer and its preferences. "Tell a
  trusted adult if you're worried about yourself or someone else." is 70
  characters against a 62-character card. Every route out was closed at once:
  sticky knowledge was "verbatim, everything else", only worked examples could
  be condensed, and the budget section's other escape - drop the card's picture
  for the wider 106-character width - is forbidden by the visual gate, which
  keeps a picture-less card off the wall entirely. Dropping the card was the
  only legal move left, so the agent was right and the rules were wrong. The
  verbatim rule now protects what a child checks board against wall (success
  criteria steps, reference columns, a misconception's Don't/Do pair) and
  releases free-standing prose nobody matches word for word - a modelled
  sentence, a sticky fact, a definition - to be condensed with its meaning and
  protections intact. Condensing is named as the first move when an item
  overruns, dropping the card as the last, and dropping the picture is struck off
  the list as the dead end it always was. The preferences table's "≤ 100
  characters" for a sticky item was the no-picture width and was quietly telling
  designers 70 was fine; it now reads 62. "Tell a trusted adult if you're worried
  about anyone." carries the same instruction and both reminders now fit.*
- **The report's path check named a fragment and not the fault.** *Fixed in
  `validate-run-report.py`. An unquoted path was split at its spaces, so the
  failure read `path does not exist: .../To` while the file sat there. It now
  says to wrap the path in backticks and why, when the bullet had no backticked
  path. The playbook says "each path in backticks" and `--term-file` in the sync
  call; the reasoning lives in the failure messages rather than in text every run
  loads, which kept the playbook under its size budget with more headroom than it
  started with.*
- **The task-centred stages were a route, not an obstacle.** *Noted in
  `teaching-sequence-task-centred.md`. Propose → combine → agree belongs in
  `launch.steps`, and the slide designer gives a stage that needs the board its
  own slide, which is what happened here on slides 12 to 14. The single
  `do-task` is deliberate - it keeps the doing reading as the centrepiece rather
  than fragmenting into short practice beats - so the scaffold is unchanged and
  the file now says this is the intended route.*

## 2026-09-02 - Year 4 History: continuities and changes in children's lives (4.2.82)

- **The Teach taught primary and secondary sources; the Do practised something
  else entirely.** *Fixed in `preferences.md` for every route. The lesson's
  first two pairs were strong - observation and deduction taught, then a fresh
  Roman carving to deduce from; continuity, change and comparing the same part
  of life taught, then a Tudor schoolroom to compare with the class's own room.
  The third pair broke. Its explanation defined a primary source, defined a
  secondary source, and said a later explanation helps interpret an older one;
  its Do asked whether one boy's portrait shows what he wore and what every
  Tudor child wore. That is a real, committed, whole-class task about the scope
  of a single source, and scope was never taught. Primary and secondary were
  never used. Every existing check passed it, because `Questioning is not doing`
  and the reviewer's bullet both ask whether the beat is a use at all, and this
  one was. The rhythm section now carries the pairing test as its own rule
  beside them - is it a use of `this`? - with the boundary that a Do may still
  carry earlier learning forward, and the reviewer's routing card opens the
  section for a mismatched pair rather than only for two teacher beats in a
  row.*
- **A Teach block's heading named one move while its teaching taught two
  others.** *Fixed in the same section. `headline`, `explanation` and the
  following Do are three fields, each true on its own, and nothing read them
  against each other, so `Ask what the source helps us find out` could sit above
  a definition of primary and secondary sources and look complete. The
  `One concept per Teach block` rule now says the three surfaces have to agree
  about what the one thing is, and to read them back to back.*
- **Nine new abstractions in forty-five minutes, and the vocabulary cap did not
  see them.** *Fixed in `How Much Fits in One Lesson`. Source, observation,
  deduction, continuity, change, primary, secondary and what one source cannot
  prove all arrived before the Roman, Tudor and Victorian content did. The set
  stayed inside five cards only because terms were paired onto them, which is
  the cap's own permitted move being used to hide the load. The section covered
  only the knowledge-plus-product kind of overload; it now names too many new
  ideas as the second kind, gives the measure as how many abstractions a child
  holds at once, and names both tells.*
- **The objective said children's lives; the lesson taught children's learning.**
  *Noted in the Lesson Designer's `Date + LO`. One thread taught properly is
  usually the better lesson and the objective is the teacher's to keep, so the
  answer is not to edit either. The designer now names in `flagsForTeacher`
  which strand the lesson covers and what the others would need, because the
  teacher assesses against the objective line and cannot see the narrowing from
  it.*

## 2026-09-02 - Year 4 History: no humour anywhere in the lesson (4.2.83)

- **Not one light line in the whole lesson, and nothing was ever asked to look
  for one.** *Fixed in `teacher-voice.md` §4, the Lesson Designer and the Design
  Reviewer. The teacher's report: "was any humour used in this lesson? could it
  have been? i havent seen one yet." The starter, seven scripts, the models and
  the ending were all correct and completely flat, while the material had handed
  over easy lines it walked past - a Tudor prince painted at about a year old in
  cloth of gold, and a Roman school carving. Two causes. §4 was never routed to
  the designer at all: the guide's numbered sections are routed by the kind of
  string being written (§5 a definition, §§1 and 3 a script, §8 a model answer),
  and a playful opportunity is not a kind of string, so it had no entry. And the
  one place the question did reach the designer was the ten-point pre-flight,
  run "over the same strings" - nine of those questions can be answered from one
  string and this one cannot, so asked sentence by sentence at the end of a long
  run it can only ever be answered no. The reviewer carried the same question
  inside the same per-string sweep. It is now asked once, of the lesson's
  material, at the completion pass, by both. Placement is left open: slide,
  script or both.*
- **The guidance would have made every lesson joke about the misconception.**
  *Fixed in the same section, before it shipped. §4 named the lesson's own
  misconception as the easiest opportunity and gave it the worked example, so the
  one route available in every lesson was also the most prominent, and routing
  the designer there would have produced a wry remark about the wrong answer in
  every deck. The teacher named it first: "dont always want it in
  misconceptions?" The section now leads with six routes and the misconception is
  last - the source or object in front of the class, a genuinely daft real fact,
  a person in a scenario, doing the thing wrong on purpose, lowering the stakes
  on something children over-polish, then the wrong idea. Each carries an example
  in the teacher's voice; the four he had already endorsed are kept and two are
  new. A new part says plainly that sameness across lessons is the failure while
  silence is not, and that a lesson handing over nothing keeps its straight face.
  The earlier repair that put the misconception route there in the first place is
  preserved intact, wording and all - it exists so that a lesson with dull
  content is not read as a lesson with no opportunities, and that is still true.*

## 2026-09-03 - Teacher review of the Year 4 maths run (4.2.84)

The teacher taught `Find 10 and 100 more or less` and abandoned the lesson on
its second slide of modelling, bringing out his own place-value chart instead.
Two of the three faults he named were already repaired by the rebuild of the
same lesson a version earlier; the third was the route's own settled shape.

- The modelling slide carried two questions and an AI-generated photograph of a
  chart with the first question's number already made, so nothing could be
  modelled on it and the picture served one of the two questions.
  *Already repaired before this review: the run had declared no representation
  at all, and the `place-value-chart` helper could not yet show counters or
  exchanges, so three controlled-AI substitutes stood in. The helper now carries
  counters, row labels and exchange cues, and the rebuild of this lesson selected
  `Live-complete helper` with the answer rows left blank and no photograph in the
  modelling at all.*
- The first thing modelled was crossing a hundred, with no plain case first.
  *Already repaired before this review by the design reviewer, which caught the
  missing non-boundary model and approved the corrected sequence. The rule it
  enforced ("the first example is a minimum-viable case") was present all along;
  what was missing was anything checking it.*
- The deck went My Turn (cross a hundred), My Turn (cross a thousand), one Our
  Turn, Your Turn. Children watched two different moves before practising
  either, and the plain case was modelled once and then met again only in
  independent work. Every check passed it, because the route authorised it
  outright: "one or more My Turn source units ... followed by at most one Our
  Turn". The general rhythm in `preferences.md` says the opposite in the same
  breath ("every My Turn ... is followed immediately by a beat that requires
  every child to use what they have just been told"), and skill-based lessons
  were reading their own line as a block-level exemption.
  *Addressed by restoring the previous plugin's shape, which handled extra cases
  as extra examples inside one My Turn rather than as extra My Turn slides. Three
  repairs: the rep-count default is back ("two for quick instances and one for
  lengthy ones", with the Our Turn answering the same number, and its limit named
  so it cannot become a quota); a concept now runs one or more My Turn plus Our
  Turn cycles before its single Your Turn, so a genuinely different move earns a
  cycle rather than a second My Turn beside the first; and the skill-based clause
  in the rhythm section now reads "the guided and independent practice that
  follows each modelled move, never as one block of practice at the end of several
  models". `validate-lesson-design.py` refuses two My Turn units in a row for the
  same concept, and its message names the fix. The coverage rule keeps its
  requirement that every distinct case is modelled and now says how to reach an
  unmodelled one.*
  *One control was not sufficient on its own. Moving examples inside a unit opens
  a second route to the same board: a unit whose examples cannot share one visual
  will not fit one slide, and the composition rules then split it into two
  consecutive My Turn slides, which is the fault again with the design check
  passing. The slide check now refuses a second consecutive My Turn slide
  (`MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`) before the builder runs, and
  the split rule in `slide-composition-playbook.md` names a My Turn as the one
  beat a split may not reach, sending the repair back to the teaching sequence
  rather than to another layout attempt. An answer or reveal slide after a My
  Turn is excluded, and a My Turn followed by its Our Turn is the discrimination
  case both suites test. Regressions:
  `scripts/tests/test_a_my_turn_is_used_before_the_next_is_taught.py` and three
  cases in `builder/test/slide-design-check.test.js`.*
- The two modelled examples were an inverse pair: `1,390 + 10 =` then
  `1,400 - 10 =`, so the second question asked the class to find 1,390, already
  printed above it as the first question's starting number. The pair looked like
  two worked examples and demonstrated one instance run forwards then backwards,
  and nothing in the route covered it: the spoiler audit existed only for a
  bounded attempt.
  *Addressed beside the rule that owns example choice, where holding the starting
  number still already prevents it, rather than as a rule of its own. The
  paragraph now names the failure, generalises it past arithmetic to any
  reversible move, and carries its limit: a deliberate inverse demonstration
  (counting back returns the number you started with, checking by the inverse
  operation) is legitimate and the script says so. No deterministic check was
  added: the only slide type where the fault appeared is the one where the
  reversal can be the teaching point, so a check would have to misfire on the
  legitimate case to catch the reported one. Regression: four assertions in
  `scripts/tests/test_a_my_turn_is_used_before_the_next_is_taught.py`.*
- Not changed, deliberately: the splitting-axis rules already refuse a concept
  split on the directional fork, so `+10`, `-10`, `+100`, `-100` cannot become
  four rounds of their own; and the reviewer gains no new clause, because the
  structural half is now a deterministic check and the judgement half (whether a
  quick move got its second example) belongs to the one rule that owns it.

## 2026-09-03 - Year 4 History Lesson 1: childhood continuity and change

- Design review approved the lesson after correcting child-facing date punctuation and a stale design-decisions line so the paired comparison matches the canonical tutor-and-class task.
- The selected official museum/archive sources have exact URLs, but the compiled picture route searches Wikimedia and has returned five of six requirements unsatisfied. Authentic evidence selected in pedagogy is therefore unavailable to resource builds; no synthetic substitute was authorised.
- Adaptation reused existing photograph filenames with new adaptation IDs, and build-provisional rejected the duplicate filename identities. The required fallback preserves the Expected sheet but omits the supported version.
- Run evidence: C:/Users/Daniel/Projects/lessonv4/output/working/childrens-lives-continuity-and-change/friction.md.
- Final result: one validated A3 wall PDF delivered and synced. Slide and worksheet owner repairs could not preserve the tasks with only the portrait available. The run is BLOCKED; nine slides lack evidence and no worksheet/answer key was built. The slide wrapper also misdecoded the curly apostrophe in the output name.

## 2026-09-03 - Year 4 Maths Lesson 2: represent 4-digit numbers

- The installed worksheet `place-value-counter-chart` renders coloured, value-labelled counters, while the approved lesson required identical plain counters whose value comes only from position. A pending helper drop-in now adds the missing slide modes, but worksheet parity still needs a compact plain-counter variant.
- The original Expected worksheet contract exceeded one A4 portrait page by 76 mm. The content-gap rescue preserved the four two-way build/read performances and removed only the eight-counter extension task; that reasoning remains in the lesson's final comparison task and is flagged for the teacher.
- Two initial controlled-AI slide visuals ended unsatisfied. Focused slide repair replaced both with exact live counter-chart compositions and preserved all 13 slides; two other generated slide visuals published successfully.
- The first wall build exposed overlapping long column headings. A focused repair changed only the wall chart labels to Th/H/T/O, and the one-card A3 rebuild passed visual QA.
- Run evidence: C:/Users/Daniel/Projects/lessonv4/output/working/year-4-maths-lesson-2/friction.md.
- Final result: 13-slide PowerPoint, three-level worksheet PDF with separate answer key, and one-page working wall built. Stick-in sheets were not needed.

## 2026-09-04 - Year 4 Maths Lesson 3: partition 4-digit numbers

- The installed slide `part-whole-model` helper supports only two or three linked parts, while the lesson required exactly four ordered place-value parts. A controlled generated teaching diagram supplied this run, and a tested pending helper growth is waiting under the run's `pending-helper/part-whole-model` folder for later installation.
- The worksheet builder corrected a 2 mm browser-measured zone difference on the Below sheet without changing its content; both worksheet pages then passed the fixed build.
- Run evidence: C:/Users/Daniel/Projects/lessonv4/lesson-output/working/year-4-maths-lesson-3/friction.md.
- Final result: 10-slide PowerPoint, Below and Expected worksheet PDF with separate answer key, and one-page working wall built. Stick-in sheets were not needed.

## 2026-09-04 - Year 4 History Lesson 1: source evidence and continuity/change

- The British Museum horn-book endpoint failed TLS verification twice, so the authentic object ended terminally unsatisfied. A focused content-gap design revision removed that dependency and preserved the objective through four published Victorian archive sources; synthetic historical evidence was not used.
- The first slide specification exhausted its three self-repair passes on six layout and compatibility diagnostics. Focused repair cleared all six, and the post-revision slide design passed with 19 slides.
- Picture provenance could not use the revised four-picture contract because the surviving terminal receipts were tied to the immutable five-picture Phase 2 snapshot. Provenance completed against that snapshot, retaining the unused unsatisfied receipt and proving all four published sources.
- Run evidence: C:/Users/Daniel/Projects/lessonv4/output/working/to-identify-the-continuities-and-changes-to-children-s-lives-using-a-range-of-sources/friction.md.
- Final result: 19-slide PowerPoint, three-level worksheet PDF with separate answer key, and two-page working wall built. Stick-in sheets were not needed.

## 2026-09-04 - Teacher review of the Year 4 History run (4.2.95): "I will 100% NOT BE USING THIS LESSON"

The third run of the same objective in three days, and the teacher refused
the deck by slide 9: the voice was "Year 10, not Year 4", the lesson was "a
teacher talking nonsense" about sources, the timeline was "what is that
table!", and a photograph children were told to look closely at was two
inches wide beside five inches of empty slide. The teacher then described the
lesson he would build (the 1897 classroom first and "what do you notice?",
the words continuity and change given after the noticing and attached to it,
a second source adding real knowledge, the limit of one source arriving as a
question the class can now answer, an adapted Bridget Kelpin extract, a
two-column task, "has school completely changed?"), and that sketch is now the
history file's calibration. What follows is what the evidence showed.

- **The lesson was built around a rule about sources, not around Victorian
  children.** The decisions record opened "because the lesson helps them stop
  treating one source as a complete picture", every Teach headline was a
  method rule (`Put each source in time`, `One source is one piece`, `Compare
  the same part of life`), the "can't prove" question sat on 7 of 19 slides
  and its sticky fact on 5, and no slide told the class what a school of
  industry or a workhouse school was. The 2 September review had logged the
  same family (nine abstractions, lives versus learning) and the rules added
  then were obeyed in letter. *The shape, not another rule, is changed:
  `subject-history.md` opens with what the lesson feels like to the child and
  owns the spine for history (a chunk is a piece of the past; the historian's
  move is taught inside the beat that needs it, once, where the knowledge
  makes it mean something); the content-based sequence file and the rhythm
  section in `preferences.md` say a chunk is knowledge and hand the
  definition of "the one thing" to the subject file; the Lesson Designer's
  sticking-point bullet and decisions-record opening sentence no longer force
  a misconception spine on a knowledge subject; the reviewer's learning
  contract reads the Teach headlines in order as the subject file's own test.*
- **The vocabulary came before the meaning.** *`vocabularyPlacement` (null, or
  `after` a unit) lets the single vocabulary slide follow the first noticing
  beat; the validator, scaffold, review view, slide designer and composition
  playbook carry it; `preferences.md` → Vocabulary and the designer's
  placement paragraph say why.* **Superseded 5 September 2026** by
  `vocabularyIntroductions`: one slide holding every word could only ever be in
  one place, and a lesson needs a prerequisite word before an instruction AND a
  contrasting pair after the noticing, in the same lesson.*
- **Nobody heard the words as a child.** `What does one visible detail suggest
  about this class?`, `Which parts of the timetable support the claim about
  this school's week?`: grammatical, contracted, and planning nouns all the
  way through. The reviewer returned in three minutes with `Corrections made:
  None.`, reading every string inside JSON braces beside its field name.
  *The review view now opens with `As the class meets it`, every child-facing
  and spoken string as plain text in lesson order with its count; the
  reviewer reads that first as the year group's child, the planning-noun miss
  leads its list of misses, and the report carries a `## Voice sweep` line
  whose count the packet verify checks against the view, so a skipped sweep
  no longer looks like a clean one.*
- **The delivered lesson was never reviewed.** The reviewer approved a
  hornbook-plus-Victorian design; the hornbook picture failed, a content-gap
  revision removed the Tudor strand and rewrote the model and Do beats, and
  the route sent it straight to the slide designer. The ordering beat it left
  behind had two dates from one period printed in order. *The content-gap
  wave now briefs the revision to find another sound route rather than the
  smallest deletion, to re-judge every beat that leaned on the lost source,
  and to go back through Phase 1.25 before anything is built.*
- **The timeline was a table.** No slide helper drew one; the helper check
  recorded `covered` by `table`, and `not to scale` became a column heading
  three times. *A `timeline` slide helper now exists (eras as bands, marks at
  designer-set fractions, optional note and caption, parity declared with the
  worksheet's), `check-helper-coverage.py verdict` refuses a lookalike key for
  a named figure, and the playbook's `covered` bullet says so.*
- **The photograph children were told to look closely at was the smallest
  thing on its slide.** Three causes. The picture floor was 1.6" on the cell's
  short side, so a two-inch photo passed; the slide designer was told to give
  a promised helper layout priority, so an empty four-column table took the
  width on five slides; and the file itself was a 400 by 332 pixel preview
  the scout recorded and accepted. *The floor is tiered by how many pictures
  children work from share the slide (3.0" alone, 2.2" for two, 1.6" for
  three or more), the helper-priority clause stops at the source a frame
  records from, the scout judges resolution against the job and searches
  past a viewer's preview, the finaliser prints `PICTURE_LOW_RESOLUTION:` and
  the playbook carries it to the teacher as a flag.*
- **Unreadable evidence had nowhere to go.** The design asked the picture
  stage for "a readable transcript", which the scout cannot supply, and a
  page of Victorian handwriting reached the board with "find a detail".
  *The history file says the adapted extract is content the designer writes
  (`teachingText` or the worksheet stimulus) with the original small beside
  it; a **read-from moment** (detail the board cannot show large enough)
  earns a printed `source-copy` stick-in piece, defined in
  `stick-in-sheets-pedagogy.md` and the designer's Printed extras, and the
  stick-in engine now prints one.*
- **An empty four-question frame was the "live-complete helper".** The
  headings were the method's steps, the completed row lived only in the
  notes, and a PowerPoint table cannot be typed into during a show.
  *`modelling-formats.md` says a frame is built from the class's own
  questions with its first row filled, and the completed state reaches the
  board (an `answer-slide` drawn into the frame) where it cannot be drawn
  live.*
- **Both ordering tasks were printed in answer order, and the starter's title
  was a question.** *`validate-lesson-design.py` refuses a datable option
  bank or starter list printed in ascending or descending order (years,
  "years ago", named British periods); the designer's naming rule says a
  starter label names what is remembered, never a question.*
- Not changed, deliberately: the rhythm, the sticking-point machinery and the
  reviewer's material-defect boundary all stay, because they are right for
  maths and the fault was that nothing let the subject file override the
  shape; and the reviewer stays on the same model for now, because the
  teacher's own accurate reviewer is a chat thread that holds his correction
  history, and the closest thing this pipeline can do is put the plain words
  in front of the reviewer and make it prove the sweep happened.
# 5 September 2026 — supervised completion after independent audit

Evidence: `output/codex-completion-2026-09-05/STATUS.md`, delivery index, per-package run reports, actual page renders and final test logs. This entry supplements the historical trial reports; it does not erase failed attempts.

- The maths general answer rule was incomplete: zero tens alone admits 5,004, whose subtraction changes three digits. The repaired rule also requires nonzero hundreds; all 9,000 four-digit inputs were checked. Review and adaptation guidance now require the complete acceptance condition, not just a successful example.
- The history legal claim and photograph interpretations, and the diet nutrient/group conflation, survived prior reviews. Existing review now explicitly checks the factual premise against the stimulus. Owning designs and affected answers/resources were repaired and independently re-reviewed.
- A material Expected maths support omission had been acknowledged in notes but not resolved. The playbook now routes such gaps to the existing owner before marking a branch complete. The Expected working chart is delivered.
- The chart's narrowest-width minimum height disagreed with its actual wide rendering. Actual allocated width now reaches measurement through the helper registry and nested composition; narrow and insufficient-height rejection remain tested.
- Discovery exhausted its two allowed image calls without satisfying comparison geometry. The owner replaced the teaching representation with a shared precise native visual and obtained review. The terminal failed photograph remains in the immutable history. Post-freeze review validates the frozen receipt and current references; reporting distinguishes a reviewed retired picture from a still-required missing picture. Missing history and stale-review cases still fail.
- The balanced diet plate already existed but lacked wall wiring. It now uses the same shared visual there, with parity tests. The final reference-table PDF exposed a separate measurement/render mismatch: the checker reserved a 1.4-inch title but the 96pt title and padding needed 2 inches. Shared line-height/padding measurement now rejects the clipped landscape layout and supports measured portrait cells at the 36pt floor. The exact slide lookup table also contradicted a blanket picture requirement: the guard now recognises an exact matching teaching table as its own visual support; altered/invented tables do not gain that exception. Focused regressions cover both mechanisms.
- Actual final slide reading caught a cramped diagram, a starter-box overflow, a false statement under an ambiguous heading, and decorative wind images reinforcing the misconception. Bounded slide-owner repairs preserved teaching content. Existing would-mislead guidance already covers the decoration failure; no duplicate rule was added. A reported diet worksheet header fault did not reproduce in the final PDF, so no speculative renderer change was made.
- Acceptance limit: these are supervised repairs, not clean unattended repeat passes. Tests and worker completion markers alone did not establish teachability. Deep free-writing stick-in cells and standalone piece preview remain deferred; the delivered short-response slips do not require those features.

# 5 September 2026 - Partition 4-digit numbers lesson review

- The independent design review replaced the formal instruction `Then check whether each place in the whole number is still accounted for.` with the clearer Year 4 teacher wording `Then check you haven't missed a column.` The mathematical check was preserved and the revised design revalidated.

# 6 September 2026 - Describe teeth and their uses lesson review

- The supplied supporting statement that premolars guide food to molars was corrected to the more accurate Year 4 explanation that premolars crush and begin grinding food.
- The final square-ish tooth images exposed a slide-readable-floor failure that was invisible before publication; a focused layout repair enlarged the canine image without changing lesson content.
- The designed four-image evidence-card task earns a write-on aid pedagogically, but the current stick-in renderer cannot reproduce its repeated picture-plus-two-response-field structure. The sheet was honestly omitted instead of substituted with a misleading layout.

# 6 September 2026 - Children's lives continuity and change lesson review

- The initial authentic museum toy choice had no verified reusable image route. Independent review caught it before rendering; redesign selected London Museum toy jug 98.2/163 under CC BY-NC 4.0 and revised the visible comparison to its surviving body, open mouth and missing handle.
- Clearing four slide height diagnostics exposed a separate `TEXT_OVERLOAD` on an earlier slide. A distinct focused repair preserved all teaching content and reached `SLIDE_DESIGN_CHECK_OK: 19 slides`, showing that deterministic slide checks can reveal faults sequentially after layout changes.
- The expected worksheet remained 20px too tall after its one permitted focused repair (`lines: 5 → 4`); the h-stack allocation grew with the change and the same overlap persisted. The worksheet was excluded rather than released with overlapping print content. This is evidence that reducing a nested response-line count is not a reliable fit lever for that h-stack layout.

# 8 September 2026 - Represent and estimate on a number line lesson review

- The stick-in surface had no live number-line helper, although slides and worksheets did. The run used three exact controlled printable figures and left a complete `number-line` stick-in extension in the run's `pending-helper` folder for later installation and visual regression testing.
- The local render probe found PDF rendering but no PPTX route despite a successful fixed deck build. Worksheets, stick-ins and the working wall passed page-level review; the deck remained explicitly unverified rather than inheriting a visual pass from its JSON and build checks.
- The axis numerals on the board came out at roughly half the size of the words beside them, from two independent causes. Every axis label was drawn in one fixed 0.55in box, so a numeral's rendered size tracked its DIGIT COUNT: "0" printed full size and "10,000" was shrunk by the fit pass to fit a box it overhung. On a Year 4 four-digit deck that is every number on every line. Separately, a stacked line claimed a flat 2.00in of height whether or not it carried an arrow or an answer, so three lines "needed" 6in and everything in a 3.3in zone was scaled to 54% together - numerals, arrowheads, dots and ticks. A previous repair had raised the font ceiling from 14pt to 24pt and changed almost nothing, because the ceiling was never the binding constraint. The slide renderer now measures each label with the existing shared glyph-width table, insets the axis so the end labels sit inside the zone at full size, charges a line only for the bands it actually carries, and holds the numerals to a 14pt floor by taking a deep stack's room out of the arrows and ticks instead. Eight of the deck's eleven lines now draw at the full 24pt; the worst three-line stack draws at 15.9pt against an effective 11-13pt before. The printable `number-line-svg` helper already measured honestly and insets its axis, so the fault was confined to the slide renderer. Seven focused regressions pin both causes, the floor, and the one case that should still shrink a numeral - a genuinely crowded axis.
- The render probe that reported no PPTX route was a false negative, not a machine limitation: re-probing the same machine found a working PowerPoint route immediately, and the run had in fact already rendered all fifteen slide pages ten minutes before the final review declared them unrenderable. The reviewer read `render-route.json` and stopped, while a current page manifest sat beside it. A deck therefore shipped UNVERIFIED with its evidence already on disk.

# 9 September 2026 - Compare 4-digit numbers lesson review

- Three successive Slide Designer launches were reported as infrastructure stalls and killed. None of them had stalled. Each was iterating on a complete 13-slide candidate in `lesson.json.tmp.[ATTEMPT_ID]`, exactly where its role file says a candidate lives; the orchestrator judged liveness from `lesson.json` and `slide-room.json`, which the same role file writes only at the final promote. An untouched owned output is what a healthy Slide Designer run looks like for almost its whole length, so a working worker and a dead one were indistinguishable by the evidence being read. The playbook now says to judge a worker by any recent change anywhere in `[WORKING_DIR]`, temporary and attempt-suffixed files included, and carries the earlier stale-route-file case as the same class of mistake. This is the second logged run lost to reading a stale file while the current one sat beside it.
- The fault the workers were actually stuck on was a single `STEP_TEXT_OVERLOAD` on slide 6. The design authored five success-criteria steps plus one sticky fact, and `slide-success-criteria.md` makes folding the sticky fact into the criteria panel the default, so the panel carried six items. `steps.js` shared the panel height equally by item COUNT: the sticky sentence wrapped to three lines and needed 0.96in inside the 0.83in an equal share gave it, while each one-line imperative step sat in the same 0.83in needing 0.32in. The refusal was correct and the room was there all along, just allocated to the items that did not need it. Rows are now equal whenever equal rows fit, so every panel that built before builds identically; only when an item cannot hold its equal share does a reference take the height its sentence needs and the numbered steps share the rest, staying one set at one size. Slide 6 draws five 22pt steps and the sticky line at 18pt where it previously refused the whole deck.
- The refusal also named the wrong thing. It reported "step 6" on a panel that visibly numbers five steps and marks the sixth item with a star, sending the reader after a step that is not on the slide. Worse, it prescribed the one repair the Slide Designer is forbidden to make: a sticky fact is source-authored wording nobody downstream may shorten, so the worker was told to do the one thing its own authority rules refuse. The message now distinguishes a reference line from a step and points at the repairs its owner can actually make.
- Acceptance limit: the run's remaining slack was not chased. Slides 10 and 11 carry a blank single-row place-value grid the design asked for as `blank-reference`, and slide 10 has visible empty room the optional-drawings pass would normally fill. That pass was not run, and the deck ships without it rather than with a fabricated visual.

# 9 September 2026 - Compare 4-digit numbers, second look

- The teacher looked at the delivered deck and said the comparison slides were too small and horrible. He was right, and the deck had reached him without ever being looked at: the Slide Designer's composition pass, which renders the pages and repairs the layout before promoting, never ran, because its workers were killed. The candidate was promoted straight from its attempt file. Deterministic checks all passed, which is exactly the gap - they measure whether content fits, not whether the page is worth showing a class.
- Every place value chart in the deck drew at exactly 1.07in whatever it was given: 1.41in, 2.17in and 2.66in zones all produced the same chart. The scale was bounded by `regColW / 0.45`, pricing the chart against a fixed reference column rather than against what its digits actually need. On a four-column chart in a 2.6in zone that held 18pt digits inside 0.44in columns that could carry three times that, and the chart used 49% of the height its template had deliberately set aside. The bound is now measured with the shared glyph table, the same move the number-line repair made in 4.2.114. The same charts now draw at 1.74in, and the slide-7 pair fills its zone completely.
- The row label was the hidden second cause. A label is a whole numeral in a column priced at 1.55 digits, so it is always the widest text in the chart; letting it ride the chart's scale meant the longest label decided how big the DIGITS were. Labels now fit their own column, floored so they stay readable, exactly as the column headings already did.
- The comparison ring between two charts was a `○` typed into a text item at a hand-picked 44pt. That inherits a text item's full-height card, so the ring sat in a tall white pill aligned with nothing, and once the charts grew it looked worse still. Added `comparison-slot`: a round slot sized from the room it is given, painting its own surface, with an optional `answer` that prints inside the same ring so a reveal reads as the question plus one thing. Documented in templates.md §5 and §4 so designs reach for it instead of typing a circle.
- Acceptance limit: the optional-drawings pass still has not run on this deck, and slides 10 and 11 keep the blank single-row reference grid the design asked for. Two doc-claims tests were already failing before this work and are untouched.

# 9 September 2026 - Compare 4-digit numbers, third look

- The teacher rebuilt slide 4 by hand and saved it over the deck, as the standard to match. His version differed in exactly three ways: the task printed at 48pt in a 1.91in box rather than 19pt in a 0.70in one, the Th/H/T/O key moved from directly under the task to the foot of the slide, and everything else stayed where it was. The charts and the ring he left alone, which is the useful signal: the 4.2.117 helper work was right, and what remained wrong was the SPACE around it.
- The task printed at 19pt because `measureQuestionsHeight` counted wrapped characters and never split on the line breaks the question was written with. A comparison task written as a heading and two pairs is three short lines and about thirty characters, so the measure said one line, the box was built one line tall, and the fit pass then shrank 28pt type to force three lines into it. Every multi-line question on every maths slide was being sized for a single line and then squeezed, and the longer the task the smaller it printed. The steps helper had counted breaks correctly all along; the question measure now does the same. Single-line tasks measure to the same 0.698in as before, so slides that were already right do not move.
- That still left a band of empty board. Handing the question's spare height DOWN to the visual was already implemented and is half the story: every visual stops growing somewhere, so when the diagram is smaller than the room below it the difference just sits there. The missing half was that a layout container could not say how much of its zone it wanted - `MEASURE` covered leaf helpers only, so a row inside a stack always kept its full weighted share however little it held. Added `measureCompositionExtent`, which answers for `stack` and `row` by recursion, and `maths-turn-sc` now spends what the visual will not use on the task, which is the one thing on the slide read from the back of the room. A composition holding anything unmeasurable declines to answer, so nothing moves where the engine cannot see.
- Deliberately kept separate from `measureContentExtent`. That one answers the narrower "should this card hug its content?", and the card look and the stack reflow are both tuned against its current answers: teaching it about containers broke a real guard where a fill text keeps its whole zone precisely BECAUSE its stack partner cannot be measured. Same question, two audiences, two functions.
- Result on the rebuilt deck: slides 4 and 8 print their tasks at 48pt because their visuals leave room; 5, 6, 7, 9, 10 and 11 keep the ordinary 28pt because theirs do not. Content decides, not a rule about comparison slides. Slide 4 now matches the teacher's hand-built version at 48pt in a 1.91in box.
- The key's position was the one thing not fixed in code, because it is a composition decision rather than a measurement: guidance now says a key, legend or units line explains the thing beside it and belongs after it, small, since whatever sits directly under the task is what a child looks at next.
- Acceptance limit: the teacher's hand-built file is kept beside the deck as `Compare 4-digit numbers (Daniel's edit).pptx`. The optional-drawings pass still has not run. Two doc-claims tests were already failing before any of this work.

# 9 September 2026 - Compare 4-digit numbers, fourth look

- The teacher's next note was that the gap between each place-value chart and the comparison ring was too wide, and that closing it would let the charts print bigger. Same fault as the two before it, one dimension over: a row shares its width by COUNTING items. The ring took a third of the row and drew at well under half of it, so the charts either side were held to two thirds of the width they could have had, and the digits a class reads from the carpet came out smaller to leave a gap around a ring that never wanted the room.
- A row now shares width the way a stack already shared height: helpers that genuinely stop growing declare a maximum useful width, the row narrows them to it, and the released width goes to the items that keep taking whatever they are given. `comparison-slot` is the first and so far only declaration; everything else returns null and behaves exactly as before, and a row with nothing to give the width to is left untouched rather than turning a gap between items into a gap at the edge. The row's own measure shares width the same way, so a card still hugs the box its content actually drew in.
- Chart zones on the comparison deck went from 2.60in to 3.19in, a 23% gain taken entirely from space nothing was using.
- Three faults, three days apart in the same deck, all the same shape: room handed out by counting things rather than by what those things can use. Height in a success-criteria panel (4.2.116), height in a chart against its zone (4.2.117), height in a stack whose container could not report its appetite (4.2.118), and now width in a row. Worth treating "shared out by count" as a smell in its own right when the next layout complaint arrives.
- Acceptance limit: the chart's own scale ceiling of 1.7 is now what binds on the roomiest slides rather than the space available, so a chart in a very large zone still stops short of filling it. Left alone deliberately: nothing in this deck needed it, and raising a ceiling that every chart in every lesson shares wants its own evidence.
