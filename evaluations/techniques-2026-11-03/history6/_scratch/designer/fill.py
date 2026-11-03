import json, sys
WD = sys.argv[1]
LD = WD + "/lesson-design.json"
PR = WD + "/photo-requirements.json"
d = json.load(open(LD, encoding="utf-8"))
p = json.load(open(PR, encoding="utf-8"))

TS = "lesson-section/teaching-sequence/unit-"
NONE_ANSWER = {"kind": "none", "content": None, "acceptanceCondition": None, "delivery": "none"}

d["lesson"].update({
    "lo": "To explain how diseases spread and were treated.",
    "displayedLo": "To explain how diseases spread and were treated.",
    "durationMinutes": 45,
    "stickingPoint": "Children, like the Victorians, find it natural that a bad smell makes you ill, so they cannot see why burning tar failed until evidence shows cholera was in the drinking water.",
})

ORIENT = ("Teacher orientation: Children follow one true story, cholera in Soho, London, in 1854. They find out that Victorians blamed the bad smell and burned tar, "
          "decide what someone who blamed the bad air would and wouldn't do, then work like John Snow and decide which idea real evidence from 1854 fits, "
          "and finish by explaining why taking the handle off the Broad Street pump stopped cholera when burning tar did not. "
          "The tricky move is seeing that the brewery men breathed the same smelly air and still stayed well; it is taught in \"Bad air or dirty water?\". "
          "From the slides: both sorts run on the board, children putting each card's letter under its heading. "
          "To print: the two sort sheets, one between two, and the worksheet, which is the final task.")
d["teacherOrientation"] = ORIENT

# ---------- starter ----------
s = d["starter"]
s.update({
    "label": "Victorian children",
    "minutes": 5,
    "unlocks": "They have Victorian times and poor families' hard, crowded lives back in mind, which the opening of the first Teach stands on.",
    "thinking": "What do I remember about poor Victorian children and why they had to work?",
    "content": {
        "activity": "Who was the queen in Victorian times?\nDid the Victorians live before or after the Tudors?\nName one job a poor Victorian child might do.\nWhy did poor Victorian children go out to work?",
        "connection": "Retrieves the unit's earlier lessons on Victorian children's work and why their families needed it, which today's story of poor Victorian families in Soho builds on.",
        "format": "Four short recall questions, answered alone, then checked on the answer slide.",
    },
    "pupilInstruction": None,
    "taskStructure": None,
    "modellingState": None,
    "representationRefs": [], "successCriteriaRefs": [], "stickyKnowledgeRefs": [],
    "misconceptionRefs": [], "photoRefs": [],
    "speakerNotes": {
        "script": "Say to children: We've been finding out how children's lives have changed over time. Today we're going back to Victorian times, so let's warm up what we already know. Here are four quick questions. Have a go at all four on your own, then we'll check them together.",
        "teacherInfo": None,
        "lookFor": None,
    },
    "answer": {
        "kind": "exact",
        "content": "Queen Victoria.\nAfter the Tudors.\nFor example: working in a coal mine, working in a factory, or sweeping chimneys.\nTheir families needed the money.",
        "acceptanceCondition": "Accept any job taught earlier in the unit, such as a trapper in a mine, a mill or factory worker or a chimney sweep; for the last question accept any answer about the family needing what the child earned.",
        "delivery": "answer-slide",
    },
})

# ---------- vocabulary ----------
d["vocabulary"][0].update({
    "term": "disease",
    "definition": "A disease is an illness that stops your body working properly. Some diseases spread, which means they pass from one person to another.",
    "visual": {"kind": "photo", "photoRef": "photo-003"},
})
d["vocabulary"][1].update({
    "term": "treatment",
    "definition": "A treatment is what doctors give or do to help an ill person get better.",
    "visual": {"kind": "photo", "photoRef": "photo-008"},
})
d["trimmedVocabulary"] = [
    {"term": "bacteria", "reason": "Victorians did not know about germs, and the explanation children give today does not need them."},
    {"term": "cholera", "reason": "The name of the disease in today's story, explained in the sentence that brings it in rather than on a card."},
    {"term": "flu", "reason": "Not part of today's one story."},
    {"term": "infection", "reason": "Disease and spread carry the idea in words the class can hold; a third word adds load without a job."},
    {"term": "plague", "reason": "Tudor plague is a second story, left for another lesson."},
    {"term": "smallpox", "reason": "Not part of today's one story."},
    {"term": "vaccination", "reason": "Belongs to a lesson on how medicine later improved; nothing today uses it."},
    {"term": "virus", "reason": "Not part of today's story, and cholera is not caused by a virus."},
]
d["vocabularyIntroductions"] = [{
    "vocabularyRefs": ["vocab-001", "vocab-002"],
    "after": "lesson-section/starter/unit-001",
    "script": "Say to children: Two words are about to come up in our story. The first is disease. A disease is an illness that stops your body working properly. Some diseases spread, which means they pass from one person to another, like a cold going round a class. Look at this picture: this person is ill in bed. Quick one: is a broken arm a disease? No, it's an injury, it isn't an illness, and you can't catch it from someone. The second word is treatment. A treatment is what doctors give or do to help an ill person get better. In this picture, someone is being helped to drink. Listen out for both words in the story.",
}]

