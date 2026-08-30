from __future__ import annotations

import os
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "make-lesson-runtime.py"
PLAYBOOK = ROOT / "skills" / "make-lesson" / "playbook-lite.md"
AGENTS = ROOT / "agents"

FOCUSED_REPAIR_ENTRYPOINTS: dict[str, tuple[str, str, str]] = {
    "slide-designer": (
        "slide-designer-focused-repair.md",
        "sol",
        "medium",
    ),
    "worksheet-designer": (
        "worksheet-designer-focused-repair.md",
        "sol",
        "medium",
    ),
    "working-wall-designer": (
        "working-wall-designer-focused-repair.md",
        "terra",
        "high",
    ),
    "stick-in-sheets-designer": (
        "stick-in-sheets-designer-focused-repair.md",
        "terra",
        "high",
    ),
}

BOUNDS: dict[str, tuple[str, str | None]] = {
    "execution": (
        "## Lightweight execution protocol",
        "## Before Each Run: Know What Exists",
    ),
    "setup": (
        "## Before Each Run: Know What Exists",
        "## Phase 1 — Run the Lesson Designer (Sequential, Blocking)",
    ),
    "design": (
        "## Phase 1 — Run the Lesson Designer (Sequential, Blocking)",
        "## Phase 1.25 — Review the Design (Sequential, Blocking)",
    ),
    "design-review": (
        "## Phase 1.25 — Review the Design (Sequential, Blocking)",
        "## Phase 1.5 — Helper Check (Before Spawning Any Renderer)",
    ),
    "helpers": (
        "## Phase 1.5 — Helper Check (Before Spawning Any Renderer)",
        "## Phase 2 — Spawn Parallel Rendering Branches",
    ),
    "phase2-core": (
        "## Phase 2 — Spawn Parallel Rendering Branches",
        "### Track A — Slides (slide-designer + the picture stage → fixed slide build)",
    ),
    "slides-design": (
        "### Track A — Slides (slide-designer + the picture stage → fixed slide build)",
        "**The picture stage** - only when Phase 2 resolved `PICTURE_STAGE: attempting`:",
    ),
    "pictures": (
        "**The picture stage** - only when Phase 2 resolved `PICTURE_STAGE: attempting`:",
        "**Track A trigger:**",
    ),
    "slides-finalize": (
        "**Track A trigger:**",
        "### Track B — Worksheets (adaptation-designer → merge gate → worksheet-designer → fixed worksheet build)",
    ),
    "worksheet-routing": (
        "### Track B — Worksheets (adaptation-designer → merge gate → worksheet-designer → fixed worksheet build)",
        "**Adaptation Designer** — if `adaptation-designer` exists AND the worksheet is a per-child sheet (not a shared frame, per the check just above):",
    ),
    "worksheet-adaptation": (
        "**Adaptation Designer** — if `adaptation-designer` exists AND the worksheet is a per-child sheet (not a shared frame, per the check just above):",
        "**Worksheet Designer** — launch whenever the role exists, reading",
    ),
    "worksheet-render": (
        "**Worksheet Designer** — launch whenever the role exists, reading",
        "### Track C — Scaffold (scaffold-designer → scaffold-builder, runs in parallel with Track A and Track B)",
    ),
    "other-resources": (
        "### Track C — Scaffold (scaffold-designer → scaffold-builder, runs in parallel with Track A and Track B)",
        "## Phase 3 — Service Each Branch as It Lands",
    ),
    "phase3": (
        "## Phase 3 — Service Each Branch as It Lands",
        "## Phase 3.5 — Visual Check and Repair (per artefact, as each build lands)",
    ),
    "visual-review": (
        "## Phase 3.5 — Visual Check and Repair (per artefact, as each build lands)",
        "### The focused owner-repair round",
    ),
    "focused-repair": (
        "### The focused owner-repair round",
        "### Deterministic final merge",
    ),
    "finalize-review": (
        "### Deterministic final merge",
        "## Phase 4 — Final Assembly and Report",
    ),
    "delivery": (
        "## Phase 4 — Final Assembly and Report",
        None,
    ),
}


