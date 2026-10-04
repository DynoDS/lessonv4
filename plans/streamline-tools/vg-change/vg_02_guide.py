"""The voice guide release, step 2: the voice guide itself (`teacher-voice.md`).

- Decision 1 (his 1, "yes"): the reading route sends a sentence stem or other
  support to §7, and reads §14 once, when the kind of lesson is settled.
- Settled item 1: the route's "most often missed" names all four kinds, each
  with its reason; the lesson designer's reason for definitions and scripts
  moves here nearly word for word (`vg_03_reaches.py` drops its copy). The three
  prompts that reached children leave for the log (`vg_01`); the reason stays.
- Decisions 9 and 10 turned round (his 4 and 5): "Humour wherever" and "humour
  is allowed in pshe" are recorded, undated, in §4's `When humour is optional`.
  Nothing else in §4 moves: "often works best without" for calculation steps,
  the sensitive-issue limits and the melons line stay (the read-back).
- Decision 11 (his 6): a class the lesson comes back to gets a name the first
  time, not always a class code, beside §6's examples, which stay.
- Settled item 8, out of date: §16H's staging note names both teacher lines;
  the em dash leaves §15's "avoid unless" list for a line of its own that says
  never; the Maintenance note moves to the harness read-me (`vg_04`), keeping
  "Treat this guide as the default runtime specification." in the guide.
- Stories: C13 keeps one plain telling as its example; C05's and D15's dates go,
  his words stay.
- His speaker-notes answer (the rest-of-preferences list's decision 3, his 1),
  with his week 3 science lesson as the calibration he pointed to: §2 gains
  his words and five short lines from that lesson, quoted exactly (the fifth,
  a phrase repeated for rhythm, by his answer of 26 September, `vg_00`), and
  §3 says its warning stands on the written board and page. The deck
  itself is not copied."""
from _patch import TV, assert_absent, assert_present, read, replace_once

# Purpose: the one sentence of the Maintenance note every reader needs.
replace_once(
    TV,
    "This is a **runtime voice guide**, not the calibration evidence archive. Apply these rules as defaults,",
    "This is a **runtime voice guide**, not the calibration evidence archive. Treat this guide as the default "
    "runtime specification. Apply these rules as defaults,",
)

# Decision 1: §7 and §14 are routed.
replace_once(
    TV,
    "Read §4 once when considering the whole lesson at completion, not for each string. Read the numbered section "
    "for the kind of thing you are writing at the moment you write it: **a question or an instruction a child acts "
    "on opens §6**, a definition or explanation §5, a model answer §8,",
    "Read §4 once when considering the whole lesson at completion, not for each string, and §14 once, when the kind "
    "of lesson is settled. Read the numbered section for the kind of thing you are writing at the moment you write "
    "it: **a question or an instruction a child acts on opens §6**, a definition or explanation §5, a sentence stem or "
    "other support §7, a model answer §8,",
)

# Settled item 1, the fold's own condition: the lesson designer's shorter copy
# sent "a comparison or critique prompt" to §12 (whose heading is "Comparison
# and critique prompts"); the guide's route, which it now follows, keeps it.
replace_once(TV, "a comparison prompt §12, a practical lesson §13.",
             "a comparison or critique prompt §12, a practical lesson §13.")

# Settled item 1, and A11's story out (A12's reason stays word for word).
replace_once(
    TV,
    "**§6 and §12 are the two most often missed, and they are missed the same way:** the writer does not notice which "
    "kind of thing they are writing, so the section that owns it is never opened. Questions and instructions are the "
    "most common thing anyone here writes, and a comparison prompt arrives disguised as a heading. Three reached real "
    "children. `Choose a job.` on an appliances sheet, which a class answered `Fireman`, and `Write one question you "
    "would ask before making a stronger judgement.` on a Greater Depth diet sheet, both §6 (5 September 2026). `What "
    "do their reasons share?` on a Year 4 RE slide, where §12's own calibrated wording was already sitting in that "
    "same slide's teacher script (11 September 2026). Every one was written by an agent that had read each section "
    "it was routed to. Routing by the kind of string only works if you stop and name the kind.",
    "**§6 and §12 are two of the four most often missed, and they are missed the same way:** the writer does not "
    "notice which kind of thing they are writing, so the section that owns it is never opened. Questions and "
    "instructions are the most common thing anyone here writes, and a comparison prompt arrives disguised as a "
    "heading. Questions and comparison prompts missed this way have reached real children. Every one was written by "
    "an agent that had read each section it was routed to. Routing by the kind of string only works if you stop and "
    "name the kind. **Definitions and scripts are the other two**, because a definition feels like a structured field "
    "being filled and a script feels like notes rather than writing; both are words a child reads or hears, and both "
    "are where the register slips first.",
)

