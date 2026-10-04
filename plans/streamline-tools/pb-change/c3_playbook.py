"""The playbook release (10A), step 3: every edit to the playbook, in file order
(change plan sections 1 and 2, his answers to the plan's questions 1 to 3, and
the words the worksheets release left for this release).

Each replacement re-wraps only its own sentence, so the line-break-sensitive
pins in the paragraphs it edits keep their breaks: «run the Slide\\nDecorator
over that flagged deck», «Only the deterministic\\nfinalisation waits for every
branch», «that rerun is the\\nrepair's confirmation» and «Record the round in the
run's\\nfriction file». A paragraph this script rewrites loses its em and en
dashes; moved or untouched paragraphs are not re-punctuated.

Run with `c2_runtime.py`: the Track C heading goes here and its cut points move
there."""
from _patch import PB, replace_once


def edit(old: str, new: str) -> None:
    replace_once(PB, old, new)


# Settled item i: the opening paragraphs no run reads leave. The title stays.
edit("""# Make Lesson — Lightweight runtime playbook

This is the active runtime playbook. It deliberately avoids a generic job
controller. The host launches named workers directly, waits through the host's
normal worker lifecycle, and runs deterministic checks at meaningful file
boundaries. Do not create orchestration job specs, completion events, worker
snapshots, transition receipts, scheduler audits or latency reports. The one
timing record a run keeps is the `WORKER_TIMELINE:` block that
`worker-launch.py audit` prints from the host's own log: it costs the
orchestrator nothing to produce, it is copied once into the run report, and
it is what says whether a change made runs faster.

## Lightweight execution protocol""", """# Make Lesson — Lightweight runtime playbook

## Lightweight execution protocol""")

# Settled item i: D01's one "do not create" sentence moves, word for word, to the
# end of D08 in the execution slice, where runs read it.
edit("""teacher input belongs to this working directory. Do not manufacture a second
queue or receipt system.""", """teacher input belongs to this working directory. Do not manufacture a second
queue or receipt system. Do not create orchestration job specs, completion
events, worker snapshots, transition receipts, scheduler audits or latency
reports.""")

# Settled item h: G07 folds into the skill's F03 and F07, which carry more
# ("obtained before the first worker starts", "in reply order") and are read
# immediately before this slice. G06 stays whole.
edit("""fault, because nothing later in the run can persist its outputs either.
Store clarification replies separately as
`teacher-clarifications/001.txt`, `002.txt`, and so on. Put genuinely useful
host inference in `orchestrator-context.md`; it never overrides teacher text.""",
     """fault, because nothing later in the run can persist its outputs either.""")

# Settled item j: U01 moves beside F10, where the brief is read, with the stale
# "Phase-0 routing" corrected.
edit("""stop, unless the message also carries a usable year and objective - then design
from that and flag the file.
""", """stop, unless the message also carries a usable year and objective - then design
from that and flag the file.

A lesson-plan-only request still preserves that file separately after reading
only enough to resolve the routing above.
""")

# Settled item a (G15): the wrapper archives the wall's files too; no wall
# builder runs.
edit("""For direct fixed slides, worksheets and stick-in sheets, let
`run-fixed-resource.py` own output-family collision archiving. The retained wall
builder owns its wall-family archive.""", """`run-fixed-resource.py` owns output-family collision archiving for the slides,
worksheets, working wall and stick-in sheets.""")

# Settled item g: I09 (a review after the Phase 2 freeze) moves from before I10
# to after I11, so I10's "When it fails" reads straight after I08's validator
# run. No word changes.
I09 = """For an owner repair after the verified Phase 2 freeze, prepare a fresh review
packet. Its validator checks live references without the initial-only rule
that every frozen picture must still be cited. Preserve exhausted pictures and
their receipts as history; never add a false use or restart their call budget.
In the direct-review fallback for this later phase, omit
`--initial-photo-namespace` and pass that exact command to the reviewer.

"""
edit(I09 + "When it fails, the fault is in the review pass's own corrections",
     "When it fails, the fault is in the review pass's own corrections")
edit("For `APPROVED`, continue. For `REDESIGN REQUIRED`, give Lesson Designer the",
     I09 + "For `APPROVED`, continue. For `REDESIGN REQUIRED`, give Lesson Designer the")

# Decision 4 (his "i dont read"): one log step, at the end, for engine faults
# only. The review's log sentence goes; the routing sentence stays.
edit("""Append genuine corrections and remaining teacher choices to the shared build
review log when `PLUGIN_SOURCE_ROOT` is available. Read routing values directly
from the approved `lesson-design.json`, never from prose.""",
     """Read routing values directly from the approved `lesson-design.json`, never from
prose.""")

