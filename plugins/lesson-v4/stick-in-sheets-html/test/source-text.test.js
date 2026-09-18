const { test } = require("node:test");
const assert = require("node:assert");
const {
  normaliseSourceText,
  renderSourceTextPages,
} = require("../src/render-source-text");

const PAGE = { printableWMm: 277, printableHMm: 180, pageHtml: (caption, body) => `${caption}||${body}` };

function patience(spec = {}) {
  return {
    visual: "source-text",
    tag: "Source",
    label: "Patience Kershaw's own words",
    spec: Object.assign({
      title: "Patience Kershaw, a hurrier, 1842",
      text: "\"I go at five o'clock in the morning and come out at five in the evening.\n" +
            "Sometimes they beat me, if I am not quick enough.\"",
      attribution: "Told to the inspectors of the Children's Employment Commission, 1842.",
    }, spec),
  };
}

test("a text source defaults to one between two, so a class set is half the paper", () => {
  const source = normaliseSourceText(patience(), 32);
  assert.strictEqual(source.per, "pair");
  assert.strictEqual(source.copies, 16);
});

test("per: child prints one each", () => {
  const source = normaliseSourceText(patience({ per: "child" }), 31);
  assert.strictEqual(source.copies, 31);
});

test("a source with no words, or no title, is refused by name rather than printed blank", () => {
  // Cut free of the page, an anonymous block of quoted words is a scrap nobody
  // can cite, which is why the title is load-bearing and not decoration.
  assert.match(String(normaliseSourceText(patience({ text: "  " }), 32)), /needs `text`/);
  assert.match(String(normaliseSourceText(patience({ title: "" }), 32)), /needs `title`/);
});

test("the source's own line breaks survive, because a witness answer per line is part of it", () => {
  const source = normaliseSourceText(patience(), 32);
  const laid = renderSourceTextPages(source, PAGE);
  assert.ok(!laid.error, laid.error);
  const page = laid.pages[0];
  assert.ok(page.includes("<br>"), "expected the account's own line break to print as a line break");
  assert.ok(page.includes("Patience Kershaw, a hurrier, 1842"));
  assert.ok(page.includes("Children&#x27;s Employment Commission") || page.includes("Children's Employment Commission"));
});

test("the cutting caption says how many copies there are and that nothing is written on it", () => {
  const laid = renderSourceTextPages(normaliseSourceText(patience(), 32), PAGE);
  assert.match(laid.pages[0], /One between two; 16 copies/);
  assert.match(laid.pages[0], /Nothing is written on this one/);
});

test("an extract too tall for the page is refused with the height named, never cut short", () => {
  // A source with its last paragraph missing is a different source, so the
  // piece refuses rather than trimming, and the message says what to do.
  const long = patience({ text: Array.from({ length: 60 }, (_, i) => `Line ${i + 1} of a very long account.`).join("\n") });
  const laid = renderSourceTextPages(normaliseSourceText(long, 32), PAGE);
  assert.ok(laid.error, "expected a refusal");
  assert.match(laid.error, /mm of page height/);
  assert.match(laid.error, /will not shrink the words/);
});

test("copies tile several to a page with cut guides between them", () => {
  const laid = renderSourceTextPages(normaliseSourceText(patience(), 32), PAGE);
  assert.ok(laid.perPage >= 2, `expected more than one copy a page, got ${laid.perPage}`);
  assert.ok(laid.pages.length >= 1);
  assert.match(laid.pages[0], /dashed/);
});
