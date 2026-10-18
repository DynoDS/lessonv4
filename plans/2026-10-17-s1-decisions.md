# S1 decisions put to him (17 October 2026)

The ledger is `2026-10-17-s1-ledger.md` (rows SD-*), built from `streamline-tools/s1-change/`.
The independent list check is `streamline-tools/s1-list-check.md`; its 25 findings were verified
and folded in (`s1_revisions.py`). His answers go under "His answers", word for word, before
anything is built.

| Decision | Rows |
|---|---|
| D1 header cue: one copy, in the profile | SD-B05 to SD-B11, SD-F45, SD-F46, SD-A83 fix |
| D2 where the launch's opening line goes | SD-G65, SD-G66, SD-A82; preferences Slide Philosophy; templates strong-and-weak |
| D3 the role's pre-write checklist; every slide against the overview sheet | SD-C22 to SD-C30, SD-C71, SD-L96 |
| D4 the role's six reminders | SD-B83 to SD-B90 |
| D5 reading reminders said again inside sections | SD-B28, SD-G15, SD-G34, SD-B41 |
| D6 answers in one place in the role | SD-B26, SD-B92 to SD-B95, SD-C20, SD-C21 |
| D7 word cards: one rule, and his 13 October ruling | SD-B39 to SD-B41, SD-G56, SD-G57 |
| D8 worked answers' headings in full against Th, H, T, O | SD-G31, SD-A99 |
| D9 'the small 1' | SD-G30 |
| D10 four small disagreements | SD-F43, SD-F98, SD-B35, SD-B77 |
| D11 the designer's own short line: only when needed | SD-C04, SD-F27 |
| D12 wording and numbering fixes | SD-G65, SD-G66, SD-F81, SD-H20 |
| D13 the other folds, one batch | every remaining fold row |
| D14 stories | every story row |

## What each decision said when he answered

He asked for each to be explained (what it is, why it is there, why the suggestion),
and answered "Yes to all" to this explanation:

1. The main task goes in the body, never only in the small top-right cue. Written three
   times with nothing different; keep only the visual profile's copy.
2. The launch's opening line (the case: "Sam has a hole in his tooth...") always gets a
   short slide of its own before the good and weak pair, per his 18 September ruling;
   the older "above the pair" sentence goes.
3. Drop the role's "before you finish" checklist (its items are in the fuller final
   checks); keep the overview-sheet rule (look at the overview, open a slide only when
   the overview cannot settle it) over "look at every slide at board distance".
4. Keep the six one-line reminders (an earlier deliberate choice, protected by tests).
5. Each "read this guide when..." reminder only in the reading list; his three speech
   triggers stay exactly; only duplicate sentences go.
6. Gather the answer rules into one place in the role, every detail kept (example: the
   answer slide comes straight after its question slide).
7. One copy of the word-card placement rule, in the playbook, holding every detail of
   both, with his 13 October ruling added in his words ("a card never sits between a
   question and its answer").
8. Th, H, T, O wins over "headings written in full" on worked-answer slides; the real
   failure is shrinking the digits.
9. "The small 1" becomes "the exchanged ten".
10. a) a written story or case comes first, above its question; "lower" stays for
    pictures and figures. b) splitting a My Turn names both reasons. c) a table of
    meanings the planner filed as criteria may sit in the criteria box. d) labels 20pt,
    18pt where 20pt leaves the picture too small, never less.
11. The designer's own short instruction line: the stricter wording ("only when it is
    needed to use the slide").
12. Four fixes: a sentence that lost its subject; "three things" sitting next to the
    wrong slide; a wrong section number (8 for 6); two checklist items both numbered 7.