# Settled item a (I15): the skill's own audit command, with the host and the
# working folder.
edit("""With the design approved, run
`"[PYTHON]" "[PLUGIN_ROOT]/scripts/worker-launch.py" audit --host codex` and read
the result.""", """With the design approved, run
`"[PYTHON]" "[PLUGIN_ROOT]/scripts/worker-launch.py" audit --host [codex|claude] --working-dir "[WORKING_DIR]"`
and read the result.""")

# Settled item d (J12): the geography story leaves for the log; its reason stays.
edit("""claim and nothing can check it: a geography run wrote exactly that for two maps,
froze a contract holding neither, and the deck filled both holes with the
nearest live map helper - coastlines drawn from chosen coordinates, on a lesson
about where a real forest is. When""", """claim and nothing can check it: a contract frozen without the picture leaves the
deck to fill the hole with the nearest live helper, drawn from chosen
coordinates rather than the real place. When""")

# Settled item a (J16): `HELPER_GAP:` is named once, in "Close the check".
edit("""Record the decision as `gap` only when neither route can run, and carry the
matching `SLIDE_HELPER_GAP` or `WORKSHEET_HELPER_GAP` into the run report. Do
not silently replace a missing visual with an unfaithful picture, an approximate
emoji or generic decoration.""", """Record the decision as `gap` only when neither route can run. Do not silently
replace a missing visual with an unfaithful picture, an approximate emoji or
generic decoration.""")

# Settled item e (J19): the history leaves; the rule stays.
edit("""Run it whatever the decisions say. The command used to sit only in the helper
route, which is read only on a `build`, so the ordinary run - all `covered` and
`substitute` - never ran it, and the requirement stated here held nothing.""",
     """Run it whatever the decisions say.""")

# Settled item e (K01): "now" goes.
edit("Each designer now runs this same check at its own gate",
     "Each designer runs this same check at its own gate")

# Settled item a (K08): the wall and stick-in designers always start the moment
# `lesson.json` passes.
edit("""Working Wall and stick-in
design wait for `lesson.json` only when their prompts require it.""", """Working Wall and stick-in
design start the moment `lesson.json` passes (Track A).""")

# Settled item d (K10): the geography story leaves; the first sentence stays.
edit("""designer - and each one frees a whole branch. A geography run left five sourced
photographs unpublished for fourteen minutes and adaptation's contract unbuilt
for twelve, then ran both in seconds once an unrelated Slide Designer returned.
The worksheet branch waits on that contract and finished last, so the package
landed twelve minutes late on a fifty-seven minute run.""",
     """designer - and each one frees a whole branch.""")

# Settled item a (L03): the launch requires four markers.
edit("Wait for both files and require both markers.",
     "Wait for both files and require all four markers.")

# Settled item a (Q09, Q14): one name for the flagged slides, carried in the
# decorator's launch.
edit("""PICTURE_STAGE: [the resolved Phase 2 state line, verbatim]

OWNED_OUTPUTS:
- [WORKING_DIR]/lesson.json  (picture and decoration fields only)""",
     """PICTURE_STAGE: [the resolved Phase 2 state line, verbatim]
[FLAGGED_SLIDES: the numbers after `FIXED_RESOURCE_FLAGGED slides:`, on a flagged deck]

OWNED_OUTPUTS:
- [WORKING_DIR]/lesson.json  (picture and decoration fields only)""")

# Settled item a (L07): the report check also requires the declined line.
edit("""`OPTIONAL_PICTURE_SHAPE` and `OPTIONAL_PICTURE_TOTALS` lines into the run
report.""", """`OPTIONAL_PICTURE_SHAPE`, `OPTIONAL_PICTURE_TOTALS` and any
`OPTIONAL_PICTURE_DECLINED:` lines into the run report.""")

# Settled item d (M08): the dated story leaves; the sentence before it is the
# reason.
edit("""otherwise close it silently by pointing the reference at a surviving picture.
A deck shipped twelve of sixteen slides bare that way on 21 September 2026.""",
     """otherwise close it silently by pointing the reference at a surviving picture.""")

# Settled item e (L14): the first sentence stays (three tests read it) and the
# last; the history between them leaves.
edit("""The Slide Decorator remains the earlier optional-picture stage. It runs the optional drawing pass the
Slide Designer used to run last, at the same point and over the same private
preview, in a worker of its own so the wall and stick-in branches need not
wait for it. It looks at nothing after the build and judges no photograph.""",
     """The Slide Decorator remains the earlier optional-picture stage. It looks at
nothing after the build and judges no photograph.""")

