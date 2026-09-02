# Slide composition playbook

This is a required Slide Designer reference. Read it in full at the start of every run, after reading the lesson as a whole and before choosing any template.

It restores the practical slide-level judgement that sits between an authoritative lesson design and a mechanically valid PowerPoint. The lesson design still owns the pedagogy, examples, questions, answers, representations, required pictures and source-authored pupil wording. The Slide Designer owns how those settled decisions become a clear, teachable board.

The goal is not merely a valid `lesson.json`. The goal is a deck a teacher can teach from and a child can understand at a glance.

---

## 1. Exercise real slide-level judgement

The pedagogical decisions arrive already made. Your judgement is slide-level, and it is real judgement, exercised fully: how many slides a source unit needs, which template fits, what goes in each slot, what dominates, what recedes, how the visual relationship reads, and whether the finished board works from the back of the room.

Re-presenting the lesson-designer's decisions faithfully is the boundary. Thinking hard about how they land on a slide is the job.

Do the spec yourself. Do not delegate template lookup, helper lookup, slide runs or final checking to another model. A paraphrased helper contract or source-unit string is exactly the kind of small drift that produces a wrong or unbuildable deck. Use the deterministic check for checking and keep the design judgement in one context.

Read the whole lesson sequence before choosing a template. Do not design each source unit in isolation. A deck gets repetitive, visually flat or pedagogically misleading when every slide is solved locally without seeing the lesson arc.

---

## 2. Fixed template first when the move matches; geometry otherwise

Before looking at a template, name the visual relationship the slide must make legible:

- one thing and its parts;
- two things compared;
- sequence or process;
- cause and effect;
- category membership;
- change over time;
- one worked move;
- one question and one supporting representation;
- one photograph children inspect;
- a small set of photographs children compare;
- a rule or reference children repeatedly consult.

When a fixed template is tuned for that exact move, use it. Do not rebuild a maths My Turn, vocabulary reveal, success-criteria reference or two-card comparison from generic splits merely to be different.

Template names are common uses, not exclusive uses. When no fixed template fits, choose the free template whose geometry fits the actual content. A wide visual needs a wide zone. A vertical list of steps needs a tall zone. A sentence-length table needs width. The physical relationship wins over the template's name.

When two templates are equally faithful, prefer the simpler one. Use visual variety only as a tiebreaker. Do not change template, colour or representation just because the previous slide looked similar. Consistency is useful when the learning relationship repeats; variety is useful when the relationship changes.

---

## 3. The narrow presentation-wording exception

Source-authored pupil-facing content remains authoritative and exact. Never polish, shorten, simplify or paraphrase a supplied question, example, claim, sentence stem, success criterion, sticky fact, vocabulary definition, visible standard or representation label.

`pupilInstruction`, when non-null, is also authoritative and is copied exactly. You may insert a visual line break between existing words or sentences when their order and punctuation stay unchanged. A line break is presentation, not wording.

When `taskStructure` is present, its group labels, item labels and non-null item details are already the protected exact pieces. Keep those pieces separate. Do not join them into a paragraph and do not invent replacement labels.

When `pupilInstruction` is null on a pupil-action source unit, the Slide Designer may author **one short piece of slide furniture** - normally a title or `instruction` - that names the already-settled action in child-facing form. This is the only presentation-wording exception.

The derived line may:

- name the action already present in the source unit, such as `Match each pair`, `Sort the examples`, `Write one reason`, or `Choose and explain`;
- identify an already-specified recording form, such as `Write the pairs` when the source unit already requires written pairs;
- distinguish task from material so children know where to start.

It may not:

- change or narrow the question;
- add a reason, condition, method, medium, number of responses or success standard not supplied upstream;
- reveal an answer or judgement;
- replace a source-authored question with a near-copy;
- invent classroom routine, such as books, whiteboards, partner talk or cold call, unless that medium is itself part of the settled task;
- rescue genuinely unclear upstream wording by silently rewriting it.