# ---------- SC, sticky, misconceptions ----------
d["successCriteria"][0].update({
    "type": "steps",
    "drawLive": False,
    "content": {"steps": [
        "Say how cholera <<really>> spread.",
        "Say why <<burning tar>> didn't stop it.",
        "Say why <<taking the handle off>> worked.",
    ]},
})
d["stickyKnowledge"][0]["text"] = "Victorians thought bad air caused diseases like cholera."
d["stickyKnowledge"][1]["text"] = "John Snow showed that cholera spread through dirty drinking water."
d["misconceptions"][0].update({
    "belief": "A bad smell is what makes you ill, so cleaning the air stops a disease like cholera.",
    "correctiveFact": "Cholera spread through dirty drinking water, so only stopping people drinking it worked.",
    "strategy": "Met as the Victorians' own belief in the first Teach, used in the first sort, broken by real evidence in the second sort, retested in the final explanation.",
    "reason": "It feels like common sense to children today, and a child still holding it cannot explain why the tar failed.",
})
d["misconceptions"][1].update({
    "belief": "The Victorians were silly to blame a smell.",
    "correctiveFact": "Blaming the smell made sense to them: the illness was worst where the smell was worst, and the water looked clear.",
    "strategy": "One line on the first Teach board giving the Victorians' own reasons, said once where the knowledge makes the wrong idea visible.",
    "reason": "History's commonest misconception; it gets one clean touch so the lesson stays on the story.",
})

seq = d["teachingSequence"]

# ---------- unit-001 teach ----------
u = seq[0]
u.update({
    "label": "Why did Victorians blame the smell?",
    "minutes": 9,
    "unlocks": "They know Victorians blamed bad air and burned tar, which the next sort uses on new actions and the final task needs to say why tar failed.",
    "thinking": "If nobody could see anything wrong with the water, why would people blame the smell?",
    "content": {
        "headline": "In Victorian London, poor families lived crowded together in dirty, smelly streets.",
        "explanation": "Lots of families lived squashed together in small houses. There were no toilets that flushed, so toilet waste and rotting rubbish piled up in the yards. It smelled terrible.\nNobody had a tap at home. Families filled buckets at a pump in the street: you pushed the handle up and down, and water came out. Fetching the water was often a child's job.\nIn 1854, a disease called cholera spread through Soho, a part of London. It made people very ill in their stomachs, very fast. More than 500 people died in ten days, many of them children. Doctors had no treatment that worked.\nPeople thought the smell itself was making them ill. It made sense to them: the illness was worst where the smell was worst, and the water looked clear. So they burned tar in the streets, because they thought its thick smoke would clean the air.",
        "takeaway": {"kind": "sticky", "ref": "sk-001"},
        "teachingText": None,
        "keyQuestions": ["Why do you think people blamed the smell?"],
    },
    "pupilInstruction": None,
    "taskStructure": None,
    "modellingState": None,
    "representationRefs": [], "successCriteriaRefs": [], "stickyKnowledgeRefs": [],
    "misconceptionRefs": ["mc-001", "mc-002"],
    "photoRefs": ["photo-001", "photo-002", "photo-003", "photo-004"],
    "speakerNotes": {
        "script": ("Say to children: Poor Victorian families, like the ones we've been finding out about, often lived squashed together in towns and cities. Today we're going to one part of London called Soho, in the year 1854. "
                   "Look at this picture. Lots of families lived in small houses, all crammed together, sometimes a whole family in one room. There were no toilets that flushed like ours. The toilet waste and the rotting rubbish piled up in the yards outside, and the whole place smelled terrible. "
                   "Nobody had a tap at home either. If you wanted water to drink or to cook with, you took a bucket to a pump in the street. You pushed the handle up and down, and the water came out. Fetching the water was often a child's job, so think of the children we've met in this topic doing that every single day. "
                   "Then, in 1854, a disease called cholera spread through Soho. Cholera made people very ill in their stomachs, and it happened really fast. Someone could be well in the morning and very ill by the evening. More than 500 people died in just ten days, and many of them were children. The doctors had no treatment that worked. "
                   "So what did people think was causing it? Why do you think people blamed the smell? Talk to your partner. "
                   "Lots of you thought of the smell. The Victorians did too: they thought the smell itself was making people ill. And it made sense to them. The illness was worst in the streets where the smell was worst, and when they looked at the water, it looked clear. They had no way of seeing anything wrong with it. "
                   "So they burned tar in the streets. Tar is thick, black, sticky stuff that burns with lots of smoke, and they thought the smoke would clean the air. Victorians thought bad air caused diseases like cholera."),
        "teacherInfo": "A child who says the Victorians were stupid to blame a smell has missed why it made sense: point at the yard picture and ask where the smell was worst and where people were ill. The figure is John Snow's own count of more than 500 deaths in ten days near Broad Street.",
        "lookFor": None,
    },
    "answer": NONE_ANSWER,
})

