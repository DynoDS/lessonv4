import json, pathlib

W = pathlib.Path(r"C:/Users/Daniel/Projects/lessonv4/evaluations/techniques-2026-11-03/geography3")
LD = W / "lesson-design.json"
PR = W / "photo-requirements.json"
d = json.loads(LD.read_text(encoding="utf-8"))
p = json.loads(PR.read_text(encoding="utf-8"))

U = "lesson-section/teaching-sequence/unit-%03d"
NONE_ANSWER = {"kind": "none", "content": None, "acceptanceCondition": None, "delivery": "none"}

ORIENT = ("Teacher orientation: Children find out who lives in the Amazon rainforest and how Indigenous peoples use the river "
          "and the forest around them, then write a description of how a new village uses the rainforest, using its photograph. "
          "The tricky move is why villages sit beside rivers: the river is their water, their fish and their only road, because "
          "there are no roads through the thick forest. It is taught in \"Why build a village by the river?\" and tested straight "
          "after in \"Where would you build a new home?\", where B, deep in the trees, pulls children who think the river is dangerous. "
          "From the slides: the map task runs on the board, with pairs saying A or B and what would be hard at the other place. "
          "To print: the photograph with A and B, one between two, and the worksheet, which is the final task printed and replaces it.")

d["lesson"].update({
    "lo": "To describe how Indigenous peoples use the Amazon rainforest",
    "displayedLo": "To describe how Indigenous peoples use the Amazon rainforest",
    "durationMinutes": 45,
    "stickingPoint": "Children picture life in the rainforest as their own without the shops and roads, so they cannot see why villages sit beside rivers: there, the river is the water, the food and the only road.",
})
d["teacherOrientation"] = ORIENT

s = d["starter"]
s.update({
    "label": "Rainforest layers and the Amazon",
    "minutes": 5,
    "unlocks": "They have the four layers and South America back in mind; the emergent layer is used again in the forest Teach, with the Brazil nuts.",
    "thinking": "Which layer comes where, from the tallest trees down to the ground?",
    "content": {
        "activity": "Name each layer of the rainforest, from the top down.\n\nWhich continent is the Amazon rainforest in?",
        "connection": "Retrieves lesson 2's four layers and lesson 1's continent, so the village the lesson turns to sits inside a forest the class already pictures.",
        "format": "Label a diagram from memory, then one recall question.",
    },
    "pupilInstruction": None,
    "taskStructure": None,
    "modellingState": None,
    "representationRefs": [{"ref": "rep-001", "configuration": "starter-blank", "interaction": "pupil-uses"}],
    "successCriteriaRefs": [], "stickyKnowledgeRefs": [], "misconceptionRefs": [], "photoRefs": [],
    "speakerNotes": {
        "script": "Say to children: Let's start back in the rainforest from last lesson. Here it is, cut through from the very top of the tallest trees right down to the ground. Can you name each layer, from the top down? Then tell me which continent the Amazon rainforest is in. Have a go at both before we check. ... Let's see. Right at the top, poking out above everything else, the emergent layer. Then the thick canopy, like a roof of leaves. Then the dark understorey. Then the forest floor. And the Amazon is in South America. Keep the emergent layer in your head, those giant trees at the very top. They're coming back today.",
        "teacherInfo": None,
        "lookFor": None,
    },
    "answer": {"kind": "exact", "content": "Emergent layer, canopy, understorey, forest floor\nSouth America", "acceptanceCondition": None, "delivery": "answer-slide"},
})

d["vocabulary"] = [{
    "id": "vocab-001",
    "sourceUnitId": "lesson-section/vocabulary/unit-001",
    "term": "Indigenous peoples",
    "definition": "Indigenous peoples are the groups of people whose families were the first to live in a place, long before anyone else arrived.",
    "visual": {"kind": "photo", "photoRef": "photo-002"},
}]
d["trimmedVocabulary"] = [{"term": "deforestation", "reason": "Lesson 4 teaches how the rainforest is changing; today nothing is cut down, so the word has no job."}]

