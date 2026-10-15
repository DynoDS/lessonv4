#!/usr/bin/env node
'use strict';

// Measure the slides written so far, while the deck is still being written.
//
// The full slide check judges a finished deck: every unit present, every pair
// matched, every rule read. A deck half written fails it for being unfinished,
// so a designer could only find out whether a slide's content fits its
// arrangement once all of them were written, and four stress-test designers
// built whole throwaway decks to ask the engine sooner (7 October 2026). This
// asks the one question that can be answered early: drawn at its real size,
// does each of these slides hold what it was given?
//
// It draws the slides into a scratch folder, publishes nothing and changes no
// lesson file. It reads sizes only: a slide it calls OK can still be refused by
// the full check for a rule that needs the whole deck.
//
// Three things the first designers to use it asked for (12 October 2026):
//   - a note is told apart from a refusal. DOES NOT FIT is only what the full
//     check would refuse; anything else the build remarks on is printed as a
//     NOTE under a slide that is still OK;
//   - the notes include writing set under the 20pt the board aims for and a
//     card whose words fill less than half of it, because "fits" is not "looks
//     right" and those two were only found later, on the drawn pages;
//   - the drawn deck is kept (measure-preview/ beside the file) so there is
//     something to look at before the full check.
//
// Usage: node measure-slides.js <slides.json>
//   <slides.json> is a lesson spec, or a part of one: the same top-level
//   fields with any number of slides in `slides`.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { BLOCKING_CAPACITY_SIGNALS } = require('./check-slide-design');

function slideNumbers(text) {
  return String(text).split(',').map((n) => Number(n.trim())).filter((n) => Number.isInteger(n) && n > 0);
}

// What the build said, sorted into what the full check would refuse and what
// it would only remark on.
function readBuild(output) {
  const refused = new Map();
  const notes = new Map();
  const add = (map, slide, text) => {
    if (!map.has(slide)) map.set(slide, []);
    if (!map.get(slide).includes(text)) map.get(slide).push(text);
  };
  const laidOut = new Set();
  const lines = String(output || '').split(/\r?\n/);
  for (const line of lines) {
    const failed = /^\s*✗ slide (\d+): (.*)$/.exec(line) || /^\[error\] slide (\d+): (.*)$/.exec(line);
    if (failed) {
      add(refused, Number(failed[1]), failed[2]);
      laidOut.add(`${failed[1]}|${failed[2].split(':')[0]}`);
    }
  }
  let section = null;
  for (const line of lines) {
    if (line.startsWith('BUILD_DIAGNOSTIC: ')) {
      let d = null;
      try {
        d = JSON.parse(line.slice('BUILD_DIAGNOSTIC: '.length));
      } catch {
        continue;
      }
      const slide = d && d.location && d.location.slide;
      if (!Number.isFinite(slide) || d.faultClass === 'note') continue;
      const text = `${d.signal}: ${d.message}`;
      const blocks = /_OVERLOAD$/.test(d.signal) || BLOCKING_CAPACITY_SIGNALS.has(d.signal) ||
        laidOut.has(`${slide}|${d.signal}`);
      if (blocks) {
        if (!laidOut.has(`${slide}|${d.signal}`)) add(refused, slide, text);
      } else {
        add(notes, slide, text);
      }
      continue;
    }
    if (line.startsWith('SLIDE_TEXT_BELOW_TARGET:')) { section = 'small'; continue; }
    if (line.startsWith('SLIDE_TEXT_UNDERFILLED:')) { section = 'empty'; continue; }
    const small = section === 'small' ? /^\s+slides? ([\d, ]+) at (\d+)pt: "(.*)"\s*$/.exec(line) : null;
    const empty = section === 'empty' ? /^\s+slides? ([\d, ]+) at (\d+)% of ([\d.]+in): "(.*)"\s*$/.exec(line) : null;
    if (small) {
      // A bracketed number and a one-word cue are small on purpose.
      if (small[3].length > 12) {
        slideNumbers(small[1]).forEach((n) => add(notes, n, `writing at ${small[2]}pt, under the 20pt the board aims for: "${small[3]}"`));
      }
    } else if (empty) {
      slideNumbers(empty[1]).forEach((n) => add(notes, n, `a card whose words fill only ${empty[2]}% of it: "${empty[4]}"`));
    } else if (line.trim() !== '') {
      section = null;
    }
  }
  return { refused, notes };
}

