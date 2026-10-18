#!/usr/bin/env python3
"""Make one picture through Codex, for a host with no image generator of its own.

Claude Code cannot generate a picture. Codex can, and it does it on the
teacher's ChatGPT plan with no API key. This bridge runs one non-interactive
Codex session whose only job is to call its built-in image tool once, then
reports where Codex saved the file. It is a generation call and nothing more:
the picture scout still reserves the attempt before it, records the file with
`image-scout-attempts.py record-generated --host-file` after it, and judges the
picture itself. The bridge never stages, judges, or publishes.

Commands:

    check                       is a signed-in Codex here? (no picture is made)
    generate --prompt-file P --run-dir D [--base-image IMG]

`--base-image` turns the call into an edit of that picture (the second-call
edit in image-scout-generation.md). `--run-dir` is a folder the bridge may
write its own records into. Each call makes a fresh folder of its own inside
it, so calls made together never share one: on 17 October 2026 four calls given
one mistyped folder overwrote each other's record of which Codex session they
were, and all four reported the same picture as theirs.

Which Codex: the newest copy bundled with the Codex desktop app, then a
`codex` on PATH. The app's copy updates itself; a separately installed one
can fall behind the teacher's plan and be refused (15 October 2026: a
standalone 0.154 was refused the model the plan uses, the app's 0.162 worked).
Set LESSON_CODEX_EXE to name one outright.

Fast mode is always switched off for the call: the teacher's Codex usage is
paid for (11 October 2026), and fast mode spends it faster.

Every command prints one JSON object on stdout and exits 0 on success.
Standard library only.
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time

GENERATION_TIMEOUT_SECONDS = 600
CHECK_TIMEOUT_SECONDS = 30
IMAGE_SUFFIXES = (".png", ".jpg", ".jpeg", ".webp")

INSTRUCTION = """You are making one picture for a UK primary school lesson.

Use your built-in image generation tool exactly once. Do not search the web, do not run any command, do not write code, and do not use any other way of making a picture.
{edit_line}
The picture to make is described between the lines below. Follow it exactly.
-----
{prompt}
-----

