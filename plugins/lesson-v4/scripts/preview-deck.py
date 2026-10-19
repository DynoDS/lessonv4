#!/usr/bin/env python3
"""Check a candidate deck, draw its pages and, when asked, measure them, in one
command.

Three places ran the same commands one after another: the preview check, the
render-route probe, the page render and the overview sheets, with the room
measurement after them in the decorator's warm-up. Each step feeds the next
and there is no decision to make between them, but on Codex each tended to be
its own tool call. The decorator is the last worker before the final slide
build, so the whole lesson waited while it stepped through five or more
commands (16-17 October 2026: 5 to 11 calls, up to two minutes, across six
real runs), and the slide designer ran the same render after every check.

    the decorator's warm-up    --settled --copy-from ... --room-output ...
    the decorator's re-check   --settled --pass-record ... (its drawings are on
                               the page: their record is checked before drawing)
    the slide designer         (none of these: a refused check is its to repair)

This script runs exactly those steps, in that order, and skips none. The deck
is drawn as it stands on every run, and the warm-up measures it as it stands:
reusing the designer's pages was considered and refused, because on 7 October
2026 a Year 3 science deck had two slides repaired after the designer
measured and every drawing was then placed against space that had moved.

Each step's own output is printed unchanged, so every marker a reader looks
for (SLIDE_DESIGN_PREVIEW_DIR, SLIDE_DESIGN_CHECK_OK or SLIDE_DESIGN_CHECK_FAILED
with its diagnostics, RENDER_ROUTE_OK, RENDER_PAGES_OK or
VISUAL_ROUTE_UNVERIFIED, the overview manifest, SLIDE_ROOM_OK) still appears.
The last line is always DECK_PREVIEW_DONE or DECK_PREVIEW_STOPPED.

How it stops:
  - a failed check, a malformed or blocked probe, or a render refused for bad
    input stops it there, with that step's exit code;
  - no render route at all (VISUAL_ROUTE_UNVERIFIED) is not a failure: the
    steps after the render are skipped, it says so, and it exits 0;
  - a failed overview does not stop the measurement, which reads the pages and
    not the overview: a missing measurement would leave the pass working from
    space that may have moved.

Usage:
    python3 preview-deck.py \
      --candidate <WORKING_DIR>/lesson.json.tmp.<ATTEMPT_ID> \
      --photo-requirements <photo-requirements.json> \
      [--settled] [--flagged-slides <n,n>] \
      [--copy-from <WORKING_DIR>/lesson.json] \
      [--room-output <WORKING_DIR>/slide-room.json [--room-lesson <lesson.json>]] \
      [--pass-record <optional-picture-pass.json> [--room <slide-room.json>]
       [--library-root <EDUCATIONAL_SVG_ROOT>]]

--copy-from copies that file over the candidate before anything runs.
--pass-record runs check-optional-pictures.py on the candidate and the checked
preview deck straight after the check, and stops there when it fails.
--room-output measures the drawn pages, stamped from --room-lesson, which
defaults to the --copy-from file.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

PLUGIN_ROOT = Path(__file__).resolve().parent.parent
CHECK = PLUGIN_ROOT / "builder" / "scripts" / "check-slide-design.js"
RENDER = PLUGIN_ROOT / "scripts" / "render-pages.py"
OVERVIEW = PLUGIN_ROOT / "scripts" / "build-visual-consistency-overview.py"
MEASURE = PLUGIN_ROOT / "scripts" / "measure-slide-room.py"
PICTURES = PLUGIN_ROOT / "scripts" / "check-optional-pictures.py"


def say(line: str) -> None:
    print(line, flush=True)


def run(command: list[str]) -> tuple[int, list[str]]:
    """Run one step, echoing its standard output line by line as it arrives.

    Standard error goes straight through. Standard output is read here only
    because the check names the preview directory there."""
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=None,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    lines = []
    assert process.stdout is not None
    for line in process.stdout:
        sys.stdout.write(line)
        sys.stdout.flush()
        lines.append(line.rstrip("\r\n"))
    return process.wait(), lines


def marker(lines: list[str], name: str) -> str | None:
    prefix = name + ": "
    for line in lines:
        if line.startswith(prefix):
            return line[len(prefix):].strip()
    return None


def stopped(step: str, code: int) -> int:
    say(f"DECK_PREVIEW_STOPPED: {step} exited {code}; the steps after it did not run.")
    return code or 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--candidate", required=True)
    parser.add_argument("--photo-requirements", required=True)
    parser.add_argument("--settled", action="store_true")
    parser.add_argument("--flagged-slides")
    parser.add_argument("--copy-from")
    parser.add_argument("--room-output")
    parser.add_argument("--room-lesson")
    parser.add_argument("--pass-record")
    parser.add_argument("--room")
    parser.add_argument("--library-root")
    args = parser.parse_args(argv)
    if (args.room or args.library_root) and not args.pass_record:
        parser.error("--room and --library-root belong to the optional-picture "
                     "check, which runs only with --pass-record")
    room_lesson = args.room_lesson or args.copy_from
    if args.room_output and not room_lesson:
        parser.error("--room-output needs --room-lesson or --copy-from")

    # Said first, on its own, because some hosts hand a command back after
    # about ten seconds whether it has finished or not, and this one takes
    # twenty to forty.
    print(
        "DECK_PREVIEW_RUNNING: checking and drawing the deck. This takes up "
        "to a minute and has finished only when DECK_PREVIEW_DONE or "
        "DECK_PREVIEW_STOPPED is printed. If neither is here yet, it is still "
        "running: wait for it.",
        file=sys.stderr, flush=True)

    node = shutil.which("node")
    if not node:
        say("DECK_PREVIEW_STOPPED: node was not found, so the check could not run.")
        return 1
    python = sys.executable
    candidate = Path(args.candidate)
    if args.copy_from:
        try:
            shutil.copyfile(args.copy_from, candidate)
        except OSError as exc:
            say(f"DECK_PREVIEW_STOPPED: could not copy {args.copy_from} to {candidate}: {exc}")
            return 1

    check = [node, str(CHECK), "--preview"]
    if args.settled:
        check.append("--settled")
    check += ["--photo-requirements", args.photo_requirements]
    if args.flagged_slides:
        check += ["--flagged-slides", args.flagged_slides]
    check.append(str(candidate))
    code, lines = run(check)
    if code != 0:
        return stopped("the preview check", code)
    preview_dir = marker(lines, "SLIDE_DESIGN_PREVIEW_DIR")
    preview_pptx = marker(lines, "SLIDE_DESIGN_PREVIEW")
    if not preview_dir or not preview_pptx:
        say("DECK_PREVIEW_STOPPED: the check passed but named no preview deck.")
        return 1
    if args.pass_record:
        # The decorator's re-check judges its record before drawing anything,
        # as it always did: a refused record is repaired, not looked at, so
        # drawing first would spend a render on a deck about to change.
        pictures = [python, str(PICTURES), "--pass-record", args.pass_record,
                    "--lesson", str(candidate), "--pptx", preview_pptx]
        if args.room:
            pictures += ["--room", args.room]
        if args.library_root:
            pictures += ["--library-root", args.library_root]
        if args.flagged_slides:
            pictures += ["--flagged-slides", args.flagged_slides]
        code, _ = run(pictures)
        if code != 0:
            return stopped("the optional-picture check", code)
    checked = ("check and optional-picture check passed" if args.pass_record
               else "check passed")
    preview = Path(preview_dir)
    route = preview / "render-route.json"
    manifest = preview / "render-manifest.json"

    code, _ = run([python, str(RENDER), "--probe-route", str(route)])
    if code != 0:
        return stopped("the render-route probe", code)

    code, _ = run([python, str(RENDER), preview_pptx, str(preview / "render"),
                   "--route-file", str(route), "--manifest", str(manifest)])
    if code == 2:
        unmeasured = " and the room was not measured" if args.room_output else ""
        say(f"DECK_PREVIEW_DONE: {checked}; no pages could be drawn "
            f"(VISUAL_ROUTE_UNVERIFIED), so there is no overview{unmeasured}.")
        return 0
    if code != 0:
        return stopped("the page render", code)

    code, _ = run([python, str(OVERVIEW), "build",
                   "--output-dir", str(preview / "overview"),
                   "--output-manifest", str(preview / "overview-manifest.json"),
                   "--manifest", f"Deck={manifest}"])
    done = [checked, "pages drawn",
            "overview built" if code == 0 else
            f"overview failed (exit {code}): open the page PNGs in {manifest} instead"]

    if args.room_output:
        code, _ = run([python, str(MEASURE), "--render-manifest", str(manifest),
                       "--lesson", str(room_lesson), "--output", args.room_output])
        done.append("room measured" if code == 0 else
                    f"room measurement failed (exit {code})")

    say(f"DECK_PREVIEW_DONE: {'; '.join(done)}.")
    return 0


if __name__ == "__main__":
    import utf8_output
    utf8_output.enable()
    sys.exit(main())
