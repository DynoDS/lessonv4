import json, pathlib

WD = pathlib.Path(r"C:/Users/Daniel/Projects/lessonv4/evaluations/techniques-2026-11-03/maths35")
p = WD / "lesson-design.json"
d = json.loads(p.read_text(encoding="utf-8"))

ORIENTATION = (
    "Teacher orientation: Children learn to find a missing part in an adding or take-away number sentence by drawing a bar model: "
    "the whole on top, the two parts underneath, and the missing part is the whole take away the part they know. They meet the bar "
    "model on the starter's own fact family, then see it on 1,240 + ___ = 3,860, practise adding sentences (including one where the "
    "missing part comes first), then take-away sentences like 5,000 − ___ = 1,850; the six mixed ones in the second Your Turn are the "
    "main practice. They finish by deciding whether Zofia is right that an adding sentence and a take-away sentence have the same "
    "missing number. The tricky move is not following the sign: in 1,240 + ___ = 3,860 the answer is a take-away, and children who "
    "add get 5,100, bigger than the whole. It is shown in the first My Turn and guided in the first Our Turn. From the slides: every "
    "question runs from the board, with children drawing their own bar models and columns. To print: the worksheet, done in place of "
    "the second Your Turn."
)

d["lesson"].update({
    "lo": "Find a missing part (+ and −)",
    "displayedLo": "To find a missing part (+ and −)",
    "durationMinutes": 45,
    "stickingPoint": (
        "Following the printed sign instead of finding the whole: 1,240 + ___ = 3,860 answered 5,100 by adding the two numbers shown, "
        "and, once that is corrected, a take-away undone by adding (5,000 − ___ = 1,850 worked as 6,850). The Teach draws the starter's "
        "fact family as a bar model; the first My Turn names the pull to add and shows the answer is bigger than the whole; the first Our "
        "Turn guides a sentence with the missing part first; the second cycle finds the whole as the first number of a take-away; the "
        "mixed second Your Turn and Zofia's claim retest it."
    ),
})
d["teacherOrientation"] = ORIENTATION

NO_ANSWER = {"kind": "none", "content": None, "acceptanceCondition": None, "delivery": "none"}

def common(u, **kw):
    u.update({"pupilInstruction": None, "taskStructure": None, "modellingState": None,
              "representationRefs": [], "stickyKnowledgeRefs": [], "misconceptionRefs": [], "photoRefs": []})
    u.update(kw)

# ---------------- starter
s = d["starter"]
common(s)
s.update({
    "label": "Take-aways and fact families",
    "minutes": 6,
    "unlocks": "They have last lesson's exchange across zeros and the 4,000 fact family fresh, which the bar model Teach draws and every missing part is worked with.",
    "thinking": "Which column needs an exchange, and what is left when one part is taken from 4,000?",
    "content": {
        "activity": "7,004 − 2,358 =\n2,500 + 1,500 = 4,000, so 4,000 − 1,500 = ___\n2,500 + 1,500 = 4,000, so 4,000 − 2,500 = ___",
        "connection": "Retrieves last lesson's column subtraction across zeros (lesson 34) on a fresh 4-digit take-away, because every missing part today is worked out that way, and a Year 3 fact family the class already holds. Questions 2 and 3 are the fact family the next Teach draws as a bar model.",
        "format": "Three short questions each child answers: one subtraction set out in their own columns and two gaps to fill, checked together on the answers slide.",
    },
    "successCriteriaRefs": [],
    "speakerNotes": {
        "script": "Say to children: Three to start. The first one is a take-away in columns like last lesson's, and there are zeros in the way, so start with the ones and see how far the exchange has to go. The other two are gaps to fill. You know 2,500 and 1,500 make 4,000. So what's 4,000 take away 1,500? And what's 4,000 take away 2,500? When we check them, hold on to those last two, because we're going to draw them in a minute.",
        "teacherInfo": "On the answers, ask what happened to the 0s in 7,004: the thousand gave first, each 0 became 10 and then 9, and the ones became 14. A tens or hundreds digit one too big means the child used the 10 instead of the 9: ask which digit is in that column now. Questions 2 and 3 are the numbers on the bar model in the next Teach.",
        "lookFor": None,
    },
    "answer": {"kind": "exact", "content": "4,646\n2,500\n1,500", "acceptanceCondition": None, "delivery": "answer-slide"},
})

