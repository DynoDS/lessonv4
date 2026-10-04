"""The playbook release (10A), step 1: every sentence that leaves the run's
instructions is copied to the build log first, before any runtime text moves
(change plan section 7, and settled items d, e and i). Some incidents are
already in this log in other words; every sentence that leaves is kept here word
for word, in one "Stories kept here" block, with the three stories that were
never in the log (a patch release that cost a wall, a history report carrying a
maths lesson's timings, and the four to nine minute picture search) copied from
where they were written down. The stories that stay in their files as plain
examples are copied too, so the log holds each one.

The entry starts with only its heading and its stories; `c9_log_entry.py`
writes the rest above them. The heading carries no version number: the lead
numbers the release at merge."""
from _patch import CD, CS, ET, GAP, HR, LOG, PB, RIP, SK, append, assert_present, read

assert "(4.2.295)" in read(LOG)
HEADING = ("## 2026-09-26 - A repair that changes what children read goes to the full designer and is still "
           "checked for anything lost, feedback on a built lesson edits it in place and saves it again, the "
           "template editor asks before it pushes, every flag reaches the teacher, and the run's instructions "
           "lose what no run needed")
assert HEADING not in read(LOG)

# Stories and dated rulings that leave (section 7), word for word as they stand.
STORIES = [
    (SK, "It is found unelevated because the workers run unelevated: an interpreter found with extra access can be "
         "one no worker can start, which is how Codex runs spent their first command in most workers rediscovering "
         "Python (13 September 2026)."),
    (SK, "Stopping branches to avoid \"mixing versions\" is the failure, not the caution: a real run lost its "
         "working wall, stick-in sheets and filing to a patch release that changed none of them."),
    (SK, "The working directory picks this run's own record when another lesson is being built at the same time; "
         "without it the newest record wins, and on 22 September 2026 a history report printed a maths lesson's "
         "timings."),
    (SK, "ChatGPT Work's cloud does not: a turn that ends with a worker still running is where the run stops, "
         "because nothing starts the next turn, and an unattended or scheduled run has nobody to type one (a real "
         "run stalled after each of its first three workers, 13 September 2026)."),
    (PB, "A reason claiming the contract already covers it is a different claim and nothing can check it: a "
         "geography run wrote exactly that for two maps, froze a contract holding neither, and the deck filled both "
         "holes with the nearest live map helper - coastlines drawn from chosen coordinates, on a lesson about where "
         "a real forest is."),
    (PB, "A geography run left five sourced photographs unpublished for fourteen minutes and adaptation's contract "
         "unbuilt for twelve, then ran both in seconds once an unrelated Slide Designer returned. The worksheet "
         "branch waits on that contract and finished last, so the package landed twelve minutes late on a "
         "fifty-seven minute run."),
    (PB, "A deck shipped twelve of sixteen slides bare that way on 21 September 2026."),
    (PB, "Waiting for that answer before searching put a four to nine minute picture search on the end of the "
         "worksheet chain, where it was the last thing the run did; sourcing now, in parallel, takes it off the "
         "end."),
    (PB, "Re-run the design validator and photo-cap check, then run Phase 1.25 again over the revised files: a "
         "revision that removes a source, rewrites the model beat and re-points the Do beats is a new lesson, and "
         "the one this pipeline delivered without a second review was the one the teacher refused to teach."),
    (PB, "Maths 15 (22 September 2026) repaired Expected until it fit, the untouched Greater Depth sheet then "
         "failed for the first time, and reading that as a second round cost the class its whole pack."),
    (PB, "**A deck the round did not clear still ships**, its slides flagged for the teacher (Daniel, 16 September "
         "2026: \"flag the slides and deliver it\")."),
    (CD, "Reading it whole first truncated silently and cost a wasted blob (14 September 2026). A cut-off read can "
         "also look complete: on 13 September the middle of the RE deck came back as the words \"474280 bytes "
         "omitted\", was decoded and posted, and the teacher got a PowerPoint that would not open."),
    (CS, "OpenAI has three places a scheduled lesson could run. Only two can build one, because a lesson needs "
         "separate AI workers and only those two can start them (each proved on 13 September 2026):"),
    (CS, "Checked against the real private library on 20 September 2026: 404 without, 200 with."),
]

