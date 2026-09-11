# Speech bubbles, claims and characters on slides

The Slide Designer reads this reference whenever a source unit puts a person in front of the class: a speaking character, a voiced claim, a misconception, a disagreement, a prediction to judge, an advice-to-a-character move, or anyone who simply says what they think, gives their reason or asks a question. The speech-bubble templates (`speech-bubbles-1`, `speech-bubbles-2`, `speech-bubbles-3`) fit moments where the settled lesson has characters speaking to the child. This reference holds the rules that keep those slides honest.

## An invented person is shown, or is not invented

**When the lesson invents a person, the class sees them: a face, and their own words in their own bubble.** A person put on a slide as words alone does not read to a child as a person. They read as something the teacher made up to have something to talk about, which is exactly what they are, and the whole point of a character is that a child stops treating the idea as an exercise and starts treating it as someone's.

This bites hardest where no one is being judged, because the judging moves are the ones everything below was written for. A Year 4 RE deck compared two children's reasons for singing carols. Nobody was right or wrong, so nothing here was opened, and `Nadia says: "..."` and `Grace says: "..."` went onto the board as two text cards with no faces and no photograph. The teacher's note on the slide read: it makes them sound like they are not actually people, just what the teacher wrote down to pretend. So: someone giving their reason, someone saying what they think while you model, someone asking the class a question, and someone making a claim to be judged are all the same shape here. Count the voices and give each one a bubble.

**The other half of the rule is that a person who cannot be shown was not needed.** The same deck framed a task with `A visitor asks why this scene matters to Christians.` No visitor was named, drawn or referred to again; a generic role noun standing in for a person is the tell that nobody was ever going to be shown. Two repairs, in this order. Show them, which is usually right when the person is doing a real job, and explaining something to someone who does not already know it is a real job: give them a name from the run's `CHARACTER_NAMES`, a portrait and a bubble carrying the question. Or cut them, and ask the question directly (`Why does this scene matter to Christians?`), which loses nothing when the person was only there to hold the question.

**The limit: this is about people the lesson invents, not people it reports.** A real person the lesson teaches about (a monarch, a scientist, a named figure in a source) is handled by the photograph and source rules, not given a cartoon portrait and a made-up line. A class the lesson addresses directly needs no character at all, and a slide whose business is the lesson's own (your task, your criteria, what we just noticed) has no person in it to show.

## Count the voices, then pick the template

Pick the template whose bubble count matches the number of voices the lesson actually gives: count the speakers in the source unit first, then choose the template with that many bubbles. One child voicing a single claim, prediction, or question the class then tests is *one* voice, so it is `speech-bubbles-1` (the shape or statement sits on the left, the single speaker on the right). Two or three people each adding an idea, or two opposing positions children weigh, are `speech-bubbles-2` / `-3`.

Match the count to the lesson rather than to a template reached for by habit: when the design gives one speaker, render one bubble. Do not add a second and fill it with a line no one in the design said, such as a teacher asking "is she right?" or a tacked-on correct view. A fabricated voice dilutes the one real claim children are meant to test, and a "Who is right?" title promises a contest the slide does not contain.

## The title follows the move, and stays open

The title stays open so the child has to inspect before deciding. A single attempt the class judges reads as "What advice would you give Priya?" or "Has Priya got this right? How do you know?". Never use "Who is right?" on a one-voice slide because it promises a contest a one-voice slide does not contain. Never use a verdict-revealing title such as "Fix it" or "What did Priya get wrong?", which announces the fault before the child has looked and collapses judging into locating a guaranteed error.

When the source carries its own judging question, that question is the title: `Is Dev right?` beats a descriptive label like `Dev's claim`, because it points children at the judging rather than announcing the exhibit. Use the source-unit label or another Slide Designer-owned presentation heading only when it preserves this openness. Do not paraphrase a source-authored claim or question to manufacture a more dramatic title.

## The named characters

The named class characters are Mr Sear, Miss Brooker and Bailey; every speaker is one of them, or the lesson-designer's named child carried in the source content. Never relabel a speaker "You", which points the claim back at the reader instead of at a character.

