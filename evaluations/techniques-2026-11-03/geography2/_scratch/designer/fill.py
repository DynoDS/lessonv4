import json, pathlib

W = pathlib.Path(r"C:/Users/Daniel/Projects/lessonv4/evaluations/techniques-2026-11-03/geography2")
LD = W / "lesson-design.json"
PR = W / "photo-requirements.json"
d = json.loads(LD.read_text(encoding="utf8"))
p = json.loads(PR.read_text(encoding="utf8"))

NONE_ANSWER = {"kind": "none", "content": None, "acceptanceCondition": None, "delivery": "none"}

d["lesson"].update({
    "lo": "To describe the layers of a tropical rainforest (biomes and vegetation)",
    "displayedLo": "To describe the layers of a tropical rainforest",
    "durationMinutes": 45,
    "stickingPoint": "Children think a tropical rainforest is the same all the way through: hot, wet and full of plants right down to the ground. In fact the canopy catches nearly all the sunlight, so each layer down is darker and different things grow in each one.",
})

d["teacherOrientation"] = (
    "Teacher orientation: Children find out that a tropical rainforest's vegetation grows in four layers, from the emergent trees at the top, "
    "through the canopy and the understorey, down to the forest floor, and that the canopy catches nearly all the sunlight, so the lower you go, "
    "the darker it gets. They spot emergent trees on a photo, sort five rainforest living things into the layers, predict what happens when a giant "
    "tree falls, then write a description of the canopy and the forest floor. The tricky move is the reason: the forest floor is dark because the "
    "canopy catches the light first, not just because it is at the bottom. It is taught in \"What is it like under the canopy?\" and used again in "
    "\"What happens under the hole?\". From the slides: the sort runs on the board, with pairs writing each living thing under its layer. "
    "To print: the sort sheet, one between two, and the worksheet, which is the final task printed and replaces it."
)

s = d["starter"]
s.update({
    "label": "Last lesson's rainforest",
    "minutes": 4,
    "unlocks": "They have the giant trees packed close together back in mind, which the first Teach turns into the roof of leaves called the canopy.",
    "thinking": "What do I remember about the Amazon from last lesson?",
    "content": {
        "activity": "What is a biome?\nWhich continent is the Amazon rainforest in?\nWhy can giant trees grow so close together there?",
        "connection": "Retrieves lesson 1 in its own words: biome, South America and the hot, rainy weather that lets giant trees grow close together, which today's first Teach builds the canopy from.",
        "format": "Three short recall questions answered from memory.",
    },
    "pupilInstruction": None, "taskStructure": None, "modellingState": None,
    "representationRefs": [], "successCriteriaRefs": [], "stickyKnowledgeRefs": [], "misconceptionRefs": [], "photoRefs": [],
    "speakerNotes": {
        "script": "Say to children: Let's get our rainforest brains working. Three questions about last lesson. Have a go at all three on your own before we check. ... Let's check. A biome is a big area of the world with its own kind of weather, and the plants and animals that suit it. The Amazon rainforest is in South America. And the last one is the one we need today: it's hot and rainy there all year, so the trees get all the warmth and water they need, and they grow huge, packed close together. Keep that picture of the giant trees in your head.",
        "teacherInfo": None, "lookFor": None,
    },
    "answer": {
        "kind": "exact",
        "content": "A big area of the world with its own kind of weather, and the plants and animals that suit it.\nSouth America\nIt's hot and rainy all year, so the trees get all the warmth and water they need.",
        "acceptanceCondition": None, "delivery": "answer-slide",
    },
})

voc = [
    ("vegetation", "Vegetation means all the plants that grow in a place.", {"kind": "photo", "photoRef": "photo-001"}),
    ("canopy", "The canopy is the thick roof of leaves where the treetops touch.", {"kind": "representation", "representationRef": "rep-001", "configuration": "vocab-canopy"}),
    ("emergent", "Emergent trees are the few giant trees that poke out above the canopy.", {"kind": "representation", "representationRef": "rep-001", "configuration": "vocab-emergent"}),
    ("understorey", "The understorey is the layer just under the canopy, where young trees grow.", {"kind": "representation", "representationRef": "rep-001", "configuration": "vocab-understorey"}),
]
for entry, (term, definition, visual) in zip(d["vocabulary"], voc):
    entry.update({"term": term, "definition": definition, "visual": visual})

d["trimmedVocabulary"] = [
    {"term": "buttress roots", "reason": "How plants have adapted to the rainforest is left for another lesson, so nothing today uses the word."},
    {"term": "lianas", "reason": "How plants have adapted to the rainforest is left for another lesson, so nothing today uses the word."},
    {"term": "minerals", "reason": "Nothing in today's description of the layers needs it."},
    {"term": "vegetation belts", "reason": "Last lesson's biome already does this job, and a second word for a group of places adds a name without helping children describe the layers."},
    {"term": "forest floor", "reason": "No card: both words are ones children use every day, so it is explained in the sentence that brings it in."},
]

