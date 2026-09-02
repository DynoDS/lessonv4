# Teacher slide visual profile

This is the teacher's stable visual-judgement layer for the slide deck. The Slide Designer reads it in full on every run and keeps its judgement in its own context, both while composing and at each of its rendered self-reads. It calibrates how a settled lesson is *presented* on the board — card boundaries, visible task structure, semantic colour, repeated-reference identity — and it never reopens the pedagogy. When it disagrees with a settled design decision, the design decision wins and the disagreement is reported, not silently repaired.

## Card boundary

The card should normally hug the content it contains. A white card is a boundary, and a boundary that is materially taller or wider than the object it holds says the object is smaller or weaker than it is.

- Blank slide background outside an ordinary card may be deliberate breathing room. Judge it as background.
- Large unused white space inside an ordinary card is a warning that the card boundary or the content allocation is wrong. Judge it as a fault when a tighter boundary would preserve the same content and make the content read as larger.
- A card that hugs its content is not "bare". It is the content, framed.

Before finalising a slide, ask of every ordinary card: could the same content sit in a smaller, tighter card and read better from the back of the room? If yes, the boundary is wrong.

The boundary question is two-way: a card that is the right size can instead hold type that is too small for it. Dead space inside a card is normally repaired by tightening the card (`hug`, `widthMode: "content"`), which is the default and the answer for ordinary text. Letting the type grow to the card instead (`heightMode: "fill"`, whose grow behaviour `templates.md` describes) is the answer only where short text is deliberately paired with a taller visual beside it and the two are meant to read as one thing; `templates.md` sets that condition and it is narrow. These are not two tastes to choose between. Small type floating in a large card is the fault; inflating an ordinary instruction until it shouts is not the cure.

The grow repair only works when there are enough words to grow. A two- or three-word label - `Uses electricity`, `Battery` - reaches the grow ceiling as one line and still leaves the rest of a tall card empty, so `fill` can never repair a short label in a tall zone. A short label hugs, and the zone height it gives back goes to the content children actually read at length. The give-away in a preview is a big white box with one small centred line in it: that box wanted `hug`, or wanted less height in the first place.

Width works the same way as height. A one-line lead-in or closing statement spanning the full slide in a card mostly made of empty width should hug its written width (`widthMode: "content"`). Peers that should read uniform — a numbered question set, a row of option cards — instead share one width, sized by the longest member, rather than each hugging separately.

## Paragraph rhythm

A text block that carries more than one idea breaks at each idea: one idea, then a paragraph break (`\n\n`), then the next. Three sentences making three separate points are three paragraphs, not one run-on block — a child re-enters a broken block at any line, but has to wade into a fused one from the top.

The break is presentation, not wording: every word, order and punctuation mark stays exactly as authored. Do not break inside one continuous thought — a sentence and the example that completes it, or two clauses building a single point, stay together. The test: if a sentence stands as its own point, a child should meet it on its own line.

The telling-to-asking boundary is always a break. A statement followed by the question or instruction it sets up splits there, and the asking takes its blue per Semantic colour - the same boundary drives both the break and the colour, so a child sees at a glance which words are for them to act on.

## Visible task structure

Protected source wording may still carry visual syntax. When one source-authored task string contains consecutive phases of one coherent pupil task — find → explain, build → test, test → repair, make the product → annotate it — the phases must be visible before the child has to read every word.

- Preserve the source wording, order and punctuation exactly.
- Insert a visual line break or paragraph break at the real action boundary. The break is presentation, not wording.
- Do not break inside a clause to fake a phase boundary; the boundary is the shift in what the child does.

For a dense task, identify its **survival phrase**: the shortest existing phrase that preserves the central action if a child catches only one part during a glance. Never invent or paraphrase the survival phrase — it must be a substring of the source string. When emphasis genuinely improves entry into the task, mark that exact phrase with the `core-action` presentation role. The other semantic roles (`required-material`, `response-demand`, `reasoning-demand`, `problem-state`, `vocabulary`) are used only when the exact source wording carries that role.

A short bank of selectable or matchable labels is material, not prose. A `taskStructure.kind: "option-bank"` is rendered as discrete items; its labels are never rejoined into comma-separated prose inside the instruction.

## Main task prominence and the header cue

The small top-right `instruction` in the slide header is a secondary cue, not the home of the main pupil task.

A child must not have to notice the small header cue in order to know the principal thing they are meant to do.

When a source-authored `pupilInstruction`, question or task demand is the main action of the slide, place that wording in the body composition at task-reading size. It may sit in a text card, question card, task stack or another body object suited to the teaching relationship.

Use the header `instruction` only for a short secondary cue that helps use the main body, such as:

- `Use the word bank`;
- `Look at both circuits`;
- `Use the table`;
- another short source-authorised reference or recording cue.

Do not move a full multi-action task into the header merely because every template exposes an `instruction` field. A fixed template whose only usable task location would make the main task a small header cue is not a faithful template for that slide; choose body geometry that gives the task proper prominence.

The body must still state the task once. Do not duplicate the same source-authored task in both the header and the body.

## Row versus stack: the smallest load-bearing visual

Before putting two or more load-bearing visuals into a `row` or a `stack`, picture the actual items at their real aspect ratios in both arrangements and judge the **smallest load-bearing visual** each arrangement produces.

- Choose the orientation that keeps the smallest load-bearing visual larger and more usable at projection distance.
- The zone's long axis is a tiebreaker only when both arrangements protect the important visuals equally well.
- A row that turns a photograph, diagram or reference into a thumbnail is the wrong row even when the containing zone is wide. A stack may use that same wide zone better by giving each item the full width.

A neat row is not a success when the neatness is bought by making the smallest item the smallest thing on the slide.

## Whole-composition alignment and useful space

Related columns, rows and panels form one composition. Do not judge each zone in isolation.

When a shorter content group sits beside a taller peer such as a photograph, success-criteria panel, table or reference:

- align their top and bottom edges when they genuinely share those boundaries;
- otherwise vertically centre the shorter group against the taller peer when that gives the pair one clear shared visual centre;
- do not pin both zones to the top by habit and leave a large meaningless void below the shorter group.

In the side-by-side split templates the builder settles this itself: it measures both sides, centres the shorter measured member on the pair, and sizes a `fill` text card to the taller member. Compositions outside those splits still carry this judgement by hand.

Judge the group as a whole. A word bank plus its questions is one group. An instruction plus the picture it governs is one group. A task line plus the table pupils fill is one group.

Whitespace outside a card is not automatically useful breathing room. If important paired content remains unnecessarily small while nearby background space could make it larger, better aligned or easier to read, use that space.

A text answer or reference may deliberately fill the height of its paired visual instead of hugging its minimum natural height when the larger treatment:

- makes the pair easier to compare;
- allows meaningful paragraph spacing;
- increases the readable type;
- and does not falsely imply extra content.

The active pupil-working surface normally wins space over a supporting setup picture. A table children complete, a diagram they annotate, a source they inspect or another object they actively work from is normally larger than a non-load-bearing picture that merely reminds them what the setup looks like.

Two neighbouring objects do not earn equal space merely because there are two of them. Allocate space by teaching importance and pupil use.

## Semantic colour

The deck's core colour grammar is asking versus telling.

