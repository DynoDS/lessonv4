---
name: make-subject-file
description: Use when the teacher asks to write, build, or revise a subject-discipline file for this plugin ("make a subject file for science", "/make-subject-file", "history needs its own file"), or when a subject's lessons keep coming out well run and accurate but not really that subject, or when the same correction keeps being made to every lesson in one subject.
---

# Make a Subject-Discipline File

This builds one `references/subject-<name>.md` with the teacher, over a working session. It is not a solo job: the file is only as good as his classroom experience inside it, and that has to be drawn out rather than assumed.

## Resolve the Package and Source Roots

Do this before reading or writing any plugin file.

Obtain exactly one `PLUGIN_ROOT_CANDIDATE` from the active host:

- **Claude Code:** use the literal absolute path substituted for `${CLAUDE_PLUGIN_ROOT}` in this line.
- **Codex:** use the absolute path shown for this activated `skills/make-subject-file/SKILL.md`; take the directory containing `SKILL.md`, then its parent twice.
- **Another host:** use the absolute installed `lesson-resources` package directory supplied by that host.

Run:

First check this computer and find the Python to use, without elevated access, and store the path it prints after `PYTHON=`. On `SETUP_NEEDS_FIX` run its `SETUP_FIX_COMMAND:` line exactly as printed (on Codex with escalated permissions and network access); on `SETUP_BLOCKED` re-run it once with permission to start a program; on `SETUP_NEEDS_PYTHON` ask the teacher before following `Installing Python` in `[PLUGIN_ROOT_CANDIDATE]/references/computer-setup.md`:

```bash
node "[PLUGIN_ROOT_CANDIDATE]/scripts/check-setup.js"
```

`"[PYTHON]"` below means that path; in PowerShell call it as `& "[PYTHON]" ...`.

```bash
"[PYTHON]" "[PLUGIN_ROOT_CANDIDATE]/scripts/verify-plugin-root.py" "[PLUGIN_ROOT_CANDIDATE]"
```

Store the value after `PLUGIN_ROOT=`. If verification fails, stop and report the verifier's error exactly. Do not search for another package.

This workflow also requires the host environment variable `LESSON_RESOURCES_SOURCE_ROOT`. It must contain the absolute writable `lesson-resources` directory inside the real `teaching-plugins` checkout.

If it is absent, stop with:

```text
PLUGIN_SOURCE_ROOT_ERROR: LESSON_RESOURCES_SOURCE_ROOT is not set.
```

If it is present, run:

```bash
"[PYTHON]" "[PLUGIN_ROOT]/scripts/verify-plugin-root.py" --source "$LESSON_RESOURCES_SOURCE_ROOT"
```

Store the value after `PLUGIN_SOURCE_ROOT=`. If verification fails, stop before Stage 1 and report the verifier's error exactly.

Every repository-relative write target in this file under `lesson-resources`, including `references/`, `agents/`, `.claude-plugin/` and `.codex-plugin/`, is relative to `PLUGIN_SOURCE_ROOT`. The repository-level `docs/` directory is at `[PLUGIN_SOURCE_ROOT]/../docs/`. Run git commands from `[PLUGIN_SOURCE_ROOT]/..`. Never write to `PLUGIN_ROOT` unless its canonical path is exactly the same as `PLUGIN_SOURCE_ROOT`.

## What this file is for, and why that keeps it short

The whole point of it is to help the lesson-designer make better pedagogical decisions. It has two readers and one test serves both: the designer deciding this lesson, and the design-reviewer checking afterwards whether the lesson actually asked for what the subject needs.

The designer's decisions are concrete. Which structure this objective wants. What children actually do in each beat. What the practice demands. Which words earn a vocabulary card. What ends up on the page. Anything in the file that does not reach one of those is decoration, however true it is, and it costs attention that the decisions need.

The plugin's general layer already answers *how do I run a good lesson*: the Teach to Do rhythm, modelling before independent work, the success rate to aim for, varying the register, keeping the slide clear. That answer is the same in every subject, and it was refined over six months of maths.

What it cannot know is what the lesson is *for* in this subject. A lesson can pass every general rule, carry accurate knowledge, keep children busy the whole hour, and never once ask a child to do what someone who works in that subject does.

