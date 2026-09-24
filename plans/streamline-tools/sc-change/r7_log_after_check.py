"""Success criteria (4.2.288): the log entry follows the first check's honesty
findings (its section 7) and records what the check found and what was done."""
from pathlib import Path

LOG = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\references\build-review-log.md")
t = LOG.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, old[:100]
    t = t.replace(old, new)


swap("The designer's own section became a pointer that keeps its self-check.",
     "The designer's own section became a pointer that keeps its self-check; the other copies stay where their readers are and point home.")
swap("The worksheet engine refuses the criteria panel on a sheet (`CRITERIA_NOT_ON_SHEETS`); the panel stays in the engine for the colour marks the board and the wall share, and leaves the designer's catalogue.",
     "The worksheet engine refuses the criteria panel on a sheet (`CRITERIA_NOT_ON_SHEETS`), and so does the worksheet designer's own final check, so a sheet is never called clean and then turned back at the build; the panel stays in the engine only because a shared test renders it to prove the three surfaces colour the marks alike, and it leaves the designer's catalogue. The lesson template writes an empty worksheet criteria list rather than asking for one.")
swap("The review page's two cues on a step ask his questions (does a second sentence only name the result? does a question tell the child what to do next?) rather than pointing at a fault.",
     "The review page's two cues on a step ask questions rather than pointing at a fault: whether a second sentence names the result, restates or explains the step, is a second step, or is a condition or a stem the child writes into; and whether a question step tells the child what to do next.")
swap("The template guide no longer says the final slide check blocks on the criteria count, which it has not done since 19 September, and the test that held the old sentence now holds the true one.",
     "The template guide no longer says the final slide check blocks on the criteria count, which it has not done since 19 September, and the test that held the old sentence now holds the true one. A panel that fits is no longer listed as a slide to check before teaching, the 18 to 19pt warning names a roomier composition instead of shorter words, and the wall build's messages never offer to shorten a criteria step.")
swap("The instruction files are about 3.2 KB larger (the worksheet designer and the designer's own section shrank; the home grew by the new decisions), the programs about 2.7 KB larger, and the worksheet catalogue about 0.6 KB smaller. Across the 53 saved designs, four now also carry the new worksheet refusal; nothing else changed.",
     "The instruction files are about 4.6 KB larger (the worksheet designer and the designer's own section shrank; the home grew by the new decisions, and the slide placement guide gained where a long list fits today), the programs about 4.1 KB larger, and the worksheet catalogue about 0.6 KB smaller. 29 of the 53 saved designs put criteria on their worksheet; four of them now show the new refusal, because the other 25 fail older checks first.")
swap("**Not done yet, and named.** Behaviour is untried on a real run. How to fit a very long criteria list on a slide (perhaps a new layout) is a separate investigation the teacher asked for, not started without his word. A method frame on a maths sheet (`method-frame`) names a method's steps on its working lines, and whether that counts as criteria on a sheet is his to say. The wall's layout test still uses `Find the neighbouring multiples.` as layout data, which no agent reads.",
     "- **The second reader, on the change.** A fresh agent compared every changed row with its old words, checked the 324 unchanged rows, ran the validator, the review page and the sheet engine over the saved designs and made 97 attempts to break the pins; every deletion, softening and move was caught and nothing was lost outright. It found: decision 6 had not reached the task-centred and content routes, which still called the criteria the standard aimed at (now what a stuck child uses); the sheet engine refused a panel only at the build, after the designer's preflight had passed it, and the lesson template still asked for worksheet criteria (both repaired, with tests); \"no criteria on a worksheet\" had been widened to every method's steps (narrowed back to his words); the check that the board's criteria fit the sheet's own task had gone (restored); the review page's second-sentence cue had dropped explanation and a second step (restored beside his answers); the wall build's messages still offered to shorten a criteria step (repaired); a kept story still showed steps on a sheet; and short forms of the retired wordings, and anything in the JavaScript programs, were held by nothing (every topic's \"everywhere\" now reaches the programs). The long-list investigation's wrong-pointing messages went in with these repairs.\n"
     "\n"
     "**Not done yet, and named.** Behaviour is untried on a real run. The measuring fixes, the practice box that widens itself and the lesson check's length catch the teacher agreed after the long-list investigation are the next release; until then a list that fits no layout is delivered as a flagged slide. A worksheet used away from the board (a cover lesson, homework) can no longer carry the criteria, and whether it writes what a child needs into its questions is put to the teacher. The wall's layout test and the worksheet engine's tests still use old step wordings as layout data, which no agent reads.")
LOG.write_text(t, encoding="utf-8")
print("log ok")
