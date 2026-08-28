---
description: Round-trip editor for lesson slide templates and content helpers — build a demo deck, move elements in PowerPoint, save, and write the new coordinates back into the builder source. Also adds brand-new templates and helpers from scratch.
---

# Lesson Template & Helper Builder

Tune any lesson slide template or content helper directly in the `lesson-resources` plugin, using a visual round-trip through PowerPoint. One phase renders a demo deck so the teacher can drag elements around; the next phase parses the saved file and writes the new coordinates back into the builder source. The same flow adds brand-new templates and helpers.

## Resolve the Package and Source Roots

Before doing anything else, use the literal absolute path substituted by Claude Code for `${CLAUDE_PLUGIN_ROOT}` as `PLUGIN_ROOT_CANDIDATE`.

Run:

```bash
python3 "[PLUGIN_ROOT_CANDIDATE]/scripts/verify-plugin-root.py" "[PLUGIN_ROOT_CANDIDATE]"
```

Store the value after `PLUGIN_ROOT=`. If verification fails, stop and report the verifier's error exactly.

This command also requires `LESSON_RESOURCES_SOURCE_ROOT` in the host environment. If it is absent, stop with:

```text
PLUGIN_SOURCE_ROOT_ERROR: LESSON_RESOURCES_SOURCE_ROOT is not set.
```

When it is present, run:

```bash
python3 "[PLUGIN_ROOT]/scripts/verify-plugin-root.py" --source "$LESSON_RESOURCES_SOURCE_ROOT"
```

Store the value after `PLUGIN_SOURCE_ROOT=`. If verification fails, stop before editing anything and report the verifier's error exactly.

Every bare plugin path in this command, including `builder/`, `worksheet-html/`, `working-wall-html/`, `stick-in-sheets-html/`, `shared/`, `references/`, `.claude-plugin/` and `.codex-plugin/`, is relative to `PLUGIN_SOURCE_ROOT`. Run git commands from `[PLUGIN_SOURCE_ROOT]/..`. Never write to `PLUGIN_ROOT` unless its canonical path is exactly the same as `PLUGIN_SOURCE_ROOT`.

The slide engine lives under `[PLUGIN_SOURCE_ROOT]/builder/`:

