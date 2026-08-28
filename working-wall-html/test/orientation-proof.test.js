"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { mediaBoxes } = require("./pdf-util");

// Chrome must honour per-page CSS sizes (named @page rules) for the working
// wall to mix portrait and landscape A3 cards in one PDF. preferCSSPageSize
// is already true in worksheet-html's print step; this test guards the one
// behaviour the whole builder depends on.
const HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
@page a3portrait { size: A3 portrait; margin: 0; }
@page a3landscape { size: A3 landscape; margin: 0; }
html, body { margin: 0; padding: 0; }
.p { page: a3portrait; width: 297mm; height: 420mm; page-break-after: always; }
.l { page: a3landscape; width: 420mm; height: 297mm; page-break-after: always; }
</style></head><body>
<div class="p">portrait</div>
<div class="l">landscape</div>
</body></html>`;

test("one PDF carries A3 portrait and A3 landscape pages", async () => {
  const { htmlToPdf } = require("../../worksheet-html/src/chrome");
  const pdf = await htmlToPdf(HTML, {});
  const boxes = mediaBoxes(pdf);
  const near = (v, want) => Math.abs(v - want) <= 3;
  assert.ok(
    boxes.some(([w, h]) => near(w, 842) && near(h, 1191)),
    `no A3 portrait page found; MediaBoxes: ${JSON.stringify(boxes)}`
  );
  assert.ok(
    boxes.some(([w, h]) => near(w, 1191) && near(h, 842)),
    `no A3 landscape page found; MediaBoxes: ${JSON.stringify(boxes)}`
  );
});
