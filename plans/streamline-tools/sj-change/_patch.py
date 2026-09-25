"""What every change script of the subject-files release (topic 8, release 1)
uses: one replacement at a time, each old text asserted to appear exactly once,
line endings kept as found (the repository's `.gitattributes` has held text at
LF on disk since 19 September; old and new texts are written with plain
newlines and converted to a file's own if it ever carries Windows endings).

The plugin is found from this file's own place (the copy it sits in, main
checkout or a side branch's worktree), never from a fixed path, and printed
before anything is written. Every script is written to be run once, in order,
on a clean 2db3ceba (4.2.289) tree: `python -X utf8 <script>` from any folder. A
script run twice fails its own asserts, because its old texts are gone, which is
how a checker knows the tree it replays on is clean."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
ROOT = REPO / "plugins" / "lesson-v4"
print(f"plugin: {ROOT}")

LD = "agents/lesson-designer.md"
PREF = "references/preferences.md"
HISTORY = "references/subject-history.md"
GEOGRAPHY = "references/subject-geography.md"
MATHS = "references/subject-maths.md"
SCIENCE = "references/subject-science.md"
RE = "references/subject-re.md"
PSHE = "references/subject-pshe.md"
RP = "references/reasoning-prompts.md"
SETUP = "references/computer-setup.md"
README = "README.md"
TEMPLATES = "references/templates.md"
SCIENCE_HELPERS = "references/worksheet-helpers/science.md"
WALL = "references/working-wall-card-contracts.md"
LOG = "references/build-review-log.md"
SKILL_DIR = "skills/make-subject-file"
GUIDE = "references/authoring-subject-files.md"
TESTS = "scripts/tests"


def read(rel: str) -> str:
    with open(ROOT / rel, encoding="utf-8", newline="") as handle:
        return handle.read()


def write(rel: str, text: str) -> None:
    with open(ROOT / rel, "w", encoding="utf-8", newline="") as handle:
        handle.write(text)


def replace_once(rel: str, old: str, new: str) -> None:
    text = read(rel)
    if "\r\n" in text:
        old = old.replace("\r\n", "\n").replace("\n", "\r\n")
        new = new.replace("\r\n", "\n").replace("\n", "\r\n")
    count = text.count(old)
    assert count == 1, f"{rel}: expected the old text once, found {count}:\n{old[:300]}"
    write(rel, text.replace(old, new))


def flat(text: str) -> str:
    return " ".join(text.split())


def assert_absent(rel: str, phrase: str) -> None:
    assert flat(phrase) not in flat(read(rel)), f"{rel} still holds: {phrase[:120]}"


def assert_present(rel: str, phrase: str) -> None:
    assert flat(phrase) in flat(read(rel)), f"{rel} lacks: {phrase[:120]}"


def append(rel: str, addition: str) -> None:
    text = read(rel)
    crlf = "\r\n" in text
    body = text.rstrip("\r\n") + "\n" + addition
    if crlf:
        body = body.replace("\r\n", "\n").replace("\n", "\r\n")
    write(rel, body)
