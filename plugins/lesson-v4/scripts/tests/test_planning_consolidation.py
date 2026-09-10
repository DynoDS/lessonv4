"""Source-contract regressions for consolidation; not model-quality evaluations."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
DESIGNER = (ROOT / 'agents/lesson-designer.md').read_text(encoding='utf-8')
VOICE = (ROOT / 'references/teacher-voice.md').read_text(encoding='utf-8')
PLAN = DESIGNER.split('## Settle the Decisions, Then Write', 1)[1].split('### Complete the picture contract here', 1)[0]


class PlanningConsolidationTests(unittest.TestCase):
    def test_one_inventory_guides_planning_and_recording(self):
        self.assertIn('Before choosing or polishing activities', PLAN)
        self.assertIn('using the single decision inventory below', PLAN)
        self.assertEqual(PLAN.count('Decision inventory:'), 1)
        self.assertNotIn("settle the lesson's learning chain:\n\n-", PLAN)
        self.assertIn('not to write a second account of the same lesson', PLAN)

    def test_unique_decisions_from_both_old_inventories_survive(self):
        inventory = PLAN.split('Decision inventory:', 1)[1].split('Do not duplicate mechanical IDs', 1)[0]
        for obligation in (
            'could not at the start', 'fact, a method or an idea', 'instances and how their evidence differs',
            'approved objective', 'exact end performance', 'related content deliberately deferred',
            'prior knowledge', 'visible foundation rather than assumed mastery',
            'new learning (knowledge, decision or procedure)', 'supported practice to independence',
            'nearest alternative', 'exposed, resolved and retested',
            'actual object, text, diagram or working', 'concrete explanation, model or live action',
            'why that medium makes the idea clearer', 'pupil response it prepares',
            'child-facing lines that teach it', 'a good instance', 'steps',
            'independent assessment evidence', 'surface cue or copied answer path',
            'success-criteria form', 'fresh worksheet evidence', 'safety constraint',
            'later beat that depends on it', 'movability challenge', 'never forced linking',
            'anything deliberately omitted', 'flagsForTeacher',
        ):
            # Launch's detailed example/non-example requirement uses the current
            # contract phrase rather than a new prose paraphrase.
            if obligation == 'a good instance': obligation = 'example and non-example of the product'
            with self.subTest(obligation=obligation): self.assertIn(obligation, inventory)

    def test_quality_lock_and_scaffold_order_are_not_removed(self):
        for clause in (
            'before the scaffold request or JSON',
            'By the end, children will [performance] because',
            'would the check named after `evidenced by` catch a child',
            'If there is no genuine misconception',
            'Never leave the record and JSON in disagreement',
            'Do not regenerate the scaffold request',
        ): self.assertIn(clause, PLAN)
        self.assertIn('Do not duplicate mechanical IDs', PLAN)
        self.assertIn('Use the checks below together', DESIGNER)
        self.assertIn('Final pre-flight check', DESIGNER)

    def test_requirement_owner_preserves_commission_coverage_and_suggestion_boundary(self):
        owner = DESIGNER.split('## Your Role as Decision-Maker', 1)[1].split('\n---', 1)[0]
        for clause in (
            'Binding is marked by the teacher, never inferred from grammar',
            'must be honoured within safeguarding, factual accuracy and the approved curriculum objective',
            'The facts of the commission bind the same way',
            'authoritative on objective, coverage and sequence',
            'Flag a departure from its curriculum coverage, not a change of activity',
            'Declining a suggestion needs no flag',
        ): self.assertIn(clause, owner)
        self.assertEqual(DESIGNER.count('The facts of the commission bind the same way'), 1)
        self.assertIn('explain the conflict in `flagsForTeacher`', DESIGNER)

    def test_representation_contract_has_one_owner_not_two_summaries(self):
        section = DESIGNER.split('### Teaching Representations', 1)[1].split('### Sticky Knowledge', 1)[0]
        for field in ('`rep-###`', '`loadBearing`', '`requiredFeatures`', '`representationRefs`', '`modellingState`'):
            self.assertIn(field, section)
        self.assertIn('never the family root', section)
        self.assertIn('non-empty for load-bearing', section)
        self.assertIn('Use `[]` when no representation', section)
        self.assertNotIn('Define each family once in top-level registry', section)

    def test_voice_routing_keeps_the_fixed_question_trigger_without_maintenance_history(self):
        routing = VOICE.split('## How to read this file', 1)[1].split('\n---', 1)[0]
        self.assertIn('a question or an instruction a child acts on opens §6', routing)
        self.assertIn('read sections 1-3, 15 and 17', routing)
        self.assertIn('Read §4 once', routing)
        self.assertNotIn('§6 was missing from that list', routing)
        self.assertIn('# 16. Calibrated examples', VOICE)

if __name__ == '__main__': unittest.main()