# C05: his words stay, the date goes.
replace_once(
    TV,
    "It doesn't sound warm. It doesn't sound human\" (14 September 2026). A clipped line is a label,",
    "It doesn't sound warm. It doesn't sound human\". A clipped line is a label,",
)

# His speaker-notes answer, calibrated on his week 3 science lesson.
replace_once(
    TV,
    "> Choose the materials that complete the circuit. For each one, say what it does. Then think - could we add "
    "another bulb and keep it bright?\n"
    "\n"
    "### Default relationship\n",
    "> Choose the materials that complete the circuit. For each one, say what it does. Then think - could we add "
    "another bulb and keep it bright?\n"
    "\n"
    "### As long as the idea needs, said to these children\n"
    "\n"
    "The teacher on his own speaker notes: \"it doesn't have to be short sentences\", and \"speaker notes are as long "
    "as the idea needs, of course, and they're also conversational, so it links them nicely. It's talking to "
    "children. It just needs to think how can I talk to children to get them to understand it.\" So a script's length, "
    "and the length of its sentences, come from the idea rather than from a target: ask how you would say this to "
    "these children so that they understand it, and write that.\n"
    "\n"
    "A science lesson he taught and thought went well (how a tooth decays) sounds like this:\n"
    "\n"
    "- **The length is the idea's.** One step of the chain took a few short sentences (`When those germs feed on that "
    "sugar, they make something. They make acid.`); the slide that built the whole idea out of what is in the "
    "children's own mouths ran to about a hundred and fifty words; the slide that sent them off to write said what to do "
    "and stopped.\n"
    "- **Each note picks up where the last one left off**, so the notes are one talk across the slides rather than a "
    "caption for each: `So there is a hole in the enamel now. Does the acid stop there? No. It keeps going.`\n"
    "- **It talks to the children about themselves**: `Run your tongue along your teeth, near the gum. That slightly "
    "furry feeling? That's the plaque, and that's where the germs sit.`\n"
    "- **It asks, and answers, so the class thinks along**: `What is it called? The pulp. And what did we say was in "
    "the pulp? Nerves.`\n"
    "- **A phrase repeated for rhythm is how speech builds** (the teacher: \"yes thats fine\"): `It eats away a tiny "
    "bit of enamel today, a tiny bit more tomorrow, a tiny bit more the day after that.` §3's warning against a "
    "repeated shape still holds on the written board and page.\n"
    "\n"
    "### Default relationship\n",
)

# His answer of 26 September (vg_00): the warning names the written board.
replace_once(
    TV,
    "Do not force variation for its own sake. The goal is **natural rhythm**, not a checklist of sentence types.\n",
    "Do not force variation for its own sake. The goal is **natural rhythm**, not a checklist of sentence types.\n"
    "\n"
    "A phrase repeated on purpose for rhythm is the one exception, and only in speech: in a speaker note it is how "
    "speech builds (`a tiny bit ... a tiny bit more`), and the teacher wants it there (§2). On the written board and "
    "page, the warning above stands.\n",
)

# C13: one plain telling stays as the example; the incident went to the log.
replace_once(
    TV,
    "A Year 4 RE slide printed `What do their reasons share?` while its own script said `Tell your partner what is "
    "the same and what is different`. The plain version was already written, by the same agent, on the same slide. "
    "The board got the clever one, and `share` means something different to a nine-year-old than it does to an adult.",
    "A Year 4 slide that prints `What do their reasons share?` while its own script says `Tell your partner what is the same "
    "and what is different` is the shape: the plain version is already written, by the same agent, on the same "
    "slide, and the board gets the clever one, where `share` means something different to a nine-year-old than it "
    "does to an adult.",
)

