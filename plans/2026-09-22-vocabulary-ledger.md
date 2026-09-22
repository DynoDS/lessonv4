# Vocabulary rule ledger (the trial topic)

Step 1 of the streamline method in `2026-09-22-streamline-brief.md`, for one
topic only: vocabulary. Nothing in the plugin was changed to make it.

**Status (22 September 2026, late).** The teacher's decisions are recorded
below. The change is applied in the working tree as 4.2.284, uncommitted.
Where each row went is in `2026-09-22-vocabulary-mapping.md`, and every row is
pinned by `scripts/tests/vocabulary_ledger_pins.json` in the plugin. This
ledger stays as the record of the text before the change.

**Snapshot.** lesson-v4 4.2.283, commit `ee9c6e2c`. Line numbers are the line
in that commit where the quote starts. Every «quoted» passage is the file's own
words; `streamline-tools/check-ledger-quotes.py`
confirms each one exists in the file named in its Where column.

**What counts as vocabulary here.** The decisions about which words a lesson
teaches, how each is defined and pictured, when each is introduced, how it is
used afterwards, and how the vocabulary appears on the board, the wall and the
adapted sheets. Rules from other topics that mention vocabulary in passing
(word banks, starters that retrieve a definition, the Do-beat catalogue) are
listed at the end with where they are, so nothing is hidden, and are left to
their own topics.

## How to read a row

| Column | Meaning |
|---|---|
| ID | `VOC-` then a group letter and a number. Groups: A choosing the words, B two words on one card, C writing the definition, D the card's picture, E when a word is introduced, F what the teacher says on the vocabulary slide, G using the word after the card, H words the teaching leans on, I a lesson's own label is not owned vocabulary, J keeping subject vocabulary in every string, K continuity from the last lesson, L what the reviewer checks, M the subject files, N the vocabulary slide, O the working wall, P Below and Greater Depth, Q other downstream, Z misfiled. |
| What the agent is told | The rule's own words. Several «quotes» in one row are separate sentences of the same rule. |
| When it applies | The condition, and any exception the text gives. |
| Strength | **must** (never, always, only, or refused by code), **default** (normally, usually, prefer), **may** (a permission), **check** (a test or tell the agent runs), **mechanics** (how to record or build it). "Code" means a program refuses the lesson when it is broken. |
| Code names | Field names, markers, commands or headings a program or test depends on. These cannot change without the code. |
| Where | The file, its section and line. The primary row of a rule also lists its copies. |
| Kind | rule; your example (how the agents learn your taste); your ruling (your words, dated); duplicate of another row; contradiction (a numbered decision below); story (a dated incident); pointer (tells the agent to read something else); maintainer (for whoever edits the plugin, not the agent); stale (no longer matches the code); shared (another topic owns it; listed so nothing is lost). |
| Proposed home | Where the one kept copy would live. A proposal only: see decision 10. Codes: **PREF-VOC** preferences.md → Vocabulary; **PREF-PIC** preferences.md → A Picture Beside a Word; **LD-VOC** the lesson designer's own Vocabulary section, kept for recording the decision (fields, IDs) and the instruction to read the two sections above; **OT** output-template.md → Vocabulary; **SUBJ** its subject file; **TV** teacher-voice.md; **SD** one copy for the slide designer; **WALL**, **ADAPT** the wall and adaptation files; **LOG** build-review-log.md; **STAYS** stays where it is because another topic owns it. |

## What the list shows, in short

- **285 places** in 40 files say something about vocabulary. **About 64**
  repeat a rule written elsewhere, usually in different words, and **36**
  belong to another topic and only mention vocabulary.
- **At least 20 of the repeats are not true copies**: each carries an extra
  condition, example or strength the other copy lacks (marked "near-duplicate"
  or "plus:" in its row). A fold has to keep those words, or it loses a rule.
- **What the lesson designer reads (groups A to G) is 141 of those places**:
  54 rules, 26 repeats, 22 shared with other topics, and the rest recording
  details, pointers, your examples, stories and out-of-date text.
- **The lesson designer's own file and your preferences file say most of the
  core rules twice**, in different words: choosing words, pairs on a card, the
  definition shape, every card has a picture, when a word is introduced,
  grouping, and using the word after the card.
- **Nine places pull against each other in what the designer reads**
  (decisions 1 to 9), and **five more** in the wall and slide files, listed
  below for when those topics come up.
- **Five pieces of text no longer match the code** (six rows).
- **One paragraph in your Vocabulary section is not about vocabulary** (the
  answer-arrow preference, VOC-Z01).
