"""The worksheets release (4.2.290), step 1: the stories the ledger found
missing from the build log are copied there first, before any runtime text
moves (change plan section 4, "Copied to the log first"). The entry starts here
with only its stories; `w10_log_entry.py` writes the rest above them."""
from _patch import LOG, append, read

assert "(4.2.290)" not in read(LOG)
assert "(4.2.289)" in read(LOG)

STORIES = (
    "- **Stories kept here as they left the runtime, or before they leave it.** "
    "The worksheet engine's page rules each came from a sheet. A lesson that taught children to recognise real appliances from photographs set a sheet that described each one in words instead (`Object A washes clothes. It uses mains electricity.`), which tested clue reading rather than recognition. "
    "A Below sheet ended `It helps the body...` with a three-centimetre dotted tail and 36mm of empty paper under it (5 September 2026): the shortest prompt took the smallest answer space and the child with most to say had least room; and a child given a writing line under a sentence stem copied the whole sentence out onto it. "
    "A Year 4 sheet asked children to `identify the body job that is less represented` and `justify one targeted improvement`, which is an exam-paper voice (the voice topic's text; copied here, not moved). "
    "A described recording surface became printed labels nobody chose: \"space for a name\" printed as `Name:`, and `one shared line above for the job` printed as `The job:`, which names a category of thinking rather than a thing to fill in. "
    "Beside `Choose a job.` and `Fireman` (4.2.137), the Greater Depth judgement question on the diet sheet of 5 September 2026 was `Write one question you would ask before making a stronger judgement.` "
    "A sheet came out numbered 1, 2, 6: the designer had kept the adaptation's own numbers after three questions could not be built, and on paper the gap looked like a mistake. "
    "Two packs went out with the learning objective clipped to \"To ex\" and \"To id\" by the combined-PDF merge (8 September 2026), which is why a sheet carries no objective. "
    "Three real sets went out with their sheets in mixed orientations in one week, all left on `\"auto\"`. "
    "A science Below sheet moved `To explore the importance of having a balanced diet` to `To choose different types of food and say how they help the body`: the food knowledge survived and `balanced`, which was the lesson, did not. "
    "`Find 10 and 100 more or less` came back on a Below sheet as five two-digit questions and ended there, so the child practised Year 2 number for the whole lesson. "
    "The teacher's column rulings: on 29 August 2026 he rejected a stimulus on the left with (1) beside it on the right, and on 31 August 2026 he rejected the reverse on his own science sheet, (1) top left with the photographs it asked about top right, and rebuilt it as `Look at these photographs`, the photographs, then (1) and (2) under them, with the drawing task alone on the other side. "
    "Those rulings superseded an earlier \"shared evidence panel\" arrangement in `preferences.md`, which ran the questions down the left with a map, source set or data table in a panel on the right: the shape he rejected. "
    "On 6 September 2026 he was shown two versions of the same Year 4 partitioning worksheets, one with tidier spacing and one where the mathematics had become the page, and approved the second: \"Yes that looks incredible and premium.\" "
    "A PSHE sheet printed `Optional sentence start: \"You can...\"` underneath the line the sentence was to be written on, and a history sheet printed `continuity = stayed similar` at the foot of a page whose first question asked the child to tick continuity or change; both were filed as reminders, and neither child could start. "
    "A balanced-diet sheet shipped with a 209mm blank rectangle taking most of the page, because a drawing surface was read as never reaching its useful height. "
    "A Year 4 sheet asked children to \"look at 92 + 10 in the chart above\" while its layout put the chart to the left, and the run delivered it with a note asking the teacher to say a word to the class. "
    "One worksheet photograph, an incomplete buzzer circuit for a Year 4 no-symbol drawing task, terminalised `unsatisfied`; nothing reconciled it against `worksheet.json`, the build met a certain `IMAGE_MISSING`, the focused repair correctly changed nothing, and the class got no Below, Expected or Greater Depth sheet and no answer key for one picture on one question. "
    "A slide asking children to compare two objects went into a repair carrying a two-row recording table and came out with one column of boxes; every check passed and the comparison was gone (a slide, not a sheet; the scope check was built from it). "
    "A Below lunch sheet named `bread roll` and `egg` as reading support, the specification listed both with no `given`, and the sheet printed two blank leader lines over the photograph. "
    "A Year 4 history deck printed all three of the worksheet's questions on the board under the line `answer the three questions on your sheet`. "
    "And seven published worksheets went in front of the engine, none could be built, and every flag named the same missing thing; all seven build now.\n"
)

append(LOG, (
    "\n"
    "## 2026-09-25 - A worksheet is fresh practice done in class: never the board's questions, a sheet a child could not use goes back, and each rule is written once (4.2.290)\n"
    "\n"
    "*Topic 6 of the streamline in `plans/streamline-plan.md`: worksheets.*\n"
    "\n"
    + STORIES
))
print("stories copied")