# Stories that stay where they are, as plain examples or as a reason (section 7),
# copied so the log holds each one.
KEPT = [
    (RIP, "That is how a \"decide who is right\" slide vanishes between versions when all the teacher asked for "
          "was a font change."),
    (GAP, "The slide-designer that wrote *\"(The teacher will write the digital time below the clock.)\"* into a "
          "child-facing question text was doing exactly this: improvising pedagogy because it read the brief as an "
          "unfillable demand it had to meet."),
    (GAP, "The case that taught this: a lesson wanted a blank world map for children to draw the lines of latitude "
          "onto, the designer knew the only *sourced* latitude image had the names already printed on it, and it "
          "dropped the picture and rendered a text list instead. A blank world map ships with the plugin and the "
          "`map` object draws it. The class lost the visual for the rest of the lesson, and the flag recorded a "
          "limitation that did not exist."),
    (ET, "terminal output truncates on long decks and that has caused missed changes."),
    (ET, "Past runs lost the teacher's edits by skimming the parse output and silently dropping shapes."),
    (ET, "**Why** (hard-earned): the autofit step measures each text frame assuming `margin: 0` and standard "
         "padding. Merging shape and text into one element makes PowerPoint reserve internal padding the autofit "
         "step can't predict, and on narrow boxes the mismatch overflows the border."),
]

# Text for whoever edits the plugin, and the playbook's opening paragraphs that
# no run read (settled items e and i), leaving the run's instructions.
NOTES = [
    (PB, "This is the active runtime playbook. It deliberately avoids a generic job controller. The host launches "
         "named workers directly, waits through the host's normal worker lifecycle, and runs deterministic checks "
         "at meaningful file boundaries."),
    (PB, "The one timing record a run keeps is the `WORKER_TIMELINE:` block that `worker-launch.py audit` prints "
         "from the host's own log: it costs the orchestrator nothing to produce, it is copied once into the run "
         "report, and it is what says whether a change made runs faster."),
    (PB, "The command used to sit only in the helper route, which is read only on a `build`, so the ordinary run - "
         "all `covered` and `substitute` - never ran it, and the requirement stated here held nothing."),
    (PB, "It runs the optional drawing pass the Slide Designer used to run last, at the same point and over the "
         "same private preview, in a worker of its own so the wall and stick-in branches need not wait for it."),
    (PB, "A compile or manifest failure degrades this wave only: the pictures wait for the supplemental wave "
         "below, which then sources whatever the sheet promotes, exactly as before this wave existed."),
    (PB, "The command refuses a file that is not the adaptation document, so a zero can no longer be a wiring "
         "mistake wearing the face of a lesson that needed none."),
    (PB, "That is what replaced two complete reference files and a hunt through the lesson."),
    (PB, "This branch remains unavailable while its agents are marked Planned. Do not invent it. Mention the "
         "omission only when the approved design requested one."),
    (SK, "The order of work belongs to those blocks rather than to a list here, because a list here can only key "
         "each slice to an event (\"before the first Worksheet Designer job\", \"before the first repair round\") "
         "that you cannot recognise until you are holding the slice that names it. Two failures come from exactly "
         "that gap, so treat both as things NEXT tells you and a linear read of the playbook will not:"),
    (HR, "There is no writable checkout to resolve, nothing to version, and nothing to commit or push. If a lesson "
         "is holding a helper open for any of those reasons, that is the old route and it no longer applies."),
    (HR, "Do not run a second copy from here: this route is read only on a `build`, and a check written where only "
         "some runs can see it is how the substitutes on an ordinary run went unchecked in the first place."),
]

for rel, sentence in STORIES + KEPT + NOTES:
    assert_present(rel, sentence)
S = [sentence for _rel, sentence in STORIES]
K = [sentence for _rel, sentence in KEPT]
N = [sentence for _rel, sentence in NOTES]

