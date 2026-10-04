"""The subject-files release (topic 8, release 1), step 8: the build-log entry,
written above the stories `sj_01` copied in first, and its closing paragraph
below them. No version number and no plugin.json bump: the lead sets both at
merge."""
from _patch import LOG, read, write

log = read(LOG).replace("\r\n", "\n")
HEAD = ("## 2026-09-25 - The subject files are the six the plugin has: the skill that wrote new ones is gone, "
        "a history lesson need not use sources, food follows the NHS Eatwell Guide, and no lesson shows the Prophet Muhammad\n")
assert log.count(HEAD) == 1
start = log.index(HEAD)
entry = log[start:]
STORIES = "- **Stories kept here as they left the runtime.**"
assert entry.count(STORIES) == 1 and "**Why.**" not in entry and log.endswith("\n")

BODY = (
    "- **Why.** Topic 8's third list, the subject files (`plans/2026-09-23-subject-files-ledger.md`): 490 places in "
    "26 files, where the designers find and read a subject file, the six files themselves and the two files that said "
    "how a new one is written. He answered every decision on 24 September, in his words in that ledger, and the prophet "
    "line and the maths explanation question from `plans/2026-09-24-topic-8-change-plan.md` that evening. This is that "
    "plan's release 1; the maths explanation answer belongs to its release 3, and nothing here touches it.\n"
    "- **The skill that wrote new subject files is gone, and the plugin knows the six it has (his decisions 1 and 3).** "
    "\"forget about 'writing a new subject file' guidance. it should just knowe the files it has, nothing around what "
    "could be added in future.\" and \"is this a new skill called make subject file skill or something? just remove it "
    "completely.\" The make-subject-file skill (25.6 KB) and its writing guide (5.0 KB) are deleted; neither was read in "
    "a lesson. The setup guide and the package read-me stop listing \"writing a subject file\" among the developer "
    "commands. The reasoning prompts' \"Until a subject-English file exists\" hedge goes, so the English guidance under it "
    "is simply live, and the adaptation guidance's \"Detailed English progression belongs in a future subject-English "
    "file.\" goes with it (the same hedge, in no ledger, found by this release's own test). The lines that say \"where "
    "one exists\" stay: they are about the subjects with no file today (English, computing, art), not files to come. "
    "Two tests stop naming the skill. Codex keeps the command until `codex plugin add lesson-v4@lessonv4` refreshes its "
    "per-version copy.\n"
    "- **A history lesson need not use sources (decision 4).** \"History doesnt always need sources right? It often "
    "leads to it anyway, but does it have to be a strict rule?\" The history file's top line now opens \"When the lesson "
    "uses sources, teach historical knowledge through the evidence\", so its own \"a history lesson does not need a "
    "source in it\" stands without a pull. The Victorian sketch and the sentence that introduces it are unchanged bar "
    "the date.\n"
    "- **Food follows the NHS Eatwell Guide (decision 6).** \"those balanced diet things sound like things I wouldnt want "
    "in the pshe subject files\", then \"maybe the subject file could say to look for guidance from eatwell guide thing\" "
    "and \"yes and yes\". PSHE's food section, five paragraphs written after the 31 August balanced-diet lesson (balance "
    "judged over a day or a week, never one meal; no invented per-meal portions; a nutrient's body job is a scaffold, not "
    "what balance means; food kept morally neutral, and processed meaning changed, not unhealthy), is now one line: \"A "
    "lesson about food, diet or healthy eating follows the NHS Eatwell Guide for what a balanced diet is and how it is "
    "shown.\" Science, which teaches diet too and never reads the PSHE file, gains the same heading and line at its end. "
    "Not gone, so \"gone\" is not overclaimed: the reviewer's single-lunch example, the food plate drawing's caption "
    "(across a day or over time, not every meal) and its ban on good and bad foods, and the rule that a count in a "
    "criterion is never invented, which every lesson reads. The diet test's four checks on the old rules became one.\n"
    "- **No lesson asks for a picture of the Prophet Muhammad.** His answer to the plan's question 1: \"Okay, so yeah, "
    "let's not have any pictures of him.\" The rule was in the RE file, which only an RE lesson reads: \"Islam does not "
    "depict Muhammad, and no lesson may request a picture of him or of any prophet\", straight after \"Christian art "
    "depicts Jesus freely, so a nativity, a crucifix or a Bible illustration is ordinary teaching material.\" Carried to "
    "every lesson without that line, \"or of any prophet\" could have ruled out Noah's ark or a nativity, so he was asked, "
    "and answered on 25 September: \"yes to prohet muhammad not being pictured\". Every lesson now reads \"Islam does not "
    "depict the Prophet Muhammad, and no lesson may request a picture of him.\" in `preferences.md` -> Lesson Designer "
    "visual-need boundary, which every lesson's designer reads when it decides its pictures, beside the other limits that "
    "win over \"show the class the thing\". RE keeps its fuller rule, any prophet, beside its own exception, with its "
    "examples (the mosque, the Qur'an, calligraphy) and a pointer to that section; it keeps the words, not only the "
    "pointer, because an RE lesson's reviewer and adaptation designer read the RE file whole and never open that section "
    "for this (the first check found that a pointer alone left them without the rule). The adaptation designer asks "
    "for its own photographs in any subject and does not read that section either, so the every-lesson sentence is "
    "also where it decides them, pointing at its home (the second check). The picture stage and the decorator do not "
    "read it: they fetch what the designers name.\n"
    "- **Circuit symbols are Year 6 work (decision 8, his \"yes\").** One sentence in each place a designer reads the "
    "circuit drawing's guidance: the slide catalogue's row (in `templates.md`'s capability index, which the slide "
    "designer scans at the start of every run, so that copy is read in every lesson) and the drawing's own section, the "
    "science helper guide for sheets (read in every science lesson with a sheet), and the wall's card contract. \"Standard circuit symbols are Year 6 work (`subject-science.md`); a Year 4 "
    "lesson shows a labelled photograph of a real circuit instead (`label-diagram` on the photograph).\" A labelled "
    "photograph can be drawn on the board, a sheet and the wall. The science file is unchanged, and nothing refuses the "
    "drawing in Year 4: the reviewer's curriculum check is the net. Left as they were: the generated sheet catalogue's "
    "one-line purpose (no claim about the unit or a year, and changing it means changing the sheet engine), the "
    "stick-in and wall visual lists, the engine's code comment about the drawing's states, and the symbol key "
    "(`circuit-symbol-bank`), which his answer did not name.\n"
    "- **The settled items.** One copy of the start note (12): history's and geography's word-for-word notes fold into "
    "the lesson designer's own reading line, which now says to read the file before the structure is chosen because in "
    "history and geography its routing is part of that choice, and to come back to it beside the teaching-sequence file; "
    "maths, science, RE and PSHE keep notes that carry their own extras; PSHE's \"The PSHE label does not determine the "
    "route.\" goes, because the designer's Structure Decision says it for every subject. The dates beside his examples "
    "go and every word stays (10): \"(4 September 2026)\" out of the sentence introducing the Victorian sketch and "
    "nothing else of it, the Tudor boards' \"on 14 September 2026\", the rounding ruling's \"19 September 2026\" and the "
    "Classroom Secrets standard's \"(16 September 2026)\"; the Tudor deck told in the present tense loses its date and its "
    "name and keeps its telling, \"in eighteen slides\" and his words included, as a plain example. Out-of-date text (7): the timeline line says the guidance places marks in "
    "proportion to their real dates and never labels a line not to scale; \"the geographical-sounding part\" in the "
    "history file is \"the historical part\"; geography's page section says the reviewer reads the finished design "
    "against the file, not a book. Maths's three positions stay as written (9).\n"
    "- **Not here, and why.** The history file's no-decoration line for lessons about death and suffering is topic 7's "
    "(its 7B). The maths file's two other dated stories (the class that could not find the tens either side of 346, 17 "
    "September; the rounding deck that wrote the shortcut as a My Turn, 12 September, pinned by the rhythm topic) are "
    "named by no decision and stay for now. The science, RE and PSHE titles keep their dashes. The shared drawing "
    "manifest's timeline note (`shared/visual-parity.js`) still says a school timeline is almost never honestly to scale; "
    "it is code, outside this list.\n"
    "- **Pinned.** `scripts/tests/subject_files_ledger_pins.json` holds all 490 rows: 394 where they stand, 96 changed, "
    "moved or retired, each with the decision that changed it and its whole paragraph; 75 of those lived in the two "
    "removed files and are held by those files staying gone. Three rows hold words the decisions added or lean on "
    "(science's food line, the circuit sentence in four places, and where each agent that asks for pictures meets the "
    "Prophet Muhammad rule), and four sections are pinned paragraph by paragraph: the three this release rewrote and "
    "the picture section every lesson's designer reads, so a new limit put anywhere in it is caught. "
    "`test_subject_files_ledger_is_kept.py` runs the shared checks and a test per decision, including that the six files "
    "on disk are the six the reviewer is handed, that the prophet rule is where its three kinds of reader meet it, that "
    "the picture section every lesson reads names no figure but the Prophet Muhammad and still counts a nativity worth "
    "showing, that no instruction file outside RE limits pictures of \"any prophet\", and that no program refuses a "
    "picture by what it shows (together, what holds that a nativity picture in a Christmas lesson is not refused), and "
    "that no sentence has one of eleven shapes of a subject file to come (\"may be added later\", \"a future ... "
    "file\", \"until ... exists\" and the rest), which catch both old hedges and every rewording the two checks tried; "
    "a hedge put some other way would pass. Earlier topics' pins that followed the words, moved in place "
    "(`sj-change/sj_06_repin_other_topics.py`) and recorded in their own ledgers: AK-C03, SC-C15, SC-C16, TD-A14 and "
    "VOC-M15 retired with the removed files, SC-G02 retired with the PSHE food rules, AK-B37 and TD-K09 without their "
    "dates, TD-A13 with the designer's reading line. The shared pin checks learned the removed-file pin (and the "
    "vocabulary test, which carries its checks inline, learned it too) and read a home that ends its file to the end, "
    "the same change the worksheets release makes.\n"
    "- **Checked.** {CHECKED}\n"
    "- **Size, honestly.** {SIZE}\n"
)

