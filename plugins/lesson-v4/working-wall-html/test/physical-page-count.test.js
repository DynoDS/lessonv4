"use strict";

// The sheets that come out of the printer are the sheets the cards asked for.
//
// This check used to live in the working-wall-builder agent, which ran the build
// script by hand and then looked at the pages. Every other printable resource is
// built by one shared command with no agent, and the wall has now joined them, so
// the checks a machine can settle move into the script where they run on every
// build and cannot be skipped.
//
// The fault it exists for: a card whose text overran its page pushed the
// remainder onto a second A3 sheet carrying nothing but "times the place to its
// right." in a box. The build reported success, because nothing compared the
// pages it laid out with the pages the PDF actually held.

const test = require("node:test");
const assert = require("node:assert");

const { pdfPageCount, assertPhysicalPages } = require("../build.js");

// A minimal PDF page tree. Chrome writes these object headers uncompressed, which
// is what makes counting them from the bytes reliable.
function fakePdf(pages) {
  let body = "%PDF-1.4\n1 0 obj\n<< /Type /Pages /Count " + pages + " >>\nendobj\n";
  for (let i = 0; i < pages; i++) {
    body += `${i + 2} 0 obj\n<< /Type /Page /Parent 1 0 R >>\nendobj\n`;
  }
  return Buffer.from(body + "%%EOF\n", "latin1");
}

test("a PDF's pages are counted from its page objects", () => {
  assert.strictEqual(pdfPageCount(fakePdf(1)), 1);
  assert.strictEqual(pdfPageCount(fakePdf(3)), 3);
});

test("the page tree's own object is not counted as a page", () => {
  // /Type /Pages is the tree, /Type /Page is a sheet. Counting the tree would
  // make every document report one sheet too many.
  assert.strictEqual(pdfPageCount(fakePdf(2)), 2);
});

test("a wall that prints the pages it laid out passes", () => {
  assert.doesNotThrow(() => assertPhysicalPages(fakePdf(2), 2));
});

test("a wall that prints more sheets than it laid out is refused by name", () => {
  assert.throws(
    () => assertPhysicalPages(fakePdf(3), 2),
    (err) => {
      assert.match(err.message, /2 page/, "the refusal must say what was laid out");
      assert.match(err.message, /3 page/, "the refusal must say what was printed");
      assert.match(
        err.message,
        /overran|overflow/i,
        "the refusal must say what the extra sheet means, so the repair is aimed at the card"
      );
      return true;
    }
  );
});

test("a wall that prints fewer sheets than it laid out is refused too", () => {
  assert.throws(() => assertPhysicalPages(fakePdf(1), 2), /1 page/);
});

test("a PDF whose pages cannot be counted is let through rather than blocking a build", () => {
  // A compressed page tree reads as zero. A wall that is otherwise fine must not
  // be withheld because this one check could not see into the file.
  assert.doesNotThrow(() => assertPhysicalPages(Buffer.from("not a pdf"), 2));
});
