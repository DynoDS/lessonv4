"""Brevity is a review judgement; schema validity is not a word-count vote."""
from __future__ import annotations
import importlib.util
import sys
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
import test_lesson_design_contract as contract

def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / f'{name}.py')
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj

validator = module('validate-lesson-design')
packet = module('design-review-packet')

def test_six_necessary_short_actions_are_not_an_invalid_design():
    design, photos = contract.valid_contract()
    sc = design['successCriteria'][0]
    sc['content']['steps'] = ['Find the endpoints.', 'Find the difference.', 'Count the spaces.',
                             'Divide by the spaces.', 'Count on in steps.', 'Write the missing number.']
    validator.validate_design(design, photos)
    cues = packet.criteria_review_cues(sc)
    assert any('6 steps' in cue for cue in cues)
    assert not any('words' in cue for cue in cues)

def test_a_long_clear_step_is_valid_but_not_invisible_to_review():
    design, photos = contract.valid_contract()
    sc = design['successCriteria'][0]
    sc['content']['steps'] = ['Check the number of spaces, not the number of marks.']
    validator.validate_design(design, photos)
    assert any('10 words' in cue for cue in packet.criteria_review_cues(sc))

def test_the_old_wordy_example_is_still_brought_to_the_reviewers_attention():
    design, photos = contract.valid_contract()
    sc = design['successCriteria'][0]
    sc['content']['steps'] = ['Connect the lamp or buzzer back to the cell to close the loop']
    validator.validate_design(design, photos)
    assert any('repeatable action cue' in cue for cue in packet.criteria_review_cues(sc))

@pytest.mark.parametrize('steps', [[], [''], [None], ['Read the number.', 7]])
def test_schema_faults_still_fail(steps):
    design, photos = contract.valid_contract()
    design['successCriteria'][0]['content']['steps'] = steps
    with pytest.raises(validator.ContractError):
        validator.validate_design(design, photos)

def test_tables_have_review_cues_not_arbitrary_capacity_limits():
    design, photos = contract.valid_contract()
    sc = {'id': 'sc-001', 'type': 'reference-table', 'drawLive': False,
          'content': {'columns': ['Case', 'Action'], 'rows': [
              [f'Case {i}', 'Look at the evidence from both of the sources.'] for i in range(6)]}}
    design['successCriteria'][0] = sc
    validator.validate_design(design, photos)
    cues = packet.criteria_review_cues(sc)
    assert any('6 rows' in cue for cue in cues)
    assert any('cell 2' in cue for cue in cues)
    sc['content']['rows'][0].pop()
    with pytest.raises(validator.ContractError):
        validator.validate_design(design, photos)

def test_simple_inline_condition_is_accepted_without_a_lookup():
    design, photos = contract.valid_contract()
    sc = design['successCriteria'][0]
    sc['content']['steps'] = ['Add one counter.', 'Ten ones? Exchange for one ten.', 'Read the number.']
    validator.validate_design(design, photos)
    assert packet.criteria_review_cues(sc) == []

def test_review_view_surfaces_both_draw_live_decisions_and_count_cues():
    design, photos = contract.valid_contract()
    design['successCriteria'][0]['drawLive'] = True
    design['successCriteria'][0]['content']['steps'] = ['Do the taught action.'] * 6
    view = packet.build_review_view(design, photos)
    assert '(drawLive: true)' in view
    assert 'Review cue (not a failure): 6 steps' in view
    design['successCriteria'][0]['drawLive'] = False
    assert '(drawLive: false)' in packet.build_review_view(design, photos)

def test_guidance_protects_memorable_cues_and_complete_method():
    preferences = (ROOT / 'references/preferences.md').read_text()
    assert 'repeat and call back' in preferences
    assert 'not an absolute ceiling' in preferences
    assert 'Actual unreadability or insufficient working space remains a blocking fault' in preferences
    assert 'simple condition can stay inline' in preferences
    route = (ROOT / 'references/teaching-sequence-skill-based.md').read_text()
    assert 'validator refuses a sixth' not in route
    assert 'validator refuses a step past 8' not in route
