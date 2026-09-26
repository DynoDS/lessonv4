"""What every change script of the design reviewer release (topic 8, release 2)
uses: one replacement at a time, each old text asserted to appear exactly once,
line endings kept as found (old and new texts are written with plain newlines
and converted to the file's own).

The plugin is found from this file's own place (`<copy>/plans/streamline-tools/
rv-change/`), never from a fixed path, so a replay on a scratch copy edits that
copy and nothing else, and every script prints the plugin it writes into before
its first write. Every script is written to be run once, in order, on a clean
4.2.292 tree (`b1c2d427`): `python -X utf8 <script>` from any folder. A script
run twice fails its own asserts, because its old texts are gone, which is how a
checker knows the tree it replays on is clean."""
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
ROOT = REPO / "plugins" / "lesson-v4"
NEW = HERE / "new"

REV = "agents/design-reviewer.md"
PACKET = "scripts/design-review-packet.py"
FIXTURE = "scripts/tests/fixtures/design-reviewer-behaviour-cases.json"
LOG = "references/build-review-log.md"

_announced = False


def announce() -> None:
    global _announced
    if not _announced:
        print(f"writing into {ROOT}")
        _announced = True


def read(rel: str) -> str:
    with open(ROOT / rel, encoding="utf-8", newline="") as handle:
        return handle.read()


def write(rel: str, text: str) -> None:
    announce()
    with open(ROOT / rel, "w", encoding="utf-8", newline="") as handle:
        handle.write(text)


def _eol(text: str, piece: str) -> str:
    piece = piece.replace("\r\n", "\n")
    return piece.replace("\n", "\r\n") if "\r\n" in text else piece


def replace_once(rel: str, old: str, new: str) -> None:
    text = read(rel)
    old, new = _eol(text, old), _eol(text, new)
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
    body = text.rstrip("\r\n") + "\n" + addition.replace("\r\n", "\n")
    write(rel, _eol(text, body) if "\r\n" in text else body)


def place_new(rel: str, name: str) -> None:
    """Copy a whole new file from `new/` into the plugin; it must not be there
    already, so a replay on a tree that has it fails."""
    target = ROOT / rel
    assert not target.exists(), f"{rel} is already there"
    announce()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes((NEW / name).read_bytes())
