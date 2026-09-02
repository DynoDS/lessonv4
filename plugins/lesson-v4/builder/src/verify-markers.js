'use strict';

// Catches an inline marker that reached the board as text instead of colour.
//
// `answer-text.js` turns `||100`, `**word**`, `[[word]]`, `{{word}}` and
// `<<367>>` into coloured runs. About twenty content helpers route their strings
// through it. The other fifty do not, and there is nothing in a spec to say
// which is which: the same `||Table lamp` is a green reveal inside a table cell
// and the literal characters `||Table lamp` inside a sort-board tile.
//
// That is what happened. A repair added `||` to the four answers on a Starter
// answers slide - the right instinct, since `||` is exactly how an answer is
// revealed in green - and the sort board printed the bars. The build wrote the
// deck and said "No warnings." It reached a person only at visual review, and
// undoing it cost a second full rebuild.
//
// Checking the written package rather than the spec is what makes this general.
// A marker that a helper consumed is gone from the XML; a marker that no helper
// read is still sitting in an `<a:t>`. So this needs no register of which helper
// parses what, cannot drift out of date as helpers are added, and asks the only
// question that matters: is this marker about to be projected at a class?
//
// It reads the package and changes nothing.

const { loadJSZip } = require('./fix-paragraph-props');

const SLIDE_PART = /^ppt\/slides\/slide(\d+)\.xml$/;
const TEXT_RUN = /<a:t>([\s\S]*?)<\/a:t>/g;

// A paired marker is unambiguous: nobody types `{{` and `}}` around a word by
// accident, and `answer-text.js` documents an UNpaired marker as deliberately
// literal ("a stray ** never corrupts the run"), so an unmatched one is not a
// fault and is not looked for here.
//
// `||` is a line-tail marker rather than a paired one, so it is recognised by
// the shape it is actually authored in: the bars followed immediately by the
// answer. That is what keeps a maths slide's "AB || CD" for parallel lines out
// of this - the parallel notation has a space after the bars, the reveal marker
// never does.
const MARKERS = [
  { name: '||', pattern: /\|\|(?=\S)/ },
  { name: '**bold**', pattern: /\*\*\S[\s\S]*?\*\*/ },
  { name: '[[focus blue]]', pattern: /\[\[\S[\s\S]*?\]\]/ },
  { name: '{{answer green}}', pattern: /\{\{\S[\s\S]*?\}\}/ },
  { name: '<<supplied orange>>', pattern: /<<\S[\s\S]*?>>/ },
];

function unescapeXml(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

// The markers a single rendered string still carries, by their reader-facing
// name. One string can only really carry one authoring mistake, but reporting
// every marker found saves a second build to discover the next one.
function markersIn(text) {
  return MARKERS.filter((marker) => marker.pattern.test(text)).map((m) => m.name);
}

function shorten(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 60 ? `${clean.slice(0, 57)}...` : clean;
}

// One shape's worth of XML at a time, so runs are only ever rejoined with the
// runs they are actually drawn beside. Joining a whole slide would pair a `[[`
// in one text box with a `]]` in another that has nothing to do with it. Used
// only for the rejoined pass; the run-by-run pass reads the whole slide, so a
// helper whose text sits outside a shape still gets checked.
function shapesIn(xml) {
  return xml.match(/<p:sp>[\s\S]*?<\/p:sp>/g) || [];
}

function fault(slide, part, markers, text, splitAcrossLines) {
  const where = splitAcrossLines
    ? `slide ${slide} shows the ${markers.join(' and ')} marker as text, ` +
      `split over a line break: "${shorten(text)}". The marker opens on one ` +
      `line and closes on another, so the helper drawing it read neither half ` +
      `and both sets of characters project at the class. Keep a marked span ` +
      `on one line, or move the string to a helper that reads markers.`
    : `slide ${slide} shows the ${markers.join(' and ')} marker as text: ` +
      `"${shorten(text)}". The helper drawing this string does not read ` +
      `inline markers, so the characters project at the class instead of ` +
      `colouring the answer. Move the string to a helper that reads them, ` +
      `or write the words plainly and let the slide's own colour do the ` +
      `work.`;
  return { slide, part, markers, text: shorten(text), message: where };
}

async function verifyMarkers(pptxPath, deps) {
  const JSZip = (deps && deps.JSZip) || loadJSZip();
  const fs = (deps && deps.fs) || require('fs');

  const zip = await JSZip.loadAsync(fs.readFileSync(pptxPath));
  const faults = [];
  let checked = 0;

  const parts = Object.keys(zip.files)
    .filter((name) => SLIDE_PART.test(name))
    .sort(
      (a, b) => Number(SLIDE_PART.exec(a)[1]) - Number(SLIDE_PART.exec(b)[1])
    );

  for (const part of parts) {
    const slide = Number(SLIDE_PART.exec(part)[1]);
    const xml = await zip.file(part).async('string');

    // Every run on the slide, whatever element holds it, so this check's
    // coverage never depends on where a helper happens to put its text.
    const seen = new Set();
    let match;
    TEXT_RUN.lastIndex = 0;
    while ((match = TEXT_RUN.exec(xml)) !== null) {
      checked += 1;
      const text = unescapeXml(match[1]);
      const found = markersIn(text);
      if (!found.length) continue;
      found.forEach((name) => seen.add(name));
      faults.push(fault(slide, part, found, text));
    }

    // Then the pairs that are only visible once a shape's runs are put back
    // together. A line break in the authored string starts a new <a:p>, so
    // "[[Which rule helps?\nName it and explain why.]]" reaches the XML as two
    // runs holding one unpaired half each. Unpaired is documented as
    // deliberately literal, so run by run both halves looked innocent and the
    // build said "No warnings" over a slide about to show [[ and ]] to a class.
    for (const shape of shapesIn(xml)) {
      const texts = [];
      let run;
      TEXT_RUN.lastIndex = 0;
      while ((run = TEXT_RUN.exec(shape)) !== null) {
        texts.push(unescapeXml(run[1]));
      }
      if (texts.length < 2) continue;
      const joined = texts.join('\n');
      const split = markersIn(joined).filter((name) => !seen.has(name));
      if (!split.length) continue;
      faults.push(fault(slide, part, split, joined, true));
    }
  }

  return { faults, slides: parts.length, runs: checked };
}

module.exports = { verifyMarkers, markersIn, MARKERS };
