# Lesson v4

The Lesson v4 plugin is for UK primary teachers. It takes a learning objective and produces a teacher-ready lesson PowerPoint.

This repository is the installable Lesson v4 package for Codex and Claude Code.

## Why pedagogy and rendering are separate

Bundling pedagogical reasoning and slide blueprinting into a single agent produces good lessons, but the agent has to think about two different domains at once — and the pedagogical decisions become hard to trace or improve separately from the slide output. Stripping the designer down to a thin template-filler is fast but loses the pedagogical reasoning entirely.

This plugin splits the work cleanly instead:

| Agent | Role |
|---|---|
| `lesson-designer` | Pedagogy only — structure, sequence, examples, misconceptions. Writes a compact decisions record plus the authoritative structured lesson-design.json contract. |
| `slide-designer` | Takes the Lesson Design, picks templates, maps content into slots, writes speaker notes, resolves its own optional Educational SVG requests, and outputs a structured spec. |
| `image-scout` | Unified picture worker — searches approved real sources, visually checks candidates, continues to authorised AI generation in the same session, stages outputs, and writes a compact result. |
| `working-wall-designer` | Selects wall-worthy cards, resolves its own Educational SVG P2/P3 requests, applies the resolved-picture-or-remove gate, and writes final builder-ready `working-wall.json`. |

The core `make-lesson` route runs the fixed slide, worksheet and stick-in build
commands directly after their specifications pass the existing gates.
`working-wall-builder` remains in the route because it performs the wall's
physical-page and visual-output verification after the fixed script runs. The
compatibility builder-agent files remain packaged for direct or legacy use.

## How pictures are obtained

1. **Contract.** Lesson Designer writes one complete schema 2 picture contract and Design Reviewer independently checks teaching evidence, authenticity, source fitness, fallback meaning, generation controls and comparison-set coherence.
2. **Compile.** `compile-picture-assignments.py compile` validates the frozen contract, derives routes and search schedules, computes the fewest valid small batches, and renders immutable AI prompts. `validate-image-scout.py manifest` then re-derives the same partition independently and must report `PICTURE_MANIFEST_OK`. The host launches one unified `image-scout` directly for each emitted assignment.
3. **Fulfil.** One `image-scout` per batch searches and visually judges real candidates, then continues to authorised AI generation after a checked real-search gate. Authentic evidence never reaches AI; outages never count as exhaustion.
4. **Finalise.** Workers stage only. The deterministic finaliser validates the whole result, derives source attribution/licence or exact AI history, publishes accepted rows independently, writes terminal receipts, and releases each filename. Provenance rechecks canonical hashes before transient cleanup.

Every filename has at most two AI calls in its immutable ledger. Final resource visual review still checks crop, teaching meaning, task fit and set consistency.

Optional P2 and P3 drawings come from the Educational SVG library: 135,607
drawings living in their own repository, [DynoDS/educational-svg][svg-repo].
That repository is fetched, never cloned. This package ships only the index of
drawing names, which is all a search needs, and each chosen drawing is pulled on
its own into `~/.educational-svg` and kept there. So installing this plugin
downloads under a megabyte of library rather than 940 MB of it, and the cache
outlives every reinstall.

`publish-educational-svg.js --resolve-root` reports where this run's drawings
live: a full local copy when `LESSON_EDUCATIONAL_SVG_ROOT` names one, otherwise
the fetching library. Each visual designer searches after its core design is
settled, previews the candidates the search brought over, and publishes only the
selected SVG. If no library is available, the optional drawing is replaced or
removed and the lesson continues.

Adding drawings means committing them to the library repository and rebuilding
the index here with `scripts/build-educational-svg-index.js`. Never copy the
library into this package: its files would enter this repository's history
permanently, and every install afterwards would download them whether or not
they were still present.

[svg-repo]: https://github.com/DynoDS/educational-svg

## What's in this repo

```
.
├── agents/
│   └── lesson-designer.md            Pedagogy agent — pure pedagogical decisions
├── references/
│   ├── preferences.md                Teacher's preferences (classroom norms, slide philosophy, pride lessons)
│   └── evidence-synthesis.md         Evidence base: Rosenshine, Sweller, Willingham, EEF, Lemov, etc.
├── HANDOFF-slide-designer.md         Handoff brief for whoever builds the slide-designer next
└── .claude-plugin/plugin.json
```

Example lesson outputs are not included in this snapshot; a representative regression set covering the five lesson structures is restored separately as part of the optimisation baseline.

## The lesson-designer in one paragraph

Takes year group + learning objective (plus any extra context the teacher provides). Decides the cognitive demand, picks a lesson structure (Skill-based / Content-based / Discovery / Dialogic / Task-Centred), designs the starter so it connects backwards to prior or prerequisite knowledge, selects 3–5 vocabulary words by activity test, identifies 1–3 sticky facts and places them contextually, sequences the teaching as either MT/OT/YT (skills) or Teach→Do→Teach→Do (content), handles 2–3 canonical misconceptions, decides whether an Apply slide is earned. It settles a compact decisions record first, then serialises the authoritative `lesson-design.json` contract plus `photo-requirements.json` for downstream resource designers.

## Design principles (shared across all agents)

1. **Pedagogy is the load-bearing decision.** Every later decision follows from it.
2. **Teach → Do → Teach → Do.** Children process information before the next piece arrives. Never two teach beats back-to-back.
3. **Slides carry what children do, see, or reference.** Everything else is in speaker notes.
4. **The teacher's voice is the lesson.** Slides support the teacher; they don't replace the teacher.
5. **Apply slides are earned, not automatic.**

## Installing as a plugin

This package supports Claude Code and Codex.

- **Claude Code:** use the existing `.claude-plugin/plugin.json` manifest. Claude supplies the installed package location at the host boundary; the skill verifies it and passes the resulting literal `PLUGIN_ROOT` into the lesson pipeline.
- **Codex:** use `.codex-plugin/plugin.json`. Codex installs the package and activates its `skills/`; the skill derives the package root from its activated `SKILL.md` path, verifies it, and passes the resulting literal `PLUGIN_ROOT` into the same lesson pipeline.

Normal lesson runs read packaged files from `PLUGIN_ROOT` and write lesson files only to `WORKING_DIR` and `OUTPUT_DIR`.

Workflows that edit plugin source also require `LESSON_RESOURCES_SOURCE_ROOT`, set to the absolute writable `lesson-resources` directory inside the `teaching-plugins` checkout. The verified internal value is called `PLUGIN_SOURCE_ROOT`.

Repository-root `.codex/agents/` files are not required for package location or normal worker launches.

## Contributing

Changes to `lesson-designer.md` should be tested against the regression set covering the five lesson structures once restored, using the scoring standard defined in the optimisation plan — any regression in those outputs is a problem to fix before merging.
