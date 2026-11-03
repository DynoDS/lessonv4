import json, pathlib

WD = pathlib.Path(r"C:/Users/Daniel/Projects/lessonv4/evaluations/techniques-2026-11-03/geography1")
LD = WD / "lesson-design.json"
PR = WD / "photo-requirements.json"

d = json.loads(LD.read_text(encoding="utf-8"))
p = json.loads(PR.read_text(encoding="utf-8"))

U = lambda n: f"lesson-section/teaching-sequence/unit-{n:03d}"
STARTER = "lesson-section/starter/unit-001"

def rep(ref, cfg, inter):
    return {"ref": ref, "configuration": cfg, "interaction": inter}

d["lesson"].update({
    "lo": "To describe a biome and locate the Amazon rainforest",
    "displayedLo": "To describe a biome and locate the Amazon rainforest",
    "durationMinutes": 45,
    "stickingPoint": "Children think rainforests grow anywhere that is hot, so a hot desert, or anywhere in Africa or South America, could be rainforest. It is being near the Equator, hot and rainy all year, that lets them grow.",
})

ORIENT = (
    "Teacher orientation: Children find out what a biome is by comparing a hot desert with a tropical rainforest, "
    "find out why rainforests grow near the Equator, then locate the Amazon rainforest and write a short description "
    "of where it is and what it is like there. The tricky move is the link between weather and plants: being near the "
    "Equator makes a place hot and rainy all year, and that is what lets the trees grow. It is taught in \"Where do "
    "rainforests grow?\" and tested on five new places in \"Which places could have a tropical rainforest?\" straight after. "
    "From the slides: the map task runs on the board, with pairs saying the letters they choose. To print: the map of "
    "five places, one between two, and the worksheet, which is the final task printed and replaces it."
)
d["teacherOrientation"] = ORIENT

# ---------------- Starter ----------------
s = d["starter"]
s.update({
    "label": "Continents of the world",
    "minutes": 5,
    "unlocks": "They have South America and Africa back in mind, which the five-places map task and locating the Amazon from its continent both use.",
    "thinking": "Which continent has this shape, in this part of the world?",
    "content": {
        "activity": "Name the continent marked with each letter.\nA\nB\nC\nD\nE",
        "connection": "Retrieves the continents from Key Stage 1, so the lesson can move outward from a continent the class already holds to the Equator and then to the Amazon.",
        "format": "Labelling a world map from memory: children name the five lettered continents."
    },
    "pupilInstruction": None,
    "taskStructure": None,
    "modellingState": None,
    "representationRefs": [rep("rep-001", "continents", "pupil-uses")],
    "successCriteriaRefs": [],
    "stickyKnowledgeRefs": [],
    "misconceptionRefs": [],
    "photoRefs": [],
    "speakerNotes": {
        "script": ("Say to children: Let's wake up our map brains. Here's a map of the whole world, and five of the continents "
                   "have a letter on them. Look at each shape, and where it sits on the map, and see if you can name it. "
                   "Have a go at all five before we check. ... Let's see. Which one do we live in? Europe, that's right: "
                   "the UK is in Europe. Now keep an eye on B, South America. We're going to end up there today."),
        "teacherInfo": None,
        "lookFor": None,
    },
    "answer": {
        "kind": "exact",
        "content": "A: North America\nB: South America\nC: Europe\nD: Africa\nE: Asia",
        "acceptanceCondition": None,
        "delivery": "answer-slide",
    },
})

# ---------------- Vocabulary ----------------
v1, v2 = d["vocabulary"]
v1.update({
    "term": "biome",
    "definition": "A biome is a big area of the world with its own kind of weather, and the plants and animals that suit it.",
    "visual": {"kind": "photo", "photoRef": "photo-003"},
})
v2.update({
    "term": "Equator",
    "definition": "The Equator is an imaginary line around the middle of the Earth, halfway between the North Pole and the South Pole.",
    "visual": {"kind": "representation", "representationRef": "rep-001", "configuration": "vocabulary"},
})

