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
