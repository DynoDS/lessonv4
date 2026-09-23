# Streamlining lesson-v4 without losing anything

**Superseded by `streamline-plan.md`, which every chat reads first.** This is
the original brief, kept as the record of how the work began.

A brief for a fresh session, written at the end of the 22 September 2026 session
that repaired the Year 4 leisure deck (4.2.283). Read it whole before doing
anything, then read the two skills it names.

## What Daniel wants

In his words: "I want it optimized so it makes the files smaller. It makes the
reading less. It makes it more focused. But without dropping things, without
removing some random feature that I like... Every rule's there for a reason.
How do we streamline them? How do we get the agents to think exactly like I'm
thinking?" He wants the instructions to read like something a senior prompt
engineer at Anthropic or OpenAI would recognise as well built, and he is not a
developer, so he is relying on you to do it without breaking what he has spent
weeks teaching the plugin.

Success is two things at once, and neither alone counts:

- **Less to read, more focused.** Each rule lives in one place, the place its
  decision is made, stated once with its reason and its limit; guidance that only
  some lessons need is read only by those lessons; nothing in a runtime file
  exists for a maintainer rather than for the agent doing the work.
- **Nothing he wanted is lost.** Every behaviour the plugin has today that Daniel
  asked for is still produced after the change. A shorter file that drops a rule
  is a regression, however clean it reads.

## Read first

