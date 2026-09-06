#!/usr/bin/env python3
"""Hold the helper check to an answer, and hold the build to that answer.

A lesson names the visuals its learning rests on. The engine can only draw the
ones it has a helper for. Between those two facts sat a judgement nobody
recorded: a run could decide "this needs a balanced-plate helper", build no
helper, ship slides with words where the picture belonged, and pass every check
on the way out. The decision was real and the run simply walked past it.

So the judgement stays where it belongs, with the reader who can compare a
lesson's figure against what a helper actually draws, and this script does the
two mechanical halves around it:

    inventory  what the lesson needs, and every helper key each surface can
               really draw right now, read from the live registries rather than
               from a written catalogue that drifts.

    verdict    every required use has exactly one recorded decision, and a use
               called covered names a helper key that is live on that surface.

    delivery   every use recorded as covered actually appears in the built
               specification for its surface.

`delivery` is the half that catches the original failure: a covered decision
whose helper never reaches the deck is the silent substitution, and it now
fails loudly at the boundary instead of quietly in a classroom.

A `substitute` decision is honest and allowed - the picture route exists for
exactly the visual no helper should ever draw - but it must be written down
with its reason, so an absence is a recorded choice and never a silence.

A reason alone turned out not to be enough. `substitute` does not mean "no
helper draws this"; it means "the picture route supplies this instead", and the
route only supplies anything when a picture requirement for it reaches the photo
contract. A Year 4 geography run recorded two substitutes whose reasons each
said the approved contract supplied the map, froze a contract holding neither,
and left the slide designer a hole it filled with the nearest live map helper -
a coastline drawn from chosen coordinates, on a lesson about where the Amazon
actually is. Every check passed. So `substitute` now names the picture that
supplies it and the verdict resolves that filename in the contract, which fires
before the freeze, while adding the picture still costs one revision.

`gap` is the fourth answer, for the visual no helper draws and no picture can
honestly supply. It is the outcome the playbook already called
`SLIDE_HELPER_GAP`, given a slot here so a genuine dead end has somewhere to go
that is not a substitute promising a picture nobody can source.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
from pathlib import Path

DECISIONS = ("covered", "build", "substitute", "gap")

# A `covered` decision names the helper that draws the figure the lesson
# describes, not a lookalike of roughly the right shape. A history run
# recorded a not-to-scale timeline as covered by `table`, and the deck printed
# a three-column table with "not to scale" as a column heading, three times
# (4 September 2026). The check below cannot judge every figure, but it can
# hold the ones the catalogue already names: when the representation's own
# words say what the figure is, the helper must be one that draws that figure.
# Keys are the words a designer writes; values are the helper keys that draw
# them on each surface. A surface with no acceptable key means no helper on
# that surface draws it, so the decision must be build, substitute or gap.
FIGURE_HELPERS: dict[str, dict[str, tuple[str, ...]]] = {
    "timeline": {
        "slides": ("timeline",),
        "worksheets": ("timeline",),
        "wall": ("timeline",),
        "stick-in": ("timeline",),
    },
    "number line": {
        "slides": ("numberline",),
        "worksheets": ("numberline", "number-line"),
        "wall": ("numberline", "number-line"),
        "stick-in": ("numberline", "number-line"),
    },
    "numberline": {
        "slides": ("numberline",),
        "worksheets": ("numberline", "number-line"),
        "wall": ("numberline", "number-line"),
        "stick-in": ("numberline", "number-line"),
    },
    "venn": {s: ("venn",) for s in ("slides", "worksheets", "wall", "stick-in")},
    "carroll": {s: ("carroll",) for s in ("slides", "worksheets", "wall", "stick-in")},
    "bar model": {s: ("bar-model",) for s in ("slides", "worksheets", "wall", "stick-in")},
    "place value": {
        s: ("place-value-chart", "place-value-counter-chart")
        for s in ("slides", "worksheets", "wall", "stick-in")
    },
    "place-value": {
        s: ("place-value-chart", "place-value-counter-chart")
        for s in ("slides", "worksheets", "wall", "stick-in")
    },
    "clock": {s: ("clock",) for s in ("slides", "worksheets", "wall", "stick-in")},
    "part-whole": {s: ("part-whole-model",) for s in ("slides", "worksheets", "wall", "stick-in")},
    "part whole": {s: ("part-whole-model",) for s in ("slides", "worksheets", "wall", "stick-in")},
    "concept map": {s: ("concept-map",) for s in ("slides", "worksheets", "wall", "stick-in")},
    "fishbone": {s: ("fishbone",) for s in ("slides", "worksheets", "wall", "stick-in")},
    "map": {s: ("map", "grid-map") for s in ("slides", "worksheets", "wall", "stick-in")},
}
# Longer names first, so "concept map" is matched before "map".
FIGURE_WORDS = sorted(FIGURE_HELPERS, key=len, reverse=True)


def figure_named(item: dict) -> str | None:
    """The catalogue figure this representation's own words name, if any."""
    text = " ".join(
        str(item.get(field) or "")
        for field in ("representationName", "description")
    ).lower()
    for word in FIGURE_WORDS:
        if re.search(r"(?<![a-z-])" + re.escape(word) + r"(?![a-z])", text):
            return word
    return None