d["vocabularyIntroductions"] = [
    {
        "vocabularyRefs": ["vocab-001"],
        "after": STARTER,
        "script": ("Say to children: Here's a word that's coming up in a minute: biome. A biome is a big area of the world "
                   "with its own kind of weather, and the plants and animals that suit it. This rainforest is one. "
                   "Don't worry about remembering it yet. You're about to see why places like this get a name of their own."),
    },
    {
        "vocabularyRefs": ["vocab-002"],
        "after": U(2),
        "script": ("Say to children: Before we look at where the rainforests are, here's a line we're going to need. "
                   "The Equator is an imaginary line around the middle of the Earth, halfway between the North Pole at the top "
                   "and the South Pole at the bottom. Imaginary means nobody has painted it on the ground. You can't see it if "
                   "you go there, but map makers draw it on maps, and it goes all the way round the world, like a belt."),
    },
]

# ---------------- Representations ----------------
r1, r2 = d["representations"]
r1.update({
    "name": "World map",
    "purpose": "Place the continents, see where the tropical rainforests are against the Equator, and judge new places by how near the Equator they are.",
})
c = {cfg["id"]: cfg for cfg in r1["configurations"]}
c["continents"].update({
    "description": "Seven-continent world map with no names printed; five continents carry a letter.",
    "requiredFeatures": [
        "the seven continents drawn, with no continent names printed",
        "a letter on five continents: \"A\" on North America, \"B\" on South America, \"C\" on Europe, \"D\" on Africa, \"E\" on Asia",
    ],
})
c["rainforest-pattern"].update({
    "description": "World map with the tropical rainforests shaded green and the Equator drawn across it.",
    "requiredFeatures": [
        "the Equator drawn right across the map and labelled \"Equator\"",
        "tropical rainforest areas shaded green in northern South America, central Africa and South-east Asia, with a small area in north-east Australia, all close to the Equator",
        "a key reading \"Tropical rainforest\"",
    ],
})
c["places-check"].update({
    "description": "World map with the Equator drawn and five places marked with lettered dots; no rainforests shown and no place names.",
    "requiredFeatures": [
        "the Equator drawn right across the map and labelled \"Equator\"",
        "five places marked with a dot and a letter: \"A\" in central Africa on the Equator (the Congo rainforest), \"B\" in the middle of the Sahara Desert in northern Africa, \"C\" on the UK, \"D\" on the island of Borneo on the Equator, \"E\" in the far south of South America (Patagonia)",
        "no rainforest shading, no country names and no continent names",
    ],
})
c["vocabulary"].update({
    "description": "Small world map with the Equator drawn across the middle, for the word card.",
    "requiredFeatures": ["the Equator drawn across the middle of the map"],
})
r2.update({
    "name": "Map of northern South America",
    "purpose": "Locate the Amazon rainforest inside its continent: the countries it spreads across and the Equator running through it.",
})
r2["configurations"][0].update({
    "description": "The South America map in its regional layers form, showing the north of the continent, with the countries named, the sourced Amazon rainforest layer shaded and the Equator drawn.",
    "requiredFeatures": [
        "country names printed: \"Brazil\", \"Peru\", \"Colombia\", \"Ecuador\", \"Bolivia\", \"Venezuela\", \"Guyana\", \"Suriname\"",
        "the Amazon rainforest shaded, with a key reading \"Amazon rainforest\"",
        "the Equator drawn and labelled \"Equator\"",
    ],
})

# ---------------- SC, sticky, misconceptions ----------------
d["successCriteria"][0].update({
    "type": "steps",
    "drawLive": False,
    "content": {"steps": [
        "Say what kind of {{biome}} it is.",
        "Say where it is. Start with <<the continent>>, then narrow it down to the country.",
        "Say how close it is to the {{Equator}}.",
        "Describe the weather, then say what grows there because of it.",
    ]},
})
d["stickyKnowledge"][0]["text"] = "Tropical rainforests grow near the Equator, where it is hot and rainy all year."

m1, m2 = d["misconceptions"]
m1.update({
    "belief": "Rainforests grow anywhere that is hot, so a hot desert, or anywhere in Africa or South America, could be rainforest.",
    "correctiveFact": "Tropical rainforests grow near the Equator, where it is hot and rainy all year. A hot desert hardly ever gets any rain.",
    "strategy": "The pattern is read off the map and explained, then tested on five new places that include the Sahara and the far south of South America.",
    "reason": "It is the commonest wrong rule here, and it decides whether a child locates a rainforest by the Equator or by guessing at hot places.",
})
m2.update({
    "belief": "You could make a rainforest anywhere just by planting rainforest trees.",
    "correctiveFact": "The weather decides what can grow. Rainforest trees need it hot and rainy all year, and our winters are cold.",
    "strategy": "One right claim for children to confirm with a reason, about their own school field.",
    "reason": "It leaves the weather out of what makes a biome, so it gets one clean touch and no more.",
})

