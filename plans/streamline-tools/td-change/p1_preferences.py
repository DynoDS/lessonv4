"""4.2.285: the Teach then Do rhythm's one home in preferences.md.
Every replacement asserts its old text appears exactly once."""
from pathlib import Path

P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\references\preferences.md")
text = P.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global text
    n = text.count(old)
    assert n == 1, (n, old[:80])
    text = text.replace(old, new)


# Decision 1: the contents line names everything the section holds.
swap(
    "- **The Teach → Do → Teach → Do Rhythm** — the load-bearing lesson shape, the pairing test that each Do uses the idea its own Teach taught, naming what a chunk needs children to do with it before choosing any activity, and the variety rules across Do beats.",
    "- **The Teach → Do → Teach → Do Rhythm** — the load-bearing lesson shape and how every route keeps it: one idea per Teach, used by every child before the next, counted in ideas rather than slides; a practical lesson's shape; the pairing test that each Do uses the idea its own Teach taught; orientation, setting the scene, and every beat earning its place; naming what a chunk needs children to do with it before choosing any activity; quick checks, matches and sorts; letting the class build a set; the variety and demand rules across Do beats; how each beat changes the state of the lesson; and what the work can claim.",
)

# Decision 2 (with decision 1 carrying the designer's purpose sentence).
swap(
    "The required child processing comes before the lesson introduces a genuinely different concept; it is not forced between the explanation and modelling of one idea.\n",
    "The required child processing comes before the lesson introduces a genuinely different concept; it is not forced between the explanation and modelling of one idea. The rule prevents several different ideas being taught before children do anything, so it counts ideas, not slides. A Teach split across two slides is one beat, and two teacher slides in a row are right when they carry one idea: a heavy slide broken in two, or a scene set on one slide and looked at on the next. What a lesson cannot do is teach children one thing and then a different thing before they have used the first, because the first is what they forget. In the teacher's words: \"The whole point is you teach children something and they do something immediately with that information before you teach them more things. It's cognitive overload, 101.\" Splitting an overloaded Teach across two slides fixes the presentation, not the second idea inside it.\n",
)

# Decisions 1 and 7: every route, the designer's route details, no maintainer bracket.
swap(
    "**The rhythm holds in every structure.** Skill-based lessons carry it as the guided and independent practice that follows each modelled move, never as one block of practice at the end of several models (the route file's cycle grammar enforces this: every My Turn plus Our Turn cycle ends with its own Your Turn, and it was previously possible to satisfy the route while breaking this sentence), Content-based as a Do beat after each chunk, Dialogic as talk after each stimulus. Discovery and Task-Centred are not exempt because their teaching is short: an enabling input that tells children two distinct ideas before they use the first is the same failure as two Teach slides in a row, and it is where a task-centred lesson most often goes flat.\n",
    "**The rhythm holds in every structure.** Skill-based lessons carry it as the guided and independent practice that follows each modelled move, never as one block of practice at the end of several models (the route file's cycle grammar enforces this: every My Turn plus Our Turn cycle ends with its own Your Turn), Content-based as a Do beat after each chunk (or the Practise straight after it, when using that chunk is itself the substantial work), Dialogic as talk after each stimulus, and Discovery as the use of each finding after its Teach why. Discovery and Task-Centred are not exempt because their teaching is short: an enabling input that tells children two distinct ideas before they use the first is the same failure as two Teach beats in a row, each with its own idea, and it is where a task-centred lesson most often goes flat. There each enabling idea is its own `teach-needed` unit, used through its `pupilInstruction` before the next is taught, and only the last may be used by the planning or the task itself.\n"
    "\n"
    "**A practical lesson keeps the teaching short and lets the doing lead.** Use short challenges, give only the teaching needed before the next action, let children notice patterns, pause for brief teaching and send them back to the task: challenge → brief teaching → try it → quick check → improve it → record it, never explanation → explanation → explanation → worksheet. It opens on the challenge itself, before any teaching, only under the Skill-based route's conditions for a bounded first attempt: the attempt is safe, cheap and quick to reset, the goal is self-evident, and success or failure is visible to the child without the teacher judging it (`teaching-sequence-skill-based.md`). `Can you make the bulb light?` passes, because it lights or it does not. `Have a go at column subtraction first` does not, because a written method fails silently, and a maths lesson opens with the model (`subject-maths.md`). Otherwise the brief teaching comes first and the challenge follows it.\n",
)

