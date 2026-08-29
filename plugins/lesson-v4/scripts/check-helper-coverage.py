#!/usr/bin/env python3
"""Hold the helper check to an answer, and hold the build to that answer.

A lesson names the visuals its learning rests on. The engine can only draw the
ones it has a helper for. Between those two facts sat a judgement nobody
recorded: a run could decide "this needs a balanced-plate helper", build no
helper, ship slides with words where the picture belonged, and pass every check
on the way out. The decision was real and the run simply walked past it.

So the judgement stays where it belongs, with the reader who can compare a
lesson's figure against what a helper actually draws, and this script does the
two mechanical halves around it:

    inventory  what the lesson needs, and every helper key each surface can
               really draw right now, read from the live registries rather than
               from a written catalogue that drifts.

    verdict    every required use has exactly one recorded decision, and a use
               called covered names a helper key that is live on that surface.

    delivery   every use recorded as covered actually appears in the built
               specification for its surface.

`delivery` is the half that catches the original failure: a covered decision
whose helper never reaches the deck is the silent substitution, and it now
fails loudly at the boundary instead of quietly in a classroom.

A `substitute` decision is honest and allowed - the picture route exists for
exactly the visual no helper should ever draw - but it must be written down
with its reason, so an absence is a recorded choice and never a silence.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
from pathlib import Path

DECISIONS = ("covered", "build", "substitute")

# Each surface, the registry file that decides what it can draw, and the
# JavaScript object inside it that holds the keys. Reading the registry is the
# point: a helper is only real where its renderer dispatches on it, and a
# written catalogue can claim otherwise.
REGISTRIES = {
    "slides": (("builder/src/content/index.js",), ("HELPERS",)),
    "worksheets": (("worksheet-html/src/helpers/purposes.js",), ("module.exports",)),
    "wall": (("working-wall-html/src/visuals.js",), ("VISUAL_KEY_FNS",)),
    "stick-in": (
        ("stick-in-sheets-html/src/visual-registry.js",),
        ("VISUALS", "ROW_VISUALS"),
    ),
}

# How a built specification names the helper it drew, per surface.
SPEC_KEY_FIELDS = {
    "slides": ("type",),
    "worksheets": ("helper",),
    "wall": ("type",),
    "stick-in": ("visual",),
}


class CoverageError(ValueError):
    pass


def load_json(path: Path, label: str) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise CoverageError(f"{label} is unreadable JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise CoverageError(f"{label} root must be an object")
    return data


def load_uses(design_path: Path) -> list[dict]:
    """Reuse the existing collector so both halves read one definition of a use."""
    collector = design_path  # placeholder to keep the name in scope for errors
    module_path = Path(__file__).resolve().parent / "collect-helper-uses.py"
    spec = importlib.util.spec_from_file_location("collect_helper_uses", module_path)
    if spec is None or spec.loader is None:
        raise CoverageError(f"cannot load {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    try:
        design = module.load_design(design_path)
        return module.collect(design)
    except module.HelperUseError as exc:
        raise CoverageError(f"lesson design: {exc}") from exc
    except OSError as exc:
        raise CoverageError(f"lesson design {collector} unreadable: {exc}") from exc


def object_body(text: str, name: str) -> str:
    """The braces of `name = { ... }`, matched by depth so nesting is safe."""
    pattern = re.compile(re.escape(name) + r"\s*=\s*\{")
    match = pattern.search(text)
    if match is None:
        return ""
    depth = 0
    start = match.end() - 1
    for index in range(start, len(text)):
        char = text[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start + 1 : index]
    return ""


def registry_keys(root: Path, surface: str) -> set[str]:
    files, names = REGISTRIES[surface]
    keys: set[str] = set()
    for relative in files:
        path = root / relative
        try:
            text = path.read_text(encoding="utf-8")
        except OSError as exc:
            raise CoverageError(f"registry is unreadable: {path}: {exc}") from exc
        for name in names:
            body = object_body(text, name)
            if not body:
                continue
            # Top-level entries only: a nested option object must not read as a
            # helper the surface can draw.
            depth = 0
            for line in body.splitlines():
                stripped = line.strip()
                if depth == 0:
                    entry = re.match(r"""^["']?([A-Za-z][A-Za-z0-9_-]*)["']?\s*:""", stripped)
                    if entry:
                        keys.add(entry.group(1))
                depth += line.count("{") + line.count("[")
                depth -= line.count("}") + line.count("]")
                if depth < 0:
                    depth = 0
    if not keys:
        raise CoverageError(f"no helper keys found for surface {surface!r}")
    return keys


def purposes(root: Path) -> dict[str, str]:
    path = root / "worksheet-html/src/helpers/purposes.js"
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return {}
    found: dict[str, str] = {}
    for key, line in re.findall(
        r"""["']?([A-Za-z][A-Za-z0-9_-]*)["']?\s*:\s*\n?\s*["'](.*?)["'],?\n""",
        text,
    ):
        found.setdefault(key, line)
    return found


def use_key(item: dict) -> tuple[str, str, str]:
    return (
        str(item.get("representationId")),
        str(item.get("configuration")),
        str(item.get("requiredSurface")),
    )


def surface_of(item: dict) -> str:
    return str(item.get("requiredSurface"))


def run_inventory(root: Path, design_path: Path) -> int:
    uses = load_uses(design_path)
    lines = purposes(root)
    print(f"REQUIRED USES {len(uses)}")
    for item in uses:
        bearing = "load-bearing" if item["loadBearing"] else "supporting"
        features = ", ".join(item["requiredFeatures"]) or "none stated"
        print(
            f"- {item['representationId']}/{item['configuration']} "
            f"[{item['requiredSurface']}] {bearing}: "
            f"{item.get('representationName')} - {item.get('description')} "
            f"(must show: {features})"
        )
    for surface in ("slides", "worksheets", "wall", "stick-in"):
        keys = sorted(registry_keys(root, surface))
        print(f"\nLIVE HELPERS {surface} ({len(keys)})")
        for key in keys:
            note = lines.get(key)
            print(f"- {key}: {note}" if note else f"- {key}")
    print("\nHELPER_INVENTORY_OK")
    return 0


def read_decisions(verdict_path: Path) -> list[dict]:
    data = load_json(verdict_path, "helper verdict")
    decisions = data.get("decisions")
    if not isinstance(decisions, list):
        raise CoverageError("helper verdict must have a decisions array")
    return decisions


def run_verdict(root: Path, design_path: Path, verdict_path: Path) -> int:
    uses = load_uses(design_path)
    decisions = read_decisions(verdict_path)
    failures: list[str] = []

    recorded: dict[tuple[str, str, str], dict] = {}
    for index, decision in enumerate(decisions):
        where = f"decisions[{index}]"
        if not isinstance(decision, dict):
            failures.append(f"{where} must be an object")
            continue
        key = use_key(decision)
        if key in recorded:
            failures.append(f"{where} repeats the decision for {'/'.join(key)}")
            continue
        recorded[key] = decision

    required = {use_key(item): item for item in uses}

    for key in sorted(required):
        if key not in recorded:
            failures.append(
                f"{'/'.join(key)} has no recorded decision: every required "
                "representation use needs one of covered, build or substitute"
            )
    for key in sorted(recorded):
        if key not in required:
            failures.append(
                f"{'/'.join(key)} is recorded but the approved design does not "
                "require it"
            )

    for key in sorted(recorded):
        if key not in required:
            continue
        decision = recorded[key]
        label = "/".join(key)
        verdict = decision.get("decision")
        if verdict not in DECISIONS:
            failures.append(
                f"{label} decision must be one of {', '.join(DECISIONS)}"
            )
            continue
        helper_key = decision.get("helperKey")
        reason = decision.get("reason")
        surface = key[2]
        if verdict in ("covered", "build"):
            if not isinstance(helper_key, str) or not helper_key.strip():
                failures.append(f"{label} is {verdict} but names no helperKey")
                continue
        if verdict in ("build", "substitute"):
            if not isinstance(reason, str) or not reason.strip():
                failures.append(f"{label} is {verdict} but records no reason")
        if verdict == "covered":
            if surface not in REGISTRIES:
                failures.append(f"{label} has no known registry for its surface")
                continue
            if helper_key not in registry_keys(root, surface):
                failures.append(
                    f"{label} is covered by {helper_key!r}, which no {surface} "
                    "renderer can draw: treat it as build or substitute"
                )
        if verdict == "build":
            failures.append(
                f"{label} is still marked build: run the helper route, then "
                "record substitute with its reason. A helper built in this run "
                "is written to pending-helper/ and is not live here, so this "
                "lesson's visual comes from the picture route"
            )

    if failures:
        print("HELPER_COVERAGE_FAILED", file=sys.stderr)
        for line in failures:
            print(f"- {line}", file=sys.stderr)
        return 1
    print(f"HELPER_COVERAGE_OK {len(required)}")
    return 0


def spec_keys(value, fields: tuple[str, ...], found: set[str]) -> None:
    if isinstance(value, dict):
        for field in fields:
            item = value.get(field)
            if isinstance(item, str):
                found.add(item)
        for child in value.values():
            spec_keys(child, fields, found)
    elif isinstance(value, list):
        for child in value:
            spec_keys(child, fields, found)


def run_delivery(verdict_path: Path, spec_path: Path, surface: str) -> int:
    if surface not in SPEC_KEY_FIELDS:
        raise CoverageError(f"unknown surface {surface!r}")
    decisions = read_decisions(verdict_path)
    spec = load_json(spec_path, "built specification")
    present: set[str] = set()
    spec_keys(spec, SPEC_KEY_FIELDS[surface], present)

    failures: list[str] = []
    checked = 0
    for decision in decisions:
        if not isinstance(decision, dict):
            continue
        if decision.get("requiredSurface") != surface:
            continue
        if decision.get("decision") != "covered":
            continue
        helper_key = decision.get("helperKey")
        if not isinstance(helper_key, str):
            continue
        checked += 1
        if helper_key not in present:
            failures.append(
                f"{decision.get('representationId')}/"
                f"{decision.get('configuration')} was recorded as drawn by "
                f"{helper_key!r}, but nothing in {spec_path.name} uses it: the "
                "surface shipped a substitute for a visual the lesson depends on"
            )

    if failures:
        print("HELPER_DELIVERY_FAILED", file=sys.stderr)
        for line in failures:
            print(f"- {line}", file=sys.stderr)
        return 1
    print(f"HELPER_DELIVERY_OK {checked}")
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("inventory", "verdict", "delivery"))
    parser.add_argument("--plugin-root")
    parser.add_argument("--lesson-design")
    parser.add_argument("--verdict")
    parser.add_argument("--spec")
    parser.add_argument("--surface")
    args = parser.parse_args(argv)

    root = Path(args.plugin_root).resolve() if args.plugin_root else Path(__file__).resolve().parents[1]

    if args.mode == "inventory":
        if not args.lesson_design:
            raise CoverageError("inventory needs --lesson-design")
        return run_inventory(root, Path(args.lesson_design))

    if args.mode == "verdict":
        if not args.lesson_design or not args.verdict:
            raise CoverageError("verdict needs --lesson-design and --verdict")
        return run_verdict(root, Path(args.lesson_design), Path(args.verdict))

    if not args.verdict or not args.spec or not args.surface:
        raise CoverageError("delivery needs --verdict, --spec and --surface")
    return run_delivery(Path(args.verdict), Path(args.spec), args.surface)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except CoverageError as exc:
        print(f"HELPER_COVERAGE_ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)