seq = d["teachingSequence"]

def common(u, **kw):
    base = {
        "pupilInstruction": None, "taskStructure": None, "modellingState": None,
        "representationRefs": [], "successCriteriaRefs": [], "stickyKnowledgeRefs": [],
        "misconceptionRefs": [], "photoRefs": [], "seesHappening": [],
    }
    base.update(kw)
    u.update(base)

# ---------------- Teach 1 ----------------
t1 = seq[0]
common(t1,
    label="What decides what can grow in a place?",
    minutes=7,
    unlocks="They can use a place's weather to say what can grow there, which Ayaan's school field claim and the final description both need.",
    thinking="What is different about the weather in each place, and how does that change what grows there?",
    content={
        "headline": "The weather in a place decides what plants can grow there.",
        "explanation": (
            "Here in Britain, summers are warm and winters are cold, and it rains on lots of days. Oak trees grow well here, and they drop their leaves when winter comes.\n"
            "In a hot desert, it hardly ever rains. Plants need water, so only a few tough plants can grow.\n"
            "In a tropical rainforest, it's hot all year and it rains nearly every day. The plants get all the warmth and water they need, so huge trees grow close together and stay green all year.\n"
            "A big area of the world with its own kind of weather, and the plants and animals that suit it, is called a biome. The hot desert and the tropical rainforest are two different biomes."
        ),
        "takeaway": None,
        "teachingText": None,
        "keyQuestions": ["Why can't a forest like this grow in the desert?"],
    },
    photoRefs=["photo-001", "photo-002", "photo-003"],
    speakerNotes={
        "script": (
            "Say to children: Think about the weather here, where we live. What's it like in summer? Warm, sometimes. And in winter? "
            "Cold, and it gets dark early. And it rains on lots of days, doesn't it? Look at this park. Oak trees like these grow really well "
            "in Britain, and when winter comes they drop their leaves and wait for the spring. Now let's go somewhere very different. "
            "This is a hot desert. It hardly ever rains there, sometimes not for months. Plants need water to grow, so only a few tough little "
            "plants can live. And this is a tropical rainforest. It's hot all year, every single month, and it rains nearly every day. "
            "The plants get all the warmth and all the water they could want, so huge trees grow, packed close together, and they stay green "
            "all year round. So here's a question for you. Why can't a forest like this grow in the desert? ... Yes, there's no water for it. "
            "The weather in a place decides what plants can grow there. Geographers have a name for a big area like this, with its own kind "
            "of weather and the plants and animals that suit it. It's called a biome. The hot desert is one biome. The tropical rainforest is "
            "another."
        ),
        "teacherInfo": "The desert photograph is a hot desert such as the Sahara. Today only two biomes are named, as a contrast: there's no need to list the others.",
        "lookFor": None,
    },
    answer={"kind": "none", "content": None, "acceptanceCondition": None, "delivery": "none"},
)

# ---------------- Do 1 ----------------
d1 = seq[1]
common(d1,
    label="Could a rainforest grow in our school field?",
    minutes=3,
    unlocks="They have used a place's weather to decide what can grow there, which the five-places map task does next with the Equator.",
    thinking="Is the weather here what a rainforest needs?",
    content={
        "activity": "Each child judges Ayaan's claim about our school field against our own weather, then tells a partner the reason.",
        "format": None,
        "task": "Ayaan says: \"Even if we planted rainforest trees in our school field, they wouldn't grow into a rainforest.\"\n\nIs Ayaan right? Explain your answer.",
    },
    photoRefs=["photo-001", "photo-003"],
    misconceptionRefs=["mc-002"],
    speakerNotes={
        "script": (
            "Say to children: Here's our park again, and here's the rainforest. Ayaan has been thinking about our school field. "
            "Listen to what he says. Is Ayaan right? Have a think on your own first, and decide yes or no. Then tell your partner why. "
            "Think about our weather here, all through the year, and what a rainforest needs."
        ),
        "teacherInfo": (
            "An answer of \"No, they'd grow if you watered them\" means the weather has been left out: point at the park and ask "
            "whether a rainforest ever has a cold winter. Ayaan is right. At Kew Gardens in London, rainforest plants are kept in a huge "
            "heated glasshouse for exactly this reason."
        ),
        "lookFor": "Look for: our cold winters named as the reason, not just \"trees need water\".",
    },
    answer={
        "kind": "model",
        "content": "Yes, Ayaan is right. Our winters are cold, but rainforest trees need it hot all year and rain nearly every day, so they wouldn't grow into a rainforest here.",
        "acceptanceCondition": "Accept yes with any reason that sets our weather (cold winters, not hot all year) against what a rainforest needs. A yes with no weather in the reason is not yet the idea.",
        "delivery": "teacher-only",
    },
    doMode="quick",
    levels={"printed": None, "boardOnlyBecause": "Each child gives a verdict and a reason aloud, so a sheet would only reprint Ayaan's claim.", "realThings": None},
    use={
        "develops": "Reading a place's weather to decide what can grow there, the reasoning a biome rests on, used on their own place rather than the two places the Teach showed.",
        "new": "rainforest trees planted in our own school field",
        "wrong": "No, Ayaan is wrong, because trees will grow anywhere if you plant them and water them.",
        "rehearsal": None,
        "practice": None,
    },
)