# Settled item l: for his own supplied worksheet the adaptation designer still
# runs, in the lesson designer's own words.
edit("""- teacher-provided expected worksheet: consider adaptation but do not generate a
  second expected sheet;""", """- teacher-provided expected worksheet: run Adaptation Designer when available;
  it may find no Below or Greater Depth sheet is needed, and never makes a
  second expected sheet;""")

# Settled item e (N07): "can no longer be" becomes "is never".
edit("""so a zero can no
longer be a wiring mistake""", """so a zero is
never a wiring mistake""")

# Settled item d (M09): the measured story leaves; the reason stays.
edit("""Waiting
for that answer before searching put a four to nine minute picture search on
the end of the worksheet chain, where it was the last thing the run did; sourcing
now, in parallel, takes it off the end.""", """Waiting
for that answer before searching puts the picture search on the end of the
worksheet chain; sourcing now, in parallel, takes it off the end.""")

# Settled item e (M12): the maintainer clause goes.
edit("""which then sources whatever the sheet promotes, exactly
as before this wave existed.""", """which then sources whatever the sheet promotes.""")

# Settled item b: his own worksheet is not handed to the sheet designer.
edit("""[ADAPTATION_DESIGN when accepted]
[TEACHER_WORKSHEET_INPUT when supplied]
""", """[ADAPTATION_DESIGN when accepted]
""")

# Settled item a (O01): the scaffold track, never built, goes with its heading.
edit("""### Track C — Scaffold (scaffold-designer → scaffold-builder, runs in parallel with Track A and Track B)

This branch remains unavailable while its agents are marked Planned. Do not
invent it. Mention the omission only when the approved design requested one.

""", "")

# Settled item e (O04): the misplaced history goes.
edit("""correspondingly cautious. That is what replaced two complete
reference files and a hunt through the lesson. Name""", """correspondingly cautious. Name""")

# Settled item a (O06): real line continuations, as every other command block.
edit('''check \\n  --plugin-root "[PLUGIN_ROOT]" \\n  --working-dir "[WORKING_DIR]" \\n  --working-wall "[WORKING_DIR]/working-wall.json" \\n  --lesson "[WORKING_DIR]/lesson.json"''',
     '''check \\
  --plugin-root "[PLUGIN_ROOT]" \\
  --working-dir "[WORKING_DIR]" \\
  --working-wall "[WORKING_DIR]/working-wall.json" \\
  --lesson "[WORKING_DIR]/lesson.json"''')

# Settled item a (O08; the reviewer list's settled item 5): the final resource
# review was retired.
edit("""cards laid out, and `working-wall-designer` judges the finished sheet at FINAL
RESOURCE REVIEW.""", """cards laid out.""")

# Settled item m: the stick-in moment left off for want of a visual needs a
# channel back, which the launch now asks for.
edit("""no write-on moment gets an empty `items` list with a short rationale. It owns
only `stick-in-sheets.json`.""", """no write-on moment gets an empty `items` list with a short rationale. It owns
only `stick-in-sheets.json`, and returns each moment it left off for want of a
visual on a `Left off:` line.""")

# Settled item k, with the worksheets release's words: a Below or Greater Depth
# sheet's problem goes back to the adaptation designer, its author; a sheet
# with a `returned` entry is redesigned there, and the Worksheet Designer puts
# the redesign in. "Re-review a changed lesson design" narrows "re-review the
# changed pedagogy", because the reviewer never sees `adaptation.md`.
edit("""reported material content gap is finished.** Read the returned adaptation and
resource notes as well as the terminal marker. Missing support or a wrong
answer remains a content gap when recorded in notes; a note naming another
owner does not resolve it. Send that bounded decision to its existing owner,
validate and re-review the changed pedagogy, then resume only the affected
resource.""", """reported material content gap is finished.** Read the returned adaptation and
resource notes, and each `returned` entry in `worksheet.json`, as well as the
terminal marker. Missing support or a wrong
answer remains a content gap when recorded in notes; a note naming another
owner does not resolve it. Send that bounded decision to its existing owner (an
Expected sheet's to the Lesson Designer, a Below or Greater Depth sheet's to the
Adaptation Designer, its author, which redesigns a returned sheet without the
picture a `picture` entry names), validate, re-review a changed lesson design,
then resume only the affected resource: the Worksheet Designer puts a redesign
in, taking off its entry and note, and the sheets rebuild (a
`RETURN_RECORD_LEFT:` line says one was left: an accepted minor issue).""")

