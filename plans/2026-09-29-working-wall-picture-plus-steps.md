# Working wall: picture plus steps

Written 29 September 2026. A plan only: nothing in the plugin has been changed.

## The short version (for Daniel)

**What you asked for:** every working wall sheet has a picture, diagram or helper, never only words. The step numbers should sit properly in their green circles. A method sheet should be easy to follow from across the room.

**What you liked:** the two hand-made mock-ups (Thursday's "How to add three numbers", Friday's "Tens, then ones"). In both, the worked example is drawn big, each step's green circle is pinned to its part of the picture, each step sits beside its own sum, and one colour means one thing.

**What we'd build:**
1. The step circles fixed, so the number sits in the middle, in the wall's own font.
2. The method card redrawn so the picture leads: the worked example drawn big, the steps each paired with their own line of working, and step circles that can sit on the picture.
3. Number lines that can show the whole journey of the worked example (48, 68, 70, 73), not only the part one slide showed.
4. A new rule for the designer: no picture, no sheet. When space is tight, the words get smaller before the picture goes.
5. Four short ideas taught to the designer, with a maths and a non-maths example, so it does this for any lesson rather than copying these two.

**How we'd check it:** rebuild the walls for four lessons that are already saved (these two maths lessons, one history, one science) and look at them before anything goes live. No whole lesson needs rerunning.

**Decisions for you** are at the end.

## What was found (checked again on 29 Sept, after the other session's edits)

All four findings below were re-read against the working tree after Daniel's other session changed files the same day. None of those edits touched them: the only wall engine change was a size limit for very large drawings in `working-wall-html/src/svg-renderer.js` (`preRenderSvgs`), unrelated to this work.

**1. Step circles: the digit sits in the top half.** `badgeSvg` in `working-wall-html/src/svg-renderer.js` centres the digit with `dominant-baseline="central"`. The wall rasterises the badge through sharp, whose SVG library (librsvg 2.58) ignores that attribute, so the digit's baseline lands on the centre line and the whole digit sits above it. Reproduced on a lone badge with a centre line drawn through it. The digit is also `Arial Black` while the wall is Comic Sans throughout, and `stepBadgeRowHtml` (`render-panels.js`) aligns the badge to the top of the row, so a badge taller than the text's cap height sits high against its first line.

- Sibling risk, not verified: 13 shared drawings in `shared/visuals/` (bar chart, bar model, Carroll, Venn, coordinate grid, grid map, line graph, pictogram, rainforest layers, tally chart, translation shape, blank surface, geographical description frame) use the same attribute. Wherever the wall or the stick-in pack rasterises them through sharp, their labels may sit high too. Worth one rendered check each; the browser-drawn surfaces (worksheets) honour the attribute and are probably fine.

**2. Words-only sheets are allowed, and the picture is always the first thing to go.** `agents/working-wall-designer.md` permits text-led cards at rule 2 (line 82), in "Diagrammatic LOs" (line 158), in the P2 failure rules (line 270) and in the edge-case table (line 424). Rule 8's verbatim-steps paragraph (line 138) says that when the steps will not fit, "take the card's picture off" before omitting the card. On Thursday's wall the designer used that permission and wrote so in `rationaleNote`.

**3. The worked example has no drawn form on the wall.** On the board, the worked example is a `method-frame`: labelled lines, one per step (`Two numbers that make 10: 7 + 3 = 10`, `Add the last number: 10 + 5 = 15`). The wall cannot draw one (`wall: false` in `shared/visual-parity.js`, line 206), and `builder/src/content/method-frame.js` says why: a filled method on the wall is meant to be the `workedExample` card. But that card prints the filled method as one run-on line after "Worked example:" (`modelExampleParagraphHtml` in `render-panels.js`), so `48 + 20 = 68, 68 + 2 = 70, 70 + 3 = 73` wraps partway through a sum and loses its pairing with the steps.

**4. A number line copied from one slide shows only part of the method.** The Friday wall copied the board's `bridge-line` number line (60 to 80, jumps +2 and +3) exactly, as rule 4 asks. That slide's line only showed the bridging part, so the wall's line leaves out 48 and the +20 jump that steps 1 and 2 describe.

**Supporting evidence of taste.** Of 56 wall sheets built before 18 Sept, Daniel put up two, both `heroCallouts`: a picture with its parts pointed at. `diagramSection` (added 18 Sept) already carries the principle that the figure takes the room and the words get what is left (`render-section.js`, header comment). The proposal extends that principle to the method card rather than inventing a new direction.

## The four ideas the designer needs

These are the transferable content of the mock-ups. They go into the designer's guidance as judgement, with a reason each, not as a checklist.

