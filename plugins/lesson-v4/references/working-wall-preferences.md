# Working Wall — Preferences

This file is read by `working-wall-designer` at the start of every run, alongside its partner file. The two files do different jobs:

- **`working-wall-preferences.md`** (this file) — *content* style. The words on a card: titles, length, punctuation, child-language, item structure, when to combine items.
- **`working-wall-visual-language.md`** — *visual* style. What the wall is supposed to look like from across the room, and how your card-level choices (which type, whether to attach a `visual`, what orientation) serve that look. Read it for the visual-first bias on diagrammatic LOs.

Visual rendering (fonts, colours, panel borders) lives in `working-wall-html/style.json` and isn't your concern.

---

## The load-bearing principle: cards must teach themselves

Every card has to make sense to a child who **was not in the lesson**. A working wall is not a souvenir of teaching that happened — it is a self-service reference shelf for children who need help mid-task. If a child cannot use the card without a teacher standing next to them explaining it, the card has failed.

Apply this test to every card before writing it:

> Imagine three children glance at this card and have to act on it:
> - one who missed the lesson entirely (the child who was off school)
> - one who can read but not fluently (a low-attaining reader)
> - one with SEND who relies on visual structure
>
> Can each of them get something useful from the card alone — without the teacher, without the slide deck, without the worksheet?

If the answer is no, the card needs more context, an example, a picture, or it doesn't earn a place. A card with a picture and one clear example beats a card with four crammed bullet-points every time.

The picture is not optional. Because children read the wall picture-first from across the room, a visual a child recognises by sight - a diagram, a photo, or a genuine P2 context picture - is the entry ticket for every card; a card that is only words is slide content, not wall furniture. The one exception is a step-by-step success-criteria card, whose numbered method is its own support. The full rule, and what counts as a visual on a text-driven lesson, lives in `working-wall-visual-language.md` under "Every card carries a visual".

Only P1 teaching visuals and genuine P2 context cues count toward this entry
ticket. A Working Wall P2 may be either a resolved Educational SVG picture or a complete
emoji picture; it is a card-level visual, not permission to alter protected
lesson wording. P3 `decorations` never count. A card that is words plus P3
remains a words-only card and must be skipped unless it is the existing
success-criteria exception.

---

## Match the lesson's visual supports

If the lesson uses a reference table, a sentence frame, an anchor diagram, or any other visual support that helps children during the work, the wall reproduces that support **in the same form** the children already recognise from slides and worksheets.

Why: children navigate by shape recognition before they read the words. The reference table they used during My Turn, on the worksheet, and now on the wall should look like *the same thing*. If the wall presents the same information in a different layout — a list when the lesson used a grid, paragraphs when the lesson used a table — the child has to do extra translation work just to see it is the same support.

Practical implications:
- A reference table on the slides and worksheets becomes a `referenceTable` card on the wall — same columns, same header style, same example column.
- A sentence frame on the slides becomes a `sentenceStem` card with the same blanks, same wording.
- A worked example modelled on the slides becomes a `workedExample` card with the same finished sentence/equation visible — not just the steps.
- A misconception named on the slides becomes a `misconception` card with the same wrong/right pair.

The wall is not a redesign of the lesson's supports. It is the same supports made big enough to glance at from a desk.

**When the lesson's anchor is a drawn shape, the wall card's anchor should be the same drawn shape.** Where the lesson uses a clock face, a fraction circle, an angle, a fraction bar, or a number line as the central support children look at, attach a `visual` to the card rather than describing the shape in prose. The picture does the lifting; the text becomes a short caption. A clock-rules card without a clock, or a fraction-rules card without a fraction shape, fails the children-glance-from-a-desk test even when the words are perfect.

The full set of rules for when to attach a `visual`, which primitives the renderer can draw today, and how to handle lessons whose anchor isn't yet supported lives in `working-wall-visual-language.md`.

---

## Card titles — fixed wording

