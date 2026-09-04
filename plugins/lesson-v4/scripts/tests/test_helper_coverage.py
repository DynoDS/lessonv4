"""The helper check has to reach an answer, and the build has to keep it.

The failure these guard: a run decided a lesson needed a balanced-plate helper,
built no helper, shipped slides that drew something else, and finished clean.
Every part of that was possible because the decision lived only in the run's own
head. Nothing recorded it, nothing could contradict it, and nothing downstream
asked whether the promised picture had actually arrived.

So the tests below hold three separate points:

  the decision exists     every required use carries one, and a use claimed
                          covered names a helper a renderer really dispatches on;
  the route can run       a writable checkout is found rather than waited for,
                          because a gate that never opens is the failure it was
                          meant to prevent;
  the picture arrived     a use recorded as drawn by a helper that the built
                          specification never uses fails at the boundary.
"""
from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COVERAGE = ROOT / "scripts" / "check-helper-coverage.py"
VERIFY = ROOT / "scripts" / "verify-plugin-root.py"
PLAYBOOK = ROOT / "skills" / "make-lesson" / "playbook-lite.md"
HELPER_ROUTE = ROOT / "references" / "helper-route.md"
HELPER_BUILDER = ROOT / "agents" / "helper-builder.md"
HELPER_AUTHORING = ROOT / "references" / "helper-authoring.md"


def run(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(COVERAGE), *args],
        capture_output=True,
        text=True,
    )


def design(helper_needed: bool = True) -> dict:
    """A lesson whose teaching turns on one representation, used on the board."""
    return {
        "representations": [
            {
                "id": "rep-001",
                "name": "Balanced plate",
                "purpose": "Show the proportions of a balanced meal",
                "configurations": [
                    {
                        "id": "blank",
                        "description": "Empty plate divided into groups",
                        "loadBearing": helper_needed,
                        "requiredFeatures": ["group boundaries"] if helper_needed else [],
                    }
                ],
            }
        ],
        "teachingSequence": [
            {
                "id": "unit-001",
                "representationRefs": [
                    {
                        "ref": "rep-001",
                        "configuration": "blank",
                        "interaction": "view",
                    }
                ],
            }
        ],
    }


class HelperCoverageTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.dir = Path(self.temp.name)
        self.design_path = self.dir / "lesson-design.json"
        self.design_path.write_text(json.dumps(design()), encoding="utf-8")
        self.verdict_path = self.dir / "helper-check.json"
        self.contract_path = self.dir / "photo-requirements.json"

    def tearDown(self) -> None:
        self.temp.cleanup()

    def write_verdict(self, *decisions: dict) -> None:
        self.verdict_path.write_text(
            json.dumps({"schemaVersion": 1, "decisions": list(decisions)}),
            encoding="utf-8",
        )

    def write_contract(self, *filenames: str) -> None:
        self.contract_path.write_text(
            json.dumps(
                {
                    "schema_version": 2,
                    "photos": [{"id": f"photo-{i:03d}", "filename": name}
                               for i, name in enumerate(filenames, 1)],
                }
            ),
            encoding="utf-8",
        )

    def verdict(self, contract: bool = False) -> subprocess.CompletedProcess:
        args = [
            "verdict",
            "--lesson-design",
            str(self.design_path),
            "--verdict",
            str(self.verdict_path),
        ]
        if contract:
            args += ["--photo-requirements", str(self.contract_path)]
        return run(*args)

    # ── the decision exists ───────────────────────────────────────────────

    def test_a_required_use_with_no_decision_fails(self):
        """The reported failure in its plainest form.

        The lesson said it needed a visual. Nothing was written down about it,
        and the run carried on to the renderers.
        """
        self.write_verdict()
        result = self.verdict()
        self.assertEqual(result.returncode, 1)
        self.assertIn("HELPER_COVERAGE_FAILED", result.stderr)
        self.assertIn("rep-001/blank/slides", result.stderr)
        self.assertIn("no recorded decision", result.stderr)

    def test_covered_by_a_helper_no_renderer_draws_fails(self):
        """A name is not a helper.

        Claiming cover from something the slide dispatcher has never heard of
        is the same silence one step later, so the key is checked against the
        live registry rather than taken on trust.
        """
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "covered",
                "helperKey": "balanced-plate",
            }
        )
        result = self.verdict()
        self.assertEqual(result.returncode, 1)
        self.assertIn("no slides renderer can draw", result.stderr)

    def timeline_design(self, name: str, description: str) -> None:
        """The reported lookalike: a representation whose own words name a
        figure the catalogue draws, recorded as covered by something else."""
        lesson = design()
        lesson["representations"][0]["name"] = name
        lesson["representations"][0]["configurations"][0]["description"] = description
        self.design_path.write_text(json.dumps(lesson), encoding="utf-8")

    def test_a_timeline_covered_by_a_table_is_a_lookalike_and_fails(self):
        """A history deck printed a three-column table with `not to
        scale` as a column heading, three times, because the check accepted
        `table` as cover for a not-to-scale timeline (4 September 2026)."""
        self.timeline_design(
            "Not-to-scale Victorian-source timeline",
            "A left-to-right, explicitly not-to-scale timeline with dated markers",
        )
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "covered",
                "helperKey": "table",
            }
        )
        result = self.verdict()
        self.assertEqual(result.returncode, 1)
        self.assertIn("describes a timeline but is covered by 'table'", result.stderr)

    def test_a_recording_frame_covered_by_a_table_still_passes(self):
        """A table standing in for a table is not a lookalike."""
        self.timeline_design(
            "Source comparison frame",
            "One source above a blank row with four child-facing questions",
        )
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "covered",
                "helperKey": "table",
            }
        )
        result = self.verdict()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("HELPER_COVERAGE_OK", result.stdout)

    def test_a_concept_map_is_not_mistaken_for_a_map(self):
        """Longer figure names match first, so `concept map` is judged as a
        concept map and never as a geographical map."""
        self.timeline_design(
            "Concept map of the causes",
            "A concept map with one idea at the centre and four around it",
        )
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "covered",
                "helperKey": "concept-map",
            }
        )
        result = self.verdict()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_a_build_left_standing_fails(self):
        """`build` is a job, not an outcome.

        A run that records "this needs building" and then proceeds has made
        exactly the decision it then ignored.
        """
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "build",
                "helperKey": "balanced-plate",
                "reason": "nothing draws a plate divided into food groups",
            }
        )
        result = self.verdict()
        self.assertEqual(result.returncode, 1)
        self.assertIn("still marked build", result.stderr)

    def test_substitute_needs_its_reason(self):
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "substitute",
            }
        )
        result = self.verdict()
        self.assertEqual(result.returncode, 1)
        self.assertIn("records no reason", result.stderr)

    def substitute(self, picture: str | None = "photos/plate.jpg") -> dict:
        decision = {
            "representationId": "rep-001",
            "configuration": "blank",
            "requiredSurface": "slides",
            "decision": "substitute",
            "reason": "one fixed real object, generated for this lesson",
        }
        if picture is not None:
            decision["picture"] = picture
        return decision

    def test_substitute_with_its_picture_in_the_contract_is_an_honest_answer(self):
        """The picture route is legitimate and must not be squeezed out."""
        self.write_verdict(self.substitute())
        self.write_contract("photos/plate.jpg")
        result = self.verdict(contract=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("HELPER_COVERAGE_OK", result.stdout)

    # ── the substitute's picture actually reaches the contract ────────────
    #
    # The Year 4 geography failure. Two substitutes each gave a reason saying
    # the approved contract supplied the map; the contract supplied neither,
    # and the deck drew coastlines from chosen coordinates instead. A reason is
    # a claim about a file, so the file is what gets checked.

    def test_a_substitute_whose_picture_is_not_in_the_contract_fails(self):
        self.write_verdict(self.substitute())
        self.write_contract("photos/something-else.jpg")
        result = self.verdict(contract=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn("HELPER_COVERAGE_FAILED", result.stderr)
        self.assertIn("the photo contract does not promise", result.stderr)

    def test_a_substitute_that_names_no_picture_fails(self):
        """The exact shape of the failure: reason present, picture asserted."""
        self.write_verdict(self.substitute(picture=None))
        self.write_contract("photos/plate.jpg")
        result = self.verdict(contract=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn("names no picture", result.stderr)

    def test_a_substitute_cannot_be_checked_without_the_contract(self):
        """Dropping the flag must not be a way back to the old silence."""
        self.write_verdict(self.substitute())
        result = self.verdict()
        self.assertEqual(result.returncode, 1)
        self.assertIn("pass --photo-requirements", result.stderr)

    def test_a_contract_folder_prefix_still_resolves(self):
        """A filename written without its folder is the same promise."""
        self.write_verdict(self.substitute(picture="plate.jpg"))
        self.write_contract("wikimedia/plate.jpg")
        result = self.verdict(contract=True)
        self.assertEqual(result.returncode, 0, result.stderr)

    # ── the honest dead end has somewhere to go ───────────────────────────

    def test_a_gap_passes_and_is_reported(self):
        """Neither route can run. Forcing a substitute here would invent a
        picture nobody can source, so the run records the absence and says so."""
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "gap",
                "reason": "no helper draws it and no authentic photograph exists",
            }
        )
        result = self.verdict()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("HELPER_GAP: rep-001/blank/slides", result.stdout)
        self.assertIn("HELPER_COVERAGE_OK", result.stdout)

    def test_a_gap_needs_its_reason(self):
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "gap",
            }
        )
        result = self.verdict()
        self.assertEqual(result.returncode, 1)
        self.assertIn("records no reason", result.stderr)

    # ── the check is on the path every run takes ──────────────────────────

    def test_the_runtime_closes_the_check_on_every_run(self):
        """Why the geography run's substitutes were never checked at all.

        The verdict command lived only in helper-route.md, which is read only
        when a decision says `build`. A run whose decisions were all `covered`
        and `substitute` never ran it, so the requirement stated in the runtime
        held nothing.
        """
        playbook = PLAYBOOK.read_text(encoding="utf-8")
        self.assertIn('check-helper-coverage.py" verdict', playbook)
        self.assertIn("--photo-requirements", playbook)
        route = HELPER_ROUTE.read_text(encoding="utf-8")
        self.assertNotIn("verdict --lesson-design", route)

    def test_a_live_helper_key_passes(self):
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "covered",
                "helperKey": "part-whole-model",
            }
        )
        result = self.verdict()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("HELPER_COVERAGE_OK", result.stdout)

    def test_a_decision_for_a_use_the_design_never_required_fails(self):
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "covered",
                "helperKey": "part-whole-model",
            },
            {
                "representationId": "rep-009",
                "configuration": "invented",
                "requiredSurface": "slides",
                "decision": "covered",
                "helperKey": "table",
            },
        )
        result = self.verdict()
        self.assertEqual(result.returncode, 1)
        self.assertIn("the approved design does not", result.stderr)

    # ── the inventory is read from the renderers, not a catalogue ─────────

    def test_inventory_lists_the_need_and_the_live_keys_of_every_surface(self):
        result = run("inventory", "--lesson-design", str(self.design_path))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Balanced plate", result.stdout)
        self.assertIn("group boundaries", result.stdout)
        for surface in ("slides", "worksheets", "wall", "stick-in"):
            self.assertIn(f"LIVE HELPERS {surface}", result.stdout)
        # Real keys from each engine's own registry, not a written list.
        self.assertIn("part-whole-model", result.stdout)
        self.assertIn("written-answers", result.stdout)
        self.assertIn("HELPER_INVENTORY_OK", result.stdout)

    def test_a_nested_option_is_not_read_as_a_helper(self):
        """Only top-level registry entries are helpers a surface can draw."""
        sys.path.insert(0, str(ROOT / "scripts"))
        try:
            import importlib.util

            spec = importlib.util.spec_from_file_location("coverage_mod", COVERAGE)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            body = module.object_body(
                "const HELPERS = {\n  real: draw,\n  other: { nested: 1 },\n};", "HELPERS"
            )
            self.assertIn("real:", body)
        finally:
            sys.path.pop(0)

    # ── the picture actually arrived ──────────────────────────────────────

    def delivery(self, spec: dict, surface: str = "slides") -> subprocess.CompletedProcess:
        spec_path = self.dir / "lesson.json"
        spec_path.write_text(json.dumps(spec), encoding="utf-8")
        return run(
            "delivery",
            "--verdict",
            str(self.verdict_path),
            "--spec",
            str(spec_path),
            "--surface",
            surface,
        )

    def test_a_covered_helper_missing_from_the_built_deck_fails(self):
        """The silent substitution, caught at the boundary.

        This is the shape of the original fault: the decision said the deck
        would draw the figure, and the deck drew a text block instead.
        """
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "covered",
                "helperKey": "part-whole-model",
            }
        )
        result = self.delivery(
            {"slides": [{"template": "body-full", "body": {"type": "text", "text": "A plate"}}]}
        )
        self.assertEqual(result.returncode, 1)
        self.assertIn("HELPER_DELIVERY_FAILED", result.stderr)
        self.assertIn("shipped a substitute", result.stderr)

    def test_a_covered_helper_present_in_the_built_deck_passes(self):
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "covered",
                "helperKey": "part-whole-model",
            }
        )
        result = self.delivery(
            {"slides": [{"body": {"type": "part-whole-model", "whole": 12}}]}
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("HELPER_DELIVERY_OK 1", result.stdout)

    def test_delivery_ignores_another_surface_and_a_substitute(self):
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "worksheets",
                "decision": "covered",
                "helperKey": "venn",
            },
            {
                "representationId": "rep-002",
                "configuration": "blank",
                "requiredSurface": "slides",
                "decision": "substitute",
                "reason": "one fixed real object",
            },
        )
        result = self.delivery({"slides": []})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("HELPER_DELIVERY_OK 0", result.stdout)

    def test_worksheet_delivery_reads_the_helper_field(self):
        self.write_verdict(
            {
                "representationId": "rep-001",
                "configuration": "blank",
                "requiredSurface": "worksheets",
                "decision": "covered",
                "helperKey": "venn",
            }
        )
        spec_path = self.dir / "worksheet.json"
        spec_path.write_text(
            json.dumps({"sheets": {"expected": {"zones": {"a": {"helper": "venn"}}}}}),
            encoding="utf-8",
        )
        result = run(
            "delivery",
            "--verdict",
            str(self.verdict_path),
            "--spec",
            str(spec_path),
            "--surface",
            "worksheets",
        )
        self.assertEqual(result.returncode, 0, result.stderr)