def lookalike_failure(item: dict, helper_key: str, surface: str, label: str) -> str | None:
    """Why a `covered` decision names a lookalike rather than the figure."""
    word = figure_named(item)
    if word is None:
        return None
    acceptable = FIGURE_HELPERS[word].get(surface, ())
    if helper_key in acceptable:
        return None
    live = [key for key in acceptable if key in registry_keys_cached(surface)]
    if live:
        return (
            f"{label} describes a {word} but is covered by {helper_key!r}, which "
            f"draws something else: a {word} on {surface} is drawn by "
            f"{', '.join(repr(key) for key in live)}, so name that helper"
        )
    return (
        f"{label} describes a {word} but is covered by {helper_key!r}, and no "
        f"{surface} helper draws a {word}: record build, substitute or gap "
        "rather than a lookalike that renders cleanly and teaches the wrong "
        "figure"
    )


_REGISTRY_CACHE: dict[str, set[str]] = {}
_REGISTRY_ROOT: Path | None = None


def registry_keys_cached(surface: str) -> set[str]:
    if _REGISTRY_ROOT is None:
        return set()
    if surface not in _REGISTRY_CACHE:
        try:
            _REGISTRY_CACHE[surface] = registry_keys(_REGISTRY_ROOT, surface)
        except CoverageError:
            _REGISTRY_CACHE[surface] = set()
    return _REGISTRY_CACHE[surface]

# Each surface, the registry file that decides what it can draw, and the
# JavaScript object inside it that holds the keys. Reading the registry is the
# point: a helper is only real where its renderer dispatches on it, and a
# written catalogue can claim otherwise.
REGISTRIES = {
    "slides": (("builder/src/content/index.js",), ("HELPERS",)),
    "worksheets": (("worksheet-html/src/helpers/purposes.js",), ("module.exports",)),
    "wall": (("working-wall-html/src/visuals.js",), ("VISUAL_KEY_FNS",)),
    "stick-in": (
        ("stick-in-sheets-html/src/visual-registry.js",),
        ("VISUALS", "ROW_VISUALS"),
    ),
}

# How a built specification names the helper it drew, per surface.
SPEC_KEY_FIELDS = {
    "slides": ("type",),
    "worksheets": ("helper",),
    "wall": ("type",),
    "stick-in": ("visual",),
}


class CoverageError(ValueError):
    pass


