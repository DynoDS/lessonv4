"""The designer chooses Do scope independently of time, delivery and use."""
import copy
import importlib.util
import sys
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parents[2]
def load(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / file)
    m = importlib.util.module_from_spec(spec); sys.modules[name] = m; spec.loader.exec_module(m)
    return m
V = load("do_mode_validator", "validate-lesson-design.py")
S = load("do_mode_scaffold", "lesson-design-scaffold.py")
R = load("do_mode_readout", "do-beats-in-a-row.py")
VOICE = load("do_mode_voice", "check-voice-edit.py")

@pytest.mark.parametrize("kind", sorted(V.DO_MODE_KINDS))
def test_new_pupil_work_requires_a_resolved_mode(kind):
    unit = S.source_unit("lesson-section/teaching-sequence/unit-001", kind, None)
    assert unit["doMode"] == S.PLACEHOLDER
    with pytest.raises(V.ContractError, match="unresolved scaffold placeholder"):
        V.reject_unresolved_scaffold_placeholders({"doMode": unit["doMode"]}, "unit")
    for mode in ("quick", "deeper"):
        V.validate_do_mode(mode, "unit.doMode", kind, "Try the action." if kind == "teach-needed" else None)

@pytest.mark.parametrize("kind", ["teach", "my-turn", "our-turn", "starter"])
def test_teacher_work_and_starter_have_no_mode(kind):
    unit = S.source_unit("lesson-section/teaching-sequence/unit-001", kind, None)
    assert "doMode" not in unit
    with pytest.raises(V.ContractError, match="only on pupil-work"):
        V.validate_do_mode("quick", "unit.doMode", kind)

@pytest.mark.parametrize("value", [None, "sheet", "deep", True, 2])
def test_invalid_modes_rejected(value):
    with pytest.raises(V.ContractError, match="quick or deeper"):
        V.validate_do_mode(value, "unit.doMode", "do")

def test_mode_is_protected_from_voice_rewriting():
    assert VOICE.is_setting(("teachingSequence", 0, "doMode"))


def test_last_enabling_input_may_hand_straight_to_the_task():
    V.validate_do_mode(None, "unit.doMode", "teach-needed", None)
    with pytest.raises(V.ContractError, match="following task"):
        V.validate_do_mode("quick", "unit.doMode", "teach-needed", None)
    with pytest.raises(V.ContractError, match="following task"):
        V.validate_do_mode(None, "unit.doMode", "teach-needed", "Try it.")
