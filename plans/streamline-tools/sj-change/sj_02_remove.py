"""The subject-files release (topic 8, release 1), step 2: his decisions 1 and 3
(his 1 and 2), "forget about 'writing a new subject file' guidance. it should
just knowe the files it has, nothing around what could be added in future." and
"is this a new skill called make subject file skill or something? just remove it
completely."

- The make-subject-file skill and its writing guide are deleted (ledger rows
  SJ-B01 to B20, C01 to C54 and C56 go with them; none is read in a lesson).
- The developer-mode lines stop listing "writing a subject file" among the
  commands that change the plugin: the setup guide (SJ-C55, the playbook
  ledger's PB-V20) and the package read-me, which says the same.
- The reasoning prompts' "Until a subject-English file exists" hedge goes
  (SJ-A59, the routes ledger's RT-L20); the English guidance below it stays,
  now unconditionally live. The adaptation guidance's "Detailed English
  progression belongs in a future subject-English file." goes too: the same
  hedge, in no ledger, found by this release's own test.
- The two tests that name the skill stop naming it: the root contract's token
  count and the no-publishing test's docstring.

Nothing here touches a lesson's own reading: the skill ran only on his command
and the guide was read only by it."""
import shutil

from _patch import GUIDE, README, ROOT, RP, SETUP, SKILL_DIR, TESTS, assert_absent, replace_once

ADAPTIVE = "references/adaptive-adaptation.md"

skill = ROOT / SKILL_DIR
guide = ROOT / GUIDE
assert (skill / "SKILL.md").is_file() and sorted(p.name for p in skill.iterdir()) == ["SKILL.md"], sorted(p.name for p in skill.iterdir())
assert guide.is_file()
shutil.rmtree(skill)
guide.unlink()
assert not skill.exists() and not guide.exists()
print("removed the skill and its guide")

replace_once(
    SETUP,
    "It lets a run add to the plugin's build log and lets the developer commands\n"
    "(installing a helper, editing templates, writing a subject file) change the plugin.",
    "It lets a run add to the plugin's build log and lets the developer commands\n"
    "(installing a helper, editing templates) change the plugin.",
)
replace_once(
    README,
    "Workflows that edit plugin source (installing a helper, editing templates, writing a subject file, and the build review log)",
    "Workflows that edit plugin source (installing a helper, editing templates, and the build review log)",
)
replace_once(
    RP,
    "- English may compare effects, justify structural choices or reason from textual evidence. "
    "Until a subject-English file exists, keep the detailed reading, writing and grammar guidance below active.\n",
    "- English may compare effects, justify structural choices or reason from textual evidence.\n",
)

# The adaptation guidance's English note is the same hedge in other words (the
# read-back names "the 'until a subject-English file exists' hedges", more than
# one); the Tier 1 and working-level guidance before it stays.
replace_once(
    ADAPTIVE,
    "Otherwise choose an honest related working-level objective from the supplied text, curriculum, assessment or "
    "sequence context. Detailed English progression belongs in a future subject-English file.\n",
    "Otherwise choose an honest related working-level objective from the supplied text, curriculum, assessment or "
    "sequence context.\n",
)

replace_once(
    f"{TESTS}/test_plugin_root_contract.py",
    '    "skills/make-lesson/SKILL.md": 1,\n'
    '    "skills/make-subject-file/SKILL.md": 1,\n',
    '    "skills/make-lesson/SKILL.md": 1,\n',
)
replace_once(
    f"{TESTS}/test_run_never_publishes.py",
    "The deliberate commands - `/install-helper`, `/edit-templates`,\n"
    "`/make-subject-file` - are outside this rule on purpose.\n",
    "The deliberate commands - `/install-helper` and `/edit-templates` - are\n"
    "outside this rule on purpose.\n",
)

for rel, phrase in (
    (SETUP, "writing a subject file"),
    (README, "writing a subject file"),
    (RP, "Until a subject-English file exists"),
    (ADAPTIVE, "subject-English file"),
    (f"{TESTS}/test_plugin_root_contract.py", "make-subject-file"),
    (f"{TESTS}/test_run_never_publishes.py", "make-subject-file"),
):
    assert_absent(rel, phrase)
print("the lines that named the skill and the future files are gone")