# ---------- unit-002 do (sort) ----------
u = seq[1]
u.update({
    "label": "What would you do if you blamed the smell?",
    "minutes": 4,
    "unlocks": "They have found two sensible actions, boiling water and leaving the pump, that the bad-air idea never suggests, which opens John Snow's idea in the next Teach.",
    "thinking": "Does this get rid of the bad air, or is it about something else?",
    "content": {
        "activity": "Pairs sort five things a Victorian family could do by whether someone who blamed the bad air would try them.",
        "format": None,
        "task": "You blame the bad air for cholera. Which of these would you try?",
    },
    "pupilInstruction": "Put each card's letter under the heading it fits.",
    "taskStructure": {
        "kind": "sort",
        "groups": [
            {"id": "group-001", "label": "If you blamed the bad air, you would try this."},
            {"id": "group-002", "label": "If you blamed the bad air, you wouldn't think of this."},
        ],
        "items": [
            {"id": "item-001", "label": "Sweep the rotting rubbish out of the yard.", "detail": None, "photoRef": None},
            {"id": "item-002", "label": "Boil your drinking water before you drink it.", "detail": None, "photoRef": None},
            {"id": "item-003", "label": "Throw buckets of water over the yard to wash the dirt away.", "detail": None, "photoRef": None},
            {"id": "item-004", "label": "Stop drinking water from the pump in the smelly street.", "detail": None, "photoRef": None},
            {"id": "item-005", "label": "Move away to the countryside, where nothing smells bad.", "detail": None, "photoRef": None},
        ],
        "handling": {"kind": "sheet", "per": "pair", "groupCount": None, "where": "One sheet between two, handed out straight after the tar is taught."},
    },
    "modellingState": None,
    "representationRefs": [], "successCriteriaRefs": [], "stickyKnowledgeRefs": ["sk-001"],
    "misconceptionRefs": [], "photoRefs": [],
    "speakerNotes": {
        "script": ("Say to children: Now I want you to be a Victorian for a minute. You blame the bad air for cholera. Your street smells terrible, and people are getting ill. Here are five things a family could do. "
                   "With your partner, decide for each card: would you try it, if you blamed the bad air? Or wouldn't you even think of it? For each one, ask yourself: is this getting rid of the smell, or is it about something else? "
                   "Let's check. Sweeping the rubbish, washing the yard and moving away to the countryside are all about getting rid of the bad smell, so a Victorian who blamed the air would try them. "
                   "Boiling the water and not drinking from the pump aren't about the air at all, even though the pump is in a smelly street. If you blamed the air, you wouldn't even think of them. Keep those two cards in your head."),
        "teacherInfo": "If printed: the sort sheet, one between two, as the task is set. Without it, pairs read the board and put each card's letter under its heading. A child who puts the washing card under the second heading is sorting by the word water: ask what the water is being used to get rid of.",
        "lookFor": "Look for: the washing card with the bad-air actions, and the smelly-street pump card with the ones nobody would think of.",
    },
    "answer": {
        "kind": "exact",
        "content": None,
        "structure": {"kind": "sort", "placements": [
            {"itemRef": "item-001", "groupRef": "group-001"},
            {"itemRef": "item-002", "groupRef": "group-002"},
            {"itemRef": "item-003", "groupRef": "group-001"},
            {"itemRef": "item-004", "groupRef": "group-002"},
            {"itemRef": "item-005", "groupRef": "group-001"},
        ]},
        "acceptanceCondition": "Accept the countryside card under the second heading only if the child's reason is about getting away from the pump water; Victorians who moved away did it to escape the bad air.",
        "delivery": "teacher-only",
    },
    "doMode": "quick",
    "levels": {
        "printed": {"form": "sort", "per": "pair", "what": "The five cards and the two headings, with a box under each heading for the cards' letters."},
        "boardOnlyBecause": None,
        "realThings": None,
    },
    "use": {
        "develops": "Explaining what people in the past did from what they believed at the time, history's central move: children work out which actions follow from the bad-air idea.",
        "new": "five things a Victorian family could do that the teaching never showed: sweeping the rubbish, washing the yard, moving to the countryside, boiling the water and leaving the pump",
        "wrong": "Washing the yard uses water, so someone who blamed the air wouldn't do it, and the pump card says smelly, so they would.",
        "rehearsal": None,
        "practice": None,
    },
})

