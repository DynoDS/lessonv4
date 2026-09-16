# Follow-on trial protocol: frozen before any trial ran

Frozen on 16 September 2026, after the runtime guidance was committed (`0b084af5`) and before any authoring, review or tuning, so the briefs and the scoring cannot be steered by results.

## Arms

| | Baseline (post-Phase-1) | Candidate (follow-on) |
|---|---|---|
| Tree | `C:\Users\Daniel\Projects\lessonv4-designer-quality`, branch `lesson-designer-quality-2026-09-15` at `21b7c508` | `C:\Users\Daniel\Projects\lessonv4-cumulative`, branch `lesson-designer-cumulative-2026-09-16` at `0b084af5` |
| Agent file | that tree's `plugins/lesson-v4/agents/lesson-designer.md` | same |
| Runner | a Claude Opus 5 general-purpose subagent following the agent file | same |
| Web | none | same |
| Output | one `design-decisions.md` holding a connected teaching episode, as first returned | same |

Both arms run on the same model in the same session; the Phase 1 model confound is not repeated. Neither arm is the production designer (gpt-6-astra at medium effort), which is unavailable here, so every episode is labelled a Claude-run illustrative design from the configured instructions.

## Budget and stopping rule (the follow-on plan's ceilings)

- **Four design-only authoring assignments**: baseline and candidate on each of two fresh briefs. Each asks for a connected short teaching episode with actual pupil-facing material and expected responses, ending included, not a resource pack, scaffold or JSON. No brief is re-run for a better answer. An assignment that fails to return an episode is recorded as not produced and not replaced.
- **One batched review assignment**: the sixteen blind cases under the candidate reviewer's guidance, and the four episodes as two anonymised pairs under the neutral questions below. Same-model review, recorded as such; not independent human confirmation. The prompt asks only for a verdict and reason per case, never for a bypass or second answer (the Phase 1 leak).
- **One rendered episode**: a three-to-six-slide excerpt of the candidate episode chosen by the review, built with the existing builders from content copied from the episode, plus its kit if it has one. No image generation.
- **Staging experiment**: not run; not in scope.

## The briefs

Held out: neither objective is a worked example in the runtime references (evaporation appears once, as a vocabulary-pairing illustration; inverted commas do not appear).

**B1, science (knowledge).** Year 4. `To explain how temperature affects how quickly water evaporates.` Episode length about 25 minutes, from first teaching of the main idea to the end check. Authorised learning: evaporation is liquid water turning into water vapour, an invisible gas in the air; the water has not disappeared; warmer water evaporates faster. Prior knowledge: children know solids, liquids and gases and that water boils when heated a lot; they have not been taught evaporation. Supplied evidence the episode may use: three identical saucers each started with 50 ml of water and were left for two days; afterwards the sunny windowsill saucer had 10 ml left, the classroom shelf saucer 35 ml, and the fridge saucer 48 ml. Class: mixed Year 4 of 30. Teacher's note: "I want them to understand the water goes into the air, not that it vanishes, and to use the results rather than just be told."

**B2, English (skill).** Year 4. `To punctuate direct speech using inverted commas.` Episode length about 25 minutes, from first teaching to the end check. Authorised learning: inverted commas go around the words actually spoken; the punctuation that ends the spoken words (comma, question mark or exclamation mark) goes inside the closing inverted comma; a reporting clause such as `said Sam` follows with a comma after the spoken words when the sentence carries on. Out of scope today: starting a new line for a new speaker, and reporting clauses placed before the speech. Prior knowledge: capital letters, full stops, question marks and exclamation marks; children know speech bubbles. Supplied text the episode may use (unpunctuated, from the class story): `I can't find my shoe said Leo` / `Have you looked under the bed asked Mum` / `It's not there shouted Leo`. Class: mixed Year 4 of 30. Teacher's note: "Speech bubbles are fine; I want them to see that inverted commas do the same job as the bubble."

## Neutral scoring questions for the episodes (the follow-on plan's section 9D)

1. **Learning.** Does the episode make its important idea understandable? Does it stay within what children can use, or does a task rely on something never taught? Can a plausible misunderstanding pass the main task?
2. **Development.** Does the pupil work build: does what children produce or understand in one beat get used, after any needed check, by a later beat? Or are links only narrative, repeated props or relabelled activities? Parallel evidence and purposeful practice count as sound.
3. **Teacher use and voice.** Could the teacher follow it from the slides as written? Is essential meaning on the board without crowding? Does the wording sound like a warm, plain-spoken teacher?
4. **Pupil experience and preservation.** Does substantial work arrive when children are ready? Are reading, handling, discussion, recording and checking costs realistic? Are the objective, accuracy and subject thinking intact, with nothing inflated?

Improvement is judged on the pupil material, not the rationale. Apparent difficulty from added content, variety from redundant activities, or a better-written rationale over the same pupil material count against a design. "No difference" is an allowed answer, and a baseline episode that is better is reported as better.
