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
        "sol",
        "medium",
    ),
    "stick-in-sheets-designer": (
        "stick-in-sheets-designer-focused-repair.md",
        "luna",
        "xhigh",
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
        "## Phase 3.5 — The Focused Owner-Repair Round",
    ),
    "focused-repair": (
        "## Phase 3.5 — The Focused Owner-Repair Round",
        "## Phase 3.6 - Final Resource Review and Finalisation",
    ),
    "finalize": (
        "## Phase 3.6 - Final Resource Review and Finalisation",
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

    def slice_text(self, name: str) -> str:
        """One slice as text with newlines normalised, for wording assertions."""
        return (
            self.run_slice(name)
            .stdout.decode("utf-8")
            .replace("\r\n", "\n")
            .replace("\r", "\n")
        )

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
        instead, and Track B stopped at the Adaptation Designer because the
        step that launches the Worksheet Designer sat in a slice nothing told
        it to load. The successor travels with the slice for that reason.
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

    def test_every_track_can_reach_the_one_repair_route(self) -> None:
        """Each track raises its own build and picture faults, alone.

        A track slice says "run one focused Slide Designer repair" but the
        mapping from an owner to its compact repair role file lives only in the
        focused-repair slice, which no track ever loaded: the orchestrator was
        left to guess a filename. Each track that can raise a fault must name
        the slice that resolves its owner.
        """
        for name in ("slides-finalize", "worksheet-render", "other-resources"):
            with self.subTest(slice=name):
                nxt = self.run_slice(name).stdout.decode("utf-8").split(
                    "## NEXT: what this slice hands you"
                )[1]
                self.assertIn("focused-repair", nxt)

    def test_no_slice_is_stranded_behind_a_door_nothing_opens(self) -> None:
        """A slice no NEXT block names is a slice the run never loads.

        `phase3` was exactly that, and `finalize` sat behind it, so by this
        table's own rule - a branch no NEXT block names has ended - the run
        ended when its last track did, with the pictures unproven, the report
        unwritten and the lesson unfiled. Hosts with a large accumulated
        context inferred the rest and finished anyway, which is why it went
        unnoticed for so long: what the hole actually cost was speed. The
        instruction to service whichever branch has landed lived behind the
        same unopened door, so a run walked one track to its end while another
        track's finished work waited, and a geography run's worksheets landed
        about twelve minutes late for want of a command taking seconds.
        """
        import importlib.util

        spec = importlib.util.spec_from_file_location("make_lesson_runtime", SCRIPT)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        tick = chr(96)
        named = {
            name
            for name in module.SLICE_BOUNDS
            for steps in module.NEXT_STEPS.values()
            for step in steps
            if tick + name + tick in step
        }
        # `execution` is the entry point the skill loads by name.
        stranded = sorted(set(module.SLICE_BOUNDS) - named - {"execution"})
        self.assertEqual(stranded, [], f"no NEXT block names: {stranded}")

    def test_the_tracks_are_serviced_as_they_land_not_read_end_to_end(self) -> None:
        """The orchestrator opens three tracks and then reads one document.

        Nothing told it to come back. Finalising a returned picture batch and
        building adaptation's provisional contract are seconds of deterministic
        work that each unblock a whole branch, and both sat waiting on an
        unrelated Slide Designer. The rule has to arrive before the first track
        is opened, so it lives where the tracks are opened.
        """
        opened = self.run_slice("phase2-core").stdout.decode("utf-8")
        self.assertIn("not a running order", opened)
        self.assertIn("as soon as it returns", opened)

    def test_a_built_and_checked_branch_waits_for_no_sibling(self) -> None:
        """Nothing after a branch's own check compares it to another resource.

        While a cross-resource consistency pass existed, a finished build still
        had a stage ahead of it that needed every sibling. With that pass gone,
        a slice that implies waiting would idle a whole track for nothing.
        """
        for name in ("slides-finalize", "worksheet-render"):
            with self.subTest(slice=name):
                text = self.run_slice(name).stdout.decode("utf-8")
                self.assertIn("ends here", text)

        phase3 = self.slice_text("phase3")
        self.assertIn("Nothing waits on an unrelated sibling", phase3)
        self.assertIn(
            "Only the deterministic\nfinalisation waits for every branch",
            phase3,
        )
        self.assertIn("finalize", phase3.split(
            "## NEXT: what this slice hands you"
        )[1])

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
        # Raised from 53 KiB for the content-gap picture wave, after a whole
        # geography lesson blocked with the picture pipeline's rescue ladder
        # sitting unused because nothing reopened the contract for a gap
        # found after the freeze. Raised from 54 KiB when the helper check's
        # closing step moved onto the path every run takes: it had lived only
        # in the build-gated helper route, so an ordinary run never ran it, and
        # two substitutes claiming a picture the contract did not hold put two
        # invented maps on a geography board. Raised from 55 KiB for four lines
        # holding `gap` to its meaning: a rainforest lesson recorded its
        # distribution map unsatisfied and was about to drop the beat, when the
        # real world map with the belts shaded on it was the beat. Raised from
        # 56 KiB when the stick-in launch started reading the reviewed design's
        # own decision: a worker that found nothing to print on two lessons in
        # three now runs only when the lesson says there may be a piece. Raised
        # from 57 KiB when Track D began preparing the wall designer's packet:
        # the command that replaced two complete reference files and a hunt
        # through the lesson with a view of the strings and figures a card can
        # carry. Raised from 58 KiB when the slide decoration pass moved into
        # its own worker, launched beside the wall and stick-in designers the
        # moment the composition passes: the Track A prompt for that worker
        # and its degrade route are what the playbook gained. Raised from
        # 61 KiB when the early adaptation picture wave landed in Track B: the
        # adaptation's pictures are now sourced beside the Worksheet Designer
        # instead of after it, which took a four to nine minute search off the
        # end of the worksheet chain, and the wave's compile, its bookkeeping
        # of what the sheet then dropped, and the cost line the report owes
        # are what the playbook gained. Every slice still sits under its own
        # 7 KiB budget, which is what a run actually pays. Raised from 64 KiB
        # when the content-gap picture wave stopped being a helper-only rescue:
        # a load-bearing photograph that comes back terminally unsatisfied now
        # takes the same wave, because a Year 4 history lesson lost its slides,
        # its worksheet and its answer key over five archive photographs the
        # approved sources never held. The wave's respecify example was cut to
        # pay for part of it; it lives in full in the designer's own file.
        # Raised from 65 KiB after the teacher refused a history deck
        # (4 September 2026) whose content-gap revision had rewritten the
        # lesson and gone straight to the slide designer with no second review:
        # the wave now briefs the revision to find another sound route and
        # re-judge the beats that leaned on the lost source, then returns
        # through Phase 1.25; the helper check's `covered` bullet refuses a
        # lookalike key; and the low-resolution picture line reaches the report.
        # Raised from 69 KiB when two more demonstrated failures were repaired
        # here (8 September 2026): three consecutive lessons shipped a
        # PowerPoint nobody had looked at because each reviewer probed its own
        # render route and a refused probe read as "no renderer", so the run now
        # probes once and a blocked probe is not an answer; and three runs'
        # engine findings were stranded in three output folders because the only
        # writable home for the shared log depended on where the run started, so
        # the log has a fixed one and there is no pending-log branch left.
        # Raised from 71 KiB when the walk-through began reaching the teacher
        # (11 September 2026): the lesson had only ever been delivered as a
        # deck, and the deck is where its story was being lost.
        # Raised from 72 KiB when every command stopped naming `python3` and
        # started naming the one interpreter the run finds at start-up
        # (13 September 2026): under Codex the sandbox user could not start
        # `python3` or the teacher's own Python, and 22 of 39 recorded runs
        # spent worker commands rediscovering that. The growth is the longer
        # placeholder on every command and a PYTHON line on each worker prompt.
        self.assertLess(self.measured_bytes(PLAYBOOK.read_bytes()), 73 * 1024)

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

    def test_the_repair_round_names_the_faults_that_reach_it(self) -> None:
        """The route survived the reviewer that used to be its main caller.

        Three deterministic checks raise a fault an owner can repair: a
        semantic build diagnostic, a picture reference the terminal receipts
        say will never be honoured, and a helper-delivery failure. The slice
        has to say so, or a route with no visible caller reads as dead.
        """
        focused = self.slice_text("focused-repair")

        for token in (
            "a semantic build diagnostic",
            "a picture reference the receipts",
            "a helper-delivery failure",
            "material finding",
            "Each identifies the resource, location and owner",
        ):
            with self.subTest(token=token):
                self.assertIn(token, focused)

    def test_one_repair_is_confirmed_by_its_own_rebuild(self) -> None:
        """Nothing re-reviews a repaired resource, so the rebuild must close it.

        The confirmation used to be a second reviewer pass over the repaired
        artefact. Without one, a repair that changed a spec and never rebuilt
        would reach delivery indistinguishable from a repair that worked.
        """
        focused = self.slice_text("focused-repair")

        self.assertIn("that rerun is the\nrepair's confirmation", focused)
        self.assertIn("There is no second round for the same fault", focused)
        self.assertIn(
            "Record the round in the run's\nfriction file, whatever its result",
            focused,
        )

    def test_a_declared_cross_resource_impact_reaches_the_teacher(self) -> None:
        """Nothing downstream compares two resources any more.

        A repair that changes something a sibling mirrors used to trigger a
        consistency confirmation. The declaration still has to go somewhere,
        or the one relationship a repair can silently break goes unnamed.
        """
        focused = self.slice_text("focused-repair")

        self.assertIn("Supply both affected resources to the final review", focused)
        self.assertIn("run report as a teacher flag", focused)

    def test_finalize_slice_proves_the_pictures_and_writes_the_record(
        self,
    ) -> None:
        """Final output judgement runs before provenance and the delivery record."""
        finalize = self.slice_text("finalize")

        for token in (
            "final-resource-reviews.json",
            "final-resource-review.md",
            "Only a current PASS",
            'finalize-picture-assignment.py" provenance',
            "Require `PICTURE_PROVENANCE_OK` before removing transient picture work",
            "Append genuine findings to the shared build review log",
        ):
            with self.subTest(token=token):
                self.assertIn(token, finalize)

        # The merge and its verdict vocabulary must be gone, not reworded.
        for retired in (
            "merge-visual-reviews.py",
            "--unrepaired",
            "## Verdict",
        ):
            with self.subTest(retired=retired):
                self.assertNotIn(retired, finalize)

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