class SourceRootDiscoveryTests(unittest.TestCase):
    """A route gated on a value nobody sets is a route that never runs.

    The helper builder could not start without a writable checkout, and the
    only way to name one was an environment variable that no lesson run had.
    So "build the missing helper" was unreachable by construction, and every
    lesson needing a new visual quietly shipped a substitute instead.
    """

    def find_source(self, root: str, env: dict | None = None) -> subprocess.CompletedProcess:
        environ = dict(os.environ)
        for name in ("LESSON_V4_SOURCE_ROOT", "LESSON_RESOURCES_SOURCE_ROOT"):
            environ.pop(name, None)
        environ.update(env or {})
        return subprocess.run(
            [sys.executable, str(VERIFY), "--find-source", root],
            capture_output=True,
            text=True,
            env=environ,
        )

    def test_a_checkout_is_found_without_an_environment_value(self):
        result = self.find_source(str(ROOT))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue(result.stdout.startswith("PLUGIN_SOURCE_ROOT="))

    def test_an_explicit_environment_value_is_honoured(self):
        result = self.find_source(
            str(ROOT), {"LESSON_V4_SOURCE_ROOT": str(ROOT)}
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(str(ROOT.resolve()), result.stdout)

    def test_a_tree_that_is_not_a_checkout_is_refused_with_its_reason(self):
        with tempfile.TemporaryDirectory() as temp:
            result = self.find_source(temp)
            # Either nothing is found, or discovery falls through to a real
            # checkout - but the bare temporary directory is never accepted.
            self.assertNotIn(f"PLUGIN_SOURCE_ROOT={temp}", result.stdout)
            if result.returncode != 0:
                self.assertIn("PLUGIN_SOURCE_ROOT_UNAVAILABLE", result.stderr)


class HelperRouteContractTests(unittest.TestCase):
    """The instructions a run follows when a helper turns out to be missing."""

    def test_the_runtime_sends_a_build_decision_to_the_route(self):
        text = PLAYBOOK.read_text(encoding="utf-8")
        self.assertIn("check-helper-coverage.py", text)
        self.assertIn("references/helper-route.md", text)
        self.assertIn("HELPER_DELIVERY_OK", text)
        # Read only on the runs that need it, so an ordinary lesson does not
        # pay for a route it never takes.
        self.assertIn("only when a `build` decision exists", text)

    def test_the_route_launches_the_builder_and_names_its_inputs(self):
        text = HELPER_ROUTE.read_text(encoding="utf-8")
        self.assertIn("helper-builder", text)
        for field in ("PLUGIN_ROOT:", "WORKING_DIR:", "HELPERS:", "HELPER 1:",
                      "BUILD OR GROW:", "DEPICTS:", "SURFACES:"):
            self.assertIn(field, text)
        self.assertIn("pending-helper/", text)
        # The route closes its decision as a substitute that names its picture,
        # and hands the check itself back to the runtime, which every run
        # reaches. A second copy here is what made the check invisible to the
        # runs that never take this route.
        self.assertIn("`substitute`", text)
        self.assertIn("picture", text)
        self.assertNotIn("check-helper-coverage.py", text)

    def test_the_route_never_writes_to_the_package_or_publishes(self):
        # A helper is commissioned mid-lesson, from one lesson's need, and nobody
        # has looked at it. Writing it into the engine puts unreviewed drawing
        # code in front of every future lesson; pushing it publishes that code to
        # everyone the package installs for. Neither is a lesson run's decision.
        for path in (HELPER_ROUTE, HELPER_BUILDER):
            text = path.read_text(encoding="utf-8")
            lowered = text.lower()
            self.assertNotIn("--find-source", text, path.name)
            self.assertNotIn("git commit", lowered, path.name)
            self.assertNotIn("git push", lowered, path.name)
            self.assertNotIn("and push", lowered, path.name)
        builder = HELPER_BUILDER.read_text(encoding="utf-8")
        self.assertIn("never run git", builder)
        self.assertIn("do not commit, and do not push", builder)
        # The build no longer edits a checkout, so it cannot version one either.
        self.assertNotIn("plugin.json", builder)

    def test_the_route_does_not_hold_phase_two_behind_the_build(self):
        # The build writes into the run's own working folder and changes no
        # catalogue a designer reads, so nothing downstream can read a stale one.
        text = HELPER_ROUTE.read_text(encoding="utf-8")
        self.assertIn("changes no", text)
        self.assertIn("nothing has to wait", text)

    def test_a_helper_built_in_the_run_is_not_live_in_the_run(self):
        # It has been rendered by nobody, so the lesson takes the picture route
        # and the decision closes as substitute rather than covered.
        text = HELPER_ROUTE.read_text(encoding="utf-8")
        self.assertIn("picture route", text)
        self.assertIn("substitute", text)
        self.assertIn("/install-helper", text)

    def test_one_builder_covers_every_decision_in_the_run(self):
        # Every helper build edits the same dispatcher, registry, parity manifest
        # and catalogues, so parallel builders collide in them and sequential
        # ones repeat the whole read-wire-render-guard cycle each time.
        text = HELPER_ROUTE.read_text(encoding="utf-8")
        self.assertIn("not one spawn", text)
        builder = HELPER_BUILDER.read_text(encoding="utf-8")
        self.assertIn("HELPERS: [count]", builder)

    def test_the_route_makes_the_builder_name_what_a_visual_is_drawn_from(self):
        # The failure this guards: a location map built from polygon points
        # chosen by eye, while eight real map images sat in builder/assets/maps.
        text = HELPER_ROUTE.read_text(encoding="utf-8")
        self.assertIn("DEPICTS:", text)
        self.assertIn("real place or a real object", text)

    def test_the_builder_knows_both_kinds_and_the_drop_in_route(self):
        text = HELPER_BUILDER.read_text(encoding="utf-8")
        self.assertIn("Two kinds of helper", text)
        self.assertIn("drawn helper", text.lower())
        self.assertIn("stock helper", text.lower())
        # Image generation belongs to the builder here; routing it through the
        # lesson picture stage would drag a per-lesson provenance ledger onto a
        # picture made once for the package.
        self.assertIn("your own image generation", text)
        self.assertIn("pending-helper", text)
        # The old wiring pointed at a repository this package no longer lives in.
        self.assertNotIn("teaching-plugins", text)

    def test_the_run_report_tells_the_teacher_how_to_install_a_waiting_helper(self):
        # The build now ends in the run's own folder and nothing else surfaces
        # it, so a helper the report does not name is a helper nobody installs.
        text = PLAYBOOK.read_text(encoding="utf-8")
        self.assertIn("pending-helper/", text)
        self.assertIn("/install-helper", text)
        self.assertIn("installs it", text)

    def test_the_installer_command_exists_and_never_publishes_on_its_own(self):
        command = ROOT / "commands" / "install-helper.md"
        self.assertTrue(command.is_file())
        text = command.read_text(encoding="utf-8")
        self.assertIn("install-pending-helper.py", text)
        self.assertIn("PENDING_HELPER_OK", text)
        self.assertIn("npm run check", text)
        # Publishing puts the drawing in front of every lesson anyone builds.
        self.assertIn("Do not commit and do not push until the teacher says to",
                      text)

    def test_the_authoring_guide_carries_the_stock_helper_wiring(self):
        text = HELPER_AUTHORING.read_text(encoding="utf-8")
        self.assertIn("drawn or stock", text)
        self.assertIn("builder/assets/", text)

    def test_the_authoring_guide_forbids_inventing_real_world_geometry(self):
        # A bar chart is right when it matches the lesson's numbers; a coastline
        # is right only when it matches the world. The drawn/stock test alone
        # does not separate those, because a real-world figure can still be
        # configurable - which is how a hand-drawn Amazon map got built.
        text = HELPER_AUTHORING.read_text(encoding="utf-8")
        self.assertIn("fact about the world", text)
        self.assertIn("depicts", text)
        self.assertIn("mismatched the world", text)
        builder = HELPER_BUILDER.read_text(encoding="utf-8")
        self.assertIn("fact about the world", builder)
        self.assertNotIn("`teaching-plugins` is its own git repo", text)


class EverySurfaceDescribesItsOwnHelpers(unittest.TestCase):
    """The inventory is the only thing a helper decision is made from.

    A Year 4 place-value run (3 September 2026) read `place-value-chart` under
    LIVE HELPERS slides and was told "Place names across the top, a row per
    number. Fill a row to hand a number over, leave it empty to be written in".
    Nothing there mentions counters, and the run concluded - reasonably, from
    what it was shown - that the board could not draw a counter chart at all. It
    spent a helper build, a design revision, two image scouts and two failed
    generations getting pictures of a chart the board draws natively, and a
    focused repair later drew them with that helper anyway.

    The description was not out of date. It was the WORKSHEET's, where
    `place-value-chart` is the digits chart and counters are a different helper
    called `place-value-counter-chart`, and every surface was being labelled from
    that one file.
    """

    def helpers_and_lines(self, surface: str) -> tuple[list[str], dict[str, str]]:
        spec = importlib.util.spec_from_file_location("coverage_module", COVERAGE)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        keys = sorted(module.registry_keys(ROOT, surface))
        return keys, module.purposes(ROOT, surface)

    def test_a_slide_helper_is_described_from_the_slide_reference(self):
        keys, lines = self.helpers_and_lines("slides")
        undescribed = [key for key in keys if not lines.get(key)]
        self.assertEqual(
            undescribed, [],
            "these slide helpers have no row in the templates.md helper table, so a "
            "reader choosing between them has only the name: " + ", ".join(undescribed),
        )

    def test_the_slide_chart_says_it_draws_counters(self):
        # The specific sentence the failed run needed and did not get. Counters
        # are what separates this helper from the worksheet's same-named one.
        _, lines = self.helpers_and_lines("slides")
        self.assertIn("counter", lines["place-value-chart"].lower())

    def test_a_surface_never_borrows_another_surface_s_words(self):
        # The discrimination: worksheets have their own `place-value-chart`,
        # meaning the digits chart, and it must keep saying that. Two surfaces
        # sharing a key is exactly when borrowing goes wrong.
        _, slides = self.helpers_and_lines("slides")
        _, sheets = self.helpers_and_lines("worksheets")
        self.assertNotEqual(slides["place-value-chart"], sheets["place-value-chart"])
        self.assertNotIn("counter", sheets["place-value-chart"].lower())
        self.assertIn("counter", sheets["place-value-counter-chart"].lower())

    def test_a_surface_with_nothing_written_down_stays_silent(self):
        # The wall and the stick-in pack keep no descriptions, and a bare key is
        # an honest "nothing written down" where another surface's sentence is a
        # confident wrong answer.
        for surface in ("wall", "stick-in"):
            self.assertEqual(self.helpers_and_lines(surface)[1], {})


if __name__ == "__main__":
    unittest.main()
