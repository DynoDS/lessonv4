'use strict';

// Removes duplicate paragraph-property blocks from a written .pptx.
//
// A paragraph may carry exactly one <a:pPr>, and it must be the first child.
// pptxgenjs 3.12 writes one per *run*, so any sentence built from several runs
// (which is every line carrying a colour marker: "25 x 4 = ||100", a blue [[word]],
// a green {{term}}) ends up with two, three or four. PowerPoint quietly ignores
// the spares while they sit between the runs, so decks open fine and the fault is
// invisible. It surfaces later: edit that sentence in PowerPoint or in any script
// and the spares bunch together, and PowerPoint then offers to repair the file.
//
// This cannot be avoided by changing how the builder calls addText. pptxgenjs
// emits `indent="0" marL="0"` and <a:buNone/> for every run that isn't bulleted,
// so the block is never empty and its own empty-block guard never fires. The only
// place to fix it is the file it has already written.
//
// Keeping the *first* block is what makes this lossless. Within one paragraph
// pptxgenjs derives every block from the same parent options, except the bullet:
// it deliberately does not inherit `bullet` past the first run, so run 1 carries
// <a:buChar> and later runs carry <a:buNone/>. The first block is therefore the
// only one that is right, and the rest are the ones to drop.
//
// The pass verifies its own work and reports what it could not fix, because a
// silent failure here ships a deck that asks the teacher to repair it.

// jszip ships inside pptxgenjs rather than being declared here, and pptxgenjs is
// sometimes the local copy and sometimes the global one, so look in both places
// rather than assuming a layout. Callers may also inject it for testing.
function loadJSZip() {
  const tries = ['jszip', 'pptxgenjs/node_modules/jszip'];
  for (const name of tries) {
    try { return require(name); } catch (_) { /* try the next */ }
  }
  const { execSync } = require('child_process');
  const path = require('path');
  const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
  for (const rel of ['jszip', path.join('pptxgenjs', 'node_modules', 'jszip')]) {
    try { return require(path.join(root, rel)); } catch (_) { /* try the next */ }
  }
  throw new Error('could not find jszip (it normally ships inside pptxgenjs)');
}

const PARAGRAPH = /<a:p>([\s\S]*?)<\/a:p>/g;
const PARA_PROPS = /<a:pPr(?:\s[^>]*?)?(?:\/>|>[\s\S]*?<\/a:pPr>)/g;

// Leaves the first paragraph-property block in place and drops the rest.
function dedupeParagraphProps(xml) {
  let removed = 0;
  const fixed = xml.replace(PARAGRAPH, function (whole, inner) {
    const blocks = inner.match(PARA_PROPS);
    if (!blocks || blocks.length < 2) return whole;
    let seen = false;
    const cleaned = inner.replace(PARA_PROPS, function (block) {
      if (!seen) { seen = true; return block; }
      removed += 1;
      return '';
    });
    return '<a:p>' + cleaned + '</a:p>';
  });
  return { xml: fixed, removed };
}

// Counts paragraphs still carrying more than one block, so the caller can shout
// rather than ship a deck PowerPoint will want to repair.
function countOffendingParagraphs(xml) {
  let n = 0;
  let m;
  PARAGRAPH.lastIndex = 0;
  while ((m = PARAGRAPH.exec(xml)) !== null) {
    const blocks = m[1].match(PARA_PROPS);
    if (blocks && blocks.length > 1) n += 1;
  }
  return n;
}

// Rewrites every slide part of `pptxPath` in place. Returns a summary the caller
// can log; `remaining` above zero means the deck still needs attention.
async function fixParagraphProps(pptxPath, deps) {
  const fs = (deps && deps.fs) || require('fs');
  const JSZip = (deps && deps.JSZip) || loadJSZip();

  const zip = await JSZip.loadAsync(fs.readFileSync(pptxPath));
  const parts = Object.keys(zip.files).filter(function (name) {
    return /^ppt\/(slides|notesSlides)\/[^/]+\.xml$/.test(name);
  });

  let removed = 0;
  let remaining = 0;
  let touched = 0;

  for (const name of parts) {
    const before = await zip.file(name).async('string');
    const result = dedupeParagraphProps(before);
    if (result.removed === 0) continue;
    removed += result.removed;
    touched += 1;
    remaining += countOffendingParagraphs(result.xml);
    // Slide parts are stored deflated in the package pptxgenjs writes; keep that
    // so the rewritten deck stays the same shape as the one it replaces.
    zip.file(name, result.xml, { compression: 'DEFLATE' });
  }

  if (removed > 0) {
    const out = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(pptxPath, out);
  }

  return { removed, remaining, parts: touched };
}

module.exports = { fixParagraphProps, dedupeParagraphProps, countOffendingParagraphs, loadJSZip };
