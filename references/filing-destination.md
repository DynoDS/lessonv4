# Where this lesson is filed, and saying it before you build

The make-lesson orchestrator reads this when it files a finished lesson, deck, or set of resources to SharePoint. It is the single home for the filing rule, so the rule can only be improved in one place and make-lesson always files the same way. The word for the thing being filed (a lesson, a deck) does not change anything here.

## Resolve the destination, then say it before any work starts

The save path on SharePoint is `Year > Term > Week N > Subject`, with a `> Day` layer added for core subjects only (see the next section). The week is easy to get wrong: a teacher on PPA mid-week is often planning for next week, not today, so a destination guessed silently from today's date lands the work in the wrong week and the teacher only finds out later. Resolve a sensible target up front, show it before any building starts, and let the teacher redirect in plain English. That way the common case needs no question and the planning-ahead case is caught early.

## Core subjects file by day; foundation subjects file by week

Core subjects (Maths, English, Reading, Writing) are taught daily, so each one files into a day subfolder: `Maths > Monday`. Foundation subjects (Science, History, Geography, Art, DT, Music, PE, RE, PSHE, Computing, and the rest) are taught once a week, so each files straight into the subject folder with no day layer: `Geography`. Adding a day subfolder for a foundation subject would build a structure that does not match how the teacher actually organises the drive, which is why the resolver returns an empty day and no day is passed at sync time for them.

Two things follow from this split, and the resolver already handles both:

- **The occupied check.** For a core subject, a planned-ahead lesson should not bury one already filed earlier in the same sitting, so the resolver reads the day subfolders, finds the last day in the week that already holds anything, and places the lesson on the first free day after it. A sequence only ever moves forward and never back-fills a gap, so a deliberately skipped day stays skipped. The skip is scoped to the subject, so Tuesday's maths and Tuesday's reading still share Tuesday. For a foundation subject there is no day to bump: the week slot is resolved once, and the teacher redirects if it already holds content. The occupied check counts any real file in the folder, whatever its type, so a lesson never lands on top of a built resource or on the teacher's own source materials; Office lock files and dotfiles do not count.
- **The day in the announcement and the sync.** A core subject is announced and synced with its weekday; a foundation subject is announced and synced with no day at all.

## Run the resolver

Run the shared resolver with this lesson's year group and subject:

```bash
TERM_MD="$(find "[PLUGIN_ROOT]/Knowledge/term" -name "Term.md" | sort -V | tail -1)"
YEAR="4"          # the lesson's year group, from the brief
SUBJECT="Maths"   # the subject this files under (Maths, Reading, Writing, Geography, Science, ...), inferred from the brief; leave empty only if it is genuinely ambiguous, and it then files at the week root with no day
python3 "[PLUGIN_ROOT]/scripts/resolve-filing.py" "$TERM_MD" "$YEAR" "$SUBJECT"
```

Store the five returned values as `TARGET_TERM`, `TARGET_WEEK`, `TARGET_DAY` (empty for foundation subjects), `BUMPED`, and `IS_CORE`. Phase 6 (or the sync phase) passes these to `sharepoint-sync`.

## Say it now

State the destination as soon as it resolves, so a wrong week is caught before the build rather than after it:

- **Core subject, day was bumped** (`BUMPED=yes`): lead with the move, so it is visible. *"Thursday already has a Year 4 maths lesson filed, so I'll set this one down on **Friday** - say the word if you'd rather it went elsewhere."*
- **Core subject, not bumped** (`BUMPED=no`): state the destination plainly. *"Planning your Year 4 maths lesson - I'll file this under **Summer 2, Week 1, Monday** unless you tell me otherwise."*
- **Foundation subject**: state the subject-folder destination with no day. *"Planning your Year 4 Geography lesson - I'll file this under **Summer 2, Week 4, Geography** (foundation subjects go straight into the subject folder, with no day) unless you tell me otherwise."*

A day or week the teacher names ("next week", "Tuesday", "keep it on Thursday") is the one they want, even if it already holds a lesson, so use it as given and update the stored values before the sync. If they say nothing, the resolved target stands.

## When you sync

At the sync phase, spawn the bundled agent at `[PLUGIN_ROOT]/agents/sharepoint-sync.md`, naming that path in the spawn so the plugin's own copy is the one that runs. It runs `[PLUGIN_ROOT]/scripts/sharepoint_sync.py` and derives the academic-year folder from the resolved `TERM_MD`, so pass it the plugin root and `TERM_MD` alongside the year group and subject from the brief, the term folder `TARGET_TERM`, the week number `TARGET_WEEK`, the source folder, and the explicit list of files this run produced. Two filing rules apply to make-lesson:

- **Pass the day only for core subjects.** Include `Day: TARGET_DAY` when `IS_CORE` is `yes`; omit the Day parameter entirely when `IS_CORE` is `no`, so a foundation subject lands in `Subject/` with no day subfolder.
- **Pass the term and week explicitly.** A build can take a while, so a destination recalculated from "today" at save time could drift into a different week than the one the teacher was shown. Passing `TARGET_TERM` and `TARGET_WEEK` directly keeps the save in the week the teacher saw.

Re-state the full destination as the final confirmation, the teacher's last chance to spot a wrong week before moving on: *"Saved to Year 4 ▸ Summer 2 ▸ Week 1 ▸ Maths ▸ Monday."* for a core subject, or *"Saved to Year 4 ▸ Summer 2 ▸ Week 4 ▸ Geography."* for a foundation subject. If the bundled agent or its script is not available, tell the teacher where the files are locally and skip the sync. Never fall back to an external or globally installed sync agent: a copy outside this plugin carries its own school-year path, which may be stale, and a lesson filed into last year's folder looks exactly like a lesson filed correctly until the teacher goes looking for it.
