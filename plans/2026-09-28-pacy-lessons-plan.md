# Pacy lessons: what the plugin needs to make "THIS" on its own (28 September 2026)

Status: implemented in the working tree (not committed, not in Codex); test runs on Claude in `evaluations/trial-2026-09-28-pacy/` (history, science, RE, PSHE, one maths). Daniel's decisions: card straight after the story beat that brings the word in; retelling first; test away, one maths only ("Math slides are fine right now. Its the other subjects").

## What changed (28 September 2026)

- `preferences.md` Slide Philosophy: new **A Teach run is paced: one thing to look at per slide** (the policy, his quote, boundaries: words never removed, sentences kept together, never one sentence per card, Teach beats only). Tudor rejection line: "a beat splits once" became "splits where what the class looks at changes". Ceiling paragraph: five is a ceiling, not a reason to keep two things to look at on one board. Visual-need boundary: the designer asks for a picture per group of board lines about one thing.
- `slide-composition-playbook.md`: the Teach split paragraph paces first; both examples named; §6 space-pressure says pacing comes first; vocabulary slide sits after the slide that first says a story-introduced word.
- `references/examples/diseases-paced-teach-slides.lesson.json`: the chosen run (11 slides), checked by the slide check.
- `check-slide-design.js`: a split slide whose lead is a whole teaching sentence is teaching, not a label (`TEACH_SPLIT_LEAVES_A_LABEL` still refuses `A Tudor farm household`); tests updated and added.
- `lesson-designer.md`: the told-first section from `cand-order-4`, with the retelling written before the telling and the read-back checking the telling against it (never the other way round); smallest-visual-set line narrowed to task sets; drawn names meet a stand-in; the vocabulary validator sentence carries the new exception.
- `teaching-sequence-content-based.md`: the met-words rule covers the beat's label (slide title) too.
- `validate-lesson-design.py`: a card may follow the Teach whose board brought the word in; a Do that merely says it does not count (tests added).
- Ledger pins followed their text (`repin_round5.py`, failing rows only); three source-contract tests follow moved text; new `test_a_teach_run_is_paced.py`.

## Test results (28 September 2026, Claude, live plugin, grey picture boxes)

Decks: `evaluations/trial-2026-09-28-pacy/Pacy test - *.pptx`. History 20 slides, science 19, RE 16, PSHE 18, maths 35 (practice and answer slides; the Teach part is unchanged in shape). All five approved (RE after one redesign pass: the launch model answered the task). Retellings 4-5 lines, about 7-12 new things each. Every knowledge-lesson Teach slide carries a picture; beats split where the thing looked at changes; Dos between; history's cholera card now follows the slide that introduces the word, and its headline avoids the word. Still open: the pump handle only in history's notes; emoji on two word cards; small text where three cards share one side; history's sewers and salt-and-sugar extras; maths Apply speech bubbles print the calculation vertically; one girl portrait for two invented girls (RE, maths).

## Round 2 corrections (his read of the five decks, 28 September 2026)

- Word cards: my "card after the story introduces the word" change put cards after the teaching (science, RE, history anchored after Teach unit-001). He: the card is "these are the words that are going to come up, this is kind of what they mean, and then you go into the actual teaching". Withdrawn: validator exception, its tests, the prose; the card now sits after the scene and just before the slide that first uses the word (preferences Vocabulary, playbook Vocabulary).
- Scene before headline: history opened "Why did Victorians blame the smell?" on the headline about the smell ("What smell? ... random"); science opened on the headline, not the puddles. Playbook headline paragraph: scene lines take the first slide, the headline leads the next.
- One new idea per chunk: RE's first chunk taught gurdwara, langar, Guru Nanak, castes and equality before a Do. Designer read-back: a chunk carries one new idea; backstory that brings a new person or system counts; backstory from what children know stays.
- Round 2 runs (history, science, RE, PSHE; no maths) in `evaluations/trial-2026-09-28-pacy2/`.

## Evening, 28 September 2026

