# Teaching Sequence — Task-Centred (Set Task → Teach → Plan → Do → Share)

Use this file when the lesson-designer has chosen **Task-Centred** as the structure — lessons built around carrying out one substantial task (planning and running a science enquiry, designing and making a product, conducting fieldwork, producing an extended piece of writing after a focused input, working an open maths investigation).

The structure choice itself is made in the main agent's Structure Decision section. By the time this file is read, the structure decision and the boundary tests have already been applied — what follows is execution detail for the chosen rhythm.

---

## Teaching Sequence Specification

The task is the spine of the lesson; teaching is a short input that serves it. Design the beats so the doing gets the bulk of the time — the most common way this structure fails is the teaching swelling until the task it was meant to enable has no room left.

**Set the Task** — give children the real task, brief, or question, and make clear what a good outcome looks like. For a science enquiry the task is the question ("Does water disappear faster in some places than others?"); for design-and-make it's the brief; for an extended write it's the prompt. The success criteria here is the standard for the task itself — what makes a good fair-test plan, a strong bridge, a clear opening paragraph — and it stays visible while children work, because it is the thing they are aiming at, not a recap of what was taught.

The slide for this beat carries the question, the success criteria, a visual of the real context, and any task the children carry out here — and trims everything else to the teacher's voice. The common task is a written prediction: when the beat asks children to predict, the prediction prompt and its sentence stem ("I think ___ because ___") go on the slide, because writing the prediction is something the child *does*, and a task left only in the speaker notes simply won't happen for a teacher who delivers from the board. What stays in the notes is the *framing* — the why-it-matters, the orientation, the teacher's delivery voice. When the beat includes a prediction, also add an investigation brief to the slide: one to two lines that tell children what they will do and what they will have. The teacher's framing colours the task for the room; the investigation brief is the child's prerequisite — a prediction about an undescribed investigation is a guess, not reasoning, so the brief that enables the prediction belongs on the slide alongside the prediction prompt, not in the teacher's script. A Set the Task slide that paraphrases the question in a text block alongside the SC ends up as a wall of black text, and a child looking up is forced into comprehension instead of preparing to act — so keep on the slide the question (on the title), the SC ("your job today") in a panel, the visual hook, the investigation brief (if a prediction follows), and the prediction prompt the child writes from. Everything else is the teacher's voice.

**Teach what's needed (conditional and bounded)** — teach only what children genuinely need to make a worthwhile attempt while protecting enough time for the sustained task. Teaching through the real task remains a strong option when it avoids meaningless throwaway practice, but it is not an absolute. Choose the best enabling input for this lesson: a model, prepared example, flawed example, physical demonstration, short warm-up, guided move or no extra input when children already have what they need. If children already have what they need, teach nothing and move to planning. Keep it short on purpose: in a task-centred lesson the doing is the lesson, so a long teaching input both eats the time the task needs and quietly turns the child's work into copying the teacher's rather than thinking for themselves. Short is one idea and a few minutes, not the idea cut to a heading. The child-facing `enablingInput` is the one line children keep; `explanation` supplies necessary visible meaning beside the `modelledOn` instance, with completion or annotation produced live where that is the chosen teaching action. Judge whether this teaching prepares the `pupilInstruction` that follows. `You can pass without giving a reason` above Chloe's bubble, with the meaning and the reason only in the script, is the commonest way this route ships a slogan for a lesson (`preferences.md` → Slide Philosophy, `Use the teaching object to carry meaning`).

**One idea per enabling unit, used before the next arrives.** The Teach → Do rhythm in `preferences.md` holds here exactly as it does in a content lesson; a task-centred lesson is not exempt because its teaching is short. When the task needs two distinct inputs (what a fair test is and how to record a result; the right to pass and what happens to a worry), each is its own `teach-needed` unit, and children do something with the first before the second is taught: its `pupilInstruction` is every child using that idea: a decision on a fictional case each child commits to, a sort, a line rewritten, a reply chosen between two and defended. A question the teacher puts to the room is not that use unless it is chosen so the answer needs the idea and every child commits (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `Questioning is not doing`). Only the last enabling idea may leave `pupilInstruction` null, because the planning or the task itself is what children do with it. Packing the ideas into one unit with one check after all of them puts several slides of the teacher talking in a row, and the deck reads as a run of separate slides rather than a lesson moving somewhere.

