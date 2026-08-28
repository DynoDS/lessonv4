"use strict";

// Every /MediaBox [...] in a PDF file, as [w, h] rounded to the nearest pt.
// Used to assert page count and page size without needing a PDF-parsing
// dependency - good enough for test assertions, not a general PDF reader.
function mediaBoxes(pdfBuffer) {
  const text = pdfBuffer.toString("latin1");
  const boxes = [];
  const re = /\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    boxes.push([Math.round(m[3] - m[1]), Math.round(m[4] - m[2])]);
  }
  return boxes;
}

module.exports = { mediaBoxes };