- **One design rule lives where the designer never reads it** (VOC-E35: a word
  that needs teaching gets its own Teach beat, "never instead of" its card; it
  is only in the slide designer's playbook).
- **One vocabulary story is not in the build log yet** (the decay card), so it
  must be copied there before it can leave.
- **The code already enforces six vocabulary rules**, and **tests already pin
  a sentence in 57 of the rows** (listed at the end). Some of those pins sit
  on the designer file's copies, so folding a copy means moving its test in
  the same release.
- **An independent check** (a fresh agent that did not write this list) found
  28 missed rules, 20 repeats that differ, and five disagreements this list
  had not raised. Each was checked against the files before it went in; its
  full report is kept with the session's working files.

## Decisions taken (22 September 2026)

Daniel answered all eighteen, plus A and B, in one message. His words
first, then what each means for the change.

1. "drop the emoji advice." The emoji clause of D09 is retired. Maths cards
   use the drawn picture the lesson itself uses; "maths rarely needs photos"
   stays; an emoji only when it is the thing (D16, D17 unchanged).
2. "a definition is definitely a sentence I'd say to the class. It's not like
   a dictionary definition where it's summarized. It's like conversational so
   children understand it. I think vocab should have pictures next to it."
   The examples C07, C20 and C21 are rewritten in that shape; the example
   cards (C20, N30) carry a picture. The rare `none` exception (D03, D14) is
   kept, because he did not ask for it to go.
3. "if those are history words that needs to be in the lesson then they are
   given a vocab slide before it's needed." Big history words are vocabulary
   like any other: a card just before they are needed, then used. M07's point
   that a definition alone does not teach them stays; its "rather than
   defined and displayed" is reworded so it no longer reads as "no card".
4. "it depends on the lesson, but I wouldn't want more than five." Up to five,
   no minimum; "3 to 5" becomes "up to five". The code limit is unchanged.
5. "it should be on the board, not just the script." The next beat uses the
   word on its board (and in its question or task, and its script); the
   script alone is not enough. The checking program is changed to match, as a
   follow-on with its own test.
6. Suggestion taken: a word big enough for its own Teach beat also keeps its
   card; a smaller word explained in one line needs no card. E35 moves to
   where the designer reads it.
7. "it's my turn, our turn, your turn. Unless the designer thinks that our
   turn isn't needed, then it's just my turn, then your turn. If there's ever
   teaching, it needs to be before my turn." Nothing comes inside the cycle;
   a method's words, and any teaching, come before the My Turn.
8. Suggestion taken: taught one at a time, each word arrives just before its
   own part; words that only make sense together arrive together.
9. Suggestion taken: the wall uses the lesson's wording, may shorten only when
   it genuinely cannot fit, and stays a proper sentence.
10. Suggestion taken: one home, preferences → Vocabulary; the designer keeps
    recording and the read instruction; every extra condition is carried.
11. Suggestion taken: the answer-arrow preference moves word for word to sit
    with the practice and answer-slide rules.
12. "we can still teach the lesson designer the whys without telling it
    exactly what happened in a specific lesson. And I feel like if something
    has to tell it what happened in a specific lesson, then the rule's not
    really fixed at all." Runtime text gives the reason, not the incident.
    Dated stories and "a Year 4 deck did X" reports go to the build log. A
    case that makes a rule clear may stay only as a plain example. His own
    calibration examples (the Victorian sketch, the Tudor slides, Pride
    Lessons) stay, as he said at the start; his rulings keep his words
    without their dates.
13. "remove those out of date text." All five.
14. Suggestion taken (wall, later): reword to fit the two-sheet limit.
15. "Retire them." (wall, later): word-grid chip cards are retired.
16. "the success criteria should color any vocab words in green. But this is
    different... if there's something that is actually important, one or two
    words that are important, but they're not quite vocab, those can be
    coloured." (slides and criteria, later): every taught word green in
    criteria too; the one-or-two limit is for the other marks.
17. "If that's the case, then definitely we should split across slides."
    (slides, later): pictures too big for one vocabulary slide continue onto a
    second vocabulary slide at the same point, rather than shrinking.
18. "Whatever your suggestion is." Geography's everyday-meaning rule stays;
    the three lists of when a definition may run to a second sentence become
    one list that keeps every reason.
- A. "The reviewer should definitely be able to see what the teacher says on
  a vocab slide." Code follow-on, with its own test.
- B. "remove it." The surviving "named as a check" clause goes, in the
  quick-check topic.

## Decisions for Daniel, as they were put to him

What the designer reads:

1. **Maths card pictures.** VOC-D09 says «lean on emojis (🔢➗🔟)»; VOC-D02,
   D17, D23 and the slide catalogue's maths examples say a picture must be the
   thing, and a drawn helper does that for a maths word.
2. **The examples show what the rules say not to do.** The rule (VOC-C01) is a
   sentence a teacher would say, with a verb doing the work; VOC-C21 is a
   clipped phrase, and VOC-C07 and C20 are in the "term: phrase" form. The
   contract's only example card (C20) and the catalogue's last (N30) also show
   a card with no picture as ordinary, where D03 calls that the rare exception.
3. **History's big words.** VOC-M05 says empire, monarchy and the like earn a
   card; VOC-M07 says they are «used and applied rather than defined and
   displayed». "Card it, then use and apply it" would satisfy both.
4. **The five-word ceiling.** VOC-A01 is a hard limit the code enforces; your
   10 September ruling (in my notes, not in the plugin) says no caps, though
   "words" there may have meant word counts. And "3 to 5" reads like a floor
   of three, which nothing enforces.
5. **What counts as the word being used.** VOC-G04 asks for the next beat's
   board, question or task, **and** script; the code accepts the word anywhere
   in that beat, script alone included. And G01 lets a word land in a task,
   but the code counts only the teaching beats, so a word used only in the
   ending or on the worksheet is refused.
6. **A word that needs real teaching: its own Teach beat, and a card too?**
   VOC-E35 says the Teach beat comes «in addition to - never instead of - the
   word's card»; A09 allows «a card, or one explicit taught line», and H02
   lists teaching it in the beat or giving it a card as alternatives. E35 is
   also in the one file the designer never reads.
7. **Skill lessons: a card inside a My Turn to Your Turn cycle.** VOC-E47 says
   nothing comes between a My Turn and its Your Turn; E04 and E05 put a card
   straight before the first beat that needs the word, which can be inside
   that cycle.
8. **A set of names.** VOC-E46 says to teach and use each unfamiliar member of
   a set before the next; E17 says words needed together arrive together.
9. **The wall may tighten a definition to fit.** VOC-O07 and O16 let the wall
   shorten a definition to its card; C01 and C10 say a definition is rewritten,
   never trimmed or squeezed to fit.

Where things live, and tidying:

10. **One home for the core rules.** Proposal: your preferences file's
    Vocabulary section holds each teaching rule once, keeping every extra
    word a near-duplicate carries; the designer's own section keeps only how
    to record it and the instruction to read.
11. **Where the answer-arrow preference (VOC-Z01) should live.**
12. **Stories and dates.** Keep each concrete case as an undated example
    where it makes the rule clear, move the dated story to the log; for your
    own rulings, keep your words and decide whether the date stays.
13. **Retire or correct the stale text** (list below).

Pulls in the wall and slide files, for when those topics come up:

- The wall's own numbers: two definition cards plus a chip card (O26, O14)
  against the two-sheet limit a chip card counts towards (O23), which the
  build enforces; and one term per definition card (O05) against a pair
  sharing a card (B01, and the wall designer's own "common factor" + "common
  multiple" pairing example).
- Chip cards need at least four lesson words and aim for six to eight (O13),
  but a lesson carries at most five (A01), and chip words are the kind the
  lesson labels rather than cards (A06).
- Every taught word green on every occurrence (N19) against success criteria,
  where the picture's colour wins and only one or two parts are marked (N29).
- The build's refusal for pictures too big for one slide tells the slide
  designer to split the words into separate introductions, which N02 and N03
  forbid it to do.
- Geography's card names a word's everyday meaning (M03) against keeping the
  card uncluttered (C08); and three different lists of when a definition may
  run to a second sentence (C06, C26, O11).

---

## A. Choosing the words

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-A01 | «3–5 cards or conceptual units maximum, because five is about the most a child absorbs before the vocabulary slide stops being a quick reference and becomes a reading exercise.» | Every lesson with vocabulary. Exception: a genuine pair may share a card, so more than five literal words can fit (VOC-B03). The code accepts none at all. | must (code) | `vocabulary` array; validator: "vocabulary must contain at most 5 items" | `references/preferences.md` › Vocabulary · L333. Copies: A02, A03, N13 | rule; decision 4 | PREF-VOC |
| VOC-A02 | «3–5 cards or conceptual units max.» | as A01 | must (code) | as A01 | `agents/lesson-designer.md` › Vocabulary · L200 | duplicate of A01 | PREF-VOC |
| VOC-A03 | «choosing 3–5 cards or genuine vocabulary units, definitions written for children, one coherent visual per card or unit.» | the contents list agents use to pick sections | pointer | | `references/preferences.md` › Contents · L21 | pointer | STAYS (contents) |
| VOC-A04 | «Choose the disciplinary language children think and reason *with* — words they reuse and that deepen their understanding of the subject, the words you would want to hear in their explanations.» | every candidate word | must | | `references/preferences.md` › Vocabulary · L333. Copies: A05, M01, M05, M09 | rule | PREF-VOC |
| VOC-A05 | «Choose learning-critical language with genuine job in today's explanation/question/discussion/task.» | every candidate word | must | | `agents/lesson-designer.md` › Vocabulary · L200 | near-duplicate of A04: adds a job in today's lesson, and names discussion as a landing, which G01's list does not | PREF-VOC |
| VOC-A06 | «Prioritise learning-critical language rather than excluding equipment names categorically. An equipment word earns a card when children must understand, distinguish, select, use safely or explain it. Otherwise label the equipment clearly where it is used without spending a vocabulary card on it.» | equipment words | must | | `references/preferences.md` › Vocabulary · L333. Copy: A07 | rule | PREF-VOC |
| VOC-A07 | «Equipment term earns card when must understand/distinguish/select/use safely/explain; else label where used.» | equipment words | must | | `agents/lesson-designer.md` › Vocabulary · L200 | duplicate of A06 | PREF-VOC |
| VOC-A08 | «A unit like *decibel* may be a concept children reason with; a device name may be either learning-critical language or only a label, depending on the task. The test for each candidate is whether knowing the word helps children perform or explain the intended learning.» | every candidate word | check | | `references/preferences.md` › Vocabulary · L333 | rule (the selection test) | PREF-VOC |
| VOC-A09 | «**A technical term the approved objective itself names is learning-critical by definition:** children are assessed against an objective they must be able to read and own, so the term gets taught - a card, or one explicit taught line - never left living only in planning metadata.» «The exception is a term the teacher's own sequence explicitly defers.» | a term the approved objective names; exception: the teacher's sequence defers it | must | | `agents/lesson-designer.md` › Vocabulary · L200 (only copy) | rule | PREF-VOC |
| VOC-A10 | «`To build and draw a series circuit` with no moment saying what *series* means leaves the LO unreadable to the class it belongs to.» | illustrates A09 | | | `agents/lesson-designer.md` › Vocabulary · L200 | example (undated) | with A09 |
| VOC-A11 | «When plan lists more than limit, trim no-job items, note decision.» | a brief listing more words than fit | must | `trimmedVocabulary` (term, reason) | `agents/lesson-designer.md` › Vocabulary · L200. Copies: A12, A13 | rule + recording | rule PREF-VOC; recording LD-VOC |
| VOC-A12 | «Trim vocab with no job.» | judging a supplied plan | must | | `agents/lesson-designer.md` › Your Role as Decision-Maker · L42 | near-duplicate of A11: it has no over-the-limit condition, so it applies to every supplied plan | STAYS |
| VOC-A13 | «`trimmedVocabulary` contains only items actually removed from the brief:» «Use `[]` when nothing was trimmed.» | recording trimmed words | mechanics (code) | `trimmedVocabulary` exact keys `term`, `reason` | `references/output-template.md` › Vocabulary · L147 | mechanics | OT |
| VOC-A14 | «a teacher who lists vocabulary, activities, misconceptions, sticky knowledge or possible approaches is showing you what is available, not setting a checklist to clear. Take what serves the objective - some of the vocabulary, one activity, the key questions, the general shape reworked your way - and leave the rest.» | a supplied plan's word list | must | | `agents/lesson-designer.md` › Authority and precedence · L44 | shared (reading a plan) | STAYS |
| VOC-A15 | «Two tells that the count has crept up: the vocabulary set only stays inside five cards because terms have been paired onto them, and an idea taught in the middle of the lesson is never used again by anything after it.» | judging whether a lesson carries too much | check | | `references/preferences.md` › How Much Fits in One Lesson · L274 | shared (How Much Fits); related to A01, B02 | STAYS |
| VOC-A16 | «**How much a word is worth depends on the job it does today.** A word children need only in order to follow the next instruction (the name of a piece of apparatus, a form of notation) needs enough meaning to get them moving and no more, and spending three minutes on it takes them from the learning. A word the lesson's thinking runs on, that children should be using in their explanations and meeting again later in the unit, earns the fuller treatment: the meaning, the edge of it, the connection to a word family where that genuinely illuminates it, and real use in the task. Decide which each word is before writing its card, because the commonest waste is the same middling treatment given to both.» | every word | must (decide which) | test pins the heading sentence | `references/preferences.md` › Vocabulary · L343 | rule | PREF-VOC |
| VOC-A17 | «One honest limit: teaching a handful of words well is worth doing because children need those words, and it does not by itself widen a child's vocabulary, so do not let a card set stand in for the reading and talk that does.» | limit of A16 | must not | test pins "does not by itself widen a child's vocabulary" | `references/preferences.md` › Vocabulary · L343 | rule (limit) | PREF-VOC |
| VOC-A18 | «You decide structure, starter, vocab, sticky knowledge, teaching sequence, examples, misconceptions, Apply/Reflect, worksheet.» | who owns the decision | pointer | | `agents/lesson-designer.md` › Lesson Designer · L15 | pointer (ownership) | STAYS |

## B. Two words on one card

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-B01 | «Two terms may share one card only when they genuinely form one simple paired idea or directly contrasting/symmetrical parts that make more sense together. Being related, being taught together or having an important relationship is not enough. `clockwise / anticlockwise` may share; `evaporation / condensation` normally stays as two separate cards.» | two candidate words | must | | `references/preferences.md` › Vocabulary · L367. Copy: B02 | rule | PREF-VOC |
| VOC-B02 | «**Combining pairs:** Two terms share card only when genuinely one simple paired idea or directly contrasting/symmetrical parts making more sense together. Related/taught together/important relationship not enough. Example: "hour hand / minute hand" → one "Clock hands" card; "past / to" → one "Direction". Don't combine to evade limit.» | as B01 | must | | `agents/lesson-designer.md` › Vocabulary · L202 | duplicate of B01; its two examples and «Don't combine to evade limit.» are only here | PREF-VOC (examples and the "evade" clause move with it) |
| VOC-B03 | «More than 5 literal terms may fit when genuine simple pair shares one quick conceptual card.» | exception to A01 | may | | `agents/lesson-designer.md` › Vocabulary · L200 (only copy) | rule | PREF-VOC |
| VOC-B04 | «The visual may contain a simple labelled comparison when the relationship is the learning, but a comparison visual does not itself justify combining separate concepts.» | a paired card's picture | may / must not | | `references/preferences.md` › Vocabulary · L367 | rule | PREF-VOC |

## C. Writing the definition

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-C01 | «Definitions are written for children, not adults, and the shape that gets you there is a sentence a teacher would actually say to the class, with a verb doing the work. Write to that shape and the shortness follows; aim at shortness directly and the cheapest way to obey is to compress the meaning into a noun phrase, which is precisely the textbook register a child cannot use.» | every definition | must | none: the code checks only that a definition exists | `references/preferences.md` › Vocabulary · L347. Copies: C04, C05, C06, C14 | rule; decision 2 | PREF-VOC |
| VOC-C02 | «`A battery gives a device electricity so it can work without being plugged in` teaches. `A portable source of electrical energy for a device` is shorter, accurate, passes every brevity test and leaves a nine-year-old holding nothing. So the test on each finished card is to read it aloud as though to the class: if you would not say it in those words, rewrite it rather than trim it.» | every definition | check | | `references/preferences.md` › Vocabulary · L347 | your example (good beside weak) and the read-aloud test | PREF-VOC |
| VOC-C03 | «`teacher-voice.md` → Explanations and definitions is calibrated for this exact register and is worth opening before you write the set.» | before writing the set | default | heading `# 5. Explanations and definitions` (tests) | `references/preferences.md` › Vocabulary · L347. Copies: C04, C24 | pointer | PREF-VOC |
| VOC-C04 | «Governed by `preferences.md` → Vocabulary, whose definition rule you read before writing the set - a definition is a sentence you would say aloud to the class with a verb doing the work, never a noun phrase compressed until it is short. Open `teacher-voice.md` §5 with it.» | before writing the set | must (read) | | `agents/lesson-designer.md` › Vocabulary · L200 | duplicate of C01; its read instruction is stronger than C03's (open §5 with it, where C03 says worth opening) | LD-VOC (read instruction) |
| VOC-C05 | «(2) **no verb doing the work**, so a definition or explanation reads as a compressed label rather than something said - `a portable source of electrical energy for a device`» | the read-back of every string | check | | `agents/lesson-designer.md` › Writing for the Reader (four tells) · L162 | overlaps C01 but is wider: it covers explanations too, and is one of four voice tells run on every string | STAYS (voice read-back) |
| VOC-C06 | «**Definitions should be simple, accurate and useful rather than artificially dictionary-like.** One clear sentence is normal; two short connected sentences are fine when the second gives a genuinely helpful example or experience.» | every definition | default | | `references/preferences.md` › Written Voice › Core rules · L77 | near-duplicate of C01 and C10: carries its own permission and condition (a second sentence when it gives a helpful example or experience); C26 and O11 give different conditions | PREF-VOC, or stays in Written Voice for the other authors (decision 10) |
| VOC-C07 | «`Friction - a force that slows things when surfaces rub together. You can feel it when you rub your hands together.` is acceptable when that extra example earns its space.» | illustrates C06 | | | `references/preferences.md` › Written Voice › Core rules · L77 | example; decision 2 | with C06 |
| VOC-C08 | «The card is somewhere children glance back at, not somewhere the lesson teaches from, so keep it uncluttered and never inaccurate. When a necessary caveat or fuller explanation would make the card too long, that fuller teaching belongs on the Teach slide.» | every card | must (never inaccurate) | | `references/preferences.md` › Vocabulary · L363. Copy: C10 | rule | PREF-VOC |
| VOC-C09 | «Add a visual note where it makes the meaning clearer.» | | | | `references/preferences.md` › Vocabulary · L363 | stale (from when the picture was a written note; it is now a structured field, D14) | retire (decision 13) |
| VOC-C10 | «Treat "one breath" as a quality test rather than a rigid sentence limit: one breath means a sentence you could say in one, not a phrase squeezed until it fits. Do not make a definition inaccurate to save words; teach necessary comparisons, caveats or fuller explanation elsewhere while the card remains useful as a quick reference.» | every definition | must (never inaccurate) | | `references/preferences.md` › Vocabulary · L365 | rule; partly duplicates C08. "One breath" is not stated anywhere else, so it answers an older rule that has gone | PREF-VOC |
| VOC-C11 | «**A set of cards must not define its words in terms of each other.**» «When two terms in one set are naturally defined through one another, at least one of them reaches outside the pair to something the child already has - what it lets you do, where you meet it, what it makes happen. Often the honest answer is that the second word does not need a card at all» | a set of cards | must | | `references/preferences.md` › Vocabulary · L349 | rule (with the appliance and electricity example; M13 uses the same example) | PREF-VOC |
| VOC-C12 | «**Order the cards so a word is defined before another definition uses it.**» «Read each definition and see which other carded words it contains; those come first. It costs nothing, because the cards are a reference rather than a sequence the lesson depends on. Where two definitions need each other, neither order is wrong and the more concrete word leads. This is about the order on the card set, not about when each word is introduced in the lesson, which is decided by where the word is needed.» | a set of cards on one slide; exception: two definitions that need each other, where the more concrete word leads | must | | `references/preferences.md` › Vocabulary · L341 | rule | PREF-VOC |
| VOC-C13 | «A Year 4 maths slide carded `round` first (`Replace a number with the nearest multiple of the amount asked for.`) and `multiple` second, so the first definition a child read leaned on a word the card below it had not taught yet, and the teacher swapped them by hand (19 September 2026).» | illustrates C12 | | | `references/preferences.md` › Vocabulary · L341 | story (in the log: L661, L3564) | LOG; the round/multiple case could stay undated (decision 12) |
| VOC-C14 | «Do not make a simple definition sound academic merely because it is a vocabulary box.» | every definition | must | | `references/teacher-voice.md` › 5. Explanations and definitions · L280 | duplicate of C01 | TV (the voice guide owns how it sounds) |
| VOC-C15 | «When a straightforward explanation works, use it.» «An electrical appliance is something that uses electricity to work.» «Evaporation is when a liquid changes into a gas.» | definitions and explanations | default | | `references/teacher-voice.md` › 5 › Prefer direct explanation · L272 | rule with two examples in the house shape | TV |
| VOC-C16 | «A slightly fuller shape can be better when it gives the idea before the term:» «When a liquid gets warmer, some of it can change into a gas. This is called **evaporation**.» | | may | | `references/teacher-voice.md` › 5 › Prefer direct explanation · L282 | rule with example | TV |
| VOC-C17 | «A key-term definition that follows stays plain:» «The place where a river begins is called its **source**.» | a definition after a narrative opening | must | | `references/teacher-voice.md` › 5 › Style varies by the job of the sentence · L292 | rule with example | TV |
| VOC-C18 | «"Concise" is not a universal rule for every line; the sentence's function decides how much character it can carry.» | | | | `references/teacher-voice.md` › 5 · L296 | shared (voice) | TV |
| VOC-C19 | «Do not add a second sentence simply because explanations "should" be thorough.» | definitions and explanations | must | | `references/teacher-voice.md` › 5 › Extra wording must earn its place · L326 | shared (voice); sits beside C06's "two sentences are fine when..." | TV |
| VOC-C20 | «"definition": "Two amounts that are worth the same."» | the contract's example entry | | `vocabulary[]` fields `id`, `sourceUnitId`, `term`, `definition`, `visual` (code: exact keys) | `references/output-template.md` › Vocabulary · L120 | example; decision 2 | OT |
| VOC-C21 | «{ "word": "evaporation", "definition": "water turning into vapour" },» | the slide catalogue's `vocab` object | | `vocab` content object | `references/templates.md` › vocab · L747 | example; decision 2 (the slide designer copies definitions, so it cannot spread from here) | STAYS (fix with decision 2) |
| VOC-C22 | «Read each definition beside the teaching that uses the term and the success criteria that assess it: all three describe the same concept.» | the designer's completion pass | must | | `agents/lesson-designer.md` › One Completion Pass · L522. Copies: L02, L03 | rule | STAYS (the designer's own final check) |
| VOC-C23 | «Defining `working conditions` as how long the days were and how safe the work was, then assessing the place and the time off as well, is a mismatch; widen the definition and the teaching, or narrow the criteria.» | illustrates C22 | | | `agents/lesson-designer.md` › One Completion Pass · L522 | example (undated) | with C22 |
| VOC-C24 | «§5 a vocabulary definition or explanation» «Definitions and scripts are the two most often missed, because a definition feels like a structured field being filled and a script feels like notes rather than writing; both are words a child reads or hears, and both are where the register slips first.» | when writing a definition | must (read) | | `agents/lesson-designer.md` › Reference Files · L566 | pointer with its reason | STAYS (the reading route) |
| VOC-C25 | «a definition or explanation §5» | when writing a definition | must (read) | | `references/teacher-voice.md` › How to read this file · L20 | pointer | STAYS |
| VOC-C26 | «A longer version is better only when the extra wording adds: - a useful example; - a misconception correction; - a method reminder; - genuinely helpful scaffolding; - an important connection.» | definitions and explanations | must | | `references/teacher-voice.md` › 5 › Extra wording must earn its place · L328 | rule (the fullest list of when a second sentence earns its place; compare C06 and O11) | TV |
| VOC-C27 | «A definition, a script or a question repaired into something shorter and flatter has swapped one fault for another. Keep the thinking the line was asking for.» | the repair-only designer role | must | | `agents/lesson-designer-focused-repair.md` · L46 | duplicate of C01 for a role that never reads your preferences | STAYS |

## D. The card's picture

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-D01 | «**Every vocabulary card carries one coherent visual.** A word with only a definition beside it is read to the class and explained; a word beside the thing it names is something children can look at, point to and be asked about, and the teacher wants every card to give that chance (8 September 2026).» | every card; exception D03 | must | `visual` is a required field (code) | `references/preferences.md` › Vocabulary · L367. Copies: D07, N05, N06 | rule; your ruling (dated) | PREF-VOC |
| VOC-D02 | «The visual is whatever honestly shows the word in this lesson's own material: the photograph or diagram the word will be used on (the mouth diagram with the incisors coloured, the pair of rattles for `continuity`), a drawn helper (a place-value column for `placeholder`), or the library drawing of the object itself.» | choosing the picture | default | | `references/preferences.md` › Vocabulary · L367 | rule | PREF-VOC |
| VOC-D03 | «`A Picture Beside a Word` still decides which: a vague picture is worse than none, so when no single object IS the word, reach for the lesson's own source or helper rather than a symbol that gestures at the area. `none` is the rare exception for an idea nothing can honestly show, and the design says so.» | choosing the picture; exception: nothing can honestly show it | must | `{ "kind": "none" }` | `references/preferences.md` › Vocabulary · L367 | rule | PREF-VOC |
| VOC-D04 | «Decide it one word at a time with the referent test in `Lesson Designer visual-need boundary`: ask what a camera could be pointed at for *this* word, and say what that thing is. A whole set answered `none` together is the tell that the words were judged as a group rather than one by one» | every card | must | review routing card (D22) | `references/preferences.md` › Vocabulary · L367 | rule | PREF-VOC |
| VOC-D05 | «`belief`, `celebration` and `tradition` went out on one deck with no visual between them, and while `belief` was right, a family round a table is a celebration and people singing the same carol every year is a tradition.» | illustrates D04 | | | `references/preferences.md` › Vocabulary · L367 | example from a real deck (undated; fully in the log at L3443) | with D04 (decision 12) |
| VOC-D06 | «Avoid collections of separate decorative pictures.» | a card's picture | must | | `references/preferences.md` › Vocabulary · L367 | rule | PREF-VOC |
| VOC-D07 | «Every card carries one coherent visual (`preferences.md` → Vocabulary): the lesson's own photo, diagram or helper the word is used on, or the drawing of the thing itself. Visual must move child closer to concept; a vague picture is worse than none, so when no single object IS the word use the source or helper it will be met on rather than a symbol. `none` is the rare exception for an idea nothing can honestly show.» | as D01 to D03 | must | | `agents/lesson-designer.md` › Vocabulary · L204 | duplicate of D01, D02, D03 | PREF-VOC |
| VOC-D08 | «Record visual note alongside definition (real image, diagram, labelled part, emoji).» | | | | `agents/lesson-designer.md` › Vocabulary · L204 | stale (the picture is a structured field now; D14 says «Do not emit prose `visual:` field») | retire (decision 13) |
| VOC-D09 | «Maths rarely needs photos, lean on emojis (🔢➗🔟) or diagram descriptions.» | maths cards | default | | `agents/lesson-designer.md` › Vocabulary · L204 | contradiction with D02, D17 and the catalogue's maths card examples (drawn angle, coins, place-value picture, triangle); decision 1 | decision 1 |
| VOC-D10 | «**Visual must show thing word means.** `preferences.md` → A Picture Beside a Word test applies wherever picture beside word - vocab card, word bank, sorting set, slide list.» | every picture beside a word | must | | `agents/lesson-designer.md` › Vocabulary · L206 | duplicate of D16 | PREF-PIC |
| VOC-D11 | «Template holds single image. Two words both attracting 🌍 end up same picture - obvious in set.» | a set of cards | check | | `agents/lesson-designer.md` › Vocabulary · L206 (only copy) | rule (no two words with the same picture) | PREF-VOC |
| VOC-D12 | «Foundation subjects: when teaching sequence already sources photos (biome landscapes, river source, Mayan pyramid), name same photo as card visual - child meets twice, costs nothing.» | foundation subjects with sourced photos | default | `{ "kind": "photo", "photoRef": ... }` | `agents/lesson-designer.md` › Vocabulary · L206 (only copy) | rule; overlaps D02 | PREF-VOC |
| VOC-D13 | «When word IS written form/symbol (digital time, decimal point, %), use structured `visual` object `{ "kind": "built-in", "value": "..." }` with notation as built-in glyph (e.g. "10:05" or "0.7") - analogue clock emoji beside "digital time" shows opposite.» | a word that is a written form or symbol | must | `built-in` kind | `agents/lesson-designer.md` › Vocabulary · L206 (only copy) | rule + recording; the contract's own `built-in` example is a drawn helper (`money: £1`), so the kind covers drawings as well as notation | LD-VOC |
| VOC-D14 | «When word names idea no picture can honestly carry (line of latitude invisible), use `{ "kind": "none" }` - real option. Do not emit prose `visual:` field; use kinds defined in `output-template.md`.» | a word no picture can carry | must | `none` kind; tests pin both sentences | `agents/lesson-designer.md` › Vocabulary · L206 | rule + recording | LD-VOC |
| VOC-D15 | «`visual.kind` is one of:» «Use these exact shapes:» | recording the picture | mechanics (code) | kinds `none`, `emoji`, `photo`, `representation`, `built-in`, `description` | `references/output-template.md` › Vocabulary · L127 | mechanics | OT |
| VOC-D16 | «Wherever a picture sits next to a word — a vocabulary card, a worksheet word bank, a sorting card, a slide list, a label — it is there to carry the meaning, so a child who cannot yet read the word still knows what the thing is. That is the only job it has, and it is the test it has to pass: **would a child who did not know this word get closer to it from this picture?**» | every picture beside a word, on any surface | check | heading `A Picture Beside a Word` (review routing card) | `references/preferences.md` › A Picture Beside a Word · L373. Copy: D10 | rule (shared by every surface) | PREF-PIC (stays whole) |
| VOC-D17 | «A picture passes when it IS the thing (🦴 for spine, 🔦 for torch, 🛹 for skateboard). It fails when it merely gestures at the area: a spiral beside "vacuum cleaner", an ice cube beside "fridge", a puff of air beside "hairdryer", 🌍 beside "biome".» | as D16 | check | | `references/preferences.md` › A Picture Beside a Word · L375 | rule with examples | PREF-PIC |
| VOC-D18 | «**When nothing true exists, the word goes on its own.** No picture reads better than a vague one, and it is the right answer rather than a gap to apologise for. Leaving one word bare in a set where the others have pictures is fine» | as D16 | must | | `references/preferences.md` › A Picture Beside a Word · L377 | rule (its tone is warmer to `none` than D03's "rare exception"; they agree) | PREF-PIC |
| VOC-D19 | «**The same test holds when the picture sits beside a whole statement,**» | statements, wall cards | check | | `references/preferences.md` › A Picture Beside a Word · L379 | shared (statements) | PREF-PIC |
| VOC-D20 | «The boundary: this is about a picture whose job is to carry meaning a child cannot yet read for themselves. A photograph that is the lesson's stimulus, a diagram a child labels or reads values off, a drawn model that is itself the teaching: those earn their place as content, and this test does not apply to them.» | limit of D16 | | | `references/preferences.md` › A Picture Beside a Word · L381 | rule (limit) | PREF-PIC |
| VOC-D21 | «A placeholder in a vocabulary `visual` means replace the whole value with the final structured visual object.» | filling the scaffold | mechanics | | `references/lesson-design-scaffold.md` · L208 | mechanics | STAYS |
| VOC-D22 | «Read when any vocabulary word has no visual, and for each such word» | the reviewer, when a word has no picture | must (read) | heading `A Picture Beside a Word` | `scripts/design-review-packet.py` · L162 | code (the reviewer's routing card) | STAYS (code) |
| VOC-D23 | «**Prefer built-in drawings over `image` when they carry the meaning - they require no picture sourcing and cannot become a missing-file placeholder.**» | a card's picture, as the slide designer reads it | default | | `references/templates.md` › key-vocabulary · L387 | rule; decision 1 (on the side of a drawn picture) | STAYS |
| VOC-D24 | «Vocabulary had visuals next to definitions (e.g. "vertebrate" with a spine image).» | | | | `references/preferences.md` › Pride Lessons · L754 | your example (a Pride Lesson) | STAYS exactly as it is |

## E. When a word is introduced

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-E01 | «**Introduce each word where it is most useful, which is usually just before the teaching or task that needs it.** Reading the whole set out after the starter has not been helping. A definition met before it names anything a child has seen is held as a slogan, and a word introduced eight slides before it is used has stopped being a glance reference by the time anyone glances. So plan each word's own moment rather than one moment for all of them, and let the lesson carry as many introductions as it genuinely needs.» | every word | default here ("usually"); E04 and E05 make it a must that the code checks | tests pin two sentences | `references/preferences.md` › Vocabulary · L351. Copies: E13, E28 | rule | PREF-VOC |
| VOC-E02 | «Two things decide the moment. A term children need in order to follow an instruction goes in before that instruction: they cannot start otherwise, and there is no meaning to show them first. A term whose meaning the material can show goes in after that noticing, so it lands on what children have just seen and the next beat attaches it (`children learning together, continuity; no whiteboard, change`). Most lessons carry some of each.» | every word | must | | `references/preferences.md` › Vocabulary · L353. Copies: E03, E29 | rule | PREF-VOC |
| VOC-E03 | «Two things decide that point. A term children need in order to follow an instruction goes in before that instruction (a `series circuit`, a `noun phrase`): there is no meaning to show them first and they cannot start without it. A term whose meaning the material can show goes in after that noticing, so it lands on something they have seen and the next beat attaches the word to it (children look at two classrooms and say what is alike, then hear that the alike things are called continuities).» | as E02 | must | | `agents/lesson-designer.md` › Vocabulary · L210 | duplicate of E02 (its two examples are only here) | PREF-VOC |
| VOC-E04 | «Introduce a word in front of the beat that needs it, which means the very next beat uses it: the card is shown because the class is about to meet, use or need that word now. The validator checks it, and names the beat where the word is first needed when the card sits further back.» | every word | must (code) | `validate_vocabulary_is_used` | `agents/lesson-designer.md` › Vocabulary · L210 | duplicate of E05 | PREF-VOC |
| VOC-E05 | «**A card sits in front of the beat that needs the word.** The next beat uses it, because that is what a card is for: the class is about to meet, use or need the word now. The validator names the beat where a word is first needed when its card sits further back, so a set introduced together has to be a set the next beat genuinely needs.» | every word | must (code) | as E04; your words in the code: "the vocab slide is used when they are about to meet, use or need that word for the next slide" | `references/preferences.md` › Vocabulary · L359. Copy: E04 | rule | PREF-VOC |
| VOC-E06 | «A Year 4 science lesson (18 September 2026) introduced decay, plaque and acid together after the starter; plaque and acid were needed next and decay was not needed for another three beats, so the class met a definition, did two beats of other work, and met the thing it named later.» | illustrates E04 | | | `agents/lesson-designer.md` › Vocabulary · L210 | story. **Not in the build log** (only here and in a code comment, which says "four" beats) | LOG (copy it there first) |
| VOC-E07 | «Where a word feels like it belongs earlier than its first use, the question is usually the other way round: an earlier beat is describing the thing and not saying the word, and the repair is that beat's own wording rather than the card's place.» | repairing a misplaced card | default | the validator's refusal says the same | `agents/lesson-designer.md` › Vocabulary · L210 (only full copy). Copy: E08 | rule | PREF-VOC |
| VOC-E08 | «The worked case is vocabulary placement. `multiple is introduced here and first needed 1 beat later` can be repaired by moving the card to its own introduction in front of the beat that needs it, or by the earlier beat saying the word it was already describing.» | the repair-only designer role | mechanics | | `agents/lesson-designer-focused-repair.md` · L38 | near-duplicate of E07: offers both repairs equally, card first, where E07 prefers the beat's own wording (that role never reads the full files) | STAYS |
| VOC-E09 | «Discovery still introduces formal vocabulary after the exploration, and no definition may hand over the thing an exploration exists to discover.» | a lesson with an exploration | must | | `agents/lesson-designer.md` › Vocabulary · L210 | near-duplicate of E10: a rule for every Discovery lesson (all formal vocabulary after the exploration); the Discovery route file has no vocabulary rule, so it lives only here | PREF-VOC |
| VOC-E10 | «A definition must not hand over what an exploration exists to discover: if the task is for children to notice which things stayed the same, naming that noticing first is telling them the answer, so the word follows the exploration.» | a lesson with an exploration | must | | `references/preferences.md` › Vocabulary · L357. Copies: E09, E11 | rule | PREF-VOC |
| VOC-E11 | «Audit everything the class meets before it - the starter, the vocabulary cards, every visible reference and photograph - and keep the successful arrangement, rule or answer the attempt exists to expose out of all of it.» «the term for what they found is taught after the attempt has given it meaning.» | a skill lesson's bounded attempt | must | test pins "the starter, the vocabulary cards" | `references/teaching-sequence-skill-based.md` · L9 | duplicate of E10 for that route | STAYS (route file) |
| VOC-E12 | «A word must not be introduced after its last meaningful use; that is not late teaching, it is no teaching.» | every word | must | | `references/preferences.md` › Vocabulary · L357. Copy: E13 | rule | PREF-VOC |
| VOC-E13 | «The failure this prevents at one end is a definition met before it means anything, which a child holds as a slogan. The failure at the other end is a word introduced after the last moment it was any use.» | | | | `agents/lesson-designer.md` › Vocabulary · L214 | duplicate of E01 and E12 | PREF-VOC |
| VOC-E14 | «**And a card must not answer the question the very next beat is about to ask.** That is the same fault one slide earlier and it is the one that reaches a class, because the card looks like a reference rather than an answer:» «Read each introduction against the beat that follows it, not only against the beat that needs the word.» | every introduction | must | tests pin both sentences | `references/preferences.md` › Vocabulary · L357. Copy: E16 | rule | PREF-VOC |
| VOC-E15 | «a Year 4 teeth deck showed two teeth and asked what was different about their biting edges, then went straight to a card defining incisors as the front teeth with thin edges that cut, before anybody had answered.» | illustrates E14 | | | `references/preferences.md` › Vocabulary · L357 | story (in the log, 4.2.143) | keep as an undated example, or LOG (decision 12) |
| VOC-E16 | «And read each introduction against the beat that follows it as well as the beat that needs the word: a card that answers the question the next beat is about to ask has handed the lesson over, which is what a teeth deck did when it defined incisors as the front teeth that cut on the slide straight after asking what was different about two teeth's biting edges.» | every introduction | must | test pins "read each introduction against the beat that follows it" | `agents/lesson-designer.md` › Vocabulary · L214 | duplicate of E14 and E15 | PREF-VOC |
| VOC-E17 | «**Group words when they are needed together, and only then.** `past` and `to`, `continuity` and `change`, `series` and `parallel` arrive as a pair because each is only half an idea without the other. Grouping is a teaching decision, not a quota: one word is a normal introduction, so is a pair, so is a set of four, and so is a lesson whose words genuinely do all belong before the first task.» | every set of words | must | | `references/preferences.md` › Vocabulary · L355. Copies: E19, E27 | rule | PREF-VOC |
| VOC-E18 | «What is not a decision is putting them all at the top because that is where they went last time, and the failure at the other end is splitting a set into one word per slide to look thorough, which scatters into four slides the reference children wanted in one place.» | every set of words | must not | test pins "splitting a set into one word per slide to look thorough" | `references/preferences.md` › Vocabulary · L355 | rule; carries your 30 August ruling (against a run of one-word slides at the start) | PREF-VOC |
| VOC-E19 | «Group words that are needed together and separate ones that are not. `past` and `to` arrive as a pair; a prerequisite word and a pair of contrast words are two entries, not one. One word, two, or a useful larger set are all ordinary introductions, and so is a lesson whose words genuinely all belong before the first task. Do not put every word at the start by default, and do not split a set into one word per entry to look thorough.» | as E17 | must | | `agents/lesson-designer.md` › Vocabulary · L212 | duplicate of E17 and E18, plus: a prerequisite word and a pair of contrast words are two entries (also in E27) | PREF-VOC |
| VOC-E20 | «Plan when each word is introduced, and write it into `vocabularyIntroductions` as one entry per moment: the words introduced there, and the unit it follows. Each entry becomes one `key-vocabulary` slide, so a lesson may have one introduction or several, and how many is your decision rather than a default.» | recording the timing | mechanics | `vocabularyIntroductions`, `key-vocabulary` | `agents/lesson-designer.md` › Vocabulary · L208 | recording | LD-VOC |
| VOC-E21 | «Words that arrive at the same moment share one entry (`nutrients` and `carbohydrates` both met before the first food is shown are `["vocab-001", "vocab-002"]` after the starter, one slide), because two entries on one anchor render as two consecutive single-word slides.» | recording the timing | mechanics | `vocabularyRefs`, `vocab-###` | `agents/lesson-designer.md` › Vocabulary · L208 (only copy) | recording | LD-VOC |
| VOC-E22 | «The Lesson Designer records this as `vocabularyIntroductions`, one entry per introduction, in the order they happen.» | | pointer | test pins it | `references/preferences.md` › Vocabulary · L361 | pointer to the recording | PREF-VOC |
| VOC-E23 | «**`vocabularyIntroductions`** is a top-level ordered array beside the vocabulary array: one entry per moment the lesson introduces vocabulary, in the order they happen. Each entry becomes one `key-vocabulary` slide (`preferences.md` → Vocabulary).» | recording | mechanics | `vocabularyIntroductions` | `references/output-template.md` › Vocabulary · L160 | mechanics | OT |
| VOC-E24 | «`vocabularyRefs` names the vocabulary ids introduced at that moment. `after` names the unit the introduction follows, which is the starter's `sourceUnitId` or any teaching-sequence `sourceUnitId`, and means after the whole of that unit including its last slide when the unit spans several. Two entries on the same anchor keep their listed order.» | recording | mechanics (code) | `vocabularyRefs`, `after`, `sourceUnitId` | `references/output-template.md` › Vocabulary · L162 | mechanics | OT |
| VOC-E25 | «Every retained word takes exactly one introduction, and a word may not appear in two. Later reminders and reuse are ordinary teaching and are not listed here. An empty vocabulary array takes an empty introductions array.» | recording | must (code) | validator: introduced once, none missing | `references/output-template.md` › Vocabulary · L166 | mechanics | OT |
| VOC-E26 | «The superseded `vocabularyPlacement` field is still read so that saved designs keep their original meaning: absent or `null` put every word after the starter, and `{ "after": "<teachingSequence sourceUnitId>" }` put every word after that unit. Write `vocabularyIntroductions` in new designs. A design carrying both is refused rather than guessed at.» | old saved designs | mechanics (code) | `vocabularyPlacement` | `references/output-template.md` › Vocabulary · L183 | mechanics (legacy) | OT |
| VOC-E27 | «`vocabularyIntroductionCount` is how many separate moments the lesson introduces vocabulary at, which is never more than `vocabularyCount` and is `0` when there is no vocabulary. Two words introduced together are one moment; a prerequisite word before an instruction and a contrasting pair after the noticing that gives them meaning are two. It is a teaching decision and there is no default: all the words at one moment is a real answer, and so is one moment each.» | the scaffold's counts | mechanics | `vocabularyIntroductionCount`, `vocabularyCount` | `references/lesson-design-scaffold.md` · L87 | mechanics; repeats E17 | STAYS |
| VOC-E28 | «Introduce vocabulary at its point of need; neither observation-first nor an opening glossary is compulsory.» | the content route | may (neither opening is compulsory) | | `references/teaching-sequence-content-based.md` · L25 | near-duplicate of E01: adds the permission that neither observation-first nor an opening glossary is compulsory | STAYS or remove (decision 10) |
| VOC-E29 | «Vocabulary arrives when it helps children understand the material or take the next step (`vocabularyIntroductions` records the moment). Noticing an accessible source before naming continuity and change can work well; teach a necessary word first when children need it to make sense of what follows.» | history | may | | `references/subject-history.md` · L42 | near-duplicate of E02, weaker ("can work well") | SUBJ or remove (decision 10) |
| VOC-E30 | «**The idea, then its name, then the name attached to what they just saw.** Something that has stayed similar over time is called a continuity. Something that has become different is called a change. Then straight back to their own noticing: children learning together in a room, continuity; no interactive whiteboard, change. The word arrives after the meaning exists, so it lands on something (`vocabularyIntroductions` in the design carries that moment).» | history | | | `references/subject-history.md` › What the lesson feels like to the child · L24 | your example (Victorian schooling sketch, step 2) | STAYS exactly as it is |
| VOC-E31 | «A small factual or vocabulary input may come first when children need it to reason sensibly.» | a Dialogic lesson | may | | `references/teaching-sequence-dialogic.md` · L11. Copy: E33 | rule (route) | STAYS |
| VOC-E32 | «When children need a small factual or vocabulary grounding input before the first stimulus, represent it explicitly:» | a Dialogic lesson | mechanics | | `references/teaching-sequence-dialogic.md` · L58 | mechanics | STAYS |
| VOC-E33 | «Dialogic may begin with small factual/vocab when needed.» | choosing Dialogic | may | | `references/lesson-designer-components.md` · L15 | duplicate of E31 | STAYS |
| VOC-E34 | «Vocabulary is already free in the same way, since `vocabularyIntroductions` names the unit each word follows.» «if it thinks seperate key vocab do it» | a skill lesson | may | | `references/teaching-sequence-skill-based.md` · L217 | your ruling (12 September, your words) | STAYS |
| VOC-E35 | «When one word needs teaching rather than introducing, that teaching is a Teach beat with its own slide in the sequence, in addition to - never instead of - the word's card.» | a word that needs real teaching | must | | `references/slide-composition-playbook.md` › Vocabulary · L346 (only copy) | rule, **in the wrong place**: it is a lesson-design decision and only the slide designer reads this file; decision 6 | PREF-VOC |
| VOC-E36 | «What a run of single-word slides at the open of a lesson does is scatter into four slides a reference children wanted in one place, none of them near the teaching that needs it. That is a reason to question a design that plans four separate introductions before anything has happened, not a reason to override one that introduces two words at the point they are used.» | the slide designer | must not override | | `references/slide-composition-playbook.md` › Vocabulary · L346 | rule; carries your 30 August ruling | SD |
| VOC-E37 | «Vocabulary, a routine, a safeguarding note and setup sit beside the spine, and a brief piece of interesting subject knowledge can earn its minute without becoming an assessed outcome.» | the lesson spine | | | `references/preferences.md` › What a Lesson Is For · L154 | shared (lesson spine) | STAYS |
| VOC-E38 | «That is a challenge to answer, not an automatic fault, because vocabulary, a routine, a safeguarding note or setup can legitimately sit beside the spine rather than on it.» | the movability challenge | | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L218 | shared | STAYS |
| VOC-E39 | «`null` is a real answer for a beat beside the spine (a vocabulary moment, a routine, a safeguarding note, setup, the final performance)» | writing `unlocks` | | `unlocks` | `agents/lesson-designer.md` › The Teach → Do Rhythm · L254 | shared | STAYS |
| VOC-E40 | «A slide that honestly sits beside the spine (the vocabulary slide, a routine, a safeguarding note, setup) says so» | the walk-through | | | `agents/lesson-designer.md` › Write the lesson, then the contract · L421 | shared | STAYS |
| VOC-E41 | «Use `null` when the beat genuinely sits beside the spine rather than on it: a vocabulary introduction moment, a routine, a safeguarding note, setup, or the lesson's final performance with nothing after it.» | recording `unlocks` | mechanics | `unlocks` | `references/output-template.md` · L442 | shared | STAYS |
| VOC-E42 | «a place beside the spine (vocabulary, a routine, a safeguarding note, setup)» | the reviewer | | | `agents/design-reviewer.md` · L200 | shared | STAYS |
| VOC-E43 | «Two sources that separately feed a later comparison, vocabulary or setup beside the spine, and practice that repeats a method on fresh numbers are right as they are» | | | | `references/task-contrasts.md` · L79 | shared | STAYS |
| VOC-E44 | «**Then each slide, in order.** For every slide the class will see, the starter, the vocabulary slide, each Teach, Do, model, practice, launch and check:» | the walk-through | | | `agents/lesson-designer.md` › Write the lesson, then the contract · L414 | shared | STAYS |
| VOC-E45 | «The limit: a criterion, a definition or a reference genuinely needed to start does go first» | sequencing | | | `references/preferences.md` › What a Lesson Is For · L162 | shared; agrees with E02 | STAYS |
| VOC-E46 | «Where the objective requires children to name and describe each unfamiliar member of a set, normally teach and let children use each member’s defining knowledge before moving on; naming them together and adding a shared task is not equivalent.» | an objective that names a set | default | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L182 | shared (rhythm); decision 8 (against E17) | STAYS |
| VOC-E47 | «The one thing fixed is the cycle itself: between a My Turn and its Your Turn nothing intervenes, because a class modelled to and then taken somewhere else arrives at its check having lost the thread.» | a skill lesson | must | | `references/teaching-sequence-skill-based.md` · L219 | shared (skill route); decision 7 (against E04 and E05) | STAYS |
| VOC-E48 | «what the word `digit` names» | a skill lesson's `teach` beat | may | | `references/teaching-sequence-skill-based.md` · L223 | shared; relates to decision 6 | STAYS |
| VOC-E49 | «A Teach block introduces a single new thing — a method, a sentence structure, a fact, an explanation, a cause, a vocabulary distinction.» | every Teach block | | | `references/preferences.md` › The Teach → Do → Teach → Do Rhythm · L180 | shared (rhythm); relates to decision 6 | STAYS |
| VOC-E50 | «What generalises is the order: material, noticing, the idea named after it is met, use, more knowledge,» | history | | | `references/subject-history.md` · L32 | your example (what your Victorian sketch teaches in general) | STAYS exactly as it is |

## F. What the teacher says on the vocabulary slide

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-F01 | «Each entry carries its own `script`: the teacher stands in front of that slide and reads those cards, and a deck shipped with two vocabulary slides and empty notes on both.» | every introduction | must (code) | `script` | `agents/lesson-designer.md` › Vocabulary · L208 | duplicate of F02, with a story | LD-VOC (the rule), LOG (the story) |
| VOC-F02 | «`script` is the words the teacher says while that slide is up, beginning `Say to children:`, written to the same standard as any other script (`teacher-voice.md` §16H). It is required on every entry, because the slide is a teaching moment and the teacher is standing in front of it:» «Read each card, and for a word with a visual say what the class is looking at; the boundary decision the Vocabulary preference asks for (`cardboard, opaque or not opaque?`) lives here too.» | every introduction | must (code: starts `Say to children:` with words after it) | `script`, `Say to children:` | `references/output-template.md` › Vocabulary · L164. Copies: F01, F04 | rule (the fullest copy, and the only place that says what the script contains) | OT, with what to say in PREF-VOC |
| VOC-F03 | «a deck shipped with two vocabulary slides and empty notes on both, and the class met `belief` and `nativity` with nothing said about either.» | | | | `references/output-template.md` › Vocabulary · L164 | story (in the log) | LOG |
| VOC-F04 | «Each entry's `script` is that slide's speaker notes, copied exactly like any other source-authored script.» | the slide designer | must | | `agents/slide-designer.md` › 7. Keep vocabulary coherent · L267 | rule | SD |

## G. Using the word after the card

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-G01 | «A word also has to be put to work somewhere in the lesson itself. A card is a glance reference for language children are about to handle, so before a word keeps its card, point to where it lands: a script that says it aloud, a question whose answer needs it, a task written with it in, a stem that holds it.» | every carded word | must | | `references/preferences.md` › Vocabulary · L335. Copies: G03, G09 | rule | PREF-VOC |
| VOC-G02 | «A word with nowhere to point is being displayed rather than taught, and that is true even of a genuinely strong subject word inherited from a scheme's list that children will meet later in the unit. Strong but unused still comes off this lesson's set; if it deserves to stay, give it a job in a task or a script and it earns its place honestly.» | every carded word | must | | `references/preferences.md` › Vocabulary · L335 | rule | PREF-VOC |
| VOC-G03 | «**Use words in lesson, not only card.** Give every card at least one natural landing in script/task. Where task about something key word names, write task with word in it. If completed scripts/tasks leave card word with nowhere natural, word failed selection test and comes out.» | every carded word | must | | `agents/lesson-designer.md` › Vocabulary · L216 | duplicate of G01 and G02, plus: where a task is about the thing a word names, write the task with the word in it | PREF-VOC |
| VOC-G04 | «The beat straight after the card uses the word on its board, in its question or task, and in its script, so children use it rather than only meet its definition (`working conditions` was carded in a Tudor lesson and never said again); the validator refuses a word no later beat uses.» | every carded word | must (code checks a weaker form: the word anywhere in that beat) | `validate_vocabulary_is_used` | `agents/lesson-designer.md` › Vocabulary · L216 (only copy of "all three places") | rule with a story (in the log); decision 5 | PREF-VOC |
| VOC-G05 | «A word earns its vocabulary slide because the beats after it need it: write it into » | the validator's refusal | code | `vocabularyIntroductions[n]: ... is introduced and then never used` (test pins it) | `scripts/validate-lesson-design.py` · L1428 | code | STAYS (code) |
| VOC-G06 | «The cheapest thing that turns a definition into a usable meaning is one quick decision at its boundary, taken straight after the word is introduced: *cardboard, opaque or not opaque? Glass? This frosted sheet?*» «Plan that decision for the words the lesson's thinking actually runs on, and plan for one of them to be asked for again later, once the definition has left the screen. Two boundaries on this: it is a few seconds inside the introduction rather than a beat of its own, and a word whose meaning has no interesting edge (a proper name, a piece of notation) does not need one.» | words the thinking runs on; not a proper name or notation | default | tests pin four phrases | `references/preferences.md` › Vocabulary · L345 | rule | PREF-VOC |
| VOC-G07 | «Once a technical word has been properly taught in the lesson, start using it normally; a vocabulary card alone is a reference, not that teaching, so a word met only on the card still gets its bridge.» | every string after the card | must | | `references/preferences.md` › Written Voice › Core rules · L53 | rule; shared with voice (every author reads Written Voice) | STAYS in Written Voice |
| VOC-G08 | «A definition card, diagram label or mention in a script does not alone establish understanding.» | designing the middle of the lesson | must | | `agents/lesson-designer.md` › Settle the classroom experience · L58 | wider than G07: covers diagram labels and script mentions, and its repair is H04 (supply the referent) where G07's is a bridge; shared (assumed knowledge) | STAYS |
| VOC-G09 | «Confirm vocabulary is used and explanations are present where claimed.» | the designer's completion pass | must | | `agents/lesson-designer.md` › One Completion Pass · L522 | duplicate of G01 | STAYS |
| VOC-G10 | «when a term's exact wording is the learning, the check is the term used on a fresh case, not the sentence said back» | a quick check on a term | must | test pins it | `agents/design-reviewer.md` · L204 | shared (quick checks) | STAYS |
| VOC-G11 | «The reason to want it beyond the mismatch is what a taught word is for - the test of teaching `enamel` is not whether a child can define it but whether they decide for themselves that it is the word they need to explain the decay, and the model is the one place the lesson can show that decision being made.» | a launch model | | `{{taught word}}` (code) | `references/preferences.md` › Lesson Designer visual-need boundary · L631 | shared (modelling); the only place that says what vocabulary teaching is for | STAYS; worth a pointer from PREF-VOC |
| VOC-G12 | «**The strong instance would meet this lesson's own success criteria.** Every `{{taught word}}` the beat's criteria name appears in it, and the validator refuses a model that leaves one out» | a launch model | must (code) | `{{...}}`, `validate_launch_uses_the_taught_words` | `references/teaching-sequence-content-based.md` · L181. Copy: G13 | shared (modelling) | STAYS |
| VOC-G13 | «**The strong instance would meet this lesson's own success criteria.** Every `{{taught word}}` the beat's criteria name appears in it, and the validator refuses a model that leaves one out» | as G12 | must (code) | as G12 | `references/teaching-sequence-task-centred.md` · L128 | duplicate of G12 (a different route file) | STAYS |
| VOC-G14 | «**Subject vocabulary** supplies the knowledge: `plaque`, `enamel`, `acid`; `monarchy`, `rebellion`; `numerator`. This is the lesson's `vocabulary`, and it is already handled.» | explanation tasks | | `reasoningWords` | `references/explanation-tasks.md` · L34 | shared (explanation tasks) | STAYS |

## H. Words the teaching leans on (shared with the assumed-knowledge topic)

The brief found the assumed-knowledge rule in nine places with nine scopes.
Only its word-level copies are listed here; the whole rule is its own topic.

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-H01 | «**A word the teaching leans on is taught, or the teacher ends up teaching it instead.** The selection test above asks whether a word earns a card. This one runs the other way: read the finished teaching and find the words a child has to already hold for a sentence to land.» | the finished teaching | must | | `references/preferences.md` › Vocabulary · L337 | rule; shared (assumed knowledge) | PREF-VOC |
| VOC-H02 | «Three repairs, in order of preference: say it in words the class already has (`helps your heart and your lungs`, `makes your muscles and bones stronger`); teach the word in that beat, in its own landed sentence, because it is worth having; or give it a card. What is not a repair is leaving it and hoping, because the sentence reads correctly to an adult every time.» | as H01 | must (the order is a preference) | | `references/preferences.md` › Vocabulary · L337 | rule | PREF-VOC |
| VOC-H03 | «A Year 4 PSHE slide landed `Balancing and controlled movement practise balance and coordination` beside `Regular energetic movement helps heart and lung fitness and strengthens muscles and bones`, and a child who does not hold coordination, fitness or balance gets nothing from either. The teacher then spends the beat explaining vocabulary rather than landing the teaching, which is the moment the lesson was built for.» | illustrates H01 | | | `references/preferences.md` › Vocabulary · L337 | example from a real deck (in the log, L2103) | keep undated, or LOG (decision 12) |
| VOC-H04 | «Supply a missing referent, meaning or connection before relying on it.» | the middle of the lesson | must | | `agents/lesson-designer.md` › Settle the classroom experience · L58 | shared (assumed knowledge) | STAYS |
| VOC-H05 | «Teach the precise technical term when it matters, but do not make a child unpack unnecessary abstraction before they can reach the learning. Write questions and model answers about the people, objects and actions first; attach the disciplinary term to that understood meaning. A correctly used subject word does not make an otherwise abstract sentence teacher-like.» «Preserve necessary technical language and formal source quotations; the teacher’s own explanation need not inherit their register.» | every string | must | | `references/preferences.md` › Written Voice › Core rules · L45. Copy: H06 | rule; shared (voice) | STAYS |
| VOC-H06 | «The issue is the abstract packaging, not the word continuity: teach and use that word, attached to a concrete meaning.» | comparison prompts | must | | `references/teacher-voice.md` › 12. Comparison and critique prompts · L717 | duplicate of H05 | STAYS |
| VOC-H07 | «For each name, find the words that tell this class who or what it is, on the board where it first appears or in an earlier lesson the brief names. A name nothing explains is a finding on User-fit, and you may repair it yourself as wording» | the reviewer's names list | must | the review view's `Names on the board` | `agents/design-reviewer.md` · L96 | shared (assumed knowledge); pairs with M06 | STAYS |
| VOC-H08 | «The sharpest version of this is a single ordinary word that means one thing to an adult and another to a child. `What do their reasons share?` uses `share` to mean hold in common; a Year 4 child has spent their whole school life being told that sharing means giving someone half.» | every pupil prompt | must | | `references/teacher-voice.md` › 6 › Use pupil-clear language · L461 | shared (voice); the general form of M03's everyday-meaning point, with a different remedy (use the plain word) | STAYS |

## I. A lesson's own label is not owned vocabulary (shared with success criteria)

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-I01 | «Taught subject vocabulary stays when the class owns it (`partition`, `digit`, `fronted adverbial`); an untaught label does not become acceptable because it is shorter.» | success criteria | must | | `references/teacher-voice.md` › 10. Success criteria · L674 | shared (success criteria) | STAYS |
| VOC-I02 | «**A word the lesson brings in to name something the child can already see is not vocabulary the class owns.** Giving it a vocabulary slide does not change that.» «Ask of each noun in a step: is this the subject's own word that the learning needs, or a name for something the child could point at? The first stays; the second becomes the thing they point at.» | success criteria | must | test pins the heading sentence | `references/teacher-voice.md` › 10. Success criteria · L676. Copies: I03, I04, I05 | rule; shared (success criteria owns it) | STAYS |
| VOC-I03 | «a word this lesson brought in to name something the child can already see (the ends of a line called `landmarks`) is one of those meanings, even when it has a vocabulary slide.» | success criteria | must | | `agents/lesson-designer.md` › Success Criteria Types · L300 | duplicate of I02 | STAYS |
| VOC-I04 | «and a label this lesson's own vocabulary slide introduced for something the child can already see (`landmarks` for the ends and halfway mark).» | a skill lesson's criteria | must | | `references/teaching-sequence-skill-based.md` · L138 | duplicate of I02 | STAYS |
| VOC-I05 | «what a word the lesson's own vocabulary slide coined for something visible stands for» | the reviewer's fresh-example read | check | | `agents/design-reviewer.md` · L210 | duplicate of I02 | STAYS |
| VOC-I06 | «uses `{term}` from this lesson's vocabulary; » | the review view's cue on a criteria step | code | test pins it | `scripts/design-review-packet.py` · L1780 | code | STAYS (code) |
| VOC-I07 | «A taught word is used normally; an untaught planning word is translated into what the child does.» | every pupil prompt | must | | `references/teacher-voice.md` › 6 › The planning nouns stay in the plan · L484. Copy: I08 | shared (planning nouns) | STAYS |
| VOC-I08 | «A term the lesson taught (`halfway`, `interval`, `exchange`) is used normally.» | maths worksheet wording | must | | `references/subject-maths.md` · L102 | duplicate of I07 | STAYS |
| VOC-I09 | «And a name invented during planning (`the balance rule`, `the nutrient-job table`) never reaches the child: the page says `the table above`, because the child has met the thing, not its working title.» | every printed child-facing page | must | | `references/preferences.md` › Written Voice › Core rules · L61 | shared (planning names); pairs with I02 and I07 | STAYS |
| VOC-I10 | «A word the lesson itself taught is not this fault: `continuity` on a sheet whose class was taught the word is the lesson's own language.» | worksheet wording | must | | `agents/worksheet-designer.md` · L56 | duplicate of I07 for the worksheet designer | STAYS |

## J. Keeping subject vocabulary in every string (shared with the voice topic)

Written about fifteen times. Listed so nothing is lost; the voice topic
folds it.

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-J01 | «**Explain rather than merely simplify.** Keep correct subject vocabulary when the lesson teaches or genuinely needs it. Use a clear bridge when a word or idea is unfamiliar: `which means...`, `for example...`, `it's like when...`, a concrete comparison, a picture, or a brief parenthetical explanation may all help. Do not use the same bridge mechanically every time.» «Necessary precise vocabulary is better than an easier but vaguer substitute.» | every string | must | | `references/preferences.md` › Written Voice › Core rules · L53. Copies: J02 to J13 | rule | STAYS (voice) |
| VOC-J02 | «Do not replace precise, familiar curriculum vocabulary simply to sound simpler.» «if `partition` is the expected mathematical language.» | every string | must | | `references/teacher-voice.md` › 5 › Use useful subject vocabulary · L300 | duplicate of J01 | STAYS |
| VOC-J03 | «This is not a ban on sophisticated vocabulary. Use precise subject language where it earns its place.» | | | | `references/teacher-voice.md` › 5 › Adjust language to conceptual difficulty · L322 | duplicate of J01 | STAYS |
| VOC-J04 | «- useful subject vocabulary;» | model answers | | | `references/teacher-voice.md` › 8. Model answers · L564 | duplicate of J01 | STAYS |
| VOC-J05 | «Human-sounding does **not** mean dumbing down the vocabulary.» | model answers | | | `references/teacher-voice.md` › 8. Model answers · L589 | duplicate of J01 | STAYS |
| VOC-J06 | «- formal vocabulary merely to sound academic;» | things to avoid | must not | | `references/teacher-voice.md` › 15. Things to avoid · L817 | rule (the other side: do not inflate) | STAYS |
| VOC-J07 | «- subject vocabulary is not artificially simplified;» | a calibrated example's note | | | `references/teacher-voice.md` › 16 D. Model answer · L884 | duplicate of J01 | STAYS |
| VOC-J08 | «4. **Have I kept useful subject vocabulary where it helps?**» | the pre-flight check | check | | `references/teacher-voice.md` › 17. Final pre-flight check · L964 | duplicate of J01 | STAYS |
| VOC-J09 | «Precise subject vocab when helps.» | speaker notes | default | | `agents/lesson-designer.md` › Speaker Notes Voice · L90 | duplicate of J01 | STAYS |
| VOC-J10 | «Necessary taught subject vocabulary stays.» | speaker notes | must | | `references/preferences.md` › Speaker notes hand-off · L635 | duplicate of J01, but a must for speaker notes where J09 is a default | STAYS |
| VOC-J11 | «A useful anchor phrase, taught definition or stable wording may repeat across the lesson and resources. Do not rephrase merely to sound stylistically varied.» | every resource | may repeat; must not rephrase for variety | | `references/preferences.md` › Written Voice › Core rules · L67 | shared (voice) | STAYS |
| VOC-J12 | «Subject terms and clear instructions remain valid: do not ban words merely because they can occur in planning.» | the reviewer's voice sweep | must | | `agents/design-reviewer.md` · L130 | a different rule: it stops the reviewer's planning-noun sweep from over-policing subject words | STAYS |
| VOC-J13 | «Keep the thinking demand, the answer protection and the subject vocabulary the correction had.» | the repair-only reviewer role | must | | `agents/design-reviewer-focused-repair.md` · L36 | duplicate of J01 | STAYS |
| VOC-J14 | «KS1 normally needs more familiar vocabulary, more concrete meaning and stronger reading-access support. KS2 can carry richer vocabulary and more complex thought.» | by key stage | default | | `references/teacher-voice.md` › How to read this file · L24. Copy: J15 | rule | STAYS |
| VOC-J15 | «The voice stays the same across the primary years; what flexes with age is vocabulary, concreteness and reading-access support, and neither phase has a sentence-length target.» | by key stage | | | `references/preferences.md` › Written Voice › Core rules · L81 | duplicate of J14 | STAYS |
| VOC-J16 | «Use standard classroom names: success criteria, vocabulary, starter, reference table, steps.» | naming components | must | | `agents/lesson-designer.md` › Name Things Plainly · L66 | shared (naming) | STAYS |
| VOC-J17 | «When the underlying idea is abstract or difficult, lighter language can reduce unnecessary cognitive load.» | a hard idea | may | | `references/teacher-voice.md` › 5 › Adjust language to conceptual difficulty · L312 | rule (J03 is its limit; keep them together) | TV |
| VOC-J18 | «- Have I made the vocabulary unnecessarily casual just to sound human?» | model answers | check | | `references/teacher-voice.md` › 8. Model answers · L587 | duplicate of J01 (pairs with J05) | STAYS |
| VOC-J19 | «- do not use teacher-facing terminology pupils may not understand;» | comparison prompts | must not | | `references/teacher-voice.md` › 12. Comparison and critique prompts · L731 | shared (voice); pairs with I07 | STAYS |

## K. Continuity from the last lesson (shared with the continuity topic)

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-K01 | «Earlier lessons tell you what children already hold, so continuity is real rather than assumed - reuse their success criteria, sticky knowledge, vocabulary and representation verbatim where this lesson continues them.» | today continues an earlier lesson | must | | `agents/lesson-designer.md` › Before You Design Anything · L123. Copies: K02, K03 | shared (continuity); written three times in one section | STAYS |
| VOC-K02 | «**Continuity:** Brief says continues prior → reuse prior SC, sticky, vocab, rep verbatim - no paraphrase. If brief signals change, audit together.» | as K01 | must | | `agents/lesson-designer.md` › Before You Design Anything · L126 | duplicate of K01, plus: if the brief signals a change, audit together | STAYS |
| VOC-K03 | «Where today continues it, reuse its `criteria.steps`, vocabulary definitions, sticky knowledge and representation word for word, because a reworded step reads to a child as a new rule.» | as K01 | must | `PREVIOUS_LESSON_DIR` | `agents/lesson-designer.md` › Before You Design Anything · L127 | duplicate of K01 (the fullest) | STAYS |
| VOC-K04 | «The terms are the lesson's vocabulary cards (and a prior lesson's term the design says children already hold), not every subject noun on the slide» | vocabulary green | must | | `references/teacher-slide-visual-profile.md` › Semantic colour · L114 | rule (green also covers an earlier lesson's words) | STAYS (slides) |

## L. What the design reviewer checks

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-L01 | «- necessary subject vocabulary is taught and supported;» | every review | check | | `agents/design-reviewer.md` · L230 | rule | STAYS (reviewer) |
| VOC-L02 | «- vocabulary definitions are useful to children, and describe the same concept the teaching uses and the success criteria assess;» | every review | check | | `agents/design-reviewer.md` · L231 | duplicate of C22 | STAYS |
| VOC-L03 | «- vocabulary definitions and later use;» | the consistency sweep | check | | `agents/design-reviewer.md` › Cross-section consistency · L304 | duplicate of L02 and G01 | STAYS |
| VOC-L04 | «- `trimmedVocabulary` against the lesson: a distinction the design records as deliberately deferred must not be taught, defined or policed anywhere in it» | the consistency sweep | must | `trimmedVocabulary`; test pins it | `agents/design-reviewer.md` › Cross-section consistency · L314 (only copy) | rule | STAYS |
| VOC-L05 | «Read when vocabulary selection, definition, quantity or placement » | the reviewer's routing card | must (read) | heading `Vocabulary` | `scripts/design-review-packet.py` · L152 | code | STAYS (code) |
| VOC-L06 | «Walk the `As the class meets it` section of the review view in order - every script, explanation, definition, question, task instruction, success criterion, sticky fact, model answer and worksheet string it prints» | the voice sweep | must | | `agents/design-reviewer.md` · L130 | shared (voice sweep) | STAYS |
| VOC-L07 | «a `script` that has to keep its `Say to children:` opening, a definition that has to stay inside its shape» | a repair | | | `agents/design-reviewer.md` · L388 | stale: no program checks a definition's shape | correct (decision 13) |
| VOC-L08 | «the `Say to children:` opening a script keeps, the shape a definition stays inside.» | a repair | | | `agents/design-reviewer-focused-repair.md` · L34 | stale (same) | correct (decision 13) |

## M. The subject files

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-M01 | «The general rule holds: the words that earn a card are the ones children reason *with*. In geography those are the ones that let a child describe or explain any place, not only today's: climate, vegetation, relief, settlement, erosion, trade, sustainable. Proper nouns and named features (Manaus, Tropic of Capricorn, the Amazon) are content the lesson teaches and children need, but they belong in the teaching rather than on vocabulary cards, because knowing them makes a child knowledgeable about one place rather than a stronger geographical thinker.» | geography | must | | `references/subject-geography.md` › Vocabulary in geography · L114 | rule | SUBJ |
| VOC-M02 | «The exception is a named line or zone that functions as a reasoning tool: *Equator* and *the Tropics* earn cards, because a child uses them to explain climate anywhere on Earth, not only in Brazil.» | geography | may | | `references/subject-geography.md` › Vocabulary in geography · L116 | rule (exception) | SUBJ |
| VOC-M03 | «**Where a word already has an everyday meaning, the card has to name that meaning and separate it from the geographical one.**» «Say the everyday one out loud, then say what geographers mean, because the quiet version where the child assumes they already know the word is the one that survives the lesson.» | geography only, as written | must | | `references/subject-geography.md` › Vocabulary in geography · L118 | rule (reads as general; only here) | SUBJ |
| VOC-M04 | «Expect the word back in speech before expecting it in writing. A child who has used a word in an answer aloud will use it on the page; a child who has only seen it displayed will not.» | geography only, as written | default | | `references/subject-geography.md` › Vocabulary in geography · L120 | rule (reads as general; only here) | SUBJ |
| VOC-M05 | «The general rule holds: the words that earn a card are the ones children reason *with*. In history those are the abstract ones the National Curriculum names as an aim, empire, civilisation, parliament, peasantry, monarchy, invasion, settlement, and they are what let a child say something about a period they have not met yet.» | history | must | | `references/subject-history.md` › Vocabulary in history · L187 | rule; decision 3 | SUBJ |
| VOC-M06 | «Named people, places and events are content the lesson teaches and children need, but they belong in the teaching rather than on cards, because knowing them makes a child knowledgeable about one period rather than a stronger historical thinker. In the teaching means explained where each first appears on the board, in a clause a child can hold (`Queen Elizabeth I, who ruled England in Tudor times`, `the River Thames, which runs through London`), unless an earlier lesson the brief names taught it. A name nothing explains is a word the class cannot use, and the limit on vocabulary cards is no reason to leave it unexplained.» | history, as written; the reviewer checks names in every subject (H07), and no other subject file tells the designer to explain a name where it first appears | must | | `references/subject-history.md` › Vocabulary in history · L189 | rule; shared (assumed knowledge); added in 4.2.283 | SUBJ |
| VOC-M07 | «The finding worth carrying is that these words cannot be taught as a definition. Children have studied a whole empire topic and been unable to say what the word means. A word like this needs meeting in three different contexts across the year before a child can reason with it, so where the lesson uses one, it is used and applied rather than defined and displayed.» | history's abstract words | must | | `references/subject-history.md` › Vocabulary in history · L191 | rule; decision 3 | SUBJ |
| VOC-M08 | «put the memorial fountain in Piccadilly Circus on a vocabulary card, where the one piece of ascribed significance in the lesson was spent as a hook.» | significance lessons | | | `references/subject-history.md` › What children do when it is really history · L62 | story (in the log at L2212, without the location); shared (significance) | LOG (already there) when the significance topic is folded |
| VOC-M09 | «The general rule holds: the words that earn a card are the ones children reason with. In maths those are the words a child uses to explain their method and their thinking: exchange, partition, difference, regroup, factor. Topic labels a child never reasons with do not earn a card.» | maths | must | | `references/subject-maths.md` › Vocabulary in maths · L164 | rule | SUBJ |
| VOC-M10 | «Why it matters here specifically: the strongest children can often just do it and cannot explain why. The vocabulary is what lets them explain, so the card is doing its job when a child who got every question right uses its word to say what they did and why it works.» | maths | | | `references/subject-maths.md` › Vocabulary in maths · L166 | rule (its reason) | SUBJ |
| VOC-M11 | «The Lesson Designer stops this pass here and resumes at `## Vocabulary in maths`. The Greater Depth section is for the Adaptation Designer.» | reading the maths file | mechanics | heading `## Vocabulary in maths` (tests pin it) | `references/subject-maths.md` · L140 | pointer | STAYS |
| VOC-M12 | «A formal notation, technical term or enquiry method from a later stage is not a helpful extension when it competes with the new scientific idea. Add it only when the approved objective, supplied sequence or curriculum for this lesson requires it.» | science; exception: the objective, supplied sequence or curriculum requires it | must | | `references/subject-science.md` · L17 | rule | SUBJ |
| VOC-M13 | «The boundary also governs how deep a definition reaches. Define a term at the level today's objective actually uses, and where the objective does not need a term defined at all, do not define it: a lesson naming appliances needs `an electrical appliance uses electricity to do a job`, not an account of what electricity is. When electricity itself must be explained, say what it does - `electricity provides the energy appliances need to work` - and never define it as `a form of energy`.» | science definitions | must | | `references/subject-science.md` · L21 | rule; shares its example with C11 | SUBJ |
| VOC-M14 | «Define belief for children as something a person accepts as true; building certainty or proof into the definition (`sure it is true even when nobody can prove it`) teaches a caricature and makes the word harder to use.» | RE | must | | `references/subject-re.md` · L25 | rule | SUBJ |
| VOC-M15 | «The words that earn a vocabulary card are the ones children think *with*, not the ones today's topic contains. The general rule already says that; what this adds is which words those are in this subject, because a designer reading the general rule will let a proper noun through. Then name the exception, because there is always one.» | writing a new subject file | | | `skills/make-subject-file/SKILL.md` · L203 | maintainer (lesson agents never read it) | STAYS |

## N. The vocabulary slide

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-N01 | «- `preferences.md` A Picture Beside a Word and Vocabulary before composing a vocabulary or semantic word-picture slide.» | the slide designer | must (read) | headings | `agents/slide-designer.md` · L51 | pointer | STAYS |
| VOC-N02 | «The design's `vocabularyIntroductions` says when each word is introduced: one `key-vocabulary` slide per entry, carrying that entry's words, placed after the last slide of the unit the entry names. Two entries on one unit keep the design's order.» «The timing is a teaching decision already made, so do not merge two entries onto one slide or split one entry across two.» | the slide designer | must | `key-vocabulary`; test pins "one `key-vocabulary` slide per entry" | `agents/slide-designer.md` › 7. Keep vocabulary coherent · L267. Copy: N03 | rule | SD (one of N02 or N03) |
| VOC-N03 | «Vocabulary is presented on `key-vocabulary` slides, one per introduction the design planned in `vocabularyIntroductions`. Each slide carries that introduction's words with their definitions and visuals, and sits straight after the last slide of the unit its entry names. Two entries anchored to the same unit follow in the order the design lists them.» «The design owns the timing: do not merge its groups into one slide to tidy the deck, and do not split a group because the words look separable.» | the slide designer | must | | `references/slide-composition-playbook.md` › Vocabulary · L344 | duplicate of N02 | SD |
| VOC-N04 | «A saved design that carries `vocabularyPlacement` instead means every word in one slide: after the starter when the field is null or absent, after the named unit otherwise.» | old saved designs | mechanics | `vocabularyPlacement` | `agents/slide-designer.md` › 7. Keep vocabulary coherent · L269 | mechanics (legacy) | SD |
| VOC-N05 | «When a unit contains vocabulary, read the named preference sections before composing it. Use the exact structured visual selected upstream. Keep one coherent card or comparison per genuine conceptual unit. A text-only card is complete when `kind: none` or when no honest semantic visual exists.» | the slide designer | must | | `agents/slide-designer.md` › 7. Keep vocabulary coherent · L271. Copy: N06 | rule | SD |
| VOC-N06 | «Use the exact structured visual selected upstream. Keep one coherent card or comparison per genuine conceptual unit. A text-only card is complete when `kind: none` or no honest semantic visual exists. Do not add P3 merely because a vocabulary card is text-only.» | the slide designer | must | | `references/slide-composition-playbook.md` › Vocabulary · L342 | duplicate of N05 (the P3 clause is only here) | SD |
| VOC-N07 | «When two vocabulary words are taught as a contrast on `teach-compare`, set `headingRole: "vocabulary"` so both headwords take vocabulary green rather than the template's category palette — they are equals being defined, not competing categories.» | two contrasting taught words | must | `teach-compare`, `headingRole: "vocabulary"` | `references/slide-composition-playbook.md` › Vocabulary · L348. Copy: N08 | rule | SD |
| VOC-N08 | «When the two headings are taught vocabulary rather than opposing categories — `complete` / `incomplete`, `translucent` / `opaque` — set `headingRole: "vocabulary"`.» | as N07 | must | as N07 | `references/templates.md` › teach-compare · L300 | duplicate of N07 (catalogue) | STAYS (catalogue) |
| VOC-N09 | «Never polish, shorten, simplify or paraphrase a supplied question, example, claim, sentence stem, success criterion, sticky fact, vocabulary definition, visible standard or representation label.» | the slide designer | must | | `references/slide-composition-playbook.md` · L49. Copy: N10 | shared (copy wording exactly) | STAYS |
| VOC-N10 | «- vocabulary definitions;» | the list of wording the slide designer copies exactly | must | | `agents/slide-designer.md` · L157 | duplicate of N09 | STAYS |
| VOC-N11 | «- vocabulary moments;» | reading the lesson as a sequence | | | `agents/slide-designer.md` › 1. Read the lesson as a sequence · L125 | pointer | STAYS |
| VOC-N12 | «When a fixed template is tuned for that exact move, use it. Do not rebuild a maths My Turn, vocabulary reveal, success-criteria reference or two-card comparison from generic splits merely to be different.» | the slide designer | must | `key-vocabulary` | `references/slide-composition-playbook.md` · L39 | rule | STAYS |
| VOC-N13 | «**Purpose:** Vocabulary reveal. 2–5 words on light-green cards, each with an optional compact visual. Card heights and font sizes scale with the word count.» | the vocabulary template | | `key-vocabulary` | `references/templates.md` › key-vocabulary · L383 | stale: the builder draws one word as readily as five, and the design rules make one word a normal introduction | correct (decision 13) |
| VOC-N14 | «A card never drops a picture it can draw. When two or more words on one slide each carry a full-width picture and together they cannot be read, the build stops with `VOCAB_PICTURES_TOO_BIG_FOR_ONE_SLIDE` naming them: give one a smaller picture.» | every card | must (code) | `VOCAB_PICTURES_TOO_BIG_FOR_ONE_SLIDE`, `STACKED_VISUALS` | `references/templates.md` › key-vocabulary · L387 | rule; carries your 13 September ruling ("they shouldnt refuse anything") | STAYS |
| VOC-N15 | «Give it vocabulary-sized content: a picture of the word, not the task» | a card's picture | must | | `references/templates.md` › key-vocabulary · L387 | rule | STAYS |
| VOC-N16 | «Use the full `place-value-chart` on teaching and practice slides, not inside a vocabulary card.» | a maths card | must | `place-value-mini` | `references/templates.md` › key-vocabulary · L399 | rule | STAYS |
| VOC-N17 | «A vocabulary surface is `template: "key-vocabulary"` or any slide containing a `type: "vocab"` object; P3 is forbidden there.» | decorations | must not (the code drops decorations there with a warning; it does not refuse the slide) | `decorations` | `references/templates.md` · L12. Copy: N06, Q03 | rule | STAYS |
| VOC-N18 | «A term this lesson teaches is vocabulary green every time a child reads it, on every slide, not only on its card: the colour is what tells a child that the word in the question is the word they were taught. That covers the lesson's own vocabulary words, not every subject noun» | every slide | must | | `references/preferences.md` › Slide Designer presentation rules · L575. Copies: N19, N22 to N24 | rule (points to N19 for the detail) | STAYS |
| VOC-N19 | «- Vocabulary green marks this lesson's taught terms wherever a child reads them: in task text, teaching sentences, sticky knowledge, success criteria and captions alike, every occurrence, so the word looks the same on slide 12 as it did on its vocabulary card and a child recognises it as the word they were taught. Mark each occurrence with the `vocabulary` emphasis role.» «Success criteria arrive with the taught word already marked as `{{word}}` in the lesson designer's own wording» «Answer reveals keep their own green, so a taught term inside a revealed answer is not marked twice.» | every slide; exceptions: a revealed answer keeps answer green, and in success criteria the picture's colour wins and only one or two parts are marked (N29) | must | `vocabulary` emphasis role | `references/teacher-slide-visual-profile.md` › Semantic colour · L114 | rule (the owner, as N18 says) | STAYS |
| VOC-N20 | «Vocabulary green marks every occurrence of a taught term wherever a child reads it, so the term wins and the line loses: choose a different line for the orange, and if every line carries a term, leave them all black and let layout do it.» | the one orange line | must (code) | "orange cannot go on a line carrying a taught word" | `references/teacher-slide-visual-profile.md` · L118 | rule, with a dated story (12 September, `Oxygen`) | STAYS |
| VOC-N21 | «mark a span inside a sticky line only when that span really is a taught term of its own.» | a sticky line | must | | `references/teacher-slide-visual-profile.md` · L110 | rule | STAYS |
| VOC-N22 | «- green remains reserved for revealed answers and vocabulary headwords according to the existing contract.» | colour | must | | `references/slide-composition-playbook.md` · L147 | duplicate of N18, narrower ("headwords", where N19 says every occurrence); the owner wins | STAYS, wording to match N19 |
| VOC-N23 | «Wording that genuinely is a question to children, a safety warning, a failed state, a taught vocabulary term or the action verbs of a multi-phase task carries its role wherever it appears» | colour | must | | `references/slide-composition-playbook.md` · L408 | duplicate of N19 | STAYS |
| VOC-N24 | «Green is rejected as a category because it is reserved for answers and vocabulary.» | category colours | must (code) | `categoryColor` | `references/templates.md` · L298 | a separate rule, not a duplicate: it bans green as a category colour, and the code refuses it | STAYS |
| VOC-N25 | «- `{{interval}}` for this lesson's taught word, in vocabulary green, the same word the child met on its vocabulary card.» | success criteria | must | `{{...}}` mark (code) | `references/preferences.md` › Success Criteria · L432 | shared (success criteria) | STAYS |
| VOC-N26 | «When a check asks children to *produce or name* something (write the column that changes, name the shape family), the words they answer with have to be somewhere on screen, or the task tests recall of the vocabulary rather than the thing being checked.» | a quick-check slide | must | `split-h-75-25`, `chip-bank` | `references/templates.md` · L1142 | rule; related to G06 but a different purpose (not a contradiction) | STAYS |
| VOC-N27 | «a picture in a vocabulary card or a template's `supports` row is supporting by definition and keeps the 1.6″ base» | picture sizing | mechanics (code) | `PICTURE_BELOW_READABLE_FLOOR` | `references/slide-visual-sizing.md` · L138 | mechanics | STAYS |
| VOC-N28 | «Add `headingRole: "vocabulary"` when the two headings are taught words.» | the `compare-words` and `compare-pictures` layouts | must | `headingRole: "vocabulary"` | `references/templates.md` · L257 | rule (N07 and N08 cover only `teach-compare`) | STAYS |
| VOC-N29 | «When one word could take two colours, the picture wins, then the taught word. Mark the words doing that work and leave the rest black: usually one or two parts of a step, and a step with nothing to pick out stays plain, because a step with every noun coloured has nothing standing out.» | success criteria | must | `((...))`, `{{...}}`, `<<...>>` | `references/preferences.md` › Success Criteria · L435 | shared (success criteria); pulls against N19's every occurrence (listed below, for the slide topic) | STAYS |
| VOC-N30 | «`{ "word": "convert", "definition": "..." }` — no visual needed, cell stays empty» | the slide catalogue's last card example | | | `references/templates.md` › key-vocabulary · L404 | example; decision 2 (shows a card with no picture as ordinary, where D03 calls it the rare exception) | STAYS (fix with decision 2) |

## O. The working wall

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-O01 | «Read the introduction and contents page, then your sections: Vocabulary, A Picture Beside a Word, Sticky Knowledge, and Success Criteria» | the wall designer | must (read) | headings | `agents/working-wall-designer.md` · L44 | pointer | STAYS |
| VOC-O02 | «- **Sticky knowledge**, **sentence stems** and **key vocabulary** with any visual needed for its learning.» | what may earn wall space | may | | `agents/working-wall-designer.md` · L199 | rule | STAYS |
| VOC-O03 | «- Vocabulary the lesson uses once and won't return to → no vocab definition card» | wall | must not | `vocabDefinition` | `agents/working-wall-designer.md` · L308 | rule; repeats O08 | WALL |
| VOC-O04 | «- A handful of words but fewer than 4, or vocabulary so abstract every word needs its own definition → no vocab chips card» | wall | must not | `vocabChips` | `agents/working-wall-designer.md` · L309 | rule; repeats O10 | WALL |
| VOC-O05 | «- **Vocab definition** — always 1 (one term, one card). Two terms = two cards.» | wall | must | `vocabDefinition` | `agents/working-wall-designer.md` · L371 | rule | WALL |
| VOC-O06 | «- **Vocab chips** — 4–12 chips on one card is the whole point.» «The chips are the items; the card is one teaching sheet regardless of chip count.» | wall | must (12 by code) | `vocabChips` | `agents/working-wall-designer.md` · L372 | rule | WALL |
| VOC-O07 | «Free-standing prose that no child is matching word for word — a worked-example modelled sentence, a sticky-knowledge statement, a vocabulary definition, a sentence stem's framing — may be tightened to come inside the card's budget, keeping the same meaning, the same characters, the same operation or setting, and every protection the sentence carries.» | a wall card over its budget | may | | `agents/working-wall-designer.md` · L134. Copy: O16 | rule, with its reason; decision 9 (against C01 and C10) | WALL |
| VOC-O08 | «**Wall-worthy criteria, all of which must pass:** Lesson teaches a piece of mathematical or subject-specific vocabulary children will use across the unit; The term has a child-language definition and a drawn example you can express with one of the supported visual primitives; Children will need to look it up again later (not a one-lesson word)» | a definition card | must | `vocabDefinition` | `references/working-wall-card-contracts.md` › vocabDefinition · L381 | rule | WALL |
| VOC-O09 | «For `vocabDefinition`, the title IS the term being defined (e.g. "Acute angle", "Denominator").» | a definition card | mechanics | | `references/working-wall-card-contracts.md` · L37 | mechanics | WALL |
| VOC-O10 | «**Wall-worthy criteria, all of which must pass:** Lesson introduces a *set* of 4+ related vocabulary words children will use across the unit (money words, body parts, weather words, science apparatus); Each word is concrete enough children can use it without a definition (already half-known, or meaning obvious in context); The words don't each warrant their own `vocabDefinition` card — central tier-3 concepts go on definition cards instead;» | a chip card | must | `vocabChips` | `references/working-wall-card-contracts.md` › vocabChips · L393. Copy: O14 | rule | WALL |
| VOC-O11 | «Used by `vocabDefinition` only. One concise child-readable definition. It may use more than one short sentence when forcing it into one would damage accuracy.» «The visual is what shows what the term looks like; the definition is what it means.» | a definition card | may | `cards[].definition` | `references/working-wall-card-contracts.md` · L387. Copy: O15 | mechanics | WALL |
| VOC-O12 | «**When chips, when definition cards.** The two card types are designed to coexist; the question is which work the lesson is doing.» | wall | | | `references/working-wall-preferences.md` › Vocab chip cards · L158 | rule | WALL |
| VOC-O13 | «**Chip count.** Aim for 6–8 chips when the lesson genuinely teaches that many vocabulary words; 4 is the floor (below that the card feels empty and the teacher would be better hand-writing a single sticky note) and 12 is the ceiling: the builder refuses a card carrying more, because the grid would run off the bottom of the page and the extra chips would be cut off.» «When the unit's full vocabulary list runs longer than 12 words, split into two chip cards (`Money words` + `Money actions`, for example) rather than cramming.» | a chip card | must (12 refused by the build; the floor of 4 is prose only) | builder refuses more than 12 | `references/working-wall-preferences.md` › Vocab chip cards · L165 | rule | WALL |
| VOC-O14 | «**Wall-worthy criteria, applied honestly.** A `vocabChips` card earns a place when the lesson introduces 4+ concrete vocabulary words children will use across the unit *and* those words don't each warrant their own `vocabDefinition` card.» «If the lesson uses two new words in passing, the card is too thin to print — skip it and let the words live on the slides.» | a chip card | must | | `references/working-wall-preferences.md` › Vocab chip cards · L173 | duplicate of O10, plus when to skip the card | WALL |
| VOC-O15 | «A vocabulary definition may use more than one short sentence when forcing it into one would damage accuracy; it must still remain readable at a glance.» | a definition card | may | | `references/working-wall-preferences.md` · L81 | duplicate of O11, plus: it must still read at a glance | WALL |
| VOC-O16 | «Free-standing prose nobody is matching word for word — a modelled sentence, a sticky-knowledge fact, a vocabulary definition — may be tightened to fit the card, keeping the meaning and every protection it carries.» | a wall card over its budget | may | | `references/working-wall-preferences.md` · L98 | duplicate of O07 but weaker: it lacks "the same characters, the same operation or setting"; keep O07's words | WALL |
| VOC-O17 | «**2. Concrete.** Use the language children use. Name the technical term where the lesson teaches it, but anchor it in plain words.» «- "joining word (conjunction)" not "conjunction" alone — until they know the word» | wall wording | must | | `references/working-wall-preferences.md` · L74 | rule | WALL |
| VOC-O18 | «Pair an image with a chip when the image makes the meaning obvious at a glance» «Skip the image when the word is abstract (`amount`, `change`, `spend`) and a stock image would feel forced; an unpaired chip is fine.» «Don't pair every chip — a mixed grid (some with pictures, some plain) reads as a real vocabulary card; a wall of stock photos reads as clip-art.» | chip pictures | must not | | `references/working-wall-preferences.md` › Vocab chip cards · L171 | rule | WALL |
| VOC-O19 | «On Working Wall it must resolve successfully or the `vocabDefinition` card is removed.» | a drawing on a wall definition card | must | Educational SVG | `agents/working-wall-designer.md` · L116. Copies: O20, Q02 | rule | WALL |
| VOC-O20 | «- for semantic-vocabulary P2 (`vocabDefinition.visual` with `type: "image"` and `kind: "educational-svg"`), remove the `vocabDefinition` card;» | as O19 | must | | `agents/working-wall-designer.md` · L271 | duplicate of O19 | WALL |
| VOC-O21 | «The same drawing the slides' vocabulary cards use, so a `vocabDefinition` card shows the picture of the word the class saw.» | a maths definition card | must | `place-value-mini` | `references/working-wall-card-contracts.md` · L835 | rule | WALL |
| VOC-O22 | «`vocabDefinition` and `vocabChips` share a single visual identity.» | wall look | mechanics | | `references/working-wall-visual-language.md` · L200 | mechanics (the teal family, also at L191, L192) | WALL |
| VOC-O23 | «A chip card counts as **one teaching sheet** against the one-sheet default and two-sheet hard cap, regardless of how many chips sit on it. Do not add it on top of an overview unless it performs the exceptional second sheet's distinct, durable job.» | a chip card | must (the build refuses more than two teaching cards) | | `references/working-wall-preferences.md` › Vocab chip cards · L175 | rule; pulls against O26 (listed below, for the wall topic) | WALL |
| VOC-O24 | «- Reach for `vocabChips` when the lesson introduces a *set* of related words children will use across the unit — money words (`amount`, `cost`, `change`, `spend`, `ten pence`, `pound`), body parts, weather words, the names of the apparatus on a science table.» | choosing a chip card | default | `vocabChips` | `references/working-wall-preferences.md` › Vocab chip cards · L160 | rule | WALL |
| VOC-O25 | «- Reach for `vocabDefinition` when the lesson teaches a specific tier-3 word as a concept — `denominator`, `isosceles`, `metaphor`, `evaporation`. One word, big, with a child-language definition and a drawn primitive.» | choosing a definition card | default | `vocabDefinition` | `references/working-wall-preferences.md` › Vocab chip cards · L161 | rule | WALL |
| VOC-O26 | «Both can live on the same wall under the same `Vocabulary` heading: one or two definition cards for the lesson's central terms, plus a chip card carrying the broader vocabulary the children will use around them.» | the wall | may | | `references/working-wall-preferences.md` › Vocab chip cards · L163 | rule; pulls against O23 and the build's two-card limit (listed below) | WALL |
| VOC-O27 | «**Chip wording.** Single words or short noun-phrases - `pound`, `ten pence`, `change` - not full sentences. Keep each chip to roughly 12 characters or 2 words.» | chip words | default | | `references/working-wall-preferences.md` › Vocab chip cards · L167 | rule | WALL |
| VOC-O28 | «**Title.** A short noun naming the *set* of words on the card — `Money words`, `Body parts`, `Weather`, `Science kit`. Keep it ≤ 5 words.» | a chip card's title | default | | `references/working-wall-preferences.md` › Vocab chip cards · L169 | rule | WALL |
| VOC-O29 | «It is forbidden on vocabulary/furniture/special families.» | decorations on wall cards | must | | `agents/working-wall-designer.md` · L122 | rule (the wall's copy of N17) | WALL |
| VOC-O30 | «Designer/build handoff error. Report it; do not render the card text-only.» | a drawing on a wall definition card | must (code) | `VOCAB_EDUCATIONAL_SVG_MISSING`, `VOCAB_EDUCATIONAL_SVG_UNREADABLE` | `agents/working-wall-builder.md` · L55 | the builder's side of O19 (L110 says the same: a missing drawing there is a build failure) | STAYS |

## P. Below and Greater Depth

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-P01 | «Keep central subject vocabulary and proper nouns, supporting them with examples, visuals or plain-language bridges rather than automatically replacing them.» | Below resources | must | | `references/preferences.md` › Written Voice › Core rules · L83. Copies: P02 to P05 | rule; P04 is the fullest copy | STAYS (Written Voice) or ADAPT, keeping P04's words |
| VOC-P02 | «Keep essential subject vocabulary and proper nouns, supporting them with examples, visuals or plain-language bridges rather than automatically replacing them.» | Below resources | must | | `agents/adaptation-designer.md` · L192 | duplicate of P01 | ADAPT |
| VOC-P03 | «Keep necessary subject vocabulary and use accessible support around it.» | Below resources | must | | `references/adaptive-adaptation.md` · L180 | duplicate of P01 | ADAPT |
| VOC-P04 | «Keep essential subject vocabulary and proper nouns when the learning requires them, supporting difficult necessary words through a clear picture, labelled word bank, pronunciation cue or previously taught meaning rather than replacing them with vague alternatives.» | Below resources | must | | `references/adaptive-adaptation.md` · L182 | the fullest copy of P01: adds "when the learning requires them" and names the supports | ADAPT |
| VOC-P05 | «retain necessary subject vocabulary with specified support.» | Below resources | must | | `agents/adaptation-designer.md` · L319 | duplicate of P01, plus: the support must be named | ADAPT |
| VOC-P06 | «Reduce unnecessary reading load, descriptive padding and avoidable vocabulary.» | Below resources | default | | `references/preferences.md` › Written Voice › Core rules · L83 (also adaptation-designer L192, adaptive-adaptation L180) | rule | STAYS |
| VOC-P07 | «Below follows the selected tier and uses class visual or vocabulary language only where it is useful and accessible.» | Below resources | must | | `agents/adaptation-designer.md` · L69 | rule; the same point is made at adaptation-designer L28, L52, L175, L315, L355, L369 and adaptive-adaptation L127, L158, L160, L247 | ADAPT (fold within adaptation) |
| VOC-P08 | «The same method, the same representation, the same vocabulary, the same context» | a Below sheet that does not climb | | | `agents/adaptation-designer.md` · L140 (also adaptive-adaptation L31) | rule | ADAPT |
| VOC-P09 | «Keep or add a representation, vocabulary bank, reference, scaffold or success criterion when it enables the deeper reasoning without supplying its answer.» | Greater Depth | must | | `agents/adaptation-designer.md` · L271 | rule; same point at subject-maths L158 | ADAPT |
| VOC-P10 | «List from the class lesson: every named character with numbers, every vocabulary word and its definition, the success criteria, the visual representation and the Expected worksheet practice.» | the adaptation's consistency check | must | | `agents/adaptation-designer.md` · L365 | rule | ADAPT |
| VOC-P11 | «Below work looks accessible but still relies on unsupported reading, vocabulary or representation.» | reading the adaptation back | check | | `agents/adaptation-designer.md` · L329 | rule (a failure to look for) | ADAPT |
| VOC-P12 | «**Greater Depth normally deepens the thinking rather than the prose.** Keep language accessible unless a richer text, terminology or language demand is itself a legitimate part of the subject thinking. Do not manufacture depth through longer reading or harder wording alone.» | Greater Depth resources | default | | `references/preferences.md` › Written Voice › Core rules · L85 | rule | STAYS (Written Voice) |
| VOC-P13 | «name any essential difficult vocabulary and its support» | recording a Below resource | mechanics | | `agents/adaptation-designer.md` · L459 | recording side of P05 | ADAPT |

## Q. Other downstream

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-Q01 | «These never produce a piece: vocabulary cards, success-criteria panels,» | stick-in sheets | must | | `references/stick-in-sheets-pedagogy.md` · L49 (also stick-in-sheets-designer L42) | rule | STAYS |
| VOC-Q02 | «Semantic vocabulary Educational SVG is meaning-carrying P2. It requires meaningful `alt` and has no `fallbackEmoji`. On slides and worksheets it closes to text-only when unresolved.» | a library drawing on a vocabulary card | must (code: allowed keys) | `educational-svg`, `alt`, no `fallbackEmoji` | `references/context-pictures.md` · L663 (also L215, L815, L877) | mechanics | STAYS |
| VOC-Q03 | «`decorations` array only when the slide is not `key-vocabulary` and contains no» | decorations | must | | `references/context-pictures.md` › Surface-specific limits · L865 | duplicate of N17 | STAYS |
| VOC-Q04 | «**Vocabulary cards: nothing to wire.** The key-vocabulary card draws any content type the dispatcher knows and sizes its panel from the picture's own ink, so a new helper works on a vocabulary card the day it is registered.» | building a new helper | mechanics | `STACKED_VISUALS` | `references/helper-authoring.md` · L183 | mechanics; carries your "refuse nothing" ruling | STAYS |
| VOC-Q05 | «and — where they apply — the pre-render step, row equaliser, and vocabulary-card gate on the slide side;» | editing templates | | | `commands/edit-templates.md` · L185 | stale: there has been no vocabulary-card gate since 4.2.169 (Q04 says nothing to wire) | correct (decision 13) |
| VOC-Q06 | «A definition of the word the question turns on, a sentence starter the answer is written into, a word bank the answer is chosen from, a step list worked *through*: no, and without it there is no answer, so it is part of the question and sits with it, above the writing space rather than under it.» | a definition printed on a worksheet | must | | `agents/worksheet-designer.md` · L161 | rule (the only place a definition's position on a sheet is set) | STAYS |

## Z. Misfiled

| ID | What the agent is told | When it applies, and its exceptions | Strength | Code names | Where | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-Z01 | «**A PREFERENCE, not a rule: an answer slide that looks like its question slide with the answer filled in.**» «So it is available and never automatic. It suits a short set of one-value answers where the reveal is the point; it does not suit a question whose answer is a sentence, a method or an explanation, where an arrow into blank space promises something small. Do not add it to every practice set, and do not add a check for it.» | answer slides for short one-value practice | may | | `references/preferences.md` › Vocabulary · L339 | your ruling (19 September, your words); **not about vocabulary** | moves, decision 11 |

---

## Out-of-date text (decision 13)

| Row | What it says | Why it is out of date |
|---|---|---|
| VOC-C09 | «Add a visual note where it makes the meaning clearer.» | The picture is a structured field now, not a written note. |
| VOC-D08 | «Record visual note alongside definition (real image, diagram, labelled part, emoji).» | Same, and the next paragraph says not to write a prose `visual:`. |
| VOC-N13 | «2–5 words on light-green cards» | The builder draws one word; the design rules make one word a normal introduction. |
| VOC-L07, VOC-L08 | «the shape a definition stays inside» | No program checks a definition's shape; the code checks only that it exists. |
| VOC-Q05 | «vocabulary-card gate on the slide side» | That gate was removed on 13 September; the card refuses nothing. |

## Stories and dated rulings (decision 12)

| Row | Story | In the build log? |
|---|---|---|
| VOC-E06 | Decay, plaque and acid carded together (18 September) | **No**: only here and a code comment (which says "four" beats, not three). The release that added the next-beat check (4.2.234) has no log entry at all. |
| VOC-M08 | The Piccadilly fountain on a vocabulary card | Yes (L2212), without the location |
| VOC-C13 | `round` carded above `multiple` (19 September) | Yes (L661, L3564) |
| VOC-E15, E16 | The teeth deck's incisors card | Yes (4.2.143) |
| VOC-F01, F03 | Two vocabulary slides with empty notes, `belief` and `nativity` | Yes (4.2.140, L2198) |
| VOC-G04 | `working conditions` carded and never said again | Yes (4.2.202) |
| VOC-H03 | The PSHE coordination slide | Yes (L2103) |
| VOC-D05 | `belief`, `celebration`, `tradition` with no pictures | Yes (L3443) |
| VOC-D01 | Your ruling: every card gets a picture (8 September) | Your words; keep |
| VOC-E34 | Your ruling: "if it thinks seperate key vocab do it" (12 September) | Your words; keep |
| VOC-Z01 | Your ruling: the answer-arrow preference (19 September) | Your words; keep |

## Names the code depends on

These are read by programs or tests and do not change without the code:
`vocabulary` (at most 5 items; each exactly `id` `vocab-###`, `sourceUnitId`,
`term`, `definition`, `visual`), `trimmedVocabulary` (`term`, `reason`),
`vocabularyIntroductions` (`vocabularyRefs`, `after`, `script`), the
`Say to children:` opening, the legacy `vocabularyPlacement`, the six visual
kinds, the scaffold counts; the slide template `key-vocabulary`, the `vocab`
content object, `headingRole: "vocabulary"`, the `vocabulary` emphasis role,
the `{{...}}` criteria mark, `STACKED_VISUALS`,
`VOCAB_PICTURES_TOO_BIG_FOR_ONE_SLIDE`; the wall's `vocabDefinition` and
`vocabChips` (12 chips at most); and these headings, named by the reviewer's
routing card or by tests: preferences `## Vocabulary`, `## A Picture Beside a
Word`, `### Lesson Designer visual-need boundary`; teacher-voice `# 5.
Explanations and definitions`; subject-maths `## Vocabulary in maths`.

Also read by code: the slide's `words[]` slots `word`, `definition`,
`visual` (the design's field is `term`), and these headings the wall packet
cuts by exact title: «Vocab chip cards — wording and selection»,
«Wording style — short, concrete, self-contained», and the card contracts'
`### vocabDefinition` and `### vocabChips`.

What the code enforces today: at most five words; each word's fields, and
that a photo or representation picture names something that exists; every
word introduced exactly once, and an introduction names at least one word and
a real anchor; each introduction's script starts `Say to children:`; a carded
word appears in a later teaching beat and in the very next one; a launch model
uses every `{{taught word}}` its criteria mark; on the wall, at most two
teaching cards (a chip card counts) and at most 12 chips.

What it does not enforce, although the text might suggest it: the
introduction checks run only when a design carries `vocabularyIntroductions`
(the scaffold always writes it, so normal runs are covered); "used" counts
only the teaching beats, so a word used only in the starter, the ending or on
the worksheet is refused; any mention in the next beat passes, script alone
included; `{{word}}` in success criteria is never matched against the
vocabulary list; decorations on a vocabulary slide are dropped with a warning,
not refused; and a picture a vocabulary card cannot draw becomes a text-only
card with a warning, not a refusal.

## Rows whose wording a test already pins

Found by matching every phrase-length string in `scripts/tests` against the
quotes. A row here cannot lose that phrase without a test failing; a fold that
moves the phrase moves the test with it. Rows on the designer file's copies
are marked (copy).

A09, A15, A16, A17; C01, C02, C04 (copy), C05 (copy), C10, C11, C15, C16,
C22, C24; D04, D14, D15; E01, E02, E03 (copy), E09 (copy), E11, E13 (copy),
E14, E16 (copy), E18, E19 (copy), E20, E22, E38, E44; F01 (copy), F02, F04;
G01, G06, G07, G10, G12, G13; H01, H02, H03, H07; I02; L02, L04, L06; M06,
M11, M13, M14; N02, N20; O08, O10; P08.

Rows with no pin today include most of the designer file's copies that are not
listed above, and every rule that exists in only one place: A09 is pinned, but
B03, D11, D12, D13, E07, E21, E35 and G04 are not.

## Mentions judged to belong to another topic

Looked at and left out of the rows, because vocabulary is not what they
govern. Each goes with its own topic.

- **Word banks** (worksheets and support): worksheet-designer L95 to L113,
  L566, L943; worksheet-helpers L368 to L369; worksheet-builder L61;
  adaptation-designer L203, L208, L451; adaptive-adaptation L184;
  lesson-designer-components L63; preferences L491, L493, L599, L721,
  L725; teacher-voice L386 to L390; slide-designer L182, L259; playbook L159,
  L296; teacher-slide-visual-profile L53, L84; templates L84, L568, L576,
  L1159, L1517 to L1547; worksheet-helpers catalogue L796, L2190;
  worksheet-helpers/shared L134, L142, L179, L306; lesson-designer L342;
  teaching-sequence-skill-based L89.
- **Starters that retrieve a definition**: preferences L289, L292, L297, L303.
- **The Do-beat catalogue's vocabulary formats** (Frayer, gesture, matching):
  do-beats L62, L68, L75, L78, L94, L112 to L118, L247, L266 to L283, L299,
  L375 to L392, L553; reasoning-prompts L48.
- **Reasoning and discussion words** (not the lesson's vocabulary):
  explanation-tasks L35, L36, L47, L58, L98.
- **Other passing mentions**: preferences L166, L196, L525, L561, L764;
  lesson-designer L128, L370; teaching-sequence-content-based L59;
  teaching-sequence-dialogic L31, L135; output-template L234 (a picture's
  required features); teacher-slide-visual-profile L39; playbook L112, L134;
  templates L20, L35, L329, L644, L660, L697, L1363, L2827;
  working-wall files' `Vocabulary` section heading (working-wall-preferences
  L222, L237; working-wall-visual-language L195, L206, L211, L213);
  subject-pshe L56 (a nutrient's job is not the definition of balance).

## Found in passing

- **The reviewer never hears the vocabulary slide's script.** The review view
  prints each vocabulary slide as its words and definitions only; it never
  prints the teacher's script for that slide, so the reviewer's string by
  string voice check cannot reach it. A code gap, not an instruction: raised,
  not changed.
- **Release 4.2.234** (the check that a card's word is used in the very next
  beat) has no build-log entry.
- `task-contrasts.md` L17 still says a sort is «fine there, named as a
  check». 4.2.283 set out to remove the "name it as a check" excuse
  everywhere, and this copy survived. It belongs to the quick-check topic.
