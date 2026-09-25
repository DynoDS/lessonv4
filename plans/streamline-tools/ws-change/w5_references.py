"""The worksheets release (4.2.290), step 6: the helper references, the maths
helper notes, books-or-sheet, the brief-gap protocol and the adaptation
designer's one line (change plan section 1, decision 5; section 2, settled
items d, g, j, m and o's text; section 4, stories)."""
from _patch import SHARED, WSH, MATHSH, BOS, GAP, ADAPT, replace_once, assert_absent

# ─── decision 5: what goes back and what is a note ───────────────────────
# E08: a form believed wrong goes back, like a question a child could not
# answer as printed.
replace_once(
    SHARED,
    "job is to realise the named form, not to re-pick it; a form you believe is wrong\n"
    "is a `notes` entry, exactly like a question you believe is wrong.\n",
    "job is to realise the named form, not to re-pick it; a form you believe is wrong\n"
    "goes back through `WORKSHEET_CONTENT_GAP`, like a question a child could not\n"
    "answer as printed (the worksheet designer's rules 1 and 11).\n",
)
# E09: the nearest honest thing only where it is the same action; otherwise
# it goes back. The teeth-sheet sentence stays as a plain example.
replace_once(
    SHARED,
    "**A form with no helper behind it is a gap, not a licence to substitute.** Say so\n"
    "in `notes` with the form and the sheet, and build the nearest honest thing only\n"
    "where it is genuinely the same action. Silently answering a\n",
    "**A form with no helper behind it is a gap, not a licence to substitute.** Build\n"
    "the nearest honest thing only where it is genuinely the same action; otherwise\n"
    "return it through `WORKSHEET_CONTENT_GAP`, naming the form and the sheet.\n"
    "Silently answering a\n",
)
# P24.
replace_once(
    SHARED,
    "If something upstream looks wrong, say so in `notes`. Do not fix it silently:\n",
    "Something a child could not act on, or a sheet that contradicts the objective,\n"
    "goes back through `WORKSHEET_CONTENT_GAP`, and a doubt the teacher should hear\n"
    "goes in `notes` (the worksheet designer's rule 11). Do not fix it silently:\n",
)

# ─── settled item d: "ask it plainer" says what rule 9 says ──────────────
# The "seven published worksheets" story leaves (it is in the log).
replace_once(
    SHARED,
    "The worksheet-designer's rule 9 owns this decision; the short of it is **change\n"
    "how a question is asked, never whether**. Compose from existing helpers first\n"
    "(the catalogue is bigger than its names suggest), then keep the question's\n"
    "words and ask it plainer, and only a question that cannot be asked honestly at\n"
    "all goes in `notes` as a named gap. Never bend the nearest helper into a shape\n"
    "it does not draw: a page that looks finished and is wrong is the failure this\n"
    "engine exists to refuse.\n"
    "\n"
    "Flagged gaps are how helpers get built. The newest arrived because seven\n"
    "published worksheets went in front of this engine, none could be built, and\n"
    "every flag named the same missing thing. All seven build now.",
    "The worksheet-designer's rule 9 owns this decision: compose from existing\n"
    "helpers first (the catalogue is bigger than its names suggest), never write a\n"
    "replacement question, and return a question no helper can carry faithfully\n"
    "through `WORKSHEET_CONTENT_GAP`. Never bend the nearest helper into a shape it\n"
    "does not draw: a page that looks finished and is wrong is the failure this\n"
    "engine exists to refuse.\n"
    "\n"
    "A returned gap is how the next helper gets built.",
)
replace_once(
    WSH,
    "The worksheet-designer's rule 9 owns this decision: compose from existing\n"
    "helpers first, then change how the question is asked and never whether, and\n"
    "only a question that cannot be asked honestly at all goes in `notes` as a\n"
    "named gap. Never bend the nearest helper into a shape it does not draw.\n"
    "\n"
    "Flagged gaps are how the next helper gets built, and how the newest were:\n"
    "seven published worksheets went in front of this engine, none could be built,\n"
    "and every flag named the same missing thing. Every one of them builds now.",
    "The worksheet-designer's rule 9 owns this decision: compose from existing\n"
    "helpers first, never write a replacement question, and return a question no\n"
    "helper can carry faithfully through `WORKSHEET_CONTENT_GAP`. Never bend the\n"
    "nearest helper into a shape it does not draw.\n"
    "\n"
    "A returned gap is how the next helper gets built.",
)

