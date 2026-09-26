"""The design reviewer release, step 3b (the second check's item 2): the review
view's `Names on the board` lists a one-word name that opens its board sentence
when the teacher's script names it where nothing else made it a capital.

The list reads the board, the slide titles and the vocabulary cards. A one-word
sentence opening is capitalised for being first, so the list drops it unless the
lesson capitalises the same word somewhere nothing else made it so; until now
only the board and titles could vouch for it. So `England, 1485 to 1603.` under
`A Tudor farm household`, `Bruegel painted ...`, `Jenner tested his idea ...` and
`Childline is a free phone line ...` never reached the list, and the name case
this release put on the routing card (a real person, place, organisation or
event the list prints) could not fire on them. The teacher's script now vouches
for a word too, in the same way: a word the script capitalises mid-sentence
counts as known. The script only vouches; a name only the script says is never
listed, because the class cannot read the script (the teacher's ruling of 23
September, kept in the function's own comment).

This is the second check's prototype (`scratch/rvchk2/known_from_script.py`)
built into the packet, reusing the list's own name finder (`board_names_in`)."""
from _patch import PACKET, assert_present, replace_once

# The script, read as the witness it is.
replace_once(
    PACKET,
    "def build_board_names(design: dict) -> list[str]:\n",
    "def spoken_reading(design: dict) -> list[str]:\n"
    "    \"\"\"What the teacher says: each unit's script, without its `Say to\n"
    "    children:` opening, and the script of each vocabulary slide. The class\n"
    "    hears it and cannot read it, so it is never a place a name is listed from;\n"
    "    it only shows which words the lesson treats as names.\"\"\"\n"
    "    spoken: list[str] = []\n"
    "    for unit in lesson_units(design):\n"
    "        script = (unit.get(\"speakerNotes\") or {}).get(\"script\")\n"
    "        if isinstance(script, str) and script.strip():\n"
    "            spoken.append(re.sub(r\"^\\s*Say to children:\\s*\", \"\", script, count=1))\n"
    "    spoken.extend(script for _anchor, _group, script in vocabulary_introductions(design) if script.strip())\n"
    "    return spoken\n"
    "\n"
    "\n"
    "def build_board_names(design: dict) -> list[str]:\n",
)

replace_once(
    PACKET,
    "    known: set[str] = set()\n"
    "    for _where, title, board in reading:\n"
    "        for text in [piece for piece in title if not capitalised_throughout(piece)] + board:\n"
    "            for name in board_names_in(text):\n"
    "                known.update(re.sub(r\"['’]s$\", \"\", word) for word in name.split() if word not in CONNECTORS)\n",
    "    known: set[str] = set()\n"
    "    for _where, title, board in reading:\n"
    "        for text in [piece for piece in title if not capitalised_throughout(piece)] + board:\n"
    "            for name in board_names_in(text):\n"
    "                known.update(re.sub(r\"['’]s$\", \"\", word) for word in name.split() if word not in CONNECTORS)\n"
    "    # A one-word name that opens its board sentence (`England, 1485 to 1603.`,\n"
    "    # `Bruegel painted ...`) is capitalised there for being first, so the board\n"
    "    # alone cannot tell it from `Look`. The teacher's script can: a word it\n"
    "    # capitalises where nothing else made it so is a name, as a word the board\n"
    "    # capitalises mid-sentence is. The script only vouches for a word; a name\n"
    "    # only the script says is not listed, because the class cannot read it.\n"
    "    for spoken in spoken_reading(design):\n"
    "        for name in board_names_in(spoken):\n"
    "            known.update(re.sub(r\"['’]s$\", \"\", word) for word in name.split() if word not in CONNECTORS)\n",
)

assert_present(PACKET, "def spoken_reading(design: dict) -> list[str]:")
assert_present(PACKET, "for spoken in spoken_reading(design):")
print("names from the script done")
