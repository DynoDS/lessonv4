"""The draw-live cue is the design's decision, and the slide has to carry it.

The builder draws the flipchart whenever a slide's criteria carries
`flipchart: true`, and the working wall reproduces a flagged reference, but
nothing checked the step between: the slide designer reading `drawLive` and
setting the flag. Across 31 designs to 8 September 2026 the flag had never once
reached a deck.
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "check-drawlive-handoff.py"
SPEC = importlib.util.spec_from_file_location("drawlive_handoff", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def write(tmp_path, design, spec):
    design_path = tmp_path / "lesson-design.json"
    spec_path = tmp_path / "lesson.json"
    design_path.write_text(json.dumps(design), encoding="utf-8")
    spec_path.write_text(json.dumps(spec), encoding="utf-8")
    return design_path, spec_path


STEPS = {
    "id": "sc-001",
    "type": "steps",
    "drawLive": True,
    "content": {"steps": ["Find the thousands column.", "Read the new number."]},
}


def test_a_marked_criteria_whose_slide_sets_the_flag_passes(tmp_path, capsys):
    design = {"successCriteria": [STEPS]}
    spec = {"slides": [
        {"template": "maths-turn-sc", "successCriteriaRefs": ["sc-001"], "flipchart": True,
         "criteria": {"type": "steps", **STEPS["content"]}},
        {"template": "body-full"},
    ]}
    assert MODULE.run(*write(tmp_path, design, spec)) == 0
    assert "DRAWLIVE_HANDOFF_OK 1" in capsys.readouterr().out


def test_the_flag_is_found_on_an_sc_panel_object_too(tmp_path):
    design = {"successCriteria": [STEPS]}
    spec = {"slides": [{
        "template": "split-h-50-50",
        "successCriteriaRefs": ["sc-001"],
        "secondary": {"type": "sc-panel", "flipchart": True, "content": {"type": "steps", **STEPS["content"]}},
    }]}
    assert MODULE.run(*write(tmp_path, design, spec)) == 0


def test_a_lost_cue_names_the_slides_that_should_have_carried_it(tmp_path, capsys):
    design = {"successCriteria": [STEPS]}
    spec = {"slides": [
        {"template": "maths-turn-sc", "successCriteriaRefs": ["sc-001"]},
        {"template": "maths-your-turn-sc", "successCriteriaRefs": ["sc-001"]},
    ]}
    assert MODULE.run(*write(tmp_path, design, spec)) == 1
    err = capsys.readouterr().err
    assert "DRAWLIVE_HANDOFF_FAILED" in err
    assert "slides 1, 2" in err
    assert "sc-panel" in err


def test_a_marked_criteria_no_slide_shows_is_a_cue_with_nowhere_to_go(tmp_path, capsys):
    design = {"successCriteria": [STEPS]}
    spec = {"slides": [{"template": "body-full"}]}
    assert MODULE.run(*write(tmp_path, design, spec)) == 1
    assert "nowhere to appear" in capsys.readouterr().err


def test_an_unmarked_lesson_with_a_cue_on_a_slide_is_refused(tmp_path, capsys):
    design = {"successCriteria": [dict(STEPS, drawLive=False)]}
    spec = {"slides": [
        {"template": "maths-turn-sc", "successCriteriaRefs": ["sc-001"], "flipchart": True,
         "criteria": {"type": "steps", **STEPS["content"]}},
    ]}
    assert MODULE.run(*write(tmp_path, design, spec)) == 1
    assert "no criteria in the design is marked drawLive" in capsys.readouterr().err


def test_an_ordinary_lesson_with_no_draw_live_passes(tmp_path, capsys):
    design = {"successCriteria": [dict(STEPS, drawLive=False)]}
    spec = {"slides": [{"template": "maths-turn-sc", "successCriteriaRefs": ["sc-001"]}]}
    assert MODULE.run(*write(tmp_path, design, spec)) == 0
    assert "DRAWLIVE_HANDOFF_OK 0" in capsys.readouterr().out


def test_bad_input_is_its_own_exit_code(tmp_path):
    design_path = tmp_path / "lesson-design.json"
    design_path.write_text("{not json", encoding="utf-8")
    spec_path = tmp_path / "lesson.json"
    spec_path.write_text("{}", encoding="utf-8")
    with pytest.raises(MODULE.HandoffError):
        MODULE.run(design_path, spec_path)


def test_the_playbook_runs_this_check_at_the_slide_gate():
    playbook = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
    assert "check-drawlive-handoff.py" in playbook
    assert "DRAWLIVE_HANDOFF_OK" in playbook


def panel(source, *, flag=True, bind=True):
    value = {'type': 'sc-panel', 'flipchart': flag,
             'content': {'type': 'steps', **source['content']}}
    if bind:
        value['criteriaRef'] = source['id']
    return value


OTHER = {**STEPS, 'id': 'sc-002', 'drawLive': False,
         'content': {'steps': ['Check the answer.']}}


def test_unmarked_cue_is_rejected_even_when_another_criterion_is_marked(tmp_path):
    spec = {'slides': [{'template': 'split-h-50-50',
                       'successCriteriaRefs': ['sc-001', 'sc-002'],
                       'primary': panel(STEPS), 'secondary': panel(OTHER)}]}
    assert MODULE.run(*write(tmp_path, {'successCriteria': [STEPS, OTHER]}, spec)) == 1


def test_another_panels_cue_cannot_satisfy_a_missing_marked_cue(tmp_path):
    second = {**OTHER, 'drawLive': True}
    spec = {'slides': [{'template': 'split-h-50-50',
                       'successCriteriaRefs': ['sc-001', 'sc-002'],
                       'primary': panel(STEPS, flag=False), 'secondary': panel(second)}]}
    assert MODULE.run(*write(tmp_path, {'successCriteria': [STEPS, second]}, spec)) == 1


def test_correct_separate_bindings_on_the_same_slide_pass(tmp_path):
    second = {**OTHER, 'drawLive': True}
    spec = {'slides': [{'template': 'split-h-50-50',
                       'successCriteriaRefs': ['sc-001', 'sc-002'],
                       'primary': panel(STEPS), 'secondary': panel(second)}]}
    assert MODULE.run(*write(tmp_path, {'successCriteria': [STEPS, second]}, spec)) == 0


@pytest.mark.parametrize('wrong', ['sc-999', 'sc-002'])
def test_binding_is_not_enough_when_content_or_reference_is_wrong(tmp_path, wrong):
    bad = panel(STEPS)
    bad['criteriaRef'] = wrong
    spec = {'slides': [{'template': 'body-full', 'successCriteriaRefs': ['sc-001', 'sc-002'], 'body': bad}]}
    assert MODULE.run(*write(tmp_path, {'successCriteria': [STEPS, {**OTHER, 'drawLive': True}]}, spec)) == 1


@pytest.mark.parametrize('where', ['speakerNotes', 'steps', 'root'])
def test_non_rendered_flag_cannot_pass(tmp_path, where):
    slide = {'template': 'body-full', 'successCriteriaRefs': ['sc-001']}
    if where == 'speakerNotes':
        slide['speakerNotes'] = panel(STEPS)
    elif where == 'steps':
        slide['body'] = {'type': 'steps', 'flipchart': True, **STEPS['content']}
    else:
        slide.update({'flipchart': True, 'criteriaRef': 'sc-001',
                      'criteria': {'type': 'steps', **STEPS['content']}})
    assert MODULE.run(*write(tmp_path, {'successCriteria': [STEPS]}, {'slides': [slide]})) == 1


def test_empty_panel_and_reordered_method_are_not_the_source(tmp_path):
    for steps in [[], list(reversed(STEPS['content']['steps']))]:
        bad = panel(STEPS)
        bad['content'] = {'type': 'steps', 'steps': steps}
        spec = {'slides': [{'template': 'body-full', 'successCriteriaRefs': ['sc-001'], 'body': bad}]}
        assert MODULE.run(*write(tmp_path, {'successCriteria': [STEPS]}, spec)) == 1


def test_legacy_inference_allows_helpers_markup_and_sticky_line(tmp_path):
    old = panel(STEPS, bind=False)
    old['content']['steps'] = [
        {'text': '**Find the thousands column.**', 'helper': 'one-per-column'},
        '✨ One thousand is ten hundreds.', 'Read the new number.']
    spec = {'slides': [{'template': 'body-full', 'successCriteriaRefs': ['sc-001'], 'body': old}]}
    assert MODULE.run(*write(tmp_path, {'successCriteria': [STEPS]}, spec)) == 0


def test_identical_sources_need_an_explicit_binding(tmp_path):
    second = {**STEPS, 'id': 'sc-002', 'drawLive': False}
    old = panel(STEPS, bind=False)
    slide = {'template': 'body-full', 'successCriteriaRefs': ['sc-001', 'sc-002'], 'body': old}
    design = {'successCriteria': [STEPS, second]}
    assert MODULE.run(*write(tmp_path, design, {'slides': [slide]})) == 1
    old['criteriaRef'] = 'sc-001'
    assert MODULE.run(*write(tmp_path, design, {'slides': [slide]})) == 0


def test_table_and_labelled_reference_bind_to_their_displayed_content(tmp_path):
    table = {'id': 'sc-001', 'drawLive': True, 'type': 'reference-table',
             'content': {'columns': ['Question', 'Move'], 'rows': [['Hours to minutes?', 'Multiply by 60.']]}}
    labels = {'id': 'sc-002', 'drawLive': True, 'type': 'labelled-reference',
              'content': {'items': [{'label': 'Quarter turn', 'text': ''}, {'label': 'Half turn', 'text': ''}]}}
    slide = {'template': 'split-h-50-50', 'successCriteriaRefs': ['sc-001', 'sc-002'],
             'primary': {'type': 'sc-panel', 'criteriaRef': 'sc-001', 'flipchart': True,
                         'content': {'type': 'table', 'headers': table['content']['columns'], 'rows': table['content']['rows']}},
             'secondary': {'type': 'sc-panel', 'criteriaRef': 'sc-002', 'flipchart': True,
                           'content': {'type': 'row', 'items': [{'type': 'text', 'text': 'Quarter turn'}, {'type': 'text', 'text': 'Half turn'}]}}}
    assert MODULE.run(*write(tmp_path, {'successCriteria': [table, labels]}, {'slides': [slide]})) == 0