# ---------------- vocabulary
d["vocabulary"][0].update({
    "term": "whole",
    "definition": "The whole is the full amount, everything put together.",
    "visual": {"kind": "representation", "representationRef": "rep-001", "configuration": "vocabulary-whole"},
})
d["vocabulary"][1].update({
    "term": "part",
    "definition": "A part is one bit of the whole. Two parts added together make the whole.",
    "visual": {"kind": "representation", "representationRef": "rep-001", "configuration": "vocabulary-part"},
})
d["vocabularyIntroductions"] = [{
    "vocabularyRefs": ["vocab-001", "vocab-002"],
    "after": "lesson-section/starter/unit-001",
    "script": "Say to children: Two words we'll use all lesson. The first is whole. The whole is the full amount, everything put together. Look at the long bar on top: that's 10, the whole. The second is part. A part is one bit of the whole, and two parts added together make the whole. Look underneath: 6 and 4 are the parts, and 6 and 4 make 10. Quick one: is 4 a part or the whole? A part. You'll hear me say whole and part on every slide today.",
}]

# ---------------- representation
r = d["representations"][0]
r["name"] = "Bar model: the whole on top, the parts underneath"
r["purpose"] = ("Show a number sentence with a part missing as one whole and two parts, so children can see which number is the whole "
                "before they decide what to take away from what. The whole is one bar on top; the two parts sit in a bar of the same "
                "length directly underneath it, touching, so the parts visibly make the whole.")
cfg = {c["id"]: c for c in r["configurations"]}
cfg["vocabulary-whole"].update({
    "description": "Small bar model of 10 over the parts 6 and 4, with the word whole beside the top bar.",
    "requiredFeatures": [
        "the whole bar labelled 10 on top, with the parts 6 and 4 in a bar of the same length directly underneath",
        "the word \"whole\" printed beside the top bar",
    ],
})
cfg["vocabulary-part"].update({
    "description": "The same small bar model of 10 over 6 and 4, with the word parts beside the bottom bar.",
    "requiredFeatures": [
        "the whole bar labelled 10 on top, with the parts 6 and 4 in a bar of the same length directly underneath",
        "the word \"parts\" printed beside the bottom bar",
    ],
})
cfg["teach"].update({
    "description": "Prepared bar model of 2,500 + 1,500 = 4,000: the whole bar 4,000 on top and the parts 2,500 and 1,500 underneath, every number written in from the start.",
    "requiredFeatures": [
        "the whole bar on top labelled 4,000",
        "the two parts 2,500 and 1,500 in a bar of the same length directly underneath, touching the whole bar",
        "the parts drawn as long as their numbers, so 2,500 is the longer part",
        "every number written in from the start",
    ],
})
cfg["live"].update({
    "description": "A bar model for one number sentence, for the teacher to complete live: the whole bar on top and two parts in a bar of the same length directly underneath. The whole bar and the left-hand part are empty for the teacher to write in; the right-hand part shows ? from the start, because it is the missing part. Parts drawn as long as that sentence's numbers. Finished state (the answer slide): the whole and the part known written in, and the missing part's number in place of the ?. Each number sentence gets its own bar model.",
    "requiredFeatures": [
        "the whole bar on top with two parts in a bar of the same length directly underneath, touching it",
        "the whole bar and the left-hand part empty at the start for the teacher to write in",
        "the right-hand part marked \"?\" from the start",
        "the parts drawn as long as that sentence's numbers",
        "finished state: the whole, the part known and the missing part's number each written in its own box",
        "one bar model per number sentence",
    ],
})

