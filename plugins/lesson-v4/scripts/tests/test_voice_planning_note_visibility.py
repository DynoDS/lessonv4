"""Rendering directions are visible to the editor without becoming editable copy."""
import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / 'scripts' / 'check-voice-edit.py'


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


checker = load('planning_note_voice_checker', SCRIPT)
fixtures = load('planning_note_fixtures', ROOT / 'scripts/tests/test_lesson_design_contract.py')


class PlanningNoteVisibility(unittest.TestCase):
    def setUp(self):
        self.design, self.photos = fixtures.valid_content_contract()

    def snapshot(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp)
            for name, data in [('lesson-design.json', self.design),
                               ('photo-requirements.json', self.photos)]:
                (work / name).write_text(json.dumps(data), encoding='utf-8')
            result = subprocess.run([sys.executable, str(SCRIPT), 'snapshot',
                                     '--working-dir', str(work)], capture_output=True,
                                    text=True, encoding='utf-8')
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            return (work / 'voice-edit-view.md').read_text(encoding='utf-8')

    def test_hidden_caption_and_instruction_reach_read_only_context(self):
        self.design['slideDesignNotes'] = [
            'Print the caption "Photo: UNT Libraries Special Collections."',
            'The board MUST say: Use your existing resource sheet.',
        ]
        view = self.snapshot()
        self.assertIn('## Planning notes — read only, outside your editing lane', view)
        owned, appendix = view.split('## Planning notes — read only, outside your editing lane')
        for note in self.design['slideDesignNotes']:
            self.assertNotIn(note, owned)
            self.assertIn(note, appendix)
        self.assertIn('For the lesson designer', appendix)

    def test_different_subject_unquoted_and_multiline_directions_are_not_lost(self):
        self.design['slideDesignNotes'] = [
            'Science board: display Current flows around the complete circuit.\n'
            'This line has no quotation marks.',
            'Use the "split" template; keep the diagram on the left.',
        ]
        view = self.snapshot()
        for index, note in enumerate(self.design['slideDesignNotes']):
            self.assertIn(f'### slideDesignNotes[{index}]\n\n{note}', view)

    def test_reading_a_note_does_not_authorise_editing_it(self):
        self.design['slideDesignNotes'] = ['Print "Study the botanical specimen." beside the photo.']
        self.snapshot()
        after = copy.deepcopy(self.design)
        after['slideDesignNotes'][0] = 'Print "Look at the plant." beside the photo.'
        faults = checker.check(self.design, after)
        self.assertTrue(any('slideDesignNotes[0]' in f and "outside the editor's lane" in f
                            for f in faults), faults)

    def test_owned_wording_is_still_editable_and_notes_do_not_inflate_its_count(self):
        packet = checker.load_packet()
        before_lines, before_count = packet.build_class_view(self.design)
        self.design['slideDesignNotes'] = ['Keep the photograph at its full aspect ratio.']
        after_lines, after_count = packet.build_class_view(self.design)
        self.assertEqual((before_lines, before_count), (after_lines, after_count))
        after = copy.deepcopy(self.design)
        after['teachingSequence'][1]['content']['headline'] = 'A road lets people into the forest'
        self.assertEqual(checker.check(self.design, after), [])

    def test_no_notes_needs_no_appendix(self):
        self.design['slideDesignNotes'] = []
        self.assertNotIn('## Planning notes', self.snapshot())


if __name__ == '__main__':
    unittest.main()
