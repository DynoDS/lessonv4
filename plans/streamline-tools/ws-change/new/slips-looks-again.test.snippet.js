test("a books sheet whose words look as if they need the printed page is flagged to look again", () => {
  // The worksheets topic, settled item o (4.2.290): the word list is a prompt
  // to look again, not a verdict, so it is an advisory and never a problem.
  for (const text of [
    "Circle the number that rounds to 3,000.",
    "Mark 2,748 on the number line.",
    "Label the parts of the plant.",
    "Fill in the table.",
  ]) {
    const worksheet = { sheets: { expected: sheet("books", text) } };
    assert.deepEqual(signals(worksheet, { required: true }), [], text);
    const advisories = recordingAdvisories(worksheet);
    assert.deepEqual(advisories.map((a) => `${a.sheet}:${a.signal}`), ["expected:RECORDING_LOOK_AGAIN"], text);
    assert.match(advisories[0].message, /Look at that question against references\/books-or-sheet\.md/);
    assert.match(advisories[0].message, /"recordingLookedAgain": true/);
    assert.match(advisories[0].message, /Never reword the question\./);
  }
});

test("words about a box are judged by what the sheet holds, never by the reason's words", () => {
  // His ruling, 19 September 2026: one digit box does not make a write-on
  // sheet. A box in the question's own sentence, or on a sheet whose only
  // helpers are sentences and number sentences, is copied into a book in
  // seconds; the reason
  // can say so in his own words and nothing has to repeat the engine's.
  const reason = "Books: one digit box is copied into a book in seconds.";
  for (const text of [
    "Write the missing digit in the box.",
    "Write the missing digit in the box: 4,_50.",
    "Fill in the missing numbers.",
    "Write the missing numbers in the boxes.",
  ]) {
    const worksheet = { sheets: { expected: { ...sheet("books", text), recordingReason: reason } } };
    assert.deepEqual(recordingAdvisories(worksheet, { includeAnswered: true }), [], text);
  }
  // A box in a printed figure is still flagged, whatever the reason says.
  const figure = (text) => ({
    sheets: {
      expected: {
        ...sheet("books"),
        recordingReason: reason,
        zones: {
          a: {
            stack: [
              { helper: "instruction", text },
              { helper: "part-whole", question: true, whole: { value: 10 }, parts: [{ blank: true }, { value: 4 }] },
            ],
          },
        },
      },
    },
  });
  assert.equal(recordingAdvisories(figure("Write the missing numbers in the boxes.")).length, 1);
  // Its own blank in the sentence keeps a box quiet even beside a figure.
  assert.equal(recordingAdvisories(figure("Write the missing digit in the box: 4,_50.")).length, 0);
});

test("the sheet saying it was looked at again quiets the prompt; the reason's words do not", () => {
  const text = "Circle the number that rounds to 3,000.";
  const named = { sheets: { expected: { ...sheet("books", text), recordingReason: "Books: no circle is needed in a book." } } };
  assert.equal(recordingAdvisories(named).length, 1, "a reason that merely contains the word answers nothing");
  const looked = { sheets: { expected: { ...sheet("books", text), recordingLookedAgain: true } } };
  assert.deepEqual(recordingAdvisories(looked), []);
  const all = recordingAdvisories(looked, { includeAnswered: true });
  assert.equal(all.length, 1);
  assert.equal(all[0].answered, true);
  assert.deepEqual(
    signals({ sheets: { expected: { ...sheet("books", text), recordingLookedAgain: "yes" } } }),
    ["expected:RECORDING_INVALID"]
  );
});

test("the prompt never reaches a sheet marked sheet", () => {
  const worksheet = { sheets: { expected: sheet("sheet", "Circle the number that rounds to 3,000.") } };
  assert.deepEqual(recordingAdvisories(worksheet, { includeAnswered: true }), []);
});
