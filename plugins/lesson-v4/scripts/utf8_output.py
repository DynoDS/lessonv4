"""Print in UTF-8, whoever runs the script and wherever its output goes.

When a script's output is piped (every worker reads it that way), Windows gives
Python the computer's old code page, cp1252, and Python stops with a
UnicodeEncodeError at the first character that page does not have. The
lessons are full of them: the minus sign in a sum, the arrow in a food chain,
curly quotes, an accented name. Before this module each script that met one
was mended alone (the repair-scope report on 10 October 2026, the Do beat list
on 18 October), and on 18 October 2026 the slide preview crashed on its first
run in all five lessons of the maths week, on "52 − 28" in a note it was only
passing on, and the set's progress watcher lost a lesson's finished line the
same way. Every worker had to rerun with PYTHONIOENCODING=utf-8.

So every runnable script calls `enable()` first, before it prints anything, and
a test pins that, because a script that forgets works on any computer whose
console happens to cope and fails on the next lesson with a minus sign in it.
`errors="replace"` keeps even a broken character from ending a report part-way.
"""
from __future__ import annotations

import sys


def enable() -> None:
    for stream in (sys.stdout, sys.stderr):
        # A stream a caller has swapped in (a test's capture) may not have it.
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
