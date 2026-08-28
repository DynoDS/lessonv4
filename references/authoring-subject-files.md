# Authoring a Subject-Discipline File

Read this when writing or revising a `subject-<name>.md`. It is not read during a lesson run, so nothing here costs the designer any attention.

`subject-geography.md` is the working model. Copy its shape from the file itself rather than from a description of it. What follows is only what that file cannot show you: why the shape is what it is, and the two rules that govern how these files behave.

## The one job

A subject file answers a single question: what does thinking in this subject actually look like, and what would a lesson have to ask a child to do for it to count?

Everything else a lesson needs (its structure, its pacing, the slide conventions, the house style) is already handled by guidance every lesson reads. A subject file that drifts into those is duplicating a decision made elsewhere, and two files pulling at one decision cost more than either earns.

The failure these files exist to prevent: a lesson can carry accurate subject knowledge, keep children busy throughout, and never once ask them to do what someone who works in that subject does.

## They add; they never overrule

A subject file has no authority over the general guidance in `lesson-designer.md` or `preferences.md`. It supplies knowledge those files do not hold. It does not carry exceptions to them, and it must not contain a "where this subject differs" list.

**When you hit a general rule that only holds for one subject, that rule is mis-scoped. Stop and take it to the teacher with a proposed rescoping.**

The reason is that a general rule written from one subject's habits is wrong for every subject, not just the one you noticed. Overriding it in your subject file means writing the same exception again for the next subject that needs it, while every subject with no file of its own still gets steered wrongly. Rescoping the general rule fixes all of them at once, including subjects nobody has written up yet.

Expect this to happen often, because the general layer was built while the teacher was working almost entirely in maths. Rules about success rates, about a concept being a procedure with steps, about fluency preceding reasoning, about reference material coming off before independent work, and about success criteria being either a method or a category set are the ones most likely to collide with a subject taught a different way. A collision is a finding worth reporting, not a problem to route around.

Record the collision and its resolution in the commit message, so a later session can re-weigh the rescoping against the evidence that prompted it.

## What earns a section

There is no template. Geography's headings are one subject's answers, and copying them into the next subject produces padding, which costs the designer attention while telling it nothing.

The differences are real. PE leaves no book behind and its live question is how much of the lesson children spend moving. Art's sketchbook does a different job from a book page, and art carries a question history does not: how much do children copy and how much is theirs. RE's biggest question is whose voice a belief is told in, and no other subject has an equivalent. A fixed heading set surfaces none of those.

So a heading exists because this subject filled it with something that changes a decision the lesson-designer makes, never because another subject has one. Three or four sections answered well is a good file.

**One section is required in every file: what children are actually doing when the lesson is really this subject.** That is the failure this whole layer exists to prevent, and it is the part the design-reviewer reads. Everything beyond it is earned.

The questions worth working through to find the rest, and how to judge an answer, live in `skills/make-subject-file/SKILL.md`.

Two tests for any passage that survives. Name the decision the designer would make differently for having read it: if none moves, the line is true and inert. Then change the topic and the year group and check it still steers right, because content that only describes one unit belongs in a lesson brief.

## Where the content comes from

Two sources, and a file resting on only one of them is weaker for it.

Research the discipline properly: what the subject associations, the DfE and Ofsted subject reviews, and the research literature say about how the subject is taught well, including where they disagree with each other. Report what you find rather than only the parts that fit.

Then the teacher's own experience of teaching it, in his words. He has taught these subjects to real children and knows which advice survives contact with a Tuesday afternoon. Where the research and his experience disagree, put both to him and let him rule rather than quietly siding with the paper.

## Voice

These files brief an agent, but the examples inside them become prompts and sentences children read. So the teacher's voice rules apply to anything quotable: plain, warm English, and no em dashes or en dashes anywhere.
