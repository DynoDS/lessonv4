# Things to fix later (found during the 27 Sept 2026 test runs)

Mechanical faults and missing pieces the runs reported. Not part of the wording fix.

Tidied 28 September 2026: done items moved to the bottom, duplicates merged, list renumbered.

1. **Only four names are drawn.** An RE design needed seven people and cut a sort card to fit
   (B-re friction). Also the names are British classroom names; lessons set in Côte d'Ivoire and
   Ecuador had to invent local ones (base-g8, A-g8 friction).
2. **Takeaway sticky fact rule is unstated.** The scaffold guide does not say a Teach's sticky
   takeaway must also sit in that unit's stickyKnowledgeRefs, but the validator requires it, so
   the first validation fails (A-g8 friction).
   Also seen (was item 35): **The output template and the validator disagree about a Teach's starred fact** (overnight run, Anglo-Saxons lesson 1, current order): the template's Sticky knowledge section says a Teach whose takeaway is a sticky fact leaves that fact out of its own `stickyKnowledgeRefs`; the validator refuses it ("takeaway sticky ref must also appear in stickyKnowledgeRefs"). The designer added it back after one refusal - run unharmed, but one of the two is wrong.
3. **No written column method on slides.** The worksheet has a column-method grid; the slide
   engine has none, so a column subtraction lesson modelled in a place value chart with an extra
   row (B-m26 friction).
4. **Picture finder's request file is never made.** The image scout role requires an
   ATTEMPT_REQUEST_FILE, but the playbook's picture stage never names or creates one; the
   orchestrator has to invent it (seen again 27 Sept; first logged 22 Sept).
   Also seen (was item 37): **The image scout asks for an ATTEMPT_REQUEST_FILE that nothing creates** (overnight leisure deck, Claude): `agents/image-scout.md` lists `ATTEMPT_REQUEST_FILE` among its spawn inputs and says to read it first, but no script writes one and the playbook's launch never names it. The scouts were told "none - first attempt". Either a stale field or a missing builder.
5. **Claude Code runs a very old copy.** The installed Claude Code plugin is 4.2.222 (17 Sept);
   the source is 4.2.296. Any lesson made in Claude Code uses old agents.
6. **History routing table contradicted the new significance rule** (fixed in the trial copy,
   B-h1 friction). Check other tables and summaries when a rule changes.
7. **An easy picture failed on a too-narrow request.** The Houses of Parliament photo came back
   unsatisfied: the designer asked for "daylight, the whole building, the Thames in front", the
   ladder had no open-web rung, and every daylight shot was from the bridge (B-h1 picture batch p2).
   A picture this common should not fail; the request or the ladder is too strict.
8. **Playbook and picture scripts disagree.** The picture stage says to validate and finalise a
   batch with its assignment, result, work root and batch ID; both scripts also require
   `--expected-filename`, and fail with "expected filename set must be non-empty" without it.
9. **Teach layouts can't hold a wide picture with a line, a question and the sticky fact.**
    The slide designer split one Teach beat into three slides to fit (B-h1 slide designer).
   Also seen (was item 19): **A wide picture (2.6:1) with a lead line and a question has no Teach layout,** so one Teach beat split across four slides (D-h1). Same family as item 10.
10. **The question slot paints a telling sentence blue.** A key question that opens with a
    statement ("Look at the children in the picture.") has to be broken apart, because the slot
    colours the whole block blue and the check refuses mixed blocks (B-h1 slide designer).
11. **banner-picture-sidebar pins a wide picture to the top,** leaving about 1.8in of empty slide
    under it (B-h1 slide 5, shipped with the gap after the repair budget ran out).
12. **The vocabulary card has one wide picture panel,** so a tall photo (the fountain) fills 55%
    of it and nothing can change that (B-h1 slide 13, FIGURE_ZONE_UNDERFILLED).
13. **The scaffold has no slot for a sort's structured answer.** A sort needs `answer.structure`,
    but the scaffold's answer envelope only makes kind, content, acceptanceCondition and delivery,
    so the fill stops on the missing key (D-sci friction).
14. **The picture search's query relaxation loses a good find.** Round 1 showed John Thomson's
    "The Independent Shoe-Black" (a real Victorian street child, public domain); round 2's
    automatic relaxation cut the query to "Independent Shoe-Black" and returned Baltimore
    buildings and cosplay, so the picture ended unsatisfied (D-h1 picture batch p2). A candidate
    seen in an earlier round should be reachable in the next.
