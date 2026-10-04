"""The playbook release (10A), step 7c: a fixed lesson reaches the drive (his
answer "yes" to the change plan's question 2, 24 September 2026).

His answer: the fixed files replace the old ones on his drive, except a file
that is no longer the one the run saved last time (it can tell, because it
keeps each file's fingerprint as built); for that one it asks him first.

So every save into a folder or sorted folders now keeps a record, in the
lesson's working folder, of each file it saved there and its fingerprint
(`build-results/saved-files.json`, written by `deliver_files.py --record`, which
`run-fixed-resource.py deliver` always passes). An edit's save adds
`--revision`: a file on the drive whose fingerprint is no longer the one this
lesson recorded (or that it never recorded) is held back, named on a
`HELD_BACK=` line, and the wrapper names it on a `DELIVERY_HELD_BACK:` line and
in its summary (`heldBack`); the edit-in-place guide tells the run to ask the
teacher before saving over it. Every other file is replaced. Without
`--revision` nothing changes: a save copies over whatever is there, as today.
The letterbox route keeps no record: each cloud post is a new lesson folder,
and the teacher's computer files it.

Nothing is written to the drive but the teaching resources: the record stays in
the working folder (his 13 September ruling, the drive gets teaching resources
only)."""
from _patch import DF, RFR, replace_once

# ---- deliver_files.py -----------------------------------------------------

replace_once(DF, '''def copy_into(destination: Path, files: list[Path]) -> None:
    # Three different things can stop a copy here and they used to arrive as''', '''def read_saved(record: Path | None) -> dict:
    """What this lesson saved last time, file by file: {target path: sha256}."""
    if record is None or not record.is_file():
        return {}
    try:
        data = json.loads(record.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    saved = data.get("saved") if isinstance(data, dict) else None
    return dict(saved) if isinstance(saved, dict) else {}


def write_saved(record: Path, saved: dict) -> None:
    record.parent.mkdir(parents=True, exist_ok=True)
    record.write_text(
        json.dumps({"schemaVersion": 1, "saved": saved}, indent=2, sort_keys=True) + "\\n",
        encoding="utf-8",
    )


def copy_into(destination: Path, files: list[Path], *, saved: dict | None = None,
              revision: bool = False, held: list | None = None) -> None:
    # A lesson fixed after it was saved is saved again, and each fixed file
    # replaces the one this lesson put there. A file on the drive that is no
    # longer the one it saved (someone edited it there, or the record never had
    # it) is held back rather than overwritten, so the teacher is asked first
    # (his answer, 24 September 2026). `saved` is the lesson's own record of
    # what it saved, updated here as each file is copied.
    #
    # Three different things can stop a copy here and they used to arrive as''')

replace_once(DF, '''            if target.exists() and target.resolve() == path.resolve():
                continue
            shutil.copy2(path, target)
    except PermissionError as exc:''', '''            if target.exists() and target.resolve() == path.resolve():
                continue
            if revision and target.exists():
                now = file_check(target)["sha256"]
                if now != file_check(path)["sha256"] and (saved or {}).get(str(target)) != now:
                    if held is not None:
                        held.append(path)
                    continue
            shutil.copy2(path, target)
            if saved is not None:
                saved[str(target)] = file_check(target)["sha256"]
    except PermissionError as exc:''')

replace_once(DF, '''    source: Path,
    requested: list[str],
    dry_run: bool,
) -> tuple[Path, list[Path], list[Path]]:
    """Sorted delivery: school year, term, week, subject and day folders."""''', '''    source: Path,
    requested: list[str],
    dry_run: bool,
    saved: dict | None = None,
    revision: bool = False,
    held: list | None = None,
) -> tuple[Path, list[Path], list[Path]]:
    """Sorted delivery: school year, term, week, subject and day folders."""''')

replace_once(DF, '''    if not dry_run:
        copy_into(destination, files)
    return destination, files, skipped


def copy_to_folder(
    *, folder: Path, source: Path, requested: list[str], dry_run: bool
) -> tuple[Path, list[Path], list[Path]]:''', '''    if not dry_run:
        copy_into(destination, files, saved=saved, revision=revision, held=held)
    return destination, files, skipped


def copy_to_folder(
    *, folder: Path, source: Path, requested: list[str], dry_run: bool,
    saved: dict | None = None, revision: bool = False, held: list | None = None,
) -> tuple[Path, list[Path], list[Path]]:''')

