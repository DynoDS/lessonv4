---
description: Install a helper a lesson run built but left waiting. Takes the pending-helper folder from a lesson's working directory, copies it into the package, wires it in, proves every picture it draws, and stops for the teacher before anything is published. Use when a run report says a helper is waiting, or the teacher says to install one.
---

# Install a Waiting Helper

A lesson run that needed a picture the engine could not draw builds the helper into its own working folder and leaves it there, unproven and uninstalled. This command is the other half: it takes that folder, puts the helper into the package, and does the looking that the lesson run could not do.

Nothing here is mechanical. The drop-in has never been rendered and never been guarded, so treat it as a draft by a colleague who could not run the tests: it may be wired short, laid out by eye, or simply wrong about the thing it draws. Your job is to find that out before a class does.

## What the teacher gives you

The pending-helper folder, or enough to find it: a lesson's working directory, or the run report line naming it. A run's helpers live at `[WORKING_DIR]/pending-helper/<name>/`, one folder each.

If more than one is waiting, ask which. Install one helper at a time: each one edits the same dispatcher, registries, catalogues and parity manifest, and two half-installed helpers in those files is much harder to unpick than two installs in a row.

## Resolve the roots

Use the literal absolute path substituted for `${CLAUDE_PLUGIN_ROOT}` as `PLUGIN_ROOT_CANDIDATE`.

First check this computer and find the Python to use, without elevated access:

```bash
node "[PLUGIN_ROOT_CANDIDATE]/scripts/check-setup.js"
```

Store the path it prints after `PYTHON=`. On `SETUP_NEEDS_FIX` run its `SETUP_FIX_COMMAND:` line exactly as printed (on Codex with escalated permissions and network access); on `SETUP_BLOCKED` re-run it once with permission to start a program; on `SETUP_NEEDS_PYTHON` ask the teacher before following `Installing Python` in `[PLUGIN_ROOT_CANDIDATE]/references/computer-setup.md`. `"[PYTHON]"` below means that path; in PowerShell call it as `& "[PYTHON]" ...`.

```bash
"[PYTHON]" "[PLUGIN_ROOT_CANDIDATE]/scripts/verify-plugin-root.py" "[PLUGIN_ROOT_CANDIDATE]"
```

Store the value after `PLUGIN_ROOT=`. If it fails, stop and report the verifier's error exactly.

You are writing to the package, so you also need a writable checkout:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/verify-plugin-root.py" --find-source "[PLUGIN_ROOT]"
```

Store the value after `PLUGIN_SOURCE_ROOT=`. On `PLUGIN_SOURCE_ROOT_UNAVAILABLE`, stop and tell the teacher plainly that this computer is not set up to change the plugin (developer mode is off), and that the helper is safe where it is. The person who develops the plugin turns developer mode on once with `"[PYTHON]" "[PLUGIN_ROOT]/scripts/lesson-settings.py" developer on "<their checkout's plugin folder>"`. Never write to an installed cache copy, and never search for a checkout yourself.

## Read the drop-in before you move anything

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/install-pending-helper.py" check \
  --pending "[the pending-helper folder]"
```

Require `PENDING_HELPER_OK`. It proves the manifest is complete, that every file it lists is really there, and that every destination lands inside the package. If it fails, the drop-in is broken rather than the install: report exactly what it named, and repair the drop-in rather than working around it.

Then read `README.md` and `install.json`, and read the helper's own code. You are about to put this drawing in front of every lesson the package builds, so know what it draws, which surfaces it claims, and what its `unproven` list says nobody has looked at.

Read `[PLUGIN_ROOT]/references/helper-authoring.md` in full. It is the authoritative guide, and its *Verify by looking* and *Finish every install* sections are written for this moment.

## Install

Preview first, then copy:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/install-pending-helper.py" install \
  --pending "[the pending-helper folder]" \
  --source-root "[PLUGIN_SOURCE_ROOT]" --dry-run

"[PYTHON]" "[PLUGIN_ROOT]/scripts/install-pending-helper.py" install \
  --pending "[the pending-helper folder]" \
  --source-root "[PLUGIN_SOURCE_ROOT]"
```

The script copies whole files and nothing else. It refuses an `add` that would overwrite an existing file and a `replace` that would create one, because either means the drop-in and the checkout disagree about what is already there, and copying anyway loses somebody's work without saying so. If it refuses, stop and work out which of the two is right before going on.

Then make every `WIRING_REQUIRED` edit it printed, by hand, in the file it names. These are the surgical edits a copy cannot do: the dispatcher line, the catalogue entry the designers read, the registry key, the `shared/visual-parity.js` row. Work `helper-authoring.md`'s per-renderer checklist for each surface the manifest declares rather than trusting the list is complete: a helper wired into the board and not the wall does not error, it just ships words where the picture should be, and nobody sees it until a teacher looks at a printed sheet.

## Prove it, then hand the decision back

Work *Finish every install*, in order:

1. `npm run check` in `builder/`, green. A red guard names the exact surface still missing a wire.
2. Render and **look** at every surface the manifest declares, using `scripts/render-pages.py`. Then look again with the longest labels a real lesson might send, a different number of items, and the parts a lesson leaves blank for a child. This is the first time anybody has seen these pictures.
3. Where the worksheet is a declared surface, `npm test` and `npm run check-render` in `worksheet-html/`.

A figure that clips, collides, floats small in its slot, or is wrong about the thing it depicts is not installed. Repair it here, or take it back out and tell the teacher what was wrong with it.

Then bump the same next version in `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`, and **stop**.

**Do not commit and do not push until the teacher says to.** A push here puts this drawing in front of every lesson anyone builds from this package. Show them, in plain English: what the helper draws, which surfaces it now reaches, what the guard said, what the rendered pictures looked like, and anything you judged rather than checked. Then let them answer.

## Report

Plain English, no file lists:

- what the helper draws, and whether the picture builds itself from a lesson's numbers or is one fixed picture;
- which surfaces it now works on, and any it deliberately does not;
- what the guard and the renders showed, including anything you had to repair;
- anything still unproven, named;
- that it is installed but not published, and that a push is theirs to authorise.
