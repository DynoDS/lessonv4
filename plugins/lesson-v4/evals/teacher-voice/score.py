"""Score Teacher Voice KEEP/REPAIR predictions against separated gold files.

The evaluator inputs deliberately contain no expected labels.  Gold files are
loaded separately and predictions are supplied by the caller, so this module
can be used for blind model runs as well as manual review.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import OrderedDict
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence


DECISIONS = frozenset({"KEEP", "REPAIR"})
SURFACE_LABELS = OrderedDict(
    (
        ("teach_explanation", "Teach explanation accuracy"),
        ("speaker_note", "Speaker-note accuracy"),
        ("success_criteria", "Success-criteria accuracy"),
        ("sticky_knowledge", "Sticky-knowledge accuracy"),
        ("question", "Question accuracy"),
        ("model_answer", "Model-answer accuracy"),
        ("scenario", "Scenario accuracy"),
    )
)

INPUT_FIELDS = frozenset({"id", "year_group", "subject", "wording"})
OPTIONAL_INPUT_FIELDS = frozenset({"surface_type", "beat"})
GOLD_FIELDS = frozenset({"id", "expected", "rationale"})
FORBIDDEN_INPUT_FIELDS = frozenset(
    {"expected", "rationale", "decision", "prediction", "label"}
)


class EvaluationDataError(ValueError):
    """Raised when a fixture or prediction file is not safe to score."""


def _read_json(path: str | Path) -> Any:
    path = Path(path)
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise EvaluationDataError(f"File not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise EvaluationDataError(f"Invalid JSON in {path}: {exc}") from exc


def _case_list(payload: Any, path: str | Path) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        cases = payload
    elif isinstance(payload, dict) and isinstance(payload.get("cases"), list):
        cases = payload["cases"]
    else:
        raise EvaluationDataError(
            f"{path} must contain a top-level cases array (or be an array)"
        )
    if not all(isinstance(case, dict) for case in cases):
        raise EvaluationDataError(f"Every case in {path} must be an object")
    return cases


def _validate_unique_ids(cases: Sequence[Mapping[str, Any]], path: str | Path) -> None:
    ids = [case.get("id") for case in cases]
    if any(not isinstance(case_id, str) or not case_id for case_id in ids):
        raise EvaluationDataError(f"Every case in {path} needs a non-empty string id")
    duplicates = sorted({case_id for case_id in ids if ids.count(case_id) > 1})
    if duplicates:
        raise EvaluationDataError(f"Duplicate case ids in {path}: {', '.join(duplicates)}")


def load_input_cases(path: str | Path) -> list[dict[str, Any]]:
    """Load and validate evaluator input, rejecting leaked gold fields."""

    cases = _case_list(_read_json(path), path)
    _validate_unique_ids(cases, path)
    for case in cases:
        missing = sorted(INPUT_FIELDS - set(case))
        if missing:
            raise EvaluationDataError(
                f"{path} case {case.get('id', '<unknown>')} is missing: {', '.join(missing)}"
            )
        leaked = sorted(FORBIDDEN_INPUT_FIELDS & set(case))
        if leaked:
            raise EvaluationDataError(
                f"{path} case {case['id']} leaks gold/prediction fields: {', '.join(leaked)}"
            )
        if not isinstance(case["wording"], str) or not case["wording"].strip():
            raise EvaluationDataError(f"{path} case {case['id']} needs non-empty wording")
        if "surface_type" in case and case["surface_type"] not in SURFACE_LABELS:
            allowed = ", ".join(SURFACE_LABELS)
            raise EvaluationDataError(
                f"{path} case {case['id']} has unknown surface_type {case['surface_type']!r}; "
                f"expected one of: {allowed}"
            )
    return [dict(case) for case in cases]


def load_gold_cases(path: str | Path) -> list[dict[str, Any]]:
    """Load and validate a gold file, which is intentionally separate."""

    cases = _case_list(_read_json(path), path)
    _validate_unique_ids(cases, path)
    for case in cases:
        missing = sorted(GOLD_FIELDS - set(case))
        if missing:
            raise EvaluationDataError(
                f"{path} case {case.get('id', '<unknown>')} is missing: {', '.join(missing)}"
            )
        if case["expected"] not in DECISIONS:
            raise EvaluationDataError(
                f"{path} case {case['id']} has invalid expected decision {case['expected']!r}"
            )
        if not isinstance(case["rationale"], str) or not case["rationale"].strip():
            raise EvaluationDataError(f"{path} case {case['id']} needs a short rationale")
    return [dict(case) for case in cases]


def merge_cases(paths: Iterable[str | Path], loader) -> list[dict[str, Any]]:
    """Load several fixture files while preserving file and case order."""

    merged: list[dict[str, Any]] = []
    seen: set[str] = set()
    for path in paths:
        for case in loader(path):
            if case["id"] in seen:
                raise EvaluationDataError(f"Duplicate case id across files: {case['id']}")
            seen.add(case["id"])
            merged.append(case)
    if not merged:
        raise EvaluationDataError("At least one non-empty case file is required")
    return merged


def load_predictions(path: str | Path) -> dict[str, str]:
    """Load predictions as ``case id -> KEEP/REPAIR``."""

    payload = _read_json(path)
    if isinstance(payload, dict) and isinstance(payload.get("predictions"), list):
        rows = payload["predictions"]
    elif isinstance(payload, dict) and isinstance(payload.get("cases"), list):
        rows = payload["cases"]
    elif isinstance(payload, list):
        rows = payload
    else:
        raise EvaluationDataError(
            f"{path} must contain a top-level predictions array (or an array)"
        )

    predictions: dict[str, str] = {}
    for row in rows:
        if not isinstance(row, dict):
            raise EvaluationDataError(f"Every prediction in {path} must be an object")
        case_id = row.get("id")
        decision = row.get("decision", row.get("prediction", row.get("label")))
        if not isinstance(case_id, str) or not case_id:
            raise EvaluationDataError(f"Every prediction in {path} needs a non-empty id")
        if case_id in predictions:
            raise EvaluationDataError(f"Duplicate prediction id in {path}: {case_id}")
        if decision not in DECISIONS:
            raise EvaluationDataError(
                f"Prediction {case_id} has invalid decision {decision!r}; expected KEEP or REPAIR"
            )
        predictions[case_id] = decision
    return predictions


def _ratio(correct: int, total: int) -> float | None:
    return None if total == 0 else correct / total


def _validate_alignment(
    inputs: Sequence[Mapping[str, Any]],
    gold: Sequence[Mapping[str, Any]],
    predictions: Mapping[str, str],
) -> None:
    input_ids = {case["id"] for case in inputs}
    gold_ids = {case["id"] for case in gold}
    prediction_ids = set(predictions)
    if input_ids != gold_ids:
        raise EvaluationDataError(
            f"Input/gold IDs differ; missing gold: {sorted(input_ids - gold_ids)}, "
            f"extra gold: {sorted(gold_ids - input_ids)}"
        )
    if input_ids != prediction_ids:
        raise EvaluationDataError(
            f"Input/prediction IDs differ; missing predictions: {sorted(input_ids - prediction_ids)}, "
            f"extra predictions: {sorted(prediction_ids - input_ids)}"
        )


def score(
    inputs: Sequence[Mapping[str, Any]],
    gold: Sequence[Mapping[str, Any]],
    predictions: Mapping[str, str],
) -> dict[str, Any]:
    """Return overall, KEEP/REPAIR, and per-surface accuracy metrics."""

    _validate_alignment(inputs, gold, predictions)
    gold_by_id = {case["id"]: case for case in gold}

    correct = 0
    repair_total = repair_correct = 0
    keep_total = keep_correct = 0
    by_surface: OrderedDict[str, dict[str, Any]] = OrderedDict()
    for surface in SURFACE_LABELS:
        by_surface[surface] = {"total": 0, "correct": 0, "accuracy": None}

    for case in inputs:
        case_id = case["id"]
        expected = gold_by_id[case_id]["expected"]
        predicted = predictions[case_id]
        is_correct = expected == predicted
        correct += int(is_correct)
        if expected == "REPAIR":
            repair_total += 1
            repair_correct += int(is_correct)
        else:
            keep_total += 1
            keep_correct += int(is_correct)
        surface = case.get("surface_type")
        if surface in by_surface:
            surface_metrics = by_surface[surface]
            surface_metrics["total"] += 1
            surface_metrics["correct"] += int(is_correct)

    for surface_metrics in by_surface.values():
        surface_metrics["accuracy"] = _ratio(
            surface_metrics["correct"], surface_metrics["total"]
        )

    report: dict[str, Any] = {
        "total": len(inputs),
        "correct": correct,
        "overall_accuracy": _ratio(correct, len(inputs)),
        "repair_total": repair_total,
        "repair_correct": repair_correct,
        "keep_total": keep_total,
        "keep_correct": keep_correct,
        "catch_rate": _ratio(repair_correct, repair_total),
        "preservation_rate": _ratio(keep_correct, keep_total),
        "surface_accuracy": by_surface,
    }
    for surface, label in SURFACE_LABELS.items():
        report[f"{surface}_accuracy"] = by_surface[surface]["accuracy"]

    # The display labels make the JSON report self-describing while the
    # snake-case keys above are stable for scripts and CI.
    report["metrics"] = OrderedDict(
        [
            ("Overall accuracy", report["overall_accuracy"]),
            ("Catch rate", report["catch_rate"]),
            ("Preservation rate", report["preservation_rate"]),
            *(
                (label, report[f"{surface}_accuracy"])
                for surface, label in SURFACE_LABELS.items()
            ),
        ]
    )
    return report


def _percentage(value: float | None) -> str:
    return "n/a" if value is None else f"{value:.1%}"


def format_markdown(report: Mapping[str, Any]) -> str:
    """Render the requested metrics as a compact human-readable report."""

    lines = [
        "# Teacher Voice score",
        "",
        f"Cases: {report['correct']}/{report['total']} correct",
        "",
        "| Metric | Result |",
        "|---|---:|",
        f"| Overall accuracy | {_percentage(report['overall_accuracy'])} |",
        f"| Catch rate | {_percentage(report['catch_rate'])} |",
        f"| Preservation rate | {_percentage(report['preservation_rate'])} |",
    ]
    for surface, label in SURFACE_LABELS.items():
        lines.append(f"| {label} | {_percentage(report[f'{surface}_accuracy'])} |")
    return "\n".join(lines)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--cases",
        action="append",
        required=True,
        help="Evaluator input JSON. Repeat to score multiple sets.",
    )
    parser.add_argument(
        "--gold",
        action="append",
        required=True,
        help="Gold JSON matching each input set. Repeat in the same order.",
    )
    parser.add_argument("--predictions", required=True, help="Prediction JSON")
    parser.add_argument("--format", choices=("json", "markdown"), default="json")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        if len(args.cases) != len(args.gold):
            raise EvaluationDataError(
                "Pass the same number of --cases and --gold files, in matching order"
            )
        inputs = merge_cases(args.cases, load_input_cases)
        gold = merge_cases(args.gold, load_gold_cases)
        predictions = load_predictions(args.predictions)
        report = score(inputs, gold, predictions)
    except EvaluationDataError as exc:
        print(f"teacher-voice score: {exc}", file=sys.stderr)
        return 2

    if args.format == "markdown":
        print(format_markdown(report))
    else:
        print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