# ---------------- success criteria, sticky, misconceptions, concept
d["successCriteria"][0].update({
    "type": "steps",
    "drawLive": True,
    "content": {
        "heading": "How to find a missing part",
        "steps": [
            "Find the {{whole}}.\nAdding? It's the number <<after the =>>.\nTaking away? It's <<the first number>>.",
            "Draw a bar model with the whole on top.",
            "Write the {{part}} you know underneath. Write ? for the missing part.",
            "Work out the whole − the part you know. Write the answer in the gap.",
        ],
    },
})
d["stickyKnowledge"][0]["text"] = "The two parts make the whole. So the whole take away one part leaves the other part."
d["misconceptions"][0].update({
    "belief": "The sign says what to do: in 1,240 + ___ = 3,860 you add the two numbers you can see, so the missing number is 5,100.",
    "correctiveFact": "Find the whole first. In an adding sentence the whole is after the =, and the missing part is the whole take away the part you know.",
    "strategy": "Named in the first My Turn and shown wrong because the answer is bigger than the whole; guided in the first Our Turn, including a sentence with the missing part first; checked alone in the first Your Turn; retested in the adding sentences of the second Your Turn and in Zofia's claim at the end.",
    "reason": "The plan's second misconception and the lesson's sticking point: a child holding it gets every adding sentence wrong while working carefully, and the wrong answer looks like an answer.",
})
d["misconceptions"][1].update({
    "belief": "A take-away with a number missing is undone by adding: 5,000 − ___ = 1,850 is worked as 5,000 + 1,850 = 6,850.",
    "correctiveFact": "In a take-away the whole is the first number, and the missing part is still the whole take away the part you know.",
    "strategy": "One touch: named in the second My Turn and shown to be more than we started with; its wrong answer in the second Our Turn's teacher notes.",
    "reason": "A secondary wrong move that 'don't follow the sign' can create in a child who learns it as 'do the opposite'; one clean touch is enough because the job is the same.",
})
d["concepts"][0]["name"] = "Find a missing part in an adding or take-away number sentence: find the whole, draw the bar model, then take the part you know away from the whole"

LIVE = [{"ref": "rep-001", "configuration": "live", "interaction": "teacher-completes"}]
BOARD_ONLY_OT = {"printed": None, "boardOnlyBecause": "It is worked with the teacher on the board, and children answer each question aloud or in their own working, so a sheet would change nothing.", "realThings": None}

ts = d["teachingSequence"]

# ---------------- teach
u = ts[0]
common(u)
u.update({
    "label": "What does a bar model show?",
    "minutes": 3,
    "unlocks": "They can see a whole and two parts in a bar model and know the whole take away one part leaves the other, which the first My Turn runs on 3,860.",
    "thinking": "Which bar is the whole, and how do the two parts fit underneath it?",
    "content": {
        "headline": "This is a bar model. It shows a number and the two parts it's made of.",
        "explanation": "The long bar on top is the whole: 4,000. Underneath, the same length is split into two parts: 2,500 and 1,500.\n2,500 and 1,500 make 4,000 together. So 4,000 take away 2,500 leaves 1,500, just like in the starter.",
        "takeaway": {"kind": "sticky", "ref": "sk-001"},
        "teachingText": None,
        "keyQuestions": ["The whole is 4,000 and one part is 1,500. What is the other part?"],
    },
    "representationRefs": [{"ref": "rep-001", "configuration": "teach", "interaction": "view"}],
    "successCriteriaRefs": [],
    "stickyKnowledgeRefs": ["sk-001"],
    "speakerNotes": {
        "script": "Say to children: Look at this. It's the starter's numbers drawn as a picture, and it's called a bar model. The long bar on top is the whole. It's 4,000, all of it together. Now look underneath. It's the same length, but it's split into two parts: 2,500 and 1,500. See how they fit exactly under the whole? Put the two parts back together and you get 4,000. Now here's the useful bit. If I know the whole and one part, I can always find the other part. I take the part I know away from the whole. 4,000 take away 2,500 leaves 1,500. You did exactly that in the starter. So, the whole is 4,000 and one part is 1,500. What's the other part? Point to it on the bar. 2,500. That's the one job we'll do all lesson: the whole take away the part you know.",
        "teacherInfo": None,
        "lookFor": None,
    },
    "answer": {"kind": "exact", "content": "2,500", "acceptanceCondition": None, "delivery": "teacher-only"},
})

