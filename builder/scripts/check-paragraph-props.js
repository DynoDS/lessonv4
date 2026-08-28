#!/usr/bin/env node
'use strict';

// Guards the paragraph-properties fix.
//
// pptxgenjs writes one <a:pPr> per run instead of one per paragraph, which leaves
// every colour-marked line invalid and eventually has PowerPoint offering to repair
// the deck (see src/fix-paragraph-props.js). The fix runs on every build; this
// proves it still works, on the real library rather than on a description of it.
//
// Both parts assert the invariant we actually want (one block per paragraph, the
// first one kept) rather than the bug's presence, so if a future pptxgenjs release
// stops duplicating them, this check stays green instead of failing on good news.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const requireGlobal = require('../src/require-global');
const {
  fixParagraphProps,
  dedupeParagraphProps,
  countOffendingParagraphs,
} = require('../src/fix-paragraph-props');

let failures = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log('  ok   ' + name);
  } catch (err) {
    failures += 1;
    console.log('  FAIL ' + name + '\n         ' + String(err.message || err).split('\n')[0]);
  }
}

// A paragraph shaped the way pptxgenjs shapes a bulleted line: the bullet lives in
// the first block and later runs carry buNone, so keeping the first is what
// preserves the bullet.
const BULLETED = '<a:p>'
  + '<a:pPr indent="-171450" marL="171450"><a:buChar char="&#8226;"/></a:pPr>'
  + '<a:r><a:t>The canopy is </a:t></a:r>'
  + '<a:pPr indent="0" marL="0"><a:buNone/></a:pPr>'
  + '<a:r><a:t>not</a:t></a:r>'
  + '<a:pPr indent="0" marL="0"><a:buNone/></a:pPr>'
  + '<a:r><a:t> the top.</a:t></a:r>'
  + '</a:p>';

async function main() {
  await check('drops the spare blocks and keeps the bullet', function () {
    const out = dedupeParagraphProps(BULLETED);
    assert.strictEqual(out.removed, 2, 'expected 2 spare blocks removed, got ' + out.removed);
    assert.strictEqual((out.xml.match(/<a:pPr/g) || []).length, 1, 'should be exactly one block left');
    assert.ok(out.xml.indexOf('buChar') !== -1, 'the bullet must survive');
    assert.ok(out.xml.indexOf('buNone') === -1, 'the later no-bullet blocks must go');
    assert.strictEqual(countOffendingParagraphs(out.xml), 0);
  });

  await check('keeps every run, so no words are lost', function () {
    const out = dedupeParagraphProps(BULLETED);
    assert.strictEqual((out.xml.match(/<a:r>/g) || []).length, 3);
    assert.ok(out.xml.indexOf('The canopy is ') !== -1);
    assert.ok(out.xml.indexOf('not') !== -1);
    assert.ok(out.xml.indexOf(' the top.') !== -1);
  });

  await check('leaves a well-formed paragraph untouched', function () {
    const good = '<a:p><a:pPr indent="0" marL="0"><a:buNone/></a:pPr><a:r><a:t>One run.</a:t></a:r></a:p>';
    const out = dedupeParagraphProps(good);
    assert.strictEqual(out.removed, 0);
    assert.strictEqual(out.xml, good);
  });

  // End to end against the installed pptxgenjs, so a version bump that changes how
  // paragraphs are written is caught here rather than by a teacher whose deck asks
  // to be repaired ten minutes before a lesson.
  await check('a deck written by pptxgenjs comes out with one block per paragraph', async function () {
    const PptxGenJS = requireGlobal('pptxgenjs');
    const JSZip = requireGlobal('jszip');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppr-'));
    const tmp = path.join(dir, 'check.pptx');

    const pptx = new PptxGenJS();
    const slide = pptx.addSlide();
    // A colour-marked sentence: several runs in one paragraph, the case that
    // duplicates.
    slide.addText([
      { text: 'The canopy is ', options: { color: '000000' } },
      { text: 'not', options: { color: '0070C0', bold: true } },
      { text: ' the top.', options: { color: '000000' } },
    ], { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 20, align: 'left' });
    // A bulleted list, where keeping the first block rather than a later one matters.
    slide.addText([
      { text: 'One', options: { bullet: true, breakLine: true } },
      { text: 'two', options: { bullet: true, color: '00B050' } },
    ], { x: 0.5, y: 2, w: 9, h: 1, fontSize: 18, bullet: true });

    await pptx.writeFile({ fileName: tmp });
    const result = await fixParagraphProps(tmp, { fs, JSZip });
    assert.strictEqual(result.remaining, 0, result.remaining + ' paragraph(s) still hold duplicate blocks');

    const zip = await JSZip.loadAsync(fs.readFileSync(tmp));
    const xml = await zip.file('ppt/slides/slide1.xml').async('string');
    assert.strictEqual(countOffendingParagraphs(xml), 0, 'rewritten slide still has duplicates');
    assert.ok(xml.indexOf('0070C0') !== -1, 'the blue run lost its colour');
    assert.ok(xml.indexOf('00B050') !== -1, 'the green run lost its colour');
    assert.ok(xml.indexOf('buChar') !== -1, 'the bullets were lost');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  if (failures) {
    console.error('\nParagraph-props guard FAILED (' + failures + '). Decks may ask PowerPoint to repair them.');
    process.exit(1);
  }
  console.log('Paragraph props OK: one properties block per paragraph, colours and bullets intact.');
}

main().catch(function (err) {
  console.error(err.stack || err.message || err);
  process.exit(1);
});
