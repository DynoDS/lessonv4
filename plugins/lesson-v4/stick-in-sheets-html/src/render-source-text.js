"use strict";

// A `source-text` item is the read-from piece for a source made of WORDS: a
// witness account, a letter, a diary entry, a recipe, a set of rules, a poem.
//
// The picture form of this already existed as `source-copy`, which takes an
// imagePath, so a lesson whose evidence was text had nowhere to go: the extract
// stayed on the board, and children quoting from it copied it wrong or slowly
// from across the room. A Year 4 history lesson asked children to fill a record
// "using her own words" from an account only the board carried, in the same
// lesson whose worksheet printed a second account for exactly the opposite
// reason (17 September 2026).
//
// Nothing here is written on. The piece is what the child reads while they
// write somewhere else, which is why it prints at reading width with its title
// and attribution attached: cut free of the page, an anonymous block of quoted
// words is a scrap nobody can cite.

const { A4 } = require("./layout-rules");
const { PALETTES } = require("../../shared/visuals/surface-profiles");

const INK = PALETTES.ink.ink;
const GREY = "#999999";

// Reading width. Narrower than `source-copy`'s 165mm default, because this is
// prose rather than a picture: a line much past about 70 characters is harder
// to read, not easier, and two copies of this width sit side by side on the
// landscape page so a class set is half the paper.
const SOURCE_TEXT_WIDTH_MM = 130;
const PAD_MM = 4;            // inside the frame, all round
const TITLE_LINE_MM = 6;     // the source's own heading
const BODY_LINE_MM = 5.5;    // one printed line of the account
const PARA_GAP_MM = 2;       // between paragraphs of the source
const ATTRIB_LINE_MM = 5;    // who said it and when, under the words
const CHAR_MM = 2.0;         // average character advance at 12pt
const TITLE_CHAR_MM = 2.3;   // the heading prints slightly larger
const SLIP_GAP_MM = 5;       // between two slips on a page

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The source's own line breaks are part of it: a witness answer per line, a
// verse, a numbered rule. Keep them, and treat a blank line as a paragraph
// break.
function paragraphsOf(text) {
  return String(text)
    .split(/\n\s*\n/)
    .map((para) => para.split(/\n/).map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0);
}

function printedLines(line, charsPerLine) {
  return Math.max(1, Math.ceil(line.length / charsPerLine));
}

// Validate and normalise one item. Returns the source, or a string naming what
// is missing, in the same shape `normaliseCardSet` uses.
function normaliseSourceText(item, classSize) {
  const spec = item.spec || {};
  const filled = (v) => String(v == null ? "" : v).trim().length > 0;
  if (!filled(spec.text)) {
    return "a text source needs `text`, the words of the source as the child reads them";
  }
  if (!filled(spec.title)) {
    return "a text source needs `title`, what this source is, so the cut-out slip still says what the child is holding";
  }
  const per = spec.per === "child" ? "child" : "pair";
  const copies = per === "child" ? classSize : Math.ceil(classSize / 2);
  const widthMm = Number.isFinite(Number(item.widthMm)) ? Number(item.widthMm)
    : Number.isFinite(Number(spec.widthMm)) ? Number(spec.widthMm)
    : SOURCE_TEXT_WIDTH_MM;
  return {
    label: item.label || spec.title,
    tag: item.tag || "Source",
    title: String(spec.title).trim(),
    attribution: filled(spec.attribution) ? String(spec.attribution).trim() : null,
    paragraphs: paragraphsOf(spec.text),
    per,
    copies,
    widthMm,
  };
}

function heightMmOf(source) {
  const inner = source.widthMm - 2 * PAD_MM;
  const bodyChars = Math.max(10, Math.floor(inner / CHAR_MM));
  const titleChars = Math.max(10, Math.floor(inner / TITLE_CHAR_MM));
  let mm = 2 * PAD_MM;
  mm += printedLines(source.title, titleChars) * TITLE_LINE_MM + PARA_GAP_MM;
  source.paragraphs.forEach((lines, index) => {
    mm += lines.reduce((sum, line) => sum + printedLines(line, bodyChars) * BODY_LINE_MM, 0);
    if (index + 1 < source.paragraphs.length) mm += PARA_GAP_MM;
  });
  if (source.attribution) {
    mm += PARA_GAP_MM + printedLines(source.attribution, bodyChars) * ATTRIB_LINE_MM;
  }
  return mm;
}

