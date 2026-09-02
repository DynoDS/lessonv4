#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { capacityWarnings } = require('../src/content/capacity');
const { friendlyParseError } = require('../src/validate');

const BLOCKING_CAPACITY_SIGNALS = new Set([
  'FIXED_CAPTION_CAPACITY',
  'SUCCESS_CRITERIA_CAPACITY',
]);

function buildDiagnostic(warning) {
  return `BUILD_DIAGNOSTIC: ${JSON.stringify({
    signal: warning.signal,
    artifact: 'slides',
    faultClass: 'composition',
    location: {
      slide: warning.slide,
      path: warning.field,
    },
    message: warning.message,
  })}`;
}

function parseBuildDiagnostics(output) {
  const diagnostics = [];
  for (const line of String(output || '').split(/\r?\n/)) {
    if (!line.startsWith('BUILD_DIAGNOSTIC: ')) continue;
    try {
      diagnostics.push(JSON.parse(line.slice('BUILD_DIAGNOSTIC: '.length)));
    } catch {
      // The underlying build output remains authoritative and is returned intact.
    }
  }
  return diagnostics;
}

function stripScratchWroteLine(output) {
  const lines = String(output || '')
    .split(/\r?\n/)
    .filter((line) => !line.startsWith('Wrote: '));
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines.length ? `${lines.join('\n')}\n` : '';
}

function pathIsInside(filePath, directoryPath) {
  const relative = path.relative(
    path.resolve(directoryPath),
    path.resolve(filePath)
  );
  return (
    relative !== '' &&
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function appendLine(text, line) {
  const current = String(text || '');
  if (!current) return `${line}\n`;
  return `${current}${current.endsWith('\n') ? '' : '\n'}${line}\n`;
}

// Internal lesson-stage labels ("Teach 1", "Do 2", bare "Apply") belong to the
// lesson-design document, never to a child-facing slide title. A title that is
// only a stage label tells a child nothing about the slide, so it blocks the
// check before any deck is built. Child-facing classroom labels — My Turn,
// Your Turn, Quick check, Practise — do not match and stay valid.
const INTERNAL_STAGE_TITLE =
  /^(?:(?:Teach|Do)\s+\d+(?:\s*:.*)?|Apply)$/i;

function presentationWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides)
    ? lesson.slides
    : [];
  const warnings = [];

  slides.forEach((slideData, index) => {
    if (!slideData || typeof slideData !== 'object') return;
    const title =
      typeof slideData.title === 'string'
        ? slideData.title.trim()
        : '';
    if (!INTERNAL_STAGE_TITLE.test(title)) return;
    warnings.push({
      signal: 'INTERNAL_STAGE_TITLE',
      slide: index + 1,
      field: 'title',
      message:
        `"${title}" is an internal lesson-stage label, not a child-facing title.`
    });
  });

  return warnings;
}