That gap is the only thing this file writes. Everything cut at Stage 7 is cut because the general layer already said it, and two files pulling at one decision cost more than either earns.

## Before you start

Read these two, in this order. They are the rules and the model, and this skill does not restate either.

- `[PLUGIN_ROOT]/references/authoring-subject-files.md`: the one job, the add-never-overrule rule, what earns a section, where content comes from, voice.
- `[PLUGIN_ROOT]/references/subject-geography.md`: one subject's finished answers. Read it for how concrete a good answer gets and for the voice it is written in, not for a shape to copy. Its headings are what geography turned out to need.

## How to talk to the teacher through this

Ask one or two questions at a time, then stop and wait. Several questions stacked in one message cause him to skim and answer the easiest one, and the thin answer you get back is the answer that ends up in the file. A short exchange that takes twelve turns produces a better file than one long questionnaire that takes two.

Keep his answers close to his own words when you draft. A rule written in his phrasing is one he recognises and approves; the same rule reconstructed into neutral guidance is one he reads as somebody else's and sends back.

---

## Stage 1: Set up

Confirm which subject, and check whether a file already exists (list `references/` for `subject-*.md`; a revision follows the same stages against the current file rather than starting blank).

**First, ask whether he has already written the thinking up.** He increasingly arrives with a document of his own: his position on the subject plus the research he tested it against, written in his own time before the session. When one exists, read it in full before anything else, because Stages 3, 4 and 5 have already happened on paper and re-interviewing him about a document he has just handed you wastes the session and reads as not having looked at it.

Three things to check in the document rather than assume, since the file's quality rests on them:

- **Did his own position come before the research?** The document usually says. If the research came first he may have been anchored by it, so the parts that sound like the subject association may not be his, and those are the ones to put back to him.
- **Are the conflicts resolved?** Where his experience and the research disagree, the document may already say which way he ruled. Take his ruling. Where it names a disagreement and settles nothing, that is the one thing still worth asking, and it is a short conversation rather than the full Stage 5.
- **What in it is a position rather than an instruction?** A document written for a human reader carries lines that are true, that he means, and that no designer can act on. Those are for Stage 6 to convert or Stage 7 to cut, not to wave through because he wrote them.

Then go to Stage 6, and save the document itself into `[PLUGIN_SOURCE_ROOT]/../docs/subject-sources/`. Nothing reads it at lesson time, so it costs the designer no attention, and a later session re-weighing one of the file's rules can see what it was built from.

When no such document exists, run Stages 3 to 5 as written.

Either way, ask how much he has actually taught the subject, because it changes where the file's weight sits:

- **Taught it repeatedly.** His experience leads, the research checks it.
- **Taught it a little, or inherited a scheme.** The research leads, his experience corrects it.
- **Barely taught it.** The research carries the file. Say so plainly, and note it in the commit message at Stage 10 so a later pass knows to strengthen it once he has taught it. Do not put that note inside the file: a dated caveat in the file costs attention on every future lesson run.

## Stage 2: Name the failure

Before anything is written, get one sentence: **what does a bad lesson in this subject look like when it is well run?**

Not a chaotic lesson. A calm, well paced, accurate one that somehow is not really the subject.

Geography's is: children can recite where the Amazon is, and cannot think about anywhere.

Offer him a draft to react to rather than an open question, because reacting is easier than generating. Draw the draft from what you already know about how the subject fails in primary.

If no such sentence can be found, stop and say so. Every section below hangs off this one, and a file without it comes out as general teaching advice with subject nouns dropped in.

## Stage 3: His classroom, before any research

**Do this before you search anything.** Research first anchors him: he reads what the Historical Association says and agrees with it, and the one thing that makes this file his is gone. Ask cold, then research, then bring the conflicts back.

Six questions. Two at a time at most. Each one is anchored on a real lesson he can picture, because open questions about "your approach" produce generic answers and specific questions about a Tuesday produce usable ones.

