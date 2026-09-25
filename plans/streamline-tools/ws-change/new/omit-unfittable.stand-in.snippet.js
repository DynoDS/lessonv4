// The worksheets release (4.2.290): a Below or Greater Depth sheet the build
// cannot make at the last resort, for any fault, gets the Expected sheet in its
// place, flagged. The teacher's "yes" (25 September 2026) was for a sheet sent
// back to be redesigned that still cannot be fixed; the lead passed it on for
// any sheet the build cannot make. The exceptions: an Expected sheet the page
// cannot hold is omitted, one the browser finds clipped refuses the pack, and
// then nothing stands in.
const unfittableNamedLayout = () => ({
  layout: "full",
  orientation: "portrait",
  zones: { a: unfittableSheet().zones[0] },
});

const EXPECTED_ANSWER = "−6, −2, 0, 1";
const timesInKey = (key) => key.split(EXPECTED_ANSWER).length - 1;

for (const [how, greaterDepth] of [
  ["left to the engine", unfittableSheet],
  ["in a named layout", unfittableNamedLayout],
]) {
  test(`with the flag, the Expected sheet stands in for a Greater Depth sheet the page cannot hold (${how})`, () => {
    const spec = specWithOneUnfittable();
    spec.sheets.greaterDepth = greaterDepth();
    const { stdout, files, key } = buildWith(spec, ["--omit-unfittable"]);

    assert.match(
      stdout,
      /^SHEET_STANDS_IN: Greater Depth - the Expected sheet stands in for Greater Depth, .*: the page cannot hold the Greater Depth sheet \(/m
    );
    assert.doesNotMatch(stdout, /SHEET_OMITTED/);
    assert.doesNotMatch(stdout, /BUILD_DIAGNOSTIC: \{"signal":"SHEET_STANDS_IN"/);
    assert.match(stdout, /^Built: .*Omission - Worksheets\.pdf$/m);
    assert.match(stdout, /^Sheets: Expected, Greater Depth$/m);

    // The pupil pack holds a sheet for every tier, and the key covers the
    // Greater Depth tier with the Expected answers and says why.
    assert.ok(files.includes("Omission - Worksheets.pdf"));
    assert.ok(files.some((f) => /greaterDepth\.html$/.test(f)));
    assert.match(key, /The Expected sheet stands in here for the Greater Depth sheet, which the page could not hold\./);
    assert.equal(timesInKey(key), 2);
  });
}

test("an Expected sheet the page cannot hold is still omitted, and nothing stands in for it", () => {
  const spec = specWithOneUnfittable();
  spec.sheets = { below: fittingSheet("Put −3 and 2 in order, smallest first."), expected: unfittableSheet() };
  spec.answerKey = { below: [{ question: 1, answer: "−3, 2" }], expected: [{ question: 1, answer: "Various." }] };
  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);

  assert.match(stdout, /^SHEET_OMITTED: Expected - /m);
  assert.match(stdout, /SHEET_OMITTED_SUMMARY: delivered below; omitted expected/);
  assert.doesNotMatch(stdout, /SHEET_STANDS_IN/);
  assert.ok(files.some((f) => /below\.html$/.test(f)));
  assert.ok(!files.some((f) => /expected\.html$/.test(f)));
});

for (const [how, unfittable] of [
  ["left to the engine", unfittableSheet],
  ["in a named layout", unfittableNamedLayout],
]) {
  test(`when the Expected sheet cannot fit either, a Below sheet the page cannot hold is omitted, not stood in for (${how})`, () => {
    const spec = specWithOneUnfittable();
    spec.sheets = {
      below: unfittable(),
      expected: unfittable(),
      greaterDepth: fittingSheet("Write a number between −5 and −1."),
    };
    spec.answerKey = {
      below: [{ question: 1, answer: "Various." }],
      expected: [{ question: 1, answer: "Various." }],
      greaterDepth: [{ question: 1, answer: "−3" }],
    };
    const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);

    assert.doesNotMatch(stdout, /SHEET_STANDS_IN/);
    assert.match(stdout, /SHEET_OMITTED_SUMMARY: delivered greaterDepth; omitted below, expected/);
    assert.ok(files.some((f) => /greaterDepth\.html$/.test(f)));
  });
}

