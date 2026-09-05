"""The two rungs below Unsplash and Wikimedia, and what they refuse.

A Year 4 history lesson (3 September 2026) needed a British classroom around
1900 and the same school today. Neither existed on the two libraries the
pipeline could search, the photographs it actually wanted were sitting on Essex
Record Office's own blog, and the lesson shipped with no slides, no worksheet
and no answer key.

Two rungs were added below the designer's chosen profile. `openverse` searches
about a hundred collections at once and every result carries its own licence, so
it needs no judgement from anybody. `web` leaves the indexed libraries and takes
the picture from the institution that holds it, which is the only rung where
what may be taken, and from whom, has to be decided - so that is most of what
this file guards.

Run:
  python3 -m pytest scripts/tests/test_picture_ladder_sources.py
"""
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


openverse = load("test_ladder_openverse", "openverse_fetch.py")
web = load("test_ladder_web", "web_fetch.py")
compiler = load("test_ladder_compiler", "compile-picture-assignments.py")
scout_validator = load("test_ladder_scout_validator", "validate-image-scout.py")


def jpeg_bytes() -> bytes:
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "candidate.jpg"
        Image.new("RGB", (48, 32), (30, 90, 150)).save(path, "JPEG")
        return path.read_bytes()


class OpenverseLicences(unittest.TestCase):
    """Openverse states a licence for everything it returns, in short codes."""

    def test_only_the_same_set_the_other_real_routes_allow(self):
        for code in ("cc0", "pdm", "by", "by-sa", "BY-SA", " by "):
            with self.subTest(code=code):
                self.assertTrue(openverse.is_allowed_licence(code))
        # A picture must not become more freely usable by arriving through a
        # different door, so non-commercial and no-derivatives are refused here
        # exactly as the Wikimedia route refuses them.
        for code in ("by-nc", "by-nd", "by-nc-sa", "by-nc-nd", "nc", ""):
            with self.subTest(code=code):
                self.assertFalse(openverse.is_allowed_licence(code))

    def test_a_licence_url_is_filled_from_the_licence_not_from_memory(self):
        """Openverse usually publishes the URL; when it does not, the address
        the named licence publishes for itself is supplied, and nothing else."""
        self.assertEqual(
            openverse.licence_url("by-sa", "4.0", ""),
            "https://creativecommons.org/licenses/by-sa/4.0/",
        )
        self.assertEqual(
            openverse.licence_url("cc0", "1.0", ""),
            "https://creativecommons.org/publicdomain/zero/1.0/",
        )
        # What the API gave always wins over the derived form.
        self.assertEqual(
            openverse.licence_url("by", "2.0", "https://example.org/stated"),
            "https://example.org/stated",
        )

    def test_a_restricted_result_never_reaches_a_candidate(self):
        results = [
            {"id": "ok", "title": "A school in 1900", "url": "https://example.org/a.jpg",
             "foreign_landing_url": "https://example.org/a", "creator": "City Archive",
             "license": "by", "license_version": "2.0",
             "license_url": "https://creativecommons.org/licenses/by/2.0/", "source": "flickr"},
            {"id": "nope", "title": "Restricted", "url": "https://example.org/b.jpg",
             "foreign_landing_url": "https://example.org/b", "creator": "Someone",
             "license": "by-nc-nd", "license_version": "4.0",
             "license_url": "https://creativecommons.org/licenses/by-nc-nd/4.0/", "source": "flickr"},
        ]

        class FakeResponse:
            def __init__(self, payload):
                self._payload = json.dumps(payload).encode()

            def read(self):
                return self._payload

            def __enter__(self):
                return self

            def __exit__(self, *_):
                return False

        with mock.patch.object(
            openverse.urllib.request, "urlopen",
            return_value=FakeResponse({"results": results}),
        ):
            found = openverse.search_openverse_once("school 1900", 3)
        self.assertEqual([row["identifier"] for row in found], ["ok"])