# ---------------- Teach 2 ----------------
t2 = seq[2]
common(t2,
    label="Where do rainforests grow?",
    minutes=6,
    unlocks="They can use the Equator to judge where a rainforest could grow, which the five-places map task needs and the final description uses to say why it is hot.",
    thinking="Why would being near the Equator make a place hot and rainy all year?",
    content={
        "headline": "The green on this map shows where tropical rainforests grow.",
        "explanation": (
            "They are all close to the Equator, the line around the middle of the Earth.\n"
            "Near the Equator, the Sun shines down strongly all year round, so it's hot every month. There's no cold winter.\n"
            "All that heat lifts lots of water up into the air, from the trees and the sea. It falls again as heavy rain, nearly every day.\n"
            "Further from the Equator, the Sun's rays reach the Earth at a slant, so the sunshine is weaker and the winters are cooler."
        ),
        "takeaway": {"kind": "sticky", "ref": "sk-001"},
        "teachingText": None,
        "keyQuestions": ["What do you notice about where they are?"],
    },
    representationRefs=[rep("rep-001", "rainforest-pattern", "view")],
    photoRefs=["photo-004"],
    misconceptionRefs=["mc-001"],
    seesHappening=[{
        "see": "the Sun's rays hitting the middle of the Earth straight on, and spreading out at a slant towards the top and the bottom, so the middle gets the strongest sunshine",
        "photoRef": "photo-004",
        "representationRef": None,
        "standInPhotoRef": "photo-003",
    }],
    speakerNotes={
        "script": (
            "Say to children: So where in the world do these rainforests grow? On this map, the green shows where tropical rainforests grow. "
            "Have a really good look. What do you notice about where they are? ... They're all close to the Equator, that line around the middle. "
            "None of them are right up at the top or right down at the bottom. So why there? Look at this picture. Here's the Sun, and here's the "
            "Earth. See how the Sun's rays hit the middle of the Earth straight on? That's the Equator. The sunshine there is really strong, all "
            "year round, so it's hot every month. There's no cold winter at all. And all that heat lifts lots of water up into the air, from the "
            "trees and from the sea. Up in the sky it turns back into rain, and down it comes, nearly every day. Now look at the top and the bottom "
            "of the Earth. The rays reach them at a slant, so they're spread out and the sunshine is weaker. That's why it gets colder the further "
            "you go from the Equator. So tropical rainforests grow near the Equator, where it is hot and rainy all year."
        ),
        "teacherInfo": (
            "A child who says rainforests are \"where it's hot\" has half of it: point at the Sahara in northern Africa, which is hot and has no green, "
            "and ask what else a rainforest needs. Near the Equator it is hot and rainy all year. If the picture of the Sun's rays has not arrived, "
            "a torch shone straight at the middle of a ball, then tilted towards the top, shows the same thing."
        ),
        "lookFor": None,
    },
    answer={"kind": "none", "content": None, "acceptanceCondition": None, "delivery": "none"},
)

