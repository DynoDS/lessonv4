"""Pytest support for the test scripts in this directory."""
import pytest


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
