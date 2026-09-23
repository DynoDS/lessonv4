"""Record Daniel's second-round answers of 23 September 2026 (his replies to
the read-back), word for word, under each ledger's "Decisions taken" block."""
from pathlib import Path

PLANS = Path(__file__).resolve().parents[1]

RANDOM_SLIDE = '''"I don't know if I need to say more. Basically, what I do sometimes is I go
   to a random slide and I read it. I better understand what it's doing and
   why. And if not, I better be able to go back one or two slides and go, oh,
   okay, yeah, that's why it's doing it. That's the story. It should never be
   just introducing something completely off that f not even off, because
   obviously the lesson designer does it for a reason, but it just feels
   random. And to ch children, it just feels random. Children need to be there
   with you, learning, not listening to something completely random and
   trying to understand that. And it's not always just anything abstract.
   Maybe that's too much of a constraint. Like the in that history one... The
   Elizabeth First Order just appeared. There was nothing about who Elizabeth
   First was. There was nothing about uh, what an order is or that governments
   use orders and, and what they're for. There was nothing to do that. It's
   just bang, historical source and questions about it. And for a year nine
   class, sure, they know what an order probably is. But for a year one, two,
   three, four, five, six class... They're just met with it for the first time
   that there's some magical piece of writing called an order that someone
   from history made. That's all they get from that, really. They don't get,
   oh, an order is this, and they're written because of this, and the
   government want to do this, and the government are these kinds of people
   who make these kinds of decisions. They don't get any of that. They just
   see there's some words that, that the teacher's called order."'''

A8_WORDS = '''"Really similar to what we were just talking about About the abstract thing
   And it's not like explaining these words through a vocabulary slide. It's
   just the way you word it. Like rather than just going, Elizabeth First said
   this. You, you set the scene. You say Elizabeth First was the, I'm guessing,
   the Queen of England at that time. And she thought this. So she wrote
   something called an order. This is it. Or an order is something, blah,
   blah, blah, blah, blah. Then show the order. It just makes sense now. And
   the thing about the steam engine, it was just so random. There were, there
   were two fairgrounds. And then it's mentioning one's powered by steam
   engine. It's like, okay, give me some context around that. One's powered by
   steam steam engine, which is a da da da da da da da."'''

AK = f'''### Second round (23 September 2026), his replies to the read-back

- 1. "Yes, that's right. The speaker notes are just the script to teach that
  slide. They're not something separate. I've said time and time again that
  most of the time a teacher does not read the speaker notes. So the board has
  to show the teaching. And whatever. But we we need to stop keeping them as a
  combined thing." Settled: the notes are the script for teaching that slide;
  most of the time a teacher does not read them, so the board shows the
  teaching; nothing is taught by the notes and the board together.
- 2. "Yep, that's fine." Settled as read back.
- 7. "Agree." Settled as read back.
- 8. {A8_WORDS}
  Settled, and wider than the reviewer's list: the fix is in how the teaching
  is worded, not a vocabulary card. A name, source or thing arrives with its
  context in the sentence that brings it in ("Elizabeth I was the Queen of
  England at that time. She was worried about ... so she wrote something
  called an order. This is it."; "one was powered by a steam engine, which is
  a ..."). The reviewer's list is repaired as suggested, and the reviewer reads
  every lesson for it. His Teach then Do decision 3 reply below states the
  test both topics share.
- His test, given in his Teach then Do decision 3 reply (recorded in full in
  that ledger): read any slide on its own and understand what it is doing and
  why, or go back one or two slides and see why. Nothing arrives feeling
  random, to him or to the children; it is not only about abstract ideas.

'''

TD = f'''### Second round (23 September 2026), his replies to the read-back

- 2. "Agree." Settled as read back.
- 3. "Yes." Then, in full:
  {RANDOM_SLIDE}
  Settled, with the read-back widened: scene-setting is not only for
  something abstract ("Maybe that's too much of a constraint"). The test is
  his random-slide test: any slide read on its own shows what it is doing and
  why, or going back one or two slides shows it. Nothing arrives feeling
  random to the children. The rest of the read-back stands (its own slide if
  that makes sense, or the opening of the first teaching slide; never a
  made-up task after it; his reason goes into the rule).
- 4. "Agree" Settled as read back: a discovery lesson may discover two things,
  one task revealing both (then teach and use each in turn) or a second task
  building on the first; the checking program changes to allow it.
- 10. "Agree" Settled.

'''

for name, block in (("assumed-knowledge", AK), ("teach-then-do", TD)):
    path = PLANS / f"2026-09-22-{name}-ledger.md"
    text = path.read_text(encoding="utf-8")
    assert "### Second round (23 September 2026)" not in text, name
    assert text.count("## Decisions for Daniel\n") == 1, name
    text = text.replace("## Decisions for Daniel\n", block + "## Decisions for Daniel\n", 1)
    path.write_text(text, encoding="utf-8")
    print("recorded", name)