# ---------------- Do 2 ----------------
d2 = seq[3]
common(d2,
    label="Which places could have a tropical rainforest?",
    minutes=5,
    unlocks="They can place a rainforest by how near it is to the Equator, not by heat or continent, which the final description uses to locate the Amazon.",
    thinking="Is this place near the Equator, so is it hot and rainy all year?",
    content={
        "activity": "Pairs decide, for five places marked on a new world map, which could have a tropical rainforest, then give the reason for one of their choices.",
        "format": "Mark on a map: pairs choose the lettered places that could have a tropical rainforest.",
        "task": "Which of these places could have a tropical rainforest?\n\nExplain one of your choices.",
    },
    representationRefs=[rep("rep-001", "places-check", "pupil-uses")],
    misconceptionRefs=["mc-001"],
    speakerNotes={
        "script": (
            "Say to children: Here's a new map. There's no green on it this time, so nothing tells you where the rainforests are. "
            "I've marked five places, A, B, C, D and E. With your partner, decide which of these places could have a tropical rainforest. "
            "Look at where each one is. Then choose one of your answers and get ready to tell me why."
        ),
        "teacherInfo": (
            "If printed: the five-places map, one between two, as the task is set, for pairs to ring their places. Without it, pairs say the letters. "
            "Choosing B means \"Africa is hot\": B is in the Sahara Desert, far from the Equator, where it hardly ever rains. Choosing E means "
            "\"the Amazon is in South America\": E is in the far south, a long way from the Equator, and cold. Ask: how near the Equator is it?"
        ),
        "lookFor": "Look for: A and D chosen, with the Equator in the reason.",
    },
    answer={
        "kind": "model",
        "content": "A and D could have a tropical rainforest. They are both on the Equator, so it is hot and rainy there all year.\n(B is in the Sahara Desert, C is the UK and E is in the far south of South America. They are all a long way from the Equator.)",
        "acceptanceCondition": "A and D only. The reason must use being near the Equator, hot and rainy all year, not just \"it's hot\".",
        "delivery": "teacher-only",
    },
    doMode="deeper",
    levels={
        "printed": {"form": "figure", "per": "pair", "what": "The world map with the Equator and the five places A to E, for pairs to ring the places that could have a tropical rainforest."},
        "boardOnlyBecause": None,
        "realThings": None,
    },
    use={
        "develops": "Using the Equator to judge where a rainforest could grow, geography's why here and not there, on five places the lesson has not shown.",
        "new": "five places marked on a world map with no rainforests shown, one of them in the Sahara and one in the far south of South America",
        "wrong": "B, because it's in Africa and Africa is hot, and E, because the Amazon rainforest is in South America.",
        "rehearsal": None,
        "practice": None,
    },
)

# ---------------- Teach 3 ----------------
t3 = seq[4]
common(t3,
    label="Where is the Amazon rainforest?",
    minutes=5,
    unlocks="They can say where the Amazon is, from continent to country to the Equator, which the final description now does on its own.",
    thinking="Starting with the continent, how would you tell someone where the Amazon is?",
    content={
        "headline": "The Amazon is the biggest tropical rainforest in the world.",
        "explanation": (
            "It's in South America, the continent from our starter. Most of it is in Brazil, but it spreads into other countries too, like Peru and Colombia.\n"
            "The Equator runs right through it, so it's hot and rainy all year.\n"
            "The Amazon River winds through the middle of the forest. The forest is enormous: more than 20 times bigger than the whole of the UK."
        ),
        "takeaway": None,
        "teachingText": None,
        "keyQuestions": ["Which continent from our starter is it in?"],
    },
    representationRefs=[rep("rep-002", "amazon-located", "view")],
    photoRefs=["photo-005"],
    stickyKnowledgeRefs=["sk-001"],
    speakerNotes={
        "script": (
            "Say to children: The biggest tropical rainforest in the whole world is called the Amazon. Which continent from our starter is it in? "
            "B, South America. Here's South America, a bit closer. The shading shows the Amazon rainforest. Most of it is in this big country, "
            "Brazil. But a forest doesn't stop at a border, so it spreads into other countries too, like Peru and Colombia. Now find the Equator. "
            "It runs right through the Amazon, so you already know what the weather's like there: hot and rainy all year. And look at this "
            "photograph, taken from high up. That's the Amazon River, winding through the middle of the forest. It's one of the longest rivers "
            "in the world. Here's the part I find amazing. The Amazon rainforest is more than 20 times bigger than the whole of the UK. Imagine "
            "walking for weeks and weeks and still being in the forest."
        ),
        "teacherInfo": "The Amazon rainforest is about 5.5 million square kilometres; the UK is about 244,000, so more than 20 times is safe. Most of it, about 60 per cent, is in Brazil.",
        "lookFor": None,
    },
    answer={"kind": "none", "content": None, "acceptanceCondition": None, "delivery": "none"},
)

