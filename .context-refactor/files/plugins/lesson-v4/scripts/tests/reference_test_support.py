"""Exercise the same section reader used by the Lesson Designer, not a summary."""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "component_reference_test_reader", ROOT / "scripts" / "read-reference.py"
)
assert SPEC is not None and SPEC.loader is not None
READER = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = READER
SPEC.loader.exec_module(READER)


def component_text(heading: str) -> str:
    """Return only the triggered component, including its complete exceptions."""
    return READER.selected_text(
        ROOT, [f"lesson-designer-components.md::{heading}"]
    )[0]
