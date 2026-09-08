"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  SHEET_ORDER,
  SHEET_CODES,
  WorksheetError,
  sheetsOf,
  checkWorksheet,
  answerKeyOf,
  renderAnswerKey,
} = require("../src/worksheet");

// A sheet small enough to fit anything, so these tests are about the worksheet
// and never accidentally about the fit check.
const zones = () => ({
  a: { helper: "questions", items: ["What is 4 x 3?", "What is 5 x 3?"] },
});

const worksheet = (sheets, meta = {}) => ({
  meta: { lesson: "Multiplying by 3", lo: "To multiply by 3", ...meta },
  sheets,
});

test("the sheets print least to most challenging, whatever order they were written in", () => {
  // The order is the whole reason the file is one file: a teacher prints it,
  // cuts it into piles top to bottom, and hands them out. Written order is
  // whatever the designer happened to type.
  const spec = worksheet({
    greaterDepth: { layout: "full", zones: zones() },
    below: { layout: "full", zones: zones() },
    expected: { layout: "full", zones: zones() },
  });

  assert.deepEqual(
    sheetsOf(spec).map((s) => s.key),
    ["below", "expected", "greaterDepth"]
  );
  assert.deepEqual(SHEET_ORDER, ["below", "expected", "greaterDepth"]);
});

test("answers cannot be stored as a pupil sheet", () => {
  const spec = worksheet({
    expected: { layout: "full", zones: zones() },
    answers: { layout: "full", zones: zones() },
  });
  assert.throws(() => answerKeyOf(spec), (error) => {
    assert.equal(error.signal, "SPEC_INVALID");
    assert.match(error.message, /must not be stored as sheets\.answers/);
    return true;
  });
});

test("every populated pupil sheet needs its own complete answer-key section", () => {
  const spec = {
    ...worksheet({
      below: {
        layout: "full",
        zones: {
          a: {
            question: true,
            helper: "questions",
            items: ["What is 4 x 3?", "What is 5 x 3?"],
          },
        },
      },
      expected: {
        layout: "full",
        zones: {
          a: { question: true, helper: "questions", items: ["What is 6 x 3?"] },
        },
      },
    }),
    answerKey: {
      below: [
        { question: 1, answer: "12" },
        { question: 2, answer: "15" },
      ],
    },
  };

  assert.throws(() => answerKeyOf(spec), (error) => {
    assert.equal(error.signal, "ANSWER_KEY_MISSING");
    assert.match(error.message, /answerKey\.expected/);
    return true;
  });

  spec.answerKey.expected = [{ question: 1, answer: "18" }];
  assert.doesNotThrow(() => answerKeyOf(spec));
});

test("a numbered pupil question cannot be absent from its answer key", () => {
  const spec = {
    ...worksheet({
      expected: {
        layout: "full",
        zones: {
          a: {
            question: true,
            helper: "questions",
            items: ["One?", "Two?", "Three?"],
          },
        },
      },
    }),
    answerKey: {
      expected: [
        { question: 1, answer: "A" },
        { question: 3, answer: "C" },
      ],
    },
  };

  assert.throws(() => answerKeyOf(spec), (error) => {
    assert.equal(error.signal, "ANSWER_KEY_INCOMPLETE");
    assert.match(error.message, /missing question \(2\)/);
    return true;
  });
});

test("the teacher answer key is compact text with clear sheet headings", () => {
  const spec = {
    ...worksheet({
      below: { layout: "full", zones: zones() },
      expected: { layout: "full", zones: zones() },
      greaterDepth: { layout: "full", zones: zones() },
    }),
    answerKey: Object.fromEntries(
      ["below", "expected", "greaterDepth"].map((name) => [
        name,
        [
          { question: 1, answer: "12" },
          { question: 2, answer: "15" },
        ],
      ])
    ),
  };

  const text = renderAnswerKey(spec);
  assert.match(text, /Teacher copy - keep separate from pupil worksheets/);
  assert.match(text, /BELOW \(SHEET A\)/);
  assert.match(text, /EXPECTED \(SHEET B\)/);
  assert.match(text, /GREATER DEPTH \(SHEET C\)/);
  assert.match(text, /\(2\) 15/);
});

test("a worksheet with only the expected sheet is normal, not an error", () => {
  // Every shared working frame produces one sheet, and so does any lesson
  // whose adaptation step was skipped.
  const sheets = sheetsOf(worksheet({ expected: { layout: "full", zones: zones() } }));
  assert.equal(sheets.length, 1);
  assert.equal(sheets[0].key, "expected");
});

test("one sheet carries no code, because there are no piles to tell apart", () => {
  const [only] = sheetsOf(worksheet({ expected: { layout: "full", zones: zones() } }));
  assert.equal(only.code, null);
  assert.equal(only.spec.code, "");
});