function slipHtml(source) {
  const body = source.paragraphs
    .map((lines) => `<div style="margin-bottom:${PARA_GAP_MM}mm">${lines.map(esc).join("<br>")}</div>`)
    .join("");
  const attribution = source.attribution
    ? `<div style="font-size:10pt;color:${GREY};margin-top:${PARA_GAP_MM}mm">${esc(source.attribution)}</div>`
    : "";
  return (
    `<div style="width:${source.widthMm}mm;box-sizing:border-box;padding:${PAD_MM}mm;` +
    `border:0.3mm solid ${INK};border-radius:2mm;color:${INK}">` +
    `<div style="font-weight:bold;font-size:13pt;line-height:${TITLE_LINE_MM}mm;` +
    `margin-bottom:${PARA_GAP_MM}mm">${esc(source.title)}</div>` +
    `<div style="font-size:12pt;line-height:${BODY_LINE_MM}mm">${body}</div>` +
    `${attribution}</div>`
  );
}

// Lay one text source's copies onto landscape pages, the way the card kits do:
// whole slips only, dashed guides between them, nothing shrunk and nothing cut.
// Returns { error } instead of pages when one slip cannot fit a page, because a
// source with its last paragraph missing is a different source.
function renderSourceTextPages(source, { printableWMm, printableHMm, pageHtml }) {
  const heightMm = heightMmOf(source);
  if (heightMm > printableHMm) {
    return {
      error:
        `one copy needs ${Math.ceil(heightMm)} mm of page height and the page holds ${printableHMm} mm; ` +
        "shorten the extract to the part children actually read, or split it into two sources, " +
        "because the piece will not shrink the words or cut the end off",
    };
  }
  if (source.widthMm > printableWMm) {
    return {
      error:
        `one copy is ${Math.ceil(source.widthMm)} mm wide and the page holds ${printableWMm} mm; ` +
        "set a smaller widthMm",
    };
  }
  const cols = Math.max(1, Math.floor((printableWMm + SLIP_GAP_MM) / (source.widthMm + SLIP_GAP_MM)));
  const rows = Math.max(1, Math.floor((printableHMm + SLIP_GAP_MM) / (heightMm + SLIP_GAP_MM)));
  const perPage = cols * rows;
  const per = source.per === "child" ? "one each" : "one between two";
  const caption =
    `✂ ${source.tag}: ${source.label}. Cut along the dashed lines. ` +
    `${per[0].toUpperCase()}${per.slice(1)}; ${source.copies} cop${source.copies === 1 ? "y" : "ies"}. ` +
    "Nothing is written on this one.";

  const slip = slipHtml(source);
  const pages = [];
  for (let printed = 0; printed < source.copies; printed += perPage) {
    const onThisPage = Math.min(perPage, source.copies - printed);
    const rowHtml = [];
    for (let r = 0; r * cols < onThisPage; r++) {
      const inRow = Math.min(cols, onThisPage - r * cols);
      const cells = [];
      for (let c = 0; c < inRow; c++) {
        const gap = c + 1 < inRow ? `border-right:0.3mm dashed ${GREY};padding-right:${SLIP_GAP_MM / 2}mm;margin-right:${SLIP_GAP_MM / 2}mm;` : "";
        cells.push(`<div style="${gap}">${slip}</div>`);
      }
      const below = (r + 1) * cols < onThisPage
        ? `border-bottom:0.3mm dashed ${GREY};padding-bottom:${SLIP_GAP_MM / 2}mm;margin-bottom:${SLIP_GAP_MM / 2}mm;`
        : "";
      rowHtml.push(`<div style="display:flex;align-items:flex-start;${below}">${cells.join("")}</div>`);
    }
    pages.push(pageHtml(caption, rowHtml.join("")));
  }
  return { pages, heightMm, perPage, cols, rows };
}

module.exports = {
  normaliseSourceText,
  renderSourceTextPages,
  SOURCE_TEXT_WIDTH_MM,
  A4,
};
