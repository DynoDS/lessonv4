# Delivering a lesson from a cloud run

Read this only when `filing.txt` says `DELIVERY=letterbox`, or the teacher's
request names a letterbox repository. A cloud box cannot reach the teacher's
computer, so the lesson's teaching resources are posted to a letterbox (a branch
of a GitHub repository) and the teacher's computer saves them at its next login
(`scripts/letterbox_filer.py`).

## Naming the letterbox

A cloud environment with settings (Claude Code on the web, a Codex environment)
names the letterbox in `LESSON_RESOURCES_LETTERBOX`. ChatGPT Work's cloud has no
environment settings, so its request names the repository instead: pass
`--letterbox <owner/name>` to `resolve-filing.py` and to
`run-fixed-resource.py deliver`, and rewrite `filing.txt` from the resolver run
that carried it.

## At the start of the run

Say in one line that the finished resources will be posted to the teacher's
letterbox and saved on their computer the next time they log in.

`LETTERBOX_ROUTE=git`: the letterbox was fetched with git and the delivery
posts it with nothing more from you.

`LETTERBOX_ROUTE=connector`: git cannot reach the letterbox from this box
(`LETTERBOX_NOTE` says why), which is normal where the host signs in to GitHub
through its own tools rather than git (ChatGPT Work). Check now, before design,
that this host has GitHub tools that can create a branch and commit files to
`LETTERBOX_REPO`. If it has none, tell the teacher, and plan to leave the
resources in `OUTPUT_DIR`.

## Delivering

Run the delivery as Phase 5 says, adding `--letterbox` when the request named
one. It prints `LETTERBOX_BRANCH=` and one of two results.

`STATUS=COPIED` (git route): the lesson is already in the letterbox. Tell the
teacher it is waiting on that branch, that their computer will save it when it
next collects, and that the files can be downloaded from that branch on GitHub
meanwhile.

`STATUS=STAGED` (connector route): the lesson is laid out under
`LETTERBOX_STAGED` but not posted. Post it with the host's GitHub tools:

1. Make sure `LETTERBOX_BRANCH` exists in `LETTERBOX_REPO`; create it from the
   repository's default branch when it does not.
2. Commit every file under `LETTERBOX_STAGED` to that branch in one commit,
   keeping each file's path relative to `LETTERBOX_STAGED` exactly (it begins
   with `LETTERBOX_FOLDER`). A PowerPoint or PDF is binary: send its bytes,
   never a text rendering of it, or the teacher's computer saves a broken file.
   A command's output is cut off at about a million characters, and a 1.2 MB
   deck is 1.6 million characters of base64, so read any file over 700 KB in
   base64 pieces of at most 900,000 characters from the start, join them, and
   check the joined length before creating the blob. Reading it whole first
   truncated silently and cost a wasted blob (14 September 2026). A cut-off
   read can also look complete: on 13 September the middle of the RE deck came
   back as the words "474280 bytes omitted", was decoded and posted, and the
   teacher got a PowerPoint that would not open. `lesson.json` records each
   file's `checks` (its bytes and SHA-256 as built): the decoded bytes you post
   must match them.
3. Read the branch back and confirm every file and `lesson.json` are there,
   each file the size its `checks` names, before telling the teacher the lesson
   is in their letterbox. The teacher's computer refuses a file that does not
   match, so a mismatch you miss leaves the lesson waiting, not saved.

If a step fails, say exactly which, and that the resources are in `OUTPUT_DIR`.

Either way, when the host can send files to the teacher directly, offer each
teaching resource for download too: it is the teacher's copy if the letterbox
is not collected.
