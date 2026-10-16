'use strict';

// An answer that is "nothing needs doing" is still an answer (output-template.md
// -> answer-slide). Year 4 column subtraction, 16 October 2026: the task said
// "If no column needs one, write no exchange", and the answers slide showed the
// first of three sums with nothing on it. A column sum now carries a typed
// caption (`label`), and the build keeps the room for it on the other sums in
// the row and on the question slide, so no chart moves or changes size.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const JSZip = require('jszip');

const ROOT = path.resolve(__dirname, '..');
const EMU = 914400;
const BLANK = ['​', '​', '​', '​'];

function chart(numbers, extra) {
  return Object.assign({ type: 'place-value-chart', columns: ['Th', 'H', 'T', 'O'],
    calculation: Object.assign({ operator: '-', numbers, answer: BLANK }, extra && extra.calc) }, extra && extra.chart);
}

function slide(title, charts) {
  return { template: 'split-h-60-40', title, designUnitId: 'lesson-section/teaching-sequence/unit-002',
    speakerNotes: 'Say to children: find the exchange.', primary: { type: 'stack', items: [
      { type: 'text', value: 'Which column needs an exchange? If no column needs one, write no exchange.', colorRole: 'task-blue' },
      { type: 'row', items: charts, weight: 4 }
    ] }, secondary: { type: 'sc-panel', content: { type: 'steps', steps: ['Start with the ones.', 'Not enough to take away? Exchange.'] } } };
}

async function pictures(dir, n) {
  const deck = path.join(dir, fs.readdirSync(dir).find((name) => name.endsWith('.pptx')));
  const zip = await JSZip.loadAsync(fs.readFileSync(deck));
  const xml = await zip.file(`ppt/slides/slide${n}.xml`).async('string');
  const pics = xml.split('<p:pic>').slice(1).map((block) => {
    const at = block.match(/<a:off x="(\d+)" y="(\d+)"\/>\s*<a:ext cx="(\d+)" cy="(\d+)"/);
    return { x: at[1] / EMU, y: at[2] / EMU, w: at[3] / EMU, h: at[4] / EMU };
  }).filter((p) => p.h > 1).sort((a, b) => a.x - b.x);
  return { xml, pics };
}

test('the answers slide prints "no exchange" under the sum, and no chart moves or changes size', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nothing-to-do-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const specPath = path.join(dir, 'lesson.json');
  fs.writeFileSync(specPath, JSON.stringify({ lessonName: 'Column subtraction', yearGroup: 'Year 4', subject: 'Maths',
    lo: 'To subtract using columns', slides: [
      slide('Your Turn', [chart(['2859', '413']), chart(['4193', '621']), chart(['6825', '371'])]),
      slide('Answers', [chart(['2859', '413'], { chart: { label: '||no exchange' } }),
        chart(['4193', '621'], { calc: { exchanges: [{ from: 'Th', to: 'H' }] } }),
        chart(['6825', '371'], { calc: { exchanges: [{ from: 'H', to: 'T' }] } })])
    ] }));
  const result = spawnSync(process.execPath, [path.join(ROOT, 'build.js'), specPath, dir], { encoding: 'utf8' });
  assert.equal(result.status, 0, (result.stdout || '') + (result.stderr || ''));
  const question = await pictures(dir, 1);
  const answers = await pictures(dir, 2);
  // The task line says "write no exchange" too, so look for the caption alone.
  assert.ok(/<a:t>no exchange<\/a:t>/.test(answers.xml), 'the answer is printed under the sum');
  assert.equal(answers.pics.length, 3);
  // A sum with an exchange draws a row of marks above it, so it is taller;
  // the width says whether the three are drawn at one size.
  const widths = answers.pics.map((p) => p.w.toFixed(2));
  assert.equal(new Set(widths).size, 1, `three sums one size on the answers slide, got ${widths.join(', ')}`);
  const [before, after] = [question.pics[0], answers.pics[0]];
  for (const key of ['x', 'y', 'w', 'h']) {
    assert.ok(Math.abs(before[key] - after[key]) < 0.01, `the first sum keeps its ${key} (${before[key].toFixed(2)} then ${after[key].toFixed(2)})`);
  }
});
