Use the improving-agents-and-skills skill. This is an investigation only: change no plugin file, run no fix, commit nothing.

## What I want found out

Lesson v4 still mostly fails to show children what is happening when a lesson explains how something works. I ruled on this on 18 October 2026 and a rule was added that day, but in the lessons built since, it landed in some places and not in many others. I want to know exactly why, for any lesson, before anything is changed.

My ruling, in my words as recorded: children look at the picture first while the teacher reads the words, so the picture has to show what the words explain. When a slide explains how something happens, a teacher would show it happening (the air's tiny parts pushing each other along, sunlight going into a leaf with arrows), not a box saying "the air" or a photo of grass. Helpers (the plugin's ready-made drawings) are there for common things so a flowchart is not rebuilt every run, but the designer must first ask "what must the children see to understand this?", then use a helper if it fits, or make the picture through Codex when none does. The check has to test that.

## Evidence to read

All of it is in `C:\Users\Daniel\Projects\lessonv4\stress-test-2026-10-17-science\show-it-happening-evidence\`. Each folder holds a designer-only test run made on 18 October with the rule in place: `lesson-design.json`, `design-decisions.md`, `photo-requirements.json`, the slide spec `lesson.json`, `helper-check.json`, and `deck.png` (every slide on one sheet; open it to look).

- `sound2`: it landed. The designer asked for a made picture of air as dots bunching up as a push passes along.
- `foodchains` (first run): it did not land. The slide explaining that grass makes its own food used a photo of sunlit grass.
- `foodchains2` (rebuilt after more repairs): it landed for the grass (a made picture of sunlight into the leaves and water up the roots, which I liked; see `grass-making-food-liked.png`).
- `digestionnames` (first run): it landed well (made pictures of the oesophagus squeezing food along like toothpaste, and the stomach churning food to mush).
- `digestionnames2` (rebuilt): it got lost. The same labelled diagram is used on slide after slide, and the squeezing and churning pictures are gone.
- `now-and-could-be-deck.png`: a hand-made comparison I judged "better", including the grass slide.

Older cases of the same fault:
- 17 October, a Codex build of Year 4 sound lesson 1: "back and forth" arrows floating beside a photo of a ruler instead of showing it moving. Diagnosed then in memory `vibration-arrows-diagnosis-2026-10-17.md` in `C:\Users\Daniel\.claude\projects\C--Users-Daniel-Projects-lessonv4\memory\`.
- 17 October, the Claude build of Year 4 sound lesson 2, slide 6: drum photo, arrow, a box saying "the air", arrow, ear photo. In `C:\Users\Daniel\Projects\lessonv4\working\year-4-science-lesson-2-explain-how-we-hear-sounds (1)\`.

The full background is in `C:\Users\Daniel\Projects\lessonv4\plans\2026-10-18-sound-lessons-investigation.md` (section 4 and the answers after section 8). My earlier picture rulings are in memory: `pictures-on-slides-ruling-2026-10-12.md`, `explaining-rulings-2026-10-14.md` ("a simple picture and text that matches it, one moment, one idea"), `made-pictures-of-real-things.md`, `second-library-before-a-made-picture.md`, `claude-makes-pictures-through-codex.md` and `lesson-scope-from-the-objective.md`.

## Where the rule lives now (read the live plugin, `C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4`)

- `references/preferences.md` → `Lesson Designer visual-need boundary`, the paragraph "A slide that explains how something happens shows it happening" (with the grass contrast).
- `agents/lesson-designer.md` → `Teaching Representations` (the `requiredFeatures` sentence) and the telling section ("a picture of the idea happening rather than only of the thing it is about").
- `references/lesson-designer-components.md` → `Photograph acquisition` (a made process picture is `controlled-ai`).
- `scripts/check-helper-coverage.py` (the inventory now prints each picture's purpose beside what it must show) and `skills/make-lesson/playbook-lite.md` → Phase 1.5.

## Questions to answer, with evidence for each

1. In each run, at what moment did the designer decide each picture for an explaining step, and what did it read just before? Did it reach the "shows it happening" paragraph at that moment, or only later (it sits in a section read at the picture contract, after the telling is written)?
2. Why did the same rule produce made process pictures in some runs and photos or a repeated diagram in others? Look for what pulls it away: the picture budget, the cost or risk of a made picture, a preference for a helper or a labelled diagram once one exists, the slide planner reusing one picture, the scout's search order, or the made-picture route failing.
3. What does a made picture cost a run, and what happens when it fails? On 18 October the image tool refused the plugin's own prompts for a child's body ("bare tummy" child figures) twice; check how often made pictures fail and what the lesson is left with.
4. Is "show it happening" a judgement the designer can reliably make from prose, or does it need a mechanism (a field on each explaining step naming what must be seen happening, a check, the reviewer)? Remember my standing rulings: no caps, one reviewer, no new review stages, and fix the cause upstream rather than patch one lesson.
5. Where would the obvious fix over-fire? A route diagram is right where the route is the point (a food chain's arrows); a name or a told fact needs only its thing; a real event or person follows the photograph rules. Do not make every slide a made picture.

## How to report to me

I am not a developer and I find dense text hard to read. Talk to me one point at a time, in plain English, with no file names, code or em dashes. For each finding: what happens now, what you think, what you suggest, then one question. Put the full detail in a document in `C:\Users\Daniel\Projects\lessonv4\plans\`, and walk me through it in chat one decision at a time. Do not propose a fix until I have agreed the diagnosis.
