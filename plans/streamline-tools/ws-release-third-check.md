# The worksheets release (4.2.290): third check, narrow

Checked on 25 September 2026 against the uncommitted working tree, only the round
that repaired the second check (`ws-release-second-check.md`). I did not write any
of it. This round's change was read as the difference between the second check's
untouched copy (`scratch/wsrel2/copy2`) and the working tree: 24 plugin files. I
changed nothing outside `scratch/wschk3/` except this file; the plugin was hashed
before and after. Scripts and results: `scratch/wschk3/cases.py` (32 cases, PDFs
rendered), `mutate.py` (the repair undone in a scratch copy), `census.py`,
`scope/`.

## In short

- All ten findings are repaired, and every failing case the second check described
  now does what the report says. The suites pass.
- The stand-in works as he answered: the Expected sheet stands in only when it
  builds, each tier is named once, and on stdout nothing is announced and then
  dropped (though the guard that keeps it so in one case has no test).
- Seven small things remain, none blocking; the one worth his view is the first
  (a line that promises a redesign the run does not yet ask for).

## Small things still open

1. **The answer key promises a redesign nobody asks for yet.** A returned sheet's key
   section reads «The Expected sheet stands in here for the Below sheet, which went
   back to be redesigned.» and `SHEET_STANDS_IN` says «went back to the adaptation
   designer ... and no redesigned sheet has replaced it». The report itself says
   «The redesign is not asked for» until the playbook release. Measured against his
   "get rid of the "will return" stuff, it needs to be like it didnt even exist",
   that is a line telling him something is on its way that the run does not do. A
   plain statement of what happened ("which a child could not use as printed", or
   "whose picture never arrived") would be true today and after the playbook
   release. Your call whether this waits for that release.