If one source-authored field is unclear, overlong or unsuitable for the board after a better template, safe line breaks and a faithful slide split have been tried, preserve it and return a content fault. Do not use the presentation exception to disguise an upstream problem. Do not return a content fault merely because a structured task needs cards, groups or more than one physical slide.

Strings authored under this exception are Slide Designer-owned furniture. They may be shortened or removed during composition repair when they duplicate another slot or create overload. Source-authored strings may not.

---

## 4. State the task once and set the material apart from it

A practice slide carries two different things: the task, meaning what to do, and the material, meaning what to do it to. A child should see at a glance which is which.

State the task once as one concise directive. Set the material apart as the element the eye lands on: larger, lower, in its own line, card, table, diagram or picture area. Do not repeat the instruction inside every question card or answer box.

The small header `instruction` is not the default task surface. Use it only for a short secondary cue. When the task itself is what pupils must find and act on, place the exact task wording in the body where it reads at task size.

A child who misses the small top-right header cue must not therefore miss the principal task.

Never duplicate content already shown in another slot. The title counts as a slot, and so do the prompts a helper prints itself: a frame whose sections already ask `What does biome mean? Give one example.` does not also need a numbered box above it restating the same demands as prose - the frame IS the task stated, so the box above it is the duplicate, and the denser read of the two. When the source's task wording only restates what the chosen helper's own printed prompts ask, surfacing it once - through the helper - is the faithful rendering; keep a separate instruction line only for the part the helper does not say, usually the one sentence that gets children into the frame. A title such as `Match it up` does not need an instruction that says `Match each word to its definition`. Let an instruction add only something the title does not say, usually the settled recording form, or leave it out.

A lettered or card task slot confers task identity. Put only genuine child tasks there. A success standard, briefing, reminder or description of the finished outcome is not another task and must not be wrapped in a lettered question card.

Ask of every entry placed in a question or task-card slot: **is this something the child does here, or something they are being told about?** Only the doing earns a label and a card.

Label practice items by index, not by what they obviously are. Give each item a plain letter or number and let the task prompt name the real work. Calling visible items `grid`, `pyramid`, `clock` or `triangle` wastes the label on something children can already see and can leak the classification they are meant to decide.

When an entry is a read-a-value task, show the real question the figure answers - for example, `How many children chose football?` - rather than a meta-instruction such as `Read the football bar`, unless the latter is the exact source-authored wording.

### Make task phases visible before full reading

Protected wording may still have visual syntax.

Where a break may fall in settled prose is owned by Written Voice (House Style) in `preferences.md`: its density-and-rhythm rule covers every multi-sentence block a child reads - a scenario, a model answer, an explanation and a task alike - and carries the hard constraint that a break only separates words that are already there. Apply it here so a child sees `build → test → repair` or `find → explain` before fully reading the prose. What this playbook adds is the presentation layer on top:

For a dense task, identify the existing **survival phrase**: the shortest source-authored phrase that preserves the central action if the child catches only one part during a glance. Give that phrase the `core-action` presentation role when emphasis improves entry into the task.

When several source-authored action verbs expose the structure more clearly than one survival phrase alone, give those exact verbs or short action phrases the `task-action` role.

When different phases act on different visible objects, place the phase beside its object. The visual relationship should read as `Build/Test → circuit` and `Record → table`, not as one remote instruction followed by two unrelated objects.

Use `required-material`, `response-demand`, `reasoning-demand`, `problem-state`, `safety-warning` and `vocabulary` only when the exact words genuinely have that role. Presentation roles never author new wording.

A short bank of selectable or matchable labels is material, not prose. When the lesson design supplies `taskStructure.kind: "option-bank"`, render its labels as discrete options rather than joining them back into the instruction.

---

## 5. Build a hierarchy, not a pile of equal boxes

Every slide should answer three questions at a glance:

1. What is this slide about?
2. What should I look at first?
3. What am I supposed to do with it?

