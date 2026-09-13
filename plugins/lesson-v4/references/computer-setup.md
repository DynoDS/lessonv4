# Setting up a computer

Read the one section the start-up check or the teacher has just asked for. Each
section is something only the teacher can agree to, or only the teacher can do,
which is why `scripts/check-setup.js --fix` does not do it on its own.

The teacher reading your messages is not a developer. Say what is happening and
what it gets them in plain words, one step at a time, and do the typing yourself
wherever the host lets you. On Codex, every step here writes outside the lesson
folder or uses the network, so run its commands with escalated permissions and
network access.

## Choosing where lessons are saved

A run builds its resources in its own output folder. Once the teacher names a
folder, every later lesson's teaching resources (the deck, worksheets, answer
key, working wall and stick-in sheets) are copied there too; run reports and
walk-throughs stay behind. `lesson-settings.py` is
`"[PYTHON]" "[PLUGIN_ROOT]/scripts/lesson-settings.py"`.

1. Ask for the folder if they have not named it. A OneDrive or SharePoint
   folder synced to the computer works like any other. Save it with
   `lesson-settings.py save-folder "<full path>"`.
2. If they also want lessons sorted, explain the layout in one line with an
   example: `2026-2027 - Year 4 > Autumn 1 > Week 2 > Maths > Tuesday`, where
   daily subjects (maths, English, reading, writing) get a day folder and
   weekly subjects do not, and a lesson goes to the next free day. Sorting needs
   the school's term dates, so ask them to paste them or point to a file.
3. Write the dates as a table in a file in the plugin's own folder, one row per
   half-term, then save it with `lesson-settings.py sorting on "<that file>"`:

   ```text
   | Term | Starts | Ends |
   | --- | --- | --- |
   | Autumn 1 | Tuesday 1 September 2026 | Friday 23 October 2026 |
   | Autumn 2 | Monday 2 November 2026 | Friday 18 December 2026 |
   ```

   Holidays can be listed or left out. Check `TERMS_FOUND=` names all six
   half-terms; a missing one is a date that did not read.
4. Tell them what the next lesson will do, in one line.

A teacher who later wants a plain folder again: `lesson-settings.py sorting off`.

## Collecting cloud-built lessons at login

A lesson built in the cloud cannot reach the teacher's computer, so it waits in
a letterbox: a branch of a private GitHub repository the cloud run pushes to.
This sets the teacher's own computer to collect from it every time they log in,
and save each lesson the way their settings say. It is optional; without it the
files can still be downloaded from that branch on GitHub.

