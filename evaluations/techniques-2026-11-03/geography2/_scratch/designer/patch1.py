import pathlib
f = pathlib.Path(r"C:/Users/Daniel/Projects/lessonv4/evaluations/techniques-2026-11-03/geography2/_scratch/designer/fill.py")
t = f.read_text(encoding="utf8")
pairs = [
    ('    "minutes": 5,\n    "unlocks": "They have the giant', '    "minutes": 4,\n    "unlocks": "They have the giant'),
    ('Which continent is the Amazon rainforest in?\\nWhich imaginary line runs through the Amazon?\\nWhy can', 'Which continent is the Amazon rainforest in?\\nWhy can'),
    ('biome, South America, the Equator, and the hot, rainy weather', 'biome, South America and the hot, rainy weather'),
    ('"Four short recall questions answered from memory."', '"Three short recall questions answered from memory."'),
    ('Four questions about last lesson. Have a go at all four', 'Three questions about last lesson. Have a go at all three'),
    ('The Amazon rainforest is in South America. The Equator runs right through it. And', 'The Amazon rainforest is in South America. And'),
    ('\\nSouth America\\nThe Equator\\nIt', '\\nSouth America\\nIt'),
    ('label="What is it like in the canopy and on the forest floor?", minutes=12,', 'label="What is it like in the canopy and on the forest floor?", minutes=11,'),
    ('d["flagsForTeacher"] = [\n', 'd["flagsForTeacher"] = [\n    "Taught by asking about every line, the lesson runs to about 51 minutes with books out and moving to tables, a little over the usual 50. It is kept as it is because each of its two chunks of teaching needs its own Do, and the fallen-tree prediction is where children use the reason the final description needs. If time is short, the sort can be done on the board instead of at tables.",\n'),
]
for a, b in pairs:
    assert a in t, a
    t = t.replace(a, b)
f.write_text(t, encoding="utf8")
print("patched")
