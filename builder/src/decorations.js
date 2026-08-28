"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { SLIDE_W, SLIDE_H } = require("./layout");
const { warn } = require("./warnings");
const {
  inspectDecorations,
  fitContainedDecoration,
  rotatedRectIntersectsRect,
} = require("../../shared/decorations");
const {
  confinedEducationalSvgPngPath,
  readPngInfo,
} = require("../../shared/educational-svg-asset");

function visitObjects(value, visitor) {
  if (Array.isArray(value)) {
    value.forEach((entry) => visitObjects(entry, visitor));
    return;
  }
  if (!value || typeof value !== "object") return;
  visitor(value);
  Object.values(value).forEach((entry) => visitObjects(entry, visitor));
}

function isVocabularySurface(slide) {
  if (!slide || typeof slide !== "object") return false;
  if (slide.template === "key-vocabulary") return true;

  let found = false;
  visitObjects(slide, (object) => {
    if (object.type === "vocab" && Array.isArray(object.words)) found = true;
  });
  return found;
}

function forEachVocabularyEntry(slide, callback) {
  if (!slide || typeof slide !== "object") return;
  const seen = new Set();

  function emit(words, location) {
    if (!Array.isArray(words)) return;
    words.forEach((entry, index) => {
      if (!entry || typeof entry !== "object" || seen.has(entry)) return;
      seen.add(entry);
      callback(entry, `${location}.words[${index}]`);
    });
  }

  if (slide.template === "key-vocabulary") {
    emit(slide.words, "slide");
  }

  visitObjects(slide, (object) => {
    if (object.type === "vocab") emit(object.words, "vocab");
  });
}

function emptyDecorationPlan() {
  return { low: [], high: [] };
}

function hasDecorationPlans(plans) {
  return (plans || []).some(
    (plan) =>
      plan &&
      ((Array.isArray(plan.low) && plan.low.length > 0) ||
        (Array.isArray(plan.high) && plan.high.length > 0))
  );
}

async function prepareSlideDecorationPlans(slides, lessonDir) {
  const plans = [];

  for (let index = 0; index < slides.length; index += 1) {
    const slideData = slides[index] || {};
    const checked = inspectDecorations(slideData.decorations, {
      surface: "slide",
      supported: !isVocabularySurface(slideData),
      baseDir: lessonDir,
      label: `slide ${index + 1}`,
    });
    checked.warnings.forEach((message) => warn(index, message));

    const plan = emptyDecorationPlan();
    for (const decoration of checked.decorations) {
      if (!decoration.imagePath) {
        warn(
          index,
          `OPTIONAL_DECORATION_OMITTED: decoration "${decoration.id}" is unresolved; the slide continues without it.`
        );
        continue;
      }

      const absolute = confinedEducationalSvgPngPath(lessonDir, decoration);
      if (!absolute || !fs.existsSync(absolute)) {
        warn(
          index,
          `OPTIONAL_DECORATION_OMITTED: decoration "${decoration.id}" has no readable local PNG at "${decoration.imagePath}".`
        );
        continue;
      }

      const info = readPngInfo(absolute);
      if (!info) {
        warn(
          index,
          `OPTIONAL_DECORATION_OMITTED: decoration "${decoration.id}" is not a readable PNG.`
        );
        continue;
      }

      const fitted = fitContainedDecoration(
        decoration,
        SLIDE_W,
        SLIDE_H,
        info.width,
        info.height
      );
      if (
        !fitted ||
        !rotatedRectIntersectsRect(fitted, {
          x: 0,
          y: 0,
          width: SLIDE_W,
          height: SLIDE_H,
        })
      ) {
        warn(
          index,
          `OPTIONAL_DECORATION_OMITTED: decoration "${decoration.id}" is completely outside the physical slide after contain-fit and rotation.`
        );
        continue;
      }

      plan[decoration.layer].push({
        ...fitted,
        id: decoration.id,
        path: absolute,
      });
    }

    plans.push(plan);
  }

  return plans;
}

function drawDecorationLayer(slide, plan, layer, slideIndex) {
  for (const decoration of (plan && plan[layer]) || []) {
    try {
      slide.addImage({
        path: decoration.path,
        x: decoration.x,
        y: decoration.y,
        w: decoration.width,
        h: decoration.height,
        rotate: decoration.rotation,
        transparency: decoration.transparency,
        altText: "",
        objectName: `Decoration/${decoration.id}`,
      });
    } catch (error) {
      warn(
        slideIndex,
        `OPTIONAL_DECORATION_OMITTED: decoration "${decoration.id}" could not be drawn (${error.message}).`
      );
    }
  }
}

function rebuildWithoutOptionalDecorations(jsonPath, outputDir, options = {}) {
  const spawn = options.spawnSync || spawnSync;
  const scriptPath =
    options.scriptPath || path.join(__dirname, "..", "build.js");
  return spawn(
    process.execPath,
    [scriptPath, jsonPath, outputDir, "--skip-optional-decorations"],
    {
      stdio: options.stdio || "inherit",
      env: options.env || process.env,
    }
  );
}

module.exports = {
  isVocabularySurface,
  forEachVocabularyEntry,
  emptyDecorationPlan,
  hasDecorationPlans,
  prepareSlideDecorationPlans,
  drawDecorationLayer,
  rebuildWithoutOptionalDecorations,
};
