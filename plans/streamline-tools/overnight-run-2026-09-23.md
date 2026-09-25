# Overnight run, 23 to 24 September 2026: the later topics' lists

Started at Daniel's request when he went to bed: "is there not anyway we can keep going through the ten things without me, and when I pick up again in the morning I can answer any questions needed?" Nothing in the plugin is changed by the list work, and nothing is committed or pushed.

## Also running tonight

- **Success criteria (4.2.288):** the second independent check of the repairs (agent `sc-repair-check`, brief `sc-repair-check-brief.md`, report `success-criteria-repair-check.md`). When it reports: make the repairs that are faithful to his decisions; anything that changes a meaning goes on the morning list. Then SC is ready for him to read and commit.
  - Done: it reported at about 03:35 (11 findings, the worst the engine still naming a method's steps, and a panel on an auto sheet priced as content so lesson 15's Greater Depth sheet was dropped). Repairs `sc-change/r11` to `r18` made; all suites green (Python 2,178; worksheet 719), saved designs unchanged. Because the repairs touched engine code, a third narrow check (`sc-third-check`, brief `sc-third-check-brief.md`, report `success-criteria-third-check.md`) is running.
  - Third check done 24 Sept about 14:00 (report `success-criteria-third-check.md`): nothing lost; a named sheet's panels still found late (lesson 15's Expected), loose pins, the worksheets list quoting old engine words, the wall's two-card exception narrower than its own messages. Repairs `r19` to `r23` made; suites green (Python 2,178; worksheet 721); saved designs unchanged. A last narrow check (`sc-fourth-check`, report `success-criteria-fourth-check.md`) ran: nothing lost; a clause could be added on unpinned lines, a slot-held panel untested, a named zone of only panels left empty ("-Infinity"). Repairs `r24`, `r25`; suites green (Python 2,180; worksheet 722); saved designs unchanged. 4.2.288 is ready for him to read and commit.
- **Worksheets (topic 6):** agent `inv-ws` is folding the list check into `plans/2026-09-23-worksheets-ledger.md` and reshaping the decisions (his ruling "worksheets are not homework, worksheets are delivered in class all the time" goes into decisions 1 and 3). Done 23 Sept about 23:10: 478 rows, 5 open decisions and 15 settled ones he confirms in one line each. Its decisions are the first thing he answers in the morning.

## The lists

Every list follows `overnight-topic-lists-common.md` and its own brief in `overnight-briefs/`. At most four of this run's agents work at once (five after the 03:20 restart, to finish by morning); the next in the queue starts when one finishes.

| List | Topic | Ledger in `plans/` | Builder | Check report in `streamline-tools/` | State |
|---|---|---|---|---|---|
| `SA-` | 7: starters, sticky knowledge, the Apply slide, endings | `2026-09-23-starters-sticky-apply-ledger.md` | `inv-sa` | `starters-sticky-apply-inventory-check.md` | done: 390 rows, 9 settled items, 3 open decisions |
| `PF-` | 7: the rest of `preferences.md` | `2026-09-23-preferences-rest-ledger.md` | `inv-pf` | `preferences-rest-inventory-check.md` | done: 1,779 rows (649 added from the check), 12 settled items, 14 open questions holding 17 pulls |
| `RV-` | 8: the design reviewer | `2026-09-23-design-reviewer-ledger.md` | `inv-rv` | `design-reviewer-inventory-check.md` | built (410 rows, 7 decisions); done: 428 rows, 9 settled items, 2 open decisions |
| `RT-` | 8: the routes and pedagogy references | `2026-09-23-routes-ledger.md` | `inv-rt` | `routes-inventory-check.md` | done: 592 rows, 12 settled items, 5 open decisions |
| `SJ-` | 8: the subject files | `2026-09-23-subject-files-ledger.md` | `inv-sj` | `subject-files-inventory-check.md` | done: 490 rows, 6 settled items, 6 open decisions |
| `VG-` | 8: the teacher voice guide | `2026-09-23-teacher-voice-ledger.md` | `inv-vg` | `teacher-voice-inventory-check.md` | done: 470 rows, 8 settled items, 8 open decisions (his humour ruling asked as two: never maths, and what he meant for PSHE) |
| `PB-` | 10: the make-lesson playbook | `2026-09-23-playbook-ledger.md` | `inv-pb` | `playbook-inventory-check.md` | done: 452 rows, 13 settled items, 7 open decisions (6 items marked unverified) |

**Topic 9 (the slide, worksheet, wall and adaptation designers) is not listed tonight.** Its files are the largest in the plugin, and topics 6 to 8 will move much of their text out of them; listing them now would list text about to move. It is listed after topic 8 changes.

For each list, in order:

1. The builder follows its brief and saves the ledger group by group.
2. When the builder finishes, a fresh agent (`chk-<prefix>`) follows `inventory-check-brief.md` for that ledger, writing the report named above.
3. The builder (resumed by name, or a fresh agent on the same brief if that fails) verifies every finding against the files, adds the verified ones, reruns `check-ledger-quotes.py` until `LEDGER_QUOTES_OK`, and updates its decisions.
4. Update the plan's topic table.

## If the run was stopped

**It was, once:** a monthly spend limit stopped every agent at about 23:30 on 23 September; the limit reset at 03:20 and all five (`inv-rt`, `inv-pf`, `chk-sa`, `chk-rv`, `sc-repair-check`) were resumed by name from their saved work.

**And again:** at about 04:10 on 24 September the limit stopped `chk-sj`, `sc-third-check`, `inv-pb`, `inv-vg` and `chk-pf`. It reset at 08:20, but the session had restarted and the named agents were gone, so fresh agents took over on the same briefs, each told where its predecessor's work was saved: `sc-third-check-2`, `chk-sj-2`, `chk-pf-2`, `inv-vg-2` and `inv-pb-2`. The fold step for the `PF-` and `SJ-` lists needs a fresh agent too, as their builders are gone.

**And a third time:** at about 09:30 on 24 September the limit stopped `fold-vg`, `fold-pb`, `fold-pf` and `sc-third-check-2`. It reset at 13:20; all four were still reachable and were resumed by name.

A usage limit stops running agents; files already saved remain. To resume, in a chat: read this file, check which ledgers and check reports exist and how far each ledger got (its header says which groups are done), resume the named agent with a message to carry on from where its file ends (or start a fresh one on the same brief with that instruction), and continue the steps above.

## In the morning

One message to Daniel, in his style: what happened overnight in a few lines; success criteria ready to read (and what is left for him); then the worksheets decisions, all in one message. The later topics' decisions follow topic by topic, as each comes up for its change, unless he asks for them all at once.
