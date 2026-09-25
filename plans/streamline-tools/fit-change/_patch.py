"""What every change script of the fit release uses: one replacement at a time,
each old text asserted to appear exactly once, line endings kept as found."""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")


def read(rel: str) -> str:
    with open(ROOT / rel, encoding="utf-8", newline="") as handle:
        return handle.read()


def write(rel: str, text: str) -> None:
    with open(ROOT / rel, "w", encoding="utf-8", newline="") as handle:
        handle.write(text)


def replace_once(rel: str, old: str, new: str) -> None:
    text = read(rel)
    crlf = "\r\n" in text
    if crlf:
        old, new = old.replace("\n", "\r\n"), new.replace("\n", "\r\n")
    count = text.count(old)
    assert count == 1, f"{rel}: expected the old text once, found {count}:\n{old[:200]}"
    write(rel, text.replace(old, new))


def place_new(rel: str, source: Path) -> None:
    """Copy a whole new file into the plugin; it must not be there already
    unless this script placed the same kind of file before (rerun)."""
    target = ROOT / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(source.read_bytes())