class OpenWebRefusals(unittest.TestCase):
    """The open web is the one rung where the holder has to be chosen."""

    def test_a_picture_library_is_refused(self):
        """Selling the licence is their whole business, so taking the preview
        is not fair dealing under any reading of it."""
        for url in (
            "https://www.gettyimages.co.uk/photos/victorian-classroom",
            "https://www.alamy.com/stock-photo-school.html",
            "https://www.shutterstock.com/image-photo/classroom-123",
            "https://media.istockphoto.com/id/1/photo.jpg",
        ):
            with self.subTest(url=url):
                self.assertIsNotNone(web.blocked_reason(url))
                self.assertIn("picture library", web.blocked_reason(url))

    def test_an_aggregator_or_social_feed_is_refused(self):
        """The poster is not the rights holder, and provenance pointing at a
        re-poster is worse than none because it looks like some."""
        for url in (
            "https://www.pinterest.co.uk/pin/123/",
            "https://www.instagram.com/p/abc/",
            "https://pbs.twimg.com/media/abc.jpg",
        ):
            with self.subTest(url=url):
                self.assertIn("aggregator", web.blocked_reason(url) or "")

    def test_an_archive_museum_or_school_page_is_allowed(self):
        for url in (
            "https://www.essexrecordofficeblog.co.uk/school-then-and-now/",
            "https://www.shakespeare.org.uk/explore-shakespeare/blogs/hornbook/",
            "https://collection.sciencemuseumgroup.org.uk/objects/co123",
            "https://www.nationalarchives.gov.uk/education/photo.jpg",
        ):
            with self.subTest(url=url):
                self.assertIsNone(web.blocked_reason(url))

    def test_a_candidate_with_no_publisher_or_terms_note_is_refused(self):
        """Both fields carry the record a teacher could check. A fetch missing
        either produces provenance nobody can follow, which is the one thing
        this route must not do."""
        base = {
            "page_url": "https://www.essexrecordofficeblog.co.uk/post/",
            "image_url": "https://www.essexrecordofficeblog.co.uk/img.jpg",
            "publisher": "Essex Record Office",
            "terms_note": "no reuse prohibition stated on the page",
        }
        web.check_candidate(dict(base), 1)
        for field in ("publisher", "terms_note", "page_url", "image_url"):
            with self.subTest(missing=field):
                broken = dict(base)
                broken[field] = "  "
                with self.assertRaises(web.CandidateRefused):
                    web.check_candidate(broken, 1)

    def test_half_a_licence_is_refused(self):
        """A name with no address cannot be checked, and an address with no name
        is not what the page said."""
        base = {
            "page_url": "https://museum.example.ac.uk/object/1",
            "image_url": "https://museum.example.ac.uk/object/1.jpg",
            "publisher": "A University Museum",
            "terms_note": "page states CC BY 4.0",
        }
        with self.assertRaises(web.CandidateRefused):
            web.check_candidate({**base, "licence_name": "CC BY 4.0"}, 1)
        with self.assertRaises(web.CandidateRefused):
            web.check_candidate({**base, "licence_url": "https://example.org/l"}, 1)