# Decision 1: the content route's sufficiency clause joins its home.
swap(
    "an unfamiliar inference may need an explicit model and guided attempt. That focused teaching",
    "an unfamiliar inference may need an explicit model and guided attempt, with enough explanation and guided use for the later task. That focused teaching",
)

# Decision 8: a question as the Do.
swap(
    "(a decision each child writes down, talk partners then a line each, a vote with a reason) before the reasoning is heard. Two tests",
    "(a decision each child writes down, talk partners then a line each, a vote with a reason) before the reasoning is heard. How every child commits is written into the task itself (`Write yes or no, then one reason`), which Classroom Norms allows as part of the selected task; how the answers are then gathered stays the teacher's. Two tests",
)

# Decision 3, and decision 1 bringing the designer's earn-its-place rule home with its limits.
swap(
    "Choose the amount from what these children need, not a fixed line count or a compulsory timeline.\n",
    "Choose the amount from what these children need, not a fixed line count or a compulsory timeline. The scene is set so that nothing arrives from nowhere: children see what the topic is and what it is for before anything abstract, unfamiliar or unexplained is put in front of them. In the teacher's words: \"Children need to see things. They need to know things. They need to know the purpose of things.\" His test for any lesson is to open a slide at random and read it: you should understand what it is doing and why, or be able to go back one or two slides and see why. A slide that arrives feeling random fails it, for the teacher and for the class, because \"children need to be there with you, learning, not listening to something completely random and trying to understand that.\" In a knowledge lesson the scene is the opening of the first Teach beat, on a slide of its own when that makes sense (the Slide Designer splits the beat there), and never a beat of its own with a made-up task after it.\n"
    "\n"
    "**Every beat earns its place against the objective, and a beat that serves it indirectly says so out loud.** The rhythm keeps children active, and it is easy for a beat to be busy without being the lesson: background knowledge worth having can become a little lesson inside the lesson, children labelling lines while the objective is about biomes. Check each beat against the objective as you write it: what does this let a child do that the objective asks for? When the honest answer is that the beat supplies groundwork children will use (a prerequisite fact the first idea rests on), keep it and make the link part of the teaching: say why it matters for today's real question, and have the beat land back on the objective. Orientation children will not use is governed by the paragraph above. The quick check: could a child say what today's lesson was about after every beat, or would one leave them thinking the lesson was about something else? Where a beat serves nothing the objective asks and cannot honestly be linked back, cut it. The cut has limits. A brief relevant fact can earn its time as interesting subject knowledge children take away, without becoming a new assessed objective, and brief relevant enrichment may be worthwhile knowledge in its own right, while a substantial new strand still needs a place within the objective, the teaching and the available time. Remove detours that crowd out the learning, but preserve the explicit knowledge needed for meaningful success rather than making the teaching thin: the fewest facts or slides is not the clearest lesson.\n",
)

# The standing ruling on stories: the case stays as a plain example, the incident leaves.
swap(
    "Settling the kind is not yet settling the thought: `complete the because` was on this list, a Year 4 RE design picked it after a slide that already stated the because, and the thought a child actually had was where to copy the words from.",
    "Settling the kind is not yet settling the thought: `complete the because` is on this list, and picked after a slide that already stated the because, the thought a child actually has is where to copy the words from.",
)

# Decision 1: the designer's "access" reason joins the variety rule.
swap(
    "choose variety for its learning value and engagement, with manageable preparation and transitions.",
    "choose variety for its learning value, engagement and access, with manageable preparation and transitions.",
)

# Decisions 1 and 2: the second tell counts ideas, and a second job's three homes come home.
swap(
    "Two tells that the spine has broken: a beat carrying a second job that has no beat of its own (a routine appended to the conclusion, a fact bolted onto a task), and a run of slides that are all the teacher talking, because each thing children do is where the lesson turns.\n",
    "Two tells that the spine has broken: a beat carrying a second job that has no beat of its own (a routine appended to the conclusion, a fact bolted onto a task), and a run of teacher beats that teaches a second new idea before children have done anything with the first, because each thing children do is where the lesson turns (two teacher slides carrying one idea are not that run). A second job gets a home on the line rather than the nearest beat. If the task can use it, it is an enabling idea taught before the doing. If it belongs to the product, put it in the product: a question box is a rule about how we ask questions, so it can be one of a class agreement's own rules. If it is a routine rather than learning, it lives in the teacher's notes.\n",
)

P.write_text(text, encoding="utf-8")
print("preferences.md patched")