13. One batch of plain repeats, extra words carried across first: the playbook's opening
    (the role's word for word); the survival phrase explained twice; the Teach-layout
    rule in both files (the task-blue-with-sign line carried); alignment, the group
    colour edge, the working surface beating a setup photo (each twice); captions and
    photo fit; evidence cards (five times); sorts and splitting a set; three summary
    paragraphs near the end of the playbook; a profile line repeating "repair only your
    own faults"; the decoration-record paragraph the decorator already carries.
14. Stories: dates off, his quoted words kept exactly, incidents become short reasons or
    plain examples; his Tudor and diseases example slides untouched.

Kept on purpose, said in the same message: the three copies of "a word bank is separate
items, not prose"; the playbook's colour paragraph; the closing "rules that never change"
list.

## Built (17 October 2026), and where it departs from the list

- `streamline-tools/s1-change/s1_apply.py` makes every edit from the snapshot in
  `s1-change/before/`; `s1_repin.py` moved 37 earlier-topic pins; `s1_tests.py` moved
  eleven guidance-test expectations; `s1_mapping.py` built
  `scripts/tests/s1_slide_designer_ledger_pins.json` and `2026-10-17-s1-mapping.md`;
  `scripts/tests/test_s1_slide_designer_ledger_is_kept.py` is the new test.
- Left as they were, because his answers did not clearly cover them: the role's sentence
  on why the decorator's pass moved out (SD-B82; a test pins it as the reason); the
  role keeps its `PUPIL_INSTRUCTION_AMBIGUOUS` line (moved beside its other hand-backs,
  a test pins it in the role); the playbook's skill-based rhythm line (SD-G77, the route
  list stays complete); the room-measurement reason (SD-C42). So two of the "three
  summary paragraphs" were folded, not three.
- Went with the role's Surface execution recap under D13 though the message did not name
  that section: its lines were each a repeat (the header cue, the stricter wording, the
  sort and split lines, the Written Voice trigger, the copy-exactly list). To be told.

## His answers

17 October 2026, after each decision was explained in full (what it is, why it is
there, why the suggestion): "Yes to all". Every suggestion is taken as written in the
explanation message: D1 the profile's copy only; D2 the opening line always on its own
slide before the pair; D3 the pre-write checklist goes, the overview-sheet rule stays;
D4 the six reminders stay; D5 each reading reminder only in the reading list, his three
speech triggers kept; D6 answer rules in one place in the role; D7 one word-card copy
(the playbook's) with his 13 October ruling added in his words; D8 Th, H, T, O wins and
the failure is shrinking the digits; D9 "the exchanged ten"; D10 a story first, b both
reasons named, c the table-of-meanings exception added, d 18pt where 20pt leaves the
picture too small, never less; D11 the stricter wording; D12 the four fixes; D13 the
batch; D14 dates off, his words kept, stories become short reasons.

## After the two checks (17 October 2026, night)

Checks: `streamline-tools/s1-change-check-a.md` and `-check-b.md` (B: no rule lost; all 37
pin moves and 11 test edits still protect their rule; 14 attacks on a scratch copy all
caught). Repaired by `streamline-tools/s1-change/s1_r1_repairs.py` on the live files (another
session edited the launch paragraphs SD-A82 and SD-G66 at 23:22, criteria on the rehearsal
slide; left untouched): "lower" restored with the story-first exception kept (the new
"below the task when it is a picture" sentence clashed with preferences Slide Philosophy,
picture first unless children write on it: to put to him); the role points again at the
playbook's sections 14 and 15; the playbook keeps its own photograph-fit words beside the
role's paragraph; "may sit" for the criteria table; "never split one entry across two
slides" carried; the word card "straight after the answer, or before the question"; the
action-roles pointer names Semantic colour; small punctuation; VG-L51's note.
Further departures to tell him: SD-A08 moved into Deliver the helper; SD-M11 went with M10
(the role holds it); SD-L96 left; three answer details (the finished live model and two
others) live in playbook section 10, not the role. Carried to S2: templates.md
strong-and-weak still says the opening line "sits above" the pair (D2). For him to decide:
whether a picture the question is about sits above or below the task line; whether the
section 10 story "headings cut to initials" should name only the small sums.
All suites green after repairs (Python 3,036, builder 1,229). Three files 191,068 to 180,768
bytes, including the other session's additions.
