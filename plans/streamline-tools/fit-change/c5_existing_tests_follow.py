"""The existing tests that follow the fit release (4.2.289).

The lesson check now reads the builder's letter widths from
`shared/text/comic-glyph-width.js`, so the design-review packet's test, which
builds a minimal copy of the plugin to run the validator in, copies that file
too. Nothing it asserts changes.

    python -X utf8 plans/streamline-tools/fit-change/c5_existing_tests_follow.py
"""
from _patch import replace_once

PACKET_TEST = "scripts/tests/test_design_review_packet.py"

replace_once(PACKET_TEST, """    for source in (
        PREFERENCES,
        DO_BEATS,
        TEACHER_VOICE,
        ROUTE_CHECKS,
        SKILL_ROUTE,
        SCIENCE_REFERENCE,
    ):
        shutil.copy2(
            source,
            plugin_root / "references" / source.name,
        )

    return plugin_root
""", """    for source in (
        PREFERENCES,
        DO_BEATS,
        TEACHER_VOICE,
        ROUTE_CHECKS,
        SKILL_ROUTE,
        SCIENCE_REFERENCE,
    ):
        shutil.copy2(
            source,
            plugin_root / "references" / source.name,
        )

    # The validator measures a criteria list with the builder's letter widths.
    (plugin_root / "shared" / "text").mkdir(parents=True)
    shutil.copy2(
        ROOT / "shared" / "text" / "comic-glyph-width.js",
        plugin_root / "shared" / "text" / "comic-glyph-width.js",
    )

    return plugin_root
""")

print("c5: existing tests follow")
