"""The subject-files release (4.2.291), after the merge: the rows of five other
lists this release changed are recorded in their own ledgers, the way
`sj_07_record_in_ledgers.py` recorded the earlier topics' rows (one short
closing section in prose, so no ledger's own row pattern changes), and the build
log entry's "Not done yet" paragraph says so. Run once, on the merged tree:
`python -X utf8 plans/streamline-tools/sj-change/sj_14_record_other_ledgers.py`.

Each ledger must hold each row it records, and must not hold the section yet;
the log's old paragraph must appear exactly once. Line endings are kept as
found (these ledgers carry Windows endings on disk; the log does not)."""
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
PLANS = REPO / "plans"
LOG = REPO / "plugins" / "lesson-v4" / "references" / "build-review-log.md"
print(f"plans: {PLANS}")
print(f"log: {LOG}")

HEAD = "## After the subject-files release (4.2.291, 25 September 2026)"
D1_3 = ("his decisions 1 and 3 on the subject-files list (24 September): \"forget about 'writing a new subject file' "
        "guidance. it should just knowe the files it has, nothing around what could be added in future.\" and \"just "
        "remove it completely\"")
SKILL = "the make-subject-file skill (`skills/make-subject-file/SKILL.md`)"
GUIDE = "the writing guide (`references/authoring-subject-files.md`)"
S10 = ("the subject-files list's settled item 10: the dates beside his examples go and every word of the examples "
       "stays (the log holds each date)")

NOTES = {
    "2026-09-23-playbook-ledger.md": ([
        f"- **PB-V20**: the setup guide's developer-mode line no longer lists writing a subject file among the commands "
        f"that change the plugin; it reads \"(installing a helper, editing templates)\". The skill is removed by {D1_3} "
        f"(the subject-files ledger's SJ-C55; the package read-me lost the same clause).",
        f"- **PB-B21**: the skill's test-run line went with {SKILL}, removed by {D1_3} (SJ-C48).",
    ], ["PB-V20", "PB-B21"]),
    "2026-09-23-design-reviewer-ledger.md": ([
        "- **RV-T05**: geography's page section now says \"The design reviewer reads the finished design against this "
        "file and asks whether it reads as the subject.\", where it said \"The design-reviewer reads the book at the end "
        "of the lesson\": the reviewer reads the finished design against the whole file and never sees a book (the "
        "subject-files list's SJ-G45, its settled item 7, out-of-date text).",
        f"- **RV-T06**: its words were in {GUIDE}, removed by {D1_3} (SJ-B15).",
        f"- **RV-T07, RV-T08**: their words were in {SKILL}, removed by {D1_3} (SJ-C07, SJ-C33).",
    ], ["RV-T05", "RV-T06", "RV-T07", "RV-T08"]),
    "2026-09-23-routes-ledger.md": ([
        f"- **RT-L20**: the reasoning prompts' \"Until a subject-English file exists, keep the detailed reading, "
        f"writing and grammar guidance below active.\" is removed by {D1_3}; the bullet keeps \"English may compare "
        f"effects, justify structural choices or reason from textual evidence.\" and the English guidance below it is "
        f"simply live. The adaptation guidance's \"Detailed English progression belongs in a future subject-English "
        f"file.\", the same hedge in no ledger, went too (SJ-A59).",
    ], ["RT-L20"]),
    "2026-09-23-preferences-rest-ledger.md": ([
        f"- **PF-A42, A43, D80 and M84** (in {GUIDE}) and **PF-A45, A46, B33, M48, M49, M99 and O30** (in {SKILL}): "
        f"removed with their files by {D1_3}. Neither file was read in a lesson.",
        f"- **PF-C59**: the Classroom Secrets paragraph lost \"(16 September 2026)\"; every word of his standard stays "
        f"({S10}; SJ-D42).",
        "- **PF-N28**: in the past-tense paragraph, \"A Year 4 deck on why Tudor children worked (14 September 2026) "
        "told its invented cases\" became \"A deck that told its invented cases\"; the rest of the telling, \"in eighteen "
        "slides\" and his words included, stays as a plain undated example (the standing story rule; the log holds the "
        "deck; SJ-E27).",
        "- **PF-N74 and PF-N75**: the PSHE food paragraphs are removed by his decision 6 on the subject-files list "
        "(\"those balanced diet things sound like things I wouldnt want in the pshe subject files\", then \"maybe the "
        "subject file could say to look for guidance from eatwell guide thing\" and \"yes and yes\"): PSHE's food "
        "section is one line pointing to the NHS Eatwell Guide, and science has the same line (SJ-J24 to J28). This "
        "ledger's \"STAYS (SUBJ)\" for them no longer holds: topic 7's 7A pins them as gone, never as kept.",
        "- **PF-S13**: RE's picture paragraph keeps its words and gains a pointer, \"(every lesson's rule, no picture "
        "of the Prophet Muhammad, is in `preferences.md` → Lesson Designer visual-need boundary)\". His answers, \"Okay, "
        "so yeah, let's not have any pictures of him.\" and \"yes to prohet muhammad not being pictured\", put \"Islam "
        "does not depict the Prophet Muhammad, and no lesson may request a picture of him.\" into that section of "
        "`preferences.md` and into the adaptation designer's picture paragraph, while RE keeps \"or of any prophet\" "
        "beside its line that a nativity is ordinary (SJ-I08).",
        f"- **PF-W29**: the Tudor boards lost \"on 14 September 2026\"; \"the user chose\" and every other word stay "
        f"({S10}; SJ-E21).",
    ], ["PF-A42", "PF-A43", "PF-A45", "PF-A46", "PF-B33", "PF-C59", "PF-D80", "PF-M48", "PF-M49", "PF-M84", "PF-M99",
        "PF-N28", "PF-N74", "PF-N75", "PF-O30", "PF-S13", "PF-W29"]),
    "2026-09-23-teacher-voice-ledger.md": ([
        f"- **VG-M42, VG-M43 and VG-M44**: their words were in {GUIDE} and {SKILL}, removed by {D1_3}.",
    ], ["VG-M42", "VG-M43", "VG-M44"]),
}