def expected_slice(data: bytes, start_text: str, end_text: str | None) -> bytes:
    start = start_text.encode("utf-8")
    start_index = data.index(start)
    if end_text is None:
        return data[start_index:]
    end = end_text.encode("utf-8")
    return data[start_index:data.index(end)]


class MakeLessonRuntimeTests(unittest.TestCase):
    def run_slice(
        self,
        name: str,
        *,
        expected_returncode: int = 0,
    ) -> subprocess.CompletedProcess[bytes]:
        completed = subprocess.run(
            [sys.executable, str(SCRIPT), "--slice", name],
            capture_output=True,
            check=False,
        )
        self.assertEqual(
            completed.returncode,
            expected_returncode,
            completed.stderr.decode("utf-8", errors="replace"),
        )
        return completed

    def test_every_runtime_slice_matches_playbook_bytes(self) -> None:
        data = PLAYBOOK.read_bytes()

        for name, bounds in BOUNDS.items():
            with self.subTest(slice=name):
                completed = self.run_slice(name)
                body = expected_slice(data, *bounds)
                self.assertTrue(
                    completed.stdout.startswith(body),
                    f"{name} body no longer matches the playbook bytes",
                )
                self.assertEqual(completed.stderr, b"")

    def test_every_slice_names_its_successor(self) -> None:
        """A slice that ends without naming what follows stalls the run.

        Every slice used to end at its own `---`, and the only record of the
        order was the skill's list of "load slice X immediately before Y"
        bullets. Each of those bullets is keyed on an event the orchestrator
        can only recognise once it already holds the slice naming it, so a
        host reading strictly slice by slice read the playbook top to bottom
        instead: per-artefact visual review collapsed into one batch at the
        end, and Track B stopped at the Adaptation Designer because the step
        that launches the Worksheet Designer sat in a slice nothing told it to
        load. The successor travels with the slice for that reason.
        """
        for name in BOUNDS:
            with self.subTest(slice=name):
                stdout = self.run_slice(name).stdout.decode("utf-8")
                self.assertIn(
                    "## NEXT: what this slice hands you",
                    stdout,
                )

    def test_successor_map_covers_exactly_the_slices(self) -> None:
        """The two maps must not drift apart as the playbook changes."""
        import importlib.util

        spec = importlib.util.spec_from_file_location(
            "make_lesson_runtime", SCRIPT
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        self.assertEqual(
            set(module.NEXT_STEPS),
            set(module.SLICE_BOUNDS),
        )
        self.assertEqual(set(module.SLICE_BOUNDS), set(BOUNDS))
        for name, steps in module.NEXT_STEPS.items():
            with self.subTest(slice=name):
                self.assertTrue(steps)

    def test_a_finished_build_sends_its_own_artefact_to_review(self) -> None:
        """Reviewing one artefact needs that artefact and nothing else.

        The reported failure was every review running in one batch after the
        last branch finished, which costs the whole review round in wall-clock
        and delays every repair behind it. Each slice that ends with an
        accepted build has to say so where the orchestrator is standing.
        """
        for name in ("slides-finalize", "worksheet-render", "other-resources"):
            with self.subTest(slice=name):
                nxt = self.run_slice(name).stdout.decode("utf-8").split(
                    "## NEXT: what this slice hands you"
                )[1]
                self.assertIn("visual-review", nxt)

        deck = self.run_slice("slides-finalize").stdout.decode("utf-8")
        self.assertIn("do not hold it for the worksheet", deck)

    def test_adaptation_hands_on_to_the_worksheet_designer(self) -> None:
        """Adaptation writes `adaptation.md`; it never produces a sheet.

        A run that treated the Adaptation Designer as the end of Track B
        delivered no worksheet at all, so the hand-off is named in the slice
        that finishes adaptation rather than only in a slice nothing had told
        the orchestrator to load.
        """
        nxt = self.run_slice("worksheet-adaptation").stdout.decode(
            "utf-8"
        ).split("## NEXT: what this slice hands you")[1]
        self.assertIn("worksheet-render", nxt)
        self.assertIn("Worksheet Designer", nxt)

    def test_worksheet_designer_gate_reads_the_design_not_a_judgement(
        self,
    ) -> None:
        """`worksheet.status` is `generated` or `provided-by-teacher`.

        There is no third state, so asking whether the lesson "requires" a
        worksheet invites a no that the schema never offered - the same silent
        skip that made the wall and stick-in spawns unconditional.
        """
        render = self.run_slice("worksheet-render").stdout.decode("utf-8")
        self.assertIn("`worksheet.status`", render)
        self.assertIn("rather than judging the need", render)
        self.assertNotIn(
            "the approved lesson requires a generated worksheet",
            render,
        )

    def test_runtime_markers_are_unique(self) -> None:
        data = PLAYBOOK.read_bytes()

        markers = set()
        for start, end in BOUNDS.values():
            markers.add(start)
            if end is not None:
                markers.add(end)

        for marker in sorted(markers):
            with self.subTest(marker=marker):
                self.assertEqual(
                    data.count(marker.encode("utf-8")),
                    1,
                )

    def test_every_runtime_slice_stays_bounded(self) -> None:
        for name in BOUNDS:
            with self.subTest(slice=name):
                completed = self.run_slice(name)
                self.assertLess(
                    len(completed.stdout),
                    70000,
                )

    def test_initial_design_slice_excludes_later_review_work(
        self,
    ) -> None:
        design = (
            self.run_slice("design")
            .stdout.decode("utf-8")
        )
        review = (
            self.run_slice("design-review")
            .stdout.decode("utf-8")
        )

        self.assertIn(
            "## Phase 1",
            design,
        )
        self.assertNotIn(
            "## Phase 1.25",
            design,
        )
        self.assertNotIn(
            "launch the reviewer directly",
            design,
        )
        self.assertNotIn(
            "REDESIGN REQUIRED",
            design,
        )

        self.assertTrue(
            review.startswith(
                "## Phase 1.25"
            )
        )
        self.assertIn(
            "launch the reviewer directly",
            review,
        )
        self.assertIn(
            "REDESIGN REQUIRED",
            review,
        )

    def test_slide_designer_prompt_refuses_general_presentations_skill(
        self,
    ) -> None:
        slides = (
            self.run_slice("slides-design")
            .stdout.decode("utf-8")
        )

        self.assertIn(
            "This worker creates JSON only.",
            slides,
        )
        self.assertIn(
            "Do not load or use the global `Presentations`",
            slides,
        )
        self.assertIn(
            "The fixed slide builder creates the PowerPoint after this worker",
            slides,
        )

    @staticmethod
    def measured_bytes(raw: bytes) -> int:
        """Size as content, not as the checkout's line-ending policy.

        These budgets are growth alarms on what the runtime says. Counting raw
        bytes made the same text pass on a LF checkout and fail on a CRLF one,
        which alarms on `core.autocrlf` rather than on anything an author wrote.
        """
        return len(raw.replace(b"\r\n", b"\n").replace(b"\r", b"\n"))

    def test_pre_first_worker_runtime_text_stays_below_fifty_kib(
        self,
    ) -> None:
        total = sum(
            self.measured_bytes(
                self.run_slice(name).stdout
            )
            for name in (
                "execution",
                "setup",
                "design",
            )
        )

        self.assertLess(
            total,
            50 * 1024,
        )

    def test_active_runtime_has_no_generic_controller_choreography(self) -> None:
        active = PLAYBOOK.read_text(encoding="utf-8")
        for retired in (
            "orchestration-controller.py",
            "orchestration-jobs/",
            "orchestration-events/",
            "orchestration-snapshots/",
            "build-orchestration-latency-report.py",
        ):
            with self.subTest(retired=retired):
                self.assertNotIn(retired, active)

        # A growth alarm, an order of magnitude below the 179KB document this
        # runtime replaced. The per-slice budget below is the one that measures
        # what a run actually pays: no worker ever loads this file whole.
        # Raised from 46 KiB when the always-spawn wall/stick-in rules and the
        # reviewer-local rebuild route landed with ~150 bytes of headroom left,
        # and from 48 KiB when two demonstrated failures were repaired here: a
        # brief that names a document rather than carrying the lesson, and a
        # helper decision for a visual of a real place. Raised from 50 KiB when
        # two more demonstrated failures were repaired here: a worksheet branch
        # held behind picture work until its Below sheet became unrecoverable,
        # and an optional-picture check invoked without a library root that
        # silently wrote the drawing layer off. Raised from 52 KiB when two
        # more demonstrated failures were repaired here: a Chrome preflight
        # passed as `ready` on a guess with the PDF packages missing, and a
        # shared build-review-log entry queued around a merely missing file.
        # Every slice still sits far under its own 7 KiB budget, which is what
        # a run actually pays.
        self.assertLess(self.measured_bytes(PLAYBOOK.read_bytes()), 53 * 1024)

    def test_no_single_runtime_slice_outgrows_a_worker_context(self) -> None:
        """The cost of the runtime is paid one slice at a time.

        The whole-file size was the only budget for a while, which measured
        something no run ever loads. A slice is what reaches an orchestrator's
        context, so that is where growth has to be caught: one section
        accreting past this is the signal to consolidate it, not to widen the
        cap.
        """
        for name in BOUNDS:
            with self.subTest(slice=name):
                size = self.measured_bytes(self.run_slice(name).stdout)
                self.assertLess(size, 7 * 1024, f"slice {name} is {size} bytes")

    def test_focused_repair_slice_routes_resource_owners_to_compact_entrypoints(
        self,
    ) -> None:
        focused = (
            self.run_slice("focused-repair")
            .stdout.decode("utf-8")
            .replace("\r\n", "\n")
            .replace("\r", "\n")
        )

        self.assertIn(
            "Launch the selected role directly.",
            focused,
        )
        self.assertIn(
            "Return these exact repair-impact fields",
            focused,
        )

        for owner, (filename, _, _) in FOCUSED_REPAIR_ENTRYPOINTS.items():
            with self.subTest(owner=owner):
                expected_route = (
                    f"- `{owner}`: use "
                    f"`[PLUGIN_ROOT]/agents/{filename}`;\n"
                    "  if that file is missing or unreadable, use "
                    f"`[PLUGIN_ROOT]/agents/{owner}.md`."
                )
                self.assertIn(expected_route, focused)

    def test_focused_repair_slice_routes_designer_findings_to_the_lesson_designer(
        self,
    ) -> None:
        # Regression: `DESIGNER REPAIR REQUIRED` existed in the reviewer's
        # vocabulary, the evidence reference and the merge script's blocking
        # rule, but named no owner anywhere in the runtime the orchestrator
        # reads. A lesson whose promised photographs never published therefore
        # produced findings with nowhere to go, and the only reachable end was
        # a blocked package. The route back to the Lesson Designer, and its
        # authority limits, must be in the slice a run actually loads.
        focused = (
            self.run_slice("focused-repair")
            .stdout.decode("utf-8")
            .replace("\r\n", "\n")
            .replace("\r", "\n")
        )

        for token in (
            "### When the repair is a design decision",
            "`DESIGNER REPAIR REQUIRED`",
            "[PLUGIN_ROOT]/agents/lesson-designer.md",
            "PICTURES_THAT_WILL_NOT_ARRIVE",
            "Run this route once per lesson, with every `DESIGNER REPAIR "
            "REQUIRED` finding in\nthe same launch",
            "Do not change the objective",
            "do not add a picture requirement",
            "Require exactly: LESSON_DESIGN_OK",
            "This is not the route for an ordinary layout fault",
        ):
            with self.subTest(token=token):
                self.assertIn(token, focused)

    def test_finalize_review_slice_carries_the_unrepaired_declaration_contract(
        self,
    ) -> None:
        # The merge now refuses a verdict while a blocking finding has no
        # repair on record. The orchestrator must meet that refusal with a
        # repair round or an honest declaration, so both, and the warning
        # against declaring a round that was merely skipped, belong in the
        # slice that owns the merge command.
        finalize = (
            self.run_slice("finalize-review")
            .stdout.decode("utf-8")
            .replace("\r\n", "\n")
            .replace("\r", "\n")
        )

        for token in (
            "The merge refuses to write a verdict while a finding is still "
            "blocking and no\nrepair is on record for it",
            "--unrepaired [FINDING-ID]=owner-unavailable:",
            "--unrepaired [FINDING-ID]=no-owner-authority:",
            "Declare only what is true.",
            "the answer is that finding's repair round, not a declaration",
        ):
            with self.subTest(token=token):
                self.assertIn(token, finalize)

    def test_visual_review_slice_sends_every_blocking_finding_to_a_repair_round(
        self,
    ) -> None:
        visual = (
            self.run_slice("visual-review")
            .stdout.decode("utf-8")
            .replace("\r\n", "\n")
            .replace("\r", "\n")
        )

        self.assertIn(
            "A finding the reviewer classified\n`DESIGNER REPAIR REQUIRED` "
            "routes through that same slice to a different owner.",
            visual,
        )
        self.assertIn(
            "Every blocking finding gets a repair round",
            visual,
        )

    def test_focused_repair_entrypoints_are_compact_and_keep_owner_models(
        self,
    ) -> None:
        for owner, (
            filename,
            model,
            effort,
        ) in FOCUSED_REPAIR_ENTRYPOINTS.items():
            with self.subTest(owner=owner):
                compact_path = AGENTS / filename
                full_path = AGENTS / f"{owner}.md"

                self.assertTrue(compact_path.is_file())
                self.assertTrue(full_path.is_file())

                compact_bytes = compact_path.read_bytes()
                full_bytes = full_path.read_bytes()
                compact_text = compact_bytes.decode("utf-8")

                self.assertLess(len(compact_bytes), len(full_bytes))
                self.assertLess(len(compact_bytes), 8000)
                self.assertIn(
                    f"name: {filename.removesuffix('.md')}",
                    compact_text,
                )
                self.assertIn(
                    f"model: {model}",
                    compact_text,
                )
                self.assertIn(
                    f"effort: {effort}",
                    compact_text,
                )
                self.assertIn(
                    f"existing `{owner}` semantic owner",
                    compact_text,
                )
                self.assertIn(
                    "Do not read the full creation role at the start of the repair.",
                    compact_text,
                )
                self.assertIn(
                    f"`[PLUGIN_ROOT]/agents/{owner}.md` once",
                    compact_text,
                )
                self.assertNotIn(
                    "Read these at the start of every run",
                    compact_text,
                )

    def test_creation_slices_do_not_reference_focused_repair_entrypoints(
        self,
    ) -> None:
        for slice_name in (
            "slides-design",
            "worksheet-render",
            "other-resources",
        ):
            output = self.run_slice(slice_name).stdout.decode("utf-8")
            for owner, (filename, _, _) in FOCUSED_REPAIR_ENTRYPOINTS.items():
                with self.subTest(slice=slice_name, owner=owner):
                    self.assertNotIn(filename, output)

    def test_unknown_slice_fails_closed(self) -> None:
        completed = self.run_slice(
            "not-a-slice",
            expected_returncode=2,
        )
        self.assertEqual(completed.stdout, b"")
        self.assertEqual(
            completed.stderr,
            (
                "MAKE_LESSON_RUNTIME_ERROR: unknown slice: not-a-slice"
                + os.linesep
            ).encode("utf-8"),
        )


if __name__ == "__main__":
    unittest.main()