function main(argv) {
  const target = argv[0];
  if (!target || !fs.existsSync(target)) {
    console.error('Usage: node measure-slides.js <slides.json>');
    return 1;
  }
  let lesson;
  try {
    lesson = JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (error) {
    console.error(`MEASURE_UNREADABLE: ${target} is not valid JSON: ${error.message}`);
    return 1;
  }
  const slides = Array.isArray(lesson.slides) ? lesson.slides : [];
  if (!slides.length) {
    console.error('MEASURE_UNREADABLE: no slides to measure.');
    return 1;
  }

  // Beside the lesson, so relative picture paths resolve as they will in the deck.
  const folder = path.dirname(path.resolve(target));
  const trialPath = path.join(folder, `.${path.basename(target)}.measure-${process.pid}.json`);
  let preview = null;
  const draw = (trial) => {
    const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-resources-slide-design-check-'));
    try {
      fs.writeFileSync(trialPath, JSON.stringify(trial));
      const child = spawnSync(
        process.execPath,
        [path.join(__dirname, '..', 'build.js'), trialPath, scratchDir, '--design-preview', '--skip-optional-decorations'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 20 * 1024 * 1024 }
      );
      const said = `${child.stdout || ''}\n${child.stderr || ''}`;
      const drawn = /^(?:PARTIAL_PREVIEW|Wrote): (.+\.pptx)\s*$/m.exec(said);
      if (drawn && fs.existsSync(drawn[1].trim())) {
        try {
          const keep = path.join(folder, 'measure-preview');
          fs.mkdirSync(keep, { recursive: true });
          preview = path.join(keep, 'measured-slides.pptx');
          fs.copyFileSync(drawn[1].trim(), preview);
        } catch {
          preview = null;
        }
      }
      return said;
    } finally {
      try {
        fs.rmSync(trialPath, { force: true });
        fs.rmSync(scratchDir, { recursive: true, force: true });
      } catch {
        // Nothing left behind changes the answer.
      }
    }
  };

  // A slide written in a way the build cannot read stops the whole file being
  // drawn, and the first designer to meet that learned nothing about the five
  // sound slides beside it (12 October 2026). So a slide the build names as
  // unreadable is set aside, reported with the build's own reason, and the
  // rest are measured.
  const trial = Object.assign({}, lesson, { slides: slides.slice() });
  const unreadable = new Map();
  let output = draw(trial);
  for (let tries = 0; tries < MOST_SET_ASIDE && !/^(PARTIAL_PREVIEW|Wrote): /m.test(output); tries += 1) {
    const said = output.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('BUILD_DIAGNOSTIC: '));
    const naming = said.filter((line) => /\bslide \d+\b/i.test(line)).pop() || '';
    const named = /\bslide (\d+)\b/i.exec(naming);
    const n = named ? Number(named[1]) : 0;
    if (!(n >= 1 && n <= slides.length) || unreadable.has(n)) break;
    unreadable.set(n, naming.trim());
    trial.slides[n - 1] = { template: 'body-full', title: (slides[n - 1] && slides[n - 1].title) || '', body: { type: 'text', value: 'This slide was set aside.' } };
    output = draw(trial);
  }
  if (!/^(PARTIAL_PREVIEW|Wrote): /m.test(output)) {
    console.error('MEASURE_NOT_DRAWN: the slides could not be drawn, so nothing is known about their sizes. What the build said:');
    console.error(output.split(/\r?\n/).filter((line) => line.trim()).slice(-12).join('\n'));
    return 1;
  }

  const { refused, notes } = readBuild(output);
  slides.forEach((slide, index) => {
    const n = index + 1;
    const title = slide && slide.title ? ` "${slide.title}"` : '';
    if (unreadable.has(n)) {
      console.log(`MEASURE slide ${n}${title}: COULD NOT BE DRAWN, so its size is not known`);
      console.log(`  ${unreadable.get(n)}`);
      return;
    }
    const problems = refused.get(n) || [];
    console.log(`MEASURE slide ${n}${title}: ${problems.length ? 'DOES NOT FIT' : 'OK'}`);
    problems.forEach((text) => console.log(`  ${text}`));
    // The header cue prints at one fixed small size on every slide, so a note
    // about it says nothing a designer can act on.
    const cue = String((slide && slide.instruction) || '').replace(/\*\*|\|\||\[\[|\]\]|<<|>>|\{\{|\}\}/g, '').trim();
    const kept = (notes.get(n) || [])
      .filter((text) => !(cue && /^writing at \d+pt/.test(text) && text.includes(`"${cue.slice(0, 60)}"`)));
    // A criteria panel is six lines at one size, and six notes a slide across
    // a deck is more than a Codex command may print before the host cuts the
    // middle out of it. One line says how many and shows the first.
    const small = kept.filter((text) => /^writing at \d+pt/.test(text));
    const others = kept.filter((text) => !small.includes(text));
    if (small.length > 1) {
      console.log(`  NOTE (not a refusal): ${small.length} pieces of ${small[0].replace(/: ".*$/, '')}, the first: ${small[0].replace(/^[^"]*/, '')}`);
    } else {
      small.forEach((text) => console.log(`  NOTE (not a refusal): ${text}`));
    }
    others.forEach((text) => console.log(`  NOTE (not a refusal): ${text.length > 400 ? `${text.slice(0, 400)}...` : text}`));
  });
  const bad = refused.size + unreadable.size;
  console.log(bad
    ? `MEASURE_RESULT: ${bad} of ${slides.length} slide(s) do not fit yet or could not be drawn`
    : `MEASURE_RESULT: all ${slides.length} slide(s) fit`);
  if (preview) {
    console.log(`MEASURE_PREVIEW: ${preview}`);
    console.log('  The slides as drawn (a slide that does not fit is a "check this slide" page). Render it to look; it is never the checked deck.');
  }
  return 0;
}

const MOST_SET_ASIDE = 6;

module.exports = { readBuild };

if (require.main === module) process.exit(main(process.argv.slice(2)));