# Settled item a (P04): no role prints `SLIDE_CONTENT_GAP`; the slide repair
# names the decision the Lesson Designer needs. The worksheets release's words:
# the wave takes an Expected sheet's gap; a Below or Greater Depth sheet's goes
# to the Adaptation Designer.
edit("""**The content-gap picture wave.** `SLIDE_CONTENT_GAP` or
`WORKSHEET_CONTENT_GAP` does not end the resource.""", """**The content-gap picture wave.** An Expected sheet's `WORKSHEET_CONTENT_GAP`,
or a slide repair that leaves a reference unrepaired and names the decision the
Lesson Designer needs, does not end the resource.""")

# Settled item a (P05): a late need, so the run ceiling.
edit("that filename, keep the picture cap.", "that filename, within the run ceiling of 24.")

# Settled item d (P06): the refused deck's clause leaves; the reason stays.
edit("""and re-points the Do beats is a new lesson, and the one this pipeline delivered
without a second review was the one the teacher refused to teach. The review""",
     """and re-points the Do beats is a new lesson. The review""")

# Settled item a (P07, reversed): the compiler compiles exactly the filenames it
# is given.
edit("""mechanics over that snapshot, naming already-terminal filenames so nothing
finished reopens,""", """mechanics over that snapshot, naming only the revision's new filenames so
nothing finished reopens,""")

# Decision 1 (his "y", Part D): a change to what children read goes to the full
# creation role. The "when present, otherwise" fallback is kept by each line of
# the owner list, word for word.
edit("""Use the compact focused-repair role for the named owner when present, otherwise
its full creation role. Give it""", """Use the compact focused-repair role for the named owner, and its full creation
role when the change is to what children read: the compact roles may not author
or drop it. Give it""")

# Decision 1 with his answer to the plan's question 1 ("yes"): the full role's
# repair is still checked for anything lost, in the scope check's second mode.
edit("""Repair scope: REPAIR_SCOPE_OK
```
""", """Repair scope: REPAIR_SCOPE_OK
```

A full creation role's prompt adds: copy the file to `[file].before-repair`
first, and before returning run `check-repair-scope.py --new-words --before
"[file].before-repair" --after "[file]"` for the scope line: it passes new words
for children and still fails a lost question, table row or place to write.
""")

# Settled item d (Q08): the Maths 15 story leaves; the rule's own sentence stays.
edit("""gets its own round. Maths 15 (22 September 2026) repaired Expected until it fit,
the untouched Greater Depth sheet then failed for the first time, and reading
that as a second round cost the class its whole pack.""", """gets its own round.""")

# Settled item d (Q09): his ruling keeps his words without its date.
edit("""teacher (Daniel, 16 September 2026: "flag the slides and deliver it").""",
     """teacher (the teacher's ruling: "flag the slides and deliver it").""")

# Settled item a (Q09, Q14): one name, carried in the launch; the run's own
# optional-picture check refuses `slide-flagged` without the numbers.
edit("""Decorator over that flagged deck, passing the build's `SLIDES_FLAGGED:` numbers
as `--flagged-slides`.""", """Decorator over that flagged deck, passing the numbers the build's
`FIXED_RESOURCE_FLAGGED slides:` line names as `FLAGGED_SLIDES:`, and as
`--flagged-slides` to your own optional-picture check.""")

# Settled item f, with the worksheets release's words: a Below or Greater Depth
# sheet the build cannot make now arrives as `SHEET_STANDS_IN:`, the last resort
# is reached for any of its faults, and only an Expected sheet the page cannot
# hold (and then any copy of it) is omitted; a pack short a sheet is partial.
edit("""**A pack the round did not clear still ships too**, for the same reason. When a
sheet still returns `SHEET_DOES_NOT_FIT` after its own round, rerun the
worksheet build with `--omit-unfittable`: the sheets that fit are built, the key
covers those sheets, and each omitted sheet is named on a `SHEET_OMITTED:` line
with the measurement that refused it. Carry that into the report as a teacher
flag naming the missing tier, and list the pack as delivered. The flag rescues a
too-small page and nothing else: any other fault still refuses the build, and
the last sheet standing is never omitted.""", """**A pack the round did not clear still ships too**, for the same reason. When a
Below or Greater Depth sheet still fails after its own round, or an Expected
sheet still returns `SHEET_DOES_NOT_FIT`, rerun the worksheet build with
`--omit-unfittable`. A Below or Greater Depth sheet the build still cannot make
gets the Expected sheet and its answers in its place whenever the Expected sheet
passes, named on a `SHEET_STANDS_IN:` line with why. Only an Expected sheet the
page cannot hold, and then any copy of it, is omitted, named on a
`SHEET_OMITTED:` line with the measurement that refused it. Carry each line into
the report as a teacher flag naming the tier, and list the pack as delivered;
like a flagged deck, a pack short a sheet is `PARTIAL`. Any other fault on the
Expected sheet still refuses the build, and the last sheet standing is never
omitted.""")