These are the canonical titles for each card type. Use exactly these unless a different short title makes more sense for the specific lesson.

| Card type | Default title | Allowed alternatives |
|---|---|---|
| Worked example | **"How to do it"** | A short verb phrase: "How to add fractions", "How to plan a paragraph". Keep it ≤ 5 words. |
| Sticky knowledge | **"Remember"** | Rare. The default works almost always. |
| Sentence stem | **"How to explain it"** | "How to talk about it" if "explain" doesn't fit the lesson. Keep it ≤ 5 words. |
| Misconception | **"Look out for"** | "Watch out" if shorter is needed. ≤ 4 words. |
| Reference table | **"Conjunctions"** / **"Operations"** / **"Suffixes"** — the noun children are looking up | Use the short noun name. ≤ 4 words. Avoid "Reference" — it's adult-speak. |

**Hard rule: titles are 5 words or fewer, 30 characters or fewer.** Long titles eat the space the body of the card needs and force the rendering to shrink. Why: the title bar is a glance-target, not a sentence. If you are tempted to write "How to write a complex sentence", the lesson title belongs on the lesson — the wall card title is "How to write one" with the body carrying the procedure.

---

## Wording style — short, concrete, self-contained

Three rules in priority order:

**1. Self-contained.** Every item on a card is a complete idea on its own. Bare label-text pairs are banned unless the relationship is obvious from the title alone.

| Bad | Good | Why |
|---|---|---|
| `when → tells you the time` | `when tells you when something happens — *when she opened the door…*` | The bad version assumes the child knows the column header. The good version puts the meaning and an example into one self-explaining line. |
| `Step 1: Check.` | `Step 1: Read the main clause and check it makes sense on its own.` | The bad version is a verb without an object. |
| `Don't: 3/10` | `Don't: 2/5 + 1/5 = 3/10  (the bottom number changed — wrong)` | The bad version doesn't show what's wrong with what. |

**2. Concrete.** Use the language children use. Name the technical term where the lesson teaches it, but anchor it in plain words.

- "the bottom number (denominator)" not "the denominator"
- "joining word (conjunction)" not "conjunction" alone — until they know the word
- "tells you when" not "indicates temporality"
- "the part that makes sense on its own" not "the independent clause"

**3. Keep each item concise.** One sentence is preferred when it preserves the meaning. A vocabulary definition may use more than one short sentence when forcing it into one would damage accuracy; it must still remain readable at a glance. Split or simplify an item that becomes paragraph-like. Worked examples are the exception: they may pair a step with a one-clause example.

**4. Two-line maximum on every item.** Nothing — title, step, worked example, sentence stem, reference cell — wraps beyond two lines. Why: from across a classroom a child glances at the card and parses it in one read. Three lines turns the item into a paragraph and the wall stops being a wall and becomes a poster.

Practical implications when writing items:

| Card type | Length budget per item (rough guide) |
|---|---|
| Worked-example step | ≤ 60 characters — "Read the conjunction — what job does it do?" fits; longer steps need splitting. |
| Worked-example modelled answer | ≤ 70 characters — full sentences with one main clause, one subordinate clause, and a strong noun. Drop adjectives the lesson used for flavour. |
| Sticky-knowledge item | ≤ 62 characters on a card carrying a picture, which is nearly all of them. The 100-character figure this guide once gave is the no-picture width, and an ordinary card cannot reach it: the visual gate means a card without a picture does not go on the wall. |
| Sentence-stem item | ≤ 80 characters including the blank. |
| Misconception "Don't" / "Do" | ≤ 50 characters each side. |
| Reference table cell | ≤ 30 characters — and check the longest single word fits (no narrow-column hyphens). |

The builder's autofit may shrink the body, but the readable floor is a hard release gate. If autofit reaches the floor and a warning fires, the build has failed: shorten faithful display text, simplify the layout, or remove the card, then rebuild and verify before delivery. Never ship an overflow warning for correction on a later run.

