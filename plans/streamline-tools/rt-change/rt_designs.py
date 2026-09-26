"""The routes release: what the widened explanation check does to every saved
lesson design, read directly (not through the whole validator, which refuses
every saved design earlier for other reasons), before and after.

For each saved design (the three roots `validate-saved-designs.py` reads, never
written), with 7A's four retired keys stripped in memory:
- the check on a clean 4.2.293 validator (`scratch/rt/p293`, a `git archive` of
  `59f85708`) and on this copy's validator;
- for every design the new check refuses, the repair its message names (the
  refused beat's launch given a good instance beside a weak one) applied in
  memory, and the check run again, so each new refusal is shown to be one the
  designer can mend;
- the whole validator, before and after, on the stripped design, with its first
  fault, so a design whose first fault changed is named.

    python -X utf8 rt_designs.py

Writes `plans/streamline-tools/scratch/rt/designs.json` and prints a summary."""
import copy
import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
AFTER = REPO / "plugins" / "lesson-v4"
BEFORE = REPO / "plans" / "streamline-tools" / "scratch" / "rt" / "p293" / "plugins" / "lesson-v4"
SAVED = Path(r"C:\Users\Daniel\Projects\lessonv4")
ROOTS = ["working", "lesson-resources-output/working", "output/working"]
OUT = REPO / "plans" / "streamline-tools" / "scratch" / "rt" / "designs.json"


def load(name, root):
    spec = importlib.util.spec_from_file_location(name, root / "scripts" / "validate-lesson-design.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


old = load("rt_validator_before", BEFORE)
new = load("rt_validator_after", AFTER)
PAIR = {"strong": {"words": "A good one, in full.", "show": None}, "weak": {"words": "A weak one.", "show": None},
        "difference": "The strong one says why."}


def strip(design):
    design = copy.deepcopy(design)
    lesson = design.get("lesson") if isinstance(design.get("lesson"), dict) else {}
    for key in ("scope", "deferredLearning", "lesson2Direction"):
        lesson.pop(key, None)
    starter = design.get("starter") if isinstance(design.get("starter"), dict) else {}
    content = starter.get("content") if isinstance(starter.get("content"), dict) else {}
    content.pop("testQuestionPath", None)
    return design


def check(module, structure, sequence):
    try:
        module.validate_explanation_task_is_modelled(structure, sequence)
        return None
    except module.ContractError as refused:
        return str(refused)


def first_fault(module, design, photos):
    try:
        module.validate_design(design, photos)
        return "LESSON_DESIGN_OK"
    except module.ContractError as refused:
        return str(refused).splitlines()[0][:200]
    except Exception as error:  # a saved design the contract cannot read
        return f"{type(error).__name__}: {error}"[:200]


print(f"reading saved designs from {SAVED}; writing {OUT}")
results = {}
for root in ROOTS:
    for path in sorted((SAVED / root).rglob("lesson-design.json")):
        rel = str(path.relative_to(SAVED))
        try:
            design = strip(json.loads(path.read_text(encoding="utf-8")))
        except Exception as error:
            results[rel] = {"load": str(error)}
            continue
        photos_path = path.with_name("photo-requirements.json")
        photos = json.loads(photos_path.read_text(encoding="utf-8")) if photos_path.exists() else {"photos": []}
        structure = (design.get("lesson") or {}).get("structure")
        sequence = design.get("teachingSequence") or []
        record = {"structure": structure, "before": check(old, structure, sequence), "after": check(new, structure, sequence)}
        if record["after"] and not record["before"]:
            repaired = copy.deepcopy(sequence)
            index = int(record["after"].split("[", 1)[1].split("]", 1)[0])
            launch = repaired[index]["content"].get("launch") or {"established": None, "goodLooksLike": None, "steps": []}
            launch["goodLooksLike"] = copy.deepcopy(PAIR)
            repaired[index]["content"]["launch"] = launch
            record["repaired"] = check(new, structure, repaired) or "passes"
            # The first check's bypass: a one-line launch, no good one shown,
            # with the beat's criteria (rounding steps) left as they are.
            one_line = copy.deepcopy(sequence)
            one_line[index]["content"]["launch"] = {"established": "We have learnt the method.", "goodLooksLike": None,
                                                    "steps": []}
            record["carriesCriteria"] = bool(one_line[index].get("successCriteriaRefs"))
            record["oneLineLaunch"] = "passes" if check(new, structure, one_line) is None else "refused"
        record["wholeBefore"] = first_fault(old, strip(design), photos)
        record["wholeAfter"] = first_fault(new, strip(design), photos)
        results[rel] = record

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(results, indent=1, ensure_ascii=False), encoding="utf-8")
newly = [rel for rel, r in results.items() if r.get("after") and not r.get("before")]
lifted = [rel for rel, r in results.items() if r.get("before") and not r.get("after")]
changed_first = [rel for rel, r in results.items() if r.get("wholeBefore") != r.get("wholeAfter")]
print(f"{len(results)} saved designs")
print(f"newly refused by the explanation check: {len(newly)}")
for rel in newly:
    print(f"  {rel} ({results[rel]['structure']}): repaired by the named fix -> {results[rel]['repaired']}; "
          f"a one-line launch with no good one (criteria attached: {results[rel]['carriesCriteria']}) -> "
          f"{results[rel]['oneLineLaunch']}")
print(f"refused before and not after: {len(lifted)}")
for rel in lifted:
    print(f"  {rel}")
print(f"first fault of the whole validator changed: {len(changed_first)}")
for rel in changed_first:
    print(f"  {rel}\n    before: {results[rel]['wholeBefore']}\n    after:  {results[rel]['wholeAfter']}")