# ---------------- Practise ----------------
pr = seq[5]
STRONG = ("The Amazon rainforest is a tropical rainforest biome. It is in South America, and most of it is in Brazil. "
          "The Equator runs right through it, so it is hot all year and it rains nearly every day. "
          "The plants get all the warmth and water they need, so huge trees grow close together.")
common(pr,
    label="Where is the Amazon rainforest, and what is it like there?",
    minutes=12,
    unlocks=None,
    thinking="Where is it, starting big, and how does its weather decide what grows there?",
    content={
        "activity": "Each child writes a short description of the Amazon rainforest: where it is, from continent to country to the Equator, what its weather is like and what grows there because of it.",
        "format": "A written description, said to a partner first and then written.",
        "task": "Where is the Amazon rainforest, and what is it like there?",
        "launch": {
            "established": None,
            "goodLooksLike": {
                "strong": {"words": STRONG, "show": None},
                "weak": {"words": "The Amazon is hot. It has lots of trees. It is in Brazil. It rains a lot.", "show": None},
                "difference": "The strong one starts with the continent, and says how the weather makes the trees grow.",
            },
            "steps": [],
        },
        "reasoningWords": ["South America", "Brazil", "Equator", "so"],
        "rehearsal": {
            "sayIt": "Tell your partner where the Amazon is. Start with the continent.",
            "partnerAsks": "Why do the trees grow so well there?",
        },
    },
    representationRefs=[rep("rep-002", "amazon-located", "pupil-uses")],
    successCriteriaRefs=["sc-001"],
    speakerNotes={
        "script": (
            "Say to children: Here are two descriptions of the Amazon. Read them both with me. ... Both of them are true. But look at the second "
            "one: it's a list. Hot. Trees. Brazil. Rain. It never says how those things go together. Now look at the first one. It starts big, "
            "with the continent, then narrows it down to Brazil. Then it says the Equator runs through it, so it's hot and rainy, and so the "
            "trees grow huge. Every sentence leads to the next. That's what makes it a description a geographer would write. Right, I'm taking "
            "them both away. Now it's your turn: where is the Amazon rainforest, and what is it like there? First, tell your partner where the "
            "Amazon is, starting with the continent. Partners, when they've finished, ask them: why do the trees grow so well there? Then "
            "write yours. Use the map and the steps to help you."
        ),
        "teacherInfo": (
            "If printed: the worksheet is this task on a sheet, with the same map. Hand it out once the two models are off the board. "
            "Without it, children write from the map and the steps on the board. A child who writes only \"It is in Brazil\" has skipped "
            "the continent: ask which continent Brazil is in."
        ),
        "lookFor": "Look for: weather linked to the trees with so or because. If a child lists hot and trees, ask what the heat and rain do for them.",
    },
    answer={
        "kind": "model",
        "content": ("The Amazon rainforest is a tropical rainforest biome. It is in South America, and most of it is in Brazil. "
                    "The Equator goes right through it, so it is hot all year and it rains nearly every day. "
                    "That warmth and rain help huge trees grow close together, and they stay green all year."),
        "acceptanceCondition": ("Accept any description that says it is a (tropical) rainforest biome, names South America and Brazil, says the Equator "
                                "runs through it or that it is near the Equator, says it is hot and rainy all year, and links that weather to the trees "
                                "with so or because. Written with a good one in mind: the model was shown first and then taken off the board."),
        "delivery": "answer-slide",
    },
    doMode="deeper",
    levels={
        "printed": {"form": "task", "per": "child", "what": "The worksheet: the map of northern South America, the question and lines to write the description on."},
        "boardOnlyBecause": None,
        "realThings": None,
    },
)

d["ending"]["reason"] = "The final description already draws together the biome idea, the Equator and the Amazon's place, so an Apply would only ask the same thing again."