- **Slide templates** — one file per template in `builder/src/templates/`. Each exports a `drawX(pptx, slide, data, ctx)` function and is registered in `builder/src/templates/index.js` (a `require` line plus an entry in the `TEMPLATES` map keyed by the template's JSON name).
- **Content helpers** — one file per content type in `builder/src/content/` (text, bullets, steps, image, table, vocab, and the maths visuals). Each is registered in `builder/src/content/index.js` in two places: the `HELPERS` map (type → draw function) and `ZONE_COMPAT` (type → which zone classes it fits).
- **Shared constants** — `builder/src/styles.js` (`FONT`, `COLOURS`, `SIZE_CEILINGS`, `FIT`), `builder/src/layout.js` (`bodyZone`, header geometry), `builder/src/headers.js` (`drawHeader`).
- **The architect's catalogue** — `references/templates.md`. This is the single document the slide-designer reads to learn what templates and content objects exist. A new template only becomes usable once it appears here.

**Demo folders live at `<your-projects-folder>/lesson-demos/`** — outside the plugin tree so demos stay ephemeral. Create a subfolder per run; `mkdir -p` handles a first run.

Use this command when the teacher wants to visually adjust a slide layout or a content helper, or add a brand-new one. Otherwise, leave it idle.

---

## Communication Style

**The teacher is not a developer.** Talk to them like a helpful teammate.

- Keep status updates to one short sentence per action, in plain English. Example: "Built the demo — it's open at `...path...`, have a look."
- When they ask what to do next, give plain, step-by-step instructions. Don't assume they remember the workflow, and explain any technical word you can't avoid.
- When you need information from them (a template name, what a new helper should do), ask one question at a time.
- When you finish, summarise what changed and why it matters to them — not a list of files edited.

---

## Which mode?

Ask the teacher plain-English questions before touching anything. Hold off on any phase until the answers are in.

**Question 1:** "Are we working on a whole slide layout, or a content helper (the smaller pieces like bullets, steps, a table, an image, a vocab strip)?"

- **Slide layout** → a *slide template*
- **Content helper** → a *content helper*

**Question 2:** "Are we tuning one that already exists, or building a brand-new one?"

- **Tune existing** → go to *Phase 1: Build*. Skip Question 3.
- **Build new slide template** → ask Question 3, then *New Slide Template Path*.
- **Build new content helper** → *New Content Helper Path*.

**Question 3 (new slide template only):** "Is this a **free** template or a **fixed** template?

- A **free** template defines zones whose shape is fixed but whose content is free to vary — each zone takes any content object (text, bullets, image, table…). Most layouts are free. Examples: `split-h-60-40`, `grid-4`, `central-callouts-4`.
- A **fixed** template hard-codes both the shape *and* the kind of content, because the arrangement itself carries pedagogical meaning. Examples: the maths My-Turn/Our-Turn/Your-Turn family, and the speech-bubble templates (a statement plus named characters speaking). Pick fixed only when the structure *is* the teaching move.

Which one?"

The two kinds share the same file location and registration — the only difference is what the draw function does inside. A free template computes zones and calls `drawContent` per zone; a fixed template draws bespoke shapes and text (or calls specific helpers) in fixed positions.

---

## New Slide Template Path

### Step 1 — Agree on the template

Ask the teacher, one question at a time:

- "What should we call it?" (becomes the JSON `template` name, e.g. `speech-bubbles-2`, and the function `drawSpeechBubbles2`)
- "What's the layout? In plain English — how many regions, roughly where?"
- "What is each region called?" (the slot names the architect will fill — `left`/`right`, `statement`/`speakers`, `cells`)
- For a free template: "Any fixed parts?" — arrows, connector lines, dividers that never change with the content. Most free templates have none.

### Step 2 — Read the conventions, then write the function

Read two or three existing templates close to the new one so it matches house style — a free one (e.g. `central-callouts-4.js`) and, if relevant, a fixed one (e.g. `speech-bubbles.js`). Then add `builder/src/templates/<name>.js`.

Every template follows this spine:

```js
const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');           // free templates pour content
const { FONT, COLOURS, FIT } = require('../styles');     // fixed templates draw their own

// ─── COORDINATES ──────────────────────────────────────────────
const COL_GAP = 0.45;   // every tunable number lives here, named, with a unit
// ─── END COORDINATES ──────────────────────────────────────────

function drawX(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);              // always the first line
  const bz = bodyZone(data.headerStyle);     // the body rectangle below the header
  // compute zones relative to bz.x / bz.y / bz.w / bz.h
  // free:  drawContent(pptx, slide, zone, data.slot, ctx);
  // fixed: slide.addShape(...) + slide.addText(...)
}

module.exports = { drawX };
```

Key rules and why they matter:

- **`drawHeader` is always the first line.** It places the blue title (or the starter Date/LO header) in the one approved position, so every slide in a deck shares a consistent top. Templates that re-declare their own header drift out of alignment and need re-tuning later. Override only if the teacher asks for a headerless slide (a full-bleed image, a divider).
- **Coordinates are relative to `bz`.** Deriving zones from the body rectangle means the template works under both header styles automatically and stays robust if the header height ever changes.
- **Put every tunable number in the `COORDINATES` block at the top, named, with its unit in a comment.** Phase 2 writes new values straight back into this block, so a value buried in the function body is a value that silently won't round-trip.
- **Free zones are polymorphic.** Give each zone a `class` (A, B, C, D, E-wide, E-narrow, F, G — see `references/templates.md` §1.3) and pour content with `drawContent`. The class sets the text size ceiling and limits which content types fit.

#### Separate shape, separate text (the rule that prevents overflow)

Whenever text sits inside a coloured card, rounded rectangle, or any box, draw **two elements**: an `addShape` for the container, then a separate `addText` positioned inside it. Do not put text on the shape via the `shape:` parameter.

```js
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.20, y: 2.20, w: 9.60, h: 3.20, rectRadius: 0.08,
  fill: { color: COLOURS.pureWhite }, line: { color: COLOURS.title, width: 3 }
});
slide.addText(data.text || '', {
  x: 0.35, y: 2.30, w: 9.30, h: 3.00,        // inset manually for padding
  fontFace: FONT, fontSize: 28, bold: true, color: COLOURS.body,
  align: 'center', valign: 'middle', margin: 0, fit: FIT
});
```

**Why** (hard-earned): the autofit step measures each text frame assuming `margin: 0` and standard padding. Merging shape and text into one element makes PowerPoint reserve internal padding the autofit step can't predict, and on narrow boxes the mismatch overflows the border. Separate elements keep the measurement honest. So: **always `margin: 0`**, inset the text coordinates by hand for visual padding, and use a lone `addShape` only for decorations that hold no text (arrows, lines, dividers).

#### Font sizes are ceilings, not fixed sizes

Every text element includes `fit: FIT` (which is `'shrink'`). The `fontSize` you set is the ceiling; the build's autofit step (`builder/scripts/fit_text_postprocess.py`, run automatically by `build.js`) measures the real text against the box and shrinks the size to whatever fits. So pick ceilings for the *typical* case, size boxes generously to give autofit room, keep body text `bold: true` (house style — bold Comic Sans reads better at shrunk sizes), and don't pre-compute sizes from content length. Use `fit: 'none'` only when the teacher wants a fixed size on a specific element, and name that element `objectName: 'NOFIT_<label>'` so the autofit step skips it.

### Step 3 — Register it

Edit `builder/src/templates/index.js`: add a `require` for the new function and an entry in the `TEMPLATES` map keyed by the JSON template name.

### Step 4 — Add it to the catalogue

Add the template to `references/templates.md` — under §2 if fixed, §3 if free — following the existing entries: a one-line purpose, the slots it accepts, and when to reach for it. This is what lets the slide-designer start using it. Match the concise style of the entries already there.

### Step 5 — Tune it visually → Phase 1

Drop into *Phase 1: Build* to render a demo and round-trip the coordinates.

---

## New Content Helper Path

A content helper renders one kind of content object inside any zone it's given. Build one when the teacher wants a content type the engine doesn't have yet (e.g. a tick-box checklist, a labelled diagram).

**The authoring detail lives in one place: `[PLUGIN_SOURCE_ROOT]/references/helper-authoring.md`.** Read it and follow its checklists — it carries the two rendering engines (slides *and* worksheets), every place each engine reads a helper, the house code rules, and the no-deadspace standard. That reference is the source of truth; the steps below are the visual-tuning wrapper around it. (The autonomous, build-from-a-description route to the same engine is the `helper-builder` agent, which reads the same reference.)

Two things teachers most often notice if they're missed, both covered in the reference:

- **Worksheets are a separate engine.** A helper children also meet on a printed sheet has to be built into `worksheet-html/` as well, not just the slide builder — otherwise it works on the board and silently doesn't exist on paper. Decide which engine(s) the helper serves before writing it.
- **No deadspace.** A figure should fill the slot it's given. Crop the drawing tight to its own bounding box and place it by its true proportions, so it renders as large and legible as the space allows rather than floating small inside empty margins — children read these from across the room. The `angle` helper is the worked example.

### Step 1 — Agree on the helper

Ask, one question at a time: what it's called (becomes the `type` string and `draw<Name>` function), what data it needs (e.g. bullets need `items`, a table needs `headers` and `rows`), roughly what it looks like, and whether children will meet it on the board, on a worksheet, or both.

### Step 2 — Build and wire it per the reference

Follow `references/helper-authoring.md`: mirror the closest sibling helper, write the renderer(s) for the engine(s) it serves, apply the no-deadspace principle to any figure, and wire it into every place each engine's checklist names (dispatcher, catalogue, and — where they apply — the pre-render step, row equaliser, and vocabulary-card gate on the slide side; the question helper, dispatcher and catalogue on the worksheet side).

### Step 3 — Tune it visually → Phase 1

---

## Phase 1: Build

### Step 1 — Pick the target

For a tune, read `references/templates.md` and show the teacher the registered templates (or helpers); ask which one. Then read its source file and note the `COORDINATES` (or constants) block — that's what Phase 2 will rewrite.

### Step 2 — Write a demo lesson

Create `<your-projects-folder>/lesson-demos/<name>-demo/demo.json` — a normal lesson file with a `slides` array containing one slide per template (or one slide exercising the helper). Use realistic, slide-filling content so the teacher's visual judgement is accurate; tiny placeholder strings mis-represent how much space elements really need. When extending a family, put **only the new variants** in the demo so approved work isn't accidentally re-tuned.

The lesson JSON shape (see `builder/test-lessons/` for examples):

```json
{
  "lessonName": "…", "yearGroup": "Year 4", "subject": "Science", "lo": "…",
  "slides": [
    { "template": "<name>", "headerStyle": "title", "title": "…", "...slots": "…" }
  ]
}
```

### Step 3 — Build it

```bash
node "[PLUGIN_SOURCE_ROOT]/builder/build.js" \
  "<your-projects-folder>/lesson-demos/<name>-demo/demo.json" \
  "<your-projects-folder>/lesson-demos/<name>-demo/output"
```

`build.js` runs the autofit step itself — look for a `Fit-text: …` line in the output, which confirms the demo behaves exactly like a real lesson build. If that line is missing, stop and investigate before telling the teacher it's ready. Also check the `warnings` line.

### Step 4 — Let the teacher see it

The template lives in the source, so any coordinate change you make takes effect on the next `build.js` run with no edit to the demo. To give the teacher a quick look without opening PowerPoint, you can render the slides to PNG via PowerPoint itself:

```python
import win32com.client, os
pptx = r"…/output/<Deck Name>.pptx"; outdir = r"…/render"; os.makedirs(outdir, exist_ok=True)
app = win32com.client.Dispatch("PowerPoint.Application")
pres = app.Presentations.Open(pptx, WithWindow=False)
for i, s in enumerate(pres.Slides, 1): s.Export(os.path.join(outdir, f"slide{i}.png"), "PNG", 1280, 720)
pres.Close(); app.Quit()
```

Then tell them in plain English: "The demo is at `...path...`. Open it, drag things until it looks right, then save and **close** the file (PowerPoint locks it while open), and say 'done'."

---

## Phase 2: Update

When the teacher says they've saved their changes, write the new coordinates back into the source.

### Step 1 — Unzip the saved deck

```bash
rm -rf /tmp/pptx_tpl && mkdir /tmp/pptx_tpl && \
cp "<your-projects-folder>/lesson-demos/<name>-demo/output/<Deck Name>.pptx" /tmp/pptx_tpl/ && \
cd /tmp/pptx_tpl && unzip -q "<Deck Name>.pptx"
```

### Step 2 — Parse the slide XML

Write `<your-projects-folder>/parse_tpl.py` and run it. It reads each `ppt/slides/slideN.xml` and prints, per shape, the position/size (converted from EMU to inches), fill, text colour, bold/italic/underline, font size, alignment, and a text snippet. Have it also write the full report to `<your-projects-folder>/parse_tpl_output.txt`, and read that file with the Read tool — terminal output truncates on long decks and that has caused missed changes.

```python
import xml.etree.ElementTree as ET, os
ns_a='http://schemas.openxmlformats.org/drawingml/2006/main'
ns_p='http://schemas.openxmlformats.org/presentationml/2006/main'
EMU=914400; buf=[]
def out(l=''): buf.append(l); print(l)
def parse(n):
    root=ET.parse(f'/tmp/pptx_tpl/ppt/slides/slide{n}.xml').getroot()
    out(f'\n=== SLIDE {n} ===')
    for sp in root.iter(f'{{{ns_p}}}sp'):
        x=sp.find(f'.//{{{ns_a}}}xfrm')
        if x is None: continue
        o=x.find(f'{{{ns_a}}}off'); e=x.find(f'{{{ns_a}}}ext')
        if o is None or e is None: continue
        X=round(int(o.get('x'))/EMU,3); Y=round(int(o.get('y'))/EMU,3)
        W=round(int(e.get('cx'))/EMU,3); H=round(int(e.get('cy'))/EMU,3)
        fill=sp.find(f'{{{ns_p}}}spPr/{{{ns_a}}}solidFill/{{{ns_a}}}srgbClr')
        fc=fill.get('val') if fill is not None else None
        t=' '.join([r.text for r in sp.iter(f'{{{ns_a}}}t') if r.text])[:70]
        out(f'  x:{X} y:{Y} w:{W} h:{H} | fill:{fc} | {t!r}')
slides='/tmp/pptx_tpl/ppt/slides'
for f in sorted(os.listdir(slides)):
    if f.startswith('slide') and f.endswith('.xml') and 'Rel' not in f:
        parse(int(f[5:-4]))
open('<your-projects-folder>/parse_tpl_output.txt','w',encoding='utf-8').write('\n'.join(buf))
```

### Step 3a — Audit on paper first (read-only)

Past runs lost the teacher's edits by skimming the parse output and silently dropping shapes. The fix is a table that forces every template element to be accounted for and every XML shape to be matched back. **Do not edit any code until the audit is printed in the chat.**

For each slide, print one table — one row per element the template draws (every `addShape` and `addText`, in source order):

```
=== SLIDE N — <name> ===
| # | Element        | Source coords                | XML match | XML coords                   | Verdict |
|---|----------------|------------------------------|-----------|------------------------------|---------|
| 1 | bubble         | x:0.20 y:2.20 w:9.60 h:3.20  | YES       | x:0.20 y:2.20 w:9.60 h:3.20  | SAME    |
| 2 | speechText     | x:0.35 y:2.30 w:9.30 h:3.00  | YES       | x:0.40 y:2.35 w:9.20 h:2.90  | CHANGED |

Non-demo XML shapes on this slide: 2
SAME + CHANGED rows: 2
Unmatched XML shapes: 0
```

Rules: a match needs a specific, unambiguous XML shape, else mark it NONE → **DELETED**. Any coordinate differing (even 0.01") → **CHANGED**. All four identical → **SAME**. Any green demo-only indicator box does not go in the table. If *Unmatched XML shapes* is not zero, **stop** — print the stray shape's coords and ask the teacher whether it's a resize of your best guess, a new element, or one to ignore. Fix the table, then continue.

### Step 3b — Apply the changes

Once every slide's audit is printed and unmatched count is zero: for each **CHANGED** row, update the value in the template's `COORDINATES`/constants block (and any static property — colour, size, alignment — that the parse shows differs). For each **DELETED** row, remove that element. Leave **SAME** rows alone. Keep the catalogue entry in `references/templates.md` in step if a slot changed.

### Step 3c — Verify

Re-read the template and count its `addShape` + `addText` calls. It must equal the summed SAME + CHANGED count from the audit. If not, reopen the audit.

### Step 4 — Clean up

Delete `<your-projects-folder>/parse_tpl.py` and `parse_tpl_output.txt`.

### Step 5 — Retest

Rebuild the demo (Phase 1 Step 3) and confirm the `Fit-text:` line appears and warnings are clean.

---

## Finish every run

1. **Bump the plugin version.** Edit `[PLUGIN_SOURCE_ROOT]/.claude-plugin/plugin.json` and `[PLUGIN_SOURCE_ROOT]/.codex-plugin/plugin.json`, raising both `version` values to the same next minor version (e.g. `2.1.0` → `2.2.0`). The architect reads the plugin from a version-pinned cache, so without a bump a new template or a coordinate change stays invisible on the next lesson build until the cache expires. The bump busts the cache.
2. **Commit and push.** `teaching-plugins` is its own git repo and deploys to the marketplace from `master`. Commit the changed files and push, so the marketplace copy syncs.
3. **Tell the teacher in plain English** what changed and why it matters to them — what moved where, not raw coordinates. For a brand-new template, confirm it's registered and in the catalogue so the architect can use it.

## Notes

- Keep changes scoped to the one template or helper the teacher picked unless they ask otherwise.
- The demo folder at `<your-projects-folder>/lesson-demos/` is ephemeral and safe to delete between runs.