LAYER_NAMES = "four bands, top to bottom, named \"emergent\", \"canopy\", \"understorey\" and \"forest floor\""
rep1, rep2 = d["representations"]
rep1.update({
    "name": "Rainforest layers cross-section",
    "purpose": "Show the four layers of a tropical rainforest in order from the top, with the band tint and the light arrows showing the sunlight running out as it comes down, so children can see why each layer is different.",
})
cfg = {c["id"]: c for c in rep1["configurations"]}
cfg["light"].update({
    "description": "The cross-section with the layer names, the sun and the light arrows thinning band by band, the understorey and the forest floor at full strength and the top two dimmed.",
    "requiredFeatures": [
        LAYER_NAMES,
        "the sun above the trees, with arrows that thin band by band, and the note \"about 2 rays in every 100\" on the forest floor",
        "the understorey and the forest floor at full strength, with the emergent and canopy bands dimmed",
    ],
})
cfg["reference"].update({
    "description": "The cross-section with the four layer names only, no light arrows and no notes, as the reference children work from.",
    "requiredFeatures": [LAYER_NAMES, "no notes saying what each layer is like, and no light arrows"],
})
for key, layer in (("vocab-canopy", "canopy"), ("vocab-emergent", "emergent"), ("vocab-understorey", "understorey")):
    cfg[key].update({
        "description": f"A small cross-section for the word card, with the {layer} band picked out.",
        "requiredFeatures": [f"the {layer} band picked out, with the other three bands dimmed"],
    })
rep2.update({
    "name": "Rainforest from above, with three lettered trees",
    "purpose": "A fresh photo children read to tell emergent trees from the canopy roof.",
})
rep2["configurations"][0].update({
    "description": "The photo of a rainforest from above with three letters placed on tree crowns, and no layer names printed.",
    "requiredFeatures": [
        "three letters on the photo: \"A\" on the crown of one emergent tree that stands clearly above the canopy, \"B\" on the canopy roof itself, \"C\" on the crown of a second emergent tree",
        "no layer names printed on the photo",
    ],
})

d["successCriteria"][0].update({
    "type": "steps",
    "drawLive": False,
    "content": {"steps": [
        "Say how much sunlight gets to the layer, and why.\nIt gets ___ sunlight because ___.",
        "Say what the {{vegetation}} is like there.\nSo the {{vegetation}} ___.",
    ]},
})

d["stickyKnowledge"][0]["text"] = "The canopy catches nearly all the sunlight, so the lower you go, the darker it gets."

d["misconceptions"][0].update({
    "belief": "A rainforest is the same all the way through: hot, wet and full of plants right down to the ground.",
    "correctiveFact": "The canopy catches nearly all the sunlight, so each layer down is darker, and different things grow in each one.",
    "strategy": "Asked before it is taught, then shown wrong on the light drawing, checked in the sort and retested in the fallen-tree prediction and the final description.",
    "reason": "It is the plan's first thing to look for, and it stops children describing the layers as different at all.",
})
d["misconceptions"][1].update({
    "belief": "The canopy is the very top of the rainforest.",
    "correctiveFact": "A few emergent trees poke out above the canopy, so the emergent layer is the top.",
    "strategy": "Named on the board where the canopy is taught, then checked once on a fresh photo and again in the sort.",
    "reason": "Children muddle the order of the layers, and the canopy, called a roof, sounds like the top.",
})

u1, u2, u3, u4, u5, u6, u7 = d["teachingSequence"]

def common(u, **kw):
    u.update({"pupilInstruction": None, "taskStructure": None, "modellingState": None,
              "representationRefs": [], "successCriteriaRefs": [], "stickyKnowledgeRefs": [],
              "misconceptionRefs": [], "photoRefs": []})
    u.update(kw)

common(u1,
    label="What's at the top of the rainforest?", minutes=6,
    unlocks="They can tell the canopy roof from the emergent trees poking out above it, which the photo task needs next and the light Teach builds on.",
    thinking="Why would it be shady under all those leaves, and what is sticking out above them?",
    content={
        "headline": "On a sunny day, it's shady under a big tree.",
        "explanation": "Its leaves stop the sunlight reaching you.\n"
                       "In a rainforest, the vegetation, all the plants, grows in layers, like the floors of a tall building.\n"
                       "At the top, the trees grow so close that their leaves join up into a thick roof, the canopy. Most animals live up here, where the fruit grows in the sun.\n"
                       "A few even taller trees poke out above the canopy. These are the emergent trees.",
        "takeaway": {"kind": "text", "text": "Like the tree in the park, the canopy catches the sunlight first."},
        "teachingText": None,
        "keyQuestions": ["Why is it shady under the tree?"],
    },
    misconceptionRefs=["mc-002"], photoRefs=["photo-003", "photo-001"],
    speakerNotes={
        "script": "Say to children: Think about a really hot, sunny day in the park. Where do people go and sit? Under a big tree, like this one. Why is it shady under there? ... The leaves are in the way. They stop the sunlight reaching you, so it's cooler and darker underneath. Keep that in your head, because it's the key to today. All the plants that grow in a place are called its vegetation: the trees, the bushes, the grass, everything. In a tropical rainforest, the vegetation grows in layers, one above another, like the floors of a really tall building. Let's start right at the top. This is a rainforest seen from above. Remember the giant trees packed close together from last lesson? Their leaves touch and join up into one thick roof of leaves, high above the ground. That roof is called the canopy. Most of the rainforest's animals live up here, monkeys, birds, sloths, because the sunshine is up here, so this is where the fruit and the flowers grow. Now look carefully. The canopy isn't the very top. Can you see these trees sticking right out above the roof? They're the emergent trees. Nothing is above them, so they get the most sun, and the strongest wind and the heaviest rain too. So, just like the tree in the park, the canopy catches the sunlight first. Hold on to that, because next we'll find out what it means for everything underneath.",
        "teacherInfo": "A child who points at the tallest tree and calls it the canopy thinks the canopy is the very top: point at the roof of touching treetops, then at the tree sticking out of it, and ask which one is above the roof.",
        "lookFor": None,
    },
    answer=dict(NONE_ANSWER),
)