def load_json(path: Path, label: str) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise CoverageError(f"{label} is unreadable JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise CoverageError(f"{label} root must be an object")
    return data


def load_uses(design_path: Path) -> list[dict]:
    """Reuse the existing collector so both halves read one definition of a use."""
    collector = design_path  # placeholder to keep the name in scope for errors
    module_path = Path(__file__).resolve().parent / "collect-helper-uses.py"
    spec = importlib.util.spec_from_file_location("collect_helper_uses", module_path)
    if spec is None or spec.loader is None:
        raise CoverageError(f"cannot load {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    try:
        design = module.load_design(design_path)
        return module.collect(design)
    except module.HelperUseError as exc:
        raise CoverageError(f"lesson design: {exc}") from exc
    except OSError as exc:
        raise CoverageError(f"lesson design {collector} unreadable: {exc}") from exc


def object_body(text: str, name: str) -> str:
    """The braces of `name = { ... }`, matched by depth so nesting is safe."""
    pattern = re.compile(re.escape(name) + r"\s*=\s*\{")
    match = pattern.search(text)
    if match is None:
        return ""
    depth = 0
    start = match.end() - 1
    for index in range(start, len(text)):
        char = text[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start + 1 : index]
    return ""


def registry_keys(root: Path, surface: str) -> set[str]:
    files, names = REGISTRIES[surface]
    keys: set[str] = set()
    for relative in files:
        path = root / relative
        try:
            text = path.read_text(encoding="utf-8")
        except OSError as exc:
            raise CoverageError(f"registry is unreadable: {path}: {exc}") from exc
        for name in names:
            body = object_body(text, name)
            if not body:
                continue
            # Top-level entries only: a nested option object must not read as a
            # helper the surface can draw.
            depth = 0
            for line in body.splitlines():
                stripped = line.strip()
                if depth == 0:
                    entry = re.match(r"""^["']?([A-Za-z][A-Za-z0-9_-]*)["']?\s*:""", stripped)
                    if entry:
                        keys.add(entry.group(1))
                depth += line.count("{") + line.count("[")
                depth -= line.count("}") + line.count("]")
                if depth < 0:
                    depth = 0
    if not keys:
        raise CoverageError(f"no helper keys found for surface {surface!r}")
    return keys


# What each surface writes down about its own helpers, so a reader choosing
# between sixty-odd of them has more than a name to go on.
#
# These were one file for a while - the worksheet purposes - and every surface
# was labelled from it. That is fine while two surfaces mean the same thing by a
# key, and silently wrong the moment they do not. On worksheets
# `place-value-chart` is the digits chart and `place-value-counter-chart` is a
# separate helper for counters; on slides there is one `place-value-chart`, and
# it draws digits, counters, ten-for-one exchanges and a before-and-after pair.
#
# A Year 4 place-value run (3 September 2026) read the worksheet's digits-only
# line under LIVE HELPERS slides, concluded the board could not draw counters at
# all, and sent four slide configurations to controlled AI generation instead: a
# helper build, a design revision, two image scouts and two generations that
# failed outright. The deck then drew those same charts with that very helper,
# when a focused repair replaced the pictures it could not get. The description
# was not stale. It belonged to a different surface.
#
# So each surface answers for itself now. Slides read the helper table in
# templates.md, which is the reference the slide designer already works from, so
# there is one description per helper rather than a second copy free to drift.
# Worksheets keep their own purposes file. A surface with nothing written down
# says nothing, rather than borrowing another surface's words.
def worksheet_purposes(root: Path) -> dict[str, str]:
    path = root / "worksheet-html/src/helpers/purposes.js"
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return {}
    found: dict[str, str] = {}
    for key, line in re.findall(
        r"""["']?([A-Za-z][A-Za-z0-9_-]*)["']?\s*:\s*\n?\s*["'](.*?)["'],?\n""",
        text,
    ):
        found.setdefault(key, line)
    return found


def slide_purposes(root: Path) -> dict[str, str]:
    path = root / "references/templates.md"
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return {}
    found: dict[str, str] = {}
    for key, line in re.findall(
        r"^\|\s*`([A-Za-z][A-Za-z0-9_-]*)`\s*\|\s*(.+?)\s*\|\s*$",
        text,
        re.M,
    ):
        found.setdefault(key, line.strip())
    return found


def purposes(root: Path, surface: str) -> dict[str, str]:
    if surface == "slides":
        return slide_purposes(root)
    if surface == "worksheets":
        return worksheet_purposes(root)
    return {}


def use_key(item: dict) -> tuple[str, str, str]:
    return (
        str(item.get("representationId")),
        str(item.get("configuration")),
        str(item.get("requiredSurface")),
    )


def surface_of(item: dict) -> str:
    return str(item.get("requiredSurface"))


def run_inventory(root: Path, design_path: Path) -> int:
    uses = load_uses(design_path)
    print(f"REQUIRED USES {len(uses)}")
    for item in uses:
        bearing = "load-bearing" if item["loadBearing"] else "supporting"
        features = ", ".join(item["requiredFeatures"]) or "none stated"
        print(
            f"- {item['representationId']}/{item['configuration']} "
            f"[{item['requiredSurface']}] {bearing}: "
            f"{item.get('representationName')} - {item.get('description')} "
            f"(must show: {features})"
        )
    for surface in ("slides", "worksheets", "wall", "stick-in"):
        keys = sorted(registry_keys(root, surface))
        lines = purposes(root, surface)
        print(f"\nLIVE HELPERS {surface} ({len(keys)})")
        for key in keys:
            note = lines.get(key)
            print(f"- {key}: {note}" if note else f"- {key}")
    print("\nHELPER_INVENTORY_OK")
    return 0


def read_decisions(verdict_path: Path) -> list[dict]:
    data = load_json(verdict_path, "helper verdict")
    decisions = data.get("decisions")
    if not isinstance(decisions, list):
        raise CoverageError("helper verdict must have a decisions array")
    return decisions


def contract_filenames(photo_requirements: Path) -> set[str]:
    """Every filename the photo contract promises to source."""
    data = load_json(photo_requirements, "photo requirements")
    photos = data.get("photos")
    if not isinstance(photos, list):
        raise CoverageError("photo requirements must have a photos array")
    return {
        str(photo["filename"]).replace("\\", "/")
        for photo in photos
        if isinstance(photo, dict) and isinstance(photo.get("filename"), str)
    }


def promises(named: str, contracted: set[str]) -> bool:
    """The contract holds this picture, allowing for a folder prefix either way."""
    asked = named.replace("\\", "/")
    return any(
        name == asked or name.endswith(f"/{asked}") or asked.endswith(f"/{name}")
        for name in contracted
    )


def run_verdict(
    root: Path,
    design_path: Path,
    verdict_path: Path,
    photo_requirements: Path | None = None,
) -> int:
    global _REGISTRY_ROOT
    _REGISTRY_ROOT = root
    _REGISTRY_CACHE.clear()
    uses = load_uses(design_path)
    decisions = read_decisions(verdict_path)
    failures: list[str] = []
    gaps: list[str] = []
    contracted = (
        contract_filenames(photo_requirements) if photo_requirements else None
    )

    recorded: dict[tuple[str, str, str], dict] = {}
    for index, decision in enumerate(decisions):
        where = f"decisions[{index}]"
        if not isinstance(decision, dict):
            failures.append(f"{where} must be an object")
            continue
        key = use_key(decision)
        if key in recorded:
            failures.append(f"{where} repeats the decision for {'/'.join(key)}")
            continue
        recorded[key] = decision

    required = {use_key(item): item for item in uses}

    for key in sorted(required):
        if key not in recorded:
            failures.append(
                f"{'/'.join(key)} has no recorded decision: every required "
                "representation use needs one of covered, build or substitute"
            )
    for key in sorted(recorded):
        if key not in required:
            failures.append(
                f"{'/'.join(key)} is recorded but the approved design does not "
                "require it"
            )

    for key in sorted(recorded):
        if key not in required:
            continue
        decision = recorded[key]
        label = "/".join(key)
        verdict = decision.get("decision")
        if verdict not in DECISIONS:
            failures.append(
                f"{label} decision must be one of {', '.join(DECISIONS)}"
            )
            continue
        helper_key = decision.get("helperKey")
        reason = decision.get("reason")
        surface = key[2]
        if verdict in ("covered", "build"):
            if not isinstance(helper_key, str) or not helper_key.strip():
                failures.append(f"{label} is {verdict} but names no helperKey")
                continue
        if verdict in ("build", "substitute", "gap"):
            if not isinstance(reason, str) or not reason.strip():
                failures.append(f"{label} is {verdict} but records no reason")
        if verdict == "substitute":
            # The half a reason cannot carry. `substitute` is a promise that the
            # picture route supplies this visual, and only a filename in the
            # contract makes that promise checkable.
            picture = decision.get("picture")
            if not isinstance(picture, str) or not picture.strip():
                failures.append(
                    f"{label} is substitute but names no picture: give the "
                    "`picture` filename the photo contract sources for this "
                    "visual. If no picture can honestly supply it, this is a "
                    "gap, not a substitute"
                )
            elif contracted is None:
                failures.append(
                    f"{label} is substitute, so this run has a picture to "
                    "resolve: pass --photo-requirements so the named filename "
                    "can be checked against the contract"
                )
            elif not promises(picture, contracted):
                failures.append(
                    f"{label} is substitute on {picture!r}, which the photo "
                    "contract does not promise. The picture route has not run "
                    "yet: revise the design to add this picture, then check "
                    "again. A substitute whose picture never enters the "
                    "contract leaves the renderer the same nothing a missing "
                    "helper does, and it fills that silently"
                )
        if verdict == "gap":
            gaps.append(f"{label}: {reason if isinstance(reason, str) else ''}")
        if verdict == "covered":
            checks = decision.get("featureChecks")
            if not valid_checks(checks):
                failures.append(f"{label} needs featureChecks: an array of feature/path/equals assertions (empty only when no required features)")
            else:
                features = {check["feature"] for check in checks}
                missing = set(required[key]["requiredFeatures"]) - features
                extra = features - set(required[key]["requiredFeatures"])
                if missing or extra:
                    failures.append(f"{label} featureChecks must cover exactly the required features; missing={sorted(missing)}, unknown={sorted(extra)}")
            if surface not in REGISTRIES:
                failures.append(f"{label} has no known registry for its surface")
                continue
            if helper_key not in registry_keys(root, surface):
                failures.append(
                    f"{label} is covered by {helper_key!r}, which no {surface} "
                    "renderer can draw: treat it as build or substitute"
                )
                continue
            lookalike = lookalike_failure(required[key], helper_key, surface, label)
            if lookalike:
                failures.append(lookalike)
        if verdict == "build":
            failures.append(
                f"{label} is still marked build: run the helper route, then "
                "record substitute with its reason. A helper built in this run "
                "is written to pending-helper/ and is not live here, so this "
                "lesson's visual comes from the picture route"
            )

    if failures:
        print("HELPER_COVERAGE_FAILED", file=sys.stderr)
        for line in failures:
            print(f"- {line}", file=sys.stderr)
        return 1
    # A gap passes, because a dead end honestly recorded is the right outcome
    # and stopping the run over it delivers the teacher nothing. It is printed
    # so it reaches the run report rather than resting in a file nobody reads.
    for line in gaps:
        print(f"HELPER_GAP: {line}")
    print(f"HELPER_COVERAGE_OK {len(required)}")
    return 0


def valid_checks(checks) -> bool:
    return isinstance(checks, list) and all(
        isinstance(c, dict) and isinstance(c.get("feature"), str) and c["feature"].strip()
        and ((isinstance(c.get("path"), str) and c["path"].startswith("/") and "equals" in c
              and "visualReview" not in c)
             or (isinstance(c.get("visualReview"), str) and c["visualReview"].strip()
                 and "path" not in c and "equals" not in c)) for c in checks
    )


def pointer_values(value, pointer: str) -> list:
    """JSON Pointer with * for every list element; a missing path never passes."""
    values = [value]
    for raw in pointer.split("/")[1:]:
        token = raw.replace("~1", "/").replace("~0", "~")
        next_values = []
        for current in values:
            if token == "*" and isinstance(current, list):
                if not current:
                    return []
                next_values.extend(current)
            elif isinstance(current, dict) and token in current:
                next_values.append(current[token])
            elif isinstance(current, list) and token.isdigit() and int(token) < len(current):
                next_values.append(current[int(token)])
            else:
                return []
        values = next_values
    return values


def helper_occurrences(value, fields, refs=(), path=""):
    if isinstance(value, dict):
        # An explicit node binding disambiguates multiple representations sharing
        # a slide; otherwise reuse the existing source-unit references.
        binding = value.get("helperUse")
        if isinstance(binding, dict):
            refs = ({"ref": binding.get("representationId"), "configuration": binding.get("configuration")},)
        elif isinstance(value.get("representationRefs"), list):
            refs = value["representationRefs"]
        for field in fields:
            if isinstance(value.get(field), str):
                yield value[field], refs, value, path
        for name, child in value.items():
            if name not in ("helperUse", "representationRefs"):
                yield from helper_occurrences(child, fields, refs, f"{path}/{name}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from helper_occurrences(child, fields, refs, f"{path}/{index}")


def reference_scopes(value, path=""):
    if isinstance(value, dict):
        if isinstance(value.get("representationRefs"), list):
            yield value["representationRefs"], path
        for name, child in value.items():
            yield from reference_scopes(child, f"{path}/{name}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from reference_scopes(child, f"{path}/{index}")


def run_delivery(verdict_path: Path, spec_path: Path, surface: str) -> int:
    if surface not in SPEC_KEY_FIELDS:
        raise CoverageError(f"unknown surface {surface!r}")
    decisions = read_decisions(verdict_path)
    spec = load_json(spec_path, "built specification")
    occurrences = list(helper_occurrences(spec, SPEC_KEY_FIELDS[surface]))
    scopes = list(reference_scopes(spec))
    failures = []
    checked = 0
    for decision in decisions:
        if not isinstance(decision, dict) or decision.get("requiredSurface") != surface or decision.get("decision") != "covered":
            continue
        checked += 1
        rep, config, _ = use_key(decision)
        helper = decision.get("helperKey")
        label = f"{rep}/{config} ({helper})"
        checks = decision.get("featureChecks")
        if not valid_checks(checks):
            failures.append(f"{label}: missing or malformed featureChecks; rerun the capability verdict")
            continue
        matches = [(node, path) for key, refs, node, path in occurrences
                   if key == helper and len(refs) == 1 and any(isinstance(r, dict) and r.get("ref") == rep and r.get("configuration") == config for r in refs)]
        if not matches:
            failures.append(f"{label}: no helper bound to this representation/configuration; surface shipped a substitute or omitted its use binding")
            continue
        for refs, scope in scopes:
            if any(isinstance(r, dict) and r.get("ref") == rep and r.get("configuration") == config for r in refs):
                if not any(path == scope or path.startswith(scope + "/") for _, path in matches):
                    failures.append(f"{label}: required use at {scope} has no bound helper; a different unit cannot satisfy it")
        for node, path in matches:
            for check in checks:
                if "visualReview" in check:
                    print(f"HELPER_VISUAL_REVIEW: {label} at {path}: {check['feature']}: {check['visualReview']}")
                    continue
                values = pointer_values(node, check["path"])
                # JSON booleans and numbers must not compare equal in Python.
                expected = json.dumps(check["equals"], sort_keys=True)
                if not values or any(json.dumps(v, sort_keys=True) != expected for v in values):
                    failures.append(f"{label} at {path}: required feature {check['feature']!r} failed {check['path']}")
    if failures:
        print("HELPER_DELIVERY_FAILED", file=sys.stderr)
        for line in failures:
            print(f"- {line}", file=sys.stderr)
        return 1
    print(f"HELPER_DELIVERY_OK {checked}")
    return 0


def main(argv=None) -> int:
    # The inventory prints the helper descriptions verbatim, and a maths and
    # science catalogue is written in ticks, multiplication signs, squared units
    # and dashes. On Windows the console's default code page cannot encode any of
    # them, so the script died mid-listing on the very characters its own
    # reference is written in. A tool whose whole job is printing a catalogue
    # settles its own encoding rather than depending on every caller remembering
    # `-X utf8`.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("inventory", "verdict", "delivery"))
    parser.add_argument("--plugin-root")
    parser.add_argument("--lesson-design")
    parser.add_argument("--verdict")
    parser.add_argument("--photo-requirements")
    parser.add_argument("--spec")
    parser.add_argument("--surface")
    args = parser.parse_args(argv)

    root = Path(args.plugin_root).resolve() if args.plugin_root else Path(__file__).resolve().parents[1]

    if args.mode == "inventory":
        if not args.lesson_design:
            raise CoverageError("inventory needs --lesson-design")
        return run_inventory(root, Path(args.lesson_design))

    if args.mode == "verdict":
        if not args.lesson_design or not args.verdict:
            raise CoverageError("verdict needs --lesson-design and --verdict")
        return run_verdict(
            root,
            Path(args.lesson_design),
            Path(args.verdict),
            Path(args.photo_requirements) if args.photo_requirements else None,
        )

    if not args.verdict or not args.spec or not args.surface:
        raise CoverageError("delivery needs --verdict, --spec and --surface")
    return run_delivery(Path(args.verdict), Path(args.spec), args.surface)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except CoverageError as exc:
        print(f"HELPER_COVERAGE_ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)
