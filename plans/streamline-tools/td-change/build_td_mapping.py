"""The Teach then Do mapping and pins (4.2.285). Every changed ledger row is
mapped by hand to the words that now carry it; `ledger_mapping.build` checks
each phrase against the files before anything is written."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ledger_mapping import build  # noqa: E402

PREF = "references/preferences.md"
LD = "agents/lesson-designer.md"
CONTENT = "references/teaching-sequence-content-based.md"
SKILL = "references/teaching-sequence-skill-based.md"
TASK = "references/teaching-sequence-task-centred.md"
DISC = "references/teaching-sequence-discovery.md"
DIAL = "references/teaching-sequence-dialogic.md"
BEATS = "references/do-beats.md"
VOICE = "references/teacher-voice.md"
EVID = "references/evidence-synthesis.md"
RC = "references/design-review-route-checks.md"
REV = "agents/design-reviewer.md"
PACKET = "scripts/design-review-packet.py"
VALIDATOR = "scripts/validate-lesson-design.py"
SCAFFOLD = "scripts/lesson-design-scaffold.py"
LOG = "references/build-review-log.md"

LD_POINTER = "`preferences.md` → The Teach → Do → Teach → Do Rhythm is the rhythm: read it whole at the start, and go back to the part a decision needs when you make it."
MOVED = "moved word for word above the skill route's Output Format Block, under `## Cycles, and the beats around them`, so the reviewer reads it (decision 6)"

CHANGED = {
    "TD-A03": ("kept, with decision 2 added: the rule counts ideas, not slides, in the teacher's words",
               [(PREF, "A short explanation and its model may form one coherent teaching block when they develop the same manageable idea. The required child processing comes before the lesson introduces a genuinely different concept; it is not forced between the explanation and modelling of one idea."),
                (PREF, "The rule prevents several different ideas being taught before children do anything, so it counts ideas, not slides. A Teach split across two slides is one beat, and two teacher slides in a row are right when they carry one idea: a heavy slide broken in two, or a scene set on one slide and looked at on the next."),
                (PREF, "What a lesson cannot do is teach children one thing and then a different thing before they have used the first, because the first is what they forget. In the teacher's words: \"The whole point is you teach children something and they do something immediately with that information before you teach them more things. It's cognitive overload, 101.\"")], []),
    "TD-A04": ("folded into A03 in the one home, carrying its purpose sentence and its \"short\" and \"manageable\" (decisions 1 and 2); the designer's pointer names it",
               [(PREF, "The rule prevents several different ideas being taught before children do anything"),
                (LD, "It holds a short explanation and the model of one manageable idea as one block; one idea per Teach, used by every child before the next, counted in ideas rather than slides, so two teacher slides carrying one idea are fine and a second new idea before children have used the first is not;")],
               [(LD, "Rule prevents several different concepts taught before children do anything")]),
    "TD-A11": ("moved from the voice guide into the one home with the bounded-attempt conditions and the maths exception (decisions 1 and 11); the voice guide keeps its examples and points there",
               [(VOICE, "Sometimes the most authentic resource is one where **the slide gets out of the way and lets pupils do something**."),
                (VOICE, "The shape of a practical lesson, and when it may open on the challenge itself, is in `preferences.md` → The Teach → Do → Teach → Do Rhythm, `A practical lesson keeps the teaching short and lets the doing lead`."),
                (PREF, "**A practical lesson keeps the teaching short and lets the doing lead.** Use short challenges, give only the teaching needed before the next action, let children notice patterns, pause for brief teaching and send them back to the task: challenge → brief teaching → try it → quick check → improve it → record it, never explanation → explanation → explanation → worksheet."),
                (PREF, "It opens on the challenge itself, an attempt at the target before any teaching, only under the Skill-based route's conditions for a bounded first attempt: the attempt is safe, cheap and quick to reset, the goal is self-evident, and success or failure is visible to the child without the teacher judging it (`teaching-sequence-skill-based.md`)."),
                (PREF, "`Can you make the bulb light?` passes, because it lights or it does not. `Have a go at column subtraction first` does not, because a written method fails silently, and a maths skill lesson opens with the model (`subject-maths.md`). Otherwise the brief teaching comes first and the challenge follows it. An investigation or observation before the teaching is not this challenge and follows its own rules: the Discovery route, the content route's `observe`, the skill route's short pattern investigation or method comparison, and the subject file.")],
               [(VOICE, "> Challenge → brief teaching → try it → quick check → improve it → record it."),
                (VOICE, "Avoid turning an activity-led lesson into:")]),
    "TD-A12": ("contents line reworded to name everything the section holds (decision 1)",
               [(PREF, "- **The Teach → Do → Teach → Do Rhythm** — the load-bearing lesson shape and how every route keeps it: one idea per Teach, used by every child before the next, counted in ideas rather than slides; a practical lesson's shape; the pairing test that each Do uses the idea its own Teach taught; orientation, setting the scene, and every beat earning its place; naming what a chunk needs children to do with it before choosing any activity; quick checks, matches and sorts; letting the class build a set; the variety and demand rules across Do beats; how each beat changes the state of the lesson; and what the work can claim.")],
               [(PREF, "naming what a chunk needs children to do with it before choosing any activity, and the variety rules across Do beats.")]),
    "TD-A13": ("stale description removed (decision 7)",
               [(LD, "The rhythm section is the load-bearing shape of every structure, task-centred and discovery included.")],
               [(LD, "task-centred and discovery included, and it is short.")]),
    "TD-B06": ("kept, with the content route's sufficiency clause carried in (decision 1)",
               [(PREF, "In a knowledge subject, teach substantive content through the sources, examples or experiences that make it intelligible."),
                (PREF, "an unfamiliar inference may need an explicit model and guided attempt, with enough explanation and guided use for the later task. That focused teaching is legitimate, especially when the objective names the move. It must build knowledge of the topic, not replace it with a sequence of generic method rules.")], []),
    "TD-B07": ("folded into the designer's pointer; the rule itself is B02 in the one home (decision 1)",
               [(LD, "heading, explanation and following Do name one move between them; read the three back to back"),
                (PREF, "Read the three back to back before you move on: one move, taught, then used.")], []),
    "TD-B10": ("true repeat of B06 made a pointer carrying its own words (decision 1)",
               [(CONTENT, "A content chunk teaches knowledge about the topic, and a new thinking move is taught through the material it helps children understand, with enough explanation and guided use for the later task (`preferences.md` → The Teach → Do → Teach → Do Rhythm owns when a brief cue is enough and when an unfamiliar move needs focused teaching)."),
                (PREF, "a brief cue can suffice for a familiar comparison; an unfamiliar inference may need an explicit model and guided attempt")],
               [(CONTENT, "Keep that teaching connected to substantive content rather than replacing the lesson with generic rules about thinking.")]),
    "TD-B11": ("practice placed where the class is ready for it (decision 7)",
               [(LD, "**Content-based:** Teach one manageable chunk → children use/process → next distinct chunk → larger practice drawing learning together, placed where the class is ready for it. Closely connected facts may stay together only when still one simple easy chunk.")], []),
    "TD-B12": ("practice placed where the class is ready for it (decision 7)",
               [(EVID, "**Structure.** Teach one small, manageable chunk → children use or process it → teach the next distinct chunk → larger practice that draws the lesson's knowledge together, placed where the class is ready for it.")], []),
    "TD-B16": ("its pointer names the section that exists (decision 7)",
               [(SKILL, "If you find yourself wanting to write two SCs for one concept (one for output X, one for output Y) that's the signal that you've got two procedures sharing a concept, not one — split them into two concepts at the structure level (`lesson-designer.md` → Structure Decision, `Splitting axis when LO names multiple outputs`).")],
               [(SKILL, "see \"Picking the splitting axis\" earlier")]),
    "TD-C01": ("kept, with decision 8 added: how every child commits is written into the task, and gathering stays the teacher's",
               [(PREF, "**Questioning is not doing.** The Do half of the rhythm is every child using the new learning"),
                (PREF, "A discussion question can be the Do beat, but it is chosen, not defaulted: the answer has to need the idea just taught, so a child who missed the teaching could not give it, and the form has to make every child commit to one (a decision each child writes down, talk partners then a line each, a vote with a reason) before the reasoning is heard."),
                (PREF, "How every child commits is written into the task itself (`Write yes or no, then one reason`), which Classroom Norms allows as part of the selected task; how the answers are then gathered stays the teacher's."),
                (PREF, "Two tests on a finished beat: could a child answer it without the idea this slide taught, and could most of the class sit it out? Yes to either, and the beat is a question, not a use.")], []),
    "TD-C03": ("folded into the one home (decision 1); the designer's pointer names the rule and keeps the field names",
               [(LD, "questioning is not doing, and the Do uses the idea its own Teach just taught"),
                (LD, "The Do half is a `do` unit or a `pupilInstruction`."),
                (PREF, "The Do half of the rhythm is every child using the new learning: applying it to a fresh case, deciding, sorting, improving, rewriting, choosing, comparing, producing something that needed the idea.")],
               [(LD, "Questioning is not doing: the Do half, a `do` unit or a `pupilInstruction`, is every child using the idea")]),
    "TD-C04": ("brought into line with the one home (decision 8)",
               [(CONTENT, "**Do** — immediately after each Teach beat, children use or process the chunk before the next distinct idea. Every child uses it; a question to the room is a key question, not this beat, unless it is chosen so the answer needs the idea and every child commits, with how they commit written into the task (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `Questioning is not doing`).")], []),
    "TD-C08": ("folded into C07 in the one home (decision 1)",
               [(PREF, "It gives every child something concrete to do with the chunk and leaves something the teacher can see: a written answer, a partner's spoken response, a visible decision, a physical position.")],
               [(LD, "Every Do beat: every child uses the chunk and leaves something the teacher can see")]),
    "TD-C18": ("kept, now a teacher-owned routine not selected unless the teacher asks (decision 5)",
               [(BEATS, "### 9.7 Think-Aloud Reverse **Teacher-owned response routine:** do not select this unless the teacher explicitly requests it. The teacher has modelled thinking aloud during the Teach; in the Do, a pupil thinks aloud through the same kind of problem while the class watches")], []),
    "TD-C19": ("kept, only when every child first commits (decision 5)",
               [(DIAL, "- Role-play or hot-seating (\"you're [character] — what would you say?\"), only when every child first writes what their character would say, or picks a side, before anyone performs"),
                (DIAL, "- Short structured debate, only when every child first picks a side and writes one reason")], []),
    "TD-D03": ("folded into D01 and D02 in the one home, which carry its example (decision 1)",
               [(PREF, "**The Do uses the idea its own Teach just taught.**"),
                (PREF, "A Teach explaining what makes a source primary or secondary, followed by children deciding whether one boy's portrait shows what every child of his time wore, has every child committing to real work on a different idea"),
                (LD, "the Do uses the idea its own Teach just taught")],
               [(LD, "A use of the wrong idea is not the beat either")]),
    "TD-D12": ("its best use is the starter (decision 5)",
               [(BEATS, "**Best for:** the starter of lesson 2+ in a sequence.")],
               [(BEATS, "opening Do beat after Teach 1")]),
    "TD-E04": ("the case stays as a plain example, the incident leaves (the standing ruling on stories); in the log (4.2.123); its paragraph also holds the quick-checks home, changed in 4.2.286",
               [(PREF, "Settling the kind is not yet settling the thought: `complete the because` is on this list, and picked after a slide that already stated the because, the thought a child actually has is where to copy the words from.")],
               [(PREF, "a Year 4 RE design picked it after a slide that already stated the because")]),
    "TD-E05": ("kept; its duplicate sentences folded into the one home (decision 1); its paragraph's recall line points home since quick checks 4.2.286 (decision 4)",
               [(LD, "**Choose the thinking first, then the response form, then demand - three separate decisions.** Name what this chunk needs children to *do* with it before naming any activity - `preferences.md` → The Teach → Do → Teach → Do Rhythm, `Name what the chunk needs children to do with it`, owns that list and is what you settle before opening `do-beats.md`."),
                (LD, "The case to watch is a Teach that explained a cause, mechanism, reason or relationship: the reflex answer is a written summary, which only says the explanation back, and `do-beats.md` §10 holds the beats that actually use it")], []),
    "TD-F01": ("kept, with the designer's access reason carried in (decision 1)",
               [(PREF, "**Use variety deliberately, without a quota.** Choose worthwhile pupil activity as carefully as the teaching example."),
                (PREF, "choose variety for its learning value, engagement and access, with manageable preparation and transitions.")], []),
    "TD-F03": ("reads what children do, not the format line (decision 9)",
               [(CONTENT, "It is one section of the catalogue, not the route for the lesson. A cause can be matched to its effect (§5.4), sorted by when it helps (§5.1), weighed against a cost (§6), put in order (§4.3) or explained (§10), and a lesson whose every Do beat is a spoken explanation has picked the channel once and repeated it."),
                (CONTENT, "Before the design is settled, read what children actually do in each Do beat, its task and instruction, in order, whatever its `format` line says: when three or more in a row are talk or written explanation, open §5 and §6 for at least one of them and choose the beat whose pupil action best forces its `thinking` line.")],
               [(CONTENT, "read the Do beats' `format` lines in order")]),
    "TD-F04": ("the teacher's words stay without their date; the incident is in the log (L1233)",
               [(CONTENT, "A lesson that read only §10 came out with every beat as explain it to your partner, and the teacher who taught it called it \"listen to teacher, class discussion over and over again\".")],
               [(CONTENT, "A Year 4 history lesson on why Tudor children worked (14 September 2026) read only §10")]),
    "TD-F05": ("folded into F01, which now names access (decision 1)",
               [(PREF, "choose variety for its learning value, engagement and access")],
               [(LD, "Vary form when improves learning/attention/access, not quota.")]),
    "TD-F13": ("folded into F12 in the one home (decision 1); the designer keeps its recall line and names demand in its pointer; its recall line points home since quick checks 4.2.286 (decision 4)",
               [(PREF, "**Climb the demand across the lesson, without forcing a staircase.**"),
                (LD, "variety and demand across the lesson"),
                (LD, "A short recall response may secure new knowledge, including in the last Do (`preferences.md` → `A quick check is a fresh case, not the last slide again`: a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case). Read what children actually do; do not label recall as reasoning or force each response to be harder.")],
               [(LD, "Demand climbs across lesson where the objective supports it")]),
    "TD-G11": ("maintainer history removed; the build log already holds it (L2234) (decision 7)",
               [(LD, "a row of arrows labels an order and cannot make one beat need the last, so the spine is carried slide by slide below, in each slide's why.")],
               [(LD, "was retired (2 September 2026)")]),
    "TD-H01": ("the second tell counts ideas (decision 2); a second job's three homes moved in beside the first tell (decision 1)",
               [(PREF, "Two tells that the spine has broken: a beat carrying a second job that has no beat of its own (a routine appended to the conclusion, a fact bolted onto a task), and a run of teacher beats that teaches a second new idea before children have done anything with the first, because each thing children do is where the lesson turns (two teacher slides carrying one idea are not that run)."),
                (PREF, "A second job gets a home on the line rather than the nearest beat. If the task can use it, it is an enabling idea taught before the doing. If it belongs to the product, put it in the product: a question box is a rule about how we ask questions, so it can be one of a class agreement's own rules. If it is a routine rather than learning, it lives in the teacher's notes.")],
               [(PREF, "a run of slides that are all the teacher talking")]),
    "TD-H02": ("kept for the finish; its three repairs moved to the one home, where every route reads them (decision 1)",
               [(TASK, "The finish carries one job: completing the task. Something the lesson must also establish that has no beat of its own (a class routine, a piece of information, a safety note) tends to get appended to whichever beat is nearest, usually this one, and the lesson's line breaks there: children finish the product and then meet a new thing with nothing to do with it."),
                (TASK, "Give it a home on the line instead: an enabling idea before the doing, part of the product, or the teacher's notes (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `Each major beat changes the state of the lesson`, says which is which)."),
                (PREF, "If the task can use it, it is an enabling idea taught before the doing.")], []),
    "TD-H03": ("kept, with a sort and its short reason named as one job (decision 10)",
               [(LD, "one thought cannot cover two tasks, so a beat whose thought fits only half of what it asks is two beats."),
                (LD, "The limit is a genuine single task with parts (a claim to judge and the explanation of that same claim; a sort and a short reason for its placements; a calculation and the sentence about that same calculation), which is one job and stays one beat.")], []),
    "TD-H04": ("a sort and a short reason are one unit; a separate piece of work is its own (decision 10)",
               [(LD, "**Make each pupil action independently presentable.** One source unit must not hide several separate actions inside one content.task or pupilInstruction. A sort and a short reason for its placements are one action and one unit (`Sort the six jobs, then say why you put the hardest one where you did`); an explanation or a new case that is its own piece of work is its own unit, with its own prompt and answer (`Sort the jobs, then write a paragraph on why Tudor children worked` is two).")],
               [(LD, "When children first sort, then explain, then generate new case, write three consecutive source units")]),
    "TD-H05": ("counts ideas, not slides (decision 2)",
               [(TASK, "Packing the ideas into one unit with one check after all of them teaches several ideas before children use the first, and the deck reads as a run of separate slides rather than a lesson moving somewhere.")],
               [(TASK, "puts several slides of the teacher talking in a row")]),
    "TD-I01": ("kept, with decision 3 added: what setting the scene is for, the teacher's random-slide test in his words, and the knowledge-lesson form; its own slide is promised only when the first board would be too full, which is what the Slide Designer can do, and whether the designer may ask for it on a board that fits is an open question for the teacher",
               [(PREF, "**Orientation is not automatically a Teach chunk.** Give children the context needed to enter the first example"),
                (PREF, "This does not require a manufactured Do activity or a full extra teaching cycle."),
                (PREF, "The scene is set so that nothing arrives from nowhere: children see what the topic is and what it is for before anything abstract, unfamiliar or unexplained is put in front of them. In the teacher's words: \"Children need to see things. They need to know things. They need to know the purpose of things.\""),
                (PREF, "His test for any lesson is to open a slide at random and read it: you should understand what it is doing and why, or be able to go back one or two slides and see why. A slide that arrives feeling random fails it, for the teacher and for the class, because \"children need to be there with you, learning, not listening to something completely random and trying to understand that.\""),
                (PREF, "In a knowledge lesson the scene is the opening of the first Teach beat, on a slide of its own when the first board would otherwise be too full (the Slide Designer splits the beat there), and never a beat of its own with a made-up task after it.")], []),
    "TD-I02": ("moved from the designer's clipped copy into the one home as whole sentences, carrying its three limits (I09 to I11) (decision 1)",
               [(PREF, "**Every beat earns its place against the objective, and a beat that serves it indirectly says so out loud.**"),
                (PREF, "Check each beat against the objective as you write it: what does this let a child do that the objective asks for?"),
                (PREF, "The quick check: could a child say what today's lesson was about after every beat, or would one leave them thinking the lesson was about something else? Where a beat serves nothing the objective asks and cannot honestly be linked back, cut it."),
                (PREF, "The cut has limits. A brief relevant fact can earn its time as interesting subject knowledge children take away, without becoming a new assessed objective, and brief relevant enrichment may be worthwhile knowledge in its own right, while a substantial new strand still needs a place within the objective, the teaching and the available time. Remove detours that crowd out the learning, but preserve the explicit knowledge needed for meaningful success rather than making the teaching thin: the fewest facts or slides is not the clearest lesson."),
                (LD, "orientation, setting the scene, and every beat earning its place against the objective")],
               [(LD, "**Every beat earns place against objective, and beat serving indirectly says so out loud.**")]),
    "TD-I03": ("points at the rule by name and carries decision 3's knowledge-lesson form, in the same words as the home (the open question on I01 applies)",
               [(CONTENT, "**Orient children enough to enter the first example.** Follow `preferences.md` → The Teach → Do → Teach → Do Rhythm, `Orientation is not automatically a Teach chunk`: in this route the scene is the opening of the first Teach, on a slide of its own when the first board would otherwise be too full, and never a beat of its own with a made-up Do after it. New prerequisite learning that children must use still earns teaching and processing.")], []),
    "TD-J01": ("kept, carrying the designer's route details (decision 1) and without the maintainer bracket (decision 7)",
               [(PREF, "**The rhythm holds in every structure.** Skill-based lessons carry it as the guided and independent practice that follows each modelled move, never as one block of practice at the end of several models (the route file's cycle grammar enforces this: every My Turn plus Our Turn cycle ends with its own Your Turn), Content-based as a Do beat after each chunk (or the Practise straight after it, when using that chunk is itself the substantial work), Dialogic as talk after each stimulus, and Discovery as exploration first, then each finding taught why and used straight after its Teach why."),
                (PREF, "Discovery and Task-Centred are not exempt because their teaching is short: an enabling input that tells children two distinct ideas before they use the first is the same failure as two Teach beats in a row, each with its own idea, and it is where a task-centred lesson most often goes flat.")], []),
    "TD-J02": ("retired by name (decision 7): maintainer history, kept in the build log (4.2.285)",
               [(LOG, "it was previously possible to satisfy the route while breaking the rhythm sentence")],
               [(PREF, "it was previously possible to satisfy the route while breaking this sentence")]),
    "TD-J03": ("folded into J01 in the one home, carrying its Discovery and task-centred details (decision 1)",
               [(PREF, "There each enabling idea is its own `teach-needed` unit, used through its `pupilInstruction` before the next is taught, and only the last may be used by the planning or the task itself."),
                (PREF, "Discovery as exploration first, then each finding taught why and used straight after its Teach why"),
                (LD, "how every route keeps the rhythm, short teaching included")],
               [(LD, "Skill-based: child-processing = guided + independent practice.")]),
    "TD-J12": (MOVED, [(SKILL, "For each concept, use zero or more preparation units when genuinely needed, then **one or more cycles**. Each cycle is one My Turn source unit carrying that move's modelled examples, then at most one Our Turn for the same concept, then **its own Your Turn**."),
                       (SKILL, "The Our Turn is present unless the omission test in the Our Turn section applies; omitting it is a purposeful decision, not a shortcut.")], []),
    "TD-J13": (MOVED, [(SKILL, "**Every cycle ends with its own Your Turn, and it is a check rather than the main practice.**"),
                       (SKILL, "The your turns are good because they are a quick check of can we do this before moving on to the next concept, even if its similar."),
                       (SKILL, "So the Your Turn after a cycle answers one question, can the class do this yet, and it is sized to the cycle rather than to the lesson."),
                       (SKILL, "The substantial independent practice is the last cycle's Your Turn,")], []),
    "TD-J14": ("its incident became a plain example, as J17's and J18's did (the standing ruling); the story is in the build log (L2011)",
               [(SKILL, "A lesson that runs three cycles and practises once at the end leaves the first move a single demonstration away from independent work: 43 and 45 modelled and guided once, then not written by a child until a mixed set twenty minutes and two more moves later. So the Your Turn after a cycle answers one question")],
               [(SKILL, "a Year 4 rounding lesson did exactly that")]),
    "TD-J15": (MOVED, [(SKILL, "Three further source-unit kinds are available in this route, `prepare`, `teach` and `practise`, each placed where this lesson earns it rather than at a fixed point, and each used as many times as the lesson needs or not at all."),
                       (SKILL, "i dont want to limit it to starter, answers, key vocab, mtotyt cycles. If it thinks teach in a place do it,")], []),
    "TD-J16": (MOVED, [(SKILL, "The one thing fixed is the cycle itself: between a My Turn and its Your Turn nothing intervenes, because a class modelled to and then taken somewhere else arrives at its check having lost the thread. The other beats sit before a cycle or after it,")], []),
    "TD-J17": (MOVED + "; its dated incident became a plain example, and the incident and repair are in the log (4.2.285)",
               [(SKILL, "**A step the method needs and the class cannot yet do at today's size gets its own short cycle, before the cycle that needs it.**"),
                (SKILL, "Rounding 3,998 to the nearest 10 needs 3,990 and 4,000 before a number line can be drawn, and a class that can round 43 may not be able to find those two tens: a deck that goes straight into rounding leaves the step to a teacher who would notice, and a cover teacher does not. The short cycle for it is a My Turn on two cases"),
                (SKILL, "It is not a lesson inside the lesson: one move, modelled on one or two cases and used once,"),
                (SKILL, "The limit: a step the class has already done at this size, in an earlier lesson or today's starter, is named and left alone, and a remote prerequisite (reading a four-digit number in Year 4) is not retaught.")],
               [(SKILL, "(17 September 2026): the deck went straight into rounding")]),
    "TD-J18": (MOVED + "; its dated example became a plain one, and the incident is in the log (4.2.285)",
               [(SKILL, "**A `teach` beat carries knowledge the method leans on and does not itself perform**:"),
                (SKILL, "A slide that sets `43 children came to the fair` and `about 40 children` in two text cards around a small number line is the right idea and reads as wordy."),
                (SKILL, "The limit is sharp and it is about what the beat does rather than what it is called: the moment a beat shows how the method is carried out, it is a My Turn and owes the rest of its cycle. Ask what a child could do straight afterwards. If they could attempt a question from having watched, it was modelling.")],
               [(SKILL, "was the right idea and read as wordy (17 September 2026)")]),
    "TD-J19": (MOVED, [(SKILL, "**Between `prepare` and `teach`, ask whether anything has to survive the lesson.**"),
                       (SKILL, "Where both readings fit, ask whether you would be content for the idea to disappear at the first Your Turn.")], []),
    "TD-J20": (MOVED, [(SKILL, "**A `practise` beat is independent work that is not any one cycle's check.** A Your Turn belongs to the move just modelled and is sized to it; a Practise unit is the work that draws on more than one,")], []),
    "TD-J21": (MOVED + ", and it says the code refuses any two My Turn units in a row, and that the slide check refuses consecutive My Turn slides only from different units (decision 7)",
               [(SKILL, "**Several examples of one move belong inside one My Turn unit; a genuinely different move earns its own cycle rather than a second My Turn beside the first.** A unit becomes its own slide, so two My Turn slides in a row means children watched two things before practising either:"),
                (SKILL, "so the sequence runs My Turn, Our Turn, Your Turn, My Turn, Our Turn, Your Turn and each move is used, and checked on its own, before the next is taught. `validate-lesson-design.py` refuses any two My Turn units in a row, and the slide check refuses two consecutive My Turn slides from different units (`MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`); two slides that split one unit whose examples cannot share a visual are one move and pass."),
                (SKILL, "This is a structural rule rather than a preference to weigh.")],
               [(SKILL, "refuses two My Turn units in a row for the same concept")]),
    "TD-J29": (MOVED, [(SKILL, "**A bridging cycle on small numbers earns two questions, not none**: \"even if its similar ... maybe your turn just has less questions\"."),
                       (SKILL, "which is also where `subject-maths.md`'s blocked-then-mixed rule lands, because the earlier cycles' Your Turns are the blocks and the last one mixes them.")], []),
    "TD-J32": ("story retired from the runtime; copied to the build log first (4.2.285)",
               [(LOG, "A Year 4 history class (15 September 2026) could have written its explanations after the second chunk"),
                (CONTENT, "The judgement is readiness, not position. When the use of a chunk is itself the substantial work")],
               [(CONTENT, "A Year 4 history class (15 September 2026) could have written its explanations")]),
    "TD-J39": ("the Practise's place matches the route (decision 7)",
               [(CONTENT, "\"activity\": \"the main application task, after the Teach/Do pairs that supply what it needs\",")],
               [(CONTENT, "the main application task after all Teach/Do pairs")]),
    "TD-J40": ("each distinct move opens its own cycle (decision 7)",
               [(SKILL, "In the structured hand-off, each genuinely distinct My Turn modelled move is its own `my-turn` source unit inside the same concept, opening its own cycle (its Our Turn and Your Turn come before the next move's My Turn, never two My Turns in a row), so it can carry its own starting instance, modelling state, representation configuration, script and answer/model.")], []),
    "TD-J48": ("code: a discovery lesson may discover more than one thing, in either shape (decision 4); the scaffold holds the same shape",
               [(VALIDATOR, "expect(discovery_shape_is_valid(kinds), f\"Discovery sequence must be: {DISCOVERY_SHAPE}\")"),
                (VALIDATOR, "DISCOVERY_FINDING_FROM_THE_SAME_EXPLORATION = [\"teach-why\", \"use-learning\"]"),
                (VALIDATOR, "DISCOVERY_FINDING_FROM_A_NEW_EXPLORATION = [\"explore\", \"make-sense\", \"teach-why\", \"use-learning\"]"),
                (SCAFFOLD, "f\"Discovery request must be: {DISCOVERY_SHAPE}\","),
                (SCAFFOLD, "discovery_shape_is_valid(kinds),")],
               [(VALIDATOR, "Discovery sequence must be exactly")]),
    "TD-J59": ("the leftover name goes, here and in the content route (decision 7)",
               [(DIAL, "Do not use this for substantial factual teaching; that still needs Content-based teaching."),
                (CONTENT, "This route allows a bounded observation, pattern or short exploration before a Teach")],
               [(DIAL, "CURRENT's Content-based routing rule"), (CONTENT, "CURRENT allows a bounded observation")]),
    "TD-J61": ("the synthesis is compulsory, matching the route and the code (decision 12)",
               [(EVID, "End with an honest synthesis that compares what actually emerged, then obtain proper individual evidence in the lightest form that still shows the learning.")],
               [(EVID, "Add an honest synthesis when it helps children compare")]),
    "TD-J73": ("says which unit the validator checks (decision 7)",
               [(TASK, "Use one `teach-needed` unit per distinct enabling idea, in the order taught. Every unit but the last carries the `pupilInstruction` children use that idea with; the validator refuses a `teach-needed` whose `pupilInstruction` is null when another `teach-needed` follows it.")],
               [(TASK, "the validator refuses a `teach-needed` followed by another whose `pupilInstruction` is null")]),
    "TD-J76": ("moved word for word above the task route's Output Format Block (decision 6); the leftover name goes (decision 7); the Output Format Block's duplicate of its plan-checkpoint sentence goes",
               [(TASK, "**A task with several stages stays one `do-task`, and `steps` is where the stages live.**"),
                (TASK, "the slide designer gives a stage that needs the board its own slide"),
                (TASK, "the single `do-task` is what keeps the doing reading as the centrepiece instead of fragmenting into a run of short practice beats."),
                (TASK, "Reach for a separate `plan-checkpoint` unit only when planning produces a distinct artefact before the doing begins."),
                (TASK, "When the planning or checkpoint is deliberately folded into one continuous sustained task, keep the lesson as one `do-task`")],
               [(TASK, "When CURRENT's planning/checkpoint"), (TASK, "Use a separate `plan-checkpoint` source unit only when planning produces a genuinely distinct artefact/beat before the doing.")]),
    "TD-L07": ("counts ideas, not slides (decision 2); the reviewer's check list it sits in carries quick checks 4.2.286's pointer (decision 4)",
               [(REV, "A beat carrying a second job that has no beat of its own, or a run of teacher-presented beats that teaches a second new idea before children have used the first, is a purposeful design defect, not polish; two teacher slides carrying one idea, such as a Teach split across two slides, are not that run (`preferences.md` → The Teach → Do → Teach → Do Rhythm);")],
               [(REV, "a run of teacher-presented beats with no pupil action between them")]),
    "TD-L10": ("reads what children do, not the format line (decision 9)",
               [(REV, "Two more reads on the class view, each REVISE when it holds across the lesson rather than on one line."),
                (REV, "And a lesson whose Do beats all share one response channel (every Do a spoken or written explanation, read from what children actually do rather than from its `format` line) is \"listen, then discuss\" however well each beat matches its Teach (`teaching-sequence-content-based.md`, the Do beat paragraph).")], []),
    "TD-L15": ("explanation follows each finding, and each is used before the next (decision 4)",
               [(RC, "For Discovery lessons, check that exploration is safe, bounded and dependable, pupils have the needed prerequisites, the result becomes visible, and explicit explanation follows each finding, with children using one finding before the next is taught.")], []),
    "TD-L17": ("code: the rhythm is read every review, not on a trigger (decision 6); the three-Teach procedure moved into the always-read note",
               [(PACKET, "\"Read every review, before the thinking, practice and evidence \""),
                (PACKET, "\"beats, say in your own words the move each Teach taught and what its \""),
                (PACKET, "\"own Do makes children do, and check each pair before reading on.\","),
                (PACKET, "\"every child using the idea; the pairing test; a beat that carries a \""),
                (PACKET, "\"second job; a Do whose expected \"")],
               [(PACKET, "Read when two teacher-presented beats run with no pupil action")]),
    "TD-L18": ("code: a question to the room is covered by the always-read rhythm, not routed to Slide Philosophy (decision 6)",
               [(PACKET, "\"in its script, or when a substantial task arrives with \""),
                (PACKET, "\"counted in ideas rather than slides; a question to the room against \"")],
               [(PACKET, "in its script, when a Do beat is a question to the room rather")]),
    "TD-L23": ("code comment: its reasoning moved to the always-read entry with the entry it explained (decision 6)",
               [(PACKET, "# The rhythm was a conditional read, and two of its triggers (a Do on a")],
               [(PACKET, "have already found the fault in order to be sent to the section that")]),
    "TD-L24": ("code: the always-read list now includes the rhythm (decision 6)",
               [(PACKET, "ALWAYS_READ_REVIEW_SECTIONS = ("),
                (PACKET, "# teacher's decision of 23 September 2026 made it an every-review read,")], []),
    "TD-M04": ("kept; its story count retired (the standing ruling), in the log (L1255); its paragraph's walk example became a plain example in quick checks 4.2.286",
               [(LD, "`null` is allowed only where the teacher acts and children watch (a My Turn, a stimulus, the setting of a task); the validator refuses it anywhere else, and that includes a Teach."),
                (LD, "a Teach without one is telling.")],
               [(LD, "28 saved designs in a row had written `null` there")]),
    "TD-M06": ("kept; the teacher's words stay without their date, copied to the log first (4.2.285)",
               [(LD, "**Write each beat's `minutes` as the time it really takes with a class, and read the sum.**"),
                (LD, "A teacher met exactly that on a finished deck: \"because we had a big task already, then we've also got to do worksheet, it won't fit the 45 min.\"")],
               [(LD, "on a finished Year 4 history deck (18 September 2026)")]),
}

ADDED = [
    ("TD-DEC-01", "decision 1: the designer's section now opens by sending it to the one home, naming what it holds",
     [(LD, LD_POINTER),
      (LD, "What this section adds is how you record it. The Do half is a `do` unit or a `pupilInstruction`. A substantial task is launched before it is instructed")]),
    ("TD-DEC-04", "decision 4: the discovery route says how a lesson discovers two things",
     [(DISC, "### When the lesson discovers two things"),
      (DISC, "A discovery lesson may discover more than one thing, and the rhythm holds inside it: each finding is taught and then used before the next is taught (`preferences.md` → The Teach → Do → Teach → Do Rhythm)."),
      (DISC, "When one exploration reveals both, make both visible, then teach why for the first and have children use it, then teach why for the second and use that. When the second finding builds on the first, run a second exploration once the first has been taught and used: explore, make the result visible, teach why, use the learning. Either way, each `Teach why` carries one idea."),
      (DISC, "then for each further finding either `teach-why`, `use-learning` (the same exploration showed it) or `explore`, `make-sense`, `teach-why`, `use-learning` (a second exploration), then `finish`.")]),
    ("TD-DEC-06", "decision 6: the skill route's cycle rules have their own section above the line, and the reviewer's compatibility route reads the rhythm too",
     [(SKILL, "## Cycles, and the beats around them"),
      (REV, "- always read `preferences.md` → Pride Lessons (Quality Anchor), What a Lesson Is For and The Teach → Do → Teach → Do Rhythm, `teacher-voice.md` → Final pre-flight check, and `task-contrasts.md` → The contrasts;")]),
]

# Paragraphs the new rules point at, pinned whole (the change check's gap 2):
# the bounded-attempt conditions and the maths opening the practical-lesson
# paragraph relies on, the one-warm-up limit, and the synthesis rule.
from ledger_mapping import paragraph_of  # noqa: E402

KEPT_WHOLE = [
    (SKILL, "Use it only when the attempt is safe, cheap and quick to reset"),
    ("references/subject-maths.md", "**A maths skill lesson opens with the model.**"),
    (TASK, "When even that would give too much away, a single quick neutral warm-up is fine"),
    (DIAL, "A synthesis names and compares positions children actually expressed."),
]
ADDED.append((
    "TD-KEEP-02",
    "the reviewer's own copy of the line it reads each route file down to, which decision 6 rests on (repair check 1.1)",
    [(REV, "7. Read the selected teaching-route reference from the start to, but not including, `## Output Format Block`, with the paged command the card prints.")],
))
ADDED.append((
    "TD-DEC-02",
    "decision 2 in the maintainers' README, which had said never two teach beats back to back",
    [("README.md", "Children process information before the next piece arrives. Never a second new idea taught before children have used the first.")],
))
ADDED.append((
    "TD-KEEP-01",
    "paragraphs the new rhythm text points at, pinned whole so the conditions it relies on cannot thin (change check, gap 2)",
    [(f, paragraph_of(f, phrase)) for f, phrase in KEPT_WHOLE],
))

# Rows of this ledger whose words the quick-checks change (4.2.286) altered.
# Each keeps its ledger quotes with the same substitutions that change made,
# so the pins follow the text on purpose, with the decision that changed it.
import re as _re  # noqa: E402

QC_SWAPS = [
    ("turn the words into a diagram or the diagram back into words,", "turn the words into a diagram or a diagram the class has not had explained back into words,"),
    ("Then read it against what the slide will show. If the line", "Then read it against what the slide will show and against what the class knew walking in. If the line"),
    ("stay legitimate choices rather than failures to aim higher.", "stay legitimate choices rather than failures to aim higher (`A quick check is a fresh case, not the last slide again`: a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case)."),
    ("A short response can establish new knowledge; select", "A short response can establish new knowledge (`preferences.md` → `A quick check is a fresh case, not the last slide again`: a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case); select"),
    ("including the last short response before main practice.", "including the last short response before main practice (`A quick check is a fresh case, not the last slide again`: a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case)."),
    ("Preserve purposeful repeated practice and useful simple checks;", "Preserve purposeful repeated practice and useful simple checks (`preferences.md` → `A quick check is a fresh case, not the last slide again`: a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case);"),
    ("A quick check straight after teaching is a legitimate beat, and not every Do must stretch, when children use what was just taught on a case the Teach did not show: a new picture to place, a new card to sort (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `A quick check is a fresh case, not the last slide again`).",
     "A quick check straight after teaching is a legitimate beat, and not every Do must stretch, when it is a fresh case (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `A quick check is a fresh case, not the last slide again`)."),
    ("not every Do must stretch, when children use what was just taught on a case the Teach did not show:", "not every Do must stretch, when it is a fresh case"),
    ("Accurate classification may itself be the intended check; do not", "Accurate classification may itself be the intended check (`preferences.md` → `A quick check is a fresh case, not the last slide again`: the cards are cases the Teach did not show); do not"),
]
QC_ROWS = {
    "TD-E02": "the list that sends designers to the diagram formats carries their condition (quick checks 4.2.286, decision 6)",
    "TD-E03": "the thinking line is read against what the class knew walking in too (quick checks 4.2.286, decision 8)",
    "TD-E06": "its permission points to when a quick check or recall is honest (quick checks 4.2.286, decision 4)",
    "TD-F09": "its permission points to when a short response is honest (quick checks 4.2.286, decision 4)",
    "TD-F12": "its permission points to when a short response is honest (quick checks 4.2.286, decision 4)",
    "TD-L09": "the reviewer's words kept, with a pointer to when a simple check is honest (quick checks 4.2.286, decision 4)",
    "TD-Z05": "the designer keeps the disagreement case and points to the one home for the fresh case (quick checks 4.2.286, decision 8)",
    "TD-Z18": "its permission points to the fresh case (quick checks 4.2.286, decision 4)",
}
_LEDGER = Path(__file__).resolve().parents[2] / "2026-09-22-teach-then-do-ledger.md"
for _raw in _LEDGER.read_text(encoding="utf-8").splitlines():
    _m = _re.match(r"^\| (TD-[A-Z]\d{2}) \|", _raw)
    if not _m or _m.group(1) not in QC_ROWS:
        continue
    _file = _re.search(r"`((?:agents|references)/[^`]+)`", _re.sub(r"«.+?»", "", _raw)).group(1)
    _present = []
    for _q in _re.findall(r"«(.+?)»", _raw):
        for _old, _new in QC_SWAPS:
            _q = _q.replace(_old, _new)
        _present.append((_file, _q))
    CHANGED[_m.group(1)] = (QC_ROWS[_m.group(1)], _present, [])
CHANGED["TD-Z07"] = (
    "retired by name (quick checks 4.2.286, decisions 1 and 2): the sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks",
    [("references/task-contrasts.md", "**Where the simpler task is right.** Straight after the lesson teaches that a Tudor child's work gave the family something it needed, a quick match of jobs the slide did not show (`carried water`, `minded the pigs`) to what each gave the family is the right check: it needs that idea and nothing more. The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks.")],
    [("references/task-contrasts.md", "It is fine there, named as a check"), ("references/task-contrasts.md", "As a two-minute orientation straight after the deal is taught")],
)

HOMES = [
    (PREF, "## The Teach → Do → Teach → Do Rhythm", "HOME-TD-PREF"),
    (LD, "### The Teach → Do Rhythm", "HOME-TD-LD"),
]

build(
    ledger="2026-09-22-teach-then-do-ledger.md",
    prefix="TD",
    changed=CHANGED,
    added=ADDED,
    homes=HOMES,
    pins="scripts/tests/teach_then_do_ledger_pins.json",
    mapping="2026-09-23-teach-then-do-mapping.md",
    title="Teach then Do mapping: where every ledger row went",
    snapshot="4.2.284 3de9c956",
    intro=[
        "Every row of `2026-09-22-teach-then-do-ledger.md`, with what happened to it in",
        "4.2.285. \"Unchanged in place\" rows are word for word where the ledger found",
        "them. Every other row names its new home and the words that now carry it; a",
        "retired phrase is listed as gone. Built and checked by",
        "`streamline-tools/td-change/build_td_mapping.py`: each phrase below was confirmed",
        "present (or absent) in the files before this was written. The same list is",
        "pinned by `scripts/tests/teach_then_do_ledger_pins.json`.",
    ],
)