Before starting, check three things and fix any that are missing, in order:
a save folder is chosen (the section above), `git --version` works, and the
computer can reach the repository (`git ls-remote <repository>`; a private one
needs `Signing in to GitHub` below). Then run:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/letterbox_filer.py" install --repo <owner/name>
```

`LETTERBOX_AT_LOGIN=task` or `startup` means it is set; `none` means this
computer would not allow it, and the line says how to collect by hand. Then run
`letterbox_filer.py run` once so the teacher sees it work, and read back the
log lines it prints. `letterbox_filer.py status` shows the last few collections;
`uninstall` stops it.

## Working from a long-term plan

So a scheduled run can make "the next lesson" of a subject, each plan is copied
once into the letterbox, where every run can read it and count where it is up
to. Needs the login helper installed (the section above), because its clone of
the letterbox is where plans are written. `plan-tracker.py` is
`"[PYTHON]" "[PLUGIN_ROOT]/scripts/plan-tracker.py" --plans-dir "<LETTERBOX_CLONE from letterbox_filer.py status>"`.

**Adding a plan.** The document needs a table with a Lesson Objective column
whose lesson rows begin `LO:`. Ask the teacher which lesson they have already
taught up to, because the plan starts after it.

1. `plan-tracker.py open`
2. `plan-tracker.py import "<plan document>" --plan year<N>-<subject> --year <N> --subject <Subject> --start-after <last lesson taught>`
   Name plans like `year4-maths`. A daily subject builds up to 5 lessons ahead of
   what has been saved to the drive, a weekly one 2; `--buffer` changes it.
   Read the first and last lesson objectives back to the teacher to confirm the
   plan read correctly.
3. `plan-tracker.py publish --plan <plan>`

**When teaching drifts** ("we're actually on lesson 30"): `open`, then
`move --plan <plan> --to <the last lesson done>`, then `publish`. `status` shows
every plan, where it is and what comes next. When the teacher edits the
document without adding or removing lessons, `resync` refreshes the text.

A scheduled run asks for "the next lesson from the <plan> plan", and follows
`references/lesson-from-plan.md`.

## Scheduled lessons in ChatGPT Work or Codex

OpenAI has three places a scheduled lesson could run. Only two can build one,
because a lesson needs separate AI workers and only those two can start them
(each proved on 13 September 2026):

- **ChatGPT Work, Cloud.** Runs with the teacher's computer off. It can start
  workers at the plugin's own models, reach the internet, commit to GitHub
  through its own GitHub tools, and offer files for download. It has no
  environment settings and no git sign-in, so the plugin must be in a public
  repository it can clone, and the letterbox is posted with its GitHub tools
  (the run does this itself when the delivery prints `LETTERBOX_ROUTE=connector`).
- **The Codex app on the teacher's computer.** Runs only while the computer is
  on and the app open, and saves straight to the save folder. See below.
- **Codex cloud tasks** (the Codex website, or `codex cloud exec`) cannot build a
  lesson: they have no tool to start a worker, so the Lesson Designer never
  runs. They can reach the letterbox if configured, but there is nothing to post.

**A ChatGPT Work cloud lesson.** Test it once by hand before scheduling it. In
ChatGPT, open Work, switch the task from Local to Cloud, and send a message like
this, changing only the lesson line:

```text
Make one lesson with the Lesson v4 plugin, unattended.

1. Run `git clone https://github.com/<owner>/<plugin repository>.git` and use
   <that folder>/<plugin folder> as PLUGIN_ROOT_CANDIDATE.
2. Follow <plugin folder>/skills/make-lesson/SKILL.md exactly, as the make-lesson
   skill. Launch its named workers with your subagent tool, at the model and
   reasoning effort worker-launch.py prints for each role.
3. The letterbox is <owner>/<letterbox repository>: pass
   `--letterbox <owner>/<letterbox repository>` to resolve-filing.py and to the
   delivery, and post the lesson with your GitHub tools when the delivery says
   LETTERBOX_ROUTE=connector.
4. Nobody can answer questions. Make the sensible choice and record it.
   Do not change the plugin repository.
5. Offer every finished teaching resource for download too.