The main teaching surface must be the biggest or strongest thing. A question children answer should dominate its supporting reference. A diagram being taught should dominate the sentence beside it. A photograph used as evidence should dominate the prose that tells children to inspect it.

When pupils actively work in or from a table, recording grid, diagram, source or other response surface, that active surface normally dominates a non-load-bearing setup photograph. Do not make the photograph the hero merely because it is visually attractive.

Two neighbouring objects do not default to equal shares. Use an asymmetric split when one object does more teaching work.

A central visual is the hero of its slide, so size it to be read, then arrange the rest around it. Being present is not enough. If children must read a graph scale, inspect a photograph, follow a diagram, compare maps or judge clock hands, that visual must be usable from the back of the room.

Give short text enough room to become board-sized. The renderer grows marked text to the largest safe whole-point size and then shrinks only when needed. It never grows the box, lets one word split across lines or changes the source wording. Related peers share one grow-fit group, so categories stay one size, definitions stay one size and repeated task lines stay one size. Do not hand-pick a different font size for each peer. Choose the right zone and let the shared fit use it.

Do not make every line the same weight. Use the established colour roles and size hierarchy from `preferences.md` and `templates.md`:

Treat neighbouring zones as one composition. When one side is materially shorter than the other, choose deliberate top alignment, bottom alignment or vertical centring. A shorter group pinned to the top with a large unused void underneath is not automatically well aligned because every individual object fits.

When two parallel rows or stacks must read as separate groups, use one restrained group discriminator. Prefer `groupAccent` or an already meaningful group heading. Keep each group's child cards internally consistent and do not stack several redundant differentiators onto the same pair.

- question or focus is prominent;
- material children work from is clearly grouped and subordinate to the prompt only when the prompt is the real focus;
- what children produce remains readable and distinct;
- success criteria and references remain usable but do not compete with the task;
- hints recede;
- green remains reserved for revealed answers and vocabulary headwords according to the existing contract.

A single flat colour gives the eye nothing to land on. Colour earns its place by separating roles, not by flooding a whole slide.

**Repeated reference material recedes; the current move leads.** Across a run of slides that share a reference (a success criteria panel, a word bank, a chart, a sticky fact), the reference keeps one consistent, quieter place and proportion, and the thing that has changed since the last slide is the largest and first-read element: the new task, the new material, the thing children just made now being worked on. A teacher skimming the deck reads the change between slides, so when the repeated panel is the dominant element on three consecutive slides they see three copies of one slide, and the lesson's biggest move (my rule, then our group's rules, then our class agreement) is the small part of the screen. Receding is position and proportion, never truncation: the reference stays complete and readable, per §9.

---

## 6. Space-pressure order

The first answer to a tight slide is: **is there a better template or zone allocation?** Most cramped slides are template mismatch, not excessive lesson content.

When the most suitable composition is still tight, protect content in this order:

1. the exact question or prompt;
2. the central content the question is about - the text, picture, diagram, table, chart, map, example or stimulus;
3. every success criterion, sticky fact, representation or reference explicitly attached to this source unit;
4. useful contextual support;
5. optional decoration.

Nothing in this order authorises dropping a reference explicitly named by the source unit. It tells you what must receive space first and what should be re-composed, reduced to a lighter existing treatment, moved to another consecutive slide with the same `designUnitId`, or removed when optional.

Drop duplicate instructions and pure decoration before shrinking required content. P2 and P3 never make P1 smaller. When a coherent move still cannot fit at the documented readable floors, split rather than shrink or delete.

Each split must preserve source-unit identity and order. Do not split one sentence into arbitrary fragments merely to satisfy layout. Split by a real visual or instructional boundary: stimulus then question, examples 1-2 then 3-4, one modelled visual per slide, or one readable half of a visual question set per slide.

