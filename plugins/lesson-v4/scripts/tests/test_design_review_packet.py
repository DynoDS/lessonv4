"""Tests for the deterministic Design Reviewer packet."""

from __future__ import annotations

import hashlib
import importlib.util
import json
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


def write_review(
    working_dir: Path,
    result: str,
) -> Path:
    path = (
        working_dir
        / "design-review.md"
    )

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
        "- None.\n",
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
            "- None.\n",
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