**5. Prose a child reads may be condensed for the wall; a contract a child checks against may not.** What has to stay word for word is what a child compares board against wall: success criteria steps, reference-table columns, a misconception's "Don't"/"Do" pair. Free-standing prose nobody is matching word for word — a modelled sentence, a sticky-knowledge fact, a vocabulary definition — may be tightened to fit the card, keeping the meaning and every protection it carries. A safety line is prose, not a contract: "Tell a trusted adult if you're worried about yourself or someone else." (70 characters, over budget) says the same thing as "Tell a trusted adult if you're worried about anyone." (51, fits), and the shorter one is on the wall where a child can use it. Condense first, before dropping anything.

The clearest case is a worked example. The lesson-designer's modelled sentence might be long and atmospheric for the lesson itself ("Mia stepped through the glowing portal because she could hear her brother calling from the other side."). On the wall, a tighter version with the same characters and the same conjunction is fine ("Mia stepped through the portal because she heard her brother calling."). Same Mia, same portal, same *because*, half the length. The wall is not a transcript of the lesson — it is a glanceable reminder of what the lesson taught.

---

## Step labels in worked examples

- **Maths**: number the steps ("Step 1", "Step 2"). Always.
- **English**: label semantically ("What", "Why", "How") rather than numbering, where the procedure has named phases.
- Always end a worked example card with one labelled `"Worked example"` item that shows the model applied to a concrete case. The worked example is what children mimic — without it, the steps are abstract.

---

## Sentence stem formatting

- A blank in a stem is shown as three underscores: `___`, which print as a continuous underline.
- Stems are complete sentences with the blank in place: `"I added the numerators because ___"` — not bare phrases like `"added because…"`.

**Paired stems — gappy + modelled.** When the lesson-design models the stem with a worked completion (the My Turn slide shows the teacher saying the whole sentence, the worked example fills the blank in front of children, the success criteria carry the modelled version), populate the optional `filled` field on the same stem item. The card then prints the gappy version on top and the fully-modelled version directly beneath in the panel accent colour, so the contrast is doing the teaching. A child who is still building confidence can use the model as a reference; the blank remains available alongside it for independent use. The pair lives on one card so the model and blank are available together; the teacher decides how children use that reference.

When the lesson-design doesn't model the stem — children are inventing their own completions, or the stem is a discussion prompt with no canonical answer — leave `filled` out. A modelled completion children are meant to invent is a worked example pretending to be a stem.

Twinkl prints these as two cards a teacher swaps on the wall (gappy first, modelled later). Producing them as one card with both lines means the teacher doesn't need to track two PDFs — the same card teaches the supported and independent phases.

Schema: `{ "text": "I added the numerators because ___.", "filled": "I added the numerators because the denominator was already the same." }`.

---

## Misconception cards

- Always include a "Don't" item and a matching "Do" item. A card without the corrective is a complaint, not a teaching tool.
- Wrong example shown first, correct example shown second. Children read top-to-bottom; the corrective lives where their eye lands last.
- "Don't" item: just the wrong answer, no commentary. "Do" item: the right answer plus a one-clause explanation of why it is right.

---

## Reference table cards

When the lesson uses a reference table to support children, the wall reproduces it as a `referenceTable` card. Rules:

- **Same columns as the lesson.** If the slides/worksheets show three columns (e.g. *Conjunction / What it tells you / Example*), the wall card has those three columns. Don't drop the example column — the example is what makes the table teach itself.
- **Header row is bold and contrasting.** The builder handles styling; the designer just provides headers and rows.
- **Row count: keep it manageable.** A wall card with more than 6 rows starts to crowd; if the lesson's table is longer, split into two cards or pick the highest-leverage rows and note the cut in `rationaleNote`.
- **Title is the noun children look up**, not the word "reference". "Conjunctions", "Suffixes", "Operations" — never "Reference table" or "Lookup".

