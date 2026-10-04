"""The playbook release (10A), step 2: the runtime program's cut points and
successor lines, and its test's bounds (change plan section 2, settled item a:
O01, A25, A28, X19; settled item e: the size test's comment).

The scaffold track (Track C) goes from the playbook in `c3_playbook.py`: no
scaffold agent was ever built and no design field can ask for one. Its heading
was a cut point, the end of `worksheet-render` and the start of
`other-resources`, so both move to the Track D heading here, in the program and
its test together, the same release (no other file names Track C). Run this and
`c3_playbook.py` together: the slices match the playbook only once both have
run."""
from _patch import RT, RTT, replace_once

TRACK_C = "### Track C — Scaffold (scaffold-designer → scaffold-builder, runs in parallel with Track A and Track B)"
TRACK_D = ("### Track D — Working Wall (working-wall-designer → fixed wall build, runs after slide-designer; "
           "in parallel with Tracks B and the rest of A)")

for rel in (RT, RTT):
    replace_once(rel, f'''    "worksheet-render": (
        "**Worksheet Designer** — launch whenever the role exists, reading",
        "{TRACK_C}",
    ),
    "other-resources": (
        "{TRACK_C}",
        "## Phase 3 — Service Each Branch as It Lands",
    ),''', f'''    "worksheet-render": (
        "**Worksheet Designer** — launch whenever the role exists, reading",
        "{TRACK_D}",
    ),
    "other-resources": (
        "{TRACK_D}",
        "## Phase 3 — Service Each Branch as It Lands",
    ),''')

# A25: there is no wall builder and no evidence result; the wall build writes a
# summary like the others.
replace_once(RT, '''        "Each of these builds settles on its own. Track D ends when the wall"
        " builder returns its evidence result; Track F ends when the stick-in"
        " build is accepted.",''', '''        "Each of these builds settles on its own. Track D ends when the wall"
        " build is accepted; Track F ends when the stick-in build is accepted.",''')

# A28: "sync" was the old name for saving the resources, and the save, not the
# teacher report, is the run's last message.
replace_once(RT, '''        "Load `delivery` for final assembly, the teacher report and sync.",''',
             '''        "Load `delivery` for final assembly, the teacher report and saving the"
        " resources.",''')
replace_once(RT, '''        "This is the last slice. The run ends with the teacher report.",''',
             '''        "This is the last slice. The run ends with the teacher report and"
        " where the lesson was saved.",''')

# X19: the 70,000-byte slice test says nothing the 7 KiB slice test does not.
replace_once(RTT, '''    def test_every_runtime_slice_stays_bounded(self) -> None:
        for name in BOUNDS:
            with self.subTest(slice=name):
                completed = self.run_slice(name)
                self.assertLess(
                    len(completed.stdout),
                    70000,
                )

''', "")

# Settled item e: the comment is maintainer text in a test and stays; it gains
# one sentence saying the file was consolidated here rather than raised.
replace_once(RTT, '''        # instead, and the per-slice budget below is the one that still says no.
        self.assertLess(self.measured_bytes(PLAYBOOK.read_bytes()), 77 * 1024)''',
             '''        # instead, and the per-slice budget below is the one that still says no.
        # Consolidated on 26 September 2026 rather than raised: the playbook
        # release (topic 10 of the streamline) took out what no run read, the
        # stories already in the build log and the stale lines, and wrote the
        # teacher's decisions into the room that made.
        self.assertLess(self.measured_bytes(PLAYBOOK.read_bytes()), 77 * 1024)''')
print("RUNTIME_OK")