replace_once(DF, '''    if not dry_run:
        copy_into(folder, files)
    return folder, files, skipped''', '''    if not dry_run:
        copy_into(folder, files, saved=saved, revision=revision, held=held)
    return folder, files, skipped''')

replace_once(DF, '''    parser.add_argument("--dry-run", action="store_true")
    return parser''', '''    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--record", type=Path,
        help="the lesson's record of each file it saved and its fingerprint, kept in its working folder",
    )
    parser.add_argument(
        "--revision", action="store_true",
        help=(
            "this save replaces an earlier save of the same lesson: a file on the drive "
            "that is no longer the one the record says this lesson saved is held back, "
            "never overwritten"
        ),
    )
    return parser''')

replace_once(DF, '''    folder = args.folder or (Path(saved["folder"]) if saved["folder"] else None)
    term_file = args.term_file or (Path(saved["termDates"]) if saved["termDates"] else None)
    mode = args.mode or saved["mode"]
    try:''', '''    folder = args.folder or (Path(saved["folder"]) if saved["folder"] else None)
    term_file = args.term_file or (Path(saved["termDates"]) if saved["termDates"] else None)
    mode = args.mode or saved["mode"]
    # The lesson's own record of what it saved, read before and written after a
    # save into a folder; the letterbox route keeps none.
    record = read_saved(args.record)
    held: list[Path] = []
    try:''')

replace_once(DF, '''                source=args.source.resolve(),
                requested=args.files,
                dry_run=args.dry_run,
            )
        else:
            destination, files, skipped = copy_to_folder(
                folder=folder.resolve(), source=args.source.resolve(),
                requested=args.files, dry_run=args.dry_run,
            )
    except (OSError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(f"DESTINATION={destination}")
    for path in files:
        print(f"FILE={path.name}")''', '''                source=args.source.resolve(),
                requested=args.files,
                dry_run=args.dry_run,
                saved=record,
                revision=args.revision,
                held=held,
            )
        else:
            destination, files, skipped = copy_to_folder(
                folder=folder.resolve(), source=args.source.resolve(),
                requested=args.files, dry_run=args.dry_run,
                saved=record, revision=args.revision, held=held,
            )
        if args.record and not args.dry_run and mode != "letterbox":
            write_saved(args.record, record)
    except (OSError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(f"DESTINATION={destination}")
    for path in files:
        if path in held:
            print(
                f"HELD_BACK={path.name} (changed on the drive since this lesson saved it; "
                "ask the teacher before saving over it)"
            )
            continue
        print(f"FILE={path.name}")''')

# ---- run-fixed-resource.py ------------------------------------------------

replace_once(RFR, '''        if args.plan and args.plan_index:
            command.extend(["--plan", args.plan, "--plan-index", str(args.plan_index)])
        command.extend(["--source", str(output)])''', '''        if args.plan and args.plan_index:
            command.extend(["--plan", args.plan, "--plan-index", str(args.plan_index)])
        # The lesson's record of what it saved stays in its working folder, so an
        # edit saved later can tell a file it saved from one changed on the drive
        # since (his answer, 24 September 2026). An edit's save adds --revision.
        command.extend(["--record", str(working / "build-results" / "saved-files.json")])
        if args.revision:
            command.append("--revision")
        command.extend(["--source", str(output)])''')

replace_once(RFR, '''        summary["ok"] = True
        atomic_write_json(Path(args.summary_output), summary)
        print("FIXED_RESOURCE_OK deliver")
        return 0''', '''        summary["ok"] = True
        # A file an edit's save held back is one changed on the drive since the
        # lesson saved it: the teacher is asked before it is saved over.
        summary["heldBack"] = [
            line[len("HELD_BACK="):].split(" (")[0]
            for line in completed.stdout.splitlines()
            if line.startswith("HELD_BACK=")
        ]
        atomic_write_json(Path(args.summary_output), summary)
        for name in summary["heldBack"]:
            print(f"DELIVERY_HELD_BACK: {name}")
        print("FIXED_RESOURCE_OK deliver")
        return 0''')

replace_once(RFR, '''    root.add_argument("--letterbox", default="")''', '''    root.add_argument(
        "--revision",
        action="store_true",
        help=(
            "deliver only: this save replaces an earlier save of the same lesson "
            "after an edit; a file on the drive that is no longer the one the "
            "lesson saved is held back and named, never overwritten"
        ),
    )
    root.add_argument("--letterbox", default="")''')
print("SAVING_AGAIN_OK")