A split must also survive a teacher who has never seen the deck. The teacher teaches from the board without previewing it, so a continuation has to announce itself on the slides, not in the notes: the earlier slide must not read as the complete moment when the work actually finishes on the next one, and each continuation slide leads with what is new while repeating only what is still live. Two consecutive slides that render near-identically are a failed split - the teacher finishes the first, sees the "same" slide, and clicks past the half that held the reference or the task. When a template cannot hold a still-needed reference beside its task, prefer re-composing so it can (a side panel in a row usually does it) over inserting a reference-only interlude slide, which has no job of its own to show. A split moves the shared reference onto whichever half still needs it rather than copying it onto both: two slides carrying the same chart and the same relationship strip are the one crowded slide printed twice, and the half left holding only the reference has nothing for the class to do. A slide labelled My Turn, Our Turn or Your Turn carries that turn's own question, task or answer, and the build refuses one that does not (`TURN_SLIDE_WITHOUT_ITS_TURN`).

If pupils still use the same success criteria on each continuation slide, repeat the full exact criteria on each one. Its appearance on the first slide is not a reason to remove or compact it later. Place a repeated success-criteria panel beside the task (a row) rather than as a full-width band beneath it when the stack is tight: growing a bottom panel's share squeezes the very task the criteria serve.

---

## 7. Empty space is working space

When a slide leaves room for the teacher to complete a diagram live, simply leave the room. Never label it `Working space`, never add `teacher writes here`, and never use rows of typed underscores as a substitute.

A blank or partly blank helper already carries the interaction. The empty bubbles, cells, bricks, table rows or drawing surface are the useful starting state. A caption narrating `draw here`, `write here` or `your turn` fills the very space it describes and can make children think they should write on the board.

Where work happens away from the slide, the slide usually needs no empty workspace at all. Show the exact question, representation, reference and success criteria named by the source unit. Do not invent a generic annotation column.

Read `slide-representations.md` for the modelling-state mechanics and exact working-space flags.

---

## 8. Preserve representation continuity and visual alignment

Resolve every `representationRef` and configuration before choosing the template. The representation family, configuration, required features and interaction state are pedagogical and do not change for visual convenience.

My Turn, Our Turn and Your Turn should look like a coherent progression around the same method and representation. Support may fade only through configurations and references explicitly supplied upstream. Do not switch from a part-whole model to a bar model, or from a photograph to a generic icon, because another template looks cleaner.

By independent practice, let the scaffold fade **only as the structured source says it fades**. A reference absent from the current source unit stays absent. A success-criteria, sticky-knowledge or representation reference present on the current source unit stays visible. Do not re-add a teaching reference from an earlier unit because it feels helpful, and do not remove a current reference because independent work is normally less scaffolded.

Sibling visuals of the same calculation or comparison are one composite visual, not unrelated items. Two part-whole models, two bars or two number lines should be arranged so their relationship is immediately visible.

Preserve column alignment between paired abstract and concrete representations. When two abstract diagrams sit left and right, their corresponding coin groups, counters or base-ten references should sit left and right beneath the same amounts rather than in one undifferentiated row.

One worked example belongs on one modelling slide when each example needs its own large annotated visual. Two examples that each own a place-value chart, number line, bar model or labelled diagram should not share one helper and overwrite each other. Off-slide calculations with no individual on-slide visual may share a slide when the source unit and readable geometry allow it.

Sequence and comparison are not the same geometry. Arrows assert a journey. Use a chain only when state B genuinely follows state A. Two comparisons sharing one starting point are separate pairs, not a three-state chain.

A fan-in pathway is also not a text chain. When several distinct sources lead into one intermediate state and then one outcome, use `source-pathway`. Each source remains a separate node, every source visibly joins the intermediate node, and the intermediate node visibly leads to the outcome. Do not replace this geometry with emoji, labels and typed arrow characters.

---

## 9. Success criteria are a live reference

Whenever a source unit has `successCriteriaRefs` or `stickyKnowledgeRefs`, read `slide-success-criteria.md` before composing that slide.

Success criteria should read as success criteria, not as a free-floating list. Use a labelled `*-sc` slot or `sc-panel` treatment and keep the panel beside what its steps refer to.