common(u2,
    label="Which trees poke out of the canopy?", minutes=3,
    unlocks="They can pick out the canopy as the roof on a new photo, which the next Teach needs when it explains what that roof does to the light below.",
    thinking="Is this tree part of the roof, or sticking up out of it?",
    content={
        "activity": "Each child decides, for three lettered trees on a new photo of a rainforest from above, which are emergent trees and which is the canopy.",
        "format": "Choose for each letter on the photo: emergent tree or canopy.",
        "task": "Look at this new rainforest. Which letters are on emergent trees, and which are on the canopy?",
    },
    pupilInstruction="Geographers can tell the layers apart from above. Find the roof of touching treetops first, then look for any tree sticking up out of it.",
    representationRefs=[{"ref": "rep-002", "configuration": "letters", "interaction": "pupil-uses"}],
    misconceptionRefs=["mc-002"], photoRefs=["photo-002"],
    speakerNotes={
        "script": "Say to children: Here's a different rainforest, seen from above. There are three letters on it. For each letter, decide: is it on an emergent tree, or on the canopy? Find the roof first, then look for anything sticking up out of it. Decide all three before you tell anyone. ... So which ones are emergent? How did you know?",
        "teacherInfo": "A child who says B is an emergent tree, or calls A the canopy, thinks the canopy is the very top. Ask them to find the roof of touching treetops first, then ask which trees stick up above it.",
        "lookFor": None,
    },
    answer={"kind": "exact", "content": "A and C are on emergent trees.\nB is on the canopy.", "acceptanceCondition": None, "delivery": "teacher-only"},
    doMode="quick",
    levels={"printed": None, "boardOnlyBecause": "The answer is a layer for each of three letters, said aloud, so a sheet would only reprint the photo.", "realThings": None},
    use={"develops": "Reading a photo of a real rainforest to pick out its layers by where each tree sits, a geographer's way of describing vegetation from above.",
         "new": None, "wrong": None, "rehearsal": None,
         "practice": "Each child practises telling emergent trees from the canopy roof on a photo of a rainforest they have not seen, by finding the roof first and then what sticks up out of it."},
)

common(u3,
    label="What is it like under the canopy?", minutes=6,
    unlocks="They can say how much light each lower layer gets and what grows there because of it, which the sort uses next and the fallen-tree prediction tests.",
    thinking="If the roof catches the light, what is left for the layers underneath?",
    content={
        "headline": "The canopy catches nearly all the sunlight, so the lower you go, the darker it gets.",
        "explanation": "Under the canopy is the understorey. Young trees grow here in dim light, with huge leaves to catch what light gets through.\n"
                       "At the very bottom is the forest floor. It's the darkest place of all, even at midday.\n"
                       "So hardly any plants grow there. The ground is covered in dead leaves.\n"
                       "A rainforest isn't the same all the way down. Each layer gets a different amount of light.",
        "takeaway": None,
        "teachingText": None,
        "keyQuestions": ["What do you think it's like under the canopy?"],
    },
    representationRefs=[{"ref": "rep-001", "configuration": "light", "interaction": "view"}],
    misconceptionRefs=["mc-001"], photoRefs=["photo-005", "photo-004"],
    seesHappening=[{
        "see": "sunlight coming down through the layers, with fewer and fewer rays getting through each one, until only about 2 rays in every 100 reach the forest floor",
        "photoRef": None,
        "representationRef": {"ref": "rep-001", "configuration": "light"},
        "standInPhotoRef": None,
    }],
    speakerNotes={
        "script": "Say to children: So the canopy is a thick roof of leaves, and it catches the sunlight first. What do you think it's like underneath it? Have a think. ... Let's see. This drawing shows a rainforest cut open from top to bottom, with the sun at the top. Watch the arrows. Lots of sunshine hits the emergent trees and the canopy. But look how few arrows get through the canopy. The canopy catches nearly all the sunlight, so the lower you go, the darker it gets. Just under the canopy is the understorey. It's dim and green down here, warm and damp, and hardly any wind gets in. Young trees and bushes grow here, and look at their leaves: they're huge, some as big as an umbrella. That's so they can catch the little bit of light that gets through. Then right at the bottom is the forest floor, the ground of the rainforest. It's the darkest place of all, even at midday. See the words at the bottom of the drawing? Only about 2 rays of sunlight in every 100 get all the way down. So hardly any plants can grow on the forest floor. Instead it's covered in a carpet of dead leaves that have fallen from above. So it isn't the same everywhere in a rainforest. Each layer gets a different amount of light, and that's why different things grow in each one.",
        "teacherInfo": "Children often think a rainforest is hot, wet and full of plants all the way to the ground. If a child says the forest floor is thick with plants, point at the arrows on the drawing and ask how much light gets down there.",
        "lookFor": None,
    },
    answer=dict(NONE_ANSWER),
)