class OpenWebProvenance(unittest.TestCase):
    def test_a_stated_licence_governs_and_is_recorded_verbatim(self):
        name, url = web.resolved_licence({
            "licence_name": "CC BY 4.0",
            "licence_url": "https://creativecommons.org/licenses/by/4.0/",
        })
        self.assertEqual(name, "CC BY 4.0")
        self.assertEqual(url, "https://creativecommons.org/licenses/by/4.0/")

    def test_a_page_stating_nothing_records_the_credited_exception(self):
        """An archive blog usually states no licence. What gets recorded is the
        basis the picture is actually used on - fair dealing for illustration
        for instruction, credited - not a licence nobody granted."""
        name, url = web.resolved_licence({"publisher": "Essex Record Office"})
        self.assertEqual(name, web.EDUCATION_EXCEPTION_NAME)
        self.assertIn("CDPA 1988 s.32", name)
        self.assertEqual(url, "https://www.legislation.gov.uk/ukpga/1988/48/section/32")

    def test_a_fetched_candidate_carries_the_page_and_the_credit(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            image = root / "photo.jpg"
            image.write_bytes(jpeg_bytes())
            row = web.candidate_metadata(image, {
                "page_url": "https://www.essexrecordofficeblog.co.uk/school-then-and-now/",
                "image_url": "https://www.essexrecordofficeblog.co.uk/img.jpg",
                "publisher": "Essex Record Office",
                "terms_note": "no reuse prohibition stated on the page",
            }, 1)
        self.assertEqual(row["source"], "web")
        self.assertEqual(row["creator"], "Essex Record Office")
        self.assertEqual(
            row["source_page_url"],
            "https://www.essexrecordofficeblog.co.uk/school-then-and-now/",
        )
        self.assertTrue(row["licence_name"] and row["licence_url"])
        # The scout's own result validator has to accept every mechanical field
        # this fetcher writes, or a good fetch fails at the gate after it.
        expected = {"candidate_id", "sha256", "byte_count", "width", "height",
                    "decoded_format", "source", "source_page_url", "creator",
                    "licence_name", "licence_url", "description", "path"}
        self.assertEqual(set(row), expected)

    def test_the_result_validator_reads_the_refusals_back(self):
        """The fetcher refuses these hosts, so a result naming one proves the
        record was written by hand rather than by the fetch."""
        self.assertFalse(scout_validator.open_web_page_allowed("https://www.alamy.com/x"))
        self.assertTrue(
            scout_validator.open_web_page_allowed(
                "https://www.essexrecordofficeblog.co.uk/school-then-and-now/"
            )
        )
        self.assertIn("openverse", scout_validator.REAL_SOURCES)
        self.assertIn("web", scout_validator.REAL_SOURCES)


class OpenWebStepSummary(unittest.TestCase):
    """The summary this rung writes is checked against the step that compiled it.

    `validate-image-scout.py` requires `requested_count` to equal the compiled
    `candidate_count`, so a fetch of two scout-chosen candidates against a
    three-candidate step must still record three, or a good fetch is thrown out
    at the gate after it.
    """

    def run_fetch(self, candidates, count, root):
        import subprocess
        import sys as _sys

        spec = root / "candidates.json"
        spec.write_text(json.dumps(candidates), encoding="utf-8")
        out = root / "web-r1"
        completed = subprocess.run(
            [_sys.executable, str(ROOT / "web_fetch.py"), "a classroom around 1900",
             "--candidates", str(spec), "--count", str(count), "--output", str(out)],
            capture_output=True, text=True,
        )
        summary = out / "_search-summary-web-r1.json"
        return completed, (json.loads(summary.read_text(encoding="utf-8")) if summary.is_file() else None)

    def test_the_compiled_count_is_recorded_not_the_number_chosen(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            candidates = [{
                "page_url": "https://www.gettyimages.co.uk/photos/x",
                "image_url": "https://media.gettyimages.com/x.jpg",
                "publisher": "Getty",
                "terms_note": "stock",
            }]
            _, summary = self.run_fetch(candidates, 3, root)
        self.assertEqual(summary["source"], "web")
        self.assertEqual(summary["round"], 1)
        self.assertEqual(summary["requested_count"], 3)

    def test_a_refusal_is_a_finished_answer_not_an_incomplete_call(self):
        """A refused candidate is a semantic result. Marking the step incomplete
        would send the scout into the retry route reserved for outages, which
        proves nothing about the picture and repeats nothing useful."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            candidates = [{
                "page_url": "https://www.pinterest.co.uk/pin/1/",
                "image_url": "https://i.pinimg.com/1.jpg",
                "publisher": "someone",
                "terms_note": "reposted",
            }]
            completed, summary = self.run_fetch(candidates, 3, root)
        self.assertTrue(summary["complete"])
        self.assertEqual(summary["results"], [])
        self.assertIn("aggregator", summary["error"])
        self.assertIn("REFUSED", completed.stdout)


class LadderSchedule(unittest.TestCase):
    def photo(self, **overrides):
        base = {
            "id": "photo-001",
            "subject": "a classroom around 1900",
            "filename": "unsplash/classroom.jpg",
            "acquisition_mode": "authentic-real",
            "source_profile": "wikimedia-only",
            "fallback_action": "unsatisfied",
            "essential": True,
            "coherent_group": None,
            "coherent_mode": "none",
        }
        base.update(overrides)
        return base

    def test_authentic_evidence_leads_with_openverse(self):
        """The rung that answers first is the only one that gets paid for.

        Each rung costs a fetch and, far more expensively, a visual inspection
        pass. A real thing at a real date in a real place lives in an archive, a
        museum or a library - which is what Openverse searches and what stock
        photography by definition does not hold - so reaching it after the stock
        rungs spends two inspections finding that out.
        """
        for profile in ("unsplash-only", "wikimedia-only", "unsplash-then-wikimedia"):
            with self.subTest(profile=profile):
                steps = compiler.source_schedule(
                    self.photo(source_profile=profile, acquisition_mode="authentic-real")
                )
                self.assertEqual(steps[0]["source"], "openverse")
                # The designer's own profile still runs, behind it.
                self.assertIn(profile.split("-")[0], [step["source"] for step in steps])

    def test_an_ordinary_picture_with_an_ai_fallback_gets_no_extra_real_rung(self):
        """The contract has already said a faithful generated picture teaches
        the same thing, so a second real search before generation is a rung
        nobody needed - one search, then generate."""
        steps = compiler.source_schedule(self.photo(
            acquisition_mode="ordinary-real", source_profile="unsplash-only",
            fallback_action="ai"))
        self.assertEqual([step["source"] for step in steps], ["unsplash"])

    def test_an_ordinary_picture_that_cannot_be_generated_still_gets_openverse(self):
        """With no AI substitute authorised, a real photograph is the only
        answer, so the extra real rung is worth its call - after the profile,
        because an ordinary object is what stock photography is good at."""
        steps = compiler.source_schedule(self.photo(
            acquisition_mode="ordinary-real", source_profile="unsplash-only",
            fallback_action="omit", essential=False))
        self.assertEqual([step["source"] for step in steps], ["unsplash", "openverse"])

    def test_the_open_web_is_authorised_only_where_the_lesson_would_lose_the_picture(self):
        """It is the expensive rung - it needs the scout's own web search before
        anything can be fetched - and the only one needing a judgement about
        reuse, so it runs for the one case that costs a lesson."""
        terminal = compiler.source_schedule(self.photo(fallback_action="unsatisfied"))
        self.assertEqual(terminal[-1]["source"], "web")

        # An AI fallback delivers a picture either way.
        with_ai = compiler.source_schedule(self.photo(
            acquisition_mode="ordinary-real", fallback_action="ai"))
        self.assertNotIn("web", [step["source"] for step in with_ai])

        # An omittable picture leaves the lesson no poorer.
        omitted = compiler.source_schedule(self.photo(
            fallback_action="omit", essential=False))
        self.assertNotIn("web", [step["source"] for step in omitted])

    def test_a_generated_picture_climbs_no_ladder_at_all(self):
        """`controlled-ai` is a decision that no photograph can show this, so
        there is nothing to search for and the run goes straight to generation."""
        steps = compiler.source_schedule(self.photo(
            acquisition_mode="controlled-ai", source_profile="none", fallback_action="omit"))
        self.assertEqual(steps, [])


if __name__ == "__main__":
    unittest.main()


class ControlledAiIsEarnedByStagingTests(unittest.TestCase):
    """A route with no real rung behind it must be earned, not reached for.

    `controlled-ai` has `source_profile: none` and cannot take an AI fallback,
    because AI is already primary - so on a host with no generation route it
    ends with no picture and nothing left to try. A Year 4 circuits lesson
    declared all six of its pictures that way, including a cell in a battery
    holder and a lamp in a lamp holder, and arrived with none. Ordinary
    photography holds both of those; only its two staged fault circuits had
    earned the mode.
    """

    def test_the_designer_is_told_a_named_object_is_not_staging(self) -> None:
        text = (ROOT.parent / "agents" / "lesson-designer.md").read_text(encoding="utf-8")
        self.assertIn("A single named object is not staging", text)
        self.assertIn("earned by the STAGING", text)
        self.assertIn("`ordinary-real` with `fallback_action: ai`", text)

    def test_the_template_keeps_the_picture_and_the_route_apart(self) -> None:
        # Deciding a visual is a picture rather than an engine helper is one
        # decision; where the picture comes from is another. Collapsing them
        # sent every named apparatus straight to generation.
        text = (ROOT.parent / "references" / "output-template.md").read_text(encoding="utf-8")
        self.assertIn("does not settle where the picture comes from", text)
        self.assertIn("two decisions, not one", text)

    def test_controlled_ai_still_has_no_real_rung_to_fall_back_on(self) -> None:
        # The reason the rule above matters. If this ever changes, the rule can
        # be relaxed; while it holds, the mode is a one-way door.
        photo = {
            "id": "photo-001", "subject": "a staged combination",
            "pedagogical_constraint": "", "teaching_requirement": "identify it",
            "load_bearing_evidence": ["the thing"], "use": "slide", "essential": True,
            "filename": "ai/x.jpg", "acquisition_mode": "controlled-ai",
            "source_profile": "none", "fallback_action": "omit", "fallback_note": None,
            "generation_prompt": {
                "physical_state": "one intact object on a plain surface",
                "must_avoid": ["logos"], "text_rule": "no generated text",
                "composition": "single clear subject",
            },
            "coherent_group": None, "coherent_mode": "none",
            "coherent_visual_invariants": [],
        }
        self.assertEqual(compiler.source_schedule(photo), [])
