"""The voice guide release, step 5b: the slide designer's focused repair keeps its
budget 200 bytes wider than the other repair roles'.

Decision 4 (his "yes") gives the slide designer's three triggers for the speech
guidance that guidance's own list, word for word. One of the three is in the
slide designer's focused repair, whose compact entry point had to stay under
8,000 bytes (`test_make_lesson_runtime.py`); it had 73 to spare, and the list
adds 107. Every other repair role keeps 8,000; this one is allowed 8,200, still
about an eighth of the full slide designer it stands in for. The lead chose this
(26 September) over a shorter trigger or a fold elsewhere in the role: his words
kept whole beat a byte guard. No other budget changes."""
from _patch import replace_once

replace_once(
    "scripts/tests/test_make_lesson_runtime.py",
    "                repository_text = compact_text.replace(\"\\r\\n\", \"\\n\")\n"
    "                self.assertLess(len(repository_text.encode(\"utf-8\")), 8000)\n",
    "                repository_text = compact_text.replace(\"\\r\\n\", \"\\n\")\n"
    "                # The slide designer's repair carries the speech guidance's\n"
    "                # own list of who opens it, word for word (the voice guide\n"
    "                # release, his decision 4), so it is allowed 200 bytes more.\n"
    "                budget = 8200 if owner == \"slide-designer\" else 8000\n"
    "                self.assertLess(len(repository_text.encode(\"utf-8\")), budget)\n",
)
print("REPAIR_BUDGET_OK")
