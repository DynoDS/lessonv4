"""Timing still refuses overfull work; its repair advice uses the shared policy."""
import importlib.util
import sys
from pathlib import Path
import pytest

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module

validator = load('time_tradeoff_validator', 'validate-lesson-design.py')
view = load('time_tradeoff_view', 'do-beats-in-a-row.py')
packet = load('time_tradeoff_packet', 'design-review-packet.py')

def design(minutes, words=0):
    return {'teachingSequence': [{'kind': 'teach', 'label': 'Teaching',
             'minutes': minutes, 'content': {'explanation': 'word ' * words}}]}

def test_default_boundary_keeps_five_unplanned_minutes():
    validator.validate_lesson_fits_the_slot(design(45))
    with pytest.raises(validator.ContractError):
        validator.validate_lesson_fits_the_slot(design(46))

@pytest.mark.parametrize('lesson', [design(46), design(1,800)])
def test_both_refusal_paths_route_to_whole_lesson_judgement(lesson):
    with pytest.raises(validator.ContractError) as error:
        validator.validate_lesson_fits_the_slot(lesson)
    text = str(error.value)
    assert 'preferences.md, Classroom Norms, Time' in text
    assert 'teaching or pupil work' in text
    assert 'estimate the revised work honestly' in text

def test_generated_overfull_and_late_teaching_warnings_share_owner():
    units = [{'kind':'do','minutes':8}, {'kind':'do','minutes':8},
             {'kind':'teach','label':'New idea','minutes':5},
             {'kind':'practise','minutes':15}]
    output = view.room({}, [('unit', u) for u in units], 46)
    warnings = [line for line in output if 'REFUSE THIS' in line or 'LOOK AGAIN' in line]
    assert len(warnings) == 2
    assert all('preferences.md, Classroom Norms, Time' in line for line in warnings)
    assert 'tasks keep their size' not in '\n'.join(warnings)

def test_a_genuinely_short_sheet_remains_possible():
    output = view.room({'worksheet':{'status':'generated'}},
                       [('unit',{'kind':'practise','minutes':8})], 8)
    assert 'A short sheet is a real thing' in '\n'.join(output)
    assert 'REFUSE THIS' not in '\n'.join(output)

def test_reviewer_gets_time_owner_before_suspecting_a_problem():
    route = dict(packet.PREFERENCE_REVIEW_ROUTES)['Classroom Norms']
    assert 'Read Time on every review' in route
