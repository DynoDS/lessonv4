"""What every change script of the routes release (topic 8, release 3: the
routes, his decisions and the corrections) uses: one replacement at a time, each
old text asserted to appear exactly once, line endings kept as found (old and
new texts are written with plain newlines and converted to the file's own).

Every script is written to be run once, in order, on a clean 4.2.293 tree
(`59f85708`): `python -X utf8 <script>` from any folder. A script run twice
fails its own asserts, because its old texts are gone, which is how a checker
knows the tree it replays on is clean.

The plugin root is this checkout's `plugins/lesson-v4`, or the folder named by
the environment variable `LESSONV4_PLUGIN_ROOT`, so a checker can replay the
scripts on a scratch copy without editing them. The root is printed first."""
import os
import time
from pathlib import Path

DEFAULT_ROOT = Path(__file__).resolve().parents[3] / "plugins" / "lesson-v4"
ROOT = Path(os.environ.get("LESSONV4_PLUGIN_ROOT") or DEFAULT_ROOT)
print(f"plugin root: {ROOT}")

LD = "agents/lesson-designer.md"
REV = "agents/design-reviewer.md"
PREF = "references/preferences.md"
TV = "references/teacher-voice.md"
CONTENT = "references/teaching-sequence-content-based.md"
SKILL = "references/teaching-sequence-skill-based.md"
TASK = "references/teaching-sequence-task-centred.md"
DIAL = "references/teaching-sequence-dialogic.md"
DISC = "references/teaching-sequence-discovery.md"
DB = "references/do-beats.md"
ES = "references/evidence-synthesis.md"
ET = "references/explanation-tasks.md"
MF = "references/modelling-formats.md"
LDC = "references/lesson-designer-components.md"
LOG = "references/build-review-log.md"
VALIDATOR = "scripts/validate-lesson-design.py"
PACKET = "scripts/design-review-packet.py"


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
