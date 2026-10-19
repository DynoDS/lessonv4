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
// A slide that does not fit is also tried in the arrangements next to its own
// (other widths of the same split, the two sides' shares swapped, and two
// stacked criteria lists moved one either side of the work), and the ones that
// hold it are named under it. The engine already knows the sizes, and a Year 4
// designer spent most of an hour trying about a hundred arrangements by hand
// before finding one the teacher then passed (17 October 2026). It only names
// them: the designer still chooses, because an arrangement that fits is not
// always one the teacher wants (12 October 2026).
//
// It also reads every rule the full check applies and prints any broken as a
// RULE line under its slide: the ones that look at one slide alone (titles,
// colours, a turn with no task, a line or picture twice, the story under its
// instruction: SLIDE_BY_SLIDE_RULES) and the ones that need the whole deck (a
// reveal and its answer slide, where a word card sits, criteria from the first
// working slide, the Teach slide rules: WHOLE_DECK_RULES), with the helper
// delivery and landed sentence checks the run applies beside it. The only
// other way to know before the check was to read the check's code, which both
// Year 4 science slide designers did for 9 and 13 minutes (17 October 2026).
// While the lesson design has units no slide carries, it names them, because
// a whole-deck rule may then be about a slide not yet written.
//
// Usage: node measure-slides.js <slides.json>
//   <slides.json> is a lesson spec, or a part of one: the same top-level
//   fields with any number of slides in `slides`.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { BLOCKING_CAPACITY_SIGNALS, slideBySlideWarnings, wholeDeckWarnings } = require('./check-slide-design');

function slideNumbers(text) {
  return String(text).split(',').map((n) => Number(n.trim())).filter((n) => Number.isInteger(n) && n > 0);
}

// The build's notes are for the run report and are left out here, except the
// ones that answer a question the designer would otherwise hunt for: a counters
// pair drawn smaller says what room it needed whole.
const NOTES_FOR_THE_DESIGNER = new Set(['PLACE_VALUE_PAIR_DRAWN_SMALLER']);

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
      if (!Number.isFinite(slide) || (d.faultClass === 'note' && !NOTES_FOR_THE_DESIGNER.has(d.signal))) continue;
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

// The arrangements next to a slide's own. Only splits are tried: their two
// zones carry over to another width without anything being re-sorted, and a
// stack of two criteria panels splits cleanly into the two outer thirds.
const SPLIT_SHARES = ['50-50', '60-40', '70-30', '75-25'];
const OTHER_SIDE = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };

function isCriteriaPanel(item) {
  return !!item && item.type === 'sc-panel';
}

function twoCriteriaLists(zone) {
  return !!zone && zone.type === 'stack' && Array.isArray(zone.items) &&
    zone.items.length === 2 && zone.items.every(isCriteriaPanel);
}

function withoutWeight(item) {
  const copy = Object.assign({}, item);
  delete copy.weight;
  return copy;
}

function nearbyArrangements(slide) {
  const split = /^split-([hv])-(\d+)-(\d+)$/.exec(String((slide && slide.template) || ''));
  if (!split || !slide.primary || !slide.secondary) return [];
  const dir = split[1];
  const side = slide.primarySide || (dir === 'h' ? 'left' : 'top');
  const other = OTHER_SIDE[side];
  const out = [];
  for (const share of SPLIT_SHARES) {
    const template = `split-${dir}-${share}`;
    if (template !== slide.template) {
      out.push({
        description: `\`${template}\` as written`,
        slide: Object.assign({}, slide, { template })
      });
    }
    if (share !== '50-50') {
      out.push({
        description: `\`${template}\` with \`primary\` and \`secondary\` swapped and \`primarySide: "${other}"\`, ` +
          `so each keeps its side and the ${other} one gets the larger share`,
        slide: Object.assign({}, slide, {
          template, primary: slide.secondary, secondary: slide.primary, primarySide: other
        })
      });
    }
  }
  if (dir === 'h') {
    const lists = [slide.primary, slide.secondary].find(twoCriteriaLists);
    const work = lists === slide.primary ? slide.secondary : slide.primary;
    if (lists && !isCriteriaPanel(work) && !twoCriteriaLists(work)) {
      const third = Object.assign({}, slide, {
        template: 'thirds-h',
        left: withoutWeight(lists.items[0]),
        middle: work,
        right: withoutWeight(lists.items[1])
      });
      delete third.primary;
      delete third.secondary;
      delete third.primarySide;
      out.push({
        description: '`thirds-h`, one criteria list either side of the work ' +
          "(the first list's panel in `left`, the work in `middle`, the second in `right`)",
        slide: third
      });
    }
  }
  return out;
}

