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

That left one answer still costing nothing, and on 21 September 2026 a PSHE deck
declined all sixteen of its slides: nine as `would-mislead` and seven as
`nothing-fits`. The nine were one deck-level thought ("this lesson asks children
to reason, so a picture would give it away") written out nine times, one slide at
a time, which is the exact failure this file exists to stop wearing the one
costume it could still wear. The same day's maths deck used its one decline the
same way, on a slide the builder had measured as four-fifths empty.

So `would-mislead` is now paid for like `nothing-fits`: name the searches, and
name the drawing whose meaning would give the task away. The rainforest photo
beside "which biome is this?" can always do that - you find the rainforest, and
placing it answers the question. What cannot do it is a claim about a picture
nobody went looking for. Every reason now costs a measurement or a search, and
there is no free answer left to move to.

The seven `nothing-fits` were a different fault with the same result. The drawing
library is fetched a file at a time, and that run could reach none of them: the
search told it so, on its own line, per drawing. It wrote those drawings into
`rejected` anyway - a porridge drawing "turned down" on the porridge slide - and
this check passed them, because it only asked whether the identifier exists in
the shipped index, which it did. The index is a catalogue; holding the file is
what "I looked at it" means. So a rejected drawing must now be one this machine
actually held, and the case in between - the library listed drawings for this
slide and none of them could be opened - has its own answer, `drawings-
unreachable`, instead of borrowing one that claims a look nobody got.

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
    "drawings-unreachable": "the library listed drawings for this slide and none of them could be opened",
    "library-unavailable": "the drawing library is not on this machine",
    "slide-flagged": "this slide could not be laid out, so it ships blank and flagged for the teacher",
    "vocabulary-slide": "this is a vocabulary slide, where a decoration is not allowed",
}
# The reasons that must be paid for with search evidence rather than asserted.
# `would-mislead` joined them on 21 September 2026: see the note below and the
# module docstring. Both are claims about drawings, so both have to produce one.
EVIDENCED_REASONS = {"nothing-fits", "would-mislead"}

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
# Requiring the sentence was not enough. A sentence is easy to write, so a PSHE
# deck wrote nine of them and declined every slide it had left. What the sentence
# cannot do is produce the drawing it is afraid of, so the claim now carries the
# same search evidence `nothing-fits` does: the drawing whose meaning would give
# the task away, named, from a search that ran. The genuine case can always pay
# it - the rainforest is right there in the library, and placing it answers
# "which biome is this?" - and the deck-level thought cannot pay it at all,
# because it was never about a particular drawing.
#
# The sentence stays as well. It is what makes a bogus claim legible beside the
# task it is about, where Daniel reads it.
BIAS_EVIDENCE_MINIMUM = 40
# The two reasons that are claims about the drawn page, and are settled by it.
ROOM_CHECKED_REASONS = {"full", "competes"}

LIBRARY_ID_RE = re.compile(r"^(standard|cartoon|solid|inkbrush|blockprint)/[a-z0-9]{1,2}/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$")


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


def vocabulary_surfaces(lesson: object) -> set[int]:
    """The 1-based slides that are vocabulary surfaces, where P3 is forbidden.

    The same test the builder applies when it drops a decoration
    (`isVocabularySurface` in builder/src/decorations.js): a `key-vocabulary`
    template, or any slide holding a `type: "vocab"` object with words. Before
    `vocabulary-slide` existed these slides had no true reason to give: the
    measured room refused `full` and `competes`, so eight of twelve runs from
    29 September to 2 October 2026 recorded `nothing-fits`, which is not why
    the slide has no drawing.
    """
    slides = lesson.get("slides") if isinstance(lesson, dict) else None
    surfaces: set[int] = set()
    if not isinstance(slides, list):
        return surfaces

    def holds_vocab(node: object) -> bool:
        if isinstance(node, list):
            return any(holds_vocab(item) for item in node)
        if not isinstance(node, dict):
            return False
        if node.get("type") == "vocab" and isinstance(node.get("words"), list):
            return True
        return any(holds_vocab(value) for value in node.values())

    for index, slide in enumerate(slides, 1):
        if isinstance(slide, dict) and (slide.get("template") == "key-vocabulary" or holds_vocab(slide)):
            surfaces.add(index)
    return surfaces


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


_LIBRARY_IDS: dict[str, frozenset[str]] = {}


def library_ids(library_root: Path) -> set[str]:
    """The catalogue, read once per check rather than once per declined slide."""
    key = str(library_root)
    if key not in _LIBRARY_IDS:
        _LIBRARY_IDS[key] = frozenset(_read_library_ids(library_root))
    return set(_LIBRARY_IDS[key])


def _read_library_ids(library_root: Path) -> set[str]:
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
        for style in ("standard", "cartoon", "solid", "inkbrush", "blockprint"):
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


def held_ids(library_root: Path) -> set[str] | None:
    """Every drawing this machine actually held, or None when that is unknowable.

    The library is fetched one drawing at a time into ``library/`` under the
    resolved root, and a full local copy has the same shape, so a file sitting
    there is this machine having had the bytes in hand. That is what separates a
    drawing somebody looked at and turned down from a drawing they only ever saw
    the name of in the index.

    Returns None when there is no ``library/`` directory at all. A real run
    always has one - the resolver makes it before it reports a root, and a local
    copy is only accepted when it already holds drawings - so None means nobody
    can tell, and a record that cannot be checked stands on its own word, the
    same way `full` and `competes` do on a machine that cannot render.
    """
    library = library_root / "library"
    if not library.is_dir():
        return None
    held: set[str] = set()
    for style in ("standard", "cartoon", "solid", "inkbrush", "blockprint"):
        style_root = library / style
        if not style_root.is_dir():
            continue
        for prefix in style_root.iterdir():
            if not prefix.is_dir():
                continue
            for entry in prefix.iterdir():
                if entry.is_file() and entry.suffix.lower() == ".svg":
                    held.add(f"{style}/{prefix.name}/{entry.name}")
    return held


