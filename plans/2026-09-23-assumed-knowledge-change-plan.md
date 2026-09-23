# What children are assumed to already know: the change plan (23 September 2026)

Step 5 of `streamline-plan.md` for topic 2, from Daniel's answers of 23
September (both rounds, recorded in the ledger's "Decisions taken"). One
release, **4.2.287**. Nothing is committed or pushed until he says so.
Baseline: the 4.2.286 suites (`streamline-tools/final-restored-*.log`, all
green) and `streamline-tools/qc-after2-designs.json`.

## Every edit, by decision

1. **The board and the script.** The home is `preferences.md` → Written Voice →
   `Write the slides as if the teacher never opens the notes` (A13): it gains
   his words (the notes are the script for saying that slide, most of the time
   a teacher does not read them, so the board shows the teaching) and loses the
   dated Sophie story (in the log since 4.2.286; the reviewer's plain
   `breathing` example stays). The designer's completion pass (A05) works an
   answer from what children can see, not "spoken preparation". The reviewer's
   A49 loses "without forcing every spoken reason into a panel" and takes C04's
   two directions (on the board if a later beat uses it, out of the lesson if
   nothing does). History's G30 says "on the board". A51/A52 (a script that
   gives an answer away still counts) stay word for word.
2. **A plan's earlier lessons.** The designer's prior-knowledge rule (F01)
   says a plan's earlier lessons are roughly taught by the time this one is,
   and anything today leans on from them gets decision 3's reminder. The plan
   brief's words and the filing code stay.
3. **The reminder.** F01 carries it (a short reminder where it first appears
   today, `Lord Shaftesbury, who we met last week, ...`, never a reteach; a
   method step done at this size stays named and left alone). History's names
   rule (C01, vocabulary-pinned) and the reviewer's name check (K01,
   vocabulary-pinned) say the same; Connect It Back's access line (F34) reads
   "familiar once it has been brought back". Vocabulary pins move with them.
4. **Names in every subject, and his wording principle (with decision 8's
   second round).** One paragraph in `preferences.md` → Slide Philosophy,
   beside `A case arrives with the context that makes it make sense` (B04): a
   named person, place, organisation or event, or a thing the class has never
   met (an order, a steam engine), is explained where it first appears on the
   board, in the sentence that brings it in, not on a card; his Elizabeth I and
   steam-engine words as the example; his random-slide test as the check.
5. **The source test.** Moves word for word from history (D01) into
   `preferences.md` → Source and Scenario Integrity, "new to the period" read
   as "new to the topic"; the designer's pointer (D04) points there; history
   keeps its opening, the pointer and the 1590 example (D02). The test that
   pins the sentence follows it.
6. **Knowledge before judgement, beat by beat.** History's check (E01) becomes
   a paragraph in `preferences.md` → What a Lesson Is For, beside `Work from
   what children can use`, with the ask-first exceptions (a hook, a pattern
   children read, an exploration, a first attempt, an estimate, fresh evidence:
   it says so, stays short, and the teaching follows straight after). History
   keeps its own sentence of why and its examples and points home.
7. **Where a source came from.** Said once, in children's words, only when it
   matters (his "not always needed"); `reconstruction`, `modern summary` and an
   organisation's name stay off the board unless taught; a caption with a date,
   maker, place or which picture is which stays; exact provenance in
   `teacherInfo`. History's D05/D06 and the playbook's D12 say so; the test on
   D06's words follows.
8. **The review page.** `design-review-packet.py`'s names list reads slide
   titles and vocabulary cards, finds a one-word name at the start of a piece
   of text when the same word is capitalised mid-sentence elsewhere in the
   lesson, and counts "said earlier" only on whole words the board showed. The
   reviewer reads `preferences.md` → Vocabulary every review (always-read), for
   `A word the teaching leans on is taught`; K01 names ordinary words the list
   cannot see. Tests for each.
9. **Work from what children can use.** The home (A01 to A03) takes every
   extra: a new reasoning demand needs preparation, and maths's fuller form
   (a new decision, representation, reading demand or way of thinking, not a
   label); the final task, its model answer and its acceptance claim no more
   than the evidence studied; "including after a freshness repair", the same
   conclusion earned case by case, no stripping support to manufacture
   independence; trick wording and avoidable reading; a Practise brought
   forward before its knowledge, and beats kept only because they were
   written; each distinct case seen worked; an invented wage, often
   unverified. The reviewer's route-section copy (A11) becomes one pointer
   naming both limits; the designer's (A04) already is one.
10. **A question written by someone who knows the answer.** `preferences.md`'s
    four shapes and repairs (G06) join `teacher-voice.md` → `Say what you
    mean` (G01, G03) as one section, every example and repair kept;
    `preferences.md` keeps a one-line pointer naming the four shapes.
11. **Children's own experience.** One sentence in Source and Scenario
    Integrity (I01): a lesson may invite it (a starter, a comparison, a set
    built from being a person), no beat needs it, and the alternatives are said
    in the words the class hears. PSHE, RE and the dialogic route keep theirs.

**Stories.** Copy first: Sarah Gooder beside George and Sam (D08). Then D08
becomes a plain example and the Sophie story leaves `preferences.md` (A14,
logged in 4.2.286).

## After the change

Map (`plans/2026-09-23-assumed-knowledge-mapping.md`) and pins
(`scripts/tests/assumed_knowledge_ledger_pins.json`) with
`streamline-tools/ledger_mapping.py`; vocabulary, Teach then Do and quick-check
pins updated where this touches them; all suites; saved designs compared; two
independent checks; build-log entry; both `plugin.json` bumped; report.

## What changed from this plan (23 September, after the checks)

- The Sophie case stays in `preferences.md` as a plain example without its date; the story is in the log.
- The source test's general home is Source and Scenario Integrity, beside the designer's source step and the reviewer's section on sources.
- The reminder reaches any earlier lesson, not only a plan's (first check).
- "Not a card" is "not a card alone", for names and things met on the way; an ordinary word keeps the vocabulary rule's three repairs (both checks).
- Pictures: after three more rounds with the teacher, a picture made later is just shown; no caption about how it was made, even when the lesson asks what it tells us; the notes need not say it; a caption naming the picture may help. His Tudor example slides follow.
- Scripts: `ak-change/a1` to `a7`, then `r1` to `r12`; the two checks' reports are `assumed-knowledge-change-check.md` and `assumed-knowledge-repair-check.md`.
