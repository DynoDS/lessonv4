#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const requireGlobal = require('./src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { SLIDE_W, SLIDE_H } = require('./src/layout');
const { FONT, COLOURS, SUBJECT_COLOURS } = require('./src/styles');
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
const { expandTeachLayouts, TeachLayoutError } = require('./src/teach-layouts');
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
// Every diagnostic this build printed, so a flagged delivery can name the
// slides that carry one without parsing its own output back.
const recordedDiagnostics = [];

// The faults that would have withheld the deck. A delivered deck names every
// slide that carries one of these; advisory notes (a figure with spare room, a
// busy slide) are not faults and flag nothing.
const FLAGGING_SIGNALS = new Set([
  'TEXT_OVERLOAD',
  'SLIDE_RENDER_FAILED',
  'SLIDE_PICTURE_MISSING',
  'SLIDE_MARKER_LITERAL',
  'PICTURE_BELOW_READABLE_FLOOR',
  'FIXED_CAPTION_CAPACITY',
  'SUCCESS_CRITERIA_CAPACITY',
]);

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
  recordedDiagnostics.push(payload);
  console.log(`BUILD_DIAGNOSTIC: ${JSON.stringify(payload)}`);
}

// What a slide that could not be laid out looks like in a delivered deck: its
// title, and a plain note to the teacher saying the slide needs checking. Left
// blank, it read as a slide meant to be empty; the note is what makes it
// impossible to teach past without noticing. The engine's reason goes to the
// run report, not onto the board: "criterion 1 does not fit its card at the
// 18pt readable minimum" is a sentence for whoever repairs the spec, and it
// read as nonsense on a Year 4 slide. The slide's script is still in its notes.
function drawCheckThisSlide(slide, slideData) {
  const title = String((slideData && slideData.title) || '').trim();
  if (title) {
    slide.addText(title, {
      x: 0.6, y: 0.4, w: 12.1, h: 1.0,
      fontFace: FONT, fontSize: 32, bold: true, color: COLOURS.body,
      align: 'left', valign: 'middle', margin: 0,
      objectName: 'NOFIT_check-this-slide-title',
    });
  }
  slide.addText(
    [
      { text: 'Check this slide before teaching.', options: { bold: true, color: 'C00000', breakLine: true } },
      {
        text: 'What it needs to show would not fit, so it has not been drawn. ' +
          'Its script is in the notes, and the run report says what did not fit.',
        options: { color: COLOURS.body },
      },
    ],
    {
      x: 0.6, y: 1.8, w: 12.1, h: 4.6,
      fontFace: FONT, fontSize: 28, align: 'left', valign: 'top', margin: 0,
      objectName: 'NOFIT_check-this-slide-note',
    }
  );
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
  // The lesson run builds with this: a deck whose faults survived the repair
  // round is written anyway, each faulty slide named on `SLIDES_FLAGGED:`,
  // because a teacher fixes one slide in a minute and a withheld deck costs the
  // lesson (Daniel, 16 September 2026: "flag the slides and deliver it").
  // Without it the build refuses as before, which is what keeps the slide
  // designer's own check sending faults back for repair. Never in a design
  // preview: that check exists to refuse.
  const deliverFlagged = rawArgs.includes("--deliver-flagged") && !designPreview;
  const args = rawArgs.filter(
    (arg) =>
      arg !== "--cards" &&
      arg !== "--no-cards" &&
      arg !== "--skip-optional-decorations" &&
      arg !== "--design-preview" &&
      arg !== "--deliver-flagged"
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
  // A teach-layout slide names an arrangement; it becomes ordinary slides here,
  // before validation, so every later check and helper sees what is drawn.
  try {
    raw = expandTeachLayouts(raw);
  } catch (err) {
    if (!(err instanceof TeachLayoutError)) throw err;
    console.error(`TEACH_LAYOUT_INVALID: ${err.message}`);
    diagnostic('TEACH_LAYOUT_INVALID', 'composition', {}, err.message);
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
  const contextForSlide = (i) => ({ sharedFigures, slideIndex: i, lessonDir, lesson: coreLesson, date: today, cardLook, imageDims, angleImages, triangleImages, linePairImages, coordinateGridImages, reflectionGridImages, geoboardImages, vennImages, carrollImages, tallyChartImages, pictogramImages, barModelImages, blankSurfaceImages, geographicalDescriptionFrameImages, labelDiagramImages, gridMapImages, translationShapeImages, rainforestLayersImages, balancedPatternPlateImages, circuitDiagramImages, parachuteForcesImages, circuitSymbolBankImages, successCriteriaHelperImages });

  // Draw everything once into a presentation nobody will open. A slide that
  // cannot be drawn is found here, before a file exists, rather than after the
  // deck has been written with that slide blank.
  const preflight = preflightLayouts({
    PptxGenJS,
    lesson: coreLesson,
    contextForSlide,
  });

  // A slide that cannot be laid out is left blank in this build, and the rest
  // of the deck is still built and checked. The build used to exit here, so a
  // text box too small for its words on another slide was only found on the
  // next run, after this fault was repaired: on a Year 4 rounding deck (16
  // September 2026) that next run came after the repair passes were spent and
  // refused eleven slides at once. Nothing is published while any slide is
  // blank, so this changes what is reported, not what ships.
  const layoutFailedSlides = new Set();
  if (preflight.errors.length) {
    for (const error of preflight.errors) {
      if (error.slide) {
        layoutFailedSlides.add(error.slide);
        FLAGGING_SIGNALS.add(error.signal);
      }
    }
    console.error(
      `\n${preflight.errors.length} layout problem(s):`
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
    console.error(
      deliverFlagged
        ? 'Those slides carry a "check this slide" note in the deck, and the rest of ' +
            'the deck is built and checked as normal.'
        : 'Those slides are left blank in this build so the rest of the deck is still ' +
            'checked. No deck will be published until they are fixed.'
    );
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
      if (!layoutFailedSlides.has(i + 1)) {
        drawSlide(pptx, slide, coreSlideData, ctx);
      } else if (deliverFlagged) {
        drawCheckThisSlide(slide, coreSlideData);
      }
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
    layoutFailedSlides.size === 0 &&
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

      const fallback = rebuildWithoutOptionalDecorations(jsonPath, outputDir, { designPreview, deliverFlagged });
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

  const clean =
    autofit.status === 'AUTOFIT_OK' &&
    failedSlides.length === 0 &&
    layoutFailedSlides.size === 0 &&
    pictures.faults.length === 0 &&
    markers.faults.length === 0 &&
    geometry.faults.length === 0;
  // A flagged deck still has to be a deck: every shape at a coordinate
  // PowerPoint can read, and every text box measured. Text measured and too
  // heavy is a fault on a slide; text never measured is a machine that needs
  // setting up, and says nothing about which slides to check.
  const flaggable =
    deliverFlagged &&
    geometry.faults.length === 0 &&
    (autofit.status === 'AUTOFIT_OK' || autofit.status === 'TEXT_OVERLOAD');
  const publishable = clean || flaggable;

  if (autofit.status !== 'AUTOFIT_OK' && publishable) {
    console.error(`${autofit.status}: ${autofit.message}`);
    for (const item of autofitDiagnostics(autofit)) {
      diagnostic(item.code, item.owner, item.location, item.message);
    }
  }

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
  } else if (clean) {
    // Only ever say this when it is true. "No warnings." used to print beside
    // seven render errors, which is the one line in this output a reader trusts.
    // It also used to print before the text had been measured at all, so a deck
    // whose autofit never ran read as clean.
    console.log('No warnings.');
  }

  if (layoutFailedSlides.size) {
    const numbers = [...layoutFailedSlides].sort((a, b) => a - b);
    console.error(
      `\n${numbers.length} of ${slides.length} ${slides.length === 1 ? 'slide' : 'slides'} ` +
        `could not be laid out: ${numbers.join(', ')}. The layout problem(s) above say ` +
        'why. Fix the slide spec, then rebuild.'
    );
    if (!publishable) process.exitCode = 1;
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
    const outcome = publishable
      ? 'the deck was delivered with it flagged'
      : 'no deck was published';
    console.error(
      one
        ? `That slide could not be drawn, so ${outcome}. The [error] line ` +
          'above says what went wrong.'
        : `Those slides could not be drawn, so ${outcome}. The [error] lines ` +
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
    // broke. A flagged delivery was asked to hand it over named, and has.
    if (!publishable) process.exitCode = 1;
  }

  // The one line a caller reads to know which slides the teacher must check.
  // Every slide carrying a fault that would have withheld the deck is on it,
  // including a picture below its readable floor, which the build itself
  // never refuses but the slide check does.
  if (deliverFlagged && publishable) {
    const faults = recordedDiagnostics
      .filter((d) => FLAGGING_SIGNALS.has(d.signal) && Number.isInteger(d.location.slide))
      .map((d) => ({ slide: d.location.slide, signal: d.signal, message: d.message }));
    const flaggedSlides = [...new Set(faults.map((f) => f.slide))].sort((a, b) => a - b);
    if (flaggedSlides.length) {
      console.log(`SLIDES_FLAGGED: ${JSON.stringify({ slides: flaggedSlides, faults })}`);
      console.error(
        `\nDelivered with ${flaggedSlides.length} slide(s) to check before teaching: ` +
          `${flaggedSlides.join(', ')}.`
      );
    }
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
