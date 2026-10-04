"""The playbook release (10A), step 6: the template editor (change plan section
1, decision 2; section 2, settled item a).

Decision 2 (his "y", to "should it stop and ask before pushing?"): the editor
bumps the version, shows the teacher the rebuilt demo and stops; it commits and
pushes only on the teacher's yes, as the helper installer does. The version step
names a patch release and, on Codex, the refresh the teacher runs. The stale
names go: the package's old name, "the architect" (the slide designer's old
name), and the two engines where a helper now reaches four surfaces. The
rewritten paragraphs lose their em dashes; untouched paragraphs are not
re-punctuated. W29 (pinned by VOC-Q05) is not touched."""
from _patch import ET, replace_once

# Settled item a (W15): the plugin's name.
replace_once(ET, "Tune any lesson slide template or content helper directly in the `lesson-resources` plugin,",
             "Tune any lesson slide template or content helper directly in the `lesson-v4` plugin,")

# Settled item a (W18): "the architect" is the slide designer's old name.
replace_once(ET, "- **The architect's catalogue** — `references/templates.md`.",
             "- **The slide designer's catalogue** — `references/templates.md`.")

# Settled item a (W42).
replace_once(ET, "(the slot names the architect will fill — `left`/`right`,",
             "(the slot names the slide designer will fill — `left`/`right`,")

# Settled item a (W27): a helper reaches four surfaces, not two engines.
replace_once(ET, "it carries the two rendering engines (slides *and* worksheets), every place each engine reads a helper,",
             "it carries every surface a helper draws on (the slides, worksheets, working wall and stick-in pack), every place each engine reads a helper,")

# Settled item a (W28): each printed surface is its own engine.
replace_once(ET, """- **Worksheets are a separate engine.** A helper children also meet on a printed sheet has to be built into `worksheet-html/` as well, not just the slide builder — otherwise it works on the board and silently doesn't exist on paper.""",
             """- **Each printed surface is a separate engine.** A helper children also meet on a worksheet, the working wall or a stick-in piece has to be built into that surface's engine (`worksheet-html/`, `working-wall-html/`, `stick-in-sheets-html/`) as well, not just the slide builder, otherwise it works on the board and silently doesn't exist on paper.""")
replace_once(ET, "and whether children will meet it on the board, on a worksheet, or both.",
             "and whether children will meet it on the board, a worksheet, the wall or a stick-in piece.")

# Decision 2: three steps, in this order; the teacher sees the rebuilt demo
# before anything is committed or pushed.
replace_once(ET, """1. **Bump the plugin version.** Edit `[PLUGIN_SOURCE_ROOT]/.claude-plugin/plugin.json` and `[PLUGIN_SOURCE_ROOT]/.codex-plugin/plugin.json`, raising both `version` values to the same next minor version (e.g. `2.1.0` → `2.2.0`). The architect reads the plugin from a version-pinned cache, so without a bump a new template or a coordinate change stays invisible on the next lesson build until the cache expires. The bump busts the cache.
2. **Commit and push.** The checkout above the package is its own git repo and deploys to the marketplace from `main`. Commit the changed files and push, so the marketplace copy syncs.
3. **Tell the teacher in plain English** what changed and why it matters to them — what moved where, not raw coordinates. For a brand-new template, confirm it's registered and in the catalogue so the architect can use it.""",
             """1. **Bump the plugin version.** Edit `[PLUGIN_SOURCE_ROOT]/.claude-plugin/plugin.json` and `[PLUGIN_SOURCE_ROOT]/.codex-plugin/plugin.json`, raising both `version` values to the same next patch version (for example `4.2.288` to `4.2.289`). The slide designer reads the plugin from a version-pinned cache, so without a bump a new template or a coordinate change stays invisible on the next lesson build until the cache expires. The bump busts the cache. On Codex the teacher then refreshes the install (`codex plugin add lesson-v4@lessonv4`).
2. **Show the teacher, then stop.** Tell them in plain English what changed and why it matters to them: what moved where, not raw coordinates. For a brand-new template, say it is registered and in the catalogue so the slide designer can use it. Point them to the rebuilt demo (Phase 2 Step 5, or Phase 1 Step 3 for a new template that was not dragged) and ask them to open it and look. **Do not commit and do not push until the teacher says yes.** A push puts this layout in front of every lesson built from the marketplace copy.
3. **Commit and push on their yes.** The checkout above the package is its own git repo and deploys to the marketplace from `main`. Commit the changed files and push, so the marketplace copy syncs.""")
print("TEMPLATE_EDITOR_OK")
