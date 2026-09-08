"""Tests for the deterministic Design Reviewer packet."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PACKET = ROOT / "scripts" / "design-review-packet.py"
VALIDATOR = ROOT / "scripts" / "validate-lesson-design.py"
PREFERENCES = ROOT / "references" / "preferences.md"
DO_BEATS = ROOT / "references" / "do-beats.md"
SKILL_ROUTE = (
    ROOT
    / "references"
    / "teaching-sequence-skill-based.md"
)
SCIENCE_REFERENCE = (
    ROOT
    / "references"
    / "subject-science.md"
)
BEHAVIOUR_CASES = (
    ROOT
    / "scripts"
    / "tests"
    / "fixtures"
    / "design-reviewer-behaviour-cases.json"
)
FIXTURES_FILE = (
    ROOT
    / "scripts"
    / "tests"
    / "test_lesson_design_contract.py"
)

fixture_spec = importlib.util.spec_from_file_location(
    "lesson_design_contract_fixtures",
    FIXTURES_FILE,
)
assert fixture_spec and fixture_spec.loader
fixtures = importlib.util.module_from_spec(
    fixture_spec
)
fixture_spec.loader.exec_module(
    fixtures
)


def test_behaviour_regression_map_covers_material_boundaries():
    payload = json.loads(
        BEHAVIOUR_CASES.read_text(
            encoding="utf-8"
        )
    )
    assert payload["schemaVersion"] == 1
    assert (
        payload["kind"]
        == "design-reviewer-behaviour-cases"
    )
    ids = {
        row["id"]
        for row in payload["cases"]
    }
    assert {
        "curriculum-drift",
        "later-formalism-competes-with-current-learning",
        "required-formalism-is-taught-and-practised",
        "sound-alternative-design",
        "new-skill-omits-needed-guidance",
        "secure-skill-justifiably-omits-guidance",
        "independent-work-repeats-model-answer-path",
        "worksheet-repeats-board-decisions",
        "dialogic-question-has-predetermined-answer",
        "discovery-lacks-safe-dependable-exploration",
        "task-centred-route-is-ordinary-practice",
        "photo-physical-state-contradiction",
        "downstream-layout-preference-only",
        "schema-invalid",
        "genuine-teacher-choice",
        "activities-do-not-share-a-learning-centre",
        "surface-cue-check-mimics-understanding",
        "success-criteria-list-facts-not-performance",
        "equipment-practical-omits-specific-safety",
    } <= ids


def write_science_contract(
    working_dir: Path,
    *,
    photo_count: int = 2,
) -> tuple[dict, dict]:
    design, photos = fixtures.valid_contract()

    design["lesson"]["subject"] = "Science"

    photo_ids = [
        f"photo-{index:03d}"
        for index in range(
            1,
            photo_count + 1,
        )
    ]

    design["starter"]["photoRefs"] = list(
        photo_ids
    )

    photos["schema_version"] = 2
    photos["lesson_name"] = (
        "Design Review packet test"
    )
    photos["photos"] = [
        {
            "id": photo_id,
            "subject": (
                "A clear classroom science "
                f"photograph {position}"
            ),
            "pedagogical_constraint": "",
            "teaching_requirement": (
                "Show the named science "
                f"feature {position}."
            ),
            "load_bearing_evidence": [
                f"Children need photograph {position}."
            ],
            "use": "slide",
            "essential": True,
            "filename": (
                "unsplash/"
                f"science-{position:03d}.jpg"
            ),
            "acquisition_mode": "ordinary-real",
            "source_profile": "unsplash-only",
            "fallback_action": "ai",
            "fallback_note": None,
            "generation_prompt": {
                "physical_state": "the subject shown whole and unobstructed",
                "must_avoid": ["a second subject"],
                "text_rule": "no readable text, labels, logos or branding",
                "composition": "the whole subject in one clear frame",
            },
            "coherent_group": None,
            "coherent_mode": "none",
            "coherent_visual_invariants": [],
        }
        for position, photo_id in enumerate(
            photo_ids,
            1,
        )
    ]

    (
        working_dir
        / "lesson-design.json"
    ).write_text(
        json.dumps(
            design,
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    (
        working_dir
        / "photo-requirements.json"
    ).write_text(
        json.dumps(
            photos,
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    (
        working_dir
        / "design-decisions.md"
    ).write_text(
        "- Structure: Skill-based\n"
        "- Worksheet: separate fresh practice\n",
        encoding="utf-8",
    )
    (
        working_dir
        / "teacher-brief.txt"
    ).write_text(
        "Year 4 Science lesson\n",
        encoding="utf-8",
    )

    return design, photos


def voice_sweep_line(
    working_dir: Path,
    *,
    read_count: int | None = None,
    repaired: int = 0,
) -> str:
    """The receipt line a review must carry, counted from the prepared view."""
    view = working_dir / "design-review-view.md"
    count, year = 0, 4
    if view.exists():
        for line in view.read_text(encoding="utf-8").splitlines():
            match = re.match(
                r"^(\d+) child-facing strings for a Year (\d+) class\.",
                line.strip(),
            )
            if match:
                count, year = int(match.group(1)), int(match.group(2))
                break
    if read_count is not None:
        count = read_count
    return (
        f"Read {count} child-facing strings as a Year {year} child; "
        f"repaired {repaired}."
    )


def write_review(
    working_dir: Path,
    result: str,
    *,
    voice_sweep: str | None = None,
) -> Path:
    path = (
        working_dir
        / "design-review.md"
    )
    if voice_sweep is None:
        voice_sweep = voice_sweep_line(working_dir)

    if result == "APPROVED":
        redesign_required = "- None.\n\n"
    else:
        redesign_required = (
            "- Lesson | Defect: learning and scope | "
            "Evidence: the fixture drifts from its objective | "
            "Impact: the intended learning is not taught | "
            "Required outcome: restore objective alignment | "
            "Owner: Lesson Designer | Preserve: valid structure.\n\n"
        )

    path.write_text(
        "# Design Review - Packet Test - 2026-08-24\n\n"
        "## Result\n"
        f"`{result}`\n\n"
        "## Corrections made\n"
        "- None.\n\n"
        "## Redesign required\n"
        f"{redesign_required}"
        "## Flags for the teacher\n"
        "- None.\n\n"
        "## Voice sweep\n"
        f"{voice_sweep}\n\n"
        "## Judgements\n"
        f"Pedagogy: {'PASS' if result == 'APPROVED' else 'REVISE'}\n"
        "Daniel-fit: PASS\n",
        encoding="utf-8",
    )
    return path


def write_photos(
    working_dir: Path,
    photos: dict,
) -> None:
    (
        working_dir
        / "photo-requirements.json"
    ).write_text(
        json.dumps(
            photos,
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def test_later_review_preserves_retired_frozen_photo_but_checks_live_refs():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        design, _ = write_science_contract(working_dir)
        design["starter"]["photoRefs"] = ["photo-002"]
        design_path = working_dir / "lesson-design.json"
        design_path.write_text(json.dumps(design), encoding="utf-8")
        initial, _, _ = prepare(working_dir)
        assert initial.returncode != 0, "Initial review must reject unused photos"

        canonical = working_dir / "photo-requirements.json"
        snapshot = working_dir / "phase2-initial-photo-requirements.json"
        snapshot.write_bytes(canonical.read_bytes())
        receipt_path = working_dir / "phase2-initial-photo-requirements.receipt.json"
        receipt = {
            "schemaVersion": 1,
            "canonicalPath": str(canonical),
            "snapshotPath": str(snapshot),
            "sha256": hashlib.sha256(snapshot.read_bytes()).hexdigest(),
        }
        receipt_path.write_text(json.dumps(receipt), encoding="utf-8")
        later, preflight, _ = prepare(working_dir)
        assert later.returncode == 0, later.stderr
        assert "--initial-photo-namespace" not in json.loads(
            preflight.read_text(encoding="utf-8")
        )["validator"]["command"]

        design["starter"]["photoRefs"] = ["photo-999"]
        design_path.write_text(json.dumps(design), encoding="utf-8")
        dangling, _, _ = prepare(working_dir)
        assert dangling.returncode != 0, "Later review must still reject dangling refs"

        receipt["sha256"] = "0" * 64
        receipt_path.write_text(json.dumps(receipt), encoding="utf-8")
        invalid, _, _ = prepare(working_dir)
        assert invalid.returncode != 0
        assert "Invalid Phase 2 photo freeze receipt" in invalid.stderr


def run_packet(
    *arguments: str,
) -> subprocess.CompletedProcess:
    return subprocess.run(
        [
            sys.executable,
            str(PACKET),
            *arguments,
        ],
        capture_output=True,
        text=True,
    )


def prepare(
    working_dir: Path,
    *,
    plugin_root: Path = ROOT,
    job_id: str | None = None,
    dependency_job_id: str | None = None,
    job_spec_output: Path | None = None,
    job_manifest_output: Path | None = None,
) -> tuple[
    subprocess.CompletedProcess,
    Path,
    Path,
]:
    preflight = (
        working_dir
        / "design-review-preflight.json"
    )
    reference = (
        working_dir
        / "design-review-reference.md"
    )
    view = (
        working_dir
        / "design-review-view.md"
    )

    arguments = [
        "prepare",
        "--plugin-root",
        str(plugin_root),
        "--working-dir",
        str(working_dir),
        "--preflight-output",
        str(preflight),
        "--reference-output",
        str(reference),
        "--view-output",
        str(view),
        "--teacher-brief",
        str(
            (
                working_dir
                / "teacher-brief.txt"
            ).resolve()
        ),
    ]
    controller_values = (
        job_id,
        dependency_job_id,
        job_spec_output,
        job_manifest_output,
    )
    if all(value is not None for value in controller_values):
        arguments.extend(
            [
                "--job-id",
                str(job_id),
                "--dependency-job-id",
                str(dependency_job_id),
                "--job-spec-output",
                str(job_spec_output),
                "--job-manifest-output",
                str(job_manifest_output),
            ]
        )
    result = run_packet(*arguments)

    return result, preflight, reference


def verify(
    working_dir: Path,
    preflight: Path,
    reference: Path,
    review: Path,
    *,
    plugin_root: Path = ROOT,
) -> tuple[
    subprocess.CompletedProcess,
    Path,
]:
    postflight = (
        working_dir
        / "design-review-postflight.json"
    )
    view = (
        working_dir
        / "design-review-view.md"
    )

    result = run_packet(
        "verify",
        "--plugin-root",
        str(plugin_root),
        "--working-dir",
        str(working_dir),
        "--preflight",
        str(preflight),
        "--reference",
        str(reference),
        "--view",
        str(view),
        "--review",
        str(review),
        "--postflight-output",
        str(postflight),
    )

    return result, postflight


def copy_packet_plugin_root(
    destination: Path,
) -> Path:
    plugin_root = destination / "lesson-resources"
    (plugin_root / "scripts").mkdir(
        parents=True
    )
    (plugin_root / "references").mkdir(
        parents=True
    )

    for source in (
        ROOT / "scripts" / "validate-lesson-design.py",
        ROOT / "scripts" / "check-photo-cap.py",
    ):
        shutil.copy2(
            source,
            plugin_root / "scripts" / source.name,
        )

    for source in (
        PREFERENCES,
        DO_BEATS,
        SKILL_ROUTE,
        SCIENCE_REFERENCE,
    ):
        shutil.copy2(
            source,
            plugin_root / "references" / source.name,
        )

    return plugin_root


def test_prepare_writes_compact_hash_bound_routing_reference():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(
            working_dir
        )

        (
            result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )

        assert result.returncode == 0, (
            result.stdout + result.stderr
        )
        assert (
            result.stdout.strip()
            == "DESIGN_REVIEW_PREFLIGHT_OK"
        )
        assert preflight.is_file()
        assert reference.is_file()

        view = (
            working_dir
            / "design-review-view.md"
        )
        assert view.is_file()

        packet = json.loads(
            preflight.read_text(
                encoding="utf-8"
            )
        )

        assert packet["schemaVersion"] == 1
        assert (
            packet["kind"]
            == "design-review-preflight"
        )
        assert (
            packet["validator"]["status"]
            == "OK"
        )
        assert (
            packet["validator"][
                "expectedMarker"
            ]
            == "LESSON_DESIGN_OK"
        )
        assert (
            packet["photoCap"]["count"]
            == 2
        )
        assert (
            packet["photoCap"]["maximum"]
            == 16
        )
        assert (
            packet["derived"]["photoIds"]
            == [
                "photo-001",
                "photo-002",
            ]
        )
        assert packet[
            "protectedPhotoBaseline"
        ] == [
            {
                "position": 1,
                "id": "photo-001",
                "filename": (
                    "unsplash/"
                    "science-001.jpg"
                ),
                "essential": True,
            },
            {
                "position": 2,
                "id": "photo-002",
                "filename": (
                    "unsplash/"
                    "science-002.jpg"
                ),
                "essential": True,
            },
        ]
        assert (
            packet["reviewView"]["path"]
            == str(view.resolve())
        )
        assert (
            len(packet["reviewView"]["sha256"])
            == 64
        )
        assert (
            packet["reviewReference"][
                "sources"
            ]["preferences"]["scope"]
            == "conditional sections by exact heading"
        )
        assert (
            packet["reviewReference"]["sources"]
            ["doBeats"]["scope"]
            == "decision-point activity section only"
        )
        assert (
            packet["reviewReference"]["sources"]
            ["teachingSequence"]["scope"]
            == "file start through the line before ## Output Format Block"
        )
        assert (
            packet["reviewReference"]["sources"]
            ["subject"]["scope"]
            == "complete file"
        )
        assert "notChecked" not in packet

        reference_text = (
            reference.read_text(
                encoding="utf-8"
            )
        )
        preferences_text = (
            PREFERENCES.read_text(
                encoding="utf-8"
            ).rstrip()
        )

        assert preferences_text not in reference_text
        assert "## Slide Philosophy" not in reference_text
        assert (
            "## Slide Headings (Child-Facing Labels)"
            not in reference_text
        )
        assert "## Trusted deterministic receipt" in reference_text
        assert "## Conditional teacher-preference routing" in reference_text
        assert str(SKILL_ROUTE.resolve()) in reference_text
        assert str(SCIENCE_REFERENCE.resolve()) in reference_text
        assert len(reference_text) < len(preferences_text) * 0.2
        assert "## 1. Recall" not in reference_text

        view_text = view.read_text(
            encoding="utf-8"
        )
        assert "# Design Review View" in view_text
        assert (
            "This is a read-only review surface, "
            "not a second authority."
            in view_text
        )
        assert "## Teaching sequence" in view_text
        assert (
            "### My Turn "
            "(`lesson-section/teaching-sequence/unit-001`)"
            in view_text
        )
        assert (
            "Watch how I partition each number first."
            in view_text
        )
        assert "## Worksheet" in view_text
        assert "Add 34 + 25." in view_text
        assert "## Planned photographs" in view_text
        assert (
            "A clear classroom science photograph 1"
            in view_text
        )
        assert (
            view_text.count(
                "A clear classroom science photograph 1"
            )
            == 1
        )
        assert "- Planned-photograph refs: `photo-001`" in view_text
        assert "filename" not in view_text
        assert (
            "Worksheet: separate fresh practice"
            not in view_text
        )


def test_prepare_writes_immutable_design_review_job_manifest():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(working_dir)
        job_spec = working_dir / "orchestration-jobs" / "phase1-design-review.json"
        manifest = (
            working_dir
            / "orchestration-jobs"
            / "phase1-design-review-manifest.json"
        )
        arguments = {
            "job_id": "phase1-design-review",
            "dependency_job_id": "phase1-lesson-design",
            "job_spec_output": job_spec,
            "job_manifest_output": manifest,
        }

        result, preflight, reference = prepare(working_dir, **arguments)
        assert result.returncode == 0, result.stderr
        spec = json.loads(job_spec.read_text())
        outputs = [
            str((working_dir / "lesson-design.json").resolve()),
            str((working_dir / "design-decisions.md").resolve()),
            str((working_dir / "photo-requirements.json").resolve()),
            str((working_dir / "design-review.md").resolve()),
        ]
        assert spec["jobId"] == "phase1-design-review"
        assert spec["kind"] == "design-review"
        assert spec["executionClass"] == "worker"
        assert spec["capacityClass"] == "general"
        assert spec["dependencies"] == ["phase1-lesson-design"]
        assert spec["writePaths"] == outputs
        assert spec["attempt"]["expectedOutputs"] == outputs
        assert spec["attempt"]["outputsByDeclaredState"] == {
            "APPROVED": outputs,
            "REDESIGN REQUIRED": outputs,
        }
        view = (
            working_dir
            / "design-review-view.md"
        ).resolve()
        teacher_brief = (
            working_dir
            / "teacher-brief.txt"
        ).resolve()
        assert spec["sourcePaths"] == [
            str(reference),
            str(view),
            str(PREFERENCES.resolve()),
            str(DO_BEATS.resolve()),
            str(SKILL_ROUTE.resolve()),
            str(SCIENCE_REFERENCE.resolve()),
            str(teacher_brief),
        ]
        assert spec["attempt"]["inputs"] == [
            {"sourcePath": outputs[0], "mode": "read-write"},
            {"sourcePath": outputs[1], "mode": "read-write"},
            {"sourcePath": outputs[2], "mode": "read-write"},
            {"sourcePath": str(reference), "mode": "read-only"},
            {"sourcePath": str(view), "mode": "read-only"},
            {"sourcePath": str(PREFERENCES.resolve()), "mode": "read-only"},
            {"sourcePath": str(DO_BEATS.resolve()), "mode": "read-only"},
            {"sourcePath": str(SKILL_ROUTE.resolve()), "mode": "read-only"},
            {"sourcePath": str(SCIENCE_REFERENCE.resolve()), "mode": "read-only"},
            {"sourcePath": str(teacher_brief), "mode": "read-only"},
        ]
        manifest_payload = json.loads(manifest.read_text())
        assert manifest_payload["sourceJobId"] == "phase1-lesson-design"
        assert manifest_payload["jobs"][0]["spec"] == spec
        assert manifest_payload["jobs"][0]["specSha256"] == hashlib.sha256(
            job_spec.read_bytes()
        ).hexdigest()

        first_spec = job_spec.read_bytes()
        first_manifest = manifest.read_bytes()
        second, _, _ = prepare(working_dir, **arguments)
        assert second.returncode == 0, second.stderr
        assert job_spec.read_bytes() == first_spec
        assert manifest.read_bytes() == first_manifest


def test_prepare_records_every_optional_reviewer_input():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(working_dir)

        clarification_dir = (
            working_dir
            / "teacher-clarifications"
        )
        clarification_dir.mkdir()
        clarification = (
            clarification_dir
            / "001.txt"
        )
        clarification.write_text(
            "Keep the practical task.\n",
            encoding="utf-8",
        )
        context = (
            working_dir
            / "orchestrator-context.md"
        )
        context.write_text(
            "The lesson follows last week's work.\n",
            encoding="utf-8",
        )
        lesson_plan = (
            working_dir
            / "supplied-plan.txt"
        )
        lesson_plan.write_text(
            "Teacher lesson plan\n",
            encoding="utf-8",
        )
        worksheet = (
            working_dir
            / "supplied-worksheet.txt"
        )
        worksheet.write_text(
            "Teacher worksheet\n",
            encoding="utf-8",
        )

        job_spec = (
            working_dir
            / "orchestration-jobs"
            / "phase1-design-review.json"
        )
        manifest = (
            working_dir
            / "orchestration-jobs"
            / "phase1-design-review-manifest.json"
        )
        preflight = (
            working_dir
            / "design-review-preflight.json"
        )
        reference = (
            working_dir
            / "design-review-reference.md"
        )
        view = (
            working_dir
            / "design-review-view.md"
        )

        result = run_packet(
            "prepare",
            "--plugin-root",
            str(ROOT),
            "--working-dir",
            str(working_dir),
            "--preflight-output",
            str(preflight),
            "--reference-output",
            str(reference),
            "--view-output",
            str(view),
            "--teacher-brief",
            str(
                working_dir
                / "teacher-brief.txt"
            ),
            "--teacher-clarification",
            str(clarification),
            "--orchestrator-context",
            str(context),
            "--lesson-plan-input",
            str(lesson_plan),
            "--teacher-worksheet-input",
            str(worksheet),
            "--job-id",
            "phase1-design-review",
            "--dependency-job-id",
            "phase1-lesson-design",
            "--job-spec-output",
            str(job_spec),
            "--job-manifest-output",
            str(manifest),
        )

        assert result.returncode == 0, result.stderr
        spec = json.loads(
            job_spec.read_text(
                encoding="utf-8"
            )
        )
        expected_read_only = [
            str(reference.resolve()),
            str(view.resolve()),
            str(PREFERENCES.resolve()),
            str(DO_BEATS.resolve()),
            str(SKILL_ROUTE.resolve()),
            str(SCIENCE_REFERENCE.resolve()),
            str(
                (
                    working_dir
                    / "teacher-brief.txt"
                ).resolve()
            ),
            str(clarification.resolve()),
            str(context.resolve()),
            str(lesson_plan.resolve()),
            str(worksheet.resolve()),
        ]

        assert spec["sourcePaths"] == expected_read_only
        assert [
            row["sourcePath"]
            for row in spec["attempt"]["inputs"]
            if row["mode"] == "read-only"
        ] == expected_read_only


def test_prepare_review_view_is_deterministic_for_same_inputs():
    with (
        tempfile.TemporaryDirectory() as first_tmp,
        tempfile.TemporaryDirectory() as second_tmp,
    ):
        first_dir = Path(first_tmp)
        second_dir = Path(second_tmp)

        write_science_contract(first_dir)
        write_science_contract(second_dir)

        first_result, _, _ = prepare(first_dir)
        second_result, _, _ = prepare(second_dir)

        assert first_result.returncode == 0, (
            first_result.stdout
            + first_result.stderr
        )
        assert second_result.returncode == 0, (
            second_result.stdout
            + second_result.stderr
        )

        first_view = (
            first_dir
            / "design-review-view.md"
        ).read_text(
            encoding="utf-8"
        )
        second_view = (
            second_dir
            / "design-review-view.md"
        ).read_text(
            encoding="utf-8"
        )

        assert first_view == second_view


def test_prepare_requires_all_controller_manifest_arguments_together():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(working_dir)
        preflight = working_dir / "design-review-preflight.json"
        reference = working_dir / "design-review-reference.md"
        view = working_dir / "design-review-view.md"
        preflight.write_text("preflight-marker\n", encoding="utf-8")
        reference.write_text("reference-marker\n", encoding="utf-8")
        view.write_text("view-marker\n", encoding="utf-8")
        job_spec = working_dir / "orchestration-jobs" / "review.json"
        manifest = working_dir / "orchestration-jobs" / "manifest.json"

        result = run_packet(
            "prepare",
            "--plugin-root",
            str(ROOT),
            "--working-dir",
            str(working_dir),
            "--preflight-output",
            str(preflight),
            "--reference-output",
            str(reference),
            "--view-output",
            str(view),
            "--teacher-brief",
            str(
                (
                    working_dir
                    / "teacher-brief.txt"
                ).resolve()
            ),
            "--job-id",
            "phase1-design-review",
            "--job-spec-output",
            str(job_spec),
        )
        assert result.returncode == 1
        assert "must be supplied together" in result.stderr
        assert not job_spec.exists()
        assert not manifest.exists()
        assert preflight.read_text() == "preflight-marker\n"
        assert reference.read_text() == "reference-marker\n"
        assert view.read_text() == "view-marker\n"

        normal, _, _ = prepare(working_dir)
        assert normal.returncode == 0, normal.stderr
        assert normal.stdout.strip() == "DESIGN_REVIEW_PREFLIGHT_OK"


def test_prepare_preserves_photo_cap_failure():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(
            working_dir,
            photo_count=17,
        )

        (
            result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )

        assert result.returncode == 1
        assert (
            "PHOTO_CAP_EXCEEDED"
            in result.stderr
            or "at most 16 photos"
            in result.stderr
        )
        assert not preflight.exists()
        assert not reference.exists()


def test_prepare_requires_design_decisions():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(
            working_dir
        )
        (
            working_dir
            / "design-decisions.md"
        ).unlink()

        (
            result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )

        assert result.returncode == 1
        assert (
            "designDecisions is missing"
            in result.stderr
        )
        assert not preflight.exists()
        assert not reference.exists()


def test_verify_accepts_permitted_local_changes_and_records_essential_change():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        design, photos = (
            write_science_contract(
                working_dir
            )
        )

        (
            prepare_result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )
        assert (
            prepare_result.returncode
            == 0
        )

        design["flagsForTeacher"].append(
            "Check the optional photograph choice."
        )
        photos["photos"][0]["subject"] = (
            "A clearer classroom science photograph"
        )
        photos["photos"][0][
            "essential"
        ] = False

        (
            working_dir
            / "lesson-design.json"
        ).write_text(
            json.dumps(
                design,
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )

        write_photos(
            working_dir,
            photos,
        )

        (
            working_dir
            / "design-decisions.md"
        ).write_text(
            "- Structure: Skill-based\n"
            "- Worksheet: separate fresh practice\n"
            "- Record: one stale line corrected\n",
            encoding="utf-8",
        )

        review = write_review(
            working_dir,
            "APPROVED",
        )

        (
            result,
            postflight,
        ) = verify(
            working_dir,
            preflight,
            reference,
            review,
        )

        assert result.returncode == 0, (
            result.stdout + result.stderr
        )
        assert (
            result.stdout.strip()
            == "DESIGN_REVIEW_POSTFLIGHT_OK"
        )

        report = json.loads(
            postflight.read_text(
                encoding="utf-8"
            )
        )

        assert report["result"] == "OK"
        assert (
            report["reviewResult"]
            == "APPROVED"
        )
        assert (
            report["reviewView"]["path"]
            == str(
                (
                    working_dir
                    / "design-review-view.md"
                ).resolve()
            )
        )
        assert (
            report[
                "protectedPhotoTransition"
            ]["orderAndIdentityUnchanged"]
            is True
        )
        assert (
            report[
                "protectedPhotoTransition"
            ]["essentialChanges"]
            == [
                {
                    "position": 1,
                    "id": "photo-001",
                    "before": True,
                    "after": False,
                }
            ]
        )


def test_verify_accepts_redesign_required_result():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(
            working_dir
        )

        (
            prepare_result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )
        assert (
            prepare_result.returncode
            == 0
        )

        review = write_review(
            working_dir,
            "REDESIGN REQUIRED",
        )

        (
            result,
            postflight,
        ) = verify(
            working_dir,
            preflight,
            reference,
            review,
        )

        assert result.returncode == 0, (
            result.stdout + result.stderr
        )

        report = json.loads(
            postflight.read_text(
                encoding="utf-8"
            )
        )
        assert (
            report["reviewResult"]
            == "REDESIGN REQUIRED"
        )


def test_verify_rejects_protected_filename_change_that_validator_accepts():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        _, photos = write_science_contract(
            working_dir
        )

        (
            prepare_result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )
        assert (
            prepare_result.returncode
            == 0
        )

        photos["photos"][0][
            "filename"
        ] = "unsplash/replaced.jpg"
        write_photos(
            working_dir,
            photos,
        )

        validator_result = subprocess.run(
            [
                sys.executable,
                str(VALIDATOR),
                "--initial-photo-namespace",
                str(
                    working_dir
                    / "lesson-design.json"
                ),
                str(
                    working_dir
                    / "photo-requirements.json"
                ),
            ],
            capture_output=True,
            text=True,
        )

        assert (
            validator_result.returncode
            == 0
        )
        assert (
            validator_result.stdout.strip()
            == "LESSON_DESIGN_OK"
        )

        review = write_review(
            working_dir,
            "APPROVED",
        )

        (
            result,
            postflight,
        ) = verify(
            working_dir,
            preflight,
            reference,
            review,
        )

        assert result.returncode == 1
        assert (
            "protected photo filename changed"
            in result.stderr
        )
        assert not postflight.exists()


def test_verify_rejects_protected_id_change():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        _, photos = write_science_contract(
            working_dir
        )

        (
            prepare_result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )
        assert prepare_result.returncode == 0

        photos["photos"][0]["id"] = "photo-099"
        write_photos(
            working_dir,
            photos,
        )
        review = write_review(
            working_dir,
            "APPROVED",
        )

        (
            result,
            postflight,
        ) = verify(
            working_dir,
            preflight,
            reference,
            review,
        )

        assert result.returncode == 1
        assert (
            "protected photo id changed"
            in result.stderr
        )
        assert not postflight.exists()


def test_verify_rejects_protected_order_change():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        _, photos = write_science_contract(
            working_dir
        )

        (
            prepare_result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )
        assert prepare_result.returncode == 0

        photos["photos"].reverse()
        write_photos(
            working_dir,
            photos,
        )
        review = write_review(
            working_dir,
            "APPROVED",
        )

        (
            result,
            postflight,
        ) = verify(
            working_dir,
            preflight,
            reference,
            review,
        )

        assert result.returncode == 1
        assert (
            "protected photo id changed at position 1"
            in result.stderr
        )
        assert not postflight.exists()


def test_verify_rejects_protected_count_change():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        _, photos = write_science_contract(
            working_dir
        )

        (
            prepare_result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )
        assert prepare_result.returncode == 0

        photos["photos"].pop()
        write_photos(
            working_dir,
            photos,
        )
        review = write_review(
            working_dir,
            "APPROVED",
        )

        (
            result,
            postflight,
        ) = verify(
            working_dir,
            preflight,
            reference,
            review,
        )

        assert result.returncode == 1
        assert (
            "protected photo count changed"
            in result.stderr
        )
        assert not postflight.exists()


def test_verify_rejects_malformed_photo_entry_without_traceback():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        _, photos = write_science_contract(
            working_dir
        )

        (
            prepare_result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )
        assert prepare_result.returncode == 0

        photos["photos"][0] = None
        write_photos(
            working_dir,
            photos,
        )

        review = write_review(
            working_dir,
            "APPROVED",
        )

        (
            result,
            postflight,
        ) = verify(
            working_dir,
            preflight,
            reference,
            review,
        )

        assert result.returncode == 1
        assert (
            "photo-requirements.json photos "
            "entries must be objects"
            in result.stderr
        )
        assert "Traceback" not in result.stderr
        assert not postflight.exists()


def test_verify_rejects_changed_runtime_reference():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(
            working_dir
        )

        (
            prepare_result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )
        assert prepare_result.returncode == 0

        reference.write_text(
            reference.read_text(
                encoding="utf-8"
            )
            + "\nchanged\n",
            encoding="utf-8",
        )

        review = write_review(
            working_dir,
            "APPROVED",
        )

        (
            result,
            postflight,
        ) = verify(
            working_dir,
            preflight,
            reference,
            review,
        )

        assert result.returncode == 1
        assert (
            "design-review-reference.md "
            "changed after preflight"
            in result.stderr
        )
        assert not postflight.exists()


def test_verify_rejects_changed_review_view():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(
            working_dir
        )

        (
            prepare_result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )
        assert (
            prepare_result.returncode
            == 0
        )

        view = (
            working_dir
            / "design-review-view.md"
        )
        view.write_text(
            view.read_text(
                encoding="utf-8"
            )
            + "\nchanged after preflight\n",
            encoding="utf-8",
        )

        review = write_review(
            working_dir,
            "APPROVED",
        )

        (
            result,
            postflight,
        ) = verify(
            working_dir,
            preflight,
            reference,
            review,
        )

        assert result.returncode == 1
        assert (
            "design-review-view.md changed after preflight"
            in result.stderr
        )
        assert not postflight.exists()


def test_verify_rejects_changed_canonical_preferences_source():
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        plugin_root = copy_packet_plugin_root(
            tmp_path
        )
        working_dir = tmp_path / "working"
        working_dir.mkdir()
        write_science_contract(
            working_dir
        )

        (
            prepare_result,
            preflight,
            reference,
        ) = prepare(
            working_dir,
            plugin_root=plugin_root,
        )
        assert prepare_result.returncode == 0

        preferences = (
            plugin_root
            / "references"
            / "preferences.md"
        )
        preferences.write_text(
            preferences.read_text(
                encoding="utf-8"
            )
            + "\nchanged\n",
            encoding="utf-8",
        )

        review = write_review(
            working_dir,
            "APPROVED",
        )

        (
            result,
            postflight,
        ) = verify(
            working_dir,
            preflight,
            reference,
            review,
            plugin_root=plugin_root,
        )

        assert result.returncode == 1
        assert (
            "canonical preferences.md changed "
            "after preflight"
            in result.stderr
        )
        assert not postflight.exists()


def test_verify_rejects_changed_selected_route_source():
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        plugin_root = copy_packet_plugin_root(
            tmp_path
        )
        working_dir = tmp_path / "working"
        working_dir.mkdir()
        write_science_contract(working_dir)

        prepare_result, preflight, reference = prepare(
            working_dir,
            plugin_root=plugin_root,
        )
        assert prepare_result.returncode == 0

        route = (
            plugin_root
            / "references"
            / SKILL_ROUTE.name
        )
        route.write_text(
            route.read_text(encoding="utf-8")
            + "\nchanged\n",
            encoding="utf-8",
        )
        review = write_review(
            working_dir,
            "APPROVED",
        )

        result, postflight = verify(
            working_dir,
            preflight,
            reference,
            review,
            plugin_root=plugin_root,
        )
        assert result.returncode == 1
        assert (
            "canonical teaching-sequence-skill-based.md "
            "changed after preflight"
            in result.stderr
        )
        assert not postflight.exists()


def test_verify_rejects_changed_selected_subject_source():
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        plugin_root = copy_packet_plugin_root(
            tmp_path
        )
        working_dir = tmp_path / "working"
        working_dir.mkdir()
        write_science_contract(working_dir)

        prepare_result, preflight, reference = prepare(
            working_dir,
            plugin_root=plugin_root,
        )
        assert prepare_result.returncode == 0

        subject = (
            plugin_root
            / "references"
            / SCIENCE_REFERENCE.name
        )
        subject.write_text(
            subject.read_text(encoding="utf-8")
            + "\nchanged\n",
            encoding="utf-8",
        )
        review = write_review(
            working_dir,
            "APPROVED",
        )

        result, postflight = verify(
            working_dir,
            preflight,
            reference,
            review,
            plugin_root=plugin_root,
        )
        assert result.returncode == 1
        assert (
            "canonical subject-science.md changed after preflight"
            in result.stderr
        )
        assert not postflight.exists()


def test_verify_rejects_invalid_review_result():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(
            working_dir
        )

        (
            prepare_result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )
        assert prepare_result.returncode == 0

        review = write_review(
            working_dir,
            "PENDING",
        )

        (
            result,
            postflight,
        ) = verify(
            working_dir,
            preflight,
            reference,
            review,
        )

        assert result.returncode == 1
        assert (
            "Result must be exactly APPROVED "
            "or REDESIGN REQUIRED"
            in result.stderr
        )
        assert not postflight.exists()


def test_verify_rejects_duplicate_required_review_heading():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(
            working_dir
        )

        (
            prepare_result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )
        assert prepare_result.returncode == 0

        review = write_review(
            working_dir,
            "APPROVED",
        )
        review.write_text(
            review.read_text(
                encoding="utf-8"
            )
            + "\n## Result\n`APPROVED`\n",
            encoding="utf-8",
        )

        (
            result,
            postflight,
        ) = verify(
            working_dir,
            preflight,
            reference,
            review,
        )

        assert result.returncode == 1
        assert (
            "exactly one '## Result' heading"
            in result.stderr
        )
        assert not postflight.exists()


def test_verify_rejects_out_of_order_required_review_headings():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(
            working_dir
        )

        (
            prepare_result,
            preflight,
            reference,
        ) = prepare(
            working_dir
        )
        assert prepare_result.returncode == 0

        review = (
            working_dir
            / "design-review.md"
        )
        review.write_text(
            "# Design Review - Packet Test - 2026-08-24\n\n"
            "## Result\n"
            "`APPROVED`\n\n"
            "## Redesign required\n"
            "- None.\n\n"
            "## Corrections made\n"
            "- None.\n\n"
            "## Flags for the teacher\n"
            "- None.\n\n"
            "## Voice sweep\n"
            f"{voice_sweep_line(working_dir)}\n",
            encoding="utf-8",
        )

        (
            result,
            postflight,
        ) = verify(
            working_dir,
            preflight,
            reference,
            review,
        )

        assert result.returncode == 1
        assert (
            "required headings are out of order"
            in result.stderr
        )
        assert not postflight.exists()


PACKET_MODULE_SPEC = importlib.util.spec_from_file_location(
    "design_review_packet_class_view",
    PACKET,
)
assert PACKET_MODULE_SPEC and PACKET_MODULE_SPEC.loader
packet_module = importlib.util.module_from_spec(PACKET_MODULE_SPEC)
PACKET_MODULE_SPEC.loader.exec_module(packet_module)


def content_based_design() -> tuple[dict, dict]:
    """A content-based design with every unit kind the class view renders.

    Built by hand rather than through the validator, because build_review_view
    reads the design directly and the test counts strings, not legality.
    """
    design, photos = fixtures.valid_contract()
    design["lesson"]["structure"] = "Content-based"
    design["lesson"]["subject"] = "History"
    design["lesson"]["yearGroup"] = 4
    design["concepts"] = []
    design["successCriteria"] = [
        {
            "id": "sc-001",
            "type": "steps",
            "drawLive": False,
            "content": {"steps": ["Find a detail.", "Compare it with today."]},
        }
    ]
    design["stickyKnowledge"] = [
        {"id": "sk-001", "text": "A source tells us about one school."}
    ]
    design["vocabulary"] = [
        {
            "id": "vocab-001",
            "sourceUnitId": "lesson-section/vocabulary/unit-001",
            "term": "continuity",
            "definition": "Something that has stayed similar over time.",
            "visual": {"kind": "none"},
        }
    ]

    def unit(kind, label, content, **overrides):
        base = {
            "sourceUnitId": f"lesson-section/teaching-sequence/{label}",
            "label": label,
            "kind": kind,
            "conceptRef": None,
            "content": content,
            "pupilInstruction": None,
            "taskStructure": None,
            "modellingState": None,
            "representationRefs": [],
            "successCriteriaRefs": [],
            "stickyKnowledgeRefs": [],
            "misconceptionRefs": [],
            "photoRefs": [],
            "speakerNotes": {"script": None, "teacherInfo": None, "lookFor": None},
            "answer": {
                "kind": "none",
                "content": None,
                "acceptanceCondition": None,
                "delivery": "none",
            },
        }
        base.update(overrides)
        return base

    design["starter"] = unit(
        "starter",
        "Last lesson",
        {
            "activity": "Name one thing a historian uses.",
            "connection": "DESIGNER ONLY connection",
            "format": "DESIGNER ONLY format",
            "testQuestionPath": None,
        },
        sourceUnitId="lesson-section/starter/unit-001",
        speakerNotes={
            "script": "Say to children: Bring back what you already know.",
            "teacherInfo": None,
            "lookFor": None,
        },
        answer={
            "kind": "exact",
            "content": "A photograph or an old timetable.",
            "acceptanceCondition": "TEACHER ONLY acceptance",
            "delivery": "answer-slide",
        },
    )
    design["teachingSequence"] = [
        unit(
            "teach",
            "A classroom in 1897",
            {
                "headline": "This classroom is from 1897.",
                "explanation": "Children sat in rows.",
                "takeaway": {"kind": "sticky", "ref": "sk-001"},
                "teachingText": None,
                "keyQuestions": ["What do you notice?"],
            },
            stickyKnowledgeRefs=["sk-001"],
            speakerNotes={
                "script": "Say to children: Look at this classroom.",
                "teacherInfo": "TEACHER ONLY MARKER about the archive reference",
                "lookFor": "Look for: TEACHER ONLY look-for",
            },
            answer={
                "kind": "model",
                "content": "TEACHER ONLY model kept in the notes",
                "acceptanceCondition": None,
                "delivery": "teacher-only",
            },
        ),
        unit(
            "do",
            "Same or different?",
            {
                "activity": "DESIGNER ONLY activity description",
                "format": None,
                "task": "Find one thing that is the same as our classroom.",
            },
            pupilInstruction="Talk to your partner first.",
            taskStructure={
                "kind": "option-bank",
                "items": [
                    {"id": "item-001", "label": "desks in rows"},
                    {"id": "item-002", "label": "a teacher"},
                ],
            },
        ),
        unit(
            "practise",
            "Stayed similar or changed",
            {
                "activity": "DESIGNER ONLY practise description",
                "format": "DESIGNER ONLY form",
                "task": "Write two things that changed.",
                "launch": {
                    "established": "We can spot what stayed similar.",
                    "goodLooksLike": "Strong: desks in rows. Weak: it was different.",
                    "steps": ["Look at the photo.", "Write one change."],
                },
            },
            successCriteriaRefs=["sc-001"],
            answer={
                "kind": "model",
                "content": "Desks were in rows; there was no whiteboard.",
                "acceptanceCondition": "TEACHER ONLY acceptance",
                "delivery": "answer-slide",
            },
        ),
    ]
    design["ending"] = {
        "included": True,
        "kind": "Apply",
        "reason": "DESIGNER ONLY reason",
        "beat": unit(
            "apply",
            "Has school completely changed?",
            {"activity": "Has school completely changed since Victorian times?"},
            sourceUnitId="lesson-section/apply/unit-001",
            speakerNotes={
                "script": "Say to children: Use two sources to decide.",
                "teacherInfo": None,
                "lookFor": None,
            },
        ),
    }
    design["worksheet"]["status"] = "generated"
    design["worksheet"]["successCriteriaRefs"] = []
    design["worksheet"]["stickyKnowledgeRefs"] = []
    design["worksheet"]["contentBlocks"] = [
        {
            "id": "ws-q-001",
            "kind": "question",
            "pupilPrompt": "What has stayed the same?",
            "response": "DESIGNER ONLY response size",
            "support": "Start with: I can see...",
            "visualRequirements": "DESIGNER ONLY visual requirement",
            "representationRefs": [],
            "stickyKnowledgeRefs": [],
            "photoRefs": [],
            "answer": {
                "kind": "model",
                "content": "TEACHER ONLY worksheet answer",
                "acceptanceCondition": None,
                "delivery": "teacher-only",
            },
        }
    ]
    return design, photos


def class_view_section(view: str) -> str:
    start = view.index("## As the class meets it")
    end = view.index("## Teacher orientation")
    return view[start:end]


def test_reused_worksheet_criteria_are_resolved_beside_the_new_task():
    """Expose a semantic mismatch to the reviewer, without pretending the
    packet builder can decide whether the support is pedagogically suitable.
    """
    design, photos = content_based_design()
    design["successCriteria"] = [{
        "id": "sc-001", "type": "reference-table", "drawLive": False,
        "content": {
            "columns": ["Evidence", "Use"],
            "rows": [["Sources", "A detail from the toys and the account"]],
        },
    }]
    design["worksheet"]["successCriteriaRefs"] = ["sc-001"]
    design["worksheet"]["contentBlocks"] = [{
        "id": "ws-stimulus-001", "kind": "stimulus-set",
        "stimulus": "Account A describes school. Account B describes songs.",
        "pupilAction": "Compare learning and play using both accounts.",
        "prompts": [],
    }]
    section = class_view_section(packet_module.build_review_view(design, photos))
    worksheet_view = section.split("### Worksheet", 1)[1]
    assert "A detail from the toys and the account" in worksheet_view
    assert "Account A describes school. Account B describes songs." in worksheet_view
    assert "Compare learning and play using both accounts." in worksheet_view
    assert "sc-001" not in worksheet_view


def test_the_view_opens_with_the_lesson_as_the_class_meets_it():
    design, photos = content_based_design()
    view = packet_module.build_review_view(design, photos)

    assert view.index("## Lesson") < view.index("## As the class meets it")
    assert view.index("## As the class meets it") < view.index("## Teacher orientation")

    section = class_view_section(view)
    # Starter: activity, answer (answer-slide), script = 3
    # Vocabulary: 1
    # Teach: headline, explanation, key question, takeaway (sticky), sticky ref,
    #        script = 6
    # Do: task, pupil instruction, two option labels = 4
    # Practise: task, established, goodLooksLike, two steps, two criteria steps,
    #           answer (answer-slide) = 8
    # Apply: activity, script = 2
    # Worksheet: prompt, support = 2
    assert "26 child-facing strings for a Year 4 class." in section
    for expected in (
        "### Last lesson",
        "Name one thing a historian uses.",
        "A photograph or an old timetable.",
        "Teacher says: Bring back what you already know.",
        "### Vocabulary",
        "continuity: Something that has stayed similar over time.",
        "This classroom is from 1897.",
        "What do you notice?",
        "A source tells us about one school.",
        "Find one thing that is the same as our classroom.",
        "Talk to your partner first.",
        "desks in rows",
        "We can spot what stayed similar.",
        "Look at the photo.",
        "Compare it with today.",
        "Desks were in rows; there was no whiteboard.",
        "Has school completely changed since Victorian times?",
        "### Worksheet",
        "What has stayed the same?",
        "Start with: I can see...",
    ):
        assert expected in section, expected
    assert "Say to children:" not in section
    assert "{" not in section and "}" not in section
    assert '"task"' not in section


def test_the_class_view_never_prints_teacher_only_material():
    design, photos = content_based_design()
    section = class_view_section(
        packet_module.build_review_view(design, photos)
    )
    for hidden in (
        "TEACHER ONLY",
        "DESIGNER ONLY",
        "Look for:",
    ):
        assert hidden not in section, hidden
    # Teacher-only material still reaches the detailed JSON sections below.
    assert "TEACHER ONLY MARKER" in packet_module.build_review_view(design, photos)


def test_observation_prompt_reaches_voice_review_but_do_metadata_does_not():
    design, photos = content_based_design()
    design["teachingSequence"][0]["kind"] = "observe"
    design["teachingSequence"][0]["content"] = {
        "activity": "Look at the tops of these objects. How are they different?",
        "focus": "TEACHER ONLY attention cue",
        "evidenceProduced": "DESIGNER ONLY response expectation",
    }
    section = class_view_section(packet_module.build_review_view(design, photos))
    assert "Look at the tops of these objects. How are they different?" in section
    assert "DESIGNER ONLY" not in section
    assert "TEACHER ONLY" not in section


def test_separate_judgements_cannot_be_hidden_by_overall_approval():
    with tempfile.TemporaryDirectory() as directory:
        report = Path(directory) / "review.md"
        report.write_text("Pedagogy: PASS\nDaniel-fit: REVISE\n", encoding="utf-8")
        try:
            packet_module.require_review_judgements(report, "APPROVED")
        except packet_module.PacketError as error:
            assert "both" in str(error)
        else:
            raise AssertionError("A failed personal-fit judgement was approved")
        assert packet_module.require_review_judgements(report, "REDESIGN REQUIRED")["Daniel-fit"] == "REVISE"
        report.write_text("Pedagogy: PASS\nDaniel-fit: PASS\n", encoding="utf-8")
        assert len(packet_module.require_review_judgements(report, "APPROVED")) == 2


def test_the_lesson_block_says_when_each_word_is_introduced():
    design, photos = content_based_design()
    starter = design["starter"]["sourceUnitId"]
    unit = design["teachingSequence"][0]["sourceUnitId"]

    design["vocabularyIntroductions"] = [
        {"vocabularyRefs": ["vocab-001"], "after": starter}
    ]
    view = packet_module.build_review_view(design, photos)
    assert '- Vocabulary introduced: continuity after "Last lesson"' in view

    design["vocabularyIntroductions"] = [
        {"vocabularyRefs": ["vocab-001"], "after": unit}
    ]
    view = packet_module.build_review_view(design, photos)
    assert '- Vocabulary introduced: continuity after "A classroom in 1897"' in view
    assert view.index("- Vocabulary introduced:") < view.index("## As the class meets it")


def test_two_groups_are_each_named_with_their_own_moment():
    design, photos = content_based_design()
    design["vocabulary"].append(
        {
            "id": "vocab-002",
            "sourceUnitId": "lesson-section/vocabulary/unit-002",
            "term": "change",
            "definition": "Something that has become different over time.",
            "visual": {"kind": "none"},
        }
    )
    design["vocabularyIntroductions"] = [
        {"vocabularyRefs": ["vocab-001"], "after": design["starter"]["sourceUnitId"]},
        {
            "vocabularyRefs": ["vocab-002"],
            "after": design["teachingSequence"][0]["sourceUnitId"],
        },
    ]
    view = packet_module.build_review_view(design, photos)
    assert (
        '- Vocabulary introduced: continuity after "Last lesson"; '
        'change after "A classroom in 1897"'
    ) in view


def test_the_class_view_reads_the_words_where_the_class_meets_them():
    # The fault this pins. The reading was built with every word straight after
    # the starter WHATEVER the design said, so a reviewer approved a lesson in
    # an order the class never met: the definition of "continuity" read out
    # before the beat that was supposed to give it meaning. The summary line and
    # the reading now come from one schedule and cannot drift apart.
    design, photos = content_based_design()
    design["vocabularyIntroductions"] = [
        {
            "vocabularyRefs": ["vocab-001"],
            "after": design["teachingSequence"][0]["sourceUnitId"],
        }
    ]
    section = class_view_section(packet_module.build_review_view(design, photos))
    assert section.index("A classroom in 1897") < section.index("continuity:")


def test_a_saved_design_reads_in_the_order_its_own_field_meant():
    # No introductions: every word after the starter, which is what
    # `vocabularyPlacement` null meant and what those designs were written to.
    design, photos = content_based_design()
    assert "vocabularyIntroductions" not in design
    section = class_view_section(packet_module.build_review_view(design, photos))
    assert section.index("continuity:") < section.index("A classroom in 1897")

    # And the superseded field still moves them where it said.
    design["vocabularyPlacement"] = {
        "after": design["teachingSequence"][0]["sourceUnitId"]
    }
    view = packet_module.build_review_view(design, photos)
    assert '- Vocabulary introduced: continuity after "A classroom in 1897"' in view
    section = class_view_section(view)
    assert section.index("A classroom in 1897") < section.index("continuity:")


def test_a_lesson_with_no_key_vocabulary_says_so():
    design, photos = content_based_design()
    design["vocabulary"] = []
    design["vocabularyIntroductions"] = []
    assert "- Vocabulary introduced: no key vocabulary" in packet_module.build_review_view(
        design, photos
    )


def test_verify_accepts_a_voice_sweep_that_matches_the_view():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(working_dir)
        prepare_result, preflight, reference = prepare(working_dir)
        assert prepare_result.returncode == 0

        review = write_review(
            working_dir,
            "APPROVED",
            voice_sweep=voice_sweep_line(working_dir, repaired=2),
        )
        result, postflight = verify(working_dir, preflight, reference, review)

        assert result.returncode == 0, result.stderr
        receipt = json.loads(postflight.read_text(encoding="utf-8"))
        assert receipt["voiceSweep"]["repaired"] == 2
        assert receipt["voiceSweep"]["childFacingStrings"] > 0


def test_verify_rejects_a_voice_sweep_whose_count_is_not_the_views():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(working_dir)
        prepare_result, preflight, reference = prepare(working_dir)
        assert prepare_result.returncode == 0

        expected = voice_sweep_line(working_dir)
        expected_count = int(expected.split()[1])
        review = write_review(
            working_dir,
            "APPROVED",
            voice_sweep=voice_sweep_line(
                working_dir,
                read_count=expected_count + 5,
            ),
        )
        result, postflight = verify(working_dir, preflight, reference, review)

        assert result.returncode == 1
        assert f"review view printed {expected_count} child-facing strings" in result.stderr
        assert f"Read {expected_count} child-facing strings as a Year" in result.stderr
        assert not postflight.exists()


def test_verify_rejects_a_review_with_no_voice_sweep():
    with tempfile.TemporaryDirectory() as tmp:
        working_dir = Path(tmp)
        write_science_contract(working_dir)
        prepare_result, preflight, reference = prepare(working_dir)
        assert prepare_result.returncode == 0

        review = write_review(working_dir, "APPROVED")
        text = review.read_text(encoding="utf-8")
        review.write_text(text[: text.index("## Voice sweep")], encoding="utf-8")
        result, postflight = verify(working_dir, preflight, reference, review)

        assert result.returncode == 1
        assert "exactly one '## Voice sweep' heading" in result.stderr
        assert not postflight.exists()


def _routing() -> dict[str, str]:
    spec = importlib.util.spec_from_file_location("design_review_packet", PACKET)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return {heading: " ".join(trigger.split())
            for heading, trigger in module.PREFERENCE_REVIEW_ROUTES}


RHYTHM = "The Teach → Do → Teach → Do Rhythm"


def test_the_rhythm_section_opens_on_a_countable_condition():
    """A trigger the reviewer can only meet by already having the judgement
    never fires.

    The rhythm section was routed "when a Do beat practises a different idea
    from the one its own Teach just taught". To follow that, the reviewer has to
    have found the fault in order to be sent to the section that would help it
    find the fault. A Year 4 History lesson went through review twice and came
    back both times with punctuation corrections and `Redesign required: None`.
    Counting Teach beats is something the review view answers on its face.
    """
    trigger = _routing()[RHYTHM]
    assert "three or more Teach beats" in trigger
    # And it says what to do once open, so the count is not merely a nudge.
    assert "say in your own words the move each Teach taught" in trigger


def test_the_self_diagnosed_route_is_kept_beside_the_countable_one():
    """Both ways in, because they catch different reviewers.

    The self-diagnosed clause still catches a reviewer that notices the
    mismatch on its own, and removing it would undo an earlier repair. What it
    cannot do is guarantee the section ever opens, which is the count's job.
    """
    trigger = _routing()[RHYTHM]
    assert (
        "when a Do beat practises a different idea from the one its own Teach "
        "just taught" in trigger
    )
    assert "three or more Teach beats" in trigger


def test_the_overload_section_opens_on_an_unused_taught_idea():
    """The guidance's own tell for too many ideas: something taught in the
    middle of the lesson that nothing after it needs."""
    trigger = _routing()["How Much Fits in One Lesson"]
    assert "not used again by the independent practice or the ending" in trigger
    assert "countable from the view" in trigger



def test_authored_planning_register_is_quoted_without_rewriting_or_hiding_it():
    design, photos = content_based_design()
    design["starter"]["content"]["activity"] = "Retrieve a familiar occupation.\nExplain the worker's task."
    design["starter"]["content"]["connection"] = "Private planning purpose"
    section = class_view_section(packet_module.build_review_view(design, photos))
    assert "> Retrieve a familiar occupation.\n> Explain the worker's task." in section
    assert "Private planning purpose" not in section
    assert "26 child-facing strings for a Year 4 class." in section


def test_progression_calibration_covers_false_links_and_legitimate_convergence():
    payload = json.loads(BEHAVIOUR_CASES.read_text(encoding="utf-8"))
    cases = {row["id"]: row for row in payload["cases"]}
    assert cases["resource-reuse-is-not-learning-dependency"]["expectedResult"] == "REDESIGN REQUIRED"
    assert cases["cumulative-scale-learning"]["expectedResult"] == "APPROVED"
    assert cases["parallel-cases-converge-without-forced-chain"]["expectedResult"] == "APPROVED"
    assert "A link carries learning" in PREFERENCES.read_text(encoding="utf-8")