# Settled item a (Q13), with the worksheets release's words: a Below or Greater
# Depth sheet's picture gap goes to its author, not to the lesson designer's
# wave.
edit("""A repair returning `SLIDE_CONTENT_GAP` or `WORKSHEET_CONTENT_GAP` because the
missing picture *was* the task's evidence has named the one fault only the
Lesson Designer can fix: it goes to the content-gap picture wave whenever it
surfaces, never to exclusion.""", """A repair returning `WORKSHEET_CONTENT_GAP` on an Expected sheet, or a slide repair
naming the decision the Lesson Designer needs, because the missing picture *was*
the task's evidence has named the one fault only the Lesson Designer can fix: it
goes to the content-gap picture wave whenever it surfaces, never to exclusion. A
Below or Greater Depth sheet's goes to the Adaptation Designer.""")

# Decision 4: the review's own corrections are not findings for the log.
edit("""that could not draw what the lesson needed, two rules that disagreed.""",
     """that could not draw what the lesson needed, two rules that disagreed. The
review's own corrections are not findings: they stay in `design-review.md`.""")

# Settled item a (S02): the wall's path comes from its build summary.
edit("""- delivered resources with exact paths from fixed build summaries or the wall
  builder, each path in backticks;""", """- delivered resources with exact paths from the fixed build summaries, each
  path in backticks;""")

# Settled item c: the walk-through stays with the run report.
edit("teacher reads to see where the lesson is going; it goes wherever the deck goes;",
     "teacher reads to see where the lesson is going; it stays with the run report;")

# Settled item a (S08): the audit names the host and the working folder.
edit("""  under `## Worker launches`, both from `worker-launch.py audit` run
  immediately beforehand and copied verbatim;""", """  under `## Worker launches`, both from `worker-launch.py audit --host
  [codex|claude] --working-dir "[WORKING_DIR]"` run immediately beforehand and
  copied verbatim;""")

# Settled item f, and settled item a (S13): the report's partial cases and the
# `Slides to check:` line, written where the run reads them; only the worksheet
# build prints `PAGE_FIT_UNVERIFIED`.
edit("""A package missing an earned output is `PARTIAL`; a fault that stopped a resource building or passing its
own check is `BLOCKED`; a wall the builder could not verify against its page contract, which
reaches the report as `PAGE_FIT_UNVERIFIED`, is `UNVERIFIED`.""", """A package missing an earned output, or delivering flagged slides or a pack
short a sheet, is `PARTIAL`: under `## Outcome` a `Slides to check:` line names
the slides, and each `SHEET_OMITTED:` line is copied. A fault that stopped a
resource building or passing its own check is `BLOCKED`; sheets printed with no
browser to check their page fit, which reach the report as
`PAGE_FIT_UNVERIFIED`, are `UNVERIFIED`.""")

# Settled item m, with the worksheets release's `SHEET_STANDS_IN:` flag: every
# flag reaches the flags list. The copies that send a flag here stay as pointers.
edit("""`None` when empty. It carries each flagged slide and its fault, the design reviewer's unresolved findings, any
declared cross-resource impact from a repair, every picture a designer was
uneasy about, and every `SETUP_NOTE:` the start-up check printed.""", """`None` when empty. It carries each flagged slide and its fault, the design reviewer's unresolved findings, each
sheet left out or stood in for and why, every `flagsForTeacher` entry, any
declared cross-resource impact from a repair, every picture a designer was
uneasy about, each `PICTURE_LOW_RESOLUTION:` picture, why the wall is empty (its
`rationaleNote`), each stick-in moment left off for want of a visual, and every
`SETUP_NOTE:` the start-up check printed.""")

# Settled item j: the saving step's edge cases move to the phases they govern
# (U01 to the setup slice above; U02 and U03 fold into N09; U04 and A06 go to the
# skill with A02 and A05). The heading goes.
edit("""
### Edge cases

- A lesson-plan-only request still preserves that file separately after reading
  only enough to resolve Phase-0 routing.
- A teacher worksheet is the Expected/base sheet; generate only genuinely
  needed adaptations around it.
- A generated worksheet is expected unless the teacher supplied one.
- Ambiguous or incomplete Lesson Designer output is not silently repaired by
  the host.

The lesson design remains the single pedagogical source of truth. Downstream
roles coordinate through validated files, not conversations or scheduler state.
""", "")
print("PLAYBOOK_OK")