d["representations"][0].update({
    "name": "Rainforest cross-section",
    "purpose": "Bring back last lesson's four layers, top to bottom, so the village sits inside a forest the class already pictures.",
})
d["representations"][0]["configurations"][0].update({
    "description": "The four layers drawn as stacked bands with their trees, the layer names left off and a blank label line beside each band, for children to name from memory.",
    "requiredFeatures": [
        "the four layers drawn as stacked bands, top to bottom: emergent layer, canopy, understorey, forest floor",
        "no layer names printed: a blank label line beside each band",
    ],
})
d["representations"][1].update({
    "name": "The forest from above, with two places marked",
    "purpose": "Children judge two places for a family's new home by what the river gives them.",
})
d["representations"][1]["configurations"][0].update({
    "description": "The aerial photograph of rainforest with a river (photo-006), with two lettered dots placed on it by the labelled-diagram helper.",
    "requiredFeatures": [
        "the aerial photograph of thick rainforest with one river winding through it",
        "a dot labelled \"A\" on the bank of the river",
        "a dot labelled \"B\" in thick forest, a long way from the river",
        "no other labels, names or marks",
    ],
})

d["successCriteria"][0].update({
    "type": "steps",
    "drawLive": False,
    "content": {"steps": [
        "Say what {{Indigenous peoples}} get from the <<river>>, and what they use it for.",
        "Say what they get from the <<forest>>, and what they use it for.",
        "Say what you can see in the photo that shows it.",
    ]},
})
d["stickyKnowledge"][0]["text"] = "Many Indigenous villages are built next to rivers, because the river gives them water, fish and a way to travel."

d["misconceptions"][0].update({
    "belief": "Indigenous peoples of the Amazon all live the same old-fashioned way, or lived long ago and are not there now.",
    "correctiveFact": "Hundreds of different Indigenous groups live in the Amazon today, in different ways: in villages, in towns and in the city of Manaus.",
    "strategy": "Refused on the first Teach board, with the village and the city both shown, in the words the class hears.",
    "reason": "It is the picture children arrive with from stories, and one riverside village taught on its own would confirm it, so it gets one clean touch and the final description asks about Indigenous peoples in general.",
})
d["misconceptions"][1].update({
    "belief": "You need roads and shops to get what you need, so a home deep in the trees is as good as one by the river, or safer.",
    "correctiveFact": "There are no roads through most of the forest, so the river is the road, and it also gives water and fish.",
    "strategy": "Named in the river Teach, tested in the two-places task with B deep in the trees, and met again in the final description's river step.",
    "reason": "It is the gap that stops a child seeing why villages are where they are, the one piece of geographical reasoning the description rests on.",
})

ts = d["teachingSequence"]

ts[0].update({
    "label": "Who lives in the Amazon rainforest?",
    "minutes": 5,
    "unlocks": "They know Indigenous peoples have lived in the Amazon for over 10,000 years, in many ways, which the list of needs and the final description build on.",
    "thinking": "Who were the first people to live in this forest, and do they all live the same way?",
    "content": {
        "headline": "People live in the Amazon rainforest too, and they have for more than 10,000 years.",
        "explanation": "The people in this village are one of the Amazon's Indigenous peoples. Their families were here first, long before anyone else arrived.\nThere are hundreds of different Indigenous groups in the Amazon, and they don't all live the same way. Some live in villages like this one. Some live in towns, or in Manaus, a big city in the forest.",
        "takeaway": None,
        "teachingText": None,
        "keyQuestions": ["What can you see that tells you people live here?"],
    },
    "pupilInstruction": None, "taskStructure": None, "modellingState": None,
    "representationRefs": [], "successCriteriaRefs": [], "stickyKnowledgeRefs": [],
    "misconceptionRefs": ["mc-001"],
    "photoRefs": ["photo-001", "photo-003"],
    "speakerNotes": {
        "script": "Say to children: Last lesson we climbed up through the layers of the rainforest: the giant emergent trees, the thick canopy, the dark understorey and the forest floor. Lots of animals live up there. But here's something you might not expect. People live in the Amazon rainforest too. Look at this photo. What can you see that tells you people live here? ... Houses, a path down to the water, maybe a boat. This village is in a clear space in the forest, right beside a river. The people who live here are Indigenous people. Remember, Indigenous peoples are the groups of people whose families were the first to live in a place, long before anyone else arrived. In the Amazon, that's more than 10,000 years ago. That's twice as long ago as when people started building Stonehenge. And Indigenous peoples still live in the Amazon today. There are hundreds of different Indigenous groups there, and they don't all live the same way. Some live in villages like this one. Some live in towns. And look at this. This is Manaus, a big city right in the middle of the forest, where about two million people live, and some of them are Indigenous people too. So there isn't just one way to live as an Indigenous person in the Amazon.",
        "teacherInfo": "A child who says Indigenous people \"lived in the olden days\" has only met them in stories: point at the photograph of Manaus and say that Indigenous people live there today too, in villages, in towns and in the city. Manaus is said ma-NOWSS.",
        "lookFor": None,
    },
    "answer": NONE_ANSWER,
})

