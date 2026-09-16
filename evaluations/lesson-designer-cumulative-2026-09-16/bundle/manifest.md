# Follow-on review bundle manifest

Base `21b7c508` (Phase 1 completion). Head: the evaluation commit on branch `lesson-designer-cumulative-2026-09-16`, recorded below once committed. Everything here was produced on 16 September 2026 on this machine. No credentials, pupil data or conversation history. The teacher's taught deck is referenced by path in the Phase 1 record and not copied.

Head revision: HEAD_REVISION

| File | What it is | Belongs to |
|---|---|---|
| `../report.md` | The follow-on report | All |
| `../development-record.md` | Already met / needs refinement / not implemented / uncertain, item by item, with evidence | Plan sections 1 to 9 |
| `../cases.md` | Sixteen fixed cases with predefined verdicts and reasons, and their provenance | Section 9A |
| `../blind-cases.md` | The same cases with verdicts and reasons removed, as the reviewer received them | Section 9A |
| `../trial-protocol.md` | Arms, briefs, budget, stopping rule and neutral questions, frozen before any trial | Section 9C |
| `../trials/B*-*/teacher-brief.txt` | The exact brief each authoring run received | Section 9C |
| `../trials/B*-*/design-decisions.md` | The four episodes as first returned (Claude-run, not the production designer) | Section 9C |
| `blind-inputs/episode-*.md` | The anonymised episode copies the reviewer judged | Section 9C |
| `episode-key.json` | Which anonymised episode is which arm, held back until the review was recorded | Section 9C |
| `../review.md` | The single batched review: sixteen case verdicts, then the two pair comparisons with quoted evidence | Sections 9A and 9C |
| `render/make_lesson.py` | The script that copies the candidate science episode's wording into a slide spec, with the layout choices recorded | Section 9C, rendered episode |
| `render/lesson.json` | The slide spec it produced | Rendered episode |
| `render/Evaporation and temperature - episode excerpt.pptx` | Five slides built by the real slide builder | Rendered episode |
| `render/pages/*.png` | PowerPoint-rendered page images and a contact sheet of those five slides | Rendered episode |