test("the printed code never names the level", () => {
  // A child reads the top of their own page. "Sheet A" sorts the pile for the
  // teacher; "Below" tells the child what the teacher thinks of them. This is
  // the one thing in this file worth a test of its own.
  const sheets = sheetsOf(
    worksheet({
      below: { layout: "full", zones: zones() },
      expected: { layout: "full", zones: zones() },
      greaterDepth: { layout: "full", zones: zones() },
    })
  );

  for (const sheet of sheets) {
    assert.match(sheet.spec.code, /^Sheet [ABC]$/, `${sheet.key} printed "${sheet.spec.code}"`);
    for (const word of ["Below", "Expected", "Greater", "Depth"]) {
      assert.ok(
        !sheet.spec.code.includes(word),
        `${sheet.key}'s printed code says "${word}"`
      );
    }
  }
  assert.equal(SHEET_CODES.below, "Sheet A");
});

test("every sheet belongs to the same lesson, and none carries an objective", () => {
  // All three are the same lesson. A child on Sheet A is working towards what
  // the class is working towards. The objective itself is not on the paper: the
  // class has it on the board and in their books.
  const sheets = sheetsOf(
    worksheet({
      below: { layout: "full", zones: zones() },
      greaterDepth: { layout: "full", zones: zones() },
    })
  );
  const titles = new Set(sheets.map((s) => s.spec.title));
  assert.equal(titles.size, 1);
  assert.ok(
    sheets.every((s) => s.spec.lo === undefined),
    "no sheet spec carries a learning objective for the renderer to print"
  );
});

test("a worksheet with no sheets is named as such rather than built empty", () => {
  assert.throws(() => sheetsOf(worksheet({})), (e) => {
    assert.ok(e instanceof WorksheetError);
    assert.equal(e.signal, "NO_SHEETS");
    return true;
  });
});

test("a misspelled sheet name is refused, not ignored", () => {
  // Silently skipping "greaterdepth" would hand the teacher two sheets and a
  // report saying two sheets, with nothing anywhere saying the third was lost.
  assert.throws(
    () => sheetsOf(worksheet({ expected: { layout: "full", zones: zones() }, greaterdepth: {} })),
    (e) => {
      assert.equal(e.signal, "SPEC_INVALID");
      assert.match(e.message, /greaterdepth/);
      return true;
    }
  );
});

test("orientation is per sheet, and defaults to portrait", () => {
  // A landscape sort beside a portrait set of questions is a normal lesson,
  // which is why the sheets are merged as pages rather than stitched as HTML.
  const sheets = sheetsOf(
    worksheet({
      below: { layout: "full", orientation: "landscape", zones: zones() },
      expected: { layout: "full", zones: zones() },
    })
  );
  assert.equal(sheets[0].spec.orientation, "landscape");
  assert.equal(sheets[1].spec.orientation, "portrait");
});

test("the fit check reports every sheet that fails, not just the first", () => {
  // A designer told about one sheet at a time has the same conversation three
  // times, and the three sheets usually go wrong for the same reason.
  const tooSmall = {
    layout: "quarters",
    zones: {
      a: { helper: "ruler", end: 30 },
      b: { helper: "ruler", end: 30 },
      c: { helper: "ruler", end: 30 },
      d: { helper: "ruler", end: 30 },
    },
  };
  const refused = checkWorksheet(
    worksheet({ below: tooSmall, expected: tooSmall, greaterDepth: tooSmall })
  );
  assert.equal(refused.length, 3, "all three sheets should be reported");
  for (const sheet of refused) {
    assert.ok(sheet.tooTight.length, `${sheet.key} should be reported as not fitting`);
    assert.deepEqual(sheet.badZones, [], `${sheet.key}'s zones are each valid on their own`);
  }
});

test("a zone that cannot read its spec is told apart from a page that will not hold it", () => {
  // Two different edits fix these. A designer sent looking for a smaller
  // layout when what they have is a misspelled field has been sent the wrong
  // way, and the sheet still will not build when they get back.
  const refused = checkWorksheet(
    worksheet({
      // "questions" wants `items`. This gives it nothing it can read.
      expected: { layout: "full", zones: { a: { helper: "questions", text: "no items here" } } },
    })
  );

  assert.equal(refused.length, 1);
  const [sheet] = refused;
  assert.equal(sheet.badZones.length, 1, "the zone should be reported");
  assert.deepEqual(sheet.tooTight, [], "fit is not asked until every zone can draw");
  assert.match(sheet.badZones[0], /zone "a" \(questions\)/);
});

test("a broken zone's message never names a JavaScript method as if it were a field", () => {
  // The message JavaScript gives for a missing field looks like it names the
  // field and does not: "reading 'reduce'" is what the helper tried to DO to
  // the field. Printing it sends the designer through the catalogue hunting a
  // field that exists in no helper anywhere.
  const [sheet] = checkWorksheet(
    worksheet({
      expected: { layout: "full", zones: { a: { helper: "written-answers" } } },
    })
  );

  const message = sheet.badZones[0];
  for (const method of ["reduce", "map", "forEach", "length", "undefined"]) {
    assert.ok(!message.includes(method), `the message says "${method}"`);
  }
  assert.match(message, /catalogue/);
});

