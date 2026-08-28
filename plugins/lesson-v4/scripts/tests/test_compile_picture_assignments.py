from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "compile-picture-assignments.py"
spec = importlib.util.spec_from_file_location("picture_compiler", SCRIPT)
assert spec and spec.loader
compiler = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compiler)


PROMPT = {
    "physical_state": "one intact object on a plain surface",
    "must_avoid": ["logos", "decorative text"],
    "text_rule": "no generated text",
    "composition": "single clear subject, generous margin",
}


# Python randomises string hashing per process, so deriving an id from hash()
# made two filenames collide on roughly one run in a hundred and the compiler
# rejected the requirements as duplicates. Number each distinct filename once.
_PHOTO_IDS: dict[str, int] = {}


def photo_id(filename: str) -> str:
    return f"photo-{_PHOTO_IDS.setdefault(filename, len(_PHOTO_IDS) + 1):03d}"


def photo(filename: str, mode="ordinary-real", profile="unsplash-then-wikimedia", fallback="omit", essential=False, group=None, coherent="none"):
    return {
        "id": photo_id(filename),
        "subject": f"subject {filename}",
        "pedagogical_constraint": "show the feature clearly",
        "teaching_requirement": "pupils identify the visible feature",
        "load_bearing_evidence": ["the visible feature"],
        "use": "slide",
        "essential": essential,
        "filename": filename,
        "acquisition_mode": mode,
        "source_profile": profile,
        "fallback_action": fallback,
        "fallback_note": None,
        "generation_prompt": PROMPT if mode == "controlled-ai" or fallback == "ai" else None,
        "coherent_group": group,
        "coherent_mode": coherent,
        "coherent_visual_invariants": ["same subject scale"] if group else [],
    }


def requirements(photos):
    return {"schema_version": 2, "lesson_name": "test lesson", "photos": photos}