# ─── settled item j (C12, L50): the adaptation names the support ─────────
replace_once(
    SHARED,
    "hangs a `hint` and a `wordBank` on the fields that need one, and both are drawn",
    "hangs a `hint` and a `wordBank` on the fields its adaptation names, and both are drawn",
)
replace_once(
    MATHSH,
    "its own method or working, and keep the chart on the Below sheet when removing\n"
    "it would remove access rather than fade a scaffold.",
    "its own method or working, and the Below sheet keeps the chart when its\n"
    "adaptation keeps it, because removing it there would remove access rather than\n"
    "fade a scaffold.",
)

# ─── settled item g (O34) and stories (I12, H07) in the contract ─────────
replace_once(
    WSH,
    "| `lesson` | required. Prints on every sheet. |",
    "| `lesson` | required. Names the lesson in the file and heads the answer key; never printed on a pupil page. |",
)
replace_once(
    WSH,
    "the work. (Dropped 8 September 2026, after two packs shipped with it clipped to\n"
    "\"To ex\" and \"To id\" by the combined-PDF merge.)\n",
    "the work.\n",
)
replace_once(
    WSH,
    "This exists because a real sheet came out numbered 1, 2, 6. The designer had\n"
    "faithfully kept the adaptation's own numbers after three questions could not be\n"
    "built, and on paper a child has no idea questions 3 to 5 ever existed: the gap is\n"
    "not information, it is a sheet that looks like a mistake. Numbers written by hand\n"
    "also came out in whatever weight the thing around them happened to be.\n",
    "Numbers kept by hand leave a gap wherever a question could not be built, and to\n"
    "a child the gap is not information: it is a sheet that looks like a mistake.\n"
    "Numbers written by hand also come out in whatever weight the thing around them\n"
    "happens to be.\n",
)

