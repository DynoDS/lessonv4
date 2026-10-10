# A picture you cannot see

Read this when your viewer refuses a picture you opened: an error where the
picture should be, or a message that an image could not be processed.

## What has happened

It is the file's byte layout, not its size and not what it shows. The plugin's
own tools read some files that a worker's viewer refuses, so a picture can be
downloaded, checked and printed correctly and still be one you cannot look at.
Every picture is now rewritten in plain form when it is downloaded and again
when it is published, so this should be rare; a picture from before that
change, or one that reached the folder another way, can still do it.

Two things follow that are easy to get wrong.

- **One refused picture takes others with it.** While it sits in your view, the
  pictures you opened beside it, and any you open afterwards, are refused too.
  A good picture refused in the same batch is not a second bad file. Once the
  bad one is dealt with, open the others again.
- **Shrinking is not the cure.** A smaller copy opens because it was saved
  afresh. The published picture is the right size as it is: leave it, and
  every file in the lesson's picture folders, exactly where and as it is.

## What to do, in this order

**1. Make a fresh copy and look at that.** Write it to your scratchpad, never
into the lesson folder:

```
python "[PLUGIN_ROOT]/scripts/picture_plain.py" copy --source "<the picture>" --output "<your scratchpad>/<name>.jpg"
```

Open that copy on its own, with no other picture in the same step, so a
refusal can only be about this one. What you see in the copy is the picture:
judge it as you would have judged the original, and keep naming the original
file in whatever you write. The copy is only for your eyes.

**2. If the copy is refused too, the picture counts as lost.** Nobody may build
teaching on a picture nobody has looked at. A lesson was once rebuilt round a
photograph its designer could not open, and the plant chosen to teach `stem`
from turned out to be a bush with no stem in view (7 October 2026). What that
means depends on what you are there to decide.

- **You choose which picture the teaching stands on** (the Lesson Designer on a
  picture revision, the Adaptation Designer choosing a stimulus). Treat it as
  a picture that never arrived: ask for a different one through the route you
  already use for a lost picture, and if that route is spent, plan the beat
  without it.
- **You are judging candidates** (the Image Scout). An unseen candidate cannot
  be accepted. Take the next one.
- **You place a picture someone else already chose** (slides, worksheets, the
  working wall, stick-in sheets, label dots). Use it only where the design
  already put it, and make no new decision that depends on what is in it: no
  new dot position, crop, caption or question about its contents. A label dot
  you cannot check is one you report as unchecked, not one you guess.

**3. Say so.** Name each picture you could not see, and what you did instead,
in your completion report, so the teacher hears it before the lesson and not
from the board.