---

## When to skip a card

Trust your judgement on the wall-worthy test. If a lesson's misconception is too vague, generic, or unlikely to recur, skip the card. A clean wall is better than a wall full of filler. The orchestrator's `rationaleNote` is where you explain skipping.

A card with no visual a child recognises by sight is one of these skips - unless it's a step-by-step success-criteria card. Words-only content belongs on the slides, where children read it close up, not on the wall, where it can't be read from a desk (see `working-wall-visual-language.md`, "Every card carries a visual").

---

## Vocab chip cards — wording and selection

Chips are the lightweight half of the vocabulary identity. A `vocabChips` card carries 4–12 short word chips in a grid on a single A3 landscape page - the Twinkl "Vocabulary Cards" pattern. Each chip is the word in bold teal in a teal-outlined box, optionally paired with a small image cue (a coin alongside "ten pence", a note alongside "pound"). The card sits under the same `Vocabulary` zoner as `vocabDefinition` and reads as part of the same family - but where definition cards carry teaching weight, chip cards carry breadth.

**When chips, when definition cards.** The two card types are designed to coexist; the question is which work the lesson is doing.

- Reach for `vocabChips` when the lesson introduces a *set* of related words children will use across the unit — money words (`amount`, `cost`, `change`, `spend`, `ten pence`, `pound`), body parts, weather words, the names of the apparatus on a science table. The words are concrete enough children already half-know them, or the meaning is obvious in context. A definition card per word would be overkill; a single chip card under the `Vocabulary` zoner lets children scan the whole set in one glance.
- Reach for `vocabDefinition` when the lesson teaches a specific tier-3 word as a concept — `denominator`, `isosceles`, `metaphor`, `evaporation`. One word, big, with a child-language definition and a drawn primitive. The word is central to the lesson and earns its own card.

Both can live on the same wall under the same `Vocabulary` heading: one or two definition cards for the lesson's central terms, plus a chip card carrying the broader vocabulary the children will use around them. The two together read as a layered vocab zone — the depth and the breadth.

**Chip count.** Aim for 6–8 chips when the lesson genuinely teaches that many vocabulary words; 4 is the floor (below that the card feels empty and the teacher would be better hand-writing a single sticky note) and 12 is the ceiling: the builder refuses a card carrying more, because the grid would run off the bottom of the page and the extra chips would be cut off. When the unit's full vocabulary list runs longer than 12 words, split into two chip cards (`Money words` + `Money actions`, for example) rather than cramming.

**Chip wording.** Single words or short noun-phrases - `pound`, `ten pence`, `change` - not full sentences. Keep each chip to roughly 12 characters or 2 words. The renderer will not shrink the type until a word runs past about twenty characters, so a long chip does not get flagged, it just crowds its box. When the lesson genuinely needs a longer phrase (`make a prediction`), the chip card is the wrong fit - that's `sentenceStem` or `stickyKnowledge` territory.

**Title.** A short noun naming the *set* of words on the card — `Money words`, `Body parts`, `Weather`, `Science kit`. Keep it ≤ 5 words. The title is what children read first; it tells them what kind of words the chips are.

**Image pairing.** A chip's optional `photo` lets you anchor the word visually for the children who can't yet read it fluently. Pair an image with a chip when the image makes the meaning obvious at a glance — a coin alongside `ten pence`, a thermometer alongside `temperature`, a beaker alongside `beaker`. Skip the image when the word is abstract (`amount`, `change`, `spend`) and a stock image would feel forced; an unpaired chip is fine. Don't pair every chip — a mixed grid (some with pictures, some plain) reads as a real vocabulary card; a wall of stock photos reads as clip-art.

**Wall-worthy criteria, applied honestly.** A `vocabChips` card earns a place when the lesson introduces 4+ concrete vocabulary words children will use across the unit *and* those words don't each warrant their own `vocabDefinition` card. If the lesson uses two new words in passing, the card is too thin to print — skip it and let the words live on the slides. If the lesson uses fifteen words and they're all central concepts, you're probably running two definition cards plus a chip card for the supporting vocab.

