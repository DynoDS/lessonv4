# Overnight summary (30 September into 1 October 2026)

For Daniel, to read in the morning. Everything below is saved on one branch, ready for GitHub when you are. Nothing is pushed and nothing is installed in Codex.

## Where it all is

**One branch:** `lesson-shape-and-hands-on-2026-09-30`, one commit holding every change from today, from every chat. That includes the answer-sheet work.

**To send it to GitHub:** push that branch when you're happy. Codex installs from the plugin folder, so nothing changes in your real lessons until you install.

## Finished and tested tonight

**Practical tasks: the levels are now written down, task by task.**
- The Roman artefacts lesson had missed practical tasks completely.
- Now every task in the plan names its levels, or says "board only" and why.
- The teacher notes read "From the slides: ... To print: ... On a prepared day: ...".
- Rerun on three lessons, all three got it right:
  - **Roman artefacts:** a printed shoe photo for pairs, and a nit comb and replica objects on a prepared day.
  - **Human and physical features:** the board and printed picture cards, with no props invented.
  - **Mosque objects:** a real prayer mat on a prepared day, with clean hands and never stood on.

**Handover item 2: the right previous lesson.**
- The plugin used to pick "the previous lesson" by whichever was saved last. That's how lesson 17 got lesson 15.
- Now it goes by the lesson number in the plan. On your real maths folders, lesson 17 now gets lesson 16.
- The designer also sees up to three lessons before that, as background only, never as a reason to rotate activities (your Monday and Tuesday point).
- Not built: bringing older topics back in starters. That waits for your answer on whether early morning maths already does it.

**Handover item 1: a lesson question, when it's best.**
- A new option, not a rule. One question on its own slide after the starter, printed large under its picture, and the final task is the answer.
- Tested on four lessons, all four made the right choice:
  - **Digestion:** yes. "How does the sandwich you eat at lunchtime end up helping you run around at playtime?"
  - **Nativity:** yes. "Babies are born every day. So why do Christians still tell the story of this one baby?"
  - **Maths lesson 20:** no. "A maths method lesson."
  - **Human and physical features:** no. "Any question would just reword the objective."
- It adds no extra task. It comes back as one spoken line ("That's the first part of our answer"), never printed on every slide.
- Two fixes after I built a test slide:
  - The first layout printed the question small and the scene line big, so the question now prints large.
  - The slide had no speaker notes, so the design now carries what the teacher says.

## Waiting for you to judge

**Handover item 3: starter text size.**
- Look at `evaluations/starter-size-2026-09-30`.
- The question slide's text can be much bigger, but it would then shrink when the answers appear.
- The plugin isn't changed until you decide.

## Two honest notes

**The checker said nothing about the lesson question.** It approved the digestion lesson and fixed two real problems, but it never commented on the question. So we know it didn't object, not that it looked closely.

**A gap I found, fixed on 1 October.** A card sort shown on the board can now carry pictures too, like the printed cards. Tried with real Nativity pictures: a sort under four meaning headings, and a put-in-order with four pictures.

## Where the evidence is

- `evaluations/trial-2026-09-30-levels2/NOTES.md`
- `evaluations/trial-2026-09-30-question/NOTES.md`
- `evaluations/starter-size-2026-09-30/README.md`
- The release notes: the last entry in `plugins/lesson-v4/references/build-review-log.md`