const MOST_ARRANGEMENTS = 90;

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
  const draw = (trial, keepPreview = true) => {
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
      if (keepPreview && drawn && fs.existsSync(drawn[1].trim())) {
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
  const drawAll = (list, keepPreview) => {
    const trial = Object.assign({}, lesson, { slides: list.slice() });
    const setAside = new Map();
    let said = draw(trial, keepPreview);
    for (let tries = 0; tries < MOST_SET_ASIDE && !/^(PARTIAL_PREVIEW|Wrote): /m.test(said); tries += 1) {
      const lines = said.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('BUILD_DIAGNOSTIC: '));
      const naming = lines.filter((line) => /\bslide \d+\b/i.test(line)).pop() || '';
      const named = /\bslide (\d+)\b/i.exec(naming);
      const n = named ? Number(named[1]) : 0;
      if (!(n >= 1 && n <= list.length) || setAside.has(n)) break;
      setAside.set(n, naming.trim());
      trial.slides[n - 1] = { template: 'body-full', title: (list[n - 1] && list[n - 1].title) || '', body: { type: 'text', value: 'This slide was set aside.' } };
      said = draw(trial, keepPreview);
    }
    return { output: said, unreadable: setAside };
  };
  const { output, unreadable } = drawAll(slides, true);
  if (!/^(PARTIAL_PREVIEW|Wrote): /m.test(output)) {
    console.error('MEASURE_NOT_DRAWN: the slides could not be drawn, so nothing is known about their sizes. What the build said:');
    console.error(output.split(/\r?\n/).filter((line) => line.trim()).slice(-12).join('\n'));
    return 1;
  }

  const { refused, notes } = readBuild(output);

  // The one-slide rules, read from the file as written. A rule that cannot be
  // read never stops the measuring: the full check reads it again.
  const rules = new Map();
  try {
    slideBySlideWarnings(lesson, path.resolve(target)).forEach((warning) => {
      if (!rules.has(warning.slide)) rules.set(warning.slide, []);
      rules.get(warning.slide).push(`${warning.signal}: ${warning.message}`);
    });
  } catch (error) {
    console.log(`MEASURE_RULES_NOT_READ: ${error.message}. The full check still reads every rule.`);
  }
  // The rules that need the whole deck, and the two checks beside the full one.
  let deck = { warnings: [], missingUnits: [], helper: null, landed: null };
  try {
    deck = wholeDeckWarnings(lesson, path.resolve(target));
  } catch (error) {
    console.log(`MEASURE_DECK_RULES_NOT_READ: ${error.message}. The full check still reads every rule.`);
  }
  const deckRules = new Map();
  deck.warnings.forEach((warning) => {
    const n = warning.slide >= 1 && warning.slide <= slides.length ? warning.slide : 1;
    if (!deckRules.has(n)) deckRules.set(n, []);
    deckRules.get(n).push(`${warning.signal}: ${warning.message}`);
  });
  const printRules = (n) => {
    (rules.get(n) || [])
      .forEach((text) => console.log(`  RULE (the full check refuses this): ${text}`));
    (deckRules.get(n) || [])
      .forEach((text) => console.log(`  RULE (the full check refuses this; it reads other slides too): ${text}`));
  };

  // Every refused slide's nearby arrangements, drawn together in one deck.
  const tried = new Map();
  const trials = [];
  for (const n of [...refused.keys()].sort((a, b) => a - b)) {
    const options = nearbyArrangements(slides[n - 1]);
    if (!options.length || trials.length + options.length > MOST_ARRANGEMENTS) continue;
    tried.set(n, options.map((option) => {
      trials.push(option.slide);
      return { description: option.description, at: trials.length };
    }));
  }
  const holds = new Map();
  if (trials.length) {
    const attempt = drawAll(trials, false);
    if (/^(PARTIAL_PREVIEW|Wrote): /m.test(attempt.output)) {
      const verdict = readBuild(attempt.output);
      for (const [n, options] of tried) {
        holds.set(n, options.filter((o) => !verdict.refused.has(o.at) && !attempt.unreadable.has(o.at)));
      }
    } else {
      tried.clear();
    }
  }
  slides.forEach((slide, index) => {
    const n = index + 1;
    const title = slide && slide.title ? ` "${slide.title}"` : '';
    if (unreadable.has(n)) {
      console.log(`MEASURE slide ${n}${title}: COULD NOT BE DRAWN, so its size is not known`);
      console.log(`  ${unreadable.get(n)}`);
      printRules(n);
      return;
    }
    const problems = refused.get(n) || [];
    // A build refusal that is not about room (a reveal pair with no answer
    // half) is not called a fit problem, or the designer moves things about.
    const aboutRoom = problems.some((text) => {
      const signal = String(text).split(':')[0].trim();
      return /_OVERLOAD$/.test(signal) || BLOCKING_CAPACITY_SIGNALS.has(signal);
    });
    const verdict = !problems.length ? 'OK' : aboutRoom ? 'DOES NOT FIT' : 'REFUSED BY THE BUILD (not a size problem)';
    console.log(`MEASURE slide ${n}${title}: ${verdict}`);
    problems.forEach((text) => console.log(`  ${text}`));
    printRules(n);
    if (tried.has(n)) {
      const fit = holds.get(n) || [];
      if (fit.length) {
        console.log(`  FITS AS (measured, not chosen for you): ${fit.length} of the ${tried.get(n).length} nearby arrangements hold this slide:`);
        fit.forEach((o) => console.log(`    - ${o.description}`));
      } else {
        console.log(`  NO NEARBY ARRANGEMENT FITS: none of the ${tried.get(n).length} other split widths, swapped shares or either-side criteria tried holds it. ` +
          'Another split width will not hold it as written: the room has to come from inside the slide (what each part is given), ' +
          'or the beat goes across two slides where the work turns (slide-composition-playbook.md section 6).');
      }
    }
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
  const count = (map) => [...map.values()].reduce((sum, list) => sum + list.length, 0);
  const broken = count(rules) + count(deckRules);
  const onSlides = new Set([...rules.keys(), ...deckRules.keys()]).size;
  console.log(broken
    ? `MEASURE_RULES: ${broken} rule problem(s) on ${onSlides} slide(s), each a RULE line above. The full check refuses them all.`
    : 'MEASURE_RULES: no slide breaks a rule the full check applies.');
  if (deck.missingUnits.length) {
    console.log(`  Not yet on any slide: ${deck.missingUnits.join(', ')}. A RULE line that reads other slides may clear once those are written.`);
  }
  if (deck.helper) {
    if (deck.helper.unavailable) {
      console.log('MEASURE_HELPER_DELIVERY: not checked here (no Python would start). The full check runs it.');
    } else if (deck.helper.ok) {
      console.log(`MEASURE_HELPER_DELIVERY: OK, ${deck.helper.count} promised helper use(s) delivered.`);
    } else {
      console.log(`MEASURE_HELPER_DELIVERY: ${deck.helper.failures.length} promised helper use(s) not delivered (the full check refuses this):`);
      deck.helper.failures.forEach((failure) => console.log(`  - ${failure}`));
    }
  }
  if (deck.landed) {
    if (deck.landed.unavailable) {
      console.log('MEASURE_LANDED_SENTENCE: not checked here (no Python would start). The run checks it after you hand back.');
    } else if (deck.landed.ok) {
      console.log("MEASURE_LANDED_SENTENCE: OK, every Teach beat's sentence reaches one of its slides.");
    } else {
      console.log('MEASURE_LANDED_SENTENCE: a Teach sentence has not reached the board yet (the run refuses this after you hand back):');
      deck.landed.failures.slice(0, 12).forEach((line) => console.log(`  ${line}`));
    }
  }
  if (preview) {
    console.log(`MEASURE_PREVIEW: ${preview}`);
    console.log('  The slides as drawn (a slide that does not fit is a "check this slide" page). Render it to look; it is never the checked deck.');
  }
  return 0;
}

const MOST_SET_ASIDE = 6;

module.exports = { readBuild, nearbyArrangements };

if (require.main === module) process.exit(main(process.argv.slice(2)));
