# Streamline restart on 4.2.325: what each worker reads (17 October 2026)

Measured only; nothing in the plugin changed. Scripts are in the session
scratchpad (`measure.py`, `repeats.py`, `stories.py`); they import
`scripts/read-reference.py`, so start-up figures are exactly what the paged role
read prints. Bytes are UTF-8.

## Start-up reading per worker

| Worker | Own file | Start-up total | Typical extra reads on a maths lesson |
|---|---|---|---|
| Slide designer | 78,927 | 344,461 (role read with companions) | about 140 KB: Written Voice 25.7, Slide Headings 5.4, Question Labelling 3.6, Success Criteria 13.2, Sticky Knowledge 2.6, criteria on slides 20.4, representations 13.8, modelling formats 6.7, visual sizing 21.9, teacher voice core, plus each helper entry at first use |
| Lesson designer | 183,092 | 328,817 (role read with companions) | the route file (skill-based 65.0), do-beats sections (file 81.8), subject file (maths 34.6) |
| Lesson voice editor | 32,198 | 143,543 | maths sheet wording section |
| Adaptation designer | 65,575 | about 280 KB (nine preference sections about 114, teacher voice core, adaptation reference 23.9, subject file, reasoning prompts 13.9) | |
| Worksheet designer | 83,994 | about 250 KB (preference sections about 51, sheet look 13.1, helpers guide 31.9, catalogue opening and index, shared 29.7, maths 19.3, compositions opening) | helper entries |
| Design reviewer | 74,560 | about 270 KB on the packet route (Pride Lessons 15.3, What a Lesson Is For 18.5, the rhythm 56.5, Vocabulary 18.2, task contrasts 9.8, the route file, the subject file) | |
| Slide decorator | 33,578 | about 70 KB (context pictures parts including source routes 24.9, picture field contracts) | |
| Orchestrator | skill 33,903 + playbook 85,315 | 119 KB | |

The slide designer's start-up, piece by piece: its own file 78.9; preferences
introduction, contents and Slide Philosophy 53.5; the visual profile 34.1; the
composition playbook 78.0; the template rulebook's introduction and sections 1,
2, 3 and 6, 88.6; context pictures' three parts 11.2.

Slide Philosophy (47.6) is mostly written for the lesson designer: "Lesson
Designer content boundaries" 21.4, "Lesson Designer visual-need boundary" 18.5,
"Slide Designer presentation rules" 6.4, speaker notes hand-off 1.4. Much of the
first is about what a slide must carry, so the slide designer may need it; any
routing change is a decision for him, and the 10 September lesson
(consolidation-commits-thin-guidance) applies.

## Where the repeats are

- **Word-for-word repeats are small.** Over the slide designer's whole reading
  (685,753 bytes in 4,510 sentences), 137 sentences have a close twin: 15,888
  bytes, 2.3%. Most are the helper catalogue's per-entry boilerplate ("It is
  the same picture on every surface", "Zone class compatibility", "move and
  resize it as a whole"), which a worker reads one entry at a time, so for the
  reader they are not repeats. The 29 September measure found the same (1 to
  2%).
- **Same rule, different words, is where the true repeats are.** Examples
  checked by hand: a worked example is purple (the role file twice, the
  preferences slide rules, the visual profile, the playbook's colour section,
  the template rulebook's colour roles, plus field-level notes on charts and
  sums); the question and answer slide pair (`revealPair`) in the template
  rulebook at lines 236, 242, 721, 1357 and 1393; inside the role file, the main
  task stays in the body (Main task versus header cue, Composition authority,
  Surface execution), answers come only from the structured answer (step 5,
  Answers and reveal slides, Speaker notes), and the four-file routing (step 3
  and Composition authority). The playbook's opening repeats the role file's
  "Your judgement is slide-level" paragraph word for word.
- **Stories:** sentences carrying a dated incident or "a Year 4 deck" story come
  to about 2.7 KB in the role file, 3.4 KB in Slide Philosophy, 1.2 KB in the
  visual profile, 8.4 KB in the playbook and 7.4 KB in the template rulebook.
  Under his rule (stories leave, reasons stay, a case that makes a rule clear
  may stay as a plain example) perhaps half of that goes.

## Honest estimate for the slide designer

Of about 480 KB on a typical maths lesson: folding same-rule copies 15 to 30 KB,
stories to plain examples 8 to 10 KB, maintainer or retired text 3 to 5 KB.
About 30 to 45 KB in all, 6 to 9% less to read, unless he also moves the
lesson-designer parts of Slide Philosophy out of its start-up (up to about
40 KB more, his decision). The gain is mostly one copy per rule and focus, not
bulk.

## Pins

Tests that read these files: slide designer's file 30 Python and 4 Node tests;
playbook 14 and 2; visual profile 7 and 1; template rulebook 11 and 7;
preferences 64 and 5. Ledger pin files mention the slide designer's file 62
times, the playbook 113, the profile 116 and the template rulebook 251.