# ---------------- my turn 1
u = ts[1]
common(u)
u.update({
    "label": "My Turn",
    "minutes": 4,
    "unlocks": "They have seen the whole found after the = in an adding sentence and the missing part worked as the whole take away the part known, which the Our Turn hands to them.",
    "thinking": None,
    "content": {"example": "1,240 + ___ = 3,860", "modelledExemplar": None},
    "modellingState": "Live-complete helper",
    "representationRefs": LIVE,
    "misconceptionRefs": ["mc-001"],
    "speakerNotes": {
        "script": "Say to children: Here's a number sentence with a number missing. 1,240 add something equals 3,860. Look at the sign: it's a plus. Some people see a plus and add the two numbers they can see, 1,240 and 3,860. Let's not rush. First I ask: which number is the whole? In an adding sentence, the two parts go together to make the whole, so the whole is the number after the equals. That's 3,860, so I write it on the long bar at the top. Which part do I know? 1,240. That goes underneath. The other part is the one that's missing, so it keeps its question mark. Now look at my bar model. I know the whole and one part. To find the other part, I take the part I know away from the whole: 3,860 take away 1,240. In columns. Ones: 0 take away 0 is 0. Tens: 6 take away 4 is 2. Hundreds: 8 take away 2 is 6. Thousands: 3 take away 1 is 2. 2,620. That's the missing part, so I write it in the gap. Let's see if it makes sense. 1,240 and 2,620 are the two parts, and they fit under 3,860. If I'd added, I'd have got 5,100. That's bigger than the whole, and a part can't be bigger than the whole.",
        "teacherInfo": "An answer of 5,100 means the child added the two numbers they could see because of the + sign: point at 3,860 and ask which number the two parts make together, then whether a part can be bigger than the whole.",
        "lookFor": None,
        "onTheBoard": "On the board: Write 3,860 in the whole bar and 1,240 in the left-hand part. Under the bar model, write 3,860 − 1,240 and work it in columns: 2,620. Write 2,620 in place of the ? and in the gap in the number sentence.",
    },
    "answer": {"kind": "exact", "content": "1,240 + 2,620 = 3,860", "acceptanceCondition": None, "delivery": "answer-slide"},
})

# ---------------- our turn 1
u = ts[2]
common(u)
u.update({
    "label": "Our Turn",
    "minutes": 4,
    "unlocks": "They can find the whole of an adding sentence themselves, wherever the missing part sits, which the first Your Turn checks alone.",
    "thinking": "Which number do the two parts make together, and which part do I already know?",
    "content": {"example": "2,700 + ___ = 4,950\n___ + 1,600 = 5,000"},
    "modellingState": "Live-complete helper",
    "representationRefs": LIVE,
    "misconceptionRefs": ["mc-001"],
    "speakerNotes": {
        "script": "Say to children: Now you tell me. 2,700 add something equals 4,950. Which number is the whole? How do you know? Yes, 4,950, because it's an adding sentence, so the two parts make the number after the equals. Which part do we know? 2,700. So what do we take away from what? 4,950 take away 2,700. Work it out. 2,250. Now the second one. This time the missing part comes first: something add 1,600 equals 5,000. Does that change where the whole is? Which number do the two parts make together? 5,000, still after the equals. The part we know is 1,600. So it's 5,000 take away 1,600, and there are zeros in the way, so the thousand gives first. Work it out. 3,400.",
        "teacherInfo": "In the second one, 6,600 means the child added 1,600 and 5,000 because of the +: ask which number the two parts make together. A child who puts 1,600 on the whole bar has read the first number they saw as the whole: ask whether 1,600 can be made of 5,000 and something else.",
        "lookFor": None,
        "onTheBoard": "On the board: For the first, write 4,950 in the whole bar and 2,700 in the left-hand part, write 4,950 − 2,700 = 2,250 under it, and write 2,250 in place of the ? and in the gap. For the second, write 5,000 in the whole bar and 1,600 in the left-hand part, write 5,000 − 1,600 = 3,400 under it, and write 3,400 in place of the ? and in the gap.",
    },
    "answer": {"kind": "exact", "content": "2,250\n3,400", "acceptanceCondition": None, "delivery": "answer-slide"},
    "levels": BOARD_ONLY_OT,
})