# Answers already fetched in one batch, keyed by the library and the searches.
_SEARCH_ANSWERS: dict[tuple[str, tuple[str, ...]], list[str]] = {}


def _search_key(library_root: Path, queries: list[str]) -> tuple[str, tuple[str, ...]]:
    return (str(library_root), tuple(queries))


def prefetch_searches(library_root: Path, groups: list[list[str]]) -> None:
    """Run every search the record names in one process, before the slides are read.

    One process per declined slide took 13 to 31 seconds a check on Codex, long
    enough for the host to give up waiting and start the check again while the
    first was still running (26 September 2026, about 9 minutes lost). Each
    answer is exactly the one a single search gives; a group the batch could
    not answer is left for the single search below.
    """
    wanted = []
    for queries in groups:
        key = _search_key(library_root, queries)
        if queries and key not in _SEARCH_ANSWERS and queries not in wanted:
            wanted.append(queries)
    if not wanted or not SEARCH_SCRIPT.is_file():
        return
    import tempfile
    handle = tempfile.NamedTemporaryFile(
        "w", suffix=".json", delete=False, encoding="utf-8"
    )
    try:
        json.dump(wanted, handle)
        handle.close()
        completed = subprocess.run(
            ["node", str(SEARCH_SCRIPT), "--no-fetch", "--batch-file", handle.name,
             "--limit", "24"],
            capture_output=True, text=True, timeout=300,
        )
    except (OSError, subprocess.SubprocessError):
        return
    finally:
        try:
            Path(handle.name).unlink()
        except OSError:
            pass
    for line in completed.stdout.splitlines():
        if not line.startswith("EDUCATIONAL_SVG_BATCH:"):
            continue
        try:
            payload = json.loads(line.split(":", 1)[1].strip())
            queries = wanted[payload["index"]]
        except (json.JSONDecodeError, KeyError, IndexError, TypeError):
            continue
        candidates = payload.get("candidates")
        if not isinstance(candidates, list):
            continue
        _SEARCH_ANSWERS[_search_key(library_root, queries)] = [
            candidate.get("libraryId")
            for candidate in candidates
            if isinstance(candidate, dict) and isinstance(candidate.get("libraryId"), str)
        ]


def run_search(library_root: Path, queries: list[str]) -> list[str]:
    """Ask the real library what those searches return. Empty list when it cannot run."""
    answered = _SEARCH_ANSWERS.get(_search_key(library_root, queries))
    if answered is not None:
        return list(answered)
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


