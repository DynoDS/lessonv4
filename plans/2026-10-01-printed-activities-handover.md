# Printed activities: where we got to (1 October 2026)

For Daniel, to read after teaching and answer when you have time. Nothing here is pushed or installed.

## What started it

The Shaftesbury test lesson. You noticed:

- The only printed piece was Sarah's words, and nothing on the slides told you to hand it out.
- Two Do beats were sorts (the story in order, the three children) but neither came with anything printed.

## What I think you wanted, in your words then mine

**1. "It tries to get as many levels as possible that makes sense... I should have the choice."**
I took this as: every sort or order task comes with a printed version as well as the board version, and you choose on the day. The designer should never decide "board only" for something the pack can print.

**2. "I'd want them separate."**
Each printed piece is its own file, so you print only what you want.

**3. "Activity 1 (Sarah's words), Activity 2 (Story cards to order)..."**
Files are named just `Activity N - what it is`. No lesson name, no "Stick-in Sheets".

**4. "Always try to make it full page... avoid cutting and sticking unless that's the task... the sheet should also have the task on it... it doesn't need the cut along the dotted lines instruction."**
A printed piece is one whole page by default, one between two, with the task written at the top like a worksheet. Cards to cut out only when moving them is the point. No printed instructions to the teacher on the page.

**5. "C needs to be separate from the text."**
A card's letter prints on its own line in bold.

**6. "Couldn't it have been a table... and they tick? ... it could have clues."**
A sort of words into a few groups prints as a tick table, with what children decide by (the 1842 law) printed at the top as the clue.

**7. The part I'm least sure about.** You said:
- "printing that three children thing would have actually taken them 2 seconds, longer to print! And it's a slightly different variety of doing/thinking/application right? Do Do beats think of this too?"
- then: "it's not that it shouldn't have used a printing version... it's changing the task or way it's recorded or done."

My reading: **a printed version is worth having when it changes how children do or record the task**, so it becomes a different kind of doing. It is not worth it when it just copies the board onto paper. The three children on the board is two seconds of reading names. On the tick-table sheet, with the law as the clue, children check each child against the rule, which is application. You want the designer to think this way when it plans each task's printed level, and you're asking whether the Do beat planning considers "how it's recorded or done" as part of variety.

**Please tell me if that's right.** I briefly misread it as "quick checks shouldn't be printed" and added an exception, then took it straight back out when you corrected me.

## What is done (built and working, not committed)

- **Separate files**, named `Activity 1 - Sarah's words.pdf`, `Activity 2 - Story cards to order.pdf`, `Activity 3 - Three children to sort.pdf`, plus `Activities - Answers.txt`. Built in a folder per lesson so two lessons never overwrite each other; your drive gets the plain names.
- **Full page by default** for a text source (big print, the task on top) and for a sort printed as a sheet.
- **No cutting captions** on any printed page.
- **Card letters** print on their own line in bold.
- **Tick table** for a word sort into up to four groups (no pictures, not an order), with an optional clue line at the top.
- **An order with an extra place** (1st to 4th plus "Never happened") prints as "Write 1 to 4 in the boxes, or X for never happened".
- **The design check now refuses a sort with no printed version.** Every sort says whether it prints as a whole sheet or as cards.
- **For your lesson today**, the Shaftesbury activities and slide notes were made by hand to match all of the above, and are on the E drive.

## What is not done yet

1. **The designer's own instructions.** These are still to change, and they hinge on your answer to point 7:
   - Every sort or order is written as a proper sort so the pack can print it. The story ordering wasn't, which is why it had nothing to print.
   - The printed version is chosen for how it changes the doing or recording, not to copy the board.
   - The slide notes always say when to hand out each printed activity.
   - A whole sheet is the default; cards only when moving them is the task.
2. **Variety:** whether "how children record it" (tick, number, underline, move) should count as variety when the designer reads its Do beats together. Your question "do Do beats think of this too?"
3. **The story-ordering task itself.** My honest view: the boxes repeat what the teacher said a minute earlier, so ordering them is mostly handing the story back. A task that makes them reason ("which of these could he not do on his own?") might be better. Your call.
4. **The plugin's own checks:** eight checks fail because they still expect the old single file, the old cutting captions and the old naming. That's expected, and I'll update them once you confirm the direction.
5. **The run's saving step and playbook** need to pass the new activity file names through. Done by hand today.

