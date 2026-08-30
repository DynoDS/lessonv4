"""Deterministic tests for the lesson-resources package-root contract.

Run:
  python3 test_plugin_root_contract.py
or:
  pytest test_plugin_root_contract.py
"""
from __future__ import annotations

import importlib.util
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "verify-plugin-root.py"

spec = importlib.util.spec_from_file_location("verify_plugin_root", SCRIPT)
assert spec and spec.loader
root_verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(root_verifier)

PACKAGE_SENTINELS = root_verifier.REQUIRED_PACKAGE_PATHS
SOURCE_SENTINELS = root_verifier.REQUIRED_SOURCE_PATHS

CLAUDE_TOKEN = "${" + "CLAUDE_PLUGIN_ROOT}"
EXPECTED_CLAUDE_TOKEN_COUNTS = {
    "skills/make-lesson/SKILL.md": 1,
    "skills/make-subject-file/SKILL.md": 1,
    "commands/add-test-questions.md": 1,
    "commands/edit-templates.md": 1,
    "commands/install-helper.md": 1,
}

TEXT_SUFFIXES = {
    ".js",
    ".json",
    ".md",
    ".py",
    ".sh",
    ".toml",
    ".yaml",
    ".yml",
}


def run_verifier(
    *args: str,
    cwd: Path | None = None,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        cwd=str(cwd or ROOT),
        capture_output=True,
        text=True,
    )


def make_package(root: Path, *, source: bool = False) -> None:
    paths = list(PACKAGE_SENTINELS)
    if source:
        paths.extend(SOURCE_SENTINELS)

    for relative in paths:
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("{}\n", encoding="utf-8")

    if source:
        (root.parent / ".git").mkdir(parents=True, exist_ok=True)


def iter_contract_text_files():
    for path in ROOT.rglob("*"):
        if path == Path(__file__).resolve():
            continue
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
            yield path


def test_orchestration_runtime_helpers_are_required_package_sentinels():
    """Every helper the active make-lesson route runs must be a sentinel.

    `orchestration-controller.py` is deliberately absent: the simplified route
    in `playbook-lite.md` never calls it, so a package missing it is still a
    usable package.
    """
    required = {
        "scripts/run-fixed-resource.py",
        "scripts/photo-contract.py",
        "scripts/collect-helper-uses.py",
        "scripts/check-helper-coverage.py",
        "scripts/finalize-picture-assignment.py",
        "scripts/compile-picture-assignments.py",
    }
    assert required.issubset(set(PACKAGE_SENTINELS))
    source = SCRIPT.read_text(encoding="utf-8")
    for relative in required:
        assert f'"{relative}"' in source


def test_current_checkout_is_a_valid_package_root():
    result = run_verifier(str(ROOT))
    assert result.returncode == 0, result.stdout + result.stderr
    assert result.stdout.strip() == f"PLUGIN_ROOT={ROOT.resolve()}"


def test_relative_candidate_is_rejected_without_using_cwd():
    result = run_verifier(".", cwd=ROOT)
    assert result.returncode == 2
    assert "candidate is not an absolute path" in result.stderr


def test_wrong_root_does_not_search_a_valid_parent():
    with tempfile.TemporaryDirectory() as tmp:
        outer = Path(tmp) / "lesson-resources"
        make_package(outer)
        wrong = outer / "unrelated-project"
        wrong.mkdir()

        result = run_verifier(str(wrong))

        assert result.returncode == 2
        assert str(wrong / PACKAGE_SENTINELS[0]) in result.stderr
        assert "PLUGIN_ROOT=" not in result.stdout


def test_source_root_requires_a_git_checkout():
    with tempfile.TemporaryDirectory() as tmp:
        source_root = Path(tmp) / "lesson-resources"
        make_package(source_root, source=True)
        (source_root.parent / ".git").rmdir()

        result = run_verifier("--source", str(source_root))

        assert result.returncode == 2
        assert "source root is not inside a git checkout" in result.stderr


def test_source_root_is_found_when_the_plugin_sits_below_the_checkout():
    """The plugin lives at `<repo>/plugins/<name>`, not directly in the repo.

    The guard used to demand `.git` in the plugin's own parent folder, which is
    `plugins/`. That made the real source tree fail its own check, so any
    workflow that edits the plugin stopped with a message telling the caller to
    find a repository they were already inside.
    """
    with tempfile.TemporaryDirectory() as tmp:
        checkout = Path(tmp) / "lessonv4"
        source_root = checkout / "plugins" / "lesson-v4"
        make_package(source_root, source=True)
        (source_root.parent / ".git").rmdir()
        (checkout / ".git").mkdir(parents=True, exist_ok=True)

        result = run_verifier("--source", str(source_root))

        assert result.returncode == 0, result.stdout + result.stderr
        assert (
            result.stdout.strip()
            == f"PLUGIN_SOURCE_ROOT={source_root.resolve()}"
        )