A chip card counts as **one teaching sheet** against the one-sheet default and two-sheet hard cap, regardless of how many chips sit on it. Do not add it on top of an overview unless it performs the exceptional second sheet's distinct, durable job.

---

## Banner cards — wording and selection

A banner is the chunky display-title strip that runs across the very top of the working wall. Twinkl ship them as multi-page printables — `English Working Wall` stretched across three A4 landscape pages, each page carrying one massive word, the teacher pinning them end-to-end so the room reads the title in giant rainbow letters. A banner is wall furniture, not a teaching card; it labels *the whole wall* (what unit or subject it's for) where section headings label *zones inside it*.

**When a banner earns a place.** Only an explicit teacher or spawn-prompt request for a fresh wall can trigger a banner. Being lesson 1 or opening a unit is not enough. Outside an explicit request, omit it.

**Subject banner vs unit banner — pick one, never both.** A classroom usually carries one banner at any time; it changes when the unit changes. Two banners on the same wall fight each other for the same role, and the children stop trusting either.

- Reach for a **subject banner** when the wall is the room's permanent subject space — `English Working Wall`, `Maths Working Wall`, `Science Working Wall`. The banner stays up across many units within that subject; the unit-level content underneath changes.
- Reach for a **unit banner** when the wall is repurposed unit by unit and the unit name is what children navigate to — `Fractions`, `Forces`, `WW2`, `Year 4 Writing`. The unit ends, the banner comes down, the next unit's banner goes up.

If the lesson-design genuinely supports both forms (a Year 4 fractions lesson that opens a fresh maths wall), pick the form the classroom is actually running. Default to the subject banner — it survives more unit changes — and note in `rationaleNote` that the unit name lives on a section heading or sticky-knowledge card instead.

**Wording rules.**

- **1–6 words per banner.** Most banners are 2–3 words (`English Working Wall`, `Maths Working Wall`); a single-word unit banner (`Fractions`, `Forces`) is fine; six words is the ceiling so each word still prints huge across its own page.
- **Each word ≤ 15 characters.** The renderer sizes each word to fill an A3 landscape page; long words shrink the whole strip and the banner stops reading from across the room. If the natural title has a long word (`Multiplication`, at fourteen letters, already shrinks to about 128pt), pick a shorter equivalent (`Times Tables`) or split into two pages (`Multi` / `plication` is not the answer - `Times Tables` is).
- **Title-case every word.** `English Working Wall`, not `english working wall` or `ENGLISH WORKING WALL`. Title case matches the kid-facing titles on the cards beneath it and reads warmer than all-caps.
- **Conversational, not corporate.** `English Working Wall` over `KS2 English Curriculum Display`. `Fractions` over `Fractions Unit — Spring Term 2`. A banner is signage children walk past, not a label for the headteacher.

**Why so strict on length.** The renderer gives each word a whole A3 landscape page to itself and sizes the type to fill the width. A short word (up to about seven letters) prints somewhere between 260 and 320pt; every letter after that shrinks it, and a fifteen-letter word drops to about 120pt, below the size where the banner is doing its job (reading from the back of the room), and the rainbow strip turns into a row of tidy labels.

**Colours.** The agent doesn't supply colours — the renderer cycles each page through the rainbow palette automatically so adjacent pages differ (pink `English`, green `Working`, blue `Wall`). Picking the colours by hand is the renderer's job, exactly like the colour-cycling on mnemonic letters.

**One banner per explicitly requested setup, full stop.** It is separate from the teaching-sheet cap but its physical page count must be reported; “furniture” still consumes paper and wall space.

---

## Section heading cards — wording and selection

Section headings are optional wall zoners. See `working-wall-visual-language.md` for their appearance. They are outside the teaching-sheet cap only when the teacher explicitly requests a wall-setup pack, and their physical page count must still be reported.

**When to produce them.** Section headings only earn a place when the teacher or spawn prompt explicitly requests wall setup. Lesson-design wording alone is not a request.

- An explicit teacher note (`Set up the working wall`, `Build the wall headings`, anything similar in Design Notes for Slide Maker).
- A signal in the spawn prompt itself when the teacher has asked for a fresh wall.

Without an explicit teacher or spawn-prompt request, omit section headings. The default is no zoner cards, including on the first lesson of a unit.

**Canonical headings.** Pick from this list — children read these the same way across the school, so coining new wording (`Words to Watch`, `Maths Whoops`) breaks the recognition the canonical names give them.

Any subject:
- **Learning Focus** — the LO zone.
- **Vocabulary** — where vocab cards live.
- **Prior Learning** — facts from earlier lessons children may need to revisit.
- **Sentence Stems** — where stem cards live.
- **Modelled Strategies** — where worked examples live.
- **Top Tips** — where sticky-knowledge cards live (`Remember` works as an alternative when the zone leans toward facts rather than tips).
- **Key Questions** — prompts the teacher returns to repeatedly.
- **Next Steps** — mid-unit reminders or stretches.
- **Look out for** — where misconception cards live. Use this phrasing rather than the adult word `Misconceptions`; a zone labelled `Misconceptions` reads to a child as *this is where my mistakes go* rather than *what to watch for*.

Maths-only:
- **Concrete** / **Pictorial** / **Abstract** — the CPA zones. Produce only when the unit teaches the procedure across all three stages.
- **Fluency** / **Reasoning** / **Problem-Solving** — the White Rose attainment zones. Produce only when the unit explicitly tracks across all three.

**Wording rules.**

- Heading text is **three words or fewer, twenty characters or fewer**. The bigger they print, the easier the wall reads from a desk — `Vocabulary` outperforms `Important Vocabulary` because the second word makes the type smaller and the zone weaker.
- Title-case the heading (`Sentence Stems`, not `sentence stems` or `SENTENCE STEMS`). Title case matches the kid-facing card titles elsewhere on the wall.
- Match the heading to a zone the wall genuinely has. If the lesson-designer produced no misconception card and the unit has no other misconceptions queued, omit the `Look out for` zoner — a label without content underneath teaches nothing and reads as an empty promise.

**Selection rules.**

- Use the minimum explicitly useful set, normally 2–4 headings. More than four requires the teacher to have named the zones.
- Cycle colours across adjacent headings. The agent reaches into the rainbow palette and assigns a different hue to each — repeating a hue across adjacent zones collapses the colour grammar children navigate by. The renderer takes the colour from the card's `colour` field; supply it explicitly per heading.
- Reach for `Concrete / Pictorial / Abstract` only when the lesson-design names CPA as the structure. On a one-stage procedural lesson, drop them in favour of a single `Modelled Strategies` heading.

---

## How much text one body item holds

At A3 landscape, an item that will not fit two lines at the 36pt floor fails the
build rather than shrinking further. Counting the item's label plus two
characters for the separator, the budget is about **62 characters** on a card
carrying a photograph or picture, and about **106 characters** on a card with no
picture. Titles, chips, table cells and mnemonic letters are fitted separately
and are not measured against this.

---

## When to combine items on one card

Default is one item per card. Combine only when:

1. Items form a natural pair (e.g. a sentence stem and its mirror; "Don't" and "Do" on a misconception card).
2. Combined layout still passes the seat-readability test. The builder shrinks body text as far as 36pt before it fails the build, so a combination the autofit pushes below roughly 60pt is already too crowded: keep the items separate.
3. Combining genuinely helps learning — children scan the pair and learn the relationship in one glance.

A card with three crammed items that are only loosely related is worse than two clear cards. The one-sheet default and two-sheet hard cap still apply — combine only when the parts form one coherent representation.
