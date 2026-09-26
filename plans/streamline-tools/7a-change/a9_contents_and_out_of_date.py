"""Release 7A (4.2.293), step 9: the contents block, once, and what is out of
date (A12).

The contents block is pinned whole by three earlier topics (SC-A02, TD-A12,
VOC-A03), so every contents edit is made here, together: L20 (A11: numbering
is for the starter in every subject and the main independent work in maths
only), L25 (A7: the full decision no longer "lives with the lesson-designer";
the section judges an ending, the designer's holds what an Apply has to be, its
shapes and its recording), L26 (A8: the real item stays out while it is held,
unless he explicitly asks for it), and the reading paragraph L11 (PF-A29 and the
reviewer list's settled item 5, the same correction: the reviewer reads the
sections its routing card marks as always read, every review, and the others on
their triggers). The routing card's Pride Lessons note (PF-X46) is corrected in
the same pass: Pride Lessons calibrates how much a beat puts in front of the
class and holds the Teach slides he chose; "how often a lesson returns to the
same evidence" is What a Lesson Is For's and the reviewer's own, not Pride
Lessons'. The test that asserts that note moves with it (a9t). Settled item 12:
the `lesson-cover` template loses "for historical reasons" and keeps its
must-not."""
from _patch import PACKET, PREF, TMPL, replace_once

replace_once(PREF,
             "The Design Reviewer receives a compact runtime routing card and reads only the named section when its trigger applies.",
             "The Design Reviewer receives a compact runtime routing card: it reads the sections the card marks as always read in every review, and any other named section only when its trigger applies.")
replace_once(PREF,
             "- **Question Labelling** — bracketed labels only for starter and main independent work, plus lettered multi-question Maths Our Turn work;",
             "- **Question Labelling** — bracketed labels for the starter in every subject and for the main independent work in maths only, plus lettered multi-question Maths Our Turn work;")
replace_once(PREF,
             "- **The Apply Slide** — earned through the lesson, never automatic; the full decision lives with the lesson-designer.",
             "- **The Apply Slide** — earned through the lesson, never automatic, and judged against the learning the lesson named; what an Apply has to be, its shapes and its recording live with the lesson-designer.")
replace_once(PREF,
             "- **Practising a Test Question** — fresh questions at the test's exact demand and form; the real item stays out of the lesson.",
             "- **Practising a Test Question** — fresh questions at the test's exact demand and form; the real item stays out of the lesson while it is held for a later test, unless the teacher explicitly asks for that exact item.")

replace_once(PACKET, '''        "Read every review, before the User-fit judgement: it is the "
        "calibration for how much one beat puts in front of the class and how "
        "often a lesson returns to the same evidence. A fit judgement that "
        "lists features present has not used it.",''', '''        "Read every review, before the User-fit judgement: it is the "
        "calibration for how much one beat puts in front of the class, and it "
        "holds the Teach slides the teacher chose, written out. A fit judgement "
        "that lists features present has not used it.",''')

replace_once(TMPL,
             "(A `lesson-cover` template still exists in the builder for historical reasons and is exercised only by build-test fixtures.",
             "(A `lesson-cover` template exists in the builder and is exercised only by build-test fixtures.")
print("contents and out-of-date lines written")