# The three stories the log never had, copied from where they were written down.
PATCH_RELEASE = ("A plugin update published mid-run replaced the verified package root and the orchestrator stopped "
                 "the surviving branches rather than mix versions, losing the wall, the stick-ins and the filing to "
                 "a patch that changed none of them.")
MIXED_TIMINGS = ("Maths 16, Maths 17 and History 5 print an identical worker timeline: same session file, same worker "
                 "names, same launch and return times to the second. History 4 and Science share a second identical "
                 "pair. Three lessons were built in one sitting, and each report copied the whole sitting's timeline "
                 "rather than its own workers.")
EARLY_WAVE = ("The Adaptation Designer names every picture its Below and Greater Depth sheets could want, and then the "
              "Worksheet Designer takes ten minutes or more to decide which of them the sheet keeps. Sourcing waited "
              "for that answer, which put a four to nine minute picture search on the very end of the worksheet "
              "chain, where in today's runs it was the last thing the run did.")

BLOCK = (
    "- **Stories kept here as they leave the runtime.** The skill, the playbook and three references told these "
    "incidents; most are already in this log in other words, and each sentence is kept here as it stood. The "
    "reason round each story stays in its file. The skill, on finding Python unelevated: \"" + S[0] + "\" On a root "
    "that disappears mid-run: \"" + S[1] + "\" This story was not in the log before; the commit that wrote the rule "
    "(`fc698ee4`) said: \"" + PATCH_RELEASE + "\" On the launch audit's working folder: \"" + S[2] + "\" Not in the "
    "log before either; the six-run plan's Part G recorded it: \"" + MIXED_TIMINGS + "\" On a host where a finished "
    "worker does not wake the run: \"" + S[3] + "\" The playbook, on a `substitute` claiming a picture: \"" + S[4]
    + "\" On releasing a returned branch at once: \"" + S[5] + "\" On an essential picture lost: \"" + S[6] + "\" On "
    "the early adaptation picture wave, whose measured reason stays without its minutes: \"" + S[7] + "\" That "
    "release (`1744b996`) has no entry in this log; its commit said: \"" + EARLY_WAVE + "\" On a content-gap "
    "revision's second review: \"" + S[8] + "\" On a fault the round uncovered: \"" + S[9] + "\" On a deck the round "
    "did not clear, whose ruling stays in his words without its date: \"" + S[10] + "\" The cloud delivery guide, "
    "on reading a file for a connector post: \"" + S[11] + "\" The setup guide, on where a scheduled lesson can run: "
    "\"" + S[12] + "\" and on a private drawings library: \"" + S[13] + "\"\n"
    "- **Stories that stay as plain examples, copied here.** The edit-in-place guide: \"" + K[0] + "\" The gap "
    "protocol: \"" + K[1] + "\" and \"" + K[2] + "\" The template editor, whose reasons stay: reading the parse "
    "report from a file, because \"" + K[3] + "\"; the audit table, because \"" + K[4] + "\"; and \"" + K[5] + "\"\n"
    "- **Notes for whoever edits the plugin, kept here as they leave the runtime.** The playbook's opening "
    "paragraphs, which no run read (their one \"Do not create\" sentence moves into the first slice): \"" + N[0]
    + "\" \"" + N[1] + "\" The helper check's closing step: \"" + N[2] + "\" The decorator's origin: \"" + N[3]
    + "\" The early wave's failure line, before its last clause went: \"" + N[4] + "\" The zero count, before \"can "
    "no longer be\" became \"is never\": \"" + N[5] + "\" The wall's packet: \"" + N[6] + "\" The scaffold track, "
    "which no agent ever ran: \"" + N[7] + "\" The skill's lazy loading, before it shortened to its reason: \"" + N[8]
    + "\" The helper route: \"" + N[9] + "\" and \"" + N[10] + "\"\n"
)

append(LOG, "\n" + HEADING + "\n\n" + BLOCK)
print("STORIES_FIRST_OK")