1. **Draw the example itself.** The picture on a method sheet is the worked example the steps describe (the same numbers, the same source, the same circuit), not a separate illustration of the topic. Why: a child matches the steps to something they can see.
2. **Pin each step to its part of the picture.** Step 4's circle sits on the +2 jump; on a history source, step 2's circle sits on the detail step 2 asks you to find. Why: this is what lets the teacher point and say "remember when".
3. **One colour means one thing** across the picture, the working and the words. Tens orange and ones blue on Friday; the "last number" orange on Thursday. Why: colour then does the reading for the child. Where a board colour mark in a verbatim step clashes with the sheet's colour meaning (Friday's orange `reach the next ten` beside orange tens), that is a decision for Daniel, below.
4. **The steps stay word for word, as the support.** Beside or beneath the picture, each paired with its own line of working. Why: Daniel's earlier ruling that wall and board steps match so children trust both (rule 8) still holds; what changes is their place on the sheet, not their words.

Non-maths contrast example for the guidance: a history "How to read a source" sheet shows the source photo large with step circles on the date, the author and the detail the lesson used, and the three steps word for word beneath. A science "Build a series circuit" sheet shows the circuit diagram with step circles on the cell, the wires and the bulb in build order.

## Proposed changes, in order

Each step is small enough to review on its own. Nothing is committed or installed without Daniel's word.

**Step 1. Fix the step circles** (engine, `working-wall-html`).
- Place the digit by a computed baseline offset instead of `dominant-baseline`, and draw it in the wall's title font.
- Centre the badge on the first line of its step rather than the top of the row.
- Test: render badges 1 to 9 and check each digit's inked box is centred in the circle within a small tolerance. Undo the fix in a scratch copy and confirm the test fails.
- Then render one example of each of the 13 sibling drawings through the wall's rasteriser and look. Fix any that sit high the same way, or record that they are fine.

**Step 2. A picture-led method card** (engine plus card contract).
Extend `workedExample` rather than add a family, so every existing wall still builds unchanged:
- A new optional field pairs each step with its line of working, e.g. `items[].working: "48 + 20 = 68"`, taken from the board's method-frame lines. When present, each step prints with its working beside it (Friday's mock-up) and the one-line "Worked example:" paragraph is not printed.
- A new layout option puts the figure first: the picture across the top at a guaranteed share of the sheet, the paired steps beneath (portrait), or the working large on one side and the steps on the other (landscape, Thursday's mock-up). Borrow `diagramSection`'s rule that text is held to a share of the height so it cannot squeeze the picture.
- Step circles on the figure: allow a `visual.callouts` entry to print a step number in a green circle instead of a text label (`{ "anchor": [x, y], "step": 4 }`), and let a number-line jump carry `step: 4`, drawn beside its label. Callouts already resolve named parts and raw positions (`working-wall-card-contracts.md`, `cards[].visual.callouts`), so this reuses that machinery.
- Test: rebuild Thursday and Friday from their saved `working-wall.json` with the new fields added by hand, render at A3, and compare with the approved mock-ups in `evaluations/wall-picture-plus-steps-2026-09-29/` (`mock-thu.pdf`, `mock-fri.pdf`; `thu.pdf` and `fri.pdf` are the walls he flagged).

**Step 3. Number lines show the whole worked example** (designer guidance).
- Rule 4 ("match the final lesson's visual supports") stays. Add its one exception: when the method is modelled across several slides, the wall's figure may join them into the whole journey of one worked example, using only numbers the board used. Friday's line would run 48, 68, 70, 73 with all three jumps.
- Whether it is drawn to scale or as an empty number line is a decision for Daniel, below.

**Step 4. No picture, no sheet** (designer guidance plus one check).
- Replace the four text-led permissions (lines 82, 158, 270, 424) with one rule and its reason: every wall sheet carries a visual that shows the learning; if none exists or can be drawn, the designer writes `cards: []` with a `rationaleNote` naming what was missing, which is already a valid outcome since 4.2.236.
- Rule 8's order of making room changes: shrink and pair the steps first; the picture comes off never. If the steps still cannot fit beside the picture, the card is omitted, not printed as words.
- Enforce it in `working-wall-packet.py check`: a card with no `visual`, `photo`, `picture` or picture-carrying field fails with a message pointing at the rule. Check which families count as carrying their own visual (`referenceTable` rows with diagram cells, `vocabChips` with photos, `labelledDiagram`). The open question from 18 Sept, whether a words-only `referenceTable` may survive, is settled by this rule unless Daniel says otherwise.

**Step 5. Teach the four ideas** (designer guidance).
- Add the four ideas above to `references/working-wall-visual-language.md`, the file the packet already cuts into the designer's reference, with the maths and non-maths examples.
- Update the `workedExample` contract in `working-wall-card-contracts.md` with the new fields and a complete example.
- Mind the size guards: the role file has a 50KB limit and the make-lesson `other-resources` slice 7168 bytes. Fold, do not raise.

**Step 6. Test on four saved lessons.**
- Thursday and Friday (Year 4 maths, `working/year-4-maths-lesson-19-*`, `working/year-4-maths-lesson-20-*`), one history and one science lesson with walls already built.
- Rerun only the wall designer and wall build from each lesson's saved files, on Claude Code and on Codex (see memory `optimisation-step-1-measured`: test every change on both).
- Look at each rendered sheet at A3. Pass means: a real picture on every sheet, the steps word for word, each step findable on the picture, and Daniel would put it up.
- Also one discrimination case: a lesson where no honest picture exists should give `cards: []`, not a decorative picture added to pass the rule.

## Decisions for Daniel

1. **Colour clash with the board.** Friday's step 4 has `reach the next ten` in orange because the board coloured it orange, while on the sheet orange means tens. Keep the board's colour (the verbatim rule), or let the sheet recolour a marked word to match its own meaning?
2. **Number line style.** To scale with ticks, as the board drew it, or an empty number line (jumps in order, not to scale), as in the mock-up?
3. **Step text size.** In the mock-ups the steps print a little under the wall's usual smallest size to leave the picture room. Accept that, or keep the current smallest size and let the steps take more of the sheet?
4. **Build order.** Step 1 (the circles) is a fixed bug and can ship on its own straight away. Should it go first by itself, or wait and ship with the rest?

## Status, 30 September 2026 (built, not committed, not installed)

Daniel's word, relayed by another session: fix the rest of the plan and take my suggestion on each decision; do not save a version, install in Codex or replace the Week 4 walls.

- **Step 1, circles:** done. `badgeSvg` places the digit by baseline in the wall font; `test/step-badge-digit-is-centred.test.js`. Cause refined: the pinned sharp 0.33.5 ignores `dominant-baseline`; sharp 0.34 honours it. Siblings: all 26 uses of `dominant-baseline="central|middle"` in `shared/visuals/` (12 drawings) now use `dy="0.36em"`, the same fix grid-map got on 28 Sept. Every surface's tests pass.
- **Step 2, picture-first card:** done. `src/render-method.js`, `layout: "pictureFirst"`, `items[].working`, `callouts[].step`; number lines name `"jump N"` spots (`shared/visuals/number-line-svg.js`). `test/picture-first-method.test.js`.
- **Step 3, whole journey:** done as guidance in `working-wall-visual-language.md`.
- **Step 4, no picture no sheet:** done. `card_carries_a_picture` in `working-wall-packet.py check`; packet tests updated (three tests that asserted words-only passes now assert the opposite).
- **Step 5, four ideas:** done in `working-wall-visual-language.md` → Choose visuals; contract fields and a Friday example in `working-wall-card-contracts.md`; nine words-only permissions removed from the designer, four from preferences, two from the repair agent, one each from context-pictures and the playbook.

**Decision changed from the plan's suggestion (decision 3):** measured, at the 36pt floor neither wall fits with a picture (Friday's five steps need more than a whole sheet). The step list on a picture-first card now has its own floor, `style.sizes.a3StepSupportMinPt` = 28; question and working print larger. His approved mock-ups set steps at 26-32pt. One number to change if he disagrees.

