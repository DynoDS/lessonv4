"""What every change script of the worksheets release (4.2.290) uses: one
replacement at a time, each old text asserted to appear exactly once, line
endings kept as found (the plugin's files use Windows line endings; old and new
texts are written with plain newlines and converted to the file's own).

Every script is written to be run once, in order, on a clean 4.2.289 tree:
`python -X utf8 <script>` from any folder. A script run twice fails its own
asserts, because its old texts are gone, which is how a checker knows the tree
it replays on is clean."""
import time
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")

PREF = "references/preferences.md"
LD = "agents/lesson-designer.md"
LDC = "references/lesson-designer-components.md"
OT = "references/output-template.md"
WSD = "agents/worksheet-designer.md"
REPAIR = "agents/worksheet-designer-focused-repair.md"
BUILDER = "agents/worksheet-builder.md"
WSH = "references/worksheet-helpers.md"
SHARED = "references/worksheet-helpers/shared.md"
MATHSH = "references/worksheet-helpers/maths.md"
BOS = "references/books-or-sheet.md"
GAP = "references/brief-gap-protocol.md"
REV = "agents/design-reviewer.md"
ADAPT = "agents/adaptation-designer.md"
PB = "skills/make-lesson/playbook-lite.md"
LOG = "references/build-review-log.md"
ENGINE = "worksheet-html"


def read(rel: str) -> str:
    with open(ROOT / rel, encoding="utf-8", newline="") as handle:
        return handle.read()


def write(rel: str, text: str) -> None:
    # Windows sometimes refuses to open a file that was written a moment ago
    # (errno 22, while another process still holds it), so a write is tried a
    # few times before it fails.
    for attempt in range(8):
        try:
            with open(ROOT / rel, "w", encoding="utf-8", newline="") as handle:
                handle.write(text)
            return
        except OSError as error:
            if error.errno != 22 or attempt == 7:
                raise
            time.sleep(0.5)


def replace_once(rel: str, old: str, new: str) -> None:
    text = read(rel)
    if "\r\n" in text:
        old, new = old.replace("\r\n", "\n").replace("\n", "\r\n"), new.replace("\r\n", "\n").replace("\n", "\r\n")
    count = text.count(old)
    assert count == 1, f"{rel}: expected the old text once, found {count}:\n{old[:300]}"
    write(rel, text.replace(old, new))


def assert_absent(rel: str, phrase: str) -> None:
    flat = " ".join(read(rel).split())
    assert " ".join(phrase.split()) not in flat, f"{rel} still holds: {phrase[:120]}"


def assert_present(rel: str, phrase: str) -> None:
    flat = " ".join(read(rel).split())
    assert " ".join(phrase.split()) in flat, f"{rel} lacks: {phrase[:120]}"


def append(rel: str, addition: str) -> None:
    text = read(rel)
    crlf = "\r\n" in text
    body = text.rstrip("\r\n") + "\n" + addition
    if crlf:
        body = body.replace("\r\n", "\n").replace("\n", "\r\n")
    write(rel, body)