Model the *thinking and the structure*, and leave the child's own decisions open. Showing how to decide what to change does not hand over which spots to compare or how to measure — the child still makes those calls. This is how the modelling stays honest on the real task without a decoy: a real task has enough genuine decisions inside it that seeing the move done once doesn't pre-empt the child's version. When even that would give too much away, a single quick neutral warm-up is fine — but only one, and named as a warm-up ("let's practise the move on something simple, then plan our real test"), never a second and third task that compete with the real one for the children's attention.

Separate the *move* from the child's own task decisions, but normally provide the exact instance the teacher can model. The move (find a fact, judge whether it sells, shorten it to a note) is what you teach; the design also supplies the particular place, fact or notes used to demonstrate it, the intended completed outcome and the important decisions to expose. The teacher may substitute another suitable example during the real lesson. When completing a frame is part of the model, the modelling resource carries that exact starting instance in a blank or partly blank frame plus the success criteria; it does not leave the teacher to invent the instance. Where a completed reference genuinely helps less-sure children, the shape may be a clearly-labelled example on one slide and the exact blank or partly blank helper for the next model on another. The child's own important decisions on the real task remain open. (The cross-structure principle is in `evidence-synthesis.md` §2.)

**Choosing the enabling input (the general decision lives in `evidence-synthesis.md` §2).** How you ready children for the task — a narrated model, a worked example, a flawed example to critique, or a short warm-up — is that cross-structure decision; what is *particular* to a task-centred lesson is **ownership**. A carefully chosen flawed version may help when it cleanly exposes a strong predictable mistake without handing children a plan to copy. Use it only when it is the best preparation for the task, not because the route expects one. It keeps attention on the real question (no decoy), front-loads the misconception right where it bites, and gives less-sure pupils a concrete case to react to — without becoming a plan the class copies. Place it after the short teach, as the bridge into the doing.

**Plan + checkpoint (optional)** — include a checkpoint only when an unchecked decision could waste substantial time or materials, create a safety risk, make the task impossible or invalidate the evidence or outcome. Do not add one merely because planning occurs. Planning and doing may continue as one flowing task unless separating the plan materially improves the work or protects one of those important conditions.

**Do the task** — sustained independent work. This is the bulk of the lesson and the artefact, and it must *read* as the centrepiece, not as one more short practice beat. Its `thinking` line names the decisions inside the task that the enabling teaching made possible (`which of these facts sells the product, and how do I know?`), not the making; a task children could have done before the enabling input has used none of it. When the task turns on an idea named in `concepts`, the enabling teaching shows it on a case that is not the task's own, and the task is its second instance; both carry the concept's `conceptRef`. When the plan-checkpoint and the doing are one continuous task — children plan, get the nod, and carry straight on — design them as a single weighted main-task beat with the checkpoint folded in as the teacher's gate, rather than two equal-weight beats that make the heart of the lesson look like two quick activities. Signal the weight in how the beat is named — "your research — most of the lesson" — not with a label that reads like a 90-second exercise. Split the plan into its own beat only when committing to an approach produces a distinct artefact the child needs before they can begin (a fair-test plan, a labelled design). The teacher supports children as needed; the resource does not prescribe a checking or marking routine. When the task runs past one lesson — a science test that takes days to show a result, a make that spans two sessions — today's lesson ends at the natural break, and the design says where that is so the teacher and the slides both stop in the right place.