# ---------------- your turn 1
u = ts[3]
common(u)
u.update({
    "label": "Your Turn",
    "minutes": 4,
    "unlocks": "Each child has found the whole of an adding sentence alone twice, which the mixed sentences in the second Your Turn build on.",
    "thinking": "Which number is the whole here, even though the sign says +?",
    "content": {
        "activityArchitecture": "Two adding sentences, one with the missing part second and one with it first, each worked alone with a bar model the child draws and a column subtraction. A quick check of the first cycle, sized to the cycle, before the take-away case is added.",
        "task": "3,500 + ___ = 8,200\n___ + 2,150 = 6,000",
    },
    "pupilInstruction": "Draw a bar model for each one.",
    "misconceptionRefs": ["mc-001"],
    "speakerNotes": {
        "script": "Say to children: Two on your own. For each one, find the whole first, then draw your bar model and take the part you know away from the whole. The second one has the missing part first, and there are zeros in the way.",
        "teacherInfo": "11,700 or 8,150 means the child added because of the + sign: ask which number the two parts make together before they work anything out.",
        "lookFor": "Look for: the number after the = on the whole bar; ? in a part; 6,000 − 2,150 worked across the zeros.",
    },
    "answer": {"kind": "exact", "content": "4,700\n3,850", "acceptanceCondition": None, "delivery": "answer-slide"},
    "doMode": "deeper",
    "levels": {"printed": None, "boardOnlyBecause": "Two short sentences children set out in their own bar models and columns; a sheet would only reprint them.", "realThings": None},
})

# ---------------- my turn 2
u = ts[4]
common(u)
u.update({
    "label": "My Turn",
    "minutes": 3,
    "unlocks": "They have seen the whole found as the first number of a take-away and the same job done, which the Our Turn hands to them.",
    "thinking": None,
    "content": {"example": "5,000 − ___ = 1,850", "modelledExemplar": None},
    "modellingState": "Live-complete helper",
    "representationRefs": LIVE,
    "stickyKnowledgeRefs": ["sk-001"],
    "misconceptionRefs": ["mc-002"],
    "speakerNotes": {
        "script": "Say to children: Now a take-away with a number missing. 5,000 take away something leaves 1,850. Which number is the whole now? In a take-away, we start with the whole and take a part away, so the whole is the first number: 5,000. I write that on the long bar. What's left, 1,850, is one part. The part we took away is the one that's missing, so it keeps its question mark. It's the same bar model as before, and it's the same job: the whole take away the part we know. 5,000 take away 1,850. There are zeros in the way, so the thousand gives first, and each 0 becomes 10, then 9. Ones: 0 take away 0 is 0. Tens: 10 take away 5 is 5. Hundreds: 9 take away 8 is 1. Thousands: 4 take away 1 is 3. 3,150. That's the missing part. Some people think: it's a take-away, so to undo it I should add. 5,000 add 1,850 is 6,850, and that's more than we started with. The sign changed. What we do didn't: the whole take away the part we know.",
        "teacherInfo": "An answer of 6,850 means the child added to undo the take-away: ask which number we started with, and whether we can end up with more than that.",
        "lookFor": None,
        "onTheBoard": "On the board: Write 5,000 in the whole bar and 1,850 in the left-hand part. Under the bar model, write 5,000 − 1,850 and work it in columns across the zeros: 3,150. Write 3,150 in place of the ? and in the gap in the number sentence.",
    },
    "answer": {"kind": "exact", "content": "5,000 − 3,150 = 1,850", "acceptanceCondition": None, "delivery": "answer-slide"},
})

