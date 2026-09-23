# Building one topic's rule ledger (streamline step 1)

You are building the rule ledger for one topic of the lesson-v4 streamline. The
ledger is the inventory every later step depends on: if a rule is missing from
it, nothing afterwards can notice that the rule was lost. Daniel, a primary
teacher and not a developer, owns every decision that comes out of it.

## Read first

1. `C:\Users\Daniel\Projects\lessonv4\plans\streamline-plan.md`, whole: his goal
   in his words, the rules for every topic, the method, and what earlier rounds
   taught.
2. `plans\2026-09-22-vocabulary-ledger.md`: the finished ledger for the first
   topic. Copy its structure and columns exactly.
3. `plans\streamline-tools\vocabulary-example\ledger-independent-check.md`:
   what the first vocabulary inventory missed. It missed about one rule in ten,
   mostly rules that did not use the topic's obvious words, and "copies" that
   carried an extra condition. Search with that in mind.

## What to produce

One file, `plans\2026-09-22-<topic>-ledger.md`, with the vocabulary ledger's
parts, in this order:

- A header: the snapshot (lesson-v4 4.2.284, commit `3de9c956`), the topic's
  boundary in plain words (what is in, what belongs to a neighbouring topic),
  and how to read a row.
- **What the list shows, in short:** counts (places, files, rules, repeats,
  near-repeats that carry an extra condition), and the main findings.
- **Decisions for Daniel:** numbered, each with three short bolded parts (what
  it says now, what I think, what I suggest) and one plain question, "yes"
  meaning take the suggestion. Write these for Daniel: plain English, no file
  or code names, a concrete classroom example where it helps, no em or en
  dashes. Put the decisions this topic needs first; list any that belong to a
  later topic separately.
- The tables, one group per sub-topic, one row per place the topic is written:
  ID (your topic prefix, a group letter, two digits: `AK-A01`), the rule's own
  words in «guillemets» (several «» for several sentences of one rule), when it
  applies and its exceptions, strength (must, default, may, check, mechanics;
  "code" when a program refuses it), names code or tests depend on, where
  (`plugin-relative/path.md` › section · Lnn, then "Copies:" with the other
  row IDs), kind (rule, Daniel's example, his ruling, duplicate,
  near-duplicate with what it adds, contradiction with the decision number,
  story, pointer, maintainer, stale, shared with the owning topic), and a
  proposed home.
- Out-of-date text; stories and dated rulings, each marked whether
  `plugins\lesson-v4\references\build-review-log.md` already holds it; names
  the code depends on and what the code enforces (read
  `scripts/validate-lesson-design.py` and `scripts/design-review-packet.py`);
  rows whose wording a test already pins (search `scripts/tests` for phrase
  strings); mentions judged to belong to another topic, with file and line;
  anything found in passing.

## How

- Search every instruction file in `plugins\lesson-v4\agents`, `references`
  (except the build log), `skills` and `commands`, by meaning, not only by the
  topic's name. Read each hit in its paragraph.
- A rule that another topic owns is still listed, marked "shared" with that
  topic named, so the fold can see it; do not propose moving it. Vocabulary is
  finished and its rules are pinned by `scripts/tests/test_vocabulary_ledger_is_kept.py`:
  list any vocabulary-owned rule you meet as shared with vocabulary.
- Quote exactly. Run
  `python -X utf8 C:\Users\Daniel\Projects\lessonv4\plans\streamline-tools\check-ledger-quotes.py <your ledger>`
  and fix every fault until it prints `LEDGER_QUOTES_OK`. It also flags em and
  en dashes outside «quotes».
- Change nothing in the plugin, commit nothing, and write only your ledger (and
  scratch files, if you need them, under `plans\streamline-tools\scratch\`).
  Write long scripts to a file and run them; long heredocs with quote marks
  fail in this Bash tool.

Return a summary of under 300 words: the counts, the most important findings,
and how many decisions Daniel has to make.