common(u4,
    label="Which layer does each one live in?", minutes=7,
    unlocks="They have used what each layer is like to place living things the lesson never showed, which the final description uses to say what grows in the canopy and on the forest floor.",
    thinking="What does this living thing need, and which layer gives it that?",
    content={
        "activity": "Pairs sort five rainforest living things, each with a picture and one fact, into the four layers, then say why they placed one of them.",
        "format": "Sort into groups: each living thing under the layer where it lives.",
        "task": "Which layer does each one live in? Choose one and say why it lives there.",
    },
    pupilInstruction="Geographers describe a rainforest by what lives in each layer. Read what each living thing needs, then put it under the layer where it lives.",
    taskStructure={
        "kind": "sort",
        "groups": [
            {"id": "group-001", "label": "Emergent layer"},
            {"id": "group-002", "label": "Canopy"},
            {"id": "group-003", "label": "Understorey"},
            {"id": "group-004", "label": "Forest floor"},
        ],
        "items": [
            {"id": "item-001", "label": "Kapok tree", "detail": "It grows much taller than the trees around it.", "photoRef": "photo-007"},
            {"id": "item-002", "label": "Harpy eagle", "detail": "It perches on the highest branches in the forest.", "photoRef": "photo-008"},
            {"id": "item-003", "label": "Howler monkey", "detail": "It lives high up in thick leaves, eating fruit.", "photoRef": "photo-009"},
            {"id": "item-004", "label": "Young tree", "detail": "It grows slowly in dim light, with leaves as big as an umbrella.", "photoRef": "photo-010"},
            {"id": "item-005", "label": "Fungus", "detail": "It grows on rotting leaves and needs no sunlight.", "photoRef": "photo-011"},
        ],
        "handling": {"kind": "sheet", "per": "pair", "groupCount": None,
                     "where": "At tables, one sheet between two, after the forest floor is taught: pairs write each living thing's letter in the box under its layer."},
    },
    representationRefs=[{"ref": "rep-001", "configuration": "reference", "interaction": "view"}],
    stickyKnowledgeRefs=["sk-001"], misconceptionRefs=["mc-001", "mc-002"],
    photoRefs=["photo-007", "photo-008", "photo-009", "photo-010", "photo-011"],
    speakerNotes={
        "script": "Say to children: Geographers describe a rainforest by what lives in each layer, so that's what you're going to do now. Here are five living things from the rainforest, and each card tells you one thing about it. Read what each one needs, then decide which layer it lives in. Look back at the drawing if you need to, and think about how much light each layer gets. Every card goes under one layer, and one layer gets more than one card. When you've placed all five, choose one and get ready to tell me why it lives there.",
        "teacherInfo": "If printed: the sort sheet, one between two, handed out as the task is set. Without it, pairs write each name under its layer from the board. Expect the harpy eagle in the canopy (the canopy is the top) and the young tree on the forest floor (it's dark, so it must be the bottom): ask what is above the canopy, and what grows on the forest floor.",
        "lookFor": "Look for: the harpy eagle in the emergent layer and the young tree in the understorey; ask how much light each one gets.",
    },
    doMode="deeper",
    levels={"printed": {"form": "sort", "per": "pair", "what": "The five living things with their pictures and facts, and a box under each layer for their letters."},
            "boardOnlyBecause": None, "realThings": None},
    use={"develops": "Using what each layer is like, its light, height and wind, to work out where a living thing belongs, which is how geographers describe what grows and lives in each layer.",
         "new": "a kapok tree, a harpy eagle, a howler monkey, a young tree and a fungus",
         "wrong": "The harpy eagle goes in the canopy, because the canopy is the top, and the young tree goes on the forest floor, because that's where it's dark.",
         "rehearsal": None, "practice": None},
)
u4["answer"]["structure"]["placements"] = [
    {"itemRef": "item-001", "groupRef": "group-001"},
    {"itemRef": "item-002", "groupRef": "group-001"},
    {"itemRef": "item-003", "groupRef": "group-002"},
    {"itemRef": "item-004", "groupRef": "group-003"},
    {"itemRef": "item-005", "groupRef": "group-004"},
]
u4["answer"]["acceptanceCondition"] = None
u4["answer"]["delivery"] = "teacher-only"