Copy every step verbatim. Never shorten a step to fit. Choose a roomier slot, a different template or a coherent split.

Use a Success Criteria Helper only when a step names the stable visible mark, movement, structure or placement that the helper depicts. Do not add an icon beside every step as decoration.

Sticky knowledge appears only where the current unit references it. Follow the combined-panel and deduplication mechanics in `slide-success-criteria.md`; do not create a second box merely because the template has room.

Do not insert a ceremonial success-criteria slide before the teaching unless the criteria itself is being taught, compared or constructed. The same holds mid-lesson: a slide holding only a reference and criteria between a task's introduction and the task itself is an interlude with no job of its own - put the reference beside the task instead, and give every slide a visible reason to be on the screen.

---

## 10. Answer slides answer the task in the form asked

The structured `answer` object is the sole content authority. Never reconstruct, embellish or infer an answer.

When `answer.structure.kind` is `sort`, its placements are the visible answer. Rebuild the same groups and items in their answered positions with `sort-board`. Keep item photographs and details where they are needed for checking.

When `answer.structure.kind` is `evidence-classification`, each result is the visible answer for one photograph. Use `evidence-cards` and keep the photograph and all of its result values inside one card. Do not place several photographs above one combined answer strip.

Do not also render a prose answer when `answer.structure` is present, because structured answers require `answer.content: null`.

An answer slide answers everything the question asked, in the form the question asked for. When the task asks for a reason, the reason is part of the answer. A ranking task answered by only the ordered names leaves children with nothing against which to check their justification.

Preserve the representation when the answer is best understood through it. A completed diagram is usually the reveal for a diagram question. A matched set should show the matches. A selected option should be revealed in place. Do not turn a visual answer into an unrelated text list merely because text is easier to fit.

Where the question relied on photographs, a map, a graph, a source or a diagram, keep that evidence on the answer slide when children need it to understand or check the answer. The answer should not become three words floating away from the visual relationship the class just reasoned from.

On answer-reveal slides, give a small slot to the answer, not to a repeated question. When the question has been on screen for several minutes, repeating it inside a thin banner can force both question and answer below readable size. Replace that small slot with the answer, or leave it empty when a larger zone already carries the complete reveal. Keep enough context for the slide to remain understandable; do not mechanically duplicate every word.

Green is the answer signal. Use the supported reveal treatment such as `||` exactly where the helper or template contract requires it.

---

## 11. Claims and speaking characters need the thing being judged

Whenever a source unit contains a speaking character, voiced claim, misconception, disagreement or advice-to-a-character move, read `slide-speech-and-characters.md` before composing it.

Count the actual voices and choose the matching bubble count. Never invent another speaker to fill a template.

Keep the title open so children must inspect before deciding. Do not announce that the character is wrong before the task asks children to judge.

Whenever a claim can be weighed against something children can look at, show that real referent beside the speaker: the photograph, map, chart, diagram, table, text or result set already authorised by the lesson design. Without it, the task becomes recall of what the teacher said rather than reasoning from evidence.

The referent, not the portrait, is the hero when reading it is the work.

---

## 12. Sets, banks, categories and captions

Render a set of discrete labels as discrete objects. A word bank, option set, property-label set or sorting bank should normally use `chip-bank`, not one text line joined by commas or middots. Children need to see separate choices, not fake bullets flattened into prose.

Render labelled parallel fields as a structure whose headings look like headings. When content is the same set of labels repeated across one or more items - a completed classification (`Object name` / `Power source` / `Electricity's job`), a flow with named stages, an attribute comparison - use `table` (the labels become a real header row) or the matching frame helper (`method-frame` prints each label beside its space). Never build it from plain text cards with the label fused into the value: `"Object name\nKettle"` centred in a card renders label and value as one black blob, so the labels stop reading as headings at all and every card carries its own copy of them. A heading is a heading only when it sits in its own visual position - a header row, a frame label, a distinct top line - not when it is merely the first words of the content.

