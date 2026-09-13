"""Wording is a review judgement; schema validity is not a word-count vote.

September 2026: the user rewrote real five-step lists of short cues (`Read the
step size.`, `Same? Move one place right.`, `Divide by that many spaces.`) into
longer, plainer steps. Review cues must not push towards compression.
"""
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
    sc['content']['steps'] = ['Choose two labelled numbers.', 'Larger number - smaller number.',
                             'Count the spaces between them.', 'Difference ÷ number of spaces.',
                             'Count on using the answer to check.', 'Write the missing number.']
    validator.validate_design(design, photos)
    cues = packet.criteria_review_cues(sc)
    assert any('6 steps' in cue for cue in cues)
    assert not any('words' in cue for cue in cues)

def test_a_clear_step_the_user_approved_raises_no_length_cue():
    design, photos = contract.valid_contract()
    sc = design['successCriteria'][0]
    sc['content']['steps'] = ['Put < or > between the numbers, with the open side facing the greater number.',
                             'Keep moving right until you find two different digits.']
    validator.validate_design(design, photos)
    assert packet.criteria_review_cues(sc) == []

def test_the_old_wordy_example_is_still_brought_to_the_reviewers_attention():
    design, photos = contract.valid_contract()
    sc = design['successCriteria'][0]
    sc['content']['steps'] = ['Connect the lamp or buzzer back to the cell with a wire so that the loop is closed and the current can flow']
    validator.validate_design(design, photos)
    cues = packet.criteria_review_cues(sc)
    assert any('explanation the teaching already gave' in cue for cue in cues)
    assert not any('short' in cue for cue in cues)

def test_question_fragment_conditions_are_brought_to_review():
    design, photos = contract.valid_contract()
    sc = design['successCriteria'][0]
    sc['content']['steps'] = ['Compare the thousands digits first.', 'Same? Move one place right.',
                             {'text': 'Different? Choose < or >.'}]
    cues = packet.criteria_review_cues(sc)
    assert any('step 2: question-fragment' in cue for cue in cues)
    assert any('step 3: question-fragment' in cue for cue in cues)
    assert not any('step 1' in cue for cue in cues)

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
              [f'Case {i}', 'Look carefully at the evidence from both of the sources before you decide which one it is.'] for i in range(6)]}}
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
    sc['content']['steps'] = ['Add one counter.', 'If you have ten ones, exchange them for one ten.', 'Read the number.']
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

def test_guidance_puts_clarity_before_brevity_and_protects_complete_method():
    preferences = (ROOT / 'references/preferences.md').read_text(encoding='utf-8')
    assert 'as few words as possible without making the child work out what they mean' in preferences
    assert 'There is no word target and no step target' in preferences
    assert 'repeat and call back' not in preferences
    assert 'Aim for 2-5 words' not in preferences
    assert 'Actual unreadability or insufficient working space remains a blocking fault' in preferences
    voice = (ROOT / 'references/teacher-voice.md').read_text(encoding='utf-8')
    assert 'Short but vague is the commonest miss' in voice
    assert 'give the rule that decides the choice' in voice
    assert 'Show the arithmetic when the step is a calculation' in voice
    assert 'Aim for 2-5 words' not in voice
    reviewer = (ROOT / 'agents/design-reviewer.md').read_text(encoding='utf-8')
    assert 'short, memorable and easy to call back' not in reviewer
    assert "from the steps' words alone" in reviewer
    route = (ROOT / 'references/teaching-sequence-skill-based.md').read_text(encoding='utf-8')
    assert 'validator refuses a sixth' not in route
    assert 'validator refuses a step past 8' not in route

def test_a_second_sentence_inside_a_step_is_brought_to_review():
    sc = {'content': {'steps': ['Look at the equator. Above means the Northern Hemisphere.',
                                'If they are the same, compare the hundreds, then tens, then ones.']}}
    cues = packet.criteria_review_cues(sc)
    assert any('step 1: more than one sentence' in cue for cue in cues)
    assert not any('step 2' in cue for cue in cues)

def test_guidance_names_both_misses_so_clear_steps_are_not_lengthened():
    voice = (ROOT / 'references/teacher-voice.md').read_text(encoding='utf-8')
    assert 'A step that is already clear is finished' in voice
    assert 'A step that needs a second sentence is usually two steps' in voice