test("an Expected sheet in a named layout the page cannot hold, beside a Greater Depth sheet too tall: no stand-in is announced", () => {
  // The second check's mixed case: the Expected sheet is measured the same way
  // before any stand-in is decided, so none is announced and then dropped.
  const spec = specWithOneUnfittable();
  spec.sheets = {
    below: fittingSheet("Put −3 and 2 in order, smallest first."),
    expected: unfittableNamedLayout(),
    greaterDepth: unfittableSheet(),
  };
  spec.answerKey = {
    below: [{ question: 1, answer: "−3, 2" }],
    expected: [{ question: 1, answer: "Various." }],
    greaterDepth: [{ question: 1, answer: "Various." }],
  };
  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);

  assert.doesNotMatch(stdout, /SHEET_STANDS_IN/);
  assert.match(stdout, /^SHEET_OMITTED: Greater Depth - /m);
  assert.match(stdout, /^SHEET_OMITTED: Expected - /m);
  assert.ok(files.some((f) => /below\.html$/.test(f)));
});

test("a Below sheet with a word bank typed into its question gets the Expected sheet at the last resort, and still refuses without it", () => {
  const spec = specWithOneUnfittable();
  spec.sheets = {
    below: fittingSheet("Word bank: less, more. Which is less, −3 or 2?"),
    expected: spec.sheets.expected,
  };
  spec.answerKey = { below: [{ question: 1, answer: "−3" }], expected: spec.answerKey.expected };

  const plain = buildWith(spec);
  assert.match(plain.stdout, /WORD_BANK_INLINE/);
  assert.deepEqual(plain.files, []);

  const { stdout, files, key } = buildWith(spec, ["--omit-unfittable"]);
  assert.match(stdout, /^SHEET_STANDS_IN: Below - .*: the Below sheet cannot be built \(WORD_BANK_INLINE/m);
  assert.ok(files.includes("Omission - Worksheets.pdf"));
  assert.match(key, /The Expected sheet stands in here for the Below sheet, which could not be built\./);
  assert.equal(timesInKey(key), 2);
});

test("a Below sheet whose picture cannot be read gets the Expected sheet at the last resort", () => {
  const spec = specWithOneUnfittable();
  spec.sheets = {
    below: {
      layout: "full",
      orientation: "portrait",
      zones: {
        a: {
          stack: [
            { helper: "card-row", columns: 1, cards: [{ imagePath: "photos/never-arrived.png" }] },
            { question: true, helper: "questions", items: ["Which number is shown?"] },
          ],
        },
      },
    },
    expected: spec.sheets.expected,
  };
  spec.answerKey = { below: [{ question: 1, answer: "−3" }], expected: spec.answerKey.expected };

  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);
  assert.match(stdout, /^SHEET_STANDS_IN: Below - .*: the Below sheet cannot be built \(IMAGE_MISSING/m);
  assert.doesNotMatch(stdout, /^IMAGE_MISSING/m);
  assert.ok(files.includes("Omission - Worksheets.pdf"));
});

test("a Below sheet the browser finds clipped gets the Expected sheet at the last resort", () => {
  // Every zone passes the arithmetic, and the drawn page does not: a word too
  // long for its table cell pushes the table wider than the page.
  const spec = specWithOneUnfittable();
  spec.sheets = {
    below: {
      layout: "full",
      orientation: "portrait",
      zones: {
        a: {
          question: true,
          helper: "data-table",
          caption: "Use the table.",
          rows: [["Name", "W".repeat(260)], ["b", "c"]],
        },
      },
    },
    expected: spec.sheets.expected,
  };
  spec.answerKey = { below: [{ question: 1, answer: "b" }], expected: spec.answerKey.expected };

  const plain = buildWith(spec);
  assert.match(plain.stdout, /^SHEET_DOES_NOT_FIT: Below page 1/m);

  const { stdout, files, key } = buildWith(spec, ["--omit-unfittable"]);
  if (/^PDF_SKIPPED/m.test(stdout)) return; // no browser, so nothing is measured
  assert.match(stdout, /^SHEET_STANDS_IN: Below - .*: the page cannot hold the Below sheet \(rendered content/m);
  assert.doesNotMatch(stdout, /^SHEET_DOES_NOT_FIT/m);
  assert.ok(files.includes("Omission - Worksheets.pdf"));
  assert.match(key, /The Expected sheet stands in here for the Below sheet, which the page could not hold\./);
});

test("an Expected sheet with a fault other than page fit still refuses the pack at the last resort", () => {
  const spec = specWithOneUnfittable();
  spec.sheets = {
    below: fittingSheet("Put −3 and 2 in order, smallest first."),
    expected: fittingSheet("Word bank: less, more. Which is less, −6 or 1?"),
  };
  spec.answerKey = { below: [{ question: 1, answer: "−3, 2" }], expected: [{ question: 1, answer: "−6" }] };
  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);
  assert.match(stdout, /WORD_BANK_INLINE/);
  assert.doesNotMatch(stdout, /SHEET_STANDS_IN/);
  assert.deepEqual(files, []);
});

test("when the Expected sheet cannot fit, a Below sheet with another fault still refuses the pack: nothing can stand in", () => {
  // The one exception, and what follows from it: the Expected sheet is
  // measured before anything stands in, and a copy of a sheet the page cannot
  // hold is no stand-in.
  const spec = specWithOneUnfittable();
  spec.sheets = {
    below: fittingSheet("Word bank: less, more. Which is less, −3 or 2?"),
    expected: unfittableSheet(),
    greaterDepth: fittingSheet("Write a number between −5 and −1."),
  };
  spec.answerKey = {
    below: [{ question: 1, answer: "−3" }],
    expected: [{ question: 1, answer: "Various." }],
    greaterDepth: [{ question: 1, answer: "−3" }],
  };
  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);
  assert.doesNotMatch(stdout, /SHEET_STANDS_IN/);
  assert.match(stdout, /WORD_BANK_INLINE/);
  assert.deepEqual(files, []);
});

