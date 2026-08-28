from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "orchestration-controller.py"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class OrchestrationControllerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.working = self.root / "working"
        self.working.mkdir(parents=True)
        self.source = self.root / "source.json"
        self.source.write_text('{"ok": true}\n', encoding="utf-8")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def run_script(self, *args: str, expected: int = 0) -> subprocess.CompletedProcess[str]:
        completed = subprocess.run(
            [sys.executable, str(SCRIPT), *args],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(completed.returncode, expected, completed.stderr or completed.stdout)
        return completed

    def write_json(self, name: str, payload: dict) -> Path:
        path = self.root / name
        path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        return path

    def command_job(
        self,
        job_id: str,
        *,
        dependencies: list[str] | None = None,
        write_paths: list[str] | None = None,
        holds: list[str] | None = None,
        requires_clear: list[str] | None = None,
        capacity: str = "none",
        execution: str = "command",
        max_attempts: int | None = None,
    ) -> dict:
        paths = list(write_paths or [])
        job = {
            "schemaVersion": 1,
            "jobId": job_id,
            "kind": "picture-finalize" if "finalize" in job_id else "fixed-build",
            "executionClass": execution,
            "capacityClass": capacity,
            "dependencies": dependencies or [],
            "sourcePaths": [str(self.source)],
            "writePaths": paths,
            "holdsBarriers": holds or [],
            "requiresClearBarriers": requires_clear or [],
        }
        if max_attempts is not None:
            job["maxAttempts"] = max_attempts
        if execution == "worker":
            output = self.root / f"{job_id}.out"
            job["attempt"] = {
                "role": "test-worker",
                "identity": job_id,
                "expectedOutputs": [str(output)],
                "allowedDeclaredStates": ["PASS"],
                "outputsByDeclaredState": {"PASS": [str(output)]},
                "inputs": [{"sourcePath": str(self.source), "mode": "read-only"}],
                "checks": [],
            }
        else:
            result = self.root / f"{job_id}-result.json"
            if str(result) not in paths:
                paths.append(str(result))
            job["command"] = f'python helper.py --summary-output "{result}"'
            job["resultPath"] = str(result)
        return job

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
        completed = self.run_script(
            "next",
            "--working-dir",
            str(self.working),
            "--worker-slots",
            str(slots),
            "--now",
            str(now),
        )
        return json.loads(completed.stdout)

    def command_result(self, name: str) -> Path:
        return self.write_json(name, {"schemaVersion": 1, "ok": True})

    def complete_command(self, job_id: str, now: int = 1) -> None:
        event = self.write_json(
            f"{job_id}-event.json",
            {
                "schemaVersion": 1,
                "jobId": job_id,
                "resultPath": str(self.command_result(f"{job_id}-result.json")),
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
            (self.working / "orchestration-controller.json").read_text(encoding="utf-8")
        )

    def transition_fixture(
        self,
        *,
        helper_exit: int = 0,
        parent_execution: str = "worker",
    ) -> tuple[dict, dict, Path, Path]:
        helper = self.root / "transition-helper.py"
        helper.write_text(
            "print('TRANSITION_HELPER_OK')\n"
            f"raise SystemExit({helper_exit})\n",
            encoding="utf-8",
        )
        successor = self.command_job(
            "successor",
            dependencies=["parent"],
            execution="worker",
            capacity="general",
        )
        successor_path = self.write_json("successor.json", successor)
        manifest_path = self.write_json(
            "successor-manifest.json",
            {
                "schemaVersion": 1,
                "kind": "orchestration-job-manifest",
                "sourceJobId": "parent",
                "jobs": [
                    {
                        "specPath": str(successor_path),
                        "specSha256": sha(successor_path),
                        "spec": successor,
                    }
                ],
            },
        )
        parent = self.command_job(
            "parent",
            execution=parent_execution,
            capacity="general" if parent_execution == "worker" else "none",
        )
        parent["writePaths"].extend(
            [str(successor_path), str(manifest_path)]
        )
        parent["transition"] = {
            "schemaVersion": 1,
            "operation": "test-transition",
            "steps": [
                {
                    "name": "prepare-successor",
                    "script": str(helper),
                    "arguments": [],
                    "requiredMarker": "TRANSITION_HELPER_OK",
                }
            ],
            "writePaths": [str(successor_path), str(manifest_path)],
            "successorManifestPath": str(manifest_path),
        }
        self.register(parent)
        self.next(1)
        if parent_execution == "worker":
            output = Path(parent["attempt"]["expectedOutputs"][0])
            output.write_text("done\n", encoding="utf-8")
            event_payload = {
                "schemaVersion": 1,
                "jobId": "parent",
                "declaredState": "PASS",
                "outputs": [{"path": str(output)}],
                "checks": [],
            }
        else:
            result = Path(parent["resultPath"])
            result.write_text(json.dumps({"schemaVersion": 1, "ok": True}) + "\n", encoding="utf-8")
            event_payload = {
                "schemaVersion": 1,
                "jobId": "parent",
                "resultPath": str(result),
            }
        event = self.write_json("parent-event.json", event_payload)
        return parent, successor, manifest_path, event

    def test_dependency_priority(self) -> None:
        self.register(self.command_job("a"))
        self.register(self.command_job("b"))
        self.register(self.command_job("needs-a", dependencies=["a"]))
        payload = self.next(0)
        self.assertEqual(payload["actions"][0]["jobId"], "a")

    def test_write_lock(self) -> None:
        locked = str(self.root / "same.out")
        self.register(self.command_job("a", write_paths=[locked]))
        self.register(self.command_job("b", write_paths=[locked]))
        payload = self.next(0)
        self.assertEqual([a["jobId"] for a in payload["actions"]], ["a"])
        self.run_script(
            "started",
            "--working-dir",
            str(self.working),
            "--job-id",
            "a",
            "--now",
            "0",
        )
        payload = self.next(0)
        self.assertEqual(payload["actions"], [])

    def test_source_change_invalidates_ready_job(self) -> None:
        self.register(self.command_job("a"))
        self.source.write_text('{"ok": false}\n', encoding="utf-8")
        payload = self.next(0)
        self.assertEqual(payload["actions"], [])
        self.assertEqual(self.state()["jobs"]["a"]["state"], "invalidated")

    def test_start_creates_contract_and_snapshot(self) -> None:
        self.register(self.command_job("worker", execution="worker", capacity="general"))
        payload = self.next(1)
        action = payload["actions"][0]
        attempt_id = action["logicalAttemptId"]
        contract = self.working / "orchestration-contracts" / f"{attempt_id}.json"
        self.assertTrue(contract.is_file())
        data = json.loads(contract.read_text(encoding="utf-8"))
        self.assertEqual(data["logicalAttemptId"], attempt_id)
        self.assertTrue(Path(data["inputs"][0]["snapshotPath"]).is_file())

    def test_attempt_output_templates_use_the_current_attempt_number(self) -> None:
        spec = self.command_job(
            "worker",
            execution="worker",
            capacity="general",
            max_attempts=4,
        )
        staging = self.root / "staging"
        template = str(staging / "try-{attemptNumber}" / "result.json")
        spec["writePaths"] = [str(staging)]
        spec["attempt"]["expectedOutputs"] = [template]
        spec["attempt"]["outputsByDeclaredState"] = {"PASS": [template]}
        self.register(spec)

        first = self.next(1)["actions"][0]
        first_request = json.loads(Path(first["attemptRequestPath"]).read_text())
        self.assertEqual(
            first_request["assignment"]["expectedOutputs"],
            [str(staging / "try-1" / "result.json")],
        )
        self.run_script(
            "fail",
            "--working-dir",
            str(self.working),
            "--job-id",
            "worker",
            "--failure-kind",
            "transient",
            "--now",
            "1",
        )
        second = self.next(1, now=6)["actions"][0]
        second_request = json.loads(Path(second["attemptRequestPath"]).read_text())
        self.assertEqual(
            second_request["assignment"]["expectedOutputs"],
            [str(staging / "try-2" / "result.json")],
        )
        self.assertNotIn("{attemptNumber}", Path(second["attemptRequestPath"]).read_text())

    def test_transition_closes_worker_registers_successors_and_releases_actions(
        self,
    ) -> None:
        _, _, _, event = self.transition_fixture()
        completed = self.run_script(
            "transition",
            "--working-dir",
            str(self.working),
            "--event",
            str(event),
            "--worker-slots",
            "1",
            "--now",
            "2",
        )
        payload = json.loads(completed.stdout)
        self.assertEqual(payload["status"], "TRANSITION_OK")
        self.assertEqual(payload["successorJobIds"], ["successor"])
        self.assertEqual(payload["actions"][0]["jobId"], "successor")
        state = self.state()
        self.assertEqual(state["jobs"]["parent"]["state"], "closed")
        self.assertIn("successor", state["jobs"])
        attempt_id = state["jobs"]["parent"]["logicalAttemptId"]
        self.assertTrue(
            (self.working / "orchestration-receipts" / f"{attempt_id}.json").is_file()
        )
        receipts = list(
            (self.working / "orchestration-transition-receipts").glob("*.json")
        )
        self.assertEqual(len(receipts), 1)

    def test_transition_failure_leaves_worker_active_without_accepted_receipts(
        self,
    ) -> None:
        _, _, _, event = self.transition_fixture(helper_exit=1)
        before = (self.working / "orchestration-controller.json").read_bytes()
        completed = self.run_script(
            "transition",
            "--working-dir",
            str(self.working),
            "--event",
            str(event),
            "--worker-slots",
            "1",
            "--now",
            "2",
            expected=1,
        )
        self.assertEqual(json.loads(completed.stdout)["status"], "TRANSITION_FAILED")
        self.assertEqual(
            (self.working / "orchestration-controller.json").read_bytes(), before
        )
        self.assertFalse((self.working / "orchestration-receipts").exists())
        self.assertFalse(
            (self.working / "orchestration-transition-receipts").exists()
        )

    def test_transition_replay_does_not_duplicate_successor_jobs(self) -> None:
        _, _, _, event = self.transition_fixture()
        arguments = (
            "transition",
            "--working-dir",
            str(self.working),
            "--event",
            str(event),
            "--worker-slots",
            "0",
            "--now",
            "2",
        )
        first = json.loads(self.run_script(*arguments).stdout)
        second = json.loads(self.run_script(*arguments).stdout)
        self.assertEqual(first["status"], "TRANSITION_OK")
        self.assertEqual(second["status"], "TRANSITION_ALREADY_APPLIED")
        self.assertEqual(
            list(self.state()["jobs"]).count("successor"),
            1,
        )

    def test_direct_complete_rejects_a_transition_job(self) -> None:
        _, _, _, event = self.transition_fixture()
        completed = self.run_script(
            "complete",
            "--working-dir",
            str(self.working),
            "--event",
            str(event),
            "--now",
            "2",
            expected=2,
        )
        self.assertIn("use the transition command", completed.stderr)
        self.assertNotEqual(self.state()["jobs"]["parent"]["state"], "closed")

    def test_complete_closes_valid_attempt(self) -> None:
        spec = self.command_job("worker", execution="worker", capacity="general")
        self.register(spec)
        action = self.next(1)["actions"][0]
        attempt_id = action["logicalAttemptId"]
        self.run_script(
            "started",
            "--working-dir",
            str(self.working),
            "--job-id",
            "worker",
            "--host-id",
            "host-1",
            "--now",
            "1",
        )
        output = Path(spec["attempt"]["expectedOutputs"][0])
        output.write_text("done\n", encoding="utf-8")
        event = self.write_json(
            "event.json",
            {
                "schemaVersion": 1,
                "jobId": "worker",
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
            "2",
        )
        self.assertEqual(self.state()["jobs"]["worker"]["state"], "closed")
        self.assertTrue(
            (self.working / "orchestration-receipts" / f"{attempt_id}.json").is_file()
        )

    def test_complete_with_slots_releases_ready_successor(
        self,
    ) -> None:
        parent = self.command_job(
            "parent-worker",
            execution="worker",
            capacity="general",
        )
        successor = self.command_job(
            "successor-worker",
            execution="worker",
            capacity="general",
            dependencies=["parent-worker"],
        )
        self.register(parent)
        self.register(successor)

        parent_action = self.next(1)["actions"][0]
        self.run_script(
            "started",
            "--working-dir",
            str(self.working),
            "--job-id",
            "parent-worker",
            "--host-id",
            "host-parent",
            "--now",
            "1",
        )

        output = Path(
            parent["attempt"]["expectedOutputs"][0]
        )
        output.write_text(
            "done\n",
            encoding="utf-8",
        )
        event = self.write_json(
            "parent-worker-event.json",
            {
                "schemaVersion": 1,
                "jobId": "parent-worker",
                "declaredState": "PASS",
                "outputs": [
                    {
                        "path": str(output),
                    }
                ],
                "checks": [],
            },
        )

        completed = self.run_script(
            "complete",
            "--working-dir",
            str(self.working),
            "--event",
            str(event),
            "--worker-slots",
            "1",
            "--now",
            "2",
        )
        payload = json.loads(
            completed.stdout
        )

        self.assertEqual(
            payload["status"],
            "ORCHESTRATION_CONTROLLER_CLOSED",
        )
        self.assertEqual(
            payload["closedJobId"],
            "parent-worker",
        )
        self.assertEqual(
            [
                action["jobId"]
                for action in payload["actions"]
            ],
            ["successor-worker"],
        )
        self.assertEqual(
            payload["actions"][0]["action"],
            "spawn-worker",
        )
        self.assertIsNone(
            payload["wait"]
        )
        self.assertEqual(
            self.state()["jobs"]["parent-worker"]["state"],
            "closed",
        )
        self.assertEqual(
            self.state()["jobs"]["successor-worker"]["state"],
            "claimed",
        )
        self.assertIsNotNone(
            parent_action["logicalAttemptId"]
        )

    def test_complete_without_slots_keeps_legacy_marker(
        self,
    ) -> None:
        spec = self.command_job(
            "legacy-complete-worker",
            execution="worker",
            capacity="general",
        )
        self.register(spec)
        self.next(1)

        output = Path(
            spec["attempt"]["expectedOutputs"][0]
        )
        output.write_text(
            "done\n",
            encoding="utf-8",
        )
        event = self.write_json(
            "legacy-complete-event.json",
            {
                "schemaVersion": 1,
                "jobId": "legacy-complete-worker",
                "declaredState": "PASS",
                "outputs": [
                    {
                        "path": str(output),
                    }
                ],
                "checks": [],
            },
        )

        completed = self.run_script(
            "complete",
            "--working-dir",
            str(self.working),
            "--event",
            str(event),
            "--now",
            "2",
        )

        self.assertEqual(
            completed.stdout.strip(),
            "ORCHESTRATION_CONTROLLER_CLOSED "
            "legacy-complete-worker",
        )

    def test_missing_output_closes_contract_invalid(self) -> None:
        spec = self.command_job("worker", execution="worker", capacity="general")
        self.register(spec)
        action = self.next(1)["actions"][0]
        attempt_id = action["logicalAttemptId"]
        event = self.write_json(
            "event.json",
            {
                "schemaVersion": 1,
                "jobId": "worker",
                "declaredState": "PASS",
                "outputs": [{"path": spec["attempt"]["expectedOutputs"][0]}],
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
            "2",
            expected=2,
        )
        self.assertNotEqual(self.state()["jobs"]["worker"]["state"], "closed")

    def test_transient_failure_requeues_after_backoff(self) -> None:
        self.register(
            self.command_job(
                "worker", execution="worker", capacity="general", max_attempts=4
            )
        )
        self.next(1)
        self.run_script(
            "fail",
            "--working-dir",
            str(self.working),
            "--job-id",
            "worker",
            "--failure-kind",
            "transient",
            "--now",
            "10",
        )
        self.assertEqual(self.next(1, now=14)["actions"], [])
        self.assertEqual(self.next(1, now=15)["actions"][0]["jobId"], "worker")

    def test_watchdog_uses_two_windows(self) -> None:
        self.register(self.command_job("worker", execution="worker", capacity="general"))
        self.next(1)
        self.run_script(
            "started",
            "--working-dir",
            str(self.working),
            "--job-id",
            "worker",
            "--host-id",
            "host-1",
            "--now",
            "0",
        )
        first = json.loads(
            self.run_script(
                "watchdog",
                "--working-dir",
                str(self.working),
                "--now",
                "600",
            ).stdout
        )
        self.assertEqual(first["actions"][0]["action"], "inspect-worker")
        second = json.loads(
            self.run_script(
                "watchdog",
                "--working-dir",
                str(self.working),
                "--now",
                "1200",
            ).stdout
        )
        self.assertEqual(second["actions"][0]["action"], "stop-worker")

    def test_default_latency_limits_are_exposed_in_actions_and_waits(self) -> None:
        self.register(self.command_job("build"))
        command_action = self.next(0)["actions"][0]
        self.assertEqual(command_action["timeoutSeconds"], 900)

        self.register(self.command_job("worker", execution="worker", capacity="general"))
        worker_action = self.next(1)["actions"][0]
        self.assertEqual(worker_action["startDeadline"], 120)
        wait = self.next(0, now=0)["wait"]
        self.assertEqual(wait["timeoutSeconds"], 120)
        self.assertEqual(wait["wakeReason"], "worker-start-deadline")

    def test_old_state_loads_with_latency_defaults(self) -> None:
        self.register(self.command_job("worker", execution="worker", capacity="general"))
        state_path = self.working / "orchestration-controller.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state.pop("slotSnapshots", None)
        for job in state["jobs"].values():
            for field in (
                "registeredAt",
                "firstReadyAt",
                "readyAt",
                "waitReason",
                "waitDetails",
            ):
                job.pop(field, None)
        state_path.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
        loaded = json.loads(
            self.run_script("status", "--working-dir", str(self.working)).stdout
        )
        self.assertEqual(loaded["slotSnapshots"], [])
        self.assertIsNone(loaded["jobs"]["worker"]["registeredAt"])
        self.assertEqual(loaded["jobs"]["worker"]["waitDetails"], [])

    def test_state_records_ready_time_and_exact_wait_reason(self) -> None:
        self.register(self.command_job("parent"), now=10)
        self.register(self.command_job("child", dependencies=["parent"]), now=11)
        state = self.state()
        self.assertEqual(state["jobs"]["child"]["waitReason"], "dependency")
        self.assertEqual(state["jobs"]["child"]["waitDetails"], ["parent"])
        self.assertEqual(state["jobs"]["parent"]["readyAt"], 10)
        self.assertEqual(state["jobs"]["parent"]["firstReadyAt"], 10)

    def test_registration_claim_and_start_timestamps_are_distinct(self) -> None:
        self.register(
            self.command_job("worker", execution="worker", capacity="general"),
            now=10,
        )
        self.next(1, now=20)
        self.run_script(
            "started",
            "--working-dir",
            str(self.working),
            "--job-id",
            "worker",
            "--host-id",
            "host-1",
            "--now",
            "23",
        )
        job = self.state()["jobs"]["worker"]
        self.assertEqual(job["registeredAt"], 10)
        self.assertEqual(job["readyAt"], 10)
        self.assertEqual(job["claimedAt"], 20)
        self.assertEqual(job["startedAt"], 23)

    def test_every_release_records_reported_slots_and_queue_occupancy(self) -> None:
        self.register(self.command_job("worker", execution="worker", capacity="general"))
        self.next(0, now=1)
        snapshot = self.state()["slotSnapshots"][-1]
        self.assertEqual(snapshot["reportedFreeWorkerSlots"], 0)
        self.assertEqual(snapshot["readyWorkerJobIds"], ["worker"])
        self.assertEqual(snapshot["claimedWorkerJobIds"], [])
        self.assertEqual(snapshot["runningWorkerJobIds"], [])

    def test_claimed_worker_is_never_an_unwatched_wait(self) -> None:
        self.register(self.command_job("worker", execution="worker", capacity="general"))
        self.next(1, now=10)
        wait = self.next(0, now=20)["wait"]
        self.assertEqual(wait["hostIds"], [])
        self.assertEqual(wait["timeoutSeconds"], 110)
        self.assertEqual(wait["wakeReason"], "worker-start-deadline")

    def test_terminal_and_retry_states_keep_timing_reason(self) -> None:
        self.register(
            self.command_job(
                "worker",
                execution="worker",
                capacity="general",
                max_attempts=2,
            )
        )
        self.next(1)
        self.run_script(
            "fail",
            "--working-dir",
            str(self.working),
            "--job-id",
            "worker",
            "--failure-kind",
            "stalled",
            "--now",
            "10",
        )
        job = self.state()["jobs"]["worker"]
        self.assertEqual(job["waitReason"], "backoff")
        self.assertEqual(job["waitDetails"], ["15.0"])

    def test_transition_step_timeout_leaves_parent_unaccepted(self) -> None:
        parent, _, _, event = self.transition_fixture()
        helper = Path(parent["transition"]["steps"][0]["script"])
        helper.write_text("import time\ntime.sleep(2)\n", encoding="utf-8")
        parent["transition"]["steps"][0]["timeoutSeconds"] = 1
        state = self.state()
        state["jobs"]["parent"]["transition"]["steps"][0]["timeoutSeconds"] = 1
        (self.working / "orchestration-controller.json").write_text(
            json.dumps(state, indent=2) + "\n", encoding="utf-8"
        )
        completed = self.run_script(
            "transition",
            "--working-dir",
            str(self.working),
            "--event",
            str(event),
            "--worker-slots",
            "1",
            "--now",
            "3",
            expected=1,
        )
        payload = json.loads(completed.stdout)
        self.assertEqual(payload["status"], "TRANSITION_FAILED")
        self.assertIn("exceeded 1 seconds", payload["detail"])
        self.assertEqual(self.state()["jobs"]["parent"]["state"], "claimed")

    def test_watchdog_reports_claim_that_never_started(self) -> None:
        self.register(self.command_job("worker", execution="worker", capacity="general"))
        action = self.next(1, now=0)["actions"][0]
        before = json.loads(
            self.run_script(
                "watchdog",
                "--working-dir",
                str(self.working),
                "--now",
                "119",
            ).stdout
        )
        self.assertEqual(before["actions"], [])
        due = json.loads(
            self.run_script(
                "watchdog",
                "--working-dir",
                str(self.working),
                "--now",
                "120",
            ).stdout
        )
        self.assertEqual(
            due["actions"],
            [
                {
                    "action": "fail-worker-launch",
                    "jobId": "worker",
                    "logicalAttemptId": action["logicalAttemptId"],
                    "failureKind": "stalled",
                }
            ],
        )

    def test_legacy_command_job_without_timeout_releases_default_limit(self) -> None:
        self.register(self.command_job("legacy"))
        state_path = self.working / "orchestration-controller.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        del state["jobs"]["legacy"]["timeoutSeconds"]
        state_path.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
        action = self.next(0)["actions"][0]
        self.assertEqual(action["timeoutSeconds"], 900)

    def test_legacy_transition_without_timeout_completes_and_audits(self) -> None:
        parent, _, _, event = self.transition_fixture()
        state = self.state()
        for step in state["jobs"]["parent"]["transition"]["steps"]:
            del step["timeoutSeconds"]
        (self.working / "orchestration-controller.json").write_text(
            json.dumps(state, indent=2) + "\n", encoding="utf-8"
        )
        completed = self.run_script(
            "transition",
            "--working-dir",
            str(self.working),
            "--event",
            str(event),
            "--worker-slots",
            "1",
            "--now",
            "3",
        )
        payload = json.loads(completed.stdout)
        self.assertEqual(payload["status"], "TRANSITION_OK")
        receipt = json.loads(
            (
                self.working
                / "orchestration-transition-receipts"
                / "parent.json"
            ).read_text(encoding="utf-8")
        )
        self.assertEqual(receipt["steps"][0]["timeoutSeconds"], 120)

        # Complete the successor so the run is fully terminal, then audit the
        # old-state transition without a crash.
        successor = self.state()["jobs"]["successor"]
        output = Path(successor["attempt"]["expectedOutputs"][0])
        output.write_text("done\n", encoding="utf-8")
        event = self.write_json(
            "successor-event.json",
            {
                "schemaVersion": 1,
                "jobId": "successor",
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
            "5",
        )
        self.run_script("audit", "--working-dir", str(self.working), "--now", "6")

    def test_failed_then_accepted_attempts_record_full_timing(self) -> None:
        self.register(
            self.command_job(
                "worker",
                execution="worker",
                capacity="general",
                max_attempts=2,
            ),
            now=10,
        )
        self.next(1, now=10)
        self.run_script(
            "started",
            "--working-dir",
            str(self.working),
            "--job-id",
            "worker",
            "--host-id",
            "host-1",
            "--now",
            "13",
        )
        self.run_script(
            "progress",
            "--working-dir",
            str(self.working),
            "--job-id",
            "worker",
            "--now",
            "18",
        )
        self.run_script(
            "fail",
            "--working-dir",
            str(self.working),
            "--job-id",
            "worker",
            "--failure-kind",
            "stalled",
            "--now",
            "20",
        )
        self.next(1, now=25)
        self.run_script(
            "started",
            "--working-dir",
            str(self.working),
            "--job-id",
            "worker",
            "--host-id",
            "host-2",
            "--now",
            "28",
        )
        job = self.state()["jobs"]["worker"]
        output = Path(job["attempt"]["expectedOutputs"][0])
        output.write_text("done\n", encoding="utf-8")
        event = self.write_json(
            "worker-accept-event.json",
            {
                "schemaVersion": 1,
                "jobId": "worker",
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
            "40",
        )
        history = self.state()["jobs"]["worker"]["attemptHistory"]
        self.assertEqual(
            history,
            [
                {
                    "logicalAttemptId": "test-worker-worker-1",
                    "attemptNumber": 1,
                    "outcome": "stalled",
                    "readyAt": 10,
                    "claimedAt": 10,
                    "startedAt": 13,
                    "lastProgressAt": 18,
                    "endedAt": 20,
                    "at": 20,
                },
                {
                    "logicalAttemptId": "test-worker-worker-2",
                    "attemptNumber": 2,
                    "outcome": "accepted",
                    "readyAt": 25,
                    "claimedAt": 25,
                    "startedAt": 28,
                    "lastProgressAt": 28,
                    "endedAt": 40,
                    "at": 40,
                },
            ],
        )

    def test_real_finalization_barrier_blocks_new_real_worker(self) -> None:
        self.register(
            self.command_job(
                "real-finalize",
                holds=["real-source-finalization"],
            )
        )
        self.register(
            self.command_job(
                "real-worker",
                execution="worker",
                capacity="picture-real",
                requires_clear=["real-source-finalization"],
            )
        )
        first = self.next(1)
        self.assertEqual([a["jobId"] for a in first["actions"]], ["real-finalize"])
        self.run_script(
            "started",
            "--working-dir",
            str(self.working),
            "--job-id",
            "real-finalize",
            "--now",
            "0",
        )
        self.assertEqual(self.next(1)["actions"], [])
        self.complete_command("real-finalize")
        self.assertEqual(self.next(1, now=2)["actions"][0]["jobId"], "real-worker")

    def test_picture_caps_allow_three_total_and_two_ai(self) -> None:
        for name, capacity in (
            ("ai-a", "picture-ai"),
            ("ai-b", "picture-ai"),
            ("real-c", "picture-real"),
            ("ai-d", "picture-ai"),
        ):
            self.register(
                self.command_job(name, execution="worker", capacity=capacity)
            )
        payload = self.next(4)
        ids = [action["jobId"] for action in payload["actions"]]
        self.assertEqual(len(ids), 3)
        self.assertEqual(sum(job.startswith("ai-") for job in ids), 2)

    def test_signal_dependency_releases_job(self) -> None:
        self.register(self.command_job("consumer", dependencies=["picture:a.png:terminal"]))
        self.assertEqual(self.next(0)["actions"], [])
        self.run_script(
            "signal",
            "--working-dir",
            str(self.working),
            "--signal-id",
            "picture:a.png:terminal",
            "--state",
            "satisfied",
            "--now",
            "1",
        )
        self.assertEqual(self.next(0, now=1)["actions"][0]["jobId"], "consumer")

    def test_closed_command_has_hashed_receipt(self) -> None:
        self.register(self.command_job("build"))
        self.next(0)
        self.run_script(
            "started", "--working-dir", str(self.working), "--job-id", "build", "--now", "0"
        )
        self.complete_command("build")
        receipt = self.working / "orchestration-command-receipts" / "build.json"
        self.assertTrue(receipt.is_file())
        data = json.loads(receipt.read_text(encoding="utf-8"))
        self.assertEqual(data["jobId"], "build")
        self.assertEqual(len(data["resultSha256"]), 64)

    def test_audit_ignores_photo_contract_receipts(self) -> None:
        receipt_dir = self.working / "orchestration-receipts"
        receipt_dir.mkdir(parents=True, exist_ok=True)
        (receipt_dir / "phase2-initial-photo-requirements.json").write_text(
            '{"schemaVersion": 1}\n', encoding="utf-8"
        )
        completed = self.run_script(
            "audit", "--working-dir", str(self.working), "--now", "0"
        )
        self.assertIn("ORCHESTRATION_CONTROLLER_AUDIT_OK", completed.stdout)

    def test_audit_requires_terminal_jobs(self) -> None:
        self.register(self.command_job("pending"))
        completed = self.run_script(
            "audit",
            "--working-dir",
            str(self.working),
            "--now",
            "0",
            expected=1,
        )
        self.assertIn("ORCHESTRATION_CONTROLLER_AUDIT_BLOCKED", completed.stderr)


    def test_complete_persists_worker_friction(self) -> None:
        spec = self.command_job(
            "worker",
            execution="worker",
            capacity="general",
        )
        self.register(spec)
        self.next(1)

        self.run_script(
            "started",
            "--working-dir",
            str(self.working),
            "--job-id",
            "worker",
            "--host-id",
            "host-1",
            "--now",
            "1",
        )

        output = Path(spec["attempt"]["expectedOutputs"][0])
        output.write_text("done\n", encoding="utf-8")

        friction = [
            "Friction: missing local helper catalogue; used the verified shared catalogue.",
            "Friction: first render command failed; reran the same checked command successfully.",
        ]

        event = self.write_json(
            "friction-event.json",
            {
                "schemaVersion": 1,
                "jobId": "worker",
                "declaredState": "PASS",
                "outputs": [{"path": str(output)}],
                "checks": [],
                "friction": friction,
            },
        )

        self.run_script(
            "complete",
            "--working-dir",
            str(self.working),
            "--event",
            str(event),
            "--now",
            "2",
        )

        self.assertEqual(
            self.state()["frictionEvents"],
            [
                {
                    "jobId": "worker",
                    "agent": "test-worker",
                    "line": friction[0],
                },
                {
                    "jobId": "worker",
                    "agent": "test-worker",
                    "line": friction[1],
                },
            ],
        )

    def test_complete_rejects_invalid_worker_friction(self) -> None:
        spec = self.command_job(
            "worker",
            execution="worker",
            capacity="general",
        )
        self.register(spec)
        self.next(1)

        output = Path(spec["attempt"]["expectedOutputs"][0])
        output.write_text("done\n", encoding="utf-8")

        event = self.write_json(
            "invalid-friction-event.json",
            {
                "schemaVersion": 1,
                "jobId": "worker",
                "declaredState": "PASS",
                "outputs": [{"path": str(output)}],
                "checks": [],
                "friction": ["not a friction line"],
            },
        )

        completed = self.run_script(
            "complete",
            "--working-dir",
            str(self.working),
            "--event",
            str(event),
            "--now",
            "2",
            expected=2,
        )

        self.assertIn(
            "completion event friction[0] must start with 'Friction:' and contain text",
            completed.stderr,
        )
        self.assertNotEqual(
            self.state()["jobs"]["worker"]["state"],
            "closed",
        )
        self.assertEqual(
            self.state()["frictionEvents"],
            [],
        )

    def test_command_transition_validates_summary_before_registering_successors(self) -> None:
        _, _, _, event = self.transition_fixture(parent_execution="command")
        completed = self.run_script(
            "transition", "--working-dir", str(self.working), "--event", str(event), "--worker-slots", "1", "--now", "2"
        )
        payload = json.loads(completed.stdout)
        self.assertEqual(payload["status"], "TRANSITION_OK")
        self.assertEqual(payload["successorJobIds"], ["successor"])
        self.assertEqual(self.state()["jobs"]["parent"]["state"], "closed")
        receipts = list((self.working / "orchestration-transition-receipts").glob("*.json"))
        self.assertEqual(len(receipts), 1)
        replay = self.run_script(
            "transition", "--working-dir", str(self.working), "--event", str(event), "--worker-slots", "1", "--now", "2"
        )
        self.assertEqual(json.loads(replay.stdout)["status"], "TRANSITION_ALREADY_APPLIED")
        self.assertEqual(len(list((self.working / "orchestration-transition-receipts").glob("*.json"))), 1)
        self.assertEqual(list(self.state()["jobs"]).count("successor"), 1)

    def test_command_transition_invalid_summary_registers_no_successor(self) -> None:
        _, _, _, event = self.transition_fixture(parent_execution="command")
        result_path = Path(self.state()["jobs"]["parent"]["resultPath"])
        result_path.write_text(json.dumps({"schema_version": 2, "kind": "picture-compile-summary"}) + "\n", encoding="utf-8")
        completed = self.run_script(
            "transition", "--working-dir", str(self.working), "--event", str(event), "--worker-slots", "1", "--now", "2", expected=2
        )
        self.assertIn("command result must have schemaVersion 1 and ok true", completed.stderr)
        state = self.state()
        self.assertNotEqual(state["jobs"]["parent"]["state"], "closed")
        self.assertNotIn("successor", state["jobs"])
        self.assertFalse((self.working / "orchestration-transition-receipts").exists())

    def test_command_transition_replay_is_idempotent(self) -> None:
        _, _, _, event = self.transition_fixture(parent_execution="command")
        arguments = ("transition", "--working-dir", str(self.working), "--event", str(event), "--worker-slots", "0", "--now", "2")
        self.assertEqual(json.loads(self.run_script(*arguments).stdout)["status"], "TRANSITION_OK")
        self.assertEqual(json.loads(self.run_script(*arguments).stdout)["status"], "TRANSITION_ALREADY_APPLIED")
        self.assertEqual(list(self.state()["jobs"]).count("successor"), 1)

if __name__ == "__main__":
    unittest.main()
