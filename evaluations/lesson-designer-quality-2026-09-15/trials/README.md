# The six fresh designs

One design per brief per arm, as first returned. Nothing was regenerated to get a better answer, and no design was edited after its run.

| Folder | Brief | Tree | Validator |
|---|---|---|---|
| `T1-baseline` | Vikings (history, unseen) | `38c6a07c` | LESSON_DESIGN_OK |
| `T1-candidate` | Vikings | branch head | LESSON_DESIGN_OK |
| `T2-baseline` | Sound (science, unseen) | `38c6a07c` | LESSON_DESIGN_OK |
| `T2-candidate` | Sound | branch head | LESSON_DESIGN_OK |
| `T3-baseline` | Partitioning (maths, positive control) | `38c6a07c` | LESSON_DESIGN_OK |
| `T3-candidate` | Partitioning | branch head | LESSON_DESIGN_OK |

Every validator line above was re-run independently after the trials, against the validator of the arm's own tree.

Each folder holds the three canonical outputs (`design-decisions.md`, `lesson-design.json`, `photo-requirements.json`), the scaffold request, and the brief the designer was given.

**`interrupted-attempt/` folders.** A first round of these trials was cut off mid-run by a usage limit. Those attempts produced no complete design; where one had written a partial walk-through before it stopped, that file is kept here rather than deleted, so the record shows every attempt. The reference-text dumps those attempts had written to their working folders were removed: they are verbatim copies of files already in the repository and carry no evidence.

**Provenance.** These are Claude subagents following the configured Lesson Designer instructions of the tree named (the maths baseline under Claude Fable 5.1, the other five under Claude Opus 5, because a usage limit forced a relaunch and the session's model changed at the reset). They are not runs of the configured production designer (gpt-6-astra, effort medium), which was unavailable. See `../trial-protocol.md`.
