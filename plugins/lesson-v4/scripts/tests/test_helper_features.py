"""Configuration and use identity, beyond a helper name appearing somewhere."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('coverage_features', ROOT/'scripts/check-helper-coverage.py')
coverage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(coverage)


class FeatureTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.decision = dict(representationId='rep-1', configuration='labelled', requiredSurface='slides',
                             decision='covered', helperKey='place-value-chart', featureChecks=[
                                 dict(feature='counter values', path='/rows/*/counterLabels', equals=True)])
        self.ref = dict(ref='rep-1', configuration='labelled', interaction='view')
        self.node = dict(type='place-value-chart', rows=[dict(counterLabels=True, counters={'H': 4})])

    def save(self, name, value):
        p = self.root/name
        p.write_text(json.dumps(value), encoding='utf-8')
        return p

    def delivery(self, slides, decision=None):
        return coverage.run_delivery(self.save('verdict.json', {'decisions': [decision or self.decision]}),
                                     self.save('lesson.json', {'slides': slides}), 'slides')

    def slide(self, node=None, ref=None):
        return dict(representationRefs=[ref or self.ref], body=node or self.node)

    def test_required_labels_missing_cannot_pass(self):
        node=copy.deepcopy(self.node); del node['rows'][0]['counterLabels']
        self.assertEqual(self.delivery([self.slide(node)]), 1)

    def test_every_row_is_checked_not_only_first(self):
        node=copy.deepcopy(self.node); node['rows'].append(dict(counterLabels=False))
        self.assertEqual(self.delivery([self.slide(node)]), 1)

    def test_correct_configuration_passes(self):
        self.assertEqual(self.delivery([self.slide()]), 0)

    def test_same_helper_elsewhere_cannot_cover_this_use(self):
        self.assertEqual(self.delivery([self.slide(ref=dict(ref='rep-other', configuration='labelled'))]), 1)

    def test_a_missing_second_use_cannot_borrow_first(self):
        self.assertEqual(self.delivery([self.slide(), self.slide(dict(type='text', text='Missing chart'))]), 1)

    def test_second_use_with_wrong_feature_fails(self):
        node=copy.deepcopy(self.node); node['rows'][0]['counterLabels']=False
        self.assertEqual(self.delivery([self.slide(), self.slide(node)]), 1)

    def test_ambiguous_multiple_references_need_node_binding(self):
        slide=self.slide(); slide['representationRefs'].append(dict(ref='rep-2', configuration='blank'))
        self.assertEqual(self.delivery([slide]), 1)
        slide['body']['helperUse']=dict(representationId='rep-1', configuration='labelled')
        self.assertEqual(self.delivery([slide]), 0)

    def test_plain_counters_remain_valid_when_no_feature_requires_labels(self):
        decision=copy.deepcopy(self.decision); decision['featureChecks']=[]
        node=copy.deepcopy(self.node); del node['rows'][0]['counterLabels']
        self.assertEqual(self.delivery([self.slide(node)],decision), 0)

    def test_different_feature_and_boolean_type_are_checked(self):
        decision=copy.deepcopy(self.decision)
        decision['featureChecks']=[dict(feature='scale', path='/toScale', equals=True)]
        node=dict(type='place-value-chart', toScale=1)
        self.assertEqual(self.delivery([self.slide(node)],decision),1)
        node['toScale']=True
        self.assertEqual(self.delivery([self.slide(node)],decision),0)

    def test_verdict_cannot_omit_required_feature(self):
        design=dict(representations=[dict(id='rep-1',name='Place value',configurations=[dict(id='labelled',requiredFeatures=['counter values'],loadBearing=True)])],
                    teachingSequence=[dict(representationRefs=[self.ref])])
        decision=copy.deepcopy(self.decision);decision['featureChecks']=[]
        self.assertEqual(coverage.run_verdict(ROOT,self.save('design.json',design),self.save('verdict.json',dict(decisions=[decision]))),1)
        decision['featureChecks']=self.decision['featureChecks']
        self.assertEqual(coverage.run_verdict(ROOT,self.save('design.json',design),self.save('verdict.json',dict(decisions=[decision]))),0)

    def test_empty_wildcard_and_missing_member_fail_closed(self):
        self.assertEqual(coverage.pointer_values({'rows':[]},'/rows/*/counterLabels'),[])
        self.assertEqual(coverage.pointer_values({'rows':[{'counterLabels':True},{}]},'/rows/*/counterLabels'),[])

    def test_qualitative_review_is_explicit_and_not_a_configuration_assertion(self):
        import contextlib
        import io
        decision=copy.deepcopy(self.decision)
        decision['featureChecks']=[dict(feature='working space',visualReview='Inspect room below the reference for two written lines.')]
        output=io.StringIO()
        with contextlib.redirect_stdout(output):
            self.assertEqual(self.delivery([self.slide()],decision),0)
        self.assertIn('HELPER_VISUAL_REVIEW:',output.getvalue())
        self.assertFalse(coverage.valid_checks([dict(feature='x',path='/foo',equals=True,visualReview='trust me')]))


if __name__ == '__main__': unittest.main()