## Questions for you, one at a time when you're back

1. Is point 7 right: the printed version should change how children do or record the task, and that's what makes it worth printing?
2. Should "how children record it" count as variety when the designer checks its Do beats don't all feel the same?
3. Happy for the tick table to be the default for word sorts into a few groups, and a whole sheet with boxes for orders and picture sorts?
4. For the story-ordering task: keep it, or should the designer have chosen a reasoning task there?

---

## Your answer to point 1 (1 October, afternoon), and the review it asked for

**What you said:** not just sorts, *every* Do beat gets a decision. The designer makes the Do beat, then decides how it is presented: at three levels, two, or one.
- **Level 1, the board:** always.
- **Level 2, a printed sheet:** like a mini worksheet. Clear what children are doing, full page, one between two (two to a page is fine when it saves paper, you can trim). It should take longer than a quick recall: something they have in their hands, presented in a way that helps them, maybe making the task a bit longer.
- **Level 3, real things:** what you could get for a prepared day.
- Quick recall is probably board only, "but we need to think about this carefully".
- Variety is wanted, but not forced.

### What the plugin has today

**1. How a level is decided.**
- Only one structured decision exists: a *sort* says whether it prints (`handling`).
- Every other Do beat's levels live in one line of prose in the walk-through ("Levels: board only..."), which nothing reads mechanically.
- The stick-in designer then hunts the lesson for "write-on moments" by its own test.
- So a printed level reaches you only if the designer wrote it in prose *and* the stick-in designer agreed.

**2. What can be printed.**

| What | Today | Full page? |
|---|---|---|
| Sort into groups (word cards) | sheet with boxes, tick table, or cards | yes (new today) |
| Order (story, life cycle) | sheet: write 1, 2, 3... | yes (new today) |
| Sort pictures | sheet with large pictures and boxes | yes |
| A text source to read and quote | Sarah's words style | yes (new today) |
| A picture source to look at closely | small slip to stick in | no |
| A drawn figure to write on (53 kinds: map, timeline, number line, Venn, Carroll, fishbone, concept map, continuum line, results table, bar model, clock...) | small slips, several per page, cut and stick in books | no |
| A labelled diagram to label | small slip | no |
| Draw in a box | small slip | no |
| The final task | the full worksheet (Below / Expected / Greater Depth) | yes |

**3. Do beat types (`do-beats.md`, 11 families, about 90 formats), and what each could have.**

| Family | Examples | Board | Printed sheet today | Printed sheet missing | Real things |
|---|---|---|---|---|---|
| 1 Recall | free recall, two things, roulette | yes | no | probably not needed | no |
| 2 Talk | partner talk, convince your partner | yes | no | maybe a sentence-stem card, rarely worth it | no |
| 3 Write | one-sentence summary, caption this, hinge question | yes | no | a short task sheet (picture + lines) for caption/annotate | no |
| 4 Visual / Draw | label a diagram, finish the picture, fishbone, concept map, circle the clues | yes | slips only | full-page version of the same figures | sometimes |
| 5 Sort / Classify | card sort, odd one out, true/false, match pairs, always/sometimes/never, put in order, causal chain, same and different, which picture | yes | sort, order, true/false, always/sometimes/never (as a tick table), same and different (Venn, slips) | odd one out (circle it), match the pairs (draw lines), causal chain full page | cards, objects |
| 6 Rank / Position | diamond nine, continuum line, rank three | yes | rank three (as an order), continuum line (slip) | diamond nine sheet, continuum line full page | cards |
| 7 Movement | freeze frame, human sequencing | room | no | not needed | the children |
| 8 Generative | apply to a new case, spot the mistake, prove Sam wrong, write the question | yes | no | a task sheet: the case or the wrong working printed, space to answer | no |
| 9 Metacognitive | confidence check, muddiest point | yes | no | not needed | no |
| 10 Explain / predict | because sentence, predict before reveal, words to diagram, what can we tell | yes | words to diagram (figure slips), what can we tell (picture slip) | prediction sheet (predict, then record what happened), source + question full page | sometimes (predict a test) |
| 11 Hands-on | sort pictures, build in pieces, place on map/timeline, look closely at a source, quick test, model | yes | sorts and sources; map and timeline as slips | map/timeline full page; results sheet for a test | yes, that's the family |

