"""What every change script of the playbook release (topic 10, release 10A: the
playbook tidy, his decisions 1, 2, 4 and 6, the settled items a to m, his
answers to the change plan's questions 1 to 3, and the words the worksheets
release left for the playbook) uses: one replacement at a time, each old text
asserted to appear exactly once, line endings kept as found (old and new texts
are written with plain newlines and converted to the file's own).

Every script is written to be run once, in order, on a clean 4.2.295 tree
(`8af6f8a9`): `python -X utf8 <script>` from any folder. A script run twice
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

PB = "skills/make-lesson/playbook-lite.md"
SK = "skills/make-lesson/SKILL.md"
RT = "scripts/make-lesson-runtime.py"
RTT = "scripts/tests/test_make_lesson_runtime.py"
VRR = "scripts/validate-run-report.py"
RFR = "scripts/run-fixed-resource.py"
DF = "scripts/deliver_files.py"
CRS = "scripts/check-repair-scope.py"
RIP = "references/revising-in-place.md"
GAP = "references/brief-gap-protocol.md"
HR = "references/helper-route.md"
CD = "references/cloud-delivery.md"
CS = "references/computer-setup.md"
ET = "commands/edit-templates.md"
LOG = "references/build-review-log.md"


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


def measured(rel: str) -> int:
    """A file's size the way the playbook's size tests count it: line endings
    as one byte, whatever the checkout wrote."""
    return len((ROOT / rel).read_bytes().replace(b"\r\n", b"\n").replace(b"\r", b"\n"))
