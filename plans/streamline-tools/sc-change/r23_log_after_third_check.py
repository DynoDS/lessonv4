"""Success criteria (4.2.288): the log entry follows the third check (its
findings 1 to 7) and the repairs r19 to r22."""
from pathlib import Path

LOG = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\references\build-review-log.md")
raw = LOG.read_bytes().decode("utf-8")
crlf = "\r\n" in raw
t = raw.replace("\r\n", "\n")


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, (t.count(old), old[:100])
    t = t.replace(old, new)


swap("A panel on a sheet the engine lays out itself is refused before a shape is chosen, so the preflight never asks for a question to be cut to make room for it and the last-resort build never drops a sheet over it. The list refusal leaves success criteria off and sends a method's steps a child works through to their question, one to a line or in `method-frame`.",
     "A panel on any sheet is found before any sheet is laid out, so the preflight names every one and measures each page without the panels that can come off, and the last-resort build never drops a sheet over one; a panel still on a sheet at the last resort refuses the pack, because that flag rescues only a page too small. The list refusal leaves success criteria off first, and otherwise sends steps a child works through to their question, one to a line or in `method-frame`, which is what the instruction files already say.")
swap("The instruction files are about 5.0 KB larger (the worksheet designer and the designer's own section shrank; the home grew by the new decisions, the slide placement guide gained where a long list fits today, and the wall's tables and two-card exception were written in), the programs about 9.7 KB larger (most of it the sheet engine finding a panel before it lays a page out, and the review page's heading)",
     "The instruction files are about 5.1 KB larger (the worksheet designer and the designer's own section shrank; the home grew by the new decisions, the slide placement guide gained where a long list fits today, and the wall's tables and two-card exception were written in), the programs about 11.1 KB larger (most of it the sheet engine finding every panel before it lays a page out, and the review page's heading)")
swap("every topic's \"everywhere\" now reaches the programs, a retired story excepted, which may stay in a program's comment",
     "every topic's \"everywhere\" now reaches the programs; in the vocabulary topic a retired story may still stand in a program")
swap("Another fresh agent checked those repairs item by item and made 63 more attempts on the pins; every sentence the repairs wrote was caught when deleted, softened or moved, and the suites passed.",
     "Another fresh agent checked those repairs item by item and made 63 more attempts on the pins; every sentence the repairs wrote into an instruction file, bar two on the wall, was caught when deleted, softened or moved, and the suites passed.")
swap("so lesson 15's Greater Depth sheet was told to cut and the last-resort build dropped it (now refused first, with tests);",
     "so lesson 15's Greater Depth sheet was priced with its panels and the last-resort build dropped it (the panel is now refused first, with tests; without its panels that sheet is still 4mm too tall, so it would still be left out for size);")
swap("Phrase pins cannot bar every new wording that says the opposite; that limit stands.\n",
     "Phrase pins cannot bar every new wording that says the opposite; that limit stands.\n"
     "- **The third reader, on the second repairs.** Because those repairs changed engine code, a third fresh agent checked them narrowly and made 67 attempts on the pins; nothing was lost, the saved sheets lost no signal and the suites passed. It found: panels were found early only on sheets the engine lays out itself, so lesson 15's Expected sheet, a named layout, never had its two panels named while the other sheet failed (now every sheet's panels are found first, with a test); the two lines that make \"measured without it\" true were held by nothing, and dropping the second printed \"NaNmm\" (now held by a test whose sheet fits only once its panels are off); the list refusal, the 18 to 19pt message and the card rules each had lines no pin held, and the two retired template measurements could come back in their own words (all pinned now, and the flag test reads the build's code, not only its list); the worksheets list put to the teacher still quoted the engine's old words on a method's steps (corrected; he answered that question yes the same morning, and the engine already says it); the card rules' \"one exception\" for two cards was narrower than the wall build, the focused repair and the scope checker, which since 14 September let any long list go over two cards of one title (the card rules now say what those three do, with the criteria as the case where it is how the card makes room); and a cell too long for its column was offered two cards, which cannot cure it.\n")
swap("Whether a method's steps belong on a worksheet at all is the worksheets topic's open decision 10, and nothing here settles it.",
     "The engine's list refusal now matches the instruction files as they stand (success criteria off; steps a child works through go with their question); the teacher answered the worksheets topic's decision on a method's steps yes on 24 September, and that release carries it into the instructions.")
if crlf:
    t = t.replace("\n", "\r\n")
LOG.write_bytes(t.encode("utf-8"))
print("log follows the third check")
