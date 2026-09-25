"""Point 4 of the fit release (4.2.289): the guidance says what the code now does.

`slide-success-criteria.md`, "What holds a list today": the practice panel
widens itself (4.60, 5.50, 6.35 inches, only as far as 18pt needs, never past
half the slide), there is nothing to choose, a list that fits 4.60 keeps it,
the half-width split is the move when even the widest refuses (it is 0.15
inches taller, so it holds a little more: the first check's finding 4), and a
list neither the practice panel nor the half-width split can hold is caught by
the lesson check, which measures exactly those shapes; one the lesson designer
could not tighten is marked too long in the design (`tooLongForPanels`), and
the build tells the slide designer so on each slide that shows it, so it leaves
those slides rather than spending repair passes (the third and fourth checks'
finding 5 and 4); one that still reaches a slide is delivered flagged, never
cut. The rest of
the paragraph (the
shapes that never hold a method's steps, and where a table goes) stays word
for word.

`templates.md`, the two bottom strips: the `quad-v` strip holds one criteria
step of at most two lines and the `centre-big-v` strip one one-line step, never
two steps (the settling short-list rule made "holds no criteria list" untrue).

`templates.md`, the `maths-turn-sc` entry: one paragraph after its slots says
the panel widens itself across the `*-sc` family, there is nothing to set, and
where the picture goes on `maths-turn-sc` when the panel has widened (the
working-space bullet above it is left word for word).

    python -X utf8 plans/streamline-tools/fit-change/c4_guidance_says_what_the_code_does.py
"""
from _patch import replace_once

SSC = "references/slide-success-criteria.md"
TPL = "references/templates.md"

replace_once(SSC, """What holds a list today: the practice templates' panel takes about 14 lines at 18pt, about 26 characters a line; when it refuses, use the half-width split (`split-h-50-50`) with the criteria in an `sc-panel` down one whole side, about 14 lines at about 39 characters. Never put a method's steps""",
"""What holds a list today: the practice templates' panel widens itself, only as far as the whole list needs to read at 18pt and never past half the slide: 4.60in (about 26 characters a line), then 5.50in (about 33), then 6.35in (about 39), each about 14 lines tall. The question and working side take what is left, so there is nothing to choose, and a list that fits 4.60in keeps it. When even the widest refuses, or a slide needs a free layout, use the half-width split (`split-h-50-50`) with the criteria in an `sc-panel` down one whole side: about 39 characters a line like the widest practice panel, and 0.15in taller, so it holds a little more. A list that neither the practice panel nor the half-width split can hold is caught by the lesson check before any slides are made, and the lesson designer tightens it. One it could not tighten is marked too long in the design (`tooLongForPanels`), and the build says so on each slide that shows it: no panel holds it, so leave those slides, which are delivered flagged. A list that still reaches a slide some other way (a sticky line or a helper beside a step can take the last of the room) is delivered flagged for the teacher to check, never cut to fit. Never put a method's steps""")

replace_once(TPL, """- `workingSpace` — set `true` when the planned model needs the separate annotation column; otherwise explicitly pass `false` so the question visual uses the full width. Check the reference and handwriting area at actual slide size. No visual and no planned working usually calls for a simpler layout.
""", """- `workingSpace` — set `true` when the planned model needs the separate annotation column; otherwise explicitly pass `false` so the question visual uses the full width. Check the reference and handwriting area at actual slide size. No visual and no planned working usually calls for a simpler layout.

**The panel widens itself for a long list.** Across the `*-sc` family the success-criteria panel is 4.60″ wide, and it widens to 5.50″ or 6.35″ only when the whole list needs the room to read at 18pt, never past half the slide; the question, reference, cards and working space beside it give up what it takes. There is nothing to set, and a list that fits 4.60″ keeps it (`slide-success-criteria.md` says how much each width holds). On `maths-turn-sc`, when the panel has widened and the `questionVisual` cannot be drawn in its half of the side beside the working space, the builder puts it above the working space instead.
""")

# The bottom strips: the settling short-list rule lets a single step draw there
# now, so "holds no criteria list" is no longer true; the advice stands (the
# second check's finding 3).
replace_once(TPL, """and a short fourth piece in the bottom strip, which holds no criteria list at 18pt: put steps in a practice template's panel or the half-width side (`slide-success-criteria.md`).""",
"""and a short fourth piece in the bottom strip, which holds one criteria step of at most two lines at 18pt and never two steps: put steps in a practice template's panel or the half-width side (`slide-success-criteria.md`).""")
replace_once(TPL, """The bottom strip of `centre-big-v` (~1.66″) holds no criteria list at 18pt: use a template with a dedicated SC panel (`maths-turn-sc`).""",
"""The bottom strip of `centre-big-v` (~1.66″) holds one one-line criteria step at 18pt and never two: use a template with a dedicated SC panel (`maths-turn-sc`).""")

print("c4: the guidance says what the code does")