// My Turn, Our Turn and Your Turn are promises to the class about whose go it
// is. A slide making one has to show what is being turned over: the question or
// task itself, or - on the reveal that follows it - its answer.
//
// A Year 4 place-value deck ran three "My Turn" slides in a row. The first
// carried a column-value chart, a strip of tenfold relationships and a sticky
// fact, and nothing to work on at all: it was the reference the next slide
// needed, given a slide and a turn label of its own when a repair split a
// crowded My Turn in two. The teacher met "My Turn", taught, clicked, and met
// "My Turn" again (flagged by Daniel, 2 Sept 2026: "It says My turn but I don't
// actually do anything apart from teach, then next slide is finally my turn").
//
// The composition playbook already forbids the interlude slide this produces -
// a reference-only slide "has no job of its own to show" - so this is that rule
// where the deck cannot get past it.
const TURN_TITLE = /^(?:my|our|your)\s+turn\b/i;
const QUESTION_TYPES = new Set(['numbered-questions', 'question-cards']);
// The green answer markers, which templates.md allows only on an answer or
// reveal slide. Their presence is what makes a "Your Turn Answers" the reveal of
// its turn rather than a turn with nothing on it.
const ANSWER_GREEN = /\|\||\{\{/;

function carriesItsTurn(slideData) {
  let found = false;
  walkContent(slideData, (node) => {
    if (found) return;
    if (Array.isArray(node.questions) && node.questions.length) found = true;
    else if (QUESTION_TYPES.has(node.type)) found = true;
    else if (node.colorRole === 'focus-blue') found = true;
    else if (typeof node.color === 'string' && HOUSE_BLUE.test(node.color.trim())) {
      found = true;
    } else if (typeof node.value === 'string' && ANSWER_GREEN.test(node.value)) {
      found = true;
    } else if (typeof node.text === 'string' && ANSWER_GREEN.test(node.text)) {
      found = true;
    }
  });
  return found;
}

function turnWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const warnings = [];
  slides.forEach((slideData, index) => {
    if (!slideData || typeof slideData !== 'object') return;
    const title = typeof slideData.title === 'string' ? slideData.title.trim() : '';
    if (!TURN_TITLE.test(title)) return;
    if (carriesItsTurn(slideData)) return;
    warnings.push({
      signal: 'TURN_SLIDE_WITHOUT_ITS_TURN',
      slide: index + 1,
      field: 'title',
      message:
        `"${title}" promises the class a turn, but this slide carries no question, ` +
        'no task in house blue and no answer - only reference material. Put the ' +
        "turn's own question or task on it, or fold this content into the slide " +
        'that does have the question (a reference usually fits beside a task as a ' +
        'side panel in a row) rather than leaving a reference-only slide wearing a ' +
        'turn label.'
    });
  });
  return warnings;
}

// House blue is the colour of the words a child acts on. A text block whose
// whole `color` is blue while it both tells and asks ("Look at the tropical
// rainforest regions. What pattern do you notice around the Equator?") has
// hidden the question inside the explanation instead of lifting it; the
// asking sentence is meant to sit on its own line in blue with the telling
// black above it. The rule lives in the visual profile's Semantic colour, and
// two Year 4 geography decks in a row painted the whole card anyway, so the
// check names the card before the builder runs.
const HOUSE_BLUE = /^#?0070c0$/i;

function splitSentences(value) {
  return String(value)
    .split(/(?<=[.?!])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function wholeBlueMixedBlock(node) {
  if (!node || typeof node !== 'object' || node.type !== 'text') return false;
  const blue =
    (typeof node.color === 'string' && HOUSE_BLUE.test(node.color.trim())) ||
    node.colorRole === 'focus-blue';
  if (!blue || typeof node.value !== 'string') return false;
  const sentences = splitSentences(node.value);
  if (sentences.length < 2) return false;
  const asks = sentences.filter((sentence) => sentence.endsWith('?'));
  return asks.length > 0 && asks.length < sentences.length;
}

function walkContent(node, visit) {
  if (Array.isArray(node)) {
    node.forEach((child) => walkContent(child, visit));
    return;
  }
  if (!node || typeof node !== 'object') return;
  visit(node);
  Object.keys(node).forEach((key) => {
    if (key === 'speakerNotes' || key === 'decorations') return;
    walkContent(node[key], visit);
  });
}

function mixedBlockWarnings(lesson) {
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  const warnings = [];
  slides.forEach((slideData, index) => {
    walkContent(slideData, (node) => {
      if (!wholeBlueMixedBlock(node)) return;
      warnings.push({
        signal: 'MIXED_BLOCK_WHOLE_BLUE',
        slide: index + 1,
        field: 'text',
        message:
          `"${node.value.slice(0, 60)}" tells and then asks in one blue block; ` +
          'keep the telling black and put the question on its own line in blue ' +
          '(a `[[ ]]` span or a separate text object).'
      });
    });
  });
  return warnings;
}

function presentationDiagnostic(warning) {
  return `BUILD_DIAGNOSTIC: ${JSON.stringify({
    signal: warning.signal,
    artifact: 'slides',
    faultClass: 'presentation',
    location: {
      slide: warning.slide,
      box: warning.field
    },
    message: warning.message
  })}`;
}

// The optional visual layer has two routes: a drawing from the shared
// Educational SVG library, and an emoji as the fallback when no drawing fits.
// Only the drawing route leaves a trace anyone looks for, so a pass that never
// opened the library and typed emojis instead reports as "zero requests" and
// reads exactly like a deck the library had nothing for. Counting both makes
// the route that was actually taken a fact rather than a claim.
const OPTIONAL_PICTURE_KINDS = ['educational-svg', 'emoji'];

function countOptionalPictures(lesson) {
  const counts = { 'educational-svg': 0, emoji: 0 };
  const seen = new Set();

  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (
      typeof node.kind === 'string' &&
      OPTIONAL_PICTURE_KINDS.includes(node.kind)
    ) {
      counts[node.kind] += 1;
    }
    Object.values(node).forEach(walk);
  };

  walk(lesson);
  return counts;
}

function optionalPictureLine(counts) {
  return (
    `SLIDE_DESIGN_OPTIONAL_PICTURES: ${counts['educational-svg']} ` +
    `educational-svg, ${counts.emoji} emoji`
  );
}

function runSlideDesignCheck(inputPath, options = {}) {
  const jsonPath = path.resolve(inputPath);
  const buildPath = path.resolve(
    options.buildPath || path.join(__dirname, '..', 'build.js')
  );

  if (!fs.existsSync(jsonPath)) {
    return {
      ok: false,
      reason: 'LESSON_JSON_NOT_FOUND',
      slideCount: 0,
      stdout: '',
      stderr: `Lesson JSON not found: ${jsonPath}\n`,
      scratchOutputPath: null,
    };
  }

  const source = fs.readFileSync(jsonPath, 'utf8');
  let lesson;
  try {
    lesson = JSON.parse(source);
  } catch (error) {
    return {
      ok: false,
      reason: 'LESSON_JSON_INVALID',
      slideCount: 0,
      stdout: '',
      stderr: `${friendlyParseError(jsonPath, source, error)}\n`,
      scratchOutputPath: null,
    };
  }

  const slideCount = Array.isArray(lesson.slides) ? lesson.slides.length : 0;
  const optionalPictures = countOptionalPictures(lesson);
  const capacity = capacityWarnings(lesson);
  if (capacity.length) {
    return {
      ok: false,
      reason: 'SLIDE_DESIGN_CAPACITY',
      slideCount,
      stdout: `${capacity.map(buildDiagnostic).join('\n')}\n`,
      stderr:
        `\n${capacity.length} slide-design composition problem(s) - scratch build not run:\n` +
        capacity
          .map(
            (warning) =>
              `  ✗ slide ${warning.slide} ${warning.field}: ` +
              `${warning.signal}: ${warning.message}`
          )
          .join('\n') +
        '\nFix only the slide composition, then run the check again.\n',
      scratchOutputPath: null,
    };
  }

  const presentation = presentationWarnings(lesson)
    .concat(turnWarnings(lesson))
    .concat(mixedBlockWarnings(lesson));
  if (presentation.length) {
    return {
      ok: false,
      reason: 'SLIDE_DESIGN_PRESENTATION',
      slideCount,
      stdout: `${presentation.map(presentationDiagnostic).join('\n')}\n`,
      stderr:
        `\n${presentation.length} slide-design presentation problem(s) - ` +
        `scratch build not run:\n` +
        presentation
          .map(
            (warning) =>
              `  x slide ${warning.slide} ${warning.field}: ` +
              `${warning.signal}: ${warning.message}`
          )
          .join('\n') +
        '\nRepair only what each line names, then run the check again.\n',
      scratchOutputPath: null
    };
  }

  let scratchDir;
  try {
    scratchDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'lesson-resources-slide-design-check-')
    );
  } catch (error) {
    return {
      ok: false,
      reason: 'SCRATCH_DIRECTORY_FAILED',
      slideCount,
      stdout: '',
      stderr: `Could not create the slide-design scratch directory: ${error.message}\n`,
      scratchOutputPath: null,
    };
  }

  let outcome;
  let scratchOutputPath = null;

  try {
    // The scratch build draws whatever the candidate actually carries,
    // decorations included. It used to skip them unconditionally, which meant
    // the optional layer was never rendered anywhere the designer could see it:
    // the preview it inspects had none, and the only pass that ever saw one in
    // position was a later spawn that ran only when a photograph had landed. A
    // deck could therefore ship a drawing sitting on a word without any check or
    // any eye having looked at it once. Nothing needs deciding here - before the
    // optional pass the candidate has no decorations and this is byte-identical
    // to skipping them; after it, the designer sees its own layer.
    const child = spawnSync(
      process.execPath,
      [
        buildPath,
        jsonPath,
        scratchDir,
      ],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          ...(options.env || {}),
          ...(options.photoRequirementsPath
            ? {
                PHOTO_REQUIREMENTS_PATH: path.resolve(
                  options.photoRequirementsPath
                ),
              }
            : {}),
        },
      }
    );

    const childStdout = String(child.stdout || '');
    const childStderr = String(child.stderr || '');

    if (child.error) {
      outcome = {
        ok: false,
        reason: 'SCRATCH_BUILD_LAUNCH_FAILED',
        slideCount,
        stdout: childStdout,
        stderr: appendLine(childStderr, child.error.message),
        scratchOutputPath,
      };
    } else if (child.status !== 0) {
      outcome = {
        ok: false,
        reason: 'SCRATCH_BUILD_FAILED',
        slideCount,
        stdout: childStdout,
        stderr: childStderr,
        scratchOutputPath,
      };
    } else {
      const blockingDiagnostics = parseBuildDiagnostics(childStdout).filter(
        (item) => BLOCKING_CAPACITY_SIGNALS.has(item && item.signal)
      );

      if (blockingDiagnostics.length) {
        outcome = {
          ok: false,
          reason: 'SLIDE_DESIGN_CAPACITY',
          slideCount,
          stdout: stripScratchWroteLine(childStdout),
          stderr: appendLine(
            childStderr,
            `${blockingDiagnostics.length} blocking slide-design capacity ` +
              'diagnostic(s) remained after the scratch build.'
          ),
          scratchOutputPath,
        };
      } else {
        const wroteLines = childStdout
          .split(/\r?\n/)
          .filter((line) => line.startsWith('Wrote: '));

        if (wroteLines.length !== 1) {
          outcome = {
            ok: false,
            reason: 'SCRATCH_BUILD_MARKER_MISSING',
            slideCount,
            stdout: childStdout,
            stderr: appendLine(
              childStderr,
              'The scratch build exited 0 without exactly one Wrote: line.'
            ),
            scratchOutputPath,
          };
        } else {
          scratchOutputPath = path.resolve(
            wroteLines[0].slice('Wrote: '.length).trim()
          );

          if (!pathIsInside(scratchOutputPath, scratchDir)) {
            outcome = {
              ok: false,
              reason: 'SCRATCH_BUILD_OUTPUT_ESCAPE',
              slideCount,
              stdout: stripScratchWroteLine(childStdout),
              stderr: appendLine(
                childStderr,
                `The scratch build wrote outside its private directory: ${scratchOutputPath}`
              ),
              scratchOutputPath,
            };
          } else if (!fs.existsSync(scratchOutputPath)) {
            outcome = {
              ok: false,
              reason: 'SCRATCH_BUILD_OUTPUT_MISSING',
              slideCount,
              stdout: stripScratchWroteLine(childStdout),
              stderr: appendLine(
                childStderr,
                `The scratch build reported a file that does not exist: ${scratchOutputPath}`
              ),
              scratchOutputPath,
            };
          } else {
            outcome = {
              ok: true,
              reason: null,
              slideCount,
              stdout: stripScratchWroteLine(childStdout),
              stderr: childStderr,
              scratchOutputPath,
            };

            if (options.retainPreview) {
              // --preview: the deck above is a scratch artifact the finally
              // block is about to delete. Copy it into a private preview
              // directory that outlives the check, so the designer can render
              // and read it before promoting the candidate. The scratch dir
              // itself never leaks, and the copy is disposable evidence - the
              // orchestrator still owns the final build.
              try {
                const previewDir = fs.mkdtempSync(
                  path.join(os.tmpdir(), 'lesson-resources-slide-preview-')
                );
                const previewOutputPath = path.join(
                  previewDir,
                  path.basename(scratchOutputPath)
                );
                fs.copyFileSync(scratchOutputPath, previewOutputPath);
                outcome.previewDir = previewDir;
                outcome.previewOutputPath = previewOutputPath;
              } catch (error) {
                outcome = {
                  ok: false,
                  reason: 'SCRATCH_PREVIEW_COPY_FAILED',
                  slideCount,
                  stdout: stripScratchWroteLine(childStdout),
                  stderr: appendLine(
                    childStderr,
                    `Could not copy the checked deck to a private preview directory: ${error.message}`
                  ),
                  scratchOutputPath,
                };
              }
            }
          }
        }
      }
    }
  } catch (error) {
    outcome = {
      ok: false,
      reason: 'SCRATCH_BUILD_LAUNCH_FAILED',
      slideCount,
      stdout: '',
      stderr: `${error.stack || error.message || error}\n`,
      scratchOutputPath,
    };
  } finally {
    try {
      fs.rmSync(scratchDir, { recursive: true, force: true });
    } catch (error) {
      outcome = {
        ok: false,
        reason: 'SCRATCH_CLEANUP_FAILED',
        slideCount,
        stdout: outcome ? outcome.stdout : '',
        stderr: appendLine(
          outcome ? outcome.stderr : '',
          `Could not remove the slide-design scratch directory ${scratchDir}: ${error.message}`
        ),
        scratchOutputPath,
      };
    }
  }

  if (outcome) outcome.optionalPictures = optionalPictures;

  return outcome;
}