test("the child's questions count 1, 2, 3 whatever was cut upstream", () => {
  // A real sheet came out numbered 1, 2, 6. The designer had kept the
  // adaptation's own numbers after three of its questions could not be built,
  // which is faithful to the brief and wrong on the paper: a child has no idea
  // questions 3 to 5 ever existed, so the gap is not information. It is just a
  // sheet that looks like a mistake.
  //
  // So a designer marks a question and never writes a number.
  const spec = {
    meta: { yearGroup: 4, lesson: "L", lo: "O" },
    sheets: {
      expected: {
        layout: "halves-side",
        zones: {
          a: {
            stack: [
              { question: true, helper: "multiple-choice", text: "First.", options: ["x"], instruction: "Tick one" },
              { question: true, helper: "questions", items: ["A", "B", "C"] },
            ],
          },
          b: { question: true, helper: "written-answers", items: [{ text: "Explain.", lines: 2 }] },
        },
      },
    },
  };

  const zones = sheetsOf(spec)[0].spec.zones;

  assert.equal(zones.a.stack[0].number, 1);
  // A SET takes the next run of numbers rather than one, so a block of three
  // followed by a single question runs 2, 3, 4 and then 5.
  assert.equal(zones.a.stack[1].startAt, 2);
  assert.equal(zones.b.startAt, 5, "numbering must continue across zones, in zone order");

  // And nothing carries a `question` flag through to the renderer, which would
  // reach a helper as a field it has never heard of.
  const json = JSON.stringify(zones);
  assert.ok(!json.includes('"question":'), "the marker should be consumed, not passed on");
});

test("a stack of a picture and a prompt is ONE question", () => {
  // A diagram, a prompt and somewhere to write is one numbered item, and no
  // arrangement of zones makes it three.
  const zones = sheetsOf({
    meta: { yearGroup: 4 },
    sheets: {
      expected: {
        layout: "halves-side",
        zones: {
          a: {
            question: true,
            stack: [
              { helper: "questions", items: ["Look at the picture."] },
              { helper: "written-answers", items: [{ text: "Why?", lines: 2 }] },
            ],
          },
          b: { question: true, helper: "questions", items: ["Next."] },
        },
      },
    },
  })[0].spec.zones;

  assert.equal(zones.a.number, 1, "the whole stack is question 1");
  assert.equal(zones.b.startAt, 2, "so the next question is 2, not 3");
});

test("a one-item helper inside a numbered question does not restart numbering", () => {
  // An outer question takes number 1; its single questions item and single
  // written-answers item used to each print a duplicate "1." of their own.
  const zones = sheetsOf({
    meta: { yearGroup: 4 },
    sheets: {
      expected: {
        layout: "halves-side",
        zones: {
          a: {
            question: true,
            stack: [
              { helper: "questions", items: ["What is 4 x 7?"] },
              { helper: "written-answers", items: [{ text: "How do you know?", lines: 2 }] },
            ],
          },
          b: { question: true, helper: "questions", items: ["What is 5 x 7?"] },
        },
      },
    },
  })[0].spec.zones;

  assert.equal(zones.a.number, 1);
  assert.equal(
    zones.a.stack[0].showNumbers, false,
    "the nested one-item questions helper takes the outer number only"
  );
  assert.equal(
    zones.a.stack[1].showNumbers, false,
    "the nested one-item written-answers helper takes the outer number only"
  );
  assert.equal(zones.b.startAt, 2, "numbering carries on after the outer question");
});

test("a one-item helper standing on its own keeps its number", () => {
  // Suppression is for a helper nested inside an outer numbered question; the
  // same helper on its own IS the question and still prints it.
  const zones = sheetsOf({
    meta: { yearGroup: 4 },
    sheets: {
      expected: {
        layout: "halves-side",
        zones: {
          a: { question: true, helper: "questions", items: ["One."] },
        },
      },
    },
  })[0].spec.zones;

  assert.equal(zones.a.startAt, 1);
  assert.notEqual(
    zones.a.showNumbers, false,
    "a standalone one-item helper still shows its number"
  );
});

test("a multi-item helper inside a numbered question keeps its own number run", () => {
  // Two or more items inside one question are their own set and keep their
  // bracketed run; only the lone duplicate number is suppressed.
  const zones = sheetsOf({
    meta: { yearGroup: 4 },
    sheets: {
      expected: {
        layout: "halves-side",
        zones: {
          a: {
            question: true,
            stack: [
              { helper: "questions", items: ["One.", "Two.", "Three."] },
              { helper: "written-answers", items: [{ text: "First.", lines: 2 }, { text: "Second.", lines: 2 }] },
            ],
          },
        },
      },
    },
  })[0].spec.zones;

  assert.equal(zones.a.number, 1);
  assert.notEqual(
    zones.a.stack[0].showNumbers, false,
    "a three-item questions helper keeps its own run"
  );
  assert.notEqual(
    zones.a.stack[1].showNumbers, false,
    "a two-item written-answers helper keeps its own run"
  );
});

// ─── W5: Parts of one job, the two-page exception, and word banks ────────

const groupedSheet = (zones) => ({
  meta: { lesson: "Rainforests", yearGroup: 4 },
  sheets: { expected: { layout: "full", zones } },
});