# A slide owes a sentence about its empty places only when it took one drawing
# and the render measured at least this many.
PLACES_WORTH_ASKING_ABOUT = 3


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

    This does not demand a picture in every place. A place too small to show a
    drawing, or one where it would sit against a word, is a complete answer. It
    demands only that stopping is a decision somebody wrote down, in the same way
    refusing is.

    It asks only the slide it was written for: one drawing where three or more
    places were measured. It first asked every slide with a place left over, and
    the cheapest way to owe no sentence was to fill the place. On 7 October 2026
    a deck of clock faces came back with 65 drawings on 24 slides, a ladybird
    and a balloon wedged between the clocks a child was reading, and the
    teacher's ruling was that a plain decoration does not belong in among the
    teaching, so those places are meant to stay empty. A slide with two drawings
    and four places left has made that decision and owes nobody an account of it.
    """
    if not isinstance(measurement, dict):
        return
    places = measurement.get("readableAreas")
    if not isinstance(places, int) or places < PLACES_WORTH_ASKING_ABOUT:
        return
    if taken > 1:
        return
    note = entry.get("placesLeft")
    if isinstance(note, str) and note.strip():
        return
    failures.append(
        f"{label} took {taken} drawing(s) where the render measured {places} "
        f"separate clear places. Say in `placesLeft` why the other "
        f"{places - taken} stayed empty. A place too small to show a drawing, "
        "one where it would sit against a word or a helper, or one in among "
        "the teaching that this lesson had no drawing of its own for, is a "
        "complete answer; what is not an answer is stopping at one without "
        "noticing there were more places"
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
    reason: str = "nothing-fits",
) -> None:
    """A claim about the drawings is paid for, not asserted.

    Two verdicts owe this. `nothing-fits` says the library held nothing suitable
    for this slide; `would-mislead` says it held something whose meaning would
    give the slide's task away. Both are claims about drawings, and neither can
    be made without producing one.
    """
    if reason == "would-mislead" and library_root is None:
        # With no library, no drawing could have been placed on any slide in the
        # deck, so there is no search for this claim to name. The sentence it
        # already owes still stands. `full` and `competes` stay available here on
        # the same footing: they are claims about the slide's own space rather
        # than about a drawing.
        return

    searched = entry.get("searched")
    try:
        queries = string_list(searched, f"{label}.searched")
    except PassError as exc:
        if reason == "would-mislead":
            failures.append(
                f"{exc} - a would-mislead verdict names the searches it ran and "
                "the drawing it is afraid of. A picture that would answer this "
                "slide's task can be found and named, the way a rainforest can "
                "beside 'which biome is this?'; a claim no search was ever made "
                "for is a thought about the deck wearing one slide's clothes"
            )
            return
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
        if reason == "would-mislead":
            # Nothing came back for those terms, so there is no drawing here
            # whose meaning could give anything away. That is the other verdict.
            failures.append(
                f"{label} is would-mislead, but its searches returned no drawing "
                "at all, so there was nothing here to mislead with. A slide the "
                "library had nothing for is `nothing-fits`"
            )
        # The library genuinely returned nothing for those terms. The verdict
        # stands on its own and there is nothing to have rejected.
        return

    rejected = entry.get("rejected")
    try:
        ids = string_list(rejected, f"{label}.rejected")
    except PassError:
        if reason == "would-mislead":
            failures.append(
                f"{label} is would-mislead, and those searches returned "
                f"{len(returned)} drawing(s). Name in `rejected` the one whose "
                "meaning would give this slide's task away. The claim is about a "
                "picture, so it has to be about a particular picture"
            )
            return
        failures.append(
            f"{label} is nothing-fits, but those searches returned "
            f"{len(returned)} drawing(s). Name in `rejected` at least one you "
            "looked at and turned down, and say nothing-fits only about drawings "
            "you have actually seen"
        )
        return

    # What this machine actually held. None when there is no `library/` at all,
    # which a real run never has, and then a rejection stands on its own word.
    held = held_ids(library_root)

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
            continue
        if held is not None and library_id not in held:
            # The index is a catalogue of what exists; holding the file is what
            # looking at it means. The search says so per drawing when a fetch
            # fails, and a run that was told it could not open a drawing wrote
            # that drawing down as one it had turned down.
            failures.append(
                f"{label}.rejected names {library_id!r}, which the index lists "
                "but this machine never held, so nobody can have looked at it. "
                "If its file could not be fetched, that is "
                "`drawings-unreachable`, not a drawing you turned down"
            )


def check_unreachable(
    entry: dict,
    label: str,
    library_root: Path | None,
    failures: list[str],
) -> None:
    """The case in between: the library answered, and none of it could be opened.

    The drawings are fetched one file at a time, so a blocked network leaves a
    run that can rank candidates and open none of them. Before this verdict
    existed, such a run had to borrow one of the other two: `library-unavailable`
    was false, because the library answered, and `nothing-fits` claimed a look
    nobody got. A PSHE deck took the second and wrote seven drawings it had been
    told it could not fetch into `rejected`, a porridge drawing among them, on
    the porridge slide.

    It is paid for like the others. Name the searches; they must return drawings,
    or the honest verdict is `nothing-fits`; and none of what they returned may
    be a drawing this machine held, because any one of those was a drawing that
    could have been looked at.
    """
    if library_root is None:
        failures.append(
            f"{label} is drawings-unreachable, but no drawing library was "
            "available to this run at all, so nothing was listed for this slide "
            "to be unable to open. That is `library-unavailable`"
        )
        return

    searched = entry.get("searched")
    try:
        queries = string_list(searched, f"{label}.searched")
    except PassError as exc:
        failures.append(
            f"{exc} - a drawings-unreachable verdict names the searches it ran, "
            "because the claim is that those searches listed drawings and none "
            "of them would open"
        )
        return

    returned = run_search(library_root, queries)
    if not returned:
        failures.append(
            f"{label} is drawings-unreachable, but its searches returned no "
            "drawing at all, so there was nothing to fail to open. A slide the "
            "library had nothing for is `nothing-fits`"
        )
        return

    held = held_ids(library_root)
    if held is None:
        return
    reachable = sorted(library_id for library_id in returned if library_id in held)
    if reachable:
        failures.append(
            f"{label} is drawings-unreachable, but this machine held "
            f"{len(reachable)} of the drawings those searches returned, starting "
            f"with {reachable[0]!r}. A drawing already here opens without a "
            "network, so it was available to look at and this slide owes the "
            "verdict that follows from looking"
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


# How much of a drawing may lie over something a child reads before it is on it.
#
# Measured on the Christingle decks of 5 October 2026. The line first sat at a
# quarter, because the two drawings he called "on text" covered 33% and 44% of
# their frames. The next deck passed that line and he still saw it: "like slide
# 11, some svgs touching text", from a candle whose frame was 6% over a line of
# words. Touching is the fault, not covering, so the line is now as near none
# as the grid's own rounding allows. A frame placed inside a clear rectangle
# from slide-room.json covers nothing at all, so this costs a careful
# placement nothing.
ON_INK_SHARE = 0.03


# A card's outline is a line one or two grid cells thick and inches long. Words
# are never that shape: a line of text is three or more cells tall, and a blank
# to write on is well under an inch.
EDGE_RUN_ACROSS = 10
EDGE_RUN_DOWN = 8
EDGE_THICKNESS_DOWN = 2


def _without_card_edges(grid: list[list[bool]]) -> list[list[bool]]:
    """The clear grid with card outlines counted as clear.

    The measurement marks a card's outline as occupied, which is right for
    finding empty rectangles and wrong for judging a drawing: with the outline
    counted, the check refused the very placement the teacher made by hand, a
    globe resting across the corner of the success-criteria panel, and the
    drawings retreated to the margins. His rule (5 October 2026): "it could
    still sit in cards, on top of cards, on top of multiple cards, as long as
    it is not touching a text." So an occupied cell that is part of a long thin
    straight run is an edge, and a drawing may cross it.
    """
    rows, columns = len(grid), len(grid[0])
    result = [row[:] for row in grid]

    # Across: runs exactly one cell tall.
    for r in range(rows):
        c = 0
        while c < columns:
            if grid[r][c]:
                c += 1
                continue
            start = c
            while c < columns and not grid[r][c]:
                c += 1
            thin = [
                column
                for column in range(start, c)
                if (r == 0 or grid[r - 1][column]) and (r == rows - 1 or grid[r + 1][column])
            ]
            # Each thin cell of a long run, so an outline that runs under a
            # line of words is still an outline where the words stop.
            if c - start >= EDGE_RUN_ACROSS:
                for column in thin:
                    result[r][column] = True

    # Down: runs one or two cells wide.
    def width_at(r: int, c: int) -> int:
        left = c
        while left > 0 and not grid[r][left - 1]:
            left -= 1
        right = c
        while right < columns - 1 and not grid[r][right + 1]:
            right += 1
        return right - left + 1

    for c in range(columns):
        r = 0
        while r < rows:
            if grid[r][c]:
                r += 1
                continue
            start = r
            while r < rows and not grid[r][c]:
                r += 1
            thin = [row for row in range(start, r) if width_at(row, c) <= EDGE_THICKNESS_DOWN]
            if r - start >= EDGE_RUN_DOWN:
                for row in thin:
                    result[row][c] = True
    return result


def _room_measurer():
    """The page-measuring module, or None where its libraries are not installed."""
    import importlib.util

    script = Path(__file__).resolve().parent / "measure-slide-room.py"
    try:
        spec = importlib.util.spec_from_file_location("measure_slide_room", script)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    except Exception:  # noqa: BLE001 - a missing library is a quieter run, not a fault
        return None
    return module


def drawings_on_ink(lesson: object, room_record: object) -> tuple[list[str], bool]:
    """Drawings placed over words, figures or photographs, read off the drawn page.

    The decorator looks at its own render and judges whether a drawing landed on
    something a child reads, and on 5 October 2026 it looked, reported "clear of
    readable text", and left two drawings across the sentences of slide 14. The
    teacher: "it put educational svgs on text though which shouldnt happen." The
    judgement needed a measurement behind it, and the measurement already
    existed: the page was rendered without its drawings to find the clear space,
    so the same page says what lies under each frame.

    Returns the failures and whether the pages could be read at all. A drawing
    layered `low` is left to the hidden-drawing checks, since it sits behind the
    cards by design.
    """
    if not isinstance(room_record, dict):
        return [], False
    manifest = room_record.get("renderManifest")
    if not isinstance(manifest, str) or not Path(manifest).is_file():
        return [], False
    measurer = _room_measurer()
    if measurer is None:
        return [], False
    try:
        pages = dict(measurer.read_manifest(Path(manifest)))
    except Exception:  # noqa: BLE001
        return [], False

    failures: list[str] = []
    looked = False
    figures = _figures_by_slide(room_record)
    for number, decorations in slide_decorations(lesson).items():
        page = pages.get(number)
        if page is None or not Path(page).is_file():
            continue
        try:
            image, Image, ImageChops, ImageFilter = measurer.load_image(Path(page))
            grid = _without_card_edges(
                measurer.clear_grid(image, Image, ImageChops, ImageFilter)
            )
        except Exception:  # noqa: BLE001
            continue
        looked = True
        rows, columns = len(grid), len(grid[0])
        # The ink check cannot see a figure's empty parts. It forgives pale
        # fills and thin lines so that a drawing may sit on a card, and the
        # inside of an empty bar chart is thin lines on white: a ladybird passed
        # it on the line where the teacher draws a bar, a cloud passed it inside
        # the L-shape whose sides the class was finding, and one decorator took
        # seven such drawings off by eye after this check had allowed them
        # (7 October 2026). The teacher: "I dont think they should be over
        # helpers like this". The measurement carries where the builder drew
        # each figure, and no drawing goes on one, whatever it is of. Beside a
        # figure is still the decorator's judgement.
        on_figure: dict[tuple[int, int], str] = {}
        for figure in figures.get(number) or []:
            if not isinstance(figure, dict):
                continue
            kind = str(figure.get("type") or "figure").replace("-", " ")
            for cell in measurer.figure_cells(image, Image, ImageChops, figure):
                on_figure.setdefault(cell, kind)
        for decoration in decorations:
            if decoration.get("layer") == "low":
                continue
            frame = decoration.get("frame")
            if not isinstance(frame, dict):
                continue
            try:
                x, y = float(frame["x"]), float(frame["y"])
                w, h = float(frame["width"]), float(frame["height"])
            except (KeyError, TypeError, ValueError):
                continue
            c0 = max(0, int(x * columns + 0.5))
            c1 = min(columns, int((x + w) * columns + 0.5))
            r0 = max(0, int(y * rows + 0.5))
            r1 = min(rows, int((y + h) * rows + 0.5))
            cells = [(r, c) for r in range(r0, r1) for c in range(c0, c1)]
            if not cells:
                continue
            name = decoration.get("concept") or decoration.get("id") or "a drawing"
            kinds = [on_figure[cell] for cell in cells if cell in on_figure]
            if len(kinds) / len(cells) > ON_FIGURE_SHARE:
                failures.append(
                    f"slide {number}: the `{name}` drawing sits on the "
                    f"{kinds[0]} - {round(len(kinds) / len(cells) * 100)}% of "
                    "its frame is on it. The empty part of a chart, a shape or "
                    "a table is where the teaching happens, so no drawing goes "
                    "there, whatever it is of. Move it off the figure: the "
                    "blank card round it is still open"
                )
                continue
            occupied = sum(1 for r, c in cells if not grid[r][c]) / len(cells)
            if occupied <= ON_INK_SHARE:
                continue
            failures.append(
                f"slide {number}: the `{name}` drawing touches something a child "
                f"reads - {round(occupied * 100)}% of its frame is over words, a "
                "figure or a photograph on the rendered page. Move it clear of "
                "them. It may stay on a card or across card edges: only words, "
                "figures and photographs count"
            )
    return failures, looked


# How much of a drawing may lie on a figure before it is on it. A drawing
# resting across a figure's outer edge is beside it.
ON_FIGURE_SHARE = 0.1


def _figures_by_slide(room_record: object) -> dict[int, list[dict]]:
    slides = room_record.get("slides") if isinstance(room_record, dict) else None
    return {
        entry["slide"]: entry["figures"]
        for entry in (slides if isinstance(slides, list) else [])
        if isinstance(entry, dict)
        and isinstance(entry.get("slide"), int)
        and isinstance(entry.get("figures"), list)
    }


# The signs a slide uses to tell children what to do, by the words a drawing of
# one is filed under.
SIGN_LOOKALIKES = {
    "the pencil sign, which tells children to write": re.compile(
        r"\b(pencils?)\b", re.IGNORECASE
    ),
    "the tick sign, which marks an answers slide": re.compile(
        r"\b(ticks?|check ?marks?|checkmarks?)\b", re.IGNORECASE
    ),
    "the lightning bolt, which marks a task done on the board": re.compile(
        r"\b(lightning|thunderbolts?)\b", re.IGNORECASE
    ),
    "the sheet sign, which marks a task done on the worksheet": re.compile(
        r"\b(worksheets?|sheets? of paper|paper sheets?|notepaper)\b", re.IGNORECASE
    ),
}


def sign_lookalikes(lesson: object) -> list[str]:
    """Decorations that look like one of the signs children act on.

    A pencil on a slide means "write now", and children learn that once. A
    decorative pencil a few inches from the real one is the same picture meaning
    nothing, and the teacher called it "annoying because theres already a pencil
    icon to get children to write" (8 October 2026). He ruled it out across the
    whole deck, not only on slides that carry the sign, because a sign works
    only while it always means the same thing.
    """
    failures: list[str] = []
    for number, decorations in slide_decorations(lesson).items():
        for decoration in decorations:
            words = " ".join(
                str(decoration.get(key) or "").replace("-", " ").replace("_", " ").replace("/", " ")
                for key in ("concept", "educationalSvgId", "id")
            )
            for sign, pattern in SIGN_LOOKALIKES.items():
                if not pattern.search(words):
                    continue
                name = decoration.get("concept") or decoration.get("id") or "a drawing"
                failures.append(
                    f"slide {number}: the `{name}` drawing looks like {sign}. "
                    "A child cannot tell a decoration from the sign, so choose "
                    "a different drawing for this place"
                )
                break
    return failures


def _only_grows(before: object, after: object) -> bool | None:
    """Whether `after` is `before` with more written in and nothing taken away.

    None means the two are identical. A string grows when every character of the
    earlier one is still there in order ("4" to "64", "Tens:" to
    "Tens: {{13 - 7 = 6}}"), which is what an answer appearing looks like and
    what a different question never does.
    """
    if before == after:
        return None
    if isinstance(before, dict) and isinstance(after, dict):
        if set(before) - set(after):
            return False
        grew = any(key not in before for key in after)
        for key, value in before.items():
            step = _only_grows(value, after[key])
            if step is False:
                return False
            grew = grew or step is True
        return True if grew else None
    if isinstance(before, list) and isinstance(after, list):
        if len(before) != len(after):
            return False
        grew = False
        for old, new in zip(before, after):
            step = _only_grows(old, new)
            if step is False:
                return False
            grew = grew or step is True
        return True if grew else None
    if before is None or before == "":
        return True
    if isinstance(before, str) and isinstance(after, str):
        letters = iter(after)
        return all(letter in letters for letter in before)
    return False


# The title of an answers slide, as `check-slide-design.js` reads it.
ANSWER_TITLE = re.compile(r"\banswers?\b", re.IGNORECASE)


def _answers_its_question(before: dict, after: dict) -> bool:
    """Whether `after` is the answers slide of the task slide before it.

    The teacher makes an answers slide by duplicating the question slide and
    swapping the answers in, "so that there's not a massive visual jump", and
    the deck is built the same way: same part of the lesson, same template. An
    answers slide the designer laid out afresh on another template is a new
    page, and its clear places are somewhere else.
    """
    if not ANSWER_TITLE.search(str(after.get("title") or "")):
        return False
    if ANSWER_TITLE.search(str(before.get("title") or "")):
        return False
    unit = before.get("designUnitId")
    return (
        isinstance(unit, str)
        and unit == after.get("designUnitId")
        and before.get("template") == after.get("template")
    )


def reveal_runs(lesson: object) -> list[list[int]]:
    """Runs of slides that are one page clicked through.

    Two things make the next slide the same page. It is the answers slide of the
    question before it. Or, read from the slides themselves with drawings and
    teacher notes left out, nothing on it has moved or gone and the only change
    is more written in: a column subtraction answered a digit a click is four
    such slides. A second page of questions, or the same story told on with new
    sentences, is neither, because words there are replaced. The two join up, so
    a question and its four answer clicks are one run of five.
    """
    slides = lesson.get("slides") if isinstance(lesson, dict) else None
    if not isinstance(slides, list):
        return []

    def page(slide: object) -> object:
        if not isinstance(slide, dict):
            return None
        return {
            key: value for key, value in slide.items()
            if key not in ("decorations", "speakerNotes")
        }

    runs: list[list[int]] = []
    current: list[int] = []
    for number in range(1, len(slides)):
        before, after = page(slides[number - 1]), page(slides[number])
        same_page = (
            before is not None
            and after is not None
            and (
                _only_grows(before, after) is True
                or _answers_its_question(before, after)
            )
        )
        if same_page:
            if not current:
                current = [number]
            current.append(number + 1)
        elif current:
            runs.append(current)
            current = []
    if current:
        runs.append(current)
    return runs


def drawings_that_move_in_a_run(lesson: object) -> list[str]:
    """A page clicked through keeps its drawings exactly where they were.

    On 7 October 2026 a Year 4 deck answered a column subtraction a digit a
    click, and each click also swapped the drawing beside the working: a medal,
    two balloons, a man with his thumb up, a set of pencils. The one new green
    digit is the thing a child is meant to see, and the drawing moved more than
    it did. The teacher's ruling: the same drawing, unchanged, on every click,
    and the same for a question slide and its answers slide.
    """
    slides = lesson.get("slides") if isinstance(lesson, dict) else None
    if not isinstance(slides, list):
        return []

    def placed(number: int) -> list[str]:
        slide = slides[number - 1]
        decorations = slide.get("decorations") if isinstance(slide, dict) else None
        entries = decorations if isinstance(decorations, list) else []
        return sorted(
            json.dumps(
                {k: v for k, v in entry.items() if k not in ("id", "context")},
                sort_keys=True,
                ensure_ascii=False,
            )
            for entry in entries
            if isinstance(entry, dict)
        )

    failures: list[str] = []
    for run in reveal_runs(lesson):
        first = placed(run[0])
        changed = [number for number in run[1:] if placed(number) != first]
        if not changed:
            continue
        failures.append(
            f"slides {run[0]} to {run[-1]} are one page clicked through, a "
            "question and its answers, and the drawings change on slide(s) "
            f"{', '.join(str(n) for n in changed)}. The answer is the one "
            "thing a child should see move, so give every slide of the run the "
            f"same drawings in the same frames as slide {run[0]}. Choose "
            "places that are clear on every slide of the run, starting from "
            f"slide {run[-1]}, which has the most written on it; a place that "
            "is clear on only some of them takes no drawing"
        )
    return failures


# How many slides one plain decoration may appear on.
REPEAT_LIMIT = 2


def repeated_decorations(lesson: object) -> list[str]:
    """Plain decorations stamped across the deck.

    Two decks on 5 October 2026 turned three drawings round every slide, and a
    retest with a pool of eight still placed the same flower and swirl three
    times each. The teacher both times: "I want to see a variety", "it still
    reused many". A decoration is not about anything, so nothing is lost by
    choosing a different one, and the pool is there to choose from.

    A drawing of the slide's own subject was first let off, so the same candle
    went on four slides and the same gift on three, and he said it again:
    "still see some repeats". So the limit holds for every drawing. A subject
    that returns takes a different drawing of it: the library draws a candle in
    five styles and several poses.
    """
    slides = lesson.get("slides") if isinstance(lesson, dict) else None
    if not isinstance(slides, list):
        return []
    # A page clicked through is one page, so its drawing is seen once however
    # many clicks it stays for. Each run is counted at its first slide.
    first_of_run = {
        number: run[0] for run in reveal_runs(lesson) for number in run
    }
    where: dict[str, list[int]] = {}
    names: dict[str, str] = {}
    for number, slide in enumerate(slides, 1):
        number = first_of_run.get(number, number)
        if not isinstance(slide, dict):
            continue
        decorations = slide.get("decorations")
        if not isinstance(decorations, list):
            continue
        for decoration in decorations:
            if not isinstance(decoration, dict):
                continue
            identity = decoration.get("educationalSvgId") or decoration.get("imagePath")
            if not isinstance(identity, str) or not identity:
                continue
            concept = str(decoration.get("concept") or "")
            where.setdefault(identity, [])
            if number not in where[identity]:
                where[identity].append(number)
            names[identity] = concept or identity
    failures: list[str] = []
    for identity, numbers in sorted(where.items()):
        if len(numbers) <= REPEAT_LIMIT:
            continue
        failures.append(
            f"the `{names[identity]}` drawing is on {len(numbers)} slides "
            f"({', '.join(str(n) for n in numbers)}). The teacher wants to meet "
            "different drawings from slide to slide, so keep it on "
            f"{REPEAT_LIMIT} and give the others a drawing the deck has not used "
            "yet. A subject that returns takes a different drawing of that "
            "subject. Search again if the pool has run out: there is no limit "
            "on searches"
        )
    return failures


# The built deck itself says what covers a drawing, with no render needed. A
# Codex geography deck (28 September 2026) had no render route, so no room was
# measured and the check above never ran: fourteen globes and compasses went
# behind the cards at one stamped frame, and the teacher saw a faint arc peeking
# out from under a card on slide after slide, a drawing nobody could name. The
# preview PowerPoint exists whenever the decorator's preview check passed, and
# it holds every shape in drawing order, so how much of a drawing is under an
# opaque card is a fact read straight out of it.
_NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
# A fill fainter than this lets the drawing show through it.
_OPAQUE_ALPHA = 50000


def _shape_box(element):
    xfrm = element.find("p:spPr/a:xfrm", _NS)
    if xfrm is None:
        xfrm = element.find("p:xfrm", _NS)
    if xfrm is None:
        return None
    off = xfrm.find("a:off", _NS)
    ext = xfrm.find("a:ext", _NS)
    if off is None or ext is None:
        return None
    try:
        x, y = int(off.get("x")), int(off.get("y"))
        w, h = int(ext.get("cx")), int(ext.get("cy"))
    except (TypeError, ValueError):
        return None
    return (x, y, x + w, y + h) if w > 0 and h > 0 else None


def _is_opaque(element, tag: str) -> bool:
    if tag in ("pic", "graphicFrame"):
        return True
    if tag != "sp":
        return False
    sp_pr = element.find("p:spPr", _NS)
    fill = sp_pr.find("a:solidFill", _NS) if sp_pr is not None else None
    if fill is None:
        return False
    alpha = fill.find(".//a:alpha", _NS)
    try:
        return alpha is None or int(alpha.get("val")) >= _OPAQUE_ALPHA
    except (TypeError, ValueError):
        return True


def _pptx_slides(pptx: Path) -> list:
    """The slide size, then each slide's XML in deck order."""
    import posixpath
    import zipfile
    import xml.etree.ElementTree as ET

    with zipfile.ZipFile(pptx) as archive:
        pres = ET.fromstring(archive.read("ppt/presentation.xml"))
        rels = ET.fromstring(archive.read("ppt/_rels/presentation.xml.rels"))
        targets = {rel.get("Id"): rel.get("Target") for rel in rels}
        size = pres.find("p:sldSz", _NS)
        slides = []
        for sld in pres.findall("p:sldIdLst/p:sldId", _NS):
            target = targets.get(sld.get(f"{{{_NS['r']}}}id"), "")
            slides.append(archive.read(posixpath.normpath(posixpath.join("ppt", target))))
        return [(int(size.get("cx")), int(size.get("cy")))] + slides