15. **The playbook asks for a "Starter - check" title the engine cannot print.** revealPair refuses
    a pair whose headerStyle differs, and the starter header prints no title (D-h1 slide designer).
16. **The slide preview is written to %TEMP%, not the run's working folder** as the slide
    designer's instructions say (D-h1 slide designer).
17. **On Claude Code, pictures that fall back to generation come back empty.** A real-photo
    request with an AI fallback compiles to a single Unsplash round (the ladder skips the open
    web because generation is expected to catch it), and Claude Code has no image generator. A
    PSHE run lost all four essential food-group photos this way (F-pshe batch p1). Either the
    ladder should add the open-web rung when the host cannot generate, or the start-up check
    should say so before the design asks for "all four foods in one frame".
18. **The picture finder checks for a generator too late.** It reserved generation attempts before
    finding there was no generator, so the ledger could not record "capability unavailable" and
    the three pictures were marked budget-exhausted instead (F-pshe batch p2). The capability
    check should come first, or the host should say up front that it cannot generate.
   Also seen (was item 39): **On Claude, an image scout's AI fallback cannot run and still spends the ledger** (overnight leisure deck): the Victorian steam roundabout had no faithful Wikimedia match (30 results, all off-subject), the fallback was `ai`, and this Claude session had no image-generation tool; the scout reserved the attempt before checking, then spent the one recovery call the same way, so the picture is terminal `unsatisfied`. A host with no generator should skip to the next real rung (Openverse, the open web, other phrasings such as "steam gallopers") rather than burn the AI budget.
19. **One character stops the whole deck.** A 41-character success criterion in a card that holds
    40 at 18pt refused slides 15-16, and one refused slide stops the whole preview, so no page
    was ever seen while repairing (F-pshe slide designer).
20. **The criteria-card check names one limit at a time** (first the sticky line, then card
    height, then width), so all three self-repair passes went on one panel (F-pshe).
21. **The final task slide keeps failing to lay out** (PSHE slides 15-16, rainforest slides 18-19):
    a case text, a photo, a question and a criteria panel on one slide, with its check slide the
    same. Two lessons in a row needed a repair round there.
22. **A row does not give a height-bound photo's spare width to the text beside it.**
    slide-visual-sizing.md says it does; in the code only comparison-slot releases width
    (rainforest slide designer).
23. **The header instruction slot holds about 42 characters at 16pt,** so every pupil instruction
    of 46 to 77 characters overflowed and had to move into the body (rainforest slide designer).
24. **A Codex worker's first read of its role file is wasted.** The launch prompt says "Read your
    agent instructions at <path>", so the worker reads the whole file raw, Codex cuts it to about
    10,000 tokens, and only then does the note at the top send it to the page reader. The cut copy
    stays in its context for the whole run. Naming the page-reader command in the launch prompt
    would save it, but the playbook is at its size budget (77 KB), so it needs a trim elsewhere first.