const labelsOf = (spec) => {
  const zones = sheetsOf(spec)[0].spec.zones;
  const found = [];
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if (node.startAt !== undefined) {
      found.push(`startAt:${node.startAt}`);
      return;
    }
    if (node.number !== undefined) found.push(String(node.number));
    Object.values(node).forEach(walk);
  };
  Object.keys(zones).sort().forEach((id) => walk(zones[id]));
  return found;
};

test("two Parts of one Question group print 1a and 1b, and the next question is 2", () => {
  // The designer decided these two are one closely connected job. The engine
  // renders that relationship and never infers it.
  const labels = labelsOf(
    groupedSheet({
      a: {
        stack: [
          { question: true, questionGroupId: "qg-1", stack: [{ helper: "questions", items: ["What can you see?"] }] },
          { question: true, questionGroupId: "qg-1", stack: [{ helper: "written-answers", items: [{ text: "What does this suggest?", lines: 2 }] }] },
          { question: true, stack: [{ helper: "written-answers", items: [{ text: "What is different?", lines: 2 }] }] },
        ],
      },
    })
  );

  assert.deepEqual(labels, ["1a", "1b", "2"]);
});

test("three Parts run 1a, 1b, 1c", () => {
  const labels = labelsOf(
    groupedSheet({
      a: {
        stack: ["one", "two", "three"].map((t) => ({
          question: true,
          questionGroupId: "qg-1",
          stack: [{ helper: "written-answers", items: [{ text: t, lines: 1 }] }],
        })),
      },
    })
  );

  assert.deepEqual(labels, ["1a", "1b", "1c"]);
});

test("two separate groups run 1a, 1b then 2a, 2b", () => {
  const part = (id, t) => ({
    question: true,
    questionGroupId: id,
    stack: [{ helper: "written-answers", items: [{ text: t, lines: 1 }] }],
  });

  const labels = labelsOf(
    groupedSheet({
      a: { stack: [part("g1", "a"), part("g1", "b"), part("g2", "c"), part("g2", "d")] },
    })
  );

  assert.deepEqual(labels, ["1a", "1b", "2a", "2b"]);
});

test("a group with only one Part is refused rather than silently numbered", () => {
  // A relationship was declared that the content does not have, and the
  // designer is the one who knows which of the two is wrong.
  assert.throws(
    () =>
      sheetsOf(
        groupedSheet({
          a: {
            stack: [
              { question: true, questionGroupId: "qg-1", stack: [{ helper: "questions", items: ["Alone."] }] },
              { question: true, stack: [{ helper: "questions", items: ["Separate."] }] },
            ],
          },
        })
      ),
    (error) => {
      assert.equal(error.signal, "QUESTION_GROUP_INVALID");
      return true;
    }
  );
});

test("Parts split apart by another question are refused", () => {
  const part = (id, t) => ({
    question: true,
    questionGroupId: id,
    stack: [{ helper: "written-answers", items: [{ text: t, lines: 1 }] }],
  });

  assert.throws(
    () =>
      sheetsOf(
        groupedSheet({
          a: {
            stack: [
              part("g1", "first"),
              part("g1", "second"),
              { question: true, stack: [{ helper: "questions", items: ["Interrupting."] }] },
              part("g1", "third"),
            ],
          },
        })
      ),
    (error) => {
      assert.equal(error.signal, "QUESTION_GROUP_NONCONTIGUOUS");
      return true;
    }
  );
});

test("a grouped Part may not also carry its own number", () => {
  assert.throws(
    () =>
      sheetsOf(
        groupedSheet({
          a: {
            stack: [
              { question: true, questionGroupId: "g", number: 4, stack: [{ helper: "questions", items: ["x"] }] },
              { question: true, questionGroupId: "g", stack: [{ helper: "questions", items: ["y"] }] },
            ],
          },
        })
      ),
    (error) => {
      assert.equal(error.signal, "NUMBERING_CONFLICT");
      return true;
    }
  );
});

test("a sheet with no groups numbers exactly as it always did", () => {
  const labels = labelsOf(
    groupedSheet({
      a: { question: true, helper: "questions", items: ["one", "two"] },
      b: { question: true, helper: "written-answers", items: [{ text: "three", lines: 1 }] },
    })
  );

  assert.deepEqual(labels, ["startAt:1", "startAt:3"]);
});

test("an answer key must match the labels the sheet actually prints", () => {
  const spec = {
    ...groupedSheet({
      a: {
        stack: [
          { question: true, questionGroupId: "g", stack: [{ helper: "written-answers", items: [{ text: "a", lines: 1 }] }] },
          { question: true, questionGroupId: "g", stack: [{ helper: "written-answers", items: [{ text: "b", lines: 1 }] }] },
        ],
      },
    }),
    answerKey: {
      expected: [
        { question: "1a", answer: "First" },
        { question: "(1b)", answer: "Second" },
      ],
    },
  };

  // "1a" and "(1b)" are the same labels written two ways, and both match.
  const key = answerKeyOf(spec);
  assert.deepEqual(key.expected.map((e) => e.question), ["1a", "1b"]);
});

