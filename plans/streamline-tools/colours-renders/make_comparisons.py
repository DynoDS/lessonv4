"""Side-by-side pictures of the colours release for the teacher: before on the
left, after on the right, one row per page. Reads the rendered pages beside
this file and writes compare-slides.png, compare-wall.png and compare-sheet.png
here (printed before writing)."""
import glob
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent


def font(size):
    for name in ("comic.ttf", "arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def pairs_sheet(pairs, out, width=900, title=""):
    rows = []
    for before, after, label in pairs:
        b = Image.open(before).convert("RGB")
        a = Image.open(after).convert("RGB")
        scale = width / max(b.width, a.width)
        b = b.resize((int(b.width * scale), int(b.height * scale)))
        a = a.resize((int(a.width * scale), int(a.height * scale)))
        rows.append((b, a, label))
    head = 100
    gap = 24
    label_h = 34
    height = head + sum(max(b.height, a.height) + label_h + gap for b, a, _ in rows)
    sheet = Image.new("RGB", (width * 2 + gap * 3, height), "white")
    draw = ImageDraw.Draw(sheet)
    draw.text((gap, 14), title, fill="black", font=font(30))
    draw.text((gap, head - 34), "Before", fill="#555555", font=font(24))
    draw.text((gap * 2 + width, head - 34), "After", fill="#555555", font=font(24))
    y = head
    for b, a, label in rows:
        draw.text((gap, y + 4), label, fill="#333333", font=font(20))
        y += label_h
        sheet.paste(b, (gap, y))
        sheet.paste(a, (gap * 2 + width, y))
        y += max(b.height, a.height) + gap
    print(f"writing {out}")
    sheet.save(out)


slides = sorted(glob.glob(str(HERE / "demo" / "before-png" / "*-page-*.png")))
labels = ["A question and its short task, a job that names what to use (task-blue, his answer of 25 September); advice, black; a word bank's taught words, green; the header cue stays black",
          "A worked example (the method frame), purple; a short task (task-blue)",
          "A mistaken worked row (Sam's), purple digit by digit, the changed digit still ringed; a callout stating what is true, black",
          "A table's deciding word, bold not blue",
          "A Teach slide's prepared model, purple (a teach layout takes worked-purple now); its sticky fact purple as before",
          "A My Turn: the short task (task-blue) and the prepared worked lines (worked-purple)",
          "A worked example set out as steps, purple words and numbers; its question and short task on one blue line"]
pairs_sheet([(b, b.replace("before-png", "after-png"), labels[n]) for n, b in enumerate(slides)],
            HERE / "compare-slides.png", title="The board: before and after")

wall = []
for name, label in (("full-set", "Worked example, sticky fact, sentence stem, misconception"),
                    ("paired-stems", "A sentence stem with its modelled line"),
                    ("vocab-chips", "Vocabulary chips"),
                    ("demo-vocab", "A vocabulary card, and a sticky fact whose taught word is green without braces"),
                    ("demo-section", "A section of drawings (a right result green, Sam's mistake purple), and a reference table"),
                    ("heroCallouts-a3", "A photograph with two groups"),
                    ("causeCards-a3", "Cause cards"),
                    ("photoMapOverview-a3", "A local-area overview")):
    for before in sorted(glob.glob(str(HERE / "wall" / "before-png" / name / "*-page-*.png"))):
        wall.append((before, before.replace("before-png", "after-png"), label))
pairs_sheet(wall, HERE / "compare-wall.png", width=700, title="The working wall: before and after")

pairs_sheet([(str(HERE / "sheet" / "before-png" / "worksheet-page-01.png"),
              str(HERE / "sheet" / "after-png" / "worksheet-page-01.png"),
              "The method frame on paper: a worked one purple, the child's empty ones as before")],
            HERE / "compare-sheet.png", width=800, title="The worksheet: before and after")

real = []
for name, label in (("history-4", "History: Lord Shaftesbury (photograph with two groups)"),
                    ("digestive", "Science: parts of the digestive system (labelled diagram)"),
                    ("maths-14", "Maths: negative numbers (a section of drawings)"),
                    ("tooth", "Science: how a tooth decays (sticky fact)"),
                    ("victorian", "History: Victorian working conditions (worked example)")):
    for before in sorted(glob.glob(str(HERE / "real-walls" / "before-png" / name / "*-page-*.png"))):
        real.append((before, before.replace("before-png", "after-png"), label))
if real:
    pairs_sheet(real, HERE / "compare-real-walls.png", width=700, title="Five of his real walls: before and after")
