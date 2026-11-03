import json, pathlib

p = pathlib.Path(r"C:/Users/Daniel/Projects/lessonv4/evaluations/techniques-2026-11-03/maths35/lesson-design.json")
d = json.loads(p.read_text(encoding="utf-8"))
ts = d["teachingSequence"]

# Teach: the takeaway carries the sticky fact, so the unit does not list it again (it printed twice),
# and the key question is spoken, not printed, to keep the board at five pieces.
t = ts[0]
t["stickyKnowledgeRefs"] = []
t["content"]["keyQuestions"] = []

# Answer slides show the bar model's whole and parts, so a child checks the drawing, not only the number.
ts[3]["answer"]["content"] = (
    "4,700: the whole is 8,200, and the parts are 3,500 and 4,700.\n"
    "3,850: the whole is 6,000, and the parts are 2,150 and 3,850."
)
ts[6]["answer"]["content"] = (
    "3,600: the whole is 5,900, and the parts are 2,300 and 3,600.\n"
    "4,550: the whole is 7,000, and the parts are 2,450 and 4,550.\n"
    "4,275: the whole is 8,000, and the parts are 3,725 and 4,275.\n"
    "2,350: the whole is 6,250, and the parts are 3,900 and 2,350.\n"
    "2,520: the whole is 4,500, and the parts are 1,980 and 2,520.\n"
    "4,635: the whole is 9,000, and the parts are 4,365 and 4,635."
)

# Worksheet: four sentences, so the sheet fits the time of the Your Turn it replaces.
w = d["worksheet"]
grp = w["contentBlocks"][0]
grp["parts"] = grp["parts"][:4]
aa = w["activityArchitecture"]
aa["coreActionAndEvidence"] = (
    "A many-goes objective: children find missing parts in number sentences, drawing their own bar models. The four sentences are the "
    "evidence of the method, mixed adding and take-away with the missing part in different places, so each child finds the whole every "
    "time before subtracting. Zara's claim tests whether a child follows the + sign, and the bottle-top problem tests finding the whole "
    "and the part in a sentence of words."
)
aa["amount"] = "Four sentences, one reasoning question and one problem: six missing parts found, plus one judgement, about ten minutes in place of the nine-minute Your Turn."
aa["variationAndBoundaryPlan"] = (
    "Opens in the board's form: bare sentences like the Your Turns, in no pattern, two adding (one with the missing part first) and two "
    "take-away, two crossing zeros. No number repeats a slide sentence. Zara's claim is wrong, after Zofia's right one on the board, so the "
    "claims stay mixed. The problem is one step whose whole is said in the words (2,000), so it moves the same maths into a context."
)
aa["organisation"] = "Fluency first (the four sentences under one task line), then Reasoning (Zara's claim), then Problem Solving (the bottle tops), each standing on its own."
w["fitPriority"]["protected"][0] = "the four number sentences, mixed adding and take-away"

p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("ok")