**Decision 2 as built:** to-scale number line kept; a 40-80 line cannot label +2 at the readable minimum, so the guidance says run it just outside the numbers visited (45-75).

**Consequence to confirm with him:** sentence-stem and mnemonic-poster sheets have no picture area, so under his rule they are no longer made.

**Not done:** Codex test (would need installing, which he withheld); the ring-and-arc number bond drawing for Thursday (a new drawing, for the helper builder).

### Trial, 30 September 2026 (Claude only, designer read from the edited file)

Four saved lessons, fresh designer runs (Opus, high effort), outputs in `evaluations/wall-picture-plus-steps-2026-09-29/trial-2026-09-30/`. The installed Claude Code copy is 4.2.222, so the runs read the edited role file directly rather than launching the agent by name.

- Friday maths: picture-first card, 45-75 line, steps 2/4/5 pinned. Weak evidence: the contract's example is this lesson.
- History: heroCallouts, Shaftesbury portrait. Pictured; unchanged kind of sheet.
- Science: labelledDiagram, the lesson's body diagram.
- Thursday maths, first run: left the method off, made a two-part section of the order counters. Two contradictions found and fixed: `working-wall-preferences.md` still said "let the card stand on its worked example alone", and the view said a figure is "never re-derived". Now: the example may be drawn in the board's own kind of drawing holding only its own numbers. Rerun: picture-first card, counters holding 7, 5 and 3, steps pinned under the groups. Fallback pin size raised from 7% to 11% after seeing it.
- Also fixed from trial reports: the "Worked example" item goes first on a pictureFirst card; copying the board's number line yields to joining a method's journey.
- Ledger rows superseded by the 29 September rule carry a dated note (colours, starters-sticky-apply, success-criteria ledgers).

Open, not this job's: diagramSection prints a note past its part (Thursday run 1, sticky fact), and its layout check passed it; "Where this lesson sits" names only the next lesson; the visual-primitives paragraph repeats itself; a helper paragraph opens the designer role file with no context (another session's edit); counters have no named spots for pins.
