# How a long success-criteria list fits on a slide (investigation, 23 September 2026)

Investigation only. Nothing in the plugin was changed. Every measurement below
was taken with the plugin's own builder, or with scratch copies of three of its
files where an option needed a change, and the key cases were then built as
real decks and rendered to pictures.

---

## For Daniel: the short version

**Your question: doesn't it just shrink the words?**
- Yes. It shrinks them, down to 18pt.
- At 18pt it stops, because 18pt is your floor.
- So the limit is the size of the box, not the size of the words.

**The box on the maths practice slides is smaller than you might think.**
- It is less than a third of the slide, not half.
- Its width is fixed, and the slide designer cannot change it.
- It holds about fourteen lines of writing at 18pt.
- Each line holds about 26 letters and spaces.
- Your step "Put < or > between the numbers, with the open side facing the greater number." takes four of those fourteen lines on its own.

**When lists stop fitting today.**
- Short lists fit. All four of your approved rewrites fit.
- Of 114 real lists from saved lessons, only 4 are refused in that box.
- All 4 of those are the builder measuring wrongly, not a lack of room. There is room for every one of them.
- Lists written the way you now like them (six to eight clear steps) do not fit at all. I wrote six of these to test with, and none fitted.

**What happens to a list that does not fit.**
- The deck is still made.
- But that whole practice slide is replaced by a page saying "Check this slide before teaching": no question, no working space, no steps.

**What I recommend.**
- First, fix the three measuring mistakes. Small job, nothing on screen changes for any list that fits today.
- Then let the box widen itself when a list needs it, never past half the slide.
- It stays today's size for short lists (all 114 saved lists would stay as they are).
- It widens a little for a long list: to about a third of the slide for most, to about two fifths for the longest.
- In the test, that held every long list at 18pt or bigger.

**What it would cost.**
- On those slides, the question and working side gets narrower: from 8 inches wide to about 7, or about 6 for the longest lists.
- A number line with the working space beside it no longer fits side by side. So on those slides the picture goes above the working space instead of beside it.
- The picture itself gets a little smaller on those slides.

**Two things for you to decide.**
- Should the box widen only as far as it needs to keep 18pt, or further, to reach the 20pt the plugin aims for? The first changes no saved lesson. The second would widen 24 of the 114.
- A list too long even for a box just under half the slide (more than about fourteen lines at its widest) cannot keep both your limits. None of your real lists comes close. Should that list go back to the lesson designer, or may that one slide go past half?

---

## 1. How the panel is laid out and measured today

**One panel, two routes.** Every criteria panel is drawn by one function (`builder/src/success-criteria-panel.js`), whether it comes from a practice template or from an `sc-panel` in a free layout. The panel draws a pale green box, a 28pt "✓ Success Criteria" heading 0.55in tall, and the steps as compact white cards.

**The practice templates have one fixed panel.** The four live `*-sc` templates (`maths-turn-sc`, `maths-turn-ref-sc`, `maths-your-turn-sc`, `writing-turn-ref-sc`) all call the same panel at x 8.51, y 0.75, 4.60 x 6.50in. That is 29.9% of the slide. The designer cannot resize it. It already uses the full height of the body (6.50 of 6.65in), so on these templates the only lever left is width.

**Inside the panel** (`content/steps.js`, card constants in `styles.js`): panel padding 0.15, heading 0.55, steps padding 0.15 top and bottom and 0.05/0.15 at the sides, number badge 0.55, badge gap 0.10, card padding 0.05, gap between cards 0.07. Each step's words get a 3.35in wide line and the list gets 5.35in of height.

**How a list is sized.**
- Each step is set at the largest size from 36pt down to 18pt at which its wrapped lines fit its card. The numbered steps share one size.
- When equal cards do not work, a step that wraps more takes a taller card, if the panel has the room.
- Below 18pt the builder refuses the slide (`STEP_TEXT_OVERLOAD`) and draws nothing smaller.
- A list of fewer than four steps uses only its share of four rows (the 17 September rule against poster-sized short lists).
- A sticky-knowledge line (✨) has its own sizing path.
- The final text-fit pass measures the real font afterwards and holds the same 18pt floor. In every build I ran it agreed with the step fitter: nothing the fitter accepted was refused later.

**The half-slide limit.** The panel refuses a zone over 50% of the slide's area (`SC_PANEL_TOO_LARGE`) except on a criteria-only slide.

