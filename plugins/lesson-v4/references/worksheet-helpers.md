# Worksheet Helpers

The contract between `worksheet-designer` and `worksheet-builder`.

- The **designer** writes one `worksheet.json` per lesson.
- The **builder** runs one script over it and reports what came back.

---

## Where things are written down

| What | Where | Written by |
|---|---|---|
| What you can put in a zone, and a working example of each | `worksheet-helpers/catalogue.md` | generated, `npm run catalogue` |
| The page shapes, and which hold what | `worksheet-compositions.md` | generated, `npm run layouts` |
| When to reach for a helper in this subject | `worksheet-helpers/[subject].md` | by hand |

**The first two are generated from the engine and must not be edited by hand.** A
catalogue written by hand drifts from the code the first time anyone is in a
hurry, and it drifts silently: nothing breaks, the designer simply stops
reaching for whatever went unwritten. The old catalogue said so in its own
opening lines, and it was right.

The subject files are the part no generator can write: what a helper is FOR in
this subject, and when a lesson should reach for it.

---

## The shape of `worksheet.json`

One file per lesson, holding every sheet the lesson hands out, so the set is one
artefact and cannot drift apart.

```json
{
  "meta": {
    "name": "multiplying-by-3",
    "lesson": "Multiplying by 3",
    "yearGroup": 4,
    "subject": "maths",
    "lessonDesignPath": "/abs/path/lesson-design.json",
    "adaptationPath": "/abs/path/adaptation.md"
  },
  "sheets": {
    "below":        { "recording": "sheet",
                      "recordingReason": "Q1: the child completes the printed part-whole model.",
                      "layout": "auto", "zones": [ { }, { } ] },
    "expected":     { "recording": "books",
                      "recordingReason": "Every answer is a number or an explanation.",
                      "layout": "auto", "zones": [ { }, { }, { } ] },
    "greaterDepth": { "recording": "books",
                      "recordingReason": "Reasoning written from a shared copy; nothing is marked on the page.",
                      "layout": "halves-side", "orientation": "landscape",
                      "zones": { "a": { }, "b": { } } }
  },
  "answerKey": {
    "below":        [ { "question": 1, "answer": "..." } ],
    "expected":     [ { "question": 1, "answer": "..." }, { "question": 2, "answer": "..." } ],
    "greaterDepth": [ { "question": 1, "answer": "..." } ]
  },
  "notes": [ "Anything the teacher must hear about this sheet." ]
}
```

| `meta` field | |
|---|---|
| `name` | required. Names the output file. |
| `lesson` | required. Prints on every sheet. |
| `yearGroup` | required. 1 to 6. |
| `subject` | required. Chooses which subject helper file to read. |
| `lessonDesignPath` | required. Absolute path to `lesson-design.json`. |
| `adaptationPath` | required when an adaptation exists. |

A sheet does not carry the learning objective, and there is no field for one.
The class has the objective on the board and writes it in their books, so
printing it again bought a line of the child's page on every sheet and nothing
else. Do not reintroduce it as a zone, a title or a note: the room belongs to
the work. (Dropped 8 September 2026, after two packs shipped with it clipped to
"To ex" and "To id" by the combined-PDF merge.)

| Top-level field | |
|---|---|
| `answerKey` | required, complete, for every pupil sheet present. Never `sheets.answers`, which is refused. The build writes it to the separate teacher `- Answers.txt` file. |
| `notes` | optional, top level only. A note written inside a sheet is dropped without a word; only top-level notes reach the builder's `Note:` lines and the teacher. |

**An answer key's labels are the labels the sheet prints.** Both come from one
canonical bracketed system, so a teacher marking `(1a)` is looking at the same
question the child answered. The key is matched against the labels actually
generated, not against a count of questions:

- hierarchical labels are valid — a grouped Part prints `(1a)` and its key entry
  is `1a`;
- brackets and spacing do not matter for matching: `1a`, `(1a)` and `"1a "` are
  the same label, and all print as `(1a)`;
- **flat numeric keys keep working** — `{ "question": 1 }` against a sheet that
  prints `(1)` is exactly as valid as it was before;
- every key entry must correspond to a question the sheet prints, and every
  printed question must have one. An answer for a question that is not on the
  sheet, or the same question answered twice, is refused rather than ignored.

**Neither `lesson` nor `lo` is printed on a sheet.** `lesson` names the built
file and titles the answer key; `lo` is planning information. Nothing headed is
drawn on the paper at all.