test("a returned Below sheet with the Expected sheet omitted at the last resort: nothing is announced and then dropped", () => {
  // The third check's E7: the guard that names a stand-in only once the pack
  // is built, in the one mix that needs it. Below is named for its own reason,
  // never with the Expected sheet's measurement as if it were its own.
  const spec = specWithOneUnfittable();
  spec.sheets = {
    expected: unfittableSheet(),
    greaterDepth: fittingSheet("Write a number between −5 and −1."),
  };
  spec.answerKey = {
    expected: [{ question: 1, answer: "Various." }],
    greaterDepth: [{ question: 1, answer: "−3" }],
  };
  spec.notes = ["WORKSHEET_CONTENT_GAP: Below - question 2 cannot be answered as printed; return to adaptation designer."];
  spec.returned = [{ sheet: "below", problem: "teaching" }];
  const { stdout, files, key } = buildWith(spec, ["--omit-unfittable"]);

  assert.doesNotMatch(stdout, /SHEET_STANDS_IN/);
  assert.match(
    stdout,
    /^SHEET_OMITTED: Below - the Below sheet could not be used as printed \(a problem a child could not get past as printed.*\), and the Expected sheet cannot stand in for it: the page cannot hold the Expected sheet either/m
  );
  assert.match(stdout, /^SHEET_OMITTED: Expected - /m);
  assert.ok(files.some((f) => /greaterDepth\.html$/.test(f)));
  assert.doesNotMatch(key, /stands in/);
});

test("an Expected sheet the browser finds clipped refuses the whole pack, names the tier it stood in for, and leaves no answer key", () => {
  // As on 4.2.289, an Expected sheet the browser finds clipped refuses the pack.
  // A Below sheet it stood in for is named as that, with Below's own reason, and
  // the key written before the pages were drawn is taken away.
  const spec = specWithOneUnfittable();
  spec.sheets = {
    below: unfittableSheet(),
    expected: {
      layout: "full",
      orientation: "portrait",
      zones: {
        a: {
          question: true,
          helper: "data-table",
          caption: "Use the table.",
          rows: [["Name", "W".repeat(260)], ["b", "c"]],
        },
      },
    },
  };
  spec.answerKey = { below: [{ question: 1, answer: "Various." }], expected: [{ question: 1, answer: "b" }] };
  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);
  if (/^PDF_SKIPPED/m.test(stdout)) return; // no browser, so nothing is measured
  assert.match(stdout, /^SHEET_DOES_NOT_FIT: Expected page 1/m);
  assert.match(stdout, /^SHEET_DOES_NOT_FIT: Below page 1 zone "a" \(the Expected sheet, standing in because the page cannot hold the Below sheet/m);
  assert.doesNotMatch(stdout, /SHEET_STANDS_IN/);
  assert.ok(!files.some((f) => f.endsWith(" - Answers.txt")), files.join(", "));
  assert.ok(!files.some((f) => f.endsWith(".pdf")), files.join(", "));
});

