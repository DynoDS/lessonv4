"""Release 7A (4.2.293), step 12a: both plugin.json files to 4.2.293."""
from _patch import replace_once

for rel in (".claude-plugin/plugin.json", ".codex-plugin/plugin.json"):
    replace_once(rel, '"version": "4.2.292",', '"version": "4.2.293",')
print("both plugin.json files say 4.2.293")