| Ask | Feeds the Stage 6 question |
|---|---|
| The best lesson you have taught in this subject. What were the children actually doing in the middle twenty minutes? | 1, what they are really doing |
| One that was properly planned and still fell flat. What went wrong? | 2, how it goes shallow |
| When you are handed a planned lesson in this subject, what do you always end up changing? | 2 and 6, and the Stage 2 failure |
| What do the children find hard that is not the content itself? | 2 |
| The best books you have marked in this subject. What was actually on the page, and is a book even where this subject lands? | 4, what it leaves behind |
| Which words do the children use when they are reasoning well in this subject? | 5 |

Follow a thin answer up once, concretely, then move on. "What made that better than the other version?" gets more than "can you say more about that?".

Where an answer is quotable, keep the phrasing. Where it is a story about one class, keep the judgement inside it and drop the class.

## Stage 4: The research, live

Search properly rather than working from memory. Subject positions shift, Ofsted's reviews get superseded by subject reports, and a file resting on a half-remembered 2021 review is a file that steers on stale ground.

Four things to find, and report what you actually find rather than the parts that fit:

1. **The subject association's position** on what the discipline is and how it is taught well in primary.
2. **Ofsted's subject review or subject report**, whichever is current. Check for a newer one rather than assuming the review is the latest word.
3. **The National Curriculum's own disciplinary strand** for the subject, which is usually the clearest short statement of the moves (working scientifically, historical enquiry, and so on).
4. **Where the field disagrees with itself.** Every subject has a live argument in it. A file that reports only the consensus hides the decision the teacher should be making.

Starting points to verify rather than trust:

| Subject | Where to look first |
|---|---|
| Science | Association for Science Education; Primary Science Teaching Trust; Ofsted science review; the working scientifically strand |
| History | Historical Association; Ofsted history review; second-order concepts (cause, change, significance, evidence, interpretation) |
| Art and design | NSEAD; Ofsted art review |
| Design and technology | Design and Technology Association; Ofsted DT review |
| Music | Model Music Curriculum; Ofsted music review |
| PE | Association for Physical Education; Ofsted PE review |
| Computing | National Centre for Computing Education / Teach Computing; Ofsted computing review |
| RE | NATRE; the Religion and Worldviews argument; Ofsted RE review |
| PSHE | PSHE Association |
| English | EEF Improving Literacy in KS2; Ofsted English review |
| Languages | NCELP; Ofsted languages review |

## Stage 5: Put the research to him and ask whether he agrees

**All of it goes back to him, not only the parts that conflict.** Research he was never asked about lands in the file reading as his own teaching, and the first he knows of it is a lesson built on a position he would have rejected. He is the one who has to approve these lessons, so he approves what they are built from.

Give him what you found in plain English, a few lines per finding, and ask straight out whether it matches how he sees it. Expect three answers and treat all three as real: yes, no, and "that is true but not how it plays out with my class". The third is usually the most useful thing in the session.

Then the two kinds of disagreement, neither settled quietly:

**Research against research.** Where the field argues with itself, name both positions, say which way you would lean and why, and let him pick. Whichever he picks is what the file teaches.

**Research against his classroom.** Where what he told you at Stage 3 conflicts with what you found at Stage 4, put both side by side and let him rule. Do not side with the paper by default. He has taught these children and knows which advice survives a Tuesday afternoon, and a file that overrides his experience with a research finding is a file whose lessons he sends back.

Keep the pace the same as Stage 3: a couple of findings at a time, then wait. A wall of research settled in one message gets waved through, and waved-through research is exactly what this stage exists to stop.

## Stage 6: Draft the file

**Work from the questions below, not from a template.** Geography's file is one subject's answers, not the shape every subject takes. A heading exists because this subject filled it with something that changes a decision, never because another subject has one.

That matters because the differences between subjects are real and a template hides them. PE has no book, and the live question is how much of the lesson children spend actually moving. Art's book is a sketchbook doing a different job, and it carries a question history does not have: how much do children copy and how much is theirs. RE's single biggest question is whose voice a belief is told in, and nothing else has an equivalent. A fixed set of headings would never have surfaced any of those.

So work the questions, keep what this subject genuinely answers, drop the rest without apology, and name each section by what the answer turned out to be. Three or four answered well is a good file.

