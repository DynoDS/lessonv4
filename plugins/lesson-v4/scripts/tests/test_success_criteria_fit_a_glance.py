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

def test_a_question_step_is_asked_about_not_faulted():
    # The teacher, 23 September 2026: "Same? Move right" is a fine step,
    # "short and snappy and it makes sense".
    design, photos = contract.valid_contract()
    sc = design['successCriteria'][0]
    sc['content']['steps'] = ['Compare the thousands digits first.', 'Same? Move one place right.',
                             {'text': 'Different? Choose < or >.'}]
    cues = packet.criteria_review_cues(sc)
    assert any('step 2: a question step' in cue and 'If so it stands' in cue for cue in cues)
    assert any('step 3: a question step' in cue for cue in cues)
    assert not any('If... sentence' in cue for cue in cues)
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
    # The equator example explains a word, so the cue asks about explanation.
    assert any('step 1: more than one sentence' in cue and 'explain it (then it goes)' in cue for cue in cues)
    assert any('is it a second step' in cue for cue in cues)
    assert not any('step 2' in cue for cue in cues)

def test_a_panel_that_fits_is_not_flagged_to_check_before_teaching():
    # The capacity numbers are a cue to look, not a fault (the teacher, 10 and
    # 23 September 2026), so they never join the slides listed as needing a
    # check before teaching. Read from the list itself, not its comment.
    import re
    build = (ROOT / 'builder/build.js').read_text(encoding='utf-8')
    listed = re.search(r'const FLAGGING_SIGNALS = new Set\(\[(.*?)\]\);', build, re.S)
    assert listed, 'the list of flagging signals has moved'
    entries = re.findall(r"^\s*'([A-Z_]+)',", listed.group(1), re.M)
    assert 'FIXED_CAPTION_CAPACITY' in entries
    assert 'SUCCESS_CRITERIA_CAPACITY' not in entries
    # Nor anywhere else in the build's code: put on the same line as another
    # entry, or added to the list after it is made, it would flag a fitting
    # panel just the same.
    code = re.sub(r'//[^\n]*', '', build)
    assert 'SUCCESS_CRITERIA_CAPACITY' not in code

def _block(text: str, start: str, end: str) -> str:
    at = text.index(start)
    return ' '.join(text[at:text.index(end, at)].split())

def test_the_sheet_list_refusal_is_held_whole():
    # Decision 8 is success criteria only; a method's steps a child works
    # through go with their question. A clause on any line of the message
    # would change that, so the whole message is held.
    text = (ROOT / 'worksheet-html/src/helpers/text.js').read_text(encoding='utf-8')
    assert _block(text, 'throw new Error(\n    `INSTRUCTION_IS_A_LIST', ');\n}') == ' '.join('''
        throw new Error(
        `INSTRUCTION_IS_A_LIST: this instruction carries ${lines.length} lines, ` +
        "so it is a list and will print as a paragraph of grey text. If they " +
        'are the lesson\\'s success criteria, leave them off: they stay on the ' +
        'board and are never printed on a worksheet. Otherwise, if they are steps a child ' +
        'works through to reach the answer, they are part of its question: put ' +
        'them with it, one to a line, or in maths use "method-frame". ' +
        'If they are questions, use "questions" or "written-answers", ' +
        "which number them and give the child somewhere to answer. An " +
        `instruction is one direction, in at most ${INSTRUCTION_MAX_LINES} lines.`
    '''.split())

def test_the_18_to_19pt_warning_asks_for_nothing_and_is_held_whole():
    # He chose to widen a panel only as far as 18pt needs (23 September
    # 2026), so the warning names no layout to move to and no words to cut.
    text = (ROOT / 'builder/src/content/steps.js').read_text(encoding='utf-8')
    assert _block(text, '`success criteria set at ${sharedFont}pt', ');') == ' '.join('''
        `success criteria set at ${sharedFont}pt: within the 18pt floor, below the ` +
        `${TEXT_FONT_TARGET}pt a panel reads best at from a table. The longest step is ` +
        `"${textOf(longest)}". Nothing need change: the words are the lesson ` +
        `designer's and stay as they are, and a list that does not fit is refused ` +
        `with a roomier shape named.`
    '''.split())

def test_guidance_names_both_misses_so_clear_steps_are_not_lengthened():
    voice = (ROOT / 'references/teacher-voice.md').read_text(encoding='utf-8')
    assert 'A step that is already clear is finished' in voice
    # Decision 9 (23 September 2026): a second sentence is not a fault in
    # itself, but one that is a second step or only names the result still is.
    assert 'A second sentence is not a fault in itself' in voice
    assert 'a step that needs one is usually two steps' in voice

def test_a_step_leaning_on_the_lessons_own_vocabulary_is_brought_to_review():
    # 14 September 2026: full sentences, no fragments, and still unreadable,
    # because `landmark` had a vocabulary slide and named marks the child sees.
    sc = {'content': {'steps': ['Read both end values.',
                                'Decide which two landmarks the number lies between.']}}
    cues = packet.criteria_review_cues(sc, ['landmark', 'midpoint'])
    assert any('step 2: uses `landmark`' in cue for cue in cues)
    assert not any('step 1' in cue for cue in cues)
    assert packet.criteria_review_cues(sc) == []

def test_review_view_passes_the_lessons_vocabulary_to_the_criteria_cues():
    design, photos = contract.valid_contract()
    term = design['vocabulary'][0]['term']
    design['successCriteria'][0]['content']['steps'] = [f'Find the {term} on the page.']
    view = packet.build_review_view(design, photos)
    assert f'uses `{term}` from this lesson' in view

def test_guidance_says_a_lesson_label_for_something_visible_is_not_owned_vocabulary():
    voice = (ROOT / 'references/teacher-voice.md').read_text(encoding='utf-8')
    assert 'A word the lesson brings in to name something the child can already see is not vocabulary the class owns' in voice
    assert 'says what the decision changes on the page' in voice
    designer = (ROOT / 'agents/lesson-designer.md').read_text(encoding='utf-8')
    assert 'a child who has only the page and not your plan' in designer
