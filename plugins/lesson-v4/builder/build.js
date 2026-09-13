#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

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
const { zoneFillWarnings, clearZoneFill } = require('./src/content/_zone-fill');
const { pictureFloorFindings, clearPictureFloor, missingPictureFindings, clearMissingPictures } = require('./src/content/image');
const { runAutofit, autofitDiagnostics } = require('./src/autofit');
const { fixParagraphProps } = require('./src/fix-paragraph-props');
const { verifyPictures } = require('./src/verify-pictures');
const { verifyMarkers } = require('./src/verify-markers');
const { verifyGeometry } = require('./src/verify-geometry');
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
const { preMeasureAll } = require('./src/images/measure');
const { createSharedFigureStore } = require('./src/content/shared-figure');
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
const { preRenderGeographicalDescriptionFrames } = require('./src/content/geographical-description-frame');
const { preRenderLabelDiagrams } = require('./src/content/label-diagram');
const { preRenderGridMaps } = require('./src/content/grid-map');
const { preRenderTranslationShapes } = require('./src/content/translation-shape');
const { preRenderRainforestLayers } = require('./src/content/rainforest-layers');
const { preRenderBalancedPatternPlates } = require('./src/content/balanced-pattern-plate');
const { preRenderCircuitDiagrams } = require('./src/content/circuit-diagram');
const { preRenderParachuteForces } = require('./src/content/parachute-forces');
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
  const designPreview = rawArgs.includes("--design-preview");
  const skipOptionalDecorations = rawArgs.includes(
    "--skip-optional-decorations"
  );
  const args = rawArgs.filter(
    (arg) =>
      arg !== "--cards" &&
      arg !== "--no-cards" &&
      arg !== "--skip-optional-decorations" &&
      arg !== "--design-preview"
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

  // Pending required pictures are permitted only in the checker's private
  // scratch directory, never by reusing this switch on a delivery folder.
  if (designPreview && (
    path.dirname(outputDir) !== path.resolve(os.tmpdir()) ||
    !path.basename(outputDir).startsWith('lesson-resources-slide-design-check-') ||
    fs.lstatSync(outputDir).isSymbolicLink()
  )) {
    console.error('DESIGN_PREVIEW_OUTPUT_INVALID: previews require a private slide-design-check scratch directory.');
    process.exit(1);
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
  const geographicalDescriptionFrameImages = await preRenderGeographicalDescriptionFrames(coreLesson);
  const labelDiagramImages = await preRenderLabelDiagrams(coreLesson, lessonDir);
  const gridMapImages = await preRenderGridMaps(coreLesson);
  const translationShapeImages = await preRenderTranslationShapes(coreLesson);
  const rainforestLayersImages = await preRenderRainforestLayers(coreLesson);
  const balancedPatternPlateImages = await preRenderBalancedPatternPlates(coreLesson);
  const circuitDiagramImages = await preRenderCircuitDiagrams(coreLesson);
  const parachuteForcesImages = await preRenderParachuteForces(coreLesson);
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
  // Shared drawings (shared/visuals/) are laid out at their zone's real size,
  // so the preflight asks for each one and they are made before the real pass.
  const sharedFigures = createSharedFigureStore();
  const contextForSlide = (i) => ({ sharedFigures, slideIndex: i, lessonDir, lesson: coreLesson, date: today, cardLook, imageDims, clockImages, turnImages, angleImages, triangleImages, linePairImages, coordinateGridImages, reflectionGridImages, geoboardImages, vennImages, carrollImages, tallyChartImages, pictogramImages, barModelImages, blankSurfaceImages, geographicalDescriptionFrameImages, labelDiagramImages, gridMapImages, translationShapeImages, rainforestLayersImages, balancedPatternPlateImages, circuitDiagramImages, parachuteForcesImages, circuitSymbolBankImages, successCriteriaHelperImages });

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

  await sharedFigures.rasterise();

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

  // The preflight already drew every slide once, so anything a figure recorded
  // about its slot is a duplicate of what the real draw is about to record.
  clearZoneFill();
  clearPictureFloor();
  clearMissingPictures();

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

    // A spec carrying `notes` instead of `speakerNotes` used to build clean and
    // ship with every script missing: the builder reads one key and nothing
    // checked for the other, so a Year 4 maths deck went out with 1,059 words
    // of teaching written and none of it in the file (6 and 12 September 2026,
    // the same fault twice). Refuse it by name rather than dropping it in
    // silence; the words exist and the key is one rename away.
    if (coreSlideData.notes !== undefined && coreSlideData.speakerNotes === undefined) {
      const stray = String(coreSlideData.notes || '').trim();
      if (stray) {
        throw new Error(
          `slide ${i + 1} carries its script under \`notes\`, and the builder reads ` +
          '`speakerNotes`. Rename the key on every slide that has it; the text itself is fine.'
        );
      }
    }

    if (coreSlideData.speakerNotes) {
      slide.addNotes(String(coreSlideData.speakerNotes));
    }
  });

  // Whether each contained figure actually used the room it was given. Reported
  // after the draw because it is measured on the drawn rectangle, and advisory
  // for the same reason the capacity checks are: a better-shaped slot is a
  // composition decision, and the alternative - stretching the picture - is
  // never the answer.
  for (const warning of zoneFillWarnings()) {
    note(`slide ${warning.slide} ${warning.field}: ${warning.message}`);
    diagnostic(
      warning.signal,
      'composition',
      { slide: warning.slide, path: warning.field },
      warning.message
    );
  }

  // A picture children work from that was allocated less than its readable
  // floor. The [warn] line was already printed where it happened; this is the
  // same fact as a diagnostic, so the slide-design check can refuse to promote
  // a candidate that carries one instead of reading past a warning.
  for (const finding of pictureFloorFindings()) {
    diagnostic(
      finding.signal,
      'composition',
      { slide: finding.slide, path: finding.field },
      finding.message
    );
  }

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

      const fallback = rebuildWithoutOptionalDecorations(jsonPath, outputDir, { designPreview });
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

  // Last deterministic check before the deck is allowed to become the real file.
  //
  // It runs here, after the decoration pass has finished editing the package, so
  // what is checked is the deck that would actually be renamed into place. A
  // picture that did not arrive is a blocking fault rather than a warning: the
  // slide that needed it cannot be taught from, and the fault is invisible until
  // someone opens the deck.
  const pictures = await runPictureCheck(tempOutputPath);
  if (!designPreview) pictures.faults.push(...missingPictureFindings());
  for (const fault of pictures.faults) {
    console.error(`  ✗ ${fault.message}`);
    diagnostic(
      'SLIDE_PICTURE_MISSING',
      'technical',
      { slide: fault.slide, path: fault.part },
      fault.message
    );
  }

  // An inline marker that no helper read is projected at the class as its own
  // characters. It blocks for the same reason a missing picture does: it is
  // invisible in the build output, it is nonsense on the board, and the teacher
  // cannot fix it without editing the deck. The fault is the designer's and it
  // is one string long, so stopping here costs a repair pass and shipping costs
  // a lesson.
  const markers = await runMarkerCheck(tempOutputPath);
  for (const fault of markers.faults) {
    console.error(`  ✗ ${fault.message}`);
    diagnostic(
      'SLIDE_MARKER_LITERAL',
      'composition',
      { slide: fault.slide, path: fault.part },
      fault.message
    );
  }

  // A coordinate no presentation program can read blocks for the same reason:
  // the deck would open with "PowerPoint found a problem with content", which
  // is a broken resource wearing a success marker.
  const geometry = await runGeometryCheck(tempOutputPath);
  for (const fault of geometry.faults) {
    console.error(`  ✗ ${fault.message}`);
    diagnostic(
      'SLIDE_GEOMETRY_INVALID',
      'technical',
      { slide: fault.slide, path: fault.part },
      fault.message
    );
  }

  const publishable =
    autofit.status === 'AUTOFIT_OK' &&
    failedSlides.length === 0 &&
    pictures.faults.length === 0 &&
    markers.faults.length === 0 &&
    geometry.faults.length === 0;

  if (!publishable) {
    if (pictures.faults.length) {
      const one = pictures.faults.length === 1;
      console.error(
        `
${pictures.faults.length} picture(s) did not make it into the deck, so ` +
          `${one ? 'a slide' : 'those slides'} would open with a white box where the ` +
          `picture should be. No deck was published.`
      );
    }
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

// A picture check that cannot itself become the reason a lesson is lost.
//
// Every fault it reports is real and blocking. A check that could not RUN is a
// different thing: reading the package needs jszip, and a machine without it
// would otherwise have every deck refused for a fault nobody has shown exists.
// So a check that breaks says so loudly as a warning and lets the deck through.
async function runPictureCheck(pptxPath) {
  try {
    return await verifyPictures(pptxPath);
  } catch (err) {
    note(
      'the pictures in this deck could not be checked (' +
        (err && err.message ? err.message : err) +
        '), so open it and confirm every picture is showing before you teach from it.'
    );
    return { faults: [], pictures: 0, media: 0 };
  }
}

// The same shape again: an invalid coordinate is worth blocking, and a check
// that could not run is not.
async function runGeometryCheck(pptxPath) {
  try {
    return await verifyGeometry(pptxPath);
  } catch (err) {
    note(
      'the shape coordinates in this deck could not be checked (' +
        (err && err.message ? err.message : err) +
        '), so open it and confirm PowerPoint does not offer to repair it ' +
        'before you teach from it.'
    );
    return { faults: [], slides: 0, coordinates: 0 };
  }
}

// The same shape, and for the same reason: a marker left as text is worth
// blocking, and a check that could not run is not.
async function runMarkerCheck(pptxPath) {
  try {
    return await verifyMarkers(pptxPath);
  } catch (err) {
    note(
      'the inline answer markers in this deck could not be checked (' +
        (err && err.message ? err.message : err) +
        '), so open it and confirm no || or ** is showing as text before you ' +
        'teach from it.'
    );
    return { faults: [], slides: 0, runs: 0 };
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
