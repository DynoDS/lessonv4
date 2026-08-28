from __future__ import annotations

import importlib.util
import tempfile
from pathlib import Path

from pptx import Presentation
from pptx.enum.text import MSO_AUTO_SIZE
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "builder" / "scripts" / "fit_text_postprocess.py"
SPEC = importlib.util.spec_from_file_location("fit_text_postprocess", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def add_box(slide, name, text, x, y, w, h, size=14, bold=True):
    shape = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    shape.name = name
    frame = shape.text_frame
    frame.clear()
    run = frame.paragraphs[0].add_run()
    run.text = text
    run.font.name = "Comic Sans MS"
    run.font.bold = bold
    run.font.size = Pt(size)
    frame.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE
    frame.margin_left = 0
    frame.margin_right = 0
    frame.margin_top = 0
    frame.margin_bottom = 0
    return shape


def run_sizes(shape):
    return [
        round(run.font.size.pt)
        for paragraph in shape.text_frame.paragraphs
        for run in paragraph.runs
        if run.font.size is not None
    ]


def test_group_uses_one_largest_safe_size_without_changing_boxes():
    with tempfile.TemporaryDirectory() as temp_dir:
        deck = Path(temp_dir) / "grouped.pptx"
        presentation = Presentation()
        slide = presentation.slides.add_slide(presentation.slide_layouts[6])
        group = "table-column-0-0-9000-5000"
        first = add_box(
            slide,
            f"GROWFIT__{group}__54__electrical-appliance",
            "Electrical appliance",
            0.5,
            0.5,
            3.0,
            1.3,
        )
        second = add_box(
            slide,
            f"GROWFIT__{group}__54__mains-electricity",
            "Mains electricity",
            0.5,
            2.0,
            3.0,
            1.3,
        )
        original_geometry = [
            (first.left, first.top, first.width, first.height),
            (second.left, second.top, second.width, second.height),
        ]
        presentation.save(deck)

        MODULE.process(str(deck), floor_pt=10)

        checked = Presentation(deck)
        shapes = [shape for shape in checked.slides[0].shapes if shape.has_text_frame]
        sizes = [run_sizes(shape)[0] for shape in shapes]
        assert len(set(sizes)) == 1
        assert sizes[0] > 14
        assert [
            (shape.left, shape.top, shape.width, shape.height)
            for shape in shapes
        ] == original_geometry

        one_point_larger_fails = []
        for shape in shapes:
            result = MODULE.measure_shape(shape, sizes[0] + 1, sizes[0] + 1)
            one_point_larger_fails.append(result["hit_floor"])
        assert any(one_point_larger_fails)


def test_unmarked_text_keeps_shrink_only_behaviour():
    with tempfile.TemporaryDirectory() as temp_dir:
        deck = Path(temp_dir) / "ordinary.pptx"
        presentation = Presentation()
        slide = presentation.slides.add_slide(presentation.slide_layouts[6])
        add_box(slide, "ordinary", "Short", 0.5, 0.5, 5.0, 2.0, size=14)
        presentation.save(deck)

        MODULE.process(str(deck), floor_pt=10)

        checked = Presentation(deck)
        shape = next(shape for shape in checked.slides[0].shapes if shape.has_text_frame)
        assert run_sizes(shape)[0] == 14


def test_appliance_detective_reaches_the_measured_shared_maxima():
    with tempfile.TemporaryDirectory() as temp_dir:
        deck = Path(temp_dir) / "appliance-detective.pptx"
        presentation = Presentation()
        slide = presentation.slides.add_slide(presentation.slide_layouts[6])
        instruction = add_box(
            slide,
            "GROWFIT__instruction__40__appliance-detective-instruction",
            "Use each photograph to name the object, decide whether it is an electrical appliance, and if it is, identify its power source. Add one piece of evidence for each decision.",
            0.897,
            0.75,
            5.32,
            1.188,
            size=12,
        )
        category_text = ["Electrical appliance", "Mains electricity", "Battery"]
        meaning_text = [
            "Made to use electricity to do its job",
            "Designed to connect to a socket",
            "Designed to use a battery as its power source",
        ]
        for index, text in enumerate(category_text):
            add_box(
                slide,
                f"GROWFIT__category-column__54__category-{index}",
                text,
                7.007,
                1.85 + index * 1.72,
                2.933,
                1.72,
                size=14,
            )
        for index, text in enumerate(meaning_text):
            add_box(
                slide,
                f"GROWFIT__meaning-column__54__meaning-{index}",
                text,
                9.94,
                1.85 + index * 1.72,
                2.933,
                1.72,
                size=14,
                bold=False,
            )
        presentation.save(deck)

        MODULE.process(str(deck), floor_pt=10)

        checked = Presentation(deck)
        by_group = {"instruction": [], "category-column": [], "meaning-column": []}
        for shape in checked.slides[0].shapes:
            directive = MODULE.grow_fit_directive(shape.name)
            if directive is not None:
                by_group[directive[0]].append(run_sizes(shape)[0])

        assert by_group["instruction"] == [16]
        assert len(set(by_group["category-column"])) == 1
        assert by_group["category-column"][0] >= 40
        assert len(set(by_group["meaning-column"])) == 1
        assert by_group["meaning-column"][0] >= 28


if __name__ == "__main__":
    failed = 0
    for name, function in sorted(globals().items()):
        if name.startswith("test_") and callable(function):
            try:
                function()
                print("PASS", name)
            except AssertionError as error:
                failed += 1
                print("FAIL", name, str(error))
    raise SystemExit(1 if failed else 0)