ts[1].update({
    "label": "What would you need if you lived here?",
    "minutes": 3,
    "unlocks": "The class has its own list of needs (water, food, a home, getting about, medicine), which the river Teach and the forest Teach answer item by item.",
    "thinking": "With no shop nearby, what would this family need every day, and where around them could it come from?",
    "content": {
        "activity": "Pairs imagine living in the village in the photograph, a long boat ride from any shop, list what they would need every day and point to where in the photograph each could come from; the teacher writes the class's list on the board.",
        "format": None,
        "task": "Imagine your family lives in this village. The nearest shop is a long boat ride away.\n\nWhat would you need every day?\n\nWhere around you could you get it?",
    },
    "pupilInstruction": None, "taskStructure": None, "modellingState": None,
    "representationRefs": [], "successCriteriaRefs": [], "stickyKnowledgeRefs": [],
    "misconceptionRefs": ["mc-002"],
    "photoRefs": ["photo-001"],
    "speakerNotes": {
        "script": "Say to children: Let's go back to the village. Imagine your family lives here. There's no shop at the end of the road. In fact, there isn't even a road. The nearest shop is a long boat ride away. With your partner, think about what you would need every single day. Then look at the photo: where around you could you get each thing? ... Let's make our list together. Water. Food. Somewhere to live. A way to get about. And what if somebody got ill? Medicine. We're going to keep this list, because the rest of the lesson finds out where each of these things comes from.",
        "teacherInfo": "Write the class's list on the board in the children's own words and keep it up: the river Teach and the forest Teach tick it off. A child who says \"the shop\" or \"a car\" is picturing their own street: ask how far away the shop is, and what is right next to the village instead.",
        "lookFor": None,
    },
    "answer": {
        "kind": "model",
        "content": "Water to drink: the river.\nFood: fish from the river, fruit and nuts from the trees, food we grow.\nA home: wood and leaves from the trees.\nA way to get about: a boat on the river.\nMedicine when someone is ill: plants.",
        "acceptanceCondition": "Any sensible needs. Water, food, a home and a way to get about should be on the class list; medicine may need a nudge (what if someone got ill?). Where it comes from can be a guess from the photograph at this point.",
        "delivery": "teacher-only",
    },
    "doMode": "quick",
    "levels": {"printed": None, "boardOnlyBecause": "Pairs say their list and the teacher writes the class's list on the board, so a sheet would only reprint the photograph.", "realThings": None},
    "use": {
        "develops": "Reading a photograph of a place for what it could give the people who live there, the link between people and place that the whole lesson describes.",
        "new": "The nearest shop is a long boat ride away.",
        "wrong": "We'd buy our food and water at the shop, and use a car to get about.",
        "rehearsal": None, "practice": None,
    },
})

ts[2].update({
    "label": "Why build a village by the river?",
    "minutes": 5,
    "unlocks": "They know the river gives water, fish and the only road, which the two-places task uses on a new photograph and the final description says about the river.",
    "thinking": "Why would a family choose to live right next to the river?",
    "content": {
        "headline": "Look where this village is: right on the bank of the river.",
        "explanation": "The river gives them water to drink, to cook with and to wash in.\nIt's full of fish to catch and eat.\nThere are no roads through most of the forest, because the trees grow too thick. So the river is their road, for canoes and small boats.",
        "takeaway": {"kind": "sticky", "ref": "sk-001"},
        "teachingText": None,
        "keyQuestions": ["Why do you think they built their village right here?"],
    },
    "pupilInstruction": None, "taskStructure": None, "modellingState": None,
    "representationRefs": [], "successCriteriaRefs": [], "stickyKnowledgeRefs": ["sk-001"],
    "misconceptionRefs": ["mc-002"],
    "photoRefs": ["photo-001", "photo-005", "photo-004"],
    "speakerNotes": {
        "script": "Say to children: Lots of you said water first. Look where this village is: right on the bank of the river. Why do you think they built their village right here? ... You're right that the river gives them water, to drink, to cook with and to wash in. But it gives them more than that. It's full of fish to catch and eat. In fact, the Amazon has more kinds of fish than any other river in the whole world. And here's the one people don't usually think of. There are no roads through most of the forest, because the trees grow too thick. You couldn't drive a car through it. So the river is their road. People paddle canoes, which are long thin boats, or drive small boats with engines, to go fishing, to visit other villages and to get to the towns. That's why so many Indigenous villages are built next to rivers: the river gives them water, fish and a way to travel. Look at our list. Water, food, a way to get about. The river gives them three things on it already.",
        "teacherInfo": "A child who thinks living by the river is dangerous is picturing rivers at home: say that for these villages the river is the tap, the food and the road all at once. If asked: the river rises in the rainy season, so many riverside houses are built on higher banks or on stilts.",
        "lookFor": None,
    },
    "answer": NONE_ANSWER,
})