# ─── settled item o: the page-only words are a prompt to look again ──────
# His 19 September ruling: one digit box does not make a write-on sheet. The
# digit-box paragraph and its ruling stay exactly.
replace_once(
    BOS,
    "Wording that only makes sense with the printed page (\"Circle...\", \"Mark it on the\n"
    "line\", \"in the boxes\", \"Fill in the table\") marks a sheet `\"sheet\"` whatever it was\n"
    "set to. The preflight refuses the contradiction as `RECORDING_NEEDS_SHEET` so it is\n"
    "fixed while the choice is still yours; fix it by marking the sheet `\"sheet\"`, never\n"
    "by rewording the question, which is verbatim. Wording like \"Use the number lines to\n"
    "help you\" is fine: in a book the child draws their own.\n",
    "Wording on a `\"books\"` sheet that looks as if it needs the printed page (\"Circle...\",\n"
    "\"Mark it on the line\", \"Fill in the table\") is a prompt to look again, not a\n"
    "verdict: the preflight prints `RECORDING_LOOK_AGAIN`, naming the words and the\n"
    "question. Words about a box or a gap are judged by what the sheet holds: a box\n"
    "in the question's own sentence (`4,_50`), or on a sheet whose only helpers are\n"
    "sentences and number sentences (questions, written answers, instructions,\n"
    "number sentences, section labels), is the blank above and is never flagged; a\n"
    "box on a sheet that also holds a figure (a part-whole model, a grid, a table, a\n"
    "number line) is a prompt to look again.\n"
    "Look at a flagged question against the test above. A printed thing the child\n"
    "cannot reproduce makes the sheet `\"sheet\"`; when a book still does, set\n"
    "`\"recordingLookedAgain\": true` on the sheet, which quiets the prompt, and say why\n"
    "in `recordingReason`. Never reword the question, which is verbatim. Wording like\n"
    "\"Use the number lines to help you\" is fine: in a book the child draws their own.\n"
    "The build prints a flagged `\"books\"` sheet that does not say it was looked at\n"
    "again as `\"sheet\"`, with `RECORDING_CHANGED`, so a books sheet nobody looked at\n"
    "never prints slips asking a child to circle something they do not have.\n",
)
# K02's date only (a reason's date; the reason stays).
replace_once(
    BOS,
    "The teacher's school asked staff to use less paper (16 September 2026). A sheet\n",
    "The teacher's school asked staff to use less paper. A sheet\n",
)
replace_once(
    WSH,
    "| `RECORDING_CHANGED` | A sheet's `recording` was unusable: marked `\"books\"` with wording that needs the printed page (printed as `\"sheet\"`, no slips), or not one of the two choices (printed unmarked). The build still delivers; the preflight is where this is fixed. |\n"
    "| `RECORDING_MISSING` / `RECORDING_INVALID` / `RECORDING_NEEDS_SHEET` | Preflight only. A sheet has no `recording`, a value other than `\"books\"` or `\"sheet\"`, or is marked `\"books\"` while its words ask for something only the printed page allows. Fix the field; never reword the question. |\n",
    "| `RECORDING_CHANGED` | A sheet's `recording` was unusable: marked `\"books\"` with wording that looks as if it needs the printed page and no `\"recordingLookedAgain\": true` (printed as `\"sheet\"`, no slips), or not one of the two choices (printed unmarked). The build still delivers; the preflight is where this is fixed. |\n"
    "| `RECORDING_MISSING` / `RECORDING_INVALID` | Preflight only. A sheet has no `recording`, or a value other than `\"books\"` or `\"sheet\"`. Fix the field; never reword the question. |\n"
    "| `RECORDING_LOOK_AGAIN` | Preflight only, and a prompt to look again rather than a refusal. A `\"books\"` sheet's words look as if they need the printed page (`circle`, `tick`, `in the box`...). A box in the question's own sentence, or on a sheet whose only helpers are sentences and number sentences, is never flagged. Look at that question against `books-or-sheet.md`: a printed thing the child cannot reproduce makes the sheet `\"sheet\"`, and when a book still does, `\"recordingLookedAgain\": true` on the sheet quiets this. Never reword the question. |\n"
    "| `SHEET_STANDS_IN` | A Below or Greater Depth tier its `returned` entry sends back holds the Expected sheet, with the Expected answers as its key section, until its redesign goes in; so does one the last-resort build (`--omit-unfittable`) cannot make, for any fault, while the Expected sheet passes every check. An Expected sheet the page cannot hold is still omitted, one the browser finds clipped refuses the whole pack (as before), and then nothing stands in. A flag for the teacher's report, never a fault for a repair round. |\n"
    "| `RETURN_RECORD_LEFT` | A Below or Greater Depth sheet was built beside its own `returned` entry, as its redesign; the entry and its note come off. |\n"
    "| `RETURNED_INVALID` | The `returned` record is malformed, names the Expected sheet while it is still in the spec, sits beside a sheet still in `sheets` or names a tier the adaptation does not direct (at the preflight), or sends a sheet back with no Expected sheet to print in its place (at the build): the class's own sheet goes back to the lesson designer and is rebuilt before the worksheets build. |\n",
)
# Decision 5, from the first check: the return is a field the gate reads.
replace_once(
    WSH,
    "| `notes` | optional, top level only. A note written inside a sheet is dropped without a word; only top-level notes reach the builder's `Note:` lines and the teacher. |\n",
    "| `notes` | optional, top level only. A note written inside a sheet is dropped without a word; only top-level notes reach the builder's `Note:` lines and the teacher. |\n"
    "| `returned` | optional, top level only. One entry per sheet sent back to its author, beside its `WORKSHEET_CONTENT_GAP` note: `{ \"sheet\": \"below\", \"problem\": \"teaching\" }` for a problem a child could not get past as printed, or `\"problem\": \"picture\"` with `\"refs\"` for a picture it needs that will never arrive. The preflight reads this, never the note's words. `\"teaching\"` covers a sheet that contradicts the objective too (rule 11), and is refused while that sheet's own pictures are approved and not yet published. A returned Below or Greater Depth sheet is out of `sheets` and goes back to the adaptation designer; until its redesign goes in, and the entry comes off, the build prints the Expected sheet in its place, with the Expected answers as its key section. A sheet in `sheets` is always checked and built: the preflight refuses an entry beside one, or for a tier the adaptation does not direct. The Expected sheet is never built around. |\n",
)
# Settled item o, from the first check: a field answers the prompt.
replace_once(
    WSH,
    "A blank a child copies (a digit box, a gap in a short sentence) is not a printed thing they cannot reproduce. Never change a question to reach either mark. |\n",
    "A blank a child copies (a digit box, a gap in a short sentence) is not a printed thing they cannot reproduce. Never change a question to reach either mark. |\n"
    "| `recordingLookedAgain` | optional, `true` or `false`. `true` on a `\"books\"` sheet says you looked again at the words the preflight flagged (`RECORDING_LOOK_AGAIN`) and a book still does; without it the build prints that sheet as `\"sheet\"`. |\n",
)