- Word cards at slide level: `slide-designer.md` §7 said "placed after the last slide of the unit", which beat the playbook; it now moves the card past slides that do not yet show the word. Preferences Vocabulary gains his test "is there an important word ... on the next slide?" (gurdwara) and his can/condensation example.
- Codex geography test (design, voice, slides, no reviewer, 4.2.299 cache refreshed from the working tree): amount right (retelling first, ~7 new things); no scene; five parts as a list; rainforest-extent maps missing (HELPER_GAP, the test told the helper step not to build); 3 photos. His question "what is the story?" led to: story shapes for every kind of lesson in the designer's "Be one connected story" (past, place, how something works, belief/practice, own lives, method, plus the shuffle test) and `subject-geography.md` → `A place is a journey, not a list`.
- Route audit: every principle from 26-28 Sept reaches all five routes through the designer's own steps, preferences (read at start by every route), the playbook and slide-designer (every route) and `How this teacher explains` (read on every route) - except the known-words rule, which lived in the content route's Output Format Block; moved into How this teacher explains. The reviewer had no check for scene-first, one idea per chunk or known words; three bullets added to its §4.
- Running now: a full Codex make-lesson run of Geography 1 (`evaluations/trial-2026-09-28-codex-geography-full/`), checked at approval and voice edit; and on Claude one lesson per route (`evaluations/trial-2026-09-28-types/`).

## The target

`evaluations/trial-2026-09-27/Rebuild 1 split - Diseases (paced, picture boxes).pptx` (built from `overnight/deck-h6-diseases-v2b`). Daniel: "THIS POWERPOINT is good. Its not a lot of concepts and abstract things to learn, its broken down nicely, theres visuals and pictures everywhere." Still to fix inside it: the cholera card before the scene, the map at half width, the pill emoji, stale notes.

It came from two stages that the normal plugin does not reach:
1. The design (`overnight/h6-diseases-new4`, candidate `cand-order-4`): lesson told before its parts, a retelling the weakest child could say at home, about 12 new things, fuller wording.
2. A hand-briefed split (`deck-h6-diseases-v2b/SPLIT-ASSIGNMENT.txt`): same words, 17 to 22 slides, one chunk per slide, a picture on every teaching slide (8 pictures added to the 6 planned).

## What stopped the plugin producing it (evidence)

1. **Amount.** The live designer chooses parts before telling the lesson and has no retell test. `cand-order-4` fixed it once (diseases 12 things; Anglo-Saxons dropped the seven kingdoms unaided) and drifted once (`h6-diseases-new5`, about 17: the retelling is written after the telling and grew to fit it). Not in the live plugin.
2. **Slides are filled, then split once.** `slide-composition-playbook.md` → `A Teach beat splits where its teaching turns`: "When it will not fit one board at the ceiling, cut it at the turn ... one split per beat", and `preferences.md` → Tudor calibration: "a beat splits once, where its teaching turns". With the five-piece ceiling, boards run at four or five pieces. Daniel 28 Sept: "a slide isn't a slide full of information. It's the information, but paced up. So one slide with this picture ... And then maybe one more slide, then do bit." (memory `less-is-more-means-pacy`). The 14 Sept rejection this rule came from was one sentence per card and a slide with no picture; the split deck keeps sentences together and a picture on every slide, so the old boundary survives and the "once" goes.
3. **Pictures are planned per beat, not per chunk.** The designer planned 6 pictures for 17 slides; the slide designer may only use promised files. `lesson-designer.md` "Smallest coherent visual set learning requires" pulls against `preferences.md` → Lesson Designer visual-need boundary ("ask of every slide"). The designer cannot see slides, so the question has to be asked of each chunk of the board. Budget 16 (run 24) is not what limited it; a pacy lesson may approach it.
4. **The check refuses a picture plus one sentence.** `check-slide-design.js` `TEACH_SPLIT_LEAVES_A_LABEL` counts a `lead` as a caption, so a slide of one teaching sentence and its picture is refused; the split had to double up the sewers and today's treatment.
5. **Words before their introduction.** Headline fixed today (`teaching-sequence-content-based.md`); the unit/slide title still named cholera first in the 17-thing run. The vocabulary card is placed after the starter because the validator requires the next beat to use the word, so it lands before the scene.
6. **How a thing works** (the pump handle): folded into the designer today.

## Decisions for Daniel

1. Where should a word card go when the story itself brings the word in (cholera)?
2. Retelling written first (the backbone the telling follows), or after as a check?
3. Approve the test runs (about 8 to 12 agent runs on Claude).

## Planned changes (once decided)

- Designer: integrate told-first + retell (from `cand-order-4`), repin ledger pins; picture per chunk that names something in the world, and resolve "smallest coherent visual set" to mean evidence sets for a task; titles obey the headline words rule.
- Playbook + preferences Tudor calibration: pacing replaces "split once": one chunk per slide, each with its own visual, sentences that belong together kept together, five stays the maximum.
- Check: a split slide whose lead is a whole teaching sentence from the explanation is teaching, not a label.
- Vocabulary placement per decision 1.
- Validate: diseases (original), Anglo-Saxons (generalisation), a maths lesson (discrimination: practice slides must not fragment), each designer to slides on Claude, compared with THIS.