**Launch the task; do not only instruct it.** Set the Task put the question and the standard on the board at the start, but when the enabling input has run to several units, or the product has a form children have not yet made in this lesson (a rule, a plan, a paragraph), the doing arrives a long way from that slide and needs its own launch: one line naming what the lesson has established and the task now has to use; a good instance of the product beside a weak one with the difference named; and the steps in the order children take them (make one, combine, agree). These are beats on the board, normally one or two short slides before the task slide, and the teacher's spoken orientation stays in the script (`preferences.md` → Slide Philosophy, `Giving a task its instructions is not launching it`). They live in `do-task.content.launch`: `established` is the gathering line, `goodLooksLike` the good instance beside the weak one with the difference named, `steps` the order children work in. A fuller model of the product, worked in front of the class, is still a `teach-needed` unit with the instance as its `modelledOn`. A task children can begin from its question alone, because the enabling input was one unit and the product form is familiar, leaves `launch` null.

**Finish the task purposefully** — return to the task's original purpose through the form that fits: conclude against the question, evaluate, reflect, explain or share when sharing adds value. A separate Share beat is optional when the task already ends with a meaningful conclusion, evaluation or reflection. The lesson must finish the learning rather than simply stop.

The finish carries one job: completing the task. Something the lesson must also establish that has no beat of its own (a class routine, a piece of information, a safety note) tends to get appended to whichever beat is nearest, usually this one, and the lesson's line breaks there: children finish the product and then meet a new thing with nothing to do with it. Give it a home on the line instead. If the task can use it, it is an enabling idea before the doing. If it belongs to the product, put it in the product: a question box is a rule about how we ask questions, so it can be one of the agreement's own rules. If it is a routine rather than learning, it lives in the teacher's notes.

**Predictable task mistakes** may be addressed through the cleanest suitable response: modelling, a checkpoint, a flawed example, comparison, a short demonstration or another teaching move. Do not force every problem into the same misconception routine. When using a flawed comparison, keep every feature except the taught one sound so the diagnosis remains clean. That spot-the-mistake can sit at the share as a closing check, or — often more powerfully — before the independent attempt as the bridge into it (see "Teach what's needed"), where it both teaches the rule actively and gives less-sure children a concrete example to start from. Whichever form it takes — a single flawed example to fix, or two options to choose between — it has to be *cleanly* wrong on the one feature being taught. A contrast whose "wrong" option is also defensible on some other axis (a plain describing note that could still legitimately open a brochure) confuses rather than teaches: hold everything else constant, vary only the taught feature, and ask the question on that feature — "which one *sells* it?" not "which *belongs*?" (the discipline is in `evidence-synthesis.md` §5).

**Success criteria** is the standard for the task, kept visible throughout. Use how-to steps when the task turns on a clear move (the fair-test sort); a feature checklist when it's a product or a piece of writing.

---

## Output Format Block

When writing `lesson-design.json`, append the applicable source-unit objects to `teachingSequence` in final lesson order. The common source-unit fields live in `output-template.md`.

Set the Task:

```json
{
  "kind": "set-task",
  "content": {
    "question": "the one short question or brief children are working towards",
    "investigationBrief": null
  }
}
```

Use `investigationBrief` when children need one or two lines of real task context before they can act or predict. Use the common source-unit `pupilInstruction` for any pupil action performed at Set the Task, including a prediction and its exact sentence stem. Use `pupilInstruction: null` when children only receive the question/context at this beat.

Do not repeat `What good looks like` inside `content`. Define that standard once as success criteria and attach it through `successCriteriaRefs`.

Teach what's needed, **only when extra enabling input is actually needed**:

```json
{
  "kind": "teach-needed",
  "content": {
    "enablingInput": "the one idea children need, as the one line they keep",
    "explanation": "the teaching of that idea as the child reads it, in two or three short lines: what it means, why it matters, what it looks like; null only when the idea and its instance already carry the meaning, never because the script explains it",
    "modelledOn": "the exact real-task instance or one justified neutral warm-up"
  }
}
```

When children already have what they need, omit the `teach-needed` source unit entirely. Do not create a dummy unit whose content says `None`.

Use one `teach-needed` unit per distinct enabling idea, in the order taught. Every unit but the last carries the `pupilInstruction` children use that idea with; the validator refuses a `teach-needed` followed by another whose `pupilInstruction` is null.