# ─── decision 5 in the brief-gap protocol ────────────────────────────────
replace_once(
    GAP,
    "For Slide Designer, this section overrides any generic instruction below that says to place a load-bearing gap only in `notes` and continue to a final specification.\n"
    "\n"
    "## Why this exists\n",
    "For Slide Designer, this section overrides any generic instruction below that says to place a load-bearing gap only in `notes` and continue to a final specification.\n"
    "\n"
    "## Worksheet Designer route\n"
    "\n"
    "The continue-and-note route this protocol describes (The principle above, and How to apply below) does not govern a worksheet a child could not use as printed, or one that contradicts the objective. The worksheet designer omits that sheet and returns it to its owner (a `WORKSHEET_CONTENT_GAP` note and its `returned` entry; its rules 9 and 11), and the other sheets continue. A doubt that leaves the sheet usable and true to the objective is still a `notes` entry, as below.\n"
    "\n"
    "## Why this exists\n",
)
# Settled item d (P28).
replace_once(
    GAP,
    "Your own rule 9 carries the ladder: compose from existing helpers, then keep the question's words and change how it is asked rather than whether, and flag in `notes` only a question that cannot be asked honestly at all. Never bend a helper into a shape it does not draw.",
    "Your own rule 9 carries the ladder: compose from existing helpers, never write a replacement question, and return a question no helper can carry faithfully through `WORKSHEET_CONTENT_GAP`, omitting that sheet while the others continue. Never bend a helper into a shape it does not draw.",
)

# ─── settled item m (L39): the reviewer runs before these sheets exist ───
replace_once(
    ADAPT,
    "That is what the worksheet designer realises and what the reviewer checks;",
    "That is what the worksheet designer realises;",
)

for rel, gone in (
    (SHARED, "is a `notes` entry, exactly like a question you believe is wrong"),
    (SHARED, "Say so in `notes` with the form and the sheet"),
    (SHARED, "If something upstream looks wrong, say so in `notes`"),
    (SHARED, "keep the question's words and ask it plainer"),
    (SHARED, "change how a question is asked, never whether"),
    (SHARED, "only a question that cannot be asked honestly at all goes in `notes`"),
    (SHARED, "seven published worksheets"),
    (WSH, "then change how the question is asked and never whether"),
    (WSH, "seven published worksheets"),
    (WSH, "Prints on every sheet"),
    (WSH, "To ex"),
    (WSH, "1, 2, 6"),
    (WSH, "RECORDING_NEEDS_SHEET"),
    (BOS, "RECORDING_NEEDS_SHEET"),
    (BOS, "marks a sheet `\"sheet\"` whatever it was set to"),
    (BOS, "The preflight refuses the contradiction as"),
    (BOS, "(16 September 2026)"),
    (GAP, "flag in `notes` only a question that cannot be asked honestly at all"),
    (ADAPT, "and what the reviewer checks"),
    (MATHSH, "keep the chart on the Below sheet when removing it would remove access"),
):
    assert_absent(rel, gone)
print("helper references, books-or-sheet, the gap protocol and the adaptation line changed")
