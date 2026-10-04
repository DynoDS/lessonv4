"""The playbook release (10A), step 4: the skill (change plan section 1,
decision 6; section 2, settled items a, d, e and j).

Decision 6 (his "y"): the skill's description names feedback on a lesson it
already made, and its opening sends that feedback to the edit-in-place guide
instead of a new run. Settled item j: the saving step's last two edge cases
join the skill's opening, which is read at the start of the run rather than at
its end (U04 beside A02, A06 folded into A05 keeping both its clauses).
Settled item a: the wall builder that no longer runs, the package's old name,
and "in place of an audit marker". Settled items d and e: three dated stories
and the note about the slice list leave, their reasons staying."""
import re

from _patch import SK, read, replace_once

# Decision 6: the host is told the skill also takes feedback on a built lesson.
replace_once(SK, """  resources, or produce a lesson pack.
""", """  resources, or produce a lesson pack. Also use it when the teacher gives feedback
  on a lesson it already made ("the answer on slide 6 is wrong", "rename the
  character to Maya"), to edit that lesson in place.
""")

# Settled item j (U04): the host does not silently repair the designer's output.
replace_once(SK, """agents; deterministic validation, rendering and file operations belong to the
bundled command helpers.
""", """agents; deterministic validation, rendering and file operations belong to the
bundled command helpers. Ambiguous or incomplete Lesson Designer output is not
silently repaired by the host.

When the teacher's message is feedback on a lesson this skill already built, not
a new brief, do not start a new run: resolve the package root as below, then
read `[PLUGIN_ROOT]/references/revising-in-place.md` and edit that lesson in
place.
""")

# Settled item a (A04; the reviewer list's settled item 5): no wall builder runs
# and no stage judges a built resource.
replace_once(SK, """2. **Rendering** — named semantic resource designers write checked
   specifications; deterministic commands build the direct fixed resources;
   the retained Working Wall builder performs its required physical-output
   judgement.""", """2. **Rendering** — named semantic resource designers write checked
   specifications; deterministic commands build the resources from them.""")

# Settled item j (A06 into A05, keeping both its clauses).
replace_once(SK, """The resource-design agents never make pedagogical decisions. They read the
approved pedagogical contract and specify their own resource. Validated canonical
files and picture evidence carry continuity. Conversation history does not.""",
             """The resource-design agents never make pedagogical decisions. They read the
approved pedagogical contract, the lesson design, which remains the single
pedagogical source of truth, and specify their own resource. Validated canonical
files and picture evidence carry continuity; conversation history and scheduler
state do not.""")

# Settled item d (E05): the dated story leaves; the reason stays.
replace_once(SK, """an unattended or scheduled run has nobody to type one (a real run stalled after
each of its first three workers, 13 September 2026).""",
             """an unattended or scheduled run has nobody to type one.""")

# Settled item d (C13): the dated story leaves; "the newest record wins" stays.
replace_once(SK, """built at the same time; without it the newest record wins, and on 22 September
2026 a history report printed a maths lesson's timings. Run it twice""",
             """built at the same time; without it the newest record wins. Run it twice""")

# Settled item a (C16): the report check refuses the section without an audit
# marker, and `audit --host claude` prints one.
replace_once(SK, """worker onto your own model without saying so. Put the printed
`WORKER_LAUNCH_HOST_NATIVE` lines in the report's `## Worker launches` section in
place of an audit marker.""", """worker onto your own model without saying so. Put the printed
`WORKER_LAUNCH_HOST_NATIVE` lines in the report's `## Worker launches` section
beside the `WORKER_LAUNCH_AUDIT_UNAVAILABLE` marker that `audit --host claude`
prints.""")

# Settled item a (C21): the run launches no wall builder.
replace_once(SK, """- Working Wall Builder keeps its existing short structured Output Report;
""", "")

# Settled item a (B02, B03): the plugin's name. The settings folder keeps its
# old name in code; only these words change.
replace_once(SK, "`PLUGIN_ROOT` is the actual `lesson-resources` package directory used by this",
             "`PLUGIN_ROOT` is the actual `lesson-v4` package directory used by this")
replace_once(SK, "- **Another host:** use the absolute installed `lesson-resources` package",
             "- **Another host:** use the absolute installed `lesson-v4` package")

# Settled item d (B07): the dated story leaves; the reason stays.
replace_once(SK, """run unelevated: an interpreter found with extra access can be one no worker can
start, which is how Codex runs spent their first command in most workers
rediscovering Python (13 September 2026).""", """run unelevated: an interpreter found with extra access can be one no worker can
start.""")

# Settled item d (B18): the undated story leaves (copied to the log from the
# commit that wrote the rule); B16 carries the reason.
replace_once(SK, """Stopping branches to avoid "mixing versions" is the failure, not the caution: a
real run lost its working wall, stick-in sheets and filing to a patch release
that changed none of them. Stop only when""", """Stopping branches to avoid "mixing versions" is the failure, not the caution.
Stop only when""")

# Settled item e (A11): the note about why the slice list went shortens to its
# reason; the two bullets stay.
replace_once(SK, """The order of work belongs to those blocks rather than to a list here, because a
list here can only key each slice to an event ("before the first Worksheet
Designer job", "before the first repair round") that you cannot recognise until
you are holding the slice that names it. Two failures come from exactly that
gap, so treat both as things NEXT tells you and a linear read of the playbook
will not:""", """The order of work belongs to those blocks, not to a list here. Two failures come
from reading the slices as a list, so treat both as things NEXT tells you and a
linear read of the playbook will not:""")

# The description is what a host reads to decide whether to start the skill;
# keep it well under the tightest limit a host is known to set (1,024).
front = read(SK).split("---")[1]
description = re.search(r"description: >\s*\n(.*?)\n[a-z_]+:|description: >\s*\n(.*)", front, re.S)
text = " ".join((description.group(1) or description.group(2)).split())
assert len(text) < 1024, len(text)
print(f"description: {len(text)} characters")
print("SKILL_OK")