test("an answer for a question the sheet does not print is refused", () => {
  const spec = {
    ...groupedSheet({
      a: { question: true, helper: "written-answers", items: [{ text: "a", lines: 1 }] },
    }),
    answerKey: {
      expected: [
        { question: 1, answer: "First" },
        { question: 9, answer: "Nowhere" },
      ],
    },
  };

  assert.throws(() => answerKeyOf(spec), (error) => {
    assert.equal(error.signal, "ANSWER_KEY_EXTRA");
    return true;
  });
});

test("the same question answered twice is refused", () => {
  const spec = {
    ...groupedSheet({
      a: { question: true, helper: "written-answers", items: [{ text: "a", lines: 1 }] },
    }),
    answerKey: {
      expected: [
        { question: 1, answer: "First" },
        { question: "(1)", answer: "Again" },
      ],
    },
  };

  assert.throws(() => answerKeyOf(spec), (error) => {
    assert.equal(error.signal, "ANSWER_KEY_DUPLICATE");
    return true;
  });
});

test("exactly two pages are allowed through the write-on visual exception", () => {
  const sheets = sheetsOf({
    meta: { lesson: "Rainforests", yearGroup: 4 },
    sheets: {
      expected: {
        centralWriteOnVisualException: {
          visual: "Rainforest cross-section children directly annotate",
          reason: "The write-on visual cannot remain usable at one-page size",
        },
        pages: [
          { layout: "full", orientation: "portrait", zones: { a: { question: true, helper: "questions", items: ["one", "two"] } } },
          { layout: "full", orientation: "portrait", zones: { a: { question: true, helper: "written-answers", items: [{ text: "three", lines: 2 }] } } },
        ],
      },
    },
  });

  assert.equal(sheets.length, 2);
  assert.equal(sheets[0].page, 1);
  assert.equal(sheets[1].page, 2);
  // Numbering carries across the pair rather than restarting on page 2.
  assert.equal(sheets[0].spec.zones.a.startAt, 1);
  assert.equal(sheets[1].spec.zones.a.startAt, 3);
});

test("a second page without the exception is refused", () => {
  // Ordinary overflow never earns page 2.
  assert.throws(
    () =>
      sheetsOf({
        meta: { lesson: "X" },
        sheets: {
          expected: {
            pages: [
              { layout: "full", zones: { a: { helper: "questions", items: ["a"] } } },
              { layout: "full", zones: { a: { helper: "questions", items: ["b"] } } },
            ],
          },
        },
      }),
    (error) => {
      assert.equal(error.signal, "TWO_PAGE_EXCEPTION_REQUIRED");
      return true;
    }
  );
});

test("the exception must describe exactly two pages", () => {
  assert.throws(
    () =>
      sheetsOf({
        meta: { lesson: "X" },
        sheets: {
          expected: {
            centralWriteOnVisualException: { visual: "v", reason: "r" },
            pages: [{ layout: "full", zones: { a: { helper: "questions", items: ["a"] } } }],
          },
        },
      }),
    (error) => {
      assert.equal(error.signal, "TWO_PAGE_EXCEPTION_INVALID");
      return true;
    }
  );
});

test("a sheet cannot mix one-page fields with a pages array", () => {
  assert.throws(
    () =>
      sheetsOf({
        meta: { lesson: "X" },
        sheets: {
          expected: {
            centralWriteOnVisualException: { visual: "v", reason: "r" },
            layout: "full",
            zones: { a: { helper: "questions", items: ["a"] } },
            pages: [
              { layout: "full", zones: { a: { helper: "questions", items: ["a"] } } },
              { layout: "full", zones: { a: { helper: "questions", items: ["b"] } } },
            ],
          },
        },
      }),
    (error) => {
      assert.equal(error.signal, "TWO_PAGE_SPEC_CONFLICT");
      return true;
    }
  );
});

test("the next pupil level starts numbering again at 1", () => {
  const sheets = sheetsOf({
    meta: { lesson: "X", yearGroup: 4 },
    sheets: {
      below: { layout: "full", zones: { a: { question: true, stack: [{ helper: "written-answers", items: [{ text: "a", lines: 1 }] }] } } },
      expected: { layout: "full", zones: { a: { question: true, stack: [{ helper: "written-answers", items: [{ text: "b", lines: 1 }] }] } } },
    },
  });

  assert.equal(sheets[0].spec.zones.a.number, 1);
  assert.equal(sheets[1].spec.zones.a.number, 1);
});

test("a word bank typed into a prompt is refused", () => {
  // The words are support and belong in a labelled block a child can find, not
  // buried in the wording of the question.
  const problems = checkWorksheet({
    meta: { lesson: "X", yearGroup: 4 },
    sheets: {
      expected: {
        layout: "full",
        zones: {
          a: { helper: "instruction", text: "Word bank: river, source, mouth" },
        },
      },
    },
  });

  assert.equal(problems.length, 1);
  assert.match(problems[0].wordBanks.join(" "), /WORD_BANK_INLINE/);
});

// ─── words the designer wrote that the page never prints ─────────────────
//
// A helper reads the fields it knows and ignores the rest without a word. One
// science lesson shipped with `note` on two recording tables - "For power
// source, write mains, battery, both or not electrical" - and a recording
// table had no note. The sheet fitted, the PDF looked finished, and children
// were asked for a power source with no clue what one should look like.
//
// The engine's reference had warned designers about it for months, which is
// the right fact in the wrong place: a rule a designer must remember, guarding
// something the build can simply check.