The objective went first, on 8 September 2026, then the lesson name on 12
September, and both for the same two reasons. A child is holding the sheet in
the lesson it belongs to, so a heading tells them nothing they do not already
know, and the first thing on the page should be the work - "Fluency", not the
name of what they have spent twenty minutes on. And a heading is teacher-written
text of unpredictable length in a band of fixed height: "How can being active
help my mind and body" wrapped onto a second line and printed straight through
question 1 of the sheet below it.

### The sheets

Any of `below`, `expected`, `greaterDepth`. Only `expected` is required.

They are always built in the order **Below → Expected → Greater Depth**, into a
single file, so printing it and cutting it into piles is one cut after another
rather than a sort.

A worksheet holding only `expected` is normal and not a degraded case. It is
what a shared working frame produces, and what any lesson produces when the
adaptation step was skipped.

**What prints on the page is `B`, `E`, `GD`, never the level name.** Small,
grey, top right. The teacher needs the piles sortable; the child reads the top of
their own page, and "Below" printed there tells them what their teacher thinks of
them. A single-sheet worksheet carries no code, since there are no piles.

It was `Sheet A`, `Sheet B`, `Sheet C`, in a bordered blue badge. Two things were
wrong with that. A, B and C are an alphabet laid over three levels, so the
teacher has to remember which pile is which, and the code shared no vocabulary
with the document that decides the levels - the adaptation-designer writes
Below, Expected and Greater Depth, and the paper said A, B and C. And the badge
was the loudest object on some sheets, for a mark that matters for the two
seconds it takes to cut the pile into three.

### A sheet

| Field | |
|---|---|
| `layout` | required. `"auto"` for the normal case — the engine chooses the shape. Or a named page shape from `worksheet-compositions.md`, when the teaching wants a particular arrangement. |
| `orientation` | `portrait` (default for a named layout) or `landscape`. Per sheet, though one lesson's sheets normally share one: see below. With `"auto"`, stating one constrains the choice to it; omitting it lets the engine try both. |
| `zones` | required. With `"auto"`: an ARRAY of zone contents in reading order. With a named layout: an object with one entry per lettered zone. |
| `recording` | required. `"books"` when every question can be answered in an exercise book from a shared copy, `"sheet"` when at least one needs the printed page. Prints a small book or pencil beside the level code, and a `"books"` sheet also gets a page of question slips at the back of the file. `books-or-sheet.md` has the test and the age guide. |
| `recordingReason` | required, on every sheet. One line saying why this whole sheet is better that way: for `"sheet"`, the question that needs the printed page and what the child does to it (`"Q4: the child labels the printed photograph"`); for `"books"`, what makes every question answerable from a shared copy. Going to look for a question that needs the page is the test, and finding none is what makes a sheet `"books"`. A blank a child copies (a digit box, a gap in a short sentence) is not a printed thing they cannot reproduce. Never change a question to reach either mark. |

Any figure inside a `"books"` sheet that the children will draw for themselves
in their books carries `"onSlip": false`, so the question slips leave it off
(see `books-or-sheet.md`). It changes nothing on the sheet itself. A slip drops
the room for answers and the `steps` success-criteria panel on its own, so
neither needs marking.

**One lesson's sheets normally share an orientation.** The teacher prints the
file once and cuts it into piles, so a portrait Below on top of a landscape
Expected stacks awkwardly, and children comparing sheets across a table read the
difference before they read a word: these are not the same lesson. Pick the
shape from Expected, which is the class lesson the others adapt, and carry it
across.

Break it when a sheet's own content genuinely needs the other way round: a wide
sort, a timeline, a table with six columns. Then say which sheet and why in
`notes`, so the teacher knows the odd one out is deliberate. Leaving every sheet
on `"auto"` is not a decision either way - the engine settles each sheet on its
own and a set can drift apart without anyone stating a thing, which is how three
real sets went out mixed in one week. The preflight reports a set that disagrees.

A layout's zones are lettered `a`, `b`, `c`… and the letters mean position and
nothing else. **A zone knows it is 180mm by 70mm. It does not know what goes in
it.** There is no stimulus zone and no reasoning zone; naming a zone after a
teaching job ties every layout to one kind of lesson, which is the mistake this
engine was rebuilt to end.

#### Automatic layout

