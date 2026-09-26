"""Release 7A (4.2.293), step 3: the starter.

A3 (SA decision 3, his "Yes"): a question about today opens instead of recall in
history, geography and science only in the two cases the pitch paragraph names
(the retrieval would be empty, or the brief says children already find the
surface easy), and it stays a question children think and talk about, never a
prediction or the task explained. The subject line in the prerequisite paragraph
and the subject bullet both carry it.

A9 (SA settled item 4, his "yes", on his 19 September ruling "It keeps doing
little titles for the starter. And I don't know why, because I don't want them
in any lesson. Just the starter heading that's underlined is enough."): the
catalogue stops inviting a `title` under "Starter". Only a `heading` the starter
deliberately carries prints there, which is what the builder has done since
4.2.256 (`starterPrompt`, held by `builder/test/starter-heading.test.js`). The
history sentence about the PSHE deck goes; it is in the log (2 September 2026).
The designer's starter label (E09) and `Starter - check` (D24) are unchanged.

A10 (SA-D13, D28, folded under A07): the two mixed-retrieval formats in the
activity list carry A07's conditions in its own words and point at Starters."""
from _patch import DOBEATS, PREF, TMPL, replace_once

A07 = ("when the teacher requests mixed retrieval or the wider sequence gives it a clear purpose and children "
       "have enough security to choose productively between methods or knowledge (`preferences.md` → Starters)")

replace_once(PREF,
             "History, Geography and Science usually retrieve prior content (a fact, a definition, a labelled diagram) or set up a question the lesson will answer.",
             "History, Geography and Science usually retrieve prior content (a fact, a definition, a labelled diagram); a question the lesson will answer opens instead only in the two cases above, when the retrieval would be empty or the brief says children already find the surface easy.")
replace_once(PREF,
             "- **History / Geography / Science** — retrieval of a prior fact, definition, or diagram; or a hook question the lesson will answer.",
             "- **History / Geography / Science** — retrieval of a prior fact, definition, or diagram; or, only when that retrieval would be empty or the brief says children already find the surface easy, a hook question the lesson will answer, which stays a question children think and talk about, never a prediction or the task explained.")

replace_once(TMPL,
             "It is how a class and a cold teacher find the beginning of the lesson, so it is not a slot to fill. Give the slide a `title` (or a `heading`) as normal and the builder puts it on a full-width line underneath the label, at slide-title size, where a question is actually readable - so `title: \"What do you remember about PSHE?\"` renders as **Starter** with the question below it and the starter's questions below that. Before this, a title in that slot replaced the word \"Starter\" and was shrunk to fit a four-inch label bar; a Year 4 PSHE deck opened on two lines of small blue print and no \"Starter\" anywhere (flagged by the user, 2 September 2026). A `title` of exactly \"Starter\" adds no second line.",
             "It is how a class and a cold teacher find the beginning of the lesson, so it is not a slot to fill. Only a `heading` the starter deliberately carries, a question or instruction of its own, prints under it: the builder puts it on a full-width line underneath the label, at slide-title size, where a question is actually readable - so `heading: \"What do you remember about PSHE?\"` renders as **Starter** with the question below it and the starter's questions below that. A `title` never prints there, because the teacher wants the underlined heading alone: \"Just the starter heading that's underlined is enough.\" A `heading` of exactly \"Starter\" adds no second line.")
replace_once(TMPL,
             "- `title` — the starter's own prompt, drawn under the fixed \"Starter\" heading in the left column. The heading itself is always \"Starter\" and is not a slot (§1.4).",
             "- `heading` - the starter's own prompt, when it deliberately carries one, drawn under the fixed \"Starter\" heading in the left column; a `title` never prints there. The heading itself is always \"Starter\" and is not a slot (§1.4).")

replace_once(DOBEATS,
             "**Best for:** the starter of lesson 2+ in a sequence.",
             "**Best for:** the starter of lesson 2+ in a sequence, " + A07 + ".")
replace_once(DOBEATS,
             "**Best for:** mid-unit lessons where prior topics matter.",
             "**Best for:** mid-unit lessons where prior topics matter, " + A07 + ".")
print("starter written")