# ---------------- our turn 2
u = ts[5]
common(u)
u.update({
    "label": "Our Turn",
    "minutes": 3,
    "unlocks": "They can find the whole of a take-away sentence themselves, which the mixed sentences in the second Your Turn need.",
    "thinking": "In a take-away, which number is the whole?",
    "content": {"example": "6,400 − ___ = 2,900"},
    "modellingState": "Live-complete helper",
    "representationRefs": LIVE,
    "misconceptionRefs": ["mc-002"],
    "speakerNotes": {
        "script": "Say to children: Now you tell me. 6,400 take away something leaves 2,900. Which number did we start with? So which number is the whole? 6,400. Which part do we know? 2,900, the part that's left. So what do we take away from what? 6,400 take away 2,900. Work it out. You'll need an exchange in the hundreds. 3,500.",
        "teacherInfo": "9,300 means the child added 6,400 and 2,900 to undo the take-away: ask which number we started with, and whether the answer can be bigger than that.",
        "lookFor": None,
        "onTheBoard": "On the board: Write 6,400 in the whole bar and 2,900 in the left-hand part, write 6,400 − 2,900 = 3,500 under it, and write 3,500 in place of the ? and in the gap.",
    },
    "answer": {"kind": "exact", "content": "3,500", "acceptanceCondition": None, "delivery": "answer-slide"},
    "levels": BOARD_ONLY_OT,
})

# ---------------- your turn 2
u = ts[6]
common(u)
u.update({
    "label": "Your Turn",
    "minutes": 9,
    "unlocks": "Each child has found the whole of both kinds of sentence alone, mixed, which Zofia's two sentences in the Apply ask them to compare.",
    "thinking": "Is this an adding or a take-away sentence, so where is the whole, before I take anything away?",
    "content": {
        "activityArchitecture": "Six sentences mixed in no pattern: three adding (one with the missing part first) and three take-away, so the sign never tells a child where the whole is. Each is worked alone with a bar model the child draws and a column subtraction; four cross zeros or need an exchange. This is the main practice, and the worksheet can be done in its place.",
        "task": "2,300 + ___ = 5,900\n7,000 − ___ = 2,450\n___ + 3,725 = 8,000\n6,250 − ___ = 3,900\n1,980 + ___ = 4,500\n9,000 − ___ = 4,365",
    },
    "pupilInstruction": "Draw a bar model for each one.",
    "misconceptionRefs": ["mc-001", "mc-002"],
    "speakerNotes": {
        "script": "Say to children: Six on your own now, and they're mixed. Some are adding sentences and some are take-aways, so for each one, decide first: where's the whole? Then draw your bar model and take the part you know away from the whole.",
        "teacherInfo": "If printed: the worksheet goes out here, in place of these six. An adding answer bigger than the number after the = means the + sign was followed: ask which number the parts make together. A take-away answer bigger than the first number means the child added to undo it: ask which number we started with.",
        "lookFor": "Look for: the whole on top in every bar model; 3,725 and 4,365 as parts, not wholes; the zeros exchanged in 7,000, 8,000 and 9,000.",
    },
    "answer": {"kind": "exact", "content": "3,600\n4,550\n4,275\n2,350\n2,520\n4,635", "acceptanceCondition": None, "delivery": "answer-slide"},
    "doMode": "deeper",
    "levels": {"printed": None, "boardOnlyBecause": "Short sentences children set out in their own bar models and columns; the worksheet is the printed option, done in this Your Turn's place.", "realThings": None},
})