Lesson: <year, subject and objective>
```

Once a manual run has put a lesson on the teacher's drive, the same message can
be scheduled in Work.

**In the Codex app** a task runs on the teacher's own computer and saves straight
to the save folder like any lesson made there. Two things to tell the teacher:

- The computer must be on with the Codex app open when the task is due.
- A scheduled task runs with nobody to approve anything, using Codex's default
  permissions. Under the normal restricted permissions it cannot save outside
  its own folder, install anything or reach PowerPoint, so the lesson stays in
  Codex's folder unchecked by eye. Only with full access does it save to the
  drive and check slides; full access lets that task change files and use the
  network without asking, which is the teacher's decision to make.

## Setting up a cloud environment

For a teacher who builds lessons in Claude Code on the web or a routine. These
are settings on the website, so give the steps and let the teacher click:

1. Attach the repository the plugin lives in, and the letterbox repository.
2. Setup script: `bash <plugin folder>/scripts/cloud-setup.sh`, with the
   plugin folder as it sits inside that repository.
3. Environment variable `LESSON_RESOURCES_LETTERBOX=<owner>/<letterbox repository>`.
   The run finds the attached clone by that name and posts to the
   `claude/lesson-outbox` branch, a branch name cloud sessions may always push to.
4. Network access: full access is simplest. The picture finder takes
   photographs from museum and archive websites it cannot know in advance, so a
   custom list always loses some pictures. A custom list needs at least the
   package registries (npm and PyPI), `github.com`, `api.github.com`,
   `raw.githubusercontent.com`, `storage.googleapis.com` (the browser that
   prints worksheets), `api.unsplash.com`, `images.unsplash.com`,
   `commons.wikimedia.org`, `upload.wikimedia.org` and `api.openverse.org`.
5. On their own computer, `Collecting cloud-built lessons at login` above.

## Developer mode

For the person who develops the plugin, on their own computer, and nobody else.
It lets a run add to the plugin's build log and lets the developer commands
(installing a helper, editing templates, adding test questions, writing a
subject file) change the plugin. On any other computer a run that edits its own
plugin makes a private copy that the next update overwrites, so it stays off
unless they ask for it by name. Turn it on with
`lesson-settings.py developer on "<the plugin folder inside their git checkout>"`,
and off with `lesson-settings.py developer off`.

## Installing Python

Only after the teacher has said yes. Python is the program the plugin's checking
and filing scripts run in; without it no lesson can be built.

- **Windows:** `winget install --exact --id Python.Python.3.12 --scope user`.
  The user scope needs no administrator password and ticks the "add to PATH"
  option that people miss when installing by hand.
- **macOS:** `brew install python`, or the installer from python.org when
  Homebrew is not there.
- **Linux:** `sudo apt-get install -y python3 python3-pip`.

A new install is not visible to programs that were already open. When the check
still reports `SETUP_NEEDS_PYTHON` straight afterwards, tell the teacher to
restart Claude Code or Codex and ask again, rather than installing a second time.
Then run `node "[PLUGIN_ROOT]/scripts/check-setup.js" --fix`; it installs the
libraries into the plugin's own folder.

## Letting the AI look at slides (PowerPoint or LibreOffice)

The AI cannot open a PowerPoint file; it can only look at pictures of the
slides, and turning a deck into pictures needs PowerPoint or LibreOffice on the
computer. Without either, decks are still built but nobody checks them by eye.

PowerPoint comes with Microsoft 365, which most teachers have through school;
suggest signing in to that first. Otherwise LibreOffice is free:

- **Windows:** `winget install --exact --id TheDocumentFoundation.LibreOffice`
- **macOS:** `brew install --cask libreoffice`
- **Linux:** `sudo apt-get install -y libreoffice-impress libreoffice-writer`

It is a large download (a few minutes). Nothing else needs doing: the next
run's check finds it.

## Getting an Unsplash key

Unsplash is a library of free modern photographs. The plugin searches it
alongside free museum and archive collections when the teacher has a key. The
key is free, personal to the teacher, and takes about three minutes to get. The
AI cannot sign up on the teacher's behalf, so walk them through it:

1. Go to https://unsplash.com/developers and choose **Register as a developer**
   (or sign in).
2. Open **Your apps**, choose **New Application**, tick the guideline boxes and
   accept.
3. Give it any name, such as "Lesson resources", and a one-line description,
   such as "Finds photographs for my own classroom lessons".
4. On the application's page, scroll to **Keys** and copy the **Access Key**.
   Not the Secret Key.
5. Paste it into the chat.

Save it in a file called `.env.unsplash` in the teacher's home folder, as one
line `UNSPLASH_ACCESS_KEY=<the key>`, then read the file back to confirm it
saved. Never repeat the key in chat or put it in a lesson file. A new key allows
50 searches an hour, which is plenty for a lesson or two at a time.

## Signing in to GitHub (the drawings library)

The optional drawings come from a library on GitHub. While that library is
private, the computer has to be signed in to a GitHub account that can see it.
Signing in is interactive, so the teacher does the last step themselves:

1. If `gh --version` fails, install the GitHub app for the terminal first:
   `winget install --exact --id GitHub.cli` on Windows, `brew install gh` on
   macOS.
2. Ask the teacher to run `gh auth login` themselves. In Claude Code they type
   `! gh auth login` into the prompt; in Codex, in a terminal. They choose
   GitHub.com, HTTPS and "Login with a web browser", then follow the browser.

The next run's check sees the sign-in. When the library is made public this
section stops being needed, and the check stops raising it on its own.