For a structured sort, make the action visible in the geometry. Groups look like destinations. Label-only items look movable or selectable. Evidence items look like separate cards and keep each clue or photograph attached to the item it describes. On the completed sort, the items use the category areas at the largest shared safe size. The task must not look like a paragraph followed by decoration.

On the sort's task slide, the items being sorted are the load-bearing reading content - they are what children name, weigh and place, so the item bank takes the slide's spare height and its chips grow board-sized. Each empty destination hugs its label: nothing lands inside it on the board, so a destination stretched tall to fill the zone is dead space wearing a border, not a drop zone. Two hugged destinations with a large item bank above them read correctly; two huge empty boxes under a strip of small chips read backwards.

Use the available width before accepting a stranded final chip. A full-width bank of six or fewer short labels should normally use `maxRows: 1` when the scratch build keeps the complete shared label size readable. For two empty sort destinations, anchor the first destination from the left edge and the second from the right edge.

Parallel peers share geometry as well as purpose. A row of category or option cards uses equal card height, equal vertical position, one shared maximum safe text size and one alignment. A short closing statement may use a centred content-width card when a full-width card would contain unused white space.

For a photograph-based evidence classification, the photograph and its answer are one visual unit. The card boundary, vertical alignment and spacing must make the pair obvious without a connector line. Split a large set between complete cards, never between the photograph and its result.

When a slide introduces two to four categories or locations, give each a visual hook when the source design authorises one. Do not turn a foundation-subject concept set into three columns of small prose merely because a grid template exists. The visual hook can be a required picture, representation, built-in visual or genuinely meaningful emoji; it must not be invented decoration.

Captions identify what an image cannot say on its own: a place, time, identity or technical name. Do not caption the obvious. Information children must act on belongs in a proper readable text slot, not in small italic caption text.

Every picture on the slide needs a visible role. When the question names only one of a displayed pair - "why is the torch electrical?" over a kettle and a torch - the unnamed picture is there as the contrast, and the slide must say so where children can see it: a short caption naming what it shows ("Mains electricity reaches the kettle through its plug"), or a secondary prompt that brings it into the thinking ("How is this one different?"). The reason is usually already written in the speaker notes; a teacher who has not read them meets an unexplained object, and a child wonders why it is there. A picture that earns no visible role comes off the slide.

When visual comparison matters, keep images at comparable scale and crop style. Do not make one item visually dominant unless the asymmetry is pedagogically meaningful.

---

## 13. A title question must visibly land an answer

When a teaching slide's title asks a question, the idea that answers it must be visible on the slide, not only in speaker notes. The slide can carry the answer as a takeaway, annotated relationship, callout, labelled diagram or other suitable visual form.

Likewise, a key question children are meant to think about during a Teach unit must be visible when the structured source provides it. It should not disappear into notes simply because the chosen template has no obvious slot. Choose another composition.

Do not copy the whole spoken script onto the board. Re-form the settled visible content as the teaching object itself: the marked example, diagram, source, comparison, question, labels or short takeaway.

---

## Surface execution cues

### Starter

The starter is slide 1. It carries the Date and shortened displayed LO in the starter header. The full objective remains in teacher orientation and other planning surfaces. Teacher orientation appears at the start of slide 1 notes only. A definite starter answer follows immediately when the structured answer requests an answer slide. A test-question image remains large enough to read at projection distance.

### Vocabulary

Use the exact structured visual selected upstream. Keep one coherent card or comparison per genuine conceptual unit. A text-only card is complete when `kind: none` or no honest semantic visual exists. Do not add P3 merely because a vocabulary card is text-only.

Vocabulary is presented on one `key-vocabulary` slide: all the lesson's words as a single glanceable reference the class returns to, each card carrying its word, definition and visual. Do not spread the words across one-word-per-slide vocabulary slides - a run of them slows the open of the lesson and scatters into four slides the reference children need in one place. When one word genuinely needs teaching rather than introducing, that teaching is a Teach beat with its own slide in the sequence, in addition to - never instead of - the word's card on the vocabulary slide.