common(u5,
    label="What happens when a giant tree falls?", minutes=2,
    unlocks="They have the case of a hole in the canopy in front of them, which the prediction straight after works on.",
    thinking="What were that tree's leaves doing for the ground underneath before it fell?",
    content={
        "headline": "Sometimes a giant rainforest tree gets old and crashes down.",
        "explanation": "When it falls, it leaves a big hole in the canopy, like a hole in a roof.\nThis happens all the time in a rainforest.",
        "takeaway": None,
        "teachingText": None,
        "keyQuestions": [],
    },
    photoRefs=["photo-006"],
    speakerNotes={
        "script": "Say to children: Rainforest trees are huge, but they don't live for ever. Sometimes a giant tree gets old, or a storm pushes it over, and it crashes down. When it falls, it leaves a big hole in the canopy, like a hole in a roof. This happens all the time in a rainforest. Look at this one, lying on the forest floor.",
        "teacherInfo": None, "lookFor": None,
    },
    answer=dict(NONE_ANSWER),
)

common(u6,
    label="What happens under the hole?", minutes=3,
    unlocks="They have used the reason, the canopy catching the light, on a changed case, which is the because the final description gives for the forest floor.",
    thinking="With no roof above it now, what does the ground get, and what will that do?",
    content={
        "activity": "Each child predicts what will happen on the forest floor under the hole a fallen tree leaves, and gives the reason.",
        "format": None,
        "task": "What will happen on the forest floor under the hole? Why?",
    },
    misconceptionRefs=["mc-001"], photoRefs=["photo-006"],
    speakerNotes={
        "script": "Say to children: Here's the question. What will happen on the forest floor, right under this hole? Think about what the forest floor is usually like, and what the canopy was doing up there before the tree fell. Decide what you think, and get your reason ready. ... Let's hear some. Why do you think that? ... Here's what really happens.",
        "teacherInfo": "The half-listener says nothing will grow, because hardly anything grows on the forest floor: that is the place without the reason. Ask what the canopy was doing before the tree fell, and what can reach the ground now.",
        "lookFor": None,
    },
    answer={"kind": "model",
            "content": "Plants will grow there. Sunlight can now reach the forest floor through the hole, so seeds start to grow and young trees race up to fill the gap.",
            "acceptanceCondition": "Accept any prediction that plants will grow there, with a reason that says the sunlight can now reach the ground because the canopy is no longer in the way. 'Plants will grow' with no reason about the light is not yet the idea.",
            "delivery": "answer-slide"},
    doMode="quick",
    levels={"printed": None, "boardOnlyBecause": "A prediction and its reason said aloud, so a sheet would only reprint the question.", "realThings": None},
    use={"develops": "Changing one thing and working out what follows: using the canopy and the light to predict how the forest floor changes, a geographer's reasoning about how a place works.",
         "new": "the forest floor under the hole",
         "wrong": "Nothing will grow there, because hardly any plants grow on the forest floor.",
         "rehearsal": None, "practice": None},
)

STRONG = ("The canopy gets lots of sunlight because it is near the top. So the vegetation is thick and green, and most animals live there.\n\n"
          "The forest floor gets hardly any sunlight because the canopy catches it first. So the vegetation is thin, with only a few small plants.")
common(u7,
    label="What is it like in the canopy and on the forest floor?", minutes=11,
    unlocks=None,
    thinking="How much light gets to this layer, why, and what does that mean for what grows there?",
    content={
        "activity": "Each child tells a partner about all four layers, then writes a description of the canopy and the forest floor: how much sunlight reaches each, why, and what the vegetation is like because of it.",
        "format": "A written description, said to a partner first and then written.",
        "task": "What is it like in the canopy and on the forest floor, and why?",
        "launch": {
            "established": None,
            "goodLooksLike": {
                "strong": {"words": STRONG, "show": None},
                "weak": {"words": "The canopy is green and has lots of animals. The forest floor is dark and has dead leaves.", "show": None},
                "difference": "The strong one says how much sunlight each layer gets, and why.",
            },
            "steps": [],
        },
        "reasoningWords": ["sunlight", "vegetation", "because"],
        "rehearsal": {"sayIt": "Tell your partner about all four layers, from the top down. Say what each one is like.",
                      "partnerAsks": "Why is it like that?"},
    },
    pupilInstruction="Use the drawing and the steps to help you write about both layers.",
    representationRefs=[{"ref": "rep-001", "configuration": "reference", "interaction": "pupil-uses"}],
    successCriteriaRefs=["sc-001"], misconceptionRefs=["mc-001"],
    speakerNotes={
        "script": "Say to children: Now you're going to describe two of the layers yourselves: the canopy and the forest floor. Here's a good description, and here's one that isn't so good. Both of them are true. So what does the good one do that the other one doesn't? ... It says why. It doesn't just say the forest floor is dark. It says it gets hardly any sunlight because the canopy catches it first, and then it says what that means for the plants. Now I'm taking them away. First, tell your partner about all four layers, starting at the top: the emergent trees, the canopy, the understorey and the forest floor. Say what each one is like. Your partner's job is to ask you, 'Why is it like that?' Then write about the canopy and the forest floor. Use the steps if you get stuck.",
        "teacherInfo": "If printed: the worksheet, one each, handed out once the partner talk is done; it is this task printed. A child who writes that the forest floor is dark because it is at the bottom has the place without the reason: ask what is above it that stops the light. Other gaps: the canopy described with no sunlight in it, or the vegetation left out; ask what grows there because of the light.",
        "lookFor": "Look for: the forest floor's darkness given its reason; if a child writes only 'it's at the bottom', ask what stops the light.",
    },
    answer={"kind": "model", "content": STRONG,
            "acceptanceCondition": "Accept a description of each layer that says how much sunlight reaches it and why (the canopy is near the top, where the leaves join up; the forest floor is under the canopy, which catches the light first), and links that to what grows there. Written with a good one in mind: the model was shown first and then taken off the board.",
            "delivery": "teacher-only"},
    doMode="deeper",
    levels={"printed": {"form": "task", "per": "child", "what": "The worksheet: the labelled layers drawing, the two questions and lines to write on."},
            "boardOnlyBecause": None, "realThings": None},
)