# ---------- unit-003 teach ----------
u = seq[2]
u.update({
    "label": "What did John Snow think?",
    "minutes": 4,
    "unlocks": "They know John Snow blamed dirty water and that the deaths crowded round one pump, which the evidence sort needs to test the two ideas.",
    "thinking": "If the water from one pump was making people ill, where would most of the deaths be?",
    "content": {
        "headline": "A doctor called John Snow thought cholera came from dirty water, not bad air.",
        "explanation": "He noticed that cholera made people ill in their stomachs, not their chests. When you breathe something bad in, it's your chest that suffers. So he thought people must be swallowing something.\nHe found out where everyone who died had lived. Later he showed it on this map. Each little black mark is one person who died.\nMost of the marks are packed round one water pump, on Broad Street.",
        "takeaway": None,
        "teachingText": None,
        "keyQuestions": ["Where are most of the marks on the map?"],
    },
    "pupilInstruction": None,
    "taskStructure": None,
    "modellingState": None,
    "representationRefs": [], "successCriteriaRefs": [], "stickyKnowledgeRefs": [],
    "misconceptionRefs": [], "photoRefs": ["photo-005", "photo-006"],
    "speakerNotes": {
        "script": ("Say to children: Think about those two cards nobody who blamed the air would try: boiling the water, and not drinking from the pump. One doctor did think about the water. His name was John Snow, and he lived and worked in London. "
                   "He thought cholera came from dirty water, not bad air. Here's why. He noticed that cholera made people ill in their stomachs, not their chests. When you breathe something bad in, like smoke, it's your chest that suffers: you cough. So he thought people must be swallowing something. "
                   "He went round Soho and found out where everyone who died had lived. Later he showed it on this map. Each little black mark is one person who died. Where are most of the marks on the map? "
                   "Yes, they're packed round one water pump, on Broad Street. That's the pump lots of families got their water from."),
        "teacherInfo": "Snow drew this map after the outbreak, from the list of deaths he had collected, which is why the board says later. The pump is marked on the map as PUMP on Broad Street.",
        "lookFor": None,
    },
    "answer": NONE_ANSWER,
})

# ---------- unit-004 do (evidence sort) ----------
u = seq[3]
u.update({
    "label": "Bad air or dirty water?",
    "minutes": 7,
    "unlocks": "They have used evidence to show only the water idea fits the brewery men and Susannah Eley, which the final explanation turns into why the handle worked.",
    "thinking": "If bad air caused cholera, what should have happened to these people, and what really happened?",
    "content": {
        "activity": "Pairs sort three true pieces of evidence from 1854 by which idea each one fits, and say what in each card decided it.",
        "format": None,
        "task": "Which idea does each card fit?\n\nWhat in the card shows you?",
    },
    "pupilInstruction": "Put each card's letter under the heading it fits.",
    "taskStructure": {
        "kind": "sort",
        "groups": [
            {"id": "group-001", "label": "It fits the bad-air idea."},
            {"id": "group-002", "label": "It fits John Snow's dirty-water idea."},
            {"id": "group-003", "label": "It fits both ideas."},
        ],
        "items": [
            {"id": "item-001", "label": "The brewery men", "detail": "More than 70 men worked at a brewery, a place where beer was made, right next to the Broad Street pump. They breathed the same smelly air as everyone else. They drank beer made at the brewery, not water from the pump. None of them died of cholera.", "photoRef": None},
            {"id": "item-002", "label": "The smelly streets", "detail": "Most of the people who died lived in the crowded, smelly streets around Broad Street.", "photoRef": None},
            {"id": "item-003", "label": "Susannah Eley", "detail": "Susannah Eley lived miles away in Hampstead, where the air smelled fresh. She liked the taste of the water from the Broad Street pump, so a bottle of it was taken to her house. She caught cholera and died.", "photoRef": None},
        ],
        "handling": {"kind": "sheet", "per": "pair", "groupCount": None, "where": "One sheet between two, handed out straight after John Snow's map."},
    },
    "modellingState": None,
    "representationRefs": [], "successCriteriaRefs": [], "stickyKnowledgeRefs": [],
    "misconceptionRefs": ["mc-001"], "photoRefs": [],
    "speakerNotes": {
        "script": ("Say to children: Most doctors still didn't believe John Snow. They still thought it was the bad air. So let's look at some evidence he found, the way a historian would. These are three true things from 1854. "
                   "A brewery is a place where beer is made. Hampstead is a part of London miles away from Soho, out where the air was fresh. "
                   "For each card, ask yourself two things. If bad air caused cholera, what should have happened? And what really happened? Then decide which idea it fits: the bad air, John Snow's dirty water, or both. Tell your partner the words in the card that decided it. "
                   "Let's check. The brewery men breathed the same smelly air as everyone else, but they didn't drink the pump water, and none of them died. That only fits the dirty-water idea. "
                   "Susannah Eley breathed fresh air, but she drank the Broad Street water, and she died. That only fits the dirty-water idea too. "
                   "And the smelly streets? Those streets were round the pump, so the people there breathed the smell and drank the water. That card fits both ideas, so it can't tell them apart. That's why John Snow needed the other two."),
        "teacherInfo": "If printed: the evidence sheet, one between two, as the task is set. Without it, pairs read the cards on the board and put each letter under its heading. A child who puts the brewery men under bad air has seen the smelly air and stopped: ask what the men drank. The brewery had its own well; Susannah Eley's sons had Broad Street water taken to her because she liked its taste.",
        "lookFor": "Look for: the brewery men placed by what they drank, not where they worked; the smelly streets under both ideas.",
    },
    "answer": {
        "kind": "exact",
        "content": None,
        "structure": {"kind": "sort", "placements": [
            {"itemRef": "item-001", "groupRef": "group-002"},
            {"itemRef": "item-002", "groupRef": "group-003"},
            {"itemRef": "item-003", "groupRef": "group-002"},
        ]},
        "acceptanceCondition": "A child who puts the smelly streets under bad air has a true reason (the streets did smell): take the reason, then ask where the pump was, which moves the card to both ideas.",
        "delivery": "teacher-only",
    },
    "doMode": "deeper",
    "levels": {
        "printed": {"form": "sort", "per": "pair", "what": "The three evidence cards and the three headings, with a box under each heading for the cards' letters."},
        "boardOnlyBecause": None,
        "realThings": None,
    },
    "use": {
        "develops": "Using evidence to tell two explanations apart, as historians and John Snow did: children work out what each idea predicts and check it against what really happened in 1854.",
        "new": "three true pieces of evidence from 1854 the lesson has not shown: the brewery men, Susannah Eley in Hampstead, and the smelly streets around Broad Street",
        "wrong": "The brewery men worked right next to the pump in the smelly air, so that card fits the bad-air idea.",
        "rehearsal": None,
        "practice": None,
    },
})

