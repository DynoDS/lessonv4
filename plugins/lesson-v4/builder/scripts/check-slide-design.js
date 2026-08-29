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

  const presentation = presentationWarnings(lesson);
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
        '\nReplace only the slide title, then run the check again.\n',
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
    const child = spawnSync(
      process.execPath,
      [
        buildPath,
        '--skip-optional-decorations',
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