- Black carries ordinary teacher explanation, supporting prose, statements, takeaways, success-criteria body text and reminder body text. When the board is just talking to children - telling them things - the words are black.
- House blue carries the words that ask children something or tell them to do something: a question they answer, an instruction they act on. It also organises slide titles, short option labels, category names and other secondary organising labels. When the board turns to the child - `Which fan needed electricity?`, `Explain how you know.` - those words are blue.
- The boundary is the sentence, not the block. A block that first tells and then asks splits at that boundary: the telling stays black, the asking goes blue, and a paragraph break sits between them so a child sees where the explanation stops and their job starts. `A kettle and a lamp are both appliances.` is black; `What is electricity doing in each one?` follows on its own line in blue. Never colour a whole mixed block blue for the question buried inside it - that hides the question instead of lifting it.
- The treatment is deck-wide: every child-facing question and pupil instruction carries it, not a favoured few. The carrying fields are `color` or `focus-blue` for a whole line and `[[ ]]` for a span inside a line.
- `peer-blue` and `peer-purple` exist only for a compact set of two or more equal-status peer prompts where alternating colour helps children keep the prompts visually separate. Start with house blue and run the set `peer-blue`, `peer-purple`, `peer-blue`, `peer-purple`. The pattern separates equal-status prompts; it must never imply correctness, sequence, difficulty or category meaning.
- `task-action` marks an existing action verb or short action phrase such as `Build`, `Test`, `Record`, `Compare` or `Explain` when exposing those verbs makes a multi-phase task easier to scan. Several `task-action` spans may appear in one instruction. Do not colour every verb in ordinary prose.
- `problem-state` red is reserved for source wording that names a genuine failed or wrong state.
- `safety-warning` red is reserved for an exact source-authored safety warning. Safety and failure are different semantic roles even though both use the problem-red palette.
- Vocabulary green marks this lesson's taught terms wherever a child reads them: in task text, teaching sentences, sticky knowledge, success criteria and captions alike, every occurrence, so the word looks the same on slide 12 as it did on its vocabulary card and a child recognises it as the word they were taught. Mark each occurrence with the `vocabulary` emphasis role. The terms are the lesson's vocabulary cards (and a prior lesson's term the design says children already hold), not every subject noun on the slide: `biome` and `climate` are green on a lesson that taught them; `country` is not. Answer reveals keep their own green, so a taught term inside a revealed answer is not marked twice. Answer green belongs only to answers being revealed or marked - and on an answer slide it belongs on the answer words themselves. A green outline around black words is a frame, not an answer treatment.

Use size, position and spacing, not colour, when prominence alone is the job of a black explanatory line.

## Task-to-object attachment

When different phases of one task act on different visible objects, attach each phase to the object it governs.

For a practical investigation whose settled wording means:

- build or test the circuit shown in the photograph;
- record the result in the table;

do not place one combined instruction remotely in the header while the photograph and table sit elsewhere.

Instead, preserve every source word but compose the slide so the build/test wording is adjacent to the setup picture and the record wording is adjacent to the recording table.

Spatial attachment is presentation, not a change to the lesson.

The same rule applies beyond Science: an instruction to inspect one source belongs with that source; a later instruction to record, classify, annotate or explain belongs with the object pupils use for that phase.

## Parallel-group distinction

When two or more parallel groups must remain conceptually separate, give the groups one visible discriminator.

Keep the internal treatment consistent within each group and create the difference between groups through one restrained device:

- a group accent;
- an existing meaningful group heading;
- another established category treatment already justified by the lesson.

Do not require several discriminators at once. A coloured group accent plus a divider plus differently coloured child cards is normally redundant.

The key test is: can a child see that these are two separate flows or groups before reading all of their cards?

Do not introduce a group discriminator when the items are one continuous sequence.

## Repeated-reference identity

The same teaching object keeps the same visual identity wherever it returns in the deck.

- Success criteria keep one identity across templates: the pale green panel, the `✓ Success Criteria` heading, and one compact white card per criterion with a green number badge. The route to the panel (fixed `*-sc` template or free `sc-panel`) never changes that identity; a flat divided rendering of the same criteria beside a white-card version is a local visual inconsistency.
- The circuit symbol bank keeps its identity as a row of individually labelled standard symbols. A complete circuit diagram is a different teaching object; it is not a substitute for the symbol-by-symbol reference, and the bank is not shrunk into a cue.
- Repeated photographs, diagrams and references return with the same treatment, same scale relationship to their neighbours, and the same attachment to their answers.

## Question numbering boundary

The profile calibrates how numbering is *seen*, not which lessons get numbered work. Numbering follows the Question Labelling rules in `preferences.md`. A lone (1) on the circuit calibration was not identified as an intentional teacher correction. This calibration does not establish that a single main-independent question should lose its normal numbering. Continue to follow Question Labelling in `preferences.md` unless later calibration explicitly changes that rule. This profile adds no numbering rule of its own: where a template letters a set (a teacher-led Maths Our Turn of two or more discrete questions, the first opening the sequence), that is the renderer's Question Labelling behaviour, not a rule the profile owns.

## Final teacher pass

After the deterministic check passes, the Slide Designer renders the checked preview and reads the whole deck in its own context, once, as the teacher would meet it:

- read each slide from a distance, not from a screen;
- check that the principal pupil task is in the body at task-reading size rather than dependent on the small header cue;
- check the card boundaries and whether important content remains unnecessarily small beside unused background space;
- check that real task phases are visibly separated and, where they govern different objects, physically attached to those objects;
- check whether shorter groups are deliberately aligned against their taller peers rather than automatically pinned to the top;
- check the smallest load-bearing visual in every row and stack;
- check that active pupil-working surfaces receive more space than non-load-bearing setup or decorative references;
- check focal-question colour, task-action emphasis, peer colour and safety/problem colour against their semantic roles;
- check that parallel groups have one visible discriminator when their distinction matters;
- check repeated-reference identity;
- leave the optional P2/P3 layer alone: the Slide Decorator runs that pass after this one, over the same rendered pages, and it is the decorator that reads `[WORKING_DIR]/optional-picture-pass.json` beside its own render to check the earlier optional P2/P3 pass against what is actually on the page. The record is the pass's own account of every slide, so a slide declined as `full` or `competes` that renders with obvious room to spare, or a slide declined as `would-mislead` whose task no drawing could give away, is a line that does not match its page. Until this record existed the pass left no trace and this check could not really be made;
- repair only faults the Slide Designer owns, on the candidate file, and rerun the complete check with a fresh preview;
- when a clear owned fault survives the shared repair budget, fail the check with the named diagnostics instead of promoting a deck the teacher will have to fight.

The pass is a presentation-and-usability judgement. It does not reopen what is taught, in what order, or with what support.