# ---------------- Worksheet ----------------
ws = d["worksheet"]
ws.update({
    "taskUnitId": U(6),
    "activityArchitecture": {
        "coreActionAndEvidence": "A one-answer objective: describing the Amazon as a biome and locating it shows in one written description, so the sheet is the lesson's final task printed, with the same map and question, and it replaces the slide task.",
        "amount": "One description of about four sentences, written from the map.",
        "variationAndBoundaryPlan": "Below and Greater Depth answer the same question with more or less help, decided by the adaptation designer.",
        "organisation": "The map of northern South America at the top, the question under it with the words to use beside it, then lines to write on.",
    },
    "sheetShape": {"kind": "question-set", "reason": "A single written question that works from one map."},
    "demand": "It replaces the final task: children write their description on the sheet instead of from the board.",
    "stickyKnowledgeRefs": [],
    "fitPriority": {
        "protected": [
            "the map of northern South America with the countries named, the Amazon shaded and the Equator drawn",
            "the question and room for a four-sentence description",
        ],
        "preAuthorisedRemoval": ["the words to use (they are on the board while children write)"],
    },
    "centralWriteOnVisualException": None,
    "contentBlocks": [{
        "id": "ws-q-001",
        "kind": "question",
        "pupilPrompt": "Where is the Amazon rainforest, and what is it like there?",
        "responseForm": "written-explanation",
        "responseFormReason": "The description is the evidence: only the child's own sentences show whether they link the weather to what grows.",
        "response": "A short description, with room for about five lines of a child's handwriting.",
        "support": "Words to use: South America, Brazil, Equator, so",
        "visualRequirements": "The map of northern South America above the question, as the board shows it.",
        "representationRefs": [rep("rep-002", "amazon-located", "pupil-uses")],
        "stickyKnowledgeRefs": [],
        "photoRefs": [],
        "answer": {
            "kind": "model",
            "content": "The Amazon rainforest is a tropical rainforest biome. It is in South America, and most of it is in Brazil. The Equator goes right through it, so it is hot all year and it rains nearly every day. That warmth and rain help huge trees grow close together.",
            "acceptanceCondition": "Accept any description that names South America and Brazil, places it on or near the Equator, says it is hot and rainy all year and links that weather to the trees.",
            "delivery": "teacher-only",
        },
    }],
    "answerKeyMode": "required",
})

d["resourceOpportunities"] = {
    "stickIn": {"decision": "candidate", "sourceUnitIds": [U(4)], "reason": "The five-places world map is a figure pairs ring places on, printed one between two."},
    "workingWall": {"decision": "candidate", "sourceUnitIds": [U(3), U(5)], "reason": "The rainforests along the Equator and the Amazon located in South America are references the whole rainforest unit comes back to."},
}
d["slideDesignNotes"] = []
d["flagsForTeacher"] = [
    "The notes said this lesson is one of a set of three planned side by side, sharing agreed wording, but the file naming that set was not in the lesson's folder, so this lesson was planned on its own."
]

LD.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# ---------------- Photos ----------------
p["lesson_name"] = "Where in the world are tropical rainforests?"
ph = {x["id"]: x for x in p["photos"]}

def gp(state, avoid, comp):
    return {"physical_state": state, "must_avoid": avoid, "text_rule": "no readable text, labels, logos or branding", "composition": comp}