When two vocabulary words are taught as a contrast on `teach-compare`, set `headingRole: "vocabulary"` so both headwords take vocabulary green rather than the template's category palette — they are equals being defined, not competing categories.

### Teaching and pupil action

A teaching slide keeps the teaching object visible. Notes may enrich it but do not hold a hidden second lesson. When a title asks a question, the answer idea is visible on the slide. Keep every structured `keyQuestions` entry visible in a readable treatment. A pupil-action slide makes the material, decision, response and active reference visible. When a non-null pupil instruction is not independently actionable, preserve it and return `PUPIL_INSTRUCTION_AMBIGUOUS` instead of repairing it through presentation wording.

Before printing any source string, confirm that it is child-facing. Sourcing instructions, answer metadata, renderer notes, fit priorities and teacher rationale belong in non-visible fields or require an upstream hand-off. Do not print planning metadata.

For `taskStructure.kind: "sort"`, show every group as a destination and every item as a separate chip, card or photograph card. Keep every non-null detail. A completed structured sort uses `sort-board` so all item labels share one largest safe size across the whole answer.

For `taskStructure.kind: "evidence-classification"`, use `evidence-cards` on the task and answer. Keep each photograph and all of its result fields inside one card. Split only between complete cards.

If a structured set remains readable on one slide, keep it together. If it does not, use consecutive slides with the same `designUnitId`. Repeat exact group labels and every still-needed live reference. Do not remove a boundary clue to make the slide fit.

"One clear teaching job" is the set's job, not each item's: a small set of two to four cards answering the same prompt is one teaching job, and it belongs on one slide when the cards stay readable there. One card per slide with the same instruction repeated above each is the same task stretched across the deck's opening - a class reads three photographs on one slide comfortably, and the check slide that later shows those same cards side by side is proof of the capacity. Match the check's grouping to the task's, so children compare the same arrangement they answered.

### Worked examples and physical demonstrations

One modelled example gets its own slide when it needs its own large annotated visual. Empty helper space remains unlabelled. A physical-demonstration slide stays intentionally sparse and shows only the equipment, setup, safety, short sequence or later-use reference selected upstream.

### Comparison, sequence, and fan-in

Make comparison spatial. Align like with like and keep comparable images at comparable scale. For three or four category cards, use short labels and captions rather than placing one large paragraph under every category. Arrows show a journey, not a parallel comparison. A fan-in relationship uses `source-pathway` so each source reaches the named intermediate state and that state reaches the outcome.

### Maps, charts, diagrams, and photographs

Treat maps, charts and diagrams as teaching surfaces. Keep keys, scales, axes and labels readable. Preserve shared geometry when a supported shared helper exists.

Use `contain` when the whole image or its edges carry evidence. Use `cover` only when a centred crop cannot remove a load-bearing feature. Keep comparison crops consistent unless evidence requires a different treatment.

### Lesson rhythm

In content-based lessons, make Teach then Do chunking visible. A Do slide carries only the references its source unit names.

In skill-based lessons, My Turn, Our Turn and Your Turn keep one visual language around the same method. Support changes only through the current source configuration and references.

In discovery lessons, the phenomenon or exploration dominates before explanation. Do not pre-explain the finding on the noticing slide.

In dialogic lessons, keep stimulus and prompt available together. A discussion slide shows the actual claim, scenario, source, choice or referent rather than teacher prose. The Reflect is purposeful individual synthesis and does not read as an answer to a discussion.

In task-centred lessons, the substantial task remains the centre of gravity. Enabling input and checkpoints support it without becoming the visual main event. A planning or checkpoint slide shows only the decisions pupils must make and the standard they need to meet.

### Colour