25. **Direct file reads are not guarded.** The page reader now refuses batched pages on Codex, but a
    worker that opens a long reference or JSON file with Get-Content still gets it cut. The role
    notes tell it to use the reader; the session record is the way to check whether they do.
    Seen again on 27 Sept: the astra-high design reviewer read role page 4 in the same code cell as
    Get-Content of the brief and the plan; the reader allowed its page (it cannot count other
    commands' output) and 1,699 tokens were cut.
26. **The Codex voice editor read its working files in one batch and Codex cut them** (lesson 6
    acceptance run, 4.2.299, 27 Sept): one code cell ran Get-Content on its own agent file, the
    voice-edit view and the walk-through (25,482 tokens, cut to about 10,000); a second cell did the
    same with the view, the walk-through and the preflight (11,361 tokens). Its map of strings arrived
    whole because it came first, so little was lost. Same family as 29: the reading guard only sees
    `read-reference.py`, never Get-Content.
27. **Drawn diagram labels are words children read that nobody voices** (same run): the slide
    designer writes a helper's labels from the design's description, giving `Bites; passes
    bacteria`, `Drinks; swallows bacteria`, `Vict.` and `There was a clear gap between the periods.`
    The voice editor never sees them: representations are outside its lane and the labels live in
    `lesson.json`.
28. **The scout can only download a search's top three, even when it has seen the right picture further
    down** (overnight diseases deck): "Photograph of Sewer Tunnels at Wick Lane, East London, 1859"
    (public domain) sat in the Wikimedia "considered" list across ten query phrasings but never ranked
    into the downloadable top three, so the essential sewer picture ended unsatisfied. The flea and
    cholera pictures needed the same trick (re-querying with words from the considered list). Let a
    scout select a named considered candidate directly.
29. **The voice check reads a capitalised label as a new name** (28 Sept, diseases rebuild): the sort
    heading "Fits John Snow's dirty-water idea" was refused as an invented multi-word name ("Fits John
    Snow's"), because a sentence-initial capital joins the run of capitalised words. The editor
    reworded it to "It fits ..." to pass. Strip a sentence-initial word from the run before comparing
    names in check-voice-edit.py.
30. **Grid map: the ring looks like it misses the bridge** (28 Sept, map features lesson). `highlightSquare` draws the ring on the square's bottom-left grid CORNER (the point a four-figure reference is read from), by design in `shared/visuals/grid-map-svg.js`. On the board it reads as a circle that missed the feature: Daniel asked "was it meant to circle the bridge?". Decide: ring the feature's square (and mark the reading corner separately, e.g. a small dot or arrow), or keep the corner ring with a label. Same map: the top northing number (45) is cut off above the frame on every grid map, and the first bridge's dot sits beside the river, not on it.

31. **A key question that asks about something not on the board** (28 Sept, Codex geography full run, slide 4). Over a desert photo with no trees: "What would the trees be missing in a hot, dry place?" Daniel: "what does [it] even mean?". The answer (water) is only on the next slide, and "missing" could mean leaves, shade or water. The lesson designer wrote it (keyQuestions) and the voice editor let it stand, though both already have "name the thing, one thing at a time". Watching for a pattern: one slip, no rule change yet. A better one: "Look at the sand. Why can't trees grow here?"

## Done or no longer needed

- Was 1: **Names arrive after the walk-through is written.** The designer is told to write the walk... (handled 28 Sept: the designer uses a stand-in name and swaps in the drawn one)
- Was 15: **Slides built from the working tree look different from Codex decks** (font sizes). The w... (Codex now installs from the same working tree (28 Sept))
- Was 27: **The designer's child names arrive after the walk-through is written.** The scaffold comm... (duplicate of 1, handled 28 Sept)
- Was 30: **The Codex slide designer repeats a Teach across two slides and drops a picture** (leisur... (pacing across slides is now intended; the dropped picture is covered by the picture-per-thing rule (28 Sept))
- Was 31: **The astra-high designer chose no picture for the work/time Teach and the Oliver case** (... (picture per thing the board talks about (28 Sept))
- Was 34: **Amount for this class** (same run): two diseases, John Snow and 23 slides for a class th... (retell test, one idea per chunk and pacing (28 Sept))
- Was 38: **Leisure lesson 5 asked for only five pictures** (overnight, new order): for a history le... (picture per thing the board talks about (28 Sept))
- Was 36 (then 28): the reviewer's reading scope stopped before `How this teacher explains` (fixed 28 Sept: added to the reviewer's every-review reading list in design-review-packet.py).

Done on the evening of 28 September 2026 (in the working tree, not committed):
- 1 (names: 27 added to the bank, 8 drawn), 30 (grid map ring, numbers, bridges).
- 9, 11, 12, 21: layout agent (wide picture takes lead, question and sticky; banner fills the gap; vocab card false finding; stacks re-share height by need). The geography task-slide map (22% of its slot) is NOT fixed by this: it needs the criteria panel beside the map, not under it (playbook line added).
- 27: diagram labels are quoted by the lesson designer, polished by the voice editor, copied exactly by the slide designer.
- 7: picture requests name what the child must see and leave viewpoint, weather and framing free; a second search round skips pictures the first showed.
- 13: the scaffold makes a sort's answer slot (teaching-sequence beats only).
- 6: one leftover history example (Florence Nightingale) brought in line with the significance rule.
- New: VOCAB_CARD_BEFORE_A_SLIDE_WITHOUT_ITS_WORD in check-slide-design.js (card must sit straight before the first slide whose board shows its word).
