#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const requireGlobal = require('./src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { SLIDE_W, SLIDE_H } = require('./src/layout');
const { COLOURS, SUBJECT_COLOURS } = require('./src/styles');
const { drawSlide } = require('./src/templates');
const { getWarnings, clearWarnings, note } = require('./src/warnings');
const { validateLesson, friendlyParseError } = require('./src/validate');
const { slideCheckpointState, checkpointMessage } = require('./src/slide-checkpoint');
const { preflightLayouts } = require('./src/layout-preflight');
const { capacityWarnings } = require('./src/content/capacity');
const { runAutofit, autofitDiagnostics } = require('./src/autofit');
const { fixParagraphProps } = require('./src/fix-paragraph-props');
const { sanitizeHouseStyle } = require('../shared/text/house-style');
const { withoutDecorations } = require("../shared/decorations");
const {
  emptyDecorationPlan,
  hasDecorationPlans,
  prepareSlideDecorationPlans,
  rebuildWithoutOptionalDecorations,
} = require("./src/decorations");
const { markDecorativeImages } = require("./src/mark-decorative-images");
const { safeFilenameComponent } = require('../shared/text/filename');
const { formatUKDate } = require('./src/date');
const { preResizeAll } = require('./src/images/resize');
const { preTrimMoney } = require('./src/images/trim-money');
const { preMeasureAll } = require('./src/images/measure');
const { preRenderClocks } = require('./src/content/clock');
const { preRenderTurns } = require('./src/content/turn-diagram');
const { preRenderAngles } = require('./src/content/angle');
const { preRenderTriangles } = require('./src/content/triangle');
const { preRenderLinePairs } = require('./src/content/line-pair');
const { preRenderCoordinateGrids } = require('./src/content/coordinate-grid');
const { preRenderReflectionGrids } = require('./src/content/reflection-grid');
const { preRenderGeoboards } = require('./src/content/geoboard');
const { preRenderVenns } = require('./src/content/venn');
const { preRenderCarrolls } = require('./src/content/carroll');
const { preRenderTallyCharts } = require('./src/content/tally-chart');
const { preRenderPictograms } = require('./src/content/pictogram');
const { preRenderBarModels } = require('./src/content/bar-model');
const { preRenderBlankSurfaces } = require('./src/content/blank-surface');
const { preRenderLabelDiagrams } = require('./src/content/label-diagram');
const { preRenderGridMaps } = require('./src/content/grid-map');
const { preRenderTranslationShapes } = require('./src/content/translation-shape');
const { preRenderRainforestLayers } = require('./src/content/rainforest-layers');
const { preRenderMaps } = require('./src/content/map');
const { preRenderCircuitDiagrams } = require('./src/content/circuit-diagram');
const { preRenderCircuitSymbolBanks } = require('./src/content/circuit-symbol-bank');
const { preRenderSuccessCriteriaHelpers } = require('./src/success-criteria-helpers');

function usage() {
  console.error('Usage: node build.js <lesson.json> [output-dir]');
  process.exit(1);
}

// The same fault, twice: once for a person and once for a machine.
//
// Every human-readable line this builder already prints stays exactly as it is.
// This adds one line beside it carrying the same diagnosis with the location and
// the fault class broken out, so orchestration can route a fault to its owner
// without parsing English.
//
// It adds facts and decides nothing. Who owns a fault, and what should change
// because of it, stays where it already lives.
function diagnostic(signal, faultClass, location, message) {
  const payload = {
    signal,
    artifact: 'slides',
    faultClass,
    location: Object.fromEntries(
      Object.entries(location || {}).filter(([, v]) => v !== undefined && v !== null)
    ),
    message: String(message).replace(/\s+/g, ' ').trim(),
  };
  console.log(`BUILD_DIAGNOSTIC: ${JSON.stringify(payload)}`);
}

