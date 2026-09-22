# Teacher Voice regression suite

This directory is an evaluation harness only. It does not participate in the
Lesson V4 build, and it does not change the Teacher Voice guide, reviewer,
packet, model settings or production validators.

Its job is to let a proposed voice change be measured against recorded human
judgements, instead of being argued from one lesson that happened to read badly.

## Fixture separation

- `existing-10-input.json` is the frozen ten-case baseline. It contains only
  evaluator input.
- `existing-10-gold.json` contains the baseline labels and rationales.
- `calibration-input.json` contains real wording from the Year 4 PSHE and
  Victorian History lessons, including the former baseline controls moved out
  of the frozen set. It contains only evaluator input.
- `calibration-gold.json` contains the human-labelled calibration decisions
  and short rationales.
- `held-out-input.json` is an empty structure for the next fresh lesson. There
  is no held-out gold file: a human labels those cases separately, and a set
  stops being held out the moment it is used to tune anything.

The input and gold files share case IDs. Gold is never read from an input
case, and the scorer rejects input files that contain `expected`, `rationale`,
or prediction fields. `surface_type` is optional on an input case: the hand-built
calibration sets carry it so the report can break accuracy down by surface, and a
fixture built from a real lesson does not, because production hands the reviewer no
surface label. A case without it counts in the overall, catch and preservation
figures and in no per-surface figure.

## Building a fixture from a real lesson

Build it with `class_view_fixture.py`, never by reading fields out of a
`lesson-design.json` or `lesson.json` by hand:

```powershell
python class_view_fixture.py <lesson-design.json> held-out-input.json held
```

The builder calls `build_class_view` in `scripts/design-review-packet.py` and
parses the section that function prints, so a fixture carries exactly the
strings the production Design Reviewer reads, in lesson order, with the
packet's own string boundaries.

Three things about that matter enough to state plainly, because getting them
wrong produced three rounds of misleading results in September 2026:

- **A beat label is a heading, not a string.** The class view prints it as
  `### <label>`. The same wording may reach a slide as its title, but the
  reviewer is never asked to judge it as voice. A fixture must not contain it.
- **One authored string may run over several lines.** The packet prints it as
  several `> ` lines closed by a blank line, and the reviewer takes one
  decision on the whole thing. Splitting it on the line break invents cases
  that cannot exist, and a split human verdict on such a string cannot be
  delivered by the reviewer.
- **Production supplies no surface label.** The class view carries no field
  names and no "this is a Teach explanation" marker; the reviewer works out
  what it is reading. A fixture that adds one is testing a system that does not
  exist. `test_class_view_fixture.py` enforces this.

## Producing predictions

`sweep-runner.md` is the prompt that turns an input file into a predictions file.
Give it to a fresh agent with the input file path and an output path; it reads the
production voice-sweep instructions and the Teacher Voice guide, decides KEEP or
REPAIR for every case, and writes `{"predictions": [...]}`. It never sees a gold
file. Run it three times per candidate and score each run; the spread between runs
is part of the result.

## Scoring

Give the scorer a prediction file in this form:

```json
{
  "predictions": [
    {"id": "cal-pshe-teach-001", "decision": "REPAIR"}
  ]
}
```

Score both the frozen baseline and the calibration set together:

```powershell
python score.py `
  --cases existing-10-input.json `
  --cases calibration-input.json `
  --gold existing-10-gold.json `
  --gold calibration-gold.json `
  --predictions predictions.json `
  --format markdown
```

The report includes overall accuracy, catch rate (REPAIR cases caught),
preservation rate (KEEP cases left alone), and accuracy for each of:

- Teach explanation
- Speaker note
- Success criteria
- Sticky knowledge
- Question
- Model answer
- Scenario (used by the frozen baseline)

An absent surface is reported as `n/a`, not as zero. This prevents a partially
populated future suite from looking like a real surface regression.

## Labelling rule

`KEEP` means the wording can ship as written for its surface. `REPAIR` means
the wording has a material voice or child-access problem that merits a bounded
wording repair. The suite is deliberately not a repair counter: a genuine
KEEP remains a useful control even when a nearby sentence needs repair.

## Reading a result

Run any candidate three times before believing it. On the calibration set,
production itself has scored 27/32 and 28/32 on separate runs at the same
settings, with catch rate moving between 9/12 and 12/12. A one-run difference
of a case or two is inside that spread and means nothing.

Judge a candidate on catch rate and preservation rate together. A change that
lifts catch rate by repairing more of everything has not improved the reviewer,
it has made it noisier, and the preservation rate is what shows that.

## Tests

```powershell
python -m pytest
```

`test_score.py` covers the scorer and the fixture separation rules.
`test_class_view_fixture.py` covers the fixture builder against the production
packet, using a small synthetic lesson design defined in the test, because
lesson working folders are not tracked in this repository.

## Status, September 2026

Production Teacher Voice behaviour is deliberately unchanged. A run of
experiments in September 2026 tried an added Teach-explanation rule, a
clarification to guide section 3, visible surface markers, and deterministic
internal routing to guide sections. Measured on production-path strings over
repeated runs, none improved agreement with recorded human judgements without
costing preservation or stability, so none was adopted.

The harness is what survived, and it is the point: the next proposed voice
change can be measured here first.

22 September 2026, first measured candidate through `sweep-runner.md`: a
calibrated Teach-explanation pair added to guide section 16 (a route that walks
beside three flat facts). Three runs each, calibration set only.

| | Overall | Catch | Preservation |
| --- | --- | --- | --- |
| Baseline (guide unchanged) | 81.2 / 81.2 / 78.1 | 58.3 / 66.7 / 58.3 | 95.0 / 90.0 / 90.0 |
| Candidate (pair added) | 81.2 / 75.0 / 78.1 | 58.3 / 50.0 / 58.3 | 95.0 / 90.0 / 90.0 |

No gain on catch, one run lower; the pair was not adopted. The same six runs
missed the same speaker-note cases every time (speaker-note accuracy 25 to 50%),
which is where the next candidate should aim. `held-out-input.json` now carries
the 112 strings of the Week 4 History and Science lessons for labelling.