CLOSING = (
    "\n"
    "**Not done yet, and named.** Untried on a real run. Built on a side branch from 2db3ceba (4.2.289), beside the "
    "worksheets release (4.2.290); at the merge this entry goes after that one, and "
    "`plans/streamline-tools/sj-change/sj_09_follow_at_merge.py` moves that release's two pins on the maths file's "
    "Classroom Secrets paragraph (WS-G09 and its home) to the undated words, which a trial merge showed is all it needs. "
    "Rows of five other lists changed here and are to be recorded in their ledgers, which are not on this branch: the "
    "playbook's PB-V20 and PB-B21 (the setup guide's clause and the skill's test-run line); the design reviewer's "
    "RV-T05 (geography's \"reads the book\" line, corrected) and RV-T06 to T08 (in the removed guide and skill); the "
    "routes' RT-L20 (the English hedge, removed); the rest of preferences' PF-A42, A43, A45, A46, B33, D80, M48, M49, "
    "M84, M99 and O30 (in the removed skill and guide), PF-C59 (the Classroom Secrets paragraph, undated), PF-N28 (the "
    "past-tense paragraph, the Tudor deck undated), PF-N74 and N75 (the PSHE food paragraphs, removed), PF-S13 (RE's "
    "picture paragraph) and PF-W29 (the Tudor boards, undated); and the voice guide's VG-M42 to M44 (in the removed "
    "guide and skill). PF-N74 and N75 must follow this branch: it merges before topic 7's 7A, so 7A pins them as this "
    "release leaves them (gone), never as kept; should a pin on them exist first, the follow-up script retires it rather "
    "than stopping. Codex needs its plugin refreshed before the skill's command leaves it.\n"
)


def filled(template: str) -> str:
    from pathlib import Path
    facts = Path(__file__).resolve().parent / "log_facts.txt"
    values = dict(line.split("=", 1) for line in facts.read_text(encoding="utf-8").splitlines() if "=" in line)
    return template.replace("{CHECKED}", values["CHECKED"]).replace("{SIZE}", values["SIZE"])


body = filled(BODY)
assert "{" not in body.replace("{taught word}", "")
at = start + entry.index(STORIES)
log = log[:at] + body + log[at:]
log = log.rstrip("\n") + "\n" + CLOSING
write(LOG, log)
print("log entry written")