async function main() {
  // The card look (white rounded card behind each top-level content block;
  // see src/content/index.js) is the default, approved 2 Aug 2026 after four
  // preview rounds on a real lesson. --no-cards is the escape hatch for
  // comparing against the flat look while debugging; --cards is accepted and
  // ignored so older invocations keep working.
  const rawArgs = process.argv.slice(2);
  const cardLook = !rawArgs.includes("--no-cards");
  const skipOptionalDecorations = rawArgs.includes(
    "--skip-optional-decorations"
  );
  const args = rawArgs.filter(
    (arg) =>
      arg !== "--cards" &&
      arg !== "--no-cards" &&
      arg !== "--skip-optional-decorations"
  );
  if (args.length < 1) usage();
  const jsonPath = path.resolve(args[0]);
  const outputDir = path.resolve(args[1] || path.dirname(jsonPath));

  if (!fs.existsSync(jsonPath)) {
    console.error(`Lesson JSON not found: ${jsonPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  clearWarnings();

  const source = fs.readFileSync(jsonPath, 'utf8');
  let raw;
  try {
    raw = JSON.parse(source);
  } catch (err) {
    console.error(friendlyParseError(jsonPath, source, err));
    process.exit(1);
  }
  const lesson = sanitizeHouseStyle(raw);
  const coreLesson = withoutDecorations(lesson);
  const lessonDir = path.dirname(jsonPath);

  // An intentionally unfinished checkpoint file is not a lesson, so this comes
  // before ordinary validation: a checkpoint's placeholders would otherwise be
  // reported as a dozen content faults, when there is exactly one thing wrong
  // and it is that the designer has not finished yet.
  const checkpointState = slideCheckpointState(lesson);
  if (checkpointState) {
    const message = checkpointMessage(checkpointState);
    console.error(message);
    diagnostic(
      'SLIDE_CHECKPOINT_INCOMPLETE',
      'content',
      {
        slide: checkpointState.blockedSlides.length
          ? checkpointState.blockedSlides[0].slide
          : undefined,
      },
      message.replace(/^SLIDE_CHECKPOINT_INCOMPLETE:\s*/, '')
    );
    process.exit(1);
  }

  // Pre-build check: fail loudly on spec problems the renderer would absorb
  // silently (unknown templates, invented photo paths, dropped vocab visuals).
  const check = validateLesson(lesson, lessonDir);
  check.warnings.forEach((w) => console.log('[check] ' + w));
  if (check.errors.length) {
    console.error(`\n${check.errors.length} problem(s) in the slide spec — nothing was built:`);
    check.errors.forEach((e) => console.error('  ✗ ' + e));
    console.error('Fix lesson.json, then rebuild.');
    process.exit(1);
  }
  const lessonName = lesson.lessonName || 'Untitled Lesson';

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'LAYOUT_WIDE', width: SLIDE_W, height: SLIDE_H });
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = lessonName;
  pptx.subject = lesson.lo || '';

  const today = formatUKDate();
  await preResizeAll(coreLesson, lessonDir);
  await preTrimMoney(coreLesson);
  const imageDims   = await preMeasureAll(coreLesson, lessonDir);
  const clockImages = await preRenderClocks(coreLesson);
  const turnImages  = await preRenderTurns(coreLesson);
  const angleImages = await preRenderAngles(coreLesson);
  const triangleImages = await preRenderTriangles(coreLesson);
  const linePairImages = await preRenderLinePairs(coreLesson);
  const coordinateGridImages = await preRenderCoordinateGrids(coreLesson);
  const reflectionGridImages = await preRenderReflectionGrids(coreLesson);
  const geoboardImages = await preRenderGeoboards(coreLesson);
  const vennImages = await preRenderVenns(coreLesson);
  const carrollImages = await preRenderCarrolls(coreLesson);
  const tallyChartImages = await preRenderTallyCharts(coreLesson);
  const pictogramImages = await preRenderPictograms(coreLesson);
  const barModelImages = await preRenderBarModels(coreLesson);
  const blankSurfaceImages = await preRenderBlankSurfaces(coreLesson);
  const labelDiagramImages = await preRenderLabelDiagrams(coreLesson, lessonDir);
  const gridMapImages = await preRenderGridMaps(coreLesson);
  const translationShapeImages = await preRenderTranslationShapes(coreLesson);
  const rainforestLayersImages = await preRenderRainforestLayers(coreLesson);
  const mapImages = await preRenderMaps(coreLesson);
  const circuitDiagramImages = await preRenderCircuitDiagrams(coreLesson);
  const circuitSymbolBankImages = await preRenderCircuitSymbolBanks(coreLesson);
  const successCriteriaHelperImages = await preRenderSuccessCriteriaHelpers(coreLesson);
  const slides = Array.isArray(lesson.slides) ? lesson.slides : [];
  const coreSlides = Array.isArray(coreLesson.slides) ? coreLesson.slides : [];
  // A slide whose content threw is a slide that ships EMPTY: the slide exists,
  // its background is drawn, and the zone where the teaching should be is blank.
  // That has to be counted, because printing the error and carrying on used to
  // end with "No warnings." and exit 0, so a deck with seven blank slides read
  // as a clean build to every caller and to whoever ran it.
  const failedSlides = [];

  // One ctx builder, used by the preflight and by the real render, so the dry
  // run cannot pass because it was handed something the real one is not.
  const contextForSlide = (i) => ({ slideIndex: i, lessonDir, lesson: coreLesson, date: today, cardLook, imageDims, clockImages, turnImages, angleImages, triangleImages, linePairImages, coordinateGridImages, reflectionGridImages, geoboardImages, vennImages, carrollImages, tallyChartImages, pictogramImages, barModelImages, blankSurfaceImages, labelDiagramImages, gridMapImages, translationShapeImages, rainforestLayersImages, mapImages, circuitDiagramImages, circuitSymbolBankImages, successCriteriaHelperImages });

  // Draw everything once into a presentation nobody will open. A slide that
  // cannot be drawn is found here, before a file exists, rather than after the
  // deck has been written with that slide blank.
  const preflight = preflightLayouts({
    PptxGenJS,
    lesson: coreLesson,
    contextForSlide,
  });

  if (preflight.errors.length) {
    console.error(
      `\n${preflight.errors.length} layout problem(s) — nothing was built:`
    );
    for (const error of preflight.errors) {
      console.error(`  ✗ slide ${error.slide}: ${error.signal}: ${error.message}`);
      diagnostic(
        error.signal,
        error.signal === 'CONTENT_ZONE_INCOMPATIBLE'
          ? 'compatibility'
          : error.signal === 'LAYOUT_PREFLIGHT_FAILED'
            ? 'technical'
            : 'composition',
        { slide: error.slide },
        error.message
      );
    }
    console.error('Fix the slide spec, then rebuild.');
    // Nothing has been written, so whatever deck was already there is exactly as
    // it was. Said out loud, because "nothing was built" and "your existing file
    // is intact" are two different reassurances.
    const existing = path.join(
      outputDir,
      `${safeFilenameComponent(lessonName, 'Untitled Lesson')}.pptx`
    );
    console.error(
      fs.existsSync(existing)
        ? `The existing ${path.basename(existing)} was left exactly as it was. Nothing was overwritten.`
        : 'No PowerPoint was written.'
    );
    process.exit(1);
  }

  const decorationPlans = skipOptionalDecorations
    ? slides.map(() => emptyDecorationPlan())
    : await prepareSlideDecorationPlans(slides, lessonDir);

  // How much a slide is being asked to hold. Warnings only: what to cut is a
  // teaching decision, so nothing here shortens or removes anything.
  for (const warning of capacityWarnings(coreLesson)) {
    note(
      `slide ${warning.slide} ${warning.field}: ${warning.message}`
    );
    diagnostic(
      warning.signal,
      'composition',
      { slide: warning.slide, path: warning.field },
      warning.message
    );
  }

  slides.forEach((slideData, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: SUBJECT_COLOURS[lesson.subject] || COLOURS.bg };

    const coreSlideData = coreSlides[i] || withoutDecorations(slideData);
    const ctx = {
      ...contextForSlide(i),
      decorationPlan: decorationPlans[i],
    };
    try {
      drawSlide(pptx, slide, coreSlideData, ctx);
    } catch (err) {
      failedSlides.push(i + 1);
      console.error(`[error] slide ${i + 1}: ${err.message}`);
      console.error(err.stack);
    }

    if (coreSlideData.speakerNotes) {
      slide.addNotes(String(coreSlideData.speakerNotes));
    }
  });

  const sanitizedName = safeFilenameComponent(lessonName, 'Untitled Lesson');
  const outputPath = path.join(outputDir, `${sanitizedName}.pptx`);

  // Build to a temporary name and only rename it into place once every
  // deterministic check has passed.
  //
  // Writing the final filename first meant a failed regeneration destroyed a
  // good deck: the teacher's working PowerPoint was replaced by a broken one
  // before anything had checked whether the new one was usable. Now a failure
  // leaves whatever was already there untouched.
  const tempOutputPath = path.join(
    outputDir,
    `.${sanitizedName}.building-${process.pid}.pptx`
  );

  await pptx.writeFile({ fileName: tempOutputPath });

  // Every deterministic step runs against the temporary file.
  await runParagraphPropFix(tempOutputPath);
  const autofit = runAutofit(tempOutputPath);

  if (
    autofit.status === "AUTOFIT_OK" &&
    failedSlides.length === 0 &&
    !skipOptionalDecorations &&
    hasDecorationPlans(decorationPlans)
  ) {
    try {
      const accessibility = await markDecorativeImages(tempOutputPath);
      if (accessibility.removed > 0) {
        note(
          `${accessibility.removed} optional decoration picture(s) were removed ` +
            `because they could not be marked Decorative safely.`
        );
      }
    } catch (error) {
      try {
        fs.unlinkSync(tempOutputPath);
      } catch (_) {
        // The fallback build writes its own temporary file.
      }

      console.warn(
        `[warn] Optional decoration accessibility could not be verified ` +
          `(${error && error.message ? error.message : error}). Rebuilding once ` +
          `without Priority 3 decoration.`
      );

      const fallback = rebuildWithoutOptionalDecorations(jsonPath, outputDir);
      if (fallback.status !== 0) {
        console.error(
          "The decoration-free fallback build also failed. Its output above is " +
            "the authoritative failure report."
        );
        process.exitCode = 1;
      }
      return;
    }
  }

  const publishable = autofit.status === 'AUTOFIT_OK' && failedSlides.length === 0;

  if (!publishable) {
    if (autofit.status !== 'AUTOFIT_OK') {
      console.error(`${autofit.status}: ${autofit.message}`);
      for (const item of autofitDiagnostics(autofit)) {
        diagnostic(item.code, item.owner, item.location, item.message);
      }
    }

    try {
      fs.unlinkSync(tempOutputPath);
    } catch {
      // A temporary file that will not delete is not worth failing over; it is
      // named so it is obviously not the deck.
    }

    if (fs.existsSync(outputPath)) {
      console.error(
        `The existing ${path.basename(outputPath)} was left exactly as it was. ` +
          `Nothing was overwritten.`
      );
    } else {
      console.error('No PowerPoint was written.');
    }
    process.exitCode = 1;
  } else {
    fs.renameSync(tempOutputPath, outputPath);
    console.log(`Wrote: ${outputPath}`);
  }

  const warnings = getWarnings();
  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    warnings.forEach(w => console.log('  ' + w));
  } else if (publishable) {
    // Only ever say this when it is true. "No warnings." used to print beside
    // seven render errors, which is the one line in this output a reader trusts.
    // It also used to print before the text had been measured at all, so a deck
    // whose autofit never ran read as clean.
    console.log('No warnings.');
  }

  // Last, so it is the line still on screen, and loudest, because everything
  // above it (the file was written, the autofit ran) reads like success.
  if (failedSlides.length) {
    // Two different counts, so two different plurals: the count line follows the
    // TOTAL ("1 of 3 slides"), the sentence after it follows how many FAILED
    // ("That slide is" / "Those slides are").
    const one = failedSlides.length === 1;
    console.error(
      `\n${failedSlides.length} of ${slides.length} ` +
      `${slides.length === 1 ? 'slide' : 'slides'} failed to render: ` +
      `${failedSlides.join(', ')}.`
    );
    console.error(
      one
        ? 'That slide could not be drawn, so no deck was published. The [error] line ' +
          'above says what went wrong.'
        : 'Those slides could not be drawn, so no deck was published. The [error] lines ' +
          'above say what went wrong on each one.'
    );
    for (const slideNumber of failedSlides) {
      diagnostic(
        'SLIDE_RENDER_FAILED',
        'technical',
        { slide: slideNumber },
        'the slide threw while drawing, so its content would have been missing.'
      );
    }
    // exitCode rather than exit(), so every line above still flushes. An
    // incomplete deck is never renamed over a good one: the temporary file was
    // deleted above, and the [error] lines are how you find out which slide
    // broke.
    process.exitCode = 1;
  }
}

// pptxgenjs writes a paragraph-properties block per run rather than per paragraph,
// which leaves every colour-marked line one block short of valid and eventually has
// PowerPoint offering to repair the deck. The reasoning is in the module; this runs
// on every build because a deck that asks to be repaired is not a deck to ship.
async function runParagraphPropFix(pptxPath) {
  try {
    const result = await fixParagraphProps(pptxPath);
    if (result.remaining > 0) {
      note(`${result.remaining} paragraph(s) still carry duplicate formatting blocks, so PowerPoint may ask to repair this deck. Open it and check it before teaching from it.`);
    }
  } catch (err) {
    note('could not clean duplicate paragraph formatting, so PowerPoint may ask to repair this deck when you open it. It is safe to accept the repair; the slides themselves are fine. ' + (err.message || err));
  }
}

main().catch(err => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});