When the tool has returned the picture, reply with the single word DONE. If the tool refused or failed, reply with FAILED and one short line saying why.
"""

EDIT_LINE = (
    "\nThe attached image is the picture to edit. Keep everything in it that the "
    "description does not ask you to change.\n"
)


def emit(value: dict, code: int = 0) -> int:
    print(json.dumps(value, ensure_ascii=False))
    return code


def codex_home() -> str:
    return os.environ.get("CODEX_HOME") or os.path.join(os.path.expanduser("~"), ".codex")


def candidate_executables() -> list[str]:
    named = os.environ.get("LESSON_CODEX_EXE", "").strip()
    if named:
        return [named]
    found = []
    local = os.environ.get("LOCALAPPDATA")
    if local:
        bundled = glob.glob(os.path.join(local, "OpenAI", "Codex", "bin", "*", "codex.exe"))
        bundled.sort(key=lambda p: os.path.getmtime(p), reverse=True)
        found.extend(bundled)
    on_path = shutil.which("codex")
    if on_path:
        found.append(on_path)
    return found


def signed_in(exe: str) -> bool:
    try:
        done = subprocess.run(
            [exe, "login", "status"], capture_output=True, text=True,
            timeout=CHECK_TIMEOUT_SECONDS, stdin=subprocess.DEVNULL,
        )
    except (OSError, subprocess.SubprocessError):
        return False
    text = (done.stdout or "") + (done.stderr or "")
    return done.returncode == 0 and "logged in" in text.lower()


def find_codex() -> str | None:
    for exe in candidate_executables():
        if os.path.isfile(exe) and signed_in(exe):
            return exe
    return None


def cmd_check(_args) -> int:
    exe = find_codex()
    if exe is None:
        return emit({"ok": False, "available": False,
                     "reason": "no signed-in Codex found (desktop app or codex on PATH)"}, 1)
    return emit({"ok": True, "available": True, "codex": exe})


def thread_id_from(events_path: str) -> str | None:
    try:
        with open(events_path, encoding="utf-8", errors="replace") as handle:
            for line in handle:
                line = line.strip()
                if not line.startswith("{"):
                    continue
                try:
                    event = json.loads(line)
                except ValueError:
                    continue
                if isinstance(event, dict) and isinstance(event.get("thread_id"), str):
                    return event["thread_id"]
    except OSError:
        return None
    return None


def new_images(folder: str, since: float) -> list[str]:
    found = []
    for root, _dirs, names in os.walk(folder):
        for name in names:
            if name.lower().endswith(IMAGE_SUFFIXES):
                full = os.path.join(root, name)
                try:
                    if os.path.getmtime(full) >= since - 2:
                        found.append(full)
                except OSError:
                    continue
    found.sort(key=os.path.getmtime)
    return found


def cmd_generate(args) -> int:
    prompt_path = os.path.abspath(args.prompt_file)
    if not os.path.isfile(prompt_path):
        return emit({"ok": False, "error": f"prompt file not found: {prompt_path}"}, 2)
    base = os.path.abspath(args.base_image) if args.base_image else None
    if base and not os.path.isfile(base):
        return emit({"ok": False, "error": f"base image not found: {base}"}, 2)
    with open(prompt_path, encoding="utf-8") as handle:
        prompt = handle.read().strip()
    exe = find_codex()
    if exe is None:
        return emit({"ok": False, "error": "no signed-in Codex found; nothing was generated"}, 3)

    parent = os.path.abspath(args.run_dir)
    os.makedirs(parent, exist_ok=True)
    run_dir = tempfile.mkdtemp(prefix="call-", dir=parent)
    events_path = os.path.join(run_dir, "codex-events.jsonl")
    last_path = os.path.join(run_dir, "codex-last-message.txt")
    message = INSTRUCTION.format(edit_line=EDIT_LINE if base else "", prompt=prompt)
    command = [
        exe,
        "-c", "features.fast_mode=false",
        "-c", 'service_tier="default"',
        "-c", 'model_reasoning_effort="low"',
        "exec",
        "--skip-git-repo-check",
        "--sandbox", "read-only",
        "--json",
        "-C", run_dir,
        "-o", last_path,
    ]
    if base:
        command += ["-i", base]
    command.append("-")
    started = time.time()
    try:
        with open(events_path, "w", encoding="utf-8") as events:
            done = subprocess.run(
                command, input=message, text=True, encoding="utf-8",
                stdout=events, stderr=subprocess.STDOUT,
                timeout=GENERATION_TIMEOUT_SECONDS,
            )
        code = done.returncode
    except subprocess.TimeoutExpired:
        code = "timeout"
    except OSError as error:
        return emit({"ok": False, "error": f"could not start Codex: {error}"}, 3)

    images_root = os.path.join(codex_home(), "generated_images")
    thread = thread_id_from(events_path)
    files: list[str] = []
    if thread and os.path.isdir(os.path.join(images_root, thread)):
        files = new_images(os.path.join(images_root, thread), started)
    seconds = round(time.time() - started)
    if len(files) != 1:
        # A call that returned nothing, or a session that made more than one
        # picture, is not something to guess at: report it and let the scout
        # look, as image-scout-generation.md says for any host.
        return emit({
            "ok": False, "codex_exit": code, "seconds": seconds, "thread_id": thread,
            "host_files": files, "events": events_path, "run_dir": run_dir,
            "error": ("no picture came back" if not files
                      else "more than one picture came back; open each and name yours with --host-file"),
        }, 4)
    return emit({"ok": True, "host_file": files[0], "seconds": seconds,
                 "thread_id": thread, "codex": exe, "run_dir": run_dir})


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("check").set_defaults(func=cmd_check)
    gen = sub.add_parser("generate")
    gen.add_argument("--prompt-file", required=True)
    gen.add_argument("--run-dir", required=True)
    gen.add_argument("--base-image")
    gen.set_defaults(func=cmd_generate)
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