def covered_decorations(pptx: Path) -> list[str]:
    """Drawings the built deck draws mostly out of sight.

    A drawing counts as seen where it is on the slide and no opaque shape drawn
    after it (a filled card, a photograph, a table) lies over it. Sampled on a
    grid, which is good to a few percent and only has to tell a drawing from a
    sliver.
    """
    import xml.etree.ElementTree as ET

    try:
        (slide_w, slide_h), *slides = _pptx_slides(pptx)
    except (OSError, KeyError, ValueError, TypeError, ET.ParseError) as exc:
        raise PassError(f"could not read the preview deck {pptx}: {exc}") from exc
    failures: list[str] = []
    for number, xml in enumerate(slides, start=1):
        tree = ET.fromstring(xml).find("p:cSld/p:spTree", _NS)
        if tree is None:
            continue
        order = []
        for element in tree.iter():
            tag = element.tag.rsplit("}", 1)[-1]
            if tag not in ("sp", "pic", "graphicFrame"):
                continue
            props = element.find(".//p:cNvPr", _NS)
            name = props.get("name", "") if props is not None else ""
            order.append((tag, name, element))
        for index, (tag, name, element) in enumerate(order):
            if tag != "pic" or not name.startswith("Decoration/"):
                continue
            box = _shape_box(element)
            if box is None:
                continue
            covers = [
                cover
                for later_tag, later_name, later in order[index + 1:]
                if not later_name.startswith("Decoration/")
                and _is_opaque(later, later_tag)
                and (cover := _shape_box(later)) is not None
            ]
            x0, y0, x1, y1 = box
            steps, seen = 16, 0
            for i in range(steps):
                px = x0 + (x1 - x0) * (i + 0.5) / steps
                for j in range(steps):
                    py = y0 + (y1 - y0) * (j + 0.5) / steps
                    if not (0 <= px <= slide_w and 0 <= py <= slide_h):
                        continue
                    if any(c0 <= px <= c1 and d0 <= py <= d1 for c0, d0, c1, d1 in covers):
                        continue
                    seen += 1
            fraction = seen / (steps * steps)
            if fraction >= VISIBLE_FRACTION:
                continue
            failures.append(
                f"slide {number}: the drawing `{name[len('Decoration/'):]}` is "
                f"{round((1 - fraction) * 100)}% hidden behind the slide's cards or "
                "off its edge, so what shows is a sliver a child cannot name. Bring "
                "it in front (`layer: \"high\"`) in space clear of every word, move "
                "it where most of it shows, or remove it"
            )
    return failures