**In free layouts** the `sc-panel` takes whatever zone it is given: the side of a split, a sidebar, a share of a stack, a strip at the bottom. Saved decks put it in 15 different places (counted from 341 placed panels in 96 saved slide specs).

**The Teach layouts** carry no criteria panel; their steps are teaching, not criteria. They are not a route for criteria.

**What the capacity checks do.** Six or more steps, or 320 or more characters, raises a warning (`SUCCESS_CRITERIA_CAPACITY`) that says it is "a cue to look, not a limit". But it is on the list of signals that name a slide "to check before teaching" in a delivered deck, so every slide with six steps gets that flag even when its panel fits well (seen in my test build: 11 slides flagged, only 4 of them with a real fault).

**What happens after a refusal.** The slide designer is told to use "a roomier composition, up to half the slide". If its repair passes run out, the deck is delivered with the whole slide replaced by a "Check this slide before teaching" page. Rendered in the test deck: title, red line, nothing else.

**What the guidance tells the designer.** `slide-success-criteria.md` says to try the `*-sc` panel first, then "a roomier free composition with `sc-panel`", "the full height of one side". The playbook §9 says "a roomier slot, a different template or a coherent split". None of it gives the capacity of any shape or names which shapes are roomier.

---

## 2. Where real lists stop fitting

### The rule of thumb every measurement comes back to

A full-height panel holds about **14 lines of writing at 18pt, whatever its width** (15 for a list of four or five steps). Each card costs about 0.10in beyond its lines, and each line 0.32in. The width decides how many characters a line holds.

| Shape | Share of slide | Width for the words | Characters a line at 18pt | Lines at 18pt, 6 steps |
|---|---|---|---|---|
| Practice template panel (`*-sc`) | 30% | 3.35in | about 26 | 14 |
| Narrow side column (`split-h-70-30`, `body-sidebar`) | 25% | 2.56in | about 19 | 15 |
| Thirds, right column (`thirds-h`) | 28% | 2.91in | about 22 | 15 |
| 40% side (`split-h-60-40`) | 34% | 3.83in | about 29 | 15 |
| Half side (`split-h-50-50`) | 42% | 5.10in | about 39 | 15 |
| Bottom half band (`split-v-50-50`) | 42% | 11.6in | about 91 | 4 |
| Bottom 40% band (`split-v-60-40`) | 33% | 11.6in | about 91 | 2 |
| Bottom strips (`quad-v`, `centre-big-v`) | 21 to 25% | 11.6in | about 91 | 0 |

A list fits when its wrapped lines, added up, come to about 14 or fewer. A step wraps to more lines than its length alone suggests, because words do not split: your 77-character step takes 4 lines in today's practice panel, not 3.

### Breaking points per shape (today's builder)

The longest step, in characters, that fits when every step in the list is that long. Five different texts built from real criteria words were tried at each length; a length counts only when all five fit.

| Shape | 2 to 4 steps | 5 steps | 6 steps | 7 steps | 8 steps |
|---|---|---|---|---|---|
| Practice template panel | 70 | 65 | 45 | 45 | 20 |
| Narrow side column / sidebar | 55 to 60 | 45 | 35 | 35 | 15 |
| Thirds, right column | 60 | 55 | 40 | 40 | 15 |
| 40% side | 85 | 80 | 55 | 50 | 25 |
| Half side | 110 to 115 | 100 | 75 | 70 | 35 |
| Bottom half band | 85 to 90 | none | none | none | none |
| Bottom 40% band, bottom strips | none | none | none | none | none |

The drop at eight steps is the line budget: eight two-line steps need about 5.9in and a full-height panel has 5.35 to 5.50in, so at eight steps most must be one line.

### Every real list, in every shape

114 distinct step lists: every list in 90 saved `lesson-design.json` files, every list placed on a slide in 96 saved `lesson.json` files, and his four approved rewrites from the voice guide §10. Longest saved list: 296 characters (4 steps); most steps: 6.

| Shape | Refused | Drawn at 18pt | Drawn under 20pt |
|---|---|---|---|
| Practice template panel | 4 | 14 | 22 |
| Narrow side column / sidebar | 12 | 38 | 50 |
| Thirds, right column | 7 | 25 | 37 |
| 40% side | 0 | 11 | 16 |
| Half side | 0 | 1 | 4 |
| Bottom half band | 34 | 1 | 1 |
| Bottom 40% band, bottom strips | 114 | 0 | 0 |

All four of his approved rewrites draw in the practice panel today (the two-step compare pair at 18pt).

### The four refused in the practice panel are measuring faults