# ---------- unit-005 teach ----------
u = seq[4]
u.update({
    "label": "What stopped cholera at the pump?",
    "minutes": 4,
    "unlocks": "They know taking the handle off stopped people drinking the pump's water, which with the tar is what the final explanation needs.",
    "thinking": "Why would taking a handle off a pump stop people catching cholera?",
    "content": {
        "headline": "John Snow got the handle taken off the Broad Street pump, so nobody could drink its dirty water.",
        "explanation": "He told the people in charge of the streets what he had found, and on 8 September 1854 they took the handle off. Soon, people stopped catching cholera from that pump.\nToday our tap water is cleaned before it reaches us. The treatment for cholera is lots of clean water with a little salt and sugar, to put back the water the body has lost.",
        "takeaway": {"kind": "sticky", "ref": "sk-002"},
        "teachingText": None,
        "keyQuestions": ["What is missing from this pump?"],
    },
    "pupilInstruction": None,
    "taskStructure": None,
    "modellingState": None,
    "representationRefs": [], "successCriteriaRefs": [], "stickyKnowledgeRefs": [],
    "misconceptionRefs": [], "photoRefs": ["photo-007", "photo-008"],
    "speakerNotes": {
        "script": ("Say to children: Look at this pump. What is missing from it? The handle. Remember, you pushed the handle up and down to get the water out. "
                   "John Snow told the people in charge of the streets what he had found, and on 8 September 1854 they took the handle off the Broad Street pump. With no handle, nobody could get any water out of it, so nobody could drink its dirty water. Soon, people stopped catching cholera from that pump. "
                   "John Snow showed that cholera spread through dirty drinking water. It took years for everyone to believe him, but he was right. "
                   "Today our tap water is cleaned before it reaches us, so children here don't catch cholera from it. And if someone somewhere in the world does catch cholera, the treatment is simple: lots of clean water with a little salt and sugar in it, to put back the water their body has lost."),
        "teacherInfo": "Fewer people were falling ill by the time the handle came off, partly because many had left Soho; Snow said so himself. The pump in the photo is a copy, kept without a handle in Soho today to remember him.",
        "lookFor": None,
    },
    "answer": NONE_ANSWER,
})

# ---------- unit-006 practise ----------
STRONG = ("Cholera spread through dirty water from the Broad Street pump. People caught it when they drank the water.\n"
          "Burning tar didn't stop it, because the smoke only changed the air, and cholera wasn't in the air.\n"
          "Taking the handle off worked, because nobody could drink the dirty water any more.")
