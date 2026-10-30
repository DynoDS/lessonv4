"""Regressions for task evidence delivery and board-only timing, not pedagogy scores."""
import copy
import importlib.util
import sys
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
import taught_time

spec = importlib.util.spec_from_file_location('do_beats_contract', SCRIPTS/'do-beats-in-a-row.py')
view = importlib.util.module_from_spec(spec)
spec.loader.exec_module(view)


class VisibleTime(unittest.TestCase):
    def test_teacher_only_guidance_cannot_buy_or_cost_board_time(self):
        unit = {'kind':'do', 'minutes':4, 'content':{'task':'Compare the two routes.'},
                'answer':{'kind':'model','content':'The longer route avoids the steep slope.',
                          'delivery':'teacher-only','acceptanceCondition':'Use terrain and distance.'}}
        longer = copy.deepcopy(unit)
        longer['answer']['acceptanceCondition'] = 'important marking guidance ' * 200
        longer['answer']['content'] += ' spoken checking support' * 100
        self.assertEqual(taught_time.board_words(unit,{}),4)
        self.assertEqual(taught_time.honest_minutes({'teachingSequence':[unit]}),
                         taught_time.honest_minutes({'teachingSequence':[longer]}))

    def test_visible_answer_still_costs_time_but_its_marking_guidance_does_not(self):
        for delivery in ['answer-slide','visible-in-unit']:
            unit={'minutes':0,'content':{},'answer':{'delivery':delivery,'content':'word '*160,
                                                  'acceptanceCondition':'hidden '*500}}
            self.assertEqual(taught_time.board_words(unit,{}),160)
            self.assertEqual(taught_time.honest_minutes({'teachingSequence':[unit]})[0],10)

    def test_metadata_and_teacher_exemplar_are_not_pupil_reading(self):
        unit={'kind':'do','content':{'task':'Choose a route.', 'activity':'planning '*200,
                                    'format':'short answer','modelledExemplar':'hidden '*100,
                                    'teacherListensFor':['hidden '*100]},
              'answer':{'kind':'none','content':None,'delivery':'none'}}
        self.assertEqual(taught_time.board_words(unit,{}),3)
        self.assertEqual(taught_time.board_words({'content':{'activity':'Say hello.'}},{}),2)

    def test_structured_sort_counts_displayed_labels_not_ids(self):
        unit={'taskStructure':{'groups':[{'id':'g','label':'Safe route'}],
                              'items':[{'id':'i','label':'Gentle slope'}]},
              'answer':{'delivery':'answer-slide','structure':{'kind':'sort',
                         'placements':[{'itemRef':'i','groupRef':'g'}]}}}
        self.assertEqual(taught_time.board_words(unit,{}),4)
        unit['answer']['delivery']='teacher-only'
        self.assertEqual(taught_time.board_words(unit,{}),0)

    def test_structured_evidence_counts_values_not_metadata(self):
        unit={'answer':{'delivery':'answer-slide','acceptanceCondition':'hidden '*100,
                       'structure':{'kind':'evidence-classification','results':[{'itemRef':'i',
                        'values':[{'fieldRef':'f','value':'A steep slope'}]}]}}}
        self.assertEqual(taught_time.board_words(unit,{}),3)


class ResponseContract(unittest.TestCase):
    def test_other_routes_keep_their_actual_question_and_support(self):
        cases=[
            ('use-learning',{'activity':'Classify these new materials.'}),
            ('our-turn',{'example':'Round 351 to the nearest hundred.'}),
            ('talk',{'discussionQuestion':'Which choice keeps the promise?',
                     'materialOnSlide':'Option A; Option B','sentenceStems':['This keeps it because ___']}),
            ('do-task',{'activity':'Build a bridge for this gap.','launch':{'established':'Our gap is 20 cm.'}}),
        ]
        for kind,content in cases:
            text='\n'.join(view.response_contract_lines({}, {'kind':kind,'content':content}))
            for value in content.values():
                if isinstance(value,str):self.assertIn(value,text)
            if kind=='talk':self.assertIn('This keeps it because ___',text)

    def test_supplied_criteria_and_star_facts_remain_visible_to_the_check(self):
        design={'successCriteria':[{'id':'s','content':{'steps':['The target is already highlighted.']}}],
                'stickyKnowledge':[{'id':'k','text':'The answer is north.'}]}
        text='\n'.join(view.response_contract_lines(design,{'content':{},'successCriteriaRefs':['s'],
                                                          'stickyKnowledgeRefs':['k']}))
        self.assertIn('The target is already highlighted.',text)
        self.assertIn('The answer is north.',text)

    def test_readout_keeps_weak_acceptance_and_supplied_decision_visible(self):
        unit={'thinking':'Which route suits the walker?', 'content':{'task':'Compare both routes.'},
              'pupilInstruction':'Mark your choice.',
              'answer':{'content':'The gentle route is safer.','acceptanceCondition':'Any difference.',
                        'delivery':'teacher-only'},
              'representationRefs':[{'ref':'r','configuration':'task','interaction':'pupil-writes-on'}],
              'levels':{'printed':None,'boardOnlyBecause':'Draw a mark.'}}
        design={'representations':[{'id':'r','configurations':[
            {'id':'task','requiredFeatures':['Chosen route already highlighted.']},
            {'id':'model','requiredFeatures':['UNSELECTED MODEL STATE']}]}]}
        text='\n'.join(view.response_contract_lines(design,unit))
        for expected in ['Any difference.','Which route suits the walker?','Compare both routes.',
                         'Chosen route already highlighted.','pupil-writes-on','"printed": null']:
            self.assertIn(expected,text)
        self.assertNotIn('UNSELECTED MODEL STATE',text)
        self.assertNotIn('task is working',text)

    def test_readout_keeps_null_acceptance_for_legitimate_exact_recall(self):
        text='\n'.join(view.response_contract_lines({}, {'kind':'do','content':{'task':'Name the river.'},
                           'answer':{'content':'Thames','acceptanceCondition':None,'delivery':'teacher-only'}}))
        self.assertIn('Name the river.',text)
        self.assertIn('(none recorded)',text)
        self.assertIn('recall and modelling limits',text)


if __name__=='__main__':unittest.main()