ts[3].update({
    "label": "Where would you build a new home?",
    "minutes": 6,
    "unlocks": "They can say what a home away from the river would lack (water, fish, a way to travel), which the final description uses to say why the village is by the river.",
    "thinking": "What would this family be missing if they lived away from the river?",
    "content": {
        "activity": "Pairs look at a photograph of the forest from above with two places marked, choose the better place for a family's new home and work out what would be hard at the other; on the printed copy they ring their place and write the hard things beside the other.",
        "format": "Mark a photograph: ring the better place, and write beside the other what would be hard there.",
        "task": "Which place would be better for their home, A or B?\n\nWhat would be hard for them at the other place?",
    },
    "pupilInstruction": "Geographers work out why people live in one place and not another. This photograph shows the forest from above. A family wants to build a new home here.",
    "taskStructure": None, "modellingState": None,
    "representationRefs": [{"ref": "rep-002", "configuration": "two-places", "interaction": "pupil-uses"}],
    "successCriteriaRefs": [], "stickyKnowledgeRefs": [],
    "misconceptionRefs": ["mc-002"],
    "photoRefs": ["photo-006"],
    "speakerNotes": {
        "script": "Say to children: Here's a new photo. It's part of the rainforest, taken from high up in the sky, and you can see a river winding through the trees. I've marked two places. A is on the bank of the river. B is deep in the forest, a long way from the river. A family wants to build a new home in this part of the forest. With your partner, decide: which place would be better for their home, A or B? Then the harder part: what would be hard for them at the other place? Get ready to tell me at least one thing.",
        "teacherInfo": "If printed: the photograph with A and B, one between two, as the task is set, for pairs to ring a place and write beside the other. Without it, pairs say A or B and what would be hard at the other place. A child who chooses B because \"the river is dangerous\" is thinking of rivers at home: ask where the family would get their water, and how they would get to the next village.",
        "lookFor": "Look for: water, fish and travel named as what B would lack, not just \"it's far away\".",
    },
    "answer": {
        "kind": "model",
        "content": "A is better, on the bank of the river.\nAt B they would have to carry all their water a long way, they couldn't catch fish easily, and they'd have no river to travel on, so they'd have to push through thick forest to get anywhere.",
        "acceptanceCondition": "A, with at least one thing that would be hard at B that comes from what the river gives: water, fish or a way to travel. Accept \"there's no road at B\" as the travel reason. B because \"the river is dangerous\" or \"there are more trees for building\" shows the river's jobs are missing.",
        "delivery": "teacher-only",
    },
    "doMode": "deeper",
    "levels": {
        "printed": {"form": "figure", "per": "pair", "what": "The photograph with A and B, for pairs to ring the better place and write beside the other what would be hard there."},
        "boardOnlyBecause": None, "realThings": None,
    },
    "use": {
        "develops": "Geography's why here and not there: weighing two places for what the river gives a community, on a photograph the lesson has not shown.",
        "new": "This photograph shows the forest from above.",
        "wrong": "B, because the river is dangerous, and there are more trees there to build houses with.",
        "rehearsal": None, "practice": None,
    },
})

