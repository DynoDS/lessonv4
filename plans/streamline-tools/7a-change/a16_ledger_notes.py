"""Release 7A (4.2.293), step 16: closing notes on the two topic 7 ledgers, as
the subject-files release left on the lists it reached ("After the
subject-files release"), so release 7B and the later topics read what 7A
changed without assuming (the change plan's A5: "Rows are named in both ledgers
so neither release assumes")."""
from pathlib import Path

PLANS = Path(__file__).resolve().parents[2]
SA = PLANS / "2026-09-23-starters-sticky-apply-ledger.md"
PF = PLANS / "2026-09-23-preferences-rest-ledger.md"


def append(path: Path, text: str) -> None:
    body = path.read_text(encoding="utf-8")
    assert "## After release 7A" not in body, f"{path.name} already has its 7A note"
    crlf = "\r\n" in body
    out = body.rstrip("\r\n") + "\n\n" + text
    if crlf:
        out = out.replace("\r\n", "\n").replace("\n", "\r\n")
    path.write_bytes(out.encode("utf-8"))


append(SA, """## After release 7A (4.2.293, 26 September 2026)

Every decision and settled item on this list is built in release 7A, uncommitted
until he says (`streamline-tools/7a-release-report.md`). All 390 rows are pinned in
`plugins/lesson-v4/scripts/tests/starters_sticky_apply_ledger_pins.json`; the 65 that
changed are mapped, each with the decision that changed it, in
`2026-09-26-starters-sticky-apply-mapping.md`. Five of them were changed first by the
colours release (4.2.292): D21, I14, I15 and I16 are taken from its `COLOURS_ROWS`,
and D23, which that release changed through PF-R18 without naming, is mapped with its
words. G10 and H03 are kept word for word; H05's first two sentences and G12 moved to
`preferences.md` -> Sticky Knowledge, and H08 moved there in full prose.

The same lines are rows of the later topics' lists, which their releases read against
the mapping: routes RT-C27, E12, E13, E40, E41, E42, E44, J06, P12, P13, P19; reviewer
RV-H12, H14, J48, K02, S05, S25, T11; playbook PB-S14; voice VG-M33.
""")

append(PF, """## After release 7A (4.2.293, 26 September 2026)

Release 7A built this list's decisions 20 (the Lesson 2 plan) and 21 (`Practise`
flagged), settled item 1 (maths titles and the grid's default title), the wording half
of decision 22 (the wall keeps sentences whole) and the change plan's question 2, with
the out-of-date rows B16 assigned to it (A10, X46, Q18, Q19, V31, Y71, Y73, R98, R99;
A29 is a code comment that stays, and the contents paragraph it showed was stale, A04,
is corrected). 45 rows of this list changed, in the same paragraphs as the starters
list's rows: A04, A10, A54, B75, B76, B77, B78, C75, C80, D21, G33, G50, I01, I02, I03,
I06, I10, I11, I12, I20, I27 (the tall-picture starter's examples, after the first check), J38, J39, J41, L13, Q10, Q12, Q14, Q15, Q16, Q18, Q19, Q32,
R98, R99, V04, V10, V11, V16, V31, W31, X41, X46, Y71, Y73. Each is in `PF_ROWS` in
`streamline-tools/7a-change/build_7a_mapping.py`, with the decision that changed it and
its new words, and is pinned in the starters pin file; 7B's pin file takes these rows
from there, as it takes the colour rows from `COLOURS_ROWS`. How Much Fits in One
Lesson is already a home in the starters pin file (`HOME-SA-PREF-FIT`), so 7B need not
pin it again. V13 and V14 name no slot title and were not changed.
""")
print("closing notes added to both ledgers")