def check(
    pass_path: Path,
    lesson_path: Path,
    library_root: Path | None,
    room: dict[int, dict] | None = None,
    room_record: dict | None = None,
    flagged: set[int] | None = None,
    pptx: Path | None = None,
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
    vocab_surfaces = vocabulary_surfaces(lesson)
    failures: list[str] = []
    if library_root is not None:
        prefetch_searches(library_root, [
            [q for q in entry["searched"] if isinstance(q, str)]
            for entry in entries
            if isinstance(entry, dict) and isinstance(entry.get("searched"), list)
            and all(isinstance(q, str) for q in entry["searched"])
        ])
    if room:
        stamped = room_record.get("compositionSha256") if isinstance(room_record, dict) else None
        if isinstance(stamped, str) and stamped != composition_fingerprint(lesson):
            failures.append(
                "the deck has changed since its pages were measured, so every drawing was placed "
                "against space that has moved. Re-render and re-measure the deck, then place the "
                "drawings again: clear space is a fact about one arrangement, and a banner one line "
                "taller moves the band beneath it onto the drawing"
            )
        if pptx is None:
            failures.extend(hidden_decorations(lesson, room))
    # The built deck is the exact answer where it exists; the measured room is
    # the estimate from a render, used only when no deck was handed over.
    if pptx is not None:
        failures.extend(covered_decorations(pptx))
    on_ink, _ = drawings_on_ink(lesson, room_record)
    failures.extend(on_ink)
    failures.extend(sign_lookalikes(lesson))
    failures.extend(repeated_decorations(lesson))
    failures.extend(drawings_that_move_in_a_run(lesson))
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
            if reason == "vocabulary-slide":
                if number not in vocab_surfaces:
                    failures.append(
                        f"slide {number} is recorded as vocabulary-slide, but it is not "
                        "a vocabulary slide (no key-vocabulary template and no vocab "
                        "words on it), so a decoration is allowed here and the slide "
                        "answers with a reason about its own space or subject"
                    )
                continue
            if reason == "drawings-unreachable":
                check_unreachable(entry, label, library_root, failures)
                continue
            if reason == "slide-flagged":
                # Settled by the build, not by the pass. `--deliver-flagged`
                # prints SLIDES_FLAGGED naming every slide it could not lay out,
                # so this reason is true of exactly those slides and of no
                # others. Without the list nobody can tell, and an unverifiable
                # reason is the free answer this file exists to remove.
                if flagged is None:
                    failures.append(
                        f"slide {number} is recorded as slide-flagged, but this "
                        "run named no flagged slides. That reason is settled by "
                        "the build's SLIDES_FLAGGED line; pass it with "
                        "--flagged-slides or use a reason about this slide"
                    )
                elif number not in flagged:
                    failures.append(
                        f"slide {number} is recorded as slide-flagged, but the "
                        "build laid it out. A slide that renders is a slide "
                        "with room, and it answers with one of the reasons "
                        "about its own space or subject"
                    )
                continue
            if reason in EVIDENCED_REASONS:
                check_evidence(entry, label, library_root, failures, reason)
            if reason == "would-mislead":
                check_bias_claim(entry, label, failures)

    # The other direction. A slide the build could not lay out ships blank with
    # a note on it, so a drawing placed there lands on a page the teacher has
    # already been told to check, and the pass must say that is what happened
    # rather than claim the slide was full or that nothing fitted.
    for number in sorted(flagged or ()):
        entry = seen.get(number)
        if entry is None:
            continue
        if entry.get("decision") == "used":
            failures.append(
                f"slide {number} could not be laid out and ships blank, but the "
                "pass put a drawing on it. Record it as slide-flagged and leave "
                "it alone"
            )
        elif entry.get("reason") != "slide-flagged":
            failures.append(
                f"slide {number} could not be laid out and ships blank, but the "
                f"pass declined it as {entry.get('reason')!r}. A blank flagged "
                "slide is slide-flagged, which says why there is nothing here "
                "instead of describing space that was never drawn"
            )

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


def variety_line(lesson: object) -> str:
    """How many different drawings the deck's optional layer is made of.

    The shape line shows how many drawings each slide took and cannot show what
    they were, so a deck that turned three sparkles round thirteen slides read
    `1,0,1,1,1` and looked varied. The teacher saw it at once: "the same 3 or 4,
    and kind of cycled through them" (5 October 2026). This counts the drawings
    by what they are, so the same few used over and over is a number the
    decorator sees before it promotes the deck.
    """
    uses: dict[str, int] = {}

    def walk(node: object) -> None:
        if isinstance(node, list):
            for item in node:
                walk(item)
            return
        if not isinstance(node, dict):
            return
        if node.get("kind") == "educational-svg":
            identity = node.get("educationalSvgId") or node.get("imagePath")
            if isinstance(identity, str) and identity:
                uses[identity] = uses.get(identity, 0) + 1
        for value in node.values():
            walk(value)

    walk(lesson.get("slides") if isinstance(lesson, dict) else None)
    total = sum(uses.values())
    if not total:
        return "OPTIONAL_PICTURE_VARIETY: no drawings placed"
    most = max(uses.values())

    # Size and tilt are counted too, because a deck can vary what it draws and
    # still stamp every drawing at one size, upright: "they're all the same
    # size, same orientation" (5 October 2026). Widths are in inches on a
    # 13.33 inch slide, rounded so two that look alike count as alike.
    widths: set[float] = set()
    tilted = 0
    for decorations in slide_decorations(lesson).values():
        for decoration in decorations:
            frame = decoration.get("frame")
            if isinstance(frame, dict):
                try:
                    widths.add(round(float(frame["width"]) * SLIDE_W_INCHES * 2) / 2)
                except (KeyError, TypeError, ValueError):
                    pass
            try:
                if abs(float(decoration.get("rotation") or 0)) >= 5:
                    tilted += 1
            except (TypeError, ValueError):
                pass
    sizes = (
        f"{len(widths)} size(s) from {min(widths):g} to {max(widths):g} inches wide"
        if widths
        else "no framed sizes"
    )
    return (
        f"OPTIONAL_PICTURE_VARIETY: {total} drawing(s) placed, {len(uses)} "
        f"different; the most repeated appears {most} time(s); {sizes}; "
        f"{tilted} tilted"
    )


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
    parser.add_argument(
        "--flagged-slides",
        help="the slide numbers the build could not lay out, as the "
             "`SLIDES_FLAGGED:` line of a `--deliver-flagged` build names them "
             "(comma separated). Those slides ship blank with a note, so they "
             "answer `slide-flagged` and carry no drawing. Without this, that "
             "reason is refused, because nothing else can tell a blank slide "
             "from a slide somebody declined.",
    )
    parser.add_argument(
        "--pptx",
        help="the preview PowerPoint the decorator's check built. With it, a "
             "drawing mostly hidden behind cards or off the slide's edge fails, "
             "measured from the deck itself, so it holds on a machine that "
             "cannot render.",
    )
    args = parser.parse_args(argv)

    flagged: set[int] | None = None
    if args.flagged_slides is not None:
        flagged = set()
        for part in args.flagged_slides.replace(" ", "").split(","):
            if not part:
                continue
            try:
                flagged.add(int(part))
            except ValueError:
                print(
                    "OPTIONAL_PICTURE_PASS_FAILED: --flagged-slides takes slide "
                    f"numbers separated by commas, not {part!r}",
                    file=sys.stderr,
                )
                return 1

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
            Path(args.pass_record), Path(args.lesson), library_root, room,
            room_record, flagged, Path(args.pptx) if args.pptx else None,
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
    print(variety_line(read_json(Path(args.lesson), "lesson.json")))
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