ts[4].update({
    "label": "What does the forest give them?",
    "minutes": 6,
    "unlocks": "They know the forest gives homes, food and medicine, which is the second half of the final description of a new village.",
    "thinking": "Where in the forest does each thing this family needs come from?",
    "content": {
        "headline": "The forest gives Indigenous peoples their homes, much of their food and their medicine.",
        "explanation": "Look at this house. The posts are tree trunks, and the roof is made of big palm leaves woven together, so the rain runs off.\nBrazil nut trees grow right up into the emergent layer. Their hard pods fall to the forest floor, and people collect the nuts inside.\nWhen someone is ill, there's no chemist nearby. Over thousands of years, Indigenous peoples have learned which plants help, and they make medicine from them.",
        "takeaway": None,
        "teachingText": None,
        "keyQuestions": ["What is this house made from?"],
    },
    "pupilInstruction": None, "taskStructure": None, "modellingState": None,
    "representationRefs": [], "successCriteriaRefs": [], "stickyKnowledgeRefs": [],
    "misconceptionRefs": [],
    "photoRefs": ["photo-007", "photo-008", "photo-009"],
    "speakerNotes": {
        "script": "Say to children: The river gives them water, fish and a road. But look at what's left on our list: a home, more food, and medicine for when someone's ill. Those come from the forest. Look at this house. What is it made from? ... The posts are tree trunks, and the roof is made of big palm leaves, woven together so the rain runs off. Everything in this house came from the forest around it. Now food. Remember the emergent layer from our starter, the giant trees right at the top? Brazil nut trees grow right up into it. Their pods are hard and round, about the size of a grapefruit, and when they're ready they fall all the way down to the forest floor. People collect them and crack them open, and inside are the nuts. They also clear small gardens in the forest to grow food, like cassava, a root a bit like a potato. And medicine. If you feel ill, you can go to the chemist or the doctor. In the rainforest there's no chemist nearby. But over thousands of years, Indigenous peoples have learned which plants help when someone is ill, and they make medicine from them. Some medicines people use all over the world first came from rainforest plants. So the forest gives Indigenous peoples their homes, a lot of their food and their medicine. Look at our list now. Every single thing on it comes from the river or the forest.",
        "teacherInfo": None,
        "lookFor": None,
    },
    "answer": NONE_ANSWER,
})

MODEL = ("Indigenous peoples like the people in this village live next to the river. It gives them water to drink and fish to eat, "
         "and they travel along it by canoe. I can see the river right next to their houses.\n"
         "They use the forest too. They build their homes from wood and leaves, and they make medicine from plants.")

ts[5].update({
    "label": "How do Indigenous peoples use the Amazon rainforest?",
    "minutes": 12,
    "unlocks": None,
    "thinking": "What does this village get from the river and from the forest, and what do they use each thing for?",
    "content": {
        "activity": "Each child writes a description of how Indigenous peoples use the Amazon rainforest, using the photograph of a new village: what they get from the river and the forest, what they use it for, and what in the photograph shows it.",
        "format": "A written description, said to a partner first and then written.",
        "task": "How do Indigenous peoples use the Amazon rainforest?",
        "launch": {
            "established": "Here's a different village, beside another river in the Amazon.",
            "goodLooksLike": {
                "strong": {"words": MODEL, "show": None},
                "weak": {"words": "They live in the rainforest. They have houses and a river. They eat food.", "show": None},
                "difference": "The strong one says what they get from the river and the forest, and what they use it for.",
            },
            "steps": [],
        },
        "reasoningWords": ["river", "forest", "because", "so"],
        "rehearsal": {
            "sayIt": "Tell your partner one thing this village gets from the river and one thing it gets from the forest.",
            "partnerAsks": "What do they use it for?",
        },
    },
    "pupilInstruction": "Use the photograph and the steps to help you write your description.",
    "taskStructure": None, "modellingState": None,
    "representationRefs": [], "successCriteriaRefs": ["sc-001"], "stickyKnowledgeRefs": [],
    "misconceptionRefs": [],
    "photoRefs": ["photo-010"],
    "speakerNotes": {
        "script": "Say to children: Here's a different village, beside another river in the Amazon. We're going to describe how the people here use the rainforest. First, two descriptions. Read them with me. ... Both of them are true. But look at the second one. It says they have houses and a river, and then it stops. It never says what the river gives them, or what the houses are made from. Now look at the first one. It says what they get from the river and what they use it for: water to drink, fish to eat, a road to travel on. Then it does the same for the forest. And it points at something in the photo: the river right next to their houses. Right, I'm taking them both away. Now it's your turn. How do Indigenous peoples use the Amazon rainforest? First, tell your partner one thing this village gets from the river and one thing it gets from the forest. Partners, ask them: what do they use it for? Then write yours. Use the photo and the steps to help you.",
        "teacherInfo": "If printed: the worksheet is this task on a sheet, with the same photograph. Hand it out once the two models are off the board. Without it, children write from the photograph and the steps on the board. A child who writes only about the river has half of it: point at the houses and ask what they are made from.",
        "lookFor": "Look for: each thing linked to what it is for. If a child writes \"They have a river\", ask what the river gives them.",
    },
    "answer": {
        "kind": "model",
        "content": MODEL,
        "acceptanceCondition": "Accept any description that says at least two things Indigenous peoples get from the river and at least two from the forest, each with what it is used for, and names something visible in the photograph. Written with a good one in mind: the model was shown first and then taken off the board.",
        "delivery": "answer-slide",
    },
    "doMode": "deeper",
    "levels": {
        "printed": {"form": "task", "per": "child", "what": "The worksheet: the photograph of the new village, the question and lines to write the description on."},
        "boardOnlyBecause": None, "realThings": None,
    },
})