`"layout": "auto"` hands the shape question to the engine, which tries every
layout in the library at both orientations and takes the one closest to
comfortably full — the same ranking `suggest.js` prints, so asking the tool
first and copying its top line in by hand buys nothing. The zones array is the
content in reading order, one entry per zone (an entry is usually a `stack` of
several helpers), and the first entry lands in the first zone of whatever
shape wins: content order is never rearranged to chase a fit, the geometry
moves instead.

The build and the preflight both say which shape was chosen, per sheet:

```text
AUTO_LAYOUT: Expected drawn in "band-two-cols" (portrait), 87% full.
```

When no layout holds the content, the refusal is `SHEET_DOES_NOT_FIT` carrying
the same millimetre verdict `suggest.js` gives — how far over, and which item
costs the most — so the two cases stay tellable apart: content a different
grouping rescues, and a brief genuinely bigger than a page.

Auto is for the normal case, and a NAMED layout remains the way to insist:
pedagogy that wants one big shared grid rather than six small ones, a page
whose flanks must point inward at a middle, a deliberately sparse sheet. The
two-page exception below never uses auto — where content splits across paper
is the designer's decision, so each of its pages names its layout.

### Optional physical-page decorations

A normal sheet may carry `decorations` beside layout/orientation/zones. An
approved two-page exception puts decorations on each `pages[]` object; a
sheet-level collection beside `pages` is omitted with a notice. P3 is a full-page
physical overlay, not a helper/zone, and never enters fit, numbering or page count.

#### The one two-page exception

A sheet is one page. **Ordinary overflow never creates a second one** — a sheet
that will not fit is a design fault the designer resolves, not something the
builder solves by printing more paper.

The single exception is upstream: a substantial visual pupils must directly plot
on, measure, draw on, label or annotate, which cannot stay usable at one-page
size. That decision is made and marked `Eligible` upstream; what appears here is
only its mechanical trace. Such a sheet drops the one-page `layout` /
`orientation` / `zones` fields and carries an evidence object plus exactly two
pages:

```json
{
  "centralWriteOnVisualException": {
    "visual": "Rainforest cross-section children directly annotate",
    "reason": "The write-on visual cannot remain usable at one-page size"
  },
  "pages": [
    { "layout": "full", "orientation": "portrait", "zones": { "a": {} } },
    { "layout": "full", "orientation": "portrait", "zones": { "a": {} } }
  ]
}
```

The named visual and the reason are **copied from the upstream decision**, not
written here: this object records a decision already made, and composing fresh
wording for it would be making the decision instead of carrying it.

There is no general two-page flag, and `SHEET_DOES_NOT_FIT` never earns one.
Question numbering runs on across the pair — `(1)`, `(2)` on page one and `(3)`
on page two — and starts again at `(1)` for the next pupil level.

### A zone

One of four things, and any of them can nest:

```json
{ "helper": "bar-chart", "categories": [], "values": [] }   one thing
{ "stack": [ {}, {} ] }                                     one above another
{ "row":   [ {}, {} ] }                                     side by side
{ "row": {}, "repeat": 5 }                                  five of the same, side by side
{ "stack": {}, "repeat": 6 }                                six of the same, down the page
```

`repeat` writes one item once and prints several. Reach for it wherever the
work genuinely repeats - six blank rows of an investigation record, four
identical models - because six copies of the same JSON is where the fourth one
quietly ends up different from the other five. How many is an authored
decision: a record with exactly as many rows as there are answers tells a child
when to stop, which is sometimes the design and sometimes a giveaway.

### Numbering

**Never write a question number.** Mark a question with `question: true` and the
engine counts them: zone `a`, then `b`, then `c`, and top to bottom inside a
zone. One format for all of them, bold black in brackets.

```json
"a": { "question": true, "helper": "multiple-choice", "text": "...", "options": [] }
```

A helper holding a SET of questions takes the next run of numbers rather than
one, so a block of six followed by a single reasoning question runs 1 to 6 and
then 7.

A `stack` or `row` marked `question: true` is ONE question, however many helpers
it holds. A diagram, a prompt and somewhere to write is one numbered item.

**Parts of one job: `questionGroupId`.** When the upstream Lesson Design uses
`Question group:` with `Part:` blocks, every Part's outer `question: true`
object carries the same opaque `questionGroupId`. The engine then prints those
Parts as `(1a)`, `(1b)` and carries on at `(2)`:

```json
{ "stack": [
  { "question": true, "questionGroupId": "qg-1", "stack": [ {} ] },
  { "question": true, "questionGroupId": "qg-1", "stack": [ {} ] },
  { "question": true, "stack": [ {} ] }
] }
```

```text
(1a)
(1b)
(2)
```

The ID is **opaque and never pupil-visible**. It is not a label, not a number
and never printed: it says only which questions the design already decided are
one closely connected job.

- It appears **only** on Parts of an actual upstream `Question group:`.
- Every Part of that group uses the **same** ID; a fresh ID starts a new group.
- **Ordinary `Question:` blocks have no `questionGroupId`.**
- The builder **never infers** a group from shared layout, topic, picture, zone
  or proximity. Two questions about the same map are not thereby one question,
  and that judgement was made upstream rather than here.

A group needs at least two Parts, and a group's Parts must run consecutively in
reading order. Both mistakes are refused rather than guessed at, since either
way round the engine would be inventing a relationship or discarding one.

Put the ID on the object carrying `question: true`, so it covers the Part as a
whole. Where a Part's body is a helper holding several items, wrap it in a
`stack` first — otherwise the ID would sit on a set that takes a run of numbers
rather than one.

This exists because a real sheet came out numbered 1, 2, 6. The designer had
faithfully kept the adaptation's own numbers after three questions could not be
built, and on paper a child has no idea questions 3 to 5 ever existed: the gap is
not information, it is a sheet that looks like a mistake. Numbers written by hand
also came out in whatever weight the thing around them happened to be.

Reach for `stack` and `row` when one QUESTION is several things: a diagram, a
prompt and somewhere to write is one numbered item, and no arrangement of zones
makes those three one question.

Minimum sizes compose on their own — a row sums the widths and takes the tallest
height, a stack sums the heights and takes the widest width — so five angles side
by side ask for what five angles need without anyone working it out.

---

## What the builder does with it

```
node worksheet-html/scripts/build-worksheet.js <worksheet.json> [OUTPUT_DIR] [BASENAME]
```

Every sheet is checked BEFORE anything is drawn, and every failing sheet is
reported rather than just the first.