def test_valid_source_root_is_reported_separately():
    with tempfile.TemporaryDirectory() as tmp:
        source_root = (
            Path(tmp) / "teaching-plugins" / "lesson-resources"
        )
        make_package(source_root, source=True)

        result = run_verifier("--source", str(source_root))

        assert result.returncode == 0, result.stdout + result.stderr
        assert (
            result.stdout.strip()
            == f"PLUGIN_SOURCE_ROOT={source_root.resolve()}"
        )


def test_codex_manifest_matches_the_claude_identity_and_version():
    claude = json.loads(
        (ROOT / ".claude-plugin" / "plugin.json").read_text(
            encoding="utf-8"
        )
    )
    codex = json.loads(
        (ROOT / ".codex-plugin" / "plugin.json").read_text(
            encoding="utf-8"
        )
    )

    for field in ("name", "version", "description"):
        assert codex[field] == claude[field], field

    assert codex["skills"] == "./skills/"


def test_claude_root_token_exists_only_at_explicit_host_boundaries():
    actual = {}
    for path in iter_contract_text_files():
        count = path.read_text(encoding="utf-8").count(CLAUDE_TOKEN)
        if count:
            actual[path.relative_to(ROOT).as_posix()] = count

    assert actual == EXPECTED_CLAUDE_TOKEN_COUNTS


def test_no_personal_checkout_path_remains_in_lesson_resources():
    forbidden = (
        "C:" + "\\Users\\Daniel\\Projects\\teaching-plugins",
        "/c/" + "Users/Daniel/Projects/teaching-plugins",
    )
    matches = []

    for path in iter_contract_text_files():
        text = path.read_text(encoding="utf-8")
        for value in forbidden:
            if value in text:
                matches.append(
                    f"{path.relative_to(ROOT)}: {value}"
                )

    assert not matches, "\n".join(matches)


def test_runtime_contract_does_not_require_project_codex_agents():
    runtime_roots = (
        ROOT / "skills",
        ROOT / "agents",
        ROOT / "commands",
        ROOT / "references",
        ROOT / "scripts",
    )
    matches = []

    for base in runtime_roots:
        for path in base.rglob("*"):
            if path == Path(__file__).resolve():
                continue
            if (
                path.is_file()
                and path.suffix.lower() in TEXT_SUFFIXES
            ):
                if ".codex/agents" in path.read_text(
                    encoding="utf-8"
                ):
                    matches.append(str(path.relative_to(ROOT)))

    assert not matches, "\n".join(matches)

# A plugin file an instruction tells a worker to run, whose absence the plugin
# documents as an ordinary degrade rather than a fault.
#
# There are none. The one entry here was the drawing library's search script,
# exempted because the library was too large for an install to carry. The
# drawings now live in their own repository and the package ships only the
# search and the index, so every file the instructions name is a file the
# package really has - and an instruction pointing at a missing script is once
# again a plain fault rather than a documented shrug.
OPTIONAL_INSTRUCTED_PATHS: dict[str, tuple[Path, str]] = {}

INSTRUCTED_PATH_RE = re.compile(
    r"\[PLUGIN_ROOT\]/([A-Za-z0-9._/-]+\.(?:py|js|mjs|cjs|json|md))"
)


def test_every_plugin_file_the_instructions_name_is_actually_shipped():
    """An instruction may not send a worker to a file the plugin does not have.

    A large asset directory was removed from the package while four roles and a
    reference still routed into it, so the documented graceful outcome could not
    be produced: the worker got a crash from a missing script instead.
    """
    unshipped: dict[str, set[str]] = {}
    for folder in ("agents", "references", "skills", "commands"):
        for path in sorted((ROOT / folder).rglob("*.md")):
            for named in INSTRUCTED_PATH_RE.findall(path.read_text(encoding="utf-8")):
                if not (ROOT / named).exists():
                    unshipped.setdefault(named, set()).add(
                        str(path.relative_to(ROOT)).replace("\\", "/")
                    )

    for named, sources in sorted(unshipped.items()):
        documented = OPTIONAL_INSTRUCTED_PATHS.get(named)
        assert documented is not None, (
            f"{named} is named by {sorted(sources)} but the plugin does not ship it"
        )
        owner, degrade = documented
        assert degrade in owner.read_text(encoding="utf-8"), (
            f"{named} is absent, so {owner.name} must document what a run does instead"
        )


if __name__ == "__main__":
    failed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print("PASS", name)
            except AssertionError as exc:
                failed += 1
                print("FAIL", name, str(exc)[:500])
    raise SystemExit(1 if failed else 0)