d["ending"]["reason"] = "The final description already draws the layers and the light together, and the fallen-tree prediction has already taken the light idea to a new case, so an Apply would only ask the same thing again."

ws = d["worksheet"]
ws.update({
    "taskUnitId": "lesson-section/teaching-sequence/unit-007",
    "activityArchitecture": {
        "coreActionAndEvidence": "A one-answer objective: describing the layers shows in one written description, so the sheet is the lesson's final task printed, with the same labelled drawing and question, and it replaces the slide task.",
        "amount": "Two short descriptions, one for the canopy and one for the forest floor, each two or three sentences.",
        "variationAndBoundaryPlan": "Below and Greater Depth answer the same two questions with more or less help, decided by the adaptation designer.",
        "organisation": "The labelled layers drawing at the top, then the two questions under it, each with the words to use and lines to write on.",
    },
    "demand": "It replaces the final task: children write their descriptions on the sheet instead of from the board.",
    "stickyKnowledgeRefs": [],
    "fitPriority": {
        "protected": ["the labelled layers drawing", "both questions with room for two or three sentences each"],
        "preAuthorisedRemoval": ["the words to use (they are on the board while children write)"],
    },
    "centralWriteOnVisualException": None,
    "answerKeyMode": "required",
})
ws["sheetShape"]["reason"] = "Two written questions about one drawing, one job: describe two layers and say why each is like that."
STRONG_CANOPY, STRONG_FLOOR = STRONG.split("\n\n")
def part(n, prompt, model, accept):
    return {
        "id": f"ws-qg-001-part-0{n}", "pupilPrompt": prompt,
        "responseForm": "written-explanation",
        "responseFormReason": "The because is the evidence: only the child's own sentences show whether they link the light to the layer.",
        "response": "A short description, with room for about four lines of a child's handwriting.",
        "support": "Words to use: sunlight, vegetation, because",
        "visualRequirements": "", "representationRefs": [], "stickyKnowledgeRefs": [], "photoRefs": [],
        "answer": {"kind": "model", "content": model, "acceptanceCondition": accept, "delivery": "teacher-only"},
    }
ws["contentBlocks"] = [{
    "id": "ws-qg-001", "kind": "question-group",
    "groupPrompt": "Describe these two layers of the rainforest.",
    "representationRefs": [{"ref": "rep-001", "configuration": "reference", "interaction": "pupil-uses"}],
    "stickyKnowledgeRefs": [], "photoRefs": [],
    "parts": [
        part(1, "What is it like in the canopy, and why?", STRONG_CANOPY,
             "Accept a description that says the canopy gets lots of sunlight because it is near the top, and links that to thick vegetation, fruit, flowers or animals."),
        part(2, "What is it like on the forest floor, and why?", STRONG_FLOOR,
             "Accept a description that says the forest floor gets hardly any sunlight because the canopy catches it first, and links that to few plants growing there. 'Dark because it is at the bottom' alone is not yet the reason."),
    ],
}]

d["resourceOpportunities"] = {
    "stickIn": {"decision": "candidate", "sourceUnitIds": ["lesson-section/teaching-sequence/unit-004"],
                "reason": "The sort of five living things into the four layers is printed as a sheet, one between two."},
    "workingWall": {"decision": "candidate", "sourceUnitIds": ["lesson-section/teaching-sequence/unit-003"],
                    "reason": "The rainforest layers drawing with the light running out is the reference the rest of the rainforest unit comes back to."},
}

vi1, vi2 = d["vocabularyIntroductions"]
vi1.update({"vocabularyRefs": ["vocab-001", "vocab-002", "vocab-003"], "after": "lesson-section/starter/unit-001",
            "script": "Say to children: Three words are coming up straight away. Vegetation means all the plants that grow in a place, from the tallest trees to the smallest plants on the ground. This photo of a rainforest is nearly all vegetation. The canopy is the thick roof of leaves near the top of a rainforest, where the treetops touch. Look where it is on this drawing. And emergent trees are the few giant ones that grow even taller and poke out above the canopy. Don't worry about remembering them yet. You're about to see each one."})