# ---------------- apply
e = d["ending"]
e["reason"] = ("The Apply asks something the Your Turns did not: children compare two sentences with different signs and decide whether they "
               "are the same bar model, which is the lesson's idea that the sign does not decide the job. A child who follows the + sign gets "
               "8,750 for the first and says no; a child who finds the whole in each says yes. The claim is right, so it cannot be answered no "
               "by habit, and it needs nothing beyond the two kinds of sentence practised in the second Your Turn.")
b = e["beat"]
common(b)
b.update({
    "label": "Apply",
    "minutes": 5,
    "unlocks": None,
    "thinking": "Are the whole and the part I know the same in both sentences?",
    "content": {"activity": "Zofia says: \"2,750 + ___ = 6,000 and 6,000 − ___ = 2,750 have the same missing number.\"\nIs Zofia correct? Explain your answer.\nDraw a bar model for each one."},
    "successCriteriaRefs": ["sc-001"],
    "misconceptionRefs": ["mc-001"],
    "speakerNotes": {
        "script": "Say to children: Here's Zofia. She's looked at two number sentences, an adding one and a take-away one, and she says they have the same missing number. Is Zofia correct? Don't decide from the signs. Draw a bar model for each one, find each missing number, then decide. Then explain how you know, in a sentence or two.",
        "teacherInfo": "Zofia is right: both bar models have 6,000 as the whole and 2,750 as the part known, so both missing numbers are 3,250. A no with 8,750 for the first sentence means the child followed the + sign: ask which number the parts make together. A yes with no bar models or numbers has not shown why: ask what the whole is in each.",
        "lookFor": "Look for: 6,000 on top of both bar models; 3,250 twice; a reason that names the whole and the part.",
    },
    "answer": {
        "kind": "model",
        "content": "Yes, Zofia is correct. In both sentences 6,000 is the whole and 2,750 is the part we know, so they have the same bar model. The missing part in both is 6,000 − 2,750 = 3,250.",
        "acceptanceCondition": "Accept yes with both missing numbers worked as 3,250, or yes with the reason that both sentences have 6,000 as the whole and 2,750 as a part. A yes from noticing the same numbers, without finding the missing part or naming the whole, is not enough.",
        "delivery": "answer-slide",
    },
    "doMode": "deeper",
})

# ---------------- worksheet
def part(pid, prompt, ans):
    return {
        "id": pid, "pupilPrompt": prompt, "responseForm": "complete-the-model", "responseFormReason": None,
        "response": "The gap in the number sentence, large enough for a 4-digit number; the child draws their own bar model and columns to work it out.",
        "support": "", "visualRequirements": "", "representationRefs": [], "stickyKnowledgeRefs": [], "photoRefs": [],
        "answer": {"kind": "exact", "content": ans, "acceptanceCondition": None, "delivery": "teacher-only"},
    }

