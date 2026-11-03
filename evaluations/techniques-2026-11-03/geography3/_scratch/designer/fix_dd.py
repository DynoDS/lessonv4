f = r'C:/Users/Daniel/Projects/lessonv4/evaluations/techniques-2026-11-03/geography3/design-decisions.md'
s = open(f, encoding='utf-8').read()

def rep(a, b):
    global s
    assert a in s, a[:80]
    s = s.replace(a, b)

rep("New things this asks that child to hold: Indigenous peoples, community, more than 10,000 years, many groups living in different ways (villages, towns, a city), the river for water and fish, the river as the road, villages beside rivers, homes from wood and palm leaves, nuts and small gardens, medicine from plants. Ten things,",
    "New things this asks that child to hold: Indigenous peoples, more than 10,000 years, many groups living in different ways (villages, towns, a city), the river for water and fish, the river as the road, villages beside rivers, homes from wood and palm leaves, nuts and small gardens, medicine from plants. Nine things,")
rep("The people who live here are an Indigenous community. A community is a group of people who live in the same place and help each other. Indigenous peoples are",
    "The people who live here are Indigenous people. Indigenous peoples are")
rep("So many Indigenous communities live next to rivers, because the river gives them water, fish and a way to travel.\n> (Pairs",
    "So many Indigenous villages are built next to rivers, because the river gives them water, fish and a way to travel.\n> (Pairs")
rep("Read back as the child who understands least: the two new words are said with their meaning in the sentence that brings them in (community, then Indigenous peoples, on the village they are looking at).",
    "Read back as the child who understands least: the new word is said with its meaning in the sentence that brings it in (Indigenous peoples, on the village they are looking at). `Community` was in the first draft and is gone: `village` says it in a word the class already has.")
rep("""### Vocabulary: community and Indigenous peoples (one slide, both words)

`A community is a group of people who live in the same place, like a village, and help each other.` Picture: the riverside village the next Teach shows. `Indigenous peoples are the groups of people whose families were the first to live in a place, long before anyone else arrived.` Picture: Indigenous people in their own village today. Shown together, straight before the Teach whose first board uses both.""",
    """### Vocabulary: Indigenous peoples

`Indigenous peoples are the groups of people whose families were the first to live in a place, long before anyone else arrived.` Picture: Indigenous people in their own village today. Shown straight before the Teach whose first board uses it.""")
rep("Then: `This village is an Indigenous community, beside a river in the forest.` / `Indigenous peoples are the groups whose families were here first, long before anyone else arrived.` Then, with the photograph of Manaus: `There are hundreds of different Indigenous groups in the Amazon, and they don't all live the same way.` / `Some live in villages like this one. Some live in towns, or in Manaus, a big city in the middle of the forest.`",
    "Then: `The people in this village are one of the Amazon's Indigenous peoples. Their families were here first, long before anyone else arrived.` Then, with the photograph of Manaus: `There are hundreds of different Indigenous groups in the Amazon, and they don't all live the same way. Some live in villages like this one. Some live in towns, or in Manaus, a big city in the forest.`")
rep("`It's full of fish to catch and eat. The Amazon has more kinds of fish than any other river in the world.` Then, with a photograph of a canoe on the river: `There are no roads through most of the forest, because the trees grow too thick.` / `So the river is their road. People paddle canoes and drive small boats to go fishing, visit other villages and reach the towns.` Star line: `Many Indigenous communities live next to rivers, because the river gives them water, fish and a way to travel.`",
    "`It's full of fish to catch and eat.` Then, with a photograph of a canoe on the river: `There are no roads through most of the forest, because the trees grow too thick. So the river is their road, for canoes and small boats.` Star line: `Many Indigenous villages are built next to rivers, because the river gives them water, fish and a way to travel.` (The most-kinds-of-fish fact and where the boats go are said in the script.)")
rep("two places marked: A on the bank of the river, B deep in the forest a long way from it. `A family wants to build a new home in this part of the forest.` /",
    "two places marked: A on the bank of the river, B deep in the forest a long way from it. `Geographers work out why people live in one place and not another. This photograph shows the forest from above. A family wants to build a new home here.` /")
rep("(food, the Brazil nut pod and the garden) `Brazil nut trees grow right up into the emergent layer. Their hard pods fall to the forest floor, and people collect the nuts inside.` / `Families also clear a small patch of forest to grow food, like cassava, a root a bit like a potato.`;",
    "(food, the Brazil nut pod) `Brazil nut trees grow right up into the emergent layer. Their hard pods fall to the forest floor, and people collect the nuts inside.`, with the small gardens and cassava said in the script;")
rep("Strong: `Indigenous peoples like the people in this village live next to the river, because it gives them water to drink and fish to eat. I can see the river right next to their houses. The river is like a road too, so they travel along it by canoe. They use the forest as well. They build their homes from wood and palm leaves, they collect nuts and grow food like cassava, and they make medicine from plants.`",
    "Strong: `Indigenous peoples like the people in this village live next to the river. It gives them water to drink and fish to eat, and they travel along it by canoe. I can see the river right next to their houses.` / `They use the forest too. They build their homes from wood and leaves, and they make medicine from plants.`")
rep("Photographs: the riverside village (also the community card), Indigenous people in their village (the Indigenous peoples card), Manaus, fishing, a canoe, the forest from above, a house with a palm-leaf roof, a Brazil nut pod, a cassava garden, forest plants, and a second village for the final task.",
    "Photographs (ten): the riverside village, Indigenous people in their village (the word card), Manaus, fishing, a canoe, the forest from above, a house with a palm-leaf roof, a Brazil nut pod, forest plants, and a second village for the final task.")
rep("The first stays because it is short (who lives here and the two words the objective and the task need)",
    "The first stays because it is short (who lives here and the word the objective needs)")
rep("Time: 43 planned minutes across the beats, about 48 with books out and moving about.",
    "Time: 42 planned minutes across the beats; taught by asking at the board's pace, about 46, so about 51 with books out and moving about. To bring it down, the community card went (village says it), the cassava card and its picture moved to the script, and the fish fact, where the boats go and part of the model description came off the boards. What is left is each because and the final writing, so it stays at 51 and the teacher is told.")
rep("- **Flags:** the omissions above, in one line; and a check",
    "- **Flags:** the omissions above, in one line; the honest running time; and a check")
rep("`deforestation` is not carded (lesson 4).",
    "`deforestation` is not carded (lesson 4), and `community`, from the plan's list, is said as `village`.")
open(f, 'w', encoding='utf-8').write(s)
print('ok')