Use the semantic roles in `teacher-slide-visual-profile.md` and the exact supported fields in `templates.md`. The core grammar is asking versus telling: words that ask children something or tell them to do something carry house blue; words that explain, state or remind stay black; a block that does both splits at the boundary, telling black, asking blue, with a paragraph break between them. Prepared examples and visible-in-unit models stay black. Answer green remains an answer signal, on the answer words themselves. Vocabulary and success criteria keep their established green roles. A category container takes its colour on the border through the documented `categoryColor` field, so the grouping reads as a border language rather than a painted panel. Ordinary question lists and success-criteria steps stay out of that palette. Use size, position and spacing, not colour, when a black explanatory line only needs prominence.

A colour treatment is a deck-wide decision, not a per-slide flourish. Colour teaches a child what kind of thing they are looking at only if the same kind gets the same treatment on every slide: a deck where the question is house blue on slide 9 and body black on slide 8 has spent the colour and lost the meaning, and reads as assembled by different hands. Every child-facing question and pupil instruction carries the blue; the same holds for any emphasis role - a deck that underlines `required-material` in one task underlines it in all of them. Half-applied roles are worse than unapplied ones.

Deck-wide consistency chooses how a role looks, never whether role-carrying wording gets its treatment at all. Wording that genuinely is a question or instruction to children, a safety warning, a failed state, a taught vocabulary term or the action verbs of a multi-phase task carries its role wherever it appears; "none" is not a consistent answer for those, only for the optional judgement roles like the peer colours. A safety list rendered as five equal black lines has not been restrained, it has hidden the one line children must not miss.

## 14. Deck-level quality tells

Before accepting the deck, read it in order and look specifically for these regression tells:

- the same generic split used repeatedly despite changing learning relationships;
- every slide made of equal-weight black text boxes;
- the central picture, diagram or source smaller than its supporting prose;
- task and material presented as two indistinguishable text blocks;
- an instruction repeated in the title, header and question card;
- a header cue that merely repeats what the body already labels (a `complete / incomplete` cue over a comparison whose two headings are `complete` and `incomplete`);
- an instruction box restating the prompts a frame below it already prints;
- one role given two treatments - the focal question blue on one slide and black on the next;
- a question-card slot used for explanation or success criteria;
- a visual question answered by a detached text list;
- a table's job done by a row of text cards with the headings fused into the values;
- an answer slide whose answer words sit black inside green frames;
- a statement-plus-question block coloured as one thing, or run together with no break at the telling-to-asking boundary;
- a claim with no map, photo, diagram, table or source to judge it against;
- a photograph that no question, caption or label on the slide ever mentions;
- two consecutive slides that render near-identically, so a teacher would click past the second;
- the same reference panel dominating three consecutive slides while the thing that changed between them sits small;
- one small task repeated across a run of slides whose furniture is identical and mostly empty;
- a My Turn visual that changes family on Our Turn or Your Turn;
- a blank helper labelled with stage directions;
- a sequence drawn where the relationship is actually comparison;
- a row of five or six visuals shrunk into thumbnails when a grid or split is needed;
- success criteria floating without a labelled treatment;
- optional pictures filling empty corners while required content is cramped;
- a source-authored question silently reworded to make layout easier;
- a sparse slide decorated merely because it looked empty.

A mechanically valid deck can still fail every item above. The scratch build catches structural and capacity faults; this read catches visual foolishness.

---

## 15. Final read-back

For every slide, ask:

1. What is the one teaching job?
2. What should a child see first?
3. Can the child tell what to do without hearing an extra instruction?
4. Is the material they work from large enough to use?
5. Does every attached reference remain visible and readable?
6. Have I repeated, invented or silently rewritten anything?
7. What changed since the last slide, and is that the first thing the eye lands on?
7. Does the visual relationship match the learning relationship?
8. Would the answer slide let a child check the work they were actually asked to produce?
9. Could optional content disappear and make the slide better?
10. Would a teacher delivering from the board understand the moment without treating speaker notes as a hidden second lesson?

Fix presentation faults you own. Return content, helper, picture or technical faults to their real owner.