Plan + checkpoint, only when earned:

```json
{
  "kind": "plan-checkpoint",
  "content": {
    "whatChildrenPlan": "the approach children commit to before doing",
    "checkpointQuestion": "the one question at the gate"
  }
}
```

Do the task:

```json
{
  "kind": "do-task",
  "content": {
    "activity": "the sustained independent work and the artefact it produces",
    "launch": {
      "established": "one line naming what the lesson has established and the task now uses; null when the strong instance already carries it",
      "goodLooksLike": {
        "strong": { "words": "the good instance as the child reads it", "show": null },
        "weak": { "words": "the weak instance, wrong in the one way the task turns on", "show": null },
        "difference": "the one line naming what makes the strong one strong"
      },
      "steps": ["the steps in the order children take them"]
    },
    "reasoningWords": ["the few connecting words this explanation needs, or null"],
    "rehearsal": { "sayIt": "what each child says to their partner first", "partnerAsks": "the one question the partner asks back" },
    "planWithinTask": null,
    "checkpointQuestion": null,
    "runsBeyondToday": false,
    "todayEndsAt": null
  }
}
```

`launch` is `null` only when children can begin from the question alone, and `goodLooksLike` is `null` when the success criteria already show what a good one looks like.

**The instance is whatever the product actually is.** `words` carries it when children write; `show` names one of this beat's own `photoRefs` or `representationRefs` when they draw, build, sort or label, and both together are a written instance beside the thing it describes. A design-and-make launch shows the good sketch beside the vague one; only `show` lets it.

**`difference` is one line a child can check their own work against.** The two cards already show the contrast, so this line names what the strong one *does* that the weak one only states, in the words the success criteria or the steps already use. `Each sentence says what caused the next one.` passes; `Every sentence picks up the thing before it.` does not, because a child cannot test their own writing against it.

**The strong instance would meet this lesson's own success criteria.** Every `{{taught word}}` the beat's criteria name appears in it, and the validator refuses a model that leaves one out: a class shown a model that would fail the standard is being marked against something it was never shown.

**When the task asks children to explain, justify or say why, open `explanation-tasks.md`.** It owns `reasoningWords` (the few connecting words this task needs, by year group, faded as the class gets surer), `rehearsal` (say it to a partner, be asked one question, then write the second version), and the missing-link question that replaces "add more detail". A lesson can teach every subject word it names and still get four true sentences in a row, because the words that supply knowledge are not the words that connect it.

**A task with several stages stays one `do-task`, and `steps` is where the stages live.** Making a class agreement runs propose → combine → agree; a design-and-make runs sketch → build → test. Each stage is its own entry in `launch.steps`, in the order children work through them, and the slide designer gives a stage that needs the board its own slide. That is the intended route, not a workaround for a scaffold that only allows one task: the single `do-task` is what keeps the doing reading as the centrepiece instead of fragmenting into a run of short practice beats. Reach for a separate `plan-checkpoint` unit only when planning produces a distinct artefact before the doing begins. Use a separate `plan-checkpoint` source unit only when planning produces a genuinely distinct artefact/beat before the doing. When CURRENT's planning/checkpoint is deliberately folded into one continuous sustained task, keep the lesson as one `do-task` and put the exact planning commitment in `planWithinTask` plus the exact gate question in `checkpointQuestion`. Those two fields are both `null` or both non-null.

When `runsBeyondToday` is `true`, `todayEndsAt` is a non-empty string naming the natural stopping point. When it is `false`, `todayEndsAt` is `null`.

Share / conclude, only when earned:

```json
{
  "kind": "share-conclude",
  "content": {
    "activity": "the conclusion, evaluation, reflection or useful sharing that completes the task"
  }
}
```

Attach required visuals through `representationRefs` and `photoRefs`; attach the exact standard through `successCriteriaRefs`. Keep canonical answers/models in `answer` and teacher wording only in `speakerNotes`.
