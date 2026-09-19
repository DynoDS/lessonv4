#!/usr/bin/env python3
"""Hold the optional-picture pass to a per-slide answer, and hold it to evidence.

The optional visual layer (P2 context pictures, P3 decoration) kept arriving
empty. Guidance had already been rewritten twice - judge slide by slide, expect
several across a deck, a deck-level reason never zeroes the layer - and a deck of
seventeen slides still came back with none, explained afterwards as "I treated
the deck as sufficiently visual".

The reason guidance kept losing is that the pass had no output. A run that
considered every slide and a run that had one thought about the whole deck
produced the identical artefact: a lesson.json with no picture objects. Nothing
downstream could tell them apart, so the reviewer's mandate to verify the pass
was unverifiable and the designer's own report was an unfalsifiable claim.

So the pass now writes ``optional-picture-pass.json``: one line per slide. This
script checks it, and the checking is where the two excuses the teacher named
stop being available:

* **"I already have a P1 picture here."** There is no reason code for it. A
  photograph answers whether a *duplicating* P2 is wanted; it says nothing about
  whether the slide has spare room. Every allowed reason is a claim about this
  slide's own space or subject.
* **"I already used one on slide 4."** There is no reason code for that either,
  and there is no deck budget anywhere in the contract. Each slide answers alone.

And the honest reason is held to evidence. Claiming the library had nothing means
naming the searches run and at least one real drawing turned down; this script
re-runs those searches and checks those drawings exist. A rejection you never
looked at cannot be written, because its identifier comes out of the search.

That left two answers still costing nothing. `full` and `competes` were pure
assertion, so a pass under any pressure simply reached for them instead, and a
twelve-slide deck came back declining seven slides on nothing but its own word -
four of them slides with half the board free. Both are claims about the drawn
page, so both are now settled by the drawn page: ``measure-slide-room.py`` reads
the rendered preview and reports each slide's clear rectangles, and a slide
recorded `full` or `competes` with a drawing-sized clear rectangle on it fails
here, named. On a machine that cannot render there is no measurement and both
reasons stand on the designer's word, which is the one case where they should,
because nobody could look.

Nothing here demands a picture on any slide. A full slide stays bare and says so.
What it removes is the ability to answer for the whole deck at once, silently.
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

SCHEMA_VERSION = 1
OPTIONAL_KINDS = ("educational-svg", "emoji")

# Every reason is a claim about this slide. None of them is a claim about the
# deck, about another slide, or about a photograph already being present.
REASONS = {
    "full": "this slide's own content already fills it at readable size",
    "competes": "a picture here would cover, shrink or crowd what a child must read",
    "would-mislead": "a drawing here would bias, answer or pre-empt the task",
    "nothing-fits": "the library was searched for this slide and nothing suitable came back",
    "library-unavailable": "the drawing library is not on this machine",
}
# The reason that must be paid for with search evidence rather than asserted.
EVIDENCED_REASONS = {"nothing-fits"}

# `would-mislead` was the last answer that cost nothing, and it became half of
# every refusal: 70 of 138 across 20 built lessons, 59 of those 70 on slides the
# render had measured a clear inch-square space on. Not one of them recorded a
# word about what would be misled.
#
# It is also the hardest of the five to believe of what this pass actually
# places. The layer carries no teaching, removing any of it is always valid, and
# a faint pencil in a bottom corner cannot bias, answer or pre-empt anything. The
# reason was written for a picture that carries meaning, like a rainforest photo
# beside "which biome is this?", and that case is real - so the answer stays
# available and is made to say which task it would give away.
#
# Presence is all this can check: a sentence is not machine-verifiable the way a
# search is. It still ends the free answer, because a bogus claim has to be
# written down beside the task it is about, where Daniel reads it.
BIAS_EVIDENCE_MINIMUM = 40
# The two reasons that are claims about the drawn page, and are settled by it.
ROOM_CHECKED_REASONS = {"full", "competes"}

LIBRARY_ID_RE = re.compile(r"^(standard|cartoon|solid)/[^/]+/[^/]+\.svg$")


class PassError(ValueError):
    pass


def read_json(path: Path, label: str) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise PassError(f"{label} is unreadable JSON: {exc}") from exc


def string_list(value: object, label: str) -> list[str]:
    if not isinstance(value, list) or not value:
        raise PassError(f"{label} must be a non-empty array of strings")
    for index, item in enumerate(value):
        if not isinstance(item, str) or not item.strip():
            raise PassError(f"{label}[{index}] must be a non-empty string")
    return value


def deck_optional_pictures(lesson: object) -> dict[int, list[str]]:
    """What optional pictures each slide actually carries, by 1-based slide number.

    Counted from the deck rather than from the record, so the record cannot claim
    a picture the deck does not have.
    """
    slides = lesson.get("slides") if isinstance(lesson, dict) else None
    if not isinstance(slides, list):
        raise PassError("lesson.json.slides must be an array")

    found: dict[int, list[str]] = {}
    for index, slide in enumerate(slides, 1):
        kinds: list[str] = []
        seen: set[int] = set()

        def walk(node: object) -> None:
            if isinstance(node, list):
                for item in node:
                    walk(item)
                return
            if not isinstance(node, dict):
                return
            if id(node) in seen:
                return
            seen.add(id(node))
            kind = node.get("kind")
            if isinstance(kind, str) and kind in OPTIONAL_KINDS:
                kinds.append(kind)
            for value in node.values():
                walk(value)

        walk(slide)
        found[index] = kinds
    return found


SEARCH_SCRIPT = Path(__file__).resolve().parent / "search-educational-svg.js"
RESOLVER_SCRIPT = Path(__file__).resolve().parent / "publish-educational-svg.js"
INDEX_PATH = Path(__file__).resolve().parent.parent / "educational-svg" / "index.txt.gz"


def resolve_library_root() -> tuple[Path | None, str]:
    """Ask the resolver where this run's drawing library is.

    The check used to trust its caller for this: no ``--library-root`` meant
    "there is no library", every ``library-unavailable`` claim passed, and no
    search evidence was re-run. That made one missing argument silently
    downgrade the whole check - a run in which nobody ran the resolver at all
    reported the library off and the pass record as verified. The library's
    location is the resolver's question, so when the caller does not answer it,
    ask the resolver directly rather than assuming the worst answer.
    """
    if not RESOLVER_SCRIPT.is_file():
        return None, f"resolver script missing at {RESOLVER_SCRIPT}"
    try:
        completed = subprocess.run(
            ["node", str(RESOLVER_SCRIPT), "--resolve-root"],
            capture_output=True,
            text=True,
            timeout=120,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        return None, f"resolver could not run: {exc}"
    for line in completed.stdout.splitlines():
        if line.startswith("EDUCATIONAL_SVG_ROOT="):
            root = Path(line.split("=", 1)[1].strip())
            if root.is_dir():
                return root, f"resolved by {RESOLVER_SCRIPT.name}"
            return None, f"resolver named a root that does not exist: {root}"
        if line.startswith("EDUCATIONAL_SVG_UNAVAILABLE"):
            return None, line.strip()
    return None, "resolver printed neither a root nor an unavailable line"


def library_ids(library_root: Path) -> set[str]:
    """Every drawing this run could have looked at.

    The shipped index is the catalogue. The folder is only ever a union with it,
    because drawings now arrive one at a time: a cache holds what this run
    happened to fetch, so judging "is it in the library" by what is on disk
    would call a drawing the designer saw and rejected an hour ago a drawing
    that was never there.
    """
    ids: set[str] = set()

    if INDEX_PATH.is_file():
        try:
            with gzip.open(INDEX_PATH, "rt", encoding="utf-8") as handle:
                ids.update(line.strip() for line in handle if line.strip())
        except OSError:
            pass

    library = library_root / "library"
    if library.is_dir():
        for style in ("standard", "cartoon", "solid"):
            style_root = library / style
            if not style_root.is_dir():
                continue
            for prefix in style_root.iterdir():
                if not prefix.is_dir():
                    continue
                for entry in prefix.iterdir():
                    if entry.is_file() and entry.suffix.lower() == ".svg":
                        ids.add(f"{style}/{prefix.name}/{entry.name}")

    return ids


def run_search(library_root: Path, queries: list[str]) -> list[str]:
    """Ask the real library what those searches return. Empty list when it cannot run."""
    if not SEARCH_SCRIPT.is_file():
        return []
    # --no-fetch because checking evidence is a deterministic step: it reads the
    # index this package ships and must give the same answer with no network.
    argv = ["node", str(SEARCH_SCRIPT), "--no-fetch"]
    for query in queries:
        argv += ["--query", query]
    argv += ["--limit", "24"]
    try:
        completed = subprocess.run(argv, capture_output=True, text=True, timeout=120)
    except (OSError, subprocess.SubprocessError):
        return []
    for line in completed.stdout.splitlines():
        if not line.startswith("EDUCATIONAL_SVG_SEARCH:"):
            continue
        try:
            payload = json.loads(line.split(":", 1)[1].strip())
        except json.JSONDecodeError:
            return []
        candidates = payload.get("candidates")
        if not isinstance(candidates, list):
            return []
        return [
            candidate.get("libraryId")
            for candidate in candidates
            if isinstance(candidate, dict) and isinstance(candidate.get("libraryId"), str)
        ]
    return []


def check_places_left(
    entry: dict,
    label: str,
    taken: int,
    measurement: dict | None,
    failures: list[str],
) -> None:
    """A slide that took fewer drawings than it had places says why.

    Everything else here polices a slide that refused. A slide that accepted was
    never questioned at all, and that is where the layer was actually being
    emptied: across twenty built lessons the render measured 44 slides with three
    or more separate clear places, and 41 of them took exactly one drawing. Seven
    slides had all six places measured and took one each. The brief asks "how
    many of those clear places hold a relevant drawing? Not whether one does",
    and nothing anywhere compared the answer with the question.

    This does not demand a picture in every place. "The relevant subjects ran
    out" is the brief's own stopping rule and a complete answer. It demands only
    that stopping is a decision somebody wrote down, in the same way refusing is.
    """
    if not isinstance(measurement, dict):
        return
    places = measurement.get("readableAreas")
    if not isinstance(places, int) or places <= taken:
        return
    note = entry.get("placesLeft")
    if isinstance(note, str) and note.strip():
        return
    failures.append(
        f"{label} took {taken} drawing(s) where the render measured {places} "
        f"separate clear places. Say in `placesLeft` why the other "
        f"{places - taken} stayed empty. Running out of relevant subjects is a "
        "complete answer and the brief's own stopping rule; what is not an "
        "answer is stopping at one without noticing there were more places"
    )


def check_bias_claim(entry: dict, label: str, failures: list[str]) -> None:
    """A claim that a drawing would mislead names the task it would give away."""
    evidence = entry.get("evidence")
    if not isinstance(evidence, str) or len(evidence.strip()) < BIAS_EVIDENCE_MINIMUM:
        failures.append(
            f"{label} is would-mislead with no evidence. Name the task on this "
            "slide and what a drawing would give away, hint at or answer for a "
            "child, in a sentence. This layer carries no teaching and any of it "
            "can be removed, so a decoration that would bias a task is a real "
            "thing to find and a specific one to describe. Where nothing on the "
            "slide could be given away, the honest answer is nothing-fits, "
            "which names the searches it ran"
        )


def check_evidence(
    entry: dict,
    label: str,
    library_root: Path | None,
    failures: list[str],
) -> None:
    """A claim that the library had nothing is paid for, not asserted."""
    searched = entry.get("searched")
    try:
        queries = string_list(searched, f"{label}.searched")
    except PassError as exc:
        failures.append(
            f"{exc} - a nothing-fits verdict names the searches it ran, because "
            "that is what separates a library with nothing in it from a library "
            "nobody opened"
        )
        return

    if library_root is None:
        # Without a library there is no search to have run, so this verdict
        # cannot be paid for at all. Letting it through is how a deck with no
        # drawings in it passes as a deck the library was searched for and had
        # nothing to offer - the two states then read identically ever after,
        # which is exactly what makes a missing library impossible to notice.
        failures.append(
            f"{label} is nothing-fits, but no drawing library was available to "
            "this run, so no search could have happened. A slide the library "
            "could not be asked about is `library-unavailable`, not "
            "`nothing-fits`"
        )
        return

    known = library_ids(library_root)
    returned = run_search(library_root, queries)
    if not returned:
        # The library genuinely returned nothing for those terms. The verdict
        # stands on its own and there is nothing to have rejected.
        return

    rejected = entry.get("rejected")
    try:
        ids = string_list(rejected, f"{label}.rejected")
    except PassError:
        failures.append(
            f"{label} is nothing-fits, but those searches returned "
            f"{len(returned)} drawing(s). Name in `rejected` at least one you "
            "looked at and turned down, and say nothing-fits only about drawings "
            "you have actually seen"
        )
        return

    for library_id in ids:
        if not LIBRARY_ID_RE.match(library_id):
            failures.append(
                f"{label}.rejected contains {library_id!r}, which is not a library "
                "id. Copy the `libraryId` the search printed"
            )
            continue
        if library_id not in known:
            failures.append(
                f"{label}.rejected names {library_id!r}, which is not in the "
                "library. A drawing you did not see cannot be one you rejected"
            )


def read_room(path: Path) -> dict[int, dict]:
    """What the render says each slide's clear space actually is.

    Keyed by 1-based slide number, exactly as the pass record is, so a slide's
    claim and its measurement meet on the same number.
    """
    record = read_json(path, "slide-room.json")
    if not isinstance(record, dict):
        raise PassError("slide-room.json root must be an object")
    slides = record.get("slides")
    if not isinstance(slides, list):
        raise PassError("slide-room.json.slides must be an array")
    measured: dict[int, dict] = {}
    for entry in slides:
        if not isinstance(entry, dict):
            raise PassError("slide-room.json has a malformed slide entry")
        number = entry.get("slide")
        if not isinstance(number, int) or number < 1:
            raise PassError("slide-room.json entries need a 1-based `slide`")
        measured[number] = entry
    return measured


def room_refusal(number: int, reason: str, measurement: dict) -> str | None:
    """The measured page contradicting a claim that this slide had no room.

    Only ever refuses on a clear rectangle big enough to hold a real drawing, and
    the measurement counts a card, a photograph, a figure and a word all as
    occupied - so the space it finds is space nothing is using at all.
    """
    areas = measurement.get("readableAreas")
    if not isinstance(areas, int) or areas < 1:
        return None
    largest = measurement.get("largestClear")
    where = ""
    if isinstance(largest, dict):
        width = largest.get("widthInches")
        height = largest.get("heightInches")
        x = largest.get("xInches")
        y = largest.get("yInches")
        if all(isinstance(value, (int, float)) for value in (width, height, x, y)):
            where = (
                f' The largest is {width}" by {height}", at {x}" across and '
                f'{y}" down.'
            )
    plural = "area" if areas == 1 else "separate areas"
    if reason == "full":
        return (
            f"slide {number} is recorded as full, but the rendered page has "
            f"{areas} {plural} of clear space big enough for a drawing.{where} "
            "Fullness is what the content needs, not what its boxes span, and a "
            "framed picture moves nothing beneath it"
        )
    return (
        f"slide {number} is recorded as competes, but the rendered page has "
        f"{areas} {plural} of clear space big enough for a drawing.{where} "
        "Competing means covering, shrinking or crowding something a child "
        "reads; a drawing placed in space nothing is using covers nothing"
    )


SLIDE_W_INCHES = 13.333
SLIDE_H_INCHES = 7.5
# How much of a drawing has to fall in space nothing is using before it can be
# said to be on the slide at all. Below this it is a sliver escaping from behind
# a card, and a child cannot tell what it is.
VISIBLE_FRACTION = 0.5


def composition_fingerprint(lesson: object) -> str:
    """The deck's composition, drawings excluded: the same hash
    `measure-slide-room.py` stamps into its measurement."""
    def stripped(node):
        if isinstance(node, dict):
            return {k: stripped(v) for k, v in node.items() if k != "decorations"}
        if isinstance(node, list):
            return [stripped(item) for item in node]
        return node

    payload = json.dumps(stripped(lesson), sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def slide_decorations(lesson: object) -> dict[int, list[dict]]:
    slides = lesson.get("slides") if isinstance(lesson, dict) else None
    slides = slides if isinstance(slides, list) else []
    found: dict[int, list[dict]] = {}
    for index, slide in enumerate(slides, start=1):
        if not isinstance(slide, dict):
            continue
        entries = [d for d in (slide.get("decorations") or []) if isinstance(d, dict)]
        if entries:
            found[index] = entries
    return found


def visible_fraction(frame: dict, areas: list[dict]) -> float:
    """How much of a drawing's box falls in measured clear space.

    Sampled on a grid rather than solved as a rectangle union, because the
    measured areas overlap each other and the answer only has to be good to a
    few percent to tell a drawing from a sliver.
    """
    try:
        x0 = float(frame["x"]) * SLIDE_W_INCHES
        y0 = float(frame["y"]) * SLIDE_H_INCHES
        w = float(frame["width"]) * SLIDE_W_INCHES
        h = float(frame["height"]) * SLIDE_H_INCHES
    except (KeyError, TypeError, ValueError):
        return 1.0
    if w <= 0 or h <= 0:
        return 1.0
    boxes = []
    for area in areas:
        if not isinstance(area, dict):
            continue
        try:
            boxes.append((
                float(area["xInches"]), float(area["yInches"]),
                float(area["xInches"]) + float(area["widthInches"]),
                float(area["yInches"]) + float(area["heightInches"]),
            ))
        except (KeyError, TypeError, ValueError):
            continue
    if not boxes:
        return 0.0
    steps = 12
    inside = 0
    for i in range(steps):
        px = x0 + w * (i + 0.5) / steps
        for j in range(steps):
            py = y0 + h * (j + 0.5) / steps
            if any(bx0 <= px <= bx1 and by0 <= py <= by1 for bx0, by0, bx1, by1 in boxes):
                inside += 1
    return inside / (steps * steps)


def hidden_decorations(lesson: object, room: dict[int, dict]) -> list[str]:
    """Drawings the page will swallow.

    `layer: "low"` draws behind the slide's cards, which is the right look for a
    drawing straddling a card's edge and the wrong one for a drawing that ends up
    mostly underneath one. On a Year 4 history deck (18 September 2026) two low
    drawings sat under the banner card with a sliver showing, and the teacher
    read them off the board as "I don't even know what it is because it's
    behind". The decorator had looked at its own render and passed them, so the
    judgement is the thing that needs a measurement behind it.
    """
    failures: list[str] = []
    for number, decorations in slide_decorations(lesson).items():
        measurement = room.get(number)
        if not isinstance(measurement, dict):
            continue
        areas = measurement.get("areas")
        if not isinstance(areas, list) or not areas:
            continue
        for decoration in decorations:
            if decoration.get("layer") != "low":
                continue
            frame = decoration.get("frame")
            if not isinstance(frame, dict):
                continue
            seen = visible_fraction(frame, areas)
            if seen >= VISIBLE_FRACTION:
                continue
            name = decoration.get("concept") or decoration.get("id") or "a drawing"
            failures.append(
                f"slide {number}: the `{name}` drawing is layered `low` with only "
                f"{round(seen * 100)}% of it in space nothing is using, so the cards draw over the "
                "rest and what is left is a sliver a child cannot name. Move it into the clear "
                "space the page has, or set `layer` to `high` so it rests on the card instead of "
                "behind it"
            )
    return failures


def check(
    pass_path: Path,
    lesson_path: Path,
    library_root: Path | None,
    room: dict[int, dict] | None = None,
    room_record: dict | None = None,
) -> tuple[list[str], dict[int, list[str]], dict[str, int]]:
    record = read_json(pass_path, "optional-picture-pass.json")
    lesson = read_json(lesson_path, "lesson.json")

    if not isinstance(record, dict):
        raise PassError("optional-picture-pass.json root must be an object")
    if record.get("schemaVersion") != SCHEMA_VERSION:
        raise PassError(
            f"optional-picture-pass.json must use schemaVersion {SCHEMA_VERSION}"
        )
    entries = record.get("slides")
    if not isinstance(entries, list):
        raise PassError("optional-picture-pass.json.slides must be an array")

    actual = deck_optional_pictures(lesson)
    failures: list[str] = []
    if room:
        stamped = room_record.get("compositionSha256") if isinstance(room_record, dict) else None
        if isinstance(stamped, str) and stamped != composition_fingerprint(lesson):
            failures.append(
                "the deck has changed since its pages were measured, so every drawing was placed "
                "against space that has moved. Re-render and re-measure the deck, then place the "
                "drawings again: clear space is a fact about one arrangement, and a banner one line "
                "taller moves the band beneath it onto the drawing"
            )
        failures.extend(hidden_decorations(lesson, room))
    reason_counts: dict[str, int] = {}
    seen: dict[int, dict] = {}

    for index, entry in enumerate(entries):
        label = f"optional-picture-pass.json.slides[{index}]"
        if not isinstance(entry, dict):
            failures.append(f"{label} must be an object")
            continue
        number = entry.get("slide")
        if not isinstance(number, int) or number < 1:
            failures.append(f"{label}.slide must be the 1-based slide number")
            continue
        if number in seen:
            failures.append(f"slide {number} is recorded twice")
            continue
        seen[number] = entry

        if number not in actual:
            failures.append(
                f"slide {number} is recorded but the deck has only {len(actual)} slides"
            )
            continue

        decision = entry.get("decision")
        if decision not in ("used", "none"):
            failures.append(f"{label}.decision must be `used` or `none`")
            continue

        carried = actual[number]
        if decision == "used":
            if not carried:
                failures.append(
                    f"slide {number} is recorded as `used` but carries no optional "
                    "picture in lesson.json"
                )
                continue
            # An emoji is the fallback route, so choosing one is a statement that
            # the library had nothing better - which is the same claim as
            # nothing-fits and is held to the same evidence. This is the exact
            # shape of the reported failure: an emoji weather strip typed onto a
            # slide whose library search never happened.
            if all(kind == "emoji" for kind in carried):
                check_evidence(entry, label, library_root, failures)
            if room is not None:
                check_places_left(entry, label, len(carried), room.get(number), failures)
        else:
            if carried:
                failures.append(
                    f"slide {number} is recorded as `none` but carries "
                    f"{len(carried)} optional picture(s) in lesson.json"
                )
                continue
            reason = entry.get("reason")
            if reason not in REASONS:
                failures.append(
                    f"{label}.reason must be one of: {', '.join(sorted(REASONS))}. "
                    "There is deliberately no code for a deck-level answer: a "
                    "photograph already on this slide, a picture already used on "
                    "another slide, or the deck reading as visual enough are not "
                    "reasons this slide has no room"
                )
                continue
            reason_counts[reason] = reason_counts.get(reason, 0) + 1
            if reason == "library-unavailable" and library_root is not None:
                failures.append(
                    f"slide {number} is recorded as library-unavailable, but a "
                    f"drawing library was available to this run at "
                    f"{library_root}. That reason describes the machine, not "
                    "this slide, so it cannot be true of one slide and false of "
                    "the deck around it"
                )
                continue
            if reason in ROOM_CHECKED_REASONS and room is not None:
                measurement = room.get(number)
                if measurement is not None:
                    refusal = room_refusal(number, reason, measurement)
                    if refusal:
                        failures.append(refusal)
                        continue
            if reason in EVIDENCED_REASONS:
                check_evidence(entry, label, library_root, failures)
            if reason == "would-mislead":
                check_bias_claim(entry, label, failures)

    missing = sorted(set(actual) - set(seen))
    if missing:
        failures.append(
            "every slide answers for itself, and these were not answered for: "
            + ", ".join(str(number) for number in missing)
        )

    return failures, actual, reason_counts


def shape_line(actual: dict[int, list[str]]) -> str:
    """The deck's optional layer as a shape, so sameness is visible at a glance."""
    return ",".join(str(len(actual[number])) for number in sorted(actual))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Check the optional-picture pass against the deck it describes."
    )
    parser.add_argument("--pass-record", required=True)
    parser.add_argument("--lesson", required=True)
    parser.add_argument(
        "--library-root",
        help="EDUCATIONAL_SVG_ROOT override. When omitted, the check runs the "
             "resolver itself; the library is genuinely unavailable only when "
             "the resolver says so, never because a caller forgot the flag.",
    )
    parser.add_argument(
        "--room",
        help="slide-room.json from measure-slide-room.py. With it, `full` and "
             "`competes` are settled against the rendered page instead of being "
             "taken on the record's word. Omit only when the run produced no "
             "render evidence to measure.",
    )
    args = parser.parse_args(argv)

    if args.library_root:
        library_root = Path(args.library_root)
        library_source = "supplied by the caller"
        if not library_root.is_dir():
            print(
                f"OPTIONAL_PICTURE_PASS_FAILED: library root does not exist: {library_root}",
                file=sys.stderr,
            )
            return 1
    else:
        library_root, library_source = resolve_library_root()

    try:
        room = read_room(Path(args.room)) if args.room else None
        room_record = (
            read_json(Path(args.room), "slide-room.json") if args.room else None
        )
        failures, actual, reason_counts = check(
            Path(args.pass_record), Path(args.lesson), library_root, room, room_record
        )
    except PassError as exc:
        print(f"OPTIONAL_PICTURE_PASS_FAILED: {exc}", file=sys.stderr)
        return 1

    # Said on every run, pass or fail, because it is the fact that makes the
    # rest of this output readable. A deck with no drawings in it is a good deck
    # when the library had nothing for these slides and a broken one when there
    # was no library to ask, and until this line existed the two printed the
    # same `OPTIONAL_PICTURE_PASS_OK` and reached the teacher identically. That
    # is why "why did it not use the drawings?" has been so hard to answer after
    # the fact: nothing anybody kept recorded whether it could have.
    library_line = (
        f"OPTIONAL_PICTURE_LIBRARY: verified against {library_root} ({library_source})"
        if library_root is not None
        else "OPTIONAL_PICTURE_LIBRARY: UNAVAILABLE - this run had no drawing "
             "library, so no drawing was possible and no search evidence was "
             f"checked ({library_source})"
    )
    print(library_line)

    # Said on every run for the same reason as the library line above: a deck
    # that declined most of its slides as full means one thing when the drawn
    # pages agreed and quite another when nobody measured them, and without this
    # line the two read identically afterwards.
    if room is None:
        print(
            "OPTIONAL_PICTURE_ROOM: UNMEASURED - no rendered pages were "
            "measured, so `full` and `competes` stand on the record's word"
        )
    else:
        print(
            f"OPTIONAL_PICTURE_ROOM: verified against {len(room)} measured "
            f"page(s) from {Path(args.room).resolve()}"
        )

    if failures:
        print("OPTIONAL_PICTURE_PASS_FAILED", file=sys.stderr)
        for line in failures:
            print(f"- {line}", file=sys.stderr)
        return 1

    drawings = sum(
        kinds.count("educational-svg") for kinds in actual.values()
    )
    emojis = sum(kinds.count("emoji") for kinds in actual.values())
    slides_with = sum(1 for kinds in actual.values() if kinds)
    print(f"OPTIONAL_PICTURE_PASS_OK {len(actual)} slides")
    print(f"OPTIONAL_PICTURE_SHAPE: {shape_line(actual)}")
    print(
        f"OPTIONAL_PICTURE_TOTALS: {slides_with} slide(s) carry a picture, "
        f"{drawings} drawing(s), {emojis} emoji"
    )
    if reason_counts:
        detail = ", ".join(
            f"{count} {reason}" for reason, count in sorted(reason_counts.items())
        )
        print(f"OPTIONAL_PICTURE_DECLINED: {detail}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