u = seq[5]
u.update({
    "label": "Why did the handle work when the tar didn't?",
    "minutes": 12,
    "unlocks": None,
    "thinking": "What did the tar change, what did taking the handle off change, and which one stopped what was really spreading cholera?",
    "content": {
        "activity": "Each child explains in writing why taking the handle off the pump stopped cholera when burning tar did not, after seeing a good and a weak answer to this question and telling a partner first.",
        "format": "a short written explanation",
        "task": "Why did taking the handle off the pump stop cholera, when burning tar didn't?",
        "launch": {
            "established": None,
            "goodLooksLike": {
                "strong": {"words": STRONG, "show": None},
                "weak": {"words": "The Victorians burned tar in the streets. Then they took the handle off the pump. After that, people stopped getting cholera.", "show": None},
                "difference": "The good one says why, using because, for the tar and for the handle.",
            },
            "steps": [],
        },
        "reasoningWords": ["dirty water", "the air", "because"],
        "rehearsal": {
            "sayIt": "Tell your partner why the tar didn't stop cholera, then why taking the handle off did.",
            "partnerAsks": "Why did that stop people getting ill?",
        },
    },
    "pupilInstruction": None,
    "taskStructure": None,
    "modellingState": None,
    "representationRefs": [], "successCriteriaRefs": ["sc-001"], "stickyKnowledgeRefs": [],
    "misconceptionRefs": ["mc-001"], "photoRefs": [],
    "speakerNotes": {
        "script": ("Say to children: This is the big question our whole story has been building to. Why did taking the handle off the pump stop cholera, when burning tar didn't? "
                   "Here are two answers to that question. Read them both with me. The second one tells us what happened: tar, then the handle, then people got better. But it never tells us why. "
                   "Now look at the first one. Find the word because. Because the smoke only changed the air, and cholera wasn't in the air. Because nobody could drink the dirty water any more. Those are the parts that explain. "
                   "When I write this, I know two things happened, the tar and the handle. If I just list them, my reader has to guess why one worked and the other didn't. So for each one, I say what it changed, and whether that was the thing spreading cholera. "
                   "Now I'm taking both answers off the board. Tell your partner why the tar didn't stop cholera, then why taking the handle off did. Partners, ask: why did that stop people getting ill? Then write your own explanation."),
        "teacherInfo": "If printed: the worksheet, one each, once the two answers come off the board. Without it, children answer the question on the board. A child still holding the bad-air idea says the tar did not work without saying why: ask what the smoke changed. This is written with the modelled answer in mind, so it is not unaided evidence; \"Bad air or dirty water?\" is.",
        "lookFor": "Look for: water named as how cholera spread; if a child jumps from the handle to getting better, ask what it stopped people doing.",
    },
    "answer": {
        "kind": "model",
        "content": STRONG,
        "acceptanceCondition": "Accept any explanation that says cholera spread through the drinking water (not the air), that the tar only changed the air, and that taking the handle off stopped people drinking the pump's water. Written with a good answer to this same question in mind, so it shows each child can explain the case with support, not unaided.",
        "delivery": "answer-slide",
    },
    "doMode": "deeper",
    "levels": {
        "printed": None,
        "boardOnlyBecause": "The printed version of this task is the lesson's worksheet, so no separate sheet is made for it.",
        "realThings": None,
    },
})

d["ending"]["reason"] = "The final explanation already draws the whole story together, and \"Bad air or dirty water?\" was the fresh-case reasoning on new evidence; an Apply would ask for the same explanation again."

# ---------- worksheet ----------
w = d["worksheet"]
w.update({
    "taskUnitId": TS + "006",
    "activityArchitecture": {
        "coreActionAndEvidence": "A one-answer objective, so the sheet is the final task printed: each child writes one explanation of why taking the handle off the pump stopped cholera when burning tar did not, which shows how cholera spread and how people tried to stop it.",
        "amount": "One substantial written explanation.",
        "variationAndBoundaryPlan": "The same question as the board task, answered as the proof; Below and Greater Depth are the Adaptation Designer's versions of this same question.",
        "organisation": "A short reminder of what happened in Soho, the question, the three words to use, and ruled lines to write on.",
    },
    "demand": "This one-answer sheet replaces the final task: children write their explanation on it instead of answering from the board.",
    "stickyKnowledgeRefs": [],
    "fitPriority": {
        "protected": ["the question", "the word list: dirty water, the air, because", "room for a three or four sentence explanation"],
        "preAuthorisedRemoval": ["the two-sentence reminder of what happened in Soho, which the board also shows"],
    },
    "centralWriteOnVisualException": None,
    "contentBlocks": [{
        "id": "ws-q-001",
        "kind": "question",
        "pupilPrompt": "In 1854, people in Soho burned tar in the streets to stop cholera. Then John Snow got the handle taken off the Broad Street pump.\n\nWhy did taking the handle off the pump stop cholera, when burning tar didn't?",
        "responseForm": "written-explanation",
        "responseFormReason": "The because-links are the evidence: only the child's own words show whether they know cholera was in the water, not the air.",
        "response": "An explanation in the child's own words, on about eight ruled lines.",
        "support": "Use these words: dirty water, the air, because",
        "visualRequirements": "",
        "representationRefs": [],
        "stickyKnowledgeRefs": [],
        "photoRefs": [],
        "answer": {
            "kind": "model",
            "content": STRONG,
            "acceptanceCondition": "Accept any explanation that says cholera spread through the drinking water (not the air), that the tar only changed the air, and that taking the handle off stopped people drinking the pump's water.",
            "delivery": "teacher-only",
        },
    }],
    "answerKeyMode": "required",
})
w["sheetShape"]["reason"] = "One question with room to explain: the history sheet shape for a lesson whose objective is one good answer."

