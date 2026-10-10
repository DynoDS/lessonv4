# Image Scout: Choosing the Picture

Read this before you accept any picture. The checks in your agent file say whether a candidate shows the right thing. This says which of the right pictures to take, and what to do when the best one has something wrong with it.

A candidate your viewer refuses to open: read `picture-you-cannot-see.md`, beside this file, before judging it.

## An order of preference, never a refusal

The teacher looked at the pictures one test run let through: the stars and stripes showing "a strong wind" in a Great Fire of London lesson, a modern York street with shop signs beside "London in 1666", a museum slate with its name handwritten on the rock, an archive's stamp in the corner of a river photograph. His ruling on every one was the same: better fixed, and never worth a blank. He can teach from an imperfect picture and cannot teach from an empty card.

So nothing in this file turns a found picture into `unsatisfied` or `omitted`. It makes a candidate second choice, which means you keep it in hand, look further for a better one, and deliver the best you have when the looking is done. The subject, evidence and safety checks in your agent file, and the stand-in reference's one refusal, are unchanged.

## What makes a picture second choice

- **Anything in the entry's `avoid` list.** The lesson's designer wrote it for this picture, and it applies to a photograph you find exactly as it does to one you generate.
- **It belongs to another place or time than the lesson.** The class is in a UK primary school, so a picture that is only there to show something else (a flag for wind, a bus for a journey, a coin for saving) should look like home: a Union Jack, not another country's flag. When the lesson is about a place, the picture is of that place. When it is about the past, a picture made at the time (a drawing, a painting, an engraving, an old photograph) fits better than a modern photograph of something that survives, though the modern one is still a picture worth having.
- **Something added on top of the subject:** a watermark, a signature, an archive stamp, a caption strip, a handwritten label, a ruler or scale bar. A small collection sticker on a museum specimen does not count; the teacher ruled those out as a fault.
- **It contradicts what the lesson says about it.** When the constraint says the picture stands for a named child, prefer one that could be any child (face not shown) to one that plainly is not that child.

## What to do with a second-choice candidate

1. **A clean picture that teaches as well always wins.** Look down the summary's `considered` list and run the compiled steps you have not yet run before settling. "As well" is the test: a stamped aerial view that shows how wide the estuary is beats a clean shore view that does not, so do not trade the teaching for tidiness.
2. **Where a picture may be generated** (`fallback_action: ai` with a prompt file) and every step found only second choices, generate. The prompt already carries the `avoid` list. Keep whichever of the two teaches better.
3. **A mark at the edge is trimmed off.** Preview the cut and open the preview:

   ```bash
   "[PYTHON]" "<PLUGIN_ROOT>/scripts/picture_trim.py" preview --source "<candidate file>" --output "<WORK_ROOT>/trim-preview.jpg" --bottom 0.3
   ```

   `--top`, `--bottom`, `--left` and `--right` are fractions of the picture. Take the trim when the mark is gone, every evidence item is still in frame and the picture does not look cut off. Then add `"trim": {"bottom": 0.3}` to the result row, and the finaliser cuts the published file the same way. If the trimmed picture looks wrong, use the picture whole.
4. **Otherwise keep it and say so.** Add `"blemish"` to the row: one plain sentence, at most 200 characters, naming what a teacher will see, such as "The archive's stamp is in the bottom left corner." or "The flag is the American flag." The run report prints it. Write one only for something he would notice on the board, and leave it off a picture you trimmed clean.

`trim` and `blemish` go on a `sourced` or `generated` row only, beside the usual fields. They are also what lets you go back to an earlier step's candidate after searching further: the validator refuses a later search after a clean winner, and accepts one after a picture whose row says what is wrong with it.

## Pictures shown side by side

When several entries in your assignment are one set (the same teaching job for each, five rocks to compare, three coins), choose them with the set in view: the same collection, a similar background, a similar distance. Museum and university collections photograph whole series one way, so a second query naming the collection that gave you the first picture often finds the rest. A matching set is a nicety the teacher likes and does not require. It is never a reason to refuse a picture, to generate one, or to write a `blemish`.