function writeText(stream, text) {
  if (!text) return;
  stream.write(text.endsWith('\n') ? text : `${text}\n`);
}

function main(argv = process.argv.slice(2)) {
  const preview = argv.includes('--preview');
  const args = [];
  let photoRequirementsPath = null;
  let photoRequirementsFlagSeen = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--preview') continue;
    if (arg === '--photo-requirements') {
      photoRequirementsFlagSeen = true;
      const next = argv[index + 1];
      photoRequirementsPath =
        next && !next.startsWith('--') ? next : null;
      if (photoRequirementsPath) index += 1;
      continue;
    }
    args.push(arg);
  }

  if (
    args.length !== 1 ||
    (photoRequirementsFlagSeen && !photoRequirementsPath)
  ) {
    console.error(
      'Usage: node check-slide-design.js <lesson.json> ' +
        '[--photo-requirements <photo-requirements.json>] [--preview]'
    );
    return 1;
  }

  const result = runSlideDesignCheck(args[0], {
    retainPreview: preview,
    photoRequirementsPath,
  });
  writeText(process.stdout, result.stdout);
  writeText(process.stderr, result.stderr);

  if (result.ok) {
    if (result.previewDir) {
      console.log(`SLIDE_DESIGN_PREVIEW_DIR: ${result.previewDir}`);
      console.log(`SLIDE_DESIGN_PREVIEW: ${result.previewOutputPath}`);
    }
    if (result.optionalPictures) {
      console.log(optionalPictureLine(result.optionalPictures));
    }
    console.log(`SLIDE_DESIGN_CHECK_OK: ${result.slideCount} slides`);
    return 0;
  }

  console.error(`SLIDE_DESIGN_CHECK_FAILED: ${result.reason}`);
  return 1;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  BLOCKING_CAPACITY_SIGNALS,
  countOptionalPictures,
  optionalPictureLine,
  buildDiagnostic,
  main,
  parseBuildDiagnostics,
  pathIsInside,
  runSlideDesignCheck,
  stripScratchWroteLine,
};
