"""Release 7A (4.2.293), step 5c's tests: the budget test learns the picture
giving way (62 characters beside a picture at its full share, 72 once it has
shrunk a little, 73 refused; 106 and 107 without a picture unchanged), the
refusal test learns the new order, and a unit test holds the fitter's first
move: a card whose words fit keeps the picture's full share, the picture gives
up at most a little, and a card with no side picture or a dominant one is left
alone."""
from _patch import replace_once

TEST = "working-wall-html/test/doc-claims.test.js"

replace_once(TEST, '''  assert.equal(await itemOfLengthBuilds(dir, 62, true), true, "a 62-character item on a picture card should build");
  assert.equal(await itemOfLengthBuilds(dir, 63, true), false, "63 characters should be one over the picture-card budget");''', '''  assert.equal(await itemOfLengthBuilds(dir, 62, true), true, "a 62-character item on a picture card should build");
  // His order (26 September 2026): the picture gives up a little width before
  // anything else moves, so a card a few characters over keeps its picture.
  assert.equal(await itemOfLengthBuilds(dir, 72, true), true, "a 72-character item should build with the picture a little smaller");
  assert.equal(await itemOfLengthBuilds(dir, 73, true), false, "73 characters should be over even with the picture a little smaller");''')
replace_once(TEST, '''    assert.ok(text.includes("106 characters"), `${path.basename(doc)} no longer quotes the 106-character budget`);
  }
});''', '''    assert.ok(text.includes("106 characters"), `${path.basename(doc)} no longer quotes the 106-character budget`);
  }
  assert.ok(
    read(path.join(refDir, "working-wall-preferences.md")).includes("about 72 characters once the build has shrunk the picture a little"),
    "working-wall-preferences.md no longer quotes the budget once the picture gives way"
  );
});

test("a card keeps its picture's full share when its words fit, and the picture gives way only a little", () => {
  const { panelFractionThatFits, PICTURE_GIVES_WAY } = require("../src/visuals");
  assert.deepEqual(PICTURE_GIVES_WAY, [0.65, 0.7]);
  assert.equal(panelFractionThatFits(0.6, () => true), 0.6, "words that fit leave the picture its full share");
  assert.equal(panelFractionThatFits(0.6, (f) => f >= 0.65), 0.65, "the smallest step that fits is taken");
  assert.equal(panelFractionThatFits(0.6, (f) => f >= 0.7), 0.7);
  assert.equal(panelFractionThatFits(0.6, () => false), 0.6, "past a little, the picture keeps its share and the build refuses");
  assert.equal(panelFractionThatFits(1.0, () => false), 1.0, "a card with no side picture is left alone");
  assert.equal(panelFractionThatFits(0.32, () => false), 0.32, "a picture made dominant is left alone");
});''')
replace_once(TEST, '''        /needs room before its words change: if the card carries a picture, take it off unless the words need it/,''',
             '''        /needs room before its words change: any picture beside it has already given up a little width, so next carry a list over a second card, and take the picture off only when nothing else fits/,''')
print("wall order tests written")
