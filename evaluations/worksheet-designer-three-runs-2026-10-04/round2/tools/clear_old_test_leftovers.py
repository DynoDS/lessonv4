"""Clear the plugin tests' old leftover folders from the temp folder.

Only folders whose name is one of the plugin tests' own prefixes followed by
the six random characters a temporary folder gets, and only ones last changed
more than a day ago, so anything a test or a run is using today is left alone.
Daniel agreed to this on 4 October 2026: about 208,000 of them had made Codex's
sandbox set-up too slow to finish.
"""
import os
import re
import shutil
import time

TEMP = r"C:\Users\Daniel\AppData\Local\Temp"
PREFIXES = """directed-sheets autofit-test working-wall-html-smoke working-wall-html-parity
pending-pictures lr-vocab-educational-svg lr-worksheet-decoration evidence-cards expected-sheet
lr-slide-decoration lr-wall-decoration literal-markers-test setup-drawings stand-in stickin
lr-educational-svg-home lr-educational-svg-publish lr-svg-rank-cache missing-pictures
lr-educational-svg-cache setup-engines lr-educational-svg-preview verify-geometry-test
lr-svg-rank-home stickin-source autofit setup-home cold lr-decoration-ooxml
working-wall-validate-only working-wall-reference-fit stickin-kit sort-board-pictures composition
present-pictures guide-examples find-python-home lesson-resources-slide-preview-refused wall-chips
wall-cap wall-budget wall-diag lr-educational-svg-work lr-wall-build-notice
lesson-resources-slide-preview stickin-label wall-give-way lr-educational-svg-warm
lr-educational-svg-local lr-educational-svg-broken lr-educational-svg-missing
lr-educational-svg-partial lr-educational-svg-default stickin-ink lr-svg-rank-placeholder
lr-svg-rank-empty lr-svg-rank-both stickin-picture do-signs board-letters wall-picture-first
stickin-sheet lr-vocab-koboyo do-signs-none lr-educational-svg task-portrait""".split()
NAME = re.compile(r"^(?:%s)-[A-Za-z0-9_]{6}$" % "|".join(re.escape(p) for p in sorted(PREFIXES, key=len, reverse=True)))
cutoff = time.time() - 24 * 3600

removed = kept_recent = failed = other = 0
with os.scandir(TEMP) as entries:
    for entry in entries:
        if not NAME.match(entry.name):
            other += 1
            continue
        try:
            if not entry.is_dir(follow_symlinks=False) or entry.stat(follow_symlinks=False).st_mtime > cutoff:
                kept_recent += 1
                continue
            shutil.rmtree(entry.path)
            removed += 1
        except OSError:
            failed += 1
        if removed and removed % 20000 == 0:
            print("removed", removed, flush=True)
print(f"removed {removed}, kept as recent {kept_recent}, could not remove {failed}, not a test leftover {other}")