- `C:\Users\Daniel\.claude\skills\prompting-tips\SKILL.md` and its
  `references/` (how instruction text should read; `what-changed.md` explains why
  "say it once, in the place it belongs" and "load guidance at the point the work
  needs it" matter on current models).
- `C:\Users\Daniel\.claude\skills\improving-agents-and-skills\SKILL.md`, the
  sections "Control growth" and "Preserve meaning when editing". Its rule that
  incident-specific detail belongs in evaluation evidence, not the runtime view,
  is the one the plugin has broken most.
- Memory: `consolidation-commits-thin-guidance.md`,
  `leisure-deck-diagnosis-2026-09-22.md`, `one-reviewer-no-caps-no-room-theory.md`,
  `teaching-lives-on-slide-and-in-notes.md`, `live-plugin-is-lessonv4-not-teaching-plugins.md`.
- `plugins/lesson-v4/references/build-review-log.md`: the last ten entries, for
  what each recent release did and why.

## What is true now (measured 22 September 2026)

- 74 runtime instruction files, about 2.3 MB. The lesson designer alone is asked
  to read about 630 KB before and while it designs (its own file 144 KB,
  `preferences.md` 212 KB, the subject file, one route file, voice guide sections,
  component and output-contract sections). It then writes the lesson in one pass
  at Codex `low` effort.
- `lesson-designer.md` was consolidated from 121 KB to 61 KB (see
  `CONSOLIDATION_REPORT.md`) and has grown back to 144 KB.
- The bulk is not stories. Sentences telling a dated story or who-said-what are
  about 2 to 5 per cent of the text (52 such sentences in `preferences.md`). The
  bulk is **the same topic written in several places in different words**: the
  planner's own file and `preferences.md` each carry vocabulary, worksheets, the
  Teach-then-Do rhythm and success criteria; the route and subject files carry
  them again. The copies drift and contradict. On 22 September the quick-check
  excuse was found in seven places, the assumed-knowledge rule in nine with nine
  different scopes, and two rules added on 18 and 22 September told the designer
  to do opposite things.
- Stories and dates still belong somewhere: they are the evidence for why a rule
  exists. Their home is `build-review-log.md`, which already holds most of them.
  In a runtime file a rule needs its reason in a clause, not the incident.
- Some runtime text is written for maintainers rather than agents (the opening
  "Purpose" of `teacher-voice.md` saying it is "not the calibration evidence
  archive", reading-order bookkeeping, version notes).
- What already follows the prompting guidance well, and must be kept: almost no
  shouting; many mechanical rules already live in code (the design validator,
  the slide checks, the page builds) rather than prose; most rules carry a reason.
- `skills/make-lesson/playbook-lite.md` is at its byte cap (a test enforces it)
  and is already blocking one diagnosed fix (Part D of
  `plans/2026-09-22-six-run-mechanical-repairs.md`).
- Since 4.2.283, Codex workers read long files in pages (`read-reference.py
  --role`, `--file`, `--page`), so what the agents are told now actually arrives.
  Before that, every file over about 40,000 characters lost its middle.

## Why this has gone wrong before

Every past reduction was a rewrite. An agent was asked to "improve",
"consolidate" or "cut reading", rewrote rules in its own words, and reported that
no teaching had changed. It had: on 6 September Daniel's own history lesson
sketch was deleted and a rule contradicting a later standard was added; on
10 September three commits moved a voice rule out of the always-read file and
deleted the note recording which prompts had reached real children. Nobody
checked the diff rule by rule, and nothing pinned the rules, so the next pass
could not tell what it had lost.

So the method below exists to make losing a rule visible before it ships.

## The method

**0. A trial on one small topic first, end to end.** Before the full inventory,
run every step below on one self-contained topic (vocabulary is a good size: it
lives in the designer's own file, in `preferences.md` and in the subject files,
with real duplication and real examples of Daniel's taste). Daniel sees the
whole cycle, the list, his decisions, the change, the independent check and the
before-and-after, on something small enough to read in one sitting, and says
whether the method works before it touches the big files.

**1. Inventory before any edit, and show it to Daniel.** Build a rule ledger,
one topic or file at a time, starting with what the lesson designer reads. Each
entry is one thing an agent is told to do or not do: the obligation, its
conditions, its exceptions, its strength, any exact interface it depends on
(field names, markers, commands, file names), and every place it appears. Mark
each entry as one of: a rule; a calibrating example of Daniel's taste (his
Victorian schooling sketch, the chosen Tudor Teach boards, Pride Lessons, his
dated rulings); a duplicate of another entry; a contradiction of another entry;
a story or date; maintainer text; or stale text that no longer matches the code.
Write the ledger to a file in the repo and summarise it for Daniel in plain
English. This step edits nothing, so it can start while other work runs. One
row per entry, in this shape (the row below illustrates the columns; check the
real wording and exceptions in the files):

| ID | What the agent is told (quoted) | When it applies, and its exceptions | Strength | Names the code depends on | Where it appears | Kind | Proposed home |
|---|---|---|---|---|---|---|---|
| VOC-07 | "a word the teaching leans on gets taught" | any lesson; not a word the class owns from an earlier lesson the brief names | rule | `vocabularyIntroductions` | lesson-designer.md Vocabulary; preferences.md Vocabulary | duplicate of VOC-02 | preferences.md Vocabulary |

The quote is the rule's own words, so a later reader can check it survived;
"Strength" records whether it is a must, a default or a suggestion, because a
fold that turns a must into a suggestion has changed the plugin.

**2. Daniel decides every contradiction.** Where two entries disagree, that is a
teaching decision and it is his. Walk him through them one per message, in the
shape his CLAUDE.md sets out (what it says now, what I think, what I suggest, one
question). Duplicates need only his agreement on which home keeps the rule.

**3. Move before you reword.** The safest reduction is moving text word for word
into a file that is read only when its decision comes up (worksheet design only
when the lesson has a worksheet, a route's detail only for that route). A test
can prove it: every sentence of the old files exists exactly once in the new
ones. The remaining risk is a file not being read when it is needed, so list the
trigger for each move and check it.

**4. Then fold, one topic at a time.** Where a rule is written three times, keep
one copy at the place the decision is made, carrying its reason in a clause and
its limit beside it. Move the stories to `build-review-log.md`. Keep Daniel's
calibrating examples: taste is the thing prose cannot carry, and they are how
the agents learn to think the way he does. Every ledger entry must map to its
new location or to Daniel's explicit decision to retire it; an entry that maps
to nothing is a loss, not a simplification. Never reword a rule just to make it
shorter.

**4b. An independent check after every topic.** The session that made a change
is the worst placed to see what it lost, because it remembers what it meant.
After each topic, launch a separate agent with fresh context, give it the ledger
rows for that topic, the old text (from git) and the new text, and ask it to
report, rule by rule, anything missing, weakened (a must become a default, an
exception dropped, a condition widened), moved somewhere the agent that needs it
will not read, or changed in meaning. Anything it reports is resolved before the
topic is released, and its report goes to Daniel with the plain-English summary.

**5. Pin it.** Add a test that holds the ledger: each kept rule's key phrase, or
its ID, is still present in its owner file, so the next tidy-up has to argue
with a test instead of silently dropping a rule. The existing wording tests
already do this for many rules; extend them rather than duplicating them.

**6. Prove it.** All test suites green (Python in `plugins/lesson-v4/scripts/tests`,
node in `builder`, `worksheet-html`, `shared` and `test`, `stick-in-sheets-html`,
`working-wall-html`, and `evals/teacher-voice`). Run the design validator and the
review packet over the saved designs in `working/`, `lesson-resources-output/working/`
and `output/working/` and confirm nothing that passed now fails for a reason the
change did not intend. Then real Codex runs, one per subject, compared with runs
of the same lessons before the change, read by Daniel. The first comparison
pair should be the Year 4 History Week 5 leisure lesson: its untouched rerun on
4.2.283 is the "before".

**Order of work.** The designer's own file and `preferences.md` first (every
lesson reads them), then the design reviewer, the content route and the subject
files, the teacher voice guide, then the downstream designers, and the playbook
(which also needs bytes back). Release each topic as its own version with its
build-review-log entry, so any loss can be found by its commit.

## What not to change without asking

- Anything the code reads: field names, markers such as `LESSON_DESIGN_OK`,
  command lines, section headings that `read-reference.py` selectors or tests
  name. Change them only with the code and tests in the same release.
- The effort settings in the role files (Daniel's call).
- The teaching behaviour itself. This is a restructuring, not a redesign; if you
  find a rule you think is wrong, bring it to Daniel as a question rather than
  fixing it inside the restructure.

## Practicalities

- Edit `C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4` only. The
  teaching-plugins copy is a stale fork.
- Stage explicit paths. The repo root holds about 50 MB of untracked built
  lessons that must never be committed.
- Commit and push only when Daniel says so. Bump both `plugin.json` files per
  release. After a push, Codex needs `codex plugin add lesson-v4@lessonv4` before
  it sees the new version.
- Other Claude sessions may be working in the same checkout; check `git status`
  and `ListAgents` before editing shared files, and never commit another
  session's work without Daniel's word.
- Daniel is not a developer. Talk to him in plain English, short chunks, no file
  or function names, no em dashes, one decision per message.