d["ending"]["reason"] = "The final description already draws together who Indigenous peoples are, the river and the forest on a new village, so an Apply would only ask the same thing again."

ws = d["worksheet"]
ws.update({
    "taskUnitId": U % 6,
    "activityArchitecture": {
        "coreActionAndEvidence": "A one-answer objective: describing how Indigenous peoples use the rainforest shows in one written description, so the sheet is the lesson's final task printed, with the same photograph and question, and it replaces the slide task.",
        "amount": "One description of about four to six sentences, written from the photograph.",
        "variationAndBoundaryPlan": "Below and Greater Depth answer the same question with more or less help, decided by the adaptation designer.",
        "organisation": "The photograph of the village at the top, the question under it with the words to use beside it, then lines to write on.",
    },
    "demand": "It replaces the final task: children write their description on the sheet instead of from the board.",
    "stickyKnowledgeRefs": [],
    "fitPriority": {
        "protected": ["the photograph of the riverside village", "the question and room for a description of about six lines"],
        "preAuthorisedRemoval": ["the words to use (they are on the board while children write)"],
    },
    "centralWriteOnVisualException": None,
    "contentBlocks": [{
        "id": "ws-q-001",
        "kind": "question",
        "pupilPrompt": "How do Indigenous peoples use the Amazon rainforest?",
        "responseForm": "written-explanation",
        "responseFormReason": "The description is the evidence: only the child's own sentences show whether they link what the river and the forest give to what it is used for.",
        "response": "A short description, with room for about six lines of a child's handwriting.",
        "support": "Words to use: river, forest, because, so",
        "visualRequirements": "The photograph of the riverside village above the question, as the board shows it.",
        "representationRefs": [],
        "stickyKnowledgeRefs": [],
        "photoRefs": ["photo-010"],
        "answer": {
            "kind": "model",
            "content": MODEL,
            "acceptanceCondition": "Accept any description that says at least two things Indigenous peoples get from the river and at least two from the forest, each with what it is used for, and names something visible in the photograph.",
            "delivery": "teacher-only",
        },
    }],
    "answerKeyMode": "required",
})
ws["sheetShape"]["reason"] = "A single written question that works from one photograph."

d["resourceOpportunities"] = {
    "stickIn": {"decision": "candidate", "sourceUnitIds": [U % 4], "reason": "The photograph with A and B is a figure pairs ring a place on and write beside, printed one between two."},
    "workingWall": {"decision": "candidate", "sourceUnitIds": [U % 3, U % 5], "reason": "What the river and the forest give Indigenous communities is a reference the unit comes back to when it turns to how the rainforest is changing."},
}
d["vocabularyIntroductions"] = [{
    "vocabularyRefs": ["vocab-001"],
    "after": "lesson-section/starter/unit-001",
    "script": "Say to children: Here's a word that's coming up in a minute: Indigenous peoples. Indigenous peoples are the groups of people whose families were the first to live in a place, long before anyone else arrived. These are Indigenous people who live in the Amazon rainforest today. You'll meet the word properly in a moment, in their forest, so don't worry about remembering it yet.",
}]
d["slideDesignNotes"] = []
d["flagsForTeacher"] = [
    "Left for lesson 4, which teaches how rainforests are changing: the plan's comparison of the 2012 and 2019 maps, the talk about who is cutting the forest down and the closing look at further changes. The 360 video is replaced by photographs.",
    "Taught at the board's pace, asking the class about each line, this lesson runs about 51 minutes. Most of that is the final description: two model descriptions read together, partner talk, then about seven minutes of writing, which is the lesson's main evidence. The teaching before it was trimmed to the sentences that carry each because.",
    "The starter asks for the layers as emergent layer, canopy, understorey and forest floor. Lesson 2 is being redesigned at the same time, so check these are the words it teaches.",
]

