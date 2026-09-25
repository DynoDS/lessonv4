"""The new tests of the fit release (4.2.289), copied whole from `fit-change/new/`.

- builder/test/criteria-lists-keep-their-size.test.js: every real list of the
  investigation keeps the size the 4.2.288 builder drew it at, in fourteen
  shapes, and a practice panel keeps 4.60in (reads the fixture that
  `f1_fixture_from_before_run.py` wrote before any change).
- builder/test/criteria-fitter-mends.test.js: the three measuring faults, each
  with the real list that showed it.
- builder/test/practice-panel-widens.test.js: the long lists draw in all four
  practice templates at the width the investigation measured; a short list
  keeps 4.60in; a number-line slide draws with the line above the working
  space; a list no width holds is refused at the widest before anything is
  drawn; the retired template keeps 4.60in; the tries raise no warnings; and,
  in a delivered deck, a list marked too long is drawn smaller on a finished,
  flagged slide, while only a marked list no panel holds even at 16pt is a
  page to check (and the slide check's scratch build passes the first); and
  the slide check itself passes a six-step list that fits, its criteria cue a
  note (c5d).
- builder/test/marked-criteria.test.js and builder/src/marked-criteria.js: a
  slide showing a list the lesson designer marked too long, word for word, is
  known to the build; the panel draws it at the largest size that fits, down
  to 16pt, at the practice panel's widest or in the half-width side, and the
  build names the slide for the teacher; a marked list still refused is the
  slide designer's to move while a named shape holds it, and only otherwise
  the design's (c5b and c5c wire it in); a stale mark changes nothing, and a
  sticky line beside a marked list keeps 18pt (c5e).
- scripts/tests/test_a_criteria_list_fits_within_half_the_slide.py: the lesson
  check and the builder give the same verdict on every real list and on lists
  made either side of the limit; a marked list passes exactly where the
  builder draws it smaller; a marked list too long even at 16pt passing with
  a note and still making a deck, printed before the pass line (c5d); a mark
  left false counting for nothing (c5e); the refusal's words; the mark and
  what it costs;
  the review page; the guidance; the final text fit's floor for a marked
  list's lines.

    python -X utf8 plans/streamline-tools/fit-change/c7_place_new_tests.py
"""
from pathlib import Path

from _patch import place_new

NEW = Path(__file__).resolve().parent / "new"
for source in sorted(NEW.rglob("*")):
    if source.is_file():
        rel = source.relative_to(NEW).as_posix()
        place_new(rel, source)
        print("placed", rel)