### What I think

1. **The gap is mostly not "can't print", it's "prints as a small slip to cut and stick".** We can already draw 53 kinds of figure, but only as book-sized slips. You want a full page, one between two, with the task on it. That's one change to how pieces are laid out, not 53 new templates.
2. **Two kinds of sheet are genuinely missing:**
   - a **task sheet**: the task at the top, the thing to work on (a case, a wrong working, a picture), and space to answer. This covers apply to a new case, spot the mistake, prove Sam wrong, caption this, and what can we tell.
   - **match the pairs** and **odd one out** as sheets (draw lines; circle it).
3. **The decision needs to be a field, not a sentence.** Each Do beat records: board (always), printed (which form, or "none, because..."), real things (what, or none). Then the stick-in pack builds exactly what was decided, and the slide notes always say when to hand it out.
4. **Board only should be the exception with a reason**, and the obvious ones are short: recall, talk, movement, metacognitive, and a hinge question. Even then, you can override.
5. **On "it should take them longer than a quick recall":** I'd put that in the designer's guidance as the test for level 2. The printed version earns its paper when it changes what children do (tick against a rule, write on a map, underline in a source, order on a sheet), not when it reprints the board's two-second question.

### Questions for you (one at a time when you're back)

1. Do you agree the decision should be a recorded choice on every Do beat (board / printed form / real things), with "none" needing a reason?
2. Board only for recall, talk, movement and metacognitive Do beats, unless the designer says why a sheet would help: right, or too strict?
3. Shall I build the full-page version of the existing figures (map, timeline, Venn and so on) first, or the new task sheet first?
4. Two to a page when a sheet is small enough: should the plugin do that automatically, or always one full page and you trim?

---

## Built on 1 October afternoon (after "if it helps the plugin, yes")

Daniel's answer: a recorded decision on every Do beat, yes if it helps the plugin, and the plugin should simply think and do it correctly each time without loading him. So the other three questions were settled with defaults, not asked:

- **Board only** stays for beats where a sheet would only reprint the board (quick recall, partner talk, a confidence check); the designer writes why in a sentence. A sort or order is always printed.
- **Build order:** full-page figures and the task sheet together.
- **Two to a page:** automatic when the piece keeps at least 80% of its full-page size; otherwise one full page.

What now exists (all checks pass, not committed, not pushed):

1. **Every Do beat records its `levels`** in the lesson plan: `printed` (form `sort`, `source`, `figure` or `task`, who shares it, what is on it) or `boardOnlyBecause`, and `realThings`. The scaffold asks for it on every doing beat; the design check refuses a missing reason, a sort without a printed version, and a printed beat whose script never says when to hand it out.
2. **The pack must print what the plan chose:** the stick-in check refuses a pack missing a printed level, and a printed level means the stick-in designer always runs.
3. **Full-page printing for every drawn figure** (map, timeline, Venn, number line, table, angle rows...), task at the top, two to a page when it fits; `layout: "slips"` keeps cut-and-stick for when gluing in is the task.
4. **A new task sheet:** task, a named child's claim in a speech box (or a case, worked answer or picture), smaller prompts, then ruled lines to the bottom of the page.
5. **The child's-seat view** shows each beat's printed and real-things option.
6. **Instructions rewritten, folded into the existing rules:** preferences (`A hands-on task has a board version`: what a printed level is for), lesson designer, plan format (`levels`), stick-in designer and its reference, and the run's saving step.

Not done yet: a real lesson run to see the designer use `levels` well; the other chat's worksheet changes (group question line) are in the same folder and were left untouched.
