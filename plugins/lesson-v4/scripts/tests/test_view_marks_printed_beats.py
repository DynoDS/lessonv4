"""The review and voice-edit page says which beats also print for the children.

21 October 2026: "Trace south to the question mark." was read beside the
teacher's script ("Put your finger back on the Sahara...") by the design
reviewer and the voice editor, and both passed it. The same line went onto the
pairs' printed map, where nobody reads the script, and it named no place to
start from. Neither reader was told the line was printed.
"""
import importlib.util
import sys
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location("design_review_packet_printed", SCRIPTS / "design-review-packet.py")
packet = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = packet
spec.loader.exec_module(packet)


class PrintedBeats(unittest.TestCase):
    def test_a_printed_beat_is_named_and_a_board_beat_is_not(self):
        design = {"teachingSequence": [
            {"label": "Go south", "levels": {"printed": {"form": "figure", "per": "pair", "what": "The world map."}}},
            {"label": "Look first", "levels": None},
        ]}
        notes = packet.printed_pieces(design)
        self.assertEqual(set(notes), {"Go south"})
        self.assertIn("one between two", notes["Go south"])
        self.assertIn("The world map.", notes["Go south"])
        self.assertIn("without the teacher's words", notes["Go south"])
        # "Follow the green shading" went onto a black-ink sheet (21 October 2026).
        self.assertIn("black ink", notes["Go south"])

    def test_the_note_is_not_one_of_the_strings_the_editor_owns(self):
        # Packet commentary never starts with "> ", so the voice editor's lane,
        # which is the quoted strings, is unchanged by it.
        design = {"teachingSequence": [
            {"label": "Go south", "levels": {"printed": {"form": "figure", "per": "pair", "what": "The world map."}}},
        ]}
        self.assertFalse(packet.printed_pieces(design)["Go south"].startswith(">"))


if __name__ == "__main__":
    unittest.main()
