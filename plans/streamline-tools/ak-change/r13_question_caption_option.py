"""Assumed knowledge (4.2.287): the teacher's caption idea, as he framed it
(23 September 2026): "It was just a suggestion. Just a small suggestion that
could happen sometimes if it's needed... We're not changing how questions look
in every deck at all." One sentence of option in the playbook; nothing else."""
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
ROOT = REPO / "plugins" / "lesson-v4"
HERE = Path(__file__).resolve().parent


def patch(path: Path, pairs) -> None:
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (path.name, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", path.name)


OLD = "A caption that names the picture may help and is never required (`The Starry Night by Van Gogh`)."
NEW = ("A caption that names the picture may help and is never required (`The Starry Night by Van Gogh`). "
       "Now and then, when a slide is short of room, the question about a picture can be its caption (`What does this picture tell us about Tudor farm work?`); that is an option for the odd slide, and questions otherwise keep their own place and look.")
patch(ROOT / "references" / "slide-composition-playbook.md", [(OLD, NEW)])
patch(HERE / "build_ak_mapping.py", [(OLD + " The limit", NEW + " The limit")])
patch(REPO / "plans" / "2026-09-22-assumed-knowledge-ledger.md", [(
    "  questions look on a slide, so it was put to him rather than done.\n",
    "  questions look on a slide, so it was put to him rather than done.\n"
    "- The caption idea, his answer: \"Don't overcomplicate it. I know I said pictures\n"
    "  could go under captions, but don't take that as every time there's a picture\n"
    "  and a question, it should go under it like a caption. We're not changing how\n"
    "  questions look in every deck at all. It was just a suggestion. Just a small\n"
    "  suggestion that could happen sometimes if it's needed.\" Settled: one\n"
    "  sentence of option in the slide rules, for the odd slide short of room.\n",
)])
patch(ROOT / "references" / "build-review-log.md", [(
    "and a test now holds them to both.",
    "and a test now holds them to both. His idea that a picture's question could sit as its caption is one sentence of option in the slide rules, for the odd slide short of room (\"just a small suggestion that could happen sometimes if it's needed\"); how questions look is unchanged.",
)])
