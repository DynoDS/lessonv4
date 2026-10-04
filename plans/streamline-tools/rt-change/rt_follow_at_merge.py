"""The routes release (topic 8, release 3), run by the lead AFTER bringing it into
main on top of the design reviewer release, once the merge's conflicts are
resolved and the log entry's heading carries its version.

The trial merge (`rt_merge_trial.py`) found these conflicts, all expected, and
every test passing once they were resolved this way:

- `references/build-review-log.md`: both releases append one entry at the end.
  Keep the reviewer's entry, then this release's after it.
- `agents/design-reviewer.md`, in two places. Line 44 (the Teach-board
  paragraph): the reviewer release took two stories out of it and this release
  names the new heading in its four-parts sentence. And section 3's check list,
  where the reviewer's restating-Do repair (RV-J34) and this release's launch
  line (RV-J36: routes decision 2's words and his 13b) are neighbouring lines, so
  git takes them as one hunk. Take the reviewer's side of both; step 1 puts this
  release's two lines back.
- The earlier topics' pin files (quick checks, success criteria, the rhythm,
  starters): both releases moved pins of the same reviewer paragraphs. Take the
  reviewer's side; step 2 moves only this release's sentences inside them.
- The ledgers both releases closed with a section (the rhythm, quick checks,
  success criteria, worksheets, reviewer, voice, and the two topic 7 lists): keep
  both sections, the reviewer's first.

Then, in order:

1. This release's replacements that a resolution may have dropped are put back
   (each only when its old words are still there).
2. `rt_07_repin_other_topics.py --follow`: every earlier topic's pin that still
   holds one of this release's old sentences follows it; a pin already on the
   merged words is left as it is, and checked.
3. The design reviewer release's own pins (its rows RV-C11, RV-J36, RV-E10, the
   paragraphs they sit in, and its home records for those paragraphs) follow this
   release's words, found by their words; any other pin that fails stops the run.
4. `build_rt_mapping.py`: this topic's pins and mapping, rebuilt on the merged
   tree. After this run the builder is frozen like every finished topic's.

    python -X utf8 plans/streamline-tools/rt-change/rt_follow_at_merge.py"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
ROOT = REPO / "plugins" / "lesson-v4"
LOG = ROOT / "references" / "build-review-log.md"
print(f"following the merge in {REPO}")
sys.path.insert(0, str(HERE.parent))
sys.path.insert(0, str(HERE))

HEADING = ("## 2026-09-26 - The teacher's way of explaining is written once for every kind of lesson, a class sees "
           "a good explanation before it writes one in every route, four corners is gone, and the routes' "
           "out-of-date lines are put right")
log = LOG.read_text(encoding="utf-8")
assert log.count(HEADING) == 1, "the entry's heading should appear once"
assert HEADING + "\n" not in log and HEADING + "\r\n" not in log, "number the entry's heading first (it ends with its version)"
for marker in ("<<<<<<<", ">>>>>>>"):
    for path in [LOG, ROOT / "agents" / "design-reviewer.md"]:
        assert marker not in path.read_text(encoding="utf-8"), f"resolve the conflict in {path.name} first"

# --- 1. Put back a replacement a resolution dropped.
from _patch import REV, replace_once, read  # noqa: E402

HOW = "`teaching-sequence-content-based.md` → `How this teacher explains`"
OLD_C11 = ("Read each Teach board for the four parts the teacher teaches in (`teaching-sequence-content-based.md` → "
           "`explanation`):")
NEW_C11 = "Read each Teach board for the four parts the teacher teaches in (" + HOW + "):"
T13B = ("success criteria on the board that already show what a good one looks like (an actual good one, such as a "
        "model answer or a good paragraph, never a list of what a good one includes) stand in for the good instance, "
        "so the launch keeps its case and steps and needs no second model")
LAUNCH_TAIL = ("the unit's `launch` carries what the lesson has established, a good instance beside a weak one, and the "
               "steps, and a null `launch` is right only when children can begin from the question alone")
OLD_J36 = ("- a substantial task is launched before it is instructed: when the product's form is new to the lesson or the "
           "enabling input ran to several units, " + LAUNCH_TAIL + " (`preferences.md` → Slide Philosophy, `Giving a "
           "task its instructions is not launching it`).")
NEW_J36 = ("- a substantial task is launched before it is instructed: when the class has not yet seen a good one of this "
           "product earlier in this lesson or the enabling input ran to several units, " + LAUNCH_TAIL + " or the class "
           "has already seen a good one of this product earlier in this lesson; " + T13B + ", and the program cannot see "
           "whether they do, so judge that from the criteria beside the task (`preferences.md` → Slide Philosophy, "
           "`Giving a task its instructions is not launching it`).")
for old, new in ((OLD_C11, NEW_C11), (OLD_J36, NEW_J36)):
    if old in read(REV):
        replace_once(REV, old, new)
        print(f"put back: {new[:70]}")
    assert new in read(REV), new[:70]

# --- 2. The earlier topics' pins.
run = subprocess.run([sys.executable, "-X", "utf8", str(HERE / "rt_07_repin_other_topics.py"), "--follow"])
assert run.returncode == 0, "rt_07_repin_other_topics.py --follow"

# --- 3. The design reviewer release's own pins.
import ledger_mapping  # noqa: E402
from ledger_mapping import norm, paragraph_of, pin_of  # noqa: E402

# Each moved pin's outcome names only the changes its words carry.
CHANGES = [
    (norm(HOW), "the four-parts line names `How this teacher explains` (routes decisions 3 and 4)"),
    (norm(T13B), "the launch line takes routes decision 2's words and his preferences decision 13b"),
    (": children read a", "the turn-label message carries his maths ruling (routes settled item 7f)"),
]
MARKERS = [marker for marker, _note in CHANGES]
SUBS = [
    (norm(OLD_C11), norm(NEW_C11)),
    (norm(OLD_J36), norm(NEW_J36)),
    (".label must begin with '{word}' and then", ".label must begin with '{word}': children read a"),
]
pins_path = ROOT / "scripts" / "tests" / "design_reviewer_ledger_pins.json"
if pins_path.exists():
    raw = pins_path.read_bytes()
    data = json.loads(raw.decode("utf-8"))
    texts = {}

    def current(rel):
        if rel not in texts:
            texts[rel] = norm((ROOT / rel).read_text(encoding="utf-8"))
        return texts[rel]

    def mine(text):
        return any(marker in text for marker in MARKERS)

    moved = 0
    for row in data["rows"]:
        for n, pin in enumerate(row["present"]):
            if pin["text"] in current(pin["file"]):
                continue
            new_text = pin["text"]
            for old, new in SUBS:
                new_text = new_text.replace(old, new)
            if new_text != pin["text"] and new_text in current(pin["file"]):
                replacement = dict(pin, text=new_text)
            else:
                para = paragraph_of(pin["file"], pin["text"][:60])
                assert para and mine(para), (row["id"], "a pin this release did not move fails", pin["text"][:100])
                replacement = dict(pin, text=para)
            row["present"][n] = replacement
            notes = [note for marker, note in CHANGES if marker in replacement["text"]]
            note = "then the routes release (topic 8, release 3), merged after this release: " + "; ".join(notes)
            if note not in row["outcome"]:
                row["outcome"] += "; " + note
            moved += 1
            print("follows", row["id"])
    for home in data["homes"]:
        lines = (ROOT / home["file"]).read_text(encoding="utf-8").splitlines()
        start = lines.index(home["heading"])
        level = len(home["heading"].split(" ")[0])
        end = next((i for i in range(start + 1, len(lines)) if ledger_mapping.HEADING.match(lines[i])
                    and len(ledger_mapping.HEADING.match(lines[i]).group(1)) <= level), len(lines))
        now = [norm(x) for x in "\n".join(lines[start + 1:end]).split("\n\n") if norm(x) and norm(x) != "---"]
        if now == home["paragraphs"]:
            continue
        assert len(now) == len(home["paragraphs"]), (home["heading"], "a paragraph was added or dropped")
        for was, is_ in zip(home["paragraphs"], now):
            assert was == is_ or mine(is_), (home["heading"], "a paragraph this release did not change differs", is_[:100])
        home["paragraphs"] = now
        print("home follows", home["heading"])
    body = json.dumps(data, indent=1, ensure_ascii=False) + "\n"
    print(f"writing {pins_path} ({moved} pins moved)")
    with open(pins_path, "w", encoding="utf-8", newline="") as handle:
        handle.write(body.replace("\n", "\r\n") if b"\r\n" in raw else body)

# --- 4. This topic's pins and mapping on the merged tree.
run = subprocess.run([sys.executable, "-X", "utf8", str(HERE / "build_rt_mapping.py")])
assert run.returncode == 0, "build_rt_mapping.py"
print("FOLLOW_OK")