**Question 1 is required. The rest are earned.**

**1. What are the children actually doing when this is really the subject?**

The handful of things a child does when the lesson is the real version. Four to seven. More than seven and topics have crept in; fewer than three and the discipline has not been pinned down yet.

Each gets a short paragraph saying what it is and what separates the real version from the shallow one. Where the doing is physical, say so concretely: the child holds the atlas and finds something the teacher did not say aloud. Written that way, the designer picks the right structure by itself, which travels further than a table telling it which structure to pick.

This is the one the design-reviewer reads, so a file without it is not a file.

**2. How does a lesson here go shallow while staying accurate?**

Three or four ways it comes out correct, busy, and not the subject.

Each needs what it looks like, what to do instead, **and its limit**. The limit is not optional: a principle with no stated boundary over-fires, and the over-firing becomes the next thing he flags. Geography calls a map on the board a picture rather than a tool, then immediately says a map on the board is exactly right when it is the shared reference the class annotates.

**3. What does this subject look like on the board?**

The visual or representational tools it thinks with. This feeds the designer's Teaching Representations line, which is a binding contract: whatever it names, the slide-designer must render on the modelling slides and the worksheet-designer on the practice.

Worth answering in almost every subject, because that section's own examples are nearly all maths, so a foundation-subject designer reaches a binding contract with nothing to reach for.

**4. What does the lesson leave behind, and where?**

A book page, a sketchbook, a made thing, a performance, or genuinely nothing. Say which, then say what it holds when it went well and what it looks like when every answer is right and the thinking never happened.

Skip it where the subject leaves nothing, and say what stands in its place instead.

**5. Which words do children reason with here?**

The words that earn a vocabulary card are the ones children think *with*, not the ones today's topic contains. The general rule already says that; what this adds is which words those are in this subject, because a designer reading the general rule will let a proper noun through. Then name the exception, because there is always one.

Usually a few lines rather than a section of its own.

**6. What does this subject get mistaken for?**

The lesson that arrives wearing another subject's clothes. Map work read as content when it is a procedure. A science practical that is a recipe rather than an enquiry. A history lesson that is comprehension with a picture of a Roman on it.

One or two per subject, and often best folded into question 2.

**7. What is the argument inside this subject that a teacher has to take a side on?**

Every subject has a live disagreement in it, and a file that reports only the settled parts hides a decision the teacher should be making. This is where RE's whose-voice question comes out, and where the research from Stage 4 that he ruled on gets written down as a position rather than a survey.

## Stage 7: Cut it back

Read the draft and remove anything about pace, slide design, modelling, worksheets, his voice, or how much fits in a lesson.

Three tests, and the first is the one that matters most:

**Which decision does this change?** Name the actual choice the designer would make differently having read the line: the structure it picks, the task it sets, the word it puts on a card, the thing it expects in the book. If no decision moves, the line is true and inert, and it goes. This is the test that keeps the file doing its job, because a subject file fails far more often by being interesting than by being wrong.

**Would this be true in a maths lesson too?** If yes, the general layer already says it, and a second copy here competes with the original.

**Change the topic and the year group.** Does the line still steer right? A line that only describes one unit is a lesson brief, not a subject file.

Expect to cut a lot. Geography's file came out at nine short sections after this stage, and it is short for a whole subject because the general layer is doing its half.

**Then check what each surviving idea is attached to, because cutting is where the strongest ideas quietly go optional.** An idea written as something *available* to the designer gets skipped under pressure, however good it is and however well you argued it. An idea attached to a decision the designer has to make survives, because they cannot finish the design without meeting it.

Geography proved this the hard way. Its guard against showing a place through one lens survived compression intact, because it names where the repair lands: in the photo requirements, which the designer has to write. Its two best ideas alongside it, the beat where children question their evidence and the moment children are struck by the world, were compressed into true, well-argued sections that named no mechanism, and the very next lesson design skipped both.

So for each idea you are keeping, name what forces the designer to meet it: a field they fill, an artefact they produce, or a decision they already make and now have to answer for. Where nothing forces it, the house pattern is to have the design name it or say plainly why this lesson has none, the same way an Apply slide is earned rather than assumed. A word like "usually" or "where it helps" in front of a load-bearing idea is the tell that it has become optional.