Each has room; each is refused by a fault in the step fitter.

1. **Rounding at the exact floor.** When a long step takes a taller card, the fitter hands the card exactly the height its lines need, then refuses it by a rounding error of about a millionth of an inch (a one- or two-line card: 0.3199999 against 0.32). Seen on the saved "find 1,000 more or less" list (6 steps) and the 8-step stress list in the half side. The refusal message then reports "1 line of about 25 characters" for a 26-character step, which reads as a wording fault when it is not.
2. **The sticky line is checked at the wrong size.** With a ✨ line in the list, a pre-check measures every step at the 20pt target and as tall as the tallest one, not at the 18pt floor. Saved "round to 10 and 100" (fits at 19pt without the pre-check) and "partition 4-digit numbers" (fits at 22pt without its sticky line, 19pt with it) are refused.
3. **The short-list rule does not give way.** A list of one to three steps gets only its share of four rows, even when a long step needs more and three quarters of the panel is empty. The saved RE list (one 76-character step) is refused this way.

With those three fixed in a scratch copy, **all 114 real lists fit the practice panel at 18pt or more**. No list got smaller: 832 shape-and-list results kept their size, 7 went up by 1pt, and 75 that were refused now draw. The five affected slides were then built through the whole real build and passed the final real-font check.

### Saved slides as their decks placed them

307 saved slides carry a criteria panel (test lessons left out). Redrawn with today's builder:

- 262 draw (193 at 20pt or more, 69 at 18 or 19pt).
- 16 are refused on step fit. The three fixes clear 10 of them (partition 4-digit numbers slides 5 and 6; three history and maths trial slides in `speech-bubbles-1`; round to 10 and 100 slides 4, 5, 6, 8; Year 4 maths lesson 2 slide 8).
- The other 6 are all a panel squeezed into part of a column: in a stack beside other items (Year 4 maths lesson 2 slides 4 to 7, 5.08 x 3.52in; continuity and change slide 14) or in a 30% column shared with other content (balanced diet slide 7). A roomier shape fixes these; no fix to the fitter can.
- 5 are over half the slide (a panel across a full-width body; a table panel in the 60% side of the PSHE rules deck, four slides). These decks predate the half-slide rule.
- 4 are a criteria table in a 40% side, refused by the zone-class rule (continuity and change version 6).
- 20 could not be checked because other content on the slide failed first (place-value charts, maps and similar).

### Lists written in his current style

The saved lists are mostly the older short style. His clearer steps are longer, and he remembers six or seven steps in one lesson. I wrote six plausible Year 4 lists in his style to test with (these are my wording, not his): compare 4-digit numbers (6 steps, 323 characters, including his own 77-character step), column addition with exchange (7, 334), read a number line (6, 300), draw a series circuit (7, 347), setting description (7, 372), short multiplication (8, 405).

Lines each needs at each width, against the budget of about 14:

| List | Today's panel | 5.50in panel | 6.35in panel | 7.00in panel |
|---|---|---|---|---|
| Compare, 6 steps | 16 | 13 | 12 | 10 |
| Column addition, 7 | 18 | 13 | 13 | 13 |
| Number line, 6 | 16 | 12 | 10 | 10 |
| Series circuit, 7 | 18 | 14 | 13 | 12 |
| Setting description, 7 | 20 | 15 | 13 | 12 |
| Short multiplication, 8 | 19 | 17 | 14 | 13 |

None of the six fits today's practice panel, with or without the three fixes. Built through the real builder, today's panel refused each, and the delivered slide was the "check this slide" page.

---

## 3. What could make a long list fit

Each option measured with the builder's own arithmetic; the ones marked "built" were also built as whole decks, passed the final real-font check, and were looked at as rendered pictures.

