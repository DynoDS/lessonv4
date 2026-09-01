"""The Working Wall Designer's packet: a view to copy from and a reference cut to fit.

The wall designer read an 88 KB role and two complete wall references, then
hunted through the lesson design, the slide spec and the photo contract for
the handful of strings a card can carry, on every run, to produce one card.
The hunt is where paraphrase happens, and the role's own rule is that a
paraphrased success-criteria step is a card contradicting the board it hangs
beside. So the orchestrator now generates the packet deterministically, the
way it already does for the Design Reviewer. These tests hold it honest: the
view copies byte for byte with source IDs, the reference offers exactly the
card families the lesson's evidence triggers, every family the builder renders
has a contract to cut, and the role and playbook route through the packet.
"""
from __future__ import annotations

import importlib.util
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "working-wall-packet.py"
FIXTURES = Path(__file__).with_name("fixtures") / "working-wall-packet" / "geography"
ROLE = ROOT / "agents" / "working-wall-designer.md"
PLAYBOOK = ROOT / "skills" / "make-lesson" / "playbook-lite.md"
CONTRACTS = ROOT / "references" / "working-wall-card-contracts.md"
BUILD = ROOT / "working-wall-html" / "build.js"
VISUALS = ROOT / "working-wall-html" / "src" / "visuals.js"