# ---------- photos ----------
TR = "no readable text, labels, logos or branding"
def real(pid, fname, subject, cons, teach, ev, use, note):
    return dict(id=pid, subject=subject, pedagogical_constraint=cons, teaching_requirement=teach,
                load_bearing_evidence=ev, use=use, essential=True, filename=fname,
                acquisition_mode="authentic-real", source_profile="wikimedia-then-unsplash",
                fallback_action="unsatisfied", fallback_note=note, generation_prompt=None,
                coherent_group=None, coherent_mode="none", coherent_visual_invariants=[])
def ordinary(pid, fname, subject, cons, teach, ev, use, state, avoid, comp):
    return dict(id=pid, subject=subject, pedagogical_constraint=cons, teaching_requirement=teach,
                load_bearing_evidence=ev, use=use, essential=True, filename=fname,
                acquisition_mode="ordinary-real", source_profile="unsplash-then-wikimedia",
                fallback_action="ai", fallback_note=None,
                generation_prompt=dict(physical_state=state, must_avoid=avoid, text_rule=TR, composition=comp),
                coherent_group=None, coherent_mode="none", coherent_visual_invariants=[])

p["lesson_name"] = "Who lives in the rainforest?"
p["photos"] = [
    real("photo-001", "wikimedia/amazon-indigenous-village-by-river.jpg",
         "An Indigenous village in the Amazon rainforest, in a clearing right beside a river, with its houses and the forest all around",
         "This is the village the lesson starts from and comes back to: the river must be right beside the houses, because the class is asked why the village was built there.",
         "Children see that people live in the rainforest, in a village beside a river, and use it to think about what a family would need and where it could come from.",
         ["houses of a village", "a river right beside the village", "rainforest trees around it"], "slide",
         "A made picture would invent how a real Indigenous community lives, which is the stereotype this lesson works against; without a real photograph the slides teach from the words."),
    real("photo-002", "wikimedia/amazon-indigenous-people-everyday.jpg",
         "Indigenous people of the Amazon in their own village today, on an ordinary day, for example a family together or children by the river",
         "Shown on the word card for Indigenous peoples: real people living their own everyday lives today, not people posed in costume for visitors.",
         "Children see that Indigenous peoples are real people who live in the Amazon now.",
         ["Indigenous people of the Amazon", "an everyday scene in their own village"], "slide",
         "A made picture of Indigenous people would invent how a real people look and live; without a real photograph the card shows the word on its own."),
    real("photo-003", "wikimedia/manaus-city-from-above.jpg",
         "The city of Manaus in Brazil, in the middle of the Amazon rainforest, seen from above with its tall buildings and the wide river beside it",
         "This shows that people also live in a big city in the rainforest, so it must look like a large modern city.",
         "Children see that not everyone in the Amazon lives in a village: some live in towns and in this big city.",
         ["many tall buildings of a large city", "a wide river beside the city"], "slide",
         "A made Manaus would be a lie about a real city; without a real photograph the slide says it in words beside the village."),
    ordinary("photo-004", "unsplash/amazon-river-canoe.jpg",
             "A wooden canoe or small boat with people travelling along a river in the Amazon rainforest, with forest on both banks",
             "This shows the river being used as a road through the forest, so the boat must be travelling along the river with forest on the banks.",
             "Children see that people travel by boat along the river because there are no roads through the forest.",
             ["a canoe or small boat on a river", "people in it, travelling", "rainforest on the banks"], "slide",
             "A long wooden canoe with two people paddling along a wide brown river, thick green rainforest on both banks, daylight.",
             ["tourists in life jackets", "people posed in costume", "a road or bridge"],
             "A wide view of the river with the canoe clearly visible in the middle distance and the people small."),
    ordinary("photo-005", "unsplash/amazon-river-fishing.jpg",
             "A person fishing with a net or a line from a canoe or the bank of a river in the Amazon rainforest",
             "This shows the river giving the village its food, so the fishing must be clear.",
             "Children see that people catch fish in the river to eat.",
             ["a person fishing with a net or a line", "a river", "rainforest behind"], "slide",
             "A person standing in a canoe throwing a round fishing net over a calm brown river, with rainforest on the bank behind, daylight.",
             ["tourists", "people posed in costume", "a fishing boat with an engine filling the frame"],
             "A wide view with the person small and the net clearly visible over the water."),
    ordinary("photo-006", "unsplash/amazon-rainforest-river-aerial.jpg",
             "The Amazon rainforest seen from high above: thick, unbroken forest with one river winding through it, and no village, roads or clearings",
             "Two places are marked on it, one on the river bank and one deep in the trees, so it needs wide areas of forest a long way from the river, and no houses, roads or clearings that would decide the answer.",
             "Children judge where a family should build a home from where the river is.",
             ["thick unbroken rainforest seen from above", "one river winding through it", "large areas of forest well away from the river", "no houses, roads or clearings"], "slide",
             "Thick green rainforest seen from high above, with a single brown river winding across part of the picture and wide stretches of unbroken forest away from it.",
             ["houses or villages", "roads or cleared land", "more than one river"],
             "A top-down aerial view, landscape, with the river crossing one side and plenty of forest on the other."),
    ordinary("photo-007", "unsplash/amazon-house-palm-leaf-roof.jpg",
             "A house in an Amazon rainforest village with wooden posts and a roof made of palm leaves",
             "The board says the posts are tree trunks and the roof is woven palm leaves, so both must be clear.",
             "Children see that a home is built from wood and leaves from the forest around it.",
             ["a roof made of dried palm leaves", "wooden posts or walls", "rainforest trees nearby"], "slide",
             "A single house with a thick roof of dried palm leaves on wooden posts, standing in a clearing with rainforest trees behind, daylight.",
             ["a metal roof", "concrete walls", "people posed in costume"],
             "The whole house in view, from the side, with the roof and posts clear."),
    ordinary("photo-008", "unsplash/brazil-nut-pod-open.jpg",
             "A Brazil nut pod cracked open, showing the Brazil nuts packed inside",
             "The board says the pods fall from the tall trees and people collect the nuts inside, so the nuts inside must show.",
             "Children see the hard pod and the nuts people collect from it.",
             ["a round, hard, woody pod", "cracked open", "the nuts inside it visible"], "slide",
             "A round brown woody Brazil nut pod broken open on the forest floor, with the nuts in their shells packed inside.",
             ["nuts in a shop bag or packet", "a kitchen counter"],
             "A close-up of the open pod, filling most of the frame."),
    ordinary("photo-009", "unsplash/rainforest-plants-forest-floor.jpg",
             "Leafy green plants growing on the floor of the Amazon rainforest, the kind of plants people pick",
             "Shown beside the line about making medicine from plants: just plants growing in the forest, with no bottles, pills or a shop.",
             "Children see the forest plants that Indigenous peoples know how to make medicine from.",
             ["leafy green rainforest plants, close up", "growing in the forest"], "slide",
             "Close-up of leafy green plants with large leaves growing on a damp, shady rainforest floor.",
             ["medicine bottles or pills", "a shop or market stall", "flowers in a vase"],
             "A close view of the plants filling the frame."),
    real("photo-010", "wikimedia/amazon-village-river-second.jpg",
         "A different Indigenous village in the Amazon rainforest beside a river, seen from the river or from above, with its houses, the river bank and the forest behind",
         "Children describe how this village uses the rainforest from what they can see, so the river must be right beside the houses and the forest must be in view; it must be a different village from the one at the start of the lesson.",
         "Children describe how a village they have not seen uses the river and the forest, pointing at what the photograph shows.",
         ["houses of a village", "a river right beside the houses", "rainforest around or behind the village"], "both",
         "A made picture would invent how a real Indigenous community lives; without a real photograph the task is answered from what the lesson taught and the steps."),
]

LD.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PR.write_text(json.dumps(p, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("filled")
