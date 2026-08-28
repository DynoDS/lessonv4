#!/usr/bin/env python3
"""Collect deterministic representation/helper preflight uses from lesson-design.json.

The script resolves representation configurations and emits only mechanical
usage facts. It does not decide whether an existing helper is semantically
faithful; that remains a capability comparison against the existing catalogues.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


class HelperUseError(ValueError):
    pass


def load_design(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise HelperUseError(f"lesson design is unreadable JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise HelperUseError("lesson design root must be an object")
    reps = data.get("representations")
    if not isinstance(reps, list):
        raise HelperUseError("representations must be an array")
    return data


def registry(design: dict) -> dict[tuple[str, str], dict]:
    result = {}
    for rep in design["representations"]:
        if not isinstance(rep, dict) or not isinstance(rep.get("id"), str):
            raise HelperUseError("every representation must have string id")
        configs = rep.get("configurations")
        if not isinstance(configs, list):
            raise HelperUseError(f"{rep['id']}.configurations must be an array")
        for config in configs:
            if not isinstance(config, dict) or not isinstance(config.get("id"), str):
                raise HelperUseError(f"{rep['id']} has invalid configuration")
            result[(rep["id"], config["id"])] = {
                "representationId": rep["id"],
                "representationName": rep.get("name"),
                "configuration": config["id"],
                "description": config.get("description"),
                "loadBearing": config.get("loadBearing") is True,
                "requiredFeatures": list(config.get("requiredFeatures") or []),
            }
    return result


def surface_for(path: tuple[str, ...]) -> str:
    return "worksheets" if path and path[0] == "worksheet" else "slides"


def walk(value, path: tuple[str, ...], reps: set[str], out: list[tuple]) -> None:
    if isinstance(value, dict):
        if (
            isinstance(value.get("ref"), str)
            and value["ref"] in reps
            and isinstance(value.get("configuration"), str)
            and isinstance(value.get("interaction"), str)
        ):
            out.append(
                (
                    value["ref"],
                    value["configuration"],
                    surface_for(path),
                    value["interaction"],
                    ".".join(path),
                )
            )
        visual = value.get("visual")
        if isinstance(visual, dict) and visual.get("kind") == "representation":
            ref = visual.get("representationRef")
            config = visual.get("configuration")
            if isinstance(ref, str) and ref in reps and isinstance(config, str):
                out.append((ref, config, "slides", "view", ".".join(path + ("visual",))))
        for key, child in value.items():
            if path == () and key == "representations":
                continue
            walk(child, path + (str(key),), reps, out)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            walk(child, path + (str(index),), reps, out)


def collect(design: dict) -> list[dict]:
    resolved = registry(design)
    rep_ids = {rep_id for rep_id, _ in resolved}
    raw: list[tuple] = []
    walk(design, (), rep_ids, raw)
    result = []
    seen = set()
    for rep_id, config_id, surface, interaction, source_path in raw:
        key = (rep_id, config_id, surface, interaction)
        if key in seen:
            continue
        seen.add(key)
        config = resolved.get((rep_id, config_id))
        if config is None:
            raise HelperUseError(
                f"unknown configuration {config_id!r} for representation {rep_id!r}"
            )
        item = {
            **config,
            "requiredSurface": surface,
            "interaction": interaction,
            "firstSourcePath": source_path,
        }
        result.append(item)
        if (
            config["loadBearing"]
            and interaction == "pupil-writes-on"
            and surface == "slides"
        ):
            stick_key = (rep_id, config_id, "stick-in", interaction)
            if stick_key not in seen:
                seen.add(stick_key)
                result.append(
                    {
                        **config,
                        "requiredSurface": "stick-in",
                        "interaction": interaction,
                        "firstSourcePath": source_path,
                    }
                )
    return result


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lesson-design", required=True)
    parser.add_argument("--output")
    args = parser.parse_args(argv)
    design = load_design(Path(args.lesson_design))
    payload = {"schemaVersion": 1, "uses": collect(design)}
    text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        Path(args.output).write_text(text, encoding="utf-8")
    print(f"HELPER_USES_OK {len(payload['uses'])}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except HelperUseError as exc:
        print(f"HELPER_USES_ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)