2. **Attribution in four comments this round wrote or widened.** Each presents the
   lead's reading as his:
   - `check-worksheet.js`: «a teaching problem: anything a child could not get past
     as printed, or a sheet that contradicts the objective (rule 11). The teacher's
     ruling on the worksheets list (24 September 2026): such a sheet goes back»
     (the objective case is the lead's reading, confirmed 25 September);
   - `run-fixed-resource.py`: «A Below or Greater Depth sheet the build cannot make
     then gets the Expected sheet in its place, flagged (Daniel, 25 September 2026:
     a sheet that cannot be made)», and its docstring puts the last-resort case
     under «(Daniel, 25 September 2026: "yes")»;
   - `build-worksheet.js`: «His answer for a Below or Greater Depth sheet that
     cannot be made is the Expected sheet in its place»;
   - `omit-unfittable.test.js`: «because the teacher's answer for a sheet that
     cannot be made is the Expected sheet in its place».

   His "yes" was to a sheet sent back to be redesigned that still cannot be fixed;
   the report, log, mapping and `returned.js` say rightly that the lead passed it on
   for any sheet the build cannot make. Every file he reads, and every pin and
   mapping row, now says whose words each is.
3. **A failed last-resort build leaves a key with a stand-in line.** `s10` (Below too
   small, Expected clipped only in the browser) and `s12` (returned Below, Expected
   clipped): the build refuses the pack (exit 1, no PDF, no `SHEET_STANDS_IN`), but
   `Case - Answers.txt` stays in the output folder saying the Expected sheet stands
   in, and `deliver_files.py` copies any `- Answers.txt` in a folder when called
   without a list. The key was always written before the browser (not new); what is
   new is the stand-in line in it.
4. **Wrong names on two dropped stand-ins.** `s11` (returned Below, Expected too
   small): `SHEET_OMITTED: Below - layout "auto": ... 1599mm` is the Expected copy's
   measurement, and the summary says Below was omitted "because the page cannot
   hold it"; the return shows only as its `Note:` line. `s10`: the refusal reads
   `SHEET_DOES_NOT_FIT: Below page 1 ...` for the Expected copy, and the Below
   sheet's own fault is never named.
5. **The "said plainly" list misses one case.** An Expected sheet the browser finds
   clipped is not omitted at the last resort; it refuses the whole pack (`s14`),
   while the builder's row, the contract and the log say «An Expected sheet the page
   cannot hold is still omitted». Same on 4.2.289.
6. **Two stragglers.** The picture refusal still ends «If what stops a child is
   something else, return it as "problem": "teaching".»; when the coming ref is the
   sheet's own, that return is refused too (`r04` then `r03`), though both refusals
   end at "design it to the promised filenames". And a `slips.test.js` comment still
   says «on a sheet whose only boxes are sentence blanks» (finding 8's old words, in
   a test only).
7. **Two repairs no test holds** (below, E7 and T6): the guard that stops a dropped
   stand-in being named, and the contract row's sentence that `"teaching"` covers
   the objective case and is refused while the sheet's own pictures are coming.

## The second check's findings, one by one

| # | Old | New | Tried now |
|---|---|---|---|
| 1 | Preflight: «[returned] Below sheet returned (...): not measured here»; nothing told the designer to take the entry off | Designer: «A sheet sent back is out of `sheets` ... so when a redesigned sheet goes in, take its entry and its note off.» Preflight: `RETURNED_INVALID` for an entry beside a sheet and for an undirected tier; build: `RETURN_RECORD_LEFT`, the sheet built | `r01`: refused at preflight; the build prints `REDESIGNED BELOW NOTEBOOK` under B (PDF page 1). `r02`, `r02c`: refused at preflight. Done |
| 2 | A teaching return always stood (`scen/02` passed) | Refused while the sheet's own Photo refs are approved and not published | `r03`, `r03g` (a shared `photo-004`), `r03h` (one of two): refused. Stands once published, unsatisfied or unavailable (`r03b` to `d`); another tier's pictures not counted (`r03f2`). The second check's exact `scen/02` still passes (`r03i`) because its adaptation has no Photo refs line; a real adaptation names every item's pictures there. Report's "not told" sentence corrected. Done |
| 3 | «Nothing is ever left with no sheet»; `bld/04` lost the pack | Claim gone from runtime, log, report and tests; the last resort stands in for any Below or Greater Depth fault | `s02` too small, `s03` clipped, `s04` dead picture, `s05` word bank (`bld/04`): each prints the Expected sheet under B, key «which the page could not hold» or «which could not be built». Done (small thing 5) |
| 4 | «leave it unrepaired and say it needs the lesson designer» | «leave it unrepaired and return `WORKSHEET_CONTENT_GAP` for it ... so the content-gap picture wave reaches the lesson designer»; the log names the cost | Playbook line 1370 waits for that marker. Done |
| 5 | `bld/03`: stand-in announced then omitted; flags «Expected, Greater Depth, Greater Depth» | Expected measured first; stand-ins named after the PDF is built | `s08`: no `SHEET_STANDS_IN`; flags «Greater Depth, Expected»; `standInSheets` empty. Done |
| 6 | Log, pins, mapping, test, report quoted the lead's wording as his | Each now says «the lead's wording ... not his own» | Log, 3 worksheets pins, 5 success-criteria pins, mapping, test comment, `w2`, report: done (small thing 2) |
| 6b | Pointers drew the old line | Brief-gap route «or one that contradicts the objective», `shared.md`, `"teaching"` definition, contract row | Done |
| 7 | Four settled items | Unchanged, as asked | Stands |
| 8 | Words said «only boxes» | «only helpers are sentences and number sentences (questions, written answers, instructions, number sentences, section labels)» | Matches the engine's `SENTENCE_HELPERS` exactly; `bld/07` behaves as the words say. Done |
| 9 | Stand-in carried a `BUILD_DIAGNOSTIC`; a repair could take the record away | No diagnostic; the scope check refuses a record taken away | No diagnostic in any stand-in case; `scope/5` refused. Report's playbook list now names the redesign loop, the any-fault last resort and `RETURN_RECORD_LEFT`. Done |
| 10 | Build did not check the record (C19) | Build refuses a malformed record | `r05`: `RETURNED_INVALID`, exit 1, no files. Done |

## The stand-in, built

Every PDF was rendered and looked at (`scratch/wschk3/montage-*.png`).

| Case | What happens |
|---|---|
| `s01` Below returned, no flag | 3 pages: B and E the Expected sheet, GD its own; key line «which went back to be redesigned»; flagged once |
| `s02` / `s03` / `s04` / `s05` Below too small / clipped / dead picture / word bank, flag | Expected sheet under B; one `SHEET_STANDS_IN`; `standInSheets: Below`; the clipped case is drawn again, 3 clean pages |
| `s13` Below too small and GD dead picture | all three pages the Expected sheet, B, E, GD; two key lines, two flags |
| `s06` / `s07` / `s08` Expected cannot fit | Expected omitted, and a Below that cannot fit omitted too; nothing stood in, nothing announced |
| `s09` Expected dead picture | pack refused, `IMAGE_MISSING`, no files, no stand-in |
| `s10` / `s12` / `s14` Expected clipped in the browser | pack refused; no `SHEET_STANDS_IN`; see small things 3 to 5 |
| `s11` Below returned, Expected too small | both omitted; see small thing 4 |

## The return record

| Case | Where | Words |
|---|---|---|
| Entry beside a sheet (`r01`) | preflight refuses; build builds it | `RETURNED_INVALID: the spec holds the Below sheet and a "returned" entry for it (...). A sheet sent back is taken out of "sheets"; if this is its redesign, take the entry and its WORKSHEET_CONTENT_GAP note off.` Build: `RETURN_RECORD_LEFT: ... the sheet is built, as its redesign.` |
| Entry for an undirected tier (`r02`, `r02c`) | preflight refuses, with `--adaptation` only | `RETURNED_INVALID: "returned" sends the Below sheet back, but the adaptation does not direct a separate Below sheet ...`. Without `--adaptation` it passes (`r02b`), and the build, which reads no adaptation, prints a B pile of the Expected sheet |
| Teaching return, own pictures coming (`r03`) | preflight refuses | `CONTENT_GAP_UNFOUNDED: the Below sheet is returned while its own pictures (adaptation-photo-002, its Photo refs in the adaptation) are approved and not yet published. That is the 30 August loss, whatever kind the entry names ...` The build alone would stand the Expected sheet in |
| Scope check (`scope/1` to `7`) | `check-repair-scope.py` | a sheet taken out whole and recorded passes; no record, part of a sheet, a record taken away, or the Expected sheet taken out are refused |

The 61 saved sheets outside scratch give identical preflight results on the second
check's tree and now (`census.py`).

## The new tests, with their repair undone

In a scratch copy (untouched copy first: engine 763 pass, targeted Python 141
pass), each repair undone alone, then restored byte for byte.

| # | Repair undone | Caught by |
|---|---|---|
| E1 | preflight lets an entry sit beside a sheet in `sheets` | engine test (1) |
| E2 | preflight lets an entry name an undirected tier | engine test (1) |
| E3 | build: an entry beside a sheet makes the Expected sheet print over it again | engine tests (2), worksheets ledger test |
| E4 | a teaching return stands while the sheet's own pictures are coming | engine tests (2) |
| E5 | the last resort stands in for a page too small only | engine tests (4) |
| E6 | the Expected sheet not measured before a stand-in | engine test (1), worksheets ledger test |
| E7 | a stand-in later dropped is still named | **nothing** |
| E8 | the stand-in carries a `BUILD_DIAGNOSTIC` again | engine tests (4) |
| E9 | the build no longer refuses a malformed record (C19) | engine test (1) |
| E10 | no stand-in for a sheet the browser finds clipped | engine test (1) |
| P1 | the scope check lets a record be taken away | scope-check test (1) |
| P2 | the scope check refuses a sheet taken out whole and recorded | scope-check test (1) |
| T1 | the focused repair's Expected line back to "say it needs the lesson designer" | worksheets ledger test |
| T2 | the designer no longer told to take the entry and note off | worksheets ledger test |
| T3 | the brief-gap route loses the objective case | worksheets ledger test |
| T4 | `shared.md` loses the objective case | worksheets ledger test |
| T5 | books-or-sheet back to "only boxes" | worksheets ledger test |
| T6 | the contract's `returned` row loses "`"teaching"` covers a sheet that contradicts the objective too ..., and is refused while that sheet's own pictures are ... not yet published" | **nothing**, not even the whole Python suite |

E7 matters in a real case. The guard is there and works (`s11` is clean), but with
it removed, `s11` (a returned Below sheet, an Expected sheet the page cannot hold)
prints `SHEET_OMITTED: Below` and then `SHEET_STANDS_IN: Below`: announced and
dropped, the exact thing finding 5 was about, in the one mix no test builds (a
returned sheet with an Expected sheet omitted at the last resort). One test of
`s11`'s shape would hold it.

## The suites

`bash plans/streamline-tools/run-all-suites.sh wschk3` from the repo root, with a
venv `python3.exe` first on PATH:

| Suite | Result |
|---|---|
| python (`scripts/tests`) | 2,225 passed, 1 skipped (103,496 subtests) |
| voice harness | 21 passed |
| builder | 742 pass, 0 fail |
| worksheet-html | 763 pass, 0 fail |
| stick-in-sheets-html | 70 pass, 0 fail |
| working-wall-html | 142 pass, 0 fail |
| shared | 126 pass, 0 fail |
| test | 46 pass, 0 fail |

No em or en dash in any line this round added (29 changed files compared); the
dashes in `ws-change/` quote old text or the designer's return line.