| Signal | Meaning |
|---|---|
| `Built: <path>` | The single PDF holding every sheet. |
| `Built answers: <path>` | The separate teacher answer file, written first on every successful build. |
| `PDF_SKIPPED` + `Built HTML: <path>` per sheet | This machine cannot make a PDF yet (no Chrome, or packages not installed - the message says which), and `scripts/ensure-chrome.js` usually fixes it: it installs the packages and fetches a headless Chrome over the network. Until then the HTML files are the worksheet: self-contained, printed from Chrome at 100% scale. Not a failure, and not verified either. |
| `PAGE_FIT_UNVERIFIED` | Prints beside `PDF_SKIPPED`. No browser, so no page was measured as it will actually print: the HTML is partial, unverified output. A technical state of the machine, not a fault in the worksheet. |
| `Sheets: ...` | Which sheets went into it. |
| `AUTO_LAYOUT: ...` | Which shape the engine chose for an auto sheet, and how full it runs. Information, not a fault: the designer left the choice to the engine and this is the engine saying what it chose. |
| `AUTO_LAYOUT_INVALID` | The auto contract was broken: a zones array under a named layout, a zones object under `"auto"`, an empty array, or `"auto"` inside the two-page exception. The message says which and what to write instead. |
| `Page fit: ✓ ...` | One page per sheet, measured in a real browser after the fonts loaded. Prints only when every page drew and nothing clipped. |
| `ZONE_SPEC_INVALID` | A zone could not be drawn. Names the sheet and the zone, and the reason follows on the same line: a field the helper could not read, a helper name that does not exist (`UNKNOWN_HELPER: "..."` with the known names), or a layout name that does not exist (`UNKNOWN_LAYOUT`, which names every zone at once because the whole sheet has no shape - fix the sheet's `layout`, not the zones). **Fix what the line names.** |
| `SHEET_DOES_NOT_FIT` | Every zone draws, but the page will not hold them. **Choose a different layout, or move something off the sheet.** Also covers real clipping found in the rendered page, which names the sheet, the page and the zone. |
| `IMAGE_MISSING` | A photograph the spec names could not be read. One line per unreadable picture, each naming its sheet, zone and file, so a spec missing several is one failure to fix rather than one failure per rebuild. |
| `ANSWER_KEY_MISSING` | A populated pupil sheet has no top-level `answerKey` entry. Names the sheets. |
| `ANSWER_KEY_INCOMPLETE` | The key exists but misses a question the sheet prints. Names the sheet and the label. |
| `ANSWER_KEY_EXTRA` | The key answers a question the sheet does not print. Names the label and lists what the sheet does print. |
| `ANSWER_KEY_DUPLICATE` | The key answers the same question twice. |
| `QUESTION_LABEL_INVALID` | A key entry's question label is empty or unreadable. |
| `QUESTION_GROUP_INVALID` | A `questionGroupId` holds only one Part. Either it needs its other Parts, or it is an ordinary question and carries no ID. |
| `QUESTION_GROUP_NONCONTIGUOUS` | A group's Parts are split apart by another question. The Parts of one Question group run consecutively. |
| `NUMBERING_CONFLICT` | A grouped Part also sets its own `number`/`startAt`, or a `questionGroupId` sits on a helper holding a SET of questions. |
| `TWO_PAGE_EXCEPTION_REQUIRED` | A sheet has `pages` without `centralWriteOnVisualException`. Ordinary overflow never earns a second page. |
| `TWO_PAGE_EXCEPTION_INVALID` | The exception is present but does not describe exactly two pages, or its named visual/reason is missing. |
| `TWO_PAGE_SPEC_CONFLICT` | A sheet mixes one-page `layout`/`orientation`/`zones` with a `pages` array. |
| `WORD_BANK_INLINE` | A word bank is typed into pupil wording. A bank is a separate labelled support block, not part of a question's words. |
| `WORD_BANK_MISSING` | Pupil wording tells the child to use the word bank and the sheet has none. |
| `SECTION_LABEL_IN_TEXT` | A block's mode-of-work heading (`Fluency`, `Reasoning`, `Practise`...) opens a question's own words, so it prints as part of that question. Lift it into a `section-label` above the block; the heading is wanted, just not there. |
| `NOT_FOR_THE_CHILD` | Pupil wording names the page's machinery rather than the work (`answer line`, `writing lines`, `sentence stem`, `prefilled`, `placeholder`). Say what the child does and let the helper supply the room to do it. |
| `SLIPS: ...` | A `"books"` sheet's question slips were added at the back of the PDF, with how many fit a page. |
| `SLIPS_SKIPPED` | A `"books"` sheet got no slips (its questions are too long for a slip shorter than a page, or nothing is left once the answer room is taken out). The sheet itself is unchanged. Information, not a fault. |
| `RECORDING_CHANGED` | A sheet's `recording` was unusable: marked `"books"` with wording that needs the printed page (printed as `"sheet"`, no slips), or not one of the two choices (printed unmarked). The build still delivers; the preflight is where this is fixed. |
| `RECORDING_MISSING` / `RECORDING_INVALID` / `RECORDING_NEEDS_SHEET` | Preflight only. A sheet has no `recording`, a value other than `"books"` or `"sheet"`, or is marked `"books"` while its words ask for something only the printed page allows. Fix the field; never reword the question. |
| `RECORDING_REASON_MISSING` | Preflight only. A sheet has a `recording` mark and no `recordingReason`. Say in one line why the whole sheet is better that way. The build never withholds over it, and prints a `RECORDING:` line per level saying what it costs in paper and why. |
| `NO_SHEETS` | The JSON has none of `below`, `expected`, `greaterDepth`. |
| `SPEC_INVALID` | The JSON is malformed, a sheet name is not one of the three, or answers were stored as `sheets.answers`. |

`ZONE_SPEC_INVALID` and `SHEET_DOES_NOT_FIT` are different faults and are told
apart on purpose, because different edits fix them. A designer sent looking for a smaller layout when what
they have is a typo has been sent the wrong way, and the sheet still will not
build when they get back.

**Nothing is ever dropped to make a page work.** A sheet that will not fit is
refused with a reason. The engine never silently shrinks a ruler, trims a
question or clips a diagram: a page that looks finished and is wrong is worse
than a page that was refused.

---

## When nothing in the catalogue fits

The worksheet-designer's rule 9 owns this decision: compose from existing
helpers first, then change how the question is asked and never whether, and
only a question that cannot be asked honestly at all goes in `notes` as a
named gap. Never bend the nearest helper into a shape it does not draw.

Flagged gaps are how the next helper gets built, and how the newest were:
seven published worksheets went in front of this engine, none could be built,
and every flag named the same missing thing. Every one of them builds now.
