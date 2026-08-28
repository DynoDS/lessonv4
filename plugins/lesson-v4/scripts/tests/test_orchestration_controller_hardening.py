from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "orchestration-controller.py"


class OrchestrationControllerHardeningTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.working = self.root / "working"
        self.working.mkdir()
        self.source = self.root / "source.json"
        self.source.write_text('{"ok": true}\n', encoding="utf-8")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def run_script(
        self, *args: str, expected: int = 0
    ) -> subprocess.CompletedProcess[str]:
        completed = subprocess.run(
            [sys.executable, str(SCRIPT), *args],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(
            completed.returncode,
            expected,
            completed.stderr or completed.stdout,
        )
        return completed

    def write_json(self, name: str, payload: dict) -> Path:
        path = self.root / name
        path.write_text(
            json.dumps(payload, indent=2) + "\n",
            encoding="utf-8",
        )
        return path

    def worker_job(
        self,
        job_id: str,
        *,
        dependencies: list[str] | None = None,
        capacity: str = "general",
        requires_clear: list[str] | None = None,
        max_attempts: int = 4,
    ) -> dict:
        output = self.root / f"{job_id}.out"
        return {
            "schemaVersion": 1,
            "jobId": job_id,
            "kind": "worker",
            "executionClass": "worker",
            "capacityClass": capacity,
            "dependencies": dependencies or [],
            "sourcePaths": [str(self.source)],
            "writePaths": [str(output)],
            "holdsBarriers": [],
            "requiresClearBarriers": requires_clear or [],
            "maxAttempts": max_attempts,
            "attempt": {
                "role": "test-worker",
                "identity": job_id,
                "expectedOutputs": [str(output)],
                "allowedDeclaredStates": ["PASS"],
                "outputsByDeclaredState": {
                    "PASS": [str(output)]
                },
                "inputs": [
                    {
                        "sourcePath": str(self.source),
                        "mode": "read-only",
                    }
                ],
                "checks": [],
            },
        }

    def command_job(
        self,
        job_id: str,
        *,
        dependencies: list[str] | None = None,
        holds: list[str] | None = None,
        max_attempts: int = 1,
        effect_path: Path | None = None,
    ) -> dict:
        summary = self.root / f"{job_id}-summary.json"
        write_paths = [str(summary)]
        if effect_path is not None:
            write_paths.insert(0, str(effect_path))
        return {
            "schemaVersion": 1,
            "jobId": job_id,
            "kind": (
                "picture-finalize"
                if "finalize" in job_id
                else "fixed-build"
            ),
            "executionClass": "command",
            "capacityClass": "none",
            "dependencies": dependencies or [],
            "sourcePaths": [str(self.source)],
            "writePaths": write_paths,
            "holdsBarriers": holds or [],
            "requiresClearBarriers": [],
            "maxAttempts": max_attempts,
            "command": (
                f'python helper.py --summary-output "{summary}"'
            ),
        }

    def register(self, spec: dict, now: int = 0) -> None:
        path = self.write_json(f"{spec['jobId']}.json", spec)
        self.run_script(
            "register",
            "--working-dir",
            str(self.working),
            "--spec",
            str(path),
            "--now",
            str(now),
        )

    def next(self, slots: int, now: int = 0) -> dict:
        return json.loads(
            self.run_script(
                "next",
                "--working-dir",
                str(self.working),
                "--worker-slots",
                str(slots),
                "--now",
                str(now),
            ).stdout
        )

    def start_worker(
        self, job_id: str, host_id: str, now: int
    ) -> None:
        self.run_script(
            "started",
            "--working-dir",
            str(self.working),
            "--job-id",
            job_id,
            "--host-id",
            host_id,
            "--now",
            str(now),
        )

    def fail(
        self, job_id: str, kind: str, now: int
    ) -> None:
        self.run_script(
            "fail",
            "--working-dir",
            str(self.working),
            "--job-id",
            job_id,
            "--failure-kind",
            kind,
            "--now",
            str(now),
        )

    def complete_worker(
        self, spec: dict, job_id: str, now: int
    ) -> None:
        output = Path(spec["attempt"]["expectedOutputs"][0])
        output.write_text("done\n", encoding="utf-8")
        event = self.write_json(
            f"{job_id}-event.json",
            {
                "schemaVersion": 1,
                "jobId": job_id,
                "declaredState": "PASS",
                "outputs": [{"path": str(output)}],
                "checks": [],
            },
        )
        self.run_script(
            "complete",
            "--working-dir",
            str(self.working),
            "--event",
            str(event),
            "--now",
            str(now),
        )

    def complete_command(
        self, job_id: str, now: int
    ) -> None:
        summary = self.root / f"{job_id}-summary.json"
        self.write_json(
            summary.name,
            {"schemaVersion": 1, "ok": True},
        )
        event = self.write_json(
            f"{job_id}-event.json",
            {
                "schemaVersion": 1,
                "jobId": job_id,
                "resultPath": str(summary),
            },
        )
        self.run_script(
            "complete",
            "--working-dir",
            str(self.working),
            "--event",
            str(event),
            "--now",
            str(now),
        )

    def state(self) -> dict:
        return json.loads(
            (
                self.working
                / "orchestration-controller.json"
            ).read_text(encoding="utf-8")
        )

    def transition_fixture(
        self,
        *,
        parent_dependency: bool = True,
    ) -> tuple[dict, Path, Path, Path]:
        helper = self.root / "transition-helper.py"
        helper.write_text("print('HELPER_OK')\n", encoding="utf-8")
        successor = self.worker_job(
            "successor",
            dependencies=["parent"] if parent_dependency else [],
        )
        successor_path = self.write_json("successor.json", successor)
        manifest = {
            "schemaVersion": 1,
            "kind": "orchestration-job-manifest",
            "sourceJobId": "parent",
            "jobs": [
                {
                    "specPath": str(successor_path),
                    "specSha256": hashlib.sha256(
                        successor_path.read_bytes()
                    ).hexdigest(),
                    "spec": successor,
                }
            ],
        }
        manifest_path = self.write_json("manifest.json", manifest)
        parent = self.worker_job("parent")
        parent["writePaths"].extend(
            [str(successor_path), str(manifest_path)]
        )
        parent["transition"] = {
            "schemaVersion": 1,
            "operation": "registered-operation",
            "steps": [
                {
                    "name": "registered-step",
                    "script": str(helper),
                    "arguments": [],
                    "requiredMarker": "HELPER_OK",
                }
            ],
            "writePaths": [str(successor_path), str(manifest_path)],
            "successorManifestPath": str(manifest_path),
        }
        self.register(parent)
        self.next(1)
        output = Path(parent["attempt"]["expectedOutputs"][0])
        output.write_text("done\n", encoding="utf-8")
        event = self.write_json(
            "transition-event.json",
            {
                "schemaVersion": 1,
                "jobId": "parent",
                "declaredState": "PASS",
                "outputs": [{"path": str(output)}],
                "checks": [],
            },
        )
        return successor, successor_path, manifest_path, event

    def run_transition(
        self,
        event: Path,
        *,
        expected: int = 0,
    ) -> subprocess.CompletedProcess[str]:
        return self.run_script(
            "transition",
            "--working-dir",
            str(self.working),
            "--event",
            str(event),
            "--worker-slots",
            "0",
            "--now",
            "2",
            expected=expected,
        )

    def test_transient_retry_does_not_leave_orphan_attempt_contract(
        self,
    ) -> None:
        spec = self.worker_job("worker")
        self.register(spec)
        first = self.next(1)["actions"][0]
        first_attempt = first["logicalAttemptId"]
        self.start_worker("worker", "host-1", 0)

        self.fail("worker", "transient", 10)

        self.assertFalse(
            (
                self.working
                / "orchestration-contracts"
                / f"{first_attempt}.json"
            ).exists()
        )
        failed_archive = (
            self.working
            / "orchestration-failed-attempts"
            / first_attempt
        )
        self.assertTrue((failed_archive / "contract.json").is_file())
        self.assertTrue((failed_archive / "snapshot").is_dir())
        self.assertEqual(self.next(1, 14)["actions"], [])
        second = self.next(1, 15)["actions"][0]
        self.assertNotEqual(
            second["logicalAttemptId"], first_attempt
        )
        self.start_worker("worker", "host-2", 15)
        self.complete_worker(spec, "worker", 16)

        audit = self.run_script(
            "audit",
            "--working-dir",
            str(self.working),
            "--now",
            "17",
        )
        self.assertIn(
            "ORCHESTRATION_CONTROLLER_AUDIT_OK",
            audit.stdout,
        )

    def test_terminal_alias_retires_wrong_worker_result(self) -> None:
        self.register(self.worker_job("worker", max_attempts=4))
        action = self.next(1)["actions"][0]
        attempt_id = action["logicalAttemptId"]
        self.start_worker("worker", "host-1", 0)
        self.run_script(
            "terminal",
            "--working-dir",
            str(self.working),
            "--job-id",
            "worker",
            "--now",
            "1",
        )
        state = self.state()
        self.assertEqual(state["jobs"]["worker"]["state"], "failed")
        self.assertEqual(
            state["jobs"]["worker"]["failure"], "wrong-result"
        )
        self.assertTrue(
            (
                self.working
                / "orchestration-failed-attempts"
                / attempt_id
                / "contract.json"
            ).is_file()
        )

    def test_real_finalizer_barrier_survives_retry_backoff(
        self,
    ) -> None:
        finalizer = self.command_job(
            "real-finalize",
            holds=["real-source-finalization"],
            max_attempts=3,
        )
        real_worker = self.worker_job(
            "real-worker",
            capacity="picture-real",
            requires_clear=["real-source-finalization"],
        )
        self.register(finalizer)
        self.register(real_worker)

        first = self.next(1)
        self.assertEqual(
            [item["jobId"] for item in first["actions"]],
            ["real-finalize"],
        )
        self.fail("real-finalize", "transient", 1)

        self.assertEqual(self.next(1, 5)["actions"], [])
        retried = self.next(1, 6)
        self.assertEqual(
            [item["jobId"] for item in retried["actions"]],
            ["real-finalize"],
        )

    def test_failed_dependency_terminalises_only_its_branch(
        self,
    ) -> None:
        parent = self.worker_job(
            "parent", max_attempts=1
        )
        child = self.command_job(
            "child", dependencies=["parent"]
        )
        grandchild = self.command_job(
            "grandchild", dependencies=["child"]
        )
        self.register(parent)
        self.register(child)
        self.register(grandchild)

        self.next(1)
        self.start_worker("parent", "host-parent", 0)
        self.fail("parent", "wrong-result", 1)

        state = self.state()
        self.assertEqual(
            state["jobs"]["parent"]["state"], "failed"
        )
        self.assertEqual(
            state["jobs"]["child"]["state"], "failed"
        )
        self.assertEqual(
            state["jobs"]["grandchild"]["state"], "failed"
        )
        audit = self.run_script(
            "audit",
            "--working-dir",
            str(self.working),
            "--now",
            "2",
        )
        self.assertIn(
            "ORCHESTRATION_CONTROLLER_AUDIT_OK",
            audit.stdout,
        )

    def test_command_result_must_match_registered_summary_path(
        self,
    ) -> None:
        self.register(self.command_job("build"))
        self.next(0)
        wrong = self.write_json(
            "wrong.json",
            {"schemaVersion": 1, "ok": True},
        )
        event = self.write_json(
            "wrong-event.json",
            {
                "schemaVersion": 1,
                "jobId": "build",
                "resultPath": str(wrong),
            },
        )
        result = self.run_script(
            "complete",
            "--working-dir",
            str(self.working),
            "--event",
            str(event),
            "--now",
            "1",
            expected=2,
        )
        self.assertIn(
            "does not match registered", result.stderr
        )

    def test_audit_rejects_closed_command_after_source_changes(
        self,
    ) -> None:
        self.register(self.command_job("build"))
        self.next(0)
        self.complete_command("build", 1)
        self.source.write_text(
            '{"ok": false}\n', encoding="utf-8"
        )

        audit = self.run_script(
            "audit",
            "--working-dir",
            str(self.working),
            "--now",
            "2",
            expected=1,
        )
        self.assertIn(
            "bad-command-receipts=build", audit.stderr
        )


    def test_command_job_requires_bound_summary_command(self) -> None:
        spec = self.command_job("missing-command")
        del spec["command"]
        path = self.write_json("missing-command.json", spec)
        result = self.run_script(
            "register",
            "--working-dir",
            str(self.working),
            "--spec",
            str(path),
            "--now",
            "0",
            expected=2,
        )
        self.assertIn("requires a non-empty command string", result.stderr)

    def test_command_timeout_must_be_positive(self) -> None:
        for bad in (0, -1, True, "10"):
            with self.subTest(value=bad):
                spec = self.command_job(f"bad-timeout-{str(bad).lower()}")
                spec["timeoutSeconds"] = bad
                path = self.write_json(f"timeout-{str(bad).lower()}.json", spec)
                completed = self.run_script(
                    "register",
                    "--working-dir",
                    str(self.working),
                    "--spec",
                    str(path),
                    "--now",
                    "0",
                    expected=2,
                )
                self.assertIn("timeoutSeconds must be a positive integer", completed.stderr)

    def test_worker_rejects_command_timeout(self) -> None:
        spec = self.worker_job("worker-timeout")
        spec["timeoutSeconds"] = 10
        path = self.write_json("worker-timeout.json", spec)
        completed = self.run_script(
            "register",
            "--working-dir",
            str(self.working),
            "--spec",
            str(path),
            "--now",
            "0",
            expected=2,
        )
        self.assertIn("worker job must not contain timeoutSeconds", completed.stderr)

    def test_transition_timeout_must_be_positive(self) -> None:
        _, _, _, event = self.transition_fixture()
        state = self.state()
        state["jobs"]["parent"]["transition"]["steps"][0]["timeoutSeconds"] = 0
        spec_path = Path(state["jobs"]["parent"]["specPath"])
        spec = json.loads(spec_path.read_text(encoding="utf-8"))
        spec["transition"]["steps"][0]["timeoutSeconds"] = 0
        spec_path.write_text(json.dumps(spec, indent=2) + "\n", encoding="utf-8")
        completed = self.run_script(
            "register",
            "--working-dir",
            str(self.root / "other-working"),
            "--spec",
            str(spec_path),
            "--now",
            "0",
            expected=2,
        )
        self.assertIn("timeoutSeconds must be a positive integer", completed.stderr)

    def test_terminal_dependency_propagation_records_wait_reason(self) -> None:
        self.register(self.worker_job("parent-failed", max_attempts=1))
        self.register(self.worker_job("child-failed", dependencies=["parent-failed"]))
        self.next(1)
        self.fail("parent-failed", "terminal", 1)
        failed = self.state()["jobs"]["child-failed"]
        self.assertEqual(failed["waitReason"], "dependency-failed")
        self.assertEqual(failed["waitDetails"], ["parent-failed"])

        parent = self.worker_job("parent-invalidated")
        child = self.worker_job(
            "child-invalidated", dependencies=["parent-invalidated"]
        )
        child["sourcePaths"] = []
        self.register(parent, now=2)
        self.register(child, now=2)
        self.source.write_text('{"ok": false}\n', encoding="utf-8")
        self.next(0, now=3)
        invalidated = self.state()["jobs"]["child-invalidated"]
        self.assertEqual(invalidated["waitReason"], "dependency-invalidated")
        self.assertEqual(invalidated["waitDetails"], ["parent-invalidated"])

    def test_transition_rejects_a_manifest_hash_mismatch(self) -> None:
        successor, successor_path, _, event = self.transition_fixture()
        successor["kind"] = "changed-after-manifest"
        successor_path.write_text(
            json.dumps(successor, indent=2) + "\n",
            encoding="utf-8",
        )
        completed = self.run_transition(event, expected=1)
        payload = json.loads(completed.stdout)
        self.assertEqual(payload["status"], "TRANSITION_FAILED")
        self.assertIn("specSha256 does not match", payload["detail"])
        self.assertEqual(self.state()["jobs"]["parent"]["state"], "claimed")

    def test_transition_rejects_a_successor_without_the_parent_dependency(
        self,
    ) -> None:
        _, _, _, event = self.transition_fixture(parent_dependency=False)
        completed = self.run_transition(event, expected=1)
        payload = json.loads(completed.stdout)
        self.assertEqual(payload["status"], "TRANSITION_FAILED")
        self.assertIn("must depend on parent", payload["detail"])
        self.assertEqual(self.state()["jobs"]["parent"]["state"], "claimed")

    def test_audit_rejects_a_missing_transition_receipt(self) -> None:
        _, _, _, event = self.transition_fixture()
        self.run_transition(event)
        receipt = self.working / "orchestration-transition-receipts" / "parent.json"
        receipt.unlink()
        self.run_script(
            "audit",
            "--working-dir",
            str(self.working),
            "--now",
            "3",
            expected=1,
        )
        audit = json.loads(
            (self.working / "orchestration-controller-audit.json").read_text()
        )
        self.assertEqual(audit["invalidTransitionReceipts"], ["parent"])

    def test_transition_does_not_accept_recipe_data_from_the_completion_event(
        self,
    ) -> None:
        _, _, _, event = self.transition_fixture()
        malicious_output = self.root / "malicious-ran.txt"
        malicious = self.root / "malicious.py"
        malicious.write_text(
            "from pathlib import Path\n"
            f"Path({str(malicious_output)!r}).write_text('ran')\n",
            encoding="utf-8",
        )
        event_payload = json.loads(event.read_text())
        event_payload["transition"] = {
            "steps": [
                {
                    "script": str(malicious),
                    "arguments": [],
                }
            ]
        }
        event.write_text(json.dumps(event_payload, indent=2) + "\n")
        payload = json.loads(self.run_transition(event).stdout)
        self.assertEqual(payload["status"], "TRANSITION_OK")
        self.assertFalse(malicious_output.exists())

    def test_picture_finalize_audit_survives_intentional_transient_cleanup(self) -> None:
        self.register(self.command_job("picture-finalize"))
        self.next(0)
        self.complete_command("picture-finalize", 1)
        self.source.unlink()
        audit = self.run_script(
            "audit",
            "--working-dir",
            str(self.working),
            "--now",
            "2",
        )
        self.assertIn("ORCHESTRATION_CONTROLLER_AUDIT_OK", audit.stdout)

    def test_fresh_rebuild_supersedes_stale_closed_command(self) -> None:
        effect = self.root / "built-output.pptx"
        self.register(self.command_job("build-old", effect_path=effect))
        self.next(0)
        self.complete_command("build-old", 1)

        self.source.write_text('{"ok": false}\n', encoding="utf-8")
        self.register(self.command_job("build-new", effect_path=effect), now=2)
        fresh = self.next(0, 2)
        self.assertEqual(fresh["actions"][0]["jobId"], "build-new")
        self.complete_command("build-new", 3)

        audit = self.run_script(
            "audit",
            "--working-dir",
            str(self.working),
            "--now",
            "4",
        )
        self.assertIn("ORCHESTRATION_CONTROLLER_AUDIT_OK", audit.stdout)
        payload = json.loads(
            (self.working / "orchestration-controller-audit.json").read_text(
                encoding="utf-8"
            )
        )
        self.assertEqual(payload["supersededCommandJobs"], ["build-old"])

if __name__ == "__main__":
    unittest.main()
