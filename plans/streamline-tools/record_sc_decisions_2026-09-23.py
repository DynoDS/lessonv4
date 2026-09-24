"""Record the teacher's answers to the success-criteria decisions, word for
word, above the decisions in the ledger (23 September 2026)."""
from pathlib import Path

L = Path(r"C:\Users\Daniel\Projects\lessonv4\plans\2026-09-23-success-criteria-ledger.md")
t = L.read_text(encoding="utf-8")
anchor = "## Decisions for Daniel\n"
assert t.count(anchor) == 1 and "## Decisions taken" not in t

ANSWERS = [
    ("1", "number one in success criteria if there's a vocabulary word it's green every time This was a recent added rule. There was a rule, I think, where the designer could decide that different words have different colors to make them stand out or verbs or I don't know, something important so it's not just all black text. That should stay too. But any vocab words that has been taught is green."),
    ("2", "I think this is because that particular situation was more of a sticky knowledge, extra facts kind of thing to use rather than being in the success criteria itself. The success criteria is literally, or well, the step-by-step -step success criteria is literally step one, do this, step two, do this, step three, do this. If one of those was if the number ends in zero, keep it, then yeah, it, sh it would stay because it's part of that step. But if it's extra knowledge, then it should be away."),
    ("3", "I'm not sure why the whole list wouldn't fit. Do you mean template wise? Do you mean helper wise? Do you mean if sentences are too big? If sentences are too big, doesn't it just do the auto fit where it makes it smaller? If you're looking at template, I swear there's been six or seven different steps in one lesson."),
    ("4", "I agree."),
    ("5", "If in a lesson, like a maths lesson, the children were having a success criteria that was a step by step. If it goes on the working wall, it should be the exact same steps. Children shouldn't have different steps on the wall compared to what they've done. However, there's also the thing where the designer chooses whether there should be a working wall or not. That doesn't mean every time there's steps that a working wall should be built, because there's still the rules about it looks at previous lessons and lessons after to decide if a wall should be built."),
    ("6", "I think I disagree. Success criteria isn't this is what a good answer does, I don't think. I think it's something the children can use to help them do the thing. that if children get stuck they can look at and use therefore I think sentence stems are that thing if anything I'd say that history rewrite doesn't do enough find something that has changed Seems okay. User detail from each source could work, but it might say a sentence stem like find something that has changed. This has changed from this source because I don't know, that's a bad example, but you get what I mean."),
    ("7", "Not sure what you mean when I said doesn't help for the children. That find the neighbor in multiples is just worded wrong. Read the question, work it out, check the answer isn't really success criteria either. Remember what I just said, it's something that they can look at and actually use to help them."),
    ("8", "I don't want any success criteria on worksheets."),
    ("9", "I don't think a two sentence step is a fault necessarily. But in that exact example, you're right. It's just naming what the step produced. And I don't want that because success criteria space is bare enough as it is."),
    ("10", "Agree. Whatever's the best home for the designer to use and read clearly."),
    ("11", "There is not a time where I want the PowerPoint slide deck to never be produced because of an error. It should work to fix it. So whatever you think."),
    ("12", "Interesting, I just spoke about this in another answer. I don't think it should be reworded. I'm sure it can figure out how to put it on."),
    ("13", "I don't think the slide designer reports back. There should be a way to make it fit. We might need to do another investigation on how to actually make it fit, even if that means a new slide template."),
    ("14", "Your suggestion."),
    ("15", "Questions can be fine as steps because they help children know what to do next or what to look for."),
    ("16", "Agree."),
]
lines = ["## Decisions taken (23 September 2026)", "",
         "Daniel answered all sixteen in one message. His words, as given; what each",
         "means is read back to him before any change.", ""]
for n, words in ANSWERS:
    lines.append(f"{n}. \"{words}\"")
lines += ["", ""]
L.write_text(t.replace(anchor, "\n".join(lines) + anchor), encoding="utf-8")
print("recorded")