d["resourceOpportunities"] = {
    "stickIn": {"decision": "candidate", "sourceUnitIds": [TS + "002", TS + "004"], "reason": "Both sorts are printed as sort sheets, one between two, so the teacher can run them at tables as well as from the board."},
    "workingWall": {"decision": "uncertain", "sourceUnitIds": [], "reason": "This is the last lesson of the unit, so a wall sheet would be up only briefly; the two ideas and John Snow's map could still serve as a reminder."},
}

d["slideDesignNotes"] = [
    "Pace the Teach in unit-001 one picture per moment: the crowded houses with photo-001, the street pump with photo-002, the cholera line with photo-003, and the bad-air line with photo-004; the key question sits before the bad-air line.",
    "Show John Snow's map (photo-006) large in unit-003 so the class can see the marks crowding round the pump; the key question points at it.",
    "In unit-004 each evidence card keeps its name and its detail together as one card.",
]

d["flagsForTeacher"] = [
    "The plan has three units, each with a Lesson 6. I designed Lesson 6 of \"How have children's lives changed?\" (diseases and how they were treated), which follows the leisure lesson.",
    "Left for another day from the plan's lesson: Tudor plague and the plague doctor, ranking reasons diseases spread, and matching treatment cards for other diseases. The lesson tells one story, cholera in 1854, properly.",
]

