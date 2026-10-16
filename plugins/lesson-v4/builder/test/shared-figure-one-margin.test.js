'use strict';

// A drawing from shared/visuals/ keeps one margin inside its white card.
//
// Every shared drawing is placed with a margin of its own, and its card added
// a second on top: a fifth of an inch of white round each chart. Three
// children's column sums side by side on a Year 4 Apply slide came out tall and
// thin in thick cards (the teacher, 16 October 2026: "cards behind them don't
// have to be as thick", and the charts could be wider). A table already kept
// one margin by his choice of 7 October; the drawings now do the same.

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const JSZip = require('jszip');

const EMU = 914400;
const PAD = 0.1;

function chart(answer) {
  return {
    type: 'place-value-chart',
    columns: ['Th', 'H', 'T', 'O'],
    calculation: { operator: '-', numbers: ['4573', '276'], answer, worked: true },
  };
}

async function drawn(slide) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-resources-slide-design-check-'));
  try {
    const spec = path.join(dir, 'lesson.json');
    fs.writeFileSync(spec, JSON.stringify({ lessonName: 'One margin', subject: 'Maths', lo: 'One margin', slides: [slide] }));
    const run = spawnSync(process.execPath, [path.join(__dirname, '..', 'build.js'), spec, dir, '--design-preview', '--skip-optional-decorations'], { encoding: 'utf8' });
    const wrote = /^(?:PARTIAL_PREVIEW|Wrote): (.+\.pptx)\s*$/m.exec(`${run.stdout}\n${run.stderr}`);
    assert.ok(wrote, run.stdout + run.stderr);
    const zip = await JSZip.loadAsync(fs.readFileSync(wrote[1].trim()));
    const xml = await zip.file('ppt/slides/slide1.xml').async('string');
    const box = (block) => {
      const off = /<a:off x="(-?\d+)" y="(-?\d+)"/.exec(block);
      const ext = /<a:ext cx="(\d+)" cy="(\d+)"/.exec(block);
      return { x: off[1] / EMU, y: off[2] / EMU, w: ext[1] / EMU, h: ext[2] / EMU };
    };
    return {
      pictures: (xml.match(/<p:pic>[\s\S]*?<\/p:pic>/g) || []).map(box),
      cards: (xml.match(/<p:sp>[\s\S]*?<\/p:sp>/g) || []).filter((b) => /prstGeom prst="roundRect"/.test(b)).map(box),
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('three worked sums in a row each sit in a card one margin wider than the chart', async () => {
  const { pictures, cards } = await drawn({
    template: 'body-full',
    title: 'Apply',
    body: { type: 'row', items: [chart('4303'), chart('4307'), chart('4297')] },
  });
  assert.equal(pictures.length, 3);
  for (const pic of pictures) {
    const card = cards.find((c) => c.x <= pic.x + 1e-3 && c.x + c.w >= pic.x + pic.w - 1e-3 && c.y <= pic.y + 1e-3 && c.y + c.h >= pic.y + pic.h - 1e-3);
    assert.ok(card, `a card round the chart at ${JSON.stringify(pic)}`);
    const sides = [pic.x - card.x, card.x + card.w - pic.x - pic.w, pic.y - card.y, card.y + card.h - pic.y - pic.h];
    // The tightest side is the one that holds the chart: one margin there, not two.
    assert.ok(Math.min(...sides) <= PAD + 0.02, `margins ${sides.map((s) => s.toFixed(3)).join(', ')}in`);
  }
});
