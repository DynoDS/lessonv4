"""Record the read-back of the success-criteria decisions and his one
correction (23 September 2026)."""
from pathlib import Path

L = Path(r"C:\Users\Daniel\Projects\lessonv4\plans\2026-09-23-success-criteria-ledger.md")
t = L.read_text(encoding="utf-8")
anchor = "## Decisions for Daniel\n"
assert t.count(anchor) == 1 and "### Read back" not in t

block = """### Read back, and settled (23 September 2026)

His two questions were answered first: the list does not fit when long, clear
steps meet the 18 point floor and the half-slide panel at once (short steps fit,
six or seven of them); and "doesn't help" was his own 13 September words on
`Find the neighbouring multiples.`, whose rewrite was `Find the 10s or 100s each
side of your number.`. He was then asked to name any reading to change, and
changed one:

- "for number 12 same move right is a fine step it's short and snappy and it
  makes sense" (the example was in decision 15). Settled: a short question step
  such as `Same? Move right.` is fine when it tells the child what to do next or
  what to look for; so is an `If...` sentence. This turns round the 13 September
  line that listed `Same? Move right.` as a slogan to rewrite, and the voice
  guide's and the skill route's examples of it as a fault.

The other readings stand as read to him:
1. Every taught vocabulary word is green, every time, including when the word
   is also a coloured part of the picture; the designer still colours one or two
   other important words.
2. A condition that is part of a step stays in the step; extra knowledge goes to
   sticky knowledge or the teaching.
3. Never only some of a method's steps; if the list does not fit, the layout
   changes, never the list, and the build's message stops offering "fewer
   criteria".
4. As suggested.
5. On the wall, the exact same steps; the designer still decides whether a wall
   is made.
6. Criteria are what a stuck child looks at and uses to do the task, so in an
   explaining or writing lesson sentence stems count as criteria, inside or
   beside the steps.
7. The seven examples are rewritten as things a child can look at and use.
8. No success criteria on worksheets (the Below-sheet exception in 3 goes with
   it).
9. A two-sentence step is not automatically a fault; a second sentence that only
   names what the step produced goes, so his rounding example loses `That's the
   ten below.`
10. As suggested: whatever home the designer reads most clearly.
11. All seven corrected; the build never withholds a deck over the criteria.
12. The wall never rewords a step; it makes room (no picture, or two cards).
13. The slide designer never turns a table into lines and never reports back; it
    makes it fit. How to fit a very large list (perhaps a new layout) is a
    separate investigation after this topic, not started without his word.
14. As suggested. 16. As suggested.

"""
L.write_text(t.replace(anchor, block + anchor), encoding="utf-8")
print("recorded")
