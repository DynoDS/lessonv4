"""Release 7A (4.2.293), step 5's test: the wall's refusal of an over-long item
still names the card, the item, its length and the budget ("62 is the most that
fits"), and now leads with making room and says a shortened item stays a whole
sentence (SA decision 7, PF decision 22's wording half). The old "Cut it to 62
characters or fewer" is asserted gone."""
from _patch import replace_once

TEST = "working-wall-html/test/doc-claims.test.js"

replace_once(TEST, '''      // Which card, which item, how long it is, and what to cut it to. Without
      // all four the single permitted repair is aimed at nothing, which is how
      // two runs in a row shipped with no wall at all.
      assert.match(message, /workedExample "Improve a lunch"/, "the refusal must name the card");
      assert.match(message, /item 2 is 82 characters/, "the refusal must name the item and its length");
      assert.match(message, /Cut it to 62 characters or fewer/, "the refusal must name the target");''', '''      // Which card, which item, how long it is, and the budget it has to come
      // under. Without all four the single permitted repair is aimed at
      // nothing, which is how two runs in a row shipped with no wall at all.
      assert.match(message, /workedExample "Improve a lunch"/, "the refusal must name the card");
      assert.match(message, /item 2 is 82 characters/, "the refusal must name the item and its length");
      assert.match(message, /62 is the most that fits/, "the refusal must name the budget");
      // Room before words, and a whole sentence when words must change
      // (release 7A: the wall keeps the lesson's sentences whole).
      assert.match(
        message,
        /needs room before its words change: if the card carries a picture, take it off unless the words need it/,
        "the refusal must lead with making room"
      );
      assert.match(message, /to a whole sentence with the same meaning and never a clipped phrase/, "a shortened item stays a whole sentence");
      assert.doesNotMatch(message, /Cut it to/, "the refusal no longer tells the designer to cut first");''')
print("wall test follows the message")