test("a field the helper does not read is refused, not dropped in silence", () => {
  const problems = checkWorksheet({
    meta: { lesson: "X", yearGroup: 4 },
    sheets: {
      expected: {
        layout: "full",
        zones: {
          a: {
            question: true,
            helper: "multiple-choice",
            text: "Which of these uses electricity?",
            options: ["A kettle", "A hammer"],
            select: "one",
            // multiple-choice has no `note`. Before this check it evaporated.
            note: "Look at the plug before you decide.",
          },
        },
      },
    },
  });

  assert.equal(problems.length, 1);
  assert.match(problems[0].unprinted.join(" "), /TEXT_NOT_PRINTED/);
  assert.match(problems[0].unprinted.join(" "), /Look at the plug/);
});

test("the same words on a helper that does print them are accepted", () => {
  // The discrimination case. `note` is not the fault; a note that never
  // reaches the page is. A recording table prints one, so this is a clean
  // sheet and must not be refused.
  const problems = checkWorksheet({
    meta: { lesson: "X", yearGroup: 4 },
    sheets: {
      expected: {
        layout: "full",
        zones: {
          a: {
            question: true,
            helper: "recording-table",
            columns: ["Object", "Power source"],
            rowLabels: ["A", "B"],
            writing: ["word", "word"],
            note: "Look at the plug before you decide.",
          },
        },
      },
    },
  });

  assert.deepEqual(problems, []);
});

test("text the engine reshapes on the way to the page still counts as printed", () => {
  // Generalisation. The check normalises the engine's own inline markup and
  // its write-in blanks, because a false refusal costs a class its worksheets.
  // A stem's underscores print as a write-in box and its **bold** prints as a
  // strong tag; neither is a dropped line.
  const problems = checkWorksheet({
    meta: { lesson: "X", yearGroup: 4 },
    sheets: {
      expected: {
        layout: "full",
        zones: {
          a: {
            question: true,
            helper: "method-frame",
            text: "Use the adjusting strategy to work out **148 + 99**.",
            steps: ["Round 99 to 100", "Add", "Adjust"],
          },
        },
      },
    },
  });

  assert.deepEqual(problems, []);
});

// ─── a question with nothing in it to act on ─────────────────────────────
//
// A helper handed an empty set draws the frame and nothing in it. One science
// sheet shipped with `"options": []` under "Circle the complete circuit" and
// `"labels": []` under "Draw a line from each word to the right part in
// Circuit A": three questions across two sheets that no child could do, on
// pages that fitted, rendered and looked finished.

test("a set of options a child chooses between cannot be empty", () => {
  const problems = checkWorksheet({
    meta: { lesson: "X", yearGroup: 4 },
    sheets: {
      expected: {
        layout: "full",
        zones: {
          a: {
            question: true,
            stack: [
              { helper: "instruction", text: "Circle the complete circuit." },
              { helper: "circle-the-answer", options: [] },
            ],
          },
        },
      },
    },
  });

  assert.equal(problems.length, 1);
  assert.match(problems[0].emptySets.join(" "), /EMPTY_SET/);
  assert.match(problems[0].emptySets.join(" "), /circle-the-answer/);
});

test("a photograph asked to be labelled cannot carry no labels", () => {
  // The one an anchoring pass can cause on its own, by dropping every dot it
  // could not place. Its own instructions forbid emptying a diagram; this is
  // the check that holds it to them.
  const problems = checkWorksheet({
    meta: { lesson: "X", yearGroup: 4 },
    sheets: {
      expected: {
        layout: "full",
        zones: {
          a: {
            question: true,
            helper: "label-diagram",
            text: "Label the parts of the circuit.",
            imagePath: "circuit.png",
            labels: [],
          },
        },
      },
    },
  });

  assert.match(problems[0].emptySets.join(" "), /EMPTY_SET.*label-diagram/);
});

test("a blank sorting frame is not an empty question", () => {
  // The discrimination case, and the reason this is declared per helper rather
  // than inferred. A Carroll diagram with no shapes on it is not a broken
  // question: it is the frame, and sorting into it is the work. Refusing it
  // would refuse the commonest way the helper is used.
  const problems = checkWorksheet({
    meta: { lesson: "X", yearGroup: 4 },
    sheets: {
      expected: {
        layout: "full",
        zones: {
          a: {
            question: true,
            helper: "carroll",
            rowLabel: "has wings",
            rowNotLabel: "no wings",
            colLabel: "lays eggs",
            colNotLabel: "does not lay eggs",
            shapes: [],
          },
        },
      },
    },
  });

  assert.deepEqual(problems, []);
});

test("every helper's own example satisfies the sets it says it needs", () => {
  // Generalisation. A helper that declares a required set and ships an example
  // without it is claiming something its own contract breaks, and the failure
  // would surface on a real sheet rather than here.
  const { requiredSets } = require("../src/helpers");
  const EXAMPLES = require("./helper-examples");

  const broken = [];
  for (const [name, spec] of Object.entries(EXAMPLES)) {
    for (const field of requiredSets(name)) {
      const value = spec[field];
      if (value === undefined) {
        broken.push(`${name} requires ${field} and its example has none`);
      } else if (Array.isArray(value) && value.length === 0) {
        broken.push(`${name} requires ${field} and its example leaves it empty`);
      }
    }
  }

  assert.deepEqual(broken, []);
});