w = d["worksheet"]
w.update({
    "taskUnitId": None,
    "activityArchitecture": {
        "coreActionAndEvidence": "A many-goes objective: children find missing parts in number sentences, drawing their own bar models. The five sentences are the evidence of the method, mixed adding and take-away with the missing part in different places, so each child finds the whole every time before subtracting. Zara's claim tests whether a child follows the + sign, and the bottle-top problem tests finding the whole and the part in a sentence of words.",
        "amount": "Five sentences, one reasoning question and one problem: seven missing parts found, plus one judgement.",
        "variationAndBoundaryPlan": "Opens in the board's form: bare sentences like the Your Turns, mixed in no pattern, three adding (one with the missing part first) and two take-away, three crossing zeros. No number repeats a slide sentence. Zara's claim is wrong, after Zofia's right one on the board, so the claims stay mixed. The problem is one step whose whole is said in the words (2,000), so it moves the same maths into a context.",
        "organisation": "Fluency first (the five sentences under one task line), then Reasoning (Zara's claim), then Problem Solving (the bottle tops), each standing on its own.",
    },
    "sheetShape": {"kind": "question-set", "reason": "A maths question set: fluency in the board's form, then one reasoning question and one problem."},
    "demand": "It replaces the second Your Turn for children who use it: they do the sheet in its place, and the Apply stays whole class at the end.",
    "stickyKnowledgeRefs": [],
    "fitPriority": {
        "protected": [
            "the five number sentences, mixed adding and take-away",
            "Zara's claim, the sheet's one retest of following the + sign",
            "the bottle-top problem",
        ],
        "preAuthorisedRemoval": [],
    },
    "centralWriteOnVisualException": None,
    "contentBlocks": [
        {
            "id": "ws-qg-001", "kind": "question-group",
            "groupPrompt": "Find the missing number.\n- Draw a bar model for each one.",
            "representationRefs": [], "stickyKnowledgeRefs": [], "photoRefs": [],
            "parts": [
                part("ws-qg-001-part-01", "1,350 + ___ = 4,800", "3,450"),
                part("ws-qg-001-part-02", "8,500 − ___ = 3,200", "5,300"),
                part("ws-qg-001-part-03", "___ + 2,475 = 7,000", "4,525"),
                part("ws-qg-001-part-04", "6,000 − ___ = 1,825", "4,175"),
                part("ws-qg-001-part-05", "3,640 + ___ = 9,000", "5,360"),
            ],
        },
        {
            "id": "ws-q-001", "kind": "question",
            "pupilPrompt": "Zara says: \"In ___ + 3,200 = 7,500, I add 3,200 and 7,500, because there's a + sign.\"\nIs Zara correct? Explain your answer.",
            "responseForm": "written-explanation",
            "responseFormReason": "The reason is the evidence: it shows whether the child finds the whole before choosing what to do, which a yes or no would not.",
            "response": "Room for a verdict and a reason in two or three lines; the child may draw a bar model to check.",
            "support": "", "visualRequirements": "", "representationRefs": [], "stickyKnowledgeRefs": [], "photoRefs": [],
            "answer": {
                "kind": "model",
                "content": "No, Zara isn't correct. 7,500 is the whole, because it's after the =. 3,200 is the part we know, so the missing part is 7,500 − 3,200 = 4,300. If you add them you get 10,700, which is bigger than the whole.",
                "acceptanceCondition": "Accept no with the missing part worked as 4,300, or no with the reason that 7,500 is the whole so the part must be smaller than it.",
                "delivery": "teacher-only",
            },
        },
        {
            "id": "ws-q-002", "kind": "question",
            "pupilPrompt": "Oak Class want to collect 2,000 bottle tops. So far they have collected 1,265.\nHow many more bottle tops do they need?",
            "responseForm": "short-answer", "responseFormReason": None,
            "response": "An answer line; the child draws their own bar model and columns to work it out.",
            "support": "", "visualRequirements": "", "representationRefs": [], "stickyKnowledgeRefs": [], "photoRefs": [],
            "answer": {"kind": "exact", "content": "735 bottle tops", "acceptanceCondition": "Accept 735.", "delivery": "teacher-only"},
        },
    ],
    "answerKeyMode": "required",
})

d["resourceOpportunities"] = {
    "stickIn": {"decision": "none", "sourceUnitIds": [], "reason": "Every response is a bar model and a column subtraction children draw for themselves, which a Year 4 class makes in books, or a sentence about Zofia's claim; no child writes on a printed figure and nothing is sorted."},
    "workingWall": {"decision": "candidate", "sourceUnitIds": ["lesson-section/teaching-sequence/unit-001", "lesson-section/teaching-sequence/unit-002"], "reason": "The How to find a missing part list and the bar model of a whole over two parts are what lessons 36 and 37 keep using; the finished 1,240 + 2,620 = 3,860 is the wall's worked example."},
}
d["slideDesignNotes"] = []
d["flagsForTeacher"] = []

p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

pp = WD / "photo-requirements.json"
ph = json.loads(pp.read_text(encoding="utf-8"))
ph["lesson_name"] = "Find a missing part"
pp.write_text(json.dumps(ph, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("filled", "__LESSON_DESIGN_FILL__" in p.read_text(encoding="utf-8"))
