# Trial protocol: frozen briefs, launch settings, budget and scoring

Frozen before any trial ran, on 15 September 2026, so that the briefs cannot be steered by the results.

## Runner and its limits

The plugin's production runner is Codex (`worker-launch.py` maps the role's `model: astra` to `gpt-6-astra` at `effort: medium` for the Lesson Designer and `high` for the Design Reviewer). That runner is not available in this Claude Code session, and the plan forbids launching cloud jobs for this work. Every trial below is therefore run by a Claude general-purpose subagent that is handed the real agent file, the real references and the real scripts of the tree under test, and told to follow the agent file as written. These are **Claude-run illustrative designs from the configured instructions, not output from the configured Lesson Designer**, and they are labelled that way wherever they appear. What they can show is whether the instructions move a capable model's decisions; what they cannot show is what gpt-6-astra at medium effort would do.

| Setting | Baseline | Candidate |
|---|---|---|
| Tree | `C:\Users\Daniel\Projects\lessonv4-baseline` at commit `38c6a07c` (4.2.212) | `C:\Users\Daniel\Projects\lessonv4-designer-quality` at the branch head named in the report |
| Agent file | `plugins/lesson-v4/agents/lesson-designer.md` of that tree | same |
| Model / effort | Claude subagent, default effort | same |
| Web access | none (design from the brief and the tree's references) | same |
| Scaffold and validator | that tree's own scripts | same |
| Repair limit | the agent file's own: three validator repair passes, then stop and hand back | same |
| Output kept | `design-decisions.md` and `lesson-design.json` exactly as first returned; no regeneration | same |

**Departure from this protocol, recorded after the fact.** A usage limit stopped five of the six first attempts before any produced a design, and the session's model changed at the reset. The maths baseline is the one design written by Claude Fable 5.1; the other five were relaunched and written by Claude Opus 5. The Vikings and sound pairs are therefore internally consistent and the maths pair is not. No design was regenerated for quality, and no completed design was replaced.

## Budget and stopping rule

Six generations: one baseline and one candidate design for each of the three briefs below. No brief is re-run to get a better answer. If a run fails its validator after three passes, its files are kept as returned and scored as they are; the failure is recorded. If a run errors before producing a walk-through, it is recorded as not produced and not replaced.

One blind comparison assignment over the three pairs, by a Claude subagent that sees the two walk-throughs and sequences of each pair with the labels removed (A/B, order randomised per pair) and the scoring questions below, and never sees the rationale columns. One blind review assignment over the fourteen fixed judgement cases, by a Claude subagent running the candidate reviewer's thinking checks against each case, scored against the predefined reasons.

The optional staging experiment (section 8 of the plan) needs an already available runner and the core checks to pass first; it is recorded as **not run** unless both hold.

## The briefs (all Year 4, 45 minutes, no supplied plan, no prior lesson files)

Held out: none of these objectives appears in the runtime references, the contrasts file or the fixed cases. The Tudor objective is deliberately absent.

**T1, history (unseen).** `To explain why the Vikings came to Britain.` Prior learning supplied: children know where Scandinavia and Britain are on a map, and that the Anglo-Saxons lived in Britain before the Vikings arrived. Class: a mixed Year 4, three children with reading below age. Teacher's one note: "I want them to understand there was more than one reason, and that raiding and settling are different."

**T2, science (unseen).** `To explain how sound travels from a source to our ears.` Prior learning supplied: children have made sounds with instruments and know that sounds are made when something vibrates. Teacher's one note: "They need to come away knowing the vibration travels through the air, not that the sound just goes."

**T3, maths (positive control).** `To multiply a two-digit number by a one-digit number using partitioning.` Prior learning supplied: children can multiply by 2, 3, 4, 5 and 8 fluently and can partition a two-digit number into tens and ones. Teacher's one note: "Standard My Turn, Our Turn, Your Turn; nothing fancy."

Reserved for a later independent review, not generated here: **T4, geography.** `To explain why some rivers flood.`

## Scoring questions (applied identically to baseline and candidate)

1. **Learning.** What worthwhile understanding is developed? Is the explanation adequate? Can a plausible misunderstanding pass the main task? (Name the misunderstanding tried and the answer it would give.)
2. **Teacher use.** Can the teacher follow the journey from the slides as written? Is essential meaning on the board without crowding? Do prompts and models sound like the teacher's voice guide?
3. **Pupil experience.** Does the substantial work arrive when the class is ready, and where in the sequence? Are reading, recording and transition costs realistic? Is any repetition purposeful?
4. **Materials and preservation.** Are the chosen resources ready to use and faithful? Are the objective, support, accuracy, subject thinking and the established conventions intact?

More criteria, vocabulary, sources, slides, harder words or longer writing count for nothing. A valid JSON file or a confident rationale counts for nothing. The comparison reports a preference per question with the evidence quoted from the design, and "no difference" is an allowed answer.

## Evidence levels

Every claim in the report is labelled as one of: mechanically checked; fresh outputs compared (Claude-run); teacher-read; classroom-tested. Only the first two are reachable in this task.