test("telling a child to use a word bank that is not there is refused", () => {
  const problems = checkWorksheet({
    meta: { lesson: "X", yearGroup: 4 },
    sheets: {
      expected: {
        layout: "full",
        zones: { a: { helper: "instruction", text: "Use the word bank to help you." } },
      },
    },
  });

  assert.match(problems[0].wordBanks.join(" "), /WORD_BANK_MISSING/);
});

test("a real structured bank satisfies the reference to it", () => {
  const problems = checkWorksheet({
    meta: { lesson: "X", yearGroup: 4 },
    sheets: {
      expected: {
        layout: "full",
        zones: {
          a: {
            stack: [
              { helper: "instruction", text: "Use the word bank to help you." },
              { helper: "sort-grid", columns: ["Yes", "No"], rows: 3, wordBank: ["river", "source"] },
            ],
          },
        },
      },
    },
  });

  assert.deepEqual(problems, []);
});

test("an empty bank does not count as a bank", () => {
  const problems = checkWorksheet({
    meta: { lesson: "X", yearGroup: 4 },
    sheets: {
      expected: {
        layout: "full",
        zones: {
          a: {
            stack: [
              { helper: "instruction", text: "Use the word bank to help you." },
              { helper: "sort-grid", columns: ["Yes", "No"], rows: 3, wordBank: [] },
            ],
          },
        },
      },
    },
  });

  assert.match(problems[0].wordBanks.join(" "), /WORD_BANK_MISSING/);
});

// ─── wording that was never meant for the child ──────────────────────────
//
// Two families of words kept reaching paper a child reads, and both printed
// without a murmur. Real sheets, 1 to 4 September 2026.

const sheetSaying = (zoneA) => ({
  meta: { lesson: "X", lo: "To do X", yearGroup: 4 },
  sheets: { expected: { layout: "full", zones: { a: zoneA } } },
});

test("the page describing its own apparatus is not a question", () => {
  // Printed on a real maths sheet: "Show the counters in a prefilled
  // place-value chart and provide one numeral answer line."
  const problems = checkWorksheet(
    sheetSaying({
      helper: "instruction",
      text:
        "What number is shown by 8 tens counters? Show the counters in a " +
        "prefilled place-value chart and provide one numeral answer line.",
    })
  );

  const said = problems[0].pupilWording.join(" ");
  assert.match(said, /NOT_FOR_THE_CHILD/);
  assert.match(said, /prefilled/);
  assert.match(said, /answer line/);
});

test("a question about the lesson is left alone", () => {
  // Discrimination: these say what the CHILD does. Nothing here names the
  // page's machinery, so nothing here is refused.
  const problems = checkWorksheet(
    sheetSaying({
      stack: [
        { helper: "instruction", text: "Write your answer on the line below." },
        { helper: "instruction", text: "Draw a line from each word to its part." },
        { helper: "instruction", text: "Reasoning about weight helped you here." },
      ],
    })
  );

  assert.deepEqual(problems, []);
});

test("a mode-of-work heading buried in a question is sent back to its helper", () => {
  // Printed on a real sheet as "Fluency Complete each row." - one instruction,
  // the heading swallowed into it.
  const problems = checkWorksheet(
    sheetSaying({ helper: "instruction", text: "Fluency\n\nComplete each row." })
  );

  const said = problems[0].pupilWording.join(" ");
  assert.match(said, /SECTION_LABEL_IN_TEXT/);
  assert.match(said, /section-label/);
});

test("a heading that is the whole line is a heading, not a buried one", () => {
  // Discrimination both ways: a label alone is what `section-label` is for and
  // is nobody's fault here, and a question merely opening with the word is a
  // question.
  const problems = checkWorksheet(
    sheetSaying({
      stack: [
        { helper: "section-label", text: "Fluency" },
        { helper: "instruction", text: "Problem solving takes longer when you rush." },
      ],
    })
  );

  assert.deepEqual(problems, []);
});

// ─── whether a label is printed or blank ──────────────────────────────────
//
// The same five lines of JSON make two opposite pages. A Below sheet's
// adaptation asked for `bread roll` and `egg` to be printed beside a lunch
// photograph, because the task under it was to tick which body job each food
// does and a child who cannot name the food cannot start. The specification
// listed both words with no `given`, the helper's blank default turned them
// into two empty leader lines, and the build reported a clean fit
// (5 September 2026).

const labelSheet = (labels) => ({
  meta: { lesson: "Balanced diets", yearGroup: 4 },
  sheets: {
    below: {
      layout: "full",
      zones: {
        a: {
          question: true,
          helper: "label-diagram",
          text: "Look at the lunch.",
          imagePath: "lunch.jpg",
          labels,
        },
      },
    },
  },
});