json.dump(d, open(LD, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# ---------- photos ----------
def gp(state, avoid, comp, text="no readable text, labels, logos or branding"):
    return {"physical_state": state, "must_avoid": avoid, "text_rule": text, "composition": comp}

PAST_AVOID = ["photographic realism", "modern buildings, cars or clothes", "readable words or signs"]
photos = [
    dict(subject="A crowded, dirty court or street in Victorian London where poor families lived, as a picture made at the time (an engraving or drawing from about 1840 to 1875), with a modern illustration only as second best",
         pedagogical_constraint="Children look at it while the teacher describes how crowded and dirty the houses and yards were.",
         teaching_requirement="Picture the crowded, dirty streets of Victorian London where cholera spread.",
         load_bearing_evidence=["houses crammed close together", "a dirty yard or narrow street", "poor Victorian people living there"],
         use="slide", essential=True, filename="wikimedia/victorian-london-crowded-court.jpg",
         acquisition_mode="ordinary-real", source_profile="wikimedia-then-unsplash", fallback_action="ai",
         fallback_note="If made, it is an artist's picture of a Victorian street, not a picture from the time.",
         generation_prompt=gp("A crowded courtyard in Victorian London around 1850: tall run-down houses close together, rubbish in the yard, poorly dressed adults and children.", PAST_AVOID, "A drawing or engraving-style picture, landscape, showing the whole crowded yard.")),
    dict(subject="A street water pump in Victorian times with people or children fetching water in buckets or jugs, as a picture made at the time (an engraving, drawing or early photograph), with a modern illustration only as second best",
         pedagogical_constraint="Shows how families got water: from a pump with a handle in the street, not a tap at home.",
         teaching_requirement="Picture families, often children, fetching water from a street pump by working its handle.",
         load_bearing_evidence=["a hand pump with a handle in a street", "people filling buckets or jugs at it"],
         use="slide", essential=True, filename="wikimedia/victorian-street-pump-fetching-water.jpg",
         acquisition_mode="ordinary-real", source_profile="wikimedia-then-unsplash", fallback_action="ai",
         fallback_note="If made, it is an artist's picture of a Victorian street pump, not a picture from the time.",
         generation_prompt=gp("A cast-iron hand pump with a long handle in a Victorian London street; a child pushes the handle while another holds a bucket under the spout.", PAST_AVOID, "A drawing or engraving-style picture, landscape, pump and children clearly visible.")),
    dict(subject="A person very ill in bed in Victorian times, being looked after, as a picture made at the time (an engraving or drawing), with a modern illustration only as second best",
         pedagogical_constraint="Shows what being very ill with a disease looked like; calm and suitable for Year 4, with nothing frightening.",
         teaching_requirement="See that cholera made people very ill; also the picture for the word disease.",
         load_bearing_evidence=["a person lying ill in bed", "someone looking after them"],
         use="slide", essential=True, filename="wikimedia/victorian-person-ill-in-bed.jpg",
         acquisition_mode="ordinary-real", source_profile="wikimedia-then-unsplash", fallback_action="ai",
         fallback_note="If made, it is an artist's picture of an ill person in Victorian times.",
         generation_prompt=gp("A Victorian room: an adult lies ill in a simple bed, pale and tired, while a woman sits beside them holding a cup.", PAST_AVOID + ["skeletons, death or anything frightening"], "A drawing or engraving-style picture, landscape, the bed and both people visible.")),
    dict(subject="Tar or a barrel of tar burning in a Victorian street to clean the air during a cholera outbreak, giving thick black smoke, as a picture made at the time (an engraving or drawing), with a modern illustration only as second best",
         pedagogical_constraint="Shows what Victorians did because they blamed bad air: burning tar to make thick smoke in the street.",
         teaching_requirement="Picture people burning tar in the street because they thought the smoke would clean the air.",
         load_bearing_evidence=["a fire or barrel burning in a street", "thick dark smoke rising", "Victorian buildings or people"],
         use="slide", essential=True, filename="wikimedia/victorian-street-tar-burning.jpg",
         acquisition_mode="ordinary-real", source_profile="wikimedia-then-unsplash", fallback_action="ai",
         fallback_note="If made, it is an artist's picture of tar burning in a Victorian street, not a picture from the time.",
         generation_prompt=gp("A Victorian London street around 1850: a barrel of tar burns on the ground with thick black smoke rising between the houses, and a few people stand nearby.", PAST_AVOID, "A drawing or engraving-style picture, landscape, the burning barrel and its smoke in the middle.")),
    dict(subject="Portrait of Dr John Snow, the London doctor, from the 1850s",
         pedagogical_constraint="This is John Snow, the real doctor the lesson is about.",
         teaching_requirement="Recognise John Snow as a real person, a London doctor in 1854.",
         load_bearing_evidence=["a recognisable portrait of John Snow"],
         use="slide", essential=True, filename="wikimedia/john-snow-portrait.jpg",
         acquisition_mode="authentic-real", source_profile="wikimedia-only", fallback_action="unsatisfied",
         fallback_note="A made portrait would be a lie about what the real John Snow looked like.",
         generation_prompt=None),
    dict(subject="John Snow's original 1854 map of cholera deaths around Broad Street, Soho, London, with the deaths shown as small black marks and the Broad Street pump marked",
         pedagogical_constraint="Children find from it where most of the deaths crowded, so the black marks round the Broad Street pump must be clear at slide size.",
         teaching_requirement="See that most of the deaths were packed round one water pump on Broad Street.",
         load_bearing_evidence=["the street plan of Soho around Broad Street", "small black marks for the people who died", "the marks crowded round the Broad Street pump", "the pump marked on the map"],
         use="slide", essential=True, filename="wikimedia/john-snow-cholera-map-1854.jpg",
         acquisition_mode="authentic-real", source_profile="wikimedia-only", fallback_action="unsatisfied",
         fallback_note="A made map would be a fake of the real source the class reads the deaths from.",
         generation_prompt=None),
    dict(subject="The copy of the Broad Street water pump kept without a handle in Broadwick Street, Soho, London, today, or another old black cast-iron street pump with its handle removed",
         pedagogical_constraint="The missing handle is what children notice, so the pump must clearly have no handle.",
         teaching_requirement="See that with no handle nobody could get water out of the pump.",
         load_bearing_evidence=["an old black cast-iron street pump", "no handle on the pump"],
         use="slide", essential=True, filename="wikimedia/broad-street-pump-no-handle.jpg",
         acquisition_mode="ordinary-real", source_profile="wikimedia-then-unsplash", fallback_action="ai",
         fallback_note="If made, it is a picture of an old street pump with no handle, not the real Soho pump.",
         generation_prompt=gp("An old black cast-iron street water pump standing on a pavement, with a spout but no handle, where the handle has been taken off.", ["a handle on the pump", "people", "readable words or plaques"], "A clear photograph-style picture, the whole pump in the middle of the frame.")),
    dict(subject="A nurse or carer helping an ill adult in bed to drink from a cup, today",
         pedagogical_constraint="Shows treatment as care that helps an ill person get better; calm and kind, with nothing frightening.",
         teaching_requirement="Picture treatment: helping an ill person get better, here by giving them a drink.",
         load_bearing_evidence=["an ill adult in bed or a chair", "a nurse or carer helping them drink from a cup"],
         use="slide", essential=True, filename="unsplash/nurse-helping-patient-drink.jpg",
         acquisition_mode="ordinary-real", source_profile="unsplash-then-wikimedia", fallback_action="ai",
         fallback_note=None,
         generation_prompt=gp("A nurse in a plain uniform gently holds a cup while an ill adult sitting up in a hospital bed drinks from it.", ["needles, drips or blood", "readable words or logos"], "A clear photograph-style picture, landscape, both people and the cup visible.")),
]
p["lesson_name"] = "How diseases spread and were treated"
for obj, vals in zip(p["photos"], photos):
    obj.update(vals)
json.dump(p, open(PR, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("FILLED")
