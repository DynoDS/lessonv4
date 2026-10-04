"""Measure the playbook and every runtime slice the way the size tests count
them (a tool, not part of the replay; it writes only the census file it is
given).

    python -X utf8 pb_measure.py [census-output.txt]

Each slice is measured as the runtime prints it, NEXT trailer included, with
line endings counted as one byte, against its 7 KiB budget; the whole file
against the 77 KiB cap; the first three slices against 50 KiB. The runtime
program is loaded from the same plugin root, so after the cut points move the
census follows them."""
import importlib.util
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _patch import PB, ROOT, RT  # noqa: E402

spec = importlib.util.spec_from_file_location("make_lesson_runtime", ROOT / RT)
rt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rt)


def measured(raw: bytes) -> int:
    return len(raw.replace(b"\r\n", b"\n").replace(b"\r", b"\n"))


def census() -> list[str]:
    data = (ROOT / PB).read_bytes()
    whole = measured(data)
    lines = [f"whole file: {whole} / {77 * 1024} (spare {77 * 1024 - whole})"]
    first3 = 0
    for name, (start, end) in rt.SLICE_BOUNDS.items():
        body = rt.extract_slice(data, start, end)
        size = measured(body + rt.render_next_block(name))
        if name in ("execution", "setup", "design"):
            first3 += size
        lines.append(f"{name:22s} {size:6d} / {7 * 1024} (spare {7 * 1024 - size})")
    lines.append(f"first three: {first3} / {50 * 1024}")
    head = data[: data.index(b"## Lightweight execution protocol")]
    lines.append(f"bytes before the first slice: {measured(head)}")
    return lines


if __name__ == "__main__":
    out = census()
    print("\n".join(out))
    if len(sys.argv) > 1:
        target = Path(sys.argv[1])
        print(f"writing {target}")
        target.write_text("\n".join(out) + "\n", encoding="utf-8")
