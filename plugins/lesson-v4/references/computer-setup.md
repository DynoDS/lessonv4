# Setting up a computer

Read the one section the start-up check or the teacher has just asked for. Each
section is something only the teacher can agree to, or only the teacher can do,
which is why `scripts/check-setup.js --fix` does not do it on its own.

The teacher reading your messages is not a developer. Say what is happening and
what it gets them in plain words, one step at a time, and do the typing yourself
wherever the host lets you. On Codex, every step here writes outside the lesson
folder or uses the network, so run its commands with escalated permissions and
network access.

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