| Option | Holds the six long lists at 18pt or more? | Builder change | Cost |
|---|---|---|---|
| A. Fix the three measuring faults | No (0 of 6); but all 114 saved lists | Small, in the step fitter | None seen: no list gets smaller |
| B. Tighter spacing inside today's panel | 4 of 6 (not the setting description or multiplication) | Small, constants | Denser panel; badges 0.45 not 0.55in; smaller gaps and heading; changes the compact look already approved |
| C. Panel widens itself on the practice templates (built) | 6 of 6: four at 5.50in (36%), two at 6.35in (42%) | Moderate: one shared width choice for four templates, and the left side rearranging | Question and working side 8.0 to 7.1 or 6.2in wide; a picture beside working space falls under its minimum, so it must stack above it |
| D. Half-width split with a free panel, today (built) | 5 of 6 today; 6 of 6 with option A | None | Designer composes the work side; no ruled working space or question sizing; criteria take 42% even when less would do |
| E. Full-width band under the work (built, two columns) | 6 of 6 at a 50% band with two columns and tighter spacing; 5 of 6 at a 50% band in one column with tighter spacing; 2 of 6 at the existing 42% band either way | Moderate: two-column panel mode | Work becomes a short wide strip (about 3.2in tall at 42%, 2.6in at 50%); step 4 sits at the top of the right column; the lowest part of the board is the part heads and the teacher block most |
| F. Two columns inside a side panel | Worse than one column below 7in wide | Moderate | Each column narrower than today's panel. Not worth building |
| G. Moving the question | No gain | n/a | The practice panel already has the full height; starting it 0.15in higher gains half a line |
| H. Splitting the task over two slides | No gain | n/a | The panel's size does not depend on how many questions share the slide |

**Option C in detail** (built as a scratch mock of `maths-turn-sc`, the builder choosing the narrowest of 4.60, 5.50, 6.35 and 7.00in that holds the list):

- Short lists kept today's panel: all 114 real lists fit 4.60in at 18pt or more once option A is in, so none would widen under an "18pt" trigger. Under a "20pt" trigger, 24 would widen (17 to 5.50, 5 to 6.35, 2 to 7.00), and one more reaches 20pt at no width. The mock deck used the 20pt trigger, which is why some of its saved lists widened.
- Width left for the question and working side: 7.99in today, 7.09 at 5.50, 6.24 at 6.35, 5.59 at 7.00.
- With working space beside the picture, the picture column is 3.90in today. The three number lines I tried were refused in a column of about 3.7in or less, and at 5.50 the column would be 3.46. So today's layout is already at the number line's limit, and any widening needs the picture above the working space (the arrangement `maths-turn-ref-sc` already uses). In the mock, which has no such rearranging, the two number-line slides that widened were refused; the other eight drew.
- The rendered compare slide shows the cost to the picture: under the 20pt trigger that list took the 7.00in box, the row holding its two place-value charts went from 7.99in to 5.59in wide, and the charts shrank with it. Under the 18pt trigger it would take 5.50in and leave 7.09in.
- How children find step 4 does not change: one column, numbered top to bottom.

**Option E in detail**: the existing bottom-half layout already fits four one-line steps; tighter spacing takes it to seven one-line steps at a 50% band; two columns take it to eight. It suits a wide picture (a number line, a comparison) and suits working space and column methods badly.

**Tables.** Every saved criteria table (9) draws in the practice panel and in the half side. The 40% side refuses them by zone class even though it is wider (5.08in) than the practice panel (4.60in) that accepts them.

---

## 4. What the slide designer should do meanwhile

With today's builder and no changes:

1. **Use the practice template panel first.** Rule of thumb: about 14 lines, about 26 characters a line.
2. **If it refuses, use the half-width split** (`split-h-50-50`) with the criteria in an `sc-panel` taking one whole side, and the question, picture and room to work on the other. About 14 lines at about 39 characters. Every saved list fits there today, and five of the six long lists.
3. **Never put a method's steps in**: the 30% columns (`split-h-70-30`, `body-sidebar`), a thirds column, the bottom bands and strips (`split-v-60-40`, `split-v-70-30`, `quad-v`, `centre-big-v`), or a panel that shares its column with other items in a stack. Every refusal that remains after option A is one of these.
4. **Recognise the three false refusals** until they are fixed: a short list (one to three steps) with one long step; any refusal naming the sticky-knowledge line; a refusal where a step is one or two characters over "1 line" or "2 lines". The move is the same as 2; they all fit the half side.
5. **A criteria table** goes in the practice panel or the half side, never the 40% side.
6. **If the half side still refuses** (only the eight-step list, and only through fault 1): today there is no layout within his limits. The deck is delivered with that slide as a "check this slide" page, and the run report should say it is room, not words.

---

## 5. Guidance and messages that point the wrong way

Found while measuring; each works against his decisions or sends the designer to a shape that cannot hold the list.

