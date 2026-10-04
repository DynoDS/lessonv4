"""The design reviewer release: which saved designs fire the routing card's name
case, as first built and after the checks' repairs (`rv-release-check.md`, item 1;
`rv-release-second-check.md`, item 2).

    python -X utf8 rv_17_name_trigger_table.py

Reads each saved design's review view as 4.2.292 wrote it (`rv_cards.py before`)
and as this release writes it (`rv_cards.py after`), and its `Names on the board`
list. As first built, the case fired on any name the 4.2.292 list printed. After
the repairs it fires on a real person, place, organisation or event the list
prints, and the list itself now takes a one-word name opening its board sentence
when the teacher's script names it mid-sentence (`England, 1485 to 1603.`).
Whether a name is real is a judgement the reviewer makes on sight; the judgement
for each name the saved designs list is written out below, so the table can be
checked name by name. Writes `plans/streamline-tools/rv-name-trigger.md`."""
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
SCRATCH = REPO / "plans" / "streamline-tools" / "scratch" / "rv"
OUT = REPO / "plans" / "streamline-tools" / "rv-name-trigger.md"
print(f"reading views in {SCRATCH / 'cards-before'} and {SCRATCH / 'cards-after'}")
print(f"writing {OUT}")

# Real people, places, organisations and events the saved lists print (people
# of faith and their places included).
REAL = {
    "Jesus", "Jesus'", "God", "God's Son", "Bethlehem", "Christians", "Christians'", "Christian", "Christmas",
    "England", "London", "Tudor London", "London Museum", "British Museum", "Science Museum", "John Moore Museum",
    "Folger Shakespeare Library", "Shakespeare Birthplace Trust", "Romans", "Edward VI", "Edward", "Henry VIII",
    "Hans Holbein", "Hans Holbein the Younger", "Egypt", "Roman-period Egypt", "Britain", "Tudor England",
    "England's Tudor", "Mary Rose", "Karen Lyon", "Neumagen", "Germany", "Bruegel", "Pieter Bruegel the Elder",
    "Low Countries", "Europe", "Nicholas Orme", "John Turke", "Edward Fisher", "Fisher", "Elizabeth", "Ford End School",
    "Essex", "Essex Record Office", "Queen Victoria", "Patience Kershaw", "Sarah Gooder", "Gawber", "Farringdon",
    "Roman Britain", "Stone Age Britain", "Anglo-Saxon Britain", "Hampton", "Port Sunlight", "Factory Act",
    "Factory Acts", "Mines Act", "South America", "North America", "Atlantic Ocean", "Equator", "Earth", "Amazon",
    "Brazil", "Africa", "Tropic of Cancer and the Tropic of Capricorn", "Sahara and the Amazon", "Peru and Colombia",
    "Parliament", "Lord Shaftesbury", "Lord Ashley", "Shaftesbury", "Ibbotson & Co", "Ragged School Union",
    "John Pounds", "Portsmouth", "John Pounds Memorial Church", "Shaftesbury Society",
}
# Names a reviewer could read either way, each with the reading used here. None
# fires by itself: the trigger's words are a real person, place, organisation or
# event, and a period, a numeral system or a subject is none of those.
BORDERLINE = {
    "Tudor": ("a period, not a person, place, organisation or event, so by the trigger's own words it does not fire "
              "by itself; a lesson that names it names a real place or person too, and fires on that"),
    "Imagined Tudor": "a label on a made-up Tudor scene; does not fire",
    "Roman": "in a Roman numerals lesson, the name of the numerals; does not fire",
    "RSE": "the name of a subject; does not fire",
    "Relationships and Sex Education": "the name of a subject; does not fire",
}


def names_in(view: Path) -> list[str] | None:
    if not view.exists():
        return None
    section = view.read_text(encoding="utf-8").split("## Names on the board", 1)[1].split("\n## ", 1)[0]
    return [line[2:].split(": first on the board")[0] for line in section.splitlines()
            if line.startswith("- ") and ": first on the board" in line]


rows = []
before = after = 0
for folder in sorted(p for p in (SCRATCH / "cards-after").iterdir() if p.is_dir()):
    name = folder.name.replace("__", "/")
    old = names_in(SCRATCH / "cards-before" / folder.name / "view.md")
    new = names_in(folder / "view.md")
    if new is None:
        rows.append((name, "(no view: an old design the packet cannot build)", "no", "no", ""))
        continue
    fired_before = bool(old)
    real = [n for n in new if n in REAL]
    border = [n for n in new if n in BORDERLINE]
    fired_after = bool(real)
    before += fired_before
    after += fired_after
    gained = [n for n in new if n not in (old or [])]
    shown = ", ".join(new[:6]) + (f" and {len(new) - 6} more" if len(new) > 6 else "") if new else "none"
    if gained:
        shown += " (now listed: " + ", ".join(gained) + ")"
    notes = []
    if real:
        notes.append("real: " + ", ".join(real[:3]))
    notes += [f"`{n}`: {BORDERLINE[n]}" for n in border]
    if not notes and new:
        notes.append("made-up people, labels or words that are no name")
    rows.append((name, shown, "yes" if fired_before else "no", "yes" if fired_after else "no", "; ".join(notes)))

lines = [
    "# The name case on the routing card: which saved designs fire it",
    "",
    "Written by `rv-change/rv_17_name_trigger_table.py` from each saved design's review view. As first built, "
    "Slide Philosophy's content boundaries (about 18 KB) opened for any name the 4.2.292 view's `Names on the board` "
    "lists (Before). After the release's two checks it opens for a real person, place, organisation or event the "
    "list prints (a made-up person or a label such as `Chart A` is not the case), and the list now also takes a "
    "one-word name opening its board sentence when the teacher's script names it mid-sentence (After). The "
    "judgement for each name is written out in the script.",
    "",
    f"**Fires before: {before} of {len(rows)}. Fires after: {after} of {len(rows)}.** No design fires on a "
    "borderline name alone.",
    "",
    "| Saved design | Names the list prints | Before | After | Why |",
    "|---|---|---|---|---|",
]
lines += [f"| `{a}` | {b} | {c} | {d} | {e} |" for a, b, c, d, e in rows]
OUT.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
print(f"fires before: {before} of {len(rows)}; after: {after} of {len(rows)}")