ph["photo-001"].update({
    "subject": "A park or open woodland in Britain with large oak trees and grass, on an ordinary day",
    "pedagogical_constraint": "This is our own kind of place, the British weather the lesson starts from; it must look like Britain, not somewhere tropical.",
    "teaching_requirement": "Children see the kind of trees that grow in Britain's weather, as the starting point for the idea that weather decides what grows.",
    "load_bearing_evidence": ["large oak or similar broadleaf trees", "grass", "an ordinary British park or woodland scene"],
    "use": "slide", "essential": True,
    "filename": "unsplash/british-park-oak-trees.jpg",
    "acquisition_mode": "ordinary-real", "source_profile": "unsplash-then-wikimedia",
    "fallback_action": "ai", "fallback_note": None,
    "generation_prompt": gp("A British park with large oak trees in full leaf and grass, mild daylight.",
                            ["palm trees or tropical plants", "people's faces close up", "buildings filling the frame"],
                            "A wide landscape view of the park with the trees clearly visible."),
})
ph["photo-002"].update({
    "subject": "A hot sandy desert such as the Sahara, with bare sand and only a few small, tough plants",
    "pedagogical_constraint": "The desert is shown as a biome where it hardly ever rains, so it must look dry, with almost no plants.",
    "teaching_requirement": "Children see that very little can grow where it hardly ever rains, the contrast that shows weather decides what grows.",
    "load_bearing_evidence": ["dry sand or rocky ground", "very few, small plants or none", "clear dry sky"],
    "use": "slide", "essential": True,
    "filename": "unsplash/hot-desert-sand.jpg",
    "acquisition_mode": "ordinary-real", "source_profile": "unsplash-then-wikimedia",
    "fallback_action": "ai", "fallback_note": None,
    "generation_prompt": gp("A hot sandy desert under a clear sky, with bare dunes and one or two small dry shrubs.",
                            ["an oasis with palm trees", "snow", "camels or people filling the frame"],
                            "A wide landscape view of the desert."),
})
ph["photo-003"].update({
    "subject": "Inside or at the edge of a dense tropical rainforest, with huge tall trees packed close together and thick green leaves",
    "pedagogical_constraint": "Shown beside the desert as the other biome, and on the word card for biome: it must look hot, wet and crowded with tall green trees.",
    "teaching_requirement": "Children see that where it is hot and rains nearly every day, huge trees grow close together and stay green.",
    "load_bearing_evidence": ["tall trees growing close together", "thick green leaves everywhere", "a damp, misty or wet look"],
    "use": "slide", "essential": True,
    "filename": "unsplash/tropical-rainforest-trees.jpg",
    "acquisition_mode": "ordinary-real", "source_profile": "unsplash-then-wikimedia",
    "fallback_action": "ai", "fallback_note": None,
    "generation_prompt": gp("A dense tropical rainforest with very tall trees close together, thick green leaves and a little mist.",
                            ["a single tree on its own", "autumn colours", "people or buildings"],
                            "A landscape view showing the height and closeness of the trees."),
})
ph["photo-004"].update({
    "subject": "A clear illustration of the Sun's rays reaching the Earth: rays hit the middle of the globe straight on and reach the top and bottom at a slant, spread out",
    "pedagogical_constraint": "Shows it happening: the Sun's rays hitting the middle of the Earth straight on and spreading out at a slant towards the top and the bottom, so the middle gets the strongest sunshine.",
    "teaching_requirement": "Children see why it is hot all year near the Equator: the sunshine there is the most direct and strongest.",
    "load_bearing_evidence": [
        "the Sun on one side with parallel rays coming from it",
        "rays hitting the middle of the Earth straight on",
        "rays reaching the top and bottom of the Earth at a slant and spread over a wider area",
        "the Earth drawn as a globe with land and sea",
    ],
    "use": "slide", "essential": True,
    "filename": "made/sun-rays-equator.png",
    "acquisition_mode": "controlled-ai", "source_profile": "none",
    "fallback_action": "unsatisfied",
    "fallback_note": "If no picture can be made, the slide shows the rainforest photograph as a stand-in and the teacher is told; a torch shone at a ball shows the same thing live.",
    "generation_prompt": {
        "physical_state": "Parallel rays travel from the Sun to the Earth; the band around the middle of the Earth faces the rays directly, while the rays reach the top and bottom at a shallow angle and spread out.",
        "must_avoid": ["readable text, letters or labels", "photographic realism", "the Sun drawn touching or overlapping the Earth", "rays bending or curving"],
        "text_rule": "no readable text, letters or labels",
        "composition": "A simple, clear science illustration on a plain background, landscape, with the Sun on the left and the Earth as a globe on the right.",
    },
})
ph["photo-005"].update({
    "subject": "The Amazon rainforest in Brazil seen from above, with the Amazon River or one of its big branches winding through endless forest",
    "pedagogical_constraint": "This is the real Amazon, shown on the slide that locates it; it must be a real photograph of the Amazon.",
    "teaching_requirement": "Children see how huge the Amazon rainforest is, with its river winding through it, while they learn where it is.",
    "load_bearing_evidence": ["forest stretching as far as the eye can see", "a wide river winding through the forest"],
    "use": "slide", "essential": False,
    "filename": "wikimedia/amazon-rainforest-from-above.jpg",
    "acquisition_mode": "authentic-real", "source_profile": "wikimedia-then-unsplash",
    "fallback_action": "omit",
    "fallback_note": "A made picture would claim to show the real Amazon when it does not. Without the photograph, the map on the same slide still shows where the Amazon is.",
    "generation_prompt": None,
})

PR.write_text(json.dumps(p, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("filled")
