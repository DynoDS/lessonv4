"""Success criteria (4.2.288): the log entry and the ledger follow the second
check (its findings 1 to 11) and the repairs r11 to r17."""
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
LOG = REPO / "plugins" / "lesson-v4" / "references" / "build-review-log.md"
LEDGER = REPO / "plans" / "2026-09-23-success-criteria-ledger.md"


def patch(path: Path, pairs) -> None:
    raw = path.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    t = raw.replace("\r\n", "\n")
    for old, new in pairs:
        assert t.count(old) == 1, (path.name, t.count(old), old[:100])
        t = t.replace(old, new)
    if crlf:
        t = t.replace("\n", "\r\n")
    path.write_bytes(t.encode("utf-8"))
    print("patched", path.name)


patch(LOG, [
    ("The designer's own section became a pointer that keeps its self-check; the other copies stay where their readers are and point home.",
     "The designer's own section became a pointer that keeps its self-check; the other copies stay where their readers are, and the two in `preferences.md` (Written Voice and Slide Philosophy) point home."),
    ("The lesson template writes an empty worksheet criteria list rather than asking for one.",
     "A panel on a sheet the engine lays out itself is refused before a shape is chosen, so the preflight never asks for a question to be cut to make room for it and the last-resort build never drops a sheet over it. The list refusal leaves success criteria off and sends a method's steps a child works through to their question, one to a line or in `method-frame`. The lesson template writes an empty worksheet criteria list rather than asking for one."),
    ("A panel that fits is no longer listed as a slide to check before teaching, the 18 to 19pt warning names a roomier composition instead of shorter words, and the wall build's messages never offer to shorten a criteria step.",
     "A panel that fits is no longer listed as a slide to check before teaching; the 18 to 19pt warning says 18pt is within his floor and asks for nothing, since he chose to widen a panel only as far as 18pt needs; and the wall build's messages never offer to shorten a criteria step or cut a criteria table."),
    ("The instruction files are about 4.6 KB larger (the worksheet designer and the designer's own section shrank; the home grew by the new decisions, and the slide placement guide gained where a long list fits today), the programs about 4.1 KB larger, and the worksheet catalogue about 0.6 KB smaller.",
     "The instruction files are about 5.0 KB larger (the worksheet designer and the designer's own section shrank; the home grew by the new decisions, the slide placement guide gained where a long list fits today, and the wall's tables and two-card exception were written in), the programs about 9.7 KB larger (most of it the sheet engine finding a panel before it lays a page out, and the review page's heading), and the worksheet catalogue about 0.6 KB smaller."),
    ("short forms of the retired wordings, and anything in the JavaScript programs, were held by nothing (every topic's \"everywhere\" now reaches the programs). The long-list investigation's wrong-pointing messages went in with these repairs.\n",
     "short forms of the retired wordings, and anything in the JavaScript programs, were held by nothing (every topic's \"everywhere\" now reaches the programs, a retired story excepted, which may stay in a program's comment). The long-list investigation's wrong-pointing messages went in with these repairs.\n"
     "- **The second reader, on the repairs.** Another fresh agent checked those repairs item by item and made 63 more attempts on the pins; every sentence the repairs wrote was caught when deleted, softened or moved, and the suites passed. It found: the engine's list refusal still named a method's steps as well as criteria (now criteria only, and a worked-through step list is sent to its question); a panel on a sheet the engine lays out itself was priced as content before it was refused, so lesson 15's Greater Depth sheet was told to cut and the last-resort build dropped it (now refused first, with tests); the 18 to 19pt warning sent every legal panel to the half-width split, against his \"widen only as far as 18pt needs\" (now it asks for nothing); the wall's reference tables could still lose rows or have cells shortened (a criteria table now only splits); the log overstated three things (repaired here, and the vocabulary test now reaches the programs too); several repairs were held only by a comment or not at all (pinned, and two behaviour tests added: a fitting panel is never flagged before teaching, and the template never asks for sheet criteria); two \"standard\" lines left in the task-centred route; the review page's sheet heading was ambiguous when a label repeats (it now names each list's last beat, and which of a repeated label it is); the wall's picture condition was narrower than its diagram rule (now \"unless the steps need it\", on every copy, with two cards named as the one exception to a second teaching card); the halfway example gave the wrong reason (now decision 2's: it is part of the step); and two template lines still said criteria fit the bottom strips. Phrase pins cannot bar every new wording that says the opposite; that limit stands.\n"),
    ("The wall's layout test and the worksheet engine's tests still use old step wordings as layout data, which no agent reads.",
     "Whether a method's steps belong on a worksheet at all is the worksheets topic's open decision 10, and nothing here settles it. The wall's layout test and the worksheet engine's tests still use old step wordings as layout data, which no agent reads."),
])

patch(LEDGER, [
    ("(assumed knowledge's rows J03, J04 and J13 to J17)",
     "(assumed knowledge's rows J03 and J13; the worksheets list gathers them under its decision 1 as WS-I01, I03, I04, I05, I15 and I17)"),
])