for name, (lines, rows) in NOTES.items():
    path = PLANS / name
    raw = path.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    text = raw.replace("\r\n", "\n")
    assert HEAD not in text, f"{name}: already recorded"
    for rid in rows:
        assert re.search(rf"^\| {re.escape(rid)} \|", text, re.M), f"{name}: no row {rid}"
    body = text.rstrip("\n") + "\n\n" + HEAD + "\n\n" + "\n".join(lines) + "\n"
    if crlf:
        body = body.replace("\n", "\r\n")
    path.write_bytes(body.encode("utf-8"))
    print(f"recorded {len(rows)} rows in {name}")

OLD = ("**Not done yet, and named.** Untried on a real run. Built on a side branch from 2db3ceba (4.2.289), beside the "
       "worksheets release (4.2.290); at the merge this entry goes after that one, and "
       "`plans/streamline-tools/sj-change/sj_09_follow_at_merge.py` moves that release's two pins on the maths file's "
       "Classroom Secrets paragraph (WS-G09 and its home) to the undated words, which a trial merge showed is all it "
       "needs. Rows of five other lists changed here and are to be recorded in their ledgers, which are not on this "
       "branch: ")
NEW = ("**Not done yet, and named.** Untried on a real run. The rows of five other lists this release changed are "
       "recorded in their own ledgers (a closing section each, `sj-change/sj_14_record_other_ledgers.py`): ")
OLD_TAIL = ("PF-N74 and N75 must follow this branch: it merges before topic 7's 7A, so 7A pins them as this release "
            "leaves them (gone), never as kept; should a pin on them exist first, the follow-up script retires it "
            "rather than stopping. Codex needs its plugin refreshed before the skill's command leaves it.")
NEW_TAIL = ("PF-N74 and N75 are gone, and topic 7's 7A pins them so, never as kept. Codex needs its plugin refreshed "
            "before the skill's command leaves it.")
log = LOG.read_bytes().decode("utf-8")
assert "\r\n" not in log
for old, new in ((OLD, NEW), (OLD_TAIL, NEW_TAIL)):
    assert log.count(old) == 1, old[:80]
    log = log.replace(old, new)
LOG.write_bytes(log.encode("utf-8"))
print("log paragraph updated")