# D15: his words stay, the date goes.
replace_once(
    TV,
    "but has to be funny\" (12 September 2026). Both halves are instructions.",
    "but has to be funny\". Both halves are instructions.",
)

# Decisions 9 and 10, turned round: his words, undated.
replace_once(
    TV,
    "## When humour is optional\n\nOrdinary teaching content can include a small light moment if it fits naturally.\n",
    "## When humour is optional\n\nOrdinary teaching content can include a small light moment if it fits naturally, "
    "in every subject, maths and PSHE included: in the teacher's words, \"Humour wherever\" and \"humour is allowed "
    "in pshe\".\n",
)

# Decision 11: a class the lesson comes back to, named, not always a code.
replace_once(
    TV,
    "`Imagine a class that danced most days`, or `A class in Year 3 has a lot of dance lessons each week`, is "
    "somebody they can picture and put themselves beside.\n",
    "`Imagine a class that danced most days`, or `A class in Year 3 has a lot of dance lessons each week`, is "
    "somebody they can picture and put themselves beside. A class the lesson comes back to gets a name the first "
    "time, and not always a class code like `Class 4B` (`Oak Class`, `the class at Hilltop School`), and keeps it.\n",
)

# Settled item 8: the em dash is never, not "avoid unless".
replace_once(
    TV,
    "- making every slide follow the same sentence formula;\n"
    "- em dashes and en dashes in anything a child or parent reads: write a comma, brackets, a colon, a full stop or "
    "a spaced hyphen ( - ) instead (the full rule lives in Written Voice).\n",
    "- making every slide follow the same sentence formula;\n"
    "\n"
    "**Never use em dashes and en dashes** in anything a child or parent reads: write a comma, brackets, a colon, a "
    "full stop or a spaced hyphen ( - ) instead (the full rule lives in Written Voice).\n",
)

# Settled item 8: the staging note names both teacher lines.
replace_once(
    TV,
    "Every one of those is real and belongs in the teacher line above, not in the middle of a sentence the teacher is "
    "reading aloud to thirty children.",
    "Every one of those is real and belongs in a teacher line of its own (a caveat or a safeguarding note in the "
    "teacher information below the script, a staging line for a model finished live in `On the board:` above it), "
    "not in the middle of a sentence the teacher is reading aloud to thirty children.",
)

# The Maintenance note leaves §17, which the reviewer prints every review.
replace_once(
    TV,
    "\n---\n\n## Maintenance\n\nTreat this guide as the default runtime specification.\n\nDo **not** keep expanding it "
    "every time one sentence is corrected.\n\nOnly change the guide when real resource work reveals:\n- a repeated "
    "miss;\n- a genuinely new register;\n- a contradiction in the current guidance;\n- a preference that survives more "
    "than one context.\n\nKeep detailed calibration examples, rejected alternatives and testing history in the "
    "teacher's separate evidence document rather than adding them all here.\n",
    "",
)
assert read(TV).endswith("rhythm feel human rather than mechanically even?**\n"), read(TV)[-200:]

for gone in ("Fireman", "Three reached real children", "(14 September 2026)", "(12 September 2026)",
             "belongs in the teacher line above", "## Maintenance", "A Year 4 RE slide printed",
             "- em dashes and en dashes in anything"):
    assert_absent(TV, gone)
for kept in ("Every one was written by an agent that had read each section it was routed to. Routing by the kind "
             "of string only works if you stop and name the kind.",
             "Treat this guide as the default runtime specification.",
             "Priya's bought forty-seven melons. We won't ask why.",
             "Procedural content often works best without humour:",
             "never make the actual sensitive issue the joke;",
             "This tooth has lost a piece of enamel.",
             "em dashes and en dashes"):
    assert_present(TV, kept)
print("GUIDE_OK")