def load_module():
    spec = importlib.util.spec_from_file_location("working_wall_packet", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


packet = load_module()


def run_prepare(working_dir: Path, *, lesson: Path | None, photos: Path | None) -> tuple[subprocess.CompletedProcess, Path, Path, Path]:
    view = working_dir / "working-wall-view.md"
    reference = working_dir / "working-wall-reference.md"
    receipt = working_dir / "working-wall-packet.receipt.json"
    command = [
        sys.executable, "-X", "utf8", str(SCRIPT), "prepare",
        "--plugin-root", str(ROOT),
        "--working-dir", str(working_dir),
        "--lesson-design", str(working_dir / "lesson-design.json"),
        "--view-output", str(view),
        "--reference-output", str(reference),
        "--receipt-output", str(receipt),
    ]
    if lesson is not None:
        command += ["--lesson", str(lesson)]
    if photos is not None:
        command += ["--photo-requirements", str(photos)]
    result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8")
    return result, view, reference, receipt


@pytest.fixture
def geography(tmp_path: Path) -> Path:
    working = tmp_path / "year-4-geography-lesson-1"
    working.mkdir()
    for name in ("lesson-design.json", "lesson.json", "photo-requirements.json", "working-wall.json"):
        shutil.copy(FIXTURES / name, working / name)
    return working


def maths_design(tmp_path: Path, **overrides) -> Path:
    """A minimal maths-shaped design: a steps criterion, no photos, one representation."""
    design = {
        "schemaVersion": 2,
        "lesson": {"structure": "Skill-based", "subject": "Maths", "yearGroup": 4, "lo": "To add fractions", "displayedLo": "To add fractions"},
        "starter": {"sourceUnitId": "lesson-section/starter/unit-001", "label": "Starter", "kind": "retrieval", "content": {"question": "What is 1/4 + 1/4?"}, "modellingState": None, "representationRefs": []},
        "vocabulary": [{"id": "vocab-001", "term": "numerator", "definition": "The numerator is the top number.", "visual": {"kind": "none"}}],
        "representations": [{"id": "rep-001", "name": "Fraction bar", "purpose": "Show the parts of one whole.", "configurations": [{"id": "teaching", "description": "A fraction bar with five parts.", "loadBearing": True, "requiredFeatures": ["five equal parts"]}]}],
        "successCriteria": [{"id": "sc-001", "type": "steps", "drawLive": True, "content": {"steps": ["Check the bottom numbers match, \"the denominators\".", "Add only the top numbers."]}}],
        "stickyKnowledge": [{"id": "sk-001", "text": "When the bottom numbers match, add the top numbers."}],
        "misconceptions": [],
        "teachingSequence": [
            {"sourceUnitId": "lesson-section/teaching-sequence/unit-001", "label": "My Turn", "kind": "my-turn", "content": {"question": "2/5 + 1/5"}, "modellingState": "Live-complete helper", "answer": {"kind": "exact", "content": "3/5"}, "successCriteriaRefs": ["sc-001"], "representationRefs": [{"ref": "rep-001", "configuration": "teaching", "interaction": "teacher-completes"}]},
        ],
        "ending": {"included": False, "kind": None, "reason": "none", "beat": None},
        "worksheet": {"status": "generated", "contentBlocks": []},
        "slideDesignNotes": [],
        "flagsForTeacher": [],
    }
    design.update(overrides)
    working = tmp_path / "add-fractions"
    working.mkdir()
    (working / "lesson-design.json").write_text(json.dumps(design), encoding="utf-8")
    return working


# ---------------------------------------------------------------------------
# The view copies, byte for byte, with IDs


def test_view_copies_every_card_string_verbatim_with_its_id(geography: Path) -> None:
    result, view, _, _ = run_prepare(geography, lesson=geography / "lesson.json", photos=geography / "photo-requirements.json")
    assert result.stdout.strip() == "WORKING_WALL_PACKET_OK", result.stdout + result.stderr
    text = view.read_text(encoding="utf-8")
    design = json.loads((geography / "lesson-design.json").read_text(encoding="utf-8"))
    for criterion in design["successCriteria"]:
        assert criterion["id"] in text
        for step in criterion["content"]["steps"]:
            assert step in text, step
    for sticky in design["stickyKnowledge"]:
        assert f"{sticky['id']}: {sticky['text']}" in text
    for misconception in design["misconceptions"]:
        assert misconception["belief"] in text
        assert misconception["correctiveFact"] in text
    for entry in design["vocabulary"]:
        assert f"{entry['id']}: {entry['term']}" in text
        assert entry["definition"] in text


def test_a_step_with_a_comma_and_a_quote_survives_byte_for_byte(tmp_path: Path) -> None:
    working = maths_design(tmp_path)
    result, view, _, _ = run_prepare(working, lesson=None, photos=None)
    assert result.stdout.strip() == "WORKING_WALL_PACKET_OK", result.stdout + result.stderr
    text = view.read_text(encoding="utf-8")
    assert '1. Check the bottom numbers match, "the denominators".' in text
    assert "sc-001 (steps; drawLive: true)" in text


def test_the_real_wall_cards_from_the_geography_run_are_in_the_view(geography: Path) -> None:
    """The three strings the wall designer actually printed that day."""
    _, view, _, _ = run_prepare(geography, lesson=geography / "lesson.json", photos=geography / "photo-requirements.json")
    text = view.read_text(encoding="utf-8")
    wall = json.loads((geography / "working-wall.json").read_text(encoding="utf-8"))
    card = wall["cards"][0]
    assert card["heroPhoto"] in text
    assert card["heroCaption"] in text
    for group in card["groups"]:
        for item in group["items"]:
            assert item in text, item


def test_rendered_figures_are_copied_from_the_slide_spec(geography: Path) -> None:
    _, view, _, receipt = run_prepare(geography, lesson=geography / "lesson.json", photos=geography / "photo-requirements.json")
    text = view.read_text(encoding="utf-8")
    lesson = json.loads((geography / "lesson.json").read_text(encoding="utf-8"))
    objects = packet.rendered_objects(lesson)
    assert objects, "the fixture must carry drawn figures"
    kinds = {item.get("type") for _, _, item in objects}
    assert {"map", "sc-panel"} <= kinds
    for number, path, item in objects:
        assert f"- slide {number} `{path}`: {packet.compact(item)}" in text
    # A success-criteria panel on the board is the very thing a card copies.
    panel = next(item for _, _, item in objects if item.get("type") == "sc-panel")
    assert packet.compact(panel) in text


def test_without_a_slide_spec_the_view_says_so(tmp_path: Path) -> None:
    working = maths_design(tmp_path)
    _, view, _, _ = run_prepare(working, lesson=working / "lesson.json", photos=None)
    text = view.read_text(encoding="utf-8")
    assert "No slide spec was available" in text
    assert "does not exist" in text


def test_photographs_carry_their_terminal_state(geography: Path) -> None:
    receipts = geography / "orchestration-receipts" / "picture-terminal"
    receipts.mkdir(parents=True)
    photos = json.loads((geography / "photo-requirements.json").read_text(encoding="utf-8"))["photos"]
    first, second = photos[0]["filename"], photos[1]["filename"]
    (receipts / "a.json").write_text(json.dumps({"filename": first, "terminalState": "published"}), encoding="utf-8")
    (receipts / "b.json").write_text(json.dumps({"filename": second, "terminalState": "unsatisfied"}), encoding="utf-8")
    _, view, _, _ = run_prepare(geography, lesson=geography / "lesson.json", photos=geography / "photo-requirements.json")
    text = view.read_text(encoding="utf-8")
    assert f"`{first}` [published]" in text
    assert f"`{second}` [unsatisfied]" in text
    assert "[promised, not yet terminal]" in text


def test_the_designs_own_wall_decision_is_surfaced_as_evidence(tmp_path: Path) -> None:
    working = maths_design(
        tmp_path,
        resourceOpportunities={
            "stickIn": {"decision": "none", "sourceUnitIds": [], "reason": "Every answer is a number written in the book."},
            "workingWall": {"decision": "candidate", "sourceUnitIds": ["lesson-section/teaching-sequence/unit-001"], "reason": "The method is repeated for a fortnight."},
        },
    )
    _, view, _, _ = run_prepare(working, lesson=None, photos=None)
    text = view.read_text(encoding="utf-8")
    assert "## The design's own wall decision" in text
    assert "The method is repeated for a fortnight." in text
    assert "It is evidence, not the verdict" in text


# ---------------------------------------------------------------------------
# The reference offers what the lesson triggers


def test_a_geography_lesson_with_photographs_is_offered_the_photo_families(geography: Path) -> None:
    _, _, reference, receipt = run_prepare(geography, lesson=geography / "lesson.json", photos=geography / "photo-requirements.json")
    data = json.loads(receipt.read_text(encoding="utf-8"))
    offered = data["offeredCardFamilies"]
    for family in ("photoMapOverview", "heroCallouts", "causeCards", "stickyKnowledge", "misconception", "vocabDefinition", "vocabChips"):
        assert family in offered, family
    text = reference.read_text(encoding="utf-8")
    assert "### heroCallouts" in text
    assert "### mnemonicPoster" not in text
    assert "## Card families not offered" in text
    assert "- `mnemonicPoster`" in text
    assert "- `banner`" in text


def test_a_maths_lesson_without_photographs_gets_no_photo_family(tmp_path: Path) -> None:
    working = maths_design(tmp_path)
    _, _, reference, receipt = run_prepare(working, lesson=None, photos=None)
    data = json.loads(receipt.read_text(encoding="utf-8"))
    offered = data["offeredCardFamilies"]
    assert "photoMapOverview" not in offered
    assert "heroCallouts" not in offered
    assert "causeCards" not in offered
    assert "misconception" not in offered, "misconceptions: [] offers no misconception card"
    assert "vocabChips" not in offered, "one word is not a chip set"
    assert "workedExample" in offered, "a steps criterion and a modelled unit trigger the worked example"
    assert "stickyKnowledge" in offered
    text = reference.read_text(encoding="utf-8")
    assert "### photoMapOverview" not in text
    assert "### workedExample" in text
    assert "## Step labels in worked examples" in text, "the family's own preference section rides with it"
    assert "## Misconception cards" not in text
    # No slide spec, so every primitive is offered rather than guessed at.
    assert data["offeredPrimitives"] == packet.visual_primitives(ROOT)
    assert "### fractionBar" in text


def test_furniture_is_never_offered_by_evidence(geography: Path) -> None:
    _, _, reference, receipt = run_prepare(geography, lesson=geography / "lesson.json", photos=geography / "photo-requirements.json")
    data = json.loads(receipt.read_text(encoding="utf-8"))
    assert "sectionHeading" not in data["offeredCardFamilies"]
    assert "banner" not in data["offeredCardFamilies"]
    text = reference.read_text(encoding="utf-8")
    assert "explicit request" in text
    assert str(CONTRACTS) in text, "the full contracts file is named so a requested banner can still be specified"


def test_the_reference_carries_the_always_rules_and_points_at_the_full_files(geography: Path) -> None:
    _, _, reference, _ = run_prepare(geography, lesson=geography / "lesson.json", photos=geography / "photo-requirements.json")
    text = reference.read_text(encoding="utf-8")
    for heading in ("## The wall-worthy test", "## The load-bearing principle: cards must teach themselves", "## Every card carries a visual: the entry ticket", "## When to combine items on one card", "## Every card", "## Full files"):
        assert heading in text, heading
    assert "(renderer's job)" not in text, "the renderer's own moves are facts about the builder, not designer decisions"
    assert "Open a full file only when you want a card family this packet did not offer" in text


# ---------------------------------------------------------------------------
# Drift guards: the engine is the source of truth


def test_every_card_family_the_builder_renders_has_a_contract_and_a_trigger() -> None:
    families = packet.card_families(ROOT)
    assert len(families) >= 15
    contracts = packet.HeadingCutter(CONTRACTS, "contracts")
    for family in families:
        assert family in contracts.index, f"{family} is rendered but has no `### {family}` contract"
    # offered_families raises for a family with no trigger rule.
    triggers = {"modelled": True, "misconceptions": True, "stems": True, "vocabularyCount": 5, "photoCount": 1, "table": True, "diagramReading": True, "equivalence": True, "mnemonic": True, "primitives": []}
    offered = packet.offered_families(triggers, families)
    assert set(offered) == set(families) - {"sectionHeading", "banner"}
    with pytest.raises(packet.PacketError):
        packet.offered_families(triggers, families + ["newFamily"])


def test_every_primitive_the_builder_draws_has_a_contract() -> None:
    primitives = packet.visual_primitives(ROOT)
    assert len(primitives) >= 26
    contracts = packet.HeadingCutter(CONTRACTS, "contracts")
    for key in primitives:
        assert key in contracts.index, f"{key} is drawn but has no `### {key}` spec"


def test_a_missing_heading_fails_loudly(tmp_path: Path) -> None:
    working = maths_design(tmp_path)
    broken_root = tmp_path / "root"
    shutil.copytree(ROOT / "references", broken_root / "references", ignore=shutil.ignore_patterns("*.png"))
    (broken_root / "working-wall-html").mkdir()
    shutil.copy(BUILD, broken_root / "working-wall-html" / "build.js")
    (broken_root / "working-wall-html" / "src").mkdir()
    shutil.copy(VISUALS, broken_root / "working-wall-html" / "src" / "visuals.js")
    preferences = broken_root / "references" / "working-wall-preferences.md"
    preferences.write_text(preferences.read_text(encoding="utf-8").replace("## When to skip a card", "## When to skip"), encoding="utf-8")
    result = subprocess.run(
        [sys.executable, "-X", "utf8", str(SCRIPT), "prepare", "--plugin-root", str(broken_root), "--working-dir", str(working), "--lesson-design", str(working / "lesson-design.json"), "--view-output", str(working / "v.md"), "--reference-output", str(working / "r.md"), "--receipt-output", str(working / "rc.json")],
        capture_output=True, text=True, encoding="utf-8",
    )
    assert result.returncode == 1
    assert result.stdout.startswith("WORKING_WALL_PACKET_ERROR: working-wall-preferences.md has no heading 'When to skip a card'")


def test_an_unreadable_design_fails_loudly(tmp_path: Path) -> None:
    working = tmp_path / "w"
    working.mkdir()
    (working / "lesson-design.json").write_text("{not json", encoding="utf-8")
    result, _, _, _ = run_prepare(working, lesson=None, photos=None)
    assert result.returncode == 1
    assert result.stdout.startswith("WORKING_WALL_PACKET_ERROR: lesson-design.json is not valid JSON")


def test_the_receipt_names_every_input_with_its_hash(geography: Path) -> None:
    _, view, reference, receipt = run_prepare(geography, lesson=geography / "lesson.json", photos=geography / "photo-requirements.json")
    data = json.loads(receipt.read_text(encoding="utf-8"))
    for key in ("lessonDesign", "lesson", "photoRequirements", "cardContracts", "preferences", "visualLanguage", "wallBuilder", "wallVisuals"):
        assert re.fullmatch(r"[0-9a-f]{64}", data["inputs"][key]["sha256"]), key
    assert data["outputs"]["view"]["bytes"] == len(view.read_bytes())
    assert data["outputs"]["reference"]["bytes"] == len(reference.read_bytes())


# ---------------------------------------------------------------------------
# The role and the playbook route through the packet


def test_the_role_reads_the_packet_and_falls_back_only_when_it_is_absent() -> None:
    text = ROLE.read_text(encoding="utf-8")
    assert "`[WORKING_DIR]/working-wall-reference.md` and `[WORKING_DIR]/working-wall-view.md`" in text
    assert "Read the reference first, then the view, both in full." in text
    assert "When either packet file is absent" in text
    assert "working-wall-packet.py\" prepare` yourself" in text
    assert "### Step 1: Read the View" in text
    # The contract material moved out; the judgement stayed.
    assert "### Full schema example" not in text
    assert "| `clock` |" not in text
    assert "Success criteria steps in particular must be verbatim" in text
    assert "leave unread until the lesson-design's anchor" in text
    assert len(text.encode("utf-8")) < 50 * 1024, "the role is judgement now; contracts live in the packet"


def test_the_contracts_file_is_the_one_owner_of_the_moved_material() -> None:
    text = CONTRACTS.read_text(encoding="utf-8")
    assert "## The wall-worthy test" in text
    assert "## Every card" in text
    assert "### workedExample" in text
    assert "### clock" in text
    assert "Wall-worthy criteria, all of which must pass" in text
    assert "Default orientation" in text


def test_track_d_prepares_the_packet_before_the_launch() -> None:
    text = PLAYBOOK.read_text(encoding="utf-8")
    track = text[text.index("### Track D"):text.index("### Track E")]
    assert "working-wall-packet.py\" prepare" in track
    assert "Require `WORKING_WALL_PACKET_OK`" in track
    assert "one infrastructure retry" in track
    assert "FRICTION:" in track
    assert "never skips this launch" in track
