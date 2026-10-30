"""The first-read surface must not silently supply the teacher's answer."""
import copy
import importlib.util
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('surface_packet',ROOT/'scripts/design-review-packet.py')
packet=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=packet
spec.loader.exec_module(packet)

def design():
    return {'lesson':{'yearGroup':4},'teachingSequence':[
        {'sourceUnitId':'t1','label':'Two routes','kind':'teach',
         'content':{'headline':'Paths can cross different ground.','explanation':'A steep slope makes walking harder.'},
         'speakerNotes':{'script':'Say to children: PRIVATE SCRIPT'}},
        {'sourceUnitId':'d1','label':'Choose','kind':'do',
         'content':{'task':'Compare the two routes.','activity':'PRIVATE PLANNING','format':'PRIVATE FORMAT'},
         'pupilInstruction':'Point to your choice.', 'thinking':'PRIVATE INTENT',
         'answer':{'content':'PRIVATE KEY','acceptanceCondition':'PRIVATE ACCEPTANCE','delivery':'teacher-only'},
         'speakerNotes':{'script':'Say to children: PRIVATE SPOKEN DEMAND','teacherInfo':'PRIVATE LOGISTICS'},
         'representationRefs':[{'ref':'r','configuration':'question','interaction':'look-reference'}],
         'photoRefs':['photo-001'],
         'taskStructure':{'groups':[{'id':'g','label':'Gentle'}],'items':[{'id':'i','label':'Route A'}]},
         'successCriteriaRefs':['s'],'stickyKnowledgeRefs':['k']}],
         'successCriteria':[{'id':'s','type':'steps','content':{'steps':['Use the map.']}}],
         'stickyKnowledge':[{'id':'k','text':'A valley is low land between higher ground.'}],
         'representations':[{'id':'r','configurations':[
             {'id':'question','requiredFeatures':['Show both paths, without a chosen route.']},
             {'id':'answer','requiredFeatures':['PRIVATE UNUSED ANSWER STATE']}]}],
         'vocabulary':[{'id':'v','term':'valley','definition':'Low land between higher ground.'}],
         'vocabularyIntroductions':[{'after':'t1','vocabularyRefs':['v'],'script':'PRIVATE WORD SCRIPT'}]}

def test_first_view_hides_private_fields_but_keeps_actual_request_and_evidence():
    d=design();before=copy.deepcopy(d)
    photos={'photos':[{'id':'photo-001','subject':'Two real paths on a hillside',
                      'load_bearing_evidence':['Visible slope and both endpoints'],
                      'pedagogical_constraint':'PRIVATE RATIONALE'}]}
    out=packet.build_surface_view(d,photos)
    assert 'PRIVATE' not in out
    for text in ['Compare the two routes.','Point to your choice.','Gentle','Route A',
                 'A steep slope makes walking harder.','Use the map.',
                 'A valley is low land between higher ground.','valley: Low land',
                 'Show both paths, without a chosen route.','Visible slope and both endpoints']:
        assert text in out
    assert d==before

def test_later_feedback_is_not_an_answer_available_before_attempt():
    d=design();d['teachingSequence'][1]['answer']['delivery']='answer-slide'
    assert 'PRIVATE KEY' not in packet.build_surface_view(d,{})
    # The normal view still includes feedback; the new view does not delete it.
    assert 'PRIVATE KEY' in str(packet.class_view_blocks(d))

def test_visible_model_and_same_task_launch_survive():
    d=design();u=d['teachingSequence'][1]
    u['answer']={'delivery':'visible-in-unit','content':'VISIBLE PREPARED MODEL'}
    u['modellingState']='Prepared example'
    u['content']['launch']={'goodLooksLike':{'strong':{'words':'VISIBLE SAME TASK MODEL'},
        'weak':{'words':'VISIBLE WEAK MODEL'},'difference':'VISIBLE COMPARISON'}}
    out=packet.build_surface_view(d,{})
    for t in ['VISIBLE PREPARED MODEL','VISIBLE SAME TASK MODEL','VISIBLE WEAK MODEL','VISIBLE COMPARISON']:
        assert t in out

def test_other_routes_keep_their_pupil_work():
    d=design()
    for kind,content in [('explore',{'activity':'Test both materials.'}),
                         ('use-learning',{'activity':'Sort these new materials.'}),
                         ('do-task',{'activity':'Build a bridge across this gap.'}),
                         ('our-turn',{'example':'Round 351 to the nearest hundred.'}),
                         ('talk',{'discussionQuestion':'Which choice keeps the promise?',
                                  'sentenceStems':['It keeps the promise because...']})]:
        d['teachingSequence']=[{'sourceUnitId':'u','kind':kind,'label':kind,'content':content}]
        out=packet.build_surface_view(d,{})
        for value in content.values():
            for text in value if isinstance(value,list) else [value]:assert text in out

def test_worksheet_prompts_and_support_survive_without_answer_key():
    d=design();d['worksheet']={'status':'generated','contentBlocks':[
        {'kind':'question','pupilPrompt':'Choose a safe crossing.','support':'You may point to the map.',
         'answer':{'content':'PRIVATE WORKSHEET KEY'}}]}
    out=packet.build_surface_view(d,{})
    assert 'Choose a safe crossing.' in out
    assert 'You may point to the map.' in out
    assert 'PRIVATE WORKSHEET KEY' not in out

def test_simple_recall_does_not_require_an_acceptance_condition():
    d=design();d['teachingSequence']=[{'label':'Name it','kind':'do','content':{'task':'Name the river.'},
        'answer':{'delivery':'teacher-only','content':'PRIVATE RIVER NAME','acceptanceCondition':None}}]
    out=packet.build_surface_view(d,{})
    assert 'Name the river.' in out
    assert 'PRIVATE RIVER NAME' not in out

def test_a_displayed_teacher_claim_is_not_mistaken_for_speaker_notes():
    d=design();d['teachingSequence'][1]['content']['task']='Teacher says: All paths are safe. Is this right?'
    out=packet.build_surface_view(d,{})
    assert 'Teacher says: All paths are safe. Is this right?' in out
    assert 'PRIVATE SCRIPT' not in out
    assert 'PRIVATE WORD SCRIPT' not in out

def test_worksheet_only_geometry_and_card_images_are_resolved():
    d=design();d['teachingSequence'][1]['representationRefs']=[]
    d['teachingSequence'][1]['photoRefs']=[]
    d['teachingSequence'][1]['taskStructure']['items'][0]['photoRef']='photo-card'
    d['worksheet']={'status':'generated','contentBlocks':[
        {'kind':'question-group','groupPrompt':'Read the map.','parts':[
            {'pupilPrompt':'Trace the safer route.','representationRefs':[
                {'ref':'r','configuration':'question','interaction':'pupil-writes-on'}],
             'photoRefs':['photo-map']}]}]}
    photos={'photos':[{'id':'photo-card','subject':'Card photo of a steep path'},
                      {'id':'photo-map','subject':'Map with both paths visible'}]}
    out=packet.build_surface_view(d,photos)
    for text in ['Show both paths, without a chosen route.','Card photo of a steep path',
                 'Map with both paths visible','Trace the safer route.']:
        assert text in out
    assert 'PRIVATE UNUSED ANSWER STATE' not in out