- The step fitter's 18 and 19pt warning says "Shorten a step without losing what it tells a stuck child to do, or split one step into two shorter ones; the panel's width is fixed by the template." It fires on every panel at 18 or 19pt (8 of 13 slides in one test deck), including free layouts where the width is not fixed, and it asks for the rewording his decisions forbid downstream.
- The final text-fit summary ends "Shorter words read better than smaller ones." and lists criteria boxes under it.
- `templates.md` says the `quad-v` bottom strip "is sized for about 5 step rows"; measured, it holds none (every real list refused; after option A, only a few one-step lists).
- `templates.md` says five steps need "about 2.0 to 2.5 inches of zone height"; inside a criteria panel, five one-line steps need about 3.25in.
- The half-slide refusal message says "the full height of one side", which is right, but the designer cannot resize the practice panel, and the message does not name the free shape that gives it (the half side).
- The capacity warning puts a six-step slide on the "check before teaching" list even when its panel fits.

---

## Recommendation (proposal only)

1. **Fix the three measuring faults in the step fitter.** A tolerance when a card is given exactly its lines' height; the sticky-line pre-check measured at 18pt, step by step; the short-list rule giving way when the list needs the height. Tests from real lists: find 1,000 more or less, round to 10 and 100, partition 4-digit numbers, the RE single step, plus a check that every list that fits today keeps its size.
2. **Let the practice panel widen itself.** One shared choice, used by all four `*-sc` templates: the narrowest of 4.60, 5.50 and 6.35in (optionally 7.00) that holds the whole list at 18pt or more; the half-slide check stays. The templates take their left-side widths from it, and `maths-turn-sc` puts the picture above the working space when side by side would drop the picture's column below its own minimum. The designer has nothing to choose. Tests: the six long lists draw; a short list keeps 4.60in; a number-line slide still draws when the panel widens.
3. **Correct the guidance and messages in section 5.** Give the slide-success-criteria reference the rule of thumb (about 14 lines; characters a line per shape) and the free-layout ladder from section 4; take the "shorten" advice out of the fitter's warning and the fit summary for criteria; correct the two stale `templates.md` lines; take the capacity cue off the "check before teaching" list, or keep it only as a note.
4. **Keep in reserve**: tighter spacing (option B) if he wants the box to widen less often; the two-column band (option E) if a wide-picture practice slide is wanted. **Do not build** two columns inside a side panel.

**What it would take.** Item 1 is a few lines in one file plus tests. Item 2 is moderate: one new shared function, four templates reading it, one template's left-side arrangement, and tests; the geometry was already proven in the scratch mock and through the whole real build. Item 3 is wording in two references and two messages. Nothing here needs the lesson designer or the reviewer to change.

**Open for Daniel** (from the top): the widening trigger (18pt, changing no saved lesson, or 20pt, widening 24 of 114), and what happens to a list of more than about 14 lines at the widest box.

---

## Method and evidence files

All in `plans/streamline-tools/scratch/fit/`:

- `collect.py`, `collect_slides.py`: the corpus (`criteria-corpus.json`, `slide-panels.json`).
- `harness.js`, `shapes.js`: draws a panel in every shape with the builder's own code and records zone, size and refusal.
- `grid.js` (`grid-result.json`), `grid2.js` (`g2-*.json`): breaking points per shape and per candidate width.
- `real.js` (`real-result.json` today, `real-alt-fixes.json` with the fixes), `saved-slides.js` (`saved-slides.json`, `saved-slides-fixes.json`), `tables.js`.
- `stress-lists.js`, `stress.js` (`stress-*.json`), `widths.js`, `capacity-table.js`, `nl.js`.
- `alt/`: scratch copies of the step fitter, the panel and `maths-turn-sc` with each option switchable, and `preload.js`, which puts them in place for one build process only.
- Built and rendered decks: `deck-today/` (long lists in today's shapes), `deck-widen/` (today versus the widening mock, `png-today/` and `png-widen/`), `deck-fixes/` (the three fixes), `deck-tight/`, `deck-band/`.

---

## Decisions taken (23 September 2026)

Put to Daniel as three decisions, with suggestions: go ahead with the three measuring fixes and a practice box that widens itself when a list needs it, never past half the slide; widen only as far as 18pt needs (changing no saved lesson), not to 20pt; and a list too long even for the widest box is caught by the lesson check before any slides are made, so the lesson designer tightens it and the half-slide limit stays unbroken. The three messages pointing the wrong way (the 18-19pt warning that tells the slide designer to shorten steps, the two template-guide lines that overstate the bottom strips, and a fitting six-step slide listed as "check before teaching") were put with them.

His answer: "agree on everything".

Plan: the three messages are fixed inside the success-criteria release (4.2.288), after its first check; the measuring fixes, the widening box and the lesson check's length catch are the next release, built and checked the same way once 4.2.288 is committed.
