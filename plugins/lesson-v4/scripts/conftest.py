"""Pytest support for the self-contained test scripts in this directory.

`test_question_crop.py` and `test_maths_plan_tracker.py` are standalone
scripts: each has a `main()` that makes one temporary directory and passes it
to every test as `tmp`. Under pytest that argument is resolved as a fixture,
so this file provides it. Without it the whole suite reports fixture errors
for tests that pass when run directly.
"""
import pytest


@pytest.fixture
def tmp(tmp_path):
    """The temporary directory as a plain string path, as the scripts expect."""
    return str(tmp_path)


@pytest.fixture(autouse=True)
def isolated_plugin_home(tmp_path, monkeypatch):
    """Every test gets an empty plugin folder of its own.

    The settings in the real one (a save folder, developer mode) change what the
    filing resolver, the delivery script and the source lookup do, so a test that
    read them would pass or fail depending on whose computer it ran on.
    """
    home = tmp_path / "plugin-home"
    home.mkdir()
    monkeypatch.setenv("LESSON_RESOURCES_HOME", str(home))
    monkeypatch.delenv("LESSON_RESOURCES_SOURCE_ROOT", raising=False)
    return home