**What the three pictures actually show, because the keys mislead.** `mr-sear` is drawn as a boy, `miss-brooker` as a girl, and `bailey` as the class dog. So the pool is two children and an animal, not two teachers and a dog, and a lesson that invents two children has a face for each of them. Read that before deciding a beat cannot be drawn: a designer that takes the keys at face value concludes it has no children available and falls back to text cards, which is how the two carol singers lost their faces. Set `speaker.name` to the lesson's own name for the child and the portrait carries it.

**A recurring character keeps one face as well as one name.** When a child speaks on more than one slide, give them the same portrait each time. A name that arrives on a different face is a different person to the class, and the comparison a later slide is building on quietly comes apart.

## Each voice in its own bubble, lines verbatim

Put each person's words in their own character's bubble so they are addressed to the child, rather than flattening them into a plain list or question. Use every source-authored line verbatim. Those words are teaching content, so never invent, combine, trim or reword what a character says.

## The bubble holds only the spoken words

A source task line often arrives fused: `Dev says: 'A laptop belongs in the mains group because its charger has a plug.' Is Dev right? Explain.` That one string carries three different things, and only one of them is speech. Decompose it mechanically, changing no words inside any piece:

- The quoted claim - and nothing else - goes in the bubble. A bubble is the character speaking, so it holds only words the character would actually say, in their own voice. `Dev says:` inside Dev's own bubble makes him narrate himself in the third person, and a task instruction in his mouth makes him set his own test.
- The attribution (`Dev says:`) is already carried by the named portrait under the bubble. It is never printed.
- The judging question (`Is Dev right? Explain.`) is the pupils' task, not Dev's speech. It becomes the slide's open title (`Is Dev right?`) and, where wording remains (`Explain.` / `Explain how you know.`), a separate task line in question blue outside the bubble.

This decomposition is a sanctioned mechanical transformation, like automatic question labels: each piece keeps its exact wording, and only where it sits changes.

**Then put that task line after the claim, not before it.** Children read left to
right, so a column carrying "Is Dev right? Explain." to the left of Dev's bubble
asks the question before its subject exists. On the speech-bubble templates set
`statementSide: "right"` for this shape, so a child meets the claim, then the
question about it. The default `left` is for the other shape, where the statement
is the thing being judged (the Carroll diagram, the parallelogram, the plotted
point) and the character responds to it: there the statement genuinely is what
they read first. The test is what a child has to have read before the other half
makes sense, never which slot the wording arrived in.

## When the debated statement is a diagram

When the shared statement the characters are debating is itself a diagram children must read to decide, that diagram is the slide's P1 central content. This includes a Carroll diagram whose placement they judge, a number line whose value they read, a graph two children disagree about, or any figure the disagreement turns on.

Give the diagram room to be read. Pass a larger `statementRatio` when the template supports it so the figure is not squeezed into the slim default band, and show the contested item beside it so the child sees what is being judged. The portraits and bubbles can be smaller; the diagram being readable is what lets a child actually judge.

## Show the real referent the claim is judged against

Whenever a claim can be weighed against something children could look at, put that thing on the slide beside the speakers. This covers more than a spotted mistake: a claim about where a place is, how far something spreads, which group an example belongs to, or what a set of results shows all have a referent. The authorised map, photograph, diagram, table, text or result set is it.

Two things follow from showing the referent. First, judging becomes reasoning from evidence rather than recall of what the teacher said a minute ago. Second, when the beat asks children to write their reasoning, the referent doubles as the tool they work from, so the thinking is supported while they work rather than only while they talk. A geography disagreement about which countries a rainforest spans belongs beside the map that shows it; without the map, the only place to look for the answer is memory.

Where the source unit already supplies a written reasoning stem, place it alongside the referent when the structure of the answer is what children need support with. Do not invent a new stem merely because the template has room. A supplied stem earns its place when it helps express the reasoning without supplying the judgement, answer or conclusion.

When the claim is about something being in the wrong place or being the wrong choice, the statement has to show the real thing the child judges it against so the misfit is visible on the slide. A spot-the-mistake beat only works if the child can see what is wrong. If a character has put a big cargo ship at a river's source, show the authorised photograph of the source, the small shallow mountain stream, so a child looks at that stream, hears the claim and sees for themselves that a big ship could never go there.

Reach for the real photo the lesson already provides for the place, not an invented picture of the impossible scene. Caption the photo only when it needs identification, such as "The start of the river, high in the hills". The same move covers any judge-the-claim beat: show the real referent, let the child weigh the claim against it.