vi2.update({"vocabularyRefs": ["vocab-004"], "after": "lesson-section/teaching-sequence/unit-002",
            "script": "Say to children: One more word before we go underneath. The understorey is the layer just under the canopy, where young trees and bushes grow. Look where it is on the drawing: just under the roof. So what's it like down there? Let's find out."})

d["slideDesignNotes"] = []
d["flagsForTeacher"] = [
    "Taught by asking about every line, the lesson runs to about 51 minutes with books out and moving to tables, a little over the usual 50. It is kept as it is because each of its two chunks of teaching needs its own Do, and the fallen-tree prediction is where children use the reason the final description needs. If time is short, the sort can be done on the board instead of at tables.",
    "Left out from the plan for another lesson: how plants have adapted to the rainforest (drip tips, buttress roots, lianas), vegetation belts and minerals. Today stays on the four layers and why each one is different.",
    "The board shows the objective as 'To describe the layers of a tropical rainforest', leaving off the bracket '(biomes and vegetation)', which names the curriculum strand rather than something children do. Vegetation is still taught and biome comes back in the starter.",
]

LD.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf8")

# ---------------- photos ----------------
p["lesson_name"] = "What is the Amazon rainforest like?"
TEXT_RULE = "no readable text, labels, letters, logos or branding"

def photo(pid, subject, constraint, req, evidence, use, filename, physical, avoid, composition):
    entry = next(x for x in p["photos"] if x["id"] == pid)
    entry.update({
        "subject": subject, "pedagogical_constraint": constraint, "teaching_requirement": req,
        "load_bearing_evidence": evidence, "use": use, "essential": True, "filename": filename,
        "acquisition_mode": "ordinary-real", "source_profile": "unsplash-then-wikimedia",
        "fallback_action": "ai", "fallback_note": None,
        "generation_prompt": {"physical_state": physical, "must_avoid": avoid, "text_rule": TEXT_RULE, "composition": composition},
        "coherent_group": None, "coherent_mode": "none", "coherent_visual_invariants": [],
    })

photo("photo-001",
      "A tropical rainforest seen from above, a wide view across the tops of the trees, with a few emergent trees standing above the canopy",
      "The class sees the canopy as one continuous roof of treetops, with a few taller trees rising above it.",
      "Children see the canopy as a roof of touching treetops and the emergent trees poking out above it, and the vegetation of a rainforest as a whole.",
      ["an unbroken roof of touching treetops filling most of the frame", "at least one or two taller trees whose crowns rise clearly above the roof"],
      "slide", "unsplash/rainforest-canopy-from-above.jpg",
      "A dense tropical rainforest seen from above in daylight, the treetops touching into a continuous green roof, with two or three taller emergent trees rising above it.",
      ["rivers or clearings filling the frame", "buildings or roads", "a temperate forest of conifers"],
      "A wide landscape view across the top of the forest.")
photo("photo-002",
      "A tropical rainforest seen from above or from a high viewpoint, where at least two emergent trees stand clearly above an unbroken canopy",
      "Children decide which lettered trees are emergent, so at least two tree crowns must rise clearly above the canopy roof, and the canopy between them must plainly be one continuous roof. Letters are added by the slide, so the photo carries none.",
      "Children tell emergent trees from the canopy on a photo the lesson has not shown.",
      ["at least two separate tree crowns rising clearly above the canopy", "a continuous roof of touching treetops between and around them"],
      "slide", "unsplash/rainforest-emergent-trees.jpg",
      "A tropical rainforest from a high viewpoint in clear daylight, two or three emergent tree crowns standing well above a continuous canopy of touching treetops.",
      ["only an even canopy with no taller trees", "mist hiding the treetops", "the same view as a wide aerial overview with no clear emergent crowns"],
      "A landscape view where each emergent crown is large enough to carry a letter.")
photo("photo-003",
      "A big leafy tree in a British park on a hot sunny day, with a dark patch of shade on the grass underneath it",
      "This is the familiar way in: the contrast between bright sun on the grass and the shade under the leaves must be easy to see.",
      "Children see that leaves stop sunlight reaching the ground, which the lesson then carries up into the rainforest canopy.",
      ["one big leafy tree in full leaf", "bright sunshine on the grass around it", "a clear dark patch of shade under the tree"],
      "slide", "unsplash/park-tree-shade-sunny-day.jpg",
      "A single large leafy tree in a British park on a bright summer day, a dark pool of shade on the grass under it and sunlit grass all around.",
      ["tropical trees or palms", "an overcast day with no shadow", "faces close up"],
      "A wide view showing the whole tree and its shade on the grass.")
