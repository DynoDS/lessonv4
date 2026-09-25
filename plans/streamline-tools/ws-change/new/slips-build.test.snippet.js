
test("his digit-box sheet keeps books by what it holds", () => {
  // Settled item o of the worksheets topic (4.2.290), his 19 September ruling:
  // one digit box does not make a write-on sheet. The reason is in his own
  // words and repeats nothing of the engine's.
  const { stdout } = build({
    meta: { lesson: "Rounding", yearGroup: 4 },
    sheets: {
      below: sheet("sheet"),
      expected: {
        ...sheet("books", "Write the missing digit in the box: 4,_50."),
        recordingReason: "Books: one digit box is copied into a book in seconds.",
      },
    },
    answerKey,
  });
  assert.doesNotMatch(stdout, /^RECORDING_CHANGED: /m);
  assert.match(stdout, /^RECORDING: Expected - books, /m);
});

test("a books sheet looked at again keeps books through the build", () => {
  const { stdout } = build({
    meta: { lesson: "Rounding", yearGroup: 4 },
    sheets: {
      below: sheet("sheet"),
      expected: { ...sheet("books", "Circle the number that rounds to 2,700."), recordingLookedAgain: true },
    },
    answerKey,
  });
  assert.doesNotMatch(stdout, /^RECORDING_CHANGED: /m);
  assert.match(stdout, /^RECORDING: Expected - books, /m);
});