Last read, as a stranger: does this tell a very good teacher who knows nothing about the subject what they would have got wrong? If it reads as sensible general advice with subject nouns dropped in, it has drifted back and needs another cut.

## Stage 8: The collisions

While drafting you will hit general rules that do not fit this subject. Fluency before reasoning, in a subject with no fluency stage. Success criteria being either a procedure or a labelled category set, when neither fits "explain why the Romans invaded". The ~80% success target, in a lesson whose point is a genuinely open question.

**Never write the exception into the subject file.** It is forbidden by the architecture and for a reason worth holding onto: a general rule written from one subject's habits is wrong for every subject, not only the one you noticed. An exception here fixes this subject, leaves you writing the same exception again for the next one, and leaves every subject without a file of its own still steered wrongly. Rescoping the general rule fixes all of them at once, including subjects nobody has written up yet.

So collect them as you go, and bring them out at the end as their own decision. For each: what the rule currently says, which subjects it steers wrong, and a proposed rescoping that leaves maths behaving exactly as it does today. He rules on each one, and the rescoping is separate work from this file.

Two of these are worth more than a thin subject file, so treat finding them as a result rather than an interruption.

## Stage 9: Prove it on a real lesson

A file you never exercised is a hypothesis.

Build one lesson in the subject through `make-lesson`, passing `PLUGIN_ROOT: [PLUGIN_SOURCE_ROOT]` in that run's worker prompts so the edit takes effect immediately rather than waiting for the version-pinned cache. Read the actual lesson design, not the build log.

Two checks always, and a third whenever a source document exists:

- **The casualty.** Does the lesson now ask children to do what the Stage 2 failure said they never did?
- **The cousin.** Run a second lesson in the same subject on a different topic and year group. The first proves the file works; only the second proves it generalises rather than steering every lesson toward the one example in it.
- **The comparison, when he wrote a source document at Stage 1.** Run the casualty brief once more, identical in every respect except that the subject-discipline file is his raw document, unedited. Then read the two designs side by side.

The comparison is the only check that catches what cutting broke, and it catches it nowhere else. The casualty and the cousin both ask whether the drafted file produces a good lesson, and it will: a strong lesson with one of his best ideas silently missing still reads as a strong lesson, so nobody notices the loss without the other version beside it. Geography lost two ideas exactly this way, and both were found by this run rather than by reading the file.

How to read the result. Anything the document's version does that the drafted file's version does not is an idea that lost its mechanism in the cut, so the repair is to attach it to a decision the designer has to make, as Stage 7 sets out. **Do not repair it by putting the length back**, which is the tempting move and the wrong one: the ideas that survived compression survived because they named a mechanism, not because they were long. Read the reverse direction too, because it is real evidence and easy to skip: where the drafted file's version is the better lesson, the cut worked, and where the existing file contributed that strength, it has earned keeping.

One limit. These runs are probabilistic, so a single missing beat can be variance rather than a loss. Before concluding the cut dropped something, check whether the document actually pushes that idea hard, and where it is genuinely load-bearing for him and a repeat run also misses it, treat it as real.

Show him all of them, and expect the runs to surface a small fix the drafting missed. That is a real result, not a setback.

## Stage 10: Ship

Bump the `version` in `[PLUGIN_SOURCE_ROOT]/.claude-plugin/plugin.json` and `[PLUGIN_SOURCE_ROOT]/.codex-plugin/plugin.json` to the same next version, commit from `[PLUGIN_SOURCE_ROOT]/..`, and push. Without the version bump the marketplace copy never resyncs and the file is authored but not live, which looks exactly like a file that did not work.

In the commit message, record the subject, where the content came from (his experience, the research, or both), any research-against-classroom conflicts and how he ruled on them, and any collisions logged at Stage 8. A later session re-weighing one of these rules needs to know what it was built from, and the history is where that belongs rather than the file.

Then add the new file to the reference list in `agents/lesson-designer.md` only if the routing has changed. It normally has not: the designer lists the references directory and reads whatever `subject-*.md` matches, so a new file is picked up with no wiring.