photo("photo-004",
      "The floor of a tropical rainforest: dim light, the ground covered in dead brown leaves, tree trunks, and very few small plants",
      "The forest floor must look dim and nearly bare of plants, because the teaching says hardly anything grows there.",
      "Children see that the forest floor is dark and covered in dead leaves, with very few plants.",
      ["the ground covered in dead brown leaves", "dim light under the trees", "very few small plants on the ground", "tree trunks rising out of the frame"],
      "slide", "unsplash/rainforest-floor-dead-leaves.jpg",
      "The floor of a tropical rainforest in dim light, a carpet of dead brown leaves, a few thin tree trunks and only one or two small plants.",
      ["thick green plants covering the ground", "bright sunlight across the ground", "a path or boardwalk filling the frame"],
      "A landscape view at about standing height, looking across the ground.")
photo("photo-005",
      "The understorey of a tropical rainforest: young trees and bushes with very large leaves growing in dim green light under tall trees",
      "The large leaves and the dim light are what the teaching points at.",
      "Children see the understorey's young trees and their huge leaves growing in dim light.",
      ["young trees or bushes with very large leaves", "dim green light", "taller trunks behind them"],
      "slide", "unsplash/rainforest-understorey-big-leaves.jpg",
      "The understorey of a tropical rainforest in dim green light, young trees and bushes with very large broad leaves beneath tall tree trunks.",
      ["bright open sky", "a houseplant indoors", "a garden setting"],
      "A landscape view at about head height among the plants.")
photo("photo-006",
      "A large fallen tree lying on the floor of a tropical rainforest, with sunlight coming down through the gap it has left in the canopy",
      "Children predict what will happen here, so the ground under the gap should not yet be thick with young plants, which would give the answer.",
      "Children see a hole a fallen tree has left in the canopy, with light now reaching the ground, and predict what will happen.",
      ["a large fallen tree trunk lying on the rainforest floor", "light coming down onto the ground through a gap above"],
      "slide", "unsplash/rainforest-fallen-tree-gap.jpg",
      "A large tree trunk freshly fallen across the floor of a tropical rainforest, sunlight shining down onto the bare ground through the gap above.",
      ["the gap already filled with thick young plants", "people or machinery", "a cut stump from logging"],
      "A landscape view showing the fallen trunk and the light coming down.")
photo("photo-007",
      "A kapok tree standing far taller than the rainforest trees around it",
      "One of five sort cards; the tree must clearly tower over the forest around it.",
      "Children place the kapok tree in the emergent layer from what its card says.",
      ["one very tall tree whose crown rises well above the trees around it"],
      "both", "unsplash/kapok-tree-towering.jpg",
      "A single giant kapok tree rising far above the surrounding rainforest canopy, its wide crown clear against the sky.",
      ["a tree standing alone in a field", "a different, short tree"],
      "A near-square view showing the whole height of the tree above the forest.")
photo("photo-008",
      "A harpy eagle perched on a branch",
      "One of five sort cards; the bird must be recognisable at small card size.",
      "Children place the harpy eagle in the emergent layer from what its card says.",
      ["one harpy eagle, clearly seen, perched on a branch"],
      "both", "unsplash/harpy-eagle-perched.jpg",
      "A harpy eagle perched on a thick branch, its grey head and crest clearly visible.",
      ["a zoo enclosure or wire in view", "a different eagle species"],
      "A near-square view with the eagle filling most of the frame.")
photo("photo-009",
      "A howler monkey among the leaves of a rainforest tree",
      "One of five sort cards; the monkey must be recognisable at small card size, among leaves.",
      "Children place the howler monkey in the canopy from what its card says.",
      ["one howler monkey, clearly seen", "leaves around it"],
      "both", "unsplash/howler-monkey-leaves.jpg",
      "A howler monkey sitting on a branch among thick green leaves.",
      ["a zoo enclosure or wire in view", "a monkey on the ground"],
      "A near-square view with the monkey filling most of the frame.")
photo("photo-010",
      "A young rainforest tree or plant with very large leaves, growing in dim light under big trees",
      "One of five sort cards; the very large leaves are the clue on the card, and the photo should not be the same picture as the understorey photo the Teach shows.",
      "Children place the young tree in the understorey from what its card says.",
      ["one young plant or small tree with very large leaves", "dim light around it"],
      "both", "unsplash/young-tree-huge-leaves.jpg",
      "A young rainforest tree with a few very large broad leaves, growing in dim light under tall trees.",
      ["a houseplant in a pot", "a garden setting"],
      "A near-square view with the plant filling most of the frame.")
photo("photo-011",
      "Fungi (mushrooms) growing on dead leaves or rotting wood on a rainforest floor",
      "One of five sort cards; the fungus must be recognisable at small card size, on dead leaves or wood.",
      "Children place the fungus on the forest floor from what its card says.",
      ["fungi or mushrooms clearly seen", "dead leaves or rotting wood under them"],
      "both", "unsplash/fungus-rotting-leaves.jpg",
      "A cluster of mushrooms growing out of rotting wood and dead leaves on a dim forest floor.",
      ["mushrooms in a shop or on a plate", "a grassy lawn"],
      "A near-square close view with the fungi filling most of the frame.")

PR.write_text(json.dumps(p, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
print("filled")