test("a label that does not say whether it is printed or blank is refused", () => {
  const problems = checkWorksheet(
    labelSheet([
      { anchor: [35, 50], label: "bread roll" },
      { anchor: [65, 50], label: "egg" },
    ])
  );

  assert.equal(problems.length, 1);
  const said = problems[0].labelIntent.join(" ");
  assert.match(said, /LABEL_INTENT_UNSTATED/);
  // Named, so the designer does not have to work out which callout is meant.
  assert.match(said, /"bread roll", "egg"/);
  // What silence actually does, which is the part that made this invisible.
  assert.match(said, /prints as a blank line/);
  // Both answers offered. This asks for a decision, not for one of them.
  assert.match(said, /"given": true/);
  assert.match(said, /"given": false/);
  // Where the answer lives.
  assert.match(said, /lesson design or adaptation/);
});

test("a genuine labelling task passes once it says the lines are blank", () => {
  // The counterexample, and the reason the renderer's default was left alone:
  // printing every label would hand the child the answers to this sheet.
  assert.deepEqual(
    checkWorksheet(
      labelSheet([
        { anchor: [37, 31], label: "petal", given: false },
        { anchor: [50, 90], label: "roots", given: false },
      ])
    ),
    []
  );
});

test("printed support passes, and so does a diagram that mixes the two", () => {
  assert.deepEqual(
    checkWorksheet(
      labelSheet([
        { anchor: [35, 50], label: "bread roll", given: true },
        { anchor: [65, 50], label: "egg", given: true },
      ])
    ),
    []
  );

  // One worked label to copy the shape of, the rest for the child. Mixing is
  // a real design, so the check must not push a diagram to be all one thing.
  assert.deepEqual(
    checkWorksheet(
      labelSheet([
        { anchor: [50, 50], label: "stem", given: true },
        { anchor: [37, 31], label: "petal", given: false },
      ])
    ),
    []
  );
});

test("a truthy value that is not a boolean is not a stated intent", () => {
  // "given": "yes" reads as a decision and is not one the helper can act on:
  // it prints blank, exactly as silence does. The check asks for the field the
  // renderer actually reads.
  const problems = checkWorksheet(
    labelSheet([{ anchor: [35, 50], label: "bread roll", given: "yes" }])
  );
  assert.match(problems[0].labelIntent.join(" "), /LABEL_INTENT_UNSTATED/);
});

test("an empty diagram is still reported as empty, not as unstated intent", () => {
  // Two faults that could both fire on one zone. The zone with no labels at
  // all has nothing to state an intent about, so only the emptier fault
  // should speak.
  const problems = checkWorksheet(labelSheet([]));
  assert.equal(problems[0].labelIntent.length, 0);
  assert.match(problems[0].emptySets.join(" "), /EMPTY_SET/);
});

// ─── what a stacked ratio actually does ──────────────────────────────────
//
// The library offers seven top-to-bottom ratios and they cannot differ: every
// zone is finally sized to what it holds, so the parts in a row split only
// order the fit search. That is the right behaviour - a stacked zone held to
// 30% would cut content or print a hole - but it was documented as though the
// heights were promised, and a designer choosing between them was making a
// decision with no effect. This pins the behaviour and the honest claim
// together, so if one ever changes the other has to change with it.
test("every stacked ratio renders the same page, and the reference says so", () => {
  const { renderSheet } = require("../src/render.js");
  const fs = require("node:fs");
  const path = require("node:path");
  const q = (t) => ({ helper: "written-answers", items: [{ text: t, sentences: 2 }] });
  const base = {
    orientation: "portrait", title: "t",
    zones: { a: { stack: [q("A short first question.")] }, b: { stack: [q("A longer second question that wraps.")] } },
  };
  const ids = ["halves-stacked", "stacked-20-80", "stacked-30-70", "stacked-50-50", "stacked-70-30", "stacked-80-20"];
  const rendered = ids.map((layout) => renderSheet({ ...base, layout }));
  for (let i = 1; i < rendered.length; i += 1) {
    assert.strictEqual(rendered[i], rendered[0],
      `${ids[i]} differed from ${ids[0]}; if stacked ratios now do something, the reference paragraph must be rewritten`);
  }

  const doc = fs.readFileSync(
    path.join(__dirname, "..", "..", "references", "worksheet-compositions.md"), "utf8");
  assert.match(doc, /cannot differ from/,
    "the reference must keep telling the designer that choosing a stacked ratio is not a decision");
});

test("a side-by-side ratio does set a real width", () => {
  // The contrast that makes the paragraph above true rather than a blanket
  // claim that ratios are meaningless. A 20% column really is 20% wide, and a
  // helper that needs more is refused in it.
  const { renderSheet } = require("../src/render.js");
  const q = (t) => ({ helper: "written-answers", items: [{ text: t, sentences: 2 }] });
  const base = {
    orientation: "portrait", title: "t",
    zones: { a: { stack: [q("First.")] }, b: { stack: [q("Second.")] } },
  };
  assert.throws(() => renderSheet({ ...base, layout: "side-20-80" }), /needs \d+mm wide, zone is \d+mm/);
  assert.doesNotThrow(() => renderSheet({ ...base, layout: "side-50-50" }));
});