class CompilePictureAssignmentsTests(unittest.TestCase):
    def test_immutable_write_is_durable_idempotent_and_refuses_changes(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "nested" / "prompt.txt"

            compiler.immutable_write(target, b"first prompt")
            self.assertEqual(target.read_bytes(), b"first prompt")

            compiler.immutable_write(target, b"first prompt")
            self.assertEqual(target.read_bytes(), b"first prompt")

            with self.assertRaisesRegex(
                compiler.AssignmentError,
                "immutable output already exists with different bytes",
            ):
                compiler.immutable_write(target, b"changed prompt")

            self.assertEqual(target.read_bytes(), b"first prompt")
            self.assertEqual(
                list(target.parent.glob(f".{target.name}.tmp-*")),
                [],
            )

    def test_routes_and_exact_search_schedules(self):
        authentic = photo("auth.jpg", mode="authentic-real", profile="unsplash-then-wikimedia", essential=True)
        ordinary = photo("ordinary.jpg", profile="wikimedia-then-unsplash", fallback="ai", essential=True)
        direct = photo("direct.jpg", mode="controlled-ai", profile="none", fallback="omit")
        self.assertEqual(compiler.initial_route(authentic), "real")
        self.assertEqual(compiler.source_schedule(authentic), [
            {"source": "unsplash", "round": 1, "candidate_count": 3},
            {"source": "wikimedia", "round": 1, "candidate_count": 3},
            {"source": "unsplash", "round": 2, "candidate_count": 3},
        ])
        self.assertEqual(len(compiler.source_schedule(ordinary)), 1)
        self.assertEqual(compiler.source_schedule(direct), [])

    def test_exact_minimum_partition_allows_mixed_batches(self):
        photos = [photo(f"r{i}.jpg") for i in range(3)] + [photo("ai.jpg", mode="controlled-ai", profile="none")]
        batches = compiler.pack_batches(photos)
        self.assertEqual(len(batches), 1)
        self.assertEqual([p["filename"] for p in batches[0]], ["r0.jpg", "r1.jpg", "r2.jpg", "ai.jpg"])

    def test_direct_ai_cap_and_indivisible_coherent_group(self):
        direct = [photo(f"a{i}.jpg", mode="controlled-ai", profile="none") for i in range(4)]
        batches = compiler.pack_batches(direct)
        self.assertEqual(len(batches), 2)
        self.assertTrue(all(sum(p["acquisition_mode"] == "controlled-ai" for p in b) <= 3 for b in batches))
        coherent = [photo(f"g{i}.jpg", mode="controlled-ai", profile="none", group="set", coherent="all-generated") for i in range(4)]
        grouped = compiler.pack_batches(coherent)
        self.assertEqual([[p["filename"] for p in b] for b in grouped], [["g0.jpg", "g1.jpg", "g2.jpg", "g3.jpg"]])

    def test_compilation_writes_immutable_prompts_and_hash_bound_assignments(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); req = root / "photo-requirements.json"; output = root / "assignments"
            photos = [photo("real.jpg"), photo("generated.jpg", mode="controlled-ai", profile="none")]
            req.write_text(json.dumps(requirements(photos), indent=2) + "\n", encoding="utf-8")
            summary = root / "summary.json"
            args = type("Args", (), {
                "requirements": str(req), "expected_filename": [], "expected_prefix": "p",
                "output_dir": str(output), "working_dir": str(root),
                "summary_output": str(summary),
            })()
            self.assertEqual(compiler.compile_command(args), 0)
            manifest = json.loads((output / "manifest.json").read_text())
            self.assertEqual(manifest["schema_version"], 2)
            assignment = json.loads((output / "p1.json").read_text())
            self.assertEqual(assignment["work_root"], str((root / "unsplash" / "_picture-work" / "p1").resolve()))
            generated = next(row for row in assignment["entries"] if row["filename"] == "generated.jpg")
            self.assertTrue(Path(generated["generation_prompt_file"]).is_file())
            self.assertEqual(generated["generation_prompt_sha256"], hashlib.sha256(Path(generated["generation_prompt_file"]).read_bytes()).hexdigest())

    def test_direct_compilation_emits_assignments_without_controller_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            req = root / "requirements.json"
            output = root / "assignments"
            summary = root / "summary.json"
            req.write_text(
                json.dumps(requirements([photo("one.jpg")])) + "\n",
                encoding="utf-8",
            )
            args = type(
                "Args",
                (),
                {
                    "requirements": str(req),
                    "expected_filename": [],
                    "expected_prefix": "p",
                    "output_dir": str(output),
                    "working_dir": str(root),
                    "summary_output": str(summary),
                },
            )()

            self.assertEqual(compiler.compile_command(args), 0)
            manifest = json.loads((output / "manifest.json").read_text())
            self.assertEqual(
                set(manifest["assignments"][0]),
                {"batch_id", "assignment", "filenames"},
            )
            self.assertFalse((root / "orchestration-jobs").exists())

    def test_slice_carries_hash_bound_repair_evidence_and_one_filename(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); req = root / "requirements.json"; source = root / "assignment.json"
            p = photo("one.jpg")
            req.write_text(json.dumps(requirements([p])) + "\n", encoding="utf-8")
            assignment = compiler.build_assignment(req, [p], "p1", "p", root / "assignments", root)
            source.write_text(json.dumps(assignment, indent=2) + "\n", encoding="utf-8")
            fault = root / "fault.md"; receipt = root / "receipt.json"
            fault.write_text("wrong crop\n", encoding="utf-8"); receipt.write_text(json.dumps({"provenance": {"summaryPath": str(root / "prior-summary.json")}}), encoding="utf-8")
            prior = root / "prior-summary.json"; prior.write_text(json.dumps({"complete": True, "results": []}), encoding="utf-8")
            output = root / "repair.json"
            args = type("Args", (), {"assignment": str(source), "batch_id": "w1", "output": str(output), "working_dir": str(root), "expected_filename": "one.jpg", "review_fault_file": str(fault), "previous_receipt": str(receipt), "summary_output": str(root / "repair-summary.json")})()
            self.assertEqual(compiler.repair_command(args), 0)
            repaired = json.loads(output.read_text())
            self.assertEqual([e["filename"] for e in repaired["entries"]], ["one.jpg"])
            self.assertEqual(repaired["repair"]["additional_real_searches"], 1)
            self.assertEqual(repaired["repair"]["fault_sha256"], hashlib.sha256(fault.read_bytes()).hexdigest())
            self.assertIn({"path": str(prior.resolve()), "sha256": hashlib.sha256(prior.read_bytes()).hexdigest()}, repaired["repair"]["prior_summaries"])

    def test_essential_single_source_gets_primary_round_two(self):
        item = photo("essential.jpg", profile="unsplash-only", fallback="unsatisfied", essential=True)
        self.assertEqual(compiler.source_schedule(item), [
            {"source": "unsplash", "round": 1, "candidate_count": 3},
            {"source": "unsplash", "round": 2, "candidate_count": 3},
        ])

    def test_essential_single_source_with_ai_fallback_stops_after_primary_round_one(self):
        item = photo("essential-ai.jpg", profile="unsplash-only", fallback="ai", essential=True)
        self.assertEqual(
            compiler.source_schedule(item),
            [
                {"source": "unsplash", "round": 1, "candidate_count": 3},
            ],
        )

    def test_all_real_group_can_share_batch_with_unrelated_direct_ai(self):
        photos = [
            photo("real-a.jpg", group="real-set", coherent="all-real"),
            photo("real-b.jpg", group="real-set", coherent="all-real"),
            photo("ai.jpg", mode="controlled-ai", profile="none"),
        ]
        batches = compiler.pack_batches(photos)
        self.assertEqual([[p["filename"] for p in b] for b in batches], [["real-a.jpg", "real-b.jpg", "ai.jpg"]])

    def test_all_generated_pair_can_share_batch_with_unrelated_real(self):
        photos = [
            photo("generated-a.jpg", mode="controlled-ai", profile="none", group="generated-set", coherent="all-generated"),
            photo("generated-b.jpg", mode="controlled-ai", profile="none", group="generated-set", coherent="all-generated"),
            photo("real.jpg"),
        ]
        batches = compiler.pack_batches(photos)
        self.assertEqual([[p["filename"] for p in b] for b in batches], [["generated-a.jpg", "generated-b.jpg", "real.jpg"]])

    def test_direct_manifest_passes_independent_validation(self):
        """The compiled manifest must clear the gate the orchestrator actually runs.

        Every earlier manifest test compiled in the retired controller mode, so the
        row shape the playbook really produces reached no validator, and the gate
        rejected every real lesson before a single image scout was launched.
        """
        import subprocess
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); req = root / "requirements.json"; output = root / "assignments"
            photos = [photo("one.jpg"), photo("two.jpg"), photo("three.jpg"), photo("four.jpg"), photo("five.jpg")]
            req.write_text(json.dumps(requirements(photos), indent=2) + "\n", encoding="utf-8")
            args = type("Args", (), {"requirements": str(req), "expected_filename": [], "expected_prefix": "p", "output_dir": str(output), "working_dir": str(root), "summary_output": str(root / "summary.json")})()
            compiler.compile_command(args)
            result = subprocess.run([sys.executable, str(ROOT / "validate-image-scout.py"), "manifest", "--requirements", str(req), "--manifest", str(output / "manifest.json"), "--working-dir", str(root), "--expected-prefix", "p"], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("PICTURE_MANIFEST_OK", result.stdout)

    def test_retired_controller_flags_are_rejected_by_the_compile_command(self):
        """One manifest shape only, so a stale controller flag must fail loudly.

        The retired controller mode was the sole producer of the manifest's
        `worker_job_id`; nothing may quietly reintroduce a second row shape.
        """
        parser = compiler.parser()
        for flag in ("--dependency-job-id", "--controller-manifest-output"):
            with self.subTest(flag=flag):
                with self.assertRaises(SystemExit):
                    parser.parse_args([
                        "compile", "--requirements", "r.json", "--expected-prefix", "p",
                        "--output-dir", "o", "--working-dir", "w",
                        "--summary-output", "s.json", flag, "x",
                    ])

    def test_interleaved_coherent_group_manifest_validates(self):
        import subprocess
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); req = root / "requirements.json"; output = root / "assignments"
            photos = [photo("g-a.jpg", group="G", coherent="all-real"), photo("ordinary-a.jpg"), photo("ordinary-b.jpg"), photo("ordinary-c.jpg"), photo("g-b.jpg", group="G", coherent="all-real")]
            req.write_text(json.dumps(requirements(photos), indent=2) + "\n", encoding="utf-8")
            args = type("Args", (), {"requirements": str(req), "expected_filename": [], "expected_prefix": "p", "output_dir": str(output), "working_dir": str(root), "summary_output": str(root / "summary.json")})()
            compiler.compile_command(args)
            validator = ROOT / "validate-image-scout.py"
            result = subprocess.run([sys.executable, str(validator), "manifest", "--requirements", str(req), "--manifest", str(output / "manifest.json"), "--working-dir", str(root), "--expected-prefix", "p"], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_compile_summary_matches_controller_command_contract(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); req = root / "requirements.json"; output = root / "assignments"; summary_path = root / "summary.json"
            req.write_text(json.dumps(requirements([photo("one.jpg")])) + "\n", encoding="utf-8")
            args = type("Args", (), {"requirements": str(req), "expected_filename": [], "expected_prefix": "p", "output_dir": str(output), "working_dir": str(root), "summary_output": str(summary_path)})()
            compiler.compile_command(args)
            summary = json.loads(summary_path.read_text(encoding="utf-8"))
            self.assertEqual(summary["schemaVersion"], 1)
            self.assertIs(summary["ok"], True)
            self.assertEqual(summary["schema_version"], 2)


if __name__ == "__main__":
    unittest.main()
