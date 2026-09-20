---
description: Crop every question out of a test-paper PDF into the reusable question bank, filed by subject, type, year group, and strand. Use when the teacher hands over a past paper and wants its questions saved as individual pictures for slides.
---

# Add Test Questions to the Bank

Turn a test-paper PDF into a set of individual question images, filed in the lesson-resources question bank so the lesson-designer can later drop a real exam question straight onto a starter slide.

## Resolve the Package and Source Roots

Before doing anything else, use the literal absolute path substituted by Claude Code for `${CLAUDE_PLUGIN_ROOT}` as `PLUGIN_ROOT_CANDIDATE`.

First check this computer and find the Python to use, without elevated access:

```bash
node "[PLUGIN_ROOT_CANDIDATE]/scripts/check-setup.js"
```

Store the path it prints after `PYTHON=`. On `SETUP_NEEDS_FIX` run its `SETUP_FIX_COMMAND:` line exactly as printed (on Codex with escalated permissions and network access); on `SETUP_BLOCKED` re-run it once with permission to start a program; on `SETUP_NEEDS_PYTHON` ask the teacher before following `Installing Python` in `[PLUGIN_ROOT_CANDIDATE]/references/computer-setup.md`. `"[PYTHON]"` below means that path; in PowerShell call it as `& "[PYTHON]" ...`.

```bash
"[PYTHON]" "[PLUGIN_ROOT_CANDIDATE]/scripts/verify-plugin-root.py" "[PLUGIN_ROOT_CANDIDATE]"
```

Store the value after `PLUGIN_ROOT=`. If verification fails, stop and report the verifier's error exactly.

This command writes to the plugin itself, so it runs only on the computer the plugin is developed on (developer mode). Find that computer's writable checkout:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/verify-plugin-root.py" --find-source "[PLUGIN_ROOT]"
```

Store the value after `PLUGIN_SOURCE_ROOT=`. On `PLUGIN_SOURCE_ROOT_UNAVAILABLE`, stop before reading the PDF and tell the teacher plainly that this computer is not set up to change the plugin: developer mode is off. The person who develops the plugin turns it on once with `"[PYTHON]" "[PLUGIN_ROOT]/scripts/lesson-settings.py" developer on "<their checkout's plugin folder>"`. Do not search for another checkout.

The bank lives in source control at `[PLUGIN_SOURCE_ROOT]/builder/assets/test-questions/`, organised as `<subject>/<type>/<year-group>/<strand>/`. It sits beside the other lesson assets so every lesson-resources agent can read it once the plugin has synced.

## Gather four things first

Take whatever the teacher already gave in their message, and ask for the rest in one short message.

1. **PDF path** - the paper to break apart.
2. **Subject** - `maths` for now. Other subjects will follow, so accept whatever the teacher names.
3. **Type** - `problem-solving` or `arithmetic`. Use `problem-solving` unless the paper is plainly bare calculations.
4. **Year group** - the teacher states this directly (e.g. "Year 4"), so take their word for it rather than reading it off the paper yourself. Store it as `year-4` (lowercase, hyphenated). Ask only when the teacher hasn't said.

When the teacher has already supplied all four, proceed without a confirmation question.

## Decide whether to split a long paper into chunks

A single extractor works through a paper page by page, checking every crop before it files it, so a long paper takes proportionally longer, sometimes the better part of an hour for a fifty-plus page one. Splitting a long paper into a few extractors that each take a slice of the pages and work at the same time gets the whole thing done in a fraction of that, with no loss of care, since each extractor still checks its own crops exactly the normal way.

For each PDF you were given:

1. Find its page count cheaply, without rendering anything: `"[PYTHON]" "[PLUGIN_ROOT]/scripts/question_crop.py" pages "<pdf-path>"`.
2. **25 pages or fewer** - spawn one extractor for the whole paper, as described in "Hand the job to the extractor" below. Most papers fall here, and splitting one this size would only add coordination for no real time saved.
3. **More than 25 pages** - split it:
   - Pick a chunk count: one extractor per roughly 18 pages, capped at 4 even for a very long paper, so it doesn't fragment into more parallel pieces than is worth coordinating.
   - Render the whole PDF once yourself into a folder of your choosing: `"[PYTHON]" "[PLUGIN_ROOT]/scripts/question_crop.py" render "<pdf-path>" <folder> --dpi 300`. This is the same mechanical step an extractor would otherwise do itself; doing it once up front lets every chunk share the same rendered pages instead of each re-rendering the whole paper from scratch.
   - Divide the pages into that many contiguous, roughly even slices.
   - Spawn one extractor per slice, all at once, in-process (so the teacher can watch them work), each given the rendered folder, its own page range, and the one page immediately after its range (except the final slice, which has none) so it can finish off a question that spans the boundary. Use this instruction, filling in the values:

   > PLUGIN_ROOT: `[PLUGIN_ROOT]`
> PLUGIN_SOURCE_ROOT: `[PLUGIN_SOURCE_ROOT]`
>
> Extract every question that starts on pages `<start>`–`<end>` of this paper, already rendered for you at `<rendered-folder>` — use that as your working folder rather than rendering it yourself. You may also look at page `<end+1>` to finish off a question that spans the boundary, but don't start any new question that first appears there, that page belongs to the extractor covering the next slice along. Subject `<subject>`, type `<type>`, year group `<year-group>`. Crop each question to its own PNG, drop the question number where that is safe, name each file by its content, and file it under the matching strand. Read each crop back before filing and re-crop any that are clipped. Report the full list back to me.

## Hand the job to the extractor

For a PDF that didn't need splitting above, spawn the `question-extractor` agent once, in-process (not background, so the teacher can watch it work). Pass it the PDF path, subject, type, and year group with this instruction, filling in the four values:

> PLUGIN_ROOT: `[PLUGIN_ROOT]`
> PLUGIN_SOURCE_ROOT: `[PLUGIN_SOURCE_ROOT]`
>
> Extract every question from `<pdf-path>` into the question bank. Subject `<subject>`, type `<type>`, year group `<year-group>`. Render the pages, crop each question to its own PNG, drop the question number where that is safe, name each file by its content, and file it under the matching strand. Read each crop back before filing and re-crop any that are clipped. Report the full list back to me.

## Commit the new questions

Each extractor files straight into `[PLUGIN_SOURCE_ROOT]/builder/assets/test-questions/`, the git source tree, the same place every other asset this plugin ships with lives (the children photos, the coin images). Nothing needs copying there afterwards.

Once every extractor in this run has finished filing (whether it was one paper or several at once), before reporting back to the teacher: from `[PLUGIN_SOURCE_ROOT]`, `git add` the new and changed files under `builder/assets/test-questions/`, commit with a message naming the paper (or papers) just extracted, and push.

## Report back

Relay the agent's report to the teacher in plain English, grouped by strand: how many questions were filed, where they went, and anything the agent flagged (a kept number, or a question it could not confidently place). If a paper was split into chunks, combine all of its extractors' reports into one summary for that paper first — the teacher gave you one file and should hear about one result, not the coordination behind it. Point them at the bank folder so they can browse the results.

If the agent reports a missing dependency or an unreadable PDF, tell the teacher plainly what is missing and stop rather than guessing.
